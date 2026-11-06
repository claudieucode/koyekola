// Communiqué — salle de presse d'entreprise (société fictive « Aubrac Industries », vélos cargos électriques, Toulouse). Direction artistique : journal économique — papier saumon, filets fins, manchette centrée,
// dateline « TOULOUSE, 5 novembre 2026 — », numéros de communiqués, mention d'embargo avec compte à rebours réel, fin de dépêche « ### », texte copiable en un geste, kit média (logos sur fonds, couleurs et textes de présentation à copier)
// et annuaire des contacts presse. Tout est démonstration : société, produits, chiffres, personnes et coordonnées sont fictifs. Aucun fichier à télécharger n'est promis : les visuels sont « sur demande » via le formulaire.
// Les communiqués sont écrits dans les pages du thème (aucun type de contenu « presse » dans le CMS) ; filtres, copie et compte à rebours sont dans motion.js.
const { sec, esc, nav } = require("../kit");
const common = require("./communes");

const IC = {
  arr: '<path d="M5 12h14m-6-6 6 6-6 6"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  mail: '<path d="M3 6h18v12H3zM3 7l9 7 9-7"/>', tel: '<path d="M6 3h4l2 5-2.500 1.500a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const ic = (k, c = "cq-i") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const MARK = '<svg class="cq-mark" viewBox="0 0 48 40" aria-hidden="true"><path d="M2 38 20 4l9 16 5-8 12 26z" fill="currentColor"/><path d="M20 4l9 16-9 18-9-18z" fill="none" stroke="#fff1e5" stroke-width="2.5" stroke-linejoin="round" opacity=".55"/></svg>';

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
const THEMES = { produits: "Produits", resultats: "Résultats", partenariats: "Partenariats", industrie: "Industrie", distinctions: "Distinctions", engagement: "Engagement", gouvernance: "Gouvernance", evenements: "Événements" };
// [réf, date, thème, titre, chapeau]
const CP = [
  ["CP-2026-31", "2026-11-05", "produits", "Aubrac Industries dévoile Transhumance, son vélo cargo électrique à batterie amovible", "Le nouveau modèle, conçu et assemblé à Millau, embarque 180 kg et affiche 120 km d'autonomie réelle pour un prix de départ de 3 990 €."],
  ["CP-2026-29", "2026-10-22", "resultats", "Résultats du troisième trimestre 2026 : un chiffre d'affaires en hausse de 18 %", "Porté par la gamme professionnelle, le groupe confirme sa trajectoire et relève son objectif annuel."],
  ["CP-2026-27", "2026-10-09", "partenariats", "Partenariat avec un opérateur postal régional pour la livraison du dernier kilomètre", "Deux cents vélos cargos seront déployés dans onze villes d'Occitanie d'ici l'été 2027."],
  ["CP-2026-24", "2026-09-18", "industrie", "Ouverture d'une troisième usine à Millau : 120 emplois créés d'ici 2028", "Un investissement de 14 millions d'euros pour tripler la capacité d'assemblage."],
  ["CP-2026-22", "2026-09-02", "distinctions", "Aubrac Industries reçoit le prix de l'innovation mobilité 2026", "Le jury distingue le système de batterie amovible et réparable développé avec deux laboratoires universitaires."],
  ["CP-2026-17", "2026-06-24", "engagement", "Rapport d'impact 2025 : 62 % de matériaux recyclés dans les cadres", "Le groupe publie son troisième rapport d'impact, vérifié par un tiers indépendant."],
  ["CP-2026-15", "2026-06-10", "gouvernance", "Nomination de Claire Vandenbroucke au poste de directrice générale déléguée", "Elle rejoint le comité exécutif et pilotera les opérations industrielles et la chaîne d'approvisionnement."],
  ["CP-2026-11", "2026-04-28", "engagement", "Lancement d'un programme de reprise des batteries usagées", "Les batteries de tous les modèles vendus depuis 2019 pourront être rapportées chez les revendeurs."],
  ["CP-2026-06", "2026-03-12", "resultats", "Résultats annuels 2025 : première année rentable pour la gamme professionnelle", "Le chiffre d'affaires atteint 48 millions d'euros, en hausse de 17 %."],
  ["CP-2026-03", "2026-02-19", "evenements", "Salon Eurobike : Aubrac Industries présente trois nouveautés", "Un prototype de remorque, un nouveau moteur et une application de suivi de flotte."],
  ["CP-2025-34", "2025-11-20", "partenariats", "Accord de distribution avec un réseau de 40 revendeurs en Belgique et aux Pays-Bas", "Premières livraisons prévues au printemps 2026."],
  ["CP-2025-26", "2025-09-30", "distinctions", "Aubrac Industries obtient la certification B Corp", "Un score de 96 points, avec une mention pour la gouvernance et les relations avec les salariés."],
  ["CP-2025-14", "2025-05-14", "engagement", "Création d'un fonds de dotation pour la mobilité rurale", "Le fonds financera chaque année dix projets de mobilité partagée dans les communes de moins de 5 000 habitants."],
  ["CP-2025-05", "2025-03-06", "resultats", "Résultats annuels 2024 : un chiffre d'affaires de 41 millions d'euros", "Le groupe poursuit sa croissance et prépare l'ouverture d'un troisième site de production."],
];
const item = (c, i) => {
  const [ref, d, t, ti, ch] = c;
  const link = i === 0 ? "/communique" : "/communique";
  return `<article class="cq-item" data-theme="${t}" data-year="${d.slice(0, 4)}" data-date="${d}" data-hay="${esc((ti + " " + ch + " " + THEMES[t] + " " + ref).toLowerCase())}"><p class="cq-k"><span class="cq-ref">${ref}</span><time datetime="${d}">${dfr(d)}</time><span class="cq-th">${THEMES[t]}</span></p><h3 class="cq-it"><a href="${link}">${esc(ti)}</a></h3><p class="cq-ch">${esc(ch)}</p></article>`;
};

// ---------- structure commune ----------
const header = (c) => `<header class="cq-head pk-bleed"><div class="cq-top"><div class="cq-wrap cq-top-in"><span>Salle de presse · Toulouse</span><span class="cq-today" data-cq-today>5 novembre 2026</span><a href="/contact">Demande d'accréditation</a></div></div><div class="cq-wrap cq-mast"><a class="cq-logo" href="/">${MARK}<span class="cq-logo-t">Aubrac<small>Industries · salle de presse</small></span></a></div><div class="cq-navbar"><div class="cq-wrap cq-navin"><div class="cq-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "cq-nl")}</div><a class="cq-hs" href="/recherche">Rechercher</a><details class="cq-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cq-bmenu">${nav(c.menu, "cq-bl")}<a class="cq-bl" href="/recherche">Rechercher</a></div></details></div></div></header>`;
const footer = (c) => `<footer class="cq-foot pk-bleed"><div class="cq-wrap"><div class="cq-fgrid"><div class="cq-fbrand"><p class="cq-flogo">${MARK}<span>Aubrac Industries</span></p><p>Fabricant français de vélos cargos électriques. Siège à Toulouse, usines à Millau. Société fictive, créée pour la démonstration du thème.</p></div><div class="cq-fcol"><p class="cq-fh">Salle de presse</p>${nav([{ label: "Communiqués", url: "/communiques" }, { label: "Kit média", url: "/kit-media" }, { label: "Contacts presse", url: "/contacts-presse" }, { label: "L'entreprise", url: "/entreprise" }], "cq-fl")}</div><div class="cq-fcol"><p class="cq-fh">Presse</p>${nav([{ label: "Demande d'accréditation", url: "/contact" }, { label: "Recherche", url: "/recherche" }, { label: "Dernier communiqué", url: "/communique" }], "cq-fl")}<a class="cq-fl" href="mailto:presse@aubrac-industries.example">presse@aubrac-industries.example</a></div><div class="cq-fcol"><p class="cq-fh">Informations</p>${nav([{ label: "Mentions légales", url: "/mentions-legales" }, { label: "Confidentialité", url: "/confidentialite" }, { label: "Blocs de contenu", url: "/blocs" }], "cq-fl")}</div></div><p class="cq-copy">© Aubrac Industries — site de démonstration. Société, produits, chiffres et personnes fictifs.</p></div></footer>`;
const pagehead = (eyebrow, title, lead) => sec(`<section class="cq-ph pk-bleed"><div class="cq-wrap"><p class="cq-eyebrow">${eyebrow}</p><div class="cq-h1" role="heading" aria-level="1">${title}</div><p class="cq-lead">${lead}</p></div></section>`);
const wrap = (h, cls = "") => sec(`<section class="cq-sec pk-bleed${cls ? " " + cls : ""}"><div class="cq-wrap">${h}</div></section>`);
const shead = (t, more = "") => `<div class="cq-shead"><h2 class="cq-h2">${t}</h2>${more}</div>`;
const more = (u, t) => `<a class="cq-more" href="${u}">${t} ${ic("arr")}</a>`;

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="cq-front pk-bleed"><div class="cq-wrap cq-front-in"><article class="cq-lead-story"><p class="cq-k"><span class="cq-ref">À la une</span><time datetime="2026-11-05">5 novembre 2026</time><span class="cq-th">Produits</span></p><div class="cq-h1" role="heading" aria-level="1"><a href="/communique">${esc(CP[0][3])}</a></div><p class="cq-lead">${esc(CP[0][4])}</p>${more("/communique", "Lire le communiqué")}</article>
<aside class="cq-embargo" aria-label="Prochain communiqué sous embargo"><p class="cq-flag">Sous embargo</p><h2 class="cq-h3">Prochain communiqué</h2><p>Les résultats de l'exercice sont annoncés à une heure précise. Les journalistes accrédités reçoivent le dossier à l'avance.</p><div class="cq-cd" data-cq-countdown="2026-11-12T09:00:00"><span><b data-d>--</b>j</span><span><b data-h>--</b>h</span><span><b data-m>--</b>min</span><span><b data-s>--</b>s</span></div><p class="cq-cd-n" data-cq-cd-text>Levée de l'embargo : 12 novembre 2026, 9 h.</p><a class="cq-btn cq-btn--s" href="/contact">Demander le dossier ${ic("arr")}</a></aside></div></section>`),
  wrap(`${shead("Dépêches récentes", more("/communiques", "Toutes les dépêches"))}<div class="cq-wire">${CP.slice(1, 7).map((x, i) => item(x, i + 1)).join("")}</div>`),
  sec(`<section class="cq-facts pk-bleed"><div class="cq-wrap"><h2 class="cq-h2 cq-h2--l">Aubrac Industries en chiffres</h2><dl class="cq-nums"><div><dt>Chiffre d'affaires 2025</dt><dd>48 M€</dd></div><div><dt>Vélos assemblés en 2025</dt><dd>21 400</dd></div><div><dt>Salariés</dt><dd>312</dd></div><div><dt>Matériaux recyclés</dt><dd>62 %</dd></div></dl><p class="cq-fine cq-fine--l">Chiffres fictifs. Sources et définitions sur la page <a href="/entreprise">L'entreprise</a>.</p></div></section>`),
  wrap(`${shead("Pour les journalistes")}<div class="cq-three"><div class="cq-tile"><h3 class="cq-h3">Kit média</h3><p>Logos sur fonds, codes couleurs, textes de présentation à copier : tout pour illustrer un article.</p>${more("/kit-media", "Ouvrir le kit")}</div><div class="cq-tile"><h3 class="cq-h3">Contacts presse</h3><p>Une personne par domaine, un délai de réponse annoncé, un numéro d'astreinte pour les urgences.</p>${more("/contacts-presse", "Voir les contacts")}</div><div class="cq-tile"><h3 class="cq-h3">Accréditation</h3><p>Photographes et équipes de tournage : demandez l'accès aux usines et aux événements.</p>${more("/contact", "Faire une demande")}</div></div>`, "cq-sec--tint"),
  sec(footer(c)),
];

