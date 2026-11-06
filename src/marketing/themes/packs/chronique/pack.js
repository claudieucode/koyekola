// Chronique — long format. Direction artistique : un cahier de reportages sur papier ivoire. Une seule colonne de lecture, lettrines, notes en marge, filets fins, chiffres de durée de lecture ;
// aucune image obligatoire, aucun bruit. Mode lecture concentrée (taille, fond clair / sépia / nuit, masquage du décor), barre de progression et temps restant, parcours de lecture à cocher :
// tout est écrit dans les pages du thème et géré par motion.js (préférences gardées dans le navigateur). Articles, auteurs et situations fictifs.
const { sec, esc, nav } = require("../kit");

/* ---------- Page « Blocs » et pages légales (communes aux 5 thèmes de ce lot, écrites avec le préfixe du thème) ---------- */
const svgDemo = (a, b, label) => `<svg viewBox="0 0 640 360" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="${a}"/><circle cx="470" cy="120" r="70" fill="${b}" opacity=".85"/><path d="M0 300C120 220 220 330 340 260S560 230 640 290V360H0Z" fill="${b}" opacity=".55"/><path d="M0 330C140 280 260 350 400 310S580 300 640 330V360H0Z" fill="#000" opacity=".12"/></svg>`;
function blocsPage(P, c, head, foot, lead, col) {
  return [head(c), lead, sec(`<div class="${P}-wrap ${P}-prose ${P}-blocs">
  <section class="${P}-bl"><h2>Titres et texte courant</h2>
    <p>Le texte courant garde une taille d'au moins 16 pixels sur téléphone et une ligne de 60 à 80 caractères sur ordinateur. Un paragraphe peut contenir un <a href="/blocs">lien souligné</a>, du <strong>texte en gras</strong>, de l'<em>italique</em>, un <mark>passage surligné</mark>, une touche <kbd>Ctrl</kbd> + <kbd>F</kbd>, une abréviation comme <abbr title="Taux annuel effectif global">TAEG</abbr> et une note<sup>1</sup>.</p>
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Le titre de niveau 1 est celui de la page, en haut : il n'y en a jamais qu'un seul.</p></section>
  <section class="${P}-bl"><h2>Listes</h2>
    <ul><li>Une liste à puces simple</li><li>Avec un deuxième élément<ul><li>et un niveau imbriqué</li></ul></li><li>Et un troisième</li></ul>
    <ol><li>Une liste numérotée</li><li>Les étapes se suivent</li><li>Le compteur reste lisible</li></ol>
    <dl><dt>Terme</dt><dd>Sa définition, en une ou deux phrases.</dd><dt>Autre terme</dt><dd>Une seconde définition.</dd></dl></section>
  <section class="${P}-bl"><h2>Citations</h2>
    <blockquote class="${P}-quote"><p>Une citation courte se lit mieux quand elle a de l'air autour d'elle.</p><cite>${col.cite}</cite></blockquote>
    <p class="${P}-pull">Une citation mise en exergue peut porter une idée forte de l'article.</p></section>
  <section class="${P}-bl"><h2>Images et légendes</h2>
    <figure class="${P}-fig">${svgDemo(col.a, col.b, "Illustration abstraite : un soleil et deux collines")}<figcaption>Illustration abstraite, sa légende en dessous. ${col.legend}</figcaption></figure>
    <div class="${P}-cols ${P}-cols--2"><figure class="${P}-fig">${svgDemo(col.b, col.a, "Illustration abstraite aux couleurs inversées")}<figcaption>Une image en colonne.</figcaption></figure><figure class="${P}-fig">${svgDemo(col.a, col.c, "Illustration abstraite, troisième variante")}<figcaption>Une deuxième image en colonne.</figcaption></figure></div></section>
  <section class="${P}-bl"><h2>Tableau</h2>
    <div class="${P}-tablewrap" role="region" aria-label="Tableau à faire défiler sur petit écran"><table class="${P}-table"><caption>${col.cap}</caption><thead><tr><th scope="col">Élément</th><th scope="col">Détail</th><th scope="col">Valeur</th><th scope="col">Remarque</th></tr></thead><tbody><tr><th scope="row">Premier</th><td>Une ligne d'exemple</td><td>12,50</td><td>Au-dessus de la moyenne</td></tr><tr><th scope="row">Deuxième</th><td>Une autre ligne</td><td>8,00</td><td>Stable</td></tr><tr><th scope="row">Troisième</th><td>Encore une ligne</td><td>21,90</td><td>À surveiller</td></tr></tbody></table></div></section>
  <section class="${P}-bl"><h2>Code</h2><p>Du code en ligne : <code>total = a + b</code>. Et un bloc :</p><pre class="${P}-code"><code>function total(a, b) {
  return a + b;
}
console.log(total(2, 3)); // 5</code></pre></section>
  <section class="${P}-bl"><h2>Boutons</h2><p class="${P}-btns"><a class="${P}-btn" href="/contact">Bouton principal</a><a class="${P}-btn ${P}-btn--alt" href="/recherche">Bouton secondaire</a><a class="${P}-btn ${P}-btn--ghost" href="/">Bouton discret</a></p></section>
  <section class="${P}-bl"><h2>Colonnes</h2><div class="${P}-cols ${P}-cols--3"><div class="${P}-col"><h3>Colonne un</h3><p>Trois colonnes sur ordinateur, une seule sur téléphone.</p></div><div class="${P}-col"><h3>Colonne deux</h3><p>Chaque colonne garde sa propre largeur de lecture.</p></div><div class="${P}-col"><h3>Colonne trois</h3><p>Les espaces restent réguliers d'une colonne à l'autre.</p></div></div></section>
  <section class="${P}-bl"><h2>Encadrés</h2>
    <aside class="${P}-callout ${P}-callout--info"><strong>À retenir</strong><p>${col.info}</p></aside>
    <aside class="${P}-callout ${P}-callout--warn"><strong>Attention</strong><p>${col.warn}</p></aside>
    <aside class="${P}-callout ${P}-callout--tip"><strong>Astuce</strong><p>${col.tip}</p></aside></section>
</div>`), foot(c)];
}
const LEGAL = {
  mentions: (b, e) => [
    ["Éditeur du site", `${b} est un site de démonstration créé avec Kolakisa. L'éditeur est une entité fictive : ${e}. Aucun service réel n'est proposé et aucun achat n'est possible.`],
    ["Directeur de la publication", "Le responsable de la publication est la personne qui administre ce site de démonstration. Elle peut être jointe grâce à la page Contact."],
    ["Hébergement", "Le site est hébergé par le prestataire choisi par son administrateur. Ses coordonnées doivent être indiquées ici lors de la mise en ligne réelle du site."],
    ["Propriété intellectuelle", "Les textes, illustrations et mises en page de ce thème de démonstration sont fournis à titre d'exemple. Les noms, personnes, chiffres et situations présentés sont fictifs."],
    ["Responsabilité", "Les informations sont données à titre indicatif et ne constituent pas un conseil personnalisé. Remplacez ce texte par vos mentions légales avant toute publication."],
  ],
  confidentialite: (b) => [
    ["Données que nous recevons", `Quand vous utilisez le formulaire de la page Contact, ${b} reçoit les informations que vous saisissez : nom, adresse électronique et message. Rien d'autre n'est demandé.`],
    ["À quoi elles servent", "Ces informations servent uniquement à répondre à votre message. Elles ne sont ni vendues, ni cédées, ni utilisées pour de la publicité."],
    ["Cookies et mesure d'audience", "Ce thème n'installe aucun cookie publicitaire. Les préférences d'affichage que vous réglez (par exemple une case cochée) restent dans votre navigateur et ne sont jamais envoyées au site."],
    ["Durée de conservation", "Les messages sont conservés le temps nécessaire pour y répondre, puis supprimés dans un délai de douze mois."],
    ["Vos droits", "Vous pouvez demander l'accès à vos données, leur correction ou leur suppression en écrivant depuis la page Contact. Vous pouvez aussi saisir la CNIL si vous estimez que vos droits ne sont pas respectés."],
  ],
};
function legalPage(P, kind, c, head, foot, lead, brand, editor) {
  const items = LEGAL[kind](brand, editor);
  return [head(c), lead, sec(`<div class="${P}-wrap ${P}-prose ${P}-legal">${items.map(([t, x], i) => `<section class="${P}-bl"><h2>${i + 1}. ${t}</h2><p>${x}</p></section>`).join("")}<p class="${P}-fine">Dernière mise à jour : 5 novembre 2026. Texte de démonstration, à adapter avant toute mise en ligne.</p></div>`), foot(c)];
}


