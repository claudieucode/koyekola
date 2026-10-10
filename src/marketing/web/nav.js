// Registre de navigation de l'espace marketing : source UNIQUE du menu latéral, du fil d'Ariane et du bouton principal.
// Une entrée « soon » est prévue mais jamais affichée : on n'expose pas une fonctionnalité qui n'existe pas encore.
// (Elle porte la phase où elle arrive : `since`.) Les clés `key` sont celles passées en `active` par les routes.

// Organisation calquée sur Mailchimp : Accueil, Campagnes, SMS, Automatisations, Site Web, Tunnels, Audience (formulaires
// d'inscription compris), Analytics, Intégrations, puis Paramètres (envoi, conformité) en bas du menu.
const SECTIONS = [
  { key: "marketing", label: "Accueil", icon: "home" },
  { key: "campaigns", label: "Campagnes", icon: "send" },
  { key: "sms", label: "SMS", icon: "smartphone" },
  { key: "automations", label: "Automatisations", icon: "zap" },
  { key: "site", label: "Site Web", icon: "globe" },
  { key: "tunnels", label: "Tunnels", icon: "filter" },
  { key: "audience", label: "Audience", icon: "users" },
  { key: "analytics", label: "Analytics", icon: "activity" },
  { key: "integrations", label: "Intégrations", icon: "plug" },
  { key: "settings", label: "Paramètres", icon: "settings" },
];

const live = (section, key, label, href, icon, permission, primary) => ({ section, key, label, href, icon, permission, status: "live", primary: primary || null });
const soon = (section, key, label, href, icon, since) => ({ section, key, label, href, icon, permission: "settings.read", status: "soon", since });

const ITEMS = [
  live("marketing", "dashboard", "Accueil", "/marketing", "home", "contacts.read"),

  live("audience", "contacts", "Tous les contacts", "/marketing/contacts", "user", "contacts.read", { label: "Ajouter un contact", href: "/marketing/contacts/nouveau", permission: "contacts.write" }),
  live("audience", "contactdupes", "Doublons", "/marketing/contacts/doublons", "users", "contacts.merge"),
  live("audience", "lists", "Listes", "/marketing/listes", "list", "lists.read", { label: "Nouvelle liste", href: "/marketing/listes#nouvelle", permission: "lists.write" }),
  live("audience", "segments", "Segments", "/marketing/segments", "filter", "segments.read", { label: "Nouveau segment", href: "/marketing/segments/nouveau", permission: "segments.write" }),
  live("audience", "tags", "Étiquettes", "/marketing/etiquettes", "tag", "lists.read", { label: "Nouvelle étiquette", href: "/marketing/etiquettes#nouvelle", permission: "lists.write" }),
  live("audience", "properties", "Propriétés", "/marketing/proprietes", "sliders", "contacts.read", { label: "Nouvelle propriété", href: "/marketing/proprietes#nouvelle", permission: "contacts.manage_fields" }),
  // Formulaires d'inscription : dans Audience, comme chez Mailchimp (« Signup forms »). Pop-ups : un réglage d'un formulaire.
  live("audience", "forms", "Formulaires d'inscription", "/marketing/formulaires", "layout", "forms.read", { label: "Nouveau formulaire", href: "/marketing/formulaires#nouveau", permission: "forms.write" }),
  // Sondages (« Surveys » de Mailchimp) : questions, lien public ou personnel, étiquettes selon les réponses
  live("audience", "surveys", "Sondages", "/marketing/sondages", "listChecks", "forms.read", { label: "Créer un sondage", href: "/marketing/sondages#nouveau", permission: "forms.write" }),
  // Score des contacts : règles (actions → points), niveaux (froid, chaud…), déclencheur « change de niveau »
  live("audience", "scoring", "Score des contacts", "/marketing/score", "activity", "contacts.read"),
  live("audience", "import", "Importer des contacts", "/marketing/importer", "upload", "contacts.import", { label: "Nouvel import", href: "/marketing/importer", permission: "contacts.import" }),

  live("campaigns", "campaigns", "Toutes les campagnes", "/marketing/campagnes", "send", "campaigns.read", { label: "Créer une campagne", href: "/marketing/campagnes/nouvelle", permission: "campaigns.write" }),
  live("campaigns", "templates", "Modèles d'e-mails", "/marketing/modeles", "fileText", "templates.read", { label: "Nouveau modèle", href: "/marketing/modeles#creer", permission: "templates.write" }),
  live("campaigns", "ab", "Tests A/B", "/marketing/tests-ab", "activity", "campaigns.read", { label: "Créer un test A/B", href: "/marketing/campagnes/nouvelle?ab=1", permission: "campaigns.write" }),
  // Campagnes RSS (« RSS-to-email » de Mailchimp) : nouveaux articles envoyés automatiquement selon une fréquence
  live("campaigns", "rss", "Campagnes RSS", "/marketing/rss", "layers", "campaigns.read", { label: "Créer une campagne RSS", href: "/marketing/rss/nouvelle", permission: "campaigns.write" }),
  live("campaigns", "social", "Réseaux sociaux", "/marketing/reseaux", "send", "campaigns.read", { label: "Créer une publication", href: "/marketing/reseaux#nouvelle", permission: "campaigns.write" }),

  // Onglet SMS à part entière, comme chez Mailchimp : campagnes, abonnés, réglages
  live("sms", "smscampaigns", "Campagnes SMS", "/marketing/sms", "smartphone", "campaigns.read", { label: "Créer une campagne SMS", href: "/marketing/sms#nouvelle", permission: "campaigns.write" }),
  live("sms", "smsaudience", "Abonnés SMS", "/marketing/sms/abonnes", "users", "contacts.read"),
  live("sms", "sms", "Réglages SMS", "/marketing/sms/reglages", "settings", "settings.read"),

  live("automations", "automations", "Tous les scénarios", "/marketing/automatisations", "zap", "automations.read", { label: "Nouveau scénario", href: "/marketing/automatisations#nouveau", permission: "automations.write" }),
  // Parcours tout prêts (« Pre-built journeys » de Mailchimp) : un parcours complet créé en brouillon en un clic
  live("automations", "journeys", "Parcours tout prêts", "/marketing/automatisations/parcours", "layers", "automations.read", { label: "Nouveau scénario", href: "/marketing/automatisations#nouveau", permission: "automations.write" }),

  // Site Web : tableau de bord, sites (design system), pages (les pages d'atterrissage y sont rattachées) — un seul
  // moteur de pages, partagé avec les Tunnels
  live("site", "sitedash", "Tableau de bord", "/marketing/site-web", "activity", "forms.read"),
  live("site", "sites", "Sites", "/marketing/site-web/sites", "globe", "forms.read", { label: "Créer un site", href: "/marketing/site-web/sites#nouveau", permission: "forms.write" }),
  live("site", "landing", "Pages", "/marketing/pages", "layout", "forms.read", { label: "Créer une page", href: "/marketing/pages#nouvelle", permission: "forms.write" }),
  live("site", "pagetests", "Tests A/B", "/marketing/site-web/tests-ab", "activity", "forms.read"),

  // Tunnels : suites d'étapes faites des pages du même moteur (même éditeur que Site Web) et des formations du catalogue
  live("tunnels", "funnels", "Tunnels", "/marketing/tunnels", "filter", "funnels.read", { label: "Créer un tunnel", href: "/marketing/tunnels#nouveau", permission: "funnels.write" }),

  live("analytics", "analytics", "Analytics", "/marketing/analytics", "activity", "analytics.read"),
  live("analytics", "revenue", "Revenus", "/marketing/revenus", "coin", "analytics.read"),
  live("analytics", "compare", "Rapports comparatifs", "/marketing/analytics/comparer", "barChart", "analytics.read"),


  live("integrations", "events", "KOLAKISA", "/marketing/evenements", "plug", "contacts.read"),
  live("integrations", "api", "Clés d'API", "/marketing/api", "plug", "api_keys.manage", { label: "Nouvelle clé", href: "/marketing/api#nouvelle", permission: "api_keys.manage" }),
  live("integrations", "webhooks", "Webhooks", "/marketing/webhooks", "plug", "webhooks.manage", { label: "Nouveau webhook", href: "/marketing/webhooks#nouveau", permission: "webhooks.manage" }),

  live("settings", "sending", "Réglages d'envoi", "/marketing/envoi", "mail", "settings.read"),
  live("settings", "domains", "Domaines", "/marketing/domaines", "globe", "settings.read"),
  live("settings", "compliance", "Conformité", "/marketing/conformite", "shield", "compliance.read"),
  live("settings", "ai", "Assistant IA", "/marketing/ia", "bot", "settings.read"),
  live("settings", "socialsettings", "Réseaux sociaux", "/marketing/reseaux/reglages", "globe", "settings.read"),
  live("settings", "appearance", "Apparence", "/marketing/apparence", "eye", "contacts.read"),

  // Page de référence du design system : accessible par son adresse, absente du menu
  { ...live("settings", "components", "Composants", "/marketing/composants", "layout", "settings.read"), hidden: true },
];

