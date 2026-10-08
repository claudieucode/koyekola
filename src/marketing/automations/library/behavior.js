// Parcours fondés sur des événements que KOLAKISA enregistre LUI-MÊME (comportement sur le site, progression des élèves).
// Famille « Comportement sur le site » SUIVI PAR KOLAKISA : parcours déclenchés par les événements que KOLAKISA enregistre
// lui-même (visiteurs : fiche formation consultée, ajout au panier, page de commande ouverte — visites/suivi.js). Ces événements
// ne concernent que les contacts CONNUS ayant accepté la mesure d'audience : aucun visiteur anonyme, aucune donnée simulée.
// Les parcours « …-api » (site.js) restent pour les systèmes qui envoient leurs propres événements à l'API.
const { mail, step: S, flow, happened } = require("./dsl");

const ORDER = "lms.order_completed";
const NOTE = "Fonctionne pour les contacts connus ayant accepté la mesure d'audience (bandeau de consentement du site) ; un visiteur anonyme ou qui refuse n'est pas suivi.";

module.exports = [
  {
    key: "formation-consultee-sans-achat-natif", group: "site", kind: "marketing", audience: "prospects", goal: "convertir",
    label: "Relance après la consultation d'une formation (suivi KOLAKISA)",
    objective: "Relancer un contact connu qui a consulté la fiche d'une formation sans l'acheter.",
    description: "Deux jours après la consultation, si aucun achat n'a eu lieu, un e-mail propose de répondre à ses questions sur cette formation.",
    trigger: { event: "lms.course_viewed" },
    note: `${NOTE} Un seul événement par formation et par visite.`,
    keywords: ["consultation", "visite", "fiche formation", "formation consultée", "produit consulté", "comportement", "site"],
    emails: [mail("Une question", "Une question sur {{event.course_title}} ?", "Nous répondons volontiers", "Vous avez regardé cette formation", "{h}, vous avez consulté **{{event.course_title}}**. Une question sur le programme ou le niveau ? Répondez à cet e-mail : nous vous répondons personnellement.", ["Revoir la formation", "formation"])],
    steps: flow([S.wait(2, "days"), S.seg(happened(ORDER, 2), "exit", "next"), S.email(0)]),
  },
  {
    key: "panier-ajoute-sans-achat-natif", group: "site", kind: "marketing", audience: "prospects", goal: "convertir",
    label: "Relance après un ajout au panier (suivi KOLAKISA)",
    objective: "Relancer un contact connu qui a ajouté une formation au panier sans acheter.",
    description: "Une heure après l'ajout, si aucun achat n'a eu lieu, un premier e-mail ; un jour plus tard un second rappel ; trois jours après, un dernier message. Chaque étape vérifie d'abord qu'aucun achat n'a eu lieu entre-temps.",
    trigger: { event: "lms.cart_added" },
    note: `${NOTE} L'événement est l'AJOUT au panier (pas l'abandon) : le parcours attend, puis ne relance que si aucun achat n'a suivi.`,
    keywords: ["panier", "ajout au panier", "panier abandonné", "e-commerce", "relance"],
    emails: [
      mail("Premier rappel", "Vous avez oublié quelque chose", "{{event.course_title}}", "Votre formation vous attend", "{h}, vous avez ajouté **{{event.course_title}}** à votre panier sans finaliser. Elle est toujours disponible.", ["Reprendre ma commande", "formation"]),
      mail("Deuxième rappel", "Toujours intéressé(e) par {{event.course_title}} ?", "Une question avant de vous décider ?", "Une question ?", "{h}, si quelque chose vous retient, répondez à cet e-mail : nous vous aiderons à choisir.", ["Voir la formation", "formation"]),
      mail("Dernier rappel", "Dernier rappel pour {{event.course_title}}", "Sans pression", "Un dernier mot", "{h}, nous ne vous écrirons plus à ce sujet. La formation reste disponible quand vous voudrez.", ["Voir la formation", "formation"]),
    ],
    steps: flow([
      S.wait(1, "hours"), S.seg(happened(ORDER, 1), "exit", "next"), S.email(0),
      S.wait(1, "days"), S.seg(happened(ORDER, 2), "exit", "next"), S.email(1),
      S.wait(3, "days"), S.seg(happened(ORDER, 5), "exit", "next"), S.email(2),
    ]),
  },
  {
    key: "commande-commencee-sans-achat-natif", group: "site", kind: "marketing", audience: "prospects", goal: "convertir",
    label: "Aide après une page de commande ouverte (suivi KOLAKISA)",
    objective: "Aider un contact connu qui a ouvert la page de commande sans terminer son achat.",
    description: "Trente minutes après l'ouverture de la page de commande, si aucun achat n'a eu lieu, un e-mail propose de l'aide ; deux jours plus tard, s'il n'a toujours pas acheté, un second message.",
    trigger: { event: "lms.checkout_started" },
    note: `${NOTE} L'événement ne précise pas la formation : les e-mails restent généraux.`,
    keywords: ["checkout", "paiement", "commande", "page de commande", "abandon", "e-commerce"],
    emails: [
      mail("Aide", "Un souci au moment de payer ?", "Nous pouvons vous aider", "Besoin d'aide ?", "{h}, vous avez commencé une commande. Si un problème vous a arrêté(e), répondez à cet e-mail : nous le réglerons.", ["Reprendre ma commande", "espace"]),
      mail("Relance", "Votre commande vous attend", "Il ne manque qu'un clic", "Il ne manque qu'un clic", "{h}, votre formation vous attend toujours. Vous pouvez finaliser votre commande quand vous voulez.", ["Retrouver le catalogue", "catalogue"]),
    ],
    steps: flow([S.wait(30, "minutes"), S.seg(happened(ORDER, 1), "exit", "next"), S.email(0), S.wait(2, "days"), S.seg(happened(ORDER, 3), "exit", "next"), S.email(1)]),
  },
  {
    key: "progression-50-pourcent", group: "nurture", kind: "marketing", audience: "eleves", goal: "activer",
    label: "Féliciter un élève à mi-parcours (50 %)",
    objective: "Encourager l'élève quand il a suivi la moitié de sa formation.",
    description: "Dès que l'élève atteint 50 % de la formation, un e-mail le félicite et l'invite à continuer.",
    trigger: { event: "lms.course_progress_50" },
    note: "Palier émis par KOLAKISA une fois par élève et par formation (10 %, 50 % et 90 % existent ; pas 25 % ni 75 %).",
    keywords: ["progression", "50 %", "mi-parcours", "moitié", "élève motivé", "module terminé"],
    emails: [mail("À mi-parcours", "Déjà la moitié de {{event.course_title}} !", "Bravo, continuez sur votre lancée", "Vous êtes à mi-parcours, {h}", "Vous avez déjà suivi la moitié de **{{event.course_title}}**. Continuez : la suite vous attend.", ["Reprendre ma formation", "accès"])],
    steps: flow([S.email(0)]),
  },
  {
    key: "progression-90-pourcent", group: "nurture", kind: "marketing", audience: "eleves", goal: "activer",
    label: "Encourager un élève dans la dernière ligne droite (90 %)",
    objective: "Aider l'élève à terminer sa formation quand il en a suivi presque tout.",
    description: "Dès que l'élève atteint 90 % de la formation, un e-mail l'encourage à aller jusqu'au bout.",
    trigger: { event: "lms.course_progress_90" },
    note: "Palier émis par KOLAKISA une fois par élève et par formation (10 %, 50 % et 90 % existent ; pas 25 % ni 75 %).",
    keywords: ["progression", "90 %", "dernière ligne droite", "presque terminé", "élève proche de terminer"],
    emails: [mail("Dernière ligne droite", "Plus que quelques leçons dans {{event.course_title}}", "Vous y êtes presque", "Dernière ligne droite, {h}", "Vous avez suivi près de 90 % de **{{event.course_title}}**. Il ne reste que quelques leçons pour terminer et obtenir votre certificat.", ["Terminer ma formation", "accès"])],
    steps: flow([S.email(0)]),
  },
];
