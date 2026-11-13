// Aides d'ILLUSTRATION (agent a12) : dessins vectoriels uniques pour les familles « Maison, mobilier et déco » (ft2-410 à 415) et « Mobilité électrique et vélos » (ft2-416 à 421).
// Chaque fonction renvoie une chaîne SVG (formes seulement, aria-hidden, aucune image externe, aucun script). `vue` / `une` posent le dessin dans un widget « html ».
const { compact } = require("../../kit");
const { G, Moteur } = require("./kit-v2");

const enveloppe = (w, h, corps, ratio = "xMidYMid slice") => `<span aria-hidden="true"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="${ratio}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
// Deux variantes (large / étroite) masquées par écran.
const vue = (k, large, etroit, st) => [
  { ...k.W("html", { html: large }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["mobile"] },
  { ...k.W("html", { html: etroit }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["desktop", "tablet"] },
];
const une = (k, svg, st) => k.W("html", { html: svg }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st }));
const r = (n) => Math.round(n * 10) / 10;

// ── 410 Lin et Terre : rangée de poteries sur un lin rayé ───────────────────────────────────────────────────────────────────────────────────────
function vase(cx, base, w, h, neck, sh, fill, ligne, tige) {
  const top = base - h, ys = base - h * sh;
  const d = `M${r(cx - w * neck)},${r(top)} L${r(cx + w * neck)},${r(top)} L${r(cx + w * neck * 0.8)},${r(base - h * (sh + 0.12))} C${r(cx + w * 0.62)},${r(ys)} ${r(cx + w * 0.58)},${r(base - h * 0.12)} ${r(cx + w * 0.32)},${r(base)} L${r(cx - w * 0.32)},${r(base)} C${r(cx - w * 0.58)},${r(base - h * 0.12)} ${r(cx - w * 0.62)},${r(ys)} ${r(cx - w * neck * 0.8)},${r(base - h * (sh + 0.12))} Z`;
  let s = `<path d="${d}" fill="${fill}"/>`;
  s += `<path d="M${r(cx - w * 0.36)},${r(base - h * 0.4)} L${r(cx + w * 0.36)},${r(base - h * 0.4)} M${r(cx - w * 0.3)},${r(base - h * 0.3)} L${r(cx + w * 0.3)},${r(base - h * 0.3)}" stroke="${ligne}" stroke-width="3" fill="none"/>`;
  s += `<rect x="${r(cx - w * neck - 4)}" y="${r(top - 3)}" width="${r(w * neck * 2 + 8)}" height="7" fill="${ligne}"/>`;
  if (tige) s += `<path d="M${cx},${r(top)} C${cx - 8},${r(top - h * 0.5)} ${cx + 14},${r(top - h * 0.7)} ${cx + 4},${r(top - h * 0.95)} M${cx},${r(top - h * 0.3)} L${cx - 26},${r(top - h * 0.42)} M${cx + 4},${r(top - h * 0.62)} L${cx + 30},${r(top - h * 0.72)}" stroke="#fbe3cf" stroke-width="3" fill="none"/><path d="M${cx - 26},${r(top - h * 0.42)} l-14,-4 l8,-10 Z M${cx + 30},${r(top - h * 0.72)} l14,-2 l-6,-12 Z M${cx + 4},${r(top - h * 0.95)} l-8,-12 l16,-2 Z" fill="#fbe3cf"/>`;
  return s;
}
function poteries(w, h, n) {
  const base = h - 14, cols = ["#8f3b22", "#fbe3cf", "#d9a441", "#6e2c18", "#e8a97e", "#fff4e6", "#c8663f"];
  let s = `<rect width="${w}" height="${h}" fill="#a8472a"/><rect y="${base}" width="${w}" height="14" fill="#6e2c18"/>`;
  for (let x = 0; x < w; x += 22) s += `<rect x="${x}" width="2" height="${base}" fill="#b95a3a"/><rect x="${x + 11}" width="1" height="${base}" fill="#93391f"/>`;
  const pas = w / n;
  for (let i = 0; i < n; i++) {
    const cx = pas * (i + 0.5), alt = [0.74, 1, 0.62, 0.88, 0.7, 0.94, 0.58][i % 7], hh = (h - 40) * alt;
    s += vase(r(cx), base, r(pas * [0.52, 0.42, 0.5, 0.4, 0.46, 0.5, 0.38][i % 7]), r(hh), [0.2, 0.26, 0.16, 0.3, 0.22, 0.18, 0.28][i % 7], [0.78, 0.7, 0.82, 0.66, 0.74, 0.8, 0.7][i % 7], cols[i % 7], i % 2 ? "#a8472a" : "#fff4e6", i === 2 || i === 5);
  }
  return enveloppe(w, h, s);
}

// ── 411 Verdier Intérieurs : le salon vu par la fenêtre (canapé, lampadaire, plante) ───────────────────────────────────────────────────────────
function salon() {
  const s = `<rect width="640" height="330" fill="#e8dfc8"/><rect x="40" y="24" width="360" height="224" fill="#dfe9dc" stroke="#1f3d2e" stroke-width="8"/><rect x="44" y="28" width="352" height="70" fill="#cfe0d2"/><rect x="44" y="98" width="352" height="60" fill="#e6eddc"/>
