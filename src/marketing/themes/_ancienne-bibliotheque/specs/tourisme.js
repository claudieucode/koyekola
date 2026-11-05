// Hébergements (9 thèmes). Textes de DÉMONSTRATION : établissements, personnes, tarifs et coordonnées fictifs ; offres présentées à titre d'exemple, aucune réservation en ligne n'est simulée (demande par le formulaire de contact).
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];

module.exports = [
  // 1. AURELIS — hôtel de luxe, sombre
  {
    key: "aurelis-palace", name: "Aurelis Palace", category: "tourisme", tags: ["luxe", "sombre", "editorial"], siteType: "Hôtel de luxe",
    description: "Palace nocturne : fond brun d'encre, or patiné, serif Cormorant en grand format et photographies plein bandeau pour un hôtel cinq étoiles. Les offres sont des exemples ; la demande passe par le formulaire.",
    brand: "Grand Hôtel Aurelis",
    tokens: { colors: { primary: "#c9a24b", secondary: "#2a2018", accent: "#e8d3a0", background: "#141110", surface: "#201a17", text: "#f3ece0", muted: "#bfb2a0" }, fonts: { heading: "font.cormorant-garamond", body: "font.nunito-sans", button: "font.nunito-sans", link: "font.nunito-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 68, weight: 500, lineHeight: 1.02, letterSpacing: 0 }, h2: { size: 42, weight: 500, lineHeight: 1.1, letterSpacing: 0 } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "aurelis-palace", motifs: ["arches", "bokeh", "rays"] },
    head: ["head:center", {}], foot: ["foot:big", { title: "Aurelis" }],
    menu: [["Accueil", "/"], ["Suites", "/suites"], ["Spa et table", "/spa-et-table"], ["Séjours", "/sejours"], ["Contact", "/contact"]], cta: ["Demander un séjour", "/contact"],
    contact: { address: "1 place des Marronniers, 06400 Cannes", phone: "04 93 00 21 80", email: "reservations@aurelis-palace.example", hours: "Réception ouverte jour et nuit", tagline: "L'art discret de recevoir." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Hôtel cinq étoiles · Cannes", title: "Un palais à la mesure du silence.", sub: "Quatre-vingt-quatre chambres et suites face à la baie, un spa de 1 200 m² et une table étoilée à l'esprit méditerranéen.", cta: ["Découvrir les suites", "/suites"], cta2: ["Demander un séjour", "/contact"] }],
        ["feat:alt", { eyebrow: "La maison", title: "Un siècle d'hospitalité", items: [{ t: "Une façade Belle Époque", x: "Rénovée avec des artisans locaux, la maison conserve ses stucs, ses ferronneries et son grand escalier.", link: ["Les suites", "/suites"] }, { t: "Un service en toute discrétion", x: "Majordome d'étage, voiturier, conciergerie : chaque attention est anticipée sans être annoncée.", link: ["Spa et table", "/spa-et-table"] }] }],
        ["gal:featured", { title: "Chambres et suites", items: [{ t: "Suite Baie", x: "92 m², terrasse plein sud." }, { t: "Chambre Jardin", x: "Lit king size, bain de marbre." }, { t: "Suite Orangerie", x: "Salon séparé, cheminée." }, { t: "Penthouse Aurelis", x: "240 m² et toit privé." }] }],
        ["proof:big", { items: [{ q: "Un séjour d'une élégance rare, où l'on ne demande jamais rien deux fois.", n: "Constance R.", r: "cliente fictive" }] }],
        ["proof:stats", { items: [["84", "chambres et suites"], ["1 étoile", "à la table (exemple)"], ["1 200 m²", "de spa"]] }],
        ["cta:image", { title: "Réservez un moment d'exception.", sub: "Notre équipe revient vers vous sous quelques heures avec une proposition personnalisée.", cta: ["Demander un séjour", "/contact"] }],
      ] },
      { key: "suites", name: "Suites", blocks: [
        ph("Chambres et suites", "Tarifs indicatifs, à titre d'exemple, par nuit."),
        ["gal:listings", { title: "Notre collection", items: [{ t: "Chambre Jardin", tag: "32 m²", price: "680 €", x: "Vue sur le parc, petit-déjeuner servi en chambre." }, { t: "Suite Baie", tag: "92 m²", price: "1 450 €", x: "Terrasse sur la mer, salon et dressing." }, { t: "Penthouse Aurelis", tag: "240 m²", price: "5 200 €", x: "Deux chambres, toit-terrasse, majordome dédié." }] }],
        ["feat:list2", { title: "Dans chaque chambre", items: [{ t: "Literie sur mesure" }, { t: "Salle de bain en marbre" }, { t: "Minibar offert" }, { t: "Accès au spa" }, { t: "Service d'étage 24 h/24" }, { t: "Wi-Fi haut débit" }] }],
        ["cta:card", { title: "Une préférence d'oreiller ?", sub: "Indiquez-nous vos habitudes, nous préparerons votre arrivée.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "spa-et-table", name: "Spa et table", blocks: [
        ph("Spa et table", "Se détendre, puis dîner."),
        ["feat:strips", { title: "Le spa Aurelis", items: [{ t: "Bassin d'eau de mer", x: "Chauffé à 29 °C, ouvert sur le jardin." }, { t: "Rituels signature", x: "Soins de 60 à 120 minutes aux huiles de la région." }, { t: "Hammam et saunas", x: "Réservés aux clients de l'hôtel et aux membres." }] }],
        ["misc:menu", { eyebrow: "Restaurant Le Cap", title: "Carte de saison (extrait)", left: ["Entrées", [{ t: "Langoustine, agrumes, huile d'olive", x: "Tiède, fenouil croquant", price: "46 €" }, { t: "Tomate ancienne, burrata", x: "Basilic et pignons", price: "32 €" }]], right: ["Plats", [{ t: "Loup de ligne, jus de bouillabaisse", x: "Pommes de terre safranées", price: "62 €" }, { t: "Agneau de Sisteron", x: "Aubergine fumée", price: "58 €" }]] }],
        ["misc:hours", { title: "Horaires", rows: [["Spa", "8 h – 21 h"], ["Déjeuner", "12 h 30 – 14 h 30"], ["Dîner", "19 h 30 – 22 h"]] }],
      ] },
      { key: "sejours", name: "Séjours", blocks: [
        ph("Séjours sur mesure", "Trois façons de prolonger le plaisir."),
        ["price:tiers", { items: [{ t: "Escapade", price: "1 480 €", period: "2 nuits", x: "Chambre Jardin", f: ["Petit-déjeuner", "Accès au spa", "Dîner au Cap"], cta: ["Demander", "/contact"] }, { t: "Évasion", price: "3 250 €", period: "3 nuits", x: "Suite Baie", f: ["Petit-déjeuner", "Soin signature pour deux", "Transferts en berline"], cta: ["Demander", "/contact"], hl: true }, { t: "Prestige", price: "9 800 €", period: "3 nuits", x: "Penthouse", f: ["Majordome dédié", "Dîner privé", "Excursion en bateau"], cta: ["Demander", "/contact"] }] }],
        ["feat:accordion", { title: "Bon à savoir", items: [{ t: "Quelle est l'heure d'arrivée ?", x: "Les chambres sont disponibles dès 15 h ; la bagagerie est ouverte toute la journée." }, { t: "Les animaux sont-ils acceptés ?", x: "Oui, les petits chiens sont les bienvenus, sur demande préalable." }, { t: "Peut-on réserver en ligne ?", x: "Pas encore : envoyez-nous votre demande, nous confirmons par e-mail." }] }],
        ["cta:band", { title: "Imaginons votre séjour.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact et accès"),
        ["contact:map", { title: "Nous trouver", mapAddress: "1 place des Marronniers, Cannes" }],
        ["feat:icons", { title: "Arriver à l'hôtel", items: [{ t: "En train", x: "Gare de Cannes à dix minutes en voiture.", icon: "mapPin" }, { t: "En avion", x: "Aéroport de Nice à trente minutes, transfert sur demande.", icon: "send" }, { t: "En voiture", x: "Parking couvert, bornes de recharge.", icon: "zap" }] }],
      ] },
    ],
  },

  // 2. COBALT & CIE — hôtel boutique urbain
  {
    key: "cobalt-et-cie", name: "Cobalt & Cie", category: "tourisme", tags: ["moderne", "audacieux"], siteType: "Hôtel boutique urbain",
    description: "Hôtel de ville décomplexé : bleu cobalt sur blanc cassé, Bodoni Moda contrasté et grands visuels éditoriaux. Une vitrine nerveuse pour un quartier, un bar et vingt-neuf chambres.",
    brand: "Hôtel Cobalt & Cie",
    tokens: { colors: { primary: "#1f3fd1", secondary: "#0e1a5c", accent: "#ffcf3d", background: "#f6f5f1", surface: "#ffffff", text: "#12142b", muted: "#555a73" }, fonts: { heading: "font.bodoni-moda", body: "font.source-sans-3", button: "font.source-sans-3", link: "font.source-sans-3" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 76, weight: 700, lineHeight: 0.98, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "cobalt-et-cie", motifs: ["skyline", "tiles", "plates"] },
    head: ["head:float", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Chambres", "/chambres"], ["Le bar", "/le-bar"], ["Le quartier", "/quartier"], ["Contact", "/contact"]], cta: ["Écrire à l'hôtel", "/contact"],
    contact: { address: "27 rue des Teinturiers, 69002 Lyon", phone: "04 72 00 33 12", email: "bonjour@cobalt-et-cie.example", hours: "Réception 7 h – 1 h", tagline: "Dormir en ville, vivre en ville." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Presqu'île · Lyon", title: "Votre chambre en ville.", sub: "Vingt-neuf chambres, un bar de quartier et un petit-déjeuner qui s'étire jusqu'à midi.", cta: ["Voir les chambres", "/chambres"], cta2: ["Le bar", "/le-bar"] }],
        ["misc:marquee", { items: ["Petit-déjeuner jusqu'à 12 h", "Vélos prêtés", "Chiens bienvenus", "Check-out tardif le dimanche"] }],
        ["feat:bento", { title: "Pourquoi Cobalt", items: [{ t: "Des chambres pensées en duo", x: "Design sobre, grandes baies, literie ferme et douche à l'italienne." }, { t: "Un bar ouvert à tous", x: "Cocktails de saison et vinyles." }, { t: "Le quartier en bas de la porte", x: "Halles, ateliers et quais à deux pas." }] }],
        ["gal:masonry", { title: "En images", items: [{ t: "Chambre Cobalt" }, { t: "Bar" }, { t: "Cour intérieure" }, { t: "Petit-déjeuner" }, { t: "Hall" }] }],
        ["proof:quotes", { items: [{ q: "Le meilleur rapport style-confort pour un week-end lyonnais.", n: "Mathis L.", r: "client fictif" }, { q: "On s'y sent chez soi, avec un bar en prime.", n: "Zoé P.", r: "cliente fictive" }, { q: "Personnel adorable et chambre silencieuse.", n: "Karim B.", r: "client fictif" }] }],
        ["cta:split", { title: "Un week-end en vue ?", sub: "Écrivez-nous vos dates, nous vous répondons le jour même.", cta: ["Écrire à l'hôtel", "/contact"] }],
      ] },
      { key: "chambres", name: "Chambres", blocks: [
        ph("Les chambres", "Tarifs d'exemple, petit-déjeuner en option."),
        ["feat:pricelist", { title: "Trois formats", items: [{ t: "Cobalt S", x: "16 m², lit double, vue cour", price: "119 €" }, { t: "Cobalt M", x: "22 m², lit queen, bureau", price: "149 €" }, { t: "Cobalt Loft", x: "38 m², mezzanine, baignoire", price: "229 €" }] }],
        ["gal:cards", { title: "À découvrir", items: [{ t: "Cobalt S", tag: "16 m²", x: "Compacte et lumineuse." }, { t: "Cobalt M", tag: "22 m²", x: "Le choix des couples." }, { t: "Cobalt Loft", tag: "38 m²", x: "Pour quatre voyageurs." }] }],
        ["feat:compare", { title: "Comparer", rows: [["", "S", "M", "Loft"], ["Baignoire", "non", "non", "oui"], ["Bureau", "non", "oui", "oui"], ["Couchage d'appoint", "non", "non", "oui"]] }],
      ] },
      { key: "le-bar", name: "Le bar", blocks: [
        ph("Le bar de l'hôtel", "Ouvert aux voisins, aux voyageurs et aux curieux."),
        ["misc:menu", { title: "La carte du soir", left: ["Cocktails", [{ t: "Cobalt Spritz", x: "Aperitivo maison, orange sanguine", price: "10 €" }, { t: "Rue des Teinturiers", x: "Rhum, thé fumé, citron", price: "12 €" }]], right: ["À grignoter", [{ t: "Planche de saint-félicien", x: "Pain du matin", price: "9 €" }, { t: "Tartare de betterave", x: "Noisettes", price: "8 €" }]] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – jeudi", "17 h – 1 h"], ["Vendredi – samedi", "17 h – 2 h"], ["Dimanche", "Brunch 10 h – 15 h"]] }],
      ] },
      { key: "quartier", name: "Le quartier", blocks: [
        ph("Autour de l'hôtel", "Nos adresses à moins de dix minutes."),
        ["feat:rows", { title: "À faire à pied", items: [{ t: "Les halles", x: "Charcuterie, fromages et comptoirs pour déjeuner debout." }, { t: "Les quais", x: "Une boucle de cinq kilomètres le long du fleuve." }, { t: "Les traboules", x: "Passages secrets du vieux quartier, parcours conseillé." }] }],
        ["cta:band", { title: "Notre plan de quartier vous attend.", cta: ["Demander le plan", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Nous écrire"),
        ["contact:cards", { title: "Une question, un séjour ?", formTitle: "Votre demande", formIntro: "Indiquez vos dates, nous confirmons par e-mail.", cta: "Envoyer" }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Y a-t-il un parking ?", x: "Un parking public est à 150 m ; tarif préférentiel sur demande." }, { t: "Peut-on arriver tard ?", x: "La réception est ouverte jusqu'à 1 h, après quoi un code est envoyé." }] }],
      ] },
    ],
  },

  // 3. BASTIDE FIGUIER — chambres d'hôtes
  {
    key: "bastide-figuier", name: "Bastide du Figuier", category: "tourisme", tags: ["chaleureux", "naturel"], siteType: "Chambres d'hôtes en Provence",
    description: "Maison d'hôtes provençale : terre cuite, lin et olivier, Alegreya lettré, menu latéral et photos de table partagée. Simple, humain, sans réservation simulée.",
    brand: "La Bastide du Figuier",
    tokens: { colors: { primary: "#b4532a", secondary: "#5b3a24", accent: "#6f7f4a", background: "#fbf3e8", surface: "#fffaf2", text: "#2f2118", muted: "#6b5646" }, fonts: { heading: "font.alegreya", body: "font.urbanist", button: "font.urbanist", link: "font.urbanist" }, radius: { sm: 6, md: 12, lg: 20, button: 999, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.08, letterSpacing: 0 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "pill" }, art: { seed: "bastide-figuier", motifs: ["botanical", "dunes", "blobs"] },
    head: ["head:side", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Les chambres", "/chambres"], ["La table d'hôtes", "/table-d-hotes"], ["Alentours", "/alentours"], ["Contact", "/contact"]], cta: ["Écrire à Marie-Lou", "/contact"],
    contact: { address: "Chemin du Figuier, 84220 Gordes", phone: "04 90 00 47 21", email: "accueil@bastide-figuier.example", hours: "Accueil de 16 h à 19 h", tagline: "Cinq chambres, une grande tablée." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Chambres d'hôtes · Luberon", title: "Ici, on dîne tous ensemble.", sub: "Cinq chambres dans une bastide du XVIIIe, un figuier centenaire et un petit-déjeuner à la confiture maison.", cta: ["Voir les chambres", "/chambres"], cta2: ["La table d'hôtes", "/table-d-hotes"] }],
        ["feat:numbered", { title: "L'esprit de la maison", items: [{ t: "5 chambres", x: "Chacune avec sa salle d'eau et sa terrasse." }, { t: "1 grande table", x: "Dîner partagé trois soirs par semaine." }, { t: "2 hectares", x: "Oliviers, potager et piscine naturelle." }] }],
        ["proof:quotes", { title: "Mots d'invités", items: [{ q: "On est arrivés inconnus, repartis amis.", n: "Delphine A.", r: "cliente fictive" }, { q: "Le petit-déjeuner vaut à lui seul le voyage.", n: "Olivier T.", r: "client fictif" }, { q: "Un calme absolu et un accueil sincère.", n: "Nadia F.", r: "cliente fictive" }] }],
        ["feat:steps", { title: "Une journée à la bastide", items: [{ t: "Petit-déjeuner", d: "8 h 30", x: "Pain du village, confitures, œufs du poulailler." }, { t: "Balade", d: "11 h", x: "Sentiers du Luberon au départ de la porte." }, { t: "Apéritif", d: "19 h", x: "Sous le figuier, avec les autres hôtes." }] }],
        ["cta:card", { title: "Envie de vous poser quelques jours ?", sub: "Écrivez-nous : Marie-Lou répond elle-même.", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "chambres", name: "Les chambres", blocks: [
        ph("Cinq chambres", "Prix d'exemple pour deux personnes, petit-déjeuner compris."),
        ["gal:listings", { items: [{ t: "L'Olivier", tag: "2 pers.", price: "135 €", x: "Lit en fer forgé, terrasse sur le verger." }, { t: "La Lavande", tag: "2 pers.", price: "145 €", x: "Voûtes en pierre, baignoire îlot." }, { t: "Le Figuier", tag: "2 à 3 pers.", price: "170 €", x: "Suite avec coin salon." }] }],
        ["feat:checks", { title: "Compris dans votre nuit", items: [{ t: "Petit-déjeuner maison" }, { t: "Linge de lit en lin" }, { t: "Piscine naturelle" }, { t: "Vélos à disposition" }], cta: ["Demander les dates", "/contact"] }],
        ["cta:band", { title: "Séjour de trois nuits ou plus ?", sub: "Une attention vous attend à l'arrivée.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "table-d-hotes", name: "La table d'hôtes", blocks: [
        ph("La table d'hôtes", "Sur réservation la veille, trois soirs par semaine."),
        ["misc:text", { eyebrow: "Cuisine de saison", title: "Ce que Marie-Lou cuisine", paras: ["Les légumes viennent du potager, les agneaux d'un voisin éleveur, le vin d'un domaine à trois kilomètres.", "Le menu change selon le marché : entrée, plat, fromages et dessert, à 38 € vin compris (exemple)."] }],
        ["misc:schedule", { title: "La semaine", items: [{ d: "Mardi", t: "Tian de légumes", x: "Agneau confit au thym" }, { d: "Jeudi", t: "Soupe au pistou", x: "Daube provençale" }, { d: "Samedi", t: "Tarte aux tomates", x: "Poisson du jour" }] }],
        ["misc:quote", { text: "À table, le téléphone reste dans la poche et la conversation fait le reste.", by: "Marie-Lou, hôtesse (fictive)" }],
      ] },
      { key: "alentours", name: "Alentours", blocks: [
        ph("Autour de la bastide"),
        ["feat:alt", { title: "À voir et à faire", items: [{ t: "Les villages perchés", x: "Gordes, Roussillon et Ménerbes, à moins de vingt minutes." }, { t: "Les marchés", x: "Le mardi à Coustellet, le samedi à Apt." }, { t: "Les randonnées", x: "Gorges de la Nesque, ocres et cèdres." }] }],
        ["misc:hours", { title: "Saison", rows: [["Avril – octobre", "Ouvert tous les jours"], ["Novembre – mars", "Sur demande, trois nuits minimum"]] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Écrire à la bastide"),
        ["contact:info", { title: "Contact", formTitle: "Une demande de séjour", formIntro: "Dates, nombre de personnes, envies : nous répondons sous 48 heures." }],
        ["feat:list2", { title: "À savoir", items: [{ t: "Enfants dès 8 ans" }, { t: "Animaux sur demande" }, { t: "Arrivée de 16 h à 19 h" }, { t: "Paiement sur place" }] }],
      ] },
    ],
  },

  // 4. AULNES — gîte rural
  {
    key: "gite-des-aulnes", name: "Gîte des Aulnes", category: "tourisme", tags: ["naturel", "classique"], siteType: "Gîte rural familial",
    description: "Gîte de campagne : vert prairie, crème de laine et slab Zilla, bandeau d'infos en tête, grandes rubriques par saison. Lisible sur mobile pour des vacances en famille.",
    brand: "Gîte des Aulnes",
    tokens: { colors: { primary: "#3f7a2c", secondary: "#2b4a22", accent: "#d9a21b", background: "#f7f6ee", surface: "#ffffff", text: "#202a1a", muted: "#566048" }, fonts: { heading: "font.zilla-slab", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.1, letterSpacing: 0 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "gite-des-aulnes", motifs: ["mountains", "botanical", "topo"] },
    head: ["head:topbar", { info: "Gîte 3 épis · 8 personnes · Morvan", note: "Semaine de 7 nuits du samedi au samedi" }], foot: ["foot:columns", { about: "Gîte rural de caractère dans une ancienne ferme du Morvan, avec jardin clos, four à pain et sentiers au départ.", cols: [["Le gîte", "La maison", "Tarifs", "Activités"], ["Infos", "Contact", "Conditions", "Accès"]] }],
    menu: [["Accueil", "/"], ["La maison", "/la-maison"], ["Tarifs et dates", "/tarifs"], ["Activités", "/activites"], ["Contact", "/contact"]], cta: ["Demander les disponibilités", "/contact"],
    contact: { address: "Lieu-dit Les Aulnes, 58120 Château-Chinon", phone: "03 86 00 58 14", email: "gite@aulnes-morvan.example", hours: "Réponse sous 48 h", tagline: "Un gîte, une ferme, quatre saisons." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Gîte rural · Morvan", title: "Une ferme pour toute la famille.", sub: "Quatre chambres, huit couchages, un jardin clos et un four à pain. À deux pas des forêts et des lacs du Morvan.", cta: ["Voir la maison", "/la-maison"], cta2: ["Tarifs et dates", "/tarifs"], stats: [["8", "couchages"], ["4", "chambres"], ["3 épis", "classement (exemple)"]] }],
        ["feat:grid-icons", { title: "Tout pour des vacances faciles", items: [{ t: "Jardin clos", x: "Pour les enfants et les chiens.", icon: "sun" }, { t: "Cuisine équipée", x: "Lave-vaisselle, four, grande table.", icon: "home" }, { t: "Four à pain", x: "Pour des pizzas en famille.", icon: "heart" }, { t: "Wi-Fi", x: "Utile les jours de pluie.", icon: "monitor" }] }],
        ["feat:tabs", { title: "Quelle saison choisir ?", items: [{ t: "Printemps", x: "Randonnées fleuries, cueillette de l'ail des ours." }, { t: "Été", x: "Baignade au lac des Settons, soirées au jardin." }, { t: "Automne", x: "Champignons, brame du cerf, feu de cheminée." }, { t: "Hiver", x: "Raquettes, soupes et jeux de société." }] }],
        ["gal:wall", { items: [{ t: "Salon" }, { t: "Jardin" }, { t: "Cuisine" }, { t: "Chambre" }] }],
        ["proof:statsbar", { items: [["4,8 / 5", "avis (exemple)"], ["62", "séjours par an"], ["15 min", "du lac"]] }],
        ["cta:split", { title: "Une semaine en vue ?", sub: "Indiquez vos dates, nous vérifions le calendrier.", cta: ["Demander les disponibilités", "/contact"] }],
      ] },
      { key: "la-maison", name: "La maison", blocks: [
        ph("La maison", "180 m² sur deux niveaux."),
        ["feat:rows", { title: "Pièce par pièce", items: [{ t: "Rez-de-chaussée", x: "Salon avec poêle, cuisine ouverte, salle à manger pour dix, buanderie." }, { t: "Étage", x: "Deux chambres doubles, une chambre à lits jumeaux, une chambre enfants avec lits superposés." }, { t: "Dehors", x: "Terrasse couverte, barbecue, four à pain, trampoline." }] }],
        ["feat:list2", { title: "Équipements", items: [{ t: "Linge fourni en option" }, { t: "Lit bébé et chaise haute" }, { t: "Lave-linge" }, { t: "Chauffage bois et électrique" }, { t: "Barbecue" }, { t: "Parking privé" }] }],
        ["cta:card", { title: "Envie de voir plus de photos ?", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs et dates", blocks: [
        ph("Tarifs et disponibilités", "Tarifs d'exemple à la semaine."),
        ["price:tiers", { items: [{ t: "Basse saison", price: "480 €", period: "semaine", f: ["Chauffage inclus", "Draps en option"], cta: ["Demander", "/contact"] }, { t: "Vacances scolaires", price: "690 €", period: "semaine", f: ["Chauffage inclus", "Draps en option", "Four à pain"], cta: ["Demander", "/contact"], hl: true }, { t: "Été", price: "780 €", period: "semaine", f: ["Linge de toilette", "Jardin", "Barbecue"], cta: ["Demander", "/contact"] }] }],
        ["feat:accordion", { title: "Conditions", items: [{ t: "Acompte", x: "30 % à la confirmation, solde un mois avant l'arrivée." }, { t: "Caution", x: "300 € restitués après l'état des lieux." }, { t: "Week-ends", x: "Possibles hors saison, deux nuits minimum." }] }],
      ] },
      { key: "activites", name: "Activités", blocks: [
        ph("Activités à proximité"),
        ["gal:cards", { title: "Autour du gîte", items: [{ t: "Lac des Settons", tag: "15 min", x: "Plage, canoë et pédalos." }, { t: "Vézelay", tag: "50 min", x: "Basilique et vignobles." }, { t: "Ferme voisine", tag: "5 min", x: "Fromages de chèvre." }] }],
        ["feat:steps", { title: "Une semaine type", items: [{ t: "Samedi", d: "J1", x: "Arrivée, pizzas au four à pain." }, { t: "Mardi", d: "J4", x: "Randonnée et baignade." }, { t: "Vendredi", d: "J7", x: "Marché de Château-Chinon." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Demander les disponibilités"),
        ["contact:info", { title: "Nous joindre", formTitle: "Votre demande", formIntro: "Dates, nombre de personnes, animaux : on s'occupe du reste." }],
        ["misc:faq", { items: [{ t: "Les chiens sont-ils acceptés ?", x: "Oui, un chien par séjour, avec supplément de 20 €." }, { t: "Peut-on arriver le dimanche ?", x: "Oui, selon le planning, nous en parlons ensemble." }] }],
      ] },
    ],
  },

  // 5. BIVOUAC SYLVE — camping / glamping, sombre
  {
    key: "bivouac-sylve", name: "Bivouac Sylve", category: "tourisme", tags: ["sombre", "naturel", "audacieux"], siteType: "Camping et glamping en forêt",
    description: "Glamping de nuit : vert forêt très sombre, menthe lumineuse, Roboto Slab trapu et affiche d'accueil. Pour des tentes lodge, des emplacements nus et un feu de camp.",
    brand: "Bivouac Sylve",
    tokens: { colors: { primary: "#5fcf9a", secondary: "#10281f", accent: "#f2a65a", background: "#0f1b16", surface: "#16271f", text: "#ecf5ef", muted: "#a9bdb2" }, fonts: { heading: "font.roboto-slab", body: "font.quicksand", button: "font.quicksand", link: "font.quicksand" }, radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.04, letterSpacing: -0.01, transform: "uppercase" } } },
    dna: { scale: "l", pad: "tight", align: "left", shape: "soft" }, art: { seed: "bivouac-sylve", motifs: ["mountains", "rays", "topo"] },
    head: ["head:dark", {}], foot: ["foot:newsletter", { title: "Nouvelles de la clairière", sub: "Ouvertures de saison et soirées feu de camp, deux e-mails par an.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Hébergements", "/hebergements"], ["Sur place", "/sur-place"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Poser ses valises", "/contact"],
    contact: { address: "Route de la Sylve, 40170 Lit-et-Mixe", phone: "05 58 00 62 09", email: "hello@bivouac-sylve.example", hours: "Accueil 9 h – 20 h en saison", tagline: "Dormir sous les pins." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Camping et glamping · Landes", title: "Dormir sous les pins.", sub: "Tentes lodge, emplacements nus et cabane perchée à dix minutes de l'océan. Feu de camp tous les soirs.", cta: ["Voir les hébergements", "/hebergements"], cta2: ["Tarifs", "/tarifs"] }],
        ["feat:strips", { title: "Trois façons de camper", items: [{ t: "Tente lodge", x: "Lit double, poêle, terrasse. Dès 89 € la nuit (exemple)." }, { t: "Cabane perchée", x: "Six mètres au-dessus du sol. Dès 140 €." }, { t: "Emplacement nu", x: "Ombragé, électricité en option. Dès 22 €." }] }],
        ["proof:stats", { items: [["46", "emplacements"], ["10 min", "de l'océan"], ["12", "tentes lodge"]] }],
        ["feat:alt", { title: "La vie au camp", items: [{ t: "Feu de camp à 21 h", x: "Marshmallows et guitare, chaque soir en saison.", link: ["Sur place", "/sur-place"] }, { t: "Douches chaudes à volonté", x: "Sanitaires rénovés, chauffés hors saison." }] }],
        ["proof:quotes", { items: [{ q: "Les enfants ont dormi dehors pour la première fois et ont adoré.", n: "Lucie V.", r: "cliente fictive" }, { q: "Le calme des pins, le confort d'un vrai lit.", n: "Hugo M.", r: "client fictif" }] }],
        ["cta:band", { title: "Votre tente vous attend.", cta: ["Poser ses valises", "/contact"] }],
      ] },
      { key: "hebergements", name: "Hébergements", blocks: [
        ph("Hébergements", "Du plus simple au plus perché."),
        ["gal:listings", { items: [{ t: "Tente lodge Pin", tag: "4 pers.", price: "89 €", x: "Lit double et deux simples, poêle à bois." }, { t: "Cabane Cime", tag: "2 pers.", price: "140 €", x: "Terrasse suspendue, petit-déjeuner panier." }, { t: "Emplacement Clairière", tag: "6 pers.", price: "22 €", x: "100 m², ombragé, point d'eau." }] }],
        ["feat:compare", { title: "Comparer", rows: [["", "Lodge", "Cabane", "Nu"], ["Literie", "oui", "oui", "non"], ["Chauffage", "oui", "oui", "non"], ["Électricité", "oui", "oui", "option"]] }],
        ["cta:card", { title: "Un doute sur le matériel ?", sub: "Nous prêtons duvets et lampes sur demande.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "sur-place", name: "Sur place", blocks: [
        ph("La vie sur place"),
        ["feat:icons", { title: "Services du camp", items: [{ t: "Épicerie", x: "Pain, produits locaux, bois de chauffage.", icon: "tag" }, { t: "Bar des pins", x: "Bières landaises et crêpes.", icon: "star" }, { t: "Location de vélos", x: "Les pistes cyclables à 200 m.", icon: "mapPin" }] }],
        ["misc:schedule", { title: "Programme de la semaine (été)", items: [{ d: "Lundi", t: "Marché nocturne", x: "Producteurs du coin" }, { d: "Mercredi", t: "Cinéma en plein air", x: "Dès la tombée de la nuit" }, { d: "Vendredi", t: "Soirée feu de camp", x: "Musique acoustique" }] }],
        ["gal:strip", { title: "Au camp", items: [{ t: "Feu" }, { t: "Pins" }, { t: "Cabane" }, { t: "Bar" }, { t: "Plage" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs et conditions", "Tarifs d'exemple par nuit."),
        ["feat:pricelist", { title: "À la nuit", items: [{ t: "Tente lodge", x: "4 personnes", price: "89 €" }, { t: "Cabane Cime", x: "2 personnes", price: "140 €" }, { t: "Emplacement", x: "6 personnes", price: "22 €" }, { t: "Adulte supplémentaire", x: "Emplacement", price: "6 €" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Les chiens sont-ils admis ?", x: "Oui, tenus en laisse, 3 € par nuit." }, { t: "Quelle durée minimum ?", x: "Deux nuits en été, une hors saison." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Réserver ou poser une question"),
        ["contact:cards", { title: "À bientôt", formTitle: "Votre séjour", formIntro: "Hébergement souhaité, dates, nombre de personnes.", cta: "Envoyer" }],
        ["cta:split", { title: "Hors saison, c'est calme et doux.", sub: "Ouvert d'avril à fin octobre.", cta: ["Nous écrire", "/contact"] }],
      ] },
    ],
  },

  // 6. ANSE TURQUOISE — resort balnéaire
  {
    key: "anse-turquoise", name: "Anse Turquoise", category: "tourisme", tags: ["moderne", "chaleureux"], siteType: "Resort balnéaire tout compris",
    description: "Resort sur la plage : turquoise profond, sable chaud, Prata en capitale douce, dégradé d'accueil et blocs d'offres. Une mise en page aérée pour séjours en famille ou en duo.",
    brand: "Anse Turquoise Resort",
    tokens: { colors: { primary: "#0a7f8c", secondary: "#064c57", accent: "#f08a4b", background: "#fbf6ec", surface: "#ffffff", text: "#10303a", muted: "#4d6770" }, fonts: { heading: "font.prata", body: "font.urbanist", button: "font.urbanist", link: "font.urbanist" }, radius: { sm: 8, md: 16, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.06, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "pill" }, art: { seed: "anse-turquoise", motifs: ["waves", "dunes", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Chambres et villas", "/chambres"], ["Activités", "/activites"], ["Restaurants", "/restaurants"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "Anse du Vieux Fort, Saint-François, Guadeloupe", phone: "05 90 00 88 13", email: "sejours@anse-turquoise.example", hours: "Équipe séjours 8 h – 18 h (heure locale)", tagline: "Les pieds dans le sable, la tête ailleurs." },
    social: ["instagram", "facebook", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Resort balnéaire · Caraïbes", title: "Le tout-compris qui laisse du temps.", sub: "Deux cents chambres et villas ouvertes sur une anse de sable blanc, quatre restaurants et un club enfants.", cta: ["Voir les chambres", "/chambres"], cta2: ["Demander un devis", "/contact"], stats: [["200", "chambres et villas"], ["4", "restaurants"], ["1 km", "de plage"]] }],
        ["feat:cards", { title: "Tout est inclus", intro: "Repas, boissons et activités sont compris dans le séjour (exemple de formule).", items: [{ t: "Repas et boissons", x: "Buffets, restaurants à la carte et bars de plage.", icon: "star" }, { t: "Activités nautiques", x: "Kayak, paddle, catamaran et snorkeling.", icon: "sun" }, { t: "Club enfants", x: "De 4 à 12 ans, encadré par des animateurs.", icon: "heart" }] }],
        ["gal:carousel", { title: "Le resort en images", items: [{ t: "La plage" }, { t: "Villa piscine" }, { t: "Bar du ponton" }, { t: "Spa" }] }],
        ["feat:bento", { title: "Les moments forts", items: [{ t: "Dîner pieds dans l'eau", x: "Chaque jeudi sur le sable, à la lueur des torches." }, { t: "Sortie catamaran", x: "Coucher de soleil, punch et musique." }, { t: "Spa face à la mer", x: "Soins de 30 à 90 minutes." }] }],
        ["proof:big", { items: [{ q: "Une semaine sans réfléchir : les enfants au club, nous à la plage.", n: "Anaïs et Pierre", r: "clients fictifs" }] }],
        ["cta:image", { title: "Dites-nous quand vous partez.", sub: "Nous composons votre séjour, vols compris sur demande.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "chambres", name: "Chambres et villas", blocks: [
        ph("Chambres et villas", "Tarifs d'exemple par personne, formule tout compris, 7 nuits."),
        ["gal:listings", { items: [{ t: "Chambre Jardin", tag: "2 pers.", price: "1 890 €", x: "Terrasse sur les palmiers." }, { t: "Chambre Plage", tag: "3 pers.", price: "2 390 €", x: "À 20 mètres du sable." }, { t: "Villa Piscine", tag: "6 pers.", price: "3 150 €", x: "Piscine privée, deux chambres." }] }],
        ["feat:checks", { title: "Compris dans la formule", items: [{ t: "Petit-déjeuner, déjeuner, dîner" }, { t: "Boissons de la carte tout compris" }, { t: "Activités non motorisées" }, { t: "Club enfants" }, { t: "Navette aéroport" }], cta: ["Demander un devis", "/contact"] }],
        ["cta:card", { title: "Voyager en famille de cinq ?", sub: "Nos villas sont conçues pour vous.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "activites", name: "Activités", blocks: [
        ph("Activités et bien-être"),
        ["feat:tabs", { title: "Au programme", items: [{ t: "Sur l'eau", x: "Kayak, paddle, voile légère, plongée avec tuba." }, { t: "En famille", x: "Chasse au trésor, club enfants, ateliers de pâtisserie." }, { t: "Bien-être", x: "Yoga au lever du soleil, spa, massages sur la plage." }] }],
        ["misc:schedule", { title: "Une journée type", items: [{ d: "7 h 30", t: "Yoga sur la plage", x: "Tous niveaux" }, { d: "10 h", t: "Initiation paddle", x: "Matériel fourni" }, { d: "17 h 30", t: "Catamaran au couchant", x: "Sur inscription" }] }],
        ["cta:band", { title: "Besoin d'un séjour sur mesure ?", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "restaurants", name: "Restaurants", blocks: [
        ph("Tables et bars"),
        ["feat:strips", { title: "Quatre adresses", items: [{ t: "Le Flamboyant", x: "Buffets créoles et grillades au déjeuner." }, { t: "La Case", x: "Cuisine caribéenne à la carte, sur réservation." }, { t: "Le Ponton", x: "Poissons du jour face à la mer." }, { t: "Le Bar des Alizés", x: "Cocktails et jus de fruits frais." }] }],
        ["misc:hours", { title: "Horaires", rows: [["Petit-déjeuner", "7 h – 10 h 30"], ["Déjeuner", "12 h – 14 h 30"], ["Dîner", "19 h – 21 h 30"]] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Préparer votre séjour"),
        ["contact:info", { title: "Nous joindre", formTitle: "Votre demande de devis", formIntro: "Dates, voyageurs, type de chambre : nous vous envoyons un devis détaillé." }],
        ["misc:faq", { items: [{ t: "Les vols sont-ils proposés ?", x: "Nous pouvons vous orienter vers des partenaires, la demande se fait par e-mail." }, { t: "Quel est le meilleur moment ?", x: "De décembre à avril, pour le soleil et la mer calme." }] }],
      ] },
    ],
  },

  // 7. PATACLOU — auberge de jeunesse
  {
    key: "pataclou-hostel", name: "Pataclou Hostel", category: "tourisme", tags: ["ludique", "audacieux"], siteType: "Auberge de jeunesse",
    description: "Hostel coloré : violet pop, jaune citron, League Spartan en capitales, collage de photos et en-tête minimal. Dortoirs, bar et sorties de groupe pour voyageurs au budget malin.",
    brand: "Pataclou Hostel",
    tokens: { colors: { primary: "#b01fa0", secondary: "#2a0f3a", accent: "#ffd23f", background: "#fff8ec", surface: "#ffffff", text: "#2a1030", muted: "#5f4a68" }, fonts: { heading: "font.league-spartan", body: "font.rubik", button: "font.rubik", link: "font.rubik" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 18 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 800, lineHeight: 1, letterSpacing: -0.02, transform: "uppercase" } }, border: { width: 2, color: "#2a0f3a" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "pill" }, art: { seed: "pataclou", motifs: ["ribbons", "halftone", "blobs"] },
    head: ["head:minimal", {}], foot: ["foot:columns", { about: "Auberge de jeunesse indépendante au cœur de Bordeaux : dortoirs, chambres privées, cuisine commune et bar jusqu'à minuit.", cols: [["Dormir", "Dortoirs", "Chambres privées", "Tarifs"], ["Sortir", "Soirées", "Quartier", "Contact"]] }],
    menu: [["Accueil", "/"], ["Dormir", "/dormir"], ["Vivre ici", "/vivre-ici"], ["Bons plans", "/bons-plans"], ["Contact", "/contact"]], cta: ["Poser son sac", "/contact"],
    contact: { address: "8 rue des Frères-Bonie, 33000 Bordeaux", phone: "05 56 00 19 33", email: "salut@pataclou.example", hours: "Accueil 24 h/24", tagline: "Un lit, des potes, zéro prise de tête." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Auberge de jeunesse · Bordeaux", title: "Ton lit, ta bande, ta ville.", sub: "Dortoirs dès 24 €, chambres privées, cuisine commune et soirées à la demande. À cinq minutes de la gare.", cta: ["Voir les lits", "/dormir"], cta2: ["Bons plans", "/bons-plans"] }],
        ["feat:grid-icons", { title: "Inclus dans ta nuit", items: [{ t: "Draps et casier", x: "Fournis, cadenas en option.", icon: "lock" }, { t: "Wi-Fi rapide", x: "Partout, même au bar.", icon: "zap" }, { t: "Cuisine commune", x: "Four, plaques et frigos.", icon: "home" }, { t: "Petit-déj à 4 €", x: "Café à volonté.", icon: "coin" }] }],
        ["proof:statsbar", { items: [["24 €", "le lit en dortoir (exemple)"], ["18", "nationalités par semaine"], ["24 h", "d'accueil"]] }],
        ["feat:rows", { title: "Cette semaine", items: [{ t: "Lundi · Pasta night", x: "On cuisine ensemble, 5 € par personne." }, { t: "Mercredi · Quiz au bar", x: "Les équipes se forment à l'accueil." }, { t: "Samedi · Balade nocturne", x: "Ponts, quais et petit verre sur les berges." }] }],
        ["proof:quotes", { items: [{ q: "J'ai rencontré mes compagnons de voyage dès le premier soir.", n: "Jade K.", r: "cliente fictive" }, { q: "Propre, pas cher et très bien situé.", n: "Tom S.", r: "client fictif" }] }],
        ["cta:band", { title: "Ton lit est prêt.", cta: ["Poser son sac", "/contact"] }],
      ] },
      { key: "dormir", name: "Dormir", blocks: [
        ph("Dormir", "Prix d'exemple par nuit et par personne."),
        ["feat:pricelist", { title: "Les lits", items: [{ t: "Dortoir 10 lits", x: "Mixte, rideaux et prise individuelle", price: "24 €" }, { t: "Dortoir 6 lits", x: "Mixte ou féminin", price: "29 €" }, { t: "Chambre privée", x: "2 personnes, salle d'eau partagée", price: "69 €" }, { t: "Chambre familiale", x: "4 personnes", price: "99 €" }] }],
        ["gal:wall", { items: [{ t: "Dortoir" }, { t: "Cuisine" }, { t: "Bar" }, { t: "Terrasse" }] }],
        ["cta:split", { title: "En groupe ?", sub: "Dès 10 personnes, nous bloquons un dortoir entier.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "vivre-ici", name: "Vivre ici", blocks: [
        ph("Vivre ici"),
        ["feat:alt", { title: "Les espaces", items: [{ t: "Le bar Pataclou", x: "Bières de microbrasserie et petit plat de 17 h à minuit.", link: ["Bons plans", "/bons-plans"] }, { t: "La cuisine commune", x: "Équipée pour douze, on y partage épices et recettes." }, { t: "La terrasse", x: "Hamacs et jeux, ouverte jusqu'à 22 h." }] }],
        ["misc:hours", { title: "Horaires", rows: [["Réception", "24 h/24"], ["Bar", "17 h – 0 h"], ["Silence dans les chambres", "23 h – 7 h"]] }],
      ] },
      { key: "bons-plans", name: "Bons plans", blocks: [
        ph("Bons plans du quartier", "Nos adresses pour dépenser peu."),
        ["feat:numbered", { title: "Top 3", items: [{ t: "Marché des Capucins", x: "Huîtres et café pour le petit-déjeuner." }, { t: "Miroir d'eau", x: "Gratuit, magique au coucher du soleil." }, { t: "Free walking tour", x: "Départ chaque matin à 10 h devant l'auberge." }] }],
        ["misc:posts", { title: "Carnets de voyageurs", count: 3, layout: "list" }],
        ["cta:card", { title: "Un conseil à partager ?", cta: ["Écrire à l'équipe", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Nous écrire"),
        ["contact:cards", { title: "On t'attend", formTitle: "Ta demande de lit", formIntro: "Dates, nombre de lits, arrivée tardive : dis-nous tout.", cta: "Envoyer" }],
        ["misc:faq", { items: [{ t: "Peut-on arriver la nuit ?", x: "Oui, la réception est ouverte 24 h/24." }, { t: "Y a-t-il une limite d'âge ?", x: "Dès 18 ans en dortoir, les mineurs avec un adulte." }] }],
      ] },
    ],
  },

  // 8. LAGOPÈDE — refuge de montagne, sombre
  {
    key: "lagopede-refuge", name: "Refuge du Lagopède", category: "tourisme", tags: ["sombre", "technique", "naturel"], siteType: "Refuge de haute montagne",
    description: "Refuge d'altitude : bleu nuit, névé et orange sécurité, Barlow Condensed tendu, menu partagé de part et d'autre du logo et infos pratiques en gros. Le site d'un gardien, pas d'une agence.",
    brand: "Refuge du Lagopède",
    tokens: { colors: { primary: "#7cc0f0", secondary: "#0b1824", accent: "#ff7a3c", background: "#0f1a26", surface: "#162536", text: "#eaf2f9", muted: "#a8bccd" }, fonts: { heading: "font.barlow-condensed", body: "font.literata", button: "font.barlow-condensed", link: "font.literata" }, radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 700, lineHeight: 0.98, letterSpacing: 0.01, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "lagopede-refuge", motifs: ["mountains", "topo", "halftone"] },
    head: ["head:split", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Le refuge", "/refuge"], ["Itinéraires", "/itineraires"], ["Infos pratiques", "/infos"], ["Contact", "/contact"]], cta: ["Contacter le gardien", "/contact"],
    contact: { address: "Refuge du Lagopède, 2 640 m, massif des Écrins, 05340 Saint-Christophe-en-Oisans", phone: "04 92 00 77 40", email: "gardien@lagopede-refuge.example", hours: "Ouvert de mi-juin à mi-septembre", tagline: "Le dernier thé avant le sommet." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "2 640 m · massif des Écrins", title: "Une halte, une nuit, un sommet.", sub: "Soixante-douze places en dortoir, une cuisine de montagne et un gardien qui connaît chaque couloir du secteur.", cta: ["Itinéraires", "/itineraires"], cta2: ["Infos pratiques", "/infos"] }],
        ["proof:stats", { items: [["72", "places en dortoir"], ["2 640 m", "d'altitude"], ["3 h 30", "de marche depuis le parking"]] }],
        ["feat:steps", { title: "Une nuit au refuge", items: [{ t: "Arrivée", d: "16 h", x: "Chaussons, thé chaud et briefing météo." }, { t: "Dîner", d: "19 h", x: "Soupe, plat de montagne, dessert maison." }, { t: "Petit-déjeuner", d: "5 h 30", x: "Pour les alpinistes, 4 h sur demande." }] }],
        ["gal:masonry", { title: "Le refuge au fil des jours", items: [{ t: "Lever de soleil" }, { t: "Salle commune" }, { t: "Arête" }, { t: "Lac glaciaire" }] }],
        ["feat:checks", { eyebrow: "Dans votre sac", title: "À prévoir", items: [{ t: "Drap-sac obligatoire" }, { t: "Lampe frontale" }, { t: "Espèces ou chèque" }, { t: "Boules Quies" }], cta: ["Toutes les infos", "/infos"] }],
        ["cta:band", { title: "Une nuit d'altitude se prépare.", sub: "Écrivez au gardien pour la météo et les conditions.", cta: ["Contacter le gardien", "/contact"] }],
      ] },
      { key: "refuge", name: "Le refuge", blocks: [
        ph("Le refuge", "Construit en 1962, rénové en 2019 (exemple)."),
        ["misc:story", { eyebrow: "Le gardien", title: "Thibault, gardien depuis douze étés", paras: ["Après un hiver de pisteur, Thibault monte au refuge dès que la neige le permet, avec ses mulets et sa sœur à la cuisine.", "Il connaît la météo mieux que la météo et ne ferme jamais la porte à un randonneur fatigué."], image: "portrait-1" }],
        ["feat:grid-icons", { title: "Équipements", items: [{ t: "Dortoirs chauffés", x: "Couvertures fournies.", icon: "home" }, { t: "Douche solaire", x: "Eau chaude limitée.", icon: "sun" }, { t: "Électricité", x: "Prises dans la salle commune.", icon: "plug" }, { t: "Cuisine d'altitude", x: "Régimes spéciaux sur demande.", icon: "heart" }] }],
        ["cta:split", { title: "Besoin de plus de détails ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "itineraires", name: "Itinéraires", blocks: [
        ph("Itinéraires"),
        ["gal:cards", { title: "Au départ du refuge", items: [{ t: "Le lac glaciaire", tag: "1 h 30", x: "Aller-retour facile, sans passage exposé." }, { t: "Le col du Lagopède", tag: "3 h", x: "Randonnée sur éboulis, vue sur la Barre." }, { t: "L'arête sud", tag: "8 h", x: "Alpinisme PD, guide conseillé." }] }],
        ["feat:accordion", { title: "Conseils du gardien", items: [{ t: "Quand partir ?", x: "Avant 7 h l'été pour éviter les orages de l'après-midi." }, { t: "Faut-il un guide ?", x: "Pour les sommets, nous vous orientons vers des guides locaux." }] }],
        ["cta:card", { title: "Un doute sur les conditions ?", cta: ["Appeler le refuge", "/contact"] }],
      ] },
      { key: "infos", name: "Infos pratiques", blocks: [
        ph("Infos pratiques", "Tarifs d'exemple."),
        ["feat:pricelist", { title: "Tarifs", items: [{ t: "Nuitée seule", x: "Dortoir, couverture", price: "22 €" }, { t: "Demi-pension", x: "Dîner et petit-déjeuner", price: "62 €" }, { t: "Pique-nique", x: "Sandwich et fruits", price: "10 €" }, { t: "Enfant de moins de 12 ans", x: "Demi-pension", price: "42 €" }] }],
        ["misc:hours", { title: "Ouverture", rows: [["Mi-juin – mi-septembre", "Gardé tous les jours"], ["Arrivée", "dès 14 h"], ["Dîner", "19 h précises"]] }],
        ["feat:list2", { title: "À savoir", items: [{ t: "Réservation obligatoire" }, { t: "Paiement sur place" }, { t: "Pas de réseau mobile" }, { t: "Chiens non admis" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contacter le gardien"),
        ["contact:info", { title: "Contact", formTitle: "Une demande de nuit", formIntro: "Nombre de personnes, date, régime : le gardien répond en soirée." }],
        ["misc:text", { eyebrow: "Sécurité", title: "En cas de besoin", paras: ["Le numéro d'urgence en montagne est le 112. Le gardien est en liaison radio avec le secours en montagne." ] }],
      ] },
    ],
  },

  // 9. CLOS VERMEIL — domaine viticole avec hébergement
  {
    key: "clos-vermeil", name: "Clos Vermeil", category: "tourisme", tags: ["editorial", "luxe", "chaleureux"], siteType: "Domaine viticole avec chambres",
    description: "Domaine de vigne : bordeaux profond, ivoire de cave, Yeseva One expressif, en-tête façon gazette et cartes vins-chambres. Pour dégustation, hébergement et vendanges.",
    brand: "Clos Vermeil",
    tokens: { colors: { primary: "#7a1f35", secondary: "#3a0f1b", accent: "#b88a3e", background: "#f8f2e8", surface: "#fffaf1", text: "#2a1418", muted: "#6a5057" }, fonts: { heading: "font.yeseva-one", body: "font.crimson-text", button: "font.crimson-text", link: "font.crimson-text" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 400, lineHeight: 1.08, letterSpacing: 0 }, body: { size: 19 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "clos-vermeil", motifs: ["botanical", "arches", "plates"] },
    head: ["head:masthead", { dateline: "Vendanges · mi-septembre à début octobre" }], foot: ["foot:newsletter", { title: "La lettre du Clos", sub: "Millésimes, soirées sur la terrasse et dates de vendanges.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Les vins", "/vins"], ["Dégustations", "/degustations"], ["Chambres", "/chambres"], ["Contact", "/contact"]], cta: ["Réserver une visite", "/contact"],
    contact: { address: "Route des Coteaux, 33330 Saint-Émilion", phone: "05 57 00 31 76", email: "domaine@clos-vermeil.example", hours: "Cave ouverte du mardi au samedi, 10 h – 18 h", tagline: "Du cep à la chambre." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Domaine familial · depuis 1932", title: "Dormir au milieu de la vigne.", sub: "Dix-huit hectares de merlot et de cabernet, une cave du XIXe et six chambres au bord des rangs.", cta: ["Les chambres", "/chambres"], cta2: ["Dégustations", "/degustations"] }],
        ["proof:logos", { title: "Sélection et labels (exemples)", items: ["Agriculture biologique", "Vignerons indépendants", "Haute valeur environnementale", "Clef verte"] }],
        ["feat:rows", { title: "Trois façons de vivre le domaine", items: [{ t: "Goûter", x: "Dégustations commentées par le vigneron, du rapide à l'accord complet." }, { t: "Dormir", x: "Six chambres au cœur des vignes, petit-déjeuner de vigneron." }, { t: "Vendanger", x: "Trois jours de septembre pour couper, trier et déjeuner aux champs." }] }],
        ["gal:products", { title: "Nos cuvées", items: [{ t: "Clos Vermeil rouge", price: "24 €", x: "Merlot, fruits noirs, bouche ronde." }, { t: "La Chapelle", price: "42 €", x: "Vieilles vignes, élevage 18 mois." }, { t: "Rosé de Pierre", price: "14 €", x: "Frais et floral." }, { t: "Brut Vermeil", price: "19 €", x: "Bulles de méthode traditionnelle." }] }],
        ["proof:quotes", { items: [{ q: "Une dégustation passionnante et une chambre au calme absolu.", n: "Claire D.", r: "cliente fictive" }, { q: "Le petit-déjeuner dans les vignes est un souvenir.", n: "Étienne R.", r: "client fictif" }] }],
        ["cta:image", { title: "Trinquez avant de dormir.", sub: "Dégustation et nuit en chambre, composez votre séjour avec le domaine.", cta: ["Réserver une visite", "/contact"] }],
      ] },
      { key: "vins", name: "Les vins", blocks: [
        ph("Les vins du domaine", "Prix cave d'exemple. Achat sur place ou sur demande."),
        ["feat:pricelist", { title: "Carte des cuvées", items: [{ t: "Rosé de Pierre", x: "Cabernet franc, frais et floral", price: "14 €" }, { t: "Brut Vermeil", x: "Méthode traditionnelle", price: "19 €" }, { t: "Clos Vermeil rouge", x: "Merlot, fruits noirs", price: "24 €" }, { t: "La Chapelle", x: "Vieilles vignes, élevage 18 mois", price: "42 €" }] }],
        ["misc:text", { eyebrow: "Le vigneron", title: "Une viticulture à hauteur d'homme", paras: ["Les vignes sont travaillées à la main, sans herbicides, avec des couverts végétaux entre les rangs.", "Chaque parcelle est vinifiée séparément et les cuvées sont assemblées en cave au printemps."] }],
        ["cta:band", { title: "Une commande à préparer ?", sub: "Écrivez-nous, le domaine expédie en France et en Europe.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "degustations", name: "Dégustations", blocks: [
        ph("Dégustations et visites"),
        ["price:tiers", { items: [{ t: "Découverte", price: "18 €", period: "par personne", x: "45 minutes", f: ["Visite de la cave", "Trois cuvées"], cta: ["Réserver", "/contact"] }, { t: "Accords", price: "46 €", period: "par personne", x: "1 h 30", f: ["Cinq cuvées", "Planche du terroir", "Verre souvenir"], cta: ["Réserver", "/contact"], hl: true }, { t: "Vigneron d'un jour", price: "95 €", period: "par personne", x: "Demi-journée", f: ["Taille ou vendange", "Déjeuner aux vignes", "Bouteille offerte"], cta: ["Réserver", "/contact"] }] }],
        ["misc:hours", { title: "Visites", rows: [["Mardi – vendredi", "10 h, 14 h, 16 h"], ["Samedi", "10 h, 11 h 30, 15 h, 16 h 30"], ["Dimanche et lundi", "Fermé"]] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Faut-il réserver ?", x: "Oui, par le formulaire de contact, nous confirmons par e-mail." }, { t: "Accueillez-vous les groupes ?", x: "Jusqu'à vingt personnes, sur demande." }] }],
      ] },
      { key: "chambres", name: "Chambres", blocks: [
        ph("Six chambres dans les vignes", "Tarifs d'exemple par nuit pour deux, petit-déjeuner compris."),
        ["gal:listings", { items: [{ t: "Chambre Merlot", tag: "2 pers.", price: "165 €", x: "Vue sur les rangs, poutres apparentes." }, { t: "Chambre Cabernet", tag: "2 pers.", price: "175 €", x: "Terrasse privée." }, { t: "Suite des Barriques", tag: "4 pers.", price: "260 €", x: "Ancien chai, deux chambres." }] }],
        ["feat:list2", { title: "Votre séjour comprend", items: [{ t: "Petit-déjeuner du vigneron" }, { t: "Verre de bienvenue" }, { t: "Accès à la piscine" }, { t: "Visite libre des vignes" }] }],
        ["cta:split", { title: "Envie de passer une nuit au domaine ?", cta: ["Demander les dates", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Visiter le domaine"),
        ["contact:map", { title: "Nous trouver", mapAddress: "Route des Coteaux, Saint-Émilion" }],
        ["misc:quote", { text: "Un bon vin se partage, une bonne chambre aussi.", by: "Le vigneron, Clos Vermeil (fictif)" }],
      ] },
    ],
  },
];
