// Registre des domaines des sites (TITAN XXXII). Un domaine est une LIGNE de mk_site_domains : site propriétaire, type (domaine de plateforme ou personnalisé),
// état de vérification, canonique ou secondaire, états DNS et HTTPS. Le serveur ne sert un hôte que si une ligne « verified » existe pour un site actif (voir urls.loadSites).
//
// Règles :
//   - un domaine personnalisé n'est JAMAIS actif parce qu'on l'a saisi : il est « pending » tant que la propriété n'est pas prouvée (TXT _kolakisa-verify.<hôte> = jeton) ;
//   - un hôte vérifié n'appartient qu'à un seul site (index unique) ; plusieurs sites peuvent le réclamer, seul celui qui prouve la propriété l'obtient ;
//   - l'hôte de la plateforme, les hôtes locaux, les IP et le domaine de plateforme ne peuvent pas devenir le domaine d'un site ;
//   - le sous-domaine de plateforme (PLATFORM_DOMAIN) n'existe que si cette variable est configurée : sinon la plateforme le dit, elle ne l'invente pas.
// Test : en NODE_ENV=test les domaines sont acceptés « auto » (comportement historique des tests) sauf KOLAKISA_DOMAIN_VERIFY=strict ; en production : toujours « strict ».
const crypto = require("crypto");
const dns = require("dns");
const tls = require("tls");
const net = require("net");
const { MarketingError } = require("../marketing/errors");
const { checkCtx, audit } = require("../marketing/audience/shared");
const urls = require("./urls");

const bad = (message) => new MarketingError("invalid_field", message);
// Transaction à la main (le pilote SQLite du projet n'a pas db.transaction) ; sans effet si l'appelant en a déjà ouvert une
function inTx(db, fn) {
  if (db.isTransaction) return fn();
  db.exec("BEGIN IMMEDIATE");
  try { const r = fn(); db.exec("COMMIT"); return r; } catch (error) { try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ } throw error; }
}
let noMirror = 0; // > 0 : l'appelant enregistre lui-même les réglages (syncFromPublicUrl) ; le miroir ne les réécrit pas (sinon conflit de révision)
const TXT_PREFIX = "_kolakisa-verify";
const RESERVED_LABELS = new Set(["www", "admin", "api", "app", "apps", "assets", "blog", "cdn", "cms", "dashboard", "dev", "dns", "ftp", "git", "help", "imap", "kolakisa", "login", "mail", "marketing", "mx", "ns", "ns1", "ns2", "pop", "root", "shop", "smtp", "static", "status", "staging", "support", "test", "webmail", "wiki", "ww", "www2"]);

const mode = () => (urls.legacyDomains() ? "auto" : "strict");
const platformDomain = () => { const p = urls.normHost(process.env.PLATFORM_DOMAIN || ""); return p && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(p) ? p : ""; };

// ---------- Contrôles DNS / HTTPS (remplaçables en test) ----------
let checkers = null;
const setCheckersForTests = (c) => { checkers = c; };
const resolverImpl = {
  txt: async (name) => { const r = await dns.promises.resolveTxt(name); return r.map((chunks) => chunks.join("")); },
  routing: async (host) => {
    const out = { a: [], aaaa: [], cname: [] };
    for (const [key, fn] of [["a", "resolve4"], ["aaaa", "resolve6"], ["cname", "resolveCname"]]) { try { out[key] = await dns.promises[fn](host); } catch { /* absent */ } }
    return out;
  },
  tls: (host) => new Promise((resolve) => {
    const done = (v) => { try { socket.destroy(); } catch { /* rien */ } resolve(v); };
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: true, timeout: 6000 }, () => done({ ok: true }));
    socket.on("error", (e) => done({ ok: false, code: e.code || "ERR", message: e.message }));
    socket.on("timeout", () => done({ ok: false, code: "TIMEOUT", message: "délai dépassé" }));
  }),
};
// Test seulement (NODE_ENV=test) : KOLAKISA_TEST_DNS_FILE désigne un JSON { txt: { nom: [valeurs] }, routing: { hôte: { a, aaaa, cname } }, tls: { hôte: true } } relu à chaque contrôle
// (le serveur de test est un autre processus : l'injection de fonctions n'y est pas possible). Jamais actif en production.
const fakeFile = () => { if (process.env.NODE_ENV !== "test" || !process.env.KOLAKISA_TEST_DNS_FILE) return null; try { return JSON.parse(require("fs").readFileSync(process.env.KOLAKISA_TEST_DNS_FILE, "utf8")); } catch { return {}; } };
const fakeImpl = {
  txt: async (name) => { const v = (fakeFile().txt || {})[name]; if (!v) { const e = new Error("ENODATA"); e.code = "ENODATA"; throw e; } return v; },
  routing: async (host) => ({ a: [], aaaa: [], cname: [], ...((fakeFile().routing || {})[host] || {}) }),
  tls: async (host) => ((fakeFile().tls || {})[host] ? { ok: true } : { ok: false, code: "ERR", message: "certificat absent" }),
};
const impl = () => checkers || (fakeFile() ? fakeImpl : resolverImpl);

