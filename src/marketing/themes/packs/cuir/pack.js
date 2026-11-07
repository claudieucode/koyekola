// Cuir — maroquinerie de luxe. Direction artistique : le cuir, le savoir-faire, le gros plan d'une couture, l'héritage d'un atelier. Fond sable, cuir sombre, fil d'or en pointillé,
// coins biseautés comme un patron découpé. Composant signature : l'ATELIER DE PERSONNALISATION — des initiales et une couleur de cuir avec aperçu en direct. C'est un bloc éditable
// du Page Builder (attributs data-* lus par motion.js). L'aperçu est une illustration : le texte réellement commandé passe par la personnalisation par ligne du moteur
// (réglage par produit, champ sur la fiche) et la couleur par la variante « Coloris » du produit. Rien n'est simulé côté panier, paiement, avis ou stock.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  mark: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 14h24l-2 20H10zM14 14v-2a6 6 0 0 1 12 0v2" fill="none" stroke="#d6b06a" stroke-width="2"/><path d="M13 19h3M19 19h3M25 19h3" stroke="#d6b06a" stroke-width="1.6" fill="none"/></svg>`,
};
// Illustration de sac (figure par défaut du héros et de l'atelier ; motion.js la remplace par le modèle choisi). Le cuir et le fil se règlent par variables CSS.
const bag = (leather = "#9a4a1e") => `<svg viewBox="0 0 400 360" role="img" aria-label="Illustration d'un sac en cuir surpiqué">
<path class="cu-handle" d="M130 132 C130 40 270 40 270 132"/>
<path class="cu-leather" fill="${leather}" d="M70 130 H330 L352 330 Q353 342 341 342 H59 Q47 342 48 330 Z"/>
<path class="cu-light" d="M70 130 H330 L336 190 H64 Z"/>
<path class="cu-shade" d="M70 130 H330 L318 204 Q200 246 82 204 Z"/>
<path class="cu-thread" d="M86 146 H314 L303 196 Q200 232 97 196 Z"/>
<path class="cu-thread" d="M64 322 H336"/>
<circle class="cu-hardware" cx="200" cy="222" r="11"/><circle class="cu-shade" cx="200" cy="222" r="4"/></svg>`;
// Gros plan de couture (décor) : deux cuirs, une ligne de fil, le grain
const closeup = (a, b) => `<svg viewBox="0 0 480 360" role="img" aria-label="Gros plan d'une couture à la main sur du cuir"><rect width="480" height="360" fill="${a}"/><path d="M0 170 Q120 140 240 170 T480 160 V360 H0 Z" fill="${b}"/><path class="cu-grain" d="M20 40q30-14 60 0t60 0t60 0t60 0t60 0t60 0M0 90q30-14 60 0t60 0t60 0t60 0t60 0t60 0t60 0M30 230q30-14 60 0t60 0t60 0t60 0t60 0M0 290q30-14 60 0t60 0t60 0t60 0t60 0t60 0t60 0"/><g class="cu-seam"><path d="M0 150 Q120 120 240 150 T480 140"/></g><g class="cu-seam cu-seam--b"><path d="M0 190 Q120 160 240 190 T480 180"/></g></svg>`;

const header = (c) => `<header class="cu-head pk-bleed"><div class="cu-promo">Atelier français · Emballage de soin inclus · Livraison et retours : voir les conditions</div>
  <div class="cu-bar"><a class="cu-logo" href="/" aria-label="Cuir, accueil">${ICON.mark}<div><span>Maison Cuir</span><i>maroquinerie d'atelier</i></div></a>
  <div class="cu-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="cu-nav cu-nav--ic" role="navigation" aria-label="Boutique"><a class="cu-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="cu-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="cu-foot pk-bleed"><div class="cu-wrap cu-foot-g">
  <div><p class="cu-lab">Maison Cuir</p><p class="cu-small">Atelier de maroquinerie.<br>Du mardi au samedi, 10 h – 18 h.</p></div>
  <div><p class="cu-lab">Boutique</p><p class="cu-fl"><a href="/boutique">Toutes les pièces</a><a href="/atelier">Personnaliser</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="cu-lab">Informations</p><p class="cu-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="cu-lab">Entretien</p><p class="cu-small">Un chiffon doux et sec. Éloigner de la chaleur et de l'eau. Un nuancier d'entretien accompagne chaque pièce.</p></div></div>
  <p class="cu-copy">© Maison Cuir — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="cu-ph pk-bleed"><div class="cu-wrap cu-narrow"><p class="cu-lab">${esc(kicker)}</p><div class="cu-h1" role="heading" aria-level="1">${esc(title)}</div><p class="cu-lead">${esc(lead)}</p></div></section>`);

