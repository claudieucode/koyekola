// « Mon espace » (tableau de bord du formateur) : apparence personnelle, navigation, statistiques réelles.
// L'apparence est enregistrée sur le compte (table dashboard_prefs) ; elle ne concerne que l'espace de gestion.
const db = require("../config/database");
const siteScope = require("./siteScope");
const { parisToday, parisDayStart, sqlUtc, addDays } = require("./gestion/common");

db.exec(`
  CREATE TABLE IF NOT EXISTS dashboard_prefs (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'clair',
    colors TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Thèmes prédéfinis : couleurs de la barre latérale, du fond, des cartes, du texte et de l'accent
const THEMES = {
  clair: { label: "Clair", sidebar: "#ffffff", sidebarText: "#334155", bg: "#f4f8fb", card: "#ffffff", text: "#102a3a", muted: "#64748b", border: "#e2e8f0", primary: "#0b83c6", button: "#0b83c6", dark: false },
  "bleu-fonce": { label: "Bleu foncé (par défaut)", sidebar: "#0b2538", sidebarText: "#c9d8e4", bg: "#f4f8fb", card: "#ffffff", text: "#102a3a", muted: "#64748b", border: "#dce7ef", primary: "#0b83c6", button: "#0b83c6", dark: false },
  noir: { label: "Noir", sidebar: "#0b0d0f", sidebarText: "#b8c0c8", bg: "#111418", card: "#181c21", text: "#e8ecef", muted: "#98a2ad", border: "#262c33", primary: "#3aa8e8", button: "#2b8fd0", dark: true },
  "gris-clair": { label: "Gris clair", sidebar: "#e9ecef", sidebarText: "#2b3440", bg: "#f4f5f7", card: "#ffffff", text: "#17202a", muted: "#5f6b78", border: "#dde1e6", primary: "#2563a8", button: "#2563a8", dark: false },
  "gris-moyen": { label: "Gris moyen", sidebar: "#4b525b", sidebarText: "#e3e6ea", bg: "#e6e8eb", card: "#f7f8f9", text: "#1c232b", muted: "#55606c", border: "#cfd4da", primary: "#1f6fb2", button: "#1f6fb2", dark: false },
  "gris-fonce": { label: "Gris foncé", sidebar: "#1f2329", sidebarText: "#c3c9d0", bg: "#2a2f36", card: "#33393f", text: "#e6e9ec", muted: "#a3acb6", border: "#424951", primary: "#5aa9e0", button: "#3d8fcc", dark: true },
};
const HEX = /^#[0-9a-f]{6}$/i;
// Thème des personnes qui n'ont encore rien choisi : le bleu marine, couleur de l'identité Kolakisa (les choix déjà enregistrés sont conservés)
const DEFAULT_THEME = "bleu-fonce";
const COLOR_KEYS = ["primary", "accent", "sidebar", "bg", "card", "button"];

// Luminance relative (WCAG) : texte clair ou foncé selon le fond choisi
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const isDark = (hex) => lum(hex) < 0.22;
// Contraste garanti : une couleur est éclaircie ou foncée (vers le blanc ou le noir, à l'opposé du fond) jusqu'à
// atteindre le seuil voulu contre ce fond. Ainsi aucun thème — prédéfini ou personnalisé — ne peut produire un texte,
// un bouton ou un état illisible (seuil WCAG AA : 4,5 pour le texte).
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
const mixHex = (a, b, t) => `#${[1, 3, 5].map((i) => hex2(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t)).join("")}`;
function ensure(fg, bg, min = 4.5) {
  if (ratio(fg, bg) >= min) return fg;
  // Direction naturelle d'abord (à l'opposé du fond), puis l'autre si le fond est trop « moyen » pour la première
  const order = isDark(bg) ? ["#ffffff", "#000000"] : ["#000000", "#ffffff"];
  for (const target of order) for (let t = 0.05; t <= 1.001; t += 0.05) { const c = mixHex(fg, target, t); if (ratio(c, bg) >= min) return c; }
  return ratio("#ffffff", bg) >= ratio("#000000", bg) ? "#ffffff" : "#000000";
}
// Fond d'un bouton plein avec texte blanc (ou foncé pour un fond très clair) : le fond est foncé jusqu'au seuil
function fill(color) {
  const text = isDark(color) || lum(color) < 0.45 ? "#ffffff" : "#102a3a";
  if (ratio(color, text) >= 4.5) return { bg: color, text };
  return { bg: text === "#ffffff" ? ensure(color, "#ffffff", 4.6) : ensure(color, "#102a3a", 4.6), text };
}

function cleanColors(input) {
  const out = {};
  for (const k of COLOR_KEYS) if (HEX.test(String((input || {})[k] || ""))) out[k] = String(input[k]).toLowerCase();
  return out;
}
function prefsOf(userId) {
  const r = db.prepare("SELECT theme, colors FROM dashboard_prefs WHERE user_id = ?").get(userId);
  let colors = {};
  try { colors = r ? JSON.parse(r.colors) : {}; } catch { colors = {}; }
  const theme = r && (THEMES[r.theme] || r.theme === "perso") ? r.theme : DEFAULT_THEME;
  return { theme, colors: cleanColors(colors) };
}
function savePrefs(userId, { theme, colors }) {
  const t = THEMES[theme] || theme === "perso" ? theme : DEFAULT_THEME;
  const c = cleanColors(colors);
  db.prepare("INSERT INTO dashboard_prefs (user_id, theme, colors, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET theme = excluded.theme, colors = excluded.colors, updated_at = excluded.updated_at").run(userId, t, JSON.stringify(c));
  return prefsOf(userId);
}
// Variables CSS de l'espace pour un réglage d'apparence (thème prédéfini, ou personnalisé à partir d'une base)
function tokens({ theme, colors }) {
  const base = theme === "perso" ? { ...THEMES.clair } : { ...THEMES[theme] || THEMES.clair };
  if (theme === "perso") {
    const c = colors || {};
    if (c.bg) { base.bg = c.bg; const dark = isDark(c.bg); Object.assign(base, dark ? { card: "#1c2128", text: "#e8ecef", muted: "#9aa4ae", border: "#2f363e", dark: true } : { card: "#ffffff", text: "#102a3a", muted: "#64748b", border: "#e2e8f0", dark: false }); }
    // Cartes : couleur choisie, texte et bordures recalculés pour rester lisibles
    if (c.card) { base.card = c.card; Object.assign(base, isDark(c.card) ? { text: "#e8ecef", muted: "#9aa4ae", border: "#2f363e" } : { text: "#102a3a", muted: "#64748b", border: "#e2e8f0" }); }
    if (c.sidebar) { base.sidebar = c.sidebar; base.sidebarText = isDark(c.sidebar) ? "#d6dee6" : "#2b3440"; }
    if (c.primary) base.primary = c.primary;
    if (c.button) base.button = c.button;
    base.accent = c.accent || base.primary;
  }
  // Cartes et fond de luminosités opposées (couleurs personnalisées) : aucun texte ne pourrait être lisible sur les deux ;
  // le fond est alors rapproché de la luminosité des cartes, juste assez pour qu'un texte convienne partout.
  const both = (c) => ratio(c, base.card) >= 4.5 && ratio(c, base.bg) >= 4.5;
  // Carte trop « moyenne » (ni claire ni foncée) : légèrement accentuée pour qu'un texte reste possible
  for (let t = 0.1; t <= 1.001 && ratio("#ffffff", base.card) < 4.8 && ratio("#000000", base.card) < 4.8; t += 0.1) base.card = mixHex(base.card, isDark(base.card) ? "#000000" : "#ffffff", t);
  for (let t = 0.1; t <= 1.001 && !both("#ffffff") && !both("#000000"); t += 0.1) base.bg = mixHex(base.bg, ratio("#000000", base.card) >= ratio("#ffffff", base.card) ? "#ffffff" : "#000000", t);
  const accent = base.accent || base.primary;
  const sd = isDark(base.sidebar);
  // Deux usages distincts de l'accent : un FOND plein (bouton, pastille, puce active : texte blanc dessus) et un
  // TEXTE/ICÔNE sur les cartes et le fond (liens, onglet actif). Chacun garanti lisible pour le thème.
  const accentFill = fill(accent);
  const button = fill(base.button);
  // Texte posé sur une carte, sur le fond, et sur une pastille teintée de sa propre couleur (14 %) : la couleur la plus
  // proche de celle voulue qui est lisible sur TOUS ces fonds à la fois (éclaircie ou foncée selon ce qui fonctionne)
  const textOn = (c) => {
    const bgs = [base.card, base.bg, mixHex(base.card, c, 0.14), mixHex(base.card, base.text, 0.06)];
    const ok = (x) => bgs.every((b) => ratio(x, b) >= 4.5);
    if (ok(c)) return c;
    const order = ratio("#ffffff", base.card) >= ratio("#000000", base.card) ? ["#ffffff", "#000000"] : ["#000000", "#ffffff"];
    for (let t = 0.05; t <= 1.001; t += 0.05) for (const target of order) { const x = mixHex(c, target, t); if (ok(x)) return x; }
    return order.find(ok) || order[0];
  };
  const activeBg = sd ? mixHex(base.sidebar, "#ffffff", 0.12) : mixHex(base.sidebar, accent, 0.1);
  const states = isDark(base.card) ? { success: "#4ade80", warning: "#fbbf24", danger: "#f87171" } : { success: "#166534", warning: "#92400e", danger: "#b42318" };
  return {
    "--dash-bg": base.bg, "--dash-card": base.card, "--dash-text": textOn(base.text), "--dash-muted": textOn(base.muted), "--dash-border": base.border,
    "--dash-sidebar": base.sidebar, "--dash-sidebar-text": ensure(base.sidebarText, base.sidebar), "--dash-sidebar-dark": sd ? "1" : "0",
    "--dash-primary": base.primary, "--dash-accent": accentFill.bg, "--dash-accent-on": accentFill.text, "--dash-accent-text": textOn(accent),
    "--dash-button": button.bg, "--dash-button-text": button.text,
    "--dash-hover": sd ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 40, 60, 0.06)",
    "--dash-active-bg": activeBg,
    "--dash-active-text": ensure(sd ? "#ffffff" : accent, activeBg),
    // États (réussite, avertissement, problème) : teintes lisibles sur le fond des cartes
    "--dash-success": textOn(states.success), "--dash-warning": textOn(states.warning), "--dash-danger": textOn(states.danger),
  };
}
const style = (prefs) => Object.entries(tokens(prefs)).map(([k, v]) => `${k}: ${v}`).join("; ");

