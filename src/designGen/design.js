// AI Design Generator — assemblage d'un DESIGN complet et adaptateur de jetons.
// Responsabilités : Color Palette Generator (color.js) · Typography Planner (typography.js) · Spacing/Sizing · Component Style Mapper · Responsive Design Planner · Layout Planner · Design Token Adapter · Design Validation Engine.
// Le design est exprimé en réglages du PERSONNALISATEUR natif (« chemin → valeur », ex. tokens.colors.primary) : jamais de second système, jamais de propriété de composant inventée.
const color = require("./color");
const typo = require("./typography");
const tokensLib = require("../marketing/pages/tokens");
const settingsLib = require("../marketing/pages/siteSettings");
const analyzer = require("./analyzer");

const SPACE = { compacte: { sm: 8, md: 14, lg: 24, xl: 44 }, equilibree: { sm: 8, md: 16, lg: 32, xl: 56 }, aeree: { sm: 10, md: 20, lg: 40, xl: 72 } };
const RADIUS = { net: { sm: 2, md: 4, lg: 8, card: 6, button: 4, field: 4 }, doux: { sm: 6, md: 10, lg: 18, card: 14, button: 10, field: 8 }, arrondi: { sm: 10, md: 16, lg: 26, card: 22, button: 24, field: 12 } };
const SHADOW = { minimaliste: "none", luxe: "sm", editorial: "none", corporate: "md", institutionnel: "sm", educatif: "md", ecommerce: "md", tech: "md", creatif: "lg" };
const LAYOUT = { compacte: { contentWidth: 1100, containerWidth: 1240, gutter: 20 }, equilibree: { contentWidth: 1080, containerWidth: 1280, gutter: 24 }, aeree: { contentWidth: 1040, containerWidth: 1320, gutter: 32 } };

// Limites des réglages émis (reflet du catalogue du personnalisateur ; vérifié par test contre le catalogue réel)
const LIMITS = {
  color: (v) => color.HEX.test(v),
  size: [10, 96], line: [1, 2], ls: [-0.1, 0.5], space: [0, 200], radius: [0, 48], bw: [0, 4], bh: [32, 72], bpy: [4, 32], bpx: [8, 64], fpy: [4, 24], fpx: [6, 32], cw: [320, 1200], cn: [480, 1920], gutter: [0, 80],
  rsize: [10, 96], rbody: [10, 40], rgut: [0, 80], rspace: [0, 200],
};
const scale = (n, f, min) => Math.max(min, Math.round(n * f));

function build(direction) {
  const p = color.palette(direction.neutral ? 215 : direction.hue, direction.mood);
  if (direction.neutral) { /* palette quasi neutre : saturation réduite sur le primaire et le secondaire */
    const [h, , l] = color.hexToHsl(p.primary); p.primary = color.ensure(color.hslToHex(h, 8, l), p.background, 4.5, "darken");
    p.link = color.ensure(p.primary, p.background, 4.5, "darken"); p.linkHover = color.ensure(color.shade(p.link, -8), p.background, 4.5, "darken");
    p.buttonText = color.onColor(p.primary); p.buttonHover = color.ensure(color.shade(p.primary, -7), p.background, 4.5, "darken"); p.buttonActive = color.shade(p.buttonHover, -5);
    p.buttonHoverText = color.onColor(p.buttonHover); p.buttonActiveText = color.onColor(p.buttonActive);
  }
  const t = typo.plan(direction);
  const space = SPACE[direction.density], radius = RADIUS[direction.roundness], layout = LAYOUT[direction.density];
  const fieldBorder = color.ensure(p.border, p.surface, 3, "darken");
  const compactBtn = direction.density === "compacte";
  const components = {
    buttons: { radius: radius.button, paddingY: compactBtn ? 10 : direction.density === "aeree" ? 16 : 13, paddingX: compactBtn ? 20 : direction.density === "aeree" ? 32 : 26, height: compactBtn ? 44 : direction.density === "aeree" ? 52 : 48, shadow: direction.mood === "creatif" ? "sm" : "none", borderWidth: 0 },
    cards: { radius: radius.card, shadow: SHADOW[direction.mood] || "md", border: p.border },
    forms: { radius: radius.field, borderColor: fieldBorder, focusColor: p.primary, height: compactBtn ? 44 : 46, paddingY: compactBtn ? 8 : 11, paddingX: 14 },
    images: { radius: radius.card },
    links: { underline: direction.mood === "editorial" ? "always" : "hover" },
  };
  const responsive = {
    tablet: { h1: scale(t.sizes.h1, 0.85, 28), h2: scale(t.sizes.h2, 0.88, 24), h3: scale(t.sizes.h3, 0.92, 20), body: Math.max(16, t.sizes.body - (t.sizes.body > 17 ? 1 : 0)), gutter: Math.max(16, layout.gutter - 4), spaceLg: scale(space.lg, 0.8, 16), spaceXl: scale(space.xl, 0.7, 28) },
    mobile: { h1: scale(t.sizes.h1, 0.62, 28), h2: scale(t.sizes.h2, 0.7, 24), h3: scale(t.sizes.h3, 0.8, 20), body: 16, gutter: 16, spaceLg: scale(space.lg, 0.6, 14), spaceXl: scale(space.xl, 0.5, 24) },
  };
  // Layout Planner : seulement des compositions que les composants natifs savent rendre (attributs de section : espacement, fond, alignement, largeur ; colonnes 2 à 4)
  const sectionStyles = {
    hero: { padding: direction.density === "aeree" ? "xl" : "lg", align: direction.mood === "luxe" || direction.mood === "editorial" ? "left" : "center", width: "wide" },
    cards: { padding: direction.density === "compacte" ? "md" : "lg", width: "normal", columns: direction.density === "compacte" ? 4 : 3 },
    text: { padding: "md", width: "narrow" },
    cta: { padding: direction.density === "aeree" ? "xl" : "lg", background: "primary", align: "center" },
  };
  const unavailable = ["Bandeau scindé texte / image côte à côte", "Image plein écran en arrière-plan du bandeau", "Grille asymétrique et galerie dédiée", "Filtres de produits"];
  return { direction, palette: p, typography: t, spacing: space, radius, layout, components, responsive, sectionStyles, unavailable };
}

