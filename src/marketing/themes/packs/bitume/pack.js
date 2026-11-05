// Bitume — marque de streetwear urbain (fictive). Direction artistique : mur d'affiches collées, photocopie, scotch, autocollants.
// Béton, orange vif, noir bitume, blanc papier ; typographie massive. Drops avec compte à rebours, fiches vêtements dessinés en SVG, liste d'alerte.
const { sec, esc, nav } = require("../kit");

/* ---------- vêtements dessinés (SVG) ---------- */
const GARM = {
  tee: `<path class="bt-g" d="M62 28 82 20c4 10 12 15 18 15s14-5 18-15l20 8 40 34-22 26-18-14v138H62V74L44 88 22 62z"/><path d="M82 20c4 10 12 15 18 15s14-5 18-15" fill="none"/><rect class="bt-pr" x="76" y="92" width="48" height="34"/><path class="bt-pn" d="M82 100h36M82 108h26M82 116h32" fill="none"/>`,
  hoodie: `<path class="bt-g" d="M64 40 84 26c4 12 10 20 16 20s12-8 16-20l20 14 44 44-12 100-24-4v36H60v-36l-24 4L24 84z"/><path class="bt-g" d="M84 26C78 12 88 2 100 2s22 10 16 24c-4 12-10 20-16 20s-12-8-16-20z"/><ellipse cx="100" cy="28" rx="9" ry="13" fill="#111"/><path class="bt-g" d="M74 152h52l8 32H66z"/><path d="M92 46v34M108 46v34" fill="none"/><circle class="bt-pr" cx="100" cy="116" r="12"/>`,
  jacket: `<path class="bt-g" d="M66 32 88 22l12 14 12-14 22 10 44 46-10 108-24-4v22H56v-22l-24 4L22 78z"/><path d="M88 22l12 14 12-14M100 36v168" fill="none"/><rect class="bt-pr" x="112" y="70" width="22" height="10"/><path d="M70 150l18 22M130 150l-18 22" fill="none"/><path class="bt-pn" d="M34 150l-4 28M166 150l4 28" fill="none"/>`,
  cargo: `<path class="bt-g" d="M58 18h84l8 190h-48l-2-118-2 118H50z"/><path class="bt-pn" d="M58 18h84v16H58z"/><path d="M100 34v56" fill="none"/><rect class="bt-pr" x="62" y="104" width="26" height="36"/><rect class="bt-pr" x="112" y="104" width="26" height="36"/><path d="M62 112h26M112 112h26" fill="none"/>`,
  cap: `<path class="bt-g" d="M28 134C28 84 56 50 100 50s72 34 72 84z"/><path class="bt-g" d="M24 134h142c16 0 28 6 32 14-28 10-72 12-118 12H24z"/><circle cx="100" cy="50" r="6" class="bt-pr"/><path d="M100 54c-14 22-18 50-14 80" fill="none"/><rect class="bt-pr" x="116" y="86" width="30" height="22"/>`,
};
const garm = (t, col = "beton", label = "") => `<svg class="bt-garm bt-c-${col}" viewBox="0 0 220 230" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><g transform="translate(10 8)">${GARM[t]}</g></svg>`;

const PROD = [
  { id: "veste", n: "01", name: "Veste Chantier", t: "jacket", price: "129 €", col: [["beton", "Béton", "#8d8a84"], ["goudron", "Goudron", "#1b1b1b"], ["orange", "Orange chantier", "#ff5a00"]], out: "XXL",
    desc: "Coach jacket en nylon enduit : col montant, deux poches zippées, bande réfléchissante dans le dos. Se plie dans sa propre poche.", mat: "Nylon enduit 100 %, doublure maillée", fit: "Droite, légèrement ample", serie: "400 pièces numérotées" },
  { id: "hoodie", n: "02", name: "Hoodie Béton", t: "hoodie", price: "89 €", col: [["beton", "Béton", "#8d8a84"], ["goudron", "Goudron", "#1b1b1b"], ["blanc", "Blanc papier", "#efeadc"]], out: "XS",
    desc: "Molleton épais 450 g, capuche doublée, poche kangourou et sérigraphie « rond » sur la poitrine, tirée à la main.", mat: "Coton biologique 100 %, 450 g/m²", fit: "Ample, épaules tombantes", serie: "600 pièces" },
  { id: "cargo", n: "03", name: "Cargo Goudron", t: "cargo", price: "99 €", col: [["goudron", "Goudron", "#1b1b1b"], ["beton", "Béton", "#8d8a84"], ["orange", "Orange chantier", "#ff5a00"]], out: "XS",
    desc: "Pantalon large en toile de coton, six poches dont deux à soufflet, ourlets réglables par cordon.", mat: "Toile de coton 100 %, 320 g/m²", fit: "Large, taille mi-haute", serie: "500 pièces" },
  { id: "tee", n: "04", name: "Tee Photocopie", t: "tee", price: "39 €", col: [["blanc", "Blanc papier", "#efeadc"], ["goudron", "Goudron", "#1b1b1b"], ["orange", "Orange chantier", "#ff5a00"]], out: "XXL",
    desc: "T-shirt boxy imprimé façon photocopie ratée : trame de points, bords baveux, chaque tirage est un peu différent.", mat: "Jersey de coton 100 %, 240 g/m²", fit: "Boxy, court", serie: "800 pièces" },
  { id: "casquette", n: "05", name: "Casquette Palette", t: "cap", price: "35 €", col: [["goudron", "Goudron", "#1b1b1b"], ["orange", "Orange chantier", "#ff5a00"], ["blanc", "Blanc papier", "#efeadc"]], out: "",
    desc: "Casquette six panneaux, visière courbée, patch brodé et fermeture à boucle métal. Taille unique.", mat: "Coton twill 100 %", fit: "Taille unique réglable", serie: "700 pièces" },
];
const P = Object.fromEntries(PROD.map((p) => [p.id, p]));

