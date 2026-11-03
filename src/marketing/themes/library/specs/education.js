// Éducation (lot A, 12 thèmes). Textes de DÉMONSTRATION : établissements, personnes et coordonnées fictifs, remplaçables dans l'éditeur.
const contactPage = (sub, title, cta, mapAddress, formIntro, variant) => ({
  key: "contact", name: "Contact", blocks: [
    ["misc:pagehead", { title: "Contact", sub }],
    variant === "cards"
      ? ["contact:cards", { title, formTitle: "Écrivez-nous", formIntro, cta }]
      : ["contact:info", { title, formTitle: "Écrivez-nous", formIntro, cta }],
    ["contact:map", { title: "Nous trouver", mapAddress }],
  ],
});
const COURSES = ["Formations Kolakisa (catalogue réel)"];
const F = (h, b) => ({ heading: h, body: b, button: b, link: b });

module.exports = [
  // 1. École privée
  {
    key: "cedrelune", name: "Cèdrelune", category: "education", tags: ["classique", "chaleureux"], siteType: "École privée (collège et lycée)",
    description: "Vert sapin profond, crème papier et titres Gloock : un établissement privé qui rassure les familles, avec portes ouvertes, projet éducatif et vie scolaire.",
    brand: "Collège-Lycée des Trois Cèdres",
    tokens: { colors: { primary: "#166534", secondary: "#14352a", accent: "#c8872b", background: "#f8f5ec", surface: "#ffffff", text: "#1a2a22", muted: "#566259" }, fonts: F("font.gloock", "font.outfit"), radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d9d4c0" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "cedrelune", motifs: ["botanical", "arches", "tiles"] },
    head: ["head:topbar", { info: "Portes ouvertes : samedi 18 janvier, 9 h – 13 h", note: "Inscriptions rentrée 2027 ouvertes" }],
    foot: ["foot:columns", { about: "Établissement privé sous contrat (exemple) : de la 6e à la terminale, dans un cadre humain et exigeant.", cols: [["Scolarité", "Projet éducatif", "Vie scolaire", "Admissions"], ["Pratique", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Projet éducatif", "/projet"], ["Vie scolaire", "/vie-scolaire"], ["Admissions", "/admissions"], ["Contact", "/contact"]], cta: ["Venir aux portes ouvertes", "/admissions"],
    contact: { address: "12 allée des Cèdres, 37000 Tours", phone: "02 47 20 41 08", email: "secretariat@troiscedres.example", hours: "Lundi – vendredi, 8 h – 17 h 30", tagline: "Grandir en confiance, réussir avec exigence." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Collège et lycée, 6e – terminale", title: "Un lieu où chaque élève se sent attendu.", sub: "Classes de 24 élèves au plus, accompagnement personnalisé et ouverture sur le monde, dans un campus arboré au cœur de Tours.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Nos portes ouvertes", "/admissions"], image: "hero" }],
        ["proof:stats", { items: [["24", "élèves par classe au plus"], ["1 prof", "référent par élève"], ["3", "langues vivantes au choix"], ["47", "années d'histoire"]] }],
        ["feat:alt", { eyebrow: "Notre projet", title: "Apprendre, s'engager, s'épanouir", items: [{ t: "Exigence et bienveillance", x: "Un suivi hebdomadaire par le professeur référent, des devoirs encadrés et des évaluations lisibles." }, { t: "Ouverture au monde", x: "Échanges linguistiques, voyages pédagogiques et section européenne anglais dès la 4e." }, { t: "Des talents à cultiver", x: "Théâtre, orchestre, robotique et sport : quatre heures d'ateliers par semaine inclus.", link: ["Découvrir la vie scolaire", "/vie-scolaire"] }] }],
        ["gal:coursecards", { eyebrow: "Parcours (démonstration)", title: "Des options pour construire son projet", items: [{ t: "Section européenne anglais", tag: "Dès la 4e", price: "Incluse", x: "Une discipline enseignée en anglais et un échange annuel.", cta: "En savoir plus", url: "/projet" }, { t: "Atelier robotique", tag: "Collège", price: "45 €/trimestre", x: "Concevoir et programmer un robot en équipe.", cta: "En savoir plus", url: "/vie-scolaire" }, { t: "Préparation aux grandes écoles", tag: "Lycée", price: "Incluse", x: "Méthodologie, oraux blancs et dossier Parcoursup.", cta: "En savoir plus", url: "/projet" }] }],
        ["proof:quotes", { eyebrow: "Parents et anciens", title: "Ils parlent de l'école", items: [{ q: "Ma fille a retrouvé le goût d'aller en cours dès le premier trimestre.", n: "Hélène B.", r: "parente d'élève, cliente fictive" }, { q: "Les professeurs connaissent vraiment chaque élève.", n: "Marc L.", r: "parent d'élève, client fictif" }, { q: "L'oral blanc m'a donné confiance pour l'entrée en prépa.", n: "Inès D.", r: "ancienne élève, cliente fictive" }] }],
        ["cta:split", { title: "Venez découvrir l'établissement.", sub: "Visite guidée par les élèves et rencontre avec la direction, sur rendez-vous.", cta: ["Réserver une visite", "/contact"] }],
      ] },
      { key: "projet", name: "Projet éducatif", blocks: [
        ["misc:pagehead", { title: "Projet éducatif", sub: "Trois convictions qui guident l'équipe depuis la création." }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Une école pour tous les rythmes", paras: ["Fondé par un groupe d'enseignants en 1978, l'établissement a toujours privilégié des classes à taille humaine et un lien fort avec les familles.", "Aujourd'hui, 640 élèves y suivent un parcours général ou technologique, avec un accompagnement adapté aux besoins de chacun."], image: "portrait-1" }],
        ["feat:numbered", { title: "Nos engagements", items: [{ t: "Réussite", x: "Chaque élève est accompagné vers le meilleur diplôme possible." }, { t: "Respect", x: "Une charte de vie commune rédigée avec les élèves." }, { t: "Ouverture", x: "Culture, langues et engagement citoyen au programme." }] }],
        ["proof:team", { eyebrow: "Direction", title: "L'équipe de direction", items: [{ n: "Odile Fournaise", r: "Cheffe d'établissement" }, { n: "Bastien Orhan", r: "Directeur adjoint collège" }, { n: "Maud Lecarré", r: "Directrice adjointe lycée" }] }],
      ] },
      { key: "vie-scolaire", name: "Vie scolaire", blocks: [
        ["misc:pagehead", { title: "Vie scolaire", sub: "Une journée rythmée, des temps pour apprendre et des temps pour respirer." }],
        ["misc:schedule", { title: "Une journée type au collège", items: [{ d: "8 h 15", t: "Accueil et début des cours", x: "Deux heures de cours avant la récréation." }, { d: "12 h 05", t: "Déjeuner", x: "Restauration préparée sur place avec produits locaux." }, { d: "13 h 30", t: "Cours de l'après-midi", x: "Matières pratiques et sciences." }, { d: "16 h 30", t: "Étude dirigée ou ateliers", x: "Aide aux devoirs, orchestre, théâtre, échecs ou robotique." }] }],
        ["feat:grid-icons", { title: "Au quotidien", items: [{ icon: "book", t: "Étude dirigée", x: "Surveillée par des enseignants jusqu'à 18 h." }, { icon: "users", t: "Pastorale et solidarité", x: "Projets caritatifs menés par les élèves." }, { icon: "trophy", t: "Association sportive", x: "Compétitions inter-établissements le mercredi." }] }],
        ["cta:band", { title: "Une question sur la vie de l'école ?", cta: ["Contacter la vie scolaire", "/contact"] }],
      ] },
      { key: "admissions", name: "Admissions", blocks: [
        ["misc:pagehead", { title: "Admissions et tarifs", sub: "Dossier, entretien, décision : trois étapes simples." }],
        ["feat:steps", { title: "Comment s'inscrire", items: [{ t: "Dossier", x: "Bulletins des deux dernières années et lettre des parents.", d: "Janvier" }, { t: "Entretien", x: "Rencontre avec l'élève et sa famille.", d: "Février" }, { t: "Décision", x: "Réponse écrite sous 15 jours.", d: "Mars" }] }],
        ["feat:pricelist", { title: "Contribution des familles (exemple)", items: [{ t: "Collège (par an)", x: "Hors restauration", price: "1 380 €" }, { t: "Lycée (par an)", x: "Hors restauration", price: "1 560 €" }, { t: "Demi-pension (par repas)", x: "Tarif dégressif dès le deuxième enfant", price: "5,80 €" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Des bourses sont-elles possibles ?", x: "Les bourses nationales s'appliquent et un fonds de solidarité peut compléter (exemple de démonstration)." }, { t: "Y a-t-il un transport scolaire ?", x: "Trois lignes de bus desservent l'agglomération matin et soir." }] }],
      ] },
      contactPage("Le secrétariat vous répond sous deux jours ouvrés.", "Parlons de la scolarité de votre enfant", ["Envoyer ma demande", "/contact"], "12 allée des Cèdres, 37000 Tours", "Indiquez le niveau visé et l'établissement actuel."),
    ],
  },

  // 2. Université / faculté
  {
    key: "faculta-norda", name: "Faculta Norda", category: "education", tags: ["editorial", "classique"], siteType: "Faculté de sciences humaines",
    description: "Bordeaux sourd, papier ivoire et grand titre Newsreader : le site d'une faculté, avec catalogue de formations réel, recherche, actualités et vie étudiante.",
    modules: COURSES, brand: "Faculté des Lettres et Sciences humaines de Norda",
    tokens: { colors: { primary: "#9f1239", secondary: "#2d1a22", accent: "#b88a2a", background: "#fbf7f3", surface: "#ffffff", text: "#241a1d", muted: "#5f5256" }, fonts: F("font.newsreader", "font.public-sans"), radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#e0d3cc" }, type: { h1: { size: 60, weight: 500, lineHeight: 1.04, letterSpacing: -0.015 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "norda", motifs: ["plates", "halftone", "topo"] },
    head: ["head:masthead", { dateline: "Année universitaire 2026 – 2027" }],
    foot: ["foot:big", { title: "Faculté de Norda" }],
    menu: [["Accueil", "/"], ["Formations", "/formations"], ["Recherche", "/recherche"], ["Vie étudiante", "/vie-etudiante"], ["Contact", "/contact"]], cta: ["Candidater", "/contact"],
    contact: { address: "Campus de la Colline, 1 place du Savoir, 59000 Lille", phone: "03 20 91 00 72", email: "scolarite@faculte-norda.example", hours: "Lundi – vendredi, 9 h – 16 h", tagline: "Penser large, apprendre loin." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Licence · Master · Doctorat", title: "Comprendre les sociétés pour les transformer.", sub: "Histoire, lettres, sociologie, langues et philosophie : une faculté de 7 800 étudiants adossée à six laboratoires de recherche.", cta: ["Voir les formations", "/formations"], cta2: ["Calendrier de candidature", "/contact"] }],
        ["feat:rows", { eyebrow: "Départements", title: "Cinq départements, un même esprit critique", items: [{ t: "Histoire et archéologie", x: "Chantiers de fouille dès la deuxième année." }, { t: "Lettres modernes", x: "Création littéraire, édition et critique." }, { t: "Sociologie", x: "Enquêtes de terrain et statistiques appliquées." }, { t: "Langues et civilisations", x: "Anglais, allemand, néerlandais, arabe." }, { t: "Philosophie", x: "Éthique, logique et philosophie des sciences." }] }],
        ["proof:statsbar", { items: [["7 800", "étudiants (exemple)"], ["6", "laboratoires"], ["120", "partenariats internationaux"], ["82 %", "d'insertion à 18 mois (exemple)"]] }],
        ["misc:quote", { text: "À la faculté, on apprend d'abord à poser la bonne question.", by: "Doyenne fictive, Faculté de Norda" }],
        ["misc:posts", { title: "Actualités de la faculté", count: 3, layout: "list" }],
        ["cta:image", { title: "Déposez votre candidature avant le 15 mars.", sub: "Plateforme ouverte pour la licence, le master et les échanges Erasmus.", cta: ["Candidater", "/contact"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Offre de formation", sub: "Du diplôme universitaire au master recherche." }],
        ["misc:courses", {}],
        ["feat:compare", { title: "Choisir son niveau", rows: [["", "Licence", "Master", "Doctorat"], ["Durée", "3 ans", "2 ans", "3 ans"], ["Stage", "Optionnel", "Obligatoire", "Terrain de thèse"], ["Débouchés", "Poursuite d'études", "Métiers de la culture, enseignement", "Recherche"]] }],
        ["cta:card", { title: "Besoin d'aide pour choisir ?", sub: "Le service d'orientation reçoit sans rendez-vous le mercredi.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "recherche", name: "Recherche", blocks: [
        ["misc:pagehead", { title: "Recherche", sub: "Six laboratoires, une vingtaine de projets en cours." }],
        ["feat:bento", { title: "Axes de recherche", items: [{ icon: "globe", t: "Mémoires et territoires", x: "Archives, patrimoines et identités de l'Europe du Nord." }, { icon: "users", t: "Inégalités et cohésion", x: "Enquêtes longitudinales sur l'école et le travail." }, { icon: "book", t: "Humanités numériques", x: "Éditions critiques et fouille de textes." }] }],
        ["proof:team", { title: "Directeurs d'unités", items: [{ n: "Prof. Anselme Vauquois", r: "Mémoires et territoires" }, { n: "Prof. Rania Haddad", r: "Inégalités et cohésion" }, { n: "Prof. Joris Verstraete", r: "Humanités numériques" }] }],
        ["misc:text", { eyebrow: "Doctorants", title: "Une école doctorale accueillante", paras: ["Chaque doctorant bénéficie d'un comité de suivi et de financements de mobilité pour présenter ses travaux à l'étranger."] }],
      ] },
      { key: "vie-etudiante", name: "Vie étudiante", blocks: [
        ["misc:pagehead", { title: "Vie étudiante", sub: "Bibliothèque, associations, logement et santé." }],
        ["feat:icons", { title: "Services aux étudiants", items: [{ icon: "book", t: "Bibliothèque universitaire", x: "Ouverte jusqu'à 22 h, 900 places de travail." }, { icon: "home", t: "Logement", x: "Résidences partenaires et bourse aux logements." }, { icon: "heart", t: "Santé", x: "Centre de santé et soutien psychologique gratuit." }, { icon: "globe", t: "International", x: "Échanges en Europe, Amérique du Nord et Asie." }] }],
        ["misc:hours", { title: "Horaires de la bibliothèque", rows: [["Lundi – jeudi", "8 h – 22 h"], ["Vendredi", "8 h – 19 h"], ["Samedi", "10 h – 17 h"], ["Dimanche", "Fermée"]] }],
        ["cta:band", { title: "Rejoignez une association étudiante.", sub: "Plus de quarante associations culturelles, sportives et solidaires.", cta: ["Nous contacter", "/contact"] }],
      ] },
      contactPage("La scolarité vous répond sous trois jours ouvrés.", "Un renseignement, un dossier ?", ["Envoyer", "/contact"], "1 place du Savoir, 59000 Lille", "Précisez votre niveau actuel et la formation visée.", "cards"),
    ],
  },

  // 3. Soutien scolaire
  {
    key: "petit-rebond", name: "Petit Rebond", category: "education", tags: ["ludique", "chaleureux"], siteType: "Soutien scolaire à domicile et en ligne",
    description: "Orange brûlé, crème vanille et boutons ronds : un service de soutien scolaire rassurant pour les parents, avec forfaits lisibles, matières et méthode en trois temps.",
    modules: [], brand: "Petit Rebond",
    tokens: { colors: { primary: "#c2410c", secondary: "#1f3a5f", accent: "#facc15", background: "#fffbf2", surface: "#ffffff", text: "#2b2118", muted: "#6a5a4a" }, fonts: F("font.baloo-2", "font.archivo"), radius: { sm: 10, md: 16, lg: 26, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.08, letterSpacing: 0 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "rebond", motifs: ["blobs", "objects", "bokeh"] },
    head: ["head:float", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Matières", "/matieres"], ["Forfaits", "/forfaits"], ["Questions", "/questions"], ["Contact", "/contact"]], cta: ["Séance d'essai offerte", "/contact"],
    contact: { address: "Service à domicile et en visio, agence au 5 rue Pasteur, 31000 Toulouse", phone: "05 61 77 20 15", email: "parents@petit-rebond.example", hours: "Lundi – samedi, 9 h – 19 h", tagline: "Rebondir, un exercice à la fois." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Du CP à la terminale", title: "Les maths, ça peut redevenir facile.", sub: "Un professeur particulier choisi pour votre enfant, chez vous ou en visio, avec un point d'étape envoyé aux parents chaque mois.", cta: ["Séance d'essai offerte", "/contact"], cta2: ["Voir les forfaits", "/forfaits"], stats: [["1 200", "familles accompagnées"], ["4,8/5", "note moyenne (exemple)"], ["48 h", "pour démarrer"]] }],
        ["feat:steps", { eyebrow: "Comment ça marche", title: "Trois temps pour reprendre confiance", items: [{ t: "Bilan gratuit", x: "Un échange avec l'élève pour repérer les blocages.", d: "Jour 1" }, { t: "Plan sur mesure", x: "Objectifs, rythme et matières fixés avec vous.", d: "Jour 3" }, { t: "Progrès suivis", x: "Compte rendu après chaque séance et bilan mensuel.", d: "Chaque mois" }] }],
        ["gal:coursecards", { title: "Les stages les plus demandés (démonstration)", items: [{ t: "Stage brevet", tag: "3e", price: "190 €", x: "Cinq demi-journées de révisions avant les épreuves.", cta: "Réserver", url: "/contact" }, { t: "Lecture et écriture", tag: "CE1 – CM2", price: "22 €/séance", x: "Fluence, compréhension et orthographe par le jeu.", cta: "Réserver", url: "/contact" }, { t: "Prépa bac maths", tag: "Terminale", price: "260 €", x: "Méthode et annales corrigées en petit groupe.", cta: "Réserver", url: "/contact" }] }],
        ["proof:quotes", { title: "Les parents racontent", items: [{ q: "Mon fils range enfin ses cahiers et pose des questions en classe.", n: "Sandrine P.", r: "maman, cliente fictive" }, { q: "Le compte rendu après chaque séance est précieux.", n: "Olivier G.", r: "papa, client fictif" }, { q: "Notre professeure est patiente et drôle.", n: "Leïla A.", r: "maman, cliente fictive" }] }],
        ["cta:band", { title: "La première séance est offerte.", sub: "Sans engagement, avec un professeur choisi pour son profil.", cta: ["Réserver maintenant", "/contact"] }],
      ] },
      { key: "matieres", name: "Matières", blocks: [
        ["misc:pagehead", { title: "Matières et niveaux", sub: "Du primaire au lycée, chaque matière a son spécialiste." }],
        ["feat:cards", { title: "Ce que nous enseignons", items: [{ icon: "calculator", t: "Mathématiques", x: "Du calcul mental au programme de spécialité." }, { icon: "globe", t: "Langues", x: "Anglais, espagnol et allemand, à l'écrit comme à l'oral." }, { icon: "book", t: "Français", x: "Lecture, rédaction et préparation à l'oral du bac." }, { icon: "sparkles", t: "Sciences", x: "Physique-chimie et SVT expliquées par l'expérience." }] }],
        ["feat:tabs", { title: "Par niveau", items: [{ t: "Primaire", x: "Lecture, calcul et méthode de travail, séances de 45 minutes." }, { t: "Collège", x: "Consolider les bases et préparer le brevet." }, { t: "Lycée", x: "Spécialités, grand oral et orientation Parcoursup." }] }],
        ["cta:card", { title: "Un doute sur la matière à choisir ?", sub: "Le bilan gratuit sert à ça.", cta: ["Demander un bilan", "/contact"] }],
      ] },
      { key: "forfaits", name: "Forfaits", blocks: [
        ["misc:pagehead", { title: "Forfaits et tarifs", sub: "Crédit d'impôt de 50 % possible pour les cours à domicile (exemple)." }],
        ["price:tiers", { items: [{ t: "Coup de pouce", price: "112 €", period: "4 séances", x: "Pour un chapitre précis.", f: ["Une heure par séance", "Compte rendu écrit"], cta: "Choisir", url: "/contact" }, { t: "Régulier", price: "208 €", period: "8 séances", x: "Le plus choisi.", f: ["Visio ou domicile", "Bilan mensuel", "Exercices en ligne"], cta: "Choisir", url: "/contact", hl: true }, { t: "Réussite", price: "380 €", period: "16 séances", x: "Pour une année chargée.", f: ["Deux séances par semaine", "Stage de vacances offert"], cta: "Choisir", url: "/contact" }] }],
        ["feat:list2", { title: "Inclus dans chaque forfait", items: [{ t: "Professeur sélectionné et rencontré" }, { t: "Remplacement si le contact ne passe pas" }, { t: "Suivi parent en ligne" }, { t: "Annulation gratuite 24 h avant" }] }],
      ] },
      { key: "questions", name: "Questions", blocks: [
        ["misc:pagehead", { title: "Questions fréquentes", sub: "Tout ce que les parents nous demandent." }],
        ["misc:faq", { items: [{ t: "Comment sont choisis les professeurs ?", x: "Étudiants de master, enseignants ou retraités de l'enseignement, tous reçus en entretien et vérifiés." }, { t: "Et si mon enfant n'accroche pas ?", x: "Nous changeons de professeur gratuitement dès la première séance." }, { t: "Faut-il du matériel ?", x: "Un ordinateur ou une tablette suffit pour la visio, le reste est fourni." }, { t: "Peut-on faire des séances en vacances ?", x: "Oui, les stages de vacances proposent cinq demi-journées de révision." }] }],
        ["cta:split", { title: "Une autre question ?", cta: ["Écrire à l'équipe", "/contact"] }],
        ["feat:checks", { title: "Notre engagement", cta: ["Voir les forfaits", "/forfaits"], items: [{ t: "Satisfait ou remplacé" }, { t: "Données de l'enfant protégées" }, { t: "Tarifs affichés sans surprise" }] }],
      ] },
      contactPage("Nous rappelons les parents dans la journée.", "Parlons de votre enfant", ["Être rappelé", "/contact"], "5 rue Pasteur, 31000 Toulouse", "Niveau, matière et disponibilités suffisent pour démarrer."),
    ],
  },

  // 4. École de langues
  {
    key: "parlons-mieux", name: "Parlons Mieux", category: "education", tags: ["moderne", "geometrique"], siteType: "École de langues pour adultes",
    description: "Turquoise franc, blanc cassé et titres Syne anguleux : une école de langues pour adultes avec catalogue réel, test de niveau et ateliers de conversation.",
    modules: COURSES, brand: "Parlons Mieux",
    tokens: { colors: { primary: "#0e7490", secondary: "#0b2e3a", accent: "#f97316", background: "#f4fafb", surface: "#ffffff", text: "#102a33", muted: "#4b6670" }, fonts: F("font.syne", "font.karla"), radius: { sm: 4, md: 8, lg: 14, button: 8, field: 8, card: 12 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#cbe3ea" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.04, letterSpacing: -0.02 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "parlons", motifs: ["tiles", "waves", "rays"] },
    head: ["head:split", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Cours", "/cours"], ["Certifications", "/certifications"], ["Test de niveau", "/niveau"], ["Contact", "/contact"]], cta: ["Passer le test", "/niveau"],
    contact: { address: "14 cours Mirabeau, 13100 Aix-en-Provence", phone: "04 42 38 90 17", email: "accueil@parlons-mieux.example", hours: "Lundi – vendredi, 8 h – 21 h ; samedi, 9 h – 13 h", tagline: "Une langue de plus, un monde en plus." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Langues pour adultes", title: "Parlez avec aisance, pas avec peur.", sub: "Cours du soir, matinées intensives et ateliers de conversation pour les adultes qui veulent s'exprimer avec naturel.", cta: ["Passer le test gratuit", "/niveau"], cta2: ["Voir les cours", "/cours"], image: "hero" }],
        ["feat:grid-icons", { title: "Ce qui fait la différence", items: [{ icon: "users", t: "Groupes de 8", x: "Assez pour échanger, assez peu pour parler." }, { icon: "globe", t: "Enseignants natifs", x: "Accent, expressions et culture vivante." }, { icon: "clock", t: "Horaires souples", x: "Matin, midi et soir selon votre emploi du temps." }, { icon: "trophy", t: "Certifications", x: "TOEIC, DELE, Goethe et Cambridge." }] }],
        ["misc:courses", {}],
        ["proof:logos", { title: "Entreprises partenaires (fictives)", items: ["Vallon Énergie", "Maison Cérès", "Axiome Logistique", "Brise Numérique"] }],
        ["proof:big", { items: [{ q: "J'ai présenté mon rapport en anglais devant le comité sans notes. Je n'y croyais plus.", n: "Nadège R.", r: "cheffe de projet, cliente fictive" }] }],
        ["cta:image", { title: "Quinze minutes pour situer votre niveau.", sub: "Test écrit et oral, résultat commenté par un enseignant.", cta: ["Passer le test", "/niveau"] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Nos cours", sub: "Cinq langues, formats collectifs ou individuels." }],
        ["feat:tabs", { title: "Par langue", items: [{ t: "Anglais", x: "Business, voyage et préparation TOEIC, du A1 au C1." }, { t: "Espagnol", x: "Conversation, culture et préparation DELE." }, { t: "Italien", x: "Cuisine, art et correspondance professionnelle." }, { t: "Portugais", x: "Brésilien ou européen, selon votre projet." }] }],
        ["feat:pricelist", { title: "Tarifs trimestriels (exemple)", items: [{ t: "Cours collectif 2 h/semaine", x: "Groupe de 8 maximum", price: "249 €" }, { t: "Cours intensif matinal", x: "Quatre matinées par semaine", price: "690 €" }, { t: "Cours individuel", x: "À l'heure, durée libre", price: "42 €" }] }],
        ["cta:band", { title: "Cours d'essai gratuit chaque lundi soir.", cta: ["Je m'inscris", "/contact"] }],
      ] },
      { key: "certifications", name: "Certifications", blocks: [
        ["misc:pagehead", { title: "Certifications", sub: "Valider son niveau avec un diplôme reconnu." }],
        ["feat:compare", { title: "Quel examen choisir ?", rows: [["", "TOEIC", "Cambridge", "DELE"], ["Langue", "Anglais pro", "Anglais général", "Espagnol"], ["Durée", "2 h", "3 à 4 h", "3 h"], ["Validité", "2 ans", "À vie", "À vie"]] }],
        ["feat:numbered", { title: "Nos résultats (exemples)", items: [{ t: "92 %", x: "de réussite au premier passage." }, { t: "35 h", x: "de préparation en moyenne." }, { t: "6", x: "sessions d'examen par an dans nos locaux." }] }],
      ] },
      { key: "niveau", name: "Test de niveau", blocks: [
        ["misc:pagehead", { title: "Test de niveau gratuit", sub: "Quinze minutes pour savoir où vous en êtes." }],
        ["feat:steps", { title: "Déroulé du test", items: [{ t: "Questionnaire écrit", x: "Vingt questions adaptatives.", d: "10 min" }, { t: "Échange oral", x: "Un enseignant pose quelques questions.", d: "5 min" }, { t: "Résultat commenté", x: "Niveau européen et cours conseillés.", d: "Aussitôt" }] }],
        ["feat:accordion", { title: "Bon à savoir", items: [{ t: "Dois-je préparer quelque chose ?", x: "Non, venez comme vous êtes." }, { t: "Le test est-il en ligne ?", x: "Il se fait en agence ou en visio, au choix." }] }],
        ["cta:card", { title: "Réservez votre créneau.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      contactPage("Du lundi au samedi matin, jusqu'à 21 h en semaine.", "Une question sur nos cours ?", ["Envoyer", "/contact"], "14 cours Mirabeau, 13100 Aix-en-Provence", "Langue visée, niveau estimé et disponibilités."),
    ],
  },

  // 5. MOOC
  {
    key: "ouvroir-mooc", name: "Ouvroir", category: "education", tags: ["moderne", "audacieux"], siteType: "Plateforme de MOOC et cours en ligne",
    description: "Indigo électrique, fond lavande pâle et titres Bricolage : une plateforme de cours en ligne ouverts, avec recherche, catalogue réel, parcours et forfaits d'abonnement.",
    modules: COURSES, brand: "Ouvroir",
    tokens: { colors: { primary: "#4338ca", secondary: "#1e1b4b", accent: "#f43f5e", background: "#f5f4ff", surface: "#ffffff", text: "#1b1a3a", muted: "#524f78" }, fonts: F("font.bricolage-grotesque", "font.manrope"), radius: { sm: 8, md: 12, lg: 20, button: 12, field: 10, card: 16 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.04, letterSpacing: -0.025 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "ouvroir", motifs: ["mesh", "rays", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:newsletter", { title: "Un nouveau cours chaque semaine", sub: "Recevez les ouvertures de sessions et les bonnes ressources.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Catalogue", "/catalogue"], ["Parcours", "/parcours"], ["Abonnement", "/abonnement"], ["Aide", "/contact"]], cta: ["Créer mon compte", "/contact"],
    contact: { address: "Plateforme 100 % en ligne, bureaux au 9 rue du Levant, 35000 Rennes", phone: "02 99 14 08 36", email: "aide@ouvroir.example", hours: "Support : lundi – vendredi, 9 h – 18 h", tagline: "Apprendre ouvert, apprendre libre." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Cours en ligne ouverts à tous", title: "Apprenez ce qui vous passionne, à votre heure.", sub: "Des centaines d'heures de cours filmés, d'exercices corrigés et de forums d'entraide, du premier pas à la certification.", placeholder: "Chercher un cours : statistiques, photographie, droit…" }],
        ["proof:stats", { items: [["380", "cours disponibles"], ["52 000", "apprenants inscrits (exemple)"], ["9 h", "de vidéo par cours en moyenne"]] }],
        ["misc:courses", {}],
        ["feat:bento", { eyebrow: "Pourquoi Ouvroir", title: "Apprendre sans friction", items: [{ icon: "play", t: "Vidéos courtes", x: "Des chapitres de 6 à 12 minutes à regarder partout." }, { icon: "quiz", t: "Quiz corrigés", x: "Feedback immédiat à chaque étape." }, { icon: "users", t: "Entraide", x: "Forums animés par les enseignants." }] }],
        ["proof:quotes", { title: "Retours d'apprenants", items: [{ q: "J'ai passé ma certification en suivant les vidéos dans le train.", n: "Thibault N.", r: "apprenant fictif" }, { q: "Les exercices corrigés m'ont fait vraiment progresser.", n: "Anaïs F.", r: "apprenante fictive" }, { q: "Un forum bienveillant, même pour les questions simples.", n: "Mehdi C.", r: "apprenant fictif" }] }],
        ["cta:band", { title: "Votre premier cours est gratuit.", sub: "Aucune carte bancaire requise.", cta: ["Commencer", "/contact"] }],
      ] },
      { key: "catalogue", name: "Catalogue", blocks: [
        ["misc:pagehead", { title: "Catalogue de cours", sub: "Filtrez par thème, niveau ou durée." }],
        ["misc:search", {}],
        ["misc:courses", {}],
        ["cta:split", { title: "Vous ne trouvez pas votre sujet ?", sub: "Proposez un cours : nous recrutons des enseignants.", cta: ["Proposer un cours", "/contact"] }],
      ] },
      { key: "parcours", name: "Parcours", blocks: [
        ["misc:pagehead", { title: "Parcours diplômants", sub: "Plusieurs cours reliés vers un certificat de compétences." }],
        ["feat:strips", { title: "Trois parcours phares", items: [{ t: "Analyste de données", x: "Statistiques, tableur avancé, visualisation : 6 cours, 54 heures." }, { t: "Communication digitale", x: "Rédaction web, réseaux sociaux, analytics : 5 cours, 40 heures." }, { t: "Gestion de projet", x: "Planification, risques, agilité : 4 cours, 32 heures." }] }],
        ["feat:steps", { title: "Comment ça se déroule", items: [{ t: "S'inscrire", x: "Créer son compte gratuitement.", d: "1" }, { t: "Suivre les cours", x: "À son rythme, sans date limite.", d: "2" }, { t: "Valider", x: "Projet final et certificat.", d: "3" }] }],
        ["proof:statsbar", { items: [["87 %", "de complétion des parcours (exemple)"], ["14", "parcours"], ["3", "niveaux"]] }],
      ] },
      { key: "abonnement", name: "Abonnement", blocks: [
        ["misc:pagehead", { title: "Abonnement", sub: "Accès libre ou certificat, vous choisissez." }],
        ["price:tiers", { items: [{ t: "Libre", price: "0 €", x: "Suivre les cours.", f: ["Vidéos et lectures", "Forums"], cta: "Créer mon compte", url: "/contact" }, { t: "Certifiant", price: "19 €", period: "par mois", x: "Pour valider.", f: ["Quiz notés", "Certificat vérifiable", "Correction par un enseignant"], cta: "Choisir", url: "/contact", hl: true }, { t: "Équipes", price: "Sur devis", x: "Pour les organisations.", f: ["Tableau de bord manager", "Facturation unique"], cta: "Demander un devis", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions sur l'abonnement", items: [{ t: "Puis-je résilier ?", x: "À tout moment, sans frais, depuis votre espace." }, { t: "Les certificats sont-ils reconnus ?", x: "Ils attestent des compétences acquises ; leur valeur dépend de chaque employeur (exemple)." }] }],
      ] },
      contactPage("Une réponse sous une journée ouvrée.", "Besoin d'aide ?", ["Contacter le support", "/contact"], "9 rue du Levant, 35000 Rennes", "Décrivez le cours ou le problème rencontré."),
    ],
  },

  // 6. Bootcamp code (sombre)
  {
    key: "codeforge-nuit", name: "Forge Nocturne", category: "education", tags: ["sombre", "technique"], siteType: "Bootcamp de développement web",
    description: "Fond nuit, vert citron électrique et typographie Space Grotesk : un bootcamp de code intensif avec catalogue réel, programme semaine par semaine et projets d'élèves.",
    modules: COURSES, brand: "Forge Nocturne",
    tokens: { colors: { primary: "#a3e635", secondary: "#161b22", accent: "#38bdf8", background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#9aa7b4" }, fonts: F("font.space-grotesk", "font.ibm-plex-sans"), radius: { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2d333b" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.05, letterSpacing: -0.03 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "codeforge", motifs: ["mesh", "halftone", "tiles"] },
    head: ["head:dark", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Programme", "/programme"], ["Financement", "/financement"], ["Projets", "/projets"], ["Candidature", "/contact"]], cta: ["Candidater", "/contact"],
    contact: { address: "La Fabrique, 3 rue des Forges, 67000 Strasbourg", phone: "03 88 52 17 40", email: "admission@codeforge.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Douze semaines pour changer de métier." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Bootcamp web · 12 semaines", title: "Devenez développeur·se en 12 semaines.", sub: "Formation intensive en JavaScript, React et Node.js, 35 heures par semaine, avec un projet réel en équipe et un accompagnement vers l'emploi.", cta: ["Candidater", "/contact"], cta2: ["Voir le programme", "/programme"] }],
        ["proof:statsbar", { items: [["12", "semaines"], ["15", "places par promotion"], ["84 %", "en poste à 6 mois (exemple)"], ["4", "projets réalisés"]] }],
        ["feat:rows", { eyebrow: "Au programme", title: "Ce que vous saurez faire", items: [{ t: "Front-end moderne", x: "HTML, CSS, JavaScript et React." }, { t: "API et bases de données", x: "Node.js, SQL et authentification." }, { t: "Travail en équipe", x: "Git, revue de code et méthode agile." }, { t: "Préparer l'embauche", x: "Portfolio, entretiens techniques et réseau." }] }],
        ["misc:courses", {}],
        ["proof:quotes", { title: "Retours d'anciens", items: [{ q: "Je venais de la logistique. Quatre mois plus tard, je signais mon premier CDI de développeuse.", n: "Julie M.", r: "ancienne élève fictive" }, { q: "L'équipe pousse à coder dès le jour un.", n: "Rayan K.", r: "ancien élève fictif" }, { q: "Le projet de fin de formation a convaincu mon recruteur.", n: "Elsa T.", r: "ancienne élève fictive" }] }],
        ["cta:card", { title: "Prochaine promotion : 6 janvier.", sub: "Il reste quelques places. Candidature en 10 minutes.", cta: ["Candidater", "/contact"] }],
      ] },
      { key: "programme", name: "Programme", blocks: [
        ["misc:pagehead", { title: "Programme", sub: "Douze semaines, quatre blocs, un projet de fin de parcours." }],
        ["feat:steps", { title: "Semaine après semaine", items: [{ t: "Fondations web", x: "HTML, CSS, JavaScript, algorithmique.", d: "S1 – 3" }, { t: "Front-end React", x: "Composants, états, appels d'API.", d: "S4 – 6" }, { t: "Back-end Node", x: "API REST, SQL, tests.", d: "S7 – 9" }, { t: "Projet final", x: "Une application complète en équipe.", d: "S10 – 12" }] }],
        ["feat:compare", { title: "Formats disponibles", rows: [["", "Temps plein", "Soirs et week-ends"], ["Durée", "12 semaines", "28 semaines"], ["Rythme", "35 h/semaine", "12 h/semaine"], ["Pour qui", "Reconversion complète", "En activité"]] }],
        ["cta:band", { title: "Un test de logique de 30 minutes suffit pour candidater.", cta: ["Passer le test", "/contact"] }],
      ] },
      { key: "financement", name: "Financement", blocks: [
        ["misc:pagehead", { title: "Financement", sub: "Des solutions pour chaque situation." }],
        ["feat:pricelist", { title: "Tarifs (exemple)", items: [{ t: "Temps plein, 12 semaines", x: "Matériel et plateforme inclus", price: "6 900 €" }, { t: "Soirs et week-ends, 28 semaines", x: "Pour les salariés", price: "5 400 €" }, { t: "Option mentorat emploi", x: "Trois mois après la fin", price: "490 €" }] }],
        ["feat:checks", { title: "Comment financer", cta: ["Parler à un conseiller", "/contact"], items: [{ t: "CPF et financement personnel" }, { t: "Prise en charge par une entreprise" }, { t: "Paiement en 6 fois sans frais" }, { t: "Accompagnement France Travail (exemple)" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il savoir coder ?", x: "Non, mais un pré-cours de 20 heures est fourni avant la rentrée." }, { t: "Un ordinateur est-il fourni ?", x: "Prêt possible sur demande." }] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ["misc:pagehead", { title: "Projets d'élèves", sub: "Réalisés en trois semaines par des équipes de quatre." }],
        ["gal:masonry", { items: [{ t: "Application de covoiturage étudiant", x: "React, Node, PostgreSQL" }, { t: "Plateforme de dons alimentaires", x: "Cartographie et notifications" }, { t: "Outil de réservation de salles", x: "Calendrier partagé" }, { t: "Jeu de quiz historique", x: "Scores en temps réel" }, { t: "Carnet de recettes collaboratif", x: "Authentification et partage" }] }],
        ["misc:quote", { text: "Un bon projet vaut mieux qu'un long CV.", by: "Formateur principal, Codeforge" }],
      ] },
      contactPage("Une réponse sous deux jours ouvrés.", "Candidater ou poser une question", ["Envoyer ma candidature", "/contact"], "3 rue des Forges, 67000 Strasbourg", "Parcours actuel, motivation et format souhaité."),
    ],
  },

  // 7. Formation professionnelle certifiante
  {
    key: "certifia-pro", name: "Certifia Pro", category: "education", tags: ["classique", "moderne"], siteType: "Organisme de formation certifiante (CAP, titres professionnels)",
    description: "Bleu roi, blanc pur et Fraunces chaleureux : un centre de formation certifiante pour adultes, avec catalogue réel, indicateurs de résultat, financement et étapes d'inscription.",
    modules: COURSES, brand: "Certifia Pro",
    tokens: { colors: { primary: "#1e40af", secondary: "#0f1f4d", accent: "#f59e0b", background: "#ffffff", surface: "#f1f5fb", text: "#111c3a", muted: "#4a5675" }, fonts: F("font.fraunces", "font.work-sans"), radius: { sm: 4, md: 8, lg: 12, button: 8, field: 6, card: 10 }, shadow: { card: "sm", button: "sm" }, border: { width: 1, color: "#d4dcee" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "certifia", motifs: ["plates", "tiles", "topo"] },
    head: ["head:topbar", { info: "Éligible CPF · Certifié qualité (exemple)", note: "Entrées permanentes" }], foot: ["foot:columns", { about: "Centre de formation certifiante pour adultes en reconversion ou en évolution.", cols: [["Formations", "Catalogue", "Financement", "Étapes"], ["Centre", "Résultats", "Contact"]] }],
    menu: [["Accueil", "/"], ["Formations", "/formations"], ["Financement", "/financement"], ["Résultats", "/resultats"], ["Contact", "/contact"]], cta: ["Je me renseigne", "/contact"],
    contact: { address: "27 avenue de la République, 69100 Villeurbanne", phone: "04 78 33 61 90", email: "conseil@certifia-pro.example", hours: "Lundi – vendredi, 8 h 30 – 17 h 30", tagline: "Un titre reconnu, un emploi durable." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Titres professionnels et certifications", title: "Obtenez un titre reconnu, changez de métier.", sub: "Aide-comptable, secrétaire assistant médico-social, conseiller en insertion : des parcours de 3 à 9 mois, finançables et suivis jusqu'à l'emploi.", cta: ["Voir les formations", "/formations"], cta2: ["Me faire rappeler", "/contact"], image: "hero" }],
        ["feat:checks", { title: "Pourquoi choisir Certifia Pro", cta: ["Parler à un conseiller", "/contact"], items: [{ t: "Titres inscrits au répertoire national (exemple)" }, { t: "Stages en entreprise de 6 à 8 semaines" }, { t: "Accompagnement vers l'emploi" }, { t: "Dossier de financement monté avec vous" }] }],
        ["misc:courses", {}],
        ["proof:stats", { title: "Nos résultats (exemples)", items: [["88 %", "de réussite à l'examen"], ["74 %", "en emploi à 6 mois"], ["96 %", "recommandent le centre"]] }],
        ["feat:numbered", { title: "Un parcours en trois temps", items: [{ t: "Positionnement", x: "Entretien et tests pour valider le projet." }, { t: "Formation", x: "Cours, ateliers et stage pratique." }, { t: "Certification", x: "Jury, titre et accompagnement à l'emploi." }] }],
        ["cta:band", { title: "Prochaine réunion d'information : jeudi 14 h.", sub: "Venez poser vos questions, sans engagement.", cta: ["Je m'inscris", "/contact"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations certifiantes", sub: "Choisissez votre futur métier." }],
        ["misc:courses", {}],
        ["feat:strips", { title: "Secteurs recrutant (exemples)", items: [{ t: "Comptabilité et gestion", x: "Des TPE aux cabinets, des besoins permanents." }, { t: "Santé et social", x: "Secrétariat médical, aide à la personne." }, { t: "Numérique", x: "Assistance informatique et maintenance." }] }],
        ["cta:split", { title: "Un doute sur l'orientation ?", sub: "Un bilan de compétences gratuit de 45 minutes.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "financement", name: "Financement", blocks: [
        ["misc:pagehead", { title: "Financer votre formation", sub: "CPF, France Travail, employeur : nous vous orientons." }],
        ["feat:accordion", { title: "Les dispositifs", items: [{ t: "Compte personnel de formation", x: "Mobilisable en tout ou partie selon vos droits acquis." }, { t: "France Travail", x: "Aides individuelles pour les demandeurs d'emploi." }, { t: "Plan de l'entreprise", x: "Pour les salariés avec accord de l'employeur." }, { t: "Transition professionnelle", x: "Pour un changement de métier pendant l'activité." }] }],
        ["feat:steps", { title: "Étapes d'inscription", items: [{ t: "Appel", x: "Premier échange avec un conseiller.", d: "J" }, { t: "Dossier", x: "Constitué ensemble.", d: "J+7" }, { t: "Accord de financement", x: "Délai habituel de deux semaines.", d: "J+21" }] }],
      ] },
      { key: "resultats", name: "Résultats", blocks: [
        ["misc:pagehead", { title: "Résultats et indicateurs", sub: "Transparence sur la réussite de nos stagiaires." }],
        ["proof:statsbar", { items: [["412", "stagiaires en 2025 (exemple)"], ["88 %", "réussite"], ["74 %", "emploi à 6 mois"]] }],
        ["proof:quotes", { title: "Ils ont changé de métier", items: [{ q: "À 42 ans, je suis devenue comptable. Le centre m'a rassurée dès le premier appel.", n: "Corinne V.", r: "ancienne stagiaire fictive" }, { q: "Le stage m'a ouvert la porte de mon entreprise.", n: "Alexis B.", r: "ancien stagiaire fictif" }, { q: "Des formateurs réellement du métier.", n: "Samia O.", r: "ancienne stagiaire fictive" }] }],
        ["cta:card", { title: "À votre tour.", cta: ["Je me renseigne", "/contact"] }],
      ] },
      contactPage("Un conseiller vous rappelle sous 24 heures ouvrées.", "Parlons de votre projet professionnel", ["Être rappelé", "/contact"], "27 avenue de la République, 69100 Villeurbanne", "Votre situation actuelle et le métier visé."),
    ],
  },

  // 8. École de musique (sombre)
  {
    key: "conservatoire-lune", name: "Notes de Lune", category: "education", tags: ["sombre", "luxe", "editorial"], siteType: "École de musique et conservatoire associatif",
    description: "Nuit prune, or doux et Instrument Serif en grand : une école de musique élégante avec instruments, concerts, tarifs annuels et galerie des ensembles.",
    brand: "Notes de Lune",
    tokens: { colors: { primary: "#e3b23c", secondary: "#2a1d3c", accent: "#b69cff", background: "#150f20", surface: "#201832", text: "#f3ecfa", muted: "#b5a8c9" }, fonts: F("font.instrument-serif", "font.dm-sans"), radius: { sm: 4, md: 8, lg: 14, button: 999, field: 8, card: 14 }, shadow: { card: "lg", button: "none" }, border: { width: 1, color: "#3a2d52" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.02, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "pill" }, art: { seed: "lune", motifs: ["arches", "bokeh", "rays"] },
    head: ["head:minimal", {}], foot: ["foot:big", { title: "Notes de Lune" }],
    menu: [["Accueil", "/"], ["Instruments", "/instruments"], ["Concerts", "/concerts"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["S'inscrire", "/tarifs"],
    contact: { address: "4 impasse des Luthiers, 25000 Besançon", phone: "03 81 62 40 19", email: "accueil@notesdelune.example", hours: "Mardi – samedi, 10 h – 20 h", tagline: "La musique à toute heure." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "École de musique · Besançon", title: "Apprendre la musique, doucement, passionnément.", sub: "Piano, guitare, violon, chant et batterie pour tous les âges, avec concerts d'élèves chaque trimestre.", cta: ["Découvrir les instruments", "/instruments"], cta2: ["Cours d'essai", "/contact"], image: "hero" }],
        ["feat:cards", { title: "Une école, trois manières de jouer", items: [{ icon: "play", t: "Cours individuels", x: "Trente minutes à une heure chaque semaine avec votre professeur." }, { icon: "users", t: "Ensembles", x: "Orchestre, chorale et groupes de musiques actuelles." }, { icon: "star", t: "Éveil musical", x: "Dès 4 ans, pour découvrir rythme et chant par le jeu." }] }],
        ["gal:coursecards", { title: "Ateliers de la saison (démonstration)", items: [{ t: "Piano débutant adulte", tag: "Tous niveaux", price: "58 €/mois", x: "Lecture de notes et premier répertoire.", cta: "En savoir plus", url: "/instruments" }, { t: "Atelier de chant choral", tag: "Ensemble", price: "24 €/mois", x: "Répertoire du monde, soirée de concert.", cta: "En savoir plus", url: "/instruments" }, { t: "Groupes de rock", tag: "Ados", price: "36 €/mois", x: "Répétition en studio et premier concert.", cta: "En savoir plus", url: "/concerts" }] }],
        ["proof:big", { items: [{ q: "Je rêvais de jouer du piano depuis vingt ans. Aujourd'hui je joue pour mes petits-enfants.", n: "Odette P.", r: "élève fictive" }] }],
        ["cta:image", { title: "Venez essayer un instrument.", sub: "Un cours d'essai gratuit de trente minutes chaque samedi.", cta: ["Réserver un essai", "/contact"] }],
      ] },
      { key: "instruments", name: "Instruments", blocks: [
        ["misc:pagehead", { title: "Instruments et ensembles", sub: "Douze disciplines enseignées par des musiciens en activité." }],
        ["feat:tabs", { title: "Par famille", items: [{ t: "Cordes", x: "Violon, alto, violoncelle, guitare classique et électrique." }, { t: "Claviers", x: "Piano, orgue et clavier de musiques actuelles." }, { t: "Voix", x: "Chant lyrique, chant moderne, chorale d'adultes." }, { t: "Percussions", x: "Batterie, percussions du monde, éveil rythmique." }] }],
        ["proof:team", { title: "Les professeurs", items: [{ n: "Iris Valmont", r: "Piano et accompagnement" }, { n: "Tomas Rivière", r: "Guitare et musiques actuelles" }, { n: "Léopold Szabo", r: "Violon et orchestre" }, { n: "Noor Benhamou", r: "Chant et chorale" }] }],
        ["cta:band", { title: "Un instrument à prêter pour débuter.", sub: "Location à 10 € par mois la première année.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "concerts", name: "Concerts", blocks: [
        ["misc:pagehead", { title: "Concerts et auditions", sub: "Chaque trimestre, la scène est aux élèves." }],
        ["misc:schedule", { title: "Prochaines dates", items: [{ d: "14 déc.", t: "Concert de Noël", x: "Orchestre et chorale, salle des fêtes, 18 h." }, { d: "8 fév.", t: "Audition des pianistes", x: "Entrée libre, à l'auditorium, 15 h." }, { d: "21 mars", t: "Soirée musiques actuelles", x: "Groupes ados et adultes, 20 h." }, { d: "20 juin", t: "Fête de la musique", x: "Concert sur la place, dès 17 h." }] }],
        ["gal:wall", { items: [{ t: "Orchestre" }, { t: "Chorale" }, { t: "Groupe rock" }, { t: "Duo de violons" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs de la saison", sub: "Cours à l'année, paiement échelonné possible." }],
        ["price:tiers", { items: [{ t: "Éveil", price: "290 €", period: "par an", x: "4 à 6 ans.", f: ["Cours collectif d'une heure", "Concert de fin d'année"], cta: "Réserver", url: "/contact" }, { t: "Instrument", price: "720 €", period: "par an", x: "Le plus choisi.", f: ["30 minutes par semaine", "Ensemble inclus", "Auditions"], cta: "Réserver", url: "/contact", hl: true }, { t: "Adulte", price: "690 €", period: "par an", x: "Tous niveaux.", f: ["Cours individuel", "Atelier collectif", "Concert"], cta: "Réserver", url: "/contact" }] }],
        ["feat:list2", { title: "Inclus", items: [{ t: "Adhésion à l'association" }, { t: "Accès aux salles de travail" }, { t: "Entrée aux concerts" }, { t: "Prêt de partitions" }] }],
      ] },
      contactPage("Nous répondons du mardi au samedi.", "Venez essayer", ["Réserver un essai", "/contact"], "4 impasse des Luthiers, 25000 Besançon", "Instrument envisagé, âge de l'élève, niveau."),
    ],
  },

  // 9. École de design
  {
    key: "atelier-vecto", name: "Vecto École", category: "education", tags: ["audacieux", "geometrique"], siteType: "École de design graphique et numérique",
    description: "Fuchsia vibrant, blanc nuage et Unbounded en capitales : une école de design au graphisme affirmé, avec spécialités, workshops, projets d'étudiants et jours de portfolio.",
    brand: "Vecto École de design",
    tokens: { colors: { primary: "#a21caf", secondary: "#2a0f33", accent: "#22d3ee", background: "#fdf8ff", surface: "#ffffff", text: "#25122c", muted: "#5f4a68" }, fonts: F("font.unbounded", "font.epilogue"), radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#25122c" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.02, letterSpacing: -0.02, transform: "uppercase" }, h2: { size: 34, weight: 700, lineHeight: 1.1, letterSpacing: -0.01, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "vecto", motifs: ["halftone", "plates", "ribbons"] },
    head: ["head:side", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Cursus", "/cursus"], ["Workshops", "/workshops"], ["Projets", "/projets"], ["Admissions", "/contact"]], cta: ["Journée portfolio", "/contact"],
    contact: { address: "Hangar 7, quai des Chartrons, 33000 Bordeaux", phone: "05 56 90 11 74", email: "admissions@vecto-ecole.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Faire du design un métier." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "École de design · Bac +3 / +5", title: "Dessinez ce qui n'existe pas encore.", sub: "Graphisme, motion, UX et illustration : trois ans de projets réels avec de vraies équipes.", cta: ["Journée portfolio", "/contact"], cta2: ["Les cursus", "/cursus"] }],
        ["gal:featured", { title: "Projets d'étudiants", items: [{ t: "Identité d'un festival de jazz", x: "Projet de 3e année" }, { t: "Application de mobilité douce", x: "Master UX" }, { t: "Affiches pour une librairie", x: "1re année" }, { t: "Court métrage animé", x: "Atelier motion" }] }],
        ["feat:bento", { title: "Une pédagogie par le projet", items: [{ icon: "palette", t: "Atelier chaque jour", x: "Trois jours par semaine de studio avec critique collective." }, { icon: "briefcase", t: "Clients réels", x: "Chaque semestre, un projet commandé par une structure partenaire." }, { icon: "globe", t: "Semestre à l'étranger", x: "Partenaires à Lisbonne, Montréal et Séoul (exemple)." }] }],
        ["proof:logos", { title: "Partenaires projets (fictifs)", items: ["Studio Pirouette", "Maison Onyx", "Théâtre des Brumes", "Agence Lumio"] }],
        ["proof:stats", { items: [["280", "étudiants"], ["92 %", "en emploi ou en freelance à 1 an (exemple)"], ["40", "enseignants praticiens"]] }],
        ["cta:band", { title: "Montrez-nous vos dessins.", sub: "Journée portfolio le 22 février : entretien individuel, retour en 48 h.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "cursus", name: "Cursus", blocks: [
        ["misc:pagehead", { title: "Cursus", sub: "Du bac au master, cinq spécialités." }],
        ["feat:tabs", { title: "Spécialités", items: [{ t: "Design graphique", x: "Identité, édition, typographie et affiche." }, { t: "Motion design", x: "Animation 2D, titrage et sound design." }, { t: "UX / UI", x: "Recherche utilisateur, prototypage et design system." }, { t: "Illustration", x: "Narration visuelle, jeunesse et presse." }] }],
        ["gal:coursecards", { title: "Programmes (démonstration)", items: [{ t: "Bachelor design", tag: "Bac +3", price: "7 400 €/an", x: "Fondamentaux, spécialité et projet de fin d'études.", cta: "Candidater", url: "/contact" }, { t: "Master direction artistique", tag: "Bac +5", price: "8 600 €/an", x: "Stratégie visuelle et direction de projets.", cta: "Candidater", url: "/contact" }, { t: "Prépa créative", tag: "Bac", price: "5 900 €", x: "Un an pour construire son portfolio.", cta: "Candidater", url: "/contact" }] }],
        ["feat:steps", { title: "Admission", items: [{ t: "Dossier", x: "Portfolio et lettre.", d: "Mars" }, { t: "Entretien", x: "Présentation et échange.", d: "Avril" }, { t: "Réponse", x: "Sous une semaine.", d: "Mai" }] }],
      ] },
      { key: "workshops", name: "Workshops", blocks: [
        ["misc:pagehead", { title: "Workshops", sub: "Des stages courts ouverts à tous, pendant les vacances." }],
        ["misc:schedule", { title: "Prochaines sessions", items: [{ d: "3 – 5 fév.", t: "Lettering et affiche", x: "Trois jours, matériel fourni." }, { d: "17 – 21 avr.", t: "Initiation motion design", x: "Cinq jours pour animer un logo." }, { d: "7 – 9 juil.", t: "Portfolio : le grand tri", x: "Préparer sa candidature." }] }],
        ["feat:list2", { title: "Chaque workshop comprend", items: [{ t: "Matériel et licences logicielles" }, { t: "Corrections individuelles" }, { t: "Attestation de participation" }, { t: "Pause déjeuner partagée" }] }],
        ["cta:split", { title: "Moins de 25 ans ? Tarif réduit.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ["misc:pagehead", { title: "Projets", sub: "Travaux choisis des promotions récentes." }],
        ["gal:masonry", { items: [{ t: "Packaging d'un café de torréfaction", tag: "Graphisme" }, { t: "Série d'affiches de théâtre", tag: "Illustration" }, { t: "Générique animé", tag: "Motion" }, { t: "Prototype d'application de lecture", tag: "UX" }, { t: "Police de caractères sur mesure", tag: "Typographie" }] }],
        ["proof:big", { items: [{ q: "L'école m'a appris à défendre mes choix devant un client.", n: "Maëlle S.", r: "ancienne étudiante fictive" }] }],
      ] },
      contactPage("L'équipe des admissions répond sous 48 heures.", "Rencontrons-nous", ["S'inscrire à la journée", "/contact"], "Hangar 7, quai des Chartrons, 33000 Bordeaux", "Spécialité visée et lien vers votre portfolio.", "cards"),
    ],
  },

  // 10. Préparation aux concours
  {
    key: "concours-cap", name: "Concours Cap", category: "education", tags: ["moderne", "technique"], siteType: "Préparation aux concours de la fonction publique",
    description: "Bleu ciel dense, gris perle et titres Archivo nets : une préparation aux concours administratifs, avec catalogue réel, calendrier d'épreuves, concours blancs et suivi.",
    modules: COURSES, brand: "Concours Cap",
    tokens: { colors: { primary: "#0369a1", secondary: "#082f49", accent: "#ea580c", background: "#f3f6f9", surface: "#ffffff", text: "#0f2230", muted: "#4a6070" }, fonts: F("font.archivo", "font.literata"), radius: { sm: 3, md: 6, lg: 10, button: 6, field: 6, card: 8 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#cfdbe5" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.05, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "capconcours", motifs: ["topo", "tiles", "rays"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Préparation en ligne et en salle aux concours de catégories A, B et C (exemple).", cols: [["Préparations", "Catalogue", "Calendrier", "Tarifs"], ["Contact", "Aide", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Préparations", "/preparations"], ["Calendrier", "/calendrier"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Passer un concours blanc", "/contact"],
    contact: { address: "18 rue de la Préfecture, 21000 Dijon", phone: "03 80 44 29 61", email: "inscription@concourscap.example", hours: "Lundi – vendredi, 9 h – 18 h", tagline: "Préparez-vous, point par point." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Catégories A, B et C", title: "Réussissez votre concours, sans vous disperser.", sub: "Cours, fiches et concours blancs corrigés par des anciens membres de jury, en visio ou en salle.", cta: ["Voir les préparations", "/preparations"], cta2: ["Concours blanc gratuit", "/contact"], image: "hero", stats: [["2 800", "candidats préparés par an"], ["38 %", "d'admis (exemple)"], ["12", "préparateurs"]] }],
        ["feat:alt", { title: "Une méthode éprouvée", items: [{ t: "Cours structurés", x: "Droit public, finances, culture générale et note de synthèse, avec fiches de révision." }, { t: "Concours blancs", x: "Dans les conditions réelles, avec correction détaillée sous 10 jours." }, { t: "Suivi individuel", x: "Un préparateur référent fixe un plan de révision hebdomadaire.", link: ["Voir les tarifs", "/tarifs"] }] }],
        ["misc:courses", {}],
        ["feat:numbered", { title: "Le chemin vers l'admission", items: [{ t: "Diagnostic", x: "Test de niveau gratuit." }, { t: "Entraînement", x: "Cours et annales." }, { t: "Épreuves", x: "Oral blanc devant un jury." }] }],
        ["proof:quotes", { title: "Reçus au concours", items: [{ q: "La note de synthèse corrigée m'a fait gagner quatre points.", n: "Béatrice L.", r: "admise, cliente fictive" }, { q: "Mon oral blanc m'a évité des erreurs de débutant.", n: "Karim Z.", r: "admis, client fictif" }, { q: "Le plan de révision m'a gardé motivée.", n: "Pauline D.", r: "admise, cliente fictive" }] }],
        ["cta:split", { title: "Testez votre niveau.", sub: "Concours blanc de 3 heures, corrigé gratuitement.", cta: ["Je m'inscris", "/contact"] }],
      ] },
      { key: "preparations", name: "Préparations", blocks: [
        ["misc:pagehead", { title: "Préparations", sub: "Par catégorie et par concours." }],
        ["misc:courses", {}],
        ["feat:compare", { title: "Choisir sa catégorie", rows: [["", "Catégorie A", "Catégorie B", "Catégorie C"], ["Niveau requis", "Bac +3", "Bac", "Brevet"], ["Épreuves", "Écrit long, oral", "QCM, note", "Tests, oral"], ["Durée de préparation", "6 à 9 mois", "4 à 6 mois", "2 à 4 mois"]] }],
        ["cta:card", { title: "Un doute sur la catégorie ?", cta: ["Parler à un conseiller", "/contact"] }],
      ] },
      { key: "calendrier", name: "Calendrier", blocks: [
        ["misc:pagehead", { title: "Calendrier des épreuves", sub: "Dates indicatives de la saison (exemple)." }],
        ["misc:schedule", { title: "Saison 2027", items: [{ d: "15 janv.", t: "Ouverture des inscriptions", x: "Dossiers à déposer avant le 5 mars." }, { d: "20 avr.", t: "Épreuves d'admissibilité", x: "Écrits dans votre département." }, { d: "10 juin", t: "Résultats d'admissibilité", x: "Convocations aux oraux." }, { d: "Sept.", t: "Oraux d'admission", x: "Selon le concours." }] }],
        ["feat:list2", { title: "Documents à préparer", items: [{ t: "Pièce d'identité" }, { t: "Diplômes ou équivalence" }, { t: "Justificatif de domicile" }, { t: "Photographie" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Des formules selon votre disponibilité." }],
        ["price:tiers", { items: [{ t: "En ligne", price: "390 €", period: "6 mois", x: "À votre rythme.", f: ["Cours en vidéo", "Fiches", "2 concours blancs"], cta: "S'inscrire", url: "/contact" }, { t: "Intensif", price: "890 €", period: "6 mois", x: "Le plus complet.", f: ["Visio hebdomadaire", "6 concours blancs", "Oral blanc"], cta: "S'inscrire", url: "/contact", hl: true }, { t: "Coaching", price: "1 450 €", period: "9 mois", x: "Suivi individuel.", f: ["Préparateur référent", "Corrections prioritaires"], cta: "S'inscrire", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Puis-je étaler le paiement ?", x: "Oui, en trois fois sans frais." }, { t: "Y a-t-il une garantie ?", x: "Remboursement partiel si vous abandonnez avant le premier mois (exemple)." }] }],
      ] },
      contactPage("Réponse sous un jour ouvré.", "Un conseiller pour votre concours", ["Envoyer", "/contact"], "18 rue de la Préfecture, 21000 Dijon", "Concours visé, date et niveau actuel."),
    ],
  },

  // 11. Formation continue en entreprise
  {
    key: "entreprise-cap", name: "Talentis Formation", category: "education", tags: ["minimaliste", "moderne"], siteType: "Formation continue pour entreprises (B2B)",
    description: "Ardoise sobre, vert menthe vif en accent et Red Hat Display : un prestataire de formation interentreprises, avec catalogue réel, intra sur mesure, références et devis.",
    modules: COURSES, brand: "Talentis Formation",
    tokens: { colors: { primary: "#047857", secondary: "#1e293b", accent: "#14b8a6", background: "#f8fafc", surface: "#ffffff", text: "#142033", muted: "#4d5b70" }, fonts: F("font.red-hat-display", "font.mulish"), radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 12 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d9e1ea" }, type: { h1: { size: 52, weight: 800, lineHeight: 1.08, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "talentis", motifs: ["tiles", "mesh", "plates"] },
    head: ["head:center", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Catalogue", "/catalogue"], ["Sur mesure", "/sur-mesure"], ["Références", "/references"], ["Devis", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "Tour Valmy, 6 esplanade des Affaires, 92000 Nanterre", phone: "01 47 20 80 55", email: "devis@talentis-formation.example", hours: "Lundi – vendredi, 8 h 30 – 18 h", tagline: "Des équipes qui progressent ensemble." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Formation continue pour entreprises", title: "Des formations qui changent la façon de travailler.", sub: "Management, vente, bureautique, prévention et langues : des programmes en inter ou dans vos locaux, avec un suivi des résultats pour les RH.", cta: ["Demander un devis", "/contact"], cta2: ["Voir le catalogue", "/catalogue"], stats: [["650", "entreprises clientes (exemple)"], ["9 200", "salariés formés"], ["4,7/5", "satisfaction moyenne"]] }],
        ["feat:grid-icons", { title: "Nos domaines", items: [{ icon: "users", t: "Management", x: "Animer, déléguer, conduire le changement." }, { icon: "trendingUp", t: "Vente", x: "Prospecter, négocier, fidéliser." }, { icon: "monitor", t: "Bureautique", x: "Excel, Power BI, outils collaboratifs." }, { icon: "shield", t: "Sécurité", x: "Habilitations et gestes de premiers secours." }] }],
        ["misc:courses", {}],
        ["feat:strips", { title: "Comment nous travaillons", items: [{ t: "Cadrage du besoin", x: "Atelier avec les RH et les managers." }, { t: "Programme et dates", x: "Proposition écrite sous 5 jours." }, { t: "Animation", x: "Formateurs praticiens, supports adaptés." }, { t: "Suivi", x: "Évaluation à chaud, à 3 mois et bilan RH." }] }],
        ["proof:logos", { title: "Ils nous font confiance (clients fictifs)", items: ["Aurélys Assurances", "Brasserie Haut-Pays", "Cobalt Logistique", "Domaine Piémont"] }],
        ["cta:band", { title: "Réponse à votre demande sous 48 h.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "catalogue", name: "Catalogue", blocks: [
        ["misc:pagehead", { title: "Catalogue inter-entreprises", sub: "Des sessions ouvertes, dates garanties dès 4 inscrits." }],
        ["misc:courses", {}],
        ["feat:checks", { title: "Inclus dans chaque session", cta: ["Demander un devis", "/contact"], items: [{ t: "Supports remis et ressources en ligne" }, { t: "Déjeuner et accueil" }, { t: "Attestation de présence" }, { t: "Évaluation des acquis" }] }],
        ["feat:accordion", { title: "Questions de service RH", items: [{ t: "Prise en charge par l'OPCO ?", x: "Nous fournissons convention et programme pour votre dossier (exemple de démonstration)." }, { t: "Peut-on reporter une session ?", x: "Sans frais jusqu'à 10 jours avant." }] }],
      ] },
      { key: "sur-mesure", name: "Sur mesure", blocks: [
        ["misc:pagehead", { title: "Programmes sur mesure", sub: "Formations dans vos locaux, vos cas, votre vocabulaire." }],
        ["feat:alt", { items: [{ t: "Diagnostic", x: "Entretiens avec les managers et audit des pratiques pour fixer des objectifs mesurables." }, { t: "Conception", x: "Programme, exercices et cas inspirés de votre activité réelle." }, { t: "Déploiement", x: "Sessions courtes, groupes homogènes, formateur référent.", link: ["Parler à un conseiller", "/contact"] }] }],
        ["feat:numbered", { title: "En chiffres (exemples)", items: [{ t: "-35 %", x: "de temps de prise de poste." }, { t: "92 %", x: "des managers appliquent les acquis." }, { t: "3 mois", x: "pour déployer un cursus." }] }],
      ] },
      { key: "references", name: "Références", blocks: [
        ["misc:pagehead", { title: "Références", sub: "Quelques missions menées pour des clients fictifs." }],
        ["proof:quotes", { title: "Témoignages", items: [{ q: "Nos 40 managers ont suivi le programme en six mois. Les remontées terrain sont excellentes.", n: "Delphine R.", r: "DRH, cliente fictive" }, { q: "Un devis clair et des formateurs qui connaissent notre secteur.", n: "Julien M.", r: "responsable formation, client fictif" }, { q: "Les équipes ont gagné en autonomie.", n: "Valérie S.", r: "directrice d'agence, cliente fictive" }] }],
        ["proof:stats", { items: [["14 ans", "d'activité"], ["120", "formateurs partenaires"], ["20", "secteurs couverts"]] }],
        ["cta:card", { title: "Votre entreprise est la prochaine.", cta: ["Demander un devis", "/contact"] }],
      ] },
      contactPage("Un conseiller vous rappelle sous 48 heures.", "Décrivez votre besoin de formation", ["Demander un devis", "/contact"], "6 esplanade des Affaires, 92000 Nanterre", "Effectif, thème et délai souhaités."),
    ],
  },

  // 12. Académie d'été pour enfants
  {
    key: "academie-ete", name: "Académie Estivale", category: "education", tags: ["ludique", "naturel"], siteType: "Académie d'été et colonie apprenante pour enfants",
    description: "Violet joyeux, jaune soleil et Fredoka arrondi : une académie d'été pour les 6-14 ans, avec semaines thématiques, journée type, tarifs par semaine et infos pour les parents.",
    brand: "Académie des Petits Explorateurs",
    tokens: { colors: { primary: "#7e22ce", secondary: "#2d1b4e", accent: "#facc15", background: "#fffdf0", surface: "#ffffff", text: "#2a1840", muted: "#5d4a76" }, fonts: F("font.fredoka", "font.quicksand"), radius: { sm: 12, md: 18, lg: 28, button: 999, field: 16, card: 28 }, shadow: { card: "md", button: "md" }, type: { h1: { size: 56, weight: 600, lineHeight: 1.08, letterSpacing: 0 } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "pill" }, art: { seed: "explorateurs", motifs: ["objects", "blobs", "dunes"] },
    head: ["head:topbar", { info: "Inscriptions d'été ouvertes jusqu'au 30 mai", note: "Du 6 juillet au 28 août" }], foot: ["foot:newsletter", { title: "Le programme de l'été dans votre boîte", sub: "Dates, thèmes et conseils pour les parents.", button: "Je m'inscris" }],
    menu: [["Accueil", "/"], ["Semaines", "/semaines"], ["Journée type", "/journee"], ["Tarifs", "/tarifs"], ["Parents", "/parents"], ["Contact", "/contact"]], cta: ["Réserver une semaine", "/tarifs"],
    contact: { address: "Parc de Bellevue, chemin des Libellules, 74000 Annecy", phone: "04 50 27 31 62", email: "bonjour@petits-explorateurs.example", hours: "Accueil : 7 h 45 – 18 h 15, du lundi au vendredi en été", tagline: "L'été où l'on apprend en jouant." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Pour les 6 – 14 ans · Annecy", title: "Un été à explorer, créer et apprendre.", sub: "Des semaines thématiques en plein air : sciences, théâtre, nature, robotique et sport, encadrées par des animateurs diplômés.", cta: ["Choisir une semaine", "/semaines"], cta2: ["Infos parents", "/parents"] }],
        ["gal:cards", { title: "Les semaines de l'été", items: [{ t: "Petits chimistes", tag: "6 – 9 ans", x: "Volcans, bulles géantes et expériences colorées." }, { t: "Apprentis robots", tag: "10 – 14 ans", x: "Construire et programmer un robot suiveur de ligne." }, { t: "Cabanes et forêt", tag: "6 – 10 ans", x: "Pistage, cabanes et jeux de piste dans le parc." }, { t: "Troupe de théâtre", tag: "8 – 12 ans", x: "Écrire, répéter et jouer une petite pièce." }] }],
        ["feat:icons", { title: "Pourquoi les familles reviennent", items: [{ icon: "shield", t: "Équipe diplômée", x: "Un animateur pour huit enfants au plus." }, { icon: "sun", t: "Plein air", x: "Plus de la moitié des activités se déroulent dehors." }, { icon: "heart", t: "Bienveillance", x: "Chacun avance à son rythme, sans compétition." }] }],
        ["proof:quotes", { title: "Les familles racontent", items: [{ q: "Mon fils parle encore de sa semaine robots à table.", n: "Cécile H.", r: "maman, cliente fictive" }, { q: "Des animateurs attentifs et un accueil souple.", n: "David R.", r: "papa, client fictif" }, { q: "Ma fille a osé monter sur scène.", n: "Zoé B.", r: "maman, cliente fictive" }] }],
        ["cta:image", { title: "Les places partent vite en juillet.", sub: "Réservez avant le 30 mai pour un tarif réduit.", cta: ["Réserver", "/tarifs"] }],
      ] },
      { key: "semaines", name: "Semaines", blocks: [
        ["misc:pagehead", { title: "Semaines thématiques", sub: "Huit semaines, huit univers." }],
        ["gal:coursecards", { title: "Programme (démonstration)", items: [{ t: "Petits chimistes", tag: "6 – 9 ans", price: "185 €", x: "Semaine du 6 au 10 juillet.", cta: "Réserver", url: "/tarifs" }, { t: "Apprentis robots", tag: "10 – 14 ans", price: "215 €", x: "Semaine du 13 au 17 juillet.", cta: "Réserver", url: "/tarifs" }, { t: "Cabanes et forêt", tag: "6 – 10 ans", price: "175 €", x: "Semaine du 20 au 24 juillet.", cta: "Réserver", url: "/tarifs" }] }],
        ["feat:tabs", { title: "Par âge", items: [{ t: "6 – 8 ans", x: "Jeu, créativité et découvertes du vivant." }, { t: "9 – 11 ans", x: "Projets en équipe, sciences et arts." }, { t: "12 – 14 ans", x: "Robotique, théâtre et défis sportifs." }] }],
        ["cta:band", { title: "Une semaine peut en cacher une autre.", sub: "-10 % dès la deuxième semaine réservée.", cta: ["Voir les tarifs", "/tarifs"] }],
      ] },
      { key: "journee", name: "Journée type", blocks: [
        ["misc:pagehead", { title: "Une journée à l'académie", sub: "Un rythme calme et rempli." }],
        ["misc:schedule", { title: "De l'accueil au départ", items: [{ d: "8 h", t: "Accueil et jeux libres", x: "Les enfants arrivent à leur rythme." }, { d: "9 h 30", t: "Atelier de la semaine", x: "Science, théâtre ou robotique." }, { d: "12 h", t: "Déjeuner", x: "Panier ou repas préparé sur place." }, { d: "13 h 30", t: "Jeux de plein air", x: "Grands jeux et baignade surveillée." }, { d: "16 h 30", t: "Goûter et restitution", x: "Chaque groupe présente son travail." }] }],
        ["gal:wall", { items: [{ t: "Expériences" }, { t: "Robots" }, { t: "Cabanes" }, { t: "Théâtre" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et réservation", sub: "Paiement en deux fois, aides des CE acceptées." }],
        ["price:tiers", { items: [{ t: "Journée", price: "42 €", x: "Pour essayer.", f: ["Activités de la semaine", "Goûter"], cta: "Réserver", url: "/contact" }, { t: "Semaine", price: "195 €", period: "5 jours", x: "Le plus choisi.", f: ["Atelier de la semaine", "Sorties", "Goûters"], cta: "Réserver", url: "/contact", hl: true }, { t: "Été complet", price: "1 290 €", period: "8 semaines", x: "Tranquillité totale.", f: ["Toutes les semaines", "Tenue offerte"], cta: "Réserver", url: "/contact" }] }],
        ["feat:list2", { title: "Toujours compris", items: [{ t: "Assurance activités" }, { t: "Goûter quotidien" }, { t: "Photos pour les parents" }, { t: "Garderie dès 7 h 45" }] }],
      ] },
      { key: "parents", name: "Parents", blocks: [
        ["misc:pagehead", { title: "Infos parents", sub: "Sécurité, santé, matériel : tout ce qu'il faut savoir." }],
        ["misc:faq", { items: [{ t: "Que doit apporter mon enfant ?", x: "Casquette, gourde, chaussures fermées et tenue de rechange." }, { t: "Qui encadre les groupes ?", x: "Animateurs diplômés BAFA et enseignants, vérifiés avant embauche." }, { t: "Et en cas d'allergie ?", x: "Une fiche sanitaire est demandée et l'infirmière du site est informée." }, { t: "Puis-je annuler ?", x: "Remboursement intégral jusqu'à 15 jours avant la semaine." }] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Garance Mollet", r: "Directrice de l'académie" }, { n: "Théo Rabier", r: "Responsable sciences" }, { n: "Awa Diallo", r: "Responsable théâtre" }] }],
        ["cta:card", { title: "Une question ?", sub: "Nous répondons chaque jour d'été.", cta: ["Nous écrire", "/contact"] }],
      ] },
      contactPage("Réponse sous 24 heures ouvrées.", "Parlons de votre été", ["Envoyer", "/contact"], "Chemin des Libellules, 74000 Annecy", "Âge de l'enfant, semaines souhaitées."),
    ],
  },
];
