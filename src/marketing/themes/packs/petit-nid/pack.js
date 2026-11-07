// Petit Nid — puériculture et liste de naissance. Direction artistique : la tendresse maîtrisée. Un lait d'amande, quatre pastels (rose poudré, bleu layette, menthe, beurre) toujours posés
// sous une encre bleu-nuit pour rester lisibles ; des ARCHES de chambre d'enfant (cartes, fenêtre du héros), des festons entre les bandes, un mobile suspendu qui se balance doucement.
// Composant signature : la LISTE DE NAISSANCE PARTAGEABLE. Le thème ne la réimplémente pas : il consomme la brique « listes de cadeaux » du moteur (/boutique/listes, /boutique/liste/<jeton>) et
// l'explique honnêtement — « offert » compté au paiement, lien secret, adresse du bénéficiaire jamais affichée. Le guide « Que mettre sur sa liste » relie chaque étape à de vraies catégories et étiquettes.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  nest: `<svg class="pn-nest" viewBox="0 0 48 48" aria-hidden="true"><path class="pn-n1" d="M6 40V24a18 18 0 0 1 36 0v16z"/><path class="pn-n2" d="M13 40V25a11 11 0 0 1 22 0v15z"/><circle class="pn-n3" cx="24" cy="31" r="4"/></svg>`,
};
/* Fenêtre en arche avec mobile suspendu (SVG sans texte). Les couleurs et le balancement viennent du CSS du thème. */
const mobile = () => `<svg class="pn-arch-svg" viewBox="0 0 400 460" role="img" aria-label="Illustration d'une fenêtre en arche avec un mobile de nuage, de lune et d'étoile suspendu">
  <path class="pn-win" d="M30 450V190a170 170 0 0 1 340 0v260z"/><path class="pn-win2" d="M62 450V192a138 138 0 0 1 276 0v258z"/>
  <path class="pn-rod" d="M110 92h180"/><path class="pn-rod" d="M200 92V70"/><circle class="pn-knob" cx="200" cy="64" r="8"/>
  <g class="pn-sw pn-sw1"><path class="pn-str" d="M128 92v78"/><path class="pn-cloud" d="M104 206a16 16 0 0 1 4-31 22 22 0 0 1 42-4 18 18 0 0 1 8 35z"/></g>
  <g class="pn-sw pn-sw2"><path class="pn-str" d="M200 92v112"/><path class="pn-moon" d="M214 204a34 34 0 1 1-22-40 28 28 0 0 0 22 40z"/></g>
  <g class="pn-sw pn-sw3"><path class="pn-str" d="M272 92v70"/><path class="pn-star" d="M272 160l9 20 21 3-16 14 5 21-19-11-19 11 5-21-16-14 21-3z"/></g>
  <path class="pn-floor" d="M0 450c60-26 120-30 200-30s140 4 200 30z"/><ellipse class="pn-egg" cx="150" cy="430" rx="22" ry="16"/><ellipse class="pn-egg pn-egg2" cx="204" cy="436" rx="20" ry="14"/></svg>`;
const scallop = (cls) => `<div class="pn-sc ${cls}" aria-hidden="true"></div>`;

