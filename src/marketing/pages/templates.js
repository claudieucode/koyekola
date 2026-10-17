// Gabarits de pages (Site Web / Tunnels) : des points de départ faits des VRAIES sections du moteur, entièrement
// modifiables dans l'éditeur visuel. Aucun faux chiffre, aucun faux témoignage : les textes de départ disent ce qu'il
// faut écrire (« Remplacez… »). Les sections qui dépendent de données réelles (formation) ne sont ajoutées que si ces
// données existent ; la section d'inscription demande de choisir un formulaire avant publication (contrôlé à la
// publication, comme pour toute page).
const { listCourses } = require("../bridge/catalog");
const { PATTERNS } = require("./patterns");

// Blocs du Page Builder (sections libres faites d'éléments réels) réutilisés tels quels dans un gabarit
const block = (key, ctx) => PATTERNS.find((p) => p.key === key).build(ctx);

const hero = (title, subtitle, buttonLabel = "", buttonUrl = "", style) => ({ type: "hero", title, subtitle, image: "", imageAlt: "", buttonLabel, buttonUrl, ...(style ? { style } : {}) });
const text = (markdown, style) => ({ type: "text", markdown, ...(style ? { style } : {}) });
const list = (title, items) => ({ type: "list", title, items });
const features = (title, items, columns = 3) => ({ type: "features", title, intro: "", columns, items: items.map(([t, x]) => ({ title: t, text: x })) });
const faq = (items) => ({ type: "faq", title: "Questions fréquentes", items: items.map(([q, a]) => ({ q, a })) });
const cta = (title, body, buttonLabel, buttonUrl = "#inscription") => ({ type: "cta", title, text: body, buttonLabel, buttonUrl: buttonUrl.startsWith("#") ? "/catalogue" : buttonUrl, style: { background: "primary", padding: "lg" } });
const form = (heading, intro = "") => ({ type: "form", heading, intro });
const testimonials = () => ({ type: "testimonials", title: "Ils en parlent", items: [{ text: "Remplacez par le témoignage réel d'un élève ou d'un client, avec son accord.", author: "Prénom N.", role: "" }] });
const divider = () => ({ type: "divider", line: true, size: "md" });

// Formation du catalogue (la première publiée), seulement si elle existe
const courseOf = (ctx) => { const c = listCourses(ctx)[0]; return c ? { type: "course", courseId: c.id, cta: "Découvrir la formation" } : null; };

