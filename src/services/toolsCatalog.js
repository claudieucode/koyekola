// Outils → Outils disponibles : REGISTRE central des outils d'administration.
//
// Une entrée déclare : id (unique), nom, description, catégorie, icône, destination, permission(s), portée, module requis, état, source.
//  - cœur de Kolakisa : la destination vient de l'entrée de navigation correspondante (`navKey`) — c'est le registre de navigation (cmsNav) qui reste
//    LA source des adresses, des libellés de menu et des cadres de site : aucune adresse n'est écrite une seconde fois ici ;
//  - extension : `register({ …, href, module, source: "extension:<clé>" })` ajoute un outil sans modifier cette page ;
//  - disponibilité calculée À CHAQUE requête pour (utilisateur, site) : permission serveur, module activé sur CE site, portée (centrale ou site), état.
//    Un outil « planned » n'existe pas encore : il est signalé comme tel, sans lien, jamais comme disponible.
//  - une entrée mal formée est ignorée (et consignée) : elle ne bloque jamais les autres cartes.
// Le lien affiché n'accorde aucun droit : chaque destination contrôle elle-même ses permissions côté serveur.
const db = require("../config/database");
const nav = require("../marketing/web/cmsNav");

const CATEGORIES = Object.freeze([
  { key: "import-export", label: "Importation et exportation" },
  { key: "diagnostic", label: "Diagnostic et maintenance" },
  { key: "confidentialite", label: "Confidentialité" },
  { key: "administration", label: "Administration" },
  { key: "extensions", label: "Extensions" },
]);
const CATEGORY_KEYS = new Set(CATEGORIES.map((c) => c.key));
const STATES = new Set(["available", "planned"]);
const ID = /^[a-z][a-z0-9-]{1,48}$/;
const REGISTRY = [];

function validate(e) {
  const errors = [];
  if (!e || typeof e !== "object") return ["entrée absente"];
  if (!ID.test(String(e.id || ""))) errors.push("identifiant invalide");
  if (!String(e.name || "").trim()) errors.push("nom manquant");
  if (!String(e.description || "").trim()) errors.push("description manquante");
  if (!CATEGORY_KEYS.has(e.category)) errors.push("catégorie inconnue");
  if (e.state !== undefined && !STATES.has(e.state)) errors.push("état inconnu");
  if ((e.state || "available") === "available") {
    if (!e.navKey && !e.href) errors.push("destination manquante");
    if (e.navKey && !nav.itemOf(e.navKey)) errors.push(`entrée de navigation « ${e.navKey} » inconnue`);
    if (e.href && !/^\/marketing\/[A-Za-z0-9/_-]*$/.test(String(e.href))) errors.push("adresse invalide (attendue : /marketing/…)");
    if (!e.permission || ![].concat(e.permission).every((p) => typeof p === "string" && p)) errors.push("permission manquante");
  }
  if (e.module !== undefined && !require("../marketing/siteModules").isModule(e.module)) errors.push(`module « ${e.module} » inconnu`);
  return errors;
}
// Enregistre un outil. Un identifiant déjà pris est refusé (jamais deux cartes pour un même outil) ; une entrée invalide lève une erreur explicite.
function register(entry) {
  const errors = validate(entry);
  if (errors.length) throw new TypeError(`Outil « ${entry && entry.id} » refusé : ${errors.join(", ")}.`);
  if (REGISTRY.some((e) => e.id === entry.id)) throw new Error(`Outil « ${entry.id} » déjà enregistré.`);
  REGISTRY.push({ state: "available", source: "core", scope: "both", order: 500, icon: "sliders", ...entry });
}
const unregister = (id) => { const i = REGISTRY.findIndex((e) => e.id === id); if (i >= 0) REGISTRY.splice(i, 1); return i >= 0; };

