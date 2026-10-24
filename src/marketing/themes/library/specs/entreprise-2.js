// Entreprises et services professionnels, suite (11 thèmes). Textes de DÉMONSTRATION : entreprises, personnes et coordonnées fictives.
const pageActus = (title, sub, postsTitle, layout, count) => ({ key: "actualites", name: "Actualités", blocks: [
  ["misc:pagehead", { title, sub }],
  ["misc:posts", { title: postsTitle, count, layout }],
  ["misc:search", { title: "Rechercher dans les publications" }],
] });
const pageContact = (title, sub, formTitle, formIntro, cta, address, mapTitle) => ({ key: "contact", name: "Contact", blocks: [
  ["misc:pagehead", { title, sub }],
  ["contact:cards", { title: formTitle, formTitle: "Écrivez-nous", formIntro, cta }],
  ["contact:map", { title: mapTitle, mapAddress: address }],
] });

module.exports = [
  // 1. Notaire : serif didone, bordeaux et or sur crème, symétrie classique
  {
    key: "etude-valmont", name: "Étude Valmont", category: "entreprise", tags: ["classique", "luxe"], siteType: "Étude notariale",
    description: "Étude notariale solennelle : titres didone bordeaux, fond crème, en-tête centré et carte de visite sobre pour rassurer sur la durée.",
    brand: "Étude Valmont & Associés",
    tokens: { colors: { primary: "#7a1f2b", secondary: "#2b1a1d", accent: "#b08a4a", background: "#f7f1e8", surface: "#fffaf2", text: "#2a1c1e", muted: "#5f4f4f" }, fonts: { heading: "font.rozha-one", body: "font.lora", button: "font.lora", link: "font.lora" }, radius: { sm: 0, md: 2, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9c9b0" }, type: { h1: { size: 52, weight: 400, lineHeight: 1.1, letterSpacing: 0 } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "valmont", motifs: ["arches", "plates", "ribbons"] },
    head: ["head:center", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Actes et conseils", "/actes"], ["Étude", "/etude"], ["Actualités", "/actualites"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "8 place du Marché-aux-Fleurs, 37000 Tours", phone: "02 47 00 12 34", email: "accueil@etude-valmont.example", hours: "Du lundi au vendredi, 9 h – 12 h 30 et 14 h – 18 h", tagline: "Un acte juste, une famille sereine." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Notaires depuis 1962", title: "Sécuriser vos projets de vie, avec tact.", sub: "Achat immobilier, succession, contrat de mariage, donation : l'étude vous guide pas à pas, de la première question à la signature.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Nos actes", "/actes"] }],
        ["feat:icons", { eyebrow: "Nos domaines", title: "Les moments qui comptent", items: [{ icon: "home", t: "Immobilier", x: "Compromis, vente, acquisition et prêts : un acte authentique garanti." }, { icon: "users", t: "Famille", x: "Mariage, pacs, divorce amiable, protection d'un proche." }, { icon: "fileText", t: "Succession", x: "Déclaration, partage et conseils de transmission." }] }],
        ["misc:quote", { text: "Un bon acte est celui que l'on n'a jamais besoin de rouvrir.", by: "Maître Odile Valmont, notaire associée (personnage fictif)" }],
        ["feat:steps", { eyebrow: "Parcours d'un dossier", title: "De la première rencontre à la signature", items: [{ d: "Semaine 1", t: "Premier rendez-vous", x: "Écoute de votre situation et liste des pièces à réunir." }, { d: "Semaine 2", t: "Rédaction", x: "Projet d'acte envoyé pour relecture, avec explications." }, { d: "Semaine 4", t: "Signature", x: "Lecture commentée de l'acte et remise des copies." }] }],
        ["proof:quotes", { title: "Familles accompagnées", items: [{ q: "Chaque clause m'a été expliquée sans jargon.", n: "Marie-Anne F.", r: "Succession, cliente fictive" }, { q: "Nous avons signé notre achat en toute confiance.", n: "Julien et Camille P.", r: "Achat immobilier, clients fictifs" }, { q: "Un accueil attentif dans une période difficile.", n: "Gérard T.", r: "Donation, client fictif" }] }],
        ["cta:card", { title: "Une première question ?", sub: "Le premier échange téléphonique est gratuit et sans engagement.", cta: ["Nous appeler", "/contact"] }],
      ] },
      { key: "actes", name: "Actes et conseils", blocks: [
        ["misc:pagehead", { title: "Actes et conseils", sub: "Les actes que nous établissons, avec leurs délais habituels." }],
        ["feat:pricelist", { title: "Quelques repères de coûts (exemples)", intro: "Les frais d'acte dépendent du dossier ; ces montants sont donnés à titre d'illustration.", items: [{ t: "Consultation d'orientation", x: "Trente minutes, sur rendez-vous.", price: "Offerte" }, { t: "Contrat de mariage", x: "Rédaction et conseil patrimonial.", price: "dès 480 €" }, { t: "Donation entre époux", x: "Acte et enregistrement.", price: "dès 390 €" }, { t: "Testament authentique", x: "Rédaction, lecture et conservation.", price: "dès 160 €" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Combien de temps pour une vente immobilière ?", x: "Comptez deux à trois mois entre la signature du compromis et l'acte définitif." }, { t: "Quels documents apporter à un premier rendez-vous ?", x: "Pièce d'identité, livret de famille et tout document relatif au bien ou à la succession." }, { t: "Puis-je être représenté à la signature ?", x: "Oui, par procuration authentique établie à l'étude." }] }],
        ["cta:split", { title: "Besoin d'un devis détaillé ?", sub: "Envoyez-nous votre situation, nous vous répondons sous 48 heures.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "etude", name: "L'étude", blocks: [
        ["misc:pagehead", { title: "L'étude" }],
        ["misc:text", { eyebrow: "Une maison de famille", title: "Trois générations de notaires", paras: ["Fondée en 1962 au cœur de la ville, l'étude a toujours cultivé la même discrétion et la même disponibilité.", "Aujourd'hui, une équipe de neuf personnes se partage les dossiers par spécialité, pour que chaque client trouve un interlocuteur compétent et identifié."] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Odile Valmont", r: "Notaire associée" }, { n: "Étienne Garnier", r: "Notaire associé, immobilier" }, { n: "Nadia Benhamou", r: "Clerc, successions" }, { n: "Louis Mercier", r: "Clerc, droit de la famille" }] }],
        ["feat:list2", { title: "Nos engagements", items: [{ t: "Confidentialité absolue" }, { t: "Réponse sous 48 heures" }, { t: "Honoraires annoncés par écrit" }, { t: "Explication de chaque clause" }] }],
      ] },
      pageActus("Actualités de l'étude", "Les évolutions du droit, expliquées simplement.", "Derniers articles", "list", 6),
      pageContact("Contact et accès", "Sur rendez-vous, du lundi au vendredi.", "Nous trouver", "Décrivez brièvement votre situation : un clerc vous rappellera.", ["Envoyer ma demande", "/contact"], "8 place du Marché-aux-Fleurs, 37000 Tours", "Accès à l'étude"),
    ],
  },

  // 2. Avocats : sombre, or, serif fin italiana, header split
  {
    key: "barreau-noir", name: "Barreau Noir", category: "entreprise", tags: ["sombre", "luxe"], siteType: "Cabinet d'avocats",
    description: "Cabinet d'avocats d'affaires en thème sombre : bleu nuit, filets dorés, titres fins en capitales et grand bandeau photographique.",
    brand: "Delcourt Avocats",
    tokens: { colors: { primary: "#c9a557", secondary: "#0a1220", accent: "#e2c98a", background: "#101a2b", surface: "#17243a", text: "#eef1f6", muted: "#aab6c9" }, fonts: { heading: "font.italiana", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2b3b57" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.05, letterSpacing: 0.02, transform: "uppercase" }, h2: { size: 36, weight: 400, lineHeight: 1.15, letterSpacing: 0.04, transform: "uppercase" } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "barreau", motifs: ["skyline", "halftone", "rays"] },
    head: ["head:split", {}], foot: ["foot:big", { title: "Delcourt Avocats" }],
    menu: [["Accueil", "/"], ["Domaines", "/domaines"], ["Le cabinet", "/cabinet"], ["Publications", "/actualites"], ["Contact", "/contact"]], cta: ["Consultation", "/contact"],
    contact: { address: "27 quai des Chartrons, 33000 Bordeaux", phone: "05 56 00 45 67", email: "cabinet@delcourt-avocats.example", hours: "Du lundi au vendredi, 8 h 30 – 19 h", tagline: "Défendre, conseiller, anticiper." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Droit des affaires et contentieux", title: "Votre litige mérite une stratégie, pas un pari.", sub: "Six avocats, trois barreaux, une même méthode : comprendre l'enjeu économique avant de plaider.", cta: ["Demander une consultation", "/contact"], cta2: ["Nos domaines", "/domaines"], overlay: "#0a1220b3" }],
        ["feat:strips", { eyebrow: "Domaines d'intervention", title: "Là où nous pesons dans la balance", items: [{ t: "Contentieux commercial", x: "Rupture de contrat, concurrence déloyale, recouvrement : plaidoiries et médiations." }, { t: "Droit des sociétés", x: "Pactes d'associés, levées de fonds, cessions." }, { t: "Droit social", x: "Licenciements, négociations collectives, prud'hommes." }] }],
        ["proof:statsbar", { items: [["320", "dossiers traités"], ["18", "ans de barreau"], ["7", "langues de travail"]] }],
        ["feat:alt", { eyebrow: "Méthode", title: "Une défense construite en amont", items: [{ t: "Audit du dossier", x: "Nous chiffrons les risques avant tout engagement, avec une note de synthèse écrite." }, { t: "Stratégie amiable d'abord", x: "Négociation et médiation quand elles servent vos intérêts, contentieux quand il le faut." }] }],
        ["misc:quote", { text: "Le droit est une langue : il faut la parler mieux que la partie adverse.", by: "Maître Anaïs Delcourt, associée (personnage fictif)" }],
        ["cta:split", { title: "Un différend en cours ?", sub: "Premier rendez-vous confidentiel sous 72 heures.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "domaines", name: "Domaines", blocks: [
        ["misc:pagehead", { title: "Domaines d'intervention", sub: "Conseil, contentieux et accompagnement dans la durée." }],
        ["feat:tabs", { title: "Nos spécialités", items: [{ t: "Contentieux", x: "Représentation devant les tribunaux de commerce, les cours d'appel et en arbitrage." }, { t: "Sociétés", x: "Rédaction de pactes, restructurations, opérations de croissance externe." }, { t: "Social", x: "Audits RH, contentieux individuel et collectif, plans de départ." }, { t: "Propriété intellectuelle", x: "Marques, contrats de licence, protection des créations." }] }],
        ["feat:compare", { title: "Choisir son mode d'honoraires", rows: [["", "Forfait", "Au temps passé", "Résultat"], ["Budget connu à l'avance", "oui", "non", "en partie"], ["Adapté aux dossiers longs", "non", "oui", "oui"], ["Convention écrite", "oui", "oui", "oui"]] }],
        ["feat:accordion", { title: "Questions avant de nous consulter", items: [{ t: "Le premier rendez-vous est-il payant ?", x: "Il est facturé au forfait de 120 € dans l'exemple présenté ici, déduit des honoraires si vous nous confiez le dossier." }, { t: "Intervenez-vous hors de Bordeaux ?", x: "Oui, devant l'ensemble des juridictions françaises, avec nos correspondants." }] }],
      ] },
      { key: "cabinet", name: "Le cabinet", blocks: [
        ["misc:pagehead", { title: "Le cabinet" }],
        ["misc:story", { eyebrow: "Notre approche", title: "Peu de dossiers, beaucoup d'attention", paras: ["Le cabinet limite volontairement le nombre de dossiers par avocat afin de rester disponible lors des audiences comme des négociations.", "Chaque client dispose d'un avocat référent et d'un point d'étape mensuel."] }],
        ["proof:team", { title: "Les avocats", items: [{ n: "Anaïs Delcourt", r: "Associée, contentieux" }, { n: "Rafael Montès", r: "Associé, sociétés" }, { n: "Élise Wagner", r: "Counsel, droit social" }] }],
        ["proof:logos", { title: "Institutions et réseaux (fictifs)", items: ["Barreau du Sud-Ouest", "Chambre arbitrale Atlantique", "Réseau Lexis-Nova", "Forum du droit de l'entreprise"] }],
      ] },
      pageActus("Publications", "Veille juridique et décryptages du cabinet.", "Dernières notes", "grid", 6),
      pageContact("Prendre contact", "Toutes les demandes sont traitées en confidentialité.", "Nos coordonnées", "Expliquez en quelques lignes l'objet du litige, sans joindre de pièces.", ["Envoyer", "/contact"], "27 quai des Chartrons, 33000 Bordeaux", "Le cabinet"),
    ],
  },

  // 3. Assurances : chaleureux, turquoise et orange, bandeau d'infos, arrondis
  {
    key: "abri-solide", name: "Abri Solide", category: "entreprise", tags: ["chaleureux", "moderne"], siteType: "Agence d'assurances",
    description: "Agence d'assurances de proximité : turquoise rassurant, touches orange, formes douces, bandeau de contact et comparatif de formules.",
    brand: "Abri Solide Assurances",
    tokens: { colors: { primary: "#0f7c80", secondary: "#0b3b4a", accent: "#f28c28", background: "#f2f9f8", surface: "#ffffff", text: "#17313a", muted: "#4d6670" }, fonts: { heading: "font.public-sans", body: "font.nunito", button: "font.public-sans", link: "font.nunito" }, radius: { sm: 8, md: 14, lg: 20, button: 999, field: 12, card: 18 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 50, weight: 800, lineHeight: 1.08, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "pill" }, art: { seed: "abri", motifs: ["blobs", "waves", "objects"] },
    head: ["head:topbar", { info: "Un conseiller vous répond au 04 00 12 98 76", note: "Du lundi au samedi" }], foot: ["foot:newsletter", { title: "Les bons réflexes assurance", sub: "Un conseil par mois, jamais de démarchage.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Nos assurances", "/assurances"], ["Sinistre", "/sinistre"], ["Agences", "/agences"], ["Contact", "/contact"]], cta: ["Devis gratuit", "/contact"],
    contact: { address: "5 avenue de la République, 69003 Lyon", phone: "04 00 12 98 76", email: "bonjour@abri-solide.example", hours: "Lundi au vendredi 9 h – 18 h, samedi 9 h – 12 h", tagline: "Des garanties claires, un conseiller qui décroche." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Assurance de proximité", title: "Protégez ce qui compte, sans lire 40 pages.", sub: "Auto, habitation, santé, responsabilité des professionnels : un devis en 5 minutes, un conseiller à votre écoute.", cta: ["Obtenir mon devis", "/contact"], cta2: ["Déclarer un sinistre", "/sinistre"] }],
        ["feat:grid-icons", { title: "Quatre protections essentielles", items: [{ icon: "home", t: "Habitation", x: "Dégâts des eaux, vol, incendie." }, { icon: "globe", t: "Auto et moto", x: "Tous risques ou au tiers." }, { icon: "heart", t: "Santé", x: "Mutuelle individuelle et famille." }, { icon: "shield", t: "Professionnels", x: "Responsabilité civile et locaux." }] }],
        ["price:tiers", { title: "Assurance habitation : trois formules (exemples)", items: [{ t: "Essentiel", price: "9 €", period: "/ mois", x: "L'indispensable pour un locataire.", f: ["Responsabilité civile", "Incendie, dégâts des eaux", "Assistance 24 h/24"], cta: ["Choisir", "/contact"] }, { t: "Confort", price: "17 €", period: "/ mois", x: "Le plus choisi.", f: ["Tout l'Essentiel", "Vol et vandalisme", "Objets de valeur jusqu'à 3 000 €"], cta: ["Choisir", "/contact"], hl: true }, { t: "Sérénité", price: "29 €", period: "/ mois", x: "Pour les propriétaires.", f: ["Tout le Confort", "Protection juridique", "Panne d'équipements"], cta: ["Choisir", "/contact"] }] }],
        ["proof:stats", { title: "Notre engagement en chiffres (exemples)", items: [["48 h", "pour l'envoi d'un expert"], ["12 000", "foyers couverts"], ["9/10", "clients recommandent l'agence"]] }],
        ["proof:quotes", { title: "Après un sinistre", items: [{ q: "Remboursé en neuf jours, avec un appel de suivi.", n: "Sophie M.", r: "Dégât des eaux, cliente fictive" }, { q: "Mon conseiller m'a trouvé 200 € d'économie.", n: "Karim A.", r: "Assurance auto, client fictif" }, { q: "Un interlocuteur unique, c'est rare.", n: "Béatrice L.", r: "Professionnelle, cliente fictive" }] }],
        ["cta:band", { title: "Comparez vos garanties avec un conseiller.", sub: "Gratuit, sans engagement, en agence ou par téléphone.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "assurances", name: "Nos assurances", blocks: [
        ["misc:pagehead", { title: "Nos assurances", sub: "Pour les particuliers, les indépendants et les petites entreprises." }],
        ["feat:cards", { title: "Particuliers", items: [{ icon: "home", t: "Multirisque habitation", x: "Appartement ou maison, propriétaire ou locataire." }, { icon: "globe", t: "Assurance auto", x: "Formules adaptées au jeune conducteur comme au bonus maximal." }, { icon: "heart", t: "Mutuelle santé", x: "Remboursements dentaire, optique et hospitalisation." }] }],
        ["feat:strips", { title: "Professionnels", items: [{ t: "Responsabilité civile professionnelle", x: "Dommages causés à vos clients ou à des tiers." }, { t: "Multirisque locaux", x: "Stocks, matériel, perte d'exploitation." }, { t: "Prévoyance du dirigeant", x: "Maintien de revenu en cas d'arrêt de travail." }] }],
        ["feat:compare", { title: "Auto : quelle formule ?", rows: [["", "Tiers", "Tiers étendu", "Tous risques"], ["Responsabilité civile", "oui", "oui", "oui"], ["Vol et incendie", "non", "oui", "oui"], ["Dommages au véhicule", "non", "non", "oui"]] }],
      ] },
      { key: "sinistre", name: "Sinistre", blocks: [
        ["misc:pagehead", { title: "Déclarer un sinistre", sub: "Les bons gestes dans l'ordre." }],
        ["feat:steps", { title: "En quatre étapes", items: [{ d: "Jour J", t: "Sécurisez les lieux", x: "Coupez l'eau ou l'électricité, photographiez les dégâts." }, { d: "Sous 5 jours", t: "Prévenez-nous", x: "Appel, formulaire en ligne ou passage en agence." }, { d: "Sous 10 jours", t: "Expertise", x: "Un expert fixe un rendez-vous si nécessaire." }, { d: "Sous 3 semaines", t: "Indemnisation", x: "Virement après accord sur le chiffrage." }] }],
        ["feat:accordion", { title: "Questions courantes", items: [{ t: "Que couvre la franchise ?", x: "Une part restant à votre charge, indiquée dans votre contrat." }, { t: "Puis-je choisir mon réparateur ?", x: "Oui, nous proposons aussi un réseau d'artisans agréés." }] }],
        ["cta:split", { title: "Urgence 24 h/24", sub: "Appelez le numéro d'assistance figuré sur votre carte.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "agences", name: "Agences", blocks: [
        ["misc:pagehead", { title: "Nos agences" }],
        ["feat:alt", { title: "Trois lieux d'accueil", items: [{ t: "Lyon Part-Dieu", x: "Accueil sans rendez-vous du lundi au samedi matin." }, { t: "Villeurbanne", x: "Conseillers dédiés aux professionnels et commerçants." }, { t: "Vénissieux", x: "Permanence famille et santé les mardis et jeudis." }] }],
        ["misc:hours", { title: "Horaires d'ouverture (exemple)", rows: [["Lundi – vendredi", "9 h – 18 h"], ["Samedi", "9 h – 12 h"], ["Dimanche", "Fermé"]] }],
        pageActusBlock(),
      ] },
      pageContact("Parlons de votre protection", "Un conseiller vous rappelle dans la journée.", "Coordonnées", "Indiquez le type d'assurance recherché et votre disponibilité.", ["Être rappelé", "/contact"], "5 avenue de la République, 69003 Lyon", "Agence principale"),
    ],
  },

  // 4. RH / recrutement : vif, violet et lime, poster, header flottant
  {
    key: "talent-vif", name: "Talent Vif", category: "entreprise", tags: ["audacieux", "ludique"], siteType: "Cabinet de recrutement",
    description: "Cabinet de recrutement affirmé : violet électrique, touche citron, titres marqueur et affiche d'accueil en capitales, barre d'en-tête flottante.",
    brand: "Talent Vif Recrutement",
    tokens: { colors: { primary: "#6c3df0", secondary: "#1c1240", accent: "#c6f432", background: "#fbfaff", surface: "#ffffff", text: "#1d1a33", muted: "#55507a" }, fonts: { heading: "font.permanent-marker", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 10, md: 16, lg: 24, button: 14, field: 12, card: 20 }, shadow: { card: "lg", button: "md" }, type: { h1: { size: 58, weight: 400, lineHeight: 1.05, letterSpacing: 0 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "talent", motifs: ["blobs", "bokeh", "mesh"] },
    head: ["head:float", {}], foot: ["foot:columns", { about: "Recrutement de cadres et de profils rares en région, pour des PME qui veulent grandir.", cols: [["Entreprises", "Missions", "Honoraires", "Candidats"], ["Cabinet", "Équipe", "Actualités", "Contact"]] }],
    menu: [["Accueil", "/"], ["Entreprises", "/entreprises"], ["Candidats", "/candidats"], ["L'équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Déposer une offre", "/contact"],
    contact: { address: "14 rue des Capucins, 44000 Nantes", phone: "02 40 00 77 21", email: "hello@talent-vif.example", hours: "Du lundi au vendredi, 9 h – 18 h 30", tagline: "Les bons profils au bon moment." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Recrutement en PME", title: "Recrutez ceux qui feront la différence.", sub: "Chasse, présélection et intégration de cadres et de profils techniques : un shortlist en trois semaines.", cta: ["Déposer une offre", "/contact"], cta2: ["Voir les postes", "/candidats"] }],
        ["proof:logos", { title: "Entreprises accompagnées (fictives)", items: ["Brasserie Océane", "Kelvin Tech", "Maison Arnaud", "Studio Croisette", "Nantaise Logistique"] }],
        ["feat:numbered", { eyebrow: "Notre méthode", title: "Trois étapes, zéro CV en vrac", items: [{ t: "Cadrer", x: "Nous définissons avec vous le poste, la culture et le budget." }, { t: "Chasser", x: "Réseau, annonces ciblées et approche directe de profils en poste." }, { t: "Intégrer", x: "Suivi pendant la période d'essai, avec bilans à 1 et 3 mois." }] }],
        ["feat:checks", { title: "Ce que vous obtenez", cta: ["Voir les honoraires", "/entreprises"], items: [{ t: "Shortlist de 3 à 5 profils qualifiés" }, { t: "Évaluation des compétences et des motivations" }, { t: "Garantie de remplacement de 6 mois" }, { t: "Reporting hebdomadaire" }] }],
        ["proof:big", { items: [{ q: "Notre candidat est arrivé avec une équipe prête à l'écouter. Un recrutement qui a changé notre trimestre.", n: "Directrice d'exploitation", r: "cliente fictive" }] }],
        ["cta:split", { title: "Un poste à pourvoir ?", sub: "Décrivez-le en dix minutes, nous revenons avec un plan de recherche.", cta: ["Parler à un consultant", "/contact"] }],
      ] },
      { key: "entreprises", name: "Entreprises", blocks: [
        ["misc:pagehead", { title: "Pour les entreprises", sub: "Des formules claires, sans surprise." }],
        ["price:tiers", { title: "Nos formules (exemples d'honoraires)", items: [{ t: "Sélection", price: "12 %", period: "du salaire annuel", x: "Annonce et présélection.", f: ["Rédaction de l'offre", "Diffusion ciblée", "Shortlist de 3 profils"], cta: ["Démarrer", "/contact"] }, { t: "Chasse", price: "18 %", period: "du salaire annuel", x: "Profils en poste.", f: ["Cartographie du marché", "Approche directe", "Garantie de 6 mois"], cta: ["Démarrer", "/contact"], hl: true }, { t: "Direction", price: "Sur devis", x: "Postes de comité de direction.", f: ["Assessment complet", "Confidentialité renforcée", "Accompagnement 12 mois"], cta: ["Nous écrire", "/contact"] }] }],
        ["feat:rows", { title: "Les métiers que nous recrutons", items: [{ t: "Direction et gestion", x: "DAF, directeurs d'exploitation, responsables RH." }, { t: "Commercial", x: "Responsables de comptes, business developers." }, { t: "Technique et industrie", x: "Ingénieurs méthodes, responsables de production." }, { t: "Numérique", x: "Développeurs, chefs de projet, data analysts." }] }],
        ["cta:band", { title: "Besoin d'un devis personnalisé ?", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "candidats", name: "Candidats", blocks: [
        ["misc:pagehead", { title: "Pour les candidats", sub: "Quelques postes ouverts (offres de démonstration)." }],
        ["gal:cards", { title: "Postes en cours", items: [{ tag: "CDI", t: "Responsable logistique", x: "Entrepôt de 8 000 m², équipe de 25 personnes, Nantes." }, { tag: "CDI", t: "Business developer", x: "Solutions logicielles pour PME, déplacements en Pays de la Loire." }, { tag: "CDD", t: "Contrôleur de gestion", x: "Remplacement de 9 mois, industrie agroalimentaire." }] }],
        ["feat:steps", { title: "Notre accompagnement", items: [{ t: "Entretien", x: "Un point d'une heure pour comprendre vos attentes." }, { t: "Mise en relation", x: "Vous ne postulez qu'aux offres qui vous correspondent." }, { t: "Préparation", x: "Simulation d'entretien et retours après chaque rencontre." }] }],
        ["cta:card", { title: "Envoyez-nous votre CV", sub: "Il ne sera jamais transmis sans votre accord.", cta: ["Déposer mon CV", "/contact"] }],
      ] },
      { key: "equipe", name: "L'équipe", blocks: [
        ["misc:pagehead", { title: "L'équipe" }],
        ["proof:team", { title: "Cinq consultants en région", items: [{ n: "Lou Perrin", r: "Fondatrice" }, { n: "Matthieu Roche", r: "Industrie et logistique" }, { n: "Yasmine Hadj", r: "Commerce et marketing" }, { n: "Théo Brunet", r: "Numérique" }] }],
        ["proof:stats", { items: [["380", "recrutements réalisés"], ["21 jours", "délai moyen de shortlist"], ["91 %", "de postes confirmés après 12 mois"]] }],
        ["feat:list2", { title: "Notre charte", items: [{ t: "Aucun profil transmis sans accord" }, { t: "Honoraires uniquement au succès" }, { t: "Transparence sur les rémunérations" }, { t: "Retour à chaque candidat" }] }],
      ] },
      pageContact("Contact", "Dites-nous qui vous cherchez.", "Écrivons-nous", "Poste, localisation et fourchette de rémunération suffisent pour débuter.", ["Envoyer", "/contact"], "14 rue des Capucins, 44000 Nantes", "Dans le centre de Nantes"),
    ],
  },

  // 5. Traduction : papier chaud, slab, en-tête journal, éditorial
  {
    key: "lexique-et-lettres", name: "Lexique & Lettres", category: "entreprise", tags: ["editorial", "chaleureux"], siteType: "Agence de traduction",
    description: "Agence de traduction aux allures d'édition : papier chaud, terracotta et bleu-vert, slab serif, bandeau de journal et grand titre éditorial.",
    brand: "Lexique & Lettres",
    tokens: { colors: { primary: "#8a4b2a", secondary: "#3a2a20", accent: "#2f6f73", background: "#faf6ef", surface: "#ffffff", text: "#2b231d", muted: "#675a4f" }, fonts: { heading: "font.roboto-slab", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 3, md: 6, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#e1d6c4" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.06, letterSpacing: -0.02 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "lexique", motifs: ["ribbons", "tiles", "arches"] },
    head: ["head:masthead", { dateline: "Traduction, relecture, localisation : 24 langues" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Langues et services", "/services"], ["Tarifs", "/tarifs"], ["Notre atelier", "/atelier"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "3 rue des Imprimeurs, 67000 Strasbourg", phone: "03 88 00 31 42", email: "devis@lexique-lettres.example", hours: "Du lundi au vendredi, 9 h – 17 h 30", tagline: "Le mot juste, dans la langue qu'il faut." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { eyebrow: "Agence de traduction", kicker: "24 langues, 140 traducteurs", title: "Des textes qui se lisent comme s'ils étaient nés dans la langue d'arrivée.", sub: "Contrats, notices, sites web, supports de formation : nous traduisons, relisons et adaptons vos documents avec des traducteurs natifs et spécialisés.", cta: ["Demander un devis", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
        ["feat:strips", { eyebrow: "Services", title: "Quatre manières de traduire", items: [{ t: "Traduction spécialisée", x: "Juridique, technique, médical, marketing, par des traducteurs du domaine." }, { t: "Relecture bilingue", x: "Vérification d'une traduction existante, avec corrections commentées." }, { t: "Localisation web", x: "Adaptation de sites, applications et fiches produit." }, { t: "Traduction assermentée", x: "Documents officiels certifiés conformes." }] }],
        ["proof:statsbar", { items: [["24", "langues couvertes"], ["48 h", "pour les textes courts"], ["15 000", "pages traduites par mois"]] }],
        ["feat:steps", { title: "Du devis à la livraison", items: [{ d: "1", t: "Devis", x: "Réponse dans l'heure en jours ouvrés." }, { d: "2", t: "Traduction", x: "Glossaire validé avec vous avant de commencer." }, { d: "3", t: "Relecture", x: "Second linguiste indépendant." }, { d: "4", t: "Livraison", x: "Fichiers à la mise en page d'origine." }] }],
        ["proof:quotes", { title: "Retours d'expérience", items: [{ q: "Nos notices sont enfin cohérentes dans six langues.", n: "Direction qualité", r: "Industrie, client fictif" }, { q: "Un glossaire partagé qui nous fait gagner des semaines.", n: "Chef de projet", r: "Édition, cliente fictive" }, { q: "Livraison la veille de notre salon, impeccable.", n: "Responsable export", r: "PME, client fictif" }] }],
        ["cta:band", { title: "Vous avez un texte à traduire ?", sub: "Envoyez le fichier, nous chiffrons gratuitement.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "services", name: "Langues et services", blocks: [
        ["misc:pagehead", { title: "Langues et services", sub: "Des équipes natives, spécialisées par domaine." }],
        ["feat:tabs", { title: "Nos domaines", items: [{ t: "Juridique", x: "Contrats, statuts, procédures : terminologie validée par des juristes." }, { t: "Technique", x: "Notices, fiches de sécurité, manuels de maintenance." }, { t: "Marketing", x: "Transcréation de slogans, catalogues, campagnes." }, { t: "Médical", x: "Protocoles, notices patients, communications scientifiques." }] }],
        ["feat:grid-icons", { title: "Langues les plus demandées", items: [{ icon: "globe", t: "Anglais", x: "Britannique et américain." }, { icon: "globe", t: "Allemand", x: "Allemagne, Autriche, Suisse." }, { icon: "globe", t: "Espagnol", x: "Europe et Amérique latine." }, { icon: "globe", t: "Italien", x: "Contrats et mode." }] }],
        ["cta:split", { title: "Une langue rare ?", sub: "Nous constituons une équipe sur mesure.", cta: ["Nous consulter", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs indicatifs", sub: "Prix au mot, hors taxes, pour des textes courants (exemples)." }],
        ["feat:pricelist", { title: "Grille de démonstration", items: [{ t: "Anglais vers français", x: "Texte général.", price: "0,10 € / mot" }, { t: "Allemand vers français", x: "Texte technique.", price: "0,14 € / mot" }, { t: "Relecture bilingue", x: "Correction commentée.", price: "0,05 € / mot" }, { t: "Document assermenté", x: "Acte d'état civil, la page.", price: "45 €" }] }],
        ["feat:accordion", { title: "Comment est calculé un devis ?", items: [{ t: "Que comprend le prix au mot ?", x: "La traduction, la relecture par un second linguiste et la mise en page." }, { t: "Y a-t-il un minimum de facturation ?", x: "Dans cet exemple, 40 € par commande." }] }],
      ] },
      { key: "atelier", name: "Notre atelier", blocks: [
        ["misc:pagehead", { title: "Notre atelier" }],
        ["misc:story", { eyebrow: "Depuis 2004", title: "Une petite maison, un grand carnet d'adresses", paras: ["Née d'un trio de traducteurs strasbourgeois, l'agence réunit aujourd'hui cent quarante professionnels partout en Europe.", "Chaque traducteur est évalué tous les ans sur des textes réels."], image: "portrait-2" }],
        ["proof:team", { title: "Chefs de projet", items: [{ n: "Ingrid Lang", r: "Direction" }, { n: "Pablo Serrano", r: "Projets ibériques" }, { n: "Mina Kovač", r: "Langues d'Europe centrale" }] }],
        pageActusBlock(),
      ] },
      pageContact("Demander un devis", "Joignez votre fichier et précisez la langue d'arrivée.", "Nos coordonnées", "Texte, langues, date de livraison souhaitée : nous répondons sous une heure ouvrée.", ["Envoyer ma demande", "/contact"], "3 rue des Imprimeurs, 67000 Strasbourg", "Dans la Petite France"),
    ],
  },

  // 6. Ingénierie : bleu bureau d'études, orange, side header, sans fond bleu
  {
    key: "trace-et-calcul", name: "Trace & Calcul", category: "entreprise", tags: ["technique", "geometrique"], siteType: "Bureau d'études",
    description: "Bureau d'études techniques : bleu plan, orange de repérage, fonds clairs bleutés, coins nets, en-tête à slogan et bandeau sur fond sombre.",
    brand: "Trace & Calcul Ingénierie",
    tokens: { colors: { primary: "#0b5cad", secondary: "#0a2540", accent: "#ff7a1a", background: "#eef3f8", surface: "#ffffff", text: "#0e1c2c", muted: "#4b5d70" }, fonts: { heading: "font.chivo", body: "font.ibm-plex-sans", button: "font.chivo", link: "font.ibm-plex-sans" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#cbd6e2" }, type: { h1: { size: 50, weight: 900, lineHeight: 1.04, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "trace", motifs: ["topo", "tiles", "mesh"] },
    head: ["head:side", {}], foot: ["foot:columns", { about: "Bureau d'études en structure, fluides et infrastructures pour le bâtiment et l'industrie.", cols: [["Compétences", "Structure", "Fluides", "Infrastructures"], ["Bureau", "Références", "Carrières", "Contact"]] }],
    menu: [["Accueil", "/"], ["Compétences", "/competences"], ["Références", "/references"], ["Le bureau", "/bureau"], ["Contact", "/contact"]], cta: ["Soumettre un projet", "/contact"],
    contact: { address: "Parc d'activités Les Hauts-de-Garonne, 31200 Toulouse", phone: "05 61 00 28 90", email: "projets@trace-calcul.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h", tagline: "Calculer juste pour construire sûr." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Ingénierie du bâtiment et de l'industrie", title: "Des plans qui tiennent debout, des budgets qui tiennent.", sub: "Structure, fluides, VRD : trente ingénieurs au service des maîtres d'ouvrage, architectes et entreprises générales.", cta: ["Soumettre un projet", "/contact"], cta2: ["Nos compétences", "/competences"] }],
        ["proof:statsbar", { items: [["30", "ingénieurs"], ["420", "projets livrés"], ["12 M€", "de travaux étudiés par mois"]] }],
        ["feat:cards", { eyebrow: "Compétences", title: "Trois pôles, une même chaîne de calcul", items: [{ t: "Structure", x: "Béton, charpente métallique et bois : notes de calcul, plans d'exécution, suivi de chantier." }, { t: "Fluides", x: "Chauffage, ventilation, plomberie, électricité." }, { t: "Infrastructures", x: "Voiries et réseaux divers, assainissement." }] }],
        ["feat:compare", { title: "Missions : quelle intervention ?", rows: [["", "Études", "Études + suivi", "Maîtrise d'œuvre"], ["Notes de calcul", "oui", "oui", "oui"], ["Plans d'exécution", "oui", "oui", "oui"], ["Visites de chantier", "non", "oui", "oui"], ["Coordination des corps d'état", "non", "non", "oui"]] }],
        ["proof:quotes", { title: "Partenaires", items: [{ q: "Des notes de calcul claires, livrées à la date prévue.", n: "Agence d'architecture", r: "client fictif" }, { q: "Ils ont optimisé notre structure de 12 %.", n: "Promoteur régional", r: "client fictif" }] }],
        ["cta:band", { title: "Un projet à chiffrer ?", sub: "Envoyez vos plans, nous répondons sous cinq jours.", cta: ["Soumettre un projet", "/contact"] }],
      ] },
      { key: "competences", name: "Compétences", blocks: [
        ["misc:pagehead", { title: "Compétences", sub: "Du pré-dimensionnement à l'assistance au chantier." }],
        ["feat:alt", { title: "Nos pôles", items: [{ t: "Structure", x: "Dimensionnement aux Eurocodes, modélisation 3D, diagnostics de bâtiments existants." }, { t: "Fluides et énergie", x: "Études thermiques, ventilation double flux, solaire thermique." }, { t: "Infrastructures", x: "Voiries, réseaux, bassins de rétention." }] }],
        ["feat:rows", { title: "Phases de mission", items: [{ t: "Esquisse et faisabilité", x: "Comparaison de solutions et estimation du coût." }, { t: "Avant-projet", x: "Dimensionnement et plans de principe." }, { t: "Projet et exécution", x: "Notes de calcul, plans, quantitatifs." }, { t: "Chantier", x: "Visa des plans d'entreprise et visites." }] }],
        ["cta:split", { title: "Besoin d'un avis technique ?", sub: "Un ingénieur vous rappelle sous 24 heures.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "references", name: "Références", blocks: [
        ["misc:pagehead", { title: "Références", sub: "Une sélection de réalisations (projets fictifs)." }],
        ["gal:featured", { title: "Réalisations récentes", items: [{ t: "Halle logistique de 12 000 m²", x: "Charpente métallique, portée de 40 m." }, { t: "Résidence de 64 logements", x: "Structure béton, étude thermique RE2020." }, { t: "Passerelle piétonne", x: "Tablier en bois lamellé-collé." }, { t: "Station d'épuration", x: "Génie civil et réseaux." }] }],
        ["proof:logos", { title: "Maîtres d'ouvrage (fictifs)", items: ["Garonne Habitat", "Mécanique Sud", "Ville de Valmeuse", "Port Atlantique", "Archi-Nord"] }],
        ["proof:stats", { items: [["0", "sinistre structurel sur nos ouvrages (exemple)"], ["98 %", "de livrables remis à la date contractuelle"]] }],
      ] },
      { key: "bureau", name: "Le bureau", blocks: [
        ["misc:pagehead", { title: "Le bureau" }],
        ["misc:text", { eyebrow: "Créé en 2003", title: "Un bureau indépendant d'ingénieurs", paras: ["Trace & Calcul n'appartient à aucun groupe de construction : nos recommandations ne dépendent donc d'aucun fournisseur.", "Nous formons chaque année quatre jeunes ingénieurs en alternance."] }],
        ["proof:team", { title: "Direction technique", items: [{ n: "Alix Fontaine", r: "Directrice, structure" }, { n: "Bastien Orsini", r: "Directeur, fluides" }, { n: "Wei Zhang", r: "Responsable BIM" }] }],
        ["feat:steps", { title: "Recrutement", items: [{ t: "Candidature", x: "CV et projets dans la rubrique contact." }, { t: "Entretien technique", x: "Étude de cas avec deux ingénieurs." }, { t: "Intégration", x: "Parrainage pendant six mois." }] }],
      ] },
      pageContact("Contact", "Joignez plans et programme si vous les avez.", "Notre bureau", "Nature du projet, localisation, calendrier visé.", ["Envoyer le dossier", "/contact"], "Parc d'activités Les Hauts-de-Garonne, 31200 Toulouse", "Plan d'accès"),
    ],
  },

  // 7. Nettoyage industriel : jaune sécurité / noir, Bebas, capitales
  {
    key: "brillance-pro", name: "Brillance Pro", category: "entreprise", tags: ["audacieux", "technique"], siteType: "Nettoyage industriel",
    description: "Nettoyage industriel et tertiaire en jaune sécurité et noir : titres condensés en capitales, bandeau pleine largeur et tarification par formule.",
    brand: "Brillance Pro Nettoyage",
    tokens: { colors: { primary: "#1a1a1a", secondary: "#0d0d0d", accent: "#ffc61a", background: "#fffdf5", surface: "#ffffff", text: "#171717", muted: "#555555" }, fonts: { heading: "font.bebas-neue", body: "font.barlow", button: "font.bebas-neue", link: "font.barlow" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#141414" }, type: { h1: { size: 76, weight: 400, lineHeight: 0.98, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 48, weight: 400, lineHeight: 1, letterSpacing: 0.02, transform: "uppercase" } }, buttons: { paddingY: 14, paddingX: 32 } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "brillance", motifs: ["rays", "halftone", "objects"] },
    head: ["head:bar", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Sites traités", "/sites"], ["Qualité", "/qualite"], ["Devis", "/contact"]], cta: ["Devis en 48 h", "/contact"],
    contact: { address: "ZI du Moulin Neuf, 59650 Villeneuve-d'Ascq", phone: "03 20 00 66 18", email: "devis@brillance-pro.example", hours: "Standard : 6 h – 20 h, du lundi au samedi", tagline: "Des sites propres, des équipes qui reviennent." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Nettoyage industriel et tertiaire", title: "Des locaux propres, des équipes qui tournent.", sub: "Ateliers, entrepôts, bureaux, sites agroalimentaires : intervention de jour, de nuit ou en continu, produits conformes aux normes.", cta: ["Devis en 48 h", "/contact"], cta2: ["Nos prestations", "/prestations"], stats: [["180", "sites traités"], ["24 h/24", "astreinte"], ["12", "régions couvertes"]] }],
        ["misc:marquee", { items: ["Intervention de nuit", "Produits certifiés", "Équipes formées HACCP", "Devis gratuit en 48 h"] }],
        ["feat:rows", { title: "Ce que nous nettoyons", items: [{ t: "Ateliers et lignes de production", x: "Dégraissage, nettoyage haute pression, gestion des déchets." }, { t: "Entrepôts et plateformes", x: "Autolaveuses, balayage industriel, vitrerie en hauteur." }, { t: "Bureaux et sites tertiaires", x: "Entretien quotidien, remise en état après travaux." }, { t: "Sites alimentaires", x: "Protocoles HACCP, traçabilité des interventions." }] }],
        ["feat:strips", { title: "Notre promesse", items: [{ t: "Un chef d'équipe par site", x: "Un interlocuteur unique, joignable sans standard." }, { t: "Un cahier de contrôle", x: "Chaque intervention est tracée et signée." }, { t: "Des produits maîtrisés", x: "Fiches de données de sécurité transmises avant le début." }] }],
        ["proof:quotes", { title: "Sur le terrain", items: [{ q: "Zéro écart sur notre dernier audit d'hygiène.", n: "Responsable qualité", r: "agroalimentaire, client fictif" }, { q: "Les équipes sont ponctuelles, même à 4 h du matin.", n: "Directeur de site", r: "logistique, client fictif" }] }],
        ["cta:band", { title: "Votre site est-il prêt pour le prochain audit ?", cta: ["Demander une visite", "/contact"] }],
      ] },
      { key: "prestations", name: "Prestations", blocks: [
        ["misc:pagehead", { title: "Prestations", sub: "Contrats récurrents et interventions ponctuelles." }],
        ["feat:cards", { title: "Interventions", items: [{ icon: "sparkles", t: "Entretien récurrent", x: "Passages quotidiens, hebdomadaires ou mensuels." }, { icon: "settings", t: "Nettoyage industriel", x: "Machines, convoyeurs, sols techniques." }, { icon: "sun", t: "Vitrerie", x: "Façades, verrières, nacelle." }, { icon: "alertTriangle", t: "Remise en état", x: "Après travaux, sinistre ou déménagement." }] }],
        ["price:tiers", { title: "Contrats types (exemples)", items: [{ t: "Bureaux", price: "dès 1,20 €", period: "/ m² / mois", x: "Entretien 3 fois par semaine.", f: ["Sanitaires", "Sols et vitres intérieures", "Gestion des consommables"], cta: ["Devis", "/contact"] }, { t: "Industrie", price: "Sur devis", x: "Selon cadence et risques.", f: ["Étude préalable", "Équipe dédiée", "Traçabilité"], cta: ["Devis", "/contact"], hl: true }] }],
        ["cta:split", { title: "Besoin d'une intervention urgente ?", sub: "Astreinte nuit et week-end.", cta: ["Nous appeler", "/contact"] }],
      ] },
      { key: "sites", name: "Sites traités", blocks: [
        ["misc:pagehead", { title: "Sites traités", sub: "Quelques exemples de chantiers (fictifs)." }],
        ["gal:masonry", { title: "En images", items: [{ t: "Entrepôt de 20 000 m²" }, { t: "Atelier de mécanique" }, { t: "Laboratoire" }, { t: "Siège tertiaire" }, { t: "Chaîne agroalimentaire" }] }],
        ["proof:stats", { items: [["1,8 M m²", "nettoyés chaque mois"], ["96 %", "de contrats reconduits"], ["35 min", "de délai d'astreinte moyen"]] }],
      ] },
      { key: "qualite", name: "Qualité", blocks: [
        ["misc:pagehead", { title: "Qualité et sécurité" }],
        ["feat:numbered", { title: "Trois piliers", items: [{ t: "Formation", x: "40 heures de formation initiale pour chaque agent." }, { t: "Contrôle", x: "Visite qualité mensuelle chez chaque client." }, { t: "Environnement", x: "Produits écolabellisés dès que possible." }] }],
        ["feat:list2", { title: "Certifications (exemples)", items: [{ t: "Management de la qualité" }, { t: "Management environnemental" }, { t: "Santé et sécurité au travail" }, { t: "Formation HACCP" }] }],
        pageActusBlock(),
      ] },
      pageContact("Devis en 48 heures", "Surface, activité, fréquence souhaitée.", "Parlons de votre site", "Nous vous proposons une visite gratuite avant tout devis.", ["Demander ma visite", "/contact"], "ZI du Moulin Neuf, 59650 Villeneuve-d'Ascq", "Siège et agence"),
    ],
  },

  // 8. Sécurité : sombre, rouge, prompt
  {
    key: "bouclier-nord", name: "Bouclier Nord", category: "entreprise", tags: ["sombre", "technique"], siteType: "Société de sécurité",
    description: "Sécurité privée et télésurveillance : thème noir charbon, rouge d'alerte, bandeau en dégradé, en-tête sombre à filet et chiffres de réactivité.",
    brand: "Bouclier Nord Sécurité",
    tokens: { colors: { primary: "#e5392d", secondary: "#060809", accent: "#f2a900", background: "#0c0f12", surface: "#151a1f", text: "#eceff1", muted: "#a0aab2" }, fonts: { heading: "font.prompt", body: "font.archivo", button: "font.prompt", link: "font.archivo" }, radius: { sm: 4, md: 6, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2a323a" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.05, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "bouclier", motifs: ["mesh", "rays", "halftone"] },
    head: ["head:dark", {}], foot: ["foot:columns", { about: "Gardiennage, télésurveillance et sûreté événementielle pour sites industriels, commerces et collectivités.", cols: [["Services", "Gardiennage", "Télésurveillance", "Événementiel"], ["Société", "Agréments", "Actualités", "Contact"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Centre de contrôle", "/centre"], ["Agréments", "/agrements"], ["Contact", "/contact"]], cta: ["Audit gratuit", "/contact"],
    contact: { address: "2 rue de l'Écluse, 59140 Dunkerque", phone: "03 28 00 91 11", email: "operations@bouclier-nord.example", hours: "Centre de contrôle : 24 h/24, 7 j/7 ; bureaux : 8 h – 18 h", tagline: "Veiller quand vous ne le pouvez pas." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Sûreté 24 h/24", title: "Un site protégé ne dort jamais.", sub: "Agents de sécurité, vidéosurveillance et levée de doute à distance : une protection coordonnée depuis notre centre de contrôle.", cta: ["Demander un audit gratuit", "/contact"], cta2: ["Nos services", "/services"], stats: [["< 12 min", "intervention sur site"], ["24 h/24", "veille active"], ["240", "sites sous contrat"]] }],
        ["feat:icons", { title: "Une protection à trois niveaux", items: [{ icon: "eye", t: "Surveillance vidéo", x: "Caméras analysées en direct par nos opérateurs." }, { icon: "users", t: "Agents de sécurité", x: "Rondes, accueil, contrôle d'accès, événements." }, { icon: "bell", t: "Alarmes et levée de doute", x: "Appels, vérification visuelle et intervention." }] }],
        ["feat:alt", { eyebrow: "Cas d'usage", title: "Adapté à votre activité", items: [{ t: "Sites industriels", x: "Clôtures, périmètres, accès poids lourds, rondes de nuit." }, { t: "Commerces et centres commerciaux", x: "Prévention de la démarque et gestion des flux." }] }],
        ["proof:stats", { items: [["-63 %", "d'incidents sur nos sites pilotes (exemple)"], ["150", "agents formés"], ["7 min", "de levée de doute moyenne"]] }],
        ["feat:steps", { title: "Mise en place", items: [{ d: "J+2", t: "Audit sur site", x: "Relevé des accès, angles morts, risques." }, { d: "J+7", t: "Plan de sûreté", x: "Moyens humains et techniques chiffrés." }, { d: "J+15", t: "Déploiement", x: "Installation et formation des équipes." }] }],
        ["cta:card", { title: "Un incident récent ?", sub: "Nous répondons en moins d'une heure, jour et nuit.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ["misc:pagehead", { title: "Services", sub: "Humain et technologique, en contrat ou à la mission." }],
        ["feat:tabs", { title: "Nos prestations", items: [{ t: "Gardiennage", x: "Agents postés ou en rondes, uniformes ou civils." }, { t: "Télésurveillance", x: "Raccordement des alarmes et des caméras à notre centre." }, { t: "Événementiel", x: "Concerts, salons, festivals : plan de circulation et contrôle d'accès." }, { t: "Protection rapprochée", x: "Accompagnement de dirigeants, sur demande et avec agrément." }] }],
        ["feat:pricelist", { title: "Tarifs indicatifs (exemples)", items: [{ t: "Agent de sécurité", x: "Taux horaire, jour.", price: "dès 29 €/h" }, { t: "Télésurveillance", x: "Abonnement mensuel.", price: "dès 49 €" }, { t: "Ronde de nuit", x: "Par passage.", price: "dès 35 €" }] }],
        ["cta:band", { title: "Besoin d'un devis détaillé ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "centre", name: "Centre de contrôle", blocks: [
        ["misc:pagehead", { title: "Centre de contrôle" }],
        ["misc:text", { eyebrow: "Dunkerque, 24 h/24", title: "Quinze opérateurs en veille permanente", paras: ["Notre centre analyse les alertes, vérifie visuellement et déclenche l'intervention adaptée : agent, patrouille ou force publique.", "Chaque appel est enregistré et tracé pour vos audits d'assurance."] }],
        ["feat:grid-icons", { title: "Ce qui est surveillé", items: [{ icon: "eye", t: "Caméras", x: "Analyse en direct." }, { icon: "bell", t: "Alarmes", x: "Intrusion, incendie." }, { icon: "lock", t: "Accès", x: "Badges et portails." }, { icon: "activity", t: "Capteurs", x: "Température, mouvement." }] }],
        ["proof:quotes", { title: "Clients", items: [{ q: "Une intervention en dix minutes un dimanche de Noël.", n: "Gérant de site", r: "client fictif" }, { q: "Des rapports d'incident clairs pour notre assureur.", n: "Responsable sûreté", r: "cliente fictive" }] }],
      ] },
      { key: "agrements", name: "Agréments", blocks: [
        ["misc:pagehead", { title: "Agréments et formations" }],
        ["feat:list2", { title: "Cadre réglementaire (exemples)", items: [{ t: "Autorisation d'exercer délivrée par l'autorité de tutelle" }, { t: "Cartes professionnelles à jour pour chaque agent" }, { t: "Formation continue annuelle" }, { t: "Assurance responsabilité civile" }] }],
        ["proof:team", { title: "Encadrement", items: [{ n: "Colonel (r) Marc Dewulf", r: "Directeur des opérations" }, { n: "Fatou Diallo", r: "Responsable du centre" }, { n: "Jonas Peeters", r: "Chef des patrouilles" }] }],
        pageActusBlock(),
      ] },
      pageContact("Contact", "Pour une urgence, utilisez la ligne dédiée à vos contrats.", "Parlons de vos risques", "Décrivez le site, ses horaires et vos préoccupations principales.", ["Envoyer", "/contact"], "2 rue de l'Écluse, 59140 Dunkerque", "Siège opérationnel"),
    ],
  },

  // 9. Logistique B2B : orange et bleu marine, portail
  {
    key: "cap-fret", name: "Cap Fret", category: "entreprise", tags: ["moderne", "geometrique"], siteType: "Logistique B2B",
    description: "Transport et logistique B2B : orange franc sur marine, fond gris clair, bandeau centré avec chiffres, étapes de la chaîne et tableau de comparaison.",
    brand: "Cap Fret Logistique",
    tokens: { colors: { primary: "#c2410c", secondary: "#12324a", accent: "#1c7ed6", background: "#f6f7f9", surface: "#ffffff", text: "#15222e", muted: "#51606e" }, fonts: { heading: "font.chivo", body: "font.rubik", button: "font.rubik", link: "font.rubik" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "sm" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.06, letterSpacing: -0.02 } } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "soft" }, art: { seed: "capfret", motifs: ["waves", "skyline", "tiles"] },
    head: ["head:minimal", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Solutions", "/solutions"], ["Réseau", "/reseau"], ["Suivi et tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un tarif", "/contact"],
    contact: { address: "Plateforme Euro-Fret, 62100 Calais", phone: "03 21 00 54 36", email: "exploitation@cap-fret.example", hours: "Exploitation : 5 h – 22 h, du lundi au samedi", tagline: "Du quai au quai, sans rupture." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Transport et logistique B2B", title: "Vos marchandises à l'heure, de quai à quai.", sub: "Lots complets, messagerie palettisée, stockage et préparation de commandes pour industriels et distributeurs.", cta: ["Demander un tarif", "/contact"], cta2: ["Nos solutions", "/solutions"], stats: [["98,4 %", "livraisons à l'heure"], ["60", "véhicules"], ["40 000", "palettes stockées"]] }],
        ["feat:steps", { title: "Une chaîne maîtrisée", items: [{ d: "1", t: "Enlèvement", x: "Prise en charge sur rendez-vous, dans la fenêtre convenue." }, { d: "2", t: "Groupage", x: "Regroupement sur nos plateformes de Calais et Lille." }, { d: "3", t: "Transport", x: "Tracteurs géolocalisés et chauffeurs salariés." }, { d: "4", t: "Livraison", x: "Preuve numérique de livraison sous une heure." }] }],
        ["feat:cards", { title: "Solutions", items: [{ icon: "layers", t: "Messagerie palettisée", x: "Livraison en 24 à 48 h dans les Hauts-de-France et au-delà." }, { icon: "network", t: "Lots complets", x: "Transport dédié, bâché, frigorifique ou plateau." }, { icon: "settings", t: "Logistique contractuelle", x: "Stockage, préparation, expédition." }] }],
        ["proof:logos", { title: "Partenaires industriels (fictifs)", items: ["Boréal Emballages", "Fonderies Dumont", "Marée du Nord", "Grand Large Distribution"] }],
        ["proof:big", { items: [{ q: "Nos taux de service ont gagné quatre points en un trimestre.", n: "Directeur supply chain", r: "client fictif" }] }],
        ["cta:band", { title: "Un flux à fiabiliser ?", sub: "Nous étudions votre cahier des charges sous cinq jours.", cta: ["Demander un tarif", "/contact"] }],
      ] },
      { key: "solutions", name: "Solutions", blocks: [
        ["misc:pagehead", { title: "Solutions de transport", sub: "Pour les flux réguliers comme les expéditions exceptionnelles." }],
        ["feat:compare", { title: "Messagerie ou lot complet ?", rows: [["", "Messagerie", "Lot complet", "Dédié"], ["Dès 1 palette", "oui", "non", "non"], ["Délai", "24–48 h", "24 h", "Sur mesure"], ["Température dirigée", "non", "oui", "oui"]] }],
        ["feat:alt", { title: "Entreposage et préparation", items: [{ t: "Stockage", x: "30 000 m² sous température ambiante ou dirigée." }, { t: "Préparation de commandes", x: "Picking, colisage, étiquetage, expédition du jour même." }] }],
        ["cta:split", { title: "Un cahier des charges ?", sub: "Envoyez-le, nous chiffrons sans engagement.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "reseau", name: "Réseau", blocks: [
        ["misc:pagehead", { title: "Notre réseau" }],
        ["gal:cards", { title: "Plateformes", items: [{ tag: "Calais", t: "Euro-Fret", x: "Hub principal, 18 000 m², quais d'embarquement ferry." }, { tag: "Lille", t: "Lille-Lesquin", x: "Distribution régionale et cross-docking." }, { tag: "Rouen", t: "Seine Sud", x: "Relais Normandie et Île-de-France." }] }],
        ["proof:stats", { items: [["12", "plateformes partenaires"], ["300", "livraisons par jour"], ["14 pays", "desservis en Europe"]] }],
      ] },
      { key: "tarifs", name: "Suivi et tarifs", blocks: [
        ["misc:pagehead", { title: "Suivi et tarifs", sub: "Grilles d'exemple pour une livraison à Paris." }],
        ["feat:pricelist", { title: "Messagerie palettisée (exemples)", items: [{ t: "1 palette", x: "Jusqu'à 400 kg.", price: "92 €" }, { t: "2 palettes", x: "Jusqu'à 800 kg.", price: "158 €" }, { t: "Lot complet 33 palettes", x: "Camion complet.", price: "dès 620 €" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je suivre mes expéditions ?", x: "Oui, par un portail client avec alertes de retard." }, { t: "Quelle est votre politique de litiges ?", x: "Constat à la livraison, dossier ouvert sous 24 heures." }] }],
        pageActusBlock(),
      ] },
      pageContact("Contact exploitation", "Pour une demande de tarif, précisez origine, destination et volumes.", "Joindre l'exploitation", "Nature des marchandises, tonnage, fréquence.", ["Envoyer", "/contact"], "Plateforme Euro-Fret, 62100 Calais", "Plateforme principale"),
    ],
  },

  // 10. Expert-comptable : prune et ocre, serif lisible, header center… sobre
  {
    key: "bilan-clair", name: "Bilan Clair", category: "entreprise", tags: ["minimaliste", "moderne"], siteType: "Cabinet d'expertise comptable",
    description: "Cabinet d'expertise comptable lisible : prune profonde, ocre, titres sans empattement sobres, accueil très aéré en texte seul puis chiffres.",
    brand: "Bilan Clair Expertise",
    tokens: { colors: { primary: "#5b2a4e", secondary: "#2a1226", accent: "#c7861c", background: "#f8f4f6", surface: "#ffffff", text: "#241420", muted: "#625560" }, fonts: { heading: "font.public-sans", body: "font.source-serif-4", button: "font.public-sans", link: "font.source-serif-4" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#e4d6df" }, type: { h1: { size: 62, weight: 700, lineHeight: 1.03, letterSpacing: -0.03 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "soft" }, art: { seed: "bilan", motifs: ["plates", "arches", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Missions", "/missions"], ["Tarifs", "/tarifs"], ["Le cabinet", "/cabinet"], ["Contact", "/contact"]], cta: ["Premier rendez-vous", "/contact"],
    contact: { address: "19 boulevard Carnot, 21000 Dijon", phone: "03 80 00 82 15", email: "cabinet@bilan-clair.example", hours: "Du lundi au vendredi, 8 h 30 – 12 h et 14 h – 18 h", tagline: "Des comptes clairs pour décider vite." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Expertise comptable", title: "Vos chiffres, enfin lisibles.", sub: "Comptabilité, paie, bilan et conseil de gestion pour TPE, commerçants et professions libérales.", cta: ["Premier rendez-vous", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
        ["proof:stats", { items: [["650", "entreprises suivies"], ["48 h", "pour répondre à une question"], ["100 %", "dématérialisé, si vous le souhaitez"]] }],
        ["feat:numbered", { eyebrow: "Mission", title: "Trois engagements concrets", items: [{ t: "Un tableau de bord mensuel", x: "Trésorerie, marge et impayés en une page." }, { t: "Un expert nommé", x: "Vous connaissez son nom et son numéro direct." }, { t: "Un prix fixé d'avance", x: "Pas de supplément caché en fin d'exercice." }] }],
        ["feat:list2", { title: "Nous nous occupons de", items: [{ t: "Tenue comptable et déclarations de TVA" }, { t: "Bulletins de paie" }, { t: "Bilan et liasse fiscale" }, { t: "Création et statut juridique" }, { t: "Aides et crédits d'impôt" }, { t: "Prévisionnel pour la banque" }] }],
        ["proof:quotes", { title: "Entrepreneurs", items: [{ q: "Je sais enfin combien je peux me payer.", n: "Léa R.", r: "Graphiste indépendante, cliente fictive" }, { q: "Le bilan est livré avant le rendez-vous bancaire.", n: "Anthony V.", r: "Boulanger, client fictif" }] }],
        ["cta:card", { title: "On regarde vos comptes ensemble ?", sub: "Premier rendez-vous d'une heure offert.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "missions", name: "Missions", blocks: [
        ["misc:pagehead", { title: "Missions", sub: "De la création à la transmission de l'entreprise." }],
        ["feat:accordion", { title: "Ce que couvre chaque mission", items: [{ t: "Comptabilité et fiscalité", x: "Saisie ou contrôle de vos écritures, déclarations de TVA et d'impôts." }, { t: "Paie et social", x: "Bulletins, déclarations sociales, contrats de travail." }, { t: "Conseil de gestion", x: "Tableaux de bord, budget, plan de trésorerie." }, { t: "Juridique", x: "Statuts, assemblées, modifications de capital." }] }],
        ["feat:steps", { title: "Créer son entreprise avec nous", items: [{ d: "Semaine 1", t: "Choix du statut", x: "Micro, société ou association selon votre projet." }, { d: "Semaine 2", t: "Dossier", x: "Statuts et immatriculation." }, { d: "Semaine 3", t: "Lancement", x: "Ouverture comptable et outils de facturation." }] }],
        ["cta:band", { title: "Une question de fiscalité ?", cta: ["Nous l'envoyer", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Forfaits mensuels hors taxes (exemples)." }],
        ["price:tiers", { title: "Trois formules", items: [{ t: "Indépendant", price: "69 €", period: "/ mois", x: "Micro-entrepreneur.", f: ["Déclarations sociales et fiscales", "Facturation en ligne", "Une question par semaine"], cta: ["Choisir", "/contact"] }, { t: "TPE", price: "149 €", period: "/ mois", x: "Société jusqu'à 3 salariés.", f: ["Comptabilité complète", "Paie jusqu'à 3 bulletins", "Bilan annuel"], cta: ["Choisir", "/contact"], hl: true }, { t: "PME", price: "Sur devis", x: "À partir de 4 salariés.", f: ["Contrôle de gestion", "Paie illimitée", "Commissaire aux comptes partenaire"], cta: ["Parler à un expert", "/contact"] }] }],
        ["feat:accordion", { title: "Questions sur les honoraires", items: [{ t: "Les honoraires sont-ils révisés ?", x: "Une fois par an, avec préavis de trois mois." }, { t: "Y a-t-il des frais de reprise ?", x: "Non, la reprise de dossier est incluse dans cette démonstration." }] }],
      ] },
      { key: "cabinet", name: "Le cabinet", blocks: [
        ["misc:pagehead", { title: "Le cabinet" }],
        ["misc:story", { eyebrow: "Depuis 2009", title: "Un cabinet à taille humaine", paras: ["Bilan Clair accompagne des dirigeants qui préfèrent comprendre leurs chiffres plutôt que les subir.", "Nos experts-comptables sont inscrits à l'Ordre et suivent quarante heures de formation chaque année."], image: "portrait-3" }],
        ["proof:team", { title: "Équipe", items: [{ n: "Valérie Gaillard", r: "Expert-comptable associée" }, { n: "Simon Lacroix", r: "Responsable paie" }, { n: "Amina Touré", r: "Conseil en gestion" }] }],
        pageActusBlock(),
      ] },
      pageContact("Prendre rendez-vous", "En cabinet, par visioconférence ou à votre domicile professionnel.", "Nos coordonnées", "Votre activité, votre régime actuel et vos questions.", ["Demander un rendez-vous", "/contact"], "19 boulevard Carnot, 21000 Dijon", "Le cabinet"),
    ],
  },

  // 11. Conseil RSE : vert végétal, slab arrondi, collage
  {
    key: "racines-durables", name: "Racines Durables", category: "entreprise", tags: ["naturel", "chaleureux"], siteType: "Conseil RSE et transition écologique",
    description: "Conseil en transition écologique pour entreprises : vert végétal et jaune soleil, slab doux, collage d'images, feuille de route par étapes.",
    brand: "Racines Durables Conseil",
    tokens: { colors: { primary: "#2e7d32", secondary: "#1b3a22", accent: "#f4b400", background: "#f1f7ee", surface: "#ffffff", text: "#1c2b1f", muted: "#506555" }, fonts: { heading: "font.roboto-slab", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 8, md: 16, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 48, weight: 700, lineHeight: 1.12, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "pill" }, art: { seed: "racines", motifs: ["botanical", "dunes", "blobs"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "La lettre des racines", sub: "Une idée concrète, chaque mois, pour réduire votre empreinte.", button: "Recevoir la lettre" }],
    menu: [["Accueil", "/"], ["Accompagnements", "/accompagnements"], ["Démarche", "/demarche"], ["Ressources", "/actualites"], ["Contact", "/contact"]], cta: ["Faire le point", "/contact"],
    contact: { address: "6 chemin des Vergers, 49100 Angers", phone: "02 41 00 23 58", email: "bonjour@racines-durables.example", hours: "Du lundi au vendredi, 9 h – 17 h 30", tagline: "Réduire l'impact, garder la performance." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Conseil RSE et bilan carbone", title: "Faire de la transition un atout de votre entreprise.", sub: "Bilan carbone, plan d'action, labels et reporting extra-financier pour PME et collectivités.", cta: ["Faire le point", "/contact"], cta2: ["Notre démarche", "/demarche"] }],
        ["feat:grid-icons", { title: "Quatre chantiers prioritaires", items: [{ icon: "sun", t: "Énergie", x: "Audit, sobriété, énergies renouvelables." }, { icon: "globe", t: "Bilan carbone", x: "Mesure des émissions des scopes 1, 2 et 3." }, { icon: "layers", t: "Économie circulaire", x: "Déchets, réemploi, achats responsables." }, { icon: "users", t: "Équipes", x: "Mobilisation, formation, qualité de vie." }] }],
        ["feat:alt", { eyebrow: "Résultats", title: "Des gains mesurables", items: [{ t: "Une imprimerie réduit sa facture d'énergie", x: "Cas fictif : -18 % en 14 mois, grâce au pilotage et au remplacement de deux équipements." }, { t: "Une coopérative mesure ses émissions", x: "Cas fictif : plan sur trois ans validé en comité de direction." }] }],
        ["proof:statsbar", { items: [["140", "bilans carbone réalisés"], ["-22 %", "d'émissions moyennes après 3 ans (exemple)"], ["35", "labels obtenus"]] }],
        ["proof:quotes", { title: "Retours", items: [{ q: "Un plan d'action chiffré, enfin compréhensible par nos équipes.", n: "Dirigeante", r: "PME de l'agroalimentaire, cliente fictive" }, { q: "L'audit a payé son coût dès la première année.", n: "Directeur technique", r: "industrie, client fictif" }, { q: "Un tutoiement honnête sur nos fausses pistes.", n: "Gérante", r: "commerce, cliente fictive" }] }],
        ["cta:card", { title: "Par où commencer ?", sub: "Un diagnostic de deux heures pour hiérarchiser vos priorités.", cta: ["Réserver le diagnostic", "/contact"] }],
      ] },
      { key: "accompagnements", name: "Accompagnements", blocks: [
        ["misc:pagehead", { title: "Accompagnements", sub: "Du diagnostic au reporting, à votre rythme." }],
        ["feat:strips", { title: "Nos missions", items: [{ t: "Bilan carbone", x: "Collecte, calcul et restitution avec plan de réduction." }, { t: "Audit énergétique", x: "Visite, mesures, scénarios chiffrés." }, { t: "Stratégie RSE", x: "Matrice d'enjeux, objectifs et gouvernance." }, { t: "Reporting extra-financier", x: "Indicateurs, rapport annuel, préparation aux audits." }] }],
        ["price:tiers", { title: "Formules (exemples)", items: [{ t: "Diagnostic", price: "1 200 €", x: "Deux heures d'échange et une note.", f: ["Entretien", "Priorités", "Estimation du budget"], cta: ["Réserver", "/contact"] }, { t: "Bilan carbone", price: "4 800 €", x: "Pour 10 à 50 salariés.", f: ["Collecte des données", "Calcul des scopes", "Plan d'action"], cta: ["Réserver", "/contact"], hl: true }, { t: "Programme annuel", price: "Sur devis", x: "Suivi et mobilisation.", f: ["Comité trimestriel", "Ateliers", "Reporting"], cta: ["Nous écrire", "/contact"] }] }],
        ["cta:split", { title: "Une obligation de reporting ?", sub: "Nous vous aidons à comprendre ce qui vous concerne.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "demarche", name: "Démarche", blocks: [
        ["misc:pagehead", { title: "Notre démarche" }],
        ["feat:steps", { title: "Une feuille de route en cinq temps", items: [{ d: "1", t: "Écouter", x: "Entretiens avec la direction et les équipes." }, { d: "2", t: "Mesurer", x: "Données d'énergie, d'achats et de déplacements." }, { d: "3", t: "Prioriser", x: "Impact, coût, faisabilité." }, { d: "4", t: "Agir", x: "Chantiers pilotes et suivi mensuel." }, { d: "5", t: "Rendre compte", x: "Indicateurs et communication." }] }],
        ["misc:text", { eyebrow: "Notre conviction", title: "Réduire d'abord, compenser ensuite", paras: ["Nous ne vendons pas de crédits carbone : notre travail consiste à diminuer vos émissions réelles.", "Chaque recommandation est accompagnée de son coût, de son gain et de son retour sur investissement estimé."] }],
        ["feat:list2", { title: "Nos principes", items: [{ t: "Transparence des méthodes de calcul" }, { t: "Aucune promesse invérifiable" }, { t: "Transfert de compétences à vos équipes" }, { t: "Indépendance vis-à-vis des fournisseurs" }] }],
      ] },
      pageActus("Ressources et actualités", "Guides, retours d'expérience et veille réglementaire.", "Derniers articles", "grid", 6),
      pageContact("Contact", "Un premier échange pour cerner vos enjeux.", "Venez nous voir", "Taille de l'entreprise, secteur et premier sujet à traiter.", ["Envoyer", "/contact"], "6 chemin des Vergers, 49100 Angers", "Le bureau"),
    ],
  },
];

function pageActusBlock() {
  return ["misc:posts", { title: "Dernières actualités", count: 3, layout: "list" }];
}
