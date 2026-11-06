// Relais — agence généraliste (agence fictive « Relais », 14 personnes à Nantes). Direction artistique : couloirs de piste d'athlétisme numérotés, témoin orange qui passe de main en main, grands chiffres,
// études de cas chiffrées (avant / après en barres, compteurs), méthode en quatre relais avec témoin qui avance au défilement, offres par « piste ».
// Tout est démonstration : agence, clients, chiffres et citations sont fictifs. Les études sont écrites dans les pages du thème (aucun type de contenu « étude de cas » dans le CMS) ; le filtre et les compteurs sont dans motion.js.
const { sec, esc, nav } = require("../kit");
const common = require("./communes");

const IC = {
  arr: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  chk: '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  up: '<path d="M6 15l6-7 6 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
};
const ic = (k, c = "rl-i") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const BATON = '<svg class="rl-baton" viewBox="0 0 120 24" aria-hidden="true"><rect x="2" y="4" width="116" height="16" rx="8" fill="#ff6a2b"/><rect x="2" y="4" width="116" height="16" rx="8" fill="none" stroke="#10142e" stroke-width="2.4"/><path d="M30 4v16M90 4v16" stroke="#10142e" stroke-width="2.4" fill="none"/></svg>';

// ---------- données : services et études de cas (fictives) ----------
const SERV = {
  strategie: ["Stratégie", "Positionnement, offre, parcours client : poser les bonnes bases avant de produire quoi que ce soit."],
  design: ["Marque et design", "Identité, système graphique, interfaces : une cohérence du logo à la dernière ligne du formulaire."],
  web: ["Sites et produits web", "Conception, développement et mise en ligne de sites, boutiques et espaces clients durables."],
  contenu: ["Contenus et édition", "Ligne éditoriale, articles, vidéos et newsletters qui répondent aux vraies questions de vos publics."],
  performance: ["Acquisition et mesure", "Référencement, publicité, analyse : trouver ce qui marche, le refaire, couper le reste."],
};
// [id, client, secteur, services, titre, résumé, [valeur, préfixe, suffixe, légende], avant, après, unité de la comparaison, durée, année]
const CASES = [
  ["lenoir", "Maison Lenoir", "Ameublement", ["strategie", "web", "performance"], "Des demandes de devis multipliées par 2,4 en un an", "Un fabricant de meubles sur mesure dont le site ne servait que de catalogue. Nous l'avons transformé en machine à rendez-vous.", [142, "+", " %", "de demandes de devis"], 38, 92, "demandes par mois", "9 mois", 2026],
  ["maree", "Bleu Marée", "Conserverie", ["design", "web"], "Une conserverie bretonne qui vend enfin en direct", "Nouvelle marque, nouvelle boutique : la part de ventes directes passe de 6 % à 31 % du chiffre d'affaires.", [31, "", " %", "des ventes en direct"], 6, 31, "% du chiffre d'affaires", "7 mois", 2026],
  ["quartier", "Quartier Libre", "Coworking coopératif", ["strategie", "contenu"], "Remplir un espace de coworking sans rabais", "Positionnement par usages, série d'articles et newsletter mensuelle : le taux d'occupation passe de 54 % à 88 %.", [88, "", " %", "de taux d'occupation"], 54, 88, "% d'occupation", "6 mois", 2025],
  ["sillon", "Vélo Sillon", "Commerce de cycles", ["web", "performance"], "Un site de vélos qui charge en une seconde", "Refonte technique d'une boutique de 1 200 références : temps de chargement divisé par quatre, panier moyen en hausse.", [76, "−", " %", "de temps de chargement"], 4.2, 1, "secondes de chargement", "5 mois", 2025],
  ["saintaubin", "Clinique Saint-Aubin", "Santé", ["design", "contenu"], "Une clinique qui explique avant de rassurer", "Refonte de 140 pages d'information patient : moins d'appels pour une même question, davantage de rendez-vous en ligne.", [58, "−", " %", "d'appels d'information"], 320, 134, "appels par semaine", "10 mois", 2025],
  ["horizon", "Fondation Horizon", "Fondation", ["strategie", "design", "contenu"], "Une campagne de dons qui raconte plutôt qu'elle ne réclame", "Identité de campagne, site dédié, série de portraits : le don moyen augmente et les dons récurrents doublent.", [2, "×", "", "plus de dons récurrents"], 410, 830, "donateurs réguliers", "8 mois", 2025],
  ["ardoise", "Ardoise & Co", "Cabinet d'architectes", ["design", "web"], "Un portfolio d'architectes qui laisse parler les plans", "Site-galerie rapide, fiches projets en trois niveaux de lecture : doublement des demandes de collaboration.", [104, "+", " %", "de demandes de collaboration"], 11, 22, "demandes par trimestre", "4 mois", 2024],
  ["laiterie", "La Petite Laiterie", "Agroalimentaire", ["contenu", "performance"], "Des fromages locaux visibles sur les bonnes recherches", "Un an de contenus pédagogiques et de fiches produits : trafic organique quadruplé, abonnements au panier mensuel en hausse.", [4, "×", "", "de trafic organique"], 2100, 8400, "visites mensuelles", "12 mois", 2024],
  ["transit", "Transit Mobilités", "Transport régional", ["strategie", "web"], "Un site d'horaires pensé pour le pouce, dans le bus", "Refonte d'un site d'horaires utilisé à 78 % sur mobile : trajet trouvé en trois touchers au lieu de neuf.", [67, "−", " %", "d'étapes pour trouver un horaire"], 9, 3, "touchers pour un trajet", "6 mois", 2024],
];
const PM = { "": "none", "+": "plus", "−": "moins", "×": "fois" }, SM = { "": "none", " %": "pct" };
const caseLink = (id) => (id === "lenoir" ? "/etude" : "/etudes");
const bars = (a, b, unit) => {
  const m = Math.max(a, b);
  return `<div class="rl-ba"><div class="rl-ba-r"><span>Avant</span><svg class="rl-bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="Avant : ${a} ${esc(unit)}"><rect class="rl-bar-b" width="100" height="10"/><rect class="rl-bar-f rl-bar-f--a" width="${Math.max(3, Math.round((a / m) * 100))}" height="10"/></svg><b>${String(a).replace(".", ",")}</b></div><div class="rl-ba-r"><span>Après</span><svg class="rl-bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="Après : ${b} ${esc(unit)}"><rect class="rl-bar-b" width="100" height="10"/><rect class="rl-bar-f" width="${Math.max(3, Math.round((b / m) * 100))}" height="10"/></svg><b>${String(b).replace(".", ",")}</b></div><p class="rl-ba-u">${esc(unit)}</p></div>`;
};
const caseCard = (c, i) => {
  const [id, client, sect, sv, titre, res, [v, pre, suf, leg], a, b, unit, dur, an] = c;
  return `<article class="rl-case" data-sv="${sv.join(" ")}" data-hay="${esc((client + " " + sect + " " + titre + " " + res).toLowerCase())}"><div class="rl-case-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</div><div class="rl-case-b"><p class="rl-case-k"><b>${esc(client)}</b><span>${esc(sect)}</span><span>${an}</span></p><h3 class="rl-case-t"><a href="${caseLink(id)}">${esc(titre)}</a></h3><p class="rl-case-x">${esc(res)}</p><p class="rl-tagrow">${sv.map((s) => `<span>${SERV[s][0]}</span>`).join("")}</p></div><div class="rl-case-m"><p class="rl-big"><span data-rl-count="${v}" data-pre="${PM[pre]}" data-suf="${SM[suf]}">${pre}${v}${suf}</span></p><p class="rl-big-l">${esc(leg)}</p><a class="rl-more" href="${caseLink(id)}">Lire l'étude ${ic("arr")}</a></div></article>`;
};