const CATS = { reportage: "Reportage", enquete: "Enquête", portrait: "Portrait", essai: "Essai", histoire: "Histoire", science: "Science" };
const AUTH = {
  clemence: { n: "Clémence Aubry", r: "Reportrice", i: "CA", b: "Vingt ans de terrain, d'abord en presse régionale. Elle écrit à hauteur de ceux qu'elle rencontre et revient toujours les revoir." },
  remi: { n: "Rémi Delcourt", r: "Enquêteur", i: "RD", b: "Travaille sur les archives, les contrats et les cartes. Croit qu'un document ne ment pas, mais qu'il faut savoir qui l'a rangé." },
  yasmine: { n: "Yasmine Lakhdar", r: "Portraitiste", i: "YL", b: "Passe des semaines avec une seule personne avant d'écrire une ligne. Ses portraits font rarement moins de quinze minutes de lecture." },
  etienne: { n: "Étienne Vautrin", r: "Essayiste et historien", i: "EV", b: "Enseigne l'histoire des techniques. Écrit des essais courts pour de longs sujets." },
};
// id, titre, rubrique, auteur, date, minutes, chapeau
const ART = [
  ["phare", "Le dernier gardien du phare de la baie", "reportage", "clemence", "2026-10-31", 24, "Il n'y a plus de gardien depuis trente ans. Lui est resté, sans titre ni salaire, pour que la lumière tourne encore."],
  ["loire", "Ce que l'eau de la Loire garde en mémoire", "enquete", "remi", "2026-10-24", 31, "Trois sécheresses, une digue et des relevés oubliés : l'histoire d'un fleuve racontée par ceux qui le mesurent."],
  ["imprimeuse", "Portrait d'une imprimeuse qui refuse l'écran", "portrait", "yasmine", "2026-10-17", 18, "Dans son atelier de Nantes, une presse de 1932 imprime encore des faire-part, des affiches et quelques certitudes."],
  ["attendre", "Pourquoi nous ne savons plus attendre", "essai", "etienne", "2026-10-10", 22, "Une histoire de la patience, de l'horloge de village au bouton « acheter en un clic »."],
  ["1954", "1954, l'hiver où les rivières ont gelé", "histoire", "etienne", "2026-10-03", 27, "Février 1954 : le froid est venu en quelques jours. Ce que racontent les archives municipales, les carnets de pêcheurs et les lettres."],
  ["abeilles", "Les abeilles de la ville : trois ans dans un rucher de toit", "science", "clemence", "2026-09-26", 20, "Sur le toit d'un immeuble de Lyon, des ruches et une chercheuse qui compte les butineuses une à une."],
  ["ligne", "La ligne oubliée : à pied sur un chemin de fer sans trains", "reportage", "clemence", "2026-09-19", 35, "Quatre-vingt-dix kilomètres de rails rouillés, des gares sans quai et des habitants qui n'ont pas oublié le dernier train."],
  ["notaire", "Un notaire, un champ, un siècle de procès", "enquete", "remi", "2026-09-12", 40, "Une parcelle de deux hectares, quatre générations de plaideurs : comment un champ finit par coûter plus cher que sa valeur."],
  ["silences", "Elle traduit les silences", "portrait", "yasmine", "2026-09-05", 16, "Interprète judiciaire, Sofia traduit ce que les gens disent, mais aussi ce qu'ils taisent."],
  ["pain", "Le goût du pain d'avant", "essai", "etienne", "2026-08-29", 14, "On regrette toujours un pain qu'on n'a pas connu. Retour sur une nostalgie fabriquée."],
  ["crue", "La grande crue de 1910 racontée par ses photographes", "histoire", "remi", "2026-08-22", 25, "Les plaques de verre d'un pharmacien et les clichés d'un journal : deux regards sur les mêmes rues sous l'eau."],
  ["cartographe", "Dans la tête d'un cartographe de fonds marins", "science", "clemence", "2026-08-15", 21, "À bord d'un navire, on dessine le fond de la mer avec du son. Une nuit de travail, minute par minute."],
  ["village", "Retour au village : cinq ans après l'exode urbain", "reportage", "yasmine", "2026-08-08", 28, "Ils ont quitté la ville en 2021 pour un village de mille habitants. Que reste-t-il du rêve ?"],
  ["tunnel", "Le coût caché d'un tunnel", "enquete", "remi", "2026-08-01", 33, "Un ouvrage annoncé à 300 millions d'euros, livré avec dix ans de retard. Ce que disent les rapports de la Cour des comptes."],
  ["main", "Écrire à la main : lettre à celle que je fus", "essai", "yasmine", "2026-07-25", 12, "Un cahier retrouvé dans un grenier, une écriture qu'on ne reconnaît plus, et ce qu'elle dit de nous."],
  ["sourciers", "Les derniers sourciers", "portrait", "clemence", "2026-07-18", 19, "Trois hommes, une baguette de coudrier, et des agriculteurs qui les appellent encore quand la source se tarit."],
].map(([id, t, cat, au, d, min, x]) => ({ id, t, cat, au, d, min, x }));
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const fr = (d) => { const [y, m, j] = d.split("-"); return `${Number(j) === 1 ? "1er" : Number(j)} ${MOIS[Number(m) - 1]} ${y}`; };
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`);
const byId = Object.fromEntries(ART.map((a) => [a.id, a]));
const PATHS = [
  ["cafe", "Une pause café", "Pour une pause longue : un seul récit, de la première à la dernière ligne.", ["imprimeuse"]],
  ["soiree", "Une soirée sans écran", "Deux textes qui se répondent : un portrait et un essai.", ["silences", "attendre", "pain"]],
  ["dimanche", "Un dimanche de lecture", "Cinq lectures pour un après-midi entier, du reportage à l'enquête.", ["phare", "ligne", "loire", "tunnel", "crue"]],
];

const mark = `<svg class="ch-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M7 33V8h6l7 14L27 8h6v25" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M6 36h28" stroke="currentColor" stroke-width="1.4"/></svg>`;
const arrow = `<svg class="ch-arr" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const dur = (m) => `<span class="ch-dur ch-w${Math.min(10, Math.max(1, Math.round(m / 4.5)))}" aria-label="${m} minutes de lecture"><i></i><b>${m} min</b></span>`;

const header = (c) => sec(`<header class="ch-head pk-bleed"><div class="ch-wrap ch-bar"><a class="ch-logo" href="/" aria-label="${esc(c.brand)} : accueil">${mark}<span>Chronique</span></a><p class="ch-tag">Un récit long tous les dix jours</p>
  <div class="ch-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <details class="ch-menu"><summary><span>Sommaire</span><i aria-hidden="true"></i></summary><div class="ch-menu-in" role="navigation" aria-label="Sommaire du site">${nav(c.menu)}<a href="/recherche">Recherche</a></div></details></div></header>`);
