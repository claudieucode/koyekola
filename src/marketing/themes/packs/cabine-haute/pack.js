// Cabine Haute — bagagerie de voyage premium. Direction artistique : le plan technique d'une valise (cotes, rails, coque nervurée), titane clair, carbone, aubergine et une étiquette de bagage orange.
// Composant signature : le GABARIT PAR COMPAGNIE — un tableau éditable des dimensions cabine / soute par compagnie aérienne, et un contrôle (motion.js) qui compare les dimensions saisies aux chiffres du tableau.
// IMPORTANT : les chiffres du tableau sont des EXEMPLES indicatifs, à vérifier auprès de la compagnie (ces règles changent). Le thème n'affirme rien de plus.
// Le thème CONSOMME les briques du moteur, il ne les réimplémente pas : comparateur de produits (/boutique/comparer, caractéristiques saisies par le vendeur), rendez-vous, listes cadeaux,
// accès membre, personnalisation par ligne (étiquette nominative). Le vendeur les règle dans l'admin : voir la page « Comment configurer ». Rien n'est simulé côté panier, paiement, avis ou stock.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  mark: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="9" y="12" width="22" height="22" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 12V8h10v4M15 17v12M20 17v12M25 17v12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
};
// Valise en plan technique (coque nervurée, poignée, roues). Les cotes sont du HTML autour (le texte SVG est retiré par le filtre de sécurité).
const case_ = () => `<svg viewBox="0 0 220 300" role="img" aria-label="Plan technique d'une valise cabine à coque nervurée">
<path class="cb-ink" d="M72 20h76v26H72z"/><path class="cb-ink" d="M88 20V8h44v12"/>
<rect class="cb-shell" x="30" y="46" width="160" height="214" rx="26"/>
<path class="cb-rib" d="M72 62v182M100 62v182M128 62v182M156 62v182"/>
<path class="cb-ink" d="M30 98h160M30 208h160"/>
<circle class="cb-wheel" cx="64" cy="276" r="11"/><circle class="cb-wheel" cx="156" cy="276" r="11"/></svg>`;
const cotes = (cls = "") => `<div class="cb-plan ${cls}"><div class="cb-cote cb-cote--h"><span>hauteur</span></div><div class="cb-fig">${case_()}</div><div class="cb-cote cb-cote--w"><span>largeur</span></div></div>`;

const header = (c) => `<header class="cb-head pk-bleed"><div class="cb-promo">Bagages à coque, souples et aluminium · Dimensions à vérifier auprès de votre compagnie avant le départ</div>
  <div class="cb-bar"><a class="cb-logo" href="/" aria-label="Cabine Haute, accueil">${ICON.mark}<div><span>Cabine Haute</span><i>bagagerie de voyage</i></div></a>
  <div class="cb-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="cb-nav cb-nav--ic" role="navigation" aria-label="Boutique"><a class="cb-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="cb-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="cb-foot pk-bleed"><div class="cb-wrap cb-foot-g">
  <div><p class="cb-lab">Cabine Haute</p><p class="cb-small">Bagagerie de voyage premium.<br>Du lundi au vendredi, 9 h – 18 h.</p></div>
  <div><p class="cb-lab">Boutique</p><p class="cb-fl"><a href="/boutique">Tous les bagages</a><a href="/boutique/comparer">Comparer des bagages</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="cb-lab">Informations</p><p class="cb-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/configurer">Comment configurer</a></p></div>
  <div><p class="cb-lab">À savoir</p><p class="cb-small">Les dimensions autorisées en cabine et en soute dépendent de chaque compagnie et changent : vérifiez-les avant de voyager.</p></div></div>
  <p class="cb-copy">© Cabine Haute — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="cb-ph pk-bleed"><div class="cb-wrap cb-narrow"><p class="cb-lab">${esc(kicker)}</p><div class="cb-h1" role="heading" aria-level="1">${esc(title)}</div><p class="cb-lead">${esc(lead)}</p></div></section>`);

