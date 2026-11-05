// Finance v2 (14 thèmes). Textes de DÉMONSTRATION : cabinets, banques, personnes, tarifs et coordonnées fictifs.
// Aucune promesse de rendement : tout investissement comporte un risque de perte en capital.
module.exports = [
  // 1. Expertise comptable
  {
    key: "equerre-compta", name: "Équerre", category: "finance", tags: ["classique", "chaleureux"], siteType: "Cabinet d'expertise comptable pour artisans", featured: true,
    description: "Cabinet comptable de proximité : vert pré et papier crème, titres Literata, bandeau portrait à gauche, forfaits en liste et rendez-vous sans jargon.",
    brand: "Cabinet Équerre",
    tokens: { colors: { primary: "#23703f", secondary: "#14281b", accent: "#c07a12", background: "#f6f4ec", surface: "#ffffff", text: "#18261d", muted: "#505e55" }, fonts: { heading: "font.literata", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "equerre", motifs: ["tiles", "botanical", "plates"] },
    head: ["head:topbar", { info: "Cabinet d'expertise comptable · Lille", note: "Rendez-vous le samedi matin en période de bilan" }],
    foot: ["foot:columns", { about: "Comptabilité, paie et conseil pour les artisans du bâtiment, de l'alimentaire et des métiers d'art.", cols: [["Cabinet", "Missions", "Tarifs", "Équipe"], ["Pratique", "Documents à fournir", "Prendre rendez-vous", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Missions", "/missions"], ["Tarifs", "/tarifs"], ["Équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "42 rue des Tanneurs, 59800 Lille", phone: "03 20 00 41 52", email: "accueil@equerre-compta.example", hours: "Lundi – vendredi, 8 h 30 – 18 h ; samedi matin en mars et avril", tagline: "Des comptes à l'équerre, pour des artisans qui tiennent leur cap." },
    social: ["linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Expertise comptable à Lille", title: "Votre atelier tourne, vos comptes suivent.", sub: "Nous tenons la comptabilité des artisans et petits commerçants, vous expliquons vos chiffres simplement et gérons les échéances à votre place.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
        ["feat:icons", { eyebrow: "Missions", title: "Ce que nous faisons pour vous", items: [{ icon: "calculator", t: "Comptabilité et TVA", x: "Saisie, rapprochement bancaire, déclarations à la bonne date." }, { icon: "users", t: "Paie des apprentis et salariés", x: "Bulletins, contrats, déclarations sociales." }, { icon: "fileText", t: "Devis et facturation", x: "Modèles conformes et relances clients cadrées." }, { icon: "briefcase", t: "Aides et statuts", x: "Choix du statut, aides à l'embauche, transmission." }] }],
        ["proof:statsbar", { items: [["32 ans", "de présence dans le Nord"], ["380", "dossiers suivis (exemple)"], ["1", "interlocuteur dédié par dossier"]] }],
        ["feat:pricelist", { eyebrow: "Forfaits", title: "Des honoraires annoncés avant de signer", bg: "token:surface", items: [{ t: "Micro-entrepreneur", x: "Déclarations et conseils de statut", price: "dès 49 €/mois" }, { t: "Artisan en société", x: "Comptabilité, bilan, TVA", price: "dès 175 €/mois" }, { t: "Avec salariés", x: "Ajout de la paie, par bulletin", price: "dès 22 €/bulletin" }] }],
        ["proof:quotes", { title: "Ils nous font confiance", items: [{ q: "Mon bilan arrive à l'heure, et on me l'explique.", n: "Gaëtan M.", r: "Menuisier, client fictif" }, { q: "Fini les week-ends passés sur les factures.", n: "Nadia B.", r: "Boulangère, cliente fictive" }, { q: "Réponse le jour même à chaque question.", n: "Olivier P.", r: "Carreleur, client fictif" }] }],
        ["cta:band", { title: "Trente minutes pour faire le point, offertes.", sub: "Sans engagement, en cabinet ou par téléphone.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "missions", name: "Missions", blocks: [
        ["misc:pagehead", { title: "Nos missions", sub: "De la première facture à la transmission de l'entreprise." }],
        ["feat:tabs", { title: "Choisissez votre sujet", items: [{ t: "Comptabilité", x: "Saisie des pièces, journal de banque, suivi des encours clients, bilan et liasse fiscale." }, { t: "Paie", x: "Un bulletin par salarié, DSN mensuelle, soldes de tout compte et gestion des absences." }, { t: "Fiscalité", x: "TVA, impôt sur les sociétés ou revenus, crédits d'impôt accessibles à votre activité." }, { t: "Création", x: "Statut, capital, prévisionnel pour la banque, immatriculation." }] }],
        ["feat:checks", { title: "Pour débuter, préparez", intro: "Une heure suffit pour ouvrir votre dossier.", cta: ["Prendre rendez-vous", "/contact"], items: [{ t: "Les relevés bancaires de l'exercice", x: "" }, { t: "Les factures d'achat et de vente", x: "" }, { t: "Le dernier bilan, s'il existe", x: "" }, { t: "Vos identifiants d'impôts en ligne", x: "" }] }],
        ["cta:split", { title: "Un contrôle fiscal ou une reprise en vue ?", sub: "Nous vous accompagnons sur les dossiers ponctuels.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Exemples d'honoraires, devis personnalisé sur demande." }],
        ["price:tiers", { items: [{ t: "Essentiel", price: "49 €", period: "/mois", x: "Pour démarrer seul.", f: ["Déclarations de micro-entreprise", "Un point trimestriel", "Support par courriel"], cta: ["Choisir", "/contact"] }, { t: "Atelier", price: "175 €", period: "/mois", x: "Pour une société.", f: ["Comptabilité complète", "Bilan et liasse", "Tableau de bord", "Appel mensuel"], hl: true, cta: ["Choisir", "/contact"] }, { t: "Équipe", price: "sur devis", x: "Avec plusieurs salariés.", f: ["Tout Atelier", "Paie incluse", "Conseil social"], cta: ["Demander un devis", "/contact"] }] }],
        ["feat:accordion", { title: "Questions sur les honoraires", items: [{ t: "Y a-t-il des frais à l'ouverture du dossier ?", x: "Une reprise de dossier est facturée selon le temps nécessaire, annoncée dans le devis." }, { t: "Puis-je arrêter en cours d'année ?", x: "Oui, avec un préavis de deux mois, et nous transmettons votre dossier à votre nouvel interlocuteur." }, { t: "Les tarifs incluent-ils la TVA ?", x: "Non, les montants affichés sont hors taxes." }] }],
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        ["misc:pagehead", { title: "L'équipe" }],
        ["misc:story", { eyebrow: "Le cabinet", title: "Une équipe qui connaît vos métiers", paras: ["Le cabinet est né dans l'arrière-boutique d'un ancien atelier de reliure. Nous en avons gardé le goût du travail bien fait.", "Les profils ci-dessous sont fictifs, à remplacer par ceux de votre équipe."], image: "portrait-1" }],
        ["proof:team", { items: [{ n: "Élodie Marchetti", r: "Experte-comptable associée" }, { n: "Thibault Wallez", r: "Expert-comptable associé" }, { n: "Samia Derouiche", r: "Responsable paie" }, { n: "Paul Hennebert", r: "Chargé de dossiers" }] }],
        ["feat:numbered", { title: "Nos engagements", items: [{ t: "Réponse sous 24 h", x: "Un vrai interlocuteur, pas un serveur vocal." }, { t: "Honoraires écrits", x: "Aucun supplément surprise." }, { t: "Pédagogie", x: "Un point annuel pour lire vos comptes ensemble." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Nous vous répondons sous 24 heures ouvrées." }],
        ["contact:map", { title: "Au cœur du Vieux-Lille", mapAddress: "42 rue des Tanneurs, 59800 Lille" }],
        ["misc:hours", { title: "Horaires d'accueil", rows: [["Lundi – vendredi", "8 h 30 – 18 h"], ["Samedi (mars – avril)", "9 h – 12 h"], ["Dimanche", "Fermé"]] }],
      ] },
    ],
  },

  // 2. Gestion de patrimoine
  {
    key: "sillage-patrimoine", name: "Sillage", category: "finance", tags: ["luxe", "editorial"], siteType: "Cabinet de gestion de patrimoine indépendant",
    description: "Conseil patrimonial sobre et éditorial : bordeaux profond, laiton et crème, Cormorant en grand format, bandeau de presse, alternance image / texte et mentions de prudence claires.",
    brand: "Sillage Patrimoine",
    tokens: { colors: { primary: "#6b1d3a", secondary: "#241419", accent: "#a67c2e", background: "#faf6f0", surface: "#ffffff", text: "#241a1d", muted: "#5d5156" }, fonts: { heading: "font.cormorant-garamond", body: "font.instrument-sans", button: "font.instrument-sans", link: "font.instrument-sans" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.02, letterSpacing: -0.01 }, h2: { size: 42, weight: 500, lineHeight: 1.1 } }, border: { width: 1, color: "#e4d8c8" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "sillage", motifs: ["waves", "topo", "arches"] },
    head: ["head:masthead", { dateline: "Bordeaux · Conseil indépendant depuis 2009" }],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Démarche", "/demarche"], ["Domaines", "/domaines"], ["Lettres", "/lettres"], ["Contact", "/contact"]], cta: ["Un premier entretien", "/contact"],
    contact: { address: "12 cours de l'Intendance, 33000 Bordeaux", phone: "05 56 00 31 87", email: "entretien@sillage-patrimoine.example", hours: "Sur rendez-vous, du lundi au vendredi, 9 h – 18 h", tagline: "Un patrimoine qui trace sa route dans la durée." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { eyebrow: "Gestion de patrimoine", kicker: "Entretien confidentiel · Honoraires convenus", title: "Tracer un sillage, génération après génération.", sub: "Nous accompagnons familles et dirigeants dans l'organisation, la protection et la transmission de leur patrimoine, sans produit imposé.", cta: ["Un premier entretien", "/contact"], image: "wide" }],
        ["feat:alt", { eyebrow: "Domaines", title: "Trois chantiers, une vision d'ensemble", items: [{ t: "Organiser", x: "Cartographie de vos biens, arbitrage entre liquidités, immobilier et titres selon votre horizon.", link: ["Notre démarche", "/demarche"] }, { t: "Transmettre", x: "Donations, démembrement, pacte familial : préparer la suite sereinement." }, { t: "Protéger", x: "Prévoyance, couverture du conjoint, régime matrimonial." }] }],
        ["misc:quote", { text: "Le bon conseil consiste d'abord à comprendre ce que vous voulez protéger.", by: "Principe de la maison, citation fictive" }],
        ["feat:steps", { eyebrow: "Démarche", title: "Cinq étapes, sans précipitation", bg: "token:surface", items: [{ t: "Écoute", d: "Entretien 1", x: "Votre histoire, vos projets, vos contraintes." }, { t: "Bilan", d: "Semaines 1-3", x: "Inventaire complet et analyse fiscale." }, { t: "Scénarios", d: "Semaine 5", x: "Options comparées, avec avantages, coûts et risques." }, { t: "Mise en œuvre", d: "Mois 2", x: "Coordination notaire, avocat, banque." }, { t: "Revue", d: "Chaque année", x: "Ajustements selon votre vie." }] }],
        ["feat:accordion", { title: "Avant de nous rencontrer", items: [{ t: "Comment êtes-vous rémunérés ?", x: "Par des honoraires convenus à l'avance. Tout investissement comporte un risque de perte en capital ; nous ne promettons aucun rendement." }, { t: "Faut-il un patrimoine minimal ?", x: "Nous étudions chaque situation lors d'un premier échange, sans engagement." }] }],
        ["cta:card", { title: "Commençons par une conversation.", sub: "Une heure, en toute confidentialité.", cta: ["Un premier entretien", "/contact"] }],
      ] },
      { key: "demarche", name: "Démarche", blocks: [
        ["misc:pagehead", { title: "Notre démarche", sub: "Indépendance, pédagogie et suivi dans la durée." }],
        ["misc:text", { eyebrow: "Principes", title: "Aucun produit n'est notre point de départ", paras: ["Nous ne sommes liés à aucune banque ni société de gestion. Nos recommandations partent de votre situation, pas d'un catalogue.", "Chaque scénario est présenté avec ses coûts, ses risques et ses alternatives, y compris celle de ne rien faire."] }],
        ["feat:numbered", { title: "Ce que vous pouvez attendre", items: [{ t: "Clarté", x: "Des documents écrits, sans jargon." }, { t: "Indépendance", x: "Aucune commission cachée." }, { t: "Confidentialité", x: "Un cadre strict pour vos données." }] }],
        ["feat:rows", { title: "Pour qui ?", items: [{ t: "Familles", x: "Préparer une succession, protéger un conjoint, aider ses enfants." }, { t: "Dirigeants", x: "Rémunération, holding, anticipation de la cession." }, { t: "Professions libérales", x: "Retraite, prévoyance, constitution d'un patrimoine hors activité." }] }],
      ] },
      { key: "domaines", name: "Domaines", blocks: [
        ["misc:pagehead", { title: "Domaines d'intervention" }],
        ["feat:bento", { title: "Une expertise transversale", items: [{ icon: "layers", t: "Allocation d'actifs", x: "Répartition selon votre horizon et votre tolérance au risque, revue chaque année. Les performances passées ne préjugent pas des performances futures." }, { icon: "home", t: "Immobilier", x: "Résidence, locatif, SCI." }, { icon: "shield", t: "Protection", x: "Prévoyance et assurances." }] }],
        ["proof:stats", { items: [["15 ans", "de conseil indépendant"], ["0", "commission cachée"], ["6", "conseillers"]] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Travaillez-vous avec mon notaire ?", x: "Oui, nous coordonnons les professionnels déjà en place." }, { t: "Puis-je suivre mon patrimoine en ligne ?", x: "Nous remettons une synthèse annuelle commentée lors d'un rendez-vous." }] }],
      ] },
      { key: "lettres", name: "Lettres", blocks: [
        ["misc:pagehead", { title: "Lettres du cabinet", sub: "Analyses et pédagogie patrimoniale." }],
        ["misc:posts", { title: "Dernières lettres", count: 6, layout: "list" }],
        ["misc:text", { eyebrow: "Avertissement", title: "Information importante", paras: ["Les contenus de ce site sont fournis à titre d'information générale et ne constituent pas un conseil personnalisé. Tout investissement comporte un risque de perte en capital."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Un échange confidentiel avec un conseiller." }],
        ["contact:info", { title: "Prenons rendez-vous", formTitle: "Votre demande", formIntro: "Indiquez le sujet qui vous préoccupe ; un conseiller vous rappelle.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Lundi – vendredi", "9 h – 18 h, sur rendez-vous"], ["Visioconférence", "Possible le soir"]] }],
      ] },
    ],
  },

  // 3. Conseil en investissement, sombre
  {
    key: "boussole-invest", name: "Boussole", category: "finance", tags: ["sombre", "technique"], siteType: "Conseil en investissement financier",
    description: "Conseil en investissement au ton sérieux : fond nuit vert, menthe vive, titres Sora, bandeau centré avec chiffres de méthode, comparatif d'approches et avertissement sur le risque en évidence.",
    brand: "Boussole Conseil",
    tokens: { colors: { primary: "#34d399", secondary: "#0e2a21", accent: "#f2c35b", background: "#0a1511", surface: "#11231c", text: "#e8f4ee", muted: "#9bb8aa" }, fonts: { heading: "font.sora", body: "font.lora", button: "font.sora", link: "font.lora" }, radius: { sm: 6, md: 10, lg: 14, button: 10, field: 10, card: 14 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 50, weight: 600, lineHeight: 1.1, letterSpacing: -0.02 } }, border: { width: 1, color: "#1f3a2f" } },
    dna: { scale: "m", pad: "normal", align: "center", shape: "soft" }, art: { seed: "boussole", motifs: ["mesh", "rays", "topo"] },
    head: ["head:dark", {}],
    foot: ["foot:newsletter", { title: "La lettre de la Boussole", sub: "Un point mensuel sur les marchés et notre méthode. Aucune recommandation personnalisée.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Méthode", "/methode"], ["Offres", "/offres"], ["Analyses", "/analyses"], ["Contact", "/contact"]], cta: ["Échanger avec un conseiller", "/contact"],
    contact: { address: "5 rue Racine, 44000 Nantes", phone: "02 40 00 66 19", email: "conseil@boussole-invest.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Investir avec méthode, en connaissance du risque." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Conseil en investissement", title: "Investir avec méthode, pas avec des promesses.", sub: "Nous vous aidons à définir votre profil de risque, à bâtir une allocation lisible et à la suivre dans le temps.", cta: ["Échanger avec un conseiller", "/contact"], cta2: ["Notre méthode", "/methode"], stats: [["4", "étapes de méthode"], ["100 %", "honoraires transparents"], ["0", "rendement garanti"]] }],
        ["feat:compare", { title: "Deux façons de travailler avec nous", rows: [["", "Bilan ponctuel", "Suivi annuel"], ["Profil de risque", "oui", "oui"], ["Allocation proposée", "oui", "oui"], ["Revue annuelle", "non", "oui"], ["Honoraires", "forfait", "abonnement"]] }],
        ["feat:grid-icons", { title: "Ce qui guide nos conseils", items: [{ icon: "shield", t: "Profil de risque", x: "Votre capacité à subir une perte, avant tout." }, { icon: "layers", t: "Diversification", x: "Ne pas dépendre d'un seul marché." }, { icon: "clock", t: "Horizon", x: "Un projet à 3 ans n'a pas la même allocation qu'à 15 ans." }, { icon: "coin", t: "Frais", x: "Détaillés par écrit avant toute décision." }] }],
        ["misc:quote", { text: "Les marchés peuvent baisser : un bon conseil commence par vous le dire.", by: "Boussole Conseil, principe d'information" }],
        ["proof:quotes", { title: "Retours de clients", items: [{ q: "On m'a d'abord posé des questions sur ma tolérance à la baisse.", n: "Claire V.", r: "cliente fictive" }, { q: "Les frais étaient listés ligne par ligne.", n: "Mathieu R.", r: "client fictif" }, { q: "Un rendez-vous par an, très concret.", n: "Inès G.", r: "cliente fictive" }] }],
        ["cta:card", { title: "Parlons de votre projet.", sub: "Entretien de découverte, sans engagement. Capital non garanti.", cta: ["Échanger avec un conseiller", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ["misc:pagehead", { title: "Notre méthode", sub: "Quatre étapes documentées, reprises dans un rapport remis par écrit." }],
        ["feat:steps", { title: "Du questionnaire au suivi", items: [{ t: "Découverte", d: "Étape 1", x: "Objectifs, situation et expérience des marchés." }, { t: "Profil", d: "Étape 2", x: "Questionnaire de risque et simulation de pertes possibles." }, { t: "Allocation", d: "Étape 3", x: "Proposition motivée, frais et risques détaillés." }, { t: "Suivi", d: "Chaque année", x: "Revue des écarts et ajustements." }] }],
        ["feat:list2", { title: "Ce que nous nous interdisons", items: [{ t: "Promettre un rendement" }, { t: "Pousser un produit maison" }, { t: "Cacher une commission" }, { t: "Presser une décision" }] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ["misc:pagehead", { title: "Offres et honoraires" }],
        ["price:tiers", { items: [{ t: "Bilan", price: "690 €", period: "forfait", x: "Pour y voir clair.", f: ["Profil de risque", "Rapport écrit", "Un entretien de restitution"], cta: ["Demander", "/contact"] }, { t: "Suivi", price: "95 €", period: "/mois", x: "Pour un pilotage régulier.", f: ["Tout le bilan", "Revue annuelle", "Appel à la demande"], hl: true, cta: ["Demander", "/contact"] }, { t: "Dirigeant", price: "sur devis", x: "Situation complexe.", f: ["Suivi complet", "Coordination des conseils"], cta: ["Nous écrire", "/contact"] }] }],
        ["misc:text", { eyebrow: "Risque", title: "À savoir avant d'investir", paras: ["Tout investissement comporte un risque de perte en capital. Les performances passées ne préjugent pas des performances futures. Les montants ci-dessus sont des exemples de démonstration."] }],
      ] },
      { key: "analyses", name: "Analyses", blocks: [
        ["misc:pagehead", { title: "Analyses", sub: "Pédagogie financière, sans recommandation individuelle." }],
        ["misc:posts", { title: "Dernières publications", count: 6, layout: "grid" }],
        ["feat:accordion", { title: "Vocabulaire", items: [{ t: "Qu'est-ce que la volatilité ?", x: "L'ampleur des variations d'un actif dans le temps. Plus elle est élevée, plus le risque de perte à court terme l'est aussi." }, { t: "Qu'est-ce qu'un horizon de placement ?", x: "La durée pendant laquelle vous pouvez vous passer de ces fonds." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Parlez-nous de votre projet", formIntro: "Un conseiller vous rappelle sous deux jours ouvrés.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Rendez-vous en visio", "Sur demande"]] }],
      ] },
    ],
  },

  // 4. Courtier en crédit
  {
    key: "passerelle-credit", name: "Passerelle", category: "finance", tags: ["chaleureux", "moderne"], siteType: "Courtier en crédit immobilier et professionnel",
    description: "Courtage de crédits accessible : orange brûlé et ivoire, titres Outfit, bandeau dégradé avec repères chiffrés, étapes du dossier, comparatif de situations et mentions légales sur les prêts.",
    brand: "Passerelle Courtage",
    tokens: { colors: { primary: "#b45309", secondary: "#3b1d08", accent: "#0f766e", background: "#fbf5ec", surface: "#ffffff", text: "#2a1d12", muted: "#665544" }, fonts: { heading: "font.outfit", body: "font.merriweather", button: "font.outfit", link: "font.merriweather" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.06, letterSpacing: -0.025 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "passerelle", motifs: ["blobs", "arches", "skyline"] },
    head: ["head:float", {}],
    foot: ["foot:big", { title: "Passerelle" }],
    menu: [["Accueil", "/"], ["Projets", "/projets"], ["Étapes", "/etapes"], ["Conseils", "/conseils"], ["Contact", "/contact"]], cta: ["Étudier mon projet", "/contact"],
    contact: { address: "27 allée de la République, 13001 Marseille", phone: "04 91 00 52 70", email: "dossier@passerelle-credit.example", hours: "Lundi – vendredi, 9 h – 19 h ; samedi, 10 h – 13 h", tagline: "Un interlocuteur, plusieurs banques, un dossier monté avec vous." },
    social: ["facebook", "instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Courtier en crédit à Marseille", title: "Votre projet mérite plusieurs avis bancaires.", sub: "Nous préparons votre dossier, le présentons à des établissements adaptés et négocions les conditions avec vous.", cta: ["Étudier mon projet", "/contact"], cta2: ["Les étapes", "/etapes"], angle: 135, stats: [["+40", "banques partenaires (exemple)"], ["7 j", "délai moyen d'étude (exemple)"], ["0 €", "frais avant accord"]] }],
        ["feat:bento", { eyebrow: "Projets", title: "Pour quels prêts ?", items: [{ icon: "home", t: "Résidence principale", x: "Primo-accédants, secundo-accédants, prêt à taux zéro et aides locales selon éligibilité." }, { icon: "briefcase", t: "Professionnel", x: "Rachat de fonds, matériel, véhicules utilitaires." }, { icon: "sliders", t: "Renégociation", x: "Nous vérifions si un rachat est pertinent." }] }],
        ["feat:rows", { title: "Pourquoi passer par un courtier", bg: "token:surface", items: [{ t: "Un dossier complet", x: "Pièces classées, budget justifié, présenté dans le bon ordre." }, { t: "Plusieurs interlocuteurs", x: "Nous sollicitons les établissements qui financent votre profil." }, { t: "Un conseil sur l'assurance", x: "Délégation possible pour comparer les garanties." }] }],
        ["proof:big", { items: [{ q: "On m'a expliqué chaque ligne de l'offre avant que je signe.", n: "Julie A.", r: "cliente fictive" }] }],
        ["feat:accordion", { title: "Ce qu'il faut savoir", items: [{ t: "Combien coûte le courtier ?", x: "Des honoraires annoncés par écrit avant l'étude, parfois complétés par une commission bancaire." }, { t: "Un prêt est-il garanti ?", x: "Non, l'accord dépend de la banque. Vous disposez d'un délai de réflexion avant de vous engager." }] }],
        ["cta:band", { title: "Un crédit vous engage et doit être remboursé.", sub: "Vérifiez vos capacités de remboursement avant de vous engager.", cta: ["Étudier mon projet", "/contact"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ["misc:pagehead", { title: "Vos projets de financement" }],
        ["misc:story", { eyebrow: "À propos", title: "Un courtier de proximité", paras: ["Nous comparons les offres de plusieurs banques et montons le dossier avec vous."], image: "portrait-1" }],
        ["feat:cards", { title: "Solutions étudiées", items: [{ icon: "home", t: "Achat immobilier", x: "Résidence principale, locatif, terrain à bâtir." }, { icon: "briefcase", t: "Reprise d'activité", x: "Fonds de commerce, parts sociales." }, { icon: "settings", t: "Équipement", x: "Machines, véhicules, aménagements." }, { icon: "sliders", t: "Regroupement", x: "Étude au cas par cas." }] }],
        ["feat:compare", { title: "Selon votre situation", rows: [["", "Salarié en CDI", "Indépendant"], ["Pièces demandées", "3 bulletins", "3 bilans"], ["Délai d'étude", "très variable", "plus long"], ["Apport conseillé", "selon la banque", "selon la banque"]] }],
        ["cta:split", { title: "Besoin d'un avis rapide ?", sub: "Un premier échange téléphonique de 20 minutes.", cta: ["Être rappelé", "/contact"] }],
      ] },
      { key: "etapes", name: "Étapes", blocks: [
        ["misc:pagehead", { title: "Les étapes du dossier" }],
        ["feat:steps", { title: "De l'appel à la signature", items: [{ t: "Premier échange", d: "Jour 1", x: "Votre projet, votre budget, vos contraintes." }, { t: "Montage", d: "Jours 2-5", x: "Pièces, simulations, stratégie de présentation." }, { t: "Présentation", d: "Semaine 2", x: "Dépôt auprès des banques ciblées." }, { t: "Offres", d: "Semaines 3-4", x: "Comparaison, négociation, choix." }, { t: "Signature", d: "Délai légal", x: "Accompagnement jusqu'à l'acte." }] }],
        ["feat:checks", { title: "Documents habituels", cta: ["Envoyer mes pièces", "/contact"], items: [{ t: "Pièce d'identité et justificatif de domicile", x: "" }, { t: "Derniers avis d'imposition", x: "" }, { t: "Relevés bancaires récents", x: "" }, { t: "Compromis ou devis du projet", x: "" }] }],
      ] },
      { key: "conseils", name: "Conseils", blocks: [
        ["misc:pagehead", { title: "Conseils et guides" }],
        ["misc:posts", { title: "Guides pratiques", count: 6, layout: "grid" }],
        ["misc:text", { eyebrow: "Mention légale", title: "Avant de vous engager", paras: ["Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager. Les chiffres de ce site sont des exemples de démonstration."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Racontez-nous votre projet." }],
        ["contact:info", { title: "Être rappelé", formTitle: "Votre projet", formIntro: "Montant, durée envisagée, situation : quelques lignes suffisent.", cta: ["Envoyer", "/contact"] }],
        ["cta:band", { title: "Un dossier à monter ?", sub: "Écrivez-nous : nous revenons vers vous sous deux jours ouvrés.", cta: ["Écrire au cabinet", "/contact"] }],
      ] },
    ],
  },

  // 5. Conseil fiscal
  {
    key: "lanterne-fiscale", name: "Lanterne", category: "finance", tags: ["moderne", "minimaliste"], siteType: "Cabinet de conseil fiscal pour particuliers",
    description: "Conseil fiscal clair et lumineux : bleu pétrole sur blanc glacé, titres IBM Plex Serif, bandeau empilé avec grande image, cartes de situations, calendrier fiscal et FAQ.",
    brand: "Lanterne Fiscalité",
    tokens: { colors: { primary: "#0e7490", secondary: "#0b2c36", accent: "#d97706", background: "#f3f9fb", surface: "#ffffff", text: "#12252c", muted: "#4b616a" }, fonts: { heading: "font.ibm-plex-serif", body: "font.barlow", button: "font.barlow", link: "font.barlow" }, radius: { sm: 4, md: 6, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 600, lineHeight: 1.12, letterSpacing: -0.01 } }, border: { width: 1, color: "#d3e4ea" } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "lanterne", motifs: ["rays", "plates", "halftone"] },
    head: ["head:side", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Situations", "/situations"], ["Calendrier", "/calendrier"], ["Honoraires", "/honoraires"], ["Contact", "/contact"]], cta: ["Poser ma question", "/contact"],
    contact: { address: "3 rue de la Monnaie, 35000 Rennes", phone: "02 99 00 28 63", email: "fiscalite@lanterne-fiscale.example", hours: "Lundi – vendredi, 9 h – 17 h 30", tagline: "Éclairer vos choix fiscaux, dans le respect de la loi." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Conseil fiscal à Rennes", title: "Comprendre votre fiscalité pour mieux décider.", sub: "Déclaration de revenus, investissement locatif, donation, expatriation : nous clarifions les règles qui s'appliquent à votre situation.", cta: ["Poser ma question", "/contact"], stats: [["12", "ans de pratique"], ["5", "avocats et juristes fiscalistes"], ["48 h", "délai de première réponse"]] }],
        ["feat:cards", { eyebrow: "Situations", title: "Les sujets que nous traitons le plus", items: [{ icon: "home", t: "Revenus locatifs", x: "Régime micro ou réel, déficit foncier, statut de loueur." }, { icon: "users", t: "Famille et succession", x: "Donations, abattements, démembrement." }, { icon: "globe", t: "Mobilité internationale", x: "Résidence fiscale, conventions entre pays." }, { icon: "briefcase", t: "Dirigeants", x: "Rémunération, dividendes, cession de parts." }] }],
        ["feat:alt", { title: "Une méthode en deux temps", bg: "token:surface", items: [{ t: "Comprendre", x: "Nous reprenons vos documents et cartographions les règles applicables.", link: ["Les situations", "/situations"] }, { t: "Choisir", x: "Nous comparons les options possibles, avec leurs conditions et leurs risques de redressement." }] }],
        ["feat:accordion", { title: "Ce que l'on nous demande souvent", items: [{ t: "Peut-on réduire ses impôts ?", x: "Des dispositifs existent, avec des conditions précises. Nous n'en promettons aucun gain et signalons les risques." }, { t: "Faites-vous les déclarations ?", x: "Oui, pour les situations complexes ou à l'international." }] }],
        ["proof:quotes", { title: "Témoignages", items: [{ q: "Une réponse nette sur le statut de mon locatif.", n: "Pascal J.", r: "client fictif" }, { q: "Enfin quelqu'un qui cite les textes.", n: "Léa T.", r: "cliente fictive" }, { q: "Un devis écrit avant de commencer.", n: "Hakim S.", r: "client fictif" }] }],
        ["cta:image", { title: "Une question sur votre déclaration ?", sub: "Réponse personnalisée sous 48 heures ouvrées.", cta: ["Poser ma question", "/contact"] }],
      ] },
      { key: "situations", name: "Situations", blocks: [
        ["misc:pagehead", { title: "Vos situations" }],
        ["feat:strips", { title: "Choisissez la vôtre", items: [{ t: "Je loue un bien", x: "Régimes, charges déductibles, déclaration annuelle." }, { t: "Je transmets", x: "Donation, assurance-vie, pacte Dutreil lorsque c'est applicable." }, { t: "Je pars à l'étranger", x: "Résidence fiscale, exit tax, déclarations de comptes." }, { t: "Je cède mon entreprise", x: "Plus-values, abattements, remploi." }] }],
        ["feat:list2", { title: "Documents utiles", items: [{ t: "Derniers avis d'imposition" }, { t: "Actes de propriété" }, { t: "Contrats de location" }, { t: "Statuts de société" }] }],
        ["cta:split", { title: "Votre cas est particulier ?", sub: "Décrivez-le en quelques lignes.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "calendrier", name: "Calendrier", blocks: [
        ["misc:pagehead", { title: "Calendrier fiscal", sub: "Dates indicatives : vérifiez celles publiées chaque année par l'administration." }],
        ["misc:schedule", { title: "Au fil de l'année", items: [{ d: "Avril – mai", t: "Déclaration de revenus", x: "Ouverture du service en ligne, dates selon département." }, { d: "Mai", t: "Déclaration de patrimoine immobilier", x: "Pour les personnes concernées." }, { d: "Septembre", t: "Solde et acomptes", x: "Vérification des prélèvements." }, { d: "Décembre", t: "Bilan de fin d'année", x: "Dons, versements, arbitrages à étudier avant le 31." }] }],
        ["misc:posts", { title: "Notes fiscales", count: 3, layout: "list" }],
      ] },
      { key: "honoraires", name: "Honoraires", blocks: [
        ["misc:pagehead", { title: "Honoraires" }],
        ["feat:pricelist", { title: "Exemples de prestations", items: [{ t: "Consultation fiscale", x: "Une heure, compte rendu écrit", price: "180 €" }, { t: "Étude de donation", x: "Scénarios et calculs", price: "dès 450 €" }, { t: "Déclaration complexe", x: "Revenus étrangers ou multiples", price: "dès 290 €" }] }],
        ["misc:text", { title: "Transparence", paras: ["Les honoraires sont indiqués par écrit avant toute mission. Les montants de ce site sont des exemples de démonstration. Nos conseils ne remplacent pas un avis sur votre situation personnelle."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Votre question", formTitle: "Décrivez votre situation", formIntro: "Plus vous êtes précis, plus notre réponse le sera.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Lundi – vendredi", "9 h – 17 h 30"], ["Rendez-vous téléphoniques", "Sur demande"]] }],
      ] },
    ],
  },

  // 6. Banque coopérative locale
  {
    key: "clocher-mutuel", name: "Clocher Mutuel", category: "finance", tags: ["chaleureux", "classique"], siteType: "Banque coopérative locale",
    description: "Banque coopérative de territoire : bleu franc et sable, titres Roboto Slab, grand bandeau photo avec voile, tarifs de comptes lisibles, agences et vie sociétaire.",
    brand: "Caisse du Clocher",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0f1f4d", accent: "#e8a31c", background: "#f6f4ee", surface: "#ffffff", text: "#15204a", muted: "#4d5778" }, fonts: { heading: "font.roboto-slab", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "clocher", motifs: ["skyline", "tiles", "waves"] },
    head: ["head:bar", {}],
    foot: ["foot:columns", { about: "Banque coopérative de territoire détenue par ses sociétaires. Établissement fictif de démonstration.", cols: [["Particuliers", "Comptes", "Épargne", "Crédits"], ["Vie locale", "Agences", "Sociétaires", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Comptes", "/comptes"], ["Projets", "/projets"], ["Agences", "/agences"], ["Sociétaires", "/societaires"]], cta: ["Prendre rendez-vous", "/agences"],
    contact: { address: "1 place de l'Église, 12000 Rodez", phone: "05 65 00 70 11", email: "agence@clocher-mutuel.example", hours: "Mardi – samedi, 9 h – 12 h 30 et 14 h – 17 h 30", tagline: "Une banque d'ici, qui finance les projets d'ici." },
    social: ["facebook", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Banque coopérative en Aveyron", title: "Votre argent finance les projets de votre territoire.", sub: "Comptes, épargne, crédits et assurances, avec un conseiller que vous connaissez et des décisions prises près de chez vous.", cta: ["Trouver une agence", "/agences"], cta2: ["Voir les comptes", "/comptes"], overlay: 0.55 }],
        ["feat:icons", { title: "Ce qui nous distingue", items: [{ icon: "mapPin", t: "Décisions locales", x: "Les dossiers sont étudiés par des équipes du département." }, { icon: "users", t: "Sociétaires", x: "Chaque client peut détenir une part et voter en assemblée." }, { icon: "heart", t: "Soutien au territoire", x: "Une part des bénéfices abonde des projets associatifs." }, { icon: "smartphone", t: "Un conseiller référent", x: "Toujours le même interlocuteur, en agence ou à distance." }] }],
        ["gal:cards", { title: "Pour chaque étape de vie", items: [{ t: "Premier compte", tag: "Jeunes", x: "Carte, application et conseils budget." }, { t: "Acheter un logement", tag: "Projet", x: "Étude de financement et assurance emprunteur." }, { t: "Installer son activité", tag: "Pro", x: "Compte professionnel, matériel, trésorerie." }] }],
        ["proof:stats", { items: [["38", "agences (exemple)"], ["62 000", "sociétaires (exemple)"], ["150", "projets locaux soutenus (exemple)"]] }],
        ["cta:band", { title: "Rencontrons-nous à l'agence.", sub: "Un rendez-vous en 30 minutes, sans engagement.", cta: ["Prendre rendez-vous", "/agences"] }],
      ] },
      { key: "comptes", name: "Comptes", blocks: [
        ["misc:pagehead", { title: "Comptes et cartes", sub: "Tarifs de démonstration, hors promotions." }],
        ["feat:pricelist", { title: "Nos formules", items: [{ t: "Compte Pousse (moins de 25 ans)", x: "Carte à autorisation systématique", price: "1 €/mois" }, { t: "Compte Clocher", x: "Carte de débit et application", price: "3,50 €/mois" }, { t: "Compte Famille", x: "Deux cartes, plafonds ajustables", price: "7 €/mois" }] }],
        ["feat:accordion", { title: "Questions courantes", items: [{ t: "Puis-je ouvrir un compte à distance ?", x: "Oui, avec un justificatif d'identité et un justificatif de domicile." }, { t: "Mes dépôts sont-ils protégés ?", x: "Les dépôts sont couverts par le fonds de garantie dans la limite légale en vigueur." }] }],
        ["cta:split", { title: "Une question sur votre compte ?", sub: "Écrivez-nous ou passez en agence.", cta: ["Nous contacter", "/agences"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ["misc:pagehead", { title: "Financer vos projets" }],
        ["feat:alt", { title: "Des solutions à votre mesure", items: [{ t: "Crédit immobilier", x: "Étude personnalisée et simulation de mensualités.", link: ["Prendre rendez-vous", "/agences"] }, { t: "Crédit consommation", x: "Travaux, véhicule, équipement : un montant et une durée adaptés." }, { t: "Épargne de projet", x: "Livrets et plans d'épargne selon votre horizon. Le capital n'est pas garanti sur tous les supports." }] }],
        ["misc:text", { eyebrow: "Mention légale", title: "Emprunter comporte des risques", paras: ["Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager."] }],
      ] },
      { key: "agences", name: "Agences", blocks: [
        ["misc:pagehead", { title: "Nos agences", sub: "Trouvez la plus proche, prenez rendez-vous." }],
        ["contact:map", { title: "Agence de Rodez", mapAddress: "1 place de l'Église, 12000 Rodez" }],
        ["misc:hours", { title: "Horaires", rows: [["Mardi – vendredi", "9 h – 12 h 30 · 14 h – 17 h 30"], ["Samedi", "9 h – 12 h 30"], ["Lundi", "Fermé"]] }],
      ] },
      { key: "societaires", name: "Sociétaires", blocks: [
        ["misc:pagehead", { title: "Vie coopérative" }],
        ["misc:story", { eyebrow: "Qui détient la banque ?", title: "Ses clients-sociétaires", paras: ["Chaque sociétaire possède une part du capital et vote selon le principe un homme, une voix. Les administrateurs sont des clients élus.", "Les profils de cette page sont fictifs."], image: "portrait-2" }],
        ["misc:posts", { title: "Actualités locales", count: 3, layout: "grid" }],
      ] },
    ],
  },

  // 7. Assurance-vie et prévoyance
  {
    key: "alcove-prevoyance", name: "Alcôve", category: "finance", tags: ["chaleureux", "editorial"], siteType: "Conseil en assurance-vie et prévoyance",
    description: "Prévoyance rassurante et feutrée : indigo profond et lin, titres EB Garamond, bandeau cadré, parcours de garanties et mentions réglementaires, sans promesse de rendement.",
    brand: "Alcôve Prévoyance",
    tokens: { colors: { primary: "#4c3fb0", secondary: "#1b1740", accent: "#d1893f", background: "#f7f5fb", surface: "#ffffff", text: "#1d1a38", muted: "#575370" }, fonts: { heading: "font.eb-garamond", body: "font.manrope", button: "font.manrope", link: "font.manrope" }, radius: { sm: 6, md: 12, lg: 18, button: 12, field: 10, card: 16 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 56, weight: 500, lineHeight: 1.06, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "soft" }, art: { seed: "alcove", motifs: ["arches", "blobs", "bokeh"] },
    head: ["head:minimal", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Garanties", "/garanties"], ["Assurance-vie", "/assurance-vie"], ["Conseils", "/conseils"], ["Contact", "/contact"]], cta: ["Faire le point", "/contact"],
    contact: { address: "9 rue du Bât-d'Argent, 69001 Lyon", phone: "04 72 00 90 14", email: "bonjour@alcove-prevoyance.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Protéger les siens, sans jargon et sans pression." },
    social: ["linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Prévoyance et assurance-vie", title: "Se protéger aujourd'hui, pour que les vôtres soient sereins demain.", sub: "Nous vous aidons à choisir des garanties utiles : décès, invalidité, dépendance, et à organiser la transmission.", cta: ["Faire le point", "/contact"], cta2: ["Les garanties", "/garanties"] }],
        ["feat:numbered", { title: "Trois questions à se poser", items: [{ t: "Qui dépend de moi ?", x: "Conjoint, enfants, parents : on mesure les besoins." }, { t: "Que se passe-t-il si je ne peux plus travailler ?", x: "Maintien du niveau de vie, délais de carence." }, { t: "Que souhaitez-vous transmettre ?", x: "Capitaux, clauses bénéficiaires, calendrier." }] }],
        ["feat:tabs", { eyebrow: "Garanties", title: "Des contrats que l'on explique", bg: "token:surface", items: [{ t: "Décès", x: "Un capital ou une rente pour vos proches, avec un questionnaire de santé selon l'âge." }, { t: "Invalidité", x: "Complément de revenu en cas d'incapacité de travail, avec franchise et exclusions détaillées." }, { t: "Dépendance", x: "Aide financière si la perte d'autonomie se produit." }] }],
        ["proof:big", { items: [{ q: "On m'a lu les exclusions avant de me parler des avantages.", n: "Sylvie D.", r: "cliente fictive" }] }],
        ["feat:list2", { title: "Notre engagement d'information", items: [{ t: "Devoir de conseil formalisé" }, { t: "Frais d'entrée et de gestion détaillés" }, { t: "Exclusions listées" }, { t: "Délai de renonciation rappelé" }] }],
        ["cta:image", { title: "Faire le point en 45 minutes.", sub: "Un échange gratuit, sans obligation de souscrire.", cta: ["Faire le point", "/contact"] }],
      ] },
      { key: "garanties", name: "Garanties", blocks: [
        ["misc:pagehead", { title: "Garanties de prévoyance" }],
        ["feat:rows", { title: "À chaque situation, sa couverture", items: [{ t: "Salarié", x: "Compléter le régime obligatoire et la prévoyance d'entreprise." }, { t: "Indépendant", x: "Couvrir une perte de revenu, un arrêt de travail longue durée." }, { t: "Parent", x: "Protéger les études des enfants, un conjoint sans activité." }, { t: "Emprunteur", x: "Assurance du prêt, délégation possible." }] }],
        ["feat:compare", { title: "Comparer deux approches", rows: [["", "Capital", "Rente"], ["Versement", "en une fois", "régulier"], ["Usage", "solder un crédit", "maintenir un revenu"], ["Fiscalité", "selon contrat", "selon contrat"]] }],
        ["cta:card", { title: "Un contrat à relire ?", sub: "Nous analysons gratuitement vos garanties actuelles.", cta: ["Envoyer mon contrat", "/contact"] }],
      ] },
      { key: "assurance-vie", name: "Assurance-vie", blocks: [
        ["misc:pagehead", { title: "Assurance-vie", sub: "Un cadre souple pour épargner et transmettre." }],
        ["misc:text", { eyebrow: "Principe", title: "Une enveloppe, plusieurs supports", paras: ["L'assurance-vie permet de choisir entre un fonds en euros, dont le capital est garanti par l'assureur, et des unités de compte dont la valeur peut baisser comme monter.", "Les performances passées ne préjugent pas des performances futures. Les unités de compte comportent un risque de perte en capital."] }],
        ["feat:icons", { title: "Points d'attention", items: [{ icon: "alertTriangle", t: "Frais", x: "Entrée, gestion, arbitrage : détaillés avant souscription." }, { icon: "users", t: "Bénéficiaires", x: "Une clause rédigée avec soin évite les litiges." }, { icon: "calendarClock", t: "Durée", x: "Pensez à votre horizon avant de choisir les supports." }] }],
      ] },
      { key: "conseils", name: "Conseils", blocks: [
        ["misc:pagehead", { title: "Conseils et lexique" }],
        ["misc:posts", { title: "Articles pédagogiques", count: 6, layout: "list" }],
        ["feat:accordion", { title: "Lexique", items: [{ t: "Clause bénéficiaire", x: "Texte qui désigne les personnes recevant le capital au décès." }, { t: "Franchise", x: "Durée pendant laquelle l'assureur ne verse rien après un arrêt de travail." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Faire le point", formTitle: "Votre situation", formIntro: "Quelques mots sur vos proches et vos préoccupations.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Rendez-vous le soir", "Sur demande, en visio"]] }],
      ] },
    ],
  },

  // 8. Financement de startups, sombre
  {
    key: "amorce-seed", name: "Amorce", category: "finance", tags: ["sombre", "audacieux"], siteType: "Conseil en financement de startups",
    description: "Conseil en levée de fonds au look affiche : fond brun-noir, ambre vif, titres Space Grotesk en capitales, bandeau poster, étapes de levée et mentions de risque pour les entrepreneurs.",
    brand: "Amorce Studio",
    tokens: { colors: { primary: "#f2b01e", secondary: "#2a1f0a", accent: "#ff6b4a", background: "#12100b", surface: "#1d1a12", text: "#f6efe0", muted: "#bfb49b" }, fonts: { heading: "font.space-grotesk", body: "font.dm-sans", button: "font.space-grotesk", link: "font.dm-sans" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 700, lineHeight: 1.0, letterSpacing: -0.03, transform: "uppercase" }, h2: { size: 36, weight: 700, lineHeight: 1.08, letterSpacing: -0.02, transform: "uppercase" } }, border: { width: 1, color: "#3a3220" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "amorce", motifs: ["halftone", "rays", "tiles"] },
    head: ["head:split", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Étapes", "/etapes"], ["Dossiers", "/dossiers"], ["Fonds", "/fonds"], ["Contact", "/contact"]], cta: ["Parler de ma levée", "/contact"],
    contact: { address: "14 quai de la Fosse, 44000 Nantes", phone: "02 85 00 14 28", email: "equipe@amorce-seed.example", hours: "Lundi – vendredi, 9 h – 19 h", tagline: "Préparer une levée, sans perdre de vue le risque." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Conseil en financement de startups", title: "Levez avec méthode.", sub: "Nous préparons les fondateurs à lever des fonds : business plan, valorisation, dossier d'investisseurs et négociation.", cta: ["Parler de ma levée", "/contact"], cta2: ["Les étapes", "/etapes"] }],
        ["proof:statsbar", { items: [["60+", "dossiers préparés (exemple)"], ["4", "étapes de préparation"], ["0 %", "de succès garanti"]] }],
        ["feat:bento", { eyebrow: "Accompagnement", title: "Du premier chiffre à la signature", items: [{ icon: "barChart", t: "Modèle financier", x: "Hypothèses défendables, scénarios prudents, besoins de trésorerie sur 18 à 36 mois." }, { icon: "fileText", t: "Dossier", x: "Deck, note d'investissement, data room." }, { icon: "network", t: "Mise en relation", x: "Business angels, fonds régionaux, prêts d'honneur." }] }],
        ["feat:steps", { title: "Le parcours d'une levée", bg: "token:surface", items: [{ t: "Diagnostic", d: "Semaine 1", x: "Maturité du produit, équipe, traction." }, { t: "Préparation", d: "Semaines 2-5", x: "Modèle, deck, valorisation de référence." }, { t: "Rencontres", d: "Semaines 6-12", x: "Rendez-vous investisseurs, retours." }, { t: "Négociation", d: "Fin de parcours", x: "Lecture de la lettre d'intention et du pacte." }] }],
        ["feat:accordion", { title: "Ce que nous disons aux fondateurs", items: [{ t: "Une levée est-elle certaine ?", x: "Non. Nous ne garantissons ni montant, ni délai, ni valorisation." }, { t: "Prenez-vous des parts ?", x: "Non, nous facturons des honoraires fixes, sans succès fee de principe." }] }],
        ["cta:band", { title: "Votre projet est prêt pour une première discussion ?", cta: ["Parler de ma levée", "/contact"] }],
      ] },
      { key: "etapes", name: "Étapes", blocks: [
        ["misc:pagehead", { title: "Les étapes d'une levée" }],
        ["misc:schedule", { title: "Calendrier type de six mois", items: [{ d: "Mois 1", t: "Diagnostic", x: "Produit, marché, équipe." }, { d: "Mois 2", t: "Dossier", x: "Deck et modèle financier." }, { d: "Mois 3-4", t: "Rencontres", x: "Présentations aux investisseurs." }, { d: "Mois 5", t: "Due diligence", x: "Documents juridiques et financiers." }, { d: "Mois 6", t: "Closing", x: "Signature, si la discussion aboutit." }] }],
        ["feat:list2", { title: "Ce que nous préparons avec vous", items: [{ t: "Table de capitalisation" }, { t: "Pacte d'associés" }, { t: "Plan de recrutement" }, { t: "Indicateurs clés" }] }],
        ["cta:split", { title: "Besoin d'un regard extérieur sur votre deck ?", cta: ["Envoyer mon deck", "/contact"] }],
      ] },
      { key: "dossiers", name: "Dossiers", blocks: [
        ["misc:pagehead", { title: "Dossiers accompagnés", sub: "Études de cas fictives." }],
        ["gal:cards", { title: "Quelques exemples", items: [{ t: "Logiciel de maintenance", tag: "Amorçage", x: "Dossier préparé pour un tour modeste auprès d'angels régionaux." }, { t: "Atelier de réemploi", tag: "Prêt d'honneur", x: "Montage de financement mixte." }, { t: "Application santé", tag: "Série A", x: "Préparation à une levée plus structurée." }] }],
        ["proof:quotes", { title: "Fondateurs accompagnés", items: [{ q: "Notre deck est devenu lisible en cinq minutes.", n: "Romane F.", r: "fondatrice fictive" }, { q: "Le modèle financier tient face aux questions.", n: "Yanis K.", r: "fondateur fictif" }, { q: "Des conseils honnêtes sur nos chances.", n: "Maud L.", r: "fondatrice fictive" }] }],
      ] },
      { key: "fonds", name: "Fonds", blocks: [
        ["misc:pagehead", { title: "Panorama des financements" }],
        ["feat:compare", { title: "Choisir son type de financement", rows: [["", "Business angel", "Prêt d'honneur", "Fonds"], ["Montant", "moyen", "faible", "élevé"], ["Délai", "mois", "semaines", "mois"], ["Contrepartie", "capital", "aucune", "capital"]] }],
        ["misc:text", { eyebrow: "Risque", title: "Investir en startup est risqué", paras: ["Le financement en capital implique un risque de perte totale pour l'investisseur. Nous n'offrons aucun conseil en investissement."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Nous écrire", formTitle: "Présentez votre projet", formIntro: "Secteur, stade, montant envisagé : trois lignes suffisent.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Permanence", rows: [["Lundi – vendredi", "9 h – 19 h"], ["Rendez-vous en visio", "Créneaux le soir"]] }],
      ] },
    ],
  },

  // 9. Cabinet d'audit
  {
    key: "jalon-audit", name: "Jalon", category: "finance", tags: ["classique", "minimaliste"], siteType: "Cabinet d'audit et commissariat aux comptes",
    description: "Audit légal et contractuel austère et précis : olive sombre sur blanc cassé, titres Libre Baskerville, bandeau de texte très grand, références de missions et méthodologie documentée.",
    brand: "Jalon Audit",
    tokens: { colors: { primary: "#66701a", secondary: "#222710", accent: "#8a3d2b", background: "#f7f7f1", surface: "#ffffff", text: "#20230f", muted: "#545a40" }, fonts: { heading: "font.libre-baskerville", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.15, letterSpacing: -0.01 } }, border: { width: 1, color: "#d9dac6" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "jalon", motifs: ["plates", "topo", "tiles"] },
    head: ["head:bar", {}],
    foot: ["foot:big", { title: "Jalon" }],
    menu: [["Accueil", "/"], ["Missions", "/missions"], ["Méthode", "/methode"], ["Cabinet", "/cabinet"], ["Contact", "/contact"]], cta: ["Nous consulter", "/contact"],
    contact: { address: "21 boulevard Carnot, 21000 Dijon", phone: "03 80 00 31 46", email: "mission@jalon-audit.example", hours: "Lundi – vendredi, 8 h 30 – 18 h", tagline: "Poser des repères fiables sur vos comptes." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Audit et commissariat aux comptes", title: "Des comptes vérifiés, une confiance documentée.", sub: "Nous certifions les comptes des sociétés et associations, et réalisons des audits contractuels et d'acquisition en Bourgogne.", cta: ["Nous consulter", "/contact"], cta2: ["Notre méthode", "/methode"] }],
        ["feat:rows", { title: "Nos missions", items: [{ t: "Commissariat aux comptes", x: "Certification légale, procédures de contrôle, relation avec les organes de gouvernance." }, { t: "Audit contractuel", x: "Examen limité, audit de filiale, revue d'un exercice sur demande." }, { t: "Audit d'acquisition", x: "Analyse financière avant achat ou cession d'une société." }, { t: "Associations et fondations", x: "Contrôle des comptes, subventions, règles de transparence." }] }],
        ["proof:stats", { title: "Le cabinet en chiffres", items: [["25", "ans d'existence"], ["9", "collaborateurs"], ["140", "mandats suivis (exemple)"]] }],
        ["feat:numbered", { title: "Nos engagements", bg: "token:surface", items: [{ t: "Indépendance", x: "Vérifiée à chaque mission et à chaque renouvellement." }, { t: "Rigueur", x: "Programmes de travail, revues croisées." }, { t: "Clarté", x: "Rapports lisibles et recommandations priorisées." }] }],
        ["misc:quote", { text: "Un audit utile se lit : ce qu'on a vérifié, ce qu'on n'a pas pu vérifier, et pourquoi.", by: "Principe de rédaction des rapports" }],
        ["cta:split", { title: "Une mission à confier ?", sub: "Nous répondons sous trois jours ouvrés.", cta: ["Nous consulter", "/contact"] }],
      ] },
      { key: "missions", name: "Missions", blocks: [
        ["misc:pagehead", { title: "Missions" }],
        ["feat:accordion", { title: "Détail des interventions", items: [{ t: "Certification des comptes annuels", x: "Planification, tests, revue analytique, rapport sur les comptes." }, { t: "Examen limité de comptes intermédiaires", x: "Assurance modérée, utile pour un financement ou un tour de table." }, { t: "Audit d'acquisition", x: "Qualité des résultats, dette, engagements hors bilan." }, { t: "Revue de contrôle interne", x: "Cartographie des risques, recommandations." }] }],
        ["feat:checks", { title: "Avant le démarrage", cta: ["Programmer un entretien", "/contact"], items: [{ t: "Lettre de mission signée", x: "" }, { t: "Accès aux comptes et aux justificatifs", x: "" }, { t: "Désignation d'un référent interne", x: "" }, { t: "Calendrier d'intervention validé", x: "" }] }],
        ["cta:band", { title: "Devis gratuit sous trois jours.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ["misc:pagehead", { title: "Méthode" }],
        ["feat:steps", { title: "Un audit en cinq temps", items: [{ t: "Prise de connaissance", d: "Semaine 1", x: "Activité, environnement, organisation." }, { t: "Évaluation des risques", d: "Semaine 2", x: "Zones sensibles et seuils de signification." }, { t: "Travaux", d: "Semaines 3-5", x: "Tests, confirmations, contrôles analytiques." }, { t: "Synthèse", d: "Semaine 6", x: "Points d'attention discutés avec la direction." }, { t: "Rapport", d: "Semaine 7", x: "Opinion et recommandations." }] }],
        ["misc:text", { eyebrow: "À noter", title: "Un audit ne garantit pas l'absence d'erreur", paras: ["Un audit fournit une assurance raisonnable, non absolue. Il ne remplace pas la responsabilité des dirigeants sur l'établissement des comptes."] }],
      ] },
      { key: "cabinet", name: "Cabinet", blocks: [
        ["misc:pagehead", { title: "Le cabinet" }],
        ["misc:story", { eyebrow: "Histoire", title: "Une signature régionale", paras: ["Créé en 1999 à Dijon, le cabinet intervient auprès de PME industrielles, de groupes familiaux et d'associations de la région.", "Les profils ci-dessous sont fictifs."], image: "portrait-2" }],
        ["proof:team", { items: [{ n: "Bernard Colin", r: "Commissaire aux comptes associé" }, { n: "Nathalie Ferrand", r: "Commissaire aux comptes associée" }, { n: "Mehdi Aït-Saïd", r: "Chef de mission" }] }],
        ["proof:logos", { title: "Secteurs suivis", items: ["Industrie agroalimentaire", "Associations culturelles", "Négoce de vin", "Coopératives agricoles"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:map", { title: "Nous rendre visite", mapAddress: "21 boulevard Carnot, 21000 Dijon" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "8 h 30 – 18 h"], ["Rendez-vous clients", "Sur rendez-vous"]] }],
      ] },
    ],
  },

  // 10. Gestion de paie
  {
    key: "pivoine-paie", name: "Pivoine", category: "finance", tags: ["moderne", "ludique"], siteType: "Service de gestion de paie externalisée",
    description: "Paie externalisée vive et rassurante : magenta profond sur fond rosé, titres Urbanist, bandeau bleed à image haute, cartes d'inclus, calendrier mensuel de paie et tarifs par bulletin.",
    brand: "Pivoine Paie",
    tokens: { colors: { primary: "#a31d78", secondary: "#3d0b2d", accent: "#0f8f8a", background: "#fdf3f9", surface: "#ffffff", text: "#2e1226", muted: "#6b4a5e" }, fonts: { heading: "font.urbanist", body: "font.spectral", button: "font.urbanist", link: "font.spectral" }, radius: { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 52, weight: 800, lineHeight: 1.06, letterSpacing: -0.025 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "pivoine", motifs: ["blobs", "botanical", "ribbons"] },
    head: ["head:topbar", { info: "Paie externalisée pour TPE et PME", note: "Votre première paie à blanc offerte" }],
    foot: ["foot:newsletter", { title: "Le calendrier social", sub: "Les échéances sociales du mois, un courriel par mois.", button: "Recevoir le calendrier" }],
    menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Tarifs", "/tarifs"], ["Calendrier", "/calendrier"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "16 rue du Faubourg Saint-Jean, 45000 Orléans", phone: "02 38 00 85 27", email: "paie@pivoine-paie.example", hours: "Lundi – vendredi, 8 h 30 – 17 h 30", tagline: "Vos bulletins justes, à l'heure, chaque mois." },
    social: ["linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Gestion de paie à Orléans", title: "Vos salariés payés à l'heure, vos déclarations justes.", sub: "Nous établissons les bulletins, transmettons les déclarations sociales et répondons à vos questions de paie en moins d'une journée.", cta: ["Demander un devis", "/contact"], cta2: ["Tarifs", "/tarifs"] }],
        ["feat:grid-icons", { title: "Ce qui est inclus", items: [{ icon: "fileText", t: "Bulletins de paie", x: "Élaborés selon votre convention collective." }, { icon: "calendarClock", t: "DSN mensuelle", x: "Transmise à temps, preuve de dépôt remise." }, { icon: "users", t: "Entrées et sorties", x: "Contrats, solde de tout compte, attestations." }, { icon: "help", t: "Support dédié", x: "Une personne, un numéro direct." }] }],
        ["proof:quotes", { title: "Témoignages", items: [{ q: "Mes bulletins arrivent avant le 25, sans relance.", n: "Isabelle C.", r: "gérante de salon, cliente fictive" }, { q: "Ils connaissent notre convention collective.", n: "Franck D.", r: "restaurateur, client fictif" }, { q: "Fini le stress des déclarations.", n: "Aline Y.", r: "directrice d'association, cliente fictive" }] }],
        ["feat:pricelist", { title: "Tarifs de démonstration", bg: "token:surface", items: [{ t: "Bulletin mensuel", x: "À partir de 5 salariés", price: "dès 19 €" }, { t: "Entrée de salarié", x: "Contrat et déclarations", price: "45 €" }, { t: "Solde de tout compte", x: "Calculs et documents", price: "65 €" }] }],
        ["cta:card", { title: "Première paie à blanc offerte.", sub: "Comparez avec votre solution actuelle, sans engagement.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        ["misc:pagehead", { title: "Prestations" }],
        ["feat:alt", { title: "Selon votre besoin", items: [{ t: "Paie complète", x: "Du bulletin à la DSN, avec suivi des congés et des absences.", link: ["Voir les tarifs", "/tarifs"] }, { t: "Paie ponctuelle", x: "Pour un remplacement de gestionnaire ou une période de pointe." }, { t: "Audit de paie", x: "Contrôle de vos bulletins et de vos paramétrages." }] }],
        ["feat:accordion", { title: "Questions courantes", items: [{ t: "Comment vous transmettre les variables ?", x: "Par formulaire en ligne ou par courriel, avant la date convenue." }, { t: "Gérez-vous plusieurs conventions collectives ?", x: "Oui, selon vos entreprises." }] }],
        ["cta:band", { title: "Un doute sur vos bulletins ?", cta: ["Faire auditer ma paie", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Montants indicatifs hors taxes." }],
        ["price:tiers", { items: [{ t: "Petite équipe", price: "19 €", period: "/bulletin", x: "1 à 10 salariés.", f: ["Bulletins", "DSN", "Support courriel"], cta: ["Demander", "/contact"] }, { t: "Équipe en croissance", price: "14 €", period: "/bulletin", x: "11 à 50 salariés.", f: ["Tout Petite équipe", "Suivi des absences", "Appel mensuel"], hl: true, cta: ["Demander", "/contact"] }, { t: "Structure complexe", price: "sur devis", x: "Plusieurs établissements.", f: ["Conventions multiples", "Interlocuteur dédié"], cta: ["Nous écrire", "/contact"] }] }],
        ["misc:text", { title: "Sans surprise", paras: ["Les tarifs ci-dessus sont des exemples de démonstration. Le devis écrit précise le périmètre de chaque mission."] }],
      ] },
      { key: "calendrier", name: "Calendrier", blocks: [
        ["misc:pagehead", { title: "Calendrier mensuel de paie" }],
        ["misc:schedule", { title: "Les rendez-vous du mois", items: [{ d: "Le 20", t: "Remise des variables", x: "Heures, absences, primes." }, { d: "Le 24", t: "Envoi des bulletins", x: "Pour validation et paiement." }, { d: "Le 5", t: "Déclaration sociale", x: "DSN transmise et accusé de réception." }, { d: "Le 15", t: "Paiement des cotisations", x: "Selon votre organisme." }] }],
        ["misc:posts", { title: "Actualités sociales", count: 3, layout: "list" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Votre devis", formTitle: "Parlez-nous de votre équipe", formIntro: "Nombre de salariés, convention collective, logiciel actuel.", cta: ["Envoyer", "/contact"] }],
        ["cta:band", { title: "Une question sur vos bulletins ?", sub: "Décrivez votre situation, nous répondons sous deux jours ouvrés.", cta: ["Écrire au cabinet", "/contact"] }],
      ] },
    ],
  },

  // 11. Family office, sombre
  {
    key: "haute-mer-office", name: "Haute-Mer", category: "finance", tags: ["sombre", "luxe"], siteType: "Family office multi-familles",
    description: "Family office discret et nocturne : bleu marine profond, périwinkle lumineux, titres Marcellus, en-tête centré, bandeau divisé, principes de gouvernance et mentions de prudence.",
    brand: "Haute-Mer Family Office",
    tokens: { colors: { primary: "#9db1ff", secondary: "#141b3a", accent: "#e0c58a", background: "#0b1022", surface: "#131a33", text: "#eef1fb", muted: "#a5aed0" }, fonts: { heading: "font.marcellus", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.1, letterSpacing: 0.005 }, h2: { size: 36, weight: 400, lineHeight: 1.15, letterSpacing: 0.005 } }, border: { width: 1, color: "#262f55" } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "hautemer", motifs: ["waves", "bokeh", "arches"] },
    head: ["head:center", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Famille", "/famille"], ["Gouvernance", "/gouvernance"], ["Cabinet", "/cabinet"], ["Contact", "/contact"]], cta: ["Entretien confidentiel", "/contact"],
    contact: { address: "4 rue du Port, 17000 La Rochelle", phone: "05 46 00 18 62", email: "discretion@haute-mer-office.example", hours: "Sur rendez-vous uniquement", tagline: "Veiller sur un patrimoine familial, avec constance et discrétion." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Family office multi-familles", title: "Un regard unique sur l'ensemble de votre patrimoine familial.", sub: "Nous coordonnons conseillers, banques et notaires pour les familles qui souhaitent une vision consolidée et une gouvernance claire.", cta: ["Entretien confidentiel", "/contact"], cta2: ["Gouvernance", "/gouvernance"] }],
        ["feat:strips", { title: "Ce que recouvre notre mission", items: [{ t: "Consolidation", x: "Un tableau de bord unique pour les actifs financiers, immobiliers et professionnels." }, { t: "Gouvernance familiale", x: "Charte, conseil de famille, préparation de la génération suivante." }, { t: "Coordination des conseils", x: "Avocats, notaires, gestionnaires : une seule interface." }, { t: "Projets de vie", x: "Philanthropie, mécénat, investissement d'impact." }] }],
        ["proof:statsbar", { items: [["18 ans", "de conseil aux familles"], ["24", "familles accompagnées (exemple)"], ["3", "générations en moyenne par dossier"]] }],
        ["feat:alt", { title: "Un accompagnement sur la durée", bg: "token:surface", items: [{ t: "Phase d'ouverture", x: "Immersion de trois mois pour comprendre vos objectifs et vos équilibres familiaux.", link: ["Gouvernance", "/gouvernance"] }, { t: "Pilotage courant", x: "Comités trimestriels, rapports consolidés, arbitrages documentés." }] }],
        ["misc:quote", { text: "Un patrimoine familial se gouverne comme une entreprise qui durerait cent ans.", by: "Haute-Mer, principe de la maison" }],
        ["cta:card", { title: "Un premier entretien, strictement confidentiel.", sub: "Sur invitation ou sur simple demande.", cta: ["Entretien confidentiel", "/contact"] }],
      ] },
      { key: "famille", name: "Famille", blocks: [
        ["misc:pagehead", { title: "Pour les familles" }],
        ["misc:text", { eyebrow: "Notre approche", title: "Comprendre avant de conseiller", paras: ["Chaque famille a son histoire, ses entreprises et ses attachements. Nous commençons par les écouter, un à un, avant de proposer une organisation commune.", "Nos recommandations sont écrites, argumentées, et présentent toujours leurs limites."] }],
        ["feat:cards", { title: "Profils accompagnés", items: [{ icon: "briefcase", t: "Famille entrepreneuriale", x: "Cession ou transmission d'une société." }, { icon: "home", t: "Patrimoine immobilier", x: "Biens détenus en indivision ou en société." }, { icon: "globe", t: "Famille internationale", x: "Résidences multiples, coordination des juridictions." }] }],
        ["proof:big", { items: [{ q: "Un seul interlocuteur, enfin, pour parler à tous nos conseils.", n: "Famille R.", r: "client fictif" }] }],
      ] },
      { key: "gouvernance", name: "Gouvernance", blocks: [
        ["misc:pagehead", { title: "Gouvernance familiale" }],
        ["feat:steps", { title: "Mettre en place un cadre", items: [{ t: "Valeurs", d: "Atelier 1", x: "Ce que la famille souhaite préserver." }, { t: "Charte", d: "Atelier 2", x: "Règles de décision, de transmission, de sortie." }, { t: "Instances", d: "Mois 3", x: "Conseil de famille, comité d'investissement." }, { t: "Suivi", d: "Annuel", x: "Revue et mise à jour." }] }],
        ["feat:accordion", { title: "Questions sur la méthode", items: [{ t: "Quels actifs minimum ?", x: "Nous examinons chaque situation, sans seuil automatique." }, { t: "Gérez-vous les placements ?", x: "Nous sélectionnons et supervisons des prestataires. Tout investissement comporte un risque de perte en capital." }] }],
      ] },
      { key: "cabinet", name: "Cabinet", blocks: [
        ["misc:pagehead", { title: "Le cabinet" }],
        ["misc:story", { eyebrow: "Origines", title: "Né d'une histoire familiale", paras: ["Haute-Mer a été fondé par d'anciens banquiers privés pour proposer une alternative indépendante aux grandes structures.", "Profils fictifs de démonstration."], image: "portrait-1" }],
        ["proof:team", { items: [{ n: "Aurélien de Montlaur", r: "Associé fondateur" }, { n: "Constance Brémond", r: "Directrice de la gouvernance" }, { n: "Louis Archambault", r: "Responsable consolidation" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Toute demande est traitée en confidentialité." }],
        ["contact:info", { title: "Demander un entretien", formTitle: "Votre message", formIntro: "Nous reviendrons vers vous personnellement.", cta: ["Envoyer", "/contact"] }],
        ["misc:text", { eyebrow: "Information", title: "Mentions de prudence", paras: ["Les informations de ce site sont données à titre indicatif et ne constituent pas un conseil en investissement. Les performances passées ne préjugent pas des performances futures."] }],
      ] },
    ],
  },

  // 12. Microcrédit solidaire
  {
    key: "grainier-micro", name: "Grainier", category: "finance", tags: ["chaleureux", "ludique"], siteType: "Association de microcrédit solidaire",
    description: "Microcrédit solidaire humain : rouge brique et blé, titres Baloo 2 arrondis, bandeau en collage, parcours d'accompagnement, histoires de porteurs de projet et appel au bénévolat.",
    brand: "Grainier Solidaire",
    tokens: { colors: { primary: "#b4232a", secondary: "#3a1210", accent: "#2f7d4f", background: "#fbf4ec", surface: "#ffffff", text: "#2b1612", muted: "#6a4c45" }, fonts: { heading: "font.baloo-2", body: "font.source-serif-4", button: "font.baloo-2", link: "font.source-serif-4" }, radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 24 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.05, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "grainier", motifs: ["botanical", "blobs", "objects"] },
    head: ["head:bar", {}],
    foot: ["foot:columns", { about: "Association qui accompagne et finance de petits projets professionnels portés par des personnes éloignées du crédit bancaire.", cols: [["Porteurs de projet", "Conditions", "Parcours", "Contact"], ["Soutenir", "Devenir bénévole", "Faire un don", "Rapport d'activité"]] }],
    menu: [["Accueil", "/"], ["Porteurs de projet", "/porteurs"], ["Parcours", "/parcours"], ["Soutenir", "/soutenir"], ["Contact", "/contact"]], cta: ["Présenter mon projet", "/contact"],
    contact: { address: "8 rue des Ursulines, 86000 Poitiers", phone: "05 49 00 27 39", email: "accueil@grainier-micro.example", hours: "Mardi – vendredi, 9 h – 17 h", tagline: "Donner un coup de pouce aux petits projets qui ont du souffle." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Microcrédit professionnel et accompagnement", title: "Un petit prêt peut démarrer une grande activité.", sub: "Nous finançons et accompagnons des personnes sans accès au crédit classique : machine à coudre, camion-atelier, matériel de coiffure.", cta: ["Présenter mon projet", "/contact"], cta2: ["Comment ça marche", "/parcours"] }],
        ["proof:stats", { title: "En quelques repères (exemples)", items: [["600", "projets financés"], ["9 sur 10", "activités encore en place après deux ans"], ["120", "bénévoles accompagnateurs"]] }],
        ["feat:cards", { eyebrow: "Notre aide", title: "Un prêt, mais aussi un accompagnement", items: [{ icon: "coin", t: "Microcrédit", x: "De quelques centaines à quelques milliers d'euros, selon le projet." }, { icon: "users", t: "Parrainage", x: "Un bénévole expérimenté vous suit pendant la durée du prêt." }, { icon: "book", t: "Ateliers", x: "Gestion, devis, démarches administratives." }, { icon: "network", t: "Réseau", x: "Mises en relation avec des artisans et commerçants." }] }],
        ["proof:quotes", { title: "Ils ont démarré avec nous", bg: "token:surface", items: [{ q: "J'ai acheté mon four et lancé mon traiteur.", n: "Fatou D.", r: "cuisinière, porteuse de projet fictive" }, { q: "Mon parrain m'a appris à faire un devis.", n: "Kévin L.", r: "jardinier, porteur de projet fictif" }, { q: "On m'a écoutée, pas jugée.", n: "Josiane M.", r: "couturière, porteuse de projet fictive" }] }],
        ["feat:list2", { title: "Un prêt solidaire reste un prêt", items: [{ t: "Il doit être remboursé" }, { t: "Le taux est annoncé à l'avance" }, { t: "Un délai de réflexion est prévu" }, { t: "L'accord n'est jamais garanti" }] }],
        ["cta:band", { title: "Un projet ? Racontez-le-nous.", sub: "Un premier rendez-vous gratuit, avec un conseiller de l'association.", cta: ["Présenter mon projet", "/contact"] }],
      ] },
      { key: "porteurs", name: "Porteurs de projet", blocks: [
        ["misc:pagehead", { title: "Vous avez un projet" }],
        ["feat:rows", { title: "Pour qui ?", items: [{ t: "Créateurs d'activité", x: "Micro-entreprise, artisanat, services à domicile." }, { t: "Personnes en reconversion", x: "Matériel, formation, premier stock." }, { t: "Travailleurs indépendants", x: "Véhicule, outils, trésorerie de démarrage." }] }],
        ["feat:checks", { title: "Pour déposer une demande", cta: ["Prendre contact", "/contact"], items: [{ t: "Une idée d'activité décrite en quelques lignes", x: "" }, { t: "Un budget de départ chiffré", x: "" }, { t: "Une pièce d'identité", x: "" }, { t: "Un justificatif de domicile", x: "" }] }],
        ["misc:text", { eyebrow: "Transparence", title: "Conditions de démonstration", paras: ["Montant : de 500 à 12 000 euros. Durée : 6 à 48 mois. Les conditions exactes sont communiquées par écrit lors du premier rendez-vous."] }],
      ] },
      { key: "parcours", name: "Parcours", blocks: [
        ["misc:pagehead", { title: "Le parcours" }],
        ["feat:steps", { title: "Cinq étapes simples", items: [{ t: "Rencontre", d: "Semaine 1", x: "Vous nous racontez votre projet." }, { t: "Étude", d: "Semaines 2-3", x: "Budget et plan avec un conseiller." }, { t: "Comité", d: "Semaine 4", x: "Décision collective et bienveillante." }, { t: "Décaissement", d: "Semaine 5", x: "Versement du prêt si accord." }, { t: "Suivi", d: "Pendant le prêt", x: "Parrain, ateliers, points réguliers." }] }],
        ["proof:big", { items: [{ q: "Un prêt n'est pas un cadeau, mais c'est un vrai coup de main.", n: "Un bénévole", r: "citation fictive" }] }],
      ] },
      { key: "soutenir", name: "Soutenir", blocks: [
        ["misc:pagehead", { title: "Nous soutenir" }],
        ["feat:alt", { title: "Plusieurs façons d'aider", items: [{ t: "Devenir parrain", x: "Quelques heures par mois pour accompagner un porteur de projet.", link: ["Nous contacter", "/contact"] }, { t: "Faire un don", x: "Un don alimente le fonds de garantie des prêts." }, { t: "Prêter son réseau", x: "Clients, fournisseurs, locaux, matériel." }] }],
        ["misc:posts", { title: "Dernières nouvelles", count: 3, layout: "grid" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Venir nous voir", formTitle: "Décrivez votre projet", formIntro: "Quelques lignes suffisent, on vous rappelle.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Permanences", rows: [["Mardi – vendredi", "9 h – 17 h"], ["Permanence en mairie annexe", "Un jeudi sur deux"]] }],
      ] },
    ],
  },

  // 13. Trésorerie TPE
  {
    key: "viaduc-treso", name: "Viaduc", category: "finance", tags: ["technique", "moderne"], siteType: "Conseil en trésorerie pour TPE",
    description: "Pilotage de trésorerie lisible : violet électrique sur gris perle, titres Chivo, bandeau centré à chiffres, comparatif de seuils d'alerte, tableaux de bord et pas-à-pas de prévision.",
    brand: "Viaduc Trésorerie",
    tokens: { colors: { primary: "#7b2fa8", secondary: "#241033", accent: "#1aa186", background: "#f4f3f7", surface: "#ffffff", text: "#1f1530", muted: "#5b5170" }, fonts: { heading: "font.chivo", body: "font.crimson-text", button: "font.chivo", link: "font.crimson-text" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 800, lineHeight: 1.05, letterSpacing: -0.03 }, body: { size: 18 } }, border: { width: 1, color: "#dcd7e6" } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "soft" }, art: { seed: "viaduc", motifs: ["mesh", "tiles", "topo"] },
    head: ["head:dark", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Pilotage", "/pilotage"], ["Outils", "/outils"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Auditer ma trésorerie", "/contact"],
    contact: { address: "30 rue Garibaldi, 69003 Lyon", phone: "04 78 00 62 90", email: "treso@viaduc-treso.example", hours: "Lundi – vendredi, 8 h 30 – 18 h", tagline: "Voir venir les creux avant qu'ils n'arrivent." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Trésorerie pour TPE", title: "Sachez où en sera votre compte dans trois mois.", sub: "Nous construisons un tableau de trésorerie simple, relié à vos factures et à votre banque, pour anticiper les creux et décider sereinement.", cta: ["Auditer ma trésorerie", "/contact"], cta2: ["Voir les outils", "/outils"], stats: [["13 sem.", "de prévision glissante"], ["1 page", "de tableau de bord"], ["24 h", "délai de réponse"]] }],
        ["feat:bento", { title: "Trois leviers pour garder la main", items: [{ icon: "trendingUp", t: "Prévision", x: "Un plan de trésorerie à 13 semaines, mis à jour chaque mois, avec des scénarios prudents." }, { icon: "clock", t: "Délais de paiement", x: "Relances et conditions clients." }, { icon: "sliders", t: "Dialogue bancaire", x: "Préparer un découvert autorisé ou un crédit court." }] }],
        ["feat:compare", { title: "Votre situation, nos réponses", bg: "token:surface", rows: [["", "Tension ponctuelle", "Tension durable"], ["Cause fréquente", "facture tardive", "marge insuffisante"], ["Premier réflexe", "relancer", "analyser les coûts"], ["Notre apport", "plan 13 semaines", "audit de rentabilité"]] }],
        ["proof:stats", { items: [["35", "TPE accompagnées (exemple)"], ["8 h", "pour mettre un tableau en place"], ["0", "promesse de financement"]] }],
        ["feat:accordion", { title: "Questions courantes", items: [{ t: "Obtenez-vous un crédit pour moi ?", x: "Nous aidons à préparer le dossier, la décision appartient à la banque." }, { t: "Avez-vous accès à mon compte ?", x: "Seulement en lecture, avec votre accord, et vous pouvez le retirer à tout moment." }] }],
        ["cta:split", { title: "Faire le point en une heure.", sub: "Un diagnostic de trésorerie, gratuit, sans engagement.", cta: ["Auditer ma trésorerie", "/contact"] }],
      ] },
      { key: "pilotage", name: "Pilotage", blocks: [
        ["misc:pagehead", { title: "Piloter sa trésorerie" }],
        ["feat:steps", { title: "Mettre en place un suivi", items: [{ t: "Collecte", d: "Jour 1", x: "Banque, factures clients et fournisseurs." }, { t: "Modélisation", d: "Jours 2-4", x: "Encaissements et décaissements attendus." }, { t: "Alertes", d: "Jour 5", x: "Seuils fixés avec vous." }, { t: "Revue", d: "Chaque mois", x: "Écarts analysés, décisions notées." }] }],
        ["feat:list2", { title: "Seuils conseillés", items: [{ t: "Trésorerie minimale en jours de charges" }, { t: "Délai moyen de paiement client" }, { t: "Part de l'encours en retard" }, { t: "Prochaine échéance de TVA" }] }],
        ["cta:band", { title: "Un creux de trésorerie en vue ?", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "outils", name: "Outils", blocks: [
        ["misc:pagehead", { title: "Outils" }],
        ["feat:tabs", { title: "Ce que nous mettons en place", items: [{ t: "Tableau de bord", x: "Une page, quatre indicateurs, compréhensible sans formation." }, { t: "Plan 13 semaines", x: "Un fichier partagé, mis à jour avec vous." }, { t: "Relances", x: "Modèles de messages et calendrier d'envoi." }] }],
        ["misc:posts", { title: "Fiches pratiques", count: 3, layout: "grid" }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Diagnostic", price: "390 €", period: "forfait", x: "Pour y voir clair.", f: ["Analyse de 12 mois", "Plan 13 semaines", "Restitution d'une heure"], cta: ["Choisir", "/contact"] }, { t: "Pilotage", price: "180 €", period: "/mois", x: "Pour rester à jour.", f: ["Mise à jour mensuelle", "Alertes", "Appel de suivi"], hl: true, cta: ["Choisir", "/contact"] }, { t: "Sur mesure", price: "sur devis", x: "Plusieurs sociétés.", f: ["Consolidation", "Appui bancaire"], cta: ["Nous écrire", "/contact"] }] }],
        ["misc:text", { title: "À noter", paras: ["Montants hors taxes, exemples de démonstration."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Diagnostic gratuit", formTitle: "Votre activité", formIntro: "Secteur, chiffre d'affaires approximatif, difficulté rencontrée.", cta: ["Envoyer", "/contact"] }],
        ["cta:band", { title: "Un besoin de trésorerie ?", sub: "Décrivez votre situation, nous répondons sous deux jours ouvrés.", cta: ["Écrire au cabinet", "/contact"] }],
      ] },
    ],
  },

  // 14. Conseil en retraite
  {
    key: "sentier-retraite", name: "Sentier", category: "finance", tags: ["naturel", "chaleureux"], siteType: "Conseil en préparation de la retraite",
    description: "Conseil en retraite apaisant : vert feuille et crème, titres Alegreya, bandeau cadré rassurant, étapes par tranche d'âge, simulation commentée en rendez-vous et informations réglementaires prudentes.",
    brand: "Sentier Retraite",
    tokens: { colors: { primary: "#4d7c0f", secondary: "#21330a", accent: "#b4532a", background: "#f8f6ec", surface: "#ffffff", text: "#202a12", muted: "#555c42" }, fonts: { heading: "font.alegreya", body: "font.mulish", button: "font.mulish", link: "font.mulish" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.08, letterSpacing: -0.005 }, body: { size: 18 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "soft" }, art: { seed: "sentier", motifs: ["mountains", "botanical", "dunes"] },
    head: ["head:bar", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Étapes", "/etapes"], ["Droits", "/droits"], ["Rendez-vous", "/rendez-vous"], ["Contact", "/contact"]], cta: ["Faire le point", "/rendez-vous"],
    contact: { address: "11 rue Voltaire, 38000 Grenoble", phone: "04 76 00 43 25", email: "bonjour@sentier-retraite.example", hours: "Lundi – vendredi, 9 h – 17 h ; en visio le jeudi soir", tagline: "Préparer sereinement le jour où l'on s'arrête." },
    social: ["facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Conseil en retraite", title: "Partir à la retraite, c'est un chemin qui se prépare.", sub: "Nous vous aidons à comprendre vos droits, à choisir votre date de départ et à ajuster vos revenus futurs.", cta: ["Faire le point", "/rendez-vous"], cta2: ["Les étapes", "/etapes"] }],
        ["feat:alt", { eyebrow: "Accompagnement", title: "Chaque âge a sa question", items: [{ t: "À 45 ans", x: "Vérifier son relevé de carrière et repérer les trimestres manquants.", link: ["Les étapes", "/etapes"] }, { t: "À 55 ans", x: "Estimer ses droits, anticiper la baisse de revenu, étudier un rachat de trimestres." }, { t: "À 60 ans et plus", x: "Choisir une date, cumuler emploi et retraite, organiser la transition." }] }],
        ["feat:numbered", { title: "Trois repères", bg: "token:surface", items: [{ t: "Relevé", x: "Vérifier chaque trimestre de votre carrière." }, { t: "Estimation", x: "Un montant indicatif, jamais garanti." }, { t: "Décision", x: "Départ, cumul, rachat : à votre rythme." }] }],
        ["proof:quotes", { title: "Retraités et futurs retraités", items: [{ q: "J'ai compris pourquoi il me manquait des trimestres.", n: "Gérard P.", r: "futur retraité fictif" }, { q: "On m'a donné trois dates avec les montants approchés.", n: "Annie S.", r: "future retraitée fictive" }, { q: "Un échange calme et clair.", n: "Dominique V.", r: "client fictif" }] }],
        ["proof:stats", { items: [["900", "bilans réalisés (exemple)"], ["1 h 30", "durée d'un rendez-vous"], ["0", "rendement promis"]] }],
        ["cta:image", { title: "Faire le point avant de décider.", sub: "Un rendez-vous d'une heure et demie, en cabinet ou en visio.", cta: ["Faire le point", "/rendez-vous"] }],
      ] },
      { key: "etapes", name: "Étapes", blocks: [
        ["misc:pagehead", { title: "Les étapes" }],
        ["misc:schedule", { title: "Préparer son départ", items: [{ d: "10 ans avant", t: "Relevé de carrière", x: "Corriger les oublis auprès des caisses." }, { d: "5 ans avant", t: "Estimation des droits", x: "Simulation indicative et premiers arbitrages." }, { d: "2 ans avant", t: "Choix de la date", x: "Démarches et recours possibles." }, { d: "6 mois avant", t: "Demande de retraite", x: "Dépôt de dossier et suivi." }] }],
        ["feat:icons", { title: "Points d'attention", items: [{ icon: "fileText", t: "Carrière", x: "Périodes à l'étranger, apprentissage, temps partiel." }, { icon: "users", t: "Conjoint", x: "Pension de réversion, couverture santé." }, { icon: "coin", t: "Budget", x: "Revenus et dépenses attendues après l'arrêt." }] }],
        ["cta:band", { title: "Un doute sur votre relevé ?", cta: ["Prendre rendez-vous", "/rendez-vous"] }],
      ] },
      { key: "droits", name: "Droits", blocks: [
        ["misc:pagehead", { title: "Comprendre ses droits" }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je travailler en étant retraité ?", x: "Oui, sous conditions. Le cumul emploi-retraite dépend de votre régime." }, { t: "Mon âge de départ est-il le même pour tous ?", x: "Non, il dépend de l'année de naissance et de la carrière." }, { t: "Le montant de ma pension est-il garanti ?", x: "Il est calculé selon des règles qui peuvent évoluer. Nos estimations sont indicatives." }] }],
        ["misc:posts", { title: "À lire", count: 6, layout: "list" }],
      ] },
      { key: "rendez-vous", name: "Rendez-vous", blocks: [
        ["misc:pagehead", { title: "Prendre rendez-vous" }],
        ["feat:pricelist", { title: "Nos formules", items: [{ t: "Bilan retraite", x: "Relevé, estimation, compte rendu écrit", price: "190 €" }, { t: "Bilan et plan d'action", x: "Avec simulation de trois dates", price: "290 €" }, { t: "Suivi annuel", x: "Mise à jour jusqu'au départ", price: "90 €/an" }] }],
        ["feat:checks", { title: "Apportez, si vous les avez", cta: ["Choisir un créneau", "/contact"], items: [{ t: "Votre relevé de carrière", x: "" }, { t: "Vos derniers bulletins de paie", x: "" }, { t: "Votre dernier avis d'imposition", x: "" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:map", { title: "Au cabinet", mapAddress: "11 rue Voltaire, 38000 Grenoble" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "9 h – 17 h"], ["Jeudi soir (visio)", "18 h – 20 h"]] }],
      ] },
    ],
  },
];
