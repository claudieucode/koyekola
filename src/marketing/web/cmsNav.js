// Registre de navigation de KOLAKISA CMS (l'environnement « Site Web ») : source UNIQUE du menu latéral, du fil d'Ariane
// et des routes des écrans du CMS. Il coexiste avec nav.js (menu du Marketing) : une page dont la clé `active` figure ici
// s'affiche dans la coque CMS (même coque, mêmes composants et même charte que le reste de KOLAKISA), les autres gardent
// le menu Marketing. Rien ici n'accède à la base : c'est de la structure.
//
// `live` : l'écran montre des données réelles ou ouvre une fonctionnalité qui existe déjà.
// `preview` : l'écran est l'interface définitive d'une fonctionnalité d'un prochain palier (badge « Bientôt » dans le menu,
// bandeau explicite sur l'écran, aucune donnée inventée, aucune action simulée).
const BASE = "/marketing/site-web";

const leaf = (key, label, href, extra = {}) => ({ key, label, href, status: "live", permission: "forms.read", ...extra });

// Les clés « sitedash », « sites », « landing » et « pagetests » sont celles que passent déjà les écrans existants
// (tableau de bord, sites, pages, tests A/B) : ils entrent dans la coque CMS sans changer.
const SECTIONS = [
  // centralOnly : « Mes sites » est l'unique rubrique du gestionnaire central ; elle n'est PAS une entrée du menu d'un site (le retour se fait par « Retour à Mes sites » dans l'en-tête du site)
  { key: "sites", label: "Mes sites", icon: "globe", centralOnly: true, items: [leaf("sites", "Mes sites", `${BASE}/sites`, { primary: { label: "Créer un site", href: `${BASE}/sites#nouveau`, permission: "forms.write" } })] },
  { key: "dashboard", label: "Site principal", icon: "activity", items: [leaf("sitedash", "Tableau de bord du site principal", BASE)] },
  { key: "pages", label: "Pages", icon: "layout", items: [leaf("landing", "Pages", "/marketing/pages", { primary: { label: "Ajouter une page", href: "/marketing/pages#nouvelle", permission: "forms.write" } })] },
  {
    key: "articles", label: "Articles", icon: "fileText", items: [
      leaf("articles", "Tous les articles", `${BASE}/articles`, { permission: "articles.read", primary: { label: "Nouvel article", href: `${BASE}/articles/ajouter`, permission: "articles.write" } }),
      // Créer un article exige articles.write (tous) OU articles.edit_own (les siens) : un lecteur ne voit pas un lien qui répondrait 403
      leaf("articles/ajouter", "Ajouter", `${BASE}/articles/ajouter`, { permission: "articles.write", anyOf: ["articles.write", "articles.edit_own"] }),
      leaf("articles/brouillons", "Brouillons", `${BASE}/articles/brouillons`, { permission: "articles.read" }),
      leaf("articles/programmes", "Programmés", `${BASE}/articles/programmes`, { permission: "articles.read" }),
      leaf("articles/publies", "Publiés", `${BASE}/articles/publies`, { permission: "articles.read" }),
      leaf("articles/corbeille", "Corbeille", `${BASE}/articles/corbeille`, { permission: "articles.read" }),
      leaf("articles/categories", "Catégories", `${BASE}/articles/categories`, { permission: "taxonomies.read" }),
      leaf("articles/etiquettes", "Étiquettes", `${BASE}/articles/etiquettes`, { permission: "taxonomies.read" }),
      leaf("articles/auteurs", "Auteurs", `${BASE}/articles/auteurs`, { permission: "articles.read" }),
    ],
  },
  { key: "mediatheque", label: "Médias", icon: "image", items: [leaf("mediatheque", "Médiathèque", `${BASE}/mediatheque`, { permission: "media.read" }), leaf("mediatheque/ajouter", "Ajouter un fichier média", `${BASE}/mediatheque/ajouter`, { permission: "media.upload" })] },
  {
    key: "commentaires", label: "Commentaires", icon: "inbox", items: [
      leaf("commentaires", "Tous", `${BASE}/commentaires`, { permission: "comments.read" }),
      leaf("commentaires/en-attente", "En attente", `${BASE}/commentaires/en-attente`, { permission: "comments.read" }),
      leaf("commentaires/approuves", "Approuvés", `${BASE}/commentaires/approuves`, { permission: "comments.read" }),
      leaf("commentaires/indesirables", "Indésirables", `${BASE}/commentaires/indesirables`, { permission: "comments.read" }),
      leaf("commentaires/corbeille", "Corbeille", `${BASE}/commentaires/corbeille`, { permission: "comments.read" }),
    ],
  },
  {
    key: "apparence", label: "Apparence", icon: "palette", items: [
      leaf("apparence", "Éditeur du site", `${BASE}/apparence`, { permission: "appearance.read" }),
      leaf("apparence/templates", "Templates", `${BASE}/apparence/templates`, { permission: "appearance.read" }),
      leaf("apparence/patterns", "Patterns", `${BASE}/apparence/patterns`, { permission: "appearance.read" }),
      leaf("apparence/styles", "Styles", `${BASE}/apparence/styles`, { permission: "appearance.read" }),
      leaf("apparence/en-tete", "En-tête", `${BASE}/apparence/en-tete`, { permission: "appearance.read" }),
      leaf("apparence/pied-de-page", "Pied de page", `${BASE}/apparence/pied-de-page`, { permission: "appearance.read" }),
      leaf("apparence/menus", "Menus", `${BASE}/apparence/menus`, { permission: "navigation.read" }),
    ],
  },
  // Extensions : modules activables PAR SITE (registre fermé siteModules.js). L'activation est réservée à l'équipe de l'organisation ; elle s'ajoute aux permissions et à l'isolation par site.
  { key: "extensions", label: "Extensions", icon: "plug", items: [leaf("extensions", "Modules", `${BASE}/extensions`, { permission: "sites.modules", teamOnly: true })] },
  {
    key: "utilisateurs", label: "Utilisateurs", icon: "users", items: [
      leaf("utilisateurs", "Tous les utilisateurs", `${BASE}/utilisateurs`, { permission: "users.view" }),
      leaf("utilisateurs/ajouter", "Inviter", `${BASE}/utilisateurs/ajouter`, { permission: "users.create" }),
      leaf("utilisateurs/roles", "Rôles", `${BASE}/utilisateurs/roles`, { permission: "users.view" }),
      leaf("utilisateurs/permissions", "Permissions", `${BASE}/utilisateurs/permissions`, { permission: "users.view" }),
      leaf("utilisateurs/invitations", "Invitations", `${BASE}/utilisateurs/invitations`, { permission: "users.view" }),
    ],
  },
  {
    key: "seo", label: "SEO", icon: "searchCheck", items: [
      leaf("seo", "Vue générale", `${BASE}/seo`, { permission: "seo.view" }),
      leaf("seo/analyse", "Analyse SEO", `${BASE}/seo/analyse`),
      leaf("seo/meta", "Meta", `${BASE}/seo/meta`),
      leaf("seo/indexation", "Indexation", `${BASE}/seo/indexation`),
      leaf("seo/sitemap", "Sitemap", `${BASE}/seo/sitemap`),
      leaf("seo/schema", "Schema", `${BASE}/seo/schema`),
      leaf("seo/open-graph", "Open Graph", `${BASE}/seo/open-graph`),
      leaf("seo/robots", "Robots", `${BASE}/seo/robots`),
      leaf("seo/404", "Erreurs 404", `${BASE}/seo/404`, { permission: "seo.view" }),
    ],
  },
  { key: "redirections", label: "Redirections", icon: "arrowRightLeft", items: [
    leaf("redirections", "Redirections", `${BASE}/redirections`, { permission: "redirects.view" }),
    leaf("redirections/liens-casses", "Liens cassés", `${BASE}/liens-casses`, { permission: "redirects.view" }),
    leaf("redirections/permaliens", "Permaliens et adresses", `${BASE}/permaliens`, { permission: "redirects.view" }),
  ] },
  { key: "tests", label: "Tests A/B", icon: "shuffle", items: [leaf("pagetests", "Tests A/B", `${BASE}/tests-ab`)] },
  { key: "navigation", label: "Navigation", icon: "menu", items: [leaf("navigation", "Navigation", `${BASE}/navigation`, { permission: "navigation.read" })] },
  {
    key: "outils", label: "Outils", icon: "sliders", items: [
      leaf("outils", "Santé du site", `${BASE}/outils`, { permission: "tools.view" }),
      leaf("corbeille", "Corbeille", `${BASE}/corbeille`, { permission: "revisions.view" }),
      leaf("outils/importer", "Importer", `${BASE}/outils/importer`, { permission: "tools.import" }),
      leaf("outils/exporter", "Exporter", `${BASE}/outils/exporter`, { permission: "tools.export" }),
      leaf("outils/sauvegardes", "Sauvegardes", `${BASE}/outils/sauvegardes`, { permission: "tools.view" }),
      leaf("outils/diagnostic", "Diagnostic", `${BASE}/outils/diagnostic`, { permission: "tools.view" }),
      leaf("outils/systeme", "Informations système", `${BASE}/outils/systeme`, { permission: "tools.view" }),
      leaf("outils/maintenance", "Maintenance", `${BASE}/outils/maintenance`, { permission: "tools.maintenance" }),
      leaf("outils/cache", "Caches", `${BASE}/outils/cache`, { permission: "tools.cache" }),
      leaf("outils/contenu", "Outils de contenu", `${BASE}/outils/contenu`, { permission: "tools.content" }),
      leaf("outils/logs", "Journal d'activité", `${BASE}/outils/logs`, { permission: "tools.view" }),
    ],
  },
  {
    key: "parametres", label: "Paramètres", icon: "settings", items: [
      leaf("parametres", "Général", `${BASE}/parametres`, { permission: "settings.read" }),
      leaf("parametres/lecture", "Lecture", `${BASE}/parametres/lecture`, { permission: "settings.read" }),
      leaf("parametres/commentaires", "Commentaires", `${BASE}/parametres/commentaires`, { permission: "settings.read" }),
      leaf("parametres/medias", "Médias", `${BASE}/parametres/medias`, { permission: "settings.read" }),
      leaf("parametres/permaliens", "Permaliens", `${BASE}/parametres/permaliens`, { permission: "settings.read" }),
      leaf("parametres/seo", "SEO", `${BASE}/parametres/seo`, { permission: "settings.read" }),
      leaf("parametres/confidentialite", "Confidentialité", `${BASE}/parametres/confidentialite`, { permission: "settings.read" }),
      leaf("parametres/indexation", "Indexation", `${BASE}/parametres/indexation`, { permission: "settings.read" }),
      leaf("parametres/emailing", "Emailing", `${BASE}/parametres/emailing`, { permission: "settings.read" }),
      leaf("parametres/tunnels", "Tunnels", `${BASE}/parametres/tunnels`, { permission: "settings.read" }),
      leaf("parametres/avance", "Avancé", `${BASE}/parametres/avance`, { permission: "settings.read" }),
    ],
  },
];

