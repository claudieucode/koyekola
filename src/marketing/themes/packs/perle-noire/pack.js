// Perle noire — caviar et produits d'exception. Direction artistique : noir profond, nacre, filets de givre, perles lumineuses. Tout est froid et rare.
// Composant signature : l'ITINÉRAIRE DU FROID (livraison réfrigérée par créneau) et les ACCORDS METS, deux blocs éditables du Page Builder.
// L'itinéraire ne promet ni délai ni température : il décrit le parcours réel du moteur (méthode de livraison « exige un créneau », créneaux libres choisis à la commande, créneau noté
// sur la commande, l'e-mail et la confirmation). Les valeurs (jours, plages, capacité, délai minimum) sont celles que le vendeur règle dans l'admin. Rien n'est simulé : ni panier, ni paiement, ni disponibilité.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  pearl: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="pn-pe-o" cx="20" cy="20" r="15"/><circle class="pn-pe-i" cx="15" cy="14" r="4"/></svg>`,
};
// Boîte de caviar (illustration) : couvercle, rebord, grains en nacre. Les teintes sont réglées par le CSS.
const tin = (label = "Illustration d'une boîte de caviar ouverte, grains sombres et cuillère en nacre") => `<svg viewBox="0 0 440 340" role="img" aria-label="${esc(label)}">
<ellipse class="pn-tin-sh" cx="220" cy="300" rx="170" ry="22"/>
<path class="pn-tin-b" d="M60 150 V240 Q60 292 220 292 T380 240 V150 Z"/>
<ellipse class="pn-tin-r" cx="220" cy="150" rx="160" ry="62"/>
<ellipse class="pn-tin-in" cx="220" cy="152" rx="140" ry="50"/>
<g class="pn-eggs"><circle cx="150" cy="150" r="9"/><circle cx="172" cy="162" r="9"/><circle cx="196" cy="146" r="9"/><circle cx="220" cy="160" r="9"/><circle cx="244" cy="146" r="9"/><circle cx="268" cy="160" r="9"/><circle cx="292" cy="148" r="9"/><circle cx="184" cy="132" r="8"/><circle cx="232" cy="134" r="8"/><circle cx="276" cy="134" r="8"/><circle cx="208" cy="174" r="8"/><circle cx="254" cy="174" r="8"/></g>
<path class="pn-spoon" d="M300 88 Q352 62 392 28" /><ellipse class="pn-spoon-h" cx="290" cy="92" rx="22" ry="11" transform="rotate(-24 290 92)"/>
<path class="pn-tin-line" d="M80 214 Q220 252 360 214"/></svg>`;

const header = (c) => `<header class="pn-head pk-bleed"><div class="pn-promo">Livraison réfrigérée sur créneau · Conditions et délais : voir la page livraison</div>
  <div class="pn-bar"><div class="pn-nav pn-nav--l" role="navigation" aria-label="Navigation principale">${c.menu.slice(1, 4).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <a class="pn-logo" href="/" aria-label="Perle noire, accueil">${ICON.pearl}<span>Perle noire</span><i>caviar &amp; produits d'exception</i></a>
  <div class="pn-nav pn-nav--r" role="navigation" aria-label="Suite et boutique">${c.menu.slice(4).filter((m) => m.url !== "/contact").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/contact">Contact</a><a class="pn-ic" href="/boutique/souhaits" aria-label="Mes souhaits">${ICON.heart}</a><a class="pn-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="pn-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="pn-foot pk-bleed"><div class="pn-wrap pn-foot-g">
  <div><p class="pn-lab">Perle noire</p><p class="pn-small">Épicerie fine de caviar et de produits d'exception.<br>Boutique de démonstration du thème.</p></div>
  <div><p class="pn-lab">Boutique</p><p class="pn-fl"><a href="/boutique">Toute la sélection</a><a href="/boutique/comparer">Comparer</a><a href="/boutique/souhaits">Mes souhaits</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="pn-lab">Le service</p><p class="pn-fl"><a href="/froid">Livraison réfrigérée</a><a href="/accords">Accords mets</a><a href="/cercle">Le Cercle</a><a href="/boutique/rendez-vous">Dégustation sur rendez-vous</a><a href="/boutique/listes">Listes de cadeaux</a></p></div>
  <div><p class="pn-lab">Informations</p><p class="pn-fl"><a href="/faq">Questions</a><a href="/configurer">Configurer le thème</a><a href="/contact">Contact</a></p></div></div>
  <p class="pn-copy">© Perle noire — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="pn-ph pk-bleed"><div class="pn-wrap pn-narrow"><p class="pn-lab">${esc(kicker)}</p><div class="pn-h1" role="heading" aria-level="1">${esc(title)}</div><p class="pn-lead">${esc(lead)}</p></div></section>`);

