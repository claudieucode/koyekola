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
  { key: "dashboard", label: "Tableau de bord", icon: "activity", items: [leaf("sitedash", "Tableau de bord", BASE)] },
  { key: "sites", label: "Sites", icon: "globe", items: [leaf("sites", "Sites", `${BASE}/sites`, { primary: { label: "Créer un site", href: `${BASE}/sites#nouveau`, permission: "forms.write" } })] },
  { key: "pages", label: "Pages", icon: "layout", items: [leaf("landing", "Pages", "/marketing/pages", { primary: { label: "Ajouter une page", href: "/marketing/pages#nouvelle", permission: "forms.write" } })] },
  {
    key: "articles", label: "Articles", icon: "fileText", items: [
      leaf("articles", "Tous les articles", `${BASE}/articles`),
      leaf("articles/ajouter", "Ajouter", `${BASE}/articles/ajouter`),
      leaf("articles/brouillons", "Brouillons", `${BASE}/articles/brouillons`),
      leaf("articles/programmes", "Programmés", `${BASE}/articles/programmes`),
      leaf("articles/publies", "Publiés", `${BASE}/articles/publies`),
      leaf("articles/categories", "Catégories", `${BASE}/articles/categories`),
      leaf("articles/etiquettes", "Étiquettes", `${BASE}/articles/etiquettes`),
      leaf("articles/auteurs", "Auteurs", `${BASE}/articles/auteurs`),
    ],
  },
  { key: "mediatheque", label: "Médias", icon: "image", items: [leaf("mediatheque", "Médias", `${BASE}/mediatheque`)] },
  { key: "navigation", label: "Navigation", icon: "menu", items: [leaf("navigation", "Navigation", `${BASE}/navigation`, { status: "preview" })] },
  {
    key: "apparence", label: "Apparence", icon: "palette", items: [
      leaf("apparence", "Éditeur du site", `${BASE}/apparence`),
      leaf("apparence/templates", "Templates", `${BASE}/apparence/templates`, { status: "preview" }),
      leaf("apparence/patterns", "Patterns", `${BASE}/apparence/patterns`, { status: "preview" }),
      leaf("apparence/styles", "Styles", `${BASE}/apparence/styles`),
      leaf("apparence/en-tete", "En-tête", `${BASE}/apparence/en-tete`),
      leaf("apparence/pied-de-page", "Pied de page", `${BASE}/apparence/pied-de-page`),
      leaf("apparence/menus", "Menus", `${BASE}/apparence/menus`, { status: "preview" }),
    ],
  },
  {
    key: "commentaires", label: "Commentaires", icon: "inbox", items: [
      leaf("commentaires", "Tous", `${BASE}/commentaires`),
      leaf("commentaires/en-attente", "En attente", `${BASE}/commentaires/en-attente`, { status: "preview" }),
      leaf("commentaires/approuves", "Approuvés", `${BASE}/commentaires/approuves`),
      leaf("commentaires/indesirables", "Indésirables", `${BASE}/commentaires/indesirables`, { status: "preview" }),
      leaf("commentaires/corbeille", "Corbeille", `${BASE}/commentaires/corbeille`, { status: "preview" }),
    ],
  },
  {
    key: "utilisateurs", label: "Utilisateurs", icon: "users", items: [
      leaf("utilisateurs", "Tous les utilisateurs", `${BASE}/utilisateurs`),
      leaf("utilisateurs/ajouter", "Ajouter", `${BASE}/utilisateurs/ajouter`, { status: "preview" }),
      leaf("utilisateurs/roles", "Rôles", `${BASE}/utilisateurs/roles`),
      leaf("utilisateurs/permissions", "Permissions", `${BASE}/utilisateurs/permissions`),
      leaf("utilisateurs/invitations", "Invitations", `${BASE}/utilisateurs/invitations`, { status: "preview" }),
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
  { key: "redirections", label: "Redirections", icon: "arrowRightLeft", items: [leaf("redirections", "Redirections", `${BASE}/redirections`)] },
  { key: "tests", label: "Tests A/B", icon: "shuffle", items: [leaf("pagetests", "Tests A/B", `${BASE}/tests-ab`)] },
  {
    key: "outils", label: "Outils", icon: "sliders", items: [
      leaf("outils", "Santé du site", `${BASE}/outils`, { status: "preview" }),
      leaf("outils/importer", "Importer", `${BASE}/outils/importer`),
      leaf("outils/exporter", "Exporter", `${BASE}/outils/exporter`),
      leaf("outils/sauvegardes", "Sauvegardes", `${BASE}/outils/sauvegardes`),
      leaf("outils/diagnostic", "Diagnostic", `${BASE}/outils/diagnostic`, { status: "preview" }),
      leaf("outils/logs", "Logs", `${BASE}/outils/logs`),
      leaf("outils/cache", "Cache", `${BASE}/outils/cache`, { status: "preview" }),
      leaf("outils/remplacer", "Recherche / remplacement", `${BASE}/outils/remplacer`, { status: "preview" }),
    ],
  },
  {
    key: "parametres", label: "Paramètres", icon: "settings", items: [
      leaf("parametres", "Général", `${BASE}/parametres`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/identite", "Identité du site", `${BASE}/parametres/identite`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/domaine", "Domaine", `${BASE}/parametres/domaine`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/urls", "URLs", `${BASE}/parametres/urls`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/permaliens", "Permaliens", `${BASE}/parametres/permaliens`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/seo", "SEO", `${BASE}/parametres/seo`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/performance", "Performance", `${BASE}/parametres/performance`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/securite", "Sécurité", `${BASE}/parametres/securite`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/confidentialite", "Confidentialité", `${BASE}/parametres/confidentialite`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/cookies", "Cookies", `${BASE}/parametres/cookies`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/scripts", "Scripts", `${BASE}/parametres/scripts`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/code", "Code personnalisé", `${BASE}/parametres/code`, { permission: "settings.read", status: "preview" }),
      leaf("parametres/maintenance", "Maintenance", `${BASE}/parametres/maintenance`, { permission: "settings.read", status: "preview" }),
    ],
  },
];

const ALL = SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.key })));
const sectionOf = (key) => SECTIONS.find((s) => s.key === key);
const itemOf = (key) => ALL.find((i) => i.key === key) || null;
const isCmsKey = (key) => ALL.some((i) => i.key === key);

// Clés servies par le routeur générique des écrans CMS (cmsScreens) : celles dont la route n'existe pas déjà ailleurs.
const GENERIC_SECTIONS = ["articles", "mediatheque", "navigation", "apparence", "commentaires", "utilisateurs", "seo", "redirections", "outils", "parametres"];

// Menu affiché pour un rôle : uniquement les entrées permises ; une section à une seule entrée devient un lien direct.
function buildCmsNav({ can, active }) {
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

module.exports = { BASE, SECTIONS, ALL, GENERIC_SECTIONS, buildCmsNav, isCmsKey, itemOf, sectionOf };