const sectionOf = (key) => SECTIONS.find((s) => s.key === key);

// Menu affiché pour un rôle : uniquement les entrées disponibles ET permises ; une section vide disparaît,
// une section à une seule entrée devient un lien direct (pas de sous-menu pour un seul lien).
function buildNav({ can, active }) {
  const current = ITEMS.find((i) => i.key === active && i.status === "live") || null;
  const sections = [];
  for (const s of SECTIONS) {
    const items = ITEMS.filter((i) => i.section === s.key && i.status === "live" && !i.hidden && can(i.permission)).map((i) => ({
      key: i.key, label: i.label, href: i.href, icon: i.icon, current: current ? current.key === i.key : false,
    }));
    if (!items.length) continue;
    sections.push({ key: s.key, label: s.label, icon: s.icon, items, flat: items.length === 1, open: items.some((i) => i.current) });
  }
  let breadcrumb = null;
  let primary = null;
  // trail : le même fil d'Ariane avec les vraies adresses (section → sa première page permise ; page → son adresse)
  let trail = [];
  if (current) {
    const liveInSection = ITEMS.filter((i) => i.section === current.section && i.status === "live" && !i.hidden);
    breadcrumb = liveInSection.length === 1 ? [current.label] : [sectionOf(current.section).label, current.label];
    const section = sections.find((x) => x.key === current.section);
    if (current.key !== "dashboard") {
      const sectionHref = section ? section.items[0].href : null;
      if (liveInSection.length > 1 && sectionHref !== current.href) trail.push({ label: sectionOf(current.section).label, href: sectionHref });
      // Page d'entrée de la section (« Toutes les campagnes ») : on l'appelle par le nom de la section (« Campagnes »)
      trail.push({ label: liveInSection.length > 1 && sectionHref === current.href ? sectionOf(current.section).label : current.label, href: current.href });
    }
    if (current.primary && can(current.primary.permission)) primary = { label: current.primary.label, href: current.primary.href };
  }
  return { sections, breadcrumb, trail, primary };
}

module.exports = { SECTIONS, ITEMS, buildNav };
