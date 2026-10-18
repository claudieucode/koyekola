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
  modelePage: "mk_page_templates", test: "mk_page_tests", evenement: "mk_events", media: "mk_media", form: "mk_forms", smsCampaign: "mk_sms_campaigns", socialPost: "mk_social_posts",
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
  // Moteur des pages (MP) : création / import JSON — le site est dans le corps (« siteId »)
  bodySiteIdJson(rule, m, db, req) {
    const raw = req.body && req.body.siteId;
    return DIGITS.test(String(raw ?? "")) ? { siteId: Number(raw) } : null;
  },
  // Menus de navigation par site (R8 lot 4) : un menu relève de son site (NULL = principal) ; un élément relève du site de son menu
  navMenu(rule, m, db) { try { const r = db.prepare("SELECT site_id FROM nav_menus WHERE id = ?").get(Number(m[rule.idGroup])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; } catch { return { siteId: null, missing: true }; } },
  navItem(rule, m, db) { try { const r = db.prepare("SELECT mn.site_id FROM nav_items i JOIN nav_menus mn ON mn.id = i.menu_id WHERE i.id = ?").get(Number(m[rule.idGroup])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; } catch { return { siteId: null, missing: true }; } },
  // Contenus par site (R6 lot 2) : un article ou un terme relève du site de son rattachement (aucune ligne = site principal, fermé à un accès limité à un site)
  content(rule, m, db) {
    const s = require("../../services/siteContent").siteOf(db, rule.contentType, Number(m[rule.idGroup]));
    return s === undefined ? { siteId: null, missing: true } : { siteId: s };
  },
  // Commentaire : le site est celui de l'article commenté ; les autres types de contenu relèvent du site principal
  comment(rule, m, db) {
    const c = db.prepare("SELECT content_type, content_id FROM blog_comments WHERE id = ?").get(Number(m[rule.idGroup]));
    if (!c) return { siteId: null, missing: true };
    if (c.content_type !== "post") return { siteId: null };
    const s = require("../../services/siteContent").siteOf(db, "post", c.content_id);
    return s === undefined ? { siteId: null, missing: true } : { siteId: s };
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
  { id: "page-creation-json", pattern: /^\/pages\/(?:creer|importer)\.json$/, methods: ["POST"], kind: "bodySiteIdJson" },
  { id: "page-nom-json", pattern: /^\/pages\/nom\.json$/, methods: ["GET"], kind: "queryGet" },
  // Modèles de pages enregistrés, PRIVÉS à leur site (site builder) : enregistrement = site du corps (« siteId »), lecture = « ?site= » (les deux revérifiés par le moteur), suppression = site du modèle
  { id: "modele-page-enregistrement", pattern: /^\/site-web\/modeles$/, methods: ["POST"], kind: "bodySiteIdJson" },
  { id: "modele-page-lecture", pattern: /^\/site-web\/modeles(?:\.json|\/\d+\.json)$/, methods: ["GET"], kind: "queryGet" },
  { id: "modele-page-suppression", pattern: /^\/site-web\/modeles\/(\d+)\/supprimer$/, methods: ["POST"], kind: "resource", table: "modelePage", idGroup: 1 },
  { id: "outils-et-parametres", pattern: /^\/site-web\/(?:outils|parametres)(?:\/|$)/, kind: "param", terminal: true },
  { id: "email-par-identifiant", pattern: new RegExp(`^\\/(${EMAIL_FAMILIES})\\/(\\d{1,12})(?:\\/|$)`), kind: "resource", table: "byFamily", idGroup: 2 },
  { id: "tests-ab-du-site", pattern: /^\/site-web\/tests-ab$/, methods: ["GET"], kind: "queryGet" },
  { id: "test-ab-par-identifiant", pattern: /^\/tests-ab\/(\d{1,12})(?:\/|$)/, kind: "resource", table: "test", idGroup: 1 },
  { id: "analytics-du-site", pattern: /^\/analytics\/global(?:\/export)?$/, methods: ["GET"], kind: "queryGet" },
  { id: "evenement-par-identifiant", pattern: /^\/evenements\/(\d{1,12})$/, kind: "resource", table: "evenement", idGroup: 1 },
  { id: "email-liste-et-creation", pattern: new RegExp(`^\\/(?:${EMAIL_FAMILIES})(?:\\/(?:nouvelle|nouveau|apercu|apercu-cible|historique|parcours(?:\\/.*)?|bibliotheque(?:\\/.*)?))?$`), kind: "param", terminal: true },
  { id: "contacts-du-site", pattern: /^\/contacts(?:\/nouveau|\/export\.csv|\/\d+(?:\/evenements\.json)?)?$/, methods: ["GET"], kind: "queryGet" }, // R8 lots 3-4 : + « nouveau » (page de création) et l'export CSV du site
  // Contacts par site (R7, décision D2) : écriture d'un contact par un accès limité à un site — le site vient de « ?site= » ou du champ « site » (validé par les droits) ; le DROIT de modifier ce contact
  // (origine = ce site) est ensuite vérifié par contactcore/siteAccess ; fusion et doublons restent réservés à l'équipe (contactCore.js)
  // Formulaires par site (R7 lot 2) : un formulaire visé par son identifiant relève de son site (NULL = site principal, fermé à un accès limité) ; liste et création : site choisi
  // Navigation par site (R8 lot 4) : un menu ou un élément appelé par identifiant relève de son site ; liste, création, emplacements, import et recherche : site choisi (« ?site= » ou champ « site »)
  { id: "navigation-menu-par-identifiant", pattern: /^\/site-web\/navigation\/menus\/(\d{1,12})(?:\/|$)/, kind: "navMenu", idGroup: 1 },
  { id: "navigation-element-par-identifiant", pattern: /^\/site-web\/navigation\/elements\/(\d{1,12})(?:\/|$)/, kind: "navItem", idGroup: 1 },
  { id: "navigation-du-site", pattern: /^\/site-web\/(?:navigation|apparence\/menus)(?:\/(?:menus|emplacements|importer|ressources))?$/, kind: "param", terminal: true },
  { id: "formulaire-par-identifiant", pattern: /^\/formulaires\/(\d{1,12})(?:\/|$)/, kind: "resource", table: "form", idGroup: 1 },
  { id: "formulaires-du-site", pattern: /^\/formulaires(?:\/|$)/, kind: "param", terminal: true },
  // SMS par site (R7 lot 6.1) : une campagne par son identifiant relève de son site (NULL = organisation, fermée à un accès limité) ; liste, création et abonnés : site choisi ; réglages, test, blocages (STOP) : organisation
  { id: "sms-campagne-par-identifiant", pattern: /^\/sms\/campagnes\/(\d{1,12})(?:\/|$)/, kind: "resource", table: "smsCampaign", idGroup: 1 },
  { id: "sms-du-site", pattern: /^\/sms(?:\/(?:campagnes|abonnes))?$/, kind: "param", terminal: true },
  // Assistant IA (R7 lot 6.2) : les appels d'aide à la rédaction (e-mails, SMS) relèvent du site choisi (?site= ou champ « site » du corps JSON) ; les réglages de l'assistant (voix de marque, plafond) restent à l'organisation
  { id: "ia-assistant", pattern: /^\/ia\/(?:etat|objets|reecrire|brouillon|optimiser|sms)$/, kind: "param", terminal: true },
  // Réseaux sociaux par site (R7 lot 6.3) : une publication par son identifiant relève de son site (NULL = organisation, fermée à un accès limité) ; liste et création : site choisi ; comptes, jetons et autorisations : organisation
  { id: "reseau-publication-par-identifiant", pattern: /^\/reseaux\/(\d{1,12})\/(?:annuler|relancer|supprimer)$/, kind: "resource", table: "socialPost", idGroup: 1 },
  { id: "reseaux-du-site", pattern: /^\/reseaux$/, kind: "param", terminal: true },
  // Score par site (R7 lot 6.4) : l'écran /score vise le site choisi (aperçu du score DU site, lecture seule) ; règles, niveaux et recalcul restent des écrans d'organisation (équipe)
  { id: "score-du-site", pattern: /^\/score$/, methods: ["GET"], kind: "param", terminal: true },
  // Revenus par site (R7 lot 6.5) : l'écran /revenus vise le site choisi (revenus attribués aux e-mails DU site, lecture seule) ; la fenêtre d'attribution reste un réglage d'organisation
  { id: "revenus-du-site", pattern: /^\/revenus$/, methods: ["GET"], kind: "param", terminal: true },
  { id: "demandes-du-site", pattern: /^\/contacts\/demandes$/, methods: ["GET"], kind: "queryGet" },
  { id: "contacts-ecriture-du-site", pattern: /^\/contacts(?:\/(?:actions|\d+(?:\/(?:proprietes|etiquettes(?:\/retirer)?|listes(?:\/retirer)?|cycle-de-vie|etat|consentement|desinscrire|supprimer-adresse|effacer))?))?$/, methods: ["POST"], kind: "param" },
  { id: "creation-avec-site", pattern: /^(?:\/pages|\/site-web\/composants)$/, methods: ["POST"], kind: "bodySiteId" },
  // Médias par site (R5) : un fichier visé par son identifiant relève du site qui le possède (commun = organisation, fermé à un accès limité à un site)
  { id: "media-par-identifiant", pattern: /^\/site-web\/(?:mediatheque|medias)\/(\d{1,12})(?:\.json|\/|$)/, kind: "resource", table: "media", idGroup: 1 },
  // Contenus par site (R6 lot 2)
  { id: "article-par-identifiant", pattern: /^\/site-web\/articles\/(\d{1,12})(?:\/|$)/, kind: "content", contentType: "post", idGroup: 1 },
  { id: "terme-par-identifiant", pattern: /^\/site-web\/articles\/termes\/(\d{1,12})(?:\/|$)/, kind: "content", contentType: "term", idGroup: 1 },
  { id: "commentaire-par-identifiant", pattern: /^\/site-web\/commentaires\/(\d{1,12})(?:\/|$)/, kind: "comment", idGroup: 1 },
  { id: "articles-et-commentaires-du-site", pattern: /^\/site-web\/(?:articles|commentaires)(?:\/|$)/, kind: "param", terminal: true },
  { id: "mediatheque-du-site", pattern: /^\/site-web\/(?:mediatheque|medias)(?:\/|\.json$|$)/, kind: "queryGet", terminal: true },
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
  { id: "ia-assistant", scope: "site", pattern: /^\/ia\/(?:etat|objets|reecrire|brouillon|optimiser|sms)$/ },
  { id: "sms-campagnes", scope: "site", pattern: /^\/sms(?:\/campagnes(?:\/|$)|\/abonnes$|$)/ },
  { id: "reseaux-publications", scope: "site", pattern: /^\/reseaux(?:\/\d+\/(?:annuler|relancer|supprimer))?$/ },
  { id: "score-apercu", scope: "site", pattern: /^\/score$/ },
  { id: "revenus-apercu", scope: "site", pattern: /^\/revenus$/ },
  { id: "navigation-du-site", scope: "site", pattern: /^\/site-web\/(?:navigation|apparence\/menus)(?:\/|$)/ },
  { id: "formulaires", scope: "site", pattern: /^\/formulaires(?:\/|$)/ },
  { id: "contenus-par-site", scope: "site", pattern: /^\/site-web\/(?:articles|commentaires|mediatheque|medias|medias\.json)(?:\/|$)/ },
  { id: "espace-du-site", scope: "site", pattern: /^\/site-web\/(?:sites|principal|composants|composants\.json|historique|outils|parametres|tests-ab)(?:\/|$)/ },
  // — Écrans de l'organisation (aucun site visé) —
  { id: "tableau-de-bord", scope: "organization", pattern: /^\/$/ },
  { id: "moteurs-transverses", scope: "organization", pattern: /^\/(?:sms|sondages|webhooks|rss|reseaux|ia|importer|score|domaines|medias|envoi|conformite|etiquettes|api|revenus|proprietes|apparence|composants)(?:\/|$)/ },
  { id: "site-web-organisation", scope: "organization", pattern: /^\/site-web(?:\/(?:utilisateurs|apparence|navigation|redirections|modeles-de-theme|modeles|modeles\.json|liens-casses|corbeille|recherche|permaliens|gabarits|mes-sites|seo)(?:\/|$)|$)/ },
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
