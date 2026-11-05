// Rideau — compagnie de théâtre. Direction artistique : velours bordeaux, clair-obscur, typographie d'affiche. Hero = rideau de scène qui s'ouvre sur le spectacle,
// navigation = menu plein écran « programme de salle », affiches en colonnes, saison filtrable par mois et genre, plan de salle à sièges cliquables (récapitulatif → /contact).
const { sec, esc } = require("../kit");

/* ---------- Données de démonstration (tout est fictif) ---------- */
const PEOPLE = {
  margaux: ["Margaux Delaunay", "Metteuse en scène, directrice artistique", "m", 0],
  etienne: ["Étienne Vasseur", "Comédien", "a", 1],
  noor: ["Noor Benali", "Comédienne", "b", 2],
  aurelien: ["Aurélien Pastor", "Comédien", "c", 3],
  solene: ["Solène Maurel", "Comédienne", "d", 4],
  jules: ["Jules Perrin", "Comédien", "e", 5],
  baptiste: ["Baptiste Colas", "Scénographe", "f", 6],
  iris: ["Iris Tanguy", "Costumière", "g", 7],
  mathis: ["Mathis Rolland", "Créateur lumière", "h", 8],
  zoe: ["Zoé Karam", "Régisseuse générale", "i", 9],
  hector: ["Hector Lemoine", "Compositeur et musicien", "j", 10],
  louise: ["Louise Armand", "Administration et relations avec le public", "k", 11],
};
// slug, titre, genre (clé), genre (libellé), mois (clé), mois (libellé), dates, durée, tarif jeune (facteur), texte, mise en scène, motif, fond, lumière, synopsis, accroche, distribution
const SHOWS = [
  ["derniere-repetition", "La Dernière Répétition", "drame", "Drame", "nov", "Novembre", ["Ven. 13 nov. · 20 h 30", "Sam. 14 nov. · 20 h 30", "Ven. 20 nov. · 20 h 30", "Sam. 21 nov. · 17 h 00"], "1 h 35", 1, "Élise Brandt", "margaux", "masks", "#2a0b12", "#f0c27a", "La veille de la première, une troupe découvre que le rôle principal n'a jamais été distribué : quelqu'un, dans la salle vide, connaît le texte par cœur.", "Il manque un acteur, et personne ne manque.", ["etienne", "noor", "aurelien"]],
  ["bal-souffleurs", "Le Bal des Souffleurs", "comedie", "Comédie", "dec", "Décembre", ["Ven. 4 déc. · 20 h 30", "Sam. 5 déc. · 20 h 30", "Ven. 11 déc. · 20 h 30", "Sam. 12 déc. · 17 h 00"], "1 h 25", 1, "Paul-Émile Cordier", "solene", "chandelier", "#21090f", "#ffd9a0", "Le soir du gala, les souffleurs d'un vieux théâtre reprennent la scène à la place des artistes en grève : trois heures pour tout improviser sans jamais élever la voix.", "Chut ! On joue.", ["solene", "jules", "noor"]],
  ["soir-ombres", "Un soir chez les Ombres", "jeune", "Jeune public", "dec", "Décembre", ["Mer. 16 déc. · 15 h 00", "Sam. 19 déc. · 11 h 00", "Dim. 20 déc. · 15 h 00"], "0 h 50", 0.6, "Anouk Rey", "margaux", "cat", "#14122a", "#d9d2ff", "Lila a peur de son ombre. Une nuit, l'ombre la prend par la main et lui fait visiter la maison des ombres, où chacun cache un petit secret de lumière.", "À partir de 5 ans.", ["noor", "jules"]],
  ["hotes-minuit", "Les Hôtes de minuit", "drame", "Drame", "jan", "Janvier", ["Ven. 15 janv. · 20 h 30", "Sam. 16 janv. · 20 h 30", "Ven. 22 janv. · 20 h 30", "Sam. 23 janv. · 17 h 00"], "1 h 50", 1, "Camille Orsini", "margaux", "door", "#0f1a22", "#cfe3ee", "Dans une auberge fermée par la neige, huit voyageurs attendent minuit. À chaque coup de l'horloge, l'un d'eux avoue ce qu'il est venu fuir.", "Chaque coup de minuit en trahit un.", ["etienne", "solene", "aurelien", "noor"]],
  ["tante-heros", "Ma tante, ce héros", "comedie", "Comédie", "fev", "Février", ["Ven. 5 févr. · 20 h 30", "Sam. 6 févr. · 20 h 30", "Ven. 12 févr. · 20 h 30", "Sam. 13 févr. · 17 h 00"], "1 h 30", 1, "Paul-Émile Cordier", "margaux", "hat", "#24100c", "#f5d29a", "Une tante de soixante-dix ans découvre dans le grenier le costume d'un justicier masqué de la région. Elle décide de reprendre l'activité, au grand dam de la famille.", "Elle n'a pas l'âge. Elle a le costume.", ["solene", "aurelien", "jules"]],
  ["chambre-12", "Chambre 12", "creation", "Création contemporaine", "mar", "Mars", ["Ven. 12 mars · 20 h 30", "Sam. 13 mars · 20 h 30", "Ven. 19 mars · 20 h 30", "Sam. 20 mars · 17 h 00"], "1 h 10", 1, "Nadia Fournel", "margaux", "key", "#1b0b1a", "#f1c9e8", "Un seul décor, douze nuits : les occupants successifs d'une chambre d'hôtel laissent chacun un objet, et la pièce finit par jouer leur histoire sans eux.", "Douze nuits, un seul lit.", ["noor", "etienne", "solene"]],
  ["theatre-reflets", "Le Théâtre des Reflets", "creation", "Création contemporaine", "avr", "Avril", ["Ven. 9 avr. · 20 h 30", "Sam. 10 avr. · 20 h 30", "Ven. 16 avr. · 20 h 30", "Sam. 17 avr. · 17 h 00"], "1 h 20", 1, "Nadia Fournel", "margaux", "mirror", "#0e1c1d", "#bfe6e0", "Deux comédiennes rejouent la même scène face à un grand miroir sans tain ; peu à peu, le public ne sait plus de quel côté de la glace il est assis.", "De quel côté de la glace ?", ["solene", "noor"]],
  ["petit-souffleur", "Le Petit Souffleur", "jeune", "Jeune public", "mai", "Mai", ["Mer. 12 mai · 15 h 00", "Sam. 15 mai · 11 h 00", "Dim. 16 mai · 15 h 00"], "0 h 55", 0.6, "Anouk Rey", "margaux", "puppet", "#241a0b", "#ffe3a3", "Dans le trou du souffleur vit un petit bonhomme de chiffon qui connaît toutes les pièces. Le jour où il oublie une réplique, c'est toute la scène qui se met à écouter.", "À partir de 4 ans.", ["jules", "noor", "hector"]],
  ["noces-verre", "Les Noces de verre", "drame", "Drame", "jun", "Juin", ["Ven. 4 juin · 20 h 30", "Sam. 5 juin · 20 h 30", "Ven. 11 juin · 20 h 30", "Sam. 12 juin · 17 h 00"], "1 h 45", 1, "Élise Brandt", "margaux", "glass", "#210b10", "#f4cdd0", "Pour leurs noces de verre, un couple invite ses témoins d'il y a quinze ans. Les verres sont levés ; ce qu'on y porte n'est pas ce qu'on avait promis.", "Tout est fragile, surtout les toasts.", ["etienne", "solene", "aurelien", "noor"]],
];
const MONTHS = [["nov", "Nov."], ["dec", "Déc."], ["jan", "Janv."], ["fev", "Févr."], ["mar", "Mars"], ["avr", "Avr."], ["mai", "Mai"], ["jun", "Juin"]];
const MONTH_LONG = { nov: "Novembre", dec: "Décembre", jan: "Janvier", fev: "Février", mar: "Mars", avr: "Avril", mai: "Mai", jun: "Juin" };
const GENRES = [["comedie", "Comédie"], ["drame", "Drame"], ["creation", "Création"], ["jeune", "Jeune public"]];
const show = (slug) => SHOWS.find((s) => s[0] === slug);
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const short = (s) => { const d = s[6]; const a = d[0].match(/(\d+) (\S+)/), b = d[d.length - 1].match(/(\d+) (\S+)/); return a[2] === b[2] ? `${a[1]} – ${b[1]} ${a[2]}` : `${a[1]} ${a[2]} – ${b[1]} ${b[2]}`; };

