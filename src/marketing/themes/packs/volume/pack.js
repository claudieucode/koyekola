// Volume — agence d'architecture. Direction artistique : minimalisme spatial. Béton clair, anthracite, une seule touche d'accent (terre cuite / vert-de-gris / ocre),
// rail vertical fixe, grand plan asymétrique, projets en colonnes décalées, élévations / plans / coupes / axonométries dessinés au trait, révélations par masque.
const { sec, esc } = require("../kit");

/* ---------- petits outils de dessin (SVG en ligne, classes vo-* habillées par style.css) ---------- */
const n1 = (v) => Math.round(v * 10) / 10;
const rect = (x, y, w, h, c) => `<rect class="${c}" x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}"/>`;
const ln = (x1, y1, x2, y2, c = "vo-l") => `<line class="${c}" x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}"/>`;
const poly = (pts, c) => `<polygon class="${c}" points="${pts.map((p) => p.map(n1).join(",")).join(" ")}"/>`;
const circ = (x, y, r, c) => `<circle class="${c}" cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}"/>`;
const path = (d, c) => `<path class="${c}" d="${d}"/>`;
// hachures à 45° dans un rectangle (sans motif ni identifiant : le filtre supprime les id)
const hatch = (x, y, w, h, s, c = "vo-t") => { let d = ""; for (let k = -h; k < w; k += s) { const t0 = Math.max(0, -k), t1 = Math.min(h, w - k); if (t1 > t0) d += `M${n1(x + k + t0)} ${n1(y + h - t0)}L${n1(x + k + t1)} ${n1(y + h - t1)}`; } return path(d, c); };
const grid = (x, y, cols, rows, w, h, gx, gy, c) => { let o = ""; for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) o += rect(x + q * gx, y + r * gy, w, h, c); return o; };
const svg = (vb, inner, cls = "", par = "xMidYMax slice") => `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="${par}" aria-hidden="true">${inner}</svg>`;
const GY = 330;
const ground = (w = 600, h = 400) => rect(0, GY, w, h - GY, "vo-fg2") + ln(0, GY, w, GY, "vo-l");
const skyline = (s) => { let o = ""; for (let i = 0; i < 6; i++) { const x = i * 110 - 20 + ((s * 37 + i * 13) % 30), h = 40 + ((s * 29 + i * 47) % 60); o += rect(x, GY - h, 70 + ((i * 17) % 40), h, "vo-fg1"); } return o; };
const tree = (x, r = 16) => circ(x, GY - r * 2.1, r, "vo-fg1 vo-l") + ln(x, GY, x, GY - r * 1.1, "vo-t");
const man = (x, h = 22) => circ(x, GY - h - 3, 3.2, "vo-fd") + rect(x - 3.2, GY - h, 6.4, h, "vo-fd");
// prisme isométrique : (x,y) = coin bas avant, w vers la droite, d vers la gauche, h hauteur
const iso = (x, y, w, d, h, cT = "vo-fw vo-l", cL = "vo-fg1 vo-l", cR = "vo-fg3 vo-l") => {
  const a = [w * 0.866, -w * 0.5], b = [-d * 0.866, -d * 0.5], P = [x, y], P1 = [x + a[0], y + a[1]], P2 = [x + b[0], y + b[1]], P3 = [x + a[0] + b[0], y + a[1] + b[1]], up = (p) => [p[0], p[1] - h];
  return poly([P, P1, up(P1), up(P)], cR) + poly([P, P2, up(P2), up(P)], cL) + poly([up(P), up(P1), up(P3), up(P2)], cT);
};

const KINDS = {
  logement(s) {
    const bx = 100 + (s % 3) * 18, w = 300 - (s % 2) * 40, fl = 4 + (s % 2), fh = 46, top = GY - fl * fh, cw = (w - 28) / 6;
    let o = skyline(s) + ground() + poly([[bx + w, GY], [bx + w + 100, GY + 40], [bx + w + 150, GY + 40], [bx + w + 50, GY]], "vo-sh");
    o += rect(bx, top, w, fl * fh, "vo-fw vo-l");
    for (let f = 0; f < fl; f++) {
      for (let b = 0; b < 6; b++) { const x = bx + 14 + b * cw, y = top + f * fh + 10; o += (f * 2 + b + s) % 5 === 0 ? rect(x + 2, y - 4, cw - 4, fh - 14, "vo-fa") : rect(x + 4, y, cw - 8, fh - 22, "vo-fd"); }
      o += rect(bx - 6, top + (f + 1) * fh - 4, w + 12, 4, "vo-fg3");
    }
    o += rect(bx + w, top - 34, 44, fl * fh + 34, "vo-fd") + grid(bx + w + 8, top - 20, 2, 3, 8, 22, 18, 40, "vo-fg1") + tree(bx - 40) + tree(bx + w + 160, 12) + man(bx + 60) + man(bx + 74, 20);
    return o;
  },
  culture(s) {
    const bx = 70 + (s % 2) * 20, w = 430, tw = w / 3;
    let o = skyline(s + 3) + ground() + poly([[bx + w, GY], [bx + w + 110, GY + 36], [bx + w + 190, GY + 36], [bx + w + 80, GY]], "vo-sh");
    o += rect(bx, GY - 110, w, 110, "vo-fd");
    for (let i = 0; i < 3; i++) o += poly([[bx + i * tw, GY - 110], [bx + i * tw, GY - 168 - ((s + i) % 3) * 9], [bx + (i + 1) * tw, GY - 110]], "vo-fw vo-l");
    o += rect(bx + 22, GY - 84, w - 44, 50, "vo-fw");
    for (let i = 1; i < 12; i++) o += ln(bx + 22 + i * (w - 44) / 12, GY - 84, bx + 22 + i * (w - 44) / 12, GY - 34, "vo-t");
    o += rect(bx + w + 22, GY - 240, 14, 240, "vo-fa") + rect(bx - 20, GY - 8, w + 40, 8, "vo-fg3") + tree(bx - 50, 14) + man(bx + 120) + man(bx + 134, 20) + man(bx + 300);
    return o;
  },
  public(s) {
    const bx = 70 + (s % 2) * 14, w = 460;
    let o = skyline(s + 5) + ground() + poly([[bx + w, GY], [bx + w + 80, GY + 34], [bx + w + 150, GY + 34], [bx + w + 70, GY]], "vo-sh");
    o += rect(bx, GY - 184, w, 184, "vo-fg1 vo-l") + grid(bx + 40, GY - 140, 7, 2, 34, 36, 58, 56, "vo-fd") + rect(bx - 10, GY - 210, w + 20, 28, "vo-fd");
    for (let i = 0; i < 9; i++) o += rect(bx + 6 + i * ((w - 28) / 8), GY - 184, 10, 184, "vo-fw vo-l");
    o += rect(bx + w / 2 - 28, GY - 90, 56, 90, "vo-fa") + rect(bx - 16, GY - 8, w + 32, 8, "vo-fg3") + rect(bx - 30, GY - 3, w + 60, 3, "vo-fg3") + man(bx + w / 2 + 70) + man(bx + w / 2 - 80, 20) + tree(bx - 60, 14);
    return o;
  },
  rehab(s) {
    const bx = 90 + (s % 3) * 14, w = 280;
    let o = skyline(s + 8) + ground() + poly([[bx + w, GY], [bx + w + 90, GY + 34], [bx + w + 170, GY + 34], [bx + w + 80, GY]], "vo-sh");
    o += rect(bx, GY - 150, w, 150, "vo-fg2 vo-l") + hatch(bx, GY - 150, w, 150, 9, "vo-t") + poly([[bx - 8, GY - 150], [bx + w / 2, GY - 212], [bx + w + 8, GY - 150]], "vo-fg3 vo-l");
    for (let i = 0; i < 5; i++) o += rect(bx + 22 + i * 52, GY - 118, 24, 40, "vo-fw vo-l") + rect(bx + 22 + i * 52, GY - 56, 24, 40, "vo-fw vo-l");
    o += rect(bx + 120, GY - 262, 210, 66, "vo-fa") + grid(bx + 130, GY - 252, 7, 1, 20, 46, 28, 0, "vo-fw") + rect(bx + 332, GY - 262, 4, 262, "vo-fd");
    for (let i = 0; i < 4; i++) o += ln(bx + w + 40 + i * 24, GY, bx + w + 40 + i * 24, GY - 120, "vo-t");
    o += ln(bx + w + 40, GY - 120, bx + w + 112, GY - 120, "vo-t") + ln(bx + w + 40, GY - 60, bx + w + 112, GY - 120, "vo-t") + tree(bx - 40, 13) + man(bx + 40, 20);
    return o;
  },
};
const photo = (kind, seed, g = "vo-g1", vb = "0 0 600 400", par) => `<div class="vo-ph ${g}">${svg(vb, KINDS[kind](seed), "vo-sv", par)}</div>`;

