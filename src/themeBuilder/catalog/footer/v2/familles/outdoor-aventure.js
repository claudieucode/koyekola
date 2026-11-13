// Famille v2 « Outdoor et aventure » — 6 modèles (ft2-404 à ft2-409), refaits d'après les captures 34/35 (marque dessinée, pastilles de réseaux, colonnes à titre ondulé, bande ondulée en bas) et 36 (mot monumental, équerres, ombres, grande marque géométrique).
// ANGLES DROITS partout. Illustrations en SVG (widget html). Marques fictives ; aucune coordonnée inventée. Transitions de 360 ms ; une animation visible par modèle ; rien ne bouge sous « prefers-reduced-motion ».
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-illus-fitout");
const { H, dessins, racineDe, souffle, coordonnees, bouton, piedsVagues, piedsMonument, profil } = A;
const FAM = "outdoor-aventure";
const ID = (key, label, humeur, fond, texte_, discret, accent, surface, police, titres, ligne, poids = "600", ex = {}) => identite({ key, label, humeur, fond, texte: texte_, discret, accent, surface, encre: ex.encre || fond, surEncre: ex.sur || texte_, police, titres, rayon: "0px", rayonBouton: "0px", ombre: "none", poids, bordure: "0px", ligne });

// ft2-404 — randonnée (capture 34 : sombre, écusson de massif, crêtes de montagnes en bas)
const carnet = ID("c404", "Vert forêt et ocre", "dark", "#1b2a20", "#efe9d8", "#b5c2b4", "#e0a53a", "#243628", "font.cabin", "font.alfa-slab-one", "#efe9d833");
const carnetDeSentier = modeleV2({
  id: identifiantV2(404, "carnet-de-sentier"), concept: "c-404-carnet-de-sentier", name: "Carnet de sentier", family: FAM,
  description: "Pour un site de randonnée : un écusson de massif avec soleil ocre et sentier pointillé, pastilles de réseaux, liens à chevrons, journal, contact à icônes et crêtes de montagnes en bas. Vert forêt et ocre.",
  tags: ["randonnée", "sentiers", "massif", "crêtes", "illustration", "vert forêt", "ocre", "angles droits"],
  identity: carnet, racine: racineDe("#34523a"),
  widgets: ["html", "text", "link", "social", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const m = H(k, dessins.massif({ f: "#243628", sol: "#e0a53a", m1: "#4f7a5a", m2: "#2f5a3c", m3: "#16231a", n: "#efe9d8" }), { width: "230px", maxWidth: "100%" });
    souffle(m, 6500);
    return piedsVagues(k, env, G, { mode: "cartes", fond2: "#243628", fond: "#1b2a20", fg: "#efe9d8", mute: "#b5c2b4", accent: "#e0a53a", surAccent: "#1b2a20", vagues: ["#243628", "#2c4531", "#34523a"], seed: 5, crete: true, marque: m, nom: "Carnet de sentier", phrase: "Itinéraires, conseils de saison et carnets de route pour randonner en confiance.", iconeFond: "#efe9d8", iconeCouleur: "#1b2a20", ordre: ["marque", "liens", "journal", "contact"], titreLiens: "Rubriques", liens: [["Itinéraires", "/blog"], ["Matériel", "/catalogue"], ["Sécurité en montagne", "/catalogue"], ["Contact", "/contact"]], articles: [["Conseils de saison", "/blog", "Saison"], ["Carnets de route", "/blog", "Récits"]], mentions: "#efe9d8", mentionsLiens: "#efe9d8" });
  },
}, FAM);