<circle cx="300" cy="96" r="34" fill="#e9c46a"/><path d="M48 240 L48 190 C110 150 170 200 240 168 C300 140 350 190 392 176 L392 240 Z" fill="#2a5240"/><path d="M48 240 L48 214 C120 188 200 226 270 204 C330 188 360 216 392 206 L392 240 Z" fill="#1f3d2e"/>
<path d="M220 24 V248 M40 136 H400" stroke="#1f3d2e" stroke-width="6"/><rect x="28" y="248" width="384" height="14" fill="#1f3d2e"/>
<rect y="262" width="640" height="68" fill="#c9a26b"/><path d="M0 286 H640 M0 310 H640" stroke="#b58d54" stroke-width="3"/>
<rect x="120" y="288" width="330" height="30" fill="#8a4b12" opacity="0.35"/>
<rect x="100" y="206" width="300" height="78" fill="#1f3d2e"/><rect x="84" y="226" width="34" height="68" fill="#2a5240"/><rect x="382" y="226" width="34" height="68" fill="#2a5240"/><rect x="118" y="188" width="264" height="44" fill="#2a5240"/>
<rect x="132" y="196" width="76" height="30" fill="#e9c46a"/><rect x="292" y="196" width="76" height="30" fill="#f4efe3"/><rect x="112" y="294" width="14" height="14" fill="#14261c"/><rect x="374" y="294" width="14" height="14" fill="#14261c"/>
<circle cx="520" cy="110" r="98" fill="#e9c46a" opacity="0.12"/><circle cx="520" cy="110" r="78" fill="#e9c46a" opacity="0.16"/><circle cx="520" cy="110" r="58" fill="#e9c46a" opacity="0.22"/><path d="M520 150 V300 M492 300 H548" stroke="#14261c" stroke-width="6" fill="none"/><path d="M490 150 L550 150 L538 98 L502 98 Z" fill="#e9c46a"/>
<rect x="566" y="262" width="40" height="52" fill="#8a4b12"/><path d="M586 262 C560 220 556 190 576 150 C588 190 596 220 586 262 Z M586 262 C612 230 626 206 622 172 C600 196 590 226 586 262 Z M586 262 C560 250 536 240 528 214 C554 220 576 236 586 262 Z" fill="#2a5240"/>`;
  return enveloppe(640, 330, s, "xMidYMid meet");
}

// ── 412 Casa Quadra : frise de huit carreaux graphiques (quarts de cercle, rayures, pois) ──────────────────────────────────────────────────────
function carreaux(n, taille) {
  const E = "#161616", O = "#e09a2d", C = "#ffcf70", P = "#f7efe0", t = taille;
  const motifs = [
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${C}"/><path d="M${x} ${t} L${x} 0 A${t} ${t} 0 0 1 ${x + t} ${t} Z" fill="${E}"/>`,
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${E}"/><circle cx="${x + t / 2}" cy="${t / 2}" r="${t * 0.34}" fill="${O}"/><circle cx="${x + t / 2}" cy="${t / 2}" r="${t * 0.14}" fill="${E}"/>`,
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${P}"/>` + [0, 1, 2, 3].map((i) => `<rect x="${x}" y="${i * t / 4}" width="${t}" height="${t / 8}" fill="${E}"/>`).join(""),
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${O}"/><path d="M${x + t} 0 L${x + t} ${t} A${t} ${t} 0 0 1 ${x} 0 Z" fill="${P}"/>`,
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${E}"/>` + [0, 1, 2].map((i) => [0, 1, 2].map((j) => `<rect x="${x + t * (0.12 + j * 0.3)}" y="${t * (0.12 + i * 0.3)}" width="${t * 0.2}" height="${t * 0.2}" fill="${(i + j) % 2 ? C : P}"/>`).join("")).join(""),
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${C}"/><path d="M${x} 0 L${x + t} ${t} L${x} ${t} Z" fill="${E}"/><circle cx="${x + t * 0.72}" cy="${t * 0.3}" r="${t * 0.14}" fill="${E}"/>`,
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${P}"/><circle cx="${x + t / 2}" cy="${t}" r="${t * 0.5}" fill="${O}"/><circle cx="${x + t / 2}" cy="${t}" r="${t * 0.28}" fill="${E}"/>`,
    (x) => `<rect x="${x}" width="${t}" height="${t}" fill="${O}"/><rect x="${x + t * 0.25}" y="${t * 0.25}" width="${t * 0.5}" height="${t * 0.5}" fill="${E}"/><rect x="${x + t * 0.42}" y="${t * 0.42}" width="${t * 0.16}" height="${t * 0.16}" fill="${P}"/>`,
  ];
  let s = "";
  for (let i = 0; i < n; i++) s += motifs[i % 8](r(i * t));
  return enveloppe(r(n * t), t, s);
}

