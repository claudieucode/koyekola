// Préface — page « bientôt disponible » d'un lieu fictif : Maison Verrière, librairie-café qui ouvre à Lyon au printemps 2027. Direction artistique : l'avant-propos d'un livre.
// Papier pêche, encre indigo, chiffres géants, sections en chiffres romains, numéros de page en pied. Composants signature : compte à rebours RÉEL vers une date configurable
// (attribut data-launch du bloc « cadran », modifiable dans l'éditeur, plus un réglage « report » en jours), jalons du calendrier qui passent à « fait » selon la date du jour,
// et liste d'attente (formulaire du CMS). Tout est démonstration : le lieu, l'équipe et les dates sont fictifs.
const { sec, esc, nav } = require("../kit");

const LAUNCH = "2027-03-15T09:00:00+01:00";
const START = "2026-06-02";
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dlong = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MONTHS[m - 1]} ${y}`; };
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const JALONS = [
  ["2026-06-02", "Signature du bail", "Un ancien atelier de reliure, rue des Tanneurs, avec une verrière de six mètres. Le coup de cœur a pris dix minutes."],
  ["2026-09-14", "Début des travaux", "Dépose du faux plafond, mise à nu des poutres et ponçage du parquet d'origine."],
  ["2026-11-20", "Pose des rayonnages", "Quatre cents mètres de chêne massif fabriqués par un menuisier de la Croix-Rousse."],
  ["2027-01-12", "Commande des premiers livres", "Douze mille volumes choisis un à un avec les libraires, dont mille titres d'éditeurs indépendants."],
  ["2027-02-05", "Recrutement de l'équipe", "Cinq personnes : deux libraires, une cheffe de salle, un barista, une médiatrice culturelle."],
  ["2027-02-27", "Soirée des voisins", "Une soirée de préouverture réservée aux inscrits de la liste d'attente, sur invitation."],
  ["2027-03-15", "Ouverture au public", "Les portes ouvrent à 9 heures. Premier café offert à toutes celles et tous ceux qui entrent."],
];
const BILLETS = [
  ["ponçage", "chantier", "2026-10-28", "Le parquet n'était pas perdu", "Sous trois couches de lino, nous avons retrouvé un parquet en point de Hongrie. Il a fallu quatre semaines de ponçage, à la main sur les bords. Nous gardons les taches : elles racontent l'atelier de reliure qui occupait le lieu."],
  ["rayonnages", "chantier", "2026-10-14", "Le menuisier a posé les premiers rayonnages", "La première travée est montée. Elle sert de gabarit pour toutes les autres : hauteur de rayon, profondeur, espace pour les couvertures de face. Nous avons passé une matinée à tester la hauteur idéale pour un enfant de sept ans."],
  ["sélection", "librairie", "2026-10-02", "Comment nous choisissons les livres", "Pas de best-sellers par défaut : chaque livre en rayon doit avoir été lu, ou recommandé par quelqu'un en qui nous avons confiance. Résultat, un fonds plus petit mais cohérent, et des libraires capables d'en parler."],
  ["café", "cafe", "2026-09-21", "Un café, mais lequel ?", "Après trente dégustations, nous avons retenu un torréfacteur de la région. Une seule recette, bien faite, plutôt que quinze moyennes. Le lait végétal est local aussi."],
  ["voisins", "quartier", "2026-09-09", "Rencontre avec les commerçants de la rue", "Le fromager, la coiffeuse et le cordonnier sont venus voir le chantier. Nous leur avons promis de ne pas faire de bruit avant 9 heures, et de ne jamais bloquer le trottoir."],
  ["nom", "librairie", "2026-08-18", "Pourquoi « Maison Verrière » ?", "Parce que la lumière entre par le haut, et que nous voulions un lieu qui ressemble à une maison plutôt qu'à un magasin. Le mot « maison » a aussi une longue histoire dans l'édition."],
];
const FAQ = [
  ["Quand ouvrez-vous exactement ?", "Le 15 mars 2027 à 9 heures, si le chantier tient son calendrier. Le compte à rebours de cette page suit cette date ; elle sera mise à jour en cas de report."],
  ["À quoi sert la liste d'attente ?", "Elle vous prévient le jour de l'ouverture, vous invite à la soirée des voisins du 27 février et donne un accès prioritaire aux premières rencontres d'auteurs."],
  ["Mes données seront-elles utilisées pour de la publicité ?", "Non. Votre adresse sert uniquement à vous écrire à propos de l'ouverture, et vous pouvez vous désinscrire à tout moment."],
  ["Peut-on réserver un événement privé ?", "Pas avant l'ouverture. Écrivez-nous via le formulaire de contact : nous vous répondrons dès que le planning sera fixé."],
  ["Les livres seront-ils vendus en ligne ?", "Pas au début. Nous préférons d'abord bien accueillir en rayon. Un service de commande par téléphone est prévu."],
];
const AVANTAGES = [["La nouvelle en premier", "Un message le jour de l'ouverture, avant l'annonce publique."], ["La soirée des voisins", "Une invitation à la préouverture du 27 février, places limitées."], ["Le premier café offert", "Un bon à présenter au comptoir le jour J."], ["Les coulisses", "Un billet par quinzaine sur l'avancement du chantier."]];

const IC = {
  arr: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
};
const ic = (k) => `<svg class="pf-ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const ART = `<svg class="pf-art" viewBox="0 0 320 260" role="img" aria-label="Dessin d'une verrière au-dessus d'étagères de livres"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M30 120L160 24l130 96"/><path d="M60 98v34h200V98M100 70v62M160 46v86M220 70v62"/><rect x="30" y="132" width="260" height="102"/><path d="M30 164h260M30 198h260"/></g><g fill="currentColor"><rect x="44" y="140" width="10" height="22"/><rect x="58" y="144" width="8" height="18"/><rect x="70" y="138" width="12" height="24"/><rect x="132" y="142" width="9" height="20"/><rect x="146" y="138" width="11" height="24"/><rect x="214" y="144" width="10" height="18"/><rect x="228" y="140" width="9" height="22"/><rect x="50" y="174" width="12" height="24"/><rect x="66" y="178" width="9" height="20"/><rect x="170" y="172" width="11" height="26"/><rect x="186" y="176" width="9" height="22"/><rect x="238" y="170" width="12" height="28"/><rect x="100" y="208" width="10" height="26"/><rect x="114" y="212" width="12" height="22"/><rect x="200" y="206" width="11" height="28"/></g></svg>`;

const header = (c) => `<header class="pf-head pk-bleed"><div class="pf-w pf-head-in">
<a class="pf-brand" href="/" aria-label="${esc(c.brand)} — accueil"><span class="pf-brand-m" aria-hidden="true">MV</span><span class="pf-brand-n">Maison Verrière</span></a>
<div class="pf-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "pf-nl")}</div>
<p class="pf-mini" aria-hidden="true"><span>J-</span><b data-cd="d">—</b></p></div></header>`;
const footer = (c) => `<footer class="pf-foot pk-bleed"><div class="pf-w pf-foot-in">
<div class="pf-foot-a"><p class="pf-foot-h">Colophon</p><p>Maison Verrière, 12 rue des Tanneurs, 69001 Lyon — <i>adresse fictive</i>. Librairie-café en préparation, ouverture prévue le 15 mars 2027. Ce site de démonstration ne présente aucun lieu réel.</p></div>
<div class="pf-foot-b"><a href="/projet">Le projet</a><a href="/calendrier">Calendrier</a><a href="/journal">Journal de chantier</a><a href="/attente">Liste d'attente</a></div>
<div class="pf-foot-b"><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a><a href="/blocs">Éléments de page</a></div></div>
<p class="pf-folio">— <span data-folio>1</span> —</p></footer>`;
const head = (rom, kicker, title, lead) => sec(`<section class="pf-ph pk-bleed"><div class="pf-w"><p class="pf-kicker" data-reveal><span class="pf-rom">${rom}</span>${esc(kicker)}</p><div class="pf-h1" role="heading" aria-level="1" data-reveal>${title}</div>${lead ? `<p class="pf-lead" data-reveal>${esc(lead)}</p>` : ""}</div></section>`);
const btn = (label, url, cls = "") => `<a class="pf-btn ${cls}" href="${url}">${esc(label)} ${ic("arr")}</a>`;
const cadran = (id = "") => `<div class="pf-cad" role="timer" aria-label="Compte à rebours avant l'ouverture" data-launch="${LAUNCH}" data-start="${START}" ${id}>
<div class="pf-cad-u"><b data-cd="d">—</b><span>jours</span></div><div class="pf-cad-u"><b data-cd="h">—</b><span>heures</span></div><div class="pf-cad-u"><b data-cd="m">—</b><span>minutes</span></div><div class="pf-cad-u"><b data-cd="s">—</b><span>secondes</span></div>
<p class="pf-cad-done" data-done hidden>C'est ouvert ! Les portes sont ouvertes, venez nous voir.</p></div>`;
const jalon = (j, i) => `<li class="pf-j" data-date="${j[0]}"><span class="pf-j-n" aria-hidden="true">${ROMAN[i]}</span><time class="pf-j-d" datetime="${j[0]}">${dlong(j[0])}</time><h3 class="pf-j-t">${esc(j[1])}</h3><p class="pf-j-x">${esc(j[2])}</p><span class="pf-j-s" data-state>à venir</span></li>`;
const billet = (b) => `<details class="pf-b" data-tag="${b[1]}"><summary><time datetime="${b[2]}">${dlong(b[2])}</time><span class="pf-b-t">${esc(b[3])}</span><span class="pf-b-g">${esc(b[1] === "cafe" ? "café" : b[1])}</span></summary><p>${esc(b[4])}</p></details>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="pf-hero pk-bleed"><div class="pf-w pf-hero-in"><div class="pf-hero-l"><p class="pf-kicker" data-reveal><span class="pf-rom">Préface</span>Lyon · printemps 2027</p>
<div class="pf-h1 pf-h1--home" role="heading" aria-level="1" data-reveal>Maison Verrière <em>ouvre bientôt.</em></div>
<p class="pf-lead" data-reveal>Une librairie-café sous une verrière, dans un ancien atelier de reliure. Douze mille livres, un seul café, et une table pour chaque lecteur.</p>${cadran()}
<div class="pf-prog" data-reveal><div class="pf-prog-b" aria-hidden="true"><i data-elapsed></i></div><p><b data-pct>0 %</b> du chemin parcouru depuis la signature du bail (<span data-nextj>prochaine étape : pose des rayonnages</span>)</p></div>
<div class="pf-actions" data-reveal>${btn("Rejoindre la liste d'attente", "/attente")}${btn("Suivre le chantier", "/journal", "pf-btn--g")}</div></div>
<div class="pf-hero-r" aria-hidden="true">${ART}<p class="pf-spine">Maison Verrière — 2027</p></div></div></section>`),
  { type: "form", heading: "Être prévenu(e) le jour de l'ouverture", intro: "Laissez votre adresse : un seul message le jour J, et une invitation à la soirée des voisins. Désinscription possible à tout moment." },
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w pf-two"><div><p class="pf-kicker" data-reveal><span class="pf-rom">I</span>Avant-propos</p><h2 class="pf-h2" data-reveal>Un lieu pour lire sans se presser</h2></div>
<div class="pf-prose" data-reveal><p class="pf-drop">Nous avons longtemps cherché un endroit où l'on puisse feuilleter un livre sans qu'on nous presse, boire un café sans écran allumé, et rencontrer quelqu'un dont le métier est de conseiller.</p><p>Maison Verrière est ce lieu. Elle ouvre dans un atelier du centre de Lyon, avec une verrière qui éclaire les tables de lecture, un comptoir de café, et une petite salle pour les rencontres d'auteurs.</p><p><a class="pf-more" href="/projet">Lire le projet en entier ${ic("arr")}</a></p></div></div></section>`),
  sec(`<section class="pf-sec pf-sec--alt pk-bleed"><div class="pf-w"><p class="pf-kicker" data-reveal><span class="pf-rom">II</span>Ce qui vous attend</p><ul class="pf-trois">${[["Douze mille livres", "Choisis un à un, dont mille titres d'éditeurs indépendants."], ["Un seul café", "Une recette de torréfacteur régional, bien faite, avec du lait végétal local."], ["Une salle de rencontres", "Vingt-quatre places, une lecture ou un atelier chaque semaine."]].map((x, i) => `<li data-reveal><span class="pf-n">0${i + 1}</span><h3 class="pf-h3">${esc(x[0])}</h3><p>${esc(x[1])}</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w"><div class="pf-bt"><div><p class="pf-kicker"><span class="pf-rom">III</span>Journal de chantier</p><h2 class="pf-h2">Les dernières nouvelles</h2></div><a class="pf-more" href="/journal">Tout le journal ${ic("arr")}</a></div>
<ul class="pf-bl">${BILLETS.slice(0, 3).map((b) => `<li data-reveal><time datetime="${b[2]}">${dlong(b[2])}</time><h3 class="pf-h3">${esc(b[3])}</h3><p>${esc(b[4].slice(0, 130))}…</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="pf-cta pk-bleed"><div class="pf-w pf-cta-in"><div><h2 class="pf-h2">Soyez les premiers à pousser la porte.</h2><p class="pf-lead">La liste d'attente ouvre l'accès à la soirée des voisins du 27 février.</p></div>${btn("S'inscrire", "/attente", "pf-btn--w")}</div></section>`),
  sec(footer(c)),
];

const projet = (c) => [
  sec(header(c)),
  head("I", "Le projet", "Pourquoi ouvrir une librairie en 2027", "Quatre ans de préparation, deux associés, une conviction : on lit mieux dans un lieu qui donne envie de rester."),
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w pf-art-in"><aside class="pf-side" aria-label="Fiche du projet"><dl><dt>Lieu</dt><dd>Lyon 1er, rue des Tanneurs (fictive)</dd><dt>Surface</dt><dd>280 m² sous verrière</dd><dt>Équipe</dt><dd>Cinq personnes à l'ouverture</dd><dt>Ouverture</dt><dd>15 mars 2027</dd></dl>${ART}</aside>
<article class="pf-prose pf-prose--long"><h2>Une rencontre, deux métiers</h2><p class="pf-drop">Clémence a passé quinze ans en maison d'édition ; Mathieu a dirigé un café associatif pendant huit ans. Ils se sont rencontrés à un salon du livre, devant un stand où personne ne s'arrêtait. Ils ont décidé d'en faire un lieu.</p><p>Le projet tient en une idée simple : réunir ce que chacun fait de mieux. Les livres, choisis avec exigence ; le café, servi avec soin ; un accueil qui ne pousse jamais à acheter.</p>
<blockquote><p>Un bon libraire n'est pas celui qui vend le plus, mais celui qui permet de trouver le livre qu'on ne savait pas chercher.</p><cite>Clémence, cofondatrice (personnage fictif)</cite></blockquote>
<h2>Ce que nous voulons éviter</h2><ul><li>Des rayons identiques à ceux de toutes les librairies.</li><li>Une musique qui couvre les conversations.</li><li>Des tables trop serrées pour poser un livre ouvert.</li></ul>
<h2>Ce que nous voulons construire</h2><ol><li>Un fonds de douze mille titres, renouvelé chaque saison.</li><li>Une salle de rencontres ouverte aux associations du quartier.</li><li>Une carte de café courte, locale, de saison.</li></ol>
<aside class="pf-note"><b>À savoir.</b> Ce projet est une démonstration : le lieu, les personnes et les dates n'existent pas. Le thème Préface convient à toute ouverture, lancement de produit ou événement.</aside>
<p><a class="pf-more" href="/calendrier">Voir le calendrier du chantier ${ic("arr")}</a></p></article></div></section>`),
  sec(footer(c)),
];