const footer = (c) => sec(`<footer class="ch-foot pk-bleed"><div class="ch-wrap ch-foot-in"><div class="ch-foot-lead">${mark}<p class="ch-foot-q">Ici, on lit jusqu'au bout.</p><p class="ch-fine">Chronique est un site de démonstration. Les reportages, personnes et chiffres sont fictifs.</p></div>
  <div class="ch-foot-col"><h2>Lire</h2>${nav(c.menu.slice(1, 4), "ch-fl")}</div><div class="ch-foot-col"><h2>Rubriques</h2>${Object.entries(CATS).slice(0, 4).map(([k, v]) => `<a class="ch-fl" href="/dossiers?cat=${k}">${v}</a>`).join("")}</div>
  <div class="ch-foot-col"><h2>Le site</h2><a class="ch-fl" href="/contact">Contact</a><a class="ch-fl" href="/recherche">Recherche</a><a class="ch-fl" href="/blocs">Blocs de mise en page</a><a class="ch-fl" href="/mentions-legales">Mentions légales</a><a class="ch-fl" href="/confidentialite">Confidentialité</a></div></div>
  <div class="ch-wrap ch-foot-end"><p>© 2026 Chronique, site de démonstration. Composé en DM Serif Text et Vollkorn.</p></div></footer>`);
