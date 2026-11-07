// Boucles fières — soins pour cheveux bouclés, frisés et crépus. Direction artistique : la fierté et la chaleur d'une communauté, des boucles dessinées comme des signatures (spirales, ressorts, zigzags),
// capsule d'en-tête flottante, couleurs de beurre de karité, prune et or. Composant signature : le DIAGNOSTIC DE BOUCLES (type 3A à 4C, porosité, besoin) — un bloc éditable du Page Builder.
// Sans JavaScript : des fiches dépliantes (details) avec liens directs vers les vraies étiquettes du catalogue. Avec JavaScript (motion.js) : trois questions puis une routine en quatre gestes.
// Les types 3A–4C sont des repères, jamais des étiquettes : le texte le dit. Aucune allégation médicale, aucun avis ni stock inventé, aucun panier simulé.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const r1 = (n) => Math.round(n * 10) / 10;
// Tracés de boucles générés (aucun hasard) : trochoïde = boucles régulières ; zigzag = angles.
const trochoid = (b, turns, w = 120, h = 60) => { const pts = []; const N = turns * 28; const span = turns * 2 * Math.PI; for (let i = 0; i <= N; i++) { const t = (i / N) * span; pts.push([6 + b + (t / span) * (w - 12 - 2 * b) - b * Math.sin(t), h / 2 - b * Math.cos(t)]); } return "M" + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L"); };
const zigzag = (amp, step, w = 120, h = 60) => { const pts = []; let x = 6, up = true; while (x <= w - 6) { pts.push([x, h / 2 + (up ? -amp : amp)]); x += step; up = !up; } return "M" + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L"); };
const spiral = (cx, cy, turns, rMax, rot = 0) => { const pts = []; const N = Math.round(turns * 48); for (let i = 0; i <= N; i++) { const t = i / N; const ang = rot + t * turns * 2 * Math.PI; const r = rMax * (0.04 + 0.96 * t); pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]); } return "M" + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L"); };

const TYPES = [
  ["3A", "Boucles amples en S, souples, brillantes", trochoid(17, 3)], ["3B", "Ressorts bien formés, plus de volume", trochoid(13, 4)], ["3C", "Tire-bouchons serrés, denses", trochoid(9, 6)],
  ["4A", "Petits ressorts en S, très denses", trochoid(6.5, 8)], ["4B", "Boucles en Z, angles marqués", zigzag(15, 10)], ["4C", "Boucles très serrées, fort rétrécissement", zigzag(9, 5.2)],
];
const curl = (d, cls = "bf-curl") => `<svg class="${cls}" viewBox="0 0 120 60" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const mark = `<svg class="bf-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="${spiral(20, 20, 2.6, 17)}" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
};
const heroArt = () => `<svg class="bf-heroart" viewBox="0 0 440 440" role="img" aria-label="Spirales concentriques, motif de boucles"><path class="bf-blob" d="M220 20C320 14 424 90 420 214C416 336 330 426 214 420C100 414 18 334 22 214C26 108 110 26 220 20Z"/>
  <g class="bf-spin"><path class="bf-sp bf-sp--1" d="${spiral(220, 220, 4.2, 180)}"/></g><g class="bf-spin bf-spin--r"><path class="bf-sp bf-sp--2" d="${spiral(220, 220, 3, 120, 1.4)}"/></g><circle class="bf-dot" cx="220" cy="220" r="14"/></svg>`;

