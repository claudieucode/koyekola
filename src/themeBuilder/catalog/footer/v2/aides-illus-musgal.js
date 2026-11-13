// Illustrations SVG des familles « Musique et spectacle » (ft2-350 à 355) et « Galeries et musées » (ft2-356 à 361).
// Dessins originaux (formes seulement, aucun script, aucune image externe), générés avec une graine fixe : identiques à chaque démarrage.
// Chaque scène existe en deux cadrages (large / étroit pour le mobile) ; les identifiants de dégradés sont préfixés pour rester uniques.
const { compact } = require("../../kit");

const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const f = (n) => Math.round(n * 10) / 10;
const C = (x, y, r, fill, ex = "") => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${ex}/>`;
const R = (x, y, w, h, fill, ex = "") => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${ex}/>`;
const P = (d, fill, ex = "") => `<path d="${d}" fill="${fill}" ${ex}/>`;
const L = (x1, y1, x2, y2, s, w = 2, ex = "") => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${s}" stroke-width="${w}" ${ex}/>`;
const E = (x, y, rx, ry, fill, ex = "") => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${ex}/>`;
const star = (x, y, r, fill, op = 1) => `<path d="M${f(x)} ${f(y - r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + r)}Q${f(x)} ${f(y)} ${f(x - r)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y - r)}Z" fill="${fill}" opacity="${op}"/>`;
const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</linearGradient>`;
const rg = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</radialGradient>`;
const blur = (id, s) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
const points = (rnd, cx, cy, r, n, col, rmin = 1, rmax = 2.4, op = 0.7) => { let o = ""; for (let i = 0; i < n; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * r; o += C(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rmin + rnd() * (rmax - rmin), col, `opacity="${f(op * (0.4 + rnd() * 0.6))}"`); } return o; };
const arbre = (x, y, h, col, bg) => R(x - 2, y - h * 0.25, 4, h * 0.25, col) + P(`M${f(x)} ${f(y - h)}L${f(x + h * 0.2)} ${f(y - h * 0.62)}L${f(x - h * 0.2)} ${f(y - h * 0.62)}Z`, col) + P(`M${f(x)} ${f(y - h * 0.8)}L${f(x + h * 0.27)} ${f(y - h * 0.38)}L${f(x - h * 0.27)} ${f(y - h * 0.38)}Z`, col) + P(`M${f(x)} ${f(y - h * 0.55)}L${f(x + h * 0.33)} ${f(y - h * 0.2)}L${f(x - h * 0.33)} ${f(y - h * 0.2)}Z`, col);
const roue = (x, y, r, col, bg) => C(x, y, r, col) + C(x, y, r * 0.45, bg);
const vague = (y, amp, lg_, ph, fill, bas, larg = 1600) => { let d = `M0 ${f(y)}`; for (let x = -ph; x < larg; x += lg_) d += `Q${f(x + lg_ / 4)} ${f(y - amp)} ${f(x + lg_ / 2)} ${f(y)}T${f(x + lg_)} ${f(y)}`; return P(`${d}V${bas}H0Z`, fill); };
const svg = (vb, defs, body) => `<svg viewBox="${vb}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;
let compteur = 0;
const deux = (vbL, vbN, fn) => { const t = "m" + (++compteur); return { large: (() => { const s = fn(t + "a"); return svg(vbL, s.defs, s.body); })(), etroit: (() => { const s = fn(t + "b"); return svg(vbN, s.defs, s.body); })() }; };

// Le HTML sécurisé de la plateforme refuse les dégradés, filtres et masques et limite le texte à 20 000 caractères : les lueurs sont faites de cercles translucides empilés, les dégradés de bandes.
const halo = (cx, cy, r, col, n = 10, op = 0.06) => Array.from({ length: n }, (_, i) => C(cx, cy, r * (1 - i / n), col, `opacity="${op}"`)).join("");
const fondu = (y0, y1, col, larg = 1600, n = 9, op = 0.2) => Array.from({ length: n }, (_, i) => R(0, y0 + ((y1 - y0) * i) / n, larg, (y1 - y0) * (1 - i / n) + 400, col, `opacity="${op}"`)).join("");
const lueur = (d, col, w, coeur) => [[w * 3.2, 0.1], [w * 2, 0.18], [w, 0.5]].map(([e, o]) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(e)}" stroke-linecap="round" opacity="${o}"/>`).join("") + `<path d="${d}" fill="none" stroke="${coeur}" stroke-width="2.4" stroke-linecap="round"/>`;
const bandes = (x, y, w, h, cols) => cols.map((c, i) => R(x, y + (h * i) / cols.length, w, h / cols.length + 0.6, c)).join("");
const bille = (x, y, r, a, b, c) => C(x, y, r, a) + C(x - r * 0.15, y - r * 0.15, r * 0.78, b) + C(x - r * 0.3, y - r * 0.3, r * 0.4, c);

