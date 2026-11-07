// Carré de Soie — maison de carrés, foulards et étoles imprimés. Direction artistique : le motif d'abord. Fond perle rosé, encre violette, quatre grandes couleurs de soie (grenat, outremer,
// émeraude, safran), lisière rayée sous l'en-tête, produits montrés en carrés à ourlet blanc. Composant signature : la VUE DU MOTIF EN PLEIN ÉCRAN AVEC ZOOM — un bloc éditable du Page Builder
// (motifs dessinés en SVG dans le thème, aucune image externe) qui s'ouvre en plein écran (balise details, sans script) et se zoome vraiment (loupe CSS, puis molette, boutons et glissement avec motion.js),
// à côté des vrais produits du moteur de boutique (widget shopgrid : prix, promotions et stock réels).
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

/* ---------- Les motifs (SVG générés : coordonnées entières, pas d'identifiant ni de style en ligne, donc compatibles avec le filtre de sécurité) ---------- */
const MOTIFS = [
  { name: "Jardin de Samarcande", bg: "#1b2a6b", teinte: "Outremer", desc: "Une fleur à quatre pétales dans un losange d'or, répétée en quinconce. Le dessin vient d'un carreau de faïence.", rows: [["Format", "90 × 90 cm"], ["Matière", "Twill de soie, 14 mm"], ["Impression", "Six cadres, sept couleurs"], ["Ourlet", "Roulotté main"]] },
  { name: "Étriers du matin", bg: "#6e0f26", teinte: "Grenat", desc: "Des maillons croisés, bordeaux et or : le motif de sellerie devenu classique. Les maillons alternent, comme une chaîne vue de dessus.", rows: [["Format", "90 × 90 cm"], ["Matière", "Twill de soie, 14 mm"], ["Impression", "Cinq cadres, six couleurs"], ["Ourlet", "Roulotté main"]] },
  { name: "Vagues de Kyoto", bg: "#0d5560", teinte: "Lagon", desc: "Des écailles concentriques qui se recouvrent rangée après rangée, de l'encre au corail. Le motif change de profondeur à chaque zoom.", rows: [["Format", "90 × 90 cm"], ["Matière", "Twill de soie, 12 mm"], ["Impression", "Six cadres, six couleurs"], ["Ourlet", "Roulotté main"]] },
  { name: "Ikat émeraude", bg: "#0b4a3a", teinte: "Émeraude", desc: "Des losanges emboîtés, vert, safran et rouge, dont les bords semblent frangés comme un fil teint avant le tissage.", rows: [["Format", "90 × 90 cm"], ["Matière", "Sergé de soie, 16 mm"], ["Impression", "Quatre cadres, cinq couleurs"], ["Ourlet", "Roulotté main"]] },
];
const R = (n, a, b) => (n % 2 ? a : b);
// n = nombre de carreaux par côté (un carreau = 100 unités) ; fine = filets de détail visibles surtout en zoom
function motifSvg(i, n, label, fine) {
  const W = n * 100;
  let b = "";
  if (i === 0) {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const X = x * 100, Y = y * 100, c = R(x + y, "#d6336c", "#f0a830");
      b += `<path d="M${X + 50} ${Y + 5}L${X + 95} ${Y + 50}L${X + 50} ${Y + 95}L${X + 5} ${Y + 50}Z" fill="none" stroke="#e8b04a" stroke-width="2"/>`
        + `<path d="M${X + 50} ${Y + 14}c10 10 10 22 0 30c-10-8-10-20 0-30zM${X + 86} ${Y + 50}c-10 10-22 10-30 0c8-10 20-10 30 0zM${X + 50} ${Y + 86}c-10-10-10-22 0-30c10 8 10 20 0 30zM${X + 14} ${Y + 50}c10-10 22-10 30 0c-8 10-20 10-30 0z" fill="${c}"/>`
        + `<circle cx="${X + 50}" cy="${Y + 50}" r="5" fill="#f4e6c4"/><circle cx="${X}" cy="${Y}" r="5" fill="#2fb8a8"/>`;
      if (fine) b += `<path d="M${X + 50} ${Y + 5}v6M${X + 95} ${Y + 50}h-6M${X + 50} ${Y + 95}v-6M${X + 5} ${Y + 50}h6" stroke="#f4e6c4" stroke-width="1"/>`;
    }
  } else if (i === 1) {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const X = x * 100, Y = y * 100, h = (x + y) % 2 === 0;
      b += h ? `<rect x="${X + 12}" y="${Y + 34}" width="76" height="32" rx="16" fill="none" stroke="#f3e6cf" stroke-width="6"/>` : `<rect x="${X + 34}" y="${Y + 12}" width="32" height="76" rx="16" fill="none" stroke="#d9a21b" stroke-width="6"/>`;
      b += `<circle cx="${X + 50}" cy="${Y + 50}" r="5" fill="${h ? "#d9a21b" : "#f3e6cf"}"/><circle cx="${X}" cy="${Y}" r="3" fill="#27407a"/>`;
      if (fine) b += `<path d="M${X + 20} ${Y + 50}h8M${X + 72} ${Y + 50}h8" stroke="#6e0f26" stroke-width="1"/>`;
    }
  } else if (i === 2) {
    const rows = n * 2 + 1;
    for (let j = 0; j < rows; j++) {
      const cy = j * 50, off = (j % 2) * 50;
      let r1 = "", r2 = "", r3 = "";
      for (let x = 0; x <= n; x++) {
        const cx = x * 100 + off;
        r1 += `M${cx - 50} ${cy}a50 50 0 1 0 100 0a50 50 0 1 0-100 0`; r2 += `M${cx - 36} ${cy}a36 36 0 1 0 72 0a36 36 0 1 0-72 0`; r3 += `M${cx - 22} ${cy}a22 22 0 1 0 44 0a22 22 0 1 0-44 0`;
      }
      b += `<path d="${r1}" fill="#1b7f86" stroke="#f1e4c8" stroke-width="2"/><path d="${r2}" fill="#0d5560" stroke="#f1e4c8" stroke-width="2"/><path d="${r3}" fill="${R(j, "#e4572e", "#f1e4c8")}" stroke="#f1e4c8" stroke-width="2"/>`;
    }
  } else {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const X = x * 100, Y = y * 100, alt = (x + y) % 2 === 0;
      b += `<polygon points="${X + 50},${Y + 4} ${X + 96},${Y + 50} ${X + 50},${Y + 96} ${X + 4},${Y + 50}" fill="#1f7a5c" stroke="#e9a620" stroke-width="2"/>`
        + `<polygon points="${X + 50},${Y + 24} ${X + 76},${Y + 50} ${X + 50},${Y + 76} ${X + 24},${Y + 50}" fill="${alt ? "#e9a620" : "#f4e6c4"}"/>`
        + `<polygon points="${X + 50},${Y + 38} ${X + 62},${Y + 50} ${X + 50},${Y + 62} ${X + 38},${Y + 50}" fill="#b3261e"/><rect x="${X - 4}" y="${Y - 4}" width="8" height="8" fill="#f4e6c4"/>`;
      if (fine) b += `<path d="M${X + 4} ${Y + 50}h-6M${X + 96} ${Y + 50}h6" stroke="#f4e6c4" stroke-width="1"/>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${W}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(label)}"><rect width="${W}" height="${W}" fill="${MOTIFS[i].bg}"/>${b}</svg>`;
}

