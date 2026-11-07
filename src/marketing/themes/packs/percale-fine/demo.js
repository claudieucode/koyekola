// Catalogue de démonstration « Percale Fine » (26 produits : dimensions de lit, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Les dimensions ci-dessous sont les VRAIES valeurs de l'attribut « Dimension » des variantes créées par le moteur ; le tableau et le configurateur du thème les relisent d'ici,
// donc ce que le configurateur recommande existe sur les fiches produits.
const DH = ["90 × 190 cm", "140 × 190 cm", "160 × 200 cm", "180 × 200 cm", "200 × 200 cm"]; // drap-housse : largeur du matelas × longueur
const HC = ["140 × 200 cm", "200 × 200 cm", "240 × 220 cm", "260 × 240 cm"]; // housse de couette
const DP = ["180 × 290 cm", "240 × 300 cm", "270 × 310 cm"]; // drap plat
const TA = ["50 × 70 cm", "65 × 65 cm"]; // taie d'oreiller
const C2 = (...c) => ({ Coloris: c });

// Lit (largeur du matelas, en cm) -> dimension à choisir pour chaque pièce. Valeurs d'usage courant : toujours vérifier la hauteur de son matelas (bonnet du drap-housse indiqué sur chaque fiche).
const LITS = [
  { largeur: "90", nom: "Lit 1 place", drapHousse: DH[0], housse: HC[0], drapPlat: DP[0] },
  { largeur: "140", nom: "Lit 2 places", drapHousse: DH[1], housse: HC[1], drapPlat: DP[1] },
  { largeur: "160", nom: "Grand lit", drapHousse: DH[2], housse: HC[2], drapPlat: DP[2] },
  { largeur: "180", nom: "Très grand lit", drapHousse: DH[3], housse: HC[3], drapPlat: DP[2] },
  { largeur: "200", nom: "Lit extra-large", drapHousse: DH[4], housse: HC[3], drapPlat: DP[2] },
];

module.exports = {
  dimensions: { drapHousse: DH, housse: HC, drapPlat: DP, taie: TA },
  lits: LITS,
  categories: ["Draps-housses et draps", "Housses de couette", "Taies et traversins", "Plaids et couvre-lits", "Linge de bain", "Soin du linge"],
  products: [
    ["Drap-housse percale Blanc", 0, 79, 0, { Dimension: DH, ...C2("Blanc", "Craie") }, "partiel", ["percale", "drap-housse"], "Percale de coton long, bonnet de 35 cm."],
    ["Drap-housse satin de coton", 0, 98, 0, { Dimension: DH, ...C2("Brume", "Sable") }, "ok", ["satin", "drap-housse"], "Satin de coton, bonnet de 35 cm."],
    ["Drap-housse lin lavé", 0, 125, 0, { Dimension: DH, ...C2("Naturel", "Argile") }, "ok", ["lin", "drap-housse"], "Lin lavé, bonnet de 35 cm, s'assouplit au lavage."],
    ["Drap-housse percale Brume", 0, 79, 63, { Dimension: DH, ...C2("Brume") }, "ok", ["percale", "drap-housse", "fin-de-serie"], "Coloris en fin de série, percale de coton long."],
    ["Drap plat percale", 0, 69, 0, { Dimension: DP, ...C2("Blanc", "Craie") }, "ok", ["percale", "drap-plat"], "Ourlet à jour, percale de coton long."],
    ["Drap plat lin lavé", 0, 112, 0, { Dimension: DP, ...C2("Naturel", "Argile") }, "ok", ["lin", "drap-plat"], "Lin lavé, ourlet large."],
    ["Drap plat satin de coton", 0, 92, 0, { Dimension: DP }, "rupture", ["satin", "drap-plat"], "Satin de coton, ourlet à jour."],
    ["Housse de couette percale", 1, 145, 0, { Dimension: HC, ...C2("Blanc", "Craie", "Brume") }, "ok", ["percale", "housse-de-couette"], "Percale de coton long, fermeture à boutons de nacre."],
    ["Housse de couette satin de coton", 1, 185, 0, { Dimension: HC, ...C2("Brume", "Sable") }, "ok", ["satin", "housse-de-couette"], "Satin de coton, fermeture cachée."],
    ["Housse de couette lin lavé", 1, 210, 0, { Dimension: HC, ...C2("Naturel", "Argile") }, "partiel", ["lin", "housse-de-couette"], "Lin lavé, finition à plat."],
    ["Housse de couette percale ourlet piqué", 1, 168, 0, { Dimension: HC, ...C2("Blanc") }, "ok", ["percale", "housse-de-couette", "brode"], "Ourlet piqué au fil de coton."],
    ["Taie d'oreiller percale", 2, 28, 0, { Dimension: TA, ...C2("Blanc", "Craie") }, "ok", ["percale", "taie"], "Fermeture à portefeuille, percale de coton long."],
    ["Taie d'oreiller satin de coton", 2, 36, 0, { Dimension: TA, ...C2("Brume", "Sable") }, "ok", ["satin", "taie"], "Fermeture à portefeuille, satin de coton."],
    ["Taie d'oreiller lin lavé", 2, 42, 0, { Dimension: TA, ...C2("Naturel") }, "partiel", ["lin", "taie"], "Lin lavé, bord à plat."],
    ["Traversin percale", 2, 49, 0, { Dimension: ["140 cm", "160 cm"] }, "ok", ["percale", "traversin"], "Percale de coton long, fermeture à boutons."],
    ["Plaid coton gaufré", 3, 119, 0, { Dimension: ["130 × 180 cm", "170 × 220 cm"] }, "ok", ["coton", "plaid"], "Nid d'abeille de coton, frange nouée."],
    ["Couvre-lit matelassé", 3, 240, 192, { Dimension: ["180 × 240 cm", "240 × 260 cm"] }, "ok", ["coton", "couvre-lit", "fin-de-serie"], "Piqué à la machine, remplissage ouate de coton."],
    ["Plaid lin lavé", 3, 135, 0, null, "ok", ["lin", "plaid"], "140 × 200 cm, lin lavé."],
    ["Drap de bain éponge", 4, 59, 0, { Dimension: ["70 × 140 cm", "100 × 150 cm"], ...C2("Blanc", "Sable") }, "ok", ["eponge", "bain"], "Coton peigné, 600 g/m²."],
    ["Serviette invité", 4, 22, 0, { Dimension: ["30 × 50 cm", "50 × 100 cm"] }, "ok", ["eponge", "bain"], "Coton peigné, bordure tissée."],
    ["Peignoir éponge", 4, 129, 0, { Taille: ["S", "M", "L", "XL"] }, "ok", ["eponge", "bain"], "Col châle, ceinture passée."],
    ["Gant de toilette gaufré", 4, 12, 0, null, "ok", ["coton", "bain"], "Nid d'abeille de coton."],
    ["Tapis de bain coton", 4, 49, 0, null, "rupture", ["eponge", "bain"], "Coton épais, dessous antidérapant."],
    ["Protège-matelas coton", 0, 89, 0, { Dimension: DH }, "ok", ["coton", "protege-matelas"], "Face coton, bonnet de 35 cm."],
    ["Eau de linge à la lavande", 5, 24, 0, null, "libre", ["entretien"], "Vaporisateur de 250 ml, à repasser ou à ranger avec le linge."],
    ["Lessive pour linge délicat", 5, 19, 0, null, "libre", ["entretien"], "Lessive liquide douce, 1 litre."],
  ],
};