// ── ft2-350 : disque-monde (vinyle lumineux, arcs, objets flottants) sur noir velours ──
const s350 = deux("0 0 1600 560", "430 0 740 560", () => {
  const r = alea(350), OR = "#d9a441", IV = "#f4ead6", NO = "#100d0a";
  let g = ""; for (let i = 0; i < 12; i++) g += C(800, 330, 70 + i * 16, "none", `stroke="${IV}" stroke-width="1.4" opacity="0.16"`);
  const arcs = ["M560 190C540 60 700 40 760 200", "M820 170C830 20 900 10 905 170", "M870 190C1020 60 1190 90 1160 230", "M620 300C650 190 740 170 800 260"];
  return {
    defs: "",
    body: halo(800, 300, 470, OR, 12, 0.045) + C(800, 330, 272, "#2a1512") + C(770, 310, 250, "#4a2118", 'opacity="0.8"') + C(745, 285, 200, "#6d2f27", 'opacity="0.6"') + g + points(r, 800, 330, 258, 130, IV, 1.2, 2.8, 0.75) + C(800, 330, 62, OR) + C(800, 330, 40, "#e8b95a") + C(800, 330, 9, NO)
      + arcs.map((d) => lueur(d, "#ff9db5", 7, "#ffd3dc")).join("")
      + bille(330, 300, 62, "#4a1f18", "#b86a2a", "#f6d58a") + R(361, 236, 46, 28, OR, 'transform="rotate(30 384 250)"') + C(330, 300, 22, NO, 'opacity="0.55"')
      + E(1300, 440, 94, 80, "#4a1f18") + E(1292, 432, 80, 66, "#b86a2a") + E(1280, 420, 40, 30, "#f6d58a") + P("M1330 380L1370 330L1385 395Z", "#e0a047") + C(1285, 430, 7, NO) + C(1560, 190, 38, "#8b4a78", 'opacity="0.7"')
      + star(1170, 190, 38, "#ffe9a8") + star(250, 480, 26, "#ff7e6e") + star(620, 70, 16, IV, 0.8) + star(1430, 330, 14, IV, 0.7) + star(180, 140, 12, IV, 0.6)
      + fondu(380, 560, NO, 1600, 8, 0.28),
  };
});

// ── ft2-352 : soleil de console (disque vert rayé, rangées d'égaliseur) ──
const s352 = deux("0 0 1600 520", "420 0 760 520", () => {
  const V = "#6dff9a", G = "#0f1115";
  let bars = "";
  [[500, 1, 0.95, 32], [430, 0.7, 0.5, 32], [370, 0.5, 0.28, 32]].forEach(([base, sc, op, pas], row) => { const r = alea(352 + row); for (let x = 6, i = 0; x < 1600; x += pas, i++) { const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.23 + row)); const h = (30 + r() * 150) * env * sc; bars += R(x, base - h, pas - 10, h, V, `opacity="${op}"`); } });
  let tr = ""; for (let i = 0; i < 7; i++) tr += R(560, 190 + i * 24 + i * i * 1.4, 480, 4 + i * 2, G);
  return {
    defs: "",
    body: halo(800, 250, 430, V, 12, 0.04) + C(800, 250, 200, "#0e9a7a") + C(800, 236, 192, V) + C(800, 205, 150, "#a8ffc4", 'opacity="0.75"') + C(800, 180, 80, "#e6ffd5", 'opacity="0.8"') + tr + bars + fondu(420, 520, G, 1600, 6, 0.3)
      + C(280, 150, 46, "none", `stroke="${V}" stroke-width="2" opacity="0.4"`) + C(280, 150, 22, "none", `stroke="${V}" stroke-width="2" opacity="0.4"`) + C(1330, 130, 64, "none", `stroke="${V}" stroke-width="2" opacity="0.4"`) + C(1330, 130, 38, "none", `stroke="${V}" stroke-width="2" opacity="0.4"`)
      + star(1180, 330, 20, "#e6ffd5") + star(380, 320, 16, V) + star(1500, 280, 12, "#e6ffd5", 0.7) + R(210, 210, 14, 14, V, 'opacity="0.8"') + R(1440, 90, 18, 18, V, 'opacity="0.6"'),
  };
});