// ----- Composant signature : gabarit par compagnie. Données d'EXEMPLE, éditables dans le Page Builder (une ligne <tr> par compagnie, cotes en cm dans data-cabine / data-sac).
const LIGNES = [
  ["Air France", "55 × 35 × 25", "55x35x25", "158 (L+l+h)", "Bagage en soute selon le tarif"],
  ["Lufthansa", "55 × 40 × 23", "55x40x23", "158 (L+l+h)", "Bagage en soute selon le tarif"],
  ["KLM", "55 × 35 × 25", "55x35x25", "158 (L+l+h)", "Bagage en soute selon le tarif"],
  ["Emirates", "55 × 38 × 22", "55x38x22", "Selon la classe", "Poids et nombre selon la classe"],
  ["easyJet", "56 × 45 × 25", "56x45x25", "Selon l'option", "Cabine et soute payantes selon l'option"],
  ["Ryanair", "40 × 20 × 25", "40x20x25", "Selon l'option", "Gratuit : petit sac seulement"],
];
const gabarit = (title = "Le gabarit, compagnie par compagnie") => sec(`<section class="cb-gab pk-bleed"><div class="cb-wrap"><p class="cb-lab">Gabarit par compagnie</p><h2 class="cb-h2">${esc(title)}</h2>
  <p class="cb-warn"><strong>Chiffres d'exemple, à vérifier auprès de la compagnie.</strong> Les règles de bagages changent, parfois sans préavis, et dépendent du tarif, de la classe et de la ligne. Ce tableau est une maquette que la boutique remplace par ses propres vérifications.</p>
  <div class="cb-tw"><table class="cb-tab" data-cabine-gabarit data-sac="55x38x23"><caption>Dimensions d'exemple, en centimètres (longueur × largeur × hauteur)</caption>
    <thead><tr><th scope="col">Compagnie</th><th scope="col">Cabine (exemple)</th><th scope="col">Soute (exemple)</th><th scope="col">Remarque</th></tr></thead>
    <tbody>${LIGNES.map((l) => `<tr data-nom="${esc(l[0])}" data-cabine="${esc(l[2])}"><th scope="row">${esc(l[0])}</th><td>${esc(l[1])}</td><td>${esc(l[3])}</td><td>${esc(l[4])}</td></tr>`).join("")}</tbody></table></div>
  <div class="cb-ctl" data-cabine-ui><p class="cb-fallback">Le contrôle de dimensions demande JavaScript. Sans lui, comparez les cotes de votre bagage (fiche produit, « Dimensions extérieures ») aux lignes du tableau.</p></div>
  <p class="cb-note">Pour mettre ce tableau à jour : modifiez le bloc dans le Page Builder (une ligne par compagnie ; la cote en cm utilisée par le contrôle est l'attribut « data-cabine », au format 55x35x25). Mentionnez la date de votre dernière vérification.</p>
  <p><a class="cb-btn" href="/boutique/comparer">Comparer des bagages</a> <a class="cb-link" href="/boutique">Voir tous les bagages</a></p></div></section>`);

