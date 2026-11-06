// Fichier — annuaire / répertoire des savoir-faire de Gironde (association fictive « Fichier »). Direction artistique : fichier de bibliothèque — fiches cartonnées à onglets de couleur, lignes bleues et marge rouge,
// tampons à la machine à écrire, tiroir de classement, carte schématique cliquable. 24 fiches fictives filtrables par catégorie, par lieu (liste ou carte) et par mot, triables, en trois présentations.
// Tout est démonstration : établissements, coordonnées et horaires sont fictifs. Aucun type de contenu « fiche » n'existe dans le CMS : les fiches sont écrites dans les pages du thème ; le filtre est exécuté dans motion.js.
const { sec, esc, nav } = require("../kit");
const common = require("./communes");

const IC = {
  arr: '<path d="M5 12h14m-6-6 6 6-6 6"/>', pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  tel: '<path d="M6 3h4l2 5-2.500 1.500a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/>', mail: '<path d="M3 6h18v12H3zM3 7l9 7 9-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>', chk: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
};
const ic = (k, c = "fi-i") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

const CATS = { art: ["Métiers d'art", "c1"], food: ["Alimentation et vin", "c2"], bat: ["Bâtiment et rénovation", "c3"], bien: ["Bien-être et santé", "c4"], num: ["Numérique et création", "c5"], acc: ["Hébergement et visites", "c6"] };
// nom, commune (clé), x, y sur la carte schématique
const LIEUX = { bordeaux: ["Bordeaux", 150, 156], pessac: ["Pessac", 124, 196], libourne: ["Libourne", 226, 116], stemilion: ["Saint-Émilion", 252, 150], arcachon: ["Arcachon", 58, 232], blaye: ["Blaye", 156, 48], langon: ["Langon", 204, 276], lesparre: ["Lesparre", 74, 70] };
// [nom, catégorie, lieu, année, description, prestations, téléphone]
const F = [
  ["Tonnellerie Marchesseau", "art", "libourne", 1962, "Fûts en chêne français assemblés à la main, du merrain à la chauffe, pour domaines viticoles et amateurs de whisky.", "Fûts sur mesure, réparation, visites de l'atelier", "05 57 00 10 21"],
  ["Atelier Verre & Feu", "art", "bordeaux", 2009, "Soufflage de verre, luminaires et pièces uniques créés devant les visiteurs, du jeudi au samedi.", "Pièces uniques, stages d'initiation, commandes", "05 56 00 20 32"],
  ["La Reliure du Chartrons", "art", "bordeaux", 1988, "Reliure d'art, restauration de livres anciens et boîtes de conservation sur mesure.", "Restauration, reliure d'art, dorure", "05 56 00 31 43"],
  ["Céramiques du Bassin", "art", "arcachon", 2015, "Vaisselle en grès tournée à la main, émaillée aux couleurs de l'estuaire.", "Vaisselle, cours de tournage, ventes à l'atelier", "05 56 00 42 54"],
  ["Cannelés Maison Lavigne", "food", "bordeaux", 1949, "Boulangerie-pâtisserie familiale, cannelés cuits en moules de cuivre et pain au levain.", "Pâtisserie, pain, commandes de fêtes", "05 56 00 53 65"],
  ["Domaine des Trois Chênes", "food", "stemilion", 1934, "Vignoble de quinze hectares en agriculture biologique, dégustations commentées sur réservation.", "Dégustations, vente directe, visites de chai", "05 57 00 64 76"],
  ["Huîtres Dubosc", "food", "arcachon", 1971, "Ostréiculteur de père en fils : huîtres, coquillages et dégustation sur le port en saison.", "Vente directe, dégustation, expéditions", "05 56 00 75 87"],
  ["La Ferme du Haut-Médoc", "food", "lesparre", 2003, "Fromages de chèvre fermiers, œufs et légumes de saison vendus à la ferme et sur trois marchés.", "Vente à la ferme, paniers, visites", "05 56 00 86 98"],
  ["Safran de Garonne", "food", "langon", 2018, "Culture de safran sur trois hectares, récolte à la main en octobre, ateliers de cuisine.", "Vente directe, ateliers, visites d'octobre", "05 56 00 97 09"],
  ["Charpente Castaing", "bat", "pessac", 1996, "Charpente traditionnelle, ossature bois et rénovation de toitures en pierre et tuile canal.", "Charpente, rénovation, devis gratuit", "05 56 00 08 10"],
  ["Pierre de Frontenac", "bat", "libourne", 1958, "Taille de pierre calcaire, restauration d'édifices et création de cheminées et d'escaliers.", "Taille, restauration, pose", "05 57 00 19 21"],
  ["Enduits & Chaux Armagnac", "bat", "blaye", 2011, "Enduits à la chaux, badigeons et rénovation de maisons de pays dans le respect du bâti ancien.", "Enduits, badigeons, diagnostic", "05 57 00 20 32"],
  ["Menuiserie Lamarque", "bat", "bordeaux", 1983, "Fenêtres, escaliers et agencements en bois massif, fabrication dans l'atelier de Bacalan.", "Fenêtres, escaliers, agencement", "05 56 00 31 43"],
  ["Cabinet Osteo Mérignac Sud", "bien", "pessac", 2012, "Ostéopathie pour adultes, enfants et nourrissons, sur rendez-vous, du lundi au samedi.", "Consultations, prise de rendez-vous en ligne", "05 56 00 42 54"],
  ["Yoga du Port de la Lune", "bien", "bordeaux", 2017, "Cours de yoga en petits groupes, du matin au soir, avec séances en plein air l'été.", "Cours collectifs, stages, cours particuliers", "05 56 00 53 65"],
  ["Pharmacie des Allées", "bien", "libourne", 1975, "Pharmacie de quartier, orthopédie, conseil en phytothérapie et livraison à domicile.", "Conseils, livraison, matériel médical", "05 57 00 64 76"],
  ["Studio Marée Haute", "num", "arcachon", 2020, "Studio de création web et d'identité pour les entreprises du littoral, de la vitrine au site de réservation.", "Sites vitrines, identité, formation", "05 56 00 75 87"],
  ["Cartographe Garonne", "num", "bordeaux", 2014, "Cartes illustrées et plans de visite sur mesure pour offices de tourisme et domaines.", "Cartes illustrées, plans, panneaux", "05 56 00 86 98"],
  ["Atelier Lumière Numérique", "num", "pessac", 2019, "Photographie d'architecture et de produits, retouche et vidéos courtes pour l'artisanat.", "Photos, vidéos, retouche", "05 56 00 97 09"],
  ["Podcast Bordeaux Sonore", "num", "bordeaux", 2021, "Studio d'enregistrement à la journée et production de podcasts pour associations et entreprises.", "Enregistrement, montage, diffusion", "05 56 00 08 10"],
  ["Gîte de la Bastide", "acc", "stemilion", 2007, "Quatre chambres dans une bastide du XVIIIe siècle, petit-déjeuner de produits locaux.", "Chambres, tables d'hôtes, séminaires", "05 57 00 19 21"],
  ["Cabane du Bassin", "acc", "arcachon", 2013, "Cabanes d'ostréiculteurs rénovées, location à la nuit ou à la semaine, vue sur le banc d'Arguin.", "Location, ateliers huîtres", "05 56 00 20 32"],
  ["Visites du Vieux Libourne", "acc", "libourne", 2010, "Visites guidées à pied de la bastide, de la place Abel-Surchamp aux quais de la Dordogne.", "Visites guidées, groupes, scolaires", "05 57 00 31 43"],
  ["Chai du Fleuve", "acc", "blaye", 2016, "Petit hôtel de huit chambres dans un ancien chai, face à l'estuaire, avec restaurant de produits de saison.", "Chambres, restaurant, séminaires", "05 57 00 42 54"],
  ["Miel de Landes", "food", "lesparre", 2005, "Apiculteur : miels de bruyère, d'acacia et de châtaignier, pain d'épices et cire.", "Vente directe, visites de ruchers", "05 56 00 53 65"],
];
const nameKey = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const card = (f, i) => {
  const [n, c, l, y, d, p, tel] = f;
  const hay = nameKey(`${n} ${CATS[c][0]} ${LIEUX[l][0]} ${d} ${p}`);
  return `<article class="fi-card ${CATS[c][1]}" data-cat="${c}" data-lieu="${l}" data-name="${esc(nameKey(n))}" data-year="${y}" data-hay="${esc(hay)}"><span class="fi-tab">${esc(CATS[c][0])}</span><div class="fi-card-b"><h3 class="fi-card-t"><a href="/fiche">${esc(n)}</a></h3><p class="fi-meta"><span>${ic("pin")}${LIEUX[l][0]}</span><span>depuis ${y}</span></p><p class="fi-desc">${esc(d)}</p><p class="fi-prest">${esc(p)}</p><p class="fi-tel">${ic("tel")}${tel}</p></div></article>`;
};

