// Catalogue de démonstration « Sommeil doux » (26 produits de literie). Étiquettes de fermeté (souple, mi-ferme, ferme), « couple » et positions (cote, dos, ventre) :
// ce sont les VRAIS filtres /boutique/etiquette/<nom> vers lesquels le quiz de recommandation renvoie. Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
const T = { Taille: ["90 x 190", "140 x 190", "160 x 200", "180 x 200"] };
module.exports = {
  categories: ["Matelas", "Oreillers", "Sommiers et surmatelas", "Linge de lit", "Accessoires du soir"],
  products: [
    ["Matelas Nuage", 0, 590, 0, { ...T }, "ok", ["souple", "cote"], "Mousse à mémoire de forme, accueil enveloppant, épaules et hanches bien accompagnées."],
    ["Matelas Équilibre", 0, 690, 590, { ...T }, "partiel", ["mi-ferme", "dos", "cote"], "Mousse et ressorts ensachés, un soutien médian pour la plupart des dormeurs."],
    ["Matelas Appui", 0, 790, 0, { ...T }, "ok", ["ferme", "dos", "ventre"], "Latex et mousse haute résilience : un soutien franc, une surface plane."],
    ["Matelas Duo", 0, 890, 0, { ...T }, "ok", ["mi-ferme", "couple"], "Ressorts ensachés indépendants : les mouvements de l'un se sentent moins chez l'autre."],
    ["Matelas Latex Naturel", 0, 960, 0, { ...T }, "ok", ["mi-ferme", "dos"], "Latex naturel ventilé, housse coton biologique déhoussable."],
    ["Matelas Souple Couple", 0, 940, 0, { Taille: ["160 x 200", "180 x 200"] }, "ok", ["souple", "couple", "cote"], "Mémoire de forme et zones de confort, pour deux dormeurs qui aiment l'accueil moelleux."],
    ["Matelas Ferme Couple", 0, 990, 0, { Taille: ["160 x 200", "180 x 200"] }, "ok", ["ferme", "couple"], "Ressorts renforcés et mousse dense, bords stabilisés."],
    ["Matelas Petit Nuage 90", 0, 320, 0, { Taille: ["70 x 140", "90 x 190"] }, "rupture", ["souple"], "Matelas enfant, housse lavable à 40 degrés."],
    ["Matelas d'appoint pliant", 0, 149, 0, null, "libre", ["ferme"], "Trois plis, housse de transport, pour les invités."],
    ["Oreiller ergonomique mémoire", 1, 59, 0, { Hauteur: ["Basse", "Moyenne", "Haute"] }, "ok", ["cote", "dos"], "Mémoire de forme, cale la nuque selon la position de sommeil."],
    ["Oreiller plume et duvet", 1, 49, 0, null, "ok", ["dos", "ventre"], "Garnissage moelleux, housse en percale."],
    ["Oreiller de corps", 1, 45, 0, null, "ok", ["cote"], "Long coussin à glisser entre les genoux."],
    ["Oreiller fibres lavables", 1, 29, 24, null, "ok", ["ventre"], "Fibres creuses, lavable en machine."],
    ["Sommier tapissier", 2, 320, 0, { Taille: ["90 x 190", "140 x 190", "160 x 200", "180 x 200"] }, "ok", ["sommier"], "Cadre bois, tablier tissu, pieds démontables."],
    ["Sommier à lattes relevables", 2, 410, 0, { Taille: ["90 x 190", "140 x 190", "160 x 200"] }, "ok", ["sommier"], "Lattes souples, tête et pieds relevables à la main."],
    ["Surmatelas confort", 2, 119, 99, { Taille: ["90 x 190", "140 x 190", "160 x 200", "180 x 200"] }, "ok", ["souple"], "Quelques centimètres de douceur en plus sur un matelas trop ferme."],
    ["Protège-matelas imperméable", 2, 45, 0, { Taille: ["90 x 190", "140 x 190", "160 x 200", "180 x 200"] }, "ok", ["entretien"], "Respirant et silencieux, lavable à 60 degrés."],
    ["Parure de lit percale", 3, 119, 0, { Taille: ["140 x 200", "240 x 220"], Couleur: ["Brume", "Sable"] }, "ok", ["linge"], "Percale de coton, toucher frais et net."],
    ["Drap-housse jersey", 3, 39, 0, { Taille: ["90 x 190", "140 x 190", "160 x 200", "180 x 200"] }, "ok", ["linge"], "Jersey extensible, bonnet jusqu'à 30 cm."],
    ["Couette quatre saisons", 3, 139, 0, { Taille: ["140 x 200", "240 x 220"] }, "ok", ["linge"], "Deux couettes qui se boutonnent, une pour l'été, une pour l'hiver."],
    ["Plaid en laine mérinos", 3, 89, 0, null, "ok", ["linge"], "Laine douce, finitions bord franc."],
    ["Masque de nuit en soie", 4, 25, 0, null, "ok", ["accessoire"], "Soie de mûrier, élastique large."],
    ["Bouchons d'oreilles", 4, 12, 0, null, "ok", ["accessoire"], "Mousse douce, boîte de rangement."],
    ["Rideau occultant", 4, 69, 0, { Longueur: ["240 cm", "260 cm"] }, "ok", ["accessoire"], "Doublure occultante, œillets, lavable."],
    ["Lampe de chevet lumière chaude", 4, 54, 0, null, "libre", ["accessoire"], "Lumière ambrée à intensité réglable."],
    ["Brume d'oreiller lavande", 4, 16, 0, null, "ok", ["accessoire"], "Flacon de 100 ml, à vaporiser sur le linge."],
  ],
};