// ---------- structure commune ----------
const logo = () => `<a class="rl-logo" href="/">${BATON}<span>Relais</span></a>`;
const header = (c) => `<header class="rl-head pk-bleed"><div class="rl-wrap rl-head-in">${logo()}<div class="rl-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "rl-nl")}</div><a class="rl-cta" href="/contact">Parler de votre projet ${ic("arr")}</a><details class="rl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="rl-bmenu">${nav(c.menu, "rl-bl")}<a class="rl-bl rl-bl--cta" href="/contact">Parler de votre projet</a></div></details></div></header>`;
const footer = (c) => `<footer class="rl-foot pk-bleed"><div class="rl-wrap"><div class="rl-foot-top"><div class="rl-foot-big" aria-hidden="true">Relais</div><p class="rl-foot-p">Une agence généraliste qui passe le témoin sans le lâcher. Nantes, depuis 2014. Site de démonstration : agence, clients et chiffres fictifs.</p></div><div class="rl-foot-cols"><div class="rl-fcol"><p class="rl-fh">Agence</p>${nav([{ label: "Services", url: "/services" }, { label: "Méthode", url: "/methode" }, { label: "L'agence", url: "/agence" }], "rl-fl")}</div><div class="rl-fcol"><p class="rl-fh">Travaux</p>${nav([{ label: "Études de cas", url: "/etudes" }, { label: "Étude : Maison Lenoir", url: "/etude" }, { label: "Recherche", url: "/recherche" }], "rl-fl")}</div><div class="rl-fcol"><p class="rl-fh">Écrire</p>${nav([{ label: "Contact", url: "/contact" }, { label: "Blocs de contenu", url: "/blocs" }], "rl-fl")}<a class="rl-fl" href="mailto:contact@relais-agence.example">contact@relais-agence.example</a></div><div class="rl-fcol"><p class="rl-fh">Légal</p>${nav([{ label: "Mentions légales", url: "/mentions-legales" }, { label: "Confidentialité", url: "/confidentialite" }], "rl-fl")}</div></div><p class="rl-copy">© Relais — site de démonstration. Études de cas, chiffres et citations fictifs.</p></div></footer>`;
const lanes = () => `<div class="rl-lanes" aria-hidden="true">${"<span></span>".repeat(8)}</div>`;
const pagehead = (eyebrow, title, lead, n) => sec(`<section class="rl-ph pk-bleed">${lanes()}<div class="rl-wrap rl-ph-in"><p class="rl-eyebrow"><b>${n}</b> ${eyebrow}</p><div class="rl-h1" role="heading" aria-level="1">${title}</div><p class="rl-lead">${lead}</p></div></section>`);
const wrap = (h, cls = "") => sec(`<section class="rl-sec pk-bleed${cls ? " " + cls : ""}"><div class="rl-wrap">${h}</div></section>`);
const shead = (t, extra = "") => `<div class="rl-shead"><h2 class="rl-h2">${t}</h2>${extra}</div>`;

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="rl-hero pk-bleed">${lanes()}<div class="rl-runner" aria-hidden="true">${BATON}</div><div class="rl-wrap rl-hero-in"><p class="rl-eyebrow"><b>01</b> Agence généraliste · Nantes · quatorze personnes</p><div class="rl-h1" role="heading" aria-level="1">Une idée, <em>passée de main en main</em> jusqu'au résultat.</div><p class="rl-lead">Stratégie, marque, web, contenus, performance : une seule équipe, quatre relais, et des chiffres que nous publions, même quand ils sont modestes.</p><div class="rl-actions"><a class="rl-btn" href="/etudes">Voir les études de cas ${ic("arr")}</a><a class="rl-btn rl-btn--line" href="/methode">Comprendre notre méthode</a></div></div>
<div class="rl-wrap rl-kpis"><div class="rl-kpi"><p class="rl-big"><span data-rl-count="62" data-pre="none" data-suf="none">62</span></p><p>projets menés à terme depuis 2014</p></div><div class="rl-kpi"><p class="rl-big"><span data-rl-count="91" data-pre="none" data-suf="pct">91 %</span></p><p>de clients qui reviennent pour un second projet</p></div><div class="rl-kpi"><p class="rl-big"><span data-rl-count="4" data-pre="none" data-suf="sem">4 sem.</span></p><p>pour livrer un premier prototype testable</p></div></div></section>`),
  wrap(`${shead("Cinq pistes, une seule équipe", '<a class="rl-more" href="/services">Tous les services ' + ic("arr") + "</a>")}<div class="rl-pistes">${Object.entries(SERV).map(([k, [n, d]], i) => `<a class="rl-piste" href="/services"><span class="rl-piste-n">${i + 1}</span><span class="rl-piste-t">${n}</span><span class="rl-piste-d">${d}</span>${ic("arr")}</a>`).join("")}</div>`),
  wrap(`${shead("Résultats récents", '<a class="rl-more" href="/etudes">Toutes les études ' + ic("arr") + "</a>")}<div class="rl-cases">${CASES.slice(0, 3).map((c, i) => caseCard(c, i)).join("")}</div>`, "rl-sec--tint"),
  sec(`<section class="rl-relay pk-bleed"><div class="rl-wrap"><p class="rl-eyebrow rl-eyebrow--l"><b>02</b> Méthode</p><h2 class="rl-h2 rl-h2--l">Quatre relais, jamais de témoin perdu</h2><div class="rl-rrow">${["Cadrer", "Concevoir", "Produire", "Mesurer"].map((t, i) => `<div class="rl-rs"><span>${i + 1}</span><b>${t}</b></div>`).join("<i aria-hidden=\"true\"></i>")}</div><a class="rl-btn rl-btn--w" href="/methode">Découvrir la méthode ${ic("arr")}</a></div></section>`),
  wrap(`<div class="rl-quote"><p class="rl-q">« Relais nous a dit non à deux idées qui nous plaisaient, et oui à une qui nous faisait peur. C'est celle qui a marché. »</p><p class="rl-q-by"><b>Camille Lenoir</b>, directrice, Maison Lenoir <span>(propos fictifs)</span></p></div>`),
  sec(`<section class="rl-cta2 pk-bleed"><div class="rl-wrap rl-cta2-in"><div><h2 class="rl-h2">Un projet ? Un doute ? Une mauvaise idée à vérifier ?</h2><p>Premier échange gratuit, trente minutes, avec quelqu'un qui fera le projet.</p></div><a class="rl-btn" href="/contact">Prendre contact ${ic("arr")}</a></div></section>`),
  sec(footer(c)),
];

