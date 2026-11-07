// Salon Vivant — mobilier en ligne grand public. Direction artistique : l'intérieur de vie, la chaleur du lin et de la terre cuite, les mises en situation plutôt que les fiches froides.
// Les visuels sont des arches de porte et de fenêtre ; une scène de salon dessinée porte des repères cliquables. Composant signature : la VUE PAR PIÈCE (salon, chambre, cuisine, bureau, entrée,
// extérieur), un bloc éditable du Page Builder dont chaque lien ouvre le VRAI catalogue filtré (étiquette de pièce ou catégorie du moteur), complété par le bloc « Dimensions et livraison ».
// Rien n'est simulé : pas de panier, de paiement, de stock ni d'avis écrits ici. La livraison (zones, méthodes, coût, délai) est calculée par le moteur à la commande.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

/* ---------- Pièces : étiquette réelle du moteur + catégories réelles de la démonstration ---------- */
const PIECES = [
  { tag: "salon", name: "Salon", lead: "Canapés, fauteuils, tables basses et lumière d'appoint.", cats: [["Canapés et fauteuils", "canapes-et-fauteuils"], ["Luminaires et textiles", "luminaires-et-textiles"]] },
  { tag: "chambre", name: "Chambre", lead: "Lits, chevets, commodes et rangements qui se ferment.", cats: [["Chambre et rangement", "chambre-et-rangement"], ["Luminaires et textiles", "luminaires-et-textiles"]] },
  { tag: "cuisine", name: "Cuisine et repas", lead: "Tables, chaises et tabourets pour manger sans se serrer.", cats: [["Tables et chaises", "tables-et-chaises"]] },
  { tag: "bureau", name: "Bureau", lead: "Un plan de travail et une assise qui tiennent la journée.", cats: [["Bureau", "bureau"]] },
  { tag: "entree", name: "Entrée", lead: "Consoles, miroirs et patères pour bien rentrer.", cats: [["Chambre et rangement", "chambre-et-rangement"]] },
  { tag: "exterieur", name: "Balcon et jardin", lead: "Du mobilier qui supporte la pluie et le soleil.", cats: [["Extérieur", "exterieur"]] },
];

const ICON = {
  sofa: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3zM6 17v2M18 17v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};

/* Petites vignettes de pièce (décor, sans texte) : toutes les couleurs viennent des classes du thème */
const MINI = {
  salon: `<path class="sv-m-a" d="M20 56h80v22H20z"/><rect class="sv-m-b" x="14" y="46" width="16" height="32" rx="7"/><rect class="sv-m-b" x="90" y="46" width="16" height="32" rx="7"/><rect class="sv-m-c" x="30" y="38" width="60" height="26" rx="10"/><path class="sv-m-d" d="M104 78V40M98 40h12"/><circle class="sv-m-e" cx="104" cy="34" r="9"/>`,
  chambre: `<rect class="sv-m-c" x="16" y="30" width="10" height="48" rx="3"/><rect class="sv-m-a" x="22" y="54" width="82" height="20" rx="5"/><rect class="sv-m-b" x="30" y="44" width="24" height="14" rx="6"/><rect class="sv-m-b" x="58" y="46" width="40" height="12" rx="5"/><rect class="sv-m-c" x="104" y="56" width="12" height="22" rx="2"/><circle class="sv-m-e" cx="110" cy="48" r="6"/>`,
  cuisine: `<ellipse class="sv-m-c" cx="60" cy="52" rx="38" ry="7"/><path class="sv-m-d" d="M36 56l-6 22M84 56l6 22M60 59v19"/><rect class="sv-m-b" x="14" y="46" width="14" height="6" rx="3"/><path class="sv-m-d" d="M18 52v26M10 40v12"/><rect class="sv-m-b" x="92" y="46" width="14" height="6" rx="3"/><path class="sv-m-d" d="M102 52v26M110 40v12M60 6v22"/><path class="sv-m-e" d="M48 34a12 12 0 0 1 24 0z"/>`,
  bureau: `<rect class="sv-m-c" x="16" y="46" width="88" height="8" rx="3"/><path class="sv-m-d" d="M24 54v24M96 54v24"/><rect class="sv-m-a" x="60" y="54" width="32" height="18" rx="3"/><path class="sv-m-d" d="M30 46V28l16-8"/><circle class="sv-m-e" cx="50" cy="20" r="6"/><rect class="sv-m-b" x="44" y="62" width="14" height="6" rx="3"/>`,
  entree: `<path class="sv-m-a" d="M34 78V34a26 26 0 0 1 52 0v44z"/><path class="sv-m-e" d="M42 74V36a18 18 0 0 1 36 0v38z"/><rect class="sv-m-c" x="22" y="60" width="76" height="8" rx="3"/><path class="sv-m-d" d="M30 68v10M90 68v10"/><circle class="sv-m-b" cx="60" cy="54" r="5"/>`,
  exterieur: `<path class="sv-m-e" d="M20 40a40 22 0 0 1 80 0z"/><path class="sv-m-d" d="M60 18v60"/><rect class="sv-m-c" x="30" y="58" width="22" height="6" rx="3"/><path class="sv-m-d" d="M34 64v14M48 64v14"/><circle class="sv-m-b" cx="92" cy="70" r="9"/><path class="sv-m-d" d="M92 79v1"/>`,
};
const mini = (k) => `<svg class="sv-mini" viewBox="0 0 120 90" aria-hidden="true">${MINI[k]}</svg>`;

