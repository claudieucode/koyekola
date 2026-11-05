// Vortex — organisation esport fictive. Direction artistique : interface de jeu (HUD). Noir profond, rouge néon, jaune signal ; coins coupés en clip-path, lignes de scan,
// chiffres de stats en direct, classement triable (colonnes cliquables, filtres jeu / saison) et fiches joueurs en panneau avec graphique radar.
const { sec, esc, nav } = require("../kit");

const GAMES = { strike: "Strike", rift: "Rift", drift: "Drift", brawl: "Brawl" };
const AXES = ["Précision", "Réflexes", "Stratégie", "Cohésion", "Sang-froid", "Polyvalence"];
// id, pseudo, nom, rôle, jeu, âge, radar[6], 2026 [note, kda, victoires %, points], bio
const PLAYERS = [
  ["kaze", "KAZE", "Hugo Marchetti", "Entry fragger", "strike", 22, [88, 92, 70, 78, 74, 66], [87, 1.42, 74, 2410], "Capitaine de Strike. Ouvre chaque round, ne recule jamais, parle peu et décide vite."],
  ["nova", "NOVA", "Lina Okafor", "Sniper", "strike", 20, [96, 84, 72, 70, 90, 61], [85, 1.38, 71, 2290], "Une visée d'horloger. Elle tient les angles longs et change la physionomie d'un round à elle seule."],
  ["rivet", "RIVET", "Mehdi Lahlou", "Soutien", "strike", 24, [70, 74, 88, 94, 82, 80], [79, 1.07, 69, 1980], "Le liant de l'équipe : utilitaires, informations et sacrifices que personne ne voit."],
  ["spectre", "SPECTRE", "Tom Verhaeghe", "Voie centrale", "rift", 21, [82, 86, 90, 76, 80, 84], [83, 3.9, 66, 2150], "Joueur de tempo, il lit la carte quinze secondes avant les autres."],
  ["lynx", "LYNX", "Aïcha Diallo", "Chasseuse", "rift", 23, [80, 90, 84, 82, 78, 88], [81, 3.4, 64, 2040], "Pression constante sur la carte, elle transforme chaque embuscade en avantage d'objectif."],
  ["bolt", "BOLT", "Samuel Costa", "Soutien", "rift", 19, [68, 78, 86, 96, 76, 82], [76, 2.8, 62, 1860], "La voix d'équipe. Le plus jeune de l'effectif, déjà le plus calme dans les fins de partie."],
  ["drifter", "DRIFTER", "Élise Marchand", "Pilote", "drift", 22, [90, 94, 76, 64, 86, 72], [84, 2.1, 68, 2180], "Trajectoires propres, freinage tardif : elle gagne ses courses dans les trois derniers virages."],
  ["apex", "APEX", "Yannis Moreau", "Pilote", "drift", 25, [86, 88, 82, 66, 84, 70], [80, 1.9, 63, 1950], "Le vétéran. Régulier, tactique, imbattable sur les circuits techniques."],
  ["hydra", "HYDRA", "Clara Vidal", "Combattante", "brawl", 23, [84, 96, 80, 60, 88, 74], [82, 2.4, 67, 2090], "Rythme infernal et lecture parfaite de l'adversaire ; la reine des retournements."],
  ["titan", "TITAN", "Omar Haddad", "Combattant", "brawl", 26, [78, 80, 84, 72, 92, 76], [78, 2.0, 60, 1790], "Patience, garde fermée, punition en trois coups. Un mur que les finales n'impressionnent pas."],
];
const SEASONS = ["2026", "2025"];
const statsFor = (p, si) => {
  const b = p[7]; if (si === 0) return b;
  const k = PLAYERS.indexOf(p) + 1;
  return [Math.max(60, b[0] - 3 - (k % 4)), +(b[1] - 0.06 * (1 + k % 3)).toFixed(2), b[2] - 3 - (k % 5), b[3] - 380 - 20 * k];
};
const fr = (n, d = 0) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const pad2 = (n) => String(n).padStart(2, "0");

const radarPts = (vals, c, r) => vals.map((v, i) => { const a = -Math.PI / 2 + (i * Math.PI * 2) / vals.length; return `${(c + Math.cos(a) * r * v / 100).toFixed(1)},${(c + Math.sin(a) * r * v / 100).toFixed(1)}`; }).join(" ");
const miniRadar = (vals) => `<svg class="vx-mini" viewBox="0 0 100 100" aria-hidden="true"><polygon points="${radarPts([100, 100, 100, 100, 100, 100], 50, 40)}" fill="none" stroke="#ffffff33" stroke-width="1"/><polygon points="${radarPts([55, 55, 55, 55, 55, 55], 50, 40)}" fill="none" stroke="#ffffff22" stroke-width="1"/><polygon points="${radarPts(vals, 50, 40)}" fill="#ff244633" stroke="#ff2442" stroke-width="2"/></svg>`;
const pAttrs = (p, si) => { const s = statsFor(p, si); const m = `data-pid="${p[0]}" data-season="${SEASONS[si]}" data-m="${s[0]}|${fr(s[1], 2)}|${s[2]}|${fr(s[3])}"`; return si ? m : `${m} data-name="${esc(p[2])}" data-handle="${esc(p[1])}" data-role="${esc(p[3])}" data-gname="${GAMES[p[4]]}" data-age="${p[5]}" data-r="${p[6].join(",")}" data-bio="${esc(p[8])}"`; };

