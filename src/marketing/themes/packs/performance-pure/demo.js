// Catalogue de démonstration « Performance Pure » (26 produits : nutrition sportive et équipement). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Aucune allégation de santé, de performance ou de résultat : les descriptions donnent seulement format, saveur et usage. Les étiquettes « consommable » signalent les produits qui se rachètent
// régulièrement (candidats naturels à un abonnement, que le vendeur configure produit par produit : aucune formule n'est créée par ce catalogue).
const SAV = { Saveur: ["Vanille", "Chocolat", "Fraise"] };
module.exports = {
  categories: ["Poudres de nutrition", "Boissons et barres", "Équipement de force", "Cardio et mobilité", "Accessoires"],
  products: [
    ["Protéine de lactosérum, 900 g", 0, 34, 0, { ...SAV }, "partiel", ["consommable", "poudre"], "Poudre à dissoudre, 900 g, trois saveurs. Notice de dosage sur le sachet."],
    ["Protéine végétale pois-riz, 750 g", 0, 32, 28, { Saveur: ["Neutre", "Cacao"] }, "ok", ["consommable", "poudre", "vegetal"], "Mélange de protéines végétales en poudre, 750 g."],
    ["Créatine monohydrate, 300 g", 0, 22, 0, null, "ok", ["consommable", "poudre"], "Poudre sans arôme, mesurette fournie, 300 g."],
    ["Glucides en poudre, 1 kg", 0, 19, 0, null, "ok", ["consommable", "poudre", "endurance"], "Maltodextrine en poudre, 1 kg, à diluer."],
    ["Caséine, 900 g", 0, 36, 0, { Saveur: ["Vanille", "Chocolat"] }, "ok", ["consommable", "poudre"], "Protéine de lait en poudre, 900 g."],
    ["Collagène en poudre, 300 g", 0, 27, 0, null, "rupture", ["consommable", "poudre"], "Poudre sans arôme, 300 g."],
    ["Boisson d'effort, boîte de 500 g", 1, 16, 0, { Parfum: ["Citron", "Orange"] }, "ok", ["consommable", "endurance"], "Poudre pour boisson, 500 g, deux parfums."],
    ["Gels énergétiques, boîte de 12", 1, 24, 0, { Parfum: ["Cola", "Pomme"] }, "ok", ["consommable", "endurance"], "Douze gels de 40 g, format poche."],
    ["Barres protéinées, boîte de 12", 1, 23, 19, { Saveur: ["Cacao", "Cacahuète", "Coco"] }, "ok", ["consommable"], "Douze barres de 55 g."],
    ["Boisson prête à boire, pack de 6", 1, 14, 0, { Saveur: ["Vanille", "Café"] }, "ok", ["consommable"], "Six bouteilles de 330 ml, à consommer fraîches."],
    ["Électrolytes en comprimés, tube de 20", 1, 8, 0, null, "ok", ["consommable", "endurance"], "Comprimés effervescents, tube de 20."],
    ["Haltères à vis, paire de 20 kg", 2, 79, 0, null, "ok", ["force"], "Deux barres courtes, disques en fonte, colliers à vis."],
    ["Disques de musculation, 2 × 5 kg", 2, 35, 0, null, "ok", ["force"], "Deux disques revêtus, alésage 50 mm."],
    ["Kettlebell en fonte", 2, 29, 0, { Poids: ["8 kg", "12 kg", "16 kg", "20 kg"] }, "partiel", ["force"], "Poignée large, base plate, fonte peinte."],
    ["Barre de traction de porte", 2, 39, 0, null, "ok", ["force"], "Se cale dans l'encadrement, sans perçage, charge maximale indiquée sur la notice."],
    ["Banc de musculation réglable", 2, 189, 159, null, "ok", ["force"], "Dossier réglable en six positions, pieds antidérapants."],
    ["Bandes élastiques, set de 5", 3, 18, 0, null, "ok", ["mobilite"], "Cinq résistances, pochette de transport."],
    ["Tapis de sol épais", 3, 24, 0, { Couleur: ["Anthracite", "Citron"] }, "ok", ["mobilite"], "Mousse 15 mm, 180 × 60 cm, sangle."],
    ["Corde à sauter à roulement", 3, 12, 0, null, "ok", ["cardio"], "Longueur réglable, poignées antidérapantes."],
    ["Rouleau de massage", 3, 21, 0, null, "ok", ["mobilite"], "Mousse dense, 33 cm."],
    ["Montre de sport simple", 3, 59, 0, null, "rupture", ["cardio"], "Chronomètre, tours et rappel d'intervalles. Sans capteur de santé."],
    ["Shaker 700 ml", 4, 9, 0, { Couleur: ["Noir", "Citron"] }, "ok", ["accessoire"], "Bouchon étanche, grille de mélange, 700 ml."],
    ["Gourde isotherme 750 ml", 4, 25, 0, null, "ok", ["accessoire"], "Acier inoxydable, double paroi."],
    ["Sac de sport 40 L", 4, 44, 0, { Couleur: ["Noir", "Graphite"] }, "ok", ["accessoire"], "Compartiment à chaussures séparé, bandoulière."],
    ["Ceinture de maintien lombaire", 4, 31, 0, { Taille: ["S", "M", "L", "XL"] }, "ok", ["accessoire", "force"], "Sangle réglable, fermeture à scratch."],
    ["Pilulier de sac, 7 compartiments", 4, 6, 0, null, "libre", ["accessoire"], "Boîte compartimentée pour transporter vos doses, lavable."],
  ],
};
