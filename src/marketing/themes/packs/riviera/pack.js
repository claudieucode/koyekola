// Riviera — location de villas de vacances. Direction artistique : lumière blanche, eau de piscine turquoise, sable, une pointe de terre cuite ; villas, bassins et palmiers dessinés en SVG
// (reflets et ondulations animés par transform), barre transparente qui blanchit au défilement, cartes de villas pleine largeur alternées,
// fiche villa avec calendrier de disponibilités (arrivée/départ, nuits, prix indicatif) et comparateur de deux villas. Rien n'est réservé : la demande part vers le formulaire de contact.
const { sec, esc, nav } = require("../kit");

// ---------- outils de dessin ----------
const L = (a, b, t) => a + (b - a) * t;
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => "#" + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
const rng = (s) => () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const f0 = (n) => Math.round(n);

// Bassin vu de face (trapèze) : dégradé en bandes, reflets, rides et scintillements animés en CSS (transform)
function pool({ yT, yB, xlT, xrT, xlB, xrB, c1 = "#0c8ea6", c2 = "#5ed6e2", n = 14, seed = 1, gl = 12, rp = 3, rf = [] }) {
  const R = rng(seed), xl = (y) => L(xlT, xlB, (y - yT) / (yB - yT)), xr = (y) => L(xrT, xrB, (y - yT) / (yB - yT));
  let o = "";
  for (let i = 0; i < n; i++) {
    const y0 = L(yT, yB, i / n), y1 = L(yT, yB, (i + 1) / n) + 1;
    o += `<polygon points="${f0(xl(y0))},${f0(y0)} ${f0(xr(y0))},${f0(y0)} ${f0(xr(y1))},${f0(y1)} ${f0(xl(y1))},${f0(y1)}" fill="${mix(c1, c2, i / (n - 1))}"/>`;
  }
  o += `<polygon points="${xlT},${yT} ${xrT},${yT} ${f0(xr(yT + 9))},${yT + 9} ${f0(xl(yT + 9))},${yT + 9}" fill="#052f3d" opacity=".28"/>`;
  rf.forEach(([fx, fy, w], i) => { const y = L(yT, yB, fy), x = L(xl(y), xr(y), fx); o += `<polygon class="rv-rf rv-rf${(i % 2) + 1}" points="${f0(x - w)},${f0(y)} ${f0(x + w)},${f0(y)} ${f0(x + w * 0.7)},${f0(y + 26)} ${f0(x - w * 1.3)},${f0(y + 26)}" fill="#fff" opacity=".2"/>`; });
  for (let r = 0; r < rp; r++) {
    const y = L(yT, yB, (r + 1) / (rp + 1)), x = xl(y) + 22, w = xr(y) - xl(y) - 44, k = Math.max(2, Math.floor(w / 44));
    o += `<path class="rv-rp rv-rp${(r % 3) + 1}" d="M${f0(x)} ${f0(y)}q22 -7 44 0${" t44 0".repeat(k - 1)}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".4"/>`;
  }
  for (let g = 0; g < gl; g++) {
    const y = L(yT + 14, yB - 12, R()), x = L(xl(y) + 18, xr(y) - 18, R()), s = 3 + R() * 6;
    o += `<path class="rv-gl rv-gl${(g % 5) + 1}" d="M${f0(x)} ${f0(y - s)}L${f0(x + s * 0.3)} ${f0(y - s * 0.3)}L${f0(x + s)} ${f0(y)}L${f0(x + s * 0.3)} ${f0(y + s * 0.3)}L${f0(x)} ${f0(y + s)}L${f0(x - s * 0.3)} ${f0(y + s * 0.3)}L${f0(x - s)} ${f0(y)}L${f0(x - s * 0.3)} ${f0(y - s * 0.3)}Z" fill="#fff"/>`;
  }
  o += `<polygon points="${xlT},${yT} ${xrT},${yT} ${xrB},${yB} ${xlB},${yB}" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>`;
  return `<g class="rv-pool">${o}</g>`;
}

// Palmier : tronc courbe et palmes en feuilles remplies, qui se balancent
function palm(x, y, h, k = 1, cls = "rv-sw1") {
  const tx = x + k * h * 0.2, ty = y - h;
  let fr = "";
  [[-170, 0.5], [-142, 0.62], [-112, 0.56], [-78, 0.56], [-48, 0.62], [-18, 0.5], [12, 0.42], [-196, 0.42]].forEach(([a, l], i) => {
    const r = (a * Math.PI) / 180, len = h * l, ex = tx + Math.cos(r) * len, ey = ty + Math.sin(r) * len * 0.55 + len * 0.28, cx = tx + Math.cos(r) * len * 0.5, cy = ty + Math.sin(r) * len * 0.5 - len * 0.2;
    fr += `<path d="M${f0(tx)} ${f0(ty)}Q${f0(cx)} ${f0(cy - 8)} ${f0(ex)} ${f0(ey)}Q${f0(cx)} ${f0(cy + 14)} ${f0(tx)} ${f0(ty)}Z" fill="${i % 2 ? "#2f9e6a" : "#238a5a"}"/>`;
  });
  return `<g><path d="M${x - 6} ${y}Q${f0(x + k * h * 0.06)} ${f0(y - h * 0.5)} ${f0(tx - 3)} ${f0(ty)}L${f0(tx + 3)} ${f0(ty)}Q${f0(x + k * h * 0.06 + 10)} ${f0(y - h * 0.5)} ${x + 6} ${y}Z" fill="#9a7b58"/><g class="rv-sw ${cls}">${fr}<circle cx="${f0(tx)}" cy="${f0(ty + 4)}" r="5" fill="#6b5236"/></g></g>`;
}
const sun = (cx, cy, r) => `<circle class="rv-sunh" cx="${cx}" cy="${cy}" r="${f0(r * 1.9)}" fill="#fff" opacity=".28"/><circle cx="${cx}" cy="${cy}" r="${f0(r * 1.35)}" fill="#fff" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffbe6"/>`;
const cloud = (x, y, s, n) => `<g class="rv-cl rv-cl${n}" opacity=".9"><ellipse cx="${x}" cy="${y}" rx="${f0(60 * s)}" ry="${f0(14 * s)}" fill="#fff"/><ellipse cx="${f0(x + 26 * s)}" cy="${f0(y - 10 * s)}" rx="${f0(34 * s)}" ry="${f0(14 * s)}" fill="#fff"/><ellipse cx="${f0(x - 24 * s)}" cy="${f0(y - 6 * s)}" rx="${f0(28 * s)}" ry="${f0(11 * s)}" fill="#fff"/></g>`;
const bush = (x, y, w, c = "#3f9a62") => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f0(w * 0.55)}" fill="${c}"/><ellipse cx="${f0(x - w * 0.3)}" cy="${f0(y - w * 0.12)}" rx="${f0(w * 0.55)}" ry="${f0(w * 0.36)}" fill="${mix(c, "#9fe0a8", 0.35)}"/>`;
const lounger = (x, y, c = "#fff") => `<g><polygon points="${x},${y} ${x + 54},${y - 4} ${x + 66},${y - 22} ${x + 72},${y - 20} ${x + 60},${y + 2} ${x + 4},${y + 6}" fill="${c}"/><rect x="${x + 4}" y="${y + 4}" width="3" height="10" fill="#9a8a70"/><rect x="${x + 56}" y="${y}" width="3" height="14" fill="#9a8a70"/></g>`;
const sky = (c, bot) => `<rect width="100%" height="100%" fill="${c}" opacity="0"/>`;

