// Percale Fine — linge de maison de luxe. Direction artistique : des fils, des tissages, des chambres baignées de lumière. Fond lin clair, encre bleu-gris, un fil sable, titres en serif léger
// (Neuton) et lecture en sans humaniste (Quattrocento Sans). Composant signature : le CONFIGURATEUR PAR DIMENSIONS DE LIT. Il relit les VRAIES valeurs de l'attribut « Dimension » des variantes
// du moteur (voir demo.js) : on choisit la largeur de son lit, le thème indique quelle dimension choisir pour le drap-housse, la housse de couette et le drap plat, avec des liens vers les
// vraies étiquettes de la boutique. C'est un bloc éditable du Page Builder (un tableau) ; motion.js ajoute seulement un sélecteur. Aucun panier, prix ni stock n'est simulé.
// Les ÉCHANTILLONS n'existent pas dans le moteur : le thème ne les simule pas, il renvoie vers la vraie page contact (formulaire du CMS) et le dit honnêtement.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");
const demo = require("./demo");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14l-1 11H6zM9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.4" fill="none" stroke="currentColor" stroke-width="1"/><path d="M5.5 20c1-3.8 3.8-5 6.5-5s5.5 1.2 6.5 5" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
  mark: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 8h24M4 13h24M4 18h24M4 23h24" stroke="currentColor" stroke-width="1" opacity=".45" fill="none"/><path d="M9 3v4M9 10v4M9 17v4M9 24v4M14 6v4M14 13v4M14 20v4M14 27v2M19 3v4M19 10v4M19 17v4M19 24v4M24 6v4M24 13v4M24 20v4M24 27v2" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`,
};

// Petit schéma de tissage (décor, sans texte) : chaque case montre le fil de chaîne (vertical) ou de trame (horizontal) passé dessus. mode : toile | satin | lin
const weave = (mode) => {
  const n = 8, s = 8; let out = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const warp = mode === "satin" ? ((c - 2 * r) % 4 + 4) % 4 !== 0 : (r + c) % 2 === 0;
    out += warp ? `<rect class="pc-wa" x="${c * s + 1.5}" y="${r * s}" width="${s - 3}" height="${s}"/>` : `<rect class="pc-wb" x="${c * s}" y="${r * s + 1.5}" width="${s}" height="${s - 3}"/>`;
  }
  return `<svg class="pc-weave pc-weave--${mode}" viewBox="0 0 64 64" role="img" aria-label="Schéma du tissage : ${mode === "satin" ? "satin, les fils flottent en surface" : mode === "lin" ? "toile de lin, fils irréguliers" : "toile, un fil dessus un fil dessous"}">${out}</svg>`;
};

const header = (c) => `<header class="pc-head pk-bleed"><div class="pc-annonce"><a href="/echantillons">Des échantillons de tissu se demandent par message — voir comment</a></div>
  <div class="pc-bar"><a class="pc-logo" href="/" aria-label="Percale Fine, accueil">${ICON.mark}<span>Percale <em>Fine</em></span></a>
  <div class="pc-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="pc-nav pc-nav--ic" role="navigation" aria-label="Boutique"><a class="pc-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="pc-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="pc-foot pk-bleed"><div class="pc-wrap pc-foot-g">
  <div><p class="pc-lab">Percale Fine</p><p class="pc-small">Maison de linge de lit et de bain.<br>Du mardi au samedi, 10 h – 18 h.</p></div>
  <div><p class="pc-lab">Boutique</p><p class="pc-fl"><a href="/boutique">Toutes les pièces</a><a href="/boutique/categorie/draps-housses-et-draps">Draps-housses et draps</a><a href="/boutique/categorie/housses-de-couette">Housses de couette</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="pc-lab">Informations</p><p class="pc-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="pc-lab">Entretien</p><p class="pc-small">Un premier lavage avant d'utiliser le linge. Le coton et le lin peuvent légèrement se rétracter : voir la fiche matière.</p></div></div>
  <p class="pc-copy">© Percale Fine — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="pc-ph pk-bleed"><div class="pc-wrap pc-narrow"><p class="pc-lab">${esc(kicker)}</p><div class="pc-h1" role="heading" aria-level="1">${esc(title)}</div><p class="pc-lead">${esc(lead)}</p></div></section>`);

