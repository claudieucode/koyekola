// Aides d'ILLUSTRATION (agent a08 : familles édition-librairie et jeux-vidéo) : générateurs de dessins SVG (widget « html », formes seulement, aria-hidden).
// Quatre parti pris repris des captures : halo + nom géant (« glow »), mot géant rogné sur bande grise (« crop »), objet 3D à côtes + cartes flottantes (« sphere », « torus », « terraces », « crystal »).
// Aucun script, aucune image externe, aucun style CSS arrondi ; couleurs en dur ; identifiants d'éléments préfixés pour éviter les collisions.
const { compact } = require("./aides-inspire");
const r1 = (n) => Math.round(n * 10) / 10;
const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const svg = (w, h, defs, corps) => {
  const s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${corps}</svg>`;
  if (s.length > 19500) throw new Error(`illustration trop longue (${s.length}) pour le widget HTML`);
  return s;
};
// dessin(k, large, etroit, style) : le(s) widget(s) html (variante étroite pour le mobile si fournie)
function dessin(k, large, etroit, st = {}) {
  const base = compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st });
  if (!etroit) return [k.W("html", { html: large }, base)];
  return [{ ...k.W("html", { html: large }, base), hideOn: ["mobile"] }, { ...k.W("html", { html: etroit }, base), hideOn: ["desktop", "tablet"] }];
}

// La liste blanche du widget « html » n'accepte que : svg g path circle rect line polyline polygon ellipse defs linearGradient radialGradient stop, et le nettoyeur SUPPRIME en pratique dégradés, filtres, masques et texte (20 000 caractères max) :
// stroke-opacity / fill-opacity / stroke-dasharray. Halos = dégradés radiaux ; lettres = tracés (alphabet géométrique ci-dessous) ; transparences = « opacity » ou couleurs mélangées.
const fond = (w, h, c1, c2, n = 10) => Array.from({ length: n }, (_, i) => `<rect x="0" y="${r1((h * i) / n)}" width="${w}" height="${r1(h / n + 1)}" fill="${mix(c1, c2, n > 1 ? i / (n - 1) : 0)}"/>`).join("");
const halo = (cx, cy, rx, ry, c, op, n = 9) => { const o1 = r1(1 - Math.pow(1 - Math.min(op, 0.95), 1 / n)); return Array.from({ length: n }, (_, i) => { const t = 1 - i / n; return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx * t)}" ry="${r1(ry * t)}" fill="${c}" opacity="${o1}"/>`; }).join(""); };
const fondu = (w, y0, y1, c, max = 0.9, n = 8) => Array.from({ length: n }, (_, i) => `<rect x="0" y="${r1(y0 + ((y1 - y0) * i) / n)}" width="${w}" height="${r1((y1 - y0) / n + 1)}" fill="${c}" opacity="${r1((max * (i + 1)) / n)}"/>`).join("");
// ── alphabet géométrique (capitales) : tracés dans une boîte de 140 de haut ───────────────────────────────────────────────────────────────────
const GL = {
  A: [100, "M8 140 L50 0 L92 140 M24 98 H76"], B: [100, "M14 140 V0 H58 C100 0 100 66 58 66 H14 M58 66 C104 66 104 140 58 140 H14"], C: [100, "M90 28 C70 -8 12 -2 10 70 C12 142 70 148 90 112"],
  E: [90, "M82 0 H14 V140 H82 M14 70 H66"], G: [100, "M90 28 C70 -8 12 -2 10 70 C12 142 78 148 90 104 V76 H54"], I: [44, "M22 0 V140"], J: [90, "M70 0 V98 C68 150 14 148 10 106"],
  L: [84, "M14 0 V140 H82"], M: [110, "M12 140 V0 L55 84 L98 0 V140"], N: [100, "M12 140 V0 L88 140 V0"], O: [104, "M52 0 A42 70 0 0 0 52 140 A42 70 0 0 0 52 0 Z"],
  P: [94, "M14 140 V0 H56 C98 0 98 76 56 76 H14"], R: [100, "M14 140 V0 H56 C98 0 98 76 56 76 H14 M56 76 L90 140"], S: [96, "M88 30 C74 -6 12 -4 12 38 C12 84 88 58 88 106 C88 150 22 150 8 112"],
  T: [100, "M4 0 H96 M50 0 V140"], U: [100, "M12 0 V92 C12 152 88 152 88 92 V0"], V: [100, "M6 0 L50 140 L94 0"], X: [100, "M10 0 L90 140 M90 0 L10 140"], Z: [96, "M8 0 H88 L8 140 H90"], " ": [60, ""],
};
const ACC = { "É": ["E", "M34 -34 L66 -62"], "Ê": ["E", "M24 -30 L48 -58 L72 -30"] };
// mot(id, texte, x, yBase, largeur, { trait, couleurs: [haut, bas, opacitéBas], gap }) : { defs, corps, hauteur } — le mot tient exactement dans `largeur`, ligne de base en yBase (peut dépasser la zone : rognage)
function mot(id, texte, x, yBase, largeur, o = {}) {
  const gap = o.gap ?? 34; let pos = 0; const items = [];
  for (const ch of texte) { const base = ACC[ch] ? ACC[ch][0] : ch, g = GL[base]; if (!g) continue; if (g[1] || ACC[ch]) items.push([pos, (g[1] + (ACC[ch] ? " " + ACC[ch][1] : "")).trim()]); pos += g[0] + gap; }
  const U = pos - gap, s = largeur / U, ky = o.etire ?? 1, sw = o.trait ?? 26;
  const defs = "";
  const corps = `<g transform="translate(${r1(x)} ${r1(yBase - 140 * s * ky)}) scale(${r1000(s)} ${r1000(s * ky)})" fill="none" stroke="${o.couleurs[0]}" stroke-width="${sw}" stroke-linecap="butt" stroke-linejoin="miter">${items.map(([px, d]) => `<path transform="translate(${px} 0)" d="${d}"/>`).join("")}</g>`;
  return { defs, corps, hauteur: 140 * s * ky };
}
const r1000 = (n) => Math.round(n * 1000) / 1000;

