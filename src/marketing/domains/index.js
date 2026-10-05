// Domaines d'envoi (point 11 de la parité Mailchimp, « Domains » : vérifier puis authentifier). Chaque contrôle est une
// VRAIE requête DNS (aucun statut supposé) ; le résultat de la dernière vérification est conservé avec son heure.
//  1. Propriété : un enregistrement TXT « kolakisa-verification=<jeton> » à la racine du domaine (ou domaine vérifié
//     chez Resend, qui a fait la même preuve).
//  2. SPF : un SEUL enregistrement « v=spf1 » (deux = invalide), terminé par ~all ou -all (jamais +all).
//  3. DKIM : clé publique publiée (« p=… ») au sélecteur du fournisseur (Resend : enregistrements donnés par Resend).
//  4. DMARC : « v=DMARC1 » à _dmarc.<domaine>, exigé par Gmail et Yahoo pour les envois en nombre depuis 2024.
//  5. MX : informatif (réponses et rebonds).
// « authenticated » = propriété + SPF + DKIM + DMARC tous valides ; « verified » = propriété seulement.
const crypto = require("crypto");
const dns = require("dns");
const { domainToASCII } = require("url");
const { checkCtx, audit } = require("../audience/shared");
const { MarketingError } = require("../errors");
const { getSendingConfig, getSecrets } = require("../sending/config");
const { parseSender } = require("../sending/providers");

