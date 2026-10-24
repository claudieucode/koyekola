// Blogs, magazines et publications (8 thèmes). Textes de DÉMONSTRATION : titres, rédactions, personnes et coordonnées fictifs.
const Q = (q, n, r) => ({ q, n, r });
module.exports = [
  // 1. Magazine d'actualité locale (thème historique)
  {
    key: "editorial", name: "Éditorial", category: "magazine", tags: ["editorial", "classique"], siteType: "Magazine d'actualité locale", featured: true,
    description: "Mise en page de presse : fond blanc, bandeau de journal, très grands titres serif, angles francs et filets fins. Pensé pour un magazine d'actualité locale.",
    brand: "Le Courrier des Vallées",
    tokens: { colors: { primary: "#9f1239", secondary: "#111827", accent: "#1d4ed8", background: "#ffffff", surface: "#f8fafc", text: "#111827", muted: "#4b5563" }, fonts: { heading: "font.cormorant-garamond", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d1d5db" }, type: { h1: { size: 72, weight: 700, lineHeight: 1, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "courrier-vallees", motifs: ["halftone", "plates", "skyline"] },
    head: ["head:masthead", { dateline: "Édition du week-end · Hebdomadaire local" }], foot: ["foot:columns", { about: "Hebdomadaire d'information locale : vie municipale, économie, culture et sport de la vallée.", cols: [["Le journal", "Rubriques", "La rédaction", "Abonnement"], ["Pratique", "Contact", "Annonces légales", "Mentions"]] }],
    menu: [["À la une", "/"], ["Rubriques", "/rubriques"], ["Un article", "/article"], ["La rédaction", "/redaction"], ["S'abonner", "/abonnement"]], cta: ["S'abonner", "/abonnement"],
    contact: { address: "8 place du Marché, 38000 Grenoble", phone: "04 76 00 12 34", email: "redaction@courrier-vallees.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "L'information de proximité, chaque semaine." },
    pages: [
      { key: "accueil", name: "À la une", blocks: [
        ["hero:editorial", { kicker: "Édition n° 412", title: "Le nouveau pont ouvre enfin : la vallée respire", sub: "Après quatre ans de travaux, le franchissement de l'Isère rouvre à la circulation. Reportage sur le chantier, ses retards et ses riverains.", cta: ["Lire le reportage", "/article"], image: "hero" }],
        ["misc:posts", { title: "Les derniers articles", count: 6, layout: "grid" }],
        ["feat:strips", { eyebrow: "Rubriques", title: "Toute l'actualité par thème", items: [{ t: "Vie municipale", x: "Conseils, budgets, urbanisme : ce qui se décide près de chez vous." }, { t: "Économie et emploi", x: "Commerces, artisans, entreprises qui recrutent dans la vallée." }, { t: "Culture et sorties", x: "Concerts, expositions, festivals et marchés de la semaine." }, { t: "Sport amateur", x: "Résultats des clubs, portraits de bénévoles, calendrier des matchs." }] }],
        ["proof:statsbar", { items: [["12 000", "lecteurs chaque semaine"], ["38", "communes couvertes"], ["1961", "année de fondation"]] }],
        ["proof:big", { items: [{ q: "Un journal qui prend le temps de vérifier avant de publier.", n: "Lectrice abonnée", r: "témoignage fictif" }] }],
        ["cta:split", { title: "Soutenez la presse de proximité", sub: "Abonnement numérique et papier, résiliable à tout moment.", cta: ["Voir les abonnements", "/abonnement"] }],
      ] },
      { key: "rubriques", name: "Rubriques", blocks: [
        ["misc:pagehead", { title: "Les rubriques", sub: "Choisissez votre angle de lecture." }],
        ["feat:rows", { title: "Nos rubriques", items: [{ t: "Politique locale", x: "Comptes rendus de conseils municipaux, enquêtes et tribunes." }, { t: "Société", x: "Écoles, santé, logement : les sujets du quotidien." }, { t: "Environnement", x: "Rivières, forêts, énergie : la vallée face au climat." }, { t: "Faits divers et justice", x: "Chroniques d'audience et rappels de prévention." }, { t: "Loisirs", x: "Randonnées, marchés, fêtes de village." }] }],
        ["misc:posts", { title: "À lire en ce moment", count: 6, layout: "list" }],
        ["misc:search", { title: "Chercher dans les archives" }],
      ] },
      { key: "article", name: "Article", blocks: [
        ["misc:pagehead", { title: "Reportage", sub: "Société · 6 min de lecture" }],
        ["misc:article", { tag: "Reportage", title: "Le pont rouvre : quatre ans de chantier racontés", meta: "Par Camille Roussel · mis à jour mardi à 8 h 15", paras: ["Ce matin, la première voiture a franchi le nouvel ouvrage sous les applaudissements d'une cinquantaine d'habitants massés sur la berge. Le chantier, prévu pour dix-huit mois, en aura finalement duré quarante-huit.", "Les commerçants du quartier Saint-Roch parlent d'une chute de fréquentation de près d'un tiers pendant les travaux. La mairie promet un dispositif d'accompagnement pour les boutiques les plus touchées.", "Reste la question de la circulation des poids lourds, que la commune souhaite limiter aux heures creuses dès le mois prochain."], quote: "On a presque oublié à quoi ressemblait la rive d'en face.", by: "Une riveraine, propos recueillis sur place" }],
        ["cta:band", { title: "Vous avez une information à nous confier ?", sub: "Écrivez à la rédaction : nous protégeons nos sources.", cta: ["Contacter la rédaction", "/abonnement"] }],
      ] },
      { key: "redaction", name: "La rédaction", blocks: [
        ["misc:pagehead", { title: "La rédaction", sub: "Une équipe de onze journalistes et correspondants." }],
        ["misc:story", { eyebrow: "Notre ligne", title: "Informer sans bruit, vérifier sans relâche", paras: ["Le Courrier des Vallées est un hebdomadaire indépendant, détenu par une société de lecteurs. Nos enquêtes sont financées par nos abonnés, jamais par nos annonceurs.", "Chaque information est recoupée par deux sources avant publication, et les corrections sont signalées en tête d'article."], image: "portrait-3" }],
        ["proof:team", { title: "Les signatures", items: [{ n: "Camille Roussel", r: "Rédactrice en chef" }, { n: "Yanis Berthod", r: "Politique locale" }, { n: "Mathilde Faure", r: "Société et santé" }, { n: "Louis Cheval", r: "Sports et loisirs" }] }],
      ] },
      { key: "abonnement", name: "Abonnement", blocks: [
        ["misc:pagehead", { title: "Abonnement et contact", sub: "Papier, numérique ou les deux." }],
        ["price:tiers", { title: "Nos formules (exemples)", items: [{ t: "Numérique", price: "9 €", period: "/mois", f: ["Tous les articles", "Édition PDF du jeudi", "Archives depuis 2005"], cta: "Nous contacter", url: "/abonnement" }, { t: "Papier + numérique", price: "16 €", period: "/mois", hl: true, f: ["Livraison à domicile", "Accès numérique complet", "Hors-séries inclus"], cta: "Nous contacter", url: "/abonnement" }, { t: "Soutien", price: "30 €", period: "/mois", f: ["Formule complète", "Invitation aux rencontres lecteurs", "Nom au générique annuel"], cta: "Nous contacter", url: "/abonnement" }] }],
        ["contact:info", { title: "Nous écrire", formTitle: "Un message à la rédaction", formIntro: "Abonnement, information ou correction : nous lisons tout.", cta: ["Envoyer", "/abonnement"] }],
      ] },
    ],
  },

  // 2. Magazine culturel
  {
    key: "fresque-culture", name: "Fresque", category: "magazine", tags: ["editorial", "chaleureux"], siteType: "Magazine culturel",
    description: "Magazine culturel au papier chaud : vermillon et encre prune, titres élégants en capitales fines, grands collages d'images et mosaïques d'articles.",
    brand: "Fresque, le magazine des arts",
    tokens: { colors: { primary: "#b8321f", secondary: "#2a1a2e", accent: "#d9a441", background: "#f6f1ea", surface: "#fffaf3", text: "#241a26", muted: "#5d5160" }, fonts: { heading: "font.marcellus", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.08, letterSpacing: 0.01 }, h2: { size: 38, weight: 400, lineHeight: 1.15, letterSpacing: 0.01, transform: "uppercase" } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "fresque", motifs: ["arches", "ribbons", "halftone"] },
    head: ["head:center", {}], foot: ["foot:newsletter", { title: "La lettre de Fresque", sub: "Chaque vendredi, cinq recommandations expos, scène et livres.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Dossiers", "/dossiers"], ["Agenda", "/agenda"], ["À propos", "/a-propos"], ["Contact", "/contact"]], cta: ["Nous écrire", "/contact"],
    contact: { address: "27 rue des Teinturiers, 69002 Lyon", phone: "04 72 00 45 67", email: "redaction@fresque.example", hours: "Du mardi au vendredi, 10 h – 17 h", tagline: "Voir, écouter, lire autrement." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Numéro de l'automne", title: "Les arts vus de plus près", sub: "Expositions, scène, cinéma, livres : des reportages et des entretiens au long cours sur ce qui fait la vie culturelle.", cta: ["Lire le dossier", "/dossiers"], cta2: ["L'agenda", "/agenda"] }],
        ["feat:alt", { eyebrow: "À la une", title: "Trois histoires du moment", items: [{ t: "La Manufacture rouvre ses ateliers", x: "Visite en avant-première de l'ancienne usine de soie devenue lieu de création.", link: ["Lire", "/dossiers"] }, { t: "Dix ans de théâtre en plein air", x: "Retour sur un festival né dans une carrière de pierre.", link: ["Lire", "/dossiers"] }, { t: "Portrait d'une relieuse", x: "Chez Maëlle Garnier, le livre est d'abord un objet.", link: ["Lire", "/dossiers"] }] }],
        ["gal:masonry", { title: "Dans l'objectif", items: [{ t: "Vernissage" }, { t: "Répétition générale" }, { t: "Atelier de gravure" }, { t: "Nuit des musées" }, { t: "Concert de chambre" }, { t: "Bibliothèque" }] }],
        ["misc:posts", { title: "Derniers articles", count: 4, layout: "list" }],
        ["proof:big", { items: [{ q: "Le seul magazine qui me donne envie de sortir un mardi soir.", n: "Lecteur abonné", r: "témoignage fictif" }] }],
        ["cta:image", { title: "Ne manquez aucun numéro", sub: "Quatre numéros par an, livrés chez vous.", cta: ["S'abonner", "/contact"] }],
      ] },
      { key: "dossiers", name: "Dossiers", blocks: [
        ["misc:pagehead", { title: "Dossiers", sub: "De longs formats, pour prendre le temps." }],
        ["feat:rows", { title: "Les dossiers en cours", items: [{ t: "Habiter la friche", x: "Comment les lieux industriels deviennent des scènes, des galeries, des cantines." }, { t: "La voix des traducteurs", x: "Entretiens avec huit traductrices et traducteurs de littérature." }, { t: "Photographier la nuit", x: "Une enquête sur la pratique contemporaine de l'image nocturne." }] }],
        ["misc:posts", { title: "Tous nos articles", count: 6, layout: "grid" }],
        ["misc:search", { title: "Rechercher un artiste, un lieu" }],
      ] },
      { key: "agenda", name: "Agenda", blocks: [
        ["misc:pagehead", { title: "L'agenda", sub: "La sélection de la rédaction." }],
        ["misc:schedule", { title: "Cette semaine", items: [{ d: "Mardi · 19 h", t: "Vernissage « Lumières d'hiver »", x: "Galerie Passerelle, entrée libre." }, { d: "Jeudi · 20 h 30", t: "Quatuor à cordes", x: "Auditorium des Cordeliers, à partir de 12 €." }, { d: "Samedi · 15 h", t: "Visite commentée de la Manufacture", x: "Sur inscription, groupes de 15 personnes." }, { d: "Dimanche · 11 h", t: "Brunch littéraire", x: "Librairie des Quais, lecture et rencontre." }] }],
        ["cta:card", { title: "Un événement à signaler ?", sub: "Envoyez-nous votre programmation trois semaines à l'avance.", cta: ["Écrire à la rédaction", "/contact"] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "À propos de Fresque" }],
        ["misc:story", { eyebrow: "Depuis 2014", title: "Un magazine fait par des passionnés", paras: ["Fresque est né autour d'une table, entre un graphiste, une critique d'art et une libraire. Le magazine reste indépendant et publie des textes longs, illustrés par des artistes de la région.", "Chaque numéro est imprimé sur papier recyclé par une imprimerie voisine."], image: "portrait-5" }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Inès Marchetti", r: "Direction éditoriale" }, { n: "Théo Lacombe", r: "Direction artistique" }, { n: "Salomé Ricard", r: "Arts visuels" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Propositions de sujets, partenariats, abonnements." }],
        ["contact:cards", { title: "Écrire à la rédaction" }],
        ["misc:hours", { title: "Permanence de la rédaction", rows: [["Mardi – vendredi", "10 h – 17 h"], ["Samedi", "Sur rendez-vous"], ["Dimanche – lundi", "Fermé"]] }],
      ] },
    ],
  },

  // 3. Blog de cuisine
  {
    key: "marmite-basilic", name: "Marmite & Basilic", category: "magazine", tags: ["chaleureux", "ludique"], siteType: "Blog de cuisine",
    description: "Blog de cuisine gourmand : papier crème, tomate et basilic, titres manuscrits fins, cartes de recettes et listes d'ingrédients.",
    brand: "Marmite & Basilic",
    tokens: { colors: { primary: "#b03a1a", secondary: "#3f2a1d", accent: "#4d7c0f", background: "#fff8ee", surface: "#ffffff", text: "#2b1c12", muted: "#6b5646" }, fonts: { heading: "font.amatic-sc", body: "font.lora", button: "font.lora", link: "font.lora" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 18 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 84, weight: 700, lineHeight: 0.95, letterSpacing: 0 }, h2: { size: 54, weight: 700, lineHeight: 1, letterSpacing: 0 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "marmite", motifs: ["botanical", "blobs", "objects"] },
    head: ["head:topbar", { info: "Recettes de saison · une nouvelle recette chaque dimanche", note: "Abonnez-vous à la lettre" }], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Recettes", "/recettes"], ["La recette du jour", "/recette"], ["Mon histoire", "/a-propos"], ["Contact", "/contact"]], cta: ["Recevoir les recettes", "/contact"],
    contact: { address: "Blog hébergé à Nantes", phone: "02 40 00 22 33", email: "bonjour@marmite-basilic.example", hours: "Réponse sous 3 jours", tagline: "La cuisine de tous les jours, sans chichis." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Cuisine de saison", title: "Mijoter, partager, recommencer", sub: "Plus de 300 recettes testées trois fois dans ma cuisine, avec des quantités claires et des astuces pour gagner du temps.", cta: ["Voir les recettes", "/recettes"], cta2: ["Mon histoire", "/a-propos"] }],
        ["feat:cards", { eyebrow: "Mes grandes familles", title: "Que mange-t-on ce soir ?", items: [{ icon: "clock", t: "En 20 minutes", x: "Poêlées, pâtes et omelettes pour les soirs pressés." }, { icon: "heart", t: "Plats mijotés", x: "Daubes, soupes épaisses et gratins du dimanche." }, { icon: "sun", t: "Cuisine d'été", x: "Salades composées, tartes fines, glaces maison." }] }],
        ["gal:cards", { title: "Les recettes à la une", items: [{ t: "Soupe de potimarron au lait de coco", x: "Prête en 30 minutes.", tag: "Végétarien" }, { t: "Pâtes aux sardines et citron", x: "Un classique du placard.", tag: "Express" }, { t: "Tarte tatin de courgettes", x: "Salée, croustillante, parfumée.", tag: "Été" }] }],
        ["feat:checks", { title: "Mes principes de cuisine", cta: ["Lire mon histoire", "/a-propos"], items: [{ t: "Des produits de saison, achetés au marché" }, { t: "Des recettes testées trois fois" }, { t: "Des quantités pour 4 personnes" }, { t: "Zéro ingrédient introuvable" }] }],
        ["misc:posts", { title: "Les dernières publications", count: 3, layout: "grid" }],
        ["cta:band", { title: "Une recette dans votre boîte mail", sub: "Chaque dimanche, une idée de saison. Désinscription en un clic.", cta: ["Je m'inscris", "/contact"] }],
      ] },
      { key: "recettes", name: "Recettes", blocks: [
        ["misc:pagehead", { title: "Toutes les recettes", sub: "Entrées, plats, desserts et conserves." }],
        ["feat:tabs", { title: "Parcourir par moment", items: [{ t: "Entrées", x: "Veloutés, tartares de légumes, feuilletés et terrines." }, { t: "Plats", x: "Gratins, currys doux, poissons au four et plats uniques." }, { t: "Desserts", x: "Crumbles, clafoutis, gâteaux au yaourt et sorbets." }] }],
        ["misc:posts", { title: "Les dernières recettes", count: 6, layout: "list" }],
        ["misc:search", { title: "Un ingrédient en tête ?" }],
      ] },
      { key: "recette", name: "La recette du jour", blocks: [
        ["misc:pagehead", { title: "Recette du dimanche", sub: "Préparation 20 min · cuisson 35 min · 4 personnes" }],
        ["misc:article", { tag: "Plat mijoté", title: "Gratin de blettes au comté", meta: "Publié le dimanche · par Élodie", paras: ["Ingrédients : 1 kg de blettes, 200 g de comté râpé, 30 cl de crème, 2 œufs, noix de muscade, sel et poivre.", "Blanchissez les cardes cinq minutes puis égouttez-les bien. Disposez-les dans un plat, nappez du mélange crème, œufs et muscade, couvrez de comté.", "Enfournez 35 minutes à 180 °C, jusqu'à ce que le dessus soit doré. Servez avec une salade verte."], quote: "Le secret : bien égoutter les blettes, sinon le gratin pleure.", by: "Élodie" }],
        ["feat:list2", { title: "Variantes", items: [{ t: "Avec des épinards" }, { t: "Sans gluten : rien à changer" }, { t: "Version végétarienne : déjà le cas" }, { t: "Pour les restes : poêlées avec un œuf" }] }],
      ] },
      { key: "a-propos", name: "Mon histoire", blocks: [
        ["misc:pagehead", { title: "Qui cuisine ici ?" }],
        ["misc:story", { eyebrow: "Moi, Élodie", title: "De la cantine à la marmite", paras: ["J'ai longtemps été cheffe de cuisine en restauration collective. Quand j'ai quitté la cantine, j'ai voulu garder le plaisir de nourrir bien, vite et sans gaspillage.", "Le blog est devenu mon carnet de recettes : tout y est cuisiné chez moi, goûté par mes voisins et ajusté jusqu'à ce que ce soit simple."], image: "portrait-8" }],
        ["feat:numbered", { title: "Le blog en chiffres (exemples)", items: [{ t: "312", x: "recettes publiées" }, { t: "3", x: "essais par recette" }, { t: "52", x: "dimanches par an" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Une question, une idée, un partenariat ?" }],
        ["contact:info", { title: "Écrivez-moi", formTitle: "Un petit mot", formIntro: "Je réponds à chaque message, souvent avec une recette.", cta: ["Envoyer", "/contact"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je republier une recette ?", x: "Vous pouvez la citer avec un lien vers l'article d'origine." }, { t: "Faites-vous des collaborations ?", x: "Oui, uniquement avec des producteurs que j'ai rencontrés." }, { t: "Comment convertir en version végétale ?", x: "Chaque recette indique les remplacements possibles en fin d'article." }] }],
      ] },
    ],
  },

  // 4. Média tech (sombre)
  {
    key: "octet-hebdo", name: "Octet Hebdo", category: "magazine", tags: ["sombre", "technique"], siteType: "Média tech",
    description: "Média technologique sombre : fond nuit, cyan électrique et vert citron, titres techniques condensés, grille de dossiers et comparatifs.",
    brand: "Octet Hebdo",
    tokens: { colors: { primary: "#22d3ee", secondary: "#070b14", accent: "#a3e635", background: "#0b1220", surface: "#131c2e", text: "#e6edf7", muted: "#a0b0c8" }, fonts: { heading: "font.titillium-web", body: "font.ibm-plex-sans", button: "font.titillium-web", link: "font.ibm-plex-sans" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#26344f" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.05, letterSpacing: -0.01 }, h2: { size: 36, weight: 700, lineHeight: 1.15, letterSpacing: 0 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "octet", motifs: ["mesh", "tiles", "rays"] },
    head: ["head:bar", {}], foot: ["foot:big", { title: "Octet Hebdo" }],
    menu: [["Accueil", "/"], ["Dossiers", "/dossiers"], ["Tests", "/tests"], ["Rédaction", "/redaction"], ["Contact", "/contact"]], cta: ["Newsletter", "/contact"],
    contact: { address: "40 quai de Valmy, 75010 Paris", phone: "01 70 00 98 76", email: "tips@octet-hebdo.example", hours: "Du lundi au vendredi, 9 h – 19 h", tagline: "L'actualité tech, sans jargon superflu." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Média tech indépendant", title: "Comprendre la tech avant qu'elle ne vous comprenne", sub: "Analyses, tests et enquêtes sur le logiciel, la sécurité, l'IA et le matériel, écrits par des ingénieurs devenus journalistes.", cta: ["Dernier dossier", "/dossiers"], cta2: ["Les tests", "/tests"], stats: [["380", "articles par an"], ["52", "newsletters"], ["9", "rédacteurs"]], angle: 135 }],
        ["feat:bento", { eyebrow: "Au sommaire", title: "Ce que vous lirez cette semaine", items: [{ t: "Enquête : le coût caché du cloud", x: "Pourquoi la facture double après la première année, et comment la maîtriser." }, { t: "Test : trois ordinateurs ultra-légers", x: "Autonomie, ventilation, clavier." }, { t: "Décodage : l'IA en entreprise", x: "Ce qui marche, ce qui échoue." }] }],
        ["misc:posts", { title: "Dernières publications", count: 5, layout: "list" }],
        ["feat:compare", { title: "Notre grille de test (exemple)", rows: [["Critère", "Portable A", "Portable B"], ["Autonomie réelle", "11 h", "8 h 30"], ["Poids", "1,2 kg", "1,6 kg"], ["Écran", "OLED", "IPS"], ["Réparabilité", "7/10", "5/10"]] }],
        ["proof:stats", { title: "Le média en chiffres (exemples)", items: [["210 000", "lecteurs mensuels"], ["96 %", "de lecteurs fidèles"], ["0", "article sponsorisé"]] }],
        ["cta:split", { title: "La newsletter du mardi", sub: "Cinq liens, un décodage, zéro spam.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "dossiers", name: "Dossiers", blocks: [
        ["misc:pagehead", { title: "Dossiers", sub: "Des enquêtes et explications au long cours." }],
        ["feat:tabs", { title: "Par thème", items: [{ t: "Sécurité", x: "Rançongiciels, mots de passe, authentification : ce qui protège vraiment." }, { t: "Intelligence artificielle", x: "Modèles, données, usages concrets et limites." }, { t: "Logiciel libre", x: "Projets, financement et gouvernance des communautés." }, { t: "Matériel", x: "Puces, batteries, réparabilité." }] }],
        ["misc:posts", { title: "Tous les dossiers", count: 6, layout: "grid" }],
      ] },
      { key: "tests", name: "Tests", blocks: [
        ["misc:pagehead", { title: "Tests et comparatifs", sub: "Protocoles publiés, résultats reproductibles." }],
        ["gal:products", { title: "Derniers produits testés (fictifs)", items: [{ t: "Ordinateur Vega 14", price: "1 190 €" }, { t: "Casque Nimbus", price: "249 €" }, { t: "Disque Arkos 2 To", price: "139 €" }, { t: "Routeur Pharos", price: "179 €" }] }],
        ["feat:steps", { eyebrow: "Protocole", title: "Comment nous testons", items: [{ t: "Achat", x: "Nous achetons le produit, sans prêt constructeur." }, { t: "Mesures", x: "Outils de mesure et scripts publiés." }, { t: "Usage", x: "Deux semaines d'utilisation réelle." }, { t: "Verdict", x: "Note détaillée et points faibles." }] }],
      ] },
      { key: "redaction", name: "Rédaction", blocks: [
        ["misc:pagehead", { title: "La rédaction" }],
        ["misc:text", { eyebrow: "Indépendance", title: "Un média financé par ses lecteurs", paras: ["Octet Hebdo ne publie ni contenu sponsorisé ni liens affiliés. Nos revenus viennent des abonnements et d'un fonds de soutien citoyen.", "Les conflits d'intérêts sont déclarés en fin d'article ; nos protocoles de test sont ouverts."] }],
        ["proof:team", { title: "Les rédacteurs", items: [{ n: "Maxime Kerloc'h", r: "Rédacteur en chef" }, { n: "Sana Benali", r: "Sécurité et vie privée" }, { n: "Paul Weiss", r: "Matériel" }, { n: "Lina Duarte", r: "IA et données" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Un tuyau, une faille, une correction ?" }],
        ["contact:info", { title: "Nous contacter", formTitle: "Message à la rédaction", formIntro: "Pour une information sensible, précisez-le : nous répondons par un canal chiffré.", cta: ["Envoyer", "/contact"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Proposez-vous des tribunes ?", x: "Oui, après lecture de notre charte et relecture éditoriale." }, { t: "Comment signaler une erreur ?", x: "Écrivez-nous : toute correction est datée et visible." }] }],
      ] },
    ],
  },

  // 5. Blog de voyage
  {
    key: "carnet-de-route", name: "Carnet de route", category: "magazine", tags: ["naturel", "audacieux"], siteType: "Blog de voyage",
    description: "Blog de voyage immersif : grandes photos plein cadre, turquoise et corail, titres épais, galeries de destinations et itinéraires détaillés.",
    brand: "Carnet de route",
    tokens: { colors: { primary: "#0e7490", secondary: "#12343b", accent: "#e76f51", background: "#f4efe6", surface: "#ffffff", text: "#1d2b2a", muted: "#4f5f5e" }, fonts: { heading: "font.kanit", body: "font.karla", button: "font.kanit", link: "font.karla" }, radius: { sm: 8, md: 14, lg: 24, button: 14, field: 10, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 64, weight: 700, lineHeight: 1.05, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "soft" }, art: { seed: "carnet-route", motifs: ["mountains", "waves", "dunes"] },
    head: ["head:float", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Destinations", "/destinations"], ["Itinéraire", "/itineraire"], ["Conseils", "/conseils"], ["Contact", "/contact"]], cta: ["Me suivre", "/contact"],
    contact: { address: "En route, quelque part", phone: "06 00 00 10 20", email: "salut@carnet-de-route.example", hours: "Réponse sous une semaine", tagline: "Voyager lentement, raconter simplement." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Voyager lentement", title: "Quarante pays, un sac à dos et beaucoup de détours", sub: "Récits, itinéraires détaillés et budgets réels de deux voyageurs en train, en bateau et à pied.", cta: ["Choisir une destination", "/destinations"], cta2: ["L'itinéraire du moment", "/itineraire"], overlay: "#0b252b88" }],
        ["gal:featured", { title: "Destinations à la une", items: [{ t: "Le Portugal du nord à vélo", x: "Huit jours entre Porto et le Minho." }, { t: "Trois semaines en Géorgie" }, { t: "Tromsø en hiver" }, { t: "Madère sans voiture" }] }],
        ["feat:alt", { eyebrow: "Dernier récit", title: "Au plus près des gens", items: [{ t: "Dormir chez l'habitant en Anatolie", x: "Six nuits, six familles, et une cuisine qu'on n'oublie pas.", link: ["Lire le récit", "/destinations"] }, { t: "Le train de nuit pour Vienne", x: "Notre guide pratique : horaires, couchettes, repas.", link: ["Lire le guide", "/conseils"] }] }],
        ["proof:statsbar", { items: [["41", "pays traversés"], ["7 ans", "de route"], ["260", "récits publiés"]] }],
        ["gal:carousel", { title: "Instantanés de la semaine", items: [{ t: "Marché de Tbilissi" }, { t: "Fjord au lever du jour" }, { t: "Gare de Lisbonne" }, { t: "Col à 2 400 m" }] }],
        ["cta:image", { title: "Les itinéraires dans votre boîte mail", sub: "Un voyage détaillé par mois, avec budgets et cartes.", cta: ["Je m'abonne", "/contact"] }],
      ] },
      { key: "destinations", name: "Destinations", blocks: [
        ["misc:pagehead", { title: "Destinations", sub: "Classées par continent et par saison." }],
        ["gal:cards", { title: "Les destinations phares", items: [{ t: "Géorgie", x: "Montagnes, vin et hospitalité.", tag: "Caucase" }, { t: "Portugal", x: "Du Minho à l'Alentejo.", tag: "Europe" }, { t: "Norvège arctique", x: "Aurores et fjords.", tag: "Hiver" }] }],
        ["misc:posts", { title: "Derniers récits", count: 6, layout: "grid" }],
        ["misc:search", { title: "Chercher un pays" }],
      ] },
      { key: "itineraire", name: "Itinéraire", blocks: [
        ["misc:pagehead", { title: "Itinéraire du moment", sub: "Georgie, 21 jours, environ 1 400 € par personne (exemple)" }],
        ["feat:steps", { eyebrow: "Jour par jour", title: "Le parcours", items: [{ d: "Jours 1–4", t: "Tbilissi", x: "Vieille ville, bains soufrés et marchés." }, { d: "Jours 5–9", t: "Kakhétie", x: "Caves traditionnelles et monastères." }, { d: "Jours 10–16", t: "Svanétie", x: "Randonnées entre villages à tours médiévales." }, { d: "Jours 17–21", t: "Batoumi", x: "Mer Noire et jardin botanique." }] }],
        ["feat:pricelist", { title: "Budget indicatif (exemple)", items: [{ t: "Hébergement", price: "420 €", x: "Chez l'habitant et petites pensions" }, { t: "Transports", price: "310 €", x: "Marchroutkas, trains, un transfert en 4×4" }, { t: "Repas", price: "380 €", x: "Cuisine locale" }, { t: "Activités", price: "290 €", x: "Guides de montagne, entrées" }] }],
      ] },
      { key: "conseils", name: "Conseils", blocks: [
        ["misc:pagehead", { title: "Conseils de voyage" }],
        ["feat:icons", { title: "Préparer son départ", items: [{ icon: "briefcase", t: "Faire son sac", x: "Notre liste de 32 objets pour partir 3 semaines avec 8 kg." }, { icon: "coin", t: "Gérer son budget", x: "Cartes, monnaie locale, frais cachés." }, { icon: "shield", t: "Santé et sécurité", x: "Vaccins, assurance, bons réflexes." }, { icon: "mapPin", t: "S'orienter", x: "Cartes hors ligne et applications utiles." }] }],
        ["feat:accordion", { title: "Questions de lecteurs", items: [{ t: "Comment voyager en train de nuit ?", x: "Réservez deux mois à l'avance et choisissez une couchette en bas." }, { t: "Voyager seule : est-ce sûr ?", x: "Oui, avec quelques précautions, détaillées dans notre guide." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Écrivez-nous" }],
        ["misc:quote", { text: "Le plus beau voyage est celui qu'on raconte à ceux qui n'y étaient pas.", by: "Notre devise" }],
      ] },
    ],
  },

  // 6. Newsletter indépendante
  {
    key: "lettre-du-jeudi", name: "Lettre du jeudi", category: "magazine", tags: ["minimaliste", "editorial"], siteType: "Newsletter indépendante",
    description: "Newsletter indépendante minimaliste : colonne de lecture étroite, texte serif, noir encre et signal ambre, formules d'abonnement lisibles.",
    brand: "La Lettre du jeudi",
    tokens: { colors: { primary: "#1f2937", secondary: "#111827", accent: "#d97706", background: "#fdfdfb", surface: "#f5f5f0", text: "#1a1a1a", muted: "#555b65" }, fonts: { heading: "font.inter", body: "font.source-serif-4", button: "font.inter", link: "font.source-serif-4" }, radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#e3e3dc" }, type: { h1: { size: 52, weight: 800, lineHeight: 1.08, letterSpacing: -0.03 }, body: { size: 19 } } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "lettre-jeudi", motifs: ["tiles", "halftone"] },
    head: ["head:minimal", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Archives", "/archives"], ["Formules", "/formules"], ["À propos", "/a-propos"], ["Contact", "/contact"]], cta: ["S'abonner", "/formules"],
    contact: { address: "Lettre envoyée depuis Bordeaux", phone: "05 56 00 41 41", email: "bonjour@lettre-du-jeudi.example", hours: "Envoi chaque jeudi à 7 h 30", tagline: "Un sujet, bien traité, chaque semaine." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Chaque jeudi, 7 h 30", title: "Un sujet. Une heure de réflexion offerte en dix minutes.", sub: "Une newsletter indépendante sur l'économie du quotidien, écrite par un ancien statisticien. Sans publicité, sans pop-up.", cta: ["Je m'abonne gratuitement", "/formules"], cta2: ["Lire un numéro", "/archives"] }],
        ["proof:stats", { items: [["14 800", "abonnés (exemple)"], ["52", "numéros par an"], ["9 min", "de lecture moyenne"]] }],
        ["misc:posts", { title: "Derniers numéros", count: 4, layout: "list" }],
        ["proof:quotes", { title: "Ce qu'en disent les lecteurs", items: [Q("Le seul mail que j'ouvre toujours.", "Nadia H.", "lectrice fictive"), Q("Clair, honnête, jamais condescendant.", "Gaëtan P.", "lecteur fictif"), Q("J'ai enfin compris l'inflation.", "Rose T.", "lectrice fictive")] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "C'est vraiment gratuit ?", x: "Le numéro du jeudi est gratuit ; une formule soutien donne accès aux archives et aux enquêtes." }, { t: "Puis-je me désabonner ?", x: "En un clic, depuis n'importe quel numéro." }, { t: "Qui écrit ?", x: "Un auteur, parfois rejoint par des invités." }] }],
        ["cta:card", { title: "Rejoignez la lecture du jeudi", sub: "Gratuit, résiliable en un clic.", cta: ["S'abonner", "/formules"] }],
      ] },
      { key: "archives", name: "Archives", blocks: [
        ["misc:pagehead", { title: "Archives", sub: "Tous les numéros depuis le premier." }],
        ["misc:posts", { title: "Les numéros", count: 8, layout: "list" }],
        ["misc:search", { title: "Chercher un sujet" }],
      ] },
      { key: "formules", name: "Formules", blocks: [
        ["misc:pagehead", { title: "S'abonner", sub: "Deux façons de lire, une seule exigence." }],
        ["price:tiers", { title: "Choisissez votre formule (exemples)", items: [{ t: "Lecteur", price: "0 €", period: "", f: ["Le numéro du jeudi", "Un hors-série par trimestre"], cta: "Je m'inscris", url: "/contact" }, { t: "Soutien", price: "6 €", period: "/mois", hl: true, f: ["Toutes les archives", "Enquêtes mensuelles", "Réponses aux questions des abonnés"], cta: "Je m'inscris", url: "/contact" }] }],
        ["feat:list2", { title: "Ce que couvre l'abonnement soutien", items: [{ t: "Archives complètes" }, { t: "Enquêtes longues" }, { t: "Questions-réponses mensuelles" }, { t: "Aucune publicité" }] }],
        ["cta:band", { title: "Le doute ? Lisez d'abord.", sub: "Le premier mois de soutien est offert, sur simple demande.", cta: ["Demander l'essai", "/contact"] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "À propos" }],
        ["misc:story", { eyebrow: "L'auteur", title: "Pourquoi cette lettre", paras: ["J'ai passé quinze ans dans un institut de statistiques à produire des chiffres que presque personne ne lisait. La Lettre du jeudi est ma façon de les rendre utiles.", "Chaque numéro tient en une page : un fait, un graphique, trois enseignements."], image: "portrait-12" }],
        ["feat:numbered", { title: "Mes règles", items: [{ t: "Citer", x: "Chaque chiffre est sourcé." }, { t: "Corriger", x: "Toute erreur est signalée au numéro suivant." }, { t: "Rester libre", x: "Aucun annonceur, aucun sponsor." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Répondre à la lettre", formTitle: "Votre message", formIntro: "Une question, une critique, une idée de sujet : écrivez.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Rythme de publication", rows: [["Jeudi", "Numéro hebdomadaire, 7 h 30"], ["Premier dimanche du mois", "Hors-série"], ["Août", "Pause estivale"]] }],
      ] },
    ],
  },

  // 7. Revue littéraire
  {
    key: "encre-et-marge", name: "Encre & Marge", category: "magazine", tags: ["classique", "luxe"], siteType: "Revue littéraire",
    description: "Revue littéraire sobre : parchemin, bordeaux profond, doubles serifs aux capitales fines, mises en page centrées autour du texte et des citations.",
    brand: "Encre & Marge",
    tokens: { colors: { primary: "#5b2a3c", secondary: "#1e1b18", accent: "#8a6d3b", background: "#f3ecdf", surface: "#fbf7ef", text: "#23201b", muted: "#5b5348" }, fonts: { heading: "font.cormorant-garamond", body: "font.eb-garamond", button: "font.eb-garamond", link: "font.eb-garamond" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d8cdb8" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.1, letterSpacing: 0 }, body: { size: 19 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "encre-marge", motifs: ["plates", "arches", "ribbons"] },
    head: ["head:split", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Sommaire", "/sommaire"], ["Auteurs", "/auteurs"], ["Soumettre un texte", "/soumettre"], ["Contact", "/contact"]], cta: ["S'abonner", "/contact"],
    contact: { address: "5 rue des Écoles, 35000 Rennes", phone: "02 99 00 33 21", email: "revue@encre-et-marge.example", hours: "Du mardi au jeudi, 14 h – 18 h", tagline: "Revue de littérature contemporaine et de critique." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Numéro 27 · Automne", title: "Écrire, c'est laisser des marges", sub: "Une revue semestrielle de nouvelles, de poèmes et de critique, publiée à Rennes depuis 2011.", cta: ["Lire le sommaire", "/sommaire"], cta2: ["Soumettre un texte", "/soumettre"] }],
        ["misc:quote", { text: "La phrase juste est celle qui s'oublie pour laisser entrer le monde.", by: "Extrait de l'éditorial du n° 27" }],
        ["feat:rows", { eyebrow: "Au sommaire", title: "Dans ce numéro", items: [{ t: "Le Grand Jeu des mots", x: "Nouvelle inédite de Clémence Aubry." }, { t: "Poèmes d'estuaire", x: "Cycle de dix poèmes de Rémi Vasseur." }, { t: "Lire Bernanos aujourd'hui", x: "Essai critique, par Élise Montagné." }, { t: "Entretien avec un traducteur", x: "Du norvégien au français, une langue en passage." }] }],
        ["misc:story", { eyebrow: "La revue", title: "Une maison de papier", paras: ["Encre & Marge est imprimée à mille exemplaires, cousue à la main, diffusée en librairies indépendantes et par abonnement.", "Nous lisons chaque manuscrit reçu et répondons à toutes les propositions."], image: "portrait-6" }],
        ["proof:big", { items: [{ q: "Une revue qui laisse à la lecture le temps d'exister.", n: "Libraire partenaire", r: "témoignage fictif" }] }],
        ["cta:card", { title: "Deux numéros par an, chez vous", sub: "Abonnement annuel, port compris.", cta: ["S'abonner", "/contact"] }],
      ] },
      { key: "sommaire", name: "Sommaire", blocks: [
        ["misc:pagehead", { title: "Sommaire du n° 27" }],
        ["feat:numbered", { title: "Trois temps", items: [{ t: "Fictions", x: "Quatre nouvelles inédites, dont une traduction." }, { t: "Poésie", x: "Un cycle et cinq pièces brèves." }, { t: "Critique", x: "Essais, notes de lecture, entretien." }] }],
        ["misc:posts", { title: "Textes disponibles en ligne", count: 6, layout: "list" }],
        ["misc:search", { title: "Chercher un auteur ou un titre" }],
      ] },
      { key: "auteurs", name: "Auteurs", blocks: [
        ["misc:pagehead", { title: "Auteurs et autrices", sub: "Voix publiées dans les derniers numéros." }],
        ["proof:team", { title: "Au sommaire récemment", items: [{ n: "Clémence Aubry", r: "Nouvelliste" }, { n: "Rémi Vasseur", r: "Poète" }, { n: "Élise Montagné", r: "Critique" }, { n: "Jonas Lindqvist", r: "Traducteur (fictif)" }] }],
        ["misc:story", { eyebrow: "Comité de lecture", title: "Sept lecteurs, une même exigence", paras: ["Chaque texte est lu par au moins trois membres du comité, qui discutent des propositions lors d'une réunion mensuelle.", "Le comité change tous les deux ans pour renouveler les regards."], image: "portrait-9" }],
      ] },
      { key: "soumettre", name: "Soumettre un texte", blocks: [
        ["misc:pagehead", { title: "Soumettre un texte", sub: "Nous lisons tout, nous répondons à tous." }],
        ["feat:steps", { title: "Le parcours d'un manuscrit", items: [{ t: "Envoi", x: "Un fichier texte, 30 000 signes maximum." }, { t: "Lecture", x: "Trois lecteurs indépendants." }, { t: "Réponse", x: "Sous huit semaines." }, { t: "Édition", x: "Travail avec l'auteur, publication au prochain numéro." }] }],
        ["feat:list2", { title: "Ce que nous cherchons", items: [{ t: "Nouvelles inédites" }, { t: "Poèmes en recueil court" }, { t: "Essais critiques" }, { t: "Traductions inédites" }] }],
        ["cta:band", { title: "Prêt à envoyer votre texte ?", sub: "Écrivez-nous avec une courte présentation.", cta: ["Écrire à la revue", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Écrire à la revue", formTitle: "Votre message", formIntro: "Abonnements, dépôt en librairie, propositions.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Permanence", rows: [["Mardi – jeudi", "14 h – 18 h"], ["Vendredi", "Sur rendez-vous"]] }],
      ] },
    ],
  },

  // 8. Blog mode
  {
    key: "maille-et-mode", name: "Maille & Mode", category: "magazine", tags: ["audacieux", "moderne"], siteType: "Blog mode",
    description: "Blog mode graphique : noir et blanc tranchés, rose vif, grands titres en capitales, bandes défilantes et mosaïques de looks.",
    brand: "MAILLE & MODE",
    tokens: { colors: { primary: "#18181b", secondary: "#1c1917", accent: "#db2777", background: "#ffffff", surface: "#f5f5f4", text: "#111111", muted: "#525252" }, fonts: { heading: "font.inter", body: "font.jost", button: "font.jost", link: "font.jost" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#111111" }, type: { h1: { size: 78, weight: 900, lineHeight: 0.95, letterSpacing: -0.04, transform: "uppercase" }, h2: { size: 40, weight: 800, lineHeight: 1.05, letterSpacing: -0.02, transform: "uppercase" } }, buttons: { paddingY: 16, paddingX: 34 } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "maille-mode", motifs: ["halftone", "ribbons", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:big", { title: "Maille & Mode" }],
    menu: [["Accueil", "/"], ["Looks", "/looks"], ["Tendances", "/tendances"], ["Garde-robe", "/garde-robe"], ["Contact", "/contact"]], cta: ["Newsletter", "/contact"],
    contact: { address: "14 rue Vieille-du-Temple, 75004 Paris", phone: "01 44 00 76 54", email: "hello@maille-et-mode.example", hours: "Réponse sous 48 h", tagline: "Style, seconde main et mode lente." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Collection d'automne", title: "S'habiller avec ce qu'on aime", sub: "Looks du quotidien, chasses à la seconde main et conseils de coupe pour composer une garde-robe qui dure.", cta: ["Voir les looks", "/looks"], cta2: ["Les tendances", "/tendances"] }],
        ["misc:marquee", { items: ["Mode lente", "Seconde main", "Looks du jour", "Retouches", "Pièces durables"] }],
        ["gal:masonry", { title: "Looks de la semaine", items: [{ t: "Manteau long camel" }, { t: "Pull marin" }, { t: "Total look noir" }, { t: "Veste de tailleur" }, { t: "Robe plissée" }, { t: "Bottines cuir" }] }],
        ["feat:numbered", { title: "Mes trois règles", items: [{ t: "Acheter moins", x: "Dix pièces qui vont ensemble valent cent achats impulsifs." }, { t: "Acheter mieux", x: "Matières naturelles, coutures solides." }, { t: "Faire durer", x: "Retouches, réparations et échanges." }] }],
        ["misc:posts", { title: "Derniers articles", count: 3, layout: "grid" }],
        ["cta:card", { title: "Le brief mode du mardi", sub: "Trois idées de looks, une adresse, un conseil de coupe.", cta: ["Je m'inscris", "/contact"] }],
      ] },
      { key: "looks", name: "Looks", blocks: [
        ["misc:pagehead", { title: "Looks", sub: "Composer sa tenue, saison après saison." }],
        ["gal:wall", { title: "Inspirations", items: [{ t: "Bureau" }, { t: "Week-end" }, { t: "Soirée" }, { t: "Voyage" }] }],
        ["misc:posts", { title: "Tous les looks", count: 6, layout: "grid" }],
        ["misc:search", { title: "Chercher une pièce, une couleur" }],
      ] },
      { key: "tendances", name: "Tendances", blocks: [
        ["misc:pagehead", { title: "Tendances", sub: "Décryptage, sans diktat." }],
        ["feat:strips", { title: "À retenir cet automne", items: [{ t: "Les mailles texturées", x: "Torsades, côtes anglaises, mohair : la maille s'épaissit." }, { t: "Le brun chocolat", x: "Il remplace le noir dans les looks du soir." }, { t: "Le tailleur détourné", x: "Veste ample, pantalon droit, baskets." }, { t: "Les accessoires d'occasion", x: "Sacs, ceintures et bijoux chinés." }] }],
        ["proof:quotes", { title: "Courrier des lectrices", items: [Q("Enfin un blog qui parle de coupe et de matières.", "Alix M.", "lectrice fictive"), Q("J'ai arrêté les achats compulsifs grâce à la capsule.", "Marion C.", "lectrice fictive"), Q("Les adresses de retouche sont une mine d'or.", "Hugo D.", "lecteur fictif")] }],
      ] },
      { key: "garde-robe", name: "Garde-robe", blocks: [
        ["misc:pagehead", { title: "La garde-robe capsule", sub: "Dix pièces, vingt tenues." }],
        ["feat:tabs", { title: "Capsule par saison", items: [{ t: "Automne", x: "Manteau long, pull en laine, jean brut, bottines." }, { t: "Hiver", x: "Doudoune fine, col roulé, pantalon de tailleur." }, { t: "Printemps", x: "Trench, chemise en lin, robe midi." }] }],
        ["gal:products", { title: "Pièces de référence (démonstration)", items: [{ t: "Pull marin en laine", price: "89 €" }, { t: "Trench coton", price: "149 €" }, { t: "Jean brut", price: "95 €" }, { t: "Bottines cuir", price: "165 €" }] }],
        ["cta:band", { title: "Le brief de la capsule en PDF", sub: "Gratuit pour les abonnés de la lettre.", cta: ["Le recevoir", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Collaborations, presse, retouches." }],
        ["contact:cards", { title: "Écrivez-moi" }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Acceptez-vous des collaborations ?", x: "Oui, avec des marques dont j'ai testé les produits pendant au moins un mois." }, { t: "Les liens sont-ils affiliés ?", x: "Jamais, et c'est précisé dans chaque article." }] }],
      ] },
    ],
  },
];