// Navigation de l'espace (rubriques, entrées, icônes) et rubrique active selon l'adresse
const NAV = [
  { group: "Tableau de bord", items: [{ key: "overview", label: "Vue d'ensemble", href: "/formateur", icon: "layout" }] },
  { group: "Contenu", items: [
    { key: "courses", label: "Mes formations", href: "/formateur/formations", icon: "book" },
    { key: "chapters", label: "Chapitres", href: "/formateur/chapitres", icon: "list" },
    { key: "categories", label: "Catégories", href: "/formateur/categories", icon: "tag" },
  ] },
  { group: "Communication", items: [
    { key: "messages", label: "Messages", href: "/formateur/messages", icon: "mail", badge: "unread" },
    { key: "blog", label: "Blog", href: "/formateur/blog", icon: "fileText" },
    { key: "support", label: "Support", href: "/formateur/gestion/support", icon: "help", badge: "support" },
  ] },
  { group: "Croissance", items: [
    { key: "marketing", label: "Marketing", href: "/marketing", icon: "send", global: true },
    { key: "seo", label: "SEO", href: "/formateur/seo", icon: "search" },
    { key: "sourcing", label: "Sourcing produit", href: "/formateur/sourcing-produit", icon: "trendingUp" },
  ] },
  { group: "Gestion", items: [
    { key: "gestion", label: "Centre de gestion", href: "/formateur/gestion", icon: "barChart", badge: "notifications" },
    { key: "journal", label: "Journal d'activité", href: "/formateur/gestion/journal", icon: "listChecks" },
  ] },
  { group: "Site", items: [
    { key: "faq", label: "FAQ", href: "/formateur/faq", icon: "help" },
    { key: "about", label: "Page À propos", href: "/formateur/pages/a-propos", icon: "info" },
  ] },
  { group: "Personnalisation", items: [
    { key: "appearance", label: "Apparence", href: "/formateur/apparence", icon: "sliders" },
    { key: "settings", label: "Profil et paramètres", href: "/formateur/profil", icon: "settings", global: true },
  ] },
];
// Navigation interne de l'espace SEO (même coquille que « Mon espace », rubriques propres)
const SEO_NAV = [
  { group: "SEO Workspace", items: [
    { key: "seo-overview", label: "Vue d'ensemble", href: "/formateur/seo", icon: "layout" },
    { key: "seo-audit", label: "Audit", href: "/formateur/seo/audit", icon: "searchCheck" },
    { key: "seo-contents", label: "Contenus", href: "/formateur/seo/contenus", icon: "fileText" },
    { key: "seo-redirects", label: "Redirections", href: "/formateur/seo/redirections", icon: "arrowRightLeft" },
    { key: "seo-404", label: "Erreurs 404", href: "/formateur/seo/erreurs-404", icon: "alertCircle" },
    { key: "seo-technical", label: "Robots & Sitemap", href: "/formateur/seo/technique", icon: "network" },
    { key: "seo-integrations", label: "Intégrations", href: "/formateur/seo/integrations", icon: "plug" },
    { key: "seo-monitor", label: "Surveillance", href: "/formateur/seo/surveillance", icon: "activity" },
    { key: "seo-tasks", label: "Tâches", href: "/formateur/seo/taches", icon: "listChecks", badge: "tasks" },
    { key: "seo-reports", label: "Rapports", href: "/formateur/seo/rapports", icon: "barChart" },
  ] },
  { group: "Configuration", items: [
    { key: "seo-settings", label: "Réglages", href: "/formateur/seo/reglages", icon: "settings" },
    { key: "seo-journal", label: "Journal", href: "/formateur/seo/journal", icon: "history" },
    { key: "seo-appearance", label: "Apparence", href: "/formateur/seo/apparence", icon: "palette" },
  ] },
];
// Navigation interne du Centre de gestion (un seul élément dans « Mon espace », tout le reste ici)
const GESTION_NAV = [
  { group: "Centre de gestion", items: [
    { key: "g-overview", label: "Vue d'ensemble", href: "/formateur/gestion", icon: "layout" },
    { key: "g-ventes", label: "Ventes", href: "/formateur/gestion/ventes", icon: "coin" },
    { key: "g-eleves", label: "Élèves", href: "/formateur/gestion/eleves", icon: "users" },
    { key: "g-analytics", label: "Analytics", href: "/formateur/gestion/analytics", icon: "barChart" },
    { key: "g-ressources", label: "Ressources", href: "/formateur/gestion/ressources", icon: "image" },
    { key: "g-support", label: "Support", href: "/formateur/gestion/support", icon: "mail", badge: "support" },
    { key: "g-activite", label: "Activité", href: "/formateur/gestion/activite", icon: "bell", badge: "notifications" },
    { key: "g-sauvegardes", label: "Sauvegardes", href: "/formateur/gestion/sauvegardes", icon: "shield", global: true },
    { key: "g-journal", label: "Journal", href: "/formateur/gestion/journal", icon: "listChecks" },
  ] },
];
const isGestionPath = (path) => /^\/formateur\/gestion(\/|$)/.test(path);
function gestionActiveKey(path) {
  const m = /^\/formateur\/gestion\/([a-z]+)/.exec(path);
  return m && GESTION_NAV[0].items.some((i) => i.key === `g-${m[1]}`) ? `g-${m[1]}` : "g-overview";
}
// Sous-rubriques des Ventes (onglets) : libellé et adresse, pour le fil d'Ariane
const GESTION_SUB = { "/formateur/gestion/ventes/transactions": "Transactions", "/formateur/gestion/ventes/remboursements": "Remboursements", "/formateur/gestion/ventes/coupons": "Codes promo", "/formateur/gestion/ventes/commandes": "Commandes" };

