// Aides d'ILLUSTRATION pour les familles « Collectivités et services publics » (ft2-386 à 391) et « Santé numérique et pharmacie » (ft2-392 à 397).
// Chaque dessin est un SVG inline en FORMES PLEINES (le nettoyeur du widget « html » garde : svg, g, path, circle, rect, line, polyline, polygon, ellipse ; pas de filtre ni de motif) ;
// les halos sont faits de formes translucides (opacity). Aucun texte, aucun lien, aucune image externe, aucun border-radius CSS. Une illustration par modèle, jamais réutilisée.
const { compact, sty } = require("../../kit");

const R = (x, y, w, h, f, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o ? ` opacity="${o}"` : ""}/>`;
const C = (x, y, r, f, o) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${o ? ` opacity="${o}"` : ""}/>`;
const P = (pts, f, o) => `<polygon points="${pts}" fill="${f}"${o ? ` opacity="${o}"` : ""}/>`;
const T = (d, c, w, o) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o ? ` opacity="${o}"` : ""}/>`;
const PL = (pts, c, w, o) => `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter"${o ? ` opacity="${o}"` : ""}/>`;
const Ln = (x1, y1, x2, y2, c, w, o) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"${o ? ` opacity="${o}"` : ""}/>`;
const E = (x, y, rx, ry, f, o) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${o ? ` opacity="${o}"` : ""}/>`;
const G = (t, corps) => `<g transform="${t}">${corps}</g>`;

const svgEl = (vb, corps, ratio = "xMidYMid meet") => `<svg viewBox="${vb}" width="100%" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="${ratio}">${corps}</svg>`;
const base = (st) => compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0, ...st });
// un seul dessin (colonne étroite, panneau, médaillon)
const unique = (k, corps, vb, st = {}) => k.W("html", { html: svgEl(vb, corps) }, base(st));
// deux cadrages du même dessin : large (bureau, tablette) et resserré (mobile)
const double = (k, corps, vbLarge, vbMobile, st = {}) => [
  { ...k.W("html", { html: svgEl(vbLarge, corps) }, base(st)), hideOn: ["mobile"] },
  { ...k.W("html", { html: svgEl(vbMobile, corps) }, base(st)), hideOn: ["desktop", "tablet"] },
];

// ── 386 · Façade de mairie : la mairie de Valclair posée sur la barre terracotta ─────────────────────────────────────────────────────────────────
function facade() {
  const NAVY = "#10264f", TERRA = "#a8400c", PAPIER = "#f4f0e6", PIERRE = "#d9cfb6", OMBRE = "#e1d8c2";
  let s = "";
  // ville lointaine
  const toits = [[20, 90, 120], [150, 60, 150], [320, 110, 100], [1170, 100, 110], [1290, 70, 140], [1450, 95, 130]];
  toits.forEach(([x, h, w], i) => { s += R(x, 300 - h, w, h + 60, i % 2 ? "#e4dbc6" : "#ddd3ba"); s += P(`${x},${300 - h} ${x + w / 2},${300 - h - 28} ${x + w},${300 - h}`, i % 2 ? "#d4c9ad" : "#cfc4a6"); for (let j = 0; j < 3; j++) s += R(x + 16 + j * Math.max(30, (w - 40) / 3), 300 - h + 22, 14, 20, "#bfb393"); });
  // arbres
  [[470, 270], [1120, 275], [60, 280], [1540, 278]].forEach(([x, y]) => { s += R(x - 4, y, 8, 90, "#8a7a55"); s += C(x, y - 10, 34, "#b9b98a"); s += C(x + 18, y + 8, 24, "#a7a878"); });
  // ailes
  s += R(400, 190, 220, 170, PIERRE) + R(980, 190, 220, 170, PIERRE);
  [430, 480, 530, 1010, 1060, 1110].forEach((x) => { s += R(x, 215, 26, 46, NAVY) + R(x, 285, 26, 46, NAVY); });
  s += R(390, 178, 240, 14, NAVY) + R(970, 178, 240, 14, NAVY);
  // corps central
  s += R(560, 150, 480, 210, NAVY);
  for (let i = 0; i < 9; i++) s += R(580 + i * 50, 176, 20, 150, PAPIER);
  [630, 730, 830, 930].forEach((x) => { s += R(x - 14, 200, 28, 44, TERRA, 0.95); });
  // fronton
  s += P("540,150 800,56 1060,150", NAVY) + P("590,142 800,76 1010,142", PAPIER) + P("640,136 800,92 960,136", TERRA);
  s += R(520, 148, 560, 12, NAVY);
  // horloge et drapeau
  s += C(800, 118, 22, PAPIER) + Ln(800, 118, 800, 102, NAVY, 3) + Ln(800, 118, 812, 124, NAVY, 3);
  s += Ln(800, 56, 800, 4, NAVY, 4) + R(800, 6, 20, 30, NAVY) + R(820, 6, 20, 30, PAPIER) + R(840, 6, 20, 30, TERRA);
  // porte et perron
  s += R(770, 262, 60, 98, TERRA) + R(784, 276, 32, 84, "#7e2f08");
  s += R(520, 330, 560, 30, PIERRE) + R(480, 348, 640, 12, OMBRE) + R(440, 356, 720, 4, "#cfc4a6");
  return s;
}

// ── 387 · Trois rivières : relief vert sapin, trois cours d'eau qui se rejoignent, carré jaune pour soleil ──────────────────────────────────────
function rivieres() {
  let s = R(0, 0, 340, 270, "#0f4636");
  s += R(236, 28, 54, 54, "#ffc21a");
  s += P("0,170 70,110 130,150 200,90 280,150 340,120 340,270 0,270", "#13503f");
  s += P("0,200 60,160 140,205 220,150 340,200 340,270 0,270", "#1a6a52");
  s += P("0,235 90,205 190,240 270,215 340,238 340,270 0,270", "#0a6b4d");
  s += T("M40 96 C 40 150, 110 160, 150 205 S 168 245, 170 270", "#cfeee2", 9);
  s += T("M175 82 C 170 140, 205 170, 190 210 S 176 250, 170 270", "#9fdcc8", 7);
  s += T("M300 100 C 290 160, 230 170, 205 215 S 176 250, 170 270", "#7bc9b0", 6);
  [[60, 226], [250, 232], [112, 186], [292, 188]].forEach(([x, y], i) => { s += R(x, y, 16, 14, i % 2 ? "#ffc21a" : "#f3f6f1") + P(`${x - 2},${y} ${x + 8},${y - 8} ${x + 18},${y}`, "#0c3b2e"); });
  [[28, 190], [322, 160], [148, 150]].forEach(([x, y]) => { s += P(`${x - 10},${y + 18} ${x},${y - 6} ${x + 10},${y + 18}`, "#0a6b4d"); });
  return s;
}

// ── 388 · Fontelune : une fontaine à jets, encre bleu nuit sur ambre ──────────────────────────────────────────────────────────────────────────
function fontaine(nuit) {
  const N = nuit ? "#ffb81c" : "#0a1b33", A = "#ffb81c", CL = nuit ? "#12294a" : "#ffd36b", BL = nuit ? "#ffd36b" : "#fff0c4";
  let s = nuit ? C(210, 200, 200, "#ffb81c", 0.06) + C(210, 200, 150, "#ffb81c", 0.08) + C(210, 200, 100, "#ffb81c", 0.12) : R(0, 0, 420, 420, A);
  s += R(26, 188, 70, 160, CL) + R(324, 168, 70, 180, CL) + P("20,188 61,150 102,188", N) + P("318,168 359,128 400,168", N);
  [[40, 208], [62, 208], [338, 188], [360, 188], [40, 262], [338, 262]].forEach(([x, y]) => { s += R(x, y, 14, 22, N); });
  s += R(110, 330, 200, 14, N) + R(90, 344, 240, 30, N) + R(60, 374, 300, 14, N) + R(20, 396, 380, 24, CL);
  s += R(198, 150, 24, 180, N) + R(160, 232, 100, 12, N) + R(132, 244, 156, 14, N);
  s += R(180, 120, 60, 12, N) + P("160,258 260,258 244,300 176,300", N);
  s += T("M210 120 C 210 60, 130 50, 112 118", N, 6) + T("M210 120 C 210 60, 290 50, 308 118", N, 6);
  s += T("M210 120 C 210 80, 180 40, 160 74", N, 5) + T("M210 120 C 210 80, 240 40, 260 74", N, 5) + T("M210 52 L 210 118", N, 6);
  s += T("M132 244 C 110 262, 98 290, 100 326", N, 5) + T("M288 244 C 310 262, 322 290, 320 326", N, 5);
  [[112, 130], [96, 104], [128, 96], [308, 130], [326, 104], [292, 96], [210, 36], [236, 62], [184, 62]].forEach(([x, y]) => { s += C(x, y, 7, N); });
  [[40, 60], [380, 50], [356, 98], [58, 106]].forEach(([x, y]) => { s += P(`${x},${y - 14} ${x + 4},${y - 4} ${x + 14},${y} ${x + 4},${y + 4} ${x},${y + 14} ${x - 4},${y + 4} ${x - 14},${y} ${x - 4},${y - 4}`, BL); });
  return s;
}

// ── 389 · Pré-Haut : quatre vignettes dessinées (mairie, école, cadre de vie, kiosque) ────────────────────────────────────────────────────────
function vignettes(modeMobile) {
  const E1 = "#2a1c14", BR = "#b23a1e", SA = "#f1ebde", FOND = ["#e6dcc8", "#dcc9a8", "#d9d2b6", "#ecd3bd"];
  const panels = [
    (o) => R(o, 150, 280, 50, "#cdbd9c") + R(o + 60, 80, 160, 70, E1) + P(`${o + 50},82 ${o + 140},30 ${o + 230},82`, BR) + [0, 1, 2, 3].map((i) => R(o + 74 + i * 38, 96, 14, 48, SA)).join("") + R(o + 128, 118, 24, 32, BR) + Ln(o + 140, 30, o + 140, 6, E1, 3) + R(o + 140, 6, 22, 12, BR),
    (o) => R(o, 158, 280, 42, "#cdbd9c") + R(o + 40, 70, 200, 88, BR) + R(o + 118, 40, 44, 30, BR) + P(`${o + 112},40 ${o + 140},16 ${o + 168},40`, E1) + [0, 1, 2, 3, 4].map((i) => R(o + 56 + i * 36, 88, 18, 28, SA)).join("") + R(o + 126, 126, 28, 32, E1) + C(o + 140, 54, 8, SA),
    (o) => R(o, 160, 280, 40, "#c3c79c") + R(o + 60, 100, 10, 62, E1) + C(o + 65, 80, 44, "#7b8c4f") + C(o + 90, 96, 30, "#6a7a41") + R(o + 150, 132, 90, 10, E1) + R(o + 154, 142, 8, 20, E1) + R(o + 228, 142, 8, 20, E1) + R(o + 150, 116, 90, 8, BR) + Ln(o + 30, 160, o + 30, 56, E1, 4) + R(o + 22, 48, 20, 12, BR),
    (o) => R(o, 160, 280, 40, "#d6b79a") + R(o + 60, 148, 160, 12, E1) + [0, 1, 2, 3, 4].map((i) => R(o + 70 + i * 36, 96, 8, 52, E1)).join("") + P(`${o + 44},96 ${o + 140},40 ${o + 236},96`, BR) + R(o + 130, 20, 20, 20, E1) + C(o + 140, 20, 10, SA) + R(o + 52, 92, 176, 6, E1),
  ];
  let s = "";
  panels.forEach((p, i) => {
    const ox = modeMobile ? (i % 2) * 300 : i * 300, oy = modeMobile ? Math.floor(i / 2) * 220 : 0;
    s += G(`translate(0 ${oy})`, R(ox, 0, 280, 200, FOND[i]) + p(ox));
  });
  return s;
}

// ── 390 · Montrivage : plan de la ville, rivage, parc, voie ferrée, épingle violette ──────────────────────────────────────────────────────────
function planVille() {
  const VI = "#5b2a86", EAU = "#a9c4e6", TERRE = "#e4e8f0", RUE = "#ffffff", BLOC = "#cfd5e2";
  let s = R(0, 0, 1200, 240, TERRE);
  s += P("760,0 1200,0 1200,240 900,240 860,200 880,150 820,110 780,60", EAU) + P("800,0 1200,0 1200,40 830,40", "#b9d0ec");
  // pâtés de maisons
  const blocs = [[40, 30, 110, 60], [170, 30, 90, 60], [280, 30, 130, 60], [430, 30, 100, 60], [40, 120, 70, 90], [130, 120, 110, 90], [260, 120, 100, 90], [380, 120, 90, 90], [490, 120, 110, 90], [560, 30, 100, 60], [690, 30, 60, 60], [620, 120, 80, 90]];
  blocs.forEach(([x, y, w, h], i) => { s += R(x, y, w, h, i % 4 === 0 ? "#d9cde8" : BLOC); });
  s += R(430, 120, 0, 0, BLOC) + R(300, 130, 70, 70, "#c5e0c0") + C(335, 165, 18, "#a9d1a2");
  // rues
  [100, 240].forEach((y) => { s += Ln(0, y - 0 === 240 ? 238 : 100, 760, y === 240 ? 238 : 100, RUE, 14); });
  [155, 270, 420, 545, 675, 765].forEach((x) => { s += Ln(x, 0, x, 240, RUE, 12); });
  s += Ln(0, 112, 760, 112, RUE, 6, 0.0) + Ln(0, 214, 760, 214, RUE, 4, 0.0);
  s += T("M0 230 L 300 118 L 560 100 L 780 60", RUE, 10);
  // voie ferrée
  s += Ln(0, 96, 740, 96, "#8d94a8", 3);
  for (let x = 6; x < 740; x += 26) s += Ln(x, 86, x, 106, "#8d94a8", 3);
  // pont sur le rivage
  s += R(770, 96, 140, 12, "#8d94a8") + R(770, 100, 140, 4, RUE);
  // bateaux
  [[930, 170], [1010, 120], [1110, 190]].forEach(([x, y]) => { s += P(`${x},${y} ${x + 44},${y} ${x + 34},${y + 12} ${x + 10},${y + 12}`, "#ffffff") + R(x + 20, y - 18, 4, 18, "#ffffff") + P(`${x + 24},${y - 18} ${x + 40},${y - 4} ${x + 24},${y - 4}`, VI); });
  // vagues
  [[900, 80], [1020, 64], [1120, 140], [960, 212]].forEach(([x, y]) => { s += T(`M${x} ${y} q 12 -10 24 0 t 24 0 t 24 0`, "#ffffff", 3, 0.8); });
  // épingle
  s += E(520, 214, 26, 7, "#8d94a8", 0.5) + C(520, 150, 30, VI) + P("496,166 544,166 520, 210", VI) + C(520, 150, 11, "#ffffff");
  return s;
}

// ── 391 · Saint-Aubin : médaillon d'or (couronne de lauriers, tour, étoile, ruban) ────────────────────────────────────────────────────────────
function medaillon() {
  const OR = "#c9a13b", OR2 = "#7a5a12", M = "#1a2a4a", CR = "#fffdf7", CR2 = "#f3eedc";
  let s = C(140, 130, 118, OR) + C(140, 130, 108, CR) + C(140, 130, 100, M) + C(140, 130, 92, CR2);
  for (let i = 0; i < 11; i++) {
    const a = (Math.PI * (0.62 + i * 0.076)), b = Math.PI - a;
    const rx = 78, ax = 140 - Math.cos(b) * rx * -1, ay = 130 + Math.sin(a) * rx;
    s += G(`translate(${(140 - Math.cos(a) * rx * -1).toFixed(1)} ${ay.toFixed(1)}) rotate(${(i * 14 - 70).toFixed(0)})`, E(0, 0, 6, 13, OR2));
    s += G(`translate(${(140 + Math.cos(a) * rx * -1).toFixed(1)} ${ay.toFixed(1)}) rotate(${(70 - i * 14).toFixed(0)})`, E(0, 0, 6, 13, OR2));
  }
  s += R(112, 86, 56, 74, M) + R(106, 80, 68, 10, M) + [0, 1, 2, 3].map((i) => R(110 + i * 15, 76, 8, 8, M)).join("");
  s += R(130, 128, 20, 32, OR) + R(124, 100, 8, 14, OR) + R(148, 100, 8, 14, OR) + R(137, 100, 6, 14, OR);
  s += P("140,44 146,60 163,60 149,70 154,86 140,76 126,86 131,70 117,60 134,60", OR);
  s += R(92, 168, 96, 8, OR2) + P("70,196 126,186 126,214 70,214 82,205", OR) + P("210,196 154,186 154,214 210,214 198,205", OR) + R(110, 184, 60, 30, M) + R(116, 190, 48, 4, OR) + R(116, 200, 48, 4, OR);
  return s;
}

// ── 392 · Deux consultations : halo d'anneaux menthe et tracé de battement (bandeau dans le panneau sarcelle) ────────────────────────────────────
function halo() {
  let s = R(0, 0, 640, 240, "#05414a");
  [[480, 120, 230, 0.07], [480, 120, 184, 0.09], [480, 120, 138, 0.12], [480, 120, 92, 0.17], [480, 120, 46, 0.28]].forEach(([x, y, r, o]) => { s += C(x, y, r, "#8ff0dc", o); });
  s += R(44, 76, 28, 88, "#8ff0dc") + R(14, 106, 88, 28, "#8ff0dc");
  s += PL("0,184 150,184 176,184 196,142 218,210 244,60 272,196 296,164 322,184 640,184", "#8ff0dc", 5);
  s += PL("0,206 300,206 330,200 360,206 640,206", "#8ff0dc", 2, 0.4);
  [[560, 40], [596, 70], [524, 28]].forEach(([x, y]) => { s += R(x, y, 10, 10, "#8ff0dc", 0.6); });
  return s;
}

// ── 393 · Enseigne verte : devanture de pharmacie, enseigne à croix, auvent rayé festonné, vitrine à flacons ────────────────────────────────────
function devanture() {
  const V = "#087a45", W = "#ffffff", SO = "#04301c", CI = "#f3ff8a", MENTHE = "#a8e6c4";
  let s = R(0, 0, 1600, 260, SO);
  // enseigne à croix
  s += R(740, 4, 120, 70, W) + R(790, 12, 20, 54, V) + R(773, 29, 54, 20, V) + R(796, 74, 8, 18, W);
  // flèches décoratives de part et d'autre (pilules)
  [[120, 30], [300, 44], [1180, 44], [1360, 30]].forEach(([x, y], i) => { s += R(x, y, 90, 26, i % 2 ? CI : MENTHE) + R(x + 45, y, 45, 26, i % 2 ? "#e0ee6a" : "#7fcfa6"); });
  // auvent rayé
  for (let i = 0; i < 20; i++) s += R(i * 80, 92, 80, 62, i % 2 ? W : V);
  for (let i = 0; i < 20; i++) s += C(i * 80 + 40, 154, 40, i % 2 ? W : V);
  s += R(0, 86, 1600, 8, "#066338");
  // vitrine
  s += R(0, 196, 1600, 64, "#0b5a36") + R(80, 204, 560, 56, "#0f6e42") + R(960, 204, 560, 56, "#0f6e42");
  [[110, "#f3ff8a", 40], [150, W, 30], [186, "#a8e6c4", 44], [236, "#f3ff8a", 34], [276, W, 46], [330, "#a8e6c4", 30], [380, "#f3ff8a", 40], [430, W, 34], [480, "#a8e6c4", 42], [530, "#f3ff8a", 30], [570, W, 38]].forEach(([x, c, h]) => { s += R(x, 260 - h, 20, h, c) + R(x + 5, 260 - h - 8, 10, 8, c); });
  [[990, W, 36], [1030, "#a8e6c4", 46], [1080, "#f3ff8a", 32], [1130, W, 44], [1180, "#a8e6c4", 30], [1230, "#f3ff8a", 40], [1280, W, 34], [1330, "#a8e6c4", 46], [1380, "#f3ff8a", 32], [1430, W, 40]].forEach(([x, c, h]) => { s += R(x, 260 - h, 20, h, c) + R(x + 5, 260 - h - 8, 10, 8, c); });
  s += R(700, 200, 200, 60, SO) + R(740, 210, 120, 50, V);
  return s;
}

// ── 394 · Console patient : moniteur de battements (quadrillage, tracé menthe, repères) ───────────────────────────────────────────────────────
function moniteur() {
  let s = R(0, 0, 640, 150, "#0b1118");
  for (let x = 0; x <= 640; x += 20) s += Ln(x, 0, x, 150, x % 100 === 0 ? "#2b3b4e" : "#1a2635", 1);
  for (let y = 0; y <= 150; y += 20) s += Ln(0, y, 640, y, y % 100 === 0 ? "#2b3b4e" : "#1a2635", 1);
  s += PL("0,92 90,92 108,92 122,64 138,112 152,22 170,126 188,92 300,92 318,92 332,70 346,108 360,30 378,122 394,92 640,92", "#5eead4", 3);
  s += PL("0,92 90,92 108,92 122,64 138,112 152,22 170,126 188,92 300,92 318,92 332,70 346,108 360,30 378,122 394,92 640,92", "#5eead4", 8, 0.18);
  [[152, 22], [360, 30]].forEach(([x, y]) => { s += R(x - 4, y - 4, 8, 8, "#e6edf3"); });
  s += R(520, 20, 90, 10, "#2b3b4e") + R(520, 40, 60, 10, "#2b3b4e") + R(520, 118, 90, 10, "#1a2635") + R(14, 126, 40, 10, "#5eead4", 0.7);
  return s;
}

// ── 395 · Cap Santé : paysage de collines bleues et chemin sinueux jalonné de quatre étapes ──────────────────────────────────────────────────────
function chemin() {
  const M = "#0b2a4a", AZ = "#1458c8";
  let s = R(0, 0, 1200, 220, "#e8f1fb");
  s += R(1040, 26, 60, 60, "#ffd24a");
  s += R(120, 30, 90, 12, "#ffffff") + R(146, 18, 60, 12, "#ffffff") + R(620, 50, 110, 12, "#ffffff") + R(646, 38, 66, 12, "#ffffff");
  s += P("0,150 160,80 300,140 470,60 640,130 820,70 1000,140 1200,90 1200,220 0,220", "#d3e4f8");
  s += P("0,180 200,130 380,172 560,120 760,170 960,126 1200,176 1200,220 0,220", "#b7d2f1");
  s += P("0,206 240,176 480,204 720,178 960,204 1200,184 1200,220 0,220", "#9bbfe9");
  [[260, 128], [520, 112], [860, 118], [1110, 130]].forEach(([x, y]) => { s += P(`${x - 12},${y + 30} ${x},${y} ${x + 12},${y + 30}`, "#6f9bd6") + P(`${x - 10},${y + 44} ${x},${y + 18} ${x + 10},${y + 44}`, "#6f9bd6"); });
  s += T("M8 196 C 120 150, 200 206, 306 168 S 470 120, 612 176 S 790 206, 910 162 S 1090 150, 1190 188", M, 6);
  [[0, 188], [300, 160], [600, 168], [900, 156]].forEach(([x, y], i) => { s += R(x, y, 20, 20, i === 0 ? AZ : M); });
  return s;
}

// ── 396 · Clairvie : une plante en pot sous un grand soleil miel (grande case pêche) ──────────────────────────────────────────────────────────
function plante() {
  const AR = "#1f2a37", RO = "#b8300f", MI = "#ffe7a8", PE = "#ffd9c7", SA = "#ff9b73";
  let s = R(0, 0, 480, 250, PE);
  s += C(350, 108, 94, MI) + C(350, 108, 64, "#ffd37a", 0.7);
  s += R(0, 224, 480, 26, "#f2b9a1") + R(0, 238, 480, 12, "#e7a387");
  s += P("196,170 284,170 270,238 210,238", AR) + R(188, 160, 104, 14, AR) + R(206, 188, 68, 6, "#3b4a5c");
  s += T("M240 160 C 240 120, 238 80, 240 32", AR, 6);
  s += P("240,100 156,70 176,122", RO) + P("240,82 322,56 306,108", AR) + P("240,128 150,126 184,164", SA) + P("240,120 330,114 296,160", RO) + P("240,60 196,20 242,32", SA) + P("240,48 286,10 270,56", RO);
  s += C(240, 28, 12, "#ffffff") + C(240, 28, 5, RO);
  [[70, 70], [48, 130], [420, 200], [100, 190]].forEach(([x, y]) => { s += R(x, y, 12, 12, AR, 0.8); });
  return s;
}

// ── 397 · Medilis : panneau d'anneaux violets, croix lavande et petites marches (à droite de l'escalier) ──────────────────────────────────────────
function panneau() {
  let s = R(0, 0, 340, 520, "#201650");
  [[170, 200, 160, "#6b4fe0", 0.16], [170, 200, 124, "#6b4fe0", 0.22], [170, 200, 88, "#b7a4ff", 0.26], [170, 200, 52, "#ede9ff", 0.3]].forEach(([x, y, r, c, o]) => { s += C(x, y, r, c, o); });
  s += R(150, 150, 40, 100, "#ede9ff") + R(120, 180, 100, 40, "#ede9ff");
  s += R(36, 40, 14, 14, "#b7a4ff") + R(280, 70, 18, 18, "#c9bdff", 0.7) + R(300, 330, 14, 14, "#6b4fe0");
  s += PL("0,330 60,330 76,330 90,300 106,356 122,262 140,370 158,330 340,330", "#c9bdff", 4);
  [[0, 440, 340, "#2b1d6e"], [0, 460, 280, "#3a2792"], [0, 480, 220, "#6b4fe0"], [0, 500, 160, "#b7a4ff"]].forEach(([x, y, w, c]) => { s += R(x, y, w, 20, c); });
  return s;
}

// ── Lettres tracées (marque monumentale dessinée, sans texte) : alphabet anguleux en traits épais ──────────────────────────────────────────────
const LET = { A: ["0,6 2,0 4,6", "0.9,3.8 3.1,3.8"], B: ["0,0 0,6 3,6 4,5 4,4 3,3 0,3", "0,0 3,0 4,1 4,2 3,3"], C: ["4,1 3,0 1,0 0,1 0,5 1,6 3,6 4,5"], E: ["4,0 0,0 0,6 4,6", "0,3 3,3"], F: ["4,0 0,0 0,6", "0,3 3,3"], H: ["0,0 0,6", "4,0 4,6", "0,3 4,3"], I: ["2,0 2,6"], L: ["0,0 0,6 4,6"], N: ["0,6 0,0 4,6 4,0"], O: ["1,0 3,0 4,1 4,5 3,6 1,6 0,5 0,1 1,0"], P: ["0,6 0,0 3,0 4,1 4,2 3,3 0,3"], R: ["0,6 0,0 3,0 4,1 4,2 3,3 0,3", "2,3 4,6"], T: ["0,0 4,0", "2,0 2,6"], U: ["0,0 0,5 1,6 3,6 4,5 4,0"], V: ["0,0 2,6 4,0"], "-": ["1,3 3,3"], "'": ["1.5,-1.4 2.7,-2.4"] };
// mot("FONTELUNE", { couleur, trait }) : { corps, vb } ; "'" après une lettre = accent aigu ; viewBox serré, traits à angles vifs
function mot(texte, o = {}) {
  const w = o.trait || 1.3, adv = 6.2; let x = 0, s = "";
  for (const ch of texte) {
    if (ch === "'") { s += G(`translate(${x - adv} 0)`, (LET["'"]).map((p) => PL(p, o.couleur, w)).join("")); continue; }
    s += G(`translate(${x} 0)`, (LET[ch] || []).map((p) => PL(p, o.couleur, w)).join(""));
    x += ch === "I" ? 3.6 : adv;
  }
  const accent = texte.includes("'");
  return { corps: s, vb: `${-w} ${accent ? -3.4 : -w} ${(x - 2.2 + 2 * w).toFixed(1)} ${(accent ? 9.4 : 6) + 2 * w}` };
}
const motSvg = (k, texte, o = {}) => { const m = mot(texte, o); return unique(k, m.corps, m.vb, o.st || {}); };

// ── Bruno : marches fantômes (calque, deux côtés), lueur d'angle avec étincelles, halo central ──────────────────────────────────────────────────
function marchesFantomes(c, o = 0.12) {
  let s = ""; [[0, 60, 220], [0, 140, 250], [0, 220, 280], [0, 300, 300], [1300, 60, 300], [1330, 140, 270], [1360, 220, 240], [1390, 300, 210]].forEach(([x, y, w]) => { s += R(x, y, w, 70, c, o); });
  return s;
}
const etincelle = (x, y, r, c) => P(`${x},${y - r} ${x + r * 0.22},${y - r * 0.22} ${x + r},${y} ${x + r * 0.22},${y + r * 0.22} ${x},${y + r} ${x - r * 0.22},${y + r * 0.22} ${x - r},${y} ${x - r * 0.22},${y - r * 0.22}`, c);
function lueurCoin(c, etoile, dx = 0, dy = 0) {
  let s = ""; [[560, 360, 330, 0.05], [560, 360, 260, 0.07], [560, 360, 190, 0.1], [560, 360, 120, 0.15], [560, 360, 56, 0.22]].forEach(([x, y, r, o]) => { s += C(x + dx, y + dy, r, c, o); });
  return s + etincelle(470 + dx, 90 + dy, 16, etoile) + etincelle(520 + dx, 200 + dy, 10, etoile) + etincelle(380 + dx, 60 + dy, 8, etoile);
}
function haloCentre() {
  let s = ""; [[800, 150, 520, 0.04], [800, 150, 420, 0.05], [800, 150, 320, 0.07], [800, 150, 220, 0.09], [800, 150, 130, 0.12]].forEach(([x, y, r, o]) => { s += C(x, y, r, "#8ff0dc", o); });
  s += PL("0,262 520,262 560,262 590,226 620,290 660,196 700,300 730,262 1100,262 1140,262 1172,238 1200,284 1240,210 1280,296 1312,262 1600,262", "#8ff0dc", 3, 0.35);
  return s;
}
const plein = (vb, corps, ratio) => `<span aria-hidden="true"><svg viewBox="${vb}" width="100%" height="100%" preserveAspectRatio="${ratio}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
const calque = (html, o = {}) => ({ type: "html", props: { html }, ...(o.masque ? { hideOn: o.masque } : {}), ...sty(compact({ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: 0, overflow: "hidden", lineHeight: 0.8, fontSize: "0px", ...(o.st || {}) })) });
function surFond(b, calques) {
  b.styles.desktop = { ...b.styles.desktop, position: "relative", overflow: "hidden" };
  const inner = b.children[0];
  inner.styles.desktop = { ...inner.styles.desktop, position: "relative", zIndex: 1 };
  b.children.unshift(...calques);
  return b;
}

