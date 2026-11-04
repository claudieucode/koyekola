// Santé (lot A, 9 thèmes). Textes de DÉMONSTRATION : cabinets, personnes et coordonnées fictifs, sans promesse médicale.
const SEM = [["Lundi", "9 h – 18 h 30"], ["Mardi", "9 h – 18 h 30"], ["Mercredi", "9 h – 12 h 30"], ["Jeudi", "9 h – 18 h 30"], ["Vendredi", "9 h – 17 h"], ["Samedi", "Fermé"], ["Dimanche", "Fermé"]];
const AVIS = "Ce site est une démonstration et ne remplace pas une consultation.";

module.exports = [
  // 1. Médecine générale
  {
    key: "aubepin-medecine", name: "Aubépin", category: "sante", tags: ["chaleureux", "naturel"], siteType: "Cabinet de médecine générale",
    description: "Cabinet de médecine générale en vert profond et sable doré, titres en serif doux, bandeau portrait à gauche et parcours de consultation clair.",
    brand: "Cabinet médical de l'Aubépin",
    tokens: { colors: { primary: "#0f766e", secondary: "#0b3b38", accent: "#e8a33d", background: "#f6fbfa", surface: "#ffffff", text: "#10302d", muted: "#455f5b" }, fonts: { heading: "font.fraunces", body: "font.urbanist", button: "font.urbanist", link: "font.urbanist" }, radius: { sm: 8, md: 12, lg: 18, button: 12, field: 10, card: 16 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "aubepin-medecine", motifs: ["botanical", "blobs", "waves"] },
    head: ["head:topbar", { info: "Cabinet ouvert du lundi au vendredi", note: "Rendez-vous par téléphone ou en ligne" }],
    foot: ["foot:columns", { about: "Cabinet de médecine générale de quartier, consultations sur rendez-vous et créneaux sans rendez-vous chaque matin.", cols: [["Le cabinet", "Consultations", "Les médecins", "Horaires"], ["Pratique", "Prendre rendez-vous", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Consultations", "/consultations"], ["Les médecins", "/medecins"], ["Horaires et accès", "/horaires"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "12 rue des Aubépines, 44000 Nantes", phone: "02 40 55 01 12", email: "secretariat@aubepin-medecine.example", hours: "Du lundi au vendredi, 9 h – 18 h 30", tagline: "Votre médecin de proximité." },
    social: ["facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Médecine générale", title: "Un médecin qui prend le temps de vous écouter.", sub: "Consultations pour adultes et enfants, suivi des maladies chroniques et prévention, dans un cabinet de quartier accessible à tous.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Les consultations", "/consultations"], image: "portrait-1" }],
        ["feat:rows", { eyebrow: "Au cabinet", title: "Ce que nous proposons", items: [{ t: "Consultations de médecine générale", x: "Motifs courants, certificats, renouvellement de traitements." }, { t: "Suivi au long cours", x: "Tension, diabète, asthme : un suivi régulier avec des rendez-vous planifiés." }, { t: "Prévention et vaccination", x: "Point sur votre calendrier vaccinal et bilans de prévention." }, { t: "Petits gestes au cabinet", x: "Pansements, sutures simples, certificats de sport." }] }],
        ["proof:stats", { title: "Le cabinet en quelques repères (exemples)", items: [["3", "médecins associés"], ["15 min", "de consultation en moyenne"], ["6 h", "de créneaux sans rendez-vous par semaine"]] }],
        ["feat:steps", { eyebrow: "Votre venue", title: "Comment se passe une consultation", items: [{ t: "Prise de rendez-vous", x: "Par téléphone, au secrétariat ou en ligne.", d: "Avant" }, { t: "Accueil", x: "Présentez votre carte Vitale et vos documents utiles.", d: "À l'arrivée" }, { t: "Consultation", x: "Échange, examen et explications sur la suite.", d: "En cabinet" }, { t: "Suite", x: "Ordonnance, courriers et prochain rendez-vous si besoin.", d: "À la sortie" }] }],
        ["proof:quotes", { title: "Ils en parlent", items: [{ q: "Le médecin a pris le temps de m'expliquer mon traitement, sans me presser.", n: "Mireille D.", r: "Patiente, cliente fictive" }, { q: "Pratique de pouvoir venir sans rendez-vous le matin.", n: "Thomas B.", r: "Patient, client fictif" }] }],
        ["cta:card", { title: "Besoin d'une consultation ?", sub: "En cas d'urgence vitale, appelez le 15. " + AVIS, cta: ["Demander un rendez-vous", "/contact"] }],
      ] },
      { key: "consultations", name: "Consultations", blocks: [
        ["misc:pagehead", { title: "Consultations", sub: "Pour les adultes, les enfants et les personnes âgées." }],
        ["feat:alt", { title: "Nos types de consultation", items: [{ t: "Consultation courante", x: "Fièvre, douleurs, fatigue, infections : un premier avis et une orientation si besoin." }, { t: "Suivi d'une maladie chronique", x: "Rendez-vous réguliers, ordonnances de longue durée et coordination avec les spécialistes." }, { t: "Bilan de prévention", x: "Examen général, vaccins à jour et conseils adaptés à votre âge." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Dois-je apporter mes examens ?", x: "Oui, analyses, imagerie et ordonnances récentes aident à mieux vous suivre." }, { t: "Puis-je venir sans rendez-vous ?", x: "Des créneaux libres sont proposés chaque matin ; l'attente peut varier." }, { t: "Que faire en cas d'urgence ?", x: "Appelez le 15 (SAMU) ou le 112. Le cabinet ne traite pas les urgences vitales." }] }],
        ["cta:band", { title: "Une question avant de venir ?", sub: "Le secrétariat vous répond aux heures d'ouverture.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "medecins", name: "Les médecins", blocks: [
        ["misc:pagehead", { title: "Les médecins du cabinet" }],
        ["proof:team", { title: "Une équipe de trois médecins", items: [{ n: "Dr Hélène Marchais", r: "Médecin généraliste" }, { n: "Dr Paul Verrier", r: "Médecin généraliste, médecine du sport" }, { n: "Dr Anaïs Lefort", r: "Médecin généraliste, suivi des enfants" }] }],
        ["misc:text", { eyebrow: "Notre façon de travailler", title: "Un suivi partagé", paras: ["Les trois médecins partagent vos dossiers avec votre accord, pour que quelqu'un puisse vous recevoir même en cas d'absence de votre médecin habituel.", "Nous travaillons avec les infirmières, kinésithérapeutes et pharmacies du quartier."] }],
      ] },
      { key: "horaires", name: "Horaires et accès", blocks: [
        ["misc:pagehead", { title: "Horaires et accès" }],
        ["misc:hours", { title: "Horaires du cabinet", rows: SEM }],
        ["feat:list2", { title: "Accès et confort", items: [{ t: "Accès de plain-pied" }, { t: "Arrêt de tram à 200 m" }, { t: "Parking à vélos" }, { t: "Salle d'attente adaptée aux familles" }] }],
        ["contact:map", { title: "Nous trouver", mapAddress: "12 rue des Aubépines, 44000 Nantes" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Prendre rendez-vous", sub: "Nous répondons sous un jour ouvré." }],
        ["contact:info", { title: "Une demande de rendez-vous", formTitle: "Écrivez au secrétariat", formIntro: "Indiquez le motif général et vos disponibilités. Ne communiquez pas de détails médicaux.", cta: ["Envoyer", "/contact"] }],
        ["feat:icons", { title: "Avant de venir", items: [{ icon: "fileText", t: "Documents", x: "Carte Vitale, mutuelle, ordonnances récentes." }, { icon: "clock", t: "Ponctualité", x: "Merci de prévenir 24 h à l'avance en cas d'annulation." }] }],
      ] },
    ],
  },

  // 2. Cabinet dentaire (clair, bleu, hero gradient)
  {
    key: "sourire-nacre", name: "Nacre Dentaire", category: "sante", tags: ["moderne", "geometrique"], siteType: "Cabinet dentaire",
    description: "Cabinet dentaire bleu électrique sur blanc, barre flottante, bandeau en dégradé avec chiffres, mosaïque d'actes et tableau comparatif de soins.",
    brand: "Nacre Dentaire",
    tokens: { colors: { primary: "#2563eb", secondary: "#0a1f55", accent: "#0ea5b7", background: "#fbfcff", surface: "#eaf1ff", text: "#0c1b3a", muted: "#43527a" }, fonts: { heading: "font.bricolage-grotesque", body: "font.figtree", button: "font.bricolage-grotesque", link: "font.figtree" }, radius: { sm: 6, md: 10, lg: 16, button: 999, field: 10, card: 14 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.05, letterSpacing: -0.025, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "sourire-nacre", motifs: ["tiles", "rays", "bokeh"] },
    head: ["head:float", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Soins", "/soins"], ["Cabinet", "/cabinet"], ["Tarifs", "/tarifs"], ["Rendez-vous", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "5 place du Marché-Neuf, 67000 Strasbourg", phone: "03 88 00 24 61", email: "accueil@nacre-dentaire.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h 30", tagline: "Des soins dentaires expliqués pas à pas." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Chirurgie dentaire", title: "Un cabinet où l'on explique avant de soigner.", sub: "Contrôles, soins courants et prothèses, avec un plan de traitement détaillé remis avant chaque acte.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Voir les soins", "/soins"], stats: [["2", "praticiens"], ["5 jours", "d'ouverture par semaine"], ["Devis", "remis avant tout soin"]] }],
        ["feat:grid-icons", { title: "Les soins du cabinet", items: [{ icon: "shield", t: "Prévention", x: "Détartrage et conseils de brossage." }, { icon: "heart", t: "Soins courants", x: "Caries, dents sensibles, réparations." }, { icon: "sparkles", t: "Esthétique", x: "Soins du sourire, après avis du praticien." }, { icon: "layers", t: "Prothèses", x: "Couronnes et bridges sur devis détaillé." }] }],
        ["feat:compare", { title: "Deux matériaux pour une couronne (exemple)", rows: [["", "Céramique", "Métal et céramique"], ["Aspect", "Très proche de la dent", "Naturel"], ["Séances", "1 à 2", "2"], ["Devis", "Détaillé et écrit", "Détaillé et écrit"]] }],
        ["gal:wall", { title: "Un cabinet apaisant", items: [{ t: "Salle de soins" }, { t: "Accueil" }, { t: "Salle d'attente" }, { t: "Stérilisation" }] }],
        ["proof:big", { items: [{ q: "Mon dentiste m'a montré chaque étape sur l'écran avant de commencer. J'étais beaucoup plus serein.", n: "Léa M.", r: "Patiente, cliente fictive" }] }],
        ["cta:split", { title: "Un contrôle par an est souvent conseillé.", sub: AVIS, cta: ["Réserver un contrôle", "/contact"] }],
      ] },
      { key: "soins", name: "Soins", blocks: [
        ["misc:pagehead", { title: "Les soins dentaires", sub: "Chaque traitement est expliqué avant d'être réalisé." }],
        ["feat:tabs", { title: "Par domaine", items: [{ t: "Prévention", x: "Détartrage, scellement de sillons chez l'enfant, conseils personnalisés." }, { t: "Soins", x: "Traitement des caries, soins de la racine, réparation d'une dent fêlée." }, { t: "Esthétique", x: "Éclaircissement encadré, harmonisation du sourire." }, { t: "Prothèses", x: "Couronnes, bridges et prothèses amovibles avec essayages." }] }],
        ["feat:bento", { title: "Pour les enfants et les familles", items: [{ t: "Première visite dès 3 ans", x: "On présente le fauteuil et les instruments avant tout soin, pour dédramatiser." }, { t: "Rendez-vous groupés" }, { t: "Jeux en salle d'attente" }] }],
        ["cta:band", { title: "Une douleur ou une gêne ?", sub: "Écrivez-nous, nous vous proposons le créneau le plus proche.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "cabinet", name: "Le cabinet", blocks: [
        ["misc:pagehead", { title: "Le cabinet" }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Dr Inès Calvet", r: "Chirurgien-dentiste" }, { n: "Dr Mathis Orsini", r: "Chirurgien-dentiste, parodontie" }, { n: "Clara Dupin", r: "Assistante dentaire" }] }],
        ["feat:numbered", { title: "Nos engagements", items: [{ t: "Transparence", x: "Devis écrit avant les soins non urgents." }, { t: "Hygiène", x: "Instruments stérilisés, cycles tracés." }, { t: "Écoute", x: "Votre motif de venue guide la consultation." }] }],
        ["misc:quote", { text: "Prendre le temps d'expliquer, c'est déjà soigner.", by: "L'équipe du cabinet" }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et informations pratiques" }],
        ["feat:pricelist", { title: "Tarifs indicatifs (exemples de démonstration)", items: [{ t: "Consultation et bilan", price: "30 €" }, { t: "Détartrage", x: "Selon la prise en charge", price: "dès 29 €" }, { t: "Soin d'une carie", x: "Selon la face", price: "dès 20 €" }, { t: "Couronne", x: "Sur devis détaillé", price: "Sur devis" }] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – Jeudi", "8 h 30 – 18 h 30"], ["Vendredi", "8 h 30 – 16 h"], ["Week-end", "Fermé"]] }],
        ["feat:accordion", { title: "Questions pratiques", items: [{ t: "Le tiers payant est-il possible ?", x: "Oui, pour les soins pris en charge, selon votre contrat." }, { t: "Comment annuler ?", x: "Prévenez-nous 24 h avant par téléphone." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Rendez-vous" }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Demande de rendez-vous", formIntro: "Précisez vos disponibilités ; nous vous rappelons.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "5 place du Marché-Neuf, 67000 Strasbourg" }],
      ] },
    ],
  },

  // 3. Kinésithérapie (rose / rouge, sportif)
  {
    key: "kine-sillage", name: "Kiné Sillage", category: "sante", tags: ["audacieux", "moderne"], siteType: "Cabinet de kinésithérapie du sport",
    description: "Cabinet de kinésithérapie du sport au rouge framboise, titres en capitales, bandeau empilé avec grande image, grille de programmes et tarifs en liste.",
    brand: "Sillage Kinésithérapie",
    tokens: { colors: { primary: "#be123c", secondary: "#4c0519", accent: "#f59e0b", background: "#fff7f8", surface: "#ffeef1", text: "#3a0f1a", muted: "#6b4650" }, fonts: { heading: "font.epilogue", body: "font.red-hat-text", button: "font.epilogue", link: "font.red-hat-text" }, radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.02, letterSpacing: -0.01, transform: "uppercase" }, h2: { size: 36, weight: 800, lineHeight: 1.1, letterSpacing: 0, transform: "uppercase" } }, border: { width: 1, color: "#f3c4cd" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "kine-sillage", motifs: ["ribbons", "halftone", "rays"] },
    head: ["head:split", {}],
    foot: ["foot:big", { title: "Sillage" }],
    menu: [["Accueil", "/"], ["Programmes", "/programmes"], ["Le plateau", "/plateau"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver un bilan", "/contact"],
    contact: { address: "31 quai des Chartrons, 33000 Bordeaux", phone: "05 56 90 31 27", email: "bilan@kine-sillage.example", hours: "Du lundi au vendredi, 7 h 30 – 20 h", tagline: "Remettre le corps en mouvement." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Kinésithérapie du sport", title: "Revenir à votre sport, à votre rythme.", sub: "Rééducation après blessure, préparation et conseils d'entraînement, sur un plateau technique en accès libre entre les séances.", cta: ["Réserver un bilan", "/contact"], cta2: ["Voir les programmes", "/programmes"], stats: [["3", "kinés du sport"], ["7 h 30", "première séance du matin"], ["45 min", "pour le bilan initial"]], image: "hero" }],
        ["feat:strips", { title: "Les situations que nous suivons", items: [{ t: "Entorses et tendinopathies", x: "Reprise graduée de l'appui et de la charge." }, { t: "Post-opératoire du genou et de l'épaule", x: "Suivi en lien avec l'équipe chirurgicale." }, { t: "Douleurs de course", x: "Analyse de la foulée et exercices de renfort." }, { t: "Dos de bureau", x: "Mobilité, postures et micro-pauses." }] }],
        ["proof:statsbar", { items: [["8 semaines", "durée moyenne d'un programme (exemple)"], ["1 fiche", "d'exercices remise à chaque séance"], ["Plateau", "accessible entre les séances"]] }],
        ["gal:masonry", { title: "Le plateau technique", items: [{ t: "Salle de rééducation" }, { t: "Espace de renforcement" }, { t: "Cabine de soins" }, { t: "Zone d'échauffement" }, { t: "Accueil" }] }],
        ["feat:bento", { eyebrow: "Méthode", title: "Trois temps pour repartir", items: [{ t: "Comprendre", x: "Bilan du geste, de la douleur et de vos objectifs sportifs : on fixe des étapes réalistes avec vous." }, { t: "Reconstruire", x: "Exercices progressifs et suivi de la charge." }, { t: "Prévenir", x: "Routine d'entretien à garder." }] }],
        ["cta:image", { title: "Une blessure vous freine ?", sub: "Racontez-nous votre sport et vos objectifs. " + AVIS, cta: ["Réserver un bilan", "/contact"] }],
      ] },
      { key: "programmes", name: "Programmes", blocks: [
        ["misc:pagehead", { title: "Programmes de rééducation", sub: "Des parcours construits selon votre prescription et votre sport." }],
        ["feat:cards", { title: "Trois parcours types (exemples)", items: [{ icon: "activity", t: "Retour au running", x: "Foulée, renforcement et progression des distances." }, { icon: "zap", t: "Sports de pivot", x: "Genou et cheville : appuis, réception de sauts et changements de direction." }, { icon: "trendingUp", t: "Reprise après une pause", x: "Remise en forme douce, avec un suivi des sensations." }] }],
        ["feat:steps", { title: "Un programme en 4 temps", items: [{ t: "Bilan", x: "Entretien et tests de mouvement.", d: "Séance 1" }, { t: "Reprise", x: "Mobilité et contrôle moteur.", d: "Semaines 1 à 3" }, { t: "Charge", x: "Renforcement progressif.", d: "Semaines 4 à 6" }, { t: "Retour au sport", x: "Mises en situation.", d: "Semaines 7 à 8" }] }],
        ["cta:band", { title: "Votre sport n'est pas listé ?", sub: "Parlons-en : nous adaptons le parcours.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "plateau", name: "Le plateau", blocks: [
        ["misc:pagehead", { title: "Le plateau technique" }],
        ["misc:story", { eyebrow: "L'équipe", title: "Des kinés qui pratiquent aussi", paras: ["Course, escalade, rugby amateur : l'équipe connaît les contraintes des sports qu'elle accompagne.", "Le plateau reste accessible entre deux séances, avec un exercice choisi par votre kiné."], image: "portrait-2" }],
        ["proof:team", { title: "Les praticiens", items: [{ n: "Maëlle Sorel", r: "Kinésithérapeute du sport" }, { n: "Rayan Cordier", r: "Kinésithérapeute, épaule et genou" }, { n: "Alix Perrin", r: "Kinésithérapeute, course à pied" }] }],
        ["feat:checks", { title: "Sur place", cta: ["Venir essayer", "/contact"], items: [{ t: "Poids libres et élastiques" }, { t: "Tapis de course pour l'analyse" }, { t: "Vestiaire et douche" }, { t: "Accès aux personnes à mobilité réduite" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et horaires" }],
        ["feat:pricelist", { title: "Tarifs indicatifs (exemples)", items: [{ t: "Séance de rééducation", x: "Environ 30 minutes", price: "16 €" }, { t: "Bilan initial", x: "45 minutes", price: "25 €" }, { t: "Analyse de la course", x: "Hors prise en charge", price: "60 €" }] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – Vendredi", "7 h 30 – 20 h"], ["Samedi", "9 h – 12 h"], ["Dimanche", "Fermé"]] }],
        ["misc:faq", { title: "Avant de venir", items: [{ t: "Faut-il une ordonnance ?", x: "Souvent oui pour la prise en charge ; apportez-la au premier rendez-vous." }, { t: "Que porter ?", x: "Une tenue de sport et vos chaussures habituelles." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Réserver un bilan" }],
        ["contact:info", { title: "Contactez le cabinet", formTitle: "Votre demande", formIntro: "Sport pratiqué, date de la blessure, disponibilités.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "31 quai des Chartrons, 33000 Bordeaux" }],
      ] },
    ],
  },

  // 4. Psychologue / psychothérapeute (sombre prune)
  {
    key: "psy-lueur", name: "Lueur Douce", category: "sante", tags: ["sombre", "editorial"], siteType: "Cabinet de psychologue et psychothérapeute",
    description: "Cabinet de psychothérapie en prune nocturne et lilas, titres en serif d'élégance, bandeau minimal très aéré et pages courtes comme des lettres.",
    brand: "Cabinet Lueur Douce",
    tokens: { colors: { primary: "#b9a2ff", secondary: "#3b2a63", accent: "#f2b8a2", background: "#1a1426", surface: "#251c36", text: "#f3eefc", muted: "#bdb2d6" }, fonts: { heading: "font.instrument-serif", body: "font.outfit", button: "font.outfit", link: "font.outfit" }, radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.05, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "pill" }, art: { seed: "psy-lueur", motifs: ["blobs", "bokeh", "arches"] },
    head: ["head:minimal", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Accompagnement", "/accompagnement"], ["À propos", "/apropos"], ["Questions", "/questions"], ["Contact", "/contact"]], cta: ["Prendre contact", "/contact"],
    contact: { address: "9 rue des Capucins, 31000 Toulouse", phone: "05 61 10 48 09", email: "bonjour@lueur-douce.example", hours: "Sur rendez-vous, du mardi au vendredi", tagline: "Un espace pour parler, à votre rythme." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Psychologue clinicienne et psychothérapeute", title: "Un espace calme pour déposer ce qui pèse.", sub: "Entretiens individuels pour adultes et adolescents, dans un cadre confidentiel et sans jugement.", cta: ["Prendre contact", "/contact"], cta2: ["Comment je travaille", "/accompagnement"] }],
        ["misc:quote", { text: "Il n'y a pas de bonne ou de mauvaise raison de consulter : seulement le moment où l'on se sent prêt.", by: "Cabinet Lueur Douce" }],
        ["feat:numbered", { eyebrow: "Accompagnement", title: "Trois manières de commencer", items: [{ t: "Un premier échange", x: "Un entretien pour se rencontrer et voir si le cadre vous convient." }, { t: "Un suivi régulier", x: "Des séances à rythme choisi ensemble, en cabinet ou en visio." }, { t: "Un temps ponctuel", x: "Pour traverser un événement : deuil, rupture, changement professionnel." }] }],
        ["proof:big", { items: [{ q: "Je redoutais de parler. On m'a laissé le temps, et j'ai eu envie de revenir.", n: "Camille R.", r: "Patiente, cliente fictive" }] }],
        ["feat:list2", { title: "Les thèmes abordés", items: [{ t: "Anxiété et stress" }, { t: "Transitions de vie" }, { t: "Deuil et séparation" }, { t: "Estime de soi" }, { t: "Épuisement professionnel" }, { t: "Relations familiales" }] }],
        ["cta:card", { title: "Envie d'en parler ?", sub: "Un premier message suffit. Si vous êtes en détresse, appelez le 3114 (numéro national de prévention du suicide, gratuit, 24 h sur 24).", cta: ["Écrire au cabinet", "/contact"] }],
      ] },
      { key: "accompagnement", name: "Accompagnement", blocks: [
        ["misc:pagehead", { title: "L'accompagnement", sub: "Le cadre, le rythme et la confidentialité.", bg: "token:surface" }],
        ["misc:story", { eyebrow: "À propos", title: "Un cadre sûr et confidentiel", paras: ["Le cabinet est un lieu calme, accessible, où chaque séance est confidentielle."], image: "portrait-1" }],
        ["misc:text", { eyebrow: "Le cadre", title: "Un travail à votre mesure", paras: ["Les séances durent environ 45 minutes. Leur fréquence se décide ensemble et peut évoluer.", "Tout ce qui est dit reste confidentiel, dans les limites prévues par la loi et la déontologie des psychologues."] }],
        ["feat:steps", { title: "Un suivi, étape par étape", items: [{ t: "Premier entretien", x: "Présentation du cadre et de votre demande.", d: "Séance 1" }, { t: "Exploration", x: "Mettre des mots, repérer ce qui se répète.", d: "Les premières semaines" }, { t: "Élaboration", x: "Chercher ensemble des appuis et des changements possibles.", d: "Ensuite" }, { t: "Clôture", x: "Faire le point et décider de la suite.", d: "Quand vous le souhaitez" }] }],
        ["feat:pricelist", { title: "Honoraires (exemples)", items: [{ t: "Séance individuelle", x: "Environ 45 minutes", price: "65 €" }, { t: "Premier entretien", x: "Environ 1 heure", price: "65 €" }, { t: "Séance en visioconférence", price: "60 €" }] }],
      ] },
      { key: "apropos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "À propos" }],
        ["misc:story", { eyebrow: "Parcours", title: "Une écoute formée et supervisée", paras: ["Psychologue clinicienne, formée à l'approche intégrative, je participe régulièrement à des séances de supervision.", "Je reçois dans un cabinet calme du centre-ville, accessible en transports."], image: "portrait-3" }],
        ["feat:list2", { title: "Formations et cadre (exemples)", items: [{ t: "Master de psychologie clinique" }, { t: "Formation à l'écoute et à l'approche intégrative" }, { t: "Supervision régulière" }, { t: "Respect du code de déontologie" }] }],
        ["misc:quote", { text: "Chacun avance à son rythme.", by: "La psychologue du cabinet" }],
      ] },
      { key: "questions", name: "Questions", blocks: [
        ["misc:pagehead", { title: "Questions fréquentes" }],
        ["misc:faq", { items: [{ t: "Faut-il un avis médical ?", x: "Pas pour consulter un psychologue. Selon votre situation, un échange avec votre médecin peut être utile." }, { t: "Combien de séances faut-il ?", x: "Cela dépend de chacun ; nous en reparlons régulièrement." }, { t: "Reçoit-on les adolescents ?", x: "Oui, à partir de 14 ans, avec l'accord des parents pour les mineurs." }, { t: "Les séances sont-elles remboursées ?", x: "Renseignez-vous auprès de votre mutuelle ; certaines prennent en charge un forfait." }] }],
        ["cta:band", { title: "Une autre question ?", sub: "Écrivez-moi, je réponds dès que possible.", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Prendre contact" }],
        ["contact:info", { title: "Écrire au cabinet", formTitle: "Un premier message", formIntro: "Quelques mots suffisent : pas besoin de détailler. Ne transmettez pas d'informations très sensibles par ce formulaire.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Mardi", "10 h – 19 h"], ["Mercredi", "10 h – 19 h"], ["Jeudi", "10 h – 19 h"], ["Vendredi", "10 h – 16 h"]] }],
      ] },
    ],
  },

  // 5. Ophtalmologue (olive)
  {
    key: "iris-clarte", name: "Iris Clarté", category: "sante", tags: ["editorial", "classique"], siteType: "Cabinet d'ophtalmologie",
    description: "Cabinet d'ophtalmologie en vert olive et ivoire, bandeau image plein cadre, titres en serif de presse, examens présentés en onglets et bande de chiffres.",
    brand: "Centre ophtalmologique Iris",
    tokens: { colors: { primary: "#4d7c0f", secondary: "#26380a", accent: "#d97706", background: "#fbfcf5", surface: "#f0f4e1", text: "#1f2a0c", muted: "#55603f" }, fonts: { heading: "font.newsreader", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "iris-clarte", motifs: ["topo", "plates", "mountains"] },
    head: ["head:center", {}],
    foot: ["foot:newsletter", { title: "Les rappels du centre", sub: "Un message par an pour penser à votre contrôle de la vue.", button: "Recevoir le rappel" }],
    menu: [["Accueil", "/"], ["Examens", "/examens"], ["Équipe", "/equipe"], ["Informations pratiques", "/pratique"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "18 avenue du Parc, 21000 Dijon", phone: "03 80 71 62 40", email: "rdv@centre-iris.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h", tagline: "Prendre soin de votre vue." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Ophtalmologie", title: "Voir clair, à chaque âge.", sub: "Bilans de vue, suivi de l'œil de l'enfant et surveillance des yeux de l'adulte, avec des équipements récents.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Les examens", "/examens"], image: "hero", overlay: 0.55 }],
        ["proof:statsbar", { items: [["2", "ophtalmologues"], ["4", "orthoptistes"], ["Dès 3 ans", "bilans de l'enfant"]] }],
        ["feat:alt", { eyebrow: "Au centre", title: "Un parcours en un seul lieu", items: [{ t: "Bilan visuel", x: "Mesure de la vue, de la tension et examen du fond d'œil, dans la même matinée." }, { t: "Orthoptie", x: "Bilan de la vision binoculaire et rééducation, notamment chez l'enfant." }, { t: "Suivi de l'œil", x: "Surveillance régulière des affections de l'œil, avec compte rendu écrit." }] }],
        ["feat:accordion", { title: "Bien se préparer", items: [{ t: "Que faut-il apporter ?", x: "Vos lunettes ou lentilles actuelles, l'ordonnance précédente et la liste de vos traitements." }, { t: "Y a-t-il des gouttes dilatantes ?", x: "Parfois. Elles gênent la vue quelques heures : venez accompagné si possible." }, { t: "À quelle fréquence se faire contrôler ?", x: "Selon l'âge et les antécédents ; votre médecin vous conseillera." }] }],
        ["proof:quotes", { title: "Témoignages", items: [{ q: "L'équipe a pris le temps d'expliquer chaque examen à ma fille.", n: "Sandrine V.", r: "Maman, cliente fictive" }, { q: "Rendez-vous ponctuel, résultats remis clairement par écrit.", n: "Gérard L.", r: "Patient, client fictif" }] }],
        ["cta:image", { title: "Un contrôle de la vue ?", sub: "Les délais varient selon les périodes. " + AVIS, cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "examens", name: "Examens", blocks: [
        ["misc:pagehead", { title: "Examens et consultations", sub: "Des examens indolores, expliqués avant d'être réalisés." }],
        ["feat:tabs", { title: "Selon votre besoin", items: [{ t: "Adulte", x: "Mesure de la vue, tension de l'œil, examen du fond d'œil et adaptation des lunettes ou lentilles." }, { t: "Enfant", x: "Dépistage et bilan adaptés à l'âge, avec des jeux et des images." }, { t: "Senior", x: "Surveillance régulière de l'œil et conseils pour le quotidien." }, { t: "Urgence", x: "Œil rouge ou douloureux, baisse brutale de la vue : appelez sans attendre le cabinet ou les urgences." }] }],
        ["feat:list2", { title: "Au programme d'une consultation", items: [{ t: "Questionnaire sur vos habitudes" }, { t: "Mesure de la vue" }, { t: "Examen à la lampe" }, { t: "Compte rendu remis" }] }],
        ["cta:band", { title: "Besoin d'un renouvellement d'ordonnance ?", sub: "Selon les conditions d'âge, des créneaux dédiés existent.", cta: ["Voir les créneaux", "/contact"] }],
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        ["misc:pagehead", { title: "L'équipe du centre" }],
        ["proof:team", { title: "Médecins et orthoptistes", items: [{ n: "Dr Solène Pradier", r: "Ophtalmologue" }, { n: "Dr Étienne Barral", r: "Ophtalmologue, chirurgie réfractive" }, { n: "Noémie Gaucher", r: "Orthoptiste" }, { n: "Bastien Roux", r: "Orthoptiste" }] }],
        ["misc:text", { title: "Un travail en équipe", paras: ["Les orthoptistes réalisent une partie des examens avant la consultation, ce qui laisse plus de temps à l'échange avec l'ophtalmologue.", "Les comptes rendus sont adressés à votre médecin traitant avec votre accord."] }],
      ] },
      { key: "pratique", name: "Informations pratiques", blocks: [
        ["misc:pagehead", { title: "Informations pratiques" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – Jeudi", "8 h 30 – 18 h"], ["Vendredi", "8 h 30 – 16 h"], ["Week-end", "Fermé"]] }],
        ["feat:pricelist", { title: "Honoraires indicatifs (exemples)", items: [{ t: "Consultation d'ophtalmologie", price: "30 €" }, { t: "Bilan orthoptique", price: "dès 20 €" }, { t: "Examen du fond d'œil", x: "Selon l'indication", price: "dès 25 €" }] }],
        ["contact:map", { title: "Venir au centre", mapAddress: "18 avenue du Parc, 21000 Dijon" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Prendre rendez-vous" }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Demande de rendez-vous", formIntro: "Indiquez le motif général et vos disponibilités.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "En cas de baisse brutale de la vue, ne patientez pas : contactez le 15 ou les urgences.", by: "Centre ophtalmologique Iris" }],
      ] },
    ],
  },

  // 6. Clinique vétérinaire (ambre)
  {
    key: "vetoplume", name: "Plumes & Truffes", category: "sante", tags: ["chaleureux", "ludique"], siteType: "Clinique vétérinaire",
    description: "Clinique vétérinaire chaleureuse en ambre et crème, titres en serif rond, bandeau en collage de portraits d'animaux et grille de soins pour chiens, chats et NAC.",
    brand: "Clinique Plumes & Truffes",
    tokens: { colors: { primary: "#a16207", secondary: "#422006", accent: "#0f766e", background: "#fffaf0", surface: "#fdf0d5", text: "#2e1f06", muted: "#6a5530" }, fonts: { heading: "font.young-serif", body: "font.rubik", button: "font.rubik", link: "font.rubik" }, radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "pill" }, art: { seed: "vetoplume", motifs: ["blobs", "objects", "botanical"] },
    head: ["head:side", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Soins", "/soins"], ["Nos animaux", "/animaux"], ["Urgences et horaires", "/urgences"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "4 chemin des Prés, 37000 Tours", phone: "02 47 66 12 80", email: "contact@plumes-truffes.example", hours: "Du lundi au samedi, 9 h – 19 h", tagline: "Des soins pour tous vos compagnons." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Clinique vétérinaire", title: "Chiens, chats, lapins et oiseaux, bien soignés.", sub: "Consultations, vaccinations, chirurgie courante et conseils d'alimentation, dans une clinique calme et sans stress.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Nos soins", "/soins"] }],
        ["feat:cards", { title: "Les soins de la clinique", items: [{ icon: "heart", t: "Consultations et vaccins", x: "Suivi de santé, vaccinations et identification." }, { icon: "shield", t: "Prévention", x: "Antiparasitaires, dentisterie et bilans de santé réguliers." }, { icon: "activity", t: "Chirurgie courante", x: "Stérilisation, soins de plaies, ablation de petites masses." }, { icon: "sparkles", t: "Nouveaux animaux de compagnie", x: "Lapins, cochons d'Inde, furets et oiseaux." }] }],
        ["gal:cards", { title: "Une clinique pensée pour les animaux", items: [{ t: "Salle d'attente séparée", x: "Un coin chats surélevé, un coin chiens.", tag: "Accueil" }, { t: "Bloc opératoire", x: "Matériel adapté aux petits gabarits.", tag: "Chirurgie" }, { t: "Hospitalisation", x: "Box calmes, surveillance régulière.", tag: "Soins" }] }],
        ["proof:stats", { title: "La clinique en chiffres (exemples)", items: [["3", "vétérinaires"], ["2", "auxiliaires"], ["24 h", "en moyenne pour un rendez-vous urgent non vital"]] }],
        ["proof:big", { items: [{ q: "Mon chat déteste les cliniques ; ici il est resté calme et l'équipe a été patiente.", n: "Odile F.", r: "Propriétaire, cliente fictive" }] }],
        ["cta:band", { title: "Un doute sur la santé de votre animal ?", sub: "Appelez-nous. En dehors des heures d'ouverture, contactez le service de garde de la région.", cta: ["Nous appeler", "/contact"] }],
      ] },
      { key: "soins", name: "Soins", blocks: [
        ["misc:pagehead", { title: "Nos soins", sub: "Adaptés à l'espèce, à l'âge et au caractère de votre animal." }],
        ["feat:alt", { title: "Selon l'âge de l'animal", items: [{ t: "Chiots et chatons", x: "Premières vaccinations, identification et conseils d'éducation et d'alimentation." }, { t: "Adultes", x: "Bilan annuel, dentisterie, antiparasitaires et suivi du poids." }, { t: "Seniors", x: "Bilans adaptés, confort de vie et suivi des articulations." }] }],
        ["feat:pricelist", { title: "Tarifs indicatifs (exemples)", items: [{ t: "Consultation", price: "dès 40 €" }, { t: "Vaccination annuelle", price: "dès 55 €" }, { t: "Identification par puce", price: "dès 65 €" }] }],
        ["feat:accordion", { title: "Questions courantes", items: [{ t: "Quand vacciner mon chiot ?", x: "Le calendrier est défini lors de la première consultation, selon son âge." }, { t: "Acceptez-vous les consultations à domicile ?", x: "Pour certaines situations, sur demande." }] }],
      ] },
      { key: "animaux", name: "Nos animaux", blocks: [
        ["misc:pagehead", { title: "Nos animaux" }],
        ["feat:icons", { title: "Espèces suivies", items: [{ icon: "heart", t: "Chiens", x: "De toutes tailles, du chiot au senior." }, { icon: "heart", t: "Chats", x: "Consultations calmes, créneaux dédiés." }, { icon: "star", t: "Lapins et rongeurs", x: "Alimentation, dents et soins courants." }, { icon: "sun", t: "Oiseaux", x: "Bilans de santé et conseils d'habitat." }] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Dr Clémence Aubry", r: "Vétérinaire, médecine canine" }, { n: "Dr Louis Fabre", r: "Vétérinaire, chirurgie" }, { n: "Dr Manon Sevran", r: "Vétérinaire, NAC" }, { n: "Jade Pellerin", r: "Auxiliaire vétérinaire" }] }],
        ["misc:quote", { text: "Un animal serein se soigne mieux.", by: "L'équipe de la clinique" }],
      ] },
      { key: "urgences", name: "Urgences et horaires", blocks: [
        ["misc:pagehead", { title: "Urgences et horaires" }],
        ["misc:hours", { title: "Horaires de la clinique", rows: [["Lundi – Vendredi", "9 h – 19 h"], ["Samedi", "9 h – 13 h"], ["Dimanche", "Fermé"]] }],
        ["feat:checks", { title: "En cas d'urgence", cta: ["Appeler la clinique", "/contact"], items: [{ t: "Appelez-nous avant de vous déplacer" }, { t: "Hors horaires : service de garde régional" }, { t: "Apportez le carnet de santé" }, { t: "Gardez votre animal au calme" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Nous contacter" }],
        ["contact:info", { title: "Une demande de rendez-vous", formTitle: "Écrivez-nous", formIntro: "Espèce, âge et motif général. Pour une urgence, téléphonez.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { title: "Accès", mapAddress: "4 chemin des Prés, 37000 Tours" }],
      ] },
    ],
  },

  // 7. Pharmacie (vert vif)
  {
    key: "pharmacie-tilleul", name: "Officine Verdoyante", category: "sante", tags: ["moderne", "naturel"], siteType: "Pharmacie d'officine",
    description: "Pharmacie de quartier en vert pharmacie et blanc, bandeau avec champ de recherche, services en grille, sélection de produits de conseil et horaires de garde.",
    brand: "Pharmacie du Tilleul",
    tokens: { colors: { primary: "#15803d", secondary: "#052e16", accent: "#dc2626", background: "#f7fbf8", surface: "#e6f4ea", text: "#0d2916", muted: "#476152" }, fonts: { heading: "font.red-hat-display", body: "font.plus-jakarta-sans", button: "font.red-hat-display", link: "font.plus-jakarta-sans" }, radius: { sm: 6, md: 10, lg: 14, button: 8, field: 8, card: 12 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "soft" }, art: { seed: "pharmacie-tilleul", motifs: ["plates", "tiles", "botanical"] },
    head: ["head:bar", {}],
    foot: ["foot:columns", { about: "Pharmacie d'officine de quartier : ordonnances, conseils, matériel médical et orthopédie.", cols: [["La pharmacie", "Services", "Conseils", "Horaires et garde"], ["Pratique", "Préparer sa commande", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Conseils du mois", "/conseils"], ["Horaires et garde", "/horaires"], ["Contact", "/contact"]], cta: ["Préparer mon ordonnance", "/contact"],
    contact: { address: "2 place du Tilleul, 59000 Lille", phone: "03 20 14 77 05", email: "officine@pharmacie-tilleul.example", hours: "Du lundi au samedi, 8 h 30 – 19 h 30", tagline: "Conseil et proximité au comptoir." },
    social: ["facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Pharmacie de quartier", title: "Votre pharmacien, à deux pas de chez vous.", sub: "Ordonnances, conseils, matériel médical et préparation de piluliers, avec une équipe qui vous connaît.", placeholder: "Un produit, un service, un conseil…", cta: ["Préparer mon ordonnance", "/contact"], image: "hero" }],
        ["feat:grid-icons", { title: "Nos services", items: [{ icon: "clock", t: "Préparation d'ordonnance", x: "Prête à l'heure convenue, sur simple message." }, { icon: "heart", t: "Piluliers et suivi", x: "Préparation hebdomadaire pour vos traitements réguliers." }, { icon: "home", t: "Matériel médical", x: "Location et vente : cannes, tensiomètres, lits médicalisés." }, { icon: "users", t: "Entretiens pharmaceutiques", x: "Un temps d'échange sur votre traitement." }] }],
        ["gal:products", { title: "Sélection de conseil (démonstration)", items: [{ t: "Crème hydratante mains", price: "7,90 €" }, { t: "Spray nasal salin", price: "6,50 €" }, { t: "Thermomètre sans contact", price: "19,90 €" }, { t: "Trousse de voyage", price: "14,00 €" }] }],
        ["proof:statsbar", { items: [["4", "pharmaciens et préparateurs"], ["8 h 30", "ouverture du lundi au samedi"], ["Livraison", "à domicile pour les personnes fragiles (sur demande)"]] }],
        ["feat:strips", { title: "Conseils de saison", items: [{ t: "Rhume et hiver", x: "Hygiène, hydratation et quand consulter." }, { t: "Voyage", x: "Trousse de base et pensée aux vaccins." }, { t: "Soleil", x: "Protection, durée d'exposition et hydratation." }] }],
        ["cta:split", { title: "Une question sur un médicament ?", sub: "Demandez conseil à votre pharmacien. Ce site ne remplace pas son avis.", cta: ["Poser une question", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ["misc:pagehead", { title: "Services de la pharmacie" }],
        ["feat:tabs", { title: "Ce que nous faisons", items: [{ t: "Ordonnances", x: "Délivrance, explications, tiers payant selon votre couverture." }, { t: "Conseil", x: "Petits maux du quotidien, automédication encadrée, orientation vers un médecin si besoin." }, { t: "Matériel", x: "Orthopédie, maintien à domicile, location de matériel." }, { t: "Vaccination", x: "Selon les dispositions en vigueur, demandez à l'équipe." }] }],
        ["feat:rows", { title: "Pour les patients au long cours", items: [{ t: "Piluliers", x: "Préparés chaque semaine, avec votre accord." }, { t: "Rappels de renouvellement", x: "Un message avant la fin de l'ordonnance." }, { t: "Livraison", x: "Pour les personnes à mobilité réduite, sur demande." }] }],
        ["cta:band", { title: "Besoin de matériel ?", sub: "Passez nous voir avec votre prescription.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "conseils", name: "Conseils du mois", blocks: [
        ["misc:pagehead", { title: "Conseils du mois" }],
        ["misc:article", { tag: "Conseil", title: "Bien ranger sa pharmacie familiale", meta: "Lecture : 3 minutes", paras: ["Rangez les médicaments dans un endroit frais, sec, hors de portée des enfants.", "Vérifiez les dates de péremption deux fois par an et rapportez les produits périmés à la pharmacie, qui les collecte.", "Gardez les notices : elles rappellent les doses et précautions. En cas de doute, demandez à votre pharmacien."], quote: "Un médicament inutilisé se rapporte à la pharmacie, jamais à la poubelle.", by: "L'équipe de la pharmacie" }],
        ["feat:list2", { title: "À avoir à la maison", items: [{ t: "Thermomètre" }, { t: "Pansements et compresses" }, { t: "Antiseptique" }, { t: "Liste des numéros d'urgence" }] }],
      ] },
      { key: "horaires", name: "Horaires et garde", blocks: [
        ["misc:pagehead", { title: "Horaires et garde" }],
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Lundi – Vendredi", "8 h 30 – 19 h 30"], ["Samedi", "9 h – 19 h"], ["Dimanche", "Fermé (voir pharmacie de garde)"]] }],
        ["misc:text", { title: "Pharmacies de garde", paras: ["Pour connaître la pharmacie de garde la plus proche, appelez le 3237 ou consultez l'affichage en vitrine."] }],
        ["contact:map", { mapAddress: "2 place du Tilleul, 59000 Lille" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Préparer une commande", formIntro: "Indiquez votre nom et l'heure de passage souhaitée. N'envoyez pas votre ordonnance par ce formulaire.", cta: ["Envoyer", "/contact"] }],
        ["cta:band", { title: "Une question sur un traitement ?", sub: "Appelez l'officine ou écrivez-nous : nous répondons dans la journée.", cta: ["Nous écrire", "/contact"] }],
      ] },
    ],
  },

  // 8. Pédiatrie (magenta joyeux)
  {
    key: "petits-pas-pediatrie", name: "Pas à Pas", category: "sante", tags: ["ludique", "chaleureux"], siteType: "Cabinet de pédiatrie",
    description: "Cabinet de pédiatrie joyeux en magenta et jaune, bandeau de journal, carte blanche arrondie, étapes de croissance et conseils aux parents.",
    brand: "Cabinet Pas à Pas",
    tokens: { colors: { primary: "#a21caf", secondary: "#581c87", accent: "#f59e0b", background: "#fffafe", surface: "#fbe8fb", text: "#3b0a40", muted: "#6d4a72" }, fonts: { heading: "font.fredoka", body: "font.dm-sans", button: "font.fredoka", link: "font.dm-sans" }, radius: { sm: 12, md: 18, lg: 28, button: 999, field: 16, card: 28 }, shadow: { card: "md", button: "sm" } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "petits-pas-pediatrie", motifs: ["blobs", "bokeh", "objects"] },
    head: ["head:masthead", { dateline: "Pédiatrie · Bordeaux · sur rendez-vous" }],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Consultations", "/consultations"], ["Conseils aux parents", "/parents"], ["Le cabinet", "/cabinet"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "16 rue des Lilas, 33800 Bordeaux", phone: "05 57 22 90 14", email: "bonjour@pas-a-pas.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h", tagline: "De la naissance à l'adolescence." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Pédiatrie", title: "Grandir en confiance, de la naissance à l'adolescence.", sub: "Suivi du nourrisson, vaccinations, croissance et questions de parents, dans un cabinet pensé pour les enfants.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Les consultations", "/consultations"], image: "hero" }],
        ["feat:numbered", { title: "Les grands rendez-vous", items: [{ t: "Les premiers mois", x: "Poids, alimentation, sommeil : on fait le point à chaque visite." }, { t: "La petite enfance", x: "Langage, motricité et vie en collectivité." }, { t: "L'âge scolaire", x: "Vue, audition, sommeil et concentration." }] }],
        ["gal:carousel", { title: "Un cabinet fait pour eux", items: [{ t: "Salle d'attente", x: "Coin lecture et jeux." }, { t: "Salle d'examen", x: "Murs doux, instruments présentés comme des jeux." }, { t: "Espace d'allaitement", x: "Un coin calme pour les mamans." }] }],
        ["feat:bento", { title: "Conseils aux parents", items: [{ t: "Le sommeil", x: "Repères d'âge, rituels du soir et quand en parler avec le pédiatre : nous partageons des fiches simples à chaque rendez-vous." }, { t: "L'alimentation" }, { t: "Les écrans" }] }],
        ["proof:quotes", { title: "Ce qu'en disent les parents", items: [{ q: "Notre fils est ressorti avec un autocollant et un grand sourire.", n: "Julie A.", r: "Maman, cliente fictive" }, { q: "Des réponses claires à nos questions de jeunes parents.", n: "Karim et Sofia", r: "Parents, clients fictifs" }] }],
        ["cta:card", { title: "Une question sur votre enfant ?", sub: "En cas d'urgence, appelez le 15. " + AVIS, cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "consultations", name: "Consultations", blocks: [
        ["misc:pagehead", { title: "Consultations", sub: "Du nouveau-né à l'adolescent." }],
        ["feat:steps", { title: "Le suivi d'un enfant (exemple de calendrier)", items: [{ t: "Premiers mois", x: "Visites rapprochées pour la croissance et l'alimentation.", d: "0 à 6 mois" }, { t: "Première année", x: "Vaccinations et premiers repères de développement.", d: "6 à 12 mois" }, { t: "Petite enfance", x: "Langage, motricité, sommeil.", d: "1 à 6 ans" }, { t: "Enfance et adolescence", x: "Croissance, puberté, bien-être.", d: "6 à 16 ans" }] }],
        ["feat:accordion", { title: "Avant la consultation", items: [{ t: "Que prendre avec soi ?", x: "Carnet de santé, carte Vitale, mutuelle et la liste de vos questions." }, { t: "Mon enfant a peur du médecin.", x: "Prévenez-nous : nous prenons le temps de nous présenter et d'expliquer les gestes." }, { t: "Et en cas de fièvre ?", x: "Appelez le cabinet ou votre médecin ; en cas de gêne respiratoire ou de malaise, le 15." }] }],
        ["cta:band", { title: "Besoin d'un rendez-vous ?", sub: "Nous répondons du lundi au vendredi.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "parents", name: "Conseils aux parents", blocks: [
        ["misc:pagehead", { title: "Conseils aux parents" }],
        ["misc:article", { tag: "Sommeil", title: "Installer un rituel du coucher", meta: "Lecture : 4 minutes", paras: ["Un rituel simple et répété aide l'enfant à repérer le moment du coucher : bain, histoire, câlin, lumière douce.", "Les besoins de sommeil varient selon l'âge et selon l'enfant ; parlez-en lors de la consultation si le sommeil devient une source d'inquiétude."], quote: "La régularité rassure souvent plus que la durée.", by: "Cabinet Pas à Pas" }],
        ["feat:list2", { title: "Les fiches du cabinet", items: [{ t: "Premiers aliments" }, { t: "Sommeil du nourrisson" }, { t: "Écrans et enfants" }, { t: "Rentrée à l'école" }] }],
      ] },
      { key: "cabinet", name: "Le cabinet", blocks: [
        ["misc:pagehead", { title: "Le cabinet" }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Dr Agathe Lemoine", r: "Pédiatre" }, { n: "Dr Hugo Belmont", r: "Pédiatre, développement" }, { n: "Rosalie Tran", r: "Infirmière puéricultrice" }] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – Jeudi", "8 h 30 – 18 h"], ["Vendredi", "8 h 30 – 16 h"], ["Week-end", "Fermé"]] }],
        ["contact:map", { mapAddress: "16 rue des Lilas, 33800 Bordeaux" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Prendre rendez-vous" }],
        ["contact:info", { title: "Contacter le cabinet", formTitle: "Votre demande", formIntro: "Âge de l'enfant et vos disponibilités. Ne communiquez pas de détails médicaux ici.", cta: ["Envoyer", "/contact"] }],
        ["feat:icons", { title: "Pour une venue sereine", items: [{ icon: "book", t: "Carnet de santé", x: "À apporter à chaque visite." }, { icon: "heart", t: "Doudou bienvenu", x: "Tous les compagnons sont acceptés." }] }],
      ] },
    ],
  },

  // 9. Radiologie (sombre cyan)
  {
    key: "radio-lumen", name: "Lumen Imagerie", category: "sante", tags: ["sombre", "technique"], siteType: "Centre de radiologie et d'imagerie médicale",
    description: "Centre d'imagerie médicale sombre et technique : cyan sur noir bleuté, en-tête foncé, bandeau centré avec chiffres, examens en lignes et préparation en étapes.",
    brand: "Lumen Imagerie Médicale",
    tokens: { colors: { primary: "#22d3ee", secondary: "#0e7490", accent: "#a3e635", background: "#0a1216", surface: "#11202a", text: "#e6f4f8", muted: "#9db8c2" }, fonts: { heading: "font.space-grotesk", body: "font.red-hat-text", button: "font.space-grotesk", link: "font.red-hat-text" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#24404d" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "radio-lumen", motifs: ["mesh", "topo", "rays"] },
    head: ["head:dark", {}],
    foot: ["foot:big", { title: "Lumen" }],
    menu: [["Accueil", "/"], ["Examens", "/examens"], ["Préparer son examen", "/preparation"], ["Informations", "/infos"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "70 boulevard de l'Hôpital, 13005 Marseille", phone: "04 91 05 66 30", email: "secretariat@lumen-imagerie.example", hours: "Du lundi au vendredi, 7 h 30 – 18 h 30", tagline: "Imagerie médicale, comptes rendus clairs." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Imagerie médicale", title: "Des examens précis, un compte rendu clair.", sub: "Radiographie, échographie, scanner et IRM sur un même site, réalisés sur prescription par une équipe de radiologues et de manipulateurs.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Voir les examens", "/examens"], stats: [["4", "radiologues"], ["IRM · Scanner", "sur place"], ["Sur prescription", "pour chaque examen"]] }],
        ["feat:rows", { eyebrow: "Examens", title: "Ce que nous réalisons", items: [{ t: "Radiographie", x: "Os, articulations, thorax : examen rapide, sans rendez-vous selon les créneaux." }, { t: "Échographie", x: "Abdomen, thyroïde, vaisseaux et suivi de grossesse." }, { t: "Scanner", x: "Examen détaillé, avec ou sans produit de contraste selon l'indication." }, { t: "IRM", x: "Articulations, cerveau, colonne : examen sans rayons X." }] }],
        ["feat:steps", { title: "Votre passage au centre", items: [{ t: "Rendez-vous", x: "Munissez-vous de la prescription.", d: "Avant" }, { t: "Accueil", x: "Dossier, questionnaire, consignes de sécurité.", d: "À l'arrivée" }, { t: "Examen", x: "Réalisé par le manipulateur sous la responsabilité du radiologue.", d: "En salle" }, { t: "Compte rendu", x: "Remis ou transmis à votre médecin selon vos choix.", d: "Après" }] }],
        ["proof:stats", { title: "Repères (exemples)", items: [["30 min", "durée type d'un examen de radiographie, accueil compris"], ["24 h", "délai habituel de transmission d'un compte rendu courant"], ["1", "interlocuteur pour la prise de rendez-vous"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Dois-je être à jeun ?", x: "Pour certains examens seulement ; les consignes vous sont envoyées avec le rendez-vous." }, { t: "Puis-je venir accompagné ?", x: "Oui, selon l'examen et les règles de sécurité de la salle." }, { t: "Les images sont-elles remises ?", x: "Oui, sur support ou par accès sécurisé selon le type d'examen." }] }],
        ["cta:band", { title: "Une prescription à réaliser ?", sub: AVIS, cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "examens", name: "Examens", blocks: [
        ["misc:pagehead", { title: "Examens d'imagerie", sub: "Sur prescription médicale." }],
        ["feat:compare", { title: "Choisir en un coup d'œil (information générale)", rows: [["", "Échographie", "Scanner", "IRM"], ["Principe", "Ultrasons", "Rayons X", "Champ magnétique"], ["Durée type", "15 à 30 min", "10 à 20 min", "20 à 45 min"], ["Prescription", "Oui", "Oui", "Oui"]] }],
        ["feat:alt", { title: "Les équipements", items: [{ t: "Salle de radiographie", x: "Matériel numérique à faible dose, avec protections adaptées." }, { t: "Salle d'IRM", x: "Examen silencieux ou casque audio selon les appareils." }] }],
        ["cta:split", { title: "Une question sur un examen ?", sub: "Le secrétariat vous renseigne sur l'organisation, pas sur l'interprétation médicale.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "preparation", name: "Préparer son examen", blocks: [
        ["misc:pagehead", { title: "Préparer son examen" }],
        ["feat:checks", { title: "À apporter", cta: ["Prendre rendez-vous", "/contact"], items: [{ t: "Prescription du médecin" }, { t: "Carte Vitale et mutuelle" }, { t: "Examens antérieurs" }, { t: "Liste de vos traitements" }] }],
        ["misc:faq", { title: "Selon l'examen", items: [{ t: "IRM", x: "Prévenez-nous de tout implant, pacemaker ou éclat métallique." }, { t: "Scanner", x: "Signalez toute allergie et toute insuffisance rénale connue." }, { t: "Échographie", x: "Selon la zone, une vessie pleine ou un jeûne peut être demandé." }] }],
      ] },
      { key: "infos", name: "Informations", blocks: [
        ["misc:pagehead", { title: "Informations pratiques" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – Jeudi", "7 h 30 – 18 h 30"], ["Vendredi", "7 h 30 – 17 h"], ["Week-end", "Fermé"]] }],
        ["proof:team", { title: "L'équipe médicale", items: [{ n: "Dr Aurélien Vasseur", r: "Radiologue" }, { n: "Dr Leïla Hadjadj", r: "Radiologue, imagerie ostéo-articulaire" }, { n: "Dr Matteo Grisoni", r: "Radiologue, échographie" }] }],
        ["contact:map", { title: "Accès", mapAddress: "70 boulevard de l'Hôpital, 13005 Marseille" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Prendre rendez-vous" }],
        ["contact:info", { title: "Secrétariat du centre", formTitle: "Demande de rendez-vous", formIntro: "Type d'examen prescrit et disponibilités. Ne joignez pas de documents médicaux.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "Pour toute urgence médicale, appelez le 15.", by: "Lumen Imagerie Médicale" }],
      ] },
    ],
  },
];
