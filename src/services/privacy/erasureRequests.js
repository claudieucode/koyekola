// KOLAKISA CMS → Outils → Effacer les données : CYCLE DE VIE des demandes (machine à états validée côté serveur, jetons, e-mails, liste, actions).
//
//   en attente ──(lien ouvert et confirmé)──► confirmée ──(traitement réussi)──► terminée
//        │                                        │
//        └─(expirée / e-mail non envoyé)─► échouée ◄─(un traitement échoue)──┘      échouée ──(renvoi)──► en attente · (reprise) ──► confirmée
//
// Rien n'est effacé par la création ni par la confirmation : le traitement (erasure.js) est lancé séparément par une personne autorisée,
// après un récapitulatif et une confirmation explicite. Supprimer une demande de la liste ne supprime JAMAIS de donnée personnelle (et inversement).
const crypto = require("node:crypto");
const erasure = require("./erasure");

const STATUSES = ["pending", "confirmed", "failed", "completed"];
const STATUS_LABEL = { pending: "En attente", confirmed: "Confirmée", failed: "Échouée", completed: "Terminée" };
const FAILURE_LABEL = { expired: "Confirmation expirée", mail_failed: "E-mail non envoyé", erase_failed: "Effacement incomplet" };
const TOKEN_HOURS = 48;
const RETENTION_DAYS = 365;
// Transitions autorisées : toute autre est refusée (jamais appliquée silencieusement)
const TRANSITIONS = Object.freeze({
  pending: ["confirmed", "failed"],
  confirmed: ["completed", "failed"],
  failed: ["pending", "confirmed", "completed"],
  completed: [],
});
const canMove = (from, to) => (TRANSITIONS[from] || []).includes(to);