const pagehead = (kick, title, sub) => sec(`<section class="ch-ph pk-bleed"><div class="ch-wrap ch-ph-in"><p class="ch-kick">${esc(kick)}</p><div class="ch-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="ch-sub">${esc(sub)}</p>` : ""}</div></section>`);

const row = (a, n) => `<li class="ch-item" data-cat="${a.cat}" data-min="${a.min}" data-q="${esc((a.t + " " + a.x + " " + CATS[a.cat] + " " + AUTH[a.au].n).toLowerCase())}"><article class="ch-row"><span class="ch-n" aria-hidden="true">${String(n + 1).padStart(2, "0")}</span><div class="ch-row-m"><p class="ch-meta"><span class="ch-cat">${CATS[a.cat]}</span><time datetime="${a.d}">${fr(a.d)}</time></p><h3 class="ch-row-t"><a href="/article">${esc(a.t)}</a></h3><p class="ch-row-x">${esc(a.x)}</p><p class="ch-by">${AUTH[a.au].n}</p></div>${dur(a.min)}</article></li>`;
const list = (arr, extra = "") => `<ol class="ch-list ${extra}" data-ch-list>${arr.map(row).join("")}</ol>`;

const home = (c) => [header(c),
  sec(`<section class="ch-hero pk-bleed"><div class="ch-wrap ch-hero-in"><p class="ch-kick">Revue de récits longs</p><div class="ch-h1 ch-h1--hero" role="heading" aria-level="1">Prendre le temps de lire <em>longtemps</em>.</div>
    <p class="ch-lead ch-drop">Seize récits, enquêtes et portraits, de douze à quarante minutes de lecture. Pas de publicité, pas de fenêtre qui surgit, et un mode de lecture qui efface tout sauf le texte.</p><p class="ch-cta"><a class="ch-btn" href="/dossiers">Parcourir les récits ${arrow}</a><a class="ch-btn ch-btn--ghost" href="/parcours">Choisir un parcours</a></p>
    <dl class="ch-stats"><div><dt>Récits</dt><dd data-ch-count="16">16</dd></div><div><dt>Durée moyenne</dt><dd>24 min</dd></div><div><dt>Publicités</dt><dd>0</dd></div></dl></div></section>`),
  sec(`<section class="ch-sec ch-sec--une pk-bleed"><div class="ch-wrap"><p class="ch-kick">À la une</p><article class="ch-une"><div class="ch-une-m"><p class="ch-meta"><span class="ch-cat">${CATS.reportage}</span><time datetime="${ART[0].d}">${fr(ART[0].d)}</time></p><h2 class="ch-une-t"><a href="/article">${esc(ART[0].t)}</a></h2><p class="ch-une-x">${esc(ART[0].x)}</p><p class="ch-by">Par ${AUTH.clemence.n} · ${ART[0].min} minutes de lecture</p><p><a class="ch-more" href="/article">Lire le récit ${arrow}</a></p></div>
    <figure class="ch-une-f"><svg viewBox="0 0 400 300" role="img" aria-label="Dessin d'un phare sur un promontoire, vu de nuit"><rect width="400" height="300" class="ch-sky"/><circle cx="310" cy="70" r="26" class="ch-moon"/><path d="M0 250C80 230 140 262 220 246S340 236 400 252V300H0z" class="ch-sea"/><path d="M150 250l14-130h32l14 130z" class="ch-tower"/><rect x="160" y="96" width="32" height="24" class="ch-lamp"/><path d="M170 96l12-18 12 18z" class="ch-tower"/><path d="M192 108L400 60v96z" class="ch-beam"/></svg><figcaption>Le phare de la baie, dessin d'illustration.</figcaption></figure></article></div></section>`),
  sec(`<section class="ch-sec pk-bleed"><div class="ch-wrap"><div class="ch-sechead"><div><p class="ch-kick">Cette saison</p><h2 class="ch-h2">Les derniers récits</h2></div><a class="ch-more" href="/dossiers">Tous les récits ${arrow}</a></div>${list(ART.slice(1, 6))}</div></section>`),
  sec(`<section class="ch-sec ch-sec--par pk-bleed"><div class="ch-wrap"><div class="ch-sechead"><div><p class="ch-kick">Parcours</p><h2 class="ch-h2">Combien de temps avez-vous ?</h2></div></div><div class="ch-pcards">${PATHS.map(([k, t, x, ids]) => `<a class="ch-pc" href="/parcours"><span class="ch-pc-d">${hm(ids.reduce((s, i) => s + byId[i].min, 0))}</span><span class="ch-pc-t">${t}</span><span class="ch-pc-x">${x}</span></a>`).join("")}</div></div></section>`),
  sec(`<section class="ch-sec ch-sec--man pk-bleed"><div class="ch-wrap ch-man"><div><p class="ch-kick">Notre promesse</p><h2 class="ch-h2">Trois choses que nous ne ferons jamais</h2></div><ol class="ch-man-l"><li><b>Interrompre.</b> Aucune fenêtre, aucune bannière, aucun défilement infini.</li><li><b>Raccourcir.</b> Un récit prend le temps qu'il lui faut, et son temps de lecture est affiché.</li><li><b>Vous suivre.</b> Vos réglages de lecture restent dans votre navigateur.</li></ol></div></section>`),
  footer(c)];