// ---------- carte schématique (clic = filtrer par commune) ----------
const MAP = `<div class="fi-map" data-fi-map><svg viewBox="0 0 300 330" role="group" aria-label="Carte schématique de la Gironde : choisissez une commune"><path class="fi-land" d="M40 30 118 14 190 28 250 70 284 130 270 200 250 252 218 300 168 316 112 300 60 280 30 220 24 140z"/><path class="fi-water" d="M140 22C150 70 176 100 178 138 182 170 152 190 136 190"/><path class="fi-sea" d="M0 120C20 150 22 220 32 260L0 330z"/>${Object.entries(LIEUX).map(([k, [n, x, y]]) => `<g class="fi-pin" data-fi-pin="${k}"><circle cx="${x}" cy="${y}" r="9"/><path d="M${x} ${y + 5}v-0.1"/><circle class="fi-pin-h" cx="${x}" cy="${y}" r="15"/></g>`).join("")}</svg><ul class="fi-map-l">${Object.entries(LIEUX).map(([k, [n]]) => `<li><a class="fi-lbtn" href="#${k}" role="button" data-fi-lieu="${k}">${n}</a></li>`).join("")}</ul></div>`;

// ---------- structure commune ----------
const logo = () => `<a class="fi-logo" href="/"><span class="fi-logo-l">Fichier</span><small>répertoire des savoir-faire</small></a>`;
const header = (c) => `<header class="fi-head pk-bleed"><div class="fi-wrap fi-head-in">${logo()}<div class="fi-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "fi-nl")}</div><a class="fi-hs" href="/recherche">${ic("search")}<span>Chercher</span></a><details class="fi-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="fi-bmenu">${nav(c.menu, "fi-bl")}<a class="fi-bl" href="/recherche">Rechercher</a></div></details></div></header>`;
const footer = (c) => `<footer class="fi-foot pk-bleed"><div class="fi-wrap"><div class="fi-drawer"><div class="fi-label">Fichier</div><div class="fi-fcols"><div class="fi-fcol"><p class="fi-fh">Parcourir</p>${nav([{ label: "Répertoire complet", url: "/repertoire" }, { label: "Par catégorie", url: "/categories" }, { label: "Une fiche modèle", url: "/fiche" }], "fi-fl")}</div><div class="fi-fcol"><p class="fi-fh">Participer</p>${nav([{ label: "Proposer une fiche", url: "/proposer" }, { label: "Contact", url: "/contact" }, { label: "Recherche", url: "/recherche" }], "fi-fl")}</div><div class="fi-fcol"><p class="fi-fh">Informations</p>${nav([{ label: "Mentions légales", url: "/mentions-legales" }, { label: "Confidentialité", url: "/confidentialite" }, { label: "Blocs de contenu", url: "/blocs" }], "fi-fl")}</div></div></div><p class="fi-copy">© Association Fichier — site de démonstration. Établissements, coordonnées et horaires fictifs.</p></div></footer>`;
const pagehead = (eyebrow, title, lead) => sec(`<section class="fi-ph pk-bleed"><div class="fi-wrap"><p class="fi-stamp">${eyebrow}</p><div class="fi-h1" role="heading" aria-level="1">${title}</div><p class="fi-lead">${lead}</p></div></section>`);
const wrap = (h, cls = "") => sec(`<section class="fi-sec pk-bleed${cls ? " " + cls : ""}"><div class="fi-wrap">${h}</div></section>`);

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="fi-hero pk-bleed"><div class="fi-wrap fi-hero-in"><div class="fi-hero-t"><p class="fi-stamp">Gironde · 24 fiches · mise à jour en novembre</p><div class="fi-h1" role="heading" aria-level="1">Le bon savoir-faire, <em>à deux pas de chez vous.</em></div><p class="fi-lead">Artisans, producteurs, créateurs, hébergeurs : un répertoire tenu à la main par une association, fiche après fiche, où chaque entrée a été vérifiée par un coup de téléphone.</p><div class="fi-quick" data-fi-quick><a class="fi-btn" href="/repertoire">Ouvrir le répertoire ${ic("arr")}</a><a class="fi-btn fi-btn--line" href="/proposer">Proposer une fiche</a></div></div><div class="fi-hero-c"><div class="fi-index"><div class="fi-index-tabs" aria-hidden="true"><span class="c1"></span><span class="c2"></span><span class="c3"></span><span class="c4"></span><span class="c5"></span><span class="c6"></span></div><div class="fi-index-card"><p class="fi-stamp fi-stamp--s">Fiche n° 0001</p><h2 class="fi-h3">Où cherchez-vous ?</h2>${MAP}</div></div></div></div></section>`),
  wrap(`<div class="fi-shead"><h2 class="fi-h2">Six tiroirs</h2><a class="fi-more" href="/categories">Toutes les catégories ${ic("arr")}</a></div><div class="fi-cats">${Object.entries(CATS).map(([k, [n, cl]]) => { const nb = F.filter((f) => f[1] === k).length; return `<a class="fi-cat ${cl}" href="/repertoire"><span class="fi-cat-n">${nb}</span><span class="fi-cat-t">${n}</span><span class="fi-cat-m">fiche${nb > 1 ? "s" : ""}</span></a>`; }).join("")}</div>`),
  wrap(`<div class="fi-shead"><h2 class="fi-h2">Dernières fiches ajoutées</h2><a class="fi-more" href="/repertoire">Tout le répertoire ${ic("arr")}</a></div><div class="fi-cards">${F.slice(0, 6).map((f, i) => card(f, i)).join("")}</div>`, "fi-sec--tint"),
  sec(`<section class="fi-steps pk-bleed"><div class="fi-wrap"><h2 class="fi-h2">Comment une fiche entre au répertoire</h2><ol class="fi-os"><li><b>1</b><h3 class="fi-h4">La proposition</h3><p>L'établissement ou un voisin remplit le formulaire de proposition en trois minutes.</p></li><li><b>2</b><h3 class="fi-h4">La vérification</h3><p>Un bénévole appelle, vérifie l'adresse, les horaires et le savoir-faire annoncé.</p></li><li><b>3</b><h3 class="fi-h4">Le classement</h3><p>La fiche est rangée dans son tiroir, avec sa commune, et relue tous les ans.</p></li></ol><a class="fi-btn" href="/proposer">Proposer une fiche ${ic("arr")}</a></div></section>`),
  sec(footer(c)),
];

// ---------- répertoire (liste filtrable) ----------
const repertoire = (c) => [
  sec(header(c)),
  pagehead("Le répertoire", "Les fiches <em>du fichier</em>", "Choisissez un tiroir, une commune (sur la liste ou la carte) ou tapez un mot : les fiches se trient devant vous."),
  sec(`<section class="fi-sec pk-bleed"><div class="fi-wrap"><div class="fi-panel"><div class="fi-pcol"><p class="fi-fh">Catégorie</p><div class="fi-fgroup" role="group" aria-label="Catégories"><a class="fi-chip is-on" href="#tout" role="button" data-fi-cat="tout">Toutes</a>${Object.entries(CATS).map(([k, [n, cl]]) => `<a class="fi-chip ${cl}" href="#${k}" role="button" data-fi-cat="${k}">${n}</a>`).join("")}</div><p class="fi-fh">Mot, nom, savoir-faire</p><div class="fi-search" data-fi-search></div><p class="fi-fh">Trier</p><div class="fi-fgroup" role="group" aria-label="Tri"><a class="fi-chip is-on" href="#nom" role="button" data-fi-sort="nom">Par nom</a><a class="fi-chip" href="#lieu" role="button" data-fi-sort="lieu">Par commune</a><a class="fi-chip" href="#anciennete" role="button" data-fi-sort="anciennete">Plus anciennes d'abord</a></div></div><div class="fi-pcol">${MAP}</div></div>