const header = (c) => `<header class="bf-head pk-bleed"><div class="bf-cap"><a class="bf-logo" href="/" aria-label="Boucles fières, accueil">${mark}<span>Boucles <em>fières</em></span></a>
  <div class="bf-nav" role="navigation" aria-label="Rubriques">${c.menu.filter((m) => m.url !== "/diagnostic" && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="bf-act"><a class="bf-dgcta" href="/diagnostic">Mon diagnostic</a><a class="bf-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="bf-ic bf-cart" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="bf-foot pk-bleed"><div class="bf-wrap bf-foot-g">
  <div><div class="bf-flogo">${mark}<span>Boucles fières</span></div><p class="bf-small">Des soins pensés pour toutes les textures : bouclées, frisées, crépues.<br>Du lundi au vendredi, réponses sous deux jours ouvrés.</p></div>
  <div><p class="bf-lab">Boutique</p><p class="bf-fl"><a href="/boutique">Tous les soins</a><a href="/diagnostic">Mon diagnostic</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="bf-lab">Par geste</p><p class="bf-fl"><a href="/boutique/etiquette/nettoyage-doux">Nettoyer</a><a href="/boutique/etiquette/hydratation">Hydrater</a><a href="/boutique/etiquette/definition">Définir</a><a href="/boutique/etiquette/protection">Protéger</a></p></div>
  <div><p class="bf-lab">Informations</p><p class="bf-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && !["/", "/diagnostic"].includes(m.url)).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div>
  <p class="bf-copy">© Boucles fières — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="bf-ph pk-bleed"><div class="bf-wrap bf-narrow"><p class="bf-lab">${esc(kicker)}</p><div class="bf-h1" role="heading" aria-level="1">${esc(title)}</div><p class="bf-lead">${esc(lead)}</p></div></section>`);

// ----- Composant signature : diagnostic de boucles ---------------------------------------------------------------------------------------------
const T = (tag) => `/boutique/etiquette/${tag}`;
const FAM = { "3": ["boucles-3", "nettoyage-doux", "hydratation", "definition", "scellage"], "4": ["boucles-4", "nettoyage-doux", "hydratation", "definition", "scellage"] };
const typeFiche = ([k, d, path], i) => {
  const fam = k[0], tags = FAM[fam];
  return `<details class="bf-ty" data-dg-type="${k}"${i === 0 ? " open" : ""}><summary><span class="bf-ty-ic">${curl(path)}</span><span class="bf-ty-n">${k}</span><span class="bf-ty-d">${esc(d)}</span></summary>
  <p class="bf-small">${fam === "3" ? "Textures plutôt légères : des crèmes et gels souples définissent sans alourdir." : "Textures denses : des crèmes riches et des beurres aident à garder l'hydratation sur les longueurs."}</p>
  <p class="bf-links"><a href="${T(tags[0])}">Produits pour boucles ${fam}</a><a href="${T(tags[1])}">Nettoyer</a><a href="${T(tags[2])}">Hydrater</a><a href="${T(tags[3])}">Définir</a><a href="${T(tags[4])}">Sceller</a></p></details>`;
};
const diagBloc = (title = "Quelle routine pour vos boucles ?") => sec(`<section class="bf-diag pk-bleed"><div class="bf-wrap"><p class="bf-lab">Diagnostic de boucles</p><h2 class="bf-h2">${esc(title)}</h2>
  <p class="bf-lead">Trois repères — votre type de boucles, la porosité, votre besoin du moment — et une routine en quatre gestes, reliée aux vrais soins de la boutique.</p>
  <div class="bf-dg" data-boucles-diag data-base="/boutique/etiquette/">
    <div class="bf-dg-ui" data-dg-ui></div>
    <div class="bf-dg-fb"><h3 class="bf-h3">Repérez votre type</h3>${TYPES.map(typeFiche).join("")}
      <h3 class="bf-h3">Selon la porosité</h3>
      <details class="bf-ty"><summary><span class="bf-ty-n">Basse</span><span class="bf-ty-d">L'eau perle, les produits restent en surface</span></summary><p class="bf-small">Textures légères, peu d'huile, chaleur douce pour aider les soins à pénétrer.</p><p class="bf-links"><a href="${T("porosite-basse")}">Soins pour porosité basse</a></p></details>
      <details class="bf-ty"><summary><span class="bf-ty-n">Moyenne</span><span class="bf-ty-d">Les cheveux absorbent et gardent bien l'eau</span></summary><p class="bf-small">Une routine équilibrée suffit ; ajustez selon la saison.</p><p class="bf-links"><a href="${T("hydratation")}">Hydrater</a><a href="${T("definition")}">Définir</a></p></details>
      <details class="bf-ty"><summary><span class="bf-ty-n">Haute</span><span class="bf-ty-d">Les cheveux boivent vite et sèchent vite</span></summary><p class="bf-small">Soins riches, scellage sur les longueurs, coiffures qui protègent les pointes.</p><p class="bf-links"><a href="${T("porosite-haute")}">Soins pour porosité haute</a><a href="${T("scellage")}">Sceller</a></p></details>
      <h3 class="bf-h3">Selon votre besoin</h3>
      <p class="bf-links bf-links--big"><a href="${T("hydratation")}">Hydrater</a><a href="${T("demelage")}">Démêler</a><a href="${T("definition")}">Définir</a><a href="${T("protection")}">Protéger la nuit</a></p></div>
  </div>
  <p class="bf-note">Les types 3A à 4C sont des repères de la communauté, pas des étiquettes : vos cheveux peuvent mêler plusieurs textures, et c'est normal. Indications de soin cosmétique, pas un avis médical : en cas de douleur ou de souci du cuir chevelu, parlez-en à un professionnel de santé. Chaque lien ouvre le catalogue réel filtré par l'étiquette correspondante.</p></div></section>`);