// Une planche : vignette + légende (le résumé du détail), et au clic la vue plein écran zoomable.
function planche(i, rev) {
  const m = MOTIFS[i], num = `N° ${String(i + 1).padStart(2, "0")}`;
  return `<article class="cs-plate${rev ? " cs-plate--r" : ""} pk-bleed"><div class="cs-wrap cs-plate-in">
  <details class="cs-motif" data-cs-motif><summary class="cs-sum"><span class="cs-thumb">${motifSvg(i, 2, `Vignette du motif ${m.name}`, false).replace('role="img"', 'aria-hidden="true"').replace(/ aria-label="[^"]*"/, "")}</span><span class="cs-cap"><span class="cs-num">${num}</span><span class="cs-ti">${esc(m.name)}</span><span class="cs-go">Voir le motif en plein écran</span></span><span class="cs-x">Fermer ✕</span></summary>
    <div class="cs-view" role="dialog" aria-label="${esc(m.name)}, motif en plein écran"><div class="cs-stage"><div class="cs-canvas">${motifSvg(i, 5, `Motif ${m.name}, carré de soie`, true)}</div></div>
      <div class="cs-bar"><p class="cs-bar-t"><b>${esc(m.name)}</b><span>${num} · ${esc(m.teinte)}</span></p>
        <details class="cs-zoom"><summary class="cs-zoom-t">Loupe ×3</summary></details>
        <div class="cs-zc" role="group" aria-label="Zoom"><a class="cs-zb" href="#moins" data-cs-z="-1" aria-label="Zoom arrière">−</a><span class="cs-zl" role="status" data-cs-level>100 %</span><a class="cs-zb" href="#plus" data-cs-z="1" aria-label="Zoom avant">+</a><a class="cs-zr" href="#reset" data-cs-z="0">Taille réelle de l'écran</a></div>
        <p class="cs-hint">Défilez pour vous déplacer. Échap ou « Fermer » pour revenir.</p></div></div></details>
  <div class="cs-text"><p class="cs-lab">${num} · Motif</p><h3 class="cs-h3">${esc(m.name)}</h3><p>${esc(m.desc)}</p>
    <dl class="cs-dl">${m.rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl>
    <p><a class="cs-link" href="/boutique">Voir les foulards en boutique</a></p></div></div></article>`;
}

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  mark: `<svg class="cs-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 37 20 20 37 3 20Z" fill="#8f1d5a"/><path d="M20 10 30 20 20 30 10 20Z" fill="#d9a21b"/><path d="M20 16 24 20 20 24 16 20Z" fill="#1b2a6b"/></svg>`,
};
const LIS = `<div class="cs-lis" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
const header = (c) => `<header class="cs-head pk-bleed"><div class="cs-promo">Carrés de 90 cm · ourlet roulotté à la main</div>
  <div class="cs-bar0"><a class="cs-logo" href="/" aria-label="Carré de Soie, accueil">${ICON.mark}<span>Carré de Soie<i>imprimeurs de motifs</i></span></a>
  <div class="cs-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="cs-act"><a class="cs-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="cs-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div>${LIS}</header>`;