const calendrier = (c) => [
  sec(header(c)),
  head("II", "Calendrier", "Les étapes jusqu'à l'ouverture", "Les jalons passés sont cochés automatiquement d'après la date du jour ; le prochain est mis en avant."),
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w">${cadran()}<ol class="pf-jl" data-jalons>${JALONS.map(jalon).join("")}</ol><p class="pf-fine">Dates prévisionnelles, sous réserve d'aléas de chantier. La date d'ouverture se règle dans le bloc du compte à rebours (attribut <code>data-launch</code>) ou par le réglage « Report » du thème.</p></div></section>`),
  sec(footer(c)),
];

const journal = (c) => [
  sec(header(c)),
  head("III", "Journal de chantier", "Des nouvelles toutes les deux semaines", "Six billets pour suivre l'avancement. Cliquez sur un titre pour le lire en entier."),
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w"><div class="pf-filt" data-filters role="group" aria-label="Filtrer par thème"><a class="pf-chip is-on" href="#tous" role="button" data-tag="tous" aria-pressed="true">Tous</a>${[["chantier", "chantier"], ["librairie", "librairie"], ["cafe", "café"], ["quartier", "quartier"]].map(([t, l]) => `<a class="pf-chip" href="#${t}" role="button" data-tag="${t}" aria-pressed="false">${l}</a>`).join("")}</div>
<div class="pf-bj" data-list>${BILLETS.map(billet).join("")}</div><p class="pf-empty" data-empty hidden>Aucun billet pour ce thème.</p></div></section>`),
  sec(footer(c)),
];

const attente = (c) => [
  sec(header(c)),
  head("IV", "Liste d'attente", "Rejoindre la liste d'attente", "Un seul message le jour de l'ouverture, une invitation à la soirée des voisins, aucune publicité."),
  { type: "form", heading: "Je m'inscris", intro: "Le formulaire fonctionne comme sur un vrai site ; dans cette démonstration, aucune liste réelle n'est alimentée." },
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w"><p class="pf-kicker"><span class="pf-rom">V</span>Ce que vous recevez</p><ul class="pf-av">${AVANTAGES.map((a) => `<li data-reveal>${ic("ok")}<div><b>${esc(a[0])}</b><span>${esc(a[1])}</span></div></li>`).join("")}</ul>
<p class="pf-kicker"><span class="pf-rom">VI</span>Questions fréquentes</p><div class="pf-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div></section>`),
  sec(footer(c)),
];