function seoActiveKey(path) {
  const map = [["/formateur/seo/audit", "seo-audit"], ["/formateur/seo/analyse", "seo-audit"], ["/formateur/seo/regles", "seo-audit"], ["/formateur/seo/contenus", "seo-contents"], ["/formateur/seo/redirections", "seo-redirects"], ["/formateur/seo/erreurs-404", "seo-404"], ["/formateur/seo/technique", "seo-technical"], ["/formateur/seo/integrations", "seo-integrations"], ["/formateur/seo/surveillance", "seo-monitor"], ["/formateur/seo/taches", "seo-tasks"], ["/formateur/seo/rapports", "seo-reports"], ["/formateur/seo/reglages", "seo-settings"], ["/formateur/seo/journal", "seo-journal"], ["/formateur/seo/apparence", "seo-appearance"]];
  return (map.find(([p]) => path.startsWith(p)) || [])[1] || "seo-overview";
}
const isSeoPath = (path) => /^\/formateur\/seo(\/|$)/.test(path);

function activeKey(path) {
  if (path === "/formateur" || path === "/formateur/") return "overview";
  if (isGestionPath(path)) return "gestion";
  if (/^\/formateur\/(formations|cours)/.test(path)) return /\/curriculum$/.test(path) ? "chapters" : "courses";
  if (/^\/formateur\/(chapitres|sections|lecons|quiz)/.test(path)) return "chapters";
  const map = [["/formateur/categories", "categories"], ["/formateur/messages", "messages"], ["/formateur/blog", "blog"], ["/formateur/seo", "seo"], ["/formateur/sourcing-produit", "sourcing"], ["/formateur/faq", "faq"], ["/formateur/pages", "about"], ["/formateur/apparence", "appearance"], ["/formateur/profil", "settings"]];
  return (map.find(([p]) => path.startsWith(p)) || [])[1] || "overview";
}