const SW = (c) => c.map(([k, n, h], i) => `<a class="bt-sw bt-sw-${k}${i ? "" : " is-on"}" href="#couleur" role="button" aria-pressed="${i ? "false" : "true"}" aria-label="${esc(n)}" data-sw="${h}" data-swn="${esc(n)}"></a>`).join("");

/* ---------- ouvertures communes ---------- */
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-7 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>`;
const logoMark = `<svg class="bt-logo-svg" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#ff5a00" stroke="#111" stroke-width="4"/><path d="M20 14h14c8 0 12 4 12 9 0 4-3 7-7 8 5 1 8 4 8 9 0 6-5 10-13 10H20z" fill="#111"/><path d="M28 21v8h5c3 0 4-1.500 4-4s-1.500-4-4-4zM28 36v8h6c3 0 5-1.500 5-4s-2-4-5-4z" fill="#ff5a00"/></svg>`;
const SHORT = [["Drops", "/drops"], ["Produit", "/produit"], ["Lookbook", "/lookbook"], ["Collabs", "/collabs"], ["Magasins", "/magasins"], ["Taille", "/taille"], ["Contact", "/contact"]];
const stickers = (cls = "") => SHORT.map(([l, u]) => `<a class="bt-st ${cls}" href="${u}">${l}</a>`).join("");
const TAPE = "AUCUN RÉASSORT ✕ SÉRIES NUMÉROTÉES ✕ SITE DE DÉMONSTRATION ✕ ";

const header = (c) => `<header class="bt-head pk-bleed"><div class="bt-tape" aria-hidden="true"><div class="bt-tape-in"><span>${TAPE.repeat(4)}</span><span>${TAPE.repeat(4)}</span></div></div>
  <div class="bt-bar"><a class="bt-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span>BITUME</span></a>
    <div class="bt-nav" role="navigation" aria-label="Navigation principale">${stickers()}<a class="bt-st bt-st--alert" href="/drops">Alerte <b data-alert-count>0</b></a></div>
    <details class="bt-burger"><summary aria-label="Ouvrir le menu"><span>Menu</span></summary><div class="bt-drawer" role="navigation" aria-label="Menu mobile"><a class="bt-st" href="/">Accueil</a>${stickers()}<a class="bt-st bt-st--alert" href="/drops">Alerte <b data-alert-count>0</b></a></div></details></div></header>`;

const footer = (c) => `<footer class="bt-foot pk-bleed"><div class="bt-foot-word" aria-hidden="true">BITUME</div>
  <div class="bt-foot-grid"><div><p class="bt-foot-lead">Fait dans la rue, pour la rue. Jamais réassorti.</p><address>Bitume Street Supply<br>14 rue du Goudron<br>69003 Lyon</address></div>
  <div><h2 class="bt-foot-h">Collection</h2>${nav([{ label: "Drops", url: "/drops" }, { label: "Produit", url: "/produit" }, { label: "Lookbook", url: "/lookbook" }, { label: "Collabs", url: "/collabs" }], "bt-fl")}</div>
  <div><h2 class="bt-foot-h">Aide</h2>${nav([{ label: "Magasins", url: "/magasins" }, { label: "Taille & livraison", url: "/taille" }, { label: "Contact", url: "/contact" }, { label: "Recherche", url: "/recherche" }], "bt-fl")}</div>
  <div><h2 class="bt-foot-h">Rester au courant</h2><p class="bt-foot-p">Pas de newsletter : une liste d'alerte, un message le jour du drop.</p><a class="bt-btn bt-btn--acc" href="/drops">Ma liste d'alerte ${arrow}</a></div></div>
  <p class="bt-legal">© Bitume Street Supply — site de démonstration. Marque, produits, magasins, prix et collaborations fictifs ; aucune commande n'est enregistrée.</p></footer>`;

const pagehead = (kicker, title, sub, tone = "") => sec(`<section class="bt-ph pk-bleed ${tone}"><div class="bt-wrap"><p class="bt-kick" data-reveal>${esc(kicker)}</p><div class="bt-giant" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="bt-ph-sub bt-paper" data-reveal>${esc(sub)}</p>` : ""}</div><span class="bt-scrap bt-scrap--1" aria-hidden="true"></span><span class="bt-scrap bt-scrap--2" aria-hidden="true"></span></section>`);

/* ---------- briques de contenu ---------- */
const clock = `<div class="bt-clock" data-clock><span><b data-u="d">00</b><i>jours</i></span><span><b data-u="h">00</b><i>heures</i></span><span><b data-u="m">00</b><i>min</i></span><span><b data-u="s">00</b><i>sec</i></span></div>`;
const nextBox = (cls = "") => `<aside class="bt-next ${cls}" data-next aria-label="Prochain drop"><p class="bt-next-k" data-next-k>Prochain drop</p><p class="bt-next-n" data-next-n>Veste Chantier</p><p class="bt-next-d" data-next-d>Calendrier de démonstration</p>${clock}<a class="bt-btn bt-btn--acc bt-btn--block" href="/drops">Tous les drops ${arrow}</a></aside>`;

const dropCard = (p, big = false) => `<article class="bt-card${big ? " bt-card--big" : ""}" data-drop="${p.id}" data-state="soon" data-reveal>
  <div class="bt-card-art bt-paper">${garm(p.t, p.col[0][0])}<span class="bt-badge" data-badge>Bientôt</span><span class="bt-no">N°${p.n}</span></div>
  <div class="bt-card-body"><h3 class="bt-card-h">${p.name}</h3><p class="bt-price">${p.price} <small>prix indicatif</small></p>
    <p class="bt-cd"><span data-cdlabel>Ouvre dans</span> <b data-cd>à venir</b></p>
    <div class="bt-card-act"><a class="bt-btn bt-btn--ink" href="/produit#${p.id}">Voir la fiche</a><a class="bt-btn bt-btn--line" href="#alerte" role="button" aria-pressed="false" data-alert="${p.id}">M'alerter</a></div></div></article>`;