const header = (c) => `<header class="pn-head pk-bleed"><div class="pn-bar"><a class="pn-logo" href="/" aria-label="Petit Nid, accueil">${ICON.nest}<span>Petit Nid</span></a>
  <div class="pn-nav" role="navigation" aria-label="Navigation principale">${c.menu.filter((m) => !["/", "/creer-ma-liste", "/faq"].includes(m.url)).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="pn-act"><a class="pn-ribbon" href="/creer-ma-liste">Ma liste de naissance</a><a class="pn-ic" href="/boutique/souhaits" aria-label="Mes souhaits">${ICON.heart}</a><a class="pn-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="pn-ic pn-ic--cart" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = () => `<footer class="pn-foot pk-bleed">${scallop("pn-sc--foot")}<div class="pn-wrap pn-foot-g">
  <div>${ICON.nest}<p class="pn-big">Petit Nid</p><p class="pn-small">Boutique de puériculture : sommeil, repas, bain, promenade, vêtements de naissance et éveil. Boutique de démonstration du thème.</p></div>
  <div><p class="pn-lab">Boutique</p><p class="pn-fl"><a href="/boutique">Tous les produits</a><a href="/boutique/comparer">Comparer des produits</a><a href="/boutique/souhaits">Mes souhaits</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="pn-lab">Liste de naissance</p><p class="pn-fl"><a href="/creer-ma-liste">Créer ma liste</a><a href="/guide-liste">Que mettre sur sa liste</a><a href="/comment-ca-marche">Comment ça marche</a><a href="/boutique/listes">Mes listes</a></p></div>
  <div><p class="pn-lab">Aide</p><p class="pn-fl"><a href="/livraison">Livraison et retours</a><a href="/faq">Questions fréquentes</a><a href="/contact">Contact</a><a href="/configurer">Pour le vendeur</a></p></div></div>
  <p class="pn-copy">© Petit Nid — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="pn-ph pk-bleed"><div class="pn-wrap pn-narrow"><p class="pn-lab">${esc(kicker)}</p><div class="pn-h1" role="heading" aria-level="1">${esc(title)}</div><p class="pn-lead">${esc(lead)}</p></div>${scallop("pn-sc--ph")}</section>`);

/* Étapes du guide : chaque lien est une vraie catégorie (/boutique/categorie/<slug>) ou étiquette (/boutique/etiquette/<étiquette>) du catalogue de démonstration (demo.js). */
const ETAPES = [
  ["Avant l'arrivée", "Préparer la chambre", "Un endroit calme pour dormir : lit, matelas, linge de lit, une petite lumière. Ce sont les achats les plus gros : une liste de naissance sert surtout à les partager.", [["Chambre et sommeil", "/boutique/categorie/chambre-et-sommeil"], ["Les essentiels", "/boutique/etiquette/essentiel"]]],
  ["Les premiers jours", "Vêtements et soins de naissance", "Bodies, pyjamas, langes, de quoi laver et changer. Choisissez surtout les tailles naissance et un mois : un bébé change de taille très vite.", [["Vêtements de naissance", "/boutique/categorie/vetements-naissance"], ["Bain et soins", "/boutique/categorie/bain-et-soins"], ["Tout pour la naissance", "/boutique/etiquette/naissance"]]],
  ["Les repas", "Biberons et premiers repas", "Biberons, bavoirs, puis assiette et cuillères pour plus tard. Pour tout ce qui touche à l'alimentation, suivez l'avis de votre pédiatre ou de votre sage-femme.", [["Repas", "/boutique/categorie/repas"]]],
  ["Sortir", "Poussette, portage et sac", "Le plus gros budget après le sommeil. Comparez les modèles côte à côte avant de les mettre sur la liste.", [["Promenade et voyage", "/boutique/categorie/promenade-et-voyage"], ["Comparer des produits", "/boutique/comparer"]]],
  ["Vers trois mois", "Éveil et premiers jouets", "Hochet, tapis, livre en tissu, doudou : de petits cadeaux faciles à offrir par plusieurs proches.", [["Éveil et doudous", "/boutique/categorie/eveil-et-doudous"], ["Idées pour trois mois", "/boutique/etiquette/trois-mois"]]],
  ["Vers six mois", "Chaise haute et premiers couverts", "La chaise haute et les premiers couverts arrivent plus tard : vous pouvez les ajouter à la liste après la naissance.", [["Idées pour six mois", "/boutique/etiquette/six-mois"], ["Idées de petits cadeaux", "/boutique/etiquette/idee-cadeau"]]],
];
const etapes = () => `<ol class="pn-stages">${ETAPES.map((e, i) => `<li class="pn-st"><div class="pn-st-n"><span>${i + 1}</span></div><div class="pn-st-b"><p class="pn-kick">${esc(e[0])}</p><h2 class="pn-h3">${esc(e[1])}</h2><p>${esc(e[2])}</p><p class="pn-lk">${e[3].map(([l, u]) => `<a href="${esc(u)}">${esc(l)}</a>`).join("")}</p></div></li>`).join("")}</ol>`;

const quatre = () => sec(`<section class="pn-sec pn-sec--sky pk-bleed"><div class="pn-wrap"><p class="pn-lab">Ma liste de naissance</p><h2 class="pn-h2">Une liste que vos proches peuvent vraiment utiliser</h2>
  <p class="pn-lead">La liste est celle de la boutique, pas une simulation : chaque cadeau passe par le panier et le paiement habituels.</p>
  <ol class="pn-ribbon-steps"><li><b>Créez-la</b>Un titre, un petit mot, une date, votre e-mail pour retrouver la gestion.</li><li><b>Choisissez</b>Ajoutez des articles et la quantité souhaitée pour chacun.</li><li><b>Partagez le lien</b>Un lien secret : seules les personnes à qui vous l'envoyez le voient.</li><li><b>Suivez</b>Souhaités, offerts et restants : un cadeau compte une fois payé.</li></ol>
  <p><a class="pn-btn" href="/creer-ma-liste">Créer ma liste</a> <a class="pn-btn pn-btn--o" href="/comment-ca-marche">Comment ça marche, honnêtement</a></p></div></section>`);

const engagements = () => sec(`<section class="pn-sec pn-sec--mint pk-bleed"><div class="pn-wrap"><p class="pn-lab">Nos règles</p><h2 class="pn-h2">Tendre, mais jamais flou</h2>
  <ul class="pn-trio"><li><b>Offert, c'est payé</b>Un article n'est marqué « offert » qu'une fois la commande payée, et le nombre redescend en cas de remboursement.</li><li><b>Adresse protégée</b>Votre adresse n'est jamais affichée aux invités. Elle n'est transmise qu'à la boutique pour préparer l'envoi.</li><li><b>Prix réels</b>Les prix, promotions et ruptures affichés sont ceux de la boutique. Pas de fausse urgence.</li></ul></div></section>`);