// Modules qui ont leur propre navigation : la navigation générale reste visible sous forme de rail d'icônes
const MODULES = {
  gestion: { key: "gestion", label: "Centre de gestion", subtitle: "Ventes, élèves, activité", home: "/formateur/gestion", icon: "barChart" },
  seo: { key: "seo", label: "SEO", subtitle: "Référencement", home: "/formateur/seo", icon: "search" },
  marketing: { key: "marketing", label: "Marketing", subtitle: "E-mails, SMS, audience", home: "/marketing", icon: "send" },
};

// Fil d'Ariane réel : Mon espace → module ou rubrique → sous-rubrique → page. Chaque niveau mène à sa vraie adresse ;
// le dernier (la page affichée) n'est pas un lien. title : titre de la page (passé à l'en-tête).
function crumbs(path, title) {
  const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  const page = String(title || "").replace(/^SEO · /, "").trim();
  const here = path.replace(/\/$/, "") || "/";
  const out = [{ label: "Mon espace", href: "/formateur" }];
  if (isGestionPath(path)) {
    // Mon espace / Centre de gestion / Module / (Sous-rubrique) / Page
    out.push({ label: "Centre de gestion", href: "/formateur/gestion" });
    const key = gestionActiveKey(path);
    const item = GESTION_NAV[0].items.find((i) => i.key === key);
    if (key !== "g-overview") out.push({ label: item.label, href: item.href });
    const subPath = Object.keys(GESTION_SUB).find((p) => here === p || here.startsWith(`${p}/`));
    if (subPath && here.startsWith("/formateur/gestion/ventes/commandes/")) out.push({ label: "Commandes", href: "/formateur/gestion/ventes" });
    else if (subPath) out.push({ label: GESTION_SUB[subPath], href: subPath });
    const lastLabel = out[out.length - 1].label;
    if (page && !same(page, lastLabel) && !same(page, "Centre de gestion") && here !== item.href && here !== subPath) out.push({ label: page });
  } else if (isSeoPath(path)) {
    out.push({ label: "SEO", href: "/formateur/seo" });
    const key = seoActiveKey(path);
    const item = SEO_NAV.flatMap((g) => g.items).find((i) => i.key === key);
    if (key !== "seo-overview" && item) out.push({ label: item.label, href: item.href });
    if (page && item && here !== item.href && !same(page, item.label) && !same(page, "Vue d'ensemble") && !same(page, "SEO")) out.push({ label: page });
  } else {
    const key = activeKey(path);
    const item = NAV.flatMap((g) => g.items).find((i) => i.key === key);
    if (key !== "overview" && item) out.push({ label: item.label, href: item.href });
    if (page && item && here !== item.href && !same(page, item.label) && !same(page, "Mon espace") && here !== "/formateur") out.push({ label: page });
  }
  const last = out[out.length - 1];
  if (last.href && last.href === here) delete last.href;
  return out;
}