/* Scène de salon dessinée : pas de texte dans le SVG, les repères cliquables sont de vrais liens HTML posés dessus */
const scene = () => `<svg class="sv-scene-svg" viewBox="0 0 640 400" role="img" aria-label="Illustration d'un salon : canapé, lampadaire, table d'appoint et plante">
<rect class="sv-wall" width="640" height="292"/><rect class="sv-floor" y="292" width="640" height="108"/>
<path class="sv-win" d="M60 262V120a65 65 0 0 1 130 0V262z"/><path class="sv-mull" d="M125 55V262M60 150H190"/><path class="sv-sun" d="M190 292L330 292L250 360L110 360z"/>
<rect class="sv-frame" x="262" y="66" width="76" height="100" rx="4"/><rect class="sv-art" x="272" y="76" width="56" height="80" rx="30"/><circle class="sv-art2" cx="300" cy="112" r="14"/>
<ellipse class="sv-rug" cx="320" cy="346" rx="250" ry="34"/>
<rect class="sv-sofa-b" x="132" y="196" width="300" height="86" rx="28"/><rect class="sv-sofa" x="108" y="244" width="348" height="58" rx="22"/><rect class="sv-sofa-b" x="94" y="224" width="52" height="86" rx="22"/><rect class="sv-sofa-b" x="418" y="224" width="52" height="86" rx="22"/>
<rect class="sv-cush1" x="152" y="210" width="74" height="62" rx="18" transform="rotate(-6 189 241)"/><rect class="sv-cush2" x="338" y="214" width="70" height="58" rx="18" transform="rotate(7 373 243)"/>
<path class="sv-leg" d="M120 302V318M444 302V318"/>
<path class="sv-stem" d="M580 118V318"/><path class="sv-base" d="M556 322H604"/><circle class="sv-glow" cx="580" cy="106" r="74"/><path class="sv-shade" d="M548 118L612 118L600 74L560 74z"/>
<ellipse class="sv-tabletop" cx="518" cy="286" rx="38" ry="8"/><path class="sv-leg" d="M492 290L486 330M544 290L550 330"/><path class="sv-vase" d="M510 280q-6-26 8-26q14 0 8 26z"/><path class="sv-twig" d="M518 254q-4-24 10-38M518 254q2-22-8-34"/>
<path class="sv-pot" d="M24 318h52l-8 56H32z"/><ellipse class="sv-leaf" cx="36" cy="270" rx="12" ry="40" transform="rotate(-24 36 270)"/><ellipse class="sv-leaf sv-leaf2" cx="52" cy="250" rx="12" ry="46"/><ellipse class="sv-leaf" cx="68" cy="272" rx="12" ry="38" transform="rotate(26 68 272)"/>
</svg>`;