// Grand plan d'accueil : villa moderne, terrasse, bassin en premier plan, palmiers (1440 x 610, visible de y = 150 à 760)
function heroArt() {
  let o = "";
  o += sun(1150, 215, 58) + cloud(240, 238, 1.2, 1) + cloud(820, 190, 0.9, 2) + cloud(1290, 330, 0.8, 1);
  o += `<path d="M0 360C120 330 230 318 360 342L360 420H0Z" fill="#bfe6dc"/><path d="M1000 352C1130 318 1290 322 1440 346V420H1000Z" fill="#a9dccf"/>`;
  o += `<rect y="352" width="1440" height="172" fill="#7ad4e0"/><rect y="352" width="1440" height="5" fill="#fff" opacity=".6"/><path d="M60 372h140M300 384h90M1060 370h170M1260 392h120M120 398h70" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  o += `<g class="rv-boat"><polygon points="1180,350 1180,318 1214,350" fill="#fff"/><polygon points="1174,350 1224,350 1214,358 1184,358" fill="#0d3f50"/></g>`;
  // villa
  o += `<rect x="330" y="372" width="700" height="150" fill="#fff"/><rect x="930" y="372" width="100" height="150" fill="#e4eef0"/>`;
  o += `<rect x="440" y="262" width="480" height="112" fill="#fff"/><rect x="840" y="262" width="80" height="112" fill="#e4eef0"/>`;
  o += `<rect x="408" y="248" width="544" height="16" fill="#fff"/><rect x="408" y="264" width="544" height="7" fill="#0d3f50" opacity=".16"/>`;
  o += `<rect x="304" y="366" width="752" height="14" fill="#fff"/><rect x="304" y="380" width="752" height="8" fill="#0d3f50" opacity=".14"/>`;
  [[470, 140], [640, 140], [790, 120]].forEach(([x, w]) => { o += `<rect x="${x}" y="284" width="${w}" height="76" fill="#8fd3e2"/><polygon points="${x + 14},360 ${x + 52},284 ${x + 82},284 ${x + 44},360" fill="#fff" opacity=".3"/><rect x="${x + w / 2 - 1}" y="284" width="3" height="76" fill="#fff"/>`; });
  for (let i = 0; i < 5; i++) { const x = 360 + i * 124; o += `<rect x="${x}" y="402" width="116" height="112" fill="#7fcbdc"/><polygon points="${x + 12},514 ${x + 52},402 ${x + 84},402 ${x + 44},514" fill="#fff" opacity=".28"/><rect x="${x + 57}" y="402" width="3" height="112" fill="#fff"/>`; }
  o += `<rect x="470" y="352" width="480" height="3" fill="#0d3f50" opacity=".25"/>`;
  // pergola
  o += `<rect x="1040" y="410" width="8" height="118" fill="#d9cdb4"/><rect x="1200" y="410" width="8" height="118" fill="#d9cdb4"/><rect x="1030" y="402" width="190" height="10" fill="#e9e0cc"/>`;
  for (let i = 0; i < 9; i++) o += `<rect x="${1036 + i * 21}" y="396" width="9" height="8" fill="${i === 4 ? "#c9603c" : "#fff"}"/>`;
  // terrasse
  o += `<rect x="60" y="522" width="1320" height="44" fill="#f0e6cf"/><rect x="60" y="522" width="1320" height="6" fill="#fff" opacity=".7"/><rect x="60" y="560" width="1320" height="10" fill="#d8c9a6"/>`;
  o += lounger(390, 548) + lounger(480, 548, "#fff") + `<rect x="396" y="538" width="24" height="9" fill="#c9603c" opacity=".92"/>`;
  o += `<rect x="1118" y="448" width="4" height="100" fill="#cdbf9f"/><path d="M1060 456Q1120 404 1180 456Z" fill="#fff"/><path d="M1090 440 1102 456M1120 428V456M1150 440 1138 456" stroke="#c9603c" stroke-width="5"/>`;
  o += bush(300, 526, 52) + bush(1270, 528, 46, "#348c58") + bush(1000, 530, 30, "#4aa56a");
  // bassin
  o += pool({ yT: 570, yB: 760, xlT: 240, xrT: 1200, xlB: 70, xrB: 1370, seed: 7, n: 16, gl: 22, rp: 5, rf: [[0.3, 0.12, 54], [0.55, 0.2, 80], [0.78, 0.1, 40], [0.45, 0.45, 90]] });
  o += `<rect x="560" y="574" width="320" height="18" fill="#fff" opacity=".18" class="rv-rf rv-rf1"/>`;
  // palmiers
  o += palm(150, 590, 380, 1, "rv-sw1") + palm(270, 556, 250, -1, "rv-sw2") + palm(1310, 590, 350, -1, "rv-sw2") + palm(1190, 548, 210, 1, "rv-sw1");
  return `<svg class="rv-art-svg" viewBox="0 70 1440 690" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${o}</svg>`;
}

