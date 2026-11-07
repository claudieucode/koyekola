// Catalogue de démonstration « Ambre Rare » (26 produits : variantes de format, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Les étiquettes (« age-18 », « comparable », « edition-membre », « cadeau », « personnalisable ») indiquent ce que le vendeur PEUT activer dans l'admin (âge minimum, caractéristiques du comparateur,
// accès membre, personnalisation) : le catalogue n'active rien lui-même. Les degrés et âges sont des exemples fictifs. Les verres et accessoires ne portent pas d'étiquette d'âge.
const F = { Format: ["35 cl", "70 cl"] };
const F3 = { Format: ["5 cl", "35 cl", "70 cl"] };
module.exports = {
  categories: ["Whiskies et eaux-de-vie de grain", "Cognacs et eaux-de-vie de fruit", "Rhums vieillis", "Liqueurs de caractère", "Verrerie et accessoires", "Coffrets"],
  products: [
    ["Réserve Ambrée 12 ans", 0, 98, 0, { ...F }, "ok", ["age-18", "comparable", "12-ans"], "Eau-de-vie de grain, fût de chêne, 40 % vol."],
    ["Fût Rare 18 ans", 0, 240, 0, null, "ok", ["age-18", "comparable", "18-ans", "edition-membre"], "Fût unique, 46 % vol., série numérotée."],
    ["Sélection Tourbée", 0, 125, 0, { ...F }, "ok", ["age-18", "comparable", "fume"], "Notes fumées, 43 % vol."],
    ["Single Cask 21 ans", 0, 520, 0, null, "rupture", ["age-18", "comparable", "21-ans", "edition-membre"], "Un seul fût, 48 % vol., série épuisée."],
    ["Grain Doux 8 ans", 0, 62, 49, { ...F }, "ok", ["age-18", "comparable", "8-ans", "fin-de-serie"], "Eau-de-vie de grain souple, 40 % vol."],
    ["Cuvée du Chai", 0, 142, 0, null, "ok", ["age-18", "comparable", "15-ans"], "Assemblage du maître de chai, 45 % vol."],
    ["Fine Vieille Cuvée", 1, 110, 0, { ...F }, "ok", ["age-18", "comparable", "8-ans"], "Eau-de-vie de fruit, fleurs blanches, 42 % vol."],
    ["Cognac Hors d'Âge", 1, 310, 0, null, "ok", ["age-18", "comparable", "edition-membre"], "Assemblage de vieilles eaux-de-vie, 41 % vol."],
    ["Poire Vieillie en Fût", 1, 84, 0, { ...F }, "partiel", ["age-18", "comparable"], "Poire mûre et amande, 40 % vol."],
    ["Prune de Réserve", 1, 76, 61, null, "ok", ["age-18", "fin-de-serie"], "Distillée à basse température, 42 % vol."],
    ["Marc Ambré", 1, 58, 0, { ...F }, "ok", ["age-18", "comparable"], "Marc vieilli en fût, 42 % vol."],
    ["Rhum Hors d'Âge", 2, 135, 0, { ...F }, "ok", ["age-18", "comparable", "15-ans"], "Canne, 43 % vol., épices et cacao."],
    ["Rhum Ambré 8 ans", 2, 69, 0, { ...F }, "ok", ["age-18", "comparable", "8-ans"], "Rond et boisé, 40 % vol."],
    ["Rhum Vieux Millésimé", 2, 290, 0, null, "ok", ["age-18", "comparable", "edition-membre", "edition-limitee"], "Millésime unique, 45 % vol."],
    ["Rhum Cuivré Cask", 2, 160, 128, null, "ok", ["age-18", "comparable", "fin-de-serie"], "Finition en fût de cuivre sombre, 46 % vol."],
    ["Liqueur d'Orange Amère", 3, 44, 0, null, "ok", ["age-18"], "Écorces confites, 30 % vol."],
    ["Liqueur de Noix Verte", 3, 39, 0, null, "ok", ["age-18"], "Noix macérées, 28 % vol."],
    ["Crème de Cacao Noir", 3, 36, 0, null, "rupture", ["age-18"], "Cacao torréfié, 24 % vol."],
    ["Verre de dégustation Tulipe", 4, 24, 0, { Lot: ["Unité", "Lot de 2", "Lot de 6"] }, "ok", ["verrerie", "cadeau"], "Verre fin en cristal, pied soufflé."],
    ["Carafe Ambre", 4, 85, 0, null, "ok", ["verrerie", "cadeau", "personnalisable"], "Carafe 70 cl, bouchon rodé."],
    ["Pichet à eau en grès", 4, 32, 0, null, "ok", ["verrerie"], "Pour servir un verre d'eau avec la dégustation."],
    ["Pipette de dégustation", 4, 12, 0, null, "libre", ["accessoire"], "Verre gradué pour doser un échantillon."],
    ["Coffret Découverte 3 x 5 cl", 5, 54, 0, null, "ok", ["age-18", "cadeau", "coffret"], "Trois expressions en flacons de 5 cl."],
    ["Coffret Fût Rare et verres", 5, 285, 228, null, "ok", ["age-18", "cadeau", "coffret", "fin-de-serie"], "Une bouteille, deux verres, étui rigide."],
    ["Coffret Cadeau Personnalisable", 5, 150, 0, null, "ok", ["age-18", "cadeau", "personnalisable"], "Carte manuscrite choisie à la commande."],
    ["Atelier de dégustation guidée", 5, 65, 0, null, "libre", ["rendez-vous", "age-18"], "Une séance au chai, réservée aux adultes, à réserver sur un créneau libre."],
  ],
};