// Adresses vers lesquelles un domaine doit pointer : DOMAIN_DNS_A / DOMAIN_DNS_CNAME si configurés, sinon celles de l'hôte principal (mesurées, jamais inventées)
async function platformTargets() {
  const fromEnv = (k) => String(process.env[k] || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const a = fromEnv("DOMAIN_DNS_A"), cname = fromEnv("DOMAIN_DNS_CNAME");
  if (a.length || cname.length) return { a, cname, source: "configuration" };
  const main = urls.mainHost();
  if (!main) return { a: [], cname: [], source: "aucune" };
  const r = await impl().routing(main).catch(() => ({ a: [], aaaa: [], cname: [] }));
  return { a: [...(r.a || []), ...(r.aaaa || [])].map((x) => x.toLowerCase()), cname: (r.cname || []).map((x) => x.toLowerCase().replace(/\.$/, "")), source: `adresses actuelles de ${main}` };
}
async function routingStatus(host) {
  const targets = await platformTargets();
  if (!targets.a.length && !targets.cname.length) return { status: "unknown", detail: "Adresses de la plateforme inconnues : contrôle du routage impossible." };
  const r = await impl().routing(host).catch(() => ({ a: [], aaaa: [], cname: [] }));
  const ips = [...(r.a || []), ...(r.aaaa || [])].map((x) => x.toLowerCase());
  const cn = (r.cname || []).map((x) => x.toLowerCase().replace(/\.$/, ""));
  if (!ips.length && !cn.length) return { status: "missing", detail: "Le domaine ne pointe encore vers aucune adresse." };
  if (ips.some((x) => targets.a.includes(x)) || cn.some((x) => targets.cname.includes(x))) return { status: "ok", detail: "Le domaine pointe vers la plateforme." };
  return { status: "mismatch", detail: `Le domaine pointe ailleurs (${[...ips, ...cn].slice(0, 3).join(", ")}).` };
}

// ---------- Validation ----------
function hostFromInput(raw) {
  let s = String(raw || "").trim();
  if (!s) throw bad("Indiquez un nom de domaine (ex. www.monsite.com).");
  if (/[\s@]/.test(s)) throw bad("Nom de domaine invalide : sans espace, ni identifiant.");
  if (s.includes("://")) { try { s = new URL(s).host; } catch { throw bad("Adresse invalide."); } } else s = s.replace(/\/.*$/, "");
  if (/:\d+$/.test(s)) throw bad("Indiquez le nom de domaine sans numéro de port.");
  return urls.normHost(s);
}
function validateHost(raw, { kind = "custom" } = {}) {
  const host = hostFromInput(raw);
  if (!host || host.length > 253) throw bad("Nom de domaine invalide (253 caractères au plus).");
  if (net.isIP(host)) throw bad("Une adresse IP ne peut pas être le domaine d'un site : utilisez un nom de domaine.");
  const labels = host.split(".");
  if (labels.length < 2) throw bad("Nom de domaine incomplet (ex. monsite.com).");
  for (const l of labels) if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(l)) throw bad("Nom de domaine invalide : lettres, chiffres et tirets seulement, 63 caractères au plus par partie.");
  const tld = labels[labels.length - 1];
  if (!(/^[a-z]{2,}$/.test(tld) || /^xn--[a-z0-9-]+$/.test(tld))) throw bad("Extension de domaine invalide.");
  if (/\.(local|localhost|internal|lan|invalid|onion)$/.test(host) || host === "localhost") throw bad("Ce nom est réservé : il ne peut pas être public.");
  const main = urls.mainHost();
  const mainBare = main.replace(/^www\./, "");
  const extra = String(process.env.HOTES_AUTORISES || "").split(",").map((h) => urls.normHost(h)).filter(Boolean);
  if (main && (host === main || host === mainBare || host === `www.${mainBare}` || host.endsWith(`.${mainBare}`) && kind !== "platform")) throw bad("Ce domaine appartient à la plateforme : choisissez le vôtre.");
  if (extra.includes(host)) throw bad("Ce domaine est réservé à la plateforme.");
  const plat = platformDomain();
  if (plat && kind !== "platform" && (host === plat || host.endsWith(`.${plat}`))) throw bad("Les adresses du domaine de la plateforme sont attribuées automatiquement : indiquez votre propre domaine.");
  return host;
}