// ---------- Outils du cœur (les destinations viennent de la navigation) ----------
const core = (id, navKey, category, description, extra = {}) => ({ id, navKey, category, description, name: (nav.itemOf(navKey) || {}).label || id, permission: (nav.itemOf(navKey) || {}).permission, ...extra });
[
  core("importer", "outils/importer", "import-export", "Importer des pages, articles, médias et réglages depuis un fichier d'export Kolakisa : analyse d'abord, confirmation ensuite.", { icon: "upload", order: 10 }),
  core("exporter", "outils/exporter", "import-export", "Exporter le contenu du site (pages, articles, médias, menus…) dans un fichier que l'on peut réimporter.", { icon: "download", order: 20 }),
  { id: "sauvegarde-site", name: "Sauvegarde du site", description: "Sauvegarde complète d'un site dans un fichier unique, à conserver ou à restaurer.", category: "import-export", icon: "layers", href: "/marketing/site-web/outils/sauvegarde-site", permission: "tools.export", order: 30 },
  core("sante", "outils", "diagnostic", "Analyser la santé du site (contrôles réels, problèmes, recommandations) et consulter ses informations techniques.", { icon: "activity", order: 10 }),
  core("diagnostic", "outils/diagnostic", "diagnostic", "Vérifier l'intégrité des références entre contenus et l'état de la file de travaux.", { icon: "shield", order: 20 }),
  core("maintenance", "outils/maintenance", "diagnostic", "Activer le mode maintenance d'un site : les visiteurs voient une page d'attente, l'équipe garde l'accès.", { icon: "settings", order: 30 }),
  core("cache", "outils/cache", "diagnostic", "Inspecter les caches du CMS et les invalider un par un, sans perte de données.", { icon: "layers", order: 40 }),
  core("contenu", "outils/contenu", "diagnostic", "Rechercher et remplacer, régénérer des adresses, nettoyer : des actions sur le contenu, avec aperçu et confirmation.", { icon: "listChecks", order: 50 }),
  core("sauvegardes", "outils/sauvegardes", "diagnostic", "Sauvegardes de la base de données de l'installation : créer, télécharger, vérifier.", { icon: "history", scope: "central", order: 60 }),
  core("systeme", "outils/systeme", "diagnostic", "Informations système de l'installation : version, serveur, stockage.", { icon: "sliders", scope: "central", order: 70 }),
  core("corbeille", "corbeille", "administration", "Retrouver et restaurer les éléments supprimés (pages, articles, médias…).", { icon: "trash", order: 20 }),
  core("donnees", "outils/donnees", "confidentialite", "Exporter les données personnelles d'une personne (contacts, commandes, consentements…) à sa demande.", { icon: "download", order: 10 }),
  core("effacer-donnees", "outils/effacer-donnees", "confidentialite", "Traiter les demandes d'effacement de données personnelles : confirmation par la personne, traitement par lots, résultats.", { icon: "lock", order: 20 }),
  core("notes", "outils/notes", "administration", "Notes internes de l'administration du site : instructions, rappels, décisions. Jamais publiées.", { icon: "stickyNote", order: 10 }),
  core("logs", "outils/logs", "administration", "Journal d'activité : qui a fait quoi, et quand, dans l'administration.", { icon: "list", scope: "central", order: 30 }),
  // Outils qui n'existent PAS encore : signalés comme tels, sans lien (jamais présentés comme opérationnels)
  { id: "convertisseur-taxonomies", name: "Convertisseur de catégories et d'étiquettes", description: "Convertir des catégories en étiquettes (et inversement). Pas encore développé dans Kolakisa : aucune conversion n'est disponible.", category: "diagnostic", icon: "shuffle", state: "planned", permission: "taxonomies.write", order: 90 },
].forEach((e) => { try { register(e); } catch (error) { console.error("[outils] enregistrement impossible :", error.message); } });

// ---------- Disponibilité pour (utilisateur, site) ----------
// ctx : { can(permission), siteId (null = site principal), siteOnly (accès limité à un site), organizationId, siteName, moduleEnabled(module) (facultatif : par défaut, l'activation réelle du site) }
function hrefOf(e, ctx, siteItems) {
  if (e.href) return ctx.siteId ? `${e.href}${e.href.includes("?") ? "&" : "?"}site=${ctx.siteId}` : e.href;
  if (!ctx.siteId) return (nav.itemOf(e.navKey) || {}).href || null;
  const it = siteItems.get(e.navKey);
  return it && !it.disabled && it.href ? it.href : null; // absent du menu d'un site (fonction centrale) : pas de destination dans ce site
}
function catalog(ctx) {
  const M = require("../marketing/siteModules");
  const enabled = ctx.moduleEnabled || ((m) => M.isEnabled(db, ctx.organizationId, ctx.siteId, m));
  const siteItems = new Map();
  if (ctx.siteId) {
    const space = { siteId: ctx.siteId, principal: false, base: `${nav.BASE}/sites/${ctx.siteId}`, name: ctx.siteName || "Site", listHref: `${nav.BASE}/sites`, limited: Boolean(ctx.siteOnly) };
    for (const g of nav.projectSections(space)) for (const i of g.items) siteItems.set(i.key, i);
  }
  const cards = [], skipped = [];
  // Instantané trié : une entrée dont on ne peut même pas lire l'ordre ou le nom est écartée, jamais fatale pour le catalogue
  const entries = [];
  for (const e of REGISTRY) { try { entries.push({ e, order: Number(e.order) || 500, name: String(e.name) }); } catch (error) { skipped.push(e && e.id); console.error(`[outils] outil « ${e && e.id} » ignoré :`, String(error.message).slice(0, 200)); } }
  entries.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "fr"));
  for (const { e } of entries) {
    try {
      if (e.scope === "central" && (ctx.siteId || ctx.siteOnly)) continue; // fonction de l'installation : jamais dans l'espace d'un site
      if (e.scope === "site" && !ctx.siteId) continue;
      const perms = [].concat(e.permission || []);
      if (perms.length && !perms.some((p) => ctx.can(p))) continue; // aucune permission : la carte n'existe pas pour cette personne
      const base = { id: e.id, name: e.name, description: e.description, category: e.category, icon: e.icon, source: e.source };
      if (e.state === "planned") { cards.push({ ...base, state: "planned", stateLabel: "Pas encore disponible", href: null }); continue; }
      if (e.module && ctx.siteId && !enabled(e.module)) {
        const canEnable = ctx.can("sites.modules") && !ctx.siteOnly;
        cards.push({ ...base, state: "disabled", stateLabel: `Extension « ${M.MODULES[e.module].label} » désactivée sur ce site`, href: null, enable: canEnable ? `${nav.BASE}/sites/${ctx.siteId}/modules` : null });
        continue;
      }
      const href = hrefOf(e, ctx, siteItems);
      if (!href) continue;
      cards.push({ ...base, state: "available", stateLabel: null, href });
    } catch (error) { skipped.push(e.id); console.error(`[outils] outil « ${e && e.id} » ignoré :`, String(error.message).slice(0, 200)); }
  }
  const groups = CATEGORIES.map((c) => ({ ...c, tools: cards.filter((t) => t.category === c.key && t.state !== "planned") })).filter((g) => g.tools.length);
  const planned = cards.filter((t) => t.state === "planned");
  return { groups, planned, count: cards.length - planned.length, empty: cards.length === 0, skipped };
}

module.exports = { register, unregister, catalog, CATEGORIES, REGISTRY };
