// Agences B (11 thèmes) : publicité, vidéo, relations presse, UX/UI, motion, naming, illustration, événementiel, packaging, podcast, affichage. Contenus de DÉMONSTRATION fictifs.
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const pc = (address, phone, email, hours, tagline) => ({ address, phone, email, hours, tagline });

const themes = [
  // 1. Publicité
  {
    key: "affiche-vive", name: "Affiche Vive", category: "agence", tags: ["audacieux", "moderne"], siteType: "Agence de publicité", featured: true,
    description: "Agence de publicité à l'allure d'affiche : titre géant en capitales sur fond rouge, grosses pastilles de chiffres et campagnes présentées comme des cartes éditoriales.",
    brand: "Affiche Vive",
    tokens: { colors: { primary: "#d90429", secondary: "#1a1214", accent: "#ffb703", background: "#fff8f0", surface: "#ffffff", text: "#1a1214", muted: "#5c4a4e" }, fonts: { heading: "font.unbounded", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "none", button: "sm" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.02, letterSpacing: -0.02, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "affichevive", motifs: ["rays", "halftone", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Agence de publicité indépendante : stratégie, création et média pour des marques qui veulent se faire remarquer.", cols: [["Agence", "/campagnes", "/methode", "/equipe"], ["Contact", "/contact"]] }],
    menu: [["Accueil", "/"], ["Campagnes", "/campagnes"], ["Méthode", "/methode"], ["L'équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Lancer une campagne", "/contact"],
    contact: pc("21 rue des Frères Lumière, 69008 Lyon", "04 72 00 41 18", "hello@affichevive.example", "Du lundi au vendredi, 9 h – 18 h 30", "On fait du bruit, mais du bon."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { title: "Faites parler de vous.", sub: "Concept, films, affichage, digital : des campagnes qui se retiennent et qui vendent.", cta: ["Voir nos campagnes", "/campagnes"], cta2: ["Parler d'un brief", "/contact"] }],
        ["misc:marquee", { items: ["Stratégie de marque", "Création publicitaire", "Plan média", "Social ads", "Films 15 s"] }],
        ["gal:cards", { eyebrow: "Campagnes", title: "Celles dont on est fiers", items: [{ t: "Bière du Port", tag: "Affichage", x: "Une saison de fanions sur les quais, +18 % de notoriété (exemple)." }, { t: "Mobilis Vélo", tag: "Digital", x: "Série de vidéos verticales tournées en un jour." }, { t: "Maison Cuvée", tag: "Radio", x: "Cinq spots de 30 s pour les fêtes." }] }],
        ["proof:statsbar", { items: [["16 ans", "de campagnes"], ["230", "marques accompagnées (exemple)"], ["3", "Lions de bronze fictifs"], ["26", "créatifs"]] }],
        ["feat:numbered", { title: "Notre promesse", items: [{ t: "Une idée", x: "Une seule, claire, qui tient en une phrase." }, { t: "Un media mix", x: "Chaque euro placé là où il se voit." }, { t: "Un bilan", x: "Résultats chiffrés après chaque vague." }] }],
        ["cta:band", { title: "Un brief sur la table ?", sub: "Réponse sous 48 h, première piste en dix jours.", cta: ["Envoyer le brief", "/contact"] }],
      ] },
      { key: "campagnes", name: "Campagnes", blocks: [
        ph("Campagnes", "Un échantillon de ce qui est sorti de l'agence."),
        ["gal:featured", { items: [{ t: "Bière du Port", x: "Affichage" }, { t: "Mobilis Vélo", x: "Digital" }, { t: "Maison Cuvée", x: "Radio" }, { t: "Quartier Neuf", x: "Immobilier" }] }],
        ["feat:alt", { title: "Deux études de cas", items: [{ t: "Bière du Port : l'affiche qui se boit", x: "Visuels à moitié effacés par l'humidité des quais, QR code vers la carte des bars partenaires.", link: ["Nous contacter", "/contact"] }, { t: "Mobilis Vélo : douze secondes de liberté", x: "Une série de films courts pour les réseaux, tournés avec des habitants." }] }],
        ["proof:quotes", { items: [{ q: "Ils ont osé la phrase que nous n'osions pas écrire.", n: "Sandrine V.", r: "directrice marketing, cliente fictive" }, { q: "Un plan média simple, des résultats lisibles.", n: "Karim B.", r: "gérant, client fictif" }] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ph("Méthode", "De la page blanche à la diffusion."),
        ["feat:steps", { title: "Un parcours en cinq étapes", items: [{ t: "Brief", d: "Semaine 1", x: "Objectifs, cible, budget, contraintes." }, { t: "Concept", d: "Semaine 2-3", x: "Trois pistes créatives, une recommandation." }, { t: "Production", d: "Semaine 4-7", x: "Visuels, films, textes." }, { t: "Diffusion", d: "Semaine 8", x: "Achat d'espace et lancement." }, { t: "Bilan", d: "Semaine 12", x: "Mesure et recommandations." }] }],
        ["feat:pricelist", { title: "Budgets indicatifs", intro: "Montants d'exemple, hors achat d'espace.", items: [{ t: "Campagne locale", x: "Concept, affichage et social", price: "À partir de 9 000 €" }, { t: "Campagne régionale", x: "Film, radio, affichage, digital", price: "À partir de 38 000 €" }, { t: "Retainer annuel", x: "Accompagnement créatif continu", price: "Sur devis" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il un budget minimal ?", x: "Nous construisons des campagnes dès quelques milliers d'euros." }, { t: "Qui possède les créations ?", x: "Les droits sont cédés à la livraison, selon le contrat." }] }],
      ] },
      { key: "equipe", name: "L'équipe", blocks: [
        ph("L'équipe", "Des créatifs, des stratèges et un producteur têtu."),
        ["proof:team", { items: [{ n: "Inès Maraval", r: "Directrice de création" }, { n: "Théo Gaussin", r: "Directeur de clientèle" }, { n: "Lou Perrault", r: "Concepteur-rédacteur" }, { n: "Amadou Keller", r: "Producteur" }] }],
        ["misc:text", { eyebrow: "Notre credo", title: "Une idée qui ne se raconte pas en une phrase n'est pas finie", paras: ["Nous testons chaque concept à voix haute avant de dessiner la première maquette.", "Notre agence reste à taille humaine pour garder la main sur chaque livrable."] }],
        ["cta:split", { title: "Envie de nous rejoindre ?", sub: "Nous cherchons toujours des concepteurs-rédacteurs.", cta: ["Nous écrire", "/contact"] }],
      ] },
    ],
  },
  // 2. Production vidéo
  {
    key: "clap-et-cie", name: "Clap & Compagnie", category: "agence", tags: ["sombre", "editorial"], siteType: "Production de films d'entreprise",
    description: "Maison de production vidéo au ton cinéma : fond noir bleuté, serif de haut contraste, filets dorés et galerie de films en grandes cartes.",
    brand: "Clap & Compagnie",
    tokens: { colors: { primary: "#f2a900", secondary: "#1d222d", accent: "#e5484d", background: "#0d0f14", surface: "#161a22", text: "#f2efe8", muted: "#a8adb8" }, fonts: { heading: "font.bodoni-moda", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 62, weight: 600, lineHeight: 1.06, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "clapcie", motifs: ["bokeh", "plates", "rays"] },
    head: ["head:center", {}], foot: ["foot:newsletter", { title: "Les coulisses, une fois par mois", sub: "Un making-of et un conseil de tournage dans votre boîte.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Films", "/films"], ["Production", "/production"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: pc("Studio 4, 17 quai de la Fosse, 44000 Nantes", "02 40 00 77 31", "prod@clapetcie.example", "Du lundi au vendredi, 9 h – 19 h", "Des films d'entreprise qu'on regarde jusqu'au bout."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Production de films d'entreprise · Nantes", title: "Votre entreprise mérite un vrai film.", sub: "Films institutionnels, témoignages clients, drones et captations : écriture, tournage et montage dans notre studio.", cta: ["Voir les films", "/films"], cta2: ["Demander un devis", "/contact"], image: "hero" }],
        ["gal:carousel", { eyebrow: "Bobine", title: "Derniers films", items: [{ t: "Chantiers Aubier", x: "Film institutionnel, 2 min 30" }, { t: "Clinique des Dunes", x: "Série de témoignages" }, { t: "Port Atlantique", x: "Images de drone" }, { t: "Brasserie Tonnelle", x: "Spot de lancement" }] }],
        ["feat:strips", { title: "Ce que nous tournons", items: [{ t: "Film institutionnel", x: "Présenter l'entreprise, ses valeurs et ses équipes." }, { t: "Témoignage client", x: "Interviews et cas d'usage filmés sur site." }, { t: "Captation d'événement", x: "Conférences, salons, soirées, en multicaméra." }, { t: "Drone et aérien", x: "Pilotes certifiés, autorisations incluses." }] }],
        ["proof:big", { items: [{ q: "Un tournage sans stress et un montage qui a fait pleurer le comité de direction.", n: "Valérie D.", r: "responsable communication, cliente fictive" }] }],
        ["proof:logos", { title: "Ils nous ont fait confiance (exemples)", items: ["Aubier Bâtiment", "Clinique des Dunes", "Port Atlantique", "Brasserie Tonnelle", "Coop Estuaire"] }],
        ["cta:image", { title: "Parlons de votre prochain tournage.", sub: "Devis détaillé sous trois jours ouvrés.", cta: ["Écrire à la production", "/contact"] }],
      ] },
      { key: "films", name: "Films", blocks: [
        ph("Films", "Une sélection de réalisations récentes."),
        ["gal:masonry", { items: [{ t: "Chantiers Aubier", x: "Institutionnel" }, { t: "Clinique des Dunes", x: "Témoignages" }, { t: "Port Atlantique", x: "Drone" }, { t: "Brasserie Tonnelle", x: "Spot" }, { t: "Coop Estuaire", x: "Rapport d'activité filmé" }] }],
        ["proof:quotes", { items: [{ q: "Précis, discrets, drôles. Le plateau idéal.", n: "Marc L.", r: "directeur général, client fictif" }, { q: "Quinze interviews en deux jours, sans accroc.", n: "Nadia S.", r: "DRH, cliente fictive" }] }],
        ["cta:band", { title: "Envie de voir plus ?", sub: "Nous partageons notre bobine complète sur demande.", cta: ["Demander la bobine", "/contact"] }],
      ] },
      { key: "production", name: "Production", blocks: [
        ph("Production", "De l'idée au fichier final."),
        ["feat:steps", { title: "Une chaîne de fabrication claire", items: [{ t: "Écriture", d: "J-30", x: "Note d'intention, scénario, storyboard." }, { t: "Préparation", d: "J-10", x: "Repérages, casting, plan de travail." }, { t: "Tournage", d: "J", x: "Équipe légère, matériel cinéma." }, { t: "Montage", d: "J+7", x: "Étalonnage, mixage, sous-titres." }, { t: "Livraison", d: "J+15", x: "Formats web, salon et réseaux." }] }],
        ["feat:list2", { title: "Inclus dans chaque production", items: [{ t: "Équipe image et son" }, { t: "Musique libre de droits" }, { t: "Sous-titrage français et anglais" }, { t: "Deux allers-retours de montage" }, { t: "Versions verticales pour les réseaux" }, { t: "Fichiers sources archivés" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Combien de jours de tournage ?", x: "Un film de 2 minutes se tourne en général en une journée." }, { t: "Et le droit à l'image ?", x: "Nous préparons les autorisations pour chaque personne filmée." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Des forfaits d'exemple, ajustés à chaque projet."),
        ["price:tiers", { items: [{ t: "Témoignage", price: "1 900 €", period: "HT", x: "Un film court sur site.", f: ["Une demi-journée", "Un interviewé", "Montage 60 s"], cta: "Choisir", url: "/contact" }, { t: "Institutionnel", price: "6 400 €", period: "HT", x: "Notre formule la plus demandée.", f: ["Une journée", "Écriture incluse", "Montage 2 min 30", "Version réseaux"], hl: true, cta: "Choisir", url: "/contact" }, { t: "Série", price: "Sur devis", x: "Pour plusieurs films.", f: ["Plusieurs tournages", "Charte graphique vidéo", "Calendrier de diffusion"], cta: "Discuter", url: "/contact" }] }],
        ["feat:compare", { title: "Comparer les formules", rows: [["", "Témoignage", "Institutionnel", "Série"], ["Écriture", "non", "oui", "oui"], ["Drone", "option", "option", "oui"], ["Version réseaux", "non", "oui", "oui"]] }],
        ["cta:card", { title: "Un budget précis en trois jours.", cta: ["Demander un devis", "/contact"] }],
      ] },
    ],
  },
  // 3. Relations presse
  {
    key: "relais-presse", name: "Relais Presse", category: "agence", tags: ["classique", "editorial"], siteType: "Agence de relations presse",
    description: "Agence de relations presse sobre et crédible : bandeau de type journal, bleu éditorial, colonnes lisibles et revue de presse en cartes.",
    brand: "Relais Presse",
    tokens: { colors: { primary: "#1f4fd8", secondary: "#121a2e", accent: "#f59e0b", background: "#f5f7fb", surface: "#ffffff", text: "#121a2e", muted: "#4a566e" }, fonts: { heading: "font.literata", body: "font.cabin", button: "font.cabin", link: "font.cabin" }, radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 4 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.01, transform: "none" } }, border: { width: 1, color: "#d5dcea" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "relaispresse", motifs: ["skyline", "tiles", "topo"] },
    head: ["head:masthead", { dateline: "Agence de relations presse et d'influence · Paris" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["Revue de presse", "/revue-de-presse"], ["Actualités", "/actualites"], ["Contact", "/contact"]], cta: ["Briefer l'agence", "/contact"],
    contact: pc("14 rue de Cléry, 75002 Paris", "01 40 00 62 20", "presse@relaispresse.example", "Du lundi au vendredi, 9 h – 18 h", "La bonne information, au bon journaliste."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Relations presse", title: "Faire entendre ce que vous avez à dire.", sub: "Nous construisons votre présence dans les médias généralistes, économiques et spécialisés, sans promesses creuses.", cta: ["Nos expertises", "/expertises"], image: "hero" }],
        ["proof:stats", { items: [["900", "retombées en 2025 (exemple)"], ["340", "journalistes dans notre carnet"], ["12", "consultants"]] }],
        ["feat:rows", { eyebrow: "Expertises", title: "Ce que nous faisons pour vous", bg: "token:surface", items: [{ t: "Relations presse", x: "Communiqués, dossiers de presse, interviews, rendez-vous." }, { t: "Relations influence", x: "Experts, créateurs et prescripteurs de votre secteur." }, { t: "Gestion de crise", x: "Cellule d'alerte, éléments de langage, porte-parole." }, { t: "Prise de parole dirigeants", x: "Tribunes, médiatraining, présence LinkedIn." }] }],
        ["gal:cards", { title: "Dernières retombées", items: [{ t: "Quotidien régional", tag: "Presse écrite", x: "Portrait d'une PME industrielle de la Loire." }, { t: "Chaîne d'info", tag: "TV", x: "Interview d'un dirigeant sur la sobriété énergétique." }, { t: "Magazine spécialisé", tag: "Presse métier", x: "Dossier de six pages sur un nouvel outil de santé." }] }],
        ["proof:quotes", { items: [{ q: "Un carnet d'adresses réel, et surtout de la franchise sur ce qui est médiatisable.", n: "Corentin F.", r: "fondateur, client fictif" }, { q: "Notre crise a été contenue en quarante-huit heures.", n: "Sophie A.", r: "secrétaire générale, cliente fictive" }] }],
        ["cta:split", { title: "Une actualité à porter ?", sub: "Un premier échange de 30 minutes est offert.", cta: ["Prendre contact", "/contact"] }],
      ] },
      { key: "expertises", name: "Expertises", blocks: [
        ph("Expertises"),
        ["feat:tabs", { title: "Nos terrains d'intervention", items: [{ t: "Lancement", x: "Annonce d'un produit, d'une levée de fonds ou d'une nomination." }, { t: "Corporate", x: "Résultats, RSE, transformation, marque employeur." }, { t: "Crise", x: "Veille, cellule de crise et gestion du après." }, { t: "Influence", x: "Experts, ambassadeurs et relais d'opinion." }] }],
        ["feat:checks", { title: "Un abonnement presse clair", cta: ["Demander une proposition", "/contact"], items: [{ t: "Plan de relations presse sur 6 à 12 mois" }, { t: "Compte rendu mensuel chiffré" }, { t: "Rendez-vous presse organisés" }, { t: "Veille médias quotidienne" }] }],
        ["feat:pricelist", { title: "Honoraires d'exemple", items: [{ t: "Mission ponctuelle", x: "Communiqué et relances ciblées", price: "À partir de 1 800 €" }, { t: "Abonnement mensuel", x: "Relations presse suivies", price: "À partir de 2 600 € / mois" }, { t: "Cellule de crise", x: "Astreinte et conseil", price: "Sur devis" }] }],
      ] },
      { key: "revue-de-presse", name: "Revue de presse", blocks: [
        ph("Revue de presse", "Quelques parutions obtenues pour nos clients."),
        ["gal:grid", { items: [{ t: "Quotidien régional", x: "Portrait d'entreprise" }, { t: "Chaîne d'info", x: "Interview" }, { t: "Magazine métier", x: "Dossier" }, { t: "Radio nationale", x: "Chronique" }, { t: "Presse économique", x: "Brève" }, { t: "Site d'information", x: "Tribune" }] }],
        ["proof:logos", { title: "Médias où nous avons placé des sujets (exemples)", items: ["Le Courrier du Midi", "Revue Terroirs", "Info Éco", "Radio Cité", "Le Fil Santé"] }],
        ["cta:band", { title: "Votre sujet mérite une parution.", cta: ["Nous le raconter", "/contact"] }],
      ] },
      { key: "actualites", name: "Actualités", blocks: [
        ph("Actualités", "Conseils et décryptages de l'équipe."),
        ["misc:posts", { title: "Derniers articles", count: 3, layout: "list" }],
        ["misc:quote", { text: "Un communiqué de presse n'est pas une publicité : il doit répondre à la question du journaliste.", by: "Claire Montluc, directrice de l'agence (fictive)" }],
        ["feat:accordion", { title: "Questions de dirigeants", items: [{ t: "Quand envoyer un communiqué ?", x: "En début de semaine, avant dix heures." }, { t: "Faut-il payer les journalistes ?", x: "Jamais. La relation presse repose sur la valeur de l'information." }] }],
      ] },
    ],
  },
  // 4. Studio UX/UI
  {
    key: "grille-ux", name: "Grille UX", category: "agence", tags: ["moderne", "technique"], siteType: "Studio de design UX/UI",
    description: "Studio de design produit au rendu net : violet électrique, cartes alignées sur une grille régulière, onglets de méthode et études de cas techniques.",
    brand: "Grille UX",
    tokens: { colors: { primary: "#6a3df0", secondary: "#1b1633", accent: "#19c3a0", background: "#faf8ff", surface: "#ffffff", text: "#1b1633", muted: "#5a5575" }, fonts: { heading: "font.sora", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 10, card: 14 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.08, letterSpacing: -0.025, transform: "none" } }, border: { width: 1, color: "#e4defa" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "grilleux", motifs: ["mesh", "tiles", "blobs"] },
    head: ["head:float", {}], foot: ["foot:columns", { about: "Studio de design UX/UI : recherche utilisateur, interfaces et design systems pour produits numériques.", cols: [["Studio", "/etudes-de-cas", "/processus", "/tarifs"], ["Contact", "/contact"]] }],
    menu: [["Accueil", "/"], ["Études de cas", "/etudes-de-cas"], ["Processus", "/processus"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Planifier un atelier", "/contact"],
    contact: pc("5 passage du Cheval Blanc, 75011 Paris", "01 85 00 29 63", "hello@grilleux.example", "Du lundi au vendredi, 9 h – 18 h", "Des interfaces que l'on comprend du premier coup."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Studio UX/UI · Paris", title: "Concevoir des produits que l'on adopte.", sub: "Recherche utilisateur, prototypage, interface et design system pour applications web et mobiles.", cta: ["Voir les études de cas", "/etudes-de-cas"], cta2: ["Planifier un atelier", "/contact"], angle: 135, stats: [["42", "produits lancés (exemple)"], ["8", "designers"], ["98 %", "de livraisons dans les temps (exemple)"]] }],
        ["feat:grid-icons", { eyebrow: "Services", title: "Du terrain à l'écran", items: [{ t: "Recherche", x: "Entretiens, tests, analyse des usages.", icon: "search" }, { t: "Architecture", x: "Parcours, arborescence, flux.", icon: "network" }, { t: "Interface", x: "Maquettes, animations, accessibilité.", icon: "layout" }, { t: "Design system", x: "Composants et documentation.", icon: "layers" }] }],
        ["gal:cards", { title: "Études de cas", bg: "token:surface", items: [{ t: "Appli de rendez-vous médicaux", tag: "Santé", x: "Taux de rendez-vous honorés en hausse de 22 % (exemple)." }, { t: "Portail énergie", tag: "Services", x: "Facture lisible en trois écrans." }, { t: "Back-office logistique", tag: "B2B", x: "Interface dense mais lisible." }] }],
        ["proof:quotes", { items: [{ q: "Leurs maquettes ont tranché six mois de débats internes.", n: "Joël P.", r: "directeur produit, client fictif" }, { q: "Le design system a divisé par deux nos allers-retours avec les développeurs.", n: "Maëlle T.", r: "CTO, cliente fictive" }] }],
        ["feat:checks", { title: "Ce que vous recevez", cta: ["Parler de votre produit", "/contact"], items: [{ t: "Maquettes Figma commentées" }, { t: "Prototype cliquable testé" }, { t: "Bibliothèque de composants" }, { t: "Audit d'accessibilité RGAA" }] }],
        ["cta:band", { title: "Prêts à tester vos idées ?", cta: ["Réserver un atelier", "/contact"] }],
      ] },
      { key: "etudes-de-cas", name: "Études de cas", blocks: [
        ph("Études de cas", "Trois produits, trois contextes."),
        ["feat:alt", { title: "Retours d'expérience", items: [{ t: "Appli de rendez-vous médicaux", x: "Refonte du parcours en 5 écrans, tests avec 24 patients, réduction des abandons.", link: ["Nous contacter", "/contact"] }, { t: "Portail énergie", x: "Facture lisible, suivi de consommation et mode sombre." }, { t: "Back-office logistique", x: "Tableaux denses, raccourcis clavier, formation courte." }] }],
        ["proof:statsbar", { items: [["+22 %", "rendez-vous honorés"], ["-35 %", "appels au support"], ["4,6/5", "note d'usage (exemple)"]] }],
        ["cta:split", { title: "Un produit à améliorer ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "processus", name: "Processus", blocks: [
        ph("Processus", "Une méthode itérative, jamais figée."),
        ["feat:tabs", { title: "Nos quatre phases", items: [{ t: "Découvrir", x: "Entretiens utilisateurs et audit de l'existant." }, { t: "Définir", x: "Personas, parcours, priorités." }, { t: "Concevoir", x: "Maquettes, prototypes et tests." }, { t: "Livrer", x: "Design system, specs et suivi du développement." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Travaillez-vous avec nos développeurs ?", x: "Oui, nous livrons des spécifications au format de votre outil." }, { t: "Faites-vous du design accessible ?", x: "L'accessibilité est incluse dans toutes les missions." }, { t: "Pouvez-vous intervenir sur un produit existant ?", x: "Oui, après un audit de deux jours." }] }],
        ["cta:card", { title: "Un audit UX en deux jours.", cta: ["Demander l'audit", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Tarifs d'exemple pour des missions types."),
        ["price:tiers", { items: [{ t: "Audit", price: "3 200 €", period: "HT", x: "Photographier l'existant.", f: ["Heuristiques UX", "Revue d'accessibilité", "Plan d'actions"], cta: "Choisir", url: "/contact" }, { t: "Sprint design", price: "14 500 €", period: "HT", x: "Cinq jours pour tester une idée.", f: ["Atelier de cadrage", "Prototype", "Tests avec 5 utilisateurs"], hl: true, cta: "Choisir", url: "/contact" }, { t: "Produit complet", price: "Sur devis", x: "De la recherche au design system.", f: ["Équipe dédiée", "Suivi développement"], cta: "Discuter", url: "/contact" }] }],
        ["feat:list2", { title: "Toujours inclus", items: [{ t: "Fichiers Figma partagés" }, { t: "Points hebdomadaires" }, { t: "Documentation à jour" }, { t: "Accompagnement en phase de développement" }] }],
        ["cta:band", { title: "Besoin d'un devis personnalisé ?", cta: ["Nous contacter", "/contact"] }],
      ] },
    ],
  },
  // 5. Motion design
  {
    key: "mouvance-lab", name: "Mouvance Lab", category: "agence", tags: ["sombre", "audacieux"], siteType: "Studio de motion design",
    description: "Studio de motion design en mode sombre : fond quasi noir, vert fluo très vif, énormes titres Syne et galerie de séquences en collage.",
    brand: "Mouvance Lab",
    tokens: { colors: { primary: "#c6f432", secondary: "#1d2318", accent: "#ff5ca8", background: "#0b0d0a", surface: "#151912", text: "#f1f5e9", muted: "#aab39a" }, fonts: { heading: "font.syne", body: "font.chivo", button: "font.chivo", link: "font.chivo" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 68, weight: 800, lineHeight: 1, letterSpacing: -0.03, transform: "uppercase" } }, border: { width: 1, color: "#2a3322" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "mouvancelab", motifs: ["ribbons", "rays", "mesh"] },
    head: ["head:dark", {}], foot: ["foot:big", { title: "Mouvance Lab" }],
    menu: [["Accueil", "/"], ["Réalisations", "/realisations"], ["Services", "/services"], ["Le labo", "/labo"], ["Contact", "/contact"]], cta: ["Briefer le studio", "/contact"],
    contact: pc("Halle 6, 40 rue du Faubourg Saint-Léonard, 59000 Lille", "03 20 00 18 52", "motion@mouvancelab.example", "Du lundi au vendredi, 10 h – 19 h", "Faire bouger ce que vous voulez dire."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Studio de motion design · Lille", title: "Votre message en mouvement.", sub: "Explainers, titrages, logos animés, habillage d'écrans : 2D, 3D et compositing.", cta: ["Voir les réalisations", "/realisations"], cta2: ["Briefer le studio", "/contact"] }],
        ["proof:statsbar", { items: [["350", "animations livrées (exemple)"], ["60 fps", "toujours fluides"], ["9", "animateurs"]] }],
        ["gal:wall", { title: "Dernières séquences", items: [{ t: "Logo animé" }, { t: "Explainer 90 s" }, { t: "Titrage de série" }, { t: "Habillage salon" }] }],
        ["feat:bento", { title: "Un studio, trois pôles", items: [{ t: "Explainers", x: "Expliquer un produit complexe en 90 secondes, voix off incluse." }, { t: "Identité animée", x: "Logos, jingles visuels et transitions." }, { t: "3D produit", x: "Rendus photoréalistes et animations de démonstration." }] }],
        ["feat:icons", { title: "Boîte à outils", items: [{ t: "After Effects et Cinema 4D", x: "Le cœur de notre production.", icon: "layers" }, { t: "Sound design", x: "Musique et bruitages sur mesure.", icon: "play" }, { t: "Formats multiples", x: "Écrans LED, réseaux, web, TV.", icon: "monitor" }] }],
        ["cta:image", { title: "Un brief ? Une idée floue ?", sub: "Envoyez-nous votre texte, nous revenons avec un storyboard.", cta: ["Envoyer le brief", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ph("Réalisations", "Quelques séquences sorties du labo."),
        ["gal:masonry", { items: [{ t: "Banque Mutuelle Sud", x: "Explainer 90 s" }, { t: "Festival Lumières Lille", x: "Titrage" }, { t: "Fondation Rivage", x: "Logo animé" }, { t: "Salon de l'Auto", x: "Habillage écrans" }, { t: "Start-up Seve", x: "3D produit" }] }],
        ["proof:big", { items: [{ q: "En quatre semaines, notre produit invisible est devenu limpide.", n: "Camille G.", r: "directrice de produit, cliente fictive" }] }],
        ["cta:band", { title: "Mettons votre message en mouvement.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ph("Services"),
        ["feat:pricelist", { title: "Tarifs d'exemple", items: [{ t: "Logo animé", x: "5 à 8 secondes, plusieurs formats", price: "À partir de 900 €" }, { t: "Explainer 90 s", x: "Script, storyboard, animation, voix", price: "À partir de 6 800 €" }, { t: "Titrage de série", x: "Générique et habillage", price: "Sur devis" }, { t: "Pack réseaux", x: "10 animations verticales", price: "À partir de 2 400 €" }] }],
        ["feat:steps", { title: "Comment ça se passe", items: [{ t: "Script", x: "Nous reformulons votre message." }, { t: "Storyboard", x: "Dessins validés image par image." }, { t: "Animation", x: "Première version sous deux semaines." }, { t: "Sound design", x: "Musique et voix." }] }],
        ["cta:split", { title: "Besoin d'un délai court ?", sub: "Une cellule express existe pour les urgences.", cta: ["Demander l'express", "/contact"] }],
      ] },
      { key: "labo", name: "Le labo", blocks: [
        ph("Le labo", "Neuf animateurs, un grand tableau blanc."),
        ["misc:story", { eyebrow: "Depuis 2015", title: "Un studio né d'un court-métrage", paras: ["Deux animateurs, un ordinateur de récupération et un film d'école : voilà le début de Mouvance Lab.", "Aujourd'hui l'équipe réunit motion designers, illustrateurs, ingénieurs du son et producteurs."] }],
        ["proof:team", { items: [{ n: "Zoé Ferrand", r: "Directrice artistique" }, { n: "Ibrahim Nolle", r: "Animateur 3D" }, { n: "Lena Brivet", r: "Productrice" }] }],
        ["feat:list2", { title: "Nos engagements", items: [{ t: "Version corrigeable sans surcoût" }, { t: "Fichiers sources fournis" }, { t: "Délais tenus" }, { t: "Une seule interlocutrice" }] }],
      ] },
    ],
  },
  // 6. Naming / stratégie de marque
  {
    key: "nomade-nom", name: "Nomade & Nom", category: "agence", tags: ["editorial", "minimaliste"], siteType: "Agence de naming et de stratégie de marque",
    description: "Agence de naming à l'esthétique posée : serif d'affichage, vert profond, listes numérotées et mots mis en vedette dans de larges marges.",
    brand: "Nomade & Nom",
    tokens: { colors: { primary: "#0f766e", secondary: "#0e2321", accent: "#e8a33d", background: "#f3f7f6", surface: "#ffffff", text: "#0e2321", muted: "#4b6360" }, fonts: { heading: "font.dm-serif-display", body: "font.jost", button: "font.jost", link: "font.jost" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.05, letterSpacing: -0.01, transform: "none" } }, border: { width: 1, color: "#cfdcda" } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "nomadenom", motifs: ["arches", "topo", "plates"] },
    head: ["head:split", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Naming", "/naming"], ["Stratégie", "/strategie"], ["Réalisations", "/realisations"], ["Contact", "/contact"]], cta: ["Trouver un nom", "/contact"],
    contact: pc("3 rue des Tanneurs, 67000 Strasbourg", "03 88 00 56 74", "nom@nomadenom.example", "Du mardi au vendredi, 9 h – 17 h 30", "Un bon nom se dit, se retient, se défend."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Naming · Stratégie de marque", title: "Le nom juste, au bon moment.", sub: "Nous inventons les noms de marques, de produits et de gammes, puis nous vérifions qu'ils tiennent en droit, à l'oral et à l'étranger.", cta: ["Découvrir le naming", "/naming"] }],
        ["feat:numbered", { title: "Trois exigences", items: [{ t: "Mémorable", x: "Court, prononçable, sans équivoque." }, { t: "Disponible", x: "Recherche d'antériorité et noms de domaine." }, { t: "Durable", x: "Pas d'effet de mode, pas de faux ami." }] }],
        ["proof:big", { items: [{ q: "Sept lettres, une évidence. Le nom nous a donné notre identité.", n: "Baptiste N.", r: "cofondateur, client fictif" }] }],
        ["feat:alt", { title: "Deux histoires de noms", items: [{ t: "Sillage, coopérative de transport fluvial", x: "Un nom qui évoque le mouvement et la durée, avec signature « Voguer ensemble ».", link: ["Voir les réalisations", "/realisations"] }, { t: "Marelle, gamme de jeux éducatifs", x: "Un mot du jeu traditionnel pour une marque tournée vers l'enfance." }] }],
        ["proof:logos", { title: "Marques nommées (exemples fictifs)", items: ["Sillage", "Marelle", "Tendre Pierre", "Haut-Fond", "Lumen Sud"] }],
        ["cta:card", { title: "Un nom à inventer ?", sub: "Un premier atelier d'une demi-journée suffit pour poser le cadre.", cta: ["Réserver l'atelier", "/contact"] }],
      ] },
      { key: "naming", name: "Naming", blocks: [
        ph("Naming", "Une méthode pour passer de mille idées à trois noms."),
        ["feat:steps", { title: "Du brief à la vérification", items: [{ t: "Immersion", d: "Semaine 1", x: "Entretiens, lexique, concurrents." }, { t: "Exploration", d: "Semaine 2", x: "Plus de 500 pistes brutes." }, { t: "Sélection", d: "Semaine 3", x: "Trente noms, dix finalistes." }, { t: "Vérification", d: "Semaine 4", x: "Antériorité, domaines, tests oraux." }] }],
        ["feat:list2", { title: "Livrables", items: [{ t: "Trois noms finalistes argumentés" }, { t: "Recherche d'antériorité" }, { t: "Test linguistique multilingue" }, { t: "Nom de domaine et pseudos réservés" }, { t: "Signature de marque" }, { t: "Cession des droits" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Dépose-t-on la marque pour nous ?", x: "Nous préparons le dossier avec votre conseil en propriété industrielle." }, { t: "Et si aucun nom ne vous plaît ?", x: "Une seconde vague de pistes est incluse." }] }],
      ] },
      { key: "strategie", name: "Stratégie", blocks: [
        ph("Stratégie de marque"),
        ["feat:rows", { title: "Une plateforme de marque en quatre chapitres", items: [{ t: "Raison d'être", x: "Pourquoi votre entreprise existe." }, { t: "Promesse", x: "Ce que vous tenez devant vos clients." }, { t: "Valeurs", x: "Trois mots qui orientent les décisions." }, { t: "Ton de voix", x: "Comment vous parlez et comment vous écrivez." }] }],
        ["feat:pricelist", { title: "Honoraires d'exemple", items: [{ t: "Atelier de cadrage", x: "Une demi-journée", price: "950 €" }, { t: "Naming complet", x: "Vérifications comprises", price: "À partir de 7 500 €" }, { t: "Plateforme de marque", x: "Document et restitution", price: "À partir de 9 800 €" }] }],
        ["cta:split", { title: "Définissons vos fondations.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ph("Réalisations", "Des noms qui ont trouvé leur public."),
        ["gal:strip", { title: "Noms récents", items: [{ t: "Sillage" }, { t: "Marelle" }, { t: "Tendre Pierre" }, { t: "Haut-Fond" }, { t: "Lumen Sud" }] }],
        ["proof:quotes", { items: [{ q: "Le nom a convaincu nos investisseurs en une réunion.", n: "Aurore C.", r: "fondatrice, cliente fictive" }, { q: "Une méthode rigoureuse et une vraie élégance.", n: "Denis M.", r: "dirigeant, client fictif" }] }],
        ["cta:band", { title: "Prêts à vous nommer ?", cta: ["Nous écrire", "/contact"] }],
      ] },
    ],
  },
  // 7. Illustration
  {
    key: "craie-et-encre", name: "Craie & Encre", category: "agence", tags: ["ludique", "chaleureux"], siteType: "Studio d'illustration",
    description: "Studio d'illustration à l'humeur joyeuse : serif souple Fraunces, magenta profond, formes arrondies et portfolio en mur de carrés.",
    brand: "Craie & Encre",
    tokens: { colors: { primary: "#a21caf", secondary: "#2a1530", accent: "#fbbf24", background: "#fff6fb", surface: "#ffffff", text: "#2a1530", muted: "#6a4d70" }, fonts: { heading: "font.fraunces", body: "font.quicksand", button: "font.quicksand", link: "font.quicksand" }, radius: { sm: 10, md: 18, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.08, letterSpacing: -0.015, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "craieencre", motifs: ["botanical", "blobs", "objects"] },
    head: ["head:topbar", { info: "Illustrations pour l'édition, la presse et les marques", note: "Commandes ouvertes pour l'automne" }], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Portfolio", "/portfolio"], ["Commandes", "/commandes"], ["Tarifs", "/tarifs"], ["L'atelier", "/atelier"]], cta: ["Commander une illustration", "/contact"],
    contact: pc("18 rue des Teinturiers, 84000 Avignon", "04 90 00 33 87", "dessins@craieetencre.example", "Du lundi au jeudi, 9 h – 17 h", "Des dessins qui racontent avant les mots."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Studio d'illustration · Avignon", title: "On dessine ce que les mots n'arrivent pas à dire.", sub: "Albums jeunesse, presse, packagings, fresques et identités illustrées par quatre illustratrices et illustrateurs.", cta: ["Voir le portfolio", "/portfolio"], cta2: ["Commander", "/contact"], image: "hero" }],
        ["gal:wall", { title: "Un petit tour au crayon", items: [{ t: "Album jeunesse" }, { t: "Presse" }, { t: "Fresque" }, { t: "Packaging" }] }],
        ["feat:cards", { eyebrow: "Commandes", title: "Ce que l'on illustre", bg: "token:surface", items: [{ t: "Édition jeunesse", x: "Albums, couvertures et planches.", icon: "book" }, { t: "Presse et magazine", x: "Dessins d'actualité et infographies.", icon: "fileText" }, { t: "Marques", x: "Mascottes, motifs et campagnes.", icon: "palette" }] }],
        ["proof:quotes", { items: [{ q: "Elles ont donné un visage à notre maison d'édition.", n: "Pauline R.", r: "éditrice, cliente fictive" }, { q: "Les dessins ont fait le tour des réseaux en deux jours.", n: "Mathias O.", r: "directeur de marque, client fictif" }] }],
        ["feat:steps", { title: "Une commande, pas à pas", items: [{ t: "Brief", d: "Jour 1", x: "Vos références et votre usage." }, { t: "Croquis", d: "Jour 5", x: "Trois pistes noir et blanc." }, { t: "Encrage", d: "Jour 10", x: "La piste choisie, en couleur." }, { t: "Livraison", d: "Jour 14", x: "Fichiers HD et licences." }] }],
        ["cta:card", { title: "Un projet à dessiner ?", sub: "Racontez-nous l'histoire, nous trouvons le trait.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "portfolio", name: "Portfolio", blocks: [
        ph("Portfolio", "Quelques projets, classés par envie."),
        ["gal:grid", { items: [{ t: "Le renard et la lune", x: "Album jeunesse" }, { t: "Marché de Provence", x: "Fresque" }, { t: "Infographie énergie", x: "Presse" }, { t: "Tisanes du Ventoux", x: "Packaging" }, { t: "Mascotte Poum", x: "Identité" }, { t: "Affiche du festival", x: "Événement" }] }],
        ["proof:stats", { items: [["180", "projets illustrés (exemple)"], ["22", "livres publiés"], ["4", "illustrateurs"]] }],
        ["cta:band", { title: "Votre histoire a besoin d'images.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "commandes", name: "Commandes", blocks: [
        ph("Commandes", "Comment travailler avec nous."),
        ["feat:tabs", { title: "Selon votre besoin", items: [{ t: "Édition", x: "Illustration d'un album ou d'un roman, de 12 à 40 planches." }, { t: "Presse", x: "Dessin sous 48 h pour l'actualité." }, { t: "Marque", x: "Mascotte, motif, campagne saisonnière." }, { t: "Mur", x: "Fresques intérieures et vitrines." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quelles techniques utilisez-vous ?", x: "Encre, gouache, crayon, numérique : selon le projet." }, { t: "Cédez-vous les droits ?", x: "Oui, par licence adaptée à l'usage." }, { t: "Un dessin peut-il être modifié ?", x: "Deux retouches sont incluses." }] }],
        ["cta:split", { title: "Un délai serré ?", sub: "Nous gardons des créneaux express chaque mois.", cta: ["Demander un créneau", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Repères d'exemple, devis sur demande."),
        ["feat:pricelist", { title: "Prix indicatifs", items: [{ t: "Illustration de presse", x: "Un dessin couleur, cession web", price: "À partir de 280 €" }, { t: "Couverture d'album", x: "Croquis + version finale", price: "À partir de 1 200 €" }, { t: "Motif de marque", x: "Motif répétable déclinable", price: "À partir de 850 €" }, { t: "Fresque murale", x: "Par mètre carré", price: "À partir de 120 € / m²" }] }],
        ["misc:text", { eyebrow: "Bon à savoir", title: "Un acompte de 30 %", paras: ["Le reste est facturé à la livraison des fichiers. Les droits d'usage sont précisés par écrit avant de commencer."] }],
        ["cta:card", { title: "Un devis en 48 h.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "atelier", name: "L'atelier", blocks: [
        ph("L'atelier", "Une grande table, beaucoup de pots de crayons."),
        ["misc:story", { eyebrow: "Depuis 2013", title: "Quatre mains, un même carnet", paras: ["Craie & Encre est né dans une librairie d'Avignon, entre deux dédicaces.", "Nous aimons les histoires, les cartons à dessin et les cafés trop longs."] }],
        ["proof:team", { items: [{ n: "Maëlys Orgeat", r: "Illustratrice jeunesse" }, { n: "Victor Rambal", r: "Illustrateur presse" }, { n: "Noor Hadjadj", r: "Directrice artistique" }] }],
        ["cta:band", { title: "Venez voir l'atelier.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
    ],
  },
  // 8. Événementiel digital
  {
    key: "fete-numerique", name: "Fête Numérique", category: "agence", tags: ["audacieux", "chaleureux"], siteType: "Agence événementielle digitale",
    description: "Agence d'événements hybrides et de webinaires : orange chaud, compte à rebours en vedette, programme minuté et cartes de formats en bento.",
    brand: "Fête Numérique",
    tokens: { colors: { primary: "#c2410c", secondary: "#261a14", accent: "#0ea5a5", background: "#fffaf5", surface: "#ffffff", text: "#261a14", muted: "#6b5548" }, fonts: { heading: "font.bricolage-grotesque", body: "font.outfit", button: "font.outfit", link: "font.outfit" }, radius: { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 18 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.04, letterSpacing: -0.025, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "fetenum", motifs: ["rays", "bokeh", "blobs"] },
    head: ["head:side", {}], foot: ["foot:columns", { about: "Agence événementielle digitale : webinaires, conventions hybrides et lancements en direct.", cols: [["Événements", "/formats", "/programme", "/tarifs"], ["Contact", "/contact", "/references"]] }],
    menu: [["Accueil", "/"], ["Formats", "/formats"], ["Programme type", "/programme"], ["Tarifs", "/tarifs"], ["Références", "/references"], ["Contact", "/contact"]], cta: ["Organiser un événement", "/contact"],
    contact: pc("9 cours Pasteur, 33000 Bordeaux", "05 57 00 84 29", "live@fetenumerique.example", "Du lundi au vendredi, 9 h – 19 h", "Rassemblez cent ou dix mille personnes, où qu'elles soient."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:countdown", { eyebrow: "Prochaine convention hybride", title: "Rassemblez votre communauté, où qu'elle soit.", sub: "Webinaires, conventions hybrides, lancements produit en direct : régie, plateau et plateforme clé en main.", cta: ["Voir les formats", "/formats"], until: "2030-06-01T18:00:00+02:00" }],
        ["feat:bento", { eyebrow: "Formats", title: "Un événement sur mesure", items: [{ t: "Convention hybride", x: "Salle physique, plateau, diffusion en direct et interaction du public à distance." }, { t: "Webinaire", x: "Régie, modération et replay." }, { t: "Lancement produit", x: "Scénographie virtuelle et démonstration en live." }] }],
        ["proof:stats", { items: [["400", "événements produits (exemple)"], ["12 000", "participants max. en simultané"], ["97 %", "de satisfaction (exemple)"]] }],
        ["misc:schedule", { title: "Un exemple de convention d'une demi-journée", items: [{ d: "9 h", t: "Accueil en ligne", x: "Chat, test technique." }, { d: "9 h 30", t: "Plénière", x: "Keynote et annonces." }, { d: "11 h", t: "Ateliers", x: "Quatre salles parallèles." }, { d: "12 h 30", t: "Clôture", x: "Questions-réponses." }] }],
        ["proof:quotes", { items: [{ q: "Cinq cents collaborateurs connectés, zéro bug. Le directeur technique est encore sous le choc.", n: "Brigitte E.", r: "directrice RH, cliente fictive" }] }],
        ["cta:split", { title: "Une date, une audience ?", sub: "Nous préparons une proposition de format sous 72 h.", cta: ["Demander un format", "/contact"] }],
      ] },
      { key: "formats", name: "Formats", blocks: [
        ph("Formats", "Nos terrains de jeu numériques."),
        ["feat:alt", { title: "Trois formats phares", items: [{ t: "Convention hybride", x: "Plateau de 80 m², régie vidéo, application d'événement et traduction simultanée.", link: ["Nous contacter", "/contact"] }, { t: "Webinaire premium", x: "Plateforme personnalisée, intervenants coachés, replay monté." }, { t: "Salon virtuel", x: "Stands, rendez-vous en visio et échanges de contacts." }] }],
        ["feat:grid-icons", { title: "Ce qui est inclus", items: [{ t: "Plateforme", x: "Inscription, replay, chat.", icon: "monitor" }, { t: "Régie", x: "Caméras, mixage, streaming.", icon: "video" }, { t: "Animation", x: "Présentateur, modération.", icon: "users" }, { t: "Bilan", x: "Statistiques d'audience.", icon: "barChart" }] }],
        ["cta:band", { title: "Votre événement sur mesure.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "programme", name: "Programme type", blocks: [
        ph("Programme type", "À quoi ressemble une journée."),
        ["misc:schedule", { title: "Séminaire d'une journée", items: [{ d: "8 h 30", t: "Briefing technique", x: "Test micros et caméras." }, { d: "9 h 30", t: "Ouverture", x: "Mot de la direction." }, { d: "10 h 30", t: "Tables rondes", x: "Animations interactives." }, { d: "14 h", t: "Ateliers", x: "Cinq sessions en parallèle." }, { d: "17 h", t: "Clôture", x: "Récapitulatif et rendez-vous suivants." }] }],
        ["feat:checks", { title: "Notre check-list avant le jour J", cta: ["Recevoir la liste", "/contact"], items: [{ t: "Répétition générale" }, { t: "Test réseau sur site" }, { t: "Plan B de diffusion" }, { t: "Support en direct" }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Combien de temps pour organiser ?", x: "De trois à huit semaines selon le format." }, { t: "Fournissez-vous le lieu ?", x: "Nous proposons notre studio ou nous nous déplaçons chez vous." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Formules d'exemple, devis après un brief."),
        ["price:tiers", { items: [{ t: "Webinaire", price: "2 400 €", period: "HT", x: "Pour jusqu'à 300 participants.", f: ["Régie à distance", "Modération", "Replay"], cta: "Choisir", url: "/contact" }, { t: "Hybride", price: "9 800 €", period: "HT", x: "Plateau et diffusion.", f: ["Plateau studio", "Application mobile", "Sous-titrage"], hl: true, cta: "Choisir", url: "/contact" }, { t: "Convention", price: "Sur devis", x: "Plus de 1 000 participants.", f: ["Équipe dédiée", "Scénographie", "Traduction"], cta: "Discuter", url: "/contact" }] }],
        ["feat:compare", { title: "Comparer", rows: [["", "Webinaire", "Hybride", "Convention"], ["Plateau studio", "non", "oui", "oui"], ["Traduction", "option", "option", "oui"], ["Application", "non", "oui", "oui"]] }],
        ["cta:band", { title: "Besoin d'un chiffrage ?", cta: ["Écrire à l'équipe", "/contact"] }],
      ] },
      { key: "references", name: "Références", blocks: [
        ph("Références", "Quelques événements récents."),
        ["gal:cards", { items: [{ t: "Convention commerciale", tag: "Hybride", x: "600 commerciaux sur trois sites." }, { t: "Journée santé", tag: "Webinaire", x: "Quatre plénières en direct." }, { t: "Lancement produit", tag: "Live", x: "Démonstration filmée en trois caméras." }] }],
        ["proof:logos", { title: "Clients (exemples fictifs)", items: ["Groupe Vallée", "Mutuelle Horizon", "Atelier Cobalt", "Union Coop", "Santé Nord"] }],
        ["cta:split", { title: "Et si c'était votre tour ?", cta: ["Discuter d'un projet", "/contact"] }],
      ] },
    ],
  },
  // 9. Packaging
  {
    key: "boite-kraft", name: "Boîte Kraft", category: "agence", tags: ["naturel", "classique"], siteType: "Studio de design packaging",
    description: "Studio de packaging aux tons papier : fond kraft clair, vert sapin, serif Marcellus et fiches produits montrant les gammes habillées.",
    brand: "Boîte Kraft",
    tokens: { colors: { primary: "#2f6f3e", secondary: "#1f2a1f", accent: "#d9a441", background: "#f4f1e6", surface: "#fbf9f1", text: "#1f2a1f", muted: "#556055" }, fonts: { heading: "font.marcellus", body: "font.rubik", button: "font.rubik", link: "font.rubik" }, radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 400, lineHeight: 1.1, letterSpacing: 0, transform: "none" } }, border: { width: 1, color: "#d6d1bd" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "boitekraft", motifs: ["plates", "tiles", "objects"] },
    head: ["head:bar", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Gammes", "/gammes"], ["Matériaux", "/materiaux"], ["Processus", "/processus"], ["Contact", "/contact"]], cta: ["Demander un échantillon", "/contact"],
    contact: pc("12 rue de la Papeterie, 38000 Grenoble", "04 76 00 19 45", "studio@boitekraft.example", "Du lundi au vendredi, 8 h 30 – 17 h 30", "L'emballage est le premier produit que l'on touche."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Design de packaging", title: "Un emballage, c'est une première poignée de main.", sub: "Nous dessinons coffrets, étuis, étiquettes et sacs pour les marques alimentaires, cosmétiques et artisanales, avec des matériaux responsables.", cta: ["Voir les gammes", "/gammes"], image: "hero" }],
        ["feat:icons", { title: "De l'idée au carton plié", items: [{ t: "Structure", x: "Étuis, coffrets, calages, tests de résistance.", icon: "layers" }, { t: "Graphisme", x: "Étiquettes, illustrations, mentions légales.", icon: "palette" }, { t: "Fabrication", x: "Réseau d'imprimeurs en France et en Europe.", icon: "printer" }] }],
        ["gal:featured", { title: "Gammes récentes", items: [{ t: "Tisanes du Vercors", x: "Étuis" }, { t: "Cacao Brun", x: "Coffret" }, { t: "Huile de Noix", x: "Étiquette" }, { t: "Savon Clair", x: "Pochette" }] }],
        ["proof:statsbar", { items: [["140", "gammes habillées (exemple)"], ["92 %", "de matériaux recyclables"], ["15", "imprimeurs partenaires"]] }],
        ["feat:rows", { title: "Pourquoi un studio dédié", bg: "token:surface", items: [{ t: "Impact en rayon", x: "Étude de lisibilité à deux mètres." }, { t: "Faisabilité", x: "Maquettes blanches avant impression." }, { t: "Coûts maîtrisés", x: "Format optimisé pour l'imprimeur." }] }],
        ["cta:band", { title: "Un produit à habiller ?", sub: "Un échantillon de cartons offert pour les premiers projets.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "gammes", name: "Gammes", blocks: [
        ph("Gammes", "Habillages créés pour nos clients."),
        ["gal:products", { title: "Fiches d'exemple", items: [{ t: "Étui tisane", x: "Carton 350 g", price: "Étui à 0,42 €" }, { t: "Coffret cacao", x: "Calage papier", price: "Coffret à 2,10 €" }, { t: "Étiquette huile", x: "Papier texturé", price: "Étiquette à 0,09 €" }, { t: "Pochette savon", x: "Papier kraft", price: "Pochette à 0,18 €" }] }],
        ["misc:text", { eyebrow: "Prix indicatifs", title: "Des coûts par unité", paras: ["Les montants sont des exemples pour des tirages de 5 000 pièces. Le devis final dépend de l'imprimeur et des finitions."] }],
        ["cta:split", { title: "Un devis par tirage.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "materiaux", name: "Matériaux", blocks: [
        ph("Matériaux", "Des choix sobres et responsables."),
        ["feat:cards", { title: "Notre palette de matières", items: [{ t: "Carton recyclé", x: "Solide, mat, certifié.", icon: "layers" }, { t: "Papier ensemencé", x: "Pour étiquettes et cartes de vœux.", icon: "star" }, { t: "Verre consigné", x: "Pour les produits liquides.", icon: "shield" }] }],
        ["feat:compare", { title: "Comparer les supports", rows: [["", "Carton", "Verre", "Papier ensemencé"], ["Recyclable", "oui", "oui", "oui"], ["Résistance", "bonne", "forte", "faible"], ["Coût", "bas", "moyen", "élevé"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Peut-on imprimer petite série ?", x: "Oui, dès 500 pièces en impression numérique." }, { t: "Les encres sont-elles alimentaires ?", x: "Nous utilisons des encres conformes aux normes de contact alimentaire." }] }],
      ] },
      { key: "processus", name: "Processus", blocks: [
        ph("Processus"),
        ["feat:steps", { title: "Le chemin d'un étui", items: [{ t: "Cadrage", d: "Semaine 1", x: "Produit, cible, budget." }, { t: "Pistes", d: "Semaine 2-3", x: "Trois dessins de face." }, { t: "Maquette blanche", d: "Semaine 4", x: "Pliage réel pour valider." }, { t: "Prépresse", d: "Semaine 5", x: "Fichiers prêts à imprimer." }, { t: "Suivi d'impression", d: "Semaine 6-7", x: "Épreuves et validation." }] }],
        ["feat:list2", { title: "Livrables", items: [{ t: "Fichiers d'exécution" }, { t: "Dieline (gabarit de découpe)" }, { t: "Cahier des charges imprimeur" }, { t: "Guide de déclinaison" }] }],
        ["proof:quotes", { items: [{ q: "Les étuis sont arrivés pliables du premier coup, ce qui n'était jamais arrivé.", n: "Delphine K.", r: "fondatrice, cliente fictive" }] }],
      ] },
    ],
  },
  // 10. Podcast / audio
  {
    key: "ondes-claires", name: "Ondes Claires", category: "agence", tags: ["sombre", "moderne"], siteType: "Agence de podcast et de création audio",
    description: "Agence de podcasts d'entreprise en mode sombre : aubergine profonde, rose vif, condensée Anton et épisodes présentés en lignes comme une playlist.",
    brand: "Ondes Claires",
    tokens: { colors: { primary: "#ff4d8d", secondary: "#231b2d", accent: "#7dd3fc", background: "#14101a", surface: "#1e1826", text: "#f6eff9", muted: "#b9aec4" }, fonts: { heading: "font.anton", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: { sm: 6, md: 12, lg: 20, button: 999, field: 10, card: 16 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.02, letterSpacing: 0, transform: "uppercase" } }, border: { width: 1, color: "#352b43" } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "pill" }, art: { seed: "ondesclaires", motifs: ["waves", "bokeh", "rays"] },
    head: ["head:minimal", {}], foot: ["foot:newsletter", { title: "Un épisode par semaine", sub: "Les coulisses de nos podcasts et un conseil de prise de son.", button: "S'inscrire" }],
    menu: [["Accueil", "/"], ["Épisodes", "/episodes"], ["Offres", "/offres"], ["Studio", "/studio"], ["Contact", "/contact"]], cta: ["Lancer un podcast", "/contact"],
    contact: pc("27 rue Saint-Rome, 31000 Toulouse", "05 61 00 70 36", "ecoute@ondesclaires.example", "Du lundi au vendredi, 9 h – 18 h", "Faites-vous entendre."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Agence de podcast · Toulouse", title: "Votre voix mérite un vrai micro.", sub: "Nous concevons, enregistrons, montons et diffusons les podcasts de marque, de collectivités et de médias.", cta: ["Écouter nos épisodes", "/episodes"], cta2: ["Lancer un podcast", "/contact"], stats: [["120", "podcasts produits (exemple)"], ["3,2 M", "écoutes cumulées (exemple)"], ["6", "studios"]] }],
        ["feat:strips", { title: "De l'idée à l'oreille", items: [{ t: "Concept éditorial", x: "Format, ton, animateur, rythme de parution." }, { t: "Enregistrement", x: "Studio ou valise audio sur site." }, { t: "Montage et mixage", x: "Habillage sonore et mastering." }, { t: "Diffusion et mesure", x: "Hébergement et statistiques." }] }],
        ["gal:coursecards", { title: "Séries en démonstration", items: [{ t: "Dans les coulisses", tag: "Podcast RH", price: "12 épisodes", x: "Récits de métiers filmés au micro." }, { t: "La Terre en commun", tag: "Collectivité", price: "8 épisodes", x: "Témoignages d'habitants.", cta: "Écouter", url: "/episodes" }, { t: "Cinq minutes de santé", tag: "Santé", price: "30 épisodes", x: "Conseils d'une infirmière." }] }],
        ["proof:big", { items: [{ q: "On a gagné une communauté qui nous attend le jeudi matin.", n: "Elsa M.", r: "directrice de la communication, cliente fictive" }] }],
        ["feat:checks", { title: "Tout est inclus", cta: ["Voir les offres", "/offres"], items: [{ t: "Prise de son professionnelle" }, { t: "Habillage sonore original" }, { t: "Transcription et sous-titres" }, { t: "Diffusion sur toutes les plateformes" }] }],
        ["cta:card", { title: "Un micro, une idée ?", sub: "Nous vous aidons à trouver le format qui vous ressemble.", cta: ["Parlons-en", "/contact"] }],
      ] },
      { key: "episodes", name: "Épisodes", blocks: [
        ph("Épisodes", "Un aperçu de ce que nous produisons."),
        ["feat:rows", { title: "À écouter", items: [{ t: "Dans les coulisses #1", x: "Le métier d'ambulancier, 22 minutes." }, { t: "La Terre en commun #3", x: "Un potager partagé, 18 minutes." }, { t: "Cinq minutes de santé #14", x: "Bien dormir, 5 minutes." }, { t: "Dans les coulisses #4", x: "Une journée à l'atelier, 25 minutes." }] }],
        ["misc:posts", { title: "Le blog du studio", count: 3, layout: "grid" }],
        ["cta:band", { title: "Votre épisode pilote offert.", sub: "Pour une première commande de saison.", cta: ["Demander le pilote", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ph("Offres", "Trois niveaux d'accompagnement d'exemple."),
        ["price:tiers", { items: [{ t: "Pilote", price: "1 400 €", period: "HT", x: "Un épisode complet.", f: ["Concept", "Enregistrement", "Montage"], cta: "Choisir", url: "/contact" }, { t: "Saison", price: "7 900 €", period: "HT", x: "Dix épisodes.", f: ["Jingle original", "Coaching animateur", "Diffusion"], hl: true, cta: "Choisir", url: "/contact" }, { t: "Studio dédié", price: "Sur devis", x: "Production continue.", f: ["Équipe attitrée", "Stratégie d'audience"], cta: "Discuter", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Combien dure un épisode ?", x: "En général de 15 à 35 minutes." }, { t: "Faut-il savoir parler ?", x: "Nous coachons les voix et préparons les questions." }] }],
        ["cta:split", { title: "Un devis en deux jours.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "studio", name: "Studio", blocks: [
        ph("Studio", "Six cabines, une régie, beaucoup de mousse acoustique."),
        ["misc:story", { eyebrow: "Notre lieu", title: "Un studio dans une ancienne imprimerie", paras: ["Nos cabines sont traitées acoustiquement et équipées de micros de studio.", "Nous accueillons aussi des invités à distance grâce à une régie vidéo."] }],
        ["misc:hours", { title: "Ouverture du studio", rows: [["Lundi – jeudi", "9 h – 19 h"], ["Vendredi", "9 h – 17 h"], ["Samedi", "Sur rendez-vous"]] }],
        ["feat:list2", { title: "Équipements", items: [{ t: "Quatre micros dynamiques" }, { t: "Régie de mixage" }, { t: "Visio haute qualité" }, { t: "Valise de reportage" }] }],
      ] },
    ],
  },
  // 11. Affichage / OOH
  {
    key: "panneau-phare", name: "Panneau Phare", category: "agence", tags: ["audacieux", "geometrique"], siteType: "Agence d'affichage et de médias extérieurs",
    description: "Régie d'affichage urbain au graphisme signalétique : noir profond, jaune fluo, condensée Bebas Neue en capitales et carte d'emplacements en listes.",
    brand: "Panneau Phare",
    tokens: { colors: { primary: "#141414", secondary: "#141414", accent: "#ffd60a", background: "#f4f1e8", surface: "#fffdf6", text: "#141414", muted: "#55524a" }, fonts: { heading: "font.bebas-neue", body: "font.barlow", button: "font.barlow", link: "font.barlow" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 76, weight: 400, lineHeight: 0.95, letterSpacing: 0.01, transform: "uppercase" } }, border: { width: 2, color: "#141414" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "panneauphare", motifs: ["halftone", "skyline", "tiles"] },
    head: ["head:topbar", { info: "Affichage 4x3, mobilier urbain, digital OOH", note: "Réseaux disponibles en Île-de-France" }], foot: ["foot:big", { title: "Panneau Phare" }],
    menu: [["Accueil", "/"], ["Réseaux", "/reseaux"], ["Formats", "/formats"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver un emplacement", "/contact"],
    contact: pc("90 avenue de Flandre, 75019 Paris", "01 42 00 53 90", "regie@panneauphare.example", "Du lundi au vendredi, 8 h 30 – 18 h", "Vu par tous, tous les jours."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Régie d'affichage extérieur", title: "Votre marque, au coin de la rue.", sub: "Panneaux 4 x 3, mobilier urbain, écrans digitaux : trouvez les emplacements qui touchent votre cible.", placeholder: "Ville ou code postal", cta: ["Voir les réseaux", "/reseaux"], image: "hero" }],
        ["proof:statsbar", { items: [["2 400", "faces d'affichage (exemple)"], ["38", "villes couvertes"], ["12 M", "contacts par semaine (exemple)"]] }],
        ["feat:numbered", { title: "Trois formats incontournables", items: [{ t: "4 x 3", x: "Le grand format des entrées de ville." }, { t: "Mobilier urbain", x: "Abris de bus, colonnes, vitrines." }, { t: "Digital", x: "Écrans animés et contenus programmés." }] }],
        ["gal:listings", { title: "Emplacements du moment", items: [{ t: "Porte de Bagnolet", tag: "4 x 3", price: "À partir de 1 900 € / semaine", x: "Axe très passant, 85 000 véhicules par jour." }, { t: "Gare du Nord", tag: "Digital", price: "À partir de 3 200 € / semaine", x: "Écran de 8 m², boucle de 10 secondes." }, { t: "Centre-ville de Nantes", tag: "Mobilier", price: "À partir de 880 € / semaine", x: "Abris de bus du cours des 50 Otages." }] }],
        ["feat:steps", { title: "Réserver en quatre étapes", items: [{ t: "Brief", x: "Zone, dates, budget." }, { t: "Proposition", x: "Sélection d'emplacements et visuels." }, { t: "Pose", x: "Affichage par nos équipes." }, { t: "Preuve", x: "Photos de contrôle." }] }],
        ["cta:image", { title: "Une campagne dans la ville.", sub: "Plan média chiffré sous 48 h.", cta: ["Demander un plan média", "/contact"] }],
      ] },
      { key: "reseaux", name: "Réseaux", blocks: [
        ph("Réseaux", "Nos faces, par type de zone."),
        ["gal:listings", { items: [{ t: "Périphérique est", tag: "4 x 3", price: "1 600 € / semaine", x: "Trafic de pointe élevé." }, { t: "Centre commercial Aurore", tag: "Digital", price: "1 200 € / semaine", x: "Écran d'entrée de galerie." }, { t: "Tram T2", tag: "Mobilier", price: "950 € / semaine", x: "Arrêts de tram du centre." }] }],
        ["feat:tabs", { title: "Par audience", items: [{ t: "Actifs", x: "Axes routiers et gares." }, { t: "Étudiants", x: "Abords de campus et transports." }, { t: "Familles", x: "Centres commerciaux et parcs." }, { t: "Touristes", x: "Gares, aéroports et sites." }] }],
        ["cta:band", { title: "Besoin d'une zone sur mesure ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "formats", name: "Formats", blocks: [
        ph("Formats"),
        ["feat:compare", { title: "Quel format choisir ?", rows: [["", "4 x 3", "Mobilier urbain", "Digital"], ["Portée", "large", "locale", "ciblée"], ["Durée", "7 jours", "7 jours", "à la seconde"], ["Création", "fixe", "fixe", "animée"]] }],
        ["feat:alt", { title: "À savoir avant de créer", items: [{ t: "Lisible à 50 mètres", x: "Sept mots maximum, contraste fort, logo bien visible.", link: ["Parler à un conseiller", "/contact"] }, { t: "Fichiers prêts à imprimer", x: "Nous fournissons les gabarits pour chaque format." }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Quel délai de réservation ?", x: "Comptez trois semaines pour du 4 x 3, deux jours pour du digital." }, { t: "Qui pose les affiches ?", x: "Nos équipes, avec preuve photographique." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Prix de campagne d'exemple, hors création."),
        ["feat:pricelist", { title: "Par semaine et par face", items: [{ t: "4 x 3 ville moyenne", x: "Réseau de 20 faces", price: "À partir de 18 000 €" }, { t: "Mobilier urbain", x: "Réseau de 50 abris", price: "À partir de 24 000 €" }, { t: "Digital", x: "Boucle de 10 s sur 30 écrans", price: "À partir de 9 500 €" }] }],
        ["proof:quotes", { items: [{ q: "Trois semaines d'affichage, une file d'attente devant le magasin.", n: "Kévin B.", r: "gérant, client fictif" }] }],
        ["cta:card", { title: "Un plan média gratuit.", cta: ["Demander le plan", "/contact"] }],
      ] },
    ],
  },
];

// Page contact commune à chaque thème : variante, titres et horaires propres au métier.
const contactPages = {
  "affiche-vive": ["contact:info", "Parlons de votre brief", "Racontez-nous votre marque", "Cible, budget, échéance : trois lignes suffisent."],
  "clap-et-cie": ["contact:map", "Parler à la production", "", ""],
  "relais-presse": ["contact:cards", "Briefer l'agence", "Votre actualité en quelques lignes", "Nous répondons sous 24 h ouvrées."],
  "grille-ux": ["contact:info", "Planifier un atelier", "Décrivez votre produit", "Où en êtes-vous : idée, prototype ou produit en ligne ?"],
  "mouvance-lab": ["contact:cards", "Envoyer le brief", "Votre message à animer", "Collez votre texte, nous préparons un storyboard."],
  "nomade-nom": ["contact:map", "Trouver votre nom", "", ""],
  "craie-et-encre": ["contact:info", "Commander une illustration", "Quelle histoire à dessiner ?", "Format, usage, délai souhaité."],
  "fete-numerique": ["contact:cards", "Organiser un événement", "Votre événement en trois lignes", "Date, audience prévue, lieu éventuel."],
  "boite-kraft": ["contact:info", "Demander un échantillon", "Parlez-nous de votre produit", "Dimensions, quantité, matière souhaitée."],
  "ondes-claires": ["contact:map", "Lancer un podcast", "", ""],
  "panneau-phare": ["contact:cards", "Réserver un emplacement", "Votre campagne d'affichage", "Villes, dates et budget approximatif."],
};
module.exports = themes.map((t) => {
  const [v, title, formTitle, formIntro] = contactPages[t.key];
  const params = v === "contact:map" ? { title, mapAddress: t.contact.address } : { title, formTitle, formIntro, cta: ["Envoyer", "/contact"] };
  t.pages.push({ key: "contact", name: "Contact", blocks: [ph("Contact", t.contact.tagline), [v, params], ["misc:hours", { title: "Horaires", rows: [["Du lundi au vendredi", t.contact.hours.replace(/^Du lundi au \w+, /, "")], ["Week-end", "Sur rendez-vous"]] }]] });
  return t;
});