const guideTeaser = () => sec(`<section class="pn-sec pn-sec--butter pk-bleed"><div class="pn-wrap"><p class="pn-lab">Par où commencer</p><h2 class="pn-h2">Que mettre sur sa liste, étape par étape</h2>
  <p class="pn-lead">Six moments, de la chambre aux six mois de bébé, chacun relié à de vrais rayons.</p>
  <p class="pn-lk pn-lk--big">${ETAPES.map((e) => `<a href="/guide-liste">${esc(e[0])}</a>`).join("")}</p><p><a class="pn-btn" href="/guide-liste">Lire le guide</a></p></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="pn-hero pk-bleed"><div class="pn-wrap pn-hero-in"><div><p class="pn-lab">Puériculture et liste de naissance</p><div class="pn-h1 pn-h1--xl" role="heading" aria-level="1">Un nid doux pour l'arrivée de bébé</div><p class="pn-lead">Sommeil, repas, bain, promenade, vêtements de naissance et éveil. Et une liste de naissance à partager, claire pour vous comme pour vos proches.</p><p><a class="pn-btn" href="/creer-ma-liste">Créer ma liste de naissance</a> <a class="pn-btn pn-btn--o" href="/boutique">Voir la boutique</a></p></div>
  <div class="pn-arch">${mobile()}</div></div>${scallop("pn-sc--hero")}</section>`),
  quatre(),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap"><p class="pn-lab">À la une</p><h2 class="pn-h2">Les essentiels du nid</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "4/5" })),
  engagements(),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap"><p class="pn-lab">Petits prix</p><h2 class="pn-h2">Promotions en cours</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 3, columns: "3", orderby: "newest", ratio: "4/5" })),
  guideTeaser(),
  sec(footer(c))];