// Design Token Adapter : design → { chemin du personnalisateur: valeur }
function toChanges(d) {
  const c = {}, p = d.palette, t = d.typography;
  for (const k of ["primary", "secondary", "accent", "background", "surface", "text", "muted", "success", "warning", "error"]) c[`tokens.colors.${k}`] = p[k];
  c["tokens.link.color"] = p.link; c["tokens.link.hoverColor"] = p.linkHover; c["tokens.border.color"] = p.border; c["tokens.link.underline"] = d.components.links.underline;
  for (const [role, key] of Object.entries(t.fonts)) c[`tokens.fonts.${role}`] = key;
  for (const k of ["h1", "h2", "h3", "h4", "h5", "h6"]) { c[`tokens.type.${k}.size`] = t.sizes[k]; c[`tokens.type.${k}.weight`] = t.weights[k]; }
  for (const k of ["h1", "h2", "h3"]) c[`tokens.type.${k}.lineHeight`] = t.lineHeights[k];
  c["tokens.type.body.size"] = t.sizes.body; c["tokens.type.body.lineHeight"] = t.lineHeights.body; c["tokens.type.caption.size"] = t.sizes.caption;
  c["tokens.type.h1.letterSpacing"] = t.letterSpacing.h1; c["tokens.type.body.letterSpacing"] = t.letterSpacing.body;
  for (const k of ["sm", "md", "lg", "xl"]) c[`tokens.space.${k}`] = d.spacing[k];
  for (const k of ["sm", "md", "lg", "card", "button", "field"]) c[`tokens.radius.${k}`] = d.radius[k];
  c["tokens.border.width"] = 1; c["tokens.shadow.card"] = d.components.cards.shadow; c["tokens.shadow.button"] = d.components.buttons.shadow;
  c["tokens.sizes.buttonHeight"] = d.components.buttons.height; c["tokens.sizes.fieldHeight"] = d.components.forms.height;
  c["tokens.buttons.paddingY"] = d.components.buttons.paddingY; c["tokens.buttons.paddingX"] = d.components.buttons.paddingX; c["tokens.buttons.borderWidth"] = d.components.buttons.borderWidth;
  c["tokens.buttons.normal.bg"] = p.primary; c["tokens.buttons.normal.color"] = p.buttonText;
  c["tokens.buttons.hover.bg"] = p.buttonHover; c["tokens.buttons.hover.color"] = p.buttonHoverText; c["tokens.buttons.active.bg"] = p.buttonActive; c["tokens.buttons.active.color"] = p.buttonActiveText;
  c["tokens.buttons.focus.color"] = p.primary; c["tokens.buttons.focus.width"] = 3;
  c["tokens.forms.bg"] = p.surface; c["tokens.forms.color"] = p.text; c["tokens.forms.borderColor"] = d.components.forms.borderColor; c["tokens.forms.borderWidth"] = 1; c["tokens.forms.radius"] = d.components.forms.radius;
  c["tokens.forms.paddingY"] = d.components.forms.paddingY; c["tokens.forms.paddingX"] = d.components.forms.paddingX; c["tokens.forms.focusColor"] = d.components.forms.focusColor;
  c["tokens.forms.placeholderColor"] = p.muted; c["tokens.forms.labelColor"] = p.text; c["tokens.forms.accent"] = p.primary;
  c["tokens.images.radius"] = d.components.images.radius;
  c["settings.layout.contentWidth"] = d.layout.contentWidth; c["settings.layout.containerWidth"] = d.layout.containerWidth; c["settings.layout.gutter"] = d.layout.gutter;
  for (const [bp, r] of Object.entries(d.responsive)) for (const [k, v] of Object.entries(r)) c[`settings.responsive.${bp}.${k}`] = v;
  return c;
}

