// Cuisine claire — électroménager et cuisine en ligne. Direction artistique : le catalogue technique, clair et rassurant. Blanc de four glacé sur papier millimétré, encre graphite, bleu acier, ambre de voyant,
// cartes en « plaques signalétiques » à coin coupé, dessins d'appareils au trait avec traits de cotation. Aucune photo : des schémas.
// Composant signature : la MISE EN SCÈNE DU COMPARATEUR et les GUIDES D'ACHAT PAR USAGE. Le tableau comparatif lui-même est celui du moteur (/boutique/comparer, bouton « Comparer ce produit » sur chaque fiche,
// caractéristiques saisies par le vendeur) : le thème ne le réimplémente jamais, il le met en valeur (explication en trois gestes, schéma explicatif, tableau stylé par les classes du moteur).
// Honnêteté : aucune caractéristique, classe énergétique, durée de garantie ni performance n'est écrite en dur. Le schéma de l'accueil est marqué comme explicatif ; les étiquettes réelles se lisent
// sur la fiche du fabricant et dans le registre européen EPREL (lien externe réel).
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const P = (d, cls = "") => `<path${cls ? ` class="${cls}"` : ""} d="${d}"/>`;
const dim = (x1, x2, y) => P(`M${x1} ${y}H${x2}M${x1} ${y - 6}v12M${x2} ${y - 6}v12`, "cc-dim");
/* Dessins d'appareils au trait (SVG sans texte) */
const DRAW = {
  froid: `<svg class="cc-draw" viewBox="0 0 220 230" role="img" aria-label="Schéma d'un réfrigérateur combiné">${P("M70 16h80v190H70zM70 78h80M82 36v22M82 96v34", "cc-ln")}${dim(70, 150, 220)}${P("M170 16v190M164 16h12M164 206h12", "cc-dim")}</svg>`,
  cuisson: `<svg class="cc-draw" viewBox="0 0 220 230" role="img" aria-label="Schéma d'un four encastrable">${P("M30 40h160v150H30zM30 72h160M50 94h120v76H50zM60 56h8M82 56h8M150 56h8", "cc-ln")}${dim(30, 190, 214)}${P("M206 40v150M200 40h12M200 190h12", "cc-dim")}</svg>`,
  lavage: `<svg class="cc-draw" viewBox="0 0 220 230" role="img" aria-label="Schéma d'un lave-linge à hublot">${P("M55 16h110v190H55zM55 54h110M72 35h8M92 35h8M110 140m-38 0a38 38 0 1 0 76 0a38 38 0 1 0 -76 0M110 140m-24 0a24 24 0 1 0 48 0a24 24 0 1 0 -48 0", "cc-ln")}${dim(55, 165, 220)}${P("M185 16v190M179 16h12M179 206h12", "cc-dim")}</svg>`,
  cafe: `<svg class="cc-draw" viewBox="0 0 220 230" role="img" aria-label="Schéma d'une machine à café">${P("M60 30h100v34H60zM68 64v110h84V64M56 174h108v18H56zM110 120m-14 0a14 14 0 1 0 28 0a14 14 0 1 0 -28 0M100 150h20", "cc-ln")}${dim(56, 164, 214)}${P("M184 30v162M178 30h12M178 192h12", "cc-dim")}</svg>`,
};
const mark = (cls = "cc-mark") => `<svg class="${cls}" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 6h28v28H6z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M6 14h28M14 14v20" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 22h8v8h-8z" fill="currentColor"/></svg>`;
const ICON = {
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  cmp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v14H4zM14 5h6v14h-6zM6.5 9h1M16.5 9h1M6.5 13h1M16.5 13h1" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
};

