// Catalogue « plat » « Résultats de recherche » v3 : 100 conceptions (20 univers × 5 compositions), chacune avec SA PROPRE identité (ownSkins : aucune identité du site).
// La portée d'identité (variables --kw-* / --lp-*) est posée UNE fois sur la racine du modèle : colonne sans écart, fond et police du modèle ; retirée en mode hérité, privée de la couleur de marque en mode hybride (identityModes.js).
const { recipes, UNIVERS } = require("./recipes");
const H = require("./h");
const DIR = require("./directions");
const { sty } = require("../../kit");
const { scopeCss, ID2 } = H;
const skins = DIR.map((r) => ID2(r));
const layouts = recipes.map((r, i) => {
  const skin = skins[i], build = (k, env) => {
    const kk = { ...k, key: r.key }, nodes = r.build(kk, env);
    const root = { type: "container", props: { full: true }, children: nodes, ...sty({ display: "flex", flexDirection: "column", gap: "0px", width: "100%", backgroundColor: kk.S.bg, color: kk.S.fg, fontFamily: kk.S.font }) };
    const css = scopeCss(kk.S); if (css) root.css = css;
    return [root];
  };
  return { key: r.key, label: r.label, tags: r.tags, desc: r.desc, skin: skin.key, skinDef: skin, family: r.family, build };
});
module.exports = { type: "search_results", kind: "page", flat: true, ownSkins: true, families: UNIVERS.map((u) => ({ key: u.key, label: u.label })), skins, layouts };