// ── ft2-351 : scène de théâtre (rideaux bordeaux, projecteurs, silhouettes, public) ──
const s351 = deux("0 0 1600 520", "380 0 840 520", () => {
  const BO = "#7d0f1f", B2 = "#5f0b17", OR = "#e6b34a";
  let rideauG = "", rideauD = "";
  for (let i = 0; i < 5; i++) { const x0 = i * 66, x1 = x0 + 66, b = 150 + i * 36; rideauG += P(`M${x0} 70L${x1} 70L${x1 - 20 + i * 4} ${b + 330}L${x0 - 10 + i * 4} ${b + 330}Z`, i % 2 ? B2 : BO); rideauD += P(`M${1600 - x0} 70L${1600 - x1} 70L${1600 - x1 + 20 - i * 4} ${b + 330}L${1600 - x0 + 10 - i * 4} ${b + 330}Z`, i % 2 ? B2 : BO); }
  let sc = ""; for (let i = 0; i < 8; i++) sc += C(70 + i * 55, 530, 36, "#0f0508") + P(`M${34 + i * 55} 560Q${70 + i * 55} 480 ${106 + i * 55} 560Z`, "#0f0508") + C(1600 - 70 - i * 55, 535, 34, "#0f0508") + P(`M${1600 - 106 - i * 55} 560Q${1600 - 70 - i * 55} 484 ${1600 - 34 - i * 55} 560Z`, "#0f0508");
  let pl = ""; for (let i = 0; i < 9; i++) pl += L(560 + i * 60, 400, 380 + i * 105, 520, "#3d1c0e", 3);
  let fest = ""; for (let i = 0; i < 10; i++) fest += `A80 40 0 0 1 ${1600 - (i + 1) * 160} 70`;
  return {
    defs: "",
    body: bandes(0, 0, 1600, 400, ["#4a1219", "#43101a", "#3a0d16", "#300b13", "#27090f", "#1d070b"]) + P("M470 70L260 400H560Z", "#fff1b8", 'opacity="0.16"') + P("M1130 70L1340 400H1040Z", "#fff1b8", 'opacity="0.16"') + P("M780 70L610 400H990Z", "#fff1b8", 'opacity="0.2"') + P("M800 70L700 400H900Z", "#fff1b8", 'opacity="0.12"')
      + bandes(0, 400, 1600, 120, ["#b6692f", "#a85e29", "#99531f", "#864718", "#6a3414"]) + pl + halo(800, 410, 330, "#fff1b8", 8, 0.05).replace(/<circle/g, "<ellipse").replace(/ r="([\d.]+)"/g, (m, r) => ` rx="${r}" ry="${f(r * 0.1)}"`).replace(/cy="410"/g, 'cy="412"')
      + rideauG + rideauD + P(`M1600 0H0V70${fest}Z`, BO) + R(0, 70, 1600, 7, OR)
      + C(740, 288, 21, "#14070a") + P("M714 400Q720 312 740 308Q760 312 766 400Z", "#14070a") + C(860, 296, 20, "#14070a") + P("M832 400L846 322Q860 316 874 322L890 400Z", "#14070a") + L(886, 330, 930, 292, "#14070a", 6) + C(800, 330, 18, "#14070a") + P("M776 400L788 346Q800 340 812 346L824 400Z", "#14070a")
      + P("M800 40L826 100H774Z", OR) + sc,
  };
});

// ── ft2-355 : la roulotte (paysage peint : collines, arbres, chemin, roulotte, guirlande) ──
const s355 = deux("0 0 1600 520", "380 0 840 520", () => {
  const r = alea(355), TL = "#0b3b3c";
  const feuillage = (x, y, s, a, b) => { let o = R(x - s * 0.06, y - s * 0.9, s * 0.12, s * 0.9, "#4a2a14"); for (let i = 0; i < 6; i++) o += C(x + (r() - 0.5) * s * 0.7, y - s * (0.95 + r() * 0.7), s * (0.28 + r() * 0.16), i % 2 ? a : b); return o; };
  let flags = ""; const cols = ["#f2b45a", "#d8573a", "#f6f1e7", "#5fa08f"];
  for (let i = 0; i < 19; i++) { const x = 380 + i * 58, y = 120 + 70 * Math.sin((i / 18) * Math.PI); flags += P(`M${x} ${f(y)}L${x + 36} ${f(y + 2)}L${x + 18} ${f(y + 42)}Z`, cols[i % 4]); }
  return {
    defs: "",
    body: P("M0 330Q220 250 430 300T850 270T1250 290T1600 240V520H0Z", "#a6bf9d") + P("M0 400Q300 330 620 380T1160 350T1600 330V520H0Z", "#5f9c85")
      + feuillage(190, 380, 190, "#2f7a62", "#7fb06a") + feuillage(330, 360, 150, "#7fb06a", "#2f7a62") + feuillage(1380, 360, 200, "#2f7a62", "#a9c16d") + feuillage(1520, 380, 170, "#7fb06a", "#2f7a62") + feuillage(1240, 350, 120, "#a9c16d", "#2f7a62")
      + P("M380 120Q800 250 1220 120", "none", 'stroke="#10292b" stroke-width="3"') + flags
      + R(830, 292, 380, 150, "#c9722a") + P("M810 296Q1020 190 1230 296Z", "#a14a0b") + R(880, 330, 70, 70, "#fff1d2") + R(1000, 330, 70, 70, "#fff1d2") + L(915, 330, 915, 400, "#10292b", 3) + L(880, 365, 950, 365, "#10292b", 3) + R(1110, 340, 54, 100, "#10292b") + R(1090, 240, 26, 46, "#6a3414")
      + roue(920, 452, 38, "#10292b", "#f2b45a") + roue(1130, 452, 38, "#10292b", "#f2b45a") + L(1210, 380, 1300, 420, "#10292b", 8)
      + P("M0 470Q320 420 640 450T1100 470Q700 470 300 520H0Z", "#e8b96a") + P("M0 470Q300 440 600 470T1100 480L1600 520H0Z", TL)
      + R(520, 400, 12, 80, "#6a3414") + R(470, 380, 112, 46, "#f6f1e7", 'transform="rotate(-4 526 400)"') + R(488, 394, 74, 6, "#a14a0b", 'transform="rotate(-4 526 400)"') + R(488, 408, 50, 6, "#a14a0b", 'transform="rotate(-4 526 400)"')
      + C(650, 408, 13, "#e8c8a0") + P("M628 468Q632 424 650 420Q668 424 672 468Z", "#d8573a") + L(664, 436, 712, 410, "#d8573a", 9),
  };
});

