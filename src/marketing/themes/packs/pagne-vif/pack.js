// Pagne Vif — tissus wax et pagnes au mètre. Direction artistique : le marché de tissus, en couleurs pleines. Fond coton crème, indigo profond, vermillon, safran ; motifs wax dessinés en SVG
// dans le thème (cercles, éventails, losanges, yeux : aucune image externe) ; un « mètre ruban » gradué court sous l'en-tête ; cartes à bord festonné.
// Composant signature : le MÉTRAGE EN DIRECT + le NUANCIER.
//  - Sur la fiche d'un tissu étiqueté « au-metre », motion.js transforme le champ Quantité réel du moteur en sélecteur de mètres (boutons − / +, repères 1 à 6 m) et affiche, en direct,
//    « N mètres × prix du mètre = total » à partir du prix réellement affiché par la boutique (promotion comprise) : aucun prix n'est écrit dans le thème.
//  - Le moteur n'accepte que des quantités ENTIÈRES de 1 à 99 : pas de demi-mètre, pas d'unité de mesure, pas de remise au volume. Le thème ne simule rien de tout cela.
//  - Le nuancier est construit à partir des vraies variantes (« Coloris ») du produit ; il est aussi une page, dont les pastilles ouvrent les vrais filtres d'étiquettes.
//  - Un bloc éditable « métreur » (page Métrage) aide à estimer les mètres d'un projet (repères indicatifs modifiables dans le bloc HTML).
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

