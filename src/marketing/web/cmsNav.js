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
  { key: "sites", label: "Mes sites", icon: "globe", items: [leaf("sites", "Mes sites", `${BASE}/sites`, { primary: { label: "Créer un site", href: `${BASE}/sites#nouveau`, permission: "forms.write" } })] },
  { key: "dashboard", label: "Site principal", icon: "activity", items: [leaf("sitedash", "Tableau de bord du site principal", BASE)] },
  { key: "pages", label: "Pages", icon: "layout", items: [leaf("landing", "Pages", "/marketing/pages", { primary: { label: "Ajouter une page", href: "/marketing/pages#nouvelle", permission: "forms.write" } })] },
  {
    key: "articles", label: "Articles", icon: "fileText", items: [
      leaf("articles", "Tous les articles", `${BASE}/articles`, { permission: "articles.read", primary: { label: "Nouvel article", href: `${BASE}/articles/ajouter`, permission: "articles.write" } }),
      leaf("articles/ajouter", "Ajouter", `${BASE}/articles/ajouter`, { permission: "articles.read" }),
      leaf("articles/brouillons", "Brouillons", `${BASE}/articles/brouillons`, { permission: "articles.read" }),
      leaf("articles/programmes", "Programmés", `${BASE}/articles/programmes`, { permission: "articles.read" }),
      leaf("articles/publies", "Publiés", `${BASE}/articles/publies`, { permission: "articles.read" }),
      leaf("articles/corbeille", "Corbeille", `${BASE}/articles/corbeille`, { permission: "articles.read" }),
      leaf("articles/categories", "Catégories", `${BASE}/articles/categories`, { permission: "taxonomies.read" }),
      leaf("articles/etiquettes", "Étiquettes", `${BASE}/articles/etiquettes`, { permission: "taxonomies.read" }),
      leaf("articles/auteurs", "Auteurs", `${BASE}/articles/auteurs`, { permission: "articles.read" }),
    ],
  },
  { key: "mediatheque", label: "Médias", icon: "image", items: [leaf("mediatheque", "Médias", `${BASE}/mediatheque`, { permission: "media.read" })] },
  { key: "navigation", label: "Navigation", icon: "menu", items: [leaf("navigation", "Navigation", `${BASE}/navigation`, { permission: "navigation.read" })] },
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
      leaf("seo", "Vue générale", `${BASE}/seo`),
      leaf("seo/analyse", "Analyse SEO", `${BASE}/seo/analyse`),
      leaf("seo/meta", "Meta", `${BASE}/seo/meta`),
      leaf("seo/indexation", "Indexation", `${BASE}/seo/indexation`),
      leaf("seo/sitemap", "Sitemap", `${BASE}/seo/sitemap`),
      leaf("seo/schema", "Schema", `${BASE}/seo/schema`),
      leaf("seo/open-graph", "Open Graph", `${BASE}/seo/open-graph`),
      leaf("seo/robots", "Robots", `${BASE}/seo/robots`),
      leaf("seo/404", "Erreurs 404", `${BASE}/seo/404`),
    ],
  },
  { key: "redirections", label: "Redirections", icon: "arrowRightLeft", items: [
    leaf("redirections", "Redirections", `${BASE}/redirections`, { permission: "redirects.view" }),
    leaf("redirections/liens-casses", "Liens cassés", `${BASE}/liens-casses`, { permission: "redirects.view" }),
    leaf("redirections/permaliens", "Permaliens et adresses", `${BASE}/permaliens`, { permission: "redirects.view" }),
  ] },
  { key: "tests", label: "Tests A/B", icon: "shuffle", items: [leaf("pagetests", "Tests A/B", `${BASE}/tests-ab`)] },
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
const GENERIC_SECTIONS = ["articles", "navigation", "apparence", "commentaires", "utilisateurs", "seo", "redirections", "outils"];

