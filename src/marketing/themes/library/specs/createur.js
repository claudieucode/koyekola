// Sites personnels et créateurs de contenu (4 thèmes). Textes de DÉMONSTRATION : personnes, marques et coordonnées fictives.
module.exports = [
  // 1. Youtubeur
  {
    key: "potager-pixel", name: "Potager Pixel", category: "createur", tags: ["ludique", "naturel"], siteType: "Chaîne vidéo de jardinage",
    description: "Site de youtubeur jardinier : vert vif et jaune soleil, titres arrondis, carrousel de vidéos, chiffres de la chaîne et offres de partenariat.",
    brand: "Potager Pixel",
    tokens: { colors: { primary: "#1f7a3d", secondary: "#143d24", accent: "#f7c52b", background: "#f6faf2", surface: "#ffffff", text: "#1a2a1d", muted: "#4f6354" }, fonts: { heading: "font.baloo-2", body: "font.poppins", button: "font.baloo-2", link: "font.poppins" }, radius: { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 18 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 800, lineHeight: 1.05, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "potager", motifs: ["botanical", "blobs", "dunes"] },
    head: ["head:bar", {}], foot: ["foot:newsletter", { title: "La lettre du potager", sub: "Un conseil de saison et la vidéo du mois, chaque premier dimanche.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Vidéos", "/videos"], ["À propos", "/a-propos"], ["Partenariats", "/partenariats"], ["Contact", "/contact"]], cta: ["S'abonner", "/contact"],
    contact: { address: "Studio et jardin, Lot-et-Garonne", phone: "05 53 70 41 29", email: "salut@potagerpixel.example", hours: "Nouvelle vidéo chaque jeudi à 18 h", tagline: "Jardiner simplement, une vidéo à la fois." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Chaîne de jardinage", title: "Cultivez un potager, même sans expérience.", sub: "Des vidéos pas à pas, filmées dans un vrai jardin de 400 m², chaque jeudi.", cta: ["Voir les vidéos", "/videos"], cta2: ["Me contacter", "/contact"], stats: [["120 000", "abonnés (exemple)"], ["210", "vidéos"], ["6 ans", "de jardin filmé"]] }],
        ["gal:carousel", { title: "Dernières vidéos", items: [{ t: "Semer ses tomates en mars", x: "12 min · pas à pas" }, { t: "Le paillage qui change tout", x: "9 min · astuces" }, { t: "Fabriquer un composteur", x: "14 min · bricolage" }] }],
        ["feat:icons", { title: "Au programme", items: [{ icon: "sun", t: "Calendrier du mois", x: "Semis, plantations et récoltes à venir." }, { icon: "book", t: "Fiches à imprimer", x: "Un PDF par légume." }, { icon: "users", t: "Communauté", x: "Questions chaque dimanche en direct." }] }],
        ["proof:statsbar", { items: [["1,4 M", "de vues par mois (exemple)"], ["38 %", "d'abonnés actifs (exemple)"], ["4", "jardins partenaires"]] }],
        ["proof:quotes", { title: "Vos messages", items: [{ q: "J'ai récolté mes premières courgettes grâce à vous.", n: "Pierre D.", r: "Spectateur fictif" }, { q: "Enfin des conseils concrets et sans jargon.", n: "Amélie L.", r: "Spectatrice fictive" }, { q: "Mes enfants regardent chaque épisode.", n: "Nadège C.", r: "Spectatrice fictive" }] }],
        ["cta:card", { title: "Rejoignez le potager", sub: "Une vidéo, un conseil de saison, une bonne humeur.", cta: ["Me contacter", "/contact"] }],
      ] },
      { key: "videos", name: "Vidéos", blocks: [
        ["misc:pagehead", { title: "Toutes les vidéos" }],
        ["gal:cards", { items: [{ t: "Semer ses tomates en mars", tag: "Semis", x: "Température, terreau, arrosage." }, { t: "Le paillage qui change tout", tag: "Entretien", x: "Moins d'eau, moins de mauvaises herbes." }, { t: "Fabriquer un composteur", tag: "Bricolage", x: "Palettes et visserie." }, { t: "Associer ses légumes", tag: "Planification", x: "Carottes, oignons, poireaux." }] }],
        ["feat:list2", { title: "Les rubriques", items: [{ t: "Semis et plantations" }, { t: "Compost et sol" }, { t: "Arrosage économe" }, { t: "Récoltes et conserves" }] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "À propos" }],
        ["misc:story", { eyebrow: "Qui est derrière l'écran", title: "Un ancien citadin devenu jardinier", paras: ["Après dix ans en agence, j'ai pris un jardin à rénover. J'ai filmé mes erreurs pour que vous n'ayez pas à les refaire.", "Aujourd'hui, la chaîne est un petit studio de trois personnes."], image: "portrait-1" }],
        ["feat:steps", { title: "L'aventure", items: [{ d: "2019", t: "Première vidéo", x: "Un tuto semis, 300 vues." }, { d: "2021", t: "10 000 abonnés", x: "Le paillage devient viral." }, { d: "2024", t: "Studio", x: "Une équipe de trois." }] }],
      ] },
      { key: "partenariats", name: "Partenariats", blocks: [
        ["misc:pagehead", { title: "Partenariats", sub: "Marques de jardinage, outils et semences." }],
        ["price:tiers", { items: [{ t: "Mention", price: "800 €", period: "par vidéo", f: ["Mention de 20 secondes", "Lien en description"], cta: "Demander un devis", url: "/contact" }, { t: "Intégration", price: "2 400 €", period: "par vidéo", f: ["Produit utilisé dans l'épisode", "Post sur les réseaux"], cta: "Demander un devis", url: "/contact", hl: true }, { t: "Série", price: "sur devis", f: ["Quatre vidéos", "Contenu pour vos réseaux"], cta: "Demander un devis", url: "/contact" }] }],
        ["misc:faq", { items: [{ t: "Acceptez-vous tous les produits ?", x: "Seulement ceux que j'utiliserais dans mon jardin." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Une question de jardinage ?", cta: ["Envoyer", "/contact"] }],
        ["cta:band", { title: "Merci pour les messages !", sub: "Je réponds à chaque question lors du direct mensuel.", cta: ["Voir les vidéos", "/videos"] }],
      ] },
    ],
  },
  // 2. Podcasteur
  {
    key: "minuit-decale", name: "Minuit Décalé", category: "createur", tags: ["sombre", "editorial"], siteType: "Podcast culturel",
    description: "Site de podcast nocturne : fond aubergine, titres géométriques, épisodes en bandes, programme de diffusion et lettre d'information.",
    brand: "Minuit Décalé",
    tokens: { colors: { primary: "#8b5cf6", secondary: "#0e0a1d", accent: "#fbbf24", background: "#120d24", surface: "#1b1433", text: "#f1ecff", muted: "#b8aed6" }, fonts: { heading: "font.syne", body: "font.ibm-plex-sans", button: "font.syne", link: "font.ibm-plex-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 64, weight: 700, lineHeight: 1.02, letterSpacing: -0.03 }, h2: { size: 36, weight: 700, lineHeight: 1.1, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "soft" }, art: { seed: "minuit", motifs: ["rays", "mesh", "bokeh"] },
    head: ["head:minimal", {}], foot: ["foot:big", { title: "Minuit Décalé" }],
    menu: [["Accueil", "/"], ["Épisodes", "/episodes"], ["Invités", "/invites"], ["À propos", "/a-propos"], ["Contact", "/contact"]], cta: ["Écouter", "/episodes"],
    contact: { address: "Studio Les Ondes, 42 rue des Récollets, 75010 Paris", phone: "01 40 18 77 20", email: "ecoute@minuitdecale.example", hours: "Un épisode chaque mardi à minuit", tagline: "Des conversations de nuit, sans montre." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Podcast · un épisode chaque mardi", title: "Des conversations qui commencent après minuit.", sub: "Un invité, un micro, et le temps de répondre vraiment. Épisodes de 50 minutes.", cta: ["Écouter le dernier épisode", "/episodes"], cta2: ["Voir les invités", "/invites"] }],
        ["feat:strips", { eyebrow: "À l'écoute", title: "Derniers épisodes", items: [{ t: "#84 · Veiller la nuit", x: "Une infirmière de nuit raconte les heures creuses. 52 min." }, { t: "#83 · Le dernier métro", x: "Un conducteur, une ville silencieuse. 47 min." }, { t: "#82 · Recettes d'insomnie", x: "Une boulangère qui travaille quand tout dort. 55 min." }] }],
        ["proof:stats", { items: [["84", "épisodes"], ["38 000", "écoutes par mois (exemple)"], ["4,8", "note moyenne (exemple)"]] }],
        ["misc:schedule", { title: "Le rituel de la semaine", items: [{ d: "Lundi", t: "Enregistrement", x: "Au studio, en public sur invitation." }, { d: "Mardi minuit", t: "Mise en ligne", x: "Sur toutes les plateformes." }, { d: "Dimanche", t: "Lettre", x: "Coulisses et recommandations." }] }],
        ["proof:quotes", { items: [{ q: "Le seul podcast que j'écoute pour m'endormir et me réveiller plus curieux.", n: "Samir B.", r: "Auditeur fictif" }, { q: "Les silences sont aussi beaux que les mots.", n: "Clara N.", r: "Auditrice fictive" }, { q: "On se sent invité à la table.", n: "Lucas H.", r: "Auditeur fictif" }] }],
        ["cta:image", { title: "Recevez l'épisode avant tout le monde", sub: "Une lettre le dimanche soir, jamais plus.", cta: ["S'inscrire à la lettre", "/contact"] }],
      ] },
      { key: "episodes", name: "Épisodes", blocks: [
        ["misc:pagehead", { title: "Épisodes" }],
        ["feat:rows", { items: [{ t: "#84 · Veiller la nuit", x: "Une infirmière de nuit raconte les heures creuses." }, { t: "#83 · Le dernier métro", x: "Un conducteur et une ville silencieuse." }, { t: "#82 · Recettes d'insomnie", x: "Une boulangère qui travaille quand tout dort." }, { t: "#81 · Radio fantôme", x: "Souvenirs d'un animateur de nuit." }] }],
        ["misc:posts", { title: "Notes d'épisodes", count: 4, layout: "list" }],
      ] },
      { key: "invites", name: "Invités", blocks: [
        ["misc:pagehead", { title: "Invités" }],
        ["proof:team", { items: [{ n: "Marion Delaporte", r: "Infirmière de nuit" }, { n: "Hugo Vasseur", r: "Conducteur de métro" }, { n: "Soraya Benali", r: "Boulangère" }, { n: "Étienne Roux", r: "Ancien animateur radio" }] }],
        ["cta:split", { title: "Une histoire à raconter ?", sub: "Écrivez-nous quelques lignes.", cta: ["Proposer un sujet", "/contact"] }],
      ] },
      { key: "a-propos", name: "À propos", blocks: [
        ["misc:pagehead", { title: "À propos" }],
        ["misc:story", { eyebrow: "Le projet", title: "Nés d'une insomnie", paras: ["Minuit Décalé est né d'une nuit blanche et d'un micro posé sur une table de cuisine. Aujourd'hui, une équipe de quatre personnes l'enregistre en studio.", "Nous prenons le temps : pas de jingle tonitruant, pas de pause pub."], image: "portrait-1" }],
        ["feat:numbered", { items: [{ t: "Écoute", x: "Une question à la fois." }, { t: "Lenteur", x: "Des épisodes qui respirent." }, { t: "Respect", x: "Aucune parole sans l'accord de l'invité." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Écrivez-nous" }],
        ["misc:faq", { items: [{ t: "Où écouter ?", x: "Sur toutes les plateformes d'écoute habituelles." }, { t: "Peut-on venir en studio ?", x: "Oui, sur invitation, lors d'un enregistrement public." }] }],
      ] },
    ],
  },
  // 3. Développeur freelance
  {
    key: "octet-libre", name: "Octet Libre", category: "createur", tags: ["technique", "sombre"], siteType: "Développeur freelance",
    description: "Portfolio de développeur freelance : fond encre bleutée, accents cyan, titres futuristes, services en bento, projets et grille tarifaire.",
    brand: "Octet Libre",
    tokens: { colors: { primary: "#0c88a6", secondary: "#050914", accent: "#a3e635", background: "#0b1020", surface: "#131a30", text: "#e7edff", muted: "#a6b1d1" }, fonts: { heading: "font.orbitron", body: "font.ibm-plex-sans", button: "font.ibm-plex-sans", link: "font.ibm-plex-sans" }, radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 8 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 46, weight: 700, lineHeight: 1.1, letterSpacing: 0.01 }, h2: { size: 28, weight: 700, lineHeight: 1.2, letterSpacing: 0.02 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "octet", motifs: ["tiles", "mesh", "topo"] },
    head: ["head:dark", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Projets", "/projets"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Parler d'un projet", "/contact"],
    contact: { address: "Remote, base à Toulouse", phone: "05 61 32 90 14", email: "bonjour@octetlibre.example", hours: "Du lundi au vendredi, réponse sous 24 h", tagline: "Développeur web full-stack indépendant." },
    social: ["linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Développeur full-stack freelance", title: "Des applications web rapides, maintenables.", sub: "Je conçois et livre des produits web de A à Z : API, interface, déploiement et suivi.", cta: ["Parler d'un projet", "/contact"], cta2: ["Voir les projets", "/projets"], angle: 135, stats: [["9 ans", "d'expérience"], ["42", "projets livrés (exemple)"], ["98", "score Lighthouse moyen (exemple)"]] }],
        ["proof:logos", { title: "Ils m'ont fait confiance (clients fictifs)", items: ["Kéraunos", "Flux & Co", "Maison Pivoine", "Nordique", "Lumen"] }],
        ["feat:bento", { eyebrow: "Services", title: "Ce que je livre", items: [{ t: "Applications web", x: "Interface, API et base de données, testées et documentées." }, { t: "Refonte et performance", x: "Audit, optimisation et accessibilité." }, { t: "Automatisations", x: "Scripts et intégrations sur mesure." }] }],
        ["feat:tabs", { title: "Stack", items: [{ t: "Front", x: "TypeScript, React, accessibilité, design systems." }, { t: "Back", x: "Node.js, PostgreSQL, files de tâches." }, { t: "Infra", x: "Conteneurs, CI/CD, supervision." }] }],
        ["proof:quotes", { items: [{ q: "Livré à l'heure, propre, documenté : un vrai plaisir.", n: "Julien V.", r: "Directeur produit, client fictif" }, { q: "Notre site est trois fois plus rapide.", n: "Sophie A.", r: "Responsable web, cliente fictive" }, { q: "Un interlocuteur clair et réactif.", n: "Marc T.", r: "Fondateur, client fictif" }] }],
        ["cta:band", { title: "Un projet à lancer ?", sub: "Réponse sous 24 heures, devis gratuit.", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ["misc:pagehead", { title: "Services" }],
        ["feat:rows", { items: [{ t: "MVP en 6 semaines", x: "Cadrage, maquette, développement et mise en ligne d'une première version." }, { t: "Refonte et dette technique", x: "Migration progressive, tests et mise à niveau des dépendances." }, { t: "Performance et accessibilité", x: "Audit chiffré et corrections priorisées." }, { t: "Maintenance", x: "Forfait mensuel de support et de veille." }] }],
        ["feat:steps", { title: "Une mission type", items: [{ t: "Cadrage", x: "Atelier de 2 heures." }, { t: "Prototype", x: "Maquette interactive." }, { t: "Développement", x: "Sprints d'une semaine." }, { t: "Livraison", x: "Formation et documentation." }] }],
      ] },
      { key: "projets", name: "Projets", blocks: [
        ["misc:pagehead", { title: "Projets", sub: "Études de cas fictives présentées en exemple." }],
        ["gal:cards", { items: [{ t: "Plateforme de réservation", tag: "Web app", x: "Back-office et tunnel de réservation." }, { t: "Tableau de bord logistique", tag: "Data", x: "Suivi en temps réel de 300 tournées." }, { t: "Refonte d'un site média", tag: "Performance", x: "Chargement divisé par trois." }] }],
        ["proof:stats", { items: [["-62 %", "temps de chargement"], ["+18 %", "conversions"], ["0", "régression à la livraison"]] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Montants indicatifs de démonstration." }],
        ["price:tiers", { items: [{ t: "Audit", price: "1 200 €", period: "forfait", f: ["Revue de code", "Rapport chiffré"], cta: "Demander", url: "/contact" }, { t: "Projet", price: "650 €", period: "par jour", f: ["Développement complet", "Tests et documentation"], cta: "Demander", url: "/contact", hl: true }, { t: "Maintenance", price: "480 €", period: "par mois", f: ["Support par e-mail", "Mises à jour"], cta: "Demander", url: "/contact" }] }],
        ["misc:faq", { items: [{ t: "Travaillez-vous seul ?", x: "Oui, avec un réseau de confrères pour le design et la sécurité." }, { t: "Comment facturez-vous ?", x: "30 % à la commande, solde à la livraison (exemple)." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Parlons de votre projet", cta: ["Envoyer", "/contact"] }],
        ["cta:card", { title: "Disponible dès le mois prochain", sub: "Deux créneaux de mission restent ouverts.", cta: ["Réserver un échange", "/contact"] }],
      ] },
    ],
  },
  // 4. Coach
  {
    key: "cap-lent", name: "Cap Lent", category: "createur", tags: ["chaleureux", "naturel"], siteType: "Coach en reconversion",
    description: "Site de coach indépendante : sable et terracotta, bandeau texte et image, étapes d'accompagnement, programme type et tarifs de séances.",
    brand: "Cap Lent",
    tokens: { colors: { primary: "#b5532f", secondary: "#3f2a1f", accent: "#4f7f6d", background: "#faf4ea", surface: "#ffffff", text: "#2e211a", muted: "#6a5648" }, fonts: { heading: "font.lexend", body: "font.lora", button: "font.lexend", link: "font.lora" }, radius: { sm: 6, md: 10, lg: 18, button: 10, field: 10, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 48, weight: 600, lineHeight: 1.12, letterSpacing: -0.01 }, body: { size: 18 } } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "caplent", motifs: ["dunes", "waves", "botanical"] },
    head: ["head:topbar", { info: "Premier échange offert · 30 minutes en visio", note: "Séances en ligne et à Annecy" }], foot: ["foot:columns", { about: "Accompagnement individuel pour changer de métier sans se perdre.", cols: [["Accompagnement", "La méthode", "Parcours", "Tarifs"], ["Contact", "Réserver", "Questions", "Mentions"]] }],
    menu: [["Accueil", "/"], ["La méthode", "/methode"], ["Parcours", "/parcours"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Échange offert", "/contact"],
    contact: { address: "4 rue du Pâquier, 74000 Annecy", phone: "04 50 33 19 82", email: "bonjour@caplent.example", hours: "Du lundi au jeudi, 9 h – 17 h", tagline: "Changer de cap, à votre rythme." },
    social: ["linkedin", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Coaching de reconversion", title: "Changer de métier sans tout bousculer.", sub: "Un accompagnement individuel de douze semaines pour clarifier vos envies et construire un plan réaliste.", cta: ["Échange offert", "/contact"], cta2: ["La méthode", "/methode"], image: "portrait-1" }],
        ["feat:checks", { title: "Vous êtes au bon endroit si…", items: [{ t: "Vous doutez de votre métier actuel" }, { t: "Vous avez plusieurs envies sans savoir laquelle choisir" }, { t: "Vous craignez de perdre votre sécurité financière" }], cta: ["Parlons-en", "/contact"] }],
        ["feat:steps", { eyebrow: "Parcours", title: "Douze semaines, quatre étapes", items: [{ d: "Semaines 1–3", t: "Faire le point", x: "Valeurs, compétences, contraintes." }, { d: "Semaines 4–6", t: "Explorer", x: "Rencontres métiers et pistes concrètes." }, { d: "Semaines 7–9", t: "Tester", x: "Mini-expériences sur le terrain." }, { d: "Semaines 10–12", t: "Décider", x: "Plan d'action et premiers pas." }] }],
        ["proof:big", { items: [{ q: "En trois mois, j'ai quitté un poste que je ne supportais plus pour un métier qui a du sens.", n: "Marion T.", r: "ancienne cadre, cliente fictive" }] }],
        ["price:tiers", { title: "Formules", items: [{ t: "Séance unique", price: "90 €", period: "1 h 15", f: ["Un sujet précis", "Compte rendu écrit"], cta: "Réserver", url: "/contact" }, { t: "Parcours complet", price: "1 100 €", period: "12 semaines", f: ["8 séances", "Bilan de compétences maison", "Suivi par message"], cta: "Réserver", url: "/contact", hl: true }, { t: "Suivi", price: "180 €", period: "par mois", f: ["2 séances", "Relecture CV et lettres"], cta: "Réserver", url: "/contact" }] }],
        ["cta:split", { title: "Un premier échange, sans engagement", sub: "30 minutes en visio pour voir si on peut avancer ensemble.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "methode", name: "La méthode", blocks: [
        ["misc:pagehead", { title: "La méthode" }],
        ["misc:story", { eyebrow: "Ma façon de faire", title: "Aller doucement pour avancer mieux", paras: ["Je ne propose pas de formule magique : nous partons de votre réalité, de vos contraintes et de ce qui vous met en mouvement.", "Chaque séance se termine par une petite action à tester avant la suivante."], image: "portrait-1" }],
        ["feat:grid-icons", { title: "Trois principes", items: [{ icon: "heart", t: "Bienveillance", x: "Aucun jugement sur vos hésitations." }, { icon: "check", t: "Concret", x: "Des actions petites, mais réelles." }, { icon: "shield", t: "Confidentialité", x: "Tout ce qui est dit reste ici." }] }],
      ] },
      { key: "parcours", name: "Parcours", blocks: [
        ["misc:pagehead", { title: "Un parcours type" }],
        ["misc:schedule", { title: "Une séance, minute par minute", items: [{ d: "0 – 10 min", t: "Où en êtes-vous ?", x: "Retour sur la semaine." }, { d: "10 – 50 min", t: "Exercice du jour", x: "Valeurs, scénarios ou entretiens." }, { d: "50 – 75 min", t: "Plan d'action", x: "Une petite expérience à mener." }] }],
        ["proof:quotes", { items: [{ q: "Chaque semaine, j'avançais d'un pas.", n: "Thomas R.", r: "Client fictif" }, { q: "J'ai enfin osé appeler des professionnels.", n: "Camille S.", r: "Cliente fictive" }, { q: "Un cadre doux mais exigeant.", n: "Laetitia F.", r: "Cliente fictive" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et modalités", sub: "Prix indicatifs de démonstration." }],
        ["feat:pricelist", { items: [{ t: "Échange découverte", x: "30 minutes en visio", price: "Offert" }, { t: "Séance individuelle", x: "1 h 15", price: "90 €" }, { t: "Parcours 12 semaines", x: "8 séances", price: "1 100 €" }] }],
        ["misc:faq", { items: [{ t: "Séances en ligne ou en cabinet ?", x: "Les deux : visio, ou à Annecy sur rendez-vous." }, { t: "Le parcours est-il finançable ?", x: "Certaines aides peuvent s'appliquer ; renseignez-vous auprès de votre organisme." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Réservez votre échange offert", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Lundi – jeudi", "9 h – 17 h"], ["Vendredi", "Sur rendez-vous"]] }],
      ] },
    ],
  },
];
