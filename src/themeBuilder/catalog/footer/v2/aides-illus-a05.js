// Illustrations SVG vectorielles — familles « Bijouterie et horlogerie » (ft2-326 à 331) et « Gastronomie et épicerie fine » (ft2-332 à 337).
// Chaque fonction renvoie un <svg> décoratif (aria-hidden, formes seulement). La liste blanche du widget HTML n'accepte que : svg g path circle rect line polyline polygon ellipse defs lineargradient radialgradient stop
// (ni <text>, ni dégradé, ni filtre, ni masque, ni motif, ni stroke-opacity / stroke-dasharray) : les halos sont des ellipses translucides empilées, les lettres monumentales sont dessinées en traits.
// Le CSS de la plateforme impose height:auto aux SVG : la hauteur suit la largeur (viewBox).
const r1 = (n) => Math.round(n * 10) / 10;
const ouvre = (vb) => `<svg viewBox="${vb}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">`;
const pts = (a) => a.map(([x, y]) => `${r1(x)},${r1(y)}`).join(" ");
const poly = (a, at) => `<polygon points="${pts(a)}" ${at}/>`;
const ligne = (x1, y1, x2, y2, at) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" ${at}/>`;
const cercle = (cx, cy, r, at) => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" ${at}/>`;
let _n = 0;
// halo : ellipse à dégradé radial (lumière floue sans filtre)
const halo = (cx, cy, rx, ry, couleur, op = 0.8) => { let o = ""; for (let i = 0; i < 7; i++) { const f = 1 - i * 0.14; o += `<ellipse cx="${cx}" cy="${cy}" rx="${r1(rx * f)}" ry="${r1(ry * f)}" fill="${couleur}" opacity="${r1((op / 7) * 10) / 10 || 0.05}"/>`; } return o; };
function roue(cx, cy, r, dents, h, at, trou) {
  const p = [];
  for (let i = 0; i < dents; i++) {
    const a0 = (i / dents) * Math.PI * 2, a1 = ((i + 0.3) / dents) * Math.PI * 2, a2 = ((i + 0.5) / dents) * Math.PI * 2, a3 = ((i + 0.8) / dents) * Math.PI * 2;
    p.push([cx + Math.cos(a0) * r, cy + Math.sin(a0) * r], [cx + Math.cos(a1) * (r + h), cy + Math.sin(a1) * (r + h)], [cx + Math.cos(a2) * (r + h), cy + Math.sin(a2) * (r + h)], [cx + Math.cos(a3) * r, cy + Math.sin(a3) * r]);
  }
  return poly(p, at) + (trou ? cercle(cx, cy, trou, at) : "");
}

// ── alphabet géométrique à traits épais : mots monumentaux rognés en bas ──
const GL = {
  A: "M0,6 L2,0 L4,6 M0.9,4 L3.1,4", T: "M0,0.6 L4,0.6 M2,0.6 L2,6", E: "M4,0.6 L0.6,0.6 L0.6,5.4 L4,5.4 M0.6,3 L3.2,3", L: "M0.6,0 L0.6,5.4 L4,5.4", I: "M2,0 L2,6",
  R: "M0.6,6 L0.6,0.6 L3.2,0.6 L3.8,1.2 L3.8,2.6 L3.2,3.2 L0.6,3.2 M2.2,3.2 L3.8,6", C: "M4,1.4 L3.2,0.6 L0.8,0.6 L0.6,1.2 L0.6,4.8 L0.8,5.4 L3.2,5.4 L4,4.6",
  B: "M0.6,0.6 L0.6,5.4 L3.2,5.4 L3.8,4.8 L3.8,3.6 L3.2,3 L0.6,3 M0.6,0.6 L3.2,0.6 L3.8,1.2 L3.8,2.4 L3.2,3", N: "M0.6,6 L0.6,0.6 L3.4,5.4 L3.4,0", G: "M4,1.4 L3.2,0.6 L0.8,0.6 L0.6,1.2 L0.6,4.8 L0.8,5.4 L3.2,5.4 L3.8,4.8 L3.8,3.2 L2.2,3.2",
};
// motMonument(mot, couleur, rognage) : lettres angulaires ; le bas est coupé par le cadre (rognage = part visible de la hauteur, 0.6 à 0.9)
function motMonument(mot, couleur, visible = 0.72, epais = 1.25) {
  const n = mot.length, w = n * 5.4 - 1.4;
  let s = ouvre(`0 -0.4 ${r1(w)} ${r1(6.8 * visible)}`);
  [...mot].forEach((c, i) => { s += `<path d="${GL[c]}" transform="translate(${r1(i * 5.4)} 0)" fill="none" stroke="${couleur}" stroke-width="${epais}" stroke-linejoin="miter" stroke-linecap="butt"/>`; });
  return s + `</svg>`;
}