const header = (c) => `<header class="sv-head pk-bleed"><div class="sv-top"><div class="sv-wrap sv-top-in"><p class="sv-ann">Frais et délai de livraison calculés à la commande selon votre adresse</p>
  <div class="sv-toplinks" role="navigation" aria-label="Informations">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/" && m.url !== "/pieces").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div></div>
  <div class="sv-wrap sv-bar"><a class="sv-logo" href="/" aria-label="Salon Vivant, accueil">${ICON.sofa}<span>Salon <em>Vivant</em></span></a>
  <a class="sv-search" href="/recherche">${ICON.search}<span>Un canapé, une table, un luminaire…</span></a>
  <div class="sv-act"><a class="sv-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}<span>Compte</span></a><a class="sv-ic sv-ic--cart" href="/boutique/panier" aria-label="Panier">${ICON.bag}<span>Panier</span></a></div></div>
  <div class="sv-rail pk-bleed" role="navigation" aria-label="Choisir une pièce"><div class="sv-wrap sv-rail-in"><a class="sv-rail-all" href="/boutique">Tout le mobilier</a>${PIECES.map((p) => `<a class="sv-chip" href="/boutique/etiquette/${p.tag}">${esc(p.name)}</a>`).join("")}<a class="sv-chip sv-chip--p" href="/pieces">Vue par pièce</a></div></div></header>`;

const footer = (c) => `<footer class="sv-foot pk-bleed"><div class="sv-wrap sv-foot-g">
  <div><p class="sv-lab">Salon Vivant</p><p class="sv-small">Mobilier pour les pièces où l'on vit.<br>Du lundi au vendredi, 9 h – 17 h.</p></div>
  <div><p class="sv-lab">Par pièce</p><p class="sv-fl">${PIECES.map((p) => `<a href="/boutique/etiquette/${p.tag}">${esc(p.name)}</a>`).join("")}</p></div>
  <div><p class="sv-lab">Boutique</p><p class="sv-fl"><a href="/boutique">Tout le mobilier</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a><a href="/boutique/souhaits">Mes souhaits</a></p></div>
  <div><p class="sv-lab">Informations</p><p class="sv-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div>
  <p class="sv-copy">© Salon Vivant — boutique de démonstration du thème</p></footer>`;

const head = (kicker, title, lead) => sec(`<section class="sv-ph pk-bleed"><div class="sv-wrap sv-narrow"><p class="sv-lab">${esc(kicker)}</p><div class="sv-h1" role="heading" aria-level="1">${esc(title)}</div><p class="sv-lead">${esc(lead)}</p></div></section>`);

/* ---------- Composant signature : la vue par pièce ---------- */
const roomCard = (p, i) => `<article class="sv-room sv-room--${i + 1}"><a class="sv-room-pic" href="/boutique/etiquette/${p.tag}" aria-label="${esc(p.name)} : voir tous les articles">${mini(p.tag)}</a>
  <div class="sv-room-b"><h3 class="sv-h3">${esc(p.name)}</h3><p class="sv-small">${esc(p.lead)}</p>
  <p class="sv-room-l"><a class="sv-link" href="/boutique/etiquette/${p.tag}">Toute la pièce</a>${p.cats.map((c) => `<a href="/boutique/categorie/${c[1]}">${esc(c[0])}</a>`).join("")}</p></div></article>`;
const piecesBloc = (title = "Quelle pièce meublez-vous ?") => sec(`<section class="sv-pieces pk-bleed"><div class="sv-wrap"><p class="sv-lab">Vue par pièce</p><h2 class="sv-h2">${esc(title)}</h2>
  <p class="sv-lead">Choisissez la pièce : chaque carte ouvre le vrai catalogue, filtré par l'étiquette de la pièce ou par une catégorie de la boutique.</p>
  <div class="sv-rooms" data-salon-pieces>${PIECES.map(roomCard).join("")}</div></div></section>`);

