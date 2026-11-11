// Catalogue « plat » de la bibliothèque v2 : une entrée par concept, chacune avec SA PROPRE identité (ownSkins : aucune identité du site). Famille = préfixe de la clé.
const v = require("./index");
const FAMILIES = [["accueil", "Pages d'accueil"], ["apropos", "À propos"], ["services", "Services"], ["contact", "Contact"], ["vente", "Vente et conversion"], ["portfolio", "Portfolio"], ["institution", "Institutionnel"], ["education", "Éducation"],
  ["communaute", "Communauté"], ["tarifs", "Tarification"], ["aide", "FAQ et assistance"], ["evenement", "Événements"], ["local", "Immobilier et local"], ["perso", "Pages personnelles"], ["creatif", "Créatif et expérimental"]];
const { visual, band, scopeCss } = require("./h");
const { sty } = require("../../kit");
// Modèles volontairement sans visuel (typographiques ou minimalistes) : aucun bandeau ajouté
const NO_ART = new Set(["accueil-minimaliste", "contact-minimal", "vente-capture", "creatif-typographique", "aide-faq", "aide-documentation", "institution-gouvernance", "tarifs-comparatif"]);
// Chaque modèle reçoit la clé dans son kit (graine des visuels) ; s'il ne contient aucun visuel, un bandeau vectoriel est inséré après son ouverture
const withArt = (l) => (k, env) => {
  const kk = { ...k, key: l.key }, nodes = l.build(kk, env);
  const list = NO_ART.has(l.key) || JSON.stringify(nodes).includes("<svg") ? nodes : [nodes[0], band(kk, [visual(kk, "bandeau", 170, undefined, 5)], { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px", backgroundColor: kk.S.bg }), ...nodes.slice(1)];
  // Racine unique du modèle : colonne sans écart (les espacements du site n'entrent pas entre les bandes), fond et police de l'identité, portée des variables --kw-* / --lp-* (vide en mode hérité)
  const root = { type: "container", props: { full: true }, children: list, ...sty({ display: "flex", flexDirection: "column", gap: "0px", width: "100%", backgroundColor: kk.S.bg, color: kk.S.fg, fontFamily: kk.S.font }) };
  const css = scopeCss(kk.S); if (css) root.css = css;
  return [root];
};
const layouts = v.layouts.map((l) => {
  const family = l.key.split("-")[0];
  if (!FAMILIES.some(([k]) => k === family)) throw new Error(`single_page/v2 : famille inconnue pour « ${l.key} »`);
  return { ...l, family, build: withArt(l) };
});
module.exports = { type: "single_page", kind: "page", flat: true, ownSkins: true, families: FAMILIES.map(([key, label]) => ({ key, label })), skins: v.skins, layouts };
