// Entreprise, lot A (13 thèmes). Textes de DÉMONSTRATION : marques, personnes et coordonnées fictives.
const P = (title, sub) => ["misc:pagehead", { title, sub }];
const CT = (title, formTitle, formIntro, cta) => ["contact:info", { title, formTitle, formIntro, cta: [cta, "/contact"] }];
const Q = (q, n, r) => ({ q, n, r });
const F = "font.";

module.exports = [
  // 1 ---------------------------------------------------------------- stratégie
  {
    key: "strateon-cap", name: "Strateon", category: "entreprise", tags: ["editorial", "classique"], siteType: "Cabinet de conseil en stratégie", featured: true,
    description: "Conseil en stratégie : titre serif expressif, vert profond, bandeau en deux colonnes, méthode en lignes numérotées et chiffres sur bande.",
    brand: "Strateon Partners",
    tokens: { colors: { primary: "#0f6b5a", secondary: "#0b3b33", accent: "#e0a64a", background: "#f6f5f0", surface: "#ffffff", text: "#16231f", muted: "#4f5d58" }, fonts: { heading: F + "fraunces", body: F + "figtree", button: F + "figtree", link: F + "figtree" }, radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "soft" }, art: { seed: "strateon", motifs: ["topo", "arches", "plates"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Stratégie de croissance et arbitrages d'investissement pour comités de direction.", cols: [["Cabinet", "Méthode", "Études de cas", "Équipe"], ["Contact", "Prendre rendez-vous", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Méthode", "/methode"], ["Études de cas", "/etudes-de-cas"], ["Équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Ouvrir la discussion", "/contact"],
    contact: { address: "8 quai des Chartrons, 33000 Bordeaux", phone: "05 56 00 12 34", email: "direction@strateon.example", hours: "Lundi – vendredi, 8 h 30 – 18 h 30", tagline: "Des choix de cap, documentés et assumés." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Conseil en stratégie", title: "Le bon cap, avant le prochain budget.", sub: "Nous aidons les comités de direction à choisir où investir, où renoncer et comment l'expliquer à leurs équipes.", cta: ["Ouvrir la discussion", "/contact"], cta2: ["Notre méthode", "/methode"], image: "hero" }],
        ["proof:logos", { title: "Mandats récents (clients fictifs)", items: ["Groupe Halvane", "Maison Orlic", "Tessaly Énergie", "Coopérative Verdon", "Nautilis"] }],
        ["feat:rows", { eyebrow: "Ce que nous faisons", title: "Quatre questions que se posent les dirigeants", items: [{ t: "Où allons-nous gagner ?", x: "Choix de marchés, de segments et de positionnement, appuyés sur des données de terrain." }, { t: "Avec quel modèle économique ?", x: "Simulation de marges, de prix et de besoins en investissement sur cinq ans." }, { t: "Faut-il acquérir, s'allier ou construire ?", x: "Analyse de cibles, de partenariats et de make-or-buy." }, { t: "Comment embarquer l'organisation ?", x: "Feuille de route, jalons de pilotage et communication interne." }] }],
        ["proof:statsbar", { items: [["6 semaines", "durée type d'une mission de cadrage"], ["3 scénarios", "chiffrés dans chaque recommandation"], ["1 associé", "présent à chaque comité"]] }],
        ["feat:alt", { eyebrow: "Approche", title: "Peu de slides, beaucoup de décisions", items: [{ t: "Diagnostic partagé", x: "Entretiens avec dix à quinze personnes clés avant toute hypothèse.", link: ["Voir la méthode", "/methode"] }, { t: "Recommandation arbitrable", x: "Trois options, leurs risques, et celle que nous défendons.", link: ["Études de cas", "/etudes-de-cas"] }] }],
        ["proof:quotes", { eyebrow: "Retours", title: "Ce qu'en disent les dirigeants", items: [Q("Nous avons arrêté deux projets séduisants mais mal alignés. Le comité a tranché en une séance.", "Hélène V.", "Directrice générale, cliente fictive"), Q("Des chiffres que le directeur financier a pu relire ligne à ligne.", "Étienne M.", "Président, client fictif"), Q("Une feuille de route que les équipes ont réellement reprise.", "Sonia A.", "Directrice stratégie, cliente fictive")] }],
        ["cta:band", { title: "Un arbitrage important approche ?", sub: "Trente minutes pour cadrer la question, sans engagement.", cta: ["Ouvrir la discussion", "/contact"] }]
      ] },
      { key: "methode", name: "Méthode", blocks: [
        P("Notre méthode", "Du cadrage à la mise en œuvre"),
        ["feat:steps", { title: "Quatre temps, six semaines en moyenne", items: [{ d: "Semaine 1", t: "Cadrage", x: "Question posée, périmètre, critères de décision et comité de pilotage." }, { d: "Semaines 2-3", t: "Diagnostic", x: "Entretiens, analyse de marché, lecture des données internes." }, { d: "Semaines 4-5", t: "Options", x: "Trois scénarios chiffrés, risques et prérequis." }, { d: "Semaine 6", t: "Recommandation", x: "Restitution au comité et plan des cent premiers jours." }] }],
        ["feat:list2", { title: "Livrables remis à la fin", items: [{ t: "Note de recommandation de vingt pages" }, { t: "Modèle financier ouvert et documenté" }, { t: "Cartographie des parties prenantes" }, { t: "Feuille de route à douze mois" }, { t: "Tableau de bord de suivi des décisions" }, { t: "Séance de passage de relais aux équipes" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Travaillez-vous avec des PME ?", x: "Oui, à partir de 40 millions d'euros de chiffre d'affaires ou pour une décision d'investissement majeure." }, { t: "Quelle est la durée minimale ?", x: "Un cadrage express de deux semaines existe pour les arbitrages urgents." }, { t: "Qui intervient sur le dossier ?", x: "Un associé, un manager et un à deux consultants, pas de rotation en cours de mission." }] }]
      ] },
      { key: "etudes-de-cas", name: "Études de cas", blocks: [
        P("Études de cas", "Exemples de missions (clients fictifs)"),
        ["gal:cards", { items: [{ tag: "Industrie", t: "Sortir d'un marché saturé", x: "Réorientation d'un fabricant vers la maintenance sous contrat." }, { tag: "Distribution", t: "Choisir entre trois régions", x: "Ordre d'ouverture de magasins selon rentabilité et risque." }, { tag: "Énergie", t: "Acquérir ou s'allier", x: "Comparaison de deux cibles et d'un partenariat de long terme." }] }],
        ["proof:big", { items: [Q("La recommandation tenait en une page, et chaque chiffre avait sa source.", "Jérôme P.", "Directeur financier, client fictif")] }],
        ["cta:split", { title: "Une situation proche de la vôtre ?", sub: "Nous vous dirons honnêtement si une mission est utile.", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        P("L'équipe", "Des associés qui restent sur le dossier"),
        ["proof:team", { items: [{ n: "Aude Larcher", r: "Associée, stratégie et croissance" }, { n: "Matthieu Delorme", r: "Associé, finance et fusions" }, { n: "Rania Belkacem", r: "Manager, études de marché" }, { n: "Louis Fontaine", r: "Consultant, modélisation" }] }],
        ["misc:text", { eyebrow: "Parti pris", title: "Indépendants, donc libres de dire non", paras: ["Strateon ne vend ni logiciel ni mise en œuvre. Nos honoraires sont fixés au forfait, quel que soit le scénario retenu.", "Nous refusons les mandats en conflit avec un client existant et le disons dès le premier échange."] }],
        ["proof:stats", { items: [["14", "consultants"], ["2", "bureaux"], ["35", "missions par an"]] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Présentez-nous votre question"), CT("Parlons de votre arbitrage", "Écrivez-nous", "Décrivez la décision à prendre et son échéance.", "Envoyer"), ["misc:hours", { title: "Disponibilités", rows: [["Lundi – jeudi", "8 h 30 – 18 h 30"], ["Vendredi", "8 h 30 – 16 h 00"]] }]] }
    ]
  },
  // 2 ---------------------------------------------------------------- RH
  {
    key: "rhapsode-rh", name: "Rhapsode", category: "entreprise", tags: ["chaleureux", "moderne"], siteType: "Cabinet de conseil RH et recrutement",
    description: "Cabinet RH vivant : orange brique, grotesque expressive, collage de portraits, métiers en onglets et équipe visible.",
    brand: "Rhapsode RH",
    tokens: { colors: { primary: "#c2570c", secondary: "#3a2415", accent: "#2d6a6a", background: "#fffaf4", surface: "#ffffff", text: "#2a1c12", muted: "#6a5646" }, fonts: { heading: F + "bricolage-grotesque", body: F + "karla", button: F + "karla", link: F + "karla" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 20 }, shadow: { card: "md", button: "sm" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "rhapsode", motifs: ["blobs", "bokeh", "ribbons"] },
    head: ["head:topbar", { info: "Mission, intérim cadre, outplacement : 04 72 00 45 67", note: "Réponse sous 24 h ouvrées" }], foot: ["foot:newsletter", { title: "La lettre des recruteurs", sub: "Une fois par mois : marché de l'emploi, salaires, pratiques.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Recrutement", "/recrutement"], ["Conseil RH", "/conseil-rh"], ["Candidats", "/candidats"], ["Contact", "/contact"]], cta: ["Confier un recrutement", "/contact"],
    contact: { address: "27 rue Garibaldi, 69006 Lyon", phone: "04 72 00 45 67", email: "bonjour@rhapsode.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Le bon profil, la bonne équipe, le bon moment." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Recrutement et conseil RH", title: "Recruter des gens qui restent.", sub: "Nous trouvons des profils cadres et techniques pour les PME, et aidons les équipes RH à fidéliser.", cta: ["Confier un recrutement", "/contact"], cta2: ["Je suis candidat", "/candidats"] }],
        ["feat:tabs", { eyebrow: "Nos métiers", title: "Un accompagnement selon votre besoin", items: [{ t: "Recrutement", x: "Chasse et sélection de cadres, avec garantie de remplacement pendant douze mois." }, { t: "Conseil RH", x: "Grilles de rémunération, entretiens annuels, plan de succession." }, { t: "Intérim cadre", x: "Un manager de transition en moins de dix jours ouvrés." }, { t: "Outplacement", x: "Parcours individuel de six mois pour rebondir." }] }],
        ["proof:stats", { title: "Notre quotidien en chiffres (exemples)", items: [["32 jours", "délai moyen de présentation"], ["210", "recrutements par an"], ["88 %", "de collaborateurs encore en poste après 2 ans"]] }],
        ["proof:team", { items: [{ n: "Camille Roux", r: "Consultante, fonctions support" }, { n: "Yanis Meddahi", r: "Consultant, ingénierie" }, { n: "Bérénice Aubry", r: "Directrice, conseil RH" }] }],
        ["proof:quotes", { title: "Mots de clients", items: [Q("On nous a présenté trois profils très différents, et chacun tenait la route.", "Delphine C.", "DRH, cliente fictive"), Q("Un vrai regard sur notre culture d'équipe.", "Paul G.", "Gérant, client fictif")] }],
        ["cta:split", { title: "Un poste ouvert depuis trop longtemps ?", sub: "Racontez-nous le contexte, nous répondons sous 24 heures.", cta: ["Confier un recrutement", "/contact"] }]
      ] },
      { key: "recrutement", name: "Recrutement", blocks: [
        P("Recrutement", "Une méthode en cinq étapes"),
        ["feat:steps", { items: [{ d: "J0", t: "Cadrage du poste", x: "Mission, équipe, rémunération, critères éliminatoires." }, { d: "J5", t: "Approche directe", x: "Cartographie de vivier et premiers appels." }, { d: "J20", t: "Entretiens approfondis", x: "Comptes rendus écrits et références vérifiées." }, { d: "J32", t: "Présentation", x: "Trois profils au plus, avec avis argumenté." }, { d: "J60+", t: "Intégration", x: "Suivi à 1, 3 et 6 mois." }] }],
        ["feat:pricelist", { title: "Honoraires indicatifs", items: [{ t: "Poste cadre, forfait", x: "Paiement en trois fois", price: "18 % du brut annuel" }, { t: "Poste technicien ou agent de maîtrise", x: "", price: "12 %" }, { t: "Intérim cadre", x: "Par semaine", price: "Sur devis" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Que couvre la garantie ?", x: "Remplacement sans nouveaux honoraires si le collaborateur quitte l'entreprise dans les douze mois." }, { t: "Cherchez-vous aussi des profils en reconversion ?", x: "Oui, quand le projet est cohérent avec le poste." }] }]
      ] },
      { key: "conseil-rh", name: "Conseil RH", blocks: [
        P("Conseil RH", "Structurer sans alourdir"),
        ["feat:cards", { items: [{ icon: "calculator", t: "Rémunération", x: "Grilles, équité interne et comparaison à des fourchettes de marché." }, { icon: "users", t: "Management", x: "Formation des managers de proximité et entretiens annuels." }, { icon: "trendingUp", t: "Carrières", x: "Cartographie des compétences et plans de succession." }] }],
        ["misc:quote", { text: "La RH n'est pas un coût de structure : c'est la façon dont une entreprise tient ses promesses.", by: "Bérénice Aubry, directrice du conseil" }],
        ["cta:band", { title: "Faisons le point sur votre politique RH", cta: ["Prendre contact", "/contact"] }]
      ] },
      { key: "candidats", name: "Candidats", blocks: [
        P("Candidats", "Postes ouverts et conseils"),
        ["misc:posts", { title: "Conseils et actualités", count: 3, layout: "list" }],
        ["feat:list2", { title: "Ce que nous vous garantissons", items: [{ t: "Aucune candidature transmise sans votre accord" }, { t: "Retour écrit après chaque entretien" }, { t: "Transparence sur la fourchette de salaire" }, { t: "Confidentialité de votre démarche" }] }],
        ["cta:card", { title: "Envoyez-nous votre CV", sub: "Même sans poste précis, nous gardons votre profil trois mois.", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Parlons de votre besoin"), CT("Venez nous voir à Lyon", "Décrivez votre besoin", "Poste, localisation, calendrier souhaité.", "Envoyer"), ["feat:icons", { items: [{ icon: "clock", t: "Réponse sous 24 h", x: "Les jours ouvrés." }, { icon: "lock", t: "Confidentialité", x: "Engagement signé dès le premier échange." }] }]] }
    ]
  },
  // 3 ---------------------------------------------------------------- avocats (sombre)
  {
    key: "lexorane-nuit", name: "Lexorane", category: "entreprise", tags: ["sombre", "luxe"], siteType: "Cabinet d'avocats d'affaires",
    description: "Cabinet d'avocats d'affaires en thème sombre : encre noire, filet doré, grande typographie éditoriale et pages de domaines très lisibles.",
    brand: "Lexorane Avocats",
    tokens: { colors: { primary: "#c9a45c", secondary: "#1d1a22", accent: "#8fb7c9", background: "#121016", surface: "#1b1820", text: "#efe9dc", muted: "#b2aa9a" }, fonts: { heading: F + "cormorant-garamond", body: F + "public-sans", button: F + "public-sans", link: F + "public-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3a3440" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "lexorane", motifs: ["arches", "plates", "halftone"] },
    head: ["head:dark", {}], foot: ["foot:big", { title: "Lexorane" }],
    menu: [["Accueil", "/"], ["Domaines", "/domaines"], ["Associés", "/associes"], ["Publications", "/publications"], ["Contact", "/contact"]], cta: ["Consulter un associé", "/contact"],
    contact: { address: "3 place des Victoires, 75001 Paris", phone: "01 40 00 98 76", email: "secretariat@lexorane.example", hours: "Lundi – vendredi, 9 h – 19 h", tagline: "Droit des affaires, contentieux et fusions." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Droit des affaires", title: "Sécuriser l'opération, défendre la position.", sub: "Fusions-acquisitions, droit des sociétés, contentieux commercial et restructuration : une équipe de quinze avocats pour dirigeants et fonds.", cta: ["Consulter un associé", "/contact"], cta2: ["Nos domaines", "/domaines"] }],
        ["feat:strips", { eyebrow: "Domaines", title: "Quatre pratiques complémentaires", items: [{ t: "Fusions-acquisitions", x: "Audit juridique, négociation, garanties d'actif et de passif." }, { t: "Droit des sociétés", x: "Pactes d'associés, gouvernance, opérations sur le capital." }, { t: "Contentieux commercial", x: "Rupture de relations, concurrence déloyale, arbitrage." }, { t: "Restructuration", x: "Prévention, conciliation, procédures collectives." }] }],
        ["proof:big", { items: [Q("Un cabinet qui parle clair et ne laisse rien au hasard dans les clauses.", "Gérard S.", "Président d'un groupe industriel, client fictif")] }],
        ["feat:numbered", { items: [{ t: "15", x: "avocats dont 4 associés" }, { t: "2", x: "langues de travail, français et anglais" }, { t: "48 h", x: "pour une première analyse écrite" }] }],
        ["proof:team", { items: [{ n: "Me Odile Marchetti", r: "Associée, M&A" }, { n: "Me Adrien Sauvageot", r: "Associé, contentieux" }, { n: "Me Nadia Kerbrat", r: "Associée, sociétés" }] }],
        ["cta:card", { title: "Un dossier urgent ?", sub: "Une ligne directe est ouverte aux clients, de 8 h à 21 h.", cta: ["Nous contacter", "/contact"] }]
      ] },
      { key: "domaines", name: "Domaines", blocks: [
        P("Domaines d'intervention", "Des équipes dédiées par matière"),
        ["feat:alt", { items: [{ t: "Fusions-acquisitions", x: "Du protocole d'accord au closing, nous pilotons le calendrier, les conditions suspensives et la négociation des garanties.", link: ["En parler", "/contact"] }, { t: "Contentieux commercial", x: "Référés, procédures au fond et arbitrage, avec une stratégie fondée sur le coût et le risque.", link: ["En parler", "/contact"] }, { t: "Restructuration", x: "Mandat ad hoc, conciliation et plans de sauvegarde, au plus près des créanciers.", link: ["En parler", "/contact"] }] }],
        ["feat:accordion", { title: "Questions de dirigeants", items: [{ t: "Quand faut-il auditer une cible ?", x: "Dès la lettre d'intention, avant l'exclusivité si possible." }, { t: "Comment sont fixés vos honoraires ?", x: "Au forfait pour les opérations, au temps passé plafonné pour le contentieux." }] }]
      ] },
      { key: "associes", name: "Associés", blocks: [
        P("Les associés", "Une relation directe avec chaque dossier"),
        ["proof:team", { items: [{ n: "Me Odile Marchetti", r: "M&A, private equity" }, { n: "Me Adrien Sauvageot", r: "Contentieux, arbitrage" }, { n: "Me Nadia Kerbrat", r: "Droit des sociétés" }, { n: "Me Rémi Castaing", r: "Restructuration" }] }],
        ["misc:story", { eyebrow: "Notre éthique", title: "Le secret professionnel comme premier principe", paras: ["Nous traitons chaque dossier avec la même discrétion, quelle que soit la taille du client.", "Aucune information n'est partagée entre équipes sans nécessité."], image: "portrait-1" }],
        ["proof:statsbar", { items: [["20 ans", "de pratique moyenne des associés"], ["12", "juridictions de nos correspondants"], ["70 %", "de clients fidèles depuis plus de cinq ans"]] }]
      ] },
      { key: "publications", name: "Publications", blocks: [
        P("Publications", "Notes de veille et analyses"),
        ["misc:posts", { title: "Dernières notes", count: 4, layout: "list" }],
        ["misc:article", { tag: "Sociétés", title: "Pactes d'associés : cinq clauses à relire chaque année", meta: "Note de veille · 6 min de lecture", paras: ["Un pacte signé au moment d'une levée vieillit vite. Les clauses de sortie, de préemption et de leaver méritent une relecture annuelle.", "Les clauses de non-concurrence doivent rester proportionnées pour être opposables."], quote: "Un pacte est un contrat de confiance, pas un contrat de défiance.", by: "Me Nadia Kerbrat" }],
        ["cta:band", { title: "Recevoir nos notes de veille", cta: ["S'inscrire", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Premier échange confidentiel"), ["contact:map", { title: "Au cœur de Paris", mapAddress: "3 place des Victoires, 75001 Paris" }], CT("Écrire au cabinet", "Message sécurisé", "Ne joignez pas de pièces avant d'avoir reçu notre accord.", "Envoyer")] }
    ]
  },
  // 4 ---------------------------------------------------------------- notaire
  {
    key: "etude-ancrage", name: "Étude Ancrage", category: "entreprise", tags: ["classique", "minimaliste"], siteType: "Étude notariale",
    description: "Étude notariale rassurante : indigo posé, serif de journal, bandeau encadré, grille d'actes avec tarifs et horaires d'accueil.",
    brand: "Étude Ancrage",
    tokens: { colors: { primary: "#4437a8", secondary: "#1e1a4a", accent: "#b88a3a", background: "#fbfaff", surface: "#ffffff", text: "#1c1a33", muted: "#58557a" }, fonts: { heading: F + "newsreader", body: F + "dm-sans", button: F + "dm-sans", link: F + "dm-sans" }, radius: { sm: 2, md: 4, lg: 8, button: 3, field: 3, card: 6 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "center", shape: "sharp" }, art: { seed: "ancrage", motifs: ["tiles", "arches", "rays"] },
    head: ["head:center", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Nos actes", "/actes"], ["Honoraires", "/honoraires"], ["Préparer un rendez-vous", "/preparer"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "5 place du Marché, 37000 Tours", phone: "02 47 00 31 20", email: "accueil@ancrage-notaires.example", hours: "Lundi – vendredi, 9 h – 12 h 30 et 14 h – 18 h", tagline: "Famille, immobilier, patrimoine." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Étude notariale", title: "Vos actes importants, entre de bonnes mains.", sub: "Achat, succession, contrat de mariage, donation : quatre notaires et une équipe vous accompagnent à chaque étape.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Préparer mon rendez-vous", "/preparer"] }],
        ["feat:icons", { eyebrow: "Nos domaines", title: "Ce que nous faisons pour vous", items: [{ icon: "home", t: "Immobilier", x: "Vente, achat, viager, copropriété." }, { icon: "users", t: "Famille", x: "Mariage, pacs, divorce par consentement mutuel." }, { icon: "fileText", t: "Succession", x: "Déclaration, partage, attestations." }, { icon: "briefcase", t: "Entreprise", x: "Cession de parts, baux commerciaux." }] }],
        ["feat:pricelist", { title: "Quelques repères de coût", items: [{ t: "Consultation d'orientation", x: "Première demi-heure", price: "Offerte" }, { t: "Contrat de mariage", x: "Hors droits d'enregistrement", price: "À partir de 450 €" }, { t: "Testament authentique", x: "Rédaction et conservation", price: "À partir de 120 €" }] }],
        ["misc:hours", { title: "Horaires d'accueil", rows: [["Lundi – jeudi", "9 h – 12 h 30 · 14 h – 18 h"], ["Vendredi", "9 h – 12 h 30 · 14 h – 17 h"], ["Samedi", "Sur rendez-vous"]] }],
        ["proof:quotes", { title: "Retours d'usagers", items: [Q("Tout m'a été expliqué dans un langage clair.", "Mireille T.", "cliente fictive"), Q("Signature de l'acte dans les délais prévus.", "Olivier B.", "client fictif")] }],
        ["cta:image", { title: "Un acte à préparer ?", sub: "Un clerc vous rappelle sous deux jours ouvrés.", cta: ["Être rappelé", "/contact"] }]
      ] },
      { key: "actes", name: "Nos actes", blocks: [
        P("Nos actes", "Du plus courant au plus délicat"),
        ["feat:rows", { items: [{ t: "Vente immobilière", x: "Avant-contrat, purgé des droits de préemption, signature de l'acte authentique." }, { t: "Succession", x: "Recherche de testament, inventaire, attestation immobilière et partage." }, { t: "Donation", x: "Donation simple ou partage, avec optimisation des abattements." }, { t: "Contrat de mariage", x: "Séparation de biens, communauté universelle, clause de préciput." }] }],
        ["feat:accordion", { title: "Questions courantes", items: [{ t: "Quels délais pour une vente ?", x: "Comptez trois mois entre l'avant-contrat et la signature." }, { t: "Puis-je signer à distance ?", x: "Oui, par procuration ou par acte à distance, selon les cas." }] }]
      ] },
      { key: "honoraires", name: "Honoraires", blocks: [
        P("Honoraires", "Ce qui revient à l'État, ce qui revient à l'étude"),
        ["feat:compare", { rows: [["", "Droits et taxes", "Émoluments de l'étude"], ["Nature", "Reversés à l'État et aux collectivités", "Rémunération réglementée du notaire"], ["Part dans un achat ancien", "Environ 80 %", "Environ 10 %"], ["Débours", "Frais de dossier, cadastre, état civil", "Non inclus"]] }],
        ["misc:text", { title: "Une transparence imposée", paras: ["Les tarifs de la plupart des actes sont fixés par décret. Une estimation chiffrée vous est remise avant signature.", "Les exemples ci-dessus sont de démonstration."] }]
      ] },
      { key: "preparer", name: "Préparer un rendez-vous", blocks: [
        P("Préparer un rendez-vous", "Les pièces à nous apporter"),
        ["feat:list2", { title: "Pour tout dossier", items: [{ t: "Pièce d'identité en cours de validité" }, { t: "Livret de famille" }, { t: "Justificatif de domicile" }, { t: "Contrat de mariage ou pacs, le cas échéant" }, { t: "Titre de propriété du bien" }, { t: "Derniers avis d'imposition" }] }],
        ["feat:steps", { items: [{ d: "1", t: "Premier échange", x: "Appel ou rendez-vous d'orientation." }, { d: "2", t: "Constitution du dossier", x: "Collecte des pièces par un clerc." }, { d: "3", t: "Projet d'acte", x: "Relecture et questions." }, { d: "4", t: "Signature", x: "En salle de l'étude." }] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Prendre rendez-vous"), CT("Nous trouver à Tours", "Demande de rendez-vous", "Précisez la nature de l'acte.", "Demander"), ["contact:map", { title: "Accès", mapAddress: "5 place du Marché, 37000 Tours" }]] }
    ]
  },
  // 5 ---------------------------------------------------------------- audit énergétique
  {
    key: "ecotherm-audit", name: "Ecotherm", category: "entreprise", tags: ["naturel", "moderne"], siteType: "Cabinet d'audit énergétique",
    description: "Audit énergétique pour sites tertiaires et industriels : vert feuille, dégradé énergique, étapes claires, tableau comparatif des prestations.",
    brand: "Ecotherm Audit",
    tokens: { colors: { primary: "#2f7d32", secondary: "#0f3d2a", accent: "#f2b134", background: "#f7fbf5", surface: "#ffffff", text: "#13281a", muted: "#4a5e50" }, fonts: { heading: F + "epilogue", body: F + "ibm-plex-sans", button: F + "epilogue", link: F + "ibm-plex-sans" }, radius: { sm: 6, md: 12, lg: 18, button: 10, field: 8, card: 16 }, shadow: { card: "md", button: "sm" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "ecotherm", motifs: ["rays", "botanical", "topo"] },
    head: ["head:float", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Aides et obligations", "/aides"], ["Références", "/references"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "41 avenue de la Gare, 44000 Nantes", phone: "02 40 00 66 12", email: "audit@ecotherm.example", hours: "Lundi – vendredi, 8 h 30 – 17 h 30", tagline: "Mesurer, prioriser, réduire." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Audit énergétique", title: "Savoir où part chaque kilowattheure.", sub: "Audits réglementaires et plans de sobriété pour bâtiments tertiaires, ateliers et sites industriels.", cta: ["Demander un devis", "/contact"], cta2: ["Voir les prestations", "/prestations"], stats: [["-28 %", "de consommation visée en moyenne"], ["3 ans", "temps de retour médian"], ["250", "sites audités"]] }],
        ["feat:steps", { eyebrow: "Déroulé", title: "De la mesure au plan d'action", items: [{ d: "Étape 1", t: "Collecte des factures", x: "Trois années de consommations et de contrats." }, { d: "Étape 2", t: "Visite du site", x: "Relevés, caméra thermique, enregistreurs." }, { d: "Étape 3", t: "Scénarios chiffrés", x: "Gains, coût et aides mobilisables." }, { d: "Étape 4", t: "Restitution", x: "Présentation à la direction et aux équipes techniques." }] }],
        ["feat:compare", { title: "Choisir son niveau d'audit", rows: [["", "Audit réglementaire", "Audit approfondi"], ["Visite du site", "oui", "oui, avec mesures"], ["Scénarios chiffrés", "2", "4 + plan pluriannuel"], ["Dossier d'aides", "non", "oui"], ["Suivi à 12 mois", "non", "oui"]] }],
        ["gal:featured", { title: "Sites récents (exemples)", items: [{ t: "Entrepôt logistique de 12 000 m²", x: "Éclairage, chauffage et régulation.", tag: "Logistique" }, { t: "Ateliers de menuiserie", x: "Récupération de chaleur sur compresseurs.", tag: "Industrie" }, { t: "Collège et gymnase", x: "Chaufferie et isolation des combles.", tag: "Public" }, { t: "Immeuble de bureaux", x: "Pilotage de la ventilation.", tag: "Tertiaire" }] }],
        ["feat:accordion", { title: "Avant de nous contacter", items: [{ t: "Mon entreprise est-elle obligée de réaliser un audit ?", x: "Selon la taille et la consommation, un audit tous les quatre ans peut être obligatoire." }, { t: "Combien de temps dure la visite ?", x: "Une demi-journée à deux jours selon la surface et la complexité." }] }],
        ["cta:band", { title: "Connaître votre potentiel d'économies", sub: "Devis gratuit sous 72 heures.", cta: ["Demander un devis", "/contact"] }]
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        P("Prestations", "Audit, plan de comptage, assistance travaux"),
        ["feat:bento", { items: [{ icon: "search", t: "Audit énergétique", x: "Bilan des consommations, diagnostic des usages et préconisations hiérarchisées." }, { icon: "activity", t: "Plan de comptage", x: "Pose de sous-compteurs et tableau de bord." }, { icon: "settings", t: "Assistance travaux", x: "Cahier des charges, comparaison des offres, réception." }] }],
        ["price:tiers", { items: [{ t: "Audit réglementaire", price: "à partir de 2 400 €", period: "par site", f: ["Visite sur site", "Rapport normé", "Restitution à distance"], cta: ["Demander", "/contact"] }, { t: "Audit approfondi", price: "à partir de 5 800 €", period: "par site", f: ["Mesures sur 15 jours", "Dossier d'aides", "Suivi à 12 mois"], cta: ["Demander", "/contact"], hl: true }] }],
        ["cta:card", { title: "Un doute sur la prestation adaptée ?", cta: ["Nous poser la question", "/contact"] }]
      ] },
      { key: "aides", name: "Aides et obligations", blocks: [
        P("Aides et obligations", "Repères pour les entreprises"),
        ["feat:checks", { title: "Ce que couvre notre dossier d'aides", cta: ["Nous consulter", "/contact"], items: [{ t: "Certificats d'économies d'énergie" }, { t: "Aides régionales à l'investissement" }, { t: "Prêts à taux bonifié" }, { t: "Amortissement accéléré" }] }],
        ["misc:article", { tag: "Réglementation", title: "Audit énergétique : qui doit le faire et quand ?", meta: "Guide pratique · 5 min de lecture", paras: ["Les grandes entreprises sont tenues de réaliser un audit tous les quatre ans. D'autres seuils s'appliquent aux bâtiments tertiaires.", "Un audit bien préparé se rentabilise souvent dès la première année."] }]
      ] },
      { key: "references", name: "Références", blocks: [
        P("Références", "Mesures avant/après (exemples fictifs)"),
        ["proof:statsbar", { items: [["-34 %", "gaz sur un atelier"], ["-22 %", "électricité sur un bureau"], ["-41 %", "éclairage sur un entrepôt"]] }],
        ["gal:grid", { items: [{ t: "Atelier de menuiserie", x: "Récupération de chaleur." }, { t: "Immeuble de bureaux", x: "GTB et régulation." }, { t: "Collège", x: "Chaufferie bois." }, { t: "Cave coopérative", x: "Froid et pompage." }] }],
        ["proof:quotes", { items: [Q("Des préconisations classées par retour sur investissement, enfin lisibles.", "Valérie N.", "Responsable technique, cliente fictive")] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Votre site, votre facture, votre objectif"), CT("Parlons de votre site", "Demande de devis", "Surface, usage, consommation annuelle approximative.", "Envoyer"), ["feat:icons", { items: [{ icon: "clock", t: "Devis sous 72 h" }, { icon: "mapPin", t: "Interventions dans le Grand Ouest" }] }]] }
    ]
  },
  // 6 ---------------------------------------------------------------- médiation
  {
    key: "concordia-med", name: "Concordia", category: "entreprise", tags: ["minimaliste", "chaleureux"], siteType: "Cabinet de médiation et de conformité",
    description: "Médiation d'entreprise et conformité : violet calme, très grand texte seul, espace généreux, grille d'icônes et parcours rassurant.",
    brand: "Concordia Médiation",
    tokens: { colors: { primary: "#7a3fb0", secondary: "#2b1a40", accent: "#e8b86a", background: "#fdfaff", surface: "#f4eefa", text: "#231733", muted: "#5b4d6e" }, fonts: { heading: F + "young-serif", body: F + "nunito", button: F + "nunito", link: F + "nunito" }, radius: { sm: 6, md: 12, lg: 20, button: 14, field: 12, card: 18 }, shadow: { card: "none", button: "none" } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "soft" }, art: { seed: "concordia", motifs: ["blobs", "ribbons", "bokeh"] },
    head: ["head:minimal", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Médiation", "/mediation"], ["Conformité", "/conformite"], ["Déroulement", "/deroulement"], ["Contact", "/contact"]], cta: ["Demander une médiation", "/contact"],
    contact: { address: "14 cours Mirabeau, 13100 Aix-en-Provence", phone: "04 42 00 87 21", email: "accueil@concordia.example", hours: "Mardi – vendredi, 9 h – 17 h", tagline: "Apaiser les conflits, structurer les règles." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Médiation et conformité", title: "Un désaccord n'est pas la fin d'une collaboration.", sub: "Médiation entre associés, entre équipes ou avec un fournisseur, et mise en conformité éthique des organisations.", cta: ["Demander une médiation", "/contact"], cta2: ["Comment ça se passe", "/deroulement"] }],
        ["feat:grid-icons", { title: "Quatre situations que nous traitons", items: [{ icon: "users", t: "Conflit entre associés", x: "Désaccord stratégique, répartition du capital, départ." }, { icon: "briefcase", t: "Litige commercial", x: "Retard, qualité, rupture de contrat avec un partenaire." }, { icon: "heart", t: "Tensions d'équipe", x: "Communication, charge de travail, management." }, { icon: "shield", t: "Alerte interne", x: "Dispositif de signalement et référent éthique." }] }],
        ["misc:quote", { text: "Le meilleur accord est celui que les deux parties ont écrit elles-mêmes.", by: "Marion Escoffier, médiatrice certifiée" }],
        ["feat:steps", { title: "Un parcours en quatre rencontres", items: [{ d: "1", t: "Entretiens séparés", x: "Chacun expose sa version, en confidentialité." }, { d: "2", t: "Séance commune", x: "Cadre posé, enjeux clarifiés." }, { d: "3", t: "Recherche de solutions", x: "Options et conditions de mise en œuvre." }, { d: "4", t: "Protocole d'accord", x: "Rédigé avec les parties, éventuellement homologué." }] }],
        ["proof:quotes", { items: [Q("Nous nous parlions par avocats interposés. Deux séances ont tout débloqué.", "Antoine R.", "associé, client fictif"), Q("Un cadre neutre et sans jugement.", "Léa C.", "responsable d'équipe, cliente fictive")] }],
        ["cta:card", { title: "Un premier échange confidentiel", sub: "Trente minutes pour voir si la médiation est adaptée.", cta: ["Demander une médiation", "/contact"] }]
      ] },
      { key: "mediation", name: "Médiation", blocks: [
        P("Médiation", "Un tiers neutre, un cadre protégé"),
        ["feat:rows", { items: [{ t: "Confidentialité", x: "Ce qui se dit en médiation ne peut pas être utilisé devant un juge." }, { t: "Neutralité", x: "La médiatrice ne tranche pas : elle aide à trouver un terrain d'entente." }, { t: "Rapidité", x: "Trois à six semaines, contre plusieurs mois de procédure." }, { t: "Liberté", x: "Chaque partie peut se retirer à tout moment." }] }],
        ["feat:pricelist", { title: "Honoraires indicatifs", items: [{ t: "Séance de médiation de trois heures", x: "Partagée entre les parties", price: "540 €" }, { t: "Entretien individuel préparatoire", x: "", price: "120 €" }, { t: "Rédaction du protocole d'accord", x: "", price: "300 €" }] }],
        ["cta:band", { title: "Mieux vaut en parler tôt", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "conformite", name: "Conformité", blocks: [
        P("Conformité", "Règles claires, culture éthique"),
        ["feat:cards", { items: [{ icon: "fileText", t: "Code de conduite", x: "Rédaction et déploiement auprès des équipes." }, { icon: "bell", t: "Lanceur d'alerte", x: "Canal de signalement interne et procédure de traitement." }, { icon: "graduation", t: "Sensibilisation", x: "Ateliers de deux heures sur la corruption et les conflits d'intérêts." }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "À partir de quelle taille faut-il un dispositif d'alerte ?", x: "À partir de cinquante salariés. Nous vérifions votre situation." }, { t: "Pouvez-vous jouer le rôle de référent externe ?", x: "Oui, sur abonnement annuel." }] }]
      ] },
      { key: "deroulement", name: "Déroulement", blocks: [
        P("Déroulement", "Ce que vous pouvez attendre"),
        ["misc:faq", { items: [{ t: "Faut-il un avocat ?", x: "Ce n'est pas obligatoire, mais chaque partie peut venir accompagnée." }, { t: "Où se tiennent les séances ?", x: "Dans nos locaux à Aix-en-Provence ou en visioconférence." }, { t: "Que se passe-t-il si nous ne trouvons pas d'accord ?", x: "Vous restez libres de saisir la justice. Rien de ce qui a été dit n'est utilisable." }] }],
        ["misc:text", { title: "Un engagement de confiance", paras: ["Chaque médiation débute par la signature d'une convention fixant le cadre, les honoraires et la confidentialité."] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "En toute discrétion"), CT("Écrire à Concordia", "Votre demande", "Dites-nous brièvement la nature du désaccord, sans détail sensible.", "Envoyer"), ["misc:hours", { title: "Horaires", rows: [["Mardi – jeudi", "9 h – 17 h"], ["Vendredi", "9 h – 13 h"]] }]] }
    ]
  },
  // 7 ---------------------------------------------------------------- coaching (sombre)
  {
    key: "apexane-coach", name: "Apexane", category: "entreprise", tags: ["sombre", "audacieux"], siteType: "Coaching de dirigeants",
    description: "Coaching de dirigeants en thème prune sombre : rose vif, serif d'affiche, image pleine hauteur, citation centrale et formules d'accompagnement.",
    brand: "Apexane Coaching",
    tokens: { colors: { primary: "#e0559b", secondary: "#2a1630", accent: "#f3c969", background: "#1a0f1f", surface: "#26172c", text: "#f6ecf4", muted: "#c9b5c7" }, fonts: { heading: F + "instrument-serif", body: F + "manrope", button: F + "manrope", link: F + "manrope" }, radius: { sm: 8, md: 16, lg: 28, button: 999, field: 14, card: 22 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#47304d" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "pill" }, art: { seed: "apexane", motifs: ["mesh", "blobs", "rays"] },
    head: ["head:split", {}], foot: ["foot:columns", { about: "Coaching individuel et collectif pour dirigeants et comités exécutifs.", cols: [["Accompagnement", "Formules", "Parcours", "Podcast"], ["Contact", "Séance découverte", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Formules", "/formules"], ["Parcours", "/parcours"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Séance découverte", "/contact"],
    contact: { address: "19 rue de la République, 13001 Marseille", phone: "04 91 00 52 18", email: "bonjour@apexane.example", hours: "Sur rendez-vous, du lundi au samedi", tagline: "Penser grand, décider juste." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Coaching de dirigeants", title: "Diriger sans s'user.", sub: "Un accompagnement confidentiel pour les présidents et directeurs généraux qui arbitrent seuls, souvent tard.", cta: ["Séance découverte", "/contact"], cta2: ["Voir les formules", "/formules"] }],
        ["proof:big", { items: [Q("J'ai arrêté de tout porter seul. La structure de nos séances m'a rendu des soirées.", "Nathalie P.", "présidente, cliente fictive")] }],
        ["feat:bento", { eyebrow: "Axes de travail", title: "Trois terrains sur lesquels nous avançons", items: [{ icon: "sliders", t: "Décider sous pression", x: "Méthodes de tri des priorités et de décision à plusieurs." }, { icon: "users", t: "Aligner le comité exécutif", x: "Séminaires, feedbacks croisés et clarté des rôles." }, { icon: "heart", t: "Tenir dans la durée", x: "Énergie, délégation et rythme de vie." }] }],
        ["price:tiers", { title: "Trois formules", items: [{ t: "Séance unique", price: "290 €", period: "la séance", f: ["Deux heures", "Compte rendu écrit"], cta: ["Réserver", "/contact"] }, { t: "Parcours de six mois", price: "2 900 €", period: "au total", f: ["Douze séances", "Échanges entre séances", "Bilan à mi-parcours"], cta: ["Choisir", "/contact"], hl: true }, { t: "Comité exécutif", price: "Sur devis", period: "", f: ["Diagnostic collectif", "Deux séminaires", "Suivi individuel"], cta: ["Demander", "/contact"] }] }],
        ["cta:image", { title: "Une heure pour voir si le courant passe", sub: "Séance découverte offerte, sans suite obligatoire.", cta: ["Réserver", "/contact"] }]
      ] },
      { key: "formules", name: "Formules", blocks: [
        P("Formules", "Un cadre adapté à votre rythme"),
        ["feat:compare", { rows: [["", "Séance unique", "Parcours 6 mois", "Comité exécutif"], ["Durée", "2 h", "12 séances", "6 mois"], ["Échanges entre séances", "non", "oui", "oui"], ["Outils d'évaluation", "non", "oui", "oui"], ["Séminaires collectifs", "non", "non", "2"]] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Où ont lieu les séances ?", x: "À Marseille, chez vous ou en visioconférence." }, { t: "Le coaching est-il confidentiel ?", x: "Oui, y compris vis-à-vis de votre conseil d'administration." }] }]
      ] },
      { key: "parcours", name: "Parcours", blocks: [
        P("Parcours", "Comment se déroule un accompagnement"),
        ["feat:steps", { items: [{ d: "Mois 1", t: "Cadrage", x: "Objectifs, indicateurs et règles de confidentialité." }, { d: "Mois 2-3", t: "Exploration", x: "Entretiens avec trois proches collaborateurs." }, { d: "Mois 4-5", t: "Expérimentations", x: "Nouveaux rituels de décision, mesurés." }, { d: "Mois 6", t: "Bilan", x: "Ce qui a changé, ce qui reste à ancrer." }] }],
        ["misc:story", { eyebrow: "Votre coach", title: "Muriel Danjou", paras: ["Ancienne directrice générale d'une entreprise de services, certifiée en coaching exécutif, elle accompagne une vingtaine de dirigeants par an.", "Elle travaille en français et en anglais."], image: "portrait-1" }]
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        P("Ressources", "Notes et épisodes"),
        ["misc:posts", { title: "Textes récents", count: 3, layout: "grid" }],
        ["misc:marquee", { items: ["Podcast : le dirigeant solitaire", "Lettre mensuelle", "Atelier du 14 décembre"] }],
        ["cta:band", { title: "Recevoir la lettre mensuelle", cta: ["S'inscrire", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Séance découverte"), CT("Écrivons-nous", "Votre message", "Quelques lignes sur votre situation suffisent.", "Envoyer"), ["feat:icons", { items: [{ icon: "lock", t: "Confidentialité totale" }, { icon: "video", t: "Visioconférence possible" }] }]] }
    ]
  },
  // 8 ---------------------------------------------------------------- traduction
  {
    key: "polyglotte-verbe", name: "Verbal Pont", category: "entreprise", tags: ["editorial", "geometrique"], siteType: "Agence de traduction et d'interprétariat",
    description: "Agence de traduction et d'interprétariat : prune éditoriale, recherche de langue dès l'accueil, grille de langues et formules d'interprètes.",
    brand: "Verbal Pont",
    tokens: { colors: { primary: "#8e2a86", secondary: "#3a1238", accent: "#18a0a8", background: "#fcf7fc", surface: "#ffffff", text: "#241024", muted: "#5f4a5f" }, fonts: { heading: F + "gloock", body: F + "onest", button: F + "onest", link: F + "onest" }, radius: { sm: 4, md: 10, lg: 16, button: 8, field: 8, card: 12 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "verbalpont", motifs: ["tiles", "plates", "objects"] },
    head: ["head:side", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Traduction", "/traduction"], ["Interprétariat", "/interpretariat"], ["Langues", "/langues"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "22 rue des Tanneurs, 67000 Strasbourg", phone: "03 88 00 74 25", email: "devis@verbalpont.example", hours: "Lundi – vendredi, 8 h – 18 h", tagline: "Dites-le, dans toutes les langues utiles." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Traduction et interprétariat", title: "Votre message, compris partout.", sub: "Traducteurs et interprètes assermentés ou spécialisés, pour contrats, notices techniques et conférences.", placeholder: "Rechercher une langue, ex. polonais", cta: ["Demander un devis", "/contact"], image: "hero" }],
        ["feat:list2", { eyebrow: "Langues courantes", title: "Quarante langues couvertes", items: [{ t: "Anglais, allemand, espagnol, italien" }, { t: "Portugais, néerlandais, polonais" }, { t: "Arabe, turc, russe" }, { t: "Mandarin, japonais, coréen" }, { t: "Langues nordiques" }, { t: "Langue des signes française" }] }],
        ["feat:cards", { title: "Deux métiers, un même exigence", items: [{ icon: "fileText", t: "Traduction écrite", x: "Contrats, notices, sites web, brevets, relue par un second linguiste." }, { icon: "users", t: "Interprétariat", x: "Consécutive, simultanée, chuchotage, en présentiel ou à distance." }, { icon: "shield", t: "Traduction assermentée", x: "Documents officiels avec cachet et signature d'un expert judiciaire." }] }],
        ["proof:stats", { items: [["40", "langues"], ["320", "linguistes partenaires"], ["24 h", "pour un devis, en général"]] }],
        ["gal:masonry", { items: [{ t: "Notice machine multilingue" }, { t: "Congrès médical" }, { t: "Contrat de distribution" }, { t: "Site web en 6 langues" }] }],
        ["cta:split", { title: "Un document à traduire ?", sub: "Envoyez-le, nous chiffrons au mot ou à la page.", cta: ["Demander un devis", "/contact"] }]
      ] },
      { key: "traduction", name: "Traduction", blocks: [
        P("Traduction", "Du simple document à la mémoire de traduction"),
        ["feat:alt", { items: [{ t: "Juridique et financier", x: "Contrats, statuts, rapports annuels, traduits par des juristes-linguistes.", link: ["Devis", "/contact"] }, { t: "Technique et industriel", x: "Notices, fiches de sécurité, normes, avec glossaire validé par vos équipes.", link: ["Devis", "/contact"] }] }],
        ["feat:pricelist", { title: "Tarifs indicatifs", items: [{ t: "Anglais vers français", x: "Par mot, relecture comprise", price: "0,11 €" }, { t: "Langues rares", x: "Par mot", price: "0,18 €" }, { t: "Traduction assermentée", x: "Par page", price: "à partir de 45 €" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Quels formats acceptez-vous ?", x: "Word, PDF, tableurs, fichiers de mise en page et sites web." }, { t: "Mes documents restent-ils confidentiels ?", x: "Tous nos linguistes signent un engagement de confidentialité." }] }]
      ] },
      { key: "interpretariat", name: "Interprétariat", blocks: [
        P("Interprétariat", "Réunions, salons, audiences"),
        ["price:tiers", { items: [{ t: "Demi-journée", price: "420 €", period: "par interprète", f: ["Consécutive ou chuchotage", "Préparation incluse"], cta: ["Réserver", "/contact"] }, { t: "Journée", price: "720 €", period: "par interprète", f: ["Deux interprètes en simultanée", "Cabine sur devis"], cta: ["Réserver", "/contact"], hl: true }] }],
        ["feat:steps", { items: [{ d: "1", t: "Brief", x: "Objectifs, public, vocabulaire." }, { d: "2", t: "Préparation", x: "Glossaire et documents reçus à l'avance." }, { d: "3", t: "Intervention", x: "Sur place ou en visioconférence." }] }],
        ["cta:band", { title: "Votre événement approche ?", cta: ["Nous contacter", "/contact"] }]
      ] },
      { key: "langues", name: "Langues", blocks: [
        P("Langues", "Notre réseau de linguistes"),
        ["gal:wall", { items: [{ t: "Anglais" }, { t: "Allemand" }, { t: "Polonais" }, { t: "Japonais" }] }],
        ["proof:quotes", { items: [Q("Notre glossaire est respecté d'une langue à l'autre.", "Sébastien K.", "responsable qualité, client fictif"), Q("Interprètes ponctuels et très préparés.", "Anaïs F.", "organisatrice de congrès, cliente fictive")] }],
        ["misc:text", { title: "Nos engagements", paras: ["Chaque texte est traduit vers la langue maternelle du traducteur, puis relu par un second linguiste."] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Devis et renseignements"), CT("Parlons langues", "Demande de devis", "Langue source, langues cibles, volume estimé.", "Envoyer"), ["misc:hours", { title: "Permanence", rows: [["Lundi – vendredi", "8 h – 18 h"], ["Urgences", "Ligne dédiée, 7 j/7"]] }]] }
    ]
  },
  // 9 ---------------------------------------------------------------- courtage assurance
  {
    key: "garantie-pro", name: "Fideria Courtage", category: "entreprise", tags: ["classique", "geometrique"], siteType: "Courtier en assurances pour entreprises",
    description: "Courtage en assurances professionnelles : bandeau de journal, rouge grenat, grande image empilée, comparatif de garanties et FAQ sinistres.",
    brand: "Fideria Courtage",
    tokens: { colors: { primary: "#a31d34", secondary: "#1f1316", accent: "#2f5f8a", background: "#faf7f6", surface: "#ffffff", text: "#211618", muted: "#5e4f52" }, fonts: { heading: F + "syne", body: F + "mulish", button: F + "mulish", link: F + "mulish" }, radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 8 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "fideria", motifs: ["plates", "halftone", "tiles"] },
    head: ["head:masthead", { dateline: "Courtier indépendant · Orias n° 00 000 000 (exemple)" }], foot: ["foot:columns", { about: "Courtier en assurances pour artisans, commerçants et PME.", cols: [["Assurances", "Responsabilité civile", "Multirisque", "Flotte auto"], ["Aide", "Déclarer un sinistre", "Contact", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Contrats", "/contrats"], ["Sinistre", "/sinistre"], ["Secteurs", "/secteurs"], ["Contact", "/contact"]], cta: ["Comparer mes garanties", "/contact"],
    contact: { address: "70 boulevard de Strasbourg, 59000 Lille", phone: "03 20 00 41 63", email: "courtage@fideria.example", hours: "Lundi – vendredi, 8 h 30 – 17 h 30", tagline: "Le contrat adapté, le bon prix, un interlocuteur." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Assurances professionnelles", title: "Assurez votre activité, pas des clauses inutiles.", sub: "Nous comparons les offres de quinze compagnies et vous recommandons le contrat qui couvre vos vrais risques.", cta: ["Comparer mes garanties", "/contact"], stats: [["15", "compagnies consultées"], ["2 jours", "pour une proposition"], ["1", "interlocuteur dédié"]] }],
        ["feat:cards", { eyebrow: "Contrats", title: "Les assurances les plus demandées", items: [{ icon: "shield", t: "Responsabilité civile", x: "Dommages causés aux clients et aux tiers." }, { icon: "home", t: "Multirisque local", x: "Incendie, dégât des eaux, vol, bris de machine." }, { icon: "briefcase", t: "Cyber et pertes d'exploitation", x: "Panne informatique, rançongiciel, arrêt d'activité." }] }],
        ["feat:compare", { title: "Ce que vous gagnez à passer par un courtier", rows: [["", "Agence unique", "Courtier"], ["Nombre d'offres comparées", "1", "jusqu'à 15"], ["Conseil indépendant", "non", "oui"], ["Aide au sinistre", "selon l'agent", "oui, dossier suivi"]] }],
        ["proof:logos", { title: "Compagnies partenaires (exemples fictifs)", items: ["Aurore Assur", "Bastion Mutuelle", "Cèdre Garanties", "Doris Protection"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Combien coûte votre intervention ?", x: "Nous sommes rémunérés par commission incluse dans la prime, sans surcoût." }, { t: "Pouvez-vous reprendre un contrat existant ?", x: "Oui, nous sommes mandatés pour renégocier à l'échéance." }] }],
        ["cta:band", { title: "Un contrat arrive à échéance ?", sub: "Envoyez-le, nous le relisons gratuitement.", cta: ["Envoyer mon contrat", "/contact"] }]
      ] },
      { key: "contrats", name: "Contrats", blocks: [
        P("Contrats", "Les garanties que nous placons"),
        ["feat:tabs", { items: [{ t: "RC professionnelle", x: "Garantie obligatoire pour de nombreux métiers, avec plafonds adaptés." }, { t: "Décennale", x: "Pour les artisans du bâtiment : attestation délivrée sous 48 h." }, { t: "Flotte auto", x: "Véhicules et marchandises transportées, bonus-malus mutualisé." }, { t: "Prévoyance", x: "Maintien de revenu du dirigeant et de ses salariés." }] }],
        ["feat:pricelist", { title: "Primes indicatives annuelles", items: [{ t: "RC pro, consultant indépendant", x: "", price: "dès 230 €" }, { t: "Multirisque commerce de 60 m²", x: "", price: "dès 540 €" }, { t: "Cyber, PME de 20 salariés", x: "", price: "dès 890 €" }] }]
      ] },
      { key: "sinistre", name: "Sinistre", blocks: [
        P("Déclarer un sinistre", "Nous gérons le dossier avec vous"),
        ["feat:steps", { items: [{ d: "Sous 5 jours", t: "Déclaration", x: "Appelez-nous ou écrivez-nous avec photos et factures." }, { d: "Sous 48 h", t: "Prise en charge", x: "Nous contactons la compagnie et l'expert." }, { d: "Suivi", t: "Indemnisation", x: "Nous relançons jusqu'au virement." }] }],
        ["misc:faq", { items: [{ t: "Quels documents préparer ?", x: "Contrat, photos, devis de réparation, déclaration à la police en cas de vol." }, { t: "Puis-je faire réparer tout de suite ?", x: "Seules les mesures conservatoires d'urgence sont autorisées avant l'expert." }] }],
        ["cta:card", { title: "Un sinistre en cours ?", cta: ["Nous appeler", "/contact"] }]
      ] },
      { key: "secteurs", name: "Secteurs", blocks: [
        P("Secteurs", "Des programmes dédiés par métier"),
        ["gal:cards", { items: [{ tag: "BTP", t: "Artisans du bâtiment", x: "Décennale, outillage, véhicules." }, { tag: "Commerce", t: "Commerçants", x: "Stock, vitrine, perte d'exploitation." }, { tag: "Santé", t: "Professions libérales", x: "RC, prévoyance, protection juridique." }] }],
        ["proof:quotes", { items: [Q("Mon ancien contrat ne couvrait pas mon matériel. C'est réglé.", "Hugo L.", "plombier, client fictif")] }],
        ["cta:band", { title: "Votre métier n'est pas listé ?", cta: ["Nous contacter", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Comparer vos garanties"), CT("Nous rencontrer à Lille", "Demande d'étude", "Activité, effectif, contrats actuels.", "Envoyer"), ["feat:icons", { items: [{ icon: "clock", t: "Proposition sous 2 jours" }, { icon: "shield", t: "Conseil indépendant" }] }]] }
    ]
  },
  // 10 --------------------------------------------------------------- cybersécurité (sombre)
  {
    key: "cryptyle-sec", name: "Cryptyle", category: "entreprise", tags: ["sombre", "technique"], siteType: "Conseil en cybersécurité",
    description: "Conseil en cybersécurité en thème noir et vert acide : affiche typographique, bento de services, phases d'intervention et bande de chiffres.",
    brand: "Cryptyle Sécurité",
    tokens: { colors: { primary: "#a3e635", secondary: "#10170c", accent: "#38bdf8", background: "#0c0f0a", surface: "#161b12", text: "#e8f0dc", muted: "#aab59a" }, fonts: { heading: F + "space-grotesk", body: F + "chivo", button: F + "space-grotesk", link: F + "chivo" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2c3524" }, type: { h1: { size: 60, weight: 700, lineHeight: 1.0, letterSpacing: -0.03, transform: "none" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "cryptyle", motifs: ["mesh", "tiles", "halftone"] },
    head: ["head:bar", {}], foot: ["foot:big", { title: "Cryptyle" }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Incident", "/incident"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Parler à un expert", "/contact"],
    contact: { address: "9 rue du Faubourg Saint-Jean, 31000 Toulouse", phone: "05 61 00 24 90", email: "securite@cryptyle.example", hours: "Astreinte 24 h/24 pour les clients sous contrat", tagline: "Prévenir, détecter, réagir." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Cybersécurité", title: "Vos systèmes, sous contrôle.", sub: "Audit, tests d'intrusion, gestion de crise : une équipe d'ingénieurs pour PME et ETI exposées aux rançongiciels.", cta: ["Parler à un expert", "/contact"], cta2: ["Que faire en cas d'attaque", "/incident"] }],
        ["misc:marquee", { items: ["Audit", "Test d'intrusion", "Supervision", "Sensibilisation", "Réponse à incident"] }],
        ["feat:bento", { eyebrow: "Services", title: "Une couverture de bout en bout", items: [{ icon: "lock", t: "Audit et tests d'intrusion", x: "Évaluation de votre exposition, du poste utilisateur au réseau." }, { icon: "eye", t: "Supervision", x: "Veille des journaux et alertes qualifiées." }, { icon: "bell", t: "Réponse à incident", x: "Équipe d'astreinte, isolement des systèmes, relance." }] }],
        ["proof:statsbar", { items: [["< 4 h", "de réaction sous contrat d'astreinte"], ["120", "audits réalisés"], ["0", "rançon payée par nos clients (exemple)"]] }],
        ["feat:steps", { title: "Notre intervention type", items: [{ d: "H+1", t: "Qualification", x: "Périmètre touché et premières mesures." }, { d: "H+4", t: "Confinement", x: "Isolement des machines compromises." }, { d: "J+2", t: "Investigation", x: "Origine, étendue, données concernées." }, { d: "J+7", t: "Reprise", x: "Restauration sécurisée et leçons tirées." }] }],
        ["cta:card", { title: "Mieux vaut un audit qu'une crise", sub: "Cadrage gratuit de quarante-cinq minutes.", cta: ["Parler à un expert", "/contact"] }]
      ] },
      { key: "services", name: "Services", blocks: [
        P("Services", "Du diagnostic à la supervision"),
        ["feat:tabs", { items: [{ t: "Audit", x: "Revue de configuration, gestion des accès, sauvegardes." }, { t: "Test d'intrusion", x: "Simulation d'attaque externe et interne." }, { t: "Supervision", x: "Collecte de journaux et réaction sous quatre heures." }, { t: "Sensibilisation", x: "Campagnes d'hameçonnage simulées et ateliers." }] }],
        ["price:tiers", { items: [{ t: "Essentiel", price: "1 900 €", period: "par audit", f: ["Revue des accès", "Rapport priorisé"], cta: ["Choisir", "/contact"] }, { t: "Complet", price: "6 500 €", period: "par audit", f: ["Test d'intrusion", "Restitution à la direction", "Contre-audit à 6 mois"], cta: ["Choisir", "/contact"], hl: true }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Les tests risquent-ils d'interrompre l'activité ?", x: "Les tests sont planifiés avec vos équipes et menés avec garde-fous." }] }]
      ] },
      { key: "incident", name: "Incident", blocks: [
        P("En cas d'attaque", "Les premiers gestes"),
        ["feat:rows", { items: [{ t: "Déconnecter sans éteindre", x: "Isolez les machines du réseau, mais ne les éteignez pas : la mémoire contient des preuves." }, { t: "Prévenir la direction", x: "Désignez une cellule de crise et un porte-parole." }, { t: "Ne pas payer dans la précipitation", x: "Faites évaluer la situation avant toute négociation." }, { t: "Déclarer", x: "Dépôt de plainte et notification à l'autorité de protection des données si besoin." }] }],
        ["cta:band", { title: "Vous êtes touché maintenant ?", sub: "Ligne d'urgence réservée aux clients sous contrat.", cta: ["Contacter l'astreinte", "/contact"] }]
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        P("Ressources", "Veille et bonnes pratiques"),
        ["misc:posts", { title: "Dernières analyses", count: 4, layout: "list" }],
        ["misc:article", { tag: "Guide", title: "Sauvegardes : la règle du 3-2-1 expliquée", meta: "8 min de lecture", paras: ["Trois copies, sur deux supports, dont une hors ligne. C'est la meilleure protection contre un chiffrement malveillant.", "Testez la restauration chaque trimestre."] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Premier échange confidentiel"), CT("Nous écrire", "Message", "Taille de l'entreprise, systèmes, besoin.", "Envoyer"), ["feat:icons", { items: [{ icon: "lock", t: "Échanges chiffrés sur demande" }, { icon: "clock", t: "Astreinte 24 h/24" }] }]] }
    ]
  },
  // 11 --------------------------------------------------------------- export
  {
    key: "cabotage-export", name: "Cabotage", category: "entreprise", tags: ["chaleureux", "classique"], siteType: "Conseil en export et développement international",
    description: "Conseil en export : ocre profond, grande image de bandeau avec voile, étapes de pays en pays, bande de références et bandeau d'appel visuel.",
    brand: "Cabotage Export",
    tokens: { colors: { primary: "#8a6d00", secondary: "#2d2408", accent: "#1f6f78", background: "#fbf8ee", surface: "#ffffff", text: "#241e0c", muted: "#5d5436" }, fonts: { heading: F + "literata", body: F + "dm-sans", button: F + "dm-sans", link: F + "dm-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "md", button: "none" } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "soft" }, art: { seed: "cabotage", motifs: ["dunes", "waves", "topo"] },
    head: ["head:center", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Marchés", "/marches"], ["Accompagnement", "/accompagnement"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Évaluer mon potentiel export", "/contact"],
    contact: { address: "15 quai de la Fosse, 44000 Nantes", phone: "02 40 00 19 47", email: "export@cabotage.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Vendre loin, sans se perdre." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Conseil en export", title: "Franchir la frontière sans perdre le fil.", sub: "Choix de marchés, partenaires locaux, réglementation, logistique : nous accompagnons les PME qui vendent à l'étranger.", cta: ["Évaluer mon potentiel export", "/contact"], cta2: ["Voir les marchés", "/marches"], image: "hero", overlay: 0.55 }],
        ["feat:numbered", { eyebrow: "Résultats", title: "Ce que nos clients retiennent", items: [{ t: "14 pays", x: "où nos clients ont ouvert un premier courant d'affaires" }, { t: "9 mois", x: "pour signer un premier distributeur" }, { t: "+38 %", x: "de chiffre d'affaires export moyen en deux ans (exemple)" }] }],
        ["gal:strip", { title: "Des marchés que nous connaissons", items: [{ t: "Allemagne" }, { t: "Émirats" }, { t: "Canada" }, { t: "Japon" }, { t: "Maroc" }] }],
        ["feat:alt", { title: "Un accompagnement pas à pas", items: [{ t: "Étude de marché ciblée", x: "Concurrence, prix, réglementation, canaux de distribution du pays visé.", link: ["Voir les marchés", "/marches"] }, { t: "Recherche de partenaires", x: "Présélection de distributeurs et organisation de rendez-vous.", link: ["Accompagnement", "/accompagnement"] }] }],
        ["proof:logos", { title: "Entreprises accompagnées (fictives)", items: ["Vignobles Estarac", "Maison Trévolo", "Atelier Brin d'Ouest", "Savonnerie Lunaire"] }],
        ["cta:image", { title: "Quel marché pour votre produit ?", sub: "Un pré-diagnostic de deux heures, offert.", cta: ["Évaluer mon potentiel export", "/contact"] }]
      ] },
      { key: "marches", name: "Marchés", blocks: [
        P("Marchés", "Fiches pays détaillées"),
        ["gal:cards", { items: [{ tag: "Europe", t: "Allemagne", x: "Marché exigeant, logistique simple, normes à valider." }, { tag: "Golfe", t: "Émirats arabes unis", x: "Importateurs exclusifs, labels halal et étiquetage arabe." }, { tag: "Amérique du Nord", t: "Canada", x: "Bilinguisme et exigences d'étiquetage à anticiper." }, { tag: "Asie", t: "Japon", x: "Relations durables, qualité irréprochable attendue." }] }],
        ["feat:compare", { rows: [["", "Allemagne", "Émirats", "Japon"], ["Délai de transport", "2 jours", "12 jours", "35 jours"], ["Droits de douane", "0 %", "5 %", "variable"], ["Traduction requise", "non", "oui", "oui"]] }]
      ] },
      { key: "accompagnement", name: "Accompagnement", blocks: [
        P("Accompagnement", "Un parcours en quatre étapes"),
        ["feat:steps", { items: [{ d: "Mois 1", t: "Diagnostic export", x: "Produit, prix, capacités et appétence de l'équipe." }, { d: "Mois 2-3", t: "Étude de marché", x: "Trois pays comparés, un pays retenu." }, { d: "Mois 4-8", t: "Prospection", x: "Partenaires, salons, premières commandes." }, { d: "Mois 9+", t: "Structuration", x: "Contrats, logistique, financement et assurance-crédit." }] }],
        ["feat:pricelist", { title: "Formules indicatives", items: [{ t: "Diagnostic export", x: "Deux jours", price: "1 800 €" }, { t: "Étude de marché pays", x: "", price: "dès 3 900 €" }, { t: "Mission de prospection", x: "Par trimestre", price: "dès 4 500 €" }] }],
        ["misc:faq", { items: [{ t: "Existe-t-il des aides ?", x: "Des assurances prospection et des chèques export régionaux existent, nous montons le dossier avec vous." }, { t: "Dois-je avoir un service export ?", x: "Non, nous pouvons jouer ce rôle au départ." }] }]
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        P("Ressources", "Notes pratiques"),
        ["misc:posts", { title: "Dernières notes", count: 3, layout: "grid" }],
        ["feat:list2", { title: "Checklist avant d'exporter", items: [{ t: "Codes douaniers du produit" }, { t: "Normes et étiquetage du pays" }, { t: "Incoterms négociés" }, { t: "Assurance-crédit" }, { t: "Moyens de paiement sécurisés" }, { t: "Marque déposée localement" }] }],
        ["cta:band", { title: "Besoin d'un avis rapide ?", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Votre projet à l'international"), CT("Parlons de vos marchés", "Décrivez votre produit", "Secteur, pays visés, volumes.", "Envoyer"), ["contact:map", { title: "Nos bureaux", mapAddress: "15 quai de la Fosse, 44000 Nantes" }]] }
    ]
  },
  // 12 --------------------------------------------------------------- architecture d'entreprise
  {
    key: "schema-orga", name: "Orthèse Conseil", category: "entreprise", tags: ["minimaliste", "geometrique"], siteType: "Cabinet d'architecture d'entreprise et d'organisation",
    description: "Architecture d'entreprise et organisation : ardoise et corail, grotesque d'ingénieur, grille de principes, schémas de processus et pages de livrables.",
    brand: "Orthèse Conseil",
    tokens: { colors: { primary: "#1e293b", secondary: "#0f172a", accent: "#e8553d", background: "#f8f9fb", surface: "#ffffff", text: "#111827", muted: "#4b5563" }, fonts: { heading: F + "archivo", body: F + "source-serif-4", button: F + "archivo", link: F + "archivo" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d4d9e1" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.02, letterSpacing: -0.025, transform: "none" } } },
    dna: { scale: "l", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "orthese", motifs: ["plates", "tiles", "mesh"] },
    head: ["head:minimal", {}], foot: ["foot:columns", { about: "Architecture d'entreprise, cartographie de processus et conception d'organisations.", cols: [["Cabinet", "Principes", "Livrables", "Équipe"], ["Échanger", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Principes", "/principes"], ["Livrables", "/livrables"], ["Cas clients", "/cas"], ["Contact", "/contact"]], cta: ["Cadrer un chantier", "/contact"],
    contact: { address: "4 rue Pasteur, 38000 Grenoble", phone: "04 76 00 83 11", email: "contact@orthese-conseil.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Dessiner l'organisation avant de la construire." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Architecture d'entreprise", title: "Une organisation lisible se pilote mieux.", sub: "Nous cartographions processus, systèmes et responsabilités pour que la stratégie se traduise dans le fonctionnement réel.", cta: ["Cadrer un chantier", "/contact"], cta2: ["Voir les livrables", "/livrables"], stats: [["60", "cartographies livrées"], ["4 semaines", "pour un état des lieux"], ["12", "architectes et analystes"]] }],
        ["feat:rows", { eyebrow: "Quatre couches", title: "Ce que nous mettons à plat", items: [{ t: "Métier", x: "Chaînes de valeur, capacités, processus clés." }, { t: "Organisation", x: "Rôles, niveaux de décision, instances." }, { t: "Données et applications", x: "Référentiels, flux, redondances." }, { t: "Technologie", x: "Plateformes, dettes, trajectoire de modernisation." }] }],
        ["gal:featured", { title: "Exemples de supports", items: [{ t: "Carte des capacités", x: "Vue unique de l'entreprise.", tag: "Métier" }, { t: "Matrice des responsabilités", x: "Qui décide quoi.", tag: "Organisation" }, { t: "Flux de données", x: "Applications et référentiels.", tag: "Données" }, { t: "Trajectoire cible", x: "Feuille de route sur trois ans.", tag: "Plan" }] }],
        ["proof:team", { items: [{ n: "Samuel Rochas", r: "Directeur, architecture d'entreprise" }, { n: "Elsa Barbier", r: "Architecte organisation" }, { n: "Karim Aït-Ali", r: "Architecte données" }] }],
        ["cta:split", { title: "Votre organisation a grandi plus vite que son plan", sub: "Un atelier de cadrage d'une demi-journée suffit souvent à poser le bon périmètre.", cta: ["Cadrer un chantier", "/contact"] }]
      ] },
      { key: "principes", name: "Principes", blocks: [
        P("Principes", "Notre manière de travailler"),
        ["feat:grid-icons", { items: [{ icon: "layers", t: "Un modèle, plusieurs vues", x: "Direction, métiers et DSI lisent le même référentiel." }, { icon: "eye", t: "Documenter le réel", x: "Nous partons de ce qui existe, pas d'un modèle idéal." }, { icon: "network", t: "Relier les décisions", x: "Chaque évolution est reliée à un objectif." }, { icon: "settings", t: "Outils légers", x: "Cartographies maintenables sans logiciel coûteux." }] }],
        ["misc:text", { title: "Ni jargon, ni rapport de 300 pages", paras: ["Nos livrables tiennent sur des supports que l'on peut afficher en comité : une page, un schéma, une décision attendue."] }],
        ["proof:statsbar", { items: [["1 page", "par processus cartographié"], ["3 niveaux", "de lecture maximum"], ["100 %", "des modèles remis en format ouvert"]] }]
      ] },
      { key: "livrables", name: "Livrables", blocks: [
        P("Livrables", "Ce que vous recevez"),
        ["feat:list2", { items: [{ t: "Cartographie des processus" }, { t: "Carte des capacités métier" }, { t: "Matrice des rôles et décisions" }, { t: "Plan d'urbanisation des applications" }, { t: "Trajectoire cible sur trois ans" }, { t: "Guide de gouvernance des évolutions" }] }],
        ["price:tiers", { items: [{ t: "État des lieux", price: "9 800 €", period: "forfait", f: ["Quatre semaines", "Cartographie du périmètre"], cta: ["Demander", "/contact"] }, { t: "Architecture cible", price: "24 000 €", period: "forfait", f: ["Dix semaines", "Trajectoire et gouvernance"], cta: ["Demander", "/contact"], hl: true }] }],
        ["misc:faq", { items: [{ t: "Intervenez-vous sur des outils précis ?", x: "Nous restons indépendants de tout éditeur." }, { t: "Faut-il impliquer la DSI ?", x: "Oui, mais aussi les métiers, dès la première semaine." }] }]
      ] },
      { key: "cas", name: "Cas clients", blocks: [
        P("Cas clients", "Exemples anonymisés"),
        ["gal:cards", { items: [{ tag: "Santé", t: "Un groupe de cliniques", x: "Cartographie de quatorze processus de prise en charge." }, { tag: "Industrie", t: "Un équipementier", x: "Rationalisation de 120 applications en deux ans." }, { tag: "Services", t: "Un réseau d'agences", x: "Clarification des rôles entre siège et sites." }] }],
        ["proof:big", { items: [Q("Pour la première fois, nos métiers et notre DSI regardaient la même carte.", "Isabelle F.", "directrice des opérations, cliente fictive")] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Cadrage de chantier"), CT("Échangeons", "Votre contexte", "Taille de l'organisation et question posée.", "Envoyer"), ["feat:icons", { items: [{ icon: "calendarClock", t: "Atelier de cadrage en demi-journée" }] }]] }
    ]
  },
  // 13 --------------------------------------------------------------- bureau d'études
  {
    key: "ingeniar-be", name: "Ingeniar", category: "entreprise", tags: ["technique", "moderne"], siteType: "Bureau d'études techniques",
    description: "Bureau d'études techniques : bleu ingénieur, bandeau avec portrait à gauche, bandeau d'infos, listes de compétences et chiffres de réalisations.",
    brand: "Ingeniar Études",
    tokens: { colors: { primary: "#0369a1", secondary: "#082f49", accent: "#f59e0b", background: "#f5faff", surface: "#ffffff", text: "#0b1c2c", muted: "#475a6c" }, fonts: { heading: F + "sora", body: F + "barlow", button: F + "sora", link: F + "barlow" }, radius: { sm: 3, md: 6, lg: 10, button: 5, field: 5, card: 8 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "ingeniar", motifs: ["topo", "mesh", "rays"] },
    head: ["head:topbar", { info: "Études de structure, fluides et VRD · devis sous 5 jours", note: "Lundi – vendredi, 8 h – 18 h" }], foot: ["foot:columns", { about: "Bureau d'études pluridisciplinaire : structure, fluides, voirie et réseaux.", cols: [["Études", "Structure", "Fluides", "VRD"], ["Société", "Références", "Contact", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Disciplines", "/disciplines"], ["Références", "/references"], ["Méthode", "/methode"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "88 allée des Ingénieurs, 69100 Villeurbanne", phone: "04 78 00 36 52", email: "etudes@ingeniar.example", hours: "Lundi – vendredi, 8 h – 18 h", tagline: "Des calculs justes pour des ouvrages durables." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Bureau d'études techniques", title: "Concevoir juste, chiffrer juste, livrer à temps.", sub: "Structure, fluides, voirie et réseaux divers : des ingénieurs au service des architectes, promoteurs et collectivités.", cta: ["Demander un devis", "/contact"], cta2: ["Nos références", "/references"], image: "portrait-1" }],
        ["feat:checks", { title: "Ce que nous prenons en charge", cta: ["Voir les disciplines", "/disciplines"], items: [{ t: "Dimensionnement de structures béton et acier" }, { t: "Calcul thermique et étude réglementaire" }, { t: "Plomberie, chauffage et ventilation" }, { t: "Voirie, assainissement et réseaux" }, { t: "Économie de la construction" }] }],
        ["feat:tabs", { eyebrow: "Disciplines", title: "Quatre pôles complémentaires", items: [{ t: "Structure", x: "Fondations, planchers, charpentes, calculs sismiques." }, { t: "Fluides", x: "CVC, plomberie, électricité, énergies renouvelables." }, { t: "VRD", x: "Terrassements, eaux pluviales, voiries de lotissement." }, { t: "Économie", x: "Estimation, dossier de consultation, suivi financier." }] }],
        ["proof:statsbar", { items: [["380", "ouvrages étudiés"], ["22", "ingénieurs et techniciens"], ["5 jours", "pour un devis chiffré"]] }],
        ["gal:grid", { items: [{ t: "Groupe scolaire de 14 classes", x: "Structure bois et fluides." }, { t: "Lotissement de 48 lots", x: "VRD et bassin de rétention." }, { t: "Halle logistique", x: "Charpente métallique." }, { t: "Résidence de 60 logements", x: "Thermique RE2020." }] }],
        ["cta:band", { title: "Un projet à étudier ?", sub: "Envoyez-nous votre dossier, nous revenons vers vous sous cinq jours.", cta: ["Demander un devis", "/contact"] }]
      ] },
      { key: "disciplines", name: "Disciplines", blocks: [
        P("Disciplines", "Une équipe, plusieurs métiers"),
        ["feat:icons", { items: [{ icon: "layers", t: "Structure", x: "Béton armé, acier, bois, fondations spéciales." }, { icon: "zap", t: "Fluides et énergie", x: "CVC, électricité, photovoltaïque, thermique." }, { icon: "mapPin", t: "VRD", x: "Voiries, réseaux, gestion des eaux pluviales." }, { icon: "calculator", t: "Économie", x: "Estimations, DCE, suivi de chantier." }] }],
        ["feat:pricelist", { title: "Honoraires indicatifs", items: [{ t: "Étude structure, maison individuelle", x: "", price: "dès 1 400 €" }, { t: "Étude thermique réglementaire", x: "", price: "dès 650 €" }, { t: "Mission VRD, petit lotissement", x: "", price: "dès 6 200 €" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Intervenez-vous avant le permis de construire ?", x: "Oui, dès l'esquisse pour sécuriser les choix techniques." }, { t: "Faites-vous le suivi de chantier ?", x: "Oui, en mission complète ou ponctuelle." }] }]
      ] },
      { key: "references", name: "Références", blocks: [
        P("Références", "Exemples de réalisations"),
        ["gal:masonry", { items: [{ t: "Groupe scolaire" }, { t: "Lotissement" }, { t: "Halle logistique" }, { t: "Résidence" }, { t: "Pont piéton" }] }],
        ["proof:quotes", { items: [Q("Des notes de calcul claires et un interlocuteur joignable.", "Bastien M.", "architecte, client fictif"), Q("Les plans de réservation sont arrivés avant le démarrage du chantier.", "Aline D.", "conductrice de travaux, cliente fictive")] }],
        ["proof:stats", { items: [["380", "ouvrages"], ["14", "ans d'existence"], ["96 %", "de dossiers livrés dans les délais (exemple)"]] }]
      ] },
      { key: "methode", name: "Méthode", blocks: [
        P("Méthode", "Du cahier des charges au chantier"),
        ["feat:steps", { items: [{ d: "1", t: "Analyse du dossier", x: "Programme, contraintes du site, réglementation." }, { d: "2", t: "Conception", x: "Pré-dimensionnement, variantes et chiffrage." }, { d: "3", t: "Plans d'exécution", x: "Notes de calcul, plans de ferraillage, carnets de détails." }, { d: "4", t: "Suivi", x: "Visas, réunions de chantier, réception." }] }],
        ["misc:text", { title: "Qualité et traçabilité", paras: ["Chaque note de calcul est relue par un second ingénieur avant diffusion.", "Les versions sont archivées et accessibles au client pendant dix ans."] }],
        ["cta:card", { title: "Un doute sur un ouvrage existant ?", cta: ["Nous consulter", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Demande de devis"), CT("Venez nous voir", "Parlez-nous de votre projet", "Nature de l'ouvrage, surface, localisation, calendrier.", "Envoyer"), ["contact:map", { title: "Accès", mapAddress: "88 allée des Ingénieurs, 69100 Villeurbanne" }]] }
    ]
  }
];
