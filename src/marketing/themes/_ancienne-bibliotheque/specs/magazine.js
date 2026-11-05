// Blogs et magazines, lot A (9 thèmes). Textes de DÉMONSTRATION : titres, rédactions, personnes et coordonnées fictifs.
const T = [];

// 1. Blog personnel de voyage
T.push({
  key: "sac-a-dos-nord", name: "Sac à dos du Nord", category: "magazine", tags: ["naturel", "chaleureux"], siteType: "Blog personnel de voyage", isNew: true,
  description: "Carnet de voyage solaire : terracotta sur papier crème, titres serif lisibles, photos plein cadre et récits par destination. Pensé pour un blogueur voyageur au long cours.",
  brand: "Les Semelles Vagabondes",
  tokens: { colors: { primary: "#c2410c", secondary: "#1f3a3d", accent: "#0e7490", background: "#fbf5ea", surface: "#ffffff", text: "#27211c", muted: "#5c5148" }, fonts: { heading: "font.literata", body: "font.plus-jakarta-sans", button: "font.plus-jakarta-sans", link: "font.plus-jakarta-sans" }, radius: { sm: 6, md: 12, lg: 20, button: 12, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 62, weight: 700, lineHeight: 1.05, letterSpacing: -0.01 } } },
  dna: { scale: "l", pad: "airy", align: "left", shape: "soft" }, art: { seed: "semelles", motifs: ["mountains", "dunes", "topo"] },
  head: ["head:bar", {}], foot: ["foot:big", { title: "Les Semelles Vagabondes" }],
  menu: [["Accueil", "/"], ["Destinations", "/destinations"], ["Un récit", "/recit"], ["Conseils", "/conseils"], ["Qui suis-je", "/a-propos"], ["Contact", "/contact"]], cta: ["Me écrire", "/contact"],
  contact: { address: "Quelque part entre deux gares, 44000 Nantes", phone: "02 40 00 31 31", email: "salut@semelles-vagabondes.example", hours: "Réponse sous 3 jours, hors connexion en trek", tagline: "Voyager lentement, raconter honnêtement." },
  social: ["instagram", "youtube"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:cover", { eyebrow: "Carnet n° 38 · Islande en van", title: "Onze jours sur la route de l'anneau", sub: "Itinéraire, budget réel et imprévus : le récit complet d'un tour d'Islande hors saison, sans filtre ni lieux secrets.", cta: ["Lire le récit", "/recit"], cta2: ["Toutes les destinations", "/destinations"], overlay: 0.45 }],
      ["misc:posts", { title: "Derniers récits", count: 6, layout: "grid" }],
      ["feat:bento", { eyebrow: "Mes trois règles", title: "Voyager sans courir", items: [{ t: "Rester au moins quatre nuits", x: "On ne connaît pas une ville en 48 heures. Rester longtemps coûte moins cher et change le regard.", icon: "mapPin" }, { t: "Préférer le train", x: "Moins vite, mais on traverse les paysages au lieu de les survoler.", icon: "globe" }, { t: "Noter les dépenses", x: "Chaque récit publie son budget au centime près.", icon: "coin" }] }],
      ["gal:featured", { title: "Dans le sac photo", items: [{ t: "Aube sur le fjord" }, { t: "Marché de Hanoï" }, { t: "Train de nuit" }, { t: "Refuge à 2 400 m" }] }],
      ["proof:big", { items: [{ q: "Ses budgets détaillés m'ont permis de partir trois semaines avec un salaire de stagiaire.", n: "Lectrice assidue", r: "témoignage fictif" }] }],
      ["cta:card", { title: "Un départ par mois dans votre boîte", sub: "La lettre du voyageur : un récit, un budget, une adresse.", cta: ["S'abonner à la lettre", "/contact"] }],
    ] },
    { key: "destinations", name: "Destinations", blocks: [
      ["misc:pagehead", { title: "Destinations", sub: "Par région, avec le budget journalier moyen." }],
      ["gal:cards", { title: "Les carnets par pays", items: [{ t: "Islande", tag: "Nord", x: "Tour de l'île en van, 11 jours, environ 95 € par jour." }, { t: "Vietnam", tag: "Asie", x: "Du nord au sud en train et en scooter, 5 semaines." }, { t: "Portugal", tag: "Europe", x: "Côte atlantique à vélo, de Porto à Sagres." }, { t: "Pérou", tag: "Andes", x: "Altitude, trek de Salkantay et cuisine de marché." }, { t: "Maroc", tag: "Maghreb", x: "Atlas en hiver, gîtes et voyages en bus." }, { t: "Écosse", tag: "Îles", x: "Hébrides en stop et en ferry." }] }],
      ["misc:posts", { title: "Tous les récits", count: 6, layout: "list" }],
      ["misc:search", { title: "Chercher un pays, une ville" }],
    ] },
    { key: "recit", name: "Un récit", blocks: [
      ["misc:pagehead", { title: "Carnet de route", sub: "Islande · 11 jours · 9 min de lecture" }],
      ["misc:article", { tag: "Islande", title: "Tour de l'anneau en van, hors saison", meta: "Par Léna · publié en octobre · budget détaillé en fin d'article", paras: ["Départ de Keflavík à 6 h, thermos plein et chaînes dans le coffre. En novembre, la route numéro 1 appartient aux moutons et aux camions de pêche : on roule des heures sans croiser personne.", "La deuxième nuit, une tempête a secoué le van jusqu'à l'aube. Le lendemain, un pêcheur nous a offert du café et un lieu noir à l'abri du vent. C'est aussi ça, voyager hors saison : l'hospitalité remplace la foule.", "Budget total pour deux : 2 090 €, dont 640 € de location de van et 380 € de carburant. Les piscines géothermiques, elles, valent chaque couronne."], quote: "Hors saison, on perd la lumière mais on gagne les rencontres.", by: "Carnet de bord, jour 7" }],
      ["cta:band", { title: "Vous partez bientôt ?", sub: "Écrivez-moi, je réponds toujours avec un itinéraire.", cta: ["Me contacter", "/contact"] }],
    ] },
    { key: "conseils", name: "Conseils", blocks: [
      ["misc:pagehead", { title: "Conseils pratiques", sub: "Ce que j'aurais aimé savoir avant de partir." }],
      ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quel budget prévoir pour un mois en Asie ?", x: "Entre 1 100 € et 1 600 € hors vol, selon le rythme et le confort des hébergements." }, { t: "Comment choisir un sac ?", x: "40 litres maximum, avec ouverture frontale. Tout ce qui ne tient pas dedans reste à la maison." }, { t: "Comment voyager seule en sécurité ?", x: "Partager sa position, arriver de jour, privilégier les dortoirs de moins de six lits." }, { t: "Assurance voyage : utile ?", x: "Oui pour l'étranger, surtout les activités en altitude. Lisez les plafonds de rapatriement." }] }],
      ["feat:checks", { title: "Ma liste de départ", cta: ["Recevoir la liste complète", "/contact"], items: [{ t: "Passeport valable six mois après le retour" }, { t: "Copies numériques des papiers" }, { t: "Adaptateur universel et batterie externe" }, { t: "Petite pharmacie et protection solaire" }] }],
      ["misc:posts", { title: "Guides pratiques", count: 3, layout: "list" }],
    ] },
    { key: "a-propos", name: "Qui suis-je", blocks: [
      ["misc:pagehead", { title: "Qui suis-je" }],
      ["misc:story", { eyebrow: "Depuis 2017", title: "Une ancienne comptable devenue conteuse", paras: ["J'ai quitté un bureau nantais pour un aller simple vers Lisbonne. Neuf ans et quarante-six pays plus tard, je raconte ce qui marche et ce qui rate.", "Ce blog est indépendant : aucun voyage offert, aucun lien d'affiliation caché. Quand une marque me prête du matériel, je le dis."], image: "portrait-2" }],
      ["proof:stats", { title: "Le blog en chiffres (exemples)", items: [["46", "pays visités"], ["210", "récits publiés"], ["24 000", "lecteurs par mois"]] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Me contacter", sub: "Une question d'itinéraire ? Un projet de collaboration ?" }],
      ["contact:info", { title: "Écrivez-moi", formTitle: "Votre message", formIntro: "Dites-moi où vous allez et combien de temps.", cta: ["Envoyer", "/contact"] }],
      ["misc:hours", { title: "Disponibilité", rows: [["En France", "Réponse sous 48 h"], ["En voyage", "Sous 3 à 5 jours"], ["En trek", "À mon retour du réseau"]] }],
    ] },
  ],
});

