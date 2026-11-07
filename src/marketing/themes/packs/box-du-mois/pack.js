// Box du Mois — box d'abonnement mensuelle. Direction artistique : le papier kraft et le déballage. Fond kraft clair, rose baie pour l'action, vert profond pour l'encre, jaune citron pour la fête ;
// une box en carton dessinée en SVG dont le couvercle se soulève, des confettis, des étiquettes à coin plié. Aucune photo : la surprise reste un secret, aucun contenu n'est promis.
// Composant signature : la GESTION D'ABONNEMENT mise en scène avec la vraie brique « abonnements » du moteur (formules, paiement Stripe, pause, changement de formule, résiliation EN UN CLIC).
//  - la page « Gérer mon abonnement » montre un APERÇU (clairement étiqueté « aperçu, rien n'est modifié ») des trois gestes, et mène à la vraie page /boutique/abonnements ;
//  - la page « Comment résilier » dit en trois étapes simples comment arrêter, sans détour : un seul bouton, un e-mail de confirmation, aucun parcours dissuasif ;
//  - motion.js affiche, sous le choix de formule du moteur, le prix et le rythme écrits en toutes lettres AVANT le paiement.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const boxSvg = (cls = "bm-box") => `<svg class="${cls}" viewBox="0 0 320 280" role="img" aria-label="Illustration d'une box en carton dont le couvercle se soulève"><rect class="bm-body" x="40" y="120" width="240" height="140" rx="6"/><rect class="bm-shade" x="40" y="120" width="240" height="26"/>
  <rect class="bm-ribbon" x="146" y="120" width="28" height="140"/><g class="bm-lid"><rect class="bm-lidr" x="28" y="84" width="264" height="44" rx="6"/><rect class="bm-ribbon" x="146" y="84" width="28" height="44"/><path class="bm-bow" d="M160 84c-26-34-62-26-48-4 8 12 30 8 48 4zM160 84c26-34 62-26 48-4-8 12-30 8-48 4z"/></g>
  <g class="bm-conf"><rect class="bm-c1" x="70" y="60" width="12" height="12"/><circle class="bm-c2" cx="236" cy="52" r="7"/><rect class="bm-c3" x="198" y="22" width="10" height="16" rx="2"/><circle class="bm-c1" cx="112" cy="26" r="6"/><rect class="bm-c2" x="262" y="92" width="12" height="12"/><circle class="bm-c3" cx="48" cy="96" r="5"/></g></svg>`;
const tagSvg = `<svg class="bm-tag" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 12 3h9v9l-9 9z" fill="currentColor"/><circle cx="16" cy="8" r="1.8" fill="#fbf4e6"/></svg>`;

const header = (c) => `<header class="bm-head pk-bleed"><div class="bm-note">Un abonnement que vous arrêtez en un clic · prix et rythme affichés avant de payer</div>
  <div class="bm-bar"><a class="bm-logo" href="/" aria-label="Box du Mois, accueil">${tagSvg}<span>Box du <b>Mois</b></span></a>
  <div class="bm-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="bm-act"><a href="/boutique/abonnements">Mes abonnements</a><a href="/boutique/compte">Compte</a><a class="bm-cart" href="/boutique/panier">Panier</a></div></div></header>`;
const footer = (c) => `<footer class="bm-foot pk-bleed"><div class="bm-wrap bm-foot-g"><div><p class="bm-big">Box du <b>Mois</b></p><p class="bm-small">Une box d'abonnement, une surprise par mois. Boutique de démonstration du thème.</p></div>
  <div><p class="bm-lab">Boutique</p><p class="bm-fl"><a href="/boutique">Toutes les box</a><a href="/boutique/etiquette/abonnable">Box à abonnement</a><a href="/boutique/etiquette/unique">Box à l'unité</a><a href="/boutique/abonnements">Mes abonnements</a><a href="/boutique/panier">Panier</a></p></div>
  <div><p class="bm-lab">Aide</p><p class="bm-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div>
  <p class="bm-copy">© Box du Mois — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="bm-ph pk-bleed"><div class="bm-wrap"><p class="bm-lab">${esc(kicker)}</p><div class="bm-h1" role="heading" aria-level="1">${esc(title)}</div><p class="bm-lead">${esc(lead)}</p></div></section>`);

