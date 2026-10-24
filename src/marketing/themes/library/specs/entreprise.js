// Entreprises et services professionnels (12 thèmes). Chaque fiche : métadonnées, jetons, ADN de mise en page, visuels, menu, pages (blocs [variante, paramètres]).
// Tous les textes sont des textes de DÉMONSTRATION (entreprises, personnes et coordonnées fictives), remplaçables dans l'éditeur.
module.exports = [
  {
    key: "meridien", name: "Méridien", category: "entreprise", tags: ["classique", "editorial"], siteType: "Cabinet de conseil", featured: true,
    description: "Cabinet de conseil sobre : grands titres serif, bandeau en deux colonnes, chiffres clés et équipe.",
    brand: "Cabinet Méridien", tokens: { colors: { primary: "#1f3a5f", secondary: "#0e1f36", accent: "#c8963e", background: "#fbfaf7", surface: "#ffffff", text: "#1b2230", muted: "#586174" }, fonts: { heading: "font.playfair-display", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "meridien", motifs: ["arches", "skyline", "topo"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Conseil en stratégie et organisation pour les dirigeants de PME.", cols: [["Cabinet", "À propos", "Expertises", "Équipe"], ["Ressources", "Actualités", "Contact", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["À propos", "/a-propos"], ["Actualités", "/actualites"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "12 rue de la Paix, 75002 Paris", phone: "01 23 45 67 89", email: "contact@meridien.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Stratégie et organisation pour dirigeants de PME." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Conseil en stratégie", title: "Décider mieux, avancer plus vite.", sub: "Nous accompagnons les dirigeants de PME dans leurs choix de croissance, d'organisation et de transformation.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Nos expertises", "/expertises"], image: "hero" }],
        ["proof:logos", { title: "Ils nous font confiance (clients fictifs)", items: ["Aurélia", "Norbert & Fils", "Bellevue", "Sylvania", "Taurus"] }],
        ["feat:cards", { eyebrow: "Expertises", title: "Trois métiers, une même exigence", items: [{ icon: "trendingUp", t: "Stratégie", x: "Positionnement, plan de croissance et arbitrages d'investissement." }, { icon: "users", t: "Organisation", x: "Gouvernance, pilotage et conduite du changement." }, { icon: "briefcase", t: "Transformation", x: "Digitalisation des processus et accompagnement des équipes." }] }],
        ["proof:stats", { items: [["25 ans", "d'expérience cumulée"], ["180", "missions menées"], ["94 %", "de clients accompagnés sur la durée"]] }],
        ["proof:quotes", { eyebrow: "Témoignages", title: "Ce que disent nos clients", items: [{ q: "Une équipe rigoureuse, qui challenge sans juger.", n: "Claire D.", r: "Dirigeante, client fictif" }, { q: "Un plan d'action clair dès la deuxième semaine.", n: "Marc L.", r: "Directeur général, client fictif" }, { q: "Un vrai partenaire de long terme.", n: "Inès B.", r: "Présidente, cliente fictive" }] }],
        ["cta:band", { title: "Parlons de votre prochain cap.", sub: "Un premier échange de 30 minutes, sans engagement.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "expertises", name: "Expertises", blocks: [
        ["misc:pagehead", { title: "Nos expertises", sub: "Des missions courtes, des livrables concrets, un suivi dans la durée." }],
        ["feat:rows", { title: "Ce que nous faisons", items: [{ t: "Stratégie de croissance", x: "Analyse de marché, positionnement, trajectoire financière et feuille de route sur trois ans." }, { t: "Pilotage et gouvernance", x: "Tableaux de bord, rituels de décision et organisation des comités." }, { t: "Conduite du changement", x: "Communication interne, formation des managers, suivi de l'adoption." }, { t: "Transformation numérique", x: "Cartographie des processus, choix d'outils, déploiement progressif." }] }],
        ["feat:steps", { eyebrow: "Méthode", title: "Comment se déroule une mission", items: [{ t: "Cadrage", x: "Objectifs, périmètre et indicateurs de réussite." }, { t: "Diagnostic", x: "Entretiens, données, restitution partagée." }, { t: "Plan d'action", x: "Priorités, responsables, calendrier." }, { t: "Accompagnement", x: "Suivi mensuel et ajustements." }] }],
        ["cta:split", { title: "Une question sur nos expertises ?", sub: "Écrivez-nous : nous répondons sous un jour ouvré.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "À propos du cabinet" }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Un cabinet indépendant depuis 1999", paras: ["Fondé par deux anciens dirigeants, le cabinet a toujours privilégié des équipes resserrées et des missions à forte valeur ajoutée.", "Nous travaillons en binôme avec la direction : nos recommandations sont écrites pour être appliquées, pas pour rester dans un tiroir."], image: "portrait-1" }],
        ["proof:team", { eyebrow: "Équipe", title: "Les associés", items: [{ n: "Hélène Marchand", r: "Associée, stratégie" }, { n: "Paul Verdier", r: "Associé, organisation" }, { n: "Sonia Aït", r: "Directrice de mission" }, { n: "Thomas Reyes", r: "Consultant senior" }] }],
        ["feat:numbered", { title: "Nos engagements", items: [{ t: "Indépendance", x: "Aucun lien commercial avec des éditeurs ou des prestataires." }, { t: "Clarté", x: "Des livrables courts, lisibles, utilisables le jour même." }, { t: "Confidentialité", x: "Un cadre strict pour toutes vos données." }] }],
      ] },
      { key: "actualites", name: "Actualités", blocks: [
        ["misc:pagehead", { title: "Actualités et analyses" }],
        ["misc:posts", { title: "Derniers articles", count: 6 }],
        ["misc:search", { title: "Rechercher un article" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Nous vous répondons sous un jour ouvré." }],
        ["contact:info", { title: "Parlons de votre projet", cta: ["Prendre rendez-vous", "/contact"] }],
        ["contact:map", { mapAddress: "12 rue de la Paix, 75002 Paris" }],
      ] },
    ],
  },
];
