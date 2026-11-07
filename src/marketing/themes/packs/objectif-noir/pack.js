// Objectif Noir — matériel photo et vidéo. Direction artistique : noir mat d'atelier optique, repères de cadrage aux angles, anneaux concentriques d'objectif, texte technique en chasse fixe.
// Composants signature : (1) le COMPARATEUR DE SPÉCIFICATIONS — le thème consomme la brique « comparateur » du moteur (/boutique/comparer, bouton « Comparer ce produit » des fiches,
// caractéristiques libellé/valeur saisies dans l'admin) ; il ne la réimplémente pas ; (2) les KITS COMPATIBLES — des liens vers les vraies étiquettes de compatibilité (monture-rf, monture-e…).
// Le moteur n'a PAS de produits groupés ni de coffrets : un « kit » est ici une sélection par compatibilité, chaque article se met au panier séparément.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const lens = (cls = "on-lens") => `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="60" cy="60" r="28" fill="none" stroke="currentColor" stroke-width="5"/><circle class="on-lens-c" cx="60" cy="60" r="12" fill="currentColor"/><path d="M60 4v12M60 104v12M4 60h12M104 60h12" stroke="currentColor" stroke-width="1.4"/></svg>`;
const MONTURES = [["RF", "monture-rf", "Boîtiers et objectifs à monture RF"], ["E", "monture-e", "Boîtiers et objectifs à monture E"], ["Z", "monture-z", "Boîtiers et objectifs à monture Z"]];
const USAGES = [["Vidéo", "video"], ["Lumière", "lumiere"], ["Stockage", "stockage"], ["Batteries", "batterie"], ["Supports", "support"], ["Sacs", "sac"]];

const header = (c) => `<header class="on-head pk-bleed"><div class="on-strip">Le prix affiché est le prix payé · Livraison calculée à la commande</div>
  <div class="on-bar"><a class="on-logo" href="/" aria-label="Objectif Noir, accueil">${lens("on-logo-l")}<span class="on-logo-t"><b>Objectif Noir</b><i>photo · vidéo</i></span></a>
  <div class="on-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="on-act" role="navigation" aria-label="Boutique"><a href="/boutique/comparer">Comparer</a><a href="/boutique/compte">Compte</a><a class="on-cart" href="/boutique/panier">Panier</a></div></div>
  <div class="on-mount"><div class="on-wrap on-mount-in" role="navigation" aria-label="Choisir sa monture"><span class="on-mono">Ma monture</span>${MONTURES.map((m) => `<a href="/boutique/etiquette/${m[1]}">${esc(m[0])}</a>`).join("")}</div></div></header>`;
const footer = (c) => `<footer class="on-foot pk-bleed"><div class="on-wrap on-foot-g">
  <div><p class="on-lab">Objectif Noir</p><p class="on-small">Matériel photo et vidéo. Chaque fiche renvoie vers des accessoires compatibles par étiquette, jamais par supposition.</p></div>
  <div><p class="on-lab">Boutique</p><p class="on-fl"><a href="/boutique">Tout le matériel</a><a href="/boutique/comparer">Comparer des produits</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="on-lab">Informations</p><p class="on-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/configurer">Comment configurer</a></p></div>
  <div><p class="on-lab">Monture</p><p class="on-fl">${MONTURES.map((m) => `<a href="/boutique/etiquette/${m[1]}">Compatibles ${esc(m[0])}</a>`).join("")}</p></div></div>
  <p class="on-copy">© Objectif Noir — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="on-ph pk-bleed"><div class="on-wrap"><p class="on-lab">${esc(kicker)}</p><div class="on-h1" role="heading" aria-level="1">${esc(title)}</div><p class="on-lead">${esc(lead)}</p></div></section>`);