// ---------- communiqués (archives filtrables) ----------
const communiques = (c) => [
  sec(header(c)),
  pagehead("Communiqués", "Toutes les dépêches", "Quatorze communiqués de 2025 et 2026, à filtrer par année, par thème ou par mot. Les liens ouvrent le communiqué modèle du thème."),
  sec(`<section class="cq-sec pk-bleed"><div class="cq-wrap"><div class="cq-panel"><div><p class="cq-fh2">Année</p><div class="cq-fgroup" role="group" aria-label="Année"><a class="cq-chip is-on" href="#toutes" role="button" data-cq-year="tout">Toutes</a><a class="cq-chip" href="#a2026" role="button" data-cq-year="2026">2026</a><a class="cq-chip" href="#a2025" role="button" data-cq-year="2025">2025</a></div></div><div><p class="cq-fh2">Thème</p><div class="cq-fgroup" role="group" aria-label="Thème"><a class="cq-chip is-on" href="#tous" role="button" data-cq-theme="tout">Tous</a>${Object.entries(THEMES).map(([k, v]) => `<a class="cq-chip" href="#${k}" role="button" data-cq-theme="${k}">${v}</a>`).join("")}</div></div><div class="cq-search" data-cq-search></div></div><p class="cq-count" data-cq-count aria-live="polite">${CP.length} communiqués</p><div class="cq-list" data-cq-list>${CP.map((x, i) => item(x, i)).join("")}</div><div class="cq-empty cq-hid" data-cq-empty><p class="cq-empty-t">Aucun communiqué ne correspond.</p><p>Retirez un filtre ou <a href="#toutes" data-cq-reset>affichez toutes les dépêches</a>. Pour une information plus ancienne, <a href="/contact">écrivez au service de presse</a>.</p></div></div></section>`),
  sec(footer(c)),
];