module.exports = { mot, motSvg, marchesFantomes, etincelle, lueurCoin, haloCentre, plein, calque, surFond, R, C, P, T, PL, Ln, G_: G, unique, double, facade, rivieres, fontaine, vignettes, planVille, medaillon, halo, devanture, moniteur, chemin, plante, panneau };

// ── Boîte à outils de composition (angles droits, 360 ms) partagée par les deux familles ───────────────────────────────────────────────────────
const { G: GK, Moteur } = require("./kit-v2");
const DOUX = 360;
function outils(k, env, Gk) {
  const S = k.S;
  const lien = (label, url, o = {}) => {
    const n = k.LINK(label, url, compact({ fontSize: typeof o.taille === "string" ? o.taille : `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: o.aligne || "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, paddingTop: o.padV, paddingBottom: o.padV, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
    return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
  };
  const caps = (t, o = {}) => k.T(`<p>${t}</p>`, compact({ fontSize: o.taille || "13px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.12em", color: o.couleur || S.fg, fontFamily: o.police || S.font, ...(o.extra || {}) }));
  const texte = (t, o = {}) => k.T(`<p>${t}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || S.mute, fontFamily: o.police || S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, ...(o.extra || {}) }));
  const trait = (c, e = "1px") => k.divider({ width: "100%", borderColor: c, borderTopWidth: e, marginTop: "0px", marginBottom: "0px" });
  const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
  const carre = (c, t = "12px") => k.col([], { width: t, height: t, backgroundColor: c, flexShrink: 0, borderRadius: "0px" });
  const partie = (n, nom, styles, etats) => { const p = (n.parts || {})[nom] || {}; n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } }; return n; };
  const horaires = (o = {}) => Moteur.finishNode(S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || S.font, lineHeight: 1.55, width: "100%" }));
  const coordonnees = (o = {}) => partie(Moteur.finishNode(S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || S.font, lineHeight: 1.55, width: "100%" })), "link", { color: o.lien || o.couleur || S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || S.accent }, focus: GK.focus(o.focus || S.accent) });
  const mentions = (o = {}) => Gk.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);
  const bouton = (t, u, o) => lien(t, u, { taille: o.taille || 16, poids: "800", casse: o.casse === undefined ? "uppercase" : o.casse, suivi: "0.06em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
  // colonne de liens à intitulé en capitales (parti pris des trois captures)
  const colLiens = (titre, liste, o = {}) => Gk.colonne(k, [caps(titre, { couleur: o.titre || S.fg, police: o.policeTitre }), ...liste.map(([t, u]) => lien(t, u, { taille: o.taille || 15, poids: "500", couleur: o.couleur || S.mute, police: o.police, survol: { color: o.survol || S.accent, textDecoration: "underline", transform: { x: 3 } }, focus: o.survol || S.accent }))], { poids: o.poids ?? 1, min: o.min || "150px", gap: "2px", base: o.base });
  // pastilles de réseaux (carrés à angles droits)
  const pastilles = (liste, o = {}) => k.row(liste.map(([t, u]) => lien(t, u, { taille: 14, poids: "800", couleur: o.couleur, h: "44px", extra: { width: "44px", justifyContent: "center", backgroundColor: o.fond, borderStyle: "solid", borderWidth: "1px", borderColor: o.bord || o.fond }, survol: { backgroundColor: o.survolFond, color: o.survolCouleur, transform: { y: -2 }, textDecoration: "none" }, focus: o.survolFond })), { gap: "10px", alignItems: "center", flexWrap: "wrap" });
  // logo en bloc : carré de couleur à sigle + nom (marque fictive)
  const logo = (sigle, nom, o = {}) => k.row([k.col([k.T(`<p>${sigle}</p>`, { fontFamily: o.police || S.head, fontSize: o.tailleSigle || "30px", fontWeight: "800", color: o.encre, lineHeight: 1, fontStyle: o.italique ? "italic" : undefined })], { backgroundColor: o.fond, width: o.cote || "72px", height: o.cote || "72px", alignItems: "center", justifyContent: "center", borderRadius: "0px", flexShrink: 0 }), k.T(`<p>${nom}</p>`, { fontFamily: o.police || S.head, fontSize: o.tailleNom || "30px", fontWeight: "800", color: o.couleur || S.fg, lineHeight: 1.05, fontStyle: o.italique ? "italic" : undefined })], { gap: "14px", alignItems: "center", flexWrap: "nowrap" });
  const haut = (couleur, fond) => lien("↑ Haut de page", "#haut", { taille: 14, poids: "700", couleur, h: "44px", padH: "16px", extra: { borderStyle: "solid", borderWidth: "1px", borderColor: couleur }, survol: { backgroundColor: couleur, color: fond, textDecoration: "none", transform: { y: -2 } }, focus: couleur });
  return { lien, caps, texte, trait, souffle, carre, horaires, coordonnees, mentions, bouton, colLiens, pastilles, logo, haut };
}
module.exports.outils = outils;
module.exports.PH = ["48px", "32px", "20px"];