/* ---- Signature 1 : comparateur de spécifications (consomme la brique du moteur) ---- */
const SPECS = [["Capteur", "type et taille"], ["Résolution", "en mégapixels"], ["Monture", "RF, E, Z…"], ["Stabilisation", "capteur ou objectif"], ["Vidéo maximale", "définition et cadence"], ["Ouverture maximale", "f/1,4, f/2,8…"], ["Poids", "en grammes, batterie comprise"], ["Autonomie", "selon la norme du fabricant"]];
const comparateur = () => `<section class="on-cmp pk-bleed"><div class="on-wrap"><p class="on-lab">Comparateur de spécifications</p><h2 class="on-h2">Quatre produits, une seule lecture</h2>
  <p class="on-lead">Sur chaque fiche, le bouton « Comparer ce produit » ajoute l'article à la comparaison (quatre au maximum). Le tableau met en évidence, en texte et en couleur, les lignes où les valeurs diffèrent.</p>
  <div class="on-cmp-g"><ol class="on-steps"><li><b>Choisir</b>Ouvrez une fiche et ajoutez-la à la comparaison. Rien n'est enregistré sur un compte : la liste reste dans votre navigateur.</li><li><b>Lire</b>Les lignes marquées « Différence » sont celles qui comptent. Le prix, la disponibilité et les variantes sont comparés aussi.</li><li><b>Décider</b>Retirez un modèle en un clic, ou videz la liste. Puis ajoutez le choix retenu au panier depuis sa fiche.</li></ol>
  <div class="on-sheet"><p class="on-mono">Modèle de fiche de caractéristiques</p><ul class="on-spec">${SPECS.map((s) => `<li><span>${esc(s[0])}</span><i>${esc(s[1])}</i></li>`).join("")}</ul><p class="on-small">Ces libellés sont une suggestion : le vendeur les saisit produit par produit dans l'admin. Un libellé commun à plusieurs produits devient une ligne du tableau.</p></div></div>
  <p><a class="on-btn" href="/boutique/comparer">Ouvrir la comparaison</a> <a class="on-link" href="/boutique">Choisir des produits</a></p></div></section>`;

/* ---- Signature 2 : kits compatibles par étiquette ---- */
const kits = (titre = "Un kit par monture") => `<section class="on-kits pk-bleed"><div class="on-wrap"><p class="on-lab">Kits compatibles</p><h2 class="on-h2">${esc(titre)}</h2>
  <p class="on-lead">Un kit est une sélection : tout ce qui porte l'étiquette de compatibilité de votre monture. Il ne s'agit pas d'un coffret au prix groupé : chaque article se choisit et se paie séparément.</p>
  <div class="on-kit-g">${MONTURES.map((m, i) => `<a class="on-kit" href="/boutique/etiquette/${m[1]}"><span class="on-kit-n">0${i + 1}</span><b>Monture ${esc(m[0])}</b><span>${esc(m[2])}, avec leurs accessoires étiquetés.</span><i class="on-kit-go">Voir la sélection</i></a>`).join("")}</div>
  <p class="on-lab on-lab--s">Compléter un équipement</p><div class="on-tags" role="navigation" aria-label="Accessoires par usage">${USAGES.map((u) => `<a href="/boutique/etiquette/${u[1]}">${esc(u[0])}</a>`).join("")}</div></div></section>`;

