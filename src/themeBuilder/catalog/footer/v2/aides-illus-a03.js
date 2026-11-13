// Illustrations SVG propres aux 12 pieds « Studios créatifs » (ft2-302 à 307) et « Architecture et design d'intérieur » (ft2-308 à 313).
// Uniquement des balises acceptées par le widget HTML sécurisé : svg g path circle rect line polyline polygon ellipse defs linearGradient radialGradient stop.
// Chaque dessin est UNIQUE (aucun partagé entre modèles). Pas de texte, pas de filtre : les halos sont des dégradés radiaux.
const { compact } = require("../../kit");
const A = require("./aides-inspire-studios");

const f = (n) => Math.round(n * 10) / 10;
const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const svg = (W, H, defs, corps) => {
  const s = `<svg viewBox="0 0 ${f(W)} ${f(H)}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${defs ? `<defs>${defs}</defs>` : ""}${corps}</svg>`;
  if (s.length > 19500) throw new Error(`SVG trop long (${s.length})`);
  return s;
};
const lg = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, p]) => `<stop offset="${o}" stop-color="${c}"${p != null ? ` stop-opacity="${p}"` : ""}/>`).join("")}</linearGradient>`;
const rg = (id, stops) => `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5">${stops.map(([o, c, p]) => `<stop offset="${o}" stop-color="${c}"${p != null ? ` stop-opacity="${p}"` : ""}/>`).join("")}</radialGradient>`;
const R = (x, y, w, h, fill, op) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;
const C = (cx, cy, r, fill, op) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;
const P = (pts, fill, op) => `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;
const L = (x1, y1, x2, y2, stroke, w = 2, op) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}"${op != null ? ` opacity="${op}"` : ""}/>`;
const PL = (pts, stroke, w = 2, op, fill = "none") => `<polyline points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"${op != null ? ` opacity="${op}"` : ""}/>`;
const PA = (d, fill, stroke, w, op) => `<path d="${d}" fill="${fill || "none"}"${stroke ? ` stroke="${stroke}" stroke-width="${w || 2}"` : ""}${op != null ? ` opacity="${op}"` : ""}/>`;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };

// Le widget HTML sécurisé retire les balises de dégradé : fondus = bandes étagées, halos = cercles concentriques translucides.
const fondu = (x, y, w, h, c1, c2, n = 24, c3) => { let o = ""; for (let i = 0; i < n; i++) { const t = i / (n - 1), col = c3 ? (t < 0.5 ? mix(c1, c2, t * 2) : mix(c2, c3, (t - 0.5) * 2)) : mix(c1, c2, t); o += R(x, y + (h / n) * i, w, h / n + 1, col); } return o; };
const halo = (cx, cy, r, col, op, n = 7) => { let o = ""; for (let i = 0; i < n; i++) o += C(cx, cy, r * (1 - i / n), col, op / n * 1.4); return o; };

