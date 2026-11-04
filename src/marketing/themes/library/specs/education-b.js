// Éducation (lot B, 11 thèmes). Textes de DÉMONSTRATION : structures, personnes et coordonnées fictives, remplaçables dans l'éditeur.
const F = (h, b) => ({ heading: h, body: b, button: b, link: b });
const contact = (sub, title, cta, mapAddress, formIntro) => ({
  key: "contact", name: "Contact", blocks: [
    ["misc:pagehead", { title: "Contact", sub }],
    ["contact:info", { title, formTitle: "Écrivez-nous", formIntro, cta: [cta, "/contact"] }],
    ["contact:map", { title: "Nous trouver", mapAddress }],
  ],
});
const contactCards = (sub, title, cta, formIntro) => ({
  key: "contact", name: "Contact", blocks: [
    ["misc:pagehead", { title: "Contact", sub }],
    ["contact:cards", { title, formTitle: "Écrivez-nous", formIntro, cta: [cta, "/contact"] }],
    ["misc:faq", { title: "Avant de nous écrire", items: [{ t: "Sous quel délai répondez-vous ?", x: "En général sous deux jours ouvrés, plus vite par téléphone." }, { t: "Puis-je venir sans rendez-vous ?", x: "Mieux vaut nous prévenir : nous vous accueillons ainsi plus longuement." }] }],
  ],
});

