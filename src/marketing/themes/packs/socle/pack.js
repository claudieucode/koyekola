// Socle — corporate, grande entreprise. Direction artistique : l'institutionnel sobre d'un groupe industriel (« Hautvalle », fictif). Pierre claire, graphite, un seul accent cuivre ;
// filets fins, chiffres tabulaires, blocs carrés à gradins. Signature : chiffres clés avec sélecteur d'exercice (2022-2024, recalcul réel côté navigateur) et carte d'implantations en
// cartogramme de régions qui filtre le tableau des sites. Tout est démonstration : groupe, chiffres, sites, dirigeants et offres sont fictifs.
const { sec, esc, nav } = require("../kit");

const Y = {
  2022: { ca: 4120, rop: 410, eff: 14200, inv: 380, co2: 88, pays: 17 },
  2023: { ca: 4580, rop: 468, eff: 15100, inv: 420, co2: 81, pays: 18 },
  2024: { ca: 4870, rop: 512, eff: 15900, inv: 455, co2: 74, pays: 19 },
};
const REG = { fr: "France", eo: "Europe de l'Ouest", ee: "Europe centrale", af: "Afrique", am: "Amériques", as: "Asie" };
// [ville, pays, région, type, effectif]
const SITES = [
  ["Lyon", "France", "fr", "Siège", 1250], ["Grenoble", "France", "fr", "Recherche", 640], ["Dunkerque", "France", "fr", "Usine", 910], ["Nantes", "France", "fr", "Bureau", 220],
  ["Rotterdam", "Pays-Bas", "eo", "Usine", 780], ["Milan", "Italie", "eo", "Bureau", 310], ["Madrid", "Espagne", "eo", "Bureau", 260],
  ["Katowice", "Pologne", "ee", "Usine", 1120], ["Brno", "République tchèque", "ee", "Recherche", 430],
  ["Casablanca", "Maroc", "af", "Usine", 870], ["Abidjan", "Côte d'Ivoire", "af", "Bureau", 180],
  ["Montréal", "Canada", "am", "Recherche", 390], ["Monterrey", "Mexique", "am", "Usine", 1010],
  ["Singapour", "Singapour", "as", "Bureau", 270], ["Pune", "Inde", "as", "Usine", 1340],
];
const METIERS = [
  ["reseaux", "Réseaux et énergie", "Postes de transformation, câbles et pilotage des réseaux électriques pour les gestionnaires publics et privés.", "38 % du chiffre d'affaires"],
  ["infra", "Infrastructures", "Ouvrages d'art, tunnels et plateformes logistiques, de l'étude à l'exploitation.", "27 % du chiffre d'affaires"],
  ["materiaux", "Matériaux", "Ciments bas carbone, granulats recyclés et bétons préfabriqués pour la construction.", "21 % du chiffre d'affaires"],
  ["services", "Services urbains", "Maintenance, exploitation et gestion de l'énergie des bâtiments et des quartiers.", "14 % du chiffre d'affaires"],
];
const NEWS = [
  ["2026-10-22", "Résultats", "Résultats du troisième trimestre : un chiffre d'affaires en hausse de 6 %", "Hautvalle publie des ventes de 1,24 milliard d'euros sur le trimestre, portées par les réseaux d'énergie et les services urbains."],
  ["2026-10-08", "Innovation", "Un ciment à 40 % de CO₂ en moins validé sur un chantier pilote", "Le centre de recherche de Grenoble et l'usine de Dunkerque ont coulé 3 000 m³ de béton bas carbone pour une plateforme logistique."],
  ["2026-09-24", "Communiqué", "Hautvalle acquiert un spécialiste du câblage sous-marin", "L'opération, soumise aux autorités de la concurrence, renforce l'offre réseaux en Europe du Nord."],
  ["2026-09-10", "Ressources humaines", "1 200 recrutements prévus en 2027, dont 300 apprentis", "Le groupe ouvre ses campagnes de recrutement dans douze pays et double ses places d'alternance."],
  ["2026-07-16", "Résultats", "Résultats semestriels : marge opérationnelle de 10,6 %", "Le résultat opérationnel progresse de 9 %, malgré un coût des matières premières encore élevé."],
  ["2026-06-30", "Engagements", "Publication du rapport de durabilité 2025", "Le groupe détaille la baisse de 26 % de ses émissions depuis 2019 et ses objectifs 2030."],
  ["2026-05-19", "Innovation", "Ouverture d'un laboratoire de jumeaux numériques à Montréal", "Quarante ingénieurs y simulent le comportement de réseaux électriques complets avant leur déploiement."],
  ["2026-04-02", "Communiqué", "Assemblée générale : toutes les résolutions adoptées", "Le dividende de 1,85 euro par action est approuvé. Deux nouvelles administratrices rejoignent le conseil."],
];
const MON = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MON[m - 1]} ${y}`; };
const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const CATS = [...new Set(NEWS.map((n) => n[1]))];
const catKey = (c) => c.toLowerCase().replace(/[^a-z]/g, "");

const logo = `<svg class="so-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M2 30V22h8v-8h8V6h12v24z" fill="currentColor"/><path d="M10 30v-8M18 30V14" stroke="#fff" stroke-width="1.5" fill="none"/></svg>`;
const header = (c) => `<header class="so-head pk-bleed">
<div class="so-util"><div class="so-wrap so-util-in"><span>Groupe industriel · 19 pays · 15 900 collaborateurs</span><span class="so-util-r"><a href="/recherche">Rechercher</a><a href="/actualites">Espace presse</a></span></div></div>
<div class="so-bar"><div class="so-wrap so-bar-in"><a class="so-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logo}<span class="so-logo-t">${esc(c.brand)}</span></a>
<div class="so-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div><a class="so-cta" href="/contact">Nous contacter</a>
<details class="so-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="so-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a href="/recherche">Rechercher</a></div></details></div></div></header>`;

const footer = (c) => `<footer class="so-foot pk-bleed"><div class="so-wrap so-foot-in">
<div class="so-foot-b"><div class="so-foot-logo">${logo}<span>${esc(c.brand)}</span></div><p>Groupe industriel fictif d'énergie, d'infrastructures et de matériaux. Ce site est une démonstration : toutes les données sont inventées.</p></div>
<div class="so-foot-c"><h2>Le groupe</h2><a href="/groupe">Gouvernance</a><a href="/activites">Activités</a><a href="/chiffres">Chiffres clés</a><a href="/implantations">Implantations</a></div>
<div class="so-foot-c"><h2>Publications</h2><a href="/actualites">Actualités</a><a href="/actualite">Dernier communiqué</a><a href="/recherche">Recherche</a></div>
<div class="so-foot-c"><h2>Informations</h2><a href="/contact">Contact</a><a href="/mentions">Mentions légales</a><a href="/confidentialite">Confidentialité</a><a href="/blocs">Éléments de page</a></div></div>
<p class="so-legal">© ${esc(c.brand)} — site de démonstration. Société, chiffres, sites et personnes sont fictifs.</p></footer>`;

const pagehead = (kick, title, sub, crumb) => sec(`<section class="so-ph pk-bleed"><div class="so-wrap so-ph-in"><div><p class="so-crumb"><a href="/">Accueil</a> <span aria-hidden="true">›</span> ${esc(crumb || kick)}</p><p class="so-kick">${esc(kick)}</p><div class="so-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="so-lead">${esc(sub)}</p>` : ""}</div><div class="so-ph-art" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div></section>`);