const dossiers = (c) => [header(c), pagehead("Les récits", "Seize textes longs, par rubrique et par durée", "Filtrez, cherchez un mot, ou laissez-vous guider par les numéros."),
  sec(`<section class="ch-sec pk-bleed"><div class="ch-wrap"><h2 class="ch-sr">Liste des récits</h2><div class="ch-tools" data-ch-tools><p class="ch-tools-n" role="status" aria-live="polite"><b data-ch-n>${ART.length}</b> récits affichés, <b data-ch-t>${hm(ART.reduce((s, a) => s + a.min, 0))}</b> de lecture au total</p>
    <ul class="ch-chips" aria-label="Filtrer par rubrique"><li><a href="/dossiers" data-cat="tous" aria-current="true">Toutes</a></li>${Object.entries(CATS).map(([k, v]) => `<li><a href="/dossiers?cat=${k}" data-cat="${k}">${v}</a></li>`).join("")}</ul>
    <ul class="ch-chips ch-chips--d" aria-label="Filtrer par durée"><li><a href="/dossiers" data-dur="tous" aria-current="true">Toutes durées</a></li><li><a href="/dossiers" data-dur="court">Moins de 20 min</a></li><li><a href="/dossiers" data-dur="moyen">20 à 30 min</a></li><li><a href="/dossiers" data-dur="long">Plus de 30 min</a></li></ul></div>
    ${list(ART)}<div class="ch-empty" data-ch-empty hidden><p class="ch-empty-t">Aucun récit ne correspond.</p><p>Élargissez la durée ou revenez à <a href="/dossiers">tous les récits</a>.</p></div></div></section>`),
  footer(c)];