// ── pastilles hexagonales d'icône (comme les « marques du groupe » de la capture) ──
const GLYPHES = {
  gemme: (c) => poly([[20, 26], [44, 26], [51, 34], [32, 51], [13, 34]], `fill="none" stroke="${c}" stroke-width="2.4"`) + ligne(13, 34, 51, 34, `stroke="${c}" stroke-width="1.6"`) + ligne(26, 26, 32, 34, `stroke="${c}" stroke-width="1.6"`) + ligne(38, 26, 32, 34, `stroke="${c}" stroke-width="1.6"`),
  cadran: (c) => cercle(32, 32, 15, `fill="none" stroke="${c}" stroke-width="2.4"`) + ligne(32, 32, 32, 21, `stroke="${c}" stroke-width="2.6"`) + ligne(32, 32, 40, 36, `stroke="${c}" stroke-width="2.6"`) + cercle(32, 32, 2, `fill="${c}"`),
  rouage: (c) => roue(32, 32, 10, 8, 5, `fill="none" stroke="${c}" stroke-width="2"`, 3),
  bague: (c) => cercle(32, 38, 12, `fill="none" stroke="${c}" stroke-width="3"`) + poly([[28, 20], [36, 20], [39, 25], [32, 28], [25, 25]], `fill="${c}"`),
  bocal: (c) => `<rect x="21" y="26" width="22" height="22" fill="none" stroke="${c}" stroke-width="2.4"/><rect x="19" y="19" width="26" height="7" fill="${c}"/><rect x="26" y="33" width="12" height="9" fill="${c}"/>`,
  feuille: (c) => `<path d="M 16 46 C 16 24 32 16 48 16 C 48 36 40 48 16 46 Z" fill="none" stroke="${c}" stroke-width="2.4"/>` + ligne(16, 46, 38, 26, `stroke="${c}" stroke-width="2"`),
  fromage: (c) => poly([[12, 28], [52, 36], [52, 47], [12, 47]], `fill="none" stroke="${c}" stroke-width="2.4"`) + cercle(24, 41, 3, `fill="${c}"`) + cercle(38, 42, 2.4, `fill="${c}"`) + ligne(12, 28, 52, 36, `stroke="${c}" stroke-width="2.4"`),
  bouteille: (c) => `<rect x="28" y="14" width="8" height="14" fill="${c}"/>` + poly([[28, 28], [36, 28], [42, 38], [42, 50], [22, 50], [22, 38]], `fill="none" stroke="${c}" stroke-width="2.4"`),
  epi: (c) => ligne(32, 50, 32, 16, `stroke="${c}" stroke-width="2.2"`) + [20, 28, 36].map((y) => `<ellipse cx="25" cy="${y}" rx="3.6" ry="6" fill="${c}" transform="rotate(-28 25 ${y})"/><ellipse cx="39" cy="${y}" rx="3.6" ry="6" fill="${c}" transform="rotate(28 39 ${y})"/>`).join(""),
  tomate: (c) => cercle(32, 36, 16, `fill="none" stroke="${c}" stroke-width="2.4"`) + poly([[32, 20], [37, 26], [32, 24], [27, 26]], `fill="${c}"`) + ligne(32, 14, 32, 22, `stroke="${c}" stroke-width="2.4"`),
};
function hexBadge(glyphe, fond, trait, bord) {
  return ouvre("0 0 64 64") + poly([[32, 2], [58, 17], [58, 47], [32, 62], [6, 47], [6, 17]], `fill="${fond}" stroke="${bord || fond}" stroke-width="2"`) + (GLYPHES[glyphe] || GLYPHES.gemme)(trait) + `</svg>`;
}