/* Usages : [clé, titre, étiquette réelle du catalogue, catégorie réelle, résumé, questions à se poser] — étiquettes et catégories existent dans demo.js */
const USAGES = [
  { k: "petit-espace", t: "Petite cuisine, studio", tag: "petit-espace", cat: "froid", d: "froid", s: "Chaque centimètre compte : mesurez la niche, comparez les largeurs et la capacité.", q: ["Quelle est la largeur de la niche ou de l'emplacement ?", "Quelle capacité utile pour le nombre de personnes ?", "Où s'ouvrent les portes, et que touchent-elles ?"] },
  { k: "famille", t: "Famille nombreuse", tag: "famille", cat: "lavage-et-vaisselle", d: "lavage", s: "Du volume, de la régularité et un bruit supportable dans une maison qui vit.", q: ["Quelle capacité de chargement pour votre foyer ?", "Le niveau sonore annoncé convient-il à la pièce voisine ?", "La consommation d'eau et d'énergie figure-t-elle sur l'étiquette du produit ?"] },
  { k: "cuisiner-souvent", t: "Cuisiner et pâtisser souvent", tag: "patisserie", cat: "cuisson", d: "cuisson", s: "Cuisson, préparation, robots : comparez les modes, les accessoires fournis et les dimensions.", q: ["Quels modes de cuisson utiliserez-vous vraiment ?", "Quels accessoires sont fournis, lesquels s'achètent à part ?", "Le plan de travail et l'encastrement acceptent-ils les dimensions ?"] },
  { k: "cafe-maison", t: "Le café à la maison", tag: "cafe-maison", cat: "cafe-et-boissons", d: "cafe", s: "Capsules, grains ou filtre : comparez le réservoir, l'entretien et ce qu'il faut racheter.", q: ["Grains, capsules ou café moulu ?", "Quel entretien régulier (détartrage, bac) ?", "Quels consommables faut-il racheter, et où ?"] },
];
const usageLink = (u) => `<a href="/boutique/etiquette/${u.tag}">${esc(u.t)}</a>`;

const header = (c) => `<header class="cc-head pk-bleed"><div class="cc-strip"><div class="cc-wrap cc-strip-in"><span>Comparez jusqu'à 4 produits sur leurs caractéristiques.</span><a href="/comparatif">Comment ça marche</a><a href="/boutique/comparer">Ouvrir ma comparaison</a></div></div>
  <div class="cc-bar"><a class="cc-logo" href="/" aria-label="Cuisine claire, accueil">${mark()}<span>Cuisine claire</span></a>
  <div class="cc-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="cc-act"><a class="cc-cmp" href="/boutique/comparer">${ICON.cmp}<span>Comparer</span></a><a class="cc-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="cc-ic cc-ic--cart" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div>
  <div class="cc-rail" role="navigation" aria-label="Choisir par usage"><span class="cc-rail-l">Je cherche pour</span>${USAGES.map(usageLink).join("")}</div></header>`;
const footer = (c) => `<footer class="cc-foot pk-bleed"><div class="cc-wrap cc-foot-g">
  <div>${mark("cc-mark cc-mark--f")}<p class="cc-big">Cuisine claire</p><p class="cc-small">Électroménager et cuisine : comparer, comprendre, choisir.</p></div>
  <div><p class="cc-lab">Boutique</p><p class="cc-fl"><a href="/boutique">Tous les produits</a><a href="/boutique/comparer">Ma comparaison</a><a href="/boutique/souhaits">Mes souhaits</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="cc-lab">Bien choisir</p><p class="cc-fl"><a href="/guides">Guides d'achat par usage</a><a href="/comparatif">Utiliser le comparateur</a><a href="/etiquettes">Lire une étiquette</a><a href="/boutique/rendez-vous">Prendre rendez-vous</a></p></div>
  <div><p class="cc-lab">Aide</p><p class="cc-fl"><a href="/livraison">Livraison et retours</a><a href="/faq">FAQ</a><a href="/contact">Contact</a><a href="/configurer">Pour le vendeur : configurer</a></p></div></div>
  <p class="cc-copy">© Cuisine claire — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="cc-ph pk-bleed"><div class="cc-wrap"><p class="cc-lab">${esc(kicker)}</p><div class="cc-h1" role="heading" aria-level="1">${esc(title)}</div><p class="cc-lead">${esc(lead)}</p></div></section>`);

/* Schéma explicatif du comparatif : les valeurs sont des emplacements, jamais des chiffres de produits */
const schema = () => `<div class="cc-sch"><table class="cc-sch-t"><caption>Schéma explicatif d'un comparatif : les vraies valeurs viennent des caractéristiques saisies par le vendeur sur chaque fiche.</caption>
  <thead><tr><td></td><th scope="col">Produit A</th><th scope="col">Produit B</th><th scope="col">Produit C</th></tr></thead>
  <tbody><tr><th scope="row">Caractéristique 1</th><td>valeur</td><td>valeur</td><td>valeur</td></tr>
  <tr class="cc-sch-d"><th scope="row">Caractéristique 2 <b>Différence</b></th><td>valeur</td><td>autre valeur</td><td>valeur</td></tr>
  <tr><th scope="row">Caractéristique 3</th><td>valeur</td><td>valeur</td><td>valeur</td></tr>
  <tr class="cc-sch-d"><th scope="row">Prix <b>Différence</b></th><td>prix</td><td>prix</td><td>prix</td></tr></tbody></table></div>`;

