// Altitude — aviation privée et jets d'affaires. Direction artistique : le silence d'un crépuscule en altitude. Dégradé de ciel acier → pêche, une seule colonne de lecture très aérée,
// typographie fine très espacée, hero = trajectoire d'un jet qui se trace sur l'horizon d'un globe. Navigation minimale (logo + un seul mot « Menu » qui déroule).
// Composant signature : demande de vol (départ, arrivée, date, passagers, appareil) avec distance orthodromique (haversine) et durée calculées, trajet tracé sur une carte SVG ; récapitulatif → /contact.
const { sec, esc } = require("../kit");

// ---------- Données (fictives) ----------
const SPEED_PAD_MIN = 22; // roulage, montée et descente
const AIRPORTS = [
  { c: "VBS", n: "Valmont-Bessan", city: "Paris", r: "Europe", lat: 48.97, lon: 2.45 },
  { c: "LHF", n: "Harrow Field", city: "Londres", r: "Europe", lat: 51.55, lon: -0.45 },
  { c: "GLC", n: "Genève-Léman", city: "Genève", r: "Europe", lat: 46.24, lon: 6.1 },
  { c: "PCR", n: "Port-Clair Riviera", city: "Côte d'Azur", r: "Europe", lat: 43.65, lon: 7.2 },
  { c: "AHC", n: "Haute-Combe Altiport", city: "Alpes", r: "Europe", lat: 45.4, lon: 6.64 },
  { c: "RKA", n: "Aurore", city: "Reykjavik", r: "Europe", lat: 64.13, lon: -21.94 },
  { c: "MAT", n: "Marrakech-Atlas", city: "Marrakech", r: "Afrique", lat: 31.6, lon: -8.03 },
  { c: "MDR", n: "Madère-Atlantis", city: "Funchal", r: "Afrique", lat: 32.69, lon: -16.77 },
  { c: "DKB", n: "Dakar-Baobab", city: "Dakar", r: "Afrique", lat: 14.74, lon: -17.49 },
  { c: "CPT", n: "Le Cap-Table", city: "Le Cap", r: "Afrique", lat: -33.96, lon: 18.6 },
  { c: "DPL", n: "Dubaï-Palmeraie", city: "Dubaï", r: "Moyen-Orient", lat: 25.25, lon: 55.36 },
  { c: "NYH", n: "Hudson Terminal", city: "New York", r: "Amériques", lat: 40.85, lon: -74.06 },
  { c: "MLR", n: "Montréal-Laurier", city: "Montréal", r: "Amériques", lat: 45.47, lon: -73.74 },
  { c: "SAU", n: "Saint-Aurèle", city: "Caraïbes", r: "Amériques", lat: 17.9, lon: -62.84 },
  { c: "TSK", n: "Tokyo-Sakura", city: "Tokyo", r: "Asie", lat: 35.55, lon: 139.78 },
];
const FLEET = [
  { id: "zephyr", n: "Zéphyr 6", cat: "Léger", seats: 6, speed: 720, range: 2600, cab: "1,45", bag: "1,6", ceil: 41000, w: 62, t: "Agile, il se pose là où les grands n'osent pas : altiports, pistes courtes, villes d'affaires." },
  { id: "alize", n: "Alizé 8", cat: "Intermédiaire", seats: 8, speed: 800, range: 5400, cab: "1,75", bag: "3,2", ceil: 45000, w: 74, t: "L'équilibre : une vraie cabine où l'on se tient debout, pour traverser un continent sans escale." },
  { id: "mistral", n: "Mistral 12", cat: "Grand courrier", seats: 12, speed: 870, range: 9200, cab: "1,88", bag: "5,5", ceil: 51000, w: 88, t: "Une cabine à deux espaces, un salon et un coin repos, pour travailler ou se reposer en vol." },
  { id: "boreal", n: "Boréal 16", cat: "Long courrier", seats: 16, speed: 900, range: 12800, cab: "1,95", bag: "8", ceil: 51000, w: 100, t: "Le plus long rayon d'action : relier deux continents d'une seule traite, de nuit comme de jour." },
];
const REGIONS = ["Europe", "Afrique", "Moyen-Orient", "Amériques", "Asie"];
const HUB = AIRPORTS[0];
const MW = 1000, MH = 394, K = MW / 360;
const proj = (lon, lat) => [(lon + 180) * K, (84 - lat) * K];

// ---------- Calculs (identiques à ceux de motion.js) ----------
const rad = Math.PI / 180;
const dist = (a, b) => { const f1 = a.lat * rad, f2 = b.lat * rad, dl = (b.lon - a.lon) * rad; const h = Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };
const mins = (km, f) => Math.round((km / f.speed) * 60 + SPEED_PAD_MIN);
const fmtKm = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const fmtT = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
const bestFor = (km, pax = 1) => FLEET.find((f) => f.range >= km && f.seats >= pax) || FLEET[3];
function gcPath(a, b, n = 48) {
  const f1 = a.lat * rad, l1 = a.lon * rad, f2 = b.lat * rad, l2 = b.lon * rad;
  const d = 2 * Math.asin(Math.sqrt(Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin((l2 - l1) / 2) ** 2)); let out = "", px = null;
  for (let i = 0; i <= n; i++) {
    const f = i / n, A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(f1) * Math.cos(l1) + B * Math.cos(f2) * Math.cos(l2), y = A * Math.cos(f1) * Math.sin(l1) + B * Math.cos(f2) * Math.sin(l2), z = A * Math.sin(f1) + B * Math.sin(f2);
    const [X, Y] = proj(Math.atan2(y, x) / rad, Math.atan2(z, Math.hypot(x, y)) / rad);
    out += (px === null || Math.abs(X - px) > 400 ? "M" : "L") + X.toFixed(1) + " " + Y.toFixed(1); px = X;
  }
  return out;
}

