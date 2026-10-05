// Familles « E-commerce » (commerce) et « Fidélisation » (loyalty). Déclencheur : commande passée. Un contact n'entre
// qu'UNE fois dans un parcours (à sa première commande après l'activation) : pour réagir à une commande FUTURE, le
// parcours attend l'événement (« Attendre jusqu'à : une commande est passée », reprise immédiate à la commande).
const { mail, step: S, flow, all, atLeast, spentAtLeast } = require("./dsl");

const ORDER = "lms.order_completed";
const LESSON = "lms.lesson_completed";

module.exports = [
  // ================= E-commerce =================
  {
    key: "vente-croisee-apres-achat", group: "commerce", kind: "marketing", audience: "clients", goal: "convertir",
    label: "Vente croisée : compléter son apprentissage",
    objective: "Proposer une formation complémentaire dix jours après un achat, sans relancer ceux qui ont déjà racheté.",
    description: "Dix jours après la commande, si le client n'a pas passé d'autre commande depuis, un e-mail l'invite à découvrir les formations qui complètent la sienne.",
    trigger: { event: ORDER },
    note: "Marketing (abonnés uniquement). Le client n'entre qu'une fois, à sa première commande après l'activation.",
    keywords: ["cross-sell", "vente croisée", "produit complémentaire", "recommandation", "formation complémentaire", "upsell"],
    emails: [mail("Compléter", "Complétez votre apprentissage", "Des formations qui vont avec la vôtre", "Allez plus loin, {h}", "{h}, merci pour votre achat. Découvrez les formations qui complètent celle que vous avez choisie et vous permettent de progresser plus vite.", ["Voir les formations complémentaires", "catalogue"])],
    steps: flow([S.wait(10, "days"), S.seg(atLeast(ORDER, 2), "exit", "next"), S.email(0)]),
  },
  {
    key: "relance-client-30-60-90", group: "commerce", kind: "marketing", audience: "clients", goal: "reengager",
    label: "Relance d'un client après 30, 60 et 90 jours",
    objective: "Faire revenir un client qui n'a pas recommandé, avec des relances de plus en plus espacées.",
    description: "Trois relances (30, 60 et 90 jours après la commande), chacune envoyée seulement si le client n'a pas repassé commande entre-temps. Après la troisième, étiquette « client-inactif ».",
    trigger: { event: ORDER },
    note: "S'arrête dès que le client passe une nouvelle commande. Le client n'entre qu'une fois, à sa première commande après l'activation.",
    keywords: ["relance client", "X jours", "30 jours", "60 jours", "90 jours", "recommande", "client inactif"],
    emails: [
      mail("30 jours", "Où en êtes-vous ?", "Un mois après votre commande", "Un mois déjà, {h}", "Vous avez terminé votre formation, ou pas encore ? Dans les deux cas, voici de quoi continuer à progresser.", ["Découvrir les nouveautés", "catalogue"]),
      mail("60 jours", "Une idée pour la suite", "De nouvelles formations vous attendent", "Et si vous appreniez autre chose ?", "{h}, notre catalogue évolue : jetez un œil aux formations que vous n'avez pas encore vues.", ["Parcourir le catalogue", "catalogue"]),
      mail("90 jours", "Cela fait trois mois", "Un dernier message de notre part", "Toujours avec nous ?", "{h}, nous ne voulons pas vous importuner. Si une nouvelle formation vous intéresse, elle est à un clic ; sinon, vous pouvez vous désabonner en bas de ce message.", ["Voir les formations", "catalogue"]),
    ],
    steps: flow([
      S.wait(30, "days"), S.seg(atLeast(ORDER, 2), "exit", "next"), S.email(0),
      S.wait(30, "days"), S.seg(atLeast(ORDER, 2), "exit", "next"), S.email(1),
      S.wait(30, "days"), S.seg(atLeast(ORDER, 2), "exit", "next"), S.email(2), S.tag("client-inactif"),
    ]),
  },
  {
    key: "client-dormant-six-mois", group: "commerce", kind: "marketing", audience: "clients", goal: "reengager",
    label: "Reconquérir un ancien client (6 mois sans activité)",
    objective: "Relancer un client qui n'a ni commandé ni terminé de leçon depuis six mois.",
    description: "Environ six mois après la commande, vérifie qu'aucune commande ni leçon terminée n'a eu lieu depuis 180 jours ; si le client est dormant, étiquette « client-dormant » et e-mail de retrouvailles.",
    trigger: { event: ORDER },
    note: "Marketing (abonnés uniquement). Aucune remise n'est promise : ajoutez votre offre dans l'e-mail si vous en proposez une.",
    keywords: ["win-back", "reconquête", "ancien client", "dormant", "6 mois", "reactivation"],
    emails: [mail("Retrouvailles", "Cela fait un moment !", "Voici ce qui a changé", "Content de vous retrouver, {h}", "Depuis votre dernière visite, de nouvelles formations sont arrivées. Jetez un œil, il y en a peut-être une qui vous correspond.", ["Voir les nouveautés", "catalogue"])],
    steps: flow([S.wait(185, "days"), S.seg(all({ field: `event:${ORDER}`, cmp: "not_within_days", value: 180 }, { field: `event:${LESSON}`, cmp: "not_within_days", value: 180 }), "next", "exit"), S.tag("client-dormant"), S.email(0)]),
  },

  // ================= Fidélisation =================
  {
    key: "deuxieme-achat-remerciement", group: "loyalty", kind: "marketing", audience: "clients", goal: "fideliser",
    label: "Remercier pour une deuxième commande",
    objective: "Marquer le passage de client occasionnel à client récurrent.",
    description: "Après la première commande, attend jusqu'à un an une nouvelle commande ; dès qu'elle arrive, étiquette « client-récurrent » et e-mail de remerciement. Sans deuxième commande, rien n'est envoyé.",
    trigger: { event: ORDER },
    note: "L'e-mail part au moment de la deuxième commande (reprise immédiate). Marketing : abonnés uniquement.",
    keywords: ["deuxième achat", "client récurrent", "fidélité", "remerciement", "2e commande"],
    emails: [mail("Merci", "Merci de votre confiance", "Votre deuxième commande", "Merci, {h}", "Votre deuxième commande nous fait très plaisir : merci de votre fidélité. Si vous avez une remarque ou une idée de formation, répondez simplement à cet e-mail.", ["Voir mes formations", "accès"])],
    steps: flow([S.waitFor(ORDER, 365, "days"), S.seg(atLeast(ORDER, 2), "next", "exit"), S.tag("client-récurrent"), S.email(0)]),
  },
  {
    key: "client-fidele-trois-achats", group: "loyalty", kind: "marketing", audience: "clients", goal: "fideliser",
    label: "Remercier un client fidèle (trois commandes)",
    objective: "Reconnaître les clients qui reviennent régulièrement et leur demander ce qu'ils attendent ensuite.",
    description: "Suit un client à travers ses commandes (jusqu'à un an d'attente chaque fois) ; à la troisième, étiquette « client-fidèle » et e-mail de remerciement qui l'invite à dire ce qu'il souhaite voir.",
    trigger: { event: ORDER },
    note: "S'arrête sans rien envoyer si le client ne passe pas de deuxième ou de troisième commande.",
    keywords: ["fidélité", "récompense", "plusieurs achats", "client à forte valeur", "ambassadeur"],
    emails: [mail("Fidélité", "Trois formations avec nous : merci !", "Vous comptez beaucoup pour nous", "Merci de votre fidélité, {h}", "Vous avez choisi nos formations à trois reprises : c'est la plus belle des preuves de confiance. Dites-nous, en répondant à cet e-mail, quelles formations vous aimeriez voir arriver.", ["Voir mes formations", "accès"])],
    steps: flow([
      S.waitFor(ORDER, 365, "days"), S.seg(atLeast(ORDER, 2), "next", "exit"),
      S.waitFor(ORDER, 365, "days"), S.seg(atLeast(ORDER, 3), "next", "exit"),
      S.tag("client-fidèle"), S.email(0),
    ]),
  },
  {
    key: "client-vip-depenses", group: "loyalty", kind: "marketing", audience: "clients", goal: "fideliser",
    label: "Traitement VIP des clients à forte valeur",
    objective: "Repérer les clients qui ont dépensé au moins 300 € et leur réserver un message personnel.",
    description: "Après une commande, vérifie le montant total dépensé : au-delà de 300 €, étiquette « vip » et e-mail personnel ; sinon attend jusqu'à 6 mois une nouvelle commande et revérifie. Un client sous le seuil ne reçoit rien.",
    trigger: { event: ORDER },
    note: "Le seuil (300 €) se règle dans les deux conditions du scénario. Le montant compte depuis l'activation du pont KOLAKISA. Aucun avantage n'est promis dans l'e-mail : décrivez le vôtre si vous en offrez un.",
    keywords: ["vip", "forte valeur", "meilleurs clients", "montant dépensé", "traitement vip"],
    emails: [mail("VIP", "Merci d'être parmi nos meilleurs élèves", "Un message personnel", "Un grand merci, {h}", "Vous faites partie de nos élèves les plus fidèles et nous tenions à vous le dire. Si vous avez une attente particulière, répondez à cet e-mail : nous vous lisons personnellement.", ["Voir mes formations", "accès"])],
    steps: flow([
      S.seg(spentAtLeast(300), "@vip", "next"),
      S.waitFor(ORDER, 180, "days"), S.seg(spentAtLeast(300), "@vip", "exit"),
      S.tag("vip", "vip"), S.email(0),
    ]),
  },
  {
    key: "client-a-risque", group: "loyalty", kind: "marketing", audience: "clients", goal: "retenir",
    label: "Prévenir le départ d'un client à risque",
    objective: "Aller vers un client que vous jugez sur le point de partir, avant qu'il ne soit perdu.",
    description: "Démarre quand vous ajoutez l'étiquette « client-à-risque » à un contact. Un e-mail pour savoir comment l'aider ; s'il l'ouvre, étiquette « suivi-en-cours », sinon un dernier message plus direct.",
    trigger: { event: "tag.added", filter: { key: "tag", value: "client-à-risque" } },
    note: "Pour le lancer : ajoutez l'étiquette « client-à-risque » (à la main, ou à tout un segment comme « aucune activité depuis 60 jours »). L'étiquette est retirée à la fin du parcours.",
    keywords: ["churn", "départ", "rétention", "à risque", "prévention"],
    emails: [
      mail("Comment aider", "Comment pouvons-nous vous aider ?", "Votre avis compte", "Tout se passe bien, {h} ?", "Nous avons remarqué que vous étiez moins présent(e). Y a-t-il quelque chose que nous pourrions améliorer ? Répondez simplement à cet e-mail, nous vous lirons attentivement.", ["Retrouver mes formations", "espace"]),
      mail("Dernier mot", "Un dernier mot de notre part", "Nous sommes là", "Nous restons à votre écoute", "{h}, si une formation ne vous convient pas ou si vous avez eu une difficulté, dites-le-nous : nous préférons vous aider que vous perdre.", ["Retrouver mes formations", "espace"]),
    ],
    steps: flow([
      S.email(0, "m0"), S.wait(5, "days"), S.opened("@m0", "@suivi", "@dernier"),
      S.untag("client-à-risque", "suivi"), S.tag("suivi-en-cours"), S.end(),
      S.email(1, "dernier"), S.untag("client-à-risque"),
    ]),
  },
  {
    key: "deuxieme-formation-terminee", group: "loyalty", kind: "marketing", audience: "eleves", goal: "fideliser",
    label: "Féliciter un élève qui termine une deuxième formation",
    objective: "Reconnaître les élèves qui vont au bout de plusieurs formations.",
    description: "Après une première formation terminée, attend jusqu'à un an une deuxième ; dès qu'elle est terminée, étiquette « élève-fidèle » et e-mail de félicitations.",
    trigger: { event: "lms.course_completed" },
    note: "Aucun e-mail si l'élève ne termine pas de seconde formation. Marketing : abonnés uniquement.",
    keywords: ["deux formations", "élève fidèle", "félicitations", "fidélité", "récompense"],
    emails: [mail("Deux formations", "Deux formations terminées : bravo !", "Votre persévérance paie", "Bravo, {h}", "Vous venez de terminer une deuxième formation : c'est la marque d'un vrai engagement. Nous serions ravis de connaître la suite de votre projet.", ["Voir le catalogue", "catalogue"])],
    steps: flow([S.waitFor("lms.course_completed", 365, "days"), S.seg(atLeast("lms.course_completed", 2), "next", "exit"), S.tag("élève-fidèle"), S.email(0)]),
  },
];