// La halle avant / après (comparateur)
const halle = (after) => {
  const bx = 70, w = 620; let o = rect(0, 330, 800, 120, after ? "vo-fg2" : "vo-fg3") + ln(0, 330, 800, 330);
  o += rect(bx, 200, w, 130, after ? "vo-fw vo-l" : "vo-fg2 vo-l");
  for (let i = 0; i < 4; i++) { const x = bx + i * (w / 4); o += poly([[x, 200], [x, 140], [x + w / 4, 200]], after ? "vo-fw vo-l" : "vo-fg3 vo-l"); if (after) o += poly([[x + 6, 196], [x + 6, 152], [x + w / 4 - 30, 196]], "vo-fg1"); }
  if (!after) o += hatch(bx, 200, w, 130, 8) + rect(690, 60, 22, 140, "vo-fg3 vo-l") + circ(640, 120, 18, "vo-fg1") + circ(670, 90, 12, "vo-fg1");
  for (let i = 0; i < 10; i++) { const x = bx + 20 + i * 60; o += after ? ((i % 3 === 1) ? rect(x, 226, 42, 104, "vo-fa") : rect(x, 226, 42, 104, "vo-fd") + ln(x + 21, 226, x + 21, 330, "vo-lw")) : ((i % 4 === 2) ? rect(x, 240, 42, 70, "vo-fg3") : rect(x, 240, 42, 70, "vo-fd") + (i % 3 === 0 ? ln(x, 240, x + 42, 310, "vo-lw") : ""));
  }
  if (after) { o += rect(250, 78, 250, 62, "vo-fa") + grid(260, 90, 8, 1, 20, 38, 29, 0, "vo-fw") + rect(430, 198, 10, 0, "vo-fd") + tree(40, 18) + tree(740, 16) + man(300, 24) + man(316, 22); }
  else { o += ln(40, 330, 60, 300) + ln(60, 300, 82, 330) + ln(740, 330, 730, 290) + ln(730, 290, 760, 270); }
  return o;
};

// Hero : élévation d'ensemble
const heroDrawing = () => {
  const gy = 640; let o = "";
  o += poly([[880, gy], [1120, gy + 70], [1380, gy + 70], [1130, gy]], "vo-sh");
  o += rect(190, 410, 470, 230, "vo-fw vo-l") + hatch(190, 410, 470, 230, 14, "vo-t") + rect(190, 410, 470, 14, "vo-fg3");
  o += rect(230, 470, 390, 120, "vo-fg1 vo-l") + grid(244, 480, 7, 1, 44, 100, 54, 0, "vo-fw");
  o += rect(610, 150, 270, 490, "vo-fd");
  for (let c = 0; c < 6; c++) for (let r = 0; r < 7; r++) o += rect(628 + c * 42, 178 + r * 62, 14, 44, (c * 3 + r * 2) % 11 === 0 ? "vo-fa" : "vo-fg1");
  o += rect(840, 262, 460, 96, "vo-fa") + grid(860, 280, 14, 1, 20, 60, 31, 0, "vo-fw") + rect(840, 350, 460, 8, "vo-fd");
  o += rect(1250, 358, 10, 282, "vo-fd") + rect(1010, 358, 10, 282, "vo-fd") + poly([[1020, 358], [1250, 358], [1250, 640], [1020, 640]], "vo-sh2");
  o += rect(1020, 440, 230, 200, "vo-fw vo-l") + rect(1040, 470, 80, 170, "vo-fd") + rect(1140, 470, 90, 90, "vo-fg1 vo-l");
  for (let i = 0; i < 9; i++) o += ln(60 + i * 14, gy - i * 8, 60 + i * 14 + 14, gy - (i + 1) * 8, "vo-l");
  o += rect(60, gy - 80, 130, 4, "vo-fd") + ln(188, gy - 76, 188, gy, "vo-l");
  o += circ(1340, 510, 54, "vo-fg1 vo-l") + ln(1340, 640, 1340, 560, "vo-l") + circ(120, 500, 40, "vo-fg1 vo-l") + ln(120, gy - 80, 120, 540, "vo-l");
  for (const [x, h] of [[700, 66], [930, 58], [980, 62], [330, 60]]) o += circ(x, gy - h - 9, 8, "vo-fd") + rect(x - 8, gy - h, 16, h, "vo-fd");
  // lignes de niveau et de cotes (masquables)
  o += `<g class="vo-cotes">${ln(0, 410, 1400, 410, "vo-ds")}${ln(0, 150, 1400, 150, "vo-ds")}${ln(190, 700, 1300, 700, "vo-l")}${ln(190, 688, 190, 712)}${ln(660, 688, 660, 712)}${ln(1300, 688, 1300, 712)}${ln(1352, 150, 1352, 640)}${ln(1340, 150, 1364, 150)}${ln(1340, 640, 1364, 640)}${ln(184, 706, 196, 694)}${ln(654, 706, 666, 694)}${ln(1294, 706, 1306, 694)}</g>`;
  return svg("0 0 1400 800", rect(0, 619, 1400, 181, "vo-fg2") + ln(0, 619, 1400, 619, "vo-l2") + `<g transform="translate(300 120) scale(.78)">${o}</g>`, "vo-sv", "xMidYMid slice");
};