// ft2-405 — alpinisme (capture 36 : mot CORDÉE rogné marine sur glace, équerres, ombres, grand sommet géométrique)
const cordee = ID("c405", "Glace, marine et orange sécurité", "light", "#e8f1f5", "#0d2b45", "#3b5a73", "#b8480a", "#d3e4ec", "font.be-vietnam-pro", "font.saira-condensed", "#0d2b4533");
const cordeeModele = modeleV2({
  id: identifiantV2(405, "cordee"), concept: "c-405-cordee", name: "Cordée", family: FAM,
  description: "Pour une boutique d'alpinisme : le mot CORDÉE en énormes capitales marine rogné, équerres orange, ombres bleutées, grand sommet géométrique à drapeau, coordonnées, réseaux et liens. Glace, marine et orange.",
  tags: ["alpinisme", "montagne", "sommet", "mot monumental", "illustration", "marine", "orange", "angles droits"],
  identity: cordee, racine: racineDe("#e8f1f5"),
  widgets: ["html", "text", "link", "social", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const m = H(k, dessins.sommet({ p1: "#0d2b45", p2: "#3b7aa6", p3: "#ff6a13", n: "#e8f1f5" }), { width: "100%", maxWidth: "340px" });
    souffle(m, 4200);
    return piedsMonument(k, env, G, { fond: "#e8f1f5", fg: "#0d2b45", mute: "#3b5a73", accent: "#b8480a", titre: "#0d2b45", ordre: "mot-bas", variante: "marque-bande", fond2: "#d3e4ec", mot: "CORDÉE", rogne: false, taille: [80, 190], poids: "700", suivi: "0", motCouleur: "#0d2b45", equerre: "#ff6a13", ombre: { col: "#0d2b45", op: 0.28 }, ligne: "#0d2b4533", iconeFond: "#0d2b45", iconeCouleur: "#e8f1f5", marque: m, liens: [["Boutique", "/boutique"], ["Guides et topos", "/blog"], ["Location", "/catalogue"], ["Questions fréquentes", "/faq"]],
      gauche: (k2, bloc) => [bloc("Nous trouver", [coordonnees(k2, { couleur: "#0d2b45", lien: "#0d2b45", survol: "#b8480a", focus: "#b8480a", taille: 16 })]), bouton(k2, "Voir le matériel", "/catalogue", { texte: "#0d2b45", fond: "#ff6a13", survol: { backgroundColor: "#0d2b45", borderColor: "#0d2b45", color: "#ffffff", transform: { y: -3 } }, focus: "#0d2b45" })] });
  },
}, FAM);

// ft2-406 — bivouac (capture 35 : clair sable, scène de camp, vagues dunes jusqu'au rouille)
const etapes = ID("c406", "Sable et rouille", "dark", "#7a2410", "#fdf3e3", "#f1d2c4", "#f2b49f", "#8f2d15", "font.josefin-sans", "font.yeseva-one", "#33180e33", "600", { encre: "#7a2410", sur: "#fdf3e3" });
const quatreEtapes = modeleV2({
  id: identifiantV2(406, "frise-du-bivouac"), concept: "c-406-frise-du-bivouac", name: "Frise du bivouac", family: FAM,
  description: "Pour un site de voyage en autonomie : une scène de camp dessinée (tente, feu, lune, étoiles), pastilles de réseaux, étapes à chevrons, contact à icônes et dunes qui descendent jusqu'au rouille. Sable et rouille.",
  tags: ["voyage", "bivouac", "tente", "scène", "dunes", "illustration", "sable", "rouille", "angles droits"],
  identity: etapes, racine: racineDe("#7a2410"),
  widgets: ["html", "text", "link", "social", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const c = H(k, dessins.camp({ f: "#33180e", lune: "#f1e3c8", t1: "#a63716", t2: "#7a2410", feu: "#e0842b", sol: "#7a2410" }), { width: "230px", maxWidth: "100%" });
    souffle(c, 5000);
    return piedsVagues(k, env, G, { mode: "frise", etapes: [["Préparer", "/faq", "Itinéraire, météo, sacs."], ["Partir", "/faq", "Transports et premières heures."], ["Bivouaquer", "/faq", "Choisir et installer son camp."], ["Rentrer", "/faq", "Bilan et entretien du matériel."]], fond: "#f1e3c8", fg: "#33180e", mute: "#5e3f31", accent: "#a63716", surAccent: "#f1e3c8", titre: "#7a2410", vagues: ["#e8d0a8", "#c97a52", "#7a2410"], seed: 23, marque: c, nom: "Frise du bivouac", phrase: "Quatre étapes pour préparer une sortie en autonomie, sans rien oublier.", iconeFond: "#7a2410", iconeCouleur: "#fdf3e3", ordre: ["marque", "liens", "journal", "contact"], titreLiens: "Étapes", liens: [["Préparer", "/faq"], ["Partir", "/faq"], ["Bivouaquer", "/faq"], ["Rentrer", "/faq"]], articles: [["Choisir et installer son camp", "/blog", "Bivouac"], ["Entretenir son matériel", "/blog", "Retour"]], mentions: "#fdf3e3", mentionsLiens: "#fdf3e3" });
  },
}, FAM);