// ----- Composant signature : atelier de personnalisation. Les attributs data-* sont lus par motion.js (éditables dans le Page Builder) ; sans script, la figure et la note restent lisibles.
const atelierBloc = (title = "Vos initiales, votre cuir") => sec(`<section class="cu-atelier pk-bleed"><div class="cu-wrap"><p class="cu-lab">Atelier de personnalisation</p><h2 class="cu-h2">${esc(title)}</h2>
  <p class="cu-lead">Tapez vos initiales, choisissez un cuir et un fil : l'aperçu se met à jour sous vos yeux.</p>
  <div class="cu-at" data-cuir-atelier data-max="3" data-cuirs="Cognac:#9a4a1e;Noir:#1d1814;Bordeaux:#5a1d26;Vert sapin:#24392f;Sable:#c8a77a" data-fils="Or:#d6b06a;Ivoire:#efe6d6;Noir:#15110e" data-modeles="Sac:sac;Portefeuille:portefeuille">
    <div class="cu-stage" data-cuir-stage>${bag()}</div>
    <div class="cu-ctl" data-cuir-ui><p class="cu-fallback">L'aperçu interactif demande JavaScript. Sans lui, choisissez le coloris sur la fiche du produit et saisissez vos initiales dans le champ de personnalisation.</p></div>
  </div>
  <p class="cu-note">Aperçu illustratif. À la commande, vos initiales se saisissent dans le champ de personnalisation de la fiche produit (lettres, longueur et caractère obligatoire réglés par produit) et la couleur se choisit comme variante « Coloris ». Seuls les produits dont l'atelier a activé la personnalisation la proposent ; le prix affiché est celui du produit.</p>
  <p><a class="cu-btn" href="/boutique">Voir les pièces</a> <a class="cu-link" href="/livraison">Délais et retours</a></p></div></section>`);

