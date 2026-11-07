// Ambre Rare — spiritueux premium. Direction artistique : la profondeur ambrée d'un chai, le temps long, la rareté. Fond brun-noir, ambre et cuivre, parchemin pour les étiquettes,
// filets de cuivre doubles, médaillons ronds. Composants signature : le CONTRÔLE D'ÂGE LÉGAL (mise en scène sobre de la brique « contrôle d'âge » du moteur : le thème explique et
// relie, le moteur refuse côté serveur) et la FICHE DE DÉGUSTATION (robe, nez, bouche, finale, accords : bloc éditable du Page Builder, attributs data-* lus par motion.js).
// Le thème CONSOMME les briques du moteur (comparateur, âge, accès membre, rendez-vous, listes, souhaits, avis, créneaux) : il n'en réimplémente aucune.
// Aucune allégation de santé ; aucune incitation à la consommation ; les notes de dégustation sont des exemples à remplacer par celles du vendeur.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const MENTION = "L'abus d'alcool est dangereux pour la santé. À consommer avec modération.";
const ICON = {
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  scale: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M6 20h12M4 8h16M6 8l-3 7h6zM18 8l-3 7h6z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  seal: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="#c98a2b" stroke-width="1.5"/><circle cx="24" cy="24" r="16" fill="none" stroke="#c98a2b" stroke-width="1" opacity=".5"/><path d="M24 12c5 6 7 9 7 13a7 7 0 0 1-14 0c0-4 2-7 7-13z" fill="#c98a2b"/></svg>`,
};
// Flacon de collection (silhouette, halo ambré derrière, étiquette parchemin vide : le nom est écrit en HTML autour)
const bottle = () => `<svg viewBox="0 0 260 420" role="img" aria-label="Silhouette d'un flacon de spiritueux ambré">
<ellipse class="ar-halo" cx="130" cy="230" rx="124" ry="190"/>
<path class="ar-bottle" d="M108 18h44v34c0 14 2 22 12 36 12 16 26 28 26 66v190c0 20-10 30-30 30h-60c-20 0-30-10-30-30V154c0-38 14-50 26-66 10-14 12-22 12-36z"/>
<path class="ar-lq" d="M64 176h132v168c0 20-10 30-30 30h-72c-20 0-30-10-30-30z"/>
<path class="ar-shine" d="M82 120c-6 20-6 150-4 214"/>
<rect class="ar-label" x="84" y="226" width="92" height="96" rx="46"/><circle class="ar-seal" cx="130" cy="262" r="14"/><path class="ar-rule" d="M100 296h60M108 306h44"/>
<rect class="ar-cap" x="104" y="6" width="52" height="22" rx="3"/></svg>`;
// Verre de dégustation (le niveau et la robe sont réglés par variables CSS ; aucun texte SVG)
const glass = () => `<svg viewBox="0 0 220 260" role="img" aria-label="Verre de dégustation : la couleur du liquide suit la robe de la fiche choisie">
<g class="ar-liquid"><path class="ar-lq2" d="M52 112h116c-2 24-14 40-34 46-6 2-8 4-8 10h-32c0-6-2-8-8-10-20-6-32-22-34-46z"/></g>
<path class="ar-glass" d="M50 40c-2 52 6 92 34 112 8 6 14 8 14 20v52h-22a4 4 0 0 0 0 8h72a4 4 0 0 0 0-8h-22v-52c0-12 6-14 14-20 28-20 36-60 34-112z"/>
<path class="ar-glass-hi" d="M64 56c0 30 4 52 14 68"/></svg>`;

const header = (c) => {
  const half = Math.ceil(c.menu.length / 2);
  const left = c.menu.slice(0, half), right = c.menu.slice(half);
  const l = (m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`;
  return `<header class="ar-head pk-bleed"><div class="ar-legal"><span>Réservé aux personnes majeures</span><span class="ar-sep" aria-hidden="true"></span><span>${esc(MENTION)}</span></div>
  <div class="ar-bar"><div class="ar-nav ar-nav--l" role="navigation" aria-label="Navigation principale">${left.map(l).join("")}</div>
  <a class="ar-logo" href="/" aria-label="Ambre Rare, accueil">${ICON.seal}<span>Ambre Rare</span><i>distillerie de collection</i></a>
  <div class="ar-nav ar-nav--r" role="navigation" aria-label="Pages et boutique">${right.map(l).join("")}<a class="ar-ic" href="/boutique/comparer" aria-label="Comparer des produits">${ICON.scale}</a><a class="ar-ic" href="/boutique/souhaits" aria-label="Mes souhaits">${ICON.heart}</a><a class="ar-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="ar-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
};
const footer = (c) => `<footer class="ar-foot pk-bleed"><div class="ar-wrap ar-foot-g">
  <div><p class="ar-lab">Ambre Rare</p><p class="ar-small">Distillerie de collection.<br>Chai et boutique de démonstration du thème.</p></div>
  <div><p class="ar-lab">Boutique</p><p class="ar-fl"><a href="/boutique">Toute la cave</a><a href="/boutique/comparer">Comparer</a><a href="/boutique/souhaits">Mes souhaits</a><a href="/boutique/listes">Listes de cadeaux</a><a href="/boutique/panier">Panier</a></p></div>
  <div><p class="ar-lab">La maison</p><p class="ar-fl"><a href="/degustation">Fiches de dégustation</a><a href="/distillerie">La distillerie</a><a href="/cercle">Cercle privé</a><a href="/visites">Visites et rendez-vous</a><a href="/livraison">Livraison</a><a href="/faq">Questions</a><a href="/contact">Contact</a></p></div>
  <div><p class="ar-lab">Majorité</p><p class="ar-small">Vente réservée aux adultes. <a href="/majorite">Comment fonctionne le contrôle d'âge</a>.</p></div></div>
  <p class="ar-mention">${esc(MENTION)}</p><p class="ar-copy">© Ambre Rare — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="ar-ph pk-bleed"><div class="ar-wrap ar-narrow"><p class="ar-lab">${esc(kicker)}</p><div class="ar-h1" role="heading" aria-level="1">${esc(title)}</div><p class="ar-lead">${esc(lead)}</p></div></section>`);

// ----- Composant signature : fiches de dégustation. Exemples à remplacer par les notes réelles du vendeur (le bloc est éditable dans le Page Builder).
// Sans JavaScript : toutes les fiches sont lisibles l'une sous l'autre. Avec motion.js : un sélecteur affiche une fiche à la fois et la robe colore le verre.
const FICHES = [
  { cl: "r1", nom: "Réserve Ambrée", sub: "12 ans · fût de chêne", robe: "Ambre doré, reflets cuivrés", nez: "Vanille, écorce d'orange confite, chêne tiède", bouche: "Ronde et soyeuse, miel de châtaignier, épices douces", finale: "Longue, boisée, une pointe de cacao", accords: "Fromage à pâte dure affiné, chocolat noir, noix", deg: "40 % vol.", vol: "70 cl", couleur: "#c98a2b" },
  { cl: "r2", nom: "Fût Rare", sub: "18 ans · fût unique", robe: "Acajou profond, bords orangés", nez: "Fruits secs, cuir fin, tabac blond", bouche: "Dense, figue, raisin de Corinthe, poivre noir", finale: "Très longue, noix grillée, cire d'abeille", accords: "Noix de pécan, tarte aux poires, café serré", deg: "46 % vol.", vol: "70 cl", couleur: "#8a3d17" },
  { cl: "r3", nom: "Fine Vieille Cuvée", sub: "eau-de-vie de fruit · 8 ans", robe: "Or pâle, lumineux", nez: "Fleurs blanches, poire mûre, amande", bouche: "Vive et fruitée, pêche blanche, zeste", finale: "Fraîche et florale, tendre", accords: "Fruits à noyau, amandes grillées, sablé", deg: "42 % vol.", vol: "50 cl", couleur: "#e0b866" },
  { cl: "r4", nom: "Rhum Hors d'Âge", sub: "canne · 15 ans", robe: "Cuivre sombre, dense", nez: "Banane flambée, mélasse, épices de Noël", bouche: "Sirupeuse, cacao, café, bois de cèdre", finale: "Épicée, chaude, légèrement fumée", accords: "Chocolat amer, orange, gâteau aux épices", deg: "43 % vol.", vol: "70 cl", couleur: "#a8481f" },
];
const fiche = (f, i) => `<article class="ar-fiche" data-robe="${f.couleur}" data-nom="${esc(f.nom)}"><div class="ar-fiche-top"><span class="ar-med" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div><h3 class="ar-fiche-t">${esc(f.nom)}</h3><p class="ar-fiche-s">${esc(f.sub)} · ${esc(f.deg)} · ${esc(f.vol)}</p></div><span class="ar-robe ar-${f.cl}" aria-hidden="true"></span></div>
  <dl class="ar-dl"><div><dt>Robe</dt><dd>${esc(f.robe)}</dd></div><div><dt>Nez</dt><dd>${esc(f.nez)}</dd></div><div><dt>Bouche</dt><dd>${esc(f.bouche)}</dd></div><div><dt>Finale</dt><dd>${esc(f.finale)}</dd></div><div class="ar-dl-w"><dt>Accords</dt><dd>${esc(f.accords)}</dd></div></dl>
  <p class="ar-fiche-m">${esc(MENTION)}</p></article>`;
const fichesBloc = (title = "Lire un spiritueux avant de l'ouvrir") => sec(`<section class="ar-fiches pk-bleed"><div class="ar-wrap"><p class="ar-lab">Fiches de dégustation</p><h2 class="ar-h2">${esc(title)}</h2>
  <p class="ar-lead">Robe, nez, bouche, finale, accords : chaque expression a sa fiche. Choisissez-en une, le verre prend la couleur de sa robe.</p>
  <div class="ar-deg" data-ambre-fiches><div class="ar-deg-glass" data-ambre-glass>${glass()}</div><div class="ar-deg-list" data-ambre-list>${FICHES.map(fiche).join("")}</div></div>
  <p class="ar-note">Exemples de fiches : remplacez les notes par celles de vos produits en modifiant ce bloc dans le Page Builder. La couleur du verre se règle avec l'attribut data-robe de chaque fiche. Les notes décrivent un goût, jamais un effet sur la santé.</p>
  <p><a class="ar-btn" href="/boutique">Voir la cave</a> <a class="ar-link" href="/boutique/comparer">Comparer des expressions</a></p></div></section>`);

const distillerie = () => sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap"><div class="ar-split"><div><p class="ar-lab">Le temps long</p><h2 class="ar-h2">Cinq gestes, <em>aucune hâte</em></h2><p class="ar-small">Ce parcours est un exemple de présentation : décrivez ici vos propres étapes et vos propres durées.</p></div>
  <ol class="ar-steps"><li><div><b>Le grain et l'eau</b><span>Les matières premières sont choisies, puis fermentées lentement.</span></div></li><li><div><b>La distillation</b><span>Le cœur de chauffe est séparé des têtes et des queues, à la main.</span></div></li><li><div><b>Le fût</b><span>L'eau-de-vie dort en chai, dans un bois choisi pour ce qu'il lui donne.</span></div></li><li><div><b>L'assemblage</b><span>Le maître de chai goûte, ajuste, attend encore.</span></div></li><li><div><b>La mise</b><span>Le flacon est rempli, scellé, numéroté à la main.</span></div></li></ol></div></div></section>`);