module.exports = [
  // 1. Coach de vie / professionnel en ligne
  {
    key: "aubelio", name: "Aubélio", category: "education", tags: ["chaleureux", "editorial"], siteType: "Coach de vie et professionnel en ligne",
    description: "Rose brique, sable clair et titres Prata : un coach en visioconférence qui rassure, présente sa méthode en étapes et propose un premier échange offert.",
    brand: "Aubélio Coaching",
    tokens: { colors: { primary: "#9d174d", secondary: "#3b1d2e", accent: "#d99a3d", background: "#fbf6f0", surface: "#ffffff", text: "#2a1a22", muted: "#665560" }, fonts: F("font.prata", "font.outfit"), radius: { sm: 6, md: 12, lg: 20, button: 999, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#e8dacd" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "pill" }, art: { seed: "aubelio", motifs: ["blobs", "bokeh", "arches"] },
    head: ["head:minimal", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Ma méthode", "/methode"], ["Accompagnements", "/accompagnements"], ["Formations", "/formations"], ["Contact", "/contact"]], cta: ["Séance découverte offerte", "/contact"],
    contact: { address: "Séances en visioconférence, depuis Nantes", phone: "06 12 48 30 76", email: "bonjour@aubelio.example", hours: "Mardi – vendredi, 9 h – 19 h", tagline: "Retrouver le cap, à votre rythme." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Coaching de vie et de carrière, en ligne", title: "Reprenez la main sur votre trajectoire.", sub: "Un accompagnement individuel en visioconférence pour clarifier vos envies, oser la reconversion ou retrouver de l'énergie au travail.", cta: ["Réserver ma séance offerte", "/contact"], cta2: ["Découvrir la méthode", "/methode"], image: "hero", stats: [["320", "personnes accompagnées (exemple)"], ["8", "séances en moyenne"], ["100 %", "en visio"]] }],
        ["feat:steps", { eyebrow: "Comment ça se passe", title: "Un parcours en quatre temps", items: [{ t: "Séance découverte", x: "45 minutes offertes pour poser votre situation et vérifier que le courant passe.", d: "Semaine 1" }, { t: "Bilan et objectifs", x: "Nous formulons ensemble trois objectifs concrets et mesurables.", d: "Semaine 2" }, { t: "Séances de travail", x: "Un rendez-vous toutes les deux semaines, avec des exercices entre deux.", d: "Semaines 3 à 14" }, { t: "Consolidation", x: "Un point à trois mois pour ancrer les changements.", d: "Mois 6" }] }],
        ["proof:big", { items: [{ q: "En six séances, j'ai osé demander l'évolution que je repoussais depuis trois ans.", n: "Claire M.", r: "cadre, cliente fictive" }] }],
        ["feat:bento", { eyebrow: "Domaines d'accompagnement", title: "Là où je peux vous aider", bg: "token:surface", items: [{ t: "Reconversion professionnelle", x: "Explorer, tester puis décider sans vous précipiter.", icon: "briefcase" }, { t: "Confiance et prise de parole", x: "Poser votre voix.", icon: "sparkles" }, { t: "Équilibre de vie", x: "Remettre du souffle dans votre semaine.", icon: "sun" }] }],
        ["cta:card", { title: "Et si on commençait par en parler ?", sub: "Quarante-cinq minutes, sans engagement.", cta: ["Choisir un créneau", "/contact"] }],
      ] },
      { key: "methode", name: "Ma méthode", blocks: [
        ["misc:pagehead", { title: "Ma méthode", sub: "Ni recette miracle, ni jargon" }],
        ["misc:story", { eyebrow: "Mon parcours", title: "Dix ans de ressources humaines, puis le coaching", paras: ["Après une carrière en entreprise, j'ai choisi d'accompagner ceux qui hésitent à franchir un cap.", "Certifiée en coaching professionnel (exemple), je travaille en écoute active et en questionnement, sans jamais décider à votre place."], image: "portrait-1" }],
        ["feat:grid-icons", { title: "Mes principes", items: [{ t: "Confidentialité", x: "Ce qui se dit en séance reste en séance.", icon: "lock" }, { t: "Concret", x: "Chaque séance débouche sur une action.", icon: "checkCircle" }, { t: "Respect du rythme", x: "Vous avancez à votre pas.", icon: "heart" }] }],
      ] },
      { key: "accompagnements", name: "Accompagnements", blocks: [
        ["misc:pagehead", { title: "Accompagnements", sub: "Des formules simples, sans abonnement caché" }],
        ["price:tiers", { items: [{ t: "Séance unique", price: "80 €", period: "la séance", x: "Pour débloquer une question précise.", f: ["60 minutes en visio", "Compte rendu écrit"], cta: "Réserver", url: "/contact" }, { t: "Parcours 6 séances", price: "420 €", period: "sur 3 mois", x: "Le plus choisi.", f: ["6 séances de 60 minutes", "Exercices entre les séances", "Échanges par message"], cta: "Réserver", url: "/contact", hl: true }, { t: "Parcours reconversion", price: "890 €", period: "sur 6 mois", x: "Pour changer de métier.", f: ["12 séances", "Bilan de compétences guidé", "Préparation d'entretiens"], cta: "Réserver", url: "/contact" }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Les séances sont-elles remboursées ?", x: "Cela dépend de votre financeur ; une facture détaillée vous est remise." }, { t: "Faut-il une webcam ?", x: "Oui, ou à défaut un simple appel téléphonique." }] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations", sub: "Se former à son rythme" }],
        ["misc:courses", {}],
        ["cta:band", { title: "Une question sur un parcours ?", cta: ["Me contacter", "/contact"] }],
      ] },
      contact("Premier échange offert", "Parlons de votre projet", "Envoyer ma demande", "Séances en visioconférence", "Dites-moi en quelques lignes ce qui vous amène."),
    ],
  },
  // 2. Auto-école
  {
    key: "clignotis", name: "Clignotis", category: "education", tags: ["moderne", "audacieux"], siteType: "Auto-école (permis B, conduite accompagnée)",
    description: "Bleu signalisation, jaune vif en touche et titres Chivo : une auto-école de quartier qui affiche forfaits, taux de réussite exemples et réservation de leçons.",
    brand: "Auto-École Clignotis",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0f2a6b", accent: "#facc15", background: "#f5f8ff", surface: "#ffffff", text: "#0f1b3d", muted: "#4a5578" }, fonts: F("font.chivo", "font.work-sans"), radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 12 }, shadow: { card: "md", button: "sm" }, border: { width: 1, color: "#d3ddf5" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.05, letterSpacing: -0.02 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "clignotis", motifs: ["rays", "tiles", "skyline"] },
    head: ["head:topbar", { info: "Code en salle : lundi, mercredi et samedi", note: "Tél. 04 72 10 55 31" }],
    foot: ["foot:columns", { about: "Auto-école indépendante (exemple) : permis B, conduite accompagnée et stages de remise à niveau.", cols: [["Permis", "Forfaits", "Code de la route", "Conduite accompagnée"], ["Pratique", "Horaires", "Contact"]] }],
    menu: [["Accueil", "/"], ["Forfaits", "/forfaits"], ["Code et conduite", "/code-conduite"], ["Résultats", "/resultats"], ["Contact", "/contact"]], cta: ["Je m'inscris", "/contact"],
    contact: { address: "27 avenue Jean-Mermoz, 69008 Lyon", phone: "04 72 10 55 31", email: "inscription@clignotis.example", hours: "Lundi – samedi, 9 h – 19 h", tagline: "Votre permis, sans stress." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Permis B, AAC et boîte automatique", title: "Votre permis, à votre allure.", sub: "Moniteurs patients, voitures récentes à double commande et planning de conduite que vous choisissez depuis votre téléphone.", cta: ["Voir les forfaits", "/forfaits"], cta2: ["Nous appeler", "/contact"], image: "hero" }],
        ["feat:icons", { title: "Pourquoi nous choisir", items: [{ t: "Moniteurs diplômés", x: "Une équipe stable, un moniteur référent du début à l'examen.", icon: "user" }, { t: "Code en ligne et en salle", x: "Entraînement illimité sur tablette, séances commentées trois fois par semaine.", icon: "monitor" }, { t: "Planning flexible", x: "Leçons de 1 h le soir, le samedi ou en vacances.", icon: "calendarClock" }, { t: "Prix clairs", x: "Forfaits affichés, aucun frais caché.", icon: "tag" }] }],
        ["proof:statsbar", { items: [["86 %", "de réussite au 1er passage (exemple)"], ["35 h", "de conduite en moyenne"], ["12", "véhicules"], ["4,8/5", "avis élèves (exemple)"]] }],
        ["feat:tabs", { title: "Quel permis pour vous ?", items: [{ t: "Permis B classique", x: "À partir de 17 ans, 20 heures minimum de conduite, boîte manuelle ou automatique." }, { t: "Conduite accompagnée", x: "Dès 15 ans, 3 000 km avec un accompagnateur avant l'examen." }, { t: "Remise à niveau", x: "Pour reprendre confiance après une longue pause ou un échec." }] }],
        ["proof:quotes", { title: "Ils ont eu leur permis", items: [{ q: "Mon moniteur m'a appris à ne plus paniquer aux ronds-points.", n: "Léa P.", r: "élève, cliente fictive" }, { q: "Planning souple, parfait avec mes cours à la fac.", n: "Karim T.", r: "élève, client fictif" }, { q: "Reçu du premier coup, avec le sourire.", n: "Julie R.", r: "élève, cliente fictive" }] }],
      ] },
      { key: "forfaits", name: "Forfaits", blocks: [
        ["misc:pagehead", { title: "Forfaits", sub: "Tarifs de démonstration" }],
        ["price:tiers", { items: [{ t: "Permis B essentiel", price: "990 €", x: "Le forfait de départ.", f: ["20 h de conduite", "Code en ligne illimité", "Présentation à l'examen"], cta: "S'inscrire", url: "/contact" }, { t: "Permis B confort", price: "1 390 €", x: "Notre forfait le plus choisi.", f: ["30 h de conduite", "Code en salle et en ligne", "2 rendez-vous pédagogiques"], cta: "S'inscrire", url: "/contact", hl: true }, { t: "Conduite accompagnée", price: "1 190 €", x: "À partir de 15 ans.", f: ["20 h de conduite", "2 rendez-vous pédagogiques", "Suivi des 3 000 km"], cta: "S'inscrire", url: "/contact" }] }],
        ["feat:pricelist", { title: "À la carte", items: [{ t: "Leçon de conduite d'1 heure", x: "Tarif unitaire", price: "46 €" }, { t: "Forfait code seul", x: "Accès illimité 3 mois", price: "99 €" }, { t: "Présentation à l'examen pratique", x: "Accompagnement le jour J", price: "80 €" }] }],
      ] },
      { key: "code-conduite", name: "Code et conduite", blocks: [
        ["misc:pagehead", { title: "Code et conduite", sub: "Les étapes jusqu'à l'examen" }],
        ["feat:steps", { title: "Votre parcours", items: [{ t: "Inscription et évaluation", x: "Une heure de conduite pour mesurer votre niveau.", d: "Jour 1" }, { t: "Code de la route", x: "Entraînement en ligne, puis examen en centre agréé.", d: "Semaines 1 à 6" }, { t: "Conduite", x: "Leçons progressives : manœuvres, ville puis route.", d: "Semaines 4 à 14" }, { t: "Examen pratique", x: "Rendez-vous de préparation la veille.", d: "Jour J" }] }],
        ["misc:schedule", { title: "Séances de code en salle", items: [{ d: "Lundi 18 h", t: "Signalisation et priorités", x: "Questions commentées en groupe." }, { d: "Mercredi 18 h", t: "Situations dangereuses", x: "Vitesse, distances et conduite sous la pluie." }, { d: "Samedi 10 h", t: "Examens blancs", x: "Conditions réelles, correction à chaud." }] }],
      ] },
      { key: "resultats", name: "Résultats", blocks: [
        ["misc:pagehead", { title: "Résultats", sub: "Chiffres d'exemple" }],
        ["proof:stats", { items: [["86 %", "réussite à l'examen pratique"], ["93 %", "réussite au code"], ["31 h", "moyenne de conduite"], ["412", "élèves formés (exemple)"]] }],
        ["misc:quote", { text: "Un taux de réussite se construit leçon après leçon, pas la veille de l'examen.", by: "Direction de l'auto-école" }],
      ] },
      contactCards("Inscriptions toute l'année", "Venez nous rencontrer", "Demander un rendez-vous", "Précisez le permis souhaité et vos disponibilités."),
    ],
  },
  // 3. Crèche / micro-crèche
  {
    key: "nidouillet", name: "Nidouillet", category: "education", tags: ["ludique", "chaleureux"], siteType: "Micro-crèche (accueil de 10 enfants)",
    description: "Vert tendre, beurre doux et titres Baloo 2 arrondis : une micro-crèche qui parle aux parents, journée type, équipe, tarifs et pré-inscription.",
    brand: "Micro-crèche Le Nidouillet",
    tokens: { colors: { primary: "#3f7d20", secondary: "#2d4a1c", accent: "#f2b134", background: "#fffbea", surface: "#ffffff", text: "#2b3a1f", muted: "#586349" }, fonts: F("font.baloo-2", "font.rubik"), radius: { sm: 10, md: 18, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "sm", button: "none" }, border: { width: 2, color: "#eadf9f" } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "pill" }, art: { seed: "nidouillet", motifs: ["blobs", "botanical", "bokeh"] },
    head: ["head:float", {}],
    foot: ["foot:newsletter", { title: "Les nouvelles du nid", sub: "Menus de la semaine et photos des activités, une fois par mois.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Une journée au nid", "/journee"], ["L'équipe", "/equipe"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Pré-inscrire mon enfant", "/contact"],
    contact: { address: "5 chemin des Noisetiers, 44300 Nantes", phone: "02 40 55 18 20", email: "nid@nidouillet.example", hours: "Lundi – vendredi, 7 h 30 – 18 h 30", tagline: "Un petit nid pour grandir en douceur." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Micro-crèche de 10 places", title: "Un petit nid pour grandir en douceur.", sub: "Une équipe de quatre professionnelles, des repas faits maison et une adaptation sur mesure pour chaque tout-petit, de 10 semaines à 3 ans.", cta: ["Pré-inscrire mon enfant", "/contact"], cta2: ["Voir une journée type", "/journee"], image: "hero" }],
        ["feat:cards", { title: "Ce qui compte pour nous", items: [{ t: "Petit effectif", x: "Dix enfants, quatre adultes : chacun est connu et reconnu.", icon: "heart" }, { t: "Cuisine maison", x: "Repas préparés sur place avec des produits de saison.", icon: "sun" }, { t: "Dehors tous les jours", x: "Jardin, balades et jardinage dès que le temps le permet.", icon: "sparkles" }] }],
        ["gal:wall", { items: [{ t: "Atelier peinture" }, { t: "Sieste au calme" }, { t: "Jardin" }, { t: "Histoires du matin" }] }],
        ["proof:quotes", { title: "Des parents confiants", items: [{ q: "L'adaptation s'est faite en douceur, notre fils pleurait à peine.", n: "Sophie A.", r: "maman, cliente fictive" }, { q: "On reçoit des photos de la journée, c'est rassurant.", n: "Thomas G.", r: "papa, client fictif" }, { q: "Une équipe attentive et chaleureuse.", n: "Awa D.", r: "maman, cliente fictive" }] }],
        ["cta:image", { title: "Venez visiter le nid.", sub: "Visite ouverte aux familles chaque premier samedi du mois.", cta: ["Réserver une visite", "/contact"] }],
      ] },
      { key: "journee", name: "Une journée au nid", blocks: [
        ["misc:pagehead", { title: "Une journée au nid", sub: "Rythme respecté, jamais pressé" }],
        ["misc:schedule", { title: "Journée type", items: [{ d: "7 h 30", t: "Accueil échelonné", x: "Les transmissions se font au calme avec les parents." }, { d: "9 h 30", t: "Éveil et ateliers", x: "Motricité, musique, peinture ou comptines." }, { d: "11 h 15", t: "Déjeuner", x: "Repas maison, chacun à son rythme." }, { d: "12 h 30", t: "Sieste", x: "Dortoir au calme, doudou et veilleuse." }, { d: "15 h 30", t: "Goûter et jardin", x: "Jeux dehors et lecture d'histoires." }] }],
        ["feat:list2", { title: "Dans le sac de votre enfant", items: [{ t: "Un change complet" }, { t: "Un doudou" }, { t: "Un chapeau ou des bottes selon la saison" }, { t: "Le carnet de santé" }] }],
      ] },
      { key: "equipe", name: "L'équipe", blocks: [
        ["misc:pagehead", { title: "L'équipe", sub: "Quatre professionnelles passionnées" }],
        ["proof:team", { items: [{ n: "Mélanie Roux", r: "Responsable, éducatrice de jeunes enfants" }, { n: "Fatou Camara", r: "Auxiliaire de puériculture" }, { n: "Inès Duval", r: "Auxiliaire petite enfance" }, { n: "Rosa Lemaire", r: "Cuisinière" }] }],
        ["misc:text", { title: "Notre projet pédagogique", paras: ["Nous accompagnons chaque enfant dans ses premières découvertes, sans le brusquer ni le comparer.", "Les parents sont associés à la vie du nid : ateliers partagés, café des parents et carnet de liaison."] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et inscriptions", sub: "Participation selon vos revenus (exemple)" }],
        ["feat:pricelist", { title: "Participation horaire", items: [{ t: "Familles aux revenus modestes", x: "Barème CAF appliqué (exemple)", price: "1,10 €/h" }, { t: "Revenus moyens", x: "Barème CAF appliqué (exemple)", price: "2,40 €/h" }, { t: "Revenus supérieurs", x: "Plafond du barème (exemple)", price: "3,90 €/h" }] }],
        ["misc:faq", { items: [{ t: "Comment se passe l'adaptation ?", x: "Sur une à deux semaines, avec des temps d'accueil progressifs." }, { t: "Les repas sont-ils compris ?", x: "Oui, repas et goûters sont inclus." }, { t: "Quand déposer un dossier ?", x: "Dès le sixième mois de grossesse, les places sont attribuées en commission." }] }],
      ] },
      contact("Pré-inscription et visites", "Parlons de la place de votre enfant", "Envoyer ma pré-inscription", "5 chemin des Noisetiers, 44300 Nantes", "Indiquez l'âge de votre enfant et vos besoins d'accueil."),
    ],
  },
  // 4. École de code pour enfants
  {
    key: "bitbambin", name: "Bitbambin", category: "education", tags: ["ludique", "audacieux"], siteType: "École de code pour enfants et adolescents",
    description: "Violet électrique, jaune vif et titres Unbounded très larges : une école de programmation pour 7-17 ans avec ateliers, stages de vacances et tarifs.",
    brand: "Bitbambin",
    tokens: { colors: { primary: "#6d28d9", secondary: "#2e1065", accent: "#fde047", background: "#faf7ff", surface: "#ffffff", text: "#1e1238", muted: "#554a73" }, fonts: F("font.unbounded", "font.rubik"), radius: { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 20 }, shadow: { card: "lg", button: "md" }, border: { width: 2, color: "#e4d9fb" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.02 }, h2: { size: 34, weight: 700, lineHeight: 1.15 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "bitbambin", motifs: ["tiles", "objects", "mesh"] },
    head: ["head:bar", {}],
    foot: ["foot:big", { title: "Bitbambin" }],
    menu: [["Accueil", "/"], ["Ateliers", "/ateliers"], ["Stages", "/stages"], ["Formations", "/formations"], ["Contact", "/contact"]], cta: ["Séance d'essai gratuite", "/contact"],
    contact: { address: "9 rue du Pixel, 31000 Toulouse", phone: "05 61 77 24 13", email: "hello@bitbambin.example", hours: "Mercredi et samedi, 9 h – 18 h", tagline: "Créer plutôt que consommer." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Codage pour les 7-17 ans", title: "Ton jeu vidéo, tu le codes.", sub: "Ateliers hebdomadaires et stages de vacances pour apprendre à programmer en s'amusant, à partir de projets que les enfants choisissent.", cta: ["Essai gratuit", "/contact"], cta2: ["Voir les ateliers", "/ateliers"] }],
        ["proof:logos", { title: "Nous utilisons", items: ["Scratch", "Python", "Minecraft Éducation", "Robots mBot"] }],
        ["feat:rows", { title: "Un parcours qui monte en niveau", items: [{ t: "Explorateurs, 7-9 ans", x: "Scratch, animations et petits jeux, sans clavier compliqué." }, { t: "Créateurs, 10-12 ans", x: "Jeux complets, sons, scores et premières variables." }, { t: "Développeurs, 13-17 ans", x: "Python, sites web et robotique avec capteurs." }] }],
        ["feat:numbered", { items: [{ t: "Petits groupes", x: "Huit élèves au plus par animateur." }, { t: "Projets finis", x: "Chaque trimestre se termine par un jeu partagé en famille." }, { t: "Sans écran en trop", x: "Défis débranchés et travail en équipe." }] }],
        ["proof:big", { items: [{ q: "Ma fille a créé son premier jeu en trois séances et m'a fait jouer le soir même.", n: "Nadia F.", r: "maman, cliente fictive" }] }],
        ["cta:split", { title: "Une séance d'essai, c'est gratuit.", sub: "Venez avec votre enfant un mercredi ou un samedi.", cta: ["Réserver l'essai", "/contact"] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ["misc:pagehead", { title: "Ateliers de l'année", sub: "1 h 30 par semaine, hors vacances" }],
        ["gal:coursecards", { title: "Les niveaux (démonstration)", items: [{ t: "Scratch Aventure", tag: "7-9 ans", price: "29 €/mois", x: "Animer des personnages et créer un premier jeu.", cta: "Réserver", url: "/contact" }, { t: "Jeux et sons", tag: "10-12 ans", price: "34 €/mois", x: "Un platformer complet avec score et musique.", cta: "Réserver", url: "/contact" }, { t: "Python et robots", tag: "13-17 ans", price: "39 €/mois", x: "Programmer un robot et analyser des capteurs.", cta: "Réserver", url: "/contact" }] }],
        ["feat:compare", { title: "Choisir son atelier", rows: [["", "Mercredi", "Samedi"], ["Horaires", "14 h – 15 h 30", "10 h – 11 h 30"], ["Âges", "7-12 ans", "10-17 ans"], ["Places", "Complet en octobre", "Disponibles"]] }],
      ] },
      { key: "stages", name: "Stages", blocks: [
        ["misc:pagehead", { title: "Stages de vacances", sub: "Une semaine pour créer un projet complet" }],
        ["feat:alt", { title: "Les stages", items: [{ t: "Mon premier jeu vidéo", x: "Cinq matinées pour concevoir, programmer et tester son jeu.", link: ["Réserver", "/contact"] }, { t: "Robots en folie", x: "Assembler et programmer un robot, puis le faire courir dans un labyrinthe.", link: ["Réserver", "/contact"] }] }],
        ["misc:faq", { items: [{ t: "Faut-il un ordinateur ?", x: "Non, le matériel est fourni sur place." }, { t: "Mon enfant n'a jamais codé", x: "Aucun prérequis, les groupes sont faits par niveau." }] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations en ligne", sub: "Pour continuer à la maison" }],
        ["misc:courses", {}],
        ["cta:band", { title: "Besoin d'un conseil sur le bon niveau ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      contact("Essai gratuit les mercredis et samedis", "Dites-nous tout", "Envoyer", "9 rue du Pixel, 31000 Toulouse", "Âge de l'enfant et créneau souhaité."),
    ],
  },
  // 5. Bibliothèque / médiathèque
  {
    key: "pagelune", name: "Pagelune", category: "education", tags: ["editorial", "classique"], siteType: "Médiathèque municipale",
    description: "Bleu-vert profond, papier chaud et titres Literata : une médiathèque de ville avec catalogue de recherche, animations, horaires et inscription gratuite.",
    brand: "Médiathèque Pagelune",
    tokens: { colors: { primary: "#0f766e", secondary: "#0d3b38", accent: "#e07a2f", background: "#f7f4ee", surface: "#fffdf8", text: "#16302e", muted: "#516664" }, fonts: F("font.literata", "font.jost"), radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d8d2c3" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "pagelune", motifs: ["plates", "topo", "halftone"] },
    head: ["head:masthead", { dateline: "Médiathèque ouverte du mardi au samedi" }],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Collections", "/collections"], ["Animations", "/animations"], ["Infos pratiques", "/infos"], ["Contact", "/contact"]], cta: ["S'inscrire gratuitement", "/infos"],
    contact: { address: "1 place des Lecteurs, 49100 Angers", phone: "02 41 66 08 24", email: "accueil@pagelune.example", hours: "Mardi – samedi, 10 h – 18 h", tagline: "Lire, écouter, apprendre, se retrouver." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Livres, films, musique et jeux", title: "Trouvez votre prochaine lecture.", sub: "Plus de 40 000 documents à emprunter, des espaces de travail et des rendez-vous toute l'année.", placeholder: "Titre, auteur, thème…", cta: ["Voir les collections", "/collections"], image: "hero" }],
        ["feat:strips", { title: "Ce que vous trouverez chez nous", items: [{ t: "Romans et documentaires", x: "Adultes, adolescents et jeunesse, avec une sélection de nouveautés chaque mois.", icon: "book" }, { t: "Musique et cinéma", x: "CD, vinyles et films à emprunter, plus un accès aux plateformes en ligne.", icon: "play" }, { t: "Espace numérique", x: "Postes en libre accès, imprimante et aide aux démarches en ligne.", icon: "monitor" }] }],
        ["gal:featured", { title: "Coups de cœur de l'équipe", items: [{ t: "Le jardin des heures", x: "Roman, sélection d'automne" }, { t: "Histoires de cartes", tag: "Documentaire" }, { t: "Le dragon de la rue Haute", tag: "Jeunesse" }, { t: "Vinyles du jeudi", tag: "Musique" }] }],
        ["misc:posts", { title: "Actualités de la médiathèque", count: 3, layout: "list" }],
        ["proof:statsbar", { items: [["40 000", "documents"], ["12", "rendez-vous par mois"], ["0 €", "inscription pour les moins de 18 ans"], ["6", "jours d'ouverture sur 7"]] }],
      ] },
      { key: "collections", name: "Collections", blocks: [
        ["misc:pagehead", { title: "Collections", sub: "Emprunt de 3 semaines, renouvelable" }],
        ["misc:search", {}],
        ["feat:accordion", { title: "Règles d'emprunt", items: [{ t: "Combien de documents ?", x: "Dix livres, cinq CD et trois films par carte." }, { t: "Comment réserver ?", x: "Au comptoir ou par téléphone, nous vous prévenons dès que le document est prêt." }, { t: "Que faire en cas de retard ?", x: "Pas de pénalité financière : une simple relance suffit." }] }],
      ] },
      { key: "animations", name: "Animations", blocks: [
        ["misc:pagehead", { title: "Animations", sub: "Gratuit sur inscription" }],
        ["misc:schedule", { title: "Ce mois-ci", items: [{ d: "Mercredi 10 h 30", t: "Heure du conte", x: "Histoires et comptines pour les 3-6 ans." }, { d: "Jeudi 18 h", t: "Club de lecture", x: "Échange autour du roman du mois." }, { d: "Samedi 15 h", t: "Atelier numérique", x: "Prise en main de la messagerie et des démarches en ligne." }] }],
        ["gal:cards", { title: "Rendez-vous réguliers", items: [{ t: "Jeux de société", tag: "Tous publics", x: "Un vendredi sur deux, avec ludothécaire." }, { t: "Café lecture", tag: "Adultes", x: "Un chocolat, un livre, aucune obligation de parler." }, { t: "Rencontre d'auteur", tag: "Soirée", x: "Échange avec un écrivain invité (exemple)." }] }],
      ] },
      { key: "infos", name: "Infos pratiques", blocks: [
        ["misc:pagehead", { title: "Infos pratiques", sub: "Horaires, inscription, accès" }],
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Mardi", "14 h – 18 h"], ["Mercredi", "10 h – 18 h"], ["Jeudi", "14 h – 18 h"], ["Vendredi", "14 h – 19 h"], ["Samedi", "10 h – 17 h"], ["Dimanche, lundi", "Fermé"]] }],
        ["feat:checks", { title: "S'inscrire en 5 minutes", cta: ["Nous écrire", "/contact"], items: [{ t: "Une pièce d'identité" }, { t: "Un justificatif de domicile" }, { t: "Gratuit pour les moins de 18 ans" }, { t: "12 € par an pour les adultes (exemple)" }] }],
      ] },
      contact("Une question ? Un document à proposer ?", "Écrire à l'équipe", "Envoyer", "1 place des Lecteurs, 49100 Angers", "Suggestion d'achat, réservation ou renseignement."),
    ],
  },
  // 6. École de cuisine
  {
    key: "casserolia", name: "Casserolia", category: "education", tags: ["chaleureux", "audacieux"], siteType: "École de cuisine (ateliers et cours)",
    description: "Safran profond, crème de cuisine et titres Yeseva One : une école de cuisine avec ateliers à la carte, cours du soir, bons cadeaux et formations.",
    brand: "L'École Casserolia",
    tokens: { colors: { primary: "#a16207", secondary: "#3a2a12", accent: "#b42318", background: "#fdf8ee", surface: "#ffffff", text: "#2c2012", muted: "#6a5a45" }, fonts: F("font.yeseva-one", "font.cabin"), radius: { sm: 4, md: 10, lg: 16, button: 6, field: 6, card: 12 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#ecdfc2" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "casserolia", motifs: ["objects", "ribbons", "botanical"] },
    head: ["head:split", {}],
    foot: ["foot:columns", { about: "École de cuisine amateurs et professionnels (exemple) : cours en petits groupes, produits frais, recettes à emporter.", cols: [["Cours", "Ateliers à la carte", "Cours du soir", "Bons cadeaux"], ["Pratique", "Contact", "Conditions d'annulation"]] }],
    menu: [["Accueil", "/"], ["Ateliers", "/ateliers"], ["Programme", "/programme"], ["Formations", "/formations"], ["Contact", "/contact"]], cta: ["Réserver un atelier", "/ateliers"],
    contact: { address: "18 rue des Halles, 33000 Bordeaux", phone: "05 56 90 31 47", email: "ateliers@casserolia.example", hours: "Mardi – samedi, 9 h – 21 h", tagline: "On apprend avec les mains." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "École de cuisine à Bordeaux", title: "Cuisinez, dégustez, recommencez.", sub: "Des ateliers de deux à trois heures en petit groupe, du pain au homard, avec des chefs qui partagent leurs gestes.", cta: ["Voir les ateliers", "/ateliers"], cta2: ["Offrir un atelier", "/contact"], image: "hero" }],
        ["feat:bento", { title: "Une cuisine pour tous les niveaux", items: [{ t: "Ateliers à la carte", x: "Pâtes fraîches, sushis, desserts de fête : un thème, un repas partagé à la fin.", icon: "sparkles" }, { t: "Cours du soir", x: "Dix soirées pour maîtriser les bases.", icon: "clock" }, { t: "Bons cadeaux", x: "Valables un an.", icon: "heart" }] }],
        ["gal:masonry", { items: [{ t: "Pâtes fraîches" }, { t: "Croissants" }, { t: "Cuisine thaï" }, { t: "Macarons" }, { t: "Marché du samedi" }] }],
        ["proof:quotes", { title: "Après l'atelier", items: [{ q: "Je ne pensais pas réussir un soufflé dès le premier essai.", n: "Anne-Laure C.", r: "élève, cliente fictive" }, { q: "Un cadeau d'anniversaire parfait, nous y retournons.", n: "Pierre V.", r: "élève, client fictif" }, { q: "Chef pédagogue et ambiance détendue.", n: "Samia B.", r: "élève, cliente fictive" }] }],
        ["cta:band", { title: "Prochains ateliers : places limitées à 10.", cta: ["Réserver", "/ateliers"] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ["misc:pagehead", { title: "Ateliers à la carte", sub: "Repas partagé à la fin de chaque séance" }],
        ["feat:pricelist", { title: "Tarifs de démonstration", items: [{ t: "Pâtes fraîches et sauces", x: "2 h 30, dégustation", price: "65 €" }, { t: "Pain au levain", x: "3 h, repartez avec votre pain", price: "70 €" }, { t: "Pâtisserie : tarte et crème", x: "3 h, boîte à emporter", price: "75 €" }, { t: "Cuisine végétale de saison", x: "2 h 30, dégustation", price: "62 €" }] }],
        ["feat:list2", { title: "Inclus dans chaque atelier", items: [{ t: "Tablier prêté" }, { t: "Recettes par e-mail" }, { t: "Boissons" }, { t: "Dégustation" }] }],
      ] },
      { key: "programme", name: "Programme", blocks: [
        ["misc:pagehead", { title: "Programme du mois", sub: "Dates d'exemple" }],
        ["misc:schedule", { title: "Au calendrier", items: [{ d: "Mar. 19 h", t: "Cuisine italienne", x: "Gnocchi, ragoût et tiramisu." }, { d: "Jeu. 19 h", t: "Cuisine japonaise", x: "Riz à sushi, makis et bouillon dashi." }, { d: "Sam. 10 h", t: "Brunch de l'école", x: "Œufs, viennoiseries et jus pressés." }] }],
        ["misc:faq", { title: "Pratique", items: [{ t: "Puis-je annuler ?", x: "Gratuitement jusqu'à 7 jours avant, sinon un report est possible." }, { t: "Les allergies sont-elles gérées ?", x: "Oui, prévenez-nous à la réservation." }] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations", sub: "Pour aller plus loin, à la maison" }],
        ["misc:courses", {}],
        ["cta:card", { title: "Un doute sur le niveau ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      contactCards("Réservations et bons cadeaux", "Une question avant de réserver ?", "Envoyer", "Dites-nous la date et le nombre de convives."),
    ],
  },
  // 7. École de danse
  {
    key: "pirouvelle", name: "Pirouvelle", category: "education", tags: ["sombre", "luxe"], siteType: "École de danse (classique, jazz, contemporain)",
    description: "Nuit prune, magenta lumineux et titres Bodoni Moda : une école de danse élégante avec planning des cours, professeurs, galas et inscription.",
    brand: "Pirouvelle, école de danse",
    tokens: { colors: { primary: "#e879f9", secondary: "#2a0f33", accent: "#fbbf24", background: "#150a1c", surface: "#22132d", text: "#f6eefb", muted: "#c6b3d3" }, fonts: F("font.bodoni-moda", "font.urbanist"), radius: { sm: 2, md: 4, lg: 8, button: 2, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3d2450" } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "pirouvelle", motifs: ["ribbons", "arches", "bokeh"] },
    head: ["head:center", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Disciplines", "/disciplines"], ["Planning", "/planning"], ["Professeurs", "/professeurs"], ["Contact", "/contact"]], cta: ["Cours d'essai", "/contact"],
    contact: { address: "40 rue de l'Opéra, 67000 Strasbourg", phone: "03 88 21 70 63", email: "studio@pirouvelle.example", hours: "Lundi – samedi, 10 h – 21 h", tagline: "Danser, à tout âge." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Danse classique, jazz et contemporain", title: "Laissez le mouvement parler.", sub: "Trois studios, quatre professeurs diplômés et un gala de fin d'année sur la scène du théâtre municipal, dès 4 ans et sans limite d'âge.", cta: ["Réserver un cours d'essai", "/contact"], image: "hero" }],
        ["feat:alt", { eyebrow: "Nos disciplines", title: "Chaque corps trouve son style", items: [{ t: "Classique", x: "Barre, milieu et variations, avec examens facultatifs.", link: ["Voir le détail", "/disciplines"] }, { t: "Jazz et contemporain", x: "Travail du sol, improvisation et chorégraphies de groupe." }, { t: "Hip-hop et éveil", x: "Dès 4 ans, découverte du rythme et de l'espace." }] }],
        ["proof:stats", { items: [["24", "cours par semaine"], ["320", "élèves (exemple)"], ["3", "studios"], ["1", "gala par an"]] }],
        ["proof:big", { items: [{ q: "À cinquante ans, j'ai repris la danse et je n'ai jamais retrouvé autant de légèreté.", n: "Véronique S.", r: "élève adulte, cliente fictive" }] }],
        ["gal:strip", { title: "Au studio", items: [{ t: "Barre" }, { t: "Pointes" }, { t: "Jazz" }, { t: "Gala" }, { t: "Éveil" }] }],
        ["cta:image", { title: "Venez essayer, c'est offert.", cta: ["Choisir un cours", "/planning"] }],
      ] },
      { key: "disciplines", name: "Disciplines", blocks: [
        ["misc:pagehead", { title: "Disciplines", sub: "De l'éveil à la danse en loisir avancé" }],
        ["feat:tabs", { title: "Nos cours", items: [{ t: "Classique", x: "Enfants dès 6 ans, ados et adultes débutants ou confirmés." }, { t: "Jazz", x: "Énergie, technique et chorégraphies sur musiques actuelles." }, { t: "Contemporain", x: "Improvisation, poids du corps et fluidité." }, { t: "Éveil 4-5 ans", x: "Comptines, parcours et premières notions de rythme." }] }],
        ["price:tiers", { items: [{ t: "Un cours par semaine", price: "290 €", period: "l'année", x: "Tarif de démonstration.", f: ["1 cours hebdomadaire", "Participation au gala"], cta: "S'inscrire", url: "/contact" }, { t: "Deux cours", price: "480 €", period: "l'année", f: ["2 cours au choix", "Participation au gala"], cta: "S'inscrire", url: "/contact", hl: true }, { t: "Illimité", price: "620 €", period: "l'année", f: ["Tous les cours", "Stage de rentrée"], cta: "S'inscrire", url: "/contact" }] }],
      ] },
      { key: "planning", name: "Planning", blocks: [
        ["misc:pagehead", { title: "Planning hebdomadaire", sub: "Studios A, B et C" }],
        ["misc:schedule", { title: "Les cours de la semaine", items: [{ d: "Lun. 17 h 30", t: "Éveil 4-5 ans", x: "Studio B, 45 minutes." }, { d: "Mar. 19 h", t: "Classique adultes", x: "Studio A, tous niveaux." }, { d: "Mer. 14 h", t: "Jazz ados", x: "Studio A, 1 h 15." }, { d: "Jeu. 20 h", t: "Contemporain", x: "Studio C, niveau intermédiaire." }, { d: "Sam. 10 h", t: "Hip-hop enfants", x: "Studio B, 8-12 ans." }] }],
        ["misc:hours", { title: "Ouverture de l'accueil", rows: [["Lundi – vendredi", "16 h – 21 h"], ["Samedi", "9 h – 13 h"]] }],
      ] },
      { key: "professeurs", name: "Professeurs", blocks: [
        ["misc:pagehead", { title: "Professeurs", sub: "Quatre parcours de scène" }],
        ["proof:team", { items: [{ n: "Élodie Marchand", r: "Danse classique" }, { n: "Yanis Boukhari", r: "Jazz et hip-hop" }, { n: "Clémence Vidal", r: "Contemporain" }, { n: "Maud Lefèvre", r: "Éveil" }] }],
        ["misc:story", { title: "Une équipe venue de la scène", paras: ["Danseurs en compagnie ou en comédie musicale, nos professeurs aiment transmettre.", "Chacun adapte son cours à tous les âges, sans jamais renoncer à la rigueur."], image: "portrait-2" }],
      ] },
      contact("Cours d'essai gratuit", "Venez au studio", "Envoyer", "40 rue de l'Opéra, 67000 Strasbourg", "Âge, discipline souhaitée et expérience."),
    ],
  },
  // 8. Centre de yoga / formation
  {
    key: "sattvia", name: "Sattvia", category: "education", tags: ["naturel", "minimaliste"], siteType: "Centre de yoga et formations de professeurs",
    description: "Vert sauge, ivoire doux et titres Marcellus aérés : un centre de yoga avec cours, stages, formation professorale et tarifs en cartes de séances.",
    brand: "Centre Sattvia",
    tokens: { colors: { primary: "#3f7a5a", secondary: "#24382e", accent: "#c9a14a", background: "#f6f6ef", surface: "#ffffff", text: "#1f3128", muted: "#58665e" }, fonts: F("font.marcellus", "font.karla"), radius: { sm: 8, md: 16, lg: 28, button: 999, field: 14, card: 22 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#dcdfce" } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "pill" }, art: { seed: "sattvia", motifs: ["waves", "dunes", "botanical"] },
    head: ["head:dark", {}],
    foot: ["foot:columns", { about: "Centre de yoga indépendant (exemple) : cours collectifs, stages du week-end et formation professorale sur deux ans.", cols: [["Pratiquer", "Cours collectifs", "Stages", "Cartes de séances"], ["Se former", "Formation professeur", "Contact"]] }],
    menu: [["Accueil", "/"], ["Cours et tarifs", "/cours"], ["Planning", "/planning"], ["Formations", "/formations"], ["Contact", "/contact"]], cta: ["Séance d'essai", "/contact"],
    contact: { address: "3 passage des Tilleuls, 34000 Montpellier", phone: "04 67 12 90 55", email: "namaste@sattvia.example", hours: "Lundi – samedi, 8 h – 21 h", tagline: "Respirer, ralentir, se sentir." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Hatha, vinyasa et yin yoga", title: "Un espace pour ralentir.", sub: "Deux salles lumineuses, des cours du matin au soir et une formation reconnue pour devenir professeur.", cta: ["Réserver un cours", "/planning"], cta2: ["Découvrir la formation", "/formations"], image: "hero" }],
        ["feat:grid-icons", { title: "Trois pratiques, un même souffle", items: [{ t: "Hatha doux", x: "Postures tenues et respiration, pour débuter.", icon: "sun" }, { t: "Vinyasa", x: "Enchaînements dynamiques en rythme avec le souffle.", icon: "activity" }, { t: "Yin et relaxation", x: "Étirements longs, pour relâcher les tensions.", icon: "moon" }] }],
        ["proof:quotes", { title: "Ce que disent nos élèves", items: [{ q: "Mon dos me remercie après dix semaines de pratique.", n: "Lucie H.", r: "élève, cliente fictive" }, { q: "Une ambiance sans jugement, même pour un débutant raide.", n: "Antoine M.", r: "élève, client fictif" }, { q: "La formation m'a donné la confiance pour enseigner.", n: "Camille G.", r: "stagiaire, cliente fictive" }] }],
        ["feat:numbered", { items: [{ t: "40 cours", x: "Par semaine, du matin au soir." }, { t: "12 élèves", x: "Au plus par cours." }, { t: "200 h", x: "Pour la formation de base." }] }],
        ["cta:split", { title: "Première séance offerte.", sub: "Tapis et accessoires prêtés.", cta: ["Choisir un créneau", "/planning"] }],
      ] },
      { key: "cours", name: "Cours et tarifs", blocks: [
        ["misc:pagehead", { title: "Cours et tarifs", sub: "Cartes valables six mois" }],
        ["feat:pricelist", { title: "Tarifs de démonstration", items: [{ t: "Séance à l'unité", x: "Un cours d'1 h 15", price: "18 €" }, { t: "Carte 10 séances", x: "Valable 6 mois", price: "150 €" }, { t: "Abonnement illimité", x: "Tous les cours, par mois", price: "79 €" }, { t: "Stage du week-end", x: "Deux demi-journées", price: "70 €" }] }],
        ["feat:accordion", { title: "Pour bien démarrer", items: [{ t: "Que porter ?", x: "Une tenue souple. Les tapis sont fournis." }, { t: "Puis-je venir enceinte ?", x: "Oui, dans notre cours prénatal ou avec l'avis de votre sage-femme." }] }],
      ] },
      { key: "planning", name: "Planning", blocks: [
        ["misc:pagehead", { title: "Planning", sub: "Salle Soleil et salle Lune" }],
        ["misc:schedule", { title: "Semaine type", items: [{ d: "Lun. 8 h 30", t: "Hatha doux", x: "Salle Soleil, tous niveaux." }, { d: "Mar. 12 h 15", t: "Vinyasa express", x: "Salle Lune, 45 minutes." }, { d: "Mer. 19 h 30", t: "Yin yoga", x: "Salle Lune, aux bougies." }, { d: "Sam. 10 h", t: "Yoga et méditation", x: "Salle Soleil, 1 h 30." }] }],
        ["cta:band", { title: "Réservez votre place en ligne ou par téléphone.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations", sub: "Se former à l'enseignement du yoga" }],
        ["feat:steps", { title: "Formation professorale, 200 h", items: [{ t: "Fondamentaux", x: "Anatomie, philosophie et posture.", d: "Module 1" }, { t: "Pédagogie", x: "Construire un cours, guider un groupe.", d: "Module 2" }, { t: "Stage pratique", x: "Enseigner en situation, avec retours.", d: "Module 3" }] }],
        ["misc:courses", {}],
      ] },
      contact("Venez essayer", "Une question avant de venir ?", "Envoyer", "3 passage des Tilleuls, 34000 Montpellier", "Votre niveau et la pratique souhaitée."),
    ],
  },
  // 9. Académie personnelle (créateur de cours en ligne)
  {
    key: "classerum", name: "Classerum", category: "education", tags: ["sombre", "technique"], siteType: "Académie personnelle d'un créateur de cours en ligne",
    description: "Nuit graphite, vert citron vif et titres Bricolage Grotesque : l'académie d'un expert qui vend ses cours, ses communautés et sa newsletter.",
    brand: "Classerum Académie",
    tokens: { colors: { primary: "#a3e635", secondary: "#1c2514", accent: "#38bdf8", background: "#0f130b", surface: "#192011", text: "#f2f7e8", muted: "#b5c0a3" }, fonts: F("font.bricolage-grotesque", "font.ibm-plex-sans"), radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2c3a1d" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.02, letterSpacing: -0.03 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "classerum", motifs: ["mesh", "tiles", "rays"] },
    head: ["head:side", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Formations", "/formations"], ["Communauté", "/communaute"], ["À propos", "/a-propos"], ["Contact", "/contact"]], cta: ["Rejoindre l'académie", "/formations"],
    contact: { address: "Académie 100 % en ligne", phone: "09 70 12 33 48", email: "equipe@classerum.example", hours: "Support du lundi au vendredi, 10 h – 17 h", tagline: "Apprenez une compétence, pas un jargon." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Cours en ligne sur la photographie culinaire", title: "Apprenez à votre rythme, pour de bon.", sub: "Des cours en vidéo courts, des exercices corrigés et une communauté de 2 000 membres (exemple) pour progresser sans jamais rester seul.", cta: ["Voir les formations", "/formations"], cta2: ["Rejoindre la communauté", "/communaute"], stats: [["14", "cours"], ["2 000", "membres (exemple)"], ["4,9/5", "avis (exemple)"]] }],
        ["misc:courses", {}],
        ["feat:compare", { title: "Choisir son format", rows: [["", "Cours à l'unité", "Académie complète"], ["Accès", "À vie", "Tous les cours"], ["Corrections", "Non", "Oui, chaque mois"], ["Communauté", "Non", "Oui"], ["Prix", "49 à 149 €", "29 € par mois"]] }],
        ["proof:quotes", { title: "Les membres en parlent", items: [{ q: "Mes photos ont changé en deux semaines grâce aux corrections.", n: "Marion T.", r: "membre, cliente fictive" }, { q: "Le format court me permet d'apprendre le soir.", n: "Hugo L.", r: "membre, client fictif" }, { q: "Je recommande l'académie complète.", n: "Nora Z.", r: "membre, cliente fictive" }] }],
        ["cta:card", { title: "Commencez avec un cours gratuit.", sub: "Cinq leçons pour tester la méthode.", cta: ["Je démarre", "/formations"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations", sub: "Le catalogue en direct" }],
        ["misc:courses", {}],
        ["feat:list2", { title: "Dans chaque cours", items: [{ t: "Vidéos de 5 à 12 minutes" }, { t: "Exercices à faire chez soi" }, { t: "Fiches à télécharger" }, { t: "Accès illimité" }] }],
      ] },
      { key: "communaute", name: "Communauté", blocks: [
        ["misc:pagehead", { title: "Communauté", sub: "Apprendre ensemble" }],
        ["feat:rows", { title: "Ce qui vous attend", items: [{ t: "Défis mensuels", x: "Un thème, un partage de photos, un retour bienveillant." }, { t: "Direct questions-réponses", x: "Une fois par mois, en vidéo, avec enregistrement." }, { t: "Entraide", x: "Forum privé pour poser ses questions à tout moment." }] }],
        ["price:tiers", { items: [{ t: "Mensuel", price: "29 €", period: "par mois", f: ["Tous les cours", "Communauté", "Direct mensuel"], cta: "Rejoindre", url: "/contact" }, { t: "Annuel", price: "290 €", period: "par an", x: "Deux mois offerts.", f: ["Tous les cours", "Corrections mensuelles", "Direct mensuel"], cta: "Rejoindre", url: "/contact", hl: true }] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "À propos", sub: "Qui est derrière l'académie ?" }],
        ["misc:story", { title: "Photographe devenue formatrice", paras: ["Après douze ans de reportage culinaire, j'ai voulu transmettre ce que j'aurais aimé apprendre plus tôt.", "Chaque cours est testé auprès d'un groupe d'élèves avant sa publication."], image: "portrait-3" }],
        ["misc:posts", { title: "Le blog", count: 3, layout: "grid" }],
      ] },
      contact("Support et partenariats", "Une question ?", "Envoyer", "Académie en ligne", "Décrivez votre question ou votre projet."),
    ],
  },
  // 10. École de pilotage / aviation
  {
    key: "altivox", name: "Altivox", category: "education", tags: ["sombre", "technique"], siteType: "École de pilotage et aéroclub (PPL, vols découverte)",
    description: "Bleu nuit, ciel clair et titres Saira condensés : une école de pilotage avec formation PPL, vols découverte, flotte et tarifs à l'heure de vol.",
    brand: "Altivox Aviation",
    tokens: { colors: { primary: "#38bdf8", secondary: "#0b2540", accent: "#fb923c", background: "#08131f", surface: "#10233a", text: "#eef6fc", muted: "#a9bdd0" }, fonts: F("font.saira", "font.barlow"), radius: { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#1e3b5a" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.02, letterSpacing: 0, transform: "uppercase" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "altivox", motifs: ["topo", "rays", "mountains"] },
    head: ["head:topbar", { info: "Vols découverte tous les week-ends", note: "Météo permettant" }],
    foot: ["foot:big", { title: "Altivox" }],
    menu: [["Accueil", "/"], ["Formations", "/formations"], ["Flotte", "/flotte"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver un vol", "/tarifs"],
    contact: { address: "Aérodrome de Haute-Plaine, 26200 Montélimar", phone: "04 75 90 12 08", email: "piste@altivox.example", hours: "Tous les jours, 8 h – coucher du soleil", tagline: "Le ciel s'apprend." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "École de pilotage agréée (exemple)", title: "Prenez les commandes.", sub: "Brevet de pilote privé, vols découverte et stages de perfectionnement, sur avions biplaces et quadriplaces entretenus avec rigueur.", cta: ["Offrir un vol découverte", "/tarifs"], cta2: ["Devenir pilote", "/formations"], image: "hero", overlay: 0.55 }],
        ["proof:statsbar", { items: [["45 h", "minimum pour le brevet PPL"], ["6", "avions"], ["4", "instructeurs"], ["12", "ans d'activité (exemple)"]] }],
        ["feat:steps", { title: "Du vol découverte au brevet", items: [{ t: "Vol découverte", x: "30 minutes aux commandes avec un instructeur.", d: "Jour 1" }, { t: "Théorie", x: "Météo, navigation et réglementation, en soirée ou en ligne.", d: "Mois 1 à 6" }, { t: "Vol école", x: "Tours de piste, lâcher solo puis navigation.", d: "Mois 2 à 10" }, { t: "Examen", x: "Épreuve théorique puis pratique devant l'examinateur.", d: "Mois 12" }] }],
        ["feat:bento", { title: "Pourquoi voler chez nous", items: [{ t: "Sécurité d'abord", x: "Briefing avant chaque vol, avions révisés selon le carnet.", icon: "shield" }, { t: "Instructeurs expérimentés", x: "Pédagogie calme.", icon: "user" }, { t: "Ciel de Drôme", x: "Vallée du Rhône et Vercors.", icon: "globe" }] }],
        ["cta:split", { title: "Un vol, une vue, un souvenir.", sub: "Bon cadeau valable un an.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations", sub: "Du loisir à la qualification" }],
        ["feat:tabs", { title: "Nos programmes", items: [{ t: "Brevet PPL", x: "45 heures dont 25 en double commande, théorie incluse." }, { t: "Perfectionnement", x: "Vol montagne, atterrissage court, navigation internationale." }, { t: "Reprise après arrêt", x: "Revoir les bases avec un instructeur avant de voler seul." }] }],
        ["feat:checks", { title: "Conditions d'entrée", cta: ["Nous contacter", "/contact"], items: [{ t: "Avoir 16 ans minimum" }, { t: "Visite médicale d'aptitude" }, { t: "Être disponible quelques demi-journées par mois" }, { t: "Aucun diplôme requis" }] }],
      ] },
      { key: "flotte", name: "Flotte", blocks: [
        ["misc:pagehead", { title: "La flotte", sub: "Appareils de démonstration" }],
        ["gal:cards", { items: [{ t: "Biplace école", tag: "2 places", x: "Notre appareil de première heure, stable et pardonnant." }, { t: "Quadriplace voyage", tag: "4 places", x: "Pour les navigations et les vols de groupe." }, { t: "Planeur de club", tag: "Vol à voile", x: "Pour découvrir les thermiques." }] }],
        ["feat:list2", { title: "Entretien", items: [{ t: "Visites toutes les 50 h" }, { t: "Carnets consultables" }, { t: "Atelier agréé" }, { t: "Pesée annuelle" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Exemples hors taxes d'atterrissage" }],
        ["price:tiers", { items: [{ t: "Vol découverte", price: "99 €", period: "30 min", x: "Le plus offert en cadeau.", f: ["Briefing", "Pilotage avec instructeur", "Photos souvenir"], cta: "Réserver", url: "/contact" }, { t: "Vol panoramique", price: "189 €", period: "1 h", f: ["Jusqu'à 3 passagers", "Survol des gorges"], cta: "Réserver", url: "/contact", hl: true }, { t: "Heure de vol école", price: "210 €", period: "avec instructeur", f: ["Carburant inclus", "Debriefing"], cta: "S'inscrire", url: "/contact" }] }],
        ["misc:faq", { items: [{ t: "Et si la météo est mauvaise ?", x: "Votre vol est reporté sans frais." }, { t: "Y a-t-il une limite de poids ?", x: "Oui, 110 kg par personne pour les vols découverte." }] }],
      ] },
      contact("Piste et accueil", "Préparer votre vol", "Envoyer", "Aérodrome de Haute-Plaine, 26200 Montélimar", "Vol souhaité, date et nombre de passagers."),
    ],
  },
  // 11. Premiers secours
  {
    key: "sauvecap", name: "Sauvecap", category: "education", tags: ["audacieux", "moderne"], siteType: "Centre de formation aux premiers secours (PSC1, SST)",
    description: "Rouge urgence, blanc net et titres Oswald condensés : un centre de formation qui rend les gestes qui sauvent accessibles, avec sessions datées et devis entreprise.",
    brand: "Sauvecap Formation",
    tokens: { colors: { primary: "#c81e1e", secondary: "#1f2937", accent: "#0ea5e9", background: "#ffffff", surface: "#f4f5f7", text: "#17202b", muted: "#505a68" }, fonts: F("font.oswald", "font.source-serif-4"), radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#e1e4e8" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.0, letterSpacing: 0.01, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "sauvecap", motifs: ["halftone", "plates", "rays"] },
    head: ["head:bar", {}],
    foot: ["foot:newsletter", { title: "Prochaines sessions par e-mail", sub: "Recevez les dates de formation de votre département.", button: "Je m'inscris" }],
    menu: [["Accueil", "/"], ["Formations", "/formations"], ["Sessions", "/sessions"], ["Entreprises", "/entreprises"], ["Contact", "/contact"]], cta: ["Réserver une session", "/sessions"],
    contact: { address: "8 rue de la Croix-Blanche, 59000 Lille", phone: "03 20 14 65 90", email: "sessions@sauvecap.example", hours: "Lundi – vendredi, 8 h 30 – 18 h", tagline: "Les bons gestes, au bon moment." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Formateurs certifiés, sessions toute l'année", title: "Sachez agir en cas d'urgence.", sub: "PSC1 pour tous, Sauveteur secouriste du travail pour vos équipes et initiation aux gestes qui sauvent, en petits groupes et en pratique dès la première minute.", cta: ["Voir les sessions", "/sessions"], cta2: ["Devis entreprise", "/entreprises"], image: "hero" }],
        ["feat:numbered", { items: [{ t: "7 heures", x: "Pour le PSC1, en une journée." }, { t: "10 stagiaires", x: "Au plus par formateur." }, { t: "Mannequins", x: "Un par binôme, pour s'exercer vraiment." }] }],
        ["proof:stats", { items: [["2 400", "stagiaires formés (exemple)"], ["98 %", "recommandent la formation (exemple)"], ["8", "formateurs"], ["3", "sites de formation"]] }],
        ["feat:alt", { title: "Les gestes qui comptent", items: [{ t: "Alerter", x: "Savoir quoi dire aux secours et comment se faire localiser." }, { t: "Masser et défibriller", x: "Massage cardiaque et défibrillateur automatique, mannequin en main." }, { t: "Arrêter un saignement", x: "Compression, garrot et protection de la victime.", link: ["Voir les formations", "/formations"] }] }],
        ["proof:quotes", { title: "Stagiaires", items: [{ q: "On ressort avec des gestes, pas seulement de la théorie.", n: "Benoît R.", r: "stagiaire, client fictif" }, { q: "Notre équipe entière a été formée en une demi-journée.", n: "Cécile F.", r: "responsable RH, cliente fictive" }, { q: "Formateur clair et rassurant.", n: "Idriss K.", r: "stagiaire, client fictif" }] }],
        ["cta:band", { title: "Un geste appris peut sauver une vie.", cta: ["Choisir une session", "/sessions"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Formations", sub: "Particuliers et professionnels" }],
        ["misc:courses", {}],
        ["feat:rows", { title: "Nos stages", items: [{ t: "PSC1, grand public", x: "Prévention et secours civiques de niveau 1, une journée." }, { t: "SST, entreprise", x: "Sauveteur secouriste du travail, 14 heures, recyclage tous les 24 mois." }, { t: "Gestes qui sauvent", x: "Initiation de deux heures pour classes, clubs et associations." }] }],
      ] },
      { key: "sessions", name: "Sessions", blocks: [
        ["misc:pagehead", { title: "Prochaines sessions", sub: "Dates d'exemple" }],
        ["misc:schedule", { title: "Calendrier", items: [{ d: "Sam. 9 h", t: "PSC1 à Lille", x: "7 heures, 12 places." }, { d: "Mar. 8 h 30", t: "SST à Roubaix", x: "14 heures sur deux jours." }, { d: "Mer. 14 h", t: "Gestes qui sauvent", x: "2 heures pour les jeunes dès 12 ans." }] }],
        ["feat:pricelist", { title: "Tarifs particuliers", items: [{ t: "PSC1", x: "Journée complète, attestation remise", price: "60 €" }, { t: "Initiation 2 h", x: "Par personne", price: "25 €" }, { t: "Recyclage SST", x: "7 heures", price: "95 €" }] }],
      ] },
      { key: "entreprises", name: "Entreprises", blocks: [
        ["misc:pagehead", { title: "Entreprises et collectivités", sub: "Formation sur site ou dans nos locaux" }],
        ["feat:compare", { title: "Choisir la formule", rows: [["", "Dans nos locaux", "Sur votre site"], ["Groupe", "1 à 10", "Jusqu'à 10"], ["Matériel", "Fourni", "Fourni"], ["Délai", "Sous 2 semaines", "Sous 3 semaines"]] }],
        ["cta:image", { title: "Un devis sous 48 heures.", sub: "Décrivez votre effectif et vos disponibilités.", cta: ["Demander un devis", "/contact"] }],
      ] },
      contactCards("Particuliers et entreprises", "Parlons de votre formation", "Envoyer", "Indiquez le stage et le nombre de participants."),
    ],
  },
];
