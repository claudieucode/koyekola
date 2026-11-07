// Catalogue de démonstration « Box du Mois » (25 produits : box à abonnement, box à l'unité, extras). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Le contenu d'une box n'est volontairement pas détaillé (c'est la surprise) ; aucune valeur « de plus de N euros » n'est annoncée. Les formules d'abonnement se règlent produit par produit dans l'administration :
// ce catalogue n'en crée aucune.
module.exports = {
  categories: ["Les box du mois", "Box à l'unité", "Cadeaux", "Extras"],
  products: [
    ["Box du mois — Gourmande", 0, 29.9, 0, null, "ok", ["box", "abonnable", "gourmand"], "Une sélection de produits à grignoter et à cuisiner, différente chaque mois."],
    ["Box du mois — Maison", 0, 34.9, 0, null, "ok", ["box", "abonnable", "maison"], "Petits objets et senteurs pour la maison, renouvelés chaque mois."],
    ["Box du mois — Bien-être", 0, 32.9, 0, null, "ok", ["box", "abonnable", "bien-etre"], "Une sélection de soins et de moments à soi, renouvelée chaque mois."],
    ["Box du mois — Curieux", 0, 27.9, 24.9, null, "ok", ["box", "abonnable", "curieux"], "Jeux, lectures et petites expériences, un thème par mois."],
    ["Box du mois — Duo", 0, 54.9, 0, null, "ok", ["box", "abonnable", "duo"], "Deux fois plus d'objets à partager, thème surprise."],
    ["Box du mois — Plantes", 0, 31.9, 0, null, "rupture", ["box", "abonnable", "plantes"], "Graines, pots et astuces de culture, un thème par mois."],
    ["Box du mois — Créative", 0, 33.9, 0, { Niveau: ["Débutant", "Confirmé"] }, "ok", ["box", "abonnable", "creatif"], "Matériel et pas-à-pas pour un petit projet manuel chaque mois."],
    ["Box du mois — Café et thé", 0, 28.9, 0, { Préférence: ["Café", "Thé", "Les deux"] }, "ok", ["box", "abonnable", "gourmand"], "Deux à trois infusions ou cafés de petits torréfacteurs."],
    ["Box unique — Gourmande", 1, 34.9, 0, null, "ok", ["box", "unique", "gourmand"], "La box gourmande en achat unique, sans engagement."],
    ["Box unique — Maison", 1, 39.9, 0, null, "ok", ["box", "unique", "maison"], "La box maison en achat unique, sans engagement."],
    ["Box unique — Bien-être", 1, 37.9, 0, null, "ok", ["box", "unique", "bien-etre"], "La box bien-être en achat unique, sans engagement."],
    ["Box unique — Curieux", 1, 32.9, 0, null, "ok", ["box", "unique", "curieux"], "La box curieux en achat unique, sans engagement."],
    ["Box unique — Duo", 1, 59.9, 49.9, null, "ok", ["box", "unique", "duo"], "La box duo en achat unique, sans engagement."],
    ["Box unique — Créative", 1, 38.9, 0, null, "ok", ["box", "unique", "creatif"], "La box créative en achat unique, sans engagement."],
    ["Fourreau cadeau pour une box", 2, 4, 0, null, "ok", ["cadeau"], "Un fourreau en carton kraft qui entoure la box, à fermer avec un ruban."],
    ["Étiquettes cadeau, lot de 20", 2, 3, 0, null, "libre", ["cadeau"], "Vingt étiquettes à ficelle, à écrire soi-même."],
    ["Papier cadeau et ruban", 2, 5, 0, { Coloris: ["Kraft", "Rose", "Vert sapin"] }, "ok", ["cadeau"], "Une feuille de papier et un mètre de ruban."],
    ["Carte à écrire, lot de 3", 2, 6, 0, null, "ok", ["cadeau"], "Trois cartes avec enveloppes, texte à écrire soi-même."],
    ["Boîte de rangement kraft", 3, 12, 0, { Taille: ["Petite", "Grande"] }, "ok", ["extra"], "Pour garder vos box : carton rigide, couvercle à charnière."],
    ["Ciseaux de déballage", 3, 9, 0, null, "ok", ["extra"], "Pointe arrondie, lame de 8 cm."],
    ["Carnet des surprises", 3, 11, 0, null, "ok", ["extra"], "Pour noter ce que vous avez aimé, 96 pages."],
    ["Tote bag en coton", 3, 14, 0, { Coloris: ["Écru", "Baie"] }, "ok", ["extra"], "Coton épais, anses longues."],
    ["Lot d'étiquettes autocollantes", 3, 4, 0, null, "libre", ["extra"], "Quarante étiquettes à écrire."],
    ["Mug émaillé", 3, 16, 0, { Coloris: ["Crème", "Baie"] }, "partiel", ["extra", "gourmand"], "Émail bleu et liseré, 30 cl."],
    ["Bougie de salon", 3, 18, 0, null, "ok", ["extra", "maison"], "Cire végétale, mèche en coton, 180 g."],
  ],
};