/* ---------- Les trois temps : choisir, recevoir, gérer ---------- */
const trois = () => sec(`<section class="bm-tri pk-bleed"><div class="bm-wrap"><p class="bm-lab">Comment ça marche</p><h2 class="bm-h2">Trois temps, aucun piège</h2>
  <ol class="bm-cards"><li class="bm-fold"><b>1. Vous choisissez</b>Sur la fiche d'une box : la formule, son prix à chaque échéance et son rythme sont écrits avant de payer. Rien n'est présélectionné, et l'achat unique reste possible.</li>
  <li class="bm-fold"><b>2. Vous recevez</b>Vous payez la première échéance sur la page sécurisée de Stripe, puis une box arrive à chaque échéance. Le contenu reste une surprise.</li>
  <li class="bm-fold"><b>3. Vous gardez la main</b>Pause, changement de formule ou résiliation en un clic, à tout moment, depuis <a href="/boutique/abonnements">Mes abonnements</a> ou le lien reçu par e-mail.</li></ol></div></section>`);

/* ---------- Aperçu de gestion (bloc éditable) : motion.js le rend interactif, sans rien modifier de réel ---------- */
const apercu = () => sec(`<section class="bm-gest pk-bleed"><div class="bm-wrap bm-gest-in"><div><p class="bm-lab">Gestion d'abonnement</p><h2 class="bm-h2">Essayez les gestes, pour de faux</h2>
  <p class="bm-lead">Voici à quoi ressemble la page de gestion. Les boutons ci-contre sont un aperçu : rien n'est modifié et aucun abonnement n'existe. La vraie page est <a href="/boutique/abonnements">Mes abonnements</a>.</p>
  <ul class="bm-ul"><li><b>Pause</b> : plus de prélèvement ni de box tant que vous ne reprenez pas.</li><li><b>Changer de formule</b> : le nouveau prix s'applique à l'échéance suivante, sans frais.</li><li><b>Résilier</b> : un seul bouton, immédiat, avec un e-mail de confirmation.</li></ul></div>
  <div class="bm-demo" data-bm-demo data-bm-name="Box du mois — Gourmande" data-bm-price="29,90 €" data-bm-rhythm="chaque mois" data-bm-alt="27,00 € tous les 2 mois"><p class="bm-small">Cet aperçu demande JavaScript. Sans lui, ouvrez la page Mes abonnements pour gérer un vrai abonnement.</p></div></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="bm-hero pk-bleed"><div class="bm-wrap bm-hero-in"><div><p class="bm-lab">Box d'abonnement mensuelle</p><div class="bm-h1 bm-h1--xl" role="heading" aria-level="1">Une surprise, <em>chaque mois</em></div>
  <p class="bm-lead">Choisissez une box, découvrez-la au déballage, et arrêtez quand vous voulez : la résiliation est aussi simple que l'inscription.</p>
  <p><a class="bm-btn" href="/boutique/etiquette/abonnable">Choisir ma box</a><a class="bm-btn bm-btn--o" href="/comment-resilier">Comment résilier</a></p></div>
  <div class="bm-art" aria-hidden="true">${boxSvg("bm-box")}</div></div></section>`),
  trois(),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap"><p class="bm-lab">Les box du mois</p><h2 class="bm-h2">Choisissez votre thème</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 8, columns: "4", orderby: "featured", ratio: "1/1" })),
  apercu(),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap"><p class="bm-lab">Sans engagement</p><h2 class="bm-h2">Envie d'essayer une seule fois ?</h2><p class="bm-lead">Chaque box existe aussi à l'unité, sans abonnement.</p><p><a class="bm-btn bm-btn--o" href="/boutique/etiquette/unique">Voir les box à l'unité</a></p></div></section>`),
  sec(footer(c))];

const formules = (c) => [sec(header(c)), head("Formules", "Choisir sa formule", "Le rythme et le prix, écrits clairement avant le paiement."),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap bm-prose"><h2 class="bm-h2">Ce que vous voyez avant de payer</h2><ul class="bm-ul"><li>Le prix de chaque échéance, <b>tout compris</b> : livraison et taxes sont incluses, il n'y a aucun frais caché.</li><li>Le rythme : par exemple toutes les 4 semaines, chaque mois ou tous les 2 mois, selon ce que propose la boutique.</li><li>La mention de ce qui est payé tout de suite : la première échéance.</li><li>Une remise n'est annoncée que si elle est réelle par rapport au prix de la box à l'unité.</li></ul>
  <p>Aucune formule n'est présélectionnée : c'est vous qui choisissez, puis qui cliquez sur « S'abonner ».</p><p><a class="bm-btn" href="/boutique/etiquette/abonnable">Voir les box à abonnement</a></p></div></section>`),
  wrap(shopgrid({ source: "archive", count: 8, columns: "4", orderby: "newest", ratio: "1/1" })), trois(), sec(footer(c))];

