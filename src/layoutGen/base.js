// Advanced Layout Generation (programme 22.3) — briques communes : échelle d'espacement, fabrique de nœuds NATIFS, aides de grille et de Flexbox.
// Les nœuds produits sont ceux du Page Builder (marketing/pages/nodes.js) : aucun type, aucune propriété hors du registre réel. Le normaliseur natif a le dernier mot (validate.js).
const crypto = require("node:crypto");

// Échelle d'espacement : uniquement les jetons du site (« token:space-* ») → changer un jeton met à jour toutes les compositions. Aucune valeur arbitraire répétée.
const SPACE = Object.freeze({ xs: "token:space-xs", sm: "token:space-sm", md: "token:space-md", lg: "token:space-lg", xl: "token:space-xl", xxl: "token:space-xxl" });
const STEPS = Object.freeze(["xs", "sm", "md", "lg", "xl", "xxl"]);
const stepDown = (s, n = 1) => STEPS[Math.max(0, STEPS.indexOf(s) - n)];
// Rythme vertical d'une section selon la densité visuelle voulue
const RHYTHM = Object.freeze({ compact: "lg", normal: "xl", airy: "xxl" });
// Proportions de colonnes (fr) : listes fermées, jamais de valeur libre
const RATIOS = Object.freeze({ "1:1": [1, 1], "7:5": [7, 5], "5:7": [5, 7], "2:1": [2, 1], "1:2": [1, 2], "13:7": [13, 7], "7:13": [7, 13], "3:1": [3, 1], "1:3": [1, 3] });
const frs = (r) => RATIOS[r].map((n) => `${n}fr`).join(" ");

let seq = 0;
// Identifiant d'élément déterministe (sinon deux générations identiques ne se comparent pas) : /^[a-z0-9]{6,20}$/
const nid = (seed, label) => `g${crypto.createHash("sha1").update(`${seed}:${label}:${seq++ % 1000000}`).digest("hex").slice(0, 10)}`;
const resetIds = () => { seq = 0; };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Texte → HTML de paragraphes (aucune troncature : le contenu est repris en entier)
const para = (s) => String(s || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");

// Fabrique : node(type, props, styles, children). `styles` : { d: {...}, t: {...}, m: {...} } (ordinateur / tablette / mobile). `_r` : indices pour le transformateur responsive (retirés avant validation).
function node(x, type, props = {}, styles = null, children = null, extra = {}) {
  const n = { id: nid(x.seed, type), type, props };
  if (extra.name) n.name = extra.name;
  if (styles) {
    const s = {};
    for (const [k, bp] of [["d", "desktop"], ["t", "tablet"], ["m", "mobile"]]) if (styles[k] && Object.keys(styles[k]).length) s[bp] = styles[k];
    if (Object.keys(s).length) n.styles = s;
  }
  if (children) n.children = children.filter(Boolean);
  if (extra.hint) n._r = extra.hint;
  if (extra.anchor) n.anchor = extra.anchor;
  return n;
}
const heading = (x, text, level, styles, extra) => text ? node(x, "heading", { text, level: String(level) }, styles, null, extra) : null;
const richText = (x, text, styles, extra) => text ? node(x, "text", { html: para(text) }, styles, null, extra) : null;
const button = (x, cta, variant = "primary", styles, size) => cta && cta.label && cta.url ? node(x, "button", { label: cta.label, url: cta.url, variant, ...(size ? { size } : {}) }, styles) : null;
const image = (x, im, styles, extra) => im && im.src ? node(x, "image", { src: im.src, alt: im.alt || "", decorative: !im.alt, caption: im.caption || "" }, styles, null, extra) : null;
const badge = (x, text, styles) => text ? node(x, "badge", { text }, styles) : null;

// Aides de mise en page ---------------------------------------------------------------------------------------------------
const flex = (dir, { gap = "md", align, justify, wrap, ...rest } = {}) => ({ display: "flex", flexDirection: dir, ...(gap ? { gap: SPACE[gap] } : {}), ...(align ? { alignItems: align } : {}), ...(justify ? { justifyContent: justify } : {}), ...(wrap ? { flexWrap: "wrap" } : {}), ...rest });
const grid = (template, { gap = "lg", align, ...rest } = {}) => ({ display: "grid", gridTemplate: template, ...(gap ? { gap: SPACE[gap] } : {}), ...(align ? { alignItems: align } : {}), ...rest });
const pad = (step) => ({ paddingTop: SPACE[step], paddingBottom: SPACE[step] });
const BG = Object.freeze({ default: "token:background", surface: "token:surface", primary: "token:primary", dark: "token:secondary", accent: "token:accent" });
const ON = Object.freeze({ primary: "token:on-primary", dark: "token:on-primary", accent: "token:on-accent" });

// Racine d'une composition : conteneur « bande » (fond pleine largeur, contenu encadré par le site) + rythme vertical + fond
function band(x, children, { bg = "default", rhythm = "normal", extra = {}, name = "" } = {}) {
  const st = { ...pad(RHYTHM[rhythm] || "xl"), backgroundColor: BG[bg] || BG.default, ...(ON[bg] ? { color: ON[bg] } : {}), ...extra };
  return node(x, "container", { band: true }, { d: st }, children, name ? { name } : {});
}
const n2 = (a) => (a < 10 ? `0${a}` : String(a));
module.exports = { SPACE, STEPS, stepDown, RHYTHM, RATIOS, frs, nid, resetIds, esc, para, node, heading, richText, button, image, badge, flex, grid, pad, band, BG, ON, n2 };