const ALL = SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.key })));
const sectionOf = (key) => SECTIONS.find((s) => s.key === key);
const itemOf = (key) => ALL.find((i) => i.key === key) || null;
const isCmsKey = (key) => ALL.some((i) => i.key === key);

// Clés servies par le routeur générique des écrans CMS (cmsScreens) : celles dont la route n'existe pas déjà ailleurs.
const GENERIC_SECTIONS = ["articles", "navigation", "apparence", "commentaires", "extensions", "utilisateurs", "seo", "redirections", "outils"];

// Menu affiché pour un rôle : uniquement les entrées permises ; une section à une seule entrée devient un lien direct.
function buildCmsNav({ can, active, space = null }) {
  if (space) return buildSiteNav({ can, active, space });
  const current = itemOf(active);
  if (!current) return null;
  const sections = [];
  for (const s of SECTIONS) {
    if (!s.centralOnly) continue; // gestionnaire central : seulement la gestion des sites ; le contenu (pages, articles…) est celui d'UN site, dans son espace
    const items = s.items.filter((i) => (i.anyOf ? i.anyOf.some((p) => can(p)) : can(i.permission))).map((i) => ({ key: i.key, label: i.label, href: i.href, status: i.status, current: i.key === active }));
    if (!items.length) continue;
    sections.push({ key: s.key, label: s.label, icon: s.icon, items, flat: items.length === 1, open: items.some((i) => i.current), soon: items.length === 1 && items[0].status === "preview" });
  }
  const section = sectionOf(current.section);
  // Fil d'Ariane : Site Web (le CMS) → rubrique → écran
  const trail = [{ label: "Site Web", href: BASE }];
  if (current.key !== "sitedash") {
    if (section.items.length > 1) trail.push({ label: section.label, href: section.items[0].href });
    if (section.items.length === 1 || current.key !== section.items[0].key) trail.push({ label: current.label, href: current.href });
  }
  const primary = current.primary && can(current.primary.permission) ? { label: current.primary.label, href: current.primary.href } : null;
  return { sections, trail, primary, current, section };
}

