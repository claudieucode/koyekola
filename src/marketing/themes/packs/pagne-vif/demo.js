// Catalogue de démonstration « Pagne Vif » (26 produits : tissus au mètre, coupons de 6 yards, autres tissus, mercerie). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Étiquettes utilisées par le thème : « au-metre » (prix = prix d'UN mètre ; la quantité du panier = nombre de mètres entiers), « coupon-6-yards » (la quantité = nombre de coupons),
// puis le nom du coloris (indigo, carmin, soleil, foret, hibiscus, terre) pour les filtres du nuancier. Les coloris sont de vraies variantes du produit, avec leur propre stock.
const C4 = { Coloris: ["Indigo", "Carmin", "Soleil", "Forêt"] };
const C6 = { Coloris: ["Indigo", "Carmin", "Soleil", "Forêt", "Hibiscus", "Terre"] };
const C3 = { Coloris: ["Indigo", "Hibiscus", "Terre"] };
module.exports = {
  categories: ["Wax au mètre", "Coupons de 6 yards", "Autres tissus", "Mercerie", "Accessoires"],
  products: [
    ["Wax Éventail du soir", 0, 14, 0, { ...C6 }, "partiel", ["au-metre", "wax", "indigo", "carmin", "soleil", "foret", "hibiscus", "terre"], "Wax coton, éventails en quinconce, largeur 115 cm."],
    ["Wax Cercles de mil", 0, 13, 0, { ...C4 }, "ok", ["au-metre", "wax", "indigo", "carmin", "soleil", "foret"], "Wax coton, cercles concentriques, largeur 115 cm."],
    ["Wax Œil de panthère", 0, 15, 12, { ...C3 }, "ok", ["au-metre", "wax", "indigo", "hibiscus", "terre", "fin-de-serie"], "Wax coton, grands yeux ovales, largeur 115 cm."],
    ["Wax Losanges de Dakar", 0, 14, 0, { ...C4 }, "ok", ["au-metre", "wax", "indigo", "carmin", "soleil", "foret"], "Wax coton, losanges emboîtés, largeur 115 cm."],
    ["Wax Mangue en fête", 0, 16, 0, { Coloris: ["Soleil", "Forêt", "Hibiscus"] }, "ok", ["au-metre", "wax", "soleil", "foret", "hibiscus"], "Wax coton, grandes mangues graphiques, largeur 115 cm."],
    ["Wax Calebasses", 0, 13, 0, { Coloris: ["Terre", "Indigo"] }, "ok", ["au-metre", "wax", "terre", "indigo"], "Wax coton, calebasses stylisées, largeur 115 cm."],
    ["Wax Plumes de paon", 0, 17, 0, null, "rupture", ["au-metre", "wax", "indigo"], "Wax coton, plumes dégradées, largeur 115 cm."],
    ["Wax Damier solaire", 0, 12, 0, { ...C3 }, "ok", ["au-metre", "wax", "soleil", "carmin", "foret"], "Wax coton, damier de soleils, largeur 115 cm."],
    ["Wax Fleurs de kapok", 0, 15, 0, { Coloris: ["Hibiscus", "Carmin", "Indigo"] }, "ok", ["au-metre", "wax", "hibiscus", "carmin", "indigo"], "Wax coton, fleurs à cinq pétales, largeur 115 cm."],
    ["Wax Rayures de marché", 0, 11, 0, null, "ok", ["au-metre", "wax", "carmin"], "Wax coton, rayures larges irrégulières, largeur 115 cm."],
    ["Pagne Éventail du soir, 6 yards", 1, 78, 0, { ...C4 }, "ok", ["coupon-6-yards", "wax", "indigo", "carmin", "soleil", "foret"], "Coupon de 6 yards (environ 5,5 m), largeur 115 cm."],
    ["Pagne Cercles de mil, 6 yards", 1, 72, 0, { ...C3 }, "ok", ["coupon-6-yards", "wax", "indigo", "carmin", "soleil"], "Coupon de 6 yards (environ 5,5 m), largeur 115 cm."],
    ["Pagne Œil de panthère, 6 yards", 1, 84, 69, null, "ok", ["coupon-6-yards", "wax", "terre", "fin-de-serie"], "Coupon de 6 yards (environ 5,5 m), largeur 115 cm."],
    ["Pagne Mangue en fête, 6 yards", 1, 88, 0, { Coloris: ["Soleil", "Hibiscus"] }, "ok", ["coupon-6-yards", "wax", "soleil", "hibiscus"], "Coupon de 6 yards (environ 5,5 m), largeur 115 cm."],
    ["Pagne Losanges de Dakar, 6 yards", 1, 78, 0, null, "ok", ["coupon-6-yards", "wax", "foret"], "Coupon de 6 yards (environ 5,5 m), largeur 115 cm."],
    ["Bogolan crème et terre", 2, 22, 0, null, "ok", ["au-metre", "teinture-naturelle", "terre"], "Coton tissé en bandes, motifs peints, largeur 45 cm."],
    ["Bazin riche brodé", 2, 26, 0, { Coloris: ["Indigo", "Hibiscus", "Soleil"] }, "partiel", ["au-metre", "bazin", "indigo", "hibiscus", "soleil"], "Bazin damassé, finition satinée, largeur 140 cm."],
    ["Coton uni teint indigo", 2, 9, 0, null, "ok", ["au-metre", "uni", "indigo"], "Coton uni, parfait pour accompagner un wax, largeur 140 cm."],
    ["Kita à bandes tissées", 2, 30, 0, null, "ok", ["au-metre", "tisse-main", "soleil"], "Bandes tissées étroites, assemblées en lés."],
    ["Doublure coton blanc", 2, 6, 0, null, "libre", ["au-metre", "uni", "mercerie"], "Doublure légère, largeur 140 cm."],
    ["Bobine de fil assorti", 3, 3, 0, { Coloris: ["Indigo", "Carmin", "Soleil", "Forêt"] }, "ok", ["mercerie", "indigo", "carmin", "soleil", "foret"], "Polyester 200 m, coloris proches des wax."],
    ["Fermeture à glissière 50 cm", 3, 2, 0, null, "ok", ["mercerie"], "Nylon, dents fines."],
    ["Boutons coco, lot de 6", 3, 5, 0, null, "ok", ["mercerie", "terre"], "Boutons en noix de coco, 20 mm."],
    ["Mètre ruban de couturière", 3, 4, 0, null, "ok", ["mercerie"], "150 cm / 60 pouces, double face."],
    ["Foulard de tête à nouer", 4, 12, 0, { ...C3 }, "ok", ["accessoire", "wax", "indigo", "hibiscus", "terre"], "Wax 50 × 180 cm, ourlet roulotté."],
    ["Pochette zippée en wax", 4, 16, 0, { Coloris: ["Carmin", "Forêt"] }, "ok", ["accessoire", "wax", "carmin", "foret"], "Doublée, 22 × 14 cm."],
  ],
};