/* ---------- Dimensions et livraison ---------- */
const MESURES = [
  ["Le passage", "Largeur de la porte d'entrée, du couloir et de l'escalier, mesurée à l'endroit le plus étroit, poignées et plinthes comprises."],
  ["L'escalier", "Hauteur sous plafond dans la montée, largeur des marches et présence d'un palier pour tourner un meuble long."],
  ["La pièce", "Longueur et largeur utiles, position des prises, radiateurs et ouvrants. Ajoutez au sol une bande de ruban pour visualiser l'emprise."],
  ["La circulation", "Prévoyez environ 60 cm libres pour passer autour d'un meuble, davantage devant un rangement qui s'ouvre."],
];
const mesures = () => `<ol class="sv-meas">${MESURES.map((m) => `<li><div><b>${esc(m[0])}</b><span>${esc(m[1])}</span></div></li>`).join("")}</ol>`;
const passageBloc = () => sec(`<section class="sv-dim pk-bleed"><div class="sv-wrap sv-split"><div><p class="sv-lab">Dimensions</p><h2 class="sv-h2">Ça passe, ou ça ne passe pas ?</h2>
  <p class="sv-lead">Les dimensions exactes d'un meuble figurent sur sa fiche. Comparez-les à ce que vous mesurez chez vous avant de commander.</p>${mesures()}</div>
  <div class="sv-pass" data-salon-passage><p class="sv-lab">Contrôle de passage</p><p class="sv-fallback">Mesurez la plus petite dimension du meuble emballé (largeur, profondeur ou hauteur de la fiche) et le passage le plus étroit chez vous : le meuble doit être plus petit que le passage, avec 2 cm de marge de chaque côté.</p></div></div></section>`);
const livraisonBloc = () => sec(`<section class="sv-liv pk-bleed"><div class="sv-wrap"><p class="sv-lab">Livraison</p><h2 class="sv-h2">Comment votre meuble arrive</h2>
  <div class="sv-livg"><div class="sv-card"><h3 class="sv-h3">Calculée par la boutique</h3><p class="sv-small">Les zones, les méthodes de livraison, leur coût et leur délai sont réglés par la boutique. Vous les voyez au panier puis à la commande, avant de payer : rien n'est estimé ici.</p></div>
  <div class="sv-card"><h3 class="sv-h3">Pensez à l'accès</h3><p class="sv-small">Étage, ascenseur, stationnement, passage étroit : notez-les avant la commande. Si le vendeur propose un montage ou la reprise d'un ancien meuble, il l'indique sur la fiche du produit.</p></div>
  <div class="sv-card"><h3 class="sv-h3">Un doute sur une cote ?</h3><p class="sv-small">Écrivez-nous depuis la page <a href="/contact">contact</a> avec le nom du produit et vos mesures. Nous répondons avant que vous ne commandiez.</p></div></div>
  <p class="sv-note">Ce thème n'ajoute aucun créneau de livraison ni option payante : seules les méthodes réglées dans la boutique sont proposées.</p></div></section>`);

const scenebloc = () => sec(`<section class="sv-hero pk-bleed"><div class="sv-wrap sv-hero-in"><div class="sv-hero-t"><p class="sv-lab">Mobilier pour la vie de tous les jours</p><div class="sv-h1 sv-h1--xl" role="heading" aria-level="1">Une maison<br>qui se <em>vit</em></div>
  <p class="sv-lead">Des canapés, des tables et des rangements pensés pour de vraies pièces, avec leurs dimensions bien en vue. Commencez par la pièce qui vous manque.</p><p><a class="sv-btn" href="/pieces">Choisir une pièce</a> <a class="sv-link" href="/boutique">Voir tout le mobilier</a></p></div>
  <div class="sv-scene" data-salon-scene>${scene()}
    <a class="sv-hs sv-hs--1" href="/boutique/categorie/canapes-et-fauteuils"><i></i><span>Canapés et fauteuils</span></a>
    <a class="sv-hs sv-hs--2" href="/boutique/categorie/luminaires-et-textiles"><i></i><span>Luminaires et textiles</span></a>
    <a class="sv-hs sv-hs--3" href="/boutique/categorie/tables-et-chaises"><i></i><span>Tables et chaises</span></a></div></div></section>`);

