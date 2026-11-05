// Immobilier, lot B (9 thèmes, architecture et aménagement). Textes de DÉMONSTRATION : entreprises, projets, prix, personnes et coordonnées fictifs.
const contact = (sub, title, addr, cta, formTitle) => ({ key: "contact", name: "Contact", blocks: [
  ["misc:pagehead", { title: "Contact", sub }],
  ["contact:info", { title, formTitle, cta }],
  ["contact:map", { mapAddress: addr }],
] });

module.exports = [
  // 1. Cabinet d'architectes
  {
    key: "equerre-claire", name: "Équerre Claire", category: "immobilier", tags: ["editorial", "audacieux"], siteType: "Cabinet d'architectes",
    description: "Cabinet d'architectes en papier chaud et vermillon : énorme titre éditorial, galerie en mosaïque de projets et pieds de page à colonnes.",
    brand: "Atelier Équerre & Cie",
    tokens: { colors: { primary: "#c2410c", secondary: "#1c1917", accent: "#f59e0b", background: "#f6f4ef", surface: "#ffffff", text: "#1c1917", muted: "#57534e" }, fonts: { heading: "font.league-spartan", body: "font.literata", button: "font.league-spartan", link: "font.literata" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 700, lineHeight: 1.0, letterSpacing: -0.02 } }, border: { width: 1, color: "#d6d1c7" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "equerre", motifs: ["plates", "skyline", "topo"] },
    head: ["head:bar", {}],
    foot: ["foot:columns", { about: "Atelier Équerre & Cie, architecture de logements, d'équipements et de réhabilitations (cabinet fictif).", cols: [["Atelier", "Projets", "Méthode", "Équipe"], ["Contact", "Nous écrire", "Concours", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Projets", "/projets"], ["Méthode", "/methode"], ["Équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Parler de votre projet", "/contact"],
    contact: { address: "14 rue des Entrepôts, 69007 Lyon", phone: "04 72 00 41 18", email: "atelier@equerre-claire.example", hours: "Lundi au vendredi, 9 h – 18 h", tagline: "Architecture sobre, précise, habitée." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Architecture, urbanisme, réhabilitation", title: "Bâtir juste, dessiner net.", sub: "Dix-huit architectes lyonnais pour des logements, écoles et équipements pensés dès le premier trait avec leurs usagers." }],
        ["feat:rows", { eyebrow: "Ce que nous faisons", title: "Du croquis au chantier", items: [{ t: "Études de faisabilité", x: "Capacité du terrain, règlement, budget : un avis clair avant de s'engager." }, { t: "Conception et permis", x: "Esquisse, avant-projet, dossier de permis de construire et pièces de consultation." }, { t: "Suivi de chantier", x: "Visites hebdomadaires, comptes rendus et réception sans mauvaise surprise." }] }],
        ["gal:masonry", { title: "Projets récents", items: [{ t: "École des Pierres Plantées", x: "Groupe scolaire de 12 classes, bois et brique." }, { t: "Onze logements Gerland", x: "Habitat collectif en coursives ouvertes." }, { t: "Halle Perrache", x: "Réhabilitation d'une ancienne halle en pôle associatif." }, { t: "Maison sur la colline", x: "Villa en béton clair et mélèze." }, { t: "Crèche Les Quinconces", x: "Petite enfance, cour intérieure abritée." }] }],
        ["proof:statsbar", { items: [["31 ans", "d'atelier"], ["146", "ouvrages livrés (exemple)"], ["9", "prix et mentions (exemple)"]] }],
        ["cta:split", { title: "Un terrain, un bâtiment à transformer ?", sub: "Premier rendez-vous d'une heure, offert.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ["misc:pagehead", { title: "Projets", sub: "Une sélection de réalisations de démonstration." }],
        ["gal:cards", { items: [{ t: "École des Pierres Plantées", tag: "Équipement", x: "Lyon 8e, 2 400 m²." }, { t: "Onze logements Gerland", tag: "Logement", x: "Lyon 7e, 960 m²." }, { t: "Halle Perrache", tag: "Réhabilitation", x: "Lyon 2e, 1 800 m²." }, { t: "Maison sur la colline", tag: "Maison", x: "Caluire, 190 m²." }, { t: "Crèche Les Quinconces", tag: "Équipement", x: "Villeurbanne, 640 m²." }, { t: "Bureaux du Vallon", tag: "Tertiaire", x: "Écully, 1 200 m²." }] }],
        ["proof:logos", { title: "Maîtres d'ouvrage (exemples)", items: ["Métropole Habitat Rhône", "Mairie de Bellefond", "Fondation Pierre Nova", "SCI Les Quinconces"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ["misc:pagehead", { title: "Notre méthode", sub: "Cinq phases, une équipe constante." }],
        ["feat:steps", { items: [{ t: "Écoute et programme", d: "Mois 1", x: "Ateliers avec les usagers, relevé du site, budget cadré." }, { t: "Esquisse", d: "Mois 2", x: "Trois partis comparés, maquette et coût estimé." }, { t: "Permis et consultation", d: "Mois 3 à 6", x: "Dossier déposé, entreprises consultées, offres analysées." }, { t: "Chantier", d: "Mois 8 à 20", x: "Suivi hebdomadaire, tenue du budget et du calendrier." }] }],
        ["misc:faq", { title: "Questions sur la maîtrise d'œuvre", items: [{ t: "Comment sont calculés vos honoraires ?", x: "En pourcentage du coût des travaux, de 8 à 13 % selon la complexité (exemple)." }, { t: "Intervenez-vous sur de petits projets ?", x: "Oui, dès une extension de 40 m²." }, { t: "Faut-il un architecte pour un permis ?", x: "Obligatoire au-delà de 150 m² de surface de plancher." }] }],
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        ["misc:pagehead", { title: "L'atelier" }],
        ["misc:story", { eyebrow: "Depuis 1994", title: "Une table commune, dix-huit regards", paras: ["Nous partageons un seul plateau pour que l'urbaniste, le paysagiste et l'architecte se croisent chaque jour.", "Chaque projet est tenu de bout en bout par le même chef de projet."], image: "portrait-2" }],
        ["proof:team", { items: [{ n: "Hélène Marcourt", r: "Architecte associée" }, { n: "Yannis Brodeau", r: "Architecte associé" }, { n: "Camille Devillers", r: "Cheffe de projet chantier" }] }],
      ] },
      contact("Nous répondons sous deux jours ouvrés.", "Racontez-nous votre projet", "14 rue des Entrepôts, 69007 Lyon", ["Envoyer le message", "/contact"], "Votre projet en quelques lignes"),
    ],
  },

  // 2. Architecte d'intérieur (sombre)
  {
    key: "velours-de-piece", name: "Velours de Pièce", category: "immobilier", tags: ["sombre", "luxe"], siteType: "Architecte d'intérieur",
    description: "Architecture d'intérieur en prune profonde et rose poudré : photographie plein cadre, titres Cormorant fins, réalisations par pièce et formules d'accompagnement.",
    isNew: true, brand: "Velours & Pièce",
    tokens: { colors: { primary: "#e08fbd", secondary: "#120c14", accent: "#f0c27b", background: "#1d1520", surface: "#2a1f2e", text: "#f5ecf3", muted: "#c4b0c0" }, fonts: { heading: "font.cormorant-garamond", body: "font.source-sans-3", button: "font.source-sans-3", link: "font.source-sans-3" }, radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 62, weight: 500, lineHeight: 1.04, letterSpacing: 0 } }, border: { width: 1, color: "#4a3a4e" } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "soft" }, art: { seed: "velours", motifs: ["arches", "bokeh", "ribbons"] },
    head: ["head:split", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Réalisations", "/realisations"], ["Accompagnement", "/accompagnement"], ["L'agence", "/agence"], ["Contact", "/contact"]], cta: ["Rendez-vous conseil", "/contact"],
    contact: { address: "5 rue du Bel Air, 33000 Bordeaux", phone: "05 56 00 28 74", email: "bonjour@velours-de-piece.example", hours: "Du mardi au vendredi, 10 h – 18 h", tagline: "Des intérieurs qui vous ressemblent." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Architecture d'intérieur à Bordeaux", title: "Chaque pièce a une histoire à raconter.", sub: "Appartements haussmanniens, échoppes et maisons de famille repensés avec des matières vraies et une lumière juste.", cta: ["Voir les réalisations", "/realisations"], overlay: "#120c14b3" }],
        ["feat:alt", { title: "Une approche pièce par pièce", items: [{ t: "Plans et volumes", x: "Nous redessinons la circulation, ouvrons ce qui doit l'être, gardons moulures et parquets." }, { t: "Matières et couleurs", x: "Planche d'échantillons, peintures minérales, velours, pierre et laiton brossé." }, { t: "Mobilier sur mesure", x: "Bibliothèques, cuisines et dressings dessinés puis fabriqués par des artisans girondins." }] }],
        ["gal:wall", { title: "Dernières pièces", items: [{ t: "Salon en velours bleu nuit" }, { t: "Cuisine en chêne fumé" }, { t: "Salle de bain en terrazzo" }, { t: "Chambre sous combles" }] }],
        ["proof:big", { items: [{ q: "Notre échoppe est devenue le lieu que nous n'osions pas imaginer, sans jamais perdre son âme.", n: "Marion et Éric T.", r: "Clients fictifs" }] }],
        ["cta:card", { title: "Parlons de votre intérieur.", sub: "Un premier rendez-vous de conseil de 90 minutes, à domicile.", cta: ["Réserver un rendez-vous", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ["misc:pagehead", { title: "Réalisations", sub: "Projets de démonstration, classés par pièce." }],
        ["gal:featured", { items: [{ t: "Appartement des Chartrons", tag: "Appartement", x: "120 m² entièrement repensés." }, { t: "Échoppe du Bouscat", tag: "Maison", x: "Cuisine ouverte sur jardin." }, { t: "Suite parentale Caudéran", tag: "Chambre", x: "Dressing en chêne et laiton." }, { t: "Salle d'eau Saint-Michel", tag: "Salle de bain", x: "Terrazzo rose et robinetterie noire." }] }],
        ["gal:grid", { title: "Autres projets", items: [{ t: "Bureau à domicile", x: "Bibliothèque sur mesure." }, { t: "Entrée en pierre", x: "Banc et miroir intégrés." }, { t: "Cuisine ouverte", x: "Îlot en bois massif." }, { t: "Salon de coiffure", x: "Projet professionnel." }, { t: "Boutique de créateur", x: "Mobilier d'exposition." }, { t: "Chambre d'enfant", x: "Lit cabane et rangements." }] }],
      ] },
      { key: "accompagnement", name: "Accompagnement", blocks: [
        ["misc:pagehead", { title: "Nos formules", sub: "Honoraires à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Conseil", price: "480 €", period: "la séance", x: "Pour décider avant de se lancer.", f: ["Visite de 90 minutes", "Palette et plan d'ambiance", "Liste de conseils écrits"], cta: ["Réserver", "/contact"] }, { t: "Conception", price: "à partir de 3 900 €", x: "Les plans, sans le suivi.", f: ["Plans cotés et 3D", "Planche de matières", "Dossier de consultation"], hl: true, cta: ["Demander un devis", "/contact"] }, { t: "Clés en main", price: "10 à 14 % des travaux", x: "De l'idée à l'emménagement.", f: ["Conception complète", "Coordination des artisans", "Suivi de chantier et réception"], cta: ["Parlons-en", "/contact"] }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Travaillez-vous avec mon budget ?", x: "Oui, nous hiérarchisons les travaux pour que chaque euro compte." }, { t: "Combien de temps dure un projet ?", x: "De 3 mois pour une pièce à 10 mois pour un logement complet." }, { t: "Peut-on garder son mobilier ?", x: "Bien sûr, nous l'intégrons ou le restaurons." }] }],
      ] },
      { key: "agence", name: "L'agence", blocks: [
        ["misc:pagehead", { title: "L'agence" }],
        ["misc:story", { eyebrow: "Depuis 2012", title: "Un atelier de six personnes", paras: ["Velours & Pièce est né dans une cuisine, entre échantillons de tissu et plans à l'échelle.", "Nous restons petits pour suivre chaque projet nous-mêmes."], image: "portrait-4" }],
        ["proof:team", { items: [{ n: "Léonie Barbaste", r: "Fondatrice, architecte d'intérieur" }, { n: "Victor Aymerich", r: "Chef de chantier" }, { n: "Salomé Duhart", r: "Décoratrice, sourcing" }] }],
      ] },
      contact("Un message suffit, nous revenons vers vous sous 48 heures.", "Votre projet d'intérieur", "5 rue du Bel Air, 33000 Bordeaux", ["Envoyer ma demande", "/contact"], "Décrivez votre logement"),
    ],
  },

  // 3. Paysagiste
  {
    key: "jardin-trame", name: "Jardin Trame", category: "immobilier", tags: ["naturel", "chaleureux"], siteType: "Paysagiste concepteur",
    description: "Paysagiste aux verts francs et à l'or de blé : accueil en collage de photos, bento de prestations, barre d'en-tête flottante et appel à l'action à bande.",
    brand: "Jardin Trame",
    tokens: { colors: { primary: "#2f7d32", secondary: "#1f3d1c", accent: "#d9a21b", background: "#f3f7ef", surface: "#ffffff", text: "#1b2a17", muted: "#4b5d45" }, fonts: { heading: "font.alegreya", body: "font.outfit", button: "font.outfit", link: "font.outfit" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 20 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.05 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "jardin", motifs: ["botanical", "blobs", "topo"] },
    head: ["head:float", {}],
    foot: ["foot:newsletter", { title: "La lettre du jardinier", sub: "Un conseil de saison par mois, rien d'autre.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Jardins réalisés", "/jardins"], ["Entretien", "/entretien"], ["Contact", "/contact"]], cta: ["Visite du terrain", "/contact"],
    contact: { address: "27 chemin des Vignes, 34000 Montpellier", phone: "04 67 00 55 21", email: "jardin@jardin-trame.example", hours: "Lundi au vendredi, 8 h – 17 h", tagline: "Des jardins pensés pour le climat." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Conception et création de jardins", title: "Un jardin qui se plaît chez vous, même en été.", sub: "Plantes méditerranéennes, gestion de l'eau et terrasses en matériaux locaux : des espaces extérieurs qui vivent douze mois.", cta: ["Voir les jardins", "/jardins"] }],
        ["feat:bento", { title: "Nos prestations", items: [{ t: "Conception complète", x: "Plan masse, palette végétale, éclairage et arrosage économe : tout est dessiné avant la première pelle.", icon: "layout" }, { t: "Terrasses et murets", x: "Pierre sèche, bois, béton désactivé.", icon: "layers" }, { t: "Plantations", x: "Arbres, vivaces et prairies sèches.", icon: "sun" }] }],
        ["proof:quotes", { title: "Des jardins habités", items: [{ q: "Le jardin a tenu tout l'été sans arrosage excessif.", n: "Bernadette V.", r: "Cliente fictive" }, { q: "Le plan était clair, le chantier propre.", n: "Olivier et Nadia K.", r: "Clients fictifs" }, { q: "Une terrasse où l'on dîne enfin dehors.", n: "Pascal M.", r: "Client fictif" }] }],
        ["gal:strip", { title: "Quelques coins de jardin", items: [{ t: "Prairie fleurie" }, { t: "Muret de pierre" }, { t: "Bassin" }, { t: "Terrasse en bois" }, { t: "Allée d'oliviers" }] }],
        ["cta:band", { title: "Votre terrain attend son projet.", sub: "Visite et conseils gratuits dans un rayon de 40 km.", cta: ["Fixer une visite", "/contact"] }],
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        ["misc:pagehead", { title: "Prestations et tarifs", sub: "Tarifs indicatifs." }],
        ["feat:pricelist", { items: [{ t: "Étude et plan de jardin", x: "Relevé, plan masse, palette végétale", price: "à partir de 950 €" }, { t: "Terrasse en bois ou pierre", x: "Fournitures et pose", price: "à partir de 110 € / m²" }, { t: "Plantation d'arbre adulte", x: "Fourniture, tuteurage, arrosage de reprise", price: "à partir de 320 €" }, { t: "Arrosage automatique économe", x: "Goutte à goutte et programmateur", price: "à partir de 1 400 €" }] }],
        ["feat:cards", { title: "Notre palette", items: [{ t: "Plantes sobres", x: "Lavandes, sauges, cistes, graminées.", icon: "sun" }, { t: "Arbres d'ombre", x: "Micocouliers, érables de Montpellier.", icon: "heart" }, { t: "Potagers", x: "Carrés surélevés et paillage.", icon: "sparkles" }] }],
      ] },
      { key: "jardins", name: "Jardins réalisés", blocks: [
        ["misc:pagehead", { title: "Jardins réalisés" }],
        ["gal:cards", { items: [{ t: "Jardin de ville, Saint-Roch", tag: "180 m²", x: "Cour plantée et bassin." }, { t: "Villa à Grabels", tag: "1 200 m²", x: "Prairie sèche et oliviers." }, { t: "Terrasse sur les toits", tag: "60 m²", x: "Bacs en acier et graminées." }, { t: "Mas de la Pompignane", tag: "3 000 m²", x: "Verger et allée centrale." }] }],
        ["proof:stats", { items: [["220", "jardins créés (exemple)"], ["70 %", "d'eau en moins (exemple)"], ["12", "paysagistes"]] }],
      ] },
      { key: "entretien", name: "Entretien", blocks: [
        ["misc:pagehead", { title: "Entretien des jardins" }],
        ["feat:icons", { title: "Un contrat selon la saison", items: [{ t: "Taille et nettoyage", x: "Haies, arbustes, massifs, feuilles.", icon: "settings" }, { t: "Tonte et pelouse", x: "Passages réguliers, regarnissage.", icon: "sun" }, { t: "Arrosage et paillage", x: "Réglage du système, apports organiques.", icon: "activity" }, { t: "Conseil au jardinier", x: "Passage trimestriel du paysagiste.", icon: "users" }] }],
        ["misc:faq", { items: [{ t: "Quelle fréquence de passage ?", x: "Toutes les trois semaines en saison, une fois par mois en hiver." }, { t: "Prestation éligible au crédit d'impôt ?", x: "Souvent oui pour un particulier, renseignez-vous auprès de l'administration." }] }],
      ] },
      contact("Visite du terrain gratuite dans les 15 jours.", "Parlons de votre jardin", "27 chemin des Vignes, 34000 Montpellier", ["Demander une visite", "/contact"], "Décrivez votre terrain"),
    ],
  },

  // 4. Entreprise de rénovation
  {
    key: "chantier-franc", name: "Chantier Franc", category: "immobilier", tags: ["moderne", "technique"], siteType: "Entreprise de rénovation tous corps d'état",
    description: "Entreprise de rénovation en bleu de travail et jaune sécurité : accueil à image portrait, étapes de chantier chiffrées, devis types et bandeau de statistiques.",
    brand: "Chantier Franc Rénovation",
    tokens: { colors: { primary: "#1e5fb4", secondary: "#14325c", accent: "#f2b01e", background: "#f4f7fb", surface: "#ffffff", text: "#14213a", muted: "#4a5a73" }, fonts: { heading: "font.roboto-slab", body: "font.barlow", button: "font.barlow", link: "font.barlow" }, radius: { sm: 3, md: 6, lg: 10, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.08 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "chantier", motifs: ["plates", "halftone", "tiles"] },
    head: ["head:topbar", { info: "Devis gratuit sous 5 jours. Artisans salariés, garantie décennale.", note: "02 40 00 63 09" }],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Travaux", "/travaux"], ["Déroulé d'un chantier", "/deroulement"], ["Réalisations", "/realisations"], ["Devis", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "9 zone artisanale de la Noë, 44800 Saint-Herblain", phone: "02 40 00 63 09", email: "devis@chantier-franc.example", hours: "Lundi au vendredi, 7 h 30 – 17 h 30", tagline: "Rénover sans mauvaise surprise." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Rénovation complète et extension", title: "Votre rénovation, du devis aux finitions, sans intermédiaire.", sub: "Maçons, plaquistes, électriciens, plombiers et peintres salariés : un seul chef de chantier pour tout le projet.", cta: ["Demander un devis", "/contact"], cta2: ["Voir les travaux", "/travaux"] }],
        ["feat:steps", { title: "Un chantier en quatre étapes", items: [{ t: "Visite et chiffrage", d: "Jour 1", x: "Relevé sur place et devis détaillé poste par poste." }, { t: "Planning ferme", d: "Semaine 2", x: "Calendrier signé, achats anticipés." }, { t: "Travaux", d: "Mois 2 à 5", x: "Point hebdomadaire, chantier propre chaque soir." }, { t: "Réception", d: "Fin de chantier", x: "Visite avec réserves levées sous 15 jours." }] }],
        ["gal:cards", { title: "Avant, après", items: [{ t: "Maison de 1965 remise à neuf", tag: "Rénovation", x: "Isolation, électricité, cuisine." }, { t: "Extension de 32 m²", tag: "Extension", x: "Ossature bois sur dalle." }, { t: "Appartement en plateau", tag: "Intérieur", x: "Cloisons abattues, parquet." }] }],
        ["proof:stats", { items: [["1 480", "chantiers (exemple)"], ["97 %", "de clients satisfaits (exemple)"], ["10 ans", "de garantie décennale"]] }],
        ["cta:image", { title: "Un devis clair, sans surprise.", sub: "Visite gratuite et chiffrage sous cinq jours.", cta: ["Demander ma visite", "/contact"] }],
      ] },
      { key: "travaux", name: "Travaux", blocks: [
        ["misc:pagehead", { title: "Nos travaux", sub: "Prix indicatifs hors fournitures spécifiques." }],
        ["feat:pricelist", { items: [{ t: "Rénovation d'une salle de bain", x: "Dépose, plomberie, faïence, meubles", price: "à partir de 6 800 €" }, { t: "Cuisine posée", x: "Plan de travail, électricité, crédence", price: "à partir de 4 200 €" }, { t: "Isolation des combles", x: "Soufflage de laine minérale", price: "à partir de 38 € / m²" }, { t: "Rénovation électrique", x: "Mise aux normes d'un logement de 80 m²", price: "à partir de 5 900 €" }, { t: "Peinture intérieure", x: "Sol à plafond, deux couches", price: "à partir de 28 € / m²" }] }],
        ["feat:list2", { title: "Corps d'état intégrés", items: [{ t: "Maçonnerie" }, { t: "Plâtrerie et isolation" }, { t: "Électricité" }, { t: "Plomberie et chauffage" }, { t: "Carrelage" }, { t: "Peinture" }] }],
      ] },
      { key: "deroulement", name: "Déroulé d'un chantier", blocks: [
        ["misc:pagehead", { title: "Déroulé d'un chantier" }],
        ["misc:schedule", { title: "Une semaine type", items: [{ d: "Lundi", t: "Briefing et approvisionnement", x: "Le chef de chantier fait le point avec les artisans." }, { d: "Mardi à jeudi", t: "Travaux", x: "Équipes sur site de 8 h à 17 h." }, { d: "Vendredi", t: "Point client", x: "Photos, avancement, décisions à prendre." }] }],
        ["feat:accordion", { title: "Bon à savoir", items: [{ t: "Dois-je quitter le logement ?", x: "Pas toujours. Nous isolons les zones en travaux et protégeons le reste." }, { t: "Qui gère les autorisations ?", x: "Nous préparons les déclarations préalables et dossiers nécessaires." }, { t: "Y a-t-il des aides ?", x: "Pour l'isolation, nous vous aidons à monter vos dossiers d'aides éventuelles." }] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ["misc:pagehead", { title: "Réalisations" }],
        ["gal:masonry", { items: [{ t: "Longère à Sautron" }, { t: "Loft à Chantenay" }, { t: "Maison de ville à Rezé" }, { t: "Pavillon à Orvault" }, { t: "Cuisine ouverte" }] }],
        ["proof:quotes", { items: [{ q: "Le chantier a fini la semaine annoncée.", n: "Pierre-Yves A.", r: "Client fictif" }, { q: "Devis respecté au centime.", n: "Soraya L.", r: "Cliente fictive" }] }],
      ] },
      contact("Un devis détaillé sous 5 jours ouvrés.", "Décrivez-nous vos travaux", "9 zone artisanale de la Noë, 44800 Saint-Herblain", ["Envoyer ma demande", "/contact"], "Votre projet de travaux"),
    ],
  },

  // 5. Constructeur de maisons individuelles
  {
    key: "toit-premier", name: "Toit Premier", category: "immobilier", tags: ["moderne", "chaleureux"], siteType: "Constructeur de maisons individuelles",
    description: "Constructeur de maisons en sarcelle profonde et orange brique : dégradé d'accueil chiffré, modèles en onglets, tarifs en trois niveaux de finition et en-tête sombre.",
    brand: "Toit Premier Constructeur",
    tokens: { colors: { primary: "#0f766e", secondary: "#0b3b37", accent: "#e07a2f", background: "#f2f8f7", surface: "#ffffff", text: "#10302d", muted: "#44625e" }, fonts: { heading: "font.bitter", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.06 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "toit", motifs: ["tiles", "rays", "plates"] },
    head: ["head:dark", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Nos modèles", "/modeles"], ["Prix et finitions", "/prix"], ["Construire", "/construire"], ["Contact", "/contact"]], cta: ["Étudier mon projet", "/contact"],
    contact: { address: "62 avenue de la Gare, 37000 Tours", phone: "02 47 00 76 32", email: "projet@toit-premier.example", hours: "Lundi au samedi, 9 h – 18 h", tagline: "Votre maison, à prix et délai fermes." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Contrat de construction de maison individuelle", title: "Une maison à vous, à prix et délai garantis.", sub: "Plans personnalisables, performances RE2020 et un conducteur de travaux unique du terrain à la remise des clés.", cta: ["Voir les modèles", "/modeles"], cta2: ["Étudier mon terrain", "/contact"], stats: [["14 mois", "de la signature aux clés (exemple)"], ["62", "maisons par an"], ["10 ans", "de garantie décennale"]] }],
        ["feat:tabs", { title: "Nos familles de maisons", items: [{ t: "Plain-pied", x: "De 90 à 130 m², pièces de vie lumineuses et chambres en aile, pour vivre sans escaliers." }, { t: "À étage", x: "De 105 à 160 m², compactes et économes, idéales pour les terrains étroits." }, { t: "Toit plat contemporain", x: "De 100 à 150 m², larges baies, ossature bois ou parpaings isolés." }, { t: "Maison évolutive", x: "Extension possible : une chambre ou un garage à transformer plus tard." }] }],
        ["price:tiers", { title: "Trois niveaux de finition", items: [{ t: "Prête à décorer", price: "dès 1 480 € / m²", x: "Hors terrain", f: ["Gros œuvre complet", "Chauffage et plomberie", "Peintures à faire"], cta: ["Détails", "/prix"] }, { t: "Confort", price: "dès 1 760 € / m²", x: "Hors terrain", f: ["Tout du niveau précédent", "Carrelage, cuisine équipée", "Volets électriques"], hl: true, cta: ["Détails", "/prix"] }, { t: "Clés en main", price: "dès 2 050 € / m²", x: "Hors terrain", f: ["Tout du niveau Confort", "Peintures et sols", "Aménagements extérieurs"], cta: ["Détails", "/prix"] }] }],
        ["proof:logos", { title: "Partenaires fictifs", items: ["Banque Régionale du Val", "Courtage Habitat Loire", "Isolants du Centre", "Menuiseries Touraine"] }],
        ["cta:split", { title: "Quel budget pour votre maison ?", sub: "Simulation gratuite avec un conseiller en 30 minutes.", cta: ["Faire une simulation", "/contact"] }],
      ] },
      { key: "modeles", name: "Nos modèles", blocks: [
        ["misc:pagehead", { title: "Nos modèles", sub: "Plans de démonstration, tous personnalisables." }],
        ["gal:cards", { items: [{ t: "Modèle Aubépine", tag: "Plain-pied, 98 m²", x: "3 chambres, garage, séjour ouvert." }, { t: "Modèle Mélisse", tag: "À étage, 124 m²", x: "4 chambres, suite parentale." }, { t: "Modèle Sorbier", tag: "Toit plat, 112 m²", x: "Baies coulissantes, patio." }, { t: "Modèle Noisetier", tag: "Évolutif, 105 m²", x: "Combles aménageables." }] }],
        ["feat:compare", { title: "Comparer deux modèles", rows: [["", "Aubépine", "Mélisse"], ["Surface", "98 m²", "124 m²"], ["Chambres", "3", "4"], ["Étage", "non", "oui"], ["Prix (hors terrain)", "dès 172 000 €", "dès 213 000 €"]] }],
      ] },
      { key: "prix", name: "Prix et finitions", blocks: [
        ["misc:pagehead", { title: "Prix et finitions", sub: "Exemples hors terrain, hors raccordements." }],
        ["feat:pricelist", { items: [{ t: "Maison 3 pièces plain-pied", x: "92 m², prête à décorer", price: "136 000 €" }, { t: "Maison 4 pièces à étage", x: "112 m², finition confort", price: "197 000 €" }, { t: "Maison 5 pièces contemporaine", x: "135 m², clés en main", price: "277 000 €" }] }],
        ["misc:faq", { title: "Pourquoi un contrat CCMI ?", items: [{ t: "Que garantit-il ?", x: "Un prix ferme, un délai, et des garanties de livraison et d'achèvement." }, { t: "Puis-je modifier les plans ?", x: "Oui, jusqu'à la signature du contrat." }] }],
      ] },
      { key: "construire", name: "Construire", blocks: [
        ["misc:pagehead", { title: "Construire avec nous" }],
        ["feat:steps", { items: [{ t: "Terrain et budget", d: "Mois 0", x: "Étude de faisabilité et plan de financement." }, { t: "Plans et contrat", d: "Mois 1 à 3", x: "Plans personnalisés, devis descriptif, signature." }, { t: "Permis de construire", d: "Mois 3 à 6", x: "Nous déposons et suivons le dossier." }, { t: "Chantier", d: "Mois 7 à 14", x: "Fondations, hors d'eau, hors d'air, finitions." }, { t: "Remise des clés", d: "Mois 14", x: "Réception avec le conducteur de travaux." }] }],
        ["proof:quotes", { items: [{ q: "On a signé en mars, on a emménagé en juin de l'année suivante.", n: "Charlotte et Julien F.", r: "Clients fictifs" }] }],
        ["cta:band", { title: "Votre terrain est prêt ?", cta: ["Nous le montrer", "/contact"] }],
      ] },
      contact("Un conseiller vous rappelle sous 24 heures.", "Étudions votre projet", "62 avenue de la Gare, 37000 Tours", ["Être rappelé", "/contact"], "Votre terrain et votre budget"),
    ],
  },

  // 6. Géomètre-expert (sombre)
  {
    key: "borne-et-cote", name: "Borne & Cote", category: "immobilier", tags: ["sombre", "technique"], siteType: "Cabinet de géomètre-expert",
    description: "Cabinet de géomètre-experts sur fond ardoise et cyan topographique : accueil typographique minimal, grilles d'icônes, titres JetBrains Mono et motifs de courbes de niveau.",
    brand: "Borne & Cote Géomètres",
    tokens: { colors: { primary: "#22d3ee", secondary: "#0a0f16", accent: "#fbbf24", background: "#0f1620", surface: "#182231", text: "#e8f0f7", muted: "#a9b9c9" }, fonts: { heading: "font.jetbrains-mono", body: "font.chivo", button: "font.chivo", link: "font.chivo" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.02 } }, border: { width: 1, color: "#2c3b50" } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "borne", motifs: ["topo", "halftone", "rays"] },
    head: ["head:minimal", {}],
    foot: ["foot:big", { title: "Borne & Cote" }],
    menu: [["Accueil", "/"], ["Missions", "/missions"], ["Bornage", "/bornage"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "3 rue du Cadastre, 51100 Reims", phone: "03 26 00 18 47", email: "mesures@borne-et-cote.example", hours: "Lundi au vendredi, 8 h – 12 h et 14 h – 17 h 30", tagline: "Mesurer juste, borner serein." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Géomètres-experts à Reims", title: "Vos limites de propriété, mesurées au centimètre.", sub: "Bornage, division, relevés topographiques et copropriété : nous sécurisons vos projets fonciers.", cta: ["Demander un devis", "/contact"] }],
        ["feat:numbered", { title: "Trois missions, un même rigueur", items: [{ t: "Bornage amiable ou judiciaire", x: "Délimitation contradictoire avec les voisins, procès-verbal et pose de bornes." }, { t: "Division et lotissement", x: "Plan de division, dépôt du dossier et lots viabilisés." }, { t: "Relevé et implantation", x: "Plans topographiques, implantation de bâtiments et suivi de terrassement." }] }],
        ["feat:grid-icons", { title: "Nos instruments", items: [{ t: "GNSS centimétrique", x: "Positionnement par satellites.", icon: "globe" }, { t: "Station totale", x: "Mesures angulaires précises.", icon: "eye" }, { t: "Drone photogrammétrique", x: "Modèles 3D des terrains.", icon: "layers" }, { t: "Scanner laser", x: "Relevé de façades et d'intérieurs.", icon: "monitor" }] }],
        ["proof:team", { title: "Les géomètres", items: [{ n: "Élise Rambaud", r: "Géomètre-experte associée" }, { n: "Thibault Ancelin", r: "Géomètre-expert associé" }, { n: "Nora Delcourt", r: "Topographe" }] }],
        ["cta:card", { title: "Un doute sur une limite ?", sub: "Un échange téléphonique de dix minutes pour cerner votre cas.", cta: ["Nous appeler", "/contact"] }],
      ] },
      { key: "missions", name: "Missions", blocks: [
        ["misc:pagehead", { title: "Nos missions" }],
        ["feat:strips", { items: [{ t: "Bornage", x: "Délimiter une propriété avec les voisins." }, { t: "Division parcellaire", x: "Détacher un lot constructible." }, { t: "Copropriété", x: "Règlement et état descriptif de division." }, { t: "Topographie", x: "Plans, courbes de niveau, implantations." }, { t: "Expertise foncière", x: "Servitudes, mitoyenneté, évaluation." }] }],
        ["proof:stats", { items: [["3 800", "bornages réalisés (exemple)"], ["±1 cm", "de précision"], ["15 jours", "de délai moyen de plan (exemple)"]] }],
      ] },
      { key: "bornage", name: "Bornage pas à pas", blocks: [
        ["misc:pagehead", { title: "Comment se passe un bornage" }],
        ["feat:steps", { items: [{ t: "Recherche des titres", d: "Semaine 1", x: "Cadastre, actes, plans anciens." }, { t: "Opération sur le terrain", d: "Semaine 2", x: "Mesures et convocation des voisins." }, { t: "Procès-verbal", d: "Semaine 3", x: "Signatures contradictoires." }, { t: "Pose des bornes", d: "Semaine 4", x: "Plan de bornage remis au propriétaire." }] }],
        ["misc:faq", { items: [{ t: "Mon voisin refuse, que faire ?", x: "Nous établissons un procès-verbal de carence, base d'une procédure judiciaire." }, { t: "Le bornage est-il obligatoire ?", x: "Pour vendre un terrain à bâtir, oui." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs indicatifs" }],
        ["feat:pricelist", { items: [{ t: "Bornage d'un terrain de 800 m²", x: "Hors frais de pose", price: "à partir de 1 450 €" }, { t: "Plan topographique", x: "Parcelle jusqu'à 2 000 m²", price: "à partir de 790 €" }, { t: "Division en deux lots", x: "Plan et dépôt", price: "à partir de 2 300 €" }, { t: "Implantation de maison", x: "Piquetage des angles", price: "à partir de 540 €" }] }],
        ["cta:band", { title: "Besoin d'un devis précis ?", cta: ["Écrire au cabinet", "/contact"] }],
      ] },
      contact("Réponse sous 24 heures ouvrées.", "Parlez-nous de votre parcelle", "3 rue du Cadastre, 51100 Reims", ["Envoyer", "/contact"], "Adresse et référence cadastrale"),
    ],
  },

  // 7. Bureau d'études structure
  {
    key: "poutrelle-bureau", name: "Poutrelle", category: "immobilier", tags: ["technique", "geometrique"], siteType: "Bureau d'études structure",
    description: "Ingénierie des structures en violet profond et ocre : bandeau de journal, accueil empilé, grille de compétences, tableau comparatif des matériaux et FAQ technique.",
    brand: "Poutrelle Ingénierie",
    tokens: { colors: { primary: "#6d28d9", secondary: "#2a1c55", accent: "#e9a23b", background: "#f7f5fc", surface: "#ffffff", text: "#1f1a33", muted: "#5a5272" }, fonts: { heading: "font.sora", body: "font.ibm-plex-serif", button: "font.sora", link: "font.ibm-plex-serif" }, radius: { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.02 } }, border: { width: 1, color: "#d9d1ee" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "poutrelle", motifs: ["plates", "mesh", "tiles"] },
    head: ["head:masthead", { dateline: "Bureau d'études béton, bois et métal" }],
    foot: ["foot:columns", { about: "Poutrelle Ingénierie, calcul de structures pour architectes, constructeurs et particuliers (bureau fictif).", cols: [["Bureau", "Compétences", "Références", "Équipe"], ["Ressources", "Questions techniques", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Compétences", "/competences"], ["Matériaux", "/materiaux"], ["Références", "/references"], ["Contact", "/contact"]], cta: ["Consulter le bureau", "/contact"],
    contact: { address: "18 boulevard des Lices, 13200 Arles", phone: "04 90 00 37 92", email: "etudes@poutrelle.example", hours: "Lundi au vendredi, 8 h 30 – 18 h", tagline: "Calculer pour que ça tienne, et que ça coûte juste." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Calcul de structures", title: "Des portées plus audacieuses, des sections plus économes.", sub: "Nous dimensionnons béton, bois, acier et maçonnerie pour des architectes, des constructeurs et des particuliers.", cta: ["Nous consulter", "/contact"], stats: [["24 ans", "d'expérience"], ["900", "dossiers (exemple)"], ["Eurocodes", "notes de calcul"]] }],
        ["feat:cards", { title: "Compétences", items: [{ t: "Béton armé", x: "Fondations, voiles, planchers, dalles.", icon: "layers" }, { t: "Charpente bois", x: "Fermes, lamellé-collé, CLT.", icon: "home" }, { t: "Structure métallique", x: "Poutres, poteaux, escaliers.", icon: "settings" }, { t: "Diagnostic existant", x: "Sondages, fissures, reprise en sous-œuvre.", icon: "search" }] }],
        ["feat:compare", { title: "Choisir son matériau", rows: [["", "Béton", "Bois", "Acier"], ["Portée courante", "moyenne", "moyenne", "grande"], ["Empreinte carbone", "élevée", "faible", "moyenne"], ["Résistance au feu", "très bonne", "bonne", "à protéger"]] }],
        ["misc:faq", { title: "Questions techniques", items: [{ t: "Quand faire appel à un bureau d'études ?", x: "Dès qu'on ouvre un mur porteur, qu'on surélève ou qu'on construit en terrain difficile." }, { t: "Faut-il une étude de sol ?", x: "Souvent obligatoire en zone argileuse, avant toute construction." }, { t: "Quel délai pour un calcul ?", x: "Une à trois semaines selon la complexité (exemple)." }] }],
        ["cta:card", { title: "Un mur porteur à ouvrir ?", sub: "Une note de calcul sérieuse avant la première pioche.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "competences", name: "Compétences", blocks: [
        ["misc:pagehead", { title: "Compétences" }],
        ["feat:rows", { items: [{ t: "Conception et note de calcul", x: "Hypothèses, charges, dimensionnement et plans d'exécution." }, { t: "Descente de charges", x: "Vérification des fondations et des points d'appui." }, { t: "Reprise en sous-œuvre", x: "Reprise de fondations, renforcement de planchers." }, { t: "Expertise après sinistre", x: "Diagnostic de fissures, de tassements, de poutres altérées." }] }],
        ["proof:stats", { items: [["900", "dossiers (exemple)"], ["14", "ingénieurs"], ["48 h", "pour un avis préliminaire"]] }],
      ] },
      { key: "materiaux", name: "Matériaux", blocks: [
        ["misc:pagehead", { title: "Béton, bois, acier" }],
        ["feat:alt", { items: [{ t: "Le béton, toujours indispensable", x: "Pour les fondations, les dalles et les refends, il reste imbattable en durabilité." }, { t: "Le bois, bas carbone", x: "Plancher, charpente et ossature pour réduire l'empreinte du bâtiment." }, { t: "L'acier pour franchir", x: "Grandes portées, reprises en sous-œuvre, structures légères." }] }],
        ["misc:text", { title: "Notre doctrine", paras: ["Nous cherchons la solution la plus sobre en matière, et pas la plus chère.", "Chaque note de calcul est relue par un second ingénieur avant signature."] }],
      ] },
      { key: "references", name: "Références", blocks: [
        ["misc:pagehead", { title: "Références" }],
        ["gal:grid", { items: [{ t: "Halle en bois lamellé-collé", x: "Portée de 24 m." }, { t: "Surélévation d'un immeuble", x: "Deux niveaux en ossature bois." }, { t: "Passerelle piétonne", x: "Acier galvanisé." }, { t: "Mas restauré", x: "Reprise de voûtes en pierre." }] }],
        ["proof:quotes", { items: [{ q: "Une note de calcul claire, rendue en dix jours.", n: "Agence Lumière & Plan", r: "Architecte, client fictif" }] }],
      ] },
      contact("Envoyez-nous vos plans, nous vous répondons sous 48 heures.", "Parlons de votre structure", "18 boulevard des Lices, 13200 Arles", ["Envoyer le dossier", "/contact"], "Nature du projet et plans disponibles"),
    ],
  },

  // 8. Home staging
  {
    key: "scene-vendue", name: "Scène Vendue", category: "immobilier", tags: ["ludique", "chaleureux"], siteType: "Home staging et valorisation immobilière",
    description: "Home staging en rose framboise et beige poudré : carte d'accueil encadrée, avant-après en galerie vedette, prestations iconographiques et logotype serif DM Serif Display.",
    brand: "Scène Vendue Home Staging",
    tokens: { colors: { primary: "#be185d", secondary: "#5a1e3a", accent: "#e5b25d", background: "#fff5f3", surface: "#fffdfc", text: "#3a1f26", muted: "#6e4d55" }, fonts: { heading: "font.dm-serif-display", body: "font.quicksand", button: "font.quicksand", link: "font.quicksand" }, radius: { sm: 10, md: 16, lg: 26, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.08 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "scene", motifs: ["blobs", "objects", "arches"] },
    head: ["head:center", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Avant / Après", "/avant-apres"], ["Prestations", "/prestations"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Valoriser mon bien", "/contact"],
    contact: { address: "11 rue des Halles, 35000 Rennes", phone: "02 99 00 84 50", email: "scene@scene-vendue.example", hours: "Mardi au samedi, 9 h – 18 h", tagline: "Votre bien se vend mieux quand il se raconte." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Home staging à Rennes", title: "Vendez plus vite, et au meilleur prix.", sub: "Désencombrement, mobilier de décor et mise en scène : nous préparons votre bien pour que les visiteurs s'y projettent dès la porte d'entrée.", cta: ["Estimer ma mise en scène", "/contact"], cta2: ["Avant / Après", "/avant-apres"] }],
        ["feat:icons", { title: "Ce que nous faisons", items: [{ t: "Désencombrer", x: "Ranger, trier, dépersonnaliser sans vous dépouiller.", icon: "layers" }, { t: "Réparer et rafraîchir", x: "Peintures neutres, petits travaux, lumière.", icon: "settings" }, { t: "Meubler et décorer", x: "Location de mobilier de décor, plantes, textiles.", icon: "home" }, { t: "Photographier", x: "Reportage pour l'annonce, avec retouche légère.", icon: "image" }] }],
        ["gal:featured", { title: "Avant, après", items: [{ t: "Séjour de 32 m²", tag: "Vendu en 9 jours", x: "Mobilier loué, murs blancs cassés." }, { t: "Chambre sous toit", tag: "Après", x: "Textiles clairs, éclairage doux." }, { t: "Cuisine datée", tag: "Après", x: "Façades repeintes." }, { t: "Terrasse", tag: "Après", x: "Salon d'extérieur." }] }],
        ["proof:quotes", { items: [{ q: "Trois visites, deux offres, vendu au prix.", n: "Hélène C.", r: "Vendeuse, cliente fictive" }, { q: "Je n'imaginais pas ma maison si grande.", n: "Rémi D.", r: "Vendeur, client fictif" }] }],
        ["cta:band", { title: "Un bien qui ne se vend pas ?", sub: "Un avis honnête, offert, avant toute prestation.", cta: ["Demander un avis", "/contact"] }],
      ] },
      { key: "avant-apres", name: "Avant / Après", blocks: [
        ["misc:pagehead", { title: "Avant / Après", sub: "Exemples de démonstration." }],
        ["gal:cards", { items: [{ t: "Appartement T3, Thabor", tag: "9 jours", x: "Mis en vente à 289 000 €." }, { t: "Maison de ville, Saint-Hélier", tag: "15 jours", x: "Mise en vente à 410 000 €." }, { t: "Studio étudiant", tag: "6 jours", x: "Location meublée." }, { t: "Pavillon à Cesson", tag: "22 jours", x: "Jardin remis en scène." }] }],
        ["proof:statsbar", { items: [["-47 %", "de délai de vente (exemple)"], ["+6 %", "de prix obtenu (exemple)"], ["350", "biens préparés"]] }],
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        ["misc:pagehead", { title: "Prestations" }],
        ["feat:bento", { items: [{ t: "Conseil sur place", x: "Visite d'une heure et plan d'action écrit.", icon: "sparkles" }, { t: "Mise en scène complète", x: "Mobilier loué, déco, installation sous 48 heures.", icon: "home" }, { t: "Dépersonnalisation", x: "Photos de famille et objets intimes mis de côté.", icon: "eye" }] }],
        ["feat:checks", { title: "Avant de commencer", cta: ["Demander un avis", "/contact"], items: [{ t: "Aucun travaux lourd imposé" }, { t: "Mobilier loué, retiré à la vente" }, { t: "Budget validé avant tout achat" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Tarifs de démonstration, hors location de mobilier." }],
        ["price:tiers", { items: [{ t: "Conseil", price: "180 €", x: "Visite et plan d'action.", f: ["1 heure sur place", "Compte rendu écrit", "Liste de petits travaux"], cta: ["Réserver", "/contact"] }, { t: "Mise en scène", price: "à partir de 790 €", x: "Pour une pièce de vie.", f: ["Mobilier et déco loués", "Installation sur place", "Photos pour annonce"], hl: true, cta: ["Devis", "/contact"] }, { t: "Logement complet", price: "à partir de 1 900 €", x: "Appartement ou maison.", f: ["Toutes les pièces", "Retouches de peinture", "Dépose après vente"], cta: ["Devis", "/contact"] }] }],
        ["misc:faq", { items: [{ t: "Combien de temps dure l'installation ?", x: "Une à deux journées selon la surface." }, { t: "Mes meubles sont-ils utilisés ?", x: "Oui, quand ils servent la mise en scène." }] }],
      ] },
      contact("Réponse sous 24 heures.", "Parlons de votre bien", "11 rue des Halles, 35000 Rennes", ["Envoyer", "/contact"], "Votre bien et votre calendrier de vente"),
    ],
  },

  // 9. Maison d'architecte contemporaine
  {
    key: "verre-et-beton", name: "Verre & Béton", category: "immobilier", tags: ["minimaliste", "geometrique"], siteType: "Maisons d'architecte contemporaines, projets réalisés",
    description: "Vitrine de maisons d'architecte en béton clair et vert olive : affiche typographique, galeries de projets réalisés, bandes de principes et en-tête latéral.",
    brand: "Verre & Béton",
    tokens: { colors: { primary: "#4d6b1a", secondary: "#1d1d1b", accent: "#b45309", background: "#ecebe7", surface: "#f8f7f4", text: "#1d1d1b", muted: "#55554f" }, fonts: { heading: "font.tenor-sans", body: "font.rubik", button: "font.rubik", link: "font.rubik" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.05, letterSpacing: 0.02 } }, border: { width: 1, color: "#c8c6bd" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "verre", motifs: ["plates", "arches", "topo"] },
    head: ["head:side", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Maisons réalisées", "/maisons"], ["Principes", "/principes"], ["Habiter", "/habiter"], ["Contact", "/contact"]], cta: ["Visiter une maison", "/contact"],
    contact: { address: "2 impasse du Verger, 44000 Nantes", phone: "02 40 00 91 06", email: "maisons@verre-et-beton.example", hours: "Visites sur rendez-vous", tagline: "Des maisons d'architecte, pensées pour durer." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Maisons d'architecte contemporaines", title: "HABITER LA LUMIÈRE", sub: "Quinze maisons de béton, verre et bois livrées dans l'ouest de la France, chacune dessinée pour son terrain.", cta: ["Voir les maisons", "/maisons"] }],
        ["gal:grid", { title: "Maisons livrées", items: [{ t: "Maison Verger", x: "Nantes, 148 m², patio central." }, { t: "Maison Falaise", x: "Pornic, 120 m², toit végétalisé." }, { t: "Maison Pignon", x: "Vertou, 165 m², double hauteur." }, { t: "Maison Quai", x: "Saint-Nazaire, 98 m², vue estuaire." }, { t: "Maison Ardoise", x: "Rezé, 132 m², façade en ardoise." }, { t: "Maison Lierre", x: "Carquefou, 175 m², jardin intérieur." }] }],
        ["feat:strips", { title: "Nos principes", items: [{ t: "Orientation d'abord", x: "Chaque plan commence par la course du soleil." }, { t: "Matière brute", x: "Béton clair, bois non traité, verre à isolation renforcée." }, { t: "Un seul interlocuteur", x: "L'architecte conçoit, suit et livre." }] }],
        ["proof:big", { items: [{ q: "On habite dans la lumière : c'est ce qui change tout.", n: "Famille Lemaitre", r: "Clients fictifs" }] }],
        ["cta:image", { title: "Visiter une maison habitée.", sub: "Deux samedis par mois, avec l'architecte.", cta: ["Réserver une visite", "/contact"] }],
      ] },
      { key: "maisons", name: "Maisons réalisées", blocks: [
        ["misc:pagehead", { title: "Maisons réalisées", sub: "Galerie de démonstration." }],
        ["gal:masonry", { items: [{ t: "Maison Verger" }, { t: "Maison Falaise" }, { t: "Maison Pignon" }, { t: "Maison Quai" }, { t: "Maison Ardoise" }, { t: "Maison Lierre" }] }],
        ["gal:cards", { title: "En détail", items: [{ t: "Maison Verger", tag: "148 m²", x: "Béton clair, patio, toiture plate." }, { t: "Maison Falaise", tag: "120 m²", x: "Semi-enterrée, toit végétal." }, { t: "Maison Quai", tag: "98 m²", x: "Compacte sur trois niveaux." }] }],
      ] },
      { key: "principes", name: "Principes", blocks: [
        ["misc:pagehead", { title: "Principes de conception" }],
        ["feat:alt", { items: [{ t: "Le plan libre", x: "Peu de cloisons, des pièces qui se répondent par des transparences." }, { t: "L'inertie du béton", x: "Fraîcheur l'été, chaleur restituée l'hiver, murs apparents." }, { t: "Le jardin comme pièce", x: "Patios, loggias et seuils qui prolongent la maison." }] }],
        ["proof:stats", { items: [["15", "maisons livrées"], ["A", "classe énergie visée (exemple)"], ["18 mois", "de conception à livraison (exemple)"]] }],
      ] },
      { key: "habiter", name: "Habiter", blocks: [
        ["misc:pagehead", { title: "Habiter une maison d'architecte" }],
        ["misc:article", { tag: "Journal", title: "Ce qu'on apprend en vivant dans le béton", meta: "Texte de démonstration", paras: ["Les premiers mois, on découvre la lenteur du matériau : la maison garde la fraîcheur de la nuit jusqu'à tard dans l'après-midi.", "L'entretien est minimal : une façade qui vieillit sans se dégrader, des menuiseries aluminium qui se lavent à l'eau claire."], quote: "Une maison qui se laisse regarder vieillir.", by: "Propriétaire fictive" }],
        ["feat:list2", { title: "Avant de se lancer", items: [{ t: "Un terrain étudié" }, { t: "Un budget de 2 800 € / m² environ (exemple)" }, { t: "Un calendrier réaliste" }, { t: "Un architecte à l'écoute" }] }],
      ] },
      contact("Visites sur rendez-vous, avec l'architecte.", "Visiter une maison", "2 impasse du Verger, 44000 Nantes", ["Demander une visite", "/contact"], "Quelle maison vous intéresse ?"),
    ],
  },
];