/* ---------- Illustrations SVG (sans identifiant : le filtre de sécurité les supprime) ---------- */
const MOTIF = {
  masks: (b) => `<path d="M42 96c0-30 22-44 46-44s46 14 46 44c0 40-20 74-46 74S42 136 42 96z" fill="${b}" opacity=".92"/><path d="M62 96q10-9 20 0M96 96q10-9 20 0" stroke="#000" stroke-width="4" fill="none" opacity=".8"/><path d="M66 128q22 22 44 0" stroke="#000" stroke-width="4" fill="none" opacity=".8"/><path d="M104 138c0-26 18-38 38-38s38 12 38 38c0 34-16 62-38 62s-38-28-38-62z" fill="${b}" opacity=".5"/><path d="M124 140q10 8 20 0M150 140q10 8 20 0" stroke="#000" stroke-width="3.4" fill="none" opacity=".7"/><path d="M128 172q16-14 32 0" stroke="#000" stroke-width="3.4" fill="none" opacity=".7"/>`,
  chandelier: (b) => `<path d="M100 20v54" stroke="${b}" stroke-width="3"/><path d="M40 112q60 56 120 0" fill="none" stroke="${b}" stroke-width="4"/><path d="M60 88q40 42 80 0" fill="none" stroke="${b}" stroke-width="3" opacity=".8"/><g fill="${b}"><circle cx="40" cy="108" r="6"/><circle cx="100" cy="146" r="6"/><circle cx="160" cy="108" r="6"/><circle cx="68" cy="132" r="5"/><circle cx="132" cy="132" r="5"/></g><g fill="${b}" opacity=".85"><path d="M40 98q-5-12 0-20 5 8 0 20zM100 136q-5-12 0-20 5 8 0 20zM160 98q-5-12 0-20 5 8 0 20z"/></g><g fill="none" stroke="${b}" opacity=".35"><circle cx="100" cy="220" r="40"/><circle cx="100" cy="220" r="22"/></g>`,
  cat: (b) => `<circle cx="136" cy="96" r="38" fill="${b}" opacity=".95"/><circle cx="148" cy="86" r="30" fill="#000" opacity=".9"/><path d="M60 214q0-50 40-50t40 50z" fill="#000" opacity=".85"/><circle cx="100" cy="148" r="22" fill="#000" opacity=".85"/><path d="M82 136l-2-26 18 14zM118 136l2-26-18 14z" fill="#000" opacity=".85"/><circle cx="92" cy="146" r="3" fill="${b}"/><circle cx="108" cy="146" r="3" fill="${b}"/><path d="M20 214h160" stroke="${b}" stroke-width="1.6" opacity=".5"/>`,
  door: (b) => `<path d="M52 250V120a48 48 0 0 1 96 0v130z" fill="#000" opacity=".6" stroke="${b}" stroke-width="3"/><path d="M96 250V90h8v160z" fill="${b}" opacity=".9"/><circle cx="130" cy="190" r="5" fill="${b}"/><circle cx="100" cy="46" r="20" fill="none" stroke="${b}" stroke-width="2.4"/><path d="M100 46V34M100 46l8 6" stroke="${b}" stroke-width="2.4"/>`,
  hat: (b) => `<ellipse cx="100" cy="190" rx="70" ry="14" fill="${b}" opacity=".9"/><path d="M62 190v-70q0-14 38-14t38 14v70z" fill="#000" opacity=".8" stroke="${b}" stroke-width="2.4"/><path d="M62 168h76" stroke="${b}" stroke-width="7"/><path d="M130 100q30-40 46-36-12 14-30 44" fill="none" stroke="${b}" stroke-width="3"/><path d="M40 238l116-52" stroke="${b}" stroke-width="3" opacity=".7"/><circle cx="40" cy="238" r="5" fill="${b}"/>`,
  key: (b) => `<rect x="56" y="48" width="88" height="140" rx="4" fill="#000" opacity=".55" stroke="${b}" stroke-width="2.4"/><g fill="${b}"><circle cx="100" cy="86" r="5"/><circle cx="80" cy="120" r="3.6" opacity=".6"/><circle cx="100" cy="120" r="3.6" opacity=".6"/><circle cx="120" cy="120" r="3.6" opacity=".6"/></g><circle cx="100" cy="226" r="18" fill="none" stroke="${b}" stroke-width="4"/><path d="M100 244v38M100 264h14M100 276h10" stroke="${b}" stroke-width="4"/>`,
  mirror: (b) => `<ellipse cx="100" cy="132" rx="52" ry="84" fill="${b}" opacity=".14" stroke="${b}" stroke-width="4"/><ellipse cx="100" cy="132" rx="40" ry="72" fill="none" stroke="${b}" stroke-width="1.6" opacity=".6"/><path d="M76 90l48 90M70 130l32 60" stroke="${b}" stroke-width="2" opacity=".5"/><circle cx="78" cy="238" r="10" fill="${b}" opacity=".85"/><circle cx="122" cy="238" r="10" fill="${b}" opacity=".4"/><path d="M60 270h80" stroke="${b}" stroke-width="2.4"/>`,
  puppet: (b) => `<path d="M100 20v70M60 40h80M100 40 76 100M100 40l24 60" stroke="${b}" stroke-width="2" fill="none" opacity=".75"/><circle cx="100" cy="120" r="20" fill="${b}"/><path d="M76 150h48l8 56H68z" fill="${b}" opacity=".85"/><path d="M76 156l-22 36M124 156l22 36M88 206v42M112 206v42" stroke="${b}" stroke-width="7" stroke-linecap="round"/><circle cx="93" cy="116" r="2.6" fill="#000"/><circle cx="107" cy="116" r="2.6" fill="#000"/>`,
  glass: (b) => `<g fill="none" stroke="${b}" stroke-width="3"><path d="M56 70h46q-4 56-23 56T56 70z"/><path d="M79 126v62M60 188h38"/><path d="M110 70h46q-4 56-23 56T110 70z" opacity=".55"/><path d="M133 126v62M114 188h38" opacity=".55"/></g><path d="M100 64l-8 18 12 10-10 20" stroke="${b}" stroke-width="2.4" fill="none"/><g fill="${b}" opacity=".7"><path d="M34 220l10-12 8 14zM150 232l12-10 4 14zM96 250l8-12 8 14z"/></g>`,
};
const poster = (s, cls = "") => `<div class="rd-poster${cls ? " " + cls : ""}"><svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="200" height="300" fill="${s[12]}"/><circle cx="100" cy="120" r="96" fill="${s[13]}" opacity=".07"/><path d="M0 0h200v300H0z" fill="#000" opacity=".12"/>${MOTIF[s[11]](s[13])}</svg><span class="rd-pg">${esc(s[3])}</span><div class="rd-pt"><small>Compagnie Rideau</small><strong>${esc(s[1])}</strong><time>${esc(short(s))}</time></div></div>`;

