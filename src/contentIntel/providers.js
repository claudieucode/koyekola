// SEO Data Providers : registre de connecteurs interchangeables + mots-clés d'un site avec PROVENANCE obligatoire.
// Cinq catégories jamais mélangées : calculé par Kolakisa · fourni par une API externe · saisi manuellement · estimation de l'IA · non disponible.
// Aucune donnée Google, SEMrush, Ahrefs ou autre n'est simulée. Aucun appel payant n'est déclenché ici : un connecteur sans configuration répond « non connecté ».
// Les caractéristiques d'un fournisseur (quotas, coûts, pays couverts) ne sont PAS affirmées ici quand elles ne sont pas vérifiées : le champ le dit.
const store = require("./store");
const integrations = require("../seo/integrations");

const bad = (m, code = "invalid") => Object.assign(new Error(m), { code, name: "MarketingError" });
const PROVENANCE = Object.freeze({
  calculated: "Calculé par Kolakisa", external: "Fourni par une API externe", manual: "Saisi manuellement", ai_estimate: "Estimation de l'IA", unavailable: "Non disponible",
});
const TO_VERIFY = "À vérifier auprès du fournisseur au moment de l'intégration (non vérifié dans Kolakisa).";
// Connecteurs : `integration` = nom dans seo/integrations (état réel lu), sinon aucun code d'intégration n'existe (statut « not_implemented »)
const CONNECTORS = Object.freeze([
  { id: "search_console", label: "Google Search Console", integration: "search_console", provides: ["clics", "impressions", "position moyenne", "requêtes"], scope: "central (une clé de service par installation, pas par site)", auth: "Compte de service Google", costs: "Aucun coût d'API connu à ce jour — " + TO_VERIFY, quotas: TO_VERIFY, countries: "Données du site vérifié dans Search Console", languages: "Selon le site", refresh: "Selon Google (délai de plusieurs jours)", terms: "Conditions d'utilisation de l'API Google", limits: "Pas de volume de recherche général : seulement les requêtes qui ont affiché CE site." },
  { id: "pagespeed", label: "PageSpeed Insights", integration: "pagespeed", provides: ["performance mesurée d'une page"], scope: "central", auth: "Clé d'API facultative", costs: TO_VERIFY, quotas: TO_VERIFY, countries: "Sans objet", languages: "Sans objet", refresh: "À la demande", terms: "Conditions de l'API Google", limits: "Mesure technique, pas de donnée de classement." },
  { id: "analytics", label: "Google Analytics 4", integration: "analytics", provides: ["sessions", "pages vues"], scope: "central", auth: "Compte de service Google", costs: TO_VERIFY, quotas: TO_VERIFY, countries: "Selon la propriété", languages: "Sans objet", refresh: "Selon Google", terms: "Conditions de l'API Google", limits: "Trafic de votre site seulement." },
  { id: "keyword_research", label: "Recherche de mots-clés (fournisseur tiers au choix)", integration: null, provides: ["volume de recherche", "difficulté", "tendances"], scope: "à définir", auth: TO_VERIFY, costs: TO_VERIFY, quotas: TO_VERIFY, countries: TO_VERIFY, languages: TO_VERIFY, refresh: TO_VERIFY, terms: TO_VERIFY, limits: "Aucun connecteur n'est implémenté : volumes et difficulté restent « Non disponible ». Les saisir à la main est possible, avec leur source." },
]);
function describe() {
  return CONNECTORS.map((c) => {
    let state = { state: "not_implemented", label: "Aucun connecteur n'est implémenté" };
    if (c.integration) { try { state = integrations.status(c.integration); } catch { state = { state: "unknown", label: "État indisponible" }; } }
    return { ...c, status: state, provenance: c.integration ? "external" : "unavailable", paidCallsTriggered: false };
  });
}
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const ROLES = ["primary", "secondary", "question", "entity", "variant"];
const METRICS = ["volume", "difficulty", "cpc", "position", "clicks", "impressions"];
const iso = (ctx) => new Date(ctx.now ? ctx.now() : Date.now()).toISOString();