// ── 413 Atelier Sorel : planche technique (table, chaise, bibliothèque) avec cotes vermillon ─────────────────────────────────────────────────────
function planche(w, h, seul) {
  const E = "#141414", V = "#d8391c", cote = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${V}" stroke-width="1.5"/>` + (y1 === y2 ? `<path d="M${x1} ${y1 - 7} v14 M${x2} ${y2 - 7} v14" stroke="${V}" stroke-width="1.5"/>` : `<path d="M${x1 - 7} ${y1} h14 M${x2 - 7} ${y2} h14" stroke="${V}" stroke-width="1.5"/>`);
  const table = (x, y) => `<g stroke="${E}" stroke-width="3" fill="none"><rect x="${x}" y="${y}" width="250" height="14" fill="#efebe2"/><path d="M${x + 22} ${y + 14} V${y + 120} M${x + 228} ${y + 14} V${y + 120} M${x + 22} ${y + 40} H${x + 228}"/></g>${cote(x, y + 150, x + 250, y + 150)}${cote(x + 280, y, x + 280, y + 120)}`;
  const chaise = (x, y) => `<g stroke="${E}" stroke-width="3" fill="none"><path d="M${x + 14} ${y} V${y + 130} M${x + 14} ${y + 20} H${x + 14} M${x + 14} ${y} H${x + 22} V${y + 66} H${x + 14}"/><rect x="${x + 14}" y="${y + 66}" width="116" height="12" fill="#efebe2"/><path d="M${x + 24} ${y + 78} V${y + 130} M${x + 120} ${y + 78} V${y + 130} M${x + 14} ${y + 8} H${x + 22} M${x + 22} ${y + 6} H${x + 36} V${y + 66} M${x + 22} ${y + 30} H${x + 36} M${x + 22} ${y + 48} H${x + 36}"/></g>${cote(x + 14, y + 150, x + 130, y + 150)}`;
  const biblio = (x, y) => `<g stroke="${E}" stroke-width="3" fill="none"><rect x="${x}" y="${y - 40}" width="150" height="170"/><path d="M${x} ${y} H${x + 150} M${x} ${y + 40} H${x + 150} M${x} ${y + 80} H${x + 150} M${x + 75} ${y - 40} V${y}"/></g><rect x="${x + 14}" y="${y + 10}" width="10" height="30" fill="${V}"/><rect x="${x + 28}" y="${y + 16}" width="8" height="24" fill="${E}"/><rect x="${x + 100}" y="${y + 50}" width="14" height="30" fill="${V}"/>${cote(x - 18, y - 40, x - 18, y + 130)}`;
  let grille = ""; for (let x = 0; x <= w; x += 20) grille += `M${x} 0V${h}`; for (let y = 0; y <= h; y += 20) grille += `M0 ${y}H${w}`;
  let s = `<path d="${grille}" fill="none" stroke="#141414" opacity="0.09" stroke-width="1"/><path d="M0 ${h - 26} H${w}" stroke="${E}" stroke-width="2" stroke-dasharray="14 6 2 6"/>`;
  if (seul) s += `<g transform="translate(20 20) scale(0.62)">${chaise(20, 60)}</g><g transform="translate(170 36) scale(0.62)">${table(10, 40)}</g>`;
  else s += `<g transform="translate(60 8)">${table(0, 40)}</g><g transform="translate(480 8)">${chaise(0, 30)}</g><g transform="translate(760 8)">${biblio(0, 70)}</g><g transform="translate(1030 8)"><path d="M0 150 H220" stroke="${E}" stroke-width="2"/><path d="M110 150 V30 M80 150 L110 120 L140 150" stroke="${V}" stroke-width="2" fill="none"/><circle cx="110" cy="84" r="46" fill="none" stroke="${E}" stroke-width="3"/><circle cx="110" cy="84" r="4" fill="${V}"/></g>`;
  return enveloppe(w, h, s);
}

