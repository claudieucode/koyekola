// Page individuelle : cadre de présentation d'une page du CMS (zone de titre, conteneur, colonne latérale, largeur, marges). Aucun second moteur de rendu :
//   • réglages GLOBAUX du site : mk_sites.settings.pageSingle (validés par siteSettings.normalizeSettings, publiés avec le reste du site) ;
//   • EXCEPTIONS d'une page : mk_landing_pages.theme.single (mêmes champs, tous facultatifs ; un champ absent = hérite du global) ;
//   • rendu : une feuille de style (css) posée par siteSettings.layoutCss (global) puis par landing/index.js (exception de page, APRÈS le global : à spécificité
//     égale, la page l'emporte sans « !important ») ; la colonne latérale réutilise la zone de widgets « sidebar » du site (Apparence → Widgets).
// Priorité : exception de la page > global « Page individuelle » > réglages du site (largeur, gouttière) > valeurs par défaut du moteur (landing.css).
// Portée : les pages du CMS (kind = « page ») d'un SITE. Les pages d'atterrissage, étapes de tunnel et modèles Theme Builder ne sont jamais touchés.
const { MarketingError } = require("../errors");

const LAYOUTS = ["default", "full", "boxed", "narrow", "wide"];
const STYLES = ["default", "open", "boxed-all"];
const SIDEBAR_LAYOUTS = ["default", "none", "left", "right"];
const SIDEBAR_STACK = ["after", "before", "hidden"];
const SHADOWS = { none: "none", sm: "0 2px 8px rgba(15,23,42,.08)", md: "0 8px 24px rgba(15,23,42,.12)", lg: "0 18px 48px rgba(15,23,42,.18)" };
const ALIGN = ["left", "center", "right"];
const DEVICES = ["desktop", "tablet", "mobile"];
const SIDES = ["top", "right", "bottom", "left"];
const WIDTHS = { narrow: 640, wide: 1320 };
const HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
const BASE = ".lp-site.kw-kind-page";

const DEFAULTS = Object.freeze({
  title: { enabled: false, align: "left", size: null, color: "", paddingY: null },
  container: { layout: "default", style: "default", background: "", borderWidth: null, borderColor: "", radius: null, shadow: "none" },
  sidebar: { layout: "default", style: "default", width: 300, gap: 32, stack: "after" },
  content: { widthMode: "default", width: null, tabletWidth: null, mobileWidth: null },
  padding: { desktop: { top: null, right: null, bottom: null, left: null }, tablet: { top: null, right: null, bottom: null, left: null }, mobile: { top: null, right: null, bottom: null, left: null } },
  margin: { desktop: { top: null, right: null, bottom: null, left: null }, tablet: { top: null, right: null, bottom: null, left: null }, mobile: { top: null, right: null, bottom: null, left: null } },
});

const bad = (m) => new MarketingError("invalid_field", m);
const oneOf = (v, list, label, strict) => { if (v === undefined || v === null || v === "") return undefined; if (list.includes(v)) return v; if (strict) throw bad(`${label} : choix inconnu.`); return undefined; };
const num = (v, lo, hi, label, strict) => {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < lo || n > hi) { if (strict) throw bad(`${label} : un nombre entre ${lo} et ${hi} est attendu.`); return undefined; }
  return n;
};
const color = (v, label, strict) => {
  if (v === undefined) return undefined;
  const s = String(v === null ? "" : v).trim();
  if (!s) return "";
  if (HEX.test(s) || /^token:[a-z0-9-]+$/i.test(s)) return s.toLowerCase();
  if (strict) throw bad(`${label} : une couleur hexadécimale (#rrggbb) est attendue.`);
  return undefined;
};
const bool = (v) => (v === undefined ? undefined : v === true || v === "1" || v === 1 || v === "true" || v === "on");
const put = (o, k, v) => { if (v !== undefined) o[k] = v; };

