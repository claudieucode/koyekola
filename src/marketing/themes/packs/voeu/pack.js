// Vœu — mariage et événementiel. Direction artistique : faire-part romantique. Crème, blush, vert olive et filet de cuivre ; cadres et cartouches, fleurs et branches dessinées au trait,
// script limité aux accents. Signature : compte à rebours + formulaire RSVP guidé (récapitulatif à coller dans le formulaire de contact), cartes de cadeaux et d'hébergements.
const { sec, form, esc } = require("../kit");

// ---------- ornements SVG ----------
const flower = (cx, cy, r, n = 6) => {
  let p = "";
  for (let k = 0; k < n; k++) p += `<ellipse cx="${cx}" cy="${+(cy - r * 0.62).toFixed(1)}" rx="${+(r * 0.3).toFixed(1)}" ry="${+(r * 0.62).toFixed(1)}" transform="rotate(${Math.round((k * 360) / n)} ${cx} ${cy})"/>`;
  return `<g stroke="currentColor" stroke-width="1">${p}<circle cx="${cx}" cy="${cy}" r="${+(r * 0.17).toFixed(1)}" fill="currentColor"/></g>`;
};
const branch = (cls = "") => {
  let g = "";
  for (let i = 0; i < 9; i++) {
    const y = 372 - i * 40, s = i % 2 ? 1 : -1, x = Math.round(100 + Math.sin(i * 0.9) * 9);
    g += `<ellipse cx="${x + s * 17}" cy="${y - 5}" rx="17" ry="6.5" transform="rotate(${s * -32} ${x + s * 17} ${y - 5})"/>`;
  }
  return `<svg class="vo-branch ${cls}" viewBox="0 0 200 400" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M100 396C96 300 112 230 94 130 88 88 98 44 106 6"/>${g}${flower(106, 12, 11, 5)}</svg>`;
};
const corner = () => `<svg class="vo-corner" viewBox="0 0 90 90" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M3 87V32C3 15 15 3 32 3h55"/><path d="M12 87V36c0-13 11-24 24-24h51" opacity=".45"/>${flower(31, 31, 13, 5)}<ellipse cx="52" cy="14" rx="9" ry="3.4" transform="rotate(12 52 14)"/><ellipse cx="14" cy="53" rx="9" ry="3.4" transform="rotate(78 14 53)"/></svg>`;
const divider = () => `<svg class="vo-div" viewBox="0 0 260 28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M4 14h96M160 14h96"/><circle cx="108" cy="14" r="1.6" fill="currentColor"/><circle cx="152" cy="14" r="1.6" fill="currentColor"/>${flower(130, 14, 11, 6)}</svg>`;
const rings = (cls = "") => `<svg class="${cls}" viewBox="0 0 80 52" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="30" cy="28" r="18"/><circle cx="50" cy="28" r="18"/><path d="M24 8l4-6 4 6-4 5z" fill="#9a5a3033" stroke-width="1.2"/></svg>`;
const arch = () => `<svg class="vo-archsvg" viewBox="0 0 320 400" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M16 396V170a144 144 0 0 1 288 0v226z"/><path d="M30 396V172a130 130 0 0 1 260 0v224z" opacity=".45"/>
  <g transform="translate(0 34)">${flower(70, 380, 18)}${flower(250, 380, 18)}${flower(42, 346, 12, 5)}${flower(278, 346, 12, 5)}${flower(100, 360, 10, 5)}${flower(220, 360, 10, 5)}</g>
  <path d="M36 380c4-40 14-70 30-90M284 380c-4-40-14-70-30-90" opacity=".6"/><g transform="translate(120 130) scale(1.1)"><circle cx="30" cy="28" r="18"/><circle cx="50" cy="28" r="18"/></g><path d="M160 70v14M153 77h14" opacity=".7"/></svg>`;