// ----- Composant signature : configurateur par dimensions de lit. Le tableau est la source (modifiable dans le Page Builder) ; chaque ligne porte data-lit. Les dimensions viennent de demo.js,
// c'est-à-dire des variantes réellement créées dans la boutique de démonstration.
const rows = demo.lits.map((l) => `<tr data-lit="${esc(l.largeur)}"><th scope="row">${esc(l.largeur)} cm <span>${esc(l.nom)}</span></th><td>${esc(l.drapHousse)}</td><td>${esc(l.housse)}</td><td>${esc(l.drapPlat)}</td></tr>`).join("");
const conf = (title = "Quel linge pour quel lit ?") => sec(`<section class="pc-confs pk-bleed"><div class="pc-wrap"><p class="pc-lab">Configurateur par dimensions de lit</p><h2 class="pc-h2">${esc(title)}</h2>
  <p class="pc-lead">Indiquez la largeur de votre matelas : le tableau vous donne la valeur à choisir dans la liste « Variante » de chaque fiche produit. Ces dimensions sont celles des variantes de la boutique.</p>
  <div class="pc-conf" data-percale-conf>
    <div class="pc-pick" data-pc-pick><p class="pc-fallback">Lisez la ligne qui correspond à la largeur de votre matelas dans le tableau ci-dessous.</p></div>
    <div class="pc-res" data-pc-res></div>
    <div class="pc-tw"><table class="pc-tb"><caption>Largeur du matelas et dimension à choisir sur la fiche produit</caption>
      <thead><tr><th scope="col">Votre lit</th><th scope="col"><a href="/boutique/etiquette/drap-housse">Drap-housse</a></th><th scope="col"><a href="/boutique/etiquette/housse-de-couette">Housse de couette</a></th><th scope="col"><a href="/boutique/etiquette/drap-plat">Drap plat</a></th></tr></thead>
      <tbody>${rows}</tbody></table></div>
  </div>
  <p class="pc-note">Valeurs d'usage courant, à vérifier avec votre literie. Le drap-housse se choisit selon la longueur et la largeur du matelas, et son bonnet selon la hauteur (35 cm sur les fiches de démonstration). Les taies existent en 50 × 70 cm et 65 × 65 cm. Une dimension épuisée est signalée « rupture » dans la liste de la fiche, directement par la boutique.</p>
  <p><a class="pc-btn" href="/boutique">Voir le linge</a> <a class="pc-link" href="/echantillons">Demander un échantillon de tissu</a></p></div></section>`);

