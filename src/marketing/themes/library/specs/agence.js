// Agences créatives, marketing et communication (10 thèmes). Textes de DÉMONSTRATION : agences, personnes et coordonnées fictives.
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const pcontact = (address, phone, email, hours, tagline) => ({ address, phone, email, hours, tagline });

module.exports = [
  // 1. Branding
  {
    key: "atelier-brume", name: "Atelier Brume", category: "agence", tags: ["editorial", "minimaliste"], siteType: "Agence de branding", featured: true,
    description: "Agence de branding au ton éditorial : grands titres serif, beaucoup d'air, études de cas en mosaïque et palette de terre douce.",
    brand: "Atelier Brume",
    tokens: { colors: { primary: "#8a3b2a", secondary: "#2b211d", accent: "#d9a441", background: "#f7f2ea", surface: "#fffdf8", text: "#241c18", muted: "#65584f" }, fonts: { heading: "font.source-serif-4", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 600, lineHeight: 1.04, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "brume", motifs: ["plates", "arches", "halftone"] },
    head: ["head:minimal", {}], foot: ["foot:big", { title: "Atelier Brume" }],
    menu: [["Accueil", "/"], ["Études de cas", "/etudes-de-cas"], ["Savoir-faire", "/savoir-faire"], ["L'atelier", "/atelier"], ["Contact", "/contact"]], cta: ["Parler de votre marque", "/contact"],
    contact: pcontact("8 quai des Chartrons, 33000 Bordeaux", "05 56 00 12 34", "bonjour@atelier-brume.example", "Du lundi au jeudi, 9 h 30 – 18 h", "Identités de marque pensées pour durer."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Agence de branding · Bordeaux", title: "Des marques qui laissent une trace.", sub: "Nom, identité visuelle, ton de voix : nous construisons des marques cohérentes pour les entreprises qui veulent durer.", cta: ["Voir les études de cas", "/etudes-de-cas"], image: "hero" }],
        ["gal:masonry", { eyebrow: "Sélection", title: "Projets récents", items: [{ t: "Cave Lestrade", x: "Identité complète d'un domaine viticole" }, { t: "Maison Orsay", x: "Refonte de marque et packaging" }, { t: "Tandem", x: "Logotype et système graphique" }, { t: "Bureau Nord", x: "Signalétique et papeterie" }, { t: "Fleur de Sel", x: "Naming et charte" }] }],
        ["feat:rows", { eyebrow: "Savoir-faire", title: "Une méthode en quatre temps", bg: "token:surface", items: [{ t: "Écouter", x: "Ateliers de cadrage avec la direction et les équipes." }, { t: "Définir", x: "Plateforme de marque : promesse, valeurs, ton." }, { t: "Dessiner", x: "Logotype, couleurs, typographies, déclinaisons." }, { t: "Transmettre", x: "Guide de marque et formation de vos équipes." }] }],
        ["proof:big", { items: [{ q: "Ils ont compris notre histoire avant que nous sachions la raconter.", n: "Hélène R.", r: "dirigeante, cliente fictive" }] }],
        ["proof:stats", { items: [["14 ans", "d'atelier"], ["120", "marques accompagnées (exemple)"], ["9", "designers et rédacteurs"]] }],
        ["cta:split", { title: "Une marque à créer ?", sub: "Racontez-nous votre projet, nous revenons vers vous sous 48 h.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "etudes-de-cas", name: "Études de cas", blocks: [
        ph("Études de cas", "Quelques marques que nous avons eu le plaisir de construire."),
        ["gal:featured", { items: [{ t: "Cave Lestrade", x: "Du nom à l'étiquette" }, { t: "Maison Orsay", x: "Packaging" }, { t: "Tandem", x: "Identité" }, { t: "Bureau Nord", x: "Signalétique" }] }],
        ["feat:alt", { title: "Zoom sur deux projets", items: [{ t: "Cave Lestrade, un domaine qui se réinvente", x: "Nouveau nom, étiquettes en typographie ancienne et site vitrine : +30 % de visites en cave sur la première saison (exemple).", link: ["Nous contacter", "/contact"] }, { t: "Tandem, une coopérative qui se rend visible", x: "Logotype modulaire, couleurs vives et ton direct pour une coopérative de mobilité douce." }] }],
        ["cta:band", { title: "Votre marque sera la prochaine.", cta: ["Démarrer un projet", "/contact"] }],
      ] },
      { key: "savoir-faire", name: "Savoir-faire", blocks: [
        ph("Savoir-faire"),
        ["feat:bento", { title: "Ce que nous fabriquons", items: [{ t: "Identité visuelle", x: "Logotype, couleurs, typographies, iconographie et déclinaisons." }, { t: "Stratégie de marque", x: "Positionnement, promesse, plateforme." }, { t: "Naming et rédaction", x: "Noms, signatures, manifestes." }] }],
        ["feat:pricelist", { title: "Formules indicatives", intro: "Tarifs d'exemple, devis personnalisé sur demande.", items: [{ t: "Identité essentielle", x: "Logotype, palette, typographies", price: "À partir de 4 800 €" }, { t: "Marque complète", x: "Stratégie, identité, guide de marque", price: "À partir de 11 500 €" }, { t: "Refonte & packaging", x: "Audit, nouvelle identité, gamme de produits", price: "Sur devis" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Combien de temps dure un projet ?", x: "Entre six et seize semaines selon l'ampleur." }, { t: "Reste-t-on propriétaire des créations ?", x: "Oui, la cession des droits est prévue au contrat." }, { t: "Travaillez-vous à distance ?", x: "Oui, avec des ateliers en visioconférence ou dans vos locaux." }] }],
      ] },
      { key: "atelier", name: "L'atelier", blocks: [
        ph("L'atelier", "Une petite équipe, de grandes exigences."),
        ["misc:story", { eyebrow: "Depuis 2011", title: "Fait main, pensé pour durer", paras: ["Atelier Brume est né dans un grenier des Chartrons, autour d'une table et d'une imprimante.", "Nous refusons les modes : une bonne identité se reconnaît encore dix ans plus tard."], image: "portrait-1" }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Camille Vasseur", r: "Directrice de création" }, { n: "Jules Armand", r: "Designer graphique" }, { n: "Noor Benali", r: "Stratège de marque" }, { n: "Lou Perrin", r: "Rédactrice" }] }],
        ["feat:checks", { title: "Nos principes", cta: ["Nous rencontrer", "/contact"], items: [{ t: "Peu de clients, bien suivis" }, { t: "Des livrables prêts à l'emploi" }, { t: "Un guide de marque lisible" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Parlons de votre marque."),
        ["contact:info", { title: "Écrivez-nous", formTitle: "Racontez-nous votre projet", formIntro: "Quelques lignes suffisent.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "8 quai des Chartrons, 33000 Bordeaux" }],
      ] },
    ],
  },

  // 2. Social media
  {
    key: "pulse-social", name: "Pulse Social", category: "agence", tags: ["ludique", "audacieux"], siteType: "Agence de social media",
    description: "Agence social media pleine d'énergie : formes arrondies, couleurs vives, collage d'images et cartes de résultats.",
    brand: "Pulse Social",
    tokens: { colors: { primary: "#e0245e", secondary: "#2a1b5c", accent: "#ffc83d", background: "#fff8fb", surface: "#ffffff", text: "#241438", muted: "#5d4d73" }, fonts: { heading: "font.nunito", body: "font.poppins", button: "font.nunito", link: "font.poppins" }, radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 900, lineHeight: 1.05, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "pulse", motifs: ["blobs", "bokeh", "rays"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "La newsletter Pulse", sub: "Une tendance et trois idées de contenus, chaque jeudi.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Offres", "/offres"], ["Cas clients", "/cas-clients"], ["L'équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Booster ma com'", "/contact"],
    contact: pcontact("27 rue de la République, 69002 Lyon", "04 72 00 45 67", "hello@pulse-social.example", "Du lundi au vendredi, 9 h – 19 h", "On fait parler votre marque."),
    social: ["instagram", "linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Agence social media", title: "Votre marque mérite d'être suivie.", sub: "Stratégie, création de contenus, community management et publicité sociale pour les marques qui veulent une vraie communauté.", cta: ["Voir nos offres", "/offres"], cta2: ["Cas clients", "/cas-clients"] }],
        ["misc:marquee", { items: ["Instagram", "TikTok", "LinkedIn", "YouTube", "Pinterest", "Newsletter"] }],
        ["feat:icons", { eyebrow: "Ce qu'on fait", title: "Du premier post à la communauté fidèle", items: [{ icon: "sparkles", t: "Stratégie éditoriale", x: "Lignes éditoriales, calendrier, formats qui performent." }, { icon: "video", t: "Création de contenus", x: "Reels, carrousels, visuels et tournages courts." }, { icon: "users", t: "Community management", x: "Réponses, modération, veille et relation créateurs." }, { icon: "trendingUp", t: "Social ads", x: "Campagnes payantes ciblées et suivi des résultats." }] }],
        ["proof:statsbar", { items: [["+212 %", "d'engagement moyen (exemple)"], ["38", "marques suivies"], ["1,4 M", "vues mensuelles cumulées"]] }],
        ["gal:cards", { eyebrow: "Réalisations", title: "Des campagnes qui ont fait du bruit", items: [{ t: "Café Bulle", tag: "Instagram", x: "Série de reels coulisses" }, { t: "Rolland Vélos", tag: "TikTok", x: "Défi de la communauté" }, { t: "Maison Féline", tag: "LinkedIn", x: "Marque employeur" }] }],
        ["proof:quotes", { title: "Ils nous suivent", items: [{ q: "Notre communauté a triplé en six mois.", n: "Anaïs P.", r: "Fondatrice, cliente fictive" }, { q: "Enfin des contenus qui nous ressemblent.", n: "Sofiane K.", r: "Gérant, client fictif" }, { q: "Un rythme tenu et des chiffres clairs.", n: "Léa M.", r: "Responsable marketing, cliente fictive" }] }],
        ["cta:card", { title: "Prêt à faire du bruit ?", sub: "Audit gratuit de vos réseaux en 20 minutes.", cta: ["Réserver mon audit", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ph("Nos offres", "Trois niveaux d'accompagnement, sans engagement de durée au-delà de trois mois."),
        ["price:tiers", { items: [{ t: "Lancement", price: "690 €", period: "/mois", f: ["2 réseaux", "8 publications", "Rapport mensuel"], cta: "Choisir", url: "/contact" }, { t: "Croissance", price: "1 450 €", period: "/mois", hl: true, f: ["3 réseaux", "16 publications + reels", "Community management", "Budget ads géré"], cta: "Choisir", url: "/contact" }, { t: "Influence", price: "Sur devis", f: ["Stratégie multi-réseaux", "Partenariats créateurs", "Tournages mensuels"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:compare", { title: "Comparer les offres", rows: [["", "Lancement", "Croissance", "Influence"], ["Reels", "non", "oui", "oui"], ["Community management", "non", "oui", "oui"], ["Créateurs partenaires", "non", "non", "oui"]] }],
        ["feat:accordion", { title: "Bon à savoir", items: [{ t: "Qui crée les visuels ?", x: "Notre studio, avec validation de votre part avant chaque publication." }, { t: "Puis-je arrêter à tout moment ?", x: "Oui, après la période initiale de trois mois." }, { t: "Les budgets publicitaires sont-ils inclus ?", x: "Non, ils sont facturés au réel, sans marge." }] }],
      ] },
      { key: "cas-clients", name: "Cas clients", blocks: [
        ph("Cas clients"),
        ["gal:grid", { items: [{ t: "Café Bulle", x: "+48 000 abonnés en 8 mois (exemple)" }, { t: "Rolland Vélos", x: "Défi communautaire" }, { t: "Maison Féline", x: "Marque employeur" }, { t: "Yoga Matin", x: "Lancement d'appli" }, { t: "Chocolat Nord", x: "Collection de saison" }, { t: "Brasserie Trois Ponts", x: "Soirées thématiques" }] }],
        ["proof:stats", { title: "Résultats d'exemple", items: [["×3", "communauté en 6 mois"], ["4,8 %", "taux d'engagement"], ["-27 %", "coût par clic"]] }],
        ["cta:band", { title: "Votre cas client commence ici.", cta: ["Parlons-en", "/contact"] }],
      ] },
      { key: "equipe", name: "L'équipe", blocks: [
        ph("L'équipe", "Des créatifs, des analystes, des fans de réseaux."),
        ["proof:team", { items: [{ n: "Inès Garnier", r: "Directrice de la stratégie" }, { n: "Tom Lefèvre", r: "Vidéaste" }, { n: "Yasmine Bouzid", r: "Community manager" }, { n: "Hugo Pasquier", r: "Social ads" }] }],
        ["feat:grid-icons", { title: "Notre état d'esprit", items: [{ icon: "heart", t: "Authenticité", x: "Pas de recettes toutes faites." }, { icon: "zap", t: "Réactivité", x: "Réponse en moins de 24 h." }, { icon: "barChart", t: "Transparence", x: "Chiffres partagés chaque mois." }] }],
        ["misc:text", { title: "Rejoindre l'aventure", paras: ["Nous recrutons régulièrement des vidéastes et des community managers. Écrivez-nous avec quelques liens vers vos réalisations."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Dites-nous tout, on s'occupe du reste."),
        ["contact:cards", { title: "Nous joindre", formTitle: "Un projet ? Une question ?" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "9 h – 19 h"], ["Samedi", "Sur rendez-vous"]] }],
      ] },
    ],
  },

  // 3. Relations presse
  {
    key: "plume-presse", name: "Plume & Presse", category: "agence", tags: ["classique", "editorial"], siteType: "Agence de relations presse",
    description: "Agence de relations presse au style journal : en-tête de rédaction, serif robuste, revue de presse et communiqués à la une.",
    brand: "Plume & Presse",
    tokens: { colors: { primary: "#1d3b53", secondary: "#14202b", accent: "#b8322a", background: "#f5f4f0", surface: "#ffffff", text: "#1a2229", muted: "#56626d" }, fonts: { heading: "font.merriweather", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" }, radius: { sm: 0, md: 2, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#cfd3d6" }, type: { h1: { size: 50, weight: 900, lineHeight: 1.12, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "plume", motifs: ["halftone", "tiles", "skyline"] },
    head: ["head:masthead", { dateline: "Relations presse & influence — Paris" }], foot: ["foot:columns", { about: "Relations presse, relations publiques et gestion de crise pour entreprises et institutions.", cols: [["L'agence", "Expertises", "Équipe", "Contact"], ["Presse", "Revue de presse", "Communiqués"]] }],
    menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["Revue de presse", "/revue-de-presse"], ["L'agence", "/agence"], ["Contact", "/contact"]], cta: ["Nous consulter", "/contact"],
    contact: pcontact("41 rue de Turbigo, 75003 Paris", "01 42 00 98 76", "redaction@plume-presse.example", "Du lundi au vendredi, 8 h 30 – 19 h", "L'information juste, au bon moment."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Relations presse", title: "Faire entendre ce qui compte.", sub: "Nous portons vos annonces, vos résultats et vos prises de parole auprès des journalistes qui comptent, avec méthode et discrétion.", cta: ["Découvrir nos expertises", "/expertises"] }],
        ["proof:logos", { title: "Médias avec lesquels nous travaillons (noms fictifs)", items: ["Le Courrier du Nord", "Revue Éco", "Radio Cité", "Actu Média", "Le Quotidien"] }],
        ["feat:strips", { eyebrow: "Expertises", title: "Quatre métiers de la parole publique", items: [{ t: "Relations presse", x: "Dossiers, communiqués, rendez-vous journalistes." }, { t: "Gestion de crise", x: "Cellule de veille, éléments de langage, porte-parole." }, { t: "Affaires publiques", x: "Veille institutionnelle et préparation d'auditions." }, { t: "Prises de parole", x: "Tribunes, interviews et media training." }] }],
        ["misc:quote", { text: "Une information claire est une information qui se retrouve dans la presse.", by: "Principe de l'agence" }],
        ["proof:statsbar", { items: [["320", "retombées par an (exemple)"], ["22", "ans de métier"], ["48 h", "délai moyen de réaction"]] }],
        ["gal:cards", { title: "Derniers communiqués (exemples)", items: [{ t: "Aval lance sa saison 2", tag: "Communiqué", x: "Diffusé à 240 rédactions" }, { t: "Atlas ouvre un fonds régional", tag: "Dossier de presse", x: "Quinze retombées en une semaine" }, { t: "Le Beffroi fête ses 50 ans", tag: "Événement", x: "Invitation presse et reportage radio" }] }],
        ["cta:band", { title: "Une annonce à préparer ?", sub: "Nous vous répondons dans la journée.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "expertises", name: "Expertises", blocks: [
        ph("Expertises", "Des interlocuteurs identifiés, un calendrier tenu."),
        ["feat:rows", { items: [{ t: "Plans de relations presse", x: "Cibles, angles, calendrier et indicateurs de retombées." }, { t: "Dossiers et communiqués", x: "Rédaction, relecture et envoi ciblé." }, { t: "Media training", x: "Entraînement à l'interview télé, radio et presse écrite." }, { t: "Gestion de crise", x: "Astreinte, veille et plan de communication de crise." }] }],
        ["feat:steps", { title: "Une campagne type", items: [{ t: "Brief", x: "Objectifs et messages clés.", d: "Semaine 1" }, { t: "Angles", x: "Sujets et supports.", d: "Semaine 2" }, { t: "Diffusion", x: "Envoi et relances.", d: "Semaines 3 à 5" }, { t: "Bilan", x: "Revue de presse commentée.", d: "Semaine 6" }] }],
        ["feat:list2", { title: "Inclus dans chaque mission", items: [{ t: "Fichier presse mis à jour" }, { t: "Suivi hebdomadaire" }, { t: "Revue de presse" }, { t: "Interlocuteur unique" }] }],
      ] },
      { key: "revue-de-presse", name: "Revue de presse", blocks: [
        ph("Revue de presse", "Quelques parutions obtenues pour nos clients (exemples)."),
        ["gal:cards", { items: [{ t: "« Un nouveau souffle pour la coopérative Aval »", tag: "Presse régionale", x: "Page entière, édition du week-end" }, { t: "« La start-up qui répare les objets du quotidien »", tag: "Presse économique", x: "Portrait de fondateur" }, { t: "« Mobilité douce : le pari d'une ville moyenne »", tag: "Radio", x: "Invitée de la matinale" }] }],
        ["misc:article", { tag: "Étude de cas", title: "Comment une PME est passée dans le journal de 20 heures", meta: "Cas d'exemple · lecture 4 min", paras: ["Un dossier simple, un chiffre fort, un témoin disponible : trois conditions que nous réunissons avant chaque envoi.", "Résultat : cinq retombées nationales en trois semaines, sans achat d'espace."], quote: "Nous avons gagné en trois semaines ce que nous espérions en un an.", by: "Dirigeant, client fictif" }],
        ["proof:stats", { items: [["70 %", "taux d'ouverture des envois (exemple)"], ["15", "journalistes rencontrés par mois"], ["3,2", "retombées moyennes par communiqué"]] }],
      ] },
      { key: "agence", name: "L'agence", blocks: [
        ph("L'agence"),
        ["misc:story", { eyebrow: "Depuis 2003", title: "Une rédaction au service des organisations", paras: ["Fondée par d'anciens journalistes, l'agence connaît les contraintes des rédactions et sait ce qui mérite d'être publié.", "Nous préférons dix retombées utiles à cent mentions anonymes."], image: "portrait-1" }],
        ["proof:team", { items: [{ n: "Agnès Delmas", r: "Directrice associée" }, { n: "Karim Oulad", r: "Responsable crises" }, { n: "Élodie Fabre", r: "Attachée de presse senior" }, { n: "Victor Maillard", r: "Rédacteur" }] }],
        ["feat:numbered", { title: "Nos règles", items: [{ t: "Vérité", x: "Aucune information non vérifiée." }, { t: "Discrétion", x: "Vos dossiers restent confidentiels." }, { t: "Respect", x: "Des relations durables avec les rédactions." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Une urgence ? Appelez directement."),
        ["contact:map", { title: "Nous trouver", mapAddress: "41 rue de Turbigo, 75003 Paris" }],
        ["contact:info", { title: "Écrire à la rédaction", formTitle: "Votre message", formIntro: "Précisez votre sujet et votre échéance.", cta: ["Envoyer", "/contact"] }],
        ["misc:faq", { title: "Avant de nous écrire", items: [{ t: "Travaillez-vous avec les TPE ?", x: "Oui, à partir d'une mission ponctuelle de quatre semaines." }, { t: "Garantissez-vous des retombées ?", x: "Non : nous nous engageons sur la méthode, pas sur le résultat." }] }],
      ] },
    ],
  },

  // 4. Studio vidéo (sombre)
  {
    key: "clap-nocturne", name: "Clap Nocturne", category: "agence", tags: ["sombre", "audacieux"], siteType: "Studio de production vidéo",
    description: "Studio vidéo en thème sombre : image plein cadre, titres techniques, grille de films et bandes de chiffres.",
    brand: "Clap Nocturne",
    tokens: { colors: { primary: "#ff5a36", secondary: "#0d0f14", accent: "#34d5c8", background: "#12151c", surface: "#1b1f29", text: "#f3f4f7", muted: "#aab0bd" }, fonts: { heading: "font.exo-2", body: "font.manrope", button: "font.exo-2", link: "font.manrope" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.02, letterSpacing: -0.015, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "clap", motifs: ["rays", "bokeh", "mesh"] },
    head: ["head:dark", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Films", "/films"], ["Production", "/production"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: pcontact("5 quai de la Fosse, 44000 Nantes", "02 40 00 11 22", "prod@clap-nocturne.example", "Du lundi au vendredi, 10 h – 19 h", "Films de marque, clips et documentaires."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Studio de production", title: "Des films qui se regardent jusqu'au bout.", sub: "Films de marque, clips, documentaires d'entreprise et formats courts : de l'écriture à l'étalonnage, tout se fait chez nous.", cta: ["Voir les films", "/films"], cta2: ["Demander un devis", "/contact"], image: "hero" }],
        ["proof:statsbar", { items: [["240", "films livrés (exemple)"], ["12", "prix en festivals"], ["4K", "tournage et post-production"]] }],
        ["gal:carousel", { eyebrow: "Showreel", title: "Dernières sorties", items: [{ t: "Marée haute", x: "Documentaire · 26 min" }, { t: "Atelier Rivage", x: "Film de marque · 90 s" }, { t: "Nuit blanche", x: "Clip · 3 min 40" }, { t: "Cap Nord", x: "Spot · 30 s" }] }],
        ["feat:strips", { title: "De l'idée à l'écran", items: [{ t: "Écriture", x: "Note d'intention, scénario et storyboard." }, { t: "Tournage", x: "Équipe légère, matériel cinéma, lumière maîtrisée." }, { t: "Montage", x: "Rythme, sound design, étalonnage." }, { t: "Diffusion", x: "Formats web, réseaux, salles et événements." }] }],
        ["proof:quotes", { items: [{ q: "Un film qui a enfin fait parler de notre métier.", n: "Mathieu S.", r: "Dirigeant, client fictif" }, { q: "Une équipe discrète et exigeante sur le plateau.", n: "Laure C.", r: "Directrice de la communication, cliente fictive" }, { q: "Livré en avance, à la seconde près.", n: "Ibrahim T.", r: "Responsable marque, client fictif" }] }],
        ["cta:image", { title: "Un film en tête ?", sub: "Parlons de votre histoire et de votre calendrier.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "films", name: "Films", blocks: [
        ph("Films", "Une sélection de productions récentes."),
        ["gal:grid", { items: [{ t: "Marée haute", x: "Documentaire" }, { t: "Atelier Rivage", x: "Film de marque" }, { t: "Nuit blanche", x: "Clip" }, { t: "Cap Nord", x: "Spot" }, { t: "Les Mains du bois", x: "Portrait" }, { t: "Deux rives", x: "Institutionnel" }] }],
        ["misc:quote", { text: "Une image juste vaut mieux que mille effets.", by: "Notre directeur de la photographie" }],
        ["cta:band", { title: "Votre film sera le prochain.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "production", name: "Production", blocks: [
        ph("Production"),
        ["feat:steps", { title: "Le déroulé d'un projet", items: [{ t: "Brief", x: "Objectifs et diffusion.", d: "J-45" }, { t: "Préproduction", x: "Scénario, repérages, casting.", d: "J-30" }, { t: "Tournage", x: "Un à cinq jours selon le format.", d: "J0" }, { t: "Post-production", x: "Montage, son, étalonnage.", d: "J+20" }, { t: "Livraison", x: "Tous formats et sous-titres.", d: "J+28" }] }],
        ["feat:alt", { title: "Nos formats", items: [{ t: "Film de marque", x: "Une histoire de 60 à 120 secondes qui incarne votre promesse." }, { t: "Documentaire d'entreprise", x: "Portraits et témoignages sur 10 à 30 minutes." }, { t: "Clip et captation", x: "Concerts, spectacles, festivals." }] }],
        ["feat:list2", { title: "Matériel et savoir-faire", items: [{ t: "Caméras cinéma 4K" }, { t: "Drone certifié" }, { t: "Studio son" }, { t: "Étalonnage HDR" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Budgets indicatifs, hors musique sous licence."),
        ["feat:pricelist", { items: [{ t: "Film de marque 60 s", x: "1 jour de tournage, montage, étalonnage", price: "À partir de 6 500 €" }, { t: "Portrait vidéo 3 min", x: "1 jour, 1 interview", price: "À partir de 3 900 €" }, { t: "Clip musical", x: "Scénarisation et 2 jours de tournage", price: "À partir de 8 000 €" }, { t: "Pack réseaux (10 formats courts)", x: "Réduction de film existant", price: "1 200 €" }] }],
        ["misc:faq", { items: [{ t: "Qui détient les droits ?", x: "Vous, après règlement, hors musique et banques d'images." }, { t: "Combien de retours de montage ?", x: "Deux allers-retours sont inclus." }] }],
        ["cta:split", { title: "Besoin d'un chiffrage précis ?", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Votre projet", formTitle: "Décrivez-nous votre film", formIntro: "Durée, diffusion, date souhaitée.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "5 quai de la Fosse, 44000 Nantes" }],
      ] },
    ],
  },

  // 5. Design produit
  {
    key: "forme-fonction", name: "Forme & Fonction", category: "agence", tags: ["moderne", "minimaliste"], siteType: "Agence de design produit",
    description: "Agence de design produit lumineuse et précise : image portrait à gauche, onglets de méthode, tarifs d'ateliers et fonds alternés.",
    brand: "Forme & Fonction",
    tokens: { colors: { primary: "#0a6e6e", secondary: "#10302f", accent: "#f2994a", background: "#f4f8f7", surface: "#ffffff", text: "#13211f", muted: "#506360" }, fonts: { heading: "font.dm-sans", body: "font.ibm-plex-sans", button: "font.dm-sans", link: "font.ibm-plex-sans" }, radius: { sm: 6, md: 10, lg: 14, button: 8, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.08, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "forme", motifs: ["objects", "plates", "tiles"] },
    head: ["head:bar", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Projets", "/projets"], ["Méthode", "/methode"], ["Ateliers", "/ateliers"], ["Contact", "/contact"]], cta: ["Lancer un projet", "/contact"],
    contact: pcontact("19 rue des Frères Lumière, 67000 Strasbourg", "03 88 00 21 43", "projets@forme-fonction.example", "Du lundi au vendredi, 9 h – 18 h", "Du besoin à l'objet, sans détour."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Design produit", title: "Des objets utiles, beaux et fabricables.", sub: "Nous concevons avec vous des produits physiques et connectés : recherche utilisateur, design industriel, prototypes et dossier de fabrication.", cta: ["Voir les projets", "/projets"], image: "hero" }],
        ["feat:grid-icons", { title: "Du besoin au produit", items: [{ icon: "users", t: "Recherche", x: "Observer et interroger les futurs utilisateurs." }, { icon: "palette", t: "Design industriel", x: "Formes, matières, ergonomie." }, { icon: "settings", t: "Prototypage", x: "Maquettes, impression 3D, séries pilotes." }, { icon: "fileText", t: "Industrialisation", x: "Dossier technique et suivi de fabrication." }] }],
        ["gal:featured", { eyebrow: "Réalisations", title: "Produits que nous avons conçus", bg: "token:surface", items: [{ t: "Carafe Source", x: "Verre recyclé" }, { t: "Lampe Veille", x: "Éclairage nomade" }, { t: "Trottinette Lian", x: "Mobilité urbaine" }, { t: "Capteur Aéro", x: "Objet connecté" }] }],
        ["proof:stats", { items: [["65", "produits mis sur le marché (exemple)"], ["8", "pays de diffusion"], ["3", "designers certifiés"]] }],
        ["feat:bento", { title: "Pourquoi un studio dédié", items: [{ t: "Équipe intégrée", x: "Designer, ingénieur et chargé de projet travaillent ensemble dès le premier jour." }, { t: "Prototypes rapides", x: "Un premier objet en main en trois semaines." }, { t: "Fabrication suivie", x: "Nous restons à vos côtés jusqu'à la série." }] }],
        ["cta:band", { title: "Un produit à imaginer ?", sub: "Atelier de cadrage offert, deux heures.", cta: ["Réserver l'atelier", "/contact"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ph("Projets"),
        ["gal:cards", { items: [{ t: "Carafe Source", tag: "Maison", x: "Verre recyclé et bouchon en liège" }, { t: "Lampe Veille", tag: "Éclairage", x: "Autonomie de 40 heures" }, { t: "Capteur Aéro", tag: "Connecté", x: "Qualité de l'air intérieur" }, { t: "Trottinette Lian", tag: "Mobilité", x: "Pliage en 3 secondes" }] }],
        ["feat:alt", { title: "Étude de cas", items: [{ t: "Lampe Veille", x: "De la première maquette en carton à la série de 3 000 pièces : récit d'un projet mené en neuf mois.", link: ["Parler d'un projet", "/contact"] }] }],
        ["cta:split", { title: "Votre produit pourrait être ici.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ph("Notre méthode", "Quatre phases, un livrable à chaque étape."),
        ["feat:rows", { title: "Quatre phases", items: [{ t: "Explorer", x: "Entretiens, observation, benchmark et premières pistes." }, { t: "Concevoir", x: "Croquis, volumes, choix de matières et de procédés." }, { t: "Prototyper", x: "Prototypes fonctionnels et tests avec des utilisateurs." }, { t: "Industrialiser", x: "Plans, nomenclature, consultation de fabricants." }] }],
        ["feat:checks", { title: "Ce que vous recevez", cta: ["Demander un devis", "/contact"], items: [{ t: "Dossier de design complet" }, { t: "Prototype fonctionnel" }, { t: "Plans de fabrication" }, { t: "Dossier de normes" }] }],
        ["misc:faq", { items: [{ t: "Quel budget prévoir ?", x: "Un projet de design industriel commence autour de 18 000 € (exemple)." }, { t: "Fabriquez-vous aussi ?", x: "Nous pilotons des fabricants partenaires en Europe." }] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ph("Ateliers d'innovation", "Formats collectifs pour équipes produit."),
        ["feat:pricelist", { items: [{ t: "Atelier de cadrage", x: "2 heures, jusqu'à 8 personnes", price: "Offert" }, { t: "Sprint design 3 jours", x: "De la problématique au prototype", price: "9 600 €" }, { t: "Formation design thinking", x: "2 jours, jusqu'à 12 personnes", price: "3 800 €" }] }],
        ["misc:schedule", { title: "Journée type d'un sprint", items: [{ d: "9 h", t: "Cadrage", x: "Objectifs et contraintes." }, { d: "11 h", t: "Idéation", x: "Croquis rapides." }, { d: "14 h", t: "Prototype", x: "Maquettes à échelle 1." }, { d: "16 h 30", t: "Test", x: "Retours d'utilisateurs." }] }],
        ["cta:card", { title: "Un atelier sur mesure ?", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Lançons votre projet", formTitle: "Parlez-nous de votre produit", formIntro: "Usage, cible, calendrier.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "19 rue des Frères Lumière, 67000 Strasbourg" }],
      ] },
    ],
  },

  // 6. Motion design
  {
    key: "mouvement-vif", name: "Mouvement Vif", category: "agence", tags: ["audacieux", "geometrique"], siteType: "Studio de motion design",
    description: "Studio de motion design en affiche : titre géant en capitales sur aplat violet, accents jaune acide et rythme saccadé.",
    brand: "Mouvement Vif",
    tokens: { colors: { primary: "#5b21d6", secondary: "#160a33", accent: "#e5ff3d", background: "#fbfaff", surface: "#f0ecfb", text: "#1a1230", muted: "#59507a" }, fonts: { heading: "font.montserrat", body: "font.karla", button: "font.montserrat", link: "font.karla" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 900, lineHeight: 0.98, letterSpacing: -0.03, transform: "uppercase" }, h2: { size: 40, weight: 800, lineHeight: 1.05, letterSpacing: -0.02, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "vif", motifs: ["ribbons", "rays", "tiles"] },
    head: ["head:split", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Showreel", "/showreel"], ["Services", "/services"], ["Processus", "/processus"], ["Contact", "/contact"]], cta: ["Briefer le studio", "/contact"],
    contact: pcontact("3 passage Ménilmontant, 75020 Paris", "01 40 00 33 44", "brief@mouvement-vif.example", "Du lundi au vendredi, 10 h – 19 h", "On met vos idées en mouvement."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { title: "Faites bouger vos idées.", sub: "Animations 2D et 3D, génériques, explicatifs et interfaces animées pour les marques qui veulent captiver en dix secondes.", cta: ["Voir le showreel", "/showreel"], cta2: ["Briefer le studio", "/contact"] }],
        ["misc:marquee", { items: ["2D", "3D", "Explicatifs", "Génériques", "UI animée", "Lettrage animé"] }],
        ["gal:wall", { title: "Dernières animations", items: [{ t: "Orbite" }, { t: "Pixel Parade" }, { t: "Fil rouge" }, { t: "Grande marée" }] }],
        ["feat:numbered", { title: "Trois façons de travailler", items: [{ t: "Format court", x: "Boucles et teasers de 6 à 15 secondes pour les réseaux." }, { t: "Film explicatif", x: "60 à 120 secondes pour expliquer un produit complexe." }, { t: "Système animé", x: "Bibliothèque d'animations pour votre marque." }] }],
        ["proof:quotes", { items: [{ q: "Notre produit est enfin compris en une minute.", n: "Maëlle V.", r: "Directrice produit, cliente fictive" }, { q: "Un rythme et une précision rares.", n: "Étienne J.", r: "Directeur artistique, client fictif" }, { q: "Livraison impeccable, versions pour tous les formats.", n: "Zoé R.", r: "Responsable social media, cliente fictive" }] }],
        ["cta:band", { title: "Votre animation commence par un brief.", cta: ["Briefer le studio", "/contact"] }],
      ] },
      { key: "showreel", name: "Showreel", blocks: [
        ph("Showreel", "Neuf secondes pour convaincre, neuf minutes pour tout voir."),
        ["gal:masonry", { items: [{ t: "Orbite", x: "Explicatif 3D" }, { t: "Pixel Parade", x: "Boucle réseaux" }, { t: "Fil rouge", x: "Générique" }, { t: "Grande marée", x: "Lettrage" }, { t: "Cirque ordinaire", x: "Illustration animée" }] }],
        ["proof:stats", { items: [["320", "animations livrées (exemple)"], ["60", "marques"], ["12 s", "durée moyenne d'un format social"]] }],
        ["cta:image", { title: "On vous montre le reste ?", cta: ["Demander le showreel complet", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ph("Services"),
        ["feat:cards", { items: [{ icon: "play", t: "Animation 2D", x: "Personnages, pictos animés, vidéos explicatives." }, { icon: "layers", t: "Motion 3D", x: "Produits, packshots, environnements." }, { icon: "layout", t: "UI animée", x: "Micro-interactions et prototypes d'interfaces." }] }],
        ["feat:pricelist", { title: "Budgets indicatifs", items: [{ t: "Boucle réseaux 10 s", x: "Style et rythme à définir", price: "À partir de 1 400 €" }, { t: "Explicatif 90 s", x: "Script, voix, animation, musique", price: "À partir de 5 900 €" }, { t: "Générique de série", x: "Conception et déclinaisons", price: "Sur devis" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Fournissez-vous la voix off ?", x: "Oui, via notre réseau de comédiens, ou la vôtre." }, { t: "Quels formats livrez-vous ?", x: "MP4, GIF, Lottie, et fichiers sources sur demande." }] }],
      ] },
      { key: "processus", name: "Processus", blocks: [
        ph("Processus"),
        ["feat:steps", { items: [{ t: "Brief", x: "Message, cible, durée.", d: "J1" }, { t: "Script et storyboard", x: "Validation avant animation.", d: "J5" }, { t: "Animatique", x: "Rythme et timing.", d: "J10" }, { t: "Animation", x: "Production et sound design.", d: "J15" }, { t: "Livraison", x: "Tous formats.", d: "J25" }] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Roxane Dubois", r: "Directrice de création" }, { n: "Alex Traoré", r: "Animateur 3D" }, { n: "Mina Kovac", r: "Animatrice 2D" }] }],
        ["cta:split", { title: "Prêt à lancer la machine ?", cta: ["Briefer", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:cards", { title: "Briefez-nous", formTitle: "Votre brief en deux minutes" }],
        ["contact:map", { mapAddress: "3 passage Ménilmontant, 75020 Paris" }],
      ] },
    ],
  },

  // 7. UX
  {
    key: "trace-ux", name: "Trace UX", category: "agence", tags: ["technique", "moderne"], siteType: "Agence UX et expérience utilisateur",
    description: "Agence UX sérieuse et lisible : serif humaniste, bandeau recherche, démarche par étapes, comparatif d'offres et FAQ.",
    brand: "Trace UX",
    tokens: { colors: { primary: "#25507a", secondary: "#102a45", accent: "#e07a3f", background: "#f6f9fc", surface: "#ffffff", text: "#14232f", muted: "#4f6272" }, fonts: { heading: "font.alegreya", body: "font.figtree", button: "font.figtree", link: "font.figtree" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.1, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "trace", motifs: ["tiles", "topo", "mesh"] },
    head: ["head:topbar", { info: "Audit UX offert pour toute première mission", note: "Nantes · Remote" }], foot: ["foot:columns", { about: "Recherche utilisateur, conception d'interfaces et accessibilité pour services numériques.", cols: [["Services", "Audit UX", "Recherche", "Design d'interface"], ["Agence", "Méthode", "Contact"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Méthode", "/methode"], ["Références", "/references"], ["Contact", "/contact"]], cta: ["Demander un audit", "/contact"],
    contact: pcontact("22 rue Crébillon, 44000 Nantes", "02 40 00 56 78", "audit@trace-ux.example", "Du lundi au vendredi, 9 h – 18 h", "Des interfaces que l'on comprend du premier coup."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Agence UX", title: "Rendez vos services numériques évidents.", sub: "Nous étudions vos utilisateurs, simplifions vos parcours et concevons des interfaces accessibles qui convertissent.", cta: ["Demander un audit", "/contact"], cta2: ["Notre méthode", "/methode"], image: "hero", stats: [["+31 %", "de conversion moyenne (exemple)"], ["60", "audits réalisés"], ["AA", "accessibilité visée"]] }],
        ["feat:strips", { title: "Nos services", bg: "token:surface", items: [{ t: "Audit UX et accessibilité", x: "Heuristiques, tests d'usage, rapport priorisé." }, { t: "Recherche utilisateur", x: "Entretiens, observation, tris de cartes." }, { t: "Design d'interface", x: "Parcours, maquettes, design system." }, { t: "Suivi après mise en ligne", x: "Analyse d'usage et itérations." }] }],
        ["feat:steps", { eyebrow: "Démarche", title: "De l'observation à l'amélioration", items: [{ t: "Comprendre", x: "Qui sont vos utilisateurs et que cherchent-ils ?" }, { t: "Simplifier", x: "Réduire les étapes et les erreurs." }, { t: "Concevoir", x: "Prototypes testés avant le développement." }, { t: "Mesurer", x: "Indicateurs avant et après." }] }],
        ["proof:logos", { title: "Parcours conçus pour (clients fictifs)", items: ["Mutuelle Atlas", "Banque Linéa", "Trains du Ponant", "Mairie de Valmont", "Pharma Source"] }],
        ["proof:quotes", { items: [{ q: "Notre taux d'abandon du formulaire a été divisé par deux.", n: "Pascale G.", r: "Responsable digital, cliente fictive" }, { q: "Les tests utilisateurs ont changé la feuille de route.", n: "Julien F.", r: "Product owner, client fictif" }, { q: "Un rapport clair, utilisable tout de suite.", n: "Samia L.", r: "Directrice de service, cliente fictive" }] }],
        ["cta:card", { title: "Et si on regardait votre parcours ensemble ?", sub: "Un premier audit rapide offert.", cta: ["Demander un audit", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ph("Services"),
        ["feat:icons", { items: [{ icon: "eye", t: "Audit et accessibilité", x: "Conformité RGAA et recommandations." }, { icon: "users", t: "Tests utilisateurs", x: "Sessions modérées, à distance ou sur site." }, { icon: "layout", t: "Conception d'interface", x: "Maquettes interactives et design system." }, { icon: "barChart", t: "Analyse d'usage", x: "Tableaux de bord et heatmaps." }] }],
        ["feat:compare", { title: "Choisir son accompagnement", rows: [["", "Audit flash", "Audit complet", "Accompagnement"], ["Heuristiques", "oui", "oui", "oui"], ["Tests utilisateurs", "non", "oui", "oui"], ["Maquettes", "non", "non", "oui"]] }],
        ["cta:band", { title: "Besoin d'un devis ?", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ph("Notre méthode", "Observer d'abord, dessiner ensuite."),
        ["feat:accordion", { items: [{ t: "Comment recrutez-vous les participants ?", x: "Par notre réseau ou par vos fichiers clients, avec consentement." }, { t: "Combien de tests faut-il ?", x: "Cinq à huit sessions suffisent pour repérer l'essentiel." }, { t: "Travaillez-vous avec nos développeurs ?", x: "Oui, nous livrons des spécifications et restons disponibles en recette." }] }],
        ["feat:list2", { title: "Livrables", items: [{ t: "Rapport d'audit priorisé" }, { t: "Verbatims et vidéos de tests" }, { t: "Maquettes haute fidélité" }, { t: "Bibliothèque de composants" }] }],
        ["misc:quote", { text: "Si l'utilisateur doit réfléchir, c'est que nous avons raté quelque chose.", by: "Règle d'or de l'équipe" }],
      ] },
      { key: "references", name: "Références", blocks: [
        ph("Références"),
        ["gal:cards", { items: [{ t: "Mutuelle Atlas", tag: "Santé", x: "Refonte du parcours de remboursement" }, { t: "Trains du Ponant", tag: "Transport", x: "Achat de billets en trois étapes" }, { t: "Mairie de Valmont", tag: "Public", x: "Démarches en ligne accessibles" }] }],
        ["proof:stats", { items: [["-46 %", "d'abandon de formulaire (exemple)"], ["4,6/5", "satisfaction après refonte"], ["7 j", "délai moyen d'un audit flash"]] }],
        ["misc:article", { tag: "Cas", title: "Refondre un parcours de remboursement en six semaines", meta: "Exemple · lecture 3 min", paras: ["Après cinq jours de tests, trois obstacles majeurs ont été repérés et corrigés.", "Les remboursements en ligne ont augmenté de 22 % le trimestre suivant."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Demandez votre audit", formTitle: "Parlez-nous de votre service", formIntro: "Adresse du site et enjeux principaux.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "22 rue Crébillon, 44000 Nantes" }],
      ] },
    ],
  },

  // 8. Publicité
  {
    key: "megaphone-nord", name: "Mégaphone Nord", category: "agence", tags: ["audacieux", "moderne"], siteType: "Agence de publicité",
    description: "Agence de publicité à fort impact : dégradé saturé, bandes de chiffres, titres massifs en capitales et campagnes en vedette.",
    brand: "Mégaphone Nord",
    tokens: { colors: { primary: "#d4380d", secondary: "#2b0f06", accent: "#ffc53d", background: "#fffaf5", surface: "#ffffff", text: "#2a1710", muted: "#6a5248" }, fonts: { heading: "font.montserrat", body: "font.public-sans", button: "font.montserrat", link: "font.public-sans" }, radius: { sm: 4, md: 6, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "md", button: "md" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.04, letterSpacing: -0.02, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "sharp" }, art: { seed: "mega", motifs: ["rays", "halftone", "ribbons"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Agence de publicité intégrée : stratégie, création, médias et production.", cols: [["Agence", "Campagnes", "Services", "Équipe"], ["Contact", "Nous écrire", "Carrières"]] }],
    menu: [["Accueil", "/"], ["Campagnes", "/campagnes"], ["Services", "/services"], ["Agence", "/agence"], ["Contact", "/contact"]], cta: ["Lancer une campagne", "/contact"],
    contact: pcontact("60 rue Nationale, 59800 Lille", "03 20 00 77 88", "campagnes@megaphone-nord.example", "Du lundi au vendredi, 9 h – 18 h 30", "La publicité qui se remarque."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Agence de publicité", title: "Une idée forte. Un impact immédiat.", sub: "Concepts, films, affichage, radio et digital : nous construisons des campagnes qui se retiennent et qui vendent.", cta: ["Voir les campagnes", "/campagnes"], cta2: ["Lancer une campagne", "/contact"], angle: 135, stats: [["+18 pts", "de notoriété moyenne (exemple)"], ["70", "campagnes"], ["5", "prix créatifs"]] }],
        ["gal:featured", { eyebrow: "À la une", title: "Nos dernières campagnes", items: [{ t: "Brasserie du Beffroi", x: "Affichage et radio" }, { t: "Mobilis", x: "Film de lancement" }, { t: "Pharmacie Verte", x: "Digital" }, { t: "Banque Aurore", x: "Print" }] }],
        ["feat:bento", { title: "360 degrés, un seul interlocuteur", bg: "token:surface", items: [{ t: "Stratégie et concept", x: "Analyse de marché, plateforme de communication et idée créative." }, { t: "Création", x: "Films, visuels, audio." }, { t: "Médias", x: "Achat d'espace et optimisation." }] }],
        ["proof:statsbar", { items: [["+27 %", "de ventes sur une campagne type (exemple)"], ["12 M", "contacts touchés"], ["24 ans", "d'agence"]] }],
        ["proof:big", { items: [{ q: "Une campagne dont tout le monde parle encore dans l'équipe.", n: "Directeur marketing", r: "client fictif" }] }],
        ["cta:card", { title: "Votre marque a quelque chose à dire.", sub: "Dites-nous quoi, nous trouverons comment.", cta: ["Lancer une campagne", "/contact"] }],
      ] },
      { key: "campagnes", name: "Campagnes", blocks: [
        ph("Campagnes", "Une sélection de réalisations par secteur."),
        ["gal:cards", { items: [{ t: "Brasserie du Beffroi", tag: "Boissons", x: "« Servi chaud au Nord »" }, { t: "Mobilis", tag: "Mobilité", x: "Film de lancement" }, { t: "Pharmacie Verte", tag: "Santé", x: "Campagne digitale" }, { t: "Banque Aurore", tag: "Finance", x: "Presse magazine" }] }],
        ["proof:stats", { items: [["+42 %", "de trafic en magasin"], ["3,1 M", "vues du film"], ["x2", "retour sur investissement"]] }],
        ["cta:band", { title: "Imaginons la suivante.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ph("Services"),
        ["feat:rows", { items: [{ t: "Stratégie de marque et de campagne", x: "Cibles, promesse, plan de communication." }, { t: "Création publicitaire", x: "Concept, direction artistique, rédaction." }, { t: "Production", x: "Tournage, photographie, enregistrements audio." }, { t: "Médias", x: "TV, radio, affichage, presse et digital." }, { t: "Mesure", x: "Études d'impact et tableaux de bord." }] }],
        ["feat:numbered", { title: "Nos chiffres de méthode", items: [{ t: "3 pistes", x: "Présentées en recommandation créative." }, { t: "2 tours", x: "De retours inclus." }, { t: "1 bilan", x: "Après chaque campagne." }] }],
        ["misc:faq", { items: [{ t: "Quel budget minimum ?", x: "Nous accompagnons des campagnes à partir de 25 000 € (exemple)." }, { t: "Gérez-vous l'achat d'espace ?", x: "Oui, en transparence totale sur les remises." }] }],
      ] },
      { key: "agence", name: "Agence", blocks: [
        ph("L'agence"),
        ["misc:story", { eyebrow: "Depuis 2000", title: "Des gens du Nord qui voient grand", paras: ["Mégaphone Nord réunit rédacteurs, directeurs artistiques, planneurs stratégiques et producteurs sous le même toit lillois.", "Notre credo : une idée simple, bien exécutée, vaut toutes les démonstrations de force."], image: "portrait-1" }],
        ["proof:team", { items: [{ n: "Sandrine Hoarau", r: "Directrice générale" }, { n: "Bastien Leclerc", r: "Directeur de création" }, { n: "Naïma Cherif", r: "Directrice média" }, { n: "Olivier Dumont", r: "Producteur" }] }],
        ["proof:logos", { title: "Marques accompagnées (fictives)", items: ["Beffroi", "Mobilis", "Pharmacie Verte", "Aurore", "Cap Flandres"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Lançons votre campagne", formTitle: "Votre brief", formIntro: "Cible, budget, échéance.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "60 rue Nationale, 59800 Lille" }],
      ] },
    ],
  },

  // 9. Événementiel digital
  {
    key: "scene-connectee", name: "Scène Connectée", category: "agence", tags: ["moderne", "audacieux"], siteType: "Agence d'événementiel digital",
    description: "Agence d'événementiel digital : compte à rebours, programme minuté, formules hybrides et ambiance bleu nuit électrique.",
    brand: "Scène Connectée",
    tokens: { colors: { primary: "#3f4bd8", secondary: "#0b1030", accent: "#16d3a8", background: "#f4f6ff", surface: "#ffffff", text: "#10142e", muted: "#505673" }, fonts: { heading: "font.exo-2", body: "font.outfit", button: "font.exo-2", link: "font.outfit" }, radius: { sm: 8, md: 14, lg: 20, button: 999, field: 12, card: 18 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 800, lineHeight: 1.05, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "scene", motifs: ["mesh", "bokeh", "waves"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "Ne ratez aucun événement", sub: "Nos prochains webinaires et retours d'expérience, une fois par mois.", button: "S'inscrire" }],
    menu: [["Accueil", "/"], ["Formats", "/formats"], ["Programme", "/programme"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Organiser un événement", "/contact"],
    contact: pcontact("14 allée Jean Jaurès, 31000 Toulouse", "05 61 00 90 12", "events@scene-connectee.example", "Du lundi au vendredi, 9 h – 18 h", "Des événements hybrides qui rassemblent."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:countdown", { eyebrow: "Prochain événement phare (exemple)", title: "Le Forum Hybride, 100 % connecté.", sub: "Conférences en direct, ateliers à distance et rencontres sur site : une journée pensée pour toutes les audiences.", cta: ["Réserver une démo", "/contact"], cta2: ["Voir le programme", "/programme"], until: "2030-06-01T18:00:00+02:00" }],
        ["feat:cards", { eyebrow: "Formats", title: "Ce que nous organisons", items: [{ icon: "video", t: "Webinaires et conférences", x: "Régie, plateau et diffusion multi-plateformes." }, { icon: "users", t: "Événements hybrides", x: "Salle et audience à distance réunies." }, { icon: "globe", t: "Salons virtuels", x: "Stands 3D, rendez-vous et réseautage." }] }],
        ["proof:stats", { items: [["450", "événements produits (exemple)"], ["38 000", "participants cumulés"], ["97 %", "de satisfaction exemple"]] }],
        ["feat:alt", { title: "Un exemple d'événement", bg: "token:surface", items: [{ t: "Convention annuelle d'un réseau de 800 agences", x: "Plateau central à Toulouse, 12 salles virtuelles, chat modéré et replay : un événement vécu par 3 200 participants.", link: ["En savoir plus", "/formats"] }, { t: "Lancement produit en direct", x: "Scénographie, démonstrations filmées et séance de questions en direct." }] }],
        ["proof:quotes", { items: [{ q: "Zéro incident technique pendant six heures de direct.", n: "Caroline B.", r: "Directrice événementiel, cliente fictive" }, { q: "Nos clients à distance se sont sentis aussi invités que ceux sur place.", n: "Rémi A.", r: "PDG, client fictif" }, { q: "Une équipe calme dans l'urgence.", n: "Nadia P.", r: "Responsable communication, cliente fictive" }] }],
        ["cta:band", { title: "Votre événement mérite une vraie scène.", cta: ["Organiser un événement", "/contact"] }],
      ] },
      { key: "formats", name: "Formats", blocks: [
        ph("Formats d'événements"),
        ["feat:cards", { title: "Quatre formats", items: [{ icon: "video", t: "Webinaire", x: "Jusqu'à 2 000 participants, sondages et questions en direct." }, { icon: "users", t: "Hybride", x: "Plateau, captation multi-caméras, régie dédiée." }, { icon: "globe", t: "Salon virtuel", x: "Stands personnalisables, rendez-vous en visio." }, { icon: "sparkles", t: "Lancement produit", x: "Scénographie et démonstrations filmées." }] }],
        ["feat:grid-icons", { title: "Inclus dans chaque format", items: [{ icon: "monitor", t: "Plateforme" , x: "Inscriptions, chat, replay." }, { icon: "keyboard", t: "Régie", x: "Techniciens dédiés." }, { icon: "barChart", t: "Rapport", x: "Participation et engagement." }] }],
        ["cta:split", { title: "Un format sur mesure ?", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "programme", name: "Programme", blocks: [
        ph("Programme d'exemple", "Déroulé du Forum Hybride."),
        ["misc:schedule", { items: [{ d: "9 h", t: "Accueil et ouverture", x: "Mot du président, en salle et en ligne." }, { d: "10 h 15", t: "Conférence : travailler à distance", x: "Retour d'expérience de trois entreprises." }, { d: "13 h 30", t: "Ateliers parallèles", x: "Six ateliers au choix." }, { d: "16 h", t: "Table ronde", x: "Questions du public en direct." }, { d: "17 h 30", t: "Clôture", x: "Annonce de l'édition suivante." }] }],
        ["proof:team", { title: "Intervenants (fictifs)", items: [{ n: "Léna Moreau", r: "Sociologue du travail" }, { n: "Théo Vasseur", r: "Dirigeant de start-up" }, { n: "Amira Khelifi", r: "Spécialiste en cybersécurité" }] }],
        ["cta:band", { title: "Réservez votre place d'observateur.", cta: ["Demander une invitation", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Formules indicatives, à adapter à votre audience."),
        ["price:tiers", { items: [{ t: "Webinaire", price: "2 900 €", f: ["Jusqu'à 500 participants", "Régie et animation", "Replay"], cta: "Choisir", url: "/contact" }, { t: "Hybride", price: "9 500 €", hl: true, f: ["Plateau et captation", "2 000 participants", "Modération et rapport"], cta: "Choisir", url: "/contact" }, { t: "Salon virtuel", price: "Sur devis", f: ["Stands personnalisés", "Rendez-vous en visio", "Analyses"], cta: "Nous contacter", url: "/contact" }] }],
        ["misc:faq", { items: [{ t: "Quelle plateforme utilisez-vous ?", x: "La nôtre, ou la vôtre : nous nous adaptons." }, { t: "Pouvez-vous gérer l'accueil sur site ?", x: "Oui, avec hôtes et hôtesses." }] }],
        ["cta:card", { title: "Un chiffrage personnalisé ?", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:cards", { title: "Parlons de votre événement", formTitle: "Quelques informations" }],
        ["misc:hours", { title: "Disponibilités", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Régie en direct", "Astreinte le jour J"]] }],
      ] },
    ],
  },

  // 10. Illustration
  {
    key: "encre-ouverte", name: "Encre Ouverte", category: "agence", tags: ["chaleureux", "naturel"], siteType: "Studio d'illustration",
    description: "Studio d'illustration chaleureux : papier crème, vert sauge, texte courant serif, grande galerie de planches et commandes sur mesure.",
    brand: "Encre Ouverte",
    tokens: { colors: { primary: "#3f6b4f", secondary: "#24352b", accent: "#d96f4a", background: "#f8f3e8", surface: "#fffaf0", text: "#26261f", muted: "#5f5d4e" }, fonts: { heading: "font.dm-sans", body: "font.lora", button: "font.dm-sans", link: "font.lora" }, radius: { sm: 8, md: 14, lg: 22, button: 14, field: 10, card: 20 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.12, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "encre", motifs: ["botanical", "blobs", "arches"] },
    head: ["head:side", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Planches", "/planches"], ["Commandes", "/commandes"], ["À propos", "/a-propos"], ["Contact", "/contact"]], cta: ["Commander une illustration", "/contact"],
    contact: pcontact("7 rue du Faubourg, 35000 Rennes", "02 99 00 14 25", "plumes@encre-ouverte.example", "Du mardi au vendredi, 10 h – 17 h", "Illustrations pour l'édition, la presse et les marques."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Studio d'illustration", title: "Des images qui racontent, à la main.", sub: "Albums jeunesse, couvertures, presse, packaging : quatre illustratrices et illustrateurs dessinent vos histoires à l'encre, à la gouache et sur tablette.", cta: ["Voir les planches", "/planches"], cta2: ["Commander", "/commandes"], image: "hero" }],
        ["gal:strip", { title: "Quelques planches" , items: [{ t: "Forêt de nuit" }, { t: "Le Renard bleu" }, { t: "Marché d'été" }, { t: "Toits de Rennes" }, { t: "L'Atelier de Mina" }] }],
        ["feat:alt", { eyebrow: "Commandes", title: "Ce que nous illustrons", items: [{ t: "Édition jeunesse", x: "Albums, couvertures et séries, avec suivi éditorial.", link: ["Commander", "/commandes"] }, { t: "Presse et édition", x: "Dessins de presse, infographies illustrées et couvertures." }, { t: "Marques et packaging", x: "Étiquettes, motifs, univers graphiques." }] }],
        ["proof:quotes", { title: "Mots d'éditeurs et de marques", items: [{ q: "Des personnages immédiatement attachants.", n: "Josette M.", r: "Éditrice, cliente fictive" }, { q: "Un trait reconnaissable entre mille.", n: "David N.", r: "Directeur artistique, client fictif" }, { q: "Livré avec soin et dans les temps.", n: "Camille Z.", r: "Responsable packaging, cliente fictive" }] }],
        ["proof:stats", { items: [["80", "albums illustrés (exemple)"], ["4", "illustrateurs"], ["15 ans", "de plume"]] }],
        ["cta:split", { title: "Une histoire à mettre en images ?", sub: "Envoyez-nous votre texte ou votre idée.", cta: ["Commander une illustration", "/contact"] }],
      ] },
      { key: "planches", name: "Planches", blocks: [
        ph("Planches", "Une sélection par univers."),
        ["gal:masonry", { items: [{ t: "Forêt de nuit", x: "Gouache" }, { t: "Le Renard bleu", x: "Encre et aquarelle" }, { t: "Marché d'été", x: "Tablette" }, { t: "Toits de Rennes", x: "Plume" }, { t: "L'Atelier de Mina", x: "Gouache" }, { t: "Voyage en train", x: "Encre" }] }],
        ["misc:quote", { text: "Un dessin juste est un dessin qui laisse la place à l'imagination.", by: "Léa Tanguy, illustratrice fictive" }],
        ["cta:band", { title: "Vous aimez un style ? Commandez-le.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "commandes", name: "Commandes", blocks: [
        ph("Commandes", "Tarifs d'exemple, selon le format et les droits."),
        ["feat:pricelist", { items: [{ t: "Couverture de livre", x: "Format poche ou grand format", price: "À partir de 900 €" }, { t: "Illustration de presse", x: "Pleine page, droits de publication", price: "À partir de 400 €" }, { t: "Album jeunesse 32 pages", x: "Planches complètes, avec suivi éditorial", price: "Sur devis" }, { t: "Portrait personnalisé", x: "Gouache sur papier, format A4", price: "180 €" }] }],
        ["feat:steps", { title: "Comment ça se passe", items: [{ t: "Brief", x: "Texte, public, format." }, { t: "Croquis", x: "Trois pistes à choisir." }, { t: "Planche finale", x: "Couleur et finitions." }, { t: "Livraison", x: "Fichiers haute définition." }] }],
        ["misc:faq", { items: [{ t: "Quels droits cédez-vous ?", x: "Reproduction pour l'usage convenu, durée et territoire définis au contrat." }, { t: "Puis-je demander des retouches ?", x: "Deux séries de corrections sont incluses." }] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ph("À propos du studio"),
        ["misc:story", { eyebrow: "Depuis 2009", title: "Quatre mains, une même encre", paras: ["Le studio est né d'un atelier partagé à Rennes, entre pots d'encre et piles de papier.", "Nous croyons qu'une illustration doit se regarder longtemps, et se laisser relire."], image: "portrait-1" }],
        ["proof:team", { items: [{ n: "Léa Tanguy", r: "Illustratrice jeunesse" }, { n: "Matteo Giraud", r: "Illustrateur presse" }, { n: "Fatou Diallo", r: "Illustratrice packaging" }, { n: "Rose Quéré", r: "Coordinatrice" }] }],
        ["feat:icons", { title: "Nos techniques", items: [{ icon: "palette", t: "Gouache et aquarelle", x: "Textures chaudes, couleurs profondes." }, { icon: "image", t: "Encre et plume", x: "Trait vivant et contrasté." }, { icon: "tablet", t: "Tablette", x: "Livraison rapide, fichiers modulables." }] }],
      ] },
      { key: "contact", name: "Contact" , blocks: [
        ph("Contact", "Racontez-nous votre histoire."),
        ["contact:info", { title: "Écrire au studio", formTitle: "Votre projet", formIntro: "Format, délai, public visé.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "7 rue du Faubourg, 35000 Rennes" }],
      ] },
    ],
  },
];