const texturesBand = () => sec(`<section class="bf-sec pk-bleed"><div class="bf-wrap"><p class="bf-lab">Toutes les textures</p><h2 class="bf-h2">Chaque boucle a sa signature</h2>
  <div class="bf-tx">${TYPES.map(([k, d, path]) => `<a class="bf-txc" href="${T("boucles-" + k[0])}"><span class="bf-txi">${curl(path)}</span><b>${k}</b><span>${esc(d)}</span></a>`).join("")}</div></div></section>`);
const gestes = () => sec(`<section class="bf-sec bf-sec--w pk-bleed"><div class="bf-wrap"><p class="bf-lab">La routine en quatre gestes</p><h2 class="bf-h2">Un geste, un soin, sans surcharge</h2>
  <ol class="bf-steps"><li><a href="${T("nettoyage-doux")}"><b>Nettoyer</b><span>Doucement, sans décaper.</span></a></li><li><a href="${T("hydratation")}"><b>Hydrater</b><span>Masque ou leave-in selon le besoin.</span></a></li><li><a href="${T("definition")}"><b>Définir</b><span>Crème ou gel, mèche par mèche.</span></a></li><li><a href="${T("protection")}"><b>Protéger</b><span>Satin pour la nuit, huile sur les pointes.</span></a></li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="bf-hero pk-bleed"><div class="bf-wrap bf-hero-in"><div><p class="bf-lab">Soins pour cheveux bouclés, frisés, crépus</p><div class="bf-h1 bf-h1--xl" role="heading" aria-level="1">Fières de<br>chaque <em>boucle</em></div><p class="bf-lead">Des soins simples, des gestes clairs, une communauté qui partage ses routines. Dites-nous votre texture : on vous montre par où commencer.</p>
    <p class="bf-cta"><a class="bf-btn" href="/diagnostic">Trouver ma routine</a> <a class="bf-link" href="/boutique">Voir la boutique</a></p></div><div class="bf-art">${heroArt()}</div></div></section>`),
  diagBloc(), texturesBand(),
  sec(`<section class="bf-sec pk-bleed"><div class="bf-wrap"><p class="bf-lab">Les essentiels</p><h2 class="bf-h2">À la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "4/5" })),
  gestes(),
  sec(`<section class="bf-sec pk-bleed"><div class="bf-wrap"><ul class="bf-vals"><li><b>Des compositions lisibles</b>Chaque fiche liste ce qu'elle contient, en clair.</li><li><b>Des prix honnêtes</b>Le prix affiché est le prix payé. Aucune fausse urgence, aucun compte à rebours.</li><li><b>Toutes les textures</b>Nos repères valent pour toutes les boucles, sans idéal à atteindre.</li></ul></div></section>`),
  sec(`<section class="bf-circle pk-bleed"><div class="bf-wrap bf-narrow"><p class="bf-lab">Le cercle</p><h2 class="bf-h2">Une question de routine ?</h2><p class="bf-lead">Écrivez-nous votre texture, votre rythme et ce qui vous gêne. Nous répondons, et nous partageons ce qui marche.</p><p><a class="bf-btn" href="/contact">Poser ma question</a> <a class="bf-link" href="/routines">Lire les routines</a></p></div></section>`),
  sec(footer(c))];