// ---------- Espace d'un site (palier 3, B1 → lot P1a) ----------
// Le MÊME moteur et les MÊMES écrans, vus d'UN site : adresses /marketing/site-web/sites/<id>/<module> (ou /principal/<module>).
// space = { siteId (nombre | null), principal (booléen), base (préfixe d'adresse), name, listHref }. Le site vient de l'adresse vérifiée par le serveur.
//
// P1a : le menu d'un site n'est plus une définition parallèle. Il est la PROJECTION du registre SECTIONS : mêmes groupes, mêmes libellés,
// même ordre (le plan ci-dessous ne fait que dire, pour chaque groupe, quels modules s'ouvrent pour un site). Un module est :
//   own      : écran de l'espace du site (données de CE site seulement) ;
//   delegate : écran PARTAGÉ existant (Emailing, Tests A/B, Analytics, Santé du site) ouvert par /sites/<id>/<module> : le site vient de l'adresse,
//              l'écran reste le même et s'affiche dans le cadre du site ;
//   soon     : module d'un prochain lot (« Bientôt ») : aucune donnée, aucune action.
// Un groupe dont aucun module n'est disponible apparaît en UNE seule entrée « Bientôt ». Les modules des lots P1b et P1c n'apparaissent pas encore.
const SOON_PHASE = { B2: "médias", B3: "modèles et blocs", B4: "formulaires et contacts", B5: "blog", B6: "SEO" };
const SITE_MODULES = {
  "tableau-de-bord": { label: "Tableau de bord", kind: "own", reg: "sitedash", permission: "forms.read" },
  pages: { label: "Pages", kind: "own", reg: "landing", permission: "forms.read", primary: true },
  composants: { label: "Composants", kind: "own", permission: "forms.read" },
  redirections: { label: "Redirections", kind: "own", reg: "redirections", permission: "redirects.view" },
  equipe: { label: "Équipe du site", kind: "own", reg: "utilisateurs", permission: "users.view", legacy: `${BASE}/utilisateurs` },
  reglages: { label: "Réglages du site", kind: "own", permission: "settings.read", legacy: `${BASE}/parametres`, legacyLabel: "Paramètres du site principal" },
  // R8 lot 2 : Articles, Commentaires et Médias s'ouvrent dans le cadre du site (écrans existants, isolation R5/R6 : le site vient de l'adresse, jamais du navigateur)
  articles: { label: "Articles", kind: "delegate", to: "/site-web/articles", reg: "articles", permission: "articles.read", legacy: `${BASE}/articles` },
  categories: { label: "Catégories et étiquettes", kind: "delegate", to: "/site-web/articles/categories", reg: "articles/categories", permission: "taxonomies.read", legacy: `${BASE}/articles/categories` },
  commentaires: { label: "Commentaires", kind: "delegate", to: "/site-web/commentaires", reg: "commentaires", permission: "comments.read", legacy: `${BASE}/commentaires` },
  medias: { label: "Médias", kind: "delegate", to: "/site-web/mediatheque", reg: "mediatheque", permission: "media.read", legacy: `${BASE}/mediatheque` },
  // R8 lot 3 : Formulaires et Contacts s'ouvrent dans le cadre du site (isolation R7 : formulaires, contacts, consentements, demandes de rattachement ; le site vient de l'adresse)
  formulaires: { label: "Formulaires", kind: "delegate", to: "/formulaires", reg: "forms", permission: "forms.read", legacy: "/marketing/formulaires", legacyLabel: "Formulaires" },
  contacts: { label: "Contacts", kind: "delegate", to: "/contacts", reg: "contacts", permission: "contacts.read", legacy: "/marketing/contacts" },
  // R8 lot 6D : import de contacts PROPRE au site (fichier, correspondance, analyse obligatoire, doublons inter-sites traités par l'équipe)
  importer: { label: "Importer des contacts", kind: "own", reg: "import", permission: "contacts.import", legacy: "/marketing/importer" },
  modeles: { label: "Modèles et blocs", kind: "soon", phase: "B3", permission: "appearance.read", legacy: `${BASE}/apparence/templates` },
  // R8 lot 4 : Navigation / Menus par site (menus et emplacements PROPRES au site ; ressources limitées à celles du site)
  navigation: { label: "Menus", kind: "delegate", to: "/site-web/navigation", reg: "navigation", permission: "navigation.read", legacy: `${BASE}/navigation` },
  // R8 lot 6C : SEO du site = réglages SEO du site + erreurs 404 du site (les autres écrans SEO restent « Bientôt » : leur isolation n'est pas démontrée)
  seo: { label: "SEO", kind: "own", permission: "seo.view", legacy: `${BASE}/seo`, reg: "seo" },
  // Écrans partagés ouverts dans le cadre du site. `to` = adresse de l'écran existant, relative au routeur d'administration ; `reg` = sa clé `active`.
  listes: { label: "Listes", kind: "delegate", to: "/listes", reg: "lists", permission: "lists.read", legacy: "/marketing/listes" },
  segments: { label: "Segments", kind: "delegate", to: "/segments", reg: "segments", permission: "segments.read", legacy: "/marketing/segments" },
  "modeles-email": { label: "Modèles d'e-mail", kind: "delegate", to: "/modeles", reg: "templates", permission: "templates.read", legacy: "/marketing/modeles" },
  campagnes: { label: "Campagnes", kind: "delegate", to: "/campagnes", reg: "campaigns", permission: "campaigns.read", legacy: "/marketing/campagnes" },
  automatisations: { label: "Automatisations", kind: "delegate", to: "/automatisations", reg: "automations", permission: "automations.read", legacy: "/marketing/automatisations" },
  tunnels: { label: "Tunnels", kind: "delegate", to: "/tunnels", reg: "funnels", permission: "funnels.read", legacy: "/marketing/tunnels" },
  "tests-ab": { label: "Tests A/B", kind: "delegate", to: "/site-web/tests-ab", reg: "pagetests", permission: "forms.read", legacy: `${BASE}/tests-ab` },
  analytics: { label: "Analytics", kind: "delegate", to: "/analytics/global", reg: "analytics-global", permission: "analytics.read", legacy: "/marketing/analytics/global" },
  outils: { label: "Santé du site", kind: "delegate", to: "/site-web/outils", reg: "outils", permission: "tools.view", legacy: `${BASE}/outils` },
};
// Modules délégués : tables lues par le serveur (délégation) et par la vue (écrans à afficher dans le cadre du site)
const DELEGATED = Object.fromEntries(Object.entries(SITE_MODULES).filter(([, m]) => m.kind === "delegate").map(([k, m]) => [k, m.to]));
const SCOPED_KEYS = new Set(Object.values(SITE_MODULES).filter((m) => m.kind === "delegate").map((m) => m.reg));
// Un écran partagé prend le cadre du site seulement s'il est déclaré propre au site ET que le serveur a vérifié un site pour la requête
// Sous-pages (une seule position) d'un module délégué, ouvertes dans le cadre du site : liste FERMÉE, jamais déduite de l'adresse
const NESTED = Object.freeze({
  articles: ["ajouter", "brouillons", "programmes", "publies", "corbeille", "categories", "etiquettes", "auteurs"],
  commentaires: ["en-attente", "approuves", "indesirables", "corbeille"],
  contacts: ["nouveau", "demandes"],
});
// Entrées du registre ouvertes comme sous-pages déléguées : leur clé `active` prend aussi le cadre du site quand le serveur a vérifié un site
const FRAMED = new Set();
const isSiteScopedKey = (key) => SCOPED_KEYS.has(key) || FRAMED.has(key);