const home = (c) => [sec(header(c)), scenebloc(), piecesBloc(),
  sec(`<section class="sv-sec pk-bleed"><div class="sv-wrap"><p class="sv-lab">Nos préférés</p><h2 class="sv-h2">Pour commencer</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "4/5" })),
  passageBloc(), livraisonBloc(),
  sec(`<section class="sv-sec pk-bleed"><div class="sv-wrap"><ul class="sv-vals"><li><b>Cotes en clair</b>Largeur, profondeur et hauteur visibles sur la fiche, pour mesurer avant d'acheter.</li><li><b>Prix affichés = prix payés</b>Aucune fausse urgence, aucun compte à rebours, aucun stock inventé.</li><li><b>Composez la pièce</b>Des suggestions de la même pièce sous chaque fiche, sans vous noyer dans les options.</li></ul></div></section>`),
  sec(footer(c))];

const pieces = (c) => [sec(header(c)), head("Par pièce", "Meubler pièce par pièce", "Partez de la pièce, pas du catalogue."), piecesBloc("Six pièces, six entrées"),
  sec(`<section class="sv-sec pk-bleed"><div class="sv-wrap sv-narrow sv-prose"><h2 class="sv-h2">Une pièce après l'autre</h2><p>Commencez par la pièce qui sert le plus : c'est là qu'un bon canapé ou une bonne table se rentabilise vite. Les étiquettes de pièce sont celles de la boutique ; un article peut appartenir à plusieurs pièces.</p><p>Pour mesurer avant de choisir, ouvrez la page <a href="/dimensions-livraison">Dimensions et livraison</a>.</p></div></section>`), sec(footer(c))];

const dimensions = (c) => [sec(header(c)), head("Dimensions · Livraison", "Dimensions et livraison", "Mesurez d'abord, commandez ensuite."), passageBloc(), livraisonBloc(),
  sec(`<section class="sv-sec pk-bleed"><div class="sv-wrap sv-narrow sv-prose"><h2 class="sv-h2">Retours</h2><p>Les conditions de retour sont celles indiquées par la boutique sur chaque fiche et à la commande. Un meuble encombrant se retourne rarement sur un simple coup de téléphone : mesurez avant, et écrivez-nous en cas de doute depuis la page <a href="/contact">contact</a>.</p></div></section>`), sec(footer(c))];

const CONSEILS = [
  ["Un canapé", "Visez une profondeur d'assise qui permet de s'asseoir dos droit, pieds au sol. Vérifiez que le déhoussage est possible si vous avez des enfants ou des animaux."],
  ["Une table", "Comptez environ 60 cm de largeur par convive. Laissez au moins 80 cm entre la table et le mur pour reculer une chaise."],
  ["Un rangement", "Mesurez la place nécessaire pour ouvrir les portes ou tirer les tiroirs, pas seulement l'emprise du meuble fermé."],
  ["Un bureau", "Un plan de travail d'environ 120 cm de large suffit pour un écran et un carnet. Placez-le de préférence perpendiculaire à la fenêtre."],
];
const conseils = (c) => [sec(header(c)), head("Conseils", "Bien choisir son mobilier", "Quelques repères avant de commander."),
  sec(`<section class="sv-sec pk-bleed"><div class="sv-wrap sv-narrow">${CONSEILS.map((q, i) => `<details class="sv-q"${i === 0 ? " open" : ""}><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join("")}<p class="sv-small">Ce sont des repères généraux, pas des règles : fiez-vous aux cotes de la fiche et à vos mesures.</p></div></section>`), piecesBloc("Retourner à une pièce"), sec(footer(c))];

const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Dimensions, livraison, retours."),
  sec(`<section class="sv-sec pk-bleed"><div class="sv-wrap sv-narrow"><details class="sv-q"><summary>Comment savoir si un meuble passera chez moi ?</summary><p>Comparez les cotes de la fiche à vos passages les plus étroits (porte, escalier, ascenseur). Le contrôle de passage de la page <a href="/dimensions-livraison">Dimensions et livraison</a> vous aide à le vérifier.</p></details><details class="sv-q"><summary>Combien coûte la livraison ?</summary><p>Cela dépend de votre adresse et de la méthode choisie. Le montant exact apparaît au panier et à la commande, avant le paiement.</p></details><details class="sv-q"><summary>Les meubles sont-ils livrés montés ?</summary><p>Cela dépend de chaque produit : la fiche précise si le meuble est livré monté ou à monter.</p></details><details class="sv-q"><summary>Puis-je retourner un meuble ?</summary><p>Les conditions de retour sont indiquées par la boutique à la commande. Écrivez-nous depuis la page <a href="/contact">contact</a> en cas de doute.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une cote, un tissu, une livraison : posez votre question."), { type: "form", heading: "Écrire à Salon Vivant", intro: "Indiquez le produit et vos mesures : nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un meuble", "Un nom, une matière, une pièce."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un meuble…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="sv-ph pk-bleed"><div class="sv-wrap sv-narrow"><p class="sv-lab">Page introuvable</p><div class="sv-h1 sv-h1--xl" role="heading" aria-level="1">Pièce <em>vide</em></div><p class="sv-lead">Cette page n'existe pas ou plus. <a href="/pieces">Choisir une pièce</a> ou <a href="/boutique">retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "salon-vivant", name: "Salon Vivant", version: "1.0.0", category: "ecommerce", tags: ["chaleureux", "moderne", "naturel"], siteType: "Mobilier en ligne grand public", featured: true,
  concept: "L'intérieur de vie : lin chaud, terre cuite, visuels en arches de porte, une scène de salon dessinée à repères cliquables et une vue par pièce reliée aux vraies étiquettes du catalogue.",
  description: "Mobilier en ligne grand public : fond lin, terre cuite et miel, cartes en arche, scène de salon avec repères cliquables, vue par pièce reliée aux étiquettes et catégories réelles, contrôle de passage et rappel honnête de la livraison calculée par la boutique.",
  brand: "Salon Vivant", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "carte-arche-visuel-haut-arrondi-prix-sous-image", gallery: "grande-image-arche-et-fiche-collante-cotes-visibles", cart: "page-dediee-lin-bouton-d-achat-fixe-mobile", catalog: "rail-de-pieces-sous-la-barre-et-filtres-en-bandeau" },
  dna: {
    header: "barre-fine-puis-rail-de-pieces-en-pastilles", hero: "scene-de-salon-dessinee-a-reperes-cliquables", grid: "trois-colonnes-visuels-en-arche", typo: "brygada-1918-et-wix-madefor-text",
    shapes: "arches-de-porte-et-coins-doux", motion: "lampe-qui-respire-et-reperes-pulses", rhythm: "alternance-lin-terre-cuite-et-soir-chaud", signature: "vue-par-piece-et-controle-de-passage",
    palette: "lin-terre-cuite-miel-et-sauge", image: "illustrations-svg-de-pieces-sans-photo", list: "carte-arche-nom-prix-et-cotes-sous-le-visuel",
    article: "colonne-etroite-reperes-en-depliants", sidebar: "filtres-en-bandeau-sans-colonne-laterale", reading: "wix-madefor-17-px-interligne-large",
  },
  tokens: {
    colors: { primary: "#b4502f", secondary: "#3b2a21", accent: "#e0a458", background: "#f8f1e7", surface: "#fffaf2", text: "#33241c", muted: "#6d5a4c", success: "#4f7a56", warning: "#946a1f", error: "#a63b30" },
    fonts: { heading: "font.brygada-1918", body: "font.wix-madefor-text", button: "font.wix-madefor-text", link: "font.wix-madefor-text" },
    radius: { sm: 6, md: 12, lg: 22, button: 14, field: 10, card: 20 }, shadow: { card: "0 10px 26px rgba(59,42,33,.10)", button: "none" }, border: { width: 1, color: "#e4d6c3" },
    type: { h1: { size: 56, weight: 600, lineHeight: 1.06, transform: "none" }, h2: { size: 34, weight: 600, lineHeight: 1.14, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent (terre cuite)", type: "color", default: "#b4502f" },
    { key: "ambiance", label: "Ambiance de la scène", type: "choice", default: "jour", choices: [["jour", "Jour : lumière naturelle"], ["soir", "Soir : lampe allumée"]] },
    { key: "fond", label: "Fond des pages", type: "choice", default: "lin", choices: [["lin", "Lin chaud"], ["craie", "Craie claire"]] },
    { key: "reperes", label: "Repères de la scène", type: "choice", default: "on", choices: [["on", "Pulsation douce"], ["off", "Fixes"]] },
    { key: "annonce", label: "Bandeau d'information livraison", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "rail", label: "Rail de pièces dans l'en-tête", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "visuels", label: "Forme des visuels", type: "choice", default: "arche", choices: [["arche", "Arche de porte"], ["droit", "Rectangle arrondi"]] },
    { key: "rooms", label: "Cartes des pièces", type: "choice", default: "colorees", choices: [["colorees", "Chaque pièce sa teinte"], ["unies", "Toutes unies"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Par pièce", "/pieces"], ["Dimensions et livraison", "/dimensions-livraison"], ["Conseils", "/conseils"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "pieces", name: "Vue par pièce", render: pieces }, { key: "dimensions-livraison", name: "Dimensions et livraison", render: dimensions },
    { key: "conseils", name: "Conseils d'aménagement", render: conseils }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
