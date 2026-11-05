// Encre — studio de tatouage. Direction artistique : un carnet de flashs tracés au trait noir gras sur papier os, rouge vermillon et un peu de teal.
// Navigation en tampons encreurs, hero = planche de flashs épinglée qui se tamponne, grille en planches numérotées, portfolio filtrable par artiste et par style
// avec fiche, et demande de projet guidée (zone, taille, style, disponibilités) dont le récapitulatif part vers /contact.
const { sec, esc } = require("../kit");

// ---------- Les dessins « flash » (SVG, trait gras) ----------
// Couleurs par classes (pilotées par les options) : en-r vermillon, en-t teal, en-b os, en-y ocre, en-k encre.
const wing = `<path class="en-b" d="M48 52C30 8 4 14 4 42 4 60 28 64 48 62Z"/><path class="en-t" d="M48 64C32 66 16 86 24 100 38 108 50 88 48 64Z"/><circle class="en-r" cx="26" cy="38" r="9"/><circle class="en-k" cx="26" cy="38" r="3.5"/>`;
const SERP = "M30 114C86 104 84 84 42 74 8 64 18 46 56 42";
const D = {
  dague: `<circle class="en-r" cx="50" cy="12" r="7"/><rect class="en-t" x="45" y="19" width="10" height="24" rx="2"/><path d="M45 26h10M45 33h10"/><path class="en-y" d="M24 46Q50 36 76 46L72 55Q50 48 28 55Z"/><path class="en-b" d="M41 56h18l-2 40-7 18-7-18Z"/><path d="M50 58v50"/><path class="en-r" d="M14 82q6-14 15-5-4 11-15 5zM86 82q-6-14-15-5 4 11 15 5z"/>`,
  rose: `<path class="en-r" d="M50 18C70 12 88 28 82 50 78 68 60 80 44 76 24 70 14 50 22 34 28 22 40 18 50 18Z"/><path d="M50 36C63 34 69 48 59 57 49 65 36 56 40 46 44 38 54 42 52 49"/><path d="M24 40c10 4 14 12 12 22M80 38c-8 2-14 8-14 16M46 77c4-8 14-12 24-10"/><path class="en-t" d="M50 98C36 86 22 90 18 102 32 108 44 106 50 98ZM50 98c14-12 28-8 32 4-14 6-26 4-32-4Z"/><path d="M50 78v38"/>`,
  serpent: `<path d="${SERP}" stroke-width="17"/><path class="en-ts" d="${SERP}" stroke-width="10"/><path class="en-dash" d="${SERP}" stroke="#f6f0e0" stroke-width="10"/><g transform="translate(62 38) rotate(-12)"><ellipse class="en-t" rx="14" ry="10"/><circle class="en-y" cx="3" cy="-3" r="3"/><circle class="en-k" cx="3" cy="-3" r="1.2"/><path class="en-rs" d="M14 0h13m-7 0 6-5m-6 5 6 5"/></g><path class="en-rs" d="M34 106l10-6M52 98l9-7"/>`,
  ancre: `<circle cx="50" cy="16" r="8"/><path d="M34 34h32M50 24v78"/><path d="M18 68c2 34 62 34 64 0"/><path class="en-r" d="M10 72l10-14 10 18zM90 72L80 58 70 76z"/><path class="en-ts" d="M50 40c18 6 18 18 0 22s-18 14 0 20" stroke-width="6"/>`,
  main: `<rect class="en-b" x="31" y="14" width="10" height="42" rx="5"/><rect class="en-b" x="43" y="6" width="10" height="48" rx="5"/><rect class="en-b" x="55" y="10" width="10" height="44" rx="5"/><rect class="en-b" x="67" y="20" width="10" height="38" rx="5"/><path class="en-b" d="M30 52h48v26q0 24-24 28-24-4-24-28Z"/><path class="en-b" d="M32 74 14 56q-6-8 2-12 7-3 12 4l12 14Z"/><path class="en-r" d="M30 104h48v14H30Z"/><path class="en-b" d="M38 82q16-16 32 0-16 16-32 0Z"/><circle class="en-t" cx="54" cy="82" r="6"/><circle class="en-k" cx="54" cy="82" r="2.2"/><path d="M54 66v-6M42 70l-4-5M66 70l4-5"/>`,
  coeur: `<path class="en-y" d="M50 34C40 24 46 14 50 4 54 14 60 24 50 34Z"/><path class="en-r" d="M50 100C14 76 8 50 26 38 40 30 50 38 50 46 50 38 60 30 74 38 92 50 86 76 50 100Z"/><path class="en-hl" d="M28 48c-6 6-6 14-2 22" stroke-width="2.5"/><path class="en-b" d="M6 82Q28 72 50 82T94 82V98Q72 108 50 98T6 98Z"/><path class="en-dot" d="M24 90h52"/>`,
  hirondelle: `<path class="en-t" d="M50 50C54 28 70 12 96 8 86 24 82 40 84 58Z"/><path class="en-t" d="M6 56C20 42 44 42 62 52L98 76 76 74 90 100 58 76C40 80 20 74 6 56Z"/><path class="en-b" d="M16 62c14 12 30 14 44 8-12-2-26-6-44-8Z"/><path class="en-r" d="M7 56c5 6 12 10 20 10l-3-14z"/><circle class="en-k" cx="22" cy="53" r="2"/>`,
  papillon: `<g>${wing}</g><g transform="translate(100 0) scale(-1 1)">${wing}</g><ellipse class="en-k" cx="50" cy="66" rx="5" ry="26"/><path d="M47 40C44 28 36 22 28 24M53 40C56 28 64 22 72 24"/>`,
  oeil: `<path class="en-b" d="M6 68Q50 24 94 68Q50 112 6 68Z"/><circle class="en-t" cx="50" cy="68" r="18"/><circle class="en-k" cx="50" cy="68" r="7"/><circle class="en-hl2" cx="45" cy="62" r="3"/><path d="M50 8v18M22 18l9 14M78 18l-9 14M6 42l16 8M94 42l-16 8"/><path class="en-r" d="M50 96c-8 8-8 16 0 20 8-4 8-12 0-20Z"/>`,
};
const flash = (k, st = "oldschool", extra = "") => `<svg class="en-svg en-s-${st} ${extra}" viewBox="0 0 100 120" aria-hidden="true"><g class="en-ln" fill="none" stroke="#15110e" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">${D[k]}</g></svg>`;
const arrow = `<svg class="en-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h16m-6-7 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const needle = `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 82 70 30"/><path d="M62 22l16 16"/><path d="M70 14l16 16"/><circle cx="14" cy="86" r="4"/></g></svg>`;

