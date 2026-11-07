// Catalogue de démonstration « Deuxième Vie » (24 pièces de seconde main). L'ÉTAT est porté par de vraies étiquettes du moteur :
// neuf-avec-etiquette · tres-bon-etat · bon-etat · etat-correct (filtres réels /boutique/etiquette/<nom>). Chaque description courte commence par l'état et nomme les défauts éventuels.
// Une pièce unique vendue = « rupture » ; les tailles sont de vraies variantes. Le prix neuf de référence n'existe pas comme champ du moteur : il se saisit dans la description.
module.exports = {
  categories: ["Vestes et manteaux", "Robes et jupes", "Hauts et maille", "Pantalons et jeans", "Sacs et accessoires", "Chaussures"],
  products: [
    ["Trench beige long", 0, 64, 0, { Taille: ["S", "M", "L"] }, "partiel", ["tres-bon-etat"], "État : très bon. Doublure intacte, un bouton remplacé par un modèle proche."],
    ["Manteau en laine bleu nuit", 0, 89, 0, null, "ok", ["bon-etat"], "État : bon. Légères bouloches aux poignets, décrites en photo."],
    ["Veste en jean brut", 0, 38, 0, { Taille: ["36", "38", "40"] }, "ok", ["tres-bon-etat"], "État : très bon. Délavage naturel, aucune déchirure."],
    ["Blouson aviateur vert", 0, 72, 59, null, "ok", ["bon-etat", "fin-de-serie"], "État : bon. Fermeture changée, doublure marquée au col."],
    ["Doudoune légère moutarde", 0, 45, 0, { Taille: ["M", "L"] }, "ok", ["etat-correct"], "État : correct. Petit accroc recousu sur la manche gauche."],
    ["Robe portefeuille imprimée", 1, 34, 0, { Taille: ["S", "M", "L"] }, "ok", ["tres-bon-etat"], "État : très bon. Tissu fluide, sans accroc."],
    ["Robe longue en lin écru", 1, 42, 0, null, "ok", ["neuf-avec-etiquette"], "État : neuf avec étiquette. Jamais portée."],
    ["Jupe plissée vert sauge", 1, 22, 0, { Taille: ["36", "38"] }, "ok", ["tres-bon-etat"], "État : très bon. Plis nets."],
    ["Robe chemise rayée", 1, 28, 0, null, "rupture", ["bon-etat"], "État : bon. Pièce vendue."],
    ["Pull torsadé en laine", 2, 36, 0, { Taille: ["S", "M", "L"] }, "ok", ["bon-etat"], "État : bon. Quelques bouloches sous les bras."],
    ["Chemise en lin blanche", 2, 19, 0, { Taille: ["S", "M"] }, "ok", ["tres-bon-etat"], "État : très bon. Col impeccable."],
    ["Gilet en maille moutarde", 2, 24, 18, null, "ok", ["etat-correct", "fin-de-serie"], "État : correct. Une petite tache claire près de l'ourlet, signalée."],
    ["Marinière rayée", 2, 14, 0, { Taille: ["S", "M", "L"] }, "libre", ["tres-bon-etat"], "État : très bon. Coton épais, couleurs franches."],
    ["Top en soie rouille", 2, 26, 0, null, "ok", ["neuf-avec-etiquette"], "État : neuf avec étiquette. Jamais porté."],
    ["Jean droit taille haute", 3, 32, 0, { Taille: ["36", "38", "40", "42"] }, "partiel", ["tres-bon-etat"], "État : très bon. Bleu moyen, ourlet d'origine."],
    ["Pantalon de costume gris", 3, 29, 0, null, "ok", ["bon-etat"], "État : bon. Léger brillant aux genoux."],
    ["Pantalon cargo kaki", 3, 21, 0, { Taille: ["S", "M"] }, "ok", ["etat-correct"], "État : correct. Genou usé côté droit, décrit en photo."],
    ["Sac cabas en cuir cognac", 4, 58, 0, null, "ok", ["bon-etat"], "État : bon. Patine du cuir, coins légèrement frottés."],
    ["Ceinture en cuir noir", 4, 12, 0, { Taille: ["85 cm", "95 cm"] }, "ok", ["tres-bon-etat"], "État : très bon. Boucle sans rayure."],
    ["Foulard en soie imprimé", 4, 16, 0, null, "ok", ["neuf-avec-etiquette"], "État : neuf avec étiquette. Pas de défaut."],
    ["Sac bandoulière en toile", 4, 18, 0, null, "rupture", ["bon-etat"], "État : bon. Pièce vendue."],
    ["Bottines en cuir marron", 5, 52, 0, { Pointure: ["38", "39", "40", "41"] }, "ok", ["bon-etat"], "État : bon. Semelle ressemelée, cuir nourri."],
    ["Baskets blanches en cuir", 5, 34, 28, { Pointure: ["39", "40", "42"] }, "ok", ["etat-correct", "fin-de-serie"], "État : correct. Pointes marquées, lacets neufs."],
    ["Mocassins en daim", 5, 41, 0, null, "ok", ["tres-bon-etat"], "État : très bon. Daim brossé, semelle peu usée."],
  ],
};
