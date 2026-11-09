// Catalogue de modèles du Theme Builder : 100 modèles par type (contenus × compositions, ou mises en page × identités selon le type). Le catalogue est du CODE : aucune ligne en base tant qu'un modèle n'est pas utilisé.
// · list()  — métadonnées seulement (jamais le document), filtrées et paginées : la liste reste instantanée quel que soit le nombre de modèles ;
// · build() — le document d'UN modèle, construit à la demande (et gardé en mémoire dans un cache borné) ;
// · use()   — « Utiliser ce modèle » : crée la copie INDÉPENDANTE du site (composant ou page), puis le modèle du Theme Builder (brouillon). Modifier la copie ne change jamais le catalogue.
const { SKINS, skinOf, kit, layout, withIds } = require("./kit");
const Modes = require("./identityModes");
const MODE_TYPES = new Set(["single_product"]); // catalogues dont les modèles portent leur identité propre ET proposent les modes indépendant / hérité / hybride
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

// Entrées d'un catalogue « plat » à partir d'une liste de compositions. l.fullKey : identifiant complet imposé (modèles de la refonte : « ft-<famille>-<nn>-<nom> ») ; sinon « composition.identité ».
function flatEntries(type, d, layouts) {
  const fam = new Map(d.families.concat(d.hiddenFamilies || []).map((f) => [f.key, f]));
  return layouts.map((l) => {
    const s = identities(d).find((x) => x.key === l.skin), f = fam.get(l.family);
    return { key: l.fullKey || `${l.key}.${l.keySkin || s.key}`, type, layoutKey: f.key, layoutId: l.key, skinKey: s.key, name: l.label, layoutLabel: f.label, skinLabel: s.label, desc: l.desc, tags: [...l.tags, s.key], build: l.build, ...(l.legacy ? { legacy: true } : {}), ...(l.version !== undefined ? { version: l.version, addedAt: l.addedAt ?? null } : {}) };
  });
}
const META = new Map();
function entries(type) {
  const d = def(type);
  if (!d) return [];
  if (META.has(type)) return META.get(type);
  // Catalogue à entrées propres (ex. Page 404) : chaque entrée porte sa composition ET son identité visuelle
  if (typeof d.entries === "function") { const own = d.entries().map((e) => ({ type, skinLabel: (SKINS.find((s) => s.key === e.skinKey) || {}).label || e.skinKey, ...e })); META.set(type, own); return own; }
  const out = [];
  if (d.flat) {
    out.push(...flatEntries(type, d, d.layouts));
  } else for (const l of d.layouts) for (const s of SKINS) out.push({ key: `${l.key}.${s.key}`, type, layoutKey: l.key, layoutId: l.key, skinKey: s.key, name: `${l.label} · ${s.label}`, layoutLabel: l.label, skinLabel: s.label, desc: l.desc, tags: [...l.tags, s.key] });
  META.set(type, out);
  return out;
}
const fold = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Tris proposés par un catalogue « triable » (aujourd'hui le seul Pied de page ; les autres types ne changent pas). "" = ordre du catalogue.
const SORTS = [{ key: "", label: "Ordre de la bibliothèque" }, { key: "nom", label: "Nom (A → Z)" }, { key: "famille", label: "Famille" }, { key: "recent", label: "Plus récents d'abord" }, { key: "favoris", label: "Favoris d'abord" }];
const cmpText = (a, b) => String(a).localeCompare(String(b), "fr", { sensitivity: "base", numeric: true });
function sortRows(rows, tri, favs, famOrder) {
  const idx = new Map(rows.map((e, i) => [e.key, i])), by = (f) => (a, b) => f(a, b) || idx.get(a.key) - idx.get(b.key); // égalité : ordre du catalogue (tri stable et déterministe)
  if (tri === "nom") return [...rows].sort(by((a, b) => cmpText(a.name, b.name)));
  if (tri === "famille") return [...rows].sort(by((a, b) => (famOrder.get(a.layoutKey) ?? 99) - (famOrder.get(b.layoutKey) ?? 99) || cmpText(a.name, b.name)));
  if (tri === "recent") return [...rows].sort(by((a, b) => String(b.addedAt || "").localeCompare(String(a.addedAt || "")) || (b.version || 0) - (a.version || 0)));
  if (tri === "favoris") return [...rows].sort(by((a, b) => (favs && favs.has(b.key) ? 1 : 0) - (favs && favs.has(a.key) ? 1 : 0)));
  return rows;
}
// Liste paginée : { items, total, page, pages, limit, layouts, skins } (+ familles, sorts pour un catalogue triable).
// favorites (Set de clés) et favOnly ne servent qu'aux catalogues triables ; tri est ignoré par les autres.
function list(type, { q = "", tag = "", skin = "", layout: lay = "", page = 1, limit = 24, tri = "", favorites = null, favOnly = false } = {}) {
  const all = entries(type);
  if (!all.length) return { items: [], total: 0, page: 1, pages: 1, limit, layouts: [], skins: [] };
  const d = def(type), sortable = Boolean(d.sortable);
  const needle = fold(q).trim(), t = fold(tag), lim = Math.min(60, Math.max(1, Number(limit) || 24));
  const base = all.filter((e) => (!skin || e.skinKey === skin) && (!t || e.tags.some((x) => fold(x) === t)) && (!needle || fold(`${e.name} ${e.desc} ${e.tags.join(" ")}`).includes(needle)) && (!sortable || !favOnly || (favorites && favorites.has(e.key))));
  let rows = base.filter((e) => !lay || e.layoutKey === lay);
  const famOrder = new Map(sortable ? d.familles.map((f, i) => [f.key, i]) : []);
  if (sortable && SORTS.some((s) => s.key === tri)) rows = sortRows(rows, tri, favorites, famOrder);
  const pages = Math.max(1, Math.ceil(rows.length / lim)), p = Math.min(pages, Math.max(1, Number(page) || 1));
  const out = { items: rows.slice((p - 1) * lim, p * lim).map(({ build: _b, ...m }) => m), total: rows.length, page: p, pages, limit: lim,
    layouts: (d.flat ? d.families : d.layouts).map((l) => ({ key: l.key, label: l.label })), skins: identities(d).map((s) => ({ key: s.key, label: s.label })), tags: [...new Set(all.flatMap((e) => e.tags))].sort() };
  if (sortable) {
    // Facette : nombre de modèles par famille avec TOUS les autres filtres appliqués (recherche, identité, étiquette, favoris), hors filtre de famille ; les 15 familles sont toujours présentes
    const cnt = {}; for (const e of base) cnt[e.layoutKey] = (cnt[e.layoutKey] || 0) + 1;
    out.familles = d.familles.map((f) => ({ key: f.key, label: f.label, description: f.description || "", built: !!f.built, target: f.target, count: cnt[f.key] || 0 }));
    out.sorts = SORTS; out.sort = SORTS.some((s) => s.key === tri) ? tri : "";
  }
  return out;
}
// Compositions que le catalogue ne LISTE plus (anciens modèles d'une famille reconstruite) mais qui restent ouvrables : « Revenir au modèle d'origine », vignette, aperçu d'un pied déjà installé.
const HIDDEN = new Map();
function hiddenEntries(type) {
  const d = def(type);
  if (!d || !Array.isArray(d.hiddenLayouts)) return [];
  if (!HIDDEN.has(type)) HIDDEN.set(type, flatEntries(type, d, d.hiddenLayouts));
  return HIDDEN.get(type);
}
// Ouvre un modèle par son identifiant. Un identifiant ANCIEN (alias, voir footer-aliases.js) est suivi jusqu'au modèle qui le remplace ; un modèle retiré de la liste reste ouvrable mais n'est jamais listé.
function find(type, key) {
  const hit = entries(type).find((e) => e.key === key);
  if (hit) return hit;
  const d = def(type);
  if (!d || typeof d.resolveAlias !== "function") return null;
  const target = d.resolveAlias(String(key || ""));
  if (!target) return null;
  return entries(type).find((e) => e.key === target) || hiddenEntries(type).find((e) => e.key === target) || null;
}

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
  const mode = MODE_TYPES.has(type) && Modes.MODES.includes(env.identity) ? env.identity : "own";
  const ck = `${type}:${key}:${env.formId || 0}:${mode}`;
  if (CACHE.has(ck)) return CACHE.get(ck);
  const d = def(type), S = Modes.skinFor(identities(d).find((x) => x.key === meta.skinKey) || skinOf(meta.skinKey), mode);
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