const poster = (cls, inner) => `<div class="bt-poster ${cls} bt-paper" aria-hidden="true">${inner}</div>`;
const halftone = `<span class="bt-halftone"></span>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="bt-hero pk-bleed" data-hero>
    <div class="bt-wall">
      ${poster("bt-p1 bt-p--acc", `<span class="bt-p-big">DROP<br>05</span><span class="bt-p-sm">SÉRIE LIMITÉE</span>`)}
      ${poster("bt-p3 bt-p--ink", `<span class="bt-p-mid">PAS<br>DE<br>RÉASSORT</span>${halftone}`)}
      ${poster("bt-p2 bt-p--white", `<span class="bt-tapepc bt-tapepc--a"></span>${garm("jacket", "orange")}<span class="bt-p-cap">VESTE CHANTIER</span>`)}
      ${poster("bt-p5 bt-p--con", `<span class="bt-tapepc bt-tapepc--b"></span>${garm("hoodie", "goudron")}<span class="bt-p-cap">HOODIE BÉTON</span>`)}
      ${poster("bt-p4 bt-p--white", `<span class="bt-p-mid bt-p-mid--ink">RUE<br>SALE<br>LOCAL</span>${halftone}`)}
      ${poster("bt-p6 bt-p--acc", `<span class="bt-p-sm">SAM. 18 H 00</span><span class="bt-barcode"></span>`)}
      ${poster("bt-p7 bt-p--ink", `${garm("cap", "orange")}<span class="bt-p-cap bt-p-cap--l">PALETTE</span>`)}
    </div>
    <div class="bt-hero-copy"><p class="bt-kick bt-kick--tag" data-reveal>Streetwear · Séries limitées · Lyon</p>
      <div class="bt-mega" role="heading" aria-level="1" data-reveal>BITUME</div>
      <p class="bt-lede bt-paper" data-reveal>Des vêtements faits comme on colle une affiche : vite, en grand, et on n'y revient pas. Cinq drops par saison, des séries numérotées, jamais de réassort.</p>
      <div class="bt-actions" data-reveal><a class="bt-btn bt-btn--ink bt-btn--lg" href="/drops">Voir les drops ${arrow}</a><a class="bt-btn bt-btn--white bt-btn--lg" href="/lookbook">Le lookbook</a></div></div>
    ${nextBox("bt-next--hero")}</section>`),
  sec(`<section class="bt-marq pk-bleed" aria-hidden="true"><div class="bt-marq-in"><span>PAS DE MODE ✕ DE LA RUE ✕ PAS DE MODE ✕ DE LA RUE ✕ PAS DE MODE ✕ DE LA RUE ✕ </span><span>PAS DE MODE ✕ DE LA RUE ✕ PAS DE MODE ✕ DE LA RUE ✕ PAS DE MODE ✕ DE LA RUE ✕ </span></div></section>`),
  sec(`<section class="bt-sec bt-sec--drops pk-bleed"><div class="bt-wrap"><div class="bt-sechead"><h2 class="bt-h2" data-reveal>Les drops</h2><p class="bt-sub" data-reveal>État calculé d'après l'horloge : bientôt, en ligne, épuisé. Le calendrier de démonstration se répète toutes les quatre semaines.</p></div>
    <div class="bt-grid bt-grid--home">${["veste", "hoodie", "cargo"].map((k) => dropCard(P[k])).join("")}</div>
    <p class="bt-more" data-reveal><a class="bt-btn bt-btn--ink" href="/drops">Les cinq drops de la saison ${arrow}</a></p></div></section>`),
  sec(`<section class="bt-man pk-bleed"><div class="bt-wrap bt-man-in"><div class="bt-man-txt"><p class="bt-kick bt-kick--w" data-reveal>Manifeste</p><h2 class="bt-h2 bt-h2--w" data-reveal>Fait pour durer plus que le hype.</h2>
    <p class="bt-man-p" data-reveal>On imprime à la main dans un atelier de Villeurbanne, on coupe dans des tissus lourds et on arrête une pièce quand la série est vendue. Pas de soldes, pas de stock dormant : ce qui reste est à vous.</p></div>
    <ul class="bt-stats"><li data-reveal><b data-count="5">5</b><span>drops par saison</span></li><li data-reveal><b data-count="400">400</b><span>pièces par série, pas une de plus</span></li><li data-reveal><b data-count="6">6</b><span>tailles, du XS au XXL</span></li></ul></div></section>`),
  sec(`<section class="bt-strip pk-bleed"><div class="bt-wrap"><div class="bt-sechead"><h2 class="bt-h2" data-reveal>Sur le mur</h2><a class="bt-btn bt-btn--ink" href="/lookbook" data-reveal>Tout le lookbook ${arrow}</a></div>
    <div class="bt-strip-row">
      <figure class="bt-fig bt-paper" data-reveal>${look("nuit", "#ff5a00", "#1b1b1b", 0)}<figcaption>Look 01 — Veste Chantier, Cargo Goudron</figcaption></figure>
      <figure class="bt-fig bt-paper" data-reveal>${look("chantier", "#8d8a84", "#1b1b1b", 1)}<figcaption>Look 02 — Hoodie Béton</figcaption></figure>
      <figure class="bt-fig bt-paper" data-reveal>${look("parking", "#efeadc", "#8d8a84", 2)}<figcaption>Look 03 — Tee Photocopie</figcaption></figure></div></div></section>`),
  sec(`<section class="bt-duo pk-bleed"><div class="bt-wrap bt-duo-in">
    <article class="bt-duo-a bt-paper" data-reveal><p class="bt-kick">Collabs</p><h2 class="bt-h3">Avec ceux qui collent, impriment et découpent.</h2><p>Sérigraphes, clubs de boxe, web-radios : quatre collaborations, chacune une pièce, chacune une fois.</p><a class="bt-btn bt-btn--ink" href="/collabs">Voir les collabs ${arrow}</a></article>
    <article class="bt-duo-b" data-reveal><p class="bt-kick bt-kick--w">Points de vente</p><h2 class="bt-h3 bt-h3--w">Deux boutiques, trois revendeurs, un pop-up.</h2><p>Essayez avant le drop : horaires et statut ouvert / fermé en direct.</p><a class="bt-btn bt-btn--acc" href="/magasins">Trouver un point de vente ${arrow}</a></article></div></section>`),
  sec(`<section class="bt-cta pk-bleed"><div class="bt-wrap bt-cta-in"><div class="bt-giant bt-giant--s" data-reveal>Ne rate pas le prochain.</div><p class="bt-cta-p" data-reveal>Ajoute tes pièces à la liste d'alerte, puis envoie-la-nous par le formulaire de contact : nous te prévenons le jour de l'ouverture.</p><div class="bt-actions" data-reveal><a class="bt-btn bt-btn--ink bt-btn--lg" href="/drops">Ma liste d'alerte ${arrow}</a><a class="bt-btn bt-btn--white bt-btn--lg" href="/contact">Écrire à Bitume</a></div></div></section>`),
  sec(footer(c))];