// ---------- services ----------
const services = (c) => [
  sec(header(c)),
  pagehead("Services", "Cinq pistes, <em>une seule équipe</em>", "Vous pouvez nous confier une seule piste ou le parcours entier : dans tous les cas, la personne qui vous conseille est celle qui produit.", "01"),
  wrap(Object.entries(SERV).map(([k, [n, d]], i) => {
    const li = { strategie: ["Audit et diagnostic", "Positionnement et offre", "Parcours client", "Feuille de route chiffrée"], design: ["Identité visuelle", "Système de design", "Maquettes et prototypes", "Guide d'usage"], web: ["Conception et développement", "Boutique et espace client", "Accessibilité et performance", "Maintenance"], contenu: ["Ligne éditoriale", "Articles et études", "Vidéo et son", "Newsletter"], performance: ["Référencement naturel", "Publicité et campagnes", "Mesure et tableaux de bord", "Tests et optimisation"] }[k];
    const prix = { strategie: "à partir de 6 000 €", design: "à partir de 9 000 €", web: "à partir de 14 000 €", contenu: "à partir de 2 500 € / mois", performance: "à partir de 1 800 € / mois" }[k];
    return `<div class="rl-svc"><div class="rl-svc-n" aria-hidden="true">${i + 1}</div><div class="rl-svc-b"><h2 class="rl-h3">${n}</h2><p>${d}</p></div><ul class="rl-svc-l">${li.map((x) => `<li>${ic("chk")}${x}</li>`).join("")}</ul><div class="rl-svc-p"><b>${prix}</b><span>tarifs indicatifs, fictifs</span><a class="rl-more" href="/etudes">Voir des résultats ${ic("arr")}</a></div></div>`;
  }).join("")),
  wrap(`<h2 class="rl-h2">Questions fréquentes</h2><div class="rl-faq"><details><summary>Peut-on ne commander qu'une seule piste ?</summary><p>Oui. Environ la moitié de nos projets ne concernent qu'un service ; nous vous disons franchement quand une autre piste serait plus utile.</p></details><details><summary>Qui travaille sur mon projet ?</summary><p>Une équipe de trois à cinq personnes, dont une seule interlocutrice ou un seul interlocuteur dédié du premier jour à la fin du suivi.</p></details><details><summary>Comment sont calculés les budgets ?</summary><p>Au forfait par relais, jamais au temps passé. Le devis détaille ce qui est livré à chaque étape et ce que vous devez valider.</p></details><details><summary>Publiez-vous vraiment les résultats ?</summary><p>Avec l'accord du client, oui, chiffres avant et après à l'appui, même lorsqu'ils sont modestes. Les études de cas de cette démonstration sont fictives.</p></details></div>`, "rl-sec--tint"),
  sec(footer(c)),
];