// ── cartes flottantes inclinées (étiquettes dessinées : icône + deux traits, sans texte) ───────────────────────────────────────────────────────
function cartes(liste, o = {}) {
  return liste.map(([x, y, rot, w, h, ic]) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect width="${w}" height="${h}" fill="${o.fond || "#16161d"}" stroke="${o.bord || "#ffffff"}" stroke-width="1.5"/><rect x="14" y="${r1(h / 2 - 9)}" width="18" height="18" fill="${ic || o.ic || "#ffffff"}"/><rect x="46" y="${r1(h / 2 - 9)}" width="${r1((w - 70) * 0.9)}" height="4" fill="${o.trait || "#ffffff"}"/><rect x="46" y="${r1(h / 2 + 3)}" width="${r1((w - 70) * 0.55)}" height="4" fill="${o.trait || "#ffffff"}" opacity="0.5"/></g>`).join("");
}

// ── « glow » : halo lumineux (dégradés radiaux) + rideaux verticaux + NOM GÉANT dégradé (capture « Amplifyed ») ──────────────────────────────────
// o : bg [haut, bas], blobs [[cx, cy, rx, ry, couleur, opacité]], stries { c, op, n, x0, x1, foyer: [x, y] }, mot, mot_x, mot_l, mot_y (ligne de base), mot_fill [haut, bas, opacitéBas], avant, apres
function glow(id, w, h, o) {
  const al = alea(o.graine || 7);
  let corps = fond(w, h, o.bg[0], o.bg[1], 12);
  o.blobs.forEach(([cx, cy, rx, ry, c, op]) => { corps += halo(cx, cy, rx, ry, c, op); });
  if (o.stries) {
    const s = o.stries, [fx, fy] = s.foyer || [w * 0.2, h * 0.7]; let rects = "";
    for (let i = 0; i < s.n; i++) { const x = s.x0 + ((s.x1 - s.x0) * i) / s.n, d = Math.hypot(x - fx, (fy - h * 0.3) * 0.5) / (w * 0.5), op = (0.03 + al() * s.op * 0.55) * Math.max(0, 1 - d); if (op > 0.02) rects += `<rect x="${r1(x)}" y="0" width="${r1(2 + al() * 9)}" height="${h}" fill="${s.c}" opacity="${r1(op)}"/>`; }
    corps += rects;
  }
  corps += o.avant || "";
  if (o.mot) { const m = mot(`${id}t`, o.mot, o.mot_x ?? w * 0.05, o.mot_y, o.mot_l ?? w * 0.9, { couleurs: o.mot_fill, trait: o.trait, etire: o.etire }); corps += m.corps + fondu(w, o.mot_y - m.hauteur * 0.6, h, o.bg[1], 0.85); }
  return svg(w, h, "", corps + (o.apres || ""));
}

// ── « crop » : grand mot rogné par le bas sur un aplat, avec un point de couleur (capture « Horizon ») + éléments dessinés devant ───────────────────
function crop(id, w, h, o) {
  const m = mot(`${id}t`, o.mot, o.mot_x ?? w * 0.05, o.mot_y, o.mot_l ?? w * 0.9, { couleurs: [o.fill, o.fill, 1], trait: o.trait, gap: o.gap, etire: o.etire });
  return svg(w, h, (o.defs || "") + m.defs, `<rect width="${w}" height="${h}" fill="${o.bg}"/>${o.avant || ""}${m.corps}${o.point ? `<rect x="${r1(o.point[1] - o.point[3])}" y="${r1(o.point[2] - o.point[3])}" width="${r1(o.point[3] * 2)}" height="${r1(o.point[3] * 2)}" fill="${o.point[0]}"/>` : ""}${o.apres || ""}`);
}

// ── objet 3D 1 : sphère à côtes diagonales (capture « Timon »), côtes tracées jusqu'au bord du disque ─────────────────────────────────────────────
function sphere(id, w, h, o) {
  const { cx, cy, r } = o, N = o.n || 15, th = ((o.rot || -18) * Math.PI) / 180, u = [Math.cos(th), Math.sin(th)], nv = [-Math.sin(th), Math.cos(th)];
  let ribs = "";
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), d = (t - 0.5) * 2 * r * 0.93, half = Math.sqrt(Math.max(0, r * r - d * d)) * 0.985, bul = half * 0.24;
    const a = [cx + nv[0] * d - u[0] * half, cy + nv[1] * d - u[1] * half], b = [cx + nv[0] * d + u[0] * half, cy + nv[1] * d + u[1] * half];
    const q = [(a[0] + b[0]) / 2 + nv[0] * bul, (a[1] + b[1]) / 2 + nv[1] * bul], c = mix(o.rib[1], o.rib[0], Math.max(0, 1 - Math.abs(t - 0.3) * 1.6));
    ribs += `<path d="M${r1(a[0])} ${r1(a[1])} Q${r1(q[0])} ${r1(q[1])} ${r1(b[0])} ${r1(b[1])}" fill="none" stroke="${c}" stroke-width="${r1(r * 0.118)}"/><path d="M${r1(a[0] + nv[0] * -6)} ${r1(a[1] - 6 * nv[1])} Q${r1(q[0] - 6 * nv[0])} ${r1(q[1] - 6 * nv[1])} ${r1(b[0] - 6 * nv[0])} ${r1(b[1] - 6 * nv[1])}" fill="none" stroke="${mix(c, "#ffffff", 0.45)}" stroke-width="2"/>`;
  }
  const lum = [0.9, 0.7, 0.5].map((t, i) => `<circle cx="${r1(cx - r * 0.2 * (1 - t))}" cy="${r1(cy - r * 0.22 * (1 - t))}" r="${r1(r * (0.5 + 0.2 * i))}" fill="#ffffff" opacity="0.025"/>`).join("");
  return svg(w, h, "", `${fond(w, h, o.bg[0], o.bg[1], 6)}${halo(cx, cy, r * 1.55, r * 1.55, o.halo, 0.55)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.cuve || o.bg[1]}"/>${ribs}${lum}<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.96)}" fill="none" stroke="#000000" stroke-width="${r1(r * 0.1)}" opacity="0.3"/>${o.cartes || ""}`);
}