const userError = (message) => Object.assign(new Error(message), { user: true });
const sql = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");
const key = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa-effacement";
const hashEmail = (email) => crypto.createHmac("sha256", key()).update(`erasure:${email}`).digest("hex");
const hashToken = (secret) => crypto.createHash("sha256").update(secret).digest("hex");
const EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,255}\.[^\s@<>"]{2,}$/;
const maskEmail = (e) => { const [l, d] = String(e).split("@"); return `${l.slice(0, 1)}***@${d}`; };

// ---------- Identification de la personne ----------
// Un identifiant (nom d'utilisateur d'un compte) ou une adresse e-mail. → { kind, email, userId, hash, label }
function resolveSubject(db, raw) {
  const input = String(raw ?? "").trim();
  if (!input) throw userError("Saisissez un identifiant ou une adresse e-mail.");
  if (input.length > 254 || /[\r\n\0]/.test(input)) throw userError("Cette valeur n'est pas valide.");
  if (input.includes("@")) {
    if (!EMAIL.test(input)) throw userError("Cette adresse e-mail n'est pas valide.");
    const email = input.toLowerCase();
    const user = db.prepare("SELECT id FROM users WHERE lower(email) = ? AND deleted_at IS NULL").get(email);
    return { kind: "email", email, userId: user ? user.id : null, hash: hashEmail(email), label: maskEmail(email) };
  }
  const user = db.prepare("SELECT id, email FROM users WHERE lower(username) = lower(?) AND deleted_at IS NULL").get(input);
  if (!user) throw userError("Aucun compte ne correspond à cet identifiant. Saisissez l'adresse e-mail de la personne.");
  const email = String(user.email).toLowerCase();
  return { kind: "username", email, userId: user.id, hash: hashEmail(email), label: maskEmail(email) };
}

// ---------- E-mails : modèles par défaut (français, anglais) ; modifiables par l'organisation ----------
const TEMPLATES = {
  fr: {
    confirm: { subject: "Confirmez la suppression de vos données personnelles sur {site}", body: "Bonjour,\n\nUne demande de suppression des données personnelles associées à cette adresse e-mail a été enregistrée sur {site}.\n\nPour la confirmer, ouvrez ce lien (valable {hours} heures, à usage unique) :\n{link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message : rien ne sera effacé.\n\n{site}" },
    confirmed: { subject: "Votre demande est confirmée — {site}", body: "Bonjour,\n\nNous avons bien confirmé votre demande de suppression de données personnelles sur {site}. Elle sera traitée par l'équipe du site ; vous recevrez un message à la fin du traitement.\n\n{site}" },
    completed: { subject: "Vos données personnelles ont été traitées — {site}", body: "Bonjour,\n\nLe traitement de votre demande d'effacement de données personnelles sur {site} est terminé. Certaines informations peuvent être conservées lorsque la loi l'exige (par exemple les pièces comptables) ; les sauvegardes sont renouvelées périodiquement.\n\n{site}" },
    admin_error: { subject: "Action requise : demande d'effacement incomplète — {site}", body: "Bonjour,\n\nUne demande d'effacement de données personnelles sur {site} n'a pas pu être menée à son terme ({reason}).\n\nOuvrez Outils → Effacer les données pour reprendre ou traiter la demande manuellement : {link}\n\n{site}" },
  },
  en: {
    confirm: { subject: "Confirm the deletion of your personal data on {site}", body: "Hello,\n\nA request to delete the personal data associated with this e-mail address was recorded on {site}.\n\nTo confirm it, open this link (valid for {hours} hours, single use):\n{link}\n\nIf you did not make this request, ignore this message: nothing will be erased.\n\n{site}" },
    confirmed: { subject: "Your request is confirmed — {site}", body: "Hello,\n\nYour request to delete personal data on {site} is confirmed. The site team will process it; you will receive a message when it is done.\n\n{site}" },
    completed: { subject: "Your personal data has been processed — {site}", body: "Hello,\n\nThe processing of your personal data erasure request on {site} is complete. Some information may be kept where the law requires it (for example accounting records); backups are renewed periodically.\n\n{site}" },
    admin_error: { subject: "Action required: incomplete erasure request — {site}", body: "Hello,\n\nA personal data erasure request on {site} could not be completed ({reason}).\n\nOpen Tools → Erase data to resume or handle it manually: {link}\n\n{site}" },
  },
};
const TEMPLATE_KEYS = Object.keys(TEMPLATES.fr);
const TEMPLATE_LABELS = { confirm: "Demande de confirmation (à la personne)", confirmed: "Confirmation de la demande (à la personne)", completed: "Effacement terminé (à la personne)", admin_error: "Erreur ou action requise (à l'administrateur)" };
const VARS = ["{site}", "{link}", "{hours}", "{reason}"];
const localeOf = (v) => (String(v || "fr").toLowerCase().startsWith("en") ? "en" : "fr");

function settingValue(db, orgId, k) { const r = db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(orgId, k); return r ? r.value : null; }
function templateOf(db, orgId, locale, name) {
  const base = TEMPLATES[locale][name];
  return { subject: settingValue(db, orgId, `privacy.erasure_mail.${locale}.${name}.subject`) || base.subject, body: settingValue(db, orgId, `privacy.erasure_mail.${locale}.${name}.body`) || base.body, custom: Boolean(settingValue(db, orgId, `privacy.erasure_mail.${locale}.${name}.body`) || settingValue(db, orgId, `privacy.erasure_mail.${locale}.${name}.subject`)) };
}
function saveTemplate(db, orgId, locale, name, { subject, body }) {
  if (!TEMPLATES[locale] || !TEMPLATES.fr[name]) throw userError("Modèle inconnu.");
  const s = String(subject ?? "").trim(), b = String(body ?? "").replace(/\r\n/g, "\n").trim();
  if (s.length > 200 || b.length > 4000) throw userError("Le modèle est trop long.");
  if (name === "confirm" && b && !b.includes("{link}")) throw userError("Le modèle de confirmation doit contenir {link} : sans lui, la personne ne peut pas confirmer.");
  for (const [suffix, value] of [["subject", s], ["body", b]]) {
    const k = `privacy.erasure_mail.${locale}.${name}.${suffix}`;
    if (!value) db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key = ?").run(orgId, k);
    else db.prepare("INSERT INTO mk_settings (organization_id, key, value) VALUES (?, ?, ?) ON CONFLICT(organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(orgId, k, value);
  }
}
const fill = (text, vars) => String(text).replace(/\{(site|link|hours|reason)\}/g, (_, k) => String(vars[k] ?? ""));
const oneLine = (t) => String(t).replace(/[\r\n]+/g, " ").trim();

function siteContext(ctx, request) {
  const settings = require("../settings");
  let name = "", language = "fr";
  try { const all = settings.readAll(request.site_id ? { siteId: request.site_id } : { main: true }, ctx); name = all.site_name && all.site_name.value; language = all.language && all.language.value; } catch { /* repli ci-dessous */ }
  if (!name) { const row = request.site_id ? ctx.db.prepare("SELECT name FROM mk_sites WHERE id = ?").get(request.site_id) : ctx.db.prepare("SELECT name FROM mk_organizations WHERE id = ?").get(request.organization_id); name = row ? row.name : "KOLAKISA"; }
  return { name, locale: localeOf(language) };
}
// Adresse publique de confirmation : le domaine du site s'il en a un, sinon celui de la plateforme (le jeton est lié à la demande ET à ce site)
function baseUrl(request) {
  const urls = require("../urls");
  const info = request.site_id ? urls.siteInfo(request.site_id) : null;
  return String((info && info.base) || process.env.SITE_URL || "http://localhost:3002").replace(/\/+$/, "");
}
// Site qui doit servir le lien (null = la plateforme) : un site sans domaine propre est servi par la plateforme
const expectedHostSite = (request) => { const info = request.site_id ? require("../urls").siteInfo(request.site_id) : null; return info && info.base ? request.site_id : null; };

function queue(ctx, request, name, to, extra = {}) {
  const { queueMail } = require("../../utils/outbox");
  const site = siteContext(ctx, request);
  const t = templateOf(ctx.db, request.organization_id, site.locale, name);
  const vars = { site: site.name, hours: TOKEN_HOURS, ...extra };
  return queueMail(ctx.db, { kind: `erasure_${name}`.slice(0, 40), to, subject: oneLine(fill(t.subject, vars)), text: fill(t.body, vars), sensitive: name === "confirm" });
}

// ---------- Jetons ----------
function issueToken(ctx, request) {
  const secret = crypto.randomBytes(32).toString("base64url");
  const expires = sql(Date.now() + TOKEN_HOURS * 3600 * 1000);
  const q = queue(ctx, request, "confirm", request.subject_email, { link: `${baseUrl(request)}/effacement/confirmer/${request.id}.${secret}` });
  if (!q.queued) {
    ctx.db.prepare("UPDATE mk_erasure_requests SET status = 'failed', failure_code = 'mail_failed', failure_note = ?, token_hash = NULL WHERE id = ?").run("L'adresse n'a pas été acceptée par la file d'envoi : aucun e-mail n'est parti.", request.id);
    return { ok: false };
  }
  ctx.db.prepare("UPDATE mk_erasure_requests SET status = 'pending', failure_code = NULL, failure_note = '', token_hash = ?, token_expires_at = ?, token_used_at = NULL, mail_id = ?, send_count = send_count + 1, last_sent_at = datetime('now') WHERE id = ?")
    .run(hashToken(secret), expires, q.id, request.id);
  return { ok: true };
}

// ---------- Création ----------
// Une demande ouverte (en attente, confirmée) par personne et par site : la double soumission est refusée
function create(ctx, { siteId = null, identifier, sendEmail = true, actorId = null }) {
  const db = ctx.db;
  const subject = resolveSubject(db, identifier);
  const dup = db.prepare("SELECT id FROM mk_erasure_requests WHERE organization_id = ? AND site_id IS ? AND subject_hash = ? AND status IN ('pending', 'confirmed') LIMIT 1").get(ctx.organizationId, siteId, subject.hash);
  if (dup) throw userError("Une demande est déjà en cours pour cette personne sur ce site. Traitez-la ou supprimez-la de la liste avant d'en ajouter une autre.");
  const info = db.prepare("INSERT INTO mk_erasure_requests (organization_id, site_id, subject_kind, subject_email, subject_user_id, subject_hash, subject_label, send_email, requested_by, status, confirmed_by, confirmed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, siteId, subject.kind, subject.email, subject.userId, subject.hash, subject.label, sendEmail ? 1 : 0, actorId, sendEmail ? "pending" : "confirmed", sendEmail ? null : "admin", sendEmail ? null : sql(Date.now()));
  const request = get(db, ctx.organizationId, Number(info.lastInsertRowid));
  if (sendEmail) issueToken(ctx, request);
  return get(db, ctx.organizationId, request.id);
}

const get = (db, orgId, id) => db.prepare("SELECT * FROM mk_erasure_requests WHERE organization_id = ? AND id = ?").get(orgId, id) || null;

// ---------- Confirmation par le lien (route publique) ----------
// → { state: "ok" | "already" | "expired" | "invalid", request? } ; hostSiteId = site de l'adresse visitée (jamais lu du corps de la requête)
function confirmByToken(db, ctx, rawToken, hostSiteId, { commit = true } = {}) {
  const m = /^(\d{1,12})\.([A-Za-z0-9_-]{20,80})$/.exec(String(rawToken || ""));
  if (!m) return { state: "invalid" };
  const request = db.prepare("SELECT * FROM mk_erasure_requests WHERE id = ?").get(Number(m[1]));
  if (!request || !request.token_hash) return { state: "invalid" };
  // Jeton lié au site : un lien d'un site ne fonctionne pas sur l'adresse d'un autre
  if ((expectedHostSite(request) ?? null) !== (hostSiteId ?? null)) return { state: "invalid" };
  const a = Buffer.from(hashToken(m[2])), b = Buffer.from(request.token_hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { state: "invalid" };
  if (request.token_used_at) return { state: "already" }; // à usage unique : jamais de seconde confirmation
  if (request.status !== "pending") return { state: request.status === "confirmed" || request.status === "completed" ? "already" : "invalid" };
  if (request.token_expires_at < sql(Date.now())) {
    if (commit) db.prepare("UPDATE mk_erasure_requests SET status = 'failed', failure_code = 'expired', failure_note = ?, token_hash = NULL WHERE id = ? AND status = 'pending'").run("Le lien de confirmation a expiré avant d'être utilisé. Relancez la confirmation pour envoyer un nouveau lien.", request.id);
    return { state: "expired" };
  }
  if (!commit) return { state: "ok", request };
  const done = db.prepare("UPDATE mk_erasure_requests SET status = 'confirmed', confirmed_by = 'email', confirmed_at = datetime('now'), token_used_at = datetime('now') WHERE id = ? AND status = 'pending' AND token_used_at IS NULL").run(request.id);
  if (Number(done.changes) !== 1) return { state: "already" };
  const fresh = db.prepare("SELECT * FROM mk_erasure_requests WHERE id = ?").get(request.id);
  queue(ctx || { db, organizationId: fresh.organization_id }, fresh, "confirmed", fresh.subject_email);
  return { state: "ok", request: fresh };
}

// ---------- Actions (une demande à la fois ; chacune valide l'état côté serveur) ----------
const ELIGIBLE = {
  // Renvoyer l'e-mail : en attente (même jeton remplacé par un nouveau) ou échouée à cause de l'e-mail / de l'expiration
  resend: (r) => r.send_email === 1 && (r.status === "pending" || (r.status === "failed" && ["expired", "mail_failed"].includes(r.failure_code))),
  complete: (r) => (r.status === "confirmed" && !r.lock_until) || (r.status === "failed" && r.failure_code === "erase_failed"),
  remove: (r) => r.status === "completed" || r.status === "failed" || (r.status === "pending" && !r.token_used_at),
  execute: (r) => r.status === "confirmed",
  force: (r) => r.status === "pending" || (r.status === "failed" && ["expired", "mail_failed"].includes(r.failure_code)),
  resume: (r) => r.status === "failed" && r.failure_code === "erase_failed",
};
const eligible = (action, r) => Boolean(ELIGIBLE[action] && ELIGIBLE[action](r));

function resend(ctx, request) {
  if (!eligible("resend", request)) throw userError("Cette demande n'accepte pas de nouvel envoi dans son état actuel.");
  if (!request.subject_email) throw userError("L'adresse de la personne n'est plus conservée.");
  return issueToken(ctx, request).ok;
}
// Marquer terminée sans traitement par Kolakisa (cas traité à la main) : la trace le dit clairement
function markComplete(ctx, request, { actor }) {
  if (!eligible("complete", request)) throw userError("Cette demande ne peut pas être marquée comme terminée dans son état actuel.");
  const summary = { manual: true, completedAt: new Date().toISOString(), note: "Marquée comme terminée à la main : Kolakisa n'a pas effacé de donnée pour cette demande.", erased: 0, anonymized: 0, categories: [], retained: [], manual: erasure.EXTERNAL.map((e) => ({ ...e, from: "Hors périmètre" })), notProcessed: [] };
  ctx.db.prepare("UPDATE mk_erasure_requests SET status = 'completed', completed_at = datetime('now'), failure_code = NULL, failure_note = '', summary = ?, subject_email = NULL, token_hash = NULL WHERE id = ?").run(JSON.stringify(summary), request.id);
}
// Suppression de la LISTE seulement : aucune donnée personnelle n'est touchée
function remove(ctx, request) {
  if (!eligible("remove", request)) throw userError("Une demande en cours de traitement ne peut pas être supprimée de la liste.");
  ctx.db.prepare("DELETE FROM mk_erasure_requests WHERE id = ?").run(request.id);
}
// Lancement : confirmé → exécution (récapitulatif et confirmation vérifiés par la route) ; « force » : demande non confirmée par la personne
function arm(ctx, request, { force = false, options = {} }) {
  if (force) {
    if (!eligible("force", request)) throw userError("Le forçage ne s'applique qu'à une demande en attente ou échouée avant confirmation.");
    ctx.db.prepare("UPDATE mk_erasure_requests SET status = 'confirmed', confirmed_by = 'force', confirmed_at = datetime('now'), failure_code = NULL, failure_note = '', token_hash = NULL WHERE id = ?").run(request.id);
  } else if (!eligible("execute", request)) throw userError("Seule une demande confirmée peut être traitée.");
  const clean = { comments: options.comments === "delete" ? "delete" : "anonymize" };
  ctx.db.prepare("UPDATE mk_erasure_requests SET options = ? WHERE id = ?").run(JSON.stringify(clean), request.id);
  return get(ctx.db, request.organization_id, request.id);
}
// Avertit l'administrateur qui a créé la demande (modèle « erreur ou action requise ») ; à la fin d'un traitement échoué
function notifyFailure(ctx, request) {
  const user = request.requested_by ? ctx.db.prepare("SELECT email FROM users WHERE id = ?").get(request.requested_by) : null;
  if (!user) return;
  queue(ctx, request, "admin_error", user.email, { reason: request.failure_note || FAILURE_LABEL[request.failure_code] || "erreur", link: `${String(process.env.SITE_URL || "").replace(/\/+$/, "")}/marketing/site-web/outils/effacer-donnees${request.site_id ? `?site=${request.site_id}` : ""}` });
}
function notifyCompleted(ctx, request) {
  if (request.send_email === 1 && request.subject_email) queue(ctx, request, "completed", request.subject_email);
}

// Un e-mail de confirmation que la file n'a pas pu envoyer (échec définitif, ou aucun serveur configuré) rend la demande « Échouée » : l'administrateur le voit et peut relancer
function syncMail(db, organizationId) {
  const rows = db.prepare("SELECT r.id, m.status, m.last_error FROM mk_erasure_requests r JOIN mail_outbox m ON m.id = r.mail_id WHERE r.organization_id = ? AND r.status = 'pending' AND m.status IN ('failed', 'skipped')").all(organizationId);
  for (const r of rows) {
    const why = r.status === "skipped" ? "aucun serveur d'e-mail n'est configuré" : String(r.last_error || "échec d'envoi").replace(/[\w.+-]+@[\w.-]+/g, "[adresse]").slice(0, 120);
    db.prepare("UPDATE mk_erasure_requests SET status = 'failed', failure_code = 'mail_failed', failure_note = ? WHERE id = ? AND status = 'pending'").run(`L'e-mail de confirmation n'est pas parti : ${why}. Corrigez l'envoi d'e-mails puis relancez la confirmation.`, r.id);
  }
  return rows.length;
}

// ---------- Liste ----------
const SORTS = { origin: "subject_label", status: "status", date: "requested_at" };
function list(ctx, { siteId = null, status = "", sort = "date", dir = "desc", page = 1, perPage = 20 } = {}) {
  syncMail(ctx.db, ctx.organizationId);
  const base = "organization_id = ? AND site_id IS ?";
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of ctx.db.prepare(`SELECT status, COUNT(*) n FROM mk_erasure_requests WHERE ${base} GROUP BY status`).all(ctx.organizationId, siteId)) counts[r.status] = r.n;
  const filter = STATUSES.includes(status) ? status : "";
  const where = filter ? `${base} AND status = ?` : base;
  const params = filter ? [ctx.organizationId, siteId, filter] : [ctx.organizationId, siteId];
  const total = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_erasure_requests WHERE ${where}`).get(...params).n;
  const col = SORTS[sort] || SORTS.date, d = dir === "asc" ? "ASC" : "DESC";
  const pages = Math.max(1, Math.ceil(total / perPage)), p = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = ctx.db.prepare(`SELECT * FROM mk_erasure_requests WHERE ${where} ORDER BY ${col} ${d}, id DESC LIMIT ? OFFSET ?`).all(...params, perPage, (p - 1) * perPage)
    .map((r) => ({ ...r, mail: r.mail_id ? (ctx.db.prepare("SELECT status, last_error FROM mail_outbox WHERE id = ?").get(r.mail_id) || null) : null }));
  return { rows, counts, all: STATUSES.reduce((n, s) => n + counts[s], 0), total, page: p, pages, filter, sort: SORTS[sort] ? sort : "date", dir: d.toLowerCase() };
}

// Rétention : les demandes terminées ou échouées depuis plus d'un an disparaissent de la liste (jamais les données du site)
function sweep(db) {
  return Number(db.prepare("DELETE FROM mk_erasure_requests WHERE status IN ('completed', 'failed') AND COALESCE(completed_at, requested_at) < ?").run(sql(Date.now() - RETENTION_DAYS * 86400000)).changes) || 0;
}

module.exports = {
  STATUSES, STATUS_LABEL, FAILURE_LABEL, TOKEN_HOURS, RETENTION_DAYS, TRANSITIONS, canMove, TEMPLATES, TEMPLATE_KEYS, TEMPLATE_LABELS, VARS,
  resolveSubject, create, get, list, syncMail, confirmByToken, eligible, resend, markComplete, remove, arm, notifyFailure, notifyCompleted, sweep,
  templateOf, saveTemplate, siteContext, localeOf, expectedHostSite, hashEmail, maskEmail,
};