// ft2-407 — guides de haute montagne (capture 35 : papier crème, sceau dessiné, vagues bleu glacier jusqu'à l'encre)
const bureau = ID("c407", "Papier crème et encre marine", "dark", "#1c2a44", "#f8f3e4", "#c9d0dc", "#e8b4bb", "#26375a", "font.crimson-pro", "font.libre-caslon-text", "#1c2a4440", "500", { encre: "#1c2a44", sur: "#f8f3e4" });
const bureauDesGuides = modeleV2({
  id: identifiantV2(407, "bureau-des-guides"), concept: "c-407-bureau-des-guides", name: "Bureau des guides", family: FAM,
  description: "Pour un bureau de guides de haute montagne : un grand sceau dessiné (sommets, piolets croisés, lauriers) au centre, horaires, liens à chevrons, contact à icônes et vagues bleu glacier jusqu'à l'encre marine.",
  tags: ["guides", "haute montagne", "sceau", "piolets", "illustration", "vagues", "crème", "marine", "angles droits"],
  identity: bureau, racine: racineDe("#1c2a44"),
  widgets: ["html", "text", "link", "social", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const s = H(k, dessins.sceau({ p1: "#1c2a44", p2: "#8f1d2c", f: "#f8f3e4" }), { width: "220px", maxWidth: "100%" });
    souffle(s, 6000);
    return piedsVagues(k, env, G, { mode: "papier", mention: "Encadrement en haute montagne", fond: "#f8f3e4", fg: "#1c2a44", mute: "#4c5870", accent: "#8f1d2c", surAccent: "#f8f3e4", titre: "#1c2a44", vagues: ["#e3e8ee", "#b8c6d8", "#1c2a44"], seed: 31, marque: s, nom: "Bureau des guides", phrase: "Encadrement en haute montagne : sorties, formations et conditions du moment.", iconeFond: "#1c2a44", iconeCouleur: "#f8f3e4", ordre: ["horaires", "marque", "liens", "contact"], titreLiens: "Le bureau", liens: [["Sorties encadrées", "/blog"], ["Formations", "/catalogue"], ["Conditions en montagne", "/blog"], ["Questions fréquentes", "/faq"]], articles: [], mentions: "#f8f3e4", mentionsLiens: "#f8f3e4" });
  },
}, FAM);

// ft2-408 — application de trail (capture 34 : sombre, carte topographique dessinée, crêtes numériques)
const console_ = ID("c408", "Bleu nuit et cyan", "dark", "#0a1020", "#dbe7f3", "#97a9bf", "#4de3d0", "#111a30", "font.martian-mono", "font.martian-mono", "#4de3d055", "500");
const consoleDeSentier = modeleV2({
  id: identifiantV2(408, "console-de-sentier"), concept: "c-408-console-de-sentier", name: "Console de sentier", family: FAM,
  description: "Pour une application de trail et de GPS : une carte topographique dessinée (courbes de niveau, tracé en pointillés, repère), pastilles de réseaux, liens, lettre d'information, contact à icônes et crêtes numériques.",
  tags: ["trail", "application", "carte", "courbes de niveau", "GPS", "illustration", "bleu nuit", "cyan", "angles droits"],
  identity: console_, racine: racineDe("#0f3b44"),
  widgets: ["html", "text", "link", "social", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const m = H(k, dessins.carte({ f: "#0f1a33", l: "#4de3d0", t: "#f2b84b", pin: "#ff6b6b" }), { width: "100%", maxWidth: "320px" });
    souffle(m, 5500);
    return piedsVagues(k, env, G, { mode: "terminal", fond2: "#111a30", fond: "#0a1020", fg: "#dbe7f3", mute: "#97a9bf", accent: "#4de3d0", surAccent: "#0a1020", vagues: ["#111a30", "#15304a", "#0f3b44"], seed: 41, crete: true, marque: m, nom: "Console de sentier", phrase: "Cartes hors ligne et carnet de course pour vos sorties de trail.", iconeFond: "#4de3d0", iconeCouleur: "#0a1020", ordre: ["marque", "liens", "contact", "abo"], poidsMarque: 3.2, titreLiens: "Rubriques", introAbo: "Nouveaux itinéraires, une fois par mois.", liens: [["Itinéraires", "/blog"], ["Cartes hors ligne", "/catalogue"], ["Carnet de course", "/blog"], ["Aide", "/faq"]], articles: [], mentions: "#dbe7f3", mentionsLiens: "#dbe7f3" });
  },
}, FAM);