// Plan d'étage
const plan = (s = 0) => {
  const i = (s % 3) * 14; let o = rect(0, 0, 600, 420, "vo-fp");
  o += rect(40, 40, 520, 340, "vo-fw") + rect(40, 40, 190 + i, 210, "vo-fg1") + rect(230 + i, 250, 120, 130, "vo-fg1") + rect(40 + 380 - i, 40, 140 + i, 150, "vo-fg1");
  o += hatch(450, 270, 80, 90, 7) + rect(450, 270, 80, 90, "vo-l");
  for (let k = 0; k < 11; k++) o += ln(272 + i + k * 8, 255, 272 + i + k * 8, 330, "vo-t"); o += ln(272 + i, 292, 340 + i, 292, "vo-t");
  o += ln(40, 250, 330 + i, 250, "vo-wall") + ln(230 + i, 40, 230 + i, 250, "vo-wall") + ln(330 + i, 250, 330 + i, 380, "vo-wall") + ln(420 - i, 40, 420 - i, 190, "vo-wall") + ln(420 - i, 190, 560, 190, "vo-wall") + ln(440, 250, 440, 380, "vo-wall") + ln(440, 250, 560, 250, "vo-wall");
  o += `<rect class="vo-wall" x="40" y="40" width="520" height="340"/>`;
  o += ln(100, 40, 190, 40, "vo-win") + ln(270, 40, 380, 40, "vo-win") + ln(40, 110, 40, 200, "vo-win") + ln(560, 90, 560, 140, "vo-win") + ln(120, 380, 260, 380, "vo-win") + ln(480, 380, 540, 380, "vo-win");
  o += path(`M${200 + i} 250h-32a32 32 0 0 1 32 -32z`, "vo-t") + path("M330 330h-30a30 30 0 0 0 30 30z", "vo-t") + path("M420 150v30a30 30 0 0 0 -30 -30z", "vo-t");
  o += rect(70, 70, 70, 36, "vo-l") + rect(70, 280, 90, 50, "vo-l") + circ(120, 320, 10, "vo-t") + rect(370, 60, 30, 100, "vo-l") + rect(250, 275, 8, 8, "vo-fd");
  for (const [x, y] of [[40, 40], [230 + i, 40], [560, 40], [40, 250], [330 + i, 250], [560, 380], [40, 380], [330 + i, 380]]) o += circ(x, y, 5, "vo-fd");
  o += `<g class="vo-cotes">${ln(40, 410, 560, 410)}${ln(40, 402, 40, 418)}${ln(560, 402, 560, 418)}${ln(230 + i, 402, 230 + i, 418)}${ln(34, 416, 46, 404)}${ln(554, 416, 566, 404)}${ln(224 + i, 416, 236 + i, 404)}${ln(590, 40, 590, 380)}${ln(582, 40, 598, 40)}${ln(582, 380, 598, 380)}</g>`;
  return svg("0 0 600 420", o, "vo-sv", "xMidYMid meet");
};

// Coupe longitudinale
const coupe = () => {
  let o = rect(0, 0, 800, 360, "vo-fp") + rect(0, 290, 800, 70, "vo-fg2") + hatch(0, 290, 800, 70, 10, "vo-t");
  o += rect(60, 90, 680, 10, "vo-fd") + rect(60, 190, 680, 10, "vo-fd") + rect(60, 288, 680, 6, "vo-fd") + rect(60, 90, 8, 204, "vo-fd") + rect(732, 90, 8, 204, "vo-fd");
  for (let i = 0; i < 4; i++) o += poly([[60 + i * 170, 90], [60 + i * 170, 30], [230 + i * 170, 90]], "vo-fw vo-l") + poly([[66 + i * 170, 86], [66 + i * 170, 44], [210 + i * 170, 86]], "vo-fg1");
  o += rect(60 + 30, 100, 150, 90, "vo-fg1") + rect(470, 200, 200, 88, "vo-fa") + rect(250, 200, 80, 88, "vo-fg1") + hatch(250, 200, 80, 88, 9, "vo-t");
  for (let k = 0; k < 14; k++) o += ln(380 + k * 6, 200 + k * 6, 386 + k * 6, 200 + k * 6) + ln(386 + k * 6, 200 + k * 6, 386 + k * 6, 206 + k * 6);
  for (const x of [200, 350, 520, 640]) o += rect(x - 4, 100, 8, 90, "vo-fd") + rect(x - 4, 200, 8, 88, "vo-fd");
  for (const [x, y, h] of [[150, 190, 40], [420, 288, 44], [590, 288, 44], [300, 288, 44]]) o += circ(x, y - h - 6, 5, "vo-fd") + rect(x - 5, y - h, 10, h, "vo-fd");
  o += `<g class="vo-cotes">${ln(40, 40, 40, 294)}${ln(32, 90, 48, 90)}${ln(32, 190, 48, 190)}${ln(32, 288, 48, 288)}${ln(60, 336, 740, 336)}${ln(60, 328, 60, 344)}${ln(740, 328, 740, 344)}</g>`;
  return svg("0 0 800 360", o, "vo-sv", "xMidYMid meet");
};

// Axonométrie d'ensemble
const axo = () => {
  let o = poly([[300, 330], [560, 180], [300, 30], [40, 180]], "vo-fg2 vo-l") + iso(300, 300, 190, 150, 30) + iso(300, 270, 190, 150, 44, "vo-fw vo-l", "vo-fg1 vo-l", "vo-fg3 vo-l") + iso(380, 236, 90, 80, 90, "vo-fa", "vo-fa2 vo-l", "vo-fa3 vo-l") + iso(250, 262, 70, 60, 120, "vo-fg3 vo-l", "vo-fd", "vo-fd") + iso(430, 300, 50, 40, 20);
  return svg("0 0 600 360", o, "vo-sv", "xMidYMid meet");
};