// ── 414 Maison Delorme : médaillon d'art de la table (assiette, couverts, fleurs, lauriers) ────────────────────────────────────────────────────
function medaillon() {
  let s = `<circle cx="120" cy="120" r="116" fill="#ecd6d0" stroke="#3b1f2b" stroke-width="2"/><circle cx="120" cy="120" r="108" fill="none" stroke="#3b1f2b" stroke-width="1"/>`;
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; s += `<ellipse cx="${r(120 + Math.cos(a) * 86)}" cy="${r(120 + Math.sin(a) * 86)}" rx="14" ry="7" transform="rotate(${r((a * 180) / Math.PI + 90)} ${r(120 + Math.cos(a) * 86)} ${r(120 + Math.sin(a) * 86)})" fill="#9a3b52" opacity="${i % 2 ? 0.55 : 0.9}"/>`; }
  s += `<circle cx="120" cy="120" r="64" fill="#f4e6e1" stroke="#3b1f2b" stroke-width="2.5"/><circle cx="120" cy="120" r="48" fill="none" stroke="#9a3b52" stroke-width="2"/><circle cx="120" cy="120" r="38" fill="#fff" stroke="#3b1f2b" stroke-width="1"/>`;
  s += `<path d="M120 100 C128 108 128 120 120 128 C112 120 112 108 120 100 Z M104 118 C112 112 120 114 124 122 C116 128 108 126 104 118 Z M136 118 C128 112 120 114 116 122 C124 128 132 126 136 118 Z" fill="#9a3b52"/>`;
  s += `<path d="M34 76 V164 M28 76 V104 M34 76 V104 M40 76 V104 M28 104 C28 116 40 116 40 104 M34 116 V164" stroke="#3b1f2b" stroke-width="3" fill="none"/><path d="M206 76 C196 90 196 112 206 120 V164 M206 76 C214 100 214 112 206 120" stroke="#3b1f2b" stroke-width="3" fill="none"/>`;
  return enveloppe(240, 240, s, "xMidYMid meet");
}

