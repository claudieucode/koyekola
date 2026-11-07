// Lumière Objet — luminaires design, galerie d'ombre et de lumière. Direction artistique : une salle sombre où chaque objet est éclairé comme une sculpture. Fond graphite, texte ivoire,
// une seule couleur de lumière (réglable) ; titres en Didot (GFS Didot), lecture en Questrial. Composant signature : le SIMULATEUR D'AMBIANCE — un bloc éditable du Page Builder où l'on
// allume / éteint une scène et choisit une température de lumière (chaude, neutre, froide), en HTML « details » + CSS pur (aucune image, aucun script obligatoire).
// Les produits viennent du vrai moteur de boutique (widget shopgrid) ; rien n'est simulé côté panier, paiement, stock ou avis.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  lamp: `<svg viewBox="0 0 40 56" aria-hidden="true"><path d="M20 0v22" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M6 40Q20 14 34 40Z" fill="currentColor"/><circle class="lo-logo-b" cx="20" cy="44" r="5"/></svg>`,
};

const header = (c) => `<header class="lo-head pk-bleed"><div class="lo-promo">Le prix affiché est le prix payé · Livraison calculée à la commande</div>
  <div class="lo-bar"><a class="lo-logo" href="/" aria-label="Lumière Objet, accueil">${ICON.lamp}<span class="lo-logo-t"><b>Lumière Objet</b><i>luminaires de galerie</i></span></a>
  <div class="lo-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="lo-act" role="navigation" aria-label="Boutique"><a class="lo-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="lo-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="lo-foot pk-bleed"><div class="lo-wrap lo-foot-g">
  <div><p class="lo-lab">Lumière Objet</p><p class="lo-small">Luminaires design présentés comme des pièces de galerie. Un conseil d'éclairage ? Écrivez-nous depuis la page contact.</p></div>
  <div><p class="lo-lab">Boutique</p><p class="lo-fl"><a href="/boutique">Tous les luminaires</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="lo-lab">Informations</p><p class="lo-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="lo-lab">Bon à savoir</p><p class="lo-small">La température de couleur d'une ampoule s'exprime en kelvins (K) : plus le nombre est bas, plus la lumière est chaude.</p></div></div>
  <p class="lo-copy">© Lumière Objet — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="lo-ph pk-bleed"><div class="lo-wrap lo-narrow"><p class="lo-lab">${esc(kicker)}</p><div class="lo-h1" role="heading" aria-level="1">${esc(title)}</div><p class="lo-lead">${esc(lead)}</p></div></section>`);

/* ---- Composant signature : simulateur d'ambiance lumineuse (details + CSS pur) ---- */
const TEMPS = [
  ["t1", "Chaude", "2700 K", "Proche d'une ampoule à incandescence. Salon, chambre, coin lecture : les bois et les laitons s'adoucissent."],
  ["t2", "Neutre", "4000 K", "Une lumière franche et claire. Cuisine, bureau, entrée : les couleurs restent fidèles."],
  ["t3", "Froide", "5500 K", "Proche de la lumière du jour. Atelier, plan de travail, salle d'eau : les teintes chaudes paraissent plus vives."],
];
const SCENE = `<svg class="lo-scene" viewBox="0 0 400 300" aria-hidden="true" focusable="false">
  <rect class="lo-floor-r" x="0" y="240" width="400" height="60"/>
  <path class="lo-cone" d="M176 102 L112 240 L288 240 L224 102Z"/>
  <path class="lo-cast" d="M70 205 C54 188 62 168 70 156 L84 156 C92 168 102 188 86 205Z"/>
  <line class="lo-wire" x1="200" y1="0" x2="200" y2="70"/>
  <path class="lo-obj" d="M168 104 Q200 52 232 104Z"/>
  <circle class="lo-bulb" cx="200" cy="106" r="11"/>
  <rect class="lo-obj" x="62" y="207" width="276" height="10" rx="1"/>
  <rect class="lo-obj" x="78" y="217" width="6" height="42"/><rect class="lo-obj" x="316" y="217" width="6" height="42"/>
  <path class="lo-obj" d="M108 207 C94 190 102 170 110 158 L124 158 C132 170 142 190 128 207Z"/>
  <line class="lo-stem" x1="114" y1="158" x2="104" y2="128"/><line class="lo-stem" x1="118" y1="158" x2="124" y2="122"/><line class="lo-stem" x1="121" y1="158" x2="140" y2="134"/>
  <rect class="lo-obj" x="262" y="197" width="16" height="10"/>
  <circle class="lo-globe" cx="270" cy="172" r="26"/>
  <ellipse class="lo-pool" cx="200" cy="241" rx="92" ry="9"/>
</svg>`;
const simulateur = (titre = "Allumez la pièce avant d'acheter") => `<section class="lo-sim pk-bleed"><div class="lo-wrap">
  <p class="lo-lab">Simulateur d'ambiance</p><h2 class="lo-h2">${esc(titre)}</h2>
  <p class="lo-lead">Ouvrez une température pour allumer la scène, refermez-la pour l'éteindre. Un aperçu pour comparer des ambiances, pas un rendu photographique.</p>
  <div class="lo-sim-box">
    <div class="lo-room" role="img" aria-label="Aperçu schématique d'un salon : une suspension, une console, un vase et une lampe sphérique, éteints ou allumés selon la température choisie.">
      <div class="lo-wall"></div><div class="lo-glow lo-glow--a"></div><div class="lo-glow lo-glow--b"></div>${SCENE}
      <p class="lo-state"><span class="lo-st lo-st--off">Éteint</span><span class="lo-st lo-st--t1">Allumé · chaude 2700 K</span><span class="lo-st lo-st--t2">Allumé · neutre 4000 K</span><span class="lo-st lo-st--t3">Allumé · froide 5500 K</span></p>
    </div>
    <div class="lo-ctl">
      ${TEMPS.map((t) => `<details class="lo-sw lo-${t[0]}"><summary><span class="lo-sw-k" aria-hidden="true"></span><span class="lo-sw-t">${esc(t[1])}<em>${esc(t[2])}</em></span></summary><p>${esc(t[3])}</p></details>`).join("")}
      <p class="lo-note">Les couleurs réelles dépendent de votre écran et de l'ampoule choisie. La température de chaque produit est donnée sur sa fiche lorsqu'elle est renseignée.</p>
    </div>
  </div></div></section>`;

