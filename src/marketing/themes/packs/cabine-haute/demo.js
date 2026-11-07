// Catalogue de démonstration « Cabine Haute » (26 produits : variantes de coloris et de taille, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Les caractéristiques du comparateur (dimensions, poids, volume…) sont des données d'EXEMPLE : `specs` est indexé par nom de produit, et `seedSpecs(s, ids)` les enregistre via la brique « comparateur » du moteur
// (shop/compare.saveSpecs). Le script scripts/boutique-demo.js n'appelle que `seed` : après lui, appeler `seedSpecs` (voir la page « Comment configurer » du thème) ou saisir les caractéristiques dans l'admin du produit.
const C = { Coloris: ["Carbone", "Aubergine", "Titane"] };
const C2 = { Coloris: ["Carbone", "Titane"] };
const products = [
  ["Cabine Altitude 55", 0, 420, 0, { ...C }, "partiel", ["coque", "cabine"], "Coque polycarbonate, 4 roues doubles, serrure à code."],
  ["Cabine Altitude Slim", 0, 380, 304, { ...C2 }, "ok", ["coque", "cabine", "fin-de-serie"], "Version fine pour les cabines les plus strictes."],
  ["Cabine Souple Rail", 0, 310, 0, { ...C2 }, "ok", ["souple", "cabine"], "Nylon balistique, poche avant d'accès rapide."],
  ["Cabine Aluminium Fuseau", 0, 690, 0, null, "ok", ["aluminium", "cabine"], "Coque aluminium nervurée, coins renforcés."],
  ["Cabine Carbone Pur", 0, 790, 0, null, "rupture", ["composite", "cabine"], "Composite léger, charnières à déblocage rapide."],
  ["Cabine Extensible 40 L", 0, 360, 0, { ...C2 }, "ok", ["coque", "cabine"], "Soufflet extensible pour le retour."],
  ["Soute Moyenne 68", 1, 470, 0, { ...C }, "ok", ["coque", "soute"], "Intérieur à sangles, doublure lavable."],
  ["Soute Grande 78", 1, 540, 0, { ...C }, "ok", ["coque", "soute"], "Quatre roues, poignée télescopique à trois crans."],
  ["Soute Aluminium 74", 1, 890, 0, null, "ok", ["aluminium", "soute"], "Fermetures à levier, joints de poussière."],
  ["Soute Souple 75", 1, 410, 328, { ...C2 }, "ok", ["souple", "soute", "fin-de-serie"], "Nylon balistique, deux compartiments."],
  ["Set de deux Altitude", 1, 880, 0, { ...C2 }, "ok", ["coque", "cabine", "soute"], "Une cabine et une soute, coloris assortis."],
  ["Sac week-end Ligne", 2, 340, 0, { ...C2 }, "ok", ["souple", "week-end"], "Fond rigide, bandoulière amovible."],
  ["Sac week-end Aluminium", 2, 520, 0, null, "ok", ["souple", "week-end"], "Tissu technique déperlant, zips étanches."],
  ["Sac sous le siège 40", 2, 190, 0, { ...C2 }, "ok", ["souple", "cabine"], "Se glisse sous le siège devant vous."],
  ["Sac à dos Transit 28", 2, 230, 0, { ...C2 }, "ok", ["souple", "ordinateur"], "Compartiment ordinateur 16 pouces rembourré."],
  ["Sac à dos Transit 40", 2, 280, 0, { ...C2 }, "partiel", ["souple", "ordinateur"], "Ouverture totale, dos ventilé."],
  ["Porte-vêtements Pliage", 2, 310, 0, null, "ok", ["souple", "costume"], "Tient un costume sans plis, se replie en trois."],
  ["Pochette de passeport RFID", 3, 58, 0, { ...C2 }, "ok", ["accessoire", "voyage"], "Quatre fentes, poche zippée pour carte d'embarquement."],
  ["Trousse de toilette suspendue", 3, 74, 0, { ...C2 }, "ok", ["accessoire", "voyage"], "Crochet rabattable, poches imperméables."],
  ["Organiseurs de valise (3)", 3, 64, 0, { ...C2 }, "ok", ["accessoire", "rangement"], "Trois tailles, tissu fin et résistant."],
  ["Balance de bagage", 3, 29, 0, null, "ok", ["accessoire", "pesage"], "Pèse jusqu'à 50 kg, étui compact."],
  ["Cadenas à code TSA", 3, 22, 18, null, "ok", ["accessoire", "securite", "fin-de-serie"], "Trois chiffres, câble acier."],
  ["Étiquette de bagage Flash", 3, 24, 0, { ...C }, "ok", ["accessoire", "voyage"], "Fenêtre protégée pour vos coordonnées."],
  ["Housse de protection cabine", 3, 46, 0, null, "ok", ["accessoire", "entretien"], "Tissu extensible lavable en machine."],
  ["Coussin de voyage mémoire", 3, 42, 0, null, "libre", ["accessoire", "confort"], "Housse amovible, se range dans un sac dédié."],
  ["Kit d'entretien coque", 3, 26, 0, null, "libre", ["entretien"], "Chiffon microfibre et nettoyant doux pour coques."],
];
// Caractéristiques d'EXEMPLE pour le comparateur (une par ligne « Libellé: valeur »). Les dimensions sont celles du produit, pas celles d'une compagnie.
const specs = {
  "Cabine Altitude 55": "Dimensions extérieures (cm): 55 x 40 x 23\nVolume: 38 L\nPoids à vide: 2,9 kg\nMatière: Polycarbonate\nRoues: 4 roues doubles\nGarantie: 5 ans",
  "Cabine Altitude Slim": "Dimensions extérieures (cm): 55 x 35 x 20\nVolume: 31 L\nPoids à vide: 2,6 kg\nMatière: Polycarbonate\nRoues: 4 roues doubles\nGarantie: 5 ans",
  "Cabine Souple Rail": "Dimensions extérieures (cm): 55 x 35 x 22\nVolume: 36 L\nPoids à vide: 2,1 kg\nMatière: Nylon balistique\nRoues: 2 roues\nGarantie: 3 ans",
  "Cabine Aluminium Fuseau": "Dimensions extérieures (cm): 55 x 38 x 23\nVolume: 35 L\nPoids à vide: 4,1 kg\nMatière: Aluminium\nRoues: 4 roues doubles\nGarantie: 10 ans",
  "Cabine Carbone Pur": "Dimensions extérieures (cm): 55 x 37 x 22\nVolume: 34 L\nPoids à vide: 2,3 kg\nMatière: Composite\nRoues: 4 roues doubles\nGarantie: 10 ans",
  "Cabine Extensible 40 L": "Dimensions extérieures (cm): 55 x 40 x 20 (25 déployée)\nVolume: 40 L\nPoids à vide: 3,0 kg\nMatière: Polycarbonate\nRoues: 4 roues doubles\nGarantie: 5 ans",
  "Soute Moyenne 68": "Dimensions extérieures (cm): 68 x 45 x 27\nVolume: 70 L\nPoids à vide: 3,8 kg\nMatière: Polycarbonate\nRoues: 4 roues doubles\nGarantie: 5 ans",
  "Soute Grande 78": "Dimensions extérieures (cm): 78 x 50 x 30\nVolume: 102 L\nPoids à vide: 4,6 kg\nMatière: Polycarbonate\nRoues: 4 roues doubles\nGarantie: 5 ans",
  "Soute Aluminium 74": "Dimensions extérieures (cm): 74 x 47 x 28\nVolume: 85 L\nPoids à vide: 6,2 kg\nMatière: Aluminium\nRoues: 4 roues doubles\nGarantie: 10 ans",
  "Soute Souple 75": "Dimensions extérieures (cm): 75 x 46 x 30\nVolume: 95 L\nPoids à vide: 3,4 kg\nMatière: Nylon balistique\nRoues: 2 roues\nGarantie: 3 ans",
  "Set de deux Altitude": "Dimensions extérieures (cm): 55 x 40 x 23 et 68 x 45 x 27\nVolume: 38 L et 70 L\nPoids à vide: 6,7 kg les deux\nMatière: Polycarbonate\nGarantie: 5 ans",
  "Sac week-end Ligne": "Dimensions extérieures (cm): 50 x 28 x 25\nVolume: 35 L\nPoids à vide: 1,2 kg\nMatière: Nylon balistique\nGarantie: 3 ans",
  "Sac week-end Aluminium": "Dimensions extérieures (cm): 52 x 30 x 26\nVolume: 40 L\nPoids à vide: 1,5 kg\nMatière: Tissu technique déperlant\nGarantie: 5 ans",
  "Sac sous le siège 40": "Dimensions extérieures (cm): 40 x 30 x 15\nVolume: 18 L\nPoids à vide: 0,7 kg\nMatière: Nylon balistique\nGarantie: 3 ans",
  "Sac à dos Transit 28": "Dimensions extérieures (cm): 46 x 30 x 20\nVolume: 28 L\nPoids à vide: 1,0 kg\nMatière: Nylon balistique\nGarantie: 3 ans",
  "Sac à dos Transit 40": "Dimensions extérieures (cm): 55 x 35 x 22\nVolume: 40 L\nPoids à vide: 1,4 kg\nMatière: Nylon balistique\nGarantie: 3 ans",
  "Porte-vêtements Pliage": "Dimensions extérieures (cm): 60 x 38 x 12 (plié)\nVolume: 27 L\nPoids à vide: 1,3 kg\nMatière: Nylon balistique\nGarantie: 3 ans",
};
// Enregistre les caractéristiques d'exemple sur les produits créés par `seed` (mêmes positions que `products`). N'écrase que ces produits.
function seedSpecs(s, ids) {
  const compare = require("../../../shop/compare");
  products.forEach(([name], i) => { if (specs[name] && ids[i]) compare.saveSpecs(s.db, ids[i], specs[name]); });
}
module.exports = { categories: ["Cabine", "Soute", "Sacs de voyage", "Accessoires"], products, specs, seedSpecs };