// ----- Signature 1 : itinéraire du froid. Cinq étapes réelles du moteur, sans chiffre inventé.
const ETAPES = [
  ["Méthode réfrigérée", "Le vendeur marque une méthode de livraison comme « exige un créneau » (réglages, livraison). Elle apparaît à la commande avec son tarif."],
  ["Créneau choisi", "À la commande, vous choisissez un jour et une plage parmi les créneaux réellement libres. Un créneau complet n'est pas proposé et il est revérifié à la validation."],
  ["Préparation", "La commande est préparée et emballée selon la méthode décrite par la maison sur ses fiches produit et ses conditions de livraison."],
  ["Remise", "Le créneau retenu est inscrit sur la commande, dans l'e-mail et sur la page de confirmation, et visible du vendeur dans l'admin."],
  ["À réception", "Rangez les produits au frais sans attendre et suivez la consigne de conservation de l'étiquette ou de la fiche produit."],
];
const froidBloc = (title = "L'itinéraire du froid") => sec(`<section class="pn-froid pk-bleed"><div class="pn-wrap"><p class="pn-lab">Livraison réfrigérée par créneau</p><h2 class="pn-h2">${esc(title)}</h2>
  <p class="pn-lead">Un produit frais voyage mieux quand on sait quand il arrive. Choisissez la plage qui vous convient : vous êtes là pour le recevoir.</p>
  <div class="pn-route" role="list">${ETAPES.map((e, i) => `<div class="pn-stop" role="listitem"><span class="pn-bead" aria-hidden="true"><b>${i + 1}</b></span><h3>${esc(e[0])}</h3><p>${esc(e[1])}</p></div>`).join("")}</div>
  <p class="pn-note">Ce thème n'annonce ni délai, ni température, ni durée de conservation : ces informations sont celles que la maison indique sur ses fiches produit et dans ses réglages de livraison (jours, plages, capacité, délai minimum, horizon). Le choix du créneau se fait dans la page de commande de la boutique.</p>
  <p><a class="pn-btn" href="/boutique">Voir la sélection</a> <a class="pn-link" href="/froid">Tout savoir sur la livraison</a></p></div></section>`);

// ----- Signature 2 : accords mets, blocs éditables (une fiche dépliante par accord).
const ACCORDS = [
  ["Caviar d'esturgeon", "Blinis tièdes, crème épaisse, ciboulette", "Un brut blanc de blancs, ou une vodka bien froide", "Servez dans le contenant d'origine posé sur de la glace pilée, avec une cuillère en nacre ou en corne : le métal peut altérer le goût."],
  ["Œufs de truite", "Œuf mollet, pain de seigle grillé, aneth", "Un vin blanc sec et tendu", "Des grains plus gros et plus vifs, à poser en dernier pour qu'ils restent entiers."],
  ["Saumon fumé", "Pommes de terre tièdes, crème acidulée, citron", "Un blanc de Loire ou un cidre brut", "Tranchez fin, servez frais et non glacé."],
  ["Foie gras", "Pain brioché, chutney de figue, fleur de sel", "Un vin moelleux, ou un thé fumé", "Sortez-le quelques minutes avant de le trancher à la lame chaude."],
  ["Truffe", "Œufs brouillés, pâtes fraîches, beurre doux", "Un rouge souple ou un blanc de caractère", "Râpez à la dernière minute sur un plat chaud : l'arôme se libère."],
];
const accordsBloc = (title = "Accords mets") => sec(`<section class="pn-accords pk-bleed"><div class="pn-wrap pn-split"><div><p class="pn-lab">À table</p><h2 class="pn-h2">${esc(title)}</h2><p class="pn-small">Des suggestions de service, pas des règles. Chaque fiche est un bloc modifiable : remplacez-les par les accords de votre maison.</p></div>
  <div class="pn-pairs">${ACCORDS.map((a, i) => `<details class="pn-pair"${i === 0 ? " open" : ""}><summary><span class="pn-pair-t">${esc(a[0])}</span><span class="pn-pair-s">${esc(a[1])}</span></summary><dl class="pn-dl"><div><dt>Accompagner de</dt><dd>${esc(a[1])}</dd></div><div><dt>À boire</dt><dd>${esc(a[2])}</dd></div><div><dt>Le geste</dt><dd>${esc(a[3])}</dd></div></dl></details>`).join("")}</div></div></section>`);

