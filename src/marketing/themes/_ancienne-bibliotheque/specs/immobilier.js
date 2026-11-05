// Immobilier, lot A (9 thèmes). Tous les textes sont des textes de DÉMONSTRATION : agences, biens, prix, personnes et coordonnées fictifs, annonces de démonstration.
const contact = (sub, title, addr, cta, formTitle) => ({ key: "contact", name: "Contact", blocks: [
  ["misc:pagehead", { title: "Contact", sub }],
  ["contact:info", { title, formTitle, cta }],
  ["contact:map", { mapAddress: addr }],
] });

module.exports = [
  // 1. Agence de quartier
  {
    key: "ruelle-vive", name: "Ruelle Vive", category: "immobilier", tags: ["chaleureux", "moderne"], siteType: "Agence immobilière de quartier",
    description: "Agence de quartier aux tons brique et crème : titres Fraunces souples, en-tête à bandeau d'horaires, biens du quartier en avant et bandeau chiffré rassurant.",
    brand: "Ruelle Vive Immobilier",
    tokens: { colors: { primary: "#c2410c", secondary: "#3d2b1f", accent: "#e8b04a", background: "#fdf6ee", surface: "#fffaf3", text: "#2b1d14", muted: "#6b5545" }, fonts: { heading: "font.fraunces", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" }, radius: { sm: 6, md: 12, lg: 18, button: 999, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 600, lineHeight: 1.06, letterSpacing: -0.02 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "ruelle", motifs: ["tiles", "skyline", "blobs"] },
    head: ["head:topbar", { info: "Ouvert du lundi au samedi, 9 h – 19 h", note: "01 55 20 41 18" }],
    foot: ["foot:columns", { about: "Ruelle Vive, l'agence du quartier : vente, location et estimation à deux pas de chez vous (agence fictive).", cols: [["Le quartier", "Biens à vendre", "Locations", "Vendre avec nous"], ["Agence", "Notre équipe", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Biens", "/biens"], ["Vendre", "/vendre"], ["Le quartier", "/quartier"], ["Contact", "/contact"]], cta: ["Estimer mon bien", "/vendre"],
    contact: { address: "14 rue des Lilas, 75020 Paris", phone: "01 55 20 41 18", email: "bonjour@ruelle-vive.example", hours: "Lundi au samedi, 9 h – 19 h", tagline: "Votre agence, au coin de la rue." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Agence de quartier depuis 2009", title: "On connaît chaque cage d'escalier de la rue.", sub: "Achat, vente, location : un conseil qui vient du terrain, pas d'un tableur.", cta: ["Voir les biens", "/biens"], cta2: ["Estimer mon bien", "/vendre"] }],
        ["proof:statsbar", { items: [["15 ans", "dans le même quartier"], ["380", "ventes réalisées (exemple)"], ["48 h", "pour une première estimation"]] }],
        ["gal:listings", { eyebrow: "Annonces de démonstration", title: "Les biens du moment", items: [{ t: "Deux pièces sur cour", tag: "Vente", price: "345 000 €", x: "42 m², 2e étage, parquet, cave, calme absolu." }, { t: "Atelier d'artiste", tag: "Vente", price: "612 000 €", x: "96 m², verrière, 5 m sous plafond, ancien atelier." }, { t: "Trois pièces rénové", tag: "Location", price: "1 480 € / mois", x: "61 m², cuisine équipée, balcon, proche métro." }] }],
        ["feat:rows", { eyebrow: "Comment ça se passe", title: "Un parcours simple, un seul interlocuteur", bg: "token:surface", items: [{ t: "On passe chez vous", x: "Visite, prise de mesures et avis sincère sur le prix." }, { t: "On présente le bien", x: "Photos de jour, plan, visites groupées le samedi." }, { t: "On vous accompagne jusqu'à l'acte", x: "Banque, notaire, diagnostics : on suit tout." }] }],
        ["proof:big", { items: [{ q: "Ils ont vendu notre appartement en trois semaines sans jamais nous presser.", n: "Hélène B.", r: "Vendeuse, cliente fictive" }] }],
        ["cta:band", { title: "Votre bien vaut-il ce que vous pensez ?", sub: "Estimation gratuite, sur place, sous 48 heures.", cta: ["Demander une estimation", "/vendre"] }],
      ] },
      { key: "biens", name: "Biens", blocks: [
        ["misc:pagehead", { title: "Nos biens", sub: "Annonces de démonstration, modifiables dans l'éditeur." }],
        ["gal:listings", { title: "À vendre et à louer", items: [{ t: "Deux pièces sur cour", tag: "Vente", price: "345 000 €", x: "42 m², 2e étage, cave." }, { t: "Atelier d'artiste", tag: "Vente", price: "612 000 €", x: "96 m², verrière." }, { t: "Studio rénové", tag: "Vente", price: "189 000 €", x: "23 m², rue calme, digicode." }, { t: "Trois pièces rénové", tag: "Location", price: "1 480 € / mois", x: "61 m², balcon." }, { t: "Local commercial", tag: "Location", price: "1 950 € / mois", x: "48 m², vitrine sur rue passante." }, { t: "Loft sur jardin", tag: "Vente", price: "498 000 €", x: "74 m², accès jardin privatif." }] }],
        ["feat:checks", { title: "Vous cherchez autre chose ?", cta: ["Déposer ma recherche", "/contact"], items: [{ t: "Alerte avant la mise en ligne" }, { t: "Visite organisée sous une semaine" }, { t: "Conseil sur les travaux à prévoir" }] }],
      ] },
      { key: "vendre", name: "Vendre", blocks: [
        ["misc:pagehead", { title: "Vendre avec nous", sub: "Estimation honnête, vente sereine." }],
        ["feat:steps", { title: "Les étapes", items: [{ t: "Estimation", d: "Semaine 1", x: "Visite et analyse des ventes récentes de la rue." }, { t: "Mise en vente", d: "Semaine 2", x: "Annonce, photos, diagnostics." }, { t: "Visites", d: "Semaines 3 à 6", x: "Nous filtrons les acquéreurs sérieux." }, { t: "Signature", d: "Mois 3", x: "Compromis puis acte chez le notaire." }] }],
        ["feat:pricelist", { title: "Honoraires (exemple)", items: [{ t: "Vente jusqu'à 250 000 €", x: "À la charge du vendeur", price: "5 %" }, { t: "Vente de 250 000 € à 600 000 €", x: "À la charge du vendeur", price: "4 %" }, { t: "Location, état des lieux inclus", x: "Part locataire plafonnée", price: "8 € / m²" }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "L'estimation engage-t-elle ?", x: "Non, elle est gratuite et sans mandat." }, { t: "Combien de temps pour vendre ?", x: "Environ deux mois pour un bien au juste prix (exemple)." }] }],
      ] },
      { key: "quartier", name: "Le quartier", blocks: [
        ["misc:pagehead", { title: "Le quartier" }],
        ["misc:story", { eyebrow: "Notre ancrage", title: "Des voisins avant d'être des agents", paras: ["Nous vivons et déjeunons ici. Marchés, écoles, projets de voirie : nous savons ce qui fait la valeur d'une rue.", "Chaque bien est présenté avec ce que le quartier apporte vraiment : transports, commerces, calme."] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Camille Ardant", r: "Directrice d'agence" }, { n: "Yanis Berthod", r: "Négociateur vente" }, { n: "Nora Falconnet", r: "Gestionnaire locative" }] }],
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Lundi – vendredi", "9 h – 19 h"], ["Samedi", "9 h – 18 h"], ["Dimanche", "Sur rendez-vous"]] }],
      ] },
      contact("Passez nous voir ou écrivez-nous.", "Parlons de votre projet", "14 rue des Lilas, 75020 Paris", ["Envoyer", "/contact"], "Écrivez-nous"),
    ],
  },

  // 2. Immobilier de luxe
  {
    key: "heritage-noir", name: "Héritage Noir", category: "immobilier", tags: ["sombre", "luxe"], siteType: "Agence immobilière de prestige",
    description: "Thème sombre et feutré pour hôtels particuliers et propriétés d'exception : fond encre, filets or champagne, bandeau d'ouverture plein cadre et titres Italiana.",
    brand: "Maison Héritage",
    tokens: { colors: { primary: "#c9a24b", secondary: "#1a1713", accent: "#e7d3a0", background: "#0f0e0c", surface: "#1a1814", text: "#f3ece0", muted: "#b8ad9a" }, fonts: { heading: "font.italiana", body: "font.mulish", button: "font.mulish", link: "font.mulish" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.08, letterSpacing: 0.01 }, h2: { size: 40, weight: 400, lineHeight: 1.15, transform: "uppercase", letterSpacing: 0.06 } } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "heritage", motifs: ["arches", "plates", "bokeh"] },
    head: ["head:center", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Propriétés", "/proprietes"], ["Confidentiel", "/confidentiel"], ["La maison", "/maison"], ["Contact", "/contact"]], cta: ["Rendez-vous privé", "/contact"],
    contact: { address: "3 avenue des Platanes, 06400 Cannes", phone: "04 93 00 12 70", email: "contact@maison-heritage.example", hours: "Sur rendez-vous, du lundi au samedi", tagline: "Propriétés d'exception, discrétion absolue." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Propriétés d'exception", title: "Des adresses qui ne s'affichent pas partout.", sub: "Hôtels particuliers, villas et domaines, présentés avec la retenue qu'ils méritent.", cta: ["Découvrir la sélection", "/proprietes"] }],
        ["feat:numbered", { eyebrow: "Notre engagement", title: "Trois principes", items: [{ t: "Discrétion", x: "Mandats confidentiels, visites sur invitation." }, { t: "Connaissance", x: "Chaque propriété est documentée dans le détail." }, { t: "Réseau", x: "Acquéreurs qualifiés en France et à l'étranger." }] }],
        ["gal:featured", { title: "Sélection du moment (annonces de démonstration)", items: [{ t: "Villa en bord de mer", x: "420 m², piscine, accès direct à la plage.", tag: "Sur demande" }, { t: "Hôtel particulier", x: "Cour pavée, 8 chambres.", tag: "Sur demande" }, { t: "Domaine viticole", x: "32 hectares, chai du XVIIIe.", tag: "Sur demande" }, { t: "Penthouse panoramique", x: "280 m², terrasses sur trois côtés.", tag: "Sur demande" }] }],
        ["proof:big", { items: [{ q: "Une vente menée avec un tact et une précision exemplaires.", n: "Madame V.", r: "Vendeuse, cliente fictive" }] }],
        ["cta:card", { title: "Un bien à confier, en toute discrétion ?", sub: "Un entretien privé précède toute estimation.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "proprietes", name: "Propriétés", blocks: [
        ["misc:pagehead", { title: "Nos propriétés", sub: "Annonces de démonstration." }],
        ["gal:listings", { title: "À la vente", items: [{ t: "Villa en bord de mer", tag: "Vente", price: "Sur demande", x: "420 m², 7 chambres, piscine, accès plage." }, { t: "Hôtel particulier", tag: "Vente", price: "Sur demande", x: "610 m², cour pavée, jardin." }, { t: "Penthouse panoramique", tag: "Vente", price: "Sur demande", x: "280 m², trois terrasses." }, { t: "Mas restauré", tag: "Vente", price: "Sur demande", x: "340 m², oliveraie de 2 ha." }] }],
        ["feat:list2", { title: "Chaque dossier comprend", items: [{ t: "Dossier photographique" }, { t: "Plans cotés" }, { t: "Historique du bien" }, { t: "Diagnostics complets" }, { t: "Étude du marché local" }, { t: "Visite privée" }] }],
      ] },
      { key: "confidentiel", name: "Confidentiel", blocks: [
        ["misc:pagehead", { title: "Ventes confidentielles", sub: "Pour les biens qui n'ont pas vocation à être publiés." }],
        ["misc:text", { title: "Une vente hors vitrine", paras: ["Certains propriétaires préfèrent une transaction discrète. Nous présentons le bien à un cercle restreint d'acquéreurs déjà qualifiés.", "Aucune annonce publique, aucun panneau : seulement une prise de contact directe."] }],
        ["feat:steps", { title: "Notre méthode", items: [{ t: "Entretien privé", d: "Étape 1", x: "Vos attentes, votre calendrier." }, { t: "Estimation argumentée", d: "Étape 2", x: "Comparables et positionnement." }, { t: "Présentation ciblée", d: "Étape 3", x: "Acquéreurs sélectionnés." }] }],
      ] },
      { key: "maison", name: "La maison", blocks: [
        ["misc:pagehead", { title: "La maison" }],
        ["misc:story", { eyebrow: "Depuis trois générations", title: "L'art de la transaction patiente", paras: ["Maison Héritage est une agence fictive de démonstration, pensée pour illustrer un site d'immobilier de prestige.", "Chaque mandat est suivi par un associé, du premier entretien à la remise des clés."] }],
        ["proof:stats", { items: [["38 ans", "d'expérience (exemple)"], ["120", "propriétés vendues (exemple)"], ["14", "langues parlées"]] }],
      ] },
      contact("Un entretien privé, sur rendez-vous.", "Écrivez-nous en confidence", "3 avenue des Platanes, 06400 Cannes", ["Envoyer", "/contact"], "Votre demande"),
    ],
  },

  // 3. Promoteur de programmes neufs
  {
    key: "programme-neuf", name: "Programme Neuf", category: "immobilier", tags: ["moderne", "geometrique"], siteType: "Promoteur de programmes neufs",
    description: "Site de promoteur au bleu électrique : affiche géante, programmes en cartes, calendrier de livraison en chronologie et tableau comparatif des typologies.",
    brand: "Axiale Promotion",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0b1b4d", accent: "#f5c542", background: "#f5f7fc", surface: "#ffffff", text: "#0f1b3a", muted: "#4a5678" }, fonts: { heading: "font.syne", body: "font.figtree", button: "font.figtree", link: "font.figtree" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 64, weight: 800, lineHeight: 1, letterSpacing: -0.03 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "axiale", motifs: ["skyline", "plates", "rays"] },
    head: ["head:float", {}],
    foot: ["foot:big", { title: "AXIALE" }],
    menu: [["Accueil", "/"], ["Programmes", "/programmes"], ["Acheter en neuf", "/acheter"], ["Calendrier", "/calendrier"], ["Contact", "/contact"]], cta: ["Être rappelé", "/contact"],
    contact: { address: "21 quai des Chartrons, 33000 Bordeaux", phone: "05 56 10 77 30", email: "programmes@axiale.example", hours: "Lundi au vendredi, 9 h – 18 h", tagline: "Des adresses neuves, pensées pour durer." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Programmes neufs", title: "Votre futur logement sort de terre.", sub: "Résidences en cœur de ville, du studio au 5 pièces, livrées avec garanties.", cta: ["Voir les programmes", "/programmes"] }],
        ["gal:cards", { eyebrow: "En commercialisation (démonstration)", title: "Trois résidences", items: [{ t: "Résidence Quai Nord", tag: "Livraison 2028", x: "42 logements, du T2 au T4, terrasses." }, { t: "Les Jardins du Parc", tag: "Livraison 2027", x: "28 logements, cœur d'îlot paysager." }, { t: "Atelier 9", tag: "Livraison 2029", x: "18 lofts et commerces en rez-de-chaussée." }] }],
        ["feat:bento", { title: "Pourquoi acheter dans le neuf", items: [{ t: "Frais de notaire réduits", x: "Jusqu'à 3 % du prix contre 8 % dans l'ancien (ordre de grandeur)." }, { t: "Normes récentes", x: "Isolation et performance énergétique actuelles." }, { t: "Garanties", x: "Parfait achèvement, biennale, décennale." }] }],
        ["proof:stats", { title: "Axiale en chiffres (exemples)", items: [["2 400", "logements livrés"], ["31", "résidences"], ["96 %", "de clients satisfaits"]] }],
        ["cta:split", { title: "Un projet d'achat ou d'investissement ?", sub: "Un conseiller étudie avec vous financement et choix du lot.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "programmes", name: "Programmes", blocks: [
        ["misc:pagehead", { title: "Nos programmes", sub: "Annonces de démonstration." }],
        ["gal:listings", { title: "Lots disponibles", items: [{ t: "T2 - Quai Nord", tag: "Neuf", price: "à partir de 238 000 €", x: "43 m², balcon, parking en option." }, { t: "T3 - Les Jardins du Parc", tag: "Neuf", price: "à partir de 329 000 €", x: "64 m², terrasse de 12 m²." }, { t: "T4 - Quai Nord", tag: "Neuf", price: "à partir de 449 000 €", x: "86 m², double exposition." }, { t: "Loft - Atelier 9", tag: "Neuf", price: "à partir de 395 000 €", x: "72 m², hauteur sous plafond 3,2 m." }] }],
        ["feat:compare", { title: "Comparer les typologies", rows: [["", "T2", "T3", "T4"], ["Surface", "40 – 46 m²", "60 – 68 m²", "82 – 90 m²"], ["Extérieur", "Balcon", "Terrasse", "Terrasse"], ["Prix indicatif", "dès 238 000 €", "dès 329 000 €", "dès 449 000 €"]] }],
      ] },
      { key: "acheter", name: "Acheter en neuf", blocks: [
        ["misc:pagehead", { title: "Acheter en neuf", sub: "Du contrat de réservation à la remise des clés." }],
        ["feat:steps", { title: "Le parcours", items: [{ t: "Choix du lot", d: "Jour 1", x: "Plans, orientation, étage." }, { t: "Contrat de réservation", d: "Mois 1", x: "Dépôt de garantie encadré par la loi." }, { t: "Acte de vente en l'état futur d'achèvement", d: "Mois 3", x: "Signature chez le notaire." }, { t: "Livraison", d: "À l'achèvement", x: "Visite de réception avec réserves éventuelles." }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Puis-je personnaliser mon logement ?", x: "Oui, selon l'avancement : choix de revêtements et cloisons." }, { t: "Quelles garanties ?", x: "Parfait achèvement, biennale et décennale." }, { t: "Puis-je investir en location ?", x: "Oui, sous réserve des dispositifs en vigueur ; un conseiller vous renseigne." }] }],
      ] },
      { key: "calendrier", name: "Calendrier", blocks: [
        ["misc:pagehead", { title: "Calendrier des livraisons" }],
        ["misc:schedule", { title: "Les prochaines étapes (exemple)", items: [{ d: "T1 2027", t: "Les Jardins du Parc", x: "Livraison et remise des clés." }, { d: "T3 2028", t: "Quai Nord", x: "Fin des travaux de gros œuvre." }, { d: "T2 2029", t: "Atelier 9", x: "Démarrage de la commercialisation." }] }],
        ["cta:band", { title: "Suivre un chantier", sub: "Photos mensuelles envoyées aux acquéreurs.", cta: ["Nous contacter", "/contact"] }],
      ] },
      contact("Un conseiller vous rappelle.", "Parlons de votre projet", "21 quai des Chartrons, 33000 Bordeaux", ["Être rappelé", "/contact"], "Demande de rappel"),
    ],
  },

  // 4. Gestion locative
  {
    key: "gestion-claire", name: "Gestion Claire", category: "immobilier", tags: ["minimaliste", "moderne"], siteType: "Gestion locative pour propriétaires bailleurs",
    description: "Site de gestionnaire locatif en vert olive frais : message rassurant en grand, tarifs forfaitaires lisibles, foire aux questions et espace pour bailleurs et locataires.",
    brand: "Clé Sereine Gestion",
    tokens: { colors: { primary: "#4d7c0f", secondary: "#1f3310", accent: "#f59e0b", background: "#f8faf3", surface: "#ffffff", text: "#1e2a14", muted: "#55634a" }, fonts: { heading: "font.epilogue", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 6, md: 10, lg: 14, button: 8, field: 8, card: 12 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 800, lineHeight: 1.08, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "clesereine", motifs: ["tiles", "botanical", "objects"] },
    head: ["head:bar", {}],
    foot: ["foot:newsletter", { title: "Le courrier du bailleur", sub: "Un message par trimestre : loyers, loi, entretien.", button: "S'inscrire" }],
    menu: [["Accueil", "/"], ["Nos formules", "/tarifs"], ["Propriétaires", "/proprietaires"], ["Locataires", "/locataires"], ["Contact", "/contact"]], cta: ["Confier mon bien", "/contact"],
    contact: { address: "5 rue du Marché, 69003 Lyon", phone: "04 72 30 55 90", email: "gestion@cle-sereine.example", hours: "Lundi au vendredi, 8 h 30 – 17 h 30", tagline: "Louez sans y penser." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Gestion locative", title: "Votre loyer arrive. Le reste, c'est pour nous.", sub: "Recherche de locataires, quittances, travaux, régularisation des charges : un seul interlocuteur.", cta: ["Voir les formules", "/tarifs"], cta2: ["Être rappelé", "/contact"] }],
        ["feat:grid-icons", { title: "Ce que nous prenons en charge", items: [{ t: "Mise en location", x: "Annonce, visites, sélection du dossier.", icon: "home" }, { t: "Loyers et quittances", x: "Encaissement et reversement mensuel.", icon: "coin" }, { t: "Travaux et entretien", x: "Devis, artisans de confiance, suivi.", icon: "settings" }, { t: "Obligations légales", x: "Diagnostics, révision, régularisation.", icon: "shield" }] }],
        ["proof:statsbar", { items: [["520", "lots gérés (exemple)"], ["1,2 %", "de loyers impayés (exemple)"], ["24 h", "délai de réponse"]] }],
        ["feat:accordion", { title: "Vos premières questions", items: [{ t: "Que se passe-t-il en cas d'impayé ?", x: "Relance, mise en demeure puis procédure ; une garantie en option couvre le loyer." }, { t: "Puis-je reprendre mon bien ?", x: "Oui, dans le respect du préavis légal." }] }],
        ["proof:quotes", { title: "Des bailleurs sereins", items: [{ q: "Je ne regarde plus mon compte avec inquiétude.", n: "Didier M.", r: "Bailleur, client fictif" }, { q: "Les travaux ont été chiffrés et suivis, sans mauvaise surprise.", n: "Sabine L.", r: "Bailleuse, cliente fictive" }] }],
        ["cta:card", { title: "Confier votre bien en dix minutes", sub: "Nous vous proposons un mandat clair, sans engagement caché.", cta: ["Prendre contact", "/contact"] }],
      ] },
      { key: "tarifs", name: "Nos formules", blocks: [
        ["misc:pagehead", { title: "Nos formules", sub: "Tarifs d'exemple, hors taxes." }],
        ["price:tiers", { items: [{ t: "Essentielle", price: "5,5 %", period: "du loyer", f: ["Encaissement des loyers", "Quittances", "Révision annuelle"], cta: ["Choisir", "/contact"] }, { t: "Sérénité", price: "7,5 %", period: "du loyer", hl: true, f: ["Tout l'essentiel", "Gestion des travaux", "Régularisation des charges", "Assurance loyers impayés"], cta: ["Choisir", "/contact"] }, { t: "Mise en location", price: "1 mois", period: "de loyer", f: ["Annonce et visites", "Dossier locataire vérifié", "Bail et état des lieux"], cta: ["Choisir", "/contact"] }] }],
        ["feat:compare", { title: "Comparer", rows: [["", "Essentielle", "Sérénité"], ["Encaissement", "oui", "oui"], ["Travaux", "non", "oui"], ["Loyers impayés", "non", "oui"]] }],
      ] },
      { key: "proprietaires", name: "Propriétaires", blocks: [
        ["misc:pagehead", { title: "Espace propriétaires" }],
        ["feat:steps", { title: "Confier son bien", items: [{ t: "Estimation du loyer", d: "Jour 1", x: "Analyse du marché local." }, { t: "Mandat de gestion", d: "Semaine 1", x: "Contrat transparent." }, { t: "Mise en location", d: "Semaines 2 à 4", x: "Visites et choix du dossier." }, { t: "Suivi mensuel", d: "Chaque mois", x: "Relevé de gérance clair." }] }],
        ["gal:listings", { title: "Biens que nous avons loués (démonstration)", items: [{ t: "Studio étudiant", tag: "Loué", price: "540 € / mois", x: "20 m², proche campus." }, { t: "T3 familial", tag: "Loué", price: "980 € / mois", x: "64 m², balcon." }, { t: "T2 meublé", tag: "Loué", price: "790 € / mois", x: "38 m², centre." }] }],
      ] },
      { key: "locataires", name: "Locataires", blocks: [
        ["misc:pagehead", { title: "Espace locataires" }],
        ["feat:list2", { title: "Dossier à constituer", items: [{ t: "Pièce d'identité" }, { t: "Trois derniers bulletins de salaire" }, { t: "Dernier avis d'imposition" }, { t: "Justificatif de domicile" }, { t: "Contrat de travail" }, { t: "Garant, le cas échéant" }] }],
        ["misc:faq", { title: "Questions de locataires", items: [{ t: "Comment signaler un problème ?", x: "Par le formulaire de contact ou par téléphone, en précisant l'adresse du logement." }, { t: "Quand rendre mon préavis ?", x: "Par courrier recommandé, selon la durée légale applicable." }] }],
      ] },
      contact("Une question sur votre bien ?", "Contactez notre équipe de gestion", "5 rue du Marché, 69003 Lyon", ["Envoyer", "/contact"], "Votre demande"),
    ],
  },

  // 5. Syndic de copropriété
  {
    key: "syndic-lisible", name: "Syndic Lisible", category: "immobilier", tags: ["classique", "editorial"], siteType: "Syndic de copropriété",
    description: "Site de syndic aux accents violet profond : en-tête de journal, textes très lisibles, calendrier d'assemblée et documents clairs pour les copropriétaires.",
    brand: "Cabinet Lisière Syndic",
    tokens: { colors: { primary: "#6d28d9", secondary: "#2b1456", accent: "#d97706", background: "#faf8fd", surface: "#ffffff", text: "#241638", muted: "#5d4f78" }, fonts: { heading: "font.newsreader", body: "font.ibm-plex-sans", button: "font.ibm-plex-sans", link: "font.ibm-plex-sans" }, radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#ddd4ee" }, type: { h1: { size: 50, weight: 600, lineHeight: 1.1 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "lisiere", motifs: ["plates", "tiles", "halftone"] },
    head: ["head:masthead", { dateline: "Gestion de copropriétés – Cabinet fictif" }],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Nos services", "/services"], ["Assemblées", "/assemblees"], ["Documents", "/documents"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "27 rue des Tanneurs, 67000 Strasbourg", phone: "03 88 40 12 66", email: "copro@lisiere-syndic.example", hours: "Lundi au vendredi, 9 h – 12 h et 14 h – 17 h 30", tagline: "Une copropriété claire est une copropriété sereine." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Syndic de copropriété", title: "La copropriété, expliquée et bien tenue.", sub: "Comptes lisibles, travaux suivis, assemblées préparées : le cabinet gère, vous êtes informés.", cta: ["Demander un devis", "/contact"] }],
        ["feat:rows", { eyebrow: "Nos missions", title: "Ce que fait un syndic, concrètement", items: [{ t: "Gestion comptable", x: "Budget prévisionnel, appels de fonds, comptes annuels." }, { t: "Entretien de l'immeuble", x: "Contrats, interventions, suivi des artisans." }, { t: "Assemblées générales", x: "Convocation, ordre du jour, procès-verbal." }, { t: "Suivi des travaux", x: "Devis comparés, votes, réception." }] }],
        ["proof:logos", { title: "Immeubles gérés (exemples fictifs)", items: ["Résidence des Tanneurs", "Le Clos Vauban", "Résidence Orangerie", "Tour des Halles", "Les Platanes"] }],
        ["feat:tabs", { title: "Pour qui ?", items: [{ t: "Petite copropriété", x: "Moins de 20 lots : gestion souple, honoraires maîtrisés." }, { t: "Résidence moyenne", x: "20 à 100 lots : conseil syndical accompagné." }, { t: "Grand ensemble", x: "Plus de 100 lots : équipe dédiée, gardiennage coordonné." }] }],
        ["proof:quotes", { title: "Retours de copropriétaires", items: [{ q: "Les comptes sont enfin compréhensibles.", n: "Odile F.", r: "Copropriétaire, cliente fictive" }, { q: "L'assemblée a duré une heure, tout était préparé.", n: "Marc T.", r: "Président du conseil syndical, client fictif" }] }],
        ["cta:image", { title: "Comparer votre syndic actuel ?", sub: "Étude gratuite de votre contrat en quarante-huit heures.", cta: ["Demander l'étude", "/contact"] }],
      ] },
      { key: "services", name: "Nos services", blocks: [
        ["misc:pagehead", { title: "Nos services" }],
        ["feat:pricelist", { title: "Honoraires indicatifs (exemple)", items: [{ t: "Gestion courante par lot et par an", x: "Contrat de base", price: "dès 165 €" }, { t: "Assemblée supplémentaire", x: "Hors assemblée annuelle", price: "420 €" }, { t: "Suivi de gros travaux", x: "En pourcentage du montant", price: "2 à 3 %" }] }],
        ["feat:strips", { title: "Inclus dans le contrat", items: [{ t: "Extranet des copropriétaires", x: "Documents et comptes accessibles à tout moment." }, { t: "Astreinte pour urgences", x: "Fuite, panne d'ascenseur, sinistre." }, { t: "Visite annuelle de l'immeuble", x: "Compte rendu remis au conseil syndical." }] }],
      ] },
      { key: "assemblees", name: "Assemblées", blocks: [
        ["misc:pagehead", { title: "Assemblées générales" }],
        ["misc:schedule", { title: "Préparer l'assemblée (exemple)", items: [{ d: "J - 45", t: "Fixation de la date", x: "Accord avec le conseil syndical." }, { d: "J - 21", t: "Convocation", x: "Envoi de l'ordre du jour et des documents." }, { d: "Jour J", t: "Tenue de l'assemblée", x: "Votes et procès-verbal." }, { d: "J + 8", t: "Procès-verbal", x: "Envoi aux copropriétaires." }] }],
        ["misc:faq", { items: [{ t: "Puis-je donner pouvoir ?", x: "Oui, à un autre copropriétaire, dans les limites fixées par la loi." }, { t: "Quelles décisions exigent la majorité renforcée ?", x: "Les travaux importants ; le syndic vous explique la règle applicable." }] }],
      ] },
      { key: "documents", name: "Documents", blocks: [
        ["misc:pagehead", { title: "Documents utiles" }],
        ["feat:list2", { title: "Disponibles sur l'extranet", items: [{ t: "Règlement de copropriété" }, { t: "Derniers procès-verbaux" }, { t: "Carnet d'entretien" }, { t: "Contrats en cours" }, { t: "Appels de fonds" }, { t: "Diagnostics de l'immeuble" }] }],
        ["misc:text", { title: "Un accès sécurisé", paras: ["Chaque copropriétaire reçoit des identifiants personnels. Les documents confidentiels restent réservés au conseil syndical.", "Cette page est une démonstration : l'extranet n'est pas fourni par ce modèle."] }],
      ] },
      contact("Un devis en quarante-huit heures.", "Parlons de votre immeuble", "27 rue des Tanneurs, 67000 Strasbourg", ["Envoyer", "/contact"], "Demande de devis"),
    ],
  },

  // 6. Chasseur de biens
  {
    key: "chasse-bien", name: "Chasse-Bien", category: "immobilier", tags: ["audacieux", "sombre"], siteType: "Chasseur de biens immobiliers",
    description: "Thème sombre bleu nuit et rose vif pour un chasseur de biens : accroche en gros caractères Gloock, méthode en étapes, honoraires affichés et dossiers de recherche.",
    brand: "Flair Chasseur de Biens",
    tokens: { colors: { primary: "#fb7185", secondary: "#1e293b", accent: "#fcd34d", background: "#0f172a", surface: "#172036", text: "#f1f5f9", muted: "#b3bfd1" }, fonts: { heading: "font.gloock", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 8, card: 12 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.04, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "flair", motifs: ["mesh", "arches", "rays"] },
    head: ["head:dark", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["La méthode", "/methode"], ["Honoraires", "/honoraires"], ["Dossiers", "/dossiers"], ["Contact", "/contact"]], cta: ["Lancer ma recherche", "/contact"],
    contact: { address: "9 rue du Four, 44000 Nantes", phone: "02 40 71 08 24", email: "recherche@flair-chasseur.example", hours: "Sur rendez-vous, lundi au vendredi", tagline: "On trouve ce qui n'est pas encore à vendre." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Chasseur de biens", title: "Le bon bien se trouve avant qu'il soit en vitrine.", sub: "Nous cherchons pour vous, négocions pour vous et vous accompagnons jusqu'à la signature.", cta: ["Lancer ma recherche", "/contact"], cta2: ["Voir la méthode", "/methode"], stats: [["70 %", "des biens trouvés hors annonces (exemple)"], ["9 sem.", "délai moyen (exemple)"]] }],
        ["feat:steps", { title: "Notre chasse en quatre temps", items: [{ t: "Cahier des charges", d: "Semaine 1", x: "Budget, quartiers, critères non négociables." }, { t: "Prospection", d: "Semaines 2 à 6", x: "Réseau, notaires, porte-à-porte, veille." }, { t: "Sélection et visites", d: "Semaines 5 à 8", x: "Trois biens maximum, chiffrés et argumentés." }, { t: "Négociation", d: "Semaine 9", x: "Prix, conditions, calendrier." }] }],
        ["gal:masonry", { title: "Quelques trouvailles (démonstration)", items: [{ t: "Maison de ville", x: "Trouvée avant mise en vente." }, { t: "Loft industriel", x: "Négocié 9 % sous l'annonce." }, { t: "Pied-à-terre", x: "Acquis en une semaine." }, { t: "Immeuble de rapport", x: "Repéré chez un notaire." }] }],
        ["proof:big", { items: [{ q: "On cherchait depuis un an. Ils ont trouvé en deux mois et négocié mieux que nous ne l'aurions fait.", n: "Pauline et Ismaël", r: "Acquéreurs, clients fictifs" }] }],
        ["feat:checks", { title: "Pour qui est-ce utile ?", cta: ["Parler de mon projet", "/contact"], items: [{ t: "Vous manquez de temps" }, { t: "Vous changez de région" }, { t: "Vous voulez négocier avec appui" }] }],
      ] },
      { key: "methode", name: "La méthode", blocks: [
        ["misc:pagehead", { title: "La méthode" }],
        ["feat:alt", { title: "Comment nous travaillons", items: [{ t: "Un portrait de vos besoins", x: "Un long entretien pour comprendre votre mode de vie.", link: ["Nous contacter", "/contact"] }, { t: "Une veille permanente", x: "Les biens avant leur diffusion publique.", link: ["Voir les dossiers", "/dossiers"] }, { t: "Un dossier d'analyse", x: "Prix du marché, travaux, potentiel de revente.", link: ["Honoraires", "/honoraires"] }] }],
        ["misc:quote", { text: "Un bon achat n'est pas un bon prix, c'est un bon prix pour la bonne personne.", by: "Maxime Ferrand, fondateur fictif" }],
      ] },
      { key: "honoraires", name: "Honoraires", blocks: [
        ["misc:pagehead", { title: "Honoraires", sub: "Exemples indicatifs." }],
        ["price:tiers", { items: [{ t: "Sélection", price: "2,5 %", period: "du prix d'achat", f: ["Cahier des charges", "Recherche hors marché", "Dossier d'analyse"], cta: ["Choisir", "/contact"] }, { t: "Accompagnement complet", price: "4 %", period: "du prix d'achat", hl: true, f: ["Tout Sélection", "Négociation", "Suivi jusqu'à l'acte", "Conseil travaux"], cta: ["Choisir", "/contact"] }, { t: "Forfait à la carte", price: "dès 1 800 €", f: ["Visite-conseil", "Avis sur un bien précis"], cta: ["Choisir", "/contact"] }] }],
        ["misc:faq", { items: [{ t: "Quand paie-t-on ?", x: "Un acompte à la signature du mandat, le solde à l'acte." }, { t: "Y a-t-il un engagement de résultat ?", x: "Nous nous engageons sur la méthode, pas sur un prix." }] }],
      ] },
      { key: "dossiers", name: "Dossiers", blocks: [
        ["misc:pagehead", { title: "Dossiers de recherche" }],
        ["gal:listings", { title: "Biens en cours de présentation (démonstration)", items: [{ t: "Maison de ville avec patio", tag: "Hors marché", price: "524 000 €", x: "130 m², 4 chambres." }, { t: "Appartement bourgeois", tag: "Hors marché", price: "410 000 €", x: "95 m², hauteur 3 m." }, { t: "Atelier reconverti", tag: "Hors marché", price: "355 000 €", x: "88 m², cour privative." }] }],
        ["feat:icons", { title: "Ce que contient un dossier", items: [{ t: "Prix de marché comparé", x: "Dix ventes récentes.", icon: "barChart" }, { t: "Travaux estimés", x: "Chiffrage indicatif.", icon: "settings" }, { t: "Avis du quartier", x: "Transports, écoles, projets.", icon: "mapPin" }] }],
      ] },
      contact("Racontez-nous votre projet.", "Lançons votre recherche", "9 rue du Four, 44000 Nantes", ["Envoyer", "/contact"], "Votre projet"),
    ],
  },

  // 7. Immobilier de bureaux
  {
    key: "tour-bureaux", name: "Tour Bureaux", category: "immobilier", tags: ["technique", "moderne"], siteType: "Conseil en immobilier de bureaux",
    description: "Site de conseil en immobilier d'entreprise : bleu acier, titres Archivo droits, recherche par surface et tableau comparatif, pensé pour dirigeants et directions financières.",
    brand: "Surface & Co Bureaux",
    tokens: { colors: { primary: "#0369a1", secondary: "#0c2a3d", accent: "#f97316", background: "#f1f5f8", surface: "#ffffff", text: "#10222f", muted: "#4a5f6e" }, fonts: { heading: "font.archivo", body: "font.poppins", button: "font.archivo", link: "font.archivo" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#c9d6df" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.04, letterSpacing: -0.02 }, h2: { size: 34, weight: 700, lineHeight: 1.12 } } },
    dna: { scale: "l", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "surfaceco", motifs: ["skyline", "plates", "topo"] },
    head: ["head:split", {}],
    foot: ["foot:columns", { about: "Surface & Co conseille les entreprises dans leurs recherches, négociations et réaménagements de bureaux (cabinet fictif).", cols: [["Services", "Recherche de locaux", "Négociation de bail", "Aménagement"], ["Cabinet", "Références", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Offres", "/offres"], ["Services", "/services"], ["Références", "/references"], ["Contact", "/contact"]], cta: ["Décrire mon besoin", "/contact"],
    contact: { address: "Tour Équinoxe, 12 esplanade Nord, 92400 Courbevoie", phone: "01 41 02 60 35", email: "entreprise@surface-co.example", hours: "Lundi au vendredi, 8 h 30 – 18 h 30", tagline: "Les bons mètres carrés pour votre équipe." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Immobilier d'entreprise", title: "Des bureaux à la mesure de votre équipe.", sub: "Recherche, négociation et aménagement, avec un seul référent.", placeholder: "Ville, surface en m², budget…" }],
        ["feat:cards", { title: "Nos expertises", items: [{ t: "Recherche de locaux", x: "Bureaux, coworking, plateaux clés en main.", icon: "search" }, { t: "Négociation de bail", x: "Loyer, franchise, clauses de sortie.", icon: "briefcase" }, { t: "Aménagement", x: "Plans, mobilier, déménagement.", icon: "layout" }] }],
        ["gal:listings", { title: "Offres du moment (démonstration)", items: [{ t: "Plateau de 420 m²", tag: "Location", price: "310 € / m² / an", x: "La Défense, 11e étage, divisible." }, { t: "Bureaux de 120 m²", tag: "Location", price: "260 € / m² / an", x: "Lyon Part-Dieu, clés en main." }, { t: "Immeuble de 1 900 m²", tag: "Vente", price: "Sur demande", x: "Lille, parking de 40 places." }] }],
        ["proof:stats", { title: "Quelques repères (exemples)", items: [["210", "entreprises accompagnées"], ["−14 %", "de loyer négocié en moyenne"], ["35 000", "m² placés par an"]] }],
        ["proof:logos", { title: "Elles nous ont fait confiance (noms fictifs)", items: ["Brevia", "Kardan Tech", "Studio Orme", "Lumen Santé", "Nauta Logistique"] }],
        ["cta:split", { title: "Votre bail arrive à échéance ?", sub: "Nous analysons vos options six à douze mois avant.", cta: ["Parlons-en", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ["misc:pagehead", { title: "Offres de bureaux", sub: "Annonces de démonstration." }],
        ["gal:listings", { title: "Locaux disponibles", items: [{ t: "Plateau de 420 m²", tag: "Location", price: "310 € / m² / an", x: "La Défense." }, { t: "Bureaux de 120 m²", tag: "Location", price: "260 € / m² / an", x: "Lyon." }, { t: "Espace de 60 m²", tag: "Location", price: "1 900 € / mois", x: "Nantes, coworking privatif." }, { t: "Immeuble de 1 900 m²", tag: "Vente", price: "Sur demande", x: "Lille." }] }],
        ["feat:compare", { title: "Bail commercial ou coworking ?", rows: [["", "Bail 3-6-9", "Coworking"], ["Durée", "9 ans, sortie triennale", "Mensuelle"], ["Aménagement", "À votre charge", "Fourni"], ["Coût au poste", "Plus bas à long terme", "Plus souple"]] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ["misc:pagehead", { title: "Nos services" }],
        ["feat:bento", { title: "Un accompagnement de bout en bout", items: [{ t: "Cahier des charges", x: "Surface, effectifs, télétravail, croissance prévue." }, { t: "Visites comparées", x: "Grille d'analyse commune pour chaque site." }, { t: "Négociation et bail", x: "Nous défendons vos intérêts jusqu'à la signature." }] }],
        ["feat:steps", { title: "Calendrier type", items: [{ t: "Brief", d: "Semaine 1", x: "Besoins et budget." }, { t: "Short-list", d: "Semaine 3", x: "Cinq sites comparés." }, { t: "Négociation", d: "Semaine 8", x: "Offres et lettre d'intention." }, { t: "Bail et emménagement", d: "Mois 5", x: "Signature et déménagement." }] }],
      ] },
      { key: "references", name: "Références", blocks: [
        ["misc:pagehead", { title: "Références" }],
        ["proof:quotes", { title: "Retours de dirigeants", items: [{ q: "Nous avons réduit notre surface de 20 % sans perdre en confort.", n: "Laure D.", r: "Directrice générale, cliente fictive" }, { q: "Un calendrier tenu et une négociation sérieuse.", n: "Ahmed K.", r: "Directeur financier, client fictif" }] }],
        ["gal:cards", { title: "Missions récentes (démonstration)", items: [{ t: "Siège de 80 postes", tag: "Lyon", x: "Regroupement de trois sites." }, { t: "Agence régionale", tag: "Lille", x: "Négociation de 12 mois de franchise." }, { t: "Start-up en croissance", tag: "Paris", x: "Bail flexible, extension prévue." }] }],
      ] },
      contact("Décrivez-nous votre besoin.", "Un référent vous rappelle", "Tour Équinoxe, 12 esplanade Nord, 92400 Courbevoie", ["Envoyer", "/contact"], "Votre besoin"),
    ],
  },

  // 8. Montagne et littoral
  {
    key: "cimes-et-rivages", name: "Cimes et Rivages", category: "immobilier", tags: ["naturel", "chaleureux"], siteType: "Immobilier de montagne et de littoral",
    description: "Agence double ancrage, chalets et villas bord de mer : vert forêt marin, grand visuel de couverture, biens classés par saison et conseils d'achat en résidence secondaire.",
    brand: "Cimes & Rivages",
    tokens: { colors: { primary: "#0f766e", secondary: "#0c3b39", accent: "#e2b34a", background: "#f2f8f6", surface: "#ffffff", text: "#12302d", muted: "#4b6662" }, fonts: { heading: "font.bricolage-grotesque", body: "font.lora", button: "font.bricolage-grotesque", link: "font.lora" }, radius: { sm: 8, md: 14, lg: 22, button: 14, field: 10, card: 20 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.04, letterSpacing: -0.025 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "soft" }, art: { seed: "cimes", motifs: ["mountains", "waves", "dunes"] },
    head: ["head:side", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Montagne", "/montagne"], ["Littoral", "/littoral"], ["Conseils", "/conseils"], ["Contact", "/contact"]], cta: ["Trouver ma résidence", "/contact"],
    contact: { address: "2 quai du Port, 74000 Annecy", phone: "04 50 23 88 14", email: "agence@cimes-rivages.example", hours: "Tous les jours en saison, 9 h – 19 h", tagline: "Chalets et villas, entre sommets et vagues." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Résidences secondaires", title: "Un pied dans la neige, l'autre dans les vagues.", sub: "Chalets, appartements au pied des pistes et maisons de pêcheurs, suivis par une équipe qui y vit toute l'année.", cta: ["Voir la montagne", "/montagne"], cta2: ["Voir le littoral", "/littoral"] }],
        ["feat:tabs", { title: "Choisir sa destination", items: [{ t: "Montagne", x: "Chalets individuels, appartements ski aux pieds, studios de saison." }, { t: "Lac", x: "Maisons au bord du lac, pontons privés, vue sur les sommets." }, { t: "Littoral", x: "Maisons de pêcheurs, villas avec jardin, appartements face à la mer." }] }],
        ["gal:listings", { eyebrow: "Annonces de démonstration", title: "Coups de cœur", items: [{ t: "Chalet 6 chambres", tag: "Montagne", price: "1 290 000 €", x: "210 m², sauna, skis aux pieds." }, { t: "Villa vue mer", tag: "Littoral", price: "980 000 €", x: "165 m², jardin, 200 m de la plage." }, { t: "Studio cabine", tag: "Montagne", price: "176 000 €", x: "22 m², 4 couchages, balcon sud." }] }],
        ["proof:statsbar", { items: [["18 ans", "sur les deux territoires"], ["6", "stations couvertes"], ["12 plages", "à moins de 10 min (exemple)"]] }],
        ["feat:list2", { title: "Nos services de résidence secondaire", items: [{ t: "Gestion des clés" }, { t: "Mise en location saisonnière" }, { t: "Ménage et remise en état" }, { t: "Suivi des travaux" }, { t: "Accueil des voyageurs" }, { t: "Contrôle hivernal" }] }],
        ["cta:image", { title: "Un projet de résidence secondaire ?", sub: "Choisissons ensemble le bon lieu et le bon rendement.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "montagne", name: "Montagne", blocks: [
        ["misc:pagehead", { title: "Biens de montagne", sub: "Annonces de démonstration." }],
        ["gal:listings", { title: "Chalets et appartements", items: [{ t: "Chalet 6 chambres", tag: "Vente", price: "1 290 000 €", x: "210 m², sauna." }, { t: "Appartement skis aux pieds", tag: "Vente", price: "445 000 €", x: "46 m², exposition sud." }, { t: "Studio cabine", tag: "Vente", price: "176 000 €", x: "22 m², 4 couchages." }, { t: "Chalet de saison", tag: "Location", price: "2 800 € / semaine", x: "8 personnes." }] }],
        ["feat:checks", { title: "À vérifier avant d'acheter en altitude", cta: ["Nous poser une question", "/contact"], items: [{ t: "Accès hivernal et déneigement" }, { t: "Charges de copropriété" }, { t: "Règles de location saisonnière" }] }],
      ] },
      { key: "littoral", name: "Littoral", blocks: [
        ["misc:pagehead", { title: "Biens du littoral", sub: "Annonces de démonstration." }],
        ["gal:listings", { title: "Villas et maisons", items: [{ t: "Villa vue mer", tag: "Vente", price: "980 000 €", x: "165 m², 4 chambres." }, { t: "Maison de pêcheur", tag: "Vente", price: "520 000 €", x: "78 m², cour fleurie." }, { t: "Appartement face à la plage", tag: "Vente", price: "398 000 €", x: "52 m², terrasse." }, { t: "Villa de vacances", tag: "Location", price: "3 600 € / semaine", x: "10 personnes, piscine." }] }],
        ["feat:icons", { title: "Ce qui compte au bord de la mer", items: [{ t: "Exposition aux tempêtes", x: "Nous documentons l'histoire du bien.", icon: "alertTriangle" }, { t: "Servitudes littorales", x: "Distance au rivage, règles d'urbanisme.", icon: "globe" }, { t: "Entretien salin", x: "Menuiseries et toitures adaptées.", icon: "settings" }] }],
      ] },
      { key: "conseils", name: "Conseils", blocks: [
        ["misc:pagehead", { title: "Conseils d'achat" }],
        ["misc:faq", { title: "Questions courantes", items: [{ t: "Puis-je louer à la semaine ?", x: "Souvent oui ; la commune peut imposer un enregistrement du meublé." }, { t: "Quelle fiscalité ?", x: "Elle dépend de votre situation ; nous vous orientons vers un conseiller dédié." }, { t: "Et si le chalet reste vide ?", x: "Nous proposons une gestion complète clés en main." }] }],
        ["misc:hours", { title: "Ouverture de l'agence", rows: [["Haute saison", "7 j / 7, 9 h – 19 h"], ["Hors saison", "Mardi – samedi, 9 h – 18 h"]] }],
      ] },
      contact("Dites-nous où vous rêvez d'habiter.", "Parlons de votre projet", "2 quai du Port, 74000 Annecy", ["Envoyer", "/contact"], "Votre projet"),
    ],
  },

  // 9. Résidences seniors
  {
    key: "automne-dore", name: "Automne Doré", category: "immobilier", tags: ["chaleureux", "classique"], siteType: "Résidences services pour seniors",
    description: "Résidences seniors accueillantes : fuchsia doux, grande taille de texte, titres Young Serif, repères de vie quotidienne, tarifs mensuels et visite sur rendez-vous.",
    brand: "Résidences Automne Doré",
    tokens: { colors: { primary: "#a21caf", secondary: "#4a1150", accent: "#e8a33d", background: "#fdf7fb", surface: "#ffffff", text: "#2f1a33", muted: "#664a6b" }, fonts: { heading: "font.young-serif", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "sm", button: "sm" }, type: { h1: { size: 52, weight: 400, lineHeight: 1.12 }, body: { size: 18 } }, buttons: { paddingY: 16, paddingX: 32 } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "pill" }, art: { seed: "automne", motifs: ["botanical", "blobs", "bokeh"] },
    head: ["head:minimal", {}],
    foot: ["foot:columns", { about: "Résidences Automne Doré : logements indépendants, services à la carte et vie sociale pour seniors autonomes (résidences fictives).", cols: [["Résidences", "Nos logements", "Services", "Tarifs"], ["Pratique", "Visite", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Logements", "/logements"], ["Vie quotidienne", "/vie"], ["Tarifs", "/tarifs"], ["Visite", "/contact"]], cta: ["Planifier une visite", "/contact"],
    contact: { address: "6 allée des Tilleuls, 37000 Tours", phone: "02 47 62 18 40", email: "accueil@automne-dore.example", hours: "Tous les jours, 9 h – 18 h", tagline: "Chez soi, et jamais seul." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Résidences services seniors", title: "Un chez-soi lumineux, des voisins, des services quand vous le souhaitez.", sub: "Appartements indépendants, restauration, animations et présence rassurante, dans le respect de votre autonomie.", cta: ["Planifier une visite", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
        ["feat:icons", { title: "Au quotidien", items: [{ t: "Un logement à vous", x: "Du studio au 3 pièces, avec cuisine et terrasse.", icon: "home" }, { t: "Une présence rassurante", x: "Équipe sur place et assistance téléphonique nuit et jour.", icon: "shield" }, { t: "Une vie sociale", x: "Ateliers, sorties, jardin partagé.", icon: "users" }] }],
        ["gal:wall", { title: "La vie à la résidence", items: [{ t: "Salon de lecture" }, { t: "Jardin partagé" }, { t: "Restaurant" }, { t: "Atelier de peinture" }] }],
        ["proof:quotes", { title: "Ce qu'ils en disent", items: [{ q: "Je retrouve des visages tous les matins et je garde mes habitudes.", n: "Georgette A.", r: "Résidente, cliente fictive" }, { q: "Ma mère a repris goût aux sorties.", n: "Bruno C.", r: "Fils d'une résidente, client fictif" }] }],
        ["feat:accordion", { title: "Questions de familles", items: [{ t: "Peut-on venir avec ses meubles ?", x: "Oui, le logement est livré vide ou meublé selon votre souhait." }, { t: "Et en cas de perte d'autonomie ?", x: "Nous travaillons avec des services de soins à domicile et orientons vers des établissements médicalisés si besoin." }] }],
        ["cta:band", { title: "Venez déjeuner avec nous", sub: "Une journée découverte, sans engagement.", cta: ["Réserver ma visite", "/contact"] }],
      ] },
      { key: "logements", name: "Logements", blocks: [
        ["misc:pagehead", { title: "Nos logements", sub: "Logements de démonstration." }],
        ["gal:listings", { title: "Disponibles prochainement", items: [{ t: "Studio lumineux", tag: "Location", price: "1 190 € / mois", x: "28 m², kitchenette, balcon." }, { t: "Deux pièces", tag: "Location", price: "1 640 € / mois", x: "42 m², salle de bains adaptée." }, { t: "Trois pièces", tag: "Location", price: "2 080 € / mois", x: "61 m², terrasse." }] }],
        ["feat:list2", { title: "Dans chaque logement", items: [{ t: "Douche à l'italienne" }, { t: "Barres d'appui" }, { t: "Volets motorisés" }, { t: "Bouton d'appel" }, { t: "Cuisine équipée" }, { t: "Prise pour mobilier personnel" }] }],
      ] },
      { key: "vie", name: "Vie quotidienne", blocks: [
        ["misc:pagehead", { title: "Vie quotidienne" }],
        ["misc:schedule", { title: "Une semaine type (exemple)", items: [{ d: "Lundi 10 h", t: "Gymnastique douce", x: "Dans le salon." }, { d: "Mercredi 15 h", t: "Atelier mémoire", x: "Jeux et discussions." }, { d: "Vendredi 11 h", t: "Sortie au marché", x: "Navette de la résidence." }, { d: "Dimanche 16 h", t: "Concert au salon", x: "Invités et familles bienvenus." }] }],
        ["feat:strips", { title: "Services à la carte", items: [{ t: "Restauration", x: "Déjeuner au restaurant ou plateau en chambre." }, { t: "Ménage et linge", x: "Passage hebdomadaire." }, { t: "Coiffure et soins", x: "Intervenants indépendants." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Exemples indicatifs, par mois." }],
        ["price:tiers", { items: [{ t: "Studio", price: "1 190 €", period: "par mois", f: ["28 m²", "Charges comprises", "Accès aux animations"], cta: ["Visiter", "/contact"] }, { t: "Deux pièces", price: "1 640 €", period: "par mois", hl: true, f: ["42 m²", "Charges comprises", "Accès aux animations"], cta: ["Visiter", "/contact"] }, { t: "Trois pièces", price: "2 080 €", period: "par mois", f: ["61 m²", "Terrasse", "Accès aux animations"], cta: ["Visiter", "/contact"] }] }],
        ["feat:pricelist", { title: "Services optionnels", items: [{ t: "Déjeuner au restaurant", x: "Par repas", price: "14 €" }, { t: "Ménage hebdomadaire", x: "Par mois", price: "96 €" }, { t: "Assistance nuit", x: "Par mois", price: "38 €" }] }],
      ] },
      contact("Une visite, un déjeuner, une question.", "Rencontrons-nous", "6 allée des Tilleuls, 37000 Tours", ["Envoyer", "/contact"], "Planifier une visite"),
    ],
  },
];