const MATIERES = [
  ["Polycarbonate", "Coque souple et résistante aux chocs, qui reprend sa forme.", [["Poids", "Léger"], ["Entretien", "Chiffon humide"], ["Idéal pour", "Cabine et soute"], ["Point d'attention", "Se raye, se patine"]]],
  ["Aluminium", "Coque nervurée très résistante : elle se bosselle plutôt qu'elle ne casse.", [["Poids", "Plus lourd"], ["Entretien", "Chiffon sec, cire douce"], ["Idéal pour", "Longs séjours"], ["Point d'attention", "Marques d'usage voulues"]]],
  ["Nylon balistique", "Tissage dense, déperlant, qui supporte frottements et sangles.", [["Poids", "Très léger"], ["Entretien", "Éponge et savon doux"], ["Idéal pour", "Sacs et week-ends"], ["Point d'attention", "Moins protecteur qu'une coque"]]],
];
const matieres = () => sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-split"><div><p class="cb-lab">Les matières</p><h2 class="cb-h2">Choisir sa coque</h2><p class="cb-small">Trois matières, trois façons de voyager. Ouvrez une fiche.</p></div>
  <div class="cb-fiches">${MATIERES.map((f, i) => `<details class="cb-fiche"${i === 0 ? " open" : ""}><summary><span class="cb-fiche-t">${esc(f[0])}</span><span class="cb-fiche-s">${esc(f[1])}</span></summary><dl class="cb-dl">${f[2].map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl></details>`).join("")}</div></div></section>`);
const details = () => sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap"><div class="cb-close"><div>${cotes("cb-plan--sm")}<p class="cb-small cb-cap">Plan de principe : les cotes réelles sont sur la fiche de chaque produit.</p></div>
  <div><p class="cb-lab">Le détail</p><h2 class="cb-h2">Pensé pour le <em>trajet entier</em></h2><ol class="cb-steps"><li><div><b>La coque</b><span>Nervures verticales : la rigidité sans le poids.</span></div></li><li><div><b>Les roues</b><span>Quatre roues doubles, silencieuses, qui pivotent sur 360 degrés.</span></div></li><li><div><b>La poignée</b><span>Télescopique, à plusieurs crans pour votre taille.</span></div></li><li><div><b>La serrure</b><span>À code, conçue pour être ouverte par les contrôles sans la casser.</span></div></li></ol></div></div></div></section>`);
const briques = () => sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap"><p class="cb-lab">Services de la boutique</p><h2 class="cb-h2">Voyager sans surprise</h2><ul class="cb-vals">
  <li><b>Comparer</b>Jusqu'à quatre bagages côte à côte : dimensions, poids, volume, matière. <a href="/boutique/comparer">Ouvrir le comparateur</a>.</li>
  <li><b>Être conseillé</b>Un rendez-vous, sur place ou en visio, pour choisir la bonne taille. <a href="/boutique/rendez-vous">Prendre rendez-vous</a>.</li>
  <li><b>Offrir</b>Une liste de cadeaux pour un départ, un mariage, un anniversaire, avec les quantités réellement offertes.</li>
  <li><b>Nommer</b>Une étiquette nominative, dont le texte saisi sur la fiche est conservé sur la commande.</li></ul></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="cb-hero pk-bleed"><div class="cb-wrap cb-hero-in"><div><p class="cb-lab">Collection voyage</p><div class="cb-h1 cb-h1--xl" role="heading" aria-level="1">Cabine<br><em>haute</em> précision</div><p class="cb-lead">Des valises à coque, des sacs en nylon balistique et de l'aluminium, mesurés au centimètre. Vérifiez le gabarit de votre compagnie, comparez, puis partez léger.</p><p><a class="cb-btn" href="/gabarit">Vérifier mon gabarit</a> <a class="cb-link" href="/boutique">Voir la collection</a></p></div>
    <div class="cb-hero-art">${cotes()}</div></div></section>`),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap"><p class="cb-lab">La sélection</p><h2 class="cb-h2">À la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 4, columns: "4", orderby: "featured", ratio: "4/5" })),
  gabarit(), details(), matieres(), briques(), sec(footer(c))];

const gabaritPage = (c) => [sec(header(c)), head("Gabarit", "Gabarit par compagnie", "Les dimensions cabine et soute, à comparer avec votre bagage."), gabarit("Comparer avec votre bagage"),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-narrow cb-prose"><h2 class="cb-h2">Comment lire ce tableau</h2><p>Chaque ligne donne, pour une compagnie, la cote maximale d'exemple d'un bagage cabine et une indication pour la soute. Le contrôle ci-dessus trie les trois cotes de votre bagage et les compare, dans l'ordre, à celles de chaque ligne.</p><p>Ce n'est jamais une garantie d'embarquement : la compagnie reste seule juge, au comptoir comme à la porte d'embarquement. Vérifiez sur son site, à la date de votre vol, et gardez ses règles à portée de main.</p><p><a href="/boutique/comparer">Comparer les bagages de la boutique</a> pour retrouver les dimensions extérieures de chaque modèle.</p></div></section>`), sec(footer(c))];

