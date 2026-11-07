// Service Dressé — art de la table : porcelaine, cristal, couverts, linge. Direction artistique : la lumière sur la table. Fond porcelaine, encre bleu nuit, émail céladon, filet champagne ;
// produits montrés en assiettes rondes à double filet ; un reflet glisse lentement sur la porcelaine du bandeau. Les mises en table sont dessinées en SVG dans le thème (vue de dessus, aucune image externe).
// Composant signature : le COMPOSEUR DE SERVICE AVEC TOTAL EN DIRECT (page « Composer »).
//  - Le moteur n'a PAS de produits groupés ni de coffrets : un « service » n'existe donc pas comme produit. Le composeur est un bloc éditable + motion.js qui LIT, sur la page, les vraies cartes
//    produit de la boutique (widget shopgrid : nom, catégorie, prix affiché, identifiant), puis calcule « pièces par convive × nombre de convives × prix affiché » pour chaque ligne et le total.
//  - Aucun prix n'est écrit dans le thème. Le total est indicatif : la boutique recalcule prix, stock et quantité (entier de 1 à 99) à chaque ajout au panier.
//  - « Ajouter les pièces au panier » envoie, ligne par ligne, des demandes réelles vers l'ajout au panier du moteur (une par produit simple) ; les produits à variantes s'ajoutent depuis leur fiche.
//    Rien n'est enregistré par le thème. Sans JavaScript, la page reste un catalogue normal.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