const footer = (c) => `<footer class="cs-foot pk-bleed">${LIS}<div class="cs-wrap cs-foot-g">
  <div><p class="cs-lab">Carré de Soie</p><p class="cs-small">Atelier d'impression, Lyon.<br>Du mardi au samedi, 10 h – 18 h.</p></div>
  <div><p class="cs-lab">Boutique</p><p class="cs-fl"><a href="/boutique">Tous les foulards</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="cs-lab">Informations</p><p class="cs-fl">${c.menu.slice(2).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="cs-lab">Entretien</p><p class="cs-small">Nettoyage à sec ou lavage à la main, 30 °C, sans essorer. Repassage à l'envers, fer doux.</p></div></div>
  <p class="cs-copy">© Carré de Soie — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="cs-ph pk-bleed"><div class="cs-wrap cs-narrow"><p class="cs-lab">${esc(kicker)}</p><div class="cs-h1" role="heading" aria-level="1">${esc(title)}</div><p class="cs-lead">${esc(lead)}</p></div></section>`);
const band = (kicker, title) => sec(`<section class="cs-sec pk-bleed"><div class="cs-wrap"><p class="cs-lab">${esc(kicker)}</p><h2 class="cs-h2">${esc(title)}</h2></div></section>`);

const etapes = () => sec(`<section class="cs-sec cs-steps pk-bleed"><div class="cs-wrap"><p class="cs-lab">Du dessin au carré</p><h2 class="cs-h2">Quatre gestes, un motif</h2>
  <ol class="cs-ol"><li><b>Dessiner</b>Le motif est dessiné sur papier, puis séparé en couleurs : une couleur, un cadre.</li><li><b>Graver</b>Chaque cadre est gravé à la main. Un carré peut en demander six ou sept.</li><li><b>Imprimer</b>La soie est tendue sur la table, les couleurs sont posées l'une après l'autre.</li><li><b>Ourler</b>Les quatre bords sont roulottés à la main, à la pointe de l'aiguille.</li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="cs-hero pk-bleed"><div class="cs-wrap cs-hero-in"><div class="cs-hero-t"><p class="cs-lab">Collection du moment</p><div class="cs-h1 cs-h1--xl" role="heading" aria-level="1">Le motif<br><em>avant tout</em></div><p class="cs-lead">Des carrés de soie de 90 cm, dessinés, gravés et imprimés en petites séries. Ouvrez un motif en plein écran, zoomez jusqu'au fil, puis choisissez-le en boutique.</p><p><a class="cs-btn" href="/boutique">Découvrir les carrés</a> <a class="cs-link" href="/motifs">Voir les motifs en grand</a></p></div>
    <div class="cs-hero-sq" aria-hidden="true"><div class="cs-hero-cloth">${motifSvg(0, 3, "", false).replace('role="img"', 'aria-hidden="true"').replace(/ aria-label="[^"]*"/, "")}</div></div></div></section>`),
  band("Les carrés", "Choisis par l'atelier"),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "1/1" })),
  band("Signature", "Les motifs, en plein écran"),
  sec(planche(0, false)), sec(planche(1, true)),
  sec(`<section class="cs-sec pk-bleed"><div class="cs-wrap cs-center"><a class="cs-btn" href="/motifs">Voir les quatre motifs</a></div></section>`),
  etapes(),
  band("Nouveautés", "Derniers carrés arrivés"),
  wrap(shopgrid({ source: "newest", count: 3, columns: "3", orderby: "newest", ratio: "1/1" })),
  sec(footer(c))];