<p class="fi-count" data-fi-count aria-live="polite">${F.length} fiches</p><div class="fi-cards" data-fi-list>${F.slice(0, 12).map((f, i) => card(f, i)).join("")}</div></div></section>`),
  sec(`<section class="fi-sec fi-sec--t0 pk-bleed"><div class="fi-wrap"><div class="fi-cards" data-fi-list2>${F.slice(12).map((f, i) => card(f, i + 12)).join("")}</div><div class="fi-empty fi-hid" data-fi-empty><p class="fi-empty-t">Aucune fiche dans ce tiroir.</p><p>Retirez un filtre, ou <a href="#tout" data-fi-reset>rouvrez tout le répertoire</a>. Il manque un établissement ? <a href="/proposer">Proposez-le</a>.</p></div></div></section>`),
  sec(footer(c)),
];

// ---------- catégories ----------
const categories = (c) => [
  sec(header(c)),
  pagehead("Les tiroirs", "Parcourir <em>par catégorie</em>", "Six tiroirs, chacun avec son onglet de couleur. Le nombre indique les fiches rangées dedans."),
  wrap(`<div class="fi-drawers">${Object.entries(CATS).map(([k, [n, cl]]) => { const items = F.filter((f) => f[1] === k); return `<div class="fi-dr ${cl}"><span class="fi-tab">${n}</span><div class="fi-dr-b"><p class="fi-dr-n">${items.length} fiche${items.length > 1 ? "s" : ""}</p><ul>${items.slice(0, 4).map((f) => `<li><a href="/fiche">${esc(f[0])}</a> <span>${LIEUX[f[2]][0]}</span></li>`).join("")}</ul><a class="fi-more" href="/repertoire">Ouvrir le tiroir ${ic("arr")}</a></div></div>`; }).join("")}</div>`),
  sec(footer(c)),
];

// ---------- fiche (page intérieure) ----------
const fiche = (c) => {
  const f = F[0];
  return [
    sec(header(c)),
    sec(`<section class="fi-sec fi-fiche pk-bleed"><div class="fi-wrap"><div class="fi-crumbs" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/repertoire">Répertoire</a><span aria-hidden="true">/</span><span>${CATS[f[1]][0]}</span></div>
