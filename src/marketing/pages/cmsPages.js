// Système de pages de KOLAKISA CMS (palier 2) : requêtes de la liste (recherche, filtres, tri, pagination côté base),
// actions groupées, page parente, changement d'adresse sans lien cassé. S'appuie sur le moteur de pages existant
// (mk_landing_pages, brouillon / publication / versions / corbeille = archived_at) : aucune table parallèle.
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");

const STATES = ["toutes", "publiees", "brouillons", "corbeille"];
const SORTS = { modifiee: "p.updated_at", titre: "p.name COLLATE NOCASE", creee: "p.id", publiee: "p.published_at" };
const PER_PAGE = 25;
const like = (q) => `%${String(q || "").slice(0, 80).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const bad = (message) => new MarketingError("invalid_field", message);

// Versions B des tests A/B : gérées dans leur test, jamais listées comme pages
const NOT_VARIANT = "p.id NOT IN (SELECT variant_page_id FROM mk_page_tests WHERE variant_page_id IS NOT NULL)";

// « Brouillons » = pas en ligne et pas à la corbeille : brouillon jamais publié, ou page remise hors ligne
const stateSql = (state) => ({
  toutes: "p.archived_at IS NULL",
  publiees: "p.archived_at IS NULL AND p.status = 'published'",
  brouillons: "p.archived_at IS NULL AND p.status IN ('draft', 'unpublished')",
  corbeille: "p.archived_at IS NOT NULL",
}[state]);

function counts(ctx) {
  const r = ctx.db.prepare(`SELECT COALESCE(SUM(p.archived_at IS NULL), 0) toutes,
      COALESCE(SUM(p.archived_at IS NULL AND p.status = 'published'), 0) publiees,
      COALESCE(SUM(p.archived_at IS NULL AND p.status IN ('draft', 'unpublished')), 0) brouillons,
      COALESCE(SUM(p.archived_at IS NOT NULL), 0) corbeille
    FROM mk_landing_pages p WHERE p.organization_id = ? AND ${NOT_VARIANT}`).get(ctx.organizationId);
  return { toutes: r.toutes, publiees: r.publiees, brouillons: r.brouillons, corbeille: r.corbeille };
}

function authorsOfPages(ctx) {
  return ctx.db.prepare("SELECT DISTINCT u.id, u.username FROM mk_landing_pages p JOIN users u ON u.id = p.created_by WHERE p.organization_id = ? ORDER BY u.username COLLATE NOCASE").all(ctx.organizationId);
}

// Liste filtrée, triée et paginée DANS la base ; les chiffres de fréquentation ne sont calculés que pour la page affichée
function queryPages(ctx, { state = "toutes", q = "", siteId = "", authorId = "", sort = "modifiee", dir = "desc", page = 1, perPage = PER_PAGE } = {}) {
  checkCtx(ctx);
  if (!STATES.includes(state)) state = "toutes";
  const where = ["p.organization_id = ?", stateSql(state), NOT_VARIANT];
  const args = [ctx.organizationId];
  const needle = String(q || "").trim();
  if (needle) { where.push("(p.name LIKE ? ESCAPE '\\' OR p.slug LIKE ? ESCAPE '\\' OR p.title LIKE ? ESCAPE '\\')"); args.push(like(needle), like(needle), like(needle)); }
  if (siteId === "none") where.push("p.site_id IS NULL");
  else if (/^\d{1,12}$/.test(String(siteId))) { where.push("p.site_id = ?"); args.push(Number(siteId)); }
  if (/^\d{1,12}$/.test(String(authorId))) { where.push("p.created_by = ?"); args.push(Number(authorId)); }
  const column = SORTS[sort] || SORTS.modifiee;
  const order = `${column} ${String(dir).toLowerCase() === "asc" ? "ASC" : "DESC"}${column === "p.id" ? "" : ", p.id DESC"}`;
  const total = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_landing_pages p WHERE ${where.join(" AND ")}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = ctx.db.prepare(`SELECT p.id, p.name, p.slug, p.title, p.status, p.kind, p.site_id, p.parent_id, p.published_at, p.updated_at, p.archived_at, p.created_by,
      p.draft IS NOT NULL AS has_draft, s.name AS site_name, u.username AS author, par.name AS parent_name
    FROM mk_landing_pages p LEFT JOIN mk_sites s ON s.id = p.site_id LEFT JOIN users u ON u.id = p.created_by LEFT JOIN mk_landing_pages par ON par.id = p.parent_id
    WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const marks = ids.map(() => "?").join(",");
    const stat = (type) => Object.fromEntries(ctx.db.prepare(`SELECT page_id, COUNT(DISTINCT visitor || ':' || (occurred_at / 86400000)) n FROM mk_landing_events WHERE page_id IN (${marks}) AND type = ? GROUP BY page_id`).all(...ids, type).map((r) => [r.page_id, r.n]));
    const views = stat("view"); const signups = Object.fromEntries(ctx.db.prepare(`SELECT page_id, COUNT(*) n FROM mk_landing_events WHERE page_id IN (${marks}) AND type = 'signup' GROUP BY page_id`).all(...ids).map((r) => [r.page_id, r.n]));
    // Palier 18 : tunnels (actifs) qui utilisent chaque page — une page utilisée est identifiable, et protégée contre la suppression silencieuse
    const inFunnels = {};
    for (const u of ctx.db.prepare(`SELECT s.page_id, f.name FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE s.page_id IN (${marks}) AND f.status = 'active' AND f.organization_id = ? ORDER BY f.name`).all(...ids, ctx.organizationId)) (inFunnels[u.page_id] ||= []).push(u.name);
    for (const r of rows) { r.visitors = views[r.id] || 0; r.signups = signups[r.id] || 0; r.funnels = inFunnels[r.id] || []; }
  }
  return { rows, total, page: current, pages, perPage, counts: counts(ctx) };
}