// Un module vu depuis un espace : { key, label, href, status, phase, permission, external, reg, primary }
function siteModule(space, mod) {
  const m = SITE_MODULES[mod];
  if (!m) return null;
  const P = space.principal;
  const own = (m.kind === "own" || m.kind === "soon") && !(P && m.legacy); // servi par le routeur de l'espace (les modules délégués passent par l'écran existant)
  const legacyHref = P && m.legacy;
  const href = legacyHref || `${space.base}/${mod}`;
  const status = m.kind === "soon" && !P ? "preview" : "live";
  return {
    key: `espace/${mod}`, module: mod, label: P && m.legacyLabel ? m.legacyLabel : m.label, href, status, phase: m.kind === "soon" && !P ? m.phase : undefined,
    permission: m.permission, external: !own, reg: m.reg || null, kind: m.kind,
    ...(m.primary ? { primary: { label: "Ajouter une page", href: `${space.base}/pages#nouvelle`, permission: "forms.write" } } : {}),
  };
}
const siteModuleOf = (space, mod) => siteModule(space, mod);

// ─── UNE SEULE définition du menu : le registre SECTIONS ────────────────────────────────────────────────────────────────────────────
// Le menu du site principal et celui d'un site sont deux PRÉSENTATIONS de ce registre, calculées par la même fonction (projectSections) :
// mêmes groupes, mêmes entrées, mêmes libellés, même ordre, mêmes clés, mêmes icônes. Seule différence permise : l'ÉTAT d'une entrée dans un site.
// ABILITY dit, pour une entrée du registre (par sa clé), ce qu'elle devient dans l'espace d'UN site :
//   link    : lien simple (Mes sites) ;
//   open    : écran ouvert dans le cadre du site (`module` = SITE_MODULES[module], `hash` = ancre éventuelle) ;
//   central : reste dans l'administration centrale (décision 4) : absente du menu d'un site ;
//   (absente) : « Bientôt » — visible, grisée, sans action ni donnée. Une entrée du registre qui n'est PAS listée ici n'est donc jamais
//   ouverte à un site par défaut : un module n'est activé qu'après démonstration de son isolation.
const ABILITY = {
  sites: { mode: "link" },
  sitedash: { mode: "open", module: "tableau-de-bord", label: "Tableau de bord" },
  landing: { mode: "open", module: "pages" },
  apparence: { mode: "open", module: "reglages", hash: "design" },
  "apparence/en-tete": { mode: "open", module: "reglages", hash: "entete" },
  "apparence/pied-de-page": { mode: "open", module: "reglages", hash: "entete" },
  redirections: { mode: "open", module: "redirections" },
  seo: { mode: "open", module: "seo" },
  "seo/404": { mode: "open", module: "seo", sub: "404" },
  utilisateurs: { mode: "open", module: "equipe" },
  pagetests: { mode: "open", module: "tests-ab" },
  outils: { mode: "open", module: "outils" },
  parametres: { mode: "open", module: "reglages" },
  // R8 lot 2 : contenus déjà isolés par site (R5 médias, R6 articles/termes/commentaires), ouverts par délégation (`sub` = sous-page de la liste fermée NESTED)
  articles: { mode: "open", module: "articles" },
  "articles/brouillons": { mode: "open", module: "articles", sub: "brouillons" },
  "articles/programmes": { mode: "open", module: "articles", sub: "programmes" },
  "articles/publies": { mode: "open", module: "articles", sub: "publies" },
  "articles/corbeille": { mode: "open", module: "articles", sub: "corbeille" },
  "articles/categories": { mode: "open", module: "articles", sub: "categories" },
  "articles/etiquettes": { mode: "open", module: "articles", sub: "etiquettes" },
  "articles/ajouter": { mode: "open", module: "articles", sub: "ajouter" }, // création : permise aux accès limités (éditeur ouvert, contenus-par-site-editeur)
  "articles/auteurs": { mode: "open", module: "articles", sub: "auteurs" },
  mediatheque: { mode: "open", module: "medias" },
  "mediatheque/ajouter": { mode: "open", module: "medias" },
  navigation: { mode: "open", module: "navigation" },
  "apparence/menus": { mode: "open", module: "navigation" },
  commentaires: { mode: "open", module: "commentaires" },
  "commentaires/en-attente": { mode: "open", module: "commentaires", sub: "en-attente" },
  "commentaires/approuves": { mode: "open", module: "commentaires", sub: "approuves" },
  "commentaires/indesirables": { mode: "open", module: "commentaires", sub: "indesirables" },
  "commentaires/corbeille": { mode: "open", module: "commentaires", sub: "corbeille" },
  extensions: { mode: "central" }, // activation des modules : équipe de l'organisation, depuis le site principal (écran par site : /sites/N/modules)
  "outils/sauvegardes": { mode: "central" },
  "outils/systeme": { mode: "central" },
  "outils/logs": { mode: "central" },
};
// Lot où une entrée « Bientôt » sera ouverte (texte de l'écran explicatif : SOON_TEXT de siteSpace.js)
const soonPhase = (key) => {
  if (key.startsWith("articles") || key.startsWith("commentaires")) return "B5";
  if (key === "mediatheque") return "B2";
  if (key === "apparence/templates" || key === "apparence/patterns") return "B3";
  if (key === "apparence/styles") return "P2";
  if (key === "navigation" || key === "apparence/menus") return "menus";
  if (key.startsWith("seo")) return "B6";
  if (key === "corbeille") return "corbeille";
  return "C4";
};
// Anciennes adresses d'écrans « Bientôt » (/sites/N/articles, …) : elles continuent d'afficher leur explication
const SOON_SLUG = { articles: "articles", mediatheque: "medias", navigation: "navigation", commentaires: "commentaires", seo: "seo" };

