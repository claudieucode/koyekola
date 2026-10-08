// Parcours courants chez Mailchimp que KOLAKISA ne propose PAS tels quels aujourd'hui : affichés (« Non disponibles »), avec la
// raison exacte, jamais créés ni activables. Chaque raison est vérifiée dans le code (événements émis par le pont LMS et par
// le suivi des visiteurs, schéma des inscriptions, étapes du moteur). Quand la donnée manquante existera, le parcours sera écrit
// comme les autres (voir behavior.js pour ceux qui le sont déjà).
//   blocked : « tracking » (nécessite un suivi comportemental qui n'existe pas) ou « unavailable » (autre manque)
const TRACK = "tracking";
const OFF = "unavailable";

module.exports = [
  // ---- Comportement sur le site : aucun suivi des visiteurs n'existe ----
  { key: "visite-page-site", group: "site", blocked: OFF, audience: "prospects", goal: "convertir", label: "Visite d'une page du site",
    objective: "Réagir quand un visiteur connu consulte une page précise.",
    unavailable: "L'événement existe (« Un contact visite une page », Site Web et Tunnels : contacts connus ayant accepté la mesure d'audience), mais aucun parcours prêt à l'emploi n'est écrit : la page à surveiller se choisit à la main. Créez un scénario depuis zéro et choisissez ce déclencheur avec la page voulue. Pour une fiche formation, voir « Relance après la consultation d'une formation (suivi KOLAKISA) ».",
    keywords: ["visite", "page vue", "comportement", "site"] },
  { key: "visites-repetees-site", group: "site", blocked: OFF, audience: "prospects", goal: "convertir", label: "Visites répétées du site",
    objective: "Relancer un visiteur qui revient régulièrement sans acheter.",
    unavailable: "Les visites sont enregistrées pour les contacts connus ayant accepté la mesure d'audience, et les segments savent compter « Page visitée » ou « Fiche formation consultée » au moins N fois ; mais aucun parcours prêt à l'emploi n'est écrit (le seuil et la page sont à choisir). Créez un scénario depuis zéro avec une condition « au moins N fois ».",
    keywords: ["visites répétées", "retour", "comportement", "visite sans conversion"] },
{ key: "recherche-effectuee-site", group: "site", blocked: TRACK, audience: "prospects", goal: "convertir", label: "Recherche effectuée sur le site",
    objective: "Relancer un visiteur selon ce qu'il a recherché dans le catalogue.",
    unavailable: "Les recherches des visiteurs ne sont pas enregistrées : aucun événement de recherche n'existe.",
    keywords: ["recherche", "comportement", "catalogue"] },

  // ---- Progression, dates, offres : événements ou données absents ----
  { key: "progression-paliers", group: "nurture", blocked: OFF, audience: "eleves", goal: "activer", label: "Félicitations à 25 %, 50 % et 75 % de progression",
    objective: "Encourager l'élève à chaque palier de sa formation, jusqu'à la dernière ligne droite.",
    unavailable: "KOLAKISA émet les paliers 10 %, 50 % et 90 % de progression (pas 25 % ni 75 %) : voir « Féliciter un élève à mi-parcours (50 %) » et « Encourager un élève dans la dernière ligne droite (90 %) ». Les paliers 25 % et 75 % n'existent pas.",
    keywords: ["progression", "25 %", "50 %", "75 %", "élève proche de terminer", "module terminé"] },
  { key: "quiz-termine", group: "nurture", blocked: OFF, audience: "eleves", goal: "activer", label: "Quiz réussi ou raté",
    objective: "Féliciter un élève qui réussit un quiz, ou l'aider quand il le rate.",
    unavailable: "Les quiz existent dans les formations, mais leurs résultats ne sont pas transmis au module marketing : aucun événement « quiz terminé » n'est émis.",
    keywords: ["quiz", "résultat", "examen", "note"] },
  { key: "acces-formation-expirant", group: "courses", blocked: OFF, audience: "eleves", goal: "retenir", label: "Accès à une formation bientôt expiré",
    objective: "Prévenir un élève avant la fin de son accès à une formation.",
    unavailable: "Les inscriptions de KOLAKISA n'ont pas de date d'expiration : l'accès est permanent, il n'y a donc rien à rappeler.",
    keywords: ["formation expirante", "formation expirée", "expiration", "accès"] },
  { key: "renouvellement-abonnement", group: "commerce", blocked: OFF, audience: "clients", goal: "retenir", label: "Renouvellement d'abonnement",
    objective: "Rappeler un renouvellement et réduire les résiliations.",
    unavailable: "KOLAKISA vend des formations à l'unité, sans abonnement récurrent : aucune échéance de renouvellement n'existe.",
    keywords: ["abonnement", "renouvellement", "résiliation", "churn"] },
  { key: "offre-exclusive-code-promo", group: "loyalty", blocked: OFF, audience: "clients", goal: "fideliser", label: "Offre exclusive ou accès anticipé avec un code promo",
    objective: "Récompenser un client fidèle avec un code promo personnel ou un accès anticipé.",
    unavailable: "Un parcours ne peut pas créer ni attribuer un code promo : les codes existent dans la boutique, mais aucune étape d'automatisation n'y est reliée. Les parcours de fidélisation proposés remercient sans promettre d'avantage.",
    keywords: ["offre exclusive", "early access", "récompense", "code promo", "remise", "offre limitée"] },
  { key: "baisse-de-prix-retour-en-stock", group: "commerce", blocked: OFF, audience: "prospects", goal: "convertir", label: "Baisse de prix ou retour en stock",
    objective: "Prévenir un contact intéressé quand une formation baisse de prix ou redevient disponible.",
    unavailable: "KOLAKISA ne suit pas l'historique des prix et n'a pas de stock (formations numériques) : aucun événement de baisse de prix ou de retour en stock n'existe.",
    keywords: ["back in stock", "price drop", "prix", "stock"] },
  { key: "date-evenement-rappel", group: "dates", blocked: OFF, audience: "contacts", goal: "accueillir", label: "Rappel avant un événement ou à une date précise",
    objective: "Envoyer un message la veille d'un webinaire, un jour J, ou à une date récurrente.",
    unavailable: "Les automatisations de KOLAKISA démarrent sur un événement, pas sur une date calendaire : il n'existe ni déclencheur « à telle date » ni événements de calendrier. Pour un envoi à date fixe, programmez une campagne.",
    keywords: ["date spécifique", "date récurrente", "rappel avant événement", "jour j", "relance après événement", "webinaire"] },
  { key: "enquete-nps", group: "feedback", blocked: OFF, audience: "clients", goal: "avis", label: "Enquête de satisfaction NPS",
    objective: "Mesurer la recommandation avec une note de 0 à 10 et suivre l'évolution.",
    unavailable: "Aucun événement « réponse à une enquête » n'est émis et les enquêtes n'ont pas de question NPS : le score ne pourrait ni déclencher ni orienter un parcours. En attendant, « Prendre des nouvelles trois mois après un achat » recueille un retour par e-mail.",
    keywords: ["nps", "enquête", "satisfaction", "recommandation"] },
  { key: "formation-selon-interets", group: "courses", blocked: OFF, audience: "eleves", goal: "convertir", label: "Nouvelle formation selon les centres d'intérêt",
    objective: "Prévenir chaque élève des nouvelles formations qui correspondent à ses intérêts.",
    unavailable: "KOLAKISA n'enregistre pas de centres d'intérêt par élève : aucun critère ne permet de savoir qui doit recevoir quelle nouveauté. Utilisez une campagne vers un segment (étiquettes, formations suivies).",
    keywords: ["nouvelle formation", "intérêts", "recommandation", "personnalisation"] },
];