function pageOk(ctx, siteId, pageId) {
  if (pageId == null) return;
  if (!ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE id = ? AND site_id = ? AND organization_id = ?").get(pageId, siteId, ctx.organizationId)) throw bad("Page introuvable dans ce site.", "not_found");
}
// Ajout d'un mot-clé. Les métriques (volume, difficulté…) exigent une provenance « external » AVEC source et date, ou « manual » (source = saisie, date = maintenant). L'estimation IA n'a JAMAIS de métrique.
function add(ctx, siteId, { keyword, role = "secondary", pageId = null, provenance = "manual", metrics = null, source = "", sourceDate = "" } = {}) {
  store.ensureSchema(ctx.db);
  const kw = clean(keyword, 120);
  if (kw.length < 2) throw bad("Mot-clé trop court.");
  if (!ROLES.includes(role)) throw bad("Rôle inconnu.");
  if (!["manual", "external", "ai_estimate"].includes(provenance)) throw bad("Provenance : saisie manuelle, API externe ou estimation de l'IA.");
  pageOk(ctx, siteId, pageId);
  let m = null, src = clean(source, 120), date = clean(sourceDate, 30);
  if (metrics && typeof metrics === "object" && Object.keys(metrics).length) {
    if (provenance === "ai_estimate") throw bad("Une estimation de l'IA ne peut pas porter de volume ni de difficulté : ces données n'existent que si une source réelle les fournit.", "no_invented_metrics");
    m = {};
    for (const k of METRICS) if (metrics[k] !== undefined && metrics[k] !== null && metrics[k] !== "") { const n = Number(metrics[k]); if (!Number.isFinite(n) || n < 0) throw bad(`Valeur invalide pour « ${k} ».`); m[k] = n; }
    if (provenance === "external") {
      if (!src || !/^\d{4}-\d{2}-\d{2}/.test(date)) throw bad("Données externes : indiquer la source ET la date (AAAA-MM-JJ).", "source_required");
      if (!CONNECTORS.some((c) => c.id === src) && src.length < 3) throw bad("Source externe non identifiable.", "source_required");
    } else { src = src || "Saisie manuelle"; date = date || iso(ctx).slice(0, 10); }
  }
  const id = Number(ctx.db.prepare("INSERT INTO mk_ci_keywords (site_id, organization_id, page_id, keyword, role, provenance, metrics, source, source_date, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(siteId, ctx.organizationId, pageId, kw, role, provenance, m ? JSON.stringify(m) : null, m ? src : null, m ? date : null, ctx.userId || null, iso(ctx)).lastInsertRowid);
  return { id };
}
function list(ctx, siteId, { pageId = null } = {}) {
  store.ensureSchema(ctx.db);
  return ctx.db.prepare("SELECT * FROM mk_ci_keywords WHERE site_id = ? AND organization_id = ? AND (? IS NULL OR page_id = ?) ORDER BY id DESC LIMIT 500").all(siteId, ctx.organizationId, pageId, pageId).map((r) => ({
    id: r.id, pageId: r.page_id, keyword: r.keyword, role: r.role, provenance: r.provenance, provenanceLabel: PROVENANCE[r.provenance],
    metrics: r.metrics ? store.json(r.metrics, null) : null, source: r.source, sourceDate: r.source_date,
    metricsNote: r.metrics ? `Valeurs fournies par « ${r.source} » le ${r.source_date} ; non vérifiées par Kolakisa.` : "Aucune donnée chiffrée disponible pour ce mot-clé.",
  }));
}
function remove(ctx, siteId, id) {
  store.ensureSchema(ctx.db);
  const r = ctx.db.prepare("DELETE FROM mk_ci_keywords WHERE id = ? AND site_id = ? AND organization_id = ?").run(id, siteId, ctx.organizationId);
  if (!Number(r.changes)) throw bad("Mot-clé introuvable dans ce site.", "not_found");
  return { removed: true };
}
module.exports = { describe, add, list, remove, PROVENANCE, CONNECTORS, ROLES };