// ── ft2-356 : accrochage (salle d'exposition : cadres, visiteurs, banc) sur blanc cassé ──
const s356 = deux("0 0 1600 520", "280 0 1040 520", () => {
  const N = "#121212", V = "#c8321b", O = "#d9a441";
  const cadre = (x, y, w, h, inner) => R(x - 8, y - 8, w + 16, h + 16, N) + R(x, y, w, h, "#fbfaf6") + inner;
  const cone = (x, w, h) => P(`M${x} 70L${x - w} ${h}H${x + w}Z`, V, 'opacity="0.07"');
  return {
    defs: "",
    body: bandes(0, 410, 1600, 110, ["#e5e0d3", "#dfd9ca", "#d9d3c3", "#d3cdbd"]) + R(0, 400, 1600, 10, "#bdb6a4")
      + cone(630, 90, 360) + cone(780, 120, 360) + cone(1185, 90, 330)
      + cadre(640, 90, 330, 250, R(640, 90, 330, 250, "#efe4cf") + C(760, 190, 92, V) + R(850, 90, 40, 250, N) + P("M640 340L760 230L870 340Z", O) + C(930, 150, 22, N))
      + cadre(250, 130, 190, 230, R(250, 130, 190, 230, N) + C(345, 240, 60, "none", 'stroke="#fbfaf6" stroke-width="14"') + C(345, 240, 14, V))
      + cadre(1090, 120, 150, 200, R(1090, 120, 150, 200, "#e8ecf2") + [0, 1, 2, 3, 4].map((i) => R(1090, 130 + i * 40, 150, 14 + i * 3, i % 2 ? N : "#4a6fa5")).join(""))
      + cadre(1320, 200, 90, 90, R(1320, 200, 90, 90, V) + C(1365, 245, 24, "#fbfaf6")) + cadre(60, 210, 110, 80, R(60, 210, 110, 80, O) + R(60, 250, 110, 12, N))
      + R(1100, 372, 280, 26, "#6a3f22") + R(1120, 398, 14, 40, N) + R(1346, 398, 14, 40, N)
      + E(520, 440, 150, 14, "#c9c2ae") + P("M446 438Q448 330 480 310Q496 300 512 312Q540 330 540 438Z", N) + C(498, 276, 26, "#d9b48a") + P("M470 322Q498 346 528 322V342Q498 366 470 342Z", V)
      + P("M556 438Q560 340 590 322Q606 314 620 326Q644 344 646 438Z", "#4a3f38") + C(600, 290, 24, "#c9966a") + L(636, 350, 690, 330, "#4a3f38", 11),
  };
});