// ── objet 3D 2 : anneau (tore) néon incliné ───────────────────────────────────────────────────────────────────────────────────────────────────
function torus(id, w, h, o) {
  const { cx, cy, R } = o, M = 14;
  let tube = "";
  for (let i = 0; i < M; i++) {
    const t = i / (M - 1), rx = R * (1 - 0.44 * t), ry = rx * 0.4, c = t < 0.5 ? mix(o.c1, o.c2, t * 2) : mix(o.c2, o.c1, (t - 0.5) * 2);
    tube += `<ellipse cx="${cx}" cy="${r1(cy + t * R * 0.08)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="none" stroke="${c}" stroke-width="${r1(R * 0.05)}"/>`;
  }
  const g2 = `<g transform="rotate(62 ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${r1(R * 0.62)}" ry="${r1(R * 0.24)}" fill="none" stroke="${o.c3}" stroke-width="${r1(R * 0.06)}"/><ellipse cx="${cx}" cy="${cy}" rx="${r1(R * 0.62)}" ry="${r1(R * 0.24)}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4"/></g>`;
  return svg(w, h, "", `${fond(w, h, o.bg[0], o.bg[1], 6)}${halo(cx, cy, R * 1.5, R * 0.9, o.c2, 0.5)}<g transform="rotate(${o.rot || -12} ${cx} ${cy})">${tube}${g2}</g>${o.cartes || ""}`);
}