/* ---------- Motifs wax (SVG générés : coordonnées entières, sans identifiant, style en ligne ni texte, donc compatibles avec le filtre de sécurité) ---------- */
const COLORIS = [
  { tag: "indigo", nom: "Indigo", pal: ["#14246b", "#2f5fd0", "#f7b500", "#fff4dc"], motif: "cercles" },
  { tag: "carmin", nom: "Carmin", pal: ["#b3122b", "#e0451c", "#f7b500", "#fff4dc"], motif: "eventails" },
  { tag: "soleil", nom: "Soleil", pal: ["#f7b500", "#e0451c", "#14246b", "#fff4dc"], motif: "losanges" },
  { tag: "foret", nom: "Forêt", pal: ["#0f6b3a", "#7ac143", "#f7b500", "#fff4dc"], motif: "oeil" },
  { tag: "hibiscus", nom: "Hibiscus", pal: ["#c2185b", "#ff6fa5", "#14246b", "#fff4dc"], motif: "eventails" },
  { tag: "terre", nom: "Terre", pal: ["#a0481c", "#e98a2c", "#14246b", "#fff4dc"], motif: "cercles" },
];
function cell(kind, X, Y, p, off) {
  const cx = X + 50, cy = Y + 50;
  if (kind === "cercles") {
    return `<circle cx="${cx}" cy="${cy}" r="47" fill="${p[2]}"/><circle cx="${cx}" cy="${cy}" r="39" fill="${p[0]}"/><circle cx="${cx}" cy="${cy}" r="31" fill="${p[1]}"/><circle cx="${cx}" cy="${cy}" r="21" fill="${p[3]}"/><circle cx="${cx}" cy="${cy}" r="11" fill="${p[0]}"/>`
      + `<circle cx="${X}" cy="${Y}" r="8" fill="${p[2]}"/><circle cx="${X + 100}" cy="${Y}" r="8" fill="${p[2]}"/><circle cx="${X}" cy="${Y + 100}" r="8" fill="${p[2]}"/><circle cx="${X + 100}" cy="${Y + 100}" r="8" fill="${p[2]}"/>`;
  }
  if (kind === "eventails") {
    const bx = X + 50 + off, by = Y + 96;
    const fan = (r, f) => `<path d="M${bx - r} ${by}A${r} ${r} 0 0 1 ${bx + r} ${by}Z" fill="${f}"/>`;
    return fan(48, p[2]) + fan(39, p[3]) + fan(30, p[1]) + fan(20, p[3]) + fan(10, p[0]) + `<circle cx="${bx}" cy="${Y + 14}" r="6" fill="${p[2]}"/>`;
  }
  if (kind === "losanges") {
    const d = (r, f) => `<path d="M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z" fill="${f}"/>`;
    return d(48, p[2]) + d(38, p[0]) + d(28, p[1]) + d(16, p[3]) + `<circle cx="${cx}" cy="${cy}" r="6" fill="${p[0]}"/><path d="M${X} ${Y}h12M${X + 100} ${Y}h-12M${X} ${Y + 100}h12M${X + 100} ${Y + 100}h-12" stroke="${p[3]}" stroke-width="4"/>`;
  }
  return `<ellipse cx="${cx}" cy="${cy}" rx="46" ry="26" fill="${p[2]}"/><ellipse cx="${cx}" cy="${cy}" rx="37" ry="19" fill="${p[0]}"/><ellipse cx="${cx}" cy="${cy}" rx="27" ry="13" fill="${p[3]}"/><circle cx="${cx}" cy="${cy}" r="12" fill="${p[1]}"/><circle cx="${cx}" cy="${cy}" r="5" fill="${p[0]}"/>`
    + `<path d="M${X + 4} ${Y + 6}l16 10M${X + 96} ${Y + 6}l-16 10M${X + 4} ${Y + 94}l16 -10M${X + 96} ${Y + 94}l-16 -10" stroke="${p[3]}" stroke-width="4"/>`;
}
// n carreaux par côté ; label vide = décoratif
function motifSvg(kind, n, p, label, cls = "pv-svg") {
  const W = n * 100;
  let b = `<rect width="${W}" height="${W}" fill="${p[0]}"/>`;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) b += cell(kind, x * 100, y * 100, p, y % 2 ? 50 : 0);
  const a = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="${cls}" viewBox="0 0 ${W} ${W}" ${a} preserveAspectRatio="xMidYMid slice">${b}</svg>`;
}
const swatch = (c, big) => `<a class="pv-sw${big ? " pv-sw--b" : ""}" href="/boutique/etiquette/${c.tag}">${motifSvg(c.motif, 2, c.pal, "", "pv-svg")}<span class="pv-swn">${esc(c.nom)}</span></a>`;

/* ---------- En-tête, pied, titres ---------- */
const logo = () => `<svg class="pv-disc" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#f7b500"/><circle cx="50" cy="50" r="38" fill="#14246b"/><circle cx="50" cy="50" r="28" fill="#e0451c"/><circle cx="50" cy="50" r="17" fill="#fff4dc"/><circle cx="50" cy="50" r="7" fill="#14246b"/></svg>`;
const header = (c) => `<header class="pv-head pk-bleed"><div class="pv-note">Wax, pagnes et tissus au mètre · le prix du mètre est affiché sur chaque fiche</div>
  <div class="pv-bar"><a class="pv-logo" href="/" aria-label="Pagne Vif, accueil">${logo()}<span>Pagne <b>Vif</b></span></a>
  <div class="pv-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="pv-act"><a href="/boutique/compte">Compte</a><a class="pv-cart" href="/boutique/panier">Panier</a></div></div><div class="pv-ruler" aria-hidden="true"></div></header>`;
const footer = (c) => `<footer class="pv-foot pk-bleed"><div class="pv-wrap pv-foot-g"><div><p class="pv-big">Pagne <b>Vif</b></p><p class="pv-small">Tissus wax, coupons de 6 yards, bogolan, bazin et mercerie. Boutique de démonstration du thème.</p></div>
  <div><p class="pv-lab">Boutique</p><p class="pv-fl"><a href="/boutique">Tous les tissus</a><a href="/boutique/etiquette/au-metre">Tissus au mètre</a><a href="/boutique/etiquette/coupon-6-yards">Coupons de 6 yards</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="pv-lab">Aide</p><p class="pv-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><div class="pv-ruler pv-ruler--f" aria-hidden="true"></div><p class="pv-copy">© Pagne Vif — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="pv-ph pk-bleed"><div class="pv-wrap"><p class="pv-lab">${esc(kicker)}</p><div class="pv-h1" role="heading" aria-level="1">${esc(title)}</div><p class="pv-lead">${esc(lead)}</p></div></section>`);