/* ---------- Mises en table (SVG générés : coordonnées entières, pas d'identifiant, de style en ligne ni de texte) ---------- */
function tableSvg(v, label) {
  const P = [
    { cloth: "#e8e2d4", ln: "#eee9dd", glaze: "#3b6b62", glass: "#9db4c9", gl2: "#dfe7ee", gold: "#b8985a", n: 3 },
    { cloth: "#1f2a44", ln: "#27334f", glaze: "#b8985a", glass: "#c9d6e6", gl2: "#b9c6d8", gold: "#d8bd7e", n: 4 },
    { cloth: "#efe9dc", ln: "#f4efe4", glaze: "#c9788a", glass: "#b7cfc6", gl2: "#e1ece8", gold: "#b8985a", n: 2 },
  ][v % 3];
  let b = `<rect width="400" height="400" fill="${P.cloth}"/>`;
  for (let i = 1; i < 10; i++) b += `<path d="M0 ${i * 40}H400" stroke="${P.ln}" stroke-width="1"/>`;
  b += `<polygon points="30,300 130,270 150,350 50,380" fill="#fbfaf7" stroke="${P.gold}" stroke-width="1"/><path d="M62 296L130 276" stroke="${P.glaze}" stroke-width="2"/>`;
  b += `<circle cx="210" cy="215" r="150" fill="#d6d0c0"/><circle cx="210" cy="215" r="128" fill="#fbfaf7" stroke="#cfc8b6" stroke-width="2"/>`
    + `<circle cx="210" cy="215" r="98" fill="none" stroke="${P.glaze}" stroke-width="4"/><circle cx="210" cy="215" r="92" fill="none" stroke="${P.gold}" stroke-width="1"/>`
    + `<circle cx="210" cy="215" r="62" fill="#f3f0e8" stroke="#e1dccd" stroke-width="2"/><circle cx="210" cy="215" r="20" fill="none" stroke="${P.gold}" stroke-width="1"/>`;
  b += `<path d="M118 70V120M126 70V120M134 70V120M142 70V120" stroke="#8a8f98" stroke-width="3"/><path d="M118 120Q130 132 142 120" fill="none" stroke="#8a8f98" stroke-width="3"/><rect x="127" y="128" width="6" height="150" rx="3" fill="#aeb3bb"/>`;
  b += `<path d="M318 70Q336 130 322 190V270" fill="none" stroke="#aeb3bb" stroke-width="8" stroke-linecap="round"/><path d="M318 70Q336 130 322 190" fill="none" stroke="#e9ecef" stroke-width="2"/>`;
  for (let i = 0; i < P.n; i++) {
    const cx = [330, 292, 360, 250][i], cy = [90, 52, 140, 38][i];
    b += `<circle cx="${cx}" cy="${cy}" r="30" fill="${P.gl2}" stroke="${P.glass}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="21" fill="${P.glass}"/>`
      + `<circle cx="${cx}" cy="${cy}" r="5" fill="#ffffff"/><path d="M${cx - 20} ${cy - 10}A24 24 0 0 1 ${cx - 6} ${cy - 22}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(label)}">${b}</svg>`;
}
const decor = (v) => tableSvg(v, "").replace('role="img"', 'aria-hidden="true"').replace(/ aria-label="[^"]*"/, "");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  mark: `<svg class="sd-mark" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="24" cy="24" r="15" fill="none" stroke="#b8985a" stroke-width="1"/><path d="M17 31V17h6a4.5 4.5 0 0 1 0 9h-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
};
const FIL = `<div class="sd-fil" aria-hidden="true"></div>`;
const header = (c) => {
  const h = Math.ceil(c.menu.length / 2);
  const links = (arr) => arr.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("");
  return `<header class="sd-head pk-bleed"><div class="sd-promo">Porcelaine, cristal, couverts et linge · Le prix affiché est celui de la boutique</div>
  <div class="sd-bar"><div class="sd-nav sd-nav--l" role="navigation" aria-label="Navigation principale">${links(c.menu.slice(0, h))}</div>
  <a class="sd-logo" href="/" aria-label="Service Dressé, accueil">${ICON.mark}<span><b>Service Dressé</b><i>art de la table</i></span></a>
  <div class="sd-nav sd-nav--r" role="navigation" aria-label="Pages de la maison">${links(c.menu.slice(h))}<span class="sd-act"><a class="sd-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="sd-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></span></div></div>${FIL}</header>`;
};
const footer = (c) => `<footer class="sd-foot pk-bleed">${FIL}<div class="sd-wrap sd-foot-g">
  <div><p class="sd-lab">Service Dressé</p><p class="sd-small">Maison de l'art de la table. Porcelaine, cristal, couverts et linge, choisis pour dresser une table complète.</p></div>
  <div><p class="sd-lab">Boutique</p><p class="sd-fl"><a href="/boutique">Toutes les pièces</a><a href="/composer">Composer un service</a><a href="/boutique/souhaits">Mes souhaits</a><a href="/boutique/comparer">Comparer</a><a href="/boutique/panier">Panier</a></p></div>
  <div><p class="sd-lab">Occasions</p><p class="sd-fl"><a href="/mariage">Liste de mariage</a><a href="/boutique/listes">Listes de cadeaux</a><a href="/boutique/rendez-vous">Prendre rendez-vous</a><a href="/conseil">Gravure et conseil</a></p></div>
  <div><p class="sd-lab">Informations</p><p class="sd-fl"><a href="/entretien">Entretien</a><a href="/livraison">Livraison et retours</a><a href="/faq">Questions</a><a href="/contact">Contact</a><a href="/configurer">Comment configurer</a></p></div></div>
  <p class="sd-copy">© Service Dressé — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="sd-ph pk-bleed"><div class="sd-wrap sd-narrow"><p class="sd-lab">${esc(kicker)}</p><div class="sd-h1" role="heading" aria-level="1">${esc(title)}</div><p class="sd-lead">${esc(lead)}</p></div></section>`);
const band = (kicker, title, lead = "") => sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap"><p class="sd-lab">${esc(kicker)}</p><h2 class="sd-h2">${esc(title)}</h2>${lead ? `<p class="sd-lead">${esc(lead)}</p>` : ""}</div></section>`);
const prose = (...parts) => sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap sd-narrow sd-prose">${parts.join("")}</div></section>`);
const grid = (props) => wrap(shopgrid({ columns: "4", ratio: "1/1", showCategory: true, showCart: true, showBadge: true, ...props }));

