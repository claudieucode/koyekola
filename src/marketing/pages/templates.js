// Gabarits de pages (Site Web / Tunnels) : des points de départ faits des VRAIES sections du moteur, entièrement
// modifiables dans l'éditeur visuel. Aucun faux chiffre, aucun faux témoignage : les textes de départ disent ce qu'il
// faut écrire (« Remplacez… »). Les sections qui dépendent de données réelles (formation) ne sont ajoutées que si ces
// données existent ; la section d'inscription demande de choisir un formulaire avant publication (contrôlé à la
// publication, comme pour toute page).
const { listCourses } = require("../bridge/catalog");
const { PATTERNS } = require("./patterns");

// Blocs du Page Builder (sections libres faites d'éléments réels) réutilisés tels quels dans un gabarit
const block = (key, ctx) => PATTERNS.find((p) => p.key === key).build(ctx);

// Colonne d'aperçu étroite : une grille de blocs natifs passe à n colonnes (la dernière carte seule occupe toute la largeur) pour que les titres ne soient jamais coupés
const regrid = (secs, n = 2) => { const walk = (x) => { if (Array.isArray(x)) return x.forEach(walk); if (!x || typeof x !== "object") return; if (x.type === "grid" && x.styles && x.styles.desktop && x.children && x.children.length > n) { x.styles.desktop.columns = n; delete x.styles.desktop.gridTemplate; const rest = x.children.length % n; if (rest === 1) { const last = x.children[x.children.length - 1]; last.styles = last.styles || {}; last.styles.desktop = { ...(last.styles.desktop || {}), gridColumnSpan: n }; } } if (x.children) walk(x.children); }; walk(secs); return secs; };
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
    build: (ctx) => [hero("[Nom de la formation]", "Ce que l'élève saura faire à la fin."), courseOf(ctx), features("Comment se déroule la formation", [["À votre rythme", "Précisez le format (vidéos, exercices…)."], ["Accompagnement", "Indiquez ce qui est réellement prévu."], ["Certificat", "Un certificat est délivré en fin de formation."]], 2), faq([["Ai-je besoin d'un niveau particulier ?", "Précisez les prérequis."]]), cta("Commencez aujourd'hui", "Rappelez la promesse de la formation.", "Voir la formation", "/catalogue")] },
  { key: "produit", category: "Produit", name: "Présentation d'un produit", description: "Bénéfices, caractéristiques, questions.",
    build: () => [hero("[Nom du produit]", "Le bénéfice principal en une phrase."), features("Pourquoi le choisir", [["Caractéristique 1", "Ce qu'elle apporte."], ["Caractéristique 2", "Ce qu'elle apporte."], ["Caractéristique 3", "Ce qu'elle apporte."]]), text("## Comment l'utiliser\n\nExpliquez en quelques étapes simples."), faq([["Comment l'obtenir ?", "Expliquez la démarche réelle."]])] },
  { key: "service", category: "Service", name: "Présentation d'un service", description: "Ce que vous faites, pour qui, comment, contact.",
    build: () => [hero("[Votre service] pour [votre client idéal]", "Le résultat que vous apportez."), features("Ce que je fais pour vous", [["Étape 1", "Échange et diagnostic."], ["Étape 2", "Réalisation."], ["Étape 3", "Suivi."]]), testimonials(), form("Parlons de votre projet", "Laissez vos coordonnées : je vous recontacte.")] },
  { key: "newsletter", category: "Newsletter", name: "Inscription à la lettre", description: "Ce que contient la lettre, fréquence, inscription.",
    build: () => [hero("La lettre [nom]", "Chaque [semaine / mois] : [ce qu'on y trouve]."), list("Dans chaque lettre", ["Un conseil pratique", "Une ressource gratuite", "Les nouvelles formations"]), form("Je m'abonne", "Désinscription en un clic, à tout moment.")] },
  { key: "telechargement", category: "Téléchargement", name: "Ressource à télécharger", description: "Guide ou fichier offert contre l'inscription.",
    build: (ctx) => [...block("hero-split", ctx), ...block("benefits", ctx), form("Recevoir le fichier", "Le lien de téléchargement vous est envoyé par e-mail.")] },
  { key: "lancement", category: "Lancement", name: "Lancement", description: "Annonce, nouveautés, appel à l'action.",
    build: () => [hero("[Nouveauté] est disponible", "Ce qui change pour vous, dès maintenant.", "Découvrir", "/catalogue", { background: "primary", width: "full", padding: "xl" }), features("Les nouveautés", [["Nouveauté 1", "Description."], ["Nouveauté 2", "Description."], ["Nouveauté 3", "Description."]]), cta("Profitez-en", "Précisez l'offre réelle et sa durée, s'il y en a une.", "J'en profite", "/catalogue")] },
  { key: "bientot", category: "Bientôt disponible", name: "Bientôt disponible", description: "Annonce et liste d'attente.",
    build: () => [hero("[Projet] arrive bientôt", "Inscrivez-vous pour être prévenu(e) en premier.", "", "", { align: "center", padding: "xl" }), form("Prévenez-moi", "Un seul e-mail à l'ouverture, puis vous choisissez.")] },
  { key: "inscription", category: "Inscription", name: "Inscription simple", description: "Une promesse et le formulaire, rien d'autre.",
    build: (ctx) => [...block("media-text", ctx), form("Inscription")] },
  { key: "consultation", category: "Consultation", name: "Prise de rendez-vous", description: "Déroulé de l'échange et demande de rendez-vous.",
    build: (ctx) => [...block("cover", ctx), ...block("steps", ctx), form("Demander un rendez-vous", "Indiquez vos disponibilités dans le formulaire."), ...block("faq", ctx)] },
  // Page de remerciement (après une inscription, en particulier dans un tunnel)
  { key: "merci", category: "Remerciement", name: "Remerciement", description: "Confirmation de l'inscription et prochaine étape.",
    build: () => [hero("Merci, c'est noté !", "Vérifiez votre boîte de réception (et les courriers indésirables) : [ce qui arrive maintenant].", "", "", { align: "center", padding: "xl" }), text("## Et maintenant ?\n\nDites à la personne ce qu'elle peut faire en attendant : [lire un article, découvrir une formation…].")] },
  { key: "evenement", category: "Événement", name: "Événement", description: "Date, lieu, programme, inscription.",
    build: () => [hero("[Nom de l'événement]", "[Date] · [Lieu ou en ligne]"), text("## Programme\n\n- [Heure] : [séquence]\n- [Heure] : [séquence]"), divider(), faq([["Comment venir ?", "Précisez l'accès ou le lien."], ["Est-ce payant ?", "Indiquez le tarif réel."]]), form("Je m'inscris")] },
  { key: "apropos", category: "À propos", name: "À propos", description: "Votre histoire, vos valeurs, l'équipe, un appel à l'action.",
    build: (ctx) => [hero("[Qui nous sommes]", "[Votre mission en une phrase.]"), text("## Notre histoire\n\nRacontez en quelques lignes pourquoi vous avez commencé, et pour qui."), ...block("iconbox", ctx), ...block("team", ctx), cta("Envie d'en savoir plus ?", "Découvrez ce que nous proposons.", "Voir le catalogue", "/catalogue")] },
  { key: "contact", category: "Contact", name: "Contact", description: "Comment vous joindre, délai de réponse, formulaire.",
    build: (ctx) => [hero("Contactez-nous", "[Une phrase sur ce que vous pouvez faire pour la personne. Délai de réponse réel : à préciser.]"), ...block("contact-info", ctx), form("Écrivez-nous", "Vos coordonnées servent seulement à vous répondre."), ...block("logos", ctx)] },
  { key: "portfolio", category: "Portfolio", name: "Portfolio", description: "Vos réalisations en cartes, des témoignages, un contact.",
    build: (ctx) => [hero("[Vos réalisations]", "[Le type de projets que vous menez, pour qui.]"), ...block("cards", ctx), testimonials(), cta("Un projet en tête ?", "Parlons-en.", "Me contacter", "/contact")] },
  { key: "saas", category: "Logiciel (SaaS)", name: "Logiciel en ligne", description: "Bandeau, atouts, tarifs, questions, appel à l'action.",
    build: (ctx) => [...block("hero-split", ctx), ...block("iconbox", ctx), ...regrid(block("pricing", ctx)), ...block("faq", ctx), ...block("cta", ctx)] },
  { key: "faq", category: "Aide", name: "Questions fréquentes", description: "Un titre, les questions et réponses, un contact pour la suite.",
    build: (ctx) => [hero("Questions fréquentes", "[Une phrase qui dit à qui la page s'adresse.]", "", "", { align: "center" }), ...block("faq", ctx), cta("Une autre question ?", "Écrivez-nous, nous répondons.", "Nous contacter", "/")] },
  { key: "tarifs", category: "Tarifs", name: "Tarifs", description: "Trois formules comparées, questions fréquentes, appel à l'action.",
    build: (ctx) => [hero("Nos tarifs", "[Ce qui est inclus, en une phrase.]", "", "", { align: "center" }), ...regrid(block("pricing", ctx)), ...block("faq", ctx), ...block("cta", ctx)] },
  { key: "temoignages", category: "Preuve sociale", name: "Témoignages", description: "Ce que disent vos clients (à remplacer par de vrais avis), puis un appel à l'action.",
    build: (ctx) => [hero("Ils nous font confiance", "[Qui sont-ils, en une phrase.]", "", "", { align: "center" }), testimonials(), ...block("cta", ctx)] },
  { key: "p404", category: "Erreur", name: "Page introuvable (404)", description: "Un message clair et un retour vers l'accueil ou le catalogue.",
    build: () => [hero("Cette page est introuvable", "Elle a peut-être été déplacée ou supprimée.", "Retour à l'accueil", "/", { align: "center", padding: "xl" })] },
  { key: "entreprise", category: "Entreprise", name: "Entreprise", description: "Ce que fait l'entreprise, ses services, ses chiffres réels, un contact.",
    build: (ctx) => [hero("[Nom de l'entreprise]", "[Ce que vous faites, pour qui.]"), features("Nos services", [["[Service 1]", "Ce qu'il apporte."], ["[Service 2]", "Ce qu'il apporte."], ["[Service 3]", "Ce qu'il apporte."]]), ...block("stats", ctx), testimonials(), form("Demander un rendez-vous", "Nous revenons vers vous rapidement.")] },
  // ---- Programme 20.4 : gabarits par secteur. Les textes entre crochets sont des CONSIGNES à remplacer : aucun faux chiffre, nom, prix, adresse, horaire ni témoignage. ----
  { key: "agence-accueil", category: "Agence", name: "Agence — accueil", description: "Promesse, expertises, méthode, partenaires, preuves et appel à l'action.",
    build: (ctx) => [hero("[Nom de l'agence] : [ce que vous faites gagner à vos clients]", "[Votre positionnement en une phrase : pour qui, avec quel résultat.]", "Voir nos réalisations", "/contact"), features("Nos expertises", [["[Expertise 1]", "Ce que vous faites, concrètement."], ["[Expertise 2]", "Ce que vous faites, concrètement."], ["[Expertise 3]", "Ce que vous faites, concrètement."]]), ...block("process-4", ctx), ...block("logos", ctx), ...block("testimonials", ctx), cta("Un projet en tête ?", "Parlons de vos objectifs.", "Nous contacter", "/contact")] },
  { key: "agence-services", category: "Agence", name: "Agence — services", description: "Chaque service détaillé, prestations avec prix à renseigner et questions fréquentes.",
    build: (ctx) => [hero("Nos services", "[Pour qui, et ce que chaque service permet d'obtenir.]"), features("Ce que nous faisons", [["[Service 1]", "Le résultat attendu."], ["[Service 2]", "Le résultat attendu."], ["[Service 3]", "Le résultat attendu."], ["[Service 4]", "Le résultat attendu."]], 2), ...block("services-prices", ctx), ...block("faq", ctx), cta("Besoin d'un devis ?", "Décrivez votre projet, nous répondons rapidement.", "Demander un devis", "/contact")] },
  { key: "agence-methode", category: "Agence", name: "Agence — méthode", description: "Les étapes de collaboration, du premier échange à la livraison.",
    build: (ctx) => [hero("Notre méthode", "[Comment un projet se déroule, avec vos points de validation.]"), ...block("process-4", ctx), ...block("steps", ctx), cta("Commençons par un échange", "[Durée et format du premier rendez-vous.]", "Prendre contact", "/contact")] },
  { key: "portfolio-accueil", category: "Portfolio", name: "Portfolio — accueil", description: "Une présentation courte, une grille de projets, un appel à l'action.",
    build: (ctx) => [hero("[Votre nom] — [votre métier]", "[Ce que vous créez, et pour qui.]", "Voir mes projets", "/contact", { align: "center", padding: "xl" }), ...block("project-grid", ctx), text("## À propos\n\n[Quelques lignes sur votre parcours et votre approche.]"), ...block("quote-large", ctx), cta("Travaillons ensemble", "[Vos disponibilités réelles.]", "Me contacter", "/contact")] },
  { key: "resto-accueil", category: "Restauration", name: "Restaurant — accueil", description: "Ambiance, atouts, horaires, accès et réservation.",
    build: (ctx) => [hero("[Nom du restaurant]", "[Type de cuisine · ville]", "Réserver une table", "/contact", { background: "primary", width: "full", padding: "xl" }), features("Ce qui fait notre table", [["[Atout 1]", "Produits, savoir-faire, ambiance : décrivez le vrai."], ["[Atout 2]", "Produits, savoir-faire, ambiance : décrivez le vrai."], ["[Atout 3]", "Produits, savoir-faire, ambiance : décrivez le vrai."]]), ...block("hours", ctx), ...block("contact-info", ctx), cta("Envie de venir ?", "[Délai de réservation conseillé.]", "Réserver", "/contact")] },
  { key: "resto-carte", category: "Restauration", name: "Restaurant — carte", description: "Entrées, plats, desserts avec prix à renseigner et information sur les allergènes.",
    build: (ctx) => [hero("Notre carte", "[Saison, origine des produits, formules.]"), ...block("menu-carte", ctx), text("**Allergènes** : [indiquez comment obtenir la liste des allergènes de chaque plat.]"), cta("Réserver une table", "[Informations utiles : groupes, enfants, régimes.]", "Réserver", "/contact")] },
  { key: "resto-reservation", category: "Restauration", name: "Restaurant — réservation", description: "Comment réserver, formulaire de demande et horaires.",
    build: (ctx) => [hero("Réserver une table", "[Délai de réponse réel et moyens de réservation.]"), form("Demande de réservation", "Indiquez la date, l'heure et le nombre de personnes."), ...block("hours", ctx)] },
  { key: "immo-accueil", category: "Immobilier", name: "Immobilier — accueil", description: "Biens à la une, services, méthode et demande d'estimation.",
    build: (ctx) => [hero("[Nom de l'agence immobilière]", "[Zone géographique et spécialités.]", "Voir les biens", "/contact"), ...block("listings", ctx), features("Nos services", [["Achat", "[Votre accompagnement.]"], ["Vente", "[Votre accompagnement.]"], ["Location et gestion", "[Votre accompagnement.]"]]), ...block("process-4", ctx), cta("Estimer votre bien", "[Délai et conditions de l'estimation.]", "Demander une estimation", "/contact")] },
  { key: "immo-biens", category: "Immobilier", name: "Immobilier — biens", description: "Une sélection de biens en cartes à remplacer par vos annonces réelles.",
    build: (ctx) => [hero("Nos biens", "[Critères de sélection, zones couvertes.]"), ...block("listings", ctx), ...block("faq", ctx)] },
  { key: "immo-estimation", category: "Immobilier", name: "Immobilier — estimation", description: "Pourquoi demander une estimation, comment elle se déroule, formulaire.",
    build: (ctx) => [hero("Faire estimer votre bien", "[Gratuit ou payant : précisez.]"), list("Comment ça se passe", ["Vous décrivez votre bien", "Nous vous recontactons sous [délai réel]", "Visite et estimation argumentée"]), form("Demander une estimation", "Adresse du bien, type, surface."), ...block("faq", ctx)] },
  { key: "blog-accueil", category: "Blog", name: "Blog — accueil", description: "Présentation de la ligne éditoriale, derniers articles réels du blog et inscription à la lettre.",
    build: (ctx) => [hero("[Nom du blog]", "[Sujets traités et pour qui.]", "", "", { align: "center", padding: "xl" }), ...block("blog-latest", ctx), ...block("newsletter", ctx)] },
  { key: "boutique-accueil", category: "Boutique", name: "Boutique de formations — accueil", description: "Promesse, catalogue en direct des formations publiées, garanties à renseigner et questions.",
    build: (ctx) => [hero("[Nom de la boutique]", "[Ce que vous vendez et à qui.]", "Voir le catalogue", "/catalogue"), ...block("catalogue-live", ctx), features("Pourquoi acheter chez nous", [["[Garantie 1]", "Une promesse réelle et tenue."], ["[Garantie 2]", "Une promesse réelle et tenue."], ["[Garantie 3]", "Une promesse réelle et tenue."]]), ...block("faq", ctx)] },
  { key: "asso-accueil", category: "Association", name: "Association — accueil", description: "Mission, valeurs, actions, chiffres réels et invitation à rejoindre.",
    build: (ctx) => [hero("[Nom de l'association]", "[Votre mission en une phrase.]", "Nous rejoindre", "/contact"), ...regrid(block("values", ctx)), ...block("stats", ctx), cta("Agir avec nous", "[Comment participer concrètement.]", "Nous rejoindre", "/contact")] },
  { key: "asso-missions", category: "Association", name: "Association — actions", description: "Les actions menées, l'équipe et la façon de s'impliquer.",
    build: (ctx) => [hero("Nos actions", "[Où, avec qui, depuis quand.]"), features("Ce que nous faisons", [["[Action 1]", "Public concerné et résultat."], ["[Action 2]", "Public concerné et résultat."], ["[Action 3]", "Public concerné et résultat."]]), ...block("team", ctx), cta("S'impliquer", "[Bénévolat, adhésion, partenariat.]", "Nous contacter", "/contact")] },
  { key: "asso-adhesion", category: "Association", name: "Association — adhésion", description: "Pourquoi adhérer, ce que cela implique, formulaire.",
    build: (ctx) => [hero("Adhérer", "[Montant et durée de la cotisation : à renseigner.]"), ...block("benefits", ctx), ...regrid(block("pricing", ctx)), form("Demande d'adhésion", "Vos coordonnées et votre motivation.")] },
  { key: "asso-soutenir", category: "Association", name: "Association — nous soutenir", description: "Les façons de soutenir l'association ; aucun paiement n'est intégré à ce modèle.",
    build: (ctx) => [...block("hero", ctx), ...block("bento", ctx), ...block("quote-large", ctx), cta("Parlons-en", "[Contact dédié. Don : indiquez le moyen que vous gérez, le modèle n'en fournit pas.]", "Nous contacter", "/contact")] },
  { key: "boutique-produits-accueil", category: "Boutique", name: "Boutique en ligne — accueil", description: "Promesse, produits à la une et en promotion de la vraie boutique du site, garanties à renseigner, questions.",
    build: (ctx) => [hero("[Nom de la boutique]", "[Ce que vous vendez, et ce qui vous distingue.]", "Voir le catalogue", "/boutique"), ...block("shop-featured", ctx), features("Pourquoi acheter chez nous", [["Livraison", "[Délais et zones réels.]"], ["Retours", "[Conditions réelles.]"], ["Paiement", "[Moyens de paiement acceptés.]"]]), ...block("shop-sale", ctx), ...block("faq", ctx)] },
  { key: "boutique-catalogue", category: "Boutique", name: "Boutique en ligne — catalogue", description: "Recherche, filtres et grille des produits de la boutique (suit la catégorie et la recherche de l'adresse).",
    build: (ctx) => [hero("Notre catalogue", "[Une phrase sur l'assortiment.]"), ...block("shop-search", ctx), ...block("shop-archive", ctx)] },
  { key: "boutique-livraison", category: "Boutique", name: "Boutique en ligne — livraison et retours", description: "Livraison, retours, paiement et questions : à compléter avec vos conditions réelles.",
    build: (ctx) => [hero("Livraison, retours et paiement", "[Vos engagements, en une phrase.]"), features("Ce qu'il faut savoir", [["Livraison", "[Zones, délais, frais réels.]"], ["Retours et remboursements", "[Délai légal et conditions.]"], ["Paiement sécurisé", "[Moyens acceptés.]"]], 2), ...block("faq", ctx), cta("Une question avant d'acheter ?", "[Délai de réponse réel.]", "Nous contacter", "/contact")] },
];

// Sections d'un gabarit (sections absentes faute de données retirées) ; null si la clé est inconnue
function buildTemplate(ctx, key) {
  const t = TEMPLATES.find((x) => x.key === key);
  return t ? t.build(ctx).filter(Boolean) : null;
}
const catalog = () => TEMPLATES.map(({ key, category, name, description }) => ({ key, category, name, description }));

// Programme 100 : gabarits de page supplémentaires (src/marketing/pages/lib100/pages.js).
TEMPLATES.push(...require("./lib100/pages").entries({ hero, text, list, features, faq, cta, form, testimonials, divider, courseOf, block, helpers: require("./patterns").helpers }));
for (const t of TEMPLATES) t.build = require("./lib100/fixes").wrap(t.build);
module.exports = { TEMPLATES, buildTemplate, catalog };