// ═══ Capture « halo, marque dessinée, colonnes, pastilles » ═══
// ft2-326 : joaillerie, halo champagne sur bleu nuit, monogramme-brillant dessiné
function logoBrillant(champ, ivoire) {
  const t = `fill="none" stroke="${champ}" stroke-width="3" stroke-linejoin="miter"`, f = `fill="none" stroke="${ivoire}" stroke-width="1.6" stroke-linejoin="miter"`;
  return ouvre("0 0 420 260") + halo(210, 120, 210, 130, champ, 0.55) + halo(210, 130, 120, 80, "#ffffff", 0.35) +
    poly([[140, 62], [280, 62], [322, 118], [210, 236], [98, 118]], `fill="#232849" stroke="${champ}" stroke-width="3"`) + poly([[140, 62], [280, 62], [322, 118], [98, 118]], t) +
    poly([[170, 62], [250, 62], [210, 118]], f) + poly([[170, 62], [140, 118], [210, 118]], f) + poly([[250, 62], [280, 118], [210, 118]], f) + poly([[98, 118], [140, 118], [210, 236]], f) + poly([[322, 118], [280, 118], [210, 236]], f) + ligne(210, 118, 210, 236, f) +
    ligne(210, 20, 210, 44, t) + ligne(120, 36, 136, 50, f) + ligne(300, 36, 284, 50, f) + cercle(70, 190, 3, `fill="${champ}"`) + cercle(350, 70, 3, `fill="${ivoire}"`) + cercle(360, 190, 2.4, `fill="${champ}"`) + `</svg>`;
}
// ft2-330 : horlogerie, halo turquoise sur indigo, cadran-logo
function logoCadran(turq, glace, fond) {
  let s = ouvre("0 0 420 280") + halo(210, 140, 210, 140, turq, 0.5);
  s += roue(210, 140, 92, 24, 14, `fill="none" stroke="${turq}" stroke-width="2.4"`, 0) + cercle(210, 140, 86, `fill="${fond}" stroke="${glace}" stroke-width="2"`);
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, g = i % 5 === 0; s += ligne(210 + Math.cos(a) * (g ? 66 : 75), 140 + Math.sin(a) * (g ? 66 : 75), 210 + Math.cos(a) * 82, 140 + Math.sin(a) * 82, `stroke="${g ? turq : glace}" stroke-width="${g ? 4 : 1.2}"`); }
  s += ligne(210, 140, 210, 86, `stroke="${glace}" stroke-width="5"`) + ligne(210, 140, 250, 160, `stroke="${glace}" stroke-width="3.6"`) + ligne(210, 140, 180, 170, `stroke="${turq}" stroke-width="1.6"`) + cercle(210, 140, 7, `fill="${turq}"`);
  s += roue(60, 220, 34, 12, 9, `fill="none" stroke="${glace}" stroke-width="1.8"`, 8) + roue(366, 52, 30, 10, 8, `fill="none" stroke="${turq}" stroke-width="1.8"`, 7) + roue(372, 232, 20, 8, 6, `fill="none" stroke="${glace}" stroke-width="1.6"`, 5);
  return s + `</svg>`;
}
// ft2-332 : épicerie, halo tomate, logo tomate + auvent
function logoTomate(tomate, creme, vert) {
  return ouvre("0 0 420 260") + halo(210, 130, 210, 130, tomate, 0.55) + halo(210, 140, 110, 80, "#ffb08f", 0.35) +
    cercle(210, 142, 84, `fill="${tomate}" stroke="${creme}" stroke-width="5"`) + `<path d="M 160 92 Q 210 130 260 92" fill="none" stroke="#a32410" stroke-width="3"/>` + ligne(210, 62, 210, 100, `stroke="${vert}" stroke-width="8"`) +
    poly([[210, 100], [246, 86], [232, 112], [260, 126], [222, 124], [210, 148], [198, 124], [160, 126], [188, 112], [174, 86]], `fill="${vert}" stroke="${creme}" stroke-width="2.4"`) +
    poly([[40, 232], [110, 188], [110, 232]], `fill="#f2c24f" stroke="${creme}" stroke-width="3"`) + cercle(84, 218, 4, `fill="${creme}"`) +
    `<path d="M 330 232 L 330 196 Q 330 184 342 184 L 354 184 Q 366 184 366 196 L 366 232 Z" fill="none" stroke="${creme}" stroke-width="3"/><rect x="340" y="164" width="16" height="20" fill="${creme}"/></svg>`;
}
// ft2-336 : producteur, halo or vert + collines à sillons ondulés (bande ondulée basse)
function collinesSillons(foret, vert1, vert2, sillon, ciel, soleil) {
  let s = ouvre("0 0 1200 250") + `<rect width="1200" height="250" fill="${ciel}"/>` + halo(980, 70, 260, 130, soleil, 0.7) + cercle(980, 70, 36, `fill="${soleil}"`);
  [[vert1, 120], [vert2, 150], ["#3f7747", 182], [foret, 214]].forEach(([c, y0]) => {
    s += `<path d="M 0 ${y0} Q 300 ${y0 - 50} 620 ${y0 - 10} T 1200 ${y0 - 26} L 1200 250 L 0 250 Z" fill="${c}"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M 0 ${y0 + 8 + i * 5} Q 300 ${y0 - 42 + i * 5} 620 ${y0 - 2 + i * 5} T 1200 ${y0 - 18 + i * 5}" fill="none" stroke="${sillon}" stroke-width="1" opacity="0.25"/>`;
  });
  s += poly([[150, 112], [150, 84], [188, 60], [226, 84], [226, 112]], `fill="#c2562f"`) + `<rect x="176" y="88" width="24" height="24" fill="${foret}"/>`;
  for (let i = 0; i < 8; i++) { const x = 290 + i * 34; s += `<rect x="${x - 2}" y="${104 - Math.sin(i * 0.6) * 5}" width="4" height="14" fill="${foret}"/>` + poly([[x, 80 - Math.sin(i * 0.6) * 5], [x + 11, 108 - Math.sin(i * 0.6) * 5], [x - 11, 108 - Math.sin(i * 0.6) * 5]], `fill="${vert2}"`); }
  return s + `</svg>`;
}