const services = () => sec(`<section class="ar-sec ar-sec--deep pk-bleed"><div class="ar-wrap"><p class="ar-lab">Au service de la cave</p><h2 class="ar-h2">Avant de choisir, pendant, après</h2>
  <ul class="ar-svc"><li><b>Comparer</b><span>Jusqu'à quatre expressions côte à côte : degré, âge, fût, format.</span><a href="/boutique/comparer">Ouvrir le comparateur</a></li>
  <li><b>Le cercle privé</b><span>Éditions réservées aux membres et ventes privées sur une fenêtre réelle.</span><a href="/cercle">Découvrir le cercle</a></li>
  <li><b>Rendez-vous</b><span>Une visite du chai ou un conseil de dégustation, sur un créneau réellement libre.</span><a href="/visites">Réserver un créneau</a></li>
  <li><b>Listes de cadeaux</b><span>Composez une liste à partager par lien privé : un cadeau n'est compté qu'une fois payé.</span><a href="/cadeaux">Voir comment</a></li></ul></div></section>`);
const majoriteBande = () => sec(`<section class="ar-age pk-bleed"><div class="ar-wrap ar-age-in"><div class="ar-age-badge" aria-hidden="true"><span>18</span></div><div><p class="ar-lab">Vente réservée aux adultes</p><h2 class="ar-h2">Le contrôle d'âge est fait avant le panier</h2>
  <p class="ar-small">Le catalogue reste consultable. Pour ajouter un produit réservé aux adultes, la boutique demande une déclaration d'âge ; à la commande, une case vide à cocher soi-même confirme la majorité. C'est une déclaration sur l'honneur, sans vérification d'identité : le transporteur peut demander une pièce d'identité à la livraison.</p>
  <p><a class="ar-link ar-link--l" href="/majorite">Lire le détail du contrôle</a></p></div></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="ar-hero pk-bleed"><div class="ar-wrap ar-hero-in"><p class="ar-lab">Édition de collection</p><div class="ar-h1 ar-h1--xl" role="heading" aria-level="1">Le temps,<br><em>mis en fût</em></div>
    <div class="ar-hero-art"><span class="ar-ghost" aria-hidden="true">XII</span>${bottle()}</div>
    <p class="ar-lead">Des eaux-de-vie vieillies lentement, en petites séries numérotées. On les ouvre pour une occasion, on les sert avec mesure.</p><p><a class="ar-btn" href="/boutique">Entrer dans la cave</a> <a class="ar-link" href="/degustation">Lire les fiches de dégustation</a></p></div></section>`),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap"><p class="ar-lab">La cave</p><h2 class="ar-h2">Expressions à la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 4, columns: "4", orderby: "featured", ratio: "3/4" })),
  fichesBloc(), distillerie(), majoriteBande(), services(), sec(footer(c))];

