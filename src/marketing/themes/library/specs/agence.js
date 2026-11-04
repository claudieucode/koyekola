// Agences (lot A) : 11 fiches de DÉMONSTRATION. Agences, personnes et coordonnées fictives.
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const C = (address, phone, email, hours, tagline) => ({ address, phone, email, hours, tagline });
const contactPage = (sub, formTitle, addr, bg) => ({ key: "contact", name: "Contact", blocks: [
  ph("Contact", sub),
  ["contact:info", { title: "Écrivez-nous", formTitle, formIntro: "Quelques lignes suffisent, nous répondons sous 48 h.", cta: ["Envoyer", "/contact"] }],
  ["contact:map", { mapAddress: addr }],
] });

module.exports = [
  // 1. SEO / SEA
  {
    key: "rangeo", name: "Rangéo", category: "agence", tags: ["technique", "moderne"], siteType: "Agence SEO et SEA",
    description: "Agence de référencement naturel et payant : en-tête d'information, champ d'audit en accueil, onglets de services et tableau comparatif SEO/SEA sur palette verte nette.",
    brand: "Rangéo",
    tokens: { colors: { primary: "#166534", secondary: "#0b2e1c", accent: "#f59e0b", background: "#f5faf6", surface: "#ffffff", text: "#10241a", muted: "#4a5f53" }, fonts: { heading: "font.bricolage-grotesque", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 12 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.05, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "rangeo", motifs: ["tiles", "topo", "rays"] },
    head: ["head:topbar", { info: "Audit de visibilité offert pour tout nouveau projet", note: "Lille · 03 20 00 45 12" }],
    foot: ["foot:columns", { about: "Rangéo, agence SEO et SEA à Lille : visibilité mesurable, rapports lisibles.", cols: [["Services", "Audit SEO", "Netlinking", "Google Ads"], ["Agence", "Méthode", "Tarifs", "Contact"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Méthode", "/methode"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un audit", "/contact"],
    contact: C("22 rue Esquermoise, 59800 Lille", "03 20 00 45 12", "audit@rangeo.example", "Du lundi au vendredi, 9 h – 18 h", "Soyez trouvé par ceux qui vous cherchent."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Agence SEO & SEA · Lille", title: "Passez en première page, durablement.", sub: "Audit technique, contenus et campagnes payantes pilotés par la donnée.", placeholder: "Adresse de votre site (exemple : mon-site.example)", cta: ["Lancer l'audit", "/contact"], image: "hero" }],
        ["proof:logos", { title: "Ils nous font confiance (clients fictifs)", items: ["Cave du Beffroi", "Menuiseries Lambin", "Clinique Vet'Nord", "Librairie Quai 9", "Transports Delcourt"] }],
        ["feat:tabs", { eyebrow: "Services", title: "Quatre leviers, un seul tableau de bord", items: [{ t: "SEO technique", x: "Crawl, vitesse, données structurées, indexation : nous corrigeons ce qui bloque Google." }, { t: "Contenus", x: "Plan éditorial fondé sur l'intention de recherche, rédigé par des spécialistes du secteur." }, { t: "Netlinking", x: "Liens obtenus par relations presse et partenariats, jamais achetés en masse." }, { t: "Google Ads", x: "Campagnes Search et Shopping, suivi des conversions et enchères ajustées chaque semaine." }] }],
        ["proof:statsbar", { items: [["+142 %", "de trafic organique en 12 mois (exemple)"], ["38", "sites suivis"], ["-27 %", "de coût par lead en SEA (exemple)"]] }],
        ["feat:compare", { title: "SEO ou SEA ?", intro: "Les deux se complètent : voici comment nous arbitrons.", rows: [["", "SEO", "SEA"], ["Délai des premiers résultats", "3 à 6 mois", "Quelques jours"], ["Coût au clic", "Aucun", "Payé à chaque clic"], ["Durée des effets", "Longue", "Tant que le budget court"]] }],
        ["cta:card", { title: "Combien de clients vous échappent ?", sub: "Recevez un audit chiffré de votre visibilité sous cinq jours ouvrés.", cta: ["Demander l'audit", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ph("Services", "Du diagnostic au reporting mensuel."),
        ["feat:cards", { title: "Ce que nous prenons en charge", items: [{ t: "Audit SEO", x: "Rapport priorisé en quick wins et chantiers.", icon: "search" }, { t: "Refonte sans perte", x: "Plan de redirections et migration encadrée.", icon: "gitBranch" }, { t: "SEO local", x: "Fiches établissement, avis, pages de villes.", icon: "mapPin" }, { t: "Google Ads", x: "Search, Shopping, remarketing.", icon: "trendingUp" }, { t: "Analytics", x: "Suivi des conversions et tableaux de bord.", icon: "barChart" }, { t: "Formation", x: "Montée en compétence de vos équipes.", icon: "graduation" }] }],
        ["feat:alt", { title: "Deux missions types", items: [{ t: "Cave du Beffroi : relancer la vente en ligne", x: "Refonte des fiches produits et campagnes Shopping : les ventes en ligne doublent en huit mois (exemple).", link: ["Nous contacter", "/contact"] }, { t: "Menuiseries Lambin : être trouvé localement", x: "Pages par ville et avis clients : trois fois plus d'appels qualifiés (exemple)." }] }],
        ["cta:band", { title: "Un site à faire remonter ?", cta: ["Parlons-en", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ph("Méthode", "Mesurer d'abord, agir ensuite."),
        ["feat:steps", { title: "Une mission en cinq étapes", items: [{ t: "Audit", d: "Semaine 1", x: "Technique, contenus, concurrence et mots-clés." }, { t: "Feuille de route", d: "Semaine 2", x: "Chantiers classés par impact et effort." }, { t: "Corrections", d: "Mois 1-2", x: "Mise en oeuvre avec vos équipes ou les nôtres." }, { t: "Production", d: "Mois 2-6", x: "Contenus, liens, campagnes." }, { t: "Reporting", d: "Chaque mois", x: "Un rapport de dix lignes, pas de dix pages." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Garantissez-vous la première place ?", x: "Non, personne ne le peut honnêtement. Nous nous engageons sur une méthode et des indicateurs suivis." }, { t: "Faut-il changer de site ?", x: "Rarement : nous optimisons d'abord l'existant." }, { t: "Quel budget publicitaire prévoir ?", x: "À partir de 600 € par mois pour tester, ajusté selon vos marges." }] }],
        ["proof:quotes", { items: [{ q: "Des rapports clairs et des résultats qu'on voit dans le chiffre d'affaires.", n: "Marc L.", r: "gérant, client fictif" }, { q: "Enfin une agence qui explique ce qu'elle fait.", n: "Sonia T.", r: "directrice marketing, cliente fictive" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Forfaits mensuels d'exemple, sans engagement de durée au-delà de six mois."),
        ["price:tiers", { items: [{ t: "Départ", price: "790 €", period: "/ mois", x: "Pour un site vitrine", f: ["Audit initial", "4 contenus par trimestre", "Rapport mensuel"], cta: ["Choisir", "/contact"] }, { t: "Croissance", price: "1 690 €", period: "/ mois", x: "SEO + Google Ads", hl: true, f: ["Tout Départ", "Gestion Google Ads", "Netlinking", "Point bimensuel"], cta: ["Choisir", "/contact"] }, { t: "Sur mesure", price: "Sur devis", x: "Multi-sites ou e-commerce", f: ["Equipe dédiée", "Données sur mesure", "Formation"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:list2", { title: "Toujours inclus", items: [{ t: "Accès à vos données" }, { t: "Rapports en français clair" }, { t: "Pas de frais cachés" }, { t: "Préavis d'un mois" }] }],
        ["cta:split", { title: "Besoin d'un devis précis ?", sub: "Décrivez votre site, nous chiffrons sous trois jours.", cta: ["Demander un devis", "/contact"] }],
      ] },
      contactPage("Parlons de votre visibilité.", "Demande d'audit", "22 rue Esquermoise, 59800 Lille"),
    ],
  },

  // 2. Social media (sombre)
  {
    key: "noctiluque", name: "Noctiluque Social", category: "agence", tags: ["sombre", "audacieux"], siteType: "Agence social media", isNew: true,
    description: "Agence social media en thème sombre violet : barre flottante, collage d'images en accueil, bento de services et carrousel de campagnes.",
    brand: "Noctiluque",
    tokens: { colors: { primary: "#a78bfa", secondary: "#241b3a", accent: "#f472b6", background: "#15111f", surface: "#1f1830", text: "#f3effa", muted: "#b9afd0" }, fonts: { heading: "font.syne", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 14, card: 22 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.02, letterSpacing: -0.03, transform: "none" } } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "pill" }, art: { seed: "noctiluque", motifs: ["bokeh", "blobs", "mesh"] },
    head: ["head:float", {}],
    foot: ["foot:newsletter", { title: "Les coulisses du feed", sub: "Une lettre par mois : formats qui marchent, algorithmes décryptés.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Campagnes", "/campagnes"], ["Offres", "/offres"], ["Équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Booster ma communauté", "/contact"],
    contact: C("14 quai de la Fosse, 44000 Nantes", "02 40 00 77 31", "hello@noctiluque.example", "Du lundi au vendredi, 10 h – 19 h", "Des communautés qui s'allument."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Agence social media · Nantes", title: "Votre marque, là où ça scrolle.", sub: "Stratégie, création de formats courts et animation de communauté sur Instagram, TikTok et LinkedIn.", cta: ["Voir nos campagnes", "/campagnes"], cta2: ["Nos offres", "/offres"] }],
        ["feat:bento", { eyebrow: "Services", title: "Tout le feed, de l'idée au commentaire", items: [{ t: "Création de contenus", x: "Reels, carrousels, stories : un calendrier éditorial tourné et monté par nos équipes." }, { t: "Community management", x: "Réponses, modération, veille." }, { t: "Publicité sociale", x: "Campagnes Meta et TikTok Ads optimisées." }] }],
        ["gal:carousel", { title: "Campagnes récentes", items: [{ t: "Brasserie Zéphyr", x: "Lancement d'une bière de saison", tag: "TikTok" }, { t: "Studio Orbe", x: "Ouverture d'un studio de yoga", tag: "Instagram" }, { t: "Cycles Lemoine", x: "Série vidéo atelier vélo", tag: "Reels" }, { t: "Maison Camus", x: "Recrutement en marque employeur", tag: "LinkedIn" }] }],
        ["proof:quotes", { items: [{ q: "Notre communauté a triplé en six mois, et surtout elle nous répond.", n: "Anaïs P.", r: "fondatrice, cliente fictive" }, { q: "Des vidéos qui ressemblent à notre atelier.", n: "Thomas L.", r: "artisan, client fictif" }] }],
        ["cta:image", { title: "On lance votre prochain Reel ?", sub: "Premier atelier d'idées offert.", cta: ["Réserver l'atelier", "/contact"] }],
      ] },
      { key: "campagnes", name: "Campagnes", blocks: [
        ph("Campagnes", "Quelques histoires racontées en images."),
        ["gal:masonry", { items: [{ t: "Brasserie Zéphyr", x: "Lancement saisonnier" }, { t: "Studio Orbe", x: "Ouverture" }, { t: "Cycles Lemoine", x: "Série vidéo" }, { t: "Maison Camus", x: "Marque employeur" }, { t: "Épicerie Louve", x: "Concours local" }] }],
        ["proof:stats", { title: "Résultats d'exemple", items: [["x3", "abonnés en 6 mois"], ["5,8 %", "taux d'engagement moyen"], ["1,2 M", "vues cumulées"]] }],
        ["feat:rows", { title: "Comment nous travaillons un format", items: [{ t: "Repérer", x: "Veille sur les tendances de votre secteur." }, { t: "Scénariser", x: "Hook, rythme, appel à l'action." }, { t: "Tourner", x: "Tournages groupés d'une demi-journée." }, { t: "Mesurer", x: "Rétention, partages, clics." }] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ph("Offres", "Trois niveaux d'accompagnement, tarifs d'exemple."),
        ["price:tiers", { items: [{ t: "Étincelle", price: "690 €", period: "/ mois", f: ["2 réseaux", "8 publications", "Modération"], cta: ["Choisir", "/contact"] }, { t: "Aurore", price: "1 450 €", period: "/ mois", hl: true, f: ["3 réseaux", "12 publications + 4 vidéos", "Publicité sociale (hors budget média)"], cta: ["Choisir", "/contact"] }, { t: "Nébuleuse", price: "Sur devis", f: ["Multi-marques", "Influence", "Studio de tournage"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Le budget média est-il inclus ?", x: "Non, il est payé directement aux plateformes." }, { t: "Qui valide les publications ?", x: "Vous, via un calendrier partagé." }, { t: "Peut-on arrêter quand on veut ?", x: "Oui, avec un préavis d'un mois." }] }],
        ["cta:band", { title: "Choisissons votre formule.", cta: ["Parler à l'équipe", "/contact"] }],
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        ph("L'équipe", "Des créatifs qui scrollent aussi le dimanche."),
        ["proof:team", { items: [{ n: "Inès Marchand", r: "Directrice de la stratégie" }, { n: "Yanis Kader", r: "Réalisateur vidéo" }, { n: "Lola Fernand", r: "Community manager" }, { n: "Hugo Pélissier", r: "Spécialiste publicité" }] }],
        ["misc:text", { eyebrow: "Notre façon de faire", title: "Moins de posts, plus de sens", paras: ["Nous préférons huit contenus qui parlent à votre communauté plutôt que trente qui remplissent un calendrier.", "Chaque mois, un rapport simple relie nos actions à vos objectifs."] }],
        ["feat:checks", { title: "Nos engagements", cta: ["Nous rencontrer", "/contact"], items: [{ t: "Reporting mensuel clair" }, { t: "Droits d'utilisation inclus" }, { t: "Un interlocuteur unique" }] }],
      ] },
      contactPage("Dites-nous ce que vous voulez raconter.", "Parlez-nous de votre marque", "14 quai de la Fosse, 44000 Nantes"),
    ],
  },

  // 3. Branding
  {
    key: "vermeil-atelier", name: "Vermeil Atelier", category: "agence", tags: ["chaleureux", "editorial"], siteType: "Agence de branding et identité visuelle",
    description: "Atelier d'identité visuelle aux grands titres Gloock sur fond crème : accueil en bandeau secondaire, études de cas mises en avant et pied de page à grand nom.",
    brand: "Vermeil Atelier",
    tokens: { colors: { primary: "#b3261e", secondary: "#2a1512", accent: "#e0a23a", background: "#faf3ee", surface: "#ffffff", text: "#261512", muted: "#66534d" }, fonts: { heading: "font.gloock", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 0, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.05, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "vermeil", motifs: ["plates", "ribbons", "arches"] },
    head: ["head:center", {}], foot: ["foot:big", { title: "Vermeil" }],
    menu: [["Accueil", "/"], ["Projets", "/projets"], ["Démarche", "/demarche"], ["Formules", "/formules"], ["Contact", "/contact"]], cta: ["Créer ma marque", "/contact"],
    contact: C("5 place Sathonay, 69001 Lyon", "04 72 00 31 18", "atelier@vermeil.example", "Du mardi au vendredi, 9 h – 17 h 30", "Des identités qui ont du caractère."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Atelier d'identité · Lyon", title: "Une marque se reconnaît à son accent.", sub: "Nous dessinons logotypes, palettes et univers graphiques pour les entreprises qui veulent un visage.", cta: ["Voir les projets", "/projets"], image: "hero" }],
        ["gal:featured", { eyebrow: "Projets", title: "Identités récentes", items: [{ t: "Fromagerie Vercors Douce", x: "Identité et étiquettes" }, { t: "Cabinet Lorin", x: "Papeterie" }, { t: "Brasserie du Pont", x: "Packaging" }, { t: "Festival Tempo", x: "Affiches" }] }],
        ["feat:steps", { title: "Le chemin d'une identité", items: [{ t: "Immersion", d: "Semaine 1", x: "Visite, entretiens et analyse du marché." }, { t: "Pistes", d: "Semaines 2-4", x: "Trois directions graphiques explorées." }, { t: "Affinage", d: "Semaines 5-7", x: "Une direction retenue, déclinée." }, { t: "Livraison", d: "Semaine 8", x: "Fichiers, guide de marque, passation." }] }],
        ["proof:big", { items: [{ q: "Notre logo tient enfin sur un camion comme sur une étiquette de pot.", n: "Roxane D.", r: "gérante, cliente fictive" }] }],
        ["cta:split", { title: "Votre marque mérite un visage.", sub: "Premier rendez-vous d'une heure, sans engagement.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ph("Projets", "Identités, packagings et éditions."),
        ["gal:cards", { items: [{ t: "Fromagerie Vercors Douce", x: "Du blason aux étiquettes", tag: "Identité" }, { t: "Brasserie du Pont", x: "Gamme de six bières", tag: "Packaging" }, { t: "Festival Tempo", x: "Affiches et programme", tag: "Édition" }, { t: "Cabinet Lorin", x: "Papeterie sobre", tag: "Papeterie" }] }],
        ["feat:alt", { title: "Deux études de cas", items: [{ t: "Brasserie du Pont : six couleurs, une famille", x: "Une trame commune et une couleur par recette : la gamme se lit d'un coup d'oeil en rayon.", link: ["Nous écrire", "/contact"] }, { t: "Festival Tempo : un rythme visuel", x: "Affiches modulaires déclinées en signalétique, billetterie et réseaux (exemple)." }] }],
        ["cta:band", { title: "Votre histoire en couleurs ?", cta: ["Démarrer", "/contact"] }],
      ] },
      { key: "demarche", name: "Démarche", blocks: [
        ph("Démarche", "Peu de mots, des choix assumés."),
        ["misc:story", { eyebrow: "Depuis 2013", title: "Un atelier à taille humaine", paras: ["Vermeil réunit quatre designers et une rédactrice dans une ancienne imprimerie de la Croix-Rousse.", "Nous croyons aux identités simples, déclinables et fabriquées avec soin."], image: "portrait-1" }],
        ["feat:numbered", { title: "Nos principes", items: [{ t: "Moins de formes", x: "Un signe fort vaut mieux que dix détails." }, { t: "Plus de rigueur", x: "Grilles, couleurs et typographies documentées." }, { t: "Toujours transmis", x: "Vos équipes savent utiliser la marque." }] }],
        ["proof:team", { items: [{ n: "Adèle Ravel", r: "Directrice artistique" }, { n: "Mehdi Aouad", r: "Designer" }, { n: "Clémence Baud", r: "Rédactrice" }] }],
      ] },
      { key: "formules", name: "Formules", blocks: [
        ph("Formules", "Budgets indicatifs."),
        ["feat:pricelist", { title: "Ce que nous proposons", intro: "Tarifs d'exemple, devis sur mesure.", items: [{ t: "Logo et charte légère", x: "Logotype, couleurs, polices", price: "À partir de 3 900 €" }, { t: "Identité complète", x: "Plateforme, identité, guide", price: "À partir de 9 800 €" }, { t: "Packaging de gamme", x: "Système et déclinaisons", price: "Sur devis" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Combien de pistes sont présentées ?", x: "Trois au départ, une retenue ensuite." }, { t: "Les droits sont-ils cédés ?", x: "Oui, à la livraison finale." }] }],
        ["cta:card", { title: "Un budget en tête ?", sub: "Dites-le-nous, nous adapterons la mission.", cta: ["Nous contacter", "/contact"] }],
      ] },
      contactPage("Racontez-nous votre marque.", "Parlez-nous de votre projet", "5 place Sathonay, 69001 Lyon"),
    ],
  },

  // 4. Studio de design graphique
  {
    key: "grille-douze", name: "Studio Grille 12", category: "agence", tags: ["geometrique", "audacieux"], siteType: "Studio de design graphique",
    description: "Studio de design graphique en bleu cobalt : accueil typographique sans image, mur de projets carrés, bandes de services et en-tête à menu scindé.",
    brand: "Grille 12",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0b1437", accent: "#ffd23f", background: "#f3f1ec", surface: "#ffffff", text: "#0e1320", muted: "#525a6b" }, fonts: { heading: "font.unbounded", body: "font.manrope", button: "font.manrope", link: "font.manrope" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.05, letterSpacing: -0.03, transform: "uppercase" } }, border: { width: 2, color: "#0e1320" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "grille12", motifs: ["tiles", "halftone", "plates"] },
    head: ["head:split", {}], foot: ["foot:line", {}],
    menu: [["Projets", "/projets"], ["Disciplines", "/disciplines"], ["Studio", "/studio"], ["Contact", "/contact"]], cta: ["Un brief ?", "/contact"],
    contact: C("31 rue des Juifs, 67000 Strasbourg", "03 88 00 62 40", "brief@grille12.example", "Du lundi au vendredi, 9 h – 18 h", "Mise en page, affiche, édition, signalétique."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Studio de design graphique · Strasbourg", title: "Douze colonnes, mille idées.", sub: "Affiches, éditions, identités et signalétique pour la culture, l'industrie et les institutions.", cta: ["Voir les projets", "/projets"], cta2: ["Envoyer un brief", "/contact"] }],
        ["gal:wall", { title: "Dernières sorties", items: [{ t: "Affiche Biennale" }, { t: "Catalogue Atelier" }, { t: "Signalétique Gare 9" }, { t: "Rapport annuel Rhénalia" }] }],
        ["feat:strips", { title: "Disciplines", items: [{ t: "Affiche et campagne", x: "Visuels forts pour les lieux et les événements." }, { t: "Édition et mise en page", x: "Livres, catalogues, rapports d'activité." }, { t: "Identité et signalétique", x: "Systèmes cohérents du logo au mur." }] }],
        ["proof:stats", { items: [["16 ans", "de studio"], ["240", "éditions (exemple)"], ["7", "prix de design reçus (exemple)"]] }],
        ["cta:band", { title: "Un brief sur la table ?", cta: ["Nous l'envoyer", "/contact"] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ph("Projets"),
        ["gal:grid", { items: [{ t: "Affiche Biennale", x: "Typographie et trame" }, { t: "Catalogue Atelier", x: "Édition de 160 pages" }, { t: "Signalétique Gare 9", x: "Parcours piétons" }, { t: "Rhénalia", x: "Rapport annuel" }, { t: "Opéra de poche", x: "Saison culturelle" }, { t: "Fonderie Klein", x: "Identité" }] }],
        ["feat:alt", { title: "En détail", items: [{ t: "Rapport annuel Rhénalia", x: "Une grille stricte, des graphiques en couleurs pleines, une lecture fluide pour des chiffres austères.", link: ["Nous écrire", "/contact"] }, { t: "Signalétique Gare 9", x: "Pictogrammes dessinés sur mesure et code couleur par quai (exemple)." }] }],
        ["cta:split", { title: "Un projet à imprimer ?", sub: "Nous suivons la fabrication jusqu'à l'imprimerie.", cta: ["Parler au studio", "/contact"] }],
      ] },
      { key: "disciplines", name: "Disciplines", blocks: [
        ph("Disciplines", "Un savoir-faire à chaque échelle."),
        ["feat:grid-icons", { title: "Ce que nous dessinons", items: [{ t: "Identités", x: "Logos et chartes.", icon: "palette" }, { t: "Éditions", x: "Livres et rapports.", icon: "book" }, { t: "Affiches", x: "Campagnes culturelles.", icon: "image" }, { t: "Interfaces", x: "Maquettes de sites.", icon: "layout" }] }],
        ["feat:pricelist", { title: "Repères tarifaires", intro: "Montants d'exemple hors taxes.", items: [{ t: "Affiche (conception)", x: "Formats multiples, droits inclus", price: "À partir de 1 400 €" }, { t: "Édition (par page)", x: "Mise en page, correction des épreuves", price: "À partir de 38 €" }, { t: "Identité", x: "Logo, charte, déclinaisons", price: "À partir de 4 500 €" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Livrez-vous les fichiers ouverts ?", x: "Oui, sur demande, à la fin de la mission." }, { t: "Gérez-vous l'impression ?", x: "Oui, avec nos imprimeurs partenaires." }] }],
      ] },
      { key: "studio", name: "Studio", blocks: [
        ph("Le studio"),
        ["misc:story", { eyebrow: "Depuis 2010", title: "Six personnes, une règle : la lisibilité", paras: ["Grille 12 est installé dans un ancien atelier de typographie, rue des Juifs.", "Nous aimons les contraintes : un format, une trame, un papier."], image: "portrait-2" }],
        ["proof:team", { items: [{ n: "Paul Wenger", r: "Directeur artistique" }, { n: "Maëlle Roth", r: "Designer éditoriale" }, { n: "Karim Sahli", r: "Designer interfaces" }] }],
        ["proof:quotes", { items: [{ q: "Un catalogue qui se lit comme un film.", n: "Isabelle N.", r: "conservatrice, cliente fictive" }] }],
      ] },
      contactPage("Envoyez-nous votre brief.", "Votre brief en quelques lignes", "31 rue des Juifs, 67000 Strasbourg"),
    ],
  },

  // 5. Contenu / rédaction
  {
    key: "encrier-vif", name: "Encrier Vif", category: "agence", tags: ["editorial", "classique"], siteType: "Agence de contenu et de rédaction",
    description: "Agence de rédaction web au style presse : bandeau de journal, accueil éditorial, derniers articles du blog réels et palette sarcelle sobre.",
    brand: "Encrier Vif",
    tokens: { colors: { primary: "#0f766e", secondary: "#12312f", accent: "#f2a33a", background: "#f4f9f8", surface: "#ffffff", text: "#11201f", muted: "#4b5f5d" }, fonts: { heading: "font.newsreader", body: "font.epilogue", button: "font.epilogue", link: "font.epilogue" }, radius: { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 58, weight: 500, lineHeight: 1.06, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "encriervif", motifs: ["waves", "botanical", "topo"] },
    head: ["head:masthead", { dateline: "Rédaction web, éditoriaux et newsletters · Rennes" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Journal", "/journal"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Commander un texte", "/contact"],
    contact: C("9 rue Saint-Georges, 35000 Rennes", "02 99 00 28 66", "redaction@encrier-vif.example", "Du lundi au vendredi, 9 h – 17 h 30", "Des mots justes pour des marques vivantes."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Agence de contenu · Rennes", title: "Des textes qui se lisent jusqu'au bout.", sub: "Articles de blog, pages de site, livres blancs et newsletters, écrits par des journalistes et des spécialistes du métier.", cta: ["Voir les prestations", "/prestations"], image: "hero" }],
        ["misc:posts", { title: "Dans notre journal", count: 3, layout: "grid" }],
        ["feat:numbered", { title: "Notre promesse en trois points", items: [{ t: "Un angle", x: "Chaque texte défend une idée claire." }, { t: "Des sources", x: "Les chiffres sont vérifiés et cités." }, { t: "Une voix", x: "Le texte sonne comme votre marque." }] }],
        ["proof:quotes", { items: [{ q: "Nos articles généraient du trafic, désormais ils génèrent des demandes.", n: "Delphine V.", r: "responsable marketing, cliente fictive" }, { q: "Un style précis et des délais tenus.", n: "Eric M.", r: "éditeur, client fictif" }] }],
        ["cta:card", { title: "Un sujet à traiter ?", sub: "Envoyez-nous votre brief, nous proposons trois angles.", cta: ["Proposer un sujet", "/contact"] }],
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        ph("Prestations", "Tous les formats d'écriture professionnelle."),
        ["feat:rows", { title: "Ce que nous écrivons", items: [{ t: "Articles de blog", x: "800 à 2 000 mots optimisés pour la recherche." }, { t: "Pages de site", x: "Accueil, offres, pages de services." }, { t: "Livres blancs", x: "Dossiers de 10 à 30 pages mis en forme." }, { t: "Newsletters", x: "Ligne éditoriale et rédaction récurrente." }, { t: "Interviews et témoignages", x: "Récits clients validés par vos soins." }] }],
        ["feat:checks", { title: "Notre processus éditorial", cta: ["Briefer la rédaction", "/contact"], items: [{ t: "Brief et ligne éditoriale" }, { t: "Plan validé avant rédaction" }, { t: "Deux relectures incluses" }, { t: "Livraison prête à publier" }] }],
        ["proof:stats", { items: [["1 400", "articles publiés (exemple)"], ["22", "rédacteurs spécialisés"], ["48 h", "délai moyen d'un brief"]] }],
      ] },
      { key: "journal", name: "Journal", blocks: [
        ph("Journal", "Conseils d'écriture et décryptages."),
        ["misc:posts", { title: "Tous nos articles", count: 6, layout: "list" }],
        ["misc:quote", { text: "Écrire pour le web, c'est faire gagner du temps à quelqu'un qui n'en a pas.", by: "Principe de la rédaction" }],
        ["cta:band", { title: "Recevez nos conseils chaque mois.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Prix d'exemple, au mot ou au forfait."),
        ["feat:pricelist", { title: "Grille indicative", items: [{ t: "Article de blog", x: "1 000 mots, sources incluses", price: "180 €" }, { t: "Page de site", x: "Rédaction + titres optimisés", price: "220 €" }, { t: "Livre blanc", x: "15 pages, relectures incluses", price: "2 400 €" }, { t: "Newsletter mensuelle", x: "Un envoi par mois", price: "390 € / mois" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Qui sont vos rédacteurs ?", x: "Des journalistes et des professionnels de chaque secteur." }, { t: "Utilisez-vous des outils d'IA ?", x: "Seulement pour la veille et la structure, jamais pour la signature finale." }] }],
        ["cta:split", { title: "Besoin d'un volume ?", sub: "Forfaits dégressifs au-delà de dix textes par mois.", cta: ["Demander un devis", "/contact"] }],
      ] },
      contactPage("Envoyez-nous votre brief.", "Décrivez votre besoin éditorial", "9 rue Saint-Georges, 35000 Rennes"),
    ],
  },

  // 6. Influence
  {
    key: "sillage-creators", name: "Sillage Créateurs", category: "agence", tags: ["ludique", "chaleureux"], siteType: "Agence d'influence",
    description: "Agence de marketing d'influence en rose profond : image à gauche en accueil, cartes de campagnes, liste de critères de sélection et en-tête latéral.",
    brand: "Sillage",
    tokens: { colors: { primary: "#be185d", secondary: "#3b0a24", accent: "#fbbf24", background: "#fff5f9", surface: "#ffffff", text: "#2a0f1c", muted: "#6b4a5a" }, fonts: { heading: "font.fraunces", body: "font.nunito", button: "font.nunito", link: "font.nunito" }, radius: { sm: 8, md: 16, lg: 24, button: 999, field: 16, card: 24 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.06, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "sillage", motifs: ["blobs", "bokeh", "ribbons"] },
    head: ["head:side", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Créateurs", "/createurs"], ["Campagnes", "/campagnes"], ["Marques", "/marques"], ["Contact", "/contact"]], cta: ["Lancer une campagne", "/contact"],
    contact: C("27 rue de Cléry, 75002 Paris", "01 40 00 18 52", "collab@sillage.example", "Du lundi au vendredi, 9 h 30 – 18 h 30", "La bonne voix pour la bonne marque."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Agence d'influence · Paris", title: "Des créateurs qui aiment vraiment vos produits.", sub: "Sélection, brief, contrat, suivi et mesure : nous orchestrons vos collaborations avec des créateurs de contenu.", cta: ["Voir les campagnes", "/campagnes"], image: "hero" }],
        ["proof:stats", { items: [["600", "créateurs référencés (exemple)"], ["92 %", "de campagnes livrées à temps (exemple)"], ["4,1 %", "d'engagement moyen (exemple)"]] }],
        ["gal:cards", { title: "Collaborations récentes", items: [{ t: "Cosmétique Aube", x: "Routine de saison avec dix créatrices", tag: "Beauté" }, { t: "Maison Sorel", x: "Test d'une gamme de cuisine", tag: "Cuisine" }, { t: "Trottinettes Volt", x: "Défi urbain en vidéo", tag: "Mobilité" }] }],
        ["feat:checks", { title: "Comment nous choisissons", cta: ["Parler de votre cible", "/contact"], items: [{ t: "Audience vérifiée, pas gonflée" }, { t: "Affinité réelle avec la marque" }, { t: "Contenu déclaré, conforme à la loi" }, { t: "Tarifs négociés en toute transparence" }] }],
        ["proof:logos", { title: "Marques accompagnées (fictives)", items: ["Cosmétique Aube", "Maison Sorel", "Volt", "Épicerie Louve", "Atelier Mirabelle"] }],
        ["cta:band", { title: "Votre produit a une histoire à faire raconter.", cta: ["Briefer l'agence", "/contact"] }],
      ] },
      { key: "createurs", name: "Créateurs", blocks: [
        ph("Créateurs", "Rejoignez notre réseau de talents."),
        ["feat:icons", { title: "Pourquoi nous rejoindre", items: [{ t: "Des marques choisies", x: "Pas de collaboration contraire à vos valeurs.", icon: "heart" }, { t: "Paiement sous 30 jours", x: "Contrats clairs et facturation simple.", icon: "coin" }, { t: "Un agent dédié", x: "Un interlocuteur pour négocier.", icon: "user" }, { t: "Formation", x: "Droit, fiscalité et mentions légales.", icon: "graduation" }] }],
        ["feat:steps", { title: "Devenir créateur Sillage", items: [{ t: "Candidature", d: "Jour 1", x: "Lien vers vos réseaux." }, { t: "Entretien", d: "Semaine 1", x: "Appel de présentation." }, { t: "Référencement", d: "Semaine 2", x: "Fiche créateur et premières propositions." }] }],
        ["cta:card", { title: "Prêt·e à collaborer ?", cta: ["Candidater", "/contact"] }],
      ] },
      { key: "campagnes", name: "Campagnes", blocks: [
        ph("Campagnes"),
        ["gal:featured", { items: [{ t: "Cosmétique Aube", x: "Dix créatrices" }, { t: "Maison Sorel", x: "Cuisine" }, { t: "Volt", x: "Mobilité" }, { t: "Mirabelle", x: "Mode" }] }],
        ["feat:alt", { title: "Un cas détaillé", items: [{ t: "Cosmétique Aube : une routine en dix regards", x: "Dix créatrices, dix peaux, un même soin : 1,8 million de vues et un doublement des visites en boutique (exemple).", link: ["En parler", "/contact"] }, { t: "Volt : le défi du centre-ville", x: "Trois créateurs urbains en trottinette, un format vidéo court (exemple)." }] }],
        ["proof:quotes", { items: [{ q: "Les créateurs choisis parlaient vraiment à notre clientèle.", n: "Gaëlle F.", r: "cheffe de marque, cliente fictive" }] }],
      ] },
      { key: "marques", name: "Marques", blocks: [
        ph("Marques", "Une collaboration, du brief au bilan."),
        ["feat:rows", { title: "Notre accompagnement", items: [{ t: "Stratégie", x: "Objectifs, cibles, plateformes." }, { t: "Sélection", x: "Short-list argumentée de créateurs." }, { t: "Contractualisation", x: "Droits, exclusivités, mentions publicitaires." }, { t: "Bilan", x: "Rapport de portée, clics et ventes." }] }],
        ["price:tiers", { items: [{ t: "Test", price: "3 500 €", x: "Hors cachets", f: ["3 créateurs", "Rapport final"], cta: ["Choisir", "/contact"] }, { t: "Campagne", price: "8 900 €", x: "Hors cachets", hl: true, f: ["10 créateurs", "Suivi hebdomadaire", "Bilan chiffré"], cta: ["Choisir", "/contact"] }, { t: "Programme", price: "Sur devis", f: ["Ambassadeurs annuels", "Événements"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Les cachets sont-ils inclus ?", x: "Non, ils sont refacturés au prix coûtant." }, { t: "Respectez-vous la réglementation ?", x: "Oui, chaque contenu porte la mention de partenariat." }] }],
      ] },
      contactPage("Marque ou créateur, écrivez-nous.", "Votre message", "27 rue de Cléry, 75002 Paris"),
    ],
  },

  // 7. Marketing B2B (sombre)
  {
    key: "trame-b2b", name: "Trame B2B", category: "agence", tags: ["sombre", "technique"], siteType: "Agence de marketing d'affaires B2B",
    description: "Agence B2B en bleu nuit et indigo : bandeau sombre, dégradé avec chiffres, grille d'icônes de services et cas clients pour décideurs industriels et SaaS.",
    brand: "Trame B2B",
    tokens: { colors: { primary: "#818cf8", secondary: "#1b2547", accent: "#fbbf24", background: "#0e1424", surface: "#161e36", text: "#eef1fb", muted: "#aab3d1" }, fonts: { heading: "font.source-serif-4", body: "font.ibm-plex-sans", button: "font.ibm-plex-sans", link: "font.ibm-plex-sans" }, radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 8 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 52, weight: 600, lineHeight: 1.1, letterSpacing: -0.015, transform: "none" } }, border: { width: 1, color: "#2c3760" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "trameb2b", motifs: ["mesh", "tiles", "rays"] },
    head: ["head:dark", {}],
    foot: ["foot:columns", { about: "Trame B2B accompagne les entreprises industrielles et logicielles dans leur marketing de comptes.", cols: [["Expertises", "Marketing de comptes", "Génération de leads", "Contenus experts"], ["Agence", "Cas clients", "Contact"]] }],
    menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["Cas clients", "/cas-clients"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Planifier un échange", "/contact"],
    contact: C("40 boulevard de Strasbourg, 31000 Toulouse", "05 61 00 90 24", "echange@trame-b2b.example", "Du lundi au vendredi, 8 h 30 – 18 h", "Le marketing qui parle aux comités d'achat."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Marketing B2B · Toulouse", title: "Des cycles de vente longs ? Un marketing à leur mesure.", sub: "Ciblage de comptes, contenus experts et automatisation pour industriels, éditeurs de logiciels et sociétés de services.", cta: ["Voir les cas clients", "/cas-clients"], stats: [["+68 %", "d'opportunités qualifiées (exemple)"], ["9", "mois de cycle moyen"], ["45", "comptes pilotes"]] }],
        ["feat:grid-icons", { eyebrow: "Expertises", title: "Un dispositif complet", items: [{ t: "Marketing de comptes", x: "Cibles nommées, messages adaptés.", icon: "users" }, { t: "Génération de leads", x: "LinkedIn, salons, webinaires.", icon: "send" }, { t: "Contenus experts", x: "Livres blancs, études, vidéos.", icon: "fileText" }, { t: "Automatisation", x: "Scénarios et notation des leads.", icon: "settings" }] }],
        ["feat:alt", { title: "Cas client à la une", items: [{ t: "Métallerie Carrel : conquérir la grande industrie", x: "Une base de 120 comptes cibles, trois séquences de contenus : 14 rendez-vous commerciaux en un semestre (exemple).", link: ["Voir le cas", "/cas-clients"] }, { t: "Logiciel Pilot'Flux : éduquer le marché", x: "Un webinaire mensuel et un guide de 40 pages (exemple)." }] }],
        ["proof:team", { title: "Votre équipe projet", items: [{ n: "Valérie Duprat", r: "Directrice conseil" }, { n: "Sami Boukhari", r: "Responsable comptes clés" }, { n: "Océane Brun", r: "Cheffe de projet contenus" }] }],
        ["cta:split", { title: "Parlons de votre cycle de vente.", sub: "Un échange de 30 minutes pour cadrer vos cibles.", cta: ["Planifier", "/contact"] }],
      ] },
      { key: "expertises", name: "Expertises", blocks: [
        ph("Expertises", "Du ciblage à la passation commerciale."),
        ["feat:rows", { title: "Notre dispositif", items: [{ t: "Définition des comptes", x: "Fichier cible, personas, déclencheurs d'achat." }, { t: "Messages et contenus", x: "Argumentaires par fonction : achats, technique, direction." }, { t: "Orchestration", x: "E-mails, social selling, publicité ciblée." }, { t: "Passation", x: "Transfert qualifié aux commerciaux." }] }],
        ["feat:compare", { title: "Marketing de masse ou de comptes ?", rows: [["", "Approche classique", "Marketing de comptes"], ["Cible", "Large", "Comptes nommés"], ["Message", "Générique", "Personnalisé"], ["Alignement ventes", "Faible", "Fort"]] }],
        ["cta:band", { title: "Aligner marketing et ventes.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "cas-clients", name: "Cas clients", blocks: [
        ph("Cas clients"),
        ["gal:cards", { items: [{ t: "Métallerie Carrel", x: "14 rendez-vous en un semestre", tag: "Industrie" }, { t: "Pilot'Flux", x: "Webinaires mensuels", tag: "Logiciel" }, { t: "Cabinet Arvel", x: "Positionnement d'expert", tag: "Services" }] }],
        ["proof:statsbar", { items: [["14", "rendez-vous commerciaux (exemple)"], ["3,2x", "retour sur dépense (exemple)"], ["-35 %", "de durée de cycle (exemple)"]] }],
        ["proof:big", { items: [{ q: "Nos commerciaux arrivent enfin chez des clients qui nous attendent.", n: "Bruno C.", r: "directeur commercial, client fictif" }] }],
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        ph("Ressources", "Guides et modèles à télécharger (exemples)."),
        ["feat:strips", { title: "Bibliothèque", items: [{ t: "Guide du marketing de comptes", x: "40 pages pour structurer votre démarche." }, { t: "Modèle de persona B2B", x: "Fiche à compléter avec vos commerciaux." }, { t: "Calendrier de contenus", x: "Trame de 12 mois pour un industriel." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Travaillez-vous avec des PME ?", x: "Oui, dès dix commerciaux ou un panier moyen élevé." }, { t: "Quelle durée d'engagement ?", x: "Douze mois, car les cycles sont longs." }] }],
        ["cta:card", { title: "Un besoin particulier ?", cta: ["Écrivez-nous", "/contact"] }],
      ] },
      contactPage("Planifions un échange.", "Parlez-nous de votre cycle de vente", "40 boulevard de Strasbourg, 31000 Toulouse"),
    ],
  },

  // 8. Growth / CRO (sombre)
  {
    key: "levier-growth", name: "Levier Growth", category: "agence", tags: ["sombre", "technique"], siteType: "Agence growth et optimisation de conversion",
    description: "Agence growth/CRO en noir et vert citron : accueil centré avec chiffres, expérimentations en lignes, tableau avant/après et en-tête minimal.",
    brand: "Levier",
    tokens: { colors: { primary: "#a3e635", secondary: "#1c2a12", accent: "#22d3ee", background: "#0c1109", surface: "#151d10", text: "#f1f6ea", muted: "#aab99a" }, fonts: { heading: "font.sora", body: "font.mulish", button: "font.mulish", link: "font.mulish" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 8, card: 14 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.05, letterSpacing: -0.03, transform: "none" } }, border: { width: 1, color: "#2a3a1d" } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "soft" }, art: { seed: "levier", motifs: ["rays", "mesh", "tiles"] },
    head: ["head:minimal", {}],
    foot: ["foot:newsletter", { title: "Un test par semaine", sub: "Une expérimentation décortiquée chaque vendredi.", button: "Recevoir" }],
    menu: [["Accueil", "/"], ["Méthode", "/methode"], ["Expériences", "/experiences"], ["Offres", "/offres"], ["Contact", "/contact"]], cta: ["Auditer mon tunnel", "/contact"],
    contact: C("12 rue de Maubeuge, 75009 Paris", "01 40 00 53 09", "test@levier-growth.example", "Du lundi au vendredi, 9 h – 18 h", "Chaque test compte."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Growth & CRO · Paris", title: "Transformez vos visiteurs avec des tests, pas des opinions.", sub: "Audit de tunnel, tests A/B et accompagnement de vos équipes produit et marketing.", cta: ["Auditer mon tunnel", "/contact"], cta2: ["Voir les expériences", "/experiences"], stats: [["+23 %", "de conversion moyenne (exemple)"], ["340", "tests menés"], ["6 sem.", "pour le premier gain"]] }],
        ["feat:rows", { eyebrow: "Boucle de croissance", title: "Hypothèse, test, décision", items: [{ t: "Analyser", x: "Entonnoir, enregistrements de sessions, entretiens clients." }, { t: "Prioriser", x: "Grille impact, confiance, effort." }, { t: "Tester", x: "A/B, tests multivariés, tests de prix." }, { t: "Déployer", x: "Gains validés intégrés à votre produit." }] }],
        ["proof:big", { items: [{ q: "Nous pensions avoir un problème de trafic. C'était un problème de page de paiement.", n: "Léo S.", r: "fondateur, client fictif" }] }],
        ["feat:compare", { title: "Avant / après", intro: "Résultat d'une mission d'exemple sur un site d'abonnement.", rows: [["", "Avant", "Après 3 mois"], ["Conversion visiteur → essai", "1,8 %", "2,6 %"], ["Abandon du formulaire", "61 %", "44 %"], ["Coût d'acquisition", "74 €", "52 €"]] }],
        ["cta:image", { title: "Quel est votre prochain test ?", sub: "Audit de tunnel en dix jours.", cta: ["Demander l'audit", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ph("Méthode", "Rigueur statistique, langage clair."),
        ["feat:icons", { title: "Nos principes", items: [{ t: "Une hypothèse par test", x: "Écrite avant de lancer.", icon: "sliders" }, { t: "Seuils de confiance", x: "Pas d'arrêt prématuré.", icon: "barChart" }, { t: "Apprendre de l'échec", x: "Un test perdu documente aussi.", icon: "book" }, { t: "Transparence", x: "Accès à vos données brutes.", icon: "eye" }] }],
        ["feat:steps", { title: "Rythme d'une mission", items: [{ t: "Audit", d: "Semaines 1-2", x: "Tunnel, outils, mesure." }, { t: "Plan de tests", d: "Semaine 3", x: "Backlog priorisé." }, { t: "Cycle de tests", d: "Mois 2 et après", x: "Deux à quatre tests par mois." }] }],
        ["cta:band", { title: "On commence par l'audit ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "experiences", name: "Expériences", blocks: [
        ph("Expériences", "Tests menés, résultats d'exemple."),
        ["gal:cards", { items: [{ t: "Bouton unique de paiement", x: "+9 % de commandes finalisées", tag: "E-commerce" }, { t: "Formulaire en deux étapes", x: "Abandon réduit de 17 points", tag: "Lead" }, { t: "Preuve sociale en tête", x: "+0,6 point d'essais", tag: "SaaS" }] }],
        ["proof:stats", { items: [["340", "tests menés"], ["38 %", "de tests gagnants (exemple)"], ["12", "secteurs"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il beaucoup de trafic ?", x: "Au moins 20 000 visites mensuelles pour des tests A/B fiables." }, { t: "Quels outils utilisez-vous ?", x: "Ceux que vous avez déjà, ou une sélection adaptée à votre budget." }] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ph("Offres"),
        ["price:tiers", { items: [{ t: "Audit", price: "2 900 €", x: "Mission unique", f: ["Analyse du tunnel", "Plan de 15 tests"], cta: ["Choisir", "/contact"] }, { t: "Programme", price: "3 400 €", period: "/ mois", hl: true, f: ["3 tests par mois", "Rapports", "Atelier mensuel"], cta: ["Choisir", "/contact"] }, { t: "Équipe intégrée", price: "Sur devis", f: ["Growth manager dédié", "Formation des équipes"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:list2", { title: "Inclus partout", items: [{ t: "Accès aux résultats en continu" }, { t: "Rapports en français" }, { t: "Pas d'engagement caché" }, { t: "Transfert des apprentissages" }] }],
        ["cta:card", { title: "Choisir ensemble", cta: ["Parler à un expert", "/contact"] }],
      ] },
      contactPage("Parlons de votre tunnel.", "Décrivez votre site", "12 rue de Maubeuge, 75009 Paris"),
    ],
  },

  // 9. Emailing / CRM
  {
    key: "courrier-lune", name: "Courrier Lune", category: "agence", tags: ["chaleureux", "moderne"], siteType: "Agence d'emailing et de CRM",
    description: "Agence emailing et fidélisation en violet profond : accueil empilé avec grande image, liste de bénéfices sur deux colonnes, scénarios de relance et tarifs par volume.",
    brand: "Courrier Lune",
    tokens: { colors: { primary: "#7e22ce", secondary: "#2e1065", accent: "#f97316", background: "#f9f5fe", surface: "#ffffff", text: "#1d1030", muted: "#5b4b73" }, fonts: { heading: "font.young-serif", body: "font.figtree", button: "font.figtree", link: "font.figtree" }, radius: { sm: 6, md: 12, lg: 18, button: 12, field: 10, card: 18 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 400, lineHeight: 1.1, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "soft" }, art: { seed: "courrierlune", motifs: ["arches", "blobs", "plates"] },
    head: ["head:bar", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Scénarios", "/scenarios"], ["Outils", "/outils"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Auditer ma base", "/contact"],
    contact: C("18 rue Foch, 34000 Montpellier", "04 67 00 25 83", "bonjour@courrier-lune.example", "Du lundi au vendredi, 9 h – 17 h 30", "Le bon message, au bon moment."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Emailing & CRM · Montpellier", title: "Vos clients méritent mieux qu'une newsletter de plus.", sub: "Scénarios automatisés, segmentation et nettoyage de base pour fidéliser sans harceler.", cta: ["Auditer ma base", "/contact"], cta2: ["Voir les scénarios", "/scenarios"], stats: [["38 %", "d'ouverture moyenne (exemple)"], ["+19 %", "de réachat (exemple)"], ["60", "marques suivies"]], image: "hero" }],
        ["feat:list2", { title: "Ce que vous gagnez", items: [{ t: "Une base propre et conforme" }, { t: "Des segments utiles" }, { t: "Des scénarios qui tournent seuls" }, { t: "Des rapports lisibles" }, { t: "Une délivrabilité surveillée" }, { t: "Le respect du consentement" }] }],
        ["proof:quotes", { items: [{ q: "Notre relance de panier abandonné nous rapporte chaque mois ce que coûte l'agence.", n: "Priscilla A.", r: "e-commerçante, cliente fictive" }, { q: "Des e-mails qui ressemblent à nos clients, pas à des promotions.", n: "Olivier T.", r: "directeur, client fictif" }] }],
        ["feat:alt", { title: "Deux scénarios phares", items: [{ t: "Bienvenue en cinq e-mails", x: "Présentation, preuve, première offre, rappel et question : la série qui transforme un inscrit en client.", link: ["Nous contacter", "/contact"] }, { t: "Réactivation douce", x: "Trois messages sur trente jours pour réveiller les clients endormis (exemple)." }] }],
        ["cta:card", { title: "Et si on commençait par votre base ?", sub: "Audit de segmentation et de délivrabilité offert.", cta: ["Demander l'audit", "/contact"] }],
      ] },
      { key: "scenarios", name: "Scénarios", blocks: [
        ph("Scénarios", "Des automatisations prêtes à adapter."),
        ["feat:cards", { items: [{ t: "Bienvenue", x: "Cinq messages pour un nouvel inscrit.", icon: "mail" }, { t: "Panier abandonné", x: "Relances à 1 h, 24 h et 72 h.", icon: "cart" }, { t: "Anniversaire", x: "Cadeau personnalisé.", icon: "calendarClock" }, { t: "Réactivation", x: "Pour les inactifs depuis 90 jours.", icon: "bell" }, { t: "Après-achat", x: "Conseils d'usage et avis.", icon: "star" }, { t: "VIP", x: "Avant-premières pour vos meilleurs clients.", icon: "heart" }] }],
        ["feat:steps", { title: "Exemple de série de bienvenue", items: [{ t: "Jour 0", x: "Remerciement et promesse." }, { t: "Jour 2", x: "Histoire de la marque." }, { t: "Jour 5", x: "Preuves et avis." }, { t: "Jour 9", x: "Première offre." }] }],
        ["cta:band", { title: "Un scénario à créer ?", cta: ["En parler", "/contact"] }],
      ] },
      { key: "outils", name: "Outils", blocks: [
        ph("Outils et données", "Nous nous adaptons à votre pile."),
        ["feat:tabs", { title: "Ce que nous maîtrisons", items: [{ t: "Plateformes d'envoi", x: "Paramétrage, modèles responsive, tests de rendu." }, { t: "CRM", x: "Qualité des données, champs, synchronisation avec le site." }, { t: "Consentement", x: "Collecte, preuve et désinscription simple." }] }],
        ["proof:logos", { title: "Pratiques et partenaires (fictifs)", items: ["EnvoiPlus", "Relais CRM", "Base Claire", "Mailorbe"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Respectez-vous le RGPD ?", x: "Oui, chaque envoi repose sur un consentement documenté." }, { t: "Reprenez-vous notre outil actuel ?", x: "Oui, nous migrons ou nous nous adaptons." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Par volume de contacts, prix d'exemple."),
        ["price:tiers", { items: [{ t: "Petite base", price: "490 €", period: "/ mois", x: "Jusqu'à 10 000 contacts", f: ["2 envois", "1 scénario"], cta: ["Choisir", "/contact"] }, { t: "Base active", price: "1 190 €", period: "/ mois", x: "Jusqu'à 80 000 contacts", hl: true, f: ["4 envois", "5 scénarios", "Tests A/B"], cta: ["Choisir", "/contact"] }, { t: "Grand compte", price: "Sur devis", f: ["Segmentation avancée", "Délivrabilité dédiée"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:list2", { title: "Dans chaque offre", items: [{ t: "Modèles à votre image" }, { t: "Rapport mensuel" }, { t: "Support par e-mail" }, { t: "Nettoyage trimestriel" }] }],
        ["cta:split", { title: "Une base plus grande ?", sub: "Nous établissons un devis sur mesure.", cta: ["Nous contacter", "/contact"] }],
      ] },
      contactPage("Parlons de vos clients.", "Parlez-nous de votre base", "18 rue Foch, 34000 Montpellier"),
    ],
  },

  // 10. Communication locale
  {
    key: "clocher-et-cie", name: "Clocher & Cie", category: "agence", tags: ["chaleureux", "classique"], siteType: "Agence de communication locale",
    description: "Agence de communication de proximité en ocre et brun : bandeau d'infos, accueil encadré, horaires d'ouverture, supports locaux et témoignages de commerçants.",
    brand: "Clocher & Cie",
    tokens: { colors: { primary: "#9a5b00", secondary: "#3a2a10", accent: "#0f766e", background: "#fbf6ea", surface: "#fffdf6", text: "#2a2110", muted: "#6a5b3e" }, fonts: { heading: "font.zilla-slab", body: "font.cabin", button: "font.cabin", link: "font.cabin" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.01, transform: "none" } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "clocher", motifs: ["skyline", "plates", "dunes"] },
    head: ["head:topbar", { info: "Commerçants, mairies et associations de Maine-et-Loire", note: "02 41 00 36 70" }], foot: ["foot:big", { title: "Clocher & Cie" }],
    menu: [["Accueil", "/"], ["Supports", "/supports"], ["Réalisations", "/realisations"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: C("6 place du Ralliement, 49100 Angers", "02 41 00 36 70", "bonjour@clocher-et-cie.example", "Du lundi au vendredi, 9 h – 12 h 30 et 14 h – 18 h", "La communication de votre quartier."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Communication locale · Angers", title: "Faites-vous connaître là où vous vivez.", sub: "Flyers, vitrines, panneaux, réseaux sociaux et presse locale : tout ce qu'il faut pour attirer les clients du coin.", cta: ["Nos supports", "/supports"], cta2: ["Demander un devis", "/contact"], image: "hero" }],
        ["feat:icons", { title: "Tout pour votre commerce", items: [{ t: "Impression", x: "Cartes, flyers, affiches, stickers.", icon: "printer" }, { t: "Vitrines et enseignes", x: "Pose et entretien.", icon: "home" }, { t: "Réseaux sociaux", x: "Page, photos, publications.", icon: "smartphone" }, { t: "Presse et radios locales", x: "Annonces et communiqués.", icon: "bell" }] }],
        ["gal:grid", { title: "Chez vos voisins", items: [{ t: "Boulangerie Rivière", x: "Habillage de vitrine" }, { t: "Mairie de Beaulieu", x: "Magazine municipal" }, { t: "Club de judo", x: "Affiches de saison" }, { t: "Garage Fournier", x: "Enseigne lumineuse" }] }],
        ["misc:hours", { title: "Quand nous trouver", rows: [["Lundi à jeudi", "9 h – 12 h 30 / 14 h – 18 h"], ["Vendredi", "9 h – 12 h 30 / 14 h – 17 h"], ["Samedi", "Sur rendez-vous"]] }],
        ["proof:quotes", { items: [{ q: "Ma vitrine est enfin à l'image de la boulangerie.", n: "Odile R.", r: "boulangère, cliente fictive" }, { q: "Un devis clair et un affichage posé en deux jours.", n: "Marc F.", r: "garagiste, client fictif" }] }],
        ["cta:band", { title: "Un projet pour votre commerce ?", cta: ["Passer nous voir", "/contact"] }],
      ] },
      { key: "supports", name: "Supports", blocks: [
        ph("Supports de communication", "Du plus simple au plus visible."),
        ["feat:strips", { items: [{ t: "Cartes de visite et flyers", x: "Conception, impression et livraison sous cinq jours." }, { t: "Affiches et panneaux", x: "Formats A3 à 4 x 3 m." }, { t: "Vitrophanie", x: "Découpe, pose et retrait." }, { t: "Magazine de commune", x: "Maquette, rédaction, impression, distribution." }] }],
        ["feat:alt", { title: "Un exemple concret", items: [{ t: "Le pack ouverture de commerce", x: "Logo simple, enseigne, flyers, page Facebook et annonce presse en un forfait unique.", link: ["Nous contacter", "/contact"] }, { t: "Le calendrier de saison d'un club", x: "Affiches, billets et réseaux sociaux (exemple)." }] }],
        ["cta:card", { title: "Besoin d'un support particulier ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ph("Réalisations"),
        ["gal:masonry", { items: [{ t: "Boulangerie Rivière", x: "Vitrine" }, { t: "Mairie de Beaulieu", x: "Magazine" }, { t: "Club de judo", x: "Affiches" }, { t: "Garage Fournier", x: "Enseigne" }, { t: "Marché des Halles", x: "Banderoles" }] }],
        ["proof:stats", { items: [["19 ans", "de présence locale"], ["800", "clients accompagnés (exemple)"], ["48 h", "délai de devis"]] }],
        ["misc:quote", { text: "On connaît votre rue, vos voisins et ce qui les fait entrer chez vous.", by: "Clocher & Cie" }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs", "Forfaits d'exemple, devis gratuit."),
        ["feat:pricelist", { items: [{ t: "Pack ouverture", x: "Logo, cartes, flyers, page Facebook", price: "À partir de 1 290 €" }, { t: "Habillage de vitrine", x: "Conception, découpe et pose", price: "À partir de 460 €" }, { t: "Affichage mensuel", x: "Création et impression de 10 affiches", price: "180 €" }, { t: "Gestion de page", x: "Quatre publications par mois", price: "150 € / mois" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Livrez-vous à domicile ?", x: "Oui, dans un rayon de 40 km autour d'Angers." }, { t: "Puis-je payer en plusieurs fois ?", x: "Oui, en trois fois sans frais pour les forfaits supérieurs à 600 €." }] }],
        ["cta:split", { title: "Venez nous voir.", sub: "Un café, un devis, et vous repartez avec des idées.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      contactPage("Un coup de fil ou une visite ?", "Votre projet en deux lignes", "6 place du Ralliement, 49100 Angers"),
    ],
  },

  // 11. Collectif de freelances
  {
    key: "bande-a-part", name: "Bande à part", category: "agence", tags: ["moderne", "ludique"], siteType: "Collectif de freelances créatifs",
    description: "Collectif de freelances en bleu océan : image plein bandeau, trombinoscope en tête, galerie en mosaïque et tarifs journaliers des talents.",
    brand: "Bande à part",
    tokens: { colors: { primary: "#0369a1", secondary: "#0c2a3d", accent: "#fb923c", background: "#f2f8fc", surface: "#ffffff", text: "#0e2231", muted: "#4a5f70" }, fonts: { heading: "font.instrument-serif", body: "font.urbanist", button: "font.urbanist", link: "font.urbanist" }, radius: { sm: 6, md: 12, lg: 20, button: 999, field: 12, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.02, letterSpacing: -0.02, transform: "none" } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "pill" }, art: { seed: "bandeapart", motifs: ["waves", "objects", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Bande à part réunit vingt freelances créatifs à Marseille : design, vidéo, rédaction, développement.", cols: [["Talents", "Design", "Vidéo", "Rédaction", "Développement"], ["Collectif", "Tarifs", "Contact"]] }],
    menu: [["Accueil", "/"], ["Talents", "/talents"], ["Réalisations", "/realisations"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Monter une équipe", "/contact"],
    contact: C("3 rue Sainte, 13001 Marseille", "04 91 00 47 15", "equipe@bande-a-part.example", "Du lundi au vendredi, 9 h – 18 h", "Une équipe sur mesure, sans agence."),
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Collectif de freelances · Marseille", title: "Vingt indépendants, une seule équipe pour vous.", sub: "Direction artistique, vidéo, rédaction, développement : nous composons la bande idéale pour chaque projet.", cta: ["Découvrir les talents", "/talents"], cta2: ["Monter une équipe", "/contact"], image: "hero" }],
        ["proof:team", { eyebrow: "Quelques membres", title: "Ils font la bande", items: [{ n: "Zoé Marchetti", r: "Directrice artistique" }, { n: "Karim Belhadj", r: "Vidéaste" }, { n: "Margaux Ferrand", r: "Rédactrice" }, { n: "Théo Lanfranchi", r: "Développeur web" }] }],
        ["gal:masonry", { title: "Réalisations", items: [{ t: "Ferry Calanques", x: "Site et vidéo" }, { t: "Biscuiterie Phocéenne", x: "Packaging" }, { t: "Festival Mistral", x: "Identité" }, { t: "Port & Co", x: "Livre blanc" }] }],
        ["feat:pricelist", { title: "Tarifs journaliers d'exemple", items: [{ t: "Direction artistique", x: "Journée de création", price: "560 €" }, { t: "Vidéaste (tournage)", x: "Journée avec montage séparé", price: "720 €" }, { t: "Rédaction", x: "Journée d'écriture", price: "380 €" }, { t: "Développement web", x: "Journée de développement", price: "520 €" }] }],
        ["cta:split", { title: "Montons votre équipe de projet.", sub: "Décrivez votre besoin, nous proposons une bande sous 48 h.", cta: ["Briefer le collectif", "/contact"] }],
      ] },
      { key: "talents", name: "Talents", blocks: [
        ph("Talents", "Des indépendants choisis pour leur métier et leur façon de travailler."),
        ["feat:tabs", { title: "Par spécialité", items: [{ t: "Design", x: "Identité, édition, illustration, motion design." }, { t: "Vidéo", x: "Tournage, montage, étalonnage, sous-titrage." }, { t: "Rédaction", x: "Articles, scripts, newsletters, traduction." }, { t: "Web", x: "Sites vitrines, boutiques, intégration, maintenance." }] }],
        ["proof:team", { title: "À votre service", items: [{ n: "Lina Rahmani", r: "Illustratrice" }, { n: "Victor Aubanel", r: "Motion designer" }, { n: "Clara Guibert", r: "Traductrice" }] }],
        ["feat:checks", { title: "Ce qui nous réunit", cta: ["Nous rejoindre", "/contact"], items: [{ t: "Cooptation par au moins deux membres" }, { t: "Une charte de bonnes pratiques" }, { t: "Pas de sous-traitance cachée" }] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ph("Réalisations"),
        ["gal:cards", { items: [{ t: "Ferry Calanques", x: "Site de réservation et film de 90 secondes", tag: "Web + vidéo" }, { t: "Biscuiterie Phocéenne", x: "Gamme de six paquets", tag: "Packaging" }, { t: "Festival Mistral", x: "Identité et programme", tag: "Identité" }] }],
        ["feat:alt", { title: "Anatomie d'une équipe", items: [{ t: "Ferry Calanques : cinq indépendants, un calendrier", x: "Une directrice artistique, un vidéaste, un développeur, une rédactrice et un chef de projet pour un lancement en huit semaines (exemple).", link: ["Nous écrire", "/contact"] }, { t: "Festival Mistral : une identité vivante", x: "Illustrations, affiches et animations pour les réseaux (exemple)." }] }],
        ["proof:quotes", { items: [{ q: "Mieux qu'une agence : des gens qui s'entendent et qui livrent.", n: "Rémi G.", r: "directeur communication, client fictif" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Façons de travailler ensemble", "Trois modes de collaboration."),
        ["price:tiers", { items: [{ t: "À la journée", price: "dès 380 €", x: "Un talent précis", f: ["Devis immédiat", "Facturation directe"], cta: ["Choisir", "/contact"] }, { t: "Projet", price: "Sur devis", x: "Équipe composée", hl: true, f: ["Chef de projet", "Calendrier partagé", "Une seule facture"], cta: ["Choisir", "/contact"] }, { t: "Renfort", price: "dès 3 900 €", period: "/ mois", x: "Équipe dédiée", f: ["Disponibilité garantie", "Point hebdomadaire"], cta: ["Choisir", "/contact"] }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Qui est mon interlocuteur ?", x: "Un chef de projet du collectif, ou directement le talent pour les petites missions." }, { t: "Travaillez-vous à distance ?", x: "Oui, depuis Marseille ou partout en France." }] }],
        ["cta:band", { title: "Un projet, une bande.", cta: ["Nous contacter", "/contact"] }],
      ] },
      contactPage("Dites-nous qui vous cherchez.", "Votre besoin en quelques lignes", "3 rue Sainte, 13001 Marseille"),
    ],
  },
];
