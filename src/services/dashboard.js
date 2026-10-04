// « Mon espace » (tableau de bord du formateur) : apparence personnelle, navigation, statistiques réelles.
// L'apparence est enregistrée sur le compte (table dashboard_prefs) ; elle ne concerne que l'espace de gestion.
const db = require("../config/database");

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
  clair: { label: "Clair (par défaut)", sidebar: "#ffffff", sidebarText: "#334155", bg: "#f4f8fb", card: "#ffffff", text: "#102a3a", muted: "#64748b", border: "#e2e8f0", primary: "#0b83c6", button: "#0b83c6", dark: false },
  "bleu-fonce": { label: "Bleu foncé", sidebar: "#0b2538", sidebarText: "#c9d8e4", bg: "#f4f8fb", card: "#ffffff", text: "#102a3a", muted: "#64748b", border: "#e2e8f0", primary: "#0b83c6", button: "#0b83c6", dark: false },
  noir: { label: "Noir", sidebar: "#0b0d0f", sidebarText: "#b8c0c8", bg: "#111418", card: "#181c21", text: "#e8ecef", muted: "#98a2ad", border: "#262c33", primary: "#3aa8e8", button: "#2b8fd0", dark: true },
  "gris-clair": { label: "Gris clair", sidebar: "#e9ecef", sidebarText: "#2b3440", bg: "#f4f5f7", card: "#ffffff", text: "#17202a", muted: "#5f6b78", border: "#dde1e6", primary: "#2563a8", button: "#2563a8", dark: false },
  "gris-moyen": { label: "Gris moyen", sidebar: "#4b525b", sidebarText: "#e3e6ea", bg: "#e6e8eb", card: "#f7f8f9", text: "#1c232b", muted: "#55606c", border: "#cfd4da", primary: "#1f6fb2", button: "#1f6fb2", dark: false },
  "gris-fonce": { label: "Gris foncé", sidebar: "#1f2329", sidebarText: "#c3c9d0", bg: "#2a2f36", card: "#33393f", text: "#e6e9ec", muted: "#a3acb6", border: "#424951", primary: "#5aa9e0", button: "#3d8fcc", dark: true },
};
const HEX = /^#[0-9a-f]{6}$/i;
const COLOR_KEYS = ["primary", "accent", "sidebar", "bg", "button"];

// Luminance relative (WCAG) : texte clair ou foncé selon le fond choisi
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const isDark = (hex) => lum(hex) < 0.22;

function cleanColors(input) {
  const out = {};
  for (const k of COLOR_KEYS) if (HEX.test(String((input || {})[k] || ""))) out[k] = String(input[k]).toLowerCase();
  return out;
}
function prefsOf(userId) {
  const r = db.prepare("SELECT theme, colors FROM dashboard_prefs WHERE user_id = ?").get(userId);
  let colors = {};
  try { colors = r ? JSON.parse(r.colors) : {}; } catch { colors = {}; }
  const theme = r && (THEMES[r.theme] || r.theme === "perso") ? r.theme : "clair";
  return { theme, colors: cleanColors(colors) };
}
function savePrefs(userId, { theme, colors }) {
  const t = THEMES[theme] || theme === "perso" ? theme : "clair";
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
    if (c.sidebar) { base.sidebar = c.sidebar; base.sidebarText = isDark(c.sidebar) ? "#d6dee6" : "#2b3440"; }
    if (c.primary) base.primary = c.primary;
    if (c.button) base.button = c.button;
    base.accent = c.accent || base.primary;
  }
  const accent = base.accent || base.primary;
  return {
    "--dash-bg": base.bg, "--dash-card": base.card, "--dash-text": base.text, "--dash-muted": base.muted, "--dash-border": base.border,
    "--dash-sidebar": base.sidebar, "--dash-sidebar-text": base.sidebarText, "--dash-sidebar-dark": isDark(base.sidebar) ? "1" : "0",
    "--dash-primary": base.primary, "--dash-accent": accent, "--dash-button": base.button, "--dash-button-text": isDark(base.button) ? "#ffffff" : "#102a3a",
    "--dash-hover": isDark(base.sidebar) ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 40, 60, 0.06)",
    "--dash-active-bg": isDark(base.sidebar) ? "rgba(255, 255, 255, 0.12)" : `${accent}1a`,
    "--dash-active-text": isDark(base.sidebar) ? "#ffffff" : accent,
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
  ] },
  { group: "Croissance", items: [
    { key: "marketing", label: "Marketing", href: "/marketing", icon: "send" },
    { key: "seo", label: "SEO", href: "/formateur/seo", icon: "search" },
  ] },
  { group: "Site", items: [
    { key: "faq", label: "FAQ", href: "/formateur/faq", icon: "help" },
    { key: "about", label: "Page À propos", href: "/formateur/pages/a-propos", icon: "info" },
  ] },
  { group: "Personnalisation", items: [
    { key: "appearance", label: "Apparence", href: "/formateur/apparence", icon: "sliders" },
    { key: "settings", label: "Profil et paramètres", href: "/formateur/profil", icon: "settings" },
  ] },
];
function activeKey(path) {
  if (path === "/formateur" || path === "/formateur/") return "overview";
  if (/^\/formateur\/(formations|cours)/.test(path)) return /\/curriculum$/.test(path) ? "chapters" : "courses";
  if (/^\/formateur\/(chapitres|sections|lecons|quiz)/.test(path)) return "chapters";
  const map = [["/formateur/categories", "categories"], ["/formateur/messages", "messages"], ["/formateur/blog", "blog"], ["/formateur/seo", "seo"], ["/formateur/faq", "faq"], ["/formateur/pages", "about"], ["/formateur/apparence", "appearance"], ["/formateur/profil", "settings"]];
  return (map.find(([p]) => path.startsWith(p)) || [])[1] || "overview";
}

// Statistiques réelles (formations du formateur) et tendance du mois en cours
function stats(userId) {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const courses = one("SELECT COUNT(*) n, SUM(published) pub, SUM(CASE WHEN created_at >= date('now', 'start of month') THEN 1 ELSE 0 END) month FROM courses WHERE instructor_id = ?", userId);
  const students = one("SELECT COUNT(*) n, SUM(CASE WHEN e.created_at >= date('now', 'start of month') THEN 1 ELSE 0 END) month FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = ?", userId);
  const revenue = one("SELECT COALESCE(SUM(oi.price_cents), 0) total, COALESCE(SUM(CASE WHEN o.created_at >= date('now', 'start of month') THEN oi.price_cents ELSE 0 END), 0) month FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN courses c ON c.id = oi.course_id WHERE c.instructor_id = ?", userId);
  return {
    courses: courses.n || 0, coursesMonth: courses.month || 0, published: courses.pub || 0, drafts: (courses.n || 0) - (courses.pub || 0),
    students: students.n || 0, studentsMonth: students.month || 0, revenueCents: revenue.total || 0, revenueMonthCents: revenue.month || 0,
  };
}

module.exports = { THEMES, COLOR_KEYS, prefsOf, savePrefs, tokens, style, NAV, activeKey, stats, cleanColors };
