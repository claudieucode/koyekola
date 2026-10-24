// Finance, comptabilité et conseil (6 thèmes). Textes de DÉMONSTRATION : cabinets, banques, personnes, tarifs et coordonnées fictifs.
// Aucune promesse de rendement : les contenus décrivent des services et des méthodes, jamais des gains garantis.
module.exports = [
  // 1. Expert-comptable : vert sapin, serif lisible, rassurant
  {
    key: "lauzere-compta", name: "Lauzère", category: "finance", tags: ["classique", "chaleureux"], siteType: "Cabinet d'expertise comptable", featured: true,
    description: "Cabinet d'expertise comptable rassurant : vert sapin et or doux, titres serif lisibles, bandeau portrait, forfaits clairs et méthode d'accompagnement en étapes.",
    brand: "Cabinet Lauzère",
    tokens: { colors: { primary: "#1f5a43", secondary: "#12291f", accent: "#b7791f", background: "#f7f5ef", surface: "#ffffff", text: "#17261f", muted: "#51605a" }, fonts: { heading: "font.vollkorn", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 4, md: 6, lg: 10, button: 6, field: 6, card: 8 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "lauzere", motifs: ["botanical", "tiles", "arches"] },
    head: ["head:topbar", { info: "Cabinet agréé · Ordre fictif de démonstration", note: "Rendez-vous possibles le samedi matin" }],
    foot: ["foot:columns", { about: "Comptabilité, paie et conseil de gestion pour les artisans, commerçants et professions libérales.", cols: [["Cabinet", "Nos missions", "À propos", "Ressources"], ["Accès", "Prendre rendez-vous", "Espace client", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Missions", "/missions"], ["À propos", "/a-propos"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "18 place du Marché, 31000 Toulouse", phone: "05 61 00 12 34", email: "accueil@lauzere-compta.example", hours: "Lundi – vendredi, 8 h 30 – 18 h ; samedi sur rendez-vous", tagline: "La comptabilité qui vous laisse le temps d'entreprendre." },
    social: ["linkedin", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Expertise comptable à Toulouse", title: "Vos comptes tenus, vos décisions éclairées.", sub: "Nous tenons votre comptabilité, établissons votre paie et vous aidons à lire vos chiffres pour piloter votre activité sereinement.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Nos missions", "/missions"] }],
        ["feat:cards", { eyebrow: "Missions", title: "Ce que nous prenons en charge", items: [{ icon: "calculator", t: "Comptabilité", x: "Saisie, rapprochements, bilan et liasse fiscale." }, { icon: "users", t: "Paie et social", x: "Bulletins, déclarations, contrats de travail." }, { icon: "barChart", t: "Conseil de gestion", x: "Tableaux de bord, budgets, prévisions de trésorerie." }, { icon: "briefcase", t: "Création et transmission", x: "Choix du statut, business plan, reprise d'entreprise." }] }],
        ["feat:steps", { eyebrow: "Méthode", title: "Un accompagnement en quatre temps", items: [{ t: "Rencontre", x: "Nous écoutons votre activité et vos priorités." }, { t: "Mise en place", x: "Connexion bancaire, outils de facturation, calendrier." }, { t: "Suivi mensuel", x: "Situation intermédiaire et points de contact réguliers." }, { t: "Bilan annuel", x: "Présentation des comptes et pistes d'amélioration." }] }],
        ["feat:pricelist", { eyebrow: "Forfaits", title: "Des honoraires annoncés à l'avance", items: [{ t: "Artisan, micro-entreprise", x: "Comptabilité simplifiée, déclarations", price: "à partir de 89 €/mois" }, { t: "Commerce, société", x: "Comptabilité, bilan, TVA", price: "à partir de 189 €/mois" }, { t: "Profession libérale", x: "Comptabilité et déclaration de revenus", price: "à partir de 119 €/mois" }] }],
        ["proof:quotes", { title: "Ce que disent nos clients", items: [{ q: "Je sais enfin ce qu'il me reste en fin de mois.", n: "Béatrice L.", r: "Fleuriste, cliente fictive" }, { q: "Un interlocuteur qui décroche et qui explique.", n: "Rémi D.", r: "Plombier, client fictif" }, { q: "Le tableau de bord trimestriel a changé nos décisions d'achat.", n: "Sabrina K.", r: "Restauratrice, cliente fictive" }] }],
        ["cta:band", { title: "Un premier rendez-vous offert, sans engagement.", sub: "Trente minutes pour faire le point sur votre situation.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "missions", name: "Missions", blocks: [
        ["misc:pagehead", { title: "Nos missions", sub: "Des prestations claires pour chaque étape de la vie de l'entreprise." }],
        ["feat:rows", { title: "Du quotidien à la stratégie", items: [{ t: "Tenue comptable", x: "Saisie des pièces, rapprochement bancaire, suivi de la TVA et des échéances." }, { t: "Paie", x: "Bulletins mensuels, déclarations sociales, gestion des entrées et sorties de salariés." }, { t: "Bilan et fiscalité", x: "Comptes annuels, liasse fiscale, optimisation dans le respect de la loi." }, { t: "Pilotage", x: "Budget annuel, plan de trésorerie, indicateurs adaptés à votre métier." }] }],
        ["feat:checks", { title: "Pour démarrer, apportez", intro: "Un premier échange suffit si vous avez ces éléments sous la main.", cta: ["Prendre rendez-vous", "/contact"], items: [{ t: "Vos relevés bancaires", x: "" }, { t: "Vos factures de l'année", x: "" }, { t: "Votre dernier bilan, s'il existe", x: "" }, { t: "Vos accès aux impôts en ligne", x: "" }] }],
        ["cta:split", { title: "Une mission particulière à confier ?", sub: "Reprise d'entreprise, contrôle fiscal, changement de statut : parlons-en.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "Le cabinet" }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Un cabinet de proximité depuis 1994", paras: ["Fondé par deux experts-comptables toulousains, le cabinet accompagne aujourd'hui plusieurs centaines de petites entreprises du sud-ouest.", "Nous privilégions les rendez-vous en personne et un interlocuteur unique par dossier."], image: "portrait-1" }],
        ["proof:team", { eyebrow: "Équipe", title: "Ceux qui suivent votre dossier", items: [{ n: "Anne Lauzère", r: "Experte-comptable associée" }, { n: "Julien Cassagne", r: "Expert-comptable associé" }, { n: "Maryse Fabre", r: "Responsable paie" }, { n: "Karim Ouali", r: "Chargé de gestion" }] }],
        ["proof:stats", { items: [["30 ans", "de présence à Toulouse"], ["450", "dossiers suivis (exemple)"], ["12", "collaborateurs"]] }],
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        ["misc:pagehead", { title: "Ressources pour dirigeants" }],
        ["misc:posts", { title: "Notre actualité comptable et fiscale", count: 6, layout: "grid" }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "À quelle fréquence dois-je vous transmettre mes pièces ?", x: "Idéalement chaque semaine ; un dépôt mensuel suffit pour les petites structures." }, { t: "Puis-je changer d'expert-comptable en cours d'année ?", x: "Oui, nous nous chargeons du transfert du dossier avec votre ancien cabinet." }, { t: "Mes données sont-elles sécurisées ?", x: "Elles sont chiffrées et hébergées en France." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Nous répondons sous 24 heures ouvrées." }],
        ["contact:map", { title: "Venir nous rencontrer", mapAddress: "18 place du Marché, 31000 Toulouse" }],
        ["misc:hours", { title: "Horaires d'accueil", rows: [["Lundi – vendredi", "8 h 30 – 18 h"], ["Samedi", "Sur rendez-vous"], ["Période de bilan (mars – mai)", "Ouverture jusqu'à 19 h"]] }],
      ] },
    ],
  },

  // 2. Gestion de patrimoine : bordeaux, Bodoni, éditorial feutré
  {
    key: "valcourt-patrimoine", name: "Valcourt", category: "finance", tags: ["luxe", "editorial"], siteType: "Cabinet de gestion de patrimoine",
    description: "Conseil en gestion de patrimoine à l'élégance éditoriale : bordeaux profond et laiton, titres Didone, grand titre de presse, citation et parcours de conseil sans promesse de rendement.",
    brand: "Maison Valcourt",
    tokens: { colors: { primary: "#5c1a2b", secondary: "#1c1417", accent: "#9c7a3c", background: "#f9f6f1", surface: "#ffffff", text: "#221a1c", muted: "#5f5357" }, fonts: { heading: "font.bodoni-moda", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 500, lineHeight: 1.04, letterSpacing: -0.015 }, h2: { size: 38, weight: 500, lineHeight: 1.12, letterSpacing: -0.005 } }, border: { width: 1, color: "#e0d6c8" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "valcourt", motifs: ["arches", "plates", "topo"] },
    head: ["head:center", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Accompagnement", "/accompagnement"], ["La Maison", "/la-maison"], ["Regards", "/regards"], ["Contact", "/contact"]], cta: ["Un premier entretien", "/contact"],
    contact: { address: "7 rue Sainte-Catherine, 69001 Lyon", phone: "04 78 00 22 33", email: "entretien@valcourt-patrimoine.example", hours: "Sur rendez-vous, du lundi au vendredi, 9 h – 18 h", tagline: "Conseil indépendant en patrimoine, pensé sur plusieurs générations." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { eyebrow: "Conseil en gestion de patrimoine", kicker: "Lyon · Depuis 2004", title: "Un patrimoine se pense dans la durée.", sub: "Nous aidons les familles et les dirigeants à structurer, transmettre et protéger ce qu'ils ont construit, avec indépendance et pédagogie.", cta: ["Un premier entretien", "/contact"], image: "wide" }],
        ["proof:big", { items: [{ q: "Le meilleur conseil est souvent celui qui explique pourquoi ne rien faire.", n: "Hélène Valcourt", r: "fondatrice, citation fictive" }] }],
        ["feat:alt", { eyebrow: "Accompagnement", title: "Trois sujets, un même fil conducteur", items: [{ t: "Structurer", x: "Cartographie du patrimoine, choix des enveloppes et organisation des biens professionnels et privés.", link: ["Notre accompagnement", "/accompagnement"] }, { t: "Transmettre", x: "Donation, démembrement, pacte familial : préparer sereinement la suite." }, { t: "Protéger", x: "Prévoyance, assurances, régimes matrimoniaux." }] }],
        ["proof:stats", { items: [["20 ans", "de pratique du conseil"], ["0", "commission cachée : honoraires déclarés"], ["8", "conseillers"]] }],
        ["feat:accordion", { title: "Avant de nous rencontrer", items: [{ t: "À qui s'adresse la Maison ?", x: "Aux familles et dirigeants qui souhaitent une vision d'ensemble de leur situation." }, { t: "Comment êtes-vous rémunérés ?", x: "Par des honoraires convenus à l'avance. Tout investissement comporte un risque de perte en capital ; nous ne promettons aucun rendement." }] }],
        ["cta:card", { title: "Un premier entretien, sans engagement.", sub: "Une heure pour comprendre votre situation et vos objectifs.", cta: ["Un premier entretien", "/contact"] }],
      ] },
      { key: "accompagnement", name: "Accompagnement", blocks: [
        ["misc:pagehead", { title: "Accompagnement", sub: "Une démarche en cinq étapes, à votre rythme." }],
        ["feat:steps", { title: "Notre démarche", items: [{ t: "Écoute", d: "Entretien 1", x: "Votre histoire, vos projets, vos contraintes." }, { t: "Bilan", d: "Semaines 1-2", x: "Inventaire complet de la situation patrimoniale." }, { t: "Recommandations", d: "Semaine 4", x: "Scénarios comparés, avantages et risques détaillés." }, { t: "Mise en œuvre", d: "Mois 2", x: "Coordination avec notaire, avocat, banque." }, { t: "Suivi", d: "Chaque année", x: "Revue annuelle et ajustements." }] }],
        ["feat:rows", { title: "Domaines d'intervention", items: [{ t: "Épargne et allocation", x: "Répartition entre liquidités, assurance-vie et placements selon votre horizon et votre tolérance au risque." }, { t: "Immobilier", x: "Résidence, investissement locatif, société civile immobilière." }, { t: "Dirigeants", x: "Rémunération, holding, préparation de la cession." }, { t: "Retraite", x: "Estimation des droits et compléments." }] }],
        ["misc:quote", { text: "Nous ne vendons ni produit ni rendement : nous construisons une stratégie dont vous comprenez chaque ligne.", by: "Maison Valcourt, principe de conseil" }],
      ] },
      { key: "la-maison", name: "La Maison", blocks: [
        ["misc:pagehead", { title: "La Maison" }],
        ["misc:story", { eyebrow: "Histoire", title: "Indépendants, par choix", paras: ["Créée en 2004 par d'anciens conseillers de banque privée, la Maison s'est construite sur un principe : aucun lien capitalistique avec un établissement financier.", "Les profils présentés ici sont fictifs, à remplacer par ceux de votre équipe."], image: "portrait-2" }],
        ["proof:team", { items: [{ n: "Hélène Valcourt", r: "Fondatrice, conseillère en gestion de patrimoine" }, { n: "Antoine Berthier", r: "Associé, ingénierie patrimoniale" }, { n: "Clémence Roux", r: "Conseillère, dirigeants" }] }],
        ["feat:numbered", { title: "Nos principes", items: [{ t: "Indépendance", x: "Aucun produit imposé." }, { t: "Transparence", x: "Honoraires et frais détaillés par écrit." }, { t: "Confidentialité", x: "Un cadre strict pour votre dossier." }] }],
      ] },
      { key: "regards", name: "Regards", blocks: [
        ["misc:pagehead", { title: "Regards", sub: "Analyses et pédagogie patrimoniale." }],
        ["misc:posts", { title: "Dernières analyses", count: 6, layout: "list" }],
        ["misc:text", { eyebrow: "À savoir", title: "Information importante", paras: ["Les contenus de ce site sont fournis à titre d'information générale et ne constituent pas un conseil personnalisé. Les performances passées ne préjugent pas des performances futures, et tout investissement comporte un risque de perte en capital."] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Un échange confidentiel avec un conseiller." }],
        ["contact:info", { title: "Prenons rendez-vous", formTitle: "Votre demande", formIntro: "Indiquez le sujet qui vous préoccupe ; un conseiller vous rappelle.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Rendez-vous", rows: [["Lundi – vendredi", "9 h – 18 h, sur rendez-vous"], ["Visioconférence", "Possible en soirée"], ["Premier entretien", "Une heure, sans engagement"]] }],
      ] },
    ],
  },

  // 3. Courtage : vermillon + slab épais, énergique
  {
    key: "pivot-courtage", name: "Pivot", category: "finance", tags: ["audacieux", "moderne"], siteType: "Courtier en crédit et assurance",
    description: "Courtier en crédit et en assurance au ton direct : vermillon et marine, titres slab épais, collage d'images, comparatif de solutions et étapes de la demande.",
    brand: "Pivot Courtage",
    tokens: { colors: { primary: "#d6411f", secondary: "#1b2a41", accent: "#0e8c88", background: "#ffffff", surface: "#f1f5f9", text: "#1b2a41", muted: "#4f5d73" }, fonts: { heading: "font.alfa-slab-one", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" }, radius: { sm: 6, md: 10, lg: 16, button: 999, field: 10, card: 14 }, shadow: { card: "sm", button: "sm" }, type: { h1: { size: 58, weight: 400, lineHeight: 1.04, letterSpacing: 0 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "pivot", motifs: ["objects", "rays", "ribbons"] },
    head: ["head:bar", {}],
    foot: ["foot:newsletter", { title: "Les taux et les règles du moment", sub: "Un courriel utile par mois, sans engagement.", button: "S'inscrire" }],
    menu: [["Accueil", "/"], ["Nos solutions", "/solutions"], ["Comment ça marche", "/methode"], ["Conseils", "/conseils"], ["Contact", "/contact"]], cta: ["Étudier mon projet", "/contact"],
    contact: { address: "62 cours Lafayette, 69003 Lyon", phone: "04 72 00 33 44", email: "projet@pivot-courtage.example", hours: "Du lundi au samedi, 9 h – 19 h", tagline: "Vous cherchez un crédit ou une assurance : nous cherchons pour vous." },
    social: ["facebook", "instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Courtage en crédit et assurance", title: "Votre projet mérite plusieurs offres.", sub: "Pivot compare les propositions de nombreux établissements, négocie pour vous et vous accompagne jusqu'à la signature.", cta: ["Étudier mon projet", "/contact"], cta2: ["Nos solutions", "/solutions"] }],
        ["proof:logos", { title: "Partenaires financiers (noms fictifs)", items: ["Banque Aubrac", "Mutuelle des Dômes", "Crédit Lyonnais Alpin", "Assur'Rhône", "Fonciale"] }],
        ["feat:numbered", { eyebrow: "En trois temps", title: "Simple comme une prise de rendez-vous", items: [{ t: "Vous nous racontez", x: "Projet, revenus, durée souhaitée : vingt minutes au téléphone." }, { t: "Nous comparons", x: "Plusieurs établissements sont consultés pour vous." }, { t: "Vous décidez", x: "Vous choisissez l'offre, nous gérons le dossier." }] }],
        ["gal:featured", { title: "Nos projets du moment", items: [{ t: "Achat de résidence principale", tag: "Immobilier" }, { t: "Regroupement de crédits", tag: "Budget" }, { t: "Prêt professionnel", tag: "Entreprise" }, { t: "Assurance emprunteur", tag: "Assurance" }] }],
        ["feat:compare", { title: "Seul ou avec un courtier", rows: [["", "Démarches seul", "Avec Pivot"], ["Établissements consultés", "1 à 2", "plusieurs"], ["Temps passé", "plusieurs semaines", "quelques heures"], ["Négociation", "à votre charge", "assurée par le courtier"]] }],
        ["cta:image", { title: "Parlons de votre projet.", sub: "Nos honoraires sont annoncés dès le premier entretien. Un crédit vous engage et doit être remboursé : vérifiez vos capacités de remboursement avant de vous engager.", cta: ["Étudier mon projet", "/contact"] }],
      ] },
      { key: "solutions", name: "Nos solutions", blocks: [
        ["misc:pagehead", { title: "Nos solutions", sub: "Crédit, assurance, regroupement : un même interlocuteur." }],
        ["feat:cards", { title: "Ce que nous comparons", items: [{ icon: "home", t: "Crédit immobilier", x: "Résidence principale, secondaire ou locatif." }, { icon: "coin", t: "Rachat et regroupement", x: "Alléger vos mensualités quand c'est pertinent." }, { icon: "briefcase", t: "Financement professionnel", x: "Matériel, local, trésorerie." }, { icon: "shield", t: "Assurances", x: "Emprunteur, prévoyance, habitation." }] }],
        ["feat:tabs", { title: "Selon votre profil", items: [{ t: "Primo-accédant", x: "Lecture du plan de financement, aides à l'accession possibles." }, { t: "Investisseur", x: "Étude de rentabilité et de la capacité d'endettement." }, { t: "Indépendant", x: "Dossier adapté aux revenus variables." }] }],
        ["cta:band", { title: "Vous ne savez pas par où commencer ?", cta: ["Être rappelé", "/contact"] }],
      ] },
      { key: "methode", name: "Comment ça marche", blocks: [
        ["misc:pagehead", { title: "Comment ça marche" }],
        ["feat:steps", { title: "Du premier appel à la signature", items: [{ t: "Appel de cadrage", d: "Jour 1", x: "Projet et budget." }, { t: "Dossier", d: "Jours 2-5", x: "Pièces justificatives et simulation." }, { t: "Offres", d: "Jours 6-12", x: "Propositions comparées." }, { t: "Signature", d: "Semaine 4", x: "Suivi jusqu'au déblocage des fonds." }] }],
        ["feat:list2", { title: "Les pièces à préparer", items: [{ t: "Pièce d'identité", x: "" }, { t: "Trois derniers bulletins de salaire", x: "" }, { t: "Derniers avis d'imposition", x: "" }, { t: "Relevés de compte récents", x: "" }] }],
        ["misc:faq", { items: [{ t: "Combien coûte votre service ?", x: "Des honoraires fixes convenus par écrit avant toute démarche, parfois complétés par une rémunération versée par l'établissement prêteur, toujours indiquée." }, { t: "Pouvez-vous garantir l'obtention d'un prêt ?", x: "Non : la décision revient toujours à l'établissement, après étude de votre dossier." }] }],
      ] },
      { key: "conseils", name: "Conseils", blocks: [
        ["misc:pagehead", { title: "Conseils et actualités" }],
        ["misc:posts", { title: "Derniers articles", count: 6, layout: "grid" }],
        ["feat:accordion", { title: "Bien emprunter", items: [{ t: "Quel taux d'endettement viser ?", x: "Les établissements s'appuient souvent sur un repère d'un tiers des revenus ; il varie selon la situation." }, { t: "Faut-il toujours choisir la durée la plus longue ?", x: "Non : une durée plus longue baisse la mensualité mais augmente le coût total du crédit." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Un conseiller vous rappelle sous 24 heures." }],
        ["contact:cards", { title: "Étudions votre projet", formTitle: "Décrire mon projet", formIntro: "Nature du projet, montant envisagé, délai souhaité.", cta: ["Envoyer", "/contact"] }],
        ["misc:text", { title: "Mention importante", paras: ["Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager. Site de démonstration : établissements et taux cités à titre d'exemple."] }],
      ] },
    ],
  },

  // 4. Conseil fiscal : indigo, or, side header
  {
    key: "fiscalis-conseil", name: "Fiscalis", category: "finance", tags: ["moderne", "technique"], siteType: "Cabinet de conseil fiscal",
    description: "Cabinet de conseil fiscal au ton précis : indigo et ambre, bandeau sombre avec portrait, onglets par type de clientèle, questions fréquentes et ressources pratiques.",
    brand: "Fiscalis Conseil",
    tokens: { colors: { primary: "#4a3f9f", secondary: "#1a1740", accent: "#d69e2e", background: "#f6f5fb", surface: "#ffffff", text: "#1a1740", muted: "#545078" }, fonts: { heading: "font.vollkorn", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 2, md: 6, lg: 10, button: 6, field: 6, card: 8 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 52, weight: 600, lineHeight: 1.1, letterSpacing: -0.015 } }, border: { width: 1, color: "#dcd8ee" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "fiscalis", motifs: ["tiles", "topo", "plates"] },
    head: ["head:side", {}],
    foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Domaines", "/domaines"], ["Clientèle", "/clientele"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Poser une question", "/contact"],
    contact: { address: "3 rue du Palais, 33000 Bordeaux", phone: "05 57 00 44 55", email: "conseil@fiscalis.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "La fiscalité expliquée, anticipée, maîtrisée." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Conseil fiscal pour entreprises et particuliers", title: "Anticiper l'impôt, c'est déjà bien le gérer.", sub: "Nos avocats fiscalistes analysent votre situation, sécurisent vos choix et vous défendent en cas de contrôle.", cta: ["Poser une question", "/contact"], cta2: ["Nos domaines", "/domaines"], image: "portrait-1" }],
        ["feat:tabs", { eyebrow: "Clientèle", title: "Des réponses selon votre profil", items: [{ t: "Dirigeants", x: "Rémunération, dividendes, holding, transmission d'entreprise." }, { t: "Entreprises", x: "Crédit d'impôt recherche, TVA, prix de transfert, restructurations." }, { t: "Particuliers", x: "Revenus fonciers, plus-values, expatriation." }] }],
        ["proof:statsbar", { items: [["18 ans", "d'expérience cumulée"], ["600", "dossiers traités (exemple)"], ["48 h", "pour une première analyse"]] }],
        ["feat:accordion", { title: "Questions que l'on nous pose", items: [{ t: "Que faire à réception d'une proposition de rectification ?", x: "Ne pas répondre dans la précipitation : les délais sont courts mais une réponse construite change souvent l'issue." }, { t: "Une optimisation est-elle toujours légale ?", x: "Nous ne recommandons que des solutions conformes à la loi et assumables devant l'administration." }, { t: "Combien coûte une consultation ?", x: "Un premier échange de vingt minutes est offert ; les honoraires sont ensuite forfaitaires ou au temps passé, annoncés par écrit." }] }],
        ["proof:quotes", { items: [{ q: "Une réponse structurée à l'administration en dix jours.", n: "Patrick O.", r: "Dirigeant, client fictif" }, { q: "Enfin quelqu'un qui chiffre les scénarios avant de conseiller.", n: "Nadia E.", r: "Gérante, cliente fictive" }] }],
        ["cta:card", { title: "Une question fiscale précise ?", sub: "Réponse de principe sous 48 heures ouvrées.", cta: ["Poser une question", "/contact"] }],
      ] },
      { key: "domaines", name: "Domaines", blocks: [
        ["misc:pagehead", { title: "Domaines d'intervention" }],
        ["feat:rows", { title: "Nos expertises", items: [{ t: "Fiscalité des dirigeants", x: "Choix entre salaire et dividendes, régimes de faveur, pactes d'associés." }, { t: "Fiscalité des sociétés", x: "Impôt sur les sociétés, TVA, régimes d'intégration." }, { t: "Contrôle et contentieux", x: "Assistance pendant le contrôle, réponse aux propositions de rectification, recours." }, { t: "Fiscalité internationale", x: "Résidence fiscale, conventions, expatriation." }] }],
        ["feat:list2", { title: "Livrables types", items: [{ t: "Note de synthèse", x: "Deux pages lisibles par un non-spécialiste." }, { t: "Simulation chiffrée", x: "Scénarios comparés." }, { t: "Dossier de réponse", x: "Argumentaire et pièces." }, { t: "Plan d'action", x: "Calendrier des échéances." }] }],
        ["cta:band", { title: "Besoin d'un avis avant de signer ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "clientele", name: "Clientèle", blocks: [
        ["misc:pagehead", { title: "Qui nous accompagnons" }],
        ["proof:team", { items: [{ n: "Me Cécile Darrieux", r: "Avocate associée, fiscalité des dirigeants" }, { n: "Me Julien Lacoste", r: "Avocat associé, contentieux" }, { n: "Fanny Mercier", r: "Juriste fiscaliste" }] }],
        ["feat:cards", { title: "Nos clients types", items: [{ icon: "briefcase", t: "PME familiales", x: "Transmission et réorganisation." }, { icon: "trendingUp", t: "Entreprises innovantes", x: "Aides et crédits d'impôt." }, { icon: "home", t: "Investisseurs immobiliers", x: "Structuration et plus-values." }] }],
        ["proof:logos", { title: "Ils nous consultent (noms fictifs)", items: ["Domaine des Graves", "Atelier Mérignac", "Holding Bastide", "Cap Océan"] }],
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        ["misc:pagehead", { title: "Ressources" }],
        ["misc:posts", { title: "Chroniques fiscales", count: 6, layout: "list" }],
        ["feat:steps", { title: "Agenda fiscal", items: [{ t: "Printemps", x: "Déclaration de revenus." }, { t: "Été", x: "Acomptes et régularisations." }, { t: "Automne", x: "Optimisations de fin d'année." }, { t: "Hiver", x: "Clôtures et déclarations de TVA." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Confidentialité garantie." }],
        ["contact:info", { title: "Poser une question", formTitle: "Votre situation en quelques lignes", formIntro: "Aucun document n'est nécessaire pour un premier échange.", cta: ["Envoyer", "/contact"] }],
        ["misc:text", { title: "Secret professionnel", paras: ["Nos échanges sont couverts par le secret professionnel. Site de démonstration : les contenus fiscaux sont des exemples non contractuels."] }],
      ] },
    ],
  },

  // 5. Banque coopérative : lagon, sable, rond et accueillant
  {
    key: "caisse-trois-vallees", name: "Trois Vallées", category: "finance", tags: ["chaleureux", "naturel"], siteType: "Banque coopérative régionale",
    description: "Banque coopérative de proximité au ton chaleureux : bleu lagon sur sable clair, formes arrondies, recherche d'agence, services en icônes et valeurs mutualistes.",
    brand: "Caisse des Trois Vallées",
    tokens: { colors: { primary: "#0b6e75", secondary: "#073c40", accent: "#cf6a14", background: "#fbf6ec", surface: "#ffffff", text: "#173033", muted: "#52666a" }, fonts: { heading: "font.hanken-grotesk", body: "font.nunito", button: "font.hanken-grotesk", link: "font.nunito" }, radius: { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 22 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 52, weight: 800, lineHeight: 1.08, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "troisvallees", motifs: ["mountains", "dunes", "botanical"] },
    head: ["head:float", {}],
    foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Particuliers", "/particuliers"], ["Professionnels", "/professionnels"], ["Notre coopérative", "/cooperative"], ["Contact", "/contact"]], cta: ["Trouver une agence", "/contact"],
    contact: { address: "4 place de la Mairie, 73000 Chambéry", phone: "04 79 00 55 66", email: "relation@trois-vallees.example", hours: "Du mardi au samedi, 9 h – 12 h 30 et 14 h – 17 h 30", tagline: "La banque de ceux qui y vivent." },
    social: ["facebook", "instagram", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Banque coopérative · Savoie", title: "Une banque proche, qui réinvestit ici.", sub: "Comptes, épargne, crédits et assurances avec un conseiller que vous connaissez, dans une caisse détenue par ses sociétaires.", cta: ["Ouvrir un compte", "/particuliers"], placeholder: "Rechercher une agence ou un service" }],
        ["feat:icons", { title: "Vos besoins du quotidien", items: [{ icon: "home", t: "Projet immobilier", x: "Étude de votre plan de financement." }, { icon: "coin", t: "Épargne", x: "Livrets et solutions adaptées à votre horizon." }, { icon: "smartphone", t: "Banque à distance", x: "Application et conseiller joignable." }, { icon: "shield", t: "Assurances", x: "Habitation, auto, santé." }] }],
        ["gal:wall", { title: "Dans nos vallées", items: [{ t: "Marché de producteurs" }, { t: "Club de ski" }, { t: "Fête de village" }, { t: "Atelier d'artisan" }] }],
        ["proof:stats", { title: "Une banque ancrée (exemples)", items: [["32", "agences et points d'accueil"], ["54 000", "sociétaires"], ["1925", "année de création"]] }],
        ["feat:grid-icons", { title: "Nos engagements", items: [{ icon: "heart", t: "Mutualisme", x: "Un sociétaire, une voix." }, { icon: "mapPin", t: "Proximité", x: "Décisions prises localement." }, { icon: "users", t: "Entraide", x: "Soutien aux associations." }, { icon: "globe", t: "Territoire", x: "Épargne réinvestie dans la région." }] }],
        ["cta:split", { title: "Rencontrons-nous près de chez vous.", sub: "Un conseiller vous reçoit sans rendez-vous à l'agence ou par téléphone.", cta: ["Trouver une agence", "/contact"] }],
      ] },
      { key: "particuliers", name: "Particuliers", blocks: [
        ["misc:pagehead", { title: "Particuliers", sub: "Compte, épargne, crédit, assurances." }],
        ["feat:cards", { title: "Au quotidien", items: [{ icon: "user", t: "Compte courant", x: "Carte, virements, prélèvements." }, { icon: "tag", t: "Épargne disponible", x: "Livrets réglementés et comptes sur livret." }, { icon: "home", t: "Crédit habitat", x: "Conditions étudiées avec un conseiller." }] }],
        ["feat:alt", { title: "Les moments de vie", items: [{ t: "Premier logement", x: "Un interlocuteur de la réservation à la remise des clés." }, { t: "Naissance, mariage, retraite", x: "Faire le point sur vos protections et votre épargne." }] }],
        ["misc:text", { title: "À lire avant de vous engager", paras: ["Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager. Contenus de démonstration."] }],
      ] },
      { key: "professionnels", name: "Professionnels", blocks: [
        ["misc:pagehead", { title: "Professionnels et agriculteurs" }],
        ["feat:steps", { title: "Un projet d'entreprise accompagné", items: [{ t: "Idée", x: "Rencontre et premières estimations." }, { t: "Financement", x: "Montage du dossier de prêt." }, { t: "Ouverture", x: "Compte, terminal de paiement, assurances." }, { t: "Croissance", x: "Suivi annuel." }] }],
        ["feat:bento", { title: "Offres métiers", items: [{ t: "Agriculture", x: "Financement du matériel, des bâtiments et des campagnes, avec un conseiller qui connaît les cycles de votre exploitation." }, { t: "Commerce et artisanat", x: "Solutions d'encaissement et trésorerie." }, { t: "Associations", x: "Comptes dédiés et soutien aux projets." }] }],
        ["cta:band", { title: "Un projet professionnel en tête ?", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "cooperative", name: "Notre coopérative", blocks: [
        ["misc:pagehead", { title: "Notre coopérative" }],
        ["misc:story", { eyebrow: "Qui sommes-nous", title: "Une banque qui appartient à ses clients", paras: ["Chaque sociétaire détient une part du capital et vote à l'assemblée générale annuelle, quel que soit le nombre de parts.", "Cette présentation est fictive, à adapter à votre établissement."], image: "portrait-3" }],
        ["feat:numbered", { title: "Nos trois principes", items: [{ t: "Une personne, une voix", x: "Le pouvoir n'est pas lié au capital." }, { t: "Utilité locale", x: "Les décisions de crédit se prennent près de vous." }, { t: "Solidarité", x: "Une part des résultats soutient des projets du territoire." }] }],
        ["misc:posts", { title: "Actualités de la caisse", count: 3, layout: "grid" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Agences et contact" }],
        ["contact:map", { title: "Notre agence principale", mapAddress: "4 place de la Mairie, 73000 Chambéry" }],
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Mardi – vendredi", "9 h – 12 h 30, 14 h – 17 h 30"], ["Samedi", "9 h – 12 h 30"], ["Lundi", "Fermé au public, permanence téléphonique"]] }],
      ] },
    ],
  },

  // 6. Cabinet d'audit : graphite, Teko capitales, strict
  {
    key: "ordonnance-audit", name: "Ordonnance", category: "finance", tags: ["sombre", "audacieux"], siteType: "Cabinet d'audit et de commissariat aux comptes",
    description: "Cabinet d'audit au ton rigoureux : graphite et signal ambre, titres condensés en capitales, bandeau photographique sombre, méthodologie et équipe de signataires.",
    brand: "Ordonnance Audit",
    tokens: { colors: { primary: "#374151", secondary: "#0b0f14", accent: "#c26a00", background: "#f3f4f6", surface: "#ffffff", text: "#111827", muted: "#4b5563" }, fonts: { heading: "font.teko", body: "font.work-sans", button: "font.teko", link: "font.work-sans" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 78, weight: 600, lineHeight: 0.98, letterSpacing: 0.02, transform: "uppercase" }, h2: { size: 46, weight: 600, lineHeight: 1.02, letterSpacing: 0.02, transform: "uppercase" } }, border: { width: 1, color: "#d1d5db" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "ordonnance", motifs: ["plates", "halftone", "tiles"] },
    head: ["head:dark", {}],
    foot: ["foot:big", { title: "Ordonnance" }],
    menu: [["Accueil", "/"], ["Missions", "/missions"], ["Méthode", "/methode"], ["Équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Nous consulter", "/contact"],
    contact: { address: "1 boulevard des Capucines, 75009 Paris", phone: "01 40 00 66 77", email: "mission@ordonnance-audit.example", hours: "Du lundi au vendredi, 9 h – 18 h 30", tagline: "L'assurance raisonnable, démontrée." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Audit légal et contractuel", title: "Des comptes certifiés, une confiance démontrée.", sub: "Commissariat aux comptes, audit d'acquisition et revue de contrôle interne pour des entreprises qui doivent rendre des comptes à leurs actionnaires, banques et partenaires.", cta: ["Nous consulter", "/contact"], cta2: ["Nos missions", "/missions"], overlay: "#0b0f14b3" }],
        ["feat:strips", { title: "Missions", items: [{ t: "Commissariat aux comptes", x: "Certification des comptes annuels et consolidés, rapports aux actionnaires." }, { t: "Audit d'acquisition", x: "Vérification des comptes et des engagements de la cible avant une opération." }, { t: "Revue du contrôle interne", x: "Cartographie des risques, tests de procédures, recommandations." }] }],
        ["proof:statsbar", { items: [["35", "ans de pratique (exemple)"], ["210", "mandats suivis (exemple)"], ["5", "associés signataires"]] }],
        ["feat:rows", { eyebrow: "Notre cadre", title: "Ce que vous pouvez attendre de nous", items: [{ t: "Indépendance", x: "Aucune mission de conseil sur les entités que nous certifions." }, { t: "Calendrier", x: "Planning annuel partagé dès le début de la mission." }, { t: "Franchise", x: "Les points d'attention sont remontés à la direction en cours d'audit." }] }],
        ["proof:team", { title: "Associés signataires", items: [{ n: "Delphine Arnault-Vidal", r: "Associée, commissaire aux comptes" }, { n: "Louis Pernet", r: "Associé, audit d'acquisition" }, { n: "Ines Gharbi", r: "Associée, contrôle interne" }] }],
        ["cta:band", { title: "Une mission d'audit à préparer ?", sub: "Un premier échange pour cadrer périmètre et calendrier.", cta: ["Nous consulter", "/contact"] }],
      ] },
      { key: "missions", name: "Missions", blocks: [
        ["misc:pagehead", { title: "Missions", sub: "Un périmètre clair, un calendrier tenu.", bg: "token:secondary" }],
        ["feat:cards", { title: "Notre offre", items: [{ icon: "fileText", t: "Certification des comptes", x: "Opinion motivée sur la régularité et la sincérité des comptes." }, { icon: "briefcase", t: "Audit d'acquisition", x: "Due diligence financière avant un rachat." }, { icon: "settings", t: "Contrôle interne", x: "Revue des processus d'achat, de vente et de clôture." }] }],
        ["feat:compare", { title: "Audit légal ou audit contractuel", rows: [["", "Audit légal", "Audit contractuel"], ["Origine", "obligation légale", "demande de l'entreprise"], ["Périmètre", "défini par la loi", "défini avec vous"], ["Livrable", "rapport de certification", "rapport sur mesure"]] }],
        ["cta:split", { title: "Besoin de savoir si votre structure est concernée ?", sub: "Les seuils dépendent de la forme juridique et de la taille de l'entité.", cta: ["Poser la question", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ["misc:pagehead", { title: "Méthode d'audit" }],
        ["feat:steps", { eyebrow: "Déroulé d'une mission", title: "Cinq phases", items: [{ t: "Prise de connaissance", d: "Phase 1", x: "Compréhension de l'activité, des risques et du contrôle interne." }, { t: "Planification", d: "Phase 2", x: "Seuils de signification, échantillons et calendrier." }, { t: "Tests", d: "Phase 3", x: "Contrôles de procédures et tests de détail." }, { t: "Synthèse", d: "Phase 4", x: "Discussion des points d'attention avec la direction." }, { t: "Rapport", d: "Phase 5", x: "Opinion et lettre de recommandations." }] }],
        ["feat:numbered", { title: "Nos exigences", items: [{ t: "Documentation", x: "Chaque conclusion est étayée par un dossier de travail." }, { t: "Revue indépendante", x: "Une seconde lecture par un associé non impliqué." }, { t: "Confidentialité", x: "Accès limités et traçables." }] }],
        ["misc:faq", { items: [{ t: "Quelle est la durée d'un mandat de commissaire aux comptes ?", x: "Elle est fixée par la loi ; nous la présentons lors du premier échange selon votre forme juridique." }] }],
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        ["misc:pagehead", { title: "Équipe" }],
        ["proof:team", { items: [{ n: "Delphine Arnault-Vidal", r: "Associée" }, { n: "Louis Pernet", r: "Associé" }, { n: "Ines Gharbi", r: "Associée" }, { n: "Baptiste Moreau", r: "Directeur de mission" }] }],
        ["misc:story", { eyebrow: "Cabinet", title: "Des auditeurs, pas des vendeurs", paras: ["Le cabinet limite volontairement ses activités à l'audit, afin de préserver son indépendance.", "Les profils présentés sont fictifs."], image: "portrait-2" }],
        ["proof:stats", { items: [["28", "collaborateurs"], ["9", "secteurs couverts"], ["2", "bureaux"]] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Un associé vous répond." }],
        ["contact:info", { title: "Nous consulter", formTitle: "Décrire votre besoin", formIntro: "Forme juridique, secteur, taille approximative, échéance.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "1 boulevard des Capucines, 75009 Paris" }],
      ] },
    ],
  },
];