// Quatre villas : quatre dessins (800 x 560), chacune avec son décor, son ciel (en CSS) et son bassin
const ART = {
  azur: () => sun(640, 110, 36) + cloud(160, 100, 1, 1) + cloud(470, 70, 0.7, 2) +
    `<path d="M0 232C130 206 260 214 380 232V300H0Z" fill="#bfe6dc"/><rect y="236" width="800" height="146" fill="#7ad4e0"/><rect y="236" width="800" height="4" fill="#fff" opacity=".6"/><path d="M40 262h120M540 258h150M610 284h100" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>` +
    `<rect x="130" y="260" width="450" height="120" fill="#fff"/><rect x="510" y="260" width="70" height="120" fill="#e4eef0"/><rect x="196" y="176" width="300" height="86" fill="#fff"/><rect x="436" y="176" width="60" height="86" fill="#e4eef0"/><rect x="176" y="164" width="344" height="14" fill="#fff"/><rect x="176" y="178" width="344" height="5" fill="#0d3f50" opacity=".16"/><rect x="110" y="254" width="490" height="12" fill="#fff"/>` +
    [0, 1, 2, 3].map((i) => `<rect x="${150 + i * 104}" y="282" width="96" height="88" fill="#7fcbdc"/><polygon points="${160 + i * 104},370 ${192 + i * 104},282 ${220 + i * 104},282 ${188 + i * 104},370" fill="#fff" opacity=".28"/>`).join("") +
    [0, 1, 2].map((i) => `<rect x="${214 + i * 92}" y="194" width="84" height="56" fill="#8fd3e2"/><rect x="${255 + i * 92}" y="194" width="2" height="56" fill="#fff"/>`).join("") +
    `<rect x="0" y="380" width="800" height="180" fill="#f0e6cf"/><rect x="0" y="380" width="800" height="5" fill="#fff" opacity=".7"/>` + lounger(88, 404) + bush(710, 392, 40) +
    pool({ yT: 410, yB: 548, xlT: 150, xrT: 650, xlB: 70, xrB: 740, seed: 3, n: 10, gl: 12, rp: 3, rf: [[0.3, 0.1, 40], [0.7, 0.2, 54]] }) + palm(70, 404, 240, 1, "rv-sw1") + palm(738, 400, 200, -1, "rv-sw2"),
  salina: () => sun(130, 100, 32) + cloud(560, 90, 1, 2) + cloud(300, 60, 0.7, 1) +
    `<path d="M0 260 120 170 240 236 380 150 520 238 640 180 800 262V300H0Z" fill="#a9cbc0"/><path d="M0 290 160 220 300 280 470 214 640 280 800 236V382H0Z" fill="#82b09f"/>` +
    `<rect x="170" y="250" width="460" height="132" fill="#ecdfc6"/><rect x="170" y="250" width="460" height="10" fill="#fff" opacity=".35"/><polygon points="140,254 400,150 660,254" fill="#c9603c"/><polygon points="400,150 660,254 400,254" fill="#a9492a" opacity=".5"/><rect x="520" y="156" width="26" height="54" fill="#d6c6a5"/>` +
    [0, 1, 2, 3].map((i) => `<path d="M${214 + i * 100} 360V298a22 22 0 0 1 44 0V360Z" fill="#3b7f9c"/><rect x="${222 + i * 100}" y="300" width="28" height="60" fill="#bfe8f2"/>`).join("") +
    `<path d="M377 380V312a24 24 0 0 1 46 0V380Z" fill="#7a5a3a"/>` +
    `<path d="M0 380h800v180H0z" fill="#e9dcc0"/><rect x="0" y="380" width="800" height="5" fill="#fff" opacity=".6"/>` + bush(110, 390, 54, "#4a8f5c") + bush(700, 392, 46, "#5c9a6a") + bush(240, 388, 26, "#6aa86f") +
    `<rect x="672" y="300" width="9" height="92" fill="#6d5236"/><ellipse cx="676" cy="292" rx="62" ry="22" fill="#2f7a4a"/><ellipse cx="650" cy="282" rx="36" ry="14" fill="#3c8c58"/>` +
    pool({ yT: 420, yB: 548, xlT: 240, xrT: 580, xlB: 150, xrB: 680, seed: 11, n: 10, gl: 10, rp: 3, c1: "#0a8aa0", c2: "#6fdbe4", rf: [[0.4, 0.1, 40]] }) + lounger(110, 462) + lounger(618, 482),
  cigales: () => sun(680, 96, 30) + cloud(210, 78, 0.9, 1) +
    `<path d="M0 270C140 190 330 204 470 244C590 210 700 220 800 252V382H0Z" fill="#c8b6e0"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${40 + i * 110} 330 ${200 + i * 82} 232" stroke="#8d6fb8" stroke-width="5" opacity=".6"/>`).join("") +
    `<path d="M0 316C160 290 320 300 460 326L800 312V380H0Z" fill="#a6c59a"/>` +
    `<rect x="200" y="262" width="420" height="118" fill="#e8c797"/><rect x="200" y="262" width="420" height="8" fill="#fff" opacity=".3"/><polygon points="184,266 420,214 636,266" fill="#c9603c"/><polygon points="420,214 636,266 420,266" fill="#a9492a" opacity=".5"/><rect x="560" y="218" width="22" height="40" fill="#d3b07e"/>` +
    [0, 1, 2].map((i) => `<rect x="${236 + i * 130}" y="292" width="54" height="76" fill="#fff" opacity=".9"/><rect x="${230 + i * 130}" y="288" width="16" height="84" fill="#6f8f6a"/><rect x="${280 + i * 130}" y="288" width="16" height="84" fill="#6f8f6a"/>`).join("") +
    `<ellipse cx="130" cy="296" rx="16" ry="82" fill="#2f5a45"/><ellipse cx="96" cy="320" rx="12" ry="62" fill="#3c6e55"/><ellipse cx="690" cy="300" rx="16" ry="78" fill="#2f5a45"/>` +
    `<path d="M0 380h800v180H0z" fill="#eadcc0"/><rect x="0" y="380" width="800" height="5" fill="#fff" opacity=".6"/>` + bush(150, 392, 40, "#7a6aa8") + bush(660, 394, 36, "#7a6aa8") +
    pool({ yT: 420, yB: 548, xlT: 220, xrT: 560, xlB: 120, xrB: 660, seed: 5, n: 10, gl: 10, rp: 3, c1: "#128aa0", c2: "#74dae2", rf: [[0.5, 0.15, 44]] }) + `<rect x="620" y="440" width="8" height="64" fill="#cdbf9f"/><path d="M584 448Q624 408 664 448Z" fill="#fff"/><path d="M604 438 614 448M624 428V448M644 438 634 448" stroke="#c9603c" stroke-width="4"/>`,
  alma: () => sun(120, 108, 32) + cloud(540, 96, 1, 2) +
    `<rect y="176" width="800" height="206" fill="#2c8fc0"/><rect y="176" width="800" height="5" fill="#fff" opacity=".6"/><path d="M60 214h120M400 200h160M560 246h140M200 262h100" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>` +
    `<path d="M560 296C600 260 700 230 800 224V382H560Z" fill="#e6cf9f"/><path d="M0 300C40 280 100 270 170 288V382H0Z" fill="#e6cf9f"/>` +
    `<rect x="210" y="250" width="380" height="130" fill="#fff"/><rect x="530" y="250" width="60" height="130" fill="#e4eef0"/><rect x="290" y="190" width="220" height="62" fill="#fff"/><rect x="470" y="190" width="40" height="62" fill="#e4eef0"/><rect x="198" y="244" width="404" height="9" fill="#fff"/><rect x="198" y="253" width="404" height="5" fill="#0d3f50" opacity=".14"/>` +
    [0, 1, 2].map((i) => `<path d="M${240 + i * 110} 372V312a28 28 0 0 1 56 0V372Z" fill="#bfe8f2"/><path d="M${248 + i * 110} 372V314a20 20 0 0 1 40 0V372Z" fill="#2c6fa8" opacity=".25"/>`).join("") +
    `<path d="M326 252v-18a22 22 0 0 1 44 0v18ZM410 252v-18a22 22 0 0 1 44 0v18Z" fill="#bfe8f2"/>` +
    `<path d="M0 380h800v180H0z" fill="#f2ead6"/><rect x="0" y="380" width="800" height="5" fill="#fff" opacity=".7"/>` + bush(110, 392, 38, "#6ba86c") + bush(704, 394, 32, "#8bbd6a") + `<rect x="110" y="404" width="30" height="26" fill="#c9603c"/><path d="M118 404c-6-22 0-34 12-40 6 14 2 30-4 40Z" fill="#3f9a62"/>` +
    pool({ yT: 418, yB: 548, xlT: 190, xrT: 610, xlB: 90, xrB: 710, seed: 9, n: 10, gl: 12, rp: 3, c1: "#0a86a8", c2: "#6edfe8", rf: [[0.3, 0.15, 46], [0.7, 0.3, 40]] }) + palm(740, 410, 210, -1, "rv-sw2") + lounger(70, 438),
};
const art = (k, cls = "rv-art") => `<svg class="${cls} rv-sc rv-sc--${k}" viewBox="0 0 800 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${ART[k]()}</svg>`;