const logoMark = `<svg class="vx-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 37 20 20 37 3 20z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 10c7 0 11 6 9 11s-8 7-12 3-1-9 3-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`;

const header = (c) => `<header class="vx-head pk-bleed"><div class="vx-bar"><a class="vx-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span>VORTEX</span></a>
  <div class="vx-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}<span class="vx-ind" aria-hidden="true"></span></div>
  <p class="vx-read" aria-hidden="true"><b data-read-n>01</b>/<span data-read-t>01</span> <span data-read-l>Accueil</span></p>
  <a class="vx-btn vx-btn--cta" href="/contact">Recruter</a>
  <details class="vx-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="vx-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="vx-btn" href="/contact">Recruter</a></div></details></div></header>`;

const footer = (c) => `<footer class="vx-foot pk-bleed"><div class="vx-wrap"><div class="vx-foot-grid"><div><a class="vx-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span>VORTEX</span></a><p class="vx-foot-lead">Organisation esport fondée à Lyon en 2019. Quatre divisions, dix joueurs, une seule ambition.</p><address>Vortex Esports · 8 quai des Arts<br>69002 Lyon</address></div>
  <div><h3>Organisation</h3>${nav(c.menu.slice(1, 4), "vx-fl")}</div><div><h3>Compétition</h3>${nav(c.menu.slice(4, 6), "vx-fl")}<a class="vx-fl" href="/recherche">Recherche</a></div><div><h3>Nous écrire</h3><a class="vx-fl" href="/contact">Contact</a><a class="vx-fl" href="/partenaires">Devenir partenaire</a><a class="vx-fl" href="mailto:contact@vortex-esports.example">contact@vortex-esports.example</a></div></div>
  <p class="vx-legal">© Vortex Esports — site de démonstration. Équipes, jeux, joueurs, scores et partenaires sont fictifs.</p></div></footer>`;