const ICON = {
  door: `<path d="M8 28V14a8 8 0 0 1 16 0v14zM4 28h24M16 14v14"/>`,
  rings: `<circle cx="12" cy="17" r="7"/><circle cx="20" cy="17" r="7"/><path d="M13 6l3-3 3 3-3 3z"/>`,
  glass: `<path d="M8 5h16l-8 13zM16 18v9M11 28h10M10 9h12"/>`,
  plate: `<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="5.5"/><path d="M2 6v8M5 6v8M3.5 14v12M29 6c-2 3-2 8 0 10v10"/>`,
  note: `<path d="M12 24V8l12-3v16"/><circle cx="9" cy="24" r="3.4"/><circle cx="21" cy="21" r="3.4"/>`,
  sun: `<circle cx="16" cy="16" r="5.5"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3"/>`,
  heart: `<path d="M16 27C6 19 4 13 4 10a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 3-2 9-12 17z"/>`,
  gift: `<rect x="5" y="12" width="22" height="15"/><path d="M3 8h26v4H3zM16 8v19M16 8c-4-6-9-4-7 0M16 8c4-6 9-4 7 0"/>`,
  bed: `<path d="M3 24V8M3 20h26v4M29 20v-5a4 4 0 0 0-4-4H12v9"/><circle cx="8" cy="14" r="2.6"/>`,
  pin: `<path d="M16 29C9 20 6 15 6 11a10 10 0 0 1 20 0c0 4-3 9-10 18z"/><circle cx="16" cy="11" r="3.4"/>`,
  car: `<path d="M4 20v-5l3-6h18l3 6v5zM4 20h24M9 24v-4M23 24v-4"/><circle cx="10" cy="17" r="1.4"/><circle cx="22" cy="17" r="1.4"/>`,
};
const ic = (n, cls = "vo-ic") => `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const house = (v) => {
  const body = [
    `<path d="M30 110V60l50-34 50 34v50z"/><path d="M30 60h100M62 110V80h36v30M44 70v10M116 70v10M80 26V10"/>`,
    `<path d="M24 110V64h112v46zM24 64l56-38 56 38M56 110V84h20v26M92 78h30v20H92z"/>`,
    `<path d="M20 110V70l60-44 60 44v40zM20 70h120M40 110V82h24v28M96 82h24v28"/><path d="M80 26v16" />`,
    `<path d="M20 110 80 36l60 74zM48 110h64M80 36v-18M62 90h36"/><path d="M110 110V96M50 110V96" opacity=".5"/>`,
    `<path d="M26 110V74h108v36zM26 74l12-22h84l12 22M52 110V88h22v22M88 84h32v14H88z"/>`,
  ][v % 5];
  return `<svg class="vo-house" viewBox="0 0 160 124" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${body}<path d="M4 112h152" /><g transform="translate(${v % 2 ? 6 : 118} 62)">${flower(16, 24, 12, 5)}<path d="M16 36v46" /></g></svg>`;
};

// ---------- cadre de page ----------
const NAV = (c, cls = "") => c.menu.map(({ label, url }) => `<a${url === "/rsvp" ? ` class="${cls}vo-rsvp-link"` : cls ? ` class="${cls.trim()}"` : ""} href="${esc(url)}">${esc(label)}</a>`).join("");

const header = (c) => `<header class="vo-head pk-bleed">
  <div class="vo-top"><a class="vo-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="vo-mono"><i>C</i><em>&amp;</em><i>A</i></span><span class="vo-logo-t">Camille <em>&amp;</em> Aurèle<small>11 septembre 2027</small></span></a>
    <details class="vo-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="vo-drawer" role="navigation" aria-label="Menu mobile">${NAV(c)}</div></details></div>
  <div class="vo-navwrap"><div class="vo-nav" role="navigation" aria-label="Navigation principale">${NAV(c)}</div></div></header>`;

const footer = (c) => `<footer class="vo-foot pk-bleed"><div class="vo-wrap">${divider()}
  <div class="vo-foot-names" aria-hidden="true">Camille <em>&amp;</em> Aurèle</div><p class="vo-foot-date">Samedi 11 septembre 2027 · Domaine des Tilleuls, Drôme</p>
  <div class="vo-foot-nav" role="navigation" aria-label="Pied de page">${NAV(c)}<a href="/recherche">Recherche</a></div>
  <p class="vo-legal">${esc(c.brand)} — site de démonstration. Couple, domaine, hébergements et messages entièrement fictifs.</p></div></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="vo-ph pk-bleed"><div class="vo-wrap"><p class="vo-kicker" data-reveal>${esc(kicker)}</p><div class="vo-h1" role="heading" aria-level="1" data-reveal>${title}</div>${divider()}${sub ? `<p class="vo-lead" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

// ---------- données ----------
const CHAPTERS = [
  ["I", "door", "15 h 30", "L'accueil", "Les portes du domaine s'ouvrent. Rafraîchissements, ombre des tilleuls et premiers sourires."],
  ["II", "rings", "16 h 30", "La cérémonie", "Sous l'arche fleurie, au bord du verger. Trente minutes pour se dire oui."],
  ["III", "glass", "17 h 30", "Le cocktail", "Bulles, petites bouchées de saison et photos de famille sur la terrasse."],
  ["IV", "plate", "19 h 30", "Le dîner", "Un repas à partager à de longues tables, entre discours et chansons."],
  ["V", "note", "22 h 00", "Le bal", "La première danse, puis la piste est à vous jusqu'au bout de la nuit."],
  ["VI", "sun", "Dim. 11 h", "Le brunch", "On se retrouve en douceur pour un dernier café avant les adieux."],
];
const frise = (n = 6, link = true) => `<ol class="vo-frise">${CHAPTERS.slice(0, n).map(([r, i, t, h, p]) => `<li class="vo-chap" data-reveal><span class="vo-chap-node">${ic(i)}</span><span class="vo-chap-no">Chapitre ${r}</span><b class="vo-chap-t">${t}</b><h3>${h}</h3><p>${p}</p></li>`).join("")}</ol>${link ? `<p class="vo-center"><a class="vo-btn vo-btn--line" href="/programme">Voir le programme complet</a></p>` : ""}`;

const GIFTS = [
  ["Voyage de noces", "heart", "Deux semaines au Japon, entre temples, thé et petits trains de campagne. Chaque contribution fera un kilomètre de plus."],
  ["Un atelier de cuisine", "plate", "Un cours de pâtisserie pour deux, pour que les macarons arrêtent enfin de s'effondrer."],
  ["Le jardin de la maison", "sun", "Rosiers, un olivier et un hamac : de quoi transformer le balcon en petit domaine."],
  ["Une cave pour les amis", "glass", "Quelques bouteilles à déboucher le jour où vous viendrez nous rendre visite."],
];
const giftCards = () => `<div class="vo-cards vo-cards--4">${GIFTS.map(([t, i, p]) => `<article class="vo-card vo-gift" data-reveal>${ic(i, "vo-ic vo-ic--lg")}<h3>${t}</h3><p>${p}</p><a class="vo-more" href="/contact">En parler aux mariés</a></article>`).join("")}</div><p class="vo-note">Aucune obligation : votre présence est notre plus beau cadeau. Les modalités de participation se règlent directement avec nous, par le formulaire de contact.</p>`;

const STAYS = [
  ["Le Domaine des Tilleuls — gîtes", "sur-place", "Sur place", "Douze chambres dans les anciennes dépendances, à deux pas de la salle de réception.", "0 km", 0],
  ["Maison d'hôtes Le Figuier", "proche", "Maison d'hôtes", "Quatre chambres dans une bastide en pierre, petit déjeuner sous la treille.", "4 km", 1],
  ["Hôtel des Platanes", "budget", "Hôtel", "Chambres simples et claires, parking gratuit, idéal pour une nuit à petit budget.", "9 km", 2],
  ["Gîte de la Combe", "groupe", "Gîte de groupe", "Maison de campagne pour huit à douze personnes, cuisine équipée et grande tablée.", "8 km", 3],
  ["Camping des Roches", "budget", "Camping", "Emplacements tente et camping-car près de la rivière, navette possible le soir.", "6 km", 4],
  ["Chambres chez l'habitant, Les Vignes", "proche", "Chambres d'hôtes", "Deux chambres chez des voisins du domaine, accueil chaleureux garanti.", "2 km", 1],
];
const stayCards = (list = STAYS) => list.map(([t, cat, tag, p, d, v]) => `<article class="vo-card vo-stay" data-for="${cat}" data-reveal>${house(v)}<span class="vo-tag">${tag}</span><h3>${t}</h3><p>${p}</p><p class="vo-dist">${ic("pin", "vo-ic vo-ic--sm")} À ${d} du domaine</p><a class="vo-more" href="/contact">Demander les coordonnées</a></article>`).join("");

const MSGS = [
  ["Tante Odile", "famille", "On vous a vus grandir ensemble, ou presque. Hâte de lever mon verre sous les tilleuls !"],
  ["Les copains de la fac", "amis", "On a prévu les chansons, on a prévu les bêtises. Vous êtes prévenus."],
  ["Hélène, collègue", "travail", "Vous formez le duo le plus organisé que je connaisse. Le jour J sera parfait, j'en suis sûre."],
  ["Papi Marcel", "famille", "J'ai gardé ma plus belle cravate. Et une valse pour la mariée, si elle veut bien."],
  ["Inès et Tom", "amis", "Merci de nous avoir présentés l'un à l'autre il y a trois ans. On vous doit tout !"],
  ["L'équipe du jeudi", "travail", "Un grand bravo de toute l'équipe. Promis, personne n'enverra de mail ce week-end-là."],
  ["Cousine Mina", "famille", "J'ai déjà réservé mon train. Prépare les mouchoirs, je pleure à chaque mariage."],
  ["Gaspard", "amis", "Témoin ou pas, je prononcerai un discours. Court. Enfin, assez court."],
];
const msgCard = ([n, c, t], i) => `<blockquote class="vo-post vo-post--${i % 3}" data-for="${c}" data-reveal><span class="vo-stamp" aria-hidden="true">${ic("heart", "vo-ic vo-ic--sm")}</span><p>« ${t} »</p><footer><cite>${n}</cite><small>Message fictif de démonstration</small></footer></blockquote>`;

const countdown = (cls = "") => `<div class="vo-count ${cls}" role="timer" aria-label="Compte à rebours jusqu'au mariage" data-countdown="2027-09-11T16:30:00"><div><b data-u="d">000</b><i>jours</i></div><div><b data-u="h">00</b><i>heures</i></div><div><b data-u="m">00</b><i>minutes</i></div><div><b data-u="s">00</b><i>secondes</i></div></div>`;

const rsvpMount = () => `<div class="vo-rsvp" data-rsvp><p class="vo-note">Le formulaire interactif a besoin de JavaScript. En attendant, répondez-nous directement par le <a href="/contact">formulaire de contact</a> : indiquez votre présence, le nombre de personnes, le menu et les allergies.</p></div>`;

// ---------- pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="vo-hero pk-bleed"><div class="vo-petals" aria-hidden="true"></div>${branch("vo-hero-l")}${branch("vo-hero-r")}
    <div class="vo-frame"><span class="vo-fc vo-fc--tl">${corner()}</span><span class="vo-fc vo-fc--tr">${corner()}</span><span class="vo-fc vo-fc--bl">${corner()}</span><span class="vo-fc vo-fc--br">${corner()}</span>
      <p class="vo-kicker" data-reveal>Nous nous marions</p>
      <div class="vo-names" role="heading" aria-level="1" data-reveal><span>Camille</span><em class="vo-amp">&amp;</em><span>Aurèle</span></div>
      ${divider()}
      <p class="vo-date" data-reveal><time datetime="2027-09-11">Samedi 11 septembre 2027</time></p>
      <p class="vo-place" data-reveal>${ic("pin", "vo-ic vo-ic--sm")} Domaine des Tilleuls · Saint-Loup-de-la-Vigne, Drôme</p></div>
    <div class="vo-hero-low" data-reveal><p class="vo-hero-lbl">Dans exactement</p>${countdown()}<div class="vo-actions"><a class="vo-btn" href="/rsvp">Répondre à l'invitation</a><a class="vo-btn vo-btn--line" href="/programme">Le programme</a></div></div></section>`),
  sec(`<section class="vo-invite pk-bleed"><div class="vo-wrap vo-narrow">${rings("vo-rings")}<h2 class="vo-h2" data-reveal>Avec joie, nous vous invitons</h2>
    <p class="vo-lead" data-reveal>Après sept ans de rires, de voyages et de dîners ratés, nous voulons célébrer avec ceux qui comptent. Un week-end à la campagne, dans un domaine d'été aux tilleuls centenaires.</p>
    <dl class="vo-facts"><div data-reveal><dt>Quand</dt><dd>Du vendredi 10 au dimanche 12 septembre 2027</dd></div><div data-reveal><dt>Où</dt><dd>Domaine des Tilleuls, Drôme provençale</dd></div><div data-reveal><dt>Tenue</dt><dd>Élégante et légère, tons clairs bienvenus</dd></div></dl></div></section>`),
  sec(`<section class="vo-chapters pk-bleed"><div class="vo-wrap"><p class="vo-kicker vo-center" data-reveal>Le samedi en six chapitres</p><h2 class="vo-h2 vo-center" data-reveal>Le déroulé du grand jour</h2>${frise()}</div></section>`),
  sec(`<section class="vo-story pk-bleed"><div class="vo-wrap vo-split"><div class="vo-story-art" data-reveal>${arch()}<span class="vo-story-mono" aria-hidden="true">C<em>&amp;</em>A</span></div>
    <div><p class="vo-kicker" data-reveal>Notre histoire</p><h2 class="vo-h2" data-reveal>Une rencontre à la Fête de la musique</h2><p class="vo-lead" data-reveal>Elle chantait faux, il dansait pire. Quelques années, un chat nommé Mirabelle et une demande en mariage dans un verger plus tard, nous voici.</p>
      <ul class="vo-ticks" data-reveal><li>2019 · La rencontre, à Lyon</li><li>2021 · Un appartement et un chat</li><li>2026 · « Oui » au milieu des pommiers</li></ul><a class="vo-btn vo-btn--line" href="/histoire">Lire toute l'histoire</a></div></div></section>`),
  sec(`<section class="vo-rsvpband pk-bleed"><div class="vo-wrap vo-narrow vo-center">${divider()}<h2 class="vo-h2" data-reveal>Serez-vous des nôtres ?</h2><p class="vo-lead" data-reveal>Merci de nous répondre avant le 15 juin 2027. Un petit assistant vous guide, puis vous renvoie vers le formulaire de contact pour l'envoi.</p>
    <div class="vo-actions vo-actions--c" data-reveal><a class="vo-btn vo-btn--cream" href="/rsvp">Répondre à l'invitation</a><a class="vo-btn vo-btn--ghost" href="/contact">Poser une question</a></div></div></section>`),
  sec(`<section class="vo-stays pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div><p class="vo-kicker" data-reveal>Se loger</p><h2 class="vo-h2" data-reveal>Où dormir autour du domaine</h2></div><a class="vo-more" href="/hebergements">Tous les hébergements</a></div>
    <div class="vo-cards vo-cards--3">${stayCards(STAYS.slice(0, 3))}</div></div></section>`),
  sec(`<section class="vo-gifts pk-bleed"><div class="vo-wrap"><p class="vo-kicker vo-center" data-reveal>Liste de cadeaux</p><h2 class="vo-h2 vo-center" data-reveal>Quelques idées, sans pression</h2>${giftCards()}</div></section>`),
  sec(`<section class="vo-book pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div><p class="vo-kicker" data-reveal>Livre d'or</p><h2 class="vo-h2" data-reveal>Les premiers mots doux</h2></div><a class="vo-more" href="/livredor">Lire tous les messages</a></div>
    <div class="vo-posts">${MSGS.slice(0, 3).map(msgCard).join("")}</div></div></section>`),
  sec(footer(c)),
];

