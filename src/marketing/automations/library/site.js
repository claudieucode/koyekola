// Famille « Événements de votre site » (site) : parcours déclenchés par un événement PERSONNALISÉ que VOTRE site (ou votre
// outil de support) envoie à l'API : POST /api/v1/events (clé d'API, portée « write »). KOLAKISA n'enregistre pas ces
// comportements lui-même (panier côté navigateur, pages vues, tickets) : ces parcours restent donc « à configurer » tant
// que votre système n'envoie pas l'événement — aucune donnée n'est simulée. Le contact doit déjà exister dans l'audience
// (même e-mail). Les conditions n'utilisent que les achats KOLAKISA (les événements personnalisés ne sont pas encore
// disponibles dans les segments).
const { mail, step: S, flow, happened } = require("./dsl");

const ORDER = "lms.order_completed";
const COURSE = '"metadata": { "courseTitle": "Titre de la formation", "courseSlug": "adresse-de-la-formation" }';
const payload = (name, withCourse = true) => `{ "name": "${name}", "email": "adresse@du.contact"${withCourse ? `, ${COURSE}` : ""} }`;
const site = (name, withCourse = true, what = "votre site") => ({
  name, payload: payload(name, withCourse),
  help: `${what[0].toUpperCase()}${what.slice(1)} doit envoyer l'événement « ${name} » à l'API Événements (Intégrations → Clés d'API) avec l'adresse e-mail du contact${withCourse ? ", le titre et l'adresse (slug) de la formation concernée" : ""}.`,
});

