// Performance Pure — nutrition sportive et équipement fitness. Direction artistique : le tableau de bord d'entraînement. Fond graphite presque noir, vert acide pour l'action, orange pour la mise en garde,
// grandes capitales condensées, chiffres en colonnes, filets de mesure et ligne de pouls tracée en SVG (aucune photo). Contrastes forts, aucune promesse de résultat.
// Composants signature :
//  1. le CALCULATEUR DE BESOINS : bloc éditable du Page Builder. Les formules sont écrites en clair dans le bloc (et fonctionnent comme texte sans script) ; motion.js construit les champs.
//     Dépense énergétique au repos : équation de Mifflin-St Jeor (Mifflin et al., Am J Clin Nutr, 1990). Multiplicateurs d'activité usuels, modifiables dans le bloc (attributs data-). Repère protéines
//     de la prise de position conjointe ACSM / Academy of Nutrition and Dietetics / Dietitians of Canada (2016) : 1,2 à 2,0 g/kg/jour pour des sportifs adultes. Résultat = ESTIMATION INDICATIVE,
//     jamais un conseil médical ni nutritionnel personnalisé ; rien n'est envoyé ni enregistré.
//  2. le RÉASSORT PAR ABONNEMENT : la vraie brique « abonnements » du moteur (formules, paiement Stripe, pause, résiliation en un clic). Le thème l'explique et calcule seulement la durée d'un contenant.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const pulse = (cls = "pp-pulse") => `<svg class="${cls}" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><polyline class="pp-line" points="0,70 90,70 120,70 140,30 160,104 182,14 204,86 224,70 330,70 360,70 380,44 398,92 416,70 600,70" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const bolt = `<svg class="pp-bolt" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor"/></svg>`;

const header = (c) => `<header class="pp-head pk-bleed"><div class="pp-bar"><a class="pp-logo" href="/" aria-label="Performance Pure, accueil">${bolt}<span>Performance <b>Pure</b></span></a>
  <div class="pp-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="pp-act"><a href="/boutique/abonnements">Mes abonnements</a><a href="/boutique/compte">Compte</a><a class="pp-cart" href="/boutique/panier">Panier</a></div></div></header>`;
const footer = (c) => `<footer class="pp-foot pk-bleed"><div class="pp-wrap pp-foot-g"><div><p class="pp-big">Performance <b>Pure</b></p><p class="pp-small">Nutrition sportive et équipement de fitness. Boutique de démonstration du thème. Les outils de ce site donnent des estimations indicatives et ne remplacent pas l'avis d'un médecin ou d'un diététicien.</p></div>
  <div><p class="pp-lab">Boutique</p><p class="pp-fl"><a href="/boutique">Tout le catalogue</a><a href="/boutique/etiquette/consommable">Produits à racheter</a><a href="/boutique/etiquette/force">Force</a><a href="/boutique/etiquette/mobilite">Mobilité</a><a href="/boutique/abonnements">Mes abonnements</a><a href="/boutique/panier">Panier</a></p></div>
  <div><p class="pp-lab">Aide</p><p class="pp-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div>
  <p class="pp-copy">© Performance Pure — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="pp-ph pk-bleed"><div class="pp-wrap"><p class="pp-lab">${esc(kicker)}</p><div class="pp-h1" role="heading" aria-level="1">${esc(title)}</div><p class="pp-lead">${esc(lead)}</p></div></section>`);

