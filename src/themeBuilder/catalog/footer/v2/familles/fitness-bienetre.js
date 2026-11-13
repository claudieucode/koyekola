// Famille v2 « Fitness, yoga et bien-être » — 6 modèles (ft2-398 à ft2-403), refaits d'après les captures 34/35 (marque dessinée, pastilles de réseaux, colonnes à titre ondulé, bande ondulée en bas) et 36 (mot monumental, équerres, ombres, grande marque géométrique).
// ANGLES DROITS partout. Illustrations en SVG (widget html). Marques fictives ; aucune coordonnée inventée (Données de l'entreprise). Transitions de 360 ms ; une animation visible par modèle ; rien ne bouge sous « prefers-reduced-motion ».
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-illus-fitout");
const { H, dessins, racineDe, souffle, coordonnees, bouton, piedsVagues, piedsMonument } = A;
const FAM = "fitness-bienetre";
const ID = (key, label, humeur, fond, texte_, discret, accent, surface, police, titres, ligne, poids = "500") => identite({ key, label, humeur, fond, texte: texte_, discret, accent, surface, encre: fond, surEncre: texte_, police, titres, rayon: "0px", rayonBouton: "0px", ombre: "none", poids, bordure: "0px", ligne });

// ft2-398 — studio de yoga (capture 35 : version claire, lotus, vagues sauge)
const matin = ID("c398", "Crème, sauge et brique", "light", "#f6f1e7", "#23302a", "#4a5a50", "#a8481f", "#ebe3d2", "font.cabin", "font.tenor-sans", "#23302a33");
const souffleDuMatin = modeleV2({
  id: identifiantV2(398, "souffle-du-matin"), concept: "c-398-souffle-du-matin", name: "Souffle du matin", family: FAM,
  description: "Pour un studio de yoga : un grand lotus dessiné sur un soleil bas, pastilles de réseaux, colonnes à titre ondulé et chevrons, contact à icônes, bande de vagues sauge en bas. Crème, sauge et brique.",
  tags: ["yoga", "studio", "lotus", "vagues", "illustration", "sauge", "crème", "angles droits"],
  identity: matin, racine: racineDe("#b7d3b2"),
  widgets: ["html", "text", "link", "social", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const lotus = H(k, dessins.lotus({ p1: "#2f4a3e", p2: "#5d8a6c", p3: "#a9c9a6", eau: "#2f4a3e", halo: "#e9c27a" }), { width: "230px", maxWidth: "100%" });
    souffle(lotus, 6000);
    return piedsVagues(k, env, G, { mode: "lateral", fond2: "#e9e2cf", fond: "#f6f1e7", fg: "#23302a", mute: "#4a5a50", accent: "#a8481f", surAccent: "#f6f1e7", titre: "#2f4a3e", vagues: ["#e5eddd", "#cfe0c9", "#b7d3b2"], seed: 3, marque: lotus, nom: "Souffle du matin", phrase: "Un lieu calme pour respirer, bouger lentement et reprendre son souffle, à son rythme.", iconeFond: "#2f4a3e", iconeCouleur: "#f6f1e7", ordre: ["marque", "liens", "journal", "contact"], titreLiens: "Pratiques", liens: [["Hatha doux", "/catalogue"], ["Vinyasa", "/catalogue"], ["Yin et étirements", "/catalogue"], ["Respiration", "/catalogue"]], articles: [["Bien démarrer le matin", "/blog", "Conseils"], ["Préparer sa première séance", "/blog", "Débuter"]], mentions: "#1f3a2c", mentionsLiens: "#1f3a2c" });
  },
}, FAM);

// ft2-399 — salle de musculation (capture 36 : mot monumental vert volt, équerres, ombres, haltère géométrique au centre)
const fonte = ID("c399", "Graphite et vert volt", "dark", "#16171a", "#f0efe9", "#a9aaa4", "#d4ff3a", "#202226", "font.chakra-petch", "font.league-gothic", "#f0efe933", "600");
const fonteModele = modeleV2({
  id: identifiantV2(399, "fonte"), concept: "c-399-fonte", name: "Fonte", family: FAM,
  description: "Pour une salle de musculation : le nom FONTE en énormes capitales vert volt rogné, équerres de coin, ombres lumineuses, grand haltère géométrique au centre, adresse, réseaux et liens. Graphite et vert volt.",
  tags: ["musculation", "salle", "nom monumental", "haltère", "illustration", "graphite", "vert volt", "angles droits"],
  identity: fonte, racine: racineDe("#16171a"),
  widgets: ["html", "text", "link", "social", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const marque = H(k, dessins.haltere({ p1: "#d4ff3a", p2: "#f0efe9" }), { width: "100%", maxWidth: "340px" });
    souffle(marque, 3800);
    return piedsMonument(k, env, G, { fond: "#16171a", fg: "#f0efe9", mute: "#a9aaa4", accent: "#d4ff3a", titre: "#f0efe9", variante: "cote", sansRetour: true, alignDroite: false, mot: "FONTE", rogne: false, taille: [110, 200], poids: "400", motCouleur: "#d4ff3a", equerre: "#d4ff3a", ombre: { col: "#d4ff3a", op: 0.4 }, ligne: "#f0efe933", iconeFond: "#d4ff3a", iconeCouleur: "#16171a", marque, liens: [["Planning des cours", "/blog"], ["Abonnements", "/faq"], ["Espace membre", "/connexion"]],
      gauche: (k2, bloc, h) => [bloc("Adresse et contact", [coordonnees(k2, { couleur: "#f0efe9", lien: "#f0efe9", survol: "#d4ff3a", focus: "#d4ff3a", taille: 16 })]), bouton(k2, "S'inscrire", "/inscription", { texte: "#16171a", fond: "#d4ff3a", survol: { backgroundColor: "#f0efe9", borderColor: "#f0efe9", color: "#16171a", transform: { y: -3 } }, focus: "#f0efe9" })] });
  },
}, FAM);

