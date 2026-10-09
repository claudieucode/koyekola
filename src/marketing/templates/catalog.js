// Registre de la bibliothèque de blocs de l'éditeur d'e-mails : identifiants stables (« email.button »), catégorie,
// icône, description, mots-clés (recherche), indicateurs. Source unique de la palette (panneau « Blocs »).
//  - kind "block"  : un type de bloc que le moteur sait rendre (templates/blocks.js#TYPES)
//  - kind "preset" : un ensemble de VRAIS blocs insérés d'un coup, chacun ensuite modifiable séparément
// Aucun bloc n'est promis qui ne soit pas rendu par le moteur : pas de minuteur en direct, pas de formulaire actif,
// pas de produit ni de contenu dynamique sans source réelle (formations du catalogue, articles du blog, sondages).

const CATEGORIES = [
  ["recent", "Récemment utilisés"], ["text", "Texte"], ["media", "Médias"], ["actions", "Actions"], ["layout", "Mise en page"],
  ["navigation", "Navigation"], ["ecommerce", "E-commerce"], ["dynamic", "Dynamique & personnalisation"], ["marketing", "Marketing"],
  ["social", "Social"], ["forms", "Formulaires"], ["events", "Événements"], ["content", "Contenu"], ["transactional", "Transactionnel"],
  ["proof", "Avis & preuve sociale"], ["advanced", "Avancé"], ["system", "Blocs système"], ["mine", "Mes blocs"],
];

// Filtres rapides : un bloc appartient à un filtre par son drapeau (essential, ecommerce, dynamic, advanced) ou sa catégorie
const FILTERS = [["all", "Tous"], ["essential", "Essentiels"], ["ecommerce", "E-commerce"], ["marketing", "Marketing"], ["content", "Contenu"], ["dynamic", "Dynamique"], ["advanced", "Avancé"], ["mine", "Mes blocs"], ["recent", "Récents"]];

const para = (html, align) => `<p${align ? ` style="text-align:${align}"` : ""}>${html}</p>`;
const HELLO = '{{contact.first_name | default:"cher(e) membre"}}';

