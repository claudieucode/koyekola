// Bibliothèque de modèles de départ : des points de départ à personnaliser (jamais de contenu promotionnel imposé).
// Chacun est vérifié par les tests : valide pour le moteur, prêt à l'envoi, variables avec valeur par défaut, aucune adresse
// réelle (les liens « https://exemple.fr » sont des exemples à remplacer), objet court et sans majuscules ni exclamations.
const HELLO = '{{contact.first_name | default:"cher(e) membre"}}';
const LINK = "https://exemple.fr";

const STARTERS = {
  blank: {
    label: "Message simple",
    description: "Un titre et un texte, pour écrire librement.",
    category: "general",
    template: {
      subject: "Un message de {{org.name}}",
      preheader: "Un petit mot de notre équipe",
      blocks: [
        { type: "heading", text: `Bonjour ${HELLO}`, level: 1 },
        { type: "text", markdown: `Écrivez votre message ici. Vous pouvez mettre du **gras**, de l'*italique* et des [liens](${LINK}).` },
      ],
    },
  },
  welcome: {
    label: "Bienvenue aux nouveaux contacts",
    description: "Un accueil chaleureux, ce que le contact peut faire, un bouton et les réseaux sociaux.",
    category: "welcome",
    template: {
      subject: "Bienvenue chez {{org.name}}",
      preheader: "Voici comment bien démarrer",
      blocks: [
        { type: "heading", text: `Bienvenue, ${HELLO}`, level: 1 },
        { type: "text", markdown: "Nous sommes ravis de vous compter parmi nous. Voici trois façons de bien démarrer :" },
        { type: "list", style: "checks", items: ["Parcourez le catalogue de formations", "Suivez votre première leçon", "Répondez à cet e-mail pour poser une question"] },
        { type: "button", label: "Découvrir le catalogue", url: LINK, align: "left" },
        { type: "divider" },
        { type: "social", links: [{ network: "facebook", url: LINK }, { network: "youtube", url: LINK }], align: "left" },
      ],
    },
  },
  welcome_course: {
    label: "Bienvenue dans votre formation",
    description: "Pour accueillir un élève : ce qui l'attend, comment progresser, un mot d'encouragement.",
    category: "welcome",
    template: {
      subject: "Votre formation commence maintenant",
      preheader: "Quelques conseils pour avancer à votre rythme",
      blocks: [
        { type: "heading", text: `Prêt(e) à commencer, ${HELLO} ?`, level: 1, align: "center" },
        { type: "text", markdown: "Votre formation est disponible dès maintenant. Avancez à votre rythme, un peu chaque jour." },
        { type: "list", style: "numbers", items: ["Regardez la première leçon", "Notez vos questions", "Terminez un chapitre par semaine"] },
        { type: "quote", text: "Le plus dur, c'est de commencer.", author: "L'équipe" },
        { type: "button", label: "Accéder à mes formations", url: LINK, align: "center" },
      ],
    },
  },
  newsletter: {
    label: "Lettre d'information",
    description: "Titre, introduction, bouton d'action et section d'actualités.",
    category: "newsletter",
    template: {
      subject: "Les nouveautés du mois chez {{org.name}}",
      preheader: "Ce qu'il faut retenir ce mois-ci",
      blocks: [
        { type: "heading", text: "Les nouveautés du mois", level: 1 },
        { type: "text", markdown: `Bonjour ${HELLO},\n\nVoici ce qu'il faut retenir ce mois-ci.` },
        { type: "button", label: "Découvrir", url: LINK, align: "left" },
        { type: "divider" },
        { type: "text", markdown: "## À la une\n\n- Première actualité\n- Deuxième actualité\n- Troisième actualité" },
      ],
    },
  },
  newsletter_editorial: {
    label: "Lettre éditoriale",
    description: "Un édito, une citation, une vidéo mise en avant et deux colonnes d'actualités.",
    category: "newsletter",
    template: {
      subject: "Le mot de l'équipe et nos actualités",
      preheader: "Un édito, une vidéo et deux nouveautés",
      blocks: [
        { type: "heading", text: "Ce mois-ci, en quelques mots", level: 1 },
        { type: "text", markdown: `Bonjour ${HELLO},\n\nRacontez ici ce qui compte pour vous et pour vos lecteurs ce mois-ci.` },
        { type: "quote", text: "Une idée forte, en une phrase.", author: "Prénom Nom" },
        { type: "video", url: LINK, title: "Regarder la vidéo du mois", align: "center" },
        { type: "columns", left: "## Actualité 1\n\nDécrivez-la en deux phrases.", right: "## Actualité 2\n\nDécrivez-la en deux phrases." },
        { type: "button", label: "Lire la suite", url: LINK, align: "center" },
      ],
    },
  },
  course: {
    label: "Annonce d'une formation",
    description: "Présentation d'une nouvelle formation en deux colonnes, avec un bouton.",
    category: "course",
    template: {
      subject: "Nouvelle formation : découvrez-la en avant-première",
      preheader: "Une nouvelle formation vient d'être publiée",
      blocks: [
        { type: "heading", text: "Une nouvelle formation vous attend", level: 1, align: "center" },
        { type: "text", markdown: `Bonjour ${HELLO}, nous venons de publier une nouvelle formation.` },
        { type: "columns", left: "## Ce que vous apprendrez\n\n- Un premier objectif\n- Un deuxième objectif", right: "## À qui elle s'adresse\n\nDécrivez ici le public visé." },
        { type: "button", label: "Voir la formation", url: LINK, align: "center" },
      ],
    },
  },
  course_launch: {
    label: "Lancement d'une formation",
    description: "Vidéo de présentation, programme en coches, témoignage et bouton d'inscription.",
    category: "course",
    template: {
      subject: "Notre nouvelle formation ouvre ses portes",
      preheader: "Découvrez le programme en vidéo",
      blocks: [
        { type: "heading", text: "Notre nouvelle formation est ouverte", level: 1 },
        { type: "video", url: LINK, title: "Présentation de la formation", align: "center" },
        { type: "text", markdown: `Bonjour ${HELLO}, voici ce que vous trouverez dans cette formation :` },
        { type: "list", style: "checks", items: ["Un programme clair, leçon par leçon", "Des exercices pour pratiquer", "Un certificat à la fin"] },
        { type: "quote", text: "J'ai enfin compris, pas à pas.", author: "Une élève" },
        { type: "button", label: "Je m'inscris", url: LINK, align: "center" },
        { type: "social", links: [{ network: "instagram", url: LINK }, { network: "linkedin", url: LINK }], align: "center" },
      ],
    },
  },
  promo: {
    label: "Offre spéciale",
    description: "Une offre limitée dans le temps : avantages, bouton et conditions en petit.",
    category: "promo",
    template: {
      subject: "Une offre pour vous, valable quelques jours",
      preheader: "Découvrez les avantages de cette offre",
      blocks: [
        { type: "heading", text: "Une offre rien que pour vous", level: 1, align: "center" },
        { type: "text", markdown: `Bonjour ${HELLO}, profitez de notre offre jusqu'à la date indiquée ci-dessous.` },
        { type: "list", style: "bullets", items: ["Premier avantage de l'offre", "Deuxième avantage", "Troisième avantage"] },
        { type: "button", label: "Profiter de l'offre", url: LINK, align: "center" },
        { type: "divider" },
        { type: "text", markdown: "*Conditions : décrivez ici la durée et les limites de l'offre.*" },
      ],
    },
  },
  webinar: {
    label: "Invitation à un webinaire",
    description: "Date, programme et bouton d'inscription pour un événement en ligne.",
    category: "event",
    template: {
      subject: "Invitation : rejoignez-nous en direct",
      preheader: "Une session en ligne pour poser vos questions",
      blocks: [
        { type: "heading", text: "Rejoignez-nous en direct", level: 1 },
        { type: "text", markdown: `Bonjour ${HELLO}, nous vous invitons à un webinaire.\n\n**Date :** à préciser  \n**Durée :** à préciser` },
        { type: "list", style: "checks", items: ["Présentation en direct", "Temps de questions-réponses", "Replay envoyé aux inscrits"] },
        { type: "button", label: "Réserver ma place", url: LINK, align: "left" },
        { type: "social", links: [{ network: "youtube", url: LINK }], align: "left" },
      ],
    },
  },
  reengage: {
    label: "On ne vous voit plus",
    description: "Reprendre contact avec un contact inactif, sans pression.",
    category: "reengage",
    template: {
      subject: "Cela fait un moment, {{contact.first_name | default:\"on pense à vous\"}}",
      preheader: "Un petit rappel, sans engagement",
      blocks: [
        { type: "heading", text: "Vous nous manquez", level: 1 },
        { type: "text", markdown: `Bonjour ${HELLO},\n\nCela fait un moment que nous ne vous avons pas vu(e). Voici de quoi reprendre en douceur.` },
        { type: "button", label: "Reprendre où j'en étais", url: LINK, align: "left" },
        { type: "text", markdown: "Si ces messages ne vous conviennent plus, vous pouvez vous désinscrire à tout moment en bas de cet e-mail." },
      ],
    },
  },
  feedback: {
    label: "Votre avis nous intéresse",
    description: "Demander un avis ou un témoignage, avec une citation d'exemple.",
    category: "reengage",
    template: {
      subject: "Votre avis compte pour nous",
      preheader: "Deux minutes pour nous aider à nous améliorer",
      blocks: [
        { type: "heading", text: "Votre avis nous intéresse", level: 1, align: "center" },
        { type: "text", markdown: `Bonjour ${HELLO}, votre expérience nous aide à progresser.` },
        { type: "quote", text: "Un exemple d'avis reçu d'un autre membre.", author: "Un membre" },
        { type: "button", label: "Donner mon avis", url: LINK, align: "center" },
      ],
    },
  },
  order_confirmation: {
    label: "Confirmation de commande",
    description: "Récapitulatif d'une commande (automatisation « commande passée »).",
    category: "transactional",
    template: {
      kind: "transactional",
      subject: "Votre commande est confirmée",
      preheader: "Merci pour votre achat",
      blocks: [
        { type: "heading", text: `Merci ${HELLO}`, level: 1 },
        { type: "text", markdown: "Votre commande **n° {{event.order_id}}** d'un montant de **{{event.order_total}}** est confirmée." },
        { type: "button", label: "Accéder à mes formations", url: "{{event.learn_url}}", align: "left" },
      ],
    },
  },
  enrollment_confirmation: {
    label: "Inscription à une formation",
    description: "Confirmation d'inscription (automatisation « inscription à une formation »).",
    category: "transactional",
    template: {
      kind: "transactional",
      subject: "Vous êtes inscrit(e) : {{event.course_title}}",
      preheader: "Votre formation est prête",
      blocks: [
        { type: "heading", text: "Inscription confirmée", level: 1 },
        { type: "text", markdown: `Bonjour ${HELLO}, vous êtes bien inscrit(e) à **{{event.course_title}}**.` },
        { type: "button", label: "Commencer la formation", url: "{{event.course_url}}", align: "left" },
      ],
    },
  },
  lesson_done: {
    label: "Leçon terminée",
    description: "Encouragement après une leçon terminée (automatisation « leçon terminée »).",
    category: "transactional",
    template: {
      kind: "transactional",
      subject: "Bravo pour votre progression",
      preheader: "Une leçon de plus derrière vous",
      blocks: [
        { type: "heading", text: `Bravo ${HELLO}`, level: 1 },
        { type: "text", markdown: "Vous venez de terminer la leçon **{{event.lesson_title}}** dans **{{event.course_title}}**. Continuez sur votre lancée." },
        { type: "button", label: "Continuer", url: "{{event.course_url}}", align: "left" },
      ],
    },
  },
  course_done: {
    label: "Formation terminée",
    description: "Félicitations à la fin d'une formation (automatisation « formation terminée »).",
    category: "transactional",
    template: {
      kind: "transactional",
      subject: "Félicitations, formation terminée",
      preheader: "Vous êtes allé(e) au bout",
      blocks: [
        { type: "heading", text: `Félicitations ${HELLO}`, level: 1, align: "center" },
        { type: "text", markdown: "Vous avez terminé **{{event.course_title}}**. C'est un vrai accomplissement." },
        { type: "button", label: "Voir mes formations", url: "{{event.learn_url}}", align: "center" },
      ],
    },
  },
};

module.exports = { STARTERS };
