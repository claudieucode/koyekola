// Étape — blog de voyage. Direction artistique : le carnet de route. Papier de carnet crème, lagon profond et mangue ; tampons de visa imprimés en HTML, étiquettes de bagage, polaroïds illustrés en SVG,
// tracé d'itinéraire en pointillé et fiche pratique collante. Composant signature : le composeur d'itinéraire (cocher les étapes, jours / kilomètres / budget cumulés) et les destinations filtrables.
const { sec, esc } = require("../kit");

/* ---------- Données (écrites dans le thème : le CMS n'a pas de type « destination ») ---------- */
const AUTEURS = {
  camille: { n: "Camille Roux", r: "Rédactrice en chef, carnettiste", b: "Écrit depuis Lyon et partout ailleurs. Ancienne journaliste de presse régionale, elle voyage lentement et prend des notes à la main." },
  mehdi: { n: "Mehdi Ouali", r: "Itinéraires et budgets", b: "Ingénieur reconverti. Il tient les comptes de chaque voyage dans un tableur et trace des itinéraires que l'on peut vraiment faire." },
  sofia: { n: "Sofia Brandt", r: "Photographe et reporter", b: "Franco-allemande, installée à Strasbourg. Elle raconte les routes, les marchés et les gens rencontrés en chemin." },
  theo: { n: "Théo Lambert", r: "Montagne et grand froid", b: "Guide accompagnateur en moyenne montagne, il écrit sur le matériel, la sécurité et les paysages qui demandent un peu d'effort." },
};
const CATS = ["Récits", "Itinéraires", "Conseils pratiques", "Cuisine et marchés", "Budget"];
const SAISONS = ["printemps", "été", "automne", "hiver"];
const CONTS = ["Europe", "Afrique", "Asie", "Amériques"];
// [id, titre, destination, continent, saison, catégorie, auteur, date, minutes, extrait, étiquettes]
const ART = [
  ["lisbonne", "Trois jours à Lisbonne sans prendre le tram 28", "Lisbonne", "Europe", "printemps", "Récits", "camille", "2026-03-14", 9, "Des escaliers, des miradouros et un pastel de nata à chaque coin : comment nous avons appris la ville à pied, et ce que nous avons évité.", ["ville", "à pied", "Portugal"]],
  ["alentejo", "L'Alentejo à vélo : 240 km entre chênes-lièges et plages vides", "Alentejo", "Europe", "printemps", "Itinéraires", "mehdi", "2026-02-27", 12, "Six étapes de 40 km, des villages blancs et une côte presque déserte. Le détail des routes, des dénivelés et des auberges.", ["vélo", "Portugal", "côte"]],
  ["marrakech", "Marrakech hors des sentiers : les souks du matin", "Marrakech", "Afrique", "automne", "Récits", "sofia", "2026-02-10", 8, "À six heures, la médina appartient aux livreurs et aux boulangers. Une promenade avant que les groupes n'arrivent.", ["médina", "Maroc", "photo"]],
  ["tbilissi", "Tbilissi, ville de balcons : un week-end en six repas", "Tbilissi", "Asie", "automne", "Cuisine et marchés", "theo", "2026-01-22", 7, "Khachapuri, khinkali, vin orange : une ville qui se raconte à table, de la place de la Liberté aux bains soufrés.", ["Géorgie", "cuisine", "week-end"]],
  ["hokkaido", "Hokkaido en hiver : lire la neige", "Hokkaido", "Asie", "hiver", "Récits", "camille", "2026-01-08", 14, "Dix jours entre Sapporo, Niseko et la côte d'Okhotsk : la poudreuse, les onsen et le silence qui tombe avec les flocons.", ["Japon", "neige", "onsen"]],
  ["kyoto-budget", "Kyoto sans se ruiner : combien nous avons vraiment dépensé", "Kyoto", "Asie", "printemps", "Budget", "mehdi", "2025-12-18", 10, "Cinq jours, deux voyageurs, tous les tickets conservés. Le tableau poste par poste, et les économies qui ne gâchent rien.", ["Japon", "budget", "temples"]],
  ["islande", "Islande : la route 1 en neuf jours, étape par étape", "Islande", "Europe", "été", "Itinéraires", "sofia", "2025-12-02", 15, "1 330 kilomètres de cascades, de coulées noires et de moutons. Notre itinéraire complet, avec les nuits et les stations-service.", ["route", "volcans", "été"]],
  ["patagonie", "Patagonie : ce que le vent apprend aux randonneurs", "Patagonie", "Amériques", "été", "Récits", "theo", "2025-11-19", 13, "Le circuit W sous des rafales à 100 km/h : préparation, erreurs et un refuge qui sent la soupe de lentilles.", ["rando", "Chili", "vent"]],
  ["oaxaca", "Oaxaca, sept moles et un marché", "Oaxaca", "Amériques", "automne", "Cuisine et marchés", "camille", "2025-11-03", 8, "Noir, rouge, jaune, vert : une semaine pour apprendre à distinguer les sauces et à marchander les tlayudas.", ["Mexique", "marché", "cuisine"]],
  ["cap-vert", "Cap-Vert : sauter d'île en île avec un budget serré", "Cap-Vert", "Afrique", "hiver", "Budget", "mehdi", "2025-10-15", 11, "Trois îles, des ferries irréguliers et des morabeza à tous les repas. Les horaires, les prix et ce qu'il vaut mieux réserver.", ["îles", "ferry", "budget"]],
  ["sicile", "Sicile en voiture : les routes de l'intérieur", "Sicile", "Europe", "printemps", "Itinéraires", "sofia", "2025-09-30", 12, "Loin du littoral, des villages perchés, des ricotta tièdes et des routes qui serpentent entre les blés. Une boucle de huit jours.", ["voiture", "Italie", "villages"]],
  ["laponie", "Laponie : dormir dehors à −20 °C, mode d'emploi", "Laponie", "Europe", "hiver", "Conseils pratiques", "theo", "2025-09-12", 9, "Système trois couches, sac à plusieurs saisons, règles de sécurité : tout ce qu'un guide vérifie avant la première nuit sous la neige.", ["grand froid", "matériel", "sécurité"]],
  ["sac-7-kilos", "Un sac de sept kilos pour trois mois : la liste complète", "Partout", "Partout", "toutes", "Conseils pratiques", "camille", "2025-08-25", 6, "Chaque objet pesé et justifié. Ce que nous avons enlevé après le premier mois, et ce que nous n'aurions jamais dû laisser.", ["bagage", "liste", "léger"]],
  ["trains-nuit", "Les trains de nuit qui valent encore le détour", "Partout", "Europe", "toutes", "Conseils pratiques", "mehdi", "2025-08-04", 8, "Vienne–Venise, Stockholm–Narvik, Paris–Nice : lesquels réserver, quelles couchettes choisir, et comment dormir vraiment.", ["train", "Europe", "nuit"]],
  ["erreurs", "Cinq erreurs de débutant que nous referons sûrement", "Partout", "Partout", "toutes", "Récits", "sofia", "2025-07-17", 5, "Trop d'étapes, pas assez de marges, une valise à roulettes sur un chemin de terre : petit inventaire d'humilité.", ["humour", "conseils", "erreurs"]],
  ["assurance", "Assurance voyage : lire les clauses qui comptent", "Partout", "Partout", "toutes", "Conseils pratiques", "theo", "2025-06-30", 7, "Rapatriement, bagages, annulation : trois clauses à vérifier ligne à ligne avant de payer, et ce que couvre déjà votre carte bancaire.", ["assurance", "santé", "préparation"]],
];
// [id, nom, pays, continent, saison idéale, durée conseillée (jours), budget par jour (€), coordonnées, mot-clé]
const DEST = [
  ["lisbonne", "Lisbonne", "Portugal", "Europe", "printemps", 4, 95, "38°43′ N · 9°08′ O", "collines et azulejos"],
  ["alentejo", "Alentejo", "Portugal", "Europe", "printemps", 6, 70, "38°34′ N · 7°54′ O", "plaines et villages blancs"],
  ["marrakech", "Marrakech", "Maroc", "Afrique", "automne", 4, 60, "31°38′ N · 8°00′ O", "médina et remparts roses"],
  ["tbilissi", "Tbilissi", "Géorgie", "Asie", "automne", 4, 55, "41°43′ N · 44°47′ E", "balcons de bois sculptés"],
  ["hokkaido", "Hokkaido", "Japon", "Asie", "hiver", 9, 130, "43°03′ N · 141°21′ E", "poudreuse et sources chaudes"],
  ["kyoto", "Kyoto", "Japon", "Asie", "printemps", 5, 110, "35°01′ N · 135°46′ E", "temples et ruelles de bois"],
  ["islande", "Islande", "Islande", "Europe", "été", 9, 160, "64°08′ N · 21°56′ O", "cascades et lave noire"],
  ["patagonie", "Patagonie", "Chili et Argentine", "Amériques", "été", 14, 90, "50°56′ S · 73°24′ O", "glaciers et vents d'ouest"],
  ["oaxaca", "Oaxaca", "Mexique", "Amériques", "automne", 5, 50, "17°04′ N · 96°43′ O", "marchés et sauces moles"],
  ["cap-vert", "Cap-Vert", "Cap-Vert", "Afrique", "hiver", 10, 65, "14°55′ N · 23°30′ O", "îles volcaniques"],
  ["sicile", "Sicile", "Italie", "Europe", "printemps", 8, 85, "37°30′ N · 14°00′ E", "blés et villages perchés"],
  ["laponie", "Laponie", "Finlande", "Europe", "hiver", 6, 140, "68°25′ N · 27°24′ E", "forêts givrées, aurores"],
];
// Itinéraire composable : [étape, jours, kilomètres depuis l'étape précédente, budget (€), note]
const ETAPES = [
  ["Lisbonne", 3, 0, 230, "Arrivée par avion ; les trois premiers jours servent à poser le rythme du voyage."],
  ["Évora", 1, 150, 80, "Chapelle des Os, temple romain et une nuit dans une ferme à l'orée de la ville."],
  ["Séville", 2, 230, 150, "Train de jour par Faro ; l'Alcazar tôt le matin, les tapas le soir."],
  ["Tarifa", 1, 200, 90, "Dernière plage d'Europe avant le détroit ; vent assuré."],
  ["Tanger", 2, 35, 110, "Ferry de 1 h 15 ; la médina et le café Hafa pour un thé à la menthe sur la falaise."],
  ["Chefchaouen", 2, 115, 85, "La ville bleue, mais surtout les sentiers du Rif qui la dominent."],
  ["Fès", 2, 200, 100, "Les tanneries à l'aube, la plus vieille université du monde et ses ruelles sans voiture."],
  ["Marrakech", 3, 500, 170, "Train de jour jusqu'au bout ; trois jours pour ne rien faire de précis."],
];
const fdate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- Illustrations : polaroïds en SVG (ciel, soleil, reliefs, eau) selon la destination ---------- */
const PAL = { Europe: ["#cfe6e4", "#f2b45a", "#0d6e6e", "#3d8f86", "#e9dcc0"], Afrique: ["#f7d9b0", "#e5742c", "#a5471d", "#d98b4f", "#f0c78d"], Asie: ["#e5ebf2", "#d6402d", "#34556b", "#6d8ba0", "#f1ece1"], Amériques: ["#d7e9f2", "#f0b429", "#2a6d52", "#5aa78a", "#e6dfc9"], Partout: ["#e6e0cf", "#e08a2c", "#0d6e6e", "#7aa8a0", "#f3ecd9"] };
function pic(seed, cont, label) {
  const p = PAL[cont] || PAL.Partout; let s = (seed * 9301 + 49297) % 233280; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const h1 = 90 + Math.round(r() * 40), h2 = 110 + Math.round(r() * 40), sx = 40 + Math.round(r() * 120), sy = 36 + Math.round(r() * 26);
  const m1 = `M0 ${h1}Q${50 + Math.round(r() * 30)} ${h1 - 36} ${100 + Math.round(r() * 20)} ${h1 - 8}T200 ${h1 - 20}V150H0Z`;
  const m2 = `M0 ${h2}Q${60 + Math.round(r() * 30)} ${h2 - 30} ${120} ${h2 - 4}T200 ${h2 - 14}V150H0Z`;
  return `<svg class="et-pic" viewBox="0 0 200 150" role="img" aria-label="${esc(label)}"><rect width="200" height="150" fill="${p[0]}"/><circle cx="${sx}" cy="${sy}" r="${14 + Math.round(r() * 8)}" fill="${p[1]}"/><path d="${m1}" fill="${p[3]}"/><path d="${m2}" fill="${p[2]}"/><path d="M0 138H200V150H0Z" fill="${p[4]}" opacity=".55"/></svg>`;
}
const MARK = `<svg class="et-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 6l4 14-4 14-4-14z" fill="currentColor"/><circle cx="20" cy="20" r="2.4" fill="#fbf7ee"/></svg>`;
const ARROW = `<svg class="et-ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const stamp = (top, mid, bot, cls = "") => `<span class="et-stamp ${cls}" aria-hidden="true"><i>${esc(top)}</i><b>${esc(mid)}</b><i>${esc(bot)}</i></span>`;

/* ---------- En-tête, pied ---------- */
const NAV = [["Accueil", "/", "01"], ["Journal", "/journal", "02"], ["Destinations", "/destinations", "03"], ["Itinéraires", "/itineraires", "04"], ["À propos", "/a-propos", "05"], ["Contact", "/contact", "06"]];
const header = (c) => `<header class="et-head pk-bleed"><div class="et-wrap et-bar">
  <a class="et-logo" href="/" aria-label="${esc(c.brand)}, accueil">${MARK}<span><b>Étape</b><small>carnet de route</small></span></a>
  <div role="navigation" class="et-nav" aria-label="Navigation principale">${NAV.map(([l, u, n]) => `<a href="${u}"><i>${n}</i>${esc(l)}</a>`).join("")}</div>
  <a class="et-find-link" href="/recherche">Rechercher</a>
  <details class="et-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="et-drawer" role="navigation" aria-label="Menu mobile">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}<a href="/recherche">Rechercher</a></div></details>
