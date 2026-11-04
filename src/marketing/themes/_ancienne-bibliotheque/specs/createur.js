// Créateurs et indépendants (9 thèmes). Textes de DÉMONSTRATION : personnes, marques et coordonnées fictives.
const PH = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const F = (h, b, bt) => ({ heading: "font." + h, body: "font." + b, button: "font." + (bt || b), link: "font." + b });

module.exports = [
  // 1. Site personnel / CV en ligne
  {
    key: "page-de-garde", name: "Page de Garde", category: "createur", tags: ["editorial", "chaleureux"], siteType: "Site personnel et CV en ligne",
    description: "CV en ligne d'une designer produit : papier crème, brun cuivré, serif de lecture à l'ancienne, parcours chronologique et études de cas en alternance.",
    brand: "Inès Valcourt",
    tokens: { colors: { primary: "#b45309", secondary: "#3b2a1a", accent: "#0f766e", background: "#fbf7f0", surface: "#ffffff", text: "#2a211a", muted: "#5e5249" }, fonts: F("eb-garamond", "work-sans"), radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#e4d9c8" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.04, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "garde", motifs: ["plates", "arches", "topo"] },
    head: ["head:split", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Parcours", "/parcours"], ["Réalisations", "/realisations"], ["Compétences", "/competences"], ["Contact", "/contact"]], cta: ["Télécharger le CV", "/contact"],
    contact: { address: "Lyon (Rhône), en télétravail", phone: "04 78 55 20 31", email: "bonjour@inesvalcourt.example", hours: "Réponse sous deux jours ouvrés", tagline: "Designer produit, 9 ans de métier." },
    social: ["linkedin", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Designer produit · Lyon", title: "Je dessine des outils que l'on comprend du premier coup.", sub: "Neuf ans à concevoir des applications de santé, de logistique et de finance, du premier atelier à la mise en production.", cta: ["Voir mon parcours", "/parcours"], cta2: ["Me contacter", "/contact"], image: "portrait-1" }],
        ["proof:stats", { items: [["9 ans", "d'expérience"], ["34", "produits livrés (exemple)"], ["5", "équipes encadrées"]] }],
        ["feat:alt", { eyebrow: "Réalisations choisies", title: "Trois études de cas", items: [{ t: "Carnet de tournée", x: "Refonte d'une application de livraison utilisée par 1 800 chauffeurs : temps de saisie divisé par deux.", link: ["Lire l'étude", "/realisations"] }, { t: "Dossier patient simplifié", x: "Un parcours d'accueil clinique repensé avec les infirmières.", link: ["Lire l'étude", "/realisations"] }, { t: "Tableau de trésorerie", x: "Une vue unique pour les dirigeants de petites entreprises.", link: ["Lire l'étude", "/realisations"] }] }],
        ["feat:list2", { title: "Ce que je fais le mieux", bg: "token:surface", items: [{ t: "Recherche utilisateur" }, { t: "Prototypes interactifs" }, { t: "Systèmes de design" }, { t: "Ateliers de cadrage" }, { t: "Accompagnement d'équipes" }, { t: "Tests d'utilisabilité" }] }],
        ["proof:big", { items: [{ q: "Inès a transformé un cahier des charges flou en un produit que nos équipes adorent.", n: "Directrice produit", r: "Cliente fictive" }] }],
        ["cta:split", { title: "Une mission, un poste, un café ?", sub: "Je réponds à toutes les propositions sérieuses.", cta: ["Me contacter", "/contact"] }],
      ] },
      { key: "parcours", name: "Parcours", blocks: [
        PH("Parcours", "Mon CV, version lisible."),
        ["feat:steps", { items: [{ d: "2024 – aujourd'hui", t: "Designer produit indépendante", x: "Missions de six à douze mois pour des éditeurs de logiciels." }, { d: "2019 – 2024", t: "Lead design, éditeur de logiciels de santé", x: "Équipe de cinq personnes, système de design partagé." }, { d: "2016 – 2019", t: "Designer d'interface, agence digitale", x: "Quinze sites et applications pour des clients variés." }, { d: "2014 – 2016", t: "Master en ergonomie numérique", x: "Mémoire sur la lisibilité des interfaces mobiles." }] }],
        ["proof:logos", { title: "Ils m'ont fait confiance", items: ["Maison Verchère", "Clinique des Brotteaux", "Transports Arlaud", "Banque Coopérative du Rhône"] }],
        ["cta:band", { title: "Le CV complet en PDF", sub: "Une page, mis à jour chaque trimestre.", cta: ["Le demander", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        PH("Réalisations"),
        ["gal:featured", { items: [{ t: "Carnet de tournée", x: "Application mobile de livraison" }, { t: "Dossier patient", x: "Parcours d'accueil clinique" }, { t: "Tableau de trésorerie", x: "Outil de pilotage" }, { t: "Système de design", x: "Bibliothèque de 120 composants" }] }],
        ["feat:rows", { title: "Méthode type", items: [{ t: "Cadrer", x: "Une semaine d'entretiens et d'observation." }, { t: "Concevoir", x: "Maquettes testées auprès de cinq utilisateurs." }, { t: "Livrer", x: "Suivi du développement jusqu'à la mise en ligne." }] }],
      ] },
      { key: "competences", name: "Compétences", blocks: [
        PH("Compétences et outils"),
        ["feat:grid-icons", { items: [{ icon: "layout", t: "Conception d'interface", x: "Maquettes, prototypes, design systems." }, { icon: "users", t: "Recherche", x: "Entretiens, observation, tests." }, { icon: "layers", t: "Architecture de l'information", x: "Parcours, plans, étiquetage." }, { icon: "graduation", t: "Transmission", x: "Ateliers et formations en équipe." }] }],
        ["proof:statsbar", { items: [["120", "composants documentés"], ["60", "tests utilisateurs menés"], ["3", "langues de travail"]] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Êtes-vous disponible ?", x: "Pour une mission de plus de trois mois, à partir du trimestre prochain." }, { t: "Travaillez-vous sur place ?", x: "Surtout à distance, avec des journées d'atelier sur site." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:info", { title: "Parlons de votre projet", formTitle: "Un message", formIntro: "Décrivez le contexte en quelques lignes.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "Un bon produit se reconnaît à ce qu'on n'a pas besoin de l'expliquer.", by: "Inès Valcourt" }],
      ] },
    ],
  },

  // 2. YouTubeur / vidéaste
  {
    key: "plan-de-travail", name: "Plan de Travail", category: "createur", tags: ["ludique", "audacieux"], siteType: "Chaîne vidéo de cuisine du quotidien",
    description: "Site de vidéaste culinaire : rouge tomate et jaune beurre, titres arrondis et gras, mosaïque de miniatures, chiffres de la chaîne et page partenariats.",
    brand: "Plan de Travail",
    tokens: { colors: { primary: "#dc2626", secondary: "#1f1a14", accent: "#facc15", background: "#fffaf0", surface: "#ffffff", text: "#1f1a14", muted: "#5a5148" }, fonts: F("righteous", "nunito"), radius: { sm: 10, md: 16, lg: 26, button: 999, field: 14, card: 22 }, shadow: { card: "md", button: "md" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.04, letterSpacing: 0 } } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "pill" }, art: { seed: "plan", motifs: ["objects", "blobs", "rays"] },
    head: ["head:float", {}], foot: ["foot:columns", { about: "Recettes filmées dans une vraie cuisine de 9 m², chaque mercredi à 19 h.", cols: [["Chaîne", "Vidéos", "Recettes", "À propos"], ["Pro", "Partenariats", "Contact"]] }],
    menu: [["Accueil", "/"], ["Recettes", "/recettes"], ["Coulisses", "/coulisses"], ["Partenariats", "/partenariats"], ["Contact", "/contact"]], cta: ["S'abonner", "/contact"],
    contact: { address: "Cuisine-studio, Nantes (Loire-Atlantique)", phone: "02 40 11 62 85", email: "miam@plandetravail.example", hours: "Nouvelle vidéo chaque mercredi à 19 h", tagline: "Dîner en vingt minutes, vaisselle comprise." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Chaîne de cuisine", title: "Des dîners en 20 minutes, sans stress ni vaisselle infinie.", sub: "Une recette complète filmée en plan fixe chaque mercredi, avec les erreurs.", cta: ["Voir les recettes", "/recettes"], cta2: ["Me contacter", "/contact"] }],
        ["misc:marquee", { items: ["Nouvelle vidéo mercredi 19 h", "Direct questions-réponses le dimanche", "Recettes à imprimer", "Sans four, sans stress"] }],
        ["gal:masonry", { title: "Les vidéos qui cartonnent", items: [{ t: "Pâtes au citron en 12 minutes", x: "4 ingrédients" }, { t: "Le curry du placard vide", x: "Pois chiches et lait de coco" }, { t: "Gratin sans béchamel", x: "Crème et poireaux" }, { t: "Pain à la poêle", x: "Sans four" }, { t: "Brunch du dimanche", x: "Pancakes et œufs" }] }],
        ["proof:statsbar", { items: [["85 000", "abonnés (exemple)"], ["180", "recettes filmées"], ["3 ans", "de mercredis"]] }],
        ["feat:bento", { title: "Plus que des vidéos", items: [{ icon: "fileText", t: "Fiches imprimables", x: "Chaque recette tient sur une page, liste de courses incluse." }, { icon: "calendarClock", t: "Menus de la semaine", x: "Cinq dîners planifiés." }, { icon: "users", t: "Direct du dimanche", x: "Vos questions en direct." }] }],
        ["proof:quotes", { items: [{ q: "Je cuisine enfin sans regarder l'heure.", n: "Chloé R.", r: "Spectatrice fictive" }, { q: "Les erreurs gardées au montage me rassurent.", n: "Yanis P.", r: "Spectateur fictif" }, { q: "Mes enfants réclament le curry du placard vide.", n: "Mélanie T.", r: "Spectatrice fictive" }] }],
      ] },
      { key: "recettes", name: "Recettes", blocks: [
        PH("Toutes les recettes"),
        ["gal:cards", { items: [{ t: "Pâtes au citron", tag: "12 min", x: "Quatre ingrédients, une casserole." }, { t: "Curry du placard vide", tag: "25 min", x: "Pois chiches, lait de coco, épices." }, { t: "Gratin sans béchamel", tag: "35 min", x: "Crème, poireaux, fromage." }, { t: "Pain à la poêle", tag: "30 min", x: "Sans four ni pétrissage." }] }],
        ["feat:tabs", { title: "Par envie", items: [{ t: "Rapide", x: "Moins de vingt minutes, une seule poêle." }, { t: "Économique", x: "Moins de trois euros la portion." }, { t: "Végétarien", x: "Légumineuses, œufs, fromages." }] }],
        ["misc:posts", { title: "Notes de tournage", count: 3, layout: "grid" }],
      ] },
      { key: "coulisses", name: "Coulisses", blocks: [
        PH("Coulisses"),
        ["misc:story", { eyebrow: "L'équipe", title: "Deux personnes et une cuisine trop petite", paras: ["Je cuisine, Malo filme. Tout est tourné dans la cuisine de l'appartement, entre deux lessives.", "Chaque vidéo demande une journée de tournage et une journée de montage."], image: "portrait-2" }],
        ["feat:numbered", { items: [{ t: "180", x: "recettes filmées" }, { t: "3", x: "ans de tournage" }, { t: "1", x: "four en panne, nommé Gérard" }] }],
        ["cta:card", { title: "Une idée de recette ?", sub: "Écrivez-nous, on teste en direct.", cta: ["Proposer", "/contact"] }],
      ] },
      { key: "partenariats", name: "Partenariats", blocks: [
        PH("Partenariats", "Marques alimentaires, ustensiles, producteurs."),
        ["price:tiers", { items: [{ t: "Mention", price: "600 €", period: "par vidéo", f: ["Citation de 15 secondes", "Lien en description"], cta: "Demander un devis", url: "/contact" }, { t: "Recette dédiée", price: "1 900 €", period: "par vidéo", f: ["Produit au cœur de la recette", "Fiche imprimable à votre nom", "Relais sur les réseaux"], cta: "Demander un devis", url: "/contact", hl: true }, { t: "Saison", price: "sur devis", f: ["Six recettes", "Direct dédié"], cta: "Demander un devis", url: "/contact" }] }],
        ["feat:checks", { title: "Nos règles", cta: ["Écrire à la chaîne", "/contact"], items: [{ t: "Produits goûtés avant tout accord" }, { t: "Mention claire des partenariats" }, { t: "Liberté de ton garantie" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:cards", { title: "Écrivez-nous" }],
        ["misc:faq", { items: [{ t: "Répondez-vous aux questions de cuisine ?", x: "Oui, lors du direct du dimanche." }, { t: "Envoyez-vous des produits ?", x: "Seulement après accord écrit, voir la page partenariats." }] }],
      ] },
    ],
  },

  // 3. Podcasteur
  {
    key: "onde-courte", name: "Onde Courte", category: "createur", tags: ["sombre", "editorial"], siteType: "Podcast d'entretiens sur les métiers de la mer",
    description: "Site de podcast marin : fond bleu nuit, bleu ciel électrique, serif de lecture, épisodes en lignes, invités et abonnement à la lettre.",
    brand: "Onde Courte",
    tokens: { colors: { primary: "#38bdf8", secondary: "#0d2b45", accent: "#fbbf24", background: "#0b1520", surface: "#12202f", text: "#eaf3fa", muted: "#a9bccd" }, fonts: F("vollkorn", "figtree"), radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#24384d" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "onde", motifs: ["waves", "bokeh", "topo"] },
    head: ["head:dark", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Épisodes", "/episodes"], ["Invités", "/invites"], ["Écouter", "/ecouter"], ["Contact", "/contact"]], cta: ["Dernier épisode", "/episodes"],
    contact: { address: "Studio sur le port, Saint-Malo (Ille-et-Vilaine)", phone: "02 99 40 18 52", email: "antenne@ondecourte.example", hours: "Un épisode tous les quinze jours, le jeudi", tagline: "Les gens de la mer au micro." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Podcast · tous les quinze jours", title: "La mer racontée par ceux qui y travaillent.", sub: "Marins-pêcheurs, pilotes de port, voiliers, ostréicultrices : une heure d'écoute, sans musique de fond.", cta: ["Écouter le dernier épisode", "/episodes"], cta2: ["Où écouter", "/ecouter"], image: "portrait-1" }],
        ["feat:rows", { eyebrow: "À l'écoute", title: "Derniers épisodes", items: [{ t: "#41 · La criée à cinq heures", x: "Une mareyeuse raconte la vente du matin. 54 min." }, { t: "#40 · Pilote de port", x: "Guider les cargos dans la brume. 49 min." }, { t: "#39 · Les huîtres du mois d'août", x: "Une ostréicultrice et le calendrier de la marée. 46 min." }] }],
        ["proof:stats", { items: [["41", "épisodes"], ["22 000", "écoutes par mois (exemple)"], ["4,9", "note moyenne (exemple)"]] }],
        ["misc:quote", { text: "On pose une seule question et on laisse la marée faire le reste.", by: "L'animatrice" }],
        ["feat:accordion", { title: "Comment ça marche", items: [{ t: "Combien de temps dure un épisode ?", x: "Entre 45 et 60 minutes, sans coupure publicitaire." }, { t: "Faut-il être marin pour écouter ?", x: "Non, les termes sont expliqués au fil de la conversation." }] }],
        ["cta:band", { title: "Une lettre avant chaque épisode", sub: "Le sommaire, une photo, jamais de spam.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "episodes", name: "Épisodes", blocks: [
        PH("Tous les épisodes"),
        ["feat:strips", { items: [{ t: "#41 · La criée à cinq heures", x: "Vendre le poisson avant le lever du jour." }, { t: "#40 · Pilote de port", x: "Monter à bord d'un cargo en pleine brume." }, { t: "#39 · Les huîtres du mois d'août", x: "Marées, laiteuses et patience." }, { t: "#38 · Le dernier radio-maritime", x: "Écouter les appels de détresse pendant trente ans." }] }],
        ["misc:posts", { title: "Notes d'épisodes", count: 4, layout: "list" }],
      ] },
      { key: "invites", name: "Invités", blocks: [
        PH("Invités"),
        ["proof:team", { items: [{ n: "Gaëlle Roncier", r: "Mareyeuse" }, { n: "Thibaut Kerlaouen", r: "Pilote de port" }, { n: "Odile Marchand", r: "Ostréicultrice" }, { n: "Léandre Pichon", r: "Ancien radio-maritime" }] }],
        ["cta:split", { title: "Vous travaillez en mer ?", sub: "Racontez-nous votre quotidien en quelques lignes.", cta: ["Proposer un sujet", "/contact"] }],
      ] },
      { key: "ecouter", name: "Écouter", blocks: [
        PH("Où écouter", "Sur toutes les plateformes habituelles."),
        ["feat:checks", { title: "Plateformes", cta: ["Écrire à l'équipe", "/contact"], items: [{ t: "Applications de podcast" }, { t: "Flux RSS libre" }, { t: "Version texte des épisodes" }, { t: "Lettre d'information" }] }],
        ["misc:schedule", { title: "Le rythme", items: [{ d: "Semaine 1", t: "Enregistrement", x: "Sur le port ou à bord." }, { d: "Semaine 2", t: "Montage", x: "Pas de musique, juste les bruits du quai." }, { d: "Jeudi", t: "Mise en ligne", x: "Un épisode tous les quinze jours." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:map", { title: "Au studio", mapAddress: "Saint-Malo, port" }],
        ["proof:quotes", { items: [{ q: "On entend vraiment l'odeur du quai.", n: "Rémi A.", r: "Auditeur fictif" }, { q: "Mon grand-père pêcheur aurait adoré.", n: "Sonia G.", r: "Auditrice fictive" }] }],
      ] },
    ],
  },

  // 4. Auteur de newsletter
  {
    key: "lettre-du-dimanche", name: "Lettre du Dimanche", category: "createur", tags: ["editorial", "classique"], siteType: "Newsletter hebdomadaire sur l'économie du quotidien",
    description: "Site de newsletter payante : papier ivoire, bleu encre, serif de presse, bandeau de journal, archives lisibles et formule d'abonnement.",
    brand: "La Lettre du Dimanche",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0f1e4d", accent: "#e11d48", background: "#f7f4ec", surface: "#fffdf8", text: "#1c1b18", muted: "#55524a" }, fonts: F("crimson-pro", "public-sans"), radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d3c3" }, type: { h1: { size: 68, weight: 600, lineHeight: 1.02, letterSpacing: -0.015 }, h2: { size: 40, weight: 600, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "lettre", motifs: ["halftone", "plates", "ribbons"] },
    head: ["head:masthead", { dateline: "Chaque dimanche à 7 h · Numéro 212" }], foot: ["foot:newsletter", { title: "Recevez la lettre ce dimanche", sub: "Gratuite pour la version courte, 7 € par mois pour l'édition complète.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Archives", "/archives"], ["S'abonner", "/abonnement"], ["L'auteur", "/auteur"], ["Contact", "/contact"]], cta: ["S'abonner", "/abonnement"],
    contact: { address: "Rédaction à Lille (Nord)", phone: "03 20 14 77 06", email: "redaction@lettredudimanche.example", hours: "Envoi le dimanche à 7 h", tagline: "Comprendre l'argent, sans jargon, en dix minutes." },
    social: ["linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Newsletter hebdomadaire", title: "Dix minutes le dimanche pour comprendre ce que coûte votre semaine.", sub: "Prix, loyers, énergie, impôts : un sujet, trois chiffres, une explication claire.", cta: ["Lire un numéro", "/archives"], cta2: ["S'abonner", "/abonnement"] }],
        ["proof:logos", { title: "Lue dans les équipes de", items: ["Coopérative Sablier", "Mutuelle des Flandres", "Atelier Bruyère", "Réseau des Écoles Hautes"] }],
        ["misc:posts", { title: "Derniers numéros", count: 3, layout: "list" }],
        ["feat:numbered", { title: "Pourquoi s'abonner", items: [{ t: "1 sujet", x: "Jamais plus d'un thème par numéro." }, { t: "3 chiffres", x: "Sourcés, expliqués, datés." }, { t: "10 min", x: "Le temps d'un café." }] }],
        ["proof:quotes", { items: [{ q: "Enfin quelqu'un qui explique la taxe foncière sans me perdre.", n: "Hélène M.", r: "Abonnée fictive" }, { q: "Je la lis avant même d'ouvrir mes mails pro.", n: "Karim S.", r: "Abonné fictif" }, { q: "Mes parents me la transfèrent chaque semaine.", n: "Julie B.", r: "Abonnée fictive" }] }],
        ["cta:image", { title: "Le prochain numéro arrive dimanche", sub: "Version courte gratuite, édition complète pour 7 € par mois.", cta: ["Je m'abonne", "/abonnement"] }],
      ] },
      { key: "archives", name: "Archives", blocks: [
        PH("Archives", "Tous les numéros, du plus récent au plus ancien."),
        ["misc:posts", { count: 6, layout: "list" }],
        ["feat:list2", { title: "Par thème", bg: "token:surface", items: [{ t: "Logement et loyers" }, { t: "Énergie et factures" }, { t: "Impôts locaux" }, { t: "Épargne et inflation" }] }],
        ["cta:card", { title: "Un thème manque ?", sub: "Proposez le prochain sujet.", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "abonnement", name: "Abonnement", blocks: [
        PH("S'abonner", "Gratuit ou complet, sans engagement."),
        ["price:tiers", { items: [{ t: "Version courte", price: "0 €", f: ["Résumé de cinq lignes", "Un chiffre à retenir"], cta: "Je m'inscris", url: "/contact" }, { t: "Édition complète", price: "7 €", period: "par mois", f: ["Numéro de dix minutes", "Archives illimitées", "Réponse aux questions"], cta: "Je m'abonne", url: "/contact", hl: true }, { t: "Équipe", price: "49 €", period: "par mois", f: ["Jusqu'à dix lecteurs", "Facture mensuelle"], cta: "Demander un devis", url: "/contact" }] }],
        ["feat:compare", { title: "Comparer", rows: [["", "Courte", "Complète"], ["Numéro intégral", "non", "oui"], ["Archives", "non", "oui"], ["Questions des lecteurs", "non", "oui"]] }],
        ["misc:faq", { items: [{ t: "Puis-je résilier ?", x: "À tout moment, en un message." }, { t: "Le paiement se fait-il sur ce site ?", x: "Non, nous vous répondons par e-mail pour finaliser l'abonnement." }] }],
      ] },
      { key: "auteur", name: "L'auteur", blocks: [
        PH("L'auteur"),
        ["misc:story", { eyebrow: "Qui écrit", title: "Un ancien journaliste économique", paras: ["Après douze ans dans la presse régionale, j'ai voulu écrire pour ceux qui n'ont pas le temps de lire dix pages.", "Chaque numéro est relu par un lecteur non spécialiste avant l'envoi."], image: "portrait-2" }],
        ["feat:rows", { title: "Mes règles", items: [{ t: "Sourcer", x: "Chaque chiffre renvoie à une source publique." }, { t: "Simplifier", x: "Une idée par paragraphe." }, { t: "Corriger", x: "Les erreurs sont signalées en tête du numéro suivant." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:info", { title: "Écrire à la rédaction", formTitle: "Votre message", formIntro: "Question, correction ou idée de sujet.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "Si un paragraphe vous perd, c'est ma faute, pas la vôtre.", by: "L'auteur" }],
      ] },
    ],
  },

  // 5. Streamer
  {
    key: "ecran-fantome", name: "Écran Fantôme", category: "createur", tags: ["sombre", "audacieux"], siteType: "Streamer de jeux d'horreur et de survie",
    description: "Site de streamer : noir violacé, rose néon et menthe, titres techniques en capitales, grille de diffusion, communauté et soutien.",
    brand: "Écran Fantôme",
    tokens: { colors: { primary: "#ff2e88", secondary: "#2a0f3d", accent: "#22e5c9", background: "#0e0a14", surface: "#1a1226", text: "#f6eefc", muted: "#b9a9cc" }, fonts: F("oxanium", "ibm-plex-sans"), radius: { sm: 2, md: 4, lg: 6, button: 2, field: 3, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3a2a52" }, type: { h1: { size: 72, weight: 800, lineHeight: 0.98, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 38, weight: 700, lineHeight: 1.08, letterSpacing: 0.02, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "fantome", motifs: ["mesh", "rays", "halftone"] },
    head: ["head:topbar", { info: "En direct du mardi au samedi dès 21 h", note: "Prochain live : mardi 21 h" }], foot: ["foot:big", { title: "Écran Fantôme" }],
    menu: [["Accueil", "/"], ["Programme", "/programme"], ["Communauté", "/communaute"], ["Soutenir", "/soutenir"], ["Contact", "/contact"]], cta: ["Rejoindre le live", "/programme"],
    contact: { address: "Studio de diffusion, Toulouse (Haute-Garonne)", phone: "05 61 33 90 14", email: "live@ecranfantome.example", hours: "Lives du mardi au samedi, 21 h – minuit", tagline: "On a peur ensemble, c'est plus drôle." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Streamer · horreur et survie", title: "On joue dans le noir, vous parlez dans le chat.", sub: "Cinq soirées par semaine, des jeux qui font peur et une communauté qui rit trop fort.", cta: ["Voir le programme", "/programme"], cta2: ["Soutenir la chaîne", "/soutenir"] }],
        ["proof:statsbar", { items: [["14 000", "abonnés (exemple)"], ["900", "heures de live"], ["5", "soirées par semaine"]] }],
        ["misc:schedule", { title: "Cette semaine", items: [{ d: "Mardi", t: "Survie en forêt", x: "Nouvel épisode de la série." }, { d: "Jeudi", t: "Choix du chat", x: "Les spectateurs votent le jeu." }, { d: "Samedi", t: "Nuit blanche", x: "Six heures de live d'horreur." }] }],
        ["gal:wall", { title: "Meilleurs moments", items: [{ t: "Le cri du mardi" }, { t: "Le pari perdu" }, { t: "La porte fermée" }, { t: "Le fou rire de 3 h" }] }],
        ["feat:icons", { title: "Dans le chat", items: [{ icon: "users", t: "Modération bienveillante", x: "Pas de moquerie, pas de spoil." }, { icon: "bell", t: "Alertes de live", x: "Une notification par soirée." }, { icon: "trophy", t: "Défis communautaires", x: "Chaque mois, un jeu choisi par vote." }] }],
        ["cta:band", { title: "Prêt à avoir peur ?", sub: "Le prochain live commence mardi à 21 h.", cta: ["Voir le programme", "/programme"] }],
      ] },
      { key: "programme", name: "Programme", blocks: [
        PH("Programme de la semaine"),
        ["misc:schedule", { title: "Grille", items: [{ d: "Mar. 21 h", t: "Survie en forêt", x: "Épisode 14, à deux micros." }, { d: "Jeu. 21 h", t: "Choix du chat", x: "Vote ouvert dès 20 h." }, { d: "Ven. 22 h", t: "Rediffusion commentée", x: "Les passages ratés." }, { d: "Sam. 21 h", t: "Nuit blanche", x: "Six heures non-stop." }] }],
        ["gal:cards", { items: [{ t: "Survie en forêt", tag: "Série", x: "Quatorze épisodes, un seul survivant." }, { t: "Manoir endormi", tag: "Découverte", x: "Premier niveau en aveugle." }, { t: "Sous-sol 7", tag: "Défi", x: "Terminer sans lampe." }] }],
        ["misc:faq", { items: [{ t: "Peut-on jouer avec vous ?", x: "Lors des soirées communautaires, sur inscription." }, { t: "Les lives sont-ils rediffusés ?", x: "Oui, les meilleurs moments sont montés chaque lundi." }] }],
      ] },
      { key: "communaute", name: "Communauté", blocks: [
        PH("Communauté"),
        ["feat:checks", { title: "Les règles de la maison", cta: ["Rejoindre le chat", "/contact"], items: [{ t: "Respect avant tout" }, { t: "Pas de spoil" }, { t: "Rire avec, jamais contre" }, { t: "Pas de promotion sauvage" }] }],
        ["proof:quotes", { items: [{ q: "Le seul chat où je me sens bien à minuit.", n: "NoctaLéo", r: "Spectateur fictif" }, { q: "Peur garantie, rires aussi.", n: "BrumeMaya", r: "Spectatrice fictive" }, { q: "Je suis venu pour le jeu, resté pour les gens.", n: "Orfeo92", r: "Spectateur fictif" }] }],
        ["proof:team", { title: "Modération", items: [{ n: "Lysandre", r: "Modérateur" }, { n: "Capucine", r: "Modératrice" }, { n: "Mehdi", r: "Monteur" }] }],
      ] },
      { key: "soutenir", name: "Soutenir", blocks: [
        PH("Soutenir la chaîne", "Facultatif, jamais obligatoire."),
        ["price:tiers", { items: [{ t: "Fantôme", price: "3 €", period: "par mois", f: ["Badge dans le chat", "Émotes exclusives"], cta: "Demander le lien", url: "/contact" }, { t: "Spectre", price: "8 €", period: "par mois", f: ["Tout Fantôme", "Vote prioritaire", "Salon privé"], cta: "Demander le lien", url: "/contact", hl: true }, { t: "Revenant", price: "20 €", period: "par mois", f: ["Tout Spectre", "Jouer avec moi une fois par mois"], cta: "Demander le lien", url: "/contact" }] }],
        ["cta:split", { title: "Partenariat de marque", sub: "Matériel, jeux, périphériques : écrivez-nous.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:cards", { title: "Écrire à la chaîne" }],
        ["cta:band", { title: "Rendez-vous dans le noir", cta: ["Voir le programme", "/programme"] }],
      ] },
    ],
  },

  // 6. Consultant indépendant
  {
    key: "levier-solo", name: "Levier Solo", category: "createur", tags: ["moderne", "classique"], siteType: "Consultant indépendant en organisation commerciale",
    description: "Site de consultant indépendant : vert pétrole sur fond clair, serif d'autorité et sans-serif net, méthode en étapes, missions types et réservation d'un appel.",
    brand: "Levier Solo",
    tokens: { colors: { primary: "#0f766e", secondary: "#0b3b3a", accent: "#b45309", background: "#f3f7f6", surface: "#ffffff", text: "#14282a", muted: "#4a5f61" }, fonts: F("lora", "dm-sans"), radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "levier", motifs: ["tiles", "skyline", "topo"] },
    head: ["head:bar", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Missions", "/missions"], ["Méthode", "/methode"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver un appel", "/contact"],
    contact: { address: "Bordeaux (Gironde), interventions en France", phone: "05 56 21 70 48", email: "contact@levier-solo.example", hours: "Appels de cadrage les mardis et jeudis", tagline: "Structurer l'équipe commerciale des PME." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Consultant indépendant", title: "Donnez un cap à l'équipe commerciale de votre PME.", sub: "Je clarifie l'offre, le parcours de vente et le suivi des clients en trois mois, puis je m'efface.", cta: ["Réserver un appel", "/contact"], cta2: ["Voir les missions", "/missions"] }],
        ["feat:cards", { title: "Trois missions types", items: [{ icon: "layers", t: "Cadrage d'offre", x: "Quatre semaines pour reformuler ce que vous vendez et à qui." }, { icon: "network", t: "Parcours de vente", x: "De la première prise de contact au devis signé." }, { icon: "barChart", t: "Tableau de suivi", x: "Cinq indicateurs que votre équipe lit vraiment." }] }],
        ["proof:stats", { title: "En quelques chiffres", items: [["46", "missions menées (exemple)"], ["11 ans", "de terrain commercial"], ["3 mois", "durée moyenne"]] }],
        ["feat:steps", { eyebrow: "Méthode", title: "Comment je travaille", items: [{ d: "Semaine 1", t: "Écouter", x: "Entretiens avec dirigeants, vendeurs et clients." }, { d: "Semaines 2 à 6", t: "Construire", x: "Offre, scripts, outils de suivi." }, { d: "Semaines 7 à 12", t: "Transmettre", x: "Accompagnement terrain et passage de relais." }] }],
        ["proof:quotes", { items: [{ q: "Notre équipe sait enfin ce qu'elle vend, et à qui.", n: "Dirigeant d'une menuiserie", r: "Client fictif" }, { q: "Un tableau simple, que nous utilisons encore.", n: "Responsable commerciale", r: "Cliente fictive" }] }],
        ["cta:card", { title: "Trente minutes pour y voir clair", sub: "Appel de cadrage offert, sans engagement.", cta: ["Réserver un appel", "/contact"] }],
      ] },
      { key: "missions", name: "Missions", blocks: [
        PH("Missions"),
        ["feat:alt", { items: [{ t: "Cadrage d'offre", x: "Ateliers, entretiens clients et nouvelle présentation de vos prestations." }, { t: "Parcours de vente", x: "Cartographie, scripts d'appel, modèles de devis." }, { t: "Pilotage", x: "Tableau de suivi hebdomadaire et revues mensuelles." }] }],
        ["gal:cards", { title: "Cas types", items: [{ t: "Menuiserie, 18 salariés", tag: "Bâtiment", x: "Délai de devis passé de neuf à trois jours." }, { t: "Bureau d'études", tag: "Services", x: "Offre en trois paliers." }, { t: "Cave coopérative", tag: "Vin", x: "Fichier clients remis à plat." }] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        PH("Méthode"),
        ["feat:numbered", { items: [{ t: "1", x: "Un seul interlocuteur du début à la fin." }, { t: "5", x: "indicateurs suivis, pas plus." }, { t: "0", x: "jargon dans les livrables." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Intervenez-vous sur place ?", x: "Une journée par semaine chez vous, le reste à distance." }, { t: "Quelle taille d'entreprise ?", x: "Dix à cent salariés." }, { t: "Que livrez-vous ?", x: "Une offre claire, des outils de vente et un tableau de suivi." }] }],
        ["cta:split", { title: "Voir si ça vous convient", cta: ["Réserver un appel", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        PH("Tarifs", "Prix indicatifs, hors taxes."),
        ["feat:pricelist", { items: [{ t: "Appel de cadrage", x: "30 minutes, offert", price: "0 €" }, { t: "Diagnostic commercial", x: "Une semaine, rapport de dix pages", price: "2 400 €" }, { t: "Mission de trois mois", x: "Une journée par semaine sur site", price: "14 500 €" }, { t: "Accompagnement mensuel", x: "Deux demi-journées par mois", price: "1 200 €" }] }],
        ["misc:faq", { items: [{ t: "Facturez-vous au résultat ?", x: "Non, au forfait, avec un périmètre écrit." }, { t: "Y a-t-il des frais de déplacement ?", x: "Ils sont remboursés au réel, au-delà de 50 km." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:info", { title: "Réserver un appel", formTitle: "Votre situation", formIntro: "Taille de l'équipe, enjeu principal, délai souhaité.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Mardi", "9 h – 12 h"], ["Jeudi", "14 h – 18 h"], ["Autres jours", "sur rendez-vous"]] }],
      ] },
    ],
  },

  // 7. Développeur freelance
  {
    key: "terminal-vert", name: "Terminal Vert", category: "createur", tags: ["technique", "sombre"], siteType: "Développeur freelance spécialisé en applications web",
    description: "Portfolio de développeur : fond charbon vert, vert terminal, titres en chasse fixe, stack en grille d'icônes, réalisations et formules d'accompagnement.",
    brand: "Terminal Vert",
    tokens: { colors: { primary: "#4ade80", secondary: "#0f2a1a", accent: "#fbbf24", background: "#0a0f0c", surface: "#121b15", text: "#e6f4ea", muted: "#9db5a5" }, fonts: F("space-mono", "inter"), radius: { sm: 2, md: 4, lg: 6, button: 3, field: 3, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#243a2c" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.12, letterSpacing: -0.02 }, h2: { size: 30, weight: 700, lineHeight: 1.2, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "terminal", motifs: ["tiles", "mesh", "plates"] },
    head: ["head:minimal", {}], foot: ["foot:columns", { about: "Développeur web indépendant. Applications métier, API et outils internes.", cols: [["Site", "Services", "Réalisations", "Tarifs"], ["Contact", "Écrire", "Disponibilités"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Réalisations", "/realisations"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Parler de mon projet", "/contact"],
    contact: { address: "Rennes (Ille-et-Vilaine), à distance", phone: "02 99 12 47 36", email: "dev@terminalvert.example", hours: "Disponible à partir de janvier", tagline: "Du code lisible, livré par petites étapes." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Développeur freelance · disponible en janvier", title: "Des applications web sobres, rapides, maintenables.", sub: "Je conçois et livre vos outils internes et vos API, avec une mise en production toutes les deux semaines.", cta: ["Parler de mon projet", "/contact"], cta2: ["Voir les réalisations", "/realisations"], stats: [["12 ans", "de développement"], ["40+", "applications livrées (exemple)"], ["2 sem.", "entre deux livraisons"]] }],
        ["feat:grid-icons", { title: "Stack", items: [{ icon: "layout", t: "Interfaces", x: "Composants accessibles et rapides." }, { icon: "settings", t: "API", x: "Documentées, testées, versionnées." }, { icon: "layers", t: "Bases de données", x: "Modélisation et migrations sûres." }, { icon: "gitBranch", t: "Livraison continue", x: "Revue, tests, déploiement automatisé." }] }],
        ["feat:bento", { title: "Pourquoi travailler ensemble", items: [{ icon: "eye", t: "Transparence", x: "Accès au dépôt dès le premier jour, point hebdomadaire de dix minutes." }, { icon: "shield", t: "Sécurité", x: "Mises à jour et sauvegardes planifiées." }, { icon: "book", t: "Documentation", x: "Chaque livraison est expliquée." }] }],
        ["proof:quotes", { items: [{ q: "Un outil interne livré en six semaines, sans réunion inutile.", n: "Responsable logistique", r: "Cliente fictive" }, { q: "Le code est propre, notre équipe a repris le projet sans douleur.", n: "Directeur technique", r: "Client fictif" }] }],
        ["cta:band", { title: "Un projet web à cadrer ?", sub: "Réponse sous 48 h.", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        PH("Services"),
        ["feat:rows", { items: [{ t: "Outils internes", x: "Back-offices, tableaux de bord, automatisations de tâches répétitives." }, { t: "API et intégrations", x: "Brancher vos logiciels entre eux, sans doublons de saisie." }, { t: "Reprise de code", x: "Audit, tests, mise à niveau d'une application ancienne." }, { t: "Accompagnement technique", x: "Revues de code et conseils pour une petite équipe." }] }],
        ["feat:checks", { title: "Livrables", cta: ["Demander un devis", "/contact"], items: [{ t: "Code source et dépôt à votre nom" }, { t: "Tests automatisés" }, { t: "Documentation de mise en route" }, { t: "Trois mois de correctifs inclus" }] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        PH("Réalisations"),
        ["gal:cards", { items: [{ t: "Planning d'atelier", tag: "Outil interne", x: "Affectation des machines pour une PME de mécanique." }, { t: "Passerelle de facturation", tag: "API", x: "Synchronisation entre caisse et comptabilité." }, { t: "Portail de réservation", tag: "Application", x: "Réservation de salles pour une mairie." }, { t: "Reprise d'un extranet", tag: "Audit", x: "Mise à jour d'un logiciel de huit ans." }] }],
        ["proof:statsbar", { items: [["99,9 %", "disponibilité mesurée (exemple)"], ["2 sem.", "cycle de livraison"], ["0", "régression bloquante en 2024"]] }],
        ["cta:split", { title: "Voir le code", sub: "Un extrait commenté est disponible sur demande.", cta: ["Le demander", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        PH("Tarifs", "Hors taxes, devis écrit avant chaque mission."),
        ["price:tiers", { items: [{ t: "Journée", price: "520 €", period: "par jour", f: ["Mission courte", "Facturation à la journée"], cta: "Demander un devis", url: "/contact" }, { t: "Forfait", price: "dès 4 800 €", f: ["Périmètre écrit", "Livraison par étapes", "Trois mois de correctifs"], cta: "Demander un devis", url: "/contact", hl: true }, { t: "Mensuel", price: "2 100 €", period: "par mois", f: ["Dix jours par trimestre", "Maintenance et évolutions"], cta: "Demander un devis", url: "/contact" }] }],
        ["misc:faq", { items: [{ t: "Travaillez-vous en équipe ?", x: "Oui, avec votre équipe ou avec un designer partenaire." }, { t: "Quel est le délai de démarrage ?", x: "Environ trois semaines après la signature du devis." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:info", { title: "Décrivez votre projet", formTitle: "Brief rapide", formIntro: "Contexte, délai, budget approximatif.", cta: ["Envoyer", "/contact"] }],
        ["misc:text", { eyebrow: "Disponibilités", title: "Prochain créneau libre : janvier", paras: ["Je prends deux projets à la fois pour garder du temps de qualité sur chacun."] }],
      ] },
    ],
  },

  // 8. Coach en ligne
  {
    key: "souffle-neuf", name: "Souffle Neuf", category: "createur", tags: ["chaleureux", "naturel"], siteType: "Coach en ligne en gestion du stress et du sommeil",
    description: "Site de coach en ligne : vert mousse et sable, titres géométriques doux, programme en semaines, formules de suivi et témoignages d'accompagnés.",
    brand: "Souffle Neuf",
    tokens: { colors: { primary: "#4d7c0f", secondary: "#2c3d14", accent: "#c2410c", background: "#f8f6ee", surface: "#ffffff", text: "#26301c", muted: "#55604a" }, fonts: F("poppins", "lora"), radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 20 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 600, lineHeight: 1.12, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "pill" }, art: { seed: "souffle", motifs: ["botanical", "dunes", "blobs"] },
    head: ["head:side", {}], foot: ["foot:columns", { about: "Accompagnement en ligne pour mieux dormir et mieux récupérer, à votre rythme.", cols: [["Programme", "La méthode", "Formules", "Questions"], ["Suivi", "Séance découverte", "Contact"]] }],
    menu: [["Accueil", "/"], ["Programme", "/programme"], ["Formules", "/formules"], ["Questions", "/questions"], ["Contact", "/contact"]], cta: ["Séance découverte", "/contact"],
    contact: { address: "Séances en visioconférence, depuis Annecy (Haute-Savoie)", phone: "04 50 27 63 19", email: "bonjour@souffleneuf.example", hours: "Séances du lundi au jeudi, 9 h – 19 h", tagline: "Retrouver un sommeil et un souffle apaisés." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Coaching en ligne", title: "Dormez mieux, respirez plus calmement, à votre rythme.", sub: "Un programme de huit semaines en visioconférence, avec des exercices courts à faire chez soi.", cta: ["Séance découverte offerte", "/contact"], cta2: ["Voir le programme", "/programme"] }],
        ["feat:icons", { title: "Ce que vous allez travailler", items: [{ icon: "moon", t: "Sommeil", x: "Rituels du soir et réveils nocturnes." }, { icon: "activity", t: "Respiration", x: "Trois exercices de cinq minutes." }, { icon: "heart", t: "Gestion du stress", x: "Reconnaître et désamorcer les tensions." }] }],
        ["proof:big", { items: [{ q: "En deux mois, je me suis réveillée moins fatiguée qu'en deux ans.", n: "Camille V.", r: "Accompagnée fictive" }] }],
        ["feat:steps", { title: "Votre parcours", items: [{ d: "Étape 1", t: "Séance découverte", x: "Quarante minutes pour faire le point, offertes." }, { d: "Étapes 2 à 7", t: "Séances hebdomadaires", x: "Exercices, journal et ajustements." }, { d: "Étape 8", t: "Bilan", x: "Ce qui marche, ce qu'on garde." }] }],
        ["proof:stats", { items: [["180", "personnes accompagnées (exemple)"], ["8", "semaines de programme"], ["4,8", "note moyenne (exemple)"]] }],
        ["cta:image", { title: "Commencez par une conversation", sub: "Quarante minutes, sans engagement.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "programme", name: "Programme", blocks: [
        PH("Le programme de huit semaines"),
        ["feat:tabs", { items: [{ t: "Semaines 1 et 2", x: "Observer son sommeil et poser des repères réguliers." }, { t: "Semaines 3 à 5", x: "Respiration, détente musculaire et rituels du soir." }, { t: "Semaines 6 à 8", x: "Consolider, gérer les rechutes et préparer l'après." }] }],
        ["feat:list2", { title: "Inclus", bg: "token:surface", items: [{ t: "Huit séances en visioconférence" }, { t: "Journal de sommeil guidé" }, { t: "Audios de relaxation" }, { t: "Messages entre les séances" }] }],
        ["cta:card", { title: "Pas sûr que ce soit pour vous ?", sub: "La séance découverte sert à le savoir.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "formules", name: "Formules", blocks: [
        PH("Formules", "Réglées après un échange, pas en ligne."),
        ["price:tiers", { items: [{ t: "Séance unique", price: "70 €", f: ["Une heure en visioconférence", "Plan d'action écrit"], cta: "Demander à réserver", url: "/contact" }, { t: "Programme complet", price: "480 €", f: ["Huit séances", "Audios et journal", "Messages entre les séances"], cta: "Demander à réserver", url: "/contact", hl: true }, { t: "Atelier de groupe", price: "35 €", period: "par personne", f: ["Quatre personnes maximum", "Deux heures"], cta: "Demander à réserver", url: "/contact" }] }],
        ["proof:quotes", { items: [{ q: "Les audios m'accompagnent chaque soir.", n: "Laure P.", r: "Accompagnée fictive" }, { q: "Pas de pression, juste une vraie écoute.", n: "Simon T.", r: "Accompagné fictif" }] }],
      ] },
      { key: "questions", name: "Questions", blocks: [
        PH("Questions fréquentes"),
        ["misc:faq", { items: [{ t: "Est-ce un suivi médical ?", x: "Non. Le coaching complète un suivi médical, il ne le remplace pas." }, { t: "Faut-il du matériel ?", x: "Un ordinateur ou un téléphone, et un endroit calme." }, { t: "Puis-je annuler une séance ?", x: "Oui, jusqu'à 24 heures avant." }] }],
        ["feat:rows", { title: "Mon approche", items: [{ t: "Douce", x: "Aucun défi irréaliste." }, { t: "Progressive", x: "Un changement à la fois." }, { t: "Mesurée", x: "Un journal pour voir les progrès." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:info", { title: "Réserver la séance découverte", formTitle: "Votre message", formIntro: "Dites-moi en quelques mots ce qui vous préoccupe.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Créneaux", rows: [["Lundi – jeudi", "9 h – 19 h"], ["Vendredi", "9 h – 12 h"], ["Week-end", "fermé"]] }],
      ] },
    ],
  },

  // 9. Lien-en-bio / hub de créateur
  {
    key: "tous-mes-liens", name: "Tous mes Liens", category: "createur", tags: ["moderne", "audacieux"], siteType: "Page de liens (lien en bio) d'une illustratrice",
    description: "Hub de créatrice : violet vif sur lavande, titres compacts en capitales, dégradé d'accueil, liens en bandes, boutique d'impressions en démonstration et contact.",
    brand: "Mina Lien",
    modules: ["Boutique en ligne : le module e-commerce n'est pas installé, les impressions présentées sont une démonstration"],
    tokens: { colors: { primary: "#7c3aed", secondary: "#2e1065", accent: "#f97316", background: "#f5f3ff", surface: "#ffffff", text: "#1e1b3a", muted: "#55527a" }, fonts: F("kanit", "karla"), radius: { sm: 10, md: 16, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "md" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.02, letterSpacing: -0.01, transform: "uppercase" } } },
    dna: { scale: "l", pad: "tight", align: "center", shape: "pill" }, art: { seed: "liens", motifs: ["blobs", "ribbons", "objects"] },
    head: ["head:center", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Liens", "/liens"], ["Boutique", "/boutique"], ["Projets", "/projets"], ["Contact", "/contact"]], cta: ["Me suivre", "/liens"],
    contact: { address: "Atelier partagé, Montpellier (Hérault)", phone: "04 67 90 25 77", email: "mina@mina-lien.example", hours: "Réponse le mardi et le vendredi", tagline: "Illustratrice : tout ce que je fais, au même endroit." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Illustratrice indépendante", title: "Tout Mina, au même endroit.", sub: "Mes dessins du jour, mes impressions, mes livres jeunesse et ma lettre mensuelle.", cta: ["Voir tous les liens", "/liens"], cta2: ["Boutique", "/boutique"], stats: [["42 000", "abonnés (exemple)"], ["6", "livres illustrés"], ["1", "dessin par jour"]] }],
        ["feat:strips", { title: "Mes liens du moment", items: [{ t: "Le dessin du jour", x: "Un croquis publié chaque matin." }, { t: "Ma lettre mensuelle", x: "Coulisses d'atelier et fonds d'écran offerts." }, { t: "Mon dernier livre", x: "Un album jeunesse sur les nuages." }, { t: "Commandes d'illustration", x: "Affiches, couvertures et logos." }] }],
        ["gal:products", { title: "Impressions à l'unité", items: [{ t: "Nuage de poche", price: "18 €" }, { t: "Le renard lecteur", price: "24 €" }, { t: "Carte postale (lot de 5)", price: "9 €" }, { t: "Affiche A3 Marées", price: "32 €" }] }],
        ["proof:logos", { title: "Elle a illustré pour", items: ["Éditions Pomme d'Orge", "Café des Cinéastes", "Festival des Petits Papiers", "Coopérative Mille-Feuilles"] }],
        ["misc:marquee", { items: ["Impressions en démonstration", "Nouvelle lettre le 1er du mois", "Commandes ouvertes en janvier"] }],
        ["cta:band", { title: "Une collaboration en tête ?", sub: "Couvertures, affiches, identités : écrivez-moi.", cta: ["Me contacter", "/contact"] }],
      ] },
      { key: "liens", name: "Liens", blocks: [
        PH("Tous mes liens"),
        ["feat:rows", { items: [{ t: "Le dessin du jour", x: "Un croquis publié chaque matin sur mes réseaux." }, { t: "La lettre mensuelle", x: "Coulisses, fonds d'écran et dates de dédicace." }, { t: "Mes livres", x: "Six albums jeunesse chez des éditeurs indépendants." }, { t: "Mes cours en ligne", x: "Initiation au dessin à l'encre, en six vidéos." }] }],
        ["feat:icons", { title: "Me suivre", bg: "token:surface", items: [{ icon: "image", t: "Galerie", x: "Les dessins du mois." }, { icon: "mail", t: "Lettre", x: "Une fois par mois." }, { icon: "play", t: "Vidéos", x: "Du dessin en accéléré." }] }],
        ["cta:card", { title: "Rester au courant", sub: "La lettre arrive le 1er du mois.", cta: ["Écrire pour s'inscrire", "/contact"] }],
      ] },
      { key: "boutique", name: "Boutique", blocks: [
        PH("Boutique", "Catalogue de démonstration : les commandes se font par message."),
        ["gal:products", { items: [{ t: "Nuage de poche", price: "18 €" }, { t: "Le renard lecteur", price: "24 €" }, { t: "Carte postale (lot de 5)", price: "9 €" }, { t: "Affiche A3 Marées", price: "32 €" }] }],
        ["misc:product", { eyebrow: "Impression d'art", title: "Affiche A3 Marées", price: "32 €", text: "Illustration à l'encre et à l'aquarelle, imprimée sur papier 250 g à grain fin.", points: ["Format A3, 29,7 × 42 cm", "Tirage numéroté à 100 exemplaires", "Livrée roulée dans un tube"], cta: "Demander cette affiche", url: "/contact", note: "Démonstration : aucun paiement en ligne, réponse par e-mail." }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        PH("Projets"),
        ["gal:masonry", { items: [{ t: "Album Les Nuages", x: "Livre jeunesse" }, { t: "Affiche de festival", x: "Commande" }, { t: "Menu illustré", x: "Café" }, { t: "Carnet de voyage", x: "Projet personnel" }, { t: "Couverture de roman", x: "Édition" }] }],
        ["feat:alt", { items: [{ t: "Livres jeunesse", x: "Six albums illustrés, dont le dernier sur les nuages.", link: ["Me contacter", "/contact"] }, { t: "Commandes d'illustration", x: "Affiches, couvertures et identités pour petites structures.", link: ["Demander un devis", "/contact"] }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        PH("Contact"),
        ["contact:cards", { title: "Écrivez-moi" }],
        ["misc:faq", { items: [{ t: "Prenez-vous des commandes ?", x: "Oui, deux projets par mois, ouverture en janvier." }, { t: "Comment commander une impression ?", x: "Par message : je réponds avec les modalités de paiement et d'envoi." }] }],
      ] },
    ],
  },
];
