// Produit unique — boutique mono-produit. Direction artistique : la page de vente EST l'accueil. Papier chaud, bleu nuit et safran brûlé, étiquettes à coins coupés, alvéoles de ruche dessinées en SVG.
// Composant signature : la PAGE PRODUIT LONGUE EN STORYTELLING — chapitres numérotés qui défilent (problème, solution, fabrication, preuves, questions) avec un rail collant, puis les OFFRES EN LOTS.
// Les « lots » ne sont PAS des coffrets (le moteur n'a pas de produit groupé) : ce sont de vraies VARIANTES du produit vedette (Lot de 1 / Lot de 2 / Lot de 3), chacune avec son prix et son stock réglés dans l'admin.
// Le produit vedette est le premier produit « mis en avant » : la grille « shopgrid » de l'accueil est le vrai widget (prix, promotion, stock réels) et son lien mène à la vraie fiche.
// Les preuves sont des cartes ÉDITABLES, marquées « exemple à remplacer » : aucun avis, aucune note, aucun chiffre n'est inventé.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
const cells = (cls = "pu-cell") => `<svg class="${cls}" viewBox="0 0 120 104" aria-hidden="true"><polygon points="${hex(34, 30, 26)}" fill="currentColor"/><polygon points="${hex(80, 30, 26)}" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="${hex(57, 70, 26)}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const jar = (cls = "") => `<svg class="pu-jar ${cls}" viewBox="0 0 240 290" role="img" aria-label="Illustration d'un pot de miel">
  <rect class="pu-j-lid" x="62" y="14" width="116" height="40" rx="8"/><rect class="pu-j-lid2" x="56" y="44" width="128" height="14" rx="5"/>
  <path class="pu-j-glass" d="M60 62h120c14 20 22 46 22 76v92c0 30-18 46-44 46H82c-26 0-44-16-44-46v-92c0-30 8-56 22-76z"/>
  <path class="pu-j-honey" d="M44 118h152v112c0 26-16 40-40 40H84c-24 0-40-14-40-40z"/>
  <path class="pu-j-drip" d="M98 62c0 22 2 30 10 30s10-8 10-30z"/>
  <path class="pu-j-label" d="M64 140h112l8 10v64l-8 10H64l-8-10v-64z"/>
  <polygon class="pu-j-hex" points="${hex(120, 182, 24)}"/><polygon class="pu-j-hex2" points="${hex(92, 166, 11)}"/><polygon class="pu-j-hex2" points="${hex(148, 198, 11)}"/>
  <path class="pu-j-shine" d="M52 120c-2 30-2 70 0 100" /></svg>`;

const buyBar = () => `<div class="pu-bar"><span class="pu-bar-t">Le produit vedette</span><a class="pu-bar-b" data-pu-fiche href="/boutique">Acheter</a></div>`;
const header = (c) => `<header class="pu-head pk-bleed"><span class="pu-prog" aria-hidden="true"></span><div class="pu-top"><a class="pu-logo" href="/" aria-label="${esc(c.brand)}, accueil">${cells("pu-cell pu-cell--logo")}<span>${esc(c.brand)}</span></a>
  <div class="pu-nav" role="navigation" aria-label="Navigation principale">${c.menu.slice(1, 6).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="pu-act"><a class="pu-cart" href="/boutique/panier">Panier</a><a class="pu-buy" data-pu-fiche href="/boutique">Acheter</a></div></div></header>`;
const footer = (c) => `<footer class="pu-foot pk-bleed"><div class="pu-wrap pu-foot-g"><div>${cells("pu-cell pu-cell--foot")}<p class="pu-big">${esc(c.brand)}</p><p class="pu-small">Un seul produit, bien raconté, bien fait. Boutique de démonstration du thème : textes d'exemple à remplacer.</p></div>
  <div><p class="pu-lab">Acheter</p><p class="pu-fl"><a data-pu-fiche href="/boutique">Le produit vedette</a><a href="/offres">Choisir mon lot</a><a href="/boutique">Tout le catalogue</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="pu-lab">Comprendre</p><p class="pu-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><p class="pu-copy">© ${esc(c.brand)}, boutique de démonstration du thème</p></footer>${buyBar()}`;
const head = (kicker, title, lead) => sec(`<section class="pu-ph pk-bleed"><div class="pu-wrap"><p class="pu-lab">${esc(kicker)}</p><div class="pu-h1" role="heading" aria-level="1">${esc(title)}</div><p class="pu-lead">${esc(lead)}</p></div></section>`);

/* Un chapitre : rail collant (numéro + titre court) à gauche, récit à droite */
const chap = (no, lab, title, inner, cls = "") => `<section class="pu-ch pk-bleed ${cls}"><div class="pu-wrap pu-ch-g"><div class="pu-rail"><span class="pu-no" aria-hidden="true">${no}</span><p class="pu-lab">${esc(lab)}</p></div><div class="pu-body"><h2 class="pu-h2 pu-rv">${esc(title)}</h2>${inner}</div></div></section>`;

const probleme = () => sec(chap("01", "Le problème", "On vous vend du miel. Rarement on vous dit d'où il vient.", `<p class="pu-p pu-rv">Texte d'exemple à adapter : décrivez ici le vrai problème que votre produit résout, avec les mots de vos clients.</p>
  <div class="pu-vs pu-rv"><div class="pu-vs-a"><h3>Ce qu'on trouve souvent</h3><ul><li>Un mélange de provenances, sans origine claire</li><li>Un goût uniforme, réchauffé pour rester liquide</li><li>Une étiquette qui en dit peu</li></ul></div><div class="pu-vs-b"><h3>Ce que vous cherchez</h3><ul><li>Une origine précise, une récolte, un nom</li><li>Un goût qui change selon l'année</li><li>Un producteur que l'on peut joindre</li></ul></div></div>`));
const solution = () => sec(chap("02", "La solution", "Un seul miel. Un seul producteur. Un seul pot à choisir.", `<p class="pu-p pu-rv">Texte d'exemple : présentez le produit vedette en trois bénéfices concrets, sans promesse que vous ne pouvez pas tenir.</p>
  <ol class="pu-ben pu-rv"><li><b>Origine claire</b>Le thym des garrigues de la région, récolté une fois par an.</li><li>${""}<b>Pot unique</b>Un seul format de pot : pas de gamme à comparer.</li><li><b>Livré chez vous</b>Frais et délais exacts calculés à la commande.</li></ol>
  <p class="pu-rv"><a class="pu-btn" data-pu-fiche href="/boutique">Voir la fiche et acheter</a></p>`, "pu-ch--clair"));
const fabrication = (short = true) => sec(chap("03", "La fabrication", "Du rucher au pot, en quatre gestes", `<ol class="pu-steps pu-rv"><li><b>La récolte</b>Les cadres sont retirés quand les alvéoles sont operculées.</li><li><b>L'extraction</b>Le miel est extrait, filtré grossièrement, jamais chauffé au-delà de la ruche.</li><li><b>Le repos</b>Quelques jours en maturateur pour laisser remonter les bulles.</li><li><b>La mise en pot</b>Mise en pot à la main, numéro de lot noté sur chaque étiquette.</li></ol>
  ${short ? `<p class="pu-rv"><a class="pu-lk" href="/fabrication">Lire toute la fabrication</a></p>` : ""}<p class="pu-small pu-rv">Étapes d'exemple : remplacez-les par votre véritable procédé.</p>`));
const PREUVES = [["Analyse de laboratoire", "Ajoutez ici le résultat réel : organisme, date, numéro de rapport. Ou supprimez cette carte."], ["Label ou certification", "Indiquez le label réellement obtenu et son numéro. N'affichez rien tant que vous n'en avez pas."], ["Le producteur", "Une photo et quelques lignes sur vous : nom, lieu, depuis quand. Une vraie personne que l'on peut contacter."], ["Numéro de lot", "Expliquez où trouver le numéro de lot sur le pot, et ce qu'il permet de retrouver."]];
const preuves = (full = false) => sec(chap("04", "Les preuves", "Ce que vous pouvez vérifier vous-même", `<p class="pu-p pu-rv">Aucune note ni commentaire n'est écrit dans ce thème. Les avis publiés sur la fiche viennent uniquement de clients ayant réellement acheté et payé le produit. Les cartes ci-dessous sont à remplir avec vos propres preuves.</p>
  <div class="pu-proofs pu-rv">${PREUVES.slice(0, full ? 4 : 3).map(([t, d]) => `<div class="pu-proof"><span class="pu-ex">Exemple à remplacer</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>
  ${full ? "" : `<p class="pu-rv"><a class="pu-lk" href="/preuves">Voir toutes les preuves</a></p>`}`, "pu-ch--nuit"));
const LOTS = [["Lot de 1", "Pour goûter", "Un pot pour découvrir le produit."], ["Lot de 2", "Pour la maison", "Un pot entamé, un pot d'avance."], ["Lot de 3", "Pour offrir ou partager", "Trois pots d'une même récolte."]];
const offres = (detail = false) => sec(`<section class="pu-off pk-bleed"><div class="pu-wrap"><p class="pu-lab">Offres en lots</p><h2 class="pu-h2 pu-rv">Choisissez votre lot</h2>
  <div class="pu-lots pu-rv">${LOTS.map(([n, who, d], i) => `<div class="pu-lot${i === 1 ? " pu-lot--m" : ""}"><p class="pu-lot-n">${esc(n)}</p><p class="pu-lot-w">${esc(who)}</p><p class="pu-small">${esc(d)}</p><a class="pu-btn pu-btn--o" data-pu-fiche href="/boutique">Choisir ce lot</a></div>`).join("")}</div>
  <p class="pu-honest pu-rv"><b>Comment ça marche.</b> Ces lots ne sont pas des coffrets : ce sont trois variantes du même produit. Sur la fiche, choisissez « Lot de 1 », « Lot de 2 » ou « Lot de 3 » dans la liste. Le prix et la disponibilité de chaque lot sont ceux de la boutique, affichés sur la fiche.</p>
  ${detail ? `<p class="pu-small pu-rv">Pour le commerçant : créez le produit avec un attribut « Lot » (valeurs « Lot de 1 », « Lot de 2 », « Lot de 3 »), puis donnez à chaque variante son propre prix et son propre stock dans l'administration.</p>` : ""}</div></section>`);
const QA = [["Le miel cristallise-t-il ?", "Oui, c'est naturel pour beaucoup de miels. Il suffit de poser le pot quelques minutes dans de l'eau tiède pour le rendre plus fluide."], ["Peut-on en donner à un bébé ?", "Non : le miel ne se donne pas aux enfants de moins d'un an. Pour toute question de santé, demandez conseil à un professionnel."], ["Comment le conserver ?", "À l'abri de la lumière et de la chaleur, pot bien fermé. La date de durabilité est indiquée sur le pot."], ["Quelle est la différence entre les lots ?", "Seulement le nombre de pots. Chaque lot est une variante de la même fiche, avec son propre prix."]];
const faqChap = () => sec(chap("05", "Les questions", "Ce qu'on nous demande le plus", QA.map(([q, a]) => `<details class="pu-q pu-rv"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("") + `<p class="pu-rv"><a class="pu-lk" href="/faq">Toutes les questions</a></p>`));
const closing = () => sec(`<section class="pu-end pk-bleed"><div class="pu-wrap pu-end-in"><div><div class="pu-h2 pu-h2--xl" role="presentation">Prêt à goûter ?</div><p class="pu-lead">Un clic mène à la vraie fiche : prix, lots et disponibilité sont ceux de la boutique.</p><p><a class="pu-btn" data-pu-fiche href="/boutique">Acheter maintenant</a></p></div>${jar("pu-jar--end")}</div></section>`);

const hero = () => sec(`<section class="pu-hero pk-bleed"><div class="pu-wrap pu-hero-in"><div class="pu-hero-t"><p class="pu-lab">Récolte unique · Un seul produit</p><div class="pu-h1 pu-h1--xl" role="heading" aria-level="1">Le miel de thym,<br>et rien d'autre.</div><p class="pu-lead">Un seul pot, raconté du rucher à votre table. Lisez l'histoire, vérifiez les preuves, choisissez votre lot.</p>
  <p class="pu-cta"><a class="pu-btn" data-pu-fiche href="/boutique">Acheter le pot</a><a class="pu-lk" href="/offres">Voir les lots</a></p><p class="pu-small">Textes et illustrations d'exemple du thème : remplacez-les par ceux de votre produit.</p></div>
  <div class="pu-hero-a" aria-hidden="true">${jar("pu-jar--hero")}${cells("pu-cell pu-cell--1")}${cells("pu-cell pu-cell--2")}</div></div></section>`);
const vedette = () => [sec(`<section class="pu-sec pk-bleed"><div class="pu-wrap"><p class="pu-lab">Le produit vedette</p><h2 class="pu-h2">La fiche, en un coup d'œil</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 1, columns: "2", orderby: "featured", layout: "list", ratio: "4/5", showDescription: true, showCart: true, optionsLabel: "Choisir mon lot", cartLabel: "Ajouter au panier", cardStyle: "plain" }))];

const home = (c) => [sec(header(c)), hero(), ...vedette(), probleme(), solution(), fabrication(true), preuves(false), offres(false), faqChap(), closing(), sec(footer(c))];
const pageFabrication = (c) => [sec(header(c)), head("La fabrication", "Du rucher au pot", "Le récit détaillé de chaque étape, à remplacer par le vôtre."), fabrication(false),
  sec(`<section class="pu-sec pk-bleed"><div class="pu-wrap pu-prose"><h2 class="pu-h2">Pourquoi tout raconter ?</h2><p>Quand on n'a qu'un produit, la confiance se joue sur le détail. Plus vous montrez, plus la décision est simple. Ajoutez ici des photos réelles de votre atelier ou de votre rucher.</p><p><a class="pu-btn" data-pu-fiche href="/boutique">Voir la fiche du produit</a></p></div></section>`), sec(footer(c))];
const pageOffres = (c) => [sec(header(c)), head("Les offres", "Un produit, trois lots", "De vraies variantes avec leur propre prix."), offres(true),
  sec(`<section class="pu-sec pk-bleed"><div class="pu-wrap pu-prose"><h2 class="pu-h2">Livraison</h2><p>Frais et délais exacts sont calculés à la commande selon votre pays. <a href="/livraison">Lire les détails</a>.</p></div></section>`), sec(footer(c))];
const pagePreuves = (c) => [sec(header(c)), head("Les preuves", "Ce que vous pouvez vérifier", "Cartes éditables : remplissez-les avec vos vraies preuves."), preuves(true), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="pu-sec pk-bleed"><div class="pu-wrap pu-prose"><h2 class="pu-h2">Livraison</h2><p>Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Le pot voyage calé dans un emballage rigide.</p><h2 class="pu-h2">Pot abîmé ?</h2><p>Écrivez-nous depuis la page <a href="/contact">contact</a> avec une photo et le numéro de commande : nous trouvons une solution.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Conservation, lots, livraison."),
  sec(`<section class="pu-sec pk-bleed"><div class="pu-wrap pu-prose">${QA.map(([q, a]) => `<details class="pu-q"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Contact", "Nous écrire", "Une question sur le produit ou un lot ? Écrivez-nous."), { type: "form", heading: "Écrire au producteur", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher dans la boutique", "Le produit vedette, ses accessoires et ses recharges."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un produit…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pu-ph pk-bleed"><div class="pu-wrap"><p class="pu-lab">Page introuvable</p><div class="pu-h1 pu-h1--xl" role="heading" aria-level="1">Ce chapitre<br>n'existe pas</div><p class="pu-lead"><a href="/">Reprendre l'histoire depuis le début</a> ou <a href="/boutique">aller à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "produit-unique", name: "Produit unique", version: "1.0.0", category: "ecommerce", tags: ["editorial", "chaleureux", "moderne"], siteType: "Boutique mono-produit", featured: false,
  concept: "La page de vente est l'accueil : un seul produit raconté en chapitres numérotés (problème, solution, fabrication, preuves, questions), puis des offres en lots qui sont de vraies variantes, avec un achat toujours à portée de pouce.",
  description: "Boutique d'un seul produit : papier chaud, bleu nuit et safran, étiquettes à coins coupés, récit en chapitres avec rail collant, preuves éditables (aucun faux avis), lots 1/2/3 réalisés avec de vraies variantes, bouton d'achat fixe sur mobile.",
  brand: "Garrigue", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "etiquette-a-coins-coupes-prix-en-evidence", gallery: "image-haute-et-panneau-d-achat-collant", cart: "page-dediee-sobre-et-total-en-evidence", catalog: "produit-vedette-en-tete-puis-accessoires" },
  dna: {
    header: "bandeau-mince-avec-barre-de-lecture-et-bouton-acheter", hero: "pot-dessine-et-alveoles-sur-papier-avec-achat-direct", grid: "vedette-en-liste-puis-chapitres-en-colonne-etroite", typo: "gloock+figtree",
    shapes: "etiquettes-a-coins-coupes-et-alveoles-hexagonales", motion: "chapitres-qui-se-devoilent-et-barre-de-lecture", rhythm: "chapitres-numerotes-alternant-papier-clair-et-bleu-nuit", signature: "page-produit-longue-en-storytelling-et-lots-en-variantes",
    palette: "safran-brule-et-bleu-nuit-sur-papier-chaud", image: "pot-et-alveoles-svg-sans-photo", list: "etiquettes-coins-coupes-prix-en-evidence",
    article: "chapitres-avec-rail-collant-numerote", sidebar: "aucune-rail-de-chapitre-collant", reading: "figtree-17-px-mesure-60-caracteres",
  },
  tokens: {
    colors: { primary: "#d97a06", secondary: "#14283a", accent: "#9a5200", background: "#f7f0e3", surface: "#fffdf8", text: "#14283a", muted: "#4f5b66", success: "#2b7a4b", warning: "#9a5200", error: "#b3261e" },
    fonts: { heading: "font.gloock", body: "font.figtree", button: "font.figtree", link: "font.figtree" },
    radius: { sm: 2, md: 4, lg: 8, button: 2, field: 4, card: 4 }, shadow: { card: "none", button: "4px 4px 0 #14283a" }, border: { width: 2, color: "#14283a" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 38, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent (safran)", type: "color", default: "#d97a06" },
    { key: "achat", label: "Couleur du bouton d'achat", type: "color", default: "#d97a06" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "papier", choices: [["papier", "Papier chaud"], ["creme", "Crème claire"], ["blanc", "Blanc"]] },
    { key: "numeros", label: "Numéros de chapitres", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "lecture", label: "Barre de progression de lecture", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "barre", label: "Barre d'achat fixe sur mobile", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "coins", label: "Coins des étiquettes", type: "choice", default: "coupes", choices: [["coupes", "Coins coupés"], ["droits", "Coins droits"]] },
    { key: "alveoles", label: "Motifs d'alvéoles", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Fabrication", "/fabrication"], ["Lots", "/offres"], ["Preuves", "/preuves"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil (page de vente)", render: home }, { key: "fabrication", name: "Fabrication", render: pageFabrication }, { key: "offres", name: "Offres en lots", render: pageOffres }, { key: "preuves", name: "Preuves", render: pagePreuves },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