// ft2-409 — cyclo-voyage (capture 36 : mot DÉNIVELÉ doré, roue sur parallélogramme, ombres remplacées par un profil d'altitude)
const deniv = ID("c409", "Ambre, cuivre et terre brûlée", "dark", "#1e140d", "#f8efe3", "#d9c3ab", "#f0a050", "#3a2312", "font.oxanium", "font.oxanium", "#f8efe344");
const denivele = modeleV2({
  id: identifiantV2(409, "denivele"), concept: "c-409-denivele", name: "Dénivelé", family: FAM,
  description: "Pour un site de cyclo-voyage : le mot DÉNIVELÉ en énormes capitales ambre, un profil d'altitude dessiné sous les lettres, une roue de vélo sur parallélogramme, coordonnées, réseaux et liens. Ambre, cuivre et terre brûlée.",
  tags: ["vélo", "cyclo-voyage", "profil d'altitude", "roue", "mot monumental", "illustration", "ambre", "cuivre", "angles droits"],
  identity: deniv, racine: racineDe("#1e140d"),
  widgets: ["html", "text", "link", "social", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const m = H(k, dessins.roue({ p1: "#d9822b", p2: "#f3b66d", p3: "#f8efe3" }), { width: "100%", maxWidth: "340px" });
    souffle(m, 4800);
    return piedsMonument(k, env, G, { fond: "#1e140d", fg: "#f8efe3", mute: "#d9c3ab", accent: "#f3b66d", titre: "#f3b66d", mot: "DÉNIVELÉ", rogne: false, taille: [56, 170], poids: "800", suivi: "-0.02em", motCouleur: "#f3b66d", equerre: null, ombreFn: (W, h, u) => profil(W, h, { l: "#f3b66d", a: "#d9822b" }, u), ligne: "#f8efe344", iconeFond: "#f3b66d", iconeCouleur: "#1e140d", marque: m, variante: "empile", alignDroite: false, liens: [["Itinéraires", "/blog"], ["Cols mythiques", "/blog"], ["Bagagerie", "/catalogue"], ["Entretien", "/faq"]],
      gauche: (k2, bloc) => [bloc("Nous trouver", [coordonnees(k2, { couleur: "#f8efe3", lien: "#f8efe3", survol: "#f3b66d", focus: "#f3b66d", taille: 16 })]), bouton(k2, "Voir les itinéraires", "/blog", { texte: "#1e140d", fond: "#f3b66d", survol: { backgroundColor: "#f8efe3", borderColor: "#f8efe3", color: "#1e140d", transform: { y: -3 } }, focus: "#f8efe3" })] });
  },
}, FAM);

module.exports = { key: FAM, label: "Outdoor et aventure", target: 6, built: true,
  description: "Pieds standard, angles droits, avec de vraies illustrations : randonnée, alpinisme, bivouac, guides de haute montagne, application de trail, cyclo-voyage.",
  models: [carnetDeSentier, cordeeModele, quatreEtapes, bureauDesGuides, consoleDeSentier, denivele] };