const maskLogo = `<svg class="rd-logo" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 6h30v12c0 11-7 18-15 18S5 29 5 18z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 15q3-3 6 0M22 15q3-3 6 0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M13 23q7 7 14 0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 6q15 6 30 0" stroke="currentColor" stroke-width="1.4" fill="none" opacity=".6"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const avatar = (p) => { const i = p[3], tones = ["#e8c9a8", "#c99a74", "#a8744f", "#f0d5b8", "#8a5a3a", "#d9b08a"], hairs = ["#2a1a14", "#6a3a22", "#b8864a", "#1a1a1a", "#8a8a8a", "#4a2a2a"]; const hair = hairs[i % 6], tone = tones[(i * 5) % 6], st = i % 3;
  const hairShape = st === 0 ? `<path d="M64 90q0-40 36-40t36 40q-8-22-36-22T64 90z" fill="${hair}"/>` : st === 1 ? `<path d="M60 112q-6-62 40-62t40 62q-6-34-40-34t-40 34z" fill="${hair}"/><path d="M60 112v36M140 112v36" stroke="${hair}" stroke-width="10"/>` : `<path d="M66 84q4-34 34-34t34 34q-20-12-34-8-18-4-34 8z" fill="${hair}"/><circle cx="100" cy="46" r="12" fill="${hair}"/>`;
  return `<svg class="rd-av" viewBox="0 0 200 240" aria-hidden="true"><rect width="200" height="240" fill="#1a0a10"/><circle cx="100" cy="100" r="92" fill="#f0c27a" opacity=".08"/><path d="M30 240q6-62 70-62t70 62z" fill="${["#5a1020", "#2a2a46", "#3a4a3a", "#4a3a20", "#2a3a4a"][i % 5]}"/><rect x="88" y="150" width="24" height="34" fill="${tone}"/><ellipse cx="100" cy="112" rx="34" ry="42" fill="${tone}"/>${hairShape}<circle cx="88" cy="112" r="2.6" fill="#2a1a14"/><circle cx="112" cy="112" r="2.6" fill="#2a1a14"/><path d="M90 132q10 7 20 0" stroke="#7a3a2a" stroke-width="2.4" fill="none"/></svg>`; };

/* ---------- En-tête (menu plein écran « programme de salle »), pied ---------- */
const keyOf = (u) => (u === "/" ? "accueil" : u.slice(1));
const header = (c, cur) => {
  const items = c.menu.map((m, i) => ({ ...m, n: ROMAN[i] || String(i + 1), on: keyOf(m.url) === cur }));
  const nx = SHOWS[0];
  return `<header class="rd-top pk-bleed"><div class="rd-top-in">
  <a class="rd-brand" href="/">${maskLogo}<span class="rd-brand-t"><strong>Rideau</strong><small>Compagnie de théâtre</small></span></a>
  <details class="rd-prog"><summary aria-label="Ouvrir ou fermer le programme de salle"><span class="rd-sum-o">Programme</span><span class="rd-sum-c">Fermer</span><span class="rd-burger" aria-hidden="true"><i></i><i></i></span></summary>
  <div class="rd-prog-panel"><div class="rd-prog-in">
    <div class="rd-prog-main" role="navigation" aria-label="Programme de salle">
      <p class="rd-k">Programme de salle · Saison 2026-2027</p>
      <ol class="rd-prog-list">${items.map((m) => `<li><a href="${esc(m.url)}"${m.on ? ' aria-current="page"' : ""}><i>Acte ${m.n}</i><span>${esc(m.label)}</span><u aria-hidden="true"></u><b>${m.on ? "Ici" : "→"}</b></a></li>`).join("")}</ol>
    </div>
    <aside class="rd-prog-side" aria-label="Prochaine représentation"><p class="rd-k">Prochainement</p><div class="rd-prog-next"><strong>${esc(nx[1])}</strong><span>${esc(nx[6][0])}</span><a class="rd-btn rd-btn--gold" href="/billetterie?s=${nx[0]}">Choisir mes places ${arrow}</a></div>
    <a class="rd-prog-s" href="/recherche">Rechercher dans le programme</a><address class="rd-addr">Théâtre des Lanternes<br>8 rue du Parterre, 69001 Lyon<br>Caisse : mardi au samedi, 14 h – 19 h</address></aside>
  </div></div></details></div></header>`;
};
const footer = (c) => `<footer class="rd-end pk-bleed"><div class="rd-wrap"><div class="rd-end-top"><span class="rd-end-fin" aria-hidden="true">Rideau</span><p>Compagnie Rideau — création, troupe permanente et saison au Théâtre des Lanternes. Merci d'avoir regardé jusqu'au bout.</p></div>
  <div class="rd-end-cols"><div><h3>Programme</h3>${c.menu.map((m) => `<a class="rd-fl" href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div><h3>Spectateurs</h3><a class="rd-fl" href="/billetterie">Plan de salle</a><a class="rd-fl" href="/contact">Groupes et scolaires</a><a class="rd-fl" href="/contact">Accessibilité de la salle</a><a class="rd-fl" href="/recherche">Recherche</a></div>
  <div><h3>La salle</h3><address class="rd-addr">Théâtre des Lanternes<br>8 rue du Parterre, 69001 Lyon<br><a class="rd-fl" href="mailto:billetterie@rideau.example">billetterie@rideau.example</a></address></div></div>
  <p class="rd-legal">© Compagnie Rideau — site de démonstration. Spectacles, personnes, dates et tarifs sont fictifs ; aucune réservation n'est enregistrée sur ce site.</p></div></footer>`;