const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer", "Ce thème consomme les fonctions de la boutique. Voici où les régler dans l'administration."),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-narrow cb-prose"><ol class="cb-steps">
  <li><div><b>Comparateur de produits</b><span>Dans l'admin, ouvrez un produit, puis la zone « Caractéristiques » : une ligne par caractéristique, au format « Libellé: valeur » (par exemple « Dimensions extérieures (cm): 55 x 40 x 23 »). Utilisez les mêmes libellés d'un produit à l'autre pour que le tableau de /boutique/comparer s'aligne. 20 caractéristiques au maximum ; 4 produits comparés à la fois.</span></div></li>
  <li><div><b>Tableau des compagnies</b><span>Dans le Page Builder, ouvrez la page « Gabarit par compagnie », cliquez le bloc HTML et modifiez les lignes. Les chiffres livrés sont des exemples : remplacez-les par vos vérifications datées.</span></div></li>
  <li><div><b>Rendez-vous conseil</b><span>Onglet « Rendez-vous » : types (visio, sur place), disponibilités et délai minimum. La page /boutique/rendez-vous propose seulement les créneaux libres.</span></div></li>
  <li><div><b>Listes de cadeaux</b><span>Onglet « Listes cadeaux » : suivez les listes créées par vos clients. Les produits personnalisables sont exclus des listes.</span></div></li>
  <li><div><b>Étiquette nominative</b><span>Sur le produit, activez la personnalisation par ligne : libellé, longueur maximale, caractère obligatoire. Le prix ne change pas.</span></div></li>
  <li><div><b>Ventes privées</b><span>Onglet « Accès membre » : réservez un produit ou une catégorie aux membres ou ouvrez une vente privée sur une période. Les dates sont en UTC.</span></div></li>
  <li><div><b>Avis vérifiés</b><span>Seuls les acheteurs d'une commande payée peuvent écrire un avis. Modérez-les dans l'onglet « Avis ».</span></div></li></ol>
  <p class="cb-note">Rien de cela n'est préconfiguré par le thème : tant que vous n'avez rien saisi, ces fonctions n'apparaissent pas sur vos fiches.</p></div></section>`), sec(footer(c))];