const ICONS = [
  () => svg("0 0 120 90", ["38", "30", "22", "14"].map((r, k) => `<ellipse class="vo-l" cx="${54 + k * 3}" cy="46" rx="${r * 1.5}" ry="${r}"/>`).join("") + circ(57, 46, 3, "vo-fa"), "vo-ico", "xMidYMid meet"),
  () => svg("0 0 120 90", rect(10, 12, 40, 26, "vo-l") + rect(70, 12, 40, 26, "vo-fg1 vo-l") + rect(40, 54, 40, 26, "vo-fa") + ln(30, 38, 50, 54) + ln(90, 38, 70, 54) + ln(50, 25, 70, 25), "vo-ico", "xMidYMid meet"),
  () => svg("0 0 120 90", iso(60, 74, 48, 40, 22) + iso(60, 52, 48, 40, 18, "vo-fa", "vo-fa2 vo-l", "vo-fa3 vo-l"), "vo-ico", "xMidYMid meet"),
  () => svg("0 0 120 90", rect(20, 40, 56, 40, "vo-fw vo-l") + hatch(20, 40, 56, 40, 6) + ln(8, 80, 112, 80) + ln(92, 80, 92, 10) + ln(92, 10, 36, 10) + ln(92, 22, 64, 40) + rect(76, 28, 12, 12, "vo-fa"), "vo-ico", "xMidYMid meet"),
  () => svg("0 0 120 90", rect(14, 36, 92, 44, "vo-fw vo-l") + rect(30, 18, 60, 18, "vo-fa") + grid(24, 48, 5, 1, 12, 32, 17, 0, "vo-fd") + ln(6, 80, 114, 80), "vo-ico", "xMidYMid meet"),
];

const portrait = (i) => {
  const g = ["vo-g1", "vo-g2", "vo-g3", "vo-g4", "vo-g5", "vo-g2"][i % 6];
  let o = "";
  o += i % 2 ? rect(130, 0, 70, 70, "vo-fa") : rect(0, 180, 70, 70, "vo-fa");
  o += hatch(0, 0, 200, 250, 18, "vo-t2");
  o += circ(100 + (i % 3 - 1) * 8, 98, 36 + (i % 2) * 4, "vo-fd") + path(`M20 250c0-${70 - (i % 3) * 6} 30-104 80-104s80 34 80 104z`, "vo-fd");
  o += poly([[100, 134], [86, 150], [100, 170], [114, 150]], "vo-fp") + ln(0, 249, 200, 249, "vo-l");
  return `<div class="vo-ph ${g}">${svg("0 0 200 250", o, "vo-sv", "xMidYMax slice")}</div>`;
};

const logoMark = `<svg class="vo-mark" viewBox="0 0 28 28" aria-hidden="true"><rect class="vo-l" x="3" y="3" width="22" height="22"/><path class="vo-l" d="M3 16h13V3"/><rect class="vo-fa" x="16" y="16" width="9" height="9"/></svg>`;
const arrow = `<svg class="vo-arr" viewBox="0 0 24 12" aria-hidden="true"><path class="vo-l" d="M0 6h22M17 1l5 5-5 5"/></svg>`;

/* ---------- données ---------- */
const TYPES = { logement: "Logement", culture: "Culture", public: "Équipement public", rehab: "Réhabilitation" };
const PROJ = [
  { n: "01", t: "Les Terrasses", ty: "logement", lieu: "Lyon", an: 2024, s: "4 280 m²", g: "vo-g1", r: "p", seed: 1, prog: "42 logements collectifs" },
  { n: "02", t: "Médiathèque du Fleuve", ty: "culture", lieu: "Nantes", an: 2023, s: "3 150 m²", g: "vo-g2", r: "l", seed: 0, prog: "Médiathèque et auditorium" },
  { n: "03", t: "Mairie annexe de Saint-Aubin", ty: "public", lieu: "Saint-Aubin", an: 2022, s: "1 640 m²", g: "vo-g5", r: "s", seed: 1, prog: "Mairie annexe, salle des fêtes" },
  { n: "04", t: "Halle Barral", ty: "rehab", lieu: "Grenoble", an: 2025, s: "5 900 m²", g: "vo-g3", r: "l", seed: 0, prog: "Ancienne halle en ateliers" },
  { n: "05", t: "Maison pour trois", ty: "logement", lieu: "Annecy", an: 2021, s: "310 m²", g: "vo-g4", r: "p", seed: 2, prog: "Maison individuelle" },
  { n: "06", t: "Théâtre des Marges", ty: "culture", lieu: "Marseille", an: 2024, s: "2 200 m²", g: "vo-g3", r: "s", seed: 1, prog: "Salle de 380 places" },
  { n: "07", t: "Groupe scolaire Jean-Moulin", ty: "public", lieu: "Villeurbanne", an: 2023, s: "3 800 m²", g: "vo-g2", r: "l", seed: 0, prog: "Écoles maternelle et élémentaire" },
  { n: "08", t: "Les Minoteries", ty: "rehab", lieu: "Dijon", an: 2022, s: "7 400 m²", g: "vo-g4", r: "p", seed: 1, prog: "Réhabilitation de 96 logements" },
  { n: "09", t: "Pavillon des Ondes", ty: "public", lieu: "Évian", an: 2025, s: "560 m²", g: "vo-g1", r: "s", seed: 2, prog: "Pavillon d'accueil et de billetterie" },
];
const KIND_OF = { logement: "logement", culture: "culture", public: "public", rehab: "rehab" };
const card = (p, col, extra = "") => `<article class="vo-card vo-r-${p.r}" data-type="${p.ty}" data-col="${col}" data-reveal>
  <a class="vo-card-a" href="/projet" aria-label="${esc(p.t)} — voir le projet"><div class="vo-card-img" data-mask>${photo(KIND_OF[p.ty], p.seed, p.g)}<span class="vo-card-n">${p.n}</span></div>
  <div class="vo-card-t"><h3>${esc(p.t)}</h3><p>${TYPES[p.ty]} · ${esc(p.lieu)} · ${p.an}</p><span class="vo-surf">${p.s}</span></div></a>${extra}</article>`;
const indexRows = (list) => list.map((p) => `<li class="vo-ix-row" data-type="${p.ty}"><a href="/projet"><span class="vo-ix-n">${p.n}</span><span class="vo-ix-t">${esc(p.t)}</span><span class="vo-ix-ty">${TYPES[p.ty]}</span><span class="vo-ix-l">${esc(p.lieu)}</span><span class="vo-ix-a">${p.an}</span><span class="vo-ix-go">${arrow}</span></a></li>`).join("");

/* ---------- gabarits communs ---------- */
const ORDER = ["accueil", "projets", "projet", "studio", "approche", "presse", "contact", "recherche", "introuvable"];
const lines = (arr) => arr.map((t) => `<span class="vo-ln"><span>${t}</span></span>`).join("");

const header = (c, key) => {
  const n = String(ORDER.indexOf(key) + 1).padStart(2, "0");
  const items = c.menu.map(({ label, url }, i) => `<a href="${esc(url)}"${("/" + key === url) || (key === "projet" && url === "/projets") ? ' aria-current="page"' : ""}><i>${String(i + 1).padStart(2, "0")}</i>${esc(label)}</a>`).join("");
  return sec(`<div class="vo-railwrap pk-bleed"><header class="vo-rail">
    <a class="vo-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span class="vo-logo-t"><b>Volume</b><small>Architectes</small></span></a>
    <div class="vo-rnav" role="navigation" aria-label="Navigation principale">${items}</div>
    <div class="vo-rfoot"><a class="vo-rsearch" href="/recherche">Rechercher</a><span class="vo-pageno" aria-label="Page ${n} sur 09">Page <b>${n}</b> / 09</span><span class="vo-rcoord">45°45′ N · 4°50′ E</span></div>
    <details class="vo-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="vo-drawer" role="navigation" aria-label="Menu mobile">${items}<a class="vo-dsearch" href="/recherche"><i>—</i>Rechercher</a><p>12 quai Saint-Antoine, Lyon</p></div></details>
  </header></div>`);
};