// ----- Fiche matière comparée : fil, tissage, densité, grammage, toucher, entretien. Valeurs de démonstration, à remplacer par celles de la maison.
const MAT = [
  { nom: "Percale de coton long", mode: "toile", l: [["Fil", "Coton à longues fibres, peigné"], ["Tissage", "Toile : un fil dessus, un fil dessous"], ["Densité", "80 fils par cm²"], ["Grammage", "105 g/m²"], ["Toucher", "Frais, légèrement croquant"], ["Entretien", "Machine 40 °C, repassage facultatif"]] },
  { nom: "Satin de coton", mode: "satin", l: [["Fil", "Coton à longues fibres, peigné"], ["Tissage", "Satin de 4 : trois fils de chaîne dessus, un dessous"], ["Densité", "120 fils par cm²"], ["Grammage", "130 g/m²"], ["Toucher", "Lisse, souple, légèrement brillant"], ["Entretien", "Machine 30 °C, à l'envers, séchage doux"]] },
  { nom: "Lin lavé", mode: "lin", l: [["Fil", "Lin, fil irrégulier"], ["Tissage", "Toile serrée, lavée en pièce"], ["Densité", "22 fils par cm²"], ["Grammage", "170 g/m²"], ["Toucher", "Texturé, s'assouplit à chaque lavage"], ["Entretien", "Machine 40 °C, séchage à l'air, sans repassage"]] },
];
const matiere = (title = "Savoir ce que l'on touche") => sec(`<section class="pc-mats pk-bleed"><div class="pc-wrap"><p class="pc-lab">Fiche matière</p><h2 class="pc-h2">${esc(title)}</h2>
  <p class="pc-lead">Trois tissages, trois façons de dormir. Chaque ligne dit ce que contient le linge : le fil, le tissage, la densité, le grammage et l'entretien.</p>
  <div class="pc-tw"><table class="pc-tb pc-tb--mat"><caption>Comparaison de trois matières de linge de lit</caption>
  <thead><tr><td></td>${MAT.map((m) => `<th scope="col">${weave(m.mode)}<span class="pc-mn">${esc(m.nom)}</span></th>`).join("")}</tr></thead>
  <tbody>${MAT[0].l.map((r, i) => `<tr><th scope="row">${esc(r[0])}</th>${MAT.map((m) => `<td>${esc(m.l[i][1])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <p class="pc-note">Valeurs de démonstration : chaque maison les remplace par celles de ses tissus. Le coton et le lin peuvent se rétracter légèrement au premier lavage.</p></div></section>`);

const window_ = () => `<div class="pc-win" aria-hidden="true"><div class="pc-beam pc-beam--a"></div><div class="pc-beam pc-beam--b"></div><div class="pc-panes"><i></i><i></i><i></i></div>
  <svg class="pc-sheet" viewBox="0 0 400 140" preserveAspectRatio="none"><path class="pc-s1" d="M0 70 C60 40 110 90 170 62 S290 30 400 58 V140 H0 Z"/><path class="pc-s2" d="M0 96 C70 76 120 116 200 90 S320 70 400 92 V140 H0 Z"/><path class="pc-s3" d="M0 118 C80 104 150 134 230 112 S350 104 400 116 V140 H0 Z"/></svg></div>`;

const echantillons = () => sec(`<section class="pc-samp pk-bleed"><div class="pc-wrap pc-split"><div><p class="pc-lab">Échantillons de tissu</p><h2 class="pc-h2">Toucher avant de choisir</h2>
  <p class="pc-lead">La boutique ne vend pas d'échantillons : ils n'existent pas comme produit. Vous pouvez en demander par message, depuis la page contact. Précisez les matières et les coloris qui vous intéressent et votre adresse postale.</p>
  <p class="pc-small">Nous vous répondons avec la disponibilité, le délai et les éventuels frais : rien n'est promis avant cette réponse. Le message passe par le formulaire du site.</p>
  <p><a class="pc-btn" href="/contact">Écrire pour un échantillon</a> <a class="pc-link" href="/matiere">Lire la fiche matière</a></p></div>
  <div class="pc-nuancier" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><p>Teintes illustratives à l'écran : le tissu réel peut différer.</p></div></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="pc-hero pk-bleed"><div class="pc-wrap pc-hero-in"><div class="pc-hero-t"><p class="pc-lab">Linge de lit et de bain</p><div class="pc-h1 pc-h1--xl" role="heading" aria-level="1">Le matin,<br><em>la lumière</em><br>sur le drap</div><p class="pc-lead">Percale, satin de coton, lin lavé : des tissages choisis pour la façon dont ils tombent, se froissent et vieillissent. Chaque fiche dit tout du fil.</p><p><a class="pc-btn" href="/lit">Choisir selon mon lit</a> <a class="pc-link" href="/matiere">La fiche matière</a></p></div>${window_()}</div></section>`),
  conf(),
  sec(`<section class="pc-sec pk-bleed"><div class="pc-wrap"><p class="pc-lab">Les incontournables</p><h2 class="pc-h2">Pièces à la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "4/5", cardStyle: "plain" })),
  matiere(),
  echantillons(),
  sec(`<section class="pc-sec pk-bleed"><div class="pc-wrap pc-narrow"><p class="pc-lab">Nos engagements</p><ul class="pc-vals"><li><b>Tout dire du fil</b>Matière, tissage, densité, grammage : chaque fiche donne les mêmes informations, dans le même ordre.</li><li><b>Des dimensions exactes</b>Le configurateur renvoie aux dimensions réelles des fiches, jamais à une taille approximative.</li><li><b>Honnête</b>Les prix affichés sont les prix payés. Pas de fausse urgence, pas de compte à rebours.</li></ul></div></section>`),
  sec(footer(c))];

const lit = (c) => [sec(header(c)), head("Dimensions du lit", "Choisir selon son lit", "Du lit de 90 cm au lit de 200 cm : la bonne dimension pour chaque pièce."), conf("La dimension pour votre lit"),
  sec(`<section class="pc-sec pk-bleed"><div class="pc-wrap pc-narrow pc-prose"><h2 class="pc-h2">Bien mesurer</h2><p>Mesurez la largeur et la longueur de votre matelas, puis sa hauteur. Le drap-housse doit tenir sous le matelas sur tout le pourtour : choisissez un bonnet supérieur d'au moins deux centimètres à la hauteur du matelas, surmatelas compris.</p><h2 class="pc-h2">Housse de couette</h2><p>La housse est plus large que le lit pour retomber sur les côtés. Si vous dormez à deux sous deux couettes, prenez la housse du lit d'une personne et non celle d'un lit double.</p><h2 class="pc-h2">Un doute ?</h2><p>Écrivez-nous depuis la page <a href="/contact">contact</a> avec les dimensions de votre matelas.</p></div></section>`), sec(footer(c))];
const matierePage = (c) => [sec(header(c)), head("Fiche matière", "La matière", "Le fil, le tissage, la densité et l'entretien, sans détour."), matiere("Trois tissages comparés"),
  sec(`<section class="pc-sec pk-bleed"><div class="pc-wrap pc-narrow pc-prose"><h2 class="pc-h2">L'entretien, en bref</h2><p>Lavez le linge avant la première nuit. Évitez l'adoucissant, qui encrasse les fibres et les rend moins absorbantes. Secouez le linge avant de l'étendre pour limiter les plis. Un fer à repasser est facultatif : la percale se repasse humide, le lin se porte froissé.</p></div></section>`), sec(footer(c))];
const echantillonsPage = (c) => [sec(header(c)), head("Échantillons", "Demander un échantillon", "Un tissu se juge à la main. Voici comment nous le demander."), echantillons(),
  sec(`<section class="pc-sec pk-bleed"><div class="pc-wrap pc-narrow pc-prose"><h2 class="pc-h2">Ce que le thème fait, et ne fait pas</h2><p>Les échantillons ne sont pas un produit du moteur de boutique : il n'y a ni panier ni suivi pour eux. La demande se fait par le formulaire de la page contact, et la suite se règle avec la maison par réponse écrite.</p></div></section>`), sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="pc-sec pk-bleed"><div class="pc-wrap pc-narrow pc-prose"><h2 class="pc-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Le linge est plié dans un papier de soie.</p><h2 class="pc-h2">Retours</h2><p>Vous disposez de quatorze jours pour nous retourner du linge non lavé et non utilisé, dans son emballage. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p><h2 class="pc-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Dimensions, matières, entretien."),
  sec(`<section class="pc-sec pk-bleed"><div class="pc-wrap pc-narrow"><details class="pc-q"><summary>Comment choisir la dimension d'un drap-housse ?</summary><p>Prenez la largeur de votre matelas : un lit de 140 cm demande un drap-housse « 140 × 190 cm ». Le <a href="/lit">configurateur</a> la donne pour chaque lit.</p></details><details class="pc-q"><summary>Quelle différence entre percale et satin de coton ?</summary><p>La percale est un tissage serré et frais, au toucher légèrement croquant. Le satin de coton est plus lisse et plus souple. La <a href="/matiere">fiche matière</a> les compare.</p></details><details class="pc-q"><summary>Le linge rétrécit-il au lavage ?</summary><p>Le coton et le lin peuvent se rétracter légèrement au premier lavage. Lavez le linge avant usage et suivez l'entretien indiqué sur la fiche.</p></details><details class="pc-q"><summary>Puis-je recevoir un échantillon de tissu ?</summary><p>Les échantillons ne sont pas vendus en ligne : demandez-les par la page <a href="/echantillons">échantillons</a>.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une dimension, une matière, un échantillon, une commande."),
  { type: "form", heading: "Écrire à la maison", intro: "Pour un échantillon, indiquez les matières, les coloris et votre adresse. Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher du linge", "Une matière, un coloris, une dimension."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher du linge…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pc-ph pk-bleed"><div class="pc-wrap pc-narrow"><p class="pc-lab">Page introuvable</p><div class="pc-h1 pc-h1--xl" role="heading" aria-level="1">Fil rompu</div><p class="pc-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "percale-fine", name: "Percale Fine", version: "1.0.0", category: "luxe", tags: ["luxe", "minimaliste", "naturel"], siteType: "Maison de linge de lit et de bain", featured: true,
  concept: "Des fils, des tissages et des chambres baignées de lumière : une fenêtre à croisillons, un configurateur qui traduit la largeur du lit en dimension de drap, de housse et de drap plat, et une fiche matière comparée.",
  description: "Linge de maison de luxe : fond lin clair, serif léger, configurateur par dimensions de lit relié aux vraies variantes « Dimension », fiche matière comparée (fil, tissage, densité, grammage, entretien) et demande d'échantillons par le formulaire de contact.",
  brand: "Percale Fine", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "image-4-5-sans-cadre-legende-gauche", gallery: "grande-image-haute-croisillon-fin", cart: "page-dediee-lin-filet-double", catalog: "filtres-en-ligne-sous-filet-double" },
  dna: {
    header: "logo-gauche-menu-centre-filet-double", hero: "texte-bas-gauche-fenetre-a-croisillons-lumiere", grid: "trois-colonnes-portrait-quatre-cinquiemes-sans-cadre", typo: "neuton-et-quattrocento-sans",
    shapes: "fenetre-a-croisillons-et-fil-de-chaine", motion: "rayon-de-lumiere-lent-et-fil-qui-se-tend", rhythm: "bandes-lin-clair-et-blanc-grand-air", signature: "configurateur-dimensions-de-lit-relu-des-variantes",
    palette: "lin-clair-encre-bleu-gris-fil-sable", image: "schemas-de-tissage-svg-et-fenetre-sans-photo", list: "tableau-comparatif-matieres-en-colonnes",
    article: "colonne-etroite-titres-par-piece-de-lit", sidebar: "aucune-tableau-lit-dimension-en-pleine-largeur", reading: "quattrocento-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#5e7480", secondary: "#25323a", accent: "#c3a77c", background: "#f6f3ec", surface: "#fbf9f5", text: "#25323a", muted: "#5b686e", success: "#4d6b4f", warning: "#8a6a2f", error: "#a23b34" },
    fonts: { heading: "font.neuton", body: "font.quattrocento-sans", button: "font.quattrocento-sans", link: "font.quattrocento-sans" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d4c8" },
    type: { h1: { size: 64, weight: 300, lineHeight: 1.02, transform: "none" }, h2: { size: 38, weight: 300, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "fil", label: "Couleur du fil (filets et accents)", type: "color", default: "#c3a77c" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "lin", choices: [["lin", "Lin clair"], ["blanc", "Blanc"], ["aube", "Aube grise"]] },
    { key: "lumiere", label: "Rayon de lumière du héros", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "trame", label: "Trame tissée en fond", type: "choice", default: "fine", choices: [["fine", "Discrète"], ["aucune", "Aucune"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "titres", label: "Titres", type: "choice", default: "legers", choices: [["legers", "Légers"], ["romains", "Normaux"]] },
    { key: "tableau", label: "Tableau du configurateur", type: "choice", default: "filets", choices: [["filets", "Filets fins"], ["bandes", "Bandes alternées"]] },
    { key: "grille", label: "Grille de produits", type: "choice", default: "decalee", choices: [["decalee", "Colonnes décalées"], ["alignee", "Alignée"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Choisir son lit", "/lit"], ["La matière", "/matiere"], ["Échantillons", "/echantillons"], ["Livraison", "/livraison"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "lit", name: "Choisir selon son lit", render: lit }, { key: "matiere", name: "La matière", render: matierePage },
    { key: "echantillons", name: "Échantillons", render: echantillonsPage }, { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