// Extensions de l'espace, communes au principal et aux sites (hors registre) : Composants (groupe Pages) et le groupe « Marketing du site »
const MARKETING_MODULES = ["listes", "segments", "modeles-email", "campagnes", "automatisations", "tunnels", "analytics", "formulaires", "contacts", "importer"];
function marketingGroup(space) {
  const P = space.principal;
  const items = MARKETING_MODULES.map((m) => {
    if (P) { const x = SITE_MODULES[m] || { label: "Contacts", legacy: "/marketing/contacts", permission: "forms.read" }; return { key: `espace/${m}`, module: m, label: x.legacyLabel || x.label, href: x.legacy, status: "live", permission: x.permission, reg: x.reg || null, section: "marketing" }; }
    const it = siteModule(space, m);
    return it.status === "preview" ? { ...it, href: null, disabled: true } : it;
  });
  return { key: "marketing", label: "Marketing du site", icon: "mail", items };
}

// Une entrée du registre vue depuis un espace : { key, label, href, status, permission, reg, alias?, disabled?, phase?, primary? } — ou null (central)
function projectItem(item, group, space) {
  const base = { key: item.key, label: item.label, permission: item.permission, reg: item.key, section: group.key, ...(item.anyOf ? { anyOf: item.anyOf } : {}) };
  // Dans son espace, le principal a le même « Tableau de bord » que tout autre site, à l'adresse de SON espace
  if (space.principal) return item.key === "sitedash" ? { ...item, ...base, label: "Tableau de bord", href: `${space.base}/tableau-de-bord` } : { ...item, ...base };
  const a = ABILITY[item.key];
  if (a && a.mode === "central") return null;
  if (a && a.mode === "link") return { ...base, href: space.listHref || `${BASE}/sites`, status: "live", external: true };
  if (a && a.mode === "open") {
    if (a.teamOnly && space.limited) return null; // création d'article : réservée à l'équipe (décision A-D9 non approuvée) → absente du menu d'un accès limité
    const m = siteModule(space, a.module);
    const href = a.sub ? `${m.href}/${a.sub}` : m.href;
    return { ...base, label: a.label || item.label, href: a.hash ? `${m.href}#${a.hash}` : href, status: "live", external: m.external, ...(a.hash || a.sub ? {} : { alias: `espace/${a.module}` }), module: a.module, ...(m.primary ? { primary: m.primary } : {}) };
  }
  const slug = SOON_SLUG[item.key];
  return { ...base, href: null, status: "preview", disabled: true, phase: soonPhase(item.key), ...(slug ? { alias: `espace/${slug}`, module: slug } : {}) };
}