const histoire = (c) => [
  sec(header(c)), pagehead("Notre histoire", "Sept ans<br>et un peu de farine", "Comment deux maladroits ont fini par s'entendre."),
  sec(`<section class="vo-tl pk-bleed"><div class="vo-wrap"><ol class="vo-tline">
    ${[
      ["2019", "La rencontre", "Fête de la musique, quai de Saône. Aurèle prête sa veste, Camille la garde toute la nuit. Elle la lui rendra… trois mois plus tard.", "note"],
      ["2020", "Le premier voyage", "Une cabane dans les Cévennes, trois jours de pluie et un jeu de cartes. Le bonheur tenait dans un sac de couchage.", "car"],
      ["2021", "Une maison à deux", "Un petit appartement sous les toits, des plantes qui meurent et un chat nommé Mirabelle qui règne sur tout.", "door"],
      ["2024", "Le tour du monde, ou presque", "Six mois de sac à dos, du Portugal au Japon. On s'y est trouvés encore plus qu'avant.", "sun"],
      ["2026", "La demande", "Dans un verger de pommiers, au coucher du soleil, avec une bague cachée dans un panier de pommes. Elle a dit oui avant la fin de la phrase.", "rings"],
      ["2027", "Le grand jour", "Le 11 septembre, entourés de vous tous. L'histoire continue, mais avec vous dedans.", "heart"],
    ].map(([y, t, p, i], k) => `<li class="vo-tl-i ${k % 2 ? "is-r" : ""}" data-reveal><span class="vo-tl-node">${ic(i)}</span><div class="vo-tl-card"><b class="vo-year">${y}</b><h3>${t}</h3><p>${p}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="vo-about pk-bleed"><div class="vo-wrap"><h2 class="vo-h2 vo-center" data-reveal>Deux portraits chinois</h2><div class="vo-duo">
    <article class="vo-card" data-reveal><h3>Camille</h3><dl class="vo-dl"><div><dt>Si elle était un plat</dt><dd>Une tarte aux figues</dd></div><div><dt>Son défaut</dt><dd>Toujours en retard de dix minutes</dd></div><div><dt>Sa chanson</dt><dd>« La Vie en rose », mal chantée</dd></div></dl></article>
    <article class="vo-card" data-reveal><h3>Aurèle</h3><dl class="vo-dl"><div><dt>S'il était un plat</dt><dd>Des pâtes, toujours des pâtes</dd></div><div><dt>Son défaut</dt><dd>Perd ses clés, tous les jours</dd></div><div><dt>Sa chanson</dt><dd>N'importe quelle, tant qu'on danse</dd></div></dl></article></div></div></section>`),
  sec(`<section class="vo-rsvpband pk-bleed"><div class="vo-wrap vo-narrow vo-center"><h2 class="vo-h2" data-reveal>La suite s'écrit avec vous</h2><div class="vo-actions vo-actions--c" data-reveal><a class="vo-btn vo-btn--cream" href="/programme">Découvrir le programme</a><a class="vo-btn vo-btn--ghost" href="/rsvp">Répondre</a></div></div></section>`),
  sec(footer(c)),
];

const programme = (c) => [
  sec(header(c)), pagehead("Trois jours de fête", "Le programme", "Du dîner d'accueil du vendredi au brunch du dimanche : tout le week-end, heure par heure."),
  sec(`<section class="vo-prog pk-bleed" data-switch data-tabs><div class="vo-wrap"><div class="vo-tabs" role="group" aria-label="Choisir une journée"><a href="#vendredi" role="button" data-show="ven">Vendredi 10</a><a href="#samedi" role="button" data-show="sam">Samedi 11</a><a href="#dimanche" role="button" data-show="dim">Dimanche 12</a></div>
    <div class="vo-day" data-for="ven"><p class="vo-day-intro">Une soirée sans cérémonie pour retrouver ceux qui arrivent de loin.</p><ol class="vo-sched">
      <li><time>17 h 00</time><div><h3>Arrivée et installation</h3><p>Remise des clés des gîtes, premier verre de bienvenue dans la cour.</p></div></li>
      <li><time>19 h 30</time><div><h3>Dîner de bienvenue</h3><p>Grillades et salades à la bonne franquette, sous le grand tilleul. Tenue décontractée.</p></div></li>
      <li><time>22 h 00</time><div><h3>Veillée</h3><p>Feu de camp, guitare et chansons, pour ceux qui ont encore de la voix.</p></div></li></ol></div>
    <div class="vo-day" data-for="sam"><p class="vo-day-intro">La grande journée, en six chapitres.</p>${frise(6, false)}</div>
    <div class="vo-day" data-for="dim"><p class="vo-day-intro">On ralentit, on se serre dans les bras.</p><ol class="vo-sched">
      <li><time>11 h 00</time><div><h3>Brunch sur la terrasse</h3><p>Viennoiseries, fruits, œufs et grandes tasses de café. Venez comme vous êtes.</p></div></li>
      <li><time>13 h 00</time><div><h3>Jeux de plein air</h3><p>Pétanque, croquet et sieste dans l'herbe pour les courageux.</p></div></li>
      <li><time>15 h 00</time><div><h3>Au revoir</h3><p>Dernières photos, derniers câlins, départ des gîtes avant 16 h.</p></div></li></ol></div></div></section>`),
  sec(`<section class="vo-faq pk-bleed"><div class="vo-wrap vo-narrow"><h2 class="vo-h2 vo-center" data-reveal>Bon à savoir</h2>
    <details data-reveal><summary>Quelle tenue prévoir ?</summary><p>Élégante et légère. Les tons clairs, pastel ou végétaux sont les bienvenus ; nous vous demandons seulement d'éviter le blanc intégral. Pensez à des chaussures confortables pour le gravier et l'herbe.</p></details>
    <details data-reveal><summary>Les enfants sont-ils invités ?</summary><p>Oui, avec plaisir. Un coin de jeux et une jeune baby-sitter seront présents le samedi soir à partir de 20 h. Précisez leur âge dans votre réponse.</p></details>
    <details data-reveal><summary>Que faire en cas de pluie ?</summary><p>La cérémonie se déplace sous la grange en pierre du domaine, tout aussi jolie. Le programme reste identique.</p></details>
    <details data-reveal><summary>Peut-on prendre des photos ?</summary><p>Oui, mais nous demandons un téléphone rangé pendant la cérémonie. Un album partagé sera ouvert pour tout rassembler.</p></details></div></section>`),
  sec(footer(c)),
];

const lieux = (c) => [
  sec(header(c)), pagehead("Lieux et accès", "Le Domaine<br>des Tilleuls", "Une ancienne ferme du XVIIIe siècle, au creux d'une vallée de vignes et de lavande."),
  sec(`<section class="vo-places pk-bleed"><div class="vo-wrap vo-split vo-split--top"><div class="vo-plan" data-reveal><svg viewBox="0 0 320 300" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="308" height="288" rx="6"/><path d="M6 230C70 210 120 250 190 226S280 200 314 214" opacity=".5"/><path d="M0 130C60 120 100 160 160 150s110-40 160-10" opacity=".6"/><path d="M160 294V190" stroke-width="2"/><path d="M160 190C160 160 120 150 100 120" stroke-width="2"/><g opacity=".7">${[[40, 50], [70, 70], [250, 60], [270, 100], [230, 250], [60, 260], [280, 270]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/><path d="M${x} ${y + 9}v8"/>`).join("")}</g>
      <path d="M72 76h56v40H72zM72 76l28-20 28 20" fill="#5b663822"/><path d="M180 90h40v30h-40zM180 90l20-14 20 14" fill="#5b663814"/><circle cx="110" cy="160" r="12"/>${flower(110, 160, 9, 5)}
      <g fill="currentColor" stroke="none"><circle cx="100" cy="96" r="8" fill="#9a5a30"/><circle cx="200" cy="104" r="8" fill="#9a5a30"/><circle cx="110" cy="160" r="8" fill="#9a5a30"/><circle cx="160" cy="244" r="8" fill="#9a5a30"/></g></svg>
      <ol class="vo-legend"><li><b>1</b> Cour et accueil</li><li><b>2</b> Grange de réception</li><li><b>3</b> Verger de la cérémonie</li><li><b>4</b> Parking du domaine</li></ol></div>
    <div><p class="vo-kicker" data-reveal>Le lieu</p><h2 class="vo-h2" data-reveal>Trois espaces, un seul jardin</h2><p class="vo-lead" data-reveal>La cérémonie a lieu dans le verger, le cocktail sur la terrasse de pierre, le dîner dans la grange aux poutres apparentes. Tout se fait à pied, à moins de cent mètres.</p>
      <address class="vo-addr" data-reveal>${ic("pin")}<span><b>Domaine des Tilleuls</b><br>Chemin des Tilleuls, 26000 Saint-Loup-de-la-Vigne<br><small>Adresse fictive, pour la démonstration</small></span></address>
      <p class="vo-note" data-reveal>Parking gratuit sur place, accessible aux personnes à mobilité réduite par l'entrée de plain-pied. Dites-nous si vous avez besoin d'aide.</p></div></div></section>`),
  sec(`<section class="vo-access pk-bleed" data-switch data-tabs><div class="vo-wrap"><p class="vo-kicker vo-center" data-reveal>Venir au domaine</p><h2 class="vo-h2 vo-center" data-reveal>Comment s'y rendre</h2>
    <div class="vo-tabs" role="group" aria-label="Mode de transport"><a href="#voiture" role="button" data-show="car">${ic("car", "vo-ic vo-ic--sm")} En voiture</a><a href="#train" role="button" data-show="train">${ic("door", "vo-ic vo-ic--sm")} En train</a><a href="#avion" role="button" data-show="avion">${ic("pin", "vo-ic vo-ic--sm")} En avion</a></div>
    <div class="vo-pan" data-for="car"><h3>Par la route</h3><p>Depuis l'autoroute du Soleil, sortie Montélimar-Sud, puis trente minutes de départementale à travers les vignes. Dernier kilomètre en chemin de terre : roulez doucement.</p></div>
    <div class="vo-pan" data-for="train"><h3>En gare</h3><p>La gare la plus proche se trouve à vingt-cinq minutes en voiture. Une navette gratuite vous attend à l'arrivée des trains du vendredi après-midi et du dimanche midi.</p></div>
    <div class="vo-pan" data-for="avion"><h3>Par les airs</h3><p>Prévoyez une location de voiture depuis l'aéroport de Lyon (1 h 30) ou de Marseille (1 h 45). Des covoiturages entre invités seront proposés par message.</p></div></div></section>`),
  sec(`<section class="vo-times pk-bleed"><div class="vo-wrap vo-narrow"><h2 class="vo-h2 vo-center" data-reveal>Temps de trajet</h2>
    <table class="vo-table" data-reveal><caption>Durées estimées jusqu'au domaine</caption><thead><tr><th>Depuis</th><th>Distance</th><th>Durée en voiture</th></tr></thead><tbody>
    <tr><td data-l="Depuis">Lyon</td><td data-l="Distance">150 km</td><td data-l="Durée">1 h 40</td></tr><tr><td data-l="Depuis">Marseille</td><td data-l="Distance">170 km</td><td data-l="Durée">1 h 50</td></tr><tr><td data-l="Depuis">Avignon</td><td data-l="Distance">80 km</td><td data-l="Durée">1 h 05</td></tr><tr><td data-l="Depuis">Gare la plus proche</td><td data-l="Distance">25 km</td><td data-l="Durée">25 min</td></tr></tbody></table>
    <p class="vo-note vo-center">Navette retour du samedi : départs à 23 h, 0 h 30 et 2 h vers les hébergements voisins.</p></div></section>`),
  sec(footer(c)),
];

