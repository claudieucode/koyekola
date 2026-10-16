// Portée des routes d'administration /marketing (R3, anomalie A-07) : TABLE DÉCLARATIVE du site visé par une requête.
//
// Avant R3, le site visé était déduit par une cascade d'expressions régulières écrite dans web/index.js. Ce fichier la remplace par des DONNÉES :
//  - SITE_RULES  : comment le site est établi pour chaque forme d'adresse — par la RESSOURCE chargée côté serveur (page, composant, liste, campagne…),
//                  par le CHEMIN (/site-web/sites/<id>), par le site PRINCIPAL, ou par un paramètre validé (?site=, champ « site »), jamais autrement ;
//  - FAMILIES    : la déclaration de chaque famille de routes (« site » : certaines adresses visent un site ; « organization » : écrans de l'organisation,
//                  sans site). Un test énumère les routes réellement montées et ÉCHOUE si l'une n'est déclarée dans aucune famille : une nouvelle route
//                  doit donc être classée explicitement (elle ne peut plus être oubliée en silence).
// Comportement à l'exécution INCHANGÉ : une adresse qui ne correspond à aucune règle vaut « aucun site » (droits d'équipe, refusée par défaut à un accès
// limité à un site) — exactement comme avant. L'ancienne logique est conservée telle quelle dans les tests (oracle d'équivalence).
//
// siteOfRequest(db, req) → { siteId } | { siteId: null, missing: true } | null
//   { siteId: N }               : l'adresse vise le site N ;
//   { siteId: null }            : le site principal ;
//   { siteId: null, missing }   : la ressource visée n'existe pas (traitée sans site, donc refusée à un accès limité) ;
//   null                        : aucune indication de site.

const DIGITS = /^\d{1,12}$/;
const ANY_DIGITS = /^\d+$/;

// Tables autorisées pour retrouver le site d'une ressource par son identifiant (liste fermée : jamais un nom venu de la requête)
const RESOURCE_TABLES = Object.freeze({
  page: "mk_landing_pages", composant: "mk_web_components",
  campagnes: "mk_campaigns", listes: "mk_lists", segments: "mk_segments", modeles: "mk_templates", automatisations: "mk_automations", tunnels: "mk_funnels",
  test: "mk_page_tests", evenement: "mk_events",
});

// Valeur d'un paramètre de site : « ?site= » puis le champ « site » du formulaire (même ordre qu'avant R3)
const siteParam = (req) => (req.query && req.query.site) ?? (req.body && req.body.site);

const resolvers = {
  // Le site est celui de la RESSOURCE (chargée côté serveur) : jamais un champ du navigateur
  resource(rule, m, db) {
    const table = RESOURCE_TABLES[rule.table === "byFamily" ? m[1] : rule.table];
    const id = Number(m[rule.idGroup]);
    const r = db.prepare(`SELECT site_id FROM ${table} WHERE id = ?`).get(id);
    return r ? { siteId: r.site_id } : { siteId: null, missing: true };
  },
  // Le site est dans le chemin lui-même
  path: (rule, m) => ({ siteId: Number(m[rule.idGroup]) }),
  // Le site principal : réservé à l'équipe de l'organisation (jamais à un accès limité à un site)
  main: () => ({ siteId: null }),
  // Le site est un paramètre VALIDÉ (entier) : « ?site= » ou champ « site » ; absent ou invalide → aucune indication de site
  param(rule, m, db, req) {
    const raw = siteParam(req);
    return DIGITS.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
  },
  // Lecture seule : « ?site= » entier
  queryGet(rule, m, db, req) {
    const raw = (req.query && req.query.site) ?? "";
    return DIGITS.test(String(raw)) ? { siteId: Number(req.query.site) } : null;
  },
  // Création : champ « site_id » du formulaire (entier)
  bodySiteId(rule, m, db, req) {
    const raw = req.body && req.body.site_id;
    return ANY_DIGITS.test(String(raw || "")) ? { siteId: Number(req.body.site_id) } : null;
  },
};