// ft2-400 — studio de pilates (capture 34 : version sombre, crêtes ondulées, anneaux dessinés à droite)
const casier = ID("c400", "Violet profond et menthe", "dark", "#2b2150", "#f4f1fb", "#c6bfe0", "#7ef0c9", "#352a63", "font.spline-sans", "font.gabarito", "#f4f1fb33", "600");
const casierSouple = modeleV2({
  id: identifiantV2(400, "casier-souple"), concept: "c-400-casier-souple", name: "Casier souple", family: FAM,
  description: "Pour un studio de pilates : anneaux entrelacés dessinés, horaires, liens à chevrons, coordonnées à icônes, pastilles de réseaux et crêtes ondulées violettes en bas. Violet profond et menthe.",
  tags: ["pilates", "studio", "anneaux", "vagues", "illustration", "violet", "menthe", "angles droits"],
  identity: casier, racine: racineDe("#4b3f89"),
  widgets: ["html", "text", "link", "social", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const an = H(k, dessins.anneaux({ p1: "#7ef0c9", p2: "#b9a8ff", p3: "#4b3f89", p4: "#f4f1fb" }), { width: "240px", maxWidth: "100%" });
    souffle(an, 7000);
    return piedsVagues(k, env, G, { mode: "deux", fond2: "#352a63", fond: "#2b2150", fg: "#f4f1fb", mute: "#c6bfe0", accent: "#7ef0c9", surAccent: "#2b2150", vagues: ["#352a63", "#3f3376", "#4b3f89"], seed: 7, crete: true, marque: an, nom: "Studio souple", phrase: "Pilates et étirements pour tous les niveaux, en petits groupes.", iconeFond: "#7ef0c9", iconeCouleur: "#2b2150", ordre: ["horaires", "liens", "contact"], poidsMarque: 3, titreLiens: "Le studio", liens: [["Cours collectifs", "/catalogue"], ["Planning", "/blog"], ["Tarifs", "/faq"], ["Nos coachs", "/catalogue"]], articles: [], mentions: "#f4f1fb", mentionsLiens: "#f4f1fb" });
  },
}, FAM);

// ft2-401 — coaching nutrition (capture 35 : clair, vignettes dessinées à la place du logo, vagues corail)
const cap = ID("c401", "Crème rosée, corail et marine", "light", "#fff4ee", "#10213b", "#4a3b44", "#c4361f", "#ffd9d2", "font.kumbh-sans", "font.kanit", "#10213b33", "600");
const capVitalite = modeleV2({
  id: identifiantV2(401, "cap-vitalite"), concept: "c-401-cap-vitalite", name: "Cap vitalité", family: FAM,
  description: "Pour un coach en nutrition : une planche de vignettes dessinées (pomme, avocat, citron, carotte), pastilles de réseaux, liens, lettre d'information, coordonnées à icônes et vagues corail en bas.",
  tags: ["coaching", "nutrition", "vignettes", "fruits", "vagues", "illustration", "corail", "marine", "angles droits"],
  identity: cap, racine: racineDe("#ff8f7c"),
  widgets: ["html", "text", "link", "social", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const v = H(k, dessins.vignettes({ f1: "#ffd9d2", f2: "#d9ecc6", f3: "#fff2a8", f4: "#ffe0b8", o1: "#e8412b", o2: "#7a4a1f", o3: "#f2c200", o4: "#f08a1c", v: "#3f7d2b" }), { width: "100%", maxWidth: "320px" });
    souffle(v, 7000);
    return piedsVagues(k, env, G, { mode: "bandeau", fond2: "#ffd9d2", fond: "#fff4ee", fg: "#10213b", mute: "#4a3b44", accent: "#c4361f", surAccent: "#ffffff", vagues: ["#ffd9d2", "#ffb7a8", "#ff8f7c"], seed: 11, marque: v, nom: "Cap vitalité", phrase: "Nutrition, recettes et suivi pour manger mieux, sans régime.", iconeFond: "#10213b", iconeCouleur: "#fff4ee", ordre: ["marque", "liens", "abo", "contact"], poidsMarque: 3.4, titreLiens: "Au menu", introAbo: "Une recette et un conseil, de temps en temps.", liens: [["Programmes", "/blog"], ["Recettes", "/blog"], ["Tarifs", "/faq"], ["Contact", "/contact"]], articles: [], mentions: "#10213b", mentionsLiens: "#10213b" });
  },
}, FAM);

