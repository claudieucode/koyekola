// Catalogue « En-tête » (bibliothèque « Atelier ») : 100 modèles, 10 secteurs × 10 directions artistiques. Chaque modèle a sa propre ARCHITECTURE (header/arch.js : 36 compositions), sa propre IDENTITÉ
// (4 couleurs fixes + 2 polices de la bibliothèque locale : jamais la charte du site ni celle de l'administration), ses réglages de composition, son mouvement d'entrée et son survol.
// Voir docs/theme-builder/HEADER_LIBRARY_100_MODELS_REPORT.md (matrice de conception, tableau de comparaison) et le script scripts/audit-entetes-atelier.js.
const { ARCH } = require("./header/arch");
const { MODELS: BASE, SECTORS } = require("./header/models");
const contract = require("./header/contract");
const { wrap, mv, hv } = require("./header/blocks");

// Mouvement d'entrée (logo, navigation, actions) : décalé, court, natif (« motion » des éléments) ; coupé si le visiteur demande moins de mouvement. Survol des boutons : HOVERS du Page Builder.
const ENTRY = {
  rise: { mark: ["fade-in-up", 0], nav: ["fade-in-up", 120], act: ["fade-in-up", 220] },
  soft: { mark: ["fade-in", 0], nav: ["fade-in", 140], act: ["fade-in", 260] },
  reveal: { mark: ["reveal", 0], nav: ["fade-in", 260], act: ["fade-in", 380] },
  slide: { mark: ["slide-in-left", 0], nav: ["fade-in-down", 140], act: ["slide-in-right", 200] },
  zoom: { mark: ["zoom-in", 0], nav: ["fade-in", 160], act: ["fade-in", 280] },
};
const MARK = new Set(["sitetitle", "sitelogo"]), ACT = new Set(["button", "account", "minicart", "search"]);
// La recherche d'un modèle de boutique vise le catalogue du site, celle des autres secteurs le blog
function retarget(nodes, target) { const w = (n) => ({ ...n, ...(n.type === "search" ? { props: { ...n.props, target } } : {}), ...(n.children ? { children: n.children.map(w) } : {}) }); return nodes.map(w); }
function animate(nodes, kind, hover) {
  const e = ENTRY[kind];
  const walk = (n, inNav) => {
    let o = n;
    const own = n.motion && n.motion.entrance; // un nœud déjà animé par son modèle garde son mouvement
    if (own) o = n;
    else if (e && MARK.has(n.type)) o = mv(n, e.mark[0], e.mark[1], 700);
    else if (e && n.type === "menu") o = mv(n, e.nav[0], e.nav[1], 650);
    else if (e && ACT.has(n.type)) o = mv(n, e.act[0], e.act[1], 600);
    if (hover && n.type === "button") o = hv(o, hover);
    return n.children ? { ...o, children: n.children.map((c) => walk(c, inNav)) } : o;
  };
  return nodes.map((n) => walk(n));
}

// Contrat par secteur : header/sectors/<secteur>.js remplace les modèles hérités de ce secteur (HEADER_SECTOR_CONTRACT.md)
const { models: MODELS } = contract.merge(BASE, SECTORS, (k) => require(`./header/sectors/${k}`));
const FAMILIES = SECTORS.map((s) => ({ key: s.key, label: s.label }));
// Modèle de secteur (M.custom) : build(k, P) fournit les rangées ; l'enveloppe, l'entrée et le survol restent ceux du moteur commun
const rowsOf = (M, k) => (M.custom ? M.build(k, M.P) : ARCH[M.arch](k, M.P, M.V));
const LAYOUTS = MODELS.map((M) => ({
  key: M.key, family: M.sector, skin: M.key, label: M.name, tags: [M.sector, M.art.toLowerCase(), ...(M.custom ? M.tags.map((t) => t.toLowerCase()) : [M.arch]), M.dark ? "sombre" : "clair"], desc: `${M.art}. ${M.desc}`, model: M,
  build: (k) => retarget(animate([wrap(M.S, rowsOf(M, k), M.mode)], M.anim === "none" ? "" : M.anim, M.hover), M.sector === "ecom" ? "catalogue" : "blog"),
}));
// Validation profonde des modèles de secteur au chargement (grammaire + mouvements annoncés)
const { kit, withIds } = require("./kit");
for (const M of MODELS) if (M.custom) contract.validateBuilt(M, withIds(LAYOUTS.find((l) => l.key === M.key).build(kit(M.S))));

module.exports = { type: "header", kind: "component", flat: true, ownSkins: true, families: FAMILIES, layouts: LAYOUTS, skins: MODELS.map((M) => M.S), MODELS };