// Statistiques réelles (formations du formateur) et tendance du mois en cours
function stats(userId, now = new Date(), siteId = null) {
  const sw = siteScope.where(siteId, "c"); // formations de CE site (null = site principal)
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  // Début du mois à l'heure de Paris (comme le Centre de gestion) : une vente à 00:30 le 1er compte dans le nouveau mois
  const monthStart = sqlUtc(parisDayStart(`${parisToday(now).slice(0, 8)}01`));
  const courses = one("SELECT COUNT(*) n, SUM(published) pub, SUM(CASE WHEN c.created_at >= ? THEN 1 ELSE 0 END) month FROM courses c WHERE c.instructor_id = ?" + sw.sql, monthStart, userId, ...sw.params);
  const students = one("SELECT COUNT(*) n, SUM(CASE WHEN e.created_at >= ? THEN 1 ELSE 0 END) month FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = ?" + sw.sql, monthStart, userId, ...sw.params);
  const revenue = one("SELECT COALESCE(SUM(oi.price_cents), 0) total, COALESCE(SUM(CASE WHEN o.created_at >= ? THEN oi.price_cents ELSE 0 END), 0) month FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN courses c ON c.id = oi.course_id WHERE c.instructor_id = ?" + sw.sql, monthStart, userId, ...sw.params);
  return {
    courses: courses.n || 0, coursesMonth: courses.month || 0, published: courses.pub || 0, drafts: (courses.n || 0) - (courses.pub || 0),
    students: students.n || 0, studentsMonth: students.month || 0, revenueCents: revenue.total || 0, revenueMonthCents: revenue.month || 0,
  };
}

