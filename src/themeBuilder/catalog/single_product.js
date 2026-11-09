// Catalogue « Fiche produit » : 100 modèles RÉELLEMENT différents (10 familles de 10), chacun avec sa propre identité graphique à valeurs fixes (palette + 2 polices de la bibliothèque locale + forme),
// jamais les jetons du site. Chaque modèle est défini par 4 axes (galerie · informations · contenu · achat, voir single_product/concepts.js), jamais deux fois le même quadruplet, puis par ses propres
// briques (single_product/A.js … J.js). Tout vient des données réelles de la boutique : étiquettes {{product.*}}, widgets shopgallery / shopbuy / shopreviews / shopspecs / shopgrid.
// Aucun faux prix, avis, stock ni image : les textes de réassurance, livraison, retours, entretien… sont des consignes éditables (« Indiquez ici… »).
// Audit : scripts/audit-fiche-produit.js.
const CONCEPTS = require("./single_product/concepts");
const { SKINS } = require("./single_product/skins");
const { compose } = require("./single_product/compose");
const SPECS = Object.assign({}, ...["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((f) => require(`./single_product/${f}`)));

const FAMILIES = [
  { key: "galeries", label: "Galeries et classiques" }, { key: "mode", label: "Mode et chaussures" }, { key: "luxe", label: "Luxe, bijoux et montres" }, { key: "beaute", label: "Beauté et bien-être" },
  { key: "tech", label: "Technologie" }, { key: "maison", label: "Maison" }, { key: "alimentaire", label: "Alimentaire et artisanat" }, { key: "sport", label: "Sport, auto, enfants et pro" },
  { key: "numerique", label: "Numérique et formation" }, { key: "specialises", label: "Spécialisés" },
];
const FAM = Object.fromEntries(FAMILIES.map((f, i) => ["ABCDEFGHIJ"[i], f]));
const AX = {
  gal: { V: "vignettes verticales", H: "vignettes horizontales", S: "images empilées", G: "grille de deux colonnes", M: "mosaïque", C: "carrousel", Z: "image unique avec zoom", F: "visuel plein écran", T: "volet image fixe", N: "petite image" },
  inf: { R: "informations à droite", L: "informations à gauche", K: "colonne d'achat collante", Ctr: "informations centrées", C3: "trois colonnes", O: "informations sur l'image", B: "bandeau de titre" },
  cont: { TAB: "onglets", ACC: "accordéons", SEC: "sections ancrées", EDI: "texte éditorial", SPEC: "tableau technique", FLAT: "description simple" },
  ach: { IN: "achat dans la fiche", CARD: "carte d'achat", BAR: "barre d'achat collée", DRAW: "panneau d'achat latéral", STK: "achat collant", CFG: "zone de personnalisation" },
};
const DARK = (s) => { const m = /^#(..)(..)(..)$/.exec(s.bg); return m ? (parseInt(m[1], 16) * 299 + parseInt(m[2], 16) * 587 + parseInt(m[3], 16) * 114) / 1000 < 90 : false; };

const LAYOUTS = CONCEPTS.map((c) => {
  const skin = SKINS.find((s) => s.key === c.id.toLowerCase()), sp = SPECS[c.id], fam = FAM[c.id[0]];
  if (!skin || !sp) throw new Error(`Fiche produit : modèle ${c.id} incomplet (identité ou réglages manquants).`);
  return {
    key: c.id.toLowerCase(), family: fam.key, skin: skin.key, label: c.nom, axes: { gal: c.gal, inf: c.inf, cont: c.cont, ach: c.ach },
    tags: [fam.label.toLowerCase(), c.secteur.toLowerCase(), AX.gal[c.gal], AX.cont[c.cont], AX.ach[c.ach], DARK(skin) ? "sombre" : "clair"],
    desc: `${c.sig}. Galerie : ${AX.gal[c.gal]} ; ${AX.inf[c.inf]} ; contenu en ${AX.cont[c.cont]} ; ${AX.ach[c.ach]}.`,
    build: (k) => compose(k, c, sp),
  };
});

module.exports = { type: "single_product", kind: "page", flat: true, ownSkins: true, families: FAMILIES, layouts: LAYOUTS, skins: SKINS };