// Menu affiché pour un rôle : uniquement les entrées permises ; une section à une seule entrée devient un lien direct.
function buildCmsNav({ can, active, space = null }) {
  if (space) return buildSiteNav({ can, active, space });
  const current = itemOf(active);
  if (!current) return null;
  const sections = [];
  for (const s of SECTIONS) {
    const items = s.items.filter((i) => can(i.permission)).map((i) => ({ key: i.key, label: i.label, href: i.href, status: i.status, current: i.key === active }));
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

// ---------- Espace d'un site (palier 3, B1) ----------
// Le MÊME moteur et les MÊMES écrans, vus d'UN site : adresses /marketing/site-web/sites/<id>/<module> (ou /principal/<module>).
// space = { siteId (nombre | null), principal (booléen), base (préfixe d'adresse), name }. Le site vient de l'adresse vérifiée par le serveur.
//   live    : l'écran existe et ne montre que les données de CE site ;
//   preview : module d'un prochain palier (« Bientôt ») : aucune donnée, aucune action ;
//   phase   : palier qui l'isolera (affiché sur l'écran).
const SOON_PHASE = { B2: "médias", B3: "modèles et blocs", B4: "formulaires et contacts", B5: "blog", B6: "SEO" };
function siteSections(space) {
  const s = space.base;
  const P = space.principal;
  const q = P ? "?site=principal" : `?site=${space.siteId}`;
  const own = (key, label, extra = {}) => ({ key: `espace/${key}`, label, href: `${s}/${key}`, status: "live", permission: "forms.read", ...extra });
  const out = (key, label, href, extra = {}) => ({ key: `espace/${key}`, label, href, status: "live", permission: "forms.read", external: true, ...extra });
  // Module d'un prochain palier pour un site ; le site principal garde son écran historique (déjà en service)
  const later = (key, label, phase, legacy, extra = {}) => (P && legacy ? out(key, label, legacy, extra) : { key: `espace/${key}`, label, href: `${s}/${key}`, status: "preview", phase, permission: "forms.read", ...extra });
  const G = BASE;
  return [
    { key: "tableau", label: "Tableau de bord", icon: "activity", items: [own("tableau-de-bord", "Tableau de bord")] },
    { key: "pages", label: "Pages", icon: "layout", items: [own("pages", "Pages", { primary: { label: "Ajouter une page", href: `${s}/pages#nouvelle`, permission: "forms.write" } }), own("composants", "Composants")] },
    { key: "articles", label: "Articles", icon: "fileText", items: [
      later("articles", "Articles", "B5", `${G}/articles`, { permission: "articles.read" }),
      later("categories", "Catégories et étiquettes", "B5", `${G}/articles/categories`, { permission: "taxonomies.read" }),
      later("commentaires", "Commentaires", "B5", `${G}/commentaires`, { permission: "comments.read" }),
    ] },
    { key: "medias", label: "Médias", icon: "image", items: [later("medias", "Médias", "B2", `${G}/mediatheque`, { permission: "media.read" })] },
    { key: "formulaires", label: "Formulaires et contacts", icon: "inbox", items: [
      later("formulaires", "Formulaires", "B4", "/marketing/formulaires"),
      later("contacts", "Contacts", "B4", "/marketing/contacts"),
    ] },
    { key: "apparence", label: "Apparence", icon: "palette", items: [
      P ? out("apparence", "Éditeur et styles", `${G}/apparence`, { permission: "appearance.read" }) : out("design", "Design du site", `${s}/reglages#design`, { permission: "appearance.read" }),
      P ? out("entete", "En-tête et pied de page", `${G}/apparence/en-tete`, { permission: "appearance.read" }) : out("entete", "En-tête et pied de page", `${s}/reglages#entete`, { permission: "appearance.read" }),
      P ? out("navigation", "Menus", `${G}/navigation`, { permission: "navigation.read" }) : { key: "espace/navigation", label: "Menus", href: `${s}/navigation`, status: "preview", phase: "menus", permission: "navigation.read" },
      later("modeles", "Modèles et blocs", "B3", `${G}/apparence/templates`, { permission: "appearance.read" }),
    ] },
    { key: "emailing", label: "Emailing", icon: "mail", items: [
      out("listes", "Listes", `/marketing/listes${q}`), out("segments", "Segments", `/marketing/segments${q}`), out("modeles-email", "Modèles d'e-mail", `/marketing/modeles${q}`),
      out("campagnes", "Campagnes", `/marketing/campagnes${q}`), out("automatisations", "Automatisations", `/marketing/automatisations${q}`), out("tunnels", "Tunnels", `/marketing/tunnels${q}`),
    ] },
    { key: "mesure", label: "Mesure", icon: "barChart", items: [out("tests-ab", "Tests A/B", P ? `${G}/tests-ab` : `${G}/tests-ab${q}`), out("analytique", "Analytics", P ? "/marketing/analytics/global" : `/marketing/analytics/global${q}`)] },
    { key: "seo", label: "SEO et adresses", icon: "searchCheck", items: [later("seo", "SEO", "B6", `${G}/seo`, { permission: "forms.read" }), own("redirections", "Redirections", { permission: "redirects.view" })] },
    { key: "equipe", label: "Équipe", icon: "users", items: [P ? out("equipe", "Utilisateurs", `${G}/utilisateurs`, { permission: "users.view" }) : own("equipe", "Équipe du site", { permission: "users.view" })] },
    { key: "outils", label: "Outils", icon: "sliders", items: [out("outils", "Santé du site", `${G}/outils${P ? "" : q}`, { permission: "tools.view" })] },
    { key: "reglages", label: "Réglages", icon: "settings", items: [P ? out("reglages", "Paramètres du site principal", `${G}/parametres`, { permission: "settings.read" }) : own("reglages", "Réglages du site", { permission: "settings.read" })] },
  ];
}

function buildSiteNav({ can, active, space }) {
  const all = siteSections(space);
  const flat = all.flatMap((sec) => sec.items.map((i) => ({ ...i, section: sec.key })));
  const current = flat.find((i) => i.key === active) || null;
  if (!current) return null;
  const sections = [];
  for (const sec of all) {
    const items = sec.items.filter((i) => can(i.permission)).map((i) => ({ key: i.key, label: i.label, href: i.href, status: i.status, current: i.key === active }));
    if (!items.length) continue;
    sections.push({ key: sec.key, label: sec.label, icon: sec.icon, items, flat: items.length === 1, open: items.some((i) => i.current), soon: items.length === 1 && items[0].status === "preview" });
  }
  const sec = all.find((x) => x.key === current.section);
  const trail = [{ label: "Site Web", href: BASE }, { label: "Mes sites", href: `${BASE}/sites` }, { label: space.name, href: `${space.base}/tableau-de-bord` }];
  if (current.key !== "espace/tableau-de-bord") { if (sec.items.length > 1 && sec.label !== current.label) trail.push({ label: sec.label }); trail.push({ label: current.label, href: current.href }); }
  const primary = current.primary && can(current.primary.permission) ? { label: current.primary.label, href: current.primary.href } : null;
  return { sections, trail, primary, current, section: sec, space };
}
const siteModuleOf = (space, key) => siteSections(space).flatMap((sec) => sec.items).find((i) => i.key === `espace/${key}`) || null;

module.exports = { BASE, SECTIONS, ALL, GENERIC_SECTIONS, SOON_PHASE, buildCmsNav, buildSiteNav, siteSections, siteModuleOf, isCmsKey, itemOf, sectionOf };