const footer = (c) => sec(`<footer class="vo-foot pk-bleed"><div class="vo-foot-in">
  <div class="vo-foot-word" aria-hidden="true">Volume</div>
  <div class="vo-foot-grid"><div><p class="vo-foot-lead">Construire peu, construire juste, laisser de l'espace.</p><address>Volume Architectes<br>12 quai Saint-Antoine<br>69002 Lyon</address></div>
    <div><h3>Agence</h3><a href="/studio">Studio</a><a href="/approche">Approche</a><a href="/presse">Presse et distinctions</a></div>
    <div><h3>Projets</h3><a href="/projets">Tous les projets</a><a href="/projet">Halle Barral</a><a href="/recherche">Recherche</a></div>
    <div><h3>Écrire</h3><a href="/contact">Formulaire de contact</a><a href="mailto:agence@volume-architectes.example">agence@volume-architectes.example</a></div></div>
  <div class="vo-foot-cote" aria-hidden="true"><span></span><i>12,00 m</i><span></span></div>
  <p class="vo-legal">© Volume Architectes — site de démonstration. Agence, projets et personnes fictifs.</p></div></footer>`);

const pagehead = (n, kicker, title, sub) => sec(`<section class="vo-pg pk-bleed"><div class="vo-ph-in">
  <div class="vo-ph-k" data-reveal><span class="vo-no">${n}</span><span>${esc(kicker)}</span><span class="vo-rule"></span></div>
  <div class="vo-h1" role="heading" aria-level="1" data-lines>${lines(title)}</div>
  ${sub ? `<p class="vo-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

const cta = () => sec(`<section class="vo-cta pk-bleed"><div class="vo-wrap vo-cta-in"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Un site, un programme,", "une envie de vide ?"])}</div>
  <div data-reveal><p>Parlez-nous de votre terrain. Nous répondons sous cinq jours ouvrés, avec une première lecture du site.</p><a class="vo-link" href="/contact">Écrire à l'agence ${arrow}</a></div></div></section>`);

const legend = (items) => `<ol class="vo-leg">${items.map(([t, d], i) => `<li><span class="vo-pin-n">${i + 1}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join("")}</ol>`;

/* ---------- pages ---------- */
const accueil = (c) => [
  header(c, "accueil"),
  sec(`<section class="vo-hero pk-bleed">
    <div class="vo-hero-cap" data-reveal><span class="vo-no">Projet 04</span><b>Halle Barral</b><span>Réhabilitation · Grenoble · 2025</span><span>5 900 m² · 3 niveaux</span><a class="vo-link" href="/projet">Voir le projet ${arrow}</a></div>
    <figure class="vo-hero-fig" data-mask>${heroDrawing()}<span class="vo-cl vo-cl--h vo-cotes-l">42,60 m</span><span class="vo-cl vo-cl--v vo-cotes-l">18,40 m</span><figcaption class="vo-sr">Élévation sud de la Halle Barral : trois volumes, un porte-à-faux en terre cuite.</figcaption></figure>
    <div class="vo-hero-t"><div class="vo-h1" role="heading" aria-level="1" data-lines>${lines(["Construire", "le vide."])}</div></div>
    <div class="vo-hero-foot"><p class="vo-lead" data-reveal>Volume est une agence d'architecture lyonnaise. Nous dessinons des bâtiments sobres, lumineux et durables, où l'espace compte autant que la matière.</p>
      <ul class="vo-hero-meta" data-reveal><li><b>62</b><span>projets livrés</span></li><li><b>2009</b><span>fondation</span></li><li><b>14</b><span>architectes</span></li></ul></div>
  </section>`),
  sec(`<section class="vo-manif pk-bleed"><div class="vo-wrap vo-manif-in"><p class="vo-no" data-reveal>01 — Principe</p>
    <p class="vo-manif-t" data-reveal>Un bâtiment commence par ce qu'on n'y met pas. Nous cherchons la juste quantité de matière, la juste mesure de lumière, et laissons le reste au vide : celui des usages, des passages, des respirations.</p>
    <div class="vo-manif-c" data-reveal><p>Chaque projet s'ouvre par une coupe et un plan avant la moindre image. Le dessin au trait reste notre outil de pensée : il oblige à décider.</p><a class="vo-link" href="/approche">Notre approche ${arrow}</a></div></div></section>`),
  sec(`<section class="vo-sel vo-sel--all pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Projets", "récents"])}</div><a class="vo-link" href="/projets" data-reveal>Tous les projets ${arrow}</a></div>
    <div class="vo-cols" data-cols>${[PROJ[0], PROJ[1], PROJ[3]].map((p, i) => card(p, i)).join("")}</div></div></section>`),
  sec(`<section class="vo-sel vo-sel--last pk-bleed"><div class="vo-wrap"><div class="vo-cols" data-cols>${[PROJ[5], PROJ[7], PROJ[6]].map((p, i) => card(p, i)).join("")}</div></div></section>`),
  sec(`<section class="vo-ix pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Index"])}</div><p class="vo-ix-note" data-reveal>Neuf projets, de 2021 à 2025.</p></div>
    <ol class="vo-ix-list" data-reveal>${indexRows(PROJ)}</ol></div></section>`),
  sec(`<section class="vo-dark pk-bleed"><div class="vo-wrap vo-dark-in"><div class="vo-dark-fig" data-mask="up">${axo()}</div>
    <div class="vo-dark-t"><p class="vo-no" data-reveal>02 — Méthode</p><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Dessiner d'abord", "la coupe."])}</div>
      <ul class="vo-prin" data-reveal><li><b>Matière</b><span>Béton recyclé, bois, terre : peu de matériaux, bien choisis.</span></li><li><b>Lumière</b><span>Chaque pièce reçoit deux orientations, sans exception.</span></li><li><b>Économie</b><span>Un plan simple coûte moins cher et vieillit mieux.</span></li></ul>
      <a class="vo-link" href="/approche" data-reveal>Les cinq étapes ${arrow}</a></div></div></section>`),
  cta(), footer(c),
];