const gestes = () => sec(`<section class="cc-sec cc-sec--n pk-bleed" data-cc-reveal><div class="cc-wrap"><p class="cc-lab">Le comparateur en trois gestes</p><h2 class="cc-h2">Comparer ne prend qu'un instant</h2>
  <ol class="cc-steps"><li><b>Ouvrez une fiche produit</b><span>Cherchez le bouton « Comparer ce produit » sous le prix.</span></li><li><b>Ajoutez jusqu'à 4 appareils</b><span>Le choix est gardé dans ce navigateur, propre à cette boutique. Il fonctionne sans JavaScript.</span></li><li><b>Lisez les différences</b><span>Les lignes où les valeurs diffèrent sont signalées en texte et en couleur dans le tableau.</span></li></ol>
  <p><a class="cc-btn" href="/boutique/comparer">Voir ma comparaison</a> <a class="cc-btn cc-btn--o" href="/comparatif">Mode d'emploi détaillé</a></p></div></section>`);

const guideCard = (u, long = false) => `<article class="cc-gd" data-cc-reveal><div class="cc-gd-fig">${DRAW[u.d]}</div><div class="cc-gd-b"><p class="cc-lab cc-lab--s">Guide d'achat</p><h3 class="cc-h3">${esc(u.t)}</h3><p>${esc(u.s)}</p>
  ${long ? `<details class="cc-q" open><summary>Les questions à se poser</summary><ul class="cc-ul">${u.q.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></details>` : ""}
  <p class="cc-links"><a class="cc-go" href="/boutique/etiquette/${u.tag}">Voir la sélection</a><a class="cc-go cc-go--o" href="/boutique/categorie/${u.cat}">Tout le rayon</a></p></div></article>`;
const guides = (long = false) => sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap"><p class="cc-lab">Guides d'achat par usage</p><h2 class="cc-h2">Partez de votre besoin, pas du catalogue</h2><div class="cc-gds">${USAGES.map((u) => guideCard(u, long)).join("")}</div></div></section>`);
const etiquettesBand = () => sec(`<section class="cc-sec cc-sec--ink pk-bleed"><div class="cc-wrap cc-eti"><div><p class="cc-lab cc-lab--a">Étiquettes réelles</p><h2 class="cc-h2">Les données officielles, à la source</h2><p class="cc-lead">Pour de nombreux appareils, l'étiquette énergie et la fiche d'information officielles sont publiées dans le registre européen EPREL. Cherchez le modèle exact : c'est la référence, pas un résumé de boutique.</p>
  <p><a class="cc-btn" href="https://eprel.ec.europa.eu/">Ouvrir le registre EPREL</a> <a class="cc-btn cc-btn--o" href="/etiquettes">Savoir lire une étiquette</a></p></div></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="cc-hero pk-bleed"><div class="cc-wrap cc-hero-in"><div><p class="cc-lab">Électroménager et cuisine</p><div class="cc-h1 cc-h1--xl" role="heading" aria-level="1">Comparez.<br><span>Puis choisissez</span> sans doute.</div><p class="cc-lead">Mettez côte à côte jusqu'à quatre appareils, ligne par ligne, et voyez ce qui change vraiment. Des guides d'achat partent de votre usage.</p><p><a class="cc-btn" href="/boutique/comparer">Ouvrir le comparateur</a> <a class="cc-btn cc-btn--o" href="/guides">Guides d'achat</a></p></div>${schema()}</div></section>`),
  gestes(), guides(),
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap"><p class="cc-lab">À la une</p><h2 class="cc-h2">Sélection du moment</h2><p class="cc-small">Ouvrez une fiche pour la comparer : prix et disponibilité sont ceux de la boutique.</p></div></section>`),
  wrap(shopgrid({ source: "featured", count: 8, columns: "4", orderby: "featured", ratio: "1/1" })),
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap"><p class="cc-lab">Bons plans</p><h2 class="cc-h2">Promotions en cours</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 4, columns: "4", orderby: "newest", ratio: "1/1" })),
  etiquettesBand(), sec(footer(c))];