// ── 415 Brasse et Noyer : coupe d'un tronc de noyer (cernes) ───────────────────────────────────────────────────────────────────────────────────
function cernes() {
  let s = `<rect width="360" height="360" fill="#3a2a20"/><ellipse cx="180" cy="184" rx="168" ry="160" fill="#2a1d15"/><ellipse cx="178" cy="182" rx="158" ry="150" fill="#6e4a2e"/><ellipse cx="176" cy="182" rx="110" ry="104" fill="#7d5636" opacity="0.7"/><ellipse cx="174" cy="182" rx="60" ry="56" fill="#8a5a34" opacity="0.8"/>`;
  for (let i = 1; i <= 15; i++) { const k = i / 15, rx = 150 * k, ry = 142 * k, dx = Math.sin(i * 1.7) * 6, dy = Math.cos(i * 2.3) * 5; s += `<ellipse cx="${r(176 + dx - (1 - k) * 8)}" cy="${r(182 + dy)}" rx="${r(rx)}" ry="${r(ry)}" fill="none" stroke="${i % 3 === 0 ? "#2a1d15" : "#d9a441"}" stroke-width="${i % 3 === 0 ? 2.5 : 1.4}" opacity="${r(0.35 + k * 0.5)}" transform="rotate(${i * 7} 180 182)"/>`; }
  s += `<path d="M178 182 L312 150 M178 182 L290 268 M178 182 L60 230" stroke="#2a1d15" stroke-width="2" opacity="0.7"/><circle cx="176" cy="182" r="6" fill="#2a1d15"/><path d="M300 330 L340 300 M312 340 L350 312" stroke="#d9a441" stroke-width="3"/>`;
  return enveloppe(360, 360, s, "xMidYMid meet");
}

// ── 416 Volt Atelier : vélo électrique au trait (batterie citron) ───────────────────────────────────────────────────────────────────────────────
function velo(C = "#14161a", B = "#c6f432") {
  const s = `
<path d="M0 176 H300" stroke="${C}" stroke-width="4"/><path d="M12 150 H58 M0 162 H44 M20 138 H40" stroke="${C}" stroke-width="3"/>
<g fill="none" stroke="${C}" stroke-width="7"><circle cx="82" cy="136" r="38"/><circle cx="226" cy="136" r="38"/><path d="M82 136 L128 78 L196 78 L226 136 M128 78 L150 136 L82 136 M150 136 L196 78 M196 78 L204 52 M190 50 H220 M118 70 H146"/></g>
<circle cx="82" cy="136" r="6" fill="${C}"/><circle cx="226" cy="136" r="6" fill="${C}"/><circle cx="150" cy="136" r="10" fill="${C}"/>
<rect x="124" y="94" width="52" height="20" fill="${C}" transform="rotate(-36 150 104)"/><path d="M147 98 L142 108 H150 L146 118 L158 104 H150 L154 98 Z" fill="${B}" transform="rotate(0)"/>
<path d="M236 18 L222 40 H234 L228 58 L248 34 H236 L242 18 Z" fill="${C}"/>`;
  return enveloppe(300, 210, s, "xMidYMid meet");
}

