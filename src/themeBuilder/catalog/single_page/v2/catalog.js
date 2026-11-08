// Catalogue « plat » de la bibliothèque v2 : une entrée par concept, chacune avec SA PROPRE identité (ownSkins : aucune identité du site). Famille = préfixe de la clé.
const v = require("./index");
const FAMILIES = [["accueil", "Pages d'accueil"], ["apropos", "À propos"], ["services", "Services"], ["contact", "Contact"], ["vente", "Vente et conversion"], ["portfolio", "Portfolio"], ["institution", "Institutionnel"], ["education", "Éducation"],
  ["communaute", "Communauté"], ["tarifs", "Tarification"], ["aide", "FAQ et assistance"], ["evenement", "Événements"], ["local", "Immobilier et local"], ["perso", "Pages personnelles"], ["creatif", "Créatif et expérimental"]];
const layouts = v.layouts.map((l) => {
  const family = l.key.split("-")[0];
  if (!FAMILIES.some(([k]) => k === family)) throw new Error(`single_page/v2 : famille inconnue pour « ${l.key} »`);
  return { ...l, family };
});
module.exports = { type: "single_page", kind: "page", flat: true, ownSkins: true, families: FAMILIES.map(([key, label]) => ({ key, label })), skins: v.skins, layouts };