// ---------- Vue d'ensemble : rythme des ventes, activité récente, éléments à traiter ----------
// Données RÉELLES uniquement (commandes, messages, formations) : rien n'est simulé, une période sans vente donne une série à zéro (jamais une tendance inventée).
// Les jours sont ceux de Paris (une vente à 23 h 30 UTC appartient au jour suivant à Paris), comme le Centre de gestion.
const utcDate = (sqlDate) => new Date(String(sqlDate).replace(" ", "T") + "Z");
function overview(userId, now = new Date(), { days = 30, activityLimit = 6, siteId = null } = {}) {
  const sw = siteScope.where(siteId, "c");
  const today = parisToday(now);
  const first = addDays(today, -(days - 1));
  const since = sqlUtc(parisDayStart(first));
  const series = Array.from({ length: days }, (_, i) => ({ day: addDays(first, i), sales: 0, cents: 0 }));
  const at = new Map(series.map((d, i) => [d.day, i]));
  const rows = db.prepare("SELECT o.created_at, oi.price_cents FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN courses c ON c.id = oi.course_id WHERE c.instructor_id = ? AND o.created_at >= ?" + sw.sql).all(userId, since, ...sw.params);
  for (const r of rows) { const i = at.get(parisToday(utcDate(r.created_at))); if (i !== undefined) { series[i].sales += 1; series[i].cents += r.price_cents; } }
  const totals = series.reduce((t, d) => ({ sales: t.sales + d.sales, cents: t.cents + d.cents, peak: Math.max(t.peak, d.cents) }), { sales: 0, cents: 0, peak: 0 });
  // Activité : ventes et messages reçus, du plus récent au plus ancien
  const sales = db.prepare(`SELECT o.id AS order_id, o.created_at, oi.price_cents, u.username AS buyer, c.title AS course_title, c.id AS course_id
    FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN courses c ON c.id = oi.course_id JOIN users u ON u.id = o.user_id
    WHERE c.instructor_id = ?${sw.sql} ORDER BY o.created_at DESC, oi.id DESC LIMIT ?`).all(userId, ...sw.params, activityLimit);
  const messages = db.prepare(`SELECT id, name, subject, created_at, read_at FROM contact_messages WHERE 1 = 1${siteScope.where(siteId).sql} ORDER BY created_at DESC, id DESC LIMIT ?`).all(...siteScope.where(siteId).params, activityLimit);
  const activity = [
    ...sales.map((r) => ({ kind: "sale", at: r.created_at, who: r.buyer, what: r.course_title, cents: r.price_cents, href: `/formateur/gestion/ventes/commandes/${r.order_id}` })),
    ...messages.map((m) => ({ kind: "message", at: m.created_at, who: m.name, what: m.subject || "Sans objet", unread: !m.read_at, href: `/formateur/messages?id=${m.id}` })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, activityLimit);
  return { series, totals, activity, today, periodStart: first };
}

// « Il y a 2 h », « hier à 14:05 », « 22 oct. » : repère court pour une date UTC de la base, calculé à l'heure de Paris
function ago(sqlDate, now = new Date()) {
  const d = utcDate(sqlDate), diff = now - d;
  if (!(diff >= 0)) return { text: "à l'instant", iso: d.toISOString() };
  const min = Math.floor(diff / 60000), h = Math.floor(min / 60);
  const dayGap = Math.round((Date.parse(parisToday(now)) - Date.parse(parisToday(d))) / 86400000);
  const hm = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(d);
  let text;
  if (min < 1) text = "à l'instant"; else if (min < 60) text = `il y a ${min} min`; else if (dayGap === 0) text = `il y a ${h} h`;
  else if (dayGap === 1) text = `hier à ${hm}`; else if (dayGap < 7) text = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long" }).format(d) + ` à ${hm}`;
  else text = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short" }).format(d);
  return { text, iso: d.toISOString() };
}

module.exports = { overview, ago, ratio, ensure, fill, THEMES, COLOR_KEYS, prefsOf, savePrefs, tokens, style, NAV, activeKey, SEO_NAV, seoActiveKey, isSeoPath, GESTION_NAV, gestionActiveKey, isGestionPath, MODULES, crumbs, stats, cleanColors };
