// Atelier Nord — agence créative et studio de design. Direction artistique : collage brutaliste coloré. Fond lilas, aplats lime / rose / bleu électrique, bordures noires épaisses,
// ombres dures, autocollants qui tournent, mots géants, projets en tuiles filtrables, curseur-étiquette, bandeau défilant de disciplines.
const { sec, esc, nav } = require("../kit");

const C = { ink: "#141414", lime: "#c6f432", pink: "#ff3d81", blue: "#3a3cff", lilac: "#e9e2ff", sun: "#ffc21a", white: "#ffffff" };
const bg = (c) => `<rect x="-200" y="-200" width="800" height="700" fill="${c}"/>`;
const svg = (inner) => `<svg viewBox="0 0 400 300" role="img" aria-hidden="true" focusable="false">${inner}</svg>`;
const COVERS = [
  () => svg(bg(C.blue) + `<circle cx="140" cy="150" r="96" fill="${C.lime}"/><path d="M200 300V150a70 70 0 0 1 140 0v150z" fill="${C.pink}"/><path d="M236 300V160a34 34 0 0 1 68 0v140z" fill="${C.white}"/><circle cx="140" cy="150" r="30" fill="${C.ink}"/>`),
  () => svg(bg(C.lime) + `<rect x="40" y="40" width="320" height="220" fill="${C.white}" stroke="${C.ink}" stroke-width="6"/><rect x="40" y="40" width="320" height="38" fill="${C.ink}"/><circle cx="60" cy="59" r="7" fill="${C.pink}"/><circle cx="82" cy="59" r="7" fill="${C.sun}"/><rect x="64" y="104" width="150" height="26" fill="${C.ink}"/><rect x="64" y="142" width="110" height="12" fill="${C.ink}" opacity=".5"/><rect x="236" y="100" width="100" height="130" fill="${C.pink}" stroke="${C.ink}" stroke-width="4"/><rect x="64" y="180" width="120" height="40" fill="${C.blue}"/>`),
  () => svg(bg(C.pink) + `<rect x="70" y="60" width="90" height="200" rx="22" fill="${C.ink}"/><rect x="82" y="100" width="66" height="70" fill="${C.lime}"/><rect x="180" y="90" width="90" height="170" rx="22" fill="${C.white}" stroke="${C.ink}" stroke-width="5"/><circle cx="225" cy="150" r="26" fill="${C.blue}"/><rect x="290" y="120" width="70" height="140" rx="20" fill="${C.sun}" stroke="${C.ink}" stroke-width="5"/>`),
  () => svg(bg(C.ink) + [20, 46, 72, 98, 124].map((r, i) => `<circle cx="200" cy="150" r="${r + 20}" fill="none" stroke="${i % 2 ? C.pink : C.lime}" stroke-width="${i % 2 ? 4 : 8}"/>`).join("") + `<polygon points="188,128 188,172 224,150" fill="${C.white}"/>`),
  () => svg(bg("#ffb3d1") + [0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="200" cy="80" rx="34" ry="70" fill="${a % 120 ? C.blue : C.pink}" stroke="${C.ink}" stroke-width="4" transform="rotate(${a} 200 150)"/>`).join("") + `<circle cx="200" cy="150" r="26" fill="${C.sun}" stroke="${C.ink}" stroke-width="5"/>`),
  () => svg(bg(C.sun) + `<circle cx="110" cy="190" r="68" fill="none" stroke="${C.ink}" stroke-width="12"/><circle cx="300" cy="190" r="68" fill="none" stroke="${C.ink}" stroke-width="12"/><path d="M110 190 170 90h110l20 100M170 90l40 100h90" fill="none" stroke="${C.pink}" stroke-width="12" stroke-linejoin="round"/><circle cx="110" cy="190" r="12" fill="${C.ink}"/><circle cx="300" cy="190" r="12" fill="${C.ink}"/>`),
  () => svg(bg(C.white) + [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${-20 + i * 62}" y="-20" width="34" height="340" fill="${[C.blue, C.pink, C.lime, C.ink][i % 4]}" transform="rotate(18 200 150)"/>`).join("") + `<circle cx="200" cy="150" r="52" fill="${C.sun}" stroke="${C.ink}" stroke-width="6"/>`),
  () => svg(bg(C.lilac) + Array.from({ length: 35 }, (_, i) => `<circle cx="${50 + (i % 7) * 50}" cy="${50 + Math.floor(i / 7) * 50}" r="${6 + ((i * 7) % 5) * 4}" fill="${[C.pink, C.blue, C.ink][i % 3]}"/>`).join("")),
];
const PROJECTS = [
  { n: "Maison Sève", cat: "identite", catL: "Identité", y: "2026", t: "Une maison de cosmétiques végétales qui change de peau.", i: 0 },
  { n: "Fanfare", cat: "web", catL: "Site web", y: "2026", t: "Le site d'un festival de rue, pensé comme un tract géant.", i: 1 },
  { n: "Brasserie Cobalt", cat: "packaging", catL: "Packaging", y: "2025", t: "Une gamme de bières artisanales qu'on reconnaît à dix mètres.", i: 2 },
  { n: "Radio Lumen", cat: "motion", catL: "Motion", y: "2025", t: "Habillage sonore et animé d'une radio de quartier.", i: 3 },
  { n: "Pétale", cat: "identite", catL: "Identité", y: "2025", t: "Un fleuriste qui livre à vélo, enfin une marque à sa hauteur.", i: 4 },
  { n: "Atlas Vélo", cat: "web", catL: "Site web", y: "2025", t: "Configurateur de vélos sur mesure, sans aucun jargon.", i: 5 },
  { n: "Nuage", cat: "packaging", catL: "Packaging", y: "2024", t: "Des emballages de thé qui racontent la météo.", i: 6 },
  { n: "Tamis", cat: "motion", catL: "Motion", y: "2024", t: "Film d'ouverture pour un cycle de conférences sur les données.", i: 7 },
];
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-7 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>`;
const star = (c, k = "") => `<svg class="at-star ${k}" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,0 61,19 82,10 80,32 100,38 85,54 98,72 76,76 74,98 54,88 38,100 33,78 10,82 18,60 0,48 20,38 14,16 36,20" fill="${c}" stroke="${C.ink}" stroke-width="4"/></svg>`;
const MENU_CTA = ["Parler d'un projet", "/contact"];