const A0 = ART[0];
const article = (c) => [header(c),
  sec(`<section class="ch-arh pk-bleed"><div class="ch-wrap ch-arh-in"><p class="ch-crumb"><a href="/">Accueil</a> / <a href="/dossiers?cat=reportage">Reportage</a></p><p class="ch-meta"><span class="ch-cat">${CATS.reportage}</span><time datetime="${A0.d}">${fr(A0.d)}</time><span>${A0.min} minutes de lecture</span></p><div class="ch-h1 ch-h1--art" role="heading" aria-level="1">${esc(A0.t)}</div><p class="ch-sub">${esc(A0.x)}</p><p class="ch-by ch-by--l"><span class="ch-av" aria-hidden="true">CA</span>Texte de <b>${AUTH.clemence.n}</b></p></div></section>`),
  sec(`<div class="ch-wrap ch-art" data-ch-art><aside class="ch-toc" aria-label="Chapitres"><p class="ch-toc-t">Chapitres</p><ol><li><a href="#lumiere">La lumière</a></li><li><a href="#escalier">Cent trente marches</a></li><li><a href="#registre">Le registre</a></li><li><a href="#maree">Marée haute</a></li><li><a href="#relais">Le relais</a></li></ol><p class="ch-toc-l" data-ch-left aria-live="off"></p></aside>
    <div class="ch-prose ch-body"><p class="ch-first ch-drop">Le dernier gardien du phare de la baie s'appelle Armand Kerloch et n'a jamais été gardien. Il est arrivé en 1994, l'année de l'automatisation, pour réparer une porte. Trente-deux ans plus tard, il monte encore chaque soir à la lanterne.<sup><a href="#n1">1</a></sup></p>
    <h2 data-anchor="lumiere">La lumière</h2><p>La lampe est une ampoule de quelques dizaines de watts dans une optique de verre taillé, fabriquée en 1911. Elle n'a aucune utilité : un balisage électronique guide désormais les bateaux. Mais personne n'a osé l'éteindre, et le conseil du département a fini par inscrire une ligne au budget, « entretien patrimonial », sous laquelle on peut lire le nom d'Armand sans qu'il y figure.</p>
    <aside class="ch-marg"><b>Repère</b> Le phare a été mis en service en 1868 et automatisé en 1994. Sa portée est de vingt-deux milles marins.</aside>
    <p>Il y a un geste qu'il refait chaque soir : essuyer d'un chiffon doux les trois lentilles du bas, puis s'asseoir une minute sur la dernière marche, face au large. « Je ne regarde pas la mer, dit-il. Je regarde si elle me regarde. »</p>
    <h2 data-anchor="escalier">Cent trente marches</h2><p>L'escalier tourne autour d'un noyau de granit. Au quarantième degré, on sent l'humidité. Au centième, l'odeur de l'huile. Au dernier, on entend le vent, qui a toujours une opinion.</p>
    <blockquote class="ch-quote"><p>On croit qu'un phare sert à éviter les récifs. Il sert surtout à rappeler à ceux qui sont en mer que quelqu'un, à terre, pense à eux.</p><cite>Armand Kerloch</cite></blockquote>
    <figure class="ch-fig"><svg viewBox="0 0 640 260" role="img" aria-label="Coupe schématique de l'escalier du phare : cent trente marches de la base à la lanterne"><rect width="640" height="260" class="ch-fig-bg"/><path d="M60 230h520M80 230l40-30 40 30 40-60 40 60 40-90 40 90 40-120 40 120 40-150 40 150" class="ch-fig-l"/><circle cx="560" cy="40" r="14" class="ch-fig-o"/></svg><figcaption>Schéma de principe : l'escalier compte cent trente marches pour trente-huit mètres de hauteur.</figcaption></figure>
    <h2 data-anchor="registre">Le registre</h2><p>Dans le local du bas, un cahier à couverture toile. Chaque soir, depuis le 14 mars 1994, une ligne : l'heure d'allumage, la visibilité, un mot sur la mer. Armand y a écrit <em>houleuse</em> trois mille fois et <em>tranquille</em> quatre cents. Le 3 février 2014, une seule phrase : « Aujourd'hui, Madeleine est partie. »</p>
    <aside class="ch-marg"><b>À savoir</b> Les registres de phare sont conservés aux archives départementales depuis 1895.</aside>
    <p>Il a continué à écrire le lendemain, la mer étant ce qu'elle est.</p>
    <h2 data-anchor="maree">Marée haute</h2><p>En octobre dernier, une tempête a arraché le ponton. Le département a parlé de fermer l'accès au phare « par sécurité ». Il y a eu une réunion, une pétition, un article. Quarante-sept habitants ont signé. Quarante-sept, c'est le nombre exact de ceux qui, dans le village, savent encore où se trouve la clé.</p>
    <div class="ch-tablewrap" role="region" aria-label="Chronologie du phare, à faire défiler sur petit écran"><table class="ch-table"><caption>Une vie de phare en quelques dates</caption><thead><tr><th scope="col">Année</th><th scope="col">Événement</th><th scope="col">Gardiens</th></tr></thead><tbody><tr><th scope="row">1868</th><td>Mise en service</td><td>3</td></tr><tr><th scope="row">1944</th><td>Optique sauvée de la destruction</td><td>2</td></tr><tr><th scope="row">1994</th><td>Automatisation</td><td>0</td></tr><tr><th scope="row">2026</th><td>Entretien patrimonial</td><td>1 bénévole</td></tr></tbody></table></div>
    <h2 data-anchor="relais">Le relais</h2><p>Armand a soixante-dix-huit ans. Il ne dit pas qu'il cherche quelqu'un pour monter à sa place ; il dit seulement qu'il a cinq clés et que la plus petite est celle de la porte du bas. Cet automne, deux lycéens du village sont venus la lui demander.</p><p>Il les a fait monter jusqu'à la lanterne. Puis il leur a donné le chiffon.</p>
    <ol class="ch-notes"><li data-anchor="n1">Les noms et les faits sont fictifs ; ce reportage illustre la mise en page d'un thème de démonstration.</li></ol>
    <div class="ch-author"><span class="ch-av ch-av--l" aria-hidden="true">CA</span><div><p class="ch-au-n">${AUTH.clemence.n}</p><p class="ch-au-r">${AUTH.clemence.r}</p><p>${AUTH.clemence.b}</p></div></div></div></div>`),
  sec(`<section class="ch-sec ch-sec--rel pk-bleed"><div class="ch-wrap"><div class="ch-sechead"><div><p class="ch-kick">Pour continuer</p><h2 class="ch-h2">À lire ensuite</h2></div></div>${list([ART[6], ART[2], ART[3]])}</div></section>`),
  footer(c)];

