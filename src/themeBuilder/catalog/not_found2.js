// Catalogue « Page 404 » — nouvelle bibliothèque (100 modèles ; EN CONSTRUCTION tant que le dépôt n'a pas basculé : voir docs/theme-builder/404/IMPLEMENTATION_ROADMAP.md).
// Principe : chaque modèle est UN concept de page 404 (composition, traitement du numéro, parcours de récupération, identité) — jamais un croisement « contenu × mise en page × couleur ».
// Un modèle porte son identité visuelle fixe (palette, polices) : modifiable ensuite dans l'éditeur. Tout est fait d'éléments natifs du Page Builder ; aucun lien factice, aucune image factice, aucun
// contenu inventé (aucun faux chiffre, avis ou produit) ; les liens pointent vers des pages standard (/, /blog, /catalogue, /contact, /boutique, /compte).
// Axes de diversité : le modèle DÉCLARE C (composition), N (numéro), P (palette), T (typographie) ; M (média), A (animation), R (parcours) et D (densité) sont DÉRIVÉS du document réellement construit.
const FAMILIES = [
  { key: "minimalistes", label: "Minimalistes" }, { key: "creatives", label: "Créatives et artistiques" }, { key: "technologiques", label: "Technologiques" },
  { key: "illustratives", label: "Illustratives" }, { key: "photographiques", label: "Photographiques" }, { key: "ecommerce", label: "E-commerce" }, { key: "saas", label: "SaaS et logiciel" },
  { key: "editoriales", label: "Éditoriales et magazines" }, { key: "entreprises", label: "Entreprises et institutions" }, { key: "education", label: "Éducation et formation" },
  { key: "communautes", label: "Communautés" }, { key: "marketing", label: "Marketing et conversion" }, { key: "interactives", label: "Interactives" },
  { key: "premium", label: "Élégantes et premium" }, { key: "experimentales", label: "Expérimentales" },
];
const FILES = ["fam-01", "fam-02", "fam-03", "fam-04", "fam-05", "fam-06", "fam-07", "fam-08", "fam-09", "fam-10", "fam-11", "fam-12", "fam-13", "fam-14", "fam-15"];
const LAYOUTS = [];
for (const f of FILES) { try { LAYOUTS.push(...require(`./not_found2/${f}`)); } catch (e) { if (e.code !== "MODULE_NOT_FOUND" || !String(e.message).includes(`./not_found2/${f}`)) throw e; } }
LAYOUTS.forEach((l, i) => { l.id = `404-${String(i + 1).padStart(3, "0")}`; });

let EXTRAS = {};
try { EXTRAS = require("./not_found2/extras.json"); } catch { EXTRAS = {}; }
const { ADDONS, NUMERALS } = require("./not_found2/addons");
// Un modèle = son concept + 0 à 2 compléments de récupération (lecture, recherche, aide…) ajoutés à la fin de sa section, + éventuellement un traitement du numéro 404 en tête s'il n'en avait pas.
// Les valeurs viennent de extras.json, choisies (et vérifiées) par le test de diversité : { a: [compléments], n: "traitement du numéro" }.
LAYOUTS.forEach((l) => {
  const base = l.build;
  l.build = (k, env, ex = EXTRAS[l.key] || {}) => {
    const ch = base(k, env), host = ch[0]; const names = ex.a || [];
    // Garantie d'accessibilité : une sortie directe (bouton, lien, recherche ou menu) est toujours présente en dehors des widgets interactifs ; sinon un lien « Retour à l'accueil » est ajouté
    let direct = false; walk({ type: "layout", children: ch }, (x) => { if (["button", "link", "search", "menu"].includes(x.type)) direct = true; });
    if (!direct && host && Array.isArray(host.children)) host.children = [...host.children, k.LINK("Retour à l'accueil", "/", { fontFamily: k.S.font, textDecoration: "underline", alignSelf: "center" })];
    if (host && Array.isArray(host.children)) { if (ex.n && NUMERALS[ex.n]) host.children = [NUMERALS[ex.n].node(k), ...host.children]; if (names.length) host.children = [...host.children, ...names.map((n) => ADDONS[n](k, env)).filter(Boolean)]; }
    return ch;
  };
  l.numeral = (ex = EXTRAS[l.key] || {}) => (ex.n && NUMERALS[ex.n] ? NUMERALS[ex.n].N : l.decl.N);
  l.baseBuild = base;
});