</div></header>`;
const footer = () => `<footer class="et-foot pk-bleed"><div class="et-wrap"><div class="et-foot-top">
  <div class="et-foot-brand">${MARK}<p><b>Étape</b> est un blog de voyage indépendant : des récits, des itinéraires chiffrés et des conseils vérifiés sur place. Aucune publicité, aucun séjour offert.</p></div>
  <div class="et-fcol" role="navigation" aria-label="Rubriques"><p class="et-fh">Lire</p><a href="/journal">Le journal</a><a href="/destinations">Destinations</a><a href="/itineraires">Itinéraires</a><a href="/blocs">Exemples de mise en page</a></div>
  <div class="et-fcol" role="navigation" aria-label="Le carnet"><p class="et-fh">Le carnet</p><a href="/a-propos">Les carnettistes</a><a href="/contact">Écrire à la rédaction</a><a href="/recherche">Rechercher</a></div>
  <div class="et-fcol" role="navigation" aria-label="Informations légales"><p class="et-fh">Informations</p><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div>
</div><p class="et-legal">© Étape — site de démonstration : les voyages, les personnes et les chiffres cités sont fictifs.</p></div></footer>`;

const head = (kicker, title, sub, extra = "") => sec(`<section class="et-ph pk-bleed"><div class="et-wrap"><p class="et-kick"><span>${esc(kicker)}</span></p><div class="et-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="et-lead">${esc(sub)}</p>` : ""}${extra}</div></section>`);
const chips = (label, key, list, all = "Tout") => `<div class="et-fg"><p class="et-fl">${label}</p><ul class="et-chips" role="group" aria-label="${label}" data-chips="${key}"><li><a href="#filtre" class="is-on" data-v="tout">${all}</a></li>${list.map((x) => `<li><a href="#filtre" data-v="${esc(slug(x))}">${esc(x)}</a></li>`).join("")}</ul></div>`;