/* ---------- scènes de lookbook ---------- */
function look(kind, g, pc, v) {
  const bg = { nuit: `<rect width="240" height="300" fill="#15151a"/><circle cx="188" cy="62" r="56" fill="#ff5a00" opacity=".22"/><circle cx="188" cy="62" r="26" fill="#ff5a00" opacity=".4"/><rect x="185" y="60" width="6" height="200" fill="#3a3a42"/><path d="M168 56h40l-8 14h-24z" fill="#3a3a42"/><rect y="252" width="240" height="48" fill="#0a0a0c"/><path d="M0 266h240M0 282h240" stroke="#2a2a30" stroke-width="2"/>`,
    chantier: `<rect width="240" height="300" fill="#bdb8ae"/><path d="M20 0v250M70 0v250M20 60h50M20 130h50M20 200h50M20 60l50 70M70 60l-50 70" stroke="#6b6860" stroke-width="3" fill="none"/><rect y="250" width="240" height="50" fill="#8d8a84"/><path d="M0 262h30l-12 24H0zM60 262h30l-12 24H48zM120 262h30l-12 24h-30zM180 262h30l-12 24h-30z" fill="#ff5a00"/>`,
    parking: `<rect width="240" height="300" fill="#8d8a84"/><path d="M30 150 0 300M90 150 70 300M150 150l20 150M210 150l30 150M0 150h240" stroke="#efeadc" stroke-width="4" fill="none"/><path d="M200 200l12-38 12 38z" fill="#ff5a00" stroke="#111" stroke-width="3"/><rect y="0" width="240" height="140" fill="#2a2a2e"/><path d="M0 0h240M40 0v140M120 0v140M200 0v140" stroke="#3d3d44" stroke-width="3"/>` }[kind];
  const x = [0, -14, 12][v % 3];
  return `<svg class="bt-look" viewBox="0 0 240 300" role="img" aria-label="Silhouette en tenue Bitume, scène ${kind}">${bg}<g transform="translate(${x} 0)"><circle cx="120" cy="84" r="17" fill="#111" stroke="#efeadc" stroke-width="3"/><path d="M90 112h60l14 84h-18l-4-34h-44l-4 34H76z" fill="${g}" stroke="#111" stroke-width="4" stroke-linejoin="round"/><path d="M98 160h44l6 96h-20l-8-70-8 70H92z" fill="${pc}" stroke="#111" stroke-width="4" stroke-linejoin="round"/><path d="M88 258h26v10H84zM126 258h26l4 10h-30z" fill="#efeadc" stroke="#111" stroke-width="3"/></g></svg>`;
}
const LOOKS = [["nuit", "#ff5a00", "#1b1b1b", "Veste Chantier, Cargo Goudron"], ["chantier", "#8d8a84", "#1b1b1b", "Hoodie Béton"], ["parking", "#efeadc", "#8d8a84", "Tee Photocopie"], ["chantier", "#1b1b1b", "#8d8a84", "Veste Chantier Goudron"], ["parking", "#ff5a00", "#1b1b1b", "Tee orange, Cargo"], ["nuit", "#efeadc", "#1b1b1b", "Hoodie Blanc papier"], ["parking", "#1b1b1b", "#ff5a00", "Cargo Orange"], ["nuit", "#8d8a84", "#8d8a84", "Total béton"], ["chantier", "#efeadc", "#ff5a00", "Tee Photocopie, Cargo Orange"]];