const motifs = (c) => [sec(header(c)), head("Les motifs", "Quatre motifs à regarder de près", "Cliquez sur une vignette : le motif s'ouvre en plein écran. La loupe agrandit sans perdre en finesse."),
  sec(planche(0, false)), sec(planche(1, true)), sec(planche(2, false)), sec(planche(3, true)), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="cs-sec pk-bleed"><div class="cs-wrap cs-narrow cs-prose"><h2 class="cs-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Chaque carré est plié dans du papier de soie, à plat.</p><h2 class="cs-h2">Retours</h2><p>Vous disposez de quatorze jours pour nous retourner un carré non porté et non repassé. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p><h2 class="cs-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Format, entretien, couleurs."),
  sec(`<section class="cs-sec pk-bleed"><div class="cs-wrap cs-narrow"><details class="cs-q"><summary>Quelle est la taille d'un carré ?</summary><p>Nos grands carrés mesurent 90 × 90 cm. Les foulards plus petits indiquent leur format sur la fiche produit.</p></details><details class="cs-q"><summary>Les couleurs de l'écran sont-elles fidèles ?</summary><p>À peu près : la soie imprimée a un éclat que les écrans rendent mal. La vue plein écran sert à voir le dessin, pas à garantir la nuance.</p></details><details class="cs-q"><summary>Comment entretenir ma soie ?</summary><p>Nettoyage à sec, ou lavage à la main à 30 °C sans essorer. Repassez à l'envers, à fer doux.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur un motif, une taille, une commande."),
  { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un carré", "Un motif, un coloris, un format."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un carré…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cs-ph pk-bleed"><div class="cs-wrap cs-narrow"><p class="cs-lab">Page introuvable</p><div class="cs-h1 cs-h1--xl" role="heading" aria-level="1">Fil tiré</div><p class="cs-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "carre-soie", name: "Carré de Soie", version: "1.0.0", category: "luxe", tags: ["luxe", "audacieux", "editorial"], siteType: "Maison de carrés et foulards de soie imprimés", featured: false,
  concept: "Le motif d'abord : des carrés de soie montrés en carrés, une lisière rayée sous l'en-tête et une vue du motif en plein écran que l'on peut zoomer jusqu'au fil.",
  description: "Soie et foulards de luxe : fond perle rosé, quatre grandes couleurs de soie, motifs dessinés en SVG ouvrables en plein écran avec zoom, produits en carrés à ourlet blanc, boutique réelle.",
  brand: "Carré de Soie", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carre-ourlet-blanc-legende-gauche", gallery: "image-carree-large-collante", cart: "page-dediee-perle", catalog: "filtres-en-bandeau-sous-lisiere" },
  dna: {
    header: "logo-a-gauche-menu-central-et-lisiere-rayee", hero: "carre-suspendu-en-biais-qui-ondule", grid: "trois-colonnes-carrees-ourlet-blanc", typo: "crimson-pro-italique+kumbh-sans", shapes: "carre-et-ourlet-blanc-lisiere-rayee",
    motion: "ondulation-lente-du-tissu", rhythm: "planches-numerotees-alternees", signature: "vue-du-motif-plein-ecran-avec-zoom",
    palette: "perle-rosee-encre-violette-grenat-outremer-emeraude-safran", image: "motifs-svg-generes-sans-photo-et-vignettes-a-ourlet", list: "planches-numerotees-vignette-legende-et-fiche-technique",
    article: "planche-motif-avec-fiche-format-matiere-impression-ourlet", sidebar: "aucune-vue-plein-ecran-a-la-place", reading: "colonne-de-62-caracteres-corps-17-px-chapeau-en-italique",
  },
  tokens: {
    colors: { primary: "#8f1d5a", secondary: "#1b2a6b", accent: "#d9a21b", background: "#f6f0f4", surface: "#fffaf8", text: "#1e1830", muted: "#615a70", success: "#2f6f4f", warning: "#8a6a12", error: "#a82a2a" },
    fonts: { heading: "font.crimson-pro", body: "font.kumbh-sans", button: "font.kumbh-sans", link: "font.kumbh-sans" },
    radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "0 10px 26px rgba(30,24,48,.14)", button: "none" }, border: { width: 1, color: "#dccfd8" },
    type: { h1: { size: 60, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 34, weight: 500, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'or (filets, lisière)", type: "color", default: "#d9a21b" },
    { key: "teinte", label: "Grande couleur de soie", type: "choice", default: "grenat", choices: [["grenat", "Grenat"], ["outremer", "Outremer"], ["emeraude", "Émeraude"], ["safran", "Safran"]] },
    { key: "fond", label: "Fond", type: "choice", default: "perle", choices: [["perle", "Perle rosé"], ["ivoire", "Ivoire"], ["blanc", "Blanc"]] },
    { key: "titres", label: "Titres", type: "choice", default: "italique", choices: [["italique", "Italique élégant"], ["droit", "Droits"]] },
    { key: "lisiere", label: "Lisière rayée", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "ourlet", label: "Ourlet blanc des images", type: "choice", default: "on", choices: [["on", "Avec ourlet"], ["off", "Sans ourlet"]] },
    { key: "format", label: "Format des images de produits", type: "choice", default: "carre", choices: [["carre", "Carré"], ["portrait", "Portrait"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Les motifs", "/motifs"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "motifs", name: "Les motifs", render: motifs },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