const valeurs = () => sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap"><ul class="pn-vals"><li><b>Prix affichés</b>Le prix affiché est le prix payé. Les promotions sont celles de la fiche produit, avec leur prix barré réel.</li><li><b>Disponibilité réelle</b>Une rupture est indiquée comme telle. Aucun compte à rebours, aucun faux stock.</li><li><b>Avis vérifiés</b>Seuls les clients ayant une commande payée contenant le produit peuvent laisser un avis, relu par la maison.</li></ul></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="pn-dark pn-hero pk-bleed"><div class="pn-wrap pn-hero-in"><div><p class="pn-lab">Épicerie d'exception</p><div class="pn-h1 pn-h1--xl" role="heading" aria-level="1">Le noir<br>qui <em>se garde au froid</em></div><p class="pn-lead">Caviars, poissons fumés, foie gras et truffe, livrés en réfrigéré sur le créneau que vous choisissez.</p><p><a class="pn-btn" href="/boutique">Découvrir la sélection</a> <a class="pn-link" href="/froid">La livraison réfrigérée</a></p></div>
    <div class="pn-hero-art"><span class="pn-pearl" aria-hidden="true"></span>${tin()}<p class="pn-hero-cap">Grains calibrés, mis en boîte à la main</p></div></div></section>`),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap"><p class="pn-lab">La sélection</p><h2 class="pn-h2">Les pièces du moment</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 4, columns: "4", orderby: "featured", ratio: "1/1" })),
  froidBloc(), accordsBloc(),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap"><p class="pn-lab">Offres en cours</p><h2 class="pn-h2">Prix en baisse</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 4, columns: "4", orderby: "newest", ratio: "1/1" })),
  valeurs(), sec(footer(c))];

const froid = (c) => [sec(header(c)), head("Livraison réfrigérée", "Le froid, au créneau choisi", "Comment la commande voyage, et ce que le vendeur règle pour vous."), froidBloc("De la commande à votre table"),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow pn-prose"><h2 class="pn-h2">Ce que vous voyez à la commande</h2><p>Après avoir choisi une méthode de livraison réfrigérée, une rubrique « Créneau de livraison » liste les jours et plages disponibles, avec le nombre de places libres. Si aucun créneau n'est libre, la méthode ne peut pas être commandée et la page le dit clairement.</p><h2 class="pn-h2">Ce que nous ne promettons pas</h2><p>Les délais, les températures et les durées de conservation dépendent de chaque produit et de la maison : ils figurent sur la fiche produit et dans les conditions de livraison, pas dans le thème. En cas de doute, <a href="/contact">écrivez-nous</a> avant de commander.</p><h2 class="pn-h2">Absent au créneau ?</h2><p>La règle (nouvelle tentative, retrait, remboursement) est celle des conditions de la maison, à indiquer ici par le vendeur.</p></div></section>`), sec(footer(c))];
const accords = (c) => [sec(header(c)), head("À table", "Accords mets", "Que servir avec quoi, sans protocole."), accordsBloc("Cinq façons de servir"),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow"><p class="pn-note">Les boissons alcoolisées sont réservées aux adultes. Si la maison en vend, elle peut activer le contrôle d'âge du moteur par produit ou catégorie : une déclaration sur l'honneur est alors demandée, sans vérification d'identité. <a href="/boutique/age">Voir la page de déclaration</a>.</p><p><a class="pn-btn" href="/boutique">Composer ma table</a></p></div></section>`), sec(footer(c))];
const cercle = (c) => [sec(header(c)), head("Le Cercle", "Réservé aux invités", "Ventes privées, dégustations et listes de cadeaux."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap"><div class="pn-cards">
  <div class="pn-card3"><h3>Ventes privées</h3><p>Certaines pièces peuvent être réservées aux membres ou ouvertes sur une période précise. L'entrée se fait avec un code d'invitation valide.</p><a class="pn-link" href="/boutique/invitation">Entrer avec un code</a></div>
  <div class="pn-card3"><h3>Dégustation sur rendez-vous</h3><p>Réservez un créneau libre pour une dégustation sur place ou en visio, selon ce que la maison propose. Aucun paiement.</p><a class="pn-link" href="/boutique/rendez-vous">Prendre rendez-vous</a></div>
  <div class="pn-card3"><h3>Listes de cadeaux</h3><p>Une liste de réception ou de fête, partagée par un lien secret : les invités voient ce qui est souhaité, offert, restant.</p><a class="pn-link" href="/boutique/listes">Ouvrir une liste</a></div>
  <div class="pn-card3"><h3>Comparer</h3><p>Jusqu'à quatre produits côte à côte : calibre, origine, contenance. Les différences sont signalées.</p><a class="pn-link" href="/boutique/comparer">Comparer</a></div>
  <div class="pn-card3"><h3>Mes souhaits</h3><p>Gardez de côté les pièces qui vous plaisent, sur ce navigateur ou sur votre compte.</p><a class="pn-link" href="/boutique/souhaits">Voir mes souhaits</a></div>
  <div class="pn-card3"><h3>Avis vérifiés</h3><p>Un avis ne vient que d'une commande payée contenant le produit, et il est relu avant publication.</p><a class="pn-link" href="/boutique">Parcourir les fiches</a></div></div>
  <p class="pn-note">Ces services existent dans le moteur de la boutique ; chacun doit être activé et réglé par le vendeur dans l'admin. Tant qu'il ne l'a pas fait, la page correspondante l'indique simplement.</p></div></section>`), sec(footer(c))];
const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer ce thème", "Le thème met en forme ; le vendeur règle chaque service dans l'admin de la boutique."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow"><ol class="pn-steps">
  <li><div><b>Livraison réfrigérée par créneau</b><span>Admin boutique, onglet Réglages, Livraison. Créez les créneaux (jours, plage, capacité, délai minimum, horizon, jours exclus), puis cochez « Exige un créneau » sur la méthode de livraison réfrigérée. Sans cela, aucun choix de créneau n'apparaît à la commande.</span></div></li>
  <li><div><b>Textes de conservation</b><span>Écrivez sur chaque fiche produit la température, la durée et la consigne de conservation réelles de la maison. Le thème n'en invente aucune.</span></div></li>
  <li><div><b>Accords mets</b><span>Dans le Page Builder, ouvrez la page « Accords mets » et modifiez chaque fiche dépliante (texte seulement).</span></div></li>
  <li><div><b>Ventes privées et membres</b><span>Admin, onglet Accès membre : produits ou catégories réservés, codes d'invitation, fenêtres de vente. Page publique : /boutique/invitation.</span></div></li>
  <li><div><b>Dégustations</b><span>Admin, onglet Rendez-vous : types, disponibilités, pas, délai minimum. Page publique : /boutique/rendez-vous.</span></div></li>
  <li><div><b>Listes de cadeaux, comparateur, souhaits</b><span>Les listes se créent depuis /boutique/listes. Le comparateur lit les caractéristiques libellé/valeur saisies dans chaque produit (calibre, origine, contenance).</span></div></li>
  <li><div><b>Contrôle d'âge</b><span>Pour les boissons alcoolisées : âge minimum par produit ou catégorie. C'est une déclaration sur l'honneur, sans vérification d'identité.</span></div></li>
  <li><div><b>Avis vérifiés</b><span>Onglet Avis : relire, publier ou refuser. Les avis ne peuvent venir que d'une commande payée.</span></div></li></ol></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Livraison, conservation, service."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow"><details class="pn-q"><summary>Comment choisir mon créneau de livraison ?</summary><p>À la commande, si la méthode choisie exige un créneau, la page liste les jours et plages réellement libres. Votre choix est vérifié à la validation de la commande.</p></details><details class="pn-q"><summary>Quelle est la durée de conservation ?</summary><p>Elle dépend du produit et figure sur sa fiche et son étiquette. Le thème n'en annonce aucune.</p></details><details class="pn-q"><summary>Puis-je modifier le créneau après avoir commandé ?</summary><p>Écrivez-nous depuis la page <a href="/contact">contact</a> : la maison indique ses règles de modification dans ses conditions.</p></details><details class="pn-q"><summary>Puis-je offrir un produit à quelqu'un ?</summary><p>Oui, avec une liste de cadeaux ou une livraison à l'adresse de votre choix, selon ce que la maison a activé.</p></details><details class="pn-q"><summary>Pourquoi un produit est-il en rupture ?</summary><p>Parce qu'il n'est plus disponible : la fiche l'indique et le bouton d'achat n'est pas proposé.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur un produit, un accord, une livraison."),
  { type: "form", heading: "Écrire à la maison", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un produit", "Une espèce, une origine, un format."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pn-ph pk-bleed"><div class="pn-wrap pn-narrow"><p class="pn-lab">Page introuvable</p><div class="pn-h1 pn-h1--xl" role="heading" aria-level="1">Perle <em>égarée</em></div><p class="pn-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "perle-noire", name: "Perle noire", version: "1.0.0", category: "luxe", tags: ["luxe", "sombre", "moderne"], siteType: "Caviar et produits d'exception", featured: false,
  concept: "Noir profond, nacre et filets de givre : une épicerie d'exception où la livraison réfrigérée se choisit au créneau, avec des accords mets modifiables.",
  description: "Caviar et produits d'exception : noir profond, reflets de nacre, itinéraire du froid expliquant la livraison réfrigérée par créneau choisi à la commande, accords mets modifiables, Cercle (ventes privées, rendez-vous, listes) et page de configuration.",
  brand: "Perle noire", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carte-noire-filet-de-givre-numero-en-nacre", gallery: "image-carree-sur-fond-noir-et-legende-fine", cart: "page-dediee-noire-lignes-de-givre", catalog: "filtres-en-colonne-etroite-et-pastilles-de-nacre" },
  dna: {
    header: "logo-perle-centre-navigation-en-deux-ailes", hero: "boite-de-caviar-et-perle-lumineuse-sur-noir", grid: "quatre-colonnes-cartes-sans-cadre-filet-de-givre", typo: "bodoni-moda-et-hanken-grotesk",
    shapes: "cercles-de-nacre-et-filets-de-givre", motion: "reflet-de-nacre-qui-glisse-et-perle-qui-flotte", rhythm: "noir-continu-bandes-ardoise-et-respirations", signature: "itineraire-du-froid-par-creneau-et-accords-mets",
    palette: "noir-encre-nacre-et-bleu-glace", image: "illustrations-svg-de-boite-de-caviar-sans-photo", list: "cartes-sans-cadre-prix-en-nacre",
    article: "trajet-horizontal-de-perles-numerotees", sidebar: "aucune-colonne-de-filtres-fine", reading: "hanken-grotesk-17-px-ligne-claire-sur-noir",
  },
  tokens: {
    colors: { primary: "#b9c7d3", secondary: "#0e1217", accent: "#e3cfc2", background: "#07090c", surface: "#10151b", text: "#ece8e2", muted: "#9aa5af", success: "#7fb59a", warning: "#d1b074", error: "#e0807a" },
    fonts: { heading: "font.bodoni-moda", body: "font.hanken-grotesk", button: "font.hanken-grotesk", link: "font.hanken-grotesk" },
    radius: { sm: 0, md: 2, lg: 999, button: 999, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#26303a" },
    type: { h1: { size: 62, weight: 400, lineHeight: 1.06, transform: "none" }, h2: { size: 36, weight: 400, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "glace", label: "Couleur de givre (filets, accents)", type: "color", default: "#b9c7d3" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "noir", choices: [["noir", "Noir encre"], ["ardoise", "Ardoise froide"]] },
    { key: "reflet", label: "Reflet de nacre", type: "choice", default: "doux", choices: [["doux", "Doux"], ["vif", "Vif"], ["off", "Aucun"]] },
    { key: "filets", label: "Filets de givre", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "perle", label: "Perle lumineuse du héros", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "numeros", label: "Numéros des étapes", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Livraison réfrigérée", "/froid"], ["Accords mets", "/accords"], ["Le Cercle", "/cercle"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "froid", name: "Livraison réfrigérée", render: froid }, { key: "accords", name: "Accords mets", render: accords },
    { key: "cercle", name: "Le Cercle", render: cercle }, { key: "configurer", name: "Comment configurer", render: configurer }, { key: "faq", name: "FAQ", render: faq },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