// Les deux variantes (large / étroite) d'une scène pleine largeur ; la CSS de la plateforme impose height:auto : la hauteur suit la largeur.
const renomme = (s) => { const ids = [...s.matchAll(/id="([^"]+)"/g)].map((m) => m[1]); let t = s; ids.forEach((i) => { t = t.split(`"${i}"`).join(`"${i}n"`).split(`(#${i})`).join(`(#${i}n)`); }); return t; };
const dessin = (k, large, etroit, st = {}) => [
  { ...k.W("html", { html: large }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["mobile"] },
  { ...k.W("html", { html: renomme(etroit) }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["desktop", "tablet"] },
];
const piece = (k, s, st = {}) => k.W("html", { html: s }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st }));

// ═══ 302 : skyline d'affiches au soleil couchant (capture 10 : ville, grand soleil, ponton, promeneurs) ═══
function sceneAffiches(W, H) {
  const hz = H * 0.66, a = alea(302), cx = W * 0.5;
  let o = fondu(0, 0, W, H, "#f6c8a0", "#e9803f", 20, "#f2a665") + C(cx, hz - H * 0.02, H * 0.5, "#fbe9cf", 0.92) + C(cx, hz - H * 0.02, H * 0.34, "#fff4e0", 0.55);
  [["#b8400a", 0.34, 0.22, 0.9], ["#7a2a08", 0.26, 0.2, 0.95], ["#14110f", 0.18, 0.16, 1]].forEach(([col, hmax, hmin, op], i) => {
    let x = -10 + i * 14;
    while (x < W) {
      const w = (W < 700 ? 22 : 38) + a() * (W < 700 ? 18 : 34), h = H * (hmin + a() * (hmax - hmin));
      o += R(x, hz - h, w, h + 2, col, op);
      const m = a();
      if (m < 0.34) o += C(x + w / 2, hz - h * 0.7, w * 0.22, "#fbe9cf", 0.9);
      else if (m < 0.62) o += R(x + w * 0.2, hz - h * 0.8, w * 0.6, Math.max(3, w * 0.09), "#fbe9cf", 0.85);
      x += w + 3 + a() * 5;
    }
  });
  o += fondu(0, hz, W, H - hz, "#e98a4a", "#b8400a", 12);
  for (let i = 0; i < 16; i++) { const y = hz + 4 + i * ((H - hz) / 16), l = W * (0.08 + a() * 0.22), x = a() * W; o += R(x, y, l, 2, "#fbe9cf", 0.5); }
  o += P([[cx - W * 0.018, hz], [cx + W * 0.018, hz], [cx + W * 0.27, H], [cx - W * 0.27, H]], "#fbe3c3");
  for (let i = 1; i < 6; i++) o += L(cx - W * 0.018 + (i / 6) * W * 0.036 * 0 + (i - 3) * W * 0.006, hz, cx + (i - 3) * W * 0.09, H, "#e9a46a", 2, 0.7);
  [[cx - W * 0.1, 0.8, 1], [cx + W * 0.08, 0.7, 0.8], [cx + W * 0.02, 0.5, 0.55]].forEach(([x, py, s]) => {
    const y = hz + (H - hz) * py, u = H * 0.1 * s;
    o += R(x - u * 0.2, y - u * 0.9, u * 0.4, u * 0.9, "#14110f") + C(x, y - u * 1.1, u * 0.16, "#14110f");
  });
  return svg(W, H, "", o);
}
// ═══ 303 : planche de vignettes dessinées (rangée de 4 cadres de pellicule) ═══
function sceneVignettes(W, H, n) {
  const mx = W * 0.04, gap = W * 0.02, fw = (W - 2 * mx - gap * (n - 1)) / n, fy = H * 0.2, fh = H * 0.6;
  let o = R(0, 0, W, H, "#0e0e10");
  for (let i = 0; i < Math.floor(W / 30); i++) { o += R(10 + i * 30, 4, 12, 8, "#26262d") + R(10 + i * 30, H - 12, 12, 8, "#26262d"); }
  const dessins = [
    (x, y, w, h) => R(x, y, w, h, "#1c1c22") + C(x + w * 0.68, y + h * 0.34, h * 0.14, "#d4ff3a") + P([[x, y + h], [x + w * 0.3, y + h * 0.45], [x + w * 0.55, y + h * 0.75], [x + w * 0.75, y + h * 0.5], [x + w, y + h]], "#3b3b44") + P([[x, y + h], [x + w * 0.18, y + h * 0.72], [x + w * 0.4, y + h]], "#2a2a31"),
    (x, y, w, h) => R(x, y, w, h, "#d4ff3a") + C(x + w * 0.5, y + h * 0.4, h * 0.2, "#0e0e10") + P([[x + w * 0.12, y + h], [x + w * 0.2, y + h * 0.7], [x + w * 0.8, y + h * 0.7], [x + w * 0.88, y + h]], "#0e0e10"),
    (x, y, w, h) => { let s = R(x, y, w, h, "#26262d"); for (let j = 0; j < 7; j++) { const bh = h * (0.3 + ((j * 37) % 50) / 100); s += R(x + w * 0.08 + j * w * 0.125, y + h - bh, w * 0.09, bh, j % 3 === 0 ? "#d4ff3a" : "#f4f4ef", j % 3 === 0 ? 1 : 0.85); } return s; },
    (x, y, w, h) => { let s = R(x, y, w, h, "#17171b"); for (let j = 0; j < 6; j++) { const pts = []; for (let t = 0; t <= 16; t++) pts.push([x + (t / 16) * w, y + h * (0.25 + j * 0.11) + Math.sin(t * 0.8 + j) * h * 0.05]); s += PL(pts, j % 2 ? "#f4f4ef" : "#d4ff3a", 3, 0.9); } return s; },
  ];
  for (let i = 0; i < n; i++) {
    const x = mx + i * (fw + gap);
    o += R(x - 6, fy - 6, fw + 12, fh + 12, "#202026") + dessins[i % 4](x, fy, fw, fh) + `<rect x="${f(x)}" y="${f(fy)}" width="${f(fw)}" height="${f(fh)}" fill="none" stroke="#f4f4ef" stroke-width="1.5" opacity="0.35"/>`;
  }
  return svg(W, H, "", o);
}
// ═══ 304 : paysage de synthèse (soleil en tranches, montagnes, grille en perspective) ═══
function sceneSynth(W, H) {
  const hz = H * 0.62, cx = W * 0.5, r = H * 0.46, a = alea(304);
  let o = fondu(0, 0, W, hz, "#1d0a55", "#6a22c7", 28, "#ff5fa8");
  for (let i = 0; i < 40; i++) o += R(a() * W, a() * hz * 0.6, 2.5, 2.5, "#ffffff", 0.4 + a() * 0.5);
  const cy = hz - r * 0.55;
  for (let j = 0; j < 12; j++) {
    const y0 = cy - r + j * (r * 1.55 / 12), hh = (r * 1.55 / 12) * (j < 4 ? 1 : 0.9 - (j - 4) * 0.08), ym = y0 + hh / 2, d = Math.sqrt(Math.max(0, r * r - (ym - cy) * (ym - cy)));
    if (y0 + hh > hz) break;
    o += R(cx - d, y0, d * 2, hh, mix("#ffe36b", "#ff5fa8", j / 12));
  }
  [["#1a0b4a", 0.3, 1], ["#2d1480", 0.2, 2]].forEach(([col, mh, s]) => { const pts = [[0, hz]]; for (let x = 0; x <= W; x += W / 14) pts.push([x, hz - H * mh * (0.35 + a() * 0.65)]); pts.push([W, hz]); o += P(pts, col) + PL(pts.slice(1, -1), "#5eead4", 2, 0.8); });
  o += R(0, hz, W, H - hz, "#12062f");
  for (let i = -12; i <= 12; i++) o += L(cx + i * 6, hz, cx + i * W * 0.09, H, "#ff5fa8", 2, 0.65);
  for (let i = 1; i <= 8; i++) { const t = i / 8; o += L(0, hz + (H - hz) * t * t, W, hz + (H - hz) * t * t, "#ff5fa8", 2, 0.65); }
  return svg(W, H, "", o);
}
// ═══ 305 : bandes ondulées (cinq vagues superposées) ═══
function sceneVagues(W, H) {
  let o = C(W * 0.2, H * 0.4, H * 0.32, "#fff3c4", 0.9) + C(W * 0.2, H * 0.4, H * 0.2, "#f2c230");
  [["#e9ad1c", 0.46], ["#d98a14", 0.58], ["#c1560e", 0.7], ["#7a2a08", 0.82], ["#141414", 0.92]].forEach(([col, y], i) => {
    const pts = [[0, H]]; for (let t = 0; t <= 40; t++) pts.push([(t / 40) * W, H * y + Math.sin(t * 0.4 + i * 1.7) * H * 0.055 + Math.sin(t * 0.17 + i) * H * 0.03]); pts.push([W, H]); o += P(pts, col);
  });
  return svg(W, H, "", o);
}

// ═══ Marques dessinées (monogrammes monumentaux, 200 × 200) ═══
const marque302 = () => svg(200, 200, "", R(14, 30, 112, 150, "#14110f") + R(48, 14, 112, 150, "#b8400a") + R(82, 40, 108, 146, "#f3ede2") + C(136, 90, 28, "#14110f") + R(100, 134, 74, 10, "#b8400a") + R(100, 154, 46, 10, "#14110f"));
function marque303() {
  let o = C(100, 100, 94, "#d4ff3a") + C(100, 100, 80, "#0e0e10");
  for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; o += P([[100 + Math.cos(t) * 74, 100 + Math.sin(t) * 74], [100 + Math.cos(t + 0.55) * 74, 100 + Math.sin(t + 0.55) * 74], [100 + Math.cos(t + 2.3) * 24, 100 + Math.sin(t + 2.3) * 24]], i % 2 ? "#202026" : "#17171b"); o += L(100 + Math.cos(t) * 74, 100 + Math.sin(t) * 74, 100 + Math.cos(t + 2.3) * 24, 100 + Math.sin(t + 2.3) * 24, "#d4ff3a", 3); }
  return svg(200, 200, "", o + C(100, 100, 18, "#d4ff3a"));
}
function marque304() {
  const g = ["..xxxxxx..", ".xxxxxxxx.", "xxxxxxxxxx", "xxooxxooxx", "xxooxxooxx", "xxxxxxxxxx", "xxxxxxxxxx", "xx.xxxx.xx", "x...xx...x"];
  let o = R(0, 0, 200, 200, "#4b2fd0");
  g.forEach((row, j) => [...row].forEach((c, i) => { if (c !== ".") o += R(20 + i * 16, 24 + j * 17, 16, 17, c === "o" ? "#0d1117" : "#5eead4"); }));
  return svg(200, 200, "", o);
}
const marque305 = () => svg(200, 200, "", C(100, 100, 94, "#141414") + C(100, 100, 82, "#f2c230") + PA("M138 60 C138 26 62 26 62 70 C62 112 142 92 142 136 C142 176 58 176 58 140", "", "#141414", 26) + R(26, 98, 148, 4, "#141414") + C(100, 100, 6, "#c1560e"));
const marque306 = () => svg(200, 200, "", C(100, 100, 94, "#f3ede2") + R(42, 82, 116, 78, "#14110f") + P([[42, 82], [60, 82], [80, 56], [62, 56]], "#f3ede2") + P([[84, 82], [102, 82], [122, 56], [104, 56]], "#f3ede2") + P([[126, 82], [144, 82], [158, 62], [158, 56], [140, 56]], "#f3ede2") + R(42, 56, 26, 22, "#9c2f22") + C(100, 122, 20, "#f3ede2") + C(100, 122, 8, "#9c2f22"));
const marque307 = () => svg(200, 200, "", P([[100, 18], [176, 60], [100, 102], [24, 60]], "#d9f2e6") + P([[24, 60], [100, 102], [100, 186], [24, 144]], "#0c3b2e") + P([[100, 102], [176, 60], [176, 144], [100, 186]], "#b23a08") + L(100, 102, 100, 186, "#d9f2e6", 4) + C(62, 112, 12, "#d9f2e6") + R(124, 100, 28, 12, "#d9f2e6"));
const marque308 = () => svg(200, 200, "", R(0, 0, 200, 200, "#1f2326") + PL([[24, 176], [24, 70], [100, 22], [176, 70], [176, 176], [24, 176]], "#e8a07f", 5) + R(52, 100, 30, 76, "#a8451f") + R(112, 100, 36, 30, "#e8a07f") + L(24, 192, 176, 192, "#f1ede4", 2) + L(24, 186, 24, 198, "#f1ede4", 2) + L(176, 186, 176, 198, "#f1ede4", 2) + L(100, 22, 100, 176, "#f1ede4", 2, 0.5));
const marque309 = () => svg(200, 200, "", R(14, 120, 80, 66, "#ffd23f") + R(94, 120, 92, 66, "#f4f1e8") + R(40, 54, 70, 66, "#101828") + R(110, 78, 48, 42, "#ffd23f") + R(60, 18, 34, 36, "#f4f1e8"));
function marque310() {
  let o = R(0, 0, 200, 200, "#1e2b22") + PA("M40 180 L40 90 A60 60 0 0 1 160 90 L160 180 Z", "#e3e8df") + PA("M66 180 L66 94 A34 34 0 0 1 134 94 L134 180 Z", "#4a5a2a");
  for (let i = 0; i < 5; i++) o += L(100, 36, 100 + (i - 2) * 22, 28 + Math.abs(i - 2) * 2, "#e3e8df", 3);
  return svg(200, 200, "", o + R(30, 180, 140, 8, "#e3e8df") + R(92, 120, 16, 60, "#1e2b22"));
}
const marque311 = () => svg(200, 200, "", R(0, 0, 200, 200, "#ffffff") + R(20, 20, 160, 160, "none") + PL([[20, 180], [20, 20], [180, 20]], "#111111", 8) + PL([[44, 156], [44, 44], [156, 44]], "#d42a0b", 8) + R(70, 70, 86, 86, "#111111") + L(70, 170, 156, 170, "#d42a0b", 3) + L(70, 164, 70, 176, "#d42a0b", 3) + L(156, 164, 156, 176, "#d42a0b", 3));
const marque312 = () => svg(200, 200, "", R(0, 0, 200, 200, "#e4cfb1") + R(48, 92, 104, 52, "#8a3b12") + R(36, 70, 30, 96, "#8a3b12") + R(134, 70, 30, 96, "#8a3b12") + R(66, 76, 68, 28, "#c39a6e") + R(44, 164, 10, 22, "#2b1d14") + R(146, 164, 10, 22, "#2b1d14") + L(172, 40, 172, 170, "#2b1d14", 4) + P([[150, 40], [194, 40], [184, 66], [160, 66]], "#faf6ee"));
function marque313() {
  let o = R(0, 0, 200, 200, "#0f1a14") + C(100, 118, 64, "#c8f04a", 0.9);
  [[24, 90], [56, 60], [88, 100], [112, 40], [140, 84], [160, 110]].forEach(([x, h], i) => { o += R(x, 200 - (200 - h) * 0.55 - 40, 26, (200 - h) * 0.55 + 40, i % 2 ? "#16251c" : "#0f1a14"); });
  return svg(200, 200, "", o + R(0, 168, 200, 32, "#0f1a14") + L(0, 168, 200, 168, "#c8f04a", 3));
}