// ---------- études (liste filtrable) ----------
const etudes = (c) => [
  sec(header(c)),
  pagehead("Études de cas", "Les chiffres, <em>avant et après</em>", "Neuf projets fictifs, chacun avec son point de départ, son résultat et la durée qu'il a fallu. Filtrez par service.", "02"),
  sec(`<section class="rl-sec pk-bleed"><div class="rl-wrap"><div class="rl-filters" role="group" aria-label="Filtrer par service"><a class="rl-chip is-on" href="#tout" role="button" data-rl-f="tout">Tous</a>${Object.entries(SERV).map(([k, [n]]) => `<a class="rl-chip" href="#${k}" role="button" data-rl-f="${k}">${n}</a>`).join("")}<span class="rl-fsearch" data-rl-search></span></div><p class="rl-count" data-rl-count-out aria-live="polite">9 études</p><div class="rl-cases" data-rl-list>${CASES.map((c2, i) => caseCard(c2, i)).join("")}</div>
<div class="rl-empty rl-hid" data-rl-empty><p class="rl-empty-t">Aucune étude pour ce filtre.</p><p>Retirez un filtre ou <a href="#tout" data-rl-reset>affichez toutes les études</a>.</p></div></div></section>`),
  sec(footer(c)),
];

// ---------- étude de cas (page intérieure) ----------
const etude = (c) => {
  const k = CASES[0], [, client, sect, sv, titre, res, , a, b, unit, dur] = k;
  return [
    sec(header(c)),
    sec(`<section class="rl-case-h pk-bleed">${lanes()}<div class="rl-wrap rl-ph-in"><div class="rl-crumbs" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/etudes">Études</a><span aria-hidden="true">/</span><span>${esc(client)}</span></div><p class="rl-eyebrow"><b>${esc(sect)}</b> · ${dur} · 2026</p><div class="rl-h1" role="heading" aria-level="1">${esc(titre)}</div><p class="rl-lead">${esc(res)}</p><p class="rl-tagrow">${sv.map((s) => `<span>${SERV[s][0]}</span>`).join("")}</p></div></section>`),
    sec(`<section class="rl-sec pk-bleed"><div class="rl-wrap rl-art"><aside class="rl-facts" aria-label="Fiche du projet"><dl><dt>Client</dt><dd>${esc(client)}, fabricant de meubles, 38 personnes</dd><dt>Durée</dt><dd>${dur}</dd><dt>Équipe Relais</dt><dd>4 personnes</dd><dt>Services</dt><dd>${sv.map((s) => SERV[s][0]).join(", ")}</dd><dt>Année</dt><dd>2026</dd></dl></aside>
<div class="rl-body"><div class="rl-kpis rl-kpis--in"><div class="rl-kpi"><p class="rl-big"><span data-rl-count="142" data-pre="plus" data-suf="pct">+142 %</span></p><p>de demandes de devis</p></div><div class="rl-kpi"><p class="rl-big"><span data-rl-count="2.4" data-pre="fois" data-suf="none">×2,4</span></p><p>de rendez-vous qualifiés</p></div><div class="rl-kpi"><p class="rl-big"><span data-rl-count="41" data-pre="moins" data-suf="pct">−41 %</span></p><p>de coût par demande</p></div></div>
<h2 class="rl-h3">Le point de départ</h2><p>Maison Lenoir fabrique des cuisines et des bibliothèques sur mesure depuis 1987. Son site, refait en 2016, servait de catalogue : on y admirait des photos, mais le formulaire de contact, caché en bas de page, ne recevait que 38 demandes par mois, dont la moitié sans suite possible.</p>
<h2 class="rl-h3">Ce que nous avons fait</h2><ol class="rl-ol"><li><b>Cadrer.</b> Entretiens avec huit clients et les deux menuisiers-conseillers : le vrai frein n'était pas le prix, mais la peur de se tromper de mesures.</li><li><b>Concevoir.</b> Un parcours « votre pièce en cinq questions » qui aboutit à un rendez-vous de métrage, plus une fiche projet claire par réalisation.</li><li><b>Produire.</b> Refonte du site en neuf semaines, avec des photos refaites en atelier et un temps de chargement divisé par trois.</li><li><b>Mesurer.</b> Suivi hebdomadaire pendant trois mois, trois ajustements de parcours, un test de la page d'accueil.</li></ol>
<h2 class="rl-h3">Les résultats</h2>${bars(a, b, unit)}
<div class="rl-scroll" role="region" aria-label="Tableau des résultats"><table class="rl-tab"><caption>Indicateurs avant et après la refonte (données fictives)</caption><thead><tr><th scope="col">Indicateur</th><th scope="col">Avant</th><th scope="col">Après</th><th scope="col">Évolution</th></tr></thead><tbody><tr><td>Demandes de devis par mois</td><td>38</td><td>92</td><td>+142 %</td></tr><tr><td>Rendez-vous de métrage</td><td>11</td><td>26</td><td>×2,4</td></tr><tr><td>Coût par demande</td><td>74 €</td><td>44 €</td><td>−41 %</td></tr><tr><td>Chargement de l'accueil</td><td>4,8 s</td><td>1,3 s</td><td>−73 %</td></tr></tbody></table></div>
<div class="rl-quote"><p class="rl-q">« Les chiffres nous ont étonnés, mais ce sont les menuisiers qui ont été les plus contents : ils reçoivent des demandes déjà préparées. »</p><p class="rl-q-by"><b>Camille Lenoir</b>, directrice <span>(propos fictifs)</span></p></div>
<h2 class="rl-h3">Ce que nous referions autrement</h2><p>Nous avons sous-estimé le temps de rédaction des fiches projets : elles ont été livrées trois semaines après le site. Nous prévoyons désormais ce travail dès le premier relais.</p></div></div></section>`),
    wrap(`${shead("Autres études", '<a class="rl-more" href="/etudes">Toutes les études ' + ic("arr") + "</a>")}<div class="rl-cases">${CASES.slice(1, 3).map((c2, i) => caseCard(c2, i + 1)).join("")}</div>`, "rl-sec--tint"),
    sec(footer(c)),
  ];
};