const blocs = (c) => [
  sec(header(c)),
  head("VII", "Éléments de page", "Titres, listes, citations, tableaux", "Tous les blocs de rédaction dans le style du thème."),
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w"><article class="pf-prose pf-prose--long">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec du <strong>gras</strong>, de l'<em>italique</em>, un <a href="/projet">lien</a>, du <code>code en ligne</code> et une <mark>mise en évidence</mark>. Le texte courant reste à 17 px minimum, sur une ligne de 60 à 75 caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote><p>Une citation est composée en grand, comme un épigraphe en tête de chapitre.</p><cite>Autrice fictive</cite></blockquote>
<figure class="pf-fig">${ART}<figcaption>Illustration avec légende : un dessin en ligne, texte alternatif fourni.</figcaption></figure>
<div class="pf-tw"><table><caption>Tableau défilant sur mobile</caption><thead><tr><th scope="col">Jalon</th><th scope="col">Date</th><th scope="col">État</th><th scope="col">Remarque</th></tr></thead><tbody><tr><td>Travaux</td><td>14 septembre 2026</td><td>Commencé</td><td>Dans les temps</td></tr><tr><td>Ouverture</td><td>15 mars 2027</td><td>À venir</td><td>Sous réserve</td></tr></tbody></table></div>
<pre class="pf-pre"><code>data-launch="2027-03-15T09:00:00+01:00"</code></pre>
<p class="pf-actions">${btn("Bouton principal", "/attente")}${btn("Bouton secondaire", "/projet", "pf-btn--g")}</p>
<div class="pf-cols"><div><h3>Colonne 1</h3><p>Deux colonnes côte à côte, empilées sur mobile.</p></div><div><h3>Colonne 2</h3><p>Chaque colonne garde une mesure de lecture confortable.</p></div></div>
<aside class="pf-note"><b>Note.</b> Un encadré d'information.</aside><aside class="pf-note pf-note--w"><b>Attention.</b> Un encadré de mise en garde.</aside>
</article></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  head("VIII", "Contact", "Écrire à l'équipe", "Une question avant l'ouverture, une proposition d'événement, une demande de presse : nous répondons à chacun."),
  { type: "form", heading: "Votre message", intro: "Le formulaire fonctionne comme sur un vrai site ; dans cette démonstration, aucun message n'est lu par une équipe réelle." },
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w pf-two"><div><h2 class="pf-h3">Presse</h2><p>Un dossier de presse sera disponible un mois avant l'ouverture. Écrivez-nous pour le recevoir.</p></div><div><h2 class="pf-h3">Auteurs et éditeurs</h2><p>Nous lisons toutes les propositions de rencontre. Précisez le titre, la date de parution et la durée souhaitée.</p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  head("IX", "Recherche", "Rechercher dans le site", "Une date, une étape, un billet du journal : tapez un mot."),
  { type: "layout", children: [{ type: "search", props: { target: "catalogue", placeholder: "Rechercher une étape, un billet…", button: "Chercher" } }] },
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w"><div class="pf-none"><span class="pf-none-i" aria-hidden="true">∅</span><div><h2 class="pf-h2">Aucun résultat ?</h2><p>Essayez un mot plus court. Vous pouvez aussi parcourir <a href="/calendrier">le calendrier</a>, <a href="/journal">le journal de chantier</a> ou <a href="/projet">le projet</a>, ou <a href="/contact">nous écrire</a>.</p></div></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="pf-404 pk-bleed"><div class="pf-w"><p class="pf-big404" aria-hidden="true">404</p><p class="pf-kicker"><span class="pf-rom">Erratum</span>Page non trouvée</p><div class="pf-h1" role="heading" aria-level="1">Cette page n'est pas encore écrite</div><p class="pf-lead">L'adresse n'existe pas, ou pas encore. Comme la librairie, elle est peut-être en travaux.</p><div class="pf-actions">${btn("Retour à l'accueil", "/")}${btn("Le calendrier", "/calendrier", "pf-btn--g")}${btn("Liste d'attente", "/attente", "pf-btn--g")}</div></div></section>`),
  sec(footer(c)),
];
const legal = (rom, kicker, title, items) => (c) => [
  sec(header(c)),
  head(rom, kicker, title, "Texte de démonstration, à adapter par l'éditeur réel du site."),
  sec(`<section class="pf-sec pk-bleed"><div class="pf-w"><article class="pf-prose pf-prose--long">${items.map(([t, p]) => `<h2>${esc(t)}</h2><p>${p}</p>`).join("")}<p><a href="/contact">Une question ? Écrivez-nous.</a></p></article></div></section>`),
  sec(footer(c)),
];
const mentions = legal("X", "Mentions", "Mentions légales", [
  ["Éditeur", "Ce site de démonstration annonce l'ouverture d'un lieu fictif, « Maison Verrière ». Remplacez ces lignes par la raison sociale, l'adresse, le numéro d'immatriculation et le capital de votre structure."],
  ["Direction de la publication", "Une personne fictive, joignable par le <a href=\"/contact\">formulaire de contact</a>."],
  ["Hébergement", "Indiquez ici le nom, l'adresse et les coordonnées de l'hébergeur réel du site."],
  ["Propriété intellectuelle", "Les textes, dessins et mises en page de la démonstration sont fournis pour illustrer le thème."],
  ["Dates annoncées", "Les dates sont indicatives et peuvent évoluer. Elles ne constituent pas un engagement contractuel."],
]);
const confidentialite = legal("XI", "Confidentialité", "Politique de confidentialité", [
  ["Liste d'attente", "En vous inscrivant, vous nous confiez votre adresse e-mail (et votre prénom si vous le souhaitez) pour vous prévenir de l'ouverture. Rien d'autre."],
  ["Finalité et base légale", "Votre consentement, donné par l'inscription. Vous pouvez le retirer à tout moment en écrivant via le <a href=\"/contact\">formulaire de contact</a>."],
  ["Durée de conservation", "Les adresses sont supprimées trois mois après l'ouverture, sauf si vous demandez à rester informé(e)."],
  ["Vos droits", "Accès, rectification, suppression, opposition : écrivez-nous. Vous pouvez aussi saisir l'autorité de contrôle compétente."],
  ["Mesure d'audience", "Le compte à rebours fonctionne dans votre navigateur et ne dépose aucun cookie."],
]);

