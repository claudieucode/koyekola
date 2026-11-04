// Technologie : SaaS, API, IA, sécurité, fintech, data, CRM, no-code, cloud, RH, visioconférence (11 thèmes). Textes de DÉMONSTRATION : marques, personnes, tarifs, chiffres et coordonnées fictifs.
module.exports = [
  // 1. SaaS de gestion de projet, clair, vert forêt
  {
    key: "cordee-saas", name: "Cordée", category: "tech", tags: ["moderne", "chaleureux"], siteType: "Logiciel SaaS de gestion de projet",
    description: "Site produit clair pour un outil de gestion de projet : vert forêt sur fond crème, en-tête flottant, grand visuel sous le titre, bento de vues et tarifs par utilisateur.",
    brand: "Cordée",
    tokens: { colors: { primary: "#15803d", secondary: "#14352a", accent: "#f59e0b", background: "#fbfaf5", surface: "#eef3e8", text: "#16261f", muted: "#4d5f55" }, fonts: { heading: "font.bricolage-grotesque", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 62, weight: 700, lineHeight: 1.03, letterSpacing: -0.03 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "pill" }, art: { seed: "cordee", motifs: ["blobs", "ribbons", "objects"] },
    head: ["head:float", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Produit", "/produit"], ["Tarifs", "/tarifs"], ["Équipes", "/equipes"], ["Contact", "/contact"]], cta: ["Essayer 14 jours", "/contact"],
    contact: { address: "14 rue de la Corderie, 44000 Nantes", phone: "02 40 00 31 42", email: "salut@cordee.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Tenez le cap, ensemble." },
    social: ["linkedin", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Gestion de projet pour équipes de 5 à 200", title: "Un seul fil pour tout le projet.", sub: "Cordée relie tâches, jalons et décisions dans un espace que toute l'équipe lit sans formation.", cta: ["Essayer 14 jours", "/contact"], cta2: ["Voir le produit", "/produit"], stats: [["4 600", "équipes (exemple)"], ["-35 %", "de réunions de suivi (exemple)"], ["4,7/5", "satisfaction (exemple)"]] }],
        ["feat:bento", { eyebrow: "Trois vues, un projet", title: "Chacun voit ce qui compte pour lui", items: [{ t: "Tableau des tâches", x: "Colonnes personnalisables, glisser-déposer, sous-tâches et pièces jointes : le quotidien de l'équipe tient sur un écran, sans tableur parallèle." }, { t: "Frise des jalons", x: "Les dépendances se décalent d'elles-mêmes." }, { t: "Charge d'équipe", x: "Repérez la surcharge avant le retard." }] }],
        ["proof:quotes", { eyebrow: "Équipes utilisatrices", title: "Ce qu'elles en disent", items: [{ q: "Le lundi, personne ne demande plus où en est le chantier.", n: "Maëlle R.", r: "Cheffe de projet, cliente fictive" }, { q: "Nos clients suivent l'avancement sans nous écrire.", n: "Hugo T.", r: "Gérant d'agence, client fictif" }, { q: "Migration depuis nos tableurs en une demi-journée.", n: "Inès V.", r: "Responsable PMO, cliente fictive" }] }],
        ["feat:steps", { eyebrow: "Mise en route", title: "Opérationnel en quatre étapes", items: [{ t: "Importer", d: "Jour 1", x: "Vos tâches arrivent depuis un tableur ou un autre outil." }, { t: "Inviter", d: "Jour 1", x: "Les équipes rejoignent par lien, avec des droits par projet." }, { t: "Planifier", d: "Jour 2", x: "Jalons, responsables et échéances posés ensemble." }, { t: "Suivre", d: "Semaine 1", x: "Le point hebdomadaire se fait depuis le tableau." }] }],
        ["cta:card", { title: "Votre premier projet, cet après-midi.", sub: "14 jours d'essai, sans carte bancaire.", cta: ["Essayer 14 jours", "/contact"] }],
      ] },
      { key: "produit", name: "Produit", blocks: [
        ["misc:pagehead", { title: "Le produit", sub: "Planifier, suivre, clôturer." }],
        ["feat:alt", { title: "Du brief à la livraison", items: [{ t: "Planifier sans tableur", x: "Glissez une tâche : ses dépendances suivent." }, { t: "Décider au même endroit", x: "Chaque décision est liée à sa tâche et reste consultable." }, { t: "Clôturer proprement", x: "Un bilan est généré à partir de l'historique du projet." }] }],
        ["feat:grid-icons", { title: "Les détails qui comptent", items: [{ icon: "calendarClock", t: "Rappels" , x: "Prévenu une fois, au bon moment." }, { icon: "lock", t: "Droits par projet", x: "Invités externes limités." }, { icon: "plug", t: "Intégrations", x: "Messagerie et agendas." }, { icon: "download", t: "Export", x: "CSV et JSON à tout moment." }] }],
        ["cta:band", { title: "Une démonstration de vingt minutes ?", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Par utilisateur et par mois. Montants à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Solo", price: "0 €", period: "/mois", f: ["3 projets", "Tableau et liste"], cta: "Commencer", url: "/contact" }, { t: "Équipe", price: "8 €", period: "/utilisateur/mois", f: ["Projets illimités", "Frise des jalons", "Charge d'équipe"], cta: "Essayer 14 jours", url: "/contact", hl: true }, { t: "Organisation", price: "Sur devis", f: ["Authentification unique", "Journal d'audit"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:compare", { title: "Comparatif", rows: [["", "Solo", "Équipe", "Organisation"], ["Projets", "3", "illimités", "illimités"], ["Frise des jalons", "non", "oui", "oui"], ["Journal d'audit", "non", "non", "oui"]] }],
        ["feat:accordion", { title: "Facturation", items: [{ t: "Puis-je résilier à tout moment ?", x: "Oui, depuis les paramètres ; vos données restent exportables 30 jours." }, { t: "Remise pour les associations ?", x: "Oui, écrivez-nous pour en discuter." }] }],
      ] },
      { key: "equipes", name: "Équipes", blocks: [
        ["misc:pagehead", { title: "Pour quelles équipes ?", sub: "Des usages concrets, métier par métier." }],
        ["feat:strips", { title: "Cordée au quotidien", items: [{ t: "Agences et studios", x: "Suivi des livrables par client et validation en ligne." }, { t: "Bureaux d'études", x: "Jalons réglementaires et revues de plans." }, { t: "Équipes produit", x: "Cycles courts, retours et priorités visibles." }] }],
        ["misc:posts", { title: "Le blog de Cordée", count: 3, layout: "list" }],
        ["cta:split", { title: "Parlez-nous de votre équipe", sub: "Nous vous recommandons une configuration de départ.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Une réponse humaine sous un jour ouvré." }],
        ["contact:info", { title: "Parlons de vos projets", formTitle: "Écrire à l'équipe", formIntro: "Taille de l'équipe, outils actuels : quelques lignes suffisent.", cta: ["Envoyer", "/contact"] }],
        ["feat:accordion", { title: "Avant de nous écrire", items: [{ t: "Proposez-vous un accompagnement ?", x: "Oui, un atelier de lancement d'une demi-journée est possible dès l'offre Équipe." }, { t: "Où sont hébergées les données ?", x: "Dans l'Union européenne." }] }],
      ] },
    ],
  },

  // 2. API et outils pour développeurs, sombre, vert citron
  {
    key: "sillon-api", name: "Sillon API", category: "tech", tags: ["sombre", "technique"], siteType: "API et outils pour développeurs",
    description: "Thème sombre à accent vert citron pour une API de développeurs : titres en chasse fixe, angles vifs, bandeau centré avec chiffres, onglets d'intégration et documentation.",
    brand: "Sillon API",
    tokens: { colors: { primary: "#a3e635", secondary: "#0e1410", accent: "#22d3ee", background: "#0b0f0c", surface: "#151c17", text: "#e8efe6", muted: "#a0ae9d" }, fonts: { heading: "font.jetbrains-mono", body: "font.ibm-plex-sans", button: "font.jetbrains-mono", link: "font.ibm-plex-sans" }, radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2a352d" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.1, letterSpacing: -0.03 } } },
    dna: { scale: "m", pad: "tight", align: "center", shape: "sharp" }, art: { seed: "sillon", motifs: ["tiles", "topo", "halftone"] },
    head: ["head:bar", {}], foot: ["foot:simple", { about: "Sillon : une API de traitement de documents versionnée, testable dans un bac à sable et documentée ligne à ligne.", cols: [["Produit", "Endpoints", "Tarifs", "Journal des versions"], ["Ressources", "Guides", "Statut", "Contact"]] }],
    menu: [["Accueil", "/"], ["Endpoints", "/endpoints"], ["Tarifs", "/tarifs"], ["Guides", "/guides"], ["Contact", "/contact"]], cta: ["Créer une clé", "/contact"],
    contact: { address: "5 rue des Frères Lumière, 67000 Strasbourg", phone: "03 88 00 41 52", email: "dev@sillon.example", hours: "Support du lundi au vendredi, 8 h 30 – 18 h", tagline: "Du document brut à la donnée propre." },
    social: ["github", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "API d'extraction de documents", title: "POST /documents → des données propres.", sub: "Envoyez une facture, un contrat ou un bon de livraison : recevez du JSON structuré, avec un score de confiance par champ.", cta: ["Créer une clé", "/contact"], cta2: ["Lire les guides", "/guides"], stats: [["98,2 %", "champs reconnus (exemple)"], ["1,4 s", "temps médian (exemple)"], ["9", "SDK (exemple)"]] }],
        ["feat:tabs", { eyebrow: "Intégration", title: "Quatre appels, de l'envoi à la validation", items: [{ t: "Envoyer", x: "Un fichier PDF ou image, jusqu'à 20 Mo, par requête multipart." }, { t: "Extraire", x: "Réponse JSON typée : dates, montants, lignes, avec score de confiance." }, { t: "Corriger", x: "Un champ douteux ? Renvoyez la correction pour améliorer votre modèle." }, { t: "Notifier", x: "Webhooks signés à la fin de chaque traitement." }] }],
        ["feat:rows", { title: "Conçue pour la production", items: [{ t: "Idempotence", x: "Relancez sans créer de doublons grâce aux clés d'idempotence." }, { t: "Régions européennes", x: "Traitement et stockage dans l'Union européenne, suppression à la demande." }, { t: "Limites lisibles", x: "Quotas et en-têtes de limite documentés, sans surprise." }] }],
        ["proof:statsbar", { items: [["120", "types de documents (exemple)"], ["99,95 %", "disponibilité (exemple)"], ["30 j", "journal des appels"]] }],
        ["cta:split", { title: "Testez dans le bac à sable.", sub: "Aucune carte bancaire, 500 pages offertes.", cta: ["Créer une clé", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
      ] },
      { key: "endpoints", name: "Endpoints", blocks: [
        ["misc:pagehead", { title: "Endpoints", sub: "Quatre ressources, une logique commune." }],
        ["feat:list2", { title: "Ressources principales", items: [{ t: "/documents", x: "Dépôt et traitement." }, { t: "/extractions", x: "Résultats et scores." }, { t: "/modeles", x: "Modèles personnalisés." }, { t: "/webhooks", x: "Abonnements aux événements." }] }],
        ["feat:compare", { title: "Bac à sable ou production", rows: [["", "Bac à sable", "Production"], ["Données", "fictives", "réelles"], ["Limite", "100 appels/min", "selon l'offre"], ["Journal", "7 jours", "30 jours"]] }],
        ["feat:steps", { title: "Versions de l'API", items: [{ t: "Version datée", x: "Chaque changement incompatible crée une nouvelle version." }, { t: "Dépréciation", d: "18 mois", x: "L'ancienne version reste disponible." }, { t: "Journal", x: "Chaque modification est publiée." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Au volume, montants donnés à titre d'exemple." }],
        ["feat:pricelist", { title: "Prix à la page traitée", items: [{ t: "Jusqu'à 10 000 pages/mois", x: "Support par e-mail.", price: "0,04 €" }, { t: "10 001 à 200 000 pages", x: "Support sous 1 jour.", price: "0,025 €" }, { t: "Au-delà", x: "Environnement dédié, engagement.", price: "Sur devis" }] }],
        ["price:tiers", { items: [{ t: "Bac à sable", price: "0 €", f: ["500 pages offertes", "Données fictives"], cta: "Créer une clé", url: "/contact" }, { t: "Production", price: "49 €", period: "/mois", f: ["Dès 2 000 pages incluses", "Webhooks et journal"], cta: "Choisir", url: "/contact", hl: true }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Que devient mon document après traitement ?", x: "Il est supprimé sous 24 h, sauf si vous demandez une conservation plus longue." }, { t: "Puis-je annuler à tout moment ?", x: "Oui, sans engagement." }] }],
      ] },
      { key: "guides", name: "Guides", blocks: [
        ["misc:pagehead", { title: "Guides et notes de version" }],
        ["misc:posts", { title: "Derniers articles", count: 6, layout: "list" }],
        ["misc:faq", { title: "Dépannage", items: [{ t: "Erreur 401", x: "Vérifiez que la clé correspond à l'environnement appelé." }, { t: "Un champ revient vide", x: "Consultez le score de confiance : sous 0,6, le champ est laissé vide." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:map", { title: "L'équipe développeurs", mapAddress: "5 rue des Frères Lumière, 67000 Strasbourg" }],
        ["feat:icons", { title: "Autres canaux", items: [{ icon: "activity", t: "Statut", x: "Incidents en cours." }, { icon: "gitBranch", t: "Exemples", x: "Dépôts à cloner." }, { icon: "help", t: "Aide", x: "Facturation et compte." }] }],
      ] },
    ],
  },

  // 3. Plateforme d'IA / assistants, sombre, lilas, serif éditorial
  {
    key: "murmure-ia", name: "Murmure", category: "tech", tags: ["sombre", "editorial", "luxe"], siteType: "Plateforme d'assistants IA pour entreprises",
    description: "Thème nocturne éditorial pour une plateforme d'assistants IA : serif d'affichage, lilas sur indigo profond, bandeau minimaliste et grandes citations.",
    brand: "Murmure",
    tokens: { colors: { primary: "#a78bfa", secondary: "#1b1633", accent: "#fcd34d", background: "#100d1f", surface: "#1a1630", text: "#ece8f8", muted: "#aaa3c8" }, fonts: { heading: "font.instrument-serif", body: "font.schibsted-grotesk", button: "font.schibsted-grotesk", link: "font.schibsted-grotesk" }, radius: { sm: 8, md: 14, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "lg", button: "none" }, border: { width: 1, color: "#2d2750" }, type: { h1: { size: 76, weight: 400, lineHeight: 1, letterSpacing: -0.02 }, h2: { size: 46, weight: 400, lineHeight: 1.05, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "pill" }, art: { seed: "murmure", motifs: ["bokeh", "mesh", "waves"] },
    head: ["head:minimal", {}], foot: ["foot:center", { about: "Murmure : des assistants qui lisent vos documents, citent leurs sources et savent dire qu'ils ne savent pas." }],
    menu: [["Accueil", "/"], ["Assistants", "/assistants"], ["Confiance", "/confiance"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander une démo", "/contact"],
    contact: { address: "3 rue de l'Abbé Grégoire, 75006 Paris", phone: "01 80 00 52 63", email: "bonjour@murmure.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Des assistants qui citent leurs sources." },
    social: ["linkedin", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Assistants pour vos équipes", title: "Posez la question. Murmure cherche, cite, répond.", sub: "Des assistants branchés sur vos documents internes, qui renvoient la source de chaque réponse et laissent l'humain décider.", cta: ["Demander une démo", "/contact"], cta2: ["Voir les assistants", "/assistants"] }],
        ["proof:big", { items: [{ q: "Mon équipe support retrouve en dix secondes ce qui prenait vingt minutes.", n: "Responsable support", r: "cliente fictive" }] }],
        ["feat:numbered", { eyebrow: "Principe", title: "Trois règles non négociables", items: [{ t: "Toujours la source", x: "Chaque réponse renvoie au paragraphe d'origine." }, { t: "Jamais d'invention", x: "Sans passage fiable, l'assistant le dit." }, { t: "Vos données chez vous", x: "Vos documents ne servent pas à entraîner de modèle." }] }],
        ["feat:alt", { eyebrow: "Cas d'usage", title: "Là où le savoir se perd", items: [{ t: "Assistant support", x: "Réponses basées sur vos procédures et vos tickets résolus.", link: ["Découvrir", "/assistants"] }, { t: "Assistant juridique interne", x: "Recherche dans les contrats types et clauses validées." }, { t: "Assistant d'intégration", x: "Les nouveaux arrivants posent leurs questions sans déranger." }] }],
        ["cta:image", { title: "Voyez-le répondre sur vos propres documents.", sub: "Démonstration de 30 minutes, avec un échantillon de votre base.", cta: ["Demander une démo", "/contact"] }],
      ] },
      { key: "assistants", name: "Assistants", blocks: [
        ["misc:pagehead", { title: "Les assistants", sub: "Un assistant par métier, un socle commun." }],
        ["feat:bento", { title: "Ce que chaque assistant sait faire", items: [{ t: "Répondre avec sources", x: "Réponses courtes, citations vérifiables, liens vers les documents d'origine." }, { t: "Résumer", x: "Notes de réunion, dossiers, fils de discussion." }, { t: "Rédiger", x: "Brouillons validés par un humain avant envoi." }] }],
        ["feat:tabs", { title: "Sources connectées", items: [{ t: "Documents", x: "PDF, présentations, pages de wiki." }, { t: "Tickets", x: "Historique des demandes clients résolues." }, { t: "Bases de connaissances", x: "Synchronisation planifiée." }] }],
        ["cta:band", { title: "Quel assistant pour votre équipe ?", cta: ["En parler", "/contact"] }],
      ] },
      { key: "confiance", name: "Confiance", blocks: [
        ["misc:pagehead", { title: "Confiance et sécurité", sub: "Ce que nous faisons de vos données." }],
        ["misc:text", { eyebrow: "Notre engagement", title: "Vos documents restent vos documents", paras: ["Vos contenus sont chiffrés au repos et en transit, hébergés dans l'Union européenne, et jamais utilisés pour entraîner un modèle.", "Chaque assistant n'accède qu'aux sources que vous lui ouvrez, avec les droits de l'utilisateur qui pose la question."] }],
        ["feat:checks", { title: "Garde-fous", items: [{ t: "Droits hérités des sources" }, { t: "Journal des questions consultable" }, { t: "Suppression sur demande" }, { t: "Relecture humaine configurable" }], cta: ["Parler sécurité", "/contact"] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "L'assistant peut-il se tromper ?", x: "Oui, d'où les citations systématiques : vous vérifiez en un clic." }, { t: "Quel modèle de langage utilisez-vous ?", x: "Le modèle est choisi avec vous selon l'usage et la sensibilité des données." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Pilote", price: "490 €", period: "/mois", x: "Un assistant, 25 utilisateurs.", f: ["1 source connectée", "Support par e-mail"], cta: "Démarrer", url: "/contact" }, { t: "Équipe", price: "1 900 €", period: "/mois", x: "Trois assistants, 150 utilisateurs.", f: ["Sources illimitées", "Journal consultable", "Accompagnement"], cta: "Demander une démo", url: "/contact", hl: true }, { t: "Entreprise", price: "Sur devis", f: ["Déploiement dédié", "Droits avancés"], cta: "Nous contacter", url: "/contact" }] }],
        ["proof:quotes", { items: [{ q: "Le pilote nous a convaincus en trois semaines.", n: "Clara D.", r: "DSI, cliente fictive" }, { q: "Les citations changent la confiance de l'équipe.", n: "Paul M.", r: "Responsable qualité, client fictif" }] }],
        ["feat:accordion", { title: "Facturation", items: [{ t: "Engagement ?", x: "Annuel avec période de pilote de deux mois." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Réserver une démonstration", formTitle: "Votre demande", formIntro: "Indiquez votre équipe et vos documents : nous préparons la démonstration.", cta: ["Envoyer", "/contact"] }],
        ["misc:quote", { text: "Un bon assistant sait dire : je ne sais pas.", by: "Principe de conception" }],
      ] },
    ],
  },

  // 4. Cybersécurité, sombre, rouge corail
  {
    key: "citadelle-zero", name: "Citadelle Zéro", category: "tech", tags: ["sombre", "audacieux", "technique"], siteType: "Cybersécurité et réponse aux incidents",
    description: "Thème sombre tendu pour une société de cybersécurité : rouge signal sur noir bleuté, capitales condensées, bandeau plein cadre et chiffres de veille.",
    brand: "Citadelle Zéro",
    tokens: { colors: { primary: "#ff4d6d", secondary: "#1a0a10", accent: "#38bdf8", background: "#0a0c12", surface: "#141823", text: "#eceef5", muted: "#a5adc2" }, fonts: { heading: "font.saira", body: "font.public-sans", button: "font.saira", link: "font.public-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2a3042" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.02, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 34, weight: 700, lineHeight: 1.1, letterSpacing: 0.02, transform: "uppercase" } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "citadelle", motifs: ["rays", "plates", "mesh"] },
    head: ["head:dark", {}], foot: ["foot:columns", { about: "Citadelle Zéro : audit, supervision et réponse aux incidents pour les PME et collectivités. Astreinte 24 h/24.", cols: [["Services", "Audit", "Supervision", "Réponse aux incidents"], ["Société", "Méthode", "Ressources", "Contact"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Méthode", "/methode"], ["Ressources", "/ressources"], ["Urgence", "/contact"]], cta: ["Incident en cours ?", "/contact"],
    contact: { address: "9 boulevard des Capucines, 31000 Toulouse", phone: "05 61 00 63 74", email: "soc@citadelle-zero.example", hours: "Astreinte 24 h/24, 7 j/7. Bureaux : lundi au vendredi, 9 h – 18 h", tagline: "Ce qui est surveillé est protégé." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Centre de supervision 24 h/24", title: "Détecter vite. Contenir mieux.", sub: "Audit, supervision et réponse aux incidents pour les PME, les collectivités et les établissements de santé.", cta: ["Incident en cours ?", "/contact"], cta2: ["Nos services", "/services"] }],
        ["proof:stats", { title: "Notre veille en chiffres (exemples)", items: [["11 min", "délai médian de prise en charge"], ["340", "environnements supervisés"], ["0", "perte de données après intervention (exemple)"]] }],
        ["feat:strips", { eyebrow: "Trois lignes de défense", title: "Prévenir, surveiller, réagir", items: [{ t: "Audit et tests d'intrusion", x: "Cartographie des failles et plan de correction priorisé." }, { t: "Supervision continue", x: "Collecte des journaux, corrélation et alertes qualifiées par un analyste." }, { t: "Réponse à incident", x: "Isolement, analyse, remise en service et rapport." }] }],
        ["feat:accordion", { title: "Réflexes en cas d'attaque", items: [{ t: "Que faire en premier ?", x: "Débrancher du réseau les postes touchés sans les éteindre, puis nous appeler." }, { t: "Faut-il payer une rançon ?", x: "Nous le déconseillons ; nous évaluons ensemble les sauvegardes et les options de restauration." }] }],
        ["cta:band", { title: "Une attaque en cours ? Appelez l'astreinte.", sub: "Prise en charge immédiate, 24 h/24.", cta: ["Joindre l'astreinte", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ["misc:pagehead", { title: "Services", sub: "Un parcours complet ou à la carte." }],
        ["feat:rows", { title: "Ce que nous faisons", items: [{ t: "Audit d'infrastructure", x: "Poste de travail, serveurs, messagerie et sauvegardes passés en revue." }, { t: "Test d'intrusion", x: "Simulation d'attaque encadrée, rapport avec correctifs." }, { t: "Supervision", x: "Analystes en rotation, alertes qualifiées." }, { t: "Formation", x: "Sensibilisation au hameçonnage pour tous les salariés." }] }],
        ["price:tiers", { items: [{ t: "Audit", price: "3 900 €", x: "Mission unique.", f: ["Rapport priorisé", "Restitution"], cta: "Demander un devis", url: "/contact" }, { t: "Supervision", price: "890 €", period: "/mois", x: "Jusqu'à 50 postes.", f: ["Veille 24 h/24", "Rapport mensuel"], cta: "Demander un devis", url: "/contact", hl: true }, { t: "Incident", price: "Sur devis", f: ["Intervention immédiate", "Rapport d'incident"], cta: "Appeler", url: "/contact" }] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ["misc:pagehead", { title: "Notre méthode", sub: "Une réponse à incident en cinq temps." }],
        ["feat:steps", { items: [{ t: "Qualifier", d: "H+0", x: "Nature de l'attaque et périmètre." }, { t: "Contenir", d: "H+1", x: "Isolement des systèmes touchés." }, { t: "Éradiquer", d: "J+1", x: "Suppression de la menace." }, { t: "Restaurer", d: "J+2", x: "Remise en service depuis des sauvegardes saines." }, { t: "Apprendre", d: "J+10", x: "Rapport et plan de durcissement." }] }],
        ["proof:team", { title: "L'équipe d'astreinte", items: [{ n: "Analyste principale", r: "Réponse à incident" }, { n: "Ingénieur forensique", r: "Analyse des preuves" }, { n: "Responsable des tests", r: "Intrusion" }] }],
        ["cta:split", { title: "Évaluer votre exposition", sub: "Un premier diagnostic gratuit de 45 minutes.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        ["misc:pagehead", { title: "Ressources" }],
        ["misc:posts", { title: "Alertes et analyses", count: 6, layout: "grid" }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Travaillez-vous avec les collectivités ?", x: "Oui, avec un cadre de marché adapté." }, { t: "Où sont stockés les journaux ?", x: "En France, chiffrés." }] }],
      ] },
      { key: "contact", name: "Urgence", blocks: [
        ["misc:pagehead", { title: "Urgence et contact", sub: "L'astreinte répond 24 h/24." }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Demande non urgente", formIntro: "Pour une attaque en cours, appelez plutôt l'astreinte.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilité", rows: [["Astreinte incidents", "24 h/24, 7 j/7"], ["Bureaux", "Lun – ven, 9 h – 18 h"]] }],
      ] },
    ],
  },
  // 5. Fintech / paiement, clair, bleu cobalt
  {
    key: "ricochet-pay", name: "Ricochet", category: "tech", tags: ["moderne", "editorial"], siteType: "Fintech : encaissement et paiement en ligne",
    description: "Site fintech sobre et rassurant : bleu cobalt sur blanc bleuté, serif à contraste pour les titres, bandeau en dégradé avec chiffres, tarifs lisibles et pages de conformité.",
    brand: "Ricochet",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0f1b3d", accent: "#14b8a6", background: "#f7f9fd", surface: "#e8eefb", text: "#0f1b3d", muted: "#46517a" }, fonts: { heading: "font.fraunces", body: "font.montserrat", button: "font.montserrat", link: "font.montserrat" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 10, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 600, lineHeight: 1.05, letterSpacing: -0.02 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "ricochet", motifs: ["waves", "skyline", "plates"] },
    head: ["head:split", {}], foot: ["foot:newsletter", { title: "Le courrier de Ricochet", sub: "Réglementation des paiements et nouveautés produit, une fois par mois.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Encaisser", "/encaisser"], ["Tarifs", "/tarifs"], ["Conformité", "/conformite"], ["Contact", "/contact"]], cta: ["Ouvrir un compte", "/contact"],
    contact: { address: "27 rue de la Bourse, 69002 Lyon", phone: "04 72 00 74 85", email: "commerce@ricochet.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h 30", tagline: "Chaque paiement arrive au bon endroit." },
    social: ["linkedin", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Encaissement en ligne et en boutique", title: "Encaissez sans friction, rapprochez sans effort.", sub: "Une seule plateforme pour accepter les cartes, les virements et les paiements en plusieurs fois, avec un rapprochement bancaire automatique.", cta: ["Ouvrir un compte", "/contact"], cta2: ["Voir les tarifs", "/tarifs"], stats: [["99,98 %", "de disponibilité (exemple)"], ["J+1", "versement des fonds (exemple)"], ["12 000", "commerçants (exemple)"]] }],
        ["feat:icons", { title: "Tout le parcours de paiement", items: [{ icon: "coin", t: "Cartes et virements", x: "Moyens de paiement courants, 3-D Secure intégré." }, { icon: "calendarClock", t: "Paiement fractionné", x: "En trois ou quatre fois, sans risque d'impayé pour vous." }, { icon: "fileText", t: "Rapprochement", x: "Chaque virement reçu est relié à sa vente." }, { icon: "shield", t: "Lutte contre la fraude", x: "Règles et score de risque ajustables." }] }],
        ["proof:logos", { title: "Ils encaissent avec Ricochet (clients fictifs)", items: ["Maison Orme", "Vélocité", "Atelier Pivoine", "Casa Lenta", "Nord-Sud"] }],
        ["feat:compare", { eyebrow: "Comparatif", title: "Ricochet face au terminal bancaire classique", rows: [["", "Terminal classique", "Ricochet"], ["Paiement en ligne", "module séparé", "inclus"], ["Rapprochement", "manuel", "automatique"], ["Versement", "J+2 à J+3", "J+1"]] }],
        ["cta:image", { title: "Un compte marchand ouvert sous 48 heures.", sub: "Dossier simplifié pour les indépendants et les petites entreprises.", cta: ["Ouvrir un compte", "/contact"] }],
      ] },
      { key: "encaisser", name: "Encaisser", blocks: [
        ["misc:pagehead", { title: "Encaisser", sub: "En ligne, en boutique, à distance." }],
        ["feat:alt", { title: "Trois façons d'encaisser", items: [{ t: "Paiement en ligne", x: "Page de paiement personnalisable ou intégration par API." }, { t: "Lien de paiement", x: "Envoyez un lien par message ou e-mail, sans site marchand." }, { t: "Terminal en boutique", x: "Terminal compact, tickets numériques, synchronisé avec vos ventes en ligne." }] }],
        ["feat:steps", { title: "Ouverture du compte", items: [{ t: "Dossier", d: "10 min", x: "Identité de l'entreprise et pièces justificatives." }, { t: "Vérification", d: "24 à 48 h", x: "Contrôle réglementaire par nos équipes." }, { t: "Test", x: "Paiements de test sans frais." }, { t: "Mise en ligne", x: "Premiers encaissements réels." }] }],
        ["cta:card", { title: "Besoin d'un branchement sur mesure ?", cta: ["Parler à un conseiller", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Sans abonnement caché. Montants donnés à titre d'exemple." }],
        ["feat:pricelist", { title: "Frais par transaction", items: [{ t: "Carte européenne", x: "Par paiement accepté", price: "1,4 % + 0,20 €" }, { t: "Carte hors Europe", x: "Par paiement accepté", price: "2,9 % + 0,20 €" }, { t: "Virement instantané", x: "Par transaction", price: "0,50 €" }, { t: "Litige bancaire", x: "Par dossier", price: "12 €" }] }],
        ["price:tiers", { items: [{ t: "Démarrage", price: "0 €", period: "/mois", f: ["Paiement en ligne", "Rapprochement de base"], cta: "Ouvrir", url: "/contact" }, { t: "Croissance", price: "29 €", period: "/mois", f: ["Paiement fractionné", "Export comptable", "Support prioritaire"], cta: "Choisir", url: "/contact", hl: true }] }],
      ] },
      { key: "conformite", name: "Conformité", blocks: [
        ["misc:pagehead", { title: "Conformité et sécurité" }],
        ["feat:checks", { title: "Ce que nous garantissons", items: [{ t: "Authentification forte des paiements" }, { t: "Données de carte jamais stockées chez vous" }, { t: "Fonds des clients cantonnés" }, { t: "Journal d'audit exportable" }], cta: ["Poser une question", "/contact"] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Mes fonds sont-ils protégés ?", x: "Les fonds encaissés sont conservés sur des comptes distincts de ceux de l'entreprise." }, { t: "Qui contrôle Ricochet ?", x: "Cet exemple présente un établissement fictif ; les mentions réglementaires réelles sont à renseigner par l'éditeur du site." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Parlons de vos encaissements", formTitle: "Votre demande", formIntro: "Volume mensuel et canaux de vente : quelques lignes suffisent.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Support", rows: [["Lundi – vendredi", "8 h 30 – 18 h 30"], ["Incident de paiement", "Réponse sous 2 h"]] }],
      ] },
    ],
  },

  // 6. Analytics et data, clair, cyan profond, éditorial
  {
    key: "azimut-data", name: "Azimut", category: "tech", tags: ["editorial", "technique"], siteType: "Plateforme d'analytics et de données",
    description: "Site produit éditorial pour une plateforme d'analyse de données : cyan profond sur blanc glacé, serif de presse, grand titre pleine largeur, chiffres et pied de page à grand nom.",
    brand: "Azimut",
    tokens: { colors: { primary: "#0e7490", secondary: "#0c2a33", accent: "#f97316", background: "#f6fafb", surface: "#e3f0f3", text: "#0c2a33", muted: "#44606a" }, fonts: { heading: "font.newsreader", body: "font.open-sans", button: "font.open-sans", link: "font.open-sans" }, radius: { sm: 2, md: 4, lg: 8, button: 3, field: 3, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#b7d3da" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.02, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "azimut", motifs: ["topo", "halftone", "skyline"] },
    head: ["head:side", {}], foot: ["foot:big", { title: "Azimut", about: "Des tableaux de bord que l'on comprend sans analyste." }],
    menu: [["Accueil", "/"], ["Plateforme", "/plateforme"], ["Cas d'usage", "/cas-d-usage"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander une démo", "/contact"],
    contact: { address: "6 place Stanislas, 54000 Nancy", phone: "03 83 00 85 96", email: "demo@azimut-data.example", hours: "Du lundi au vendredi, 9 h – 17 h 30", tagline: "Orientez vos décisions." },
    social: ["linkedin", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Données et décision", title: "Vos chiffres, enfin lisibles.", sub: "Azimut relie vos outils de vente, de finance et de production dans des tableaux de bord que chaque responsable sait lire.", cta: ["Demander une démo", "/contact"], cta2: ["Voir la plateforme", "/plateforme"] }],
        ["proof:stats", { title: "La plateforme en chiffres (exemples)", items: [["45", "connecteurs de données"], ["3 min", "pour un premier tableau de bord"], ["1,2 Md", "de lignes analysées par jour"]] }],
        ["feat:rows", { eyebrow: "Principe", title: "De la donnée brute à la décision", items: [{ t: "Brancher", x: "Connecteurs vers vos bases, tableurs, outils de caisse et de relation client." }, { t: "Nettoyer", x: "Règles de qualité visibles : doublons, valeurs manquantes, écarts." }, { t: "Modéliser", x: "Des indicateurs définis une fois et partagés par toute l'entreprise." }, { t: "Partager", x: "Tableaux de bord et alertes envoyés aux bonnes personnes." }] }],
        ["feat:alt", { title: "Un exemple concret", items: [{ t: "Direction commerciale", x: "Le pipeline, la marge par client et les prévisions sur une seule page.", link: ["Cas d'usage", "/cas-d-usage"] }, { t: "Direction industrielle", x: "Taux de rebut, arrêts de ligne et coûts matières suivis chaque heure." }] }],
        ["proof:big", { items: [{ q: "Le comité de direction commence enfin par les mêmes chiffres.", n: "Directrice financière", r: "cliente fictive" }] }],
        ["cta:split", { title: "Voyez vos propres données dans Azimut.", sub: "Atelier d'une heure avec un extrait de vos fichiers.", cta: ["Demander une démo", "/contact"] }],
      ] },
      { key: "plateforme", name: "Plateforme", blocks: [
        ["misc:pagehead", { title: "La plateforme", sub: "Quatre briques qui s'emboîtent." }],
        ["feat:tabs", { title: "Ce que contient Azimut", items: [{ t: "Connecteurs", x: "Bases SQL, fichiers, API et outils métier, synchronisés à la fréquence de votre choix." }, { t: "Qualité", x: "Contrôles automatiques et journal des anomalies." }, { t: "Tableaux de bord", x: "Éditeur par blocs, filtres partagés, export PDF." }, { t: "Alertes", x: "Seuils et écarts signalés par e-mail ou messagerie." }] }],
        ["feat:grid-icons", { title: "Pour toute l'entreprise", items: [{ icon: "barChart", t: "Graphiques" , x: "Courbes, barres, cartes." }, { icon: "sliders", t: "Filtres", x: "Période, équipe, région." }, { icon: "lock", t: "Droits", x: "Lignes et colonnes protégées." }, { icon: "download", t: "Exports", x: "CSV, PDF, images." }] }],
        ["cta:band", { title: "Une question sur vos sources de données ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "cas-d-usage", name: "Cas d'usage", blocks: [
        ["misc:pagehead", { title: "Cas d'usage", sub: "Des équipes, des questions, des réponses." }],
        ["gal:cards", { items: [{ t: "Prévision des ventes", tag: "Commerce", x: "Un réseau de magasins anticipe ses réassorts." }, { t: "Suivi de production", tag: "Industrie", x: "Rebuts et arrêts analysés à l'heure." }, { t: "Pilotage budgétaire", tag: "Finance", x: "Réalisé et prévisionnel côte à côte." }] }],
        ["feat:steps", { title: "Un projet type", items: [{ t: "Cadrage", d: "Semaine 1", x: "Questions à résoudre." }, { t: "Branchement", d: "Semaine 2", x: "Sources connectées." }, { t: "Premier tableau", d: "Semaine 3", x: "Validé avec les métiers." }] }],
        ["misc:posts", { title: "Retours d'expérience", count: 3, layout: "list" }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Exemples de montants, hors taxes." }],
        ["price:tiers", { items: [{ t: "Atelier", price: "290 €", period: "/mois", x: "Jusqu'à 10 utilisateurs.", f: ["10 connecteurs", "Tableaux illimités"], cta: "Demander une démo", url: "/contact" }, { t: "Entreprise", price: "1 150 €", period: "/mois", x: "Jusqu'à 100 utilisateurs.", f: ["Tous les connecteurs", "Alertes et droits fins", "Accompagnement"], cta: "Demander une démo", url: "/contact", hl: true }, { t: "Groupe", price: "Sur devis", f: ["Utilisateurs illimités", "Hébergement dédié"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Mes données quittent-elles mon entreprise ?", x: "Vous choisissez : hébergement européen géré par nous ou installation chez vous." }, { t: "Combien de temps pour démarrer ?", x: "Un premier tableau en quelques jours, un déploiement complet en six semaines environ." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:map", { title: "Nous rencontrer", mapAddress: "6 place Stanislas, 54000 Nancy" }],
        ["cta:card", { title: "Préférez-vous une démonstration à distance ?", cta: ["Choisir un créneau", "/contact"] }],
      ] },
    ],
  },

  // 7. CRM, clair, magenta
  {
    key: "fidelio-crm", name: "Fidélio", category: "tech", tags: ["chaleureux", "moderne"], siteType: "Logiciel de relation client (CRM)",
    description: "Site produit chaleureux pour un CRM de PME : magenta profond sur fond rosé, serif gras, bandeau d'information, carte encadrée, témoignages et pied de page en colonnes.",
    brand: "Fidélio",
    tokens: { colors: { primary: "#a21caf", secondary: "#3b0d44", accent: "#f59e0b", background: "#fdf8fe", surface: "#f6e9f8", text: "#2b1030", muted: "#6a4f6e" }, fonts: { heading: "font.young-serif", body: "font.titillium-web", button: "font.titillium-web", link: "font.titillium-web" }, radius: { sm: 8, md: 14, lg: 24, button: 14, field: 12, card: 22 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 54, weight: 400, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "fidelio", motifs: ["botanical", "objects", "blobs"] },
    head: ["head:topbar", { info: "Essai gratuit 30 jours, sans carte bancaire", note: "Assistance en français" }], foot: ["foot:columns", { about: "Fidélio, le CRM qui n'oublie aucun client : contacts, relances et ventes réunis pour les PME.", cols: [["Produit", "Fonctions", "Tarifs", "Témoignages"], ["Entreprise", "Ressources", "Contact"]] }],
    menu: [["Accueil", "/"], ["Fonctions", "/fonctions"], ["Tarifs", "/tarifs"], ["Témoignages", "/temoignages"], ["Contact", "/contact"]], cta: ["Essai gratuit", "/contact"],
    contact: { address: "18 cours Julien, 13006 Marseille", phone: "04 91 00 96 07", email: "bonjour@fidelio-crm.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Chaque client mérite un suivi." },
    social: ["linkedin", "instagram", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "CRM pour PME", title: "Ne laissez plus un client sans réponse.", sub: "Fidélio rassemble vos contacts, vos échanges et vos opportunités, et vous rappelle qui relancer aujourd'hui.", cta: ["Essai gratuit", "/contact"], cta2: ["Voir les fonctions", "/fonctions"], image: "hero" }],
        ["feat:cards", { eyebrow: "Au quotidien", title: "L'essentiel, sans usine à gaz", items: [{ icon: "users", t: "Fiches clients", x: "Historique des échanges, documents et notes au même endroit." }, { icon: "bell", t: "Relances", x: "Une liste du jour : qui appeler, qui relancer." }, { icon: "trendingUp", t: "Pipeline de ventes", x: "Vos opportunités glissées d'étape en étape." }] }],
        ["proof:quotes", { title: "Elles et ils relancent mieux", items: [{ q: "Nos devis sans réponse ont chuté de moitié.", n: "Sabrina L.", r: "Gérante de menuiserie, cliente fictive" }, { q: "Fini les carnets d'adresses dans chaque poche.", n: "Antoine G.", r: "Courtier, client fictif" }, { q: "Je sais enfin pourquoi nous perdons des ventes.", n: "Farida N.", r: "Directrice commerciale, cliente fictive" }] }],
        ["feat:strips", { title: "Se connecte à ce que vous utilisez", items: [{ t: "Messagerie et agenda", x: "Les e-mails échangés rejoignent la fiche du client." }, { t: "Facturation", x: "Un devis accepté devient une facture." }, { t: "Formulaires de votre site", x: "Chaque demande crée un contact." }] }],
        ["cta:band", { title: "Commencez avec vos dix premiers clients.", sub: "30 jours d'essai gratuit.", cta: ["Essai gratuit", "/contact"] }],
      ] },
      { key: "fonctions", name: "Fonctions", blocks: [
        ["misc:pagehead", { title: "Fonctions" }],
        ["feat:bento", { title: "Tout pour suivre vos ventes", items: [{ t: "Pipeline visuel", x: "Étapes personnalisables, montants pondérés et prévisions de chiffre d'affaires mises à jour à chaque déplacement de carte." }, { t: "Séquences de relance", x: "Messages programmés, arrêtés dès la réponse." }, { t: "Tableaux de suivi", x: "Ventes par commercial et par mois." }] }],
        ["feat:list2", { title: "Et aussi", items: [{ t: "Import de contacts", x: "Depuis un tableur." }, { t: "Doublons repérés", x: "Fusion guidée." }, { t: "Application mobile", x: "Notes après un rendez-vous." }, { t: "Droits par équipe", x: "Chacun voit son portefeuille." }] }],
        ["cta:split", { title: "Voir Fidélio avec vos données", cta: ["Réserver une démo", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Par utilisateur. Montants à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Essentiel", price: "12 €", period: "/utilisateur/mois", f: ["Fiches et pipeline", "1 000 contacts"], cta: "Essayer", url: "/contact" }, { t: "Pro", price: "24 €", period: "/utilisateur/mois", f: ["Séquences de relance", "Contacts illimités", "Tableaux de suivi"], cta: "Essayer", url: "/contact", hl: true }, { t: "Sur mesure", price: "Sur devis", f: ["Champs personnalisés", "Intégration à votre ERP"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:accordion", { title: "Avant de choisir", items: [{ t: "Puis-je changer d'offre ?", x: "Oui, à tout moment, au prorata." }, { t: "Reprenez-vous mes données existantes ?", x: "Oui, nous importons vos fichiers de contacts gratuitement." }] }],
      ] },
      { key: "temoignages", name: "Témoignages", blocks: [
        ["misc:pagehead", { title: "Témoignages" }],
        ["proof:big", { items: [{ q: "Nous avons doublé le nombre de relances sans embaucher.", n: "Directeur d'agence immobilière", r: "client fictif" }] }],
        ["gal:cards", { items: [{ t: "Menuiserie, 12 salariés", tag: "Artisanat", x: "Devis relancés à J+7 automatiquement." }, { t: "Cabinet de courtage", tag: "Services", x: "Portefeuille réparti entre quatre conseillers." }, { t: "Concession de matériel agricole", tag: "Négoce", x: "Suivi des renouvellements de contrats." }] }],
        ["proof:stats", { title: "Résultats observés (exemples)", items: [["-48 %", "de devis sans réponse"], ["+22 %", "de ventes conclues"], ["5 h", "gagnées par semaine"]] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Parlons de vos clients", formTitle: "Écrivez-nous", formIntro: "Taille de l'équipe et outils actuels, nous répondons sous un jour ouvré.", cta: ["Envoyer", "/contact"] }],
        ["feat:accordion", { title: "Support", items: [{ t: "Quand répondez-vous ?", x: "Sous quatre heures ouvrées." }] }],
      ] },
    ],
  },

  // 8. Outil no-code, clair, orange vif, ludique
  {
    key: "taquet-nocode", name: "Taquet", category: "tech", tags: ["ludique", "audacieux"], siteType: "Outil no-code pour créer des applications métier",
    description: "Site ludique pour un outil no-code : orange vif sur crème, titres anguleux Syne, collage de visuels, grille d'étapes et tarifs en trois paliers.",
    brand: "Taquet",
    tokens: { colors: { primary: "#ea580c", secondary: "#2b1708", accent: "#2563eb", background: "#fffaf3", surface: "#ffeedb", text: "#2b1708", muted: "#6b5440" }, fonts: { heading: "font.syne", body: "font.red-hat-text", button: "font.syne", link: "font.red-hat-text" }, radius: { sm: 6, md: 12, lg: 20, button: 12, field: 10, card: 18 }, shadow: { card: "sm", button: "md" }, type: { h1: { size: 64, weight: 800, lineHeight: 1, letterSpacing: -0.035 } } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "soft" }, art: { seed: "taquet", motifs: ["objects", "blobs", "tiles"] },
    head: ["head:center", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Comment ça marche", "/fonctionnement"], ["Modèles", "/modeles"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Créer mon appli", "/contact"],
    contact: { address: "4 rue Sainte-Catherine, 33000 Bordeaux", phone: "05 56 00 07 18", email: "hello@taquet.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Votre idée, une appli, sans code." },
    social: ["instagram", "youtube", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Applications métier sans code", title: "Votre appli, assemblée en un week-end.", sub: "Glissez des blocs, branchez vos données et publiez : suivi de chantier, réservations, inventaire, tout se construit à la souris.", cta: ["Créer mon appli", "/contact"], cta2: ["Voir les modèles", "/modeles"] }],
        ["feat:numbered", { eyebrow: "Trois gestes", title: "Dessiner, relier, publier", items: [{ t: "Dessiner", x: "Formulaires, listes et pages par glisser-déposer." }, { t: "Relier", x: "Tableaux de données et règles en langage simple." }, { t: "Publier", x: "Une adresse web et une application installable." }] }],
        ["gal:masonry", { items: [{ t: "Suivi de chantier" }, { t: "Prise de rendez-vous" }, { t: "Inventaire de stock" }, { t: "Demandes de congés" }, { t: "Carnet de visites" }] }],
        ["proof:quotes", { title: "Construit par ceux qui l'utilisent", items: [{ q: "J'ai remplacé trois tableurs par une appli en deux soirées.", n: "Yanis B.", r: "Responsable logistique, client fictif" }, { q: "Mon équipe terrain saisit enfin ses rapports sur téléphone.", n: "Odile F.", r: "Cheffe de chantier, cliente fictive" }] }],
        ["feat:compare", { title: "Taquet ou développement sur mesure", rows: [["", "Sur mesure", "Taquet"], ["Délai", "3 à 6 mois", "quelques jours"], ["Modification", "par un développeur", "par vous"], ["Coût de départ", "élevé", "à partir de 0 €"]] }],
        ["cta:band", { title: "Une première appli gratuite.", cta: ["Créer mon appli", "/contact"] }],
      ] },
      { key: "fonctionnement", name: "Comment ça marche", blocks: [
        ["misc:pagehead", { title: "Comment ça marche" }],
        ["feat:steps", { title: "De l'idée à l'équipe", items: [{ t: "Choisir un modèle", x: "Ou partir d'une page blanche." }, { t: "Adapter", x: "Champs, couleurs, droits." }, { t: "Tester", x: "Sur votre téléphone en direct." }, { t: "Inviter", x: "Chaque personne voit son espace." }] }],
        ["feat:grid-icons", { title: "Les blocs disponibles", items: [{ icon: "list", t: "Listes", x: "Triées et filtrées." }, { icon: "fileText", t: "Formulaires", x: "Avec validation." }, { icon: "calendarClock", t: "Calendriers", x: "Disponibilités." }, { icon: "barChart", t: "Graphiques", x: "Chiffres en direct." }] }],
        ["feat:accordion", { title: "Et si je bloque ?", items: [{ t: "Y a-t-il une aide ?", x: "Des tutoriels courts et des séances d'aide en direct chaque semaine." }, { t: "Puis-je exporter mes données ?", x: "Oui, en CSV, à tout moment." }] }],
      ] },
      { key: "modeles", name: "Modèles", blocks: [
        ["misc:pagehead", { title: "Modèles prêts à l'emploi" }],
        ["gal:cards", { items: [{ t: "Suivi de chantier", tag: "Bâtiment", x: "Photos, réserves et validations." }, { t: "Réservation de salles", tag: "Bureaux", x: "Créneaux et conflits évités." }, { t: "Inventaire", tag: "Logistique", x: "Entrées, sorties, alertes de stock." }] }],
        ["feat:list2", { title: "Autres idées", items: [{ t: "Registre de visiteurs" }, { t: "Demandes d'intervention" }, { t: "Tournée de livraison" }, { t: "Note de frais" }] }],
        ["cta:split", { title: "Votre cas n'est pas listé ?", sub: "Décrivez-le, nous préparons un modèle.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Bricoleur", price: "0 €", period: "/mois", f: ["1 application", "5 utilisateurs"], cta: "Commencer", url: "/contact" }, { t: "Atelier", price: "19 €", period: "/mois", f: ["10 applications", "50 utilisateurs", "Domaine personnalisé"], cta: "Choisir", url: "/contact", hl: true }, { t: "Fabrique", price: "79 €", period: "/mois", f: ["Applications illimitées", "Droits avancés", "Sauvegardes quotidiennes"], cta: "Choisir", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Un utilisateur, c'est qui ?", x: "Toute personne qui se connecte à vos applications." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Dites-nous ce que vous voulez construire", formTitle: "Votre idée", formIntro: "Quelques lignes, nous vous orientons vers un modèle.", cta: ["Envoyer", "/contact"] }],
        ["cta:card", { title: "Ou lancez-vous tout de suite.", cta: ["Créer mon appli", "/contact"] }],
      ] },
    ],
  },

  // 9. Hébergement / cloud, sombre, ambre
  {
    key: "cairn-cloud", name: "Cairn", category: "tech", tags: ["sombre", "geometrique", "technique"], siteType: "Hébergement et cloud souverain",
    description: "Thème sombre chaud pour un hébergeur cloud : ambre sur brun noir, titres larges Unbounded, bandeau à fond secondaire, comparatif d'offres et page de statut.",
    brand: "Cairn",
    tokens: { colors: { primary: "#f59e0b", secondary: "#2a2012", accent: "#34d399", background: "#12100c", surface: "#1d1a14", text: "#f3eee4", muted: "#b2a998" }, fonts: { heading: "font.unbounded", body: "font.red-hat-display", button: "font.red-hat-display", link: "font.red-hat-display" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "lg", button: "none" }, border: { width: 1, color: "#352f22" }, type: { h1: { size: 46, weight: 600, lineHeight: 1.1, letterSpacing: -0.02 }, h2: { size: 30, weight: 600, lineHeight: 1.15, letterSpacing: -0.01 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "cairn", motifs: ["mountains", "plates", "rays"] },
    head: ["head:bar", {}], foot: ["foot:simple", { about: "Cairn héberge vos sites, applications et bases de données dans deux centres de données français.", cols: [["Offres", "Serveurs", "Bases de données", "Sauvegardes"], ["Aide", "Statut", "Documentation", "Contact"]] }],
    menu: [["Accueil", "/"], ["Offres", "/offres"], ["Infrastructure", "/infrastructure"], ["Statut", "/statut"], ["Contact", "/contact"]], cta: ["Déployer", "/contact"],
    contact: { address: "Parc Technologique, 59 avenue de la Gare, 59000 Lille", phone: "03 20 00 18 29", email: "support@cairn-cloud.example", hours: "Support 24 h/24 pour les offres Pro et Entreprise", tagline: "Un hébergement posé sur du solide." },
    social: ["github", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Cloud souverain en France", title: "Vos applications, hébergées sur du solide.", sub: "Serveurs virtuels, bases de données gérées et sauvegardes chiffrées, dans deux centres de données français.", cta: ["Déployer", "/contact"], cta2: ["Voir les offres", "/offres"], image: "hero" }],
        ["proof:statsbar", { items: [["99,99 %", "disponibilité 12 mois (exemple)"], ["2", "centres de données"], ["< 3 min", "déploiement d'un serveur (exemple)"]] }],
        ["feat:grid-icons", { title: "Ce qui est inclus partout", items: [{ icon: "shield", t: "Protection DDoS", x: "Filtrage permanent." }, { icon: "layers", t: "Sauvegardes", x: "Quotidiennes, chiffrées." }, { icon: "network", t: "Réseau privé", x: "Entre vos serveurs." }, { icon: "globe", t: "Données en France", x: "Droit français." }] }],
        ["feat:alt", { eyebrow: "Services gérés", title: "Moins d'administration, plus de produit", items: [{ t: "Bases de données gérées", x: "Mises à jour, réplication et restauration à un instant donné.", link: ["Voir les offres", "/offres"] }, { t: "Stockage d'objets", x: "Compatible avec les clients courants, facturé au gigaoctet." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je migrer sans interruption ?", x: "Oui : nous accompagnons une bascule progressive avec réplication des données." }, { t: "Facturez-vous le trafic sortant ?", x: "Un volume généreux est inclus ; au-delà, un tarif au gigaoctet s'applique." }] }],
        ["cta:band", { title: "Déployez votre premier serveur aujourd'hui.", sub: "20 € de crédit offerts pour tester.", cta: ["Déployer", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ["misc:pagehead", { title: "Offres", sub: "Facturation à l'heure plafonnée au mois. Montants à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Petit", price: "6 €", period: "/mois", f: ["1 vCPU, 2 Go de mémoire", "40 Go de disque"], cta: "Déployer", url: "/contact" }, { t: "Moyen", price: "24 €", period: "/mois", f: ["4 vCPU, 8 Go de mémoire", "160 Go de disque", "Sauvegardes incluses"], cta: "Déployer", url: "/contact", hl: true }, { t: "Dédié", price: "Sur devis", f: ["Machines réservées", "Support 24 h/24"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:compare", { title: "Comparer", rows: [["", "Petit", "Moyen", "Dédié"], ["Sauvegardes", "option", "incluses", "incluses"], ["Support", "e-mail", "e-mail", "24 h/24"], ["Réseau privé", "non", "oui", "oui"]] }],
        ["feat:pricelist", { title: "Services complémentaires", items: [{ t: "Base de données gérée", x: "Par mois", price: "dès 15 €" }, { t: "Stockage d'objets", x: "Par Go et par mois", price: "0,01 €" }, { t: "Adresse IP supplémentaire", x: "Par mois", price: "2 €" }] }],
      ] },
      { key: "infrastructure", name: "Infrastructure", blocks: [
        ["misc:pagehead", { title: "Infrastructure" }],
        ["feat:rows", { title: "Sous le capot", items: [{ t: "Deux sites distants", x: "Lille et Marseille, reliés par un réseau dédié." }, { t: "Énergie", x: "Électricité d'origine renouvelable, refroidissement optimisé." }, { t: "Sécurité physique", x: "Accès contrôlé et surveillance continue." }] }],
        ["feat:steps", { title: "Notre plan de reprise", items: [{ t: "Détection", d: "Immédiate", x: "Alertes automatiques." }, { t: "Bascule", d: "< 15 min", x: "Vers le site secondaire." }, { t: "Retour", x: "Après vérification complète." }] }],
        ["cta:split", { title: "Une question d'architecture ?", sub: "Un ingénieur vous répond.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "statut", name: "Statut", blocks: [
        ["misc:pagehead", { title: "Statut du service", sub: "État des plateformes (exemple de démonstration)." }],
        ["misc:hours", { title: "Disponibilité actuelle", rows: [["Serveurs virtuels", "Opérationnel"], ["Bases de données", "Opérationnel"], ["Stockage d'objets", "Opérationnel"], ["Console d'administration", "Opérationnel"]] }],
        ["misc:posts", { title: "Historique des incidents", count: 4, layout: "list" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Parler à un ingénieur", formTitle: "Votre projet", formIntro: "Décrivez votre application et sa charge attendue.", cta: ["Envoyer", "/contact"] }],
        ["feat:icons", { title: "Autres canaux", items: [{ icon: "activity", t: "Statut", x: "Incidents en cours." }, { icon: "fileText", t: "Documentation", x: "Guides pas à pas." }] }],
      ] },
    ],
  },

  // 10. Logiciel RH, clair, rose framboise, serif d'affichage
  {
    key: "equipage-rh", name: "Équipage", category: "tech", tags: ["chaleureux", "editorial"], siteType: "Logiciel de ressources humaines",
    description: "Site produit chaleureux pour un logiciel RH : framboise sur fond rose pâle, serif d'affichage Gloock, portrait à gauche, module par module et équipe de conseillers.",
    brand: "Équipage",
    tokens: { colors: { primary: "#be185d", secondary: "#3a0f24", accent: "#0d9488", background: "#fff8fb", surface: "#fde8f1", text: "#3a0f24", muted: "#6e4a5c" }, fonts: { heading: "font.gloock", body: "font.plus-jakarta-sans", button: "font.plus-jakarta-sans", link: "font.plus-jakarta-sans" }, radius: { sm: 6, md: 12, lg: 18, button: 10, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.06, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "soft" }, art: { seed: "equipage", motifs: ["arches", "bokeh", "botanical"] },
    head: ["head:masthead", { dateline: "Logiciel RH pour PME et associations" }], foot: ["foot:center", { about: "Équipage simplifie la paie, les congés et les entretiens des équipes de 10 à 500 personnes." }],
    menu: [["Accueil", "/"], ["Modules", "/modules"], ["Tarifs", "/tarifs"], ["Équipe", "/equipe"], ["Contact", "/contact"]], cta: ["Demander une démo", "/contact"],
    contact: { address: "11 rue des Tanneurs, 35000 Rennes", phone: "02 99 00 29 30", email: "rh@equipage.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Prendre soin de ceux qui font l'équipe." },
    social: ["linkedin", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Congés, entretiens, recrutement", title: "Les RH au service des équipes, pas l'inverse.", sub: "Équipage réunit l'administration du personnel et la vie d'équipe dans un outil que chacun ouvre volontiers.", cta: ["Demander une démo", "/contact"], cta2: ["Voir les modules", "/modules"] }],
        ["feat:rows", { eyebrow: "Modules", title: "Choisissez ce dont vous avez besoin", items: [{ t: "Congés et absences", x: "Demande, validation et planning d'équipe en deux clics." }, { t: "Entretiens et objectifs", x: "Trames d'entretien, historique et rappels aux managers." }, { t: "Recrutement", x: "Offres, candidatures et grille d'évaluation partagée." }, { t: "Dossier du salarié", x: "Contrats, attestations et documents signés, droits maîtrisés." }] }],
        ["proof:big", { items: [{ q: "Les demandes de congés ne passent plus par trois boîtes mail.", n: "Responsable RH", r: "cliente fictive" }] }],
        ["proof:stats", { title: "L'effet Équipage (exemples)", items: [["6 h", "gagnées par mois et par gestionnaire"], ["92 %", "de managers qui conduisent leurs entretiens"], ["2 jours", "pour un déploiement type"]] }],
        ["feat:checks", { title: "Pensé pour la conformité", items: [{ t: "Données hébergées dans l'Union européenne" }, { t: "Droits d'accès par fonction" }, { t: "Registre des demandes d'accès" }, { t: "Export de paie vers votre cabinet" }], cta: ["Parler conformité", "/contact"] }],
        ["cta:card", { title: "Voir Équipage avec votre organisation.", sub: "Démonstration personnalisée de 30 minutes.", cta: ["Demander une démo", "/contact"] }],
      ] },
      { key: "modules", name: "Modules", blocks: [
        ["misc:pagehead", { title: "Les modules" }],
        ["feat:tabs", { title: "Un outil, quatre usages", items: [{ t: "Congés", x: "Soldes calculés selon vos règles, validations en cascade, calendrier d'équipe." }, { t: "Entretiens", x: "Campagnes annuelles, entretiens professionnels et suivi des formations." }, { t: "Recrutement", x: "Diffusion d'offres, pipeline de candidatures, comptes rendus." }, { t: "Documents", x: "Coffre numérique, signature électronique et modèles." }] }],
        ["feat:alt", { title: "Côté salarié", items: [{ t: "Une application mobile", x: "Demander un congé, consulter ses documents, répondre à un sondage." }, { t: "Un fil d'équipe", x: "Annonces, anniversaires et nouveaux arrivants." }] }],
        ["cta:band", { title: "Besoin d'un module sur mesure ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Par salarié et par mois. Exemples de montants." }],
        ["price:tiers", { items: [{ t: "Base", price: "3 €", period: "/salarié/mois", f: ["Congés et absences", "Dossier du salarié"], cta: "Demander une démo", url: "/contact" }, { t: "Complet", price: "6 €", period: "/salarié/mois", f: ["Entretiens et objectifs", "Recrutement", "Application mobile"], cta: "Demander une démo", url: "/contact", hl: true }] }],
        ["feat:compare", { title: "Modules par offre", rows: [["", "Base", "Complet"], ["Congés", "oui", "oui"], ["Entretiens", "non", "oui"], ["Recrutement", "non", "oui"]] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Minimum de salariés ?", x: "Facturation minimale pour 10 salariés." }, { t: "Reprise de nos données ?", x: "Oui, nous importons vos tableurs de suivi." }] }],
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        ["misc:pagehead", { title: "Qui vous accompagne" }],
        ["proof:team", { title: "Vos conseillers", items: [{ n: "Conseillère de déploiement", r: "Paramétrage et formation" }, { n: "Juriste social", r: "Règles de congés et conventions" }, { n: "Responsable du support", r: "Réponse sous quatre heures" }] }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Née dans un service RH", paras: ["Équipage est né du constat d'une responsable RH de PME qui passait ses lundis à ressaisir des demandes de congés.", "Nous construisons l'outil avec des équipes de terrain : chaque module est testé auprès de gestionnaires avant sa sortie."] }],
        ["misc:posts", { title: "Le journal RH", count: 3, layout: "grid" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:map", { title: "Nous rencontrer", mapAddress: "11 rue des Tanneurs, 35000 Rennes" }],
        ["misc:hours", { title: "Disponibilité", rows: [["Support", "Lun – ven, 9 h – 18 h"], ["Démonstrations", "Sur rendez-vous"]] }],
      ] },
    ],
  },

  // 11. Visioconférence, clair, violet, poster
  {
    key: "veranda-visio", name: "Véranda", category: "tech", tags: ["geometrique", "moderne", "audacieux"], siteType: "Plateforme de visioconférence et webinaires",
    description: "Site affiche pour une plateforme de visioconférence : violet électrique, titre géant en capitales sur bandeau plein, mur de captures, chiffres et tarifs par salle.",
    brand: "Véranda",
    tokens: { colors: { primary: "#6d28d9", secondary: "#1f1240", accent: "#f43f5e", background: "#f8f6ff", surface: "#ece7fb", text: "#1f1240", muted: "#54487a" }, fonts: { heading: "font.lexend", body: "font.mulish", button: "font.lexend", link: "font.mulish" }, radius: { sm: 10, md: 16, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "md" }, type: { h1: { size: 60, weight: 800, lineHeight: 1, letterSpacing: -0.03, transform: "uppercase" } } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "pill" }, art: { seed: "veranda", motifs: ["rays", "bokeh", "ribbons"] },
    head: ["head:float", {}], foot: ["foot:big", { title: "Véranda", about: "Réunions, webinaires et salles d'équipe en visioconférence." }],
    menu: [["Accueil", "/"], ["Fonctions", "/fonctions"], ["Webinaires", "/webinaires"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Ouvrir une salle", "/contact"],
    contact: { address: "2 allée de la Pépinière, 21000 Dijon", phone: "03 80 00 30 41", email: "salle@veranda-visio.example", hours: "Support du lundi au samedi, 8 h – 20 h", tagline: "Se voir, se comprendre, avancer." },
    social: ["youtube", "linkedin", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Visioconférence et webinaires", title: "Réunissez-vous, vraiment.", sub: "Une image nette, un son clair et des salles qui s'ouvrent d'un lien, sans installation ni compte pour vos invités.", cta: ["Ouvrir une salle", "/contact"], cta2: ["Voir les fonctions", "/fonctions"] }],
        ["gal:wall", { items: [{ t: "Salle d'équipe" }, { t: "Webinaire" }, { t: "Consultation à distance" }, { t: "Atelier" }] }],
        ["feat:icons", { title: "Ce qui change dans vos réunions", items: [{ icon: "video", t: "Vidéo nette", x: "S'adapte à la connexion de chacun." }, { icon: "users", t: "Salles persistantes", x: "Une adresse fixe par équipe." }, { icon: "fileText", t: "Compte rendu", x: "Notes et décisions à la fin de la réunion." }] }],
        ["proof:statsbar", { items: [["500", "participants par salle (exemple)"], ["< 1 s", "latence moyenne (exemple)"], ["0", "installation requise"]] }],
        ["proof:quotes", { title: "Elles se retrouvent sur Véranda", items: [{ q: "Mes consultations à distance se passent sans un appel pour l'aide technique.", n: "Dr Léna O.", r: "Praticienne, cliente fictive" }, { q: "Le webinaire mensuel a triplé son audience.", n: "Marc E.", r: "Responsable communication, client fictif" }] }],
        ["cta:image", { title: "Votre salle est prête.", sub: "Ouvrez-la en dix secondes.", cta: ["Ouvrir une salle", "/contact"] }],
      ] },
      { key: "fonctions", name: "Fonctions", blocks: [
        ["misc:pagehead", { title: "Fonctions" }],
        ["feat:bento", { title: "Pour toutes les réunions", items: [{ t: "Salles d'attente et verrouillage", x: "Admettez chaque invité, verrouillez la salle, nommez des co-animateurs et limitez le partage d'écran." }, { t: "Enregistrement", x: "Stocké en Europe, partagé par lien." }, { t: "Sous-titres", x: "Transcription en direct." }] }],
        ["feat:list2", { title: "Et aussi", items: [{ t: "Tableau blanc partagé" }, { t: "Salles de sous-groupes" }, { t: "Sondages en direct" }, { t: "Arrière-plans flous" }] }],
        ["feat:accordion", { title: "Questions techniques", items: [{ t: "Quelle bande passante faut-il ?", x: "Environ 2 Mbit/s par participant en vidéo standard ; l'image s'adapte automatiquement." }, { t: "Fonctionne-t-elle sur mobile ?", x: "Oui, dans le navigateur et par application." }] }],
      ] },
      { key: "webinaires", name: "Webinaires", blocks: [
        ["misc:pagehead", { title: "Webinaires", sub: "Diffusez devant des centaines de personnes." }],
        ["misc:schedule", { title: "Un webinaire type", items: [{ d: "J-7", t: "Page d'inscription", x: "Formulaire et rappels automatiques." }, { d: "Jour J, 18 h", t: "Diffusion", x: "Questions modérées en direct." }, { d: "J+1", t: "Rediffusion", x: "Enregistrement envoyé aux inscrits." }] }],
        ["feat:alt", { title: "Pensé pour l'animation", items: [{ t: "Régie pour l'animateur", x: "Gestion des intervenants et des questions." }, { t: "Statistiques d'audience", x: "Présence, durée et questions posées." }] }],
        ["cta:band", { title: "Organisez votre premier webinaire.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Par hôte et par mois, montants d'exemple." }],
        ["price:tiers", { items: [{ t: "Gratuit", price: "0 €", f: ["40 minutes par réunion", "8 participants"], cta: "Commencer", url: "/contact" }, { t: "Pro", price: "11 €", period: "/hôte/mois", f: ["Réunions illimitées", "100 participants", "Enregistrement"], cta: "Choisir Pro", url: "/contact", hl: true }, { t: "Webinaire", price: "39 €", period: "/hôte/mois", f: ["500 participants", "Inscriptions et statistiques"], cta: "Choisir", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Les invités ont-ils besoin d'un compte ?", x: "Non, un simple lien suffit." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Une question ?", formTitle: "Écrivez-nous", formIntro: "Nous répondons du lundi au samedi.", cta: ["Envoyer", "/contact"] }],
        ["cta:card", { title: "Ou ouvrez une salle de test.", cta: ["Ouvrir une salle", "/contact"] }],
      ] },
    ],
  },
];