// ---------- communiqué (dépêche) ----------
const communique = (c) => {
  const [ref, d, , ti, ch] = CP[0];
  return [
    sec(header(c)),
    sec(`<section class="cq-sec cq-art pk-bleed"><div class="cq-wrap cq-art-in"><div class="cq-crumbs" role="navigation" aria-label="Fil d'Ariane"><a href="/">Salle de presse</a><span aria-hidden="true">/</span><a href="/communiques">Communiqués</a><span aria-hidden="true">/</span><span>${ref}</span></div>
<article class="cq-release"><header class="cq-rh"><p class="cq-k"><span class="cq-ref">${ref}</span><span class="cq-flag cq-flag--ok">Diffusion libre</span><span class="cq-th">Produits</span></p><div class="cq-h1" role="heading" aria-level="1">${esc(ti)}</div><p class="cq-lead">${esc(ch)}</p><div class="cq-tools"><a class="cq-btn cq-btn--s" href="#copier" role="button" data-cq-copytext="[data-cq-body]">${ic("copy")} Copier le texte</a><a class="cq-btn cq-btn--s cq-btn--line" href="#imprimer" role="button" data-cq-print>${ic("print")} Imprimer</a><span class="cq-fine">Publié le <time datetime="${d}">${dfr(d)}</time> · 3 min de lecture</span></div></header>
<div class="cq-rb" data-cq-body><p class="cq-dateline"><b>TOULOUSE</b>, 5 novembre 2026 —</p><p>Aubrac Industries, fabricant français de vélos cargos électriques, présente aujourd'hui Transhumance, un modèle destiné aux familles comme aux professionnels, conçu et assemblé à Millau (Aveyron). Le vélo transporte jusqu'à 180 kg de charge, affiche 120 kilomètres d'autonomie réelle et se vend à partir de 3 990 € TTC, avec une commercialisation prévue dès le mois de mars 2027.</p>
<h2>Une batterie que l'on retire et que l'on répare</h2><p>Transhumance est le premier modèle du groupe équipé d'une batterie amovible entièrement réparable : chaque module de cellules peut être remplacé séparément, sans changer l'ensemble. Cette architecture, développée avec deux laboratoires universitaires, doit prolonger la durée de vie de la batterie de quatre à dix ans.</p>
<blockquote><p>Nous avons voulu un vélo cargo qui dure aussi longtemps qu'un bon outil. Quand un composant faiblit, on le change, on ne jette pas le tout.</p><cite>Claire Vandenbroucke, directrice générale déléguée (propos fictifs)</cite></blockquote>
<h2>Chiffres clés</h2><div class="cq-scroll" role="region" aria-label="Caractéristiques techniques"><table class="cq-tab"><caption>Caractéristiques de Transhumance (données fictives)</caption><thead><tr><th scope="col">Caractéristique</th><th scope="col">Valeur</th></tr></thead><tbody><tr><td>Charge utile</td><td>180 kg</td></tr><tr><td>Autonomie réelle</td><td>120 km</td></tr><tr><td>Poids à vide</td><td>38 kg</td></tr><tr><td>Prix de départ</td><td>3 990 € TTC</td></tr><tr><td>Disponibilité</td><td>Mars 2027</td></tr></tbody></table></div>
<h2>Production locale</h2><p>Le modèle sera assemblé dans la nouvelle usine de Millau, qui doit employer 120 personnes d'ici 2028. Quatre-vingt-dix pour cent des composants proviennent de fournisseurs situés à moins de 600 kilomètres du site.</p>
<h2>Disponibilité des visuels</h2><p>Des photographies haute définition, des vues techniques et les logos sont disponibles sur demande dans le <a href="/kit-media">kit média</a>. Des essais presse seront organisés en janvier 2027.</p>
<div class="cq-about"><h3 class="cq-h4">À propos d'Aubrac Industries</h3><p data-cq-about>Fondée en 2011 à Toulouse, Aubrac Industries conçoit et assemble en France des vélos cargos électriques pour les familles et les professionnels. Le groupe emploie 312 personnes, a réalisé un chiffre d'affaires de 48 millions d'euros en 2025 et est certifié B Corp. <i>Société fictive.</i></p><a class="cq-btn cq-btn--s cq-btn--line" href="#copier" role="button" data-cq-copytext="[data-cq-about]">${ic("copy")} Copier ce texte</a></div>
<div class="cq-contacts"><h3 class="cq-h4">Contact presse</h3><p><b>Karim Delacroix</b>, relations presse produits<br><a href="mailto:karim.delacroix@aubrac-industries.example">karim.delacroix@aubrac-industries.example</a> · 05 61 00 00 31</p></div><p class="cq-end" aria-label="Fin du communiqué">###</p></div></article></div></section>`),
    wrap(`${shead("Dans la même rubrique", more("/communiques", "Toutes les dépêches"))}<div class="cq-wire">${[CP[1], CP[3], CP[4]].map((x, i) => item(x, i)).join("")}</div>`, "cq-sec--tint"),
    sec(footer(c)),
  ];
};