const kpis = (y, id) => `<dl class="so-kpis" data-kpis>${[["ca", "Chiffre d'affaires", "M€"], ["rop", "Résultat opérationnel", "M€"], ["eff", "Collaborateurs", ""], ["inv", "Investissements", "M€"], ["co2", "Émissions (base 100 en 2019)", ""], ["pays", "Pays d'implantation", ""]].map(([k, l, u]) => `<div class="so-kpi"><dt>${l}</dt><dd><b data-k="${k}">${nf(Y[y][k])}</b> <span>${u}</span></dd></div>`).join("")}</dl>`;
const yearTabs = () => `<div class="so-years" role="group" aria-label="Exercice">${[2022, 2023, 2024].map((y) => `<a class="so-year${y === 2024 ? " is-on" : ""}" href="#exercice-${y}" role="button" data-y="${y}" aria-pressed="${y === 2024}">${y}</a>`).join("")}</div>`;
const siteRows = () => SITES.map((s) => `<tr data-reg="${s[2]}"><th scope="row">${esc(s[0])}</th><td>${esc(s[1])}</td><td>${s[3]}</td><td class="so-num">${nf(s[4])}</td></tr>`).join("");
const cartogram = () => `<div class="so-carto" role="group" aria-label="Régions du monde">${Object.entries(REG).map(([k, n]) => `<a class="so-tile so-tile--${k}" href="#region-${k}" role="button" data-r="${k}" aria-pressed="false"><b>${esc(n)}</b><span>${SITES.filter((s) => s[2] === k).length} sites · ${nf(SITES.filter((s) => s[2] === k).reduce((t, s) => t + s[4], 0))} pers.</span></a>`).join("")}</div>`;
const newsCard = (n, i) => `<article class="so-news" data-cat="${catKey(n[1])}"><a href="/actualite"><p class="so-news-m"><time datetime="${n[0]}">${dfr(n[0])}</time><span class="so-tag">${esc(n[1])}</span></p><h3 class="so-news-t">${esc(n[2])}</h3><p class="so-news-x">${esc(n[3])}</p><span class="so-arrow" aria-hidden="true">→</span></a></article>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="so-hero pk-bleed"><div class="so-wrap so-hero-in"><div class="so-hero-t"><p class="so-kick">Énergie · Infrastructures · Matériaux</p><div class="so-h1" role="heading" aria-level="1">Bâtir les fondations d'un monde plus sobre.</div><p class="so-lead">Depuis 1947, ${esc(c.brand)} construit les réseaux, les ouvrages et les matériaux dont dépendent les villes. 15 900 collaborateurs dans 19 pays.</p><p><a class="so-btn" href="/activites">Nos activités</a> <a class="so-btn so-btn--o" href="/chiffres">Chiffres clés 2024</a></p></div>
<div class="so-hero-art" aria-hidden="true"><svg viewBox="0 0 420 320"><rect width="420" height="320" fill="#e6e4dc"/><g fill="#2b2f33"><rect x="30" y="200" width="70" height="90"/><rect x="100" y="150" width="70" height="140" opacity=".85"/><rect x="170" y="100" width="70" height="190" opacity=".7"/><rect x="240" y="60" width="70" height="230" opacity=".55"/><rect x="310" y="20" width="70" height="270" opacity=".4"/></g><rect x="30" y="290" width="350" height="8" fill="#b4531a"/></svg></div></div></section>`),
  sec(`<section class="so-s pk-bleed"><div class="so-wrap"><div class="so-sh"><h2 class="so-h2">Chiffres clés 2024</h2><a class="so-more" href="/chiffres">Tous les chiffres →</a></div>${kpis(2024)}</div></section>`),
  sec(`<section class="so-s so-s--t pk-bleed"><div class="so-wrap"><div class="so-sh"><h2 class="so-h2">Quatre métiers</h2><a class="so-more" href="/activites">Détail des activités →</a></div><div class="so-met">${METIERS.map((m, i) => `<article class="so-m"><span class="so-m-n" aria-hidden="true">0${i + 1}</span><h3 class="so-h3">${esc(m[1])}</h3><p>${esc(m[2])}</p><p class="so-m-p">${esc(m[3])}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="so-s pk-bleed"><div class="so-wrap so-2"><div><h2 class="so-h2">Implantations</h2><p class="so-lead">Quinze sites sur six régions : usines, centres de recherche et bureaux commerciaux.</p><p><a class="so-btn so-btn--o" href="/implantations">Voir la carte des sites</a></p></div>${cartogram()}</div></section>`),
  sec(`<section class="so-s so-s--t pk-bleed"><div class="so-wrap"><div class="so-sh"><h2 class="so-h2">Dernières actualités</h2><a class="so-more" href="/actualites">Toutes les actualités →</a></div><div class="so-nl so-nl--c">${NEWS.slice(0, 3).map(newsCard).join("")}</div></div></section>`),
  sec(`<section class="so-band pk-bleed"><div class="so-wrap so-band-in"><p>Rejoignez 1 200 nouveaux collaborateurs en 2027 : ingénieurs, techniciens, apprentis.</p><a class="so-btn so-btn--l" href="/contact">Déposer une candidature</a></div></section>`),
  sec(footer(c)),
];

const groupe = (c) => [
  sec(header(c)),
  pagehead("Le groupe", "Un groupe, des repères", "Histoire, valeurs et gouvernance de Hautvalle.", "Le groupe"),
  sec(`<section class="so-s pk-bleed"><div class="so-wrap so-side"><div class="so-toc" role="navigation" aria-label="Sommaire de la page"><p class="so-lab">Sur cette page</p><a href="#histoire">Histoire</a><a href="#valeurs">Valeurs</a><a href="#gouvernance">Gouvernance</a></div>
<div class="so-prose"><h2 data-sec="histoire">Histoire</h2><p>Fondé en 1947 à Lyon comme fabricant de câbles, le groupe s'est étendu aux postes de transformation dans les années 1970, puis aux infrastructures et aux matériaux. Il est coté depuis 1998 et compte aujourd'hui 15 900 collaborateurs.</p>
<ol class="so-tl"><li><b>1947</b> Création de l'atelier de câblage de Lyon.</li><li><b>1976</b> Premier poste de transformation exporté.</li><li><b>1998</b> Introduction en Bourse.</li><li><b>2012</b> Entrée dans les matériaux de construction.</li><li><b>2021</b> Plan « Sobriété 2030 » : moins 50 % d'émissions.</li></ol>
<h2 data-sec="valeurs">Valeurs</h2><div class="so-vals"><div><h3>Rigueur</h3><p>Des ouvrages qui durent soixante ans exigent des méthodes fiables.</p></div><div><h3>Sécurité</h3><p>Aucun chantier ne vaut un accident. Objectif : zéro blessure grave.</p></div><div><h3>Sobriété</h3><p>Moins de matière, moins d'énergie, plus de durée de vie.</p></div></div>
<h2 data-sec="gouvernance">Gouvernance</h2><p>Le conseil d'administration compte neuf membres, dont cinq indépendants et quatre femmes. Il se réunit au moins six fois par an.</p>
<div class="so-scroll" data-scroll><table><caption>Conseil d'administration (membres fictifs)</caption><thead><tr><th scope="col">Nom</th><th scope="col">Fonction</th><th scope="col">Depuis</th></tr></thead><tbody><tr><th scope="row">Marianne Delcourt</th><td>Présidente</td><td>2019</td></tr><tr><th scope="row">Olivier Brenner</th><td>Directeur général</td><td>2021</td></tr><tr><th scope="row">Sophie Arnaud</th><td>Administratrice indépendante, présidente du comité d'audit</td><td>2020</td></tr><tr><th scope="row">Karim Haddad</th><td>Administrateur indépendant</td><td>2022</td></tr><tr><th scope="row">Ingrid Solberg</th><td>Administratrice indépendante</td><td>2024</td></tr></tbody></table></div></div></div></section>`),
  sec(footer(c)),
];

const activites = (c) => [
  sec(header(c)),
  pagehead("Activités", "Quatre métiers complémentaires", "Chaque métier s'appuie sur les mêmes bureaux d'études et le même réseau d'usines.", "Activités"),
  ...METIERS.map((m, i) => sec(`<section class="so-act ${i % 2 ? "so-act--r" : ""} pk-bleed"><div class="so-wrap so-act-in"><div class="so-act-art" aria-hidden="true"><svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#e6e4dc"/>${[0, 1, 2, 3].map((k) => `<rect x="${30 + k * 62}" y="${150 - (k + i + 1) * 20}" width="48" height="${(k + i + 1) * 20 + 30}" fill="#2b2f33" opacity="${0.9 - k * 0.15}"/>`).join("")}<rect x="20" y="180" width="260" height="6" fill="#b4531a"/></svg></div><div><p class="so-kick">0${i + 1} · ${esc(m[3])}</p><h2 class="so-h2">${esc(m[1])}</h2><p class="so-lead">${esc(m[2])}</p><ul class="so-ticks"><li>Études et ingénierie</li><li>Fabrication et déploiement</li><li>Exploitation et maintenance</li></ul></div></div></section>`)),
  sec(footer(c)),
];