const parcours = (c) => [header(c), pagehead("Parcours de lecture", "Combien de temps avez-vous ?", "Trois sélections selon votre temps. Marquez ce que vous avez lu : le temps restant se met à jour."),
  sec(`<section class="ch-sec pk-bleed"><div class="ch-wrap"><div class="ch-paths">${PATHS.map(([k, t, x, ids], pi) => `<section class="ch-path ch-path--${pi}" data-ch-path="${k}"><div class="ch-path-h"><p class="ch-path-d">${hm(ids.reduce((s, i) => s + byId[i].min, 0))}</p><div><h2 class="ch-h3">${t}</h2><p class="ch-path-x">${x}</p></div></div><ol class="ch-steps">${ids.map((i) => `<li data-ch-step data-min="${byId[i].min}"><span class="ch-step-c" aria-hidden="true"></span><div><a href="/article">${esc(byId[i].t)}</a><p class="ch-by">${AUTH[byId[i].au].n} · ${byId[i].min} min</p></div></li>`).join("")}</ol><p class="ch-path-f" aria-live="polite"><span data-ch-rest>${hm(ids.reduce((s, i) => s + byId[i].min, 0))}</span> restantes</p><p class="ch-path-a" data-ch-pact></p></section>`).join("")}</div></div></section>`),
  footer(c)];

const contact = (c) => [header(c), pagehead("Contact", "Écrire à la rédaction", "Une proposition de sujet, une correction, un souvenir à partager : nous lisons tout, lentement."),
  sec(`<section class="ch-info pk-bleed"><div class="ch-wrap ch-info-in"><div><h2 class="ch-h3">Proposer un sujet</h2><p>Quelques lignes suffisent : le lieu, les personnes, ce qui vous a surpris.</p></div><div><h2 class="ch-h3">Corriger une erreur</h2><p>Citez le passage et la source. Les corrections sont signalées en fin de texte.</p></div><div><h2 class="ch-h3">Délai de réponse</h2><p>Sous dix jours ouvrés, au rythme de la revue.</p></div></div></section>`),
  { type: "form", heading: "Envoyer un message", intro: "Dites-nous qui vous êtes et ce que vous souhaitez nous écrire." }, footer(c)];