const hebergements = (c) => [
  sec(header(c)), pagehead("Se loger", "Où dormir", "Des gîtes sur place aux chambres chez l'habitant : six adresses, toutes à moins de dix kilomètres."),
  sec(`<section class="vo-stayspage pk-bleed" data-switch><div class="vo-wrap"><div class="vo-tabs vo-tabs--filter" role="group" aria-label="Filtrer les hébergements"><a href="#tous" role="button" data-show="all">Tous</a><a href="#sur-place" role="button" data-show="sur-place">Sur place</a><a href="#proche" role="button" data-show="proche">À proximité</a><a href="#budget" role="button" data-show="budget">Petit budget</a><a href="#groupe" role="button" data-show="groupe">En groupe</a></div>
    <p class="vo-sr" aria-live="polite" data-out></p><div class="vo-cards vo-cards--3">${stayCards()}</div>
    <p class="vo-note vo-center">Tarifs et disponibilités ne sont pas indiqués ici : contactez directement l'hébergement ou écrivez-nous pour obtenir les coordonnées. Pensez à réserver tôt, la rentrée est très prisée.</p></div></section>`),
  sec(`<section class="vo-tipsband pk-bleed"><div class="vo-wrap vo-narrow"><h2 class="vo-h2 vo-center" data-reveal>Nos conseils</h2><div class="vo-duo">
    <article class="vo-card" data-reveal>${ic("bed", "vo-ic vo-ic--lg")}<h3>Partager une chambre</h3><p>Les gîtes du domaine se partagent facilement à quatre ou six. Dites-nous avec qui vous souhaitez dormir.</p></article>
    <article class="vo-card" data-reveal>${ic("car", "vo-ic vo-ic--lg")}<h3>Se déplacer sans voiture</h3><p>Une navette relie les hébergements voisins au domaine pendant la soirée du samedi.</p></article></div></div></section>`),
  sec(footer(c)),
];