// ═══ Illustrations de cartes d'appel (306 à 309) ═══
function artFaisceaux(W, H) {
  let o = R(0, 0, W, H, "#1d0f0d");
  [[0.14, 0.2], [0.38, 0.3], [0.62, 0.18], [0.86, 0.26]].forEach(([x, w], i) => { o += P([[W * x - 8, 0], [W * x + 8, 0], [W * (x + w), H], [W * (x - w), H]], "#f3ede2", 0.16) + P([[W * x - 4, 0], [W * x + 4, 0], [W * (x + w * 0.55), H], [W * (x - w * 0.55), H]], "#f3ede2", 0.2) + halo(W * x, H * 0.96, H * 0.4, "#f3ede2", 0.5); });
  o += R(0, H * 0.9, W, H * 0.1, "#9c2f22") + R(W * 0.44, H * 0.5, 6, H * 0.4, "#f3ede2") + C(W * 0.44 + 3, H * 0.42, 14, "#f3ede2");
  return svg(W, H, "", o);
}
function artMotifs(W, H) {
  const a = alea(307), n = 12, t = W / n, rows = Math.max(1, Math.round(H / t)); let o = "";
  const cs = ["#d9f2e6", "#0c3b2e", "#b23a08", "#7fcfae", "#f4fbf7"];
  for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
    const x = i * t, y = j * t, c1 = cs[Math.floor(a() * 5)], c2 = cs[Math.floor(a() * 5)], k = Math.floor(a() * 4);
    o += R(x, y, t, t, c1);
    if (k === 0) o += C(x + t / 2, y + t / 2, t * 0.34, c2); else if (k === 1) o += P([[x, y + t], [x + t, y + t], [x + t, y]], c2); else if (k === 2) o += R(x + t * 0.2, y + t * 0.2, t * 0.6, t * 0.6, c2); else o += PA(`M${f(x)} ${f(y + t)} A${f(t)} ${f(t)} 0 0 1 ${f(x + t)} ${f(y)} L${f(x + t)} ${f(y + t)} Z`, c2);
  }
  return svg(W, rows * t, "", o);
}
function artPlan(W, H) {
  let o = R(0, 0, W, H, "#1f2326");
  for (let x = 0; x <= W; x += 40) o += L(x, 0, x, H, "#e8a07f", 1, 0.14);
  for (let y = 0; y <= H; y += 40) o += L(0, y, W, y, "#e8a07f", 1, 0.14);
  const bx = W * 0.16, bw = W * 0.68, by = H * 0.16, bh = H * 0.68;
  o += PL([[bx, by + bh], [bx, by + bh * 0.28], [bx + bw * 0.5, by - H * 0.1], [bx + bw, by + bh * 0.28], [bx + bw, by + bh], [bx, by + bh]], "#f1ede4", 4);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = bx + bw * (0.08 + c * 0.23), y = by + bh * (0.36 + r * 0.2); o += R(x, y, bw * 0.15, bh * 0.12, "none") + PL([[x, y], [x + bw * 0.15, y], [x + bw * 0.15, y + bh * 0.12], [x, y + bh * 0.12], [x, y]], "#e8a07f", 3); o += L(x + bw * 0.075, y, x + bw * 0.075, y + bh * 0.12, "#e8a07f", 1.5); }
  o += R(bx + bw * 0.43, by + bh * 0.8, bw * 0.14, bh * 0.2, "#a8451f");
  for (let i = 0; i < 7; i++) o += L(bx, by + bh * 0.3 + i * 12, bx + 26, by + bh * 0.3 + i * 12 + 26, "#e8a07f", 1, 0.4);
  o += L(bx - 30, by + bh * 0.28, bx - 30, by + bh, "#d42a0b", 2) + L(bx - 40, by + bh * 0.28, bx - 20, by + bh * 0.28, "#d42a0b", 2) + L(bx - 40, by + bh, bx - 20, by + bh, "#d42a0b", 2);
  o += L(bx, by + bh + 34, bx + bw, by + bh + 34, "#d42a0b", 2) + L(bx, by + bh + 24, bx, by + bh + 44, "#d42a0b", 2) + L(bx + bw, by + bh + 24, bx + bw, by + bh + 44, "#d42a0b", 2);
  return svg(W, H, "", o);
}
function artBlocs(W, H) {
  const iso = (x, y, s, t, l, r) => P([[x, y], [x + s, y + s * 0.5], [x, y + s], [x - s, y + s * 0.5]], t) + P([[x - s, y + s * 0.5], [x, y + s], [x, y + s * 2], [x - s, y + s * 1.5]], l) + P([[x + s, y + s * 0.5], [x, y + s], [x, y + s * 2], [x + s, y + s * 1.5]], r);
  let o = R(0, 0, W, H, "#1b3fd0") + halo(W * 0.5, H * 0.5, H * 0.56, "#8aa0ff", 0.8, 8);
  const u = W * 0.16;
  o += iso(W * 0.3, H * 0.52, u, "#ffd23f", "#e3b920", "#b99410") + iso(W * 0.58, H * 0.46, u, "#f4f1e8", "#d4cfbf", "#a9a392") + iso(W * 0.44, H * 0.28, u, "#101828", "#0b111d", "#060a12") + iso(W * 0.72, H * 0.22, u * 0.7, "#ffd23f", "#e3b920", "#b99410") + iso(W * 0.14, H * 0.3, u * 0.6, "#f4f1e8", "#d4cfbf", "#a9a392") + iso(W * 0.44, H * 0.64, u * 0.6, "#101828", "#0b111d", "#060a12");
  return svg(W, H, "", o);
}