const degustation = (c) => [sec(header(c)), head("Dégustation", "Fiches de dégustation", "Robe, nez, bouche, finale, accords."), fichesBloc("Une fiche par expression"),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap ar-narrow ar-prose"><h2 class="ar-h2">Déguster avec mesure</h2><p>Un petit verre suffit pour lire une eau-de-vie : regardez la robe, approchez le nez, laissez la bouche travailler. Servez de l'eau fraîche à côté. Ne conduisez pas après avoir bu.</p><p class="ar-small">${esc(MENTION)}</p></div></section>`), sec(footer(c))];
const distilleriePage = (c) => [sec(header(c)), head("La distillerie", "Du grain au flacon", "Les gestes, le temps, le chai."), distillerie(),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap"><p class="ar-lab">Registre des expressions</p><h2 class="ar-h2">Un tableau pour chaque série</h2><div class="ar-tablewrap"><table class="ar-table"><caption class="ar-vh">Exemple de registre des expressions</caption><thead><tr><th scope="col">Expression</th><th scope="col">Âge</th><th scope="col">Fût</th><th scope="col">Degré</th><th scope="col">Format</th></tr></thead><tbody>
  <tr><th scope="row">Réserve Ambrée</th><td>12 ans</td><td>Chêne français</td><td>40 % vol.</td><td>70 cl</td></tr><tr><th scope="row">Fût Rare</th><td>18 ans</td><td>Fût unique</td><td>46 % vol.</td><td>70 cl</td></tr><tr><th scope="row">Fine Vieille Cuvée</th><td>8 ans</td><td>Chêne usagé</td><td>42 % vol.</td><td>50 cl</td></tr></tbody></table></div><p class="ar-note">Exemple de présentation : renseignez vos propres expressions. Les caractéristiques d'un produit (libellé / valeur) se saisissent dans sa fiche et alimentent le comparateur.</p></div></section>`), sec(footer(c))];
const cercle = (c) => [sec(header(c)), head("Cercle privé", "Éditions réservées, ventes privées", "Accès par invitation, fenêtres réelles."),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap ar-split"><div><p class="ar-lab">Comment ça marche</p><h2 class="ar-h2">Entrer dans le cercle</h2><p class="ar-small">Certaines éditions peuvent être réservées aux membres. Un membre est un client inscrit approuvé par la maison, ou entré avec un code d'invitation.</p></div>
  <ol class="ar-steps"><li><div><b>Créer un compte client</b><span>Le code d'invitation se saisit une fois connecté.</span></div></li><li><div><b>Saisir un code ou demander l'accès</b><span>Le code est contrôlé à chaque usage (limite d'utilisations, date d'expiration).</span></div></li><li><div><b>Découvrir les éditions</b><span>Selon le réglage de la maison, les éditions réservées sont masquées ou visibles avec un cadenas.</span></div></li></ol></div>
  <div class="ar-wrap"><p><a class="ar-btn" href="/boutique/invitation">J'ai un code d'invitation</a> <a class="ar-link" href="/boutique/compte">Mon compte</a></p><p class="ar-note">Une vente privée est une fenêtre réelle définie par la maison : hors fenêtre, l'ajout au panier et la commande sont refusés. La date de fin affichée vient de la base ; le thème n'ajoute aucun compte à rebours. Les dates sont en UTC.</p></div></section>`), sec(footer(c))];
const visites = (c) => [sec(header(c)), head("Rendez-vous", "Visites du chai et conseils", "Un créneau libre, un verre d'eau, une conversation."),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap ar-narrow ar-prose"><h2 class="ar-h2">Réserver</h2><p>Choisissez un type de rendez-vous, puis un jour, puis une heure. Seuls les créneaux réellement libres sont proposés ; un e-mail récapitulatif contient un lien d'annulation.</p><ul class="ar-list"><li>Visite commentée du chai (sur place)</li><li>Conseil de dégustation (en visioconférence ou sur place)</li><li>Retrait d'une commande et remise de la bouteille</li></ul><p class="ar-small">Ces types sont des exemples : la maison définit les siens, leurs durées et ses disponibilités. La dégustation sur place reste réservée aux adultes et s'accompagne d'eau.</p><p><a class="ar-btn" href="/boutique/rendez-vous">Choisir un créneau</a></p></div></section>`), sec(footer(c))];
const cadeaux = (c) => [sec(header(c)), head("Cadeaux", "Offrir, avec mesure", "Listes de cadeaux, souhaits, coffrets."),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap ar-narrow ar-prose"><h2 class="ar-h2">Listes de cadeaux</h2><p>Créez une liste, choisissez vos bouteilles ou accessoires, partagez un lien privé. Chacun voit ce qui reste à offrir ; un cadeau n'est compté qu'une fois payé. Les bouteilles réservées aux adultes gardent leur contrôle d'âge à l'achat.</p><p><a class="ar-btn" href="/boutique/listes">Créer ou ouvrir une liste</a> <a class="ar-link" href="/boutique/souhaits">Mes souhaits</a></p>
  <h2 class="ar-h2">Message personnalisé</h2><p>Sur les produits où la maison active la personnalisation, un court texte (carte, gravure) se saisit sur la fiche et suit la ligne de panier. Le prix ne change pas.</p></div></section>`), sec(footer(c))];
const majorite = (c) => [sec(header(c)), head("Majorité", "Contrôle d'âge légal", "Ce que voit le visiteur, ce que règle la maison."),
  majoriteBande(),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap ar-narrow ar-prose"><h2 class="ar-h2">Parcours du visiteur</h2><ol class="ar-steps"><li><div><b>Il consulte le catalogue</b><span>Fiches et prix restent visibles pour tous.</span></div></li><li><div><b>Il ajoute un produit réservé</b><span>Sans déclaration d'âge, le serveur refuse l'ajout et affiche l'écran de majorité.</span></div></li><li><div><b>Il déclare son âge</b><span>Deux choix : confirmer avoir l'âge requis, ou dire qu'il ne l'a pas. Le refus bloque l'achat, pas la visite.</span></div></li><li><div><b>Il commande</b><span>Une case vide, à cocher par lui-même, est exigée par le serveur ; la date et l'âge sont enregistrés sur la commande.</span></div></li></ol>
  <h2 class="ar-h2">Limites à connaître</h2><p>Il s'agit d'une déclaration sur l'honneur : aucune pièce d'identité n'est vérifiée en ligne. La livraison peut exiger une pièce d'identité. Le thème n'ajoute aucune vérification de plus et ne prétend pas en faire.</p><p class="ar-small">${esc(MENTION)}</p></div></section>`), sec(footer(c))];
