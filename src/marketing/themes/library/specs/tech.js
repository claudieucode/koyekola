// Technologie, SaaS et startups (10 thèmes). Textes de DÉMONSTRATION : marques, personnes, tarifs et coordonnées fictifs, remplaçables dans l'éditeur.
const SOC = ["linkedin", "github", "youtube"];

module.exports = [
  // 1. Historique : API pour développeurs, sombre à fort contraste
  {
    key: "ardoise", name: "Ardoise", category: "tech", tags: ["sombre", "technique", "moderne"], siteType: "API et outils pour développeurs", featured: true,
    description: "Thème sombre à fort contraste pour une API de développeurs : fond ardoise, accent bleu ciel, bandeau centré avec chiffres, bento de fonctionnalités et documentation.",
    brand: "Ardoise API",
    tokens: { colors: { primary: "#38bdf8", secondary: "#0b1220", accent: "#fbbf24", background: "#0f172a", surface: "#1e293b", text: "#e2e8f0", muted: "#9fb0c6" }, fonts: { heading: "font.onest", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 12 }, shadow: { card: "lg", button: "none" }, border: { width: 1, color: "#334155" } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "soft" }, art: { seed: "ardoise", motifs: ["mesh", "tiles", "rays"] },
    head: ["head:bar", {}], foot: ["foot:simple", { about: "Une API HTTP claire, versionnée et documentée, pour intégrer des paiements de test, des webhooks et des événements en quelques lignes.", cols: [["Produit", "Fonctionnalités", "Tarifs", "Journal des versions"], ["Développeurs", "Documentation", "Statut du service", "Contact"]] }],
    menu: [["Accueil", "/"], ["Fonctionnalités", "/fonctionnalites"], ["Tarifs", "/tarifs"], ["Documentation", "/documentation"], ["Contact", "/contact"]], cta: ["Obtenir une clé d'API", "/contact"],
    contact: { address: "8 passage des Forges, 69002 Lyon", phone: "04 72 00 10 20", email: "dev@ardoise-api.example", hours: "Support du lundi au vendredi, 9 h – 18 h", tagline: "L'API qui se lit comme sa documentation." },
    social: SOC,
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "API REST et webhooks", title: "Intégrez en une après-midi, pas en un trimestre.", sub: "Des endpoints prévisibles, des erreurs lisibles et un bac à sable complet : branchez votre application à Ardoise avec trois appels.", cta: ["Obtenir une clé d'API", "/contact"], cta2: ["Lire la documentation", "/documentation"], stats: [["99,95 %", "disponibilité mesurée (exemple)"], ["120 ms", "latence médiane (exemple)"], ["14", "SDK officiels (exemple)"]] }],
        ["proof:logos", { title: "Utilisée par des équipes produit (clients fictifs)", items: ["Kodalis", "Prairie Labs", "Tramontane", "Ligne 9", "Opaline"] }],
        ["feat:bento", { eyebrow: "Plateforme", title: "Tout ce qu'il faut pour livrer", items: [{ t: "Bac à sable complet", x: "Un environnement de test isolé avec des données réalistes, réinitialisable d'un clic, pour valider chaque scénario avant la mise en production." }, { t: "Webhooks signés", x: "Rejouez, filtrez et vérifiez chaque événement." }, { t: "Journal des appels", x: "Chaque requête est tracée et consultable 30 jours." }] }],
        ["feat:tabs", { eyebrow: "Du premier appel à la production", title: "Votre intégration, étape par étape", items: [{ t: "Authentifier", x: "Créez une clé secrète par environnement et limitez ses droits à ce dont le service a besoin." }, { t: "Appeler", x: "Un client HTTP suffit : réponses JSON stables, pagination par curseur, idempotence native." }, { t: "Écouter", x: "Abonnez-vous aux événements via webhooks signés avec relance automatique." }, { t: "Superviser", x: "Tableaux de bord de latence et d'erreurs, alertes par e-mail ou messagerie." }] }],
        ["proof:quotes", { eyebrow: "Retours d'équipes", title: "Ce que disent les développeurs", items: [{ q: "La première intégration tenait en quatre-vingts lignes.", n: "Samir K.", r: "Ingénieur backend, client fictif" }, { q: "Les messages d'erreur disent enfin quoi corriger.", n: "Lou P.", r: "Lead développement, cliente fictive" }, { q: "Le bac à sable nous a évité deux incidents.", n: "Nils B.", r: "CTO, client fictif" }] }],
        ["cta:card", { title: "Votre clé d'API vous attend.", sub: "Création du compte en deux minutes, sans carte bancaire.", cta: ["Obtenir une clé d'API", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
      ] },
      { key: "fonctionnalites", name: "Fonctionnalités", blocks: [
        ["misc:pagehead", { title: "Fonctionnalités", sub: "Des briques simples, composables, versionnées." }],
        ["feat:rows", { title: "Ce que l'API gère pour vous", items: [{ t: "Ressources et pagination", x: "Objets cohérents, filtres combinables et pagination par curseur pour parcourir de gros volumes." }, { t: "Idempotence", x: "Une clé d'idempotence évite les doublons lorsque votre réseau relance une requête." }, { t: "Webhooks", x: "Événements signés, relancés avec temporisation exponentielle et consultables dans le journal." }, { t: "Versions de l'API", x: "Chaque changement incompatible reçoit une nouvelle version datée ; l'ancienne reste disponible 18 mois." }] }],
        ["feat:compare", { title: "Bac à sable ou production", rows: [["", "Bac à sable", "Production"], ["Données", "fictives", "réelles"], ["Limites", "200 appels/min", "selon l'offre"], ["Webhooks", "oui", "oui"], ["Journal des appels", "7 jours", "30 jours"]] }],
        ["feat:list2", { title: "SDK et outils", items: [{ t: "JavaScript et TypeScript", x: "Types générés depuis la spécification." }, { t: "Python", x: "Client synchrone et asynchrone." }, { t: "Go", x: "Contextes et délais gérés." }, { t: "Ligne de commande", x: "Rejouer un événement en une commande." }] }],
        ["cta:band", { title: "Une fonctionnalité manque à votre cas d'usage ?", sub: "Décrivez-le-nous : la feuille de route se construit avec les développeurs.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Payez à l'usage, changez d'offre quand vous voulez. Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Essai", price: "0 €", period: "/mois", x: "Pour explorer l'API.", f: ["Bac à sable illimité", "5 000 appels de production", "Support par la communauté"], cta: "Créer un compte", url: "/contact" }, { t: "Équipe", price: "49 €", period: "/mois", x: "Pour livrer un produit.", f: ["500 000 appels inclus", "Webhooks et journal 30 jours", "Support par e-mail sous 1 jour"], cta: "Choisir Équipe", url: "/contact", hl: true }, { t: "Échelle", price: "Sur devis", x: "Pour les volumes importants.", f: ["Volumes négociés", "Environnement dédié", "Accompagnement technique"], cta: "Parler à un ingénieur", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Que se passe-t-il si je dépasse mon quota ?", x: "Les appels supplémentaires sont facturés à l'unité selon la grille de votre offre ; vous êtes prévenu à 80 % de consommation." }, { t: "Puis-je changer d'offre en cours de mois ?", x: "Oui, le changement est immédiat et calculé au prorata." }, { t: "Où sont hébergées les données ?", x: "Dans des centres de données situés dans l'Union européenne." }] }],
        ["cta:split", { title: "Besoin d'un volume plus élevé ?", sub: "Nous construisons une offre adaptée à votre trafic.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "documentation", name: "Documentation", blocks: [
        ["misc:pagehead", { title: "Documentation et journal", sub: "Guides, références et notes de version." }],
        ["feat:steps", { eyebrow: "Démarrage", title: "Premier appel en cinq minutes", items: [{ t: "Créer une clé", x: "Depuis le tableau de bord, onglet Développeurs." }, { t: "Installer le SDK", x: "Une dépendance, aucune configuration." }, { t: "Lancer un appel", x: "Interrogez le bac à sable." }, { t: "Brancher un webhook", x: "Recevez votre premier événement." }] }],
        ["misc:posts", { title: "Notes de version et guides", count: 6, layout: "list" }],
        ["misc:faq", { title: "Dépannage", items: [{ t: "Je reçois une erreur 401", x: "Vérifiez que la clé correspond à l'environnement appelé (test ou production)." }, { t: "Mes webhooks n'arrivent pas", x: "Contrôlez la signature et la réponse HTTP renvoyée par votre serveur : une réponse hors 2xx déclenche une relance." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Une question technique ? Un ingénieur vous répond." }],
        ["contact:cards", { title: "Parlons de votre intégration", formTitle: "Écrire à l'équipe développeurs", formIntro: "Décrivez votre cas d'usage, nous revenons vers vous sous un jour ouvré.", cta: ["Envoyer", "/contact"] }],
        ["feat:icons", { title: "Autres canaux", items: [{ icon: "activity", t: "Statut du service", x: "Incidents et maintenances planifiées." }, { icon: "gitBranch", t: "Dépôts d'exemples", x: "Des projets prêts à cloner." }, { icon: "help", t: "Centre d'aide", x: "Réponses aux questions de facturation." }] }],
      ] },
    ],
  },

  // 2. SaaS de gestion : clair, indigo, ludique et rassurant
  {
    key: "voilure-saas", name: "Voilure", category: "tech", tags: ["moderne", "chaleureux"], siteType: "Logiciel SaaS de gestion de projets",
    description: "Site produit lumineux pour un logiciel SaaS : indigo et ambre, grille d'icônes, démonstration en alterné, tarifs en trois offres et foire aux questions.",
    brand: "Voilure",
    tokens: { colors: { primary: "#4f46e5", secondary: "#1e1b4b", accent: "#f59e0b", background: "#ffffff", surface: "#f5f3ff", text: "#1e1b4b", muted: "#55597a" }, fonts: { heading: "font.urbanist", body: "font.dm-sans", button: "font.urbanist", link: "font.dm-sans" }, radius: { sm: 8, md: 12, lg: 20, button: 12, field: 10, card: 18 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.05, letterSpacing: -0.025 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "voilure", motifs: ["blobs", "ribbons", "objects"] },
    head: ["head:bar", {}], foot: ["foot:newsletter", { title: "Les nouveautés Voilure, une fois par mois", sub: "Astuces de planification et notes de version, sans spam.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Produit", "/produit"], ["Tarifs", "/tarifs"], ["Ressources", "/ressources"], ["Contact", "/contact"]], cta: ["Essayer gratuitement", "/contact"],
    contact: { address: "21 quai des Chartrons, 33000 Bordeaux", phone: "05 56 00 20 30", email: "bonjour@voilure.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Pilotez vos projets sans perdre le fil." },
    social: ["linkedin", "youtube", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Gestion de projets en équipe", title: "Toute l'équipe sur le même cap.", sub: "Voilure réunit tâches, calendrier et échanges dans un tableau clair que chacun comprend en deux minutes.", cta: ["Essayer gratuitement", "/contact"], cta2: ["Voir le produit", "/produit"], image: "hero" }],
        ["feat:grid-icons", { title: "Pensé pour les équipes de dix à deux cents", items: [{ icon: "layout", t: "Tableaux visuels", x: "Colonnes, frises et listes au choix." }, { icon: "calendarClock", t: "Échéances partagées", x: "Une seule vue du calendrier." }, { icon: "bell", t: "Rappels utiles", x: "Prévenus quand il faut, jamais plus." }, { icon: "lock", t: "Droits fins", x: "Chaque projet a ses accès." }] }],
        ["feat:alt", { eyebrow: "En images", title: "Du brief à la livraison", items: [{ t: "Planifier sans tableur", x: "Glissez une tâche, ses dépendances se décalent avec elle.", link: ["Voir la planification", "/produit"] }, { t: "Suivre l'avancement", x: "Chaque responsable voit son périmètre, la direction voit l'ensemble." }, { t: "Clôturer proprement", x: "Un bilan de projet généré à partir de l'historique." }] }],
        ["proof:stats", { title: "Voilure en chiffres (exemples)", items: [["4 800", "équipes actives"], ["38 %", "de réunions de suivi en moins"], ["4,7/5", "note moyenne des utilisateurs"]] }],
        ["price:tiers", { items: [{ t: "Solo", price: "0 €", period: "/mois", x: "Pour s'organiser seul.", f: ["3 projets", "Vue liste et tableau"], cta: "Commencer", url: "/contact" }, { t: "Équipe", price: "9 €", period: "/utilisateur/mois", x: "Pour travailler ensemble.", f: ["Projets illimités", "Frise chronologique", "Rappels et commentaires"], cta: "Essayer 14 jours", url: "/contact", hl: true }, { t: "Organisation", price: "Sur devis", x: "Pour les grands groupes.", f: ["Droits avancés", "Accompagnement au déploiement"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:accordion", { title: "Vos questions", items: [{ t: "Puis-je importer mes tâches depuis un tableur ?", x: "Oui : un assistant d'import reconnaît les colonnes courantes (titre, responsable, échéance)." }, { t: "Mes données sont-elles exportables ?", x: "À tout moment, aux formats CSV et JSON." }] }],
        ["cta:band", { title: "Lancez votre premier projet cet après-midi.", sub: "14 jours d'essai, sans carte bancaire.", cta: ["Essayer gratuitement", "/contact"] }],
      ] },
      { key: "produit", name: "Produit", blocks: [
        ["misc:pagehead", { title: "Le produit", sub: "Trois façons de voir le même projet." }],
        ["feat:alt", { title: "Vues et automatisations", items: [{ t: "Tableau", x: "Des colonnes à votre image : à faire, en cours, en relecture, livré." }, { t: "Frise chronologique", x: "Les dépendances et les jalons apparaissent d'un coup d'œil." }, { t: "Charge d'équipe", x: "Repérez qui est saturé avant que le retard n'arrive." }] }],
        ["feat:cards", { eyebrow: "Intégrations", title: "S'ouvre à vos outils", items: [{ icon: "mail", t: "Messagerie", x: "Transformez un e-mail en tâche." }, { icon: "calendarClock", t: "Agendas", x: "Synchronisation bidirectionnelle." }, { icon: "plug", t: "API ouverte", x: "Connectez vos outils internes." }] }],
        ["proof:big", { items: [{ q: "Nous avons arrêté de nous demander où en était le projet : la réponse tient sur un écran.", n: "Directrice de production", r: "client fictif" }] }],
        ["cta:split", { title: "Voir Voilure en action", sub: "Une démonstration de 20 minutes avec un conseiller.", cta: ["Réserver une démonstration", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Simple, par utilisateur. Montants présentés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Solo", price: "0 €", period: "/mois", f: ["3 projets", "Vues liste et tableau", "Application mobile"], cta: "Commencer", url: "/contact" }, { t: "Équipe", price: "9 €", period: "/utilisateur/mois", f: ["Projets illimités", "Frise et charge d'équipe", "Intégrations de messagerie"], cta: "Essayer 14 jours", url: "/contact", hl: true }, { t: "Organisation", price: "Sur devis", f: ["Authentification unique", "Journal d'audit", "Succès client dédié"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:compare", { title: "Comparer les offres", rows: [["", "Solo", "Équipe", "Organisation"], ["Projets", "3", "illimités", "illimités"], ["Frise chronologique", "non", "oui", "oui"], ["Journal d'audit", "non", "non", "oui"]] }],
        ["feat:accordion", { title: "Facturation", items: [{ t: "Comment arrêter mon abonnement ?", x: "Depuis les paramètres du compte, en un clic ; vos données restent exportables pendant 30 jours." }, { t: "Y a-t-il une remise pour les associations ?", x: "Oui, contactez-nous pour en discuter." }] }],
      ] },
      { key: "ressources", name: "Ressources", blocks: [
        ["misc:pagehead", { title: "Ressources", sub: "Guides et retours d'expérience pour mieux piloter." }],
        ["misc:posts", { title: "Le blog de Voilure", count: 6, layout: "grid" }],
        ["feat:steps", { eyebrow: "Guide", title: "Lancer un projet en quatre temps", items: [{ t: "Définir", x: "Objectif, livrables, date cible." }, { t: "Découper", x: "Jalons et responsables." }, { t: "Suivre", x: "Point hebdomadaire de dix minutes." }, { t: "Clôturer", x: "Bilan et leçons retenues." }] }],
        ["cta:card", { title: "Un modèle de projet prêt à l'emploi ?", sub: "Recevez nos modèles directement dans votre espace.", cta: ["Essayer gratuitement", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Réponse sous un jour ouvré." }],
        ["contact:info", { title: "Parlons de votre équipe", formTitle: "Une question avant d'essayer ?", formIntro: "Dites-nous la taille de votre équipe et vos outils actuels.", cta: ["Envoyer", "/contact"] }],
        ["feat:icons", { title: "Besoin d'aide ?", items: [{ icon: "book", t: "Centre d'aide", x: "Tutoriels pas à pas." }, { icon: "video", t: "Webinaires", x: "Démonstrations en direct chaque mardi." }, { icon: "users", t: "Communauté", x: "Échangez entre utilisateurs." }] }],
      ] },
    ],
  },

  // 3. Application mobile : corail, pilules, chaleureux
  {
    key: "grenadine-app", name: "Grenadine", category: "tech", tags: ["ludique", "chaleureux"], siteType: "Application mobile grand public",
    description: "Vitrine d'application mobile joyeuse : coraux et jaune soleil, formes en pilule, en-tête flottant, captures en carrousel et parcours d'installation.",
    brand: "Grenadine",
    tokens: { colors: { primary: "#d93a2f", secondary: "#2b1b3d", accent: "#ffd166", background: "#fff8f3", surface: "#ffffff", text: "#2b1b3d", muted: "#6b5a78" }, fonts: { heading: "font.mulish", body: "font.nunito", button: "font.mulish", link: "font.nunito" }, radius: { sm: 12, md: 20, lg: 28, button: 999, field: 16, card: 28 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 64, weight: 900, lineHeight: 1.02, letterSpacing: -0.03 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "pill" }, art: { seed: "grenadine", motifs: ["blobs", "bokeh", "objects"] },
    head: ["head:float", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["L'application", "/application"], ["Offres", "/offres"], ["Journal", "/journal"], ["Contact", "/contact"]], cta: ["Télécharger", "/contact"],
    contact: { address: "5 rue des Tanneurs, 44000 Nantes", phone: "02 40 00 30 40", email: "salut@grenadine-app.example", hours: "Équipe joignable du lundi au vendredi, 10 h – 17 h", tagline: "Vos petites habitudes, en plus faciles." },
    social: ["instagram", "tiktok", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Application de suivi d'habitudes", title: "Des petits pas, tous les jours.", sub: "Grenadine transforme vos bonnes résolutions en rituels quotidiens : rappels bienveillants, séries à garder et défis entre amis.", cta: ["Télécharger l'application", "/contact"], cta2: ["Découvrir", "/application"] }],
        ["feat:icons", { title: "Ce qui vous fait revenir", items: [{ icon: "sparkles", t: "Rituels guidés", x: "Cinq minutes le matin, cinq le soir." }, { icon: "trophy", t: "Séries et badges", x: "Gardez votre flamme allumée." }, { icon: "users", t: "Défis entre amis", x: "Motivez-vous à plusieurs." }, { icon: "bell", t: "Rappels doux", x: "Un coup de pouce, pas une alarme." }] }],
        ["gal:carousel", { items: [{ t: "Le tableau du jour", x: "Vos rituels en un coup d'œil." }, { t: "Ma série", x: "Vingt-et-un jours de suite." }, { t: "Défi du week-end", x: "Marcher plus que ses amis." }, { t: "Mon bilan", x: "Une semaine en couleurs." }] }],
        ["proof:big", { items: [{ q: "Je n'ai jamais tenu un carnet plus de trois jours. Là, j'en suis à cent vingt.", n: "Camille", r: "client fictif" }] }],
        ["feat:steps", { eyebrow: "Facile", title: "Prêt en trois minutes", items: [{ t: "Installer", x: "Disponible sur iPhone et Android." }, { t: "Choisir ses rituels", x: "Parmi une trentaine de suggestions." }, { t: "Se laisser guider", x: "Les rappels s'adaptent à votre rythme." }] }],
        ["cta:image", { title: "Votre premier rituel commence ce soir.", sub: "Gratuit pour démarrer, sans carte bancaire.", cta: ["Télécharger", "/contact"] }],
      ] },
      { key: "application", name: "L'application", blocks: [
        ["misc:pagehead", { title: "L'application", sub: "Tout ce qui tient dans votre poche." }],
        ["feat:alt", { title: "Un compagnon, pas un chef de classe", items: [{ t: "Rituels sur mesure", x: "Fréquence, durée et moment de la journée : vous décidez." }, { t: "Bilans en couleurs", x: "Chaque semaine, un résumé clair de vos progrès." }, { t: "Mode hors ligne", x: "Cochez vos rituels même sans réseau." }] }],
        ["feat:list2", { title: "Et aussi", items: [{ t: "Widget d'écran d'accueil", x: "Cochez sans ouvrir l'application." }, { t: "Mode sombre", x: "Doux pour les soirées." }, { t: "Export de vos données", x: "Quand vous voulez." }, { t: "Sans publicité", x: "Jamais, même en gratuit." }] }],
        ["cta:band", { title: "Disponible sur iPhone et Android.", cta: ["Télécharger", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ["misc:pagehead", { title: "Offres", sub: "Gratuit pour commencer. Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Gratuit", price: "0 €", f: ["5 rituels", "Séries et badges"], cta: "Télécharger", url: "/contact" }, { t: "Grenadine+", price: "3,99 €", period: "/mois", f: ["Rituels illimités", "Bilans détaillés", "Défis entre amis"], cta: "Essayer 30 jours", url: "/contact", hl: true }, { t: "Famille", price: "6,99 €", period: "/mois", f: ["Jusqu'à 5 profils", "Défis familiaux"], cta: "Choisir Famille", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Puis-je annuler à tout moment ?", x: "Oui, depuis les réglages de votre boutique d'applications." }, { t: "Mes rituels sont-ils privés ?", x: "Par défaut oui ; vous choisissez ce que vous partagez avec vos amis." }] }],
        ["cta:card", { title: "Un doute ? Testez 30 jours.", cta: ["Essayer", "/contact"] }],
      ] },
      { key: "journal", name: "Journal", blocks: [
        ["misc:pagehead", { title: "Le journal Grenadine", sub: "Astuces pour tenir sur la durée." }],
        ["misc:posts", { title: "Derniers articles", count: 6, layout: "grid" }],
        ["feat:cards", { title: "Trois astuces pour tenir", items: [{ icon: "sun", t: "Ancrer au matin", x: "Associez le rituel à un geste existant." }, { icon: "heart", t: "Viser petit", x: "Deux minutes valent mieux que zéro." }, { icon: "users", t: "Le dire à un ami", x: "L'engagement social aide." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Une idée, un bug, un compliment ?" }],
        ["contact:cards", { title: "Écrivez-nous", formTitle: "Un message à l'équipe", formIntro: "Nous lisons tout.", cta: ["Envoyer", "/contact"] }],
        ["misc:faq", { title: "Avant de nous écrire", items: [{ t: "Je ne reçois plus mes rappels", x: "Vérifiez l'autorisation de notifications et le mode économie d'énergie de votre téléphone." }, { t: "Comment supprimer mon compte ?", x: "Dans Réglages, rubrique Compte, puis Supprimer." }] }],
      ] },
    ],
  },

  // 4. Intelligence artificielle : violet nuit, dégradé, majuscules
  {
    key: "neuronea-ia", name: "Neuronéa", category: "tech", tags: ["sombre", "audacieux", "moderne"], siteType: "Plateforme d'intelligence artificielle",
    description: "Thème nocturne pour une plateforme d'IA : violet profond et vert d'eau, bandeau dégradé avec chiffres, cartes de capacités, tableau comparatif et cas d'usage.",
    brand: "Neuronéa",
    tokens: { colors: { primary: "#a78bfa", secondary: "#120a2a", accent: "#34d399", background: "#0e0820", surface: "#1a1238", text: "#ede9fe", muted: "#b4a8d8" }, fonts: { heading: "font.league-spartan", body: "font.inter", button: "font.league-spartan", link: "font.inter" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 10, card: 16 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 62, weight: 700, lineHeight: 1.04, letterSpacing: -0.03 } }, border: { width: 1, color: "#2f2360" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "neuronea", motifs: ["mesh", "bokeh", "rays"] },
    head: ["head:minimal", {}], foot: ["foot:big", { title: "Neuronéa" }],
    menu: [["Accueil", "/"], ["Plateforme", "/plateforme"], ["Cas d'usage", "/cas-d-usage"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander un accès", "/contact"],
    contact: { address: "3 allée du Plateau, 91120 Palaiseau", phone: "01 60 00 40 50", email: "equipes@neuronea.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Des modèles de langage maîtrisés, dans votre périmètre." },
    social: ["linkedin", "github", "x"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Assistants et automatisation", title: "Une IA qui connaît vraiment votre métier.", sub: "Neuronéa déploie des assistants alimentés par vos documents, avec des sources citées, des droits d'accès respectés et des données qui restent chez vous.", cta: ["Demander un accès", "/contact"], cta2: ["Explorer la plateforme", "/plateforme"], stats: [["< 2 s", "réponse médiane (exemple)"], ["100 %", "réponses sourcées"], ["UE", "hébergement des données"]], angle: 150 }],
        ["feat:cards", { eyebrow: "Capacités", title: "De la recherche à l'action", items: [{ icon: "search", t: "Recherche augmentée", x: "Posez une question, obtenez la réponse et le passage du document." }, { icon: "bot", t: "Assistants métier", x: "Support, juridique, achats : un assistant par équipe." }, { icon: "zap", t: "Automatisations", x: "Résumés, tri, rédaction de brouillons." }, { icon: "shield", t: "Garde-fous", x: "Filtres, journaux et revue humaine." }] }],
        ["proof:statsbar", { items: [["68 %", "de temps de recherche en moins (exemple)"], ["12", "connecteurs de sources"], ["30 jours", "pour un premier assistant en production"]] }],
        ["feat:compare", { title: "Assistant généraliste ou assistant Neuronéa", rows: [["", "Assistant généraliste", "Neuronéa"], ["Sources citées", "rarement", "toujours"], ["Droits d'accès respectés", "non", "oui"], ["Données utilisées pour entraîner", "selon les cas", "jamais"]] }],
        ["proof:quotes", { title: "Premiers retours", items: [{ q: "Nos juristes retrouvent la clause en dix secondes, avec la page.", n: "Aurélie M.", r: "Directrice juridique, cliente fictive" }, { q: "Le support a divisé ses réponses types par trois.", n: "Étienne C.", r: "Responsable support, client fictif" }] }],
        ["cta:split", { title: "Évaluez Neuronéa sur vos propres documents.", sub: "Un pilote de trois semaines, encadré par nos ingénieurs.", cta: ["Demander un accès", "/contact"] }],
      ] },
      { key: "plateforme", name: "Plateforme", blocks: [
        ["misc:pagehead", { title: "La plateforme", sub: "Quatre couches, un seul contrôle." }],
        ["feat:numbered", { title: "Comment ça marche", items: [{ t: "Connecter", x: "Partages de fichiers, wiki, messagerie, tickets : lecture seule par défaut." }, { t: "Indexer", x: "Découpage, enrichissement et respect des droits d'accès d'origine." }, { t: "Répondre", x: "Réponses rédigées avec leurs sources, évaluées en continu." }] }],
        ["feat:rows", { title: "Gouvernance", items: [{ t: "Journal d'audit", x: "Chaque question, chaque source, chaque réponse est tracée." }, { t: "Évaluation continue", x: "Jeux de questions de référence et alertes de dérive." }, { t: "Choix du modèle", x: "Modèles hébergés en Europe ou déployés chez vous." }] }],
        ["cta:band", { title: "Voir la plateforme sur un cas réel", cta: ["Demander une démonstration", "/contact"] }],
      ] },
      { key: "cas-d-usage", name: "Cas d'usage", blocks: [
        ["misc:pagehead", { title: "Cas d'usage", sub: "Exemples de déploiements, présentés comme illustrations." }],
        ["gal:cards", { items: [{ t: "Support client", tag: "Service", x: "Brouillons de réponses validés par un conseiller." }, { t: "Veille réglementaire", tag: "Juridique", x: "Synthèses hebdomadaires avec renvoi aux textes." }, { t: "Appels d'offres", tag: "Ventes", x: "Premier jet de réponse à partir des dossiers passés." }] }],
        ["feat:steps", { title: "Un pilote en quatre étapes", items: [{ t: "Cadrage", d: "Semaine 1", x: "Choix du cas d'usage et des sources." }, { t: "Connexion", d: "Semaine 2", x: "Branchement et indexation." }, { t: "Évaluation", d: "Semaine 3", x: "Tests avec vos équipes." }, { t: "Décision", d: "Semaine 4", x: "Bilan chiffré." }] }],
        ["proof:stats", { items: [["3 semaines", "durée d'un pilote"], ["15", "utilisateurs testeurs"], ["1", "indicateur de succès choisi ensemble"]] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Tarification à l'équipe. Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Pilote", price: "1 500 €", period: "forfait", f: ["Un assistant", "Jusqu'à 15 utilisateurs", "3 semaines encadrées"], cta: "Démarrer", url: "/contact" }, { t: "Équipe", price: "890 €", period: "/mois", f: ["3 assistants", "100 utilisateurs", "Journal d'audit"], cta: "Choisir Équipe", url: "/contact", hl: true }, { t: "Entreprise", price: "Sur devis", f: ["Déploiement privé", "Modèles au choix", "Support dédié"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Mes documents servent-ils à entraîner un modèle ?", x: "Non. Ils ne sont utilisés que pour répondre à vos questions, dans votre espace." }, { t: "Puis-je utiliser mon propre modèle ?", x: "Oui, via l'offre Entreprise." }] }],
        ["cta:card", { title: "Un devis adapté à votre périmètre", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Parlons de votre premier assistant." }],
        ["contact:map", { title: "Venir nous voir", mapAddress: "3 allée du Plateau, 91120 Palaiseau" }],
        ["misc:text", { eyebrow: "Sécurité", title: "Vos données, vos règles", paras: ["Nous signons un accord de traitement des données dès le premier échange. Aucun document n'est conservé en dehors de votre espace dédié." ] }],
      ] },
    ],
  },

  // 5. Cybersécurité : noir et vert terminal, majuscules condensées
  {
    key: "bastion-cyber", name: "Bastion", category: "tech", tags: ["sombre", "technique", "audacieux"], siteType: "Éditeur de cybersécurité",
    description: "Thème noir et vert signal pour un éditeur de cybersécurité : titres condensés en capitales, bandeau latéral sombre, procédure d'intervention et indicateurs.",
    brand: "Bastion Sécurité",
    tokens: { colors: { primary: "#22c55e", secondary: "#050a07", accent: "#f97316", background: "#08100c", surface: "#101c15", text: "#e6f4ea", muted: "#9bb5a3" }, fonts: { heading: "font.teko", body: "font.ibm-plex-sans", button: "font.teko", link: "font.ibm-plex-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 76, weight: 600, lineHeight: 0.98, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 48, weight: 600, lineHeight: 1.0, letterSpacing: 0.02, transform: "uppercase" } }, border: { width: 1, color: "#1f3a2a" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "bastion", motifs: ["tiles", "halftone", "plates"] },
    head: ["head:bar", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Solutions", "/solutions"], ["Incident", "/incident"], ["Tarifs", "/tarifs"], ["Veille", "/veille"], ["Contact", "/contact"]], cta: ["Parler à un expert", "/contact"],
    contact: { address: "27 avenue du Fort, 67000 Strasbourg", phone: "04 00 00 50 60", email: "soc@bastion-cyber.example", hours: "Surveillance 24 h/24, 7 jours sur 7", tagline: "Détecter, contenir, rétablir." },
    social: ["linkedin", "github"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Détection et réponse aux incidents", title: "Vos systèmes sous surveillance, vos équipes sereines.", sub: "Bastion surveille vos postes, vos serveurs et votre messagerie, détecte les comportements anormaux et intervient avant que l'attaque ne se propage.", cta: ["Parler à un expert", "/contact"], cta2: ["Que faire en cas d'incident ?", "/incident"], image: "hero" }],
        ["feat:numbered", { eyebrow: "Notre approche", title: "Trois verrous, une seule équipe", items: [{ t: "Prévenir", x: "Inventaire des actifs, correctifs priorisés, sensibilisation des équipes." }, { t: "Détecter", x: "Supervision continue et corrélation des alertes par des analystes." }, { t: "Répondre", x: "Confinement, investigation et plan de reprise documenté." }] }],
        ["feat:strips", { title: "Solutions", items: [{ t: "Protection des postes", x: "Agent léger, isolement d'une machine en un clic." }, { t: "Messagerie", x: "Filtrage du hameçonnage et des pièces jointes piégées." }, { t: "Audit et tests d'intrusion", x: "Rapports hiérarchisés, avec plan de correction." }] }],
        ["proof:statsbar", { items: [["24 h/24", "surveillance humaine"], ["< 30 min", "délai de prise en charge (exemple)"], ["200+", "environnements supervisés (exemple)"]] }],
        ["feat:checks", { title: "Conformité sans jargon", intro: "Nous vous aidons à documenter vos mesures de sécurité pour vos clients et vos assureurs.", cta: ["Parler à un expert", "/contact"], items: [{ t: "Cartographie des risques", x: "" }, { t: "Politique de sauvegarde testée", x: "" }, { t: "Registre des incidents", x: "" }, { t: "Plan de continuité", x: "" }] }],
        ["cta:band", { title: "Un doute sur votre exposition ?", sub: "Un diagnostic de surface d'attaque en 48 heures.", cta: ["Demander un diagnostic", "/contact"] }],
      ] },
      { key: "solutions", name: "Solutions", blocks: [
        ["misc:pagehead", { title: "Solutions", sub: "Des services gérés et des audits à la demande." }],
        ["feat:rows", { title: "Notre catalogue", items: [{ t: "Supervision gérée (SOC)", x: "Nos analystes qualifient les alertes et ne vous réveillent que pour de vrais incidents." }, { t: "Réponse à incident", x: "Une équipe d'astreinte pour contenir et comprendre, avec rapport pour l'assureur." }, { t: "Tests d'intrusion", x: "Simulation d'attaque sur vos applications et votre réseau." }, { t: "Sensibilisation", x: "Campagnes d'hameçonnage simulées et formations courtes." }] }],
        ["feat:tabs", { title: "Par taille d'organisation", items: [{ t: "TPE", x: "Un forfait tout compris : protection des postes et messagerie." }, { t: "PME", x: "Supervision continue et audit annuel." }, { t: "ETI", x: "SOC dédié, tests réguliers et exercices de crise." }] }],
        ["cta:split", { title: "Quel niveau de protection vous faut-il ?", sub: "Nous évaluons votre situation sans vous vendre ce qui est inutile.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "incident", name: "Incident", blocks: [
        ["misc:pagehead", { title: "En cas d'incident", sub: "Les premiers réflexes comptent.", bg: "token:secondary" }],
        ["feat:steps", { eyebrow: "Procédure", title: "Les cinq premières heures", items: [{ t: "Isoler", d: "Heure 0", x: "Débranchez du réseau les machines touchées, sans les éteindre." }, { t: "Appeler", d: "Heure 0", x: "Joignez la cellule de crise et prévenez votre direction." }, { t: "Préserver", d: "Heure 1", x: "Conservez les journaux et les sauvegardes saines." }, { t: "Qualifier", d: "Heure 2", x: "Périmètre, données touchées, exigences de notification." }, { t: "Restaurer", d: "Heure 5", x: "Reprise progressive après vérification." }] }],
        ["feat:accordion", { title: "Questions urgentes", items: [{ t: "Dois-je payer une rançon ?", x: "Nous le déconseillons : rien ne garantit la restitution des données. Nous étudions d'abord les sauvegardes." }, { t: "Faut-il prévenir l'autorité de protection des données ?", x: "Si des données personnelles sont concernées, la notification est obligatoire sous 72 heures ; nous vous aidons à la préparer." }] }],
        ["cta:card", { title: "Incident en cours ?", sub: "Cellule de crise joignable 24 h/24 au 04 00 00 50 60.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Forfaits mensuels. Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Essentiel", price: "290 €", period: "/mois", x: "Jusqu'à 25 postes.", f: ["Protection des postes", "Filtrage de messagerie", "Alertes qualifiées"], cta: "Choisir Essentiel", url: "/contact" }, { t: "Supervisé", price: "790 €", period: "/mois", x: "Jusqu'à 100 postes.", f: ["Supervision 24 h/24", "Réponse à incident incluse", "Revue trimestrielle"], cta: "Choisir Supervisé", url: "/contact", hl: true }, { t: "Sur mesure", price: "Sur devis", f: ["SOC dédié", "Exercices de crise"], cta: "Nous contacter", url: "/contact" }] }],
        ["feat:list2", { title: "Toujours inclus", items: [{ t: "Rapport mensuel", x: "Alertes, incidents, recommandations." }, { t: "Interlocuteur nommé", x: "Un analyste référent." }, { t: "Données en Europe", x: "Hébergement dans l'Union européenne." }, { t: "Sans engagement long", x: "Résiliable avec préavis de 3 mois." }] }],
      ] },
      { key: "veille", name: "Veille", blocks: [
        ["misc:pagehead", { title: "Veille et alertes", sub: "Failles, campagnes d'hameçonnage, bonnes pratiques." }],
        ["misc:posts", { title: "Bulletins de sécurité", count: 6, layout: "list" }],
        ["proof:stats", { title: "Notre activité de veille (exemples)", items: [["1 200", "avis analysés par mois"], ["48 h", "délai moyen de qualification"], ["15", "bulletins clients par trimestre"]] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Parlez à un analyste, pas à un standard." }],
        ["contact:info", { title: "Échanger avec un expert", formTitle: "Décrire votre besoin", formIntro: "Taille de l'organisation, outils en place, urgence éventuelle.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Cellule de crise", "24 h/24, 7 j/7"], ["Questions commerciales", "Lun – ven, 9 h – 18 h"], ["Rapports et conformité", "Lun – ven, 9 h – 17 h"]] }],
      ] },
    ],
  },

  // 6. Fintech : bleu électrique, mint, stacked
  {
    key: "orbitale-fintech", name: "Orbitale", category: "tech", tags: ["moderne", "geometrique"], siteType: "Néobanque et paiements pour entreprises",
    description: "Site de néobanque professionnelle : bleu électrique et menthe, en-tête centré, grande scène pleine largeur, onglets de services et galerie en une grande vignette.",
    brand: "Orbitale",
    tokens: { colors: { primary: "#0047e0", secondary: "#001a4d", accent: "#00b88a", background: "#f4f8ff", surface: "#ffffff", text: "#0a1b3d", muted: "#4a5b7c" }, fonts: { heading: "font.urbanist", body: "font.manrope", button: "font.manrope", link: "font.manrope" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.06, letterSpacing: -0.02 } } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "soft" }, art: { seed: "orbitale", motifs: ["rays", "waves", "mesh"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Compte professionnel, cartes et paiements en ligne pour les entreprises. Orbitale est une marque fictive de démonstration, sans activité bancaire réelle.", cols: [["Services", "Compte pro", "Cartes", "Encaissement"], ["Entreprise", "Tarifs", "Sécurité", "Contact"]] }],
    menu: [["Accueil", "/"], ["Services", "/services"], ["Tarifs", "/tarifs"], ["Sécurité", "/securite"], ["Contact", "/contact"]], cta: ["Ouvrir un compte", "/contact"],
    contact: { address: "40 rue de la Bourse, 75002 Paris", phone: "01 44 00 60 70", email: "pro@orbitale.example", hours: "Du lundi au vendredi, 8 h 30 – 19 h", tagline: "Le compte professionnel qui suit votre rythme." },
    social: ["linkedin", "x", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Compte professionnel en ligne", title: "Gérez l'argent de votre entreprise sans la paperasse.", sub: "Compte, cartes, virements et factures dans un seul espace, ouvert en quelques minutes.", cta: ["Ouvrir un compte", "/contact"], cta2: ["Découvrir les services", "/services"], stats: [["5 min", "pour ouvrir un compte"], ["0 €", "de frais de tenue (offre de base)"], ["24/7", "gel de carte en un geste"]] }],
        ["feat:tabs", { eyebrow: "Services", title: "Tout l'essentiel, au même endroit", items: [{ t: "Compte", x: "IBAN français, virements instantanés, prélèvements et sous-comptes par projet." }, { t: "Cartes", x: "Cartes physiques et virtuelles, plafonds par collaborateur, gel immédiat." }, { t: "Encaissement", x: "Liens de paiement et facturation, rapprochement automatique des encaissements." }, { t: "Comptabilité", x: "Export vers votre expert-comptable, justificatifs rattachés aux dépenses." }] }],
        ["gal:featured", { title: "Dans l'application", items: [{ t: "Tableau de trésorerie", x: "Prévisions sur 90 jours." }, { t: "Cartes d'équipe", x: "Plafonds et catégories." }, { t: "Factures", x: "Relances automatiques." }, { t: "Justificatifs", x: "Photo, rattachement." }] }],
        ["proof:stats", { items: [["12 000", "entreprises (exemple)"], ["2,1 Md €", "de flux annuels (exemple)"], ["4,6/5", "note de l'application (exemple)"]] }],
        ["feat:cards", { title: "Pensé pour la gestion à plusieurs", items: [{ icon: "users", t: "Droits par rôle", x: "Dirigeant, comptable, collaborateur." }, { icon: "tag", t: "Catégories", x: "Dépenses classées en un geste." }, { icon: "download", t: "Exports", x: "Écritures prêtes pour la comptabilité." }] }],
        ["cta:image", { title: "Un compte pour votre entreprise, ouvert aujourd'hui.", sub: "Pièces justificatives en ligne, réponse sous un jour ouvré.", cta: ["Ouvrir un compte", "/contact"] }],
      ] },
      { key: "services", name: "Services", blocks: [
        ["misc:pagehead", { title: "Services", sub: "Compte, cartes, paiements : vous choisissez les briques." }],
        ["feat:alt", { title: "De l'encaissement à la comptabilité", items: [{ t: "Encaisser", x: "Liens de paiement, virements et prélèvements récurrents.", link: ["Voir les tarifs", "/tarifs"] }, { t: "Dépenser", x: "Cartes d'équipe, plafonds et notifications instantanées." }, { t: "Clôturer", x: "Rapprochement automatique et export pour votre comptable." }] }],
        ["feat:steps", { eyebrow: "Ouverture", title: "Ouvrir votre compte", items: [{ t: "Créer l'espace", x: "Identité du dirigeant et de l'entreprise." }, { t: "Envoyer les pièces", x: "Statuts, justificatif de domicile." }, { t: "Valider", x: "Vérification sous un jour ouvré." }, { t: "Utiliser", x: "Carte virtuelle disponible immédiatement." }] }],
        ["cta:band", { title: "Besoin d'un parcours sur mesure ?", sub: "Un conseiller étudie vos flux avec vous.", cta: ["Parler à un conseiller", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Lisibles, sans frais cachés. Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Démarrage", price: "0 €", period: "/mois", f: ["Compte et IBAN", "1 carte virtuelle", "Virements SEPA gratuits"], cta: "Ouvrir", url: "/contact" }, { t: "Croissance", price: "19 €", period: "/mois", f: ["5 cartes physiques", "Facturation et relances", "Export comptable"], cta: "Choisir Croissance", url: "/contact", hl: true }, { t: "Équipe", price: "49 €", period: "/mois", f: ["Cartes illimitées", "Droits par rôle", "Support prioritaire"], cta: "Choisir Équipe", url: "/contact" }] }],
        ["feat:pricelist", { title: "Frais à l'unité", items: [{ t: "Virement instantané", x: "Jusqu'à 100 000 € par opération", price: "0,50 €" }, { t: "Carte physique supplémentaire", x: "Livrée sous 5 jours", price: "5 €" }, { t: "Retrait en zone euro", x: "Par retrait", price: "1 €" }] }],
        ["misc:faq", { title: "À savoir", items: [{ t: "Mes fonds sont-ils protégés ?", x: "Cette page est une démonstration : dans un projet réel, indiquez ici le dispositif de garantie applicable." }] }],
      ] },
      { key: "securite", name: "Sécurité", blocks: [
        ["misc:pagehead", { title: "Sécurité", sub: "Des protections visibles et des contrôles que vous maîtrisez." }],
        ["feat:icons", { title: "Ce qui protège votre compte", items: [{ icon: "lock", t: "Authentification forte", x: "Chaque opération sensible est confirmée." }, { icon: "eye", t: "Alertes en temps réel", x: "Notification à chaque paiement." }, { icon: "shield", t: "Gel de carte", x: "En un geste, à toute heure." }, { icon: "settings", t: "Plafonds", x: "Définis par carte et par jour." }] }],
        ["feat:list2", { title: "Bonnes pratiques", items: [{ t: "Ne partagez jamais un code reçu par SMS", x: "Aucun conseiller ne vous le demandera." }, { t: "Vérifiez les adresses de paiement", x: "Contrôlez le bénéficiaire avant de valider." }, { t: "Activez la biométrie", x: "Plus sûr qu'un mot de passe." }, { t: "Signalez tout doute", x: "Notre équipe répond 7 j/7." }] }],
        ["cta:split", { title: "Une opération vous semble suspecte ?", sub: "Gelez votre carte depuis l'application, puis écrivez-nous.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Un conseiller dédié aux entreprises." }],
        ["contact:cards", { title: "Parlons de vos flux", formTitle: "Être rappelé", formIntro: "Indiquez votre activité et vos volumes mensuels.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires du service client", rows: [["Lundi – vendredi", "8 h 30 – 19 h"], ["Samedi", "9 h – 13 h"], ["Gel de carte", "24 h/24 dans l'application"]] }],
      ] },
    ],
  },

  // 7. Cloud : bleu ciel et orange, cover, bento
  {
    key: "cumulo-cloud", name: "Cumulo", category: "tech", tags: ["moderne", "technique"], siteType: "Hébergeur cloud",
    description: "Site d'hébergeur cloud lumineux : ciel clair et accent orange, grand bandeau photographique, indicateurs de fiabilité, bento d'offres et grille de tarifs.",
    brand: "Cumulo Cloud",
    tokens: { colors: { primary: "#0369a1", secondary: "#0c2d48", accent: "#f97316", background: "#f0f9ff", surface: "#ffffff", text: "#0c2d48", muted: "#476683" }, fonts: { heading: "font.mulish", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 6, card: 10 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 800, lineHeight: 1.06, letterSpacing: -0.025 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "cumulo", motifs: ["waves", "bokeh", "mountains"] },
    head: ["head:split", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Offres", "/offres"], ["Tarifs", "/tarifs"], ["Fiabilité", "/fiabilite"], ["Blog", "/blog"], ["Contact", "/contact"]], cta: ["Créer un projet", "/contact"],
    contact: { address: "Parc des Alpes, 1 rue du Datacenter, 38000 Grenoble", phone: "04 76 00 70 80", email: "commercial@cumulo-cloud.example", hours: "Support du lundi au vendredi, 8 h – 20 h", tagline: "Un cloud européen, simple et prévisible." },
    social: ["linkedin", "github", "x"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Hébergement cloud en Europe", title: "Vos applications, sur une infrastructure qui reste sous contrôle.", sub: "Serveurs, bases de données et stockage dans des centres de données européens, avec une facture qui se lit sans calculette.", cta: ["Créer un projet", "/contact"], cta2: ["Voir les offres", "/offres"], overlay: "#06223a99" }],
        ["proof:statsbar", { items: [["99,99 %", "disponibilité visée (exemple)"], ["3", "régions en France et en Allemagne"], ["< 60 s", "pour lancer un serveur"]] }],
        ["feat:bento", { eyebrow: "Offres", title: "Les briques de votre infrastructure", items: [{ t: "Serveurs virtuels", x: "Du petit service de test au cluster de production : processeurs partagés ou dédiés, redimensionnables à chaud, facturés à l'heure." }, { t: "Bases de données gérées", x: "Sauvegardes automatiques et réplicas." }, { t: "Stockage objet", x: "Compatible S3, prix au Go." }] }],
        ["feat:steps", { title: "Lancer un projet", items: [{ t: "Choisir une région", x: "Paris, Grenoble ou Francfort." }, { t: "Déployer", x: "Console, API ou Terraform." }, { t: "Superviser", x: "Métriques et alertes intégrées." }, { t: "Évoluer", x: "Ajoutez des ressources sans interruption." }] }],
        ["price:tiers", { items: [{ t: "Bac à idées", price: "5 €", period: "/mois", f: ["1 vCPU, 2 Go", "40 Go de disque"], cta: "Lancer", url: "/contact" }, { t: "Production", price: "42 €", period: "/mois", f: ["4 vCPU, 16 Go", "320 Go NVMe", "Sauvegardes quotidiennes"], cta: "Choisir Production", url: "/contact", hl: true }, { t: "Dédié", price: "Sur devis", f: ["Machines dédiées", "Réseau privé"], cta: "Nous contacter", url: "/contact" }] }],
        ["cta:split", { title: "Migrer depuis un autre hébergeur ?", sub: "Nos ingénieurs préparent la bascule avec vous.", cta: ["Parler à un ingénieur", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ["misc:pagehead", { title: "Offres", sub: "Calcul, données, réseau : tout est facturé à l'usage." }],
        ["feat:cards", { title: "Catalogue", items: [{ icon: "layers", t: "Serveurs virtuels", x: "À partir de 5 € par mois." }, { icon: "network", t: "Réseau privé", x: "Isolez vos services entre eux." }, { icon: "download", t: "Stockage objet", x: "Archivage et distribution." }, { icon: "shield", t: "Pare-feu géré", x: "Règles versionnées." }] }],
        ["feat:alt", { title: "Pour chaque besoin", items: [{ t: "Sites et applications web", x: "Déploiement continu depuis votre dépôt de code." }, { t: "Données et analyses", x: "Entrepôts de données et traitements planifiés." }, { t: "Conteneurs", x: "Clusters gérés avec montée en charge automatique." }] }],
        ["cta:band", { title: "Estimez votre facture avant de vous engager.", cta: ["Demander une estimation", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Prix publics, hors taxes. Montants donnés à titre d'exemple." }],
        ["feat:pricelist", { title: "Calcul", items: [{ t: "Serveur 1 vCPU, 2 Go", x: "Facturé à l'heure, plafonné au mois", price: "5 €" }, { t: "Serveur 4 vCPU, 16 Go", x: "NVMe inclus", price: "42 €" }, { t: "Serveur 16 vCPU, 64 Go", x: "Pour les charges soutenues", price: "165 €" }] }],
        ["feat:pricelist", { title: "Données", items: [{ t: "Stockage objet", x: "Par Go et par mois", price: "0,012 €" }, { t: "Base de données gérée", x: "Instance de départ", price: "19 €" }, { t: "Trafic sortant", x: "Au-delà de 1 To inclus, par To", price: "2 €" }] }],
        ["misc:faq", { items: [{ t: "Y a-t-il un engagement de durée ?", x: "Aucun : la facturation s'arrête quand vous supprimez la ressource." }, { t: "Puis-je obtenir un contrat avec garantie de service ?", x: "Oui pour l'offre Dédié, contactez-nous." }] }],
      ] },
      { key: "fiabilite", name: "Fiabilité", blocks: [
        ["misc:pagehead", { title: "Fiabilité et conformité", sub: "Ce que nous mesurons, ce que nous publions." }],
        ["feat:numbered", { title: "Nos engagements", items: [{ t: "Transparence", x: "Page de statut publique et rapports d'incident détaillés." }, { t: "Souveraineté", x: "Données hébergées dans l'Union européenne." }, { t: "Réversibilité", x: "Formats ouverts et export complet à tout moment." }] }],
        ["proof:logos", { title: "Infrastructures de clients (fictifs)", items: ["Maillon", "Ecume", "Terra Data", "Quintessia"] }],
        ["feat:steps", { title: "En cas d'incident", items: [{ t: "Détection", x: "Supervision automatique." }, { t: "Information", x: "Statut public en moins de 10 minutes." }, { t: "Résolution", x: "Équipe d'astreinte." }, { t: "Rapport", x: "Analyse publiée sous 5 jours." }] }],
      ] },
      { key: "blog", name: "Blog", blocks: [
        ["misc:pagehead", { title: "Blog technique" }],
        ["misc:posts", { title: "Dernières publications", count: 6, layout: "grid" }],
        ["cta:card", { title: "Recevez nos guides d'exploitation", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Commercial, support ou migration." }],
        ["contact:map", { title: "Nos équipes", mapAddress: "1 rue du Datacenter, 38000 Grenoble" }],
        ["feat:icons", { title: "Choisir le bon canal", items: [{ icon: "mail", t: "Commercial", x: "Devis et projets de migration." }, { icon: "help", t: "Support technique", x: "Ticket depuis la console." }, { icon: "alertTriangle", t: "Urgence", x: "Astreinte pour les clients dédiés." }] }],
      ] },
    ],
  },

  // 8. No-code : orange vif, slab, poster
  {
    key: "briquet-nocode", name: "Briquet", category: "tech", tags: ["audacieux", "ludique"], siteType: "Outil no-code pour applications métier",
    description: "Site d'outil no-code énergique : orange vif, titres en slab épais, affiche géante, bande défilante, bandes de fonctionnalités et galerie en maçonnerie.",
    brand: "Briquet",
    tokens: { colors: { primary: "#d94800", secondary: "#111111", accent: "#00a38d", background: "#fffdf5", surface: "#ffffff", text: "#111111", muted: "#5c5c52" }, fonts: { heading: "font.alfa-slab-one", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 6, md: 10, lg: 14, button: 8, field: 8, card: 12 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 48, weight: 400, lineHeight: 1.0, letterSpacing: -0.01 }, h2: { size: 42, weight: 400, lineHeight: 1.1, letterSpacing: 0 } }, border: { width: 2, color: "#111111" } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "soft" }, art: { seed: "briquet", motifs: ["objects", "plates", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:big", { title: "Briquet" }],
    menu: [["Accueil", "/"], ["Construire", "/construire"], ["Modèles", "/modeles"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Construire mon outil", "/contact"],
    contact: { address: "9 rue des Ateliers, 59000 Lille", phone: "03 20 00 80 90", email: "salut@briquet.example", hours: "Du lundi au vendredi, 9 h – 17 h 30", tagline: "Fabriquez vos outils sans écrire une ligne de code." },
    social: ["youtube", "linkedin", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { title: "Votre outil métier, sans développeur.", sub: "Assemblez formulaires, tableaux et automatisations comme des briques, puis publiez en un clic.", cta: ["Construire mon outil", "/contact"], cta2: ["Voir des modèles", "/modeles"] }],
        ["misc:marquee", { items: ["Formulaires", "Tableaux de bord", "Automatisations", "Portails clients", "Suivi de stock", "Relances par e-mail"] }],
        ["feat:strips", { eyebrow: "Comment ça marche", title: "Trois gestes pour tout construire", items: [{ t: "Poser vos données", x: "Importez un tableur ou créez vos tables à la main." }, { t: "Dessiner l'écran", x: "Glissez des boutons, des listes et des graphiques." }, { t: "Automatiser", x: "Quand une ligne change, envoyez un e-mail ou créez une tâche." }] }],
        ["gal:masonry", { title: "Construit avec Briquet (exemples)", items: [{ t: "Suivi de chantiers" }, { t: "Planning de livraisons" }, { t: "Demandes de congés" }, { t: "Catalogue interne" }, { t: "Registre de visiteurs" }, { t: "Gestion d'événements" }] }],
        ["proof:quotes", { title: "Ils ont lâché le tableur", items: [{ q: "Mon outil de suivi est né un mercredi soir.", n: "Anaïs G.", r: "Responsable logistique, cliente fictive" }, { q: "Les équipes l'utilisent parce qu'elles l'ont dessiné.", n: "Yacine T.", r: "Directeur d'exploitation, client fictif" }] }],
        ["cta:band", { title: "Votre première application avant la fin du café.", cta: ["Construire mon outil", "/contact"] }],
      ] },
      { key: "construire", name: "Construire", blocks: [
        ["misc:pagehead", { title: "Construire", sub: "Les briques à votre disposition." }],
        ["feat:cards", { title: "Les briques", items: [{ icon: "layout", t: "Écrans", x: "Listes, fiches, formulaires et tableaux de bord." }, { icon: "zap", t: "Automatisations", x: "Conditions, boucles, envois d'e-mails." }, { icon: "users", t: "Comptes et droits", x: "Qui voit quoi, qui modifie quoi." }, { icon: "plug", t: "Connecteurs", x: "Messagerie, agendas, tableurs." }] }],
        ["feat:alt", { title: "Un exemple pas à pas", items: [{ t: "Le registre", x: "Une table de visiteurs avec nom, société, heure d'arrivée." }, { t: "Le formulaire", x: "Un écran d'accueil sur tablette." }, { t: "La notification", x: "L'hôte reçoit un message dès l'arrivée." }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Faut-il savoir programmer ?", x: "Non. Si vous savez utiliser un tableur, vous savez utiliser Briquet." }, { t: "Puis-je exporter mes données ?", x: "Oui, en CSV, à tout moment." }] }],
      ] },
      { key: "modeles", name: "Modèles", blocks: [
        ["misc:pagehead", { title: "Modèles prêts à l'emploi" }],
        ["gal:cards", { items: [{ t: "Suivi de stock", tag: "Logistique", x: "Entrées, sorties, seuil d'alerte." }, { t: "Demandes internes", tag: "RH", x: "Congés, matériel, attestations." }, { t: "Portail client", tag: "Service", x: "Suivi de commande en libre-service." }] }],
        ["feat:list2", { title: "Chaque modèle inclut", items: [{ t: "Tables et écrans", x: "Prêts à personnaliser." }, { t: "Automatisations de base", x: "E-mails et rappels." }, { t: "Données d'exemple", x: "Pour tester tout de suite." }, { t: "Guide d'installation", x: "En cinq étapes." }] }],
        ["cta:split", { title: "Un modèle manque ?", sub: "Proposez-le : nous en publions deux par mois.", cta: ["Proposer un modèle", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Montants donnés à titre d'exemple." }],
        ["price:tiers", { items: [{ t: "Atelier", price: "0 €", f: ["2 applications", "100 lignes de données"], cta: "Commencer", url: "/contact" }, { t: "Équipe", price: "25 €", period: "/mois", f: ["Applications illimitées", "10 000 lignes", "Automatisations"], cta: "Choisir Équipe", url: "/contact", hl: true }, { t: "Usine", price: "89 €", period: "/mois", f: ["Lignes illimitées", "Connecteurs avancés", "Support prioritaire"], cta: "Choisir Usine", url: "/contact" }] }],
        ["feat:compare", { title: "Ce qui change", rows: [["", "Atelier", "Équipe", "Usine"], ["Lignes de données", "100", "10 000", "illimitées"], ["Automatisations", "non", "oui", "oui"], ["Connecteurs avancés", "non", "non", "oui"]] }],
        ["misc:faq", { items: [{ t: "Que se passe-t-il si je repasse en gratuit ?", x: "Vos données restent consultables et exportables ; les écrans excédentaires sont archivés." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "On vous aide à démarrer." }],
        ["contact:info", { title: "Parlons de votre outil", formTitle: "Décrivez ce que vous voulez construire", formIntro: "Quelques phrases suffisent.", cta: ["Envoyer", "/contact"] }],
        ["misc:text", { title: "Ateliers de prise en main", paras: ["Chaque jeudi de 14 h à 15 h 30, un atelier en visioconférence vous guide pour construire votre premier écran. Inscription par message." ] }],
      ] },
    ],
  },

  // 9. Startup deeptech : framed, gris froid, éditorial
  {
    key: "apogee-deeptech", name: "Apogée", category: "tech", tags: ["editorial", "technique", "geometrique"], siteType: "Startup deeptech (matériaux et énergie)",
    description: "Site de startup deeptech : gris froid et bleu cobalt, polices techniques, bandeau encadré, équipe de chercheurs, jalons de développement et publications.",
    brand: "Apogée Laboratoires",
    tokens: { colors: { primary: "#2f3fd0", secondary: "#0a0f1f", accent: "#c026d3", background: "#eef1f6", surface: "#ffffff", text: "#0a0f1f", muted: "#4b5568" }, fonts: { heading: "font.chakra-petch", body: "font.ibm-plex-sans", button: "font.chakra-petch", link: "font.ibm-plex-sans" }, radius: { sm: 0, md: 4, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 600, lineHeight: 1.08, letterSpacing: -0.01 } }, border: { width: 1, color: "#c9d1de" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "apogee", motifs: ["topo", "halftone", "tiles"] },
    head: ["head:masthead", { dateline: "Laboratoire de recherche appliquée · Saclay" }], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Technologie", "/technologie"], ["Équipe", "/equipe"], ["Publications", "/publications"], ["Contact", "/contact"]], cta: ["Collaborer", "/contact"],
    contact: { address: "Campus Technologique, bâtiment C, 91190 Gif-sur-Yvette", phone: "01 69 00 90 10", email: "labo@apogee-deeptech.example", hours: "Visites sur rendez-vous, du lundi au jeudi", tagline: "Stocker l'énergie autrement." },
    social: ["linkedin", "github"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Matériaux pour le stockage d'énergie", title: "Une batterie qui se recycle aussi bien qu'elle se charge.", sub: "Apogée développe des électrolytes solides à base de ressources européennes, de la paillasse au prototype industriel.", cta: ["Collaborer avec nous", "/contact"], cta2: ["Notre technologie", "/technologie"] }],
        ["feat:alt", { eyebrow: "Technologie", title: "Trois verrous levés", items: [{ t: "Un électrolyte solide stable", x: "Une formulation qui reste stable sur des centaines de cycles en laboratoire (résultats indicatifs).", link: ["En savoir plus", "/technologie"] }, { t: "Des matières premières européennes", x: "Moins de dépendance aux métaux critiques importés." }, { t: "Un procédé compatible avec l'existant", x: "Les lignes de production actuelles peuvent l'accueillir avec peu d'adaptations." }] }],
        ["proof:stats", { title: "L'équipe en chiffres (exemples)", items: [["22", "chercheurs et ingénieurs"], ["9", "brevets déposés"], ["3", "partenariats académiques"]] }],
        ["feat:steps", { eyebrow: "Feuille de route", title: "Des jalons vérifiables", items: [{ t: "Preuve de concept", d: "2023", x: "Cellule de laboratoire de 1 cm²." }, { t: "Prototype", d: "2025", x: "Cellule de 100 cm²." }, { t: "Pilote", d: "2027", x: "Ligne pilote avec un partenaire industriel." }] }],
        ["proof:big", { items: [{ q: "Ce qui nous distingue : publier ce qui ne marche pas encore autant que ce qui marche.", n: "Direction scientifique", r: "citation de démonstration" }] }],
        ["cta:card", { title: "Industriel ou laboratoire : travaillons ensemble.", sub: "Nous ouvrons des programmes de co-développement.", cta: ["Collaborer", "/contact"] }],
      ] },
      { key: "technologie", name: "Technologie", blocks: [
        ["misc:pagehead", { title: "Technologie", sub: "Du matériau à la cellule." }],
        ["misc:text", { eyebrow: "Principe", title: "Un électrolyte qui ne brûle pas", paras: ["Les batteries actuelles reposent sur un liquide inflammable. Notre approche remplace ce liquide par un matériau solide qui conduit les ions sans risque de fuite.", "Les chiffres présentés ici sont des ordres de grandeur issus de nos essais internes, sans valeur contractuelle."] }],
        ["feat:rows", { title: "Les briques technologiques", items: [{ t: "Synthèse", x: "Procédé en voie sèche, sans solvant toxique." }, { t: "Caractérisation", x: "Spectroscopie, microscopie et cyclage automatisé." }, { t: "Intégration", x: "Assemblage de cellules avec des électrodes standards." }, { t: "Recyclage", x: "Récupération des matériaux par simple dissolution." }] }],
        ["feat:compare", { title: "Comparaison indicative", rows: [["", "Électrolyte liquide", "Électrolyte Apogée"], ["Inflammabilité", "élevée", "nulle"], ["Matières critiques", "nombreuses", "réduites"], ["Recyclage", "complexe", "simplifié"]] }],
      ] },
      { key: "equipe", name: "Équipe", blocks: [
        ["misc:pagehead", { title: "L'équipe" }],
        ["proof:team", { items: [{ n: "Dr Inès Maréchal", r: "Cofondatrice, direction scientifique" }, { n: "Théo Barrault", r: "Cofondateur, direction technique" }, { n: "Dr Lina Okafor", r: "Responsable caractérisation" }, { n: "Victor Salmon", r: "Responsable industrialisation" }] }],
        ["misc:story", { eyebrow: "Origine", title: "Née d'une thèse, portée par un collectif", paras: ["Apogée est issue d'un laboratoire public et conserve des liens étroits avec la recherche académique.", "Les noms et parcours présentés sont fictifs, à remplacer par ceux de votre équipe."], image: "portrait-2" }],
        ["feat:numbered", { title: "Nos valeurs", items: [{ t: "Rigueur", x: "Chaque résultat est reproduit avant d'être annoncé." }, { t: "Ouverture", x: "Données partagées avec nos partenaires." }, { t: "Sobriété", x: "Moins de matière, plus de durée de vie." }] }],
      ] },
      { key: "publications", name: "Publications", blocks: [
        ["misc:pagehead", { title: "Publications et actualités" }],
        ["misc:posts", { title: "Articles et notes de recherche", count: 6, layout: "list" }],
        ["feat:list2", { title: "Brevets et dépôts (exemples)", items: [{ t: "Procédé de synthèse en voie sèche", x: "Dépôt en 2022." }, { t: "Architecture de cellule", x: "Dépôt en 2023." }, { t: "Méthode de recyclage", x: "Dépôt en 2024." }, { t: "Revêtement d'interface", x: "Dépôt en 2024." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Industriels, laboratoires, investisseurs." }],
        ["contact:info", { title: "Collaborer avec Apogée", formTitle: "Nous écrire", formIntro: "Présentez votre besoin ou votre programme de recherche.", cta: ["Envoyer", "/contact"] }],
        ["feat:icons", { title: "Types de collaboration", items: [{ icon: "layers", t: "Co-développement", x: "Programme conjoint sur un cas d'usage." }, { icon: "graduation", t: "Thèses et stages", x: "Accueil de doctorants." }, { icon: "briefcase", t: "Licences", x: "Accès à la propriété intellectuelle." }] }],
      ] },
    ],
  },

  // 10. Plateforme de données : magenta, éditorial, minimal
  {
    key: "datalac-data", name: "Datalac", category: "tech", tags: ["editorial", "moderne"], siteType: "Plateforme de données et d'analyse",
    description: "Site de plateforme de données au ton éditorial : fond crème, magenta et bleu azur, grand titre sans image, pictogrammes, liste de prix et études de cas.",
    brand: "Datalac",
    tokens: { colors: { primary: "#be185d", secondary: "#1f1033", accent: "#0369a1", background: "#fdf7fa", surface: "#ffffff", text: "#1f1033", muted: "#5e4b6b" }, fonts: { heading: "font.league-spartan", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 600, lineHeight: 1.0, letterSpacing: -0.035 }, h2: { size: 40, weight: 600, lineHeight: 1.1, letterSpacing: -0.02 } }, border: { width: 1, color: "#e5d3dd" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "datalac", motifs: ["plates", "ribbons", "halftone"] },
    head: ["head:side", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Plateforme", "/plateforme"], ["Études de cas", "/etudes-de-cas"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Demander une démo", "/contact"],
    contact: { address: "14 rue du Port, 13002 Marseille", phone: "04 91 00 11 22", email: "equipe@datalac.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Des données fiables, des décisions plus rapides." },
    social: ["linkedin", "youtube"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Plateforme de données", title: "Une seule version de la vérité.", sub: "Datalac rassemble vos sources, nettoie vos données et les rend lisibles par chaque équipe, sans file d'attente vers le service informatique.", cta: ["Demander une démo", "/contact"], cta2: ["Explorer la plateforme", "/plateforme"] }],
        ["proof:logos", { title: "Équipes données qui utilisent Datalac (fictives)", items: ["Brise Marine", "Foncière Aubrac", "Volta Mobilité", "Casaque", "Les Halles Vives"] }],
        ["feat:icons", { eyebrow: "Capacités", title: "De la source au tableau de bord", items: [{ icon: "plug", t: "Connecteurs", x: "Bases, applications métier, fichiers." }, { icon: "settings", t: "Transformations", x: "Règles de qualité versionnées." }, { icon: "barChart", t: "Tableaux de bord", x: "Construits par les métiers." }, { icon: "shield", t: "Gouvernance", x: "Catalogue, droits et traçabilité." }] }],
        ["gal:cards", { title: "Études de cas (exemples)", items: [{ t: "Prévoir la demande", tag: "Distribution", x: "Une prévision hebdomadaire partagée par les magasins." }, { t: "Réduire les retards", tag: "Transport", x: "Suivi des tournées en temps réel." }, { t: "Fiabiliser la facturation", tag: "Services", x: "Écarts repérés avant l'émission." }] }],
        ["proof:statsbar", { items: [["50+", "connecteurs de sources"], ["10 min", "pour un premier tableau de bord"], ["1", "catalogue partagé"]] }],
        ["cta:split", { title: "Voir Datalac sur vos propres données.", sub: "Une démonstration de 45 minutes avec un ingénieur de données.", cta: ["Demander une démo", "/contact"] }],
      ] },
      { key: "plateforme", name: "Plateforme", blocks: [
        ["misc:pagehead", { title: "La plateforme", sub: "Collecter, transformer, partager." }],
        ["feat:rows", { title: "Les trois étages", items: [{ t: "Collecter", x: "Synchronisation planifiée ou en continu depuis vos sources, avec reprise sur erreur." }, { t: "Transformer", x: "Des requêtes versionnées, testées automatiquement avant chaque mise en ligne." }, { t: "Partager", x: "Tableaux de bord, exports et API pour vos applications." }] }],
        ["feat:tabs", { title: "Pour chaque métier", items: [{ t: "Finance", x: "Clôtures mensuelles plus rapides, écarts expliqués." }, { t: "Opérations", x: "Stocks, délais et incidents au même endroit." }, { t: "Marketing", x: "Mesure de campagnes sans export manuel." }] }],
        ["feat:checks", { title: "Qualité des données", intro: "Des règles simples appliquées à chaque chargement.", cta: ["Demander une démo", "/contact"], items: [{ t: "Valeurs manquantes signalées", x: "" }, { t: "Doublons détectés", x: "" }, { t: "Seuils d'alerte par table", x: "" }, { t: "Historique des corrections", x: "" }] }],
      ] },
      { key: "etudes-de-cas", name: "Études de cas", blocks: [
        ["misc:pagehead", { title: "Études de cas", sub: "Situations illustratives, chiffres donnés à titre d'exemple." }],
        ["feat:alt", { items: [{ t: "Une enseigne de distribution fictive", x: "Les prévisions de ventes, calculées chaque lundi, ont remplacé quarante tableurs." }, { t: "Un opérateur de transport fictif", x: "Un seul tableau suit les retards par ligne et par cause." }] }],
        ["proof:quotes", { items: [{ q: "On ne se dispute plus sur le chiffre, on discute de la décision.", n: "Laurence V.", r: "Directrice financière, cliente fictive" }, { q: "Les équipes métier construisent leurs propres vues.", n: "Mehdi R.", r: "Responsable données, client fictif" }] }],
        ["proof:stats", { items: [["-60 %", "de tableurs à maintenir (exemple)"], ["2 j", "gagnés sur la clôture (exemple)"], ["1", "catalogue de référence"]] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs", sub: "Selon les volumes traités. Montants donnés à titre d'exemple." }],
        ["feat:pricelist", { title: "Formules", items: [{ t: "Découverte", x: "5 connecteurs, 3 utilisateurs", price: "0 €" }, { t: "Croissance", x: "20 connecteurs, 25 utilisateurs", price: "490 €/mois" }, { t: "Entreprise", x: "Connecteurs et utilisateurs illimités, support dédié", price: "Sur devis" }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Où sont stockées mes données ?", x: "Dans votre région d'hébergement choisie à la création du compte." }, { t: "Puis-je me connecter à mon propre entrepôt ?", x: "Oui, la plateforme s'appuie sur l'entrepôt de votre choix." }] }],
        ["cta:band", { title: "Calculons votre volume", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact", sub: "Parlons de vos données." }],
        ["contact:info", { title: "Échanger avec l'équipe", formTitle: "Parlez-nous de vos sources", formIntro: "Quelles applications souhaitez-vous relier ?", cta: ["Envoyer", "/contact"] }],
        ["misc:posts", { title: "En attendant, nos analyses", count: 3, layout: "list" }],
      ] },
    ],
  },
];
