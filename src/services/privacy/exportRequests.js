// KOLAKISA CMS → Outils → Exporter les données personnelles : cycle de vie des demandes (par site) au-dessus du moteur d'export partagé.
//   en attente de confirmation → confirmée → export en cours → export prêt → envoyée   (+ expirée, échec, aucune donnée)
// Règles : le site vient toujours de l'appelant (adresse vérifiée par le serveur) et borne CHAQUE requête ; les jetons ne sont jamais conservés (empreinte SHA-256) ;
// l'e-mail part uniquement à l'adresse vérifiée de la demande ; l'archive est rangée hors du dossier public sous un nom imprévisible ; le statut reflète le résultat réel.
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { UserError } = require("../../utils/errors");
const engine = require("./exportEngine/build");
const zip = require("./exportEngine/zip");

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const USERNAME = /^[\p{L}\p{N}][\p{L}\p{N}._ -]{1,59}$/u;
const FILE_RE = /^[a-f0-9]{48}\.zip$/;
const STATUSES = ["pending_confirmation", "confirmed", "running", "ready", "sent", "expired", "failed", "no_data"];
const STATUS_LABELS = { pending_confirmation: "En attente de confirmation", confirmed: "Confirmée", running: "Export en cours", ready: "Export prêt", sent: "Envoyée", expired: "Expirée", failed: "Échec", no_data: "Aucune donnée" };
const TERMINAL = new Set(["sent", "expired", "failed", "no_data"]);
const OPEN = ["pending_confirmation", "confirmed", "running", "ready"];
const MAX_DOWNLOADS = 10;
const STUCK_MINUTES = 15;
const DEFAULTS = { confirm_hours: [48, 1, 720], link_hours: [72, 1, 720], archive_days: [7, 1, 90], keep_days: [180, 30, 1095] };
const SETTING_LABELS = { confirm_hours: "Validité du lien de confirmation (heures)", link_hours: "Validité du lien de téléchargement (heures)", archive_days: "Conservation de l'archive (jours)", keep_days: "Conservation des demandes terminées (jours)" };

const ts = (d) => d.toISOString().slice(0, 19).replace("T", " ");
const parseTs = (v) => (v ? new Date(`${String(v).replace(" ", "T")}Z`) : null);
const hash = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
const newToken = () => crypto.randomBytes(32).toString("base64url");
const scopeKey = (siteId) => (siteId === null ? "main" : String(siteId));
const hours = (n) => n * 3600 * 1000;
const fr = (d) => d.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

function privateRoot() { return path.join(require("../../config/paths").dataDir, "private-exports"); }
function archivePath(row) {
  if (!row.archive_file || !FILE_RE.test(row.archive_file)) return null;
  const dir = path.join(privateRoot(), row.site_id === null ? "main" : `site-${Number(row.site_id)}`);
  return { dir, file: path.join(dir, row.archive_file) };
}

// ---------- Réglages (durées configurables, par site) ----------
function settingsOf(db, organizationId, siteId) {
  const out = {};
  for (const [name, [def, min, max]] of Object.entries(DEFAULTS)) {
    const row = db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(organizationId, `privacy_export.${scopeKey(siteId)}.${name}`);
    const n = Number(row && row.value);
    out[name] = Number.isInteger(n) && n >= min && n <= max ? n : def;
  }
  return out;
}
function saveSettings(db, organizationId, siteId, input) {
  const next = {};
  for (const [name, [, min, max]] of Object.entries(DEFAULTS)) {
    const n = Number(String(input[name] ?? "").trim());
    if (!Number.isInteger(n) || n < min || n > max) throw new UserError(`${SETTING_LABELS[name]} : un nombre entier entre ${min} et ${max}.`);
    next[name] = n;
  }
  const put = db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')");
  for (const [name, n] of Object.entries(next)) put.run(organizationId, `privacy_export.${scopeKey(siteId)}.${name}`, String(n));
  return next;
}