/* ---------- pages ---------- */
const drops = (c) => [sec(header(c)), pagehead("Saison en cours", "Les drops", "Cinq ouvertures, un calendrier. Ici, aucune vente : la liste d'alerte part vers le formulaire de contact."),
  sec(`<section class="bt-sec pk-bleed bt-sec--now"><div class="bt-wrap bt-now">${nextBox("bt-next--wide")}
    <div class="bt-tl bt-paper" data-reveal><h2 class="bt-h3">Le calendrier, sur 28 jours</h2><div class="bt-tl-bar" data-tl><span class="bt-seg bt-seg1"><i>01</i></span><span class="bt-seg bt-seg2"><i>02</i></span><span class="bt-seg bt-seg3"><i>03</i></span><span class="bt-seg bt-seg4"><i>04</i></span><span class="bt-seg bt-seg5"><i>05</i></span><span class="bt-now-mark" data-nowmark><em>Maintenant</em></span></div>
      <p class="bt-tl-n">Barre = fenêtres d'ouverture des drops 01 à 05. Le curseur marque l'instant présent ; le cycle se répète pour la démonstration.</p></div></div></section>`),
  sec(`<section class="bt-sec pk-bleed bt-sec--list"><div class="bt-wrap"><div class="bt-filters" role="group" aria-label="Filtrer les drops" data-filters="state">
    <a class="bt-chip is-on" href="#tous" data-f="all" role="button" aria-pressed="true">Tous</a><a class="bt-chip" href="#en-ligne" data-f="live" role="button" aria-pressed="false">En ligne</a><a class="bt-chip" href="#bientot" data-f="soon" role="button" aria-pressed="false">Bientôt</a><a class="bt-chip" href="#epuise" data-f="out" role="button" aria-pressed="false">Épuisé</a></div>
    <p class="bt-empty" data-empty>Rien dans cet état pour l'instant : revenez plus tard ou changez de filtre.</p>
    <div class="bt-grid">${PROD.map((p) => dropCard(p)).join("")}</div></div></section>`),
  sec(`<section class="bt-sec pk-bleed bt-alertsec"><div class="bt-wrap"><aside class="bt-alert bt-paper" data-reveal><div class="bt-alert-l"><p class="bt-kick">Liste d'alerte</p><h2 class="bt-h3" data-alert-h>Ma liste d'alerte</h2>
    <p class="bt-sub">Touchez « M'alerter » sur une pièce pour l'ajouter. Rien n'est réservé ni payé : la liste se transmet par le formulaire de contact.</p></div>
    <div class="bt-alert-r"><ul class="bt-alert-list" data-alertlist aria-live="polite"></ul><p class="bt-alert-empty" data-alertempty>Aucune pièce pour l'instant.</p><a class="bt-btn bt-btn--acc bt-btn--block" href="/contact" data-alertsend>Envoyer ma liste ${arrow}</a></div></aside></div></section>`),
  sec(`<section class="bt-sec pk-bleed bt-faq"><div class="bt-wrap bt-faq-in"><h2 class="bt-h2" data-reveal>Comment ça marche</h2><div class="bt-faq-l">
    <details data-reveal><summary>Qu'est-ce qu'un drop ?</summary><p>Une pièce, une fenêtre d'ouverture, une série numérotée. Quand la série est vendue ou la fenêtre refermée, la pièce est épuisée pour de bon.</p></details>
    <details data-reveal><summary>Pourquoi aucun réassort ?</summary><p>Parce que la rareté fait partie du projet : on préfère moins produire et mieux. Une pièce épuisée ne revient pas.</p></details>
    <details data-reveal><summary>Puis-je acheter sur ce site ?</summary><p>Non, c'est une démonstration : aucun paiement, aucune réservation. Le formulaire de contact reçoit votre liste d'alerte.</p></details></div></div></section>`),
  sec(footer(c))];

const stage = (p) => `<div class="bt-stage bt-paper" data-stage><span class="bt-tapepc bt-tapepc--a" aria-hidden="true"></span><span class="bt-tapepc bt-tapepc--b" aria-hidden="true"></span>${garm(p.t, p.col[0][0], `${p.name}, dessin du vêtement`)}<span class="bt-no">N°${p.n}</span></div>`;
const panel = (p) => `<article class="bt-pp" data-prodpanel="${p.id}" data-drop="${p.id}" data-state="soon">
  ${stage(p)}
  <div class="bt-pinfo"><p class="bt-kick">Drop ${p.n} · <span data-badge>Bientôt</span></p><h2 class="bt-h2 bt-h2--prod">${p.name}</h2><p class="bt-price bt-price--l">${p.price} <small>prix indicatif, aucune vente</small></p>
    <p class="bt-cd bt-cd--l"><span data-cdlabel>Ouvre dans</span> <b data-cd>à venir</b></p><p class="bt-pdesc">${p.desc}</p>
    <p class="bt-pl">Couleur : <b data-swname>${p.col[0][1]}</b></p><div class="bt-sws" role="group" aria-label="Couleurs">${SW(p.col)}</div>
    <p class="bt-pl">Taille : <b data-sizename>à choisir</b></p><div class="bt-sizes" role="group" aria-label="Tailles">${(p.id === "casquette" ? ["Unique"] : ["XS", "S", "M", "L", "XL", "XXL"]).map((s) => `<a class="bt-size${s === p.out ? " is-out" : ""}" href="#taille" role="button" aria-pressed="false" data-size="${s}"${s === p.out ? ' aria-label="' + s + ', série épuisée dans cette taille"' : ""}>${s}</a>`).join("")}</div>
    <dl class="bt-dl"><div><dt>Matière</dt><dd>${p.mat}</dd></div><div><dt>Coupe</dt><dd>${p.fit}</dd></div><div><dt>Série</dt><dd>${p.serie}</dd></div></dl>
    <div class="bt-sum" aria-live="polite"><p class="bt-sum-t" data-sum>Choisissez une taille pour composer votre message.</p></div>
    <div class="bt-card-act"><a class="bt-btn bt-btn--acc" href="/contact" data-send>Envoyer à Bitume ${arrow}</a><a class="bt-btn bt-btn--line" href="#alerte" role="button" aria-pressed="false" data-alert="${p.id}">M'alerter</a><a class="bt-btn bt-btn--line" href="/taille">Guide des tailles</a></div></div></article>`;
const produit = (c) => [sec(header(c)), pagehead("Fiche pièce", "Produit", "Cinq pièces dessinées à la main : couleur, taille, résumé prêt à envoyer."),
  sec(`<section class="bt-sec pk-bleed bt-prod"><div class="bt-wrap"><div class="bt-ptabs" role="group" aria-label="Choisir une pièce" data-ptabs>${PROD.map((p, i) => `<a class="bt-ptab${i ? "" : " is-on"}" href="#${p.id}" role="button" aria-pressed="${i ? "false" : "true"}" data-ptab="${p.id}">${garm(p.t, p.col[0][0])}<span>${p.name}</span></a>`).join("")}</div>
    <div class="bt-panels">${PROD.slice(0, 3).map(panel).join("")}${PROD.slice(3).map(panel).join("")}</div></div></section>`),
  sec(`<section class="bt-sec pk-bleed bt-note"><div class="bt-wrap bt-note-in"><article class="bt-paper bt-nbox" data-reveal><h2 class="bt-h3">Soin des pièces</h2><ul class="bt-ul"><li>Lavage à 30 °C, à l'envers.</li><li>Pas de sèche-linge pour les sérigraphies.</li><li>Repassage doux, jamais sur l'impression.</li></ul></article>
    <article class="bt-paper bt-nbox" data-reveal><h2 class="bt-h3">Envie d'une autre taille ?</h2><p>Le conseiller de taille compare vos mesures à la coupe de chaque pièce.</p><a class="bt-btn bt-btn--ink" href="/taille">Conseiller de taille ${arrow}</a></article></div></section>`),
  sec(footer(c))];