/* ---------- Carte d'article (3 mises en liste par CSS) ---------- */
function card(a, i, big) {
  const [id, t, d, cont, sai, cat, au, date, min, ex, tags] = a; const A = AUTEURS[au];
  return `<li class="et-card${big ? " et-card--big" : ""}" data-cat="${slug(cat)}" data-cont="${slug(cont)}" data-sai="${slug(sai)}">
  <a class="et-card-in" href="/article"><span class="et-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="et-card-pic">${pic(i + 3, cont, `Illustration : ${d}`)}</span>
  <span class="et-card-tx"><span class="et-tag">${esc(cat)}</span><span class="et-card-t">${esc(t)}</span><span class="et-card-x">${esc(ex)}</span><span class="et-meta"><span>${esc(A.n)}</span><time datetime="${date}">${fdate(date)}</time><span>${min} min</span></span></span></a></li>`;
}
const cards = (list, cls = "") => `<ul class="et-cards ${cls}" data-list>${list.map((a, i) => card(a, ART.indexOf(a), i === 0 && cls.includes("first"))).join("")}</ul><p class="et-none" data-none hidden>Aucune étape ne correspond à ce filtre. <a href="#tout" data-reset>Tout afficher</a></p>`;

/* ---------- Pages ---------- */
const home = (c) => [sec(header(c)),
  sec(`<section class="et-hero pk-bleed"><div class="et-wrap et-hero-in"><div class="et-hero-tx">
    <p class="et-kick"><span>Blog de voyage indépendant</span></p>
    <div class="et-h1" role="heading" aria-level="1">Le monde, <em>une étape</em> à la fois.</div>
    <p class="et-lead">Des récits écrits sur la route, des itinéraires chiffrés au kilomètre et au euro près, et des conseils testés par quatre carnettistes qui préfèrent le train à l'avion.</p>
    <div class="et-actions"><a class="et-btn" href="/journal">Lire le journal ${ARROW}</a><a class="et-btn et-btn--line" href="/itineraires">Composer un itinéraire</a></div></div>
    <div class="et-book" aria-hidden="true"><div class="et-page et-page--l">${pic(5, "Europe", "Lisbonne au printemps")}${stamp("Entrée", "LISBONNE", "14 mars")}</div><div class="et-page et-page--r"><svg class="et-route" viewBox="0 0 220 260" aria-hidden="true" focusable="false"><path class="et-dash" d="M30 230C60 190 40 150 90 130S190 120 170 70 120 30 150 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="30" cy="230" r="7" fill="currentColor"/><circle cx="90" cy="130" r="5" fill="currentColor"/><circle cx="170" cy="70" r="5" fill="currentColor"/><path d="M150 16l-4 11 11-1z" fill="currentColor"/></svg>${stamp("Sortie", "MARRAKECH", "26 mars", "et-stamp--b")}</div></div></div></section>`),
  sec(`<section class="et-s pk-bleed"><div class="et-wrap"><div class="et-sh"><div><p class="et-kick"><span>Dernières étapes</span></p><h2>Au fil du journal</h2></div><a class="et-more" href="/journal">Tous les articles ${ARROW}</a></div>${cards(ART.slice(0, 6), "et-cards--first")}</div></section>`),
  sec(`<section class="et-s et-s--sand pk-bleed"><div class="et-wrap"><div class="et-sh"><div><p class="et-kick"><span>Où aller</span></p><h2>Douze destinations, une saison idéale chacune</h2></div><a class="et-more" href="/destinations">Voir les destinations ${ARROW}</a></div>
    <ul class="et-tags-row">${DEST.slice(0, 8).map((d, i) => `<li class="et-bag"><a href="/destinations"><span class="et-bag-hole" aria-hidden="true"></span><b>${esc(d[1])}</b><small>${esc(d[2])}</small><span class="et-bag-s">${esc(d[4])} · ${d[5]} j</span></a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="et-s pk-bleed"><div class="et-wrap et-twocol"><div><p class="et-kick"><span>Itinéraire à la une</span></p><h2>Lisbonne – Marrakech par le détroit</h2><p class="et-lead">Huit étapes, quinze jours, 1 430 kilomètres et un budget de 1 015 euros par personne hors vol. Cochez les étapes que vous gardez : les totaux se recalculent.</p><a class="et-btn" href="/itineraires">Ouvrir l'itinéraire ${ARROW}</a></div>
    <ol class="et-mini">${ETAPES.map((e, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(e[0])}</b><small>${e[1]} j</small></li>`).join("")}</ol></div></section>`),
  sec(`<section class="et-s et-s--ink pk-bleed"><div class="et-wrap et-voices"><h2 class="et-vh">Les carnettistes</h2><ul>${Object.values(AUTEURS).map((a) => `<li><b>${esc(a.n)}</b><span>${esc(a.r)}</span></li>`).join("")}</ul><a class="et-more" href="/a-propos">Rencontrer l'équipe ${ARROW}</a></div></section>`),
  sec(footer())];

const journal = (c) => [sec(header(c)), head("Le journal", "Tous les <em>récits</em> et conseils", "Seize articles pour préparer, partir et revenir. Filtrez par rubrique ou par saison idéale ; le compteur indique ce qui reste affiché."),
  sec(`<section class="et-s pk-bleed" data-filter="journal"><div class="et-wrap"><div class="et-filters">${chips("Rubrique", "cat", CATS, "Toutes")}${chips("Saison idéale", "sai", ["printemps", "été", "automne", "hiver"], "Toutes")}</div><p class="et-count" data-count aria-live="polite"><b>${ART.length}</b> articles</p>${cards(ART)}</div></section>`),
  sec(`<section class="et-s et-s--sand pk-bleed"><div class="et-wrap et-years"><h2>Archives par année</h2><ul><li><b>2026</b><span>3 articles</span></li><li><b>2025</b><span>13 articles</span></li></ul><p class="et-note">Le journal est publié à raison d'un article par quinzaine. Pour être prévenu, <a href="/contact">écrivez-nous</a> : nous envoyons un courriel par mois, jamais plus.</p></div></section>`),
  sec(footer())];

const A0 = ART[0], FICHE = DEST[0];
const article = (c) => [sec(header(c)),
  sec(`<section class="et-arth pk-bleed"><div class="et-wrap"><div role="navigation" class="et-crumb" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/journal">Journal</a><span>/</span><span>Récits</span></div>
    <p class="et-kick"><span>${esc(A0[5])} · ${esc(A0[2])}</span></p><div class="et-h1" role="heading" aria-level="1">${esc(A0[1])}</div><p class="et-lead">${esc(A0[9])}</p>
    <p class="et-meta et-meta--l"><span>Par ${esc(AUTEURS.camille.n)}</span><time datetime="${A0[7]}">${fdate(A0[7])}</time><span>${A0[8]} min de lecture</span></p></div></section>`),
  sec(`<section class="et-s pk-bleed"><div class="et-wrap et-art">
    <article class="et-prose"><figure class="et-fig">${pic(11, "Europe", "Lisbonne : toits de tuiles et fleuve au loin")}<figcaption>Depuis le miradouro de Santa Luzia, à huit heures. Les toits rouges descendent jusqu'au Tage.</figcaption></figure>
      <p>Nous sommes arrivés à Lisbonne un jeudi, sous un ciel de lessive propre. La règle du séjour était simple : pas de tram 28, pas de file d'attente de plus de dix minutes, pas de monument avant midi. Le reste, nous l'avons laissé au hasard des pentes.</p>
      <h2>Jour un : monter, puis descendre</h2>
      <p>La ville s'apprend à l'envers. On commence en haut, à l'Alfama, quand les ruelles sentent encore le café, puis on descend vers le fleuve par des escaliers dont personne ne connaît le nom. Au deuxième palier, une vieille dame étendait des draps entre deux fenêtres : la scène de carte postale que tout le monde cherche, sans personne autour.</p>
      <blockquote class="et-quote"><p>À Lisbonne, le plus court chemin n'est jamais celui qui évite la colline : c'est celui qui s'arrête trois fois pour regarder derrière soi.</p><cite>Carnet du 14 mars</cite></blockquote>
      <p>Pour déjeuner, un comptoir de six places près de la Sé, une assiette de sardines grillées à neuf euros et du vinho verde servi dans des verres à moutarde. Nous y sommes retournés le lendemain.</p>
      <h2>Jour deux : le fleuve plutôt que le tram</h2>
      <p>Le trajet en ferry entre Cais do Sodré et Cacilhas coûte 1,40 euro et dure dix minutes. De l'autre rive, la ville apparaît d'un seul bloc, dorée par la lumière rasante. C'est notre meilleure photographie du voyage, et elle n'a coûté qu'un ticket de ferry.</p>
      <div class="et-tip"><b>Bon à savoir</b><p>Le billet de ferry se paie avec la carte rechargeable <em>Viva Viagem</em> (0,50 euro) : prenez-la dès le premier jour, elle sert aussi dans le métro et les funiculaires.</p></div>
      <h2>Jour trois : ne rien planifier</h2>
      <p>Le dernier jour, nous avons marché sans destination. Une librairie de livres d'occasion, un kiosque à ginjinha, une place où des retraités jouaient aux cartes. Nous avons compris que Lisbonne ne se visite pas : elle se fréquente.</p>
      <h3>Ce que nous referions</h3>
      <ul><li>Dormir à Graça plutôt qu'au Chiado : plus calme, moins cher.</li><li>Acheter les pastéis de nata chez les boulangers de quartier, pas chez les célèbres.</li><li>Garder une demi-journée libre pour se perdre.</li></ul>
      <p class="et-sign">— Camille</p>
      <div class="et-share"><span>Partager</span><a href="/contact">Écrire à Camille</a><a href="/journal">Autres récits</a></div>
    </article>
    <aside class="et-fiche" aria-label="Fiche pratique"><div class="et-fiche-in"><p class="et-fh">Fiche pratique</p><h2>${esc(FICHE[1])}</h2><dl><dt>Pays</dt><dd>${esc(FICHE[2])}</dd><dt>Saison idéale</dt><dd>${esc(FICHE[4])}</dd><dt>Durée conseillée</dt><dd>${FICHE[5]} jours</dd><dt>Budget par jour</dt><dd>${FICHE[6]} € par personne</dd><dt>Coordonnées</dt><dd>${esc(FICHE[7])}</dd></dl>${stamp("Visa", "OK", "Lisbonne")}<p class="et-note">Budget : hébergement en chambre double, deux repas, transports locaux. Hors vol.</p></div></aside></div></section>`),
  sec(`<section class="et-s et-s--sand pk-bleed"><div class="et-wrap"><div class="et-sh"><div><p class="et-kick"><span>À lire ensuite</span></p><h2>Autres étapes du carnet</h2></div></div>${cards([ART[1], ART[5], ART[13]])}</div></section>`),
  sec(footer())];

const destinations = (c) => [sec(header(c)), head("Destinations", "Où aller, <em>et quand</em>", "Douze destinations que nous avons arpentées. Chaque étiquette indique la saison idéale, la durée conseillée et un budget quotidien moyen."),
  sec(`<section class="et-s pk-bleed" data-filter="dest"><div class="et-wrap"><div class="et-filters">${chips("Continent", "cont", CONTS, "Tous")}${chips("Saison idéale", "sai", SAISONS, "Toutes")}</div><p class="et-count" data-count aria-live="polite"><b>${DEST.length}</b> destinations</p>
    <ul class="et-dests" data-list>${DEST.map((d, i) => `<li class="et-dest" data-cont="${slug(d[3])}" data-sai="${slug(d[4])}"><div class="et-dest-pic">${pic(i + 20, d[3], `Illustration : ${d[1]}`)}</div><div class="et-dest-tx"><p class="et-tag">${esc(d[3])}</p><h2>${esc(d[1])}</h2><p class="et-dest-k">${esc(d[2])} · ${esc(d[8])}</p><dl><dt>Saison</dt><dd>${esc(d[4])}</dd><dt>Durée</dt><dd>${d[5]} jours</dd><dt>Budget</dt><dd>${d[6]} €/jour</dd></dl><p class="et-coord">${esc(d[7])}</p><a class="et-more" href="/journal">Lire les articles ${ARROW}</a></div></li>`).join("")}</ul>
    <p class="et-none" data-none hidden>Aucune destination ne correspond à ce filtre. <a href="#tout" data-reset>Tout afficher</a></p></div></section>`),
  sec(footer())];

const tot = ETAPES.reduce((a, e) => [a[0] + e[1], a[1] + e[2], a[2] + e[3]], [0, 0, 0]);
const itineraires = (c) => [sec(header(c)), head("Itinéraires", "Composez <em>votre</em> itinéraire", "Lisbonne – Marrakech par le détroit de Gibraltar. Décochez une étape pour la retirer : les jours, les kilomètres et le budget se recalculent aussitôt."),
  sec(`<section class="et-s pk-bleed" data-route><div class="et-wrap et-rt">
    <ol class="et-stages" data-stages>${ETAPES.map((e, i) => `<li class="et-stage" data-j="${e[1]}" data-km="${e[2]}" data-eur="${e[3]}"><span class="et-stage-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div><h2>${esc(e[0])}</h2><p>${esc(e[4])}</p><p class="et-stage-m"><span>${e[1]} j</span><span>${e[2]} km</span><span>${e[3]} €</span></p></div></li>`).join("")}</ol>
    <aside class="et-sum" aria-label="Totaux de l'itinéraire"><div class="et-sum-in"><p class="et-fh">Votre carnet</p><dl><dt>Étapes</dt><dd><b data-t="n">${ETAPES.length}</b> / ${ETAPES.length}</dd><dt>Jours</dt><dd><b data-t="j">${tot[0]}</b></dd><dt>Kilomètres</dt><dd><b data-t="km">${tot[1]}</b></dd><dt>Budget par personne</dt><dd><b data-t="eur">${tot[2]}</b> €</dd></dl><p class="et-note">Hors vols. Chambre double, repas du soir et transports. Les distances sont à vol de route, entre deux étapes consécutives cochées.</p><a class="et-btn et-btn--line" href="#tout" data-reset>Tout recocher</a></div></aside></div></section>`),
  sec(footer())];

const aPropos = (c) => [sec(header(c)), head("À propos", "Quatre <em>carnets</em>, une même règle", "Nous ne publions que les voyages que nous avons faits, payés de notre poche."),
  sec(`<section class="et-s pk-bleed"><div class="et-wrap"><ul class="et-team">${Object.values(AUTEURS).map((a, i) => `<li class="et-person"><div class="et-person-pic">${pic(i + 40, ["Europe", "Asie", "Afrique", "Amériques"][i], `Portrait illustré de ${a.n}`)}</div><div><h2>${esc(a.n)}</h2><p class="et-tag">${esc(a.r)}</p><p>${esc(a.b)}</p></div></li>`).join("")}</ul></div></section>`),
  sec(`<section class="et-s et-s--sand pk-bleed"><div class="et-wrap et-twocol"><div><h2>Notre charte</h2><p class="et-lead">Trois engagements simples, relus chaque année.</p></div><ol class="et-charter"><li><b>Payé par nous.</b> Aucun séjour offert, aucun lien commercial caché.</li><li><b>Chiffré.</b> Les budgets sont tirés de tickets réels, avec la date du voyage.</li><li><b>Corrigé.</b> Une erreur signalée est corrigée dans la semaine, avec une mention datée.</li></ol></div></section>`),
  sec(footer())];

const contact = (c) => [sec(header(c)), head("Contact", "Une <em>question</em> sur un voyage ?", "Écrivez à la rédaction : une carnettiste vous répond en moyenne sous quatre jours."),
  { type: "form", heading: "Écrire à la rédaction", intro: "Dites-nous où vous partez, pour combien de temps et ce qui vous inquiète. Merci de ne pas joindre de pièces d'identité." }, sec(footer())];

const rechData = ART.map((a, i) => `<li class="et-res" data-q="${esc(slug(`${a[1]} ${a[2]} ${a[5]} ${a[10].join(" ")} ${AUTEURS[a[6]].n} ${a[9]}`))}"><a href="/article"><span class="et-tag">${esc(a[5])}</span><b>${esc(a[1])}</b><small>${esc(a[2])} · ${fdate(a[7])}</small></a></li>`).join("");
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une <em>étape</em>", "Une ville, un pays, un thème : la liste se réduit pendant que vous tapez."),
  sec(`<section class="et-s pk-bleed"><div class="et-wrap et-srch" data-search><p class="et-note" data-hint>Saisissez au moins deux lettres pour filtrer les ${ART.length} articles du carnet.</p><ul class="et-results" data-results>${rechData}</ul><div class="et-none et-none--big" data-none hidden><div class="et-empty" aria-hidden="true">${stamp("Visa", "REFUSÉ", "0 résultat", "et-stamp--b")}</div><h2>Aucune étape trouvée</h2><p>Essayez un nom de pays, de ville, ou une rubrique comme « budget » ou « récits ». Vous pouvez aussi <a href="/journal">parcourir tout le journal</a>.</p></div></div></section>`),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans tout le site…" } }] }, sec(footer())];

const introuvable = (c) => [sec(header(c)), sec(`<section class="et-404 pk-bleed"><div class="et-wrap et-404-in"><div><p class="et-kick"><span>Erreur 404</span></p><div class="et-h1" role="heading" aria-level="1">Cette page est <em>hors carte</em>.</div><p class="et-lead">Le chemin que vous avez pris n'existe plus ou n'a jamais été tracé. Reprenons la route depuis un point connu.</p><div class="et-actions"><a class="et-btn" href="/">Retour à l'accueil ${ARROW}</a><a class="et-btn et-btn--line" href="/journal">Voir le journal</a><a class="et-btn et-btn--line" href="/recherche">Rechercher</a></div></div>
  <div class="et-404-fig" aria-hidden="true"><svg viewBox="0 0 260 220" focusable="false"><path class="et-dash" d="M20 190C60 150 40 100 100 90S200 110 190 50" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="20" cy="190" r="7" fill="currentColor"/><path d="M178 36l24 24M202 36l-24 24" stroke="#c0392b" stroke-width="5" stroke-linecap="round"/></svg>${stamp("Introuvable", "404", "Hors carte", "et-stamp--b")}</div></div></section>`), sec(footer())];

const blocs = (c) => [sec(header(c)), head("Exemples de mise en page", "Tous les <em>blocs</em> du carnet", "Titres, listes, citations, tableaux, code, boutons et encadrés tels que le thème les met en forme."),
  sec(`<section class="et-s pk-bleed"><div class="et-wrap"><div class="et-prose et-prose--solo">
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Un paragraphe courant avec un <a href="/journal">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, une <mark>mise en évidence</mark> et une abréviation comme <abbr title="Taxe sur la valeur ajoutée">TVA</abbr>. La ligne reste entre soixante et quatre-vingts caractères sur grand écran.</p>
    <ul><li>Une liste à puces</li><li>Avec plusieurs entrées</li><li>Et un sous-niveau :<ul><li>sous-entrée un</li><li>sous-entrée deux</li></ul></li></ul>
    <ol><li>Une liste numérotée</li><li>Pour les itinéraires</li><li>Et les procédures</li></ol>
    <blockquote class="et-quote"><p>Une citation mise en valeur dans la marge du carnet.</p><cite>Auteur de la citation</cite></blockquote>
    <figure class="et-fig">${pic(2, "Asie", "Illustration d'exemple")}<figcaption>Une légende d'image, en petits caractères.</figcaption></figure>
    <div class="et-tip"><b>Encadré</b><p>Un encadré « bon à savoir » pour les conseils pratiques.</p></div>
    <div class="et-tbl"><table><caption>Budget quotidien selon la destination</caption><thead><tr><th scope="col">Destination</th><th scope="col">Hébergement</th><th scope="col">Repas</th><th scope="col">Transports</th><th scope="col">Total</th></tr></thead><tbody><tr><td>Lisbonne</td><td>55 €</td><td>28 €</td><td>12 €</td><td>95 €</td></tr><tr><td>Marrakech</td><td>30 €</td><td>18 €</td><td>12 €</td><td>60 €</td></tr><tr><td>Kyoto</td><td>60 €</td><td>32 €</td><td>18 €</td><td>110 €</td></tr></tbody></table></div>
    <pre><code>Départ : Lisbonne
Arrivée : Marrakech
Distance : 1 430 km</code></pre>
    <p>Du code en ligne : <code>km = jours × 95</code>.</p>
    <div class="et-actions"><a class="et-btn" href="/itineraires">Bouton principal</a><a class="et-btn et-btn--line" href="/journal">Bouton secondaire</a></div>
    <div class="et-cols"><div><h3>Colonne gauche</h3><p>Un texte court en deux colonnes pour comparer deux options.</p></div><div><h3>Colonne droite</h3><p>La seconde colonne s'empile sous la première sur mobile.</p></div></div>
    <details><summary>Un volet repliable</summary><p>Le contenu s'affiche à l'ouverture.</p></details>
  </div></div></section>`), sec(footer())];

const legal = (title, kicker, blocks) => (c) => [sec(header(c)), head(kicker, title, ""), sec(`<section class="et-s pk-bleed"><div class="et-wrap"><div class="et-prose et-prose--solo">${blocks}</div></div></section>`), sec(footer())];
const mentions = legal("Mentions <em>légales</em>", "Informations légales", `<h2>Éditeur du site</h2><p>Étape est un site de démonstration. Éditeur fictif : Association Étape, 12 rue des Carnets, 69001 Lyon. Directrice de la publication : Camille Roux. Contact : <a href="/contact">formulaire de contact</a>.</p><h2>Hébergement</h2><p>Le site est hébergé par le prestataire choisi par l'exploitant du CMS. Remplacez ce paragraphe par les coordonnées de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les textes et illustrations de cette démonstration sont fictifs. Remplacez-les par vos propres contenus et précisez ici leurs conditions de réutilisation.</p><h2>Responsabilité</h2><p>Les budgets et distances sont indicatifs. Vérifiez toujours les conditions d'entrée, de santé et de sécurité auprès des autorités officielles avant de partir.</p>`);
const confid = legal("Politique de <em>confidentialité</em>", "Vos données", `<h2>Ce que nous collectons</h2><p>Uniquement les informations saisies dans le formulaire de contact (nom, adresse de courriel, message) et les statistiques de fréquentation anonymisées éventuellement activées par l'exploitant du site.</p><h2>Pourquoi</h2><p>Pour répondre à votre message. Aucune donnée n'est vendue ni cédée à des tiers à des fins publicitaires.</p><h2>Durée de conservation</h2><p>Les messages sont conservés douze mois au plus après le dernier échange.</p><h2>Vos droits</h2><p>Vous pouvez demander l'accès, la rectification ou l'effacement de vos données en écrivant via le <a href="/contact">formulaire de contact</a>.</p>`);

module.exports = {
  key: "etape", name: "Étape", version: "1.0.0", category: "voyage", tags: ["editorial", "chaleureux", "classique"], siteType: "Blog de voyage et carnet de route", featured: false, collection: "blog",
  concept: "Un carnet de route : papier crème, tampons de visa, étiquettes de bagage et tracé d'itinéraire en pointillé, avec un composeur d'étapes qui calcule jours, kilomètres et budget.",
  description: "Blog de voyage : carnet de route, destinations filtrables par continent et saison, itinéraires composables avec totaux, fiche pratique collante, 16 articles de démonstration et quatre auteurs.",
  brand: "Étape", modules: ["blog", "formulaires", "recherche"],
  dna: {
    header: "ruban-de-passeport-numerote-avec-trois-formes-passeport-affiche-sobre",
    hero: "carnet-ouvert-a-deux-pages-avec-polaroid-tampon-et-trace-pointille",
    grid: "pages-de-carnet-en-vignettes-inclinees-sur-fond-de-papier",
    typo: "serif-clarendon-de-voyage-et-sans-humaniste-a-notes-de-marge",
    shapes: "tampons-ronds-etiquettes-de-bagage-trouees-et-coins-de-photo",
    motion: "tampon-qui-s-imprime-et-trace-pointille-qui-defile",
    rhythm: "alternance-papier-sable-et-encre-comme-des-pages-de-carnet",
    signature: "composeur-d-itineraire-a-etapes-cochables-et-totaux-jours-km-budget",
    palette: "lagon-profond-et-mangue-sur-papier-de-carnet",
    image: "polaroids-illustres-en-svg-aux-couleurs-du-continent",
    list: "etapes-numerotees-posees-sur-un-fil-pointille",
    article: "journal-de-bord-avec-fiche-pratique-collante-et-notes-en-marge",
    sidebar: "fiche-pratique-collante-avec-tampon-visa-et-coordonnees",
    reading: "colonne-de-soixante-dix-caracteres-citations-en-marge-et-bon-a-savoir",
  },
  tokens: {
    colors: { primary: "#0d6e6e", secondary: "#1b2b2b", accent: "#b3590f", background: "#f5efe3", surface: "#fbf7ee", text: "#1b2b2b", muted: "#4d5f5c", success: "#2f6b3f", warning: "#8a5a0a", error: "#a3302a" },
    fonts: { heading: "font.besley", body: "font.fira-sans", button: "font.fira-sans", link: "font.fira-sans" },
    radius: { sm: 2, md: 4, lg: 6, button: 999, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#cfc5ae" },
    type: { h1: { size: 56, weight: 700, lineHeight: 1.08, transform: "none" }, h2: { size: 34, weight: 700, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Mangue des tampons et des étiquettes", type: "color", default: "#b3590f" },
    { key: "entete", label: "Forme de l'en-tête", type: "choice", default: "passeport", choices: [["passeport", "Passeport : logo à gauche, rubriques numérotées"], ["affiche", "Affiche : logo centré, rubriques dessous"], ["sobre", "Sobre : barre fine fixe"]] },
    { key: "liste", label: "Liste des articles", type: "choice", default: "vignettes", choices: [["vignettes", "Vignettes de polaroïds"], ["etapes", "Étapes sur fil pointillé"], ["magazine", "Une grande et deux colonnes"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "carte", choices: [["carte", "Carte : colonnes et mention"], ["simple", "Simple : une ligne de liens"]] },
    { key: "article", label: "Page d'article", type: "choice", default: "carnet", choices: [["carnet", "Carnet : fiche pratique à droite"], ["plein", "Pleine page : fiche au-dessus du texte"]] },
    { key: "nuit", label: "Mode sombre", type: "choice", default: "non", choices: [["non", "Papier clair"], ["oui", "Nuit de bivouac"]] },
    { key: "tampon", label: "Tampons de visa", type: "choice", default: "on", choices: [["on", "Affichés avec animation"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Journal", "/journal"], ["Destinations", "/destinations"], ["Itinéraires", "/itineraires"], ["À propos", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "journal", name: "Journal et archives", render: journal }, { key: "article", name: "Article", render: article },
    { key: "destinations", name: "Destinations", render: destinations }, { key: "itineraires", name: "Composeur d'itinéraire", render: itineraires }, { key: "a-propos", name: "À propos", render: aPropos },
    { key: "blocs", name: "Blocs de mise en page", render: blocs }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche },
    { key: "introuvable", name: "Page introuvable", render: introuvable }, { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confid },
  ],
};
