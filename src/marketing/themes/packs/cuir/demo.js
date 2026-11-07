// Catalogue de démonstration « Cuir » (26 produits : variantes de coloris, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// L'étiquette « personnalisable » indique les produits pour lesquels le vendeur peut activer la personnalisation (réglage par produit, onglet du produit) : le catalogue ne l'active pas lui-même.
const C = { Coloris: ["Cognac", "Noir", "Bordeaux"] };
const C2 = { Coloris: ["Cognac", "Noir", "Vert sapin", "Sable"] };
module.exports = {
  categories: ["Sacs", "Petite maroquinerie", "Ceintures", "Bagages", "Entretien"],
  products: [
    ["Sac cabas Héritage", 0, 640, 0, { ...C2 }, "partiel", ["cuir-pleine-fleur", "personnalisable"], "Cabas pleine fleur, anses cousues main, doublure coton."],
    ["Sac bandoulière Ligne", 0, 520, 0, { ...C }, "ok", ["cuir-grainé", "personnalisable"], "Bandoulière réglable, rabat aimanté."],
    ["Sac seau Tanneur", 0, 590, 0, { ...C }, "ok", ["cuir-pleine-fleur"], "Cordon de serrage en cuir tressé."],
    ["Sac à main Atelier", 0, 720, 576, { ...C }, "ok", ["cuir-pleine-fleur", "fin-de-serie"], "Fermoir laiton, poche zippée intérieure."],
    ["Besace Voyageur", 0, 680, 0, null, "ok", ["cuir-pleine-fleur", "voyage"], "Deux compartiments, cuir tannage végétal."],
    ["Mini sac Selle", 0, 430, 0, { ...C }, "rupture", ["cuir-grainé"], "Format de soirée, chaînette en laiton."],
    ["Sac à dos Cordonnier", 0, 760, 0, { ...C }, "ok", ["cuir-pleine-fleur", "edition-limitee"], "Sangles cousues, boucles patinées."],
    ["Pochette Enveloppe", 0, 310, 0, { ...C }, "ok", ["cuir-velours", "personnalisable"], "Rabat large, fond plat."],
    ["Portefeuille Pliant", 1, 190, 0, { ...C2 }, "ok", ["cuir-grainé", "personnalisable"], "Huit cartes, deux compartiments à billets."],
    ["Porte-cartes Fin", 1, 95, 0, { ...C2 }, "ok", ["cuir-grainé", "personnalisable"], "Quatre fentes, 6 mm d'épaisseur."],
    ["Porte-monnaie Zippé", 1, 120, 0, { ...C }, "ok", ["cuir-velours"], "Zip laiton, doublure suédée."],
    ["Étui à passeport", 1, 140, 112, null, "ok", ["cuir-grainé", "voyage", "fin-de-serie", "personnalisable"], "Deux fentes de carte, élastique de fermeture."],
    ["Porte-clés Sellier", 1, 48, 0, { ...C }, "ok", ["cuir-pleine-fleur", "personnalisable"], "Cuir cousu main, anneau laiton."],
    ["Étui à lunettes", 1, 85, 0, null, "ok", ["cuir-velours"], "Fermeture à pression, intérieur doux."],
    ["Trousse de toilette", 1, 160, 0, null, "partiel", ["cuir-grainé", "voyage"], "Doublure imperméable lavable."],
    ["Carnet couverture cuir", 1, 78, 0, { ...C }, "ok", ["cuir-pleine-fleur", "personnalisable"], "Recharge papier incluse, couverture amovible."],
    ["Ceinture Classique 30 mm", 2, 130, 0, { Taille: ["85", "90", "95", "100", "105"], Coloris: ["Cognac", "Noir"] }, "ok", ["cuir-pleine-fleur"], "Boucle laiton interchangeable."],
    ["Ceinture Fine 20 mm", 2, 110, 0, { Taille: ["80", "85", "90", "95"] }, "ok", ["cuir-grainé"], "Boucle ardillon, finition mate."],
    ["Ceinture Tressée", 2, 150, 0, { Taille: ["85", "90", "95", "100"] }, "rupture", ["cuir-pleine-fleur"], "Tressage à la main, sans couture."],
    ["Bagage cabine Wagon", 3, 890, 0, null, "ok", ["cuir-pleine-fleur", "voyage"], "Armature légère, cuir et toile."],
    ["Sac week-end Traversée", 3, 820, 656, null, "ok", ["cuir-pleine-fleur", "voyage", "fin-de-serie"], "Anses renforcées, poche à chaussures."],
    ["Étiquette de bagage", 3, 38, 0, { ...C }, "ok", ["cuir-pleine-fleur", "voyage", "personnalisable"], "Fenêtre pour coordonnées, sangle cousue."],
    ["Crème nourrissante", 4, 28, 0, null, "libre", ["entretien"], "Cire d'abeille et huile neutre, pot de 100 ml."],
    ["Brosse en crin", 4, 24, 0, null, "libre", ["entretien"], "Pour dépoussiérer les coutures."],
    ["Coffret d'entretien", 4, 62, 0, null, "ok", ["entretien", "cadeau"], "Crème, brosse et chiffon dans une boîte en bois."],
    ["Sac Édition Atelier", 0, 980, 0, { ...C }, "ok", ["cuir-pleine-fleur", "edition-limitee", "personnalisable"], "Série numérotée de 50 pièces."],
  ],
};