// ---------- Page parente (hiérarchie préparée : la fiche la règle, l'adresse reste /p/<adresse>) ----------
function setParent(ctx, id, parentId) {
  const page = ctx.db.prepare("SELECT id, site_id FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
  if (!page) throw new MarketingError("not_found", "Page introuvable.");
  if (parentId === null) { ctx.db.prepare("UPDATE mk_landing_pages SET parent_id = NULL WHERE id = ?").run(id); return; }
  if (parentId === id) throw bad("Une page ne peut pas être sa propre parente.");
  const parent = ctx.db.prepare("SELECT id, site_id, parent_id, archived_at FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(parentId, ctx.organizationId);
  if (!parent || parent.archived_at) throw bad("Page parente introuvable.");
  if ((parent.site_id ?? null) !== (page.site_id ?? null)) throw bad("La page parente doit appartenir au même site.");
  // Jamais de boucle : on remonte la lignée du parent
  for (let cursor = parent, depth = 0; cursor && depth < 50; depth++) {
    if (cursor.id === id) throw bad("Cette page est déjà un ancêtre de la page parente choisie.");
    cursor = cursor.parent_id ? ctx.db.prepare("SELECT id, parent_id FROM mk_landing_pages WHERE id = ?").get(cursor.parent_id) : null;
  }
  ctx.db.prepare("UPDATE mk_landing_pages SET parent_id = ? WHERE id = ?").run(parentId, id);
  audit(ctx, "page.parent_set", "landing", id, { parentId });
}
// Pages proposées comme parentes : même site, hors corbeille, hors la page et ses descendantes
function parentChoices(ctx, page) {
  const rows = ctx.db.prepare("SELECT id, name, parent_id FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NULL AND site_id IS ? AND id <> ? ORDER BY name COLLATE NOCASE").all(ctx.organizationId, page.site_id ?? null, page.id);
  const kids = new Map();
  for (const r of rows) kids.set(r.parent_id, [...(kids.get(r.parent_id) || []), r.id]);
  const banned = new Set(); const walk = (pid) => { for (const k of kids.get(pid) || []) if (!banned.has(k)) { banned.add(k); walk(k); } };
  walk(page.id);
  return rows.filter((r) => !banned.has(r.id)).map((r) => ({ id: r.id, name: r.name }));
}

// ---------- Changement d'adresse : l'ancien lien d'une page EN LIGNE continue de fonctionner ----------
// Passe par le gestionnaire de redirections existant (seo_redirects) : l'ancien /p/<adresse> renvoie (301) vers le nouveau.
// Une adresse reprise par une page retire la redirection qui la masquerait ; les chaînes A → B → C sont raccourcies.
function slugChanged(ctx, { id = null, oldSlug, newSlug, status, publishedAt = null, siteId = null }) {
  if (oldSlug === newSlug) return;
  try {
    const db = ctx.db;
    // Une redirection manuelle qui masquerait la nouvelle adresse est retirée ; celles qui visaient l'ancienne visent la nouvelle (pas de chaîne)
    db.prepare("DELETE FROM seo_redirects WHERE source_path = ?").run(`/p/${newSlug}`);
    db.prepare("UPDATE seo_redirects SET target = ?, updated_at = datetime('now') WHERE target = ?").run(`/p/${newSlug}`, `/p/${oldSlug}`);
    // Historique des adresses (palier 12) : l'ancienne adresse redirige (301) vers l'adresse COURANTE de la page, tant que la page a été en ligne
    if (id) require("../../services/urls").slugChanged("page", id, { oldSlug, newSlug, siteId, wasLive: status === "published" || Boolean(publishedAt), userId: ctx.userId ?? null });
    try { require("../../seo/redirects").invalidate(); } catch { /* module SEO indisponible : le cache se renouvelle au redémarrage */ }
  } catch (e) { if (!/no such table/i.test(e.message)) throw e; }
}
// Adresse qui sert déjà de redirection (ancienne adresse d'une page : manuelle ou historique) : jamais attribuée d'office à une nouvelle page
const redirectSource = (ctx, slug) => {
  try { return Boolean(ctx.db.prepare("SELECT 1 FROM seo_redirects WHERE source_path = ?").get(`/p/${slug}`) || ctx.db.prepare("SELECT 1 FROM cms_url_history WHERE resource_type = 'page' AND old_slug = ?").get(slug)); } catch { return false; }
};

// ---------- Actions groupées ----------
const RUNNERS = { publier: "publish", depublier: "unpublish", corbeille: "archive", restaurer: "restore", supprimer: "remove" };
// Participe passé au singulier et au pluriel (« 1 page publiée », « 3 pages publiées »)
const ACTIONS = { publier: ["publiée", "publiées"], depublier: ["mise hors ligne", "mises hors ligne"], corbeille: ["mise à la corbeille", "mises à la corbeille"], restaurer: ["restaurée", "restaurées"], supprimer: ["supprimée définitivement", "supprimées définitivement"] };
// run : { publish, unpublish, archive, restore, remove } fournis par la route (moteur de pages) ; can(action) filtre les droits
// allow(row, action) : droit de CETTE page (son site), vérifié page par page ; refus individuel signalé sans arrêter les autres
function bulk(ctx, action, ids, run, allow = null) {
  if (!Object.hasOwn(ACTIONS, action)) throw bad("Action inconnue.");
  const list = [...new Set((Array.isArray(ids) ? ids : [ids]).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
  if (!list.length) throw bad("Sélectionnez au moins une page.");
  const done = []; const failed = [];
  for (const id of list) {
    const row = ctx.db.prepare("SELECT id, name, archived_at, site_id FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
    if (!row || (Number.isInteger(ctx.siteScope) && (row.site_id ?? null) !== ctx.siteScope)) { failed.push({ id, name: `#${id}`, message: "page introuvable" }); continue; }
    if (allow && !allow(row, action)) { failed.push({ id, name: row.name, message: "vous n'avez pas ce droit sur le site de cette page" }); continue; }
    try {
      if (action === "supprimer" && !row.archived_at) throw bad("mettez d'abord la page à la corbeille");
      if (action === "restaurer" && !row.archived_at) throw bad("la page n'est pas dans la corbeille");
      if ((action === "publier" || action === "depublier" || action === "corbeille") && row.archived_at) throw bad("la page est dans la corbeille");
      run[RUNNERS[action]](id);
      done.push({ id, name: row.name });
    } catch (e) {
      if (!(e instanceof MarketingError)) throw e;
      failed.push({ id, name: row.name, message: e.message.replace(/\.$/, "") });
    }
  }
  return { done, failed, label: ACTIONS[action] };
}

module.exports = { STATES, SORTS, PER_PAGE, queryPages, counts, authorsOfPages, setParent, parentChoices, slugChanged, redirectSource, bulk, ACTIONS };