const creer = (c) => [sec(header(c)), head("Ma liste de naissance", "Créer ma liste", "Un titre, un petit mot, quelques articles, un lien à partager. Le formulaire est celui de la boutique."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-two"><div class="pn-prose"><h2 class="pn-h2">Ce que vous allez remplir</h2>
  <ul class="pn-tick"><li><b>Le titre</b> de la liste, par exemple « Naissance de Léa », et un message d'accueil si vous le souhaitez.</li><li><b>La date</b> prévue ou de naissance (facultative).</li><li><b>Votre e-mail</b> : recommandé, car il sert à vous envoyer l'adresse privée de gestion. Sans e-mail, notez bien cette adresse.</li><li><b>La livraison chez vous</b> : facultative. Votre adresse n'est jamais affichée, seul le vendeur la voit sur la commande.</li></ul>
  <p><a class="pn-btn" href="/boutique/listes">Ouvrir le formulaire de création</a></p>
  <p class="pn-small">Déjà connecté à votre compte ? La liste sera rattachée à votre compte et vous la retrouverez dans « Mes listes ».</p></div>
  <div class="pn-note"><p class="pn-kick">Après la création</p><ol class="pn-num"><li>Vous arrivez sur la page de gestion de la liste. Conservez-la : son adresse est votre accès privé.</li><li>Ajoutez des produits du catalogue avec la quantité souhaitée.</li><li>Copiez le lien à partager et envoyez-le à vos proches.</li><li>Fermez la liste quand vous le souhaitez : plus aucun nouveau cadeau ne peut être ajouté.</li></ol>
  <p class="pn-small">Pas d'idée de produits ? <a href="/guide-liste">Lisez le guide « Que mettre sur sa liste »</a>.</p></div></div></section>`),
  sec(footer(c))];

const guide = (c) => [sec(header(c)), head("Guide", "Que mettre sur sa liste", "Six étapes, de la chambre aux six mois de bébé. Chaque lien ouvre un vrai rayon du catalogue."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow">${etapes()}
  <div class="pn-note"><p class="pn-kick">Bon à savoir</p><p>Ce guide est un repère, pas une règle : chaque famille a ses besoins et ses habitudes. Pour la sécurité d'un produit, suivez toujours la notice et l'âge indiqués par le fabricant. Les produits personnalisables ne peuvent pas être mis sur une liste.</p>
  <p><a class="pn-btn" href="/creer-ma-liste">Créer ma liste</a> <a class="pn-btn pn-btn--o" href="/boutique/souhaits">Voir mes souhaits</a></p></div></div></section>`),
  sec(footer(c))];

const comment = (c) => [sec(header(c)), head("Fonctionnement", "Comment ça marche, honnêtement", "Ce que fait la liste, ce qu'elle ne fait pas, et ce que chacun voit."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow pn-prose">
  <h2 class="pn-h2">Un lien secret, pas un annuaire</h2><p>Chaque liste a une adresse longue et impossible à deviner. Toute personne qui a ce lien peut voir la liste et offrir un article. La boutique ne publie pas d'annuaire des listes : à vous de choisir à qui envoyer le lien. Si le lien est transmis plus loin, d'autres personnes pourront le voir.</p>
  <h2 class="pn-h2">« Offert » se compte au paiement</h2><p>Le tableau de la liste affiche trois nombres : souhaités, offerts et restants. Un cadeau passe en « offert » seulement quand la commande est payée. Un cadeau dans un panier non payé ne change rien, mais les unités d'une commande en attente sont mises de côté : l'article peut alors afficher « Réservé (paiement en cours) ». Si la commande est remboursée, le nombre d'offerts redescend. Il est impossible d'offrir au-delà du nombre restant.</p>
  <h2 class="pn-h2">Votre adresse n'est jamais affichée</h2><p>Si vous proposez la livraison chez vous, l'invité peut choisir de vous faire livrer sans voir l'adresse. Elle n'est visible que du vendeur, sur la commande. Cette option n'existe que si le panier ne contient que des cadeaux d'une seule liste, et les frais de port sont calculés d'après le pays de la liste.</p>
  <h2 class="pn-h2">Un mot et un prénom, si l'invité le souhaite</h2><p>Les invités peuvent laisser un prénom et un petit mot, facultatifs. Vous les voyez dans « Cadeaux reçus » sur votre page de gestion. La liste ne cache donc pas qui a offert quoi à la personne qui la gère.</p>
  <h2 class="pn-h2">Ce qui n'existe pas</h2><p>Ce n'est pas une cagnotte : on offre des articles du catalogue, pas une somme. Les produits personnalisables sont exclus des listes. Rien n'est envoyé aux invités à votre place.</p>
  <h2 class="pn-h2">Retrouver et gérer sa liste</h2><p>La gestion se fait par l'adresse privée reçue à la création, ou depuis « Mes listes » si vous êtes connecté. Vous pouvez modifier les quantités (jamais en dessous du nombre déjà offert), retirer un article qui n'a pas été offert, et fermer ou rouvrir la liste.</p>
  <p><a class="pn-btn" href="/creer-ma-liste">Créer ma liste</a> <a class="pn-btn pn-btn--o" href="/faq">Questions fréquentes</a></p></div></section>`),
  sec(footer(c))];

const CATS = [["Chambre et sommeil", "chambre-et-sommeil"], ["Repas", "repas"], ["Bain et soins", "bain-et-soins"], ["Promenade et voyage", "promenade-et-voyage"], ["Vêtements naissance", "vetements-naissance"], ["Éveil et doudous", "eveil-et-doudous"]];
const TAGS = ["essentiel", "naissance", "trois-mois", "six-mois", "idee-cadeau"];
const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer ce thème", "Le thème met en forme et explique ; c'est vous qui réglez chaque fonction dans l'administration de la boutique."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow pn-prose">
  <h2 class="pn-h2">Les listes de naissance</h2><p>Les listes sont une fonction de la boutique : le thème ne fait que lier et expliquer. Dans l'administration de la boutique, ouvrez l'onglet « Listes cadeaux » pour consulter les listes créées. Vos clients créent leur liste depuis <a href="/boutique/listes">la page des listes</a>. Pour que la livraison chez le bénéficiaire fonctionne, vos méthodes et zones de livraison doivent couvrir le pays de la liste.</p>
  <h2 class="pn-h2">Les rayons et étiquettes du guide</h2><p>Le guide « Que mettre sur sa liste » pointe vers ces catégories et étiquettes. Créez-les avec exactement ces noms (ou modifiez les liens du guide dans l'éditeur de pages) ; un lien vers une catégorie vide affiche un rayon vide.</p>
  <dl class="pn-dl"><div><dt>Catégories</dt><dd>${CATS.map((x) => `<a href="/boutique/categorie/${x[1]}">${esc(x[0])}</a>`).join(" ")}</dd></div><div><dt>Étiquettes</dt><dd>${TAGS.map((t) => `<a href="/boutique/etiquette/${t}">${esc(t)}</a>`).join(" ")}</dd></div></dl>
  <h2 class="pn-h2">Les autres fonctions liées</h2>
  <ul class="pn-tick"><li><b>Comparateur</b> : quatre produits au plus, comparés sur <a href="/boutique/comparer">la page de comparaison</a>. Renseignez les caractéristiques (libellé et valeur) dans la fiche de chaque produit.</li><li><b>Souhaits</b> : <a href="/boutique/souhaits">la page des souhaits</a> est personnelle à chaque visiteur, rien à régler.</li><li><b>Avis vérifiés</b> : onglet « Avis ». Un avis ne vient que d'une commande payée. Vous choisissez de relire avant publication ou de publier directement.</li><li><b>Rendez-vous</b> : onglet « Rendez-vous », par exemple pour un conseil de portage. La page publique est <a href="/boutique/rendez-vous">la page de rendez-vous</a>. Elle n'est utile que si vous y avez défini des types et des disponibilités.</li><li><b>Créneaux de livraison</b> : dans les réglages de livraison, une méthode peut exiger un créneau. Utile surtout pour un envoi à date précise.</li></ul>
  <p>Le contrôle d'âge et l'accès membre sont aussi disponibles dans le moteur, mais n'ont pas de raison d'être dans une boutique de puériculture : ne les activez que si vous en avez besoin.</p>
  <h2 class="pn-h2">Réglages du thème</h2><p>Dans Apparence, vous pouvez changer la couleur d'accent, le fond, la teinte des bandes, les cartes à arche ou droites, les festons, le mobile qui se balance et le ruban « Ma liste de naissance » de l'en-tête.</p></div></section>`),
  sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow pn-prose"><h2 class="pn-h2">Livraison</h2><p>Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Pour un cadeau issu d'une liste de naissance, vous pouvez choisir une livraison chez le bénéficiaire sans voir son adresse, quand la liste le propose.</p><h2 class="pn-h2">Retours</h2><p>Les conditions de retour sont précisées à la commande. Pour un article reçu abîmé ou qui ne convient pas, écrivez-nous depuis la page <a href="/contact">contact</a> avec le numéro de commande.</p><h2 class="pn-h2">Cadeau reçu en double</h2><p>La liste évite les doublons en limitant les cadeaux à la quantité souhaitée. Si cela arrive malgré tout, contactez-nous.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Liste de naissance, commande, livraison."),
  sec(`<section class="pn-sec pk-bleed"><div class="pn-wrap pn-narrow pn-prose"><details class="pn-q"><summary>Les invités voient-ils mon adresse ?</summary><p>Non. Elle n'est jamais affichée. Elle est transmise au vendeur seulement, sur la commande, si l'invité choisit la livraison chez vous.</p></details>
  <details class="pn-q"><summary>Quand un article passe-t-il en « offert » ?</summary><p>Quand la commande du cadeau est payée. Si elle est remboursée, le nombre d'offerts redescend.</p></details>
  <details class="pn-q"><summary>Puis-je modifier ma liste après l'avoir partagée ?</summary><p>Oui, depuis votre page de gestion. Vous ne pouvez pas descendre sous le nombre déjà offert ni retirer un article déjà offert.</p></details>
  <details class="pn-q"><summary>J'ai perdu l'adresse de gestion</summary><p>Si vous étiez connecté à la création, retrouvez la liste dans <a href="/boutique/listes">Mes listes</a>. Sinon, cherchez l'e-mail reçu à la création. Sans l'un ni l'autre, écrivez-nous depuis la page <a href="/contact">contact</a>.</p></details>
  <details class="pn-q"><summary>Comment choisir entre deux modèles ?</summary><p>Utilisez <a href="/boutique/comparer">le comparateur</a> : jusqu'à quatre produits côte à côte, avec les différences signalées.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur un produit ou sur votre liste de naissance."), { type: "form", heading: "Écrire à l'équipe", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un produit", "Un nom, une étape, une idée de cadeau."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un produit…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pn-ph pk-bleed"><div class="pn-wrap pn-narrow"><p class="pn-lab">Page introuvable</p><div class="pn-h1 pn-h1--xl" role="heading" aria-level="1">Le doudou s'est caché</div><p class="pn-lead"><a href="/boutique">Retourner à la boutique</a> ou <a href="/creer-ma-liste">créer ma liste de naissance</a>.</p></div>${scallop("pn-sc--ph")}</section>`), sec(footer(c))];

module.exports = {
  key: "petit-nid", name: "Petit Nid", version: "1.0.0", category: "ecommerce", tags: ["chaleureux", "ludique", "naturel"], siteType: "Puériculture et liste de naissance", featured: false,
  concept: "Une boutique de puériculture tendre et rassurante : pastels maîtrisés sous une encre lisible, arches de chambre d'enfant, mobile qui se balance, et une liste de naissance partageable expliquée honnêtement.",
  description: "Puériculture : lait d'amande et pastels sous encre bleu-nuit, cartes et fenêtre en arche, mobile suspendu, guide « que mettre sur sa liste » relié aux vrais rayons, liste de naissance partageable (lien secret, offert compté au paiement).",
  brand: "Petit Nid", modules: ["formulaires", "recherche", "commerce"], shop: { card: "arche-prix-sous-le-nom", gallery: "medaillon-en-arche-et-infos-collantes", cart: "page-dediee-douce-total-en-evidence", catalog: "rayons-en-pastilles-pastel-et-filtres" },
  dna: {
    header: "barre-claire-avec-ruban-liste-de-naissance", hero: "fenetre-en-arche-avec-mobile-suspendu", grid: "trois-colonnes-cartes-a-sommet-en-arche", typo: "fraunces+atkinson-hyperlegible",
    shapes: "arches-de-chambre-d-enfant-et-festons", motion: "mobile-qui-se-balance-comme-un-pendule", rhythm: "bandes-pastel-festonnees-en-alternance", signature: "liste-de-naissance-partageable-guide-par-etapes",
    palette: "lait-d-amande-rose-poudre-bleu-layette-menthe-beurre-sous-encre-bleu-nuit", image: "fenetre-en-arche-svg-sans-photo", list: "cartes-en-arche-prix-sous-le-nom",
    article: "etapes-numerotees-sur-fil-de-ruban", sidebar: "aucune-encart-bon-a-savoir-en-pastel", reading: "atkinson-17-px-mesure-60-caracteres",
  },
  tokens: {
    colors: { primary: "#a14566", secondary: "#2e3a4f", accent: "#2f6590", background: "#fdf8f2", surface: "#ffffff", text: "#2e3a4f", muted: "#4f5a6e", success: "#1f7550", warning: "#8a5a00", error: "#b3322b" },
    fonts: { heading: "font.fraunces", body: "font.atkinson-hyperlegible", button: "font.atkinson-hyperlegible", link: "font.atkinson-hyperlegible" },
    radius: { sm: 10, md: 18, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "0 6px 18px rgba(46,58,79,.08)", button: "none" }, border: { width: 1, color: "#e6dccf" },
    type: { h1: { size: 54, weight: 600, lineHeight: 1.08, transform: "none" }, h2: { size: 34, weight: 600, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur des boutons et du ruban", type: "color", default: "#a14566" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "amande", choices: [["amande", "Lait d'amande"], ["rose", "Rose très pâle"], ["ciel", "Bleu très pâle"]] },
    { key: "bandes", label: "Teintes des bandes", type: "choice", default: "tendres", choices: [["tendres", "Rose, ciel, menthe, beurre"], ["rose", "Roses et beurre"], ["ciel", "Ciel et menthe"]] },
    { key: "arches", label: "Cartes produit", type: "choice", default: "arche", choices: [["arche", "À sommet en arche"], ["droites", "Droites, angles adoucis"]] },
    { key: "festons", label: "Festons entre les bandes", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "mobile", label: "Mobile qui se balance", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Immobile"]] },
    { key: "ruban", label: "Ruban « Ma liste de naissance » dans l'en-tête", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "apparition", label: "Apparition douce des étapes du guide", type: "choice", default: "on", choices: [["on", "Activée"], ["off", "Désactivée"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Ma liste de naissance", "/creer-ma-liste"], ["Que mettre sur sa liste", "/guide-liste"], ["Comment ça marche", "/comment-ca-marche"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "creer-ma-liste", name: "Créer ma liste", render: creer }, { key: "guide-liste", name: "Que mettre sur sa liste", render: guide },
    { key: "comment-ca-marche", name: "Comment ça marche", render: comment }, { key: "configurer", name: "Comment configurer (vendeur)", render: configurer },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
