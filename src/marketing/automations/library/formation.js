// Parcours propres à UNE formation, choisie au moment de l'utilisation (needs: ["course"]). Le déclencheur est filtré sur
// l'identifiant de la formation (filtre « courseId » des événements de formation), et les conditions de segment sont
// limitées à cette même formation (règle « course ») : un élève de la formation A n'entre jamais dans le parcours de B,
// et une leçon terminée dans B ne compte pas pour A. Les messages utilisent le titre réel de la formation de l'événement.
const { mail, step: S, flow, all, COURSE, forCourse, happenedForCourse, notWithinForCourse, neverForCourse, atLeastForCourse } = require("./dsl");

const FILTER = { key: "courseId", value: COURSE };
const LESSON = "lms.lesson_completed";
const NOTE = "Choisissez la formation au moment de l'utilisation : le parcours ne concerne que ses élèves (inscriptions, leçons et avis de cette formation seulement).";

module.exports = [
  {
    key: "bienvenue-formation-choisie", group: "courses", kind: "transactional", audience: "eleves", goal: "accueillir", needs: ["course"],
    label: "Bienvenue dans une formation précise",
    objective: "Accueillir les élèves d'une formation en particulier et les aider à faire le premier pas.",
    description: "Un e-mail de bienvenue dès l'inscription à la formation choisie ; trois jours plus tard, si aucune leçon de cette formation n'est terminée, un rappel pour commencer.",
    trigger: { event: "lms.course_enrolled", filter: FILTER },
    note: NOTE,
    keywords: ["formation spécifique", "produit spécifique", "inscription", "premier pas", "formation choisie"],
    emails: [
      mail("Bienvenue", "Bienvenue dans {{event.course_title}}", "Votre accès est prêt", "Bienvenue, {h}", "Vous êtes inscrit(e) à **{{event.course_title}}**. Vous pouvez commencer dès maintenant, à votre rythme : votre progression est enregistrée automatiquement.", ["Commencer la formation", "accès"], { kind: "transactional" }),
      mail("Premier pas", "Prêt(e) pour la première leçon ?", "{{event.course_title}}", "On s'y met ?", "{h}, **{{event.course_title}}** vous attend. La première leçon ne prend que quelques minutes : commencez aujourd'hui, le reste suivra.", ["Commencer la première leçon", "accès"], { kind: "transactional" }),
    ],
    steps: flow([S.email(0), S.waitFor(LESSON, 3, "days"), S.seg(happenedForCourse(LESSON, 3), "exit", "next"), S.email(1)]),
  },
  {
    key: "inscrits-sans-demarrer-formation-choisie", group: "courses", kind: "transactional", audience: "eleves", goal: "activer", needs: ["course"],
    label: "Relancer les inscrits qui n'ont pas commencé une formation",
    objective: "Faire démarrer les élèves d'une formation précise qui n'ont terminé aucune leçon.",
    description: "Sept jours après l'inscription, si aucune leçon de cette formation n'est terminée, un premier rappel ; sept jours plus tard, un second et dernier rappel s'ils n'ont toujours rien commencé.",
    trigger: { event: "lms.course_enrolled", filter: FILTER },
    note: `${NOTE} Version propre à une formation de « Encourager le démarrage » : activez l'un ou l'autre pour la même formation.`,
    keywords: ["jamais commencé", "non commencée", "relance", "formation spécifique", "inscrit"],
    emails: [
      mail("Rappel", "Votre formation vous attend", "{{event.course_title}}", "Un premier pas aujourd'hui ?", "{h}, vous êtes inscrit(e) à **{{event.course_title}}** mais n'avez pas encore terminé de leçon. La première ne prend que quelques minutes.", ["Commencer la formation", "accès"], { kind: "transactional" }),
      mail("Dernier rappel", "Reprenez {{event.course_title}} quand vous voulez", "Votre accès est toujours actif", "Elle est toujours à vous", "{h}, votre accès à **{{event.course_title}}** est toujours actif. Quand vous serez prêt(e), la première leçon vous attend.", ["Commencer la formation", "accès"], { kind: "transactional" }),
    ],
    steps: flow([
      S.wait(7, "days"), S.seg(neverForCourse(LESSON), "next", "exit"), S.email(0),
      S.wait(7, "days"), S.seg(neverForCourse(LESSON), "next", "exit"), S.email(1),
    ]),
  },
  {
    key: "inactivite-formation-choisie", group: "nurture", kind: "transactional", audience: "eleves", goal: "reengager", needs: ["course"],
    label: "Relancer un élève inactif sur une formation précise",
    objective: "Faire reprendre une formation précise à un élève qui n'a plus terminé de leçon depuis deux semaines.",
    description: "Quatorze jours après une leçon terminée de cette formation, vérifie qu'aucune autre leçon de la même formation n'a été terminée ; si l'élève s'est arrêté, un e-mail l'invite à reprendre.",
    trigger: { event: LESSON, filter: FILTER },
    note: `${NOTE} Une leçon terminée dans une autre formation ne compte pas.`,
    keywords: ["inactif", "abandon", "reprise", "14 jours", "formation spécifique"],
    emails: [mail("Reprise", "Reprenez {{event.course_title}}", "Votre progression est conservée", "Votre formation vous attend", "{h}, cela fait deux semaines que vous n'avez pas terminé de leçon dans **{{event.course_title}}**. Votre progression est conservée : reprenez où vous en étiez.", ["Reprendre ma formation", "accès"], { kind: "transactional" })],
    steps: flow([S.wait(14, "days"), S.seg(notWithinForCourse(LESSON, 14), "next", "exit"), S.email(0)]),
  },
  {
    key: "rythme-eleve-formation-choisie", group: "nurture", kind: "transactional", audience: "eleves", goal: "activer", needs: ["course"],
    label: "Féliciter un élève qui avance vite sur une formation précise",
    objective: "Encourager les élèves très actifs d'une formation : cinq leçons terminées ou plus en une semaine.",
    description: "Une semaine après la première leçon terminée de cette formation, si l'élève en a terminé au moins cinq dans la même formation, il reçoit un e-mail de félicitations.",
    trigger: { event: LESSON, filter: FILTER },
    note: `${NOTE} Le seuil (5) se modifie dans la condition du scénario.`,
    keywords: ["très actif", "rythme", "progression", "formation spécifique"],
    emails: [mail("Beau rythme", "Quel beau rythme sur {{event.course_title}} !", "Vous avancez vite", "Bravo, {h}", "Vous avez terminé plusieurs leçons de **{{event.course_title}}** en une semaine : c'est un excellent rythme. Continuez ainsi.", ["Continuer", "accès"], { kind: "transactional" })],
    steps: flow([S.wait(7, "days"), S.seg(atLeastForCourse(LESSON, 5), "next", "exit"), S.email(0)]),
  },
  {
    key: "felicitations-avis-formation-choisie", group: "feedback", kind: "transactional", audience: "eleves", goal: "avis", needs: ["course"],
    label: "Féliciter et demander un avis pour une formation précise",
    objective: "Féliciter les élèves qui terminent une formation donnée et recueillir leur avis sur cette formation.",
    description: "Un e-mail de félicitations à la formation terminée ; trois jours plus tard, si l'élève n'a pas publié d'avis sur cette formation, une demande d'avis avec le lien direct.",
    trigger: { event: "lms.course_completed", filter: FILTER },
    note: `${NOTE} Un avis publié sur une autre formation ne compte pas.`,
    keywords: ["avis", "félicitations", "certificat", "formation terminée", "formation spécifique"],
    emails: [
      mail("Félicitations", "Félicitations, {{event.course_title}} terminée", "Votre certificat est disponible", "Bravo {h}", "Vous avez terminé **{{event.course_title}}**. Votre certificat est disponible dans votre espace.", ["Voir mes formations", "accès"], { kind: "transactional" }),
      mail("Votre avis", "Votre avis sur {{event.course_title}}", "Une minute pour aider les futurs élèves", "Qu'avez-vous pensé de la formation ?", "{h}, votre avis aide les futurs élèves à choisir et nous aide à améliorer **{{event.course_title}}**. Cela prend une minute.", ["Donner mon avis", "formation"], { kind: "transactional" }),
    ],
    steps: flow([S.email(0), S.wait(3, "days"), S.seg(neverForCourse("lms.review_posted"), "next", "exit"), S.email(1)]),
  },
  {
    key: "suite-apres-formation-choisie", group: "courses", kind: "marketing", audience: "eleves", goal: "convertir", needs: ["course"],
    label: "Proposer la suite après une formation précise",
    objective: "Transformer la fin d'une formation donnée en prochain achat.",
    description: "Étiquette « a-terminé-une-formation », puis, deux jours après la fin de la formation choisie, un e-mail invite à découvrir les formations qui prolongent ce que l'élève vient d'apprendre.",
    trigger: { event: "lms.course_completed", filter: FILTER },
    note: `${NOTE} Marketing (abonnés uniquement). Ajoutez dans l'e-mail le nom de la formation que vous recommandez.`,
    keywords: ["recommandation", "formation complémentaire", "niveau supérieur", "suite", "cross-sell", "upsell", "formation spécifique"],
    emails: [mail("La suite", "Après {{event.course_title}}, quelle suite ?", "Poursuivez votre progression", "Et maintenant, {h} ?", "Vous avez terminé **{{event.course_title}}**. Pour prolonger ce que vous venez d'apprendre, découvrez nos autres formations.", ["Voir les autres formations", "catalogue"])],
    steps: flow([S.tag("a-terminé-une-formation"), S.wait(2, "days"), S.email(0)]),
  },
  {
    key: "favori-formation-choisie", group: "courses", kind: "marketing", audience: "eleves", goal: "convertir", needs: ["course"],
    label: "Relancer l'intérêt pour une formation précise (favori)",
    objective: "Convertir en inscription l'intérêt montré pour une formation donnée (mise en favori).",
    description: "Deux jours après qu'un élève a mis la formation choisie en favori, s'il ne s'y est pas inscrit, un e-mail lui rappelle cette formation avec le lien direct.",
    trigger: { event: "lms.favorite_added", filter: FILTER },
    note: `${NOTE} Marketing (abonnés uniquement). L'inscription ou l'achat de cette formation arrête la relance.`,
    keywords: ["favori", "intérêt", "relance", "formation spécifique", "produit spécifique"],
    emails: [mail("Formation favorite", "Toujours intéressé(e) par {{event.course_title}} ?", "Votre formation favorite vous attend", "Votre formation favorite vous attend", "{h}, vous avez mis **{{event.course_title}}** en favori. Consultez le programme pour vous décider.", ["Voir la formation", "formation"])],
    steps: flow([S.wait(2, "days"), S.seg(all(forCourse("event:lms.course_enrolled", "happened")), "exit", "next"), S.email(0)]),
  },
];
