// Mode maintenance (palier 13), par PORTÉE : le site principal (« main ») ou un site du CMS (« site:<id> ») — activer l'un n'affecte jamais l'autre.
//  - une personne connectée de l'équipe (administration, CMS) n'est JAMAIS bloquée, ni les routes de connexion, d'administration, de webhooks, de santé et les fichiers ;
//  - les visiteurs reçoivent une page publique HTTP 503 (avec Retry-After), non indexable ; les moteurs comprennent que c'est temporaire ;
//  - chaque activation est journalisée (qui, quand, message).
const db = require("../../config/database");

db.exec(`
  CREATE TABLE IF NOT EXISTS cms_maintenance (
    scope TEXT PRIMARY KEY,                 -- 'main' ou 'site:<identifiant>'
    enabled INTEGER NOT NULL DEFAULT 0,
    message TEXT NOT NULL DEFAULT '',
    since TEXT,
    updated_by INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const MAX_MESSAGE = 400;
const DEFAULT_MESSAGE = "Le site est momentanément en maintenance. Merci de revenir dans quelques instants.";
const scopeOf = (siteId) => (siteId ? `site:${Number(siteId)}` : "main");
let cache = null;
let cacheAt = 0;
const rows = () => { if (cache && Date.now() - cacheAt < 3000) return cache; cache = new Map(db.prepare("SELECT * FROM cms_maintenance WHERE enabled = 1").all().map((r) => [r.scope, r])); cacheAt = Date.now(); return cache; };
const invalidate = () => { cache = null; };

const get = (siteId) => db.prepare("SELECT * FROM cms_maintenance WHERE scope = ?").get(scopeOf(siteId)) || { scope: scopeOf(siteId), enabled: 0, message: "", since: null };
function set(siteId, { enabled, message }, actor) {
  const userId = actor && actor.session ? actor.session.user.id : actor && actor.id ? actor.id : null;
  const text = String(message ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE);
  db.prepare(`INSERT INTO cms_maintenance (scope, enabled, message, since, updated_by, updated_at) VALUES (?, ?, ?, CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, ?, datetime('now'))
    ON CONFLICT(scope) DO UPDATE SET enabled = excluded.enabled, message = excluded.message, since = CASE WHEN excluded.enabled = 1 AND cms_maintenance.enabled = 0 THEN datetime('now') WHEN excluded.enabled = 1 THEN cms_maintenance.since ELSE NULL END, updated_by = excluded.updated_by, updated_at = datetime('now')`)
    .run(scopeOf(siteId), enabled ? 1 : 0, text, enabled ? 1 : 0, userId ?? null);
  invalidate();
  require("../auditLog").record(actor, { action: enabled ? "tools.maintenance_on" : "tools.maintenance_off", resourceType: "maintenance", summary: `Mode maintenance ${enabled ? "activé" : "désactivé"} : ${scopeOf(siteId) === "main" ? "site principal" : `site n° ${siteId}`}`, details: { scope: scopeOf(siteId), message: text } });
  return get(siteId);
}
function all() { return db.prepare("SELECT * FROM cms_maintenance ORDER BY scope").all(); }

// Chemins jamais fermés : connexion, administration, webhooks, santé, robots, fichiers statiques
const EXEMPT = /^\/(connexion|deconnexion|inscription|mot-de-passe-oublie|reinitialiser|marketing|formateur|api|webhooks|stripe|sante|robots\.txt|favicon|uploads|css|js|img|fonts|u\/|t\/)/;
const staticAsset = /\.(css|js|png|jpe?g|gif|webp|svg|ico|woff2?|map)$/i;

// Quelle portée s'applique à cette requête ? (domaine d'un site → ce site ; /p/<adresse> d'une page de site → ce site ; sinon site principal)
function scopeFor(req) {
  if (req.kwSite) return scopeOf(req.kwSite.id);
  const m = /^\/p\/([a-z0-9][a-z0-9-]*)/.exec(req.path);
  if (m) { const r = db.prepare("SELECT site_id FROM mk_landing_pages WHERE slug = ?").get(m[1]); if (r && r.site_id) return scopeOf(r.site_id); }
  return "main";
}
function middleware(req, res, next) {
  const map = rows();
  if (!map.size || (req.method !== "GET" && req.method !== "HEAD" && req.method !== "POST")) return next();
  if (EXEMPT.test(req.path) || staticAsset.test(req.path)) return next();
  const row = map.get(scopeFor(req));
  if (!row) return next();
  // L'équipe n'est jamais bloquée : session d'un compte formateur, ou membre du CMS
  const user = req.session && req.session.user;
  if (user && (user.role === "formateur" || require("../cmsAccess").siteMemberships(user.id).length || require("../../marketing/organizations").membershipsOf(db, user.id).length)) return next();
  res.status(503).set({ "Retry-After": "600", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }).render("maintenance", { message: row.message || DEFAULT_MESSAGE, since: row.since });
}

module.exports = { get, set, all, invalidate, middleware, scopeOf, scopeFor, DEFAULT_MESSAGE, MAX_MESSAGE };
