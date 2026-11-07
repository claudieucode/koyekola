// Catalogue de démonstration « Cercle Privé » (26 produits : variantes, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Le catalogue ne pose AUCUNE règle d'accès ni vente privée : le vendeur les crée dans l'admin (onglet « Accès membre »).
const T = { Taille: ["S", "M", "L"] };
const C = { Teinte: ["Prune", "Encre", "Champagne"] };
module.exports = {
  categories: ["Prêt-à-porter", "Maroquinerie", "Maison", "Cave", "Bijoux et montres"],
  products: [
    ["Manteau en laine Salon", 0, 890, 0, { ...T }, "partiel", ["laine"], "Laine épaisse, doublure en soie, coupe droite."],
    ["Robe du soir Rideau", 0, 760, 0, { ...T }, "ok", ["soie"], "Soie fluide, dos nu, fermeture cachée."],
    ["Veste Smoking Prune", 0, 680, 544, { ...T }, "ok", ["laine"], "Revers satinés, une seule boutonnière."],
    ["Chemise Nuit", 0, 240, 0, { ...T }, "ok", ["coton"], "Popeline dense, col discret."],
    ["Pull Cachemire Velours", 0, 420, 0, { ...C }, "ok", ["cachemire"], "Cachemire fin, côtes souples."],
    ["Écharpe Soie Cercle", 0, 190, 0, null, "ok", ["soie"], "Carré de soie roulotté main, 90 cm."],
    ["Pantalon Palais", 0, 360, 0, { ...T }, "rupture", ["laine"], "Taille haute, plis souples."],
    ["Sac Pochette Billet", 1, 540, 0, { ...C }, "ok", ["cuir"], "Cuir lisse, fermoir aimanté, bandoulière amovible."],
    ["Sac Cabas Rotonde", 1, 780, 0, null, "ok", ["cuir"], "Grande contenance, doublure suédée."],
    ["Portefeuille Carnet", 1, 210, 168, { ...C }, "ok", ["cuir"], "Huit cartes, billets à plat."],
    ["Porte-cartes Discret", 1, 120, 0, { ...C }, "ok", ["cuir"], "Quatre fentes, profil très fin."],
    ["Ceinture Sceau", 1, 260, 0, { Taille: ["85", "90", "95", "100"] }, "ok", ["cuir"], "Boucle plaquée champagne."],
    ["Étui à cigares", 1, 340, 0, null, "ok", ["cuir"], "Pour trois cigares, intérieur cèdre."],
    ["Plaid Laine Mérinos", 2, 280, 0, { Teinte: ["Prune", "Ardoise"] }, "ok", ["laine"], "Mérinos tissé en Écosse, franges nouées."],
    ["Bougie Fumoir", 2, 68, 0, null, "libre", ["bougie"], "Cire végétale, notes de cuir et de bois."],
    ["Carafe Cristal Taillé", 2, 320, 0, null, "ok", ["cristal"], "Un litre, bouchon rodé."],
    ["Verres Cristal x6", 2, 240, 192, null, "ok", ["cristal"], "Coffret de six verres soufflés."],
    ["Coussin Velours Nuit", 2, 95, 0, { ...C }, "ok", ["velours"], "Housse déhoussable, garnissage plume."],
    ["Tapis Nœud Main", 2, 1200, 0, null, "rupture", ["laine"], "Noué main, 170 x 240 cm."],
    ["Champagne Cuvée Privée", 3, 85, 0, { Format: ["Bouteille", "Magnum"] }, "ok", ["vin"], "Assemblage de la maison, vieilli en cave."],
    ["Vin rouge Réserve", 3, 54, 0, null, "ok", ["vin"], "Élevage de dix-huit mois en fût."],
    ["Coffret Dégustation", 3, 140, 0, null, "ok", ["vin", "cadeau"], "Trois bouteilles, notes de dégustation."],
    ["Bague Sceau", 4, 620, 0, { Taille: ["52", "54", "56", "58"] }, "ok", ["or"], "Or recyclé, chevalière gravable."],
    ["Boutons de manchette", 4, 210, 0, null, "ok", ["argent"], "Argent massif, finition satinée."],
    ["Montre Salon 36 mm", 4, 1450, 1160, null, "ok", ["acier"], "Cadran aubergine, bracelet cuir."],
    ["Collier Perle Unique", 4, 380, 0, null, "ok", ["perle"], "Perle d'eau douce, chaîne en vermeil."],
  ],
};