const rsvp = (c) => [
  sec(header(c)), pagehead("Répondez-nous", "Serez-vous<br>des nôtres ?", "Quelques questions simples. Aucun envoi automatique : à la fin, vous copiez votre récapitulatif dans le formulaire de contact."),
  sec(`<section class="vo-rsvpsec pk-bleed"><div class="vo-wrap vo-rsvpgrid"><aside class="vo-side" data-reveal><p class="vo-kicker">Jour J</p>${countdown("vo-count--s")}<ul class="vo-ticks"><li>Réponse souhaitée avant le 15 juin 2027</li><li>Samedi 11 septembre 2027, 16 h 30</li><li>Domaine des Tilleuls, Drôme</li></ul><p class="vo-note">Vos réponses restent dans votre navigateur et ne sont enregistrées nulle part tant que vous n'envoyez pas le formulaire de contact.</p></aside>
    <div class="vo-formcard" data-reveal>${rsvpMount()}</div></div></section>`),
  sec(`<section class="vo-gifts pk-bleed"><div class="vo-wrap"><p class="vo-kicker vo-center" data-reveal>Liste de cadeaux</p><h2 class="vo-h2 vo-center" data-reveal>Si l'envie vous prend</h2>${giftCards()}</div></section>`),
  sec(`<section class="vo-stays pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div><p class="vo-kicker" data-reveal>Un toit pour la nuit</p><h2 class="vo-h2" data-reveal>Hébergements conseillés</h2></div><a class="vo-more" href="/hebergements">Voir les six adresses</a></div><div class="vo-cards vo-cards--3">${stayCards(STAYS.slice(0, 3))}</div></div></section>`),
  sec(footer(c)),
];

