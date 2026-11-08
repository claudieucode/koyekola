// Catalogue de modèles du Theme Builder : 100 modèles par type (contenus × compositions, ou mises en page × identités selon le type). Le catalogue est du CODE : aucune ligne en base tant qu'un modèle n'est pas utilisé.
// · list()  — métadonnées seulement (jamais le document), filtrées et paginées : la liste reste instantanée quel que soit le nombre de modèles ;
// · build() — le document d'UN modèle, construit à la demande (et gardé en mémoire dans un cache borné) ;
// · use()   — « Utiliser ce modèle » : crée la copie INDÉPENDANTE du site (composant ou page), puis le modèle du Theme Builder (brouillon). Modifier la copie ne change jamais le catalogue.
const { SKINS, skinOf, kit, layout, withIds } = require("./kit");
const Types = require("../types");

const FILES = ["header", "footer", "single_page", "single_post", "archive", "search_results", "not_found", "single_product", "product_archive"];
const LOADED = new Map();
function def(type) {
  if (!FILES.includes(type)) return null;
  if (!LOADED.has(type)) LOADED.set(type, require(`./${type}`));
  return LOADED.get(type);
}
const types = () => FILES.filter((t) => Types.has(t));
const PER_TYPE = () => (SKINS.length * 20);
// Catalogue « plat » (ex. En-tête) : chaque modèle est UNE composition propre (famille + identité fixée par le modèle), pas un croisement mise en page × identité.
// d.flat = true, d.families = [{ key, label }], chaque mise en page porte { key, family, skin } ; le filtre « mise en page » de l'interface liste alors les familles.

// Identités d'un catalogue : les cinq du site, plus celles qu'un catalogue « plat » déclare lui-même (d.skins : palette et polices propres à ses modèles)
const identities = (d) => (d && d.skins ? (d.ownSkins ? d.skins : [...SKINS, ...d.skins]) : SKINS);

const META = new Map();
function entries(type) {
  const d = def(type);
  if (!d) return [];
  if (META.has(type)) return META.get(type);
  // Catalogue à entrées propres (ex. Page 404) : chaque entrée porte sa composition ET son identité visuelle
  if (typeof d.entries === "function") { const own = d.entries().map((e) => ({ type, skinLabel: (SKINS.find((s) => s.key === e.skinKey) || {}).label || e.skinKey, ...e })); META.set(type, own); return own; }
  const out = [];
  if (d.flat) {
    const fam = new Map(d.families.map((f) => [f.key, f]));
    for (const l of d.layouts) { const s = identities(d).find((x) => x.key === l.skin), f = fam.get(l.family); out.push({ key: `${l.key}.${l.keySkin || s.key}`, type, layoutKey: f.key, layoutId: l.key, skinKey: s.key, name: l.label, layoutLabel: f.label, skinLabel: s.label, desc: l.desc, tags: [...l.tags, s.key] }); }
  } else for (const l of d.layouts) for (const s of SKINS) out.push({ key: `${l.key}.${s.key}`, type, layoutKey: l.key, layoutId: l.key, skinKey: s.key, name: `${l.label} · ${s.label}`, layoutLabel: l.label, skinLabel: s.label, desc: l.desc, tags: [...l.tags, s.key] });
  META.set(type, out);
  return out;
}
const fold = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Liste paginée : { items, total, page, pages, limit, layouts, skins }
function list(type, { q = "", tag = "", skin = "", layout: lay = "", page = 1, limit = 24 } = {}) {
  const all = entries(type);
  if (!all.length) return { items: [], total: 0, page: 1, pages: 1, limit, layouts: [], skins: [] };
  const needle = fold(q).trim(), t = fold(tag), lim = Math.min(60, Math.max(1, Number(limit) || 24));
  const rows = all.filter((e) => (!skin || e.skinKey === skin) && (!lay || e.layoutKey === lay) && (!t || e.tags.some((x) => fold(x) === t)) && (!needle || fold(`${e.name} ${e.desc} ${e.tags.join(" ")}`).includes(needle)));
  const pages = Math.max(1, Math.ceil(rows.length / lim)), p = Math.min(pages, Math.max(1, Number(page) || 1));
  const d = def(type);
  return { items: rows.slice((p - 1) * lim, p * lim).map(({ build: _b, ...m }) => m), total: rows.length, page: p, pages, limit: lim,
    layouts: (d.flat ? d.families : d.layouts).map((l) => ({ key: l.key, label: l.label })), skins: identities(d).map((s) => ({ key: s.key, label: s.label })), tags: [...new Set(all.flatMap((e) => e.tags))].sort() };
}
const find = (type, key) => entries(type).find((e) => e.key === key) || null;