const chiffres = (c) => [
  sec(header(c)),
  pagehead("Investisseurs", "Chiffres clés", "Trois exercices, six indicateurs. Choisissez l'année : les valeurs et les variations se recalculent.", "Chiffres clés"),
  sec(`<section class="so-s pk-bleed" data-fin><div class="so-wrap"><div class="so-sh"><h2 class="so-h2">Exercice <span data-ylabel>2024</span></h2>${yearTabs()}</div>${kpis(2024)}
<p class="so-var" role="status" data-var>Variation par rapport à 2023 : chiffre d'affaires +6,3 %, résultat opérationnel +9,4 %.</p>
<div class="so-bars" aria-label="Évolution du chiffre d'affaires">${[2022, 2023, 2024].map((y) => `<div class="so-bar-c" data-y="${y}"><span class="so-bar-v">${nf(Y[y].ca)} M€</span><i class="so-bh${Math.round(Y[y].ca / 4870 * 100)}"></i><b>${y}</b></div>`).join("")}</div></div></section>`),
  sec(`<section class="so-s so-s--t pk-bleed"><div class="so-wrap so-2"><div><h2 class="so-h2">Calendrier financier</h2><ul class="so-cal"><li><time datetime="2027-02-18">18 février 2027</time><span>Résultats annuels 2026</span></li><li><time datetime="2027-04-22">22 avril 2027</time><span>Chiffre d'affaires du premier trimestre</span></li><li><time datetime="2027-05-20">20 mai 2027</time><span>Assemblée générale</span></li></ul></div><div><h2 class="so-h2">Documents</h2><ul class="so-docs"><li><span>Document d'enregistrement universel 2025</span><small>PDF · 4,2 Mo (exemple)</small></li><li><span>Rapport de durabilité 2025</span><small>PDF · 2,8 Mo (exemple)</small></li></ul><p class="so-fine">Documents d'exemple : aucun fichier n'est joint à la démonstration.</p></div></div></section>`),
  sec(footer(c)),
];