const diagnostic = (c) => [sec(header(c)), head("Diagnostic", "Votre routine en trois questions", "Type de boucles, porosité, besoin du moment."), diagBloc("Faites le point sur vos boucles"), gestes(), sec(footer(c))];
const routines = (c) => [sec(header(c)), head("Routines", "Des gestes qui tiennent dans une semaine", "Un repère par rythme, à ajuster à vos cheveux."),
  sec(`<section class="bf-sec pk-bleed"><div class="bf-wrap bf-narrow bf-prose"><h2 class="bf-h2">Le jour de lavage</h2><ol class="bf-steps bf-steps--col"><li><a href="${T("nettoyage-doux")}"><b>Nettoyer</b><span>Shampoing doux sur le cuir chevelu, les longueurs se nettoient avec la mousse qui descend.</span></a></li><li><a href="${T("demelage")}"><b>Démêler</b><span>Avec un soin glissant, doigts ou peigne à dents larges, des pointes vers les racines.</span></a></li><li><a href="${T("hydratation")}"><b>Hydrater</b><span>Masque ou leave-in, sur cheveux bien humides.</span></a></li><li><a href="${T("definition")}"><b>Définir</b><span>Crème ou gel appliqué par sections, sans frotter.</span></a></li></ol>
    <h2 class="bf-h2">Entre deux lavages</h2><p>Rafraîchissez avec une brume, scellez les pointes avec une goutte d'huile, et gardez les boucles au repos la nuit avec <a href="${T("protection")}">du satin</a>.</p></div></section>`),
  texturesBand(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="bf-sec pk-bleed"><div class="bf-wrap bf-narrow bf-prose"><h2 class="bf-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique.</p><h2 class="bf-h2">Retours</h2><p>Un produit scellé peut être retourné dans le délai indiqué à la commande. Un produit ouvert ne peut pas être repris pour des raisons d'hygiène. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p><h2 class="bf-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Types de boucles, porosité, routines."),
  sec(`<section class="bf-sec pk-bleed"><div class="bf-wrap bf-narrow"><details class="bf-q"><summary>Dois-je absolument connaître mon type (3A, 4C…) ?</summary><p>Non. C'est un repère pour choisir des textures de produit, pas une case à remplir. Beaucoup de personnes ont plusieurs textures sur la même tête.</p></details><details class="bf-q"><summary>Comment estimer ma porosité ?</summary><p>Observez : si l'eau perle et que les soins pénètrent lentement, elle est plutôt basse ; si les cheveux boivent et sèchent vite, plutôt haute. C'est une indication, pas une mesure.</p></details><details class="bf-q"><summary>À quelle fréquence laver mes boucles ?</summary><p>Cela dépend de votre cuir chevelu, de vos produits et de votre rythme. Commencez par une fois par semaine et ajustez.</p></details><details class="bf-q"><summary>Vos conseils remplacent-ils un avis médical ?</summary><p>Non. Ce sont des repères de soin cosmétique. En cas de douleur, de démangeaisons persistantes ou de problème du cuir chevelu, consultez un professionnel de santé.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Le cercle", "Nous écrire", "Une question de routine, de texture, de commande."), { type: "form", heading: "Écrire à Boucles fières", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un soin", "Un geste, un produit, une texture."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un soin…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="bf-ph pk-bleed"><div class="bf-wrap bf-narrow"><p class="bf-lab">Page introuvable</p><div class="bf-h1 bf-h1--xl" role="heading" aria-level="1">Boucle <em>perdue</em></div><p class="bf-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a> ou <a href="/diagnostic">faire le diagnostic</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "boucles-fieres", name: "Boucles fières", version: "1.0.0", category: "ecommerce", tags: ["chaleureux", "audacieux", "naturel"], siteType: "Soins capillaires pour cheveux texturés", featured: true,
  concept: "La fierté des boucles : capsule d'en-tête flottante, spirales dessinées, couleurs de karité, prune et or, et un diagnostic (type 3A à 4C, porosité, besoin) qui aboutit à une routine reliée aux vraies étiquettes du catalogue.",
  description: "Soins pour cheveux bouclés, frisés et crépus : en-tête en capsule, spirales et boucles dessinées, fiches dépliantes par type de boucles, diagnostic en trois questions menant à une routine en quatre gestes reliée aux étiquettes réelles, bouton d'achat fixe sur mobile.",
  brand: "Boucles fières", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "carte-goutte-motif-spirale", gallery: "grande-image-puis-infos-et-bouton-fixe-mobile", cart: "page-dediee-prune-et-or-bouton-fixe-mobile", catalog: "puces-de-gestes-et-de-textures" },
  dna: {
    header: "capsule-flottante-logo-spirale-et-cta-diagnostic", hero: "titre-incline-et-spirales-concentriques-tournantes", grid: "trois-colonnes-cartes-gouttes", typo: "sansita-et-wix-madefor-text",
    shapes: "gouttes-asymetriques-et-blobs-organiques", motion: "trace-des-boucles-et-rotation-lente", rhythm: "alternance-karite-clair-et-bandes-prune", signature: "diagnostic-de-boucles-type-porosite-besoin-vers-routine",
    palette: "karite-prune-et-or", image: "spirales-et-boucles-svg-generees-sans-photo", list: "cartes-gouttes-prix-prune-sous-le-nom",
    article: "colonne-etroite-etapes-en-liens-numerotees", sidebar: "aucune-puces-de-gestes-au-lieu-d-une-colonne", reading: "wix-madefor-text-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#a1327a", secondary: "#3a1c14", accent: "#e7a514", background: "#fdf0e1", surface: "#fffaf3", text: "#3a1c14", muted: "#6f5246", success: "#2f6f4a", warning: "#8a5a10", error: "#a8321f" },
    fonts: { heading: "font.sansita", body: "font.wix-madefor-text", button: "font.wix-madefor-text", link: "font.wix-madefor-text" },
    radius: { sm: 10, md: 18, lg: 30, button: 999, field: 14, card: 30 }, shadow: { card: "0 8px 22px rgba(58,28,20,.10)", button: "none" }, border: { width: 1, color: "#e8cdb4" },
    type: { h1: { size: 58, weight: 800, lineHeight: 1.02, transform: "none" }, h2: { size: 34, weight: 700, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur principale (prune)", type: "color", default: "#a1327a" },
    { key: "or", label: "Couleur d'accent (or)", type: "color", default: "#e7a514" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "karite", choices: [["karite", "Karité (chaud)"], ["creme", "Crème (clair)"]] },
    { key: "spirales", label: "Spirales du héros", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "trace", label: "Tracé animé des boucles", type: "choice", default: "on", choices: [["on", "Les boucles se dessinent"], ["off", "Tracés fixes"]] },
    { key: "capsule", label: "En-tête", type: "choice", default: "flottante", choices: [["flottante", "Capsule flottante"], ["pleine", "Barre pleine largeur"]] },
    { key: "cartes", label: "Forme des cartes produit", type: "choice", default: "gouttes", choices: [["gouttes", "Gouttes (un coin vif)"], ["rondes", "Très arrondies"]] },
    { key: "motif", label: "Motif des vignettes sans photo", type: "choice", default: "spirales", choices: [["spirales", "Spirales"], ["uni", "Aplat uni"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Diagnostic", "/diagnostic"], ["Routines", "/routines"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "diagnostic", name: "Diagnostic de boucles", render: diagnostic }, { key: "routines", name: "Routines", render: routines },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