const TXT_PREFIX = "kolakisa-verification=";
const DNS_TIMEOUT = 4000;
const COMMON_SELECTORS = ["resend", "default", "google", "selector1", "selector2", "k1", "k2", "s1", "s2", "mail", "dkim", "smtp", "mxvault", "hostingermail1", "hostingermail2"];
// Messageries gratuites : leur domaine ne peut pas être authentifié par vous, et leur DMARC rejette les envois tiers
const FREE_MAIL = new Set(["gmail.com", "googlemail.com", "yahoo.com", "yahoo.fr", "ymail.com", "hotmail.com", "hotmail.fr", "outlook.com", "outlook.fr", "live.com", "live.fr", "msn.com", "icloud.com", "me.com", "aol.com", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net", "gmx.fr", "gmx.com", "protonmail.com", "proton.me"]);
const STATUS_LABELS = { pending: "À vérifier", verified: "Vérifié (propriété)", authenticated: "Authentifié" };
const bad = (message) => new MarketingError("invalid_field", message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());

// ---------- DNS (remplaçable en test) ----------
let resolverForTests = null;
function setResolverForTests(r) { resolverForTests = r; }
function resolver() {
  if (resolverForTests) return resolverForTests;
  const r = new dns.promises.Resolver({ timeout: DNS_TIMEOUT, tries: 2 });
  return { resolveTxt: (n) => r.resolveTxt(n), resolveMx: (n) => r.resolveMx(n) };
}
const ABSENT = new Set(["ENOTFOUND", "ENODATA", "ENOTIMP", "NXDOMAIN"]);
// → { ok: true, values } (vide si l'enregistrement n'existe pas) | { ok: false, error } (DNS injoignable : on ne conclut rien)
async function lookup(kind, name) {
  try {
    const r = resolver();
    const raw = kind === "mx" ? await r.resolveMx(name) : await r.resolveTxt(name);
    return { ok: true, values: kind === "mx" ? raw.map((x) => `${x.priority} ${x.exchange}`) : raw.map((chunks) => (Array.isArray(chunks) ? chunks.join("") : String(chunks))) };
  } catch (error) {
    if (ABSENT.has(error && error.code)) return { ok: true, values: [] };
    return { ok: false, error: String((error && error.code) || "DNS") };
  }
}

// ---------- Nom de domaine ----------
function normalizeDomain(input) {
  let v = String(input ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
  if (v.includes("@")) v = v.split("@").pop();
  const ascii = domainToASCII(v);
  if (!ascii || ascii.length > 253 || !/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/.test(ascii)) throw bad("Nom de domaine invalide (ex. kolakisa.com ou news.kolakisa.com).");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ascii) || ascii.endsWith(".local") || ascii.endsWith(".localhost") || ascii.endsWith(".test") || ascii.endsWith(".invalid") || ascii.endsWith(".example")) throw bad("Ce domaine n'est pas un domaine public.");
  if (FREE_MAIL.has(ascii)) throw bad(`« ${ascii} » est une messagerie gratuite : vous ne pouvez pas l'authentifier, et ses règles DMARC font rejeter les e-mails envoyés par un logiciel comme celui-ci. Utilisez une adresse sur votre propre domaine.`);
  return ascii;
}

// ---------- Resend (facultatif : seulement si c'est le fournisseur et si la clé a l'accès complet) ----------
let fetchForTests = null;
function setFetchForTests(f) { fetchForTests = f; }
async function resend(ctx, method, path, body) {
  const key = getSecrets(ctx).apiKey;
  if (!key) return { ok: false, reason: "no_key" };
  const f = fetchForTests || globalThis.fetch;
  try {
    const res = await f(`https://api.resend.com${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000) });
    let json = null;
    try { json = await res.json(); } catch { json = null; }
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "restricted" }; // clé « envoi seulement »
    if (res.status < 200 || res.status >= 300) return { ok: false, reason: "api", status: res.status, message: String((json && (json.message || json.name)) || "").slice(0, 200) };
    return { ok: true, json };
  } catch {
    return { ok: false, reason: "network" };
  }
}
const useResend = (ctx) => getSendingConfig(ctx).provider === "resend";
const RESEND_NOTES = { no_key: "", restricted: "La clé Resend enregistrée est limitée à l'envoi : pour gérer le domaine chez Resend depuis ici, utilisez une clé « Full access », ou ajoutez le domaine sur resend.com/domains.", network: "Resend est injoignable pour le moment : vérification DNS seule.", api: "Resend a refusé la demande" };
const cleanRecords = (records) => (Array.isArray(records) ? records : []).slice(0, 12).map((r) => ({ type: String(r.type || r.record || "").toUpperCase().slice(0, 10), name: String(r.name || "").slice(0, 255), value: String(r.value || "").slice(0, 2000), priority: r.priority ?? null, status: String(r.status || "").slice(0, 30), purpose: String(r.record || "").slice(0, 20) }));

// ---------- CRUD ----------
const parse = (row) => (row ? { ...row, checks: JSON.parse(row.checks || "{}"), providerRecords: JSON.parse(row.provider_records || "[]"), statusLabel: STATUS_LABELS[row.status], txtName: row.domain, txtValue: `${TXT_PREFIX}${row.token}` } : null);
function listDomains(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT * FROM mk_sending_domains WHERE organization_id = ? ORDER BY domain").all(ctx.organizationId).map(parse);
}
function getDomain(ctx, id) {
  checkCtx(ctx);
  return Number.isInteger(id) ? parse(ctx.db.prepare("SELECT * FROM mk_sending_domains WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId)) : null;
}
function requireDomain(ctx, id) {
  const d = getDomain(ctx, id);
  if (!d) throw new MarketingError("not_found", "Domaine introuvable.");
  return d;
}

async function addDomain(ctx, input) {
  checkCtx(ctx);
  const domain = normalizeDomain(input);
  if (ctx.db.prepare("SELECT 1 FROM mk_sending_domains WHERE organization_id = ? AND domain = ?").get(ctx.organizationId, domain)) throw new MarketingError("duplicate", `Le domaine ${domain} est déjà ajouté.`);
  const token = crypto.randomBytes(16).toString("hex");
  const id = Number(ctx.db.prepare("INSERT INTO mk_sending_domains (organization_id, domain, token) VALUES (?, ?, ?)").run(ctx.organizationId, domain, token).lastInsertRowid);
  audit(ctx, "domain.added", "domain", id, { domain });
  let note = "";
  if (useResend(ctx)) {
    const r = await resend(ctx, "POST", "/domains", { name: domain });
    if (r.ok && r.json && r.json.id) ctx.db.prepare("UPDATE mk_sending_domains SET provider_id = ?, provider_records = ?, provider_status = ? WHERE id = ?").run(String(r.json.id).slice(0, 100), JSON.stringify(cleanRecords(r.json.records)), String(r.json.status || "").slice(0, 30), id);
    else if (!r.ok) note = r.reason === "api" ? `${RESEND_NOTES.api}${r.message ? ` (« ${r.message} »)` : ""} : vérification DNS seule.` : RESEND_NOTES[r.reason];
  }
  return { domain: getDomain(ctx, id), note };
}

function setSelector(ctx, id, selector) {
  requireDomain(ctx, id);
  const s = String(selector ?? "").trim().toLowerCase();
  if (s && !/^[a-z0-9]([a-z0-9-_.]{0,61}[a-z0-9])?$/.test(s)) throw bad("Sélecteur DKIM invalide (lettres, chiffres, « - », « _ », « . »).");
  ctx.db.prepare("UPDATE mk_sending_domains SET dkim_selector = ? WHERE id = ? AND organization_id = ?").run(s, id, ctx.organizationId);
  return s;
}

function deleteDomain(ctx, id) {
  const d = requireDomain(ctx, id);
  ctx.db.prepare("DELETE FROM mk_sending_domains WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "domain.deleted", "domain", id, { domain: d.domain });
  return d;
}

// ---------- Analyse des enregistrements ----------
function analyzeSpf(values) {
  const spf = values.filter((v) => /^v=spf1(\s|$)/i.test(v.trim()));
  if (!spf.length) return { state: "missing", message: "Aucun enregistrement SPF (TXT « v=spf1 … »)." };
  if (spf.length > 1) return { state: "error", value: spf.join(" | "), message: `${spf.length} enregistrements SPF : un seul est permis, fusionnez-les (sinon SPF est invalide).` };
  const v = spf[0].trim();
  const all = /\s([~?+-]?)all\s*$/i.exec(v);
  const lookups = (v.match(/\b(include|a|mx|ptr|exists|redirect)[:=\s]/gi) || []).length;
  if (all && all[1] === "+") return { state: "error", value: v, message: "« +all » autorise n'importe qui à envoyer en votre nom : remplacez-le par « ~all » ou « -all »." };
  if (lookups > 10) return { state: "error", value: v, message: `${lookups} recherches DNS (10 au plus) : SPF échoue chez les destinataires.` };
  if (!all && !/redirect=/i.test(v)) return { state: "warn", value: v, message: "L'enregistrement SPF ne se termine pas par « ~all » ou « -all »." };
  return { state: "ok", value: v, message: "SPF publié." };
}
function analyzeDmarc(values) {
  const rec = values.find((v) => /^v=DMARC1/i.test(v.trim()));
  if (!rec) return { state: "missing", message: "Aucun enregistrement DMARC à _dmarc : Gmail et Yahoo l'exigent pour les envois en nombre." };
  const tags = Object.fromEntries(rec.split(";").map((p) => p.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.toLowerCase(), v.trim()]));
  const p = (tags.p || "").toLowerCase();
  if (!["none", "quarantine", "reject"].includes(p)) return { state: "error", value: rec, message: "Politique DMARC (p=) absente ou invalide." };
  return { state: "ok", value: rec, policy: p, report: tags.rua || "", message: p === "none" ? "DMARC publié en mode observation (p=none) : suffisant pour Gmail et Yahoo." : `DMARC publié (p=${p}).` };
}

async function checkDomain(ctx, id) {
  const d = requireDomain(ctx, id);
  const now = nowOf(ctx);
  const [root, dmarc, mx] = await Promise.all([lookup("txt", d.domain), lookup("txt", `_dmarc.${d.domain}`), lookup("mx", d.domain)]);
  const checks = { dnsError: [root, dmarc, mx].some((r) => !r.ok) };

  // Resend : vérification déclenchée chez Resend, puis statut de chaque enregistrement
  let provider = null;
  if (d.provider_id && useResend(ctx)) {
    await resend(ctx, "POST", `/domains/${encodeURIComponent(d.provider_id)}/verify`);
    const r = await resend(ctx, "GET", `/domains/${encodeURIComponent(d.provider_id)}`);
    if (r.ok && r.json) {
      provider = { status: String(r.json.status || "").slice(0, 30), records: cleanRecords(r.json.records) };
      ctx.db.prepare("UPDATE mk_sending_domains SET provider_records = ?, provider_status = ? WHERE id = ?").run(JSON.stringify(provider.records), provider.status, id);
    } else checks.providerNote = RESEND_NOTES[r.reason] || "";
  }

  const ownTxt = root.ok && root.values.some((v) => v.trim() === `${TXT_PREFIX}${d.token}`);
  checks.ownership = ownTxt ? { state: "ok", message: "Enregistrement de vérification trouvé." }
    : provider && provider.status === "verified" ? { state: "ok", message: "Domaine vérifié chez Resend." }
      : root.ok ? { state: "missing", message: "Enregistrement TXT de vérification introuvable (la propagation DNS peut prendre jusqu'à 48 h)." } : { state: "unknown", message: "DNS injoignable : réessayez." };

  checks.spf = root.ok ? analyzeSpf(root.values) : { state: "unknown", message: "DNS injoignable." };
  // Resend : SPF et MX de retour sont sur le sous-domaine « send » ; leur état vient de Resend
  if (provider) {
    const spfRec = provider.records.find((r) => r.purpose === "SPF" && r.type === "TXT");
    if (spfRec) checks.spf = spfRec.status === "verified" ? { state: "ok", value: spfRec.value, message: `SPF vérifié par Resend (${spfRec.name}).` } : { state: "missing", value: spfRec.value, message: `SPF pas encore vérifié par Resend : publiez le TXT « ${spfRec.name} ».` };
  }

  // DKIM : Resend (enregistrement fourni) sinon sélecteur indiqué, sinon les sélecteurs les plus courants
  if (provider && provider.records.some((r) => r.purpose === "DKIM")) {
    const k = provider.records.find((r) => r.purpose === "DKIM");
    checks.dkim = k.status === "verified" ? { state: "ok", selector: k.name, message: "DKIM vérifié par Resend." } : { state: "missing", selector: k.name, message: `DKIM pas encore vérifié par Resend : publiez « ${k.name} ».` };
  } else {
    const selectors = d.dkim_selector ? [d.dkim_selector] : COMMON_SELECTORS;
    const found = [];
    let unreachable = false;
    for (const s of selectors) {
      const r = await lookup("txt", `${s}._domainkey.${d.domain}`);
      if (!r.ok) { unreachable = true; continue; }
      if (r.values.some((v) => /(^|;)\s*p=[A-Za-z0-9+/=]{40,}/.test(v))) found.push(s);
    }
    checks.dkim = found.length ? { state: "ok", selector: found.join(", "), message: `Clé DKIM publiée (sélecteur ${found.join(", ")}).` }
      : unreachable && d.dkim_selector ? { state: "unknown", message: "DNS injoignable." }
        : { state: "missing", message: d.dkim_selector ? `Aucune clé DKIM au sélecteur « ${d.dkim_selector} ».` : "Aucune clé DKIM trouvée aux sélecteurs courants : indiquez le sélecteur donné par votre hébergeur d'e-mails." };
  }

  checks.dmarc = dmarc.ok ? analyzeDmarc(dmarc.values) : { state: "unknown", message: "DNS injoignable." };
  checks.mx = mx.ok ? (mx.values.length ? { state: "ok", value: mx.values.join(", "), message: "Le domaine reçoit des e-mails (réponses, rebonds)." } : { state: "warn", message: "Aucun serveur MX : les réponses à vos e-mails ne seront pas reçues sur ce domaine." }) : { state: "unknown", message: "DNS injoignable." };

  const owned = checks.ownership.state === "ok";
  const authenticated = owned && ["spf", "dkim", "dmarc"].every((k) => checks[k].state === "ok");
  const status = authenticated ? "authenticated" : owned ? "verified" : "pending";
  ctx.db.prepare("UPDATE mk_sending_domains SET checks = ?, checked_at = ?, status = ?, verified_at = CASE WHEN ? THEN COALESCE(verified_at, ?) ELSE NULL END WHERE id = ?")
    .run(JSON.stringify(checks), now, status, owned ? 1 : 0, now, id);
  if (status !== d.status) audit(ctx, "domain.status_changed", "domain", id, { domain: d.domain, from: d.status, to: status });
  return getDomain(ctx, id);
}

// ---------- Enregistrements à publier (affichés à la personne) ----------
function recordsToPublish(d) {
  const out = [{ purpose: "Vérification", type: "TXT", name: d.domain, value: `${TXT_PREFIX}${d.token}`, required: true }];
  if (d.providerRecords.length) out.push(...d.providerRecords.map((r) => ({ purpose: r.purpose === "DKIM" ? "DKIM (Resend)" : r.purpose === "SPF" ? `SPF (Resend)${r.type === "MX" ? " — retour" : ""}` : r.purpose || r.type, type: r.type, name: r.name.includes(d.domain) ? r.name : `${r.name}.${d.domain}`, value: r.value, priority: r.priority, required: true, providerStatus: r.status })));
  else {
    out.push({ purpose: "SPF", type: "TXT", name: d.domain, value: "v=spf1 include:<serveur de votre fournisseur> ~all", required: true, hint: "La partie « include » vous est donnée par votre hébergeur d'e-mails (SMTP). S'il existe déjà un « v=spf1 », ajoutez-la dans celui-ci : jamais deux SPF." });
    out.push({ purpose: "DKIM", type: "TXT", name: `${d.dkim_selector || "<sélecteur>"}._domainkey.${d.domain}`, value: "v=DKIM1; k=rsa; p=<clé publique fournie par votre hébergeur>", required: true, hint: "Clé générée par votre hébergeur d'e-mails (Hostinger, Google Workspace…) : copiez-la telle quelle." });
  }
  out.push({ purpose: "DMARC", type: "TXT", name: `_dmarc.${d.domain}`, value: `v=DMARC1; p=none; rua=mailto:dmarc@${d.domain}`, required: true, hint: "p=none = observation, sans risque pour vos envois ; durcissez (quarantine, reject) une fois SPF et DKIM en place." });
  // Déjà valide à la dernière vérification : on montre ce qui est publié plutôt qu'un modèle à recopier
  const c = d.checks || {};
  return out.map((r) => {
    const key = r.purpose === "Vérification" ? "ownership" : /^SPF/.test(r.purpose) && r.type === "TXT" ? "spf" : /^DKIM/.test(r.purpose) ? "dkim" : r.purpose === "DMARC" ? "dmarc" : null;
    if (!key || !c[key] || c[key].state !== "ok") return r;
    if (key === "dkim" && !d.providerRecords.length) return { ...r, done: true, name: `${String(c.dkim.selector).split(",")[0].trim()}._domainkey.${d.domain}`, value: "Clé publique publiée", hint: "" };
    return { ...r, done: true, value: c[key].value || r.value, hint: "" };
  });
}

// ---------- Domaine de l'adresse d'expédition (réglages d'envoi, contrôle avant envoi) ----------
function senderDomainStatus(ctx) {
  checkCtx(ctx);
  const cfg = getSendingConfig(ctx);
  const sender = cfg.from ? parseSender(cfg.from) : null;
  if (!sender) return null;
  const domain = sender.email.split("@").pop().toLowerCase();
  if (FREE_MAIL.has(domain)) return { domain, free: true, status: null };
  const row = ctx.db.prepare("SELECT id, status, checked_at FROM mk_sending_domains WHERE organization_id = ? AND domain = ?").get(ctx.organizationId, domain);
  return { domain, free: false, id: row ? row.id : null, status: row ? row.status : null, checkedAt: row ? row.checked_at : null };
}
// Avertissement à afficher avant un envoi réel (null si tout va bien) — jamais bloquant : l'envoi reste possible
function senderWarning(ctx) {
  const s = senderDomainStatus(ctx);
  if (!s) return null;
  if (s.free) return `L'adresse d'expédition utilise ${s.domain}, une messagerie gratuite : vos e-mails risquent d'être rejetés (DMARC de ${s.domain}). Utilisez une adresse sur votre propre domaine (Paramètres → Domaines).`;
  if (!s.status) return `Le domaine ${s.domain} de l'adresse d'expédition n'est pas ajouté dans Paramètres → Domaines : son authentification (SPF, DKIM, DMARC) n'est pas vérifiée.`;
  if (s.status !== "authenticated") return `Le domaine ${s.domain} n'est pas encore authentifié (SPF, DKIM et DMARC) : vos e-mails risquent d'arriver en spam. Voir Paramètres → Domaines.`;
  return null;
}

module.exports = {
  STATUS_LABELS, TXT_PREFIX, COMMON_SELECTORS, FREE_MAIL, normalizeDomain, listDomains, getDomain, addDomain, setSelector, deleteDomain, checkDomain,
  recordsToPublish, senderDomainStatus, senderWarning, analyzeSpf, analyzeDmarc, setResolverForTests, setFetchForTests,
};