// ── 417 Pédale Urbaine : skyline, piste cyclable et cycliste ─────────────────────────────────────────────────────────────────────────────────────
function ville(w, h) {
  const grands = [[0, 70, 90], [90, 110, 70], [168, 60, 110], [270, 120, 80], [360, 80, 70], [440, 100, 100], [550, 66, 60], [620, 126, 90], [720, 84, 74], [802, 110, 96], [908, 70, 80], [996, 120, 70], [1074, 90, 100], [1180, 106, 90]];
  const f = w / 1270; let s = `<rect width="${w}" height="${h}" fill="#00a6a6"/><circle cx="${r(w * 0.8)}" cy="${r(h * 0.3)}" r="${r(h * 0.2)}" fill="#58d3d0"/>`;
  let fa = "", fb = "";
  grands.forEach(([x, hh, ww], i) => {
    const X = r(x * f), W = r(ww * f), H = r(hh * (h / 180) + 14), y = h - 24 - H;
    s += `<rect x="${X}" y="${r(y)}" width="${W}" height="${H}" fill="${i % 3 === 0 ? "#04202a" : i % 3 === 1 ? "#007f86" : "#055a66"}"/>`;
    for (let yy = y + 10; yy < h - 36; yy += 18) for (let xx = X + 8; xx < X + W - 12; xx += 18) { const d = `M${r(xx)} ${r(yy)}h6v6h-6z`; if ((Math.floor(xx / 18) + Math.floor(yy / 18) + i) % 3) fa += d; else fb += d; }
  });
  s += `<path d="${fa}" fill="#58d3d0" opacity="0.8"/><path d="${fb}" fill="#ffffff" opacity="0.85"/>`;
  s += `<rect y="${h - 24}" width="${w}" height="24" fill="#04202a"/><path d="M0 ${h - 12} H${w}" stroke="#ffffff" stroke-width="2" stroke-dasharray="22 14"/>`;
  const cx = r(w * 0.46), cy = h - 6;
  s += `<g fill="none" stroke="#ffffff" stroke-width="3"><circle cx="${cx - 22}" cy="${cy - 12}" r="12"/><circle cx="${cx + 22}" cy="${cy - 12}" r="12"/><path d="M${cx - 22} ${cy - 12} L${cx - 4} ${cy - 34} H${cx + 14} L${cx + 22} ${cy - 12} M${cx - 4} ${cy - 34} L${cx + 4} ${cy - 12} H${cx - 22}"/></g><circle cx="${cx + 2}" cy="${cy - 52}" r="6" fill="#ffffff"/><path d="M${cx - 4} ${cy - 34} L${cx + 4} ${cy - 48} L${cx + 14} ${cy - 34}" stroke="#ffffff" stroke-width="4" fill="none"/>`;
  return enveloppe(w, h, s);
}

// ── 418 Kilowatt Club : éclair géant dans des anneaux de choc ───────────────────────────────────────────────────────────────────────────────────
function eclair() {
  let s = `<rect width="420" height="420" fill="#ff5a1f"/>`;
  for (let i = 1; i <= 8; i++) s += `<circle cx="210" cy="210" r="${i * 26}" fill="none" stroke="#111111" stroke-width="${i % 2 ? 3 : 8}" opacity="${r(0.12 + i * 0.07)}"/>`;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; s += `<path d="M${r(210 + Math.cos(a) * 150)} ${r(210 + Math.sin(a) * 150)} L${r(210 + Math.cos(a) * 214)} ${r(210 + Math.sin(a) * 214)}" stroke="#111111" stroke-width="3" opacity="0.5"/>`; }
  s += `<path d="M248 28 L120 232 H198 L160 392 L306 168 H222 Z" fill="#111111"/><path d="M236 62 L146 214 H214 L190 330 L282 186 H208 Z" fill="#ff5a1f"/>`;
  return enveloppe(420, 420, s, "xMidYMid meet");
}