// ── objet 3D 3 : gâteau de terrasses (relief étagé) avec chemin de petits points et cinq jalons carrés ───────────────────────────────────────────
function terraces(id, w, h, o) {
  const { cx, by, rx0, N, dh } = o;
  let corps = `<rect width="${w}" height="${h}" fill="${o.bg}"/>`, pts = [];
  for (let i = 0; i < N; i++) {
    const y = by - i * dh, rx = rx0 * (1 - (i / (N + 0.5)) * 0.78), ry = rx * 0.3, t = i / (N - 1);
    corps += `<path d="M${r1(cx - rx)} ${r1(y)} L${r1(cx - rx)} ${r1(y + dh)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(y + dh)} L${r1(cx + rx)} ${r1(y)} Z" fill="${mix(o.mur[0], o.mur[1], t)}"/><ellipse cx="${cx}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${mix(o.dessus[0], o.dessus[1], t)}" stroke="${o.contour}" stroke-width="1.5"/>`;
    if (i < 5) { const a = 2.2 + i * 1.15; pts.push([r1(cx + rx * 0.72 * Math.cos(a)), r1(y + ry * 0.72 * Math.sin(a))]); }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let j = 1; j < 6; j++) { const t = j / 6; corps += `<rect x="${r1(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t - 2)}" y="${r1(pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t - 2)}" width="4" height="4" fill="${o.jalon}"/>`; }
  corps += pts.map((p, i) => `<rect x="${r1(p[0] - 9)}" y="${r1(p[1] - 9)}" width="18" height="18" fill="${o.jalon}"/><rect x="${r1(p[0] - 3)}" y="${r1(p[1] - 3)}" width="6" height="6" fill="${i === 4 ? o.jalon : o.bg}"/>`).join("");
  return svg(w, h, "", corps + (o.cartes || ""));
}