/* ---------- Métreur (bloc éditable) : repères indicatifs en mètres ENTIERS ; motion.js en fait un sélecteur ---------- */
const PROJETS = [["Pagne à nouer", 2, "deux mètres suffisent pour une pièce à enrouler"], ["Jupe longue", 3, "avec un ourlet généreux"], ["Chemise", 3, "manches longues, tissu de 115 cm"], ["Robe longue", 4, "coupe évasée"], ["Boubou", 6, "ample, tissu de 115 cm"], ["Nappe de table", 3, "pour une table de quatre à six personnes"]];
const metreur = (titre) => sec(`<section class="pv-met pk-bleed"><div class="pv-wrap pv-met-in"><div><p class="pv-lab">Métrage</p><h2 class="pv-h2">${esc(titre)}</h2>
  <p class="pv-lead">Choisissez un projet : voici les mètres à prévoir. Ce sont des repères indicatifs pour un tissu de 115 cm de large ; selon votre taille et le sens du motif, demandez conseil par la page <a href="/contact">contact</a>.</p></div>
  <div class="pv-metbox" data-pv-metreur><ul class="pv-projets">${PROJETS.map(([n, m, d]) => `<li data-m="${m}"><b>${esc(n)}</b> <span>${m} m</span> <small>${esc(d)}</small></li>`).join("")}</ul>
  <p class="pv-small">La boutique vend des mètres entiers (de 1 à 99). Arrondissez au mètre supérieur. Le prix se calcule en direct sur la fiche de chaque tissu au mètre : prix du mètre × nombre de mètres.</p>
  <p><a class="pv-btn" href="/boutique/etiquette/au-metre">Voir les tissus au mètre</a></p></div></div></section>`);

const nuancier = (titre) => sec(`<section class="pv-nu pk-bleed"><div class="pv-wrap"><p class="pv-lab">Nuancier</p><h2 class="pv-h2">${esc(titre)}</h2><div class="pv-sws">${COLORIS.map((c) => swatch(c, false)).join("")}</div>
  <p class="pv-small">Chaque pastille ouvre le vrai catalogue filtré par ce coloris. Sur la fiche d'un tissu, les mêmes noms sont les variantes du produit, avec leur propre stock.</p></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="pv-hero pk-bleed"><div class="pv-wrap pv-hero-in"><div><p class="pv-lab">Tissus wax au mètre</p><div class="pv-h1 pv-h1--xl" role="heading" aria-level="1">Des motifs qui <em>parlent</em> avant vous</div><p class="pv-lead">Choisissez votre coloris, comptez vos mètres, voyez le total tout de suite. Le prix du mètre est celui de la boutique, rien d'autre.</p><p><a class="pv-btn" href="/boutique/etiquette/au-metre">Tissus au mètre</a> <a class="pv-btn pv-btn--o" href="/metrage">Calculer mes mètres</a></p></div>
  <div class="pv-art" aria-hidden="true"><div class="pv-roll pv-roll--c">${motifSvg("cercles", 3, COLORIS[0].pal, "")}</div><div class="pv-roll pv-roll--e">${motifSvg("eventails", 3, COLORIS[1].pal, "")}</div><div class="pv-roll pv-roll--l">${motifSvg("losanges", 3, COLORIS[2].pal, "")}</div></div></div></section>`),
  nuancier("Six coloris, six humeurs"),
  sec(`<section class="pv-sec pk-bleed"><div class="pv-wrap"><p class="pv-lab">À la une</p><h2 class="pv-h2">Les tissus du moment</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 8, columns: "4", orderby: "featured", ratio: "1/1" })),
  metreur("Combien de mètres pour mon projet ?"),
  sec(`<section class="pv-sec pk-bleed"><div class="pv-wrap"><p class="pv-lab">Pour finir l'ouvrage</p><h2 class="pv-h2">Fil, boutons, doublure</h2><p class="pv-lead">La mercerie assortie, sans rien de superflu dans votre panier.</p><p><a class="pv-btn pv-btn--o" href="/boutique/etiquette/mercerie">Voir la mercerie</a> <a class="pv-btn pv-btn--o" href="/boutique/etiquette/accessoire">Voir les accessoires</a></p></div></section>`),
  sec(footer(c))];