// ---------- Contexte du site ----------
function siteOf(db, organizationId, siteId) {
  if (siteId === null) return { name: (db.prepare("SELECT name FROM mk_organizations WHERE id = ?").get(organizationId) || {}).name || "KOLAKISA", active: true };
  const row = db.prepare("SELECT name, status FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, organizationId);
  return row ? { name: row.name, active: row.status === "active" } : null;
}
const baseUrl = () => String(process.env.SITE_URL || "http://localhost:3002").replace(/\/+$/, "");
function contactAddress(db, organizationId) { try { return require("../settings").main().adminEmail || ""; } catch { return ""; } }

// ---------- Lecture ----------
function load(ctx, id) {
  if (!/^\d{1,12}$/.test(String(id))) return null;
  const row = ctx.db.prepare("SELECT * FROM cms_privacy_requests WHERE id = ? AND organization_id = ? AND site_id IS ?").get(Number(id), ctx.organizationId, ctx.siteId);
  return row || null;
}
const need = (ctx, id) => { const row = load(ctx, id); if (!row) throw new UserError("Demande introuvable.", 404); return row; };
const guard = (ctx) => {
  if (!ctx.can("tools.export")) throw new UserError("Vous n'avez pas la permission d'effectuer cette action.", 403);
  const site = siteOf(ctx.db, ctx.organizationId, ctx.siteId);
  if (!site) throw new UserError("Site introuvable.", 404);
  return site;
};
const guardWrite = (ctx) => { const site = guard(ctx); if (!site.active) throw new UserError("Ce site est archivé : les demandes sont en lecture seule.", 409); return site; };
const update = (db, id, patch) => {
  const keys = Object.keys(patch);
  db.prepare(`UPDATE cms_privacy_requests SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...keys.map((k) => patch[k]), id);
};

// ---------- État réel des e-mails (relu de la file d'envoi) ----------
function mailState(db, mailId) {
  if (!mailId) return null;
  let row; try { row = db.prepare("SELECT status, last_error, sent_at FROM mail_outbox WHERE id = ?").get(mailId); } catch { row = null; }
  if (!row) return { state: "unknown", label: "État inconnu" };
  if (row.status === "sent") return { state: "sent", label: "E-mail envoyé", at: row.sent_at };
  if (row.status === "pending" || row.status === "sending") return { state: "pending", label: "E-mail en cours d'envoi" };
  return { state: "failed", label: `E-mail non envoyé${row.last_error ? ` : ${row.last_error}` : ""}` };
}
// Fait correspondre le statut au résultat réel : « Envoyée » seulement quand le service d'e-mail a réellement envoyé le lien
function syncDelivery(db, row) {
  if (row.status !== "ready" || !row.delivery_mail_id) return row;
  const m = mailState(db, row.delivery_mail_id);
  if (m && m.state === "sent") { update(db, row.id, { status: "sent", delivered_at: ts(new Date()), delivery_error: "" }); return { ...row, status: "sent" }; }
  if (m && m.state === "failed" && row.delivery_error !== m.label) { update(db, row.id, { delivery_error: m.label }); return { ...row, delivery_error: m.label }; }
  return row;
}

// ---------- Création ----------
function resolveSubject(db, raw) {
  const input = String(raw ?? "").trim();
  if (!input) throw new UserError("Saisissez un identifiant ou une adresse e-mail.");
  if (input.length > 254) throw new UserError("Cette saisie est trop longue.");
  if (input.includes("@")) {
    const email = input.toLowerCase();
    if (!EMAIL.test(email)) throw new UserError("Cette adresse e-mail n'est pas valide.");
    const user = db.prepare("SELECT id FROM users WHERE lower(email) = ? AND deleted_at IS NULL").get(email);
    return { email, userId: user ? user.id : null, inputKind: "email" };
  }
  if (!USERNAME.test(input)) throw new UserError("Cet identifiant n'est pas valide (lettres, chiffres, points, tirets, 2 à 60 caractères).");
  const user = db.prepare("SELECT id, email FROM users WHERE lower(username) = lower(?) AND deleted_at IS NULL").get(input);
  if (!user || !EMAIL.test(String(user.email))) throw new UserError("Aucun compte ne correspond à cet identifiant.");
  return { email: String(user.email).toLowerCase(), userId: user.id, inputKind: "username" };
}

function queueConfirmation(ctx, row, site, token, expires) {
  const link = `${baseUrl()}/donnees-personnelles/confirmer/${token}`;
  const text = [
    "Bonjour,", "",
    `Une demande d'export des données personnelles associées à cette adresse e-mail a été enregistrée sur « ${site.name} ».`, "",
    `Pour la confirmer, ouvrez ce lien (valable jusqu'au ${fr(expires)}) :`, link, "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : rien ne sera exporté.",
  ].join("\n");
  const sent = require("../../utils/outbox").queueMail(ctx.db, { kind: "privacy_confirm", to: row.subject_email, subject: `[${site.name}] Confirmez votre demande d'export de données personnelles`, text, sensitive: true });
  return sent.queued ? { mailId: sent.id, error: "" } : { mailId: null, error: "L'e-mail de confirmation n'a pas pu être mis en file d'envoi (adresse refusée)." };
}

function create(ctx, { input, sendEmail = true, confirmAdmin = false, now = new Date() }) {
  const site = guardWrite(ctx);
  const subject = resolveSubject(ctx.db, input);
  const open = ctx.db.prepare(`SELECT id FROM cms_privacy_requests WHERE organization_id = ? AND site_id IS ? AND subject_email = ? AND status IN (${OPEN.map(() => "?").join(",")})`).get(ctx.organizationId, ctx.siteId, subject.email, ...OPEN);
  if (open) throw new UserError("Une demande est déjà en cours pour cette personne sur ce site. Terminez-la ou attendez son expiration.", 409);
  const cfg = settingsOf(ctx.db, ctx.organizationId, ctx.siteId);
  const base = { organization_id: ctx.organizationId, site_id: ctx.siteId, subject_email: subject.email, subject_user_id: subject.userId, input_kind: subject.inputKind, requested_by: ctx.userId || null };
  if (!sendEmail) {
    // Demande directe : jamais silencieuse — droit d'exporter ET confirmation explicite de l'administrateur
    if (confirmAdmin !== true) throw new UserError("Sans e-mail de confirmation, confirmez explicitement que vous avez vérifié l'identité de la personne.");
    const id = Number(ctx.db.prepare("INSERT INTO cms_privacy_requests (organization_id, site_id, subject_email, subject_user_id, input_kind, requested_by, status, confirm_mode, confirmed_at, confirmed_by) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'admin', ?, ?)")
      .run(base.organization_id, base.site_id, base.subject_email, base.subject_user_id, base.input_kind, base.requested_by, ts(now), ctx.userId || null).lastInsertRowid);
    return { id, mode: "admin", emailError: "" };
  }
  const token = newToken();
  const expires = new Date(now.getTime() + hours(cfg.confirm_hours));
  const id = Number(ctx.db.prepare("INSERT INTO cms_privacy_requests (organization_id, site_id, subject_email, subject_user_id, input_kind, requested_by, status, confirm_mode, confirm_token_hash, confirm_expires_at) VALUES (?, ?, ?, ?, ?, ?, 'pending_confirmation', 'email', ?, ?)")
    .run(base.organization_id, base.site_id, base.subject_email, base.subject_user_id, base.input_kind, base.requested_by, hash(token), ts(expires)).lastInsertRowid);
  const mail = queueConfirmation(ctx, { subject_email: subject.email }, site, token, expires);
  update(ctx.db, id, { confirm_mail_id: mail.mailId, error: mail.error });
  return { id, mode: "email", emailError: mail.error };
}

// ---------- Confirmation par le lien (route publique : aucune session) ----------
// Le jeton est la seule clé : il retrouve la demande ET son site. Réponse volontairement générique si le lien est inconnu, utilisé ou expiré.
function peekConfirmation(db, token, { now = new Date() } = {}) {
  if (!/^[A-Za-z0-9_-]{30,80}$/.test(String(token))) return null;
  const row = db.prepare("SELECT * FROM cms_privacy_requests WHERE confirm_token_hash = ? AND status = 'pending_confirmation'").get(hash(token));
  if (!row) return null;
  if (parseTs(row.confirm_expires_at) <= now) { update(db, row.id, { status: "expired", confirm_token_hash: null }); return null; }
  const site = siteOf(db, row.organization_id, row.site_id);
  return site ? { row, siteName: site.name } : null;
}
function confirmByToken(db, token, { now = new Date() } = {}) {
  const found = peekConfirmation(db, token, { now });
  if (!found) return { ok: false };
  // Usage unique : la ligne n'est confirmée que si le jeton est encore là (deux clics simultanés ne confirment qu'une fois)
  const done = db.prepare("UPDATE cms_privacy_requests SET status = 'confirmed', confirmed_at = ?, confirm_token_hash = NULL, updated_at = datetime('now') WHERE id = ? AND status = 'pending_confirmation' AND confirm_token_hash = ?").run(ts(now), found.row.id, hash(token));
  return done.changes === 1 ? { ok: true, siteName: found.siteName, requestId: found.row.id } : { ok: false };
}

// ---------- Génération de l'archive ----------
function generate(ctx, id, { now = new Date(), collectors } = {}) {
  const site = guardWrite(ctx);
  const row = need(ctx, id);
  if (!["confirmed", "failed"].includes(row.status) || !row.confirmed_at) throw new UserError("Cette demande n'est pas confirmée : l'export ne peut pas être préparé.", 409);
  // Réservation atomique : une demande ne se génère jamais deux fois en même temps
  if (ctx.db.prepare("UPDATE cms_privacy_requests SET status = 'running', error = '', updated_at = datetime('now') WHERE id = ? AND status IN ('confirmed','failed')").run(row.id).changes !== 1) throw new UserError("Cet export est déjà en cours de préparation.", 409);
  const cfg = settingsOf(ctx.db, ctx.organizationId, ctx.siteId);
  let written = null;
  try {
    removeArchive(row); // un nouvel essai ne laisse jamais l'ancienne archive derrière lui
    const collected = engine.collect({ db: ctx.db, organizationId: ctx.organizationId, siteId: ctx.siteId, subject: { email: row.subject_email, userId: row.subject_user_id }, can: ctx.can, orgLevel: ctx.orgLevel }, collectors ? { collectors } : undefined);
    const report = JSON.stringify(engine.reportOf(collected));
    let built;
    try { built = engine.buildArchive(collected, { siteName: site.name, email: row.subject_email, now }); } catch (error) {
      if (error.code === "NO_DATA") { update(ctx.db, row.id, { status: "no_data", report, archive_file: null, archive_sha256: null, archive_bytes: null, error: error.message }); return { status: "no_data", report: JSON.parse(report) }; }
      throw error;
    }
    const name = `${crypto.randomBytes(24).toString("hex")}.zip`;
    const where = archivePath({ ...row, archive_file: name });
    fs.mkdirSync(where.dir, { recursive: true, mode: 0o700 });
    const tmp = `${where.file}.tmp`;
    written = tmp;
    fs.writeFileSync(tmp, built.buffer, { mode: 0o600 });
    // Relecture du fichier ÉCRIT (disque plein, écriture tronquée…) avant de le déclarer valide
    const back = fs.readFileSync(tmp);
    if (crypto.createHash("sha256").update(back).digest("hex") !== built.sha256) throw new Error("L'archive écrite ne correspond pas à l'archive générée.");
    zip.read(back);
    fs.renameSync(tmp, where.file); written = where.file;
    update(ctx.db, row.id, { status: "ready", archive_file: name, archive_sha256: built.sha256, archive_bytes: built.bytes, generated_at: ts(now), archive_expires_at: ts(new Date(now.getTime() + cfg.archive_days * 86400000)), report, error: "", download_token_hash: null, download_expires_at: null, download_count: 0, delivery_mail_id: null, delivered_at: null, delivery_error: "" });
    return { status: "ready", report: JSON.parse(report) };
  } catch (error) {
    if (written) { try { fs.rmSync(written, { force: true }); } catch { /* déjà absent */ } }
    update(ctx.db, row.id, { status: "failed", error: String(error.message || error).replace(/[\u0000-\u001f]+/g, " ").slice(0, 250), archive_file: null, archive_sha256: null, archive_bytes: null });
    return { status: "failed", error: String(error.message || error).slice(0, 250) };
  }
}
function removeArchive(row) {
  const p = archivePath(row);
  if (p) { try { fs.rmSync(p.file, { force: true }); fs.rmSync(`${p.file}.tmp`, { force: true }); } catch { /* déjà absent */ } }
}

// ---------- Fichier (téléchargement administrateur ou par jeton) ----------
// Relit et contrôle le fichier : existence, dossier du bon site, taille et empreinte identiques à celles enregistrées
function readArchive(row) {
  const p = archivePath(row);
  if (!p) return null;
  try {
    if (!path.resolve(p.file).startsWith(path.resolve(privateRoot()) + path.sep)) return null;
    const data = fs.readFileSync(p.file);
    if (data.length !== row.archive_bytes || crypto.createHash("sha256").update(data).digest("hex") !== row.archive_sha256) return null;
    return data;
  } catch { return null; }
}
const downloadable = (row, now) => ["ready", "sent"].includes(row.status) && row.archive_file && parseTs(row.archive_expires_at) > now;
const fileName = (row) => `donnees-personnelles-${row.id}.zip`;

function adminDownload(ctx, id, { now = new Date() } = {}) {
  guard(ctx);
  const row = need(ctx, id);
  if (!downloadable(row, now)) throw new UserError("Cette archive n'est plus disponible (expirée ou non générée).", 410);
  const data = readArchive(row);
  if (!data) throw new UserError("Le fichier de l'archive est introuvable ou altéré : relancez l'export.", 410);
  return { data, name: fileName(row), row };
}

// Lien de téléchargement remis à la personne : aucun cookie, jeton seul ; la demande (et donc le site) est retrouvée par son empreinte
function peekDownload(db, token, { now = new Date() } = {}) {
  if (!/^[A-Za-z0-9_-]{30,80}$/.test(String(token))) return null;
  const row = db.prepare("SELECT * FROM cms_privacy_requests WHERE download_token_hash = ?").get(hash(token));
  if (!row || !downloadable(row, now) || !row.download_expires_at || parseTs(row.download_expires_at) <= now || row.download_count >= MAX_DOWNLOADS) return null;
  const site = siteOf(db, row.organization_id, row.site_id);
  return site ? { row, siteName: site.name } : null;
}
function downloadByToken(db, token, { now = new Date() } = {}) {
  const found = peekDownload(db, token, { now });
  if (!found) return { ok: false };
  const data = readArchive(found.row);
  if (!data) return { ok: false };
  db.prepare("UPDATE cms_privacy_requests SET download_count = download_count + 1, updated_at = datetime('now') WHERE id = ?").run(found.row.id);
  return { ok: true, data, name: fileName(found.row), requestId: found.row.id, siteId: found.row.site_id };
}

// ---------- Envoi du lien à la personne ----------
function sendLink(ctx, id, { now = new Date() } = {}) {
  const site = guardWrite(ctx);
  const row = need(ctx, id);
  if (!downloadable(row, now)) throw new UserError("Aucune archive valide à envoyer : générez d'abord l'export.", 409);
  if (!readArchive(row)) throw new UserError("Le fichier de l'archive est introuvable ou altéré : relancez l'export.", 410);
  const cfg = settingsOf(ctx.db, ctx.organizationId, ctx.siteId);
  const archiveEnd = parseTs(row.archive_expires_at);
  const linkEnd = new Date(Math.min(now.getTime() + hours(cfg.link_hours), archiveEnd.getTime()));
  const token = newToken();
  const link = `${baseUrl()}/donnees-personnelles/telecharger/${token}`;
  const contact = contactAddress(ctx.db, ctx.organizationId);
  const text = [
    "Bonjour,", "",
    `Votre export de données personnelles est disponible sur « ${site.name} ».`, "",
    `Téléchargez-le avec ce lien personnel (valable jusqu'au ${fr(linkEnd)}) :`, link, "",
    "Le fichier est une archive ZIP : ouvrez « donnees-personnelles.html » dans votre navigateur pour lire vos données.", "",
    `Si le lien ne fonctionne pas ou si vous n'êtes pas à l'origine de cette demande, ${contact ? `écrivez à ${contact}` : "répondez à ce message ou contactez le site"} en précisant ce qui se passe.`,
  ].join("\n");
  const sent = require("../../utils/outbox").queueMail(ctx.db, { kind: "privacy_delivery", to: row.subject_email, subject: `[${site.name}] Votre export de données personnelles est disponible`, text, sensitive: true, replyTo: contact });
  if (!sent.queued) throw new UserError("L'e-mail n'a pas pu être mis en file d'envoi (adresse refusée). L'archive est conservée : vous pouvez réessayer.", 422);
  // Nouveau lien = ancien lien invalidé ; l'archive n'est pas régénérée
  update(ctx.db, row.id, { download_token_hash: hash(token), download_expires_at: ts(linkEnd), download_count: 0, delivery_mail_id: sent.id, delivery_error: "", status: "ready" });
  return { mailId: sent.id, linkExpiresAt: linkEnd };
}

function resendConfirmation(ctx, id, { now = new Date() } = {}) {
  const site = guardWrite(ctx);
  const row = need(ctx, id);
  if (row.status !== "pending_confirmation" || row.confirm_mode !== "email") throw new UserError("Cette demande n'attend pas de confirmation par e-mail.", 409);
  const cfg = settingsOf(ctx.db, ctx.organizationId, ctx.siteId);
  const token = newToken();
  const expires = new Date(now.getTime() + hours(cfg.confirm_hours));
  const mail = queueConfirmation(ctx, row, site, token, expires);
  update(ctx.db, row.id, { confirm_token_hash: hash(token), confirm_expires_at: ts(expires), confirm_mail_id: mail.mailId, error: mail.error });
  if (mail.error) throw new UserError(mail.error, 422);
  return { expiresAt: expires };
}

// Relance d'une demande expirée (ou en échec sans possibilité de réessai) : retour à la confirmation, sans réutiliser l'ancien jeton
function restart(ctx, id, { confirmAdmin = false, now = new Date() } = {}) {
  const site = guardWrite(ctx);
  const row = need(ctx, id);
  if (!["expired", "failed", "no_data"].includes(row.status)) throw new UserError("Seule une demande expirée, en échec ou sans donnée peut être relancée.", 409);
  const open = ctx.db.prepare(`SELECT id FROM cms_privacy_requests WHERE organization_id = ? AND site_id IS ? AND subject_email = ? AND status IN (${OPEN.map(() => "?").join(",")}) AND id <> ?`).get(ctx.organizationId, ctx.siteId, row.subject_email, ...OPEN, row.id);
  if (open) throw new UserError("Une autre demande est déjà en cours pour cette personne.", 409);
  removeArchive(row);
  const clear = { archive_file: null, archive_sha256: null, archive_bytes: null, archive_expires_at: null, generated_at: null, download_token_hash: null, download_expires_at: null, download_count: 0, delivery_mail_id: null, delivered_at: null, delivery_error: "", report: "{}", error: "", confirm_token_hash: null };
  if (row.confirm_mode === "admin") {
    if (confirmAdmin !== true) throw new UserError("Confirmez explicitement que vous avez vérifié l'identité de la personne.");
    update(ctx.db, row.id, { ...clear, status: "confirmed", confirmed_at: ts(now), confirmed_by: ctx.userId || null });
    return { mode: "admin" };
  }
  const cfg = settingsOf(ctx.db, ctx.organizationId, ctx.siteId);
  const token = newToken();
  const expires = new Date(now.getTime() + hours(cfg.confirm_hours));
  const mail = queueConfirmation(ctx, row, site, token, expires);
  update(ctx.db, row.id, { ...clear, status: "pending_confirmation", confirmed_at: null, confirm_token_hash: hash(token), confirm_expires_at: ts(expires), confirm_mail_id: mail.mailId, error: mail.error });
  return { mode: "email", emailError: mail.error };
}

// Suppression d'une demande TERMINÉE (et de son archive) : jamais des données sources
function remove(ctx, id) {
  guard(ctx);
  const row = need(ctx, id);
  if (!TERMINAL.has(row.status)) throw new UserError("Seule une demande terminée (envoyée, expirée, en échec ou sans donnée) peut être supprimée.", 409);
  removeArchive(row);
  ctx.db.prepare("DELETE FROM cms_privacy_requests WHERE id = ? AND organization_id = ? AND site_id IS ?").run(row.id, ctx.organizationId, ctx.siteId);
}

// ---------- Étapes suivantes réellement possibles pour l'état courant ----------
function nextSteps(row, ctx, now = new Date()) {
  const steps = [];
  const live = downloadable(row, now);
  const canWrite = ctx.can("tools.export");
  if (!canWrite) return steps;
  if (row.status === "pending_confirmation" && row.confirm_mode === "email") steps.push("resend");
  if (row.status === "confirmed" || (row.status === "failed" && row.confirmed_at)) steps.push(row.status === "failed" ? "retry" : "generate");
  if (live) steps.push("download", "send");
  if (["expired", "failed", "no_data"].includes(row.status)) steps.push("restart");
  if (TERMINAL.has(row.status)) steps.push("delete");
  return steps;
}

// ---------- Liste ----------
const SORTS = { origin: "subject_email", sent: "id" };
function list(ctx, { status = "", sort = "sent", dir = "desc", page = 1, perPage = 20 } = {}, { now = new Date() } = {}) {
  guard(ctx);
  purge(ctx.db, { now });
  for (const r of ctx.db.prepare("SELECT * FROM cms_privacy_requests WHERE organization_id = ? AND site_id IS ? AND status = 'ready' AND delivery_mail_id IS NOT NULL").all(ctx.organizationId, ctx.siteId)) syncDelivery(ctx.db, r);
  const where = "organization_id = ? AND site_id IS ?";
  const params = [ctx.organizationId, ctx.siteId];
  const counts = Object.fromEntries(ctx.db.prepare(`SELECT status, COUNT(*) n FROM cms_privacy_requests WHERE ${where} GROUP BY status`).all(...params).map((r) => [r.status, r.n]));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const filtered = STATUSES.includes(status) ? status : "";
  const order = `${SORTS[sort] || SORTS.sent} ${dir === "asc" ? "ASC" : "DESC"}, id DESC`;
  const size = Math.min(100, Math.max(5, Number(perPage) || 20));
  const count = filtered ? counts[filtered] || 0 : total;
  const pages = Math.max(1, Math.ceil(count / size));
  const current = Math.min(pages, Math.max(1, Number(page) || 1));
  const rows = ctx.db.prepare(`SELECT * FROM cms_privacy_requests WHERE ${where}${filtered ? " AND status = ?" : ""} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...params, ...(filtered ? [filtered] : []), size, (current - 1) * size)
    .map((r) => present(ctx, r, now));
  return { rows, counts, total, filter: filtered, page: current, pages, perPage: size, sort: SORTS[sort] ? sort : "sent", dir: dir === "asc" ? "asc" : "desc" };
}

function present(ctx, row, now = new Date()) {
  const r = syncDelivery(ctx.db, row);
  const live = downloadable(r, now);
  let report = {}; try { report = JSON.parse(r.report || "{}"); } catch { report = {}; }
  return {
    id: r.id, email: r.subject_email, inputKind: r.input_kind, status: r.status, statusLabel: STATUS_LABELS[r.status], createdAt: r.created_at, confirmMode: r.confirm_mode, confirmedAt: r.confirmed_at,
    confirmExpiresAt: r.confirm_expires_at, generatedAt: r.generated_at, archiveExpiresAt: live ? r.archive_expires_at : null, archiveBytes: live ? r.archive_bytes : null, linkExpiresAt: r.download_expires_at, downloads: r.download_count,
    confirmMail: mailState(ctx.db, r.confirm_mail_id), deliveryMail: mailState(ctx.db, r.delivery_mail_id), deliveryError: r.delivery_error, error: r.error, report, steps: nextSteps(r, ctx, now),
  };
}
function detail(ctx, id, opts = {}) { guard(ctx); return present(ctx, need(ctx, id), opts.now || new Date()); }

// ---------- Actions groupées : chaque demande est contrôlée individuellement ----------
const BULK = { resend: resendConfirmation, generate, send: sendLink, remove };
function bulk(ctx, action, ids) {
  guard(ctx); // aucun droit ou site inconnu : refus d'emblée ; ensuite chaque demande est contrôlée une par une
  const fn = BULK[action];
  if (!fn) throw new UserError("Action groupée inconnue.");
  const unique = [...new Set([].concat(ids || []).map(String))].filter((v) => /^\d{1,12}$/.test(v)).slice(0, 100);
  if (!unique.length) throw new UserError("Sélectionnez au moins une demande.");
  const done = []; const failed = [];
  for (const id of unique) {
    try {
      const row = need(ctx, id);
      if (!ACTION_STEP[action](row, ctx)) throw new UserError("L'état actuel de la demande ne permet pas cette action.", 409);
      const out = fn(ctx, id);
      if (action === "generate" && out && out.status !== "ready") throw new UserError(out.status === "no_data" ? "Aucune donnée trouvée pour cette personne." : `Échec : ${out.error || "export impossible"}`);
      done.push(Number(id));
    } catch (error) {
      if (!(error instanceof UserError)) throw error;
      failed.push({ id: Number(id), reason: error.message });
    }
  }
  return { done, failed };
}
const ACTION_STEP = {
  resend: (row, ctx) => nextSteps(row, ctx).includes("resend"),
  generate: (row, ctx) => nextSteps(row, ctx).some((s) => s === "generate" || s === "retry"),
  send: (row, ctx) => nextSteps(row, ctx).includes("send"),
  remove: (row, ctx) => nextSteps(row, ctx).includes("delete"),
};

// ---------- Entretien : expiration, nettoyage, conservation ----------
function purge(db, { now = new Date() } = {}) {
  const out = { confirmExpired: 0, archivesRemoved: 0, stuck: 0, deleted: 0, orphans: 0 };
  const nowText = ts(now);
  out.confirmExpired = db.prepare("UPDATE cms_privacy_requests SET status = 'expired', confirm_token_hash = NULL, updated_at = datetime('now') WHERE status = 'pending_confirmation' AND confirm_expires_at <= ?").run(nowText).changes;
  for (const row of db.prepare("SELECT * FROM cms_privacy_requests WHERE status IN ('ready','sent') AND archive_expires_at <= ?").all(nowText)) {
    removeArchive(row);
    update(db, row.id, { status: "expired", archive_file: null, archive_sha256: null, archive_bytes: null, download_token_hash: null, download_expires_at: null });
    out.archivesRemoved++;
  }
  out.stuck = db.prepare("UPDATE cms_privacy_requests SET status = 'failed', error = 'La préparation a été interrompue : relancez l''export.', updated_at = datetime('now') WHERE status = 'running' AND updated_at <= ?").run(ts(new Date(now.getTime() - STUCK_MINUTES * 60000))).changes;
  // Conservation : demandes terminées supprimées après la durée choisie pour leur site
  for (const row of db.prepare("SELECT id, organization_id, site_id, updated_at FROM cms_privacy_requests WHERE status IN ('sent','expired','failed','no_data')").all()) {
    const cfg = settingsOf(db, row.organization_id, row.site_id);
    if (parseTs(row.updated_at) <= new Date(now.getTime() - cfg.keep_days * 86400000)) { db.prepare("DELETE FROM cms_privacy_requests WHERE id = ?").run(row.id); out.deleted++; }
  }
  out.orphans = sweepOrphans(db, now);
  return out;
}
// Fichiers du dossier privé qu'aucune demande ne référence (échec en cours d'écriture, demande supprimée) : effacés après une heure
function sweepOrphans(db, now) {
  let removed = 0;
  const root = privateRoot();
  let dirs = [];
  try { dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return 0; }
  const known = new Set(db.prepare("SELECT archive_file FROM cms_privacy_requests WHERE archive_file IS NOT NULL").all().map((r) => r.archive_file));
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(root, d.name))) {
      const full = path.join(root, d.name, f);
      try {
        if (known.has(f)) continue;
        if (now.getTime() - fs.statSync(full).mtimeMs < 3600 * 1000) continue;
        fs.rmSync(full, { force: true }); removed++;
      } catch { /* fichier déjà parti */ }
    }
  }
  return removed;
}

function startTimer(db, { log = console } = {}) {
  const tick = () => { try { const r = purge(db); if (r.archivesRemoved || r.deleted || r.orphans) log.log?.(`[KOLAKISA] Export de données : ${r.archivesRemoved} archive(s) expirée(s), ${r.deleted} demande(s) supprimée(s), ${r.orphans} fichier(s) orphelin(s) nettoyé(s).`); } catch (error) { log.error?.("[KOLAKISA] Entretien des exports de données :", error.message); } };
  tick();
  return setInterval(tick, 15 * 60 * 1000).unref();
}

module.exports = {
  STATUSES, STATUS_LABELS, TERMINAL, SETTING_LABELS, DEFAULTS, MAX_DOWNLOADS,
  settingsOf, saveSettings, create, list, detail, generate, adminDownload, sendLink, resendConfirmation, restart, remove, bulk,
  peekConfirmation, confirmByToken, peekDownload, downloadByToken, purge, startTimer, mailState, resolveSubject, privateRoot,
};
