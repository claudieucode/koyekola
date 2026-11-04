// Tourisme (lot B, 9 thèmes). Textes de DÉMONSTRATION : agences, offres, tarifs, personnes et coordonnées fictifs ; aucune réservation ni paiement simulé (les demandes passent par le formulaire de contact).
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const F = (h, b) => ({ heading: "font." + h, body: "font." + b, button: "font." + b, link: "font." + b });

module.exports = [
  // 1. CARNETS DE PASSAGE — agence de voyages sur mesure, éditorial
  {
    key: "passage-carnet", name: "Carnets de Passage", category: "tourisme", tags: ["editorial", "luxe"], siteType: "Agence de voyages sur mesure",
    description: "Agence de voyages sur mesure au ton de carnet de bord : grand titre éditorial en Cormorant, prune et or sur crème, sections aérées et itinéraires racontés plutôt que vendus.",
    brand: "Carnets de Passage",
    tokens: { colors: { primary: "#8f2d56", secondary: "#3a1424", accent: "#c9953a", background: "#fbf6f0", surface: "#ffffff", text: "#2a1a20", muted: "#6a5560" }, fonts: F("cormorant-garamond", "rethink-sans"), radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 500, lineHeight: 1.0, letterSpacing: -0.01, transform: "none" } }, border: { width: 1, color: "#eadfd3" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "passage-carnet", motifs: ["arches", "topo", "ribbons"] },
    head: ["head:center", {}], foot: ["foot:big", { title: "Carnets de Passage" }],
    menu: [["Accueil", "/"], ["Voyages", "/voyages"], ["Notre méthode", "/methode"], ["Conseillers", "/conseillers"], ["Contact", "/contact"]], cta: ["Écrire mon voyage", "/contact"],
    contact: { address: "9 rue des Dames Blanches, 37000 Tours", phone: "02 47 00 31 52", email: "voyages@carnetsdepassage.example", hours: "Du mardi au samedi, 10 h – 18 h", tagline: "Votre voyage, écrit à la main." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Voyages sur mesure depuis 2009", title: "Partir, mais à votre manière.", sub: "Un conseiller unique compose votre itinéraire, hôtel après hôtel, de l'idée au retour.", cta: ["Raconter mon projet", "/contact"], cta2: ["Voir des voyages", "/voyages"] }],
        ["feat:rows", { eyebrow: "Notre approche", title: "Trois promesses de carnet", items: [{ t: "Un seul interlocuteur", x: "Le conseiller qui vous écoute est celui qui vous accompagne jusqu'au retour." }, { t: "Aucun circuit sur étagère", x: "Chaque itinéraire est dessiné pour vous : rythme, hébergements, rencontres." }, { t: "Des adresses vérifiées", x: "Nos conseillers dorment dans les lieux qu'ils recommandent." }] }],
        ["gal:featured", { title: "Itinéraires récents", items: [{ t: "Sicile, côté pierre et sel", x: "Neuf jours entre Syracuse et les salines." }, { t: "Géorgie, tables et vallées", x: "Vignerons, monastères et route des cols." }, { t: "Oman, désert et wadis", x: "Une semaine au rythme des oasis." }, { t: "Norvège, Lofoten en septembre", x: "Cabanes de pêcheurs et lumière rasante." }] }],
        ["proof:big", { items: [{ q: "Notre voyage en Géorgie ressemblait à nos envies, pas à une brochure.", n: "Camille et Anouk R.", r: "clientes fictives" }] }],
        ["feat:steps", { title: "De l'idée au départ", items: [{ t: "Premier échange", d: "Jour 1", x: "Une heure, sans engagement, pour comprendre vos envies." }, { t: "Proposition illustrée", d: "Sous 10 jours", x: "Itinéraire, budget détaillé et alternatives." }, { t: "Mise au point", d: "À votre rythme", x: "Nous ajustons jusqu'à ce que tout vous ressemble." }] }],
        ["cta:card", { title: "Un voyage en tête ?", sub: "Racontez-nous le début, nous écrirons la suite.", cta: ["Raconter mon projet", "/contact"] }],
      ] },
      { key: "voyages", name: "Voyages", blocks: [
        ph("Voyages à titre d'exemple", "Des itinéraires de démonstration, toujours adaptés."),
        ["gal:listings", { title: "Inspirations", items: [{ t: "Sicile, côté pierre et sel", tag: "9 jours", price: "dès 2 150 €", x: "Voiture de location, masserie et table d'hôtes." }, { t: "Géorgie, tables et vallées", tag: "11 jours", price: "dès 2 780 €", x: "Chauffeur-guide, caves familiales, nuits en maison d'hôtes." }, { t: "Oman, désert et wadis", tag: "8 jours", price: "dès 2 950 €", x: "4x4 avec guide, camp sous tente, plage de Ras al Jinz." }] }],
        ["feat:checks", { eyebrow: "Toujours compris", title: "Dans chaque proposition", items: [{ t: "Carnet de route numérique" }, { t: "Numéro d'assistance joignable" }, { t: "Conseils de saison et de santé" }, { t: "Budget détaillé poste par poste" }], cta: ["Demander une proposition", "/contact"] }],
        ["cta:split", { title: "Ces voyages ne sont que des idées.", sub: "Tout se compose avec vous, à votre date.", cta: ["Écrire à un conseiller", "/contact"] }],
      ] },
      { key: "methode", name: "Notre méthode", blocks: [
        ph("Une méthode de couturier", "Mesurer, dessiner, ajuster."),
        ["misc:story", { eyebrow: "Depuis Tours", title: "Un voyage se prépare comme un vêtement", paras: ["Nous prenons les mesures : durée, énergie, goûts, ce que vous ne voulez surtout pas.", "Puis nous dessinons un itinéraire que nous ajustons avec vous, sans frais cachés."], image: "portrait-1" }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Combien de temps pour préparer ?", x: "Comptez six à huit semaines, davantage pour les voyages lointains." }, { t: "Y a-t-il un budget minimum ?", x: "Nous travaillons à partir de 1 500 € par personne, hors vols (exemple)." }, { t: "Que se passe-t-il en cas d'imprévu ?", x: "Une ligne d'assistance reste joignable pendant tout le voyage." }] }],
        ["cta:band", { title: "Prenons rendez-vous.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "conseillers", name: "Conseillers", blocks: [
        ph("Ceux qui écrivent vos voyages"),
        ["proof:team", { items: [{ n: "Élodie Varenne", r: "Asie et Pacifique" }, { n: "Matthieu Orsini", r: "Méditerranée et Caucase" }, { n: "Salomé Brandt", r: "Nord, Arctique" }, { n: "Idriss Kaci", r: "Afrique et océan Indien" }] }],
        ["proof:stats", { items: [["15", "ans d'expérience moyenne (exemple)"], ["60", "pays arpentés"], ["1", "conseiller par voyage"]] }],
        ["misc:quote", { text: "Un bon voyage laisse de la place au hasard.", by: "Élodie, conseillère fictive" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Raconter votre projet", "Nous répondons sous deux jours ouvrés."),
        ["contact:info", { title: "Venir nous voir ou écrire", formTitle: "Votre projet", formIntro: "Destination, période, nombre de voyageurs, envies.", cta: ["Envoyer ma demande", "/contact"] }],
        ["misc:hours", { title: "Horaires de l'agence", rows: [["Mardi – vendredi", "10 h – 18 h"], ["Samedi", "10 h – 16 h"], ["Dimanche – lundi", "Fermé"]] }],
      ] },
    ],
  },

  // 2. LES SENTIERS D'ARDOISE — guide de randonnée
  {
    key: "sentier-ardoise", name: "Les Sentiers d'Ardoise", category: "tourisme", tags: ["naturel", "chaleureux"], siteType: "Guide de randonnée accompagnateur",
    description: "Site d'accompagnateur en montagne : vert forêt et ocre sur fond calcaire, Zilla Slab robuste, fiches de sorties par niveau et conseils d'équipement clairs.",
    brand: "Les Sentiers d'Ardoise",
    tokens: { colors: { primary: "#2f7a3a", secondary: "#1b3a22", accent: "#d9902a", background: "#f4f7ef", surface: "#ffffff", text: "#1b2a1d", muted: "#54654f" }, fonts: F("zilla-slab", "ibm-plex-sans"), radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.08, letterSpacing: -0.01, transform: "none" } }, border: { width: 1, color: "#d8e3cf" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "sentier-ardoise", motifs: ["mountains", "topo", "botanical"] },
    head: ["head:side", { tagline: "Accompagnateur en montagne" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Sorties", "/sorties"], ["Niveaux", "/niveaux"], ["Équipement", "/equipement"], ["Contact", "/contact"]], cta: ["Choisir une sortie", "/sorties"],
    contact: { address: "Maison de la montagne, 38350 La Mure", phone: "04 76 00 27 18", email: "sorties@sentiersdardoise.example", hours: "Tous les jours, 8 h – 19 h en saison", tagline: "Marcher léger, voir loin." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Alpes du Sud · Matheysine", title: "Des sentiers, un guide, aucun stress.", sub: "Sorties à la journée et itinérances de plusieurs jours, en petits groupes de huit personnes maximum.", cta: ["Voir les sorties", "/sorties"], cta2: ["Poser une question", "/contact"] }],
        ["feat:numbered", { title: "Une journée type", items: [{ t: "8 h 30, rendez-vous", x: "Café, météo du jour et briefing sécurité." }, { t: "Marche à votre pas", x: "Pauses fréquentes, explications sur la faune et la flore." }, { t: "Pique-nique sorti du sac", x: "Produits de la vallée, avec options végétariennes." }] }],
        ["gal:cards", { title: "Sorties de la saison", items: [{ t: "Lac de Lauvitel", tag: "Facile", x: "Demi-journée, 4 h de marche, 350 m de dénivelé." }, { t: "Crête des Sagnes", tag: "Moyen", x: "Journée, 18 km, panorama sur le massif." }, { t: "Tour des Lacs Robert", tag: "Sportif", x: "Deux jours en refuge, 1 400 m de dénivelé." }] }],
        ["feat:tabs", { title: "Choisir son format", items: [{ t: "Demi-journée", x: "Idéal avec enfants dès 7 ans et pour une première sortie." }, { t: "Journée", x: "Un vrai sommet ou un tour de lac, déjeuner en pleine nature." }, { t: "Itinérance", x: "Deux à cinq jours, nuits en refuge, bagages portés sur demande." }] }],
        ["proof:stats", { items: [["8", "personnes maximum"], ["22", "itinéraires"], ["12 ans", "de terrain"]] }],
        ["cta:split", { title: "Une date en tête ?", sub: "Écrivez-nous, nous vérifions les places et la météo.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "sorties", name: "Sorties", blocks: [
        ph("Sorties à la carte", "Tarifs par personne, exemples de démonstration."),
        ["gal:listings", { title: "Prochaines dates", items: [{ t: "Lac de Lauvitel", tag: "Facile", price: "35 €", x: "Samedis de juin à septembre, départ 8 h 30." }, { t: "Crête des Sagnes", tag: "Moyen", price: "55 €", x: "Dimanches, départ 7 h 30, retour vers 17 h." }, { t: "Tour des Lacs Robert", tag: "Sportif", price: "210 €", x: "Deux jours, demi-pension en refuge incluse." }] }],
        ["feat:pricelist", { title: "Privatiser une sortie", items: [{ t: "Groupe jusqu'à 8, journée", x: "Itinéraire au choix", price: "320 €" }, { t: "Groupe jusqu'à 8, demi-journée", x: "Parfait en famille", price: "190 €" }, { t: "Soirée raquettes", x: "En hiver, avec fondue", price: "48 €" }] }],
        ["cta:band", { title: "Les places sont limitées.", cta: ["Demander une date", "/contact"] }],
      ] },
      { key: "niveaux", name: "Niveaux", blocks: [
        ph("Quel niveau pour moi ?", "Un repère simple avant de s'inscrire."),
        ["feat:icons", { items: [{ t: "Facile", x: "Moins de 4 h, jusqu'à 400 m de dénivelé.", icon: "sun" }, { t: "Moyen", x: "5 à 6 h, jusqu'à 800 m de dénivelé.", icon: "activity" }, { t: "Sportif", x: "Plus de 6 h, au-delà de 1 000 m de dénivelé.", icon: "trendingUp" }] }],
        ["feat:accordion", { title: "Vos questions", items: [{ t: "Mon enfant de 8 ans peut-il venir ?", x: "Oui sur les sorties faciles, accompagné d'un adulte." }, { t: "Et s'il pleut ?", x: "Nous adaptons l'itinéraire ou reportons, sans frais." }, { t: "Chiens acceptés ?", x: "Selon la sortie, en laisse et sur demande préalable." }] }],
        ["misc:quote", { text: "La montagne se mérite, elle se partage surtout.", by: "Hugo, guide fictif" }],
      ] },
      { key: "equipement", name: "Équipement", blocks: [
        ph("Dans le sac"),
        ["feat:list2", { title: "Liste de base", items: [{ t: "Chaussures de randonnée montantes" }, { t: "Veste imperméable légère" }, { t: "2 litres d'eau minimum" }, { t: "Crème solaire et lunettes" }, { t: "Bâtons (facultatif)" }, { t: "Pique-nique pour le midi" }] }],
        ["feat:checks", { eyebrow: "Fourni par nous", title: "Prêté sur place", items: [{ t: "Trousse de premiers secours" }, { t: "Couverture de survie" }, { t: "Cartes IGN et GPS" }], cta: ["Demander un prêt", "/contact"] }],
        ["cta:card", { title: "Un doute sur le matériel ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Parlons de votre sortie"),
        ["contact:map", { title: "Au pied du Taillefer", mapAddress: "La Mure, Isère" }],
        ["misc:hours", { title: "Disponibilités", rows: [["Juin – septembre", "Tous les jours"], ["Octobre – mai", "Sur rendez-vous"]] }],
      ] },
    ],
  },

  // 3. CAP BRUME — croisières, sombre
  {
    key: "cap-brume", name: "Cap Brume", category: "tourisme", tags: ["sombre", "luxe"], siteType: "Croisières maritimes et fluviales",
    description: "Courtier en croisières sur fond bleu nuit : bleu ciel lumineux et or pâle, DM Serif Display, grandes images plein cadre et tableaux de cabines très lisibles.",
    brand: "Cap Brume Croisières",
    tokens: { colors: { primary: "#7cc4f0", secondary: "#12304f", accent: "#e6c47a", background: "#0a1626", surface: "#11233a", text: "#eaf2fa", muted: "#a9bdd2" }, fonts: F("dm-serif-display", "outfit"), radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.04, letterSpacing: -0.01, transform: "none" } }, border: { width: 1, color: "#23405f" } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "soft" }, art: { seed: "cap-brume", motifs: ["waves", "bokeh", "rays"] },
    head: ["head:dark", {}], foot: ["foot:newsletter", { title: "Les escales du mois", sub: "Une lettre mensuelle d'idées de croisières, sans spam.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Croisières", "/croisieres"], ["Cabines", "/cabines"], ["Escales", "/escales"], ["Contact", "/contact"]], cta: ["Demander une cotation", "/contact"],
    contact: { address: "Quai Wilson, 44000 Nantes", phone: "02 40 00 66 09", email: "croisieres@capbrume.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "L'horizon, sans les complications." },
    social: ["facebook", "instagram", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Mers, fleuves et grands lacs", title: "Embarquez sans valise lourde.", sub: "Nous comparons armateurs et cabines, vous choisissez la traversée.", cta: ["Voir les croisières", "/croisieres"], cta2: ["Être conseillé", "/contact"] }],
        ["proof:statsbar", { items: [["35", "compagnies comparées"], ["120", "itinéraires (exemple)"], ["7 j/7", "assistance pendant le voyage"]] }],
        ["feat:alt", { title: "Une croisière, trois ambiances", items: [{ t: "Fleuves d'Europe", x: "Rhin, Danube, Douro : une escale par jour, un hôtel flottant.", link: ["Voir", "/croisieres"] }, { t: "Méditerranée en famille", x: "Clubs enfants, escales courtes et cabines communicantes." }, { t: "Grand Nord", x: "Fjords, aurores boréales et expéditions en petit navire." }] }],
        ["gal:carousel", { title: "Prochains départs", items: [{ t: "Douro, de Porto à Salamanque", tag: "8 jours", x: "Dès 1 390 €, pension complète." }, { t: "Fjords de Norvège", tag: "10 jours", x: "Dès 2 450 €, excursions en option." }, { t: "Îles grecques", tag: "7 jours", x: "Dès 1 190 €, vols depuis Paris." }] }],
        ["proof:quotes", { title: "Retours de bord", items: [{ q: "Une cabine impeccable et des escales bien rythmées.", n: "Denise L.", r: "cliente fictive" }, { q: "Le conseil nous a évité une mauvaise surprise sur le pont.", n: "Paul A.", r: "client fictif" }] }],
        ["cta:image", { title: "On vous trouve la bonne cabine.", sub: "Réponse sous 24 heures ouvrées.", cta: ["Demander une cotation", "/contact"] }],
      ] },
      { key: "croisieres", name: "Croisières", blocks: [
        ph("Croisières proposées", "Exemples de démonstration, tarifs par personne."),
        ["gal:listings", { title: "Au départ cet automne et cet hiver", items: [{ t: "Douro, de Porto à Salamanque", tag: "8 jours", price: "1 390 €", x: "Navire de 120 passagers, pension complète." }, { t: "Fjords de Norvège", tag: "10 jours", price: "2 450 €", x: "Navire d'expédition, pont panoramique." }, { t: "Îles grecques", tag: "7 jours", price: "1 190 €", x: "Escales de Santorin à Rhodes." }] }],
        ["feat:compare", { title: "Fleuve ou mer ?", rows: [["", "Fleuve", "Mer"], ["Taille du navire", "100 à 190 passagers", "1 000 à 4 000"], ["Escales", "Chaque jour", "Un jour sur deux"], ["Animations", "Conférences, soirées", "Spectacles, clubs"], ["Rythme", "Calme", "Dynamique"]] }],
        ["cta:band", { title: "Besoin d'aide pour choisir ?", cta: ["Parler à un conseiller", "/contact"] }],
      ] },
      { key: "cabines", name: "Cabines", blocks: [
        ph("Choisir sa cabine"),
        ["price:tiers", { items: [{ t: "Intérieure", price: "1 190 €", period: "par pers.", x: "Sans hublot, la plus économique.", f: ["Lit double ou twin", "Salle de bain privée"], cta: ["Demander", "/contact"] }, { t: "Balcon", price: "1 790 €", period: "par pers.", x: "Le meilleur rapport confort-prix.", f: ["Balcon privé", "Coin salon"], cta: ["Demander", "/contact"], hl: true }, { t: "Suite", price: "2 980 €", period: "par pers.", x: "Espace et services en plus.", f: ["Majordome", "Salon séparé", "Accès au restaurant privé"], cta: ["Demander", "/contact"] }] }],
        ["feat:accordion", { title: "Bon à savoir", items: [{ t: "Les prix sont-ils fermes ?", x: "Ce sont des exemples de démonstration, la cotation définitive vous est envoyée." }, { t: "Puis-je choisir ma cabine ?", x: "Oui, selon les disponibilités au moment de la demande." }] }],
        ["cta:card", { title: "Cotation gratuite.", cta: ["Je demande", "/contact"] }],
      ] },
      { key: "escales", name: "Escales", blocks: [
        ph("Escales à ne pas manquer"),
        ["feat:strips", { items: [{ t: "Porto", x: "Caves de vin de Porto et quartier de la Ribeira." }, { t: "Bergen", x: "Marché aux poissons et funiculaire du Fløyen." }, { t: "Santorin", x: "Villages perchés et coucher de soleil sur la caldeira." }] }],
        ["misc:schedule", { title: "Exemple de journée à bord", items: [{ d: "7 h 30", t: "Petit-déjeuner buffet", x: "Sur le pont ou au restaurant." }, { d: "9 h 30", t: "Excursion ou visite libre", x: "Départs groupés ou balade à votre rythme." }, { d: "20 h", t: "Dîner et soirée", x: "Conférence ou musique en direct." }] }],
        ["cta:split", { title: "Une escale vous fait rêver ?", cta: ["On l'ajoute", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Demander une cotation"),
        ["contact:cards", { title: "Joindre l'agence", formTitle: "Votre croisière", formIntro: "Destination, dates, nombre de passagers.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Samedi", "9 h – 12 h"]] }],
      ] },
    ],
  },

  // 4. ÉCUME VIVE — excursions et activités nautiques
  {
    key: "ecume-vive", name: "Écume Vive", category: "tourisme", tags: ["moderne", "ludique"], siteType: "Excursions et activités nautiques",
    description: "Base nautique à la page claire et vitaminée : vert d'eau profond, corail en contraste, Bricolage-like Lexend et barre flottante pour réserver une sortie en mer par formulaire.",
    brand: "Écume Vive",
    tokens: { colors: { primary: "#0b8a72", secondary: "#0a3a33", accent: "#ff7a59", background: "#f1faf7", surface: "#ffffff", text: "#0f2a26", muted: "#4a6661" }, fonts: F("league-spartan", "lexend"), radius: { sm: 8, md: 14, lg: 22, button: 999, field: 14, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.02, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "ecume-vive", motifs: ["waves", "blobs", "rays"] },
    head: ["head:float", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Activités", "/activites"], ["Tarifs", "/tarifs"], ["Sécurité", "/securite"], ["Contact", "/contact"]], cta: ["Demander une sortie", "/contact"],
    contact: { address: "Port de plaisance, 17590 Ars-en-Ré", phone: "05 46 00 82 31", email: "base@ecumevive.example", hours: "Tous les jours d'avril à octobre, 9 h – 19 h", tagline: "La mer se vit, pas seulement se regarde." },
    social: ["instagram", "facebook", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Île de Ré · Avril à octobre", title: "À l'eau, tout le monde !", sub: "Kayak, paddle, voile légère et sorties en bateau pour familles, amis et collègues.", cta: ["Voir les activités", "/activites"], cta2: ["Demander une sortie", "/contact"] }],
        ["feat:icons", { title: "Pourquoi nous", items: [{ t: "Moniteurs diplômés", x: "Brevet d'État et secourisme à jour.", icon: "shield" }, { t: "Petits groupes", x: "Dix personnes au plus par moniteur.", icon: "users" }, { t: "Matériel entretenu", x: "Gilets, combinaisons et bateaux contrôlés chaque semaine.", icon: "settings" }] }],
        ["gal:masonry", { title: "Sur l'eau", items: [{ t: "Kayak dans les marais" }, { t: "Coucher de soleil en paddle" }, { t: "Initiation catamaran" }, { t: "Sortie dauphins" }] }],
        ["proof:stats", { items: [["6", "activités"], ["12 ans", "d'ouverture"], ["8 000", "sorties encadrées (exemple)"]] }],
        ["feat:bento", { title: "Formules du moment", items: [{ t: "Sortie famille", x: "Deux heures de kayak pour tous dès 6 ans." }, { t: "Paddle au coucher du soleil", x: "Départ 19 h 30, thé offert à l'arrivée." }, { t: "Journée entreprise", x: "Régate amicale et déjeuner sur le port." }] }],
        ["cta:band", { title: "Les créneaux se remplissent vite en juillet.", cta: ["Demander une sortie", "/contact"] }],
      ] },
      { key: "activites", name: "Activités", blocks: [
        ph("Nos activités", "Dès 6 ans, selon l'activité."),
        ["gal:cards", { title: "À la carte", items: [{ t: "Kayak de mer", tag: "2 h", x: "Balade dans les marais et le long des digues." }, { t: "Paddle", tag: "1 h 30", x: "Initiation ou sortie pour confirmés." }, { t: "Catamaran", tag: "3 h", x: "Barre à main, trapèze et spi, selon le vent." }, { t: "Bateau dauphins", tag: "4 h", x: "Sortie en mer avec guide naturaliste, sous réserve de la météo." }] }],
        ["feat:list2", { title: "Prévu pour tous", items: [{ t: "Dès 6 ans" }, { t: "Combinaison fournie" }, { t: "Vestiaires et douches" }, { t: "Photo souvenir offerte" }] }],
        ["cta:split", { title: "Envie d'une autre activité ?", cta: ["Dites-nous", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs indicatifs", "Exemples de démonstration, hors saison en moins."),
        ["feat:pricelist", { items: [{ t: "Kayak de mer, 2 h", x: "Par personne", price: "32 €" }, { t: "Paddle, 1 h 30", x: "Par personne", price: "28 €" }, { t: "Catamaran, 3 h", x: "Par personne", price: "55 €" }, { t: "Bateau dauphins, 4 h", x: "Par personne", price: "75 €" }, { t: "Forfait famille 4 pers.", x: "Kayak, 2 h", price: "110 €" }] }],
        ["misc:text", { eyebrow: "Réservation", title: "Pas de paiement en ligne", paras: ["Envoyez-nous votre demande, nous confirmons le créneau par téléphone.", "Le règlement se fait sur place, le jour de la sortie."] }],
        ["cta:band", { title: "Une question sur les tarifs ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "securite", name: "Sécurité", blocks: [
        ph("La mer en sécurité"),
        ["feat:accordion", { title: "Avant de venir", items: [{ t: "Faut-il savoir nager ?", x: "Un test de 25 mètres est demandé pour la voile et le catamaran." }, { t: "Que faire en cas de mauvais temps ?", x: "Nous annulons ou reportons sans frais, c'est le moniteur qui décide." }, { t: "Prête-t-on les gilets ?", x: "Oui, la taille est ajustée avant chaque départ." }] }],
        ["feat:steps", { title: "Notre protocole", items: [{ t: "Météo et marée", d: "Matin", x: "Vérification avant chaque départ." }, { t: "Briefing", d: "Sur le ponton", x: "Consignes et signaux." }, { t: "Bateau d'appui", d: "En continu", x: "Toujours à portée de voix." }] }],
        ["misc:quote", { text: "La mer ne pardonne pas l'improvisation.", by: "Léa, monitrice fictive" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Demander une sortie"),
        ["contact:cards", { title: "Nous trouver", formTitle: "Votre demande", formIntro: "Activité, date souhaitée, nombre de personnes.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Ouverture", rows: [["Avril – juin", "9 h – 18 h"], ["Juillet – août", "8 h – 20 h"], ["Septembre – octobre", "9 h – 17 h"]] }],
      ] },
    ],
  },

  // 5. TOITS DE SEL — locations saisonnières
  {
    key: "toits-de-sel", name: "Toits de Sel", category: "tourisme", tags: ["chaleureux", "moderne"], siteType: "Locations saisonnières en bord de mer",
    description: "Conciergerie de locations de vacances : orange brique sur sable chaud, Fraunces tendre, recherche de logement en tête de page et annonces claires avec services inclus.",
    brand: "Toits de Sel",
    tokens: { colors: { primary: "#c8531a", secondary: "#3b1d0d", accent: "#1f7a8c", background: "#fff7ee", surface: "#fffdf9", text: "#2c1b10", muted: "#6b5545" }, fonts: F("fraunces", "barlow"), radius: { sm: 6, md: 12, lg: 18, button: 10, field: 10, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 600, lineHeight: 1.06, letterSpacing: -0.02, transform: "none" } }, border: { width: 1, color: "#f0dcc5" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "toits-de-sel", motifs: ["dunes", "plates", "waves"] },
    head: ["head:topbar", { info: "Locations de vacances à Quiberon et alentours · 02 97 00 53 44", note: "Arrivées possibles le week-end" }], foot: ["foot:columns", { about: "Conciergerie de locations saisonnières : maisons, appartements et gîtes sélectionnés, ménage et linge inclus en option.", cols: [["Louer", "Nos logements", "Tarifs", "Services"], ["Propriétaires", "Confier son bien", "Contact"]] }],
    menu: [["Accueil", "/"], ["Logements", "/logements"], ["Services", "/services"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Vérifier une date", "/contact"],
    contact: { address: "5 place Hoche, 56170 Quiberon", phone: "02 97 00 53 44", email: "sejours@toitsdesel.example", hours: "Tous les jours, 9 h – 19 h", tagline: "Les clés, c'est nous. Le soleil aussi." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Presqu'île de Quiberon", title: "Des maisons à deux pas de la mer.", sub: "Indiquez vos dates et le nombre de voyageurs, nous revenons vers vous avec les logements disponibles.", placeholder: "Dates, personnes, commune…" }],
        ["gal:listings", { title: "Coups de cœur de la saison", items: [{ t: "Maison de pêcheur, Portivy", tag: "6 personnes", price: "dès 780 €/sem.", x: "Jardin clos, à 200 m de la plage." }, { t: "Appartement vue port", tag: "4 personnes", price: "dès 520 €/sem.", x: "Terrasse, parking, vélos prêtés." }, { t: "Longère rénovée", tag: "8 personnes", price: "dès 1 150 €/sem.", x: "Four à pain, cour fermée, calme absolu." }] }],
        ["feat:bento", { title: "Louer sans y penser", items: [{ t: "Linge de lit et serviettes", x: "Fournis en option, posés sur les lits à votre arrivée." }, { t: "Ménage de fin de séjour", x: "Forfait selon la taille du logement." }, { t: "Accueil en main propre", x: "Un humain vous attend, pas une boîte à clés." }] }],
        ["proof:quotes", { title: "Mots des vacanciers", items: [{ q: "Maison propre, accueil chaleureux, plage à pied.", n: "Famille Garnier", r: "clients fictifs" }, { q: "Tout était prévu, même les vélos.", n: "Nadia B.", r: "cliente fictive" }] }],
        ["proof:logos", { title: "Ils nous font confiance", items: ["Mairie fictive de Quiberon", "Office du Golfe fictif", "Gîtes du Morbihan fictifs"] }],
        ["cta:image", { title: "Propriétaire ? Nous gérons pour vous.", sub: "Estimation gratuite sous une semaine.", cta: ["Confier mon bien", "/contact"] }],
      ] },
      { key: "logements", name: "Logements", blocks: [
        ph("Nos logements", "Exemples de démonstration, disponibilités à confirmer."),
        ["gal:listings", { title: "Maisons et appartements", items: [{ t: "Maison de pêcheur, Portivy", tag: "6 pers.", price: "780 €/sem.", x: "3 chambres, jardin, barbecue." }, { t: "Appartement vue port", tag: "4 pers.", price: "520 €/sem.", x: "2 chambres, balcon, wifi." }, { t: "Longère rénovée", tag: "8 pers.", price: "1 150 €/sem.", x: "4 chambres, cheminée." }, { t: "Studio Plage Sud", tag: "2 pers.", price: "340 €/sem.", x: "Rez-de-jardin, accès direct." }] }],
        ["feat:checks", { eyebrow: "Dans chaque logement", title: "Équipements de base", items: [{ t: "Cuisine équipée" }, { t: "Wifi" }, { t: "Draps en option" }, { t: "Parking" }], cta: ["Demander une date", "/contact"] }],
        ["cta:band", { title: "Disponible les semaines d'août ?", cta: ["Je demande", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ph("Services de conciergerie"),
        ["feat:grid-icons", { items: [{ t: "Accueil", x: "Remise des clés en main propre.", icon: "user" }, { t: "Ménage", x: "Équipe dédiée, contrôle qualité.", icon: "sparkles" }, { t: "Linge", x: "Location et blanchisserie.", icon: "layers" }, { t: "Assistance", x: "Une ligne d'urgence pendant votre séjour.", icon: "bell" }] }],
        ["feat:rows", { title: "Pour les propriétaires", items: [{ t: "Photos et annonces", x: "Rédaction et mise en ligne sur plusieurs plateformes." }, { t: "Gestion du calendrier", x: "Une seule source, pas de doublons de réservation." }, { t: "Compte rendu mensuel", x: "Revenus, dépenses, entretien, tout est détaillé." }] }],
        ["cta:card", { title: "Estimation gratuite.", cta: ["Confier mon bien", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs de démonstration", "Prix à la semaine, selon saison."),
        ["feat:compare", { rows: [["", "Mai – juin", "Juillet – août"], ["Studio 2 pers.", "340 €", "560 €"], ["Appartement 4 pers.", "520 €", "890 €"], ["Maison 6 pers.", "780 €", "1 290 €"], ["Longère 8 pers.", "1 150 €", "1 890 €"]] }],
        ["misc:text", { eyebrow: "À savoir", title: "Pas de paiement en ligne", paras: ["Après votre demande, nous envoyons un contrat et un acompte par virement.", "Taxe de séjour et frais de ménage précisés dans le devis."] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Quelle caution ?", x: "300 € en exemple, restituée sous une semaine." }, { t: "Peut-on venir avec un chien ?", x: "Dans certains logements, avec supplément." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Vérifier une date"),
        ["contact:info", { title: "Passez nous voir à Quiberon", formTitle: "Votre séjour", formIntro: "Dates, nombre de personnes, logement souhaité.", cta: ["Envoyer ma demande", "/contact"] }],
        ["misc:hours", { title: "Accueil du bureau", rows: [["Lundi – samedi", "9 h – 19 h"], ["Dimanche", "10 h – 13 h"]] }],
      ] },
    ],
  },

  // 6. PAYS D'AUBES — office de tourisme
  {
    key: "pays-d-aubes", name: "Pays d'Aubes", category: "tourisme", tags: ["editorial", "classique"], siteType: "Office de tourisme intercommunal",
    description: "Office de tourisme à la une de journal : violet lavande, ocre en rehaut, Marcellus élégant, agenda des animations, idées de visites et informations pratiques.",
    brand: "Pays d'Aubes Tourisme",
    tokens: { colors: { primary: "#6d3fb8", secondary: "#25154a", accent: "#e0a93b", background: "#f8f5fd", surface: "#ffffff", text: "#21173a", muted: "#5c5078" }, fonts: F("marcellus", "plus-jakarta-sans"), radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 400, lineHeight: 1.1, letterSpacing: 0, transform: "none" } }, border: { width: 1, color: "#e0d6f2" } },
    dna: { scale: "m", pad: "normal", align: "center", shape: "sharp" }, art: { seed: "pays-d-aubes", motifs: ["botanical", "tiles", "arches"] },
    head: ["head:masthead", { dateline: "Lavande, villages et marchés · Pays d'Aubes" }], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["À voir, à faire", "/a-voir"], ["Agenda", "/agenda"], ["Actualités", "/actualites"], ["Infos pratiques", "/infos"]], cta: ["Nous contacter", "/contact"],
    contact: { address: "Maison du tourisme, place du Marché, 04230 Saint-Étienne-les-Orgues", phone: "04 92 00 18 73", email: "accueil@paysdaubes.example", hours: "Du lundi au samedi, 9 h – 12 h 30 et 14 h – 18 h", tagline: "Un pays de lumière, à votre rythme." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Haute-Provence", title: "Bienvenue au Pays d'Aubes.", sub: "Marchés, plateaux de lavande, villages perchés et sentiers : tout pour composer votre séjour.", cta: ["À voir, à faire", "/a-voir"], cta2: ["Agenda", "/agenda"], stats: [["24", "villages"], ["60", "sentiers balisés"], ["4", "marchés par semaine"]] }],
        ["feat:cards", { title: "Votre séjour en quatre envies", items: [{ t: "Nature", x: "Gorges, plateaux et sentiers de crête.", icon: "sun" }, { t: "Patrimoine", x: "Prieurés, fontaines et villages perchés.", icon: "home" }, { t: "Saveurs", x: "Huile d'olive, miel, fromages de chèvre.", icon: "heart" }, { t: "En famille", x: "Fermes pédagogiques et sentiers ludiques.", icon: "users" }] }],
        ["gal:grid", { title: "Incontournables", items: [{ t: "Plateau de Valensole", x: "Floraison de la lavande, en juillet." }, { t: "Village de Simiane", x: "Halle et ruelles fleuries." }, { t: "Gorges de la Pierre", x: "Deux heures de balade en eau." }] }],
        ["misc:posts", { title: "Dernières nouvelles de l'office", count: 3, layout: "list" }],
        ["proof:stats", { title: "Le pays en chiffres", items: [["24", "communes"], ["320", "hébergements (exemple)"], ["12", "fêtes et festivals"]] }],
        ["cta:split", { title: "Besoin d'un conseil ?", sub: "Nos conseillères répondent par téléphone et sur place.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "a-voir", name: "À voir, à faire", blocks: [
        ph("À voir, à faire", "Des idées de visites pour chaque saison."),
        ["gal:masonry", { items: [{ t: "Prieuré de Salagon" }, { t: "Sentier des Ocres" }, { t: "Marché de Forcalquier" }, { t: "Observatoire de nuit" }] }],
        ["feat:alt", { title: "Trois balades faciles", items: [{ t: "Tour du lac de Pierrevert", x: "Boucle de 6 km, accessible aux poussettes." }, { t: "Sentier du Calavon", x: "Rivière et ponts, 4 h aller-retour." }, { t: "Crêtes du Lure", x: "Panorama sur les Alpes, 3 h 30." }] }],
        ["cta:band", { title: "Besoin d'un itinéraire détaillé ?", cta: ["Demander à l'accueil", "/contact"] }],
      ] },
      { key: "agenda", name: "Agenda", blocks: [
        ph("Agenda des animations", "Exemples de démonstration pour l'été."),
        ["misc:schedule", { title: "Cette semaine au pays", items: [{ d: "Mardi", t: "Marché nocturne", x: "Producteurs et musique, dès 18 h." }, { d: "Jeudi", t: "Visite guidée du village", x: "Rendez-vous devant la mairie à 10 h." }, { d: "Samedi", t: "Fête de la lavande", x: "Distillerie ouverte et démonstrations." }, { d: "Dimanche", t: "Concert au prieuré", x: "Musique baroque, entrée libre au chapeau." }] }],
        ["feat:steps", { title: "Calendrier de l'année", items: [{ t: "Printemps", d: "Mars – mai", x: "Fêtes de la transhumance et randonnées fleuries." }, { t: "Été", d: "Juin – août", x: "Lavande, nocturnes et festivals." }, { t: "Automne", d: "Sept – nov", x: "Vendanges et fête de l'olive." }] }],
        ["cta:card", { title: "Un événement à signaler ?", cta: ["Écrire à l'office", "/contact"] }],
      ] },
      { key: "actualites", name: "Actualités", blocks: [
        ph("Actualités du pays"),
        ["misc:posts", { title: "Dernières publications", count: 6, layout: "grid" }],
        ["misc:article", { tag: "Exemple", title: "Floraison de la lavande : à quelle date venir ?", meta: "Par la rédaction fictive · 4 min de lecture", paras: ["La lavande fleurit de la mi-juin à la fin juillet, selon l'altitude.", "Les plateaux les plus hauts sont en fleur plus tard : comptez la mi-juillet pour les voir au mieux."], quote: "Venez tôt le matin, la lumière est plus douce.", by: "Conseillère fictive" }],
      ] },
      { key: "infos", name: "Infos pratiques", blocks: [
        ph("Infos pratiques"),
        ["misc:hours", { title: "Horaires de l'office", rows: [["Avril – juin", "9 h – 12 h 30 · 14 h – 18 h"], ["Juillet – août", "9 h – 19 h"], ["Octobre – mars", "Du mardi au samedi, 9 h – 12 h 30"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Où se garer au centre ?", x: "Trois parkings gratuits à moins de 300 m de la place." }, { t: "Y a-t-il des navettes ?", x: "Oui, la ligne d'été relie les villages principaux." }, { t: "Accessibilité", x: "Toilettes, sentiers et circuits adaptés signalés par un picto." }] }],
        ["contact:map", { title: "Venir à l'office", mapAddress: "Saint-Étienne-les-Orgues" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contacter l'office"),
        ["contact:info", { title: "Nous écrire ou passer nous voir", formTitle: "Votre question", formIntro: "Hébergement, balade, événement : demandez-nous.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "Ici, on prend le temps de vous conseiller.", by: "Accueil fictif de l'office" }],
      ] },
    ],
  },

  // 7. BAL DES ÉTOILES — parc d'attractions, sombre
  {
    key: "bal-des-etoiles", name: "Bal des Étoiles", category: "tourisme", tags: ["sombre", "ludique", "audacieux"], siteType: "Parc d'attractions familial",
    description: "Parc d'attractions de nuit étoilée : violet profond, ambre lumineux, Baloo 2 rond et dégradés, billets de démonstration, programme des spectacles et infos familles.",
    brand: "Bal des Étoiles",
    tokens: { colors: { primary: "#ffb020", secondary: "#3a1b6b", accent: "#ff5c8a", background: "#150d2a", surface: "#21143f", text: "#f6f0ff", muted: "#c4b6e0" }, fonts: F("baloo-2", "instrument-sans"), radius: { sm: 10, md: 18, lg: 28, button: 999, field: 16, card: 24 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.02, letterSpacing: -0.02, transform: "none" } }, border: { width: 1, color: "#3b2a66" } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "pill" }, art: { seed: "bal-des-etoiles", motifs: ["bokeh", "rays", "blobs"] },
    head: ["head:split", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Attractions", "/attractions"], ["Billets", "/billets"], ["Spectacles", "/spectacles"], ["Infos", "/infos"]], cta: ["Voir les billets", "/billets"],
    contact: { address: "Route de la Lune, 49120 Chemillé-en-Anjou", phone: "02 41 00 70 25", email: "accueil@baldesetoiles.example", hours: "Ouvert de 10 h à 18 h, jusqu'à 22 h en été", tagline: "Un parc où l'on rit jusqu'à la nuit." },
    social: ["instagram", "facebook", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Parc d'attractions · Maine-et-Loire", title: "Le soir, les étoiles descendent au parc.", sub: "Quarante attractions, des spectacles de nuit et un feu d'artifice chaque samedi d'été.", cta: ["Voir les billets", "/billets"], cta2: ["Les attractions", "/attractions"], stats: [["40", "attractions"], ["6", "univers"], ["1", "feu d'artifice par semaine"]] }],
        ["misc:marquee", { items: ["Enfants de moins de 3 ans gratuits", "Nocturne le samedi", "Restauration sur place", "Casiers gratuits"] }],
        ["gal:wall", { title: "Six univers", items: [{ t: "Galaxie" }, { t: "Forêt enchantée" }, { t: "Port des pirates" }, { t: "Cité des robots" }] }],
        ["feat:cards", { title: "Pour toute la famille", items: [{ t: "Petits explorateurs", x: "Manèges tout doux dès 2 ans.", icon: "heart" }, { t: "Sensations fortes", x: "Montagnes russes dès 1,20 m.", icon: "zap" }, { t: "Spectacles", x: "Cinq représentations par jour.", icon: "star" }] }],
        ["proof:quotes", { title: "Vu par les visiteurs", items: [{ q: "Les enfants ont tout fait, nous aussi !", n: "Mélanie P.", r: "cliente fictive" }, { q: "Le spectacle de nuit était magnifique.", n: "Rémi T.", r: "client fictif" }] }],
        ["cta:band", { title: "Une journée pour grandir et rire.", cta: ["Voir les billets", "/billets"] }],
      ] },
      { key: "attractions", name: "Attractions", blocks: [
        ph("Les attractions", "Condition de taille indiquée pour chaque manège."),
        ["gal:cards", { title: "Les stars du parc", items: [{ t: "Comète 360", tag: "1,20 m", x: "Montagnes russes lancées, 3 inversions." }, { t: "Radeau des Pirates", tag: "Dès 4 ans", x: "Rivière rapide avec éclaboussures." }, { t: "Cité des Robots", tag: "Famille", x: "Parcours interactif en cabine." }, { t: "Carrousel d'Étoiles", tag: "Dès 2 ans", x: "Le plus doux, pour les petits." }] }],
        ["feat:tabs", { title: "Par univers", items: [{ t: "Galaxie", x: "Comète 360, Roue Cosmos, Vol des Planètes." }, { t: "Forêt enchantée", x: "Train des lutins, Cabanes dans les arbres." }, { t: "Port des pirates", x: "Radeau, Bateau pirate, Chasse au trésor." }] }],
        ["cta:split", { title: "Préparez votre journée.", cta: ["Voir le plan", "/infos"] }],
      ] },
      { key: "billets", name: "Billets", blocks: [
        ph("Billets de démonstration", "Aucune vente en ligne : tarifs à titre d'exemple."),
        ["price:tiers", { items: [{ t: "Journée", price: "39 €", period: "adulte", x: "Accès à toutes les attractions.", f: ["Dès 1,40 m", "Spectacles inclus"], cta: ["Demander", "/infos"] }, { t: "Famille", price: "129 €", period: "4 pers.", x: "Le plus choisi.", f: ["2 adultes, 2 enfants", "Casier offert"], cta: ["Demander", "/infos"], hl: true }, { t: "Nocturne", price: "29 €", period: "dès 17 h", x: "Les plus belles lumières.", f: ["Feu d'artifice", "Spectacle de nuit"], cta: ["Demander", "/infos"] }] }],
        ["feat:accordion", { title: "Billetterie", items: [{ t: "Où acheter ?", x: "La billetterie en ligne n'est pas active sur ce site de démonstration, les achats se font aux caisses." }, { t: "Y a-t-il un tarif groupe ?", x: "Oui, dès 15 personnes, sur demande." }] }],
        ["cta:card", { title: "Groupe ou école ?", cta: ["Nous écrire", "/infos"] }],
      ] },
      { key: "spectacles", name: "Spectacles", blocks: [
        ph("Spectacles et nocturnes"),
        ["misc:schedule", { title: "Programme d'un samedi d'été", items: [{ d: "11 h", t: "Parade des Étoiles", x: "Costumes et musique dans l'allée centrale." }, { d: "15 h", t: "Le Trésor du Capitaine", x: "Spectacle de cascades dans le port." }, { d: "20 h", t: "Bal sous les étoiles", x: "Danse et jeux de lumière." }, { d: "22 h", t: "Feu d'artifice", x: "Finale de la soirée." }] }],
        ["gal:strip", { title: "Instants du parc", items: [{ t: "Parade" }, { t: "Cascades" }, { t: "Nuit" }, { t: "Feu d'artifice" }, { t: "Mascottes" }] }],
        ["cta:band", { title: "Retenez votre samedi.", cta: ["Voir les billets", "/billets"] }],
      ] },
      { key: "infos", name: "Infos", blocks: [
        ph("Infos pratiques"),
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Avril – juin", "10 h – 18 h"], ["Juillet – août", "10 h – 22 h"], ["Septembre", "Week-ends, 10 h – 18 h"]] }],
        ["contact:cards", { title: "Accès et contact", formTitle: "Une question ?", formIntro: "Accessibilité, groupes, objets perdus.", cta: ["Envoyer", "/contact"] }],
        ["feat:list2", { title: "Services", items: [{ t: "Prêt de poussettes" }, { t: "Fauteuils roulants" }, { t: "Espace change-bébé" }, { t: "Restauration végétarienne" }] }],
      ] },
    ],
  },

  // 8. SAVANE LENTE — safari / écotourisme, sombre
  {
    key: "savane-lente", name: "Savane Lente", category: "tourisme", tags: ["naturel", "sombre", "editorial"], siteType: "Safari et écotourisme responsable",
    description: "Voyagiste de safaris éthiques : vert olive vif sur fond brun forêt, Alegreya littéraire, itinéraires lents, engagements de conservation et petits groupes en réserve.",
    brand: "Savane Lente",
    tokens: { colors: { primary: "#a3c24a", secondary: "#2a3314", accent: "#e08a3c", background: "#11150b", surface: "#1a2012", text: "#eef2e2", muted: "#b3bd9f" }, fonts: F("alegreya", "chivo"), radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 62, weight: 700, lineHeight: 1.04, letterSpacing: -0.015, transform: "none" } }, border: { width: 1, color: "#2f3a1c" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "savane-lente", motifs: ["dunes", "botanical", "halftone"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Voyages d'observation de la faune en petits groupes, réalisés avec des guides locaux et des lodges engagés dans la conservation.", cols: [["Voyager", "Safaris", "Engagements", "Saisons"], ["Agence", "Préparer son départ", "Contact"]] }],
    menu: [["Accueil", "/"], ["Safaris", "/safaris"], ["Engagements", "/engagements"], ["Saisons", "/saisons"], ["Contact", "/contact"]], cta: ["Préparer un safari", "/contact"],
    contact: { address: "27 rue des Tanneurs, 69007 Lyon", phone: "04 78 00 91 36", email: "safari@savanelente.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Regarder longtemps, laisser peu de traces." },
    social: ["instagram", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Tanzanie · Kenya · Namibie", title: "Le safari qui prend son temps.", sub: "Groupes de six voyageurs, guides naturalistes et lodges qui reversent une part à la conservation.", cta: ["Voir les safaris", "/safaris"], cta2: ["Parler à un conseiller", "/contact"] }],
        ["proof:big", { items: [{ q: "Trois heures devant un point d'eau : le plus beau moment du voyage.", n: "Clémence V.", r: "cliente fictive" }] }],
        ["feat:alt", { title: "Voyager autrement", items: [{ t: "Six voyageurs au plus", x: "Un véhicule pour six, avec toit ouvrant et fenêtre pour chacun.", link: ["Safaris", "/safaris"] }, { t: "Guides locaux", x: "Rangers formés sur place, au contact de la faune depuis l'enfance." }, { t: "Peu de nuits, peu de lodges", x: "Moins de trajets, plus d'observation." }] }],
        ["proof:stats", { items: [["6", "voyageurs maximum"], ["15 %", "du prix reversé à la conservation (exemple)"], ["10 ans", "de présence sur le terrain"]] }],
        ["feat:steps", { title: "Un jour de safari", items: [{ t: "5 h 30, première lumière", d: "Aube", x: "Les prédateurs sont encore actifs." }, { t: "Midi, pause au lodge", d: "Chaleur", x: "Sieste et déjeuner sous la tente." }, { t: "16 h, seconde sortie", d: "Fin de journée", x: "Retour au crépuscule." }] }],
        ["cta:image", { title: "Un safari qui a du sens.", sub: "Devis détaillé sous une semaine.", cta: ["Préparer un safari", "/contact"] }],
      ] },
      { key: "safaris", name: "Safaris", blocks: [
        ph("Safaris proposés", "Exemples de démonstration, hors vols."),
        ["gal:listings", { title: "Départs de la saison", items: [{ t: "Serengeti, grande migration", tag: "9 jours", price: "dès 4 950 €", x: "Camps mobiles, six voyageurs, guide naturaliste." }, { t: "Etosha et Damaraland", tag: "11 jours", price: "dès 4 380 €", x: "Point d'eau, éléphants du désert." }, { t: "Laikipia, réserve privée", tag: "7 jours", price: "dès 3 890 €", x: "Safari à pied et à cheval." }] }],
        ["feat:compare", { title: "Deux manières de dormir", rows: [["", "Camp mobile", "Lodge"], ["Confort", "Tente équipée", "Chambre en dur"], ["Proximité faune", "Maximale", "Bonne"], ["Prix", "Plus élevé", "Plus accessible"]] }],
        ["cta:band", { title: "Votre date est libre ?", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "engagements", name: "Engagements", blocks: [
        ph("Nos engagements"),
        ["feat:rows", { title: "Ce que nous nous imposons", items: [{ t: "Aucun lieu bondé", x: "Nous quittons un site si plus de cinq véhicules s'y trouvent." }, { t: "Emplois locaux", x: "Équipes recrutées sur place, rémunérations transparentes." }, { t: "Compensation transparente", x: "Un rapport annuel détaille l'usage des fonds." }] }],
        ["feat:checks", { eyebrow: "Avec vous", title: "Gestes simples", items: [{ t: "Pas de plastique à usage unique" }, { t: "Gourde remplissable" }, { t: "Distances respectées" }, { t: "Photos sans flash" }], cta: ["En savoir plus", "/contact"] }],
        ["misc:quote", { text: "Un animal dérangé est un voyage raté.", by: "Amani, ranger fictif" }],
      ] },
      { key: "saisons", name: "Saisons", blocks: [
        ph("Quand partir ?"),
        ["feat:tabs", { items: [{ t: "Juin – octobre", x: "Saison sèche, faune concentrée autour des points d'eau." }, { t: "Novembre – mars", x: "Saison verte, nombreuses naissances et oiseaux migrateurs." }, { t: "Avril – mai", x: "Pluies, tarifs plus doux, peu de visiteurs." }] }],
        ["feat:accordion", { title: "Avant de partir", items: [{ t: "Quels vaccins ?", x: "Votre médecin vous conseillera, nous fournissons un guide de préparation." }, { t: "Quel bagage ?", x: "Sac souple de 15 kg maximum, tons neutres." }] }],
        ["cta:split", { title: "On vous aide à choisir la saison.", cta: ["Échanger", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Préparer un safari"),
        ["contact:info", { title: "Nous écrire", formTitle: "Votre projet", formIntro: "Pays, période, nombre de voyageurs, ce que vous rêvez d'observer.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Au bureau", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Week-end", "Fermé"]] }],
      ] },
    ],
  },

  // 9. NEIGE HAUTE — séjours ski
  {
    key: "neige-haute", name: "Neige Haute", category: "tourisme", tags: ["moderne", "audacieux"], siteType: "Séjours au ski et à la montagne",
    description: "Organisateur de séjours ski sur fond bleu glace : bleu cobalt franc, rouge d'alerte en accent, League Spartan et Public Sans, compte à rebours d'ouverture de saison.",
    brand: "Neige Haute",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0b1f4f", accent: "#e11d48", background: "#f3f7fd", surface: "#ffffff", text: "#0d1a33", muted: "#4a5878" }, fonts: F("sora", "dm-sans"), radius: { sm: 4, md: 8, lg: 14, button: 8, field: 8, card: 12 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 56, weight: 800, lineHeight: 1.02, letterSpacing: -0.03, transform: "none" } }, border: { width: 1, color: "#d3def2" } },
    dna: { scale: "l", pad: "tight", align: "left", shape: "soft" }, art: { seed: "neige-haute", motifs: ["mountains", "halftone", "plates"] },
    head: ["head:minimal", {}], foot: ["foot:newsletter", { title: "Alerte neige", sub: "Recevez les bons plans de la saison.", button: "M'inscrire" }],
    menu: [["Accueil", "/"], ["Séjours", "/sejours"], ["Stations", "/stations"], ["Forfaits et tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "18 avenue de la Gare, 73200 Albertville", phone: "04 79 00 45 62", email: "ski@neigehaute.example", hours: "Du lundi au samedi, 9 h – 18 h 30", tagline: "Plus de glisse, moins de logistique." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:countdown", { eyebrow: "Ouverture de la saison", title: "Vos vacances au ski, sans prise de tête.", sub: "Hébergement, forfaits et cours en un seul devis.", until: "2026-12-19T09:00:00+01:00", cta: ["Voir les séjours", "/sejours"], cta2: ["Demander un devis", "/contact"] }],
        ["feat:checks", { eyebrow: "Tout compris", title: "Un séjour en un seul devis", items: [{ t: "Hébergement skis aux pieds" }, { t: "Forfaits remontées mécaniques" }, { t: "Location de matériel" }, { t: "Cours de l'école de ski" }, { t: "Navette de la gare" }], cta: ["Demander un devis", "/contact"] }],
        ["gal:coursecards", { title: "Séjours à la une", items: [{ t: "Semaine famille aux Menuires", tag: "7 nuits", price: "dès 790 €", x: "Appartement 4 pers., forfaits non inclus.", cta: "Demander" }, { t: "Raids entre amis à Val Thorens", tag: "5 nuits", price: "dès 620 €", x: "Chalet partagé, demi-pension.", cta: "Demander" }, { t: "Initiation à la Plagne", tag: "6 nuits", price: "dès 680 €", x: "Cours collectifs et matériel.", cta: "Demander" }] }],
        ["proof:statsbar", { items: [["14", "stations partenaires"], ["20 ans", "d'organisation de séjours"], ["30 000", "skieurs accompagnés (exemple)"]] }],
        ["proof:quotes", { title: "Retour de la poudreuse", items: [{ q: "Tout était réglé avant notre arrivée, même les skis.", n: "Julien M.", r: "client fictif" }, { q: "Un séjour simple avec trois enfants, c'est rare.", n: "Sabrina K.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Les bonnes semaines partent vite.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "sejours", name: "Séjours", blocks: [
        ph("Nos séjours", "Offres de démonstration, tarifs par personne."),
        ["gal:listings", { title: "Au départ cet hiver", items: [{ t: "Semaine famille aux Menuires", tag: "7 nuits", price: "790 €", x: "4 personnes, résidence au pied des pistes." }, { t: "Raids à Val Thorens", tag: "5 nuits", price: "620 €", x: "Chalet partagé, groupe de 8." }, { t: "Initiation à la Plagne", tag: "6 nuits", price: "680 €", x: "6 demi-journées de cours collectifs." }, { t: "Week-end à Tignes", tag: "2 nuits", price: "260 €", x: "Studio, forfait 2 jours." }] }],
        ["feat:strips", { items: [{ t: "En famille", x: "Clubs enfants et résidences calmes." }, { t: "Entre amis", x: "Chalets partagés et soirées animées." }, { t: "Séminaire", x: "Salle de réunion et ski l'après-midi." }] }],
        ["cta:split", { title: "Un budget en tête ?", sub: "Nous adaptons le séjour.", cta: ["Dites-nous", "/contact"] }],
      ] },
      { key: "stations", name: "Stations", blocks: [
        ph("Stations partenaires"),
        ["gal:cards", { items: [{ t: "Val Thorens", tag: "2 300 m", x: "Plus haute station d'Europe, neige garantie." }, { t: "Les Menuires", tag: "1 800 m", x: "Familial et abordable." }, { t: "La Plagne", tag: "2 000 m", x: "Vaste domaine, bon pour progresser." }] }],
        ["feat:accordion", { title: "Choisir sa station", items: [{ t: "Quelle station pour débuter ?", x: "La Plagne ou Les Menuires : pistes vertes larges et écoles réputées." }, { t: "Et pour confirmés ?", x: "Val Thorens, avec ses pistes noires et son hors-piste encadré." }] }],
        ["cta:band", { title: "Besoin d'un conseil station ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Forfaits et tarifs", blocks: [
        ph("Forfaits et tarifs", "Prix d'exemple pour la saison, à confirmer."),
        ["feat:pricelist", { items: [{ t: "Forfait 6 jours adulte", x: "Domaine complet", price: "310 €" }, { t: "Forfait 6 jours enfant", x: "5 à 12 ans", price: "235 €" }, { t: "Location skis + chaussures", x: "6 jours", price: "95 €" }, { t: "Cours collectif", x: "6 matinées", price: "170 €" }] }],
        ["price:tiers", { items: [{ t: "Éco", price: "590 €", period: "par pers.", x: "Studio, forfaits non compris.", f: ["7 nuits", "Linge en option"], cta: ["Demander", "/contact"] }, { t: "Confort", price: "790 €", period: "par pers.", x: "Appartement, forfaits compris.", f: ["7 nuits", "Linge fourni", "Navette"], cta: ["Demander", "/contact"], hl: true }, { t: "Premium", price: "1 190 €", period: "par pers.", x: "Chalet, demi-pension.", f: ["7 nuits", "Spa", "Cours privé"], cta: ["Demander", "/contact"] }] }],
        ["misc:text", { eyebrow: "Réservation", title: "Pas de paiement en ligne", paras: ["Votre demande est étudiée sous 48 h, puis un devis détaillé vous est envoyé.", "L'acompte se règle ensuite par virement."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Demander un devis"),
        ["contact:map", { title: "Notre agence d'Albertville", mapAddress: "Albertville, Savoie" }],
        ["misc:hours", { title: "Accueil", rows: [["Lundi – vendredi", "9 h – 18 h 30"], ["Samedi", "9 h – 13 h"]] }],
      ] },
    ],
  },
];