const gerer = (c) => [sec(header(c)), head("Gestion d'abonnement", "Gérer mon abonnement", "Pause, formule, résiliation : tout se fait en ligne, en quelques clics."), apercu(),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap bm-prose"><h2 class="bm-h2">Où gérer mon vrai abonnement ?</h2><p>Connectez-vous à votre compte et ouvrez <a href="/boutique/abonnements">Mes abonnements</a>. Vous avez commandé sans compte ? Le lien de gestion se trouve dans l'e-mail reçu après votre paiement, et la même page permet de le recevoir de nouveau.</p>
  <p><a class="bm-btn" href="/boutique/abonnements">Ouvrir Mes abonnements</a><a class="bm-btn bm-btn--o" href="/comment-resilier">Comment résilier</a></p></div></section>`), sec(footer(c))];

const resilier = (c) => [sec(header(c)), head("Résiliation", "Comment résilier", "Aussi simple que de s'inscrire : trois étapes, un seul bouton."),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap"><ol class="bm-cards bm-cards--r"><li class="bm-fold"><b>1. Ouvrez votre abonnement</b>Depuis votre compte, ouvrez <a href="/boutique/abonnements">Mes abonnements</a>. Sans compte, utilisez le lien reçu par e-mail.</li>
  <li class="bm-fold"><b>2. Cliquez sur « Résilier mon abonnement »</b>Un seul bouton. Pas de question, pas de justification, pas de courrier, pas d'appel.</li>
  <li class="bm-fold"><b>3. Lisez l'e-mail de confirmation</b>Vous recevez un message qui confirme la résiliation : plus aucun prélèvement n'aura lieu.</li></ol>
  <div class="bm-prose"><h2 class="bm-h2">À savoir</h2><ul class="bm-ul"><li>Avant de résilier, vous pouvez aussi mettre en pause ou changer de formule : c'est une option, jamais un passage obligé.</li><li>Un abonnement actif reste valable jusqu'à la fin de la période déjà payée ; un abonnement en pause s'arrête tout de suite.</li></ul>
  <p><a class="bm-btn" href="/boutique/abonnements">Ouvrir Mes abonnements</a></p></div></div></section>`), sec(footer(c))];