const livredor = (c) => [
  sec(header(c)), pagehead("Livre d'or", "Vos mots doux", "Quelques messages de démonstration, inventés pour l'exemple : ils montrent seulement à quoi ressemblera le livre d'or."),
  sec(`<section class="vo-bookpage pk-bleed" data-switch><div class="vo-wrap"><div class="vo-tabs vo-tabs--filter" role="group" aria-label="Filtrer les messages"><a href="#tous" role="button" data-show="all">Tous</a><a href="#famille" role="button" data-show="famille">Famille</a><a href="#amis" role="button" data-show="amis">Amis</a><a href="#travail" role="button" data-show="travail">Travail</a></div>
    <p class="vo-sr" aria-live="polite" data-out></p><div class="vo-posts vo-posts--cols">${MSGS.map(msgCard).join("")}</div></div></section>`),
  sec(`<section class="vo-rsvpband pk-bleed"><div class="vo-wrap vo-narrow vo-center"><h2 class="vo-h2" data-reveal>Laissez-nous un mot</h2><p class="vo-lead" data-reveal>Ce livre d'or est une démonstration : pour écrire aux mariés, utilisez le formulaire de contact.</p><div class="vo-actions vo-actions--c" data-reveal><a class="vo-btn vo-btn--cream" href="/contact">Écrire aux mariés</a></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [sec(header(c)), pagehead("On vous répond", "Contact", "Une question, une allergie, un covoiturage à proposer ? Écrivez-nous. Vous pouvez aussi y coller le récapitulatif de votre réponse."),
  { type: "form", heading: "Écrire aux mariés", intro: "Dites-nous qui vous êtes et ce dont vous avez besoin. Pour répondre à l'invitation, collez ici le récapitulatif généré sur la page de réponse." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une info ?", "Programme, hébergements, accès : cherchez ce qu'il vous faut."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="vo-404 pk-bleed"><div class="vo-wrap vo-narrow vo-center">${rings("vo-rings")}<p class="vo-kicker">Perdu en chemin</p><div class="vo-h1" role="heading" aria-level="1">Page introuvable</div>${divider()}<p class="vo-lead">Cette page n'existe pas, ou a changé d'adresse. Revenez à l'invitation, nous vous y attendons.</p><div class="vo-actions vo-actions--c"><a class="vo-btn" href="/">Retour à l'accueil</a><a class="vo-btn vo-btn--line" href="/programme">Le programme</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "voeu", name: "Vœu", version: "2.0.0", category: "evenement", tags: ["classique", "chaleureux", "editorial"], siteType: "Mariage et événementiel", featured: true,
  concept: "Un faire-part romantique : cadre ornemental avec les noms, menu en cartouche, frise des chapitres du jour, compte à rebours et réponse guidée à l'invitation.",
  description: "Mariage ou événement : crème, blush, vert olive et cuivre, fleurs et branches au trait, script en accents. Hero encadré, frise du programme, compte à rebours, RSVP guidé, cadeaux, hébergements et livre d'or.",
  brand: "Camille & Aurèle", modules: ["formulaires", "recherche"],
  dna: { header: "cartouche-centre-et-monogramme", hero: "cadre-ornemental-noms-date-et-lieu", grid: "frise-des-chapitres-du-jour", motion: "petales-qui-tombent-et-fleurs-qui-eclosent", shapes: "cadres-a-coins-fleuris-branches-fines-et-cartouches", rhythm: "narratif-romantique-par-chapitres", signature: "compte-a-rebours-et-reponse-guidee-a-l-invitation" },
  tokens: {
    colors: { primary: "#5b6638", secondary: "#efd2c9", accent: "#9a5a30", background: "#fbf5ec", surface: "#fffaf3", text: "#3a3328", muted: "#6b6254", success: "#3f6b2f", warning: "#8a5a00", error: "#a63a2c" },
    fonts: { heading: "font.gilda-display", body: "font.lora", button: "font.mulish", link: "font.pinyon-script" },
    radius: { sm: 4, md: 8, lg: 28, button: 999, field: 6, card: 10 }, shadow: { card: "0 10px 30px rgba(90,70,40,.10)", button: "none" }, border: { width: 1, color: "#c7a78a" },
    type: { h1: { size: 76, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 42, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "olive", label: "Vert olive", type: "color", default: "#5b6638" },
    { key: "blush", label: "Rose blush", type: "color", default: "#efd2c9" },
    { key: "copper", label: "Filet de cuivre", type: "color", default: "#9a5a30" },
    { key: "petals", label: "Pétales qui tombent", type: "choice", default: "on", choices: [["on", "Oui"], ["off", "Non"]] },
    { key: "script", label: "Écriture script des accents", type: "choice", default: "on", choices: [["on", "Script"], ["off", "Sobre (italique)"]] },
  ],
  menu: [["Accueil", "/"], ["Histoire", "/histoire"], ["Programme", "/programme"], ["Lieux", "/lieux"], ["Hébergements", "/hebergements"], ["Livre d'or", "/livredor"], ["RSVP", "/rsvp"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "histoire", name: "Notre histoire", render: histoire }, { key: "programme", name: "Programme", render: programme },
    { key: "lieux", name: "Lieux et accès", render: lieux }, { key: "hebergements", name: "Hébergements", render: hebergements }, { key: "rsvp", name: "RSVP", render: rsvp },
    { key: "livredor", name: "Livre d'or", render: livredor }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