const header = (c) => `<header class="at-head pk-bleed">
  <a class="at-logo" href="/" aria-label="${esc(c.brand)} — accueil">${star(C.lime, "at-logo-star")}<span>atelier<b>nord</b></span></a>
  <div class="at-nav" role="navigation" aria-label="Navigation principale">${c.menu.map(({ label, url }, i) => `<a href="${esc(url)}"><i>0${i + 1}</i>${esc(label)}</a>`).join("")}</div>
  <a class="at-pill at-head-cta" href="${MENU_CTA[1]}">${MENU_CTA[0]}</a>
  <details class="at-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="at-drawer" role="navigation" aria-label="Menu mobile">${c.menu.map(({ label, url }, i) => `<a href="${esc(url)}"><i>0${i + 1}</i>${esc(label)}</a>`).join("")}<a class="at-pill" href="${MENU_CTA[1]}">${MENU_CTA[0]}</a></div></details></header>`;

const footer = (c) => `<footer class="at-foot pk-bleed"><div class="at-foot-top"><a class="at-foot-mail" href="mailto:bonjour@atelier-nord.example">Dites<br>bonjour ${arrow}</a>
  <div class="at-foot-cols"><div><h3>Explorer</h3>${c.menu.slice(1, 5).map(({ label, url }) => `<a href="${esc(url)}">${esc(label)}</a>`).join("")}</div>
  <div><h3>Studio</h3><a href="/process">Notre méthode</a><a href="/journal">Journal</a><a href="/contact">Contact</a><a href="/recherche">Recherche</a></div>
  <div><h3>Adresse</h3><address>Atelier Nord<br>27 rue des Cordiers<br>59800 Lille</address></div></div></div>
  <p class="at-legal">© Atelier Nord — site de démonstration. Agence, clients et projets fictifs.</p></footer>`;