// ---------- Données ----------
const STYLES = [
  ["oldschool", "Old school", "Contours épais, aplats francs, palette courte : le tatouage de marin, lisible de loin et fait pour durer.", "Dague, rose, ancre"],
  ["japonais", "Japonais", "Grands motifs qui épousent le corps, vagues, écailles et fleurs, travaillés en séances successives.", "Serpent, pivoine, dragon"],
  ["fineline", "Fineline", "Un trait d'une seule épaisseur, très fin, pour les motifs délicats : botanique, lettrage, petits animaux.", "Phalène, hirondelle"],
  ["blackwork", "Blackwork", "Du noir plein, des silhouettes nettes et des motifs graphiques qui jouent sur le contraste.", "Silhouettes, ornements"],
  ["realisme", "Réalisme", "Dégradés de gris et volumes : un regard, un objet, une main, traités comme un dessin au fusain.", "Regard, mains, objets"],
];
const SNAME = Object.fromEntries(STYLES.map((s) => [s[0], s[1]]));
const ARTISTS = [
  { k: "maelle", n: "Maëlle Roux", short: "Maëlle", role: "Old school et couleurs franches", styles: ["oldschool"], since: "12 ans de métier", bio: "Formée chez un tatoueur de port, Maëlle dessine des flashs à l'ancienne : roses, ancres, hirondelles, cœurs flamboyants. Ses planches sont numérotées et reprises chaque saison.", nextday: "Mardi 18", tools: "Aiguilles groupées, encres vives, calque à la main", flash: "rose" },
  { k: "ravi", n: "Ravi Menon", short: "Ravi", role: "Japonais et grandes pièces", styles: ["japonais", "blackwork"], since: "9 ans de métier", bio: "Ravi construit de grandes compositions : serpents, pivoines, vagues. Il commence toujours par un entretien sur la zone du corps et la façon dont le dessin accompagnera le mouvement.", nextday: "Jeudi 20", tools: "Pochoirs découpés, séances de quatre heures", flash: "serpent" },
  { k: "soren", n: "Soren Lund", short: "Soren", role: "Fineline et botanique", styles: ["fineline", "blackwork"], since: "6 ans de métier", bio: "Un trait unique, très fin, pour des motifs légers : phalènes, hirondelles, branches. Soren recommande de venir avec une idée simple et de la laisser respirer sur la peau.", nextday: "Vendredi 21", tools: "Aiguille unique, dessin à main levée", flash: "hirondelle" },
  { k: "ines", n: "Inès Carvalho", short: "Inès", role: "Réalisme et blackwork", styles: ["realisme", "blackwork"], since: "10 ans de métier", bio: "Inès travaille les gris et les noirs profonds : un regard, une main, une silhouette. Chaque pièce commence par un échange sur les références et la lumière du dessin.", nextday: "Samedi 22", tools: "Dégradés de gris, noirs pleins, séances longues", flash: "oeil" },
];
// [id, dessin, style, artiste, titre, zone, taille, séances]
const P = [
  [1, "dague", "oldschool", "maelle", "Dague porte-bonheur", "Avant-bras", "12 cm", "1 séance"],
  [2, "rose", "oldschool", "maelle", "Rose du port", "Épaule", "14 cm", "1 séance"],
  [3, "ancre", "oldschool", "maelle", "Ancre de marin", "Mollet", "16 cm", "1 séance"],
  [4, "coeur", "oldschool", "maelle", "Cœur flamboyant", "Bras", "11 cm", "1 séance"],
  [5, "serpent", "japonais", "ravi", "Serpent de rivière", "Cuisse", "35 cm", "3 séances"],
  [6, "oeil", "japonais", "ravi", "Œil du dragon", "Torse", "18 cm", "2 séances"],
  [7, "rose", "japonais", "ravi", "Pivoine d'été", "Épaule", "22 cm", "2 séances"],
  [8, "ancre", "blackwork", "ravi", "Ancre noire", "Avant-bras", "15 cm", "1 séance"],
  [9, "papillon", "fineline", "soren", "Phalène de nuit", "Poignet", "7 cm", "1 séance"],
  [10, "hirondelle", "fineline", "soren", "Hirondelle fine", "Clavicule", "9 cm", "1 séance"],
  [11, "rose", "fineline", "soren", "Rose botanique", "Cheville", "8 cm", "1 séance"],
  [12, "dague", "blackwork", "soren", "Lame noire", "Avant-bras", "13 cm", "1 séance"],
  [13, "oeil", "realisme", "ines", "Regard de nuit", "Bras", "16 cm", "2 séances"],
  [14, "main", "realisme", "ines", "Main ouverte", "Mollet", "20 cm", "2 séances"],
  [15, "serpent", "realisme", "ines", "Couleuvre au fusain", "Avant-bras", "24 cm", "2 séances"],
  [16, "papillon", "blackwork", "ines", "Phalène noire", "Dos", "18 cm", "1 séance"],
  [17, "main", "blackwork", "ines", "Main protectrice", "Cuisse", "17 cm", "1 séance"],
  [18, "coeur", "blackwork", "ines", "Cœur noir", "Torse", "10 cm", "1 séance"],
].map(([id, d, s, a, t, z, m, n]) => ({ id, d, s, a, t, z, m, n }));
const artistOf = (k) => ARTISTS.find((a) => a.k === k);
const num = (n) => String(n).padStart(2, "0");