const FICHES = [
  ["Cuir pleine fleur", "La face extérieure de la peau, jamais poncée : il se patine avec vous.", [["Origine", "Veau français"], ["Tannage", "Végétal, 6 semaines"], ["Épaisseur", "1,4 mm"], ["Entretien", "Chiffon sec, crème neutre"]]],
  ["Cuir grainé", "Un grain pressé qui résiste aux rayures du quotidien.", [["Origine", "Bovin italien"], ["Tannage", "Au chrome, sans métaux lourds"], ["Épaisseur", "1,2 mm"], ["Entretien", "Chiffon humide, séchage à l'air"]]],
  ["Cuir velours", "Le côté chair de la peau, doux, à brosser plutôt qu'à frotter.", [["Origine", "Chèvre"], ["Tannage", "Végétal"], ["Épaisseur", "0,9 mm"], ["Entretien", "Brosse en crêpe, imperméabilisant"]]],
];
const fiches = () => sec(`<section class="cu-sec pk-bleed"><div class="cu-wrap cu-split"><div><p class="cu-lab">Les cuirs</p><h2 class="cu-h2">Savoir ce que l'on porte</h2><p class="cu-small">Trois cuirs, trois façons de vieillir. Ouvrez une fiche.</p></div>
  <div class="cu-fiches">${FICHES.map((f, i) => `<details class="cu-fiche"${i === 0 ? " open" : ""}><summary><span class="cu-fiche-t">${esc(f[0])}</span><span class="cu-fiche-s">${esc(f[1])}</span></summary><dl class="cu-dl">${f[2].map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl></details>`).join("")}</div></div></section>`);
const gestes = () => sec(`<section class="cu-sec pk-bleed"><div class="cu-wrap"><div class="cu-close"><figure>${closeup("#7d3714", "#9a4a1e")}<figcaption>Point sellier à deux aiguilles : si un fil casse, la couture tient.</figcaption></figure>
  <div><p class="cu-lab">Le geste</p><h2 class="cu-h2">Cousu main, <em>point par point</em></h2><ol class="cu-steps"><li><div><b>Le patron</b><span>Chaque pièce est découpée à l'emporte-pièce dans la meilleure zone de la peau.</span></div></li><li><div><b>Le parage</b><span>Les bords sont amincis pour que la couture reste plate.</span></div></li><li><div><b>La couture</b><span>Deux aiguilles, un fil ciré, un trou après l'autre.</span></div></li><li><div><b>Le filet</b><span>La tranche est poncée, teintée et lustrée à la main.</span></div></li></ol></div></div></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="cu-dark cu-hero pk-bleed"><div class="cu-wrap cu-hero-in"><div><p class="cu-lab">Collection d'atelier</p><div class="cu-h1 cu-h1--xl" role="heading" aria-level="1">Le cuir<br>qui <em>se souvient</em></div><p class="cu-lead">Des sacs et de la petite maroquinerie cousus main, en petites séries. Une pièce se patine, se répare, se transmet.</p><p><a class="cu-btn" href="/boutique">Découvrir la collection</a> <a class="cu-link" href="/atelier">Composer ma pièce</a></p></div>
    <div class="cu-hero-art">${bag()}<p class="cu-hero-cap">Surpiqûre au fil ciré, quincaillerie laiton</p></div></div></section>`),
  sec(`<section class="cu-sec pk-bleed"><div class="cu-wrap"><p class="cu-lab">Les pièces d'atelier</p><h2 class="cu-h2">À la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 3, columns: "3", orderby: "featured", ratio: "4/5" })),
  atelierBloc(), gestes(), fiches(),
  sec(`<section class="cu-sec pk-bleed"><div class="cu-wrap"><ul class="cu-vals"><li><b>Réparable</b>Une couture qui lâche, une anse usée : l'atelier répare. Les conditions sont indiquées sur la fiche de chaque pièce.</li><li><b>Traçable</b>Chaque peau est suivie de la tannerie à l'atelier ; l'origine figure dans la fiche du cuir.</li><li><b>Honnête</b>Les prix affichés sont les prix payés. Aucune fausse urgence, aucun compte à rebours.</li></ul></div></section>`),
  sec(footer(c))];

const atelier = (c) => [sec(header(c)), head("Personnalisation", "Atelier de personnalisation", "Initiales, cuir, fil : voyez la pièce avant de la choisir."), atelierBloc("Composez votre pièce"),
  sec(`<section class="cu-sec pk-bleed"><div class="cu-wrap cu-narrow cu-prose"><h2 class="cu-h2">Comment ça se passe</h2><ol class="cu-steps"><li><div><b>Choisissez une pièce</b><span>Dans la boutique, ouvrez un produit personnalisable.</span></div></li><li><div><b>Saisissez vos initiales</b><span>Le champ de la fiche produit enregistre le texte exact, par ligne de panier.</span></div></li><li><div><b>Choisissez le coloris</b><span>Le cuir est une variante du produit, avec son propre stock.</span></div></li></ol></div></section>`), sec(footer(c))];
const savoir = (c) => [sec(header(c)), head("Savoir-faire", "Le geste de l'atelier", "Du patron à la tranche lustrée."), gestes(), fiches(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="cu-sec pk-bleed"><div class="cu-wrap cu-narrow cu-prose"><h2 class="cu-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Chaque pièce voyage dans une housse en coton.</p><h2 class="cu-h2">Retours</h2><p>Une pièce non personnalisée et non portée peut être retournée sous quatorze jours. Écrivez-nous depuis la page <a href="/contact">contact</a>. Une pièce portant des initiales est fabriquée pour vous : les conditions sont précisées par l'atelier avant la commande.</p><h2 class="cu-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Cuir, entretien, personnalisation."),
  sec(`<section class="cu-sec pk-bleed"><div class="cu-wrap cu-narrow"><details class="cu-q"><summary>Le cuir marque-t-il avec le temps ?</summary><p>Le cuir pleine fleur se patine : il fonce et s'assouplit. C'est voulu, et c'est ce qui le rend unique.</p></details><details class="cu-q"><summary>Comment entretenir mon sac ?</summary><p>Un chiffon doux et sec, une crème neutre une à deux fois par an, loin de la chaleur et de l'eau.</p></details><details class="cu-q"><summary>Combien de caractères pour mes initiales ?</summary><p>La longueur maximale est réglée par produit et indiquée sur la fiche. Elle est vérifiée par le serveur au moment de l'ajout au panier.</p></details><details class="cu-q"><summary>L'aperçu correspond-il exactement à la pièce ?</summary><p>C'est une illustration. Les couleurs à l'écran peuvent différer légèrement du cuir réel.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur un cuir, une personnalisation, une commande."),
  { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une pièce", "Un modèle, un cuir, un coloris."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cu-ph pk-bleed"><div class="cu-wrap cu-narrow"><p class="cu-lab">Page introuvable</p><div class="cu-h1 cu-h1--xl" role="heading" aria-level="1">Couture <em>défaite</em></div><p class="cu-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "cuir", name: "Cuir", version: "1.0.0", category: "luxe", tags: ["luxe", "classique", "chaleureux"], siteType: "Maroquinerie de luxe", featured: true,
  concept: "Le cuir vu de près : cuir sombre, fil d'or en pointillé, coins biseautés comme un patron découpé, et un atelier de personnalisation (initiales, cuir, fil) avec aperçu en direct.",
  description: "Maroquinerie de luxe : cuir sombre et sable, surpiqûres dorées, gros plans de coutures, fiches de cuirs dépliantes et atelier de personnalisation avec aperçu en direct, relié aux vraies options de produit du moteur.",
  brand: "Maison Cuir", modules: ["formulaires", "recherche", "commerce"], shop: { card: "etiquette-cuir-coins-biseautes-surpiqure", gallery: "grande-image-pleine-colonne-puis-details", cart: "page-dediee-cuir-sombre-filet-surpique", catalog: "barre-de-filtres-etiquette-et-pastilles-de-cuir" },
  dna: {
    header: "bandeau-cuir-sombre-logo-gauche-navigation-droite-surpiqure", hero: "asymetrique-sac-surpique-sur-cuir-sombre", grid: "trois-colonnes-etiquettes-biseautees", typo: "rufina-et-ysabeau",
    shapes: "coins-biseautes-et-surpiqure-pointillee", motion: "couture-qui-se-tisse-a-l-entree", rhythm: "alternance-sable-papier-et-cuir-sombre", signature: "atelier-initiales-et-cuir-apercu-en-direct",
    palette: "cognac-sable-fil-d-or", image: "illustrations-svg-de-sac-et-gros-plans-de-couture-sans-photo", list: "etiquettes-de-cuir-prix-sous-surpiqure",
    article: "colonne-etapes-numerotees-marge-gauche", sidebar: "aucune-marge-de-fabrication", reading: "ysabeau-17-px-mesure-60-caracteres",
  },
  tokens: {
    colors: { primary: "#8e3f17", secondary: "#2a1a12", accent: "#d6b06a", background: "#e9dfcf", surface: "#f4ecdf", text: "#2a1a12", muted: "#6a5444", success: "#3f6b45", warning: "#8a6a2f", error: "#a23b34" },
    fonts: { heading: "font.rufina", body: "font.ysabeau", button: "font.ysabeau", link: "font.ysabeau" },
    radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#c9b79d" },
    type: { h1: { size: 60, weight: 400, lineHeight: 1.08, transform: "none" }, h2: { size: 36, weight: 400, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "fil", label: "Couleur du fil de couture", type: "color", default: "#d6b06a" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "sable", choices: [["sable", "Sable"], ["creme", "Crème"]] },
    { key: "couture", label: "Surpiqûres décoratives", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "atelier", label: "Aperçu de l'atelier", type: "choice", default: "sac", choices: [["sac", "Commence par le sac"], ["portefeuille", "Commence par le portefeuille"]] },
    { key: "grain", label: "Grain du cuir sombre", type: "choice", default: "doux", choices: [["doux", "Doux"], ["plat", "Aplat uni"]] },
    { key: "bords", label: "Coins des cartes", type: "choice", default: "biseaute", choices: [["biseaute", "Biseautés"], ["droit", "Droits"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Personnaliser", "/atelier"], ["Savoir-faire", "/savoir-faire"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "atelier", name: "Atelier de personnalisation", render: atelier }, { key: "savoir-faire", name: "Savoir-faire", render: savoir },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