// ---------- kit média ----------
const COULEURS = [["Vert Aubrac", "#0b4f6c", "Couleur principale, titres et logo"], ["Saumon presse", "#fff1e5", "Fond des documents imprimés"], ["Encre", "#1c1b1a", "Texte courant"], ["Rouge embargo", "#b3261e", "Mentions d'alerte uniquement"], ["Or cargo", "#d99a1d", "Accents et chiffres clés"]];
const kitmedia = (c) => [
  sec(header(c)),
  pagehead("Kit média", "Tout pour illustrer <em>un article</em>", "Logos, couleurs, textes de présentation : ce qu'on peut copier tout de suite, et ce qu'on demande au service de presse."),
  wrap(`<h2 class="cq-h2">Logo</h2><p class="cq-lead">Le logo se place sur fond clair, sombre ou coloré. Gardez une marge égale à la hauteur de la montagne autour du logo, sans le déformer ni le recolorer.</p><div class="cq-logos"><div class="cq-lg cq-lg--l"><span class="cq-lgd">${MARK}<b>Aubrac</b></span><small>Sur fond clair</small></div><div class="cq-lg cq-lg--d"><span class="cq-lgd">${MARK}<b>Aubrac</b></span><small>Sur fond sombre</small></div><div class="cq-lg cq-lg--c"><span class="cq-lgd">${MARK}<b>Aubrac</b></span><small>Sur fond Or cargo</small></div></div><p class="cq-fine">Les fichiers vectoriels et bitmap sont fournis sur demande : <a href="/contact">demander les logos</a>.</p>`),
  wrap(`<h2 class="cq-h2">Couleurs</h2><p class="cq-lead">Touchez un code pour le copier.</p><div class="cq-sw">${COULEURS.map(([n, h, u]) => `<div class="cq-swc"><span class="cq-chipc cq-chipc--${h.slice(1)}" aria-hidden="true"></span><b>${n}</b><span>${u}</span><a class="cq-hex" href="#copier" role="button" data-cq-copy="${h}">${ic("copy")} ${h.toUpperCase()}</a></div>`).join("")}</div>`, "cq-sec--tint"),
  wrap(`<h2 class="cq-h2">Typographie</h2><div class="cq-two"><div class="cq-prose"><p>Les documents imprimés utilisent une police à empattement pour les titres et le texte courant, et une police condensée pour les légendes, dates et références. Sur le web, les polices libres du site sont servies depuis le site lui-même.</p><ul><li><b>Titres :</b> empattement contrasté, graisse moyenne ;</li><li><b>Texte :</b> empattement de lecture, corps 11 à 12 points ;</li><li><b>Références :</b> sans empattement condensé, capitales espacées.</li></ul></div><div class="cq-sample-t"><p class="cq-sample-h">Transhumance, le vélo qui dure</p><p>Aa Bb Cc 0123456789</p></div></div>`),
  wrap(`<h2 class="cq-h2">Textes de présentation</h2><div class="cq-two"><div class="cq-boiler"><p class="cq-fh2">En une phrase</p><p data-cq-b1>Aubrac Industries conçoit et assemble en France des vélos cargos électriques réparables, pour les familles et les professionnels.</p><a class="cq-btn cq-btn--s cq-btn--line" href="#copier" role="button" data-cq-copytext="[data-cq-b1]">${ic("copy")} Copier</a></div><div class="cq-boiler"><p class="cq-fh2">En un paragraphe</p><p data-cq-b2>Fondée en 2011 à Toulouse, Aubrac Industries conçoit et assemble en France des vélos cargos électriques pour les familles et les professionnels. Le groupe emploie 312 personnes, produit dans trois usines en Aveyron et est certifié B Corp. Société fictive.</p><a class="cq-btn cq-btn--s cq-btn--line" href="#copier" role="button" data-cq-copytext="[data-cq-b2]">${ic("copy")} Copier</a></div></div>`, "cq-sec--tint"),
  wrap(`<h2 class="cq-h2">Visuels disponibles sur demande</h2><div class="cq-photos">${["Transhumance, vue trois quarts", "Transhumance chargé, usage familial", "Atelier d'assemblage de Millau", "Détail de la batterie amovible", "Portrait de la direction générale", "Flotte de livraison urbaine"].map((t, i) => `<figure class="cq-ph1"><svg viewBox="0 0 240 160" role="img" aria-label="Aperçu schématique : ${esc(t)}"><rect width="240" height="160" class="cq-pa${i % 3}"/><path d="M0 130 70 70 120 110 170 60 240 120V160H0z" class="cq-pb"/><circle cx="190" cy="40" r="16" class="cq-pc"/></svg><figcaption><b>${t}</b><span>6000 × 4000 px · libre de droits pour la presse</span></figcaption></figure>`).join("")}</div><p class="cq-fine">Aperçus schématiques. Les photographies sont envoyées après une demande via le <a href="/contact">formulaire de contact</a>.</p>`),
  sec(footer(c)),
];

