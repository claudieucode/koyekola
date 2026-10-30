// Layout Validation Engine (programme 22.3) : la composition est validée par le normaliseur NATIF des sections (types, propriétés, valeurs, identifiants, nombre/profondeur d'éléments).
// Rien n'est « validé » par ce module lui-même : il appelle `sections.normalizeSection` puis mesure la structure obtenue et vérifie que le contenu fourni est entièrement repris.
const sectionsLib = require("../marketing/pages/sections");
const { MarketingError } = require("../marketing/errors");
const crypto = require("node:crypto");

const sectionId = (seed) => `l${crypto.createHash("sha1").update(String(seed)).digest("hex").slice(0, 11)}`;
const toSection = (seed, nodes, name = "") => ({ type: "layout", id: sectionId(seed), ...(name ? { name } : {}), children: nodes });

function walk(nodes, fn, depth = 1, parent = null) { for (const n of nodes || []) { fn(n, depth, parent); walk(n.children, fn, depth + 1, n); } }
function metrics(section) {
  const m = { nodes: 0, depth: 0, widgets: {}, grids: 0, flex: 0, customCss: 0, bands: 0 };
  walk(section.children, (n, d) => {
    m.nodes += 1; m.depth = Math.max(m.depth, d); m.widgets[n.type] = (m.widgets[n.type] || 0) + 1;
    const st = (n.styles && n.styles.desktop) || {};
    if (st.display === "grid" || n.type === "grid") m.grids += 1;
    if (st.display === "flex") m.flex += 1;
    if (n.css || n.cssHover) m.customCss += 1;
    if (n.props && n.props.band) m.bands += 1;
  });
  return m;
}
// Validation native. Renvoie { ok, errors, section (normalisée), metrics }.
function validate(ctx, section) {
  try {
    const counter = { n: 0, ids: new Set() };
    const out = sectionsLib.normalizeSection(ctx, section, 0, counter);
    return { ok: true, errors: [], section: out, metrics: metrics(out) };
  } catch (e) {
    if (e instanceof MarketingError || e instanceof Error) return { ok: false, errors: [e.message], section: null, metrics: metrics(section) };
    throw e;
  }
}
// Texte brut d'un arbre (pour vérifier que RIEN n'a été tronqué ni perdu)
const plain = (h) => String(h || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const squash = (s) => String(s || "").replace(/\s+/g, " ").trim();
function textOf(section) {
  const out = [];
  walk(section.children, (n) => {
    const p = n.props || {};
    for (const k of ["text", "label", "title", "price", "q", "a", "name", "role", "badge", "period", "description", "caption", "alt"]) if (typeof p[k] === "string") out.push(p[k]);
    if (p.html) out.push(plain(p.html));
    for (const it of p.items || []) if (it && typeof it === "object") { for (const v of Object.values(it)) if (typeof v === "string") out.push(v); } else if (typeof it === "string") out.push(it);
    for (const f of p.features || []) out.push(f);
    for (const im of p.images || []) { if (im.alt) out.push(im.alt); if (im.caption) out.push(im.caption); }
    for (const r of p.rows || []) for (const cell of r) out.push(cell);
  });
  return squash(out.join(" "));
}
// Chaînes du contenu qui doivent figurer dans la composition, SELON LE RÔLE (un héros n'affiche pas tous les éléments d'une liste ; une FAQ n'affiche que les questions complètes, etc.)
function expectedStrings(c, role = "text") {
  const e = [c.title];
  if (["hero", "detail"].includes(role)) e.push(c.eyebrow);
  if (role !== "logos" && role !== "gallery" || c.text) for (const p of String(c.text || "").split(/\n{2,}/)) e.push(p);
  const items = c.items || [];
  const pick = {
    faq: items.filter((i) => i.q && i.a).flatMap((i) => [i.q, i.a]),
    testimonials: items.filter((i) => i.text && (i.author || i.title)).flatMap((i) => [i.text, i.author || i.title]),
    pricing: items.filter((i) => i.title && i.price).flatMap((i) => [i.title, i.price, i.text]),
    stats: items.filter((i) => Number.isFinite(i.value)).flatMap((i) => [i.title || i.text]),
    hero: [], logos: [], gallery: [], compare: [], cta: [],
    contact: items.flatMap((i) => [i.text || i.title]), detail: items.flatMap((i) => [i.title || i.text]),
  }[role];
  if (pick) e.push(...pick);
  else for (const i of items) e.push(i.title, i.text, i.price);
  return e.map(squash).filter(Boolean);
}
function preserved(section, c, role) {
  const hay = textOf(section);
  const missing = expectedStrings(c, role).filter((s) => !hay.includes(s));
  return { ok: missing.length === 0, missing };
}
// Seuils de complexité (performance) : au-delà, la composition est signalée (pas refusée : le maximum natif est de 400 éléments par page et 8 niveaux)
const LIMITS = Object.freeze({ nodes: 90, depth: 6 });
module.exports = { validate, metrics, toSection, sectionId, textOf, preserved, walk, expectedStrings, LIMITS };
