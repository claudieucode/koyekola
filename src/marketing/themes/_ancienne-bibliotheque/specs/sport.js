// Sport (9 thèmes). Textes de DÉMONSTRATION : clubs, coachs, tarifs et coordonnées fictifs ; aucune inscription ni paiement en ligne n'est simulé (demande par le formulaire de contact).
const contactPage = (sub, title, cta, mapAddress, formIntro) => ({
  key: "contact", name: "Contact", blocks: [
    ["misc:pagehead", { title: "Contact", sub }],
    ["contact:info", { title, formTitle: "Écrivez-nous", formIntro, cta }],
    ["contact:map", { title: "Nous trouver", mapAddress }],
  ],
});
const F = (h, b) => ({ heading: "font." + h, body: "font." + b, button: "font." + b, link: "font." + b });

module.exports = [
  // 1. Salle de fitness (sombre, lime)
  {
    key: "vigorelle-gym", name: "Vigorelle", category: "sport", tags: ["sombre", "moderne", "audacieux"], siteType: "Salle de fitness",
    description: "Salle de fitness nocturne : fond graphite, vert citron électrique, titres condensés Teko et photos plein bandeau. Grille d'abonnements, cours collectifs et plateau musculation mis en avant.",
    brand: "Vigorelle Fitness",
    tokens: { colors: { primary: "#a3e635", secondary: "#1a2a05", accent: "#38bdf8", background: "#101214", surface: "#1a1d20", text: "#f3f5f1", muted: "#b4bbb0" }, fonts: F("teko", "work-sans"), radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 80, weight: 600, lineHeight: 0.95, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 48, weight: 600, lineHeight: 1, transform: "uppercase" } }, border: { width: 1, color: "#2e3338" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "vigorelle", motifs: ["rays", "mesh", "halftone"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Salle de fitness ouverte 7 j/7 : musculation, cardio, cours collectifs et coaching.", cols: [["Salle", "Plateau musculation", "Cours collectifs", "Espace cardio"], ["Infos", "Abonnements", "Planning", "Contact"]] }],
    menu: [["Accueil", "/"], ["Cours", "/cours"], ["Abonnements", "/abonnements"], ["Espaces", "/espaces"], ["Contact", "/contact"]], cta: ["Pass découverte", "/contact"],
    contact: { address: "Parc d'activités du Vallon, 7 avenue des Sportifs, 69800 Saint-Priest", phone: "04 72 55 09 21", email: "accueil@vigorelle.example", hours: "Lundi – vendredi, 6 h – 23 h · Week-end, 8 h – 20 h", tagline: "Votre énergie, votre rythme." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Fitness · Saint-Priest", title: "Bougez fort, bougez bien.", sub: "1 200 m² de plateau, 40 cours par semaine et des coachs présents sur le sol, pas derrière un comptoir.", cta: ["Réserver un pass découverte", "/contact"], cta2: ["Voir les cours", "/cours"], overlay: 0.55 }],
        ["misc:marquee", { items: ["Ouvert 7 j/7", "Plus de 40 cours par semaine", "Douches et casiers inclus", "Parking gratuit"] }],
        ["feat:bento", { eyebrow: "Ce qui nous distingue", title: "Tout sous le même toit", items: [{ t: "Plateau musculation guidée", x: "Rack, haltères jusqu'à 60 kg, machines guidées et zone de poids libres, avec un coach de plateau aux heures de pointe.", icon: "activity" }, { t: "Cardio et vue dégagée", x: "Vélos, rameurs et tapis face à la baie vitrée.", icon: "zap" }, { t: "Cours collectifs", x: "Cycle, renfo, step, HIIT et stretching.", icon: "users" }] }],
        ["price:tiers", { items: [{ t: "Essentiel", price: "29 €", period: "par mois", f: ["Salle et cardio", "Casiers et douches", "Engagement 12 mois"], cta: "Choisir", url: "/contact" }, { t: "Tout compris", price: "39 €", period: "par mois", f: ["Salle + tous les cours", "1 bilan forme par trimestre", "Sans engagement après 12 mois"], cta: "Choisir", url: "/contact", hl: true }, { t: "Duo", price: "65 €", period: "par mois", f: ["2 abonnements Tout compris", "Invitations offertes"], cta: "Choisir", url: "/contact" }] }],
        ["proof:quotes", { items: [{ q: "Les horaires larges m'ont permis de m'y remettre après le travail, sans foule.", n: "Lucas F.", r: "membre, client fictif" }, { q: "Le coach de plateau a corrigé mon squat en deux minutes. Ça change tout.", n: "Inès P.", r: "membre, client fictif" }, { q: "Les cours du samedi sont pleins mais jamais bondés.", n: "Théo M.", r: "membre, client fictif" }] }],
        ["cta:band", { title: "Un pass découverte de 3 jours, sans carte bancaire.", sub: "Venez essayer, visiter, poser vos questions.", cta: ["Demander mon pass", "/contact"] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Cours collectifs", sub: "Planning type d'une semaine" }],
        ["misc:schedule", { title: "Mardi", items: [{ d: "7 h 30", t: "Cycle Matin", x: "45 minutes, 24 vélos." }, { d: "12 h 30", t: "HIIT Express", x: "30 minutes pour la pause déjeuner." }, { d: "18 h 15", t: "Renfo Complet", x: "Haltères et poids du corps." }, { d: "19 h 30", t: "Stretching", x: "Pour finir la journée en douceur." }] }],
        ["feat:list2", { title: "Au programme", items: [{ t: "Cycle" }, { t: "Renforcement musculaire" }, { t: "HIIT" }, { t: "Step" }, { t: "Pilates" }, { t: "Stretching" }] }],
        ["cta:split", { title: "Les cours sont inclus dans l'abonnement Tout compris.", cta: ["Voir les abonnements", "/abonnements"] }],
      ] },
      { key: "abonnements", name: "Abonnements", blocks: [
        ["misc:pagehead", { title: "Abonnements" }],
        ["feat:compare", { title: "Comparer les formules", rows: [["", "Essentiel", "Tout compris", "Duo"], ["Salle et cardio", "oui", "oui", "oui"], ["Cours collectifs", "non", "oui", "oui"], ["Bilan forme", "non", "oui", "oui"], ["Invitations", "non", "non", "oui"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je résilier à tout moment ?", x: "Après la période initiale de 12 mois, oui, avec un préavis d'un mois." }, { t: "Y a-t-il des frais d'inscription ?", x: "Aucun frais n'est affiché dans cette démonstration ; les conditions réelles sont à préciser par la salle." }, { t: "Les mineurs sont-ils acceptés ?", x: "À partir de 16 ans, avec une autorisation parentale." }] }],
        ["cta:band", { title: "Une question sur une formule ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "espaces", name: "Espaces", blocks: [
        ["misc:pagehead", { title: "Nos espaces" }],
        ["gal:cards", { items: [{ t: "Plateau musculation", x: "Racks, bancs, charges libres.", tag: "Zone 1" }, { t: "Plateau cardio", x: "Vélos, tapis, rameurs.", tag: "Zone 2" }, { t: "Studios de cours", x: "Deux salles miroir.", tag: "Zone 3" }] }],
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Lundi – vendredi", "6 h – 23 h"], ["Samedi", "8 h – 20 h"], ["Dimanche", "8 h – 20 h"]] }],
        ["proof:stats", { items: [["1 200", "m² d'espace"], ["40", "cours par semaine"], ["15", "coachs et animateurs"]] }],
      ] },
      contactPage("Une visite, un conseil, une inscription : on vous répond sous 24 h.", "Passez nous voir", ["Demander un pass", "/contact"], "7 avenue des Sportifs, 69800 Saint-Priest", "Indiquez vos objectifs et vos disponibilités."),
    ],
  },

  // 2. Box de CrossFit (sombre, rouge)
  {
    key: "kettlebrick-box", name: "Kettlebrick", category: "sport", tags: ["sombre", "audacieux", "geometrique"], siteType: "Box de CrossFit",
    description: "Box brute : béton noir, rouge sirène, Staatliches en capitales et grandes bandes d'annonces. Le planning des WOD, les niveaux et le tarif sont lisibles en un coup d'œil.",
    brand: "Kettlebrick Box",
    tokens: { colors: { primary: "#ef4444", secondary: "#000000", accent: "#fbbf24", background: "#0e0e10", surface: "#1a1a1e", text: "#f5f5f6", muted: "#b6b6be" }, fonts: F("staatliches", "ibm-plex-sans"), radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 84, weight: 400, lineHeight: 0.95, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 48, weight: 400, lineHeight: 1, letterSpacing: 0.02, transform: "uppercase" } }, border: { width: 2, color: "#3a3a42" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "kettlebrick", motifs: ["plates", "tiles", "halftone"] },
    head: ["head:dark", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["WOD", "/wod"], ["Niveaux", "/niveaux"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Cours d'essai", "/contact"],
    contact: { address: "Ancienne fonderie, 4 impasse du Haut-Fourneau, 59300 Valenciennes", phone: "03 27 42 86 13", email: "coach@kettlebrick.example", hours: "Lundi – vendredi, 6 h – 20 h 30 · Samedi, 9 h – 12 h", tagline: "Brique, fonte, sueur." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "CrossFit · Valenciennes", title: "La fonte ne ment pas.", sub: "Cours collectifs de 60 minutes, coachs certifiés, mouvements adaptés à chacun. Première séance d'essai gratuite.", cta: ["Réserver l'essai", "/contact"], cta2: ["Voir le WOD", "/wod"] }],
        ["misc:marquee", { items: ["WOD à 6 h, 12 h 15 et 18 h 30", "Essai gratuit", "Coachs certifiés", "Open Gym le samedi"] }],
        ["feat:strips", { eyebrow: "Ce qu'on y fait", title: "Quatre piliers", items: [{ t: "Haltérophilie", x: "Arraché, épaulé-jeté, squat : on travaille la barre avant la charge." }, { t: "Gymnastique", x: "Tractions, handstand, anneaux : des progressions pas à pas." }, { t: "Cardio mixte", x: "Rameur, assault bike, corde à sauter." }, { t: "Mobilité", x: "Dix minutes pour finir sans douleur." }] }],
        ["proof:statsbar", { items: [["380", "membres"], ["14", "créneaux par jour"], ["5", "coachs"]] }],
        ["gal:featured", { items: [{ t: "Le rig", x: "Douze postes pour les tractions." }, { t: "Zone haltéro", x: "Six plateformes." }, { t: "Cardio", x: "Rameurs et vélos." }, { t: "Cour extérieure", x: "Pour les sleds." }] }],
        ["cta:split", { title: "Venez essayer, c'est gratuit.", sub: "Chaussures propres, bouteille d'eau, curiosité.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "wod", name: "WOD", blocks: [
        ["misc:pagehead", { title: "Le WOD", sub: "Un exemple de séance" }],
        ["misc:schedule", { title: "Séance type de 60 min", items: [{ d: "0 – 10 min", t: "Échauffement", x: "Mobilité et mise en route." }, { d: "10 – 25 min", t: "Technique", x: "Un mouvement travaillé en détail." }, { d: "25 – 50 min", t: "WOD", x: "L'effort principal, chronométré." }, { d: "50 – 60 min", t: "Retour au calme", x: "Étirements et débrief." }] }],
        ["feat:rows", { title: "Les formats de WOD", items: [{ t: "AMRAP", x: "Autant de tours que possible en un temps donné." }, { t: "For Time", x: "Terminer le travail le plus vite possible." }, { t: "EMOM", x: "Un mouvement chaque minute, pour garder le rythme." }] }],
        ["cta:band", { title: "Premier WOD offert.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "niveaux", name: "Niveaux", blocks: [
        ["misc:pagehead", { title: "Niveaux et progression" }],
        ["feat:tabs", { title: "Votre parcours", items: [{ t: "Fondations", x: "Quatre séances pour apprendre les mouvements de base avant de rejoindre un cours." }, { t: "Cours collectifs", x: "Même programme pour tous, charges et variantes adaptées." }, { t: "Performance", x: "Un créneau pour viser les compétitions régionales." }] }],
        ["proof:big", { items: [{ q: "Je pensais que ce n'était pas pour moi. Au bout de trois mois, je faisais mes premières tractions.", n: "Camille R.", r: "membre, client fictif" }] }],
        ["feat:numbered", { title: "Nos engagements", items: [{ t: "Sécurité", x: "Technique avant intensité." }, { t: "Adaptation", x: "Chaque mouvement a une version plus simple." }, { t: "Communauté", x: "Personne ne s'entraîne seul." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Fondations", price: "99 €", f: ["4 séances d'initiation", "Évaluation du niveau"], cta: "Réserver", url: "/contact" }, { t: "Illimité", price: "85 €", period: "par mois", f: ["Tous les WOD", "Open Gym", "Sans engagement"], cta: "Choisir", url: "/contact", hl: true }, { t: "Carnet 12", price: "130 €", f: ["12 séances", "Valable 4 mois"], cta: "Choisir", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Quel matériel apporter ?", x: "Une tenue de sport et une serviette. Le reste est fourni." }, { t: "Y a-t-il des vestiaires ?", x: "Oui, avec douches et casiers." }] }],
        ["cta:card", { title: "Pas sûr de la formule ?", sub: "Le coach vous conseille lors de l'essai.", cta: ["Réserver l'essai", "/contact"] }],
      ] },
      contactPage("La porte est ouverte dès 6 h.", "Rejoignez la box", ["Cours d'essai", "/contact"], "4 impasse du Haut-Fourneau, 59300 Valenciennes", "Dites-nous votre expérience sportive et vos créneaux préférés."),
    ],
  },

  // 3. Arts martiaux (sombre, indigo)
  {
    key: "dojo-kuroshio", name: "Kuroshio", category: "sport", tags: ["sombre", "editorial", "minimaliste"], siteType: "Dojo d'arts martiaux",
    description: "Dojo sobre : encre noire, indigo profond et blanc cassé, Shippori Mincho aux accents calligraphiques, grandes marges. Cours par discipline, grades et valeurs du dojo.",
    brand: "Dojo Kuroshio",
    tokens: { colors: { primary: "#818cf8", secondary: "#1e1b4b", accent: "#f5d0a9", background: "#0f0f17", surface: "#191926", text: "#f1eee8", muted: "#b7b5c4" }, fonts: F("shippori-mincho", "zen-kaku-gothic-new"), radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 700, lineHeight: 1.1, letterSpacing: 0 }, h2: { size: 38, weight: 700, lineHeight: 1.2 } }, border: { width: 1, color: "#33334a" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "kuroshio", motifs: ["waves", "arches", "topo"] },
    head: ["head:minimal", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Disciplines", "/disciplines"], ["Grades", "/grades"], ["Le dojo", "/dojo"], ["Contact", "/contact"]], cta: ["Cours d'essai", "/contact"],
    contact: { address: "12 rue des Cerisiers, 44000 Nantes", phone: "02 40 71 33 58", email: "dojo@kuroshio.example", hours: "Lundi – vendredi, 17 h 30 – 21 h 30 · Samedi, 10 h – 13 h", tagline: "Respect, rigueur, progression." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Arts martiaux · Nantes", title: "Apprendre à tomber, apprendre à se relever.", sub: "Judo, karaté et aïkido pour enfants, adolescents et adultes, dans un dojo où l'on salue avant d'entrer.", cta: ["Venir essayer", "/contact"], cta2: ["Voir les disciplines", "/disciplines"] }],
        ["feat:alt", { eyebrow: "Trois voies", title: "Choisir sa discipline", items: [{ t: "Judo", x: "Projections, contrôles au sol et esprit d'équipe. Dès 5 ans.", link: ["En savoir plus", "/disciplines"] }, { t: "Karaté", x: "Kata, kumité et condition physique. Dès 7 ans.", link: ["En savoir plus", "/disciplines"] }, { t: "Aïkido", x: "Déséquilibres, esquives et respiration. Dès 14 ans.", link: ["En savoir plus", "/disciplines"] }] }],
        ["proof:big", { items: [{ q: "Mon fils est arrivé timide. Aujourd'hui il se tient droit, il écoute, il salue.", n: "Marion L.", r: "parent d'élève, client fictif" }] }],
        ["feat:steps", { title: "Un parcours en ceintures", items: [{ t: "Ceinture blanche", x: "Les bases, le salut, la chute.", d: "Mois 1" }, { t: "Ceinture jaune", x: "Premières projections.", d: "Mois 6" }, { t: "Ceinture orange", x: "Enchaînements et combat guidé.", d: "An 1" }, { t: "Ceinture verte", x: "Autonomie sur le tatami.", d: "An 2" }] }],
        ["cta:card", { title: "Deux séances d'essai, sans engagement.", sub: "Un kimono peut être prêté.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "disciplines", name: "Disciplines", blocks: [
        ["misc:pagehead", { title: "Disciplines et horaires" }],
        ["misc:schedule", { title: "Semaine type", items: [{ d: "Lundi 18 h", t: "Judo enfants 7 – 11 ans", x: "Tatami principal." }, { d: "Mardi 19 h", t: "Karaté adultes", x: "Tous niveaux." }, { d: "Mercredi 17 h 30", t: "Judo ados", x: "12 – 17 ans." }, { d: "Jeudi 20 h", t: "Aïkido", x: "Adultes." }, { d: "Samedi 10 h", t: "Judo parents-enfants", x: "Un cours en famille." }] }],
        ["feat:cards", { title: "Ce que l'on développe", items: [{ t: "Souplesse", x: "Échauffement long, étirements.", icon: "activity" }, { t: "Concentration", x: "Rituels, respiration.", icon: "eye" }, { t: "Confiance", x: "Apprendre à chuter sans peur.", icon: "shield" }] }],
        ["cta:split", { title: "Quelle discipline pour vous ?", sub: "Nous vous orientons lors de l'essai.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "grades", name: "Grades", blocks: [
        ["misc:pagehead", { title: "Grades et passages" }],
        ["feat:rows", { title: "Du kyu au dan", items: [{ t: "Ceintures de couleur", x: "Blanche, jaune, orange, verte, bleue et marron : un passage une à deux fois par an." }, { t: "Ceinture noire", x: "Après plusieurs années de pratique, devant un jury fédéral." }, { t: "Compétitions", x: "Proposées sans obligation, dès la ceinture orange." }] }],
        ["misc:quote", { text: "Le tatami enseigne l'humilité : on y gagne autant en tombant qu'en projetant.", by: "Maître du dojo (exemple)" }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Faut-il un certificat médical ?", x: "Oui, un certificat d'aptitude est demandé pour la licence." }, { t: "À quel âge commencer ?", x: "À partir de 5 ans en judo, avec un éveil par le jeu." }] }],
      ] },
      { key: "dojo", name: "Le dojo", blocks: [
        ["misc:pagehead", { title: "Le dojo" }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Trente ans de tatami", paras: ["Le dojo Kuroshio est une association qui réunit des pratiquants de tous âges autour de trois disciplines. Les professeurs sont bénévoles ou diplômés d'État.", "Le règlement est simple : le respect du partenaire, du lieu et des horaires."], image: "portrait-2" }],
        ["proof:team", { items: [{ n: "Sensei Hadrien Morvan", r: "Judo, 5e dan" }, { n: "Maïwenn Le Goff", r: "Karaté, 3e dan" }, { n: "Yohan Aubrac", r: "Aïkido, 4e dan" }] }],
        ["feat:numbered", { title: "Valeurs", items: [{ t: "Courtoisie", x: "On salue, on remercie." }, { t: "Courage", x: "Essayer malgré la peur." }, { t: "Maîtrise de soi", x: "La force n'est jamais gratuite." }] }],
      ] },
      contactPage("Un essai, un renseignement, une inscription.", "Nous écrire", ["Réserver un essai", "/contact"], "12 rue des Cerisiers, 44000 Nantes", "Précisez l'âge du pratiquant et la discipline souhaitée."),
    ],
  },

  // 4. Club de football (bleu, clair)
  {
    key: "tribune-ouest-fc", name: "Tribune Ouest", category: "sport", tags: ["moderne", "audacieux", "geometrique"], siteType: "Club de football amateur",
    description: "Site de club amateur : bleu roi, blanc et jaune maillot, titres en Archivo Black, compte à rebours du prochain match, actualités, effectifs et partenaires locaux.",
    brand: "AS Tribune Ouest",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0b1d4d", accent: "#facc15", background: "#f6f8fc", surface: "#ffffff", text: "#0f1b3a", muted: "#4b587a" }, fonts: F("archivo-black", "source-sans-3"), radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.02, letterSpacing: -0.01, transform: "uppercase" }, h2: { size: 36, weight: 400, lineHeight: 1.1, transform: "uppercase" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "tribune-ouest", motifs: ["tiles", "rays", "mountains"] },
    head: ["head:topbar", { info: "Prochain match à domicile : samedi 15 h, stade du Moulin", note: "Entrée libre" }], foot: ["foot:newsletter", { title: "La lettre du club", sub: "Résultats, convocations et événements, une fois par semaine.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Équipes", "/equipes"], ["Calendrier", "/calendrier"], ["Le club", "/club"], ["Contact", "/contact"]], cta: ["Inscrire mon enfant", "/contact"],
    contact: { address: "Stade du Moulin, rue des Tilleuls, 56100 Lorient", phone: "02 97 83 41 20", email: "secretariat@tribune-ouest.example", hours: "Permanence : mercredi 14 h – 19 h · Samedi, 9 h – 12 h", tagline: "Un club, une famille." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:countdown", { eyebrow: "Prochain match", title: "Tribune Ouest reçoit le FC des Landes", sub: "Championnat de district, 12e journée. Venez nombreux soutenir l'équipe première.", until: "2030-03-15T15:00:00+01:00", cta: ["Voir le calendrier", "/calendrier"] }],
        ["gal:cards", { items: [{ t: "Victoire 3 à 1 des U17", x: "Une seconde période maîtrisée.", tag: "Résultat" }, { t: "Tournoi des écoles", x: "Samedi 22 mars, 24 équipes attendues.", tag: "Événement" }, { t: "Bénévoles recherchés", x: "Buvette, arbitrage, accompagnement.", tag: "Club" }] }],
        ["proof:stats", { title: "Le club en chiffres", items: [["320", "licenciés"], ["18", "équipes"], ["45", "bénévoles"]] }],
        ["proof:logos", { title: "Nos partenaires", items: ["Boulangerie Le Fournil", "Garage Océane", "Optique du Port", "Maçonnerie Kerlo", "Pharmacie des Tilleuls"] }],
        ["cta:image", { title: "Rejoignez le club dès 5 ans.", sub: "École de foot, U7 à seniors, loisirs et féminines.", cta: ["Inscrire mon enfant", "/contact"] }],
      ] },
      { key: "equipes", name: "Équipes", blocks: [
        ["misc:pagehead", { title: "Équipes et catégories" }],
        ["feat:tabs", { title: "Par âge", items: [{ t: "École de foot", x: "U7 à U11 : jeu, motricité et plaisir, le mercredi et le samedi." }, { t: "Jeunes", x: "U13 à U18 : compétition de district et stages pendant les vacances." }, { t: "Seniors", x: "Équipe première, réserve et vétérans." }, { t: "Féminines", x: "Une équipe à 11 et une section loisirs." }] }],
        ["proof:team", { items: [{ n: "Gaël Penhoët", r: "Entraîneur seniors" }, { n: "Sonia Bellec", r: "Responsable école de foot" }, { n: "Rémi Trévidic", r: "Coach U15" }] }],
        ["cta:band", { title: "Une séance d'essai gratuite.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "calendrier", name: "Calendrier", blocks: [
        ["misc:pagehead", { title: "Calendrier des matchs" }],
        ["misc:schedule", { title: "Ce week-end", items: [{ d: "Sam. 10 h", t: "U13 contre Stade Rivage", x: "Terrain 2." }, { d: "Sam. 13 h 30", t: "U17 contre ES Kervignac", x: "Terrain 1." }, { d: "Sam. 15 h", t: "Seniors contre FC des Landes", x: "Terrain d'honneur." }, { d: "Dim. 10 h", t: "Vétérans", x: "Match amical." }] }],
        ["misc:posts", { title: "Dernières actualités", count: 3, layout: "list" }],
        ["feat:accordion", { title: "Informations pratiques", items: [{ t: "Où se garer ?", x: "Parking de la salle des fêtes, à 100 m du stade." }, { t: "Y a-t-il une buvette ?", x: "Oui, tenue par les bénévoles les jours de match." }] }],
      ] },
      { key: "club", name: "Le club", blocks: [
        ["misc:pagehead", { title: "Le club" }],
        ["misc:story", { eyebrow: "Depuis 1964", title: "Un stade, des tribunes, des amis", paras: ["Fondée par quelques passionnés, l'association est restée fidèle à ses valeurs : un football accessible à tous, sans élitisme.", "Les entraîneurs sont formés par la fédération et soutenus par une centaine de parents bénévoles."], image: "portrait-1" }],
        ["feat:icons", { title: "Nos valeurs", items: [{ t: "Plaisir", x: "On joue d'abord pour s'amuser.", icon: "heart" }, { t: "Respect", x: "Des arbitres aux adversaires.", icon: "shield" }, { t: "Solidarité", x: "Aucun enfant laissé de côté.", icon: "users" }] }],
        ["feat:list2", { title: "Licence et cotisation (exemples)", items: [{ t: "U7 – U11 : 120 €" }, { t: "U13 – U18 : 150 €" }, { t: "Seniors : 180 €" }, { t: "Loisirs : 110 €" }] }],
      ] },
      contactPage("La secrétaire du club répond aux familles.", "Contacter le club", ["Écrire au secrétariat", "/contact"], "Stade du Moulin, rue des Tilleuls, 56100 Lorient", "Indiquez l'âge du joueur et la catégorie souhaitée."),
    ],
  },

  // 5. Club de tennis (vert anglais, clair)
  {
    key: "tennis-terrasse", name: "Terrasse & Court", category: "sport", tags: ["classique", "naturel", "editorial"], siteType: "Club de tennis",
    description: "Club de tennis feutré : vert anglais, blanc cassé et jaune balle, Libre Baskerville en titres, horaires de courts et école de tennis. Une ambiance de club-house, sans clinquant.",
    brand: "Tennis Club de la Terrasse",
    tokens: { colors: { primary: "#166534", secondary: "#0d3b22", accent: "#d4e157", background: "#fbfaf4", surface: "#f0efe3", text: "#1d2a22", muted: "#52605a" }, fonts: F("libre-baskerville", "karla"), radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.12, letterSpacing: -0.01 }, h2: { size: 34, weight: 700, lineHeight: 1.2 } }, border: { width: 1, color: "#d4d6c2" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "tennis-terrasse", motifs: ["botanical", "tiles", "arches"] },
    head: ["head:split", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Courts", "/courts"], ["École de tennis", "/ecole"], ["Adhésion", "/adhesion"], ["Contact", "/contact"]], cta: ["Réserver un court", "/contact"],
    contact: { address: "5 allée des Platanes, 33000 Bordeaux", phone: "05 56 90 12 74", email: "club@terrasse-court.example", hours: "Tous les jours, 8 h – 22 h", tagline: "Le jeu, le temps, le thé." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Tennis · Bordeaux", title: "Le plaisir du jeu sous les platanes.", sub: "Six courts en terre battue, deux en dur, une école de tennis et un club-house où l'on prolonge les échanges.", cta: ["Réserver un court", "/contact"], cta2: ["Voir l'école", "/ecole"] }],
        ["feat:icons", { eyebrow: "Le club", title: "Tout pour jouer", items: [{ t: "Six courts en terre battue", x: "Entretenus chaque matin.", icon: "sun" }, { t: "Deux courts éclairés", x: "Pour jouer jusqu'à 22 h.", icon: "moon" }, { t: "Club-house", x: "Terrasse, boissons, vestiaires.", icon: "home" }] }],
        ["gal:wall", { items: [{ t: "Courts en terre battue" }, { t: "Club-house" }, { t: "École de tennis" }, { t: "Tournoi d'été" }] }],
        ["misc:hours", { title: "Réservation des courts", rows: [["Lundi – vendredi", "8 h – 22 h"], ["Samedi", "8 h – 20 h"], ["Dimanche", "9 h – 19 h"]] }],
        ["proof:quotes", { items: [{ q: "Une terre battue impeccable et un accueil chaleureux.", n: "Odile V.", r: "adhérente, client fictif" }, { q: "Mes filles sont à l'école de tennis depuis deux ans, elles adorent.", n: "Julien C.", r: "parent, client fictif" }, { q: "Un club à taille humaine, on s'y fait vite des partenaires.", n: "Bruno T.", r: "adhérent, client fictif" }] }],
        ["cta:split", { title: "Une journée découverte pour les nouveaux.", sub: "Raquette prêtée, partenaire proposé.", cta: ["Demander", "/contact"] }],
      ] },
      { key: "courts", name: "Courts", blocks: [
        ["misc:pagehead", { title: "Les courts" }],
        ["feat:alt", { title: "Surfaces", items: [{ t: "Terre battue", x: "Six courts, jeu lent et glissé, arrosés chaque matin." }, { t: "Dur extérieur", x: "Deux courts éclairés, pour l'hiver." }] }],
        ["feat:rows", { title: "Règles de réservation", items: [{ t: "Créneau d'une heure", x: "Réservable sept jours à l'avance." }, { t: "Invités", x: "Deux invitations par mois et par adhérent." }, { t: "Tenue", x: "Chaussures adaptées à la terre battue." }] }],
        ["cta:band", { title: "Réservez votre prochain créneau.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "ecole", name: "École de tennis", blocks: [
        ["misc:pagehead", { title: "École de tennis" }],
        ["feat:steps", { title: "Du mini-tennis au compétiteur", items: [{ t: "Mini-tennis", x: "Balles lentes, terrain réduit.", d: "4 – 6 ans" }, { t: "Initiation", x: "Coup droit, revers, service.", d: "7 – 10 ans" }, { t: "Perfectionnement", x: "Tactique et matchs.", d: "11 – 15 ans" }, { t: "Compétition", x: "Interclubs et tournois.", d: "Dès 13 ans" }] }],
        ["proof:team", { items: [{ n: "Élodie Marchetti", r: "Directrice sportive" }, { n: "Karim Belaïd", r: "Moniteur, enfants" }, { n: "Thomas Deschamps", r: "Moniteur, adultes" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Faut-il une raquette ?", x: "Pas pour débuter : le club en prête." }, { t: "Combien d'enfants par groupe ?", x: "Six au maximum." }] }],
      ] },
      { key: "adhesion", name: "Adhésion", blocks: [
        ["misc:pagehead", { title: "Adhésion" }],
        ["feat:pricelist", { title: "Cotisations (exemples)", items: [{ t: "Adulte", x: "Accès aux courts et aux animations.", price: "260 €" }, { t: "Étudiant", x: "Jusqu'à 25 ans.", price: "170 €" }, { t: "Enfant", x: "Avec école de tennis.", price: "220 €" }, { t: "Couple", x: "Deux adultes.", price: "450 €" }] }],
        ["feat:checks", { title: "Inclus dans l'adhésion", cta: ["Demander un dossier", "/contact"], items: [{ t: "Licence fédérale" }, { t: "Accès aux courts" }, { t: "Tournoi interne" }, { t: "Soirées du club" }] }],
        ["misc:text", { eyebrow: "Bon à savoir", title: "Une cotisation étalée", paras: ["Le paiement se fait au club, par chèque ou virement, jamais en ligne : aucun règlement n'est simulé sur ce site."] }],
      ] },
      contactPage("Réservations et renseignements.", "Nous contacter", ["Écrire au club", "/contact"], "5 allée des Platanes, 33000 Bordeaux", "Indiquez votre niveau et vos disponibilités."),
    ],
  },

  // 6. Club d'escalade (teal)
  {
    key: "prise-verticale", name: "Prise Verticale", category: "sport", tags: ["ludique", "geometrique", "moderne"], siteType: "Club d'escalade",
    description: "Salle d'escalade de bloc : vert d'eau intense, blocs colorés, Krona One en titres, galerie en mosaïque et carnet de tarifs. Voies par niveau, cours enfants et sorties en falaise.",
    brand: "Prise Verticale",
    tokens: { colors: { primary: "#0f766e", secondary: "#134e4a", accent: "#f97316", background: "#f2fbf9", surface: "#ffffff", text: "#10302d", muted: "#46615e" }, fonts: F("krona-one", "hanken-grotesk"), radius: { sm: 8, md: 14, lg: 24, button: 999, field: 14, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 52, weight: 400, lineHeight: 1.1, letterSpacing: -0.02 }, h2: { size: 32, weight: 400, lineHeight: 1.2, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "prise-verticale", motifs: ["blobs", "objects", "mountains"] },
    head: ["head:float", {}], foot: ["foot:big", { title: "Prise Verticale" }],
    menu: [["Accueil", "/"], ["Voies", "/voies"], ["Cours", "/cours"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Première séance", "/contact"],
    contact: { address: "Halle Eiffel, 3 quai des Entrepôts, 38000 Grenoble", phone: "04 76 21 64 08", email: "salle@prise-verticale.example", hours: "Lundi – vendredi, 10 h – 23 h · Week-end, 9 h – 20 h", tagline: "Toujours un cran plus haut." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Escalade de bloc · Grenoble", title: "Grimpez, tombez, recommencez.", sub: "800 m² de blocs, 12 niveaux de couleur, tapis épais et un bar où l'on commente les voies.", cta: ["Réserver une première séance", "/contact"], cta2: ["Découvrir les voies", "/voies"] }],
        ["feat:grid-icons", { title: "Pourquoi grimper ici", items: [{ t: "300 blocs", x: "Renouvelés chaque mois.", icon: "layers" }, { t: "Tous niveaux", x: "Du jaune facile au noir expert.", icon: "trendingUp" }, { t: "Matériel prêté", x: "Chaussons et magnésie.", icon: "check" }, { t: "Bar et coworking", x: "Pour souffler entre deux blocs.", icon: "users" }] }],
        ["gal:masonry", { items: [{ t: "Le dévers" }, { t: "La dalle" }, { t: "Le coin enfants" }, { t: "Le bar" }, { t: "Le pan de 4,5 m" }, { t: "La zone d'échauffement" }] }],
        ["feat:pricelist", { title: "Entrées à l'unité", items: [{ t: "Entrée adulte", x: "Matériel non inclus.", price: "12 €" }, { t: "Location chaussons", x: "Magnésie incluse.", price: "4 €" }, { t: "Carte 10 entrées", x: "Valable 1 an.", price: "99 €" }] }],
        ["cta:band", { title: "Première séance avec un moniteur.", sub: "Durée 1 h 30, matériel compris.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "voies", name: "Voies", blocks: [
        ["misc:pagehead", { title: "Voies et blocs" }],
        ["feat:tabs", { title: "Par niveau", items: [{ t: "Jaune et vert", x: "Pour débuter : prises larges, bonnes prises de main." }, { t: "Bleu et rouge", x: "Équilibre, lecture de voie, premières traversées." }, { t: "Violet et noir", x: "Dévers, réglettes, grosse force." }] }],
        ["gal:carousel", { items: [{ t: "Bloc du mois", x: "Un dévers de 45°." }, { t: "Pan trapèze", x: "Un enchaînement à grande ouverture." }, { t: "Dalle technique", x: "Placer ses pieds." }] }],
        ["cta:split", { title: "Le coin des enfants ouvre à 14 h.", sub: "Dès 4 ans, avec un adulte.", cta: ["Voir les cours", "/cours"] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Cours et stages" }],
        ["feat:cards", { title: "Au choix", items: [{ t: "Initiation adulte", x: "Quatre séances pour grimper en autonomie.", icon: "user" }, { t: "École d'escalade", x: "6 – 14 ans, le mercredi.", icon: "star" }, { t: "Stage falaise", x: "Un week-end en site naturel.", icon: "mapPin" }] }],
        ["misc:schedule", { title: "Séances encadrées", items: [{ d: "Mer. 14 h", t: "Enfants 6 – 9 ans", x: "Jeu et motricité." }, { d: "Mer. 16 h", t: "Enfants 10 – 14 ans", x: "Technique et blocs." }, { d: "Jeu. 19 h", t: "Adultes initiation", x: "Quatre séances." }] }],
        ["proof:quotes", { items: [{ q: "Ma fille de 7 ans a pris confiance en elle en trois mois.", n: "Aurélie N.", r: "parent, client fictif" }, { q: "L'initiation m'a donné les bons gestes pour grimper seul.", n: "Mathieu G.", r: "adhérent, client fictif" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Mensuel", price: "49 €", period: "par mois", f: ["Accès illimité", "Un invité par mois"], cta: "Choisir", url: "/contact" }, { t: "Annuel", price: "480 €", period: "par an", f: ["Accès illimité", "Une initiation offerte", "Tarif réduit stages"], cta: "Choisir", url: "/contact", hl: true }, { t: "Étudiant", price: "39 €", period: "par mois", f: ["Accès illimité", "Justificatif demandé"], cta: "Choisir", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Faut-il un partenaire ?", x: "Non, le bloc se pratique sans corde ni partenaire." }, { t: "À partir de quel âge ?", x: "Dès 4 ans dans le coin enfants." }] }],
        ["cta:card", { title: "Envie d'essayer ?", cta: ["Réserver", "/contact"] }],
      ] },
      contactPage("Une question avant de venir ?", "Passez nous voir", ["Écrire à la salle", "/contact"], "3 quai des Entrepôts, 38000 Grenoble", "Dites-nous si vous êtes débutant ou confirmé."),
    ],
  },

  // 7. Club de running / trail (rose, clair)
  {
    key: "foulee-sauvage", name: "Foulée Sauvage", category: "sport", tags: ["audacieux", "moderne", "editorial"], siteType: "Club de running et trail",
    description: "Club de course à pied : rose vif, noir profond, Antonio en capitales étroites, grande couverture éditoriale. Sorties du week-end, plans d'entraînement et calendrier de courses.",
    brand: "Foulée Sauvage",
    tokens: { colors: { primary: "#be185d", secondary: "#18181b", accent: "#14b8a6", background: "#fff9fb", surface: "#ffffff", text: "#1c1017", muted: "#5a4a53" }, fonts: F("antonio", "schibsted-grotesk"), radius: { sm: 2, md: 6, lg: 12, button: 4, field: 6, card: 6 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 88, weight: 700, lineHeight: 0.92, letterSpacing: -0.01, transform: "uppercase" }, h2: { size: 46, weight: 700, lineHeight: 1, transform: "uppercase" } }, border: { width: 1, color: "#ecd5df" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "foulee-sauvage", motifs: ["topo", "ribbons", "mountains"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Association de course à pied : sorties route et trail, plans d'entraînement et courses du calendrier.", cols: [["Courir", "Sorties", "Plans", "Calendrier"], ["Association", "Adhésion", "Contact"]] }],
    menu: [["Accueil", "/"], ["Sorties", "/sorties"], ["Plans", "/plans"], ["Courses", "/courses"], ["Contact", "/contact"]], cta: ["Rejoindre une sortie", "/contact"],
    contact: { address: "Maison des associations, 14 chemin des Crêtes, 74000 Annecy", phone: "04 50 27 63 19", email: "bureau@foulee-sauvage.example", hours: "Permanence : jeudi 18 h – 20 h", tagline: "Plus loin, plus haut, ensemble." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Club de trail · Annecy", eyebrow: "Route et nature", title: "Courir ensemble, loin du bitume.", sub: "Sorties encadrées le mardi, le jeudi et le dimanche, du 5 km découverte au trail de 30 km en montagne.", cta: ["Rejoindre une sortie", "/contact"], cta2: ["Voir les plans", "/plans"] }],
        ["feat:numbered", { title: "Trois sorties par semaine", items: [{ t: "Mardi, 18 h 30", x: "Fractionné sur piste, tous niveaux." }, { t: "Jeudi, 18 h 30", x: "Sortie nature, 8 à 12 km." }, { t: "Dimanche, 8 h", x: "Longue sortie trail, 15 à 30 km." }] }],
        ["misc:schedule", { title: "Prochaines sorties", items: [{ d: "Mar. 18 h 30", t: "Fractionné piste", x: "Rendez-vous au stade." }, { d: "Jeu. 18 h 30", t: "Sortie lac", x: "10 km, allure libre." }, { d: "Dim. 8 h", t: "Semnoz", x: "20 km, 900 m de dénivelé." }] }],
        ["proof:statsbar", { items: [["210", "adhérents"], ["3", "sorties par semaine"], ["12", "courses par an"]] }],
        ["gal:strip", { title: "Dans la boue et le soleil", items: [{ t: "Crêtes" }, { t: "Ravito" }, { t: "Arrivée" }, { t: "Sentier" }, { t: "Départ" }] }],
        ["cta:card", { title: "Première sortie offerte.", sub: "Venez avec des chaussures de course et une bouteille d'eau.", cta: ["Je viens courir", "/contact"] }],
      ] },
      { key: "sorties", name: "Sorties", blocks: [
        ["misc:pagehead", { title: "Sorties encadrées" }],
        ["feat:strips", { title: "Selon votre allure", items: [{ t: "Groupe Découverte", x: "5 à 7 km à 8 min/km. On discute en courant." }, { t: "Groupe Endurance", x: "10 à 15 km à 6 min/km." }, { t: "Groupe Trail", x: "15 à 30 km avec dénivelé." }] }],
        ["misc:text", { eyebrow: "Sécurité", title: "Courir à plusieurs", paras: ["Chaque groupe est encadré par un animateur bénévole. Nous partons ensemble et attendons le dernier. Téléphone chargé et coupe-vent dans le sac en montagne."] }],
        ["cta:split", { title: "Quel groupe pour vous ?", cta: ["Demander conseil", "/contact"] }],
      ] },
      { key: "plans", name: "Plans", blocks: [
        ["misc:pagehead", { title: "Plans d'entraînement" }],
        ["feat:tabs", { title: "Objectifs", items: [{ t: "10 km en 8 semaines", x: "Trois séances par semaine, de 30 à 50 minutes." }, { t: "Semi-marathon", x: "Douze semaines, deux séances clés et une sortie longue." }, { t: "Trail 30 km", x: "Seize semaines avec travail en côte." }] }],
        ["feat:steps", { title: "Une semaine type", items: [{ t: "Lundi", x: "Repos ou mobilité.", d: "J1" }, { t: "Mardi", x: "Fractionné.", d: "J2" }, { t: "Jeudi", x: "Sortie facile.", d: "J4" }, { t: "Dimanche", x: "Sortie longue.", d: "J7" }] }],
        ["cta:band", { title: "Les plans sont gratuits pour les adhérents.", cta: ["Adhérer", "/contact"] }],
      ] },
      { key: "courses", name: "Courses", blocks: [
        ["misc:pagehead", { title: "Calendrier des courses" }],
        ["feat:rows", { title: "Rendez-vous de l'année (exemples)", items: [{ t: "Corrida de printemps", x: "10 km sur route, ambiance festive." }, { t: "Trail des Crêtes", x: "28 km, 1 400 m de dénivelé." }, { t: "Course du lac", x: "Semi-marathon autour du lac." }] }],
        ["misc:posts", { title: "Comptes-rendus", count: 3, layout: "grid" }],
        ["proof:big", { items: [{ q: "Je courais seul, j'ai trouvé un groupe. Mon premier semi, je le dois à mes copains de Foulée Sauvage.", n: "Sébastien K.", r: "adhérent, client fictif" }] }],
      ] },
      contactPage("Bureau, adhésion et premières sorties.", "Courir avec nous", ["Rejoindre le club", "/contact"], "14 chemin des Crêtes, 74000 Annecy", "Indiquez votre niveau et l'objectif visé."),
    ],
  },

  // 8. Centre équestre (brun, chaud)
  {
    key: "ecurie-carrousel", name: "Écurie du Carrousel", category: "sport", tags: ["chaleureux", "naturel", "classique"], siteType: "Centre équestre",
    description: "Centre équestre familial : brun selle, crème et vert prairie, Frank Ruhl Libre en titres, balades, poneys et passage des Galops. Une ambiance de ferme et de manège couvert.",
    brand: "Écurie du Carrousel",
    tokens: { colors: { primary: "#92400e", secondary: "#365314", accent: "#ca8a04", background: "#fbf6ec", surface: "#f3ead7", text: "#2b1d10", muted: "#5f4a36" }, fonts: F("frank-ruhl-libre", "red-hat-text"), radius: { sm: 4, md: 10, lg: 18, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 }, h2: { size: 36, weight: 700, lineHeight: 1.15 } } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "ecurie-carrousel", motifs: ["dunes", "botanical", "arches"] },
    head: ["head:side", {}], foot: ["foot:columns", { about: "Poney-club et centre équestre familial : cours, balades, pensions et stages pendant les vacances.", cols: [["Équitation", "Cours", "Balades", "Stages"], ["Pratique", "Tarifs", "Contact"]] }],
    menu: [["Accueil", "/"], ["Cours", "/cours"], ["Balades", "/balades"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Baptême poney", "/contact"],
    contact: { address: "Lieu-dit Le Haras, route de Pontivy, 56300 Pontivy", phone: "02 97 25 70 46", email: "ecurie@carrousel.example", hours: "Mardi – dimanche, 9 h – 19 h (fermé le lundi)", tagline: "Au pas, au trot, au galop." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Centre équestre · Pontivy", title: "Apprendre à monter, apprendre à aimer.", sub: "Poneys pour les petits, chevaux pour les grands, manège couvert et carrière : un lieu familial ouvert toute l'année.", cta: ["Réserver un baptême", "/contact"], cta2: ["Voir les cours", "/cours"] }],
        ["feat:rows", { eyebrow: "Au centre équestre", title: "Pour tous les cavaliers", items: [{ t: "Poney-club", x: "Dès 3 ans, avec jeux, soins et petites balades." }, { t: "Cours de cheval", x: "Dressage, saut d'obstacles et passage des Galops." }, { t: "Pensions et demi-pensions", x: "Boxes, paddocks et prairie, avec soins quotidiens." }] }],
        ["gal:carousel", { items: [{ t: "Le manège couvert", x: "800 m² de sable." }, { t: "Les poneys", x: "Douze Shetlands et Welsh." }, { t: "La carrière", x: "Pour le saut en plein air." }] }],
        ["proof:team", { items: [{ n: "Valérie Quéméner", r: "Monitrice BPJEPS" }, { n: "Antoine Le Bihan", r: "Moniteur, saut d'obstacles" }, { n: "Lou Rannou", r: "Soigneuse et animatrice" }] }],
        ["cta:image", { title: "Un baptême poney de 30 minutes.", sub: "Pour les 3 – 6 ans, avec un parent.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Cours et Galops" }],
        ["feat:steps", { title: "Du Galop 1 au Galop 4", items: [{ t: "Galop 1", x: "Approcher, panser, marcher.", d: "Débutant" }, { t: "Galop 2", x: "Trotter, mener son poney.", d: "6 mois" }, { t: "Galop 3", x: "Galoper, sauter de petits obstacles.", d: "1 an" }, { t: "Galop 4", x: "Parcours et dressage.", d: "2 ans" }] }],
        ["misc:schedule", { title: "Séances de la semaine", items: [{ d: "Mer. 10 h", t: "Poneys 4 – 7 ans", x: "Jeux et initiation." }, { d: "Mer. 14 h", t: "Poneys 8 – 12 ans", x: "Galop 1 et 2." }, { d: "Sam. 10 h", t: "Adultes débutants", x: "Chevaux calmes." }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Faut-il un équipement ?", x: "Une bombe est prêtée la première fois ; prévoir pantalon long et chaussures fermées." }, { t: "Mon enfant a peur des animaux.", x: "Nous commençons au sol, à son rythme." }] }],
      ] },
      { key: "balades", name: "Balades", blocks: [
        ["misc:pagehead", { title: "Balades et stages" }],
        ["feat:alt", { title: "Sortir du manège", items: [{ t: "Balade en forêt", x: "Deux heures dans les bois du Haras, pour cavaliers de Galop 2 et plus." }, { t: "Stage de vacances", x: "Cinq jours pour monter, soigner et jouer, de 7 à 14 ans." }] }],
        ["proof:quotes", { items: [{ q: "Mes enfants rêvaient d'un poney, ils ont trouvé une deuxième famille.", n: "Nathalie B.", r: "parent, client fictif" }, { q: "La balade en forêt était calme et très bien encadrée.", n: "Pierre A.", r: "cavalier, client fictif" }] }],
        ["cta:band", { title: "Stages d'été : places limitées.", cta: ["Renseignements", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs (exemples)" }],
        ["feat:pricelist", { title: "Cours et activités", items: [{ t: "Baptême poney, 30 min", x: "3 – 6 ans.", price: "18 €" }, { t: "Séance collective, 1 h", x: "Poney ou cheval.", price: "26 €" }, { t: "Forfait 10 séances", x: "Valable 1 an.", price: "230 €" }, { t: "Balade en forêt, 2 h", x: "Galop 2 requis.", price: "45 €" }, { t: "Stage de 5 jours", x: "Repas non inclus.", price: "210 €" }] }],
        ["feat:list2", { title: "Licence et assurance", items: [{ t: "Licence fédérale obligatoire" }, { t: "Cotisation annuelle du club" }, { t: "Certificat médical conseillé" }, { t: "Paiement au centre équestre" }] }],
        ["cta:split", { title: "Une question sur les prix ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      contactPage("Le centre est ouvert du mardi au dimanche.", "Venir au centre", ["Écrire au centre", "/contact"], "route de Pontivy, 56300 Pontivy", "Précisez l'âge du cavalier et son niveau."),
    ],
  },

  // 9. Coach sportif personnel (magenta)
  {
    key: "cap-sur-vous", name: "Cap sur Vous", category: "sport", tags: ["chaleureux", "moderne", "minimaliste"], siteType: "Coach sportif personnel",
    description: "Coach sportif indépendant : violet-magenta, crème douce, Gabarito en titres arrondis, bilan, programmes à domicile et tarifs en forfaits. Un site simple pour réserver un premier bilan.",
    brand: "Cap sur Vous · Coaching",
    tokens: { colors: { primary: "#a21caf", secondary: "#4a044e", accent: "#fb923c", background: "#fdf8fc", surface: "#f7ebf5", text: "#2a1229", muted: "#5d4a5c" }, fonts: F("gabarito", "instrument-sans"), radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 20 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.06, letterSpacing: -0.02 }, h2: { size: 34, weight: 700, lineHeight: 1.15, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "pill" }, art: { seed: "cap-sur-vous", motifs: ["blobs", "ribbons", "bokeh"] },
    head: ["head:bar", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Programmes", "/programmes"], ["Ma méthode", "/methode"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Bilan offert", "/contact"],
    contact: { address: "Déplacements à domicile et en parc, secteur Toulouse et alentours", phone: "06 12 48 90 31", email: "bonjour@cap-sur-vous.example", hours: "Lundi – samedi, 7 h – 20 h (sur rendez-vous)", tagline: "Un coach, un objectif, un plan." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Coaching sportif · Toulouse", title: "Votre objectif, mon plan, nos séances.", sub: "Remise en forme, perte de poids, préparation de course ou reprise après blessure : un coach qui vient à vous.", cta: ["Réserver mon bilan offert", "/contact"], cta2: ["Voir les programmes", "/programmes"] }],
        ["feat:checks", { title: "Ce qui est inclus", cta: ["Parler de mon objectif", "/contact"], items: [{ t: "Bilan de 45 minutes" }, { t: "Programme écrit sur mesure" }, { t: "Séances à domicile ou en extérieur" }, { t: "Suivi par message entre deux séances" }] }],
        ["proof:quotes", { items: [{ q: "En six mois, j'ai repris confiance dans mon corps. Les séances sont exigeantes mais bienveillantes.", n: "Delphine A.", r: "cliente, client fictif" }, { q: "Un plan clair, des séances sérieuses et aucun jugement.", n: "Farid S.", r: "client, client fictif" }, { q: "Mon coach s'est adapté à mon dos fragile.", n: "Claire D.", r: "cliente, client fictif" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il du matériel ?", x: "Je viens avec mon sac : élastiques, haltères et tapis." }, { t: "Puis-je annuler une séance ?", x: "Oui, jusqu'à 24 h avant sans frais." }, { t: "Travaillez-vous avec un médecin ?", x: "Oui, en cas de pathologie, j'échange avec votre médecin avec votre accord." }] }],
        ["cta:band", { title: "Premier bilan offert, sans engagement.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "programmes", name: "Programmes", blocks: [
        ["misc:pagehead", { title: "Programmes" }],
        ["feat:cards", { title: "Selon votre objectif", items: [{ t: "Remise en forme", x: "Retrouver du souffle et de l'énergie.", icon: "heart" }, { t: "Perte de poids", x: "Renforcement, cardio et conseils d'hygiène de vie.", icon: "trendingUp" }, { t: "Préparation course", x: "10 km, semi, trail.", icon: "activity" }, { t: "Reprise après blessure", x: "En lien avec le kinésithérapeute.", icon: "shield" }] }],
        ["feat:steps", { title: "Un programme de 12 semaines", items: [{ t: "Bilan", x: "Mesures, objectifs, contraintes.", d: "Semaine 0" }, { t: "Fondations", x: "Technique et régularité.", d: "S1 – S4" }, { t: "Progression", x: "Charge et intensité.", d: "S5 – S8" }, { t: "Consolidation", x: "Autonomie et bilan final.", d: "S9 – S12" }] }],
        ["cta:split", { title: "Quel programme est fait pour vous ?", cta: ["Échanger", "/contact"] }],
      ] },
      { key: "methode", name: "Ma méthode", blocks: [
        ["misc:pagehead", { title: "Ma méthode" }],
        ["misc:story", { eyebrow: "À propos", title: "Dix ans d'accompagnement", paras: ["Coach diplômée d'État, j'accompagne des adultes de 25 à 70 ans qui veulent bouger sans se forcer à devenir des athlètes.", "Mon principe : un objectif réaliste, un plan écrit, et le plaisir de s'entraîner."], image: "portrait-3" }],
        ["feat:numbered", { title: "Trois principes", items: [{ t: "Progressivité", x: "On monte en charge doucement." }, { t: "Régularité", x: "Deux séances par semaine suffisent." }, { t: "Plaisir", x: "Un programme que l'on tient." }] }],
        ["proof:stats", { items: [["120", "personnes accompagnées"], ["10", "ans d'expérience"], ["2", "séances par semaine"]] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs (exemples)" }],
        ["price:tiers", { items: [{ t: "Séance unique", price: "55 €", f: ["1 h à domicile ou en parc", "Programme de la séance"], cta: "Réserver", url: "/contact" }, { t: "Forfait 10", price: "480 €", f: ["10 séances", "Programme sur mesure", "Suivi par message"], cta: "Choisir", url: "/contact", hl: true }, { t: "Duo", price: "80 €", period: "la séance", f: ["Pour deux personnes", "Même objectif"], cta: "Réserver", url: "/contact" }] }],
        ["feat:list2", { title: "Précisions", items: [{ t: "Bilan initial offert" }, { t: "Paiement en direct, aucun paiement en ligne" }, { t: "Déplacement inclus dans un rayon de 15 km" }, { t: "Séances reportables 24 h avant" }] }],
        ["cta:band", { title: "Un doute sur la formule ?", cta: ["Me contacter", "/contact"] }],
      ] },
      contactPage("Je réponds sous 24 h, le plus souvent dans l'heure.", "Parlons de votre objectif", ["Prendre rendez-vous", "/contact"], "secteur de Toulouse", "Quel est votre objectif et à quelle fréquence souhaitez-vous vous entraîner ?"),
    ],
  },
];