// Pictogrammes (trait, 48 x 48)
const IC = {
  soleil: '<circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/>',
  vague: '<path d="M4 18c5-6 9-6 14 0s9 6 14 0 9-6 12 0M4 30c5-6 9-6 14 0s9 6 14 0 9-6 12 0M4 42c5-6 9-6 14 0s9 6 14 0 9-6 12 0"/>',
  cle: '<circle cx="15" cy="30" r="9"/><path d="M22 24 42 6M34 14l6 6M28 20l4 4"/>',
  lit: '<path d="M4 38V12M4 30h40v8M44 30v-8a6 6 0 0 0-6-6H20v14"/><circle cx="12" cy="22" r="4"/>',
  gens: '<circle cx="17" cy="16" r="7"/><circle cx="34" cy="18" r="5"/><path d="M5 40c0-9 6-14 12-14s12 5 12 14M30 30c6 0 13 3 13 10"/>',
  regle: '<rect x="4" y="14" width="40" height="20" rx="2"/><path d="M12 14v8M20 14v6M28 14v8M36 14v6"/>',
  goutte: '<path d="M24 5c8 11 13 17 13 24a13 13 0 0 1-26 0c0-7 5-13 13-24z"/><path d="M18 31a7 7 0 0 0 6 6"/>',
  pas: '<circle cx="24" cy="8" r="4"/><path d="M24 14v14l-7 14M24 28l8 14M16 22l8-4 8 6"/>',
  pin: '<path d="M24 44S9 30 9 19a15 15 0 0 1 30 0c0 11-15 25-15 25z"/><circle cx="24" cy="19" r="5"/>',
  ok: '<path d="M8 25l10 10L40 12"/>',
  fleche: '<path d="M6 24h34M28 12l12 12-12 12"/>',
  chef: '<path d="M14 30V20a8 8 0 0 1 3-15 8 8 0 0 1 14 0 8 8 0 0 1 3 15v10zM14 36h20v8H14z"/>',
  voiture: '<path d="M6 32V22l5-10h26l5 10v10zM6 32v6h8v-6M34 32v6h8v-6"/><circle cx="14" cy="26" r="2.5"/><circle cx="34" cy="26" r="2.5"/>',
  bateau: '<path d="M24 6v26M24 8l14 22H24M24 14 12 30h12M6 36l6 8h24l6-8z"/>',
  fleur: '<circle cx="24" cy="24" r="5"/><path d="M24 4c6 6 6 12 0 15-6-3-6-9 0-15zM24 44c6-6 6-12 0-15-6 3-6 9 0 15zM4 24c6-6 12-6 15 0-3 6-9 6-15 0zM44 24c-6-6-12-6-15 0 3 6 9 6 15 0z"/>',
  enfant: '<circle cx="24" cy="12" r="7"/><path d="M12 44c0-12 5-18 12-18s12 6 12 18M19 8c3-4 7-4 10 0"/>',
  telephone: '<path d="M12 6h8l3 10-5 3c3 6 7 10 13 13l3-5 10 3v8a4 4 0 0 1-4 4C22 42 6 26 6 10a4 4 0 0 1 4-4z"/>',
};
const ico = (k, cls = "rv-ico") => `<svg class="${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IC[k]}</svg>`;
const arrow = `<svg class="rv-arr" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12h16m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const wave = (cls = "") => `<div class="rv-wave ${cls}" aria-hidden="true"><svg viewBox="0 0 2880 60" preserveAspectRatio="none" focusable="false"><path d="M0 30Q360 0 720 30T1440 30T2160 30T2880 30V60H0Z"/></svg></div>`;
const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// ---------- données ----------
const DESTS = [
  { id: "cote-d-azur", name: "Côte d'Azur", place: "Var, entre Ramatuelle et Saint-Tropez", air: "Nice, 1 h 30 de route", t: 30, sea: "22 °C en juillet", best: [0, 0, 1, 2, 2, 3, 3, 3, 3, 2, 0, 0], line: "Criques de sable clair, vignes et petits ports colorés : l'été méditerranéen dans sa version la plus élégante.", tip: "Juin et septembre : la lumière est dorée, la mer déjà chaude et les plages sont calmes." },
  { id: "corse", name: "Corse", place: "Sud de l'île, autour de Porto-Vecchio", air: "Figari, 35 minutes", t: 29, sea: "24 °C en août", best: [0, 0, 1, 2, 2, 3, 3, 3, 3, 2, 1, 0], line: "Eau d'émeraude, maquis parfumé et plages de sable blanc : la mer la plus claire de la Méditerranée.", tip: "Prévoyez une voiture : les plus belles criques se rejoignent par des pistes en lacets." },
  { id: "provence", name: "Provence", place: "Luberon, entre Gordes et Lourmarin", air: "Marseille, 1 h 15", t: 32, sea: "piscine chauffée dès mai", best: [0, 0, 1, 2, 3, 3, 3, 2, 3, 2, 1, 0], line: "Champs de lavande, villages perchés, marchés et tables sous les platanes : le slow living à la française.", tip: "Fin juin : la lavande est en fleur et les soirées s'étirent jusqu'à 22 h." },
  { id: "algarve", name: "Algarve", place: "Côte ouest, près de Lagos", air: "Faro, 50 minutes", t: 28, sea: "20 °C en août", best: [1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 1], line: "Falaises ocre, plages dorées et océan vivifiant : le soleil du Portugal presque toute l'année.", tip: "L'arrière-saison est la plus douce : octobre y garde encore des airs d'été." },
];
const DEST = Object.fromEntries(DESTS.map((d) => [d.id, d]));
const VILLAS = [
  { id: "azur", name: "Villa Azur", dest: "cote-d-azur", place: "Ramatuelle", ch: 5, sdb: 5, pers: 10, m2: 280, pool: "16 m, à débordement, chauffée", beach: 1.2, beachTxt: "plage à 1,2 km", base: 640, clean: 220, seed: 3, tag: "Vue mer et piscine à débordement",
    desc: "Une maison blanche en gradins face à la baie : cinq chambres ouvertes sur la terrasse, une cuisine d'été et un bassin à débordement qui se fond dans l'horizon.",
    long: "Le matin, la terrasse haute attrape la première lumière. À midi, tout se passe autour du bassin : transats, parasols en lin, cuisine d'été et grande table sous la pergola. Le soir, la baie s'allume et le jardin de palmiers prend le relais.",
    equip: [["goutte", "Piscine chauffée de 16 m"], ["soleil", "Terrasse plein sud"], ["chef", "Cuisine d'été équipée"], ["voiture", "Parking pour trois voitures"], ["vague", "Climatisation, wifi fibré"], ["fleur", "Jardin de palmiers"]],
    rooms: ["Suite parentale avec dressing et terrasse", "Quatre chambres doubles, dont deux avec vue mer", "Chambre d'enfants avec lits superposés", "Cinq salles de bains, dont deux de plain-pied sur le jardin"] },
  { id: "salina", name: "Casa Salina", dest: "corse", place: "Porto-Vecchio", ch: 4, sdb: 4, pers: 8, m2: 210, pool: "12 m, eau salée", beach: 0.4, beachTxt: "plage à 400 m", base: 520, clean: 180, seed: 5, tag: "Pieds dans le maquis, plage à pied",
    desc: "Une bergerie de pierre et de tuiles rondes cachée dans le maquis, avec bassin à l'eau salée et une plage de sable blanc à quatre cents mètres.",
    long: "Murs de pierre, volets bleus et sol de terre cuite : la maison garde la fraîcheur même au plus fort de l'été. Un sentier descend jusqu'à une plage presque privée ; au retour, l'eau salée du bassin rince le sable.",
    equip: [["goutte", "Bassin à l'eau salée de 12 m"], ["pas", "Plage à 400 m à pied"], ["chef", "Barbecue et four à pizza"], ["voiture", "Parking ombragé"], ["vague", "Climatisation, wifi"], ["fleur", "Maquis et pins parasols"]],
    rooms: ["Chambre parentale voûtée avec salle de bains", "Deux chambres doubles en rez-de-jardin", "Une chambre avec quatre lits simples", "Quatre salles d'eau, douche extérieure"] },
  { id: "cigales", name: "Mas des Cigales", dest: "provence", place: "Gordes", ch: 3, sdb: 3, pers: 6, m2: 190, pool: "10 m, chauffée dès mai", beach: 0, beachTxt: "village à 5 min", base: 380, clean: 150, seed: 8, tag: "Lavande, platanes et grande table",
    desc: "Un mas ocre entouré de lavande et de cyprès, trois chambres calmes, une cuisine pour les grandes tablées et un bassin chauffé dès le mois de mai.",
    long: "On y vient pour ralentir : petit déjeuner à l'ombre du platane, marché du village à cinq minutes, sieste au bord du bassin et dîner dehors jusqu'à la nuit. Les cigales, elles, font la bande-son.",
    equip: [["goutte", "Bassin chauffé de 10 m"], ["chef", "Grande cuisine et table de 10"], ["fleur", "Lavandes et cyprès"], ["voiture", "Parking dans la cour"], ["vague", "Fraîcheur naturelle, wifi"], ["soleil", "Terrasse ombragée"]],
    rooms: ["Chambre parentale avec salle de bains en pierre", "Deux chambres doubles, lits en 160 ou 2 × 90", "Salon de lecture avec canapé-lit d'appoint", "Trois salles de bains"] },
  { id: "alma", name: "Villa Alma", dest: "algarve", place: "Lagos", ch: 6, sdb: 6, pers: 12, m2: 340, pool: "14 m, ouverte sur l'océan", beach: 0.5, beachTxt: "plage à 500 m", base: 590, clean: 250, seed: 12, tag: "Cubes blancs au-dessus de l'océan",
    desc: "Des volumes blancs et des arches face à l'Atlantique : six chambres, trois terrasses et un bassin qui regarde les falaises.",
    long: "La villa suit la falaise en trois cubes reliés par des patios. Les arches cadrent l'océan, les terrasses se partagent la lumière de la journée et un escalier mène aux criques en dix minutes.",
    equip: [["goutte", "Bassin de 14 m sur l'océan"], ["soleil", "Trois terrasses"], ["pas", "Criques à 10 min à pied"], ["voiture", "Garage pour deux voitures"], ["vague", "Climatisation, wifi fibré"], ["chef", "Cuisine ouverte et cave"]],
    rooms: ["Suite principale avec terrasse privée", "Quatre chambres doubles autour du patio", "Une chambre pour enfants, quatre lits", "Six salles de bains, hammam"] },
];
const FAC = [0.75, 0.75, 0.8, 0.9, 1, 1.2, 1.55, 1.6, 1.2, 0.95, 0.8, 0.9];
const MONTHS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

// ---------- en-tête et pied ----------
const logoMark = `<svg class="rv-lm" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="19" fill="#0a7a91"/><circle cx="20" cy="14" r="6" fill="#fff"/><path d="M4 26q4-4 8 0t8 0 8 0 8 0M6 32q3.5-3.5 7 0t7 0 7 0 7 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const header = (c) => `<header class="rv-head pk-bleed" data-head><div class="rv-bar">
  <a class="rv-logo" href="/" aria-label="Riviera — accueil">${logoMark}<span class="rv-logo-t"><b>Riviera</b><small>Villas · slow living</small></span></a>
  <div class="rv-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <a class="rv-cta" href="/villas">Voir les villas</a>
  <details class="rv-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="rv-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="rv-cta" href="/villas">Voir les villas</a></div></details>
  </div></header>`;

const footer = (c) => `<footer class="rv-foot pk-bleed">${wave("rv-wave--foot")}<div class="rv-wrap rv-foot-in">
  <div class="rv-foot-brand"><div class="rv-foot-logo">Riviera</div><p>Quatre villas choisies entre Méditerranée et Atlantique, avec une conciergerie qui s'occupe de tout, sauf de vous détendre.</p><address>Agence de Ramatuelle<br>Place des Lices, 83350 Ramatuelle<br><a href="mailto:bonjour@riviera.example">bonjour@riviera.example</a></address></div>
  <div><h2 class="rv-foot-h">Séjourner</h2>${nav(c.menu.slice(0, 5), "rv-fl")}</div>
  <div><h2 class="rv-foot-h">Nos villas</h2>${VILLAS.map((v) => `<a class="rv-fl" href="/villa#${v.id}">${esc(v.name)}</a>`).join("")}</div>
  <div><h2 class="rv-foot-h">Nous écrire</h2><a class="rv-fl" href="/contact">Formulaire de contact</a><a class="rv-fl" href="/recherche">Recherche</a><a class="rv-fl" href="/comparer">Comparer deux villas</a></div></div>
  <p class="rv-legal">© Riviera Villas — site de démonstration. Villas, tarifs et disponibilités fictifs : aucune réservation n'est enregistrée.</p></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="rv-ph pk-bleed rv-s-mist"><div class="rv-ph-art" aria-hidden="true"><svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" focusable="false">${sun(1000, 80, 30)}${cloud(260, 80, 0.9, 1)}${cloud(720, 56, 0.7, 2)}${palm(1190, 236, 200, -1, "rv-sw1")}${palm(1090, 236, 140, 1, "rv-sw2")}</svg></div>
  <div class="rv-wrap rv-ph-in"><p class="rv-kicker" data-reveal>${esc(kicker)}</p><div class="rv-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="rv-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${wave("rv-wave--ph")}</section>`);

// ---------- briques ----------
const spec = (v) => `<ul class="rv-spec"><li>${ico("lit")}<span><b>${v.ch}</b> chambres</span></li><li>${ico("gens")}<span><b>${v.pers}</b> voyageurs</span></li><li>${ico("regle")}<span><b>${v.m2}</b> m²</span></li><li>${ico("goutte")}<span>Piscine privée</span></li></ul>`;
const villaCard = (v, i) => `<article class="rv-vc${i % 2 ? " rv-vc--r" : ""}" data-dest="${v.dest}" data-reveal>
  <a class="rv-vc-art" href="/villa#${v.id}" aria-label="Voir la fiche : ${esc(v.name)}">${art(v.id)}<span class="rv-vc-badge">${esc(DEST[v.dest].name)}</span></a>
  <div class="rv-vc-body"><p class="rv-kicker">${esc(v.place)} · ${esc(DEST[v.dest].name)}</p><h3 class="rv-h3">${esc(v.name)}</h3><p class="rv-vc-tag">${esc(v.tag)}</p><p>${esc(v.desc)}</p>${spec(v)}
  <div class="rv-vc-foot"><p class="rv-from">À partir de <b>${num(v.base)} €</b><small> / nuit · indicatif</small></p><a class="rv-btn rv-btn--deep" href="/villa#${v.id}">Fiche et disponibilités ${arrow}</a></div></div></article>`;

const seasonStrip = (best) => `<ol class="rv-season" aria-label="Meilleurs mois pour partir">${best.map((b, i) => `<li class="rv-sn rv-sn--${b}"><span>${MONTHS[i].slice(0, 1)}</span><i class="rv-sr">${MONTHS[i]} : ${["calme", "doux", "chaud", "idéal"][b]}</i></li>`).join("")}</ol>`;

const ctaBand = (t, sub, label = "Nous écrire", url = "/contact") => sec(`<section class="rv-cta-band pk-bleed rv-s-deep">${wave("rv-wave--top")}<div class="rv-wrap rv-cta-in"><div><div class="rv-h2 rv-h2--l" role="heading" aria-level="2" data-reveal>${t}</div><p class="rv-cta-p" data-reveal>${esc(sub)}</p></div><a class="rv-btn rv-btn--white" href="${url}" data-reveal>${esc(label)} ${arrow}</a></div></section>`);

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="rv-hero pk-bleed"><div class="rv-wrap rv-hero-in"><div class="rv-hero-copy"><p class="rv-kicker" data-reveal>Locations de villas · Côte d'Azur, Corse, Provence, Algarve</p>
    <div class="rv-h1 rv-h1--xl" role="heading" aria-level="1" data-reveal>La lumière,<br>l'eau et le temps.</div>
    <p class="rv-lead" data-reveal>Quatre villas avec piscine privée, pensées pour ralentir. On s'occupe des clés, du linge et des courses ; vous gardez la sieste.</p>
    <div class="rv-actions" data-reveal><a class="rv-btn rv-btn--deep" href="/villas">Voir les villas ${arrow}</a><a class="rv-btn rv-btn--ghost" href="/villa#azur">Vérifier des dates</a></div></div></div>
    <div class="rv-hero-art">${heroArt()}</div></section>`),
  sec(`<section class="rv-facts pk-bleed rv-s-white"><div class="rv-wrap"><ul class="rv-facts-ul"><li data-reveal>${ico("goutte", "rv-ico rv-ico--l")}<h2 class="rv-fh">Un bassin pour vous seuls</h2><p>Chaque villa a sa piscine privée, nettoyée avant votre arrivée et entretenue pendant le séjour.</p></li><li data-reveal>${ico("cle", "rv-ico rv-ico--l")}<h2 class="rv-fh">Arrivée sans souci</h2><p>Une personne vous attend, la maison est prête, le frigo rempli si vous l'avez demandé.</p></li><li data-reveal>${ico("soleil", "rv-ico rv-ico--l")}<h2 class="rv-fh">Le rythme des vacances</h2><p>Séjours à partir de trois nuits, départs tardifs possibles et conseils d'adresses locales.</p></li></ul></div></section>`),
  sec(`<section class="rv-villas pk-bleed rv-s-sand">${wave("rv-wave--sand")}<div class="rv-wrap"><div class="rv-sechead"><div><p class="rv-kicker" data-reveal>Nos villas</p><h2 class="rv-h2" data-reveal>Choisissez votre adresse.</h2></div><a class="rv-more" href="/villas" data-reveal>Les quatre villas ${arrow}</a></div></div>
    <div class="rv-vlist">${VILLAS.slice(0, 2).map(villaCard).join("")}</div></section>`),
  sec(`<section class="rv-day pk-bleed rv-s-white"><div class="rv-wrap"><p class="rv-kicker" data-reveal>Une journée à la villa</p><h2 class="rv-h2" data-reveal>Le soleil fait l'emploi du temps.</h2>
    <div class="rv-sunpath" aria-hidden="true"><svg viewBox="0 0 1000 200" preserveAspectRatio="none" focusable="false"><path d="M20 190Q500 -120 980 190" fill="none" stroke="#0a7a91" stroke-width="2" opacity=".4" stroke-linecap="round"/><circle class="rv-sunmove" cx="500" cy="38" r="16" fill="#f5b83d"/></svg></div>
    <ol class="rv-day-ol"><li data-reveal><time>8 h</time><h3>Petit déjeuner sur la terrasse</h3><p>Pain, fruits et café, pieds nus sur les dalles encore fraîches.</p></li><li data-reveal><time>13 h</time><h3>Déjeuner au bord de l'eau</h3><p>Une grande table à l'ombre, des salades, des plongeons entre deux plats.</p></li><li data-reveal><time>17 h</time><h3>L'heure dorée</h3><p>Marche vers la plage, bain tardif, la lumière devient miel.</p></li><li data-reveal><time>21 h</time><h3>Dîner dehors</h3><p>Un chef à domicile si vous le souhaitez, des lanternes et la piscine éclairée.</p></li></ol></div></section>`),
  sec(`<section class="rv-dests pk-bleed rv-s-mist"><div class="rv-wrap"><div class="rv-sechead"><div><p class="rv-kicker" data-reveal>Destinations</p><h2 class="rv-h2" data-reveal>Quatre façons de partir.</h2></div><a class="rv-more" href="/destinations" data-reveal>Toutes les destinations ${arrow}</a></div>
    <ul class="rv-dgrid">${DESTS.map((d, i) => `<li class="rv-dc rv-dc--${i}" data-reveal><a href="/destinations#${d.id}"><span class="rv-dc-n">0${i + 1}</span><h3>${esc(d.name)}</h3><p>${esc(d.place)}</p><span class="rv-dc-t">${d.t} °C en été</span>${seasonStrip(d.best)}</a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="rv-conc pk-bleed rv-s-white"><div class="rv-wrap rv-conc-in"><div data-reveal><p class="rv-kicker">Conciergerie</p><h2 class="rv-h2">Un seul interlocuteur, avant, pendant, après.</h2><p class="rv-lead">Transferts, courses, chef, bateau, baby-sitting : demandez, nous organisons. La plupart des services se règlent sur place, sur devis.</p><a class="rv-btn rv-btn--deep" href="/conciergerie">Les services ${arrow}</a></div>
    <ul class="rv-conc-ul">${[["chef", "Chef à domicile"], ["voiture", "Transferts aéroport"], ["bateau", "Sortie en mer"], ["enfant", "Baby-sitting"]].map(([k, t]) => `<li data-reveal>${ico(k, "rv-ico rv-ico--l")}<span>${t}</span></li>`).join("")}</ul></div></section>`),
  ctaBand("Une semaine, un bassin, aucune obligation.", "Dites-nous vos dates et le nombre de voyageurs : nous vous proposons la villa qui convient."),
  sec(footer(c))];

// ---------- nos villas ----------
const villas = (c) => [sec(header(c)), pagehead("Nos villas", "Quatre adresses,<br>une même lumière", "Chaque villa a sa piscine, son décor et son rythme. Filtrez par destination, comparez, puis vérifiez les dates sur la fiche."),
  sec(`<section class="rv-list pk-bleed rv-s-white"><div class="rv-wrap rv-list-top"><div class="rv-chips" role="navigation" aria-label="Filtrer par destination" data-filter><a href="#toutes" data-f="toutes" class="is-on">Toutes</a>${DESTS.map((d) => `<a href="#${d.id}" data-f="${d.id}">${esc(d.name)}</a>`).join("")}</div><p class="rv-count" aria-live="polite"><b data-count-n>4</b> villas affichées</p></div></section>`),
  ...VILLAS.map((v, i) => sec(`<section class="rv-vcs pk-bleed rv-s-white">${villaCard(v, i)}</section>`)),
  sec(`<section class="rv-pair pk-bleed rv-s-sand"><div class="rv-wrap rv-pair-in"><div data-reveal><p class="rv-kicker">Indécis ?</p><h2 class="rv-h2">Comparez deux villas côte à côte.</h2><p class="rv-lead">Chambres, bassin, plage, prix indicatif : choisissez deux villas et lisez les différences d'un coup d'œil.</p></div><a class="rv-btn rv-btn--deep" href="/comparer" data-reveal>Ouvrir le comparateur ${arrow}</a></div></section>`),
  sec(footer(c))];

// ---------- fiche villa ----------
const panel = (v, i) => `<article class="rv-vp" data-villa="${v.id}" data-name="${esc(v.name)}" data-base="${v.base}" data-seed="${v.seed}" data-max="${v.pers}" data-clean="${v.clean}"${i ? " hidden" : ""}>
  <div class="rv-vp-art">${art(v.id, "rv-art rv-art--big")}</div>
  <div class="rv-wrap rv-vp-in"><div class="rv-vp-main"><p class="rv-kicker">${esc(v.place)} · ${esc(DEST[v.dest].name)}</p><h2 class="rv-h2">${esc(v.name)}</h2><p class="rv-lead">${esc(v.desc)}</p><p>${esc(v.long)}</p>
    <h3 class="rv-h3s">Équipements</h3><ul class="rv-equip">${v.equip.map(([k, t]) => `<li>${ico(k)}<span>${esc(t)}</span></li>`).join("")}</ul></div>
  <aside class="rv-vp-side"><dl class="rv-dl"><div><dt>Chambres</dt><dd>${v.ch}</dd></div><div><dt>Salles de bains</dt><dd>${v.sdb}</dd></div><div><dt>Voyageurs</dt><dd>jusqu'à ${v.pers}</dd></div><div><dt>Surface</dt><dd>${v.m2} m²</dd></div><div><dt>Piscine</dt><dd>${esc(v.pool)}</dd></div><div><dt>Accès</dt><dd>${esc(v.beachTxt)}</dd></div></dl>
    <h3 class="rv-h3s">Les chambres</h3><ul class="rv-rooms">${v.rooms.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></aside></div></article>`;

const villa = (c) => [sec(header(c)), pagehead("Fiche villa", "Votre villa,<br>vos dates", "Choisissez une villa, parcourez le calendrier et sélectionnez arrivée et départ : le prix indicatif se calcule tout seul."),
  sec(`<section class="rv-vsw-s pk-bleed rv-s-white"><div class="rv-wrap"><div class="rv-chips rv-vsw" role="navigation" aria-label="Choisir une villa" data-vsw>${VILLAS.map((v, i) => `<a href="#${v.id}" data-v="${v.id}"${i ? "" : ' class="is-on"'}>${esc(v.name)}</a>`).join("")}</div></div></section>`),
  ...VILLAS.map((v, i) => sec(`<section class="rv-vps pk-bleed rv-s-white">${panel(v, i)}</section>`)),
  sec(`<section class="rv-book pk-bleed rv-s-mist" data-book>${wave("rv-wave--mist")}<div class="rv-wrap"><p class="rv-kicker">Disponibilités</p><h2 class="rv-h2">Vérifier des dates pour <span data-bk-name>Villa Azur</span></h2>
    <div class="rv-book-grid"><div class="rv-cal" data-cal><div class="rv-cal-head"><a class="rv-cal-nav" href="#precedent" data-nav="-1" aria-label="Mois précédent">${arrow}</a><p class="rv-cal-title" data-cal-title aria-live="polite">Calendrier</p><a class="rv-cal-nav rv-cal-nav--n" href="#suivant" data-nav="1" aria-label="Mois suivant">${arrow}</a></div>
      <div class="rv-cal-body" data-cal-body><p class="rv-fine">Le calendrier interactif demande JavaScript. Sans lui, écrivez-nous : nous vous donnons les dates libres.</p></div>
      <ul class="rv-legend"><li><i class="rv-lg rv-lg--free"></i>Libre</li><li><i class="rv-lg rv-lg--busy"></i>Réservé</li><li><i class="rv-lg rv-lg--sel"></i>Votre séjour</li></ul></div>
      <aside class="rv-sum" aria-label="Récapitulatif du séjour"><h3 class="rv-h3s">Votre séjour</h3><dl class="rv-sum-dl"><div><dt>Arrivée</dt><dd data-s-in>à choisir</dd></div><div><dt>Départ</dt><dd data-s-out>à choisir</dd></div><div><dt>Nuits</dt><dd data-s-n>—</dd></div>
        <div><dt>Voyageurs</dt><dd class="rv-guests"><a class="rv-step" href="#moins" data-guests="-1" aria-label="Un voyageur de moins">−</a><span data-s-g aria-live="polite">2</span><a class="rv-step" href="#plus" data-guests="1" aria-label="Un voyageur de plus">+</a></dd></div></dl>
        <p class="rv-sum-tot"><small>Budget indicatif, ménage inclus</small><b data-s-tot>—</b></p>
        <p class="rv-msg" data-msg aria-live="polite">Choisissez votre jour d'arrivée, puis votre jour de départ (3 nuits minimum).</p>
        <a class="rv-btn rv-btn--deep rv-btn--block" href="/contact" data-send aria-disabled="true">Envoyer ma demande ${arrow}</a>
        <p class="rv-fine">Démonstration : aucune réservation n'est enregistrée. La demande part vers le formulaire de contact, avec ce résumé déjà recopié dans le message.</p></aside></div></div></section>`),
  sec(`<section class="rv-know pk-bleed rv-s-white"><div class="rv-wrap"><h2 class="rv-h2">Bon à savoir</h2><div class="rv-acc">${[["Arrivée et départ", "Arrivée à partir de 16 h, départ avant 10 h. Une arrivée tardive se prépare avec la conciergerie."], ["Comment est calculé le prix ?", "Le prix indicatif additionne chaque nuit selon la saison (basse, moyenne ou haute) et un forfait ménage de fin de séjour. Le tarif définitif vous est confirmé par écrit."], ["Animaux, enfants, fêtes", "Les enfants sont les bienvenus (lit bébé sur demande). Les animaux se discutent selon la villa. Les fêtes ne sont pas autorisées."], ["Et si je change d'avis ?", "Dans cette démonstration, rien n'est réservé : la demande n'engage personne. Dans la vraie vie, les conditions d'annulation figurent sur le devis."]].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
    <p class="rv-center"><a class="rv-more" href="/comparer">Comparer avec une autre villa ${arrow}</a></p></div></section>`),
  sec(footer(c))];

// ---------- comparateur ----------
const rowsCmp = [
  ["Destination", (v) => DEST[v.dest].name, null], ["Lieu", (v) => v.place, null],
  ["Chambres", (v) => v.ch, "max", "ch"], ["Voyageurs", (v) => v.pers, "max", "pers"], ["Salles de bains", (v) => v.sdb, "max"], ["Surface", (v) => `${v.m2} m²`, "max", null, (v) => v.m2],
  ["Piscine", (v) => v.pool, null], ["Distance de la plage", (v) => v.beachTxt, "min", "plage", (v) => v.beach || 9],
  ["Prix de base par nuit", (v) => `${num(v.base)} €`, "min", "prix", (v) => v.base], ["Haute saison (juillet-août)", (v) => `${num(Math.round(v.base * 1.6))} €`, "min", null, (v) => v.base],
  ["Ménage de fin de séjour", (v) => `${num(v.clean)} €`, "min", null, (v) => v.clean],
];
const comparer = (c) => [sec(header(c)), pagehead("Comparateur", "Deux villas,<br>côte à côte", "Choisissez deux villas : le tableau ne garde que les deux, et surligne le meilleur de chaque ligne."),
  sec(`<section class="rv-cmp pk-bleed rv-s-white" data-cmp><div class="rv-wrap"><div class="rv-picks"><div class="rv-pick" data-slot="0" role="navigation" aria-label="Première villa"><p class="rv-pick-t">Première villa</p><div class="rv-chips">${VILLAS.map((v) => `<a href="#a-${v.id}" data-pick="${v.id}">${esc(v.name)}</a>`).join("")}</div></div>
    <div class="rv-pick" data-slot="1" role="navigation" aria-label="Deuxième villa"><p class="rv-pick-t">Deuxième villa</p><div class="rv-chips">${VILLAS.map((v) => `<a href="#b-${v.id}" data-pick="${v.id}">${esc(v.name)}</a>`).join("")}</div></div></div>
    <p class="rv-verdict" data-verdict aria-live="polite"></p>
    <table class="rv-tbl"><caption class="rv-sr">Comparaison des villas</caption><thead><tr><th scope="col"><span class="rv-sr">Critère</span></th>${VILLAS.map((v) => `<th scope="col" data-c="${v.id}"><span class="rv-th-art rv-th--${v.id}"></span>${esc(v.name)}</th>`).join("")}</tr></thead>
    <tbody>${rowsCmp.map(([lab, fn, best, key, nf]) => `<tr${best ? ` data-best="${best}"` : ""}${key ? ` data-k="${key}"` : ""}><th scope="row">${lab}</th>${VILLAS.map((v) => `<td data-c="${v.id}"${best ? ` data-n="${nf ? nf(v) : fn(v)}"` : ""}>${esc(fn(v))}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <p class="rv-fine">Prix indicatifs, hors services de conciergerie. Démonstration : rien n'est réservé.</p>
    <div class="rv-actions"><a class="rv-btn rv-btn--deep" href="/villa#azur">Voir les disponibilités ${arrow}</a><a class="rv-btn rv-btn--ghost" href="/contact">Demander un conseil</a></div></div></section>`),
  sec(footer(c))];

// ---------- destinations ----------
const destinations = (c) => [sec(header(c)), pagehead("Destinations", "Où poser<br>vos valises ?", "Quatre régions, quatre climats : repérez les meilleurs mois pour partir et la villa qui s'y trouve."),
  ...DESTS.map((d, i) => { const v = VILLAS.find((x) => x.dest === d.id); return sec(`<section class="rv-dest pk-bleed ${i % 2 ? "rv-s-sand" : "rv-s-white"}" data-anchor="${d.id}"><div class="rv-wrap rv-dest-in${i % 2 ? " rv-dest-in--r" : ""}">
    <div class="rv-dest-art" data-reveal><a href="/villa#${v.id}" aria-label="Voir ${esc(v.name)}">${art(v.id)}</a><span class="rv-dest-num" aria-hidden="true">0${i + 1}</span></div>
    <div class="rv-dest-t" data-reveal><p class="rv-kicker">${esc(d.place)}</p><h2 class="rv-h2">${esc(d.name)}</h2><p class="rv-lead">${esc(d.line)}</p>
    <h3 class="rv-h3s">Les meilleurs mois</h3>${seasonStrip(d.best)}<p class="rv-season-leg"><i class="rv-lg rv-sn--0"></i>calme<i class="rv-lg rv-sn--1"></i>doux<i class="rv-lg rv-sn--2"></i>chaud<i class="rv-lg rv-sn--3"></i>idéal</p>
    <dl class="rv-dl rv-dl--c"><div><dt>Chaleur d'été</dt><dd>${d.t} °C en moyenne</dd></div><div><dt>Eau</dt><dd>${esc(d.sea)}</dd></div><div><dt>Aéroport</dt><dd>${esc(d.air)}</dd></div></dl>
    <p class="rv-tip">${ico("soleil")}<span>${esc(d.tip)}</span></p><a class="rv-btn rv-btn--deep" href="/villa#${v.id}">${esc(v.name)} ${arrow}</a></div></div></section>`); }),
  ctaBand("Pas sûr de la destination ?", "Dites-nous qui voyage, quand, et ce que vous aimez : nous vous conseillons."),
  sec(footer(c))];

// ---------- conciergerie ----------
const conciergerie = (c) => [sec(header(c)), pagehead("Conciergerie", "Tout est prêt,<br>vous n'avez qu'à venir", "Une équipe locale, avant, pendant et après votre séjour. Les services sont proposés sur devis ; seul le ménage de fin de séjour est toujours compris."),
  sec(`<section class="rv-steps pk-bleed rv-s-white"><div class="rv-wrap"><ol class="rv-steps-ol">${[
    ["Avant", "cle", ["Conseil sur la villa et les dates", "Courses déposées avant votre arrivée", "Transfert depuis l'aéroport ou la gare", "Lits faits, piscine nettoyée, climatisation allumée"]],
    ["Pendant", "soleil", ["Un numéro à appeler, de 8 h à 22 h", "Chef à domicile, baby-sitting, massages", "Sorties en bateau, locations de vélos", "Entretien de la piscine et du jardin"]],
    ["Après", "vague", ["Ménage de fin de séjour inclus", "Linge de maison remplacé", "Objets oubliés renvoyés chez vous", "Un mot pour préparer le prochain séjour"]]].map(([t, k, l], i) => `<li class="rv-step-c" data-reveal><span class="rv-step-n">${i + 1}</span>${ico(k, "rv-ico rv-ico--l")}<h2 class="rv-h3">${t}</h2><ul>${l.map((x) => `<li>${ico("ok", "rv-ck")}<span>${esc(x)}</span></li>`).join("")}</ul></li>`).join("")}</ol></div></section>`),
  sec(`<section class="rv-svc pk-bleed rv-s-sand">${wave("rv-wave--sand")}<div class="rv-wrap"><h2 class="rv-h2" data-reveal>Inclus, ou sur demande.</h2>
    <table class="rv-tbl rv-tbl--svc" data-reveal><caption class="rv-sr">Services de conciergerie</caption><thead><tr><th scope="col">Service</th><th scope="col">Statut</th><th scope="col">Délai conseillé</th></tr></thead><tbody>
    ${[["Accueil et remise des clés", "Inclus", "—"], ["Ménage de fin de séjour", "Inclus", "—"], ["Courses avant arrivée", "Sur devis", "48 h"], ["Chef à domicile", "Sur devis", "7 jours"], ["Transferts aéroport", "Sur devis", "72 h"], ["Sortie en bateau", "Sur devis", "7 jours"], ["Baby-sitting", "Sur devis", "72 h"]].map(([s, st, d]) => `<tr><th scope="row">${s}</th><td data-l="Statut"><span class="rv-pill${st === "Inclus" ? " rv-pill--in" : ""}">${st}</span></td><td data-l="Délai">${d}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="rv-faq pk-bleed rv-s-white"><div class="rv-wrap rv-faq-in"><div><p class="rv-kicker">Questions fréquentes</p><h2 class="rv-h2">Avant de partir.</h2></div><div class="rv-acc">${[["Qui est présent sur place ?", "Une personne vous accueille à l'arrivée, puis l'équipe reste joignable par téléphone chaque jour. Elle intervient pour la piscine, le jardin et les imprévus."], ["Peut-on arriver tard ?", "Oui : prévenez-nous, une personne vous attend, même en soirée."], ["Les services ont-ils un prix fixe ?", "Non, chaque service se règle sur devis, avant votre arrivée. Rien n'est facturé dans cette démonstration."], ["Parlez-vous plusieurs langues ?", "L'équipe parle français, anglais et la langue de la région."]].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div></section>`),
  ctaBand("Un besoin particulier ?", "Anniversaire, séjour en famille, télétravail : écrivez-nous, nous préparons la villa en conséquence."),
  sec(footer(c))];

// ---------- contact / recherche / 404 ----------
const contact = (c) => [sec(header(c)), pagehead("Parlons de vos vacances", "Contact", "Dates, nombre de voyageurs, envies : écrivez-nous, nous répondons sous un jour ouvré."),
  { type: "form", heading: "Votre demande de séjour", intro: "Indiquez la villa, vos dates et le nombre de voyageurs (ou collez le résumé du calendrier). Démonstration : rien n'est réservé." },
  sec(`<section class="rv-visit pk-bleed rv-s-sand"><div class="rv-wrap rv-visit-in"><div data-reveal><p class="rv-kicker">L'agence</p><h2 class="rv-h2">Place des Lices, Ramatuelle.</h2><address class="rv-addr">Riviera Villas<br>Place des Lices, 83350 Ramatuelle<br><a href="mailto:bonjour@riviera.example">bonjour@riviera.example</a></address></div>
    <ul class="rv-hours" data-reveal><li><b>Lundi – vendredi</b><span>9 h – 19 h</span></li><li><b>Samedi</b><span>10 h – 17 h</span></li><li><b>Dimanche</b><span>Fermé</span></li></ul></div></section>`),
  { type: "layout", children: [{ type: "map", props: { address: "Place des Lices, 83350 Ramatuelle", zoom: 14, height: 360 } }] },
  sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une villa, une envie ?", "Une destination, un service, un équipement : tapez un mot."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="rv-404 pk-bleed rv-s-mist"><div class="rv-404-art" aria-hidden="true"><svg viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax meet" focusable="false">${sun(300, 90, 40)}${cloud(900, 80, 1, 1)}${pool({ yT: 190, yB: 300, xlT: 420, xrT: 1020, xlB: 300, xrB: 1140, seed: 4, n: 8, gl: 10, rp: 2 })}${palm(210, 230, 200, 1, "rv-sw1")}${palm(1250, 230, 170, -1, "rv-sw2")}</svg></div>
  <div class="rv-wrap rv-404-in"><p class="rv-kicker">Erreur 404</p><div class="rv-h1" role="heading" aria-level="1">Cette page a pris<br>le large.</div><p class="rv-ph-sub">Elle n'existe pas ou a changé d'adresse. Revenez au bord de l'eau, nous avons gardé un transat.</p><div class="rv-actions"><a class="rv-btn rv-btn--deep" href="/">Retour à l'accueil ${arrow}</a><a class="rv-btn rv-btn--ghost" href="/recherche">Rechercher</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "riviera", name: "Riviera", version: "2.0.0", category: "voyage", tags: ["moderne", "naturel", "luxe"], siteType: "Location de villas de vacances", featured: false,
  concept: "Une villa blanche au bord d'un bassin turquoise qui ondule, une barre qui blanchit au défilement, des cartes de villas pleine largeur et un calendrier de disponibilités avec comparateur de deux villas.",
  description: "Location de villas de vacances : blanc éclatant, bleu piscine et sable, villas et palmiers dessinés en SVG avec reflets d'eau animés, calendrier de disponibilités, prix indicatif et comparateur de deux villas.",
  brand: "Riviera Villas", modules: ["formulaires", "recherche"],
  dna: { header: "barre-vitree-transparente-sur-ciel-qui-devient-blanche-et-ombree", hero: "villa-au-bord-de-la-piscine-plan-large-et-eau-qui-ondule", grid: "cartes-de-villas-pleine-largeur-alternees-gauche-droite", motion: "ondulation-de-l-eau-reflets-scintillants-et-palmes-qui-se-balancent", shapes: "terrasses-blanches-bassins-turquoise-arches-et-palmes", rhythm: "blanc-eclatant-sable-et-bandes-d-eau-separes-par-des-vagues", signature: "fiche-villa-calendrier-de-disponibilites-arrivee-depart-et-comparateur-de-deux-villas" },
  tokens: {
    colors: { primary: "#0a7a91", secondary: "#08394a", accent: "#c9603c", background: "#ffffff", surface: "#f6efe2", text: "#0d2f3b", muted: "#4a6670", success: "#1f7a52", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.italiana", body: "font.instrument-sans", button: "font.instrument-sans", link: "font.instrument-sans" },
    radius: { sm: 6, md: 12, lg: 22, button: 999, field: 12, card: 18 }, shadow: { card: "0 18px 40px rgba(8,57,74,.12)", button: "0 8px 20px rgba(8,57,74,.2)" }, border: { width: 1, color: "#cfe3e8" },
    type: { h1: { size: 76, weight: 400, lineHeight: 1.04, transform: "none" }, h2: { size: 46, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "pool", label: "Bleu de la piscine", type: "color", default: "#0a7a91" },
    { key: "clay", label: "Touche de terre cuite", type: "color", default: "#c9603c" },
    { key: "water", label: "Eau qui ondule", type: "choice", default: "on", choices: [["on", "En mouvement"], ["off", "Immobile"]] },
    { key: "sun", label: "Soleil et nuages", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Nos villas", "/villas"], ["Destinations", "/destinations"], ["Conciergerie", "/conciergerie"], ["Comparer", "/comparer"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "villas", name: "Nos villas", render: villas }, { key: "villa", name: "Fiche villa", render: villa },
    { key: "comparer", name: "Comparateur", render: comparer }, { key: "destinations", name: "Destinations", render: destinations }, { key: "conciergerie", name: "Conciergerie", render: conciergerie },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