// [id, kind, clé, nom, catégorie, icône, description, mots-clés, indicateurs]
const RAW = [
  ["email.heading", "block", "heading", "Titre", "text", "type", "Un titre de section", "titre title h1 h2 en-tête entete intitulé", { essential: 1, responsive: 1 }],
  ["email.text", "block", "text", "Texte", "text", "alignLeft", "Paragraphes, gras, liens, listes", "paragraphe texte contenu rédaction article", { essential: 1, responsive: 1 }],
  ["email.quote", "block", "quote", "Citation", "text", "quote", "Une phrase mise en avant", "citation quote phrase mise en avant", { responsive: 1 }],
  ["email.list", "block", "list", "Liste", "text", "list", "Puces, numéros ou coches", "liste puces numéros coches avantages étapes", { responsive: 1 }],
  ["email.image", "block", "image", "Image", "media", "image", "Depuis la médiathèque ou une adresse", "image photo illustration visuel bannière logo picture", { essential: 1, responsive: 1 }],
  ["email.video", "block", "video", "Vidéo", "media", "video", "Miniature cliquable vers la vidéo", "vidéo video lecture youtube vimeo miniature play", { responsive: 1 }],
  ["email.gif", "preset", "gif", "GIF animé", "media", "image", "Une image animée (GIF) de la médiathèque", "gif animation animé image", { responsive: 1 }],
  ["email.button", "block", "button", "Bouton", "actions", "mousePointer", "Un appel à l'action", "bouton button cta achat acheter commander action inscription", { essential: 1, responsive: 1 }],
  ["email.link", "block", "link", "Lien", "actions", "link", "Un lien texte (site, PDF, e-mail)", "lien link url pdf site adresse", { responsive: 1 }],
  ["email.columns", "block", "columns", "Deux colonnes", "layout", "columns", "Deux textes côte à côte, largeurs réglables", "colonnes columns deux côte à côte grille mise en page", { essential: 1, responsive: 1 }],
  ["email.divider", "block", "divider", "Séparateur", "layout", "minus", "Une ligne fine", "séparateur ligne trait divider hr", { responsive: 1 }],
  ["email.spacer", "block", "spacer", "Espace", "layout", "moveVertical", "Un espace vertical", "espace marge vide spacer blanc", { responsive: 1 }],
  ["email.social", "block", "social", "Réseaux sociaux", "social", "share2", "Liens vers vos réseaux", "social réseaux facebook instagram linkedin youtube tiktok whatsapp x twitter", { essential: 1, responsive: 1 }],
  ["email.course", "block", "course", "Formation", "ecommerce", "graduation", "Une formation du catalogue", "formation cours produit catalogue prix achat vente acheter", { ecommerce: 1, dynamic: 1, responsive: 1 }],
  ["email.coupon", "block", "coupon", "Coupon", "marketing", "tag", "Un code promo mis en valeur", "coupon code promo réduction remise vente offre promotion prix", { ecommerce: 1, responsive: 1 }],
  ["email.posts", "block", "posts", "Articles", "content", "fileText", "Les derniers articles du blog (rempli à chaque envoi d'une campagne RSS)", "articles blog rss actualités news derniers billets", { dynamic: 1, responsive: 1 }],
  ["email.survey", "block", "survey", "Sondage", "forms", "listChecks", "Un bouton (et la 1re question) vers un sondage, avec le lien personnel de chaque destinataire", "sondage enquête formulaire question avis vote réponse satisfaction", { dynamic: 1, responsive: 1 }],
  // Ensembles prêts à l'emploi
  ["email.cta", "preset", "cta", "Appel à l'action", "marketing", "zap", "Titre, texte et bouton", "cta appel action inscription bouton achat vente", { essential: 1, responsive: 1 }],
  ["email.offer", "preset", "offer", "Offre", "marketing", "coin", "Titre, coupon et bouton", "offre promotion promo vente coupon réduction prix", { ecommerce: 1, responsive: 1 }],
  ["email.hero", "preset", "hero", "Bandeau d'accueil", "marketing", "image", "Image, grand titre, texte et bouton", "hero bandeau accueil en-tête bannière lancement annonce", { responsive: 1 }],
  ["email.promo", "preset", "promo", "Promotion limitée", "marketing", "tag", "Titre, date limite, coupon et bouton", "promotion promo vente flash soldes offre limitée date urgence coupon prix", { ecommerce: 1, responsive: 1 }],
  ["email.deadline", "preset", "deadline", "Date limite", "marketing", "calendarClock", "Un rappel de date limite (texte, sans minuteur en direct)", "compte à rebours countdown date limite urgence fin offre minuteur", { responsive: 1 }],
  ["email.benefits", "preset", "benefits", "Avantages", "marketing", "listChecks", "Titre et liste de bénéfices à cocher", "avantages bénéfices points forts atouts liste coches", { responsive: 1 }],
  ["email.steps", "preset", "steps", "Étapes", "content", "listOrdered", "Titre et étapes numérotées", "étapes comment ça marche procédure guide numéros", { responsive: 1 }],
  ["email.testimonial", "preset", "testimonial", "Témoignage", "proof", "quote", "Citation d'un client et sa signature", "témoignage avis client citation preuve sociale recommandation", { responsive: 1 }],
  ["email.rating", "preset", "rating", "Note et avis", "proof", "star", "Une note (étoiles) et un court avis", "avis note étoiles review notation satisfaction client", { responsive: 1 }],
  ["email.welcome", "preset", "welcome", "Message personnalisé", "dynamic", "user", "Salutation avec le prénom du contact (valeur de secours incluse)", "personnalisation prénom bonjour variable contact nom dynamique", { dynamic: 1, responsive: 1 }],
  ["email.localized", "preset", "localized", "Contenu selon le pays", "dynamic", "braces", "Un bloc affiché seulement pour les contacts d'un pays (condition)", "condition conditionnel pays langue segment visibilité dynamique", { dynamic: 1, advanced: 1, responsive: 1 }],
  ["email.event", "preset", "event", "Invitation à un événement", "events", "calendarClock", "Titre, date, lieu et bouton d'inscription", "événement webinaire conférence atelier invitation date lieu inscription rendez-vous", { responsive: 1 }],
  ["email.order", "preset", "order", "Confirmation de commande", "transactional", "cart", "Numéro, montant et lien vers la formation (variables de l'événement)", "commande achat confirmation reçu facture paiement montant numéro transactionnel", { ecommerce: 1, dynamic: 1, transactional: 1, responsive: 1 }],
  ["email.access", "preset", "access", "Accès à la formation", "transactional", "lock", "Titre de la formation et bouton d'accès (variables de l'événement)", "accès formation connexion démarrer espace élève transactionnel bienvenue", { dynamic: 1, transactional: 1, responsive: 1 }],
];

const ENTRIES = RAW.map(([id, kind, key, name, category, icon, description, keywords, flags]) => ({
  id, kind, key, name, category, icon, description, keywords,
  essential: !!flags.essential, ecommerce: !!flags.ecommerce, dynamic: !!flags.dynamic, advanced: !!flags.advanced,
  transactional: !!flags.transactional, responsive: !!flags.responsive,
}));

