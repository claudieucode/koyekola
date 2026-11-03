// Entreprise, lot B (13 thèmes, services B2B). Textes de DÉMONSTRATION : marques, personnes et coordonnées fictives.
const P = (title, sub) => ["misc:pagehead", { title, sub }];
const Q = (q, n, r) => ({ q, n, r });
const F = "font.";
const CT = (title, formTitle, formIntro) => ["contact:info", { title, formTitle, formIntro }];

module.exports = [
  // 1 ------------------------------------------------------------ nettoyage industriel
  {
    key: "netoyard-pro", name: "Netoyard", category: "entreprise", tags: ["moderne", "minimaliste"], siteType: "Nettoyage industriel et remise en état de sites", isNew: true,
    description: "Nettoyage industriel : turquoise frais sur fond clair, bandeau avec image plein cadre, grille d'icônes et tableau comparatif de prestations.",
    brand: "Netoyard Industrie",
    tokens: { colors: { primary: "#0d9488", secondary: "#0b3f46", accent: "#f59e0b", background: "#f1faf9", surface: "#ffffff", text: "#102a2e", muted: "#4a6266" }, fonts: { heading: F + "lexend", body: F + "literata", button: F + "lexend", link: F + "literata" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "netoyard", motifs: ["waves", "bokeh", "plates"] },
    head: ["head:topbar", { info: "Intervention sous 48 h en Hauts-de-France", note: "Devis gratuit" }],
    foot: ["foot:columns", { about: "Nettoyage d'ateliers, d'entrepôts et de lignes de production, de jour comme de nuit.", cols: [["Prestations", "Ateliers", "Sols et cuves", "Fin de chantier"], ["Contact", "Demander un devis", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Méthodes", "/methodes"], ["Références", "/references"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "14 rue des Fonderies, 59000 Lille", phone: "03 20 00 41 18", email: "devis@netoyard.example", hours: "Lundi – vendredi, 6 h – 19 h", tagline: "Des sites propres, sans arrêter la production." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Nettoyage industriel", title: "Vos ateliers propres, vos lignes qui tournent.", sub: "Équipes formées aux environnements agroalimentaires, chimiques et mécaniques, avec protocoles écrits et traçabilité.", cta: ["Demander un devis", "/contact"], cta2: ["Nos prestations", "/prestations"], image: "hero", alt: "Équipe de nettoyage dans un atelier" }],
        ["feat:grid-icons", { eyebrow: "Savoir-faire", title: "Quatre métiers, une même exigence", items: [{ t: "Ateliers de production", x: "Dégraissage et désinfection entre deux équipes.", icon: "settings" }, { t: "Sols et cuves", x: "Autolaveuses industrielles, nettoyage haute pression.", icon: "layers" }, { t: "Entrepôts", x: "Poussières, racks et quais de chargement.", icon: "home" }, { t: "Fin de chantier", x: "Remise en état avant livraison ou réouverture.", icon: "checkCircle" }] }],
        ["proof:stats", { title: "En chiffres (exemples)", items: [["240", "sites entretenus"], ["24 h/24", "créneaux de nuit"], ["48 h", "délai moyen d'intervention"]] }],
        ["feat:compare", { eyebrow: "Formules", title: "Choisir la fréquence qui convient", rows: [["", "Ponctuel", "Récurrent"], ["Plan de nettoyage écrit", "oui", "oui"], ["Rapport photo", "sur demande", "oui"], ["Équipe dédiée", "non", "oui"], ["Tarif au m²", "standard", "dégressif"]], bg: "token:surface" }],
        ["proof:big", { items: [Q("Entre deux équipes de nuit, le site était prêt : sols secs, cuves rincées, contrôle qualité signé.", "Claire D.", "Responsable qualité, cliente fictive")] }],
        ["cta:split", { title: "Un arrêt technique à planifier ?", sub: "Envoyez surface et contraintes, nous chiffrons sous 48 h.", cta: ["Demander un devis", "/contact"] }]
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        P("Nos prestations", "Du nettoyage courant à la remise en état"),
        ["feat:cards", { title: "Ce que nous prenons en charge", items: [{ t: "Nettoyage de production", x: "Protocole validé avec votre service qualité.", icon: "settings" }, { t: "Haute pression", x: "Cuves, convoyeurs, façades et toitures techniques.", icon: "zap" }, { t: "Désinfection", x: "Produits adaptés aux zones alimentaires.", icon: "shield" }, { t: "Bureaux et sanitaires", x: "Entretien quotidien des parties communes.", icon: "home" }, { t: "Déchets de nettoyage", x: "Tri et évacuation conformes.", icon: "layers" }, { t: "Fin de chantier", x: "Nettoyage grossier puis de finition.", icon: "sparkles" }] }],
        ["feat:pricelist", { title: "Tarifs indicatifs (exemples)", items: [{ t: "Nettoyage de sol industriel", x: "au m², selon état", price: "dès 1,80 €" }, { t: "Haute pression, demi-journée", x: "équipe de 2", price: "720 €" }, { t: "Entretien mensuel de bureaux", x: "par 100 m²", price: "dès 390 €" }], bg: "token:surface" }],
        ["cta:band", { title: "Besoin d'une visite de site ?", cta: ["Prendre rendez-vous", "/contact"] }]
      ] },
      { key: "methodes", name: "Méthodes", blocks: [
        P("Nos méthodes", "Un protocole écrit, une preuve de passage"),
        ["feat:steps", { title: "Une intervention en quatre temps", items: [{ d: "J-7", t: "Visite", x: "Relevé des surfaces, accès, risques et horaires." }, { d: "J-2", t: "Plan", x: "Protocole, produits et fiches de sécurité transmis." }, { d: "Jour J", t: "Intervention", x: "Équipe encadrée par un chef de site." }, { d: "J+1", t: "Compte rendu", x: "Rapport photo et points d'amélioration." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Intervenez-vous la nuit ?", x: "Oui, sur créneaux de nuit et de week-end." }, { t: "Fournissez-vous les produits ?", x: "Oui, avec fiches de données de sécurité." }, { t: "Vos agents sont-ils formés ?", x: "Habilitations et formation aux zones sensibles incluses." }] }],
        ["cta:card", { title: "Parlons de votre site", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "references", name: "Références", blocks: [
        P("Références", "Des sites exigeants, des clients fidèles"),
        ["gal:cards", { items: [{ t: "Laiterie régionale", tag: "Agroalimentaire", x: "Nettoyage quotidien de 4 000 m² de production." }, { t: "Fonderie d'aluminium", tag: "Métallurgie", x: "Arrêt annuel : 3 jours, 12 agents." }, { t: "Plateforme logistique", tag: "Entrepôt", x: "Sols et quais entretenus de nuit." }] }],
        ["proof:quotes", { title: "Retours clients", items: [Q("Des équipes ponctuelles et discrètes.", "Marc B.", "Directeur de site, client fictif"), Q("Rapports clairs, aucun incident.", "Inès R.", "Responsable HSE, cliente fictive"), Q("Un devis détaillé au mètre carré.", "Paul T.", "Acheteur, client fictif")] }],
        ["cta:band", { title: "Rejoignez-les", cta: ["Demander un devis", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Devis gratuit sous 48 h"), CT("Parlons de vos surfaces", "Demande de devis", "Indiquez le type de site et la surface approximative.", "Envoyer"), ["misc:hours", { title: "Horaires du bureau", rows: [["Lundi – vendredi", "6 h – 19 h"], ["Astreinte", "7 j/7"]] }]] }
    ]
  },
  // 2 ------------------------------------------------------------ logistique et transport (sombre)
  {
    key: "routalis-fret", name: "Routalis", category: "entreprise", tags: ["sombre", "audacieux"], siteType: "Transporteur et logisticien de marchandises", featured: true,
    description: "Transport et logistique : fond anthracite, orange signalétique, titres condensés en capitales, affiche d'accueil et bande de chiffres du réseau.",
    brand: "Routalis Fret",
    tokens: { colors: { primary: "#ff7a1a", secondary: "#1d2530", accent: "#ffd166", background: "#10151c", surface: "#18202a", text: "#f1f4f8", muted: "#aab4c2" }, fonts: { heading: F + "barlow-condensed", body: F + "work-sans", button: F + "barlow-condensed", link: F + "work-sans" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 700, lineHeight: 1, letterSpacing: 0, transform: "uppercase" }, h2: { size: 40, weight: 700, lineHeight: 1.05, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "routalis", motifs: ["rays", "skyline", "topo"] },
    head: ["head:dark", {}],
    foot: ["foot:big", { title: "Routalis" }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Réseau", "/reseau"], ["Suivi et devis", "/devis"], ["Contact", "/contact"]], cta: ["Cotation fret", "/devis"],
    contact: { address: "ZAC des Trois Ponts, 69800 Saint-Priest", phone: "04 72 00 60 45", email: "exploitation@routalis.example", hours: "Exploitation 24 h/24, 5 j/7", tagline: "Votre marchandise, à l'heure, partout en Europe." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Transport et logistique", title: "Chargé le soir, livré au matin.", sub: "Lots complets, messagerie palettisée et stockage en entrepôt sous douane, avec suivi chaque jour ouvré.", cta: ["Cotation fret", "/devis"], cta2: ["Nos services", "/services"] }],
        ["proof:statsbar", { items: [["120", "véhicules (exemple)"], ["38", "pays desservis"], ["98 %", "livraisons à l'heure (exemple)"]] }],
        ["feat:bento", { eyebrow: "Services", title: "Une chaîne complète", items: [{ t: "Lot complet", x: "Un camion dédié à votre chargement, départ sous 24 h.", icon: "briefcase" }, { t: "Messagerie palettisée", x: "Départs quotidiens depuis six hubs.", icon: "layers" }, { t: "Stockage", x: "Entrepôts sécurisés et gestion de stock.", icon: "home" }] }],
        ["feat:strips", { title: "Ce qui fait la différence", items: [{ t: "Un interlocuteur unique", x: "Un exploitant suit votre compte de bout en bout." }, { t: "Preuves de livraison numériques", x: "Signature et photos sous 2 heures." }, { t: "Plan B systématique", x: "Un véhicule de secours sur chaque axe." }] }],
        ["proof:logos", { title: "Chargeurs partenaires (fictifs)", items: ["Brasseries Vallon", "Meubles Orsay", "Textile Nordaline", "Pharmalpes", "AgriCoop"] }],
        ["cta:image", { title: "Un transport urgent ?", sub: "Réponse chiffrée en moins de deux heures ouvrées.", cta: ["Cotation fret", "/devis"] }]
      ] },
      { key: "services", name: "Services", blocks: [
        P("Services", "Du camion complet à la palette"),
        ["feat:tabs", { title: "Choisir son mode de transport", items: [{ t: "Lot complet", x: "Semi-remorque bâchée, frigorifique ou plateau, chargement sous 24 h." }, { t: "Lot partiel", x: "Quelques palettes en groupage sur axe régulier." }, { t: "Messagerie", x: "Colis lourds et palettes, livraison en J+1 ou J+2." }, { t: "Stockage", x: "Préparation de commandes et cross-docking." }] }],
        ["feat:rows", { title: "Équipements", items: [{ t: "Bâché et fourgon", x: "33 palettes, hayon disponible." }, { t: "Frigorifique", x: "Température enregistrée de bout en bout." }, { t: "Plateau et porte-engins", x: "Charges hors gabarit sur étude." }] }],
        ["cta:band", { title: "Besoin d'un véhicule spécifique ?", cta: ["Cotation fret", "/devis"] }]
      ] },
      { key: "reseau", name: "Réseau", blocks: [
        P("Notre réseau", "Six hubs, des axes réguliers"),
        ["feat:numbered", { title: "Le réseau en trois chiffres", items: [{ t: "6 hubs", x: "Lyon, Lille, Marseille, Bordeaux, Strasbourg, Nantes." }, { t: "38 pays", x: "Départs hebdomadaires vers l'Europe." }, { t: "24 h", x: "Délai de départ sur lot complet." }] }],
        ["misc:text", { eyebrow: "Engagements", title: "Une exploitation qui répond", paras: ["Chaque hub dispose d'une équipe d'exploitation joignable en continu. En cas d'aléa, vous êtes prévenu avant votre client.", "Nos chauffeurs sont formés à la sûreté et à l'écoconduite."] }],
        ["proof:quotes", { items: [Q("Un camion de remplacement en deux heures lors d'une panne.", "Luc P.", "Responsable logistique, client fictif"), Q("Des preuves de livraison fiables.", "Awa K.", "Supply chain, cliente fictive"), Q("Des tarifs lisibles.", "Ben S.", "Acheteur, client fictif")] }]
      ] },
      { key: "devis", name: "Suivi et devis", blocks: [
        P("Cotation fret", "Décrivez votre envoi"),
        ["feat:checks", { title: "Pour une cotation rapide, indiquez", items: [{ t: "Départ et arrivée" }, { t: "Nombre de palettes et poids" }, { t: "Dates de chargement souhaitées" }, { t: "Contraintes (température, ADR, hayon)" }], cta: ["Écrire à l'exploitation", "/contact"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quel délai de réponse ?", x: "Moins de deux heures ouvrées." }, { t: "Le suivi est-il en ligne ?", x: "Le suivi se fait par e-mail à chaque étape (démonstration)." }] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Exploitation 24 h/24"), ["contact:cards", {}], ["cta:card", { title: "Cotation fret", cta: ["Demander", "/devis"] }]] }
    ]
  },
  // 3 ------------------------------------------------------------ intérim
  {
    key: "intermedia-rh", name: "Intermède", category: "entreprise", tags: ["moderne", "chaleureux"], siteType: "Agence d'intérim et de recrutement temporaire", isNew: true,
    description: "Agence d'intérim : rouge corail énergique, centrage des messages, bandeau en dégradé, recherche d'offres et parcours candidat / entreprise.",
    brand: "Intermède Emploi",
    tokens: { colors: { primary: "#dc2626", secondary: "#7f1d1d", accent: "#fbbf24", background: "#fff8f6", surface: "#ffffff", text: "#2a1411", muted: "#6b4a45" }, fonts: { heading: F + "league-spartan", body: F + "lora", button: F + "league-spartan", link: F + "lora" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 20 }, shadow: { card: "md", button: "sm" } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "intermede", motifs: ["blobs", "bokeh", "ribbons"] },
    head: ["head:float", {}],
    foot: ["foot:newsletter", { title: "Recevoir les offres de la semaine", sub: "Un e-mail, les missions qui correspondent à votre profil.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Candidats", "/candidats"], ["Entreprises", "/entreprises"], ["Offres", "/offres"], ["Contact", "/contact"]], cta: ["Déposer un CV", "/candidats"],
    contact: { address: "5 place du Marché, 44000 Nantes", phone: "02 40 00 77 21", email: "agence@intermede.example", hours: "Lundi – vendredi, 8 h – 18 h", tagline: "La bonne personne, la bonne semaine." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Intérim et recrutement", title: "Du renfort dès lundi, des carrières à plus long terme.", sub: "Nous plaçons des opérateurs, techniciens et administratifs en mission courte, longue ou en vue d'embauche.", cta: ["Je cherche du personnel", "/entreprises"], cta2: ["Je cherche une mission", "/candidats"], stats: [["48 h", "pour un premier profil"], ["1 200", "missions par an (exemple)"], ["35 %", "embauchés ensuite (exemple)"]] }],
        ["feat:icons", { title: "Pour qui travaillons-nous ?", items: [{ t: "Industrie", x: "Opérateurs, conducteurs de ligne, soudeurs.", icon: "settings" }, { t: "Logistique", x: "Caristes, préparateurs, chauffeurs.", icon: "layers" }, { t: "Tertiaire", x: "Assistants, comptables, hôtes d'accueil.", icon: "briefcase" }, { t: "BTP", x: "Maçons, électriciens, chefs d'équipe.", icon: "home" }] }],
        ["misc:marquee", { items: ["Paie chaque semaine", "Formation sécurité incluse", "Un conseiller dédié", "Mission dès 1 jour"] }],
        ["feat:steps", { title: "Comment ça marche", items: [{ d: "1", t: "Brief", x: "Nous précisons le poste et la durée." }, { d: "2", t: "Sélection", x: "Entretien et vérification des habilitations." }, { d: "3", t: "Mission", x: "Contrat signé avant la prise de poste." }, { d: "4", t: "Suivi", x: "Point à mi-mission avec le client et l'intérimaire." }], bg: "token:surface" }],
        ["proof:quotes", { items: [Q("Trois cariste en 24 heures pour une pointe d'activité.", "Gilles H.", "Directeur d'usine, client fictif"), Q("Ma mission a débouché sur un CDI.", "Nadia O.", "Opératrice, cliente fictive"), Q("Un interlocuteur qui connaît mon site.", "Thomas Q.", "Responsable RH, client fictif")] }],
        ["cta:card", { title: "Un besoin urgent ?", sub: "Appelez l'agence avant 10 h pour un premier profil l'après-midi.", cta: ["Contacter l'agence", "/contact"] }]
      ] },
      { key: "candidats", name: "Candidats", blocks: [
        P("Candidats", "Trouvez une mission qui vous convient"),
        ["feat:list2", { title: "Ce que vous obtenez avec nous", items: [{ t: "Paie hebdomadaire" }, { t: "Indemnité de fin de mission et congés" }, { t: "Formations CACES et habilitations" }, { t: "Un conseiller joignable" }, { t: "Mutuelle accessible dès la première mission" }, { t: "Accompagnement vers le CDI" }] }],
        ["feat:accordion", { title: "Questions de candidats", items: [{ t: "Faut-il de l'expérience ?", x: "Pas toujours. Certains postes sont ouverts aux débutants." }, { t: "Puis-je refuser une mission ?", x: "Oui, sans pénalité." }] }],
        ["cta:band", { title: "Prêt à démarrer ?", cta: ["Nous contacter", "/contact"] }]
      ] },
      { key: "entreprises", name: "Entreprises", blocks: [
        P("Entreprises", "Des renforts fiables, sans lourdeur administrative"),
        ["feat:compare", { title: "Intérim ou recrutement direct", rows: [["", "Intérim", "Recrutement"], ["Délai", "24 à 48 h", "4 à 8 semaines"], ["Engagement", "à la mission", "CDI ou CDD"], ["Gestion de la paie", "par nous", "par vous"], ["Période d'essai", "mission test", "classique"]] }],
        ["feat:alt", { title: "Nos formules", items: [{ t: "Renfort ponctuel", x: "Pic d'activité, absence, congés." }, { t: "Mission en vue d'embauche", x: "Essai sur plusieurs mois avant intégration." }] }],
        ["proof:stats", { items: [["48 h", "premier profil"], ["92 %", "missions reconduites (exemple)"], ["4,6/5", "note moyenne (exemple)"]] }]
      ] },
      { key: "offres", name: "Offres", blocks: [
        P("Offres de mission", "Exemples de postes à pourvoir"),
        ["gal:listings", { items: [{ t: "Cariste CACES 3", tag: "Logistique", price: "13,80 €/h", x: "Nantes, équipe du matin, 3 mois." }, { t: "Opérateur de conditionnement", tag: "Industrie", price: "12,40 €/h", x: "Saint-Herblain, 2x8." }, { t: "Assistante administrative", tag: "Tertiaire", price: "1 900 €/mois", x: "Rezé, remplacement longue durée." }, { t: "Électricien tertiaire", tag: "BTP", price: "16 €/h", x: "Chantier à Orvault." }] }],
        ["misc:search", {}]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Passez nous voir"), CT("Parlons de votre besoin", "Écrivez-nous", "Candidats comme entreprises, nous répondons le jour même.", "Envoyer"), ["misc:hours", { title: "Ouverture de l'agence", rows: [["Lundi – vendredi", "8 h – 18 h"], ["Samedi", "fermé"]] }]] }
    ]
  },
  // 4 ------------------------------------------------------------ formation professionnelle d'entreprise
  {
    key: "instrumenta-form", name: "Instrumenta", category: "entreprise", tags: ["editorial", "classique"], siteType: "Organisme de formation professionnelle pour entreprises",
    description: "Formation inter et intra-entreprise : violet profond, sérif de lecture, accueil avec image à gauche, onglets de domaines et programme détaillé.",
    brand: "Instrumenta Formation",
    tokens: { colors: { primary: "#6d28d9", secondary: "#2e1065", accent: "#f59e0b", background: "#faf8ff", surface: "#ffffff", text: "#1c1433", muted: "#5b5275" }, fonts: { heading: F + "literata", body: F + "public-sans", button: F + "public-sans", link: F + "public-sans" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "instrumenta", motifs: ["tiles", "topo", "halftone"] },
    head: ["head:side", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Catalogue", "/catalogue"], ["Programme type", "/programme"], ["Financement", "/financement"], ["Contact", "/contact"]], cta: ["Recevoir le catalogue", "/contact"],
    contact: { address: "27 avenue Jean-Jaurès, 31000 Toulouse", phone: "05 61 00 28 90", email: "formation@instrumenta.example", hours: "Lundi – vendredi, 9 h – 17 h 30", tagline: "Des compétences utiles dès le lendemain." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Formation d'entreprise", title: "Former vos équipes à ce qu'elles feront lundi.", sub: "Management, sécurité, outils numériques et langues, en inter ou sur site, avec des formateurs praticiens.", cta: ["Voir le catalogue", "/catalogue"], cta2: ["Programme type", "/programme"], image: "portrait-1" }],
        ["feat:tabs", { title: "Quatre domaines", items: [{ t: "Management", x: "Manager une équipe, conduire un entretien, gérer un conflit." }, { t: "Sécurité", x: "SST, habilitation électrique, travail en hauteur." }, { t: "Numérique", x: "Tableur avancé, outils collaboratifs, cybersécurité." }, { t: "Langues", x: "Anglais professionnel, en visio ou sur site." }] }],
        ["proof:statsbar", { items: [["320", "sessions par an (exemple)"], ["96 %", "stagiaires satisfaits (exemple)"], ["8", "formateurs permanents"]] }],
        ["gal:coursecards", { title: "Formations les plus demandées", items: [{ t: "Premiers pas de manager", tag: "Débutant", price: "1 150 €", x: "3 jours, inter-entreprises.", cta: ["Détails", "/catalogue"] }, { t: "Sauveteur secouriste du travail", tag: "Tous niveaux", price: "260 €", x: "2 jours, certificat.", cta: ["Détails", "/catalogue"] }, { t: "Tableur : analyser ses données", tag: "Intermédiaire", price: "690 €", x: "2 jours, cas pratiques.", cta: ["Détails", "/catalogue"] }] }],
        ["proof:big", { items: [Q("Le formateur est parti de nos dossiers réels. Nous avons appliqué dès la semaine suivante.", "Laure F.", "Directrice des ressources humaines, cliente fictive")] }],
        ["cta:image", { title: "Une formation sur mesure ?", sub: "Nous construisons un programme à partir de votre besoin.", cta: ["Nous contacter", "/contact"] }]
      ] },
      { key: "catalogue", name: "Catalogue", blocks: [
        P("Catalogue", "Exemples de formations proposées"),
        ["gal:coursecards", { items: [{ t: "Habilitation électrique B0/H0", tag: "Réglementaire", price: "380 €", x: "1 jour.", cta: ["Nous contacter", "/contact"] }, { t: "Communiquer en anglais en réunion", tag: "Intermédiaire", price: "980 €", x: "5 demi-journées.", cta: ["Nous contacter", "/contact"] }, { t: "Prévention du risque cyber", tag: "Tous niveaux", price: "420 €", x: "1 jour.", cta: ["Nous contacter", "/contact"] }, { t: "Conduire un entretien annuel", tag: "Management", price: "720 €", x: "2 jours.", cta: ["Nous contacter", "/contact"] }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Formez-vous sur site ?", x: "Oui, à partir de quatre stagiaires." }, { t: "Délivrez-vous une attestation ?", x: "Oui, avec évaluation des acquis." }] }],
        ["cta:band", { title: "Une question sur le catalogue ?", cta: ["Écrire", "/contact"] }]
      ] },
      { key: "programme", name: "Programme type", blocks: [
        P("Programme type", "Exemple : Premiers pas de manager (3 jours)"),
        ["misc:schedule", { title: "Jour 1", items: [{ d: "9 h", t: "Accueil et attentes", x: "Tour de table et objectifs." }, { d: "10 h", t: "Rôle du manager", x: "Posture, responsabilités, limites." }, { d: "14 h", t: "Fixer des objectifs", x: "Méthode SMART sur cas réels." }, { d: "16 h 30", t: "Bilan", x: "Plan d'action personnel." }] }],
        ["feat:list2", { title: "Objectifs pédagogiques", items: [{ t: "Déléguer efficacement" }, { t: "Animer une réunion" }, { t: "Donner un retour constructif" }, { t: "Prévenir les tensions" }] }],
        ["cta:card", { title: "Recevoir le programme complet", cta: ["Demander le PDF", "/contact"] }]
      ] },
      { key: "financement", name: "Financement", blocks: [
        P("Financement", "Des pistes pour prendre en charge vos formations"),
        ["feat:rows", { title: "Les solutions les plus fréquentes", items: [{ t: "Plan de développement des compétences", x: "Budget formation de l'entreprise." }, { t: "Opérateur de compétences", x: "Prise en charge partielle selon la taille de l'entreprise." }, { t: "Compte personnel de formation", x: "À l'initiative du salarié, sous conditions." }] }],
        ["misc:text", { title: "Notre rôle", paras: ["Nous vous fournissons les documents nécessaires à votre dossier : programme, convention, attestations.", "Les modalités de prise en charge évoluent : vérifiez-les auprès de votre interlocuteur habituel."] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Recevez notre catalogue"), ["contact:map", { title: "Venir nous voir", mapAddress: "27 avenue Jean-Jaurès, 31000 Toulouse" }], ["cta:band", { title: "Plan de formation 2027 ?", cta: ["Prendre rendez-vous", "/contact"] }]] }
    ]
  },
  // 5 ------------------------------------------------------------ ingénierie
  {
    key: "ingenium-bet", name: "Ingenium", category: "entreprise", tags: ["technique", "geometrique"], siteType: "Bureau d'études en ingénierie industrielle",
    description: "Bureau d'études : bleu cobalt net, police technique angulaire, bandeau éditorial, lignes numérotées de compétences et projets en mosaïque.",
    brand: "Ingenium BET",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0f2a66", accent: "#06b6d4", background: "#f5f7fb", surface: "#ffffff", text: "#0f172a", muted: "#475569" }, fonts: { heading: F + "saira", body: F + "ibm-plex-sans", button: F + "saira", link: F + "ibm-plex-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "ingenium", motifs: ["plates", "mesh", "tiles"] },
    head: ["head:split", {}],
    foot: ["foot:columns", { about: "Conception, calculs et suivi d'exécution pour l'industrie et l'énergie.", cols: [["Expertises", "Mécanique", "Automatismes", "Process"], ["Cabinet", "Projets", "Recrutement", "Contact"]] }],
    menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["Projets", "/projets"], ["Méthode", "/methode"], ["Contact", "/contact"]], cta: ["Déposer un cahier des charges", "/contact"],
    contact: { address: "3 allée Gustave-Eiffel, 38000 Grenoble", phone: "04 76 00 52 63", email: "etudes@ingenium.example", hours: "Lundi – vendredi, 8 h 30 – 18 h", tagline: "Du cahier des charges au dossier d'exécution." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Bureau d'études", title: "Concevoir juste, calculer large, livrer propre.", sub: "Ingénierie mécanique, électrique et process pour industriels exigeants.", cta: ["Déposer un cahier des charges", "/contact"], image: "hero" }],
        ["feat:rows", { eyebrow: "Expertises", title: "Trois disciplines, une équipe", items: [{ t: "Mécanique et structures", x: "Conception, calculs par éléments finis, plans de fabrication." }, { t: "Automatismes et électricité", x: "Schémas, programmation d'automates, mise en service." }, { t: "Process et fluides", x: "Dimensionnement, schémas de tuyauterie, sécurité." }] }],
        ["proof:stats", { items: [["45", "ingénieurs (exemple)"], ["600", "projets livrés (exemple)"], ["15 ans", "d'expérience moyenne"]] }],
        ["gal:masonry", { items: [{ t: "Ligne d'emballage", x: "Cadence portée à 120 colis/min." }, { t: "Skid de pompage", x: "Pré-assemblé, testé en usine." }, { t: "Portique de manutention", x: "Charge 12 t, dossier de calcul." }, { t: "Four de traitement", x: "Régulation thermique redondante." }] }],
        ["proof:logos", { title: "Donneurs d'ordre (fictifs)", items: ["Aeronav", "Cryotech", "Hydrelec", "Fonderies Maillard", "Sidéral"] }],
        ["cta:split", { title: "Un projet à chiffrer ?", sub: "Envoyez votre cahier des charges, réponse sous cinq jours.", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "expertises", name: "Expertises", blocks: [
        P("Expertises", "Ce que nous maîtrisons"),
        ["feat:bento", { title: "Nos domaines", items: [{ t: "Calculs de structure", x: "Éléments finis, fatigue, flambement.", icon: "layers" }, { t: "Automatisme", x: "Automates, supervision, sécurité machine.", icon: "settings" }, { t: "Documentation", x: "Notices et dossiers de conformité.", icon: "fileText" }] }],
        ["feat:list2", { title: "Outils et normes", items: [{ t: "Conception 3D paramétrique" }, { t: "Marquage CE et directive machines" }, { t: "Analyse de risques" }, { t: "Simulation de procédés" }, { t: "Plans de fabrication" }, { t: "Assistance à la mise en service" }] }],
        ["cta:band", { title: "Une question technique ?", cta: ["Parler à un ingénieur", "/contact"] }]
      ] },
      { key: "projets", name: "Projets", blocks: [
        P("Projets", "Quelques réalisations (fictives)"),
        ["gal:cards", { items: [{ t: "Ligne de palettisation", tag: "Mécanique", x: "Conception complète, 8 mois." }, { t: "Station de traitement d'eau", tag: "Process", x: "Dimensionnement et plans." }, { t: "Banc d'essai moteurs", tag: "Automatisme", x: "Acquisition de 64 voies." }, { t: "Charpente métallique", tag: "Structure", x: "Note de calcul et plans." }] }],
        ["proof:quotes", { items: [Q("Un dossier d'exécution sans reprise.", "Hugo C.", "Directeur technique, client fictif"), Q("Des délais tenus.", "Sarah J.", "Chef de projet, cliente fictive"), Q("Des ingénieurs disponibles.", "Karim L.", "Responsable travaux, client fictif")] }]
      ] },
      { key: "methode", name: "Méthode", blocks: [
        P("Méthode", "Un cycle en V maîtrisé"),
        ["feat:steps", { title: "Du besoin à la mise en service", items: [{ d: "Phase 1", t: "Analyse du besoin", x: "Cahier des charges fonctionnel." }, { d: "Phase 2", t: "Conception", x: "Avant-projet et revue de conception." }, { d: "Phase 3", t: "Détail", x: "Plans, nomenclatures, notes de calcul." }, { d: "Phase 4", t: "Mise en service", x: "Essais, réglages, formation." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Travaillez-vous en régie ?", x: "Oui, au forfait ou en régie." }, { t: "Gérez-vous la confidentialité ?", x: "Accord de confidentialité signé avant échanges." }] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Déposez votre cahier des charges"), CT("Parlons de votre projet", "Votre demande", "Décrivez le contexte, les contraintes et le délai.", "Envoyer"), ["misc:hours", { title: "Disponibilité", rows: [["Lundi – vendredi", "8 h 30 – 18 h"]] }]] }
    ]
  },
  // 6 ------------------------------------------------------------ télécoms et réseaux (sombre)
  {
    key: "fibrenord-net", name: "Fibrenord", category: "entreprise", tags: ["sombre", "technique"], siteType: "Opérateur télécoms et réseaux pour entreprises", isNew: true,
    description: "Opérateur B2B : fond bleu nuit, cyan lumineux, bandeau en dégradé, comparatif de débits, tarifs en trois formules et FAQ de raccordement.",
    brand: "Fibrenord Entreprises",
    tokens: { colors: { primary: "#22d3ee", secondary: "#0b2a3f", accent: "#a3e635", background: "#07131f", surface: "#0e1f30", text: "#e8f4fb", muted: "#9bb4c6" }, fonts: { heading: F + "sora", body: F + "chivo", button: F + "sora", link: F + "chivo" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "none", button: "sm" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "fibrenord", motifs: ["mesh", "rays", "bokeh"] },
    head: ["head:minimal", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Offres", "/offres"], ["Couverture", "/couverture"], ["Assistance", "/assistance"], ["Contact", "/contact"]], cta: ["Tester mon éligibilité", "/couverture"],
    contact: { address: "9 rue de l'Innovation, 59650 Villeneuve-d'Ascq", phone: "03 20 00 90 12", email: "commercial@fibrenord.example", hours: "Support 24 h/24, 7 j/7", tagline: "Un réseau qui ne se remarque pas." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Fibre dédiée et réseaux d'entreprise", title: "Votre site relié, votre réseau garanti.", sub: "Fibre optique dédiée, interconnexion de sites et téléphonie, avec garantie de rétablissement.", placeholder: "Saisissez l'adresse de votre site", cta: ["Tester mon éligibilité", "/couverture"], image: "hero" }],
        ["feat:icons", { title: "Ce qui est inclus", items: [{ t: "Débit symétrique", x: "De 100 Mbit/s à 10 Gbit/s.", icon: "zap" }, { t: "Garantie de rétablissement", x: "4 heures, 24 h/24.", icon: "shield" }, { t: "Supervision", x: "Alertes avant incident.", icon: "activity" }, { t: "Interconnexion", x: "Sites reliés en réseau privé.", icon: "network" }] }],
        ["price:tiers", { title: "Formules fibre (tarifs d'exemple)", items: [{ t: "Essentiel", price: "89 €", period: "/mois HT", f: ["200 Mbit/s", "Rétablissement 8 h", "1 adresse IP fixe"], cta: ["Choisir", "/contact"] }, { t: "Pro", price: "189 €", period: "/mois HT", f: ["1 Gbit/s", "Rétablissement 4 h", "Supervision", "Lien de secours 4G"], cta: ["Choisir", "/contact"], hl: true }, { t: "Multisite", price: "Sur devis", f: ["Jusqu'à 10 Gbit/s", "Réseau privé", "Rétablissement 4 h"], cta: ["Nous écrire", "/contact"] }] }],
        ["proof:statsbar", { items: [["99,95 %", "disponibilité (exemple)"], ["4 h", "rétablissement garanti"], ["1 800", "sites raccordés (exemple)"]] }],
        ["proof:quotes", { items: [Q("Nos trois agences sont enfin sur le même réseau.", "Odile M.", "Directrice informatique, cliente fictive"), Q("Une panne, rétablie avant l'ouverture.", "Yann G.", "Gérant, client fictif")] }],
        ["cta:band", { title: "Votre adresse est-elle raccordable ?", cta: ["Tester maintenant", "/couverture"] }]
      ] },
      { key: "offres", name: "Offres", blocks: [
        P("Offres", "Connectivité et services"),
        ["feat:compare", { title: "Comparer les débits", rows: [["", "Essentiel", "Pro", "Multisite"], ["Débit", "200 Mbit/s", "1 Gbit/s", "jusqu'à 10 Gbit/s"], ["Rétablissement", "8 h", "4 h", "4 h"], ["Supervision", "non", "oui", "oui"], ["Lien de secours", "non", "4G", "double fibre"]] }],
        ["feat:cards", { title: "Services associés", items: [{ t: "Téléphonie IP", x: "Standard et postes mobiles.", icon: "smartphone" }, { t: "Wi-Fi d'entreprise", x: "Bornes et gestion centralisée.", icon: "network" }, { t: "Pare-feu géré", x: "Filtrage et mises à jour.", icon: "lock" }] }],
        ["cta:split", { title: "Besoin d'un chiffrage multisite ?", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "couverture", name: "Couverture", blocks: [
        P("Couverture", "Raccordement de votre site"),
        ["feat:steps", { title: "De l'éligibilité à l'activation", items: [{ d: "J0", t: "Test d'adresse", x: "Réponse sous un jour ouvré." }, { d: "J+5", t: "Étude", x: "Visite technique si nécessaire." }, { d: "J+30", t: "Raccordement", x: "Intervention et tests de débit." }, { d: "J+31", t: "Recette", x: "Procès-verbal signé." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quel délai en zone urbaine ?", x: "Entre 3 et 6 semaines." }, { t: "Puis-je conserver mon numéro ?", x: "Oui, la portabilité est incluse." }] }],
        ["cta:band", { title: "Demandez une étude", cta: ["Étudier mon site", "/contact"] }]
      ] },
      { key: "assistance", name: "Assistance", blocks: [
        P("Assistance", "Support 24 h/24"),
        ["feat:strips", { title: "Comment nous joindre", items: [{ t: "Téléphone", x: "Ligne dédiée, réponse sous 5 minutes." }, { t: "E-mail", x: "Ticket suivi par un technicien." }, { t: "Supervision proactive", x: "Nous vous appelons avant vous." }] }],
        ["misc:faq", { items: [{ t: "Que faire en cas de coupure ?", x: "Contactez la ligne dédiée, un technicien prend le dossier." }, { t: "Les pénalités existent-elles ?", x: "Oui, selon contrat de niveau de service." }] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Parlons de votre réseau"), ["contact:cards", {}], ["cta:card", { title: "Un incident en cours ?", sub: "Appelez directement le support.", cta: ["Voir l'assistance", "/assistance"] }]] }
    ]
  },
  // 7 ------------------------------------------------------------ maintenance technique
  {
    key: "tenacia-maint", name: "Tenacia", category: "entreprise", tags: ["technique", "naturel"], siteType: "Maintenance technique multi-sites (CVC, électricité, GTB)",
    description: "Maintenance technique : vert franc, slab sérif robuste, bandeau texte puis grande image, contrats en trois niveaux et chronologie d'intervention.",
    brand: "Tenacia Maintenance",
    tokens: { colors: { primary: "#15803d", secondary: "#14352a", accent: "#eab308", background: "#f4f8f4", surface: "#ffffff", text: "#13251b", muted: "#475a4e" }, fonts: { heading: F + "zilla-slab", body: F + "barlow", button: F + "barlow", link: F + "barlow" }, radius: { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "tenacia", motifs: ["plates", "botanical", "arches"] },
    head: ["head:bar", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Contrats", "/contrats"], ["Interventions", "/interventions"], ["Secteurs", "/secteurs"], ["Contact", "/contact"]], cta: ["Dépannage urgent", "/contact"],
    contact: { address: "62 route de Vannes, 35000 Rennes", phone: "02 99 00 38 70", email: "atelier@tenacia.example", hours: "Astreinte 24 h/24, bureau 8 h – 17 h 30", tagline: "Vos installations tiennent, nous veillons." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Maintenance technique", title: "Des installations qui ne tombent pas en panne un vendredi soir.", sub: "Chauffage, ventilation, électricité et gestion technique du bâtiment : préventif, curatif et astreinte.", cta: ["Dépannage urgent", "/contact"], cta2: ["Nos contrats", "/contrats"], image: "hero", stats: [["2 h", "délai d'intervention urgent (exemple)"], ["180", "sites sous contrat"], ["24 h/24", "astreinte"]] }],
        ["feat:alt", { eyebrow: "Métiers", title: "Trois équipes spécialisées", items: [{ t: "Génie climatique", x: "Chaufferies, climatisation, ventilation, traitement d'eau.", link: ["Interventions", "/interventions"] }, { t: "Électricité", x: "Tableaux, éclairage de sécurité, vérifications périodiques.", link: ["Contrats", "/contrats"] }, { t: "GTB et supervision", x: "Capteurs, régulation et alertes à distance.", link: ["Secteurs", "/secteurs"] }] }],
        ["feat:numbered", { title: "Notre promesse", items: [{ t: "2 h", x: "pour une intervention urgente." }, { t: "100 %", x: "des interventions tracées." }, { t: "1", x: "technicien référent par site." }], bg: "token:surface" }],
        ["proof:quotes", { items: [Q("La chaufferie est suivie à distance, l'alerte arrive avant la panne.", "Daniel R.", "Responsable patrimoine, client fictif"), Q("Un rapport clair après chaque passage.", "Mélanie V.", "Gestionnaire, cliente fictive"), Q("Astreinte réactive un dimanche de janvier.", "Antoine L.", "Directeur de site, client fictif")] }],
        ["cta:band", { title: "Faire auditer vos installations ?", sub: "Visite et rapport offerts pour tout site de plus de 1 000 m².", cta: ["Prendre rendez-vous", "/contact"] }]
      ] },
      { key: "contrats", name: "Contrats", blocks: [
        P("Contrats de maintenance", "Trois niveaux d'engagement"),
        ["price:tiers", { title: "Formules (tarifs d'exemple)", items: [{ t: "Réglementaire", price: "à partir de 90 €", period: "/mois", f: ["Visites obligatoires", "Registre de sécurité", "Rapport annuel"], cta: ["Demander", "/contact"] }, { t: "Préventif", price: "à partir de 240 €", period: "/mois", f: ["Visites trimestrielles", "Pièces d'usure incluses", "Astreinte"], cta: ["Demander", "/contact"], hl: true }, { t: "Tout compris", price: "Sur devis", f: ["Garantie totale", "Supervision à distance", "Plan pluriannuel"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Reprenez-vous un contrat existant ?", x: "Oui, après audit des installations." }, { t: "Y a-t-il un engagement ?", x: "Trois ans, résiliable chaque année avec préavis." }] }],
        ["cta:card", { title: "Comparer avec votre contrat actuel", cta: ["Envoyer le contrat", "/contact"] }]
      ] },
      { key: "interventions", name: "Interventions", blocks: [
        P("Interventions", "Comment se déroule un dépannage"),
        ["feat:steps", { title: "Une urgence, quatre étapes", items: [{ d: "0 min", t: "Appel", x: "Un technicien prend la demande." }, { d: "30 min", t: "Diagnostic", x: "Premier avis à distance." }, { d: "2 h", t: "Sur place", x: "Intervention et sécurisation." }, { d: "J+1", t: "Compte rendu", x: "Cause, réparation, préconisations." }] }],
        ["feat:list2", { title: "Équipements couverts", items: [{ t: "Chaudières et pompes à chaleur" }, { t: "Centrales de traitement d'air" }, { t: "Groupes froids" }, { t: "Tableaux électriques" }, { t: "Éclairage de sécurité" }, { t: "Portes automatiques" }] }]
      ] },
      { key: "secteurs", name: "Secteurs", blocks: [
        P("Secteurs", "Des sites très différents, une même rigueur"),
        ["gal:grid", { items: [{ t: "Bureaux", x: "Confort et économies d'énergie." }, { t: "Santé", x: "Continuité de service." }, { t: "Industrie", x: "Utilités et process." }, { t: "Commerce", x: "Froid et éclairage." }] }],
        ["proof:stats", { items: [["180", "sites"], ["22", "techniciens"], ["4", "agences"]] }],
        ["cta:band", { title: "Votre secteur n'est pas listé ?", cta: ["Nous le dire", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Dépannage ou devis"), ["contact:cards", {}], ["cta:band", { title: "Panne en cours ?", sub: "Appelez l'astreinte au numéro indiqué.", cta: ["Voir les contrats", "/contrats"] }]] }
    ]
  },
  // 8 ------------------------------------------------------------ conciergerie d'entreprise
  {
    key: "attentio-conc", name: "Attentio", category: "entreprise", tags: ["luxe", "chaleureux"], siteType: "Conciergerie d'entreprise et services aux salariés",
    description: "Conciergerie d'entreprise : prune profond et crème, titres de caractère en capitales, en-tête centré, carte blanche d'accueil et liste de services à prix.",
    brand: "Attentio Conciergerie",
    tokens: { colors: { primary: "#86198f", secondary: "#3b0a40", accent: "#c8a24a", background: "#fbf6f1", surface: "#ffffff", text: "#2a1630", muted: "#6a5470" }, fonts: { heading: F + "marcellus", body: F + "jost", button: F + "jost", link: F + "jost" }, radius: { sm: 2, md: 6, lg: 10, button: 2, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 400, lineHeight: 1.1, letterSpacing: 0.02, transform: "uppercase" }, h2: { size: 34, weight: 400, lineHeight: 1.15, letterSpacing: 0.02, transform: "uppercase" } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "attentio", motifs: ["arches", "botanical", "ribbons"] },
    head: ["head:center", {}],
    foot: ["foot:columns", { about: "Des services du quotidien, proposés sur place aux salariés de votre entreprise.", cols: [["Services", "Pressing", "Courses", "Mobilité"], ["Entreprise", "Offres", "Contact"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Offres", "/offres"], ["Questions", "/questions"], ["Contact", "/contact"]], cta: ["Planifier une présentation", "/contact"],
    contact: { address: "18 rue de la Paix, 75002 Paris", phone: "01 40 00 61 52", email: "bonjour@attentio.example", hours: "Lundi – vendredi, 8 h – 19 h", tagline: "Du temps rendu à vos équipes." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Conciergerie d'entreprise", title: "Le quotidien de vos salariés, pris en main.", sub: "Pressing, réparation, courses, colis, démarches : un conciergerie sur site ou à distance qui réduit la charge mentale.", cta: ["Planifier une présentation", "/contact"], image: "hero" }],
        ["misc:marquee", { items: ["Pressing sous 48 h", "Colis réceptionnés", "Paniers de saison", "Cordonnerie", "Réservations"] }],
        ["feat:cards", { title: "Les services les plus utilisés", items: [{ t: "Pressing et retouches", x: "Dépôt le matin, retour sous 48 h.", icon: "sparkles" }, { t: "Colis et courses", x: "Réception, préparation et remise.", icon: "briefcase" }, { t: "Démarches", x: "Rendez-vous, réservations, billetterie.", icon: "calendarClock" }, { t: "Mobilité", x: "Vélos, covoiturage, lavage.", icon: "globe" }] }],
        ["proof:big", { items: [Q("Nos équipes retrouvent leurs pauses. Le taux d'absentéisme de l'étage a baissé.", "Valérie S.", "Directrice des ressources humaines, cliente fictive")] }],
        ["feat:rows", { eyebrow: "Mise en place", title: "En ligne en trois semaines", items: [{ t: "Cadrage", x: "Enquête auprès des salariés sur leurs besoins." }, { t: "Installation", x: "Comptoir ou application interne." }, { t: "Pilotage", x: "Bilan trimestriel d'usage." }], bg: "token:surface" }],
        ["cta:split", { title: "Offrir un service de plus à vos équipes", cta: ["Planifier une présentation", "/contact"] }]
      ] },
      { key: "services", name: "Services", blocks: [
        P("Services", "Ce que nous proposons"),
        ["misc:story", { eyebrow: "À propos", title: "Une équipe à votre écoute", paras: ["Notre équipe vous accompagne de l'analyse jusqu'au suivi de terrain."], image: "portrait-1" }],
        ["feat:pricelist", { title: "Tarifs salariés (exemples)", items: [{ t: "Chemise nettoyée", price: "3,50 €" }, { t: "Retouche d'ourlet", price: "9 €" }, { t: "Panier de fruits et légumes", price: "18 €" }, { t: "Cordonnerie express", price: "dès 12 €" }, { t: "Réservation de restaurant", price: "offerte" }] }],
        ["feat:strips", { title: "Pour l'entreprise", items: [{ t: "Comptoir sur site", x: "Un concierge présent aux heures clés." }, { t: "Application interne", x: "Commandes et suivi (démonstration)." }, { t: "Tableau de bord", x: "Usage mensuel par service." }] }],
        ["cta:band", { title: "Un service sur mesure ?", cta: ["Nous le demander", "/contact"] }]
      ] },
      { key: "offres", name: "Offres", blocks: [
        P("Offres pour l'entreprise", "Un budget maîtrisé"),
        ["price:tiers", { items: [{ t: "Comptoir partagé", price: "dès 900 €", period: "/mois", f: ["2 demi-journées par semaine", "Services de base", "Bilan trimestriel"], cta: ["Demander", "/contact"] }, { t: "Conciergerie dédiée", price: "dès 2 400 €", period: "/mois", f: ["Concierge à temps plein", "Services étendus", "Tableau de bord"], cta: ["Demander", "/contact"], hl: true }, { t: "Application seule", price: "dès 300 €", period: "/mois", f: ["Catalogue de partenaires", "Suivi des commandes"], cta: ["Demander", "/contact"] }] }],
        ["proof:stats", { items: [["35", "entreprises accompagnées (exemple)"], ["78 %", "salariés utilisateurs (exemple)"]] }]
      ] },
      { key: "questions", name: "Questions", blocks: [
        P("Questions fréquentes", "Tout savoir avant de démarrer"),
        ["misc:faq", { items: [{ t: "Qui paie les services ?", x: "Le salarié règle ses services, l'entreprise finance le comptoir." }, { t: "Y a-t-il un engagement ?", x: "Douze mois, renouvelables." }, { t: "Les partenaires sont-ils sélectionnés ?", x: "Oui, selon une charte qualité." }] }],
        ["cta:card", { title: "Une autre question ?", cta: ["Nous écrire", "/contact"] }],
        ["feat:checks", { title: "Ce qui est inclus", items: [{ t: "Mise en place" }, { t: "Référent dédié" }, { t: "Bilan d'usage" }], cta: ["Nous contacter", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Planifions une présentation"), CT("Rencontrons-nous", "Votre demande", "Taille de l'entreprise et services souhaités."), ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "8 h – 19 h"]] }]] }
    ]
  },
  // 9 ------------------------------------------------------------ gestion de flotte
  {
    key: "flotilla-gest", name: "Flotilla", category: "entreprise", tags: ["moderne", "audacieux"], siteType: "Gestion de flotte automobile d'entreprise (location longue durée, suivi)",
    description: "Gestion de flotte : or ambré sur fond crème, bandeau de journal, bandeau secondaire plein, comparatif de modes de financement et chiffres clés.",
    brand: "Flotilla Gestion",
    tokens: { colors: { primary: "#a16207", secondary: "#1f2937", accent: "#0f766e", background: "#fffbeb", surface: "#ffffff", text: "#1c1917", muted: "#57534e" }, fonts: { heading: F + "titillium-web", body: F + "rubik", button: F + "titillium-web", link: F + "rubik" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 12 }, shadow: { card: "sm", button: "sm" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "flotilla", motifs: ["objects", "rays", "tiles"] },
    head: ["head:masthead", { dateline: "Gestion de flotte · Lyon" }],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Solutions", "/solutions"], ["Financement", "/financement"], ["Suivi", "/suivi"], ["Contact", "/contact"]], cta: ["Audit de flotte", "/contact"],
    contact: { address: "40 cours Gambetta, 69003 Lyon", phone: "04 78 00 14 36", email: "flotte@flotilla.example", hours: "Lundi – vendredi, 8 h – 18 h", tagline: "Moins de coûts, plus de véhicules disponibles." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Gestion de flotte", title: "Chaque véhicule au bon endroit, au bon coût.", sub: "Location longue durée, entretien, sinistres, carburant et suivi des conducteurs, réunis dans un seul contrat.", cta: ["Audit de flotte", "/contact"], cta2: ["Solutions", "/solutions"], image: "hero" }],
        ["proof:stats", { title: "Résultats observés (exemples)", items: [["-14 %", "coût par kilomètre"], ["-30 %", "temps administratif"], ["5 000", "véhicules gérés"]] }],
        ["feat:strips", { eyebrow: "Services", title: "Tout ce qui entoure le véhicule", items: [{ t: "Entretien planifié", x: "Rendez-vous pris chez des garages partenaires." }, { t: "Gestion des sinistres", x: "Constat, expertise et véhicule de remplacement." }, { t: "Cartes carburant et péages", x: "Suivi et refacturation par service." }, { t: "Amendes", x: "Désignation du conducteur automatisée." }] }],
        ["feat:compare", { title: "Acheter, louer ou gérer", rows: [["", "Achat", "Location longue durée", "Avec Flotilla"], ["Trésorerie", "forte", "faible", "faible"], ["Entretien", "vous", "inclus", "inclus et piloté"], ["Reporting", "à bâtir", "partiel", "tableau mensuel"]], bg: "token:surface" }],
        ["proof:quotes", { items: [Q("Nous avons réduit notre flotte de douze véhicules sans perdre de service.", "Pierre N.", "Directeur administratif, client fictif"), Q("Les amendes ne sont plus un sujet.", "Léa C.", "Responsable moyens généraux, cliente fictive")] }],
        ["cta:band", { title: "Que coûte vraiment votre flotte ?", sub: "Audit gratuit sur un échantillon de dix véhicules.", cta: ["Audit de flotte", "/contact"] }]
      ] },
      { key: "solutions", name: "Solutions", blocks: [
        P("Solutions", "Une offre pour chaque taille de flotte"),
        ["feat:bento", { title: "Nos offres", items: [{ t: "Petites flottes", x: "De 5 à 30 véhicules, contrat simple.", icon: "briefcase" }, { t: "Flottes moyennes", x: "Reporting par service.", icon: "barChart" }, { t: "Grandes flottes", x: "Gestion déléguée complète.", icon: "layers" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quels véhicules ?", x: "Citadines, utilitaires, hybrides et électriques." }, { t: "Gérez-vous la recharge ?", x: "Nous conseillons et installons des bornes via des partenaires." }] }],
        ["cta:split", { title: "Simuler une transition électrique", cta: ["Nous contacter", "/contact"] }]
      ] },
      { key: "financement", name: "Financement", blocks: [
        P("Financement", "Louer, racheter, mutualiser"),
        ["feat:pricelist", { title: "Loyers indicatifs (exemples)", items: [{ t: "Citadine, 48 mois", x: "entretien inclus", price: "dès 310 €/mois" }, { t: "Utilitaire 3 m³, 48 mois", x: "entretien inclus", price: "dès 420 €/mois" }, { t: "Berline hybride, 48 mois", x: "entretien inclus", price: "dès 590 €/mois" }] }],
        ["misc:text", { title: "Comment sont fixés les loyers", paras: ["Ils dépendent de la durée, du kilométrage annuel et de la valeur de revente estimée.", "Nous comparons plusieurs bailleurs pour chaque dossier."] }]
      ] },
      { key: "suivi", name: "Suivi", blocks: [
        P("Suivi", "Un tableau de bord par mois"),
        ["feat:steps", { title: "Du kilomètre au rapport", items: [{ d: "Chaque jour", t: "Collecte", x: "Kilométrage et alertes entretien." }, { d: "Chaque mois", t: "Rapport", x: "Coûts par véhicule et par service." }, { d: "Chaque trimestre", t: "Revue", x: "Optimisation du parc avec vous." }] }],
        ["proof:statsbar", { items: [["12", "indicateurs suivis"], ["1", "interlocuteur"], ["30 j", "entre deux revues"]] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Audit de flotte gratuit"), ["contact:map", { title: "Nos bureaux", mapAddress: "40 cours Gambetta, 69003 Lyon" }], ["cta:card", { title: "Prêt à reprendre la main ?", cta: ["Voir les solutions", "/solutions"] }]] }
    ]
  },
  // 10 ------------------------------------------------------------ coworking
  {
    key: "ruche-cowork", name: "La Ruche Active", category: "entreprise", tags: ["ludique", "moderne"], siteType: "Espace de coworking et bureaux flexibles",
    description: "Coworking : bleu ciel vif, titres sportifs, collage de photos d'espaces, grille de formules à la journée ou au mois et programme d'événements.",
    brand: "La Ruche Active",
    tokens: { colors: { primary: "#0284c7", secondary: "#082f49", accent: "#fb923c", background: "#f0f9ff", surface: "#ffffff", text: "#0c1e2b", muted: "#43607a" }, fonts: { heading: F + "kanit", body: F + "outfit", button: F + "kanit", link: F + "outfit" }, radius: { sm: 8, md: 14, lg: 24, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "pill" }, art: { seed: "ruche", motifs: ["blobs", "tiles", "ribbons"] },
    head: ["head:float", {}],
    foot: ["foot:big", { title: "La Ruche" }],
    menu: [["Accueil", "/"], ["Espaces", "/espaces"], ["Tarifs", "/tarifs"], ["Événements", "/evenements"], ["Contact", "/contact"]], cta: ["Réserver une visite", "/contact"],
    contact: { address: "11 quai de la Fosse, 44000 Nantes", phone: "02 40 00 15 89", email: "salut@ruche.example", hours: "Lundi – vendredi, 8 h – 20 h, accès 24 h/24 pour les membres", tagline: "Un bureau qui ressemble à votre équipe." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Coworking à Nantes", title: "Un poste, une équipe ou tout un étage.", sub: "Bureaux privatifs, postes en espace partagé et salles de réunion, sans bail de longue durée.", cta: ["Réserver une visite", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
        ["proof:statsbar", { items: [["180", "postes (exemple)"], ["14", "salles de réunion"], ["7 j/7", "accès membres"]] }],
        ["feat:icons", { title: "Inclus dans chaque formule", items: [{ t: "Fibre dédiée", x: "Débit symétrique garanti.", icon: "zap" }, { t: "Café et boissons", x: "À volonté.", icon: "heart" }, { t: "Salles de réunion", x: "Heures offertes chaque mois.", icon: "users" }, { t: "Domiciliation", x: "Adresse et réception du courrier.", icon: "mail" }] }],
        ["gal:wall", { items: [{ t: "Open space" }, { t: "Cabines téléphone" }, { t: "Terrasse" }, { t: "Cuisine partagée" }] }],
        ["proof:quotes", { items: [Q("Nous sommes passés de deux à neuf postes sans rien signer de plus.", "Camille B.", "Cofondatrice, cliente fictive"), Q("Les rencontres du jeudi nous ont apporté deux clients.", "Samir Z.", "Développeur indépendant, client fictif")] }],
        ["cta:image", { title: "Venez essayer une journée", sub: "Première journée offerte pour les équipes de trois personnes.", cta: ["Réserver une visite", "/contact"] }]
      ] },
      { key: "espaces", name: "Espaces", blocks: [
        P("Espaces", "Choisissez votre manière de travailler"),
        ["feat:alt", { title: "Nos espaces", items: [{ t: "Open space", x: "Postes libres ou fixes, ambiance studieuse.", link: ["Tarifs", "/tarifs"] }, { t: "Bureaux privatifs", x: "De 2 à 12 personnes, clé en main.", link: ["Tarifs", "/tarifs"] }, { t: "Salles de réunion", x: "Écran, visio, paperboard, de 4 à 20 places.", link: ["Contact", "/contact"] }] }],
        ["feat:list2", { title: "Services", items: [{ t: "Impression et scan" }, { t: "Casiers" }, { t: "Douche et local vélos" }, { t: "Accueil des visiteurs" }, { t: "Boîte aux lettres" }, { t: "Sécurité 24 h/24" }] }],
        ["cta:band", { title: "Visite sur rendez-vous", cta: ["Réserver", "/contact"] }]
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        P("Tarifs", "À la journée ou au mois, sans engagement"),
        ["price:tiers", { items: [{ t: "Nomade", price: "18 €", period: "/jour", f: ["Poste libre", "Café inclus"], cta: ["Réserver", "/contact"] }, { t: "Résident", price: "190 €", period: "/mois", f: ["Poste fixe", "8 h de salle", "Domiciliation"], cta: ["Réserver", "/contact"], hl: true }, { t: "Équipe", price: "Sur devis", f: ["Bureau privatif", "Salle dédiée", "Aménagement"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quel préavis ?", x: "Un mois, aucune pénalité." }, { t: "Peut-on recevoir des clients ?", x: "Oui, accueil et salle inclus." }] }]
      ] },
      { key: "evenements", name: "Événements", blocks: [
        P("Événements", "La vie de la communauté"),
        ["misc:schedule", { title: "Cette semaine (exemple)", items: [{ d: "Mardi 12 h", t: "Déjeuner partagé", x: "Chacun apporte un plat." }, { d: "Mercredi 18 h", t: "Atelier : facturation", x: "Avec un expert-comptable." }, { d: "Jeudi 18 h 30", t: "Afterwork", x: "Rencontre entre membres." }] }],
        ["gal:cards", { items: [{ t: "Démos produits", tag: "Mensuel", x: "Trois start-ups présentent." }, { t: "Matinée recrutement", tag: "Trimestriel", x: "Profils et offres." }] }],
        ["cta:card", { title: "Proposer un événement", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Réservez une visite"), CT("Passez nous voir", "Votre visite", "Nombre de personnes et date souhaitée."), ["misc:hours", { title: "Horaires", rows: [["Accueil", "8 h – 20 h"], ["Membres", "24 h/24"]] }]] }
    ]
  },
  // 11 ------------------------------------------------------------ imprimerie professionnelle
  {
    key: "typografik-imp", name: "Typografik", category: "entreprise", tags: ["editorial", "audacieux"], siteType: "Imprimerie professionnelle (offset, grand format, packaging)",
    description: "Imprimerie : rose d'encre sur papier crème, sérif d'édition, bandeau minimal en très grand corps, nuancier de supports et tarifs au tirage.",
    brand: "Typografik Imprimeurs",
    tokens: { colors: { primary: "#be185d", secondary: "#1c1917", accent: "#0369a1", background: "#fbf7f0", surface: "#ffffff", text: "#1c1917", muted: "#57534e" }, fonts: { heading: F + "spectral", body: F + "archivo", button: F + "archivo", link: F + "archivo" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9cfc0" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "typografik", motifs: ["halftone", "plates", "objects"] },
    head: ["head:topbar", { info: "Livraison en 48 h partout en France", note: "BAT sous 4 h" }],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Produits", "/produits"], ["Supports", "/supports"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "7 rue Gutenberg, 67000 Strasbourg", phone: "03 88 00 24 47", email: "devis@typografik.example", hours: "Lundi – vendredi, 7 h 30 – 18 h", tagline: "Imprimé avec soin, livré à l'heure." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Imprimerie professionnelle", title: "Ce qui s'imprime bien se remarque.", sub: "Catalogues, packagings, signalétique et papeterie pour entreprises : offset, numérique et grand format.", cta: ["Demander un devis", "/contact"], cta2: ["Voir les produits", "/produits"] }],
        ["gal:strip", { title: "Nos réalisations", items: [{ t: "Catalogue" }, { t: "Étui" }, { t: "Affiche" }, { t: "Brochure" }, { t: "Carte" }] }],
        ["feat:rows", { eyebrow: "Savoir-faire", title: "De la maquette à la palette", items: [{ t: "Vérification des fichiers", x: "Contrôle gratuit et bon à tirer sous 4 heures." }, { t: "Impression", x: "Offset, numérique, grand format, vernis sélectifs." }, { t: "Façonnage", x: "Pliage, reliure, découpe, dorure à chaud." }, { t: "Livraison", x: "Palettisation et livraison sur rendez-vous." }] }],
        ["proof:stats", { items: [["48 h", "délai standard"], ["12", "presses (exemple)"], ["100 %", "papiers certifiés"]] }],
        ["feat:alt", { title: "Un engagement écologique", items: [{ t: "Encres végétales", x: "Pour la quasi-totalité des travaux.", link: ["Supports", "/supports"] }, { t: "Papiers certifiés", x: "Gestion durable des forêts.", link: ["Tarifs", "/tarifs"] }] }],
        ["proof:big", { items: [Q("Les couleurs de notre catalogue étaient justes dès le premier tirage.", "Élodie M.", "Directrice marketing, cliente fictive")] }],
        ["cta:band", { title: "Un devis en quelques heures", cta: ["Demander un devis", "/contact"] }]
      ] },
      { key: "produits", name: "Produits", blocks: [
        P("Produits", "Tout ce que nous imprimons"),
        ["gal:cards", { items: [{ t: "Catalogues et brochures", tag: "Offset", x: "De 8 à 200 pages." }, { t: "Packaging", tag: "Carton", x: "Étuis, coffrets et PLV." }, { t: "Signalétique", tag: "Grand format", x: "Bâches, kakémonos, adhésifs." }, { t: "Papeterie", tag: "Numérique", x: "Cartes, en-têtes, enveloppes." }] }],
        ["feat:list2", { title: "Finitions", items: [{ t: "Vernis sélectif" }, { t: "Dorure à chaud" }, { t: "Pelliculage mat ou brillant" }, { t: "Découpe à la forme" }, { t: "Reliure dos carré collé" }, { t: "Perforation" }] }],
        ["cta:split", { title: "Un produit sur mesure ?", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "supports", name: "Supports", blocks: [
        P("Supports", "Papiers et matériaux"),
        ["feat:tabs", { title: "Choisir son support", items: [{ t: "Couché", x: "Mat ou brillant, de 90 à 350 g." }, { t: "Non couché", x: "Toucher naturel pour la papeterie." }, { t: "Recyclé", x: "Aspect sobre, certifié." }, { t: "Carton", x: "Pour l'emballage et les coffrets." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quel format de fichier ?", x: "PDF haute définition avec fonds perdus de 3 mm." }, { t: "Fournissez-vous des échantillons ?", x: "Oui, sur demande, sous 48 h." }] }]
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        P("Tarifs", "Prix indicatifs au tirage (exemples)"),
        ["feat:pricelist", { title: "Quelques repères", items: [{ t: "1 000 flyers A5 recto verso", x: "135 g couché mat", price: "89 €" }, { t: "500 brochures A4, 16 pages", x: "agrafées", price: "690 €" }, { t: "Bâche 3 × 1 m", x: "œillets inclus", price: "64 €" }, { t: "500 cartes de visite", x: "350 g, pelliculées", price: "49 €" }] }],
        ["cta:band", { title: "Votre prix exact en quatre heures", cta: ["Demander un devis", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Atelier ouvert aux visites"), ["contact:map", { title: "Notre atelier", mapAddress: "7 rue Gutenberg, 67000 Strasbourg" }], ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "7 h 30 – 18 h"]] }]] }
    ]
  },
  // 12 ------------------------------------------------------------ sécurité privée (sombre)
  {
    key: "vigilance-sec", name: "Vigilance Nord", category: "entreprise", tags: ["sombre", "technique"], siteType: "Société de sécurité privée (gardiennage, télésurveillance)",
    description: "Sécurité privée : fond encre bleutée, bleu glacé, titres condensés en capitales, bandeau centré, services en bandes et astreinte joignable.",
    brand: "Vigilance Nord",
    tokens: { colors: { primary: "#60a5fa", secondary: "#13203a", accent: "#fbbf24", background: "#0b1220", surface: "#131d31", text: "#eef3fb", muted: "#a7b4c9" }, fonts: { heading: F + "oswald", body: F + "cabin", button: F + "oswald", link: F + "cabin" }, radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 600, lineHeight: 1.02, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 38, weight: 600, lineHeight: 1.08, transform: "uppercase" } } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "sharp" }, art: { seed: "vigilance", motifs: ["topo", "mesh", "skyline"] },
    head: ["head:dark", {}],
    foot: ["foot:columns", { about: "Gardiennage, télésurveillance et sécurité incendie pour sites professionnels.", cols: [["Prestations", "Gardiennage", "Télésurveillance", "Incendie"], ["Société", "Agréments", "Recrutement", "Contact"]] }],
    menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Agréments", "/agrements"], ["Recrutement", "/recrutement"], ["Contact", "/contact"]], cta: ["Audit de sûreté", "/contact"],
    contact: { address: "21 boulevard de la Liberté, 59800 Lille", phone: "03 20 00 33 99", email: "operations@vigilance.example", hours: "Centre opérationnel 24 h/24, 365 j/an", tagline: "Vigilants quand vous ne l'êtes plus." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Sécurité privée", title: "Vos sites surveillés, de jour comme de nuit.", sub: "Agents de sécurité, télésurveillance et prévention incendie, encadrés par un centre opérationnel permanent.", cta: ["Audit de sûreté", "/contact"], cta2: ["Prestations", "/prestations"], stats: [["24 h/24", "centre opérationnel"], ["15 min", "levée de doute (exemple)"], ["320", "agents formés (exemple)"]] }],
        ["feat:strips", { eyebrow: "Prestations", title: "Une réponse à chaque risque", items: [{ t: "Gardiennage", x: "Agents en poste fixe ou en rondes." }, { t: "Télésurveillance", x: "Levée de doute vidéo et intervention." }, { t: "Sécurité incendie", x: "Agents SSIAP pour établissements recevant du public." }, { t: "Événements", x: "Filtrage et gestion des flux." }] }],
        ["feat:steps", { title: "Un incident, une chaîne maîtrisée", items: [{ d: "T0", t: "Alerte", x: "Détection par capteur ou vidéo." }, { d: "T+2 min", t: "Levée de doute", x: "Opérateur et caméras." }, { d: "T+15 min", t: "Intervention", x: "Patrouille ou forces de l'ordre." }, { d: "T+24 h", t: "Rapport", x: "Main courante et suites." }], bg: "token:surface" }],
        ["proof:logos", { title: "Sites protégés (fictifs)", items: ["Centre Les Arcades", "Logipôle", "Clinique du Parc", "Usine Valmeca", "Tour Meridia"] }],
        ["proof:quotes", { items: [Q("Une cinquantaine d'alarmes par mois, aucune intrusion non gérée.", "Rémi A.", "Responsable sûreté, client fictif"), Q("Des agents ponctuels et bien présentés.", "Sylvie D.", "Directrice de site, cliente fictive")] }],
        ["cta:band", { title: "Un doute sur la sûreté de votre site ?", sub: "Audit initial sur place, sans frais.", cta: ["Audit de sûreté", "/contact"] }]
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        P("Prestations", "Gardiennage, télésurveillance, incendie"),
        ["feat:cards", { title: "Notre offre", items: [{ t: "Agents de sécurité", x: "Cartes professionnelles à jour, tenue réglementaire.", icon: "shield" }, { t: "Vidéosurveillance", x: "Caméras connectées et enregistrement.", icon: "eye" }, { t: "Contrôle d'accès", x: "Badges et registre des visiteurs.", icon: "lock" }, { t: "Rondes", x: "Passages aléatoires avec pointeau.", icon: "mapPin" }, { t: "Incendie", x: "Agents SSIAP et exercices.", icon: "alertTriangle" }, { t: "Astreinte", x: "Intervention sur alarme.", icon: "bell" }] }],
        ["feat:compare", { title: "Gardiennage ou télésurveillance", rows: [["", "Gardiennage", "Télésurveillance"], ["Présence humaine", "sur place", "à distance"], ["Coût", "plus élevé", "modéré"], ["Réactivité", "immédiate", "15 min"]], bg: "token:surface" }],
        ["cta:split", { title: "Quelle solution pour votre site ?", cta: ["Parler à un expert", "/contact"] }]
      ] },
      { key: "agrements", name: "Agréments", blocks: [
        P("Agréments", "Des garanties vérifiables"),
        ["feat:list2", { title: "Nos engagements", items: [{ t: "Autorisation d'exercer à jour" }, { t: "Agents titulaires de cartes professionnelles" }, { t: "Assurance responsabilité civile" }, { t: "Formation continue obligatoire" }, { t: "Charte déontologique" }, { t: "Contrôle interne mensuel" }] }],
        ["misc:text", { title: "Transparence", paras: ["Les numéros d'autorisation et attestations sont communiqués sur simple demande avant signature.", "Ce site est une démonstration : les agréments cités sont fictifs."] }],
        ["proof:statsbar", { items: [["320", "agents"], ["24 h/24", "centre opérationnel"], ["12 ans", "d'expérience moyenne"]] }]
      ] },
      { key: "recrutement", name: "Recrutement", blocks: [
        P("Recrutement", "Rejoindre nos équipes"),
        ["gal:listings", { items: [{ t: "Agent de sécurité", tag: "CDI", price: "1 900 €/mois", x: "Lille, nuits et week-ends." }, { t: "Opérateur de télésurveillance", tag: "CDI", price: "2 100 €/mois", x: "Centre opérationnel." }, { t: "Agent SSIAP 1", tag: "CDD", price: "2 000 €/mois", x: "Roubaix, établissement recevant du public." }] }],
        ["feat:checks", { title: "Ce que nous offrons", items: [{ t: "Formation prise en charge" }, { t: "Primes de nuit" }, { t: "Évolution vers chef de poste" }], cta: ["Candidater", "/contact"] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Audit de sûreté gratuit"), ["contact:cards", {}], ["cta:card", { title: "Alarme en cours ?", sub: "Appelez le centre opérationnel.", cta: ["Voir les prestations", "/prestations"] }]] }
    ]
  },
  // 13 ------------------------------------------------------------ déchets et recyclage B2B
  {
    key: "recyclora-eco", name: "Recyclora", category: "entreprise", tags: ["naturel", "chaleureux"], siteType: "Collecte et valorisation de déchets pour entreprises",
    description: "Gestion de déchets B2B : vert olive terreux, slab de caractère, bandeau texte et image, circuit de valorisation en étapes et prix de reprise.",
    brand: "Recyclora Filières",
    tokens: { colors: { primary: "#4d7c0f", secondary: "#26330f", accent: "#d97706", background: "#f7f8ee", surface: "#ffffff", text: "#1d2610", muted: "#4f5a3c" }, fonts: { heading: F + "bitter", body: F + "manrope", button: F + "manrope", link: F + "manrope" }, radius: { sm: 6, md: 12, lg: 20, button: 12, field: 10, card: 18 }, shadow: { card: "sm", button: "none" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "recyclora", motifs: ["botanical", "dunes", "objects"] },
    head: ["head:split", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Filières", "/filieres"], ["Collecte", "/collecte"], ["Reprise", "/reprise"], ["Contact", "/contact"]], cta: ["Programmer une collecte", "/collecte"],
    contact: { address: "Zone de la Plaine, 51100 Reims", phone: "03 26 00 57 10", email: "collecte@recyclora.example", hours: "Lundi – samedi, 6 h – 18 h", tagline: "Ce que vous jetez devient une ressource." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Déchets d'entreprise", title: "Trier, collecter, valoriser : un seul prestataire.", sub: "Cartons, palettes, métaux, déchets dangereux et bio-déchets, avec bordereaux et justificatifs réglementaires.", cta: ["Programmer une collecte", "/collecte"], cta2: ["Nos filières", "/filieres"], image: "hero" }],
        ["feat:grid-icons", { title: "Ce que nous collectons", items: [{ t: "Papier et carton", x: "Bennes et presses à balles.", icon: "layers" }, { t: "Métaux", x: "Reprise rachetée au cours du jour.", icon: "settings" }, { t: "Bio-déchets", x: "Collecte pour restaurants et cantines.", icon: "sun" }, { t: "Déchets dangereux", x: "Huiles, solvants, batteries.", icon: "alertTriangle" }] }],
        ["proof:stats", { title: "Impact (exemples)", items: [["82 %", "valorisés"], ["14 000 t", "traitées par an"], ["650", "clients"]] }],
        ["feat:steps", { title: "Le trajet de vos déchets", items: [{ d: "1", t: "Tri", x: "Conseils et contenants adaptés." }, { d: "2", t: "Collecte", x: "Tournée régulière ou sur appel." }, { d: "3", t: "Valorisation", x: "Recyclage, compostage ou énergie." }, { d: "4", t: "Justificatifs", x: "Bordereaux et rapport annuel." }], bg: "token:surface" }],
        ["proof:big", { items: [Q("Nous avons divisé par deux le volume d'ordures ménagères et gagné en conformité.", "Béatrice L.", "Responsable environnement, cliente fictive")] }],
        ["cta:image", { title: "Faites le point sur vos déchets", sub: "Diagnostic gratuit pour les entreprises de plus de vingt salariés.", cta: ["Programmer une collecte", "/collecte"] }]
      ] },
      { key: "filieres", name: "Filières", blocks: [
        P("Filières", "Chaque déchet a sa destination"),
        ["feat:tabs", { title: "Nos filières de valorisation", items: [{ t: "Papier et carton", x: "Transformés en nouvelles fibres." }, { t: "Bois", x: "Palettes réparées ou broyées en panneaux." }, { t: "Métaux", x: "Triés et refondus." }, { t: "Bio-déchets", x: "Méthanisation ou compostage." }] }],
        ["feat:bento", { title: "Obligations réglementaires", items: [{ t: "Tri à la source", x: "Cinq flux séparés obligatoires.", icon: "list" }, { t: "Registre", x: "Suivi des déchets dangereux.", icon: "fileText" }, { t: "Traçabilité", x: "Bordereaux numériques.", icon: "checkCircle" }] }],
        ["cta:band", { title: "Une filière spécifique ?", cta: ["Nous écrire", "/contact"] }]
      ] },
      { key: "collecte", name: "Collecte", blocks: [
        P("Programmer une collecte", "Fréquence, contenants, tarifs"),
        ["price:tiers", { title: "Formules (tarifs d'exemple)", items: [{ t: "Petit producteur", price: "75 €", period: "/mois", f: ["Un passage par semaine", "Deux bacs"], cta: ["Choisir", "/contact"] }, { t: "Entreprise", price: "290 €", period: "/mois", f: ["Plusieurs flux", "Bennes", "Rapport annuel"], cta: ["Choisir", "/contact"], hl: true }, { t: "Site industriel", price: "Sur devis", f: ["Presse à balles", "Déchets dangereux", "Suivi dédié"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Fournissez-vous les bacs ?", x: "Oui, prêtés pendant le contrat." }, { t: "Collectez-vous le samedi ?", x: "Oui, sur certaines tournées." }] }]
      ] },
      { key: "reprise", name: "Reprise", blocks: [
        P("Reprise des matières", "Prix de rachat indicatifs (exemples)"),
        ["feat:pricelist", { title: "Reprise au cours du jour", items: [{ t: "Carton propre", x: "la tonne", price: "80 €" }, { t: "Cuivre", x: "le kilo", price: "6 €" }, { t: "Aluminium", x: "le kilo", price: "1,10 €" }, { t: "Palettes en bon état", x: "l'unité", price: "2 €" }] }],
        ["misc:text", { title: "Comment ça marche", paras: ["Les prix varient avec les marchés. Une pesée contradictoire est réalisée à chaque enlèvement.", "Le paiement est effectué chaque mois par virement."] }]
      ] },
      { key: "contact", name: "Contact", blocks: [P("Contact", "Collecte et diagnostic"), CT("Parlons de vos déchets", "Votre demande", "Types de déchets, volumes et fréquence souhaitée."), ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "6 h – 18 h"], ["Samedi", "6 h – 12 h"]] }]] }
    ]
  },
];