// ---------- méthode ----------
const RELAIS = [
  ["Cadrer", "2 semaines", "Ateliers, entretiens, audit de l'existant", "Une note de cadrage de 6 pages et un budget ferme", "Les objectifs, le périmètre et les chiffres de départ"],
  ["Concevoir", "4 semaines", "Parcours, maquettes, tests auprès de vrais utilisateurs", "Un prototype cliquable et testé", "Le parcours et le ton, sur pièces"],
  ["Produire", "6 semaines", "Développement, contenus, intégration, recette", "Le produit livré, documenté et accessible", "La recette finale, point par point"],
  ["Mesurer", "90 jours", "Suivi des indicateurs, ajustements, formation", "Un tableau de bord et trois recommandations", "Ce qu'on garde, ce qu'on arrête"],
];
const methode = (c) => [
  sec(header(c)),
  pagehead("Méthode", "Quatre relais, <em>jamais de témoin perdu</em>", "Chaque étape a un responsable, une remise précise et une validation de votre côté. Rien ne passe au relais suivant sans votre accord.", "03"),
  sec(`<section class="rl-sec pk-bleed"><div class="rl-wrap"><div class="rl-track" data-rl-track><div class="rl-track-line" aria-hidden="true"><span class="rl-track-fill"></span><span class="rl-track-baton">${BATON}</span></div><ol class="rl-legs">${RELAIS.map(([t, d, q, r, v], i) => `<li class="rl-leg"><span class="rl-leg-n">${i + 1}</span><h2 class="rl-h3">${t}</h2><p class="rl-leg-d">${d}</p><dl><dt>Ce qu'on fait</dt><dd>${q}</dd><dt>Ce qui est remis</dt><dd>${r}</dd><dt>Ce que vous validez</dt><dd>${v}</dd></dl></li>`).join("")}</ol></div></div></section>`),
  wrap(`<h2 class="rl-h2">Trois règles du relais</h2><div class="rl-rules"><div><b>1</b><h3 class="rl-h4">Une seule voix</h3><p>Un interlocuteur dédié, du premier au dernier jour, qui fait aussi partie de l'équipe de production.</p></div><div><b>2</b><h3 class="rl-h4">Des remises datées</h3><p>Chaque remise a une date, un format et un critère de validation écrits dès le devis.</p></div><div><b>3</b><h3 class="rl-h4">Des chiffres partagés</h3><p>Les indicateurs de départ sont mesurés ensemble, puis publiés dans un tableau de bord que vous gardez.</p></div></div>`, "rl-sec--tint"),
  sec(footer(c)),
];

// ---------- agence ----------
const TEAM = [["Inès Carrel", "Direction, stratégie"], ["Malo Pelletier", "Direction de création"], ["Sofia Duret", "Développement web"], ["Yanis Maurel", "Contenus et édition"], ["Élodie Brun", "Acquisition et mesure"], ["Théo Garnier", "Design d'interface"]];
const agence = (c) => [
  sec(header(c)),
  pagehead("L'agence", "Quatorze personnes, <em>un même élan</em>", "Fondée à Nantes en 2014 par deux anciens d'agences parisiennes, Relais reste volontairement de taille humaine.", "04"),
  wrap(`<div class="rl-two"><div class="rl-prose"><h2>Pourquoi « Relais »</h2><p>Dans un relais, on ne gagne pas seul : on gagne en passant bien le témoin. C'est la façon dont nous travaillons : chaque spécialiste connaît le métier de celui qui court après lui, et personne ne découvre le projet à la dernière minute.</p><h2>Ce à quoi nous tenons</h2><ul><li>Des délais tenus et des budgets fermes ;</li><li>Une accessibilité numérique vérifiée à chaque livraison ;</li><li>Des sites sobres, rapides et durables ;</li><li>Des études de cas publiques, avec les mauvais chiffres aussi.</li></ul></div><div class="rl-numbers"><div><b>14</b><span>personnes</span></div><div><b>2014</b><span>année de création</span></div><div><b>62</b><span>projets menés à terme</span></div><div><b>91 %</b><span>de clients fidèles</span></div></div></div>`),
  wrap(`<h2 class="rl-h2">L'équipe</h2><div class="rl-team">${TEAM.map(([n, r]) => `<div class="rl-person"><span class="rl-av" aria-hidden="true">${n.split(" ").map((x) => x[0]).join("")}</span><h3 class="rl-h4">${n}</h3><p>${r}</p></div>`).join("")}</div><p class="rl-fine">Équipe fictive, présentée pour la démonstration du thème.</p>`, "rl-sec--tint"),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Parlons <em>de votre projet</em>", "Décrivez-nous votre situation en quelques lignes : nous répondons sous deux jours ouvrés avec une proposition de rendez-vous.", "05"),
  { type: "form", heading: "Votre projet en quelques lignes", intro: "Contexte, objectif, échéance si vous en avez une. Le formulaire fonctionne comme sur un vrai site, mais cette démonstration ne l'envoie à personne." },
  wrap(`<div class="rl-two rl-two--c"><div class="rl-prose"><h2>Ce qui se passe ensuite</h2><ol><li>Nous lisons votre message et préparons trois questions.</li><li>Un appel de trente minutes, gratuit, avec la personne qui ferait le projet.</li><li>Une proposition chiffrée sous une semaine, avec les remises de chaque relais.</li></ol></div><div class="rl-card"><p class="rl-fh">Atelier de Relais</p><p>12 quai de la Fosse<br>44000 Nantes</p><p><a href="mailto:contact@relais-agence.example">contact@relais-agence.example</a></p><p class="rl-fine">Adresse fictive.</p></div></div>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher <em>dans le site</em>", "Un client, un secteur, un service : tapez un mot.", "06"),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une étude, un service…" } }] },
  wrap(`<div class="rl-empty"><p class="rl-empty-t">Aucun résultat ? Voici où aller.</p><p>Essayez un mot plus court ou parcourez les <a href="/etudes">études de cas</a>, les <a href="/services">services</a> ou écrivez-nous via la <a href="/contact">page de contact</a>.</p></div>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="rl-404 pk-bleed">${lanes()}<div class="rl-wrap rl-404-in"><p class="rl-big rl-404-n" aria-hidden="true">404</p><div><p class="rl-eyebrow"><b>Hors piste</b> Erreur 404</p><div class="rl-h1" role="heading" aria-level="1">Le témoin est tombé <em>avant la ligne</em>.</div><p class="rl-lead">Cette page n'existe pas ou plus. Revenez sur la piste : la plupart des gens cherchaient nos études de cas.</p><div class="rl-actions"><a class="rl-btn" href="/etudes">Voir les études ${ic("arr")}</a><a class="rl-btn rl-btn--line" href="/">Accueil</a></div></div></div></section>`),
  sec(footer(c)),
];
const wrapLegal = (c, parts) => [sec(header(c)), ...parts, sec(footer(c))];

module.exports = {
  key: "relais", name: "Relais", version: "1.0.0", category: "agence", tags: ["moderne", "audacieux", "geometrique"], siteType: "Agence généraliste", collection: "pro", featured: false,
  concept: "Une agence généraliste racontée comme un relais : couloirs de piste numérotés, témoin orange, grands chiffres, études de cas avant/après filtrables, méthode en quatre relais avec témoin qui avance au défilement.",
  description: "Site d'agence généraliste : couloirs de piste, grands chiffres animés, études de cas chiffrées filtrables par service (barres avant/après), méthode en quatre relais, offres par piste, mode sombre en option.",
  brand: "Relais", modules: ["formulaires", "recherche"],
  contentModel: "Les études de cas, services et équipe sont écrits dans les pages du thème (aucun type de contenu « étude de cas » dans le CMS) ; filtres, compteurs et témoin de méthode sont exécutés dans motion.js.",
  dna: {
    hero: "enonce-geant-sur-couloirs-de-piste-avec-temoin-qui-traverse-et-trois-compteurs",
    header: "barre-claire-logo-temoin-menu-centre-et-bouton-orange-de-contact",
    grid: "bandes-pleine-largeur-a-colonne-de-numero-et-lignes-de-couloir",
    typo: "grotesque-geometrique-serree-avec-chiffres-en-monospace",
    shapes: "couloirs-paralleles-temoin-arrondi-pastilles-numerotees-et-coins-vifs",
    motion: "temoin-qui-court-compteurs-qui-montent-et-barres-avant-apres-qui-se-remplissent",
    rhythm: "alternance-gris-clair-blanc-et-bandes-indigo-separees-par-lignes-de-piste",
    signature: "etudes-de-cas-chiffrees-filtrables-avec-barres-avant-apres-et-methode-en-quatre-relais",
    palette: "gris-chaud-indigo-nuit-et-orange-temoin",
    image: "pictogrammes-vectoriels-temoin-et-lignes-de-piste-sans-photographie",
    list: "etudes-en-pistes-numerotees-avec-grand-chiffre-a-droite",
    article: "fiche-projet-collante-a-gauche-et-recit-en-quatre-relais",
    sidebar: "fiche-technique-du-projet-collante-a-gauche",
    reading: "grotesque-dix-sept-pixels-colonne-de-soixante-dix-signes-et-chiffres-cles-en-tete",
  },
  tokens: {
    colors: { primary: "#17237a", secondary: "#10142e", accent: "#ff6a2b", background: "#f3f3ef", surface: "#ffffff", text: "#10142e", muted: "#505470", success: "#1b7a45", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.familjen-grotesk", body: "font.instrument-sans", button: "font.martian-mono", link: "font.instrument-sans" },
    radius: { sm: 2, md: 4, lg: 8, button: 3, field: 3, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#10142e" },
    type: { h1: { size: 64, weight: 700, lineHeight: 1.0, transform: "none" }, h2: { size: 40, weight: 700, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Orange du témoin", type: "color", default: "#ff6a2b" },
    { key: "entete", label: "En-tête", type: "choice", default: "barre", choices: [["barre", "Barre claire : menu centré et bouton"], ["piste", "Piste : bandeau sombre, menu numéroté"], ["minimal", "Minimal : menu replié en grand volet"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "grand", choices: [["grand", "Grand : nom géant et colonnes"], ["ligne", "Ligne : une seule rangée"]] },
    { key: "liste", label: "Liste des études", type: "choice", default: "pistes", choices: [["pistes", "Pistes : lignes numérotées"], ["cartes", "Cartes en grille"], ["mosaique", "Mosaïque : une grande, deux petites"]] },
    { key: "cas", label: "Page d'étude de cas", type: "choice", default: "rapport", choices: [["rapport", "Rapport : fiche technique collée à gauche"], ["recit", "Récit : colonne centrée, fiche en tête"]] },
    { key: "mode", label: "Apparence", type: "choice", default: "clair", choices: [["clair", "Clair"], ["sombre", "Sombre"]] },
  ],
  menu: [["Accueil", "/"], ["Services", "/services"], ["Études de cas", "/etudes"], ["Méthode", "/methode"], ["L'agence", "/agence"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "services", name: "Services", render: services }, { key: "etudes", name: "Études de cas (liste filtrable)", render: etudes },
    { key: "etude", name: "Étude de cas", render: etude }, { key: "methode", name: "Méthode", render: methode }, { key: "agence", name: "L'agence", render: agence },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: (c) => wrapLegal(c, common.mentions()) }, { key: "confidentialite", name: "Confidentialité", render: (c) => wrapLegal(c, common.confidentialite()) }, { key: "blocs", name: "Blocs de contenu", render: (c) => wrapLegal(c, common.blocs()) },
  ],
};