const pagehead = (kicker, title, sub, n) => sec(`<section class="vx-ph pk-bleed" data-sec="${esc(kicker.split(" · ")[0])}"><div class="vx-wrap"><p class="vx-kicker" data-reveal>${esc(kicker)}</p><div class="vx-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="vx-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

// ----- Classement triable ---------------------------------------------------------------------------------------------------
const gameChips = (extra = "") => `<div class="vx-fgroup" role="group" aria-label="Filtrer par jeu"><span class="vx-flabel">Jeu</span><a href="#jeu-tous" class="is-on" data-key="game" data-val="all" role="button" aria-pressed="true">Tous</a>${Object.entries(GAMES).map(([k, v]) => `<a href="#jeu-${k}" data-key="game" data-val="${k}" role="button" aria-pressed="false">${v}</a>`).join("")}</div>${extra}`;
const board = ({ limit = 0, full = false } = {}) => {
  const rows = [];
  SEASONS.forEach((s, si) => PLAYERS.forEach((p) => { const st = statsFor(p, si); rows.push({ p, si, st }); }));
  rows.sort((a, b) => a.si - b.si || b.st[3] - a.st[3]);
  let rank = 0;
  const trs = rows.map(({ p, si, st }) => {
    if (si === 0) rank++;
    const hid = si !== 0 || (limit && rank > limit) ? " hidden" : "";
    return `<tr class="vx-row" data-item data-game="${p[4]}" data-season="${SEASONS[si]}"${hid}><td class="vx-rk" data-label="Rang" data-rank>${si === 0 ? pad2(rank) : ""}</td><td class="vx-who-c" data-label="Joueur" data-v="${p[1].toLowerCase()}"><a class="vx-who" href="#joueur-${p[0]}" data-open ${pAttrs(p, si)}><b>${p[1]}</b><small>${esc(p[2])}</small></a></td><td data-label="Jeu" data-v="${p[4]}"><span class="vx-g vx-g--${p[4]}">${GAMES[p[4]]}</span></td><td class="vx-hide-m" data-label="Rôle" data-v="${p[3].toLowerCase()}">${p[3]}</td><td data-label="Note" data-v="${st[0]}"><b>${st[0]}</b></td><td data-label="KDA" data-v="${st[1]}">${fr(st[1], 2)}</td><td data-label="Victoires" data-v="${st[2]}">${st[2]} %</td><td data-label="Points" data-v="${st[3]}"><b>${fr(st[3])}</b></td></tr>`;
  }).join("");
  const th = (i, l, t) => `<th scope="col" aria-sort="${i === 7 ? "descending" : "none"}"><a href="#tri-${i}" data-sort="${i}" data-type="${t}">${l}</a></th>`;
  return `<div class="vx-boardwrap" data-scope${limit ? ` data-limit="${limit}"` : ""} data-sort-init="7"><div class="vx-filters">${gameChips()}<div class="vx-fgroup" role="group" aria-label="Choisir la saison"><span class="vx-flabel">Saison</span><a href="#saison-2026" class="is-on" data-key="season" data-val="2026" role="button" aria-pressed="true">2026</a><a href="#saison-2025" data-key="season" data-val="2025" role="button" aria-pressed="false">2025</a></div>
  <div class="vx-fgroup vx-sortbar" role="group" aria-label="Trier par"><span class="vx-flabel">Trier</span><a href="#tri-4" data-sort="4" data-type="n">Note</a><a href="#tri-5" data-sort="5" data-type="n">KDA</a><a href="#tri-6" data-sort="6" data-type="n">Victoires</a><a href="#tri-7" class="is-on" data-sort="7" data-type="n">Points</a></div></div>
  <div class="vx-box vx-tablebox"><table class="vx-table"><caption class="vx-sr">Classement des joueurs Vortex, triable par colonne</caption><thead><tr><th scope="col">#</th>${th(1, "Joueur", "s")}${th(2, "Jeu", "s")}<th scope="col" class="vx-hide-m">Rôle</th>${th(4, "Note", "n")}${th(5, "KDA", "n")}${th(6, "Vict.", "n")}${th(7, "Pts", "n")}</tr></thead><tbody>${trs}</tbody></table>
  <p class="vx-empty" hidden>Aucun joueur pour ce filtre.</p></div><p class="vx-hint"><span data-count-out aria-live="polite"></span> Cliquez sur un joueur pour ouvrir sa fiche.</p></div>`;
};

// ----- Cartes joueurs --------------------------------------------------------------------------------------------------------
const playerCard = (p, i) => `<a class="vx-pcard vx-cut vx-g-${p[4]}" href="#joueur-${p[0]}" data-open data-item data-game="${p[4]}" ${pAttrs(p, 0)} data-reveal><span class="vx-pnum" aria-hidden="true">${pad2(i + 1)}</span>${miniRadar(p[6])}<span class="vx-pinfo"><span class="vx-g vx-g--${p[4]}">${GAMES[p[4]]}</span><b class="vx-handle">${p[1]}</b><small>${esc(p[2])} · ${p[3]}</small></span><span class="vx-prate"><i>NOTE</i><b>${p[7][0]}</b></span></a>`;
const cards = (list) => list.map(playerCard).join("");

// ----- Matchs ----------------------------------------------------------------------------------------------------------------
const UP = [
  ["strike", "Sam. 21 nov.", "19:00", "Bo3", "Hydrazone Gaming", "Finale de conférence"],
  ["rift", "Dim. 22 nov.", "17:30", "Bo5", "Cobalt Wolves", "Ligue Élite · J.9"],
  ["drift", "Sam. 28 nov.", "21:00", "Course", "Nitro Club", "Grand Prix d'hiver"],
  ["brawl", "Dim. 6 déc.", "16:00", "Bo5", "Sang Neuf", "Open de Lyon"],
];
const RES = [
  ["strike", "Sam. 31 oct.", "Vortex", 2, "Obsidian 5", 0, "V", "13–7 · 13–9"],
  ["rift", "Dim. 25 oct.", "Vortex", 3, "Atlas Prime", 1, "V", "4 manches"],
  ["brawl", "Sam. 24 oct.", "Titan Forge", 3, "Vortex", 2, "D", "5 manches"],
  ["strike", "Sam. 17 oct.", "Vortex", 2, "Nord Légion", 1, "V", "13–11 · 9–13 · 13–6"],
  ["drift", "Dim. 11 oct.", "Vortex", 1, "Nitro Club", 1, "N", "Course sprint"],
  ["rift", "Sam. 3 oct.", "Cobalt Wolves", 2, "Vortex", 3, "V", "5 manches"],
];
const upRows = (n) => UP.slice(0, n || UP.length).map(([g, d, h, f, op, ev]) => `<li class="vx-m vx-cut" data-item data-game="${g}"><span class="vx-m-date"><b>${d}</b><i>${h}</i></span><span class="vx-m-teams"><b>Vortex</b><em>VS</em><b>${op}</b></span><span class="vx-m-meta"><span class="vx-g vx-g--${g}">${GAMES[g]}</span><small>${ev} · ${f}</small></span></li>`).join("");
const resRows = () => RES.map(([g, d, a, x, b, y, r, det]) => `<li class="vx-m vx-cut vx-m--${r}" data-item data-game="${g}"><span class="vx-m-date"><b>${d}</b><i>Terminé</i></span><span class="vx-m-teams"><b>${a}</b><span class="vx-m-score">${x}<u>:</u>${y}</span><b>${b}</b></span><span class="vx-m-meta"><span class="vx-g vx-g--${g}">${GAMES[g]}</span><small>${r === "V" ? "Victoire" : r === "D" ? "Défaite" : "Nul"} · ${det}</small></span></li>`).join("");
const countdown = (label) => `<div class="vx-count" data-countdown="2026-11-21T19:00:00" role="timer" aria-label="${esc(label)}"><div><b data-u="d">00</b><i>jours</i></div><div><b data-u="h">00</b><i>heures</i></div><div><b data-u="m">00</b><i>min</i></div><div><b data-u="s">00</b><i>sec</i></div></div>`;
const nextMatch = () => `<div class="vx-box vx-next" data-reveal><p class="vx-tag">// Prochain match · Strike · Finale de conférence</p><div class="vx-vs"><b>VORTEX</b><span>VS</span><b>HYDRAZONE</b></div><p class="vx-next-meta">Samedi 21 novembre · 19 h 00 · Studio Vortex, Lyon (diffusé en ligne)</p>${countdown("Compte à rebours avant le prochain match")}</div>`;

// ----- Actualités ------------------------------------------------------------------------------------------------------------
const NEWS = [
  ["Compétition", "3 nov.", "Strike : cap sur la finale de conférence", "Deux victoires nettes en quarts et demi-finale : Vortex retrouve Hydrazone Gaming, le 21 novembre."],
  ["Club", "29 oct.", "Le nouveau centre d'entraînement ouvre à Lyon", "Douze postes, une salle de visionnage et un espace récupération : l'équipe emménage fin novembre."],
  ["Académie", "22 oct.", "Détections ouvertes pour l'académie Vortex", "Les joueurs de 16 à 20 ans peuvent candidater via le formulaire de contact avant le 30 novembre."],
  ["Coulisses", "18 oct.", "Une journée avec Élise « Drifter » Marchand", "Simulateur, analyse vidéo, étirements : le quotidien d'une pilote de haut niveau."],
  ["Compétition", "12 oct.", "Brawl : une défaite en cinq manches, des leçons claires", "Titan Forge l'emporte 3–2. Retour sur les moments clés avec le coach."],
  ["Club", "5 oct.", "Résultats de la saison à mi-parcours", "Quatre divisions engagées, trois qualifiées pour les phases finales. Le bilan chiffré."],
];
const newsCard = ([cat, d, t, x], i) => `<a class="vx-news vx-cut${i === 0 ? " vx-news--big" : ""}" href="/contact" data-item data-cat="${cat}" data-reveal><span class="vx-g">${cat}</span><time>${d}</time><h3>${t}</h3><p>${x}</p></a>`;

// ----- Partenaires -----------------------------------------------------------------------------------------------------------
const GLY = [
  `<path d="M6 30 20 8l14 22z" fill="currentColor"/>`, `<circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="20" cy="20" r="4" fill="currentColor"/>`,
  `<path d="M6 8h28v8H14v6h20v10H6z" fill="currentColor"/>`, `<path d="M20 5 34 14v12L20 35 6 26V14z" fill="none" stroke="currentColor" stroke-width="5"/>`,
  `<path d="M6 6h12v12H6zM22 22h12v12H22z" fill="currentColor"/><path d="M22 6h12v12" fill="none" stroke="currentColor" stroke-width="4"/>`, `<path d="M5 20c5-12 10-12 15 0s10 12 15 0" fill="none" stroke="currentColor" stroke-width="5"/>`,
];
const partner = (name, kind, i, big) => `<li class="vx-partner vx-cut${big ? " vx-partner--big" : ""}" data-reveal><svg viewBox="0 0 40 40" aria-hidden="true">${GLY[i % GLY.length]}</svg><b>${name}</b><small>${kind}</small></li>`;

// ----- Pages -----------------------------------------------------------------------------------------------------------------
const sectionHead = (kicker, title, extra = "") => `<div class="vx-sechead"><div><p class="vx-kicker" data-reveal>${kicker}</p><h2 class="vx-h2" data-reveal>${title}</h2></div>${extra}</div>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="vx-hero pk-bleed" data-sec="Accueil"><svg class="vx-hero-art" viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="300" r="290" fill="#ff2442" opacity=".08"/><circle cx="300" cy="300" r="120" fill="#ff2442" opacity=".08"/><g fill="none" stroke="#ff2442" stroke-width="2"><circle cx="300" cy="300" r="280" opacity=".35"/><path d="M300 20A280 280 0 0 1 580 300A190 190 0 0 1 300 490A110 110 0 0 1 190 300A60 60 0 0 1 300 240" stroke-width="3"/><path d="M300 60A240 240 0 0 0 60 300A160 160 0 0 0 300 460" opacity=".5"/></g></svg>
    <div class="vx-wrap vx-hero-in"><div class="vx-hero-copy"><p class="vx-kicker" data-reveal>// Saison 2026 · Organisation esport · Lyon</p><div class="vx-h1" role="heading" aria-level="1" data-reveal>Entrez dans le <span class="vx-glitch" data-text="vortex">vortex</span></div>
      <p class="vx-lead" data-reveal>Quatre divisions, dix joueurs, un seul réflexe : jouer pour gagner. Suivez les matchs, le classement et les fiches de l'effectif.</p>
      <div class="vx-actions" data-reveal><a class="vx-btn vx-btn--lg" href="/matchs">Voir les matchs ${arrow}</a><a class="vx-btn vx-btn--ghost vx-btn--lg" href="/classement">Classement</a></div></div>
      <aside class="vx-box vx-hud" data-reveal aria-label="Statistiques de la saison (valeurs de démonstration)"><div class="vx-hud-top"><span class="vx-live"><i></i>EN DIRECT</span><span>Données de démonstration</span></div>
        <div class="vx-hud-big"><small>Spectateurs</small><b data-live data-base="12480" data-jit="340">12 480</b></div>
        <div class="vx-spark" data-spark aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i data-h="${3 + ((i * 7) % 6)}"></i>`).join("")}</div>
        <dl class="vx-hud-grid"><div><dt>Rang ligue</dt><dd>#2</dd></div><div><dt>Série</dt><dd>7 V</dd></div><div><dt>Victoires</dt><dd data-live data-base="72" data-jit="1" data-suf=" %">72 %</dd></div><div><dt>Ping</dt><dd data-live data-base="18" data-jit="4" data-suf=" ms">18 ms</dd></div></dl></aside></div>
    <div class="vx-scan" aria-hidden="true"></div></section>`),
  sec(`<section class="vx-stats pk-bleed"><ul class="vx-wrap vx-stats-in"><li data-reveal><b data-count="14">14</b><span>trophées</span></li><li data-reveal><b data-count="10">10</b><span>joueurs pros</span></li><li data-reveal><b data-count="240" data-suffix="k">240k</b><span>fans en ligne</span></li><li data-reveal><b data-count="87" data-suffix=" %">87 %</b><span>de victoires à domicile</span></li></ul></section>`),
  sec(`<section class="vx-sec pk-bleed" data-sec="Classement"><div class="vx-wrap">${sectionHead("// 01 — Classement", "Le top de l'effectif", `<a class="vx-more" href="/classement" data-reveal>Classement complet ${arrow}</a>`)}${board({ limit: 5 })}</div></section>`),
  sec(`<section class="vx-sec vx-sec--alt pk-bleed" data-sec="Joueurs"><div class="vx-wrap">${sectionHead("// 02 — Joueurs", "L'effectif", `<a class="vx-more" href="/joueurs" data-reveal>Toutes les fiches ${arrow}</a>`)}<div class="vx-pgrid vx-pgrid--6" data-scope>${cards(PLAYERS.slice(0, 6))}</div></div></section>`),
  sec(`<section class="vx-sec pk-bleed" data-sec="Matchs"><div class="vx-wrap">${sectionHead("// 03 — Matchs", "Prochains rendez-vous", `<a class="vx-more" href="/matchs" data-reveal>Calendrier ${arrow}</a>`)}<div class="vx-split">${nextMatch()}<ol class="vx-mlist">${upRows(4)}</ol></div></div></section>`),
  sec(`<section class="vx-slab pk-bleed" data-sec="Académie"><div class="vx-wrap vx-slab-in"><div><p class="vx-kicker vx-kicker--dark" data-reveal>// Académie Vortex</p><h2 class="vx-h2 vx-h2--dark" data-reveal>Tu vises le haut niveau ?</h2></div><div data-reveal><p class="vx-lead vx-lead--dark">Détections ouvertes pour les 16–20 ans : entraînement encadré, suivi mental, analyse vidéo. Dépose ta candidature via le formulaire de contact.</p><a class="vx-btn vx-btn--dark vx-btn--lg" href="/contact">Candidater ${arrow}</a></div></div></section>`),
  sec(`<section class="vx-sec pk-bleed" data-sec="Actualités"><div class="vx-wrap">${sectionHead("// 04 — Actualités", "À la une", `<a class="vx-more" href="/actualites" data-reveal>Tous les articles ${arrow}</a>`)}<div class="vx-ngrid">${NEWS.slice(0, 3).map(newsCard).join("")}</div></div></section>`),
  sec(`<section class="vx-sec vx-sec--alt pk-bleed" data-sec="Partenaires"><div class="vx-wrap">${sectionHead("// 05 — Partenaires", "Ils jouent avec nous")}<ul class="vx-plist">${[["Nexalis", "Partenaire titre"], ["Kryo Périphériques", "Équipementier"], ["Ondine Énergie", "Boisson officielle"], ["Lumen Fibre", "Connectivité"]].map((x, i) => partner(x[0], x[1], i)).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const equipe = (c) => [sec(header(c)), pagehead("Équipe · L'organisation", "Une unité,<br>quatre divisions", "Fondée en 2019 à Lyon, Vortex forme et accompagne des joueurs sur quatre jeux compétitifs."),
  sec(`<section class="vx-sec pk-bleed" data-sec="Histoire"><div class="vx-wrap vx-about"><div><p class="vx-kicker" data-reveal>// Histoire</p><h2 class="vx-h2" data-reveal>Du garage au studio</h2><p class="vx-p" data-reveal>Vortex naît entre amis, autour d'un seul poste et d'un tournoi local. Sept ans plus tard, l'organisation compte dix joueurs, un staff de sept personnes et son propre centre d'entraînement.</p><p class="vx-p" data-reveal>Notre méthode tient en trois mots : régularité, analyse, bien-être. Chaque joueur dispose d'un plan individuel, d'un suivi mental et de temps de repos réels.</p></div>
    <dl class="vx-box vx-facts" data-reveal><div><dt>Fondation</dt><dd>2019</dd></div><div><dt>Siège</dt><dd>Lyon</dd></div><div><dt>Divisions</dt><dd>4</dd></div><div><dt>Staff</dt><dd>7</dd></div></dl></div></section>`),
  sec(`<section class="vx-sec vx-sec--alt pk-bleed" data-sec="Divisions"><div class="vx-wrap">${sectionHead("// Divisions", "Les rosters")}<div class="vx-rosters">${Object.entries(GAMES).map(([k, v]) => `<article class="vx-box vx-roster vx-g-${k}" data-reveal><h3><span class="vx-g vx-g--${k}">${v}</span></h3><ul>${PLAYERS.filter((p) => p[4] === k).map((p) => `<li><a href="/joueurs"><b>${p[1]}</b><small>${p[3]}</small></a></li>`).join("")}</ul></article>`).join("")}</div></div></section>`),
  sec(`<section class="vx-sec pk-bleed" data-sec="Staff"><div class="vx-wrap">${sectionHead("// Staff", "Autour des joueurs")}<ul class="vx-staff">${[["Julien Arnaud", "Directeur sportif"], ["Marion Petit", "Coach principale"], ["Rayan Belkacem", "Analyste vidéo"], ["Dr Sophie Lambert", "Préparation mentale"], ["Karim Ferrand", "Manager"], ["Alice Roux", "Communication"]].map(([n, r]) => `<li class="vx-cut" data-reveal><span class="vx-av" aria-hidden="true">${n.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span><b>${n}</b><small>${r}</small></li>`).join("")}</ul></div></section>`),
  sec(`<section class="vx-sec vx-sec--alt pk-bleed" data-sec="Palmarès"><div class="vx-wrap">${sectionHead("// Palmarès", "Trophées (fictifs)")}<ol class="vx-time">${[["2026", "Vainqueur Open de Lyon · Drift"], ["2025", "Finaliste Coupe d'Europe · Strike"], ["2024", "Champion de France · Rift"], ["2022", "Premier titre national · Brawl"], ["2019", "Naissance de Vortex"]].map(([y, t]) => `<li data-reveal><b>${y}</b><span>${t}</span></li>`).join("")}</ol></div></section>`),
  sec(footer(c))];

const joueurs = (c) => [sec(header(c)), pagehead("Joueurs · Fiches", "Les joueurs", "Dix profils, six compétences chacun. Ouvrez une fiche pour voir son radar de performance."),
  sec(`<section class="vx-sec pk-bleed" data-sec="Effectif"><div class="vx-wrap"><div data-scope><div class="vx-filters">${gameChips()}</div><p class="vx-hint vx-hint--top">Six axes : ${AXES.join(", ")}.</p><div class="vx-pgrid">${cards(PLAYERS)}</div><p class="vx-empty" hidden>Aucun joueur pour ce filtre.</p><p class="vx-hint"><span data-count-out aria-live="polite"></span></p></div></div></section>`),
  sec(footer(c))];

const classement = (c) => {
  const top = PLAYERS.slice().sort((a, b) => b[7][3] - a[7][3]).slice(0, 3);
  const order = [top[1], top[0], top[2]];
  return [sec(header(c)), pagehead("Classement · Saison 2026", "Classement<br>des joueurs", "Triez par note, KDA, victoires ou points ; filtrez par jeu et par saison."),
    sec(`<section class="vx-sec pk-bleed" data-sec="Podium"><div class="vx-wrap"><ol class="vx-podium">${order.map((p) => `<li class="vx-cut vx-pod vx-pod--${top.indexOf(p) + 1}" data-reveal><span class="vx-pod-n" aria-hidden="true">${top.indexOf(p) + 1}</span><a href="#joueur-${p[0]}" data-open ${pAttrs(p, 0)}><b>${p[1]}</b></a><small>${p[3]} · ${GAMES[p[4]]}</small><strong>${fr(p[7][3])} pts</strong></li>`).join("")}</ol></div></section>`),
    sec(`<section class="vx-sec vx-sec--alt pk-bleed" data-sec="Tableau"><div class="vx-wrap">${board()}</div></section>`),
    sec(`<section class="vx-sec pk-bleed" data-sec="Méthode"><div class="vx-wrap">${sectionHead("// Méthode", "Comment lire le tableau")}<dl class="vx-defs"><div class="vx-box" data-reveal><dt>Note</dt><dd>Indice de performance sur 100, combinant impact en match, régularité et constance.</dd></div><div class="vx-box" data-reveal><dt>KDA</dt><dd>Rapport entre éliminations, assistances et morts. Pour Drift, il s'agit de la moyenne de positions gagnées.</dd></div><div class="vx-box" data-reveal><dt>Points</dt><dd>Total de la saison, de la phase régulière aux finales. Données fictives de démonstration.</dd></div></dl></div></section>`),
    sec(footer(c))];
};