// ── ft2-359 : façade du musée (pédiment, colonnes, soleil, marches, visiteurs) sur corail ──
const s359 = deux("0 0 1600 520", "400 0 800 520", () => {
  const N = "#1b1b1f", CR = "#fff4ea", JA = "#ffd9a0";
  let col = "", v = ""; for (let i = 0; i < 8; i++) col += R(590 + i * 56, 260, 28, 160, CR) + R(584 + i * 56, 250, 40, 14, N) + R(584 + i * 56, 416, 40, 12, N);
  for (let i = 0; i < 4; i++) v += P(`M${620 + i * 90} 520Q${626 + i * 90} 478 ${640 + i * 90} 470Q${654 + i * 90} 478 ${660 + i * 90} 520Z`, N) + C(640 + i * 90, 458, 12, N);
  return {
    defs: "",
    body: C(800, 200, 290, JA, 'opacity="0.35"') + C(800, 200, 235, JA, 'opacity="0.55"') + C(800, 200, 190, "#ff9f86")
      + R(500, 240, 600, 14, N) + P("M480 240L800 90L1120 240Z", N) + P("M540 232L800 112L1060 232Z", CR) + C(800, 190, 22, "#ff6b57") + col + R(560, 428, 480, 18, N) + R(530, 446, 540, 18, N) + R(500, 464, 600, 22, N) + R(470, 486, 660, 34, N) + v
      + L(160, 520, 160, 330, N, 8) + C(160, 300, 52, N) + L(1440, 520, 1440, 340, N, 8) + C(1440, 310, 48, N) + L(300, 520, 300, 400, N, 7) + C(300, 380, 36, N) + L(1300, 520, 1300, 420, N, 7) + C(1300, 398, 34, N)
      + P("M1000 150L1060 130L1000 110Z", "#ff6b57") + L(1000, 100, 1000, 240, N, 4) + star(380, 120, 20, CR) + star(1250, 90, 16, CR) + star(1500, 200, 12, CR),
  };
});

