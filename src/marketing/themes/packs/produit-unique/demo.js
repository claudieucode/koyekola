// Catalogue de démonstration « Produit unique » : UN produit vedette (le premier, mis en avant) et ses compléments (formats, accessoires, conservation, papeterie).
// Le produit vedette porte l'attribut « Lot » : « Lot de 1 », « Lot de 2 », « Lot de 3 » sont de vraies variantes. ATTENTION : l'outil de démonstration partagé (shopkit.seed) donne le même prix de base
// à toutes les variantes ; dans une vraie boutique, le commerçant règle le prix et le stock de chaque lot dans l'administration. Aucune photo : la surface colorée du thème tient lieu d'image.
module.exports = {
  categories: ["Le produit vedette", "Formats et recharges", "Accessoires de service", "Conservation", "Papeterie et cadeaux"],
  products: [
    ["Miel de thym, pot 500 g", 0, 14, 0, { Lot: ["Lot de 1", "Lot de 2", "Lot de 3"] }, "ok", ["vedette", "miel"], "Un seul miel, un seul producteur. Choisissez le lot de 1, 2 ou 3 pots."],
    ["Miel de thym, pot découverte 250 g", 1, 8, 0, null, "ok", ["format", "miel"], "Le même miel en petit format pour goûter."],
    ["Miel de thym, recharge 1 kg", 1, 24, 20, null, "ok", ["recharge", "fin-de-serie"], "Seau de recharge pour remplir votre pot."],
    ["Miel de thym, recharge 2 kg", 1, 42, 0, null, "rupture", ["recharge"], "Grand format pour les gros mangeurs."],
    ["Cuillère à miel en olivier", 2, 9, 0, { Taille: ["Courte", "Longue"] }, "ok", ["accessoire"], "Bois d'olivier, finition à l'huile."],
    ["Dipper en hêtre", 2, 12, 0, null, "ok", ["accessoire"], "Le classique pour napper sans goutter."],
    ["Pot doseur en verre", 2, 6, 0, null, "ok", ["accessoire"], "Pour garder le miel à portée de main."],
    ["Tartinoir en acier", 2, 14, 0, null, "ok", ["accessoire"], "Lame arrondie, manche en bois."],
    ["Plateau de service en bois", 2, 26, 0, null, "ok", ["accessoire"], "Pour poser pot et cuillère à table."],
    ["Coupelle en céramique", 2, 11, 0, { Couleur: ["Sable", "Bleu nuit"] }, "partiel", ["accessoire"], "Émail mat, passe au lave-vaisselle."],
    ["Couvercle de rechange en liège", 3, 4, 0, null, "ok", ["conservation"], "S'adapte au pot de 500 g."],
    ["Joint de rechange, lot de 5", 3, 3, 0, null, "ok", ["conservation"], "Pour un pot toujours bien fermé."],
    ["Pochette de protection en lin", 3, 12, 0, null, "ok", ["conservation"], "Protège le pot de la lumière."],
    ["Boîte de rangement en métal", 3, 16, 0, null, "ok", ["conservation"], "Pour ranger le pot à l'abri de la chaleur."],
    ["Essuie-pot en coton", 3, 7, 0, null, "libre", ["conservation"], "Pour essuyer les coulures."],
    ["Carnet de recettes au miel", 4, 12, 0, null, "ok", ["papeterie"], "Quarante pages à remplir."],
    ["Carte postale illustrée", 4, 2, 0, null, "ok", ["papeterie"], "Un pot dessiné, sans texte au dos."],
    ["Lot de 5 cartes illustrées", 4, 8, 6, null, "ok", ["papeterie", "fin-de-serie"], "Cinq cartes pour accompagner un cadeau."],
    ["Affiche alvéoles", 4, 15, 0, { Format: ["A4", "A3"] }, "ok", ["papeterie"], "Impression sur papier épais."],
    ["Sac en toile", 4, 14, 0, { Couleur: ["Écru", "Bleu nuit"] }, "partiel", ["cadeau"], "Toile de coton, anses longues."],
    ["Tablier en coton", 4, 28, 0, null, "ok", ["cadeau"], "Coton épais, poche ventrale."],
    ["Sous-verres en liège, lot de 4", 4, 10, 0, null, "libre", ["cadeau"], "Un décor d'alvéoles gravé."],
    ["Bougie en cire d'abeille", 4, 16, 0, null, "ok", ["cadeau"], "Cire naturelle, mèche en coton."],
    ["Torchon alvéoles", 4, 9, 0, null, "ok", ["cadeau"], "Coton, motif imprimé."],
    ["Mug en grès", 4, 13, 0, null, "ok", ["cadeau"], "Pour le thé et une cuillère de miel."],
  ],
};