const home = (c) => [sec(header(c)),
  sec(`<section class="on-hero pk-bleed"><div class="on-wrap on-hero-in"><div class="on-hero-t"><p class="on-lab">Matériel photo et vidéo</p><div class="on-h1 on-h1--xl" role="heading" aria-level="1">La précision<br>avant tout</div><p class="on-lead">Boîtiers, objectifs, stabilisateurs, lumière : comparez les caractéristiques côte à côte et composez un équipement compatible avec votre monture.</p><p><a class="on-btn" href="/boutique">Voir le matériel</a> <a class="on-link" href="/comparateur">Comparer les modèles</a></p></div>
    <div class="on-reticle" aria-hidden="true"><span class="on-rg"></span>${lens("on-hero-l")}<i class="on-cn on-cn--a"></i><i class="on-cn on-cn--b"></i><i class="on-cn on-cn--c"></i><i class="on-cn on-cn--d"></i></div></div></section>`),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap"><p class="on-lab">En vedette</p><h2 class="on-h2">Matériel à la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 4, columns: "4", orderby: "featured", ratio: "4/3" })),
  sec(comparateur()),
  sec(kits()),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap"><p class="on-lab">Promotions</p><h2 class="on-h2">Prix réduits</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 4, columns: "4", orderby: "newest", ratio: "4/3" })),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap"><p class="on-lab">Nos engagements</p><ul class="on-vals"><li><b>Chiffres lisibles</b>Les caractéristiques sont données telles que le vendeur les renseigne, avec leur unité.</li><li><b>Compatibilité vérifiable</b>Les étiquettes de monture sont posées produit par produit, pas déduites.</li><li><b>Honnêteté</b>Pas de fausse urgence, pas de compte à rebours, pas de stock inventé.</li></ul></div></section>`),
  sec(footer(c))];

const comparateurPage = (c) => [sec(header(c)), head("Comparateur", "Comparer des spécifications", "Jusqu'à quatre produits dans un tableau lisible."), sec(comparateur()),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap on-prose"><h2 class="on-h2">Pour les développeurs et les vendeurs</h2><p>Le tableau est fourni par le moteur de la boutique, à l'adresse <a href="/boutique/comparer">/boutique/comparer</a>. Une version lisible par machine existe à l'adresse /boutique/comparer.json. Le thème ne fait que l'habiller.</p></div></section>`), sec(footer(c))];
const kitsPage = (c) => [sec(header(c)), head("Kits compatibles", "Composer un équipement", "Par monture, par usage, sans supposition."), sec(kits("Choisir une monture")),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap on-prose"><h2 class="on-h2">Comment ça marche</h2><p>Chaque produit du catalogue peut porter des étiquettes, par exemple monture-rf. Un clic sur une monture ouvre le vrai catalogue filtré par cette étiquette. Les produits à variantes de monture indiquent le choix à la fiche.</p><h2 class="on-h2">Ce que ce n'est pas</h2><p>Le moteur ne propose pas de coffret ni de prix groupé : ajoutez chaque article au panier séparément. Aucune remise « kit » n'est calculée.</p></div></section>`), sec(footer(c))];
const LEX = [["Ouverture (f/)", "Plus le nombre est petit, plus l'objectif laisse entrer de lumière et floute l'arrière-plan."], ["Focale (mm)", "Petite : grand champ. Grande : sujet rapproché. Le format du capteur modifie le champ réel."], ["Monture", "Le raccord entre boîtier et objectif. Elle doit correspondre, ou passer par une bague adaptatrice."], ["Plein format / APS-C", "Deux tailles de capteur. Un objectif plein format fonctionne sur APS-C, avec un champ plus étroit."], ["ISO", "La sensibilité. Plus elle monte, plus le bruit d'image augmente."], ["Stabilisation", "Compense les petits mouvements, dans le capteur, l'objectif ou les deux."]];
const lexique = (c) => [sec(header(c)), head("Lexique", "Lire une fiche technique", "Six termes pour comparer sans se tromper."),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap"><div class="on-lex">${LEX.map((l, i) => `<details class="on-fiche"${i === 0 ? " open" : ""}><summary><span class="on-fiche-n" aria-hidden="true">0${i + 1}</span><span class="on-fiche-t">${esc(l[0])}</span></summary><p>${esc(l[1])}</p></details>`).join("")}</div></div></section>`), sec(footer(c))];
const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer ce thème", "Le thème habille les fonctions de la boutique : le vendeur les règle dans l'admin."),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap on-prose"><h2 class="on-h2">Le comparateur</h2><p>Dans l'admin, ouvrez un produit et remplissez le champ « Caractéristiques » : une ligne par caractéristique, au format « Libellé: valeur » (par exemple « Poids: 650 g »), vingt au maximum. Utilisez les mêmes libellés d'un produit à l'autre : c'est ce qui crée les lignes communes du tableau. Les visiteurs comparent jusqu'à quatre produits depuis le bouton de la fiche.</p>
    <h2 class="on-h2">Les kits compatibles</h2><p>Ajoutez aux produits des étiquettes de compatibilité : monture-rf, monture-e, monture-z, ainsi que des étiquettes d'usage (video, lumiere, stockage, batterie, support, sac). Les cartes de ce thème renvoient vers ces étiquettes ; si une étiquette n'existe sur aucun produit, la sélection est vide. Le moteur ne gère pas de coffrets ni de prix groupés.</p>
    <h2 class="on-h2">Variantes et promotions</h2><p>Une monture au choix se crée avec un attribut « Monture » sur le produit. Une promotion se saisit avec un prix soldé : les grilles l'affichent à partir des données réelles.</p>
    <h2 class="on-h2">Autres briques</h2><p>Avis vérifiés, liste de souhaits et rendez-vous se règlent dans leurs onglets d'admin respectifs ; ils fonctionnent avec ce thème sans réglage supplémentaire.</p></div></section>`), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap on-prose"><h2 class="on-h2">Livraison</h2><p>Les frais et délais sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Le matériel optique voyage calé individuellement.</p><h2 class="on-h2">Retours</h2><p>Écrivez-nous depuis la page <a href="/contact">contact</a> pour organiser un retour : les conditions applicables sont celles affichées par la boutique à la commande.</p><h2 class="on-h2">Paiement</h2><p>Le paiement se fait sur la page de commande, avec les moyens activés par la boutique.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Montures, bagues, compatibilité."),
  sec(`<section class="on-sec pk-bleed"><div class="on-wrap"><details class="on-q"><summary>Comment savoir si un objectif va sur mon boîtier ?</summary><p>Regardez l'étiquette de monture de la fiche (monture-rf, monture-e, monture-z) ou la variante « Monture ». En cas de doute, écrivez-nous depuis la page <a href="/contact">contact</a>.</p></details><details class="on-q"><summary>Que signifie « Différence » dans le comparateur ?</summary><p>La ligne n'a pas la même valeur selon les produits comparés. Les lignes identiques ne sont pas marquées.</p></details><details class="on-q"><summary>Les kits ont-ils un prix groupé ?</summary><p>Non. Un kit est une sélection par compatibilité ; chaque article a son propre prix.</p></details><details class="on-q"><summary>Où voir les définitions techniques ?</summary><p>Sur la page <a href="/lexique">Lexique</a>.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question de compatibilité ? Indiquez votre boîtier."), { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher du matériel", "Un modèle, une focale, une monture."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un produit…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="on-ph pk-bleed"><div class="on-wrap"><p class="on-lab">Page introuvable</p><div class="on-h1 on-h1--xl" role="heading" aria-level="1">Hors champ</div><p class="on-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner au matériel</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "objectif-noir", name: "Objectif Noir", version: "1.0.0", category: "ecommerce", tags: ["technique", "sombre", "moderne"], siteType: "Boutique de matériel photo et vidéo", featured: false,
  concept: "Un atelier optique noir mat : repères de cadrage, anneaux d'objectif, texte de fiche technique, avec un comparateur de spécifications et des kits compatibles par monture.",
  description: "Matériel photo et vidéo : noir mat, repères de cadrage, texte technique en chasse fixe, comparateur de spécifications du moteur et kits compatibles reliés aux étiquettes de monture. Pas de coffrets groupés.",
  brand: "Objectif Noir", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "fiche-technique-a-reperes-de-coin", gallery: "visuel-large-et-rail-de-vignettes", cart: "page-dediee-noir-mat-tableau", catalog: "barre-de-monture-et-filtres-en-bandeau" },
  dna: {
    header: "bandeau-de-monture-sous-barre-numerotee", hero: "reticule-d-objectif-et-anneaux-concentriques", grid: "quatre-colonnes-fiches-a-reperes-de-coin", motion: "mise-au-point-des-anneaux-et-reticule-qui-suit",
    shapes: "cercles-concentriques-et-reperes-de-cadrage", rhythm: "bandes-mesurees-separees-par-filets-techniques", signature: "comparateur-de-specifications-et-kits-par-monture",
    palette: "noir-mat-gris-optique-et-rouge-repere", image: "objectifs-dessines-en-svg-sans-photo",
    list: "cartes-numerotees-de-monture-et-etiquettes-d-usage", article: "fiche-technique-en-colonne-avec-liste-libelle-valeur", sidebar: "aucune-colonne-laterale-les-fiches-depliantes-font-office-de-marge",
    reading: "gris-clair-sur-noir-mat-16-px-interligne-1-65-colonne-de-66-caracteres",
  },
  tokens: {
    colors: { primary: "#ff5a36", secondary: "#0e0f10", accent: "#d9d6cc", background: "#0e0f10", surface: "#17191b", text: "#ecebe7", muted: "#a3a29d", success: "#7fd19a", warning: "#ffb454", error: "#ff7a68" },
    fonts: { heading: "font.azeret-mono", body: "font.instrument-sans", button: "font.azeret-mono", link: "font.instrument-sans" },
    radius: { sm: 2, md: 2, lg: 2, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2c2f32" },
    type: { h1: { size: 60, weight: 500, lineHeight: 1.04, transform: "none" }, h2: { size: 30, weight: 500, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur du repère", type: "color", default: "#ff5a36" },
    { key: "fond", label: "Fond", type: "choice", default: "mat", choices: [["mat", "Noir mat"], ["graphite", "Graphite"], ["encre", "Bleu encre"]] },
    { key: "reperes", label: "Repères de cadrage aux angles", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "quadrillage", label: "Quadrillage de mise au point", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "anneaux", label: "Anneaux de l'accueil", type: "choice", default: "on", choices: [["on", "Se resserrent et suivent le curseur"], ["off", "Fixes"]] },
    { key: "titres", label: "Titres", type: "choice", default: "normale", choices: [["normale", "Casse normale"], ["capitales", "Capitales espacées"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "monture", label: "Barre de monture", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "contraste", label: "Contraste des filets", type: "choice", default: "normal", choices: [["normal", "Normal"], ["fort", "Renforcé"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Comparateur", "/comparateur"], ["Kits", "/kits"], ["Lexique", "/lexique"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "comparateur", name: "Comparateur", render: comparateurPage }, { key: "kits", name: "Kits compatibles", render: kitsPage },
    { key: "lexique", name: "Lexique technique", render: lexique }, { key: "configurer", name: "Comment configurer", render: configurer }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