const implantations = (c) => [
  sec(header(c)),
  pagehead("Implantations", "Quinze sites, six régions", "Cliquez sur une région pour filtrer la liste des sites.", "Implantations"),
  sec(`<section class="so-s pk-bleed" data-sites><div class="so-wrap so-2 so-2--map">${cartogram()}<div><p class="so-count" role="status"><b data-n>15</b> site(s) affiché(s) · <a href="#region-all" data-reset>Toutes les régions</a></p><div class="so-scroll" data-scroll><table class="so-tab"><caption>Sites du groupe</caption><thead><tr><th scope="col">Ville</th><th scope="col">Pays</th><th scope="col">Type</th><th scope="col" class="so-num">Effectif</th></tr></thead><tbody>${siteRows()}</tbody></table></div></div></div></section>`),
  sec(footer(c)),
];

const actualites = (c) => [
  sec(header(c)),
  pagehead("Espace presse", "Actualités du groupe", "Communiqués, résultats et annonces. Filtrez par type.", "Actualités"),
  sec(`<section class="so-s pk-bleed" data-news><div class="so-wrap"><div class="so-chips" role="group" aria-label="Type d'actualité"><a class="so-chip is-on" href="#type-all" role="button" data-v="all" aria-pressed="true">Toutes</a>${CATS.map((k) => `<a class="so-chip" href="#type-${catKey(k)}" role="button" data-v="${catKey(k)}" aria-pressed="false">${esc(k)}</a>`).join("")}</div><div class="so-nl" data-grid>${NEWS.map(newsCard).join("")}</div><p class="so-empty" data-empty>Aucune actualité de ce type.</p></div></section>`),
  sec(footer(c)),
];