// LA fonction qui produit le menu d'un espace (principal ou site) à partir du registre
function projectSections(space) {
  const out = [];
  for (const s of SECTIONS) {
    if (s.centralOnly) continue;
    if (s.key === "navigation") out.push(marketingGroup(space)); // « Marketing du site » vient juste avant Navigation, Outils et Paramètres
    const items = s.items.map((i) => projectItem(i, s, space)).filter(Boolean);
    if (s.key === "pages") items.push({ ...siteModule(space, "composants"), section: "pages" });
    if (items.length) out.push({ key: s.key, label: s.label, icon: s.icon, items });
  }
  return out;
}
const siteSections = projectSections;
const principalSections = projectSections;
// Les écrans propres de l'espace du principal portent leur clé `espace/…` : on les rattache à leur entrée du registre.
const PRINCIPAL_ALIAS = { "espace/tableau-de-bord": "sitedash", "espace/pages": "landing", "espace/redirections": "redirections" };

function buildSiteNav({ can, active, space }) {
  const all = projectSections(space);
  const flat = all.flatMap((sec) => sec.items.map((i) => ({ ...i, section: sec.key })));
  // Un écran existant garde son cadre : on retrouve son entrée par sa clé `active` propre OU par la clé qu'il porte déjà dans le registre
  const regKey = space.principal && PRINCIPAL_ALIAS[active] ? PRINCIPAL_ALIAS[active] : active;
  const hit = (i) => (i.reg && i.reg === regKey) || i.key === regKey || i.alias === regKey;
  const current = flat.find((i) => i.key === active) || flat.find(hit) || null;
  if (!current) return null;
  const sections = [];
  for (const sec of all) {
    const items = sec.items.filter((i) => (i.anyOf ? i.anyOf.some((p) => can(p)) : can(i.permission))).map((i) => ({ key: i.key, label: i.label, href: i.href, status: i.status, current: i.key === current.key, ...(i.disabled ? { disabled: true, phase: i.phase } : {}) }));
    if (!items.length) continue;
    sections.push({ key: sec.key, label: sec.label, icon: sec.icon, items, flat: items.length === 1, open: items.some((i) => i.current), soon: items.length === 1 && items[0].status === "preview" });
  }
  const sec = all.find((x) => x.key === current.section);
  const trail = [{ label: "Site Web", href: BASE }, { label: "Mes sites", href: space.listHref || `${BASE}/sites` }, { label: space.name, href: `${space.base}/tableau-de-bord` }];
  if (current.module !== "tableau-de-bord") { if (sec.items.length > 1 && sec.label !== current.label) trail.push({ label: sec.label }); trail.push({ label: current.label, href: current.href }); }
  const primary = current.primary && can(current.primary.permission) ? { label: current.primary.label, href: current.primary.href } : null;
  return { sections, trail, primary, current, section: sec, space };
}

for (const [key, a] of Object.entries(ABILITY)) if (a.mode === "open" && a.sub) FRAMED.add(key);
FRAMED.add("apparence/menus"); // même écran que « Navigation » (clé active distincte)
FRAMED.add("landing"); // écran d'une page (et son éditeur) : une page d'un site garde le cadre DE CE SITE (menu, bandeau, tableau de bord) au lieu du cadre central du principal
module.exports = { NESTED, BASE, SECTIONS, ALL, GENERIC_SECTIONS, SOON_PHASE, SITE_MODULES, ABILITY, DELEGATED, buildCmsNav, buildSiteNav, projectSections, siteSections, principalSections, siteModuleOf, isSiteScopedKey, isCmsKey, itemOf, sectionOf };