const pageGuides = (c) => [sec(header(c)), head("Guides d'achat", "Choisir selon votre usage", "Quatre situations, quatre séries de questions. Chaque guide mène à une sélection réelle de la boutique."), guides(true),
  sec(`<section class="cc-sec cc-sec--n pk-bleed"><div class="cc-wrap"><p class="cc-lab">Que comparer</p><h2 class="cc-h2">Les caractéristiques à regarder selon l'appareil</h2>
  <table class="cc-tab"><caption class="cc-vh">Caractéristiques utiles à comparer selon le type d'appareil</caption><thead><tr><th scope="col">Appareil</th><th scope="col">À comparer</th><th scope="col">Où le lire</th></tr></thead><tbody>
  <tr><th scope="row">Réfrigérateur, congélateur</th><td>Dimensions, capacité utile, niveau sonore, classe énergétique</td><td>Fiche produit, étiquette du fabricant</td></tr>
  <tr><th scope="row">Four, plaque</th><td>Dimensions d'encastrement, modes de cuisson, nettoyage</td><td>Fiche produit, notice du fabricant</td></tr>
  <tr><th scope="row">Lave-linge, lave-vaisselle</th><td>Capacité, programmes, niveau sonore, consommation d'eau</td><td>Étiquette énergie du modèle</td></tr>
  <tr><th scope="row">Café, bouilloire, robots</th><td>Réservoir, accessoires fournis, entretien, consommables</td><td>Fiche produit</td></tr></tbody></table>
  <p class="cc-small">Ce tableau liste des critères, jamais des valeurs : les chiffres réels sont ceux saisis par le vendeur et ceux de l'étiquette du produit.</p></div></section>`),
  etiquettesBand(), sec(footer(c))];