<div class="fi-dossier ${CATS[f[1]][1]}"><span class="fi-tab">${CATS[f[1]][0]}</span><div class="fi-dossier-b"><div class="fi-dossier-h"><p class="fi-stamp fi-stamp--s">Fiche n° 0007 · vérifiée en octobre 2026</p><div class="fi-h1" role="heading" aria-level="1">${esc(f[0])}</div><p class="fi-meta"><span>${ic("pin")}${LIEUX[f[2]][0]}, Gironde</span><span>Fondée en ${f[3]}</span><span>6 personnes</span></p></div>
<div class="fi-two"><div class="fi-main"><h2 class="fi-h3">Présentation</h2><p>${esc(f[4])}</p><p>L'atelier est installé dans un ancien chai de la rue des Tonneliers. Les visiteurs peuvent suivre la fabrication d'un fût de bout en bout, du fendage du merrain à la chauffe, puis repartir avec un petit fût de table.</p><h2 class="fi-h3">Prestations</h2><ul class="fi-ticks">${f[5].split(", ").map((x) => `<li>${ic("chk")}${esc(x[0].toUpperCase() + x.slice(1))}</li>`).join("")}<li>${ic("chk")}Visites de groupe sur réservation</li><li>${ic("chk")}Accueil des scolaires</li></ul>
<h2 class="fi-h3">Horaires</h2><div class="fi-scroll" role="region" aria-label="Horaires d'ouverture"><table class="fi-tab2"><caption>Horaires de l'atelier (fictifs)</caption><thead><tr><th scope="col">Jour</th><th scope="col">Matin</th><th scope="col">Après-midi</th></tr></thead><tbody><tr><td>Lundi au jeudi</td><td>8 h – 12 h</td><td>13 h 30 – 17 h 30</td></tr><tr><td>Vendredi</td><td>8 h – 12 h</td><td>13 h 30 – 16 h</td></tr><tr><td>Samedi</td><td>Visites 10 h et 11 h</td><td>Fermé</td></tr><tr><td>Dimanche</td><td>Fermé</td><td>Fermé</td></tr></tbody></table></div></div>
<aside class="fi-side" aria-label="Coordonnées"><div class="fi-coord"><p class="fi-fh">Coordonnées</p><p>${ic("pin")}12 rue des Tonneliers<br>33500 ${LIEUX[f[2]][0]}</p><p>${ic("tel")}<a href="#copier" role="button" data-fi-copy="${f[6]}">${f[6]}</a> <span class="fi-fine">(touchez pour copier)</span></p><p>${ic("mail")}<a href="mailto:atelier@marchesseau.example">atelier@marchesseau.example</a></p><p class="fi-fine">Coordonnées fictives.</p></div><div class="fi-coord"><p class="fi-fh">Une erreur sur cette fiche ?</p><p>Dites-le-nous : un bénévole corrige sous une semaine.</p><a class="fi-btn fi-btn--line" href="/contact">Signaler une erreur</a></div></aside></div></div></div></div></section>`),
    wrap(`<div class="fi-shead"><h2 class="fi-h2">Fiches voisines</h2><a class="fi-more" href="/repertoire">Tout le répertoire ${ic("arr")}</a></div><div class="fi-cards">${[F[10], F[19], F[5]].map((x, i) => card(x, i)).join("")}</div>`, "fi-sec--tint"),
    sec(footer(c)),
  ];
};

const proposer = (c) => [
  sec(header(c)),
  pagehead("Participer", "Proposer <em>une fiche</em>", "Vous tenez un atelier, une ferme, un cabinet, un gîte ? Remplissez le formulaire : un bénévole vous rappelle pour vérifier les informations."),
  { type: "form", heading: "Votre établissement", intro: "Nom, commune, activité, coordonnées publiques. Le formulaire fonctionne comme sur un vrai site, mais cette démonstration ne l'envoie à personne." },
  wrap(`<div class="fi-two fi-two--c"><div class="fi-main"><h2 class="fi-h3">Ce qu'il faut savoir</h2><ul class="fi-ticks"><li>${ic("chk")}Gratuit, sans publicité ni classement payant ;</li><li>${ic("chk")}Établissements installés en Gironde ;</li><li>${ic("chk")}Savoir-faire réel, vérifiable par téléphone ;</li><li>${ic("chk")}Fiche relue chaque année.</li></ul></div><div class="fi-coord"><p class="fi-fh">Délai</p><p>Comptez deux semaines entre la proposition et la publication de la fiche.</p></div></div>`),
  sec(footer(c)),
];
const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Écrire <em>à l'association</em>", "Une question, une correction, une envie de donner un coup de main : le fichier se remplit à plusieurs."),
  { type: "form", heading: "Votre message", intro: "Précisez la fiche concernée si besoin. Le formulaire fonctionne comme sur un vrai site, mais cette démonstration ne l'envoie à personne." },
  wrap(`<div class="fi-coord fi-coord--w"><p class="fi-fh">Permanence</p><p>Les bénévoles répondent le mardi et le jeudi, de 14 h à 17 h. En dehors, votre message est lu le lendemain.</p></div>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher <em>dans le fichier</em>", "Un nom, une commune, un métier : tapez un mot."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un établissement, un métier…" } }] },
  wrap(`<div class="fi-empty"><p class="fi-empty-t">Aucune fiche trouvée ?</p><p>Essayez un mot plus court, une commune, ou parcourez <a href="/categories">les six tiroirs</a>. Il manque un établissement ? <a href="/proposer">Proposez-le</a>.</p></div>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="fi-404 pk-bleed"><div class="fi-wrap fi-404-in"><div class="fi-lost" aria-hidden="true"><div class="fi-lost-c">?</div><span class="fi-tab">Fiche égarée</span></div><div><p class="fi-stamp">Erreur 404 · fiche non classée</p><div class="fi-h1" role="heading" aria-level="1">Cette fiche est <em>mal rangée</em>.</div><p class="fi-lead">Le tiroir est vide à cet endroit : la fiche a été retirée, déplacée ou n'a jamais existé. Rouvrez le répertoire pour la retrouver.</p><div class="fi-quick"><a class="fi-btn" href="/repertoire">Ouvrir le répertoire ${ic("arr")}</a><a class="fi-btn fi-btn--line" href="/">Accueil</a></div></div></div></section>`),
  sec(footer(c)),
];
const wrapLegal = (c, parts) => [sec(header(c)), ...parts, sec(footer(c))];