// Règles de site, évaluées dans l'ordre (la première adresse reconnue décide). Chaque règle : { id, pattern, methods?, exact?, kind, … }
const EMAIL_FAMILIES = "campagnes|listes|segments|modeles|automatisations|tunnels";
const SITE_RULES = Object.freeze([
  { id: "page-par-identifiant", pattern: /^\/pages\/(\d+)(?:\/|$)/, kind: "resource", table: "page", idGroup: 1 },
  { id: "site-dans-le-chemin", pattern: /^\/site-web\/sites\/(\d+)(?:\/|$)/, kind: "path", idGroup: 1 },
  { id: "site-principal", pattern: /^\/site-web\/principal(?:\/|$)/, kind: "main" },
  { id: "historique-de-page", pattern: /^\/site-web\/historique\/page\/(\d+)(?:\/|$)/, kind: "resource", table: "page", idGroup: 1 },
  { id: "composant-par-identifiant", pattern: /^\/site-web\/composants\/(\d+)/, kind: "resource", table: "composant", idGroup: 1 },
  { id: "outils-et-parametres", pattern: /^\/site-web\/(?:outils|parametres)(?:\/|$)/, kind: "param", terminal: true },
  { id: "email-par-identifiant", pattern: new RegExp(`^\\/(${EMAIL_FAMILIES})\\/(\\d{1,12})(?:\\/|$)`), kind: "resource", table: "byFamily", idGroup: 2 },
  { id: "tests-ab-du-site", pattern: /^\/site-web\/tests-ab$/, methods: ["GET"], kind: "queryGet" },
  { id: "test-ab-par-identifiant", pattern: /^\/tests-ab\/(\d{1,12})(?:\/|$)/, kind: "resource", table: "test", idGroup: 1 },
  { id: "analytics-du-site", pattern: /^\/analytics\/global(?:\/export)?$/, methods: ["GET"], kind: "queryGet" },
  { id: "evenement-par-identifiant", pattern: /^\/evenements\/(\d{1,12})$/, kind: "resource", table: "evenement", idGroup: 1 },
  { id: "email-liste-et-creation", pattern: new RegExp(`^\\/(?:${EMAIL_FAMILIES})(?:\\/(?:nouvelle|nouveau|apercu|apercu-cible|historique|parcours(?:\\/.*)?|bibliotheque(?:\\/.*)?))?$`), kind: "param", terminal: true },
  { id: "contacts-du-site", pattern: /^\/contacts(?:\/\d+(?:\/evenements\.json)?)?$/, methods: ["GET"], kind: "queryGet" },
  { id: "creation-avec-site", pattern: /^(?:\/pages|\/site-web\/composants)$/, methods: ["POST"], kind: "bodySiteId" },
]);

// Familles de routes déclarées. « site » : des adresses de cette famille peuvent viser un site (voir SITE_RULES) ; « organization » : écrans de l'organisation
// (contenu du site principal, réglages, outils transverses…), sans site. Toute route montée doit appartenir à UNE famille (test de couverture).
const FAMILIES = Object.freeze([
  // — Familles pouvant viser un site —
  { id: "pages", scope: "site", pattern: /^\/pages(?:\/|$)/ },
  { id: "email-engine", scope: "site", pattern: new RegExp(`^\\/(?:${EMAIL_FAMILIES})(?:\\/|$)`) },
  { id: "tests-ab", scope: "site", pattern: /^\/tests-ab(?:\/|$)/ },
  { id: "analytics", scope: "site", pattern: /^\/analytics(?:\/|$)/ },
  { id: "evenements", scope: "site", pattern: /^\/evenements(?:\/|$)/ },
  { id: "contacts", scope: "site", pattern: /^\/contacts(?:\/|$)/ },
  { id: "espace-du-site", scope: "site", pattern: /^\/site-web\/(?:sites|principal|composants|composants\.json|historique|outils|parametres|tests-ab)(?:\/|$)/ },
  // — Écrans de l'organisation (aucun site visé) —
  { id: "tableau-de-bord", scope: "organization", pattern: /^\/$/ },
  { id: "moteurs-transverses", scope: "organization", pattern: /^\/(?:sms|sondages|webhooks|rss|reseaux|ia|importer|formulaires|score|domaines|medias|envoi|conformite|etiquettes|api|revenus|proprietes|apparence|composants)(?:\/|$)/ },
  { id: "site-web-organisation", scope: "organization", pattern: /^\/site-web(?:\/(?:utilisateurs|apparence|articles|navigation|mediatheque|redirections|medias|medias\.json|commentaires|modeles-de-theme|modeles|modeles\.json|liens-casses|corbeille|recherche|permaliens|gabarits|mes-sites|seo)(?:\/|$)|$)/ },
]);

function siteOfRequest(db, req) {
  const p = req.path;
  const method = req.method;
  for (const rule of SITE_RULES) {
    if (rule.methods && !rule.methods.includes(method)) continue;
    const m = rule.pattern.exec(p);
    if (!m) continue;
    const out = resolvers[rule.kind](rule, m, db, req);
    if (out) return out;
    if (rule.terminal) return null; // reconnue mais sans site valide : aucune indication (les règles suivantes ne s'appliquent pas)
  }
  return null;
}

// Famille déclarée d'une adresse (pour le test de couverture) : { id, scope } ou null si aucune famille ne la déclare
function declaredFamily(path) {
  const f = FAMILIES.find((fam) => fam.pattern.test(path));
  return f ? { id: f.id, scope: f.scope } : null;
}

module.exports = { siteOfRequest, declaredFamily, SITE_RULES, FAMILIES, RESOURCE_TABLES };
