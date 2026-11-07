// Catalogue de démonstration « Monture Claire » (26 produits : variantes de coloris et de calibre, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Les étiquettes de forme (ronde, ovale, carree, rectangulaire, pantos, aviateur, papillon) sont celles que le sélecteur de formes du thème ouvre : /boutique/etiquette/<forme>.
// Les cotes (calibre, pont, branche) sont écrites dans la description de chaque monture. Les montures sont vendues sans verres.
const AC = { Coloris: ["Écaille", "Cristal", "Noir"] };
const TI = { Coloris: ["Argent", "Champagne"] };
const CAL = (...c) => ({ Calibre: c });
module.exports = {
  categories: ["Lunettes de vue", "Lunettes de soleil", "Clips solaires", "Étuis et entretien"],
  products: [
    ["Monture Cadre", 0, 320, 0, { ...AC, ...CAL("49", "51") }, "partiel", ["rectangulaire", "acetate"], "Acétate poli, charnières cinq tenons. Calibres 49 et 51, pont 21, branche 145. Monture seule."],
    ["Monture Orbe", 0, 390, 0, { ...TI, ...CAL("46", "48") }, "ok", ["ronde", "titane"], "Titane brossé, plaquettes réglables. Calibres 46 et 48, pont 22, branche 140. Monture seule."],
    ["Monture Arche", 0, 340, 0, { ...AC }, "ok", ["pantos", "acetate"], "Dessus droit, dessous plein. Calibre 49, pont 21, branche 145. Monture seule."],
    ["Monture Plan", 0, 360, 0, { Coloris: ["Cristal", "Fumé clair"] }, "ok", ["carree", "acetate", "transparente"], "Acétate translucide, volume carré. Calibre 52, pont 19, branche 145. Monture seule."],
    ["Monture Fil", 0, 410, 0, { ...TI }, "ok", ["ovale", "titane"], "Monture filaire, trois pièces. Calibre 50, pont 20, branche 140. Monture seule."],
    ["Monture Vitrail", 0, 380, 0, { Coloris: ["Écaille", "Bordeaux"] }, "ok", ["papillon", "acetate"], "Coin extérieur relevé. Calibre 53, pont 17, branche 140. Monture seule."],
    ["Monture Nacelle", 0, 450, 0, { ...TI }, "ok", ["aviateur", "titane"], "Double pont, branches fines. Calibre 55, pont 16, branche 145. Monture seule."],
    ["Monture Cristal Pur", 0, 360, 288, { Coloris: ["Cristal"] }, "ok", ["rectangulaire", "acetate", "transparente", "fin-de-serie"], "Acétate incolore, fin de série. Calibre 50, pont 20, branche 145. Monture seule."],
    ["Monture Voûte", 0, 430, 0, { ...TI }, "ok", ["pantos", "titane"], "Titane et acétate associés. Calibre 48, pont 21, branche 145. Monture seule."],
    ["Monture Linteau", 0, 340, 0, { ...AC }, "rupture", ["rectangulaire", "acetate"], "Acétate épais, façade large. Calibre 51, pont 18, branche 145. Monture seule."],
    ["Monture Arc", 0, 480, 0, { Coloris: ["Cristal", "Ambre"] }, "ok", ["ronde", "acetate", "transparente", "edition-limitee"], "Série numérotée de 200 pièces. Calibre 47, pont 22, branche 145. Monture seule."],
    ["Monture Loggia", 0, 370, 0, { ...AC }, "ok", ["ovale", "acetate"], "Ovale doux, écaille profonde. Calibre 50, pont 20, branche 145. Monture seule."],
    ["Monture Pilastre", 0, 420, 0, { ...TI }, "ok", ["carree", "titane"], "Façade carrée en titane. Calibre 52, pont 19, branche 145. Monture seule."],
    ["Monture Galerie", 0, 350, 0, null, "ok", ["rectangulaire", "acetate"], "Monture fine, teinte noire. Calibre 50, pont 20, branche 145. Monture seule."],
    ["Solaire Horizon", 1, 340, 0, { Coloris: ["Or pâle", "Argent"] }, "ok", ["aviateur", "titane", "solaire"], "Verres teintés, monture titane. Calibre 58, pont 14, branche 140."],
    ["Solaire Pavillon", 1, 360, 0, { Coloris: ["Écaille", "Noir"] }, "ok", ["papillon", "acetate", "solaire"], "Verres teintés, coin relevé. Calibre 54, pont 18, branche 140."],
    ["Solaire Rotonde", 1, 320, 0, { Coloris: ["Noir", "Écaille", "Vert sombre"] }, "partiel", ["ronde", "acetate", "solaire"], "Verres teintés, forme ronde. Calibre 49, pont 22, branche 145."],
    ["Solaire Façade", 1, 380, 0, { Coloris: ["Noir", "Cristal fumé"] }, "ok", ["carree", "acetate", "solaire"], "Verres teintés, volume carré. Calibre 55, pont 19, branche 145."],
    ["Solaire Belvédère", 1, 330, 264, { Coloris: ["Écaille"] }, "ok", ["pantos", "acetate", "solaire", "fin-de-serie"], "Verres teintés, fin de série. Calibre 51, pont 21, branche 145."],
    ["Solaire Écran", 1, 400, 0, { Coloris: ["Noir"] }, "ok", ["rectangulaire", "acetate", "solaire"], "Verres teintés, ligne basse. Calibre 56, pont 17, branche 145."],
    ["Solaire Verrière", 1, 350, 0, { Coloris: ["Cristal fumé", "Ambre"] }, "ok", ["ovale", "acetate", "transparente", "solaire"], "Acétate translucide, verres teintés. Calibre 52, pont 20, branche 145."],
    ["Clip solaire Orbe", 2, 140, 0, null, "ok", ["ronde", "clip"], "Clip magnétique pour la monture Orbe calibre 48. Verres teintés."],
    ["Clip solaire Cadre", 2, 150, 0, null, "ok", ["rectangulaire", "clip"], "Clip magnétique pour la monture Cadre calibre 49. Verres teintés."],
    ["Étui rigide Écrin", 3, 90, 0, { Coloris: ["Gris pierre", "Écaille"] }, "ok", ["etui"], "Coque rigide, intérieur doux, fermeture magnétique."],
    ["Étui de voyage pliable", 3, 45, 0, null, "ok", ["etui"], "Étui souple pour les déplacements."],
    ["Chiffon microfibre", 3, 18, 0, null, "libre", ["entretien"], "Chiffon doux pour verres et montures."],
    ["Spray nettoyant verres", 3, 24, 0, null, "libre", ["entretien"], "Nettoie les verres sans laisser de traces."],
  ],
};