const GUIDE = [
  ["Où poser quoi ?", "Une suspension éclaire une table ou un passage, une lampe à poser crée un îlot de lumière, une applique dessine le mur. Mélanger deux hauteurs donne de la profondeur."],
  ["Lumens, pas watts", "Le watt mesure ce que la lampe consomme, le lumen ce qu'elle éclaire. Pour un salon, on répartit plusieurs sources plutôt qu'une seule très forte."],
  ["Chaude, neutre ou froide ?", "Chaude (autour de 2700 K) pour se détendre, neutre (autour de 4000 K) pour travailler, froide (autour de 5500 K) pour les tâches de précision."],
];
const guide = () => sec(`<section class="lo-sec pk-bleed"><div class="lo-wrap"><p class="lo-lab">Guide de la lumière</p><h2 class="lo-h2">Trois repères</h2>
  <div class="lo-guide">${GUIDE.map((g, i) => `<details class="lo-fiche"${i === 0 ? " open" : ""}><summary><span class="lo-fiche-n" aria-hidden="true">0${i + 1}</span><span class="lo-fiche-t">${esc(g[0])}</span></summary><p>${esc(g[1])}</p></details>`).join("")}</div></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="lo-hero pk-bleed"><div class="lo-beam" aria-hidden="true"></div><div class="lo-wrap lo-hero-in"><div class="lo-hero-t"><p class="lo-lab">Luminaires design</p><div class="lo-h1 lo-h1--xl" role="heading" aria-level="1">La lumière<br>se sculpte</div><p class="lo-lead">Suspensions, lampes à poser, appliques : chaque pièce est pensée pour ce qu'elle projette autant que pour ce qu'elle est.</p><p><a class="lo-btn" href="/boutique">Entrer dans la galerie</a> <a class="lo-link" href="/ambiances">Essayer les ambiances</a></p></div>
    <svg class="lo-hero-lamp" viewBox="0 0 240 300" aria-hidden="true" focusable="false"><line x1="120" y1="0" x2="120" y2="96" stroke="currentColor" stroke-width="1.4"/><path class="lo-hl-a" d="M44 190 Q120 70 196 190Z"/><path class="lo-hl-b" d="M70 190 Q120 110 170 190Z"/><circle class="lo-hl-c" cx="120" cy="198" r="16"/><ellipse class="lo-hl-d" cx="120" cy="286" rx="84" ry="8"/></svg></div></section>`),
  sec(`<section class="lo-sec lo-sec--top pk-bleed"><div class="lo-wrap"><p class="lo-lab">La galerie</p><h2 class="lo-h2">Pièces à la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 4, columns: "4", orderby: "featured", ratio: "4/5" })),
  sec(simulateur()),
  sec(`<section class="lo-sec pk-bleed"><div class="lo-wrap"><p class="lo-lab">Dernières arrivées</p><h2 class="lo-h2">Nouveaux objets</h2></div></section>`),
  wrap(shopgrid({ source: "newest", count: 4, columns: "4", orderby: "newest", ratio: "4/5" })),
  guide(),
  sec(`<section class="lo-sec pk-bleed"><div class="lo-wrap lo-narrow"><p class="lo-lab">Notre parti pris</p><ul class="lo-vals"><li><b>Objet d'abord</b>Un luminaire éteint doit déjà être beau : on le choisit comme une sculpture.</li><li><b>Lumière juste</b>Chaque fiche indique la douille et, lorsqu'elle est connue, la température de couleur.</li><li><b>Honnête</b>Les prix affichés sont les prix payés. Pas de fausse urgence, pas de compte à rebours.</li></ul></div></section>`),
  sec(footer(c))];

const ambiances = (c) => [sec(header(c)), head("Ambiances", "Essayer la lumière", "Allumer, éteindre, comparer trois températures."), sec(simulateur("Chaude, neutre ou froide ?")), guide(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="lo-sec pk-bleed"><div class="lo-wrap lo-narrow lo-prose"><h2 class="lo-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Les pièces fragiles (verre, opaline) sont calées individuellement.</p><h2 class="lo-h2">Retours</h2><p>Écrivez-nous depuis la page <a href="/contact">contact</a> pour organiser un retour : les conditions applicables sont celles indiquées par la boutique lors de la commande.</p><h2 class="lo-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Ampoules, douilles, hauteurs."),
  sec(`<section class="lo-sec pk-bleed"><div class="lo-wrap lo-narrow"><details class="lo-q"><summary>L'ampoule est-elle fournie ?</summary><p>Cela dépend du modèle : la fiche produit précise si l'ampoule est incluse ainsi que le type de douille.</p></details><details class="lo-q"><summary>Quelle température de couleur choisir ?</summary><p>Autour de 2700 K pour une pièce de détente, 4000 K pour une cuisine ou un bureau. Le simulateur d'ambiance de la page <a href="/ambiances">Ambiances</a> aide à comparer.</p></details><details class="lo-q"><summary>À quelle hauteur accrocher une suspension ?</summary><p>Au-dessus d'une table, on laisse en général environ 60 à 75 cm entre le plateau et le bas du luminaire. Dans un passage, il faut surtout dégager la tête.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une pièce, une douille, une hauteur de plafond."),
  { type: "form", heading: "Écrire à la galerie", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un luminaire", "Un modèle, une matière, une finition."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un luminaire…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="lo-ph pk-bleed"><div class="lo-wrap lo-narrow"><p class="lo-lab">Page introuvable</p><div class="lo-h1 lo-h1--xl" role="heading" aria-level="1">Pièce éteinte</div><p class="lo-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la galerie</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "lumiere-objet", name: "Lumière Objet", version: "1.0.0", category: "luxe", tags: ["sombre", "luxe", "moderne"], siteType: "Boutique de luminaires design", featured: false,
  concept: "Ombre et lumière : une salle de galerie sombre où les luminaires sont éclairés comme des sculptures, avec un simulateur pour allumer et éteindre l'ambiance.",
  description: "Luminaires design : fond graphite, Didot et Questrial, faisceau qui suit le curseur, simulateur d'ambiance allumé / éteint (chaude, neutre, froide) en CSS pur, boutique réelle en pages sombres.",
  brand: "Lumière Objet", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "image-sur-socle-lumineux-legende-gauche", gallery: "visuel-unique-sur-socle-sombre-centre", cart: "page-dediee-fond-sombre", catalog: "filtres-en-bandeau-sous-le-titre" },
  dna: {
    header: "logo-suspendu-a-un-fil-menu-a-lueur", hero: "faisceau-qui-suit-le-curseur-sur-lampe-sculpture", grid: "quatre-colonnes-portrait-sur-socle-lumineux", motion: "faisceau-qui-respire-et-lueur-au-survol",
    shapes: "disques-domes-et-cones-de-lumiere", rhythm: "alternance-de-bandes-d-ombre-et-de-halo", signature: "simulateur-d-ambiance-allume-eteint-trois-temperatures",
    palette: "graphite-nuit-ivoire-halogene-et-bleu-glace-de-lumiere-froide", image: "luminaires-dessines-en-svg-et-css-sous-faisceau-sans-photo",
    list: "cartes-sur-socle-ou-fiches-numerotees-depliantes", article: "colonne-sombre-avec-fiche-de-douille-et-temperature-en-encadre", sidebar: "aucune-colonne-laterale-les-fiches-depliantes-font-office-de-marge",
    reading: "ivoire-sur-graphite-17-px-interligne-1-7-colonne-de-62-caracteres",
  },
  tokens: {
    colors: { primary: "#ffd48a", secondary: "#17181d", accent: "#cfe3ff", background: "#17181d", surface: "#22242b", text: "#f1ece2", muted: "#a9a79f", success: "#8fc59a", warning: "#ffd48a", error: "#ff8f84" },
    fonts: { heading: "font.gfs-didot", body: "font.questrial", button: "font.questrial", link: "font.questrial" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#363944" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.04, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur de la lumière chaude", type: "color", default: "#ffd48a" },
    { key: "fond", label: "Fond", type: "choice", default: "graphite", choices: [["graphite", "Graphite"], ["noir", "Noir de galerie"], ["prune", "Prune de nuit"]] },
    { key: "faisceau", label: "Faisceau de l'accueil", type: "choice", default: "on", choices: [["on", "Respire et suit le curseur"], ["off", "Fixe"]] },
    { key: "lueur", label: "Lueur sous les produits", type: "choice", default: "douce", choices: [["douce", "Douce"], ["nette", "Marquée"], ["off", "Aucune"]] },
    { key: "titres", label: "Titres", type: "choice", default: "normale", choices: [["normale", "Casse normale"], ["capitales", "Capitales espacées"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "contraste", label: "Contraste des filets", type: "choice", default: "normal", choices: [["normal", "Normal"], ["fort", "Renforcé"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Ambiances", "/ambiances"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "ambiances", name: "Ambiances", render: ambiances }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