const labox = (c) => [sec(header(c)), head("La surprise", "Dans la box", "Le contenu reste secret jusqu'au déballage."),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap bm-prose"><h2 class="bm-h2">Un thème, pas de liste</h2><p>Chaque mois, la boutique choisit un thème et prépare sa box. La fiche de la box décrit l'esprit, le format et ce qui est garanti (par exemple le nombre d'objets), jamais le détail. Le vendeur écrit ici ce qu'il peut vraiment promettre.</p>
  <p class="bm-small">Exemple de texte modifiable : « Chaque box contient entre trois et cinq objets choisis par notre équipe. »</p><p><a class="bm-btn" href="/boutique/etiquette/abonnable">Voir les box</a></p></div></section>`), sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap bm-prose"><h2 class="bm-h2">Livraison</h2><p>Pour une box à l'unité, le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Pour un abonnement, la livraison est comprise dans le prix de chaque échéance.</p><h2 class="bm-h2">Retours</h2><p>Les conditions de retour sont précisées par la boutique avant la commande.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Abonnement, résiliation, livraison."),
  sec(`<section class="bm-sec pk-bleed"><div class="bm-wrap"><details class="bm-q"><summary>Comment résilier ?</summary><p>En un clic depuis <a href="/boutique/abonnements">Mes abonnements</a> ou le lien reçu par e-mail. Voir la page <a href="/comment-resilier">Comment résilier</a>.</p></details>
  <details class="bm-q"><summary>Puis-je mettre mon abonnement en pause ?</summary><p>Oui, depuis la même page. Aucun prélèvement ni envoi tant qu'il est en pause.</p></details>
  <details class="bm-q"><summary>Puis-je changer de formule ?</summary><p>Oui. Le nouveau prix s'applique à l'échéance suivante, sans frais supplémentaire.</p></details>
  <details class="bm-q"><summary>Que paie-t-on au départ ?</summary><p>La première échéance, au prix affiché sur la fiche, livraison comprise.</p></details>
  <details class="bm-q"><summary>Puis-je acheter sans m'abonner ?</summary><p>Oui. Chaque box existe aussi à l'unité.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Contact", "Nous écrire", "Une question sur une box ou une commande."), { type: "form", heading: "Écrire à la boutique", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une box", "Un thème, un cadeau, un extra."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une box…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="bm-ph pk-bleed"><div class="bm-wrap"><p class="bm-lab">Page introuvable</p><div class="bm-h1 bm-h1--xl" role="heading" aria-level="1">Box <em>vide</em></div><p class="bm-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "box-du-mois", name: "Box du Mois", version: "1.0.0", category: "ecommerce", tags: ["ludique", "chaleureux", "geometrique"], siteType: "Box d'abonnement mensuelle", featured: false,
  concept: "Le déballage sur papier kraft : une box en SVG dont le couvercle se soulève, des étiquettes à coin plié, et une gestion d'abonnement mise en scène avec la vraie brique du moteur : prix et rythme avant paiement, pause, changement de formule, résiliation en un clic.",
  description: "Box d'abonnement mensuelle : papier kraft, rose baie et vert profond, box en SVG qui s'ouvre, page « Comment résilier » en trois étapes et gestion d'abonnement (pause, formule, résiliation en un clic) aussi simple que la souscription.",
  brand: "Box du Mois", modules: ["formulaires", "recherche", "commerce"], shop: { card: "etiquette-a-coin-plie-prix-sous-le-nom", gallery: "grande-image-puis-vignettes-et-infos-collantes", cart: "page-dediee-kraft-total-en-baie", catalog: "barre-de-filtres-en-etiquettes-kraft" },
  dna: {
    header: "bandeau-engagement-clair-logo-etiquette-et-lien-mes-abonnements", hero: "titre-sur-papier-kraft-et-box-au-couvercle-qui-se-souleve", grid: "quatre-colonnes-etiquettes-kraft-a-coin-plie", typo: "font.bungee+font.dm-sans",
    shapes: "carton-ruban-etiquette-a-coin-plie-et-confettis", motion: "couvercle-qui-se-souleve-et-confettis-qui-flottent", rhythm: "bandes-kraft-et-baie-aux-bords-en-dents-de-scie", signature: "gestion-d-abonnement-mise-en-scene-et-page-comment-resilier",
    palette: "kraft-clair-rose-baie-vert-profond-et-jaune-citron", image: "box-en-carton-svg-sans-photo", list: "etiquettes-kraft-prix-sous-le-nom",
    article: "cartes-numerotees-a-coin-plie", sidebar: "aucune-encart-a-savoir-en-citron", reading: "dm-sans-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#c81e64", secondary: "#0b3d3a", accent: "#f4c542", background: "#ecdcc0", surface: "#fbf4e6", text: "#22201a", muted: "#5d5543", success: "#1c7a4a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.bungee", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" },
    radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "3px 3px 0 #0b3d3a", button: "none" }, border: { width: 2, color: "#0b3d3a" },
    type: { h1: { size: 56, weight: 400, lineHeight: 1.05, transform: "uppercase" }, h2: { size: 32, weight: 400, lineHeight: 1.1, transform: "uppercase" } },
  },
  options: [
    { key: "baie", label: "Couleur d'action (boutons)", type: "color", default: "#c81e64" },
    { key: "encre", label: "Couleur profonde (titres, bandeaux)", type: "color", default: "#0b3d3a" },
    { key: "couvercle", label: "Couvercle de la box de l'accueil", type: "choice", default: "on", choices: [["on", "Se soulève en boucle"], ["off", "Fermé"]] },
    { key: "confettis", label: "Confettis", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "note", label: "Bandeau d'engagement", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Les formules", "/formules"], ["Gérer mon abonnement", "/gerer"], ["Comment résilier", "/comment-resilier"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "formules", name: "Les formules", render: formules }, { key: "gerer", name: "Gérer mon abonnement", render: gerer }, { key: "comment-resilier", name: "Comment résilier", render: resilier },
    { key: "dans-la-box", name: "Dans la box", render: labox }, { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