/* ---------- Calculateur de besoins (bloc éditable). Les valeurs data-* sont lues par motion.js : le vendeur peut les corriger dans l'éditeur. ---------- */
const calculateur = (titre) => sec(`<section class="pp-calc pk-bleed"><div class="pp-wrap pp-calc-in"><div><p class="pp-lab">Calculateur de besoins</p><h2 class="pp-h2">${esc(titre)}</h2>
  <p class="pp-lead">Une estimation de votre dépense énergétique quotidienne, calculée dans votre navigateur. Rien n'est envoyé ni enregistré.</p>
  <ul class="pp-formulas"><li><b>Repos</b> Équation de Mifflin-St Jeor : 10 × poids (kg) + 6,25 × taille (cm) − 5 × âge + 5 pour un homme, − 161 pour une femme.</li>
  <li><b>Jour moyen</b> Dépense au repos × un multiplicateur d'activité.</li>
  <li><b>Protéines</b> Repère de 1,2 à 2,0 g par kg et par jour pour un adulte sportif (prise de position ACSM, Academy of Nutrition and Dietetics, Dietitians of Canada, 2016).</li></ul>
  <p class="pp-note">Estimation indicative pour un adulte de 18 à 80 ans en bonne santé. Ce n'est ni un conseil médical ni un conseil nutritionnel personnalisé : en cas de grossesse, de maladie, de traitement ou de doute, demandez l'avis d'un professionnel de santé.</p></div>
  <div class="pp-calcbox" data-pp-calc data-act-1="1.2|Sédentaire (peu ou pas de sport)" data-act-2="1.375|Légère (1 à 3 séances par semaine)" data-act-3="1.55|Modérée (3 à 5 séances par semaine)" data-act-4="1.725|Élevée (6 à 7 séances par semaine)" data-act-5="1.9|Très élevée (séances biquotidiennes ou travail physique)" data-prot-min="1.2" data-prot-max="2.0">
  <p class="pp-small">Ce calculateur demande JavaScript. Sans lui, utilisez les formules ci-contre avec une calculatrice.</p></div></div></section>`);

/* ---------- Réassort : durée d'un contenant → cadence d'abonnement à choisir (calcul simple, aucune donnée stockée) ---------- */
const cadence = () => sec(`<section class="pp-cad pk-bleed"><div class="pp-wrap pp-cad-in"><div><p class="pp-lab">Réassort</p><h2 class="pp-h2">À quel rythme racheter ?</h2>
  <p class="pp-lead">Indiquez les portions d'un contenant et ce que vous en prenez par jour : l'outil calcule combien de temps il dure. Les formules d'abonnement réellement proposées sont affichées sur la fiche de chaque produit concerné, avec leur prix.</p></div>
  <div class="pp-calcbox" data-pp-cadence><p class="pp-small">Cet outil demande JavaScript. Sans lui : durée = portions du contenant ÷ portions par jour.</p></div></div></section>`);

const steps = () => sec(`<section class="pp-steps pk-bleed"><div class="pp-wrap"><p class="pp-lab">Abonnement</p><h2 class="pp-h2">Le réassort, sans surprise</h2>
  <ol class="pp-st"><li><b>Vous choisissez la formule</b>Sur la fiche d'un produit abonnable : prix à chaque échéance et rythme sont écrits avant le paiement. Rien n'est présélectionné et l'achat unique reste disponible.</li>
  <li><b>Vous payez la première échéance</b>Le paiement se fait sur la page sécurisée de Stripe. Vous recevez un e-mail avec votre lien de gestion.</li>
  <li><b>Vous gardez la main</b>Pause, changement de formule ou résiliation en un clic, à tout moment, depuis <a href="/boutique/abonnements">Mes abonnements</a>.</li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="pp-hero pk-bleed"><div class="pp-wrap pp-hero-in"><div><p class="pp-lab">Nutrition sportive · Équipement</p><div class="pp-h1 pp-h1--xl" role="heading" aria-level="1">Mesurez. Dosez. <em>Recommencez.</em></div>
  <p class="pp-lead">Calculez vos besoins d'énergie, choisissez vos produits, puis réassortez au bon rythme : par achat unique, ou par abonnement que vous arrêtez en un clic.</p>
  <p><a class="pp-btn" href="/calculateur">Calculer mes besoins</a><a class="pp-btn pp-btn--o" href="/boutique">Voir le catalogue</a></p></div>
  <div class="pp-art" aria-hidden="true"><div class="pp-gauge">${pulse("pp-pulse")}</div><div class="pp-grid-bg"></div></div></div></section>`),
  calculateur("Vos besoins du jour"),
  sec(`<section class="pp-sec pk-bleed"><div class="pp-wrap"><p class="pp-lab">À la une</p><h2 class="pp-h2">Le catalogue</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 8, columns: "4", orderby: "featured", ratio: "1/1" })),
  steps(),
  sec(`<section class="pp-sec pk-bleed"><div class="pp-wrap"><p class="pp-lab">Promotions</p><h2 class="pp-h2">Prix réduits en ce moment</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 4, columns: "4", orderby: "newest", ratio: "1/1" })),
  sec(footer(c))];

