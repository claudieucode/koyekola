// Catalogue de démonstration « Boucles fières » (25 soins et accessoires pour cheveux bouclés, frisés et crépus). Marque et produits fictifs.
// Étiquettes (filtres réels /boutique/etiquette/<nom>) : type de boucles (boucles-3, boucles-4), porosité (porosite-basse, porosite-haute),
// geste de la routine (nettoyage-doux, hydratation, demelage, definition, scellage, protection) et accessoires. Aucune allégation médicale.
const C = { Contenance: ["250 ml", "500 ml"] };
module.exports = {
  categories: ["Nettoyer", "Hydrater et démêler", "Coiffer et définir", "Sceller et protéger", "Outils et accessoires"],
  products: [
    ["Shampoing crémeux doux", 0, 14, 0, { ...C }, "ok", ["nettoyage-doux", "boucles-3", "boucles-4"], "Lave en douceur, sans dessécher les longueurs."],
    ["Co-wash lavant au karité", 0, 15, 0, null, "ok", ["nettoyage-doux", "boucles-4", "porosite-haute"], "Un lavage très doux entre deux shampoings."],
    ["Shampoing clarifiant léger", 0, 13, 0, null, "rupture", ["nettoyage-doux", "porosite-basse"], "Pour retirer l'accumulation de produits."],
    ["Gommage doux cuir chevelu", 0, 17, 0, null, "ok", ["nettoyage-doux"], "Grains fins de sucre, à utiliser de temps en temps."],
    ["Masque hydratant intense", 1, 22, 0, { ...C }, "partiel", ["hydratation", "porosite-haute", "boucles-4"], "Un bain de douceur riche en beurres végétaux."],
    ["Après-shampoing démêlant", 1, 13, 0, { ...C }, "ok", ["demelage", "hydratation", "boucles-3", "boucles-4"], "Du glissant pour démêler mèche par mèche."],
    ["Leave-in léger à l'aloès", 1, 16, 0, null, "ok", ["hydratation", "porosite-basse", "boucles-3"], "Sans rinçage, texture fluide."],
    ["Brume eau de rose et glycérine", 1, 12, 0, null, "ok", ["hydratation", "porosite-basse"], "Rafraîchit les boucles entre deux lavages."],
    ["Masque aux protéines végétales", 1, 21, 0, null, "ok", ["hydratation", "porosite-haute"], "Soin d'appoint, à alterner avec un masque hydratant."],
    ["Lait hydratant crémeux", 1, 18, 14, null, "ok", ["hydratation", "boucles-4", "fin-de-serie"], "Fin de série : même formule, ancien flacon."],
    ["Crème définition boucles souples", 2, 17, 0, null, "ok", ["definition", "boucles-3"], "Rassemble les boucles sans les alourdir."],
    ["Gel définition tenue souple", 2, 15, 0, { Contenance: ["150 ml", "300 ml"] }, "ok", ["definition", "boucles-3", "boucles-4"], "Définition sans effet carton."],
    ["Custard de graines de lin", 2, 16, 0, null, "ok", ["definition", "boucles-3", "porosite-basse"], "Gel naturel, application en glissant."],
    ["Crème coiffante riche twist-out", 2, 19, 0, null, "ok", ["definition", "boucles-4", "porosite-haute"], "Pour vanilles, twist-out et coiffures protectrices."],
    ["Mousse légère volume", 2, 14, 0, null, "libre", ["definition", "porosite-basse"], "Texture aérienne pour boucles fines."],
    ["Beurre de karité fouetté", 3, 18, 0, null, "ok", ["scellage", "boucles-4", "porosite-haute"], "Scelle l'hydratation sur les longueurs."],
    ["Huile légère de pépins de raisin", 3, 12, 0, null, "ok", ["scellage", "porosite-basse"], "Fine, elle ne laisse pas de film lourd."],
    ["Huile de jojoba", 3, 15, 0, null, "ok", ["scellage", "protection"], "Un voile souple sur les pointes."],
    ["Bonnet satin doublé", 3, 16, 0, { Couleur: ["Prune", "Ocre", "Noir"] }, "ok", ["protection", "accessoires"], "Garde les boucles au repos pendant la nuit."],
    ["Taie d'oreiller satin", 3, 19, 0, null, "libre", ["protection", "accessoires"], "Moins de frottement, un réveil plus doux."],
    ["Foulard satin", 3, 14, 10, null, "ok", ["protection", "accessoires", "fin-de-serie"], "Fin de série : motifs de la saison passée."],
    ["Peigne à dents larges", 4, 8, 0, null, "ok", ["demelage", "accessoires"], "À utiliser sur cheveux mouillés et enduits de soin."],
    ["Brosse démêlante souple", 4, 13, 0, null, "ok", ["demelage", "accessoires"], "Picots flexibles, manche antidérapant."],
    ["Diffuseur universel", 4, 21, 0, null, "ok", ["definition", "accessoires"], "Sèche en douceur sans casser la boucle."],
    ["Coffret découverte 4 minis", 4, 32, 26, null, "ok", ["fin-de-serie", "nettoyage-doux", "hydratation"], "Shampoing, soin, crème, huile : pour tester une routine."],
  ],
};
