// Santé / bien-être (lot B, 9 thèmes). Démonstration : structures, personnes et coordonnées fictives, sans promesse médicale ni thérapeutique.
const AVIS = "Ce site est une démonstration ; le bien-être ne se substitue pas à un avis médical.";
const F = (h, b) => ({ heading: h, body: b, button: b, link: b });

const THEMES = [
  // 1. Spa (sombre)
  {
    key: "onde-thermale", name: "Onde Thermale", category: "sante", tags: ["sombre", "luxe"], siteType: "Spa urbain avec bassin et soins", featured: true,
    description: "Spa en vert nuit et turquoise lumineux, serif élégant à fort contraste, bandeau plein cadre et carte de soins en liste de prix.",
    brand: "Spa Onde Thermale",
    tokens: { colors: { primary: "#5fd1c3", secondary: "#1d4a45", accent: "#e5c78a", background: "#0f2321", surface: "#163330", text: "#e8f3f1", muted: "#a9c4c0" }, fonts: F("font.cormorant-garamond", "font.archivo"), radius: { sm: 6, md: 10, lg: 16, button: 999, field: 10, card: 14 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 62, weight: 500, lineHeight: 1.05, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "pill" }, art: { seed: "onde-thermale", motifs: ["waves", "bokeh", "arches"] },
    head: ["head:float", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Soins", "/soins"], ["Le bassin", "/bassin"], ["Cartes cadeaux", "/cadeaux"], ["Contact", "/contact"]], cta: ["Réserver un soin", "/contact"],
    contact: { address: "8 quai des Tanneurs, 69002 Lyon", phone: "04 72 55 02 08", email: "reservation@onde-thermale.example", hours: "Tous les jours, 10 h – 21 h", tagline: "Le calme, à une heure de pause." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Spa urbain", title: "Une parenthèse d'eau chaude au cœur de la ville.", sub: "Bassin à 34 °C, hammam, salles de soins à la lumière tamisée : réservez une heure ou une demi-journée de calme.", cta: ["Réserver un soin", "/contact"], cta2: ["Voir les soins", "/soins"], overlay: 0.55 }],
        ["feat:bento", { eyebrow: "Les espaces", title: "Trois lieux pour ralentir", items: [{ t: "Le bassin chaud", x: "Eau à 34 °C, jets de nuque et banquettes immergées, accessible sur réservation.", icon: "sun" }, { t: "Le hammam", x: "Vapeur douce et gommage au savon noir.", icon: "sparkles" }, { t: "Les cabines", x: "Quatre salles de soins avec musique choisie.", icon: "moon" }] }],
        ["gal:featured", { title: "L'ambiance", items: [{ t: "Le bassin au crépuscule" }, { t: "Salle de repos" }, { t: "Huiles et serviettes chaudes" }, { t: "Tisanerie" }] }],
        ["feat:pricelist", { eyebrow: "Quelques rituels", title: "Extrait de la carte", items: [{ t: "Accès bassin et hammam (2 h)", x: "Peignoir et tisane inclus.", price: "38 €" }, { t: "Massage relaxant aux huiles (50 min)", x: "Pression douce, huile tiède.", price: "78 €" }, { t: "Soin visage éclat (45 min)", x: "Nettoyage, masque et massage du visage.", price: "69 €" }, { t: "Rituel duo (1 h 30)", x: "Bassin, massage côte à côte et thé.", price: "190 €" }] }],
        ["proof:big", { items: [{ q: "On y entre pressé et on en ressort avec le sentiment d'avoir pris une semaine de congés.", n: "Camille R.", r: "Cliente fictive" }] }],
        ["cta:image", { title: "Offrez un moment de calme", sub: "Cartes cadeaux valables un an, envoyées par e-mail. " + AVIS, cta: ["Voir les cartes cadeaux", "/cadeaux"] }],
      ] },
      { key: "soins", name: "Soins", blocks: [
        ["misc:pagehead", { title: "Les soins", sub: "Massages, soins du visage et rituels." }],
        ["feat:pricelist", { title: "Massages", items: [{ t: "Relaxant aux huiles tièdes (50 min)", price: "78 €" }, { t: "Dos et nuque (30 min)", price: "49 €" }, { t: "Pierres chaudes (1 h 15)", price: "105 €" }] }],
        ["feat:pricelist", { title: "Visage et corps", bg: "token:surface", items: [{ t: "Gommage corps au sucre (30 min)", price: "45 €" }, { t: "Soin visage éclat (45 min)", price: "69 €" }, { t: "Enveloppement aux algues (45 min)", price: "62 €" }] }],
        ["cta:band", { title: "Besoin d'un conseil sur le choix du soin ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "bassin", name: "Le bassin", blocks: [
        ["misc:pagehead", { title: "Bassin et hammam", sub: "Accès par créneaux de deux heures." }],
        ["misc:text", { eyebrow: "Bon à savoir", title: "Venir au spa", paras: ["Prévoyez maillot, bonnet de bain non obligatoire et sandales ; le peignoir est prêté. Les créneaux sont limités à douze personnes pour garder le lieu paisible.", "Les personnes enceintes ou suivant un traitement sont invitées à demander l'avis de leur médecin avant la venue."] }],
        ["misc:hours", { title: "Créneaux d'accès", rows: [["Matin", "10 h – 12 h"], ["Après-midi", "14 h – 16 h et 16 h – 18 h"], ["Soirée (nocturne)", "18 h – 21 h"]] }],
      ] },
      { key: "cadeaux", name: "Cartes cadeaux", blocks: [
        ["misc:pagehead", { title: "Cartes cadeaux", sub: "Un moment à offrir." }],
        ["price:tiers", { items: [{ t: "Escale", price: "45 €", x: "Un accès au bassin.", f: ["Bassin et hammam 2 h", "Tisane"], cta: ["Demander", "/contact"] }, { t: "Pause", price: "95 €", x: "Un soin au choix.", f: ["Massage 50 min", "Accès bassin 1 h"], cta: ["Demander", "/contact"], hl: true }, { t: "Duo", price: "190 €", x: "Un moment à deux.", f: ["Rituel duo 1 h 30", "Thé et douceurs"], cta: ["Demander", "/contact"] }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Comment recevoir la carte ?", x: "Par e-mail après confirmation de votre demande." }, { t: "Quelle est la durée de validité ?", x: "Douze mois à compter de la date d'achat." }, { t: "Peut-on la modifier ?", x: "Oui, le bénéficiaire choisit librement son créneau." }] }],
      ] },
    ],
  },
  // 2. Yoga
  {
    key: "asana-lune", name: "Asana Lune", category: "sante", tags: ["chaleureux", "naturel"], siteType: "Studio de yoga avec planning de cours",
    description: "Studio de yoga en terre cuite et sable, titres en sans géométrique fin, accueil en collage de visuels, planning de cours et formules claires.",
    brand: "Studio Asana Lune",
    tokens: { colors: { primary: "#b9482b", secondary: "#5b2a1c", accent: "#e0a458", background: "#fbf4ee", surface: "#ffffff", text: "#3a1f16", muted: "#6b4a3e" }, fonts: F("font.josefin-sans", "font.alegreya"), radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#ecd9ca" }, type: { h1: { size: 56, weight: 600, lineHeight: 1.08, letterSpacing: -0.01 }, body: { size: 18 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "pill" }, art: { seed: "asana-lune", motifs: ["blobs", "rays", "arches"] },
    head: ["head:minimal", {}],
    foot: ["foot:newsletter", { title: "Le planning dans votre boîte", sub: "Un message par semaine : cours, ateliers et places libres.", button: "Je m'inscris" }],
    menu: [["Accueil", "/"], ["Planning", "/planning"], ["Cours", "/cours"], ["Formules", "/formules"], ["Contact", "/contact"]], cta: ["Cours d'essai", "/contact"],
    contact: { address: "5 rue du Marché-aux-Fleurs, 31000 Toulouse", phone: "05 61 22 04 17", email: "bonjour@asana-lune.example", hours: "Lundi au samedi, 8 h – 21 h", tagline: "Respirer, bouger, se poser." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Studio de yoga", title: "Un tapis, une respiration, une heure à vous.", sub: "Hatha, vinyasa, yin et yoga prénatal dans un studio lumineux, pour débutants comme pour pratiquants réguliers.", cta: ["Réserver un cours d'essai", "/contact"], cta2: ["Voir le planning", "/planning"] }],
        ["feat:tabs", { eyebrow: "Les cours", title: "Un style pour chaque moment", items: [{ t: "Hatha", x: "Postures tenues, respiration lente, idéal pour débuter." }, { t: "Vinyasa", x: "Enchaînements fluides et plus dynamiques." }, { t: "Yin", x: "Postures longues au sol pour relâcher les tensions." }, { t: "Prénatal", x: "Séances douces pour les futures mamans, avec accord de votre suivi médical." }] }],
        ["misc:schedule", { title: "Une journée type au studio", items: [{ d: "8 h 00", t: "Hatha éveil", x: "Tous niveaux, 60 min." }, { d: "12 h 30", t: "Vinyasa express", x: "45 min pour la pause déjeuner." }, { d: "18 h 30", t: "Vinyasa", x: "Niveau intermédiaire, 75 min." }, { d: "20 h 00", t: "Yin et relaxation", x: "Pour finir la journée, 60 min." }] }],
        ["proof:quotes", { title: "Elles et ils pratiquent", items: [{ q: "Je n'ai jamais fait de yoga et on m'a guidée pas à pas dès la première séance.", n: "Léa V.", r: "Élève, cliente fictive" }, { q: "Le cours du soir est devenu mon rendez-vous de la semaine.", n: "Antoine G.", r: "Élève, client fictif" }] }],
        ["price:tiers", { items: [{ t: "Cours d'essai", price: "10 €", x: "Pour découvrir.", f: ["Un cours au choix", "Tapis prêté"], cta: ["Réserver", "/contact"] }, { t: "Carte 10 cours", price: "150 €", x: "Valable 6 mois.", f: ["Tous les cours", "Partage possible"], cta: ["Choisir", "/contact"], hl: true }, { t: "Illimité", price: "69 €", period: "/mois", x: "Sans engagement.", f: ["Cours à volonté", "Un atelier offert"], cta: ["Choisir", "/contact"] }] }],
        ["cta:split", { title: "Venez essayer, simplement", sub: "Arrivez 10 minutes avant le cours. " + AVIS, cta: ["Réserver un essai", "/contact"] }],
      ] },
      { key: "planning", name: "Planning", blocks: [
        ["misc:pagehead", { title: "Planning de la semaine", sub: "Réservation conseillée, 14 places par cours." }],
        ["misc:schedule", { title: "Lundi et mardi", items: [{ d: "Lun 8 h", t: "Hatha éveil", x: "Tous niveaux" }, { d: "Lun 18 h 30", t: "Vinyasa", x: "Intermédiaire" }, { d: "Mar 12 h 30", t: "Vinyasa express", x: "45 min" }, { d: "Mar 20 h", t: "Yin", x: "Tous niveaux" }] }],
        ["misc:schedule", { title: "Mercredi au samedi", items: [{ d: "Mer 10 h", t: "Prénatal", x: "Sur inscription" }, { d: "Jeu 18 h 30", t: "Hatha", x: "Débutants bienvenus" }, { d: "Ven 12 h 30", t: "Vinyasa express", x: "45 min" }, { d: "Sam 10 h", t: "Atelier respiration", x: "90 min, une fois par mois" }] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Nos cours", sub: "Choisissez selon votre énergie du jour." }],
        ["feat:cards", { items: [{ t: "Pour débuter", x: "Hatha et yin : rythme lent, explications détaillées.", icon: "sun" }, { t: "Pour bouger", x: "Vinyasa et flow : on se réchauffe et on transpire.", icon: "activity" }, { t: "Pour se poser", x: "Yin et relaxation guidée en fin de journée.", icon: "moon" }] }],
        ["feat:accordion", { title: "Avant de venir", items: [{ t: "Que dois-je apporter ?", x: "Une tenue souple et une petite bouteille d'eau ; tapis et briques sont prêtés." }, { t: "Peut-on pratiquer avec une blessure ?", x: "Prévenez l'enseignant avant le cours ; en cas de doute, demandez l'avis de votre médecin." }, { t: "Arriver en retard ?", x: "L'accès est fermé cinq minutes après le début, pour ne pas perturber la séance." }] }],
      ] },
      { key: "formules", name: "Formules", blocks: [
        ["misc:pagehead", { title: "Formules et tarifs" }],
        ["feat:compare", { title: "Comparer", rows: [["", "Carte 10 cours", "Illimité"], ["Validité", "6 mois", "Mensuel"], ["Ateliers", "En supplément", "1 offert par mois"], ["Engagement", "Aucun", "Aucun"]] }],
        ["cta:card", { title: "Une question sur les formules ?", cta: ["Nous contacter", "/contact"] }],
      ] },
    ],
  },
  // 3. Diététicienne
  {
    key: "assiette-claire", name: "Assiette Claire", category: "sante", tags: ["moderne", "naturel"], siteType: "Cabinet de diététicienne-nutritionniste", isNew: true,
    description: "Cabinet de diététicienne en vert feuille et orange vif, serif lisible et corps arrondi, bandeau empilé avec chiffres et parcours de suivi en étapes.",
    brand: "Assiette Claire, diététique",
    tokens: { colors: { primary: "#3f7d20", secondary: "#24400f", accent: "#f08a24", background: "#f8fbef", surface: "#ffffff", text: "#1f2e12", muted: "#4f5f3c" }, fonts: F("font.literata", "font.lexend"), radius: { sm: 6, md: 10, lg: 14, button: 10, field: 8, card: 12 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#dbe8c2" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.015 }, body: { size: 16 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "assiette-claire", motifs: ["botanical", "objects", "tiles"] },
    head: ["head:bar", {}],
    foot: ["foot:columns", { about: "Consultations de diététique à Rennes et en visioconférence, sans régime miracle.", cols: [["Cabinet", "Consultations", "Méthode", "Tarifs"], ["Contact", "Rendez-vous", "Questions", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Consultations", "/consultations"], ["Ma méthode", "/methode"], ["Tarifs", "/tarifs"], ["Le blog", "/blog"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "27 rue de la Motte, 35000 Rennes", phone: "02 99 14 07 31", email: "cabinet@assiette-claire.example", hours: "Mardi au vendredi, 9 h – 18 h", tagline: "Manger mieux, sans culpabiliser." },
    social: ["instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Diététicienne-nutritionniste", title: "Retrouver une alimentation qui vous ressemble.", sub: "Rééquilibrage alimentaire, nutrition du sportif, alimentation de la femme enceinte : un suivi à votre rythme, sans interdits ni pesée obligatoire.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Les consultations", "/consultations"], stats: [["45 min", "par consultation"], ["Cabinet", "ou visio"], ["6 mois", "suivi type"]] }],
        ["feat:steps", { eyebrow: "Le suivi", title: "Comment ça se passe", items: [{ t: "Bilan initial", x: "Habitudes, rythme de vie, goûts et objectifs.", d: "1re séance" }, { t: "Plan sur mesure", x: "Repères simples, idées de menus, liste de courses.", d: "Semaine 1" }, { t: "Ajustements", x: "On adapte selon ce qui marche dans votre quotidien.", d: "Chaque mois" }, { t: "Autonomie", x: "Vous gardez les clés pour continuer seul(e).", d: "Fin du suivi" }] }],
        ["feat:compare", { title: "Deux formules de suivi", rows: [["", "Consultation seule", "Suivi 3 mois"], ["Séances", "1", "4"], ["Plan alimentaire", "Repères", "Détaillé et ajusté"], ["Contact entre séances", "Non", "Messagerie"]] }],
        ["proof:statsbar", { items: [["60", "repas types fournis"], ["4", "séances en suivi"], ["100 %", "sur rendez-vous"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il être à jeun ?", x: "Non, venez comme d'habitude." }, { t: "Les consultations sont-elles remboursées ?", x: "Certaines mutuelles prennent en charge une partie ; une facture vous est remise." }, { t: "Proposez-vous des régimes ?", x: "Non, nous travaillons sur des habitudes durables." }] }],
        ["cta:card", { title: "Un premier échange ?", sub: AVIS, cta: ["Demander un rendez-vous", "/contact"] }],
      ] },
      { key: "consultations", name: "Consultations", blocks: [
        ["misc:pagehead", { title: "Consultations" }],
        ["feat:alt", { items: [{ t: "Rééquilibrage alimentaire", x: "Retrouver des repas réguliers et variés, à votre rythme." }, { t: "Nutrition du sportif", x: "Hydratation, collations et repas avant et après l'effort." }, { t: "Grossesse et allaitement", x: "Repères alimentaires et idées de repas, en complément du suivi médical." }] }],
        ["cta:band", { title: "Pas sûr(e) de la consultation adaptée ?", cta: ["Posez-moi la question", "/contact"] }],
      ] },
      { key: "methode", name: "Ma méthode", blocks: [
        ["misc:pagehead", { title: "Ma méthode" }],
        ["misc:story", { eyebrow: "Mon approche", title: "Pas de régime, des habitudes", paras: ["Je pars de ce que vous mangez déjà et de ce que vous aimez. Nous ajustons une chose à la fois, pour que les changements restent en place.", "Je travaille en lien avec votre médecin quand c'est utile."], image: "portrait-1" }],
        ["feat:checks", { title: "Ce que je m'engage à faire", items: [{ t: "Vous écouter sans jugement" }, { t: "Expliquer chaque conseil" }, { t: "Respecter votre budget" }], cta: ["Parlons-en", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["feat:pricelist", { items: [{ t: "Première consultation (60 min)", price: "65 €" }, { t: "Consultation de suivi (45 min)", price: "50 €" }, { t: "Suivi de 3 mois (4 séances)", price: "210 €" }, { t: "Visioconférence", x: "Même tarif.", price: "idem" }] }],
        ["misc:faq", { items: [{ t: "Comment régler ?", x: "Par chèque, espèces ou virement." }, { t: "Annulation", x: "Merci de prévenir 24 h avant." }] }],
      ] },
      { key: "blog", name: "Le blog", blocks: [
        ["misc:pagehead", { title: "Le blog", sub: "Conseils et recettes simples." }],
        ["misc:posts", { title: "Derniers articles", count: 6, layout: "grid" }],
        ["cta:band", { title: "Recevez les recettes du mois", cta: ["Me contacter", "/contact"] }],
      ] },
    ],
  },
  // 4. Naturopathe
  {
    key: "racine-sauge", name: "Racine & Sauge", category: "sante", tags: ["naturel", "editorial"], siteType: "Cabinet de naturopathie et conseils d'hygiène de vie",
    description: "Cabinet de naturopathie en vert forêt sur crème, serif éditorial, fond secondaire en bandeau, ateliers et blog de saison.",
    brand: "Racine & Sauge, naturopathie",
    tokens: { colors: { primary: "#2f6b4f", secondary: "#1d3a2d", accent: "#c98b2b", background: "#f4f1e8", surface: "#fbf9f3", text: "#25302a", muted: "#55605a" }, fonts: F("font.spectral", "font.schibsted-grotesk"), radius: { sm: 4, md: 6, lg: 10, button: 4, field: 4, card: 8 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d3c0" }, type: { h1: { size: 52, weight: 600, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "racine-sauge", motifs: ["botanical", "topo", "plates"] },
    head: ["head:topbar", { info: "Consultations à Grenoble et en visio", note: "Atelier de saison le premier samedi du mois" }],
    foot: ["foot:big", { title: "Racine & Sauge" }],
    menu: [["Accueil", "/"], ["Accompagnement", "/accompagnement"], ["Ateliers", "/ateliers"], ["Journal", "/journal"], ["Contact", "/contact"]], cta: ["Réserver un bilan", "/contact"],
    contact: { address: "3 chemin des Herbes, 38000 Grenoble", phone: "04 76 33 09 25", email: "contact@racine-sauge.example", hours: "Lundi, mercredi, jeudi, 9 h – 17 h", tagline: "Hygiène de vie, au fil des saisons." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Naturopathie", title: "Des habitudes simples, au rythme des saisons.", sub: "Bilan de vitalité, conseils d'alimentation, de sommeil et de gestion du stress. Une approche d'accompagnement qui ne remplace ni un diagnostic ni un traitement médical.", cta: ["Réserver un bilan", "/contact"], cta2: ["Découvrir", "/accompagnement"] }],
        ["feat:icons", { title: "Trois piliers", items: [{ t: "Alimentation", x: "Repas variés, de saison, et conseils pratiques.", icon: "heart" }, { t: "Sommeil et rythme", x: "Routines du soir et du matin réalistes.", icon: "moon" }, { t: "Gestion du stress", x: "Respiration, marche, temps pour soi.", icon: "sun" }] }],
        ["feat:alt", { eyebrow: "Le bilan", title: "Une première séance de 1 h 30", items: [{ t: "On fait le point", x: "Questionnaire sur vos habitudes, énergie et sommeil." }, { t: "On choisit trois priorités", x: "Quelques actions simples, pas un programme de quarante règles." }] }],
        ["misc:quote", { text: "Prendre soin de soi commence rarement par un grand changement, plutôt par un petit geste répété.", by: "Hélène Rivoire, naturopathe fictive" }],
        ["misc:posts", { title: "Au journal", count: 3, layout: "list" }],
        ["cta:band", { title: "Prête ou prêt à commencer ?", sub: AVIS, cta: ["Réserver un bilan", "/contact"] }],
      ] },
      { key: "accompagnement", name: "Accompagnement", blocks: [
        ["misc:pagehead", { title: "L'accompagnement", sub: "Un suivi en trois temps." }],
        ["feat:rows", { items: [{ t: "Bilan de vitalité (1 h 30)", x: "Échange approfondi, choix des priorités." }, { t: "Suivi à 3 semaines (45 min)", x: "Ce qui marche, ce qu'on ajuste." }, { t: "Suivi à 3 mois (45 min)", x: "Ancrage des habitudes et prochaines étapes." }] }],
        ["feat:list2", { title: "Thèmes abordés", items: [{ t: "Alimentation de saison" }, { t: "Hydratation" }, { t: "Rythme du sommeil" }, { t: "Activité douce" }, { t: "Gestion du stress" }, { t: "Routines de rentrée" }] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ["misc:pagehead", { title: "Ateliers collectifs" }],
        ["gal:cards", { items: [{ t: "Cuisiner les légumes d'hiver", tag: "Atelier", x: "Samedi, 3 heures, dégustation." }, { t: "Tisanes et plantes du quotidien", tag: "Atelier", x: "Découverte et préparation." }, { t: "Sommeil : routines du soir", tag: "Conférence", x: "1 h 30, questions-réponses." }] }],
        ["cta:card", { title: "S'inscrire à un atelier", cta: ["Écrire au cabinet", "/contact"] }],
      ] },
      { key: "journal", name: "Journal", blocks: [
        ["misc:pagehead", { title: "Le journal" }],
        ["misc:posts", { title: "Articles", count: 6, layout: "grid" }],
        ["cta:band", { title: "Une idée d'article ?", cta: ["Me l'envoyer", "/contact"] }],
      ] },
    ],
  },
  // 5. Institut de beauté
  {
    key: "maison-pivoine", name: "Maison Pivoine", category: "sante", tags: ["luxe", "editorial"], siteType: "Institut de beauté et soins du visage",
    description: "Institut de beauté en rose pivoine et or doux, grands titres Didone, accueil éditorial, galerie en mosaïque et carte des soins.",
    brand: "Maison Pivoine",
    tokens: { colors: { primary: "#b8265f", secondary: "#5a1236", accent: "#d9a441", background: "#fff5f8", surface: "#ffffff", text: "#3b1426", muted: "#6e4a5a" }, fonts: F("font.bodoni-moda", "font.work-sans"), radius: { sm: 2, md: 4, lg: 8, button: 2, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#f2d6e0" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.02, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "maison-pivoine", motifs: ["ribbons", "halftone", "plates"] },
    head: ["head:split", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Les soins", "/soins"], ["Le salon", "/salon"], ["Forfaits", "/forfaits"], ["Contact", "/contact"]], cta: ["Réserver", "/contact"],
    contact: { address: "19 place des Carmes, 33000 Bordeaux", phone: "05 56 90 12 63", email: "institut@maison-pivoine.example", hours: "Mardi au samedi, 9 h 30 – 19 h", tagline: "L'éclat, avec délicatesse." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Institut de beauté", title: "Prendre soin de sa peau, sans se presser.", sub: "Soins du visage, beauté des mains et des pieds, épilations et maquillage de fête, dans un salon de poche au centre de Bordeaux.", cta: ["Réserver un soin", "/contact"] }],
        ["gal:masonry", { title: "L'univers de la maison", items: [{ t: "Cabine visage" }, { t: "Vernis et teintes" }, { t: "Produits de soin" }, { t: "Le salon" }, { t: "Maquillage de fête" }] }],
        ["feat:pricelist", { eyebrow: "La carte", title: "Soins les plus demandés", items: [{ t: "Soin visage éclat (1 h)", x: "Diagnostic, gommage, masque, modelage.", price: "75 €" }, { t: "Beauté des mains avec pose de vernis", price: "42 €" }, { t: "Épilation sourcils et lèvres", price: "20 €" }, { t: "Maquillage de soirée (45 min)", price: "55 €" }] }],
        ["proof:quotes", { title: "Mots de clientes", items: [{ q: "Un accueil attentionné et des conseils honnêtes sur mes produits du quotidien.", n: "Sandrine M.", r: "Cliente fictive" }, { q: "Le maquillage tenait parfaitement toute la soirée de mariage.", n: "Inès L.", r: "Cliente fictive" }] }],
        ["cta:card", { title: "Offrez un moment à quelqu'un", sub: "Bons cadeaux sur demande. " + AVIS, cta: ["Demander un bon cadeau", "/contact"] }],
      ] },
      { key: "soins", name: "Les soins", blocks: [
        ["misc:pagehead", { title: "Les soins", sub: "Visage, mains, pieds, regard." }],
        ["feat:strips", { items: [{ t: "Soins du visage", x: "Nettoyage, éclat, modelage relaxant." }, { t: "Mains et pieds", x: "Limage, soin des cuticules, vernis classique ou semi-permanent." }, { t: "Regard", x: "Teinture, rehaussement et épilation des sourcils." }, { t: "Maquillage", x: "Jour, soirée, mariage avec essai." }] }],
        ["feat:pricelist", { bg: "token:surface", title: "Tarifs détaillés", items: [{ t: "Teinture des cils", price: "22 €" }, { t: "Rehaussement de cils", price: "58 €" }, { t: "Pose de vernis semi-permanent", price: "35 €" }, { t: "Beauté des pieds", price: "48 €" }] }],
      ] },
      { key: "salon", name: "Le salon", blocks: [
        ["misc:pagehead", { title: "Le salon" }],
        ["misc:story", { eyebrow: "L'institut", title: "Une maison à taille humaine", paras: ["Deux cabines, une équipe de deux esthéticiennes, des produits choisis pour la douceur de leur composition.", "Chaque soin commence par un échange sur votre peau et vos envies."], image: "portrait-1" }],
        ["misc:hours", { title: "Horaires", rows: [["Mardi – Vendredi", "9 h 30 – 19 h"], ["Samedi", "9 h – 17 h"], ["Dimanche – Lundi", "Fermé"]] }],
      ] },
      { key: "forfaits", name: "Forfaits", blocks: [
        ["misc:pagehead", { title: "Forfaits" }],
        ["price:tiers", { items: [{ t: "Éclat", price: "130 €", x: "Visage et mains.", f: ["Soin visage 1 h", "Beauté des mains"], cta: ["Réserver", "/contact"] }, { t: "Mariée", price: "190 €", x: "Essai et jour J.", f: ["Essai maquillage", "Maquillage du jour", "Retouches"], cta: ["Réserver", "/contact"], hl: true }, { t: "Duo", price: "220 €", x: "À deux.", f: ["Deux soins visage", "Thé offert"], cta: ["Réserver", "/contact"] }] }],
        ["cta:band", { title: "Une demande particulière ?", cta: ["Nous écrire", "/contact"] }],
      ] },
    ],
  },
  // 6. Masseur
  {
    key: "paume-ambre", name: "Paume d'Ambre", category: "sante", tags: ["chaleureux", "minimaliste"], siteType: "Praticien en massages bien-être",
    description: "Praticien de massages bien-être en ocre doré sur lin, sans serif aérien à fort empattement visuel, navigation latérale et séances présentées en bandes.",
    brand: "Paume d'Ambre",
    tokens: { colors: { primary: "#86650a", secondary: "#3b2c07", accent: "#c4562b", background: "#fbf7ec", surface: "#f3ecd8", text: "#32280a", muted: "#5f5326" }, fonts: F("font.tenor-sans", "font.quicksand"), radius: { sm: 10, md: 16, lg: 22, button: 16, field: 12, card: 20 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 50, weight: 400, lineHeight: 1.15, letterSpacing: 0 }, body: { size: 17 } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "soft" }, art: { seed: "paume-ambre", motifs: ["dunes", "blobs", "rays"] },
    head: ["head:side", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Les massages", "/massages"], ["Mon cabinet", "/cabinet"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver une séance", "/contact"],
    contact: { address: "14 rue des Lavandières, 06000 Nice", phone: "04 93 12 08 44", email: "seance@paume-ambre.example", hours: "Lundi au samedi, sur rendez-vous", tagline: "Des mains attentives." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Massages bien-être", title: "Dénouer les tensions du quotidien.", sub: "Massages de relaxation à l'huile, massage assis en entreprise et séances à domicile, dans une ambiance chaleureuse et silencieuse. Pratiques de bien-être, hors cadre médical.", cta: ["Réserver une séance", "/contact"], cta2: ["Les massages", "/massages"] }],
        ["feat:strips", { title: "Les séances", items: [{ t: "Massage relaxant (1 h)", x: "Pressions lentes, huile tiède, musique douce." }, { t: "Massage dos et nuque (30 min)", x: "Idéal après une journée de bureau." }, { t: "Massage assis en entreprise", x: "Chaise ergonomique, 15 à 20 minutes sur site." }] }],
        ["feat:numbered", { title: "En chiffres (exemples)", items: [{ t: "12 ans", x: "de pratique du massage bien-être" }, { t: "3 types", x: "de séances proposées" }, { t: "1 salle", x: "calme, chauffée et sans écran" }] }],
        ["proof:big", { items: [{ q: "Une heure où je ne pensais plus à rien. Les mains sont douces et l'accueil sincère.", n: "Valérie P.", r: "Cliente fictive" }] }],
        ["misc:hours", { title: "Horaires de séances", rows: [["Lundi – Vendredi", "10 h – 19 h"], ["Samedi", "9 h – 14 h"], ["Dimanche", "Fermé"]] }],
        ["cta:band", { title: "Réservez votre créneau", sub: AVIS, cta: ["Réserver", "/contact"] }],
      ] },
      { key: "massages", name: "Les massages", blocks: [
        ["misc:pagehead", { title: "Les massages" }],
        ["feat:alt", { items: [{ t: "Relaxant", x: "Enveloppant, lent, pour relâcher les tensions et dormir mieux." }, { t: "Dos et nuque", x: "Ciblé, plus appuyé, selon votre confort." }, { t: "Aux pierres chaudes", x: "Pierres de basalte tièdes posées sur le dos." }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Dois-je me dévêtir ?", x: "Vous gardez le confort qui vous convient, serviettes à disposition." }, { t: "Qui ne devrait pas se faire masser ?", x: "En cas de fièvre, blessure récente ou grossesse, demandez conseil à votre médecin." }] }],
      ] },
      { key: "cabinet", name: "Mon cabinet", blocks: [
        ["misc:pagehead", { title: "Mon cabinet" }],
        ["misc:story", { eyebrow: "Le lieu", title: "Une pièce pour ralentir", paras: ["Table de massage chauffante, lumière douce, huiles végétales choisies sans parfum ajouté.", "Je vous accueille seul(e) avec un thé avant et après la séance."], image: "portrait-1" }],
        ["gal:wall", { items: [{ t: "La salle" }, { t: "Les huiles" }, { t: "Les serviettes" }, { t: "Le coin thé" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["feat:pricelist", { items: [{ t: "Massage relaxant 1 h", price: "70 €" }, { t: "Massage dos et nuque 30 min", price: "38 €" }, { t: "Pierres chaudes 1 h 15", price: "88 €" }, { t: "Massage assis en entreprise", x: "Devis selon durée.", price: "dès 60 €" }] }],
        ["cta:card", { title: "Déplacement à domicile possible", sub: "Dans un rayon de 15 km autour de Nice.", cta: ["Me contacter", "/contact"] }],
      ] },
    ],
  },
  // 7. Centre holistique
  {
    key: "cercle-aurore", name: "Cercle Aurore", category: "sante", tags: ["moderne", "geometrique"], siteType: "Centre de bien-être holistique multi-praticiens",
    description: "Centre de bien-être regroupant plusieurs praticiens, violet profond et pêche, serif classique, dégradé d'accueil et grille d'icônes sans cartes.",
    brand: "Centre Cercle Aurore",
    tokens: { colors: { primary: "#6d3fb5", secondary: "#2e1a52", accent: "#e58e5a", background: "#f7f4fc", surface: "#ffffff", text: "#261a3d", muted: "#5a4d73" }, fonts: F("font.marcellus", "font.urbanist"), radius: { sm: 8, md: 12, lg: 20, button: 999, field: 12, card: 18 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 54, weight: 400, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "cercle-aurore", motifs: ["mesh", "rays", "blobs"] },
    head: ["head:center", {}],
    foot: ["foot:columns", { about: "Un lieu partagé par six praticiens du bien-être, à Strasbourg.", cols: [["Le centre", "Praticiens", "Agenda", "Salles à louer"], ["Infos", "Contact", "Accès", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Les praticiens", "/praticiens"], ["Agenda", "/agenda"], ["Location de salle", "/salles"], ["Contact", "/contact"]], cta: ["Prendre contact", "/contact"],
    contact: { address: "6 allée des Tanneurs, 67000 Strasbourg", phone: "03 88 21 06 19", email: "accueil@cercle-aurore.example", hours: "Lundi au samedi, 9 h – 20 h", tagline: "Un seul lieu, six pratiques." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Centre de bien-être", title: "Un lieu, plusieurs façons de prendre soin de soi.", sub: "Sophrologie, massage, yoga, naturopathie, réflexologie et ateliers de groupe sous un même toit, avec un accueil commun.", cta: ["Voir l'agenda", "/agenda"], cta2: ["Les praticiens", "/praticiens"], stats: [["6", "praticiens"], ["3", "salles"], ["12", "ateliers par mois"]] }],
        ["feat:grid-icons", { title: "Les pratiques du centre", items: [{ t: "Sophrologie", x: "Exercices de respiration et de détente.", icon: "moon" }, { t: "Massage", x: "Séances de relaxation.", icon: "heart" }, { t: "Yoga", x: "Cours collectifs et privés.", icon: "activity" }, { t: "Naturopathie", x: "Conseils d'hygiène de vie.", icon: "sun" }] }],
        ["gal:wall", { items: [{ t: "Salle de pratique" }, { t: "Accueil" }, { t: "Cabine de soin" }, { t: "Jardin intérieur" }] }],
        ["feat:rows", { eyebrow: "Au programme", title: "Ce mois-ci", items: [{ t: "Atelier respiration", x: "Samedi, 2 heures, groupe de dix." }, { t: "Cercle de parole", x: "Un jeudi sur deux, 19 h." }, { t: "Matinée yoga et brunch", x: "Dernier dimanche du mois." }] }],
        ["proof:team", { title: "L'équipe d'accueil", items: [{ n: "Marion Heller", r: "Fondatrice, sophrologue" }, { n: "Yann Duval", r: "Praticien en massage" }, { n: "Sabine Roth", r: "Professeure de yoga" }] }],
        ["cta:split", { title: "Besoin d'orienter votre démarche ?", sub: "Nous vous conseillons gratuitement. " + AVIS, cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "praticiens", name: "Les praticiens", blocks: [
        ["misc:pagehead", { title: "Les praticiens" }],
        ["proof:team", { items: [{ n: "Marion Heller", r: "Sophrologue" }, { n: "Yann Duval", r: "Massage bien-être" }, { n: "Sabine Roth", r: "Yoga" }, { n: "Élodie Brandt", r: "Naturopathie" }] }],
        ["misc:text", { title: "Une charte commune", paras: ["Chaque praticien exerce de manière indépendante dans le cadre d'une charte : écoute, transparence sur les pratiques et orientation vers un professionnel de santé quand c'est nécessaire."] }],
      ] },
      { key: "agenda", name: "Agenda", blocks: [
        ["misc:pagehead", { title: "Agenda du mois" }],
        ["misc:schedule", { items: [{ d: "Sam 10 h", t: "Atelier respiration", x: "2 heures" }, { d: "Jeu 19 h", t: "Cercle de parole", x: "1 h 30" }, { d: "Dim 9 h", t: "Yoga et brunch", x: "3 heures" }, { d: "Mer 18 h", t: "Initiation sophrologie", x: "1 heure" }] }],
        ["cta:band", { title: "Réserver une place", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "salles", name: "Location de salle", blocks: [
        ["misc:pagehead", { title: "Location de salles" }],
        ["feat:compare", { title: "Nos salles", rows: [["", "Salle Aube", "Salle Cèdre"], ["Capacité", "15 personnes", "6 personnes"], ["Équipement", "Tapis, enceintes", "Table de soin"], ["Tarif horaire", "28 €", "18 €"]] }],
        ["feat:checks", { title: "Inclus", items: [{ t: "Accueil et ménage" }, { t: "Wifi" }, { t: "Tisanerie" }], cta: ["Demander une salle", "/contact"] }],
      ] },
    ],
  },
  // 8. Ostéopathe
  {
    key: "axe-vertebre", name: "Axe Vertèbre", category: "sante", tags: ["moderne", "technique"], siteType: "Cabinet d'ostéopathie",
    description: "Cabinet d'ostéopathie en bleu franc et orange vif, titres géométriques, en-tête sombre, bandeau divisé et rubriques claires pour la prise de rendez-vous.",
    brand: "Cabinet Axe Vertèbre",
    tokens: { colors: { primary: "#1f5fa8", secondary: "#0f2e52", accent: "#e4572e", background: "#f3f7fb", surface: "#ffffff", text: "#14283d", muted: "#475a6e" }, fonts: F("font.sora", "font.crimson-text"), radius: { sm: 4, md: 8, lg: 12, button: 8, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d3e0ee" }, type: { h1: { size: 48, weight: 700, lineHeight: 1.1, letterSpacing: -0.02 }, body: { size: 17 } } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "axe-vertebre", motifs: ["tiles", "topo", "halftone"] },
    head: ["head:dark", {}],
    foot: ["foot:columns", { about: "Cabinet d'ostéopathie à Lille : adultes, enfants, nourrissons et sportifs, sur rendez-vous.", cols: [["Cabinet", "Consultations", "Déroulement", "Tarifs"], ["Contact", "Rendez-vous", "Questions", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Consultations", "/consultations"], ["Déroulement", "/deroulement"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "31 rue Solférino, 59000 Lille", phone: "03 20 14 05 62", email: "rdv@axe-vertebre.example", hours: "Lundi au vendredi, 8 h 30 – 19 h", tagline: "L'écoute du corps, au cabinet." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Ostéopathie", title: "Une prise en charge manuelle, à votre rythme.", sub: "Consultations pour adultes, enfants, femmes enceintes et sportifs. Un temps d'écoute, un examen, des gestes doux et des conseils pour la suite. Ce site est une démonstration.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Déroulement", "/deroulement"] }],
        ["feat:checks", { title: "Consultations pour", items: [{ t: "Adultes et travailleurs sédentaires" }, { t: "Femmes enceintes" }, { t: "Nourrissons et enfants" }, { t: "Sportifs, amateurs ou réguliers" }], cta: ["Voir les consultations", "/consultations"] }],
        ["feat:steps", { eyebrow: "La séance", title: "Une heure, quatre temps", items: [{ t: "Échange", x: "Motif de venue, historique, antécédents.", d: "15 min" }, { t: "Examen", x: "Observation de la posture et des mouvements.", d: "15 min" }, { t: "Gestes", x: "Techniques manuelles adaptées à votre confort.", d: "20 min" }, { t: "Conseils", x: "Exercices simples et suites éventuelles.", d: "10 min" }] }],
        ["proof:stats", { title: "Repères du cabinet (exemples)", items: [["1 h", "par consultation"], ["2", "praticiens"], ["Sur rendez-vous", "toute la semaine"]] }],
        ["misc:faq", { title: "Questions", items: [{ t: "L'ostéopathie est-elle remboursée ?", x: "Selon votre mutuelle ; une feuille de soins vous est remise." }, { t: "Faut-il un courrier du médecin ?", x: "Non, mais n'hésitez pas à apporter vos examens récents." }, { t: "Est-ce douloureux ?", x: "Les gestes sont adaptés à votre confort ; vous pouvez demander d'arrêter à tout moment." }] }],
        ["cta:band", { title: "Prendre rendez-vous", sub: "En cas d'urgence médicale, appelez le 15. " + AVIS, cta: ["Demander un créneau", "/contact"] }],
      ] },
      { key: "consultations", name: "Consultations", blocks: [
        ["misc:pagehead", { title: "Consultations" }],
        ["feat:bento", { items: [{ t: "Adultes", x: "Tensions de dos, de nuque, gêne liée au travail sur écran.", icon: "user" }, { t: "Sportifs", x: "Récupération et préparation, conseils de reprise.", icon: "activity" }, { t: "Bébés et enfants", x: "Consultation douce, en présence des parents.", icon: "heart" }] }],
        ["cta:card", { title: "Pas sûr de la consultation adaptée ?", cta: ["Nous appeler", "/contact"] }],
      ] },
      { key: "deroulement", name: "Déroulement", blocks: [
        ["misc:pagehead", { title: "Déroulement d'une séance" }],
        ["feat:rows", { items: [{ t: "Avant", x: "Apportez vos examens et la liste de vos traitements." }, { t: "Pendant", x: "Tenue souple, gestes doux, explications à chaque étape." }, { t: "Après", x: "Boire de l'eau, éviter l'effort intense dans la journée." }] }],
        ["misc:text", { title: "Dans quels cas nous orientons", paras: ["Si votre situation relève d'un avis médical (fièvre, douleur inexpliquée, signes neurologiques), nous vous orientons vers votre médecin ou les urgences."] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["feat:pricelist", { items: [{ t: "Adulte (1 h)", price: "60 €" }, { t: "Enfant jusqu'à 12 ans", price: "50 €" }, { t: "Nourrisson", price: "50 €" }, { t: "Sportif (bilan complet)", price: "65 €" }] }],
        ["cta:band", { title: "Règlement par carte, chèque ou espèces", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
    ],
  },
  // 9. Sophrologue (sombre)
  {
    key: "souffle-nocturne", name: "Souffle Nocturne", category: "sante", tags: ["sombre", "minimaliste"], siteType: "Cabinet de sophrologie",
    description: "Cabinet de sophrologie en bleu nuit et lavande clair, serif doux, accueil centré avec repères chiffrés et séances de relaxation présentées sobrement.",
    brand: "Souffle Nocturne, sophrologie",
    tokens: { colors: { primary: "#9db0ff", secondary: "#24316a", accent: "#f2c46b", background: "#121a33", surface: "#1a2547", text: "#e9edfb", muted: "#aab5d8" }, fonts: F("font.ibarra-real-nova", "font.mulish"), radius: { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 20 }, shadow: { card: "lg", button: "none" }, border: { width: 1, color: "#2d3b72" }, type: { h1: { size: 56, weight: 500, lineHeight: 1.1, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "soft" }, art: { seed: "souffle-nocturne", motifs: ["bokeh", "arches", "waves"] },
    head: ["head:bar", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["La sophrologie", "/sophrologie"], ["Séances", "/seances"], ["Questions", "/questions"], ["Contact", "/contact"]], cta: ["Séance découverte", "/contact"],
    contact: { address: "22 rue du Mail, 49100 Angers", phone: "02 41 87 03 56", email: "seance@souffle-nocturne.example", hours: "Mardi au samedi, sur rendez-vous", tagline: "Respirer, relâcher, retrouver le calme." },
    social: ["facebook", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Sophrologie", title: "Apprendre à relâcher, un souffle après l'autre.", sub: "Séances individuelles et en groupe pour mieux gérer le stress, préparer un examen ou retrouver un sommeil plus calme. Technique de relaxation, hors cadre thérapeutique.", cta: ["Séance découverte", "/contact"], cta2: ["Découvrir la méthode", "/sophrologie"], stats: [["45 min", "par séance"], ["8", "séances en général"], ["Groupe", "ou individuel"]] }],
        ["feat:list2", { eyebrow: "Pour qui ?", title: "Des situations du quotidien", items: [{ t: "Stress au travail" }, { t: "Préparation d'examen" }, { t: "Nuits agitées" }, { t: "Préparation à un événement" }, { t: "Gestion des émotions" }, { t: "Retour au calme" }] }],
        ["feat:alt", { title: "Comment se déroule une séance", items: [{ t: "Échange", x: "On précise votre objectif et votre ressenti du moment." }, { t: "Exercices guidés", x: "Respiration, détente musculaire, visualisation." }, { t: "Retour", x: "Ce que vous avez ressenti et exercice à pratiquer chez vous." }] }],
        ["proof:quotes", { items: [{ q: "J'ai appris à respirer avant de prendre la parole en réunion.", n: "Jérôme T.", r: "Client fictif" }, { q: "Les exercices audio m'aident à m'endormir plus sereinement.", n: "Aurélie C.", r: "Cliente fictive" }] }],
        ["feat:accordion", { title: "Avant de vous lancer", items: [{ t: "La sophrologie remplace-t-elle un traitement ?", x: "Non, c'est une pratique de relaxation qui ne remplace pas un suivi médical." }, { t: "Faut-il une tenue particulière ?", x: "Des vêtements souples suffisent." }] }],
        ["cta:image", { title: "Faites une pause d'une heure", sub: AVIS, cta: ["Réserver une séance", "/contact"] }],
      ] },
      { key: "sophrologie", name: "La sophrologie", blocks: [
        ["misc:pagehead", { title: "La sophrologie" }],
        ["misc:text", { eyebrow: "Le principe", title: "Corps et esprit, ensemble", paras: ["La sophrologie associe respiration, mouvements doux et visualisation pour apprendre à relâcher les tensions et à se recentrer.", "Elle s'apprend : les exercices se pratiquent ensuite seul(e), en quelques minutes par jour."] }],
        ["feat:icons", { items: [{ t: "Respiration", x: "Des rythmes simples pour calmer le corps.", icon: "sun" }, { t: "Détente", x: "Relâcher les muscles zone par zone.", icon: "moon" }, { t: "Visualisation", x: "Imaginer un lieu apaisant.", icon: "eye" }] }],
      ] },
      { key: "seances", name: "Séances", blocks: [
        ["misc:pagehead", { title: "Séances et tarifs" }],
        ["price:tiers", { items: [{ t: "Séance découverte", price: "35 €", x: "30 min pour essayer.", f: ["Premier échange", "Un exercice"], cta: ["Réserver", "/contact"] }, { t: "Séance individuelle", price: "55 €", x: "45 min.", f: ["Exercices guidés", "Audio à emporter"], cta: ["Réserver", "/contact"], hl: true }, { t: "Cycle de 8 séances", price: "400 €", x: "Suivi complet.", f: ["8 séances", "Bilan intermédiaire"], cta: ["Réserver", "/contact"] }] }],
        ["misc:hours", { title: "Séances de groupe", rows: [["Mardi 19 h", "Détente du soir"], ["Samedi 10 h", "Respirer avant la semaine"]] }],
      ] },
      { key: "questions", name: "Questions", blocks: [
        ["misc:pagehead", { title: "Questions fréquentes" }],
        ["misc:faq", { items: [{ t: "Combien de séances prévoir ?", x: "Huit en général, à adapter selon vos objectifs." }, { t: "Séances à distance ?", x: "Oui, en visioconférence avec un lieu calme." }, { t: "Remboursement ?", x: "Certaines mutuelles remboursent une partie ; une facture est fournie." }] }],
        ["cta:card", { title: "Une autre question ?", cta: ["Écrire au cabinet", "/contact"] }],
      ] },
    ],
  },
];

// Page « Contact » propre à chaque thème (variante de contact et accroche différentes).
const CONTACTS = {
  "onde-thermale": [["contact:map", { title: "Nous trouver", mapAddress: "8 quai des Tanneurs, 69002 Lyon" }], ["misc:hours", { title: "Ouverture", rows: [["Tous les jours", "10 h – 21 h"]] }]],
  "asana-lune": [["contact:info", { title: "Écrire au studio", formTitle: "Réserver un cours d'essai", formIntro: "Indiquez le cours souhaité et vos disponibilités.", cta: ["Envoyer", "/contact"] }], ["misc:faq", { items: [{ t: "Réponse sous combien de temps ?", x: "Sous 24 h en semaine." }] }]],
  "assiette-claire": [["contact:cards", {}], ["misc:text", { title: "Avant le rendez-vous", paras: ["Notez vos repas sur trois jours si vous le pouvez : cela facilite le premier échange."] }]],
  "racine-sauge": [["contact:info", { title: "Réserver un bilan", formTitle: "Votre message", formIntro: "Je vous réponds sous deux jours ouvrés.", cta: ["Envoyer", "/contact"] }], ["misc:quote", { text: "Chaque rencontre commence par l'écoute.", by: "Racine & Sauge" }]],
  "maison-pivoine": [["contact:cards", {}], ["misc:hours", { title: "Horaires du salon", rows: [["Mardi – Vendredi", "9 h 30 – 19 h"], ["Samedi", "9 h – 17 h"]] }]],
  "paume-ambre": [["contact:map", { title: "Le cabinet", mapAddress: "14 rue des Lavandières, 06000 Nice" }], ["misc:text", { title: "Réservation", paras: ["Les séances se réservent par téléphone ou par message. Merci de prévenir 24 h à l'avance en cas d'annulation."] }]],
  "cercle-aurore": [["contact:info", { title: "Nous contacter", formTitle: "Une question ?", formIntro: "L'accueil vous répond du lundi au samedi.", cta: ["Envoyer", "/contact"] }], ["misc:hours", { title: "Accueil", rows: [["Lundi – Vendredi", "9 h – 20 h"], ["Samedi", "9 h – 17 h"]] }]],
  "axe-vertebre": [["contact:map", { title: "Accès au cabinet", mapAddress: "31 rue Solférino, 59000 Lille" }], ["misc:faq", { items: [{ t: "Puis-je annuler ?", x: "Oui, jusqu'à 24 h avant le rendez-vous." }] }]],
  "souffle-nocturne": [["contact:cards", {}], ["misc:text", { title: "Séance découverte", paras: ["Écrivez-moi quelques lignes sur ce qui vous amène ; je vous propose un créneau."] }]],
};
module.exports = THEMES.map((t) => {
  const extra = CONTACTS[t.key];
  return { ...t, pages: [...t.pages, { key: "contact", name: "Contact", blocks: [["misc:pagehead", { title: "Contact" }], ...extra] }] };
});