const pagehead = (kicker, title, sub, color = "lime") => sec(`<section class="at-ph at-bg-${color} pk-bleed"><div class="at-wrap"><p class="at-kicker" data-reveal>${esc(kicker)}</p><div class="at-giant" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="at-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${star(C.pink, "at-ph-star")}</section>`);

const filters = `<div class="at-filters" role="tablist" aria-label="Filtrer les projets">${[["tout", "Tout", 8], ["identite", "Identité", 2], ["web", "Site web", 2], ["packaging", "Packaging", 2], ["motion", "Motion", 2]].map(([k, l, n], i) => `<a href="#${k}" role="tab" data-filter="${k}" ${i ? "" : "class=\"is-on\""}>${l}<sup>${n}</sup></a>`).join("")}</div>`;
const tile = (p, k = "") => `<a class="at-tile ${k}" href="/etude" data-cat="${p.cat}" data-cursor="Voir" data-reveal><span class="at-tile-art">${COVERS[p.i]()}</span><span class="at-tile-meta"><b>${esc(p.n)}</b><em>${esc(p.catL)} · ${p.y}</em></span><span class="at-tile-t">${esc(p.t)}</span></a>`;

const marquee = (words, k = "") => `<div class="at-marq ${k}" aria-hidden="true"><div class="at-marq-track">${[0, 1].map(() => words.map((w) => `<span>${esc(w)}</span><svg viewBox="0 0 24 24"><polygon points="12,0 15,9 24,12 15,15 12,24 9,15 0,12 9,9" fill="currentColor"/></svg>`).join("")).join("")}</div></div>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="at-hero pk-bleed"><div class="at-wrap at-hero-in">
    <div class="at-hero-copy"><p class="at-kicker" data-reveal>Agence créative · Lille · depuis 2014</p>
    <div class="at-mega" role="heading" aria-level="1"><span data-reveal>Nous dessinons</span><span data-reveal><em class="at-bub at-bub--a">des</em> marques</span><span data-reveal>qui font <em class="at-bub at-bub--b">du bruit</em></span></div>
    <p class="at-lead" data-reveal>Identité, sites, packaging et films : un studio de vingt personnes qui aime les idées franches, les couleurs qui piquent et les clients qui osent.</p>
    <div class="at-actions" data-reveal><a class="at-pill at-pill--lg" href="/projets">Voir les projets ${arrow}</a><a class="at-pill at-pill--line at-pill--lg" href="/studio">Le studio</a></div></div>
    <div class="at-collage" aria-hidden="true" data-parallax><div class="at-card at-card--1">${COVERS[0]()}</div><div class="at-card at-card--2">${COVERS[3]()}</div><div class="at-card at-card--3">${COVERS[5]()}</div>
      <div class="at-badge">${star(C.pink)}<span>Studio<br>indé-<br>pendant</span></div></div></div></section>`),
  sec(marquee(["Identité de marque", "Sites web", "Packaging", "Motion design", "Direction artistique", "Édition"], "at-marq--lime")),
  sec(`<section class="at-work pk-bleed"><div class="at-wrap"><div class="at-sechead"><h2 class="at-h2" data-reveal>Travaux<br>choisis</h2><a class="at-more" href="/projets">Tous les projets ${arrow}</a></div>
    <div class="at-bento">${tile(PROJECTS[0], "at-tile--w")}${tile(PROJECTS[1])}${tile(PROJECTS[2])}${tile(PROJECTS[3], "at-tile--w")}</div></div></section>`),
  sec(`<section class="at-svc at-bg-ink pk-bleed"><div class="at-wrap"><p class="at-kicker at-kicker--lime" data-reveal>Ce que nous faisons</p>
    <ul class="at-svc-list">${[["01", "Identité de marque", "Nom, logo, couleurs, voix : une marque entière.", "/services"], ["02", "Sites & produits", "Des sites rapides, lisibles, qui ont du caractère.", "/services"], ["03", "Packaging & édition", "Des objets qu'on a envie de garder sur l'étagère.", "/services"], ["04", "Motion & film", "De courts films qui racontent sans bavarder.", "/services"]].map(([n, t, d, u]) => `<li data-reveal><a href="${u}"><i>${n}</i><b>${t}</b><span>${d}</span>${arrow}</a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="at-nums pk-bleed"><ul class="at-nums-in">${[["120", "projets livrés", "pink"], ["11", "ans d'atelier", "lime"], ["20", "personnes au studio", "sun"], ["3", "mois pour une identité", "blue"]].map(([n, l, k]) => `<li class="at-n at-bg-${k}" data-reveal><b data-count="${n}">${n}</b><span>${l}</span></li>`).join("")}</ul></section>`),
  sec(`<section class="at-jr pk-bleed"><div class="at-wrap"><div class="at-sechead"><h2 class="at-h2" data-reveal>Journal</h2><a class="at-more" href="/journal">Tous les articles ${arrow}</a></div>
    <div class="at-jr-grid">${[["Choisir une couleur sans se disputer", "Méthode", "12 mars", "pink"], ["Pourquoi nous détestons le gris", "Opinion", "2 mars", "lime"], ["Cinq erreurs de packaging", "Pratique", "20 fév.", "sun"]].map(([t, g, d, k]) => `<a class="at-post at-bg-${k}" href="/journal" data-reveal><span class="at-tag">${g}</span><h3>${t}</h3><time>${d} 2026</time></a>`).join("")}</div></div></section>`),
  sec(`<section class="at-cta at-bg-blue pk-bleed"><div class="at-wrap"><div class="at-mega at-mega--s" data-reveal>Un projet<br>en tête ?</div><a class="at-pill at-pill--lime at-pill--lg" href="/contact" data-reveal>Racontez-le-nous ${arrow}</a></div>${star(C.lime, "at-cta-star")}</section>`),
  sec(footer(c)),
];

const projets = (c) => [sec(header(c)), pagehead("Portfolio · 2024–2026", "Tous les<br>projets", "Huit projets récents, du logo au film. Filtrez par discipline.", "pink"),
  sec(`<section class="at-pf pk-bleed" data-filter-scope><div class="at-wrap">${filters}<div class="at-pf-grid">${PROJECTS.map((p, i) => tile(p, i % 5 === 0 ? "at-tile--w" : "")).join("")}</div><p class="at-empty" hidden>Aucun projet dans cette catégorie.</p></div></section>`),
  sec(marquee(["Merci d'avoir fait défiler", "Il y en a d'autres", "Écrivez-nous"], "at-marq--pink")), sec(footer(c))];

const etude = (c) => [sec(header(c)),
  sec(`<section class="at-cs-hero at-bg-blue pk-bleed"><div class="at-wrap"><p class="at-kicker at-kicker--lime" data-reveal>Étude de cas · Identité</p><div class="at-giant" role="heading" aria-level="1" data-reveal>Maison<br>Sève</div>
    <p class="at-ph-sub" data-reveal>Comment une maison de cosmétiques végétales a quitté le vert sapin pour une identité qui ose.</p></div><div class="at-cs-art" aria-hidden="true">${COVERS[0]()}</div></section>`),
  sec(`<section class="at-cs-meta pk-bleed"><div class="at-wrap"><dl class="at-dl"><div><dt>Client</dt><dd>Maison Sève (fictive)</dd></div><div><dt>Année</dt><dd>2026</dd></div><div><dt>Durée</dt><dd>14 semaines</dd></div><div><dt>Missions</dt><dd>Stratégie, identité, packaging, site</dd></div></dl></div></section>`),
  sec(`<section class="at-cs pk-bleed"><div class="at-wrap at-cs-in"><aside class="at-cs-side" aria-label="Sommaire"><div class="at-index"><a href="#contexte" data-spy="contexte">Contexte</a><a href="#approche" data-spy="approche">Approche</a><a href="#resultats" data-spy="resultats">Résultats</a></div></aside>
    <div class="at-cs-body"><article data-section="contexte" data-reveal><h2 class="at-h2 at-h2--s">Contexte</h2><p class="at-big">Dix ans de belles formules, mais une marque qui ressemblait à toutes les autres. Sève voulait enfin être reconnue au premier regard, en rayon comme sur un écran.</p><p>Nous avons commencé par six ateliers avec l'équipe, puis une semaine à comparer plus de quatre-vingts packagings du secteur. Constat : tout est vert, tout est beige, tout se ressemble.</p></article>
    <figure class="at-fig" data-reveal>${COVERS[2]()}<figcaption>Planche de couleurs : lime, rose et bleu face au vert attendu du secteur.</figcaption></figure>
    <article data-section="approche" data-reveal><h2 class="at-h2 at-h2--s">Approche</h2><p class="at-big">Une graine, une arche, un soleil : trois formes simples, colorées, à assembler comme des pièces de jeu.</p><ul class="at-steps">${["Un système de formes plutôt qu'un logo figé", "Quatre couleurs franches, une par gamme", "Des flacons en aplats, lisibles à deux mètres", "Un site où chaque produit a sa couleur"].map((t) => `<li>${t}</li>`).join("")}</ul></article>
    <div class="at-duo" data-reveal><figure class="at-fig">${COVERS[4]()}</figure><figure class="at-fig">${COVERS[6]()}</figure></div>
    <article data-section="resultats" data-reveal><h2 class="at-h2 at-h2--s">Résultats</h2><p>Chiffres internes de démonstration, donnés à titre illustratif.</p><ul class="at-res"><li class="at-bg-lime"><b data-count="2" data-prefix="x">x2</b><span>de notoriété spontanée</span></li><li class="at-bg-pink"><b data-count="38" data-suffix=" %">38 %</b><span>de visites en plus</span></li><li class="at-bg-sun"><b data-count="9">9</b><span>nouveaux revendeurs</span></li></ul></article></div></div></section>`),
  sec(`<section class="at-next pk-bleed"><a class="at-next-in at-bg-lime" href="/projets" data-cursor="Suivant"><span>Projet suivant</span><b>Fanfare</b>${arrow}</a></section>`), sec(footer(c))];

const services = (c) => [sec(header(c)), pagehead("Savoir-faire", "Ce que<br>nous faisons", "Quatre métiers, une seule équipe. Vous parlez à ceux qui dessinent.", "sun"),
  sec(`<section class="at-sv pk-bleed">${[["Identité de marque", "lime", "01", ["Nom et positionnement", "Logo et système graphique", "Voix et charte éditoriale", "Livre de marque vivant"], "Une marque, ce n'est pas un logo : c'est une manière de se tenir debout."], ["Sites & produits", "pink", "02", ["Design d'interface", "Développement léger et rapide", "Accessibilité de base", "Contenus modifiables"], "Un site doit se charger vite, se lire bien et ressembler à quelqu'un."], ["Packaging & édition", "blue", "03", ["Étuis, étiquettes, flacons", "Catalogues et livres", "Signalétique", "Fichiers prêts pour l'imprimeur"], "Ce qu'on tient en main raconte plus que dix pages web."], ["Motion & film", "sun", "04", ["Habillage animé", "Films de marque", "Réseaux sociaux", "Génériques"], "Quelques secondes bien tenues valent mieux qu'une longue présentation."]].map(([t, k, n, li, d], i) => `<div class="at-sv-row at-bg-${k}${i % 2 ? " is-rev" : ""}"><div class="at-wrap at-sv-in"><div class="at-sv-head" data-reveal><i>${n}</i><h2 class="at-h2">${t}</h2><p>${d}</p></div><ul class="at-sv-li" data-reveal>${li.map((x) => `<li>${x}</li>`).join("")}</ul></div></div>`).join("")}</section>`),
  sec(`<section class="at-fmt pk-bleed"><div class="at-wrap"><h2 class="at-h2" data-reveal>Façons de travailler</h2>
    <table class="at-table" data-reveal><caption class="at-sr">Comparaison des formats d'accompagnement</caption><thead><tr><th>Format</th><th>Pour qui</th><th>Durée</th><th>Livrables</th></tr></thead><tbody>
    <tr><td data-l="Format"><b>Sprint</b></td><td data-l="Pour qui">Idée à tester vite</td><td data-l="Durée">2 semaines</td><td data-l="Livrables">Piste graphique, maquettes</td></tr>
    <tr><td data-l="Format"><b>Projet</b></td><td data-l="Pour qui">Identité ou site complet</td><td data-l="Durée">8 à 16 semaines</td><td data-l="Livrables">Système complet, déclinaisons</td></tr>
    <tr><td data-l="Format"><b>Compagnon</b></td><td data-l="Pour qui">Marque en croissance</td><td data-l="Durée">Au long cours</td><td data-l="Livrables">Équipe dédiée, suivi mensuel</td></tr></tbody></table>
    <p class="at-note" data-reveal>Les tarifs dépendent du périmètre : demandez un devis via le formulaire de contact.</p></div></section>`),
  sec(`<section class="at-faq pk-bleed"><div class="at-wrap at-faq-in"><h2 class="at-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Travaillez-vous avec de petites structures ?</summary><p>Oui, la moitié de nos clients ont moins de dix personnes. Nous adaptons le format, pas l'exigence.</p></details>
    <details data-reveal><summary>Qui sera mon interlocuteur ?</summary><p>Une direction artistique et un chef de projet, du premier rendez-vous à la livraison.</p></details>
    <details data-reveal><summary>Combien de pistes présentez-vous ?</summary><p>Deux ou trois pistes très différentes, puis nous approfondissons celle qui vous parle.</p></details></div></div></section>`),
  sec(footer(c))];

const TEAM = [["Inès Marchand", "Direction artistique", C.pink], ["Théo Lambert", "Design & code", C.lime], ["Sana Benali", "Stratégie de marque", C.sun], ["Hugo Delmas", "Motion", C.blue], ["Clara Voisin", "Production", C.pink], ["Malo Perrin", "Typographie", C.lime]];
const portrait = (col, i) => `<svg viewBox="0 0 200 220" aria-hidden="true">${bg(col)}<circle cx="${100 + (i % 2 ? 8 : -8)}" cy="86" r="${40 + (i % 3) * 4}" fill="${C.ink}"/><path d="M20 220c0-52 36-80 80-80s80 28 80 80z" fill="${C.white}" stroke="${C.ink}" stroke-width="5"/><circle cx="${100 + (i % 2 ? 8 : -8)}" cy="86" r="${40 + (i % 3) * 4}" fill="none" stroke="${C.ink}" stroke-width="5"/><circle cx="${84 + (i % 2 ? 8 : -8)}" cy="82" r="5" fill="${C.white}"/><circle cx="${116 + (i % 2 ? 8 : -8)}" cy="82" r="5" fill="${C.white}"/></svg>`;
const studio = (c) => [sec(header(c)), pagehead("Le studio", "Vingt têtes,<br>un atelier", "Nous sommes installés dans une ancienne filature, avec une grande table et trop de plantes.", "lime"),
  sec(`<section class="at-man pk-bleed"><div class="at-wrap"><p class="at-manifesto" data-reveal>Nous croyons aux <mark>idées simples</mark>, aux <mark class="m2">couleurs franches</mark> et aux clients qui <mark class="m3">posent des questions</mark>. Le reste est du détail, et le détail, c'est notre métier.</p></div></section>`),
  sec(`<section class="at-team pk-bleed"><div class="at-wrap"><div class="at-sechead"><h2 class="at-h2" data-reveal>L'équipe</h2></div><ul class="at-team-grid">${TEAM.map(([n, r, col], i) => `<li class="at-member" data-reveal><span class="at-port">${portrait(col, i)}</span><b>${n}</b><em>${r}</em></li>`).join("")}</ul><p class="at-note">Portraits fictifs, dessinés pour la démonstration.</p></div></section>`),
  sec(`<section class="at-vals at-bg-ink pk-bleed"><div class="at-wrap"><h2 class="at-h2 at-h2--lime" data-reveal>Nos règles</h2><div class="at-vals-grid">${[["Dire non", "Nous refusons un projet sur trois, pour bien faire les autres."], ["Montrer tôt", "Du croquis dès la semaine un, pas de grande révélation finale."], ["Rester lisibles", "Si ce n'est pas lisible sur un téléphone, ce n'est pas fini."], ["Partager", "Nos outils et nos fichiers sont rendus à la fin du projet."]].map(([t, d], i) => `<article data-reveal><i>${i + 1}</i><h3>${t}</h3><p>${d}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="at-tl pk-bleed"><div class="at-wrap"><h2 class="at-h2" data-reveal>Une histoire courte</h2><ol class="at-tl-list">${[["2014", "Deux amis, une table, un premier logo pour une librairie."], ["2018", "L'atelier s'installe dans la filature et passe à huit."], ["2021", "Ouverture du pôle motion et du premier film de marque."], ["2024", "Vingt personnes, trois nouvelles disciplines, la même table."]].map(([y, t]) => `<li data-reveal><b>${y}</b><span>${t}</span></li>`).join("")}</ol></div></section>`),
  sec(footer(c))];

const journal = (c) => [sec(header(c)), pagehead("Carnet de l'atelier", "Journal", "Méthodes, avis tranchés et coulisses de fabrication.", "sun"),
  sec(`<section class="at-jfeat pk-bleed"><div class="at-wrap"><a class="at-feat at-bg-pink" href="/journal" data-cursor="Lire"><span class="at-tag">À la une</span><h2>Choisir une couleur sans se disputer</h2><p>Notre méthode en trois votes pour trancher entre dix teintes sans fâcher personne.</p><time>12 mars 2026 · 8 min</time></a></div></section>`),
  sec(`<section class="at-jlist pk-bleed"><div class="at-wrap"><div class="at-filters" role="tablist" aria-label="Filtrer les articles">${[["tout", "Tout"], ["methode", "Méthode"], ["opinion", "Opinion"], ["pratique", "Pratique"]].map(([k, l], i) => `<a href="#${k}" role="tab" data-filter="${k}" ${i ? "" : "class=\"is-on\""}>${l}</a>`).join("")}</div>
    <ol class="at-rows" data-filter-scope>${[["Pourquoi nous détestons le gris", "opinion", "Opinion", "2 mars 2026", "5 min"], ["Cinq erreurs de packaging", "pratique", "Pratique", "20 fév. 2026", "6 min"], ["Un brief en une page", "methode", "Méthode", "8 fév. 2026", "4 min"], ["Choisir une typographie en réunion", "methode", "Méthode", "25 janv. 2026", "7 min"], ["Le logo est mort, vive le système", "opinion", "Opinion", "10 janv. 2026", "5 min"], ["Préparer ses fichiers pour l'imprimeur", "pratique", "Pratique", "18 déc. 2025", "9 min"]].map(([t, k, g, d, r]) => `<li class="at-row" data-cat="${k}" data-reveal><a href="/journal" data-cursor="Lire"><time>${d}</time><b>${t}</b><span class="at-tag">${g}</span><em>${r}</em>${arrow}</a></li>`).join("")}</ol></div></section>`),
  sec(footer(c))];

const process = (c) => [sec(header(c)), pagehead("Méthode", "Comment<br>ça se passe", "Cinq étapes, des points réguliers et aucune surprise à la facture.", "blue"),
  sec(`<section class="at-pr pk-bleed"><div class="at-wrap"><ol class="at-pr-list">${[["1", "Écoute", "1 semaine", "lime", "Entretiens, visite, analyse du marché. Nous posons beaucoup de questions bêtes, c'est volontaire."], ["2", "Pistes", "2 semaines", "pink", "Deux ou trois directions très différentes, présentées sur de vraies maquettes."], ["3", "Choix", "1 semaine", "sun", "Vous choisissez, nous affûtons. On simplifie plus qu'on n'ajoute."], ["4", "Fabrication", "4 à 8 semaines", "blue", "Déclinaisons, site, packaging, films. Point hebdomadaire de quinze minutes."], ["5", "Passation", "1 semaine", "lime", "Fichiers, livre de marque, formation de votre équipe. Vous repartez autonomes."]].map(([n, t, d, k, x]) => `<li class="at-pr-step at-bg-${k}" data-reveal><span class="at-pr-n">${n}</span><div><h2 class="at-h3">${t}</h2><p>${x}</p></div><span class="at-dur">${d}</span></li>`).join("")}</ol></div></section>`),
  sec(`<section class="at-bar pk-bleed"><div class="at-wrap"><h2 class="at-h2" data-reveal>Répartition du temps</h2><div class="at-gantt" data-reveal>${[["Écoute", 8, "lime"], ["Pistes", 16, "pink"], ["Choix", 8, "sun"], ["Fabrication", 52, "blue"], ["Passation", 8, "lime"]].map(([l, w, k]) => `<span class="at-bg-${k} at-w${w}"><b>${l}</b><i>${w} %</i></span>`).join("")}</div></div></section>`),
  sec(`<section class="at-cta at-bg-pink pk-bleed"><div class="at-wrap"><div class="at-mega at-mega--s" data-reveal>Prêt à<br>commencer ?</div><a class="at-pill at-pill--ink at-pill--lg" href="/contact" data-reveal>Fixer un premier échange ${arrow}</a></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("On vous répond sous deux jours", "Parlons-en", "Un projet, une question, une envie de café : écrivez-nous.", "lime"),
  { type: "form", heading: "Raconte-nous ton projet", intro: "Quelques lignes suffisent : contexte, délais, budget approximatif si tu en as un." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Cherchez<br>un truc", "Un projet, un article, une méthode.", "pink"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="at-404 at-bg-sun pk-bleed"><div class="at-wrap"><p class="at-kicker">Perdu ?</p><div class="at-giant" role="heading" aria-level="1">404</div><p class="at-ph-sub">Cette page a disparu ou a changé d'adresse.</p><a class="at-pill at-pill--ink at-pill--lg" href="/">Retour à l'accueil</a></div>${star(C.pink, "at-ph-star")}</section>`), sec(footer(c))];

module.exports = {
  key: "atelier", name: "Atelier Nord", version: "2.0.0", category: "agence", tags: ["audacieux", "ludique", "experimental"], siteType: "Agence créative et studio de design", featured: true,
  concept: "Un collage brutaliste : mots géants, autocollants qui tournent, aplats lime, rose et bleu, projets en tuiles filtrables et curseur-étiquette.",
  description: "Agence créative ou studio de design : fond lilas, aplats colorés et bordures épaisses, portfolio filtrable, étude de cas détaillée, services, équipe, journal et méthode en cinq étapes.",
  brand: "Atelier Nord", modules: ["formulaires", "recherche"],
  dna: { header: "grille-bordee-menu-numerote", hero: "mots-geants-collage-autocollants", grid: "tuiles-colorees-filtrables", motion: "curseur-etiquette-et-bandeau-defilant", shapes: "brutalisme-bordures-epaisses", rhythm: "dense-collage", signature: "tuiles-filtrables-et-etude-de-cas" },
  tokens: {
    colors: { primary: "#3a3cff", secondary: "#141414", accent: "#ff3d81", background: "#e9e2ff", surface: "#ffffff", text: "#141414", muted: "#4a4560", success: "#1e7e34", warning: "#8a5a00", error: "#c62828" },
    fonts: { heading: "font.unbounded", body: "font.figtree", button: "font.archivo", link: "font.figtree" },
    radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 22 }, shadow: { card: "6px 6px 0 #141414", button: "4px 4px 0 #141414" }, border: { width: 3, color: "#141414" },
    type: { h1: { size: 104, weight: 800, lineHeight: 0.95, transform: "none" }, h2: { size: 56, weight: 800, lineHeight: 1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur vive (rose)", type: "color", default: "#ff3d81" },
    { key: "lime", label: "Couleur acide (lime)", type: "color", default: "#c6f432" },
    { key: "paper", label: "Fond de page", type: "color", default: "#e9e2ff" },
    { key: "corners", label: "Angles", type: "choice", default: "round", choices: [["round", "Arrondis"], ["sharp", "Droits"]] },
    { key: "cursor", label: "Curseur-étiquette", type: "choice", default: "on", choices: [["on", "Actif"], ["off", "Désactivé"]] },
  ],
  menu: [["Accueil", "/"], ["Projets", "/projets"], ["Services", "/services"], ["Studio", "/studio"], ["Journal", "/journal"], ["Méthode", "/process"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "projets", name: "Projets", render: projets }, { key: "etude", name: "Étude de cas", render: etude },
    { key: "services", name: "Services", render: services }, { key: "studio", name: "Studio", render: studio }, { key: "journal", name: "Journal", render: journal },
    { key: "process", name: "Méthode", render: process }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