// ---------- Illustrations ----------
const LAND = {
  na: [[-168, 66], [-162, 70], [-140, 70], [-125, 70], [-95, 72], [-82, 68], [-62, 60], [-56, 52], [-66, 45], [-70, 42], [-76, 36], [-81, 30], [-80, 25], [-83, 29], [-90, 29], [-97, 26], [-97, 21], [-90, 21], [-87, 21], [-88, 16], [-83, 10], [-79, 9], [-83, 8], [-86, 12], [-92, 15], [-105, 20], [-110, 24], [-112, 30], [-115, 30], [-110, 23], [-118, 34], [-124, 40], [-124, 48], [-130, 54], [-140, 60], [-152, 59], [-165, 55], [-158, 58], [-166, 62]],
  gl: [[-73, 78], [-60, 82], [-30, 83], [-20, 78], [-20, 70], [-40, 62], [-50, 64], [-55, 70]],
  sa: [[-79, 9], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -14], [-41, -22], [-48, -26], [-58, -35], [-65, -41], [-68, -52], [-72, -54], [-74, -46], [-72, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0], [-77, 4]],
  eu: [[-9, 37], [-9, 43], [-2, 44], [-4, 48], [2, 51], [8, 54], [10, 57], [12, 55], [20, 55], [22, 60], [30, 60], [25, 65], [20, 69], [30, 71], [45, 68], [60, 70], [80, 73], [100, 77], [115, 74], [140, 72], [160, 70], [180, 68], [180, 65], [170, 60], [162, 58], [156, 51], [142, 52], [140, 46], [130, 42], [127, 38], [126, 35], [121, 40], [122, 30], [120, 24], [110, 20], [108, 16], [106, 10], [100, 13], [100, 5], [104, 1], [98, 8], [98, 16], [92, 22], [88, 22], [80, 15], [77, 8], [72, 20], [67, 25], [57, 25], [56, 27], [50, 30], [48, 29], [51, 25], [56, 24], [59, 22], [52, 16], [43, 13], [39, 21], [35, 28], [34, 31], [36, 36], [27, 37], [26, 40], [23, 38], [20, 40], [16, 38], [12, 44], [8, 44], [3, 43], [-1, 37]],
  af: [[-17, 21], [-13, 28], [-6, 36], [10, 37], [11, 33], [20, 31], [32, 31], [35, 28], [43, 12], [51, 12], [44, -2], [40, -15], [35, -24], [32, -29], [20, -35], [18, -32], [12, -17], [13, -6], [9, 4], [-8, 4], [-17, 14]],
  au: [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -34], [130, -32], [115, -34]],
  uk: [[-5, 50], [1, 51], [-2, 56], [-5, 58], [-6, 55], [-3, 54]],
  is: [[-24, 65], [-14, 66], [-14, 64], [-22, 63.5]],
  jp: [[130, 32], [135, 34], [140, 36], [142, 40], [141, 45], [137, 37], [131, 34]],
};
const landPaths = Object.values(LAND).map((p) => `<path d="M${p.map(([lo, la]) => proj(lo, la).map((v) => v.toFixed(1)).join(" ")).join("L")}Z"/>`).join("");
const grat = (() => { let s = ""; for (let lo = -150; lo <= 150; lo += 30) s += `<line x1="${proj(lo, 0)[0].toFixed(1)}" y1="0" x2="${proj(lo, 0)[0].toFixed(1)}" y2="${MH}"/>`; for (let la = 60; la >= -30; la -= 30) s += `<line x1="0" y1="${proj(0, la)[1].toFixed(1)}" x2="${MW}" y2="${proj(0, la)[1].toFixed(1)}"/>`; return s; })();
const JET = `<path d="M16 0L6-2.2-1-13l-4.4 0 2.6 11-9 1-2.4-4h-3.6l1.8 5-1.8 5h3.6l2.4-4 9 1-2.6 11H-1L6 2.2Z" fill="currentColor"/>`;
const dots = (list, cls = "") => list.map((a) => { const [x, y] = proj(a.lon, a.lat); return `<circle class="al-dot${cls}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" data-code="${a.c}"/>`; }).join("");
const mapBase = (inner, cls = "") => `<svg class="al-map ${cls}" viewBox="0 0 ${MW} ${MH}" role="img" aria-label="Carte du monde simplifiée"><rect width="${MW}" height="${MH}" fill="#13243a"/><g class="al-grat" stroke="#8fb0d0" stroke-width=".5" opacity=".18">${grat}</g><g class="al-land" fill="#223b57" stroke="#3b5f86" stroke-width=".8" stroke-linejoin="round">${landPaths}</g>${inner}</svg>`;