module.exports = [
  {
    key: "panier-abandonne-api", group: "site", kind: "marketing", audience: "prospects", goal: "convertir", needs: ["site_event"],
    label: "Relance après un panier abandonné",
    objective: "Relancer les visiteurs qui ont ajouté une formation au panier sans acheter.",
    description: "Une heure après l'événement, si aucun achat n'a eu lieu, un premier e-mail ; un jour plus tard un second rappel ; trois jours après, un dernier message. Chaque étape vérifie d'abord qu'aucun achat n'a eu lieu entre-temps.",
    trigger: { event: "panier.abandonne" },
    siteEvent: site("panier.abandonne"),
    note: "KOLAKISA garde le panier dans le navigateur : il ne peut pas détecter l'abandon lui-même. Votre site envoie l'événement quand un visiteur connu quitte son panier.",
    keywords: ["panier", "panier abandonné", "abandon", "ajout au panier", "e-commerce", "relance"],
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
    key: "checkout-abandonne-api", group: "site", kind: "marketing", audience: "prospects", goal: "convertir", needs: ["site_event"],
    label: "Relance après un paiement abandonné",
    objective: "Aider un visiteur qui a commencé le paiement sans le terminer.",
    description: "Trente minutes après l'événement, si aucun achat n'a eu lieu, un e-mail propose de l'aide ; deux jours plus tard, s'il n'a toujours pas acheté, un second message.",
    trigger: { event: "checkout.abandonne" },
    siteEvent: site("checkout.abandonne"),
    note: "À utiliser à la place de « Relance après un panier abandonné » pour les visiteurs allés jusqu'au paiement, pas avec lui.",
    keywords: ["checkout", "paiement", "abandon", "début du checkout", "e-commerce"],
    emails: [
      mail("Aide", "Un souci au moment de payer ?", "{{event.course_title}}", "Besoin d'aide ?", "{h}, vous avez commencé à commander **{{event.course_title}}**. Si un problème vous a arrêté(e), répondez à cet e-mail : nous le réglerons.", ["Reprendre ma commande", "formation"]),
      mail("Relance", "Votre commande vous attend", "{{event.course_title}}", "Il ne manque qu'un clic", "{h}, votre formation vous attend toujours. Vous pouvez finaliser votre commande quand vous voulez.", ["Finaliser ma commande", "formation"]),
    ],
    steps: flow([S.wait(30, "minutes"), S.seg(happened(ORDER, 1), "exit", "next"), S.email(0), S.wait(2, "days"), S.seg(happened(ORDER, 3), "exit", "next"), S.email(1)]),
  },
  {
    key: "formation-consultee-sans-achat-api", group: "site", kind: "marketing", audience: "prospects", goal: "convertir", needs: ["site_event"],
    label: "Relance après la consultation d'une formation",
    objective: "Relancer un visiteur connu qui a consulté une formation sans l'acheter.",
    description: "Deux jours après la consultation, si aucun achat n'a eu lieu, un e-mail propose de répondre à ses questions sur cette formation.",
    trigger: { event: "formation.consultee" },
    siteEvent: site("formation.consultee"),
    note: "Envoyez l'événement une fois par visiteur connu et par formation consultée, pas à chaque page vue.",
    keywords: ["consultation", "visite", "formation consultée", "produit consulté", "comportement", "site"],
    emails: [mail("Une question", "Une question sur {{event.course_title}} ?", "Nous répondons volontiers", "Vous avez regardé cette formation", "{h}, vous avez consulté **{{event.course_title}}**. Une question sur le programme ou le niveau ? Répondez à cet e-mail, nous vous répondrons personnellement.", ["Revoir la formation", "formation"])],
    steps: flow([S.wait(2, "days"), S.seg(happened(ORDER, 2), "exit", "next"), S.email(0)]),
  },
  {
    key: "formation-consultee-plusieurs-fois-api", group: "site", kind: "marketing", audience: "prospects", goal: "convertir", needs: ["site_event"],
    label: "Aider un visiteur qui revient sur une formation",
    objective: "Aller vers un visiteur qui a consulté plusieurs fois la même formation sans se décider.",
    description: "Dès l'événement, un e-mail propose son aide ; trois jours plus tard, s'il n'a toujours pas acheté, il reçoit l'étiquette « hésitant » pour que vous puissiez le suivre.",
    trigger: { event: "formation.consultee_plusieurs_fois" },
    siteEvent: site("formation.consultee_plusieurs_fois"),
    note: "Votre site décide du seuil (par exemple trois visites de la même formation) et envoie l'événement une seule fois.",
    keywords: ["visites répétées", "consultation répétée", "hésitation", "formation consultée plusieurs fois", "comportement"],
    emails: [mail("Aide à la décision", "Besoin d'aide pour vous décider ?", "{{event.course_title}}", "Cette formation vous intéresse ?", "{h}, vous êtes revenu(e) plusieurs fois sur **{{event.course_title}}**. Dites-nous ce qui vous fait hésiter en répondant à cet e-mail : nous vous aiderons à choisir.", ["Voir la formation", "formation"])],
    steps: flow([S.email(0), S.wait(3, "days"), S.seg(happened(ORDER, 3), "exit", "next"), S.tag("hésitant")]),
  },
  {
    key: "retour-apres-absence-api", group: "site", kind: "marketing", audience: "abonnes", goal: "reengager", needs: ["site_event"],
    label: "Accueillir un visiteur de retour après une longue absence",
    objective: "Réagir quand un contact connu revient sur votre site après plusieurs semaines.",
    description: "Dès l'événement, un e-mail de retrouvailles présente les nouveautés du catalogue.",
    trigger: { event: "site.retour_apres_absence" },
    siteEvent: site("site.retour_apres_absence", false),
    note: "Votre site envoie l'événement quand un visiteur identifié revient après la durée de votre choix (par exemple 30 jours).",
    keywords: ["retour sur le site", "visite", "absence", "retour", "comportement", "réengagement"],
    emails: [mail("Retrouvailles", "Content de vous revoir", "Voici ce qui a changé", "Ravi de vous revoir, {h}", "Depuis votre dernière visite, notre catalogue s'est enrichi. Voici les nouveautés.", ["Voir les nouveautés", "catalogue"])],
    steps: flow([S.email(0)]),
  },
  {
    key: "support-ticket-cree-api", group: "support", kind: "transactional", audience: "clients", goal: "accueillir", needs: ["site_event"],
    label: "Accusé de réception d'une demande de support",
    objective: "Confirmer au client que sa demande a bien été reçue.",
    description: "Un e-mail de service dès la création d'un ticket dans votre outil de support, pour rassurer le client.",
    trigger: { event: "support.ticket_cree" },
    siteEvent: site("support.ticket_cree", false, "votre outil de support"),
    note: "KOLAKISA n'a pas de module de support : votre outil de support (ou votre site) envoie l'événement à la création du ticket. Transactionnel : sans contenu promotionnel.",
    keywords: ["ticket", "support", "nouveau ticket", "demande", "relation client"],
    emails: [mail("Demande reçue", "Nous avons bien reçu votre demande", "Nous revenons vers vous", "Merci, {h}", "Votre demande a bien été reçue. Nous vous répondons dès que possible.", null, { kind: "transactional" })],
    steps: flow([S.email(0)]),
  },
  {
    key: "support-ticket-resolu-api", group: "support", kind: "transactional", audience: "clients", goal: "avis", needs: ["site_event"],
    label: "Demander un retour après la résolution d'un ticket",
    objective: "Savoir si la demande du client a été résolue à sa satisfaction.",
    description: "Un jour après la résolution d'un ticket, un e-mail de service demande si tout est en ordre ; la réponse arrive directement dans votre boîte.",
    trigger: { event: "support.ticket_resolu" },
    siteEvent: site("support.ticket_resolu", false, "votre outil de support"),
    note: "KOLAKISA n'a pas de module de support : votre outil de support envoie l'événement à la résolution du ticket. Transactionnel : sans contenu promotionnel.",
    keywords: ["ticket résolu", "support", "feedback", "satisfaction", "relance après résolution"],
    emails: [mail("Tout est en ordre ?", "Votre demande est-elle résolue ?", "Votre retour nous aide", "Tout est en ordre ?", "{h}, votre demande a été traitée. Si tout est en ordre, vous n'avez rien à faire ; sinon, répondez à cet e-mail et nous reprendrons le dossier.", null, { kind: "transactional" })],
    steps: flow([S.wait(1, "days"), S.email(0)]),
  },
];
