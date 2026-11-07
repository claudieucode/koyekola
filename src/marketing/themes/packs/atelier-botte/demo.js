// Catalogue de démonstration « Atelier Botte » (26 produits : finitions et pointures en variantes, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// L'étiquette « gravure » indique les produits pour lesquels le vendeur peut activer la personnalisation (réglage par produit) : le catalogue ne l'active pas lui-même.
const F = { Finition: ["Noir ciré", "Cognac patiné", "Havane brossé"] };
const F4 = { Finition: ["Noir ciré", "Cognac patiné", "Havane brossé", "Cordovan"] };
const FP = { Finition: ["Noir ciré", "Cognac patiné"], Pointure: ["41", "42", "43", "44"] };
module.exports = {
  categories: ["Derbys et richelieus", "Bottines", "Mocassins", "Accessoires en cuir", "Entretien"],
  products: [
    ["Derby Atelier", 0, 540, 0, { ...FP }, "partiel", ["veau-box", "gravure", "goodyear"], "Derby à lacets ouverts, semelle cousue Goodyear."],
    ["Richelieu Cérémonie", 0, 590, 0, { ...FP }, "ok", ["veau-box", "gravure", "goodyear"], "Lacets fermés, bout lisse, cuir lissé."],
    ["Richelieu Perforé", 0, 620, 0, { ...F4 }, "ok", ["perforations", "goodyear", "gravure"], "Bout perforé, empeigne en cuir pleine fleur."],
    ["Derby Bout Fleuri", 0, 640, 512, { ...F }, "ok", ["perforations", "fin-de-serie"], "Perforations en fleur sur le bout et les côtés."],
    ["Double Boucle", 0, 560, 0, { ...F }, "ok", ["veau-box", "gravure"], "Deux boucles en laiton, sans lacets."],
    ["Derby Cousu Main", 0, 780, 0, { ...F4 }, "ok", ["cousu-main", "edition-limitee", "gravure"], "Montage cousu main, série numérotée."],
    ["Richelieu Brogue Long", 0, 660, 0, { ...F }, "rupture", ["perforations", "goodyear"], "Perforations sur toute l'empeigne."],
    ["Mocassin Penny", 2, 420, 0, { ...F }, "ok", ["veau-box", "gravure"], "Bride crantée, semelle de cuir fine."],
    ["Mocassin Glands", 2, 450, 0, { ...F }, "ok", ["cuir-pleine-fleur"], "Glands tressés à la main."],
    ["Mocassin Conduite", 2, 380, 304, { ...F }, "ok", ["daim", "fin-de-serie"], "Daim souple, picots de gomme."],
    ["Mocassin Bateau", 2, 340, 0, null, "ok", ["cuir-pleine-fleur", "ete"], "Lacet de cuir continu, semelle antidérapante."],
    ["Bottine Chelsea", 1, 560, 0, { ...FP }, "ok", ["veau-box", "goodyear", "gravure"], "Élastiques latéraux, tirant de cuir."],
    ["Bottine Lacée", 1, 590, 0, { ...F4 }, "partiel", ["cuir-pleine-fleur", "goodyear"], "Sept œillets, semelle cuir et gomme."],
    ["Bottine Daim Sable", 1, 520, 0, null, "ok", ["daim"], "Daim brossé, doublure en cuir."],
    ["Boot Atelier", 1, 690, 0, { ...F }, "ok", ["cuir-pleine-fleur", "gravure"], "Tige haute, bout renforcé, semelle ressemelable."],
    ["Boot Hiver Doublé", 1, 720, 0, { ...F }, "rupture", ["cuir-pleine-fleur"], "Doublure peau retournée."],
    ["Ceinture Cuir Pleine Fleur", 3, 120, 0, { Finition: ["Noir ciré", "Havane brossé"], Taille: ["85", "90", "95", "100", "105"] }, "ok", ["cuir-pleine-fleur", "gravure"], "Boucle laiton interchangeable."],
    ["Porte-cartes Plat", 3, 85, 0, { ...F }, "ok", ["veau-box", "gravure"], "Quatre fentes, cuir fin."],
    ["Étui à passeport", 3, 130, 104, null, "ok", ["veau-box", "fin-de-serie", "gravure"], "Deux fentes de carte, fermeture élastique."],
    ["Lacets cirés", 3, 9, 0, { Longueur: ["70 cm", "90 cm", "120 cm"] }, "libre", ["accessoire"], "Coton ciré, la paire."],
    ["Embauchoirs en cèdre", 4, 58, 0, null, "ok", ["entretien", "bois"], "Cèdre rouge, ressort en laiton."],
    ["Cirage en pot", 4, 14, 0, { Teinte: ["Incolore", "Noir", "Brun", "Cordovan"] }, "libre", ["entretien"], "Cire d'abeille, pot de 50 ml."],
    ["Brosse en crin", 4, 26, 0, null, "libre", ["entretien"], "Pour faire briller et ôter la poussière."],
    ["Chausse-pied en laiton", 4, 32, 0, null, "ok", ["entretien", "cadeau"], "Long manche, anneau de suspension."],
    ["Coffret d'entretien", 4, 96, 0, null, "ok", ["entretien", "cadeau"], "Cirages, brosses, chiffon et chausse-pied dans une boîte en bois."],
    ["Derby Édition Atelier", 0, 890, 0, { ...F4 }, "ok", ["cousu-main", "edition-limitee", "gravure"], "Série de trente paires, numérotées."],
  ],
};