module.exports = {
  key: "fichier", name: "Fichier", version: "1.0.0", category: "services", tags: ["classique", "editorial", "technique"], siteType: "Annuaire / répertoire", collection: "pro", featured: false,
  concept: "Un annuaire conçu comme un fichier de bibliothèque : fiches cartonnées à onglets de couleur, lignes bleues et marge rouge, tampons à la machine à écrire, tiroirs par catégorie et carte schématique cliquable pour filtrer par commune.",
  description: "Annuaire filtrable : 24 fiches fictives triables par catégorie, commune (liste ou carte) et mot, trois présentations (fiches, tableau, annuaire), fiche détaillée avec horaires et coordonnées, proposition de fiche par formulaire.",
  brand: "Fichier", modules: ["formulaires", "recherche"],
  contentModel: "Les fiches, catégories et communes sont écrites dans les pages du thème (aucun type de contenu « annuaire » ni carte dans le CMS pour l'instant) ; filtres, tris et carte schématique sont exécutés dans motion.js.",
  dna: {
    hero: "grande-fiche-cartonnee-a-six-onglets-de-couleur-contenant-la-carte-schematique-et-recherche-en-tete",
    header: "barre-de-papier-avec-etiquette-de-tiroir-comme-logo-menu-en-onglets-et-loupe",
    grid: "fiches-cartonnees-en-trois-colonnes-avec-panneau-de-filtres-et-carte-a-gauche-du-resultat",
    typo: "capitales-etroites-de-fichier-et-machine-a-ecrire-pour-les-tampons-avec-texte-geometrique-doux",
    shapes: "fiches-a-onglets-coins-coupes-tampons-et-pastilles-de-categorie",
    motion: "fiches-qui-se-reclassent-en-glissant-carte-dont-les-epingles-pulsent-et-onglets-qui-s-ouvrent",
    rhythm: "bandes-vert-de-gris-et-papier-crème-separees-par-lignes-de-cahier",
    signature: "repertoire-filtrable-par-categorie-commune-et-mot-avec-carte-schematique-cliquable-et-tri",
    palette: "vert-de-gris-pale-papier-creme-bleu-d-encre-et-onglets-pastel",
    image: "carte-schematique-vectorielle-et-onglets-de-couleur-sans-photographie",
    list: "fiches-cartonnees-tableau-dense-ou-annuaire-en-deux-colonnes-a-points-de-conduite",
    article: "dossier-a-onglet-avec-presentation-a-gauche-et-coordonnees-a-droite",
    sidebar: "coordonnees-et-signalement-d-erreur-colles-a-droite",
    reading: "geometrique-doux-seize-pixels-fiches-de-soixante-signes-et-tableau-d-horaires",
  },
  tokens: {
    colors: { primary: "#26408b", secondary: "#1d2a3a", accent: "#f08a24", background: "#e4eee9", surface: "#fffef9", text: "#1d2a3a", muted: "#4a5868", success: "#1f7a4a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.league-gothic", body: "font.gantari", button: "font.special-elite", link: "font.gantari" },
    radius: { sm: 2, md: 4, lg: 8, button: 3, field: 3, card: 4 }, shadow: { card: "2px 3px 0 #1d2a3a", button: "none" }, border: { width: 2, color: "#1d2a3a" },
    type: { h1: { size: 72, weight: 400, lineHeight: 0.98, transform: "uppercase" }, h2: { size: 44, weight: 400, lineHeight: 1.0, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Orange des tampons et boutons", type: "color", default: "#f08a24" },
    { key: "entete", label: "En-tête", type: "choice", default: "etiquette", choices: [["etiquette", "Étiquette de tiroir et menu en onglets"], ["bandeau", "Bandeau bleu d'encre"], ["simple", "Simple : marque et menu replié"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "tiroir", choices: [["tiroir", "Tiroir : étiquette et colonnes"], ["ligne", "Ligne : mentions seulement"]] },
    { key: "liste", label: "Présentation des fiches", type: "choice", default: "fiches", choices: [["fiches", "Fiches cartonnées en grille"], ["tableau", "Tableau dense"], ["annuaire", "Annuaire : deux colonnes à points de conduite"]] },
    { key: "dossier", label: "Page de fiche", type: "choice", default: "carte", choices: [["carte", "Carte : fiche lignée à onglet"], ["dossier", "Dossier : papier uni, coordonnées en tête"]] },
    { key: "lignes", label: "Lignes de cahier sur les fiches", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
  ],
  menu: [["Accueil", "/"], ["Répertoire", "/repertoire"], ["Catégories", "/categories"], ["Proposer une fiche", "/proposer"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "repertoire", name: "Répertoire (liste filtrable)", render: repertoire }, { key: "categories", name: "Catégories", render: categories },
    { key: "fiche", name: "Fiche d'établissement", render: fiche }, { key: "proposer", name: "Proposer une fiche", render: proposer }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: (c) => wrapLegal(c, common.mentions()) }, { key: "confidentialite", name: "Confidentialité", render: (c) => wrapLegal(c, common.confidentialite()) }, { key: "blocs", name: "Blocs de contenu", render: (c) => wrapLegal(c, common.blocs()) },
  ],
};
