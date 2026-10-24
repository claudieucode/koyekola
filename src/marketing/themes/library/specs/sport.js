// Sport, fitness et coaching (4 thèmes). Textes de DÉMONSTRATION : clubs, coachs et coordonnées fictifs, remplaçables dans l'éditeur.
const contactPage = (sub, title, cta, mapAddress, formIntro) => ({
  key: "contact", name: "Contact", blocks: [
    ["misc:pagehead", { title: "Contact", sub }],
    ["contact:info", { title, formTitle: "Écrivez-nous", formIntro, cta }],
    ["contact:map", { title: "Nous trouver", mapAddress }],
  ],
});

module.exports = [
  // 1. Crossfit (sombre)
  {
    key: "ironcrest-box", name: "Ironcrest", category: "sport", tags: ["sombre", "audacieux"], siteType: "Box de crossfit",
    description: "Box de crossfit brute : noir charbon, rouge signal, titres condensés en capitales, planning des WOD et tarifs sans détour.",
    brand: "Ironcrest Box",
    tokens: { colors: { primary: "#e5322d", secondary: "#0b0b0d", accent: "#ffb400", background: "#121214", surface: "#1c1c20", text: "#f4f4f5", muted: "#b0b0b8" }, fonts: { heading: "font.barlow", body: "font.inter", button: "font.barlow", link: "font.inter" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 800, lineHeight: 0.98, letterSpacing: 0, transform: "uppercase" }, h2: { size: 44, weight: 800, transform: "uppercase" } }, border: { width: 1, color: "#34343c" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "ironcrest", motifs: ["halftone", "rays", "plates"] },
    head: ["head:dark", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Programmes", "/programmes"], ["Coachs", "/coachs"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Séance d'essai", "/contact"],
    contact: { address: "Zone des Forges, 18 rue de l'Enclume, 42000 Saint-Étienne", phone: "04 77 31 08 66", email: "box@ironcrest.example", hours: "Lundi – vendredi, 6 h – 21 h · Samedi, 9 h – 13 h", tagline: "Plus fort aujourd'hui qu'hier." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Box de crossfit · Saint-Étienne", title: "Forgez votre force.", sub: "Cours collectifs coachés, séances de 60 minutes, tous niveaux. Pas de miroir, pas de chichis : du travail.", cta: ["Séance d'essai offerte", "/contact"], cta2: ["Voir le planning", "/programmes"] }],
        ["misc:marquee", { items: ["WOD du jour à 6 h, 12 h et 18 h 30", "Séance d'essai offerte", "Coachs certifiés", "Plus de 400 membres"] }],
        ["feat:strips", { eyebrow: "Nos programmes", title: "Choisissez votre combat", items: [{ t: "Crossfit tous niveaux", x: "Mouvements fonctionnels, haltérophilie et gymnastique, mis à l'échelle de chacun." }, { t: "Haltérophilie", x: "Arraché, épaulé-jeté et technique de barre avec un coach dédié." }, { t: "Cardio HIIT", x: "Trente minutes pour tout donner, deux fois par semaine." }, { t: "Mobilité et récupération", x: "Étirements guidés pour durer." }] }],
        ["proof:stats", { items: [["400", "membres actifs"], ["12", "créneaux par jour"], ["6", "coachs certifiés"]] }],
        ["proof:big", { items: [{ q: "J'ai soulevé deux fois mon poids de corps en un an, et les coachs adaptent tout, même quand on débute à 45 ans.", n: "Romain D.", r: "membre, client fictif" }] }],
        ["cta:band", { title: "Votre première séance est offerte.", sub: "Venez avec des chaussures propres et l'envie d'essayer.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "programmes", name: "Programmes", blocks: [
        ["misc:pagehead", { title: "Programmes et planning" }],
        ["misc:schedule", { title: "Un jour type", items: [{ d: "6 h", t: "WOD du matin", x: "Pour les lève-tôt, 12 places." }, { d: "12 h 15", t: "Express 45", x: "Un entraînement court pour la pause." }, { d: "18 h 30", t: "WOD du soir", x: "Le créneau le plus animé." }, { d: "19 h 45", t: "Haltérophilie", x: "Technique et force, sur inscription." }] }],
        ["feat:tabs", { title: "Niveaux", items: [{ t: "Débutant", x: "Quatre séances d'initiation obligatoires pour apprendre les mouvements en sécurité." }, { t: "Intermédiaire", x: "Charges plus lourdes, enchaînements, gymnastique de base." }, { t: "Confirmé", x: "Préparation aux compétitions régionales." }] }],
        ["cta:split", { title: "Pas sûr de votre niveau ?", sub: "Le coach vous évalue lors de la séance d'essai.", cta: ["Réserver mon essai", "/contact"] }],
      ] },
      { key: "coachs", name: "Coachs", blocks: [
        ["misc:pagehead", { title: "L'équipe de coachs" }],
        ["proof:team", { items: [{ n: "Boris Vanhove", r: "Head coach, haltérophilie" }, { n: "Nina Castellane", r: "Coach, gymnastique" }, { n: "Mathis Roux", r: "Coach, cardio" }, { n: "Awa Sylla", r: "Coach, mobilité" }] }],
        ["misc:story", { eyebrow: "L'état d'esprit", title: "Tous différents, même effort", paras: ["Ironcrest est né dans un ancien atelier de métallurgie. On y a gardé la brique, le bruit des barres et l'idée qu'on progresse ensemble.", "Chaque séance est mise à l'échelle : même programme, charges adaptées."], image: "portrait-1" }],
        ["feat:numbered", { title: "Nos règles", items: [{ t: "Technique d'abord", x: "On ajoute du poids quand le geste est propre." }, { t: "Respect", x: "Pas de comparaison, seulement des progrès." }, { t: "Régularité", x: "Trois séances par semaine suffisent." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "3 séances / sem.", price: "69 €", period: "par mois", f: ["Accès aux WOD", "Suivi coach", "Sans engagement"], cta: "Choisir", url: "/contact" }, { t: "Illimité", price: "89 €", period: "par mois", f: ["Tous les créneaux", "Haltérophilie incluse", "Bilan trimestriel"], cta: "Choisir", url: "/contact", hl: true }, { t: "Carnet 10", price: "120 €", f: ["10 séances", "Valable 4 mois"], cta: "Choisir", url: "/contact" }] }],
        ["feat:compare", { title: "Ce qui est inclus", rows: [["", "3 séances", "Illimité", "Carnet 10"], ["WOD collectifs", "oui", "oui", "oui"], ["Haltérophilie", "non", "oui", "non"], ["Bilan trimestriel", "non", "oui", "non"]] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Faut-il être en forme ?", x: "Non, vous le deviendrez. Tous les mouvements sont adaptables." }, { t: "Puis-je suspendre mon abonnement ?", x: "Oui, jusqu'à deux mois par an avec justificatif." }] }],
      ] },
      contactPage("Passez à la box : le café est offert.", "Rejoignez la box", ["Séance d'essai", "/contact"], "18 rue de l'Enclume, 42000 Saint-Étienne", "Précisez votre expérience sportive et vos disponibilités."),
    ],
  },

  // 2. Yoga
  {
    key: "souffle-yoga", name: "Souffle", category: "sport", tags: ["minimaliste", "naturel"], siteType: "Studio de yoga",
    description: "Studio de yoga apaisé : sauge, sable et brun doux, grandes respirations, serif délicat et mise en page centrée pour inviter au calme.",
    brand: "Studio Souffle",
    tokens: { colors: { primary: "#5f7a62", secondary: "#2e3b30", accent: "#c98a6b", background: "#f6f2ea", surface: "#fffdf8", text: "#2b3027", muted: "#5f6659" }, fonts: { heading: "font.eb-garamond", body: "font.jost", button: "font.jost", link: "font.jost" }, radius: { sm: 8, md: 16, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.1, letterSpacing: -0.01 }, h2: { size: 40, weight: 400 }, body: { size: 18 } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "pill" }, art: { seed: "souffle", motifs: ["botanical", "arches", "dunes"] },
    head: ["head:center", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Cours", "/cours"], ["Professeures", "/professeures"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver un cours", "/contact"],
    contact: { address: "6 impasse des Glycines, 34000 Montpellier", phone: "04 67 55 12 90", email: "namaste@souffle.example", hours: "Lundi – samedi, 8 h – 20 h 30", tagline: "Respirer, s'étirer, revenir à soi." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Studio de yoga à Montpellier", title: "Respirez. Il y a de la place.", sub: "Hatha, vinyasa et yin dans un studio lumineux, en petits groupes de douze.", cta: ["Réserver un cours", "/contact"], cta2: ["Voir les cours", "/cours"] }],
        ["feat:list2", { eyebrow: "Au programme", title: "Une pratique pour chaque moment", items: [{ t: "Hatha doux, réveil en douceur" }, { t: "Vinyasa, énergie et fluidité" }, { t: "Yin, étirements profonds" }, { t: "Yoga prénatal" }, { t: "Méditation guidée" }, { t: "Yoga sur chaise" }] }],
        ["feat:alt", { title: "Trois façons de pratiquer", items: [{ t: "Cours collectifs", x: "Du lundi au samedi, du matin au soir, pour tous les niveaux.", link: ["Voir le planning", "/cours"] }, { t: "Séances privées", x: "Un accompagnement sur mesure pour gérer le dos, le stress ou la grossesse.", link: ["En savoir plus", "/contact"] }] }],
        ["gal:wall", { title: "Dans le studio", items: [{ t: "Salle principale" }, { t: "Coin thé" }, { t: "Jardin" }, { t: "Boutique de coussins" }] }],
        ["proof:big", { items: [{ q: "Pour la première fois depuis des années, mon dos et ma tête ont arrêté de se disputer.", n: "Hélène G.", r: "élève fictive" }] }],
        ["price:tiers", { title: "Tarifs simples", items: [{ t: "Cours à l'unité", price: "16 €", f: ["Tapis prêté", "Sans engagement"], cta: "Réserver", url: "/contact" }, { t: "Carte 10 cours", price: "130 €", f: ["Valable 5 mois"], cta: "Réserver", url: "/contact", hl: true }, { t: "Illimité", price: "79 €", period: "par mois", f: ["Tous les cours", "Un atelier par mois"], cta: "Réserver", url: "/contact" }] }],
        ["cta:card", { title: "Premier cours à moitié prix.", sub: "Pour découvrir le studio.", cta: ["J'en profite", "/contact"] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Cours et planning" }],
        ["misc:schedule", { title: "Semaine type", items: [{ d: "Lun. 8 h", t: "Hatha doux", x: "Réveil articulaire." }, { d: "Mar. 12 h 30", t: "Vinyasa express", x: "45 minutes dynamiques." }, { d: "Mer. 19 h", t: "Yin et méditation", x: "Postures tenues, respiration lente." }, { d: "Sam. 10 h", t: "Atelier famille", x: "Parents et enfants dès 6 ans." }] }],
        ["feat:accordion", { title: "Avant votre premier cours", items: [{ t: "Que dois-je apporter ?", x: "Une tenue souple. Tapis, briques et sangles sont prêtés." }, { t: "Quel niveau ?", x: "Aucun prérequis : chaque cours propose des variantes." }, { t: "Puis-je venir enceinte ?", x: "Oui, au cours prénatal du jeudi ou en séance privée." }] }],
        ["cta:band", { title: "Les cours du soir se remplissent vite.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "professeures", name: "Professeures", blocks: [
        ["misc:pagehead", { title: "Les professeures" }],
        ["proof:team", { items: [{ n: "Maëlle Auvray", r: "Fondatrice, hatha et yin" }, { n: "Sunita Rao", r: "Vinyasa et méditation" }, { n: "Clara Benoît", r: "Yoga prénatal" }] }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Un studio né d'une pause", paras: ["Maëlle a ouvert le studio après dix ans de métier dans la logistique, avec l'envie d'un lieu où personne n'a rien à prouver.", "Les cours sont limités à douze personnes pour que chaque posture soit ajustée."], image: "portrait-2" }],
        ["misc:quote", { text: "Le yoga commence quand on arrête de se comparer.", by: "Maëlle Auvray" }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et abonnements" }],
        ["feat:pricelist", { items: [{ t: "Cours collectif", price: "16 €", x: "1 heure" }, { t: "Séance privée", price: "70 €", x: "1 heure, à domicile ou au studio" }, { t: "Atelier du dimanche", price: "35 €", x: "2 h 30, thème du mois" }, { t: "Retraite d'un week-end", price: "290 €", x: "En Cévennes, pension complète" }] }],
        ["price:tiers", { items: [{ t: "Mensuel", price: "79 €", period: "par mois", f: ["Cours illimités", "Résiliable à tout moment"], cta: "S'abonner", url: "/contact" }, { t: "Annuel", price: "720 €", period: "par an", f: ["Un mois offert", "Un atelier par mois"], cta: "S'abonner", url: "/contact", hl: true }] }],
        ["cta:split", { title: "Une question sur les formules ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      contactPage("Une tisane vous attend à l'accueil.", "Venez respirer avec nous", ["Réserver un cours", "/contact"], "6 impasse des Glycines, 34000 Montpellier", "Dites-nous quel cours vous tente."),
    ],
  },

  // 3. Club de running
  {
    key: "foulee-club", name: "Foulée", category: "sport", tags: ["moderne", "ludique", "audacieux"], siteType: "Club de running",
    description: "Club de running dynamique : bleu électrique et vert fluo sur blanc, typographie large, compte à rebours de la prochaine course et plans d'entraînement.",
    brand: "Foulée Running Club",
    tokens: { colors: { primary: "#1f3dff", secondary: "#0a1240", accent: "#b6f23a", background: "#f6f8ff", surface: "#ffffff", text: "#0d1236", muted: "#4f5688" }, fonts: { heading: "font.unbounded", body: "font.manrope", button: "font.unbounded", link: "font.manrope" }, radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 22 }, shadow: { card: "md", button: "md" }, type: { h1: { size: 46, weight: 700, lineHeight: 1.1, letterSpacing: -0.03 }, h2: { size: 32, weight: 600, letterSpacing: -0.02 } }, buttons: { paddingY: 14, paddingX: 30 } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "foulee", motifs: ["ribbons", "rays", "mountains"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "Les sorties de la semaine, dans votre boîte", sub: "Parcours, dates de courses et conseils de nos coachs.", button: "Je m'inscris" }],
    menu: [["Accueil", "/"], ["Entraînements", "/entrainements"], ["Courses", "/courses"], ["Adhésion", "/adhesion"], ["Contact", "/contact"]], cta: ["Rejoindre le club", "/contact"],
    contact: { address: "Stade de la Prairie, 12 chemin des Berges, 44100 Nantes", phone: "02 40 12 78 03", email: "club@foulee.example", hours: "Entraînements : mardi, jeudi 19 h · dimanche 9 h", tagline: "Courir ensemble, aller plus loin." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Prochain rendez-vous · Semi de la Loire", title: "On court ensemble, on arrive ensemble.", sub: "Le club de running qui accueille les débutants comme les marathoniens, trois fois par semaine.", stats: [["210","licenciés"],["14","courses par an"],["3","groupes"]], cta: ["Rejoindre le club", "/contact"], cta2: ["Les entraînements", "/entrainements"] }],
        ["feat:bento", { eyebrow: "Trois groupes", title: "À chacun son allure", items: [{ icon: "activity", t: "Premiers pas", x: "Alternance marche et course, 5 km en 10 semaines." }, { icon: "trendingUp", t: "Progression", x: "Fractionné, côtes et sorties longues en 5 min/km." }, { icon: "trophy", t: "Performance", x: "Plans spécifiques pour 10 km, semi et marathon." }] }],
        ["feat:steps", { title: "Une semaine type", items: [{ t: "Mardi", x: "Fractionné sur piste.", d: "19 h" }, { t: "Jeudi", x: "Côtes et renforcement.", d: "19 h" }, { t: "Dimanche", x: "Sortie longue sur les berges.", d: "9 h" }] }],
        ["gal:strip", { title: "Au fil des foulées", items: [{ t: "Trail des Marais" }, { t: "10 km de nuit" }, { t: "Sortie dominicale" }, { t: "Relais du Muguet" }, { t: "Remise de médailles" }] }],
        ["proof:statsbar", { items: [["210", "licenciés"], ["14", "courses par an"], ["3", "groupes de niveau"]] }],
        ["cta:split", { title: "Venez courir avec nous mardi.", sub: "Deux séances d'essai, tenue de sport suffisante.", cta: ["Essayer", "/contact"] }],
      ] },
      { key: "entrainements", name: "Entraînements", blocks: [
        ["misc:pagehead", { title: "Entraînements" }],
        ["misc:schedule", { items: [{ d: "Mardi 19 h", t: "Piste et fractionné", x: "Stade de la Prairie, trois groupes." }, { d: "Jeudi 19 h", t: "Côtes et gainage", x: "Parc de Procé puis renforcement." }, { d: "Dim. 9 h", t: "Sortie longue", x: "Entre 10 et 25 km selon le plan." }] }],
        ["feat:icons", { title: "Ce que nous apportons", items: [{ icon: "users", t: "Coachs diplômés", x: "Séances préparées et ajustées." }, { icon: "heart", t: "Suivi de la forme", x: "Bilan, échauffements et prévention." }, { icon: "mapPin", t: "Parcours balisés", x: "Dix itinéraires dans la métropole." }] }],
        ["feat:accordion", { title: "Pour débuter", items: [{ t: "Quel équipement ?", x: "Une paire de chaussures de running et une tenue adaptée à la météo." }, { t: "Faut-il un certificat ?", x: "Oui, un certificat médical datant de moins d'un an est exigé pour la licence (exemple)." }] }],
      ] },
      { key: "courses", name: "Courses", blocks: [
        ["misc:pagehead", { title: "Calendrier des courses" }],
        ["gal:cards", { items: [{ t: "Semi de la Loire", tag: "18 avril", x: "21,1 km, départ des quais." }, { t: "Trail des Marais", tag: "13 juin", x: "25 km en sous-bois." }, { t: "10 km de nuit", tag: "9 octobre", x: "Parcours éclairé en centre-ville." }] }],
        ["proof:quotes", { items: [{ q: "Mon premier semi avec le groupe, je l'ai fini en souriant.", n: "Pauline E.", r: "Licenciée, cliente fictive" }, { q: "Le club m'a fait passer de 55 à 48 minutes au 10 km.", n: "Stéphane N.", r: "Licencié, client fictif" }, { q: "Ambiance familiale et exigeante.", n: "Leïla F.", r: "Licenciée, cliente fictive" }] }],
        ["cta:band", { title: "Besoin d'un dossard ?", sub: "Nous groupons les inscriptions.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "adhesion", name: "Adhésion", blocks: [
        ["misc:pagehead", { title: "Adhésion" }],
        ["price:tiers", { items: [{ t: "Adulte", price: "120 €", period: "par an", f: ["3 séances par semaine", "Licence incluse", "Maillot du club"], cta: "Adhérer", url: "/contact", hl: true }, { t: "Étudiant", price: "75 €", period: "par an", f: ["Mêmes séances", "Licence incluse"], cta: "Adhérer", url: "/contact" }, { t: "Famille", price: "210 €", period: "par an", f: ["Deux adultes", "Un enfant offert"], cta: "Adhérer", url: "/contact" }] }],
        ["feat:checks", { title: "L'adhésion comprend", cta: ["S'inscrire", "/contact"], items: [{ t: "Séances coachées toute l'année" }, { t: "Licence fédérale" }, { t: "Accès aux sorties de week-end" }, { t: "Tarifs préférentiels sur les courses" }] }],
        ["feat:compare", { title: "Compare nos formules", rows: [["", "Adulte", "Étudiant", "Famille"], ["Séances", "3", "3", "3"], ["Licence", "oui", "oui", "oui"], ["Maillot", "oui", "non", "oui"]] }],
      ] },
      contactPage("Retrouvez-nous au stade avant l'entraînement.", "Venez courir", ["Rejoindre le club", "/contact"], "12 chemin des Berges, 44100 Nantes", "Dites-nous quel est votre niveau et vos objectifs."),
    ],
  },

  // 4. Salle d'escalade
  {
    key: "prise-directe", name: "Prise Directe", category: "sport", tags: ["geometrique", "technique", "naturel"], siteType: "Salle d'escalade",
    description: "Salle d'escalade en bloc et en voie : orange rocher et gris ardoise, compositions en mosaïque, onglets de pratiques et tableau comparatif des abonnements.",
    brand: "Prise Directe",
    tokens: { colors: { primary: "#c44d12", secondary: "#262b31", accent: "#2b8a8f", background: "#f2eee8", surface: "#ffffff", text: "#23262b", muted: "#5c5f66" }, fonts: { heading: "font.archivo", body: "font.dm-sans", button: "font.archivo", link: "font.dm-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.02, letterSpacing: -0.02, transform: "uppercase" } }, border: { width: 1, color: "#d6cfc4" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "prisedirecte", motifs: ["mountains", "topo", "tiles"] },
    head: ["head:topbar", { info: "Ouvert 7 j/7 · Bloc, voies et pan 14 m", note: "Mardi : soirée nocturne jusqu'à 23 h" }], foot: ["foot:columns", { about: "Salle d'escalade de bloc et de voie (exemple) : 1 200 m² de surface, cours, anniversaires et espace détente.", cols: [["La salle", "Pratiques", "Tarifs", "Contact"], ["Infos", "Horaires", "Règlement", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Pratiques", "/pratiques"], ["Cours", "/cours"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver un créneau", "/contact"],
    contact: { address: "Halle Eiffel, 3 quai de la Grue, 38000 Grenoble", phone: "04 76 20 18 52", email: "salle@prise-directe.example", hours: "Lun – ven 10 h – 23 h · Sam – dim 9 h – 20 h", tagline: "Grimpez, vous allez voir la vue." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Salle d'escalade à Grenoble", title: "Prenez de la hauteur.", sub: "1 200 m² de blocs et de voies jusqu'à 14 mètres, de la découverte à la compétition, avec un espace détente et un café.", cta: ["Réserver un créneau", "/contact"], cta2: ["Les pratiques", "/pratiques"], overlay: 0.45 }],
        ["feat:tabs", { eyebrow: "Pratiques", title: "Une salle, trois univers", items: [{ t: "Bloc", x: "Plus de 200 blocs renouvelés chaque mois, du niveau initiation au 7c, sur sols amortissants." }, { t: "Voie", x: "Seize lignes de 14 mètres avec assurage automatique ou en tête." }, { t: "Enfants", x: "Une zone ludique, des cours dès 5 ans et des anniversaires encadrés." }] }],
        ["gal:masonry", { title: "Dans la salle", items: [{ t: "Pan principal" }, { t: "Zone de bloc" }, { t: "Espace détente" }, { t: "Cours enfants" }, { t: "Soirée nocturne" }] }],
        ["proof:stats", { items: [["1 200 m²", "de surface de grimpe"], ["200", "blocs ouverts"], ["16", "voies de 14 m"]] }],
        ["feat:compare", { title: "Quel abonnement ?", rows: [["", "Entrée", "Mensuel", "Annuel"], ["Accès bloc et voie", "oui", "oui", "oui"], ["Location chaussons", "payant", "incluse", "incluse"], ["Invité offert", "non", "non", "oui"]] }],
        ["cta:image", { title: "Première séance avec un moniteur.", sub: "Initiation de 90 minutes, matériel inclus.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "pratiques", name: "Pratiques", blocks: [
        ["misc:pagehead", { title: "Bloc, voie et plus" }],
        ["feat:bento", { items: [{ icon: "layers", t: "Le bloc", x: "Sans corde, jusqu'à quatre mètres, sur matelas." }, { icon: "network", t: "La voie", x: "Cordes, baudrier et assurage : formation obligatoire." }, { icon: "users", t: "Le collectif", x: "Soirées, séances encadrées et sorties en falaise." }] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "10 h – 23 h"], ["Samedi – dimanche", "9 h – 20 h"], ["Mardi soir", "Nocturne jusqu'à 23 h 30"]] }],
        ["feat:accordion", { title: "Premiers pas", items: [{ t: "Faut-il savoir grimper ?", x: "Non, un moniteur vous accueille pour la première séance." }, { t: "Que prévoir ?", x: "Une tenue souple, un sac pour vos affaires. Chaussons à louer sur place." }] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Cours et stages" }],
        ["gal:coursecards", { items: [{ t: "Initiation bloc", tag: "Débutant", price: "28 €", x: "90 minutes avec moniteur.", cta: "Réserver", url: "/contact" }, { t: "Passeport voie", tag: "Débutant", price: "45 €", x: "Apprendre à assurer en sécurité.", cta: "Réserver", url: "/contact" }, { t: "Perfectionnement", tag: "Confirmé", price: "180 €", x: "Cycle de 6 séances.", cta: "Réserver", url: "/contact" }] }],
        ["proof:team", { title: "Moniteurs", items: [{ n: "Antoine Rochas", r: "Moniteur d'escalade" }, { n: "Maya Ferrier", r: "Cheffe d'ouvreurs" }, { n: "Louis Genet", r: "Coach performance" }] }],
        ["cta:band", { title: "Anniversaire en salle ?", sub: "Dès 6 ans, goûter inclus.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Entrée", price: "14 €", f: ["Bloc et voie", "Chaussons 4 €"], cta: "Réserver", url: "/contact" }, { t: "Mensuel", price: "49 €", period: "par mois", f: ["Accès illimité", "Chaussons inclus"], cta: "S'abonner", url: "/contact", hl: true }, { t: "Annuel", price: "490 €", period: "par an", f: ["Accès illimité", "Invité offert chaque mois"], cta: "S'abonner", url: "/contact" }] }],
        ["feat:list2", { title: "Réductions", items: [{ t: "Étudiants et moins de 18 ans" }, { t: "Demandeurs d'emploi" }, { t: "Carte famille" }, { t: "Groupes scolaires" }] }],
        ["cta:split", { title: "Besoin d'un devis groupe ?", cta: ["Écrire à l'équipe", "/contact"] }],
      ] },
      contactPage("Une équipe à l'accueil dès l'ouverture.", "Passez grimper", ["Réserver un créneau", "/contact"], "3 quai de la Grue, 38000 Grenoble", "Précisez le nombre de grimpeurs et la date souhaitée."),
    ],
  },
];