const actualite = (c) => [
  sec(header(c)),
  pagehead("Résultats", NEWS[0][2], NEWS[0][3], "Actualités"),
  sec(`<section class="so-s pk-bleed"><div class="so-wrap so-side"><div class="so-toc" role="navigation" aria-label="Sommaire"><p class="so-lab">Publié le</p><p><time datetime="${NEWS[0][0]}">${dfr(NEWS[0][0])}</time></p><p class="so-lab">Contact presse</p><p>Service presse<br><a href="mailto:presse@hautvalle.example">presse@hautvalle.example</a></p><p class="so-lab">Partager</p><a href="#copier" role="button" data-copy-link>Copier le lien</a></div>
<div class="so-prose"><p>Hautvalle publie des ventes de 1,24 milliard d'euros pour le troisième trimestre 2026, en hausse de 6 % à périmètre comparable. Cette progression est portée par l'activité réseaux et énergie, qui bénéficie des programmes de renforcement des réseaux de distribution en Europe et en Amérique du Nord.</p>
<h2>Les points marquants</h2><ul><li>Réseaux et énergie : +9 %, avec trois nouveaux contrats-cadres signés.</li><li>Infrastructures : +3 %, dans un marché de la construction stable.</li><li>Matériaux : +2 %, la hausse des volumes compensant des prix en baisse.</li><li>Services urbains : +8 %, grâce aux contrats de gestion d'énergie.</li></ul>
<blockquote class="so-quote"><p>« Le trimestre confirme la solidité de notre carnet de commandes et la pertinence de notre plan de sobriété. »</p><cite>Olivier Brenner, directeur général (propos fictifs)</cite></blockquote>
<h2>Perspectives</h2><p>Le groupe confirme ses objectifs annuels : un chiffre d'affaires supérieur à 4,8 milliards d'euros et une marge opérationnelle comprise entre 10 % et 11 %. Les résultats annuels seront publiés le 18 février 2027.</p>
<p><a class="so-btn" href="/chiffres">Voir les chiffres clés</a> <a class="so-btn so-btn--o" href="/actualites">Toutes les actualités</a></p></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Nous contacter", "Une question commerciale, une candidature, une demande de presse : indiquez le sujet pour que votre message arrive au bon service.", "Contact"),
  { type: "form", heading: "Votre message", intro: "La démonstration n'envoie rien à une vraie société, mais le formulaire fonctionne comme sur un vrai site." },
  sec(`<section class="so-s so-s--t pk-bleed"><div class="so-wrap so-3"><div><h2 class="so-h3">Commercial</h2><p>Un chargé d'affaires vous répond sous deux jours ouvrés.</p></div><div><h2 class="so-h3">Presse</h2><p><a href="mailto:presse@hautvalle.example">presse@hautvalle.example</a><br>Réponse le jour même en semaine.</p></div><div><h2 class="so-h3">Siège (fictif)</h2><address>Hautvalle, 8 quai des Industries<br>69007 Lyon</address></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Rechercher sur le site", "Un mot, un site, un communiqué.", "Recherche"),
  { type: "layout", children: [{ type: "search", props: { target: "catalogue", placeholder: "Rechercher…" } }] },
  sec(`<section class="so-s pk-bleed"><div class="so-wrap"><div class="so-nores"><h2 class="so-h3">Aucun résultat ?</h2><p>Essayez un terme plus général, ou accédez directement à une rubrique.</p><ul class="so-ticks"><li><a href="/activites">Nos activités</a></li><li><a href="/implantations">Nos implantations</a></li><li><a href="/actualites">Les actualités</a></li><li><a href="/contact">Écrire au groupe</a></li></ul></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="so-404 pk-bleed"><div class="so-wrap so-404-in"><div class="so-404-n" aria-hidden="true">404</div><div><p class="so-kick">Page introuvable</p><div class="so-h1" role="heading" aria-level="1">Cet étage n'existe pas.</div><p class="so-lead">L'adresse est erronée ou la page a été déplacée. Reprenez depuis l'accueil ou consultez le plan des rubriques.</p><p><a class="so-btn" href="/">Accueil</a> <a class="so-btn so-btn--o" href="/recherche">Rechercher</a></p><ul class="so-ticks"><li><a href="/groupe">Le groupe</a></li><li><a href="/activites">Activités</a></li><li><a href="/chiffres">Chiffres clés</a></li><li><a href="/contact">Contact</a></li></ul></div></div></section>`),
  sec(footer(c)),
];
const legal = (title, crumb, html) => (c) => [sec(header(c)), pagehead("Informations légales", title, "", crumb), sec(`<section class="so-s pk-bleed"><div class="so-wrap"><div class="so-prose">${html}</div></div></section>`), sec(footer(c))];
const mentions = legal("Mentions légales", "Mentions légales", `<h2>Éditeur</h2><p>Ce site est une démonstration du thème « Socle ». Aucune société réelle ne l'exploite. Remplacez ces mentions par la dénomination, la forme juridique, le capital, le siège, le numéro d'immatriculation et le directeur de la publication de votre entreprise.</p><h2>Hébergement</h2><p>Indiquez le nom et l'adresse de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les marques, textes et chiffres de cette démonstration sont fictifs.</p><h2>Contact</h2><p>Utilisez la <a href="/contact">page de contact</a>.</p>`);
const confidentialite = legal("Politique de confidentialité", "Confidentialité", `<h2>Données traitées</h2><p>Le formulaire de contact traite votre nom, votre adresse électronique et votre message pour répondre à votre demande. Dans cette démonstration, rien n'est transmis à un tiers.</p><h2>Traceurs</h2><p>Le thème n'ajoute aucun traceur. Le choix de l'exercice et des filtres reste dans la page.</p><h2>Vos droits</h2><p>Accès, rectification, suppression, opposition : écrivez depuis la <a href="/contact">page de contact</a>.</p><h2>Durée</h2><p>Les messages sont conservés douze mois au plus (exemple à adapter).</p>`);
const blocs = (c) => [
  sec(header(c)),
  pagehead("Guide de mise en page", "Éléments de mise en page", "Titres, listes, citations, tableaux, code, boutons et colonnes du thème.", "Éléments"),
  sec(`<section class="so-s pk-bleed"><div class="so-wrap"><div class="so-prose">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec un <a href="/groupe">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, du <mark>surligné</mark> et du <code>code en ligne</code>. La ligne reste entre soixante et quatre-vingts caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li><li>Troisième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote class="so-quote"><p>« Une citation institutionnelle, sobre et lisible. »</p><cite>Direction générale (fictive)</cite></blockquote>
<figure class="so-fig"><svg viewBox="0 0 600 220" role="img" aria-label="Gradins gris et filet cuivré"><rect width="600" height="220" fill="#e6e4dc"/><g fill="#2b2f33"><rect x="40" y="130" width="100" height="70"/><rect x="140" y="100" width="100" height="100" opacity=".8"/><rect x="240" y="70" width="100" height="130" opacity=".6"/><rect x="340" y="40" width="100" height="160" opacity=".45"/></g><rect x="40" y="200" width="400" height="6" fill="#b4531a"/></svg><figcaption>Une image avec sa légende.</figcaption></figure>
<div class="so-scroll" data-scroll><table><caption>Chiffres par exercice</caption><thead><tr><th scope="col">Exercice</th><th scope="col" class="so-num">Chiffre d'affaires (M€)</th><th scope="col" class="so-num">Résultat op. (M€)</th><th scope="col" class="so-num">Effectif</th></tr></thead><tbody>${[2022, 2023, 2024].map((y) => `<tr><th scope="row">${y}</th><td class="so-num">${nf(Y[y].ca)}</td><td class="so-num">${nf(Y[y].rop)}</td><td class="so-num">${nf(Y[y].eff)}</td></tr>`).join("")}</tbody></table></div>
<pre><code>indicateur = chiffre_affaires / effectif</code></pre>
<p><a class="so-btn" href="/contact">Bouton plein</a> <a class="so-btn so-btn--o" href="/chiffres">Bouton contour</a></p>
<div class="so-vals"><div><h3>Colonne un</h3><p>Trois colonnes sur grand écran.</p></div><div><h3>Colonne deux</h3><p>Deux sur tablette.</p></div><div><h3>Colonne trois</h3><p>Une sur mobile.</p></div></div>
<aside class="so-box"><p class="so-lab">Encadré</p><p>Une information importante, détachée du texte courant.</p></aside></div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "socle", name: "Socle", version: "1.0.0", category: "services", tags: ["classique", "moderne"], siteType: "Corporate / grande entreprise", collection: "pro",
  concept: "Le site institutionnel d'un groupe industriel : pierre et graphite, un accent cuivre, filets fins, chiffres clés recalculables par exercice, cartogramme d'implantations et gouvernance.",
  description: "Site corporate sobre : chiffres clés par exercice, implantations par région, métiers, gouvernance, actualités filtrables et espace presse, en pierre claire, graphite et cuivre.",
  brand: "Hautvalle", modules: ["formulaires", "recherche"],
  dna: {
    hero: "titre-institutionnel-a-gauche-et-gradins-de-pierre-dessines-a-droite",
    header: "barre-utilitaire-fine-puis-barre-principale-avec-bouton-contact-cuivre",
    grid: "douze-colonnes-rigides-bandes-pleine-largeur-separees-par-filets-d-un-pixel",
    typo: "ibm-plex-serif-et-ibm-plex-sans-chiffres-tabulaires",
    shapes: "angles-droits-filets-fins-et-blocs-carres-a-gradins",
    motion: "compteurs-qui-se-recalculent-au-changement-d-exercice-sans-mouvement-decoratif",
    rhythm: "bandes-alternees-pierre-et-blanc-avec-bandeau-graphite-d-appel",
    signature: "chiffres-cles-par-exercice-recalcules-et-cartogramme-de-regions-filtrant-le-tableau-des-sites",
    palette: "pierre-claire-graphite-et-accent-cuivre-unique",
    image: "gradins-geometriques-en-svg-gris-avec-filet-cuivre",
    list: "tableau-cartes-ou-colonnes-a-filets-au-choix",
    article: "sommaire-lateral-collant-a-gauche-et-colonne-de-lecture-a-droite",
    sidebar: "sommaire-et-contact-presse-a-gauche-du-communique",
    reading: "colonne-de-70-caracteres-sans-serif-17-px-interligne-1-65",
  },
  tokens: {
    colors: { primary: "#222831", secondary: "#2b2f33", accent: "#b4531a", background: "#f3f2ee", surface: "#ffffff", text: "#1d2024", muted: "#555a60", success: "#2b7a3b", warning: "#8a5a00", error: "#b42318" },
    fonts: { heading: "font.ibm-plex-serif", body: "font.ibm-plex-sans", button: "font.ibm-plex-sans", link: "font.ibm-plex-sans" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#c9c7bd" },
    type: { h1: { size: 52, weight: 600, lineHeight: 1.1, transform: "none" }, h2: { size: 32, weight: 600, lineHeight: 1.2, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Accent (boutons, filets)", type: "color", default: "#b4531a" },
    { key: "entete", label: "En-tête", type: "choice", default: "double", choices: [["double", "Barre utilitaire et barre principale"], ["simple", "Barre unique collante"], ["centre", "Logo centré, menu dessous"]] },
    { key: "liste", label: "Liste des actualités", type: "choice", default: "tableau", choices: [["tableau", "Tableau à lignes"], ["cartes", "Cartes en grille"], ["colonnes", "Colonnes à filets"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "grand", choices: [["grand", "Quatre colonnes"], ["compact", "Compact sur une ligne"]] },
    { key: "page", label: "Pages intérieures", type: "choice", default: "sommaire", choices: [["sommaire", "Sommaire latéral"], ["large", "Pleine largeur sans sommaire"]] },
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "clair", choices: [["clair", "Pierre claire"], ["sombre", "Graphite sombre"]] },
  ],
  menu: [["Accueil", "/"], ["Le groupe", "/groupe"], ["Activités", "/activites"], ["Chiffres clés", "/chiffres"], ["Implantations", "/implantations"], ["Actualités", "/actualites"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "groupe", name: "Le groupe et la gouvernance", render: groupe }, { key: "activites", name: "Activités", render: activites },
    { key: "chiffres", name: "Chiffres clés", render: chiffres }, { key: "implantations", name: "Implantations", render: implantations }, { key: "actualites", name: "Actualités", render: actualites },
    { key: "actualite", name: "Communiqué", render: actualite }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche },
    { key: "introuvable", name: "Page introuvable", render: introuvable }, { key: "mentions", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite },
    { key: "blocs", name: "Éléments de mise en page", render: blocs },
  ],
};