const projets = (c) => [
  header(c, "projets"),
  pagehead("02", "Réalisations 2021 — 2025", ["Neuf projets,", "un même silence."], "Logements, équipements culturels et publics, réhabilitations : filtrez par typologie, ou parcourez l'index."),
  sec(`<section class="vo-filt pk-bleed"><div class="vo-wrap vo-filt-in"><div class="vo-tabs" role="tablist" aria-label="Filtrer par typologie">
    <a href="#tous" class="is-on" data-filter="all" role="tab" aria-selected="true">Tous <sup>9</sup></a><a href="#logement" data-filter="logement" role="tab" aria-selected="false">Logement <sup>2</sup></a><a href="#culture" data-filter="culture" role="tab" aria-selected="false">Culture <sup>2</sup></a><a href="#public" data-filter="public" role="tab" aria-selected="false">Public <sup>3</sup></a><a href="#rehab" data-filter="rehab" role="tab" aria-selected="false">Réhabilitation <sup>2</sup></a></div>
    <p class="vo-count" aria-live="polite"><b data-count>9</b> projets affichés</p></div></section>`),
  ...[0, 1, 2].map((k) => sec(`<section class="vo-sel vo-sel--all${k === 2 ? " vo-sel--last" : ""} pk-bleed"><div class="vo-wrap"><div class="vo-cols" data-cols>${PROJ.slice(k * 3, k * 3 + 3).map((p, i) => card(p, i)).join("")}</div></div></section>`)),
  sec(`<section class="vo-ix pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Index"])}</div><p class="vo-ix-note" data-reveal>Numéro, projet, typologie, lieu, année.</p></div>
    <ol class="vo-ix-list" data-reveal>${indexRows(PROJ)}</ol></div></section>`),
  cta(), footer(c),
];

const projet = (c) => [
  header(c, "projet"),
  sec(`<section class="vo-pj pk-bleed"><div class="vo-pj-grid">
    <div class="vo-pj-cap" data-reveal><a class="vo-back" href="/projets">${arrow} Projets</a><span class="vo-no">Projet 04</span><span>Réhabilitation · 2025</span></div>
    <figure class="vo-pj-fig" data-mask>${photo("rehab", 0, "vo-g3", "0 0 600 400", "xMidYMax slice")}<figcaption class="vo-sr">Façade sud de la halle réhabilitée.</figcaption></figure>
    <div class="vo-pj-t"><div class="vo-h1" role="heading" aria-level="1" data-lines>${lines(["Halle", "Barral"])}</div></div></div></section>`),
  sec(`<section class="vo-story pk-bleed"><div class="vo-wrap vo-story-in">
    <aside class="vo-fiche" data-reveal aria-label="Fiche technique"><h2 class="vo-fiche-h">Fiche technique</h2><dl>
      <div><dt>Programme</dt><dd>Ateliers, halle d'exposition, café</dd></div><div><dt>Lieu</dt><dd>Grenoble (38), quartier de la Villeneuve</dd></div><div><dt>Année</dt><dd>2025 (études 2020 — 2022)</dd></div>
      <div><dt>Surface</dt><dd>5 900 m² de plancher</dd></div><div><dt>Maîtrise d'ouvrage</dt><dd>Métropole de Grenoble (fictive)</dd></div><div><dt>Structure</dt><dd>Charpente d'origine conservée, plancher bois-béton</dd></div><div><dt>Performance</dt><dd>Consommation divisée par quatre</dd></div></dl></aside>
    <div class="vo-prose"><p class="vo-lead-b" data-reveal>Une halle de 1932, longue de quarante mètres, a cessé de produire en 2004. Nous l'avons ouverte, vidée, puis habitée par un seul geste neuf.</p>
      <h2 class="vo-h3" data-reveal>Lire avant de construire</h2>
      <p data-reveal>Le premier mois a été consacré au relevé : chaque fer, chaque brique, chaque fissure. La structure métallique, saine, dictait déjà le plan. Les trois travées de sheds orientent la lumière vers le nord, calme et constante, idéale pour des ateliers.</p>
      <p data-reveal>Plutôt que de plaquer un programme, nous avons retiré. Les cloisons tardives, les faux plafonds, les dalles ajoutées ont disparu. Il restait une nef, un volume que l'on comprend d'un seul regard, et que nous avons décidé de ne pas remplir.</p>
      <blockquote class="vo-quote" data-reveal><p>La plus belle pièce de ce projet est celle que nous n'avons pas construite.</p><cite>Agence Volume</cite></blockquote>
      <h2 class="vo-h3" data-reveal>Un volume en terre cuite</h2>
      <p data-reveal>Un seul élément neuf : un porte-à-faux de seize mètres, posé sur l'ancienne nef et habillé d'un bardage en terre cuite. Il abrite le café et la salle d'exposition, et dessine un auvent généreux au-dessus de l'entrée.</p>
      <p data-reveal>Sa couleur répond à celle des briques d'origine sans les imiter. Dans la lumière rasante de fin d'après-midi, les deux matières se confondent presque ; à midi, elles se distinguent nettement. C'est la différence que nous recherchions : visible, mais pas bruyante.</p>
      <h2 class="vo-h3" data-reveal>Sobriété d'usage</h2>
      <p data-reveal>Les sheds sont désormais vitrés et dotés de brise-soleil à lames. Le bâtiment se ventile naturellement, sans climatisation. Les eaux de toiture sont collectées dans un bassin au cœur de la nef, devenu lieu de rassemblement.</p></div></div></section>`),
  sec(`<section class="vo-planbl pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Plan du", "niveau 1"])}</div><p class="vo-ix-note" data-reveal>Échelle 1 / 200</p></div>
    <div class="vo-plan-grid"><figure class="vo-plan" data-mask>${plan(1)}<span class="vo-pn vo-pn1">1</span><span class="vo-pn vo-pn2">2</span><span class="vo-pn vo-pn3">3</span><span class="vo-pn vo-pn4">4</span><span class="vo-pn vo-pn5">5</span><figcaption class="vo-sr">Plan du premier niveau avec cinq repères numérotés.</figcaption></figure>
      <div class="vo-plan-leg" data-reveal><h3 class="vo-leg-h">Légende du plan</h3>${legend([["Nef d'exposition", "380 m² sous les sheds"], ["Café", "Dans le porte-à-faux"], ["Ateliers", "Douze unités modulables"], ["Escalier", "Escalier béton à volée droite"], ["Noyau technique", "Sanitaires, gaines, local vélos"]])}</div></div></div></section>`),
  sec(`<section class="vo-dark vo-dark--sec pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Coupe", "longitudinale"])}</div></div>
    <figure class="vo-coupe" data-mask>${coupe()}<figcaption class="vo-sr">Coupe sur la nef et le volume neuf.</figcaption></figure></div></section>`),
  sec(`<section class="vo-baw pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Avant,", "après."])}</div><p class="vo-ix-note" data-reveal>Faites glisser la poignée, ou utilisez les flèches du clavier.</p></div>
    <div class="vo-ba" data-ba data-reveal><div class="vo-ba-l vo-ba-before"><div class="vo-ph vo-g4">${svg("0 0 800 450", halle(false), "vo-sv", "xMidYMax slice")}</div></div>
      <div class="vo-ba-l vo-ba-after"><div class="vo-ph vo-g1">${svg("0 0 800 450", halle(true), "vo-sv", "xMidYMax slice")}</div></div>
      <a class="vo-ba-h" href="#comparer" role="slider" aria-label="Comparer l'état avant et après" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><span></span></a>
      <span class="vo-ba-tag vo-ba-tag--b">Avant · 2019</span><span class="vo-ba-tag vo-ba-tag--a">Après · 2025</span></div>
    <div class="vo-ba-sw" role="group" aria-label="Basculer"><a href="#avant" data-ba-set="0">Avant</a><a href="#milieu" data-ba-set="50">Comparer</a><a href="#apres" data-ba-set="100">Après</a></div></div></section>`),
  sec(`<section class="vo-next pk-bleed"><div class="vo-wrap vo-next-in"><div><p class="vo-no" data-reveal>Projet suivant</p><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Les Minoteries", "Dijon · 2022"])}</div><a class="vo-link" href="/projets" data-reveal>Retour aux projets ${arrow}</a></div>
    <div class="vo-next-fig" data-mask>${photo("rehab", 1, "vo-g4")}</div></div></section>`),
  footer(c),
];