const lookbook = (c) => [sec(header(c)), pagehead("Saison 06 · Nuit, chantier, parking", "Lookbook", "Neuf silhouettes tirées sur papier, scotchées au mur. Filtrez par décor."),
  sec(`<section class="bt-sec pk-bleed bt-look-sec"><div class="bt-wrap"><div class="bt-filters" role="group" aria-label="Filtrer par décor" data-filters="cat"><a class="bt-chip is-on" href="#tous" data-f="all" role="button" aria-pressed="true">Tous</a><a class="bt-chip" href="#nuit" data-f="nuit" role="button" aria-pressed="false">Nuit</a><a class="bt-chip" href="#chantier" data-f="chantier" role="button" aria-pressed="false">Chantier</a><a class="bt-chip" href="#parking" data-f="parking" role="button" aria-pressed="false">Parking</a></div>
    <div class="bt-wall2">${LOOKS.map(([k, g, pc, cap], i) => `<figure class="bt-fig bt-fig--w bt-paper" data-cat="${k}" data-reveal>${look(k, g, pc, i)}<figcaption><b>Look ${String(i + 1).padStart(2, "0")}</b> — ${cap}</figcaption></figure>`).join("")}</div></div></section>`),
  sec(`<section class="bt-sec pk-bleed bt-lbq"><div class="bt-wrap"><div class="bt-giant bt-giant--s bt-giant--w" data-reveal>Tout est tiré à la main. Rien n'est lissé.</div><p class="bt-cta-p bt-cta-p--w" data-reveal>Les silhouettes sont des dessins : les vraies pièces sont dans les drops.</p><a class="bt-btn bt-btn--acc bt-btn--lg" href="/drops">Aux drops ${arrow}</a></div></section>`),
  sec(footer(c))];

const COLLABS = [
  ["01", "Marée Noire", "Atelier de sérigraphie", "Tee Photocopie à quatre passages, tirage numéroté à la main.", "tee", "blanc", "Sortie passée", "out", "Série de 300 pièces, entièrement vendue. Chaque tirage a un léger décalage de trame, voulu : il n'y en a pas deux pareils."],
  ["02", "Boxe Club de la Dalle", "Club de quartier", "Veste Chantier doublée, dos brodé aux couleurs du club.", "jacket", "goudron", "Sortie passée", "out", "Une partie de la série a été donnée au club pour équiper ses jeunes. Plus de pièces disponibles."],
  ["03", "Radio Béton", "Web-radio indépendante", "Casquette Palette avec patch fréquence, livrée avec un autocollant.", "cap", "orange", "En préparation", "soon", "Date non communiquée. Les inscrits de la liste d'alerte seront prévenus en premier."],
  ["04", "Fabricants du Nord", "Atelier de couture", "Cargo Goudron coupé à Lille, poches renforcées, étiquette cousue main.", "cargo", "goudron", "En préparation", "soon", "Prototype en essayage. Retours des testeurs attendus avant d'ouvrir le drop."],
];
const collabs = (c) => [sec(header(c)), pagehead("Avec qui on colle", "Collabs", "Quatre collaborations fictives, une pièce chacune, jamais rééditées."),
  sec(`<section class="bt-colls pk-bleed">${COLLABS.map(([n, name, who, piece, t, col, st, cls, more], i) => `<article class="bt-col bt-col--${i % 3}" data-reveal><div class="bt-wrap bt-col-in"><div class="bt-col-n" aria-hidden="true">${n}</div>
    <div class="bt-col-t"><p class="bt-kick">${who}</p><h2 class="bt-h2 bt-h2--col">Bitume <span class="bt-x">×</span> ${name}</h2><p class="bt-col-p">${piece}</p><p class="bt-col-st bt-col-st--${cls}">${st}</p>
      <details class="bt-more-d"><summary>Lire l'histoire</summary><p>${more}</p></details></div>
    <div class="bt-col-art bt-paper">${garm(t, col)}<span class="bt-tapepc bt-tapepc--a" aria-hidden="true"></span></div></div></article>`).join("")}</section>`),
  sec(`<section class="bt-sec pk-bleed bt-cta"><div class="bt-wrap bt-cta-in"><div class="bt-giant bt-giant--s" data-reveal>Une idée de collab ?</div><p class="bt-cta-p" data-reveal>Atelier, club, collectif : écrivez-nous en quelques lignes ce que vous faites et ce que vous imaginez.</p><div class="bt-actions" data-reveal><a class="bt-btn bt-btn--ink bt-btn--lg" href="/contact">Proposer une collab ${arrow}</a></div></div></section>`),
  sec(footer(c))];