// ── 419 Borne et Cie : station de recharge (trois bornes, deux voitures, skyline violette) ──────────────────────────────────────────────────────
function station() {
  let s = `<rect width="640" height="220" fill="#4b2bd6"/><circle cx="548" cy="52" r="30" fill="#ffd400"/>`;
  [[20, 80, 70], [96, 50, 56], [160, 100, 80], [250, 64, 60], [320, 110, 70], [398, 76, 80], [484, 94, 60], [552, 58, 70]].forEach(([x, hh, ww], i) => { s += `<rect x="${x}" y="${190 - hh}" width="${ww}" height="${hh}" fill="${i % 2 ? "#3a1fb0" : "#3f24c4"}"/>`; for (let y = 200 - hh; y < 180; y += 16) s += `<rect x="${x + 8}" y="${y}" width="8" height="8" fill="#ffd400" opacity="0.5"/>`; });
  s += `<rect y="190" width="640" height="30" fill="#17142b"/><path d="M0 206 H640" stroke="#ffd400" stroke-width="3" stroke-dasharray="26 18"/>`;
  [90, 250, 410].forEach((x, i) => { s += `<rect x="${x}" y="96" width="34" height="94" fill="#f2f0ea"/><rect x="${x + 6}" y="106" width="22" height="22" fill="${i === 1 ? "#ffd400" : "#17142b"}"/><path d="M${x + 17} 110 l-5 8 h6 l-3 8 l9 -10 h-6 l3 -6 Z" fill="${i === 1 ? "#17142b" : "#ffd400"}"/><path d="M${x + 34} 150 C${x + 56} 150 ${x + 52} 176 ${x + 74} 176" stroke="#ffd400" stroke-width="4" fill="none"/>`; });
  s += `<path d="M130 190 V160 L150 142 H214 L232 160 V190 Z" fill="#ffffff"/><path d="M156 148 H208 L222 160 H146 Z" fill="#4b2bd6" opacity="0.5"/><circle cx="156" cy="190" r="12" fill="#17142b"/><circle cx="212" cy="190" r="12" fill="#17142b"/>`;
  s += `<path d="M450 190 V162 L472 142 H540 L560 164 V190 Z" fill="#ffd400"/><path d="M478 148 H536 L550 164 H466 Z" fill="#4b2bd6" opacity="0.5"/><circle cx="476" cy="190" r="12" fill="#17142b"/><circle cx="534" cy="190" r="12" fill="#17142b"/>`;
  return enveloppe(640, 220, s, "xMidYMid slice");
}

// ── 420 Trajet : route sinueuse reliant les quatre étapes, collines bleues ──────────────────────────────────────────────────────────────────────
function route(w, h, xs, ys) {
  let s = `<rect width="${w}" height="${h}" fill="#0a3d62"/><path d="M0 ${h} V${r(h * 0.62)} C${r(w * 0.15)} ${r(h * 0.3)} ${r(w * 0.3)} ${r(h * 0.4)} ${r(w * 0.46)} ${r(h * 0.58)} S${r(w * 0.8)} ${r(h * 0.3)} ${w} ${r(h * 0.5)} V${h} Z" fill="#0f5486"/><path d="M0 ${h} V${r(h * 0.82)} C${r(w * 0.2)} ${r(h * 0.66)} ${r(w * 0.42)} ${r(h * 0.9)} ${r(w * 0.62)} ${r(h * 0.76)} S${r(w * 0.9)} ${r(h * 0.7)} ${w} ${r(h * 0.8)} V${h} Z" fill="#146aa6"/>`;
  let d = `M${r(xs[0] - w * 0.12)} ${ys[0] + 10}`; xs.forEach((x, i) => { const px = i ? xs[i - 1] : xs[0] - w * 0.12, py = i ? ys[i - 1] : ys[0] + 10; d += ` C${r(px + (x - px) * 0.5)} ${py} ${r(px + (x - px) * 0.5)} ${ys[i]} ${x} ${ys[i]}`; });
  d += ` C${r(xs[3] + w * 0.06)} ${ys[3]} ${r(xs[3] + w * 0.08)} ${ys[3] - 8} ${w} ${ys[3] - 14}`;
  s += `<path d="${d}" fill="none" stroke="#f4f9fc" stroke-width="${r(h * 0.07)}" stroke-dasharray="${r(h * 0.16)} ${r(h * 0.1)}" opacity="0.8"/>`;
  xs.forEach((x, i) => { s += `<rect x="${r(x - 11)}" y="${r(ys[i] - 11)}" width="22" height="22" fill="${i === 0 ? "#ff8a6b" : "#f4f9fc"}"/><rect x="${r(x - 4)}" y="${r(ys[i] - 4)}" width="8" height="8" fill="#0a3d62"/>`; });
  return enveloppe(w, h, s);
}

