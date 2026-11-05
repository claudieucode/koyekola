// Magazines et médias (9 thèmes, lot B). Textes de DÉMONSTRATION : titres, rédactions, personnes et coordonnées fictifs.
const T = (h, b, bt) => ({ heading: "font." + h, body: "font." + b, button: "font." + (bt || b), link: "font." + b });
const Q = (q, n, r) => ({ q, n, r: r || "client fictif" });
module.exports = [
  // 1. Journal local en ligne
  {
    key: "gazette-lisiere", name: "Gazette de l'Aulne", category: "magazine", tags: ["editorial", "classique"], siteType: "Journal local en ligne",
    description: "Journal de proximité en ligne : sarcelle profonde, titres en slab serif robustes, grille d'articles dense et rubriques par commune. Lisible, sobre et rapide à parcourir.",
    brand: "Le Fil de l'Aulne",
    tokens: { colors: { primary: "#0f766e", secondary: "#10302d", accent: "#d97706", background: "#ffffff", surface: "#f1f6f5", text: "#14201f", muted: "#4a5b59" }, fonts: T("roboto-slab", "figtree"), radius: { sm: 2, md: 4, lg: 6, button: 3, field: 3, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#cfdcda" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "fil-aulne", motifs: ["skyline", "plates", "topo"] },
    head: ["head:topbar", { info: "Brest métropole · Mardi, édition du matin", note: "Alerte : coupures d'eau jeudi à Lambézellec" }], foot: ["foot:simple", {}],
    menu: [["À la une", "/"], ["Communes", "/communes"], ["Article", "/article"], ["Contribuer", "/contribuer"], ["Soutenir", "/soutenir"]], cta: ["Soutenir le journal", "/soutenir"],
    contact: { address: "4 quai de la Douane, 29200 Brest", phone: "02 98 00 31 20", email: "redaction@fil-aulne.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h", tagline: "Le journal des communes de l'Aulne." },
    pages: [
      { key: "accueil", name: "À la une", blocks: [
        ["misc:marquee", { items: ["Conseil municipal : la séance de lundi en direct", "Marché de Noël : le programme complet", "Travaux rue Jean-Jaurès : déviations en place"] }],
        ["hero:split-left", { eyebrow: "À la une", title: "La halle du port rouvre après deux ans de rénovation", sub: "Quinze commerçants, un café associatif et un marché couvert le samedi : visite en avant-première du nouveau lieu de vie du quartier.", cta: ["Lire l'article", "/article"], cta2: ["Toutes les communes", "/communes"], image: "hero" }],
        ["misc:posts", { title: "Les derniers articles", count: 6, layout: "grid" }],
        ["feat:tabs", { eyebrow: "Rubriques", title: "L'actualité de votre commune", items: [{ t: "Vie municipale", x: "Budgets, permis de construire, comptes rendus de séance : nous suivons chaque conseil et expliquons les décisions." }, { t: "Associations", x: "Clubs, bénévoles, fêtes de quartier. Envoyez-nous vos dates, nous les publions gratuitement." }, { t: "Emploi et commerces", x: "Ouvertures, reprises, offres locales : la vie économique de proximité." }, { t: "Sport amateur", x: "Résultats du week-end, portraits d'entraîneurs, calendrier des tournois." }] }],
        ["proof:stats", { title: "Le journal en quelques chiffres (exemples)", items: [["21", "communes couvertes"], ["9", "journalistes et correspondants"], ["48 000", "lectures par mois"]] }],
        ["cta:card", { title: "Un journal local vit de ses lecteurs", sub: "Dès 4 € par mois, vous financez des reportages qui n'existeraient pas autrement.", cta: ["Soutenir le journal", "/soutenir"] }],
      ] },
      { key: "communes", name: "Communes", blocks: [
        ["misc:pagehead", { title: "Les communes", sub: "Choisissez votre commune pour suivre l'actualité qui vous touche." }],
        ["feat:list2", { title: "Territoires couverts", items: [{ t: "Brest centre et Recouvrance", x: "" }, { t: "Lambézellec et Saint-Marc", x: "" }, { t: "Guilers et Bohars", x: "" }, { t: "Plouzané et Locmaria", x: "" }, { t: "Gouesnou et Guipavas", x: "" }, { t: "Le Relecq-Kerhuon", x: "" }] }],
        ["misc:posts", { title: "Dernières nouvelles locales", count: 6, layout: "list" }],
        ["misc:search", { title: "Chercher dans nos archives" }],
      ] },
      { key: "article", name: "Article", blocks: [
        ["misc:pagehead", { title: "Reportage", sub: "Vie de quartier · 5 min de lecture" }],
        ["misc:article", { tag: "Reportage", title: "Halle du port : le marché couvert reprend vie", meta: "Par Nolwenn Le Goff · publié lundi à 7 h 40", paras: ["Les volets métalliques se sont relevés ce week-end sur quinze étals flambant neufs. Poissonnier, fromagère, torréfacteur : la plupart des commerçants étaient déjà là avant la fermeture de 2023.", "Le chantier a coûté 3,2 millions d'euros, dont un tiers financé par la région. La toiture, entièrement refaite, abrite désormais des panneaux solaires qui couvrent l'éclairage de la halle.", "Un café associatif ouvrira à l'étage en janvier, géré par une coopérative d'habitants du quartier."], quote: "On voulait un lieu où l'on vienne même sans rien acheter.", by: "Une adjointe au maire, propos recueillis sur place" }],
        ["cta:band", { title: "Une information à nous confier ?", sub: "Écrivez-nous : vos sources sont protégées.", cta: ["Écrire à la rédaction", "/contribuer"] }],
      ] },
      { key: "contribuer", name: "Contribuer", blocks: [
        ["misc:pagehead", { title: "Contribuer", sub: "Un événement, une alerte, une correction : dites-le-nous." }],
        ["feat:steps", { title: "Comment ça marche", items: [{ t: "Vous nous écrivez", x: "Par le formulaire ou par e-mail, avec vos photos et vos coordonnées.", d: "1" }, { t: "Nous vérifions", x: "Un journaliste recoupe l'information avec au moins deux sources.", d: "2" }, { t: "Nous publions", x: "L'annonce paraît en ligne et dans la lettre du soir.", d: "3" }] }],
        ["contact:info", { title: "Écrire à la rédaction", formTitle: "Votre message", formIntro: "Événement associatif, erreur à corriger, sujet à traiter.", cta: ["Envoyer", "/contribuer"] }],
      ] },
      { key: "soutenir", name: "Soutenir", blocks: [
        ["misc:pagehead", { title: "Soutenir le journal", sub: "Indépendant, sans publicité intrusive, financé par ses lecteurs." }],
        ["price:tiers", { title: "Formules de soutien (exemples)", items: [{ t: "Lecteur", price: "4 €", period: "/mois", f: ["Tous les articles", "Lettre du soir"], cta: "Nous contacter", url: "/contribuer" }, { t: "Voisin", price: "9 €", period: "/mois", hl: true, f: ["Accès illimité", "Hors-séries annuels", "Invitation aux rencontres lecteurs"], cta: "Nous contacter", url: "/contribuer" }, { t: "Mécène", price: "25 €", period: "/mois", f: ["Toutes les formules", "Nom au générique annuel"], cta: "Nous contacter", url: "/contribuer" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je résilier à tout moment ?", x: "Oui, d'un simple e-mail, sans justification." }, { t: "Mon don est-il déductible ?", x: "Renseignez-vous auprès de la rédaction : la réponse dépend de la formule choisie (exemple de démonstration)." }] }],
      ] },
    ],
  },

  // 2. Newsletter payante (présentation)
  {
    key: "lettre-sillage", name: "Lettre du Sillage", category: "magazine", tags: ["editorial", "chaleureux"], siteType: "Newsletter payante, page de présentation",
    description: "Page de présentation d'une newsletter payante : papier crème, ambre brûlé, titres serif élégants en une colonne, extraits lisibles et formules d'abonnement claires.",
    brand: "La Lettre du Sillage",
    tokens: { colors: { primary: "#b45309", secondary: "#2b1a0e", accent: "#0f766e", background: "#fbf6ee", surface: "#f3e9d8", text: "#2a1d12", muted: "#665544" }, fonts: T("ibarra-real-nova", "chivo"), radius: { sm: 2, md: 6, lg: 10, button: 6, field: 6, card: 8 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 600, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "soft" }, art: { seed: "sillage", motifs: ["ribbons", "waves", "blobs"] },
    head: ["head:minimal", {}], foot: ["foot:newsletter", { title: "Recevoir le prochain numéro gratuit", sub: "Un essai de lecture, sans engagement, chaque dimanche à 7 h.", button: "Me contacter" }],
    menu: [["Accueil", "/"], ["Extraits", "/extraits"], ["Formules", "/formules"], ["L'autrice", "/autrice"], ["Contact", "/contact"]], cta: ["S'abonner", "/formules"],
    contact: { address: "Lettre envoyée depuis Nantes", phone: "02 40 00 18 77", email: "bonjour@lettre-sillage.example", hours: "Réponse sous 48 h, du lundi au vendredi", tagline: "Un regard sur l'économie de la mer, chaque dimanche." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Newsletter hebdomadaire · 7 400 lecteurs (exemple)", title: "L'économie de la mer, expliquée un dimanche à la fois", sub: "Ports, pêche, énergies marines : une analyse de 2 000 mots, sourcée et sans jargon, dans votre boîte e-mail.", cta: ["Choisir ma formule", "/formules"], cta2: ["Lire un extrait", "/extraits"] }],
        ["proof:logos", { title: "Lue par des équipes de (organisations fictives)", items: ["Port Atlantis", "Armement Bréhat", "Cluster Marée", "Institut Houle", "Coopérative Goémon"] }],
        ["feat:numbered", { eyebrow: "Ce que vous recevez", title: "Un rendez-vous, trois bénéfices", items: [{ t: "Une analyse", x: "Un sujet traité à fond : chiffres, contexte et points de vue contradictoires." }, { t: "Cinq signaux", x: "La revue de presse commentée de la semaine, en dix minutes." }, { t: "Une question", x: "Chaque numéro se termine par une question ouverte à laquelle je réponds." }] }],
        ["proof:big", { items: [{ q: "Le seul rendez-vous dominical que je ne reporte jamais. Clair, précis, jamais complaisant.", n: "Lectrice abonnée", r: "témoignage fictif" }] }],
        ["feat:compare", { eyebrow: "Gratuit ou payant", title: "Ce qui change avec l'abonnement", rows: [["", "Gratuit", "Abonné"], ["Analyse du dimanche", "Résumé", "Intégrale"], ["Archives (180 numéros)", "non", "oui"], ["Revue de presse commentée", "non", "oui"], ["Réponse à vos questions", "non", "oui"]] }],
        ["cta:image", { title: "Essayez 30 jours pour 1 €", sub: "Sans engagement, résiliable en un message.", cta: ["Commencer l'essai", "/formules"] }],
      ] },
      { key: "extraits", name: "Extraits", blocks: [
        ["misc:pagehead", { title: "Lire des extraits", sub: "Quatre numéros en accès libre pour vous faire une idée." }],
        ["misc:article", { tag: "Extrait n° 118", title: "Pourquoi le port de demain sera d'abord une centrale électrique", meta: "Dimanche · 9 min de lecture", paras: ["Pendant trente ans, un port se mesurait en tonnes manutentionnées. Désormais, la question que posent les armateurs est d'abord celle de l'électricité disponible à quai.", "À Saint-Nazaire comme à Rotterdam, les terminaux investissent dans le branchement électrique des navires. Un chantier lourd, mais qui change la valeur d'un quai."], quote: "Le prochain avantage concurrentiel d'un port, ce sont des kilowattheures.", by: "Extrait de la lettre n° 118" }],
        ["feat:rows", { title: "Aussi dans les archives", items: [{ t: "n° 117 · Pêche : qui fixe vraiment le prix du poisson ?", x: "De la criée à l'étal, une chaîne en cinq intermédiaires." }, { t: "n° 116 · L'éolien flottant à l'épreuve du réel", x: "Coûts, calendrier, emplois : ce que disent les chiffres." }, { t: "n° 115 · Les assurances maritimes face au climat", x: "Pourquoi les primes montent sur la façade atlantique." }] }],
      ] },
      { key: "formules", name: "Formules", blocks: [
        ["misc:pagehead", { title: "Choisir ma formule", sub: "Trois façons de lire, une seule exigence." }],
        ["price:tiers", { title: "Abonnements (exemples)", items: [{ t: "Mensuel", price: "7 €", period: "/mois", f: ["Intégrale du dimanche", "Archives complètes"], cta: "Nous écrire", url: "/contact" }, { t: "Annuel", price: "60 €", period: "/an", hl: true, f: ["Deux mois offerts", "Revue de presse commentée", "Questions aux auteurs"], cta: "Nous écrire", url: "/contact" }, { t: "Équipe", price: "240 €", period: "/an", f: ["Jusqu'à 8 lecteurs", "Facture annuelle", "Réunion de restitution"], cta: "Nous écrire", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Comment se passe la résiliation ?", x: "Un e-mail suffit, l'abonnement s'arrête à la fin de la période payée." }, { t: "Puis-je offrir un abonnement ?", x: "Oui : écrivez-nous, nous préparons un bon cadeau pour 3, 6 ou 12 mois." }, { t: "Le paiement est-il actif sur ce site ?", x: "Non, ce site est une présentation : les abonnements se gèrent par échange avec l'autrice." }] }],
      ] },
      { key: "autrice", name: "L'autrice", blocks: [
        ["misc:pagehead", { title: "L'autrice", sub: "Dix ans de journalisme maritime, un point de vue indépendant." }],
        ["misc:story", { eyebrow: "Qui écrit ?", title: "Une ancienne journaliste de presse économique", paras: ["Après dix ans en rédaction, j'ai créé cette lettre pour prendre le temps de comprendre un sujet avant d'en parler.", "Aucune publicité, aucun sponsor : seuls les abonnés financent ce travail, et c'est ce qui garantit mon indépendance."], image: "portrait-2" }],
        ["feat:checks", { title: "Mes engagements", cta: ["Me contacter", "/contact"], items: [{ t: "Sources citées dans chaque numéro" }, { t: "Corrections signalées en tête de lettre" }, { t: "Liens d'intérêt déclarés" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Abonnement, idée de sujet, correction." }],
        ["contact:cards", { title: "Me joindre", cta: ["Envoyer", "/contact"] }],
        ["misc:faq", { items: [{ t: "Répondez-vous aux lecteurs ?", x: "Oui, sous 48 h ouvrées, y compris pour proposer un sujet." }, { t: "Acceptez-vous les communiqués ?", x: "Non, la lettre n'est pas un relais de presse." }] }],
      ] },
    ],
  },

  // 3. Site de podcast (sombre)
  {
    key: "ondes-sourdes", name: "Onde Noire", category: "magazine", tags: ["sombre", "audacieux"], siteType: "Site de podcast",
    description: "Site de podcast nocturne : fond nuit violacé, lavande électrique, titres compacts en capitales et grandes vignettes d'épisodes. Pensé pour l'écoute et le programme de saison.",
    brand: "Radio Nocturne",
    tokens: { colors: { primary: "#a78bfa", secondary: "#2a1f4a", accent: "#f0abfc", background: "#12101c", surface: "#1d1a2e", text: "#f3f0fa", muted: "#b6b0cc" }, fonts: T("league-spartan", "barlow"), radius: { sm: 4, md: 8, lg: 14, button: 999, field: 8, card: 14 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#352f52" }, type: { h1: { size: 64, weight: 800, lineHeight: 1.0, letterSpacing: -0.02, transform: "uppercase" }, h2: { size: 38, weight: 800, lineHeight: 1.05, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "pill" }, art: { seed: "onde-noire", motifs: ["rays", "mesh", "bokeh"] },
    head: ["head:dark", {}], foot: ["foot:big", { title: "Radio Nocturne" }],
    menu: [["Accueil", "/"], ["Épisodes", "/episodes"], ["Saison en cours", "/saison"], ["Les voix", "/voix"], ["Contact", "/contact"]], cta: ["Écouter", "/episodes"],
    contact: { address: "Studio 3, 12 rue des Tanneurs, 31000 Toulouse", phone: "05 61 00 74 12", email: "studio@radio-nocturne.example", hours: "Nouvel épisode chaque jeudi à 6 h", tagline: "Des histoires vraies, à écouter la nuit." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Podcast narratif · saison 4", title: "Écoutez la nuit autrement", sub: "Des récits vrais, mis en son, de 35 minutes. Un nouvel épisode chaque jeudi, sans publicité.", cta: ["Dernier épisode", "/episodes"], cta2: ["Voir la saison", "/saison"] }],
        ["gal:featured", { items: [{ t: "S4E7 · Le phare qui ne répondait plus", x: "38 min · Disparition en mer d'Iroise", tag: "Nouveau" }, { t: "S4E6 · La dernière ligne de train", x: "34 min", tag: "Récit" }, { t: "S4E5 · Une lettre sans adresse", x: "29 min", tag: "Enquête" }, { t: "S4E4 · Les veilleurs de nuit", x: "41 min", tag: "Portrait" }] }],
        ["proof:statsbar", { items: [["32", "épisodes publiés"], ["180 000", "écoutes par mois (exemple)"], ["4", "saisons"]] }],
        ["feat:icons", { eyebrow: "Où nous écouter", title: "Partout où vous aimez écouter", items: [{ t: "Application de podcasts", x: "Abonnez-vous au flux RSS depuis n'importe quelle application.", icon: "smartphone" }, { t: "Sur ce site", x: "Chaque épisode a sa page, avec texte complet et ressources.", icon: "play" }, { t: "En version transcrite", x: "Les transcriptions sont accessibles pour toutes et tous.", icon: "fileText" }] }],
        ["proof:quotes", { items: [Q("Des récits qui m'accompagnent jusqu'au bout de la nuit.", "Auditrice fidèle"), Q("Le travail sonore est d'une finesse rare.", "Auditeur"), Q("On sent le temps passé à chaque épisode.", "Auditrice")] }],
        ["cta:band", { title: "Ne manquez aucun jeudi", sub: "Abonnez-vous au flux et recevez chaque épisode à 6 h.", cta: ["Voir tous les épisodes", "/episodes"] }],
      ] },
      { key: "episodes", name: "Épisodes", blocks: [
        ["misc:pagehead", { title: "Tous les épisodes", sub: "De la saison 1 à aujourd'hui." }],
        ["gal:cards", { items: [{ t: "Le phare qui ne répondait plus", x: "Un gardien disparaît, la radio reste muette.", tag: "S4E7" }, { t: "La dernière ligne de train", x: "Dernier voyage d'un contrôleur de nuit.", tag: "S4E6" }, { t: "Une lettre sans adresse", x: "Enquête sur un courrier jamais distribué.", tag: "S4E5" }, { t: "Les veilleurs de nuit", x: "Hôpitaux, usines, ports : ceux qui restent éveillés.", tag: "S4E4" }, { t: "Le maître de l'écho", x: "Rencontre avec un ingénieur du son.", tag: "S4E3" }, { t: "Radio fantôme", x: "Les fréquences oubliées de la région.", tag: "S4E2" }] }],
        ["misc:posts", { title: "Notes d'épisode et coulisses", count: 3, layout: "list" }],
      ] },
      { key: "saison", name: "Saison en cours", blocks: [
        ["misc:pagehead", { title: "Saison 4 · Les nuits blanches", sub: "Dix épisodes, du 5 septembre au 7 novembre." }],
        ["misc:schedule", { title: "Calendrier de sortie", items: [{ d: "5 sept.", t: "Épisode 1 · Les insomniaques", x: "Ouverture de saison." }, { d: "19 sept.", t: "Épisode 3 · Le maître de l'écho", x: "Rencontre sonore." }, { d: "10 oct.", t: "Épisode 6 · La dernière ligne de train", x: "Récit." }, { d: "7 nov.", t: "Épisode 10 · Le matin", x: "Final de saison." }] }],
        ["feat:rows", { title: "Les thèmes de la saison", items: [{ t: "Le travail de nuit", x: "Comprendre ceux qui veillent pour les autres." }, { t: "Les sons disparus", x: "Archives sonores et mémoire d'un territoire." }, { t: "Les silences", x: "Ce qu'on entend quand tout s'arrête." }] }],
      ] },
      { key: "voix", name: "Les voix", blocks: [
        ["misc:pagehead", { title: "Les voix", sub: "Une équipe de quatre personnes, un studio à Toulouse." }],
        ["proof:team", { items: [{ n: "Inès Moreau", r: "Voix et écriture" }, { n: "Théo Lacombe", r: "Réalisation sonore" }, { n: "Maëlle Auguste", r: "Production" }, { n: "Samir Bouchard", r: "Musique originale" }] }],
        ["misc:story", { eyebrow: "L'idée", title: "Raconter la nuit sans la trahir", paras: ["Tout est parti d'un enregistrement fait un soir d'orage, dans un hall de gare vide.", "Nous voulions retrouver cette écoute attentive : peu de musique, des voix proches, des silences qui comptent."], image: "portrait-1" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Proposer un sujet, témoigner, parrainer." }],
        ["contact:info", { title: "Écrire au studio", formTitle: "Votre message", formIntro: "Suggestion d'histoire, retour d'écoute ou partenariat.", cta: ["Envoyer", "/contact"] }],
        ["feat:checks", { title: "Vous avez une histoire ?", cta: ["Nous l'envoyer", "/contact"], items: [{ t: "Un récit vécu, vérifiable" }, { t: "Des témoins prêts à parler" }, { t: "Un lieu ou un son marquant" }] }],
      ] },
    ],
  },

  // 4. Revue scientifique / vulgarisation
  {
    key: "revue-quantique", name: "Éprouvette", category: "magazine", tags: ["moderne", "technique"], siteType: "Revue de vulgarisation scientifique",
    description: "Revue de vulgarisation : fond blanc bleuté, bleu glacier, titres Literata posés et schémas en pastille. Une lecture claire, structurée par dossiers et par fiches pratiques.",
    brand: "Éprouvette, revue de science ouverte",
    tokens: { colors: { primary: "#0369a1", secondary: "#0c2a40", accent: "#e11d48", background: "#f7fafc", surface: "#e8f1f7", text: "#10202b", muted: "#47596a" }, fonts: T("literata", "titillium-web"), radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "eprouvette", motifs: ["topo", "tiles", "objects"] },
    head: ["head:split", {}], foot: ["foot:columns", { about: "Revue de vulgarisation scientifique, rédigée avec des chercheurs et relue par un comité.", cols: [["La revue", "Dossiers", "Fiches", "Comité"], ["Contact", "Proposer un article", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Dossiers", "/dossiers"], ["Article", "/article"], ["Comité", "/comite"], ["Contact", "/contact"]], cta: ["Proposer un article", "/contact"],
    contact: { address: "Campus des Sciences, bâtiment C, 67000 Strasbourg", phone: "03 88 00 52 63", email: "redaction@eprouvette.example", hours: "Du lundi au jeudi, 9 h – 17 h", tagline: "La science à hauteur de curiosité." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Revue de science ouverte", title: "Comprendre la science sans la déformer", sub: "Des articles rédigés avec des chercheurs, sourcés et relus. Cherchez une notion, un domaine, une expérience.", placeholder: "Chercher un sujet : climat, cerveau, matériaux…", image: "hero" }],
        ["feat:bento", { eyebrow: "Dossiers", title: "Ce que nous explorons en ce moment", items: [{ t: "Le sommeil, de la cellule au cerveau", x: "Six articles pour comprendre ce qui se passe quand nous dormons." }, { t: "Matériaux du futur", x: "Du bois transparent aux bétons autoréparants." }, { t: "Océans et climat", x: "Mesures, modèles et incertitudes." }] }],
        ["proof:stats", { title: "La revue en bref (exemples)", items: [["240", "articles publiés"], ["58", "chercheurs relecteurs"], ["15", "dossiers thématiques"]] }],
        ["misc:posts", { title: "Derniers articles", count: 4, layout: "list" }],
        ["feat:grid-icons", { eyebrow: "Notre méthode", title: "Quatre garde-fous", items: [{ t: "Sources citées", x: "Chaque affirmation renvoie à une étude.", icon: "book" }, { t: "Relecture", x: "Un chercheur du domaine valide le texte.", icon: "eye" }, { t: "Incertitudes dites", x: "Nous précisons ce qu'on ne sait pas.", icon: "help" }, { t: "Corrections publiques", x: "Les erreurs sont signalées en tête.", icon: "alertTriangle" }] }],
        ["cta:split", { title: "Vous êtes chercheur ou doctorant ?", sub: "Proposez un article de vulgarisation : nous vous accompagnons de la structure à la relecture.", cta: ["Proposer un article", "/contact"] }],
      ] },
      { key: "dossiers", name: "Dossiers", blocks: [
        ["misc:pagehead", { title: "Les dossiers", sub: "Un sujet, plusieurs angles, un parcours de lecture." }],
        ["gal:cards", { items: [{ t: "Le sommeil", x: "Cycles, rêves, troubles et idées reçues.", tag: "Santé" }, { t: "Matériaux du futur", x: "Chimie, ingénierie et usages concrets.", tag: "Physique" }, { t: "Océans et climat", x: "Courants, acidification, observations.", tag: "Terre" }, { t: "Bactéries utiles", x: "Microbiote, fermentation, ingénierie.", tag: "Vivant" }, { t: "Intelligence artificielle", x: "Ce qu'elle sait, ce qu'elle simule.", tag: "Numérique" }, { t: "Énergies du futur", x: "Stockage, hydrogène, réseaux.", tag: "Énergie" }] }],
        ["misc:search", { title: "Chercher dans la revue" }],
      ] },
      { key: "article", name: "Article", blocks: [
        ["misc:pagehead", { title: "Article", sub: "Dossier Le sommeil · 8 min de lecture" }],
        ["misc:article", { tag: "Neurosciences", title: "Pourquoi rêvons-nous ? Ce que l'on sait, ce que l'on suppose", meta: "Par Léna Vasseur, relu par un chercheur en neurosciences · mis à jour le 12", paras: ["Pendant le sommeil paradoxal, le cerveau est presque aussi actif qu'à l'éveil, alors que le corps est paralysé. Cette observation, faite dans les années 1950, a lancé des décennies de débat.", "Plusieurs hypothèses coexistent : consolidation de la mémoire, régulation émotionnelle, simple bruit d'activité neuronale. Aucune n'explique à elle seule l'ensemble des données.", "La recherche progresse grâce à des protocoles où l'on réveille des volontaires à des moments précis pour recueillir leurs récits."], quote: "Dire qu'on ignore encore pourquoi nous rêvons n'est pas un échec de la science, c'est son point de départ.", by: "Une chercheuse interrogée pour le dossier" }],
        ["cta:card", { title: "Un doute sur cet article ?", sub: "Signalez une erreur ou une source manquante.", cta: ["Écrire à la revue", "/contact"] }],
      ] },
      { key: "comite", name: "Comité", blocks: [
        ["misc:pagehead", { title: "Le comité scientifique", sub: "Des relecteurs issus de huit laboratoires (exemple fictif)." }],
        ["proof:team", { items: [{ n: "Dr Hélène Ferrand", r: "Biologie du sommeil" }, { n: "Pr Anton Delmas", r: "Physique des matériaux" }, { n: "Dr Zoé Nakache", r: "Climatologie" }, { n: "Dr Paul Verdier", r: "Informatique" }] }],
        ["misc:text", { eyebrow: "Charte", title: "Ce que nous nous engageons à faire", paras: ["Toutes les études citées sont accessibles. Les liens d'intérêt des auteurs sont déclarés en fin d'article.", "Nous refusons les contenus sponsorisés et les articles qui présentent comme certain ce qui ne l'est pas."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Proposer un article, signaler une erreur." }],
        ["contact:map", { title: "Nous trouver", mapAddress: "Campus des Sciences, 67000 Strasbourg" }],
        ["misc:faq", { items: [{ t: "Quel format pour un article proposé ?", x: "Entre 8 000 et 12 000 signes, avec trois sources minimum." }, { t: "Les auteurs sont-ils rémunérés ?", x: "Oui, selon un barème indicatif communiqué à l'acceptation du sujet." }] }],
      ] },
    ],
  },

  // 5. Magazine sportif
  {
    key: "tempo-rugby", name: "Tempo", category: "magazine", tags: ["audacieux", "moderne"], siteType: "Magazine sportif",
    description: "Magazine sportif punchy : vert terrain très sombre, vert citron électrique, grands titres condensés en capitales et résultats en bandeau. Dynamique et compact.",
    brand: "Tempo Magazine",
    tokens: { colors: { primary: "#a3e635", secondary: "#14291b", accent: "#fbbf24", background: "#0b1710", surface: "#132218", text: "#f1f7ec", muted: "#b0c2a8" }, fonts: T("barlow-condensed", "rubik"), radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#233d2a" }, type: { h1: { size: 76, weight: 700, lineHeight: 0.98, letterSpacing: -0.01, transform: "uppercase" }, h2: { size: 44, weight: 700, lineHeight: 1.02, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "tempo", motifs: ["plates", "rays", "halftone"] },
    head: ["head:bar", {}], foot: ["foot:center", {}],
    menu: [["À la une", "/"], ["Résultats", "/resultats"], ["Portraits", "/portraits"], ["Calendrier", "/calendrier"], ["Abonnement", "/abonnement"]], cta: ["S'abonner", "/abonnement"],
    contact: { address: "9 avenue des Sports, 64000 Pau", phone: "05 59 00 46 20", email: "redaction@tempo-magazine.example", hours: "Du lundi au samedi, 9 h – 19 h", tagline: "Le sport vu de la touche." },
    pages: [
      { key: "accueil", name: "À la une", blocks: [
        ["misc:marquee", { items: ["Top 14 : le choc du week-end en direct", "Fédérale 1 : les résultats de la 9e journée", "Coupe régionale : tirage au sort lundi"] }],
        ["hero:cover", { eyebrow: "Dossier de la semaine", title: "Cinq ans pour reconstruire un club", sub: "Du fond du classement aux phases finales : l'histoire d'un projet mené par ses supporters et ses jeunes joueurs.", cta: ["Lire le dossier", "/portraits"], image: "hero", overlay: 0.55 }],
        ["gal:masonry", { items: [{ t: "L'ouvreur de 19 ans qui change tout", x: "Portrait" }, { t: "Les chiffres d'un derby", x: "Analyse" }, { t: "Mêlée : le retour des spécialistes", x: "Technique" }, { t: "Les coulisses du vestiaire", x: "Reportage" }] }],
        ["proof:stats", { title: "La saison en chiffres (exemples)", items: [["26", "journées de championnat"], ["412", "points marqués par le club"], ["18 400", "spectateurs au meilleur match"]] }],
        ["misc:posts", { title: "Dernières publications", count: 6, layout: "grid" }],
        ["cta:band", { title: "Recevez le papier chez vous", sub: "Dix numéros par an, des posters pour la chambre et des hors-séries.", cta: ["Voir les abonnements", "/abonnement"] }],
      ] },
      { key: "resultats", name: "Résultats", blocks: [
        ["misc:pagehead", { title: "Résultats et classements", sub: "Mis à jour chaque dimanche soir." }],
        ["feat:pricelist", { title: "La dernière journée (données de démonstration)", items: [{ t: "Union Pau-Béarn · Stade Lourdais", x: "", price: "27 – 14" }, { t: "Rugby Club Oloron · Lescar Athlétic", x: "", price: "19 – 19" }, { t: "Avenir Tarbais · Arudy Sports", x: "", price: "31 – 22" }, { t: "Orthez Olympique · Nay Rugby", x: "", price: "12 – 16" }] }],
        ["feat:compare", { title: "Classement provisoire", rows: [["Club", "Pts", "Diff."], ["Union Pau-Béarn", "62", "+148"], ["Avenir Tarbais", "58", "+96"], ["Lescar Athlétic", "51", "+41"], ["Rugby Club Oloron", "49", "+22"]] }],
      ] },
      { key: "portraits", name: "Portraits", blocks: [
        ["misc:pagehead", { title: "Portraits et reportages" }],
        ["gal:featured", { items: [{ t: "Le capitaine qui ne lâche rien", x: "Quinze ans de carrière, un seul club.", tag: "Portrait" }, { t: "La kiné des Espoirs", x: "Prévention et récupération.", tag: "Coulisses" }, { t: "Un stade au bout du village", x: "Reportage.", tag: "Terrain" }, { t: "La relève en cadets", x: "Formation.", tag: "Jeunes" }] }],
        ["misc:article", { tag: "Portrait", title: "Le capitaine qui ne lâche rien", meta: "Par Axel Dumas · lecture 7 min", paras: ["À trente-quatre ans, il n'a jamais quitté son club formateur. Entre deux entraînements, il continue de coacher les moins de douze ans, le mercredi après-midi.", "Ses coéquipiers parlent d'un joueur qui se met au service du collectif : pas un mot plus haut que l'autre, mais une exigence permanente à l'entraînement."], quote: "Je veux que les petits me voient arriver à l'heure avant tout le monde.", by: "Le capitaine, après l'entraînement" }],
      ] },
      { key: "calendrier", name: "Calendrier", blocks: [
        ["misc:pagehead", { title: "Calendrier des matchs", sub: "Les prochaines rencontres du Sud-Ouest." }],
        ["misc:schedule", { title: "À venir", items: [{ d: "Sam. 15 h", t: "Union Pau-Béarn – Avenir Tarbais", x: "Stade du Hameau" }, { d: "Dim. 14 h 30", t: "Lescar Athlétic – Nay Rugby", x: "Stade municipal" }, { d: "Sam. 20 h", t: "Arudy Sports – Orthez Olympique", x: "Stade Saint-Michel" }] }],
        ["cta:split", { title: "Vous organisez un tournoi ?", sub: "Envoyez-nous la date : nous l'ajoutons gratuitement à l'agenda.", cta: ["Nous écrire", "/abonnement"] }],
      ] },
      { key: "abonnement", name: "Abonnement", blocks: [
        ["misc:pagehead", { title: "Abonnement", sub: "Papier, numérique ou les deux." }],
        ["price:tiers", { title: "Formules (exemples)", items: [{ t: "Numérique", price: "6 €", period: "/mois", f: ["Tous les articles", "Newsletter du lundi"], cta: "Nous contacter", url: "/abonnement" }, { t: "Magazine papier", price: "9 €", period: "/mois", hl: true, f: ["10 numéros par an", "Posters collector"], cta: "Nous contacter", url: "/abonnement" }, { t: "Club", price: "120 €", period: "/an", f: ["Abonnement pour 10 licenciés", "Votre club en page de couverture"], cta: "Nous contacter", url: "/abonnement" }] }],
        ["contact:info", { title: "Contacter la rédaction", formTitle: "Un message à Tempo", formIntro: "Abonnement, club, proposition de reportage.", cta: ["Envoyer", "/abonnement"] }],
      ] },
    ],
  },

  // 6. Média d'investigation (sombre)
  {
    key: "enquete-brasier", name: "Brasier", category: "magazine", tags: ["sombre", "editorial"], siteType: "Média d'investigation indépendant",
    description: "Média d'investigation : noir charbon, rouge brasier, titres Spectral très contrastés et pages de dossier sobres. Un ton sérieux, avec un espace sécurisé pour les lanceurs d'alerte.",
    brand: "Brasier, enquêtes d'intérêt public",
    tokens: { colors: { primary: "#f0525a", secondary: "#2a0f12", accent: "#f5c542", background: "#131212", surface: "#1e1b1b", text: "#f4efed", muted: "#b9afac" }, fonts: T("spectral", "jost"), radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3a3232" }, type: { h1: { size: 64, weight: 700, lineHeight: 1.02, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "brasier", motifs: ["halftone", "plates", "mesh"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Média indépendant d'investigation, sans publicité, financé par les dons de ses lecteurs.", cols: [["Enquêtes", "Dossiers", "Méthode", "Équipe"], ["Alerter", "Boîte sécurisée", "Dons", "Mentions"]] }],
    menu: [["Enquêtes", "/"], ["Dossiers", "/dossiers"], ["Notre méthode", "/methode"], ["Alerter", "/alerter"], ["Soutenir", "/soutenir"]], cta: ["Alerter la rédaction", "/alerter"],
    contact: { address: "Adresse communiquée aux sources sur demande, Paris", phone: "01 80 00 61 90", email: "alerte@brasier.example", hours: "Ligne sécurisée ouverte 24 h / 24", tagline: "Enquêter pour que cela se sache." },
    pages: [
      { key: "accueil", name: "Enquêtes", blocks: [
        ["hero:editorial", { kicker: "Dossier · 14 mois d'enquête", title: "Sous-traitance : le chantier qui n'aurait jamais dû rouvrir", sub: "Notre enquête documente trois alertes ignorées avant l'accident. Documents, témoignages et chronologie complète.", cta: ["Lire l'enquête", "/dossiers"], image: "hero" }],
        ["proof:statsbar", { items: [["37", "enquêtes publiées"], ["210", "documents authentifiés"], ["4", "affaires portées en justice (exemple)"]] }],
        ["feat:rows", { eyebrow: "À la une", title: "Nos dernières enquêtes", items: [{ t: "Eaux souillées : le rapport que personne n'a lu", x: "Un dossier révèle des mesures falsifiées pendant deux ans." }, { t: "Marchés publics : les attributions qui ne tiennent pas", x: "Comparaison de 320 appels d'offres." }, { t: "Fraude aux aides : la chaîne de sociétés-écrans", x: "Un montage reconstitué étape par étape." }] }],
        ["feat:tabs", { eyebrow: "Comment nous travaillons", title: "Vérifier avant de publier", items: [{ t: "Recoupement", x: "Aucun fait n'est publié sans deux sources indépendantes ou un document authentifié." }, { t: "Droit de réponse", x: "Les personnes mises en cause sont contactées avant publication." }, { t: "Protection", x: "Nous chiffrons les échanges et ne conservons pas les métadonnées inutiles." }] }],
        ["cta:image", { title: "Vous avez des informations d'intérêt public ?", sub: "Nous vous répondons sur un canal chiffré. Vous n'avez pas besoin de vous identifier.", cta: ["Alerter la rédaction", "/alerter"] }],
        ["proof:big", { items: [{ q: "Sans cette enquête, rien n'aurait changé. Nous avons enfin été entendus.", n: "Ancien salarié", r: "témoignage fictif" }] }],
      ] },
      { key: "dossiers", name: "Dossiers", blocks: [
        ["misc:pagehead", { title: "Les dossiers", sub: "Chaque enquête, ses preuves et sa chronologie." }],
        ["misc:article", { tag: "Dossier", title: "Sous-traitance : trois alertes, un accident", meta: "Par la cellule enquête · 14 mois de travail · lecture 12 min", paras: ["Les documents que nous avons pu consulter montrent que trois signalements, en 2022 et 2023, avaient mis en garde sur l'état du chantier. Aucun n'a donné lieu à un arrêt.", "Nous avons contacté l'entreprise principale et ses sous-traitants. Leurs réponses sont publiées en intégralité sous cet article."], quote: "Chaque fois, on nous disait de patienter jusqu'à la fin du mois.", by: "Un ancien chef d'équipe, entretien confidentiel" }],
        ["misc:posts", { title: "Autres dossiers", count: 3, layout: "list" }],
      ] },
      { key: "methode", name: "Notre méthode", blocks: [
        ["misc:pagehead", { title: "Notre méthode", sub: "Transparence sur la manière dont nous enquêtons." }],
        ["feat:steps", { title: "De l'alerte à la publication", items: [{ t: "Réception", x: "L'alerte est lue par deux journalistes, hors de toute pression.", d: "1" }, { t: "Vérification", x: "Contrôle des documents, recherche de sources contradictoires.", d: "2" }, { t: "Avis juridique", x: "Relecture par un avocat avant toute mise en cause.", d: "3" }, { t: "Publication", x: "Mise en ligne avec les pièces et les réponses.", d: "4" }] }],
        ["proof:team", { items: [{ n: "Alice Verbrugge", r: "Rédactrice en chef" }, { n: "Karim Dossou", r: "Enquêtes sociales" }, { n: "Margaux Peltier", r: "Données" }, { n: "Étienne Sauvage", r: "Droit" }] }],
      ] },
      { key: "alerter", name: "Alerter", blocks: [
        ["misc:pagehead", { title: "Alerter la rédaction", sub: "Un canal confidentiel, vos droits protégés." }],
        ["feat:list2", { title: "Avant de nous écrire", items: [{ t: "Utilisez un appareil que vous maîtrisez", x: "" }, { t: "Évitez le réseau de votre employeur", x: "" }, { t: "Ne copiez que ce qui est nécessaire", x: "" }, { t: "Notez les dates et les témoins", x: "" }] }],
        ["contact:cards", { title: "Nous contacter", cta: ["Envoyer", "/alerter"] }],
        ["misc:faq", { items: [{ t: "Mon identité sera-t-elle protégée ?", x: "Oui, votre anonymat est la règle sauf demande contraire de votre part." }, { t: "Ce formulaire est-il chiffré ?", x: "Ce site est une démonstration : une vraie boîte sécurisée doit être installée séparément." }] }],
      ] },
      { key: "soutenir", name: "Soutenir", blocks: [
        ["misc:pagehead", { title: "Soutenir Brasier", sub: "Sans publicité, sans actionnaire." }],
        ["price:tiers", { title: "Dons mensuels (exemples)", items: [{ t: "Veille", price: "5 €", period: "/mois", f: ["Toutes les enquêtes", "Lettre mensuelle"], cta: "Nous écrire", url: "/alerter" }, { t: "Enquête", price: "15 €", period: "/mois", hl: true, f: ["Accès anticipé", "Invitation aux rencontres"], cta: "Nous écrire", url: "/alerter" }, { t: "Fonds juridique", price: "40 €", period: "/mois", f: ["Finance la défense des sources", "Rapport annuel détaillé"], cta: "Nous écrire", url: "/alerter" }] }],
        ["cta:band", { title: "Une presse libre se finance en commun", sub: "Chaque don finance du temps d'enquête.", cta: ["Nous écrire", "/alerter"] }],
      ] },
    ],
  },

  // 7. Blog de jardinage
  {
    key: "carnet-potager", name: "Terreau", category: "magazine", tags: ["naturel", "chaleureux"], siteType: "Blog de jardinage",
    description: "Blog de jardinage : vert feuille, terre ocre et crème, titres Alegreya à l'esprit carnet, calendrier du jardin et fiches de culture. Accueillant et pratique.",
    brand: "Le Carnet du Potager",
    tokens: { colors: { primary: "#2f7d32", secondary: "#2c3e1f", accent: "#c2410c", background: "#f9f6ec", surface: "#eef1dc", text: "#222a18", muted: "#56604a" }, fonts: T("alegreya", "cabin"), radius: { sm: 6, md: 12, lg: 20, button: 999, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "terreau", motifs: ["botanical", "blobs", "waves"] },
    head: ["head:float", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Calendrier", "/calendrier"], ["Fiches culture", "/fiches"], ["Article", "/article"], ["Le jardinier", "/jardinier"]], cta: ["Recevoir la lettre", "/jardinier"],
    contact: { address: "Chemin des Haies, 49000 Angers", phone: "02 41 00 22 38", email: "bonjour@carnet-potager.example", hours: "Réponses le week-end", tagline: "Jardiner au rythme des saisons." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Novembre au jardin", title: "Ce qu'on plante, ce qu'on range, ce qu'on laisse dormir", sub: "Un carnet de saison pour jardiner sans produits chimiques : conseils testés, calendrier lunaire optionnel et plans de potager.", cta: ["Voir le calendrier", "/calendrier"], cta2: ["Lire les fiches", "/fiches"], image: "hero" }],
        ["feat:grid-icons", { eyebrow: "Cette semaine", title: "Les gestes du moment", items: [{ t: "Pailler les carrés", x: "Protégez la terre du gel avec feuilles et tontes sèches.", icon: "layers" }, { t: "Planter l'ail", x: "Gousses en terre avant la fin du mois.", icon: "sun" }, { t: "Nettoyer les outils", x: "Huile de lin, affûtage, rangement.", icon: "settings" }, { t: "Semer l'engrais vert", x: "Phacélie ou moutarde pour nourrir le sol.", icon: "sparkles" }] }],
        ["misc:posts", { title: "Derniers articles", count: 3, layout: "grid" }],
        ["proof:statsbar", { items: [["120", "fiches de culture"], ["14", "ans de carnet"], ["9 000", "lecteurs de la lettre (exemple)"]] }],
        ["feat:alt", { eyebrow: "Au potager", title: "Trois rendez-vous réguliers", items: [{ t: "Le plan du mois", x: "Un schéma de carré potager adapté à la saison.", link: ["Voir le calendrier", "/calendrier"] }, { t: "La fiche de culture", x: "Variétés, semis, entretien, récolte, maladies courantes.", link: ["Voir les fiches", "/fiches"] }] }],
        ["cta:card", { title: "Recevez le carnet chaque dimanche", sub: "Un geste simple, une photo, un conseil. Gratuit.", cta: ["S'inscrire", "/jardinier"] }],
      ] },
      { key: "calendrier", name: "Calendrier", blocks: [
        ["misc:pagehead", { title: "Calendrier du jardin", sub: "Mois par mois, pour un climat tempéré océanique." }],
        ["feat:steps", { title: "De l'automne au printemps", items: [{ t: "Novembre", x: "Planter ail et échalotes, pailler, ramasser les feuilles.", d: "Nov." }, { t: "Décembre", x: "Tailler les arbres fruitiers, rentrer les plantes sensibles.", d: "Déc." }, { t: "Février", x: "Semis sous abri : tomates, poivrons, aubergines.", d: "Fév." }, { t: "Mars", x: "Premiers semis en pleine terre : radis, pois, carottes.", d: "Mars" }] }],
        ["misc:hours", { title: "Fenêtres de semis (indicatif)", rows: [["Tomates", "mi-février à mars, sous abri"], ["Haricots", "mai à juillet"], ["Salades", "mars à septembre"], ["Poireaux", "mars à mai"]] }],
      ] },
      { key: "fiches", name: "Fiches culture", blocks: [
        ["misc:pagehead", { title: "Fiches de culture", sub: "Les légumes, les herbes, les petits fruits." }],
        ["gal:products", { items: [{ t: "Tomate", x: "Semis, tuteurage, maladies", price: "Fiche" }, { t: "Courgette", x: "Exposition, arrosage", price: "Fiche" }, { t: "Carotte", x: "Sol léger, éclaircissage", price: "Fiche" }, { t: "Basilic", x: "Abri, pincements", price: "Fiche" }] }],
        ["feat:accordion", { title: "Questions de jardiniers", items: [{ t: "Quand arroser le potager ?", x: "Le matin tôt ou en soirée, au pied des plantes, plutôt qu'un peu chaque jour." }, { t: "Comment éviter le mildiou ?", x: "Aérer, éviter de mouiller le feuillage et rotationner les cultures." }, { t: "Quel paillage choisir ?", x: "Tontes sèches, feuilles mortes ou paille selon la culture." }] }],
      ] },
      { key: "article", name: "Article", blocks: [
        ["misc:pagehead", { title: "Article", sub: "Sols · 6 min de lecture" }],
        ["misc:article", { tag: "Sols vivants", title: "Un sol nu en hiver, c'est un sol qui s'appauvrit", meta: "Par Colette Auvray · dimanche matin", paras: ["Laisser la terre à nu après la dernière récolte semble propre, mais la pluie la lessive et les nutriments filent. Un couvert végétal protège la structure du sol.", "Trois solutions simples : un paillage épais, un engrais vert à détruire au printemps, ou une culture d'hiver comme l'ail et les fèves.", "Dans mon carré d'essai, la parcelle couverte de moutarde a retrouvé de la terre souple dès mars, contrairement à la planche laissée nue."], quote: "On ne nourrit pas les plantes, on nourrit le sol.", by: "Un vieux dicton de jardinier" }],
        ["cta:split", { title: "Une question de jardin ?", sub: "Écrivez-moi, je réponds chaque dimanche.", cta: ["Poser ma question", "/jardinier"] }],
      ] },
      { key: "jardinier", name: "Le jardinier", blocks: [
        ["misc:pagehead", { title: "Qui tient le carnet ?" }],
        ["misc:story", { eyebrow: "À propos", title: "Un potager de 300 m² et beaucoup d'erreurs", paras: ["Je jardine depuis quinze ans sur un terrain argileux. Ce carnet raconte ce qui marche, mais aussi les échecs, parce qu'on apprend plus avec eux.", "Aucune publicité, aucun produit imposé : seulement des conseils testés dans mon jardin."], image: "portrait-3" }],
        ["contact:info", { title: "Me contacter", formTitle: "Une question, une photo", formIntro: "Décrivez votre sol, votre région et votre problème.", cta: ["Envoyer", "/jardinier"] }],
      ] },
    ],
  },

  // 8. Magazine d'architecture et de design
  {
    key: "monolithe-revue", name: "Monolithe", category: "magazine", tags: ["minimaliste", "geometrique"], siteType: "Magazine d'architecture et de design",
    description: "Magazine d'architecture : gris béton clair, magenta tranchant, titres Outfit aérés et grandes images sur grille stricte. Un minimalisme assumé qui laisse parler les projets.",
    brand: "Monolithe, revue d'architecture",
    tokens: { colors: { primary: "#be185d", secondary: "#1c1c20", accent: "#0e7490", background: "#ecebe8", surface: "#ffffff", text: "#1a1a1d", muted: "#52525a" }, fonts: T("outfit", "ibm-plex-serif"), radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#c9c8c4" }, type: { h1: { size: 68, weight: 300, lineHeight: 1.02, letterSpacing: -0.03 }, h2: { size: 40, weight: 300, lineHeight: 1.1, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "monolithe", motifs: ["tiles", "arches", "plates"] },
    head: ["head:side", {}], foot: ["foot:big", { title: "Monolithe" }],
    menu: [["Projets", "/"], ["Numéros", "/numeros"], ["Entretien", "/entretien"], ["Matière", "/matiere"], ["Contact", "/contact"]], cta: ["S'abonner", "/numeros"],
    contact: { address: "18 rue du Béton, 59000 Lille", phone: "03 20 00 87 41", email: "revue@monolithe.example", hours: "Du mardi au vendredi, 10 h – 18 h", tagline: "L'architecture à l'échelle de l'usage." },
    pages: [
      { key: "accueil", name: "Projets", blocks: [
        ["hero:bleed", { eyebrow: "Numéro 27 · hiver", title: "La brique, matière d'avenir", sub: "Douze projets européens où la terre cuite redevient un geste contemporain : logements, écoles, équipements.", cta: ["Lire le dossier", "/numeros"], image: "hero" }],
        ["gal:wall", { items: [{ t: "Logements, Gand" }, { t: "École, Roubaix" }, { t: "Pavillon, Porto" }, { t: "Gare, Lausanne" }] }],
        ["feat:alt", { eyebrow: "Projets du mois", title: "Trois réalisations à regarder de près", items: [{ t: "La halle-bibliothèque", x: "Une ancienne usine textile transformée en médiathèque, murs d'origine conservés.", link: ["Lire le projet", "/numeros"] }, { t: "Dix maisons en bande", x: "Lots étroits, cours intérieures et briques de réemploi.", link: ["Lire le projet", "/numeros"] }, { t: "Le pont habité", x: "Un franchissement de 40 m qui accueille trois ateliers d'artistes.", link: ["Lire le projet", "/numeros"] }] }],
        ["proof:big", { items: [{ q: "Un magazine qui montre les plans, les coupes et les vrais budgets.", n: "Lecteur architecte", r: "témoignage fictif" }] }],
        ["misc:posts", { title: "Dans le journal en ligne", count: 4, layout: "list" }],
        ["cta:split", { title: "Quatre numéros par an, imprimés sur papier recyclé", sub: "Abonnement papier et numérique, hors-séries inclus.", cta: ["S'abonner", "/numeros"] }],
      ] },
      { key: "numeros", name: "Numéros", blocks: [
        ["misc:pagehead", { title: "Les numéros", sub: "Chaque numéro, un thème et une matière." }],
        ["gal:coursecards", { items: [{ t: "N° 27 · La brique", x: "Terre cuite, assemblage, réemploi.", tag: "Hiver", price: "14 €", cta: "Nous écrire", url: "/contact" }, { t: "N° 26 · Le bois lamellé", x: "Portées, structure, carbone.", tag: "Automne", price: "14 €", cta: "Nous écrire", url: "/contact" }, { t: "N° 25 · Les friches", x: "Reconversions et mémoire des lieux.", tag: "Été", price: "14 €", cta: "Nous écrire", url: "/contact" }] }],
        ["price:tiers", { title: "Abonnements (exemples)", items: [{ t: "Papier", price: "48 €", period: "/an", f: ["4 numéros livrés"], cta: "Nous écrire", url: "/contact" }, { t: "Duo", price: "68 €", period: "/an", hl: true, f: ["Papier et numérique", "Hors-séries"], cta: "Nous écrire", url: "/contact" }, { t: "Étudiant", price: "34 €", period: "/an", f: ["Papier", "Justificatif demandé"], cta: "Nous écrire", url: "/contact" }] }],
      ] },
      { key: "entretien", name: "Entretien", blocks: [
        ["misc:pagehead", { title: "Entretien", sub: "Avec une architecte-urbaniste (personne fictive)" }],
        ["misc:article", { tag: "Entretien", title: "« On construit trop vite et on démolit trop tôt »", meta: "Propos recueillis par Jules Marchetti · lecture 10 min", paras: ["Elle dirige un atelier de huit personnes qui ne construit presque que dans l'existant. Sa conviction : le meilleur bâtiment est souvent celui qui est déjà là.", "Au fil de la conversation, elle détaille sa méthode : un relevé précis, une enquête sur les usages passés, puis seulement un dessin. Le budget, dit-elle, se gagne sur l'écoute."], quote: "Un projet réussi, c'est quand on ne voit plus où finit l'ancien.", by: "L'architecte, dans son atelier" }],
        ["cta:band", { title: "Plus d'entretiens dans nos numéros", sub: "Chaque trimestre, quatre voix du métier.", cta: ["Voir les numéros", "/numeros"] }],
      ] },
      { key: "matiere", name: "Matière", blocks: [
        ["misc:pagehead", { title: "Matière", sub: "Un lexique de matériaux, de la terre à l'acier." }],
        ["feat:strips", { title: "Les matériaux du moment", items: [{ t: "Terre cuite", x: "Brique, tuile, carreau : cuisson, teinte, durabilité." }, { t: "Bois massif", x: "Épicéa, mélèze, chêne : ce qu'ils permettent." }, { t: "Béton bas carbone", x: "Ciments alternatifs et usages réalistes." }, { t: "Verre recyclé", x: "Carrelage, isolant, façades." }] }],
        ["misc:text", { eyebrow: "Notre regard", title: "Montrer les matériaux comme ils sont", paras: ["Nous photographions à la lumière naturelle, sans retouche, et publions les références des fabricants quand elles existent."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Proposer un projet, abonnement, presse." }],
        ["contact:map", { title: "La rédaction", mapAddress: "18 rue du Béton, 59000 Lille" }],
        ["misc:faq", { items: [{ t: "Comment proposer un projet ?", x: "Envoyez un dossier de huit images, un plan et trois lignes de texte." }, { t: "Publiez-vous des projets non construits ?", x: "Oui, s'ils sont aboutis techniquement." }] }],
      ] },
    ],
  },

  // 9. Quotidien d'actualité
  {
    key: "courrier-azur", name: "Le Matinal", category: "magazine", tags: ["classique", "editorial"], siteType: "Quotidien d'actualité en ligne",
    description: "Quotidien d'actualité : bandeau de journal, bleu marine et or, texte Libre Baskerville dense, accueil en une, rubriques par jour et pages éditoriales rigoureuses.",
    brand: "Le Matinal",
    tokens: { colors: { primary: "#1e3a8a", secondary: "#0f172a", accent: "#b7791f", background: "#fffdf7", surface: "#f3efe3", text: "#16181d", muted: "#4d5360" }, fonts: T("libre-baskerville", "mulish"), radius: { sm: 0, md: 2, lg: 3, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d8d2c0" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.12, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "matinal", motifs: ["halftone", "skyline", "plates"] },
    head: ["head:masthead", { dateline: "Lundi · Édition de 6 h · Paris, 7 °C" }], foot: ["foot:columns", { about: "Quotidien d'actualité nationale et internationale, publié chaque matin avant 6 h.", cols: [["Rubriques", "France", "Monde", "Économie", "Culture"], ["Service", "Abonnement", "Contact", "Mentions"]] }],
    menu: [["À la une", "/"], ["Rubriques", "/rubriques"], ["Éditorial", "/editorial"], ["Abonnement", "/abonnement"], ["Contact", "/contact"]], cta: ["S'abonner", "/abonnement"],
    contact: { address: "75 rue de la Presse, 75002 Paris", phone: "01 80 00 31 31", email: "redaction@le-matinal.example", hours: "Rédaction ouverte 7 jours sur 7, de 5 h à minuit", tagline: "L'essentiel, avant 6 h." },
    pages: [
      { key: "accueil", name: "À la une", blocks: [
        ["hero:stacked", { eyebrow: "À la une · 5 h 58", title: "Budget 2027 : le gouvernement tranche, les régions s'inquiètent", sub: "Après une nuit de négociations, l'exécutif présente un texte qui réduit de 4 % les dotations aux collectivités. Analyse et réactions.", cta: ["Lire l'analyse", "/editorial"], image: "hero", stats: [["6", "points à retenir"], ["3", "régions concernées"], ["12 min", "de lecture"]] }],
        ["misc:posts", { title: "Les informations du jour", count: 6, layout: "grid" }],
        ["feat:numbered", { eyebrow: "L'essentiel", title: "Trois choses à savoir avant 8 h", items: [{ t: "Économie", x: "La croissance du trimestre est revue à la hausse de 0,1 point." }, { t: "International", x: "Les négociations commerciales reprennent mercredi à Genève." }, { t: "Société", x: "La grève des transports se poursuit dans six villes." }] }],
        ["proof:quotes", { items: [Q("Je commence ma journée avec Le Matinal, jamais sans.", "Abonné"), Q("Clair, équilibré, sans bruit inutile.", "Abonnée"), Q("Les éditoriaux sont toujours argumentés.", "Lecteur")] }],
        ["gal:strip", { title: "En images ce matin", items: [{ t: "Port de Marseille" }, { t: "Conseil des ministres" }, { t: "Marché de Rungis" }, { t: "Stade de France" }, { t: "Gare du Nord" }] }],
        ["cta:band", { title: "Lisez sans limites, dès 6 h", sub: "Abonnement numérique à partir de 1 € le premier mois (offre de démonstration).", cta: ["Voir les offres", "/abonnement"] }],
      ] },
      { key: "rubriques", name: "Rubriques", blocks: [
        ["misc:pagehead", { title: "Les rubriques", sub: "Toute l'actualité classée par grand thème." }],
        ["feat:icons", { title: "Choisissez votre rubrique", items: [{ t: "France", x: "Politique, société, régions.", icon: "globe" }, { t: "Monde", x: "Diplomatie, conflits, grands reportages.", icon: "mapPin" }, { t: "Économie", x: "Entreprises, emploi, marchés.", icon: "trendingUp" }, { t: "Culture", x: "Livres, cinéma, spectacle vivant.", icon: "book" }, { t: "Sport", x: "Résultats, analyses et portraits.", icon: "trophy" }, { t: "Science", x: "Santé, climat, innovations.", icon: "sparkles" }] }],
        ["misc:search", { title: "Chercher dans l'actualité" }],
      ] },
      { key: "editorial", name: "Éditorial", blocks: [
        ["misc:pagehead", { title: "Éditorial", sub: "Le point de vue de la rédaction" }],
        ["misc:article", { tag: "Éditorial", title: "Budget : la cohérence avant l'affichage", meta: "Par la rédaction en chef · publié à 5 h 30", paras: ["Le texte présenté cette nuit répond à une exigence de sérieux budgétaire, mais il reporte sur les collectivités des économies qui ne figurent pas dans le discours officiel.", "Une réforme n'est crédible que lorsqu'elle est lisible. Or l'ensemble des mesures annoncées dessine un calendrier que ni les régions ni les entreprises ne peuvent anticiper.", "Le débat parlementaire de la semaine devra clarifier ces arbitrages, sans quoi l'effort demandé paraîtra inégalement partagé."], quote: "Un budget vaut par ce qu'il explique autant que par ce qu'il chiffre.", by: "Éditorial du Matinal" }],
        ["cta:card", { title: "Réagir à cet éditorial", sub: "Les lettres de lecteurs sont publiées chaque samedi.", cta: ["Écrire à la rédaction", "/contact"] }],
      ] },
      { key: "abonnement", name: "Abonnement", blocks: [
        ["misc:pagehead", { title: "Abonnement", sub: "Accès illimité sur tous vos écrans." }],
        ["price:tiers", { title: "Offres (exemples)", items: [{ t: "Essentiel", price: "9 €", period: "/mois", f: ["Articles illimités", "Édition du matin"], cta: "Nous contacter", url: "/contact" }, { t: "Intégral", price: "15 €", period: "/mois", hl: true, f: ["Tout l'Essentiel", "Archives depuis 1998", "Lettre du soir"], cta: "Nous contacter", url: "/contact" }, { t: "Famille", price: "22 €", period: "/mois", f: ["5 comptes", "Version jeunesse"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:compare", { title: "Comparer", rows: [["", "Essentiel", "Intégral"], ["Articles illimités", "oui", "oui"], ["Archives", "non", "oui"], ["Lettre du soir", "non", "oui"]] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Rédaction, abonnés, annonceurs." }],
        ["contact:map", { title: "La rédaction", mapAddress: "75 rue de la Presse, 75002 Paris" }],
        ["misc:faq", { items: [{ t: "Comment signaler une erreur ?", x: "Écrivez-nous en indiquant l'article et le passage concerné. Les corrections sont publiées en tête d'article." }, { t: "Comment suspendre mon abonnement ?", x: "Par e-mail, sous 48 h ouvrées, sans frais." }] }],
      ] },
    ],
  },
];