const STORES = [
  ["boutique", "lyon", "Bitume Yard Lyon", "14 rue du Goudron, 69003 Lyon", "Mar. – sam. · 11 h – 19 h", "2-6", 11, 19, "Boutique", 146, 118, "1"],
  ["boutique", "lille", "Bitume Yard Lille", "3 passage des Palettes, 59800 Lille", "Mer. – sam. · 12 h – 19 h", "3-6", 12, 19, "Boutique", 118, 22, "2"],
  ["revendeur", "nantes", "Dalle & Cie", "Quai des Entrepôts, 44000 Nantes", "Lun. – sam. · 10 h – 18 h", "1-6", 10, 18, "Revendeur", 52, 88, "3"],
  ["revendeur", "marseille", "Kiosque du Silo", "8 impasse du Silo, 13003 Marseille", "Jeu. – sam. · 14 h – 20 h", "4-6", 14, 20, "Revendeur", 150, 168, "4"],
  ["popup", "paris", "Bitume Garage (pop-up)", "27 rue de la Benne, 75011 Paris", "Ven. – dim. · 12 h – 20 h", "5-7", 12, 20, "Pop-up", 112, 58, "5"],
];
const magasins = (c) => [sec(header(c)), pagehead("Essayer avant le drop", "Magasins", "Deux boutiques, deux revendeurs, un pop-up. Adresses fictives de démonstration."),
  sec(`<section class="bt-sec pk-bleed bt-stores"><div class="bt-wrap"><div class="bt-filters" role="group" aria-label="Type de point de vente" data-filters="cat"><a class="bt-chip is-on" href="#tous" data-f="all" role="button" aria-pressed="true">Tous</a><a class="bt-chip" href="#boutique" data-f="boutique" role="button" aria-pressed="false">Boutiques</a><a class="bt-chip" href="#revendeur" data-f="revendeur" role="button" aria-pressed="false">Revendeurs</a><a class="bt-chip" href="#popup" data-f="popup" role="button" aria-pressed="false">Pop-up</a></div>
    <div class="bt-st-grid"><ul class="bt-st-list">${STORES.map(([cat, k, name, addr, hours, days, from, to, type, , , num]) => `<li class="bt-store bt-paper" data-cat="${cat}" data-store="${k}" data-days="${days}" data-from="${from}" data-to="${to}" data-reveal><span class="bt-pin-n" aria-hidden="true">${num}</span><div><p class="bt-kick">${type} · <span data-open class="bt-open">Horaires</span></p><h2 class="bt-h3">${name}</h2><address>${addr}</address><p class="bt-hours">${hours} <small>(heure de Paris)</small></p><a class="bt-btn bt-btn--line" href="/contact">Écrire au magasin</a></div></li>`).join("")}</ul>
    <figure class="bt-map bt-paper" data-reveal><svg viewBox="0 0 200 200" role="img" aria-label="Carte schématique de la France avec cinq points de vente"><path class="bt-map-fr" d="M100 8 148 22 188 58 182 112 160 150 128 196 74 190 40 152 14 100 28 48 62 24z"/><path class="bt-map-g" d="M60 40 90 70 110 56 130 90 100 120 70 100M110 56 150 40M130 90 170 100M100 120 90 170" fill="none"/>${STORES.map(([cat, k, , , , , , , , x, y, num]) => `<g class="bt-pin" data-pin="${k}" transform="translate(${x} ${y})"><circle r="11"/></g>`).join("")}</svg>
      <figcaption>${STORES.map(([, k, name, , , , , , , , , num]) => `<span><b>${num}</b> ${name.replace(" (pop-up)", "")}</span>`).join("")}</figcaption></figure></div></div></section>`),
  sec(footer(c))];

