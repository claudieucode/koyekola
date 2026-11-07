// Catalogue de démonstration « Perle noire » (26 produits : formats en variantes, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Les contenances, origines et conservations ne sont pas garanties : le vendeur les renseigne sur chaque fiche. Les caractéristiques du comparateur se saisissent dans l'admin produit.
const F = { Format: ["30 g", "50 g", "125 g"] };
const F2 = { Format: ["50 g", "100 g"] };
module.exports = {
  categories: ["Caviars", "Œufs de poisson", "Poissons fumés", "Foie gras et truffes", "Accompagnements", "Coffrets et accessoires"],
  products: [
    ["Caviar d'esturgeon Classique", 0, 95, 0, { ...F }, "partiel", ["caviar", "esturgeon"], "Grains fermes, goût iodé et rond, en boîte d'origine."],
    ["Caviar d'esturgeon Réserve", 0, 140, 0, { ...F }, "ok", ["caviar", "esturgeon"], "Grains plus gros, finale longue et beurrée."],
    ["Caviar d'esturgeon Prestige", 0, 210, 0, { Format: ["30 g", "50 g"] }, "ok", ["caviar", "esturgeon", "edition-limitee"], "Sélection de petites séries, mise en boîte à la main."],
    ["Caviar d'esturgeon Perle", 0, 180, 144, { Format: ["30 g", "50 g"] }, "ok", ["caviar", "fin-de-serie"], "Grains clairs et nacrés, saveur délicate."],
    ["Caviar Impérial", 0, 260, 0, { Format: ["30 g"] }, "rupture", ["caviar", "edition-limitee"], "Grains dorés très rares, série numérotée."],
    ["Caviar pasteurisé", 0, 58, 0, { ...F2 }, "ok", ["caviar"], "Pot en verre, à conserver selon l'étiquette."],
    ["Caviar pressé", 0, 72, 0, null, "ok", ["caviar"], "Texture dense, à tartiner."],
    ["Œufs de truite", 1, 28, 0, { Format: ["50 g", "100 g"] }, "ok", ["oeufs", "truite"], "Grains orangés qui éclatent en bouche."],
    ["Œufs de saumon", 1, 24, 0, { Format: ["50 g", "100 g"] }, "ok", ["oeufs", "saumon"], "Gros grains vifs, légèrement salés."],
    ["Œufs de hareng fumés", 1, 19, 0, null, "ok", ["oeufs", "fume"], "Petits grains noirs, fumés au bois."],
    ["Tarama aux œufs de cabillaud", 1, 14, 0, null, "libre", ["oeufs"], "Recette à la crème, pot de 150 g."],
    ["Œufs de lump", 1, 12, 0, null, "ok", ["oeufs"], "Grains noirs et petits, pour garnir."],
    ["Saumon fumé sauvage", 2, 46, 0, { Format: ["4 tranches", "8 tranches"] }, "ok", ["saumon", "fume"], "Fumé lentement au bois de hêtre."],
    ["Saumon fumé d'élevage", 2, 32, 25.6, { Format: ["4 tranches", "8 tranches"] }, "ok", ["saumon", "fume", "fin-de-serie"], "Tranches fines, fumage doux."],
    ["Esturgeon fumé", 2, 54, 0, null, "ok", ["esturgeon", "fume"], "Chair ferme, fumée au bois de chêne."],
    ["Truite fumée", 2, 24, 0, null, "ok", ["truite", "fume"], "Chair fondante, fumée à froid."],
    ["Anguille fumée", 2, 38, 0, null, "rupture", ["fume"], "Filets épais, fumage traditionnel."],
    ["Foie gras de canard entier", 3, 62, 0, { Format: ["100 g", "200 g"] }, "ok", ["foie-gras"], "Mi-cuit, à trancher à la lame chaude."],
    ["Foie gras d'oie", 3, 88, 0, null, "ok", ["foie-gras", "edition-limitee"], "Texture soyeuse, assaisonnement simple."],
    ["Truffe noire fraîche", 3, 120, 0, null, "partiel", ["truffe"], "Vendue en saison, au poids indiqué sur la fiche."],
    ["Huile à la truffe", 3, 22, 0, null, "ok", ["truffe"], "Flacon de 100 ml, pour finir un plat."],
    ["Blinis artisanaux", 4, 9, 0, null, "ok", ["accompagnement"], "Lot de 12, à réchauffer."],
    ["Crème épaisse d'Isigny", 4, 5, 0, null, "ok", ["accompagnement"], "Pot de 20 cl, à garder au frais."],
    ["Cuillère en nacre", 5, 24, 0, null, "ok", ["accessoire", "personnalisable"], "Neutre au goût, à utiliser avec le caviar."],
    ["Coffret découverte trois caviars", 5, 190, 152, null, "ok", ["coffret", "cadeau"], "Trois boîtes de 30 g, cuillère en nacre incluse."],
    ["Seau à glace en inox", 5, 78, 0, null, "ok", ["accessoire"], "Présente la boîte sur de la glace pilée."],
  ],
};
