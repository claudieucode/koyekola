// Association (lot v2, 14 thèmes). Textes de DÉMONSTRATION : associations, personnes, chiffres et coordonnées fictifs. Aucun paiement simulé : les boutons de don renvoient vers /contact.
const PH = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const CONTACT = (title, formTitle, cta) => ["contact:info", { title, formTitle, formIntro: "Nous répondons sous quelques jours ouvrés.", cta: [cta, "/contact"] }];
const R = (a, b, c, d, e, f, g, h) => ({ sm: a, md: b, lg: c, button: d, field: e, card: f });

module.exports = [
  // 1. ONG humanitaire
  {
    key: "balise-secours", name: "Balise", category: "association", tags: ["moderne", "chaleureux"], siteType: "ONG humanitaire",
    description: "ONG humanitaire en bleu océan et ambre, titres en slab serif robustes, bandeau d'information, chiffres d'impact sur bande pleine et appels au don sobres.",
    brand: "Balise Solidarité Internationale",
    tokens: { colors: { primary: "#1565a8", secondary: "#0d2f4f", accent: "#f2a33a", background: "#f4f8fc", surface: "#ffffff", text: "#12263a", muted: "#4a5e72" }, fonts: { heading: "font.zilla-slab", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: R(4, 6, 10, 6, 6, 8), shadow: { card: "sm", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "balise-secours", motifs: ["waves", "topo", "rays"] },
    head: ["head:topbar", { info: "Urgence humanitaire : nos équipes sont mobilisées", note: "Dons et bénévolat : contactez-nous" }],
    foot: ["foot:columns", { about: "Association de solidarité internationale : aide d'urgence, accès à l'eau et appui aux familles déplacées. Site de démonstration.", cols: [["Agir", "Nos actions", "Devenir bénévole", "Faire un don"], ["L'association", "Rapport d'activité", "Actualités", "Contact"]] }],
    menu: [["Accueil", "/"], ["Nos actions", "/actions"], ["Où nous agissons", "/terrains"], ["Agir avec nous", "/agir"], ["Actualités", "/actualites"]], cta: ["Faire un don", "/contact"],
    contact: { address: "8 quai des Chargeurs, 33000 Bordeaux", phone: "05 56 00 21 40", email: "contact@balise-solidarite.example", hours: "Du lundi au vendredi, 9 h – 17 h 30", tagline: "Aider vite, aider durablement." },
    social: ["facebook", "instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Solidarité internationale", title: "Quand tout s'effondre, nous arrivons les premiers.", sub: "Balise envoie de l'eau potable, des abris et du soutien médical aux familles frappées par les crises, puis reste pour reconstruire.", cta: ["Faire un don", "/contact"], cta2: ["Nos actions", "/actions"] }],
        ["feat:cards", { eyebrow: "Nos missions", title: "Trois façons d'aider sur le terrain", items: [{ t: "Urgence", x: "Kits d'eau, de couchage et d'hygiène livrés dans les 72 heures.", icon: "zap" }, { t: "Eau et assainissement", x: "Puits, citernes et latrines gérés avec les comités de village.", icon: "globe" }, { t: "Reconstruction", x: "Écoles, abris et moyens de subsistance rebâtis avec les habitants.", icon: "home" }] }],
        ["proof:statsbar", { items: [["14", "pays d'intervention (exemple)"], ["62 000", "personnes aidées en un an"], ["86 %", "des moyens consacrés aux missions"]] }],
        ["feat:alt", { title: "Sur le terrain, en ce moment", items: [{ t: "Après les inondations", x: "Distribution de purificateurs d'eau et réparation de deux dispensaires.", link: ["Voir l'action", "/actions"] }, { t: "Accueil des familles déplacées", x: "Abris collectifs, repas chauds et suivi médical des enfants.", link: ["En savoir plus", "/terrains"] }] }],
        ["proof:quotes", { title: "Ils nous soutiennent", items: [{ q: "On sait où va chaque euro, les comptes sont expliqués simplement.", n: "Camille R.", r: "Donatrice, cliente fictive" }, { q: "Ma première mission de bénévole m'a changé la vie.", n: "Samir K.", r: "Bénévole, client fictif" }] }],
        ["cta:band", { title: "Chaque geste compte", sub: "Un don, du temps ou une compétence : écrivez-nous et nous vous répondons.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "actions", name: "Nos actions", blocks: [
        PH("Nos actions", "De l'urgence à la reconstruction."),
        ["feat:strips", { title: "Programmes en cours", items: [{ t: "Eau potable", x: "Forages et citernes, formation de techniciens locaux." }, { t: "Abris d'urgence", x: "Tentes, bâches et kits de réparation après les catastrophes." }, { t: "Santé de la mère et de l'enfant", x: "Cliniques mobiles et dépistage de la malnutrition." }, { t: "Éducation", x: "Classes provisoires et fournitures scolaires." }] }],
        ["feat:steps", { title: "Comment nous intervenons", items: [{ t: "Évaluation", x: "Une équipe mesure les besoins avec les autorités locales.", d: "Jour 1" }, { t: "Premiers secours", x: "Eau, vivres et soins distribués aux plus fragiles.", d: "Jours 2 à 7" }, { t: "Stabilisation", x: "Abris et services de base installés durablement.", d: "Mois 1 à 6" }, { t: "Transmission", x: "Les comités locaux reprennent la gestion.", d: "Après 1 an" }] }],
        ["cta:card", { title: "Soutenir une action", sub: "Le don en ligne n'est pas simulé sur ce site : écrivez-nous pour recevoir les modalités.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "terrains", name: "Où nous agissons", blocks: [
        PH("Où nous agissons"),
        ["gal:cards", { title: "Nos terrains d'intervention", items: [{ t: "Corne de l'Afrique", tag: "Sécheresse", x: "Distribution d'eau et soutien aux éleveurs." }, { t: "Bassin du Sahel", tag: "Eau", x: "Puits villageois et formation à l'entretien." }, { t: "Asie du Sud", tag: "Inondations", x: "Abris surélevés et réserves de vivres." }] }],
        ["proof:stats", { title: "Chiffres de l'année (exemples)", items: [["210", "puits remis en service"], ["38 000", "kits d'hygiène"], ["120", "bénévoles mobilisés"]] }],
        ["misc:text", { eyebrow: "Notre éthique", title: "Neutralité et transparence", paras: ["Nous intervenons sans distinction de religion, d'origine ou d'opinion, là où les besoins sont les plus grands.", "Les comptes et le rapport d'activité sont publiés chaque année dans la rubrique actualités."] }],
      ] },
      { key: "agir", name: "Agir avec nous", blocks: [
        PH("Agir avec nous", "Il y a mille façons de contribuer."),
        ["feat:checks", { title: "Ce que vous pouvez faire", intro: "Chaque forme d'aide est utile.", items: [{ t: "Faire un don ponctuel ou régulier", x: "Demandez les modalités par message." }, { t: "Devenir bénévole local", x: "Collecte, tri et événements." }, { t: "Partir en mission", x: "Profils techniques : logistique, eau, santé." }, { t: "Mobiliser votre entreprise", x: "Mécénat de compétences." }], cta: ["Nous contacter", "/contact"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Mon don est-il déductible ?", x: "Les associations d'intérêt général délivrent un reçu fiscal ; demandez-le à l'équipe." }, { t: "Puis-je choisir l'action soutenue ?", x: "Oui, vous pouvez orienter votre soutien vers un programme." }] }],
        CONTACT("Parlons de votre soutien", "Écrire à l'équipe", "Envoyer"),
      ] },
      { key: "actualites", name: "Actualités", blocks: [
        PH("Actualités"),
        ["misc:posts", { title: "Dernières nouvelles", count: 6, layout: "grid" }],
        ["cta:band", { title: "Recevoir nos nouvelles", cta: ["Nous contacter", "/contact"] }],
      ] },
    ],
  },
  // 2. Protection de l'environnement
  {
    key: "lisiere-verte", name: "Lisière", category: "association", tags: ["naturel", "editorial"], siteType: "Association de protection de l'environnement",
    description: "Association environnementale en vert forêt et mousse, serif éditorial lisible, photos plein cadre, calendrier de sorties nature et campagnes de sensibilisation.",
    brand: "Lisière, nature et vallées",
    tokens: { colors: { primary: "#2e7d32", secondary: "#1b3d1f", accent: "#e0b341", background: "#f5f8f1", surface: "#ffffff", text: "#1d2b1e", muted: "#4b5d4c" }, fonts: { heading: "font.literata", body: "font.outfit", button: "font.outfit", link: "font.outfit" }, radius: R(6, 10, 16, 999, 10, 14), shadow: { card: "none", button: "none" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "pill" }, art: { seed: "lisiere-verte", motifs: ["botanical", "mountains", "dunes"] },
    head: ["head:float", {}],
    foot: ["foot:newsletter", { title: "Les nouvelles de la vallée", sub: "Une lettre par mois : sorties, campagnes et chantiers nature.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Nos combats", "/combats"], ["Sorties nature", "/sorties"], ["Rejoindre", "/rejoindre"], ["Contact", "/contact"]], cta: ["Adhérer", "/rejoindre"],
    contact: { address: "3 chemin du Moulin, 38700 La Tronche", phone: "04 76 00 55 18", email: "bonjour@lisiere-verte.example", hours: "Permanence le mercredi, 14 h – 18 h", tagline: "Défendre le vivant près de chez nous." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Association loi 1901", title: "Protégeons les haies, les rivières et ceux qui y vivent.", sub: "Depuis quinze ans, nos bénévoles replantent, comptent les oiseaux et défendent les milieux naturels de la vallée.", cta: ["Adhérer", "/rejoindre"], cta2: ["Sorties nature", "/sorties"] }],
        ["feat:bento", { eyebrow: "Nos chantiers", title: "Agir pour le vivant", items: [{ t: "Replanter des haies", x: "Plus de 6 km plantés avec les agriculteurs de la vallée (exemple).", icon: "sun" }, { t: "Rivières propres", x: "Collectes et suivi de la qualité de l'eau.", icon: "globe" }, { t: "Comptages d'oiseaux", x: "Science participative ouverte à tous.", icon: "eye" }] }],
        ["proof:stats", { title: "L'association en chiffres (exemples)", items: [["420", "adhérents"], ["6 km", "de haies plantées"], ["38", "sorties par an"]] }],
        ["gal:featured", { title: "Instants de nature", items: [{ t: "La mare retrouvée" }, { t: "Chantier de plantation" }, { t: "Sortie crépusculaire" }, { t: "Atelier nichoirs" }] }],
        ["feat:steps", { title: "Rejoindre l'aventure", items: [{ t: "Venez à une sortie", x: "Gratuite et ouverte à tous.", d: "1" }, { t: "Adhérez", x: "Cotisation libre, à partir de 10 euros (exemple).", d: "2" }, { t: "Choisissez un groupe", x: "Haies, rivières, oiseaux ou plaidoyer.", d: "3" }] }],
        ["cta:split", { title: "Une idée, un site à défendre ?", sub: "Signalez-nous une décharge sauvage ou un projet qui menace un milieu.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "combats", name: "Nos combats", blocks: [
        PH("Nos combats", "Ce que nous défendons dans la vallée."),
        ["feat:rows", { title: "Dossiers suivis", items: [{ t: "Zone humide des Iles", x: "Opposition à un projet de remblai, inventaire des espèces protégées." }, { t: "Pesticides et riverains", x: "Charte de bon voisinage avec les exploitations." }, { t: "Trame noire", x: "Réduire l'éclairage nocturne pour les chauves-souris." }] }],
        ["misc:quote", { text: "Une haie coupée en une heure met vingt ans à repousser.", by: "Un bénévole de l'association" }],
        ["cta:band", { title: "Soutenez un dossier", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "sorties", name: "Sorties nature", blocks: [
        PH("Sorties nature", "Gratuites, accessibles, encadrées par des bénévoles."),
        ["misc:schedule", { title: "Prochaines sorties", items: [{ d: "Sam. 9 h", t: "Chant des oiseaux", x: "Rendez-vous au pont, jumelles prêtes." }, { d: "Dim. 14 h", t: "Plantation de haie", x: "Outils fournis, goûter offert." }, { d: "Sam. 20 h", t: "Soirée chauves-souris", x: "Écoute aux détecteurs, durée 2 h." }] }],
        ["feat:list2", { title: "Bon à savoir", items: [{ t: "Chaussures fermées" }, { t: "Inscription par e-mail" }, { t: "Enfants bienvenus" }, { t: "Annulation en cas d'orage" }] }],
      ] },
      { key: "rejoindre", name: "Rejoindre", blocks: [
        PH("Rejoindre Lisière"),
        ["price:tiers", { items: [{ t: "Adhésion individuelle", price: "15 €", period: "an", x: "Exemple de cotisation", f: ["Lettre mensuelle", "Sorties illimitées", "Vote à l'assemblée"], cta: ["Demander", "/contact"] }, { t: "Adhésion famille", price: "25 €", period: "an", f: ["Tout l'individuel", "Pour toute la famille", "Atelier enfants"], cta: ["Demander", "/contact"], hl: true }, { t: "Soutien", price: "60 €", period: "an", f: ["Tout l'individuel", "Reçu fiscal", "Mention des mécènes"], cta: ["Demander", "/contact"] }] }],
        CONTACT("Une question avant d'adhérer ?", "Écrire à l'équipe", "Envoyer"),
      ] },
    ],
  },
  // 3. Association sportive de quartier (sombre)
  {
    key: "derby-faubourg", name: "Derby Faubourg", category: "association", tags: ["sombre", "audacieux"], siteType: "Association sportive de quartier",
    description: "Club omnisports de quartier en thème sombre, orange vif sur anthracite, titres condensés en capitales, affiche d'ouverture et planning des entraînements.",
    brand: "AS Faubourg Nord",
    tokens: { colors: { primary: "#ff6a1a", secondary: "#22252b", accent: "#ffd23f", background: "#121418", surface: "#1c1f26", text: "#f2f2ef", muted: "#b4b8c0" }, fonts: { heading: "font.anton", body: "font.barlow", button: "font.barlow", link: "font.barlow" }, radius: R(0, 2, 4, 2, 2, 2), shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.0, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 38, weight: 400, lineHeight: 1.05, letterSpacing: 0.02, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "derby-faubourg", motifs: ["halftone", "rays", "tiles"] },
    head: ["head:dark", {}],
    foot: ["foot:big", { title: "AS FAUBOURG NORD" }],
    menu: [["Accueil", "/"], ["Sections", "/sections"], ["Planning", "/planning"], ["Inscriptions", "/inscriptions"], ["Contact", "/contact"]], cta: ["S'inscrire", "/inscriptions"],
    contact: { address: "Stade Léo-Lagrange, rue des Frênes, 59000 Lille", phone: "03 20 00 77 31", email: "club@as-faubourg.example", hours: "Permanence au stade : mercredi et samedi, 14 h – 19 h", tagline: "Le sport pour tout le quartier." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Saison 2026-2027", title: "Ici, on joue ensemble.", sub: "Football, basket, boxe éducative et courses du dimanche : 14 équipes, 380 licenciés, un quartier qui supporte.", cta: ["S'inscrire", "/inscriptions"], cta2: ["Le planning", "/planning"] }],
        ["feat:strips", { title: "Nos sections", items: [{ t: "Football", x: "De l'école de foot aux vétérans." }, { t: "Basket", x: "Équipes mixtes à partir de 7 ans." }, { t: "Boxe éducative", x: "Découverte sans contact dès 9 ans." }, { t: "Course à pied", x: "Rendez-vous du dimanche matin." }] }],
        ["proof:big", { items: [{ q: "Mon fils a trouvé une deuxième famille au club, et moi des amis au bord du terrain.", n: "Karim B.", r: "Parent, client fictif" }] }],
        ["gal:wall", { title: "Dans les vestiaires et sur le terrain", items: [{ t: "Tournoi des voisins" }, { t: "École de foot" }, { t: "Finale départementale" }, { t: "Fête du club" }] }],
        ["feat:pricelist", { title: "Cotisations (exemples)", items: [{ t: "Enfant jusqu'à 12 ans", x: "Licence et équipement inclus", price: "95 €" }, { t: "Adolescent 13-17 ans", x: "Licence et maillot", price: "120 €" }, { t: "Adulte", x: "Licence", price: "140 €" }] }],
        ["cta:card", { title: "Premier entraînement offert", sub: "Venez essayer, un éducateur vous accueille.", cta: ["S'inscrire", "/inscriptions"] }],
      ] },
      { key: "sections", name: "Sections", blocks: [
        PH("Sections", "Une discipline pour chaque envie."),
        ["feat:tabs", { title: "Choisissez votre sport", items: [{ t: "Football", x: "Équipes U7 à vétérans, entraînements sur synthétique." }, { t: "Basket", x: "Équipes mixtes jusqu'à 15 ans, loisirs adultes le jeudi." }, { t: "Boxe éducative", x: "Gestes techniques, respect et maîtrise de soi." }] }],
        ["proof:team", { title: "Les éducateurs", items: [{ n: "Yanis Delorme", r: "Football, U11-U15" }, { n: "Awa Konaté", r: "Basket" }, { n: "Marc Pelletier", r: "Boxe éducative" }] }],
        ["cta:band", { title: "Un doute sur la section ?", cta: ["Nous poser la question", "/contact"] }],
      ] },
      { key: "planning", name: "Planning", blocks: [
        PH("Planning des entraînements"),
        ["misc:hours", { title: "Semaine type", rows: [["Lundi", "Basket 17 h 30 – 19 h"], ["Mardi", "Football U9-U13, 17 h – 18 h 30"], ["Mercredi", "École de foot, 14 h – 16 h"], ["Jeudi", "Basket loisir, 19 h – 21 h"], ["Samedi", "Matchs, dès 10 h"], ["Dimanche", "Course à pied, 9 h 30"]] }],
        ["misc:text", { title: "Matchs et déplacements", paras: ["Les convocations sont envoyées le jeudi soir par message. Le covoiturage est organisé par les parents bénévoles."] }],
      ] },
      { key: "inscriptions", name: "Inscriptions", blocks: [
        PH("Inscriptions"),
        ["feat:steps", { title: "En trois étapes", items: [{ t: "Séance d'essai", x: "Offerte, sur n'importe quelle section.", d: "1" }, { t: "Dossier", x: "Certificat médical et photo d'identité.", d: "2" }, { t: "Licence", x: "Remise des équipements.", d: "3" }] }],
        CONTACT("Contacter le secrétariat", "Demande d'inscription", "Envoyer ma demande"),
      ] },
    ],
  },
  // 4. Banque alimentaire
  {
    key: "grenier-partage", name: "Grenier Commun", category: "association", tags: ["chaleureux", "moderne"], siteType: "Banque alimentaire",
    description: "Banque alimentaire en ocre doré sur crème, titres slab très gras, chiffres de distribution, calendrier de collectes et guide pour bénévoles et donateurs de denrées.",
    brand: "Banque alimentaire du Grenier Commun",
    tokens: { colors: { primary: "#a36a00", secondary: "#3b2a07", accent: "#2f7a4d", background: "#fbf6ea", surface: "#ffffff", text: "#2c2210", muted: "#5d5035" }, fonts: { heading: "font.alfa-slab-one", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: R(4, 8, 14, 8, 8, 12), shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "center", shape: "soft" }, art: { seed: "grenier-partage", motifs: ["objects", "plates", "blobs"] },
    head: ["head:center", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Recevoir de l'aide", "/aide"], ["Donner", "/donner"], ["Bénévolat", "/benevolat"], ["Collectes", "/collectes"]], cta: ["Donner des denrées", "/donner"],
    contact: { address: "Entrepôt 4, zone des Ormes, 45000 Orléans", phone: "02 38 00 66 20", email: "accueil@grenier-commun.example", hours: "Distributions : mardi et vendredi, 14 h – 17 h", tagline: "Personne ne devrait avoir faim." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Aide alimentaire", title: "Chaque semaine, un repas pour 1 800 personnes.", sub: "Nous récupérons les surplus des commerces et des producteurs pour les redistribuer, avec dignité, via 24 associations partenaires.", cta: ["Donner des denrées", "/donner"], cta2: ["Recevoir de l'aide", "/aide"], stats: [["210 t", "de denrées par an (exemple)"], ["24", "associations relais"], ["95", "bénévoles"]] }],
        ["feat:numbered", { title: "Du surplus à l'assiette", items: [{ t: "Collecter", x: "Magasins, producteurs et collectes citoyennes." }, { t: "Trier", x: "Contrôle de fraîcheur et de dates, en entrepôt." }, { t: "Distribuer", x: "Colis et épicerie solidaire dans les quartiers." }] }],
        ["feat:checks", { title: "Nous avons le plus besoin de", intro: "Les produits qui manquent le plus à nos rayons.", items: [{ t: "Huile, farine, sucre" }, { t: "Conserves de légumes et de poisson" }, { t: "Produits pour bébé" }, { t: "Produits d'hygiène" }], cta: ["Organiser une collecte", "/collectes"] }],
        ["gal:cards", { title: "Au fil des saisons", items: [{ t: "Grande collecte d'automne", tag: "Novembre", x: "Dans 40 magasins du département." }, { t: "Jardin partagé", tag: "Toute l'année", x: "Légumes frais pour l'épicerie." }, { t: "Chantier de tri", tag: "Mercredi", x: "Ouvert aux groupes." }] }],
        ["cta:image", { title: "Donnez un peu de votre temps", sub: "Quelques heures par semaine font beaucoup.", cta: ["Devenir bénévole", "/benevolat"] }],
      ] },
      { key: "aide", name: "Recevoir de l'aide", blocks: [
        PH("Recevoir de l'aide", "Dans la discrétion et le respect."),
        ["feat:steps", { title: "Comment obtenir un colis", items: [{ t: "Rencontrer un travailleur social", x: "Il évalue la situation avec vous.", d: "Étape 1" }, { t: "Recevoir une orientation", x: "Vers l'association relais la plus proche.", d: "Étape 2" }, { t: "Retirer votre colis", x: "Aux horaires de distribution.", d: "Étape 3" }] }],
        ["misc:hours", { title: "Distributions au siège", rows: [["Mardi", "14 h – 17 h"], ["Vendredi", "14 h – 17 h"], ["Épicerie solidaire", "Mercredi, 9 h – 12 h"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Dois-je justifier mes revenus ?", x: "Oui, une première fois, avec un travailleur social." }, { t: "Puis-je choisir mes produits ?", x: "À l'épicerie solidaire, oui." }] }],
      ] },
      { key: "donner", name: "Donner", blocks: [
        PH("Donner des denrées ou de l'argent"),
        ["feat:icons", { title: "Trois façons de donner", items: [{ t: "Denrées", x: "Déposez vos dons à l'entrepôt aux heures d'ouverture.", icon: "heart" }, { t: "Collecte en magasin", x: "Nous fournissons affiches et bénévoles.", icon: "cart" }, { t: "Soutien financier", x: "Écrivez-nous, aucune opération de paiement n'est proposée sur ce site.", icon: "coin" }] }],
        CONTACT("Parlons de votre don", "Proposer un don", "Envoyer"),
      ] },
      { key: "benevolat", name: "Bénévolat", blocks: [
        PH("Bénévolat"),
        ["feat:list2", { title: "Missions possibles", items: [{ t: "Tri en entrepôt" }, { t: "Conduite de camionnette" }, { t: "Accueil des bénéficiaires" }, { t: "Animation d'ateliers cuisine" }, { t: "Gestion de stock" }, { t: "Communication" }] }],
        ["proof:quotes", { items: [{ q: "En deux heures par semaine, on se sent utile.", n: "Odile P.", r: "Bénévole, cliente fictive" }] }],
        ["cta:band", { title: "Rejoignez l'équipe", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "collectes", name: "Collectes", blocks: [
        PH("Collectes"),
        ["misc:schedule", { title: "Prochaines collectes", items: [{ d: "Ven.", t: "Collecte en supermarché", x: "Bénévoles à l'entrée, 9 h – 19 h." }, { d: "Sam.", t: "Collecte en école", x: "Boîtes à déposer à la sortie." }] }],
        ["misc:posts", { title: "Nouvelles de l'entrepôt", count: 3, layout: "list" }],
      ] },
    ],
  },
  // 5. Refuge animalier
  {
    key: "truffe-patte", name: "Truffe et Patte", category: "association", tags: ["ludique", "chaleureux"], siteType: "Refuge animalier",
    description: "Refuge animalier en turquoise et corail, titres ronds et joyeux, portraits d'animaux à adopter en cartes, parcours d'adoption et appel aux familles d'accueil.",
    brand: "Refuge Truffe et Patte",
    tokens: { colors: { primary: "#0b7a6e", secondary: "#073d37", accent: "#f2765a", background: "#f1faf8", surface: "#ffffff", text: "#12302c", muted: "#47625e" }, fonts: { heading: "font.baloo-2", body: "font.quicksand", button: "font.quicksand", link: "font.quicksand" }, radius: R(10, 16, 24, 999, 14, 22), shadow: { card: "md", button: "sm" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "truffe-patte", motifs: ["blobs", "objects", "bokeh"] },
    head: ["head:bar", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Adopter", "/adopter"], ["Famille d'accueil", "/accueil-temporaire"], ["Aider le refuge", "/aider"], ["Contact", "/contact"]], cta: ["Voir les animaux", "/adopter"],
    contact: { address: "Chemin des Écureuils, 31200 Toulouse", phone: "05 61 00 48 12", email: "refuge@truffe-patte.example", hours: "Visites : mercredi, samedi et dimanche, 14 h – 17 h", tagline: "Chaque animal mérite un foyer." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Refuge associatif", title: "Ils attendent une famille. Peut-être la vôtre.", sub: "Chiens, chats et lapins abandonnés, soignés et socialisés par une équipe de salariés et de bénévoles passionnés.", cta: ["Voir les animaux", "/adopter"], cta2: ["Devenir famille d'accueil", "/accueil-temporaire"] }],
        ["gal:cards", { eyebrow: "À adopter", title: "Ils cherchent un foyer", items: [{ t: "Moka", tag: "Chienne, 4 ans", x: "Douce, adore les balades et les enfants." }, { t: "Pixel", tag: "Chat, 2 ans", x: "Curieux, vit très bien en appartement." }, { t: "Noisette", tag: "Lapine, 1 an", x: "Calme, habituée à être manipulée." }] }],
        ["feat:grid-icons", { title: "Un engagement mutuel", items: [{ t: "Stérilisation", x: "Avant chaque adoption.", icon: "shield" }, { t: "Identification", x: "Puce et carnet de santé.", icon: "fileText" }, { t: "Suivi", x: "Appel à un mois et conseil à vie.", icon: "heart" }] }],
        ["proof:quotes", { title: "Ils ont adopté", items: [{ q: "Notre chienne est arrivée timide, elle dort maintenant sur le canapé.", n: "Léa & Hugo", r: "Adoptants, clients fictifs" }, { q: "L'équipe nous a aidés à choisir le chat qui nous correspondait.", n: "Mathilde V.", r: "Adoptante, cliente fictive" }] }],
        ["cta:card", { title: "Vous ne pouvez pas adopter ?", sub: "Parrainez, donnez du temps ou des croquettes.", cta: ["Aider le refuge", "/aider"] }],
      ] },
      { key: "adopter", name: "Adopter", blocks: [
        PH("Adopter", "Une adoption se prépare à deux."),
        ["feat:steps", { title: "Le parcours d'adoption", items: [{ t: "Rencontre", x: "Visite du refuge et premiers contacts.", d: "1" }, { t: "Promenades", x: "Plusieurs sorties avec l'animal.", d: "2" }, { t: "Contrat", x: "Engagement signé et frais d'adoption selon l'espèce.", d: "3" }, { t: "Suivi", x: "Nouvelles à un mois, puis à un an.", d: "4" }] }],
        ["gal:products", { title: "Ils attendent aussi", items: [{ t: "Bijou", tag: "Chat", price: "Adoption : voir refuge" }, { t: "Rex", tag: "Chien", price: "Adoption : voir refuge" }, { t: "Cannelle", tag: "Chatte", price: "Adoption : voir refuge" }, { t: "Flocon", tag: "Lapin", price: "Adoption : voir refuge" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je adopter en appartement ?", x: "Oui, selon l'animal et l'accord du propriétaire." }, { t: "Y a-t-il un coût ?", x: "Des frais couvrent la stérilisation, la puce et les vaccins." }] }],
      ] },
      { key: "accueil-temporaire", name: "Famille d'accueil", blocks: [
        PH("Devenir famille d'accueil"),
        ["misc:story", { eyebrow: "Un geste précieux", title: "Quelques semaines pour sauver une vie", paras: ["Les familles d'accueil hébergent chatons, chiennes gestantes ou animaux fragiles avant leur adoption.", "Nourriture et soins vétérinaires sont pris en charge par le refuge."], image: "portrait-1" }],
        ["feat:list2", { title: "Ce qu'il faut", items: [{ t: "Disponibilité quotidienne" }, { t: "Accord de la famille" }, { t: "Lieu sécurisé" }, { t: "Appel hebdomadaire au refuge" }] }],
        CONTACT("Postuler comme famille d'accueil", "Votre candidature", "Envoyer"),
      ] },
      { key: "aider", name: "Aider le refuge", blocks: [
        PH("Aider le refuge"),
        ["feat:icons", { title: "Comment aider", items: [{ t: "Don de matériel", x: "Croquettes, couvertures, jouets.", icon: "heart" }, { t: "Bénévolat", x: "Promenades et soins le week-end.", icon: "users" }, { t: "Parrainage", x: "Contactez-nous, aucun paiement n'est proposé ici.", icon: "star" }] }],
        ["proof:stats", { title: "Le refuge (exemples)", items: [["320", "adoptions par an"], ["60", "bénévoles"], ["45", "places en famille d'accueil"]] }],
        ["cta:band", { title: "Une question ?", cta: ["Nous écrire", "/contact"] }],
      ] },
    ],
  },
  // 6. Théâtre amateur (sombre)
  {
    key: "coulisse-rideau", name: "Rideau Rouge Vif", category: "association", tags: ["sombre", "luxe", "editorial"], siteType: "Association culturelle / théâtre amateur",
    description: "Troupe de théâtre amateur en thème sombre prune et rose scène, serif Bodoni dramatique, bandeau de journal, programme de saison et galerie de spectacles.",
    brand: "Compagnie du Rideau Rouge",
    tokens: { colors: { primary: "#f0508f", secondary: "#3a1226", accent: "#f3c969", background: "#170b12", surface: "#241320", text: "#f6ecf1", muted: "#c8b4c0" }, fonts: { heading: "font.bodoni-moda", body: "font.jost", button: "font.jost", link: "font.jost" }, radius: R(0, 2, 4, 0, 2, 2), shadow: { card: "none", button: "none" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "coulisse-rideau", motifs: ["arches", "bokeh", "ribbons"] },
    head: ["head:masthead", { dateline: "Saison 2026-2027 · Théâtre de la Halle" }],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["La saison", "/saison"], ["La troupe", "/troupe"], ["Ateliers", "/ateliers"], ["Billetterie", "/billetterie"]], cta: ["Réserver", "/billetterie"],
    contact: { address: "Salle de la Halle, 5 place du Marché, 69007 Lyon", phone: "04 78 00 31 02", email: "troupe@rideau-rouge.example", hours: "Répétitions : mardi et jeudi, 20 h – 22 h 30", tagline: "Le théâtre, c'est nous." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Nouvelle création", title: "Le Dernier Rappel", sub: "Une comédie grinçante en trois actes, jouée par vingt comédiens amateurs. Du 12 au 22 mars.", cta: ["Réserver", "/billetterie"] }],
        ["feat:alt", { title: "À l'affiche", items: [{ t: "Le Dernier Rappel", x: "Comédie en trois actes, mise en scène collective.", link: ["Réserver", "/billetterie"] }, { t: "Contes de la lune", x: "Spectacle jeune public, dès 5 ans.", link: ["Voir la saison", "/saison"] }] }],
        ["misc:schedule", { title: "Dates de mars", items: [{ d: "12 mars, 20 h 30", t: "Première", x: "Suivie d'un verre avec la troupe." }, { d: "15 mars, 16 h", t: "Matinée", x: "Tarif famille." }, { d: "22 mars, 20 h 30", t: "Dernière", x: "Avec bal costumé." }] }],
        ["gal:masonry", { title: "Souvenirs de scène", items: [{ t: "Répétition générale" }, { t: "Costumes" }, { t: "Décors peints à la main" }, { t: "Salut final" }] }],
        ["cta:band", { title: "Envie de monter sur scène ?", sub: "Les ateliers d'initiation reprennent en septembre.", cta: ["Voir les ateliers", "/ateliers"] }],
      ] },
      { key: "saison", name: "La saison", blocks: [
        PH("La saison 2026-2027", "Quatre spectacles, une même passion."),
        ["feat:rows", { title: "Les spectacles", items: [{ t: "Octobre : Le Bal des menteurs", x: "Comédie de boulevard revisitée." }, { t: "Décembre : Contes de la lune", x: "Jeune public, marionnettes et ombres." }, { t: "Mars : Le Dernier Rappel", x: "Création collective." }, { t: "Juin : Nuit d'été", x: "Représentation en plein air." }] }],
        ["misc:quote", { text: "On rit, on s'émeut, on oublie qu'ils ne sont pas professionnels.", by: "Spectatrice, cliente fictive" }],
      ] },
      { key: "troupe", name: "La troupe", blocks: [
        PH("La troupe"),
        ["proof:team", { title: "Mise en scène et équipe", items: [{ n: "Élodie Fontvieille", r: "Metteuse en scène" }, { n: "Raphaël Aubry", r: "Régie lumière" }, { n: "Sabine Morel", r: "Costumes" }, { n: "Gaspard Lenoir", r: "Décors" }] }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Vingt ans de planches", paras: ["Née dans un garage en 2006, la compagnie réunit aujourd'hui des comédiens de 16 à 78 ans.", "Nous jouons toute l'année dans la salle de la Halle, prêtée par la mairie."], image: "portrait-2" }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        PH("Ateliers de théâtre"),
        ["price:tiers", { items: [{ t: "Initiation adultes", price: "180 €", period: "an", x: "Exemple de tarif", f: ["Mardi 19 h – 21 h", "Jeu et improvisation", "Spectacle de fin d'année"], cta: ["Se renseigner", "/contact"] }, { t: "Ados", price: "150 €", period: "an", f: ["Mercredi 16 h – 18 h", "Voix et corps", "Spectacle de fin d'année"], cta: ["Se renseigner", "/contact"], hl: true }, { t: "Enfants", price: "130 €", period: "an", f: ["Mercredi 14 h – 15 h 30", "Jeux d'imagination"], cta: ["Se renseigner", "/contact"] }] }],
        ["feat:accordion", { title: "Avant de s'inscrire", items: [{ t: "Faut-il de l'expérience ?", x: "Non, la première séance est une découverte." }, { t: "Y a-t-il un essai ?", x: "Oui, une séance gratuite." }] }],
      ] },
      { key: "billetterie", name: "Billetterie", blocks: [
        PH("Réserver vos places", "Réservation par message, règlement sur place."),
        ["feat:pricelist", { title: "Tarifs (exemples)", items: [{ t: "Plein tarif", price: "12 €" }, { t: "Réduit (étudiants, demandeurs d'emploi)", price: "8 €" }, { t: "Enfant jusqu'à 12 ans", price: "5 €" }] }],
        CONTACT("Réservation", "Demande de réservation", "Réserver"),
      ] },
    ],
  },
  // 7. Mutuelle / syndicat
  {
    key: "forum-salaries", name: "Solidaires du Rhône", category: "association", tags: ["classique", "audacieux"], siteType: "Syndicat de salariés / mutuelle",
    description: "Syndicat et mutuelle de salariés en rouge franc et gris ardoise, titres grotesques puissants, tableau comparatif de garanties et fiches pratiques de droits.",
    brand: "Syndicat Solidaires du Rhône",
    tokens: { colors: { primary: "#c0281c", secondary: "#262b33", accent: "#f2c14e", background: "#f6f6f4", surface: "#ffffff", text: "#1e2127", muted: "#555b66" }, fonts: { heading: "font.chivo", body: "font.ibm-plex-serif", button: "font.chivo", link: "font.ibm-plex-serif" }, radius: R(2, 4, 6, 2, 3, 4), shadow: { card: "none", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "forum-salaries", motifs: ["plates", "rays", "tiles"] },
    head: ["head:split", {}],
    foot: ["foot:columns", { about: "Syndicat de salariés et mutuelle de branche : conseil juridique, défense individuelle et garanties santé. Site de démonstration.", cols: [["Vos droits", "Fiches pratiques", "Permanences", "Questions fréquentes"], ["Le syndicat", "Nos élus", "Adhérer", "Contact"]] }],
    menu: [["Accueil", "/"], ["Vos droits", "/droits"], ["Mutuelle", "/mutuelle"], ["Permanences", "/permanences"], ["Adhérer", "/adherer"]], cta: ["Adhérer", "/adherer"],
    contact: { address: "Bourse du Travail, 205 place Guichard, 69003 Lyon", phone: "04 72 00 19 50", email: "accueil@solidaires-rhone.example", hours: "Du lundi au jeudi, 9 h – 17 h", tagline: "Plus forts ensemble." },
    social: ["facebook", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Défendre, informer, protéger", title: "Vos droits ne se négocient pas seuls.", sub: "Conseil juridique, défense aux prud'hommes et mutuelle santé à prix solidaire pour les salariés de la métropole.", cta: ["Adhérer", "/adherer"], cta2: ["Connaître vos droits", "/droits"], angle: 120 }],
        ["feat:icons", { title: "Ce que nous faisons pour vous", items: [{ t: "Conseil juridique", x: "Contrat, licenciement, heures supplémentaires : un avis gratuit pour les adhérents.", icon: "shield" }, { t: "Défense collective", x: "Négociation d'accords et accompagnement dans l'entreprise.", icon: "users" }, { t: "Mutuelle solidaire", x: "Garanties santé sans questionnaire médical.", icon: "heart" }] }],
        ["feat:compare", { title: "Les formules de mutuelle", intro: "Exemples de garanties de démonstration.", rows: [["", "Essentielle", "Confort"], ["Hospitalisation", "100 %", "200 %"], ["Dentaire", "125 %", "300 %"], ["Optique", "100 euros", "250 euros"], ["Médecines douces", "non", "oui"]] }],
        ["proof:stats", { title: "Le syndicat en chiffres (exemples)", items: [["4 200", "adhérents"], ["310", "dossiers défendus"], ["62", "sections d'entreprise"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "L'adhésion est-elle confidentielle ?", x: "Oui, votre employeur n'est jamais informé." }, { t: "Combien coûte la cotisation ?", x: "Environ 1 % du salaire net, déductible en partie (exemple)." }] }],
        ["cta:split", { title: "Un problème au travail ?", sub: "Parlez-en à un délégué dans le plus grand respect de la confidentialité.", cta: ["Prendre contact", "/contact"] }],
      ] },
      { key: "droits", name: "Vos droits", blocks: [
        PH("Vos droits", "Des fiches claires, sans jargon."),
        ["feat:strips", { title: "Fiches pratiques", items: [{ t: "Licenciement : vos recours", x: "Procédure, délais et indemnités." }, { t: "Heures supplémentaires", x: "Décompte, majorations, preuves." }, { t: "Télétravail", x: "Accord, frais et droit à la déconnexion." }, { t: "Congés et absences", x: "Posez et planifiez vos droits." }] }],
        ["misc:posts", { title: "Dernières fiches publiées", count: 3, layout: "list" }],
      ] },
      { key: "mutuelle", name: "Mutuelle", blocks: [
        PH("Mutuelle solidaire"),
        ["feat:tabs", { title: "Nos garanties", items: [{ t: "Soins courants", x: "Consultations, pharmacie et analyses remboursées." }, { t: "Hospitalisation", x: "Chambre particulière et frais de séjour." }, { t: "Dentaire et optique", x: "Prothèses, lunettes et lentilles." }] }],
        ["cta:card", { title: "Obtenir un devis", sub: "Aucun paiement en ligne : l'équipe vous rappelle.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "permanences", name: "Permanences", blocks: [
        PH("Permanences"),
        ["misc:hours", { title: "Où nous rencontrer", rows: [["Lyon, Bourse du Travail", "Lundi au jeudi, 9 h – 17 h"], ["Vénissieux", "Mardi, 14 h – 17 h"], ["Villefranche", "Jeudi, 9 h – 12 h"]] }],
        ["contact:map", { title: "Venir à la Bourse du Travail", mapAddress: "205 place Guichard, 69003 Lyon" }],
      ] },
      { key: "adherer", name: "Adhérer", blocks: [
        PH("Adhérer"),
        ["feat:steps", { title: "Rejoindre en trois étapes", items: [{ t: "Prendre contact", x: "Par téléphone ou message.", d: "1" }, { t: "Rendez-vous", x: "Présentation du syndicat et des services.", d: "2" }, { t: "Adhésion", x: "Carte et accès aux ressources.", d: "3" }] }],
        CONTACT("Demande d'adhésion", "Votre message", "Envoyer"),
      ] },
    ],
  },
  // 8. Collectif citoyen
  {
    key: "tocsin-citoyen", name: "Tocsin", category: "association", tags: ["audacieux", "geometrique"], siteType: "Collectif citoyen",
    description: "Collectif citoyen en violet électrique et jaune citron, capitales Bebas Neue, mise en page minimale en pleine largeur, pétitions et agenda des assemblées de quartier.",
    brand: "Collectif Tocsin",
    tokens: { colors: { primary: "#6d3fd0", secondary: "#1f1442", accent: "#f2e03a", background: "#faf8ff", surface: "#ffffff", text: "#1b1530", muted: "#554d70" }, fonts: { heading: "font.bebas-neue", body: "font.cabin", button: "font.cabin", link: "font.cabin" }, radius: R(0, 0, 0, 0, 0, 0), shadow: { card: "none", button: "none" }, type: { h1: { size: 76, weight: 400, lineHeight: 0.95, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 44, weight: 400, lineHeight: 1, letterSpacing: 0.02, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "tocsin-citoyen", motifs: ["halftone", "tiles", "rays"] },
    head: ["head:minimal", {}],
    foot: ["foot:big", { title: "TOCSIN" }],
    menu: [["Accueil", "/"], ["Nos luttes", "/luttes"], ["Assemblées", "/assemblees"], ["Boîte à outils", "/outils"], ["Nous rejoindre", "/rejoindre"]], cta: ["Nous rejoindre", "/rejoindre"],
    contact: { address: "Local associatif, 14 rue de la Fraternité, 93100 Montreuil", phone: "01 48 00 52 07", email: "collectif@tocsin-citoyen.example", hours: "Permanence le samedi, 11 h – 14 h", tagline: "Ensemble, on s'organise." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Collectif de quartier", title: "Notre quartier, notre voix.", sub: "Habitants, commerçants et associations s'organisent pour défendre les services publics, le logement et l'espace commun.", cta: ["Nous rejoindre", "/rejoindre"], cta2: ["Prochaines assemblées", "/assemblees"] }],
        ["feat:rows", { title: "Nos combats du moment", items: [{ t: "Sauvons la poste du centre", x: "Pétition à 3 400 signatures (exemple) pour garder le bureau ouvert." }, { t: "Logement digne", x: "Aide aux locataires face aux charges et aux expulsions." }, { t: "Place aux piétons", x: "Concertation pour une rue scolaire sécurisée." }] }],
        ["proof:logos", { title: "Avec le soutien de", items: ["Amicale des locataires", "Parents du centre", "Les commerçants unis", "Maison de quartier", "Jardins ouvriers"] }],
        ["feat:tabs", { title: "Comment s'engager", items: [{ t: "Venir à l'assemblée", x: "Un samedi par mois, ouvert à tous." }, { t: "Rejoindre un groupe", x: "Logement, mobilité, culture, communication." }, { t: "Relayer", x: "Affiches, tracts et réseaux sociaux." }] }],
        ["cta:band", { title: "Un seul rendez-vous suffit pour commencer.", cta: ["Venir à la prochaine assemblée", "/assemblees"] }],
      ] },
      { key: "luttes", name: "Nos luttes", blocks: [
        PH("Nos luttes", "Ce que nous avons obtenu, ce qui reste à faire."),
        ["feat:numbered", { title: "Victoires récentes", items: [{ t: "Feux pour piétons", x: "Un passage sécurisé devant l'école." }, { t: "Marché hebdomadaire", x: "Maintenu après un an de mobilisation." }, { t: "Espace jeunes", x: "Salle rouverte en soirée." }] }],
        ["misc:text", { title: "Notre méthode", paras: ["Nous décidons ensemble, à main levée, après avoir écouté tout le monde. Aucune décision n'est prise par un seul.", "Le collectif ne dépend d'aucun parti ni d'aucune entreprise."] }],
      ] },
      { key: "assemblees", name: "Assemblées", blocks: [
        PH("Assemblées de quartier"),
        ["misc:schedule", { title: "Prochaines dates", items: [{ d: "Sam. 7", t: "Assemblée générale", x: "Maison de quartier, 17 h." }, { d: "Mar. 17", t: "Atelier pétition", x: "Rédaction du texte collectif, 19 h." }, { d: "Sam. 28", t: "Marche pour la poste", x: "Départ place de la Mairie, 10 h." }] }],
        ["feat:list2", { title: "Règles de l'assemblée", items: [{ t: "Parole à tour de rôle" }, { t: "Pas de violence verbale" }, { t: "Garde d'enfants sur place" }, { t: "Compte rendu public" }] }],
      ] },
      { key: "outils", name: "Boîte à outils", blocks: [
        PH("Boîte à outils", "Pour lancer votre propre action de quartier."),
        ["feat:cards", { title: "Ressources", items: [{ t: "Modèle de pétition", x: "Texte à adapter et feuille de signatures.", icon: "fileText" }, { t: "Guide de réunion", x: "Ordre du jour et animation.", icon: "users" }, { t: "Affiches libres", x: "Fichiers imprimables.", icon: "printer" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il être adhérent ?", x: "Non, toute personne qui habite ou travaille ici est bienvenue." }, { t: "Peut-on venir anonymement ?", x: "Oui, aucune inscription n'est obligatoire." }] }],
      ] },
      { key: "rejoindre", name: "Nous rejoindre", blocks: [
        PH("Nous rejoindre"),
        CONTACT("Écrivez-nous", "Je veux participer", "Envoyer"),
        ["cta:card", { title: "Pas besoin d'être expert", sub: "Une heure par mois suffit.", cta: ["Nous écrire", "/contact"] }],
      ] },
    ],
  },
  // 9. Anciens élèves
  {
    key: "promotions-lycee", name: "Les Promos", category: "association", tags: ["classique", "luxe"], siteType: "Association d'anciens élèves",
    description: "Réseau d'anciens élèves en prune profond et crème, serif Cormorant élégant, mise en page centrée à en-tête latéral, annuaire des promotions et agenda des retrouvailles.",
    brand: "Association des anciens du lycée Saint-Aurèle",
    tokens: { colors: { primary: "#7d2a8c", secondary: "#2e1236", accent: "#c9a45c", background: "#fbf7f1", surface: "#ffffff", text: "#2a1b30", muted: "#5d4a63" }, fonts: { heading: "font.cormorant-garamond", body: "font.mulish", button: "font.mulish", link: "font.mulish" }, radius: R(2, 4, 8, 4, 4, 6), shadow: { card: "sm", button: "none" }, type: { h1: { size: 60, weight: 600, lineHeight: 1.05, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "soft" }, art: { seed: "promotions-lycee", motifs: ["arches", "plates", "botanical"] },
    head: ["head:side", {}],
    foot: ["foot:newsletter", { title: "Restez en contact avec votre promotion", sub: "Une lettre trimestrielle : retrouvailles, nominations, souvenirs.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Les promotions", "/promotions"], ["Retrouvailles", "/retrouvailles"], ["Entraide", "/entraide"], ["Adhérer", "/adherer"]], cta: ["Adhérer", "/adherer"],
    contact: { address: "Lycée Saint-Aurèle, 2 rue du Collège, 35000 Rennes", phone: "02 99 00 40 11", email: "anciens@saint-aurele.example", hours: "Secrétariat : mardi et jeudi, 14 h – 17 h", tagline: "Un lycée, des vies, un réseau." },
    social: ["linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Depuis 1952", title: "Retrouvez ceux avec qui tout a commencé.", sub: "Plus de 3 000 anciens élèves, des promotions de 1960 à aujourd'hui, se retrouvent, s'entraident et soutiennent les lycéens.", cta: ["Adhérer", "/adherer"], cta2: ["Retrouvailles", "/retrouvailles"] }],
        ["misc:story", { eyebrow: "Notre association", title: "Une mémoire vivante", paras: ["Nous organisons des retrouvailles par promotion, un annuaire en ligne et un réseau d'entraide professionnelle.", "Une partie des cotisations finance des bourses pour des lycéens."], image: "portrait-1" }],
        ["proof:team", { title: "Le bureau", items: [{ n: "Marguerite Houdan", r: "Présidente, promo 1988" }, { n: "Lucien Tessier", r: "Trésorier, promo 1975" }, { n: "Inès Barbier", r: "Secrétaire, promo 2004" }] }],
        ["gal:strip", { title: "Albums de promotions", items: [{ t: "Promo 1978" }, { t: "Promo 1991" }, { t: "Promo 2003" }, { t: "Promo 2012" }, { t: "Promo 2019" }] }],
        ["proof:big", { items: [{ q: "Quarante ans après, j'ai retrouvé mes amis de terminale autour de la même cour.", n: "Pierre-Yves L.", r: "Ancien élève, client fictif" }] }],
        ["cta:card", { title: "Vous êtes ancien du lycée ?", sub: "Inscrivez-vous à l'annuaire.", cta: ["Adhérer", "/adherer"] }],
      ] },
      { key: "promotions", name: "Les promotions", blocks: [
        PH("Les promotions"),
        ["feat:alt", { title: "Retrouver sa promotion", items: [{ t: "L'annuaire", x: "Coordonnées visibles uniquement par les adhérents." }, { t: "Les albums", x: "Photos de classe numérisées par nos bénévoles." }] }],
        ["proof:stats", { items: [["3 100", "anciens inscrits"], ["64", "promotions représentées"], ["12", "pays"]] }],
      ] },
      { key: "retrouvailles", name: "Retrouvailles", blocks: [
        PH("Retrouvailles", "Chaque année, une fête pour les promos en 8."),
        ["misc:schedule", { title: "Programme de la journée", items: [{ d: "10 h", t: "Accueil café", x: "Dans la cour d'honneur." }, { d: "11 h", t: "Visite du lycée", x: "Salles, internat, bibliothèque." }, { d: "13 h", t: "Déjeuner", x: "Au réfectoire rénové." }, { d: "17 h", t: "Photo de promotion", x: "Sur les marches." }] }],
        ["cta:band", { title: "S'inscrire aux retrouvailles", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "entraide", name: "Entraide", blocks: [
        PH("Entraide et parrainage"),
        ["feat:icons", { title: "Un réseau qui sert", items: [{ t: "Parrainage", x: "Un ancien accompagne un lycéen dans son orientation.", icon: "graduation" }, { t: "Offres de stage", x: "Entreprises dirigées par des anciens.", icon: "briefcase" }, { t: "Bourses", x: "Aide aux familles pour les voyages scolaires.", icon: "heart" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Comment devenir parrain ?", x: "Écrivez-nous en indiquant votre métier." }, { t: "Mes données sont-elles protégées ?", x: "Oui, uniquement visibles par les adhérents." }] }],
      ] },
      { key: "adherer", name: "Adhérer", blocks: [
        PH("Adhérer"),
        ["feat:pricelist", { title: "Cotisation annuelle (exemples)", items: [{ t: "Jeune diplômé (moins de 27 ans)", price: "10 €" }, { t: "Membre actif", price: "30 €" }, { t: "Bienfaiteur", price: "80 €" }] }],
        CONTACT("Adhésion", "Votre demande", "Envoyer"),
      ] },
    ],
  },
  // 10. Centre social
  {
    key: "maison-carrefour", name: "Carrefour des Lilas", category: "association", tags: ["chaleureux", "moderne"], siteType: "Centre social et culturel",
    description: "Centre social en vert olive vif et cuivre doux, titres Rubik tout en rondeur, programme d'activités en grille, horaires de la maison et actions pour tous les âges.",
    brand: "Centre social Carrefour des Lilas",
    tokens: { colors: { primary: "#5b7d00", secondary: "#2c3d00", accent: "#d9731e", background: "#f8faf0", surface: "#ffffff", text: "#232d0f", muted: "#546040" }, fonts: { heading: "font.rubik", body: "font.lora", button: "font.rubik", link: "font.lora" }, radius: R(6, 10, 18, 10, 8, 14), shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "maison-carrefour", motifs: ["blobs", "tiles", "objects"] },
    head: ["head:topbar", { info: "Ouvert du lundi au samedi", note: "Accueil gratuit, sans rendez-vous" }],
    foot: ["foot:columns", { about: "Centre social de quartier : activités familiales, accompagnement des démarches, jeunesse et lien entre voisins. Site de démonstration.", cols: [["Activités", "Enfance et jeunesse", "Familles", "Seniors"], ["Pratique", "Programme du mois", "Horaires", "Contact"]] }],
    menu: [["Accueil", "/"], ["Activités", "/activites"], ["Accompagnement", "/accompagnement"], ["Programme", "/programme"], ["Contact", "/contact"]], cta: ["Nous rendre visite", "/contact"],
    contact: { address: "10 allée des Lilas, 42100 Saint-Étienne", phone: "04 77 00 28 64", email: "accueil@carrefour-lilas.example", hours: "Lundi au vendredi 9 h – 18 h, samedi 9 h – 12 h", tagline: "Un lieu où l'on se retrouve." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Centre social et culturel", title: "Une maison ouverte à tous les habitants.", sub: "Activités, aide aux démarches, accueil des enfants et rencontres entre voisins, du matin au soir.", cta: ["Voir le programme", "/programme"], cta2: ["Nous rendre visite", "/contact"], stats: [["12 ans", "d'ouverture du lieu (exemple)"], ["900", "familles accueillies"], ["35", "activités par semaine"]] }],
        ["feat:list2", { title: "Pour chaque âge", items: [{ t: "Accueil des tout-petits" }, { t: "Accompagnement scolaire" }, { t: "Atelier jeunes 12-17 ans" }, { t: "Permanences numériques" }, { t: "Café des parents" }, { t: "Club des seniors" }] }],
        ["gal:grid", { title: "La vie de la maison", items: [{ t: "Repas partagé" }, { t: "Atelier couture" }, { t: "Sortie en famille" }, { t: "Jardin des Lilas" }] }],
        ["misc:hours", { title: "Horaires d'accueil", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Samedi", "9 h – 12 h"], ["Dimanche", "Fermé"]] }],
        ["proof:quotes", { title: "Ils fréquentent la maison", items: [{ q: "On m'a aidée à remplir mes papiers sans me juger.", n: "Fatou D.", r: "Habitante, cliente fictive" }, { q: "Mes enfants adorent l'atelier théâtre du mercredi.", n: "Nicolas P.", r: "Parent, client fictif" }] }],
        ["cta:image", { title: "Passez la porte", sub: "Un café est toujours prêt.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "activites", name: "Activités", blocks: [
        PH("Activités"),
        ["feat:cards", { title: "Au programme", items: [{ t: "Enfance", x: "Accueil de loisirs et soutien scolaire.", icon: "star" }, { t: "Famille", x: "Sorties, ateliers cuisine et jeux.", icon: "home" }, { t: "Seniors", x: "Gym douce, jeux de société et goûters.", icon: "heart" }] }],
        ["feat:alt", { title: "Zoom sur", items: [{ t: "L'atelier couture", x: "Réparer, transformer et créer ensemble, le jeudi après-midi." }, { t: "Le jardin partagé", x: "Une parcelle par famille, des légumes à partager." }] }],
      ] },
      { key: "accompagnement", name: "Accompagnement", blocks: [
        PH("Accompagnement", "Un coup de main pour vos démarches."),
        ["feat:steps", { title: "Comment ça marche", items: [{ t: "Accueil", x: "Une personne vous écoute, sans rendez-vous.", d: "1" }, { t: "Orientation", x: "Vers la bonne permanence ou le bon partenaire.", d: "2" }, { t: "Suivi", x: "Rendez-vous réguliers si besoin.", d: "3" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Les services sont-ils gratuits ?", x: "L'accueil et l'aide aux démarches sont gratuits ; certaines activités ont une participation modeste." }, { t: "Faut-il être habitant du quartier ?", x: "Priorité aux habitants, mais chacun est le bienvenu." }] }],
      ] },
      { key: "programme", name: "Programme", blocks: [
        PH("Programme du mois"),
        ["misc:schedule", { title: "Cette semaine", items: [{ d: "Lundi 14 h", t: "Atelier numérique", x: "Se débrouiller en ligne." }, { d: "Mercredi 15 h", t: "Atelier théâtre enfants", x: "6-11 ans." }, { d: "Jeudi 14 h", t: "Atelier couture", x: "Machines fournies." }, { d: "Vendredi 12 h", t: "Repas partagé", x: "Chacun apporte un plat." }] }],
        ["misc:posts", { title: "Les nouvelles de la maison", count: 3, layout: "grid" }],
      ] },
    ],
  },
  // 11. Fondation de recherche (sombre)
  {
    key: "fondation-helice", name: "Hélice", category: "association", tags: ["sombre", "technique"], siteType: "Fondation de recherche médicale",
    description: "Fondation de recherche en thème sombre bleu nuit et cyan, titres géométriques Sora, rapports d'avancement, chiffres des projets financés et appels à projets.",
    brand: "Fondation Hélice pour la recherche",
    tokens: { colors: { primary: "#38bdf8", secondary: "#0e2a44", accent: "#a3e635", background: "#08141f", surface: "#0f2233", text: "#eaf4fb", muted: "#a7bccd" }, fonts: { heading: "font.sora", body: "font.public-sans", button: "font.sora", link: "font.public-sans" }, radius: R(4, 8, 14, 8, 8, 12), shadow: { card: "none", button: "none" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "soft" }, art: { seed: "fondation-helice", motifs: ["mesh", "topo", "bokeh"] },
    head: ["head:float", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Projets financés", "/projets"], ["Appels à projets", "/appels"], ["Publications", "/publications"], ["Soutenir", "/soutenir"]], cta: ["Soutenir la recherche", "/soutenir"],
    contact: { address: "Campus Santé, 21 avenue de la Découverte, 67000 Strasbourg", phone: "03 88 00 14 75", email: "contact@fondation-helice.example", hours: "Du lundi au vendredi, 9 h – 17 h", tagline: "La recherche d'aujourd'hui soigne demain." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Recherche médicale", title: "Financer les idées qui soigneront demain.", sub: "La fondation soutient des équipes de recherche sur les maladies rares du métabolisme, de la découverte à l'essai clinique.", cta: ["Soutenir la recherche", "/soutenir"], cta2: ["Projets financés", "/projets"], image: "portrait-2" }],
        ["feat:tabs", { title: "Nos axes de recherche", items: [{ t: "Maladies rares", x: "Cartographie génétique et diagnostics plus rapides." }, { t: "Métabolisme", x: "Mécanismes des maladies du foie et du pancréas." }, { t: "Thérapies innovantes", x: "Thérapie génique et médicaments ciblés." }] }],
        ["proof:statsbar", { items: [["38", "projets soutenus (exemple)"], ["6 M euros", "investis en recherche"], ["112", "publications scientifiques"]] }],
        ["misc:posts", { title: "Actualités de la recherche", count: 3, layout: "grid" }],
        ["cta:split", { title: "Vous êtes chercheur ?", sub: "Notre comité scientifique évalue les dossiers deux fois par an.", cta: ["Voir les appels", "/appels"] }],
      ] },
      { key: "projets", name: "Projets financés", blocks: [
        PH("Projets financés"),
        ["gal:cards", { title: "Projets en cours", items: [{ t: "Protéo-Foie", tag: "Génétique", x: "Biomarqueurs précoces d'une maladie du foie." }, { t: "Glyco-Enfant", tag: "Pédiatrie", x: "Suivi d'enfants atteints d'une maladie du métabolisme." }, { t: "Vecteur Alpha", tag: "Thérapie génique", x: "Essai pré-clinique d'un traitement ciblé." }] }],
        ["feat:rows", { title: "Comment sont choisis les projets", items: [{ t: "Appel annuel", x: "Dossier de 10 pages avec budget." }, { t: "Évaluation", x: "Lecture par deux experts indépendants." }, { t: "Suivi", x: "Rapport d'étape tous les six mois." }] }],
      ] },
      { key: "appels", name: "Appels à projets", blocks: [
        PH("Appels à projets", "Deux sessions par an, ouvertes aux équipes publiques."),
        ["misc:schedule", { title: "Calendrier", items: [{ d: "15 janv.", t: "Ouverture de l'appel", x: "Dépôt en ligne du dossier." }, { d: "30 avril", t: "Clôture", x: "Pas de dossier hors délai." }, { d: "Juin", t: "Comité scientifique", x: "Notification en juillet." }] }],
        ["feat:accordion", { title: "Questions de candidats", items: [{ t: "Quel budget est possible ?", x: "Jusqu'à 150 000 euros par projet (exemple)." }, { t: "Durée maximale ?", x: "Deux ans, renouvelable une fois." }] }],
      ] },
      { key: "publications", name: "Publications", blocks: [
        PH("Publications et rapports"),
        ["misc:article", { tag: "Rapport annuel", title: "Une année de recherche, en résumé", meta: "Direction scientifique · 6 min", paras: ["Nous avons financé onze nouveaux projets, dont quatre portés par de jeunes chercheurs.", "Les résultats de l'essai pré-clinique Vecteur Alpha ont été présentés lors d'un congrès international."], quote: "La recherche demande du temps, et des donateurs qui tiennent dans la durée.", by: "Direction scientifique" }],
        ["cta:band", { title: "Soutenir nos publications", sub: "Chaque rapport est financé par des dons : aucun paiement n'est proposé ici.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "soutenir", name: "Soutenir", blocks: [
        PH("Soutenir la recherche"),
        ["feat:icons", { title: "Comment aider", items: [{ t: "Dons", x: "Demandez les modalités : aucun paiement n'est proposé ici.", icon: "heart" }, { t: "Legs", x: "Un conseiller vous explique les démarches.", icon: "fileText" }, { t: "Mécénat d'entreprise", x: "Financez un projet en partenariat.", icon: "briefcase" }] }],
        CONTACT("Parlons de votre soutien", "Écrire à la fondation", "Envoyer"),
      ] },
    ],
  },
  // 12. Association de parents d'élèves
  {
    key: "cartable-ensemble", name: "Cartable", category: "association", tags: ["ludique", "moderne"], siteType: "Association de parents d'élèves",
    description: "Association de parents d'élèves en indigo vif et jaune, titres Fredoka joyeux, bande d'annonces, agenda des événements d'école et informations pratiques pour les familles.",
    brand: "Parents d'élèves du groupe scolaire Jules-Vallès",
    tokens: { colors: { primary: "#3949c7", secondary: "#1a2160", accent: "#ffc83d", background: "#f6f7ff", surface: "#ffffff", text: "#1a1f4d", muted: "#4f5586" }, fonts: { heading: "font.fredoka", body: "font.nunito", button: "font.nunito", link: "font.nunito" }, radius: R(10, 16, 24, 14, 12, 20), shadow: { card: "md", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "center", shape: "pill" }, art: { seed: "cartable-ensemble", motifs: ["blobs", "objects", "tiles"] },
    head: ["head:center", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Agenda", "/agenda"], ["Actions", "/actions"], ["Infos pratiques", "/infos"], ["Nous rejoindre", "/rejoindre"]], cta: ["Rejoindre", "/rejoindre"],
    contact: { address: "Groupe scolaire Jules-Vallès, 6 rue de l'École, 76000 Rouen", phone: "02 35 00 91 23", email: "parents@cartable-ensemble.example", hours: "Permanence : vendredi, 16 h 30 – 17 h 30, devant l'école", tagline: "Les parents font l'école." },
    social: ["facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Année scolaire 2026-2027", title: "Une école, des parents qui se mobilisent.", sub: "Nous relayons vos questions auprès de l'équipe enseignante et de la mairie, et organisons les temps forts de l'école.", cta: ["Voir l'agenda", "/agenda"], cta2: ["Rejoindre", "/rejoindre"] }],
        ["misc:marquee", { items: ["Kermesse le 14 juin", "Bourse aux jouets en décembre", "Conseil d'école le 12 novembre", "Pédibus tous les matins"] }],
        ["feat:strips", { title: "Ce que nous faisons", items: [{ t: "Représenter les parents", x: "Au conseil d'école et aux commissions de cantine." }, { t: "Organiser les fêtes", x: "Kermesse, spectacle de Noël et carnaval." }, { t: "Financer des projets", x: "Sorties et matériel grâce aux bénéfices." }] }],
        ["gal:carousel", { title: "Souvenirs de l'année", items: [{ t: "Carnaval des enfants" }, { t: "Kermesse" }, { t: "Bourse aux jouets" }, { t: "Jardin de l'école" }] }],
        ["feat:accordion", { title: "Questions de parents", items: [{ t: "Comment signaler un problème à la cantine ?", x: "Écrivez-nous, nous le portons à la commission." }, { t: "Faut-il adhérer pour participer ?", x: "Non, tous les parents sont bienvenus aux réunions." }] }],
        ["cta:band", { title: "Une heure par an, ça compte.", cta: ["Nous rejoindre", "/rejoindre"] }],
      ] },
      { key: "agenda", name: "Agenda", blocks: [
        PH("Agenda de l'année"),
        ["misc:schedule", { title: "Les rendez-vous", items: [{ d: "12 nov.", t: "Conseil d'école", x: "Remontée des questions de parents." }, { d: "6 déc.", t: "Bourse aux jouets", x: "Salle des fêtes, 10 h – 16 h." }, { d: "20 déc.", t: "Spectacle de Noël", x: "Goûter offert." }, { d: "14 juin", t: "Kermesse", x: "Jeux, stands et buvette." }] }],
        ["cta:card", { title: "Un événement à proposer ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "actions", name: "Actions", blocks: [
        PH("Nos actions"),
        ["feat:cards", { title: "Projets de l'année", items: [{ t: "Pédibus", x: "Accompagner les enfants à pied, à tour de rôle.", icon: "users" }, { t: "Bibliothèque de classe", x: "Achat de livres neufs et d'occasion.", icon: "book" }, { t: "Jardin de l'école", x: "Bacs potagers pour toutes les classes.", icon: "sun" }] }],
        ["proof:stats", { items: [["320", "familles"], ["45", "parents bénévoles"], ["3 200 €", "reversés à l'école (exemple)"]] }],
      ] },
      { key: "infos", name: "Infos pratiques", blocks: [
        PH("Infos pratiques"),
        ["misc:hours", { title: "Horaires de l'école", rows: [["Lundi, mardi, jeudi, vendredi", "8 h 30 – 11 h 45 et 13 h 30 – 16 h 30"], ["Mercredi", "Pas de classe"], ["Cantine", "11 h 45 – 13 h 30"]] }],
        ["feat:list2", { title: "À retenir", items: [{ t: "Inscription à la cantine en mairie" }, { t: "Assurance scolaire obligatoire" }, { t: "Carnet de correspondance" }, { t: "Fournitures par classe" }] }],
      ] },
      { key: "rejoindre", name: "Nous rejoindre", blocks: [
        PH("Nous rejoindre"),
        ["misc:text", { title: "Chaque parent peut aider", paras: ["Vous avez dix minutes ou une heure ? Il y a toujours une tâche pour vous.", "Les réunions ont lieu le premier mardi du mois à 20 h, salle polyvalente."] }],
        CONTACT("Écrivez-nous", "Je veux aider", "Envoyer"),
      ] },
    ],
  },
  // 13. Paroisse (sombre)
  {
    key: "clocher-sainte-claire", name: "Sainte-Claire", category: "association", tags: ["sombre", "classique"], siteType: "Paroisse / lieu de culte",
    description: "Paroisse en bleu nuit et or doux, titres Cinzel solennels, horaires des offices en avant, bandeau plein cadre et agenda liturgique avec accueil de tous.",
    brand: "Paroisse Sainte-Claire",
    tokens: { colors: { primary: "#e0b04a", secondary: "#1c2447", accent: "#9fb4f0", background: "#0f1530", surface: "#18204a", text: "#f3eee0", muted: "#c3c7de" }, fonts: { heading: "font.cinzel", body: "font.crimson-text", button: "font.cinzel", link: "font.crimson-text" }, radius: R(2, 4, 6, 2, 2, 4), shadow: { card: "none", button: "none" }, type: { body: { size: 18 } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "clocher-sainte-claire", motifs: ["arches", "rays", "bokeh"] },
    head: ["head:minimal", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Offices", "/offices"], ["Vie paroissiale", "/vie"], ["Sacrements", "/sacrements"], ["Contact", "/contact"]], cta: ["Nous contacter", "/contact"],
    contact: { address: "Place de l'Église, 51100 Reims", phone: "03 26 00 32 18", email: "accueil@paroisse-sainte-claire.example", hours: "Accueil au presbytère : mardi au vendredi, 9 h – 12 h", tagline: "Une communauté ouverte à tous." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Paroisse Sainte-Claire", title: "Une communauté qui accueille, écoute et prie.", sub: "Au cœur de la ville depuis 1862, notre paroisse est ouverte à toutes et à tous, croyants ou simplement curieux.", cta: ["Les horaires", "/offices"], cta2: ["Nous contacter", "/contact"] }],
        ["misc:hours", { title: "Horaires des messes", rows: [["Samedi", "18 h 30"], ["Dimanche", "9 h 30 et 11 h"], ["Semaine", "Mardi au vendredi, 8 h 30"], ["Confessions", "Samedi, 17 h – 18 h"]] }],
        ["feat:steps", { title: "Au fil de l'année", items: [{ t: "Avent", x: "Veillées et crèche vivante.", d: "Décembre" }, { t: "Carême", x: "Chemin de croix et partage.", d: "Mars" }, { t: "Pâques", x: "Vigile pascale, nuit lumineuse.", d: "Avril" }, { t: "Pèlerinage", x: "Marche vers la cathédrale.", d: "Septembre" }] }],
        ["misc:text", { eyebrow: "Notre mission", title: "Servir tous les habitants", paras: ["Catéchèse, accompagnement des familles en deuil, visite des malades et aide aux personnes isolées : la paroisse est présente au quotidien.", "Les célébrations sont ouvertes aux visiteurs, y compris les touristes."] }],
        ["cta:card", { title: "Besoin de parler ?", sub: "Un prêtre ou un laïc vous reçoit au presbytère, sans rendez-vous.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "offices", name: "Offices", blocks: [
        PH("Offices et célébrations"),
        ["misc:story", { eyebrow: "À propos", title: "La paroisse au quotidien", paras: ["Des bénévoles de tous âges font vivre la maison commune toute l'année."], image: "portrait-1" }],
        ["misc:schedule", { title: "Cette semaine", items: [{ d: "Mar. 8 h 30", t: "Messe", x: "Chapelle latérale." }, { d: "Jeu. 18 h", t: "Adoration", x: "Temps de silence." }, { d: "Sam. 18 h 30", t: "Messe anticipée", x: "Avec chorale des jeunes." }, { d: "Dim. 11 h", t: "Messe des familles", x: "Éveil à la foi pour les enfants." }] }],
        ["feat:rows", { title: "Musique et chants", items: [{ t: "Chorale paroissiale", x: "Répétition le mercredi à 20 h." }, { t: "Orgue", x: "Concerts gratuits un dimanche par mois." }] }],
      ] },
      { key: "vie", name: "Vie paroissiale", blocks: [
        PH("Vie paroissiale"),
        ["feat:cards", { title: "Groupes et services", items: [{ t: "Catéchèse", x: "Enfants et adolescents, le mercredi.", icon: "book" }, { t: "Solidarité", x: "Repas du jeudi et vestiaire.", icon: "heart" }, { t: "Jeunes", x: "Scouts et aumônerie.", icon: "users" }] }],
        ["misc:posts", { title: "Informations", count: 3, layout: "list" }],
      ] },
      { key: "sacrements", name: "Sacrements", blocks: [
        PH("Sacrements et démarches"),
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Comment demander un baptême ?", x: "Contactez le secrétariat deux mois avant la date souhaitée." }, { t: "Mariage : quelles étapes ?", x: "Rencontre avec un prêtre et préparation en couple." }, { t: "Obsèques", x: "Le prêtre vous reçoit dès que possible." }] }],
        ["cta:band", { title: "Prendre rendez-vous", cta: ["Écrire à la paroisse", "/contact"] }],
      ] },
    ],
  },
  // 14. Club de service
  {
    key: "cercle-bienfaisant", name: "Cercle Aubier", category: "association", tags: ["luxe", "classique"], siteType: "Club de service",
    description: "Club de service en lie-de-vin et crème, serif Prata de prestige, annonce de gala avec compte à rebours, actions de solidarité locales et présentation des membres.",
    brand: "Cercle Aubier, club de service",
    tokens: { colors: { primary: "#a31545", secondary: "#3a0d1b", accent: "#c9a24f", background: "#fbf5f2", surface: "#ffffff", text: "#2b141b", muted: "#5f464e" }, fonts: { heading: "font.prata", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: R(2, 4, 8, 4, 4, 6), shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "cercle-bienfaisant", motifs: ["ribbons", "plates", "arches"] },
    head: ["head:bar", {}],
    foot: ["foot:columns", { about: "Club de service : des bénévoles de tous métiers qui organisent des événements pour financer des actions locales. Site de démonstration.", cols: [["Le club", "Nos actions", "Nos membres", "Agenda"], ["Rejoindre", "Devenir invité", "Contact", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Nos actions", "/actions"], ["Les membres", "/membres"], ["Agenda", "/agenda"], ["Rejoindre", "/rejoindre"]], cta: ["Rejoindre le club", "/rejoindre"],
    contact: { address: "Hôtel de l'Aubier, 18 cours de la République, 13100 Aix-en-Provence", phone: "04 42 00 63 09", email: "secretariat@cercle-aubier.example", hours: "Réunions : le deuxième jeudi du mois, 19 h 30", tagline: "Servir d'abord." },
    social: ["linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:countdown", { eyebrow: "Grand dîner de bienfaisance", title: "Le gala du Cercle Aubier", sub: "Une soirée pour financer des fauteuils roulants sportifs et des bourses d'études pour les jeunes du département.", until: "2027-03-20T19:30:00+01:00", cta: ["Réserver une table", "/contact"], cta2: ["Voir les actions", "/actions"] }],
        ["proof:stats", { title: "Notre impact local (exemples)", items: [["92 000 €", "reversés en cinq ans"], ["38", "jeunes boursiers"], ["5", "associations soutenues"]] }],
        ["feat:alt", { title: "Où va l'argent collecté", items: [{ t: "Bourses d'études", x: "Un soutien annuel pour des lycéens motivés de familles modestes.", link: ["Voir les actions", "/actions"] }, { t: "Matériel adapté", x: "Fauteuils sportifs et équipement pour clubs handisport.", link: ["En savoir plus", "/actions"] }] }],
        ["proof:quotes", { title: "Ils en témoignent", items: [{ q: "Une bourse du Cercle m'a permis de finir mes études sans travailler la nuit.", n: "Clara M.", r: "Boursière, cliente fictive" }, { q: "Le club est sérieux, convivial et sans prétention.", n: "Olivier D.", r: "Membre, client fictif" }] }],
        ["gal:wall", { title: "Événements du club", items: [{ t: "Tournoi de pétanque" }, { t: "Remise des bourses" }, { t: "Marché de Noël" }, { t: "Dîner de gala" }] }],
        ["cta:band", { title: "Rejoignez-nous pour une réunion", sub: "Invités bienvenus, sans engagement.", cta: ["Devenir invité", "/rejoindre"] }],
      ] },
      { key: "actions", name: "Nos actions", blocks: [
        PH("Nos actions", "Collecter ensemble, agir près de chez nous."),
        ["feat:rows", { title: "Actions de l'année", items: [{ t: "Tournoi de pétanque", x: "En mai, au profit d'un club handisport." }, { t: "Marché de Noël", x: "Stands tenus par les membres." }, { t: "Remise des bourses", x: "Cérémonie en septembre à la mairie." }, { t: "Dîner de gala", x: "Soirée annuelle, tombola et vente aux enchères." }] }],
        ["misc:text", { title: "Transparence", paras: ["Les frais de fonctionnement sont couverts par les cotisations, afin que chaque euro collecté soit reversé aux actions.", "Le bilan est présenté chaque année en assemblée."] }],
      ] },
      { key: "membres", name: "Les membres", blocks: [
        PH("Les membres"),
        ["proof:team", { title: "Le bureau", items: [{ n: "Henri Valcourt", r: "Président" }, { n: "Sophie Landry", r: "Secrétaire" }, { n: "Rémi Castel", r: "Trésorier" }] }],
        ["proof:logos", { title: "Associations soutenues", items: ["Athlétisme pour tous", "Les Petits Débrouillards du Sud", "Fauteuils en piste", "Croix du Midi", "Lycéens d'avenir"] }],
      ] },
      { key: "agenda", name: "Agenda", blocks: [
        PH("Agenda"),
        ["misc:schedule", { title: "À venir", items: [{ d: "12 nov.", t: "Réunion mensuelle", x: "Présentation d'une association." }, { d: "5 déc.", t: "Marché de Noël", x: "Place de la Mairie." }, { d: "20 mars", t: "Dîner de gala", x: "Hôtel de l'Aubier." }] }],
        ["cta:card", { title: "Réserver pour le gala", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "rejoindre", name: "Rejoindre", blocks: [
        PH("Rejoindre le club"),
        ["feat:steps", { title: "Devenir membre", items: [{ t: "Assister à une réunion", x: "Comme invité.", d: "1" }, { t: "Être parrainé", x: "Par un membre.", d: "2" }, { t: "Intégrer le club", x: "Vote du bureau et cotisation annuelle.", d: "3" }] }],
        CONTACT("Écrivez-nous", "Votre demande", "Envoyer"),
      ] },
    ],
  },
].map((t) => {
  if (!t.pages.some((p) => p.key === "contact")) {
    t.pages.push({ key: "contact", name: "Contact", blocks: [PH("Contact", "Une question, une proposition : écrivez-nous."), CONTACT("Nous trouver", "Écrire à l'équipe", "Envoyer"), ["cta:band", { title: "Merci de votre message", sub: "Nous vous répondons rapidement.", cta: ["Retour à l'accueil", "/"] }]] });
  }
  return t;
});