const voyager = (c) => [sec(header(c)), head("Conseils", "Bien choisir", "Taille, matière, poids : quelques repères."), matieres(), details(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-narrow cb-prose"><h2 class="cb-h2">Livraison</h2><p>Frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Chaque bagage voyage dans sa housse.</p><h2 class="cb-h2">Retours</h2><p>Un bagage non utilisé, avec son emballage, peut être retourné sous quatorze jours. Écrivez-nous depuis la page <a href="/contact">contact</a>. Une pièce portant une étiquette nominative est fabriquée pour vous : les conditions sont précisées avant la commande.</p><h2 class="cb-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Gabarits, matières, entretien."),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-narrow"><details class="cb-q"><summary>Mon bagage passera-t-il en cabine ?</summary><p>Nous ne pouvons pas le garantir. Comparez les cotes du produit à celles que publie votre compagnie, pour votre vol et votre tarif : ces règles changent.</p></details><details class="cb-q"><summary>D'où viennent les chiffres du tableau ?</summary><p>Ce sont des exemples de démonstration, à remplacer par les vérifications de la boutique. Ils ne sont pas à jour par construction.</p></details><details class="cb-q"><summary>Comment comparer deux valises ?</summary><p>Sur la fiche d'un produit, ajoutez-le au comparateur, puis ouvrez la page de comparaison : jusqu'à quatre produits, avec leurs caractéristiques en tableau.</p></details><details class="cb-q"><summary>Comment entretenir une coque ?</summary><p>Un chiffon humide et un nettoyant doux, jamais de solvant. Rangez le bagage vide, à l'abri de la chaleur.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une taille, une compagnie, une commande."),
  { type: "form", heading: "Écrire à la boutique", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un bagage", "Un modèle, une matière, un coloris."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un bagage…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cb-ph pk-bleed"><div class="cb-wrap cb-narrow"><p class="cb-lab">Page introuvable</p><div class="cb-h1 cb-h1--xl" role="heading" aria-level="1">Vol <em>dérouté</em></div><p class="cb-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "cabine-haute", name: "Cabine Haute", version: "1.0.0", category: "luxe", tags: ["luxe", "technique", "moderne"], siteType: "Bagagerie de voyage premium", featured: true,
  concept: "Le plan technique d'une valise : titane clair, carbone, étiquette orange, cotes qui se tracent, et un gabarit par compagnie aérienne pour comparer ses dimensions à celles d'un bagage.",
  description: "Bagagerie de voyage premium : titane, carbone et aubergine, plans cotés, tableau éditable des gabarits par compagnie (chiffres d'exemple à vérifier), contrôle de dimensions et lien vers le comparateur de produits du moteur.",
  brand: "Cabine Haute", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carte-titane-coins-de-coque-cotes-sous-l-image", gallery: "grande-image-puis-plan-cote-et-details", cart: "page-dediee-carbone-etiquette-orange", catalog: "barre-de-filtres-matiere-et-gabarit" },
  dna: {
    header: "bandeau-titane-logo-gauche-navigation-droite-filet-orange", hero: "asymetrique-plan-de-valise-cote-sur-titane", grid: "quatre-colonnes-cartes-de-coque-nervurees", typo: "syncopate-et-sen",
    shapes: "coins-de-coque-et-nervures-verticales", motion: "cotes-qui-se-tracent-a-l-entree", rhythm: "alternance-titane-clair-bande-carbone-et-planche-de-cotes", signature: "gabarit-par-compagnie-tableau-et-controle-de-dimensions",
    palette: "titane-carbone-aubergine-etiquette-orange", image: "plans-techniques-svg-de-valise-sans-photo", list: "cartes-titane-prix-et-dimensions-sous-la-coque",
    article: "colonne-etapes-numerotees-en-capsules", sidebar: "aucune-planche-de-cotes-en-pied", reading: "sen-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#4a2c6a", secondary: "#14181c", accent: "#ff6b2c", background: "#e4e6e8", surface: "#f2f3f4", text: "#14181c", muted: "#566069", success: "#2f6b48", warning: "#8a5a1a", error: "#a62f2f" },
    fonts: { heading: "font.syncopate", body: "font.sen", button: "font.sen", link: "font.sen" },
    radius: { sm: 6, md: 14, lg: 26, button: 999, field: 10, card: 22 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#bcc2c8" },
    type: { h1: { size: 52, weight: 700, lineHeight: 1.1, transform: "uppercase" }, h2: { size: 30, weight: 700, lineHeight: 1.15, transform: "uppercase" } },
  },
  options: [
    { key: "etiquette", label: "Couleur de l'étiquette (filets et repères)", type: "color", default: "#ff6b2c" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "titane", choices: [["titane", "Titane"], ["clair", "Gris très clair"]] },
    { key: "nervures", label: "Nervures décoratives", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "coins", label: "Coins des cartes", type: "choice", default: "coque", choices: [["coque", "Arrondis de coque"], ["droit", "Droits"]] },
    { key: "entete", label: "Style de l'en-tête", type: "choice", default: "carbone", choices: [["carbone", "Carbone"], ["titane", "Titane clair"]] },
    { key: "sac", label: "Bagage de départ du contrôle de gabarit", type: "choice", default: "cabine", choices: [["cabine", "Valise cabine 55 × 38 × 23"], ["siege", "Sac sous le siège 40 × 30 × 15"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Gabarit", "/gabarit"], ["Bien choisir", "/bien-choisir"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "gabarit", name: "Gabarit par compagnie", render: gabaritPage }, { key: "bien-choisir", name: "Bien choisir", render: voyager },
    { key: "configurer", name: "Comment configurer", render: configurer }, { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