// Libellé de sous-domaine de plateforme : lettres minuscules, chiffres, tirets ; 3 à 40 caractères ; ni réservé ni punycode
function cleanLabel(text) {
  let l = String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
  if (l.length < 3) l = `${l}site`.slice(0, 40);
  if (l.startsWith("xn--")) l = `site-${l.slice(4)}`;
  if (RESERVED_LABELS.has(l)) l = `${l}-site`;
  return l;
}

// ---------- Lecture ----------
const one = (db, sql, ...p) => db.prepare(sql).get(...p);
const rowsOf = (db, siteId) => db.prepare("SELECT * FROM mk_site_domains WHERE site_id = ? AND status <> 'disabled' ORDER BY is_canonical DESC, kind DESC, id").all(siteId);
function describe(row) {
  const live = row.status === "verified";
  let note;
  if (row.status === "pending") note = "En attente : ajoutez l'enregistrement TXT puis vérifiez. Tant que la propriété n'est pas prouvée, ce domaine ne sert rien.";
  else if (row.dns_status === "mismatch" || row.dns_status === "missing") note = "Propriété prouvée, mais le domaine ne pointe pas encore vers la plateforme : le site n'est pas accessible tant que le DNS n'est pas corrigé.";
  else if (row.tls_status === "failed" || row.tls_status === "pending") note = "Propriété prouvée ; le certificat HTTPS n'est pas encore actif sur l'hébergeur : le site peut afficher une erreur de sécurité.";
  else if (row.tls_status === "unknown" || row.dns_status === "unknown") note = "Propriété prouvée ; l'accès public (DNS, HTTPS) n'a pas encore été contrôlé.";
  else note = "Opérationnel : DNS et HTTPS contrôlés.";
  const operational = live && row.dns_status === "ok" && row.tls_status === "ok";
  return { ...row, canonical: Boolean(row.is_canonical), live, operational, note };
}
const listForSite = (db, siteId) => rowsOf(db, siteId).map(describe);