// Lecture tolérante ou stricte d'un ensemble de réglages. `partial` : seuls les champs fournis sont gardés (exception d'une page) ; sinon complété par les défauts (global).
function normalize(input, { strict = false, partial = false } = {}) {
  const s = input && typeof input === "object" ? input : {};
  const out = {};
  const t = s.title || {}, c = s.container || {}, sb = s.sidebar || {}, ct = s.content || {};
  const title = {};
  put(title, "enabled", bool(t.enabled)); put(title, "align", oneOf(t.align, ALIGN, "Zone de titre : alignement", strict));
  put(title, "size", num(t.size, 16, 96, "Zone de titre : taille", strict)); put(title, "color", color(t.color, "Zone de titre : couleur", strict));
  put(title, "paddingY", num(t.paddingY, 0, 240, "Zone de titre : espacement", strict));
  const container = {};
  put(container, "layout", oneOf(c.layout, LAYOUTS, "Mise en page du conteneur", strict)); put(container, "style", oneOf(c.style, STYLES, "Style de conteneur", strict));
  put(container, "background", color(c.background, "Conteneur : arrière-plan", strict)); put(container, "borderWidth", num(c.borderWidth, 0, 12, "Conteneur : épaisseur de bordure", strict));
  put(container, "borderColor", color(c.borderColor, "Conteneur : couleur de bordure", strict)); put(container, "radius", num(c.radius, 0, 64, "Conteneur : rayon", strict));
  put(container, "shadow", oneOf(c.shadow, Object.keys(SHADOWS), "Conteneur : ombre", strict));
  const sidebar = {};
  put(sidebar, "layout", oneOf(sb.layout, SIDEBAR_LAYOUTS, "Mise en page de colonne latérale", strict)); put(sidebar, "style", oneOf(sb.style, STYLES, "Style de colonne latérale", strict));
  put(sidebar, "width", num(sb.width, 200, 480, "Colonne latérale : largeur", strict)); put(sidebar, "gap", num(sb.gap, 0, 96, "Colonne latérale : espacement", strict));
  put(sidebar, "stack", oneOf(sb.stack, SIDEBAR_STACK, "Colonne latérale sur tablette et mobile", strict));
  const content = {};
  put(content, "widthMode", oneOf(ct.widthMode, ["default", "custom"], "Largeur du contenu", strict));
  for (const k of ["width", "tabletWidth", "mobileWidth"]) put(content, k, num(ct[k], 240, 2400, "Largeur du contenu", strict));
  const spacing = (src, label) => {
    const r = {};
    for (const d of DEVICES) { const g = {}; for (const side of SIDES) put(g, side, num(src && src[d] && src[d][side], 0, 400, `${label} (${d}, ${side})`, strict)); if (Object.keys(g).length) r[d] = g; }
    return r;
  };
  const padding = spacing(s.padding, "Marge interne"), margin = spacing(s.margin, "Marge externe");
  for (const [k, v] of Object.entries({ title, container, sidebar, content, padding, margin })) if (Object.keys(v).length) out[k] = v;
  if (partial) return out;
  // Global : complété par les défauts (une valeur absente = le défaut du moteur)
  const full = JSON.parse(JSON.stringify(DEFAULTS));
  for (const [k, v] of Object.entries(out)) {
    if (k === "padding" || k === "margin") { for (const d of Object.keys(v)) Object.assign(full[k][d], v[d]); } else Object.assign(full[k], v);
  }
  return full;
}

// Valeur effective pour UNE page : exception de la page > global
function merge(global, override) {
  const g = JSON.parse(JSON.stringify(global || DEFAULTS));
  const o = override || {};
  for (const [k, v] of Object.entries(o)) {
    if (k === "padding" || k === "margin") { for (const d of Object.keys(v)) g[k][d] = { ...g[k][d], ...v[d] }; } else g[k] = { ...g[k], ...v };
  }
  return g;
}

// Résolution pour l'affichage d'une page : { active, sidebar, title, … } ; `settings` = réglages du site (déjà normalisés), `page` = ligne de page publiée
function resolveFor(settings, page) {
  if (!settings || !settings.pageSingle || !page || page.kind !== "page") return null;
  const eff = merge(settings.pageSingle, page.theme && page.theme.single);
  return eff;
}