// 2. Magazine culturel
T.push({
  key: "palimpseste-revue", name: "Palimpseste", category: "magazine", tags: ["editorial", "luxe"], siteType: "Magazine culturel trimestriel", featured: true,
  description: "Revue culturelle trimestrielle : violet profond sur blanc cassé, didones contrastées, grands filets et mise en page de livre d'art. Pour critiques, essais illustrés et entretiens.",
  brand: "Palimpseste, revue des arts",
  tokens: { colors: { primary: "#6d28d9", secondary: "#1b1030", accent: "#b45309", background: "#faf8f5", surface: "#ffffff", text: "#1a1423", muted: "#554b63" }, fonts: { heading: "font.bodoni-moda", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d2e2" }, type: { h1: { size: 66, weight: 500, lineHeight: 1.04, letterSpacing: -0.015 }, h2: { size: 40, weight: 500, lineHeight: 1.12, letterSpacing: -0.005 } } },
  dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "palimpseste", motifs: ["plates", "arches", "halftone"] },
  head: ["head:masthead", { dateline: "Revue trimestrielle · Numéro 27 · Hiver" }], foot: ["foot:newsletter", { title: "Le feuillet du jeudi", sub: "Une critique, un entretien et trois adresses, tous les quinze jours.", button: "Écrire à la revue" }],
  menu: [["Sommaire", "/"], ["Critiques", "/critiques"], ["Entretien", "/entretien"], ["La revue", "/la-revue"], ["Abonnements", "/abonnements"]], cta: ["S'abonner", "/abonnements"],
  contact: { address: "14 quai des Chartreux, 69001 Lyon", phone: "04 72 00 27 27", email: "revue@palimpseste.example", hours: "Du mardi au jeudi, 10 h – 17 h", tagline: "Lire les arts à la lenteur qu'ils méritent." },
  pages: [
    { key: "accueil", name: "Sommaire", blocks: [
      ["hero:framed", { eyebrow: "Numéro 27", title: "Ce que les ruines nous disent encore", sub: "Dossier : architectes, plasticiens et poètes face aux lieux abandonnés. Avec un entretien-fleuve et seize pages d'images.", cta: ["Lire l'éditorial", "/entretien"], cta2: ["Le sommaire", "/critiques"] }],
      ["feat:numbered", { eyebrow: "Au sommaire", title: "Trois entrées dans le numéro", items: [{ t: "Habiter le vide", x: "Dix pages sur les friches reconverties en ateliers d'artistes." }, { t: "La voix du verre", x: "Rencontre avec une maître verrière qui restaure les vitraux." }, { t: "Cinéma de poche", x: "Les festivals de court métrage hors des capitales." }] }],
      ["misc:posts", { title: "Dernières critiques en ligne", count: 4, layout: "list" }],
      ["gal:strip", { title: "Dans les pages", items: [{ t: "Galerie" }, { t: "Atelier" }, { t: "Scène" }, { t: "Bibliothèque" }, { t: "Cinéma" }] }],
      ["proof:big", { items: [{ q: "On en ressort avec l'impression d'avoir vraiment regardé.", n: "Abonné depuis 2019", r: "témoignage fictif" }] }],
      ["cta:split", { title: "Quatre numéros, un abonnement", sub: "Papier mat, couverture sérigraphiée, livraison offerte en France.", cta: ["Voir les formules", "/abonnements"] }],
    ] },
    { key: "critiques", name: "Critiques", blocks: [
      ["misc:pagehead", { title: "Critiques", sub: "Expositions, spectacles, livres, disques." }],
      ["feat:strips", { title: "Les rubriques", items: [{ t: "Arts visuels", x: "Expositions en région et rétrospectives à voir avant la fermeture." }, { t: "Scène", x: "Théâtre, danse et performance, de la salle des fêtes à l'opéra." }, { t: "Livres", x: "Romans, essais et poésie, avec une préférence pour les petites maisons." }, { t: "Écrans", x: "Cinéma d'auteur, séries rares, formes courtes." }] }],
      ["misc:posts", { title: "À lire maintenant", count: 6, layout: "grid" }],
      ["misc:search", { title: "Chercher un artiste, une œuvre" }],
    ] },
    { key: "entretien", name: "Entretien", blocks: [
      ["misc:pagehead", { title: "Entretien", sub: "Arts visuels · 12 min de lecture" }],
      ["misc:article", { tag: "Entretien", title: "« Je photographie ce qui reste quand tout est parti »", meta: "Propos recueillis par Hélène Marchal · numéro 27", paras: ["Dans son atelier de la Croix-Rousse, Nora Delbec accroche des tirages de grandes dimensions : halls de gare fermés, cinémas sans fauteuils, piscines vides. Elle parle doucement, corrige ses phrases à voix haute.", "Palimpseste. Vous évitez les personnages. Pourquoi ? — Parce que les lieux gardent la mémoire mieux que les visages. Une salle de classe vide raconte plus de choses qu'un portrait posé.", "Son prochain projet : documenter les cinq dernières cabines téléphoniques de la région, avant leur retrait."], quote: "Un lieu vide n'est jamais silencieux.", by: "Nora Delbec, photographe (personnage fictif)" }],
      ["cta:band", { title: "Retrouvez l'entretien complet dans le numéro 27", sub: "Disponible en librairie et par abonnement.", cta: ["S'abonner", "/abonnements"] }],
    ] },
    { key: "la-revue", name: "La revue", blocks: [
      ["misc:pagehead", { title: "La revue" }],
      ["misc:story", { eyebrow: "Depuis 2013", title: "Une revue qui ralentit le regard", paras: ["Palimpseste est publiée par une association de lecteurs, soutenue par des abonnements et quelques mécènes locaux. Pas de publicité, pas de pages sponsorisées.", "Chaque numéro rassemble une quinzaine de contributeurs : critiques, universitaires, photographes, illustrateurs."], image: "portrait-4" }],
      ["proof:team", { title: "Le comité", items: [{ n: "Hélène Marchal", r: "Direction" }, { n: "Iannis Roche", r: "Secrétariat de rédaction" }, { n: "Clémence Boyer", r: "Iconographie" }, { n: "Baptiste Aumont", r: "Maquette" }] }],
      ["proof:stats", { items: [["27", "numéros parus"], ["4 200", "abonnés (exemple)"], ["96", "pages par numéro"]] }],
    ] },
    { key: "abonnements", name: "Abonnements", blocks: [
      ["misc:pagehead", { title: "Abonnements", sub: "Formules d'exemple, contact direct avec la revue." }],
      ["price:tiers", { title: "Choisir sa formule", items: [{ t: "Lecteur", price: "38 €", period: "/an", f: ["4 numéros papier", "Archives en ligne"], cta: "Nous écrire", url: "/abonnements" }, { t: "Fidèle", price: "58 €", period: "/an", hl: true, f: ["4 numéros papier", "Hors-série offert", "Feuillet du jeudi"], cta: "Nous écrire", url: "/abonnements" }, { t: "Mécène", price: "120 €", period: "/an", f: ["Formule Fidèle", "Tirage d'art numéroté", "Soirée annuelle"], cta: "Nous écrire", url: "/abonnements" }] }],
      ["contact:map", { title: "Venir à la rédaction", mapAddress: "14 quai des Chartreux, 69001 Lyon" }],
    ] },
  ],
});

// 3. Média tech
T.push({
  key: "bitrate-media", name: "Bitrate", category: "magazine", tags: ["sombre", "technique"], siteType: "Média d'actualité tech",
  description: "Média tech en mode sombre : fond anthracite vert, accents verts phosphorescents, titres compacts et densité de flux. Pour tests de matériel, analyses et veille logicielle.",
  brand: "Bitrate",
  tokens: { colors: { primary: "#4ade80", secondary: "#050a07", accent: "#fbbf24", background: "#0a110d", surface: "#121c16", text: "#e8f2ec", muted: "#a3b8ab" }, fonts: { heading: "font.chivo", body: "font.dm-sans", button: "font.chivo", link: "font.dm-sans" }, radius: { sm: 3, md: 6, lg: 10, button: 4, field: 4, card: 8 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#24362b" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.04, letterSpacing: -0.02 }, h2: { size: 34, weight: 800, lineHeight: 1.12, letterSpacing: -0.01 } } },
  dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "bitrate", motifs: ["mesh", "tiles", "rays"] },
  head: ["head:dark", {}], foot: ["foot:line", {}],
  menu: [["À la une", "/"], ["Tests", "/tests"], ["Analyse", "/analyse"], ["Veille", "/veille"], ["L'équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Newsletter", "/contact"],
  contact: { address: "9 rue du Débit, 31000 Toulouse", phone: "05 61 00 90 09", email: "redac@bitrate.example", hours: "Du lundi au vendredi, 9 h – 19 h", tagline: "Le matériel et le code, sans communiqué de presse." },
  social: ["youtube", "linkedin"],
  pages: [
    { key: "accueil", name: "À la une", blocks: [
      ["hero:split", { eyebrow: "Test complet · 11 jours d'usage", title: "Ce portable à 900 € tient-il ses promesses ?", sub: "Autonomie réelle, bruit, écran, température : notre protocole de mesure appliqué à la machine la plus commentée du moment.", cta: ["Lire le test", "/tests"], cta2: ["Notre protocole", "/analyse"] }],
      ["proof:statsbar", { items: [["186", "tests publiés"], ["42", "relevés par appareil"], ["0", "article sponsorisé"]] }],
      ["misc:posts", { title: "Dernières publications", count: 6, layout: "grid" }],
      ["feat:tabs", { eyebrow: "Rubriques", title: "Ce que nous couvrons", items: [{ t: "Matériel", x: "Ordinateurs, téléphones, objets connectés : tests chiffrés sur banc maison." }, { t: "Logiciel", x: "Mises à jour, failles et outils libres, expliqués pour les non-spécialistes." }, { t: "IA et données", x: "Ce que changent les modèles génératifs, avec leurs limites réelles." }, { t: "Vie privée", x: "Traceurs, permissions, hébergement : comment s'y retrouver." }] }],
      ["cta:image", { title: "Un résumé tech chaque matin", sub: "Cinq liens, trois minutes de lecture, aucun jargon inutile.", cta: ["Recevoir la lettre", "/contact"] }],
    ] },
    { key: "tests", name: "Tests", blocks: [
      ["misc:pagehead", { title: "Tests de matériel", sub: "Même protocole pour tous, résultats publiés." }],
      ["feat:compare", { title: "Comparatif de la semaine (exemple)", rows: [["", "Portable A", "Portable B"], ["Autonomie vidéo", "11 h 20", "8 h 05"], ["Écran (luminosité)", "420 nits", "360 nits"], ["Bruit en charge", "34 dB", "41 dB"], ["Prix constaté", "899 €", "749 €"]] }],
      ["misc:posts", { title: "Tous les tests", count: 6, layout: "list" }],
      ["misc:search", { title: "Chercher un produit, une marque" }],
    ] },
    { key: "analyse", name: "Analyse", blocks: [
      ["misc:pagehead", { title: "Analyse", sub: "Décryptage · 8 min de lecture" }],
      ["misc:article", { tag: "Décryptage", title: "Pourquoi vos sauvegardes ne servent à rien si elles sont au même endroit", meta: "Par Samir Ferrand · mis à jour jeudi", paras: ["Un ordinateur, un disque externe posé à côté, et la conviction d'être protégé : c'est le scénario classique d'une perte totale lors d'un cambriolage ou d'un dégât des eaux.", "La règle des trois copies, deux supports, un site distant n'est pas une lubie d'administrateur. Elle reste la méthode la plus fiable, et elle coûte quelques euros par mois.", "Nous avons testé quatre approches, de la clé chiffrée au stockage distant, en simulant une panne complète. Le temps de restauration varie de 25 minutes à 9 heures."], quote: "Une sauvegarde qui n'a jamais été restaurée est une hypothèse.", by: "Samir Ferrand" }],
      ["cta:band", { title: "Notre guide de sauvegarde en PDF", sub: "Une page, cinq étapes, zéro jargon.", cta: ["Le recevoir", "/contact"] }],
    ] },
    { key: "veille", name: "Veille", blocks: [
      ["misc:pagehead", { title: "Veille de la semaine", sub: "Le fil des annonces qui comptent vraiment." }],
      ["feat:steps", { title: "Calendrier des sorties (exemples)", items: [{ t: "Mise à jour majeure d'un système mobile", x: "Correctifs de sécurité et nouvelles autorisations.", d: "Lundi" }, { t: "Fin de support d'un navigateur ancien", x: "À vérifier sur les postes de l'entreprise.", d: "Mercredi" }, { t: "Sortie d'une carte graphique milieu de gamme", x: "Nos mesures arrivent dans la semaine.", d: "Jeudi" }, { t: "Publication d'un correctif de faille critique", x: "Appliquer sans attendre.", d: "Vendredi" }] }],
      ["misc:posts", { title: "En bref", count: 4, layout: "list" }],
    ] },
    { key: "equipe", name: "L'équipe", blocks: [
      ["misc:pagehead", { title: "L'équipe" }],
      ["misc:story", { eyebrow: "Notre méthode", title: "Mesurer d'abord, commenter ensuite", paras: ["Bitrate est financé par ses lecteurs. Le matériel est acheté ou emprunté puis rendu, et chaque test précise comment l'appareil nous est parvenu.", "Nos protocoles sont publics, les corrections sont horodatées."], image: "portrait-6" }],
      ["proof:team", { title: "La rédaction", items: [{ n: "Samir Ferrand", r: "Rédacteur en chef" }, { n: "Océane Pichon", r: "Tests matériel" }, { n: "Ravi Menard", r: "Logiciel et sécurité" }, { n: "Alix Dumas", r: "Données et IA" }] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact", sub: "Tuyau, correction, proposition de test." }],
      ["contact:cards", { title: "Nous joindre" }],
      ["feat:list2", { title: "Ce que nous acceptons", items: [{ t: "Alertes de sécurité vérifiables" }, { t: "Prêts de matériel avec retour" }, { t: "Corrections factuelles" }, { t: "Propositions de pigistes" }] }],
    ] },
  ],
});

// 4. Blog de cuisine / recettes
T.push({
  key: "casserole-fenouil", name: "Casserole & Fenouil", category: "magazine", tags: ["chaleureux", "naturel"], siteType: "Blog de cuisine et recettes",
  description: "Blog de cuisine de saison : vert olive sur crème, titres serif gourmands, cartes de recettes arrondies et étapes numérotées lisibles à deux mains sales.",
  brand: "Casserole & Fenouil",
  tokens: { colors: { primary: "#4d7c0f", secondary: "#3b2f1e", accent: "#c2410c", background: "#fffaf0", surface: "#ffffff", text: "#2a2218", muted: "#5f5444" }, fonts: { heading: "font.dm-serif-display", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 20 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.08, letterSpacing: -0.01 } } },
  dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "casserole", motifs: ["botanical", "objects", "blobs"] },
  head: ["head:topbar", { info: "Une recette de saison chaque mardi et vendredi", note: "Cuisine maison, ingrédients simples" }], foot: ["foot:columns", { about: "Recettes testées trois fois dans une petite cuisine de Bordeaux, avec des quantités à la portée de tous.", cols: [["Cuisiner", "Recettes", "Techniques", "Saisons"], ["Le blog", "Mon histoire", "Contact", "Mentions"]] }],
  menu: [["Accueil", "/"], ["Recettes", "/recettes"], ["La recette du jour", "/recette"], ["Techniques", "/techniques"], ["Mon histoire", "/a-propos"], ["Contact", "/contact"]], cta: ["Écrire", "/contact"],
  contact: { address: "Cuisine ouverte, 33000 Bordeaux", phone: "05 56 00 41 41", email: "bonjour@casserole-fenouil.example", hours: "Réponses le lundi et le jeudi", tagline: "Manger bien, sans se compliquer la vie." },
  social: ["instagram", "facebook"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:split-left", { eyebrow: "Recette de saison", title: "Velouté de potimarron, noisettes et fenouil rôti", sub: "Quarante minutes, un seul mixeur, des restes qui se mangent le lendemain. La soupe que je prépare tous les dimanches d'octobre.", cta: ["Voir la recette", "/recette"], cta2: ["Toutes les recettes", "/recettes"] }],
      ["gal:cards", { title: "Au menu cette semaine", items: [{ t: "Tarte fine aux poireaux", tag: "35 min", x: "Pâte feuilletée maison ou du commerce, au choix." }, { t: "Dahl de lentilles corail", tag: "25 min", x: "Un plat complet pour moins de 3 € la portion." }, { t: "Pommes au four à la cannelle", tag: "15 min", x: "Le dessert qui embaume toute la maison." }, { t: "Pain au levain du débutant", tag: "24 h", x: "Mon pas-à-pas avec photos." }] }],
      ["misc:posts", { title: "Dernières recettes", count: 6, layout: "list" }],
      ["feat:steps", { eyebrow: "Ma méthode", title: "Une recette réussie en quatre temps", items: [{ t: "Lire jusqu'au bout", x: "Avant de sortir la première casserole.", d: "1" }, { t: "Tout peser", x: "Mettre en place évite la panique.", d: "2" }, { t: "Goûter souvent", x: "Le sel se rattrape, pas l'amertume.", d: "3" }, { t: "Laisser reposer", x: "Un plat se bonifie dix minutes hors du feu.", d: "4" }] }],
      ["proof:quotes", { items: [{ q: "Enfin des quantités justes et des étapes claires.", n: "Marion", r: "lectrice, client fictif" }, { q: "Mes enfants réclament le dahl chaque semaine.", n: "Antoine", r: "lecteur, client fictif" }, { q: "J'ai réussi mon premier pain.", n: "Soraya", r: "lectrice, client fictif" }] }],
      ["cta:split", { title: "Les menus de la semaine, le dimanche", sub: "Une liste de courses imprimable et cinq idées de repas.", cta: ["Recevoir la lettre", "/contact"] }],
    ] },
    { key: "recettes", name: "Recettes", blocks: [
      ["misc:pagehead", { title: "Toutes les recettes", sub: "Entrées, plats, desserts, pains et conserves." }],
      ["feat:strips", { title: "Par envie", items: [{ t: "Rapide en semaine", x: "Moins de 30 minutes, une seule poêle." }, { t: "Pour recevoir", x: "À préparer la veille, à servir sans stress." }, { t: "Végétarien", x: "Légumes, légumineuses et céréales complètes." }, { t: "Douceurs", x: "Gâteaux, tartes et goûters." }] }],
      ["misc:posts", { title: "Les plus récentes", count: 6, layout: "grid" }],
      ["misc:search", { title: "Chercher un ingrédient, un plat" }],
    ] },
    { key: "recette", name: "La recette du jour", blocks: [
      ["misc:pagehead", { title: "Velouté de potimarron", sub: "4 personnes · 15 min de préparation · 25 min de cuisson" }],
      ["misc:article", { tag: "Soupe", title: "Velouté de potimarron, noisettes et fenouil rôti", meta: "Par Capucine · testé trois fois", paras: ["Ingrédients : 1 kg de potimarron, 1 oignon, 1 bulbe de fenouil, 80 cl de bouillon, 40 g de noisettes, 2 c. à soupe d'huile d'olive, sel, poivre.", "Étape 1. Coupez le potimarron en cubes sans l'éplucher, il est tendre à la cuisson. Faites revenir l'oignon cinq minutes, ajoutez la courge et le bouillon, laissez frémir vingt minutes.", "Étape 2. Rôtissez le fenouil en lamelles à 200 °C pendant quinze minutes. Mixez la soupe, servez avec les lamelles et des noisettes concassées."], quote: "Le secret : garder la peau, elle apporte le goût.", by: "Capucine" }],
      ["cta:band", { title: "Une question sur la recette ?", sub: "Écrivez-moi, je réponds avec plaisir.", cta: ["Me poser la question", "/contact"] }],
    ] },
    { key: "techniques", name: "Techniques", blocks: [
      ["misc:pagehead", { title: "Techniques de base", sub: "Les gestes qui changent tout." }],
      ["feat:accordion", { title: "Questions de cuisine", items: [{ t: "Comment bien saisir une viande ?", x: "Poêle très chaude, viande sèche, et ne pas la retourner avant qu'elle se décolle seule." }, { t: "Pourquoi mon gâteau retombe-t-il ?", x: "Le plus souvent, la porte du four a été ouverte trop tôt ou la pâte est trop battue." }, { t: "Comment conserver les herbes fraîches ?", x: "Debout dans un verre d'eau, couvertes d'un sachet, au réfrigérateur." }, { t: "Cuisson parfaite des légumes verts ?", x: "Eau très salée, cuisson brève, puis bain d'eau glacée." }] }],
      ["feat:list2", { title: "Mon placard de base", items: [{ t: "Huile d'olive et vinaigre de cidre" }, { t: "Lentilles, pois chiches, riz complet" }, { t: "Épices : cumin, paprika, curcuma" }, { t: "Tomates concassées en boîte" }] }],
    ] },
    { key: "a-propos", name: "Mon histoire", blocks: [
      ["misc:pagehead", { title: "Mon histoire" }],
      ["misc:story", { eyebrow: "Depuis 2019", title: "Une cuisine d'appartement et beaucoup de ratés", paras: ["J'ai appris à cuisiner avec ma grand-mère, puis seule dans un studio de douze mètres carrés. Ce blog garde la trace de mes essais, y compris des échecs.", "Toutes les recettes sont testées au moins trois fois avant publication."], image: "portrait-1" }],
      ["proof:stats", { items: [["320", "recettes publiées"], ["3", "essais minimum"], ["15 000", "lecteurs par mois (exemple)"]] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact", sub: "Une idée de recette, une question, une collaboration." }],
      ["contact:info", { title: "Écrivez-moi", formTitle: "Votre message", formIntro: "Précisez la recette concernée, je vous réponds vite.", cta: ["Envoyer", "/contact"] }],
      ["misc:hours", { title: "Quand je réponds", rows: [["Lundi", "Matin"], ["Jeudi", "Après-midi"], ["Autres jours", "En cuisine"]] }],
    ] },
  ],
});

// 5. Blog lifestyle
T.push({
  key: "slow-matin", name: "Slow Matin", category: "magazine", tags: ["minimaliste", "chaleureux"], siteType: "Blog lifestyle",
  description: "Blog lifestyle posé : rose bois de rose sur blanc rosé, fines capitales serif, beaucoup d'air et grandes marges. Rituels, maison, bien-être et petites habitudes.",
  brand: "Slow Matin",
  tokens: { colors: { primary: "#be185d", secondary: "#3d2530", accent: "#a16207", background: "#fdf6f4", surface: "#ffffff", text: "#2f2128", muted: "#65525a" }, fonts: { heading: "font.cormorant-garamond", body: "font.josefin-sans", button: "font.josefin-sans", link: "font.josefin-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 999, field: 8, card: 10 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 70, weight: 500, lineHeight: 1.02, letterSpacing: -0.01 }, h2: { size: 42, weight: 500, lineHeight: 1.1, letterSpacing: 0 } } },
  dna: { scale: "xl", pad: "airy", align: "center", shape: "pill" }, art: { seed: "slow-matin", motifs: ["blobs", "botanical", "bokeh"] },
  head: ["head:float", {}], foot: ["foot:center", {}],
  menu: [["Accueil", "/"], ["Rituels", "/rituels"], ["Maison", "/maison"], ["Un billet", "/billet"], ["Contact", "/contact"]], cta: ["La lettre", "/contact"],
  contact: { address: "Atelier de la Treille, 34000 Montpellier", phone: "04 67 00 55 55", email: "coucou@slow-matin.example", hours: "Réponse le mercredi", tagline: "Ralentir sans renoncer." },
  social: ["instagram"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:minimal", { eyebrow: "Le blog des matins calmes", title: "Prendre le temps, une habitude à la fois", sub: "Rituels, maison, lectures et petits plaisirs pour celles et ceux qui veulent ralentir sans tout changer.", cta: ["Lire le dernier billet", "/billet"] }],
      ["feat:grid-icons", { title: "Quatre terrains d'exploration", items: [{ t: "Rituels", x: "Matin, soir, dimanche : des routines douces.", icon: "sun" }, { t: "Maison", x: "Ranger, aérer, habiller son intérieur.", icon: "home" }, { t: "Lectures", x: "Livres, podcasts et films à savourer.", icon: "book" }, { t: "Bien-être", x: "Sommeil, respiration, marche quotidienne.", icon: "heart" }] }],
      ["gal:masonry", { title: "Instants de la semaine", items: [{ t: "Tasse de thé" }, { t: "Plaid de lin" }, { t: "Plantes en pot" }, { t: "Carnet ouvert" }, { t: "Bougie" }, { t: "Fenêtre" }] }],
      ["misc:posts", { title: "Derniers billets", count: 6, layout: "grid" }],
      ["proof:quotes", { items: [{ q: "Mon rendez-vous du dimanche soir.", n: "Julie", r: "lectrice, client fictif" }, { q: "Des conseils qu'on peut vraiment tenir.", n: "Mehdi", r: "lecteur, client fictif" }, { q: "Un blog qui apaise.", n: "Constance", r: "lectrice, client fictif" }] }],
      ["cta:band", { title: "La lettre du dimanche", sub: "Un rituel, une lecture, une idée pour la semaine.", cta: ["Je m'abonne", "/contact"] }],
    ] },
    { key: "rituels", name: "Rituels", blocks: [
      ["misc:pagehead", { title: "Rituels", sub: "Des routines simples, à adapter." }],
      ["feat:numbered", { title: "Le matin idéal en trois gestes", items: [{ t: "Ouvrir la fenêtre", x: "Cinq minutes d'air frais avant tout écran." }, { t: "Boire un verre d'eau", x: "Chaude ou tiède, sans rien d'autre." }, { t: "Écrire trois lignes", x: "Une intention, une gratitude, une envie." }] }],
      ["misc:posts", { title: "Tous les rituels", count: 6, layout: "list" }],
      ["misc:search", { title: "Chercher un thème" }],
    ] },
    { key: "maison", name: "Maison", blocks: [
      ["misc:pagehead", { title: "Maison", sub: "Un intérieur qui respire." }],
      ["feat:alt", { title: "Idées du mois", items: [{ t: "Un coin lecture en trente minutes", x: "Fauteuil, lampe chaude et pile de livres." }, { t: "Désencombrer sans stress", x: "Une boîte par semaine, jamais plus." }, { t: "Cuisiner avec les saisons", x: "Marché, paniers et placards organisés." }] }],
      ["gal:wall", { items: [{ t: "Lin" }, { t: "Céramique" }, { t: "Bois" }, { t: "Verre" }] }],
      ["cta:card", { title: "Envie d'un conseil personnalisé ?", sub: "Décrivez-moi votre pièce, je vous réponds par mail.", cta: ["Écrire", "/contact"] }],
    ] },
    { key: "billet", name: "Un billet", blocks: [
      ["misc:pagehead", { title: "Billet du dimanche", sub: "Rituels · 5 min de lecture" }],
      ["misc:article", { tag: "Rituel", title: "Marcher dix minutes avant le travail", meta: "Par Éloïse · publié un dimanche", paras: ["Il y a un an, j'ai remplacé mon premier café par une marche sans destination. Dix minutes, sans écouteurs, avec pour seule consigne de regarder.", "Trois semaines ont suffi pour que le trajet devienne un repère. Je commence à travailler plus calmement, et le soir j'ai moins de choses à digérer.", "Si vous voulez essayer, commencez par cinq minutes. Le plus dur est de sortir."], quote: "Ce n'est pas du temps perdu, c'est du temps rendu.", by: "Éloïse" }],
      ["cta:split", { title: "Recevez le prochain billet", sub: "Un seul courriel par semaine.", cta: ["La lettre", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact", sub: "Un mot, une suggestion, une collaboration éthique." }],
      ["contact:info", { title: "Dites bonjour", formTitle: "Votre message", formIntro: "Je lis tout, je réponds le mercredi.", cta: ["Envoyer", "/contact"] }],
      ["feat:checks", { title: "Collaborations", cta: ["Proposer un projet", "/contact"], items: [{ t: "Marques éthiques et locales" }, { t: "Produits testés avant d'être évoqués" }, { t: "Mentions toujours signalées" }] }],
    ] },
  ],
});

// 6. Blog de finance personnelle
T.push({
  key: "sou-par-sou", name: "Sou par Sou", category: "magazine", tags: ["moderne", "editorial"], siteType: "Blog de finance personnelle",
  description: "Blog de finance personnelle pédagogique : bleu franc sur gris clair, serif de lecture et tableaux de chiffres nets. Budget, épargne et retraite expliqués sans jargon.",
  brand: "Sou par Sou",
  tokens: { colors: { primary: "#1d4ed8", secondary: "#0f1f3d", accent: "#b45309", background: "#f5f8fc", surface: "#ffffff", text: "#13203a", muted: "#4a5a75" }, fonts: { heading: "font.ibm-plex-serif", body: "font.urbanist", button: "font.urbanist", link: "font.urbanist" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d5deec" }, type: { h1: { size: 52, weight: 600, lineHeight: 1.1, letterSpacing: -0.015 } } },
  dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "sou-par-sou", motifs: ["tiles", "skyline", "rays"] },
  head: ["head:side", {}], foot: ["foot:simple", {}],
  menu: [["Accueil", "/"], ["Guides", "/guides"], ["Comparatifs", "/comparatifs"], ["Un article", "/article"], ["La lettre", "/contact"]], cta: ["S'inscrire", "/contact"],
  contact: { address: "22 rue de la Bourse, 59000 Lille", phone: "03 20 00 66 66", email: "redaction@sou-par-sou.example", hours: "Du lundi au vendredi, 9 h – 17 h", tagline: "Comprendre son argent pour mieux le faire travailler." },
  social: ["linkedin", "youtube"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:stacked", { eyebrow: "Éducation financière", title: "Reprenez la main sur votre budget en trente jours", sub: "Des guides clairs, des chiffres vérifiables et des exemples réels pour épargner, investir prudemment et préparer l'avenir.", cta: ["Commencer le défi", "/guides"], cta2: ["Les comparatifs", "/comparatifs"], stats: [["30 jours", "pour un budget qui tient"], ["12 guides", "gratuits"], ["0 €", "de commission"]] }],
      ["feat:rows", { eyebrow: "Par où commencer", title: "Trois étapes avant d'investir", items: [{ t: "Connaître ses dépenses", x: "Trois mois de relevés suffisent pour voir où part l'argent." }, { t: "Constituer une épargne de précaution", x: "Entre trois et six mois de dépenses, disponibles à tout moment." }, { t: "Choisir ses placements", x: "Seulement ensuite, selon l'horizon et la tolérance au risque." }] }],
      ["proof:stats", { title: "Le blog en chiffres (exemples)", items: [["210", "articles"], ["48 000", "lecteurs mensuels"], ["6 ans", "d'existence"]] }],
      ["misc:posts", { title: "Derniers articles", count: 6, layout: "list" }],
      ["feat:compare", { title: "Épargne : l'essentiel (exemple pédagogique)", rows: [["", "Livret réglementé", "Assurance-vie"], ["Disponibilité", "Immédiate", "Rachat possible"], ["Risque", "Nul", "Selon supports"], ["Horizon conseillé", "Court terme", "8 ans et plus"]] }],
      ["cta:card", { title: "Recevez le budget type en tableur", sub: "Gratuit, à remplir en dix minutes. Contenu éducatif, sans conseil personnalisé.", cta: ["Le recevoir", "/contact"] }],
    ] },
    { key: "guides", name: "Guides", blocks: [
      ["misc:pagehead", { title: "Guides pratiques", sub: "Du budget à la retraite." }],
      ["misc:story", { eyebrow: "À propos", title: "Une rédaction indépendante", paras: ["Nous publions sans publicité et sans conflit d'intérêts, au rythme des lecteurs."], image: "portrait-1" }],
      ["feat:icons", { title: "Nos thématiques", items: [{ t: "Budget", x: "Méthode 50-30-20, suivi mensuel, catégories.", icon: "calculator" }, { t: "Épargne", x: "Précaution, projets, objectifs chiffrés.", icon: "coin" }, { t: "Investir", x: "Principes de diversification, frais, durée.", icon: "trendingUp" }, { t: "Retraite", x: "Comprendre ses droits et ses relevés.", icon: "calendarClock" }] }],
      ["misc:posts", { title: "Tous les guides", count: 6, layout: "grid" }],
      ["misc:search", { title: "Chercher un sujet" }],
    ] },
    { key: "comparatifs", name: "Comparatifs", blocks: [
      ["misc:pagehead", { title: "Comparatifs", sub: "Frais, conditions, avis détaillés." }],
      ["feat:pricelist", { title: "Frais moyens constatés (exemples)", items: [{ t: "Compte courant en ligne", x: "Carte incluse", price: "0 à 3 €/mois" }, { t: "Compte en agence", x: "Carte et conseil", price: "8 à 15 €/mois" }, { t: "Assurance-vie en ligne", x: "Frais sur versement", price: "0 %" }, { t: "Gestion sous mandat", x: "Frais annuels", price: "1 à 2 %" }] }],
      ["feat:checks", { title: "Comment nous comparons", cta: ["Notre méthode", "/article"], items: [{ t: "Tarifs relevés chaque trimestre" }, { t: "Conditions lues en entier" }, { t: "Aucune commission cachée" }] }],
    ] },
    { key: "article", name: "Un article", blocks: [
      ["misc:pagehead", { title: "Article", sub: "Épargne · 7 min de lecture" }],
      ["misc:article", { tag: "Épargne", title: "Combien mettre de côté chaque mois ?", meta: "Par Nadia Kerloc'h · éducation financière, pas un conseil personnalisé", paras: ["La règle 50-30-20 propose de consacrer la moitié du revenu aux besoins, trente pour cent aux envies et vingt pour cent à l'épargne. C'est un point de départ, non un dogme.", "Pour un ménage à 2 400 € nets, cela donne 480 € d'épargne mensuelle. Si c'est trop, commencez à 5 % : la régularité compte davantage que le montant.", "Automatisez le virement le jour de la paie, c'est la seule astuce qui ne dépend pas de la volonté."], quote: "On n'épargne pas ce qui reste, on dépense ce qui reste.", by: "Nadia Kerloc'h" }],
      ["cta:band", { title: "Ce contenu est informatif", sub: "Pour un conseil sur mesure, rapprochez-vous d'un conseiller agréé.", cta: ["Nous contacter", "/contact"] }],
    ] },
    { key: "contact", name: "La lettre", blocks: [
      ["misc:pagehead", { title: "La lettre et le contact", sub: "Un courriel par semaine, sans démarchage." }],
      ["contact:info", { title: "Nous écrire", formTitle: "Votre message", formIntro: "Question sur un article ou suggestion de sujet.", cta: ["Envoyer", "/contact"] }],
      ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Êtes-vous conseillers financiers ?", x: "Non. Le contenu est éducatif et ne remplace pas un avis personnalisé." }, { t: "Comment le blog est-il financé ?", x: "Par une lettre premium d'exemple et des partenariats clairement signalés." }] }],
    ] },
  ],
});

// 7. Magazine de mode
T.push({
  key: "trame-et-ourlet", name: "Trame & Ourlet", category: "magazine", tags: ["luxe", "editorial"], siteType: "Magazine de mode",
  description: "Magazine de mode en noir profond sur blanc : affiche typographique, serif de défilé, filets or discrets et photos plein cadre. Pour collections, coulisses et portraits de créateurs.",
  brand: "Trame & Ourlet",
  tokens: { colors: { primary: "#1c1917", secondary: "#0c0a09", accent: "#a16207", background: "#ffffff", surface: "#f5f5f4", text: "#1c1917", muted: "#57534e" }, fonts: { heading: "font.prata", body: "font.raleway", button: "font.raleway", link: "font.raleway" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d6d3d1" }, type: { h1: { size: 72, weight: 400, lineHeight: 1, letterSpacing: -0.02, transform: "uppercase" }, h2: { size: 38, weight: 400, lineHeight: 1.12, letterSpacing: 0.02 } } },
  dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "trame-ourlet", motifs: ["ribbons", "halftone", "arches"] },
  head: ["head:split", {}], foot: ["foot:columns", { about: "Magazine de mode indépendant : défilés, ateliers, matières et portraits, sans diktat de saison.", cols: [["Magazine", "Collections", "Coulisses", "Portraits"], ["Maison", "Contact", "Presse", "Mentions"]] }],
  menu: [["Une", "/"], ["Collections", "/collections"], ["Coulisses", "/coulisses"], ["Portrait", "/portrait"], ["Contact", "/contact"]], cta: ["La newsletter", "/contact"],
  contact: { address: "5 rue du Mail, 75002 Paris", phone: "01 40 00 77 77", email: "mode@trame-ourlet.example", hours: "Du lundi au vendredi, 10 h – 18 h", tagline: "La mode comme un artisanat." },
  social: ["instagram"],
  pages: [
    { key: "accueil", name: "Une", blocks: [
      ["hero:poster", { eyebrow: "Automne – hiver", title: "La laine reprend le pouvoir", sub: "Manteaux enveloppants, mailles épaisses et tailleurs lâches : douze silhouettes et trois ateliers à suivre.", cta: ["Voir la collection", "/collections"] }],
      ["misc:marquee", { items: ["Défilés", "Matières", "Ateliers", "Seconde main", "Portraits", "Coulisses"] }],
      ["gal:featured", { title: "Les silhouettes de la saison", items: [{ t: "Manteau long camel" }, { t: "Maille côtelée" }, { t: "Pantalon plissé" }, { t: "Bottines cuir" }] }],
      ["feat:alt", { eyebrow: "À lire", title: "Nos grands formats", items: [{ t: "Dans l'atelier d'une tricoteuse", x: "Six semaines pour un pull, de la tonte au dernier point.", link: ["Lire", "/coulisses"] }, { t: "Mode durable, le vrai du faux", x: "Ce que disent les étiquettes et ce qu'elles taisent.", link: ["Lire", "/portrait"] }] }],
      ["misc:posts", { title: "Derniers articles", count: 4, layout: "list" }],
      ["proof:logos", { title: "Ils figurent dans nos pages (marques fictives)", items: ["Maison Aubier", "Atelier Cendre", "Fil de Lune", "Studio Marle", "Orme & Co"] }],
      ["cta:image", { title: "Le carnet de mode, une fois par mois", sub: "Tendances, adresses et ateliers à découvrir.", cta: ["S'abonner", "/contact"] }],
    ] },
    { key: "collections", name: "Collections", blocks: [
      ["misc:pagehead", { title: "Collections", sub: "Les défilés vus par la rédaction." }],
      ["gal:grid", { title: "Looks marquants", items: [{ t: "Tailleur oversize" }, { t: "Robe en maille" }, { t: "Cape de laine" }, { t: "Cuir souple" }, { t: "Velours côtelé" }, { t: "Manteau croisé" }] }],
      ["misc:posts", { title: "Toutes les chroniques", count: 6, layout: "grid" }],
      ["misc:search", { title: "Chercher une maison, un créateur" }],
    ] },
    { key: "coulisses", name: "Coulisses", blocks: [
      ["misc:pagehead", { title: "Coulisses", sub: "Ce qui se passe avant le défilé." }],
      ["feat:steps", { title: "De l'idée au podium", items: [{ t: "Le croquis", x: "Une semaine de recherches sur papier.", d: "Janvier" }, { t: "La toile", x: "Premier prototype en coton écru.", d: "Mars" }, { t: "Le choix des matières", x: "Visites de fabricants de laine.", d: "Mai" }, { t: "Le défilé", x: "Quatorze minutes, vingt-deux passages.", d: "Septembre" }] }],
      ["misc:hours", { title: "Jour J (exemple)", rows: [["Coiffure et maquillage", "6 h"], ["Essayages", "9 h"], ["Répétition", "13 h"], ["Défilé", "17 h"]] }],
    ] },
    { key: "portrait", name: "Portrait", blocks: [
      ["misc:pagehead", { title: "Portrait", sub: "Créatrice · 10 min de lecture" }],
      ["misc:article", { tag: "Portrait", title: "Anouk Valadier, la couture lente", meta: "Par Iris Lemoine · atelier de Roubaix (personnage fictif)", paras: ["Anouk Valadier coud debout, devant un mur de tissus classés par couleur. Elle refuse la saisonnalité : une pièce ne sort que lorsqu'elle est prête.", "Ses manteaux sont taillés dans des draps de laine de fin de série, cousus à la main. Chaque pièce porte le prénom de la couturière.", "Elle vend peu mais à des prix qui permettent de payer correctement ses ouvrières."], quote: "Un vêtement bien fait n'a pas besoin de saison.", by: "Anouk Valadier" }],
      ["cta:band", { title: "Un créateur à nous suggérer ?", sub: "Parlez-nous de votre atelier.", cta: ["Écrire", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact", sub: "Rédaction, presse, partenariats." }],
      ["contact:cards", { title: "Nous écrire" }],
      ["feat:list2", { title: "Nous cherchons", items: [{ t: "Photographes de mode indépendants" }, { t: "Stylistes de studio" }, { t: "Journalistes textile" }, { t: "Illustrateurs" }] }],
    ] },
  ],
});

// 8. Blog d'opinion / essais
T.push({
  key: "marge-gauche", name: "Marge Gauche", category: "magazine", tags: ["editorial", "minimaliste"], siteType: "Blog d'opinion et d'essais",
  description: "Blog d'essais sobre : vert profond sur papier ivoire, Spectral pour la lecture longue, colonne étroite, citations en exergue. Chroniques, billets d'humeur et lectures commentées.",
  brand: "Marge Gauche",
  tokens: { colors: { primary: "#0f766e", secondary: "#1c2b29", accent: "#9a3412", background: "#fbfaf6", surface: "#ffffff", text: "#1f2926", muted: "#556260" }, fonts: { heading: "font.spectral", body: "font.cabin", button: "font.cabin", link: "font.cabin" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d8ded9" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.1, letterSpacing: -0.01 }, body: { size: 18 } } },
  dna: { scale: "m", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "marge-gauche", motifs: ["topo", "plates", "waves"] },
  head: ["head:minimal", {}], foot: ["foot:simple", {}],
  menu: [["Accueil", "/"], ["Chroniques", "/chroniques"], ["Un essai", "/essai"], ["Lectures", "/lectures"], ["Qui écrit", "/a-propos"]], cta: ["Correspondre", "/contact"],
  contact: { address: "Boîte postale 18, 67000 Strasbourg", phone: "03 88 00 88 88", email: "courrier@marge-gauche.example", hours: "Réponse sous une semaine", tagline: "Penser lentement, écrire clairement." },
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:center", { eyebrow: "Billets, essais, lectures", title: "Écrire pour comprendre ce que nous pensons", sub: "Un blog indépendant où chaque texte part d'une question : le travail, l'attention, la ville, la langue. Sans clics, sans slogans.", cta: ["Lire le dernier essai", "/essai"], cta2: ["Les chroniques", "/chroniques"] }],
      ["misc:text", { eyebrow: "Ligne éditoriale", title: "Trois engagements", paras: ["Un texte par semaine, jamais plus. Chaque billet est relu et daté, les corrections sont signalées en bas de page.", "Les désaccords sont bienvenus. Les commentaires sont remplacés par un courrier lu et parfois publié."] }],
      ["misc:posts", { title: "Textes récents", count: 6, layout: "list" }],
      ["feat:rows", { eyebrow: "Séries", title: "Les fils conducteurs", items: [{ t: "Éloge de l'ennui", x: "Dix textes sur le temps vide et ce qu'il produit." }, { t: "La ville à hauteur de piéton", x: "Marcher, s'asseoir, traverser : une politique du quotidien." }, { t: "Mots de travail", x: "Comment le vocabulaire de l'entreprise colonise la langue." }] }],
      ["proof:big", { items: [{ q: "Le seul blog que je lis jusqu'au bout.", n: "Lecteur fidèle", r: "témoignage fictif" }] }],
      ["cta:split", { title: "Recevoir chaque texte par courriel", sub: "Un message par semaine, rien d'autre.", cta: ["S'inscrire", "/contact"] }],
    ] },
    { key: "chroniques", name: "Chroniques", blocks: [
      ["misc:pagehead", { title: "Chroniques", sub: "Du plus récent au plus ancien." }],
      ["misc:posts", { title: "Toutes les chroniques", count: 6, layout: "grid" }],
      ["feat:list2", { title: "Thèmes récurrents", items: [{ t: "Travail et temps" }, { t: "Ville et espace public" }, { t: "Langue et pouvoir" }, { t: "Écrans et attention" }] }],
      ["misc:search", { title: "Chercher un sujet, un mot" }],
    ] },
    { key: "essai", name: "Un essai", blocks: [
      ["misc:pagehead", { title: "Essai", sub: "Attention · 11 min de lecture" }],
      ["misc:article", { tag: "Essai", title: "Ce que nous coûte l'attention permanente", meta: "Par Étienne Mathis · dimanche matin", paras: ["Nous parlons volontiers du temps perdu, rarement de l'attention dispersée. Pourtant, c'est elle qui conditionne la manière dont nous lisons, travaillons et aimons.", "Une notification n'interrompt pas seulement une tâche : elle réécrit l'intention. On se demandait où l'on allait, on se retrouve à répondre.", "Défendre l'attention, ce n'est pas fuir le monde. C'est décider de ce qui mérite de l'habiter."], quote: "Se concentrer est un acte politique modeste.", by: "Étienne Mathis" }],
      ["cta:card", { title: "Ce texte vous a fait réagir ?", sub: "Écrivez-moi, je réponds à chaque courrier.", cta: ["Correspondre", "/contact"] }],
    ] },
    { key: "lectures", name: "Lectures", blocks: [
      ["misc:pagehead", { title: "Lectures", sub: "Ce qui nourrit les textes." }],
      ["feat:strips", { title: "Sur la table de chevet", items: [{ t: "Un essai sur la lenteur", x: "Court, dense, à lire en deux soirs." }, { t: "Un roman de bureau", x: "Satire douce du monde du travail." }, { t: "Un recueil de chroniques", x: "Écrit par une journaliste disparue." }] }],
      ["misc:quote", { text: "Lire, c'est écrire avec les yeux des autres.", by: "Carnet de lecture" }],
      ["misc:posts", { title: "Notes de lecture", count: 3, layout: "list" }],
    ] },
    { key: "a-propos", name: "Qui écrit", blocks: [
      ["misc:pagehead", { title: "Qui écrit" }],
      ["misc:story", { eyebrow: "L'auteur", title: "Un enseignant devenu chroniqueur", paras: ["Professeur de philosophie en lycée pendant quinze ans, j'écris ici ce que mes élèves m'ont appris à expliquer plus simplement.", "Aucun financement, aucune publicité : le blog vit de la bonne volonté de ses lecteurs."], image: "portrait-3" }],
      ["contact:info", { title: "Correspondre", formTitle: "Un courrier", formIntro: "Longue ou brève, une réponse vaut mieux qu'un commentaire.", cta: ["Envoyer", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Correspondre", sub: "Par courrier électronique ou postal." }],
      ["contact:map", { title: "Écrire à la boîte postale", mapAddress: "Boîte postale 18, 67000 Strasbourg" }],
      ["misc:text", { title: "Règles du courrier", paras: ["Chaque message reçoit une réponse. Certains sont publiés avec accord, sous initiales.", "Les propositions de textes invités sont étudiées à la fin de chaque trimestre."] }],
    ] },
  ],
});

// 9. Webzine musique
T.push({
  key: "decibel-sauvage", name: "Décibel Sauvage", category: "magazine", tags: ["sombre", "audacieux"], siteType: "Webzine musique et concerts",
  description: "Webzine musical nocturne : jaune électrique sur noir chaud, titres Anton en capitales massives et compte à rebours de festival. Chroniques de disques, live reports et agenda des concerts.",
  brand: "Décibel Sauvage",
  tokens: { colors: { primary: "#facc15", secondary: "#000000", accent: "#f43f5e", background: "#0c0a09", surface: "#1c1917", text: "#fafaf9", muted: "#b8b0a8" }, fonts: { heading: "font.anton", body: "font.rubik", button: "font.anton", link: "font.rubik" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#3a3430" }, type: { h1: { size: 76, weight: 400, lineHeight: 0.98, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 44, weight: 400, lineHeight: 1.05, letterSpacing: 0.02, transform: "uppercase" } } },
  dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "decibel", motifs: ["halftone", "rays", "tiles"] },
  head: ["head:center", {}], foot: ["foot:newsletter", { title: "Le bruit de la semaine", sub: "Chaque lundi : trois chroniques, cinq dates, un titre à écouter fort.", button: "Nous écrire" }],
  menu: [["Une", "/"], ["Chroniques", "/chroniques"], ["Live", "/live"], ["Interview", "/interview"], ["Contact", "/contact"]], cta: ["Proposer un groupe", "/contact"],
  contact: { address: "3 passage des Amplis, 35000 Rennes", phone: "02 99 00 99 99", email: "bruit@decibel-sauvage.example", hours: "Du lundi au vendredi, 11 h – 19 h", tagline: "Du bruit, du vrai, des groupes qu'on ne verra pas à la télé." },
  social: ["instagram", "youtube"],
  pages: [
    { key: "accueil", name: "Une", blocks: [
      ["hero:countdown", { eyebrow: "Festival des Nuits Brutes", title: "Trois jours de guitares dans une carrière", sub: "Vingt-deux groupes, deux scènes et un camping. Notre guide complet, les horaires et les pépites à ne pas rater.", cta: ["Le programme", "/live"], cta2: ["Les chroniques", "/chroniques"], until: "2027-07-09T18:00:00+02:00" }],
      ["misc:posts", { title: "Fraîchement sortis", count: 6, layout: "grid" }],
      ["feat:strips", { eyebrow: "Rubriques", title: "Ce qu'on couvre", items: [{ t: "Chroniques de disques", x: "Notes sur vingt, sans pitié et sans snobisme." }, { t: "Live reports", x: "Reportages de salles, de caves et de festivals." }, { t: "Scène locale", x: "Les groupes de garage de la région, enfin racontés." }, { t: "Entretiens", x: "Des musiciens qui racontent la création sans filtre." }] }],
      ["gal:wall", { items: [{ t: "Salle comble" }, { t: "Pédalier" }, { t: "Backstage" }, { t: "Vinyle" }] }],
      ["proof:quotes", { items: [{ q: "On y découvre les groupes six mois avant tout le monde.", n: "Lecteur", r: "client fictif" }, { q: "Les chroniques les plus honnêtes du web.", n: "Chloé", r: "lectrice, client fictive" }, { q: "J'ai trouvé mon groupe préféré ici.", n: "Gaëtan", r: "lecteur, client fictif" }] }],
      ["cta:band", { title: "Votre groupe mérite une chronique", sub: "Envoyez-nous un lien d'écoute, nous écoutons tout.", cta: ["Proposer un morceau", "/contact"] }],
    ] },
    { key: "chroniques", name: "Chroniques", blocks: [
      ["misc:pagehead", { title: "Chroniques", sub: "Albums, EP, rééditions." }],
      ["misc:posts", { title: "Dernières chroniques", count: 6, layout: "list" }],
      ["feat:pricelist", { title: "Le barème de notation", items: [{ t: "17 à 20", x: "Indispensable", price: "★★★★★" }, { t: "14 à 16", x: "À écouter sans attendre", price: "★★★★" }, { t: "10 à 13", x: "Pour les fans du genre", price: "★★★" }, { t: "Moins de 10", x: "Passez votre chemin", price: "★" }] }],
      ["misc:search", { title: "Chercher un groupe, un titre" }],
    ] },
    { key: "live", name: "Live", blocks: [
      ["misc:pagehead", { title: "Live et festival", sub: "Programme d'exemple des Nuits Brutes." }],
      ["misc:schedule", { title: "Vendredi", items: [{ d: "17 h", t: "Ouverture des portes", x: "Camping et restauration locale." }, { d: "19 h 30", t: "Groupe de garage rennais", x: "Scène de la carrière." }, { d: "21 h", t: "Duo noise-rock", x: "Scène couverte." }, { d: "23 h 30", t: "Tête d'affiche", x: "Clôture de la première soirée." }] }],
      ["gal:cards", { title: "Les pépites à guetter", items: [{ t: "Quintette post-punk", tag: "Samedi", x: "Un premier album tendu comme un fil." }, { t: "Fanfare électrique", tag: "Dimanche", x: "Quinze musiciens, zéro compromis." }, { t: "Rappeur de Brest", tag: "Samedi", x: "Textes ciselés, basses lourdes." }] }],
    ] },
    { key: "interview", name: "Interview", blocks: [
      ["misc:pagehead", { title: "Interview", sub: "Scène locale · 6 min de lecture" }],
      ["misc:article", { tag: "Entretien", title: "« On a enregistré l'album dans un garage sans isolation »", meta: "Par Axel Perrin · groupe fictif Cendre Rouge", paras: ["Le quatuor se retrouve dans un local de répétition où la peinture s'écaille. Au mur, une affiche de concert de 2014 et un radiateur capricieux.", "L'album a été enregistré en trois nuits, sans clic ni correction. Les erreurs restent, assumées.", "Ils préparent maintenant une tournée de vingt dates, dans les cafés-concerts et les salles de quartier."], quote: "Si on pouvait tout rejouer, on gâcherait ce qui fait tenir le disque.", by: "Cendre Rouge (groupe fictif)" }],
      ["cta:image", { title: "Écoutez la playlist de la semaine", sub: "Quinze titres, du plus calme au plus fort.", cta: ["Nous écrire", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact", sub: "Envois, dates de concerts, collaborations." }],
      ["contact:info", { title: "Envoyer un morceau", formTitle: "Votre message", formIntro: "Joignez un lien d'écoute privé, jamais de fichier lourd.", cta: ["Envoyer", "/contact"] }],
      ["feat:checks", { title: "Pour être chroniqué", cta: ["Nous écrire", "/contact"], items: [{ t: "Un lien d'écoute privé" }, { t: "Dates de sortie et de concert" }, { t: "Quelques lignes de présentation" }] }],
    ] },
  ],
});

module.exports = T;