/* ---------- Composant signature : le composeur de service ---------- */
const composeur = () => sec(`<section class="sd-comp pk-bleed" data-sd-composer data-sd-fixed="Pour la table"><div class="sd-wrap">
  <p class="sd-lab">Composeur de service</p><h2 class="sd-h2">Dressez la table, voyez le total</h2>
  <p class="sd-lead">Indiquez le nombre de convives, puis le nombre de pièces par convive : le total se met à jour sous vos yeux, à partir des prix réellement affichés dans la boutique. Rien n'est ajouté au panier avant votre clic.</p>
  <p class="sd-nojs">Le calcul en direct a besoin de JavaScript. Sans lui, parcourez les pièces ci-dessous et ajoutez-les une à une depuis leur fiche.</p>
  <div class="sd-comp-box" data-sd-box>
    <div class="sd-guests" data-sd-guests></div>
    <div class="sd-lines" data-sd-lines></div>
    <div class="sd-sum" data-sd-sum></div>
  </div>
  <p class="sd-small sd-comp-note">Le total est une estimation : la boutique recalcule le prix, le stock et la quantité (un nombre entier de 1 à 99) quand vous ajoutez une pièce au panier. Il n'existe pas de remise « service complet » : chaque pièce garde son prix.</p>
</div></section>`);

const mises = () => sec(`<section class="sd-sec sd-mises pk-bleed"><div class="sd-wrap"><p class="sd-lab">Mises en table</p><h2 class="sd-h2">Trois façons de dresser</h2>
  <div class="sd-mgrid">${[
    ["Le déjeuner clair", "Porcelaine blanche à filet céladon, un verre à eau, un verre à vin. La table de tous les jours, sans rien d'ostentatoire.", 0],
    ["Le dîner de nuit", "Nappe bleu nuit, assiette à filet champagne, quatre verres en cristal. La lumière des bougies fait le reste.", 1],
    ["La table d'été", "Lin écru, filet rose, deux verres teintés. Des pièces qui se mélangent sans se ressembler.", 2],
  ].map(([t, d, v]) => `<figure class="sd-fig"><div class="sd-ref">${tableSvg(v, `Mise en table vue de dessus : ${t}`)}</div><figcaption><b>${esc(t)}</b><span>${esc(d)}</span></figcaption></figure>`).join("")}</div>
  <p class="sd-cta"><a class="sd-btn" href="/composer">Composer votre service</a></p></div></section>`);

const etapes = () => sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap"><p class="sd-lab">Le geste</p><h2 class="sd-h2">Trois temps pour une table</h2>
  <ol class="sd-ol"><li><b>Les convives</b>Vous fixez le nombre de personnes à table, de 1 à 24.</li><li><b>Les pièces</b>Pour chaque assiette, verre ou couvert, vous choisissez combien en prévoir par convive. Les carafes et les plats se comptent en tout.</li><li><b>Le total</b>La somme se calcule en direct, avec les prix de la boutique. Vous ajoutez ensuite les pièces au panier, ligne par ligne.</li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="sd-hero pk-bleed"><div class="sd-wrap sd-hero-in"><div class="sd-hero-t"><p class="sd-lab">Art de la table</p><div class="sd-h1 sd-h1--xl" role="heading" aria-level="1">La lumière<br><em>dresse la table</em></div><p class="sd-lead">Porcelaine, cristal, couverts et linge. Choisissez vos pièces, fixez le nombre de convives : le total du service se calcule en direct.</p><p><a class="sd-btn" href="/composer">Composer un service</a> <a class="sd-link" href="/boutique">Voir la boutique</a></p></div>
    <div class="sd-hero-plate" aria-hidden="true"><div class="sd-ref sd-ref--round">${decor(0)}</div></div></div></section>`),
  band("Le couvert", "Pièces choisies par la maison"),
  grid({ source: "featured", count: 4, orderby: "featured" }),
  band("Signature", "Un service, pièce par pièce", "Le moteur de la boutique ne vend pas de coffrets : le composeur calcule pour vous, à partir des vrais prix."),
  etapes(),
  mises(),
  band("À saisir", "Pièces en promotion"),
  grid({ source: "sale", count: 4, orderby: "featured", showCart: true }),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap sd-split"><div><p class="sd-lab">Occasions</p><h2 class="sd-h2">Une liste de mariage, sans doublon</h2><p>Les mariés créent leur liste de cadeaux, partagent un lien privé, et chaque invité voit ce qui est souhaité, déjà offert et encore à offrir.</p><p><a class="sd-btn" href="/mariage">Voir comment ça marche</a></p></div><div class="sd-ref sd-ref--sq" aria-hidden="true">${decor(1)}</div></div></section>`),
  sec(footer(c))];

