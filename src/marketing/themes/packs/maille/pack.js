// Maille — maison de cachemire et de maille. Direction artistique : la lenteur de la matière. Fonds laine écrue, texte brun-gris, un seul filet de couleur ; titres en capitales
// espacées sur serif fin (Cormorant), lecture en colonnes étroites, grand silence autour des produits. Composant signature : la FICHE MATIÈRE (origine, finesse, grammage, entretien)
// — un bloc éditable depuis le CMS (Page Builder), à côté des vrais produits du moteur de boutique.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`,
};
const header = (c) => `<header class="ml-head pk-bleed"><div class="ml-promo">Livraison offerte dès 150 € · Emballage de soin inclus</div>
  <div class="ml-bar"><div class="ml-nav ml-nav--l" role="navigation" aria-label="Navigation principale">${c.menu.slice(0, 3).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <a class="ml-logo" href="/" aria-label="Maille, accueil"><span>M A I L L E</span><i>cachemire depuis 1974</i></a>
  <div class="ml-nav ml-nav--r" role="navigation" aria-label="Boutique">${c.menu.slice(3).map((m) => `<a class="ml-nav-t" href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a class="ml-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="ml-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="ml-foot pk-bleed"><div class="ml-wrap ml-foot-g">
  <div><p class="ml-lab">Maille</p><p class="ml-small">Atelier de maille, Troyes.<br>Du mardi au samedi, 10 h – 18 h.</p></div>
  <div><p class="ml-lab">Boutique</p><p class="ml-fl"><a href="/boutique">Toutes les pièces</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="ml-lab">Informations</p><p class="ml-fl">${c.menu.slice(1, 6).filter((m) => !m.url.startsWith("/boutique")).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="ml-lab">Entretien</p><p class="ml-small">Lavage à la main, 30 °C. Séchage à plat. Un peigne à cachemire est offert avec chaque pièce.</p></div></div>
  <p class="ml-copy">© Maille — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="ml-ph pk-bleed"><div class="ml-wrap ml-narrow"><p class="ml-lab">${esc(kicker)}</p><div class="ml-h1" role="heading" aria-level="1">${esc(title)}</div><p class="ml-lead">${esc(lead)}</p></div></section>`);

const FICHES = [
  ["Cachemire de Mongolie", "Poil de chèvre du désert de Gobi, peigné à la main au printemps.", [["Origine", "Mongolie intérieure"], ["Finesse", "14,5 microns"], ["Grammage", "280 g/m²"], ["Entretien", "Lavage main, 30 °C"]]],
  ["Laine mérinos extra-fine", "Mérinos de Tasmanie, élastique et respirante.", [["Origine", "Tasmanie"], ["Finesse", "17,5 microns"], ["Grammage", "240 g/m²"], ["Entretien", "Lavage délicat, 30 °C"]]],
  ["Soie et cachemire", "Un mélange 30/70 qui tombe comme une seconde peau.", [["Origine", "Chine, Mongolie"], ["Finesse", "13,8 microns"], ["Grammage", "190 g/m²"], ["Entretien", "Nettoyage à sec conseillé"]]],
];
const matiere = () => sec(`<section class="ml-mat pk-bleed"><div class="ml-wrap"><p class="ml-lab">Fiche matière</p><h2 class="ml-h2">Savoir ce que l'on porte</h2>
  <div class="ml-fiches">${FICHES.map((f, i) => `<details class="ml-fiche"${i === 0 ? " open" : ""}><summary><span class="ml-fiche-t">${esc(f[0])}</span><span class="ml-fiche-s">${esc(f[1])}</span></summary><dl class="ml-dl">${f[2].map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl></details>`).join("")}</div>
  </div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="ml-hero pk-bleed"><div class="ml-wrap ml-hero-in"><div class="ml-hero-t"><p class="ml-lab">Automne · Hiver</p><div class="ml-h1 ml-h1--xl" role="heading" aria-level="1">La douceur<br>prend son temps</div><p class="ml-lead">Des pièces tricotées en petites séries, dans la plus fine des fibres. Aucune promesse de saison : seulement de la matière.</p><p><a class="ml-btn" href="/boutique">Découvrir la maille</a> <a class="ml-link" href="/matiere">La fiche matière</a></p></div>
    <div class="ml-swatches" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div></section>`),
  sec(`<section class="ml-sec pk-bleed"><div class="ml-wrap"><p class="ml-lab">Les incontournables</p><h2 class="ml-h2">Pièces à la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 4, columns: "4", orderby: "featured", ratio: "3/4" })),
  matiere(),
  sec(`<section class="ml-sec pk-bleed"><div class="ml-wrap ml-narrow"><p class="ml-lab">Nos engagements</p><ul class="ml-vals"><li><b>Tracé</b>Chaque pelote est suivie du plateau mongol jusqu'à l'atelier.</li><li><b>Réparable</b>Un trou, une maille filée : l'atelier reprise gratuitement pendant deux ans.</li><li><b>Honnête</b>Les prix affichés sont les prix payés. Pas de fausse urgence, pas de compte à rebours.</li></ul></div></section>`),
  sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="ml-sec pk-bleed"><div class="ml-wrap ml-narrow ml-prose"><h2 class="ml-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Chaque colis est emballé dans un papier de soie.</p><h2 class="ml-h2">Retours</h2><p>Vous disposez de quatorze jours pour nous retourner une pièce non portée. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p><h2 class="ml-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Taille, entretien, matière."),
  sec(`<section class="ml-sec pk-bleed"><div class="ml-wrap ml-narrow"><details class="ml-q"><summary>Le cachemire bouloche-t-il ?</summary><p>Un peu au début, c'est normal : un coup de peigne à cachemire suffit.</p></details><details class="ml-q"><summary>Comment choisir ma taille ?</summary><p>Les pièces taillent droit. En cas de doute, prenez la taille au-dessus pour un port ample.</p></details><details class="ml-q"><summary>Puis-je laver en machine ?</summary><p>Nous le déconseillons : lavage à la main, 30 °C, séchage à plat.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une taille, une matière, une commande."),
  { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une pièce", "Un coloris, une matière, un modèle."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ml-ph pk-bleed"><div class="ml-wrap ml-narrow"><p class="ml-lab">Page introuvable</p><div class="ml-h1 ml-h1--xl" role="heading" aria-level="1">Maille filée</div><p class="ml-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "maille", name: "Maille", version: "1.0.0", category: "luxe", tags: ["minimaliste", "luxe", "classique"], siteType: "Maison de cachemire et de maille", featured: true,
  concept: "La lenteur de la matière : un silence blanc laine, des capitales espacées, une fiche matière dépliante et des produits montrés en grand, un par un.",
  description: "Cachemire et maille de luxe : fond laine écrue, capitales espacées sur serif fin, fiche matière (origine, finesse, grammage, entretien) dépliante, boutique réelle en pages sobres.",
  brand: "Maille", modules: ["formulaires", "recherche", "commerce"], shop: { card: "image-seule-legende-centree", gallery: "colonne-verticale-gauche-collante", cart: "page-dediee-sobre", catalog: "barre-de-filtres-horizontale" },
  dna: { header: "logo-centre-annonce-fine", hero: "deux-colonnes-pastilles-matiere", grid: "quatre-colonnes-portrait-sans-cadre", motion: "fondu-lent-fiches", shapes: "filets-fins-angles-droits", rhythm: "silence-colonne-etroite", signature: "fiche-matiere-depliante" },
  tokens: {
    colors: { primary: "#6b5a47", secondary: "#2f2c2a", accent: "#a68a64", background: "#f4efe7", surface: "#fbf8f3", text: "#2f2c2a", muted: "#6f675d", success: "#4d6b4f", warning: "#8a6a2f", error: "#a23b34" },
    fonts: { heading: "font.cormorant", body: "font.albert-sans", button: "font.albert-sans", link: "font.albert-sans" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d0c2" },
    type: { h1: { size: 56, weight: 300, lineHeight: 1.05, transform: "uppercase" }, h2: { size: 32, weight: 400, lineHeight: 1.15, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Couleur du filet", type: "color", default: "#a68a64" },
    { key: "fond", label: "Fond", type: "choice", default: "laine", choices: [["laine", "Laine écrue"], ["neige", "Blanc neige"]] },
    { key: "titres", label: "Titres", type: "choice", default: "capitales", choices: [["capitales", "Capitales espacées"], ["normale", "Casse normale"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["La matière", "/matiere"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "matiere", name: "La matière", render: (c) => [sec(header(c)), head("Fiche matière", "La matière", "Trois fibres, trois façons de tomber."), matiere(), sec(footer(c))] },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