// ═══ Cartes et plans (310 à 313) ═══
function carte310(W, H) {
  const a = alea(310); let o = R(0, 0, W, H, "#cfd8c4");
  for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) o += R(i * (W / 9) + 8, j * (H / 7) + 8, W / 9 - 16, H / 7 - 16, a() < 0.55 ? "#e3e8df" : "#dbe2d3");
  o += PL([[-10, H * 0.7], [W * 0.3, H * 0.56], [W * 0.55, H * 0.7], [W * 0.78, H * 0.5], [W + 10, H * 0.58]], "#9fc3c7", 46);
  o += PL([[0, H * 0.12], [W * 0.4, H * 0.36], [W, H * 0.22]], "#f4f6f0", 20) + PL([[W * 0.62, 0], [W * 0.5, H * 0.4], [W * 0.3, H]], "#f4f6f0", 14);
  o += C(W * 0.16, H * 0.22, 60, "#aebd8e") + C(W * 0.84, H * 0.84, 50, "#aebd8e");
  [[0.46, 0.4, "#a8451f"], [0.2, 0.6, "#4a5a2a"], [0.76, 0.3, "#4a5a2a"]].forEach(([x, y, c]) => { o += C(W * x, H * y - 20, 18, c) + P([[W * x - 12, H * y - 12], [W * x + 12, H * y - 12], [W * x, H * y + 10]], c) + C(W * x, H * y - 20, 7, "#e3e8df"); });
  return svg(W, H, "", o);
}
function carte311(W, H) {
  const a = alea(311); let o = R(0, 0, W, H, "#ffffff");
  for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) {
    const x = i * (W / 7) + 10, y = j * (H / 5) + 10, w = W / 7 - 20, h = H / 5 - 20, q = a();
    o += PL([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], "#111111", 1.5, 0.6);
    if (q < 0.3) for (let m = 1; m < 6; m++) o += L(x, y + m * (h / 6), x + (w / 6) * m, y, "#111111", 1, 0.25);
  }
  o += R(W * 0.38, H * 0.3, W * 0.16, H * 0.2, "#111111") + L(W * 0.38, H * 0.56, W * 0.54, H * 0.56, "#d42a0b", 2) + L(W * 0.38, H * 0.53, W * 0.38, H * 0.59, "#d42a0b", 2) + L(W * 0.54, H * 0.53, W * 0.54, H * 0.59, "#d42a0b", 2);
  o += L(W * 0.58, H * 0.3, W * 0.58, H * 0.5, "#d42a0b", 2) + L(W * 0.565, H * 0.3, W * 0.595, H * 0.3, "#d42a0b", 2) + L(W * 0.565, H * 0.5, W * 0.595, H * 0.5, "#d42a0b", 2);
  o += P([[W * 0.9, H * 0.14], [W * 0.93, H * 0.24], [W * 0.9, H * 0.21], [W * 0.87, H * 0.24]], "#d42a0b") + L(W * 0.9, H * 0.08, W * 0.9, H * 0.14, "#111111", 3);
  return svg(W, H, "", o);
}
function plan312(W, H) {
  let o = R(0, 0, W, H, "#f0e6d4"); const m = Math.min(W, H) * 0.06, x0 = W * 0.05, y0 = H * 0.08, w = W * 0.9, h = H * 0.84;
  o += R(x0, y0, w, h, "#faf6ee");
  const wall = (x1, y1, x2, y2) => L(x1, y1, x2, y2, "#2b1d14", m * 0.5);
  [[x0, y0, x0 + w, y0], [x0 + w, y0, x0 + w, y0 + h], [x0 + w, y0 + h, x0, y0 + h], [x0, y0 + h, x0, y0], [x0 + w * 0.36, y0, x0 + w * 0.36, y0 + h * 0.62], [x0 + w * 0.36, y0 + h * 0.62, x0 + w * 0.7, y0 + h * 0.62], [x0 + w * 0.7, y0 + h * 0.2, x0 + w * 0.7, y0 + h]].forEach((s) => (o += wall(...s)));
  o += R(x0 + w * 0.05, y0 + h * 0.12, w * 0.2, h * 0.3, "#8a3b12") + R(x0 + w * 0.07, y0 + h * 0.14, w * 0.07, h * 0.1, "#faf6ee") + R(x0 + w * 0.16, y0 + h * 0.14, w * 0.07, h * 0.1, "#faf6ee");
  o += R(x0 + w * 0.46, y0 + h * 0.1, w * 0.2, h * 0.14, "#c39a6e") + C(x0 + w * 0.52, y0 + h * 0.42, h * 0.09, "#8a3b12") + C(x0 + w * 0.6, y0 + h * 0.42, h * 0.09, "#c39a6e");
  o += R(x0 + w * 0.74, y0 + h * 0.06, w * 0.2, h * 0.12, "#d4b48e") + R(x0 + w * 0.76, y0 + h * 0.3, w * 0.16, h * 0.3, "#e4cfb1") + R(x0 + w * 0.76, y0 + h * 0.7, w * 0.16, h * 0.2, "#8a3b12");
  o += PA(`M${f(x0 + w * 0.36)} ${f(y0 + h * 0.62)} A${f(h * 0.18)} ${f(h * 0.18)} 0 0 1 ${f(x0 + w * 0.36 + h * 0.18)} ${f(y0 + h * 0.62 + h * 0.18)}`, "", "#8a3b12", 2) + R(x0 + w * 0.12, y0 + h * 0.68, w * 0.16, h * 0.2, "#d4b48e") + C(x0 + w * 0.46, y0 + h * 0.8, h * 0.07, "#c39a6e");
  return svg(W, H, "", o);
}
function carte313(W, H) {
  const a = alea(313); let o = R(0, 0, W, H, "#0b1410") + halo(W * 0.5, H * 0.5, H * 0.7, "#c8f04a", 0.5, 8);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) o += R(i * (W / 9) + 7, j * (H / 7) + 7, W / 9 - 14, H / 7 - 14, a() < 0.5 ? "#16251c" : "#112018");
  const route = [[W * 0.1, H * 0.84], [W * 0.1, H * 0.5], [W * 0.4, H * 0.5], [W * 0.4, H * 0.26], [W * 0.78, H * 0.26]];
  o += PL(route, "#c8f04a", 7, 0.95);
  route.forEach(([x, y], i) => { o += C(x, y, i === route.length - 1 ? 16 : 8, "#c8f04a") + (i === route.length - 1 ? C(x, y, 6, "#0b1410") : ""); });
  return svg(W, H, "", o);
}
// Pastille de visite : couronne de graduations autour d'un petit bâtiment (310)
function badge310() {
  let o = C(100, 100, 98, "#4a5a2a") + C(100, 100, 74, "#e3e8df");
  for (let i = 0; i < 36; i++) { const t = (i / 36) * Math.PI * 2; o += L(100 + Math.cos(t) * 82, 100 + Math.sin(t) * 82, 100 + Math.cos(t) * 92, 100 + Math.sin(t) * 92, "#e3e8df", 3); }
  return svg(200, 200, "", o + R(70, 90, 60, 50, "#1e2b22") + P([[62, 90], [100, 62], [138, 90]], "#4a5a2a") + R(92, 112, 16, 28, "#e3e8df"));
}