const matchs = (c) => [sec(header(c)), pagehead("Matchs · Calendrier", "Matchs &<br>résultats", "À venir ou terminés, filtrés par jeu."),
  sec(`<section class="vx-sec pk-bleed" data-sec="Prochain match"><div class="vx-wrap">${nextMatch()}</div></section>`),
  sec(`<section class="vx-sec vx-sec--alt pk-bleed" data-sec="Calendrier"><div class="vx-wrap" data-scope data-tabs><div class="vx-filters">${gameChips()}<div class="vx-fgroup" role="tablist" aria-label="Type de matchs"><span class="vx-flabel">Afficher</span><a href="#a-venir" class="is-on" data-tab="fix" role="tab" aria-selected="true">À venir</a><a href="#resultats" data-tab="res" role="tab" aria-selected="false">Résultats</a></div></div>
    <ol class="vx-mlist" data-panel="fix">${upRows()}</ol><ol class="vx-mlist" data-panel="res" hidden>${resRows()}</ol><p class="vx-empty" hidden>Aucun match pour ce filtre.</p></div></section>`),
  sec(footer(c))];

const actualites = (c) => [sec(header(c)), pagehead("Actualités · Journal", "Actualités", "Compétition, club, académie et coulisses."),
  sec(`<section class="vx-sec pk-bleed" data-sec="Articles"><div class="vx-wrap" data-scope><div class="vx-filters"><div class="vx-fgroup" role="group" aria-label="Filtrer par catégorie"><span class="vx-flabel">Thème</span><a href="#tous" class="is-on" data-key="cat" data-val="all" role="button" aria-pressed="true">Tous</a>${["Compétition", "Club", "Académie", "Coulisses"].map((k) => `<a href="#theme-${k.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}" data-key="cat" data-val="${k}" role="button" aria-pressed="false">${k}</a>`).join("")}</div></div><div class="vx-ngrid vx-ngrid--page">${NEWS.map(newsCard).join("")}</div><p class="vx-empty" hidden>Aucun article pour ce thème.</p></div></section>`),
  sec(footer(c))];