// Design Validation Engine : contrastes, polices, bornes, cohérence responsive, et passage dans les normaliseurs STRICTS du moteur (jetons + réglages de site)
function validate(d, changes = toChanges(d)) {
  const errors = [], warnings = [];
  const contrasts = color.audit(d.palette);
  for (const c of contrasts) if (!c.ok) errors.push(`Contraste insuffisant : ${c.pair} (${c.ratio} < ${c.min}).`);
  errors.push(...typo.check(d.typography));
  for (const [path, v] of Object.entries(changes)) if (/^tokens\.(colors|link\.(color|hoverColor)|border\.color|buttons\.\w+\.(bg|color)|forms\.\w*[cC]olor|forms\.(bg|color|accent))/.test(path) && !color.HEX.test(v)) errors.push(`Couleur invalide pour ${path}.`);
  const r = d.responsive;
  if (!(r.mobile.h1 <= r.tablet.h1 && r.tablet.h1 <= d.typography.sizes.h1)) errors.push("Échelle responsive incohérente : le titre doit diminuer du bureau au mobile.");
  if (r.mobile.body < 16) errors.push("Texte mobile inférieur à 16 px.");
  if (r.mobile.h1 < 26) errors.push("Titre mobile trop petit.");
  // Passage par les normaliseurs natifs en mode strict (refusent toute valeur hors bornes) : on reconstruit les jetons et les réglages concernés
  try {
    const tk = JSON.parse(JSON.stringify(tokensLib.DEFAULT_TOKENS)), st = { layout: {}, responsive: { tablet: {}, mobile: {} } };
    for (const [path, v] of Object.entries(changes)) {
      const parts = path.split("."); const root = parts.shift(); const target = root === "tokens" ? tk : st;
      let o = target; while (parts.length > 1) { const k = parts.shift(); o[k] = o[k] && typeof o[k] === "object" ? o[k] : {}; o = o[k]; }
      o[parts[0]] = v;
    }
    tokensLib.normalizeTokens(tk, { strict: true });
    settingsLib.normalizeSettings(st, { strict: true });
  } catch (e) { errors.push(`Refusé par le moteur de styles : ${e.message}`); }
  // Information : propriétés demandées par la mission sans équivalent natif
  warnings.push("Couleur dédiée aux titres, interlettrage des boutons et styles de navigation : pas de réglage natif correspondant (non générés).");
  return { ok: errors.length === 0, errors, warnings, contrasts };
}

// Trois directions pour un même projet : A (la plus proche du brief), B (alternative sobre), C (contrastée / premium). Même structure de site, jamais trois sites.
const NEIGHBOR = { corporate: "institutionnel", institutionnel: "corporate", minimaliste: "corporate", luxe: "editorial", editorial: "luxe", creatif: "tech", tech: "corporate", ecommerce: "minimaliste", educatif: "corporate" };
const BLURB = {
  corporate: "Sérieux et rassurant : bleus profonds, structure claire.", minimaliste: "Épuré : neutres, peu de couleur, beaucoup de blanc.", luxe: "Premium : bleu nuit, accent doré sourd, espaces généreux, titres à empattements.",
  creatif: "Expressif : couleurs plus vives, formes arrondies, titres affirmés.", editorial: "Lecture : papier chaud, empattements, hiérarchie marquée.", tech: "Moderne et dynamique : bleus vifs, interface dense.", ecommerce: "Commercial : contrastes nets, accent chaleureux pour les actions.",
  institutionnel: "Neutre et fiable : teintes posées, lisibilité maximale.", educatif: "Accessible et chaleureux : bleus francs, accents vifs, formes douces.",
};
function proposals(base, count = 3) {
  const out = [], seen = new Set();
  const variants = [
    { key: "a", name: `A — ${color.MOODS[base.mood].label}`, direction: base },
    { key: "b", name: `B — ${color.MOODS[NEIGHBOR[base.mood]].label}`, direction: { ...base, mood: NEIGHBOR[base.mood], fontPair: base.mood === "luxe" ? "editorial" : "neutre", density: base.density === "aeree" ? "equilibree" : base.density } },
    { key: "c", name: base.mood === "luxe" ? "C — Corporate sobre" : "C — Contraste premium", direction: { ...base, mood: base.mood === "luxe" ? "corporate" : "luxe", hue: (base.hue + (base.neutral ? 0 : 0)) % 360, density: "aeree", roundness: "net", fontPair: "classique" } },
  ];
  for (const v of variants) {
    const sig = JSON.stringify([v.direction.mood, v.direction.density, v.direction.roundness, v.direction.fontPair]);
    if (seen.has(sig)) continue; seen.add(sig);
    if (out.length >= count) break;
    const design = build(v.direction), changes = toChanges(design), report = validate(design, changes);
    out.push({ key: v.key, name: v.name, description: BLURB[v.direction.mood], design, changes, report,
      pros: [`Contrastes vérifiés (${report.contrasts.filter((c) => c.ok).length}/${report.contrasts.length})`, `Polices : ${typo.PAIRS[v.direction.fontPair].label}`], limits: design.unavailable.slice(0, 2) });
  }
  return out;
}
module.exports = { build, toChanges, validate, proposals, LIMITS, SPACE, RADIUS };