// ---------- Écriture ----------
function mirror(ctx, siteId) {
  if (noMirror) { urls.invalidateSites(); return; }
  // settings.seo.publicUrl reflète le domaine canonique VÉRIFIÉ (les lecteurs historiques : sitemap, canonical, liens… continuent de s'en servir) ; vide s'il n'y en a pas
  const c = one(ctx.db, "SELECT host FROM mk_site_domains WHERE site_id = ? AND status = 'verified' AND is_canonical = 1", siteId);
  const s = one(ctx.db, "SELECT settings FROM mk_sites WHERE id = ?", siteId);
  if (!s) return;
  let conf = {};
  try { conf = JSON.parse(s.settings || "{}"); } catch { conf = {}; }
  const want = c ? `https://${c.host}` : "";
  if (((conf.seo && conf.seo.publicUrl) || "") === want) { urls.invalidateSites(); return; }
  conf.seo = { ...(conf.seo || {}), publicUrl: want };
  ctx.db.prepare("UPDATE mk_sites SET settings = ?, settings_revision = settings_revision + 1, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(conf), siteId);
  urls.invalidateSites();
}
function requireOwn(ctx, siteId, id) {
  checkCtx(ctx);
  const row = one(ctx.db, "SELECT d.* FROM mk_site_domains d JOIN mk_sites s ON s.id = d.site_id WHERE d.id = ? AND d.site_id = ? AND s.organization_id = ?", id, siteId, ctx.organizationId);
  if (!row) throw new MarketingError("not_found", "Domaine introuvable pour ce site.");
  return row;
}
function requireSiteRow(ctx, siteId) {
  checkCtx(ctx);
  const s = one(ctx.db, "SELECT id, name, slug, status, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?", siteId, ctx.organizationId);
  if (!s || s.deleted_at) throw new MarketingError("not_found", "Site introuvable.");
  if (s.status !== "active") throw new MarketingError("invalid_state", "Ce site est archivé : restaurez-le avant de gérer ses domaines.");
  return s;
}
const isSibling = (a, b) => a === `www.${b}` || b === `www.${a}`;
const token = () => `kolakisa-site-verification=${crypto.randomBytes(24).toString("hex")}`;
const hasCanonical = (db, siteId) => Boolean(one(db, "SELECT 1 FROM mk_site_domains WHERE site_id = ? AND status = 'verified' AND is_canonical = 1", siteId));
// Un domaine personnalisé vérifié devient le domaine principal si le site n'avait que l'adresse de la plateforme (celle-ci redirige alors vers lui)
function promoteCustom(ctx, siteId, id) {
  const cur = one(ctx.db, "SELECT id, kind FROM mk_site_domains WHERE site_id = ? AND status = 'verified' AND is_canonical = 1", siteId);
  if (cur && cur.kind !== "platform") return;
  inTx(ctx.db, () => {
    if (cur) ctx.db.prepare("UPDATE mk_site_domains SET is_canonical = 0 WHERE id = ?").run(cur.id);
    ctx.db.prepare("UPDATE mk_site_domains SET is_canonical = 1, updated_at = datetime('now') WHERE id = ?").run(id);
  });
}

// Hôte tenu par un AUTRE site ACTIF. Le domaine d'un site archivé ou supprimé peut être repris par un autre site (comme avant) : il est alors libéré chez l'ancien site (releaseFromInactive).
function takenByOther(ctx, host, siteId) {
  return one(ctx.db, "SELECT d.site_id FROM mk_site_domains d JOIN mk_sites s ON s.id = d.site_id WHERE d.host = ? AND d.status = 'verified' AND d.site_id <> ? AND s.status = 'active' AND s.deleted_at IS NULL", host, siteId);
}
function releaseFromInactive(ctx, host, siteId) {
  ctx.db.prepare("UPDATE mk_site_domains SET status = 'disabled', is_canonical = 0, disabled_at = datetime('now'), updated_at = datetime('now') WHERE host = ? AND status = 'verified' AND site_id <> ? AND site_id IN (SELECT id FROM mk_sites WHERE status <> 'active' OR deleted_at IS NOT NULL)").run(host, siteId);
}

function insertVerified(ctx, site, host, { kind, method, canonical }) {
  const isCanon = canonical && !hasCanonical(ctx.db, site.id) ? 1 : 0;
  const id = Number(ctx.db.prepare("INSERT INTO mk_site_domains (organization_id, site_id, host, kind, status, is_canonical, verification_method, verified_at, created_by) VALUES (?, ?, ?, ?, 'verified', ?, ?, datetime('now'), ?)")
    .run(ctx.organizationId, site.id, host, kind, isCanon, method, ctx.userId ?? null).lastInsertRowid);
  return id;
}

// Domaine personnalisé : « pending » (jeton à publier) ; « verified » tout de suite seulement pour un jumeau www d'un domaine déjà vérifié du même site, ou en mode test « auto »
function addCustomDomain(ctx, siteId, raw) {
  const site = requireSiteRow(ctx, siteId);
  const host = validateHost(raw, { kind: "custom" });
  if (takenByOther(ctx, host, site.id)) throw new MarketingError("duplicate", "Ce domaine est déjà utilisé par un autre site de la plateforme. Pour le déplacer, retirez-le d'abord du site actuel.");
  const mine = one(ctx.db, "SELECT * FROM mk_site_domains WHERE site_id = ? AND host = ? AND status <> 'disabled'", site.id, host);
  if (mine) return describe(mine);
  releaseFromInactive(ctx, host, site.id);
  const verifiedMine = ctx.db.prepare("SELECT host FROM mk_site_domains WHERE site_id = ? AND kind = 'custom' AND status = 'verified'").all(site.id);
  let id;
  if (verifiedMine.some((d) => isSibling(host, d.host))) id = insertVerified(ctx, site, host, { kind: "custom", method: "sibling", canonical: false });
  else if (mode() === "auto") { id = insertVerified(ctx, site, host, { kind: "custom", method: "test", canonical: true }); promoteCustom(ctx, site.id, id); }
  else id = Number(ctx.db.prepare("INSERT INTO mk_site_domains (organization_id, site_id, host, kind, status, verification_token, verification_method, created_by) VALUES (?, ?, ?, 'custom', 'pending', ?, 'txt', ?)")
    .run(ctx.organizationId, site.id, host, token(), ctx.userId ?? null).lastInsertRowid);
  mirror(ctx, site.id);
  audit(ctx, "site.domain_added", "site", site.id, { host });
  return describe(one(ctx.db, "SELECT * FROM mk_site_domains WHERE id = ?", id));
}

// Vérification de propriété (TXT), du routage (DNS) et du certificat (HTTPS). Un domaine n'est activé que si la propriété est prouvée.
async function verifyDomain(ctx, siteId, id) {
  const row = requireOwn(ctx, siteId, id);
  if (row.status === "disabled") throw new MarketingError("invalid_state", "Ce domaine est désactivé.");
  if (row.kind === "platform") return refreshDomain(ctx, siteId, id);
  let proven = row.status === "verified";
  let error = null;
  if (!proven) {
    try {
      const values = await impl().txt(`${TXT_PREFIX}.${row.host}`);
      proven = values.some((v) => v.trim() === row.verification_token);
      if (!proven) error = values.length ? "L'enregistrement TXT trouvé ne correspond pas au jeton attendu." : "Aucun enregistrement TXT trouvé : la propagation DNS peut prendre quelques minutes.";
    } catch (e) { error = e.code === "ENOTFOUND" || e.code === "ENODATA" ? "Aucun enregistrement TXT trouvé : la propagation DNS peut prendre quelques minutes." : `Résolution DNS impossible (${e.code || "erreur"}).`; }
  }
  if (!proven) {
    ctx.db.prepare("UPDATE mk_site_domains SET last_check_at = datetime('now'), last_check_error = ?, updated_at = datetime('now') WHERE id = ?").run(error, row.id);
    return describe(one(ctx.db, "SELECT * FROM mk_site_domains WHERE id = ?", row.id));
  }
  if (row.status !== "verified") {
    // Un autre site a pu prouver ce domaine entre-temps : l'index unique tranche, ce site-ci ne l'obtient pas
    releaseFromInactive(ctx, row.host, row.site_id);
    if (takenByOther(ctx, row.host, row.site_id)) { ctx.db.prepare("UPDATE mk_site_domains SET last_check_at = datetime('now'), last_check_error = ?, updated_at = datetime('now') WHERE id = ?").run("Ce domaine est déjà vérifié par un autre site.", row.id); throw new MarketingError("duplicate", "Ce domaine est déjà vérifié par un autre site de la plateforme."); }
    ctx.db.prepare("UPDATE mk_site_domains SET status = 'verified', is_canonical = 0, verified_at = datetime('now'), last_check_error = NULL, updated_at = datetime('now') WHERE id = ?").run(row.id);
    promoteCustom(ctx, row.site_id, row.id);
    audit(ctx, "site.domain_verified", "site", row.site_id, { host: row.host });
  }
  mirror(ctx, row.site_id);
  return refreshDomain(ctx, siteId, id);
}
async function refreshDomain(ctx, siteId, id) {
  const row = requireOwn(ctx, siteId, id);
  const routing = await routingStatus(row.host);
  let tlsStatus = "pending";
  if (row.kind === "platform" && !platformDomain()) tlsStatus = "unknown";
  else if (routing.status === "ok" || routing.status === "unknown") { const t = await impl().tls(row.host).catch(() => ({ ok: false })); tlsStatus = t.ok ? "ok" : "failed"; }
  ctx.db.prepare("UPDATE mk_site_domains SET dns_status = ?, tls_status = ?, last_check_at = datetime('now'), last_check_error = ?, updated_at = datetime('now') WHERE id = ?")
    .run(routing.status, tlsStatus, routing.status === "ok" ? null : routing.detail, row.id);
  return describe(one(ctx.db, "SELECT * FROM mk_site_domains WHERE id = ?", row.id));
}

function setCanonical(ctx, siteId, id) {
  const row = requireOwn(ctx, siteId, id);
  if (row.status !== "verified") throw new MarketingError("invalid_state", "Seul un domaine vérifié peut devenir le domaine principal du site.");
  inTx(ctx.db, () => {
    ctx.db.prepare("UPDATE mk_site_domains SET is_canonical = 0, updated_at = datetime('now') WHERE site_id = ? AND is_canonical = 1").run(siteId);
    ctx.db.prepare("UPDATE mk_site_domains SET is_canonical = 1, updated_at = datetime('now') WHERE id = ?").run(row.id);
  });
  mirror(ctx, siteId);
  audit(ctx, "site.domain_canonical", "site", siteId, { host: row.host });
  return describe(one(ctx.db, "SELECT * FROM mk_site_domains WHERE id = ?", row.id));
}

function disableDomain(ctx, siteId, id) {
  const row = requireOwn(ctx, siteId, id);
  inTx(ctx.db, () => {
    ctx.db.prepare("UPDATE mk_site_domains SET status = 'disabled', is_canonical = 0, disabled_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(row.id);
    // Le domaine principal retiré : un autre domaine vérifié du site prend le relais (jamais un site sans adresse si un autre domaine existe)
    if (row.is_canonical) {
      const next = one(ctx.db, "SELECT id FROM mk_site_domains WHERE site_id = ? AND status = 'verified' ORDER BY kind = 'custom' DESC, id LIMIT 1", siteId);
      if (next) ctx.db.prepare("UPDATE mk_site_domains SET is_canonical = 1 WHERE id = ?").run(next.id);
    }
  });
  mirror(ctx, siteId);
  audit(ctx, "site.domain_disabled", "site", siteId, { host: row.host });
  return { id: row.id, host: row.host, status: "disabled" };
}

// Sous-domaine de plateforme du site : seulement si PLATFORM_DOMAIN est configuré. Le serveur le résout réellement ; son HTTPS et son DNS restent à contrôler (voir refreshDomain).
function platformStatus() {
  const p = platformDomain();
  if (!p) return { available: false, reason: "Aucun domaine de plateforme n'est configuré (variable PLATFORM_DOMAIN) : les adresses automatiques ne sont pas disponibles. Il faut un domaine dédié avec un enregistrement DNS générique (*.<domaine>) et un certificat qui le couvre." };
  return { available: true, domain: p };
}
function freeLabel(ctx, base) {
  const p = platformDomain();
  for (let i = 0; i < 200; i++) {
    const label = i === 0 ? base : `${base.slice(0, 36)}-${i + 1}`;
    if (!one(ctx.db, "SELECT 1 FROM mk_site_domains WHERE host = ? AND status <> 'disabled'", `${label}.${p}`)) return label;
  }
  throw new MarketingError("duplicate", "Aucun nom libre pour ce site : choisissez un nom différent.");
}
function ensurePlatformDomain(ctx, siteId) {
  const site = requireSiteRow(ctx, siteId);
  const st = platformStatus();
  if (!st.available) throw new MarketingError("unavailable", st.reason);
  const have = one(ctx.db, "SELECT * FROM mk_site_domains WHERE site_id = ? AND kind = 'platform' AND status <> 'disabled'", site.id);
  if (have) return describe(have);
  const label = freeLabel(ctx, cleanLabel(site.slug || site.name));
  const id = insertVerified(ctx, site, `${label}.${st.domain}`, { kind: "platform", method: "platform", canonical: true });
  mirror(ctx, site.id);
  audit(ctx, "site.domain_platform", "site", site.id, { host: `${label}.${st.domain}` });
  return describe(one(ctx.db, "SELECT * FROM mk_site_domains WHERE id = ?", id));
}

// L'ancien champ « Adresse publique » (Réglages → Référencement) passe par le registre : changer l'adresse retire l'ancien domaine personnalisé canonique et enregistre le nouveau
// (en production : « pending », donc rien n'est servi avant vérification). Retourne l'adresse à enregistrer dans les réglages (le miroir du domaine canonique vérifié).
function syncFromPublicUrl(ctx, siteId, publicUrl) {
  noMirror++;
  try { return syncInner(ctx, siteId, publicUrl); } finally { noMirror--; urls.invalidateSites(); }
}
function syncInner(ctx, siteId, publicUrl) {
  const mirrorValue = () => { const c = one(ctx.db, "SELECT host FROM mk_site_domains WHERE site_id = ? AND status = 'verified' AND is_canonical = 1", siteId); return c ? `https://${c.host}` : ""; };
  const canon = one(ctx.db, "SELECT * FROM mk_site_domains WHERE site_id = ? AND status = 'verified' AND is_canonical = 1", siteId);
  let want = "";
  if (publicUrl) {
    // Réglages enregistrés sans changement : l'adresse est le miroir du domaine principal (quel qu'en soit le type) → rien à faire
    try { const u = new URL(publicUrl); if (canon && urls.normHost(u.hostname) === canon.host) return `https://${canon.host}`; } catch { /* validée ci-dessous */ }
    want = validateHost(publicUrl, { kind: "custom" });
  }
  if (!want) {
    // Champ vidé : l'éventuel domaine personnalisé principal est retiré (comme avant) ; l'adresse de la plateforme reste
    if (canon && canon.kind === "custom") disableDomain(ctx, siteId, canon.id);
    return mirrorValue();
  }
  if (takenByOther(ctx, want, siteId)) throw new MarketingError("duplicate", "Cette adresse est déjà utilisée par un autre site : un domaine ne peut servir qu'un seul site.");
  if (mode() === "strict") { addCustomDomain(ctx, siteId, want); return mirrorValue(); } // le domaine actuel reste servi tant que le nouveau n'est pas vérifié
  if (canon && canon.kind === "custom") disableDomain(ctx, siteId, canon.id);
  addCustomDomain(ctx, siteId, want);
  return mirrorValue();
}

// Reprise de l'existant au démarrage : tout domaine déjà saisi dans les réglages d'un site devient une ligne « verified / legacy » (aucun site ne perd son adresse)
function backfillLegacy(db) {
  let added = 0;
  try {
    const sites = db.prepare("SELECT id, organization_id, status, settings FROM mk_sites ORDER BY (status = 'active') DESC, id").all();
    for (const s of sites) {
      let conf = {};
      try { conf = JSON.parse(s.settings || "{}"); } catch { continue; }
      const url = conf.seo && conf.seo.publicUrl;
      if (!url) continue;
      let host = "";
      try { const u = new URL(url); if (u.protocol === "https:") host = urls.normHost(u.hostname); } catch { continue; }
      if (!host) continue;
      if (db.prepare("SELECT 1 FROM mk_site_domains WHERE host = ? AND site_id = ?").get(host, s.id)) continue;
      if (db.prepare("SELECT 1 FROM mk_site_domains WHERE host = ? AND status = 'verified'").get(host)) continue; // déjà tenu par un autre site : premier servi, comme avant
      const canon = db.prepare("SELECT 1 FROM mk_site_domains WHERE site_id = ? AND is_canonical = 1 AND status = 'verified'").get(s.id) ? 0 : 1;
      db.prepare("INSERT INTO mk_site_domains (organization_id, site_id, host, kind, status, is_canonical, verification_method, verified_at) VALUES (?, ?, ?, 'custom', 'verified', ?, 'legacy', datetime('now'))").run(s.organization_id, s.id, host, canon);
      added++;
    }
  } catch (error) { if (!/no such table/i.test(error.message)) throw error; }
  if (added) urls.invalidateSites();
  return added;
}

// Instructions DNS à afficher (valeurs réelles : jeton du domaine, adresses de la plateforme mesurées ou configurées)
async function instructions(row) {
  const t = await platformTargets();
  return {
    txt: row.status === "pending" && row.verification_token ? { type: "TXT", name: `${TXT_PREFIX}.${row.host}`, value: row.verification_token } : null,
    routing: { a: t.a, cname: t.cname, source: t.source },
  };
}

module.exports = { mode, platformDomain, platformStatus, validateHost, cleanLabel, listForSite, addCustomDomain, verifyDomain, refreshDomain, setCanonical, disableDomain, ensurePlatformDomain, syncFromPublicUrl, backfillLegacy, instructions, setCheckersForTests, RESERVED_LABELS, TXT_PREFIX };