const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer Ambre Rare", "Le thème affiche, le moteur décide : tout se règle dans l'admin."),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap"><div class="ar-tablewrap"><table class="ar-table"><caption class="ar-vh">Briques du moteur et réglages</caption><thead><tr><th scope="col">Brique</th><th scope="col">Où la régler</th><th scope="col">Ce que fait le thème</th></tr></thead><tbody>
  <tr><th scope="row">Contrôle d'âge</th><td>Âge minimum 16, 18 ou 21 sur le produit et/ou la catégorie (le plus élevé gagne)</td><td>Page « Majorité », mentions légales, écran d'âge mis en forme</td></tr>
  <tr><th scope="row">Comparateur</th><td>Fiche produit : caractéristiques libellé / valeur (20 au plus)</td><td>Lien « Comparer » dans l'en-tête, tableau mis en forme</td></tr>
  <tr><th scope="row">Accès membre, ventes privées</th><td>Onglet « Accès membre » : produits ou catégories réservés, codes, fenêtres</td><td>Page « Cercle privé », écran d'invitation</td></tr>
  <tr><th scope="row">Rendez-vous</th><td>Onglet « Rendez-vous » : types, disponibilités, délai, horizon</td><td>Page « Visites », écrans de réservation</td></tr>
  <tr><th scope="row">Listes de cadeaux</th><td>Onglet « Listes cadeaux » et page publique de création</td><td>Page « Cadeaux », tableau des articles</td></tr>
  <tr><th scope="row">Créneaux de livraison</th><td>Réglages de livraison : créneaux récurrents, méthode qui exige un créneau</td><td>Mise en forme des jours et plages dans la commande</td></tr>
  <tr><th scope="row">Avis vérifiés</th><td>Onglet « Avis » : modération ou publication directe</td><td>Aucun avis écrit dans le thème</td></tr>
  <tr><th scope="row">Souhaits, personnalisation</th><td>Souhaits : automatique ; personnalisation : réglage par produit</td><td>Liens et mise en forme</td></tr></tbody></table></div>
  <div class="ar-narrow ar-prose"><h2 class="ar-h2">Fiches de dégustation</h2><p>Dans le Page Builder, ouvrez le bloc « HTML » d'une fiche et remplacez robe, nez, bouche, finale et accords. Gardez la mention « ${esc(MENTION)} » sur chaque fiche. Le thème n'invente aucun avis, stock, compteur ni durée : ce qui s'affiche vient de vos réglages.</p></div></div></section>`), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison", "Livraison et retours", "Emballage de protection, remise contrôlée."),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap ar-narrow ar-prose"><h2 class="ar-h2">Livraison</h2><p>Frais et délais sont calculés à la commande selon votre pays. Chaque flacon voyage calé dans un étui rigide. Pour les produits réservés aux adultes, le transporteur peut demander une pièce d'identité à la remise.</p><h2 class="ar-h2">Créneau de livraison</h2><p>Si la maison propose des créneaux (livraison à heure choisie), vous les choisissez à la commande : seuls les créneaux réellement libres sont affichés.</p><h2 class="ar-h2">Retours</h2><p>Un flacon intact et non ouvert peut être retourné dans le délai indiqué à la commande. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Majorité, dégustation, livraison."),
  sec(`<section class="ar-sec pk-bleed"><div class="ar-wrap ar-narrow"><details class="ar-q"><summary>Pourquoi me demande-t-on mon âge ?</summary><p>La vente d'alcool est réservée aux adultes. La boutique demande une déclaration avant l'ajout au panier et une confirmation à la commande.</p></details><details class="ar-q"><summary>Vérifiez-vous ma pièce d'identité ?</summary><p>Non, pas en ligne : c'est une déclaration sur l'honneur. Le transporteur peut la demander à la livraison.</p></details><details class="ar-q"><summary>Les notes de dégustation sont-elles objectives ?</summary><p>Ce sont des impressions de goût, pas des mesures. Elles décrivent robe, nez, bouche et finale.</p></details><details class="ar-q"><summary>Comment conserver un flacon ?</summary><p>Debout, à l'abri de la lumière et des variations de chaleur.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une expression, une commande, une visite."), { type: "form", heading: "Écrire à la maison", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une expression", "Un nom, un âge, un fût."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une expression…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ar-ph pk-bleed"><div class="ar-wrap ar-narrow"><p class="ar-lab">Page introuvable</p><div class="ar-h1 ar-h1--xl" role="heading" aria-level="1">Fût <em>vide</em></div><p class="ar-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la cave</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "ambre-rare", name: "Ambre Rare", version: "1.0.0", category: "luxe", tags: ["luxe", "sombre", "classique"], siteType: "Spiritueux premium", featured: true,
  concept: "Un chai dans la pénombre : fond brun-noir, ambre et cuivre, étiquettes de parchemin, contrôle d'âge légal en évidence et fiches de dégustation (robe, nez, bouche, finale, accords).",
  description: "Spiritueux premium : fond brun-noir, ambre et cuivre, flacon en halo, contrôle d'âge légal expliqué, fiches de dégustation éditables avec verre qui prend la robe choisie, comparateur, cercle privé, rendez-vous et listes de cadeaux.",
  brand: "Ambre Rare", modules: ["formulaires", "recherche", "commerce"], shop: { card: "etiquette-parchemin-double-filet-cuivre", gallery: "flacon-centre-sur-halo-ambre", cart: "page-dediee-brun-noir-filets-cuivre", catalog: "filtres-en-ligne-fine-et-cartes-etiquettes" },
  dna: {
    header: "mention-legale-puis-logo-centre-menus-de-part-et-d-autre", hero: "flacon-centre-sur-halo-ambre-et-chiffre-d-age-en-filigrane", grid: "quatre-etiquettes-parchemin-hautes-3-4", typo: "cormorant-garamond-et-hanken-grotesk",
    shapes: "cartouches-ovales-medaillons-et-double-filet-de-cuivre", motion: "niveau-d-ambre-qui-monte-lentement-dans-le-verre", rhythm: "brun-noir-profond-entrecoupe-de-bandes-parchemin", signature: "fiche-de-degustation-robe-nez-bouche-finale-accords-et-controle-d-age",
    palette: "brun-noir-ambre-cuivre-et-parchemin", image: "silhouettes-svg-de-flacon-et-de-verre-sans-photo", list: "etiquettes-de-bouteille-prix-sous-filet-cuivre",
    article: "colonne-etroite-etapes-en-medaillons-numerotes", sidebar: "aucune-fiche-de-degustation-en-lieu-et-place", reading: "hanken-grotesk-17-px-mesure-62-caracteres-sur-fond-sombre",
  },
  tokens: {
    colors: { primary: "#c98a2b", secondary: "#1e1610", accent: "#e8ab45", background: "#14100c", surface: "#1e1610", text: "#ecdfc6", muted: "#b5a285", success: "#7fae7a", warning: "#d9a441", error: "#e07a6a" },
    fonts: { heading: "font.cormorant-garamond", body: "font.hanken-grotesk", button: "font.hanken-grotesk", link: "font.hanken-grotesk" },
    radius: { sm: 2, md: 4, lg: 8, button: 999, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3d2e1f" },
    type: { h1: { size: 64, weight: 500, lineHeight: 1.04, transform: "none" }, h2: { size: 38, weight: 500, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "ambre", label: "Couleur de l'ambre", type: "color", default: "#c98a2b" },
    { key: "fond", label: "Profondeur du fond", type: "choice", default: "profond", choices: [["profond", "Brun-noir profond"], ["chai", "Brun chai (un peu plus clair)"]] },
    { key: "bande", label: "Bandeau de mentions légales", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "filets", label: "Doubles filets de cuivre", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "fiche", label: "Fiche ouverte au départ", type: "choice", default: "1", choices: [["1", "Réserve Ambrée"], ["2", "Fût Rare"], ["3", "Fine Vieille Cuvée"], ["4", "Rhum Hors d'Âge"]] },
    { key: "lenteur", label: "Vitesse du niveau d'ambre", type: "choice", default: "lente", choices: [["lente", "Lente"], ["posee", "Posée"], ["fixe", "Aucune animation"]] },
    { key: "filigrane", label: "Chiffre d'âge en filigrane", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Dégustation", "/degustation"], ["Distillerie", "/distillerie"], ["Cercle privé", "/cercle"], ["Rendez-vous", "/visites"], ["Cadeaux", "/cadeaux"], ["Majorité", "/majorite"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "degustation", name: "Fiches de dégustation", render: degustation }, { key: "distillerie", name: "La distillerie", render: distilleriePage },
    { key: "cercle", name: "Cercle privé", render: cercle }, { key: "visites", name: "Rendez-vous et visites", render: visites }, { key: "cadeaux", name: "Cadeaux et listes", render: cadeaux },
    { key: "majorite", name: "Contrôle d'âge", render: majorite }, { key: "configurer", name: "Comment configurer", render: configurer }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
