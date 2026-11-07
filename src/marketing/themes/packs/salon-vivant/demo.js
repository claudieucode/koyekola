// Catalogue de démonstration « Salon Vivant » (26 articles de mobilier : variantes de revêtement, de teinte et de taille, promotions, ruptures). Données de démonstration : jamais créées sur la boutique d'un client sans action explicite.
// Étiquettes = pièces (salon, chambre, cuisine, bureau, entree, exterieur) : filtres réels /boutique/etiquette/<pièce>. Les cotes sont dans la description courte, pour être lues avant l'achat.
const TISSU = { Revêtement: ["Lin sable", "Velours terracotta", "Bouclette ivoire"] };
module.exports = {
  categories: ["Canapés et fauteuils", "Tables et chaises", "Chambre et rangement", "Bureau", "Luminaires et textiles", "Extérieur"],
  products: [
    ["Canapé 3 places Arche", 0, 890, 0, { ...TISSU }, "partiel", ["salon"], "L 210 × P 92 × H 78 cm. Assise profonde, housse déhoussable."],
    ["Canapé d'angle Venelle", 0, 1290, 1090, { Côté: ["Angle gauche", "Angle droit"] }, "ok", ["salon", "fin-de-serie"], "L 270 × P 160 × H 82 cm. Convertible, coffre de rangement."],
    ["Fauteuil Lecture", 0, 320, 0, { ...TISSU }, "ok", ["salon", "chambre"], "L 74 × P 80 × H 86 cm. Dossier haut, pieds en frêne."],
    ["Pouf rond Galet", 0, 89, 0, null, "ok", ["salon"], "Ø 55 × H 40 cm. Housse en bouclette."],
    ["Table basse Meule", 0, 149, 0, { Plateau: ["Chêne", "Noyer"] }, "ok", ["salon"], "Ø 80 × H 38 cm. Plateau en bois massif huilé."],
    ["Meuble TV Alcôve", 0, 360, 0, null, "ok", ["salon"], "L 160 × P 40 × H 52 cm. Deux niches, passe-câbles."],
    ["Table à manger Convive", 1, 490, 0, { Longueur: ["140 cm", "180 cm", "220 cm"] }, "ok", ["cuisine"], "P 90 × H 75 cm. Chêne massif, pieds fuselés."],
    ["Chaise Bistrot (lot de 2)", 1, 138, 0, { Teinte: ["Naturel", "Noir", "Vert sauge"] }, "ok", ["cuisine"], "L 42 × P 50 × H 82 cm. Assise paillée."],
    ["Tabouret de comptoir Étal", 1, 79, 59, null, "ok", ["cuisine", "fin-de-serie"], "Assise H 65 cm. Repose-pieds en métal."],
    ["Buffet Lucarne", 1, 640, 0, null, "rupture", ["cuisine", "salon"], "L 150 × P 42 × H 85 cm. Portes cannelées, trois étagères."],
    ["Banc Entrée", 1, 175, 0, null, "ok", ["entree", "cuisine"], "L 100 × P 36 × H 46 cm. Assise rembourrée, rangement dessous."],
    ["Lit Alcyon 160", 2, 590, 0, { Tête: ["Lin sable", "Bouclette ivoire"] }, "partiel", ["chambre"], "Pour matelas 160 × 200 cm. Sommier à lattes inclus."],
    ["Chevet Coquille", 2, 95, 0, { Teinte: ["Chêne", "Blanc cassé"] }, "ok", ["chambre"], "L 40 × P 35 × H 50 cm. Un tiroir."],
    ["Commode Quatre tiroirs", 2, 420, 0, null, "ok", ["chambre", "entree"], "L 100 × P 45 × H 90 cm. Glissières silencieuses."],
    ["Armoire Penderie", 2, 560, 479, null, "ok", ["chambre", "fin-de-serie"], "L 120 × P 55 × H 200 cm. Une penderie, trois étagères."],
    ["Console Seuil", 2, 210, 0, null, "ok", ["entree"], "L 110 × P 28 × H 80 cm. Tiroir et tablette basse."],
    ["Miroir Arche", 2, 120, 0, { Taille: ["H 90 cm", "H 140 cm"] }, "ok", ["entree", "chambre"], "Cadre en bois, fixation murale fournie."],
    ["Bureau Atelier", 3, 280, 0, { Plateau: ["Chêne", "Blanc"] }, "ok", ["bureau"], "L 120 × P 60 × H 75 cm. Un tiroir, passe-câble."],
    ["Chaise de bureau Souple", 3, 190, 0, { Teinte: ["Gris", "Sauge"] }, "ok", ["bureau"], "Assise réglable de 44 à 54 cm, accoudoirs fixes."],
    ["Bibliothèque Gradin", 3, 330, 0, null, "ok", ["bureau", "salon"], "L 80 × P 30 × H 180 cm. Cinq étagères."],
    ["Lampadaire Halo", 4, 99, 0, null, "ok", ["salon", "bureau"], "H 160 cm. Abat-jour en lin, ampoule non fournie."],
    ["Suspension Corolle", 4, 69, 0, null, "libre", ["cuisine", "salon"], "Ø 45 cm. Papier tressé, câble de 1,50 m."],
    ["Tapis laine Dune", 4, 260, 0, { Taille: ["160 × 230 cm", "200 × 290 cm"] }, "ok", ["salon", "chambre"], "Laine tissée à plat, face unie."],
    ["Plaid lin lavé", 4, 59, 0, { Teinte: ["Sable", "Terre cuite", "Sauge"] }, "ok", ["salon", "chambre"], "130 × 170 cm. Lin lavé, lavable en machine."],
    ["Table de jardin Rivage", 5, 330, 0, null, "ok", ["exterieur"], "L 150 × P 80 × H 74 cm. Acacia huilé, pliante."],
    ["Fauteuil de balcon Soleil (lot de 2)", 5, 149, 0, { Teinte: ["Vert sauge", "Terre cuite"] }, "ok", ["exterieur"], "Pliant, acier thermolaqué, H 82 cm."],
  ],
};