// ═══ Aides de mise en page communes ═══
// Bouton plein (ou contour) à angles droits, 44 px au moins, glisse au survol.
const bouton = (k, texte, url, o) => A.lien(k, texte, url, { taille: o.taille || 17, poids: "700", couleur: o.couleur, h: "58px", padH: "28px", survol: { backgroundColor: o.survolFond, color: o.survolTexte, transform: { x: 8 } }, focus: o.focus, extra: { backgroundColor: o.fond || "transparent", borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.couleur } });
// Colonne de liens avec titre (capture : titre puis liens espacés).
const colLiens = (k, titre, liste, o) => k.col([A.caps(k, titre, { couleur: o.titre, suivi: "0.16em", police: o.policeTitre }), ...liste.map(([t, u]) => A.lien(k, t, u, { taille: o.taille || 16, poids: "500", couleur: o.texte, bloc: true, h: "44px", survol: { color: o.survol, transform: { x: 6 } }, focus: o.focus }))], { gap: "2px", alignItems: "flex-start", flexGrow: 1, flexBasis: "0px", minWidth: o.min || "150px" });
// Parti pris de la capture 11 : carte d'appel sombre (illustration en haut / en bas / à droite / à gauche), fondu clair vers sombre, puis pied sombre.
function pied11(k, env, G, o) {
  const pos = o.pos || "haut", art = o.art;
  const contenu = k.col(o.contenu, { gap: "22px", alignItems: o.aligne || "center", textAlign: o.aligne === "flex-start" ? "left" : "center", paddingTop: "64px", paddingBottom: "64px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", width: "100%", ...(pos === "droite" || pos === "gauche" ? { flexGrow: 3, flexBasis: "0px", minWidth: "300px", width: undefined, justifyContent: "center" } : {}) }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px", minWidth: "0px", flexBasis: "100%", width: "100%" });
  let carte;
  if (pos === "haut") carte = k.col([art, contenu], { backgroundColor: o.carteFond, gap: "0px", width: "100%", borderRadius: "0px" });
  else if (pos === "bas") carte = k.col([contenu, art], { backgroundColor: o.carteFond, gap: "0px", width: "100%", borderRadius: "0px" });
  else { const cote = k.col([art], { flexGrow: 2, flexBasis: "0px", minWidth: "280px", justifyContent: "center", alignItems: "stretch" }, undefined, { flexBasis: "100%", minWidth: "0px" }); carte = k.row(pos === "droite" ? [contenu, cote] : [cote, contenu], { backgroundColor: o.carteFond, gap: "0px", width: "100%", alignItems: "stretch", flexWrap: "wrap", borderRadius: "0px" }); }
  const b1 = G.bande(k, [carte], { fond: o.clair, colonne: true, padV: ["72px", "56px", "32px"], padB: ["0px", "0px", "0px"], padH: ["56px", "32px", "16px"], nom: "Carte d'appel" });
  const b2 = G.bande(k, [k.col([], { height: "150px", width: "100%" }, { height: "110px" }, { height: "80px" })], { fond: o.clair, degrade: { from: o.clair, to: o.sombre, angle: 180 }, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Fondu" });
  const b3 = G.bande(k, o.pied, { fond: o.sombre, colonne: true, gap: "36px", padV: ["24px", "20px", "16px"], padB: ["28px", "24px", "20px"], padH: ["56px", "32px", "20px"], nom: "Pied" });
  return [b1, b2, b3];
}
module.exports = { pied11, bouton, colLiens, dessin, piece, sceneAffiches, sceneVignettes, sceneSynth, sceneVagues, marque302, marque303, marque304, marque305, marque306, marque307, marque308, marque309, marque310, marque311, marque312, marque313, artFaisceaux, artMotifs, artPlan, artBlocs, carte310, carte311, plan312, carte313, badge310 };