const TEAM = [["Camille Verdier", "Architecte associée, cofondatrice"], ["Mathis Rochefort", "Architecte associé, cofondateur"], ["Inès Delacroix", "Cheffe de projet, logement"], ["Noé Castellan", "Chef de projet, équipements"], ["Salomé Pastor", "Architecte d'intérieur"], ["Hugo Vasseur", "Maquettiste, coordination"]];
const studio = (c) => [
  header(c, "studio"),
  pagehead("04", "Le studio", ["Une table,", "quatorze têtes."], "Fondée en 2009 par Camille Verdier et Mathis Rochefort, l'agence réunit architectes, maquettistes et économistes autour d'une grande table et d'une règle : tout se dessine à la main d'abord."),
  sec(`<section class="vo-stu pk-bleed"><div class="vo-wrap vo-stu-in"><aside class="vo-stu-side" data-reveal><p class="vo-no">Chiffres</p><ul class="vo-hero-meta vo-hero-meta--col"><li><b>2009</b><span>fondation de l'agence</span></li><li><b>62</b><span>projets livrés</span></li><li><b>14</b><span>personnes au studio</span></li><li><b>4</b><span>distinctions</span></li></ul></aside>
    <div class="vo-stu-main"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["L'équipe"])}</div></div>
    <div class="vo-team">${TEAM.map(([nm, ro], i) => `<article class="vo-member vo-m${i % 3}" data-reveal><div class="vo-member-img" data-mask>${portrait(i)}</div><h3>${esc(nm)}</h3><p>${esc(ro)}</p></article>`).join("")}</div></div></div></section>`),
  sec(`<section class="vo-vals pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Quatre", "valeurs"])}</div></div>
    <ol class="vo-vals-list">${[["Sobriété", "Faire avec ce qui est là : le terrain, la structure existante, les ressources locales."], ["Précision", "Un détail juste vaut mieux que dix détails décoratifs. Nous dessinons au millimètre."], ["Hospitalité", "Un bâtiment est réussi quand on s'y sent attendu, sans mode d'emploi."], ["Transmission", "Chaque chantier forme des jeunes, des artisans, des maîtres d'ouvrage."]].map(([t, d], i) => `<li data-reveal><span class="vo-no">0${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join("")}</ol></div></section>`),
  cta(), footer(c),
];

const STEPS = [["Lire le site", "Relevé, histoire, climat, usages : nous marchons le terrain avant de dessiner.", "Semaines 1 à 4"], ["Écrire le programme", "Avec vous, nous réduisons la liste de souhaits à l'essentiel.", "Semaines 4 à 8"], ["Esquisser", "Plans, coupes et maquette de travail : trois partis comparés, un seul retenu.", "Mois 3 à 5"], ["Construire", "Suivi hebdomadaire de chantier, détails dessinés avec les entreprises.", "Mois 8 à 28"], ["Livrer et suivre", "Réception, carnet d'entretien, visite à un an avec les usagers.", "Année 3"]];
const approche = (c) => [
  header(c, "approche"),
  pagehead("05", "Méthode", ["Cinq étapes,", "peu de bruit."], "De la lecture du site à la visite des usagers, un déroulé simple que nous adaptons à chaque taille de projet."),
  sec(`<section class="vo-frise pk-bleed"><div class="vo-wrap"><ol class="vo-steps">${STEPS.map(([t, d, w], i) => `<li class="vo-step" data-reveal><div class="vo-step-ico" data-mask="up">${ICONS[i]()}</div><span class="vo-step-n">0${i + 1}</span><h3>${t}</h3><p>${d}</p><small>${w}</small></li>`).join("")}</ol></div></section>`),
  sec(`<section class="vo-dark pk-bleed"><div class="vo-wrap vo-dark-in vo-dark-in--r"><div class="vo-dark-t"><p class="vo-no" data-reveal>Principes</p><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Ce que nous", "refusons."])}</div>
    <div class="vo-acc" data-reveal><details open><summary>Le geste gratuit</summary><p>Une forme qui ne sert ni l'usage ni la lumière ne sera pas dessinée, même si elle est belle.</p></details><details><summary>La matière inutile</summary><p>Chaque kilo de béton doit justifier sa présence, pour le budget comme pour le climat.</p></details><details><summary>Le plan compliqué</summary><p>Si le plan ne se comprend pas en dix secondes, il sera difficile à habiter.</p></details><details><summary>La démolition par réflexe</summary><p>Nous regardons toujours ce qui peut être gardé avant de proposer de raser.</p></details></div></div>
    <div class="vo-dark-fig" data-mask="up">${axo()}</div></div></section>`),
  cta(), footer(c),
];

const AWARDS = [["2024", "Équerre d'argent (démonstration)", "Médiathèque du Fleuve", "Prix fictif"], ["2023", "Prix régional de la réhabilitation", "Les Minoteries", "Jury fictif"], ["2022", "Nomination, Mies Young (démonstration)", "Maison pour trois", "Sélection fictive"], ["2021", "Grand prix du logement sobre", "Les Terrasses", "Prix fictif"]];
const PRESS = [["Mars 2025", "Revue Équerre (fictive)", "Halle Barral, la nef retrouvée", "Reportage"], ["Janv. 2025", "Chroniques du bâti (fictif)", "Entretien avec Camille Verdier", "Entretien"], ["Nov. 2024", "Le Quotidien des villes (fictif)", "Les Terrasses, un immeuble qui respire", "Critique"], ["Juin 2024", "Matière & Lumière (fictif)", "Dix équipements à visiter cette année", "Sélection"], ["Avr. 2023", "Architectures vives (fictif)", "Réhabiliter sans effacer", "Dossier"]];
const presse = (c) => [
  header(c, "presse"),
  pagehead("06", "Presse et distinctions", ["Ce qu'on", "en dit."], "Revues, prix et expositions. Tous les titres et jurys mentionnés ici sont fictifs et servent à la démonstration."),
  sec(`<section class="vo-awd pk-bleed"><div class="vo-wrap"><div class="vo-sechead"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Distinctions"])}</div></div>
    <table class="vo-tab" data-reveal><caption class="vo-sr">Distinctions reçues par l'agence</caption><thead><tr><th scope="col">Année</th><th scope="col">Distinction</th><th scope="col">Projet</th><th scope="col">Note</th></tr></thead><tbody>${AWARDS.map(([a, b, d, e]) => `<tr><td data-l="Année">${a}</td><th scope="row" data-l="Distinction">${b}</th><td data-l="Projet"><a href="/projet">${d}</a></td><td data-l="Note">${e}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="vo-prs pk-bleed"><div class="vo-wrap vo-prs-in"><div class="vo-prs-h"><div class="vo-h2" role="heading" aria-level="2" data-lines>${lines(["Dans la", "presse"])}</div><p class="vo-ix-note" data-reveal>Pour toute demande de visuels ou d'entretien : <a class="vo-u" href="mailto:presse@volume-architectes.example">presse@volume-architectes.example</a></p></div>
    <ol class="vo-prs-list">${PRESS.map(([d, p, t, k]) => `<li data-reveal><time>${d}</time><span class="vo-prs-p">${p}</span><b>${t}</b><em>${k}</em></li>`).join("")}</ol></div></section>`),
  cta(), footer(c),
];

const contact = (c) => [
  header(c, "contact"),
  pagehead("07", "Contact", ["Parlons", "de votre site."], "Une question, un terrain, un concours ? Écrivez-nous ; nous répondons sous cinq jours ouvrés."),
  sec(`<section class="vo-ci pk-bleed"><div class="vo-wrap vo-ci-in"><div data-reveal><h2 class="vo-h4">Agence</h2><address>12 quai Saint-Antoine<br>69002 Lyon</address></div><div data-reveal><h2 class="vo-h4">Écrire</h2><p><a class="vo-u" href="mailto:agence@volume-architectes.example">agence@volume-architectes.example</a></p></div><div data-reveal><h2 class="vo-h4">Horaires</h2><p>Du lundi au vendredi<br>9 h — 18 h</p></div></div></section>`),
  { type: "form", heading: "Écrire à l'agence", intro: "Décrivez votre projet en quelques lignes : lieu, programme, calendrier souhaité." },
  { type: "layout", children: [{ type: "map", props: { address: "12 quai Saint-Antoine, 69002 Lyon", zoom: 14, height: 380 } }] },
  footer(c),
];
const recherche = (c) => [
  header(c, "recherche"),
  pagehead("08", "Recherche", ["Chercher", "un projet."], "Un lieu, une typologie, un nom d'architecte."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] },
  sec(`<section class="vo-sug pk-bleed"><div class="vo-wrap"><p class="vo-no" data-reveal>Pistes</p><ul class="vo-sug-list" data-reveal><li><a href="/projets">Tous les projets ${arrow}</a></li><li><a href="/studio">Le studio ${arrow}</a></li><li><a href="/approche">Notre approche ${arrow}</a></li><li><a href="/presse">Presse et distinctions ${arrow}</a></li></ul></div></section>`),
  footer(c),
];
const introuvable = (c) => [
  header(c, "introuvable"),
  sec(`<section class="vo-404 pk-bleed"><div class="vo-wrap vo-404-in"><div><p class="vo-no">09 — Erreur</p><div class="vo-h1" role="heading" aria-level="1">${lines(["404", "Page vide."])}</div>
    <p class="vo-ph-sub">Cette page n'existe pas ou a changé d'adresse. Le vide est parfois voulu, rarement ici.</p><a class="vo-link" href="/">Retour à l'accueil ${arrow}</a></div>
    <div class="vo-404-fig">${plan(2)}</div></div></section>`),
  footer(c),
];

module.exports = {
  key: "volume", name: "Volume", version: "2.0.0", category: "architecture", tags: ["minimaliste", "editorial", "geometrique"], siteType: "Agence d'architecture", featured: true,
  concept: "Minimalisme spatial : béton clair et anthracite, une seule touche d'accent, rail vertical fixe, grand plan asymétrique, élévations et axonométries au trait, révélations par masque.",
  description: "Agence d'architecture : rail vertical fixe, plan en élévation pleine largeur, projets en colonnes décalées avec filtre par typologie, fiche technique, légende de plan, comparateur avant/après et index typographique.",
  brand: "Volume Architectes", modules: ["formulaires", "recherche"],
  dna: { header: "rail-vertical-gauche", hero: "plan-asymetrique-plein-ecran", grid: "projets-colonnes-decalees", motion: "revelation-par-masque", shapes: "rectangles-plans-et-cotes", rhythm: "alterne-asymetrique", signature: "projets-et-plan-de-masse" },
  tokens: {
    colors: { primary: "#a84a28", secondary: "#26282a", accent: "#2f6b5e", background: "#e9e6e0", surface: "#f5f3ef", text: "#26282a", muted: "#585a5b", success: "#2f6b3e", warning: "#7d5a0c", error: "#b3261e" },
    fonts: { heading: "font.inter-tight", body: "font.inter", button: "font.archivo", link: "font.inter-tight" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#26282a" },
    type: { h1: { size: 144, weight: 200, lineHeight: 0.9 }, h2: { size: 64, weight: 300, lineHeight: 0.98 } },
  },
  options: [
    { key: "accent", label: "Couleur d'accentuation", type: "choice", default: "terre", choices: [["terre", "Terre cuite"], ["vert", "Vert-de-gris"], ["ocre", "Ocre"]] },
    { key: "rail", label: "Position du rail", type: "choice", default: "gauche", choices: [["gauche", "À gauche"], ["haut", "En haut"]] },
    { key: "cotes", label: "Cotes décoratives", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "densite", label: "Densité de la grille", type: "choice", default: "aere", choices: [["aere", "Aérée"], ["compact", "Compacte"]] },
    { key: "anim", label: "Animations de masque", type: "choice", default: "on", choices: [["on", "Activées"], ["off", "Désactivées"]] },
  ],
  menu: [["Projets", "/projets"], ["Studio", "/studio"], ["Approche", "/approche"], ["Presse", "/presse"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: accueil }, { key: "projets", name: "Projets", render: projets }, { key: "projet", name: "Fiche projet", render: projet },
    { key: "studio", name: "Studio", render: studio }, { key: "approche", name: "Approche", render: approche }, { key: "presse", name: "Presse et distinctions", render: presse },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