const card = (p, cls = "") => `<article class="en-pc ${cls}" data-a="${p.a}" data-s="${p.s}" data-id="${p.id}" data-t="${esc(p.t)}" data-z="${p.z}" data-m="${p.m}" data-n="${p.n}" data-reveal>
  <a class="en-pc-in" href="#planche-${p.id}" aria-label="${esc(p.t)}, ${SNAME[p.s]}, par ${artistOf(p.a).short}"><span class="en-pc-no">N° ${num(p.id)}</span><span class="en-pc-art">${flash(p.d, p.s)}</span><span class="en-pc-cap"><b>${esc(p.t)}</b><i>${SNAME[p.s]} · ${artistOf(p.a).short}</i></span></a></article>`;
const cardLite = (p) => `<article class="en-pc en-pc--lite" data-reveal><a class="en-pc-in" href="/portfolio#${p.a}" aria-label="${esc(p.t)}, ${SNAME[p.s]}"><span class="en-pc-no">N° ${num(p.id)}</span><span class="en-pc-art">${flash(p.d, p.s)}</span><span class="en-pc-cap"><b>${esc(p.t)}</b><i>${SNAME[p.s]} · ${artistOf(p.a).short}</i></span></a></article>`;

// ---------- Morceaux de page ----------
const seal = `<svg class="en-seal" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#d93a1c" class="en-r" stroke="#15110e" stroke-width="3.5"/><circle cx="32" cy="32" r="23" fill="none" stroke="#f6f0e0" stroke-width="1.6" class="en-dsh3"/><g transform="translate(17 8) scale(.3)" fill="none" stroke="#15110e" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"><path fill="#f6f0e0" d="M41 56h18l-2 40-7 18-7-18Z"/><path fill="#e3ac3d" d="M24 46Q50 36 76 46L72 55Q50 48 28 55Z"/><rect fill="#f6f0e0" x="45" y="19" width="10" height="24" rx="2"/><circle fill="#f6f0e0" cx="50" cy="12" r="7"/></g></svg>`;
const stamps = (menu, cur) => menu.map((m, i) => `<a class="en-st en-st${i % 4}${m.url === cur ? " is-cur" : ""}"${m.url === cur ? ' aria-current="page"' : ""} href="${esc(m.url)}">${esc(m.label)}</a>`).join("");
const header = (c, cur = "/") => `<header class="en-head pk-bleed"><div class="en-head-in">
  <a class="en-logo" href="/" aria-label="${esc(c.brand)} — accueil">${seal}<span class="en-logo-t">Encre<small>studio de tatouage</small></span></a>
  <div class="en-stamps" role="navigation" aria-label="Navigation principale">${stamps(c.menu, cur)}</div>
  <details class="en-burger"><summary aria-label="Ouvrir le menu"><span class="en-bur-t">Menu</span><span class="en-bur-l" aria-hidden="true"><i></i><i></i><i></i></span></summary>
    <div class="en-drawer" role="navigation" aria-label="Menu mobile">${stamps(c.menu, cur)}<a class="en-st en-st-cta" href="/recherche">Rechercher</a></div></details>
</div></header>`;
const footer = (c) => `<footer class="en-foot pk-bleed"><div class="en-foot-in"><div class="en-foot-brand"><div class="en-foot-logo">${seal}<span>Encre</span></div><p>Quatre artistes, cinq styles, des flashs dessinés à la main. Sur rendez-vous, du mardi au samedi.</p><address>14 rue des Forges, 33000 Bordeaux (adresse fictive)</address></div>
  <div><h2 class="en-foot-h">Le studio</h2><div class="en-fl-col">${c.menu.slice(1, 5).map((m) => `<a class="en-fl" href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div>
  <div><h2 class="en-foot-h">Plus</h2><div class="en-fl-col"><a class="en-fl" href="/contact">Contact</a><a class="en-fl" href="/recherche">Recherche</a><a class="en-fl" href="/projet">Demander un projet</a></div></div></div>
  <p class="en-legal">© Encre — site de démonstration. Artistes, dessins, horaires et adresse fictifs ; aucune réservation ni paiement n'est possible ici. Les conseils de soin sont généraux : en cas de doute, voyez un professionnel de santé.</p></footer>`;

const pagehead = (kicker, title, sub, flashKey, st = "oldschool") => sec(`<section class="en-ph pk-bleed"><div class="en-wrap en-ph-in"><div><p class="en-k" data-reveal>${esc(kicker)}</p><div class="en-title" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="en-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>
  <div class="en-ph-sheet" aria-hidden="true"><span class="en-pin"></span><span class="en-tape"></span>${flash(flashKey, st)}</div></div></section>`);

const sechead = (k, title, lead) => `<div class="en-sechead"><p class="en-k" data-reveal>${esc(k)}</p><h2 class="en-h2" data-reveal>${title}</h2>${lead ? `<p class="en-lead" data-reveal>${esc(lead)}</p>` : ""}</div>`;