// ═══ Capture « noir, très grands mots légers, grande marque géométrique rognée » ═══
// ft2-327 : arcs et losange art déco, rose pâle sur noir, rogné par le bas
function marqueDeco(teinte, teinte2) {
  let s = ouvre("0 0 600 360");
  [300, 230, 160].forEach((r, i) => { s += `<path d="M ${300 - r} 360 L ${300 - r} 330 A ${r} ${r} 0 0 1 ${300 + r} 330 L ${300 + r} 360" fill="none" stroke="${i % 2 ? teinte2 : teinte}" stroke-width="${i === 0 ? 26 : 14}"/>`; });
  s += poly([[300, 150], [360, 230], [300, 310], [240, 230]], `fill="${teinte}"`) + poly([[300, 182], [334, 230], [300, 278], [266, 230]], `fill="${teinte2}"`) + `<rect x="60" y="300" width="60" height="60" fill="${teinte2}"/><rect x="480" y="300" width="60" height="60" fill="${teinte2}"/>`;
  return s + `</svg>`;
}
// ft2-329 : couronne de laurier et losange de poinçon, demi-sceau montant du bas, ton sur ton
function marqueLaurier(teinte, teinte2) {
  let s = ouvre("0 0 600 340") + `<path d="M 40 340 A 260 260 0 0 1 560 340" fill="none" stroke="${teinte}" stroke-width="10"/><path d="M 70 340 A 230 230 0 0 1 530 340" fill="none" stroke="${teinte2}" stroke-width="3"/>`;
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (1 + (i + 0.6) / 11.8), x = 300 + Math.cos(a) * 210, y = 340 + Math.sin(a) * 210;
    s += `<path d="M ${r1(x)} ${r1(y)} q 40 -18 60 4 q -34 28 -60 -4 z" fill="${i % 2 ? teinte2 : teinte}" transform="rotate(${r1((a * 180) / Math.PI + 90)} ${r1(x)} ${r1(y)})"/>`;
  }
  s += poly([[300, 130], [380, 220], [300, 310], [220, 220]], `fill="${teinte}"`) + poly([[300, 166], [350, 220], [300, 274], [250, 220]], `fill="none" stroke="${teinte2}" stroke-width="4"`);
  return s + `</svg>`;
}
// ft2-335 : verre à pied géométrique, halo orange derrière, rogné en bas
function marqueVerre(orange, teinte, fond) {
  return ouvre("0 0 420 520") + halo(210, 200, 210, 220, orange, 0.55) + halo(210, 140, 100, 120, "#ffb27a", 0.35) +
    `<path d="M 90 40 L 330 40 L 330 190 A 120 120 0 0 1 90 190 Z" fill="${fond}" stroke="${orange}" stroke-width="8"/>` + `<path d="M 100 170 L 320 170 L 320 190 A 110 110 0 0 1 100 190 Z" fill="${orange}" opacity="0.8"/>` + ligne(120, 60, 120, 150, `stroke="${teinte}" stroke-width="5"`) +
    `<rect x="196" y="310" width="28" height="170" fill="${teinte}"/>` + `<path d="M 100 520 L 100 490 L 320 490 L 320 520" fill="none" stroke="${orange}" stroke-width="10"/></svg>`;
}
// ft2-337 : voûtes concentriques et casier de bouteilles (ronds), grenat sur noir, rogné en bas
function marqueVoute(grenat, sable, fond) {
  let s = ouvre("0 0 600 360");
  [290, 238, 186, 134].forEach((r, i) => { s += `<path d="M ${300 - r} 360 L ${300 - r} 250 A ${r} ${r} 0 0 1 ${300 + r} 250 L ${300 + r} 360" fill="${i % 2 ? fond : "none"}" stroke="${i % 2 ? sable : grenat}" stroke-width="${i % 2 ? 4 : 20}"/>`; });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) s += cercle(228 + c * 29 + (r % 2 ? 14 : 0), 322 - r * 28, 11, `fill="${(r + c) % 2 ? grenat : fond}" stroke="${sable}" stroke-width="2.4"`);
  return s + `</svg>`;
}

