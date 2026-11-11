// Les 100 concepts = 25 maisons × 4 compositions. Les réglages de structure (colonnes, barre latérale, navigation, filtre) sont répartis par rotation puis ajustés ici maison par maison.
const MAISONS = require("./maisons");
const slug = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const COMP_LABEL = { HG: "Héros + grille", V3: "Trois vedettes + liste", MS: "Sections", GA: "Grille asymétrique", UB: "Une + brèves", CJ: "Colonnes de journal", TL: "Frise datée", NU: "Classement par lectures", LT: "Liste texte", IX: "Index daté", SP: "Écran scindé", ST: "Pile d'images", FS: "Pleine largeur", PO: "Mur de fiches", OV: "Titres superposés", MO: "Mosaïque", TY: "Typographique", G: "Grille", CH: "Cartes compactes", CR: "Bande de vedettes", TB: "Tableau", LI: "Liste image à gauche", LD: "Liste image à droite", ZZ: "Vignettes à filets", GM: "Index daté en colonnes" };
const COLS = { HG: 3, V3: 3, MS: 3, GA: 3, UB: 3, CJ: 3, TL: 1, NU: 1, LT: 1, IX: 1, SP: 1, ST: 1, FS: 1, PO: 3, OV: 3, MO: 3, TY: 1, G: 3, CH: 2, CR: 4, TB: 1, LI: 1, LD: 1, ZZ: 1, GM: 2 };
const BARRE = ["0", "D", "G", "H"], NAV = ["N", "M", "PS", "I"], FILT = ["C", "CS", "T", "S"];
const ASPECT = { "16/9": "haut 16:9", "3/2": "haut 3:2", "4/3": "haut 4:3", "1/1": "carrée", "3/4": "portrait" };
const C = [];
MAISONS.forEach((m, mi) => m[6].split(",").forEach((comp, vi) => {
  const t = m[8];
  C.push({ n: C.length + 1, key: `${slug(m[1])}.${slug(COMP_LABEL[comp])}`, famKey: slug(m[1]), fam: `${m[1]} — ${m[2]}`, maison: m[0], nom: `${m[1]} · ${COMP_LABEL[comp]}`, usage: m[2], comp, cols: COLS[comp], img: ASPECT[t.aspect] || "haut 3:2",
    barre: BARRE[(mi + vi) % 4], tete: t.head, nav: NAV[(mi * 2 + vi) % 4], filtre: FILT[(mi + vi * 3) % 4], part: `${COMP_LABEL[comp].toLowerCase()} — ${m[5]}`, geste: m[5], interaction: m[7],
    bg: m[3][0], ink: m[3][1], acc: m[3][2], second: m[3][3], fonts: m[4].join(" + "), t });
}));
module.exports = C;
