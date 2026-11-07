// Mijote — blog de recettes (carnets de cuisine fictifs tenus par trois cuisiniers). Direction artistique : nappe vichy rouge et crème, fiches de recette « cartes cartonnées » aux bords perforés,
// annotations manuscrites, fiche à portions ajustables (quantités recalculées dans le navigateur), ingrédients et étapes à cocher, minuteurs d'étape, version imprimable (@media print),
// recettes filtrables par rubrique, étiquette et mot, calendrier des produits de saison. Tout est démonstration : recettes, auteurs et quantités sont fictifs.
// Capacités du CMS : aucun type « recette » ni balisage Recipe n'existe encore ; la fiche est donc écrite dans les pages du thème et ses calculs se font dans motion.js.
const { sec, esc, nav, form } = require("../kit");
const common = require("./communes");

// ---------- illustrations d'assiette (SVG en ligne, sans style en ligne) ----------
const ART = {
  bowl: (a, b) => `<circle cx="100" cy="70" r="44" fill="${a}"/><g fill="${b}"><circle cx="82" cy="60" r="7"/><circle cx="108" cy="52" r="6"/><circle cx="118" cy="78" r="8"/><circle cx="90" cy="86" r="6"/><circle cx="102" cy="68" r="4"/></g>`,
  tart: (a, b) => `<circle cx="100" cy="70" r="46" fill="${b}"/><circle cx="100" cy="70" r="38" fill="${a}"/><path d="M100 70V32M100 70l33 19M100 70L67 89" stroke="${b}" stroke-width="3" fill="none"/>`,
  loaf: (a, b) => `<ellipse cx="100" cy="76" rx="52" ry="30" fill="${a}"/><path d="M68 66q10-12 18 0M92 62q10-12 18 0M116 66q10-12 18 0" fill="none" stroke="${b}" stroke-width="4" stroke-linecap="round"/>`,
  layer: (a, b) => `<rect x="56" y="76" width="88" height="20" rx="4" fill="${a}"/><rect x="62" y="56" width="76" height="20" rx="4" fill="${b}"/><rect x="56" y="36" width="88" height="20" rx="4" fill="${a}"/><circle cx="100" cy="30" r="7" fill="#a63a1c"/>`,
  jar: (a, b) => `<rect x="72" y="34" width="56" height="12" rx="3" fill="${b}"/><path d="M76 46h48l4 10v46q0 8-8 8H80q-8 0-8-8V56z" fill="${a}"/><rect x="82" y="68" width="36" height="22" rx="3" fill="#fffdf8"/>`,
  leaves: (a, b) => `<circle cx="100" cy="70" r="44" fill="${b}"/><path d="M70 80q-6-30 24-34 4 28-24 34zM100 90q-14-26 10-44 18 24-10 44zM118 74q4-22 26-22-2 22-26 22z" fill="${a}"/>`,
};
const art = (kind, a, b, bg, label, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 200 140" role="img" aria-label="Illustration : ${esc(label)}"><rect width="200" height="140" fill="${bg}"/><ellipse cx="100" cy="124" rx="62" ry="6" fill="#2b2118" opacity=".12"/>${ART[kind](a, b)}</svg>`;

const IC = {
  clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  user: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m16 16 5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  arrow: '<path d="M5 12h14m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  flame: '<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 3-7 1 1 2 2 2 3 1-2 1-4 0-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};
const ic = (k, cls = "mj-i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

// ---------- données : cuisiniers, rubriques, recettes ----------
const AUTHORS = {
  lea: { n: "Léa Marchetti", r: "Fondatrice, cuisine du quotidien", b: "Ancienne cheffe de cantine devenue conteuse de casseroles, Léa cuisine pour huit chaque dimanche et note tout dans un carnet taché de sauce." },
  hugo: { n: "Hugo Tessier", r: "Boulanger amateur et pâtissier", b: "Hugo pétrit à six heures du matin, avant le travail. Il défend les levains patients et les desserts qui ne demandent qu'un fouet." },
  nadia: { n: "Nadia Benkacem", r: "Cuisine végétale et conserves", b: "Nadia cultive un potager de quarante mètres carrés et met en bocaux tout ce qu'il ne peut pas manger sur place." },
};
const CATS = { plats: "Plats", soupes: "Soupes", desserts: "Desserts", boulangerie: "Boulangerie", conserves: "Conserves", entrees: "Entrées" };
const TAGS = { mijote: "Mijoté", vegetarien: "Végétarien", express: "Express", sg: "Sans gluten", saison: "De saison", enfants: "Avec les enfants" };
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
const dur = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${String(min % 60).padStart(2, "0")}` : ""}`);

// [kind, couleur 1, couleur 2, fond, titre, rubrique, étiquettes, auteur, date, minutes, personnes, résumé]
const R = [
  ["bowl", "#8a3b1e", "#3d5a2a", "#f4d9a8", "Daube de bœuf aux olives noires", "plats", "mijote saison", "lea", "2026-11-02", 215, 6, "Un paleron fondant, du vin rouge, des olives et trois heures de patience : la recette qui parfume toute la maison."],
  ["bowl", "#e0872b", "#fff2d6", "#f6e3b4", "Soupe de potimarron au lait de coco", "soupes", "vegetarien saison sg", "nadia", "2026-10-29", 40, 4, "Onctueuse, douce, relevée de gingembre frais : une assiette orange pour les soirs qui raccourcissent."],
  ["tart", "#d9a45b", "#a63a1c", "#f2dcc0", "Tarte fine aux pommes et à la cannelle", "desserts", "saison", "hugo", "2026-10-26", 60, 6, "Une pâte feuilletée, des pommes en éventail, un voile de sucre : prête pendant que le four chauffe."],
  ["loaf", "#c98f4e", "#7a4a22", "#efe3cf", "Pain de campagne au levain naturel", "boulangerie", "mijote", "hugo", "2026-10-22", 1080, 8, "Deux jours de repos, dix minutes de pétrissage, et une croûte qui chante en refroidissant."],
  ["bowl", "#d6a23a", "#6b7f3a", "#f3e6c2", "Gratin de courge et de châtaignes", "plats", "vegetarien saison", "nadia", "2026-10-19", 75, 4, "Une courge rôtie, des châtaignes, une crème à la muscade : le plat de table des premiers frimas."],
  ["bowl", "#c9d6a0", "#fffdf8", "#e8efd0", "Velouté de poireaux à la noisette", "soupes", "vegetarien express", "lea", "2026-10-15", 35, 4, "Quatre poireaux, une pomme de terre, un filet d'huile de noisette : la soupe de semaine par excellence."],
  ["layer", "#f2d38a", "#fffdf8", "#f9e7c8", "Gâteau au yaourt du dimanche", "desserts", "express enfants", "hugo", "2026-10-11", 50, 8, "On mesure tout avec le pot de yaourt : la recette que les enfants savent faire seuls."],
  ["leaves", "#5f7f3a", "#f0dca8", "#e3ecd0", "Salade tiède de lentilles et saucisse de Morteau", "entrees", "saison", "lea", "2026-10-07", 45, 4, "Des lentilles vertes bien cuites, une vinaigrette à la moutarde et une saucisse fumée juste rosée."],
  ["jar", "#e8a23c", "#a63a1c", "#f7e1b0", "Confiture de coings à la vanille", "conserves", "saison", "nadia", "2026-10-03", 150, 10, "Le coing rosit lentement dans la bassine : une confiture dense, parfumée, à garder pour l'hiver."],
  ["bowl", "#b88b5a", "#4d3b24", "#eddcc0", "Risotto aux champignons des bois", "plats", "vegetarien", "lea", "2026-09-28", 50, 4, "Un bouillon chaud, un riz qu'on surveille, un peu de parmesan : la crème vient toute seule, sans crème."],
  ["layer", "#f0c987", "#a63a1c", "#f6e7cf", "Crêpes de la Chandeleur, version tablée", "desserts", "enfants express", "hugo", "2026-09-24", 45, 8, "Une pâte reposée, une poêle bien chaude et des crêpes fines, à retourner en faisant sauter une pièce."],
  ["bowl", "#efe2c4", "#8a6a3a", "#f0e0bc", "Blanquette de veau à l'ancienne", "plats", "mijote", "lea", "2026-09-20", 140, 6, "Une sauce blanche, des champignons, un jus de citron à la fin : la douceur d'un déjeuner de famille."],
  ["bowl", "#b0306a", "#f6e4cf", "#f6dfe4", "Houmous de betterave et graines grillées", "entrees", "vegetarien express sg", "nadia", "2026-09-16", 15, 6, "Rose vif, crémeux, relevé de cumin : à étaler sur du pain grillé ou à servir avec des bâtonnets de légumes."],
  ["loaf", "#e0b46a", "#6b7f3a", "#f3e8cb", "Focaccia aux tomates cerises et romarin", "boulangerie", "vegetarien", "hugo", "2026-09-12", 200, 8, "Alvéolée, huilée, parsemée de sel : une pâte qui se pétrit à la cuillère et se mange tiède."],
  ["jar", "#6b2d3a", "#d9b25f", "#efd8cc", "Chutney de figues au vinaigre balsamique", "conserves", "vegetarien sg", "nadia", "2026-09-08", 90, 6, "Sucré, acide et profond : il accompagne les fromages, les terrines et les viandes froides."],
  ["bowl", "#d99a2b", "#4d7a3a", "#f5e4b0", "Curry de pois chiches et épinards", "plats", "vegetarien sg express", "nadia", "2026-09-04", 30, 4, "Une casserole, des épices du placard, du lait de coco : prêt avant que le riz ait fini de cuire."],
  ["tart", "#7a3b5a", "#e8c76a", "#efd9d6", "Far breton aux pruneaux", "desserts", "mijote", "hugo", "2026-08-30", 70, 8, "Une pâte liquide, des pruneaux gonflés au thé et un four doux : le dessert préféré des goûters bretons."],
];
const RECIPES = R.map(([kind, a, b, bg, title, cat, tags, au, date, min, n, ex], i) => ({ id: i + 1, kind, a, b, bg, title, cat, tags: tags.split(" "), au, date, min, n, ex }));

const card = (r, big = false) => {
  const hay = `${r.title} ${CATS[r.cat]} ${r.tags.map((t) => TAGS[t]).join(" ")} ${AUTHORS[r.au].n} ${r.ex}`.toLowerCase();
  return `<article class="mj-card${big ? " mj-card--big" : ""}" data-cat="${r.cat}" data-tags="${r.tags.join(" ")}" data-min="${r.min}" data-hay="${esc(hay)}"><a class="mj-card-img" href="/recette" aria-hidden="true">${art(r.kind, r.a, r.b, r.bg, r.title)}</a><div class="mj-card-b"><p class="mj-card-k"><span class="mj-cat">${CATS[r.cat]}</span><time datetime="${r.date}">${dfr(r.date)}</time></p><h3 class="mj-card-t"><a href="/recette">${esc(r.title)}</a></h3><p class="mj-card-x">${esc(r.ex)}</p><p class="mj-card-m"><span>${ic("clock")}${dur(r.min)}</span><span>${ic("user")}${r.n} pers.</span><span class="mj-card-a">${esc(AUTHORS[r.au].n)}</span></p></div></article>`;
};

// ---------- structure commune ----------
const POT = '<svg class="mj-pot" viewBox="0 0 48 40" aria-hidden="true"><path d="M14 8c-3-3 3-5 0-8M24 8c-3-3 3-5 0-8M34 8c-3-3 3-5 0-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 16h36v4a14 14 0 0 1-14 14h-8A14 14 0 0 1 6 20z" fill="currentColor"/><path d="M2 16h8M38 16h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M16 38h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
const logo = () => `<a class="mj-logo" href="/">${POT}<span class="mj-logo-t">Mijote<small>carnets de cuisine</small></span></a>`;
const header = (c) => `<header class="mj-head pk-bleed"><div class="mj-wrap mj-head-in">${logo()}<div class="mj-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "mj-nl")}</div><a class="mj-search" href="/recherche" aria-label="Rechercher une recette">${ic("search")}<span>Chercher</span></a><details class="mj-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="mj-bmenu">${nav(c.menu, "mj-bl")}<a class="mj-bl" href="/recherche">Rechercher</a></div></details></div><div class="mj-gingham" aria-hidden="true"></div></header>`;
const footer = (c) => `<footer class="mj-foot pk-bleed"><div class="mj-gingham mj-gingham--f" aria-hidden="true"></div><div class="mj-wrap mj-foot-in"><div class="mj-foot-brand">${logo()}<p>Des recettes qui prennent leur temps, racontées par trois cuisiniers de Lyon et d'ailleurs. Site de démonstration : recettes et personnes fictives.</p></div><div class="mj-fcol"><p class="mj-fh">Cuisiner</p>${nav([{ label: "Toutes les recettes", url: "/recettes" }, { label: "La fiche recette", url: "/recette" }, { label: "Produits de saison", url: "/saisons" }], "mj-fl")}</div><div class="mj-fcol"><p class="mj-fh">Le carnet</p>${nav([{ label: "À propos", url: "/a-propos" }, { label: "Contact", url: "/contact" }, { label: "Blocs de contenu", url: "/blocs" }], "mj-fl")}</div><div class="mj-fcol"><p class="mj-fh">Informations</p>${nav([{ label: "Mentions légales", url: "/mentions-legales" }, { label: "Confidentialité", url: "/confidentialite" }, { label: "Rechercher", url: "/recherche" }], "mj-fl")}</div></div><p class="mj-wrap mj-copy">© Mijote, carnets de cuisine — site de démonstration. Recettes, auteurs et quantités fictifs. <a href="/mentions-legales">Mentions légales</a></p></footer>`;
const pagehead = (eyebrow, title, lead) => sec(`<section class="mj-ph pk-bleed"><div class="mj-wrap"><p class="mj-eyebrow">${eyebrow}</p><div class="mj-h1" role="heading" aria-level="1">${title}</div><p class="mj-lead">${lead}</p></div></section>`);
const wrap = (h) => sec(`<section class="mj-sec pk-bleed"><div class="mj-wrap">${h}</div></section>`);

// ---------- accueil ----------
const home = (c) => {
  const f = RECIPES[0];
  return [
    sec(header(c)),
    sec(`<section class="mj-hero pk-bleed"><div class="mj-wrap mj-hero-in"><div class="mj-hero-t"><p class="mj-eyebrow">Cuisine de saison · carnets tenus depuis 2019</p><div class="mj-h1" role="heading" aria-level="1">Laissez mijoter. <em>Le reste vient tout seul.</em></div><p class="mj-lead">Des recettes testées trois fois, écrites comme on les raconte à table : quantités qui s'ajustent au nombre de convives, étapes à cocher, minuteurs et une version à imprimer pour la cuisine.</p><div class="mj-actions"><a class="mj-btn" href="/recettes">Parcourir les recettes ${ic("arrow")}</a><a class="mj-btn mj-btn--line" href="/saisons">Que mange-t-on en novembre ?</a></div><p class="mj-note-h">Dix-sept recettes, trois cuisiniers, zéro précipitation.</p></div>
<div class="mj-hero-c"><div class="mj-rcard"><span class="mj-punch" aria-hidden="true"></span><p class="mj-rcard-k">Recette du jour</p>${art(f.kind, f.a, f.b, f.bg, f.title, "mj-rcard-art")}<h2 class="mj-rcard-t"><a href="/recette">${esc(f.title)}</a></h2><p class="mj-rcard-m"><span>${ic("clock")}${dur(f.min)}</span><span>${ic("user")}${f.n} pers.</span><span>${ic("flame")}Facile</span></p><p class="mj-hand">« À préparer la veille, elle est meilleure. » Léa</p></div></div></div></section>`),
    wrap(`<div class="mj-shead"><h2 class="mj-h2">Quoi à dîner ?</h2><p>Choisissez le temps dont vous disposez.</p></div><div class="mj-quick"><a class="mj-q" href="/recettes"><b>30 min</b><span>ou moins</span></a><a class="mj-q" href="/recettes"><b>1 heure</b><span>le temps d'un film</span></a><a class="mj-q" href="/recettes"><b>Tout l'après-midi</b><span>le plaisir du mijoté</span></a><a class="mj-q" href="/recettes"><b>Deux jours</b><span>pain, conserves, patience</span></a></div>`),
    wrap(`<div class="mj-shead"><h2 class="mj-h2">Dernières recettes</h2><a class="mj-more" href="/recettes">Tout voir ${ic("arrow")}</a></div><div class="mj-grid">${RECIPES.slice(1, 7).map((r) => card(r)).join("")}</div>`),
    sec(`<section class="mj-season pk-bleed"><div class="mj-wrap"><div class="mj-shead"><h2 class="mj-h2">Au marché en novembre</h2><a class="mj-more" href="/saisons">Le calendrier ${ic("arrow")}</a></div><ul class="mj-tags">${["potimarron", "châtaigne", "coing", "poireau", "pomme", "poire", "champignon", "chou frisé", "céleri-rave", "noix"].map((x) => `<li>${x}</li>`).join("")}</ul><p class="mj-lead">Ce que la terre donne maintenant, et trois recettes pour s'en servir : la soupe de potimarron, la tarte aux pommes et le chutney de figues.</p></div></section>`),
    wrap(`<div class="mj-shead"><h2 class="mj-h2">Qui cuisine ici ?</h2><a class="mj-more" href="/a-propos">Les trois cuisiniers ${ic("arrow")}</a></div><div class="mj-auth">${Object.values(AUTHORS).map((a) => `<div class="mj-au"><span class="mj-av" aria-hidden="true">${a.n[0]}</span><h3>${a.n}</h3><p class="mj-au-r">${a.r}</p><p>${a.b}</p></div>`).join("")}</div>`),
    sec(`<section class="mj-cta pk-bleed"><div class="mj-wrap mj-cta-in"><div><h2 class="mj-h2">Une question sur une recette ?</h2><p>Dites-nous ce qui a collé, brûlé ou trop bien marché. Nous répondons dans la semaine.</p></div><a class="mj-btn" href="/contact">Écrire au carnet ${ic("arrow")}</a></div></section>`),
    sec(footer(c)),
  ];
};

// ---------- liste des recettes (filtre : rubrique, étiquette, durée, mot) ----------
const recettes = (c) => [
  sec(header(c)),
  pagehead("Les recettes", "Toutes les recettes <em>du carnet</em>", "Dix-sept recettes à filtrer par rubrique, par étiquette ou par mot. Les liens ouvrent la fiche modèle du thème."),
  sec(`<section class="mj-sec pk-bleed"><div class="mj-wrap"><div class="mj-filters" data-mj-filters><div class="mj-fgroup" role="group" aria-label="Rubriques"><a class="mj-chip is-on" href="#tout" role="button" data-mj-f="cat:tout">Tout</a>${Object.entries(CATS).map(([k, v]) => `<a class="mj-chip" href="#${k}" role="button" data-mj-f="cat:${k}">${v}</a>`).join("")}</div><div class="mj-fgroup" role="group" aria-label="Étiquettes">${Object.entries(TAGS).map(([k, v]) => `<a class="mj-chip mj-chip--tag" href="#${k}" role="button" data-mj-f="tag:${k}">${v}</a>`).join("")}</div><div class="mj-fgroup" role="group" aria-label="Durée"><a class="mj-chip mj-chip--tag" href="#rapide" role="button" data-mj-f="max:45">Moins de 45 min</a></div><div class="mj-search-slot" data-mj-search></div></div>
<p class="mj-count" data-mj-count aria-live="polite">${RECIPES.length} recettes</p><div class="mj-list" data-mj-list>${RECIPES.slice(0, 9).map((r) => card(r)).join("")}</div></div></section>`),
  sec(`<section class="mj-sec mj-sec--tight pk-bleed"><div class="mj-wrap"><div class="mj-list mj-list--b">${RECIPES.slice(9).map((r) => card(r)).join("")}</div>
<div class="mj-empty mj-hid" data-mj-empty><p class="mj-empty-t">Aucune recette ne correspond.</p><p>Essayez un mot plus court, retirez une étiquette, ou <a href="#tout" data-mj-reset>réinitialisez les filtres</a>.</p></div></div></section>`),
  sec(footer(c)),
];

// ---------- fiche recette (portions ajustables) ----------
// [quantité de base pour 6, unité, libellé]
const ING = [
  [1.2, "kg", "de paleron de bœuf en gros cubes"], [150, "g", "de lardons fumés"], [3, "", "carottes en rondelles"], [2, "", "oignons piqués de clous de girofle"],
  [4, "", "gousses d'ail écrasées"], [75, "cl", "de vin rouge corsé"], [200, "g", "d'olives noires dénoyautées"], [2, "c. à s.", "de concentré de tomate"], [1, "", "bouquet garni (thym, laurier, persil)"], [3, "c. à s.", "d'huile d'olive"],
];
const STEPS = [
  ["La veille, faire mariner la viande avec le vin, l'ail, le bouquet garni et les oignons. Couvrir et laisser reposer au frais.", 0],
  ["Égoutter la viande en gardant la marinade. Faire dorer les cubes par petites quantités dans une cocotte avec l'huile d'olive, jusqu'à belle coloration.", 600],
  ["Ajouter les lardons et les carottes, puis le concentré de tomate. Mouiller avec la marinade filtrée, porter à frémissement.", 300],
  ["Couvrir et laisser mijoter à feu très doux, trois heures environ, en remuant de temps en temps. La viande doit se défaire à la fourchette.", 10800],
  ["Ajouter les olives les trente dernières minutes. Rectifier l'assaisonnement et servir très chaud avec des pommes de terre vapeur ou des pâtes fraîches.", 1800],
];
const recette = (c) => {
  const f = RECIPES[0], a = AUTHORS[f.au];
  return [
    sec(header(c)),
    sec(`<section class="mj-rec pk-bleed"><div class="mj-wrap"><div class="mj-crumbs" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/recettes">Recettes</a><span aria-hidden="true">/</span><span>Plats</span></div>
<header class="mj-rec-h"><p class="mj-card-k"><span class="mj-cat">Plats</span><span>Mijoté</span><span>De saison</span></p><div class="mj-h1" role="heading" aria-level="1">Daube de bœuf aux olives noires</div><p class="mj-lead">${esc(f.ex)}</p><p class="mj-by">Par <b>${a.n}</b> · publié le <time datetime="${f.date}">${dfr(f.date)}</time> · mis à jour le <time datetime="2026-11-04">4 novembre 2026</time></p></header>
<div class="mj-rec-art">${art(f.kind, f.a, f.b, f.bg, f.title)}</div>
<div class="mj-facts" data-mj-recipe data-base="6"><div class="mj-fact"><span>Préparation</span><b>25 min</b></div><div class="mj-fact"><span>Cuisson</span><b>3 h</b></div><div class="mj-fact"><span>Repos</span><b>12 h</b></div><div class="mj-fact"><span>Difficulté</span><b>Facile</b></div><div class="mj-fact mj-fact--n"><span>Nombre de personnes</span><span class="mj-stepper" role="group" aria-label="Nombre de personnes"><a href="#moins" role="button" aria-label="Une personne de moins" data-mj-step="-1">&minus;</a><span class="mj-n" data-mj-n aria-live="polite">6</span><a href="#plus" role="button" aria-label="Une personne de plus" data-mj-step="1">+</a></span></div></div>
<div class="mj-tools"><a class="mj-btn mj-btn--line" href="#imprimer" role="button" data-mj-print>${ic("print")} Imprimer la fiche</a><a class="mj-btn mj-btn--line" href="#decocher" role="button" data-mj-reset-checks>Tout décocher</a><span class="mj-hand">Cliquez sur un ingrédient ou une étape pour la rayer au fil de la recette.</span></div>
<div class="mj-rec-body"><aside class="mj-ings" aria-label="Ingrédients"><h2 class="mj-h3">Ingrédients</h2><p class="mj-for">Pour <b data-mj-n2>6</b> personnes</p><ul class="mj-ingl">${ING.map(([q, u, t]) => `<li><a class="mj-ing" href="#cocher" role="checkbox" aria-checked="false" data-q="${q}" data-u="${u || 'pc'}"><span class="mj-box" aria-hidden="true"></span><span class="mj-qty">${String(q).replace(".", ",")}</span> <span class="mj-u">${u}</span> <span class="mj-t">${t}</span></a></li>`).join("")}</ul></aside>
<div class="mj-steps"><h2 class="mj-h3">Préparation</h2><ol class="mj-stl">${STEPS.map(([t, s]) => `<li><a class="mj-step" href="#etape" role="checkbox" aria-checked="false">${t}</a>${s ? `<a class="mj-timer" href="#minuteur" role="button" data-mj-timer="${s}"><span data-mj-t>${ic("clock")} Minuteur ${s >= 3600 ? dur(s / 60) : s >= 60 ? Math.round(s / 60) + " min" : s + " s"}</span></a>` : ""}</li>`).join("")}</ol>
<div class="mj-lnote"><h2 class="mj-h3">Notes de ${a.n.split(" ")[0]}</h2><p>La daube se bonifie d'un jour sur l'autre : préparez-la la veille et réchauffez-la doucement. Les olives noires peuvent être remplacées par des vertes, à ajouter plus tôt si l'on veut une sauce plus amère. Elle se congèle très bien, jusqu'à trois mois.</p></div>
<h2 class="mj-h3">Valeurs nutritionnelles</h2><div class="mj-scroll" role="region" aria-label="Valeurs nutritionnelles"><table class="mj-nut"><caption>Pour une portion (valeurs indicatives, recette fictive)</caption><thead><tr><th scope="col">Nutriment</th><th scope="col">Quantité</th><th scope="col">Repère journalier</th></tr></thead><tbody><tr><td>Énergie</td><td>520 kcal</td><td>26 %</td></tr><tr><td>Protéines</td><td>42 g</td><td>84 %</td></tr><tr><td>Glucides</td><td>14 g</td><td>5 %</td></tr><tr><td>Lipides</td><td>31 g</td><td>44 %</td></tr></tbody></table></div></div></div></div></section>`),
    sec(`<section class="mj-sec mj-authbox pk-bleed"><div class="mj-wrap"><div class="mj-au mj-au--row"><span class="mj-av" aria-hidden="true">${a.n[0]}</span><div><h2 class="mj-h4">${a.n}</h2><p class="mj-au-r">${a.r}</p><p>${a.b}</p></div></div></div></section>`),
    wrap(`<div class="mj-shead"><h2 class="mj-h2">À servir avec</h2><a class="mj-more" href="/recettes">Toutes les recettes ${ic("arrow")}</a></div><div class="mj-grid">${[RECIPES[4], RECIPES[9], RECIPES[2]].map((r) => card(r)).join("")}</div>`),
    sec(footer(c)),
  ];
};

// ---------- saisons ----------
const SAISON = [
  ["Janvier", "chou, poireau, endive, céleri-rave, orange, pomme, poire, mâche", "Gratin de courge et de châtaignes"], ["Février", "betterave, panais, citron, clémentine, topinambour, chou-fleur, kiwi", "Crêpes de la Chandeleur"],
  ["Mars", "radis, épinard, blette, carotte nouvelle, rhubarbe (fin du mois), ail des ours", "Curry de pois chiches et épinards"], ["Avril", "asperge, petit pois, artichaut, radis, cresson, fraise (début)", "Houmous de betterave"],
  ["Mai", "fraise, asperge, fève, laitue, rhubarbe, petit pois, cerise", "Gâteau au yaourt"], ["Juin", "cerise, courgette, concombre, abricot, framboise, haricot vert, tomate précoce", "Salade de lentilles tiède"],
  ["Juillet", "tomate, aubergine, poivron, pêche, melon, basilic, myrtille", "Focaccia aux tomates cerises"], ["Août", "figue, prune, maïs, courgette, melon, mûre, tomate", "Chutney de figues"],
  ["Septembre", "raisin, mirabelle, champignon, figue, poire, courge, noisette", "Risotto aux champignons"], ["Octobre", "pomme, coing, châtaigne, potimarron, noix, champignon, chou", "Confiture de coings"],
  ["Novembre", "potimarron, châtaigne, coing, poireau, pomme, poire, céleri-rave, chou frisé", "Daube de bœuf aux olives"], ["Décembre", "clémentine, endive, truffe, mâche, topinambour, noix, panais", "Blanquette de veau"],
];
const saisons = (c) => [
  sec(header(c)),
  pagehead("Le calendrier", "Ce que la terre <em>donne ce mois-ci</em>", "Douze mois de fruits et de légumes de saison, avec la recette du carnet qui leur fait honneur."),
  sec(`<section class="mj-sec pk-bleed"><div class="mj-wrap" data-mj-seasons><div class="mj-months" role="group" aria-label="Choisir un mois">${SAISON.map(([m], i) => `<a class="mj-chip${i === 10 ? " is-on" : ""}" href="#m-${i + 1}" role="button" data-mj-month="${i}">${m}</a>`).join("")}</div>${SAISON.map(([m, l, r], i) => `<div class="mj-month" data-mj-panel="${i}"><h2 class="mj-h2">${m}</h2><ul class="mj-tags">${l.split(", ").map((x) => `<li>${x}</li>`).join("")}</ul><p class="mj-lead">À cuisiner ce mois-ci : <a href="/recettes">${r}</a>.</p></div>`).join("")}</div></section>`),
  wrap(`<div class="mj-note"><strong>Astuce du carnet.</strong> Un produit de saison est plus savoureux, souvent moins cher, et demande moins d'assaisonnement. Dans le doute, suivez le marché.</div>`),
  sec(footer(c)),
];

// ---------- à propos ----------
const apropos = (c) => [
  sec(header(c)),
  pagehead("À propos", "Un carnet <em>tenu à trois voix</em>", "Mijote est né dans une cuisine lyonnaise, d'un cahier à spirales et d'une envie : écrire des recettes qu'on a vraiment faites."),
  wrap(`<div class="mj-prose"><h2>Notre façon de faire</h2><p>Chaque recette est cuisinée au moins trois fois avant d'être publiée : une fois pour l'écrire, une fois pour vérifier les quantités, une fois pour la faire goûter à des gens qui n'ont pas lu la fiche. Quand une étape demande de l'œil ou de l'oreille, nous le disons.</p><h2>Ce que vous trouverez ici</h2><ul><li>Des quantités qui s'ajustent au nombre de personnes ;</li><li>Des étapes courtes, à cocher pendant que vous cuisinez ;</li><li>Une version imprimable qui tient sur une feuille ;</li><li>Aucune publicité, aucune vidéo qui démarre toute seule.</li></ul></div><div class="mj-auth">${Object.values(AUTHORS).map((a) => `<div class="mj-au"><span class="mj-av" aria-hidden="true">${a.n[0]}</span><h3>${a.n}</h3><p class="mj-au-r">${a.r}</p><p>${a.b}</p></div>`).join("")}</div>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Écrire <em>au carnet</em>", "Une question, une variante à partager, une erreur de quantité : nous lisons tout."),
  { type: "form", heading: "Votre message", intro: "Dites-nous quelle recette vous occupe. Le formulaire fonctionne comme sur un vrai site, mais cette démonstration ne l'envoie à personne." },
  sec(`<section class="mj-sec pk-bleed"><div class="mj-wrap"><div class="mj-note"><strong>Avant d'écrire.</strong> Précisez la recette concernée, le nombre de personnes et le matériel utilisé (four à chaleur tournante, cocotte en fonte…) : cela nous aide à répondre juste.</div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher <em>une recette</em>", "Un ingrédient, un plat, un cuisinier : tapez un mot."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une recette, un ingrédient…" } }] },
  wrap(`<div class="mj-empty"><p class="mj-empty-t">Rien ne correspond à votre recherche ?</p><p>Vérifiez l'orthographe, essayez un mot plus court (« courge » plutôt que « courge butternut »), ou parcourez <a href="/recettes">toutes les recettes</a> et le <a href="/saisons">calendrier de saison</a>.</p></div>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="mj-404 pk-bleed"><div class="mj-wrap mj-404-in"><div class="mj-404-art" aria-hidden="true"><svg viewBox="0 0 200 160"><ellipse cx="100" cy="146" rx="70" ry="7" fill="#2b2118" opacity=".12"/><path d="M40 70h120v14a50 50 0 0 1-50 50H90A50 50 0 0 1 40 84z" fill="#a63a1c"/><path d="M26 70h22M152 70h22" stroke="#a63a1c" stroke-width="8" stroke-linecap="round"/><path d="M70 56c-10-10 10-14 0-26M100 56c-10-10 10-14 0-26M130 56c-10-10 10-14 0-26" class="mj-steam" fill="none" stroke="#2b2118" stroke-width="5" stroke-linecap="round"/><path d="M84 100q16 14 32 0" fill="none" stroke="#fdf6e3" stroke-width="5" stroke-linecap="round"/></svg></div><div><p class="mj-eyebrow">Erreur 404</p><div class="mj-h1" role="heading" aria-level="1">Cette page a <em>un peu attaché</em>.</div><p class="mj-lead">Le lien est périmé ou l'adresse est erronée : la recette que vous cherchez n'est plus au menu. Retournez à la table des matières.</p><div class="mj-actions"><a class="mj-btn" href="/recettes">Voir les recettes ${ic("arrow")}</a><a class="mj-btn mj-btn--line" href="/">Accueil</a></div></div></div></section>`),
  sec(footer(c)),
];
const wrapLegal = (c, parts) => [sec(header(c)), ...parts, sec(footer(c))];
const mentions = (c) => wrapLegal(c, common.mentions());
const confidentialite = (c) => wrapLegal(c, common.confidentialite());
const blocs = (c) => wrapLegal(c, common.blocs());

module.exports = {
  key: "mijote", name: "Mijote", version: "1.0.0", category: "gastronomie", tags: ["chaleureux", "classique", "editorial"], siteType: "Blog de recettes", collection: "blog", featured: false,
  concept: "Un carnet de cuisine à trois voix : nappe vichy et fiches cartonnées perforées, quantités qui s'ajustent au nombre de convives, ingrédients et étapes à cocher, minuteurs, version imprimable et calendrier de saison.",
  description: "Blog de recettes chaleureux : fiche à portions ajustables, ingrédients et étapes à cocher, minuteurs d'étape, impression propre, recettes filtrables par rubrique, étiquette et durée, calendrier des produits de saison.",
  brand: "Mijote", modules: ["formulaires", "recherche"],
  contentModel: "Recettes, rubriques, étiquettes et cuisiniers sont écrits dans les pages du thème (aucun type de contenu « recette » ni balisage Recipe dans le CMS pour l'instant) ; le recalcul des portions, les coches, les minuteurs et les filtres sont exécutés dans motion.js.",
  dna: {
    hero: "carte-de-recette-perforee-inclinee-posee-sur-nappe-vichy",
    header: "ruban-vichy-sous-logo-casserole-et-menu-en-ligne",
    grid: "cartes-de-recette-sur-trois-colonnes-a-assiette-illustree",
    typo: "empattement-gras-arrondi-style-cooper-avec-manuscrit-d-annotation",
    shapes: "cartes-cartonnees-aux-bords-perfores-coches-carrees-et-pastilles-rondes",
    motion: "vapeur-qui-monte-coches-qui-se-rayent-et-minuteur-qui-decompte",
    rhythm: "bandes-creme-et-carreaux-rouges-separees-par-filets-pointilles",
    signature: "fiche-recette-a-portions-ajustables-ingredients-et-etapes-a-cocher-minuteurs-et-impression",
    palette: "parchemin-creme-rouge-tomate-cuite-et-jaune-curcuma",
    image: "assiettes-vues-du-dessus-en-aplats-vectoriels",
    list: "recettes-filtrables-en-grille-carnet-ou-index",
    article: "fiche-ingredients-colles-a-gauche-et-etapes-numerotees",
    sidebar: "ingredients-collants-a-gauche-de-la-fiche",
    reading: "serif-humaniste-dix-huit-pixels-ligne-de-soixante-six-signes-et-etapes-aerees",
  },
  tokens: {
    colors: { primary: "#a63a1c", secondary: "#2b2118", accent: "#e8b923", background: "#fdf6e3", surface: "#fffdf8", text: "#2b2118", muted: "#5e5146", success: "#2e6b3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.caprasimo", body: "font.alegreya", button: "font.alegreya", link: "font.caveat" },
    radius: { sm: 4, md: 8, lg: 14, button: 999, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#2b2118" },
    type: { h1: { size: 56, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 36, weight: 400, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge des carreaux et des boutons", type: "color", default: "#a63a1c" },
    { key: "entete", label: "En-tête", type: "choice", default: "ruban", choices: [["ruban", "Ruban : logo à gauche, menu à droite"], ["centre", "Centré : logo au-dessus du menu"], ["compact", "Compact : menu toujours replié"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "complet", choices: [["complet", "Complet : colonnes de liens"], ["sobre", "Sobre : une seule ligne"]] },
    { key: "liste", label: "Liste des recettes", type: "choice", default: "grille", choices: [["grille", "Grille de cartes"], ["carnet", "Carnet : une recette par ligne"], ["index", "Index : texte seul, très dense"]] },
    { key: "fiche", label: "Fiche recette", type: "choice", default: "carte", choices: [["carte", "Carte : ingrédients collés à gauche"], ["journal", "Journal : récit puis ingrédients en dessous"]] },
    { key: "vapeur", label: "Vapeur du logo", type: "choice", default: "on", choices: [["on", "Animée"], ["off", "Fixe"]] },
  ],
  menu: [["Accueil", "/"], ["Recettes", "/recettes"], ["Saisons", "/saisons"], ["À propos", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "recettes", name: "Recettes (liste filtrable)", render: recettes }, { key: "recette", name: "Fiche recette", render: recette },
    { key: "saisons", name: "Calendrier de saison", render: saisons }, { key: "a-propos", name: "À propos", render: apropos }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite }, { key: "blocs", name: "Blocs de contenu", render: blocs },
  ],
};