const recherche = (c) => [header(c), pagehead("Recherche", "Retrouver un récit", "Un titre, un lieu, un nom d'auteur."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un récit, un lieu, un auteur…" } }] },
  sec(`<section class="ch-sec pk-bleed"><div class="ch-wrap"><div class="ch-empty ch-empty--static"><p class="ch-empty-t">Aucun résultat ?</p><p>Essayez un seul mot, un lieu ou un nom propre. Ou parcourez par rubrique.</p><ul class="ch-chips">${Object.entries(CATS).map(([k, v]) => `<li><a href="/dossiers?cat=${k}">${v}</a></li>`).join("")}<li><a href="/parcours">Parcours</a></li></ul></div></div></section>`), footer(c)];
const introuvable = (c) => [header(c), sec(`<section class="ch-404 pk-bleed"><div class="ch-wrap ch-404-in"><p class="ch-404-n" aria-hidden="true">404</p><p class="ch-kick">Page introuvable</p><div class="ch-h1" role="heading" aria-level="1">Cette page manque au sommaire.</div><p class="ch-sub">Elle a peut-être été déplacée, ou jamais écrite. Reprenez le fil depuis le début.</p><p class="ch-cta"><a class="ch-btn" href="/">Retour à l'accueil</a><a class="ch-btn ch-btn--ghost" href="/dossiers">Tous les récits</a></p></div></section>`), footer(c)];
const blocs = (c) => blocsPage("ch", c, header, footer, pagehead("Blocs de mise en page", "Tous les éléments d'un récit, sur une page", "Titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés."), { cite: "Armand Kerloch", a: "#e6d9bd", b: "#8f3a14", c: "#1f4e5f", legend: "Une illustration accompagne parfois un récit.", cap: "Tableau d'exemple : quatre colonnes", info: "Un encadré « Repère » donne un fait utile sans interrompre le récit.", warn: "Un encadré « Correction » signale une erreur rectifiée après publication.", tip: "Un encadré « Pour aller plus loin » renvoie à une source." });
const legal = (kind, title, kick, sub) => (c) => legalPage("ch", kind, c, header, footer, pagehead(kick, title, sub), "Chronique", "Éditions Chronique SAS (société fictive), 5 quai des Imprimeurs, 44000 Nantes");

module.exports = {
  key: "chronique", name: "Chronique", version: "1.0.0", category: "edition", collection: "blog", tags: ["editorial", "classique", "minimaliste"], siteType: "Revue de récits et d'enquêtes en format long", featured: false,
  concept: "Un cahier de reportages sur papier ivoire : une seule colonne, des lettrines, des notes en marge et un mode de lecture concentrée qui efface tout sauf le texte.",
  description: "Revue de format long : ivoire, sienne brûlée et bleu-vert d'encre, colonne unique, lettrines, notes en marge, seize récits factices, mode lecture concentrée, barre de progression, temps restant et parcours de lecture.",
  brand: "Chronique", modules: ["formulaires", "recherche", "blog"],
  declare: "Les 16 récits, les parcours et le mode lecture (taille, fond, progression, temps restant) sont écrits dans les pages du thème et pilotés par motion.js ; les préférences restent dans le navigateur (localStorage). Ce ne sont pas des fonctions du CMS.",
  dna: {
    header: "marque-minuscule-a-gauche-et-sommaire-deroulant-a-droite",
    hero: "titre-typographique-seul-sur-fond-ivoire-et-lettrine-sans-image",
    grid: "colonne-unique-etroite-avec-notes-de-marge",
    typo: "serif-d-affiche-dm-serif-text-et-vollkorn-de-lecture",
    shapes: "filets-fins-chiffres-de-duree-et-lettrines",
    motion: "barre-de-progression-de-lecture-et-transitions-feutrees",
    rhythm: "pages-de-livre-longs-blancs-et-filets-entre-chapitres",
    signature: "mode-lecture-concentree-progression-et-temps-restant-et-parcours-de-lecture",
    palette: "ivoire-sienne-brulee-et-bleu-vert-d-encre",
    image: "une-seule-illustration-au-trait-par-recit-sans-photo",
    list: "table-des-matieres-numerotee-avec-jauge-de-duree",
    article: "chapitres-numerotes-lettrine-notes-en-marge-et-notes-de-fin",
    sidebar: "chapitres-colles-a-gauche-avec-temps-restant",
    reading: "corps-20-px-interligne-1-8-mesure-de-62-caracteres-et-reglages-a-la-carte",
  },
  tokens: {
    colors: { primary: "#8f3a14", secondary: "#1f4e5f", accent: "#1f4e5f", background: "#faf5ea", surface: "#fffdf7", text: "#231d17", muted: "#5b5147", success: "#2f6b3f", warning: "#8a5a00", error: "#a3302a" },
    fonts: { heading: "font.dm-serif-text", body: "font.vollkorn", button: "font.vollkorn", link: "font.vollkorn" },
    radius: { sm: 0, md: 2, lg: 2, button: 2, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9cfbd" },
    type: { h1: { size: 60, weight: 400, lineHeight: 1.08, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "encre", label: "Sienne des accents", type: "color", default: "#8f3a14" },
    { key: "entete", label: "Style de l'en-tête", type: "choice", default: "sommaire", choices: [["sommaire", "Marque et sommaire déroulant"], ["filet", "Marque centrée, navigation sous double filet"], ["nu", "Marque seule"]] },
    { key: "pied", label: "Style du pied de page", type: "choice", default: "colophon", choices: [["colophon", "Colophon centré"], ["colonnes", "Trois colonnes"]] },
    { key: "liste", label: "Présentation des listes de récits", type: "choice", default: "table", choices: [["table", "Table des matières"], ["affiche", "Grands titres, sans chiffres"], ["colonnes", "Deux colonnes"]] },
    { key: "article", label: "Notes des articles", type: "choice", default: "marge", choices: [["marge", "Notes dans la marge"], ["inline", "Notes dans le texte"]] },
    { key: "lettrine", label: "Lettrine au début des récits", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "fond", label: "Fond de page", type: "choice", default: "ivoire", choices: [["ivoire", "Ivoire"], ["sepia", "Sépia"], ["nuit", "Nuit"]] },
  ],
  menu: [["Accueil", "/"], ["Récits", "/dossiers"], ["Parcours", "/parcours"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "dossiers", name: "Récits", render: dossiers }, { key: "article", name: "Récit", render: article },
    { key: "parcours", name: "Parcours de lecture", render: parcours }, { key: "blocs", name: "Blocs", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: legal("mentions", "Mentions légales", "Informations légales", "Qui édite ce site, qui l'héberge, et ce qu'il faut savoir avant de le copier.") },
    { key: "confidentialite", name: "Confidentialité", render: legal("confidentialite", "Politique de confidentialité", "Vos données", "Ce que reçoit le site, à quoi cela sert, et comment exercer vos droits.") },
  ],
};