// ── objet 3D 4 : cristal (grappe de prismes à facettes) sur grille de sol, avec halo ────────────────────────────────────────────────────────────
function prisme(x, y, pw, ph, th, rot, c) {
  const BL = [x - pw / 2, y], BM = [x, y + pw * 0.16], BR = [x + pw / 2, y], TL = [x - pw / 2, y - ph], TM = [x, y - ph + pw * 0.16], TR = [x + pw / 2, y - ph], T = [x, y - ph - th];
  const f = (pts, col) => `<polygon points="${pts.map((p) => p.map(r1).join(",")).join(" ")}" fill="${col}" stroke="${c[4]}" stroke-width="1"/>`;
  return `<g transform="rotate(${rot} ${r1(x)} ${r1(y)})">${f([BL, BM, TM, TL], c[0])}${f([BM, BR, TR, TM], c[1])}${f([TL, TM, T], c[2])}${f([TM, TR, T], c[3])}</g>`;
}
function crystal(id, w, h, o) {
  const ligne = mix(o.bg[1], o.halo, 0.3);
  let sol = "";
  for (let i = 0; i < 7; i++) { const y = r1(h * 0.78 + i * i * 3.2 + i * 6); sol += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${ligne}" stroke-width="1"/>`; }
  for (let i = -6; i <= 6; i++) sol += `<line x1="${r1(w / 2 + i * 12)}" y1="${r1(h * 0.78)}" x2="${r1(w / 2 + i * w * 0.14)}" y2="${h}" stroke="${ligne}" stroke-width="1"/>`;
  const col = (t) => [mix(o.f[0], o.f[1], t), mix(o.f[1], o.f[2], t), mix(o.f[2], o.f[3], t), mix(o.f[3], "#ffffff", 0.25 + t * 0.2), o.f[3]];
  const P = [[0.30, 0.88, 0.14, 0.34, 0.14, -24, 0.1], [0.70, 0.9, 0.15, 0.3, 0.13, 22, 0.3], [0.5, 0.92, 0.2, 0.62, 0.2, 0, 0.6], [0.36, 0.95, 0.12, 0.22, 0.1, -9, 0.9], [0.63, 0.95, 0.12, 0.26, 0.11, 11, 0.4]];
  const pr = P.map(([px, py, pw, ph, th, rot, t]) => prisme(r1(w * px), r1(h * py), r1(w * pw), r1(h * ph), r1(h * th), rot, col(t))).join("");
  return svg(w, h, "", `${fond(w, h, o.bg[0], o.bg[1], 6)}${halo(w / 2, h * 0.55, w * 0.55, w * 0.55, o.halo, 0.55)}${sol}${pr}${o.cartes || ""}`);
}

// ── éléments dessinés propres à chaque modèle ────────────────────────────────────────────────────────────────────────────────────────────────
const pix = (rows, x0, y0, p, fill) => `<path fill="${fill}" d="${rows.map((row, j) => [...row].map((c, i) => (c === "1" ? `M${x0 + i * p} ${y0 + j * p}h${p}v${p}h-${p}z` : "")).join("")).join("")}"/>`;
const INVADER = ["00100000100", "00010001000", "00111111100", "01101110110", "11111111111", "10111111101", "10100000101", "00011011000"];
const NUAGE = ["0011100", "0111110", "1111111"];
// rangée de dos de livres (hauteurs et couleurs variées), posés sur la ligne y
function dos(w, y, cols, graine, hmin = 70, hmax = 150, penche = true) {
  const al = alea(graine); let x = 14, s = "";
  while (x < w - 30) { const bw = r1(18 + al() * 26), bh = r1(hmin + al() * (hmax - hmin)), c = cols[Math.floor(al() * cols.length)]; s += `<rect x="${r1(x)}" y="${r1(y - bh)}" width="${bw}" height="${bh}" fill="${c}"/><rect x="${r1(x + 3)}" y="${r1(y - bh + 12)}" width="${r1(bw - 6)}" height="3" fill="${mix(c, "#ffffff", 0.5)}"/><rect x="${r1(x + 3)}" y="${r1(y - 22)}" width="${r1(bw - 6)}" height="3" fill="${mix(c, "#ffffff", 0.3)}"/>`; x += bw + (penche && al() < 0.08 ? 40 : 2); }
  return s;
}
module.exports = { r1, alea, mix, svg, dessin, fond, halo, fondu, mot, cartes, glow, crop, sphere, torus, terraces, crystal, pix, INVADER, NUAGE, dos };