const FAM = Object.fromEntries(FAMILIES.map((f) => [f.key, f]));
const WRAP = new Set(["layout", "container", "stack", "group", "grid", "columns", "column", "root"]);
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
// Axes dérivés du document construit
function derive(children, decl) {
  const media = new Set(), motion = new Set(), way = new Set(); let n = 0, links = 0, contact = false;
  walk({ type: "layout", children }, (x) => {
    if (!WRAP.has(x.type)) n += 1;
    const t = x.type, p = x.props || {};
    if (t === "motionsvgdraw" || t === "lottie") media.add("illustration");
    if (t === "container" && !(x.children || []).length) media.add("formes");
    if (["icon", "iconbox", "iconlist"].includes(t)) media.add("icônes");
    if (["image", "video", "gallery"].includes(t)) media.add("photo");
    if ((t === "posts" && p.showImage !== false) || t === "shopgrid" || t === "courselist") media.add("couvertures");
    if (t === "motiontypewriter") motion.add("machine");
    if (["motiontiltcard", "motionmagneticbutton", "motioncursor", "motionimageparallax"].includes(t)) motion.add("pointeur");
    if (["motiongradienttext", "motionkinetictext", "motiontextscramble", "motionsplittext", "motionanimatedbg", "marquee", "motionsvgdraw", "motionrotatingtext", "motiontextreveal", "motionmarqueevelocity"].includes(t)) motion.add("ambiante");
    if (["accordion", "tabs", "flipbox", "toggle", "modal", "hotspot", "tooltip"].includes(t) || (t === "container" && p.mode)) motion.add("interactive");
    if (t === "search" || t === "shopsearch") way.add("recherche");
    if (t === "posts" || (t === "querylist" && p.source === "posts")) way.add("articles");
    if (t === "querylist" && p.source === "categories") way.add("catégories");
    if (t === "courselist") way.add("formations");
    if (t === "shopgrid") way.add("boutique");
    if (t === "emailsubscribe") way.add("abonnement");
    if (t === "account") way.add("compte");
    if (t === "menu") way.add("menu");
    if (t === "button" || t === "link") { links += 1; if (p.url === "/contact") contact = true; }
  });
  if (links >= 4) way.add("liens");
  if (contact) way.add("contact");
  return { C: decl.C, N: decl.N, M: [...media].sort().join("+") || "typographie", A: [...motion].sort().join("+") || "aucune", R: [...way].sort().join("+") || "accueil", P: decl.P, T: decl.T, D: n <= 6 ? 1 : n <= 12 ? 2 : n <= 22 ? 3 : 4 };
}

const entries = () => LAYOUTS.map((l) => ({
  key: l.key, code: l.id, name: l.name, desc: l.desc, tags: [...l.tags, FAM[l.family].label], layoutKey: l.family, layoutId: l.key, layoutLabel: FAM[l.family].label,
  skinKey: l.skin.key, skinLabel: l.skin.label, decl: l.decl, get axes() { const { kit } = require("./kit"); const { withIds } = require("./kit"); return derive(l.build(kit(l.skin), {}), { ...l.decl, N: l.numeral() }); }, build: l.build,
}));
module.exports = { all: LAYOUTS, type: "not_found", kind: "page", flat: true, ownSkins: true, families: FAMILIES, layouts: LAYOUTS.map((l) => ({ key: l.key, label: l.name, family: l.family, skin: l.skin.key })), skins: LAYOUTS.map((l) => l.skin), entries, derive };