// ── silhouettes sur une ligne de sol (inspirées de la bande d'objets de la capture 23) ──
const camion = (x, y, col, bg) => R(x, y - 62, 100, 50, col) + P(`M${x + 100} ${y - 52}H${x + 138}L${x + 160} ${y - 24}V${y - 12}H${x + 100}Z`, col) + R(x + 112, y - 46, 26, 18, bg) + roue(x + 30, y - 10, 15, col, bg) + roue(x + 128, y - 10, 15, col, bg);
const rouePanoramique = (cx, cy, r, col) => { let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="none" stroke="${col}" stroke-width="3"/>`; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; o += L(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, col, 3) + R(cx + Math.cos(a) * r - 8, cy + Math.sin(a) * r - 2, 16, 14, col); } return o + P(`M${cx - 6} ${cy}L${cx - r * 0.45} ${cy + r + 14}H${cx + r * 0.45}L${cx + 6} ${cy}Z`, col); };

// ── ft2-353 : ligne de festival (chapiteau, scène, grande roue, haut-parleurs, arbres, camion) ──
const s353 = deux("0 0 1600 260", "480 0 640 260", (p) => {
  const K = "#111111", RO = "#ff2e88", Y = "#ffd400", y = 232;
  const tente = P(`M1240 ${y}L1360 ${y - 140}L1480 ${y}Z`, K) + R(1262, y - 70, 196, 70, K) + P(`M1330 ${y}L1360 ${y - 62}L1390 ${y}Z`, Y) + L(1360, y - 140, 1360, y - 190, K, 4) + P(`M1360 ${y - 190}L1400 ${y - 178}L1360 ${y - 166}Z`, RO);
  const scene = R(130, y - 112, 300, 112, K) + R(150, y - 92, 260, 12, Y) + L(110, y - 120, 450, y - 120, K, 8) + L(130, y - 112, 130, y - 190, K, 6) + L(430, y - 112, 430, y - 190, K, 6) + L(130, y - 190, 430, y - 190, K, 6) + [0, 1, 2, 3, 4, 5].map((i) => C(168 + i * 48, y - 190, 8, RO)).join("") + R(60, y - 74, 40, 74, K) + R(460, y - 74, 40, 74, K) + C(80, y - 54, 10, Y) + C(480, y - 54, 10, Y);
  return { defs: "", body: scene + rouePanoramique(900, 100, 84, K) + tente + arbre(590, y, 120, K) + arbre(640, y, 88, K) + arbre(1130, y, 110, K) + arbre(1560, y, 100, K) + camion(700, y, K, Y) + arbre(60, y, 80, K) + C(1020, 170, 24, RO) + R(0, y, 1600, 28, K) };
});

// ── ft2-354 : ligne d'orchestre (violoncelle, harpe, piano à queue, chef, timbales, trompette) ──
const s354 = deux("0 0 1600 260", "420 0 760 260", (p) => {
  const M = "#14213d", OR = "#a23304", y = 232;
  const violoncelle = (x) => E(x, y - 62, 38, 34, M) + E(x, y - 112, 30, 30, M) + R(x - 5, y - 200, 10, 90, M) + C(x, y - 206, 11, M) + L(x, y - 30, x, y, M, 4);
  const harpe = (x) => P(`M${x} ${y}V${y - 200}Q${x + 120} ${y - 250} ${x + 150} ${y - 110}L${x + 40} ${y - 6}Z`, "none", `stroke="${M}" stroke-width="9"`) + [0, 1, 2, 3, 4, 5].map((i) => L(x + 22 + i * 18, y - 200 + i * 18, x + 22 + i * 18, y - 24 - i * 6, M, 2)).join("");
  const piano = (x) => P(`M${x} ${y - 94}H${x + 260}Q${x + 300} ${y - 94} ${x + 260} ${y - 64}H${x + 120}Q${x + 90} ${y - 140} ${x} ${y - 128}Z`, M) + R(x + 16, y - 66, 8, 66, M) + R(x + 236, y - 66, 8, 66, M) + R(x + 110, y - 66, 8, 66, M) + R(x + 40, y - 38, 160, 8, M) + R(x + 70, y - 30, 8, 30, M) + R(x + 168, y - 30, 8, 30, M);
  const chef = (x) => R(x - 40, y - 24, 80, 24, M) + C(x, y - 160, 20, M) + P(`M${x - 28} ${y - 24}L${x - 20} ${y - 138}H${x + 20}L${x + 28} ${y - 24}Z`, M) + L(x + 14, y - 118, x + 70, y - 160, M, 8) + L(x + 70, y - 160, x + 112, y - 205, OR, 4) + L(x - 14, y - 118, x - 54, y - 90, M, 8);
  const timbale = (x) => P(`M${x - 50} ${y - 70}A50 44 0 0 0 ${x + 50} ${y - 70}Z`, M) + R(x - 50, y - 76, 100, 8, M) + L(x - 30, y - 40, x - 40, y, M, 5) + L(x + 30, y - 40, x + 40, y, M, 5);
  const pupitre = (x) => L(x, y, x, y - 100, M, 5) + P(`M${x - 34} ${y - 100}L${x + 34} ${y - 100}L${x + 26} ${y - 150}H${x - 26}Z`, M) + L(x - 22, y, x + 22, y, M, 5);
  const trompette = (x) => R(x, y - 60, 120, 8, M) + P(`M${x + 120} ${y - 56}L${x + 170} ${y - 84}V${y - 28}Z`, M) + C(x + 30, y - 70, 18, "none", `stroke="${M}" stroke-width="6"`) + R(x + 20, y - 40, 6, 40, M);
  return { defs: "", body: C(1240, 86, 50, OR, 'opacity="0.9"') + violoncelle(130) + harpe(260) + pupitre(520) + chef(640) + pupitre(760) + piano(860) + trompette(1200) + timbale(1440) + arbre(1560, y, 90, M) + R(0, y, 1600, 28, M) };
});

// ── ft2-358 : ligne de centre d'art (fronton, sculptures sur socles, cubes, grue, arbres) ──
const s358 = deux("0 0 1600 260", "400 0 800 260", (p) => {
  const K = "#141414", OR = "#a93509", y = 232;
  let col = ""; for (let i = 0; i < 6; i++) col += R(260 + i * 44, y - 110, 18, 96, K);
  const musee = P(`M240 ${y - 114}L370 ${y - 190}L500 ${y - 114}Z`, K) + R(240, y - 114, 260, 8, K) + col + R(240, y - 14, 260, 14, K) + R(226, y - 6, 288, 6, K) + C(370, y - 150, 10, OR);
  const sculpture = R(620, y - 56, 74, 56, K) + C(657, y - 108, 52, K) + C(640, y - 124, 14, OR);
  const cubes = R(780, y - 60, 60, 60, K) + R(840, y - 100, 60, 100, K) + R(800, y - 120, 40, 60, OR);
  const spirale = `<path d="M1010 ${y}V${y - 46}C960 ${y - 60} 960 ${y - 120} 1010 ${y - 120}C1060 ${y - 120} 1060 ${y - 70} 1020 ${y - 78}" fill="none" stroke="${K}" stroke-width="12"/>` + R(986, y - 14, 50, 14, K);
  const grue = L(1200, y, 1200, y - 220, K, 8) + L(1130, y - 210, 1380, y - 210, K, 7) + L(1200, y - 222, 1260, y - 210, K, 4) + L(1330, y - 210, 1330, y - 140, K, 3) + R(1316, y - 140, 28, 22, OR) + R(1170, y - 20, 60, 20, K);
  return { defs: "", body: musee + sculpture + cubes + spirale + grue + arbre(580, y, 100, K) + arbre(960, y, 80, K) + arbre(1450, y, 120, K) + arbre(1520, y, 84, K) + arbre(110, y, 110, K) + arbre(170, y, 74, K) + C(40, 80, 30, OR) + R(0, y, 1600, 28, K) };
});

// ── ft2-360 : quai de la fondation (bâtiment vitré, pont, voilier, quatre rangs de vagues bleues) ──
const s360 = deux("0 0 1600 300", "430 0 740 300", () => {
  const N = "#14141a", B = "#1d3a8a";
  let vitres = ""; for (let i = 0; i < 9; i++) vitres += L(540 + i * 40, 90, 540 + i * 40, 218, "#dcd8cc", 3);
  return {
    defs: "",
    body: R(520, 90, 400, 130, N) + P("M520 90L720 40L920 90Z", N) + vitres + L(520, 150, 920, 150, "#dcd8cc", 3) + R(690, 170, 60, 50, "#dcd8cc") + R(960, 130, 24, 90, N) + P("M960 130L1160 218H1100L960 150Z", B)
      + P("M1000 218Q1200 90 1400 218", "none", `stroke="${N}" stroke-width="9"`) + [0, 1, 2, 3, 4].map((i) => L(1060 + i * 70, 218 - 100 * Math.sin(((i + 0.6) / 5.2) * 3.14) * 0.9, 1060 + i * 70, 218, N, 3)).join("")
      + P("M300 218L420 218L340 238Z", N) + P("M340 120L340 214L420 214Z", B) + P("M330 140L330 214L270 214Z", N) + L(335, 110, 335, 214, N, 4) + C(120, 60, 40, "#a8b8de", 'opacity="0.8"')
      + vague(214, 12, 220, 20, "#8fa6d6", 300) + vague(240, 14, 200, 60, "#5f7fc2", 300) + vague(262, 12, 180, 30, "#3153a6", 300) + vague(284, 10, 160, 90, B, 300),
  };
});

// ── ft2-357 : sphère armillaire nocturne (méridiens gravés, anneaux, arcs lumineux, planche, croissant) ──
const s357 = deux("0 0 1600 600", "430 0 740 600", () => {
  const r = alea(357), IV = "#f3eee2", RO = "#ff8a7a", FO = "#0d1030";
  let mer = "", par = ""; for (let i = 1; i <= 5; i++) mer += E(800, 340, i * 52, 270, "none", `stroke="${IV}" stroke-width="1.5" opacity="0.28"`);
  for (let i = -3; i <= 3; i++) par += E(800, 340 + i * 70, Math.sqrt(270 * 270 - i * i * 4900), 14 + Math.abs(i) * 4, "none", `stroke="${IV}" stroke-width="1.5" opacity="0.24"`);
  const arcs = ["M600 210C620 70 760 50 800 210", "M830 190C870 20 960 40 960 200", "M900 230C1060 90 1200 120 1190 260"];
  return {
    defs: "",
    body: halo(800, 330, 480, "#6a5cff", 12, 0.04) + C(800, 340, 272, "#1d1a5e") + C(780, 322, 245, "#2c2680", 'opacity="0.9"') + C(755, 295, 190, "#4a3fb0", 'opacity="0.55"') + C(720, 260, 100, "#7b6cff", 'opacity="0.35"')
      + mer + par + points(r, 780, 330, 220, 140, IV, 1.2, 2.6, 0.8) + L(800, 50, 800, 640, IV, 2, 'opacity="0.3"')
      + E(800, 340, 410, 82, "none", `stroke="${IV}" stroke-width="4" transform="rotate(-18 800 340)"`) + E(800, 340, 360, 62, "none", `stroke="${RO}" stroke-width="3" transform="rotate(24 800 340)"`)
      + arcs.map((d) => lueur(d, RO, 7, "#ffd9d2")).join("")
      + R(250, 230, 130, 170, IV, 'transform="rotate(-12 315 315)"') + [0, 1, 2, 3, 4, 5, 6].map((i) => L(270 + i * 4, 252 + i * 20, 352 - i * 4, 252 + i * 20, "#352a8a", 3, 'transform="rotate(-12 315 315)"')).join("") + C(318, 318, 28, "none", 'stroke="#7a1f1f" stroke-width="5" transform="rotate(-12 315 315)"')
      + P("M1330 250A90 90 0 1 0 1420 360A70 70 0 1 1 1330 250Z", "#f6e6b8") + star(1480, 180, 26, "#ffe1d9") + star(210, 130, 16, IV, 0.8) + star(1120, 90, 14, IV, 0.7) + star(1560, 470, 12, IV, 0.6) + C(1500, 520, 20, "#8b6cc8", 'opacity="0.6"')
      + fondu(420, 600, FO, 1600, 8, 0.3),
  };
});

// ── ft2-361 : le Levant (soleil citron, rayons, gradins verts, feuilles flottantes) ──
const s361 = deux("0 0 1600 560", "400 0 800 560", () => {
  const CI = "#d8e48f", FO = "#20231d";
  let rayons = ""; for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.283; rayons += L(800 + Math.cos(a) * 250, 290 + Math.sin(a) * 250, 800 + Math.cos(a) * (310 + (i % 2) * 40), 290 + Math.sin(a) * (310 + (i % 2) * 40), CI, 4, 'opacity="0.45"'); }
  const feuille = (x, y, s, rot, c) => P(`M${x} ${y}Q${x + s * 0.6} ${y - s * 0.6} ${x + s} ${y}Q${x + s * 0.6} ${y + s * 0.6} ${x} ${y}Z`, c, `transform="rotate(${rot} ${x} ${y})"`);
  return {
    defs: "",
    body: halo(800, 290, 500, CI, 12, 0.04) + rayons + C(800, 290, 210, "#8aa04a") + C(800, 285, 200, CI) + C(800, 270, 150, "#eef7b0") + C(800, 260, 80, "#fbffd0")
      + R(300, 460, 1000, 100, "#3a4033") + R(400, 400, 800, 62, "#4b5440") + R(500, 340, 600, 62, "#7c8a6a") + R(600, 290, 400, 52, "#a9b88f") + R(730, 230, 140, 62, "#d6dcc8")
      + P("M750 560V500Q800 450 850 500V560Z", FO) + R(560, 420, 60, 28, FO) + R(980, 420, 60, 28, FO) + R(540, 360, 40, 24, FO) + R(1020, 360, 40, 24, FO)
      + feuille(220, 200, 90, -30, "#7c8a6a") + feuille(1300, 150, 110, 20, "#a9b88f") + feuille(1400, 400, 70, 50, CI) + feuille(150, 420, 70, -60, CI) + C(1480, 240, 28, "#7c8a6a", 'opacity="0.7"') + star(380, 100, 22, "#fbffd0") + star(1200, 70, 16, "#fbffd0", 0.8) + star(1500, 360, 12, CI),
  };
});

const SCENES = { s350, s352, s351, s355, s356, s359, s353, s354, s358, s360, s357, s361 };

// widget(s) SVG : large (bureau, tablette) + étroit (mobile)
const illus = (k, nom, st) => {
  const s = SCENES[nom];
  const base = compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...(st || {}) });
  return [{ ...k.W("html", { html: s.large }, base), hideOn: ["mobile"] }, { ...k.W("html", { html: s.etroit }, base), hideOn: ["desktop", "tablet"] }];
};

// ── Marques dessinées (écusson 64 x 64) : une par modèle ──
const GLYPHES = [
  (a, b) => C(32, 32, 16, "none", `stroke="${a}" stroke-width="3"`) + C(32, 32, 5, b) + L(32, 8, 32, 14, a, 3),
  (a, b) => P("M14 14Q22 24 20 50H12Z", a) + P("M50 14Q42 24 44 50H52Z", a) + R(26, 40, 12, 10, b),
  (a, b) => [0, 1, 2].map((i) => L(20 + i * 12, 14, 20 + i * 12, 50, a, 3) + R(15 + i * 12, 22 + ((i * 11) % 18), 10, 8, b)).join(""),
  (a, b) => P("M12 50L32 14L52 50Z", a) + P("M26 50L32 36L38 50Z", b),
  (a, b) => E(32, 40, 11, 12, a) + R(30, 12, 4, 20, a) + C(32, 12, 4, b),
  (a, b) => P("M14 20Q32 8 50 20Q50 46 32 52Q14 46 14 20Z", a) + P("M22 28Q26 32 30 28", "none", `stroke="${b}" stroke-width="3"`) + P("M34 28Q38 32 42 28", "none", `stroke="${b}" stroke-width="3"`),
  (a, b) => R(14, 14, 36, 36, "none", `stroke="${a}" stroke-width="3"`) + R(22, 22, 20, 20, b),
  (a, b) => P("M12 24L32 12L52 24Z", a) + [0, 1, 2].map((i) => R(17 + i * 13, 28, 6, 20, b)).join("") + R(12, 50, 40, 4, a),
  (a, b) => C(32, 32, 10, b) + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => L(32 + Math.cos(i * 0.785) * 15, 32 + Math.sin(i * 0.785) * 15, 32 + Math.cos(i * 0.785) * 21, 32 + Math.sin(i * 0.785) * 21, a, 3)).join(""),
  (a, b) => `<path d="M10 40Q20 28 30 40T50 40" fill="none" stroke="${a}" stroke-width="4"/><path d="M10 50Q20 38 30 50T50 50" fill="none" stroke="${b}" stroke-width="4"/>` + R(26, 14, 14, 18, a),
  (a, b) => `<ellipse cx="32" cy="32" rx="19" ry="7" fill="none" stroke="${a}" stroke-width="3" transform="rotate(-25 32 32)"/>` + C(32, 32, 10, b),
  (a, b) => R(12, 40, 40, 10, a) + R(20, 30, 32, 10, b) + R(28, 20, 24, 10, a) + R(36, 10, 16, 10, b),
];
const marque = (i, o = {}) => { const a = o.trait || "#ffffff", b = o.accent || "#ffd400", fond = o.fond || "#1d3a8a"; return svg("0 0 64 64", "", P("M32 2L58 17V47L32 62L6 47V17Z", fond, `stroke="${a}" stroke-width="2.5"`) + GLYPHES[i](a, b)); };

module.exports = { illus, marque, SCENES };