// Lisibilité des liens du texte d'article : la couleur par défaut des liens (couleur d'accent) peut disparaître sur un fond sombre (identités Nuit et Marque). On suit le fond EFFECTIF de chaque élément
// et, quand le contenu de l'article est posé sur un fond sombre, la partie « liens » du contenu reçoit une couleur claire soulignée (réglage natif « parties », modifiable dans l'éditeur).
const hexLum = (h) => { const m = /^#([0-9a-f]{6})/i.exec(h); if (!m) return null; const v = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
// null = inchangé (fond transparent ou semi-transparent) ; sinon « sombre » ou « clair » avec la couleur de texte lisible associée
const bgClass = (c) => {
  if (!c || typeof c !== "string") return null;
  if (c === "token:primary" || c === "token:secondary") return { dark: true, on: "token:on-primary" };
  if (c === "token:accent") return { dark: true, on: "token:on-accent" };
  if (c.startsWith("token:")) return { dark: false };
  if (/^#[0-9a-f]{8}$/i.test(c)) return null;
  const l = hexLum(c); return l === null ? null : l < 0.25 ? { dark: true, on: "#f1f5f9" } : { dark: false };
};
function legibleLinks(nodes, bg) {
  for (const n of nodes) {
    const own = bgClass(n.styles && n.styles.desktop && n.styles.desktop.backgroundColor), here = own || bg;
    if (n.type === "postcontent" && here && here.dark && !(n.parts && n.parts.link)) n.parts = { ...(n.parts || {}), link: { styles: { desktop: { color: here.on, textDecoration: "underline" } } } };
    if (n.children) legibleLinks(n.children, here);
  }
}

const CACHE = new Map();
// Document d'un modèle : { name, kind: "component" | "page", section | sections }. env : { formId } (formulaire d'inscription réel du site, s'il en existe un).
function build(type, key, env = {}) {
  const meta = find(type, key);
  if (!meta) return null;
  const ck = `${type}:${key}:${env.formId || 0}`;
  if (CACHE.has(ck)) return CACHE.get(ck);
  const d = def(type), S = identities(d).find((x) => x.key === meta.skinKey) || skinOf(meta.skinKey);
  const buildFn = meta.build || d.layouts.find((x) => x.key === meta.layoutId).build;
  const children = withIds(buildFn(kit(S), env));
  if (type === "single_post") { legibleLinks(children, null); require("./single_post/apply").apply(children, S); } // identité propre : voir single_post/apply.js
  const out = { name: meta.name, kind: d.kind, ...(d.kind === "component" ? { section: { id: undefined, ...layout(children) } } : { sections: [layout(children)] }) };
  if (out.section) delete out.section.id;
  if (CACHE.size > 300) CACHE.clear();
  CACHE.set(ck, out);
  return out;
}
const thumbDoc = (type, key, env = {}) => { const b = build(type, key, env); return b ? (b.section || b.sections[0]) : null; };
const stats = () => types().map((t) => ({ type: t, label: Types.TYPES[t].label, count: entries(t).length, layouts: def(t).layouts.length, ...(def(t).flat ? { flat: true } : {}) }));
module.exports = { types, list, find, build, thumbDoc, entries, stats, SKINS, PER_TYPE, FILES };