const metrage = (c) => [sec(header(c)), head("Calcul", "Combien de mètres ?", "Estimez la longueur, puis laissez la fiche du tissu faire le calcul du prix."), metreur("Choisissez votre projet"),
  sec(`<section class="pv-sec pk-bleed"><div class="pv-wrap pv-prose"><h2 class="pv-h2">Comment se fait le calcul</h2><ol class="pv-steps"><li><b>Sur la fiche d'un tissu au mètre</b>Le champ Quantité devient un nombre de mètres, avec des boutons − et +.</li><li><b>Le total s'affiche en direct</b>Mètres × prix du mètre actuellement affiché, promotion comprise.</li><li><b>Au panier</b>La boutique recalcule le prix et vérifie le stock : c'est le panier qui fait foi.</li></ol>
  <p class="pv-small">Pas de demi-mètre : la boutique accepte des quantités entières de 1 à 99. Besoin d'une longueur précise ? Écrivez-nous depuis la page <a href="/contact">contact</a>. Aucune remise au volume n'est appliquée par le thème.</p></div></section>`), sec(footer(c))];
const nuancierPage = (c) => [sec(header(c)), head("Nuancier", "Les coloris", "Six familles de couleurs, quatre motifs."),
  sec(`<section class="pv-nu pk-bleed"><div class="pv-wrap"><div class="pv-sws pv-sws--b">${COLORIS.map((x) => swatch(x, true)).join("")}</div></div></section>`),
  sec(`<section class="pv-sec pk-bleed"><div class="pv-wrap pv-prose"><h2 class="pv-h2">Les quatre motifs</h2><ul class="pv-motifs"><li><b>Cercles</b>Des disques concentriques, comme un cœur de calebasse.</li><li><b>Éventails</b>Des demi-cercles en quinconce.</li><li><b>Losanges</b>Des losanges emboîtés, cernés d'un trait.</li><li><b>Yeux</b>Des ovales ouverts, tournés vers vous.</li></ul><p class="pv-small">Les couleurs à l'écran peuvent différer légèrement du tissu réel.</p></div></section>`), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="pv-sec pk-bleed"><div class="pv-wrap pv-prose"><h2 class="pv-h2">Livraison</h2><p>Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Les tissus voyagent pliés, roulés ou en coupons, selon la quantité.</p><h2 class="pv-h2">Retours</h2><p>Les conditions de retour d'un tissu coupé sont précisées par la boutique avant la commande. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Métrage, coloris, entretien."),
  sec(`<section class="pv-sec pk-bleed"><div class="pv-wrap"><details class="pv-q"><summary>Puis-je commander un demi-mètre ?</summary><p>La boutique accepte des quantités entières. Pour une longueur avec demi-mètre, écrivez-nous depuis la page <a href="/contact">contact</a>.</p></details><details class="pv-q"><summary>Comment est calculé le total d'un tissu au mètre ?</summary><p>Prix du mètre × nombre de mètres, avec le prix promotionnel s'il y en a un. Le panier recalcule et vérifie le stock.</p></details><details class="pv-q"><summary>Qu'est-ce qu'un coupon de 6 yards ?</summary><p>Une pièce de tissu d'environ 5,5 mètres, vendue à l'unité : la quantité est alors un nombre de coupons.</p></details><details class="pv-q"><summary>Comment entretenir un wax ?</summary><p>Lavage à l'envers, eau tiède, sans eau de Javel ; séchage à l'ombre. Les indications exactes figurent sur chaque fiche.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une longueur, un coloris, un projet de couture."), { type: "form", heading: "Écrire à la boutique", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un tissu", "Un motif, un coloris, une matière."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un tissu…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pv-ph pk-bleed"><div class="pv-wrap"><p class="pv-lab">Page introuvable</p><div class="pv-h1 pv-h1--xl" role="heading" aria-level="1">Un fil <em>tiré</em></div><p class="pv-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "pagne-vif", name: "Pagne Vif", version: "1.0.0", category: "ecommerce", tags: ["audacieux", "ludique", "chaleureux", "geometrique"], siteType: "Tissus wax et pagnes au mètre", featured: true,
  concept: "Le marché de tissus en couleurs pleines : motifs wax dessinés dans le thème, mètre ruban gradué, nuancier relié aux vraies variantes, et un calcul de métrage en direct sur la fiche.",
  description: "Tissus wax et pagnes au mètre : fond coton crème, indigo, vermillon et safran, motifs wax en SVG, mètre ruban sous l'en-tête, nuancier relié aux coloris réels et sélecteur de mètres avec total en direct (prix du mètre × mètres entiers).",
  brand: "Pagne Vif", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carte-festonnee-motif-wax-sans-photo", gallery: "grande-image-puis-vignettes-defilantes", cart: "page-dediee-creme-bandeau-wax-bouton-fixe-mobile", catalog: "barre-de-filtres-en-pastilles-de-coloris" },
  dna: {
    header: "bandeau-note-logo-disque-wax-et-metre-ruban-grade", hero: "titre-large-et-trois-rouleaux-de-wax-inclines", grid: "quatre-colonnes-cartes-festonnees-motif-wax", typo: "font.rammetto-one+font.sarabun",
    shapes: "disques-eventails-losanges-et-yeux-wax-bord-festonne", motion: "rouleaux-de-tissu-qui-ondulent-lentement", rhythm: "marche-colore-bandes-indigo-et-creme", signature: "metrage-en-direct-et-nuancier-des-variantes",
    palette: "indigo-vermillon-safran-sur-coton-creme", image: "motifs-wax-svg-generes-sans-photo", list: "cartes-festonnees-prix-du-metre-sous-le-nom",
    article: "colonne-etapes-numerotees-pastilles-vermillon", sidebar: "aucune-marge-de-fabrication", reading: "sarabun-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#e0451c", secondary: "#14246b", accent: "#f7b500", background: "#fff4dc", surface: "#ffffff", text: "#1b1530", muted: "#5b5470", success: "#0f6b3a", warning: "#9a5b00", error: "#b3122b" },
    fonts: { heading: "font.rammetto-one", body: "font.sarabun", button: "font.sarabun", link: "font.sarabun" },
    radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 20 }, shadow: { card: "0 4px 0 #14246b", button: "none" }, border: { width: 2, color: "#14246b" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "vif", label: "Couleur vive (boutons)", type: "color", default: "#e0451c" },
    { key: "indigo", label: "Couleur profonde (titres, bandeaux)", type: "color", default: "#14246b" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "creme", choices: [["creme", "Coton crème"], ["blanc", "Blanc"]] },
    { key: "motif", label: "Motif du titre d'accueil", type: "choice", default: "cercles", choices: [["cercles", "Cercles"], ["eventails", "Éventails"], ["losanges", "Losanges"]] },
    { key: "ruban", label: "Mètre ruban gradué", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "mouvement", label: "Ondulation des rouleaux", type: "choice", default: "on", choices: [["on", "Activée"], ["off", "Désactivée"]] },
    { key: "bords", label: "Bord des cartes", type: "choice", default: "feston", choices: [["feston", "Festonné"], ["droit", "Droit"]] },
    { key: "note", label: "Bandeau d'information", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Métrage", "/metrage"], ["Nuancier", "/nuancier"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "metrage", name: "Métrage", render: metrage }, { key: "nuancier", name: "Nuancier", render: nuancierPage }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