const calcPage = (c) => [sec(header(c)), head("Outil", "Calculateur de besoins", "Dépense énergétique estimée et repère de protéines, avec les formules citées."), calculateur("Entrez vos mesures"),
  sec(`<section class="pp-sec pk-bleed"><div class="pp-wrap pp-prose"><h2 class="pp-h2">Comment lire le résultat</h2><p>Le résultat est une moyenne statistique : deux personnes aux mêmes mesures peuvent avoir des besoins différents. Utilisez-le comme point de départ, pas comme objectif imposé. Les multiplicateurs d'activité sont des valeurs usuelles ; le vendeur peut les modifier dans le bloc de la page.</p>
  <p>Cet outil n'est pas fait pour les mineurs, les femmes enceintes ou allaitantes, ni pour les personnes suivant un traitement ou un régime médical. Dans ces cas, seul un professionnel de santé peut vous conseiller.</p>
  <p><a class="pp-btn" href="/boutique">Voir le catalogue</a></p></div></section>`), sec(footer(c))];

const reassort = (c) => [sec(header(c)), head("Abonnement", "Réassort par abonnement", "Recevez vos produits à rythme régulier, arrêtez quand vous voulez."), cadence(), steps(),
  sec(`<section class="pp-sec pk-bleed"><div class="pp-wrap"><p class="pp-lab">Produits à racheter</p><h2 class="pp-h2">Poudres, boissons et barres</h2><p class="pp-small">L'abonnement apparaît sur la fiche des produits pour lesquels le vendeur a défini des formules. Les autres s'achètent à l'unité.</p></div></section>`),
  wrap(shopgrid({ source: "archive", count: 8, columns: "4", orderby: "newest", ratio: "1/1" })),
  sec(`<section class="pp-sec pk-bleed"><div class="pp-wrap pp-prose"><h2 class="pp-h2">Vos garanties</h2><ul class="pp-ul"><li>Le prix de chaque échéance est tout compris (livraison et taxes incluses) et affiché avant le paiement.</li><li>Aucune formule n'est présélectionnée : vous cliquez vous-même sur « S'abonner ».</li><li>Pause, reprise, changement de formule et résiliation se font en ligne, sans appel ni courrier.</li><li>Après une résiliation, un e-mail de confirmation vous est envoyé.</li></ul></div></section>`), sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="pp-sec pk-bleed"><div class="pp-wrap pp-prose"><h2 class="pp-h2">Livraison</h2><p>Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Pour un abonnement, la livraison est comprise dans le prix de chaque échéance.</p><h2 class="pp-h2">Retours</h2><p>Les conditions de retour sont précisées par la boutique avant la commande. Pour des raisons d'hygiène, un produit alimentaire ouvert n'est en général pas repris : vérifiez les conditions du vendeur.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Calculateur, abonnement, livraison."),
  sec(`<section class="pp-sec pk-bleed"><div class="pp-wrap"><details class="pp-q"><summary>Le calculateur est-il un conseil nutritionnel ?</summary><p>Non. C'est une estimation indicative fondée sur des formules publiées. Elle ne remplace pas l'avis d'un médecin ou d'un diététicien.</p></details>
  <details class="pp-q"><summary>Mes mesures sont-elles enregistrées ?</summary><p>Non. Le calcul se fait dans votre navigateur et rien n'est envoyé ni stocké.</p></details>
  <details class="pp-q"><summary>Comment résilier mon abonnement ?</summary><p>En un clic depuis <a href="/boutique/abonnements">Mes abonnements</a> ou le lien reçu par e-mail. Un e-mail de confirmation vous est envoyé.</p></details>
  <details class="pp-q"><summary>Puis-je mettre un abonnement en pause ?</summary><p>Oui, depuis la même page. Aucun prélèvement n'a lieu tant que l'abonnement est en pause.</p></details>
  <details class="pp-q"><summary>L'achat unique reste-t-il possible ?</summary><p>Oui. L'abonnement est une option proposée à côté du bouton d'ajout au panier.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Contact", "Nous écrire", "Une question sur un produit ou une commande."), { type: "form", heading: "Écrire à la boutique", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un produit", "Une poudre, un équipement, une marque."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un produit…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pp-ph pk-bleed"><div class="pp-wrap"><p class="pp-lab">Page introuvable</p><div class="pp-h1 pp-h1--xl" role="heading" aria-level="1">Hors <em>piste</em></div><p class="pp-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "performance-pure", name: "Performance Pure", version: "1.0.0", category: "ecommerce", tags: ["sombre", "technique", "audacieux"], siteType: "Nutrition sportive et équipement fitness", featured: false,
  concept: "Le tableau de bord d'entraînement : graphite et vert acide, capitales condensées, ligne de pouls en SVG, un calculateur de besoins aux formules citées et un réassort par abonnement honnête (prix et rythme avant paiement, résiliation en un clic).",
  description: "Nutrition sportive et fitness : graphite, vert acide et capitales condensées, calculateur de besoins (Mifflin-St Jeor, estimation indicative) et réassort par abonnement sans piège : prix et rythme affichés, pause et résiliation en un clic.",
  brand: "Performance Pure", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carte-graphite-filet-vert-prix-en-colonne", gallery: "grande-image-puis-vignettes-et-infos-collantes", cart: "page-dediee-sombre-total-en-vert-acide", catalog: "barre-de-filtres-compacte-en-capitales" },
  dna: {
    header: "barre-graphite-logo-eclair-et-lien-mes-abonnements", hero: "titre-condense-geant-et-jauge-a-ligne-de-pouls", grid: "quatre-colonnes-cartes-graphite-a-filet-vert", typo: "font.bebas-neue+font.ibm-plex-sans",
    shapes: "angles-vifs-filets-de-mesure-et-ligne-de-pouls", motion: "ligne-de-pouls-qui-se-trace-en-boucle-lente", rhythm: "bandes-graphite-et-noir-separees-par-un-filet-vert", signature: "calculateur-de-besoins-aux-formules-citees-et-reassort-par-abonnement",
    palette: "graphite-presque-noir-vert-acide-et-orange-de-mise-en-garde", image: "ligne-de-pouls-svg-sans-photo", list: "cartes-graphite-prix-en-chiffres-tabulaires",
    article: "colonne-etroite-formules-en-liste-a-puces-vertes", sidebar: "aucune-encart-estimation-indicative-en-orange", reading: "ibm-plex-sans-17-px-mesure-64-caracteres",
  },
  tokens: {
    colors: { primary: "#c6ff1a", secondary: "#2a2f36", accent: "#ff6a1f", background: "#0e1013", surface: "#171a1f", text: "#f2f4ef", muted: "#a2abb5", success: "#4cd48a", warning: "#ffb020", error: "#ff6b6b" },
    fonts: { heading: "font.bebas-neue", body: "font.ibm-plex-sans", button: "font.ibm-plex-sans", link: "font.ibm-plex-sans" },
    radius: { sm: 2, md: 4, lg: 6, button: 2, field: 3, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2f353d" },
    type: { h1: { size: 76, weight: 400, lineHeight: 0.98, transform: "uppercase" }, h2: { size: 44, weight: 400, lineHeight: 1.02, transform: "uppercase" } },
  },
  options: [
    { key: "vert", label: "Couleur d'action (boutons, filets)", type: "color", default: "#c6ff1a" },
    { key: "orange", label: "Couleur de mise en garde", type: "color", default: "#ff6a1f" },
    { key: "pouls", label: "Ligne de pouls de l'accueil", type: "choice", default: "on", choices: [["on", "Tracée en boucle"], ["off", "Fixe"]] },
    { key: "grille", label: "Quadrillage du fond de l'accueil", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Calculateur", "/calculateur"], ["Réassort", "/reassort"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "calculateur", name: "Calculateur de besoins", render: calcPage }, { key: "reassort", name: "Réassort par abonnement", render: reassort },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
