// Portfolios d'artistes et de créateurs, lot B (11 thèmes). Textes de DÉMONSTRATION : marques, personnes et coordonnées fictives.
const q = (q, n, r) => ({ q, n, r });
const ph = (title, sub) => ["misc:pagehead", { title, sub }];
module.exports = [
  // 1. Illustrateur : orange vif, collage, ludique
  {
    key: "plumier-atelier", name: "Plumier Atelier", category: "portfolio", tags: ["ludique", "chaleureux", "audacieux"], siteType: "Illustrateur jeunesse et édition",
    description: "Portfolio d'illustrateur : fond crème, orange vif, titres grotesques expressifs, collage d'images et grille de projets pour l'édition jeunesse et la presse.",
    brand: "Plumier Atelier", tokens: { colors: { primary: "#c2410c", secondary: "#2b2a4c", accent: "#f2b134", background: "#fff8ee", surface: "#ffffff", text: "#2a2430", muted: "#5f5766" }, fonts: { heading: "font.bricolage-grotesque", body: "font.albert-sans", button: "font.albert-sans", link: "font.albert-sans" }, radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 22 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "plumier-atelier", motifs: ["blobs", "objects", "ribbons"] },
    head: ["head:float", {}], foot: ["foot:big", { title: "Un dessin, une histoire." }],
    menu: [["Accueil", "/"], ["Projets", "/projets"], ["Albums", "/albums"], ["Commandes", "/commandes"], ["Contact", "/contact"]], cta: ["Parler d'un projet", "/contact"],
    contact: { address: "Atelier des Crayons, 14 rue du Rempart, 44000 Nantes", phone: "02 40 00 41 52", email: "salut@plumier-atelier.example", hours: "Du lundi au jeudi, 9 h – 17 h", tagline: "Illustratrice pour l'édition jeunesse, la presse et les marques." }, social: ["instagram", "behance"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Illustratrice indépendante", title: "Des dessins qui racontent avant les mots.", sub: "Albums jeunesse, couvertures, dessins de presse et univers de marque, à la gouache et au crayon, finis sur tablette.", cta: ["Voir les projets", "/projets"], cta2: ["Parler d'un projet", "/contact"] }],
        ["gal:masonry", { eyebrow: "Dernières planches", title: "Dans le carnet cette saison", items: [{ t: "Le renard qui comptait les nuages" }, { t: "Couverture de revue de cuisine" }, { t: "Affiche du festival de la Loire" }, { t: "Personnages pour un jeu de société" }, { t: "Carte de vœux, série hiver" }, { t: "Planche de bande dessinée" }] }],
        ["feat:bento", { eyebrow: "Ce que je dessine", title: "Trois terrains de jeu", bg: "token:surface", items: [{ t: "Albums jeunesse", x: "De la mise en page des doubles pages aux personnages récurrents, je construis l'univers visuel d'un livre complet avec l'éditeur.", icon: "book" }, { t: "Presse et édition", x: "Dessins d'actualité, couvertures, schémas expliqués en images.", icon: "fileText" }, { t: "Marques et jeux", x: "Mascottes, packagings, cartes à jouer.", icon: "palette" }] }],
        ["proof:quotes", { eyebrow: "Retours de commande", title: "Ils ont fait confiance au trait", items: [q("Elle a trouvé le ton juste dès la première esquisse, tendre sans jamais être mièvre.", "Hélène Ravel", "éditrice jeunesse, cliente fictive"), q("Un rendu livré en avance et des fichiers impeccables pour l'imprimeur.", "Matthieu Orsal", "directeur artistique, client fictif"), q("Notre mascotte est devenue le visage de la marque.", "Brasserie du Quai", "restaurant, client fictif")] }],
        ["cta:split", { title: "Un album, une couverture, une mascotte ?", sub: "Racontez-moi votre idée : je réponds sous trois jours avec des pistes et un calendrier.", cta: ["Écrire à l'atelier", "/contact"], cta2: ["Voir les tarifs", "/commandes"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ph("Projets", "Une sélection par terrain : jeunesse, presse, marques."),
        ["gal:cards", { title: "Sélection récente", items: [{ t: "Le renard qui comptait les nuages", x: "Album de 32 pages, éditeur indépendant", tag: "Jeunesse" }, { t: "Dossier spécial cuisine", x: "Couverture et douze vignettes", tag: "Presse" }, { t: "Les Gloutons de la Loire", x: "Mascotte et déclinaisons", tag: "Marque" }, { t: "Cartes d'émotions", x: "Jeu de 48 cartes pour l'école", tag: "Jeu" }] }],
        ["feat:strips", { title: "Techniques préférées", items: [{ t: "Gouache et papier gras", x: "Des aplats francs, scannés puis retravaillés." }, { t: "Crayon de couleur", x: "Pour les textures douces et les ombres chaudes." }, { t: "Linogravure", x: "Tampons à répéter, motifs et fonds." }] }],
        ["cta:band", { title: "Vous aimez un style en particulier ?", sub: "Je peux m'en approcher ou vous proposer un tout autre chemin.", cta: ["Envoyer ma référence", "/contact"] }],
      ] },
      { key: "albums", name: "Albums", blocks: [
        ph("Albums publiés", "Des livres à feuilleter, à glisser dans les cartables."),
        ["gal:featured", { title: "À la une", items: [{ t: "Le renard qui comptait les nuages", x: "Dès 4 ans" }, { t: "Mamie Fougère", x: "Dès 3 ans" }, { t: "Pas de panique, Oscar", x: "Dès 5 ans" }, { t: "La nuit des lucioles", x: "Dès 6 ans" }] }],
        ["misc:text", { eyebrow: "Dans les coulisses", title: "Comment naît une page", paras: ["Tout commence par un petit carnet : des silhouettes, des gribouillis, des tailles de personnages. On choisit ensuite la palette, puis on dessine en grand les doubles pages qui portent le rythme du récit.", "Chaque album représente quatre à six mois de travail, avec plusieurs allers-retours avec l'autrice et l'éditrice."] }],
        ["misc:faq", { title: "Questions de parents et d'enseignants", items: [{ t: "Proposez-vous des ateliers en classe ?", x: "Oui, deux formats d'une heure ou d'une demi-journée, pour des groupes de vingt élèves maximum." }, { t: "Peut-on obtenir un dessin dédicacé ?", x: "Lors des salons du livre, ou en écrivant à l'atelier." }] }],
      ] },
      { key: "commandes", name: "Commandes", blocks: [
        ph("Commandes", "Des tarifs d'exemple, ajustés à chaque projet."),
        ["price:tiers", { items: [{ t: "Vignette", price: "180 €", x: "Un dessin isolé", f: ["Esquisse validée", "Illustration finie", "Fichier HD et licence web"], cta: "Demander", url: "/contact" }, { t: "Couverture", price: "650 €", x: "Presse ou livre", f: ["Trois pistes d'esquisse", "Illustration pleine page", "Cession pour édition", "Deux retouches"], cta: "Demander", url: "/contact", hl: true }, { t: "Album", price: "Sur devis", x: "32 pages et plus", f: ["Storyboard complet", "Personnages et décors", "Suivi avec l'éditeur"], cta: "Discuter", url: "/contact" }] }],
        ["feat:steps", { title: "Déroulé d'une commande", items: [{ t: "Brief", x: "Un échange pour cerner le public et le ton.", d: "Jour 1" }, { t: "Esquisses", x: "Trois pistes crayonnées.", d: "Semaine 1" }, { t: "Finalisation", x: "Couleur, retouches, fichiers.", d: "Semaine 2 à 4" }] }],
        ["cta:card", { title: "Un budget serré ?", sub: "Parlons-en : on peut alléger le nombre de pages ou de variantes.", cta: ["Discuter du budget", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Dites-moi tout, même si l'idée est encore floue."),
        ["contact:info", { title: "Écrire à l'atelier", formTitle: "Votre projet en quelques lignes", formIntro: "Public visé, format, date de rendu souhaitée.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Lundi – jeudi", "9 h – 17 h"], ["Vendredi", "Sur rendez-vous"], ["Salons du livre", "Dates sur la page albums"]] }],
      ] },
    ],
  },

  // 2. Graphiste : cobalt, affiche, grotesque géométrique
  {
    key: "gabarit-nord", name: "Gabarit Nord", category: "portfolio", tags: ["audacieux", "geometrique", "moderne"], siteType: "Studio de graphisme et identité visuelle",
    description: "Portfolio de graphiste en grille stricte : affiche typographique cobalt sur fond papier gris, titres larges en capitales, cas d'identité visuelle et tableau comparatif d'offres.",
    brand: "Gabarit Nord", tokens: { colors: { primary: "#2447d6", secondary: "#101b3d", accent: "#ff5a36", background: "#f3f3ef", surface: "#ffffff", text: "#12151f", muted: "#545a6b" }, fonts: { heading: "font.unbounded", body: "font.lato", button: "font.lato", link: "font.lato" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.02, letterSpacing: -0.03, transform: "uppercase" }, h2: { size: 34, weight: 700, lineHeight: 1.1, letterSpacing: -0.02, transform: "uppercase" } }, border: { width: 2, color: "#12151f" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "gabarit-nord", motifs: ["tiles", "halftone", "rays"] },
    head: ["head:minimal", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Identités", "/identites"], ["Affiches", "/affiches"], ["Offres", "/offres"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "Studio 3, 27 quai des Chartrons, 33000 Bordeaux", phone: "05 56 00 28 74", email: "studio@gabarit-nord.example", hours: "Du lundi au vendredi, 9 h 30 – 18 h", tagline: "Studio de design graphique : logos, chartes, éditions, affiches." }, social: ["behance", "linkedin", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Design graphique", title: "Une marque nette, un message qui porte.", sub: "Identités visuelles, éditions et affiches pour les structures qui préfèrent la clarté au bruit.", cta: ["Voir les identités", "/identites"], cta2: ["Demander un devis", "/contact"] }],
        ["proof:logos", { title: "Pour des structures fictives comme", items: ["Café Tramontane", "Théâtre des Éclusiers", "Cabinet Daumas", "Rucher Saint-Loup", "Collectif Piétonne"] }],
        ["feat:rows", { eyebrow: "Services", title: "Ce que le studio fabrique", items: [{ t: "Identité visuelle", x: "Logo, couleurs, typographies, gabarits et règles d'usage." }, { t: "Édition et rapports", x: "Mise en page de livres, catalogues, rapports d'activité." }, { t: "Affiches et signalétique", x: "Campagnes, programmes, panneaux." }, { t: "Direction artistique", x: "Cadrage visuel de vos campagnes et de vos réseaux." }] }],
        ["gal:grid", { title: "Travaux choisis", items: [{ t: "Tramontane, charte de café" }, { t: "Saison culturelle, 24 affiches" }, { t: "Rapport annuel, collectif citoyen" }, { t: "Étiquettes d'une brasserie" }, { t: "Signalétique d'un cabinet" }, { t: "Programme de festival" }] }],
        ["feat:compare", { title: "Choisir son format", bg: "token:surface", rows: [["", "Éclair", "Identité complète"], ["Logo et déclinaisons", "oui", "oui"], ["Charte graphique", "résumée", "complète"], ["Gabarits bureautiques", "non", "oui"], ["Délai moyen", "3 semaines", "8 semaines"]] }],
        ["cta:band", { title: "Votre marque mérite un trait précis.", sub: "Premier échange gratuit de 30 minutes.", cta: ["Prendre contact", "/contact"] }],
      ] },
      { key: "identites", name: "Identités", blocks: [
        ph("Identités visuelles", "Trois études de cas fictives, du brief à la charte."),
        ["gal:cards", { title: "Études de cas", items: [{ t: "Café Tramontane", x: "Un logo-lettre et une palette de torréfaction", tag: "Restauration" }, { t: "Théâtre des Éclusiers", x: "Affiches modulaires pour une saison", tag: "Culture" }, { t: "Cabinet Daumas", x: "Sobriété et lisibilité pour un cabinet d'experts", tag: "Services" }] }],
        ["feat:steps", { title: "Méthode", items: [{ t: "Immersion", x: "Ateliers, audit de l'existant, références.", d: "Semaines 1-2" }, { t: "Pistes", x: "Trois directions présentées en réunion.", d: "Semaines 3-4" }, { t: "Charte", x: "Livrables, formation des équipes.", d: "Semaines 5-8" }] }],
        ["proof:big", { items: [q("La charte a remis tout le monde d'accord en une réunion.", "Delphine Marest", "directrice d'association, cliente fictive")] }],
      ] },
      { key: "affiches", name: "Affiches", blocks: [
        ph("Affiches et éditions", "Grands formats, petits budgets, beaucoup de caractère."),
        ["gal:wall", { title: "Mur d'affiches", items: [{ t: "Saison 24" }, { t: "Fête du fleuve" }, { t: "Ciné plein air" }, { t: "Marché des créateurs" }] }],
        ["feat:list2", { title: "Livrables courants", items: [{ t: "Fichiers prêts pour l'imprimeur" }, { t: "Déclinaisons pour les réseaux" }, { t: "Version accessible en gros caractères" }, { t: "Suivi d'impression" }] }],
        ["cta:card", { title: "Une affiche pour la rentrée ?", sub: "Donnez-nous la date, le lieu et le ton.", cta: ["Briefer le studio", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ph("Offres et tarifs", "Des tarifs d'exemple, hors frais d'impression."),
        ["price:tiers", { items: [{ t: "Logo", price: "1 200 €", x: "Un signe fort", f: ["Trois pistes", "Version couleur et noir", "Guide d'une page"], cta: "Choisir", url: "/contact" }, { t: "Identité", price: "3 900 €", x: "La charte complète", f: ["Logo et typographies", "Charte de 30 pages", "Gabarits bureautiques", "Réunion de passation"], cta: "Choisir", url: "/contact", hl: true }, { t: "Campagne", price: "Sur devis", x: "Affiches et réseaux", f: ["Direction artistique", "Déclinaisons multiples"], cta: "Discuter", url: "/contact" }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Qui détient les droits ?", x: "Les droits d'exploitation vous sont cédés à la livraison finale, après paiement du solde." }, { t: "Combien de retouches ?", x: "Deux tours de corrections sont inclus dans chaque forfait." }] }],
        ["cta:band", { title: "Besoin d'un chiffrage précis ?", sub: "Envoyez le brief, le devis arrive sous 48 heures.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Un brief, un budget, une échéance : c'est un bon début."),
        ["contact:cards", { title: "Parler au studio", formTitle: "Votre brief", formIntro: "Nom de la structure, besoin, date souhaitée.", cta: ["Envoyer le brief", "/contact"] }],
        ["misc:quote", { text: "Le meilleur graphisme est celui qu'on remarque à peine, sauf par ceux qui doivent le comprendre.", by: "Studio Gabarit Nord" }],
      ] },
    ],
  },

  // 3. Peintre : olive, éditorial, cormorant
  {
    key: "toile-ocre", name: "Toile d'Ocre", category: "portfolio", tags: ["editorial", "naturel", "luxe"], siteType: "Peintre et artiste plasticienne",
    description: "Site d'une peintre : titre éditorial, tons olive et lin, séries d'œuvres présentées en galerie à la une, atelier et calendrier d'expositions.",
    brand: "Toile d'Ocre", tokens: { colors: { primary: "#5c6a14", secondary: "#2e2a1c", accent: "#b9772e", background: "#f6f1e4", surface: "#fffdf6", text: "#2a261a", muted: "#625b45" }, fonts: { heading: "font.cormorant-garamond", body: "font.titillium-web", button: "font.titillium-web", link: "font.titillium-web" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.02, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "toile-ocre", motifs: ["plates", "topo", "dunes"] },
    head: ["head:center", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Œuvres", "/oeuvres"], ["Atelier", "/atelier"], ["Expositions", "/expositions"], ["Contact", "/contact"]], cta: ["Écrire à l'atelier", "/contact"],
    contact: { address: "Atelier ouvert, 5 chemin des Oliviers, 84220 Gordes", phone: "04 90 00 61 07", email: "atelier@toile-ocre.example", hours: "Visites sur rendez-vous, du mercredi au samedi", tagline: "Peinture à l'huile et pigments de terre, Luberon." }, social: ["instagram", "pinterest"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Peinture à l'huile", title: "La terre, la lumière, le temps long.", sub: "Des paysages abstraits peints aux pigments de terre, en séries lentes, entre Luberon et Méditerranée.", cta: ["Découvrir les séries", "/oeuvres"] }],
        ["misc:quote", { text: "Je peins ce qui reste du paysage quand on ferme les yeux.", by: "Maud Estèbe, peintre (fictive)" }],
        ["gal:featured", { title: "Séries en cours", items: [{ t: "Ocres de Roussillon", x: "Huile sur toile, 2025" }, { t: "Garrigue de nuit", x: "Huile et cire, 2025" }, { t: "Sillons", x: "Pigments sur lin, 2024" }, { t: "Fenêtres d'été", x: "Huile sur bois, 2024" }] }],
        ["feat:strips", { title: "Une pratique d'atelier", bg: "token:surface", items: [{ t: "Pigments broyés", x: "Ocres, terres d'ombre et verts de gris fabriqués à l'atelier." }, { t: "Couches lentes", x: "Chaque toile demande de six à douze semaines de séchage entre les glacis." }, { t: "Formats libres", x: "Du petit carré de 30 cm aux grands diptyques de 2 m." }] }],
        ["proof:big", { items: [q("Une peinture qui change à chaque heure de la journée, comme la fenêtre d'où elle est née.", "Roland Cassel", "collectionneur, client fictif")] }],
        ["cta:card", { title: "Envie d'une visite d'atelier ?", sub: "Nous recevons sur rendez-vous, avec un café et peu de discours.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "oeuvres", name: "Œuvres", blocks: [
        ph("Œuvres", "Les séries sont présentées par ordre chronologique inversé."),
        ["gal:cards", { title: "Séries", items: [{ t: "Ocres de Roussillon", x: "12 toiles, de 50 à 150 cm", tag: "2025" }, { t: "Garrigue de nuit", x: "8 toiles, huile et cire d'abeille", tag: "2025" }, { t: "Sillons", x: "9 toiles sur lin", tag: "2024" }, { t: "Fenêtres d'été", x: "6 bois, petits formats", tag: "2024" }] }],
        ["gal:strip", { title: "Détails de matière", items: [{ t: "Glacis" }, { t: "Craquelures" }, { t: "Cire" }, { t: "Terre" }, { t: "Lin" }] }],
        ["misc:text", { eyebrow: "Acquérir une œuvre", title: "Comment procéder", paras: ["Toutes les toiles sont disponibles à la vente directe ou via des galeries partenaires. Un certificat signé accompagne chaque pièce.", "Les prix vont de 450 € pour un petit format à 6 800 € pour un grand diptyque (exemples)."] }],
      ] },
      { key: "atelier", name: "Atelier", blocks: [
        ph("L'atelier"),
        ["misc:story", { eyebrow: "Parcours", title: "Vingt ans de peinture, une vie de promenades", paras: ["Après les Beaux-Arts, j'ai travaillé comme restauratrice de peintures murales avant de revenir à ma propre pratique. De ces années, j'ai gardé le goût des matières anciennes.", "J'enseigne aussi un stage de pigments chaque printemps pour huit participants."], image: "portrait-2" }],
        ["feat:numbered", { title: "En quelques repères (exemples)", items: [{ t: "20", x: "ans de pratique" }, { t: "14", x: "expositions personnelles" }, { t: "8", x: "stagiaires par session" }] }],
        ["cta:band", { title: "Un stage pour broyer vos couleurs ?", sub: "Trois jours en mai, matériel fourni.", cta: ["Demander le programme", "/contact"] }],
      ] },
      { key: "expositions", name: "Expositions", blocks: [
        ph("Expositions", "Prochains rendez-vous."),
        ["misc:schedule", { title: "Calendrier", items: [{ d: "12 mars", t: "Vernissage, galerie des Tilleuls, Avignon", x: "Série Ocres de Roussillon." }, { d: "9 mai", t: "Stage pigments", x: "Trois jours à l'atelier." }, { d: "27 juin", t: "Journées d'ateliers ouverts", x: "Entrée libre." }, { d: "5 octobre", t: "Salon d'automne, Lyon", x: "Quatre grands formats." }] }],
        ["misc:faq", { title: "Questions pratiques", items: [{ t: "Les expositions sont-elles gratuites ?", x: "Oui, sauf mention contraire sur la fiche de l'événement." }, { t: "Peut-on commander un format sur mesure ?", x: "Oui, après un échange sur les couleurs de la pièce et son éclairage." }] }],
        ["cta:split", { title: "Recevoir les invitations", sub: "Un message par exposition, jamais plus.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:map", { title: "L'atelier", mapAddress: "5 chemin des Oliviers, 84220 Gordes" }],
        ["misc:hours", { title: "Visites", rows: [["Mercredi – vendredi", "14 h – 18 h"], ["Samedi", "10 h – 13 h"], ["Autres jours", "Sur rendez-vous"]] }],
      ] },
    ],
  },

  // 4. Sculpteur : sombre, ambre, marcellus
  {
    key: "pierre-vive-op", name: "Pierre Vive", category: "portfolio", tags: ["sombre", "luxe", "minimaliste"], siteType: "Sculpteur sur pierre et bronze",
    description: "Portfolio sombre de sculpteur : fond graphite, ambre chaud, titres romains, grande image plein bandeau, chiffres de l'atelier et carrousel de pièces.",
    brand: "Pierre Vive", tokens: { colors: { primary: "#e3b04b", secondary: "#2a2723", accent: "#c97b4a", background: "#151412", surface: "#201e1b", text: "#f2ede4", muted: "#b5ada0" }, fonts: { heading: "font.marcellus", body: "font.cabin", button: "font.cabin", link: "font.cabin" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3a3631" } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "pierre-vive", motifs: ["plates", "mountains", "rays"] },
    head: ["head:dark", {}], foot: ["foot:columns", { about: "Sculpture monumentale et pièces d'intérieur, taillées et coulées dans l'atelier.", cols: [["Pièces", "/pieces", "/commandes"], ["Atelier", "/atelier", "/contact"]] }],
    menu: [["Accueil", "/"], ["Pièces", "/pieces"], ["Atelier", "/atelier"], ["Commandes", "/commandes"], ["Contact", "/contact"]], cta: ["Visiter l'atelier", "/contact"],
    contact: { address: "Fonderie-atelier, 21 route des Carrières, 21200 Beaune", phone: "03 80 00 15 66", email: "atelier@pierre-vive.example", hours: "Du mardi au samedi, sur rendez-vous", tagline: "Sculpteur : pierre, bronze et bois, de la maquette à la pose." }, social: ["instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Sculpteur", title: "Tailler la pierre jusqu'à ce qu'elle respire.", sub: "Pièces uniques en pierre de Bourgogne et bronze à la cire perdue, pour l'espace public comme pour la maison.", cta: ["Voir les pièces", "/pieces"], cta2: ["Visiter l'atelier", "/contact"] }],
        ["feat:numbered", { title: "L'atelier en chiffres (exemples)", items: [{ t: "35", x: "ans de taille" }, { t: "120", x: "pièces installées" }, { t: "4 t", x: "la plus lourde" }] }],
        ["gal:carousel", { title: "Pièces récentes", items: [{ t: "Mur de souffle, calcaire" }, { t: "Le grand veilleur, bronze" }, { t: "Torsade, marbre blanc" }, { t: "Cairn, pierre de Comblanchien" }, { t: "Table-source, bois et pierre" }] }],
        ["feat:tabs", { title: "Trois matières", bg: "token:surface", items: [{ t: "Pierre", x: "Calcaire de Bourgogne, taillé au ciseau et à la gradine, patiné à la cire." }, { t: "Bronze", x: "Modelage en cire, moule en céramique, coulée à l'atelier et patine à chaud." }, { t: "Bois", x: "Chêne et noyer de récupération, assemblés sans clou." }] }],
        ["cta:image", { title: "Un projet pour un jardin, un hall, une place ?", sub: "Nous partons de l'espace, puis nous esquissons la pièce.", cta: ["Discuter d'une commande", "/commandes"] }],
      ] },
      { key: "pieces", name: "Pièces", blocks: [
        ph("Pièces", "Disponibles ou déjà installées."),
        ["gal:featured", { title: "À la une", items: [{ t: "Le grand veilleur", x: "Bronze, 2,4 m" }, { t: "Mur de souffle", x: "Calcaire, 3 éléments" }, { t: "Torsade", x: "Marbre blanc, 90 cm" }, { t: "Cairn", x: "Empilement de cinq blocs" }] }],
        ["feat:rows", { title: "Catégories", items: [{ t: "Monumental", x: "Places, cours, parvis, entrées d'entreprise." }, { t: "Jardin", x: "Bassins, bancs sculptés, stèles." }, { t: "Intérieur", x: "Pièces de table, bas-reliefs, cheminées." }] }],
        ["cta:band", { title: "Une pièce vous interpelle ?", sub: "Disponibilité et prix sur demande (exemples).", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "atelier", name: "Atelier", blocks: [
        ph("L'atelier"),
        ["misc:story", { eyebrow: "Le geste", title: "Du bloc brut à la pièce posée", paras: ["Tout part du bloc : choisi à la carrière, étudié, tourné dans tous les sens avant le premier coup de massette.", "L'atelier emploie deux compagnons tailleurs et un fondeur, et accueille chaque année un apprenti en formation."], image: "portrait-1" }],
        ["feat:steps", { title: "Fabrication d'une pièce", items: [{ t: "Maquette", x: "Terre et plâtre à l'échelle réduite.", d: "Mois 1" }, { t: "Taille ou moulage", x: "Selon la matière.", d: "Mois 2-4" }, { t: "Finition et patine", x: "Cire, acide, polissage.", d: "Mois 5" }, { t: "Pose", x: "Transport, scellement, éclairage.", d: "Mois 6" }] }],
        ["proof:big", { items: [q("La pièce est devenue le cœur de notre cour, on la touche chaque matin.", "Marie-Laure Dufresne", "directrice d'une fondation, cliente fictive")] }],
      ] },
      { key: "commandes", name: "Commandes", blocks: [
        ph("Commander une sculpture", "Un projet se construit en dialogue."),
        ["price:tiers", { items: [{ t: "Pièce d'intérieur", price: "dès 2 400 €", x: "Moins de 60 cm", f: ["Maquette validée", "Taille ou coulée", "Certificat signé"], cta: "Discuter", url: "/contact" }, { t: "Pièce de jardin", price: "dès 9 800 €", x: "Jusqu'à 2 m", f: ["Étude d'implantation", "Fondation et pose", "Entretien conseillé"], cta: "Discuter", url: "/contact", hl: true }, { t: "Commande publique", price: "Sur dossier", x: "Concours et 1 % artistique", f: ["Dossier de candidature", "Suivi administratif"], cta: "Discuter", url: "/contact" }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Quel délai prévoir ?", x: "Comptez de quatre à douze mois selon la taille et la matière." }, { t: "Livrez-vous partout ?", x: "Oui, en France et en Europe, transport assuré." }] }],
        ["cta:card", { title: "Un échange pour commencer", sub: "Visite d'atelier et croquis préliminaires offerts.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "L'atelier", formTitle: "Votre projet", formIntro: "Lieu, matière envisagée, dimensions approximatives.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Visites", rows: [["Mardi – vendredi", "10 h – 17 h, sur rendez-vous"], ["Samedi", "10 h – 13 h"]] }],
      ] },
    ],
  },

  // 5. Musicien / compositeur : sombre violet, bodoni, programme de concerts
  {
    key: "partition-nuit", name: "Partition de Nuit", category: "portfolio", tags: ["sombre", "editorial", "luxe"], siteType: "Compositeur et pianiste",
    description: "Site de compositeur sombre : nuit bleu-noir, violet clair, titres Bodoni, agenda de concerts, discographie, presse et formules de commande de musique originale.",
    brand: "Partition de Nuit", tokens: { colors: { primary: "#a78bfa", secondary: "#1b1830", accent: "#f0c674", background: "#100e1c", surface: "#1a1730", text: "#efecfa", muted: "#b3aed0" }, fonts: { heading: "font.bodoni-moda", body: "font.sora", button: "font.sora", link: "font.sora" }, radius: { sm: 4, md: 8, lg: 14, button: 6, field: 8, card: 10 }, shadow: { card: "md", button: "none" }, border: { width: 1, color: "#332e52" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "partition-nuit", motifs: ["waves", "bokeh", "mesh"] },
    head: ["head:side", {}], foot: ["foot:newsletter", { title: "Les concerts du mois", sub: "Un courrier par trimestre : dates, créations, extraits en avant-première.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Musique", "/musique"], ["Concerts", "/concerts"], ["Commandes", "/commandes"], ["Contact", "/contact"]], cta: ["Écouter", "/musique"],
    contact: { address: "Studio, 9 rue des Orgues, 69001 Lyon", phone: "04 78 00 33 91", email: "contact@partition-nuit.example", hours: "Du lundi au vendredi, 10 h – 18 h", tagline: "Compositeur : musique de concert, de film et de scène." }, social: ["youtube", "instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Compositeur et pianiste", title: "Des notes écrites pour la nuit, jouées pour tous.", sub: "Musique de chambre, pièces pour orchestre à cordes et bandes originales de courts métrages.", cta: ["Écouter les extraits", "/musique"], cta2: ["Voir les concerts", "/concerts"] }],
        ["misc:schedule", { title: "Prochains concerts", items: [{ d: "14 déc.", t: "Création pour quatuor, Auditorium de Lyon", x: "Entrée 18 € (exemple)." }, { d: "18 janv.", t: "Récital piano solo, Abbaye de Cluny", x: "Programme original." }, { d: "7 mars", t: "Ciné-concert, cinéma Le Prisme", x: "Court métrage et orchestre de chambre." }] }],
        ["feat:alt", { eyebrow: "Répertoire", title: "Trois univers", bg: "token:surface", items: [{ t: "Musique de chambre", x: "Quatuors, trios et pièces pour piano, écrits pour des ensembles régionaux.", link: ["Écouter", "/musique"] }, { t: "Image et scène", x: "Courts métrages, théâtre, installations sonores." }, { t: "Pédagogie", x: "Pièces faciles pour jeunes instrumentistes et ateliers de composition." }] }],
        ["proof:statsbar", { items: [["60", "œuvres écrites"], ["4", "albums"], ["120", "concerts donnés"]] }],
        ["misc:posts", { title: "Carnets de composition", count: 3, layout: "grid" }],
        ["cta:split", { title: "Une musique originale pour votre projet ?", sub: "Film, spectacle, cérémonie : parlons du son que vous cherchez.", cta: ["Commander une musique", "/commandes"] }],
      ] },
      { key: "musique", name: "Musique", blocks: [
        ph("Musique", "Albums et pièces choisies."),
        ["gal:cards", { title: "Discographie", items: [{ t: "Nocturnes en ré", x: "Piano solo, 2025", tag: "Album" }, { t: "Le vol des corneilles", x: "Quatuor à cordes, 2023", tag: "Album" }, { t: "Fenêtres", x: "Musique de court métrage, 2022", tag: "EP" }, { t: "Petites marches", x: "Pièces pour jeunes violonistes", tag: "Partition" }] }],
        ["feat:rows", { title: "Pièces à écouter", items: [{ t: "Aube sur le canal", x: "Piano, 6 min" }, { t: "Le vol des corneilles", x: "Quatuor, 14 min" }, { t: "Lente chaleur", x: "Piano et violoncelle, 9 min" }] }],
        ["cta:band", { title: "Les partitions sont disponibles", sub: "Parties séparées et conducteurs, version papier ou PDF.", cta: ["Demander une partition", "/contact"] }],
      ] },
      { key: "concerts", name: "Concerts", blocks: [
        ph("Agenda et presse"),
        ["misc:schedule", { title: "Saison en cours", items: [{ d: "14 déc.", t: "Création pour quatuor", x: "Auditorium de Lyon, 20 h." }, { d: "18 janv.", t: "Récital piano", x: "Abbaye de Cluny, 17 h." }, { d: "7 mars", t: "Ciné-concert", x: "Cinéma Le Prisme, 19 h 30." }, { d: "2 mai", t: "Master class", x: "Conservatoire, 14 h." }] }],
        ["proof:quotes", { title: "Dans la presse (exemples)", items: [q("Une écriture limpide, qui laisse respirer le silence.", "Revue Clef de Sol", "presse fictive"), q("Un pianiste qui compose comme on raconte.", "Le Courrier des Arts", "presse fictive"), q("La création a ému la salle entière.", "Bulletin de l'auditorium", "presse fictive")] }],
        ["cta:card", { title: "Programmer ce concert chez vous ?", sub: "Fiche technique et conditions sur demande.", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "commandes", name: "Commandes", blocks: [
        ph("Commandes de musique", "Tarifs d'exemple, selon la durée et l'effectif."),
        ["price:tiers", { items: [{ t: "Jingle", price: "420 €", x: "Moins d'une minute", f: ["Deux propositions", "Fichier mixé", "Licence web"], cta: "Demander", url: "/contact" }, { t: "Court métrage", price: "1 900 €", x: "Jusqu'à 10 minutes", f: ["Lecture d'image", "Musique originale", "Mixage stéréo"], cta: "Demander", url: "/contact", hl: true }, { t: "Pièce de concert", price: "Sur devis", x: "Pour ensemble", f: ["Partition et parties", "Répétitions"], cta: "Discuter", url: "/contact" }] }],
        ["feat:steps", { title: "Comment ça se passe", items: [{ t: "Écoute des références", x: "Ce que vous aimez et ce que vous fuyez.", d: "Étape 1" }, { t: "Esquisse sonore", x: "Un thème au piano.", d: "Étape 2" }, { t: "Version finale", x: "Enregistrement et livraison.", d: "Étape 3" }] }],
        ["misc:faq", { items: [{ t: "Les droits sont-ils cédés ?", x: "Une licence d'usage est définie au devis, la propriété de l'œuvre reste à l'auteur." }, { t: "Travaillez-vous à distance ?", x: "Oui, par fichiers audio et visioconférence." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:cards", { title: "Écrire au compositeur", formTitle: "Votre message", formIntro: "Projet, durée, date de livraison souhaitée.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "La musique commence là où les mots se retirent.", by: "Partition de Nuit" }],
      ] },
    ],
  },

  // 6. Danseuse / chorégraphe : rose, italiana
  {
    key: "ruban-souffle", name: "Ruban & Souffle", category: "portfolio", tags: ["editorial", "chaleureux", "moderne"], siteType: "Danseuse et chorégraphe",
    description: "Site de chorégraphe : blanc rosé, rouge framboise, titres élancés, carré encadré, créations, calendrier de représentations et ateliers pour amateurs.",
    brand: "Ruban & Souffle", tokens: { colors: { primary: "#be1e4d", secondary: "#3a1425", accent: "#e8a0b4", background: "#fdf4f6", surface: "#ffffff", text: "#2b1620", muted: "#6a4a58" }, fonts: { heading: "font.italiana", body: "font.urbanist", button: "font.urbanist", link: "font.urbanist" }, radius: { sm: 6, md: 16, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "ruban-souffle", motifs: ["ribbons", "waves", "bokeh"] },
    head: ["head:split", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Créations", "/creations"], ["Représentations", "/representations"], ["Ateliers", "/ateliers"], ["Contact", "/contact"]], cta: ["Réserver un atelier", "/ateliers"],
    contact: { address: "Studio Souffle, 33 rue de la Filature, 59800 Lille", phone: "03 20 00 72 18", email: "compagnie@ruban-souffle.example", hours: "Studio ouvert du lundi au samedi, 10 h – 21 h", tagline: "Compagnie de danse contemporaine : créations, transmission, résidences." }, social: ["instagram", "youtube", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Compagnie de danse contemporaine", title: "Le corps pense avant la parole.", sub: "Créations pour la scène et l'espace public, ateliers de mouvement pour tous les âges.", cta: ["Voir les créations", "/creations"], cta2: ["Réserver un atelier", "/ateliers"] }],
        ["feat:icons", { eyebrow: "Notre travail", title: "Créer, transmettre, partager", items: [{ t: "Créations", x: "Une pièce nouvelle chaque saison, de trois à huit interprètes.", icon: "sparkles" }, { t: "Transmission", x: "Cours hebdomadaires et stages en studio.", icon: "users" }, { t: "Territoires", x: "Interventions en écoles, hôpitaux et places publiques.", icon: "mapPin" }] }],
        ["gal:strip", { title: "Instants de scène", items: [{ t: "Envol" }, { t: "Le cercle" }, { t: "Après la pluie" }, { t: "Sur le fil" }, { t: "Rideau" }] }],
        ["proof:big", { items: [q("On sort de la salle plus léger, comme si le corps avait parlé à notre place.", "Spectateur après la première", "client fictif")] }],
        ["misc:schedule", { title: "À l'affiche", items: [{ d: "21 nov.", t: "Après la pluie, Théâtre du Beffroi", x: "Pièce pour six danseurs." }, { d: "12 déc.", t: "Sur le fil", x: "Forme courte pour la rue." }] }],
        ["cta:band", { title: "Venez danser avec nous.", sub: "Premier cours d'essai offert.", cta: ["Découvrir les ateliers", "/ateliers"] }],
      ] },
      { key: "creations", name: "Créations", blocks: [
        ph("Créations", "Un répertoire entre danse contemporaine et théâtre gestuel."),
        ["gal:cards", { title: "Pièces", items: [{ t: "Après la pluie", x: "Pièce pour six danseurs, 55 min", tag: "2025" }, { t: "Sur le fil", x: "Forme de rue pour trois danseurs, 25 min", tag: "2024" }, { t: "Envol", x: "Solo chorégraphique, 35 min", tag: "2023" }] }],
        ["feat:rows", { title: "Notes d'intention", items: [{ t: "Après la pluie", x: "Un hommage aux gestes qui suivent l'orage." }, { t: "Sur le fil", x: "Fragilité et équilibre dans l'espace public." }, { t: "Envol", x: "Un solo sur la légèreté et son coût." }] }],
        ["cta:card", { title: "Accueillir la compagnie ?", sub: "Fiche technique et dossier de diffusion sur demande.", cta: ["Demander le dossier", "/contact"] }],
      ] },
      { key: "representations", name: "Représentations", blocks: [
        ph("Représentations", "Dates de tournée et résidences."),
        ["misc:schedule", { title: "Tournée", items: [{ d: "21 nov.", t: "Théâtre du Beffroi, Lille", x: "20 h 30." }, { d: "5 déc.", t: "Maison de la culture, Amiens", x: "19 h." }, { d: "12 janv.", t: "Scène nationale, Arras", x: "20 h." }, { d: "9 mars", t: "Festival Mouvements, Rouen", x: "18 h." }] }],
        ["proof:stats", { title: "La compagnie en chiffres (exemples)", items: [["15", "ans d'existence"], ["9", "créations"], ["200", "représentations"]] }],
        ["cta:split", { title: "Réserver vos places", sub: "La billetterie est gérée par chaque salle : suivez les liens indiqués.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ph("Ateliers et cours", "Pour débutants et danseurs confirmés."),
        ["price:tiers", { items: [{ t: "Cours à l'unité", price: "15 €", x: "1 h 30", f: ["Tous niveaux", "Tenue souple"], cta: "Réserver", url: "/contact" }, { t: "Trimestre", price: "180 €", x: "Un cours par semaine", f: ["12 séances", "Spectacle de fin d'année"], cta: "S'inscrire", url: "/contact", hl: true }, { t: "Stage week-end", price: "95 €", x: "Deux jours", f: ["Thème de création", "Restitution publique"], cta: "S'inscrire", url: "/contact" }] }],
        ["misc:hours", { title: "Planning du studio", rows: [["Lundi", "Enfants 17 h, adultes 19 h"], ["Mercredi", "Ados 15 h, contemporain 19 h"], ["Samedi", "Stage et cours ouvert, 10 h"]] }],
        ["misc:faq", { items: [{ t: "Faut-il avoir déjà dansé ?", x: "Non, les cours débutants sont conçus pour découvrir le mouvement." }, { t: "Et pour les enfants ?", x: "Dès 6 ans, en petits groupes." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:map", { title: "Le studio", mapAddress: "33 rue de la Filature, 59800 Lille" }],
        ["misc:quote", { text: "Danser, c'est écrire dans l'air ce que les mots n'osent pas.", by: "Ruban & Souffle" }],
      ] },
    ],
  },

  // 7. Écrivain : teal, spectral, journal
  {
    key: "encrier-sel", name: "Encrier de Sel", category: "portfolio", tags: ["editorial", "classique", "minimaliste"], siteType: "Écrivain et autrice de romans",
    description: "Site d'écrivain : bandeau de journal, grande page de titre sans image, vert-bleu encre, livres, journal d'écriture, rencontres et presse.",
    brand: "Encrier de Sel", tokens: { colors: { primary: "#0f766e", secondary: "#1c2b2a", accent: "#c8913a", background: "#f7f5f0", surface: "#ffffff", text: "#1d2423", muted: "#566360" }, fonts: { heading: "font.spectral", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d8d4c8" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "encrier-sel", motifs: ["waves", "topo", "tiles"] },
    head: ["head:masthead", { dateline: "Journal d'une autrice, Bretagne" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Livres", "/livres"], ["Journal", "/journal"], ["Rencontres", "/rencontres"], ["Contact", "/contact"]], cta: ["Lire un extrait", "/livres"],
    contact: { address: "c/o Éditions du Cormoran, 2 quai des Chalutiers, 29900 Concarneau", phone: "02 98 00 54 90", email: "contact@encrier-sel.example", hours: "Réponse sous une semaine", tagline: "Romans, nouvelles et ateliers d'écriture en bord de mer." }, social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Autrice", title: "Écrire, c'est tenir la mer à bout de phrase.", sub: "Romans de littérature générale, nouvelles et ateliers d'écriture. Un nouveau roman paraît ce printemps.", cta: ["Lire un extrait", "/livres"], cta2: ["Voir les rencontres", "/rencontres"] }],
        ["misc:posts", { title: "Dans le journal", count: 3, layout: "list" }],
        ["feat:checks", { title: "Pour les lecteurs", intro: "Tout ce qu'il faut pour entrer dans l'œuvre.", cta: ["Voir les livres", "/livres"], items: [{ t: "Premier chapitre en lecture libre" }, { t: "Dates de dédicaces et salons" }, { t: "Pistes de lecture pour les clubs" }, { t: "Informations pour les libraires" }] }],
        ["proof:quotes", { title: "Ils ont lu", items: [q("Une langue de sel et de vent, qu'on lit à voix basse.", "Joëlle Parent", "libraire, cliente fictive"), q("Le roman que j'ai offert trois fois cet été.", "Théo Marchand", "lecteur fictif"), q("Un club de lecture n'a jamais été aussi bavard.", "Association Lire à Loctudy", "club de lecture fictif")] }],
        ["cta:card", { title: "Recevoir la lettre de l'autrice", sub: "Quatre envois par an : un texte inédit, les dates, une lecture coup de cœur.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "livres", name: "Livres", blocks: [
        ph("Livres", "Romans, recueils et textes courts."),
        ["gal:cards", { title: "Bibliographie", items: [{ t: "Le phare des absents", x: "Roman, éditions du Cormoran", tag: "2026" }, { t: "Marées basses", x: "Roman, 288 pages", tag: "2023" }, { t: "Sel et poussière", x: "Recueil de nouvelles", tag: "2021" }, { t: "La petite sardine", x: "Album pour enfants", tag: "2020" }] }],
        ["misc:text", { eyebrow: "Extrait", title: "Le phare des absents", paras: ["Le matin, la mer avait rendu un tabouret, une paire de lunettes et la moitié d'une barque. Marthe les aligna sur la table de la cuisine, comme on classe les preuves d'un procès que personne ne tiendrait.", "Dehors, le vent avait cessé d'insister. Elle comprit que le village attendrait d'elle qu'elle parle la première."] }],
        ["feat:accordion", { title: "Pour les clubs de lecture", items: [{ t: "Questions pour discuter", x: "Un dossier de dix questions est disponible gratuitement." }, { t: "Rencontre en visio", x: "L'autrice peut se joindre à votre club pour une heure d'échange." }] }],
      ] },
      { key: "journal", name: "Journal", blocks: [
        ph("Journal d'écriture", "Notes de travail, lectures, voyages."),
        ["misc:posts", { title: "Derniers billets", count: 6, layout: "grid" }],
        ["misc:article", { tag: "Atelier", title: "Pourquoi j'écris le matin", meta: "Billet d'exemple, lecture de cinq minutes", paras: ["Le matin, la page est encore une table rase. Avant que le monde ne me rappelle ses urgences, j'ai une heure de calme et une tasse de thé noir.", "Je m'impose cent mots minimum. Souvent, j'en écris mille, parfois zéro et je relis. Cette régularité m'a appris plus que tous les grands élans."], quote: "Un texte se construit moins par inspiration que par rendez-vous pris avec soi-même.", by: "Encrier de Sel" }],
        ["cta:band", { title: "Une question d'écriture ?", sub: "Je réponds à quelques lettres chaque mois dans le journal.", cta: ["Poser une question", "/contact"] }],
      ] },
      { key: "rencontres", name: "Rencontres", blocks: [
        ph("Rencontres et ateliers"),
        ["misc:schedule", { title: "Prochaines rencontres", items: [{ d: "10 avr.", t: "Lancement du roman, librairie Les Marées", x: "Lecture et dédicaces, 18 h." }, { d: "24 avr.", t: "Salon du livre de Quimper", x: "Table ronde, 15 h." }, { d: "6 juin", t: "Atelier d'écriture à la médiathèque", x: "Sur inscription." }] }],
        ["price:tiers", { items: [{ t: "Atelier d'une journée", price: "80 €", x: "10 participants", f: ["Consignes d'écriture", "Lecture à voix haute"], cta: "Réserver", url: "/contact" }, { t: "Résidence de 4 jours", price: "420 €", x: "Hébergement en option", f: ["Suivi individuel", "Lecture finale publique"], cta: "Réserver", url: "/contact", hl: true }] }],
        ["misc:faq", { items: [{ t: "Faut-il avoir déjà écrit ?", x: "Non, les ateliers accueillent aussi les débutants." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Écrire à l'autrice", formTitle: "Votre message", formIntro: "Presse, librairie, club de lecture, atelier.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "Je lis chaque lettre, je ne réponds pas toujours vite, mais jamais pas du tout.", by: "Encrier de Sel" }],
      ] },
    ],
  },

  // 8. Galerie d'art : noir et blanc, rouge, chivo
  {
    key: "cimaise-claire", name: "Cimaise Claire", category: "portfolio", tags: ["minimaliste", "editorial", "moderne"], siteType: "Galerie d'art contemporain",
    description: "Site de galerie d'art : murs blancs, noir pur, accent rouge, titres grotesques serrés, expositions en cours et à venir, artistes représentés et mur d'œuvres.",
    brand: "Cimaise Claire", tokens: { colors: { primary: "#161616", secondary: "#2e2e2e", accent: "#d92d20", background: "#ffffff", surface: "#f2f2f0", text: "#161616", muted: "#575757" }, fonts: { heading: "font.chivo", body: "font.alegreya", button: "font.chivo", link: "font.chivo" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 800, lineHeight: 1, letterSpacing: -0.035, transform: "none" } }, border: { width: 1, color: "#161616" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "cimaise-claire", motifs: ["plates", "halftone", "tiles"] },
    head: ["head:topbar", { info: "Exposition en cours : « Fragments de lumière » jusqu'au 15 décembre", note: "Entrée libre" }], foot: ["foot:big", { title: "Cimaise Claire" }],
    menu: [["Accueil", "/"], ["Expositions", "/expositions"], ["Artistes", "/artistes"], ["Visite", "/visite"], ["Contact", "/contact"]], cta: ["Préparer sa visite", "/visite"],
    contact: { address: "11 rue des Récollets, 31000 Toulouse", phone: "05 61 00 90 24", email: "galerie@cimaise-claire.example", hours: "Du mardi au samedi, 11 h – 19 h", tagline: "Galerie d'art contemporain : peinture, photographie, sculpture." }, social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Exposition en cours", title: "Fragments de lumière", sub: "Cinq artistes, trente œuvres, une même question : que reste-t-il de ce qu'on éclaire ?", cta: ["Découvrir l'exposition", "/expositions"], cta2: ["Préparer sa visite", "/visite"], stats: [["5", "artistes"], ["30", "œuvres"], ["15 déc.", "dernier jour"]] }],
        ["misc:marquee", { items: ["Entrée libre", "Visites commentées le samedi", "Conseil en acquisition", "Encadrement sur mesure"] }],
        ["gal:wall", { title: "Sur les cimaises", items: [{ t: "Lise Hamon, Sans titre 12" }, { t: "Albane Cros, Trame" }, { t: "Matéo Fort, Veilleuse" }, { t: "Inès Doré, Seuil" }] }],
        ["feat:accordion", { title: "Acquérir une œuvre", bg: "token:surface", items: [{ t: "Comment réserver ?", x: "Contactez la galerie : l'œuvre est mise de côté sept jours." }, { t: "Peut-on payer en plusieurs fois ?", x: "Un échelonnement sur six mois est possible pour les œuvres de plus de 1 500 € (exemple)." }, { t: "Livraison et installation", x: "Emballage de transport et accrochage proposés." }] }],
        ["proof:logos", { title: "Partenaires fictifs", items: ["Fonds Aurélien", "Atelier Verrière", "Association Regards du Sud", "Maison d'Édition Méridienne"] }],
        ["cta:image", { title: "Vernissage le 19 octobre", sub: "Ouvert à tous, en présence des artistes.", cta: ["Voir le programme", "/expositions"] }],
      ] },
      { key: "expositions", name: "Expositions", blocks: [
        ph("Expositions", "En cours et à venir."),
        ["gal:featured", { title: "En ce moment", items: [{ t: "Fragments de lumière", x: "Jusqu'au 15 décembre" }, { t: "Lise Hamon", x: "Peintures" }, { t: "Matéo Fort", x: "Sculptures" }, { t: "Albane Cros", x: "Photographies" }] }],
        ["misc:schedule", { title: "À venir", items: [{ d: "9 janv.", t: "Cartographies intimes", x: "Collectif d'artistes." }, { d: "6 mars", t: "Corps d'argile", x: "Céramique contemporaine." }, { d: "15 mai", t: "Papiers", x: "Dessin et gravure." }] }],
        ["cta:band", { title: "Recevoir les invitations", sub: "Un message par vernissage.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "artistes", name: "Artistes", blocks: [
        ph("Artistes représentés"),
        ["proof:team", { title: "Les artistes", items: [{ n: "Lise Hamon", r: "peinture" }, { n: "Matéo Fort", r: "sculpture" }, { n: "Albane Cros", r: "photographie" }, { n: "Inès Doré", r: "installation" }] }],
        ["feat:rows", { title: "Notre approche", items: [{ t: "Accompagner", x: "Suivre les artistes sur la durée, de l'atelier au musée." }, { t: "Exposer", x: "Quatre expositions par an, avec un livret." }, { t: "Conseiller", x: "Aider les collectionneurs débutants comme confirmés." }] }],
        ["misc:text", { title: "Rejoindre la galerie", paras: ["Nous étudions les dossiers d'artistes au printemps. Envoyez un portfolio de dix images, une note d'intention et un CV court."] }],
      ] },
      { key: "visite", name: "Visite", blocks: [
        ph("Préparer sa visite"),
        ["misc:hours", { title: "Horaires", rows: [["Mardi – vendredi", "11 h – 19 h"], ["Samedi", "10 h – 19 h, visite commentée à 15 h"], ["Dimanche – lundi", "Fermé"]] }],
        ["feat:grid-icons", { title: "Services", items: [{ t: "Visite guidée", x: "Sur réservation pour les groupes.", icon: "users" }, { t: "Accessibilité", x: "Rez-de-chaussée plain-pied.", icon: "heart" }, { t: "Conseil", x: "Un médiateur à votre écoute.", icon: "help" }] }],
        ["cta:card", { title: "Groupes scolaires et associations", sub: "Une visite adaptée, gratuite pour les scolaires.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:map", { title: "La galerie", mapAddress: "11 rue des Récollets, 31000 Toulouse" }],
        ["misc:faq", { items: [{ t: "Peut-on estimer une œuvre ?", x: "Nous orientons vers un expert indépendant, sans engagement." }] }],
      ] },
    ],
  },

  // 9. Designer de produit : vert, league-spartan
  {
    key: "objet-juste", name: "Objet Juste", category: "portfolio", tags: ["moderne", "naturel", "geometrique"], siteType: "Designer de produit indépendant",
    description: "Portfolio de designer produit : fond de maquette, vert végétal, titres compacts, étude de cas détaillée, méthode en étapes et fiche produit de prototype.",
    brand: "Objet Juste", tokens: { colors: { primary: "#2e7d3a", secondary: "#18271c", accent: "#e9a23b", background: "#f1f4ec", surface: "#ffffff", text: "#17221a", muted: "#506055" }, fonts: { heading: "font.league-spartan", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 10, card: 14 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "objet-juste", motifs: ["objects", "botanical", "tiles"] },
    head: ["head:bar", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Réalisations", "/realisations"], ["Méthode", "/methode"], ["Prototype", "/prototype"], ["Contact", "/contact"]], cta: ["Discuter d'un produit", "/contact"],
    contact: { address: "Atelier Pop, 6 impasse des Forges, 42000 Saint-Étienne", phone: "04 77 00 85 13", email: "design@objet-juste.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Design industriel : objets durables, mobilier et petits appareils." }, social: ["linkedin", "instagram", "behance"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Designer produit", title: "Des objets simples, réparables, faits pour durer.", sub: "De l'idée au prototype, puis à l'usine : conception de mobilier, d'accessoires et de petits appareils éco-conçus.", cta: ["Voir les réalisations", "/realisations"], cta2: ["Discuter d'un produit", "/contact"] }],
        ["proof:stats", { title: "En quelques repères (exemples)", items: [["24", "produits sortis"], ["9", "brevets et modèles déposés"], ["12", "fabricants partenaires"]] }],
        ["gal:featured", { title: "Projets choisis", items: [{ t: "Lampe Brindille", x: "Éclairage en frêne, démontable" }, { t: "Tabouret Pivot", x: "Mobilier en tôle pliée" }, { t: "Gourde Loop", x: "Acier recyclé, joint sans colle" }, { t: "Support Cale", x: "Accessoire de bureau" }] }],
        ["feat:steps", { title: "Une méthode en cinq temps", bg: "token:surface", items: [{ t: "Observer", x: "Étudier l'usage réel et ses frictions.", d: "1" }, { t: "Dessiner", x: "Croquis, maquettes en carton, tests.", d: "2" }, { t: "Prototyper", x: "Impression 3D, découpe, assemblage.", d: "3" }, { t: "Industrialiser", x: "Choix des matières et des fournisseurs.", d: "4" }, { t: "Suivre", x: "Pré-série, contrôle, documentation de réparation.", d: "5" }] }],
        ["proof:quotes", { title: "Retours de commande", items: [q("Il a réduit notre pièce de quinze composants à six, sans perdre en robustesse.", "Frédéric Aubier", "directeur d'une PME, client fictif"), q("Un travail précis, des dessins techniques propres.", "Atelier Cornouille", "fabricant fictif")] }],
        ["cta:split", { title: "Un produit à concevoir ou à améliorer ?", sub: "Un atelier de cadrage d'une demi-journée pour clarifier le besoin.", cta: ["Réserver l'atelier", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ph("Réalisations", "Mobilier, éclairage, accessoires."),
        ["gal:cards", { title: "Études de cas", items: [{ t: "Lampe Brindille", x: "Un éclairage en frêne sans colle ni vis apparente", tag: "Éclairage" }, { t: "Tabouret Pivot", x: "Une assise en une seule tôle pliée", tag: "Mobilier" }, { t: "Gourde Loop", x: "Un bouchon réparable, des pièces disponibles", tag: "Accessoire" }] }],
        ["feat:alt", { title: "Zoom sur un projet", items: [{ t: "Brindille, la lampe qui se démonte", x: "Trois pièces en frêne et un module LED remplaçable : le client peut changer chaque élément sans outil spécial.", link: ["Voir la fiche prototype", "/prototype"] }, { t: "Pivot, un tabouret en tôle", x: "Une feuille d'acier découpée et pliée, thermolaquée en série limitée." }] }],
        ["cta:band", { title: "Vous avez un cahier des charges ?", sub: "Envoyez-le, je réponds avec un premier avis.", cta: ["Envoyer", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ph("Méthode et éco-conception"),
        ["misc:text", { eyebrow: "Principes", title: "Concevoir pour réparer", paras: ["Chaque produit est pensé pour être démonté avec un tournevis, documenté et réparé. Nous limitons le nombre de matières et privilégions les fournisseurs situés à moins de 500 km.", "L'analyse du cycle de vie est simplifiée et partagée avec vos équipes."] }],
        ["feat:list2", { title: "Livrables", items: [{ t: "Dossier de conception" }, { t: "Plans techniques" }, { t: "Prototype fonctionnel" }, { t: "Notice de réparation" }, { t: "Cahier des charges fournisseurs" }, { t: "Suivi de pré-série" }] }],
        ["misc:faq", { items: [{ t: "Travaillez-vous avec des start-ups ?", x: "Oui, avec un forfait d'accompagnement par étapes." }, { t: "Fabriquez-vous vous-même ?", x: "Les prototypes sont faits en atelier, la série chez nos partenaires." }] }],
      ] },
      { key: "prototype", name: "Prototype", blocks: [
        ph("Fiche prototype", "Le produit est un prototype : pas de vente en ligne."),
        ["misc:product", { eyebrow: "Éclairage", title: "Lampe Brindille", price: "Prototype", text: "Une lampe de bureau en frêne massif, démontable en trois pièces, avec un module LED remplaçable et un câble textile.", points: ["Frêne massif huilé", "Module LED 8 W remplaçable", "Démontage sans outil spécial", "Notice de réparation fournie"], cta: "Demander une présérie", url: "/contact", note: "Fiche de démonstration, sans paiement en ligne." }],
        ["feat:cards", { title: "Caractéristiques", items: [{ t: "Matières", x: "Frêne et acier recyclé.", icon: "layers" }, { t: "Énergie", x: "Faible consommation.", icon: "zap" }, { t: "Réparabilité", x: "Pièces disponibles.", icon: "settings" }] }],
        ["cta:card", { title: "Intéressé par une présérie ?", sub: "Nous prenons des commandes de test par petits lots.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Discutons de votre produit", formTitle: "Votre besoin", formIntro: "Type de produit, quantités visées, calendrier.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Visite d'atelier", "Sur rendez-vous"]] }],
      ] },
    ],
  },

  // 10. Céramiste : bleu céladon, zilla-slab
  {
    key: "glaise-celadon", name: "Glaise & Céladon", category: "portfolio", tags: ["chaleureux", "naturel", "ludique"], siteType: "Céramiste et atelier de poterie",
    description: "Site de céramiste : lin clair, bleu céladon profond, titres à empattement épais, pièces uniques, journées d'atelier ouvert, stages de tournage et horaires.",
    brand: "Glaise & Céladon", tokens: { colors: { primary: "#2f6485", secondary: "#2a3640", accent: "#d08a5b", background: "#f5f1ea", surface: "#fffcf6", text: "#222a30", muted: "#55616a" }, fonts: { heading: "font.zilla-slab", body: "font.montserrat", button: "font.montserrat", link: "font.montserrat" }, radius: { sm: 6, md: 12, lg: 20, button: 14, field: 10, card: 16 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "glaise-celadon", motifs: ["objects", "arches", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Poteries de grès tournées et émaillées à la main, en petites séries.", cols: [["Atelier", "/pieces", "/stages"], ["Infos", "/visites", "/contact"]] }],
    menu: [["Accueil", "/"], ["Pièces", "/pieces"], ["Stages", "/stages"], ["Visites", "/visites"], ["Contact", "/contact"]], cta: ["S'inscrire à un stage", "/stages"],
    contact: { address: "Atelier de la Tuilerie, 3 chemin des Argiles, 56130 La Roche-Bernard", phone: "02 99 00 68 47", email: "atelier@glaise-celadon.example", hours: "Atelier ouvert du jeudi au samedi, 14 h – 18 h", tagline: "Grès tourné, émaux maison, stages de poterie." }, social: ["instagram", "facebook", "pinterest"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Céramiste", title: "Des bols qui gardent la forme des mains.", sub: "Vaisselle et pièces uniques en grès, tournées puis émaillées de nos bleus céladon, dans un atelier ouvert au public.", cta: ["Voir les pièces", "/pieces"], cta2: ["Venir à l'atelier", "/visites"] }],
        ["gal:cards", { title: "Sorties de four", items: [{ t: "Bol Marée", x: "Grès, émail céladon", tag: "Série" }, { t: "Vase Dune", x: "Pièce unique, 32 cm", tag: "Unique" }, { t: "Assiettes Sillon", x: "Lot de quatre", tag: "Série" }] }],
        ["feat:icons", { eyebrow: "Faire à la main", title: "Un savoir-faire en trois gestes", bg: "token:surface", items: [{ t: "Tourner", x: "La terre est centrée et montée sur le tour, pièce après pièce.", icon: "settings" }, { t: "Émailler", x: "Des émaux composés à l'atelier, cuits à 1 250 degrés.", icon: "palette" }, { t: "Transmettre", x: "Des stages pour apprendre, six élèves maximum.", icon: "users" }] }],
        ["proof:quotes", { title: "Mots de clients", items: [q("Mes bols du matin ont un poids et un grain qu'aucun service industriel n'a.", "Sylvie Ferrand", "cliente fictive"), q("Un stage joyeux, patient et salissant comme il faut.", "Antoine Leclerc", "stagiaire fictif")] }],
        ["misc:hours", { title: "L'atelier est ouvert", rows: [["Jeudi", "14 h – 18 h"], ["Vendredi", "14 h – 18 h"], ["Samedi", "10 h – 13 h et 14 h – 18 h"]] }],
        ["cta:image", { title: "Un après-midi pour toucher la terre ?", sub: "Stage découverte de trois heures, tout compris.", cta: ["Voir les stages", "/stages"] }],
      ] },
      { key: "pieces", name: "Pièces", blocks: [
        ph("Pièces et séries", "Les pièces ne sont pas vendues en ligne : venez à l'atelier ou écrivez-nous."),
        ["gal:masonry", { title: "Collection actuelle", items: [{ t: "Bol Marée" }, { t: "Vase Dune" }, { t: "Tasse Écume" }, { t: "Plat Sillon" }, { t: "Théière Brume" }, { t: "Lot d'assiettes" }] }],
        ["feat:pricelist", { title: "Repères de prix (exemples)", items: [{ t: "Tasse", x: "Grès émaillé, 25 cl", price: "28 €" }, { t: "Bol", x: "Grès émaillé, 50 cl", price: "36 €" }, { t: "Assiette", x: "Diamètre 22 cm", price: "42 €" }, { t: "Vase unique", x: "Pièce numérotée", price: "de 120 à 280 €" }] }],
        ["cta:band", { title: "Une commande pour votre restaurant ?", sub: "Séries personnalisées pour la table, minimum 24 pièces.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "stages", name: "Stages", blocks: [
        ph("Stages de poterie", "Pour débutants et passionnés."),
        ["price:tiers", { items: [{ t: "Découverte", price: "55 €", x: "3 heures", f: ["Tournage d'un bol", "Cuisson et émaillage inclus", "Récupération sous trois semaines"], cta: "Réserver", url: "/contact" }, { t: "Week-end", price: "190 €", x: "2 jours", f: ["Quatre pièces", "Tablier prêté", "Déjeuner partagé"], cta: "Réserver", url: "/contact", hl: true }, { t: "Cycle de 8 séances", price: "340 €", x: "Un soir par semaine", f: ["Technique progressive", "Cuissons incluses"], cta: "Réserver", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il apporter quelque chose ?", x: "Seulement des vêtements qui peuvent se salir, le reste est fourni." }, { t: "Les enfants sont-ils acceptés ?", x: "Dès 8 ans, accompagnés d'un adulte, sur les séances dédiées." }] }],
        ["cta:card", { title: "Offrir un stage", sub: "Bon cadeau valable un an.", cta: ["Demander un bon", "/contact"] }],
      ] },
      { key: "visites", name: "Visites", blocks: [
        ph("Visites et journées ouvertes"),
        ["misc:schedule", { title: "Dates à venir", items: [{ d: "11 oct.", t: "Ouverture de four", x: "Pièces fraîchement cuites, entrée libre." }, { d: "6 déc.", t: "Marché de Noël de l'atelier", x: "Dix céramistes invités." }, { d: "21 mars", t: "Journées européennes des métiers d'art", x: "Démonstrations de tournage." }] }],
        ["misc:story", { eyebrow: "Le lieu", title: "Une ancienne tuilerie", paras: ["L'atelier occupe une tuilerie du village, avec un four à gaz de 200 litres et un petit four électrique pour les essais d'émaux.", "On y vient pour acheter, regarder, ou rester une heure de plus que prévu."], image: "portrait-4" }],
        ["feat:numbered", { title: "Chiffres de l'atelier (exemples)", items: [{ t: "6", x: "stagiaires maximum" }, { t: "1 250 °", x: "température de cuisson" }, { t: "9", x: "émaux maison" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:map", { title: "Nous trouver", mapAddress: "3 chemin des Argiles, 56130 La Roche-Bernard" }],
        ["misc:faq", { items: [{ t: "Expédiez-vous les pièces ?", x: "Oui, sur demande, avec emballage renforcé et frais indiqués au devis." }] }],
      ] },
    ],
  },

  // 11. Architecte d'intérieur : prune, tenor-sans
  {
    key: "trace-prune", name: "Trace & Prune", category: "portfolio", tags: ["luxe", "editorial", "minimaliste"], siteType: "Architecte d'intérieur indépendante",
    description: "Portfolio d'architecte d'intérieur : image de gauche en portrait, prune profond et beige rosé, titres Tenor élégants, réalisations avant-après, méthode et honoraires.",
    brand: "Trace & Prune", tokens: { colors: { primary: "#843d73", secondary: "#2d1a29", accent: "#c79a6b", background: "#f8f2f0", surface: "#ffffff", text: "#2a1b27", muted: "#6a5465" }, fonts: { heading: "font.tenor-sans", body: "font.plus-jakarta-sans", button: "font.plus-jakarta-sans", link: "font.plus-jakarta-sans" }, radius: { sm: 2, md: 6, lg: 10, button: 2, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 52, weight: 400, lineHeight: 1.1, letterSpacing: 0, transform: "none" } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "trace-prune", motifs: ["arches", "plates", "topo"] },
    head: ["head:center", {}], foot: ["foot:newsletter", { title: "Carnet d'inspirations", sub: "Matières, couleurs et plans : une lettre par mois, sans publicité.", button: "Recevoir le carnet" }],
    menu: [["Accueil", "/"], ["Réalisations", "/realisations"], ["Méthode", "/methode"], ["Honoraires", "/honoraires"], ["Contact", "/contact"]], cta: ["Demander un rendez-vous", "/contact"],
    contact: { address: "Cabinet, 18 rue des Teinturiers, 67000 Strasbourg", phone: "03 88 00 47 29", email: "cabinet@trace-prune.example", hours: "Du lundi au vendredi, 9 h – 18 h, rendez-vous en agence ou sur site", tagline: "Architecture intérieure : appartements, maisons, commerces." }, social: ["instagram", "pinterest", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Architecte d'intérieur", title: "Des intérieurs qui ressemblent à ceux qui y vivent.", sub: "Rénovations d'appartements, maisons de famille et petits commerces : plans, matériaux, mobilier sur mesure et suivi de chantier.", cta: ["Voir les réalisations", "/realisations"], cta2: ["Demander un rendez-vous", "/contact"] }],
        ["feat:alt", { eyebrow: "Savoir-faire", title: "De l'esquisse à la clé", items: [{ t: "Concept et plans", x: "Relevé, esquisses, plans cotés et planches de matières pour décider en confiance.", link: ["La méthode", "/methode"] }, { t: "Suivi de chantier", x: "Choix des artisans, planning, visites hebdomadaires et réception des travaux." }, { t: "Mobilier sur mesure", x: "Dressings, bibliothèques et cuisines dessinés pour votre pièce." }] }],
        ["gal:listings", { title: "Chantiers récents", items: [{ t: "Appartement haussmannien", x: "92 m², Strasbourg", tag: "Rénovation", price: "6 mois" }, { t: "Maison de famille", x: "140 m², Colmar", tag: "Extension", price: "9 mois" }, { t: "Boutique de créateurs", x: "55 m², centre-ville", tag: "Commerce", price: "3 mois" }] }],
        ["proof:stats", { title: "Quelques chiffres (exemples)", items: [["80", "chantiers suivis"], ["12", "ans de métier"], ["96 %", "de projets livrés dans le budget annoncé"]] }],
        ["proof:big", { items: [q("Elle a compris dès la première visite comment nous vivions, et le résultat nous ressemble.", "Camille et Yann Berger", "clients fictifs")] }],
        ["cta:card", { title: "Un premier rendez-vous sur site", sub: "Une heure pour parler budget, usages et calendrier, offerte pour tout projet de plus de 40 m².", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ph("Réalisations", "Avant, pendant, après."),
        ["gal:featured", { title: "À la une", items: [{ t: "Appartement haussmannien", x: "Parquet restauré, cuisine ouverte" }, { t: "Maison de famille", x: "Extension vitrée" }, { t: "Boutique de créateurs", x: "Étagères sur mesure" }, { t: "Studio d'étudiant", x: "Lit mezzanine" }] }],
        ["feat:rows", { title: "Pièces par pièces", items: [{ t: "Cuisines", x: "Plans de travail en pierre, agencements ouverts sur le séjour." }, { t: "Salles de bains", x: "Carreaux faits main et douches de plain-pied." }, { t: "Chambres", x: "Têtes de lit, dressings, luminaires." }] }],
        ["cta:split", { title: "Un projet comparable ?", sub: "Racontez-moi votre pièce et ce qui ne vous convient plus.", cta: ["Écrire", "/contact"], cta2: ["Voir les honoraires", "/honoraires"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ph("Méthode"),
        ["feat:steps", { title: "Un projet en six temps", items: [{ t: "Visite et relevé", x: "Mesures, photos, écoute.", d: "Semaine 1" }, { t: "Esquisses", x: "Deux scénarios d'aménagement.", d: "Semaines 2-3" }, { t: "Plans et matières", x: "Plans, planches, devis estimatifs.", d: "Semaines 4-6" }, { t: "Consultation", x: "Comparatif des artisans.", d: "Semaines 7-8" }, { t: "Chantier", x: "Suivi hebdomadaire.", d: "Mois 3 à 8" }, { t: "Réception", x: "Livraison, lever des réserves.", d: "Final" }] }],
        ["misc:story", { eyebrow: "L'architecte", title: "Une approche sobre et chaleureuse", paras: ["Formée en architecture puis en design d'espace, je travaille toujours avec les mêmes artisans, ce qui rassure et accélère les chantiers.", "Mon principe : une couleur franche par pièce, des matières naturelles et des rangements qui disparaissent."], image: "portrait-2" }],
        ["feat:list2", { title: "Ce qui est inclus", items: [{ t: "Plans cotés" }, { t: "Planches de matières" }, { t: "Liste d'achats" }, { t: "Visites de chantier" }, { t: "Réunions de coordination" }, { t: "Dossier des ouvrages" }] }],
      ] },
      { key: "honoraires", name: "Honoraires", blocks: [
        ph("Honoraires", "Transparents, annoncés dès le premier rendez-vous (exemples)."),
        ["price:tiers", { items: [{ t: "Conseil", price: "480 €", x: "Une demi-journée", f: ["Visite sur site", "Compte rendu illustré"], cta: "Réserver", url: "/contact" }, { t: "Concept", price: "dès 2 400 €", x: "Plans et matières", f: ["Esquisses", "Plans cotés", "Planches de matières"], cta: "Demander", url: "/contact", hl: true }, { t: "Mission complète", price: "10 % du budget", x: "Du concept à la réception", f: ["Suivi de chantier", "Coordination des artisans"], cta: "Demander", url: "/contact" }] }],
        ["feat:compare", { title: "Quelle mission choisir ?", rows: [["", "Concept", "Mission complète"], ["Plans et matières", "oui", "oui"], ["Suivi de chantier", "non", "oui"], ["Choix des artisans", "conseil", "pilotage"]] }],
        ["misc:faq", { items: [{ t: "Les devis des artisans sont-ils inclus ?", x: "Ils sont à votre charge, mais nous les comparons ensemble." }, { t: "Intervenez-vous hors de la région ?", x: "Oui, avec des frais de déplacement précisés au devis." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Parlons de votre intérieur", formTitle: "Votre projet", formIntro: "Surface, ville, budget indicatif et envies.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires du cabinet", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Samedi", "Visites sur site"]] }],
      ] },
    ],
  },
];