const TEMPLATES = [
  { key: "lead", category: "Génération de prospects", name: "Aimant à prospects", description: "Un bénéfice clair, trois raisons, le formulaire d'inscription.",
    build: () => [hero("Recevez gratuitement [votre ressource]", "Une phrase qui dit ce que la personne obtient, et en combien de temps.", "Je le veux", "/catalogue"), features("Ce que vous allez obtenir", [["Bénéfice 1", "Ce que la personne pourra faire."], ["Bénéfice 2", "Le problème que cela règle."], ["Bénéfice 3", "Le résultat concret."]]), form("Recevez-le maintenant", "Indiquez votre adresse : nous vous l'envoyons tout de suite.")] },
  { key: "vente", category: "Vente", name: "Page de vente", description: "Promesse, contenu, formation, témoignages, questions, appel à l'action.",
    build: (ctx) => [hero("[Le résultat promis] en [durée réaliste]", "Pour qui est cette offre, et ce qui change après.", "Voir le programme", "/catalogue"), text("## Le problème\n\nDécrivez la situation de la personne avant, avec ses mots."), list("Ce que vous allez apprendre", ["Premier savoir-faire", "Deuxième savoir-faire", "Troisième savoir-faire"]), courseOf(ctx), testimonials(), faq([["Pour qui est cette formation ?", "Précisez le niveau de départ attendu."], ["Combien de temps faut-il ?", "Indiquez la durée réelle du programme."]]), cta("Prêt à commencer ?", "Rappelez le bénéfice principal en une phrase.", "Je m'inscris", "/catalogue")] },
  { key: "webinaire", category: "Webinaire", name: "Inscription à un webinaire", description: "Date, programme, intervenant, inscription.",
    build: () => [hero("Webinaire gratuit : [sujet]", "[Jour, date, heure et fuseau horaire] — en ligne, durée [x] minutes."), list("Au programme", ["Point 1", "Point 2", "Point 3", "Questions-réponses en direct"]), text("## Votre intervenant\n\nPrésentez la personne qui anime, en deux ou trois phrases vérifiables."), form("Réservez votre place", "Vous recevrez le lien de connexion par e-mail.")] },
  { key: "formation", category: "Formation", name: "Présentation d'une formation", description: "La formation du catalogue mise en avant, avec son programme.",
    build: (ctx) => [hero("[Nom de la formation]", "Ce que l'élève saura faire à la fin."), courseOf(ctx), features("Comment se déroule la formation", [["À votre rythme", "Précisez le format (vidéos, exercices…)."], ["Accompagnement", "Indiquez ce qui est réellement prévu."], ["Certificat", "Un certificat est délivré en fin de formation."]]), faq([["Ai-je besoin d'un niveau particulier ?", "Précisez les prérequis."]]), cta("Commencez aujourd'hui", "Rappelez la promesse de la formation.", "Voir la formation", "/catalogue")] },
  { key: "produit", category: "Produit", name: "Présentation d'un produit", description: "Bénéfices, caractéristiques, questions.",
    build: () => [hero("[Nom du produit]", "Le bénéfice principal en une phrase."), features("Pourquoi le choisir", [["Caractéristique 1", "Ce qu'elle apporte."], ["Caractéristique 2", "Ce qu'elle apporte."], ["Caractéristique 3", "Ce qu'elle apporte."]]), text("## Comment l'utiliser\n\nExpliquez en quelques étapes simples."), faq([["Comment l'obtenir ?", "Expliquez la démarche réelle."]])] },
  { key: "service", category: "Service", name: "Présentation d'un service", description: "Ce que vous faites, pour qui, comment, contact.",
    build: () => [hero("[Votre service] pour [votre client idéal]", "Le résultat que vous apportez."), features("Ce que je fais pour vous", [["Étape 1", "Échange et diagnostic."], ["Étape 2", "Réalisation."], ["Étape 3", "Suivi."]]), testimonials(), form("Parlons de votre projet", "Laissez vos coordonnées : je vous recontacte.")] },
  { key: "newsletter", category: "Newsletter", name: "Inscription à la lettre", description: "Ce que contient la lettre, fréquence, inscription.",
    build: () => [hero("La lettre [nom]", "Chaque [semaine / mois] : [ce qu'on y trouve]."), list("Dans chaque lettre", ["Un conseil pratique", "Une ressource gratuite", "Les nouvelles formations"]), form("Je m'abonne", "Désinscription en un clic, à tout moment.")] },
  { key: "telechargement", category: "Téléchargement", name: "Ressource à télécharger", description: "Guide ou fichier offert contre l'inscription.",
    build: () => [hero("Téléchargez [nom de la ressource]", "[Nombre réel] pages pour [résultat]."), list("À l'intérieur", ["Chapitre 1", "Chapitre 2", "Chapitre 3"]), form("Recevoir le fichier", "Le lien de téléchargement vous est envoyé par e-mail.")] },
  { key: "lancement", category: "Lancement", name: "Lancement", description: "Annonce, nouveautés, appel à l'action.",
    build: () => [hero("[Nouveauté] est disponible", "Ce qui change pour vous, dès maintenant.", "Découvrir", "/catalogue", { background: "dark", width: "full", padding: "xl" }), features("Les nouveautés", [["Nouveauté 1", "Description."], ["Nouveauté 2", "Description."], ["Nouveauté 3", "Description."]]), cta("Profitez-en", "Précisez l'offre réelle et sa durée, s'il y en a une.", "J'en profite", "/catalogue")] },
  { key: "bientot", category: "Bientôt disponible", name: "Bientôt disponible", description: "Annonce et liste d'attente.",
    build: () => [hero("[Projet] arrive bientôt", "Inscrivez-vous pour être prévenu(e) en premier.", "", "", { align: "center", padding: "xl" }), form("Prévenez-moi", "Un seul e-mail à l'ouverture, puis vous choisissez.")] },
  { key: "inscription", category: "Inscription", name: "Inscription simple", description: "Une promesse et le formulaire, rien d'autre.",
    build: () => [hero("Inscrivez-vous", "Une phrase qui dit ce que la personne reçoit."), form("Inscription")] },
  { key: "consultation", category: "Consultation", name: "Prise de rendez-vous", description: "Déroulé de l'échange et demande de rendez-vous.",
    build: () => [hero("Un échange de [durée] pour [objectif]", "Gratuit et sans engagement — précisez si ce n'est pas le cas."), list("Pendant l'échange", ["Nous faisons le point sur votre situation", "Je vous propose un plan d'action", "Vous repartez avec des étapes claires"]), form("Demander un rendez-vous", "Indiquez vos disponibilités dans le formulaire.")] },
  // Page de remerciement (après une inscription, en particulier dans un tunnel)
  { key: "merci", category: "Remerciement", name: "Remerciement", description: "Confirmation de l'inscription et prochaine étape.",
    build: () => [hero("Merci, c'est noté !", "Vérifiez votre boîte de réception (et les courriers indésirables) : [ce qui arrive maintenant].", "", "", { align: "center", padding: "xl" }), text("## Et maintenant ?\n\nDites à la personne ce qu'elle peut faire en attendant : [lire un article, découvrir une formation…].")] },
  { key: "evenement", category: "Événement", name: "Événement", description: "Date, lieu, programme, inscription.",
    build: () => [hero("[Nom de l'événement]", "[Date] · [Lieu ou en ligne]"), text("## Programme\n\n- [Heure] : [séquence]\n- [Heure] : [séquence]"), divider(), faq([["Comment venir ?", "Précisez l'accès ou le lien."], ["Est-ce payant ?", "Indiquez le tarif réel."]]), form("Je m'inscris")] },
  { key: "apropos", category: "À propos", name: "À propos", description: "Votre histoire, vos valeurs, l'équipe, un appel à l'action.",
    build: (ctx) => [hero("[Qui nous sommes]", "[Votre mission en une phrase.]"), text("## Notre histoire\n\nRacontez en quelques lignes pourquoi vous avez commencé, et pour qui."), ...block("iconbox", ctx), ...block("team", ctx), cta("Envie d'en savoir plus ?", "Découvrez ce que nous proposons.", "Voir le catalogue", "/catalogue")] },
  { key: "contact", category: "Contact", name: "Contact", description: "Comment vous joindre, délai de réponse, formulaire.",
    build: () => [hero("Contactez-nous", "[Une phrase sur ce que vous pouvez faire pour la personne.]"), features("Avant d'écrire", [["Délai de réponse", "[Délai réel, ex. sous 48 h ouvrées.]"], ["Horaires", "[Vos horaires réels.]"], ["Questions fréquentes", "[Lien ou réponse aux demandes les plus courantes.]"]]), form("Écrivez-nous", "Vos coordonnées servent seulement à vous répondre.")] },
  { key: "portfolio", category: "Portfolio", name: "Portfolio", description: "Vos réalisations en cartes, des témoignages, un contact.",
    build: (ctx) => [hero("[Vos réalisations]", "[Le type de projets que vous menez, pour qui.]"), ...block("cards", ctx), testimonials(), cta("Un projet en tête ?", "Parlons-en.", "Me contacter", "/contact")] },
  { key: "saas", category: "Logiciel (SaaS)", name: "Logiciel en ligne", description: "Bandeau, atouts, tarifs, questions, appel à l'action.",
    build: (ctx) => [...block("hero-split", ctx), ...block("iconbox", ctx), ...block("pricing", ctx), ...block("faq", ctx), ...block("cta", ctx)] },
  { key: "faq", category: "Aide", name: "Questions fréquentes", description: "Un titre, les questions et réponses, un contact pour la suite.",
    build: (ctx) => [hero("Questions fréquentes", "[Une phrase qui dit à qui la page s'adresse.]", "", "", { align: "center" }), ...block("faq", ctx), cta("Une autre question ?", "Écrivez-nous, nous répondons.", "Nous contacter", "/")] },
  { key: "tarifs", category: "Tarifs", name: "Tarifs", description: "Trois formules comparées, questions fréquentes, appel à l'action.",
    build: (ctx) => [hero("Nos tarifs", "[Ce qui est inclus, en une phrase.]", "", "", { align: "center" }), ...block("pricing", ctx), ...block("faq", ctx), ...block("cta", ctx)] },
  { key: "temoignages", category: "Preuve sociale", name: "Témoignages", description: "Ce que disent vos clients (à remplacer par de vrais avis), puis un appel à l'action.",
    build: (ctx) => [hero("Ils nous font confiance", "[Qui sont-ils, en une phrase.]", "", "", { align: "center" }), testimonials(), ...block("cta", ctx)] },
  { key: "p404", category: "Erreur", name: "Page introuvable (404)", description: "Un message clair et un retour vers l'accueil ou le catalogue.",
    build: () => [hero("Cette page est introuvable", "Elle a peut-être été déplacée ou supprimée.", "Retour à l'accueil", "/", { align: "center", padding: "xl" })] },
  { key: "entreprise", category: "Entreprise", name: "Entreprise", description: "Ce que fait l'entreprise, ses services, ses chiffres réels, un contact.",
    build: (ctx) => [hero("[Nom de l'entreprise]", "[Ce que vous faites, pour qui.]"), features("Nos services", [["[Service 1]", "Ce qu'il apporte."], ["[Service 2]", "Ce qu'il apporte."], ["[Service 3]", "Ce qu'il apporte."]]), ...block("stats", ctx), testimonials(), form("Demander un rendez-vous", "Nous revenons vers vous rapidement.")] },
];

// Sections d'un gabarit (sections absentes faute de données retirées) ; null si la clé est inconnue
function buildTemplate(ctx, key) {
  const t = TEMPLATES.find((x) => x.key === key);
  return t ? t.build(ctx).filter(Boolean) : null;
}
const catalog = () => TEMPLATES.map(({ key, category, name, description }) => ({ key, category, name, description }));

module.exports = { TEMPLATES, buildTemplate, catalog };
