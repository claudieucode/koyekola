// Technologie (lot B, 11 thèmes). Textes de DÉMONSTRATION : marques, personnes, tarifs et chiffres fictifs.
const T = (c, h, b, r, extra) => Object.assign({ colors: c, fonts: { heading: h, body: b, button: b, link: b }, radius: r }, extra || {});

module.exports = [
  // 1. Application mobile grand public
  {
    key: "vibrelo", name: "Vibrelo", category: "tech", tags: ["ludique", "moderne", "audacieux"], siteType: "Application mobile grand public", featured: true,
    description: "Thème vif pour une application mobile grand public : violet électrique, formes en pilules, bandeau en collage de captures, avis, tarifs en deux formules et FAQ.",
    brand: "Vibrelo",
    tokens: T({ primary: "#6d3df5", secondary: "#2a1670", accent: "#ff7a59", background: "#faf8ff", surface: "#f0ebff", text: "#1b1233", muted: "#5b5075" }, "font.unbounded", "font.mulish", { sm: 8, md: 16, lg: 28, button: 999, field: 16, card: 24 }, { shadow: { card: "md", button: "sm" } }),
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "vibrelo", motifs: ["blobs", "bokeh", "objects"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "Les nouveautés de l'appli, une fois par mois", sub: "Mises à jour, astuces et coulisses. Pas de spam.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Fonctionnalités", "/fonctionnalites"], ["Tarifs", "/tarifs"], ["Questions", "/questions"], ["Presse", "/presse"]], cta: ["Télécharger", "/contact"],
    contact: { address: "14 rue des Colporteurs, 44000 Nantes", phone: "02 40 00 11 22", email: "bonjour@vibrelo.example", hours: "Assistance du lundi au samedi, 9 h – 19 h", tagline: "Vos petites routines, enfin faciles." },
    social: ["instagram", "youtube", "tiktok"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Nouveau sur iOS et Android", title: "Gardez le rythme, sans y penser.", sub: "Vibrelo transforme vos habitudes en petits défis entre amis : rappels doux, séries à partager et bilans de la semaine.", cta: ["Télécharger l'appli", "/contact"], cta2: ["Voir les fonctionnalités", "/fonctionnalites"] }],
        ["proof:statsbar", { items: [["250 000", "défis lancés (exemple)"], ["4,7 / 5", "note moyenne (exemple)"], ["12", "pays"]] }],
        ["feat:icons", { eyebrow: "Pensé pour le quotidien", title: "Trois gestes, zéro prise de tête", items: [{ t: "Un défi en 10 secondes", x: "Choisissez une habitude, une durée, des amis. C'est parti.", icon: "zap" }, { t: "Des rappels qui respectent votre journée", x: "Notifications groupées, mode silence et heures calmes.", icon: "bell" }, { t: "Un bilan qui donne envie", x: "Chaque dimanche, un résumé illustré de votre semaine.", icon: "barChart" }] }],
        ["proof:quotes", { items: [{ q: "Je tiens enfin mes séances de marche, parce que mes collègues me voient décrocher !", n: "Camille R.", r: "utilisatrice, client fictif" }, { q: "L'interface est douce, rien ne culpabilise.", n: "Yanis B.", r: "utilisateur, client fictif" }, { q: "On l'utilise en famille pour les corvées, ça marche étonnamment bien.", n: "Mathilde D.", r: "utilisatrice, client fictif" }] }],
        ["cta:card", { title: "Prêt à lancer votre premier défi ?", sub: "Gratuit, sans carte bancaire.", cta: ["Télécharger", "/contact"] }]] },
      { key: "fonctionnalites", name: "Fonctionnalités", blocks: [
        ["misc:pagehead", { title: "Fonctionnalités", sub: "Tout ce qu'il faut pour tenir dans la durée." }],
        ["feat:alt", { items: [{ t: "Défis entre amis", x: "Créez un groupe, fixez un objectif commun et suivez la progression de chacun sans classement humiliant.", link: ["Voir les tarifs", "/tarifs"] }, { t: "Séries et récompenses", x: "Des badges originaux et des séries visuelles qui se remplissent jour après jour." }, { t: "Widgets et montre", x: "Cochez une habitude depuis l'écran d'accueil ou votre poignet." }] }],
        ["feat:grid-icons", { title: "Et aussi", items: [{ t: "Mode hors ligne", x: "Tout fonctionne sans réseau.", icon: "smartphone" }, { t: "Données sur votre téléphone", x: "Export possible à tout moment.", icon: "lock" }, { t: "Thèmes de couleurs", x: "Douze ambiances au choix.", icon: "palette" }, { t: "Rappels intelligents", x: "Au bon moment, pas à tout moment.", icon: "clock" }] }],
        ["cta:band", { title: "Essayez-le dès ce soir", cta: ["Télécharger", "/contact"] }]] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Gratuit pour commencer, Plus pour aller plus loin." }],
        ["price:tiers", { items: [{ t: "Gratuit", price: "0 €", period: "pour toujours", f: ["3 défis actifs", "Groupes jusqu'à 5 amis", "Bilan hebdomadaire"], cta: ["Commencer", "/contact"] }, { t: "Plus", price: "3,99 €", period: "par mois (exemple)", x: "Pour les routines ambitieuses", f: ["Défis illimités", "Groupes jusqu'à 30 personnes", "Widgets et montre", "Thèmes de couleurs"], cta: ["Essayer 14 jours", "/contact"], hl: true }] }],
        ["feat:compare", { title: "Gratuit ou Plus ?", rows: [["", "Gratuit", "Plus"], ["Défis actifs", "3", "Illimités"], ["Taille des groupes", "5", "30"], ["Widgets et montre", "non", "oui"]] }],
        ["misc:faq", { title: "Avant de choisir", items: [{ t: "Puis-je résilier à tout moment ?", x: "Oui, depuis les réglages de votre boutique d'applications." }, { t: "Y a-t-il une offre familiale ?", x: "Une formule famille est à l'étude, inscrivez-vous à la lettre pour être prévenu." }] }]] },
      { key: "questions", name: "Questions", blocks: [
        ["misc:pagehead", { title: "Questions fréquentes" }],
        ["feat:accordion", { items: [{ t: "L'appli est-elle vraiment gratuite ?", x: "La version de base l'est, sans limite de durée." }, { t: "Mes amis doivent-ils avoir un compte ?", x: "Oui, la création prend moins d'une minute." }, { t: "Comment supprimer mes données ?", x: "Dans Réglages > Confidentialité, un bouton efface tout." }, { t: "Quels téléphones sont compatibles ?", x: "iOS 16 et Android 10 ou plus récents." }] }],
        ["cta:split", { title: "Une autre question ?", sub: "Notre équipe répond en moins d'un jour ouvré.", cta: ["Nous écrire", "/contact"] }]] },
      { key: "presse", name: "Presse", blocks: [
        ["misc:pagehead", { title: "Presse et kit média" }],
        ["misc:text", { title: "L'histoire de Vibrelo", paras: ["Née dans un atelier nantais, Vibrelo est portée par une petite équipe qui croit que les bonnes habitudes se prennent à plusieurs.", "Kit média, logos et captures disponibles sur demande par e-mail."] }],
        ["proof:stats", { items: [["2022", "création"], ["9", "personnes dans l'équipe"], ["12", "pays couverts"]] }]] }
    ]
  },

  // 2. Startup hardware / objets connectés
  {
    key: "lumodule", name: "Lumodule", category: "tech", tags: ["sombre", "technique", "audacieux"], siteType: "Startup hardware et objets connectés",
    description: "Thème sombre à accent citron pour un objet connecté : bandeau affiche, fiche produit détaillée, comparatif de modèles et précommande par contact.",
    brand: "Lumodule",
    tokens: T({ primary: "#a3e635", secondary: "#1f2e22", accent: "#f59e0b", background: "#0e1411", surface: "#18211b", text: "#ecf3ee", muted: "#a3b3a8" }, "font.saira", "font.poppins", { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 6 }, { shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2c3d31" } }),
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "lumodule", motifs: ["plates", "rays", "tiles"] },
    head: ["head:dark", {}], foot: ["foot:columns", { about: "Lumodule conçoit à Grenoble des luminaires modulaires et connectés, réparables et mis à jour sur dix ans.", cols: [["Produits", "Module Aube", "Module Ciel", "Accessoires"], ["Aide", "Guides d'installation", "Garantie", "Contact"]] }],
    menu: [["Accueil", "/"], ["Produit", "/produit"], ["Comparer", "/comparer"], ["Technologie", "/technologie"], ["Précommande", "/precommande"]], cta: ["Précommander", "/precommande"],
    contact: { address: "3 avenue des Alpes, 38000 Grenoble", phone: "04 76 00 33 44", email: "contact@lumodule.example", hours: "Du lundi au vendredi, 9 h – 17 h 30", tagline: "La lumière qui s'adapte, et qui se répare." },
    social: ["youtube", "instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Précommandes ouvertes", title: "Une lumière qui suit votre journée", sub: "Module Aube : un luminaire modulaire qui ajuste sa teinte au rythme du soleil, sans compte obligatoire.", cta: ["Précommander", "/precommande"], cta2: ["Découvrir", "/produit"] }],
        ["misc:marquee", { items: ["Réparable à vie", "Mises à jour pendant 10 ans", "Fonctionne sans cloud", "Assemblé en France"] }],
        ["feat:bento", { title: "Conçu pour durer", items: [{ t: "Modules interchangeables", x: "Source, pilote et capteur se remplacent séparément avec un simple tournevis.", icon: "layers" }, { t: "Mode local", x: "Fonctionne sans internet.", icon: "shield" }, { t: "Capteur de présence", x: "S'éteint quand la pièce est vide.", icon: "eye" }] }],
        ["proof:stats", { title: "En chiffres (exemples)", items: [["92 %", "de pièces recyclables"], ["2 700 K", "à 6 500 K de teinte"], ["8 W", "de consommation moyenne"]] }],
        ["feat:steps", { title: "Du carton au salon en trois temps", items: [{ t: "Clipsez", x: "Le socle se fixe sur tout rail standard.", d: "1" }, { t: "Appairez", x: "Application ou bouton physique, au choix.", d: "2" }, { t: "Oubliez", x: "La teinte suit le soleil toute l'année.", d: "3" }] }],
        ["cta:image", { title: "Livraison prévue au printemps", sub: "Quantité limitée pour la première série.", cta: ["Réserver le mien", "/precommande"] }]] },
      { key: "produit", name: "Produit", blocks: [
        ["misc:pagehead", { title: "Module Aube" }],
        ["misc:product", { eyebrow: "Série 1", title: "Module Aube", price: "189 €", text: "Un luminaire modulaire de bureau et de chevet, avec capteur de lumière du jour et variation de teinte.", points: ["Pilote remplaçable", "Prise USB-C", "Application facultative", "Garantie 5 ans"], cta: "Précommander", url: "/precommande", note: "Prix et caractéristiques indicatifs, démonstration." }],
        ["feat:list2", { title: "Dans la boîte", items: [{ t: "Module lumineux" }, { t: "Socle aimanté" }, { t: "Câble USB-C 1,5 m" }, { t: "Guide illustré" }] }]] },
      { key: "comparer", name: "Comparer", blocks: [
        ["misc:pagehead", { title: "Comparer les modèles" }],
        ["feat:compare", { title: "Aube ou Ciel ?", rows: [["", "Aube", "Ciel"], ["Usage", "Bureau, chevet", "Plafond, salon"], ["Puissance", "8 W", "24 W"], ["Capteur de présence", "oui", "oui"], ["Prix", "189 €", "329 €"]] }],
        ["cta:band", { title: "Encore un doute ?", cta: ["Parler à l'équipe", "/contact"] }]] },
      { key: "technologie", name: "Technologie", blocks: [
        ["misc:pagehead", { title: "Technologie" }],
        ["feat:tabs", { items: [{ t: "Optique", x: "Diffuseur opalin qui supprime l'éblouissement et le scintillement." }, { t: "Électronique", x: "Pilote conçu pour être remplacé, carte documentée et ouverte." }, { t: "Logiciel", x: "Micrologiciel mis à jour sans compte, avec journal public des versions." }] }],
        ["proof:big", { items: [{ q: "On a voulu faire l'inverse de l'obsolescence : tout est démontable.", n: "Équipe Lumodule", r: "fondateurs" }] }]] },
      { key: "precommande", name: "Précommande", blocks: [
        ["misc:pagehead", { title: "Précommande" }],
        ["misc:text", { title: "Comment ça marche", paras: ["Aucun paiement n'est demandé sur ce site de démonstration : écrivez-nous pour réserver un exemplaire, nous vous recontactons avec les modalités.", "Livraison estimée en France métropolitaine."] }],
        ["contact:info", { title: "Réserver mon exemplaire", formTitle: "Je précommande", formIntro: "Indiquez le modèle souhaité.", cta: ["Envoyer", "/contact"] }]] }
    ]
  },

  // 3. Communauté open source
  {
    key: "libreforge", name: "Libreforge", category: "tech", tags: ["technique", "editorial", "naturel"], siteType: "Communauté et projet open source",
    description: "Thème éditorial et technique pour un projet libre : titres en chasse fixe, vert forêt sur papier crème, documentation, feuille de route et appel aux contributions.",
    brand: "Libreforge",
    tokens: T({ primary: "#15803d", secondary: "#0f3d24", accent: "#d97706", background: "#f7f6f0", surface: "#ecebe0", text: "#14211a", muted: "#4d5b52" }, "font.jetbrains-mono", "font.public-sans", { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 4 }, { shadow: { card: "none", button: "none" }, border: { width: 1, color: "#cfcdb9" } }),
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "libreforge", motifs: ["tiles", "topo", "plates"] },
    head: ["head:minimal", {}], foot: ["foot:center", { about: "Libreforge est un projet communautaire sous licence libre. Le code, la documentation et les décisions sont publics." }],
    menu: [["Accueil", "/"], ["Documentation", "/documentation"], ["Contribuer", "/contribuer"], ["Feuille de route", "/feuille-de-route"], ["Communauté", "/communaute"]], cta: ["Lire le guide", "/documentation"],
    contact: { address: "Association Libreforge, 21 rue du Partage, 31000 Toulouse", phone: "05 61 00 55 66", email: "equipe@libreforge.example", hours: "Réunion publique le premier jeudi du mois, 19 h", tagline: "Un outil de build libre, écrit en commun." },
    social: ["github", "mastodon", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Version 3.2 disponible", title: "Construisez, testez, livrez. En liberté.", sub: "Libreforge est un système de build reproductible, sous licence libre, maintenu par 140 contributeurs bénévoles (chiffre d'exemple).", cta: ["Démarrer en 5 minutes", "/documentation"], cta2: ["Contribuer", "/contribuer"] }],
        ["feat:rows", { eyebrow: "Principes", title: "Ce que nous défendons", items: [{ t: "Reproductible", x: "Le même code produit le même binaire, sur votre machine comme sur la nôtre." }, { t: "Lisible", x: "Une configuration courte, des erreurs expliquées, une documentation relue." }, { t: "Gouverné en commun", x: "Les décisions se prennent en public, par propositions ouvertes." }] }],
        ["proof:stats", { items: [["140", "contributeurs"], ["3 200", "étoiles (exemple)"], ["58", "langues de messages"], ["9 ans", "d'existence"]] }],
        ["gal:cards", { title: "Écosystème", items: [{ t: "libreforge-cache", x: "Cache distant mutualisé.", tag: "Extension" }, { t: "forge-ci", x: "Modèles d'intégration continue.", tag: "Outil" }, { t: "forge-docs", x: "Générateur de documentation.", tag: "Outil" }] }],
        ["cta:split", { title: "Premier ticket, première contribution", sub: "Des tâches « bienvenue aux débutants » sont étiquetées toute l'année.", cta: ["Voir comment contribuer", "/contribuer"] }]] },
      { key: "documentation", name: "Documentation", blocks: [
        ["misc:pagehead", { title: "Documentation" }],
        ["feat:steps", { title: "Prise en main", items: [{ t: "Installer", x: "Un binaire statique pour Linux, macOS et Windows.", d: "01" }, { t: "Initialiser", x: "La commande init crée un fichier de configuration commenté.", d: "02" }, { t: "Construire", x: "La première compilation remplit le cache local.", d: "03" }] }],
        ["feat:accordion", { title: "Dépannage", items: [{ t: "Le cache ne se remplit pas", x: "Vérifiez les droits d'écriture du dossier de cache." }, { t: "Un paquet est introuvable", x: "Lancez la commande de diagnostic pour lister les dépôts actifs." }] }],
        ["cta:band", { title: "Une erreur dans la doc ?", cta: ["Proposer une correction", "/contribuer"] }]] },
      { key: "contribuer", name: "Contribuer", blocks: [
        ["misc:pagehead", { title: "Contribuer" }],
        ["feat:checks", { title: "Toute aide compte", cta: ["Lire la charte", "/communaute"], items: [{ t: "Corriger une faute dans la documentation" }, { t: "Traduire les messages d'erreur" }, { t: "Reproduire et qualifier un bogue" }, { t: "Écrire une extension" }, { t: "Répondre aux questions du forum" }] }],
        ["misc:text", { title: "Notre manière de travailler", paras: ["Chaque modification passe par une proposition publique, relue par au moins deux personnes. Le code de conduite s'applique partout.", "Nous ne demandons jamais de cession de droits : vous restez auteur de votre code."] }]] },
      { key: "feuille-de-route", name: "Feuille de route", blocks: [
        ["misc:pagehead", { title: "Feuille de route" }],
        ["misc:schedule", { title: "Prochaines versions", items: [{ d: "T1", t: "3.3 Cache distant signé", x: "Vérification cryptographique des artefacts." }, { d: "T2", t: "3.4 Mode hors ligne complet", x: "Miroir local des dépôts." }, { d: "T3", t: "4.0 Nouveau format de configuration", x: "Migration automatique prévue." }] }],
        ["misc:quote", { text: "La feuille de route n'est qu'une promesse d'effort, pas de date.", by: "Équipe de maintenance" }]] },
      { key: "communaute", name: "Communauté", blocks: [
        ["misc:pagehead", { title: "Communauté" }],
        ["proof:team", { items: [{ n: "Salomé V.", r: "Mainteneuse du noyau" }, { n: "Oumar T.", r: "Documentation" }, { n: "Brice L.", r: "Intégration continue" }, { n: "Iris M.", r: "Modération" }] }],
        ["contact:info", { title: "Nous rejoindre", formTitle: "Dire bonjour", formIntro: "Une présentation, une question, une idée.", cta: ["Envoyer", "/contact"] }]] }
    ]
  },

  // 4. Agence / ESN de développement
  {
    key: "codebrise", name: "Codebrise", category: "tech", tags: ["classique", "moderne", "geometrique"], siteType: "ESN et agence de développement logiciel",
    description: "Thème sobre et rassurant pour une ESN : bleu franc sur fond blanc, bandeau avec chiffres, expertises en bandes, cas clients et équipe, pied de page à grand nom.",
    brand: "Codebrise",
    tokens: T({ primary: "#1d4ed8", secondary: "#0b1f4d", accent: "#f97316", background: "#ffffff", surface: "#eef3fc", text: "#0f1d3a", muted: "#49566f" }, "font.chivo", "font.literata", { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, { shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d3dcee" } }),
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "codebrise", motifs: ["skyline", "tiles", "waves"] },
    head: ["head:topbar", { info: "Rennes · 04 99 00 77 88", note: "Intervient en France et en Europe" }], foot: ["foot:big", { title: "Codebrise" }],
    menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["Références", "/references"], ["Méthode", "/methode"], ["Carrières", "/carrieres"]], cta: ["Parlons de votre projet", "/contact"],
    contact: { address: "27 quai Lamennais, 35000 Rennes", phone: "02 99 00 77 88", email: "projets@codebrise.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h", tagline: "Du logiciel solide, livré par étapes." },
    social: ["linkedin", "github"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "ESN de 60 développeurs (exemple)", title: "Vos logiciels métier, conçus pour durer.", sub: "Applications web, mobiles et intégrations : une équipe pluridisciplinaire qui s'engage sur les délais et sur la qualité du code.", cta: ["Parlons de votre projet", "/contact"], stats: [["14 ans", "d'existence"], ["180", "projets livrés"], ["92 %", "clients fidèles (exemple)"]] }],
        ["feat:strips", { title: "Nos expertises", items: [{ t: "Applications web", x: "Portails, back-offices et plateformes métier." }, { t: "Applications mobiles", x: "iOS, Android et multiplateforme." }, { t: "Intégration et données", x: "Interfaces entre systèmes, entrepôts de données." }, { t: "Assistance et maintenance", x: "Évolutions, surveillance, astreinte." }] }],
        ["proof:logos", { title: "Ils nous ont confié leurs projets (noms fictifs)", items: ["Armatis Santé", "Port de Kerlouan", "Mutuelle Ovalie", "Brasserie Tonnelle"] }],
        ["gal:featured", { title: "Réalisations récentes", items: [{ t: "Suivi de flotte", x: "Application de tournées pour un transporteur.", tag: "Logistique" }, { t: "Portail adhérents", x: "Espace en ligne d'une mutuelle.", tag: "Assurance" }, { t: "Planning ateliers", x: "Outil de planification industrielle.", tag: "Industrie" }, { t: "Billetterie", x: "Réservation pour un festival.", tag: "Culture" }] }],
        ["proof:quotes", { items: [{ q: "Livraison à la date promise et code que nos équipes ont pu reprendre.", n: "Hélène A.", r: "DSI, client fictif" }, { q: "Un interlocuteur unique, des points d'avancement clairs.", n: "Julien P.", r: "directeur des opérations, client fictif" }] }],
        ["cta:band", { title: "Un projet à cadrer ?", sub: "Atelier de cadrage d'une demi-journée, offert.", cta: ["Prendre contact", "/contact"] }]] },
      { key: "expertises", name: "Expertises", blocks: [
        ["misc:pagehead", { title: "Expertises" }],
        ["feat:alt", { items: [{ t: "Conception d'applications web", x: "Ateliers utilisateurs, maquettes, développement itératif et recette.", link: ["Notre méthode", "/methode"] }, { t: "Mobilité", x: "Applications natives et multiplateformes avec mode hors connexion." }, { t: "Reprise de code existant", x: "Audit, documentation, remise à niveau et transfert de compétences." }] }],
        ["feat:pricelist", { title: "Formats d'intervention (tarifs indicatifs)", items: [{ t: "Atelier de cadrage", x: "1 demi-journée", price: "Offert" }, { t: "Audit de code", x: "5 jours", price: "À partir de 6 500 €" }, { t: "Forfait projet", x: "Sur devis", price: "Sur devis" }, { t: "Régie", x: "Par jour", price: "650 € HT / jour" }] }]] },
      { key: "references", name: "Références", blocks: [
        ["misc:pagehead", { title: "Références" }],
        ["gal:cards", { items: [{ t: "Suivi de flotte", x: "Réduction du temps de planification de moitié (exemple).", tag: "Logistique" }, { t: "Portail adhérents", x: "Démarches en ligne pour 80 000 membres (exemple).", tag: "Assurance" }, { t: "Planning ateliers", x: "Vue unique des machines et des équipes.", tag: "Industrie" }] }],
        ["proof:big", { items: [{ q: "Ils ont su dire non quand il le fallait, et c'est ce qui a sauvé le projet.", n: "Sophie G.", r: "cheffe de projet, client fictif" }] }]] },
      { key: "methode", name: "Méthode", blocks: [
        ["misc:pagehead", { title: "Notre méthode" }],
        ["feat:steps", { items: [{ t: "Cadrer", x: "Objectifs, utilisateurs, budget.", d: "S1" }, { t: "Prototyper", x: "Maquette cliquable testée avec vos équipes.", d: "S2-3" }, { t: "Construire", x: "Livraison tous les 15 jours.", d: "S4+" }, { t: "Faire vivre", x: "Surveillance et évolutions.", d: "Après" }] }],
        ["feat:accordion", { items: [{ t: "Qui est propriétaire du code ?", x: "Vous, dès le paiement de chaque livraison." }, { t: "Travaillez-vous à distance ?", x: "Oui, avec des déplacements à chaque jalon." }] }]] },
      { key: "carrieres", name: "Carrières", blocks: [
        ["misc:pagehead", { title: "Carrières" }],
        ["feat:cards", { title: "Postes ouverts (exemples)", items: [{ t: "Développeur·se back-end", x: "CDI, Rennes ou télétravail partiel.", icon: "briefcase" }, { t: "Concepteur·rice UX", x: "CDI, Rennes.", icon: "palette" }, { t: "Alternance développeur", x: "12 à 24 mois.", icon: "graduation" }] }],
        ["contact:cards", { title: "Postuler" }]] }
    ]
  },

  // 5. Studio de jeu vidéo
  {
    key: "pixelvore", name: "Pixelvore", category: "tech", tags: ["sombre", "ludique", "audacieux"], siteType: "Studio de jeu vidéo indépendant", featured: true,
    description: "Thème sombre néon pour un studio indépendant : rose vif sur nuit violette, affiche géante, galerie de captures, journal de développement et page presse.",
    brand: "Pixelvore Studio",
    tokens: T({ primary: "#f0489f", secondary: "#2d1a45", accent: "#5eead4", background: "#150d1f", surface: "#231634", text: "#f5eefb", muted: "#bfaed3" }, "font.bungee", "font.rubik", { sm: 0, md: 4, lg: 8, button: 4, field: 4, card: 8 }, { shadow: { card: "lg", button: "md" }, border: { width: 2, color: "#3d2760" } }),
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "pixelvore", motifs: ["halftone", "ribbons", "objects"] },
    head: ["head:split", {}], foot: ["foot:line", {}],
    menu: [["Jeux", "/jeux"], ["Journal", "/journal"], ["Presse", "/presse"], ["Équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Ajouter à la liste", "/contact"],
    contact: { address: "9 rue de l'Arcade, 59000 Lille", phone: "03 20 00 99 00", email: "salut@pixelvore.example", hours: "Réponse sous 3 jours ouvrés", tagline: "De petits jeux qui mordent." },
    social: ["youtube", "twitch", "discord"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Sortie prévue cet hiver (exemple)", title: "Rampez. Dévorez. Évoluez.", sub: "Gloutonia est un jeu d'action-puzzle où vous contrôlez une créature affamée dans des cavernes qui se reconstruisent à chaque partie.", cta: ["Ajouter à la liste de souhaits", "/jeux"], cta2: ["Lire le journal", "/journal"] }],
        ["gal:strip", { title: "Captures d'écran" , items: [{ t: "Cavernes" }, { t: "Boss" }, { t: "Boutique" }, { t: "Duel" }, { t: "Crépuscule" }] }],
        ["feat:numbered", { title: "Trois raisons de mordre", items: [{ t: "Cavernes vivantes", x: "Chaque partie recompose les salles." }, { t: "Coopération locale", x: "Jusqu'à quatre manettes sur un même écran." }, { t: "Bande originale", x: "Quarante minutes de synthés composés pour le jeu." }] }],
        ["proof:quotes", { items: [{ q: "Un démarrage immédiat et une difficulté très bien dosée.", n: "Joueur de la bêta", r: "testeur, client fictif" }, { q: "J'ai perdu une soirée entière. Merci.", n: "Lou K.", r: "testeuse, cliente fictive" }] }],
        ["cta:image", { title: "Rejoignez la bêta fermée", sub: "Cent places, tirage au sort chaque mois.", cta: ["Je m'inscris", "/contact"] }]] },
      { key: "jeux", name: "Jeux", blocks: [
        ["misc:pagehead", { title: "Nos jeux" }],
        ["gal:cards", { items: [{ t: "Gloutonia", x: "Action-puzzle, 1 à 4 joueurs.", tag: "À venir" }, { t: "Mini-Mutin", x: "Jeu de plateau cartes, mobile.", tag: "Sorti" }, { t: "Nocturne 8-bit", x: "Prototype de jam, gratuit.", tag: "Gratuit" }] }],
        ["misc:product", { title: "Gloutonia", price: "14,99 €", text: "Prix annoncé à titre d'exemple. Disponible sur ordinateur et consoles de salon.", points: ["Coopération locale", "Manette conseillée", "Sous-titres en 6 langues"], cta: "Suivre le jeu", url: "/contact" }],
        ["feat:compare", { title: "Plateformes", rows: [["", "Ordinateur", "Console"], ["Sortie", "Hiver", "Printemps"], ["Coopération locale", "oui", "oui"]] }]] },
      { key: "journal", name: "Journal de développement", blocks: [
        ["misc:pagehead", { title: "Journal de développement" }],
        ["misc:posts", { title: "Dernières notes", count: 3, layout: "list" }],
        ["feat:steps", { title: "Jalons", items: [{ t: "Prototype", x: "Boucle de jeu validée.", d: "2023" }, { t: "Bêta fermée", x: "Retours des joueurs.", d: "2024" }, { t: "Sortie", x: "Fenêtre hivernale.", d: "2025" }] }]] },
      { key: "presse", name: "Presse", blocks: [
        ["misc:pagehead", { title: "Kit presse" }],
        ["feat:list2", { title: "Dans le dossier", items: [{ t: "Logos et capsules" }, { t: "Captures en haute définition" }, { t: "Bande-annonce" }, { t: "Fiche technique" }] }],
        ["cta:card", { title: "Clé de presse", sub: "Demandez une clé d'évaluation.", cta: ["Écrire au studio", "/contact"] }]] },
      { key: "equipe", name: "Équipe", blocks: [
        ["misc:pagehead", { title: "Le studio" }],
        ["proof:team", { items: [{ n: "Anaïs F.", r: "Direction créative" }, { n: "Kevin O.", r: "Programmation" }, { n: "Mira S.", r: "Art" }, { n: "Théo N.", r: "Son" }] }],
        ["misc:story", { title: "Nés d'une game jam", paras: ["Cinq amis, un week-end, une créature qui mange tout. Trois ans plus tard, le studio compte sept personnes."], image: "portrait-1" }]] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Écrire au studio" }],
        ["cta:band", { title: "Presse, partenariats, bêta", cta: ["Écrire", "/contact"] }]] }
    ]
  },

  // 6. IoT industriel
  {
    key: "nervomat", name: "Nervomat", category: "tech", tags: ["sombre", "technique", "classique"], siteType: "IoT industriel et supervision d'atelier",
    description: "Thème sombre industriel pour capteurs et supervision : jaune sécurité sur anthracite, titres condensés, tableaux de caractéristiques et études de cas d'usine.",
    brand: "Nervomat",
    tokens: T({ primary: "#facc15", secondary: "#232a33", accent: "#38bdf8", background: "#111418", surface: "#1b2027", text: "#eef0f3", muted: "#a9b0ba" }, "font.barlow-condensed", "font.barlow", { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, { shadow: { card: "none", button: "none" }, border: { width: 1, color: "#333c47" }, type: { h1: { size: 60, weight: 700, lineHeight: 1, letterSpacing: 0, transform: "uppercase" }, h2: { size: 38, weight: 700, lineHeight: 1.05, letterSpacing: 0.01, transform: "uppercase" } } }),
    dna: { scale: "l", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "nervomat", motifs: ["plates", "mesh", "topo"] },
    head: ["head:side", {}], foot: ["foot:simple", { about: "Capteurs industriels, passerelles et supervision pour sites de production.", cols: [["Solutions", "Maintenance prédictive", "Suivi énergétique", "Traçabilité"], ["Société", "Études de cas", "Normes", "Contact"]] }],
    menu: [["Accueil", "/"], ["Solutions", "/solutions"], ["Matériel", "/materiel"], ["Études de cas", "/cas"], ["Normes", "/normes"]], cta: ["Demander une démo", "/contact"],
    contact: { address: "Zone industrielle des Trois Ponts, 57000 Metz", phone: "03 87 00 12 34", email: "industrie@nervomat.example", hours: "Du lundi au vendredi, 7 h 30 – 17 h", tagline: "Voyez vos machines avant qu'elles ne tombent en panne." },
    social: ["linkedin", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Maintenance prédictive", title: "Chaque machine a quelque chose à dire.", sub: "Capteurs de vibration, de température et de courant, passerelles robustes et tableau de bord pour piloter votre atelier.", cta: ["Demander une démo", "/contact"], cta2: ["Voir le matériel", "/materiel"] }],
        ["proof:statsbar", { items: [["-30 %", "arrêts non planifiés (exemple)"], ["1 200", "capteurs installés"], ["IP67", "indice de protection"]] }],
        ["feat:icons", { title: "Trois briques", items: [{ t: "Capteurs", x: "Vibration, température, courant, humidité.", icon: "activity" }, { t: "Passerelles", x: "LoRa, Ethernet et 4G, alimentation redondante.", icon: "network" }, { t: "Supervision", x: "Alertes, historique et rapports de maintenance.", icon: "monitor" }] }],
        ["feat:alt", { items: [{ t: "Maintenance prédictive", x: "Détection des dérives avant la casse, avec seuils réglables par type de machine.", link: ["Voir la solution", "/solutions"] }, { t: "Suivi énergétique", x: "Consommation par ligne, par poste, par équipe." }] }],
        ["proof:quotes", { items: [{ q: "Nous avons évité deux arrêts de ligne dès le premier trimestre.", n: "Marc D.", r: "responsable maintenance, client fictif" }] }],
        ["cta:split", { title: "Un site pilote en six semaines", sub: "Diagnostic, pose et formation inclus.", cta: ["Demander une démo", "/contact"] }]] },
      { key: "solutions", name: "Solutions", blocks: [
        ["misc:pagehead", { title: "Solutions" }],
        ["feat:tabs", { items: [{ t: "Maintenance prédictive", x: "Analyse de vibration et alertes précoces." }, { t: "Suivi énergétique", x: "Cartographie des consommations." }, { t: "Traçabilité", x: "Suivi des lots de la réception à l'expédition." }] }],
        ["feat:steps", { title: "Déploiement", items: [{ t: "Audit du site", x: "Visite et repérage.", d: "S1" }, { t: "Pose", x: "Sans arrêt de production.", d: "S2-3" }, { t: "Mise en service", x: "Réglage des seuils.", d: "S4-6" }] }]] },
      { key: "materiel", name: "Matériel", blocks: [
        ["misc:pagehead", { title: "Matériel" }],
        ["gal:products", { items: [{ t: "Capteur VIB-3", x: "Vibration 3 axes.", price: "240 €" }, { t: "Capteur TMP-1", x: "Température sans fil.", price: "95 €" }, { t: "Pince CUR-2", x: "Mesure de courant.", price: "130 €" }, { t: "Passerelle GW-4", x: "LoRa et 4G.", price: "690 €" }] }],
        ["feat:compare", { title: "Caractéristiques", rows: [["", "VIB-3", "GW-4"], ["Protection", "IP67", "IP65"], ["Autonomie", "5 ans", "Secteur"], ["Portée", "800 m", "5 km"]] }]] },
      { key: "cas", name: "Études de cas", blocks: [
        ["misc:pagehead", { title: "Études de cas" }],
        ["gal:cards", { items: [{ t: "Fonderie de Sarrebruck", x: "Surveillance de 40 moteurs.", tag: "Métallurgie" }, { t: "Laiterie Val-Clair", x: "Suivi de la chaîne du froid.", tag: "Agroalimentaire" }, { t: "Imprimerie Lorraine", x: "Réduction des micro-arrêts.", tag: "Impression" }] }],
        ["proof:stats", { items: [["-18 %", "énergie"], ["4 mois", "retour sur investissement"], ["0", "arrêt imprévu sur 6 mois"]] }]] },
      { key: "normes", name: "Normes", blocks: [
        ["misc:pagehead", { title: "Normes et sécurité" }],
        ["feat:list2", { title: "Conformité", items: [{ t: "Marquage CE" }, { t: "Chiffrement des échanges" }, { t: "Hébergement en Europe" }, { t: "Données restant la propriété du client" }] }],
        ["misc:faq", { items: [{ t: "Les capteurs sont-ils certifiés ATEX ?", x: "Une gamme certifiée est à l'étude, contactez-nous." }, { t: "Puis-je héberger la supervision chez moi ?", x: "Oui, installation sur serveur local possible." }] }]] }
    ]
  },

  // 7. Edtech
  {
    key: "savantine", name: "Savantine", category: "tech", tags: ["chaleureux", "ludique", "moderne"], siteType: "Plateforme d'apprentissage en ligne (edtech)",
    description: "Thème chaleureux pour une plateforme éducative : orange doux sur fond crème, titres arrondis, parcours d'apprentissage, cartes de cours et tarifs scolaires.",
    brand: "Savantine",
    tokens: T({ primary: "#c2410c", secondary: "#7c2d12", accent: "#0d9488", background: "#fffaf5", surface: "#ffeedd", text: "#2b1608", muted: "#6b4a33" }, "font.baloo-2", "font.dm-sans", { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 20 }, { shadow: { card: "sm", button: "none" } }),
    dna: { scale: "m", pad: "airy", align: "center", shape: "soft" }, art: { seed: "savantine", motifs: ["botanical", "blobs", "arches"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Savantine accompagne les élèves du CM1 à la troisième avec des parcours courts, des exercices corrigés et des tuteurs humains.", cols: [["Apprendre", "Mathématiques", "Français", "Langues"], ["Parents et écoles", "Tarifs", "Suivi des progrès", "Contact"]] }],
    menu: [["Accueil", "/"], ["Parcours", "/parcours"], ["Cours", "/cours"], ["Tarifs", "/tarifs"], ["Parents", "/parents"]], cta: ["Essai gratuit", "/contact"],
    contact: { address: "5 place des Écoliers, 87000 Limoges", phone: "05 55 00 21 21", email: "classe@savantine.example", hours: "Tuteurs disponibles de 16 h à 20 h", tagline: "Comprendre, puis progresser." },
    social: ["youtube", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Du CM1 à la troisième", title: "Apprendre à son rythme, avec quelqu'un à côté.", sub: "Des parcours courts, des exercices corrigés pas à pas et des tuteurs humains pour débloquer les notions difficiles.", cta: ["Essai gratuit 7 jours", "/contact"], cta2: ["Voir les parcours", "/parcours"] }],
        ["feat:steps", { title: "Comment ça se passe", items: [{ t: "Un test de départ", x: "Dix minutes pour repérer les acquis.", d: "1" }, { t: "Un parcours sur mesure", x: "Séances de vingt minutes.", d: "2" }, { t: "Un tuteur au besoin", x: "Question posée, réponse sous une heure.", d: "3" }] }],
        ["gal:coursecards", { title: "Parcours à la une (démonstration)", items: [{ t: "Fractions sans peur", x: "12 séances", tag: "5e", price: "Inclus", cta: ["Voir", "/cours"] }, { t: "Conjugaison en jeu", x: "15 séances", tag: "CM2", price: "Inclus", cta: ["Voir", "/cours"] }, { t: "Initiation à l'anglais", x: "20 séances", tag: "6e", price: "Inclus", cta: ["Voir", "/cours"] }] }],
        ["proof:big", { items: [{ q: "Ma fille a repris confiance en mathématiques en deux mois.", n: "Nadia K.", r: "parent d'élève, cliente fictive" }] }],
        ["proof:stats", { items: [["320", "exercices corrigés (exemple)"], ["40", "tuteurs"], ["7 jours", "d'essai"]] }],
        ["cta:band", { title: "Premier cours offert", cta: ["Commencer", "/contact"] }]] },
      { key: "parcours", name: "Parcours", blocks: [
        ["misc:pagehead", { title: "Parcours" }],
        ["feat:rows", { items: [{ t: "Mathématiques", x: "Calcul, géométrie, problèmes, du CM1 à la 3e." }, { t: "Français", x: "Grammaire, conjugaison, rédaction." }, { t: "Langues", x: "Anglais et espagnol, oral et écrit." }, { t: "Méthodes de travail", x: "Organiser ses révisions." }] }],
        ["feat:bento", { title: "Ce qui rend l'apprentissage doux", items: [{ t: "Sans note", x: "Des étoiles de progression, pas de classement.", icon: "star" }, { t: "Tuteur", x: "Un humain répond.", icon: "users" }, { t: "Hors ligne", x: "Fiches à imprimer.", icon: "printer" }] }]] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Catalogue de cours" }],
        ["misc:courses", {}],
        ["cta:card", { title: "Un cours manque ?", sub: "Dites-nous ce que vous cherchez.", cta: ["Nous écrire", "/contact"] }]] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Élève", price: "12 €", period: "par mois (exemple)", f: ["Tous les parcours", "Exercices corrigés", "Forum d'entraide"], cta: ["Essayer", "/contact"] }, { t: "Famille", price: "24 €", period: "par mois (exemple)", f: ["Jusqu'à 3 enfants", "Tuteur illimité", "Bilan mensuel"], cta: ["Essayer", "/contact"], hl: true }, { t: "École", price: "Sur devis", f: ["Classes entières", "Tableau de bord enseignant", "Formation incluse"], cta: ["Demander un devis", "/contact"] }] }],
        ["misc:faq", { items: [{ t: "Puis-je arrêter quand je veux ?", x: "Oui, sans frais." }, { t: "Les tuteurs sont-ils des enseignants ?", x: "Ce sont des étudiants et enseignants formés par nos soins." }] }]] },
      { key: "parents", name: "Parents", blocks: [
        ["misc:pagehead", { title: "Espace parents" }],
        ["feat:checks", { title: "Ce que vous suivez", cta: ["Créer un compte", "/contact"], items: [{ t: "Temps passé par séance" }, { t: "Notions acquises" }, { t: "Difficultés repérées" }, { t: "Conseils pour accompagner" }] }],
        ["misc:text", { title: "Notre engagement", paras: ["Pas de publicité, pas de revente de données : nous protégeons l'intimité des élèves."] }]] }
    ]
  },

  // 8. Plateforme de santé numérique
  {
    key: "sanevia", name: "Sanevia", category: "tech", tags: ["moderne", "minimaliste", "chaleureux"], siteType: "Plateforme de santé numérique (suivi du bien-être)",
    description: "Thème apaisant pour une plateforme de santé numérique : sarcelle sur fond laiteux, serif doux, rendez-vous et ressources de prévention, sans promesse médicale.",
    brand: "Sanevia",
    tokens: T({ primary: "#0f766e", secondary: "#134e4a", accent: "#f59e0b", background: "#f4fbfa", surface: "#e1f3f1", text: "#0d2926", muted: "#43605c" }, "font.dm-serif-display", "font.cabin", { sm: 6, md: 12, lg: 18, button: 12, field: 10, card: 16 }, { shadow: { card: "sm", button: "none" } }),
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "sanevia", motifs: ["waves", "botanical", "arches"] },
    head: ["head:bar", {}], foot: ["foot:newsletter", { title: "Un conseil bien-être par semaine", sub: "Informations générales de prévention, rien de plus.", button: "S'inscrire" }],
    menu: [["Accueil", "/"], ["Le service", "/service"], ["Ressources", "/ressources"], ["Tarifs", "/tarifs"], ["Confidentialité", "/confidentialite"]], cta: ["Créer mon espace", "/contact"],
    contact: { address: "11 boulevard des Simples, 49000 Angers", phone: "02 41 00 45 45", email: "accueil@sanevia.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Votre carnet de bien-être, simplement." },
    social: ["linkedin", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Carnet de bien-être numérique", title: "Mieux comprendre son quotidien, sereinement.", sub: "Sanevia vous aide à noter sommeil, activité et humeur, à préparer vos échanges avec vos professionnels de santé et à retrouver vos documents. Le service ne remplace pas un avis médical.", cta: ["Créer mon espace", "/contact"], cta2: ["Découvrir le service", "/service"] }],
        ["feat:grid-icons", { title: "Un carnet, quatre usages", items: [{ t: "Suivi", x: "Sommeil, pas, humeur.", icon: "activity" }, { t: "Rappels", x: "Rendez-vous et renouvellements.", icon: "calendarClock" }, { t: "Documents", x: "Comptes rendus classés.", icon: "fileText" }, { t: "Préparer ses questions", x: "Une liste avant chaque consultation.", icon: "help" }] }],
        ["misc:story", { eyebrow: "Notre approche", title: "Un outil qui accompagne, sans diagnostiquer", paras: ["Sanevia ne délivre ni diagnostic ni conseil médical. Il aide à organiser l'information pour mieux dialoguer avec les soignants."], image: "portrait-1" }],
        ["proof:quotes", { items: [{ q: "Je retrouve enfin mes ordonnances au même endroit.", n: "Paulette M.", r: "utilisatrice, cliente fictive" }, { q: "Mes notes de sommeil rendent mes rendez-vous plus utiles.", n: "Rémi C.", r: "utilisateur, client fictif" }] }],
        ["proof:stats", { items: [["100 %", "données chiffrées"], ["Europe", "hébergement"], ["0", "publicité"]] }],
        ["cta:image", { title: "Prenez soin de votre information", cta: ["Créer mon espace", "/contact"] }]] },
      { key: "service", name: "Le service", blocks: [
        ["misc:pagehead", { title: "Le service" }],
        ["feat:alt", { items: [{ t: "Mon carnet", x: "Saisissez en trente secondes votre ressenti du jour, consultez les tendances de la semaine.", link: ["Voir les tarifs", "/tarifs"] }, { t: "Mes rendez-vous", x: "Rappels discrets et liste de questions à préparer." }, { t: "Mes documents", x: "Dépôt sécurisé, classement par date et par professionnel." }] }],
        ["misc:text", { title: "Ce que le service ne fait pas", paras: ["Sanevia n'établit aucun diagnostic, ne remplace aucune consultation et ne gère pas les urgences. En cas de doute ou d'urgence, contactez un professionnel de santé ou le 15."] }]] },
      { key: "ressources", name: "Ressources", blocks: [
        ["misc:pagehead", { title: "Ressources de prévention" }],
        ["misc:posts", { title: "Guides pratiques", count: 3, layout: "grid" }],
        ["feat:list2", { title: "Thèmes", items: [{ t: "Sommeil" }, { t: "Activité douce" }, { t: "Alimentation" }, { t: "Gestion du stress" }] }]] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Essentiel", price: "0 €", f: ["Carnet de suivi", "Rappels", "5 documents"], cta: ["Créer mon espace", "/contact"] }, { t: "Confort", price: "4,90 €", period: "par mois (exemple)", f: ["Documents illimités", "Partage temporaire avec un proche", "Export du carnet"], cta: ["Essayer", "/contact"], hl: true }] }],
        ["misc:faq", { items: [{ t: "Mes données sont-elles revendues ?", x: "Jamais." }, { t: "Puis-je tout supprimer ?", x: "Oui, en un clic." }] }]] },
      { key: "confidentialite", name: "Confidentialité", blocks: [
        ["misc:pagehead", { title: "Confidentialité" }],
        ["feat:rows", { items: [{ t: "Chiffrement", x: "Vos documents sont chiffrés avant stockage." }, { t: "Hébergement", x: "Serveurs situés en Europe." }, { t: "Contrôle", x: "Vous décidez de ce qui est partagé, et pour combien de temps." }] }],
        ["contact:info", { title: "Une question sur vos données ?", formTitle: "Nous écrire", formIntro: "Réponse sous quatre jours ouvrés.", cta: ["Envoyer", "/contact"] }]] }
    ]
  },

  // 9. Marketplace de freelances
  {
    key: "freelanda", name: "Freelanda", category: "tech", tags: ["audacieux", "moderne", "chaleureux"], siteType: "Marketplace de freelances",
    description: "Thème de marketplace pour indépendants : rouge framboise, grande recherche d'accueil, profils, catégories de missions et commissions lisibles.",
    brand: "Freelanda",
    tokens: T({ primary: "#be123c", secondary: "#4c0519", accent: "#0ea5e9", background: "#fff7f8", surface: "#ffe8ec", text: "#2a0d14", muted: "#6b4650" }, "font.league-spartan", "font.alegreya", { sm: 4, md: 10, lg: 16, button: 10, field: 10, card: 14 }, { shadow: { card: "md", button: "sm" } }),
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "freelanda", motifs: ["ribbons", "objects", "bokeh"] },
    head: ["head:topbar", { info: "Plus de 4 000 indépendants (exemple)", note: "Mission publiée en 5 minutes" }], foot: ["foot:columns", { about: "Freelanda met en relation entreprises et indépendants, avec un contrat clair et un paiement en deux temps.", cols: [["Entreprises", "Publier une mission", "Trouver un profil", "Tarifs"], ["Indépendants", "Créer mon profil", "Charte", "Aide"]] }],
    menu: [["Accueil", "/"], ["Trouver un profil", "/profils"], ["Catégories", "/categories"], ["Tarifs", "/tarifs"], ["Aide", "/aide"]], cta: ["Publier une mission", "/contact"],
    contact: { address: "36 rue du Pont-Neuf, 33000 Bordeaux", phone: "05 56 00 80 80", email: "equipe@freelanda.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Le bon indépendant, au bon moment." },
    social: ["linkedin", "instagram", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Mise en relation", title: "Trouvez l'indépendant qu'il vous faut.", sub: "Rédacteurs, développeurs, graphistes, traducteurs : décrivez votre besoin et recevez des propositions sous 48 heures.", placeholder: "Ex. : graphiste pour une identité visuelle", cta: ["Rechercher", "/profils"] }],
        ["feat:cards", { title: "Les catégories les plus demandées", items: [{ t: "Développement", x: "Sites, applications, scripts.", icon: "keyboard", link: ["Voir", "/categories"] }, { t: "Design", x: "Logos, interfaces, illustrations.", icon: "palette", link: ["Voir", "/categories"] }, { t: "Rédaction", x: "Articles, fiches produits, traductions.", icon: "fileText", link: ["Voir", "/categories"] }, { t: "Vidéo", x: "Montage, sous-titrage.", icon: "video", link: ["Voir", "/categories"] }] }],
        ["gal:masonry", { title: "Profils à la une (fictifs)", items: [{ t: "Léa G., illustratrice", x: "Univers jeunesse" }, { t: "Karim S., développeur", x: "Applications web" }, { t: "Éloïse P., traductrice", x: "Anglais, français" }, { t: "Antoine V., monteur", x: "Vidéo courte" }] }],
        ["proof:quotes", { items: [{ q: "Trois propositions en une journée, et un contrat prêt à signer.", n: "Direction d'une PME", r: "cliente fictive" }, { q: "Je choisis mes missions et je suis payé sans relance.", n: "Karim S.", r: "freelance, client fictif" }] }],
        ["feat:numbered", { title: "En trois étapes", items: [{ t: "Décrivez", x: "Votre besoin, votre budget." }, { t: "Comparez", x: "Profils, avis, tarifs." }, { t: "Collaborez", x: "Paiement libéré à la livraison." }] }],
        ["cta:band", { title: "Votre prochaine mission commence ici", cta: ["Publier une mission", "/contact"], cta2: ["Devenir freelance", "/aide"] }]] },
      { key: "profils", name: "Profils", blocks: [
        ["misc:pagehead", { title: "Trouver un profil" }],
        ["misc:search", {}],
        ["gal:cards", { items: [{ t: "Léa G.", x: "Illustration, identité visuelle.", tag: "45 € / h" }, { t: "Karim S.", x: "Applications web, API.", tag: "70 € / h" }, { t: "Éloïse P.", x: "Traduction anglais-français.", tag: "0,09 € / mot" }] }],
        ["cta:card", { title: "Aucun profil ne convient ?", cta: ["Publier une mission", "/contact"] }]] },
      { key: "categories", name: "Catégories", blocks: [
        ["misc:pagehead", { title: "Catégories" }],
        ["feat:strips", { items: [{ t: "Développement", x: "Web, mobile, scripts, intégrations." }, { t: "Design", x: "Logo, interface, illustration." }, { t: "Rédaction", x: "Contenu, traduction, relecture." }, { t: "Vidéo et son", x: "Montage, voix off, sous-titres." }, { t: "Conseil", x: "Stratégie, gestion de projet." }] }],
        ["proof:stats", { items: [["4 000", "indépendants (exemple)"], ["48 h", "délai moyen de réponse"], ["96 %", "missions terminées (exemple)"]] }]] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et commissions" }],
        ["price:tiers", { items: [{ t: "Entreprise", price: "8 %", period: "de commission", f: ["Publication gratuite", "Contrat type", "Paiement séquestré"], cta: ["Publier", "/contact"] }, { t: "Freelance", price: "0 €", period: "pour s'inscrire", f: ["Profil illimité", "10 % sur les missions", "Retrait sous 3 jours"], cta: ["Créer mon profil", "/contact"], hl: true }] }],
        ["feat:accordion", { items: [{ t: "Quand suis-je payé ?", x: "À validation de la livraison par le client." }, { t: "Que faire en cas de litige ?", x: "Un médiateur intervient sous 5 jours." }] }]] },
      { key: "aide", name: "Aide", blocks: [
        ["misc:pagehead", { title: "Aide" }],
        ["misc:faq", { items: [{ t: "Comment vérifiez-vous les profils ?", x: "Identité, références et premiers travaux." }, { t: "Puis-je collaborer hors de la plateforme ?", x: "La charte demande de rester sur la plateforme pour la première mission." }] }],
        ["contact:cards", { title: "Nous contacter" }]] }
    ]
  },

  // 10. Outil de design collaboratif
  {
    key: "planchette", name: "Planchette", category: "tech", tags: ["moderne", "editorial", "geometrique"], siteType: "Outil de design collaboratif",
    description: "Thème créatif pour un outil de conception à plusieurs : prune sur blanc rosé, bandeau éditorial, fonctionnalités en onglets, comparatif et tarifs par siège.",
    brand: "Planchette",
    tokens: T({ primary: "#a21caf", secondary: "#4a044e", accent: "#16a34a", background: "#fbf6fc", surface: "#f3e6f6", text: "#2a0f2e", muted: "#62496a" }, "font.jost", "font.ibm-plex-serif", { sm: 4, md: 8, lg: 14, button: 8, field: 8, card: 12 }, { shadow: { card: "sm", button: "none" } }),
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "planchette", motifs: ["tiles", "ribbons", "mesh"] },
    head: ["head:masthead", { dateline: "Version 5 · Édition de novembre" }], foot: ["foot:center", { about: "Planchette : l'outil où maquettes, idées et retours vivent au même endroit." }],
    menu: [["Accueil", "/"], ["Fonctionnalités", "/fonctionnalites"], ["Tarifs", "/tarifs"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Essayer gratuitement", "/contact"],
    contact: { address: "18 rue des Ateliers, 67000 Strasbourg", phone: "03 88 00 62 62", email: "hello@planchette.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Concevoir à plusieurs, sans se marcher dessus." },
    social: ["linkedin", "youtube", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Design collaboratif", eyebrow: "Nouveau : commentaires vocaux", title: "Dessinez ensemble, au même instant.", sub: "Planchette réunit planches d'idées, maquettes et retours sur un canevas partagé, avec historique et versions.", cta: ["Essayer gratuitement", "/contact"], cta2: ["Voir une démo", "/fonctionnalites"] }],
        ["proof:logos", { title: "Utilisé par des équipes (noms fictifs)", items: [{}, "Atelier Cosmo", "Studio Nacre", "Maison Calame", "Agence Hélice"].slice(1) }],
        ["feat:tabs", { title: "Un canevas, plusieurs façons de travailler", items: [{ t: "Idées", x: "Post-it, flèches et regroupements pour les ateliers." }, { t: "Maquettes", x: "Composants, variantes et grilles adaptatives." }, { t: "Retours", x: "Commentaires épinglés et résolus en un clic." }, { t: "Remise au développement", x: "Spécifications et ressources exportables." }] }],
        ["feat:compare", { title: "Planchette face au partage de fichiers", rows: [["", "Planchette", "Fichiers par e-mail"], ["Édition simultanée", "oui", "non"], ["Historique des versions", "oui", "partiel"], ["Commentaires dans le visuel", "oui", "non"]] }],
        ["proof:big", { items: [{ q: "Nos ateliers à distance sont enfin aussi vivants qu'en salle.", n: "Inès B.", r: "directrice de création, cliente fictive" }] }],
        ["cta:split", { title: "Invitez votre équipe en trois clics", sub: "Gratuit jusqu'à trois projets.", cta: ["Commencer", "/contact"] }]] },
      { key: "fonctionnalites", name: "Fonctionnalités", blocks: [
        ["misc:pagehead", { title: "Fonctionnalités" }],
        ["feat:alt", { items: [{ t: "Canevas infini", x: "Zoomez de la vue d'ensemble au détail du pixel.", link: ["Tarifs", "/tarifs"] }, { t: "Composants vivants", x: "Modifiez un bouton, toutes les pages se mettent à jour." }, { t: "Prototype cliquable", x: "Partagez un lien, recueillez des retours." }] }],
        ["feat:bento", { title: "Pour toute l'équipe", items: [{ t: "Plugins", x: "Une cinquantaine d'extensions communautaires (exemple).", icon: "plug" }, { t: "Historique", x: "Revenez à n'importe quelle version.", icon: "clock" }, { t: "Droits", x: "Lecture, commentaire ou édition.", icon: "lock" }] }]] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Solo", price: "0 €", f: ["3 projets", "Historique 7 jours"], cta: ["Commencer", "/contact"] }, { t: "Équipe", price: "9 €", period: "par siège et par mois (exemple)", f: ["Projets illimités", "Bibliothèques partagées", "Historique illimité"], cta: ["Essayer", "/contact"], hl: true }, { t: "Organisation", price: "Sur devis", f: ["Authentification unique", "Journal d'audit", "Assistance dédiée"], cta: ["Nous contacter", "/contact"] }] }],
        ["misc:faq", { items: [{ t: "Peut-on importer des fichiers existants ?", x: "Oui, formats d'image et fichiers vectoriels courants." }] }]] },
      { key: "ressources", name: "Ressources", blocks: [
        ["misc:pagehead", { title: "Ressources" }],
        ["misc:posts", { title: "Journal de Planchette", count: 3, layout: "grid" }],
        ["feat:list2", { title: "Modèles gratuits", items: [{ t: "Atelier de démarrage" }, { t: "Rétrospective" }, { t: "Parcours utilisateur" }, { t: "Kit d'interface" }] }]] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:map", { title: "Nous rendre visite", mapAddress: "18 rue des Ateliers, 67000 Strasbourg" }],
        ["cta:card", { title: "Envie d'une démonstration en direct ?", cta: ["Réserver un créneau", "/contact"] }]] }
    ]
  },

  // 11. Lancement produit avec compte à rebours
  {
    key: "decompte", name: "Décompte", category: "tech", tags: ["sombre", "audacieux", "technique"], siteType: "Lancement de produit avec compte à rebours",
    description: "Thème sombre pour un lancement : compte à rebours en tête, cyan électrique sur bleu nuit, teasing des fonctions, liste d'attente et programme de l'événement.",
    brand: "Aphélie",
    tokens: T({ primary: "#22d3ee", secondary: "#0c2a3a", accent: "#fb7185", background: "#07131a", surface: "#0f2230", text: "#e8f4f9", muted: "#9fbccb" }, "font.anton", "font.manrope", { sm: 4, md: 10, lg: 16, button: 999, field: 10, card: 14 }, { shadow: { card: "lg", button: "md" }, border: { width: 1, color: "#1f3c50" } }),
    dna: { scale: "xl", pad: "airy", align: "center", shape: "pill" }, art: { seed: "decompte", motifs: ["rays", "mesh", "bokeh"] },
    head: ["head:minimal", {}], foot: ["foot:big", { title: "Orbitale" }],
    menu: [["Lancement", "/"], ["Le produit", "/produit"], ["Programme", "/programme"], ["Liste d'attente", "/liste-attente"], ["Questions", "/questions"]], cta: ["Rejoindre la liste", "/liste-attente"],
    contact: { address: "1 esplanade du Lancement, 13000 Marseille", phone: "04 91 00 20 30", email: "lancement@orbitale.example", hours: "Réponses sous 48 h", tagline: "Le grand jour approche." },
    social: ["youtube", "instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Lancement", blocks: [
        ["hero:countdown", { eyebrow: "Lancement officiel", title: "Orbitale arrive.", sub: "Le casque d'écoute spatial qui reconstitue votre musique autour de vous. Dévoilement en direct, puis précommandes ouvertes.", until: "2030-06-01T18:00:00+02:00", cta: ["Rejoindre la liste d'attente", "/liste-attente"], cta2: ["Voir le programme", "/programme"] }],
        ["feat:numbered", { title: "Trois promesses", items: [{ t: "Son enveloppant", x: "Un rendu spatial calibré sur votre oreille." }, { t: "Trente heures d'autonomie", x: "Valeur annoncée à titre d'exemple." }, { t: "Matériaux recyclés", x: "Coque en plastique recyclé à 70 % (exemple)." }] }],
        ["gal:wall", { items: [{ t: "Coque" }, { t: "Coussinets" }, { t: "Étui" }, { t: "Application" }] }],
        ["misc:quote", { text: "Nous avons passé trois ans à écouter vos retours. Le 1er juin, vous écouterez le résultat.", by: "L'équipe Orbitale" }],
        ["proof:statsbar", { items: [["3 ans", "de développement"], ["12 000", "inscrits (exemple)"], ["1", "grand jour"]] }]] },
      { key: "produit", name: "Le produit", blocks: [
        ["misc:pagehead", { title: "Le produit" }],
        ["feat:rows", { items: [{ t: "Audio spatial", x: "Capteurs de mouvement de la tête et profil personnalisé." }, { t: "Réduction de bruit", x: "Quatre micros par oreille." }, { t: "Confort", x: "Moins de 250 grammes, arceau souple." }] }],
        ["misc:product", { title: "Orbitale One", price: "299 €", text: "Prix annoncé à titre d'exemple, précommande ouverte après le dévoilement.", points: ["Bluetooth 5.4", "Étui de transport", "Garantie 2 ans"], cta: "Être prévenu", url: "/liste-attente" }]] },
      { key: "programme", name: "Programme", blocks: [
        ["misc:pagehead", { title: "Programme du dévoilement" }],
        ["misc:schedule", { title: "Le jour J", items: [{ d: "17 h 30", t: "Ouverture de la diffusion", x: "Accueil et mise en ambiance." }, { d: "18 h 00", t: "Dévoilement", x: "Présentation du produit." }, { d: "18 h 30", t: "Questions", x: "Réponses aux inscrits." }, { d: "19 h 00", t: "Ouverture des précommandes", x: "Pour les inscrits d'abord." }] }],
        ["cta:band", { title: "Votre place est réservée si vous êtes inscrit", cta: ["S'inscrire", "/liste-attente"] }]] },
      { key: "liste-attente", name: "Liste d'attente", blocks: [
        ["misc:pagehead", { title: "Liste d'attente" }],
        ["feat:checks", { title: "Ce que vous recevez", cta: ["Lire les questions", "/questions"], items: [{ t: "Le lien de la diffusion en direct" }, { t: "Un accès anticipé aux précommandes" }, { t: "Un code de remerciement" }] }],
        ["contact:info", { title: "Je m'inscris", formTitle: "Rejoindre la liste", formIntro: "Un seul e-mail avant le lancement, un seul le jour J.", cta: ["Je m'inscris", "/contact"] }]] },
      { key: "questions", name: "Questions", blocks: [
        ["misc:pagehead", { title: "Questions" }],
        ["feat:accordion", { items: [{ t: "Quand sera-t-il livré ?", x: "Les premières livraisons sont prévues quelques semaines après le lancement." }, { t: "Quel sera le prix final ?", x: "Il sera confirmé lors du dévoilement." }, { t: "Puis-je annuler ma précommande ?", x: "Oui, jusqu'à l'expédition." }] }],
        ["cta:card", { title: "Une autre question ?", cta: ["Nous écrire", "/liste-attente"] }]] }
    ]
  }
];