const partenaires = (c) => [sec(header(c)), pagehead("Partenaires · Écosystème", "Nos<br>partenaires", "Marques fictives qui soutiennent les équipes Vortex dans cette démonstration."),
  sec(`<section class="vx-sec pk-bleed" data-sec="Titre"><div class="vx-wrap">${sectionHead("// Niveau 1", "Partenaire titre")}<ul class="vx-plist vx-plist--1">${partner("Nexalis", "Partenaire titre · Services numériques", 0, true)}</ul></div></section>`),
  sec(`<section class="vx-sec vx-sec--alt pk-bleed" data-sec="Officiels"><div class="vx-wrap">${sectionHead("// Niveau 2", "Partenaires officiels")}<ul class="vx-plist">${[["Kryo Périphériques", "Équipementier"], ["Ondine Énergie", "Boisson officielle"], ["Lumen Fibre", "Connectivité"], ["Haut-Fer Brasserie", "Soirées fans"], ["Atelier Jade", "Textile & maillots"], ["Cobalt Assurances", "Protection"]].map((x, i) => partner(x[0], x[1], i + 1)).join("")}</ul></div></section>`),
  sec(`<section class="vx-sec pk-bleed" data-sec="Pourquoi"><div class="vx-wrap">${sectionHead("// Pourquoi", "Ce que nous construisons ensemble")}<div class="vx-why"><article class="vx-box" data-reveal><b>01</b><h3>Visibilité</h3><p>Maillots, diffusions et contenus : votre marque dans l'univers des joueurs.</p></article><article class="vx-box" data-reveal><b>02</b><h3>Communauté</h3><p>Une audience jeune et engagée, des événements fans à Lyon et en ligne.</p></article><article class="vx-box" data-reveal><b>03</b><h3>Contenus</h3><p>Coulisses, formats courts et collaborations créées avec vos équipes.</p></article></div></div></section>`),
  sec(`<section class="vx-slab pk-bleed" data-sec="Contact"><div class="vx-wrap vx-slab-in"><div><p class="vx-kicker vx-kicker--dark" data-reveal>// Devenir partenaire</p><h2 class="vx-h2 vx-h2--dark" data-reveal>Parlons de votre projet.</h2></div><div data-reveal><p class="vx-lead vx-lead--dark">Dites-nous qui vous êtes et ce que vous cherchez : nous revenons vers vous avec une proposition sur mesure.</p><a class="vx-btn vx-btn--dark vx-btn--lg" href="/contact">Nous écrire ${arrow}</a></div></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Contact · Transmission", "Nous<br>contacter", "Presse, partenariats, académie ou simple question."),
  { type: "form", heading: "Envoyer un message", intro: "Précisez l'objet de votre demande : nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Recherche · Index", "Une info ?", "Un joueur, un match, un article."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="vx-404 pk-bleed" data-sec="Erreur"><div class="vx-wrap"><p class="vx-kicker">// Signal perdu</p><div class="vx-h1" role="heading" aria-level="1">404</div><p class="vx-ph-sub">Cette page n'existe pas ou a changé d'adresse.</p><a class="vx-btn vx-btn--lg" href="/">Retour à l'accueil</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "vortex", name: "Vortex", version: "2.0.0", category: "divertissement", tags: ["audacieux", "sombre", "technique"], siteType: "Équipe esport", featured: true,
  concept: "Une interface de jeu : cadre HUD aux coins coupés, stats en direct, classement triable et fiches joueurs avec radar de performance.",
  description: "Organisation esport : noir, rouge néon et jaune signal, coins coupés et lignes de scan, hero HUD avec stats en direct, classement triable par jeu et saison, fiches joueurs en panneau avec radar, matchs et partenaires.",
  brand: "Vortex Esports", modules: ["formulaires", "recherche"],
  dna: { header: "barre-coins-coupes-et-indicateur-de-section", hero: "cadre-hud-et-stats-en-direct", grid: "tableau-de-classement-et-cartes-joueurs", motion: "lignes-de-scan-glitch-et-chiffres-en-direct", shapes: "coins-coupes-clip-path-et-reperes-hud", rhythm: "dense-modulaire-hud", signature: "classement-triable-et-fiche-joueur-radar" },
  tokens: {
    colors: { primary: "#ff2442", secondary: "#0d0e13", accent: "#ffe500", background: "#07070a", surface: "#101117", text: "#f2f2f6", muted: "#a9abbb", success: "#2bd576", warning: "#ffe500", error: "#ff6b7e" },
    fonts: { heading: "font.orbitron", body: "font.chakra-petch", button: "font.rajdhani", link: "font.chakra-petch" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2a2c38" },
    type: { h1: { size: 76, weight: 800, lineHeight: 1.02, transform: "uppercase" }, h2: { size: 40, weight: 700, lineHeight: 1.1, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Rouge néon", type: "color", default: "#ff2442" },
    { key: "flash", label: "Jaune signal", type: "color", default: "#ffe500" },
    { key: "cut", label: "Taille des coins coupés", type: "choice", default: "m", choices: [["s", "Fins"], ["m", "Moyens"], ["l", "Larges"]] },
    { key: "scan", label: "Lignes de scan", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "grid", label: "Quadrillage de fond", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Équipe", "/equipe"], ["Joueurs", "/joueurs"], ["Classement", "/classement"], ["Matchs", "/matchs"], ["Actualités", "/actualites"], ["Partenaires", "/partenaires"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "equipe", name: "Équipe", render: equipe }, { key: "joueurs", name: "Joueurs", render: joueurs },
    { key: "classement", name: "Classement", render: classement }, { key: "matchs", name: "Matchs & résultats", render: matchs }, { key: "actualites", name: "Actualités", render: actualites },
    { key: "partenaires", name: "Partenaires", render: partenaires }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche },
    { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