// ═══ Capture « carte d'appel avec couverture de guide inclinée » ═══
// couverture(opts) : un livret incliné qui déborde de la carte
function livret(o) {
  const { fond, bord, accent, clair, angle, motif } = o;
  let s = ouvre("0 0 340 420") + `<g transform="rotate(${angle} 170 210)">` + `<rect x="46" y="30" width="248" height="360" fill="${bord}"/><rect x="34" y="18" width="248" height="360" fill="${fond}" stroke="${bord}" stroke-width="2"/><rect x="34" y="18" width="14" height="360" fill="${accent}"/>`;
  s += `<rect x="70" y="46" width="170" height="12" fill="${clair}"/><rect x="70" y="68" width="120" height="12" fill="${clair}"/>`;
  s += motif(158, 196, accent, clair, fond);
  s += `<rect x="70" y="316" width="196" height="38" fill="${clair}"/><rect x="82" y="330" width="90" height="10" fill="${fond}"/><rect x="84" y="332" width="0" height="0" fill="none"/>`;
  return s + `</g></svg>`;
}
const MOTIFS = {
  pierres: (cx, cy, a, c, f) => poly([[cx - 50, cy - 40], [cx + 50, cy - 40], [cx + 78, cy], [cx, cy + 80], [cx - 78, cy]], `fill="none" stroke="${a}" stroke-width="4"`) + ligne(cx - 78, cy, cx + 78, cy, `stroke="${a}" stroke-width="3"`) + ligne(cx - 20, cy - 40, cx, cy, `stroke="${c}" stroke-width="2"`) + ligne(cx + 20, cy - 40, cx, cy, `stroke="${c}" stroke-width="2"`),
  calibre: (cx, cy, a, c, f) => roue(cx, cy, 52, 18, 10, `fill="none" stroke="${a}" stroke-width="3"`, 0) + cercle(cx, cy, 30, `fill="none" stroke="${c}" stroke-width="2"`) + cercle(cx, cy, 8, `fill="${a}"`) + roue(cx + 66, cy + 52, 24, 10, 7, `fill="none" stroke="${c}" stroke-width="2.4"`, 6),
  menu: (cx, cy, a, c, f) => cercle(cx, cy, 72, `fill="${c}"`) + cercle(cx, cy, 56, `fill="none" stroke="${f}" stroke-width="3"`) + cercle(cx, cy, 36, `fill="${a}"`) + cercle(cx - 12, cy - 8, 6, `fill="${f}"`) + cercle(cx + 10, cy + 8, 5, `fill="${f}"`) + `<path d="M 100 146 q 6 -16 24 -22 q -2 18 -24 22 z" fill="${a}"/>`,
  catalogue: (cx, cy, a, c, f) => `<rect x="${cx - 62}" y="${cy - 30}" width="46" height="70" fill="${c}"/><rect x="${cx - 66}" y="${cy - 44}" width="54" height="14" fill="${a}"/><rect x="${cx - 10}" y="${cy - 8}" width="54" height="48" fill="${a}"/><rect x="${cx - 14}" y="${cy - 20}" width="62" height="12" fill="${c}"/><circle cx="${cx + 64}" cy="${cy + 20}" r="24" fill="${c}"/><path d="M ${cx + 64} ${cy - 6} q 4 -14 16 -16" fill="none" stroke="${a}" stroke-width="4"/>`,
};
const livretGuide = (c) => livret({ ...c, motif: MOTIFS.pierres });
const livretCalibre = (c) => livret({ ...c, motif: MOTIFS.calibre });
const livretMenu = (c) => livret({ ...c, motif: MOTIFS.menu });
const livretCatalogue = (c) => livret({ ...c, motif: MOTIFS.catalogue });

// nettoyage : la liste blanche ignore stroke-opacity / fill-opacity / stroke-dasharray
const nettoie = (s) => s.replace(/ stroke-opacity="([^"]*)"/g, ' opacity="$1"').replace(/ fill-opacity="[^"]*"/g, "").replace(/ stroke-dasharray="[^"]*"/g, "");
const widget = (k, svg, st = {}) => k.W("html", { html: nettoie(svg) }, { width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st });

module.exports = { widget, hexBadge, motMonument, logoBrillant, logoCadran, logoTomate, collinesSillons, marqueDeco, marqueLaurier, marqueVerre, marqueVoute, livretGuide, livretCalibre, livretMenu, livretCatalogue };