const composer = (c) => [sec(header(c)), head("Composer", "Composer votre service", "Les convives, les pièces, le total. Puis le panier, ligne par ligne."),
  composeur(),
  band("Les assiettes", "Porcelaine"),
  grid({ source: "category", category: "assiettes", count: 8 }),
  band("Les verres", "Cristal et verre"),
  grid({ source: "category", category: "verres-et-cristal", count: 8 }),
  band("Au couvert", "Couverts"),
  grid({ source: "category", category: "couverts", count: 8 }),
  band("Le linge", "Serviettes et linge"),
  grid({ source: "category", category: "linge-et-serviettes", count: 8 }),
  band("Pour la table", "Service, carafes et plats", "Ces pièces se comptent en tout, pas par convive."),
  grid({ source: "category", category: "pour-la-table", count: 8 }),
  sec(footer(c))];

const mariage = (c) => [sec(header(c)), head("Occasions", "La liste de mariage", "Une liste de cadeaux partagée par lien privé, avec les quantités réelles."),
  prose(`<h2 class="sd-h2">Comment ça marche</h2><ol class="sd-steps"><li><b>Les mariés créent la liste</b> depuis la page <a href="/boutique/listes">Listes de cadeaux</a> de la boutique, avec un titre, un message et la date de l'événement.</li><li><b>Ils choisissent les pièces</b> et la quantité souhaitée de chacune : douze assiettes, six verres, une carafe.</li><li><b>Ils partagent le lien privé</b> de la liste. Il est long et secret : seules les personnes qui le reçoivent peuvent l'ouvrir.</li><li><b>Chaque invité voit trois nombres</b> pour chaque pièce : souhaité, offert, restant. Un cadeau n'est compté comme offert qu'une fois la commande payée, et redescend en cas de remboursement.</li><li><b>L'invité choisit la livraison</b> : chez lui, ou chez les mariés si ceux-ci l'ont autorisé. L'adresse des mariés n'est jamais affichée.</li></ol>`,
    `<h2 class="sd-h2">À savoir</h2><ul class="sd-ul"><li>Les pièces à gravure personnalisée ne peuvent pas figurer sur une liste de cadeaux.</li><li>La livraison chez les mariés n'est possible que si le panier de l'invité ne contient que des cadeaux d'une seule liste.</li><li>Le composeur de service ne crée pas de liste : il sert à estimer un budget. Utilisez-le pour préparer la liste, puis reportez les pièces.</li></ul>`,
    `<p><a class="sd-btn" href="/boutique/listes">Créer ou retrouver une liste</a> <a class="sd-link" href="/composer">Estimer un service</a></p>`),
  sec(footer(c))];