/* ---------- Briques ---------- */
const pagehead = (act, kicker, title, sub) => sec(`<section class="rd-ph pk-bleed"><div class="rd-wrap"><p class="rd-k" data-reveal><span>Acte ${act}</span> ${esc(kicker)}</p><div class="rd-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="rd-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);
const card = (s, i = 0) => `<article class="rd-pc" data-rd-card data-m="${s[4]}" data-g="${s[2]}" data-reveal><a class="rd-pc-l" href="/spectacle?s=${s[0]}" aria-label="${esc(s[1])}, fiche du spectacle">${poster(s)}</a>
  <div class="rd-pc-cap"><p class="rd-pc-g">${esc(s[3])} · ${esc(s[7])}</p><p class="rd-pc-t">${esc(s[15])}</p><a class="rd-more" href="/billetterie?s=${s[0]}">Places ${arrow}</a></div></article>`;
const act = (n, label, title, intro, extra = "") => `<div class="rd-acthead" data-reveal><p class="rd-act"><b>${n}</b>${esc(label)}</p><h2 class="rd-h2">${title}</h2>${intro ? `<p class="rd-sub">${esc(intro)}</p>` : ""}${extra}</div>`;
const cta = (t, p, l, u) => sec(`<section class="rd-cta pk-bleed"><div class="rd-wrap rd-cta-in"><h2 class="rd-h2" data-reveal>${t}</h2><p class="rd-sub" data-reveal>${esc(p)}</p><a class="rd-btn rd-btn--gold" href="${u}" data-reveal>${esc(l)} ${arrow}</a></div></section>`);

/* ---------- Pages ---------- */
const CUR = (side) => `<div class="rd-cur rd-cur--${side}" aria-hidden="true"><i></i></div>`;
const VALANCE = `<svg class="rd-valance" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h1200v46q-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0z" fill="#000" opacity=".5" transform="translate(0 6)"/><path d="M0 0h1200v46q-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0-25 44-50 0z" class="rd-val-f"/><path d="M0 50q25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0 25 40 50 0" fill="none" stroke="#f0c27a" stroke-width="2" opacity=".8"/><g fill="#f0c27a" opacity=".85"><circle cx="25" cy="66" r="3"/><circle cx="125" cy="66" r="3"/><circle cx="225" cy="66" r="3"/><circle cx="325" cy="66" r="3"/><circle cx="425" cy="66" r="3"/><circle cx="525" cy="66" r="3"/><circle cx="625" cy="66" r="3"/><circle cx="725" cy="66" r="3"/><circle cx="825" cy="66" r="3"/><circle cx="925" cy="66" r="3"/><circle cx="1025" cy="66" r="3"/><circle cx="1125" cy="66" r="3"/></g></svg>`;
const s0 = SHOWS[0];
const home = (c) => [
  sec(header(c, "accueil")),
  sec(`<section class="rd-hero pk-bleed" data-rd-hero><div class="rd-stage" aria-hidden="true"><div class="rd-wall"></div><i class="rd-beam rd-beam--a"></i><i class="rd-beam rd-beam--b"></i><div class="rd-floor"></div><div class="rd-foot"></div>
  <svg class="rd-prop" viewBox="0 0 200 120" aria-hidden="true"><path d="M60 118V70q0-10 10-10h60q10 0 10 10v48" fill="#000" opacity=".55"/><path d="M78 60V34q0-10 22-10t22 10v26" fill="none" stroke="#f0c27a" stroke-width="2" opacity=".5"/><circle cx="100" cy="92" r="5" fill="#f0c27a" opacity=".7"/></svg></div>
  <div class="rd-hero-in rd-wrap"><p class="rd-k rd-hk"><span>Création</span> Saison 2026-2027 · Théâtre des Lanternes</p>
  <div class="rd-h1 rd-hero-t" role="heading" aria-level="1">${esc(s0[1])}</div>
  <p class="rd-lead">${esc(s0[15])}</p><p class="rd-hero-d"><time>13 – 21 novembre</time> · ${esc(s0[7])} · mise en scène Margaux Delaunay</p>
  <div class="rd-actions"><a class="rd-btn rd-btn--gold" href="/billetterie?s=${s0[0]}">Choisir mes places ${arrow}</a><a class="rd-btn rd-btn--line" href="/spectacle?s=${s0[0]}">Découvrir le spectacle</a></div></div>
  ${CUR("l")}${CUR("r")}${VALANCE}<a class="rd-replay" href="#rideau" data-rd-replay>Refermer le rideau</a></section>`),
  sec(`<section class="rd-next pk-bleed"><div class="rd-wrap rd-next-in"><div class="rd-next-d" data-reveal><p class="rd-k"><span>Prochaine représentation</span></p><strong>${esc(s0[6][0])}</strong><span>${esc(s0[1])}</span></div>
  <ul class="rd-figs" data-reveal><li><b data-count="9">9</b><span>spectacles</span></li><li><b data-count="34">34</b><span>représentations</span></li><li><b data-count="112">112</b><span>fauteuils</span></li></ul>
  <a class="rd-btn rd-btn--gold" href="/billetterie" data-reveal>Plan de salle ${arrow}</a></div></section>`),
  sec(`<section class="rd-block pk-bleed"><div class="rd-wrap">${act("I", "À l'affiche", "Quatre soirs avant l'hiver.", "Les quatre premiers spectacles de la saison, de novembre à janvier. Cliquez sur une affiche pour ouvrir la fiche.")}
  <div class="rd-posters">${SHOWS.slice(0, 4).map(card).join("")}</div><p class="rd-tail" data-reveal><a class="rd-more" href="/saison">Voir toute la saison ${arrow}</a></p></div></section>`),
  sec(`<section class="rd-inter pk-bleed"><div class="rd-wrap rd-inter-in"><p class="rd-act rd-act--c" data-reveal><b>Entracte</b>Notre manière de jouer</p>
  <blockquote class="rd-quote" data-reveal><p>Une salle de cent douze fauteuils, un plateau nu, et l'idée que le théâtre commence quand le public retient son souffle.</p><footer>Margaux Delaunay, directrice artistique</footer></blockquote>
  <svg class="rd-inter-m" viewBox="0 0 200 60" aria-hidden="true"><path d="M20 10h60v20c0 14-12 22-30 22S20 44 20 30zM40 26q5-5 10 0M58 26q5-5 10 0M38 40q12 8 24 0" fill="none" stroke="#f0c27a" stroke-width="2"/><path d="M120 10h60v20c0 14-12 22-30 22s-30-8-30-22zM140 26q5 5 10 0M158 26q5 5 10 0M138 42q12-8 24 0" fill="none" stroke="#f0c27a" stroke-width="2"/></svg></div></section>`),
  sec(`<section class="rd-block rd-block--alt pk-bleed"><div class="rd-wrap">${act("II", "La saison", "Huit mois, neuf spectacles.", "De novembre à juin, un rendez-vous par mois, sauf décembre qui en compte deux.")}
  <ol class="rd-frise" data-reveal>${MONTHS.map(([k, l]) => { const ss = SHOWS.filter((s) => s[4] === k); return `<li><a href="/saison#mois-${k}"><b>${l}</b>${ss.map((s) => `<span>${esc(s[1])}</span>`).join("")}<small>${ss.map((s) => s[3]).join(" · ")}</small></a></li>`; }).join("")}</ol>
  <div class="rd-hall-teaser" data-reveal><div class="rd-ht-t"><h3 class="rd-h3">Cent douze fauteuils, aucun mauvais rang.</h3><p>Orchestre, balcon, galerie : choisissez vos places sur le plan de la salle. Vous obtenez un récapitulatif à envoyer au théâtre — la réservation se conclut avec la billetterie, par écrit.</p><a class="rd-btn rd-btn--line" href="/billetterie">Ouvrir le plan de salle ${arrow}</a></div>
  <svg class="rd-ht-s" viewBox="0 0 240 150" aria-hidden="true"><path d="M50 12h140l24 22H26z" fill="#8a1c2c" opacity=".7"/><g fill="#f0c27a">${[0, 1, 2, 3, 4].map((r) => Array.from({ length: 12 }, (_, i) => `<rect x="${24 + i * 16 + (r % 2) * 0}" y="${48 + r * 16}" width="11" height="9" rx="2" opacity="${r < 3 ? 0.9 : r < 4 ? 0.6 : 0.4}"/>`).join("")).join("")}</g></svg></div></div></section>`),
  sec(`<section class="rd-block pk-bleed"><div class="rd-wrap">${act("III", "La troupe", "Ceux qui font lever le rideau.", "Cinq comédiens, une scénographe, un créateur lumière, une régie : une équipe permanente depuis 2011.")}
  <ul class="rd-cameos rd-cameos--s" data-reveal>${["margaux", "etienne", "noor", "mathis"].map((k) => `<li class="rd-cameo"><div class="rd-oval">${avatar(PEOPLE[k])}</div><strong>${esc(PEOPLE[k][0])}</strong><span>${esc(PEOPLE[k][1])}</span></li>`).join("")}</ul>
  <p class="rd-tail" data-reveal><a class="rd-more" href="/troupe">Rencontrer toute l'équipe ${arrow}</a></p></div></section>`),
  cta("Une question avant de vous installer ?", "Groupes, scolaires, accessibilité de la salle : écrivez à la billetterie, nous répondons dans la semaine.", "Écrire à la billetterie", "/contact"),
  sec(footer(c)),
];

const saison = (c) => [
  sec(header(c, "saison")),
  pagehead("I", "La saison", "Neuf spectacles, huit mois.", "Filtrez par mois ou par genre ; basculez entre l'affiche et le calendrier."),
  sec(`<section class="rd-block rd-season pk-bleed" data-rd-season data-view="affiches"><div class="rd-wrap">
  <div class="rd-filters" role="group" aria-label="Filtrer la saison">
    <div class="rd-fgrp"><span class="rd-fl-t">Mois</span><div class="rd-chips"><a class="rd-chip is-on" href="#tous" data-rd-f="m" data-v="tous" aria-pressed="true">Tous</a>${MONTHS.map(([k, l]) => `<a class="rd-chip" href="#mois-${k}" data-rd-f="m" data-v="${k}" aria-pressed="false">${l}</a>`).join("")}</div></div>
    <div class="rd-fgrp"><span class="rd-fl-t">Genre</span><div class="rd-chips"><a class="rd-chip is-on" href="#tous" data-rd-f="g" data-v="tous" aria-pressed="true">Tous</a>${GENRES.map(([k, l]) => `<a class="rd-chip" href="#genre-${k}" data-rd-f="g" data-v="${k}" aria-pressed="false">${l}</a>`).join("")}</div></div>
    <div class="rd-fgrp rd-fgrp--v"><span class="rd-fl-t">Vue</span><div class="rd-chips"><a class="rd-chip is-on" href="#affiches" data-rd-view="affiches" aria-pressed="true">Affiches</a><a class="rd-chip" href="#calendrier" data-rd-view="calendrier" aria-pressed="false">Calendrier</a></div></div>
  </div>
  <p class="rd-count" role="status" aria-live="polite"><b data-rd-count>9</b> spectacle(s) affiché(s) sur 9</p>
  <div class="rd-posters rd-posters--all">${SHOWS.map(card).join("")}</div>
  <div class="rd-cal" data-rd-cal><table class="rd-table"><caption class="rd-sr">Calendrier de la saison 2026-2027</caption><thead><tr><th scope="col">Mois</th><th scope="col">Spectacle</th><th scope="col">Genre</th><th scope="col">Durée</th><th scope="col">Représentations</th></tr></thead><tbody>
  ${SHOWS.map((s) => `<tr data-rd-card data-m="${s[4]}" data-g="${s[2]}"><td data-l="Mois">${MONTH_LONG[s[4]]}</td><td data-l="Spectacle"><a href="/spectacle?s=${s[0]}"><strong>${esc(s[1])}</strong></a></td><td data-l="Genre">${esc(s[3])}</td><td data-l="Durée">${esc(s[7])}</td><td data-l="Dates">${esc(short(s))} · <a href="/billetterie?s=${s[0]}">Places</a></td></tr>`).join("")}</tbody></table></div>
  <p class="rd-empty" data-rd-empty>Aucun spectacle ne correspond à ce mois et ce genre. <a href="#tous" data-rd-reset>Réinitialiser les filtres</a></p></div></section>`),
  sec(`<section class="rd-block rd-block--alt pk-bleed"><div class="rd-wrap rd-two">
  <div data-reveal><p class="rd-act"><b>Entracte</b>Bon à savoir</p><h2 class="rd-h2">Venir au théâtre.</h2><p class="rd-sub">Les représentations commencent à l'heure indiquée ; l'accueil ouvre quarante-cinq minutes avant. La salle est de plain-pied et dispose de places pour fauteuils roulants : précisez-le dans votre demande.</p></div>
  <dl class="rd-dl" data-reveal><div><dt>Durée</dt><dd>De 50 minutes (jeune public) à 1 h 50, sans entracte</dd></div><div><dt>Tarifs</dt><dd>Orchestre 28 €, balcon 22 €, galerie 14 € ; jeune public −40 % (montants de démonstration)</dd></div><div><dt>Tarif réduit</dt><dd>−25 % pour les moins de 26 ans et demandeurs d'emploi, sur justificatif</dd></div><div><dt>Groupes</dt><dd>À partir de dix personnes, sur demande écrite</dd></div></dl></div></section>`),
  cta("Votre soirée se dessine ?", "Choisissez vos fauteuils sur le plan de la salle.", "Plan de salle", "/billetterie"),
  sec(footer(c)),
];

const paneOf = (s) => {
  const casting = s[16].map((k) => `<li><strong>${esc(PEOPLE[k][0])}</strong><span>${esc(PEOPLE[k][1])}</span></li>`).join("");
  return `<section class="rd-pane pk-bleed" data-rd-pane="${s[0]}"><div class="rd-wrap rd-pane-in"><div class="rd-pane-p">${poster(s, "rd-poster--l")}</div>
  <div class="rd-pane-b"><p class="rd-k"><span>${esc(s[3])}</span> ${esc(s[7])} · ${esc(MONTH_LONG[s[4]])}</p><h2 class="rd-h2">${esc(s[1])}</h2><p class="rd-lead">${esc(s[15])}</p><p>${esc(s[14])}</p>
  <dl class="rd-dl rd-dl--c"><div><dt>Texte</dt><dd>${esc(s[9])}</dd></div><div><dt>Mise en scène</dt><dd>${esc(PEOPLE[s[10]][0])}</dd></div><div><dt>Durée</dt><dd>${esc(s[7])}</dd></div><div><dt>Public</dt><dd>${s[2] === "jeune" ? "Familles" : "Tout public"}</dd></div></dl>
  <h3 class="rd-h3">Distribution</h3><ul class="rd-cast">${casting}</ul>
  <h3 class="rd-h3">Représentations</h3><ul class="rd-dates">${s[6].map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
  <div class="rd-actions"><a class="rd-btn rd-btn--gold" href="/billetterie?s=${s[0]}">Choisir mes places ${arrow}</a><a class="rd-btn rd-btn--line" href="/saison">Retour à la saison</a></div></div></div></section>`;
};
const spectacle = (c) => [
  sec(header(c, "spectacle")),
  pagehead("II", "À l'affiche", "Les spectacles de la saison.", "Choisissez un titre dans le programme : la fiche s'ouvre ci-dessous."),
  sec(`<section class="rd-tabs-s pk-bleed"><div class="rd-wrap"><div class="rd-tabs" role="tablist" aria-label="Spectacles de la saison">${SHOWS.map((s, i) => `<a class="rd-tab${i ? "" : " is-on"}" href="#sp-${s[0]}" role="tab" aria-selected="${i ? "false" : "true"}" data-rd-tab="${s[0]}"><b>${String(i + 1).padStart(2, "0")}</b><span>${esc(s[1])}</span></a>`).join("")}</div></div></section>`),
  ...[SHOWS.slice(0, 3), SHOWS.slice(3, 6), SHOWS.slice(6)].map((g) => sec(g.map(paneOf).join(""))),
  cta("Un fauteuil vous attend.", "Sélectionnez vos places sur le plan de la salle.", "Plan de salle", "/billetterie"),
  sec(footer(c)),
];

const troupe = (c) => {
  const players = ["etienne", "noor", "aurelien", "solene", "jules"], crew = ["margaux", "baptiste", "iris", "mathis", "zoe", "hector", "louise"];
  return [
    sec(header(c, "troupe")),
    pagehead("III", "La troupe", "Une troupe, un plateau, une salle.", "Depuis 2011, la même équipe répète, joue et accueille dans le Théâtre des Lanternes."),
    sec(`<section class="rd-block pk-bleed"><div class="rd-wrap rd-two rd-two--l"><div data-reveal><p class="rd-act"><b>Manifeste</b>Ce que nous défendons</p><h2 class="rd-h2">Peu de moyens, beaucoup de présence.</h2>
    <p class="rd-big">Nous croyons à un théâtre de proximité : des textes d'aujourd'hui et d'hier, un plateau sans artifice, et une salle assez petite pour entendre chaque respiration.</p><p class="rd-sub">Chaque saison associe une création, des reprises et deux spectacles pour les enfants. Les répétitions sont ouvertes aux classes qui en font la demande.</p></div>
    <ol class="rd-hist" data-reveal><li><time>2011</time><span>Fondation de la compagnie dans une ancienne imprimerie.</span></li><li><time>2015</time><span>Installation au Théâtre des Lanternes, cent douze fauteuils.</span></li><li><time>2019</time><span>Première saison avec deux spectacles jeune public.</span></li><li><time>2024</time><span>Rénovation du plateau et de la régie lumière.</span></li><li><time>2026</time><span>Neuf spectacles à l'affiche, dont trois créations.</span></li></ol></div></section>`),
    sec(`<section class="rd-block rd-block--alt pk-bleed"><div class="rd-wrap">${act("I", "Les comédiens", "Sur le plateau.", "Cinq interprètes, des voix très différentes.")}
    <ul class="rd-cameos" data-reveal>${players.map((k) => `<li class="rd-cameo"><div class="rd-oval">${avatar(PEOPLE[k])}</div><strong>${esc(PEOPLE[k][0])}</strong><span>${esc(PEOPLE[k][1])}</span><small>${esc(SHOWS.filter((s) => s[16].includes(k)).map((s) => s[1]).slice(0, 2).join(" · "))}</small></li>`).join("")}</ul></div></section>`),
    sec(`<section class="rd-block pk-bleed"><div class="rd-wrap">${act("II", "Derrière le rideau", "Ceux qu'on ne voit pas.", "Mise en scène, décor, costumes, lumière, son et accueil.")}
    <ul class="rd-credits" data-reveal>${crew.map((k) => `<li><span class="rd-cr-n">${esc(PEOPLE[k][0])}</span><u aria-hidden="true"></u><span class="rd-cr-r">${esc(PEOPLE[k][1])}</span></li>`).join("")}</ul></div></section>`),
    cta("Envie de rejoindre l'aventure ?", "Stages, ateliers de pratique amateur, accueil en résidence : écrivez-nous.", "Nous écrire", "/contact"),
    sec(footer(c)),
  ];
};

/* Plan de salle : 8 rangs (orchestre A-E, balcon F-G, galerie H), 14 fauteuils par rang séparés par une allée */
const ZONES = [["o", "Orchestre", 28, ["A", "B", "C", "D", "E"]], ["b", "Balcon", 22, ["F", "G"]], ["g", "Galerie", 14, ["H"]]];
const seatRow = (r, z) => `<div class="rd-row" role="group" aria-label="Rang ${r}"><b class="rd-rl" aria-hidden="true">${r}</b><div class="rd-seats">${Array.from({ length: 14 }, (_, i) => `${i === 7 ? '<span class="rd-aisle" aria-hidden="true"></span>' : ""}<a class="rd-s" href="#siege" data-k="${r}${i + 1}" data-z="${z}"></a>`).join("")}</div><b class="rd-rl" aria-hidden="true">${r}</b></div>`;
const billetterie = (c) => [
  sec(header(c, "billetterie")),
  pagehead("IV", "Billetterie", "Choisissez vos places.", "Sélectionnez un spectacle, une date, puis vos fauteuils sur le plan. Le récapitulatif s'envoie à la billetterie."),
  sec(`<section class="rd-demo pk-bleed"><div class="rd-wrap"><p class="rd-demo-in"><strong>Démonstration</strong> Aucune réservation ni aucun paiement n'est enregistré : le plan prépare une demande que vous envoyez ensuite par le formulaire de contact.</p></div></section>`),
  sec(`<section class="rd-block rd-box pk-bleed" data-rd-box><div class="rd-wrap rd-box-in"><div class="rd-box-main">
  <div class="rd-step"><h2 class="rd-h3"><b>1</b> Le spectacle</h2><div class="rd-chips rd-chips--w" role="group" aria-label="Spectacle">${SHOWS.map((s, i) => `<a class="rd-chip${i ? "" : " is-on"}" href="#sp-${s[0]}" aria-pressed="${i ? "false" : "true"}" data-rd-pick="${s[0]}" data-t="${esc(s[1])}" data-f="${s[8]}">${esc(s[1])}</a>`).join("")}</div></div>
  <div class="rd-step"><h2 class="rd-h3"><b>2</b> La représentation</h2>${SHOWS.map((s, i) => `<div class="rd-dg${i ? "" : " is-on"}" data-rd-dg="${s[0]}" role="group" aria-label="Dates de ${esc(s[1])}"><div class="rd-chips rd-chips--w">${s[6].map((d, j) => `<a class="rd-chip${j ? "" : " is-on"}" href="#date" aria-pressed="${j ? "false" : "true"}" data-rd-date data-d="${esc(d)}">${esc(d)}</a>`).join("")}</div></div>`).join("")}</div>
  <div class="rd-step"><h2 class="rd-h3"><b>3</b> Vos fauteuils</h2><p class="rd-sub rd-hint">Touchez un fauteuil libre pour le choisir (huit au plus). Au clavier : flèches pour se déplacer, Entrée ou Espace pour choisir.</p>
  <ul class="rd-legend" aria-label="Légende"><li><i class="rd-s rd-s--k"></i>Libre</li><li><i class="rd-s rd-s--k is-sel"></i>Choisi</li><li><i class="rd-s rd-s--k is-x"></i>Occupé</li></ul>
  <div class="rd-hall"><div class="rd-hall-scroll" ><div class="rd-hall-in"><div class="rd-scene" aria-hidden="true"><span>Scène</span></div>
  ${ZONES.map(([z, name, p, rows]) => `<div class="rd-zone" data-rd-zone="${z}" data-p="${p}"><p class="rd-zl"><strong>${name}</strong><span>${p} €</span></p>${rows.map((r) => seatRow(r, z)).join("")}</div>`).join("")}</div></div></div></div></div>
  <aside class="rd-recap" aria-label="Récapitulatif"><h2 class="rd-h3">Votre sélection</h2>
  <dl class="rd-rdl"><div><dt>Spectacle</dt><dd data-rd-show>${esc(s0[1])}</dd></div><div><dt>Séance</dt><dd data-rd-when>${esc(s0[6][0])}</dd></div></dl>
  <ul class="rd-picked" data-rd-list><li class="rd-none">Aucun fauteuil choisi.</li></ul>
  <a class="rd-switch" href="#reduit" role="switch" aria-checked="false" data-rd-red><i aria-hidden="true"></i>Tarif réduit (−25 %, sur justificatif)</a>
  <p class="rd-total"><span>Total indicatif</span><strong data-rd-total>0 €</strong></p>
  <a class="rd-btn rd-btn--gold" href="/contact" data-rd-go>Envoyer ma demande ${arrow}</a>
  <a class="rd-btn rd-btn--line" href="#copier" data-rd-copy>Copier le récapitulatif</a><a class="rd-clear" href="#vider" data-rd-clear>Tout désélectionner</a>
  <p class="rd-sr" role="status" aria-live="polite" data-rd-live></p>
  <p class="rd-note">Le total est indicatif et sans valeur de réservation. Collez le récapitulatif dans le message du formulaire de contact : la billetterie vous répond par écrit.</p></aside></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c, "contact")),
  pagehead("V", "Contact", "Écrire à la billetterie.", "Une demande de places, une question sur l'accessibilité, un projet d'atelier : un seul formulaire."),
  sec(`<section class="rd-block pk-bleed"><div class="rd-wrap"><div class="rd-ct">${[["Demandes de places", "Joignez le récapitulatif du plan de salle : nous vérifions la disponibilité et répondons par écrit.", "Réponse sous deux jours ouvrés"], ["Groupes et scolaires", "Dès dix personnes, des tarifs et des visites de la salle peuvent être organisés.", "Réponse sous une semaine"], ["Accessibilité", "Salle de plain-pied, places pour fauteuils roulants, boucle magnétique : dites-nous ce qui vous aidera.", "Nous contactons chaque spectateur"]].map(([t, p, d], i) => `<article class="rd-slip" data-reveal><p class="rd-slip-n">${ROMAN[i]}</p><h2 class="rd-h4">${t}</h2><p>${p}</p><small>${d}</small></article>`).join("")}</div>
  <address class="rd-addr rd-addr--b" data-reveal><strong>Théâtre des Lanternes — Compagnie Rideau</strong><br>8 rue du Parterre, 69001 Lyon · Caisse : mardi au samedi, 14 h – 19 h<br><a href="mailto:billetterie@rideau.example">billetterie@rideau.example</a></address></div></section>`),
  { type: "form", heading: "Votre message à la compagnie", intro: "Précisez le spectacle, la date et le nombre de places, ou collez le récapitulatif du plan de salle." },
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c, "recherche")),
  pagehead("—", "Recherche", "Chercher dans le programme.", "Un titre, un comédien, un mois, un genre."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Un spectacle, un nom, un mois…" } }] },
  sec(`<section class="rd-sugg pk-bleed"><div class="rd-wrap"><p class="rd-k"><span>Raccourcis</span> Par genre et par envie</p><div class="rd-chips rd-chips--w">${GENRES.map(([k, l]) => `<a class="rd-chip" href="/saison#genre-${k}">${l}</a>`).join("")}<a class="rd-chip" href="/spectacle?s=${s0[0]}">À l'affiche</a><a class="rd-chip" href="/troupe">La troupe</a><a class="rd-chip" href="/billetterie">Plan de salle</a></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c, "introuvable")),
  sec(`<section class="rd-404 pk-bleed"><div class="rd-wrap rd-404-in"><div class="rd-ghost" aria-hidden="true"><i class="rd-ghost-beam"></i><svg viewBox="0 0 200 240"><path d="M76 120V80a24 24 0 0 1 48 0v40" fill="none" stroke="#f0c27a" stroke-width="3"/><path d="M62 120h76l8 70H54z" fill="#000" opacity=".6" stroke="#f0c27a" stroke-width="2.4"/><path d="M70 190v36M130 190v36M54 190h92" stroke="#f0c27a" stroke-width="3"/><circle cx="100" cy="40" r="16" fill="#f0c27a"/><g stroke="#f0c27a" stroke-width="2" opacity=".6"><path d="M100 10V0M72 22 64 14M128 22l8-8M60 40H48M140 40h12"/></g></svg></div>
  <div><p class="rd-k"><span>Trou de mémoire</span> Erreur 404</p><div class="rd-h1" role="heading" aria-level="1">Cette réplique est tombée dans la fosse.</div><p class="rd-lead">La page demandée n'existe pas ou a changé d'adresse. Le fauteuil est vide, mais la lampe de service reste allumée.</p><div class="rd-actions"><a class="rd-btn rd-btn--gold" href="/">Retour à l'accueil</a><a class="rd-btn rd-btn--line" href="/saison">Voir la saison</a><a class="rd-btn rd-btn--line" href="/recherche">Rechercher</a></div></div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "rideau", name: "Rideau", version: "2.0.0", category: "divertissement", tags: ["sombre", "classique", "luxe"], siteType: "Compagnie de théâtre", featured: true,
  concept: "Un rideau de velours qui s'ouvre sur le spectacle, un menu plein écran en programme de salle, des affiches en colonnes et un plan de salle où l'on choisit ses fauteuils.",
  description: "Compagnie de théâtre : velours bordeaux et clair-obscur, rideau qui s'ouvre, programme de salle plein écran, saison filtrable par mois et genre, fiches de spectacle, troupe, plan de salle à fauteuils cliquables.",
  brand: "Rideau", modules: ["formulaires", "recherche"],
  dna: { header: "menu-plein-ecran-programme-de-salle", hero: "rideau-de-velours-qui-s-ouvre-sur-la-scene", grid: "affiches-en-colonnes-decalees", motion: "rideau-qui-s-ecarte-et-faisceaux-de-projecteur", shapes: "plis-de-velours-cantonniere-et-rampe-de-scene", rhythm: "actes-numerotes-et-entractes", signature: "saison-filtrable-et-plan-de-salle-a-fauteuils-cliquables" },
  tokens: {
    colors: { primary: "#8a1c2c", secondary: "#1d0a11", accent: "#f0c27a", background: "#13060b", surface: "#1d0a11", text: "#f3e7d6", muted: "#c9aea4", success: "#7fcf9b", warning: "#f0c27a", error: "#ff8a8a" },
    fonts: { heading: "font.rozha-one", body: "font.alegreya-sans", button: "font.alegreya-sans", link: "font.alegreya-sans" },
    radius: { sm: 2, md: 3, lg: 6, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#4a2a2e" },
    type: { h1: { size: 48, weight: 400, lineHeight: 1.1, transform: "none" }, h2: { size: 32, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur de la rampe (or)", type: "color", default: "#f0c27a" },
    { key: "velours", label: "Couleur du velours", type: "color", default: "#8a1c2c" },
    { key: "ouverture", label: "Ouverture du rideau", type: "choice", default: "anime", choices: [["anime", "Animée au chargement"], ["fixe", "Rideau déjà ouvert"]] },
    { key: "faisceaux", label: "Faisceaux de projecteur", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masqués"]] },
    { key: "plis", label: "Plis du velours", type: "choice", default: "on", choices: [["on", "Texturés"], ["off", "Unis"]] },
  ],
  menu: [["Accueil", "/"], ["Saison", "/saison"], ["À l'affiche", "/spectacle"], ["La troupe", "/troupe"], ["Billetterie", "/billetterie"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "saison", name: "La saison", render: saison }, { key: "spectacle", name: "Fiche spectacle", render: spectacle },
    { key: "troupe", name: "La troupe", render: troupe }, { key: "billetterie", name: "Billetterie et plan de salle", render: billetterie }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