const rowSize = (s, a, b, c2) => `<tr data-size="${s}"><th scope="row">${s}</th><td data-label="${a[0]}">${a[1]}</td><td data-label="${b[0]}">${b[1]}</td><td data-label="${c2[0]}">${c2[1]}</td></tr>`;
const HAUT = [["XS", 92, 66, 42], ["S", 98, 68, 44], ["M", 104, 70, 46], ["L", 110, 72, 48], ["XL", 116, 74, 50], ["XXL", 122, 76, 52]];
const BAS = [["XS", 72, 96, 78], ["S", 78, 102, 79], ["M", 84, 108, 80], ["L", 90, 114, 81], ["XL", 96, 120, 82], ["XXL", 102, 126, 83]];
const chip = (g, v, label, on = false) => `<a class="bt-chip" href="#${g}-${v}" role="button" aria-pressed="false" data-adv="${g}" data-v="${v}">${label}</a>`;
const taille = (c) => [sec(header(c)), pagehead("Le bon calibre", "Taille & livraison", "Un conseiller de taille, deux tableaux de mesures et les délais de livraison types."),
  sec(`<section class="bt-sec pk-bleed bt-adv"><div class="bt-wrap bt-adv-in"><div class="bt-advbox bt-paper" data-reveal data-advisor><h2 class="bt-h3">Conseiller de taille</h2>
    <p class="bt-advq">Votre taille</p><div class="bt-chips" role="group" aria-label="Votre taille">${chip("h", "0", "Moins de 1,65 m")}${chip("h", "1", "1,65 – 1,75 m")}${chip("h", "2", "1,75 – 1,85 m")}${chip("h", "3", "Plus de 1,85 m")}</div>
    <p class="bt-advq">Votre gabarit</p><div class="bt-chips" role="group" aria-label="Votre gabarit">${chip("b", "-1", "Fin")}${chip("b", "0", "Moyen")}${chip("b", "1", "Costaud")}</div>
    <p class="bt-advq">Votre coupe préférée</p><div class="bt-chips" role="group" aria-label="Votre coupe préférée">${chip("c", "-1", "Près du corps")}${chip("c", "0", "Comme sur le lookbook")}${chip("c", "1", "Très ample")}</div></div>
    <div class="bt-advres" aria-live="polite" data-advres><p class="bt-advres-k">Taille conseillée</p><p class="bt-advres-v" data-advsize>?</p><p class="bt-advres-n" data-advnote>Choisissez votre taille, votre gabarit et votre coupe.</p><a class="bt-btn bt-btn--acc" href="/produit">Voir les pièces ${arrow}</a></div></div></section>`),
  sec(`<section class="bt-sec pk-bleed bt-tabs"><div class="bt-wrap bt-tabs-in"><div class="bt-tbl-w" data-reveal><table class="bt-tbl"><caption>Hauts — tee, hoodie, veste (centimètres, mesures à plat)</caption><thead><tr><th scope="col">Taille</th><th scope="col">Poitrine</th><th scope="col">Longueur dos</th><th scope="col">Épaules</th></tr></thead><tbody>${HAUT.map(([s, a, b, d]) => rowSize(s, ["Poitrine", a], ["Longueur dos", b], ["Épaules", d])).join("")}</tbody></table></div>
    <div class="bt-tbl-w" data-reveal><table class="bt-tbl"><caption>Bas — cargo (centimètres)</caption><thead><tr><th scope="col">Taille</th><th scope="col">Tour de taille</th><th scope="col">Hanches</th><th scope="col">Entrejambe</th></tr></thead><tbody>${BAS.map(([s, a, b, d]) => rowSize(s, ["Tour de taille", a], ["Hanches", b], ["Entrejambe", d])).join("")}</tbody></table></div></div></section>`),
  sec(`<section class="bt-sec pk-bleed bt-ship"><div class="bt-wrap"><h2 class="bt-h2 bt-h2--w" data-reveal>Livraison</h2><p class="bt-sub bt-sub--w" data-reveal>Informations types d'une boutique Bitume. La démonstration n'enregistre aucune commande ni aucun colis.</p>
    <div class="bt-shipgrid"><article class="bt-sbox" data-reveal><b>2–4 jours</b><span>France métropolitaine, suivi par SMS</span></article><article class="bt-sbox" data-reveal><b>4–7 jours</b><span>Europe, colis assuré</span></article><article class="bt-sbox" data-reveal><b>7–14 jours</b><span>Reste du monde, délais douaniers à part</span></article><article class="bt-sbox" data-reveal><b>14 jours</b><span>Pour changer de taille, pièce non portée</span></article></div>
    <div class="bt-faq-l bt-faq-l--w"><details data-reveal><summary>Les frais de port</summary><p>Ils seraient calculés selon la destination et le poids du colis ; aucun montant n'est fixé dans cette démonstration.</p></details>
      <details data-reveal><summary>Échange et retour</summary><p>Une pièce non portée, avec son étiquette, peut être échangée contre une autre taille dans la limite du stock de la série. Une série épuisée n'est pas réassortie.</p></details>
      <details data-reveal><summary>Une question sur votre colis ?</summary><p>Écrivez-nous depuis la page <a href="/contact">Contact</a> en indiquant votre pièce et votre taille.</p></details></div></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Écrire à Bitume", "Contact", "Liste d'alerte, taille, presse ou collab : dites-nous tout, on répond sous deux jours ouvrés."),
  { type: "form", heading: "Un message pour Bitume", intro: "Collez ici votre liste d'alerte ou votre question. Aucune commande n'est prise par ce formulaire." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Fouiller le mur", "Recherche", "Une pièce, un drop, un magasin."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="bt-404 pk-bleed"><div class="bt-wrap"><p class="bt-kick">Affiche arrachée</p><div class="bt-giant" role="heading" aria-level="1">404</div><p class="bt-ph-sub bt-paper">Cette page n'existe pas ou a été décollée.</p><div class="bt-actions"><a class="bt-btn bt-btn--ink bt-btn--lg" href="/">Retour au mur ${arrow}</a><a class="bt-btn bt-btn--white bt-btn--lg" href="/drops">Les drops</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "bitume", name: "Bitume", version: "2.0.0", category: "mode", tags: ["audacieux", "experimental", "moderne"], siteType: "Marque de streetwear urbain", featured: true,
  concept: "Un mur d'affiches collées : typographie massive, papier froissé et photocopié, autocollants, et des drops de vêtements dont l'état suit l'horloge.",
  description: "Marque de streetwear : mur d'affiches béton, orange et noir, menu en autocollants, drops avec compte à rebours (bientôt, en ligne, épuisé), fiches pièces dessinées, lookbook, collabs, magasins, conseiller de taille et liste d'alerte.",
  brand: "Bitume Street Supply", modules: ["formulaires", "recherche"],
  dna: { header: "menu-d-autocollants-colles-en-vrac", hero: "mur-d-affiches-colles-et-typo-massive", grid: "cartes-de-drops-a-badge-d-etat", motion: "decompte-de-drop-et-affiches-qui-se-decollent", shapes: "papier-froisse-scotch-et-bords-photocopies", rhythm: "bandes-affichees-a-l-arrache", signature: "drops-sur-horloge-fiche-vetement-et-liste-d-alerte" },
  tokens: {
    colors: { primary: "#ff5a00", secondary: "#111111", accent: "#efeadc", background: "#d9d6cf", surface: "#f4f1ea", text: "#111111", muted: "#3f3c37", success: "#1e6b34", warning: "#8a4a00", error: "#b3261e" },
    fonts: { heading: "font.bowlby-one", body: "font.archivo", button: "font.space-mono", link: "font.archivo" },
    radius: { sm: 2, md: 4, lg: 6, button: 4, field: 2, card: 4 }, shadow: { card: "6px 6px 0 #111111", button: "4px 4px 0 #111111" }, border: { width: 3, color: "#111111" },
    type: { h1: { size: 150, weight: 400, lineHeight: 0.9, transform: "uppercase" }, h2: { size: 72, weight: 400, lineHeight: 0.95, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Orange signal", type: "color", default: "#ff5a00" },
    { key: "ink", label: "Noir bitume", type: "color", default: "#111111" },
    { key: "tilt", label: "Inclinaison des affiches", type: "choice", default: "full", choices: [["full", "Forte"], ["calm", "Calme"], ["flat", "Droite"]] },
    { key: "grain", label: "Papier froissé", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Uni"]] },
    { key: "tape", label: "Bandeau de scotch", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Drops", "/drops"], ["Produit", "/produit"], ["Lookbook", "/lookbook"], ["Collabs", "/collabs"], ["Magasins", "/magasins"], ["Taille & livraison", "/taille"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "drops", name: "Drops", render: drops }, { key: "produit", name: "Produit", render: produit }, { key: "lookbook", name: "Lookbook", render: lookbook },
    { key: "collabs", name: "Collabs", render: collabs }, { key: "magasins", name: "Magasins", render: magasins }, { key: "taille", name: "Taille & livraison", render: taille },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