const pageComparatif = (c) => [sec(header(c)), head("Comparateur", "Comparer des appareils, ligne par ligne", "Le tableau est celui de la boutique : il lit les caractéristiques de chaque fiche."), 
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap cc-prose"><h2 class="cc-h2">Comment faire</h2>
  <ol class="cc-ol"><li>Sur la fiche d'un produit, choisissez « Comparer ce produit ».</li><li>Recommencez avec trois autres produits au maximum : le tableau en accepte quatre.</li><li>Ouvrez <a href="/boutique/comparer">la page de comparaison</a>. Les lignes où les valeurs diffèrent portent la mention « Différence » et un fond coloré.</li><li>Retirez un produit ou videz la liste à tout moment, depuis le tableau.</li></ol>
  <p>Votre liste est gardée dans un cookie propre à cette boutique, sur cet appareil. Un produit retiré du catalogue disparaît tout seul du tableau.</p>
  <h2 class="cc-h2">Pour bien comparer</h2><p>Comparez des appareils de même famille et de même format. Une ligne vide (« — ») signifie que le vendeur n'a pas renseigné cette caractéristique : demandez-la via la page <a href="/contact">contact</a>.</p></div></section>`),
  sec(`<section class="cc-sec cc-sec--n pk-bleed"><div class="cc-wrap"><p class="cc-lab">À quoi ça ressemble</p>${schema()}</div></section>`),
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap cc-prose"><p><a class="cc-btn" href="/boutique">Choisir des produits</a> <a class="cc-btn cc-btn--o" href="/boutique/comparer">Ma comparaison</a></p></div></section>`), sec(footer(c))];

const pageEtiquettes = (c) => [sec(header(c)), head("Étiquettes", "Lire une étiquette sans se perdre", "Ce que l'on peut vérifier soi-même, à la source."),
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap cc-prose"><h2 class="cc-h2">La source officielle</h2><p>Le registre européen <a href="https://eprel.ec.europa.eu/">EPREL</a> rassemble les étiquettes énergie et les fiches d'information de nombreux appareils. Recherchez la référence exacte du modèle, inscrite sur la fiche du fabricant ou sur l'appareil.</p>
  <h2 class="cc-h2">Sur cette boutique</h2><p>Une classe, une capacité ou un niveau sonore n'apparaît dans le comparateur que si le vendeur l'a saisi pour ce produit. Rien n'est complété à sa place : en cas de doute, vérifiez la valeur dans le registre ou auprès du fabricant.</p>
  <h2 class="cc-h2">Un réflexe simple</h2><p>Comparez toujours deux modèles sur la même base : même type d'appareil, même capacité annoncée, même condition de mesure indiquée par l'étiquette.</p><p><a class="cc-btn" href="/boutique/comparer">Ouvrir le comparateur</a></p></div></section>`), sec(footer(c))];

const pageConfigurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer ce thème", "Le thème met en scène les fonctions de la boutique. Tout se règle dans l'administration."),
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap cc-prose"><h2 class="cc-h2">1. Le comparateur</h2><p>Le tableau, le bouton « Comparer ce produit » et la page /boutique/comparer sont fournis par la boutique. Le thème ne fait que les habiller. Pour que le tableau soit utile, <b>saisissez les caractéristiques de chaque produit</b> : ouvrez le produit dans l'administration, rubrique « Caractéristiques (comparateur) », et écrivez une ligne par caractéristique sous la forme « Libellé: valeur » (20 au maximum).</p>
  <ul class="cc-ul"><li>Gardez les mêmes libellés d'un produit à l'autre (par exemple le même mot pour la capacité) : c'est ce qui aligne les lignes du tableau.</li><li>Recopiez les valeurs depuis la notice ou l'étiquette du fabricant ; ne laissez rien d'approximatif.</li><li>Une caractéristique non saisie s'affiche « — ».</li></ul>
  <h2 class="cc-h2">2. Les guides d'achat par usage</h2><p>Les quatre guides pointent vers des étiquettes et des catégories : <b>petit-espace</b>, <b>famille</b>, <b>patisserie</b>, <b>cafe-maison</b>, et les catégories <b>froid</b>, <b>lavage-et-vaisselle</b>, <b>cuisson</b>, <b>cafe-et-boissons</b>. Appliquez ces étiquettes à vos produits pour que chaque guide affiche une sélection réelle. Les textes se modifient dans le Page Builder.</p>
  <h2 class="cc-h2">3. Les avis vérifiés</h2><p>Un avis ne peut venir que d'une commande payée contenant le produit. Relisez-les dans l'onglet « Avis » de l'administration, ou activez la publication directe dans les réglages. Le thème n'écrit jamais de note à la main.</p>
  <h2 class="cc-h2">4. Les souhaits et les listes de cadeaux</h2><p>La liste de souhaits est disponible sur <a href="/boutique/souhaits">/boutique/souhaits</a>. Les listes de cadeaux (équipement d'une première cuisine, par exemple) se créent depuis l'onglet « Listes cadeaux » ; chaque liste a son propre lien secret.</p>
  <h2 class="cc-h2">5. Le conseil sur rendez-vous</h2><p>Pour proposer un conseil d'installation ou un échange sur place ou en visio, définissez vos types de rendez-vous et vos disponibilités dans l'onglet « Rendez-vous ». La page publique est <a href="/boutique/rendez-vous">/boutique/rendez-vous</a>.</p>
  <h2 class="cc-h2">6. Les réglages visuels</h2><p>Dans Apparence, ce thème propose : couleurs principale et du bouton d'achat, fond, papier millimétré, coins coupés, traits de cotation animés, rail des usages, bandeau comparateur et densité du tableau.</p>
  <p class="cc-small">Les produits de démonstration n'ont pas de caractéristiques saisies : le tableau n'affiche donc que le prix tant que vous n'avez rien renseigné.</p></div></section>`), sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap cc-prose"><h2 class="cc-h2">Livraison</h2><p>Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Pour les gros appareils, vérifiez le passage des portes et de l'escalier avant de commander.</p><h2 class="cc-h2">Retours</h2><p>Les conditions de retour sont précisées à la commande. Écrivez-nous depuis la page <a href="/contact">contact</a> avec le numéro de commande.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Comparer, mesurer, commander."),
  sec(`<section class="cc-sec pk-bleed"><div class="cc-wrap cc-prose"><details class="cc-q"><summary>Combien de produits puis-je comparer ?</summary><p>Quatre au maximum. Retirez-en un pour en ajouter un autre.</p></details><details class="cc-q"><summary>Pourquoi une ligne affiche-t-elle « — » ?</summary><p>La caractéristique n'a pas été renseignée pour ce produit. Posez-nous la question depuis la page <a href="/contact">contact</a>.</p></details><details class="cc-q"><summary>Où trouver l'étiquette énergie d'un appareil ?</summary><p>Sur la fiche du fabricant et dans le registre européen EPREL, avec la référence exacte du modèle.</p></details><details class="cc-q"><summary>Puis-je être conseillé avant d'acheter ?</summary><p>Si la boutique propose des rendez-vous, vous pouvez en réserver un sur <a href="/boutique/rendez-vous">la page dédiée</a>.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Contact", "Nous écrire", "Une question sur un appareil, une dimension, une caractéristique ?"), { type: "form", heading: "Écrire à l'équipe", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un appareil", "Un type d'appareil, un usage, un nom."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un appareil…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cc-ph pk-bleed"><div class="cc-wrap"><p class="cc-lab">Page introuvable</p><div class="cc-h1 cc-h1--xl" role="heading" aria-level="1">Cette cote<br><span>n'existe pas</span></div><p class="cc-lead"><a href="/boutique">Retourner à la boutique</a> ou <a href="/guides">consulter les guides d'achat</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "cuisine-claire", name: "Cuisine claire", version: "1.0.0", category: "ecommerce", tags: ["technique", "moderne", "minimaliste"], siteType: "Électroménager et cuisine", featured: false,
  concept: "Le catalogue technique, clair et rassurant : papier millimétré, plaques signalétiques à coin coupé, dessins d'appareils cotés, guides d'achat par usage et mise en scène du comparateur de produits de la boutique.",
  description: "Électroménager et cuisine : blanc de four sur papier millimétré, plaques signalétiques à coin coupé, schémas d'appareils cotés, guides d'achat par usage et mise en avant du comparateur réel (jusqu'à 4 produits, caractéristiques saisies par le vendeur).",
  brand: "Cuisine claire", modules: ["formulaires", "recherche", "commerce"], shop: { card: "plaque-signaletique-coin-coupe-prix-en-pied", gallery: "image-schema-cote-et-infos-collantes", cart: "page-dediee-lignes-de-cotation-et-total-net", catalog: "rail-d-usages-et-filtres-en-plaque" },
  dna: {
    header: "bandeau-comparateur-barre-et-rail-d-usages", hero: "schema-explicatif-d-un-tableau-comparatif", grid: "quatre-colonnes-plaques-signaletiques", typo: "red-hat-display+atkinson-hyperlegible",
    shapes: "coins-coupes-et-traits-de-cotation", motion: "traits-de-cotation-qui-se-dessinent", rhythm: "sections-sur-papier-millimetre", signature: "guides-d-achat-par-usage-et-mise-en-scene-du-comparateur",
    palette: "blanc-de-four-glace-graphite-bleu-acier-et-ambre-de-voyant", image: "schemas-d-appareils-au-trait-cotes-sans-photo", list: "plaques-signaletiques-prix-en-pied",
    article: "guides-a-questions-depliantes", sidebar: "aucune-rail-d-usages-en-tete", reading: "atkinson-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#0f7490", secondary: "#14262f", accent: "#f2a900", background: "#f4f8fa", surface: "#ffffff", text: "#14262f", muted: "#4a5f69", success: "#17744f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.red-hat-display", body: "font.atkinson-hyperlegible", button: "font.red-hat-display", link: "font.atkinson-hyperlegible" },
    radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1.5, color: "#14262f" },
    type: { h1: { size: 56, weight: 800, lineHeight: 1.04, transform: "none" }, h2: { size: 34, weight: 800, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur principale", type: "color", default: "#0f7490" },
    { key: "achat", label: "Couleur du bouton d'achat", type: "color", default: "#f2a900" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "glace", choices: [["glace", "Blanc glacé"], ["pierre", "Gris pierre"], ["menthe", "Menthe très pâle"]] },
    { key: "grille", label: "Papier millimétré en fond", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Fond uni"]] },
    { key: "coins", label: "Plaques des produits", type: "choice", default: "coupes", choices: [["coupes", "Coin coupé"], ["droits", "Angles droits"]] },
    { key: "cotes", label: "Traits de cotation animés", type: "choice", default: "on", choices: [["on", "Activés"], ["off", "Fixes"]] },
    { key: "rail", label: "Rail des usages sous l'en-tête", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "bandeau", label: "Bandeau « Comparer » en haut", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "densite", label: "Tableau comparatif", type: "choice", default: "aere", choices: [["aere", "Aéré"], ["compact", "Compact"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Guides d'achat", "/guides"], ["Comparer", "/comparatif"], ["Étiquettes", "/etiquettes"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "guides", name: "Guides d'achat", render: pageGuides }, { key: "comparatif", name: "Utiliser le comparateur", render: pageComparatif }, { key: "etiquettes", name: "Lire une étiquette", render: pageEtiquettes },
    { key: "configurer", name: "Comment configurer", render: pageConfigurer }, { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