// ---------- contacts presse ----------
const PEOPLE = [
  ["Mathilde Fournier", "Directrice de la communication", "Ensemble du groupe, sujets de fond", "mathilde.fournier", "05 61 00 00 10", "Sous 4 heures ouvrées"],
  ["Karim Delacroix", "Relations presse produits et innovation", "Nouveaux modèles, essais, salons", "karim.delacroix", "05 61 00 00 31", "Sous 4 heures ouvrées"],
  ["Hélène Bastide", "Relations presse financières", "Résultats, gouvernance, investisseurs", "helene.bastide", "05 61 00 00 42", "Sous 24 heures ouvrées"],
  ["Service presse régional", "Aveyron et Occitanie", "Usines de Millau, emploi local", "presse.millau", "05 65 00 00 18", "Sous 24 heures ouvrées"],
];
const contactsPresse = (c) => [
  sec(header(c)),
  pagehead("Contacts presse", "Une personne <em>par sujet</em>", "Choisissez le bon interlocuteur : la réponse sera plus rapide. Les délais indiqués sont des engagements de service, du lundi au vendredi."),
  wrap(`<div class="cq-people">${PEOPLE.map(([n, r, s, m, t, d]) => `<div class="cq-person"><span class="cq-av" aria-hidden="true">${n.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span><h2 class="cq-h3">${n}</h2><p class="cq-role">${r}</p><p><b>Sujets :</b> ${s}</p><p class="cq-resp">${ic("clock")}${d}</p><p>${ic("mail")}<a href="mailto:${m}@aubrac-industries.example">${m}@aubrac-industries.example</a></p><p>${ic("tel")}${t}</p><a class="cq-hex" href="#copier" role="button" data-cq-copy="${m}@aubrac-industries.example">${ic("copy")} Copier l'adresse</a></div>`).join("")}</div><p class="cq-fine">Personnes et coordonnées fictives.</p>`),
  wrap(`<div class="cq-two"><div class="cq-prose"><h2>Urgence et astreinte</h2><p>En cas d'événement grave en dehors des heures ouvrées, un numéro d'astreinte presse est communiqué aux journalistes accrédités. Pour le recevoir, demandez une accréditation.</p><h2>Règles du jeu</h2><ul><li>Les embargos sont toujours indiqués en tête de communiqué ;</li><li>Les citations sont relues sur demande, pas imposées ;</li><li>Les visuels sont libres de droits pour un usage éditorial.</li></ul></div><div class="cq-tile"><h3 class="cq-h3">Demande d'accréditation</h3><p>Reporters, photographes, équipes de tournage : indiquez votre média et l'objet de la demande.</p><a class="cq-btn" href="/contact">Faire une demande ${ic("arr")}</a></div></div>`, "cq-sec--tint"),
  sec(footer(c)),
];

// ---------- entreprise ----------
const entreprise = (c) => [
  sec(header(c)),
  pagehead("L'entreprise", "Aubrac Industries <em>en bref</em>", "Faits, chiffres et repères pour contextualiser un article. Tout est fictif, mais plausible."),
  wrap(`<div class="cq-two"><div class="cq-prose"><h2>Ce que nous faisons</h2><p>Aubrac Industries conçoit, assemble et répare des vélos cargos électriques en Aveyron. Les modèles s'adressent aux familles, aux artisans et aux services de livraison urbaine.</p><h2>Ce qui nous distingue</h2><ul><li>Une batterie entièrement réparable, module par module ;</li><li>Quatre-vingt-dix pour cent de composants issus de fournisseurs situés à moins de 600 km ;</li><li>Un rapport d'impact publié chaque année et vérifié par un tiers.</li></ul></div><dl class="cq-nums cq-nums--s"><div><dt>Création</dt><dd>2011</dd></div><div><dt>Siège</dt><dd>Toulouse</dd></div><div><dt>Salariés</dt><dd>312</dd></div><div><dt>Usines</dt><dd>3</dd></div></dl></div>`),
  wrap(`<h2 class="cq-h2">Repères chronologiques</h2><ol class="cq-time">${[["2011", "Création à Toulouse par deux ingénieurs et un menuisier."], ["2015", "Premier vélo cargo électrique de série, assemblé dans un atelier de Millau."], ["2019", "Lancement de la gamme professionnelle et du système de batterie amovible."], ["2023", "Deuxième usine, certification ISO 14001."], ["2025", "Certification B Corp et fonds de dotation pour la mobilité rurale."], ["2026", "Troisième usine et lancement de Transhumance."]].map(([a, t]) => `<li><b>${a}</b><span>${t}</span></li>`).join("")}</ol>`, "cq-sec--tint"),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Demande <em>presse</em>", "Accréditation, interview, visuels, informations complémentaires : décrivez votre demande et l'échéance de publication."),
  { type: "form", heading: "Votre demande", intro: "Indiquez votre média, votre sujet et votre date de bouclage. Le formulaire fonctionne comme sur un vrai site, mais cette démonstration ne l'envoie à personne." },
  wrap(`<div class="cq-note"><strong>Délais.</strong> Nous répondons sous quatre heures ouvrées pour les demandes urgentes (mentionnez « bouclage » dans l'objet) et sous un jour ouvré dans les autres cas.</div>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher <em>dans la salle de presse</em>", "Un thème, une référence, un mot du titre : tapez un mot."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un communiqué, un thème…" } }] },
  wrap(`<div class="cq-empty"><p class="cq-empty-t">Aucun résultat ?</p><p>Essayez un mot plus court ou une référence (« CP-2026-31 »). Vous pouvez aussi parcourir <a href="/communiques">toutes les dépêches</a> ou <a href="/contact">écrire au service de presse</a>.</p></div>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="cq-404 pk-bleed"><div class="cq-wrap cq-404-in"><p class="cq-404-n" aria-hidden="true">404</p><div><p class="cq-eyebrow">Rectificatif</p><div class="cq-h1" role="heading" aria-level="1">Cette page est <em>retirée de la diffusion</em>.</div><p class="cq-lead">L'adresse est erronée ou le communiqué a été retiré. Les dépêches en cours sont toutes dans la salle de presse.</p><div class="cq-tools"><a class="cq-btn" href="/communiques">Voir les communiqués ${ic("arr")}</a><a class="cq-btn cq-btn--line" href="/">Accueil</a></div><p class="cq-end">###</p></div></div></section>`),
  sec(footer(c)),
];
const wrapLegal = (c, parts) => [sec(header(c)), ...parts, sec(footer(c))];

module.exports = {
  key: "communique", name: "Communiqué", version: "1.0.0", category: "edition", tags: ["classique", "editorial", "minimaliste"], siteType: "Salle de presse d'entreprise", collection: "pro", featured: false,
  concept: "Une salle de presse façon journal économique : manchette centrée, filets fins, dépêches numérotées avec dateline et fin « ### », embargo avec compte à rebours réel, texte copiable en un geste, kit média et contacts presse par sujet.",
  description: "Salle de presse d'entreprise : communiqués archivés et filtrables (année, thème, mot), dépêche copiable et imprimable, embargo avec compte à rebours, kit média (logos, couleurs, textes à copier) et annuaire des contacts presse.",
  brand: "Communiqué", modules: ["formulaires", "recherche"],
  contentModel: "Les communiqués, contacts et éléments du kit média sont écrits dans les pages du thème (aucun type de contenu « presse » dans le CMS) ; filtres, copie de texte, impression et compte à rebours d'embargo sont exécutés dans motion.js. Aucun fichier à télécharger n'est promis : les visuels sont fournis sur demande.",
  dna: {
    hero: "une-du-journal-titre-de-depeche-geant-et-encadre-d-embargo-avec-compte-a-rebours",
    header: "manchette-centree-a-double-filet-bandeau-de-date-et-menu-en-petites-capitales",
    grid: "colonnes-de-journal-separees-par-filets-fins-sur-trois-colonnes",
    typo: "empattement-contraste-de-titrage-avec-condense-pour-datelines-et-references",
    shapes: "filets-fins-doubles-filets-cadres-sans-arrondi-et-mentions-encadrees",
    motion: "compte-a-rebours-d-embargo-copie-avec-confirmation-et-filtres-sans-mouvement-decoratif",
    rhythm: "pages-saumon-bandes-blanches-et-aplat-petrole-pour-les-chiffres-cles",
    signature: "depeche-copiable-avec-dateline-embargo-compte-a-rebours-kit-media-a-copier-et-archives-filtrables",
    palette: "saumon-de-presse-bleu-petrole-encre-et-or-cargo",
    image: "logo-vectoriel-sur-trois-fonds-et-apercus-schematiques-de-visuels",
    list: "depeches-en-colonnes-chronologie-ou-tableau-de-references",
    article: "depeche-en-colonne-etroite-avec-dateline-citation-et-fin-diese",
    sidebar: "aucune-barre-laterale-bloc-contact-en-fin-de-depeche",
    reading: "empattement-de-lecture-dix-huit-pixels-colonne-de-soixante-cinq-signes",
  },
  tokens: {
    colors: { primary: "#0b4f6c", secondary: "#1c1b1a", accent: "#d99a1d", background: "#fff1e5", surface: "#fffaf5", text: "#1c1b1a", muted: "#555049", success: "#1e6b3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.noto-serif-display", body: "font.source-serif-4", button: "font.barlow-condensed", link: "font.source-serif-4" },
    radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#1c1b1a" },
    type: { h1: { size: 54, weight: 600, lineHeight: 1.06, transform: "none" }, h2: { size: 32, weight: 600, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Or des accents", type: "color", default: "#d99a1d" },
    { key: "entete", label: "En-tête", type: "choice", default: "manchette", choices: [["manchette", "Manchette centrée à double filet"], ["barre", "Barre compacte : marque à gauche"], ["agence", "Agence : bandeau sombre"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "colonnes", choices: [["colonnes", "Colonnes de liens"], ["ligne", "Ligne : mentions seulement"]] },
    { key: "liste", label: "Liste des communiqués", type: "choice", default: "colonnes", choices: [["colonnes", "Colonnes de journal"], ["chrono", "Chronologie : date à gauche"], ["tableau", "Tableau de références"]] },
    { key: "depeche", label: "Page de communiqué", type: "choice", default: "agence", choices: [["agence", "Dépêche : colonne étroite"], ["magazine", "Magazine : titre large et lettrine"]] },
    { key: "filets", label: "Filets de colonne", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Communiqués", "/communiques"], ["Kit média", "/kit-media"], ["Contacts presse", "/contacts-presse"], ["L'entreprise", "/entreprise"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "communiques", name: "Communiqués (archives filtrables)", render: communiques }, { key: "communique", name: "Communiqué", render: communique },
    { key: "kit-media", name: "Kit média", render: kitmedia }, { key: "contacts-presse", name: "Contacts presse", render: contactsPresse }, { key: "entreprise", name: "L'entreprise", render: entreprise },
    { key: "contact", name: "Contact et accréditation", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: (c) => wrapLegal(c, common.mentions()) }, { key: "confidentialite", name: "Confidentialité", render: (c) => wrapLegal(c, common.confidentialite()) }, { key: "blocs", name: "Blocs de contenu", render: (c) => wrapLegal(c, common.blocs()) },
  ],
};
