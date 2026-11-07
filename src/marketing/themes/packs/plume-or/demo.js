// Catalogue de démonstration « Plume d'Or » (24 produits : variantes, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// La gravure se règle ensuite produit par produit (libellé, longueur maximale, obligatoire) dans la fiche produit de l'administration.
const P = { Plume: ["EF", "F", "M", "B"] };
module.exports = {
  categories: ["Stylos plume", "Rollers et billes", "Porte-mines", "Encres et recharges", "Carnets et étuis"],
  products: [
    ["Stylo plume Laque Pétrole", 0, 420, 0, { ...P }, "ok", ["laque", "plume-or", "gravable"], "Laque vingt couches, plume or 18 carats."],
    ["Stylo plume Laque Bordeaux", 0, 420, 0, { ...P }, "partiel", ["laque", "plume-or", "gravable"], "Fût bordeaux, bague d'or."],
    ["Stylo plume Laque Noire", 0, 395, 0, { ...P }, "ok", ["laque", "plume-or", "gravable"], "Le classique, garniture dorée."],
    ["Stylo plume Résine Écaille", 0, 460, 0, { ...P }, "ok", ["resine", "plume-or", "gravable"], "Résine veinée, tournée à l'unité."],
    ["Stylo plume Bleu Nuit", 0, 440, 352, { ...P }, "ok", ["laque", "plume-or", "fin-de-serie", "gravable"], "Série bleu nuit, tarif de fin de série."],
    ["Stylo plume Édition Atelier", 0, 780, 0, { ...P }, "ok", ["laque", "edition-limitee", "plume-or", "gravable"], "Série numérotée de 100 pièces."],
    ["Stylo plume Voyage compact", 0, 240, 0, { ...P }, "ok", ["voyage", "gravable"], "Se pose sur la poche, capuchon vissé."],
    ["Stylo plume Acier Brossé", 0, 190, 0, { ...P }, "rupture", ["acier"], "Plume acier, fût métal brossé."],
    ["Roller Laque Pétrole", 1, 260, 0, null, "ok", ["laque", "gravable"], "Pointe fine, recharge standard."],
    ["Roller Laque Bordeaux", 1, 260, 0, null, "ok", ["laque", "gravable"], "Glisse sans effort, bague d'or."],
    ["Stylo bille Résine Écaille", 1, 230, 0, null, "ok", ["resine", "gravable"], "Mécanisme à rotation."],
    ["Stylo bille Laque Noire", 1, 210, 168, null, "ok", ["laque", "fin-de-serie", "gravable"], "Garniture or rosé."],
    ["Roller Acier Brossé", 1, 150, 0, null, "ok", ["acier"], "Fût métal, prise sûre."],
    ["Porte-mine Pétrole 0,5", 2, 185, 0, null, "ok", ["laque", "gravable"], "Mine 0,5 mm, gomme sous le capuchon."],
    ["Porte-mine Noir 0,7", 2, 185, 0, null, "ok", ["laque", "gravable"], "Mine 0,7 mm, lisse et équilibré."],
    ["Porte-mine Acier 0,9", 2, 120, 0, null, "rupture", ["acier"], "Pour les croquis rapides."],
    ["Encre Bleu Roi, flacon 50 ml", 3, 28, 0, null, "libre", ["encre"], "Encre pour stylo plume, séchage rapide."],
    ["Encre Noir de Chine, flacon 50 ml", 3, 28, 0, null, "libre", ["encre"], "Noir profond, tenue à l'eau."],
    ["Cartouches Bleu, boîte de 12", 3, 14, 0, null, "ok", ["encre"], "Cartouches standard internationales."],
    ["Convertisseur à piston", 3, 22, 0, null, "ok", ["accessoire"], "Remplissage depuis un flacon."],
    ["Carnet cousu, papier ivoire", 4, 32, 0, { Format: ["A6", "A5"] }, "ok", ["papier"], "Papier 100 g, supporte l'encre."],
    ["Étui cuir une pièce", 4, 85, 0, { Coloris: ["Cognac", "Noir"] }, "ok", ["cuir"], "Cuir pleine fleur, fermeture aimantée."],
    ["Étui cuir trois pièces", 4, 160, 0, null, "ok", ["cuir"], "Pour trois instruments."],
    ["Set d'essai, quatre encres", 4, 55, 0, null, "ok", ["encre"], "Quatre petits flacons de 10 ml."],
  ],
};