// Titres de premier niveau déjà présents dans le contenu (un seul H1 par page : la zone de titre s'efface alors)
function hasH1(sections) {
  let found = false;
  const walk = (nodes) => { for (const n of nodes || []) { if (!n || found) continue; if (n.type === "heading" && n.props && Number(n.props.level) === 1) { found = true; return; } if (n.children) walk(n.children); } };
  for (const s of sections || []) { if (s && s.type === "layout") walk(s.children); else if (s && s.type === "hero") { found = true; } }
  return found;
}

const px = (n) => `${n}px`;
const col = (v) => (/^token:/.test(v) ? `var(--kw-${v.slice(6)})` : v);

// Feuille de style d'un ensemble de réglages. `full` = true : global complet (n'écrit que ce qui diffère du défaut) ; false : exception partielle (écrit ce qui est fourni).
// ctx : { layout: réglages de mise en page du site, breakpoints }
function css(ps, ctx = {}, { full = true } = {}) {
  if (!ps) return "";
  const L = ctx.layout || { contentWidth: 760, containerWidth: 1100, gutter: 16, fullWidth: false };
  const bp = ctx.breakpoints || { tablet: 1023, mobile: 767 };
  const out = [];
  const M = `${BASE}:not(.kw-ps-sb) .lp-main`, F = `${BASE}.kw-ps-sb .kw-ps-frame`, A = `${BASE}.kw-ps-sb .kw-ps-aside`, T = `${BASE} .kw-page-title`;
  const both = (decls) => (decls.length ? `${M},${F}{${decls.join(";")}}` : "");
  const c = ps.container || {}, sb = ps.sidebar || {}, ct = ps.content || {}, t = ps.title || {};
  const sidebarOn = sb.layout === "left" || sb.layout === "right";
  // 1. Largeur du conteneur
  const widthOf = (layout) => (layout === "full" ? "none" : layout === "boxed" ? px(L.containerWidth) : layout === "narrow" ? px(WIDTHS.narrow) : layout === "wide" ? px(WIDTHS.wide) : null);
  const main = [];
  let w = c.layout !== undefined ? widthOf(c.layout) : null;
  if (!full && c.layout === "default") w = L.fullWidth ? "none" : px(L.contentWidth);
  if (ct.widthMode === "custom" && ct.width) w = px(ct.width);
  if (w) main.push(`max-width:${w === "none" ? "none" : `min(${w},100%)`}`);
  if (w && w !== "none") main.push("margin-left:auto", "margin-right:auto");
  if (full && sidebarOn && !w) main.push(`max-width:min(${px(L.containerWidth)},100%)`, "margin-left:auto", "margin-right:auto");
  if (main.length) out.push(both(main));
  // 2. Style du conteneur : Ouvert = aucun cadre ; Encadré - Tout = cadre complet ; Par défaut = rien (thème)
  const frame = [];
  if (c.style === "open") frame.push("background:transparent", "border:0", "box-shadow:none", "border-radius:0");
  if (c.style === "boxed-all") frame.push("background:var(--kw-surface,#fff)", "border:1px solid var(--kw-border-color,rgba(16,34,47,.14))", "border-radius:var(--kw-radius-card,14px)", "box-shadow:var(--kw-shadow-card,0 8px 24px rgba(15,23,42,.1))");
  if (c.background) frame.push(`background:${col(c.background)}`);
  if (c.borderWidth !== null && c.borderWidth !== undefined) frame.push(`border-width:${px(c.borderWidth)}`, "border-style:solid", ...(c.borderColor ? [] : ["border-color:var(--kw-border-color,rgba(16,34,47,.14))"]));
  if (c.borderColor) frame.push(`border-color:${col(c.borderColor)}`, "border-style:solid", ...(c.borderWidth === null || c.borderWidth === undefined ? ["border-width:1px"] : []));
  if (c.radius !== null && c.radius !== undefined) frame.push(`border-radius:${px(c.radius)}`);
  if (c.shadow && c.shadow !== "none") frame.push(`box-shadow:${SHADOWS[c.shadow]}`);
  if (frame.length) out.push(both(frame));
  // 3. Marges interne et externe (padding / margin du conteneur de la page), par appareil ; seules les valeurs fournies sont écrites
  const space = (obj, prop, dev) => {
    const g = obj && obj[dev]; if (!g) return [];
    const d = [];
    for (const side of SIDES) if (g[side] !== null && g[side] !== undefined) d.push(`${prop}-${side}:${px(g[side])}`);
    return d;
  };
  const media = { desktop: null, tablet: `(max-width:${bp.tablet}px)`, mobile: `(max-width:${bp.mobile}px)` };
  for (const dev of DEVICES) {
    const decls = [...space(ps.padding, "padding", dev), ...space(ps.margin, "margin", dev)];
    const widthDev = dev === "tablet" ? ct.tabletWidth : dev === "mobile" ? ct.mobileWidth : null;
    if (widthDev && ct.widthMode === "custom") decls.push(`max-width:min(${px(widthDev)},100%)`);
    if (!decls.length) continue;
    const rule = both(decls);
    out.push(media[dev] ? `@media ${media[dev]}{${rule}}` : rule);
  }
  // 4. Colonne latérale
  if (sidebarOn) {
    const sw = sb.width || 300, gap = sb.gap === undefined ? 32 : sb.gap;
    out.push(`${F}{display:grid;grid-template-columns:${sb.layout === "left" ? `${px(sw)} minmax(0,1fr)` : `minmax(0,1fr) ${px(sw)}`};column-gap:${px(gap)};align-items:start;padding-left:${px(L.gutter)};padding-right:${px(L.gutter)}}`);
    if (sb.layout === "left") out.push(`${A}{order:-1}`);
    const asideDecl = [];
    if (sb.style === "open") asideDecl.push("background:transparent", "border:0", "box-shadow:none");
    if (sb.style === "boxed-all") asideDecl.push("background:var(--kw-surface,#fff)", "border:1px solid var(--kw-border-color,rgba(16,34,47,.14))", "border-radius:var(--kw-radius-card,14px)", "padding:20px", "box-shadow:var(--kw-shadow-card,0 8px 24px rgba(15,23,42,.1))");
    if (asideDecl.length) out.push(`${A}{${asideDecl.join(";")}}`);
    const stack = sb.stack || "after";
    const tabletRule = [`${F}{grid-template-columns:minmax(0,1fr)}`];
    if (stack === "before") tabletRule.push(`${A}{order:-1}`); else if (stack === "after") tabletRule.push(`${A}{order:1}`);
    if (stack === "hidden") tabletRule.push(`${A}{display:none}`);
    out.push(`@media (max-width:${bp.tablet}px){${tabletRule.join("")}}`);
  }
  // 5. Zone de titre
  const title = [];
  if (t.align && (!full || t.align !== "left")) title.push(`text-align:${t.align}`); // global : « à gauche » est le défaut, rien à écrire
  if (t.paddingY !== null && t.paddingY !== undefined) title.push(`padding-top:${px(t.paddingY)}`, `padding-bottom:${px(t.paddingY)}`);
  if (title.length) out.push(`${T}{${title.join(";")}}`);
  const h1 = [];
  if (t.size !== null && t.size !== undefined) h1.push(`font-size:${px(t.size)}`);
  if (t.color) h1.push(`color:${col(t.color)}`);
  if (h1.length) out.push(`${T} h1{${h1.join(";")}}`);
  return out.filter(Boolean).join("\n");
}

module.exports = { DEFAULTS, LAYOUTS, STYLES, SIDEBAR_LAYOUTS, SIDEBAR_STACK, SHADOWS, ALIGN, DEVICES, SIDES, normalize, merge, resolveFor, hasH1, css };