const conseil = (c) => [sec(header(c)), head("Conseil", "Gravure et conseil de table", "Un monogramme sur un verre, un conseil pour marier les pièces."),
  prose(`<h2 class="sd-h2">La gravure de service</h2><p>Certaines pièces peuvent porter un texte choisi par le client : initiales, date, prénom. Le texte est demandé sur la fiche du produit, copié sur la commande et lu par l'atelier. Il s'enregistre séparément pour chaque ligne du panier.</p><p>La gravure ne change pas le prix affiché. Une pièce gravée est faite pour vous : indiquez dans vos conditions de retour si elle peut être reprise.</p>`,
    `<h2 class="sd-h2">Le rendez-vous de conseil</h2><p>Pour associer un service de porcelaine à des verres, ou préparer une liste, prenez rendez-vous : seuls des créneaux réellement libres sont proposés, et une confirmation vous est envoyée par e-mail.</p><p><a class="sd-btn" href="/boutique/rendez-vous">Prendre rendez-vous</a></p>`,
    `<h2 class="sd-h2">Comparer deux pièces</h2><p>Sur une fiche produit, ajoutez jusqu'à quatre pièces au comparateur : le tableau met en évidence ce qui diffère (diamètre, matière, contenance, entretien).</p><p><a class="sd-link sd-link--n" href="/boutique/comparer">Ouvrir le comparateur</a></p>`),
  sec(footer(c))];

const entretien = (c) => [sec(header(c)), head("Entretien", "Prendre soin de la table", "Porcelaine, cristal, argent, lin : les gestes simples."),
  prose(`<h2 class="sd-h2">Porcelaine</h2><p>Lavez à l'eau chaude avec un détergent doux. Évitez les chocs thermiques : ne passez pas une assiette froide directement dans un four chaud. Les filets métalliques ne vont pas au four à micro-ondes.</p><h2 class="sd-h2">Cristal</h2><p>Lavage à la main de préférence, à l'eau tiède, et séchage à l'envers sur un linge propre. Tenez un verre par le pied, jamais par le bord.</p><h2 class="sd-h2">Couverts</h2><p>Séchez-les après lavage pour éviter les traces. Les finitions dorées supportent mal les produits abrasifs.</p><h2 class="sd-h2">Linge</h2><p>Lavez le lin à 40 °C, repassez-le encore humide. Traitez une tache de vin tout de suite, à l'eau froide.</p><p class="sd-small">Chaque produit précise ses propres consignes sur sa fiche : elles priment sur ces conseils généraux.</p>`),
  sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  prose(`<h2 class="sd-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Les pièces fragiles sont calées une à une.</p><h2 class="sd-h2">Retours</h2><p>Vous disposez de quatorze jours pour retourner une pièce intacte, dans son emballage. Écrivez-nous depuis la page <a href="/contact">contact</a>. Une pièce gravée est faite pour vous : sa reprise dépend des conditions de la maison.</p><h2 class="sd-h2">Casse à la livraison</h2><p>Signalez-la sans attendre, photo à l'appui, depuis la page contact.</p><h2 class="sd-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p>`),
  sec(footer(c))];