// ── 421 Console Wattmètre : courbe de puissance, grille et jauge de charge ──────────────────────────────────────────────────────────────────────
function wattmetre(w, h, jauge) {
  let s = `<rect width="${w}" height="${h}" fill="#0d1117"/>`;
  for (let i = 1; i < 5; i++) s += `<path d="M0 ${r((h / 5) * i)} H${w}" stroke="#e6edf3" stroke-width="1" opacity="0.1"/>`;
  for (let x = 0; x < w; x += w / 16) s += `<path d="M${r(x)} 0 V${h}" stroke="#e6edf3" stroke-width="1" opacity="0.07"/>`;
  const gw = jauge ? w - 220 : w, pts = [0.7, 0.6, 0.66, 0.4, 0.5, 0.28, 0.34, 0.2, 0.3, 0.22, 0.12, 0.26, 0.18, 0.1];
  const xy = pts.map((p, i) => [r((gw / (pts.length - 1)) * i), r(h * 0.15 + p * h * 0.7)]);
  const l = xy.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
  s += `<path d="${l} L${gw} ${h} L0 ${h} Z" fill="#ffb000" opacity="0.22"/><path d="${l}" fill="none" stroke="#ffb000" stroke-width="3"/>`;
  xy.forEach((p, i) => { if (i % 3 === 0) s += `<rect x="${p[0] - 4}" y="${p[1] - 4}" width="8" height="8" fill="#0d1117" stroke="#ffb000" stroke-width="2"/>`; });
  if (jauge) { const cx = w - 110, cy = h / 2 + 8, R = Math.min(60, h / 2 - 14); s += `<path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="#e6edf3" stroke-width="12" opacity="0.15"/><path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${r(cx + R * 0.5)} ${r(cy - R * 0.87)}" fill="none" stroke="#ffb000" stroke-width="12"/><path d="M${cx} ${cy} L${r(cx + R * 0.5)} ${r(cy - R * 0.87)}" stroke="#e6edf3" stroke-width="3"/><rect x="${cx - 6}" y="${cy - 6}" width="12" height="12" fill="#ffb000"/><rect x="${cx - R - 6}" y="${cy + 12}" width="${R * 2 + 12}" height="3" fill="#e6edf3" opacity="0.25"/>`; }
  return enveloppe(w, h, s);
}

// Vagues superposées (bande ondulée en bas de pied)
function vagues(w, h, cols) {
  let s = "";
  cols.forEach((c, i) => { const y = h * (0.28 + i * 0.22), a = h * 0.16; let d = `M0 ${h} L0 ${r(y)}`; for (let x = 0; x <= w; x += w / 24) d += ` L${r(x)} ${r(y + Math.sin((x / w) * Math.PI * (3 + i) + i * 1.3) * a)}`; s += `<path d="${d} L${w} ${h} Z" fill="${c}"/>`; });
  return enveloppe(w, h, s);
}
// Réseaux en icônes (pastilles de 44 px) aux couleurs du modèle
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "square";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ borderRadius: "0px", color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? "1.5px" : undefined, borderColor: o.contour, transitionDuration: 360 }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: G.focus(o.focus || S.accent) } });
  return n;
}

module.exports = { vagues, reseauxIcones, vue, une, poteries, salon, carreaux, planche, medaillon, cernes, velo, ville, eclair, station, route, wattmetre };