// ---------- Accueil ----------
const SHEET = [["rose", "oldschool", "Rose"], ["dague", "oldschool", "Dague"], ["serpent", "japonais", "Serpent"], ["ancre", "oldschool", "Ancre"], ["coeur", "oldschool", "Cœur"], ["main", "realisme", "Main"], ["hirondelle", "fineline", "Hirondelle"], ["papillon", "blackwork", "Phalène"], ["oeil", "japonais", "Œil"]];
const home = (c) => [
  sec(header(c, "/")),
  sec(`<section class="en-hero pk-bleed"><div class="en-wrap en-hero-in">
    <div class="en-hero-copy"><p class="en-k" data-reveal>Studio de tatouage · sur rendez-vous</p>
      <div class="en-title en-title--hero" role="heading" aria-level="1" data-reveal>Le trait noir<br>fait foi.</div>
      <p class="en-lead en-lead--hero" data-reveal>Quatre artistes, cinq styles et une planche de flashs qui change chaque mois. Choisissez un dessin déjà tracé, ou venez avec le vôtre.</p>
      <div class="en-actions" data-reveal><a class="en-btn" href="/portfolio">Voir le portfolio ${arrow}</a><a class="en-btn en-btn--line" href="/projet">Demander un projet</a></div>
      <p class="en-hero-note" data-reveal>Tous les dessins sont originaux et numérotés. Matériel à usage unique, dossier de soin remis à chaque séance.</p></div>
    <div class="en-board" data-board><div class="en-sheet en-sheet--back" aria-hidden="true"><span class="en-pin"></span><svg viewBox="0 0 120 150"><g class="en-dsh" fill="none" stroke="#15110e" stroke-width="1.6" stroke-linecap="round"><path d="M60 14v100M40 40h40M44 114l16 24 16-24"/><circle cx="60" cy="22" r="8"/></g></svg><p>Croquis au crayon<br>avant le trait définitif</p></div>
      <div class="en-sheet"><span class="en-pin"></span><span class="en-tape en-tape--l"></span><span class="en-tape en-tape--r"></span>
        <p class="en-sheet-h"><span>Planche n° 12</span><span>Flash du mois</span></p>
        <ul class="en-flashes">${SHEET.map(([k, s, n], i) => `<li class="en-fl-c"><span class="en-fl-no">${num(i + 1)}</span>${flash(k, s)}<span class="en-fl-n">${n}</span></li>`).join("")}</ul>
        <div class="en-stampbig" aria-hidden="true"><span>Disponible</span><i>sur rendez-vous</i></div></div></div></div></section>`),
  sec(`<section class="en-sec en-sec--ink pk-bleed"><div class="en-wrap">${sechead("Du papier à la peau", "Trois gestes, dans l'ordre", "Un tatouage commence sur le papier. Vous voyez le dessin avant d'avoir une aiguille sur la peau.")}
    <ol class="en-gestes">${[["Le croquis", "On parle de l'idée, de la zone et de la taille. L'artiste trace au crayon, puis au feutre noir.", `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 80 24 62 70 16l14 14-46 46Z"/><path d="M62 24l14 14M20 80l16-4"/></g></svg>`], ["Le calque", "Le dessin est décalqué sur la peau. Vous placez, on ajuste, on recule d'un pas pour juger.", `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><rect class="en-dsh2" x="18" y="16" width="64" height="68" rx="4"/><path d="M34 62c8-24 24-24 32 0M50 30v14"/></g></svg>`], ["La séance", "Aiguille neuve, gants neufs, pauses à la demande. Le soin vous est expliqué avant de partir.", needle]].map(([t, p, ic], i) => `<li data-reveal><span class="en-geste-ic">${ic}</span><span class="en-geste-n">${i + 1}</span><h3>${t}</h3><p>${p}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="en-sec pk-bleed"><div class="en-wrap">${sechead("Portfolio", "Les planches du moment")}
    <div class="en-grid en-grid--home">${[3, 5, 9, 14, 2, 12].map((id) => cardLite(P.find((p) => p.id === id))).join("")}</div>
    <p class="en-more" data-reveal><a class="en-btn en-btn--line" href="/portfolio">Toutes les planches (18) ${arrow}</a></p></div></section>`),
  sec(`<section class="en-sec en-sec--paper2 pk-bleed"><div class="en-wrap">${sechead("Cinq styles", "Chaque trait a sa famille", "Le même dessin ne se tatoue pas de la même façon selon le style. Voici comment lire le portfolio.")}
    <div class="en-styles">${STYLES.map(([k, n, t, ex], i) => `<a class="en-style" href="/portfolio#${k}" data-reveal><span class="en-style-art">${flash(["rose", "serpent", "papillon", "dague", "oeil"][i], k)}</span><span class="en-style-b"><b>${n}</b><span>${t}</span><i>${ex}</i></span></a>`).join("")}</div></div></section>`),
  sec(`<section class="en-sec pk-bleed"><div class="en-wrap">${sechead("L'équipe", "Quatre mains, quatre manières")}
    <div class="en-team">${ARTISTS.map((a) => `<a class="en-tc" href="/artistes#${a.k}" data-reveal><span class="en-tc-art">${flash(a.flash, a.styles[0])}</span><b>${a.n}</b><span>${a.role}</span><i>Voir la fiche ${arrow}</i></a>`).join("")}</div></div></section>`),
  sec(`<section class="en-cta pk-bleed"><div class="en-wrap en-cta-in"><div><p class="en-k en-k--w" data-reveal>Une idée en tête ?</p><h2 class="en-h2 en-h2--w" data-reveal>Racontez-nous votre projet en quatre questions.</h2><p class="en-lead en-lead--w" data-reveal>Zone du corps, taille, style, disponibilités : le formulaire guidé prépare un message clair, que vous nous envoyez ensuite.</p></div><a class="en-btn en-btn--paper" href="/projet" data-reveal>Commencer ${arrow}</a></div></section>`),
  sec(footer(c)),
];

// ---------- Portfolio ----------
const chip = (grp, v, label, on) => `<a class="en-chip${on ? " is-on" : ""}" href="#${v}" role="button" aria-pressed="${on ? "true" : "false"}" data-f="${grp}" data-v="${v}">${label}</a>`;
const portfolio = (c) => [
  sec(header(c, "/portfolio")),
  pagehead("18 planches", "Le<br>portfolio", "Filtrez par artiste et par style, puis ouvrez une planche pour lire sa fiche : zone, taille, nombre de séances.", "dague", "oldschool"),
  sec(`<section class="en-sec en-sec--tight pk-bleed" data-folio><div class="en-wrap">
    <div class="en-filters"><div class="en-fgroup"><p class="en-fl-l">Artiste</p><div class="en-chips" role="group" aria-label="Filtrer par artiste">${chip("a", "all", "Tous", true)}${ARTISTS.map((a) => chip("a", a.k, a.short, false)).join("")}</div></div>
      <div class="en-fgroup"><p class="en-fl-l">Style</p><div class="en-chips" role="group" aria-label="Filtrer par style">${chip("s", "all", "Tous", true)}${STYLES.map(([k, n]) => chip("s", k, n, false)).join("")}</div></div></div>
    <p class="en-count" aria-live="polite"><b data-count-n>18</b> <span data-count-t>planches affichées</span> <a class="en-reset" href="#reset" data-reset hidden>Tout afficher</a></p>
    <div class="en-folio"><div class="en-grid" data-grid>${P.slice(0, 9).map((p) => card(p)).join("")}</div>
      <p class="en-empty" data-empty hidden>Aucune planche pour ce croisement. Essayez un autre style ou revenez à « Tous ».</p>
</div></div></section>`),
  sec(`<section class="en-sec en-sec--tight pk-bleed" data-folio2><div class="en-wrap"><div class="en-grid" data-grid2>${P.slice(9).map((p) => card(p)).join("")}</div>
      <aside class="en-fiche" data-fiche aria-label="Fiche" aria-live="polite"><div class="en-fiche-in" data-fiche-body><p class="en-k">Fiche</p><p class="en-fiche-h">Choisissez une planche</p><p>Touchez une planche pour voir sa fiche, ou un artiste pour lire son parcours.</p></div>
        ${ARTISTS.map((a) => `<div class="en-fiche-in" data-ac="${a.k}" hidden><p class="en-k">Artiste</p><p class="en-fiche-h">${a.n}</p><p class="en-fiche-role">${a.role} · ${a.since}</p><p>${a.bio}</p><dl class="en-dl"><div><dt>Styles</dt><dd>${a.styles.map((s) => SNAME[s]).join(", ")}</dd></div><div><dt>Méthode</dt><dd>${a.tools}</dd></div><div><dt>Prochain créneau</dt><dd>${a.nextday} (démonstration)</dd></div></dl><a class="en-btn en-btn--sm" href="/projet">Demander un projet ${arrow}</a></div>`).join("")}</aside></div></section>`),
  sec(`<section class="en-sec en-sec--paper2 pk-bleed"><div class="en-wrap en-howto">${sechead("Comment lire une planche", "Un dessin, un numéro, une fiche")}<div class="en-howto-g"><article data-reveal><h3>Le numéro</h3><p>Chaque dessin du carnet porte un numéro. Citez-le dans votre message : l'artiste retrouve la planche tout de suite.</p></article><article data-reveal><h3>La taille</h3><p>Elle est donnée à titre indicatif. Un même dessin peut être agrandi ou réduit selon la zone choisie.</p></article><article data-reveal><h3>Les séances</h3><p>Une pièce de petite taille se fait en une séance. Les grandes compositions sont découpées en plusieurs rendez-vous.</p></article></div>
    <p class="en-more" data-reveal><a class="en-btn" href="/projet">Préparer ma demande ${arrow}</a></p></div></section>`),
  sec(footer(c)),
];

// ---------- Artistes ----------
const artistes = (c) => [
  sec(header(c, "/artistes")),
  pagehead("Quatre artistes", "L'équipe<br>du studio", "Chacun a ses styles, son rythme et sa façon de préparer une pièce. Lisez les fiches, puis choisissez avec qui parler.", "main", "realisme"),
  sec(`<section class="en-sec en-sec--tight pk-bleed"><div class="en-wrap en-arts">${ARTISTS.map((a, i) => {
    const mine = P.filter((p) => p.a === a.k).slice(0, 3);
    return `<article class="en-art${i % 2 ? " en-art--r" : ""}" data-anchor="${a.k}" data-reveal><div class="en-art-card"><span class="en-pin"></span><span class="en-art-ini" aria-hidden="true">${a.short[0]}</span><span class="en-art-big">${flash(a.flash, a.styles[0])}</span><p class="en-art-no">Carte n° ${i + 1}</p></div>
      <div class="en-art-body"><p class="en-k">${a.role}</p><h2 class="en-h2 en-h2--s">${a.n}</h2><p class="en-art-since">${a.since} · ${a.styles.map((s) => SNAME[s]).join(" · ")}</p><p>${a.bio}</p>
      <dl class="en-dl"><div><dt>Méthode</dt><dd>${a.tools}</dd></div><div><dt>Prochain créneau</dt><dd>${a.nextday} (démonstration)</dd></div></dl>
      <div class="en-art-mini">${mine.map((p) => `<span>${flash(p.d, p.s)}</span>`).join("")}</div>
      <div class="en-actions"><a class="en-btn en-btn--sm" href="/portfolio#${a.k}">Ses planches ${arrow}</a><a class="en-btn en-btn--sm en-btn--line" href="/projet">Lui écrire un projet</a></div></div></article>`;
  }).join("")}</div></section>`),
  sec(`<section class="en-sec en-sec--ink pk-bleed"><div class="en-wrap">${sechead("Dans le studio", "Les règles de la maison")}
    <ul class="en-rules">${[["Matériel à usage unique", "Aiguilles, tubes et gants sont neufs et ouverts devant vous."], ["Surfaces protégées", "Film de protection sur tout ce qui se touche, nettoyage entre chaque client."], ["Pas de séance sous pression", "Vous pouvez arrêter ou faire une pause à tout moment."], ["Accord avant l'aiguille", "Le dessin et son emplacement sont validés ensemble avant de commencer."]].map(([t, p], i) => `<li data-reveal><span class="en-rule-n">${i + 1}</span><h3>${t}</h3><p>${p}</p></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

// ---------- Soins et conseils ----------
const PHASES = [
  ["avant", "Avant", "La veille", "Dormez bien, mangez normalement et buvez de l'eau. Évitez l'alcool la veille et le jour même : il fluidifie le sang et rend la séance plus inconfortable.", ["Portez des vêtements amples qui dégagent la zone.", "Hydratez la peau les jours précédents, sans coup de soleil.", "Apportez une collation et de quoi vous distraire."]],
  ["jour", "Jour J", "Après la séance", "L'artiste pose un film protecteur. Gardez-le le temps indiqué, puis lavez la zone doucement à l'eau tiède et au savon doux, et séchez en tamponnant.", ["Ne grattez pas, ne frottez pas.", "Un film fin de crème cicatrisante suffit, pas plus.", "Évitez les vêtements serrés sur la zone."]],
  ["sem1", "Jours 2 à 7", "La croûte fine", "La peau tire, rougit un peu et pèle comme après un coup de soleil. C'est normal. Lavez matin et soir, puis crème en couche très fine.", ["Pas de bain, pas de piscine, pas de mer.", "Pas de soleil direct sur la zone.", "Laissez tomber les petites peaux toutes seules."]],
  ["sem4", "Semaines 2 à 4", "Les démangeaisons", "La peau peut gratter et paraître terne : le dessin « blanchit » avant de reprendre ses couleurs. Hydratez, tapotez plutôt que gratter.", ["Reprenez le sport doux si la zone ne frotte pas.", "Évitez la salle de bain trop chaude.", "Notez ce que vous voudriez retoucher."]],
  ["mois", "Après un mois", "La suite", "La peau a cicatrisé en surface, la cicatrisation profonde continue. Protégez le tatouage du soleil avec un écran haute protection, tous les étés.", ["Regardez le résultat avec l'artiste si une retouche vous semble utile.", "Hydratez régulièrement.", "Repérez un grain de beauté qui change : consultez."]],
];
const soins = (c) => [
  sec(header(c, "/soins")),
  pagehead("Soins et conseils", "Prendre soin<br>de l'encre", "Avant, pendant et après : le calendrier d'une cicatrisation tranquille. Conseils généraux de démonstration.", "coeur", "oldschool"),
  sec(`<section class="en-sec en-sec--tight pk-bleed" data-care><div class="en-wrap">${sechead("Le calendrier", "De la veille au premier mois")}
    <div class="en-care"><div class="en-care-tabs" role="tablist" aria-label="Étapes du soin">${PHASES.map(([k, n, , ], i) => `<a class="en-ct${i === 0 ? " is-on" : ""}" href="#${k}" role="tab" aria-selected="${i === 0}" data-i="${i}"><span class="en-ct-n">${i + 1}</span>${n}</a>`).join("")}</div>
      <div class="en-care-panels">${PHASES.map(([k, n, sub, p, li], i) => `<article class="en-cp" data-i="${i}"${i ? " hidden" : ""} role="tabpanel"><p class="en-k">${sub}</p><h3 class="en-cp-h">${n}</h3><p class="en-cp-p">${p}</p><ul class="en-ticks">${li.map((x) => `<li>${x}</li>`).join("")}</ul></article>`).join("")}
        <div class="en-care-nav"><a class="en-btn en-btn--sm en-btn--line" href="#prec" data-prev>Étape précédente</a><a class="en-btn en-btn--sm" href="#suiv" data-next>Étape suivante ${arrow}</a></div></div></div></div></section>`),
  sec(`<section class="en-sec pk-bleed"><div class="en-wrap">${sechead("Le résumé", "À faire, à éviter")}
    <div class="en-dd"><article class="en-dd-do" data-reveal><h3><span class="en-dd-ic" aria-hidden="true">+</span>À faire</h3><ul class="en-ticks"><li>Laver à l'eau tiède et au savon doux</li><li>Sécher en tamponnant avec du papier propre</li><li>Appliquer une crème en couche fine</li><li>Boire de l'eau, dormir, manger</li></ul></article>
    <article class="en-dd-no" data-reveal><h3><span class="en-dd-ic" aria-hidden="true">×</span>À éviter</h3><ul class="en-crosses"><li>Gratter ou arracher les petites peaux</li><li>Bains, piscine, hammam les premiers jours</li><li>Soleil direct et cabine de bronzage</li><li>Crème en couche épaisse qui étouffe la peau</li></ul></article></div></div></section>`),
  sec(`<section class="en-sec en-sec--paper2 pk-bleed"><div class="en-wrap en-faq">${sechead("Questions fréquentes", "On vous répond")}<div>
    <details data-reveal><summary>Est-ce que ça fait mal ?</summary><p>Cela dépend de la zone, de la taille et de chacun. L'avant-bras se supporte souvent mieux que les côtes ou le pied. Les pauses sont toujours possibles.</p></details>
    <details data-reveal><summary>Puis-je faire du sport ?</summary><p>Du sport doux, oui, si la zone ne frotte pas et reste propre. Évitez la salle de sport le premier jour et les bains les premières semaines.</p></details>
    <details data-reveal><summary>Quand reprendre le soleil ?</summary><p>Évitez le soleil direct tant que la peau pèle. Ensuite, un écran haute protection protège les couleurs et les noirs dans la durée.</p></details>
    <details data-reveal><summary>Une zone est rouge, chaude, ou suinte ?</summary><p>Une légère rougeur est normale les premiers jours. Si elle s'étend, si la zone chauffe, gonfle ou suinte, ou si vous avez de la fièvre, consultez un professionnel de santé sans attendre.</p></details></div></div></section>`),
  sec(footer(c)),
];

// ---------- Demande de projet ----------
const ZONES = ["Cou et nuque", "Épaule", "Bras", "Avant-bras", "Poignet et main", "Torse", "Dos", "Cuisse", "Mollet", "Cheville et pied"];
const SIZES = [["petit", "Petit", "jusqu'à 8 cm", "Une pièce de monnaie à une carte de crédit", "1 à 2 h"], ["moyen", "Moyen", "9 à 15 cm", "La largeur d'une paume", "2 à 3 h"], ["grand", "Grand", "16 à 30 cm", "Un avant-bras ou un mollet", "4 à 6 h, parfois 2 séances"], ["tresgrand", "Très grand", "plus de 30 cm", "Manche, dos, cuisse entière", "Plusieurs séances"]];
const DAYS = ["Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const SLOTS = ["Matin", "Après-midi", "Soirée"];
const body = `<svg class="en-body" viewBox="0 0 120 240" role="img" aria-label="Silhouette du corps avec la zone choisie en surbrillance"><g fill="none" stroke="#15110e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
  <circle cx="60" cy="20" r="14" fill="#f6f0e0"/>
  <rect class="en-z" data-z="Cou et nuque" x="53" y="33" width="14" height="12" rx="4"/>
  <path class="en-z" data-z="Épaule" d="M36 48q8-6 17-3l-3 20H30q-2-12 6-17ZM84 48q-8-6-17-3l3 20h20q2-12-6-17Z"/>
  <rect class="en-z" data-z="Torse" x="48" y="46" width="24" height="52" rx="8"/>
  <path class="en-z" data-z="Dos" d="M42 100h36l-2 10H44Z"/>
  <rect class="en-z" data-z="Bras" x="22" y="64" width="14" height="32" rx="7"/><rect class="en-z" data-z="Bras" x="84" y="64" width="14" height="32" rx="7"/>
  <rect class="en-z" data-z="Avant-bras" x="18" y="98" width="13" height="38" rx="6.5" transform="rotate(4 24 98)"/><rect class="en-z" data-z="Avant-bras" x="89" y="98" width="13" height="38" rx="6.5" transform="rotate(-4 96 98)"/>
  <circle class="en-z" data-z="Poignet et main" cx="22" cy="146" r="9"/><circle class="en-z" data-z="Poignet et main" cx="98" cy="146" r="9"/>
  <path class="en-z" data-z="Cuisse" d="M44 112h31l-3 52H49Z" transform="translate(0 0)"/>
  <rect class="en-z" data-z="Mollet" x="50" y="168" width="20" height="40" rx="8"/>
  <path class="en-z" data-z="Cheville et pied" d="M50 210h20l6 14H44Z"/></g></svg>`;
const opt = (grp, v, inner, cls = "") => `<a class="en-opt ${cls}" href="#${grp}-${esc(v).replace(/[^a-z0-9]+/gi, "").toLowerCase()}" role="button" aria-pressed="false" data-g="${grp}" data-v="${esc(v)}">${inner}</a>`;
const projet = (c) => [
  sec(header(c, "/projet")),
  pagehead("Demande de projet", "Votre idée,<br>en quatre étapes", "Zone, taille, style, disponibilités : on prépare un message clair pour l'artiste. Rien n'est enregistré ici.", "ancre", "oldschool"),
  sec(`<section class="en-sec en-sec--tight pk-bleed" data-wiz><div class="en-wrap">
    <ol class="en-prog" aria-label="Étapes">${["Zone", "Taille", "Style", "Disponibilités"].map((n, i) => `<li><a class="en-pg${i === 0 ? " is-on" : ""}" href="#etape-${i + 1}" data-go="${i}"><span>${i + 1}</span>${n}</a></li>`).join("")}</ol>
    <div class="en-wiz"><div class="en-steps">
      <section class="en-step is-on" data-step="0"><h2 class="en-h3">1. Où sur le corps ?</h2><p class="en-step-p">Choisissez la zone principale. La silhouette la met en évidence.</p><div class="en-zonewrap">${body}<div class="en-opts en-opts--chips">${ZONES.map((z) => opt("zone", z, esc(z))).join("")}</div></div></section>
      <section class="en-step" data-step="1"><h2 class="en-h3">2. Quelle taille ?</h2><p class="en-step-p">Une indication suffit : l'artiste affinera avec vous.</p><div class="en-opts en-opts--cards">${SIZES.map(([k, n, r, e], i) => opt("taille", n + " (" + r + ")", `<span class="en-sz en-sz${i + 1}" aria-hidden="true"></span><b>${n}</b><span>${r}</span><i>${e}</i>`, "en-opt--card")).join("")}</div></section>
      <section class="en-step" data-step="2"><h2 class="en-h3">3. Quel style ?</h2><p class="en-step-p">Pas sûr ? Choisissez celui qui vous parle le plus.</p><div class="en-opts en-opts--cards">${STYLES.map(([k, n, t]) => opt("style", n, `<span class="en-opt-art">${flash({ oldschool: "ancre", japonais: "serpent", fineline: "papillon", blackwork: "dague", realisme: "oeil" }[k], k)}</span><b>${n}</b><span>${t}</span>`, "en-opt--card")).join("")}</div></section>
      <section class="en-step" data-step="3"><h2 class="en-h3">4. Quand êtes-vous disponible ?</h2><p class="en-step-p">Plusieurs choix possibles. Le studio reçoit du mardi au samedi.</p><p class="en-grp-l">Jours</p><div class="en-opts en-opts--chips">${DAYS.map((d) => opt("jours", d, d, "en-opt--multi")).join("")}</div><p class="en-grp-l">Moment de la journée</p><div class="en-opts en-opts--chips">${SLOTS.map((d) => opt("moments", d, d, "en-opt--multi")).join("")}</div></section>
      <div class="en-wiz-nav"><a class="en-btn en-btn--line en-btn--sm" href="#prec" data-prev hidden>Retour</a><a class="en-btn en-btn--sm" href="#suiv" data-next>Étape suivante ${arrow}</a></div></div>
    <aside class="en-recap" data-recap aria-label="Récapitulatif" aria-live="polite"><div class="en-recap-in"><p class="en-k">Récapitulatif</p><h2 class="en-recap-h">Votre demande</h2>
      <dl class="en-rdl"><div><dt>Zone</dt><dd data-r="zone">à choisir</dd></div><div><dt>Taille</dt><dd data-r="taille">à choisir</dd></div><div><dt>Style</dt><dd data-r="style">à choisir</dd></div><div><dt>Disponibilités</dt><dd data-r="dispo">à choisir</dd></div></dl>
      <p class="en-recap-est" data-est hidden></p>
      <a class="en-btn en-btn--block" href="/contact" data-send>Envoyer ma demande ${arrow}</a><a class="en-btn en-btn--line en-btn--block en-btn--sm" href="#copier" data-copy hidden>Copier le récapitulatif</a>
      <p class="en-fine">Aucune demande n'est envoyée d'ici : le récapitulatif se place dans le formulaire de contact, où vous ajoutez votre description et vos références.</p></div></aside></div></div></section>`),
  sec(footer(c)),
];

// ---------- Contact, recherche, introuvable ----------
const contact = (c) => [
  sec(header(c, "/contact")),
  pagehead("Écrire au studio", "Contact", "Une question, une idée, un dessin à nous montrer ? Nous répondons sous deux jours ouvrés.", "papillon", "fineline"),
  { type: "form", heading: "Envoyer un message", intro: "Pour une demande de projet, collez le récapitulatif préparé sur la page « Demande de projet » et ajoutez votre description." },
  sec(`<section class="en-sec en-sec--tight pk-bleed"><div class="en-wrap en-cards3"><article class="en-note" data-reveal><h3>Le studio</h3><address>14 rue des Forges<br>33000 Bordeaux (adresse fictive)</address><p>Mardi au samedi, 11 h à 19 h, sur rendez-vous.</p></article><article class="en-note" data-reveal><h3>Premier rendez-vous</h3><p>Apportez vos références : photos, dessins, mots. Nous regardons ensemble avant de tracer.</p><a class="en-more" href="/projet">Préparer ma demande ${arrow}</a></article><article class="en-note" data-reveal><h3>Après la séance</h3><p>Un doute sur la cicatrisation ? Relisez le calendrier de soins.</p><a class="en-more" href="/soins">Voir les conseils ${arrow}</a></article></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [sec(header(c, "/recherche")), pagehead("Rechercher", "Une envie ?", "Un style, un artiste, un dessin, un conseil : cherchez sur tout le site.", "oeil", "japonais"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rose, fineline, soin, Maëlle…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c, "")), sec(`<section class="en-404 pk-bleed"><div class="en-wrap en-404-in"><div><p class="en-k">Erreur 404</p><div class="en-title en-title--404" role="heading" aria-level="1">Planche<br>effacée.</div><p class="en-ph-sub">Cette page n'existe pas ou a changé de place dans le carnet. Revenons aux dessins.</p><div class="en-actions"><a class="en-btn" href="/">Retour à l'accueil ${arrow}</a><a class="en-btn en-btn--line" href="/portfolio">Voir le portfolio</a></div></div>
  <div class="en-lost" aria-hidden="true"><span class="en-pin"></span>${flash("dague", "oldschool")}<span class="en-strike"></span><div class="en-stampbig en-stampbig--static"><span>Effacé</span></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "encre", name: "Encre", version: "2.0.0", category: "beaute", tags: ["audacieux", "ludique", "classique"], siteType: "Studio de tatouage", featured: true,
  concept: "Un carnet de flashs au trait noir gras : une planche de dessins épinglés qui se tamponne, des tampons pour naviguer, un portfolio filtrable par artiste et par style et une demande de projet guidée.",
  description: "Studio de tatouage sur papier os, noir encre, rouge vermillon et teal : planche de flashs SVG qui se tamponne, menu en tampons, portfolio filtrable par artiste et style avec fiche, demande de projet guidée envoyée par message.",
  brand: "Encre Studio de tatouage", modules: ["formulaires", "recherche"],
  dna: { header: "menu-de-tampons-encreurs-inclines", hero: "planche-de-flashs-epinglee-qui-se-tamponne", grid: "planches-de-flashs-a-cases-numerotees", motion: "tampons-qui-claquent-et-encre-qui-se-pose", shapes: "trait-noir-gras-scotch-epingles-et-tampons-ronds", rhythm: "feuillets-os-et-encre-alternes-en-planches-numerotees", signature: "portfolio-par-artiste-et-style-avec-fiche-et-demande-de-projet-guidee" },
  tokens: {
    colors: { primary: "#d93a1c", secondary: "#1b7f7a", accent: "#e3ac3d", background: "#f1ead9", surface: "#f8f3e6", text: "#15110e", muted: "#4f463c", success: "#1c6b3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.pirata-one", body: "font.chivo", button: "font.staatliches", link: "font.chivo" },
    radius: { sm: 2, md: 4, lg: 6, button: 3, field: 3, card: 4 }, shadow: { card: "5px 5px 0 #15110e", button: "3px 3px 0 #15110e" }, border: { width: 3, color: "#15110e" },
    type: { h1: { size: 88, weight: 400, lineHeight: 0.95, transform: "none" }, h2: { size: 52, weight: 400, lineHeight: 1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge vermillon", type: "color", default: "#d93a1c" },
    { key: "teal", label: "Teal", type: "color", default: "#1b7f7a" },
    { key: "paper", label: "Papier", type: "choice", default: "os", choices: [["os", "Os"], ["blanc", "Blanc cassé"], ["kraft", "Kraft clair"]] },
    { key: "dots", label: "Trame pointillée du carnet", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masquée"]] },
    { key: "tilt", label: "Tampons inclinés", type: "choice", default: "on", choices: [["on", "Inclinés"], ["off", "Droits"]] },
  ],
  menu: [["Accueil", "/"], ["Portfolio", "/portfolio"], ["Artistes", "/artistes"], ["Soins", "/soins"], ["Projet", "/projet"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "portfolio", name: "Portfolio", render: portfolio }, { key: "artistes", name: "Artistes", render: artistes },
    { key: "soins", name: "Soins et conseils", render: soins }, { key: "projet", name: "Demande de projet", render: projet }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