// Silhouette de profil d'un jet d'affaires (largeur variable selon le modèle)
const jetSide = (w, cls = "") => `<svg class="al-side ${cls}" viewBox="0 0 320 90" role="img" aria-label="Silhouette de l'appareil" width="${w}"><path d="M22 50Q22 40 44 38L246 36Q292 36 312 50Q292 62 246 62L52 62Q22 62 22 50Z" fill="currentColor"/><path d="M26 42L10 8H30L62 40Z" fill="currentColor"/><path d="M4 8H36" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><rect x="66" y="30" width="58" height="13" rx="6.5" fill="currentColor" opacity=".7"/><path d="M168 56L128 84H148L206 58Z" fill="currentColor" opacity=".85"/><path d="M262 42Q282 40 298 47L262 47Z" fill="#f2a98a" opacity=".9"/><g fill="#f2a98a" opacity=".8">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${112 + i * 18}" cy="46" r="2.2"/>`).join("")}</g></svg>`;

// Hero : horizon d'un globe, trajectoire qui se trace
const stars = [[120, 40], [260, 90], [470, 66], [540, 70], [700, 24], [860, 64], [1020, 36], [1180, 80], [1320, 28]];
const heroArt = `<svg class="al-hero-svg" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<g fill="#f2a98a"><ellipse cx="720" cy="450" rx="620" ry="130" opacity=".05"/><ellipse cx="720" cy="450" rx="470" ry="90" opacity=".08"/><ellipse cx="720" cy="452" rx="330" ry="55" opacity=".12"/><ellipse cx="720" cy="454" rx="200" ry="28" fill="#ffd7bd" opacity=".25"/></g>
<g fill="none" stroke="#f2a98a"><circle cx="720" cy="1450" r="1052" stroke-width="10" opacity=".07"/><circle cx="720" cy="1450" r="1034" stroke-width="5" opacity=".14"/><circle cx="720" cy="1450" r="1024" stroke-width="2" opacity=".5"/></g>
<circle cx="720" cy="1450" r="1020" fill="#0b1626"/>
<g fill="none" stroke="#9db8d4" stroke-width="1" opacity=".16">${[160, 330, 520, 760].map((rx) => `<ellipse cx="720" cy="1450" rx="${rx}" ry="1020"/>`).join("")}<ellipse cx="720" cy="900" rx="920" ry="190"/><ellipse cx="720" cy="1180" rx="1000" ry="380"/></g>
<g fill="#ffd7bd">${[[560, 500, 1.6], [598, 492, 1.2], [640, 484, 1.8], [690, 478, 1.2], [760, 480, 1.6], [820, 486, 1.2], [870, 494, 1.8], [925, 506, 1.2], [510, 520, 1.2], [610, 538, 1.4], [800, 540, 1.4], [700, 560, 1.2], [450, 560, 1.6], [980, 544, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity=".7"/>`).join("")}</g>
<g class="al-dash" fill="none" stroke="#ffd7bd" stroke-width="1.2" opacity=".35"><path d="M240 560C400 360 620 300 760 330"/><path d="M1220 590C1120 420 1000 330 900 340"/></g>
<path class="al-trace-glow" d="M500 454C560 200 880 190 940 450" fill="none" stroke="#f2a98a" stroke-width="9" opacity=".18" stroke-linecap="round"/>
<path class="al-trace" d="M500 454C560 200 880 190 940 450" fill="none" stroke="#ffd7bd" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="500" cy="454" r="5" fill="#ffd7bd"/><circle class="al-ring" cx="500" cy="454" r="5" fill="none" stroke="#ffd7bd" stroke-width="1.2"/><circle class="al-endpt" cx="940" cy="450" r="5" fill="#fff"/>
<g class="al-plane" transform="translate(940 450) rotate(80) scale(1.7)"><g class="al-plane-in">${JET}</g></g></svg>`;
const starsBg = `<svg class="al-stars" viewBox="0 0 1440 120" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${stars.map(([x, y], i) => `<circle class="al-star" cx="${x}" cy="${y}" r="${i % 3 ? 1.1 : 1.8}" fill="#fff" opacity="${i % 2 ? 0.5 : 0.8}"/>`).join("")}</svg>`;

const arrow = `<svg class="al-arr" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6H22M17 1L22 6L17 11" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
const logoMark = `<svg class="al-mark" viewBox="-20 -16 40 32" aria-hidden="true"><g transform="rotate(-30) scale(.95)">${JET}</g></svg>`;

// ---------- Morceaux de page ----------
const header = (c) => `<header class="al-head pk-bleed"><div class="al-head-in">
  <a class="al-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span class="al-logo-t">Altitude</span></a>
  <details class="al-menu"><summary><span>Menu</span><i aria-hidden="true"></i></summary>
    <div class="al-panel" role="navigation" aria-label="Navigation principale">${c.menu.map((m, i) => `<a class="al-pl" href="${esc(m.url)}"><small>${String(i + 1).padStart(2, "0")}</small>${esc(m.label)}</a>`).join("")}<a class="al-pl al-pl--cta" href="/demande">Demander un vol ${arrow}</a></div></details></div></header>`;

const footer = (c) => `<footer class="al-foot pk-bleed"><div class="al-foot-in">
  <div class="al-foot-brand"><div class="al-foot-logo">Altitude</div><p>Aviation d'affaires, sans bruit. Un seul interlocuteur, du premier appel à l'atterrissage.</p></div>
  <div class="al-foot-nav"><h2 class="al-foot-h">Naviguer</h2><div role="navigation" aria-label="Plan du site">${c.menu.slice(1).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/recherche">Recherche</a></div></div>
  <address class="al-foot-addr"><h2 class="al-foot-h">Terminal privé</h2>Hangar 4, aérodrome de Valmont-Bessan<br>Adresse fictive · ouvert 24 h/24<br><a href="mailto:bonjour@altitude.example">bonjour@altitude.example</a></address></div>
  <p class="al-foot-fine">Site de démonstration : Altitude, ses appareils, tarifs, destinations et aéroports sont fictifs. Aucune réservation ni aucun devis n'est enregistré ici.</p></footer>`;

const pagehead = (fl, kicker, title, lead) => sec(`<section class="al-ph pk-bleed">${starsBg}<div class="al-col al-ph-in"><p class="al-fl" data-reveal><span>${fl}</span>${esc(kicker)}</p><div class="al-title" role="heading" aria-level="1" data-reveal>${esc(title)}</div><p class="al-lead" data-reveal>${esc(lead)}</p></div><div class="al-ph-glow" aria-hidden="true"></div></section>`);
const fl = (n, label) => `<p class="al-fl" data-reveal><span>FL ${n}</span>${esc(label)}</p>`;
const cta = (title, text) => sec(`<section class="al-cta pk-bleed"><div class="al-col al-center"><p class="al-fl al-fl--w" data-reveal><span>FL 410</span>Altitude de croisière</p><h2 class="al-h2 al-h2--w" data-reveal>${title}</h2><p class="al-lead al-lead--w" data-reveal>${text}</p><div class="al-actions al-actions--c" data-reveal><a class="al-btn al-btn--light" href="/demande">Demander un vol ${arrow}</a><a class="al-btn al-btn--line" href="/contact">Parler à un conseiller</a></div></div></section>`);

const fleetRow = (f) => `<article class="al-frow" data-reveal><div class="al-frow-art">${jetSide(f.w * 3.2)}</div><div class="al-frow-tx"><p class="al-kick">${esc(f.cat)}</p><h3 class="al-h3">${esc(f.n)}</h3><p>${esc(f.t)}</p><dl class="al-spec"><div><dt>Passagers</dt><dd>${f.seats}</dd></div><div><dt>Portée</dt><dd>${fmtKm(f.range)} km</dd></div><div><dt>Vitesse</dt><dd>${f.speed} km/h</dd></div></dl></div></article>`;

// ---------- Accueil ----------
const routesHome = ["PCR", "MAT", "DPL", "NYH"].map((code) => {
  const a = AIRPORTS.find((x) => x.c === code), km = dist(HUB, a), f = bestFor(km);
  return `<li data-reveal><a class="al-route" href="/demande#VBS-${a.c}"><span class="al-route-c">${HUB.c}</span><span class="al-route-line" aria-hidden="true"><svg viewBox="0 0 30 30" width="22" height="22"><g transform="translate(15 15) rotate(90) scale(.9)">${JET}</g></svg></span><span class="al-route-c">${a.c}</span>
  <span class="al-route-n">${esc(a.city)}<small>${esc(a.n)}</small></span><span class="al-route-d">${fmtKm(km)} km<small>${fmtT(mins(km, f))} · ${esc(f.n)}</small></span></a></li>`;
}).join("");

const home = (c) => [
  sec(header(c)),
  sec(`<section class="al-hero pk-bleed"><div class="al-stars-wrap" aria-hidden="true">${starsBg}</div>
    <div class="al-col al-hero-in"><p class="al-eyebrow" data-reveal>Aviation d'affaires · démonstration</p>
    <div class="al-mega" role="heading" aria-level="1"><span data-reveal>L'altitude</span> <span data-reveal>du silence</span></div>
    <p class="al-lead al-lead--hero" data-reveal>Un jet, un horaire, une cabine pour vous seul. Du premier message à la porte de l'appareil, tout est pensé pour que rien ne se remarque.</p>
    <div class="al-actions al-actions--c" data-reveal><a class="al-btn al-btn--light" href="/demande">Demander un vol ${arrow}</a><a class="al-btn al-btn--line" href="/flotte">Découvrir la flotte</a></div></div>
    <div class="al-hero-art">${heroArt}</div><p class="al-hero-cap" aria-hidden="true"><span>VBS</span><i></i><span>PCR</span></p></section>`),
  sec(`<section class="al-sec pk-bleed"><div class="al-col">${fl("040", "Notre approche")}<h2 class="al-h2 al-h2--big" data-reveal>Voler haut, c'est d'abord aller <em>moins vite vers l'essentiel.</em></h2><p class="al-p" data-reveal>Nous organisons des vols privés pour celles et ceux dont le temps compte. Pas de file, pas de hall, pas d'attente : une voiture jusqu'au pied de l'escalier, un équipage qui connaît vos habitudes, un cap tenu avec précision.</p></div></section>`),
  sec(`<section class="al-sec al-sec--mist pk-bleed"><div class="al-col">${fl("120", "Trois promesses")}<h2 class="al-h2" data-reveal>Ce que nous tenons, à chaque départ</h2>
    <ol class="al-prom"><li data-reveal><b aria-hidden="true">01</b><h3 class="al-h3">Le calme</h3><p>Terminal privé, accueil nominatif, cabine silencieuse. Vous n'entendez que ce que vous avez choisi d'entendre.</p></li>
    <li data-reveal><b aria-hidden="true">02</b><h3 class="al-h3">La précision</h3><p>Une heure de départ tenue à la minute, un plan de vol validé la veille, un point de situation envoyé à chaque étape.</p></li>
    <li data-reveal><b aria-hidden="true">03</b><h3 class="al-h3">L'attention</h3><p>Repas, boissons, température, documents de réunion : tout est préparé à l'avance, sans que vous ayez à le demander.</p></li></ol></div></section>`),
  sec(`<section class="al-sec pk-bleed"><div class="al-col">${fl("210", "Trajectoires")}<h2 class="al-h2" data-reveal>Quelques lignes au départ de Paris</h2><p class="al-p" data-reveal>Distances et durées calculées pour l'appareil le plus adapté. Touchez une ligne pour préparer ce vol.</p>
    <ul class="al-routes">${routesHome}</ul><p class="al-fine" data-reveal>Durées indicatives de démonstration, hors conditions de vent et de trafic.</p></div></section>`),
  sec(`<section class="al-sec al-sec--mist pk-bleed"><div class="al-col">${fl("290", "La flotte")}<h2 class="al-h2" data-reveal>Quatre appareils, une même exigence</h2>${FLEET.map(fleetRow).join("")}<a class="al-more" href="/flotte" data-reveal>Comparer les appareils ${arrow}</a></div></section>`),
  sec(`<section class="al-sec al-sec--deep pk-bleed"><div class="al-col">${fl("350", "Sécurité")}<h2 class="al-h2 al-h2--w" data-reveal>Rien ne décolle avant que tout soit vérifié.</h2><p class="al-p al-p--w" data-reveal>Deux pilotes à chaque vol, une revue de l'appareil avant chaque départ et un centre opérations joignable jour et nuit. Voici les engagements que nous affichons dans cette démonstration.</p>
    <ul class="al-stats"><li data-reveal><b data-count="2">2</b><span>pilotes à bord, sur chaque vol</span></li><li data-reveal><b data-count="24" data-suffix=" h">24 h</b><span>centre opérations, 7 jours sur 7</span></li><li data-reveal><b data-count="62">62</b><span>points de contrôle avant le départ</span></li></ul>
    <a class="al-more al-more--w" href="/securite" data-reveal>Nos engagements ${arrow}</a></div></section>`),
  cta("Votre prochain horizon est à quelques gestes.", "Choisissez un trajet, une date, un appareil : la distance et la durée se calculent sous vos yeux."),
  sec(footer(c)),
];

// ---------- Flotte ----------
const METRICS = [
  { k: "range", l: "Portée", u: "km", get: (f) => f.range }, { k: "speed", l: "Vitesse", u: "km/h", get: (f) => f.speed },
  { k: "seats", l: "Passagers", u: "", get: (f) => f.seats }, { k: "cab", l: "Hauteur de cabine", u: "m", get: (f) => parseFloat(f.cab.replace(",", ".")) },
];
const barGroup = (m, i) => { const mx = Math.max(...FLEET.map(m.get)); return `<div class="al-bars" data-p="${m.k}"${i ? "" : ' data-on="1"'}>${FLEET.map((f) => `<div class="al-bar"><span class="al-bar-n">${esc(f.n)}</span><svg viewBox="0 0 400 8" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="8" fill="#d5dde8"/><rect class="al-bar-v" width="${Math.round((m.get(f) / mx) * 400)}" height="8" fill="#2b4a6b"/></svg><span class="al-bar-v2">${m.k === "cab" ? f.cab : fmtKm(m.get(f))}${m.u ? " " + m.u : ""}</span></div>`).join("")}</div>`; };
const specRows = [["Catégorie", (f) => f.cat], ["Passagers (max.)", (f) => f.seats], ["Portée", (f) => fmtKm(f.range) + " km"], ["Vitesse de croisière", (f) => f.speed + " km/h"], ["Altitude maximale", (f) => fmtKm(f.ceil) + " pieds"], ["Hauteur de cabine", (f) => f.cab + " m"], ["Soute à bagages", (f) => f.bag + " m³"]];
const flotte = (c) => [
  sec(header(c)),
  pagehead("FL 290", "La flotte", "Quatre appareils", "Du jet agile qui rejoint un altiport au long-courrier qui relie deux continents : choisissez la cabine qui correspond à votre trajet."),
  sec(`<section class="al-sec pk-bleed"><div class="al-col">${FLEET.map(fleetRow).join("")}</div></section>`),
  sec(`<section class="al-sec al-sec--mist pk-bleed"><div class="al-col">${fl("330", "Comparer")}<h2 class="al-h2" data-reveal>Une mesure à la fois</h2><p class="al-p" data-reveal>Choisissez ce qui compte pour ce vol : les barres se redessinent à la même échelle.</p>
    <div class="al-cmp" data-tabs><div class="al-chips" role="tablist" aria-label="Critère de comparaison">${METRICS.map((m, i) => `<a class="al-chip" role="tab" href="#${m.k}" data-t="${m.k}" aria-selected="${i ? "false" : "true"}">${m.l}</a>`).join("")}</div>${METRICS.map(barGroup).join("")}</div></div></section>`),
  sec(`<section class="al-sec pk-bleed"><div class="al-wide">${fl("370", "Fiche technique")}<h2 class="al-h2" data-reveal>Toutes les valeurs, côte à côte</h2>
    <table class="al-table" data-reveal><caption>Caractéristiques comparées des quatre appareils de démonstration</caption><thead><tr><th scope="col">Caractéristique</th>${FLEET.map((f) => `<th scope="col">${esc(f.n)}</th>`).join("")}</tr></thead><tbody>${specRows.map(([l, g]) => `<tr><th scope="row">${l}</th>${FLEET.map((f) => `<td data-label="${esc(f.n)}">${g(f)}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <p class="al-fine">Caractéristiques fictives, données à titre de démonstration.</p></div></section>`),
  cta("Quel appareil pour quel trajet ?", "Indiquez vos aéroports et le nombre de passagers : nous vous recommandons l'appareil qui convient."),
  sec(footer(c)),
];

// ---------- Destinations ----------
const destRow = (a) => { const km = dist(HUB, a), f = bestFor(km); return `<li class="al-drow" data-region="${a.r}" data-reveal><a href="/demande#VBS-${a.c}"><span class="al-drow-c">${a.c}</span><span class="al-drow-n">${esc(a.city)}<small>${esc(a.n)} · ${esc(a.r)}</small></span><span class="al-drow-d">${fmtKm(km)} km<small>${fmtT(mins(km, f))} · ${esc(f.n)}</small></span></a></li>`; };
const destinations = (c) => {
  const others = AIRPORTS.slice(1);
  const routes = others.map((a) => `<path class="al-dr" data-region="${a.r}" d="${gcPath(HUB, a)}" fill="none" stroke="#f2a98a" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`).join("");
  return [
    sec(header(c)),
    pagehead("FL 210", "Destinations", "Où nous vous emmenons", "Quatorze aéroports de démonstration, depuis Valmont-Bessan. Filtrez par région et touchez une ligne pour préparer le vol."),
    sec(`<section class="al-sec pk-bleed"><div class="al-wide" data-tabs data-filter><div class="al-dmap" data-reveal>${mapBase(`<g>${routes}</g>${dots(AIRPORTS)}<circle cx="${proj(HUB.lon, HUB.lat)[0].toFixed(1)}" cy="${proj(HUB.lon, HUB.lat)[1].toFixed(1)}" r="7" fill="none" stroke="#ffd7bd" stroke-width="1.5"/>`, "al-map--d")}<p class="al-fine">Tracés orthodromiques depuis Valmont-Bessan (VBS).</p></div>
      <div class="al-chips" role="tablist" aria-label="Filtrer par région"><a class="al-chip" role="tab" href="#tous" data-t="all" aria-selected="true">Toutes</a>${REGIONS.map((r) => `<a class="al-chip" role="tab" href="#${r.toLowerCase().replace(/[^a-z]/g, "")}" data-t="${r}" aria-selected="false">${r}</a>`).join("")}</div>
      <ul class="al-dlist">${others.map(destRow).join("")}</ul><p class="al-fine">Durée calculée avec le plus petit appareil capable de relier les deux aéroports sans escale.</p></div></section>`),
    cta("Une destination qui n'est pas listée ?", "Dites-nous où vous voulez aller : nous étudions chaque demande, aéroport par aéroport."),
    sec(footer(c)),
  ];
};

// ---------- Demande de vol (composant signature) ----------
const apChip = (a, side) => `<a class="al-ap" role="radio" aria-checked="false" href="#${side}-${a.c.toLowerCase()}" data-code="${a.c}" data-lat="${a.lat}" data-lon="${a.lon}" data-name="${esc(a.city)} · ${esc(a.n)}"><b>${a.c}</b><span>${esc(a.city)}</span></a>`;
const catCard = (f) => `<a class="al-cat" role="radio" aria-checked="false" href="#cat-${f.id}" data-id="${f.id}" data-n="${esc(f.n)}" data-seats="${f.seats}" data-speed="${f.speed}" data-range="${f.range}" data-ceil="${f.ceil}"><span class="al-cat-k">${esc(f.cat)}</span><span class="al-cat-n">${esc(f.n)}</span><span class="al-cat-s">${f.seats} places · ${fmtKm(f.range)} km</span><span class="al-cat-w" hidden></span></a>`;
const demande = (c) => [
  sec(header(c)),
  pagehead("FL 250", "Demande de vol", "Tracer un vol", "Cinq choix, une carte, un récapitulatif. La distance et la durée se calculent en direct ; l'étape finale passe par un message à notre équipe."),
  sec(`<section class="al-plan pk-bleed" data-plan data-pad="${SPEED_PAD_MIN}"><div class="al-wide">
    <div class="al-pmap" aria-live="polite">${mapBase(`${dots(AIRPORTS)}<path class="al-rt" d="M0 0" fill="none" stroke="#f2a98a" stroke-width="2.4" stroke-linecap="round"/><circle class="al-ra" r="6" fill="#ffd7bd" cx="-20" cy="-20"/><circle class="al-rb" r="6" fill="#fff" cx="-20" cy="-20"/><g class="al-pj" transform="translate(-30 -30)"><g class="al-pj-s" transform="scale(.9)">${JET}</g></g>`, "al-map--p")}
      <dl class="al-hud"><div><dt>Distance</dt><dd data-o="dist">—</dd></div><div><dt>Durée estimée</dt><dd data-o="time">—</dd></div><div><dt>Cap initial</dt><dd data-o="hdg">—</dd></div></dl></div>
    <p class="al-nojs al-fine">Cet outil de calcul demande JavaScript. Vous pouvez aussi nous écrire directement depuis la page contact.</p>
    <div class="al-steps">
    <section class="al-step"><h2 class="al-step-h"><b>01</b>Départ</h2><div class="al-aps" role="radiogroup" aria-label="Aéroport de départ" data-side="d">${AIRPORTS.map((a) => apChip(a, "d")).join("")}</div></section>
    <section class="al-step"><h2 class="al-step-h"><b>02</b>Arrivée</h2><div class="al-aps" role="radiogroup" aria-label="Aéroport d'arrivée" data-side="a">${AIRPORTS.map((a) => apChip(a, "a")).join("")}</div></section>
    <section class="al-step"><h2 class="al-step-h"><b>03</b>Date</h2><div class="al-days" role="radiogroup" aria-label="Date de départ souhaitée" data-days></div></section>
    <section class="al-step"><h2 class="al-step-h"><b>04</b>Passagers</h2><div class="al-pax"><a class="al-pm" role="button" href="#moins" data-pax="-1" aria-label="Un passager de moins">−</a><span class="al-pv" data-o="pax" aria-live="polite">2</span><a class="al-pm" role="button" href="#plus" data-pax="1" aria-label="Un passager de plus">+</a><span class="al-pl2">passagers (16 au maximum)</span></div></section>
    <section class="al-step"><h2 class="al-step-h"><b>05</b>Catégorie d'appareil</h2><div class="al-cats" role="radiogroup" aria-label="Catégorie d'appareil">${FLEET.map(catCard).join("")}</div><p class="al-note" data-o="note" aria-live="polite"></p></section></div>
    <section class="al-sum"><h2 class="al-h3" data-sumh>Récapitulatif</h2><dl class="al-sum-l"><div><dt>Trajet</dt><dd data-o="s-route">—</dd></div><div><dt>Date souhaitée</dt><dd data-o="s-date">—</dd></div><div><dt>Passagers</dt><dd data-o="s-pax">—</dd></div><div><dt>Appareil</dt><dd data-o="s-cat">—</dd></div><div><dt>Distance et durée</dt><dd data-o="s-dd">—</dd></div></dl>
      <p class="al-warn" data-o="warn" role="status"></p>
      <div class="al-actions"><a class="al-btn" href="/contact" data-send>Envoyer ce récapitulatif ${arrow}</a><a class="al-btn al-btn--ghost" href="#copier" data-copy hidden>Copier le récapitulatif</a></div>
      <p class="al-fine" data-o="copied" role="status">Le récapitulatif se copie, puis se colle dans le message de la page contact. Démonstration : aucun devis, aucune réservation n'est enregistré.</p></section></div></section>`),
  sec(footer(c)),
];

// ---------- Sécurité ----------
const CHECKS = [
  ["Avant le jour du vol", "Le plan de vol est déposé la veille, la météo de la route et des aéroports de dégagement est étudiée par deux personnes différentes. Un résumé vous est envoyé le soir même."],
  ["L'appareil, vérifié deux fois", "Un technicien puis le commandant parcourent la liste de contrôle de l'appareil : moteurs, commandes, oxygène, systèmes de secours. Aucun départ sans double signature."],
  ["L'équipage, reposé", "Deux pilotes qualifiés sur le type d'appareil, des périodes de repos respectées et planifiées, un entraînement au simulateur à intervalles réguliers."],
  ["Les passagers, accompagnés", "Brief de sécurité adapté à la cabine, équipements accessibles, personnel formé aux premiers secours. Si vous préférez ne rien entendre, nous le faisons en deux minutes."],
  ["En vol, une veille permanente", "Le centre opérations suit la route en continu, prêt à proposer un déroutement en cas de météo défavorable ou d'imprévu."],
  ["Après l'atterrissage", "Compte rendu du vol, relevé des anomalies, entretien programmé. Chaque remarque, même minime, est consignée et traitée avant le vol suivant."],
];
const securite = (c) => [
  sec(header(c)),
  pagehead("FL 350", "Engagements sécurité", "La précision d'abord", "Voler sans bruit suppose que tout ait été vérifié avant. Voici comment nous préparons chaque départ, dans cette démonstration."),
  sec(`<section class="al-sec pk-bleed"><div class="al-col">${fl("360", "Chaque vol")}<h2 class="al-h2" data-reveal>Six étapes, dans cet ordre</h2><ol class="al-chk">${CHECKS.map(([t, p], i) => `<li data-reveal><details${i === 0 ? " open" : ""}><summary><b aria-hidden="true">${String(i + 1).padStart(2, "0")}</b><span>${t}</span><i aria-hidden="true"></i></summary><p>${p}</p></details></li>`).join("")}</ol></div></section>`),
  sec(`<section class="al-sec al-sec--deep pk-bleed"><div class="al-col">${fl("380", "En chiffres")}<h2 class="al-h2 al-h2--w" data-reveal>Ce que nous affichons</h2>
    <ul class="al-stats"><li data-reveal><b data-count="2">2</b><span>pilotes qualifiés sur chaque vol</span></li><li data-reveal><b data-count="62">62</b><span>points de contrôle avant le départ</span></li><li data-reveal><b data-count="24" data-suffix=" h">24 h</b><span>centre opérations joignable, jour et nuit</span></li><li data-reveal><b data-count="4">4</b><span>aéroports de dégagement étudiés par route</span></li></ul><p class="al-fine al-fine--w">Engagements de démonstration, présentés à titre d'exemple de ce qu'un opérateur peut afficher.</p></div></section>`),
  sec(`<section class="al-sec pk-bleed"><div class="al-col">${fl("400", "Questions fréquentes")}<h2 class="al-h2" data-reveal>Avant de partir</h2><div class="al-faq">
    <details data-reveal><summary><span>Puis-je voyager avec un animal ?</span><i aria-hidden="true"></i></summary><p>Oui, dans la plupart des cas : précisez-le dans votre message afin que la cabine et les formalités de la destination soient préparées.</p></details>
    <details data-reveal><summary><span>Que se passe-t-il en cas de mauvais temps ?</span><i aria-hidden="true"></i></summary><p>Le commandant décide. Nous vous proposons un autre horaire ou un autre aéroport proche, et nous réorganisons la voiture d'arrivée.</p></details>
    <details data-reveal><summary><span>Quels bagages sont acceptés ?</span><i aria-hidden="true"></i></summary><p>La soute de chaque appareil est indiquée en mètres cubes dans la fiche technique. Pour du matériel hors format, écrivez-nous en amont.</p></details></div></div></section>`),
  cta("Un vol préparé comme il se doit.", "Parlez-nous de votre trajet : un conseiller vous répond le jour même."),
  sec(footer(c)),
];

// ---------- Contact, recherche, introuvable ----------
const contact = (c) => [
  sec(header(c)),
  pagehead("FL 100", "Contact", "Parlons de votre vol", "Un trajet, une date, un nombre de passagers : le message suffit. Un conseiller vous répond sous quelques heures."),
  { type: "form", heading: "Votre message", intro: "Si vous avez préparé un vol sur la page de demande, collez le récapitulatif dans le message." },
  sec(`<section class="al-sec al-sec--tight pk-bleed"><div class="al-col"><ul class="al-info"><li data-reveal><h2 class="al-h3">Terminal privé</h2><address>Hangar 4, aérodrome de Valmont-Bessan<br>Adresse fictive · accueil 24 h/24</address></li><li data-reveal><h2 class="al-h3">Écrire</h2><p><a class="al-lnk" href="mailto:bonjour@altitude.example">bonjour@altitude.example</a></p></li><li data-reveal><h2 class="al-h3">Préparer le vol</h2><p>Calculez distance et durée avant de nous écrire.</p><a class="al-more" href="/demande">Demande de vol ${arrow}</a></li></ul></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [sec(header(c)), pagehead("FL 060", "Recherche", "Chercher dans le ciel", "Un appareil, une destination, un engagement : trouvez-le sur tout le site."), { type: "layout", children: [{ type: "search", props: { placeholder: "Appareil, destination, sécurité…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="al-404 pk-bleed">${starsBg}<div class="al-col al-center"><p class="al-fl"><span>FL 000</span>Cap perdu</p><div class="al-mega al-mega--404" role="heading" aria-level="1">Page introuvable</div><p class="al-lead">Cette page n'existe pas ou a changé d'adresse. Reprenons de l'altitude.</p><div class="al-actions al-actions--c"><a class="al-btn al-btn--light" href="/">Retour à l'accueil ${arrow}</a><a class="al-btn al-btn--line" href="/destinations">Voir les destinations</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "altitude", name: "Altitude", version: "2.0.0", category: "voyage", tags: ["minimaliste", "luxe", "moderne"], siteType: "Aviation privée et jets d'affaires", featured: true,
  concept: "Le silence d'un crépuscule en altitude : une seule colonne de lecture, un jet qui trace sa route sur l'horizon d'un globe, et une demande de vol dont la distance se calcule réellement.",
  description: "Aviation privée sur ciel de crépuscule acier et pêche : hero à trajectoire tracée sur un globe, menu en un mot, colonne unique aérée, comparateur de flotte et demande de vol avec distance et durée calculées sur carte.",
  brand: "Altitude Aviation Privée", modules: ["formulaires", "recherche"],
  dna: {
    header: "barre-minimale-logo-et-menu-en-un-mot-deroulant", hero: "trajectoire-de-jet-tracee-sur-l-horizon-d-un-globe", grid: "colonne-unique-de-lecture-sans-grille",
    motion: "trace-de-route-qui-se-dessine-et-avion-qui-glisse-le-long-du-trajet", shapes: "horizon-de-globe-meridiens-fins-et-arcs-orthodromiques",
    rhythm: "air-genereux-et-paliers-de-niveau-de-vol-en-montee", signature: "demande-de-vol-distance-haversine-duree-et-trajet-sur-carte-du-monde",
  },
  tokens: {
    colors: { primary: "#2b4a6b", secondary: "#0f1c2c", accent: "#f2a98a", background: "#f5f7fa", surface: "#ffffff", text: "#162235", muted: "#4a5a70", success: "#1c7a3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.italiana", body: "font.lexend-deca", button: "font.lexend-deca", link: "font.lexend-deca" },
    radius: { sm: 2, md: 4, lg: 6, button: 0, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#162235" },
    type: { h1: { size: 88, weight: 400, lineHeight: 1.05, transform: "uppercase" }, h2: { size: 42, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Teinte du couchant", type: "color", default: "#f2a98a" },
    { key: "sky", label: "Ciel", type: "choice", default: "dusk", choices: [["dusk", "Crépuscule"], ["dawn", "Aube"], ["night", "Nuit"]] },
    { key: "trail", label: "Trajectoire du hero", type: "choice", default: "on", choices: [["on", "Animée"], ["off", "Fixe"]] },
    { key: "stars", label: "Étoiles", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masquées"]] },
    { key: "air", label: "Aération", type: "choice", default: "normal", choices: [["normal", "Ample"], ["max", "Très ample"]] },
  ],
  menu: [["Accueil", "/"], ["Flotte", "/flotte"], ["Destinations", "/destinations"], ["Demande de vol", "/demande"], ["Sécurité", "/securite"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "flotte", name: "Flotte", render: flotte }, { key: "destinations", name: "Destinations", render: destinations },
    { key: "demande", name: "Demande de vol", render: demande }, { key: "securite", name: "Engagements sécurité", render: securite }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