// ft2-402 — spa (capture 34 : sombre, halo lumineux, pierres empilées, vagues thermales)
const rives = ID("c402", "Vert thermal et sable", "dark", "#12403f", "#f3ead8", "#bcd3cf", "#e3b66a", "#1a4f4d", "font.raleway", "font.cinzel", "#f3ead844");
const deuxRives = modeleV2({
  id: identifiantV2(402, "rive-thermale"), concept: "c-402-rive-thermale", name: "Rive thermale", family: FAM,
  description: "Pour un spa : un halo doré, des pierres empilées, de la vapeur et des rides dessinés, pastilles de réseaux, colonnes à titre ondulé, horaires, lettre d'information et vagues thermales en bas.",
  tags: ["spa", "massage", "pierres", "halo", "vagues", "illustration", "vert thermal", "sable", "angles droits"],
  identity: rives, racine: racineDe("#25736f"),
  widgets: ["html", "text", "link", "social", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const p = H(k, dessins.pierres({ p1: "#e3b66a", p2: "#c9a05a", p3: "#f3ead8", eau: "#f3ead8", halo: "#e3b66a", vap: "#f3ead8" }), { width: "280px", maxWidth: "100%" });
    souffle(p, 6500);
    return piedsVagues(k, env, G, { mode: "centre", fond: "#12403f", fg: "#f3ead8", mute: "#bcd3cf", accent: "#e3b66a", surAccent: "#12403f", vagues: ["#195553", "#1f6663", "#25736f"], seed: 19, marque: p, nom: "Rive thermale", phrase: "Soins du corps, massages et moments de détente : un lieu pour ralentir.", iconeFond: "#f3ead8", iconeCouleur: "#12403f", ordre: ["marque", "liens", "horaires"], titreLiens: "Le spa", introAbo: "Offres de saison, de temps en temps.", liens: [["Nos soins", "/catalogue"], ["Cartes cadeaux", "/catalogue"], ["Questions fréquentes", "/faq"], ["Réserver", "/contact"]], articles: [], mentions: "#f3ead8", mentionsLiens: "#f3ead8" });
  },
}, FAM);

// ft2-403 — club de boxe (capture 36 : mot ROUND pleine largeur sur aplat magenta, gant sur éclat de rayons)
const round = ID("c403", "Magenta vif et noir", "dark", "#c4005f", "#ffffff", "#ffe3f0", "#0d0d0f", "#a8004f", "font.gabarito", "font.bowlby-one", "#ffffff55", "700");
const dernierRound = modeleV2({
  id: identifiantV2(403, "dernier-round"), concept: "c-403-dernier-round", name: "Dernier round", family: FAM,
  description: "Pour un club de boxe : le mot ROUND en énormes capitales blanches sur magenta, équerres de coin, ombres noires, grand gant de boxe sur un éclat de rayons, horaires et coordonnées, réseaux et liens.",
  tags: ["boxe", "club", "gant", "illustration", "mot monumental", "magenta", "noir", "angles droits"],
  identity: round, racine: racineDe("#c4005f"),
  widgets: ["html", "text", "link", "social", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const marque = H(k, dessins.gant({ p1: "#ffffff", p2: "#0d0d0f", p3: "#c4005f", ray: "#ffffff" }), { width: "100%", maxWidth: "280px" });
    souffle(marque, 3600);
    return piedsMonument(k, env, G, { fond: "#c4005f", fg: "#ffffff", mute: "#ffe3f0", accent: "#0d0d0f", titre: "#ffffff", mot: "ROUND", rogne: false, taille: [60, 190], poids: "400", suivi: "0", motCouleur: "#ffffff", equerre: "#0d0d0f", ombre: { col: "#0d0d0f", op: 0.5 }, ligne: "#ffffff66", iconeFond: "#0d0d0f", iconeCouleur: "#ffffff", marque, centre: "droite", sansOmbre: true, sansEquerre: true, sansLiens: true, sansRetour: true, fond2: "#a8004f", cta: ["Essayer une séance", "/inscription", "#c4005f", "Boxe, cardio et préparation physique : venez essayer, on s'occupe du reste."], liens: [["Les disciplines", "/catalogue"], ["Planning", "/blog"], ["Tarifs", "/faq"], ["Espace membre", "/connexion"]],
      gauche: (k2, bloc, h) => [bloc("Horaires", [h.horaires(k2, { couleur: "#ffffff", taille: 16 })]), bloc("Nous trouver", [coordonnees(k2, { couleur: "#ffffff", lien: "#ffffff", survol: "#0d0d0f", focus: "#0d0d0f", taille: 16 })])] });
  },
}, FAM);

module.exports = { key: FAM, label: "Fitness, yoga et bien-être", target: 6, built: true,
  description: "Pieds standard, angles droits, avec de vraies illustrations : studio de yoga, salle de musculation, pilates, coaching nutrition, spa, club de boxe.",
  models: [souffleDuMatin, fonteModele, casierSouple, capVitalite, deuxRives, dernierRound] };