// Ensembles : blocs réels (mêmes propriétés que public/js/marketing-editor.js#TYPES). Aucun identifiant ici : l'éditeur les attribue.
const PRESETS = {
  gif: () => [{ type: "image", src: "", alt: "", decorative: false, width: 400, align: "center" }],
  cta: () => [{ type: "heading", text: "Prêt à commencer ?", level: 2, align: "center" }, { type: "text", html: para("Rejoignez la formation et progressez à votre rythme.", "center") }, { type: "button", label: "Je m'inscris", url: "", align: "center" }],
  offer: () => [{ type: "heading", text: "Une offre pour vous", level: 2, align: "center" }, { type: "coupon", code: "OFFRE20", title: "-20 % sur toutes les formations", details: "Valable 7 jours." }, { type: "button", label: "En profiter", url: "", align: "center" }],
  hero: () => [{ type: "image", src: "", alt: "", decorative: false, width: 552, align: "center" }, { type: "heading", text: "Une grande nouveauté arrive", level: 1, align: "center" }, { type: "text", html: para("Présentez en deux phrases ce que vous annoncez et pourquoi cela compte pour vos lecteurs.", "center") }, { type: "button", label: "Découvrir", url: "", align: "center" }],
  promo: () => [{ type: "heading", text: "Promotion à durée limitée", level: 2, align: "center" }, { type: "text", html: para("<strong>Jusqu'au [date de fin]</strong> — profitez de votre remise avant qu'elle ne se termine.", "center") }, { type: "coupon", code: "PROMO15", title: "-15 % sur votre commande", details: "Code à saisir au moment du paiement." }, { type: "button", label: "J'en profite", url: "", align: "center" }],
  deadline: () => [{ type: "text", html: para("<strong>⏰ Dernier jour : [date et heure de fin]</strong>", "center") }, { type: "text", html: para("Un rappel écrit : un compte à rebours animé n'est pas pris en charge par les messageries.", "center") }],
  benefits: () => [{ type: "heading", text: "Pourquoi nous choisir", level: 2, align: "left" }, { type: "list", style: "checks", items: ["Un avantage clair", "Un deuxième avantage", "Un troisième avantage"] }],
  steps: () => [{ type: "heading", text: "Comment ça marche", level: 2, align: "left" }, { type: "list", style: "numbers", items: ["Première étape", "Deuxième étape", "Troisième étape"] }, { type: "button", label: "Commencer", url: "", align: "left" }],
  testimonial: () => [{ type: "quote", text: "« Écrivez ici le témoignage d'un client, avec ses propres mots. »", author: "Prénom Nom, fonction" }],
  rating: () => [{ type: "text", html: para("<strong>★★★★★ 5/5</strong>", "center") }, { type: "quote", text: "Recopiez ici un avis réel de client.", author: "Prénom Nom" }],
  welcome: () => [{ type: "heading", text: `Bonjour ${HELLO},`, level: 2, align: "left" }, { type: "text", html: para("Voici les nouveautés de la semaine, choisies pour vous.") }],
  localized: () => [{ type: "text", html: para("Message réservé aux contacts de France : précisez ici l'information qui les concerne."), showIf: 'contact.country == "FR"' }],
  event: () => [{ type: "heading", text: "Vous êtes invité(e)", level: 2, align: "center" }, { type: "text", html: para("<strong>[Date]</strong> à <strong>[heure]</strong> · [Lieu ou lien en ligne]", "center") }, { type: "text", html: para("Décrivez en une phrase le sujet de la rencontre.", "center") }, { type: "button", label: "Je réserve ma place", url: "", align: "center" }],
  order: () => [{ type: "heading", text: "Merci pour votre commande", level: 2, align: "left" }, { type: "text", html: para("Commande n° <strong>{{event.order_id}}</strong> — montant : <strong>{{event.order_total}}</strong>") }, { type: "button", label: "Accéder à ma formation", url: "{{event.learn_url}}", align: "left" }],
  access: () => [{ type: "heading", text: "Votre accès est prêt", level: 2, align: "left" }, { type: "text", html: para("Vous pouvez démarrer <strong>{{event.course_title}}</strong> dès maintenant.") }, { type: "button", label: "Démarrer", url: "{{event.learn_url}}", align: "left" }],
};

const normalize = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Recherche : tous les mots saisis doivent se retrouver dans le nom, la catégorie, la description ou les mots-clés.
// Classement : nom d'abord, puis catégorie, puis mots-clés et description (à égalité, l'ordre du catalogue).
function search(query, entries = ENTRIES) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return entries;
  const cat = Object.fromEntries(CATEGORIES);
  const scored = [];
  entries.forEach((e, i) => {
    const name = normalize(e.name), category = normalize(cat[e.category]), rest = normalize(`${e.description} ${e.keywords}`);
    let score = 0;
    for (const w of words) {
      if (name.includes(w)) score += 3; else if (category.includes(w)) score += 2; else if (rest.includes(w)) score += 1; else return;
    }
    scored.push([score, i, e]);
  });
  return scored.sort((x, y) => y[0] - x[0] || x[1] - y[1]).map((x) => x[2]);
}

module.exports = { CATEGORIES, FILTERS, ENTRIES, PRESETS, search, normalize };