const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Composeur, listes, gravure."),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap sd-narrow"><details class="sd-q"><summary>Le composeur vend-il un service complet ?</summary><p>Non. Il calcule un total à partir des prix des pièces et ajoute chaque pièce au panier séparément. Aucune remise de service n'est appliquée.</p></details><details class="sd-q"><summary>Pourquoi mon service contient-il des pièces « à partir de » ?</summary><p>Ce sont des pièces à variantes (finition, coloris, dimension) : leur prix exact dépend du choix. Ouvrez leur fiche pour choisir, le panier confirme le prix.</p></details><details class="sd-q"><summary>Combien de pièces d'une même ligne puis-je ajouter ?</summary><p>De 1 à 99. Si le calcul dépasse 99, réduisez le nombre de convives ou ajoutez la pièce en deux fois.</p></details><details class="sd-q"><summary>Les mariés voient-ils qui a offert quoi ?</summary><p>Le donateur peut laisser un mot et un prénom, visibles du bénéficiaire. Ils sont facultatifs.</p></details></div></section>`),
  sec(footer(c))];

const li = (t) => `<li>${t}</li>`;
const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer ce thème", "Le thème consomme les fonctions de la boutique. C'est vous qui les réglez dans l'administration."),
  prose(`<h2 class="sd-h2">1. Le catalogue et le composeur</h2><ul class="sd-ul">${[
    "Dans Boutique, créez les catégories <b>Assiettes</b>, <b>Verres et cristal</b>, <b>Couverts</b>, <b>Linge et serviettes</b> et <b>Pour la table</b>. Leurs adresses (assiettes, verres-et-cristal, couverts, linge-et-serviettes, pour-la-table) alimentent la page Composer.",
    "Le composeur lit les cartes produit visibles sur sa page : le nom, la catégorie, le prix affiché et l'identifiant. Pour qu'il propose le bouton d'ajout, les grilles de la page doivent afficher le prix, la catégorie et le bouton d'ajout (c'est déjà réglé dans la page fournie).",
    "Les pièces d'une catégorie citée dans le bloc du composeur (réglage « Pour la table ») se comptent <b>en tout</b>. Les autres se comptent <b>par convive</b>. Pour changer, modifiez la liste des catégories dans le bloc HTML du composeur (séparez les noms par une virgule).",
    "Les produits à variantes apparaissent avec leur prix « à partir de » et un lien vers leur fiche : ils sont comptés à part, jamais ajoutés au panier par le composeur.",
  ].map(li).join("")}</ul>
  <h2 class="sd-h2">2. Ce que le composeur ne fait pas</h2><ul class="sd-ul">${[
    "Il ne crée aucun produit groupé ni coffret : le moteur n'en propose pas. Il n'applique aucune remise.",
    "Il ne garde pas le service entre deux visites et ne le met pas dans une liste de cadeaux.",
    "Le total est une estimation : la boutique recalcule prix, stock et quantité à chaque ajout. Les quantités sont des nombres entiers de 1 à 99.",
  ].map(li).join("")}</ul>
  <h2 class="sd-h2">3. La liste de mariage</h2><ul class="sd-ul">${[
    "Les listes de cadeaux sont gérées dans l'onglet <b>Listes cadeaux</b> de l'administration. Les clients peuvent aussi en créer depuis la page publique « Listes de cadeaux ».",
    "Un cadeau n'est compté « offert » qu'au paiement de la commande. Les produits personnalisables (gravure) sont exclus des listes.",
  ].map(li).join("")}</ul>
  <h2 class="sd-h2">4. Gravure, conseil, comparaison, avis, souhaits</h2><ul class="sd-ul">${[
    "<b>Gravure</b> : dans la fiche du produit, activez la personnalisation (libellé, aide, longueur maximale, obligatoire). Le prix ne change pas.",
    "<b>Rendez-vous</b> : onglet Rendez-vous, définissez les types (conseil de table, essayage de liste), les disponibilités et les délais.",
    "<b>Comparateur</b> : renseignez les caractéristiques de chaque produit (diamètre, matière, contenance, lave-vaisselle). Le tableau n'affiche que ce que vous avez saisi.",
    "<b>Avis vérifiés</b> : seuls les clients ayant payé le produit peuvent donner un avis, que vous modérez dans l'onglet Avis. Aucun avis n'est écrit par le thème.",
    "<b>Souhaits</b> : le client garde ses envies par navigateur ou par compte, sur la page « Mes souhaits ».",
  ].map(li).join("")}</ul>
  <h2 class="sd-h2">5. Les réglages du thème</h2><p>Dans Apparence, vous changez l'émail (céladon, bleu de Sèvres, rose, noir), le fond, les titres, le reflet animé, le double filet des assiettes, le format des images et le bandeau d'annonce.</p>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une pièce, une liste, une commande."),
  { type: "form", heading: "Écrire à la maison", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une pièce", "Une assiette, un verre, une matière."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="sd-ph pk-bleed"><div class="sd-wrap sd-narrow"><p class="sd-lab">Page introuvable</p><div class="sd-h1 sd-h1--xl" role="heading" aria-level="1">Assiette ébréchée</div><p class="sd-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "service-dresse", name: "Service Dressé", version: "1.0.0", category: "luxe", tags: ["luxe", "classique", "editorial"], siteType: "Art de la table : porcelaine, cristal, couverts et linge", featured: false,
  concept: "La lumière sur la table : des assiettes rondes à double filet, un reflet qui glisse sur la porcelaine et un composeur de service qui calcule le total en direct à partir des vrais prix.",
  description: "Art de la table : fond porcelaine, émail céladon, filet champagne. Composeur de service avec total en direct calculé sur les vrais prix, ajout au panier ligne par ligne, liste de mariage, gravure.",
  brand: "Service Dressé", modules: ["formulaires", "recherche", "commerce"], shop: { card: "assiette-ronde-double-filet-legende-centree", gallery: "image-ronde-large-reflet", cart: "page-dediee-porcelaine", catalog: "filtres-en-bandeau-sous-filet-champagne" },
  dna: {
    header: "monogramme-centre-menu-scinde-en-deux-et-filet-de-lumiere", hero: "assiette-vue-de-dessus-avec-reflet-qui-glisse", grid: "quatre-assiettes-rondes-double-filet-legende-centree", typo: "cormorant-upright+mukta", shapes: "cercle-double-filet-emaille-et-bord-champagne",
    motion: "reflet-diagonal-sur-la-porcelaine", rhythm: "chapitres-de-table-en-trois-temps", signature: "composeur-de-service-avec-total-en-direct",
    palette: "porcelaine-encre-bleu-nuit-email-celadon-et-filet-champagne", image: "mises-en-table-svg-vues-de-dessus-et-vignettes-rondes", list: "lignes-de-service-pieces-par-convive-et-total",
    article: "page-pas-a-pas-numerotee-avec-mentions-a-savoir", sidebar: "aucune-recapitulatif-du-service-en-bas-de-composeur", reading: "colonne-de-64-caracteres-corps-17-px-titres-droits-fins",
  },
  tokens: {
    colors: { primary: "#3b6b62", secondary: "#1d2230", accent: "#b8985a", background: "#f4f2ed", surface: "#fbfaf7", text: "#1d2230", muted: "#5d6272", success: "#2f6f4f", warning: "#8a6a12", error: "#a82a2a" },
    fonts: { heading: "font.cormorant-upright", body: "font.mukta", button: "font.mukta", link: "font.mukta" },
    radius: { sm: 2, md: 4, lg: 999, button: 2, field: 2, card: 0 }, shadow: { card: "0 10px 30px rgba(29,34,48,.12)", button: "none" }, border: { width: 1, color: "#ddd8cc" },
    type: { h1: { size: 62, weight: 500, lineHeight: 1.02, transform: "none" }, h2: { size: 36, weight: 500, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur du filet (champagne)", type: "color", default: "#b8985a" },
    { key: "email", label: "Émail des assiettes", type: "choice", default: "celadon", choices: [["celadon", "Céladon"], ["sevres", "Bleu de Sèvres"], ["rose", "Rose poudré"], ["noir", "Noir et or"]] },
    { key: "fond", label: "Fond", type: "choice", default: "porcelaine", choices: [["porcelaine", "Porcelaine"], ["perle", "Perle grise"], ["blanc", "Blanc"]] },
    { key: "titres", label: "Titres", type: "choice", default: "droit", choices: [["droit", "Droits fins"], ["italique", "Italique"]] },
    { key: "reflet", label: "Reflet sur la porcelaine", type: "choice", default: "on", choices: [["on", "Animé"], ["off", "Fixe"]] },
    { key: "filet", label: "Filet des assiettes", type: "choice", default: "double", choices: [["double", "Double filet"], ["simple", "Filet simple"], ["aucun", "Sans filet"]] },
    { key: "format", label: "Format des images de produits", type: "choice", default: "rond", choices: [["rond", "Rond"], ["carre", "Carré"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Composer", "/composer"], ["Mariage", "/mariage"], ["Entretien", "/entretien"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "composer", name: "Composer un service", render: composer }, { key: "mariage", name: "Liste de mariage", render: mariage },
    { key: "conseil", name: "Gravure et conseil", render: conseil }, { key: "entretien", name: "Entretien", render: entretien }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "configurer", name: "Comment configurer", render: configurer }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