module.exports = {
  key: "preface", name: "Préface", version: "1.0.0", category: "evenement", tags: ["editorial", "chaleureux", "moderne"], siteType: "Page « bientôt disponible » / préouverture", collection: "pro",
  concept: "L'avant-propos d'un livre pour annoncer une ouverture : chiffres géants d'un vrai compte à rebours, sections en chiffres romains, jalons cochés selon la date du jour, liste d'attente par formulaire.",
  description: "Page de préouverture : papier pêche, encre indigo, compte à rebours réel vers une date réglable, barre d'avancement, calendrier de jalons, journal de chantier filtrable, liste d'attente et FAQ.",
  brand: "Maison Verrière", modules: ["formulaires", "recherche"],
  contentModel: "La date d'ouverture se règle dans l'attribut data-launch du bloc « cadran » (éditable) et par le réglage « report » en jours ; jalons et billets sont écrits dans les pages du thème. La liste d'attente est le formulaire du CMS.",
  dna: {
    header: "logo-monogramme-liens-sobres-et-mini-compteur-j-moins-en-coin",
    hero: "chiffres-geants-du-compte-a-rebours-sur-papier-peche-avec-dessin-de-verriere",
    grid: "colonne-de-titre-et-colonne-de-texte-en-alternance-comme-un-avant-propos",
    typo: "league-spartan-geante-pour-les-chiffres-et-vollkorn-pour-l-avant-propos",
    shapes: "filets-fins-chiffres-romains-lettrine-et-boutons-a-coins-droits",
    motion: "secondes-qui-defilent-barre-d-avancement-et-jalons-qui-se-cochent",
    rhythm: "chapitres-en-chiffres-romains-et-numeros-de-page-en-pied",
    signature: "compte-a-rebours-reel-a-date-reglable-jalons-selon-la-date-du-jour-et-liste-d-attente",
    palette: "papier-peche-encre-indigo-et-vermillon-et-variante-nuit",
    image: "dessin-en-ligne-de-verriere-et-etageres-sans-photographie",
    list: "frise-verticale-de-jalons-numerotes-en-romain-avec-etat-fait-ou-a-venir",
    article: "avant-propos-en-colonne-etroite-avec-fiche-du-projet-et-lettrine",
    sidebar: "fiche-du-projet-en-marge-gauche-avec-dessin-sur-la-page-projet",
    reading: "vollkorn-17-px-ligne-de-62-caracteres-lettrine-et-epigraphes",
  },
  tokens: {
    colors: { primary: "#2a1b6e", secondary: "#1a1240", accent: "#b13412", background: "#fdeedc", surface: "#fff8ee", text: "#1a1240", muted: "#5a4f78", success: "#13803f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.league-spartan", body: "font.vollkorn", button: "font.league-spartan", link: "font.vollkorn" },
    radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#1a1240" },
    type: { h1: { size: 64, weight: 700, lineHeight: 1.02, transform: "none" }, h2: { size: 36, weight: 600, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Encre (couleur principale)", type: "color", default: "#2a1b6e" },
    { key: "vermillon", label: "Vermillon (accent)", type: "color", default: "#b13412" },
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "jour", choices: [["jour", "Papier pêche"], ["nuit", "Nuit indigo"]] },
    { key: "entete", label: "En-tête", type: "choice", default: "centre", choices: [["centre", "Logo centré"], ["colonne", "Logo à gauche, liens à droite"], ["minimal", "Minimal, compteur seul"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "colophon", choices: [["colophon", "Colophon en colonnes"], ["mince", "Mince, une ligne"]] },
    { key: "liste", label: "Calendrier des jalons", type: "choice", default: "frise", choices: [["frise", "Frise verticale"], ["cartes", "Cartes"], ["tableau", "Tableau"]] },
    { key: "cadran", label: "Compte à rebours", type: "choice", default: "geant", choices: [["geant", "Chiffres géants"], ["cartes", "Cartes séparées"], ["ligne", "Une seule ligne"]] },
    { key: "report", label: "Reporter l'ouverture (jours)", type: "range", default: "0", min: 0, max: 120 },
  ],
  menu: [["Accueil", "/"], ["Le projet", "/projet"], ["Calendrier", "/calendrier"], ["Journal", "/journal"], ["Liste d'attente", "/attente"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "projet", name: "Le projet", render: projet }, { key: "calendrier", name: "Calendrier des jalons", render: calendrier },
    { key: "journal", name: "Journal de chantier", render: journal }, { key: "attente", name: "Liste d'attente", render: attente }, { key: "blocs", name: "Éléments de page", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite },
  ],
};
