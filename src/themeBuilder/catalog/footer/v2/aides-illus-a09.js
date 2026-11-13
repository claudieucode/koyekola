// Illustrations SVG (formes seulement, décoratives, aria-hidden) pour les familles « Universités et recherche » (ft2-374 à 379) et « ONG et solidarité » (ft2-380 à 385).
// Chaque dessin est unique (graine propre). Aucun script, aucune image externe, aucun style en ligne : couleurs en dur, dégradés et flous dans <defs>.
const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const n = (x) => Math.round(x * 10) / 10;
const S = (w, h, inner, par = "xMidYMid meet") => {
  const s0 = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="${par}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const s = s0.replace(/<(\/?)(linear|radial)Gradient/g, "<$1$2gradient");
  if (s.length > 19000) throw new Error(`SVG trop long (${s.length})`);
  return s;
};
// widget HTML : le CSS plateforme donne height:auto aux SVG, la hauteur suit donc la largeur
const W = (k, svg, st = {}) => k.W("html", { html: svg }, { width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st });

// 374 : portique de faculté, soleil levant derrière le fronton (bordeaux sur crème)
function portique374() {
  let c = "";
  for (let i = 0; i < 8; i++) { const x = 330 + i * 72; c += `<rect x="${x}" y="90" width="30" height="76" fill="#7a1f2b"/><rect x="${x - 4}" y="86" width="38" height="6" fill="#7a1f2b"/><rect x="${x - 4}" y="164" width="38" height="6" fill="#7a1f2b"/><path d="M${x + 8} 96V162M${x + 15} 96V162M${x + 22} 96V162" stroke="#f4efe6" stroke-width="1.5"/>`; }
  let cy = ""; [[70, 128], [1130, 128]].forEach(([x, y]) => { cy += `<path d="M${x} ${y + 60}L${x - 22} ${y + 60}L${x} ${y - 20}L${x + 22} ${y + 60}Z" fill="#7a1f2b" opacity=".85"/>`; });
  return S(1200, 200, `<defs><radialGradient id="p374" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e9a58f" stop-opacity=".85"/><stop offset="1" stop-color="#e9a58f" stop-opacity="0"/></radialGradient></defs><circle cx="600" cy="70" r="150" fill="url(#p374)"/><path d="M290 84L600 12L910 84Z" fill="#7a1f2b"/><path d="M340 78L600 24L860 78Z" fill="none" stroke="#f4efe6" stroke-width="2"/><circle cx="600" cy="58" r="9" fill="#f4efe6"/><rect x="290" y="84" width="620" height="8" fill="#7a1f2b"/>${c}<rect x="290" y="170" width="620" height="8" fill="#7a1f2b"/><rect x="262" y="178" width="676" height="8" fill="#7a1f2b"/><rect x="234" y="186" width="732" height="8" fill="#7a1f2b"/>${cy}<rect x="0" y="194" width="1200" height="2" fill="#7a1f2b"/>`);
}
// 375 : gradins d'amphithéâtre vus de haut, halo ocre (sur bleu nuit)
function amphi375() {
  let a = "";
  for (let i = 0; i < 7; i++) { const rx = 70 + i * 42, ry = rx * 0.78; a += `<path d="M${300 - rx} 214A${rx} ${ry} 0 0 1 ${300 + rx} 214" fill="none" stroke="#e8b04b" stroke-width="${n(7 - i * 0.4)}" stroke-dasharray="${n(10 + i * 2)} 5" opacity="${n(1 - i * 0.09)}"/>`; }
  let r = ""; for (let j = -3; j <= 3; j++) { const t = j * 0.42; r += `<path d="M300 214L${n(300 + Math.sin(t) * 380)} ${n(214 - Math.cos(t) * 300)}" stroke="#12233f" stroke-width="6"/>`; }
  return S(600, 220, `<defs><radialGradient id="a375" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#e8b04b" stop-opacity=".55"/><stop offset="1" stop-color="#e8b04b" stop-opacity="0"/></radialGradient></defs><rect width="600" height="220" fill="url(#a375)"/>${a}${r}<rect x="248" y="196" width="104" height="18" fill="#f3f5f9"/><rect x="270" y="186" width="60" height="10" fill="#e8b04b"/><rect x="0" y="214" width="600" height="6" fill="#e8b04b"/>`);
}
// 376 : relevé d'oscilloscope, trace verte lumineuse sur quadrillage
function trace376() {
  const al = alea(376); let d = "M0 90", marks = "";
  for (let x = 20; x <= 1200; x += 20) { const base = 90 + Math.sin(x / 70) * 14; const pic = al() > 0.9 ? -(30 + al() * 40) : 0; const y = n(base + pic + (al() - 0.5) * 8); d += ` L${x} ${y}`; if (pic) marks += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="#e6edf3"/>`; }
  return S(1200, 160, `<defs><pattern id="g376" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#e6edf3" stroke-opacity=".12" stroke-width="1"/></pattern><filter id="f376" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="6"/></filter></defs><rect width="1200" height="160" fill="#0d1117"/><rect width="1200" height="160" fill="url(#g376)"/><path d="M0 90H1200" stroke="#7ee787" stroke-opacity=".35" stroke-dasharray="6 6"/><path d="${d}" fill="none" stroke="#7ee787" stroke-width="7" filter="url(#f376)"/><path d="${d}" fill="none" stroke="#7ee787" stroke-width="2.5" stroke-linejoin="round"/>${marks}<rect x="0" y="0" width="1200" height="160" fill="none" stroke="#e6edf3" stroke-opacity=".25" stroke-width="2"/>`);
}
// 377 : trame de points noirs qui grossissent (demi-teinte) sur jaune acide
function trame377() {
  let c = ""; for (let i = 0; i < 60; i++) for (let j = 0; j < 6; j++) { const r = 9.5 * (i / 59) * (1 - j * 0.17); if (r > 0.7) c += `<circle cx="${10 + i * 20}" cy="${n(10 + j * 20)}" r="${n(r)}"/>`; }
  return S(1200, 120, `<rect width="1200" height="120" fill="#dff24a"/><g fill="#0b0b0b">${c}</g>`, "xMidYMid slice");
}
// 378 : orbe lilas flou qui se lève, anneaux fins et poussière d'étoiles
function orbe378() {
  const al = alea(378); let e = ""; for (let i = 0; i < 46; i++) e += `<circle cx="${n(al() * 1200)}" cy="${n(al() * 250)}" r="${n(0.8 + al() * 2)}" fill="#c9b6ff" opacity="${n(0.25 + al() * 0.6)}"/>`;
  let r = ""; for (let i = 1; i <= 5; i++) r += `<circle cx="600" cy="300" r="${70 + i * 52}" fill="none" stroke="#c9b6ff" stroke-opacity="${n(0.55 - i * 0.08)}" stroke-width="1.5"/>`;
  return S(1200, 280, `<defs><linearGradient id="b378" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1458"/><stop offset="1" stop-color="#3b1d7a"/></linearGradient><filter id="f378" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter></defs><rect width="1200" height="280" fill="url(#b378)"/>${e}${r}<circle cx="600" cy="300" r="150" fill="#c9b6ff" filter="url(#f378)"/><circle cx="600" cy="300" r="118" fill="#e4d9ff" opacity=".9"/>`);
}
// 379 : rayonnage de livres (dos aux couleurs turquoise, ocre et crème), un livre penché
function rayons379() {
  const al = alea(379), pal = ["#0e5f59", "#8fdcd2", "#ffd27a", "#e6fffb", "#2aa198", "#ffb347", "#1a8a80"]; let x = 24, l = "";
  while (x < 1150) { const w = Math.round(22 + al() * 26), h = Math.round(58 + al() * 52), c = pal[Math.floor(al() * pal.length)], y = 112 - h; l += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y + 10}" width="${w}" height="4" fill="#073a36" opacity=".55"/><rect x="${x}" y="${y + h - 16}" width="${w}" height="4" fill="#073a36" opacity=".55"/>`; x += w + 2; if (x > 560 && x < 600) { l += `<g transform="rotate(14 ${x + 24} 112)"><rect x="${x}" y="40" width="26" height="72" fill="#ffd27a"/><rect x="${x}" y="50" width="26" height="4" fill="#073a36" opacity=".55"/></g>`; x += 62; } }
  return S(1200, 130, `<rect width="1200" height="130" fill="#073a36"/>${l}<rect x="0" y="112" width="1200" height="18" fill="#bfe7e1"/><rect x="0" y="112" width="1200" height="3" fill="#ffd27a"/>`, "xMidYMax slice");
}
// 380 : dunes, acacia et soleil bas (tons sable sur terre cuite)
function dunes380() {
  return S(300, 170, `${halo(205, 68, 76, 76, "#ffd9a0", 0.9)}<circle cx="205" cy="68" r="30" fill="#fff1d6"/><path d="M0 120Q70 84 140 112T300 98V170H0Z" fill="#d4622f"/><path d="M0 142Q90 108 180 136T300 124V170H0Z" fill="#8f2d09"/><path d="M0 160Q100 140 200 156T300 150V170H0Z" fill="#5e1c05"/><path d="M58 126V84M58 100L44 90M58 96L72 84" stroke="#2a1b14" stroke-width="3" fill="none"/><path d="M30 84Q58 70 88 84Q58 90 30 84Z" fill="#2a1b14"/><path d="M46 78Q64 68 80 78Q64 82 46 78Z" fill="#2a1b14"/>`);
}
// 381 : cortège de pancartes (silhouettes noires, pancartes à bandes jaunes) sur le bandeau tournesol
function cortege381() {
  const al = alea(381); let g = "", pl = "";
  for (let i = 0; i < 17; i++) { const x = 40 + i * 70 + al() * 18, h = al() * 24, tilt = Math.round((al() - 0.5) * 24), pw = 56 + Math.round(al() * 26);
    g += `<circle cx="${n(x)}" cy="${n(148 - h)}" r="16" fill="#111111"/><path d="M${n(x - 30)} 200V${n(176 - h)}L${n(x - 16)} ${n(164 - h)}H${n(x + 16)}L${n(x + 30)} ${n(176 - h)}V200Z" fill="#111111"/>`;
    if (i % 2 === 0 || al() > 0.5) { const top = 28 + al() * 24; pl += `<g transform="rotate(${tilt} ${n(x)} ${n(150 - h)})"><rect x="${n(x + 8)}" y="${n(top)}" width="5" height="${n(150 - h - top)}" fill="#111111"/><rect x="${n(x - pw / 2 + 10)}" y="${n(top - 34)}" width="${pw}" height="40" fill="#111111"/><rect x="${n(x - pw / 2 + 18)}" y="${n(top - 25)}" width="${pw - 16}" height="5" fill="#ffc933"/><rect x="${n(x - pw / 2 + 18)}" y="${n(top - 14)}" width="${n((pw - 16) * 0.6)}" height="5" fill="#ffc933"/></g>`; } }
  return S(1200, 200, `${pl}${g}<rect x="0" y="196" width="1200" height="4" fill="#111111"/>`, "xMidYMax slice");
}
// 382 : rue de maisons colorées (vert, rose, paille, blanc) à filets verts
function quartier382() {
  const al = alea(382), cols = ["#1f6f50", "#f9c5d1", "#fde68a", "#ffffff"]; let x = 18, m = "", i = 0;
  while (x < 1150) { const w = 80 + Math.round(al() * 50), h = 70 + Math.round(al() * 56), c = cols[i % 4], y = 160 - h, toit = i % 2 ? `<path d="M${x - 6} ${y}L${x + w / 2} ${y - 34}L${x + w + 6} ${y}Z" fill="#14352a"/>` : `<rect x="${x - 4}" y="${y - 10}" width="${w + 8}" height="10" fill="#14352a"/>`;
    let f = ""; for (let q = 0; q < 2; q++) f += `<rect x="${x + 14 + q * (w / 2 - 6)}" y="${y + 16}" width="${n(w / 2 - 22)}" height="22" fill="${c === "#1f6f50" ? "#fde68a" : "#14352a"}" opacity=".85"/>`;
    m += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="#14352a" stroke-width="3"/>${toit}${f}<rect x="${x + w / 2 - 9}" y="${160 - 36}" width="18" height="36" fill="#14352a"/>`;
    if (i % 3 === 1) m += `<circle cx="${x + w + 16}" cy="128" r="18" fill="#1f6f50" stroke="#14352a" stroke-width="3"/><rect x="${x + w + 14}" y="144" width="4" height="16" fill="#14352a"/>`;
    x += w + 36; i++; }
  return S(1200, 190, `<rect width="1200" height="190" fill="#fff7f0"/>${m}<rect x="0" y="160" width="1200" height="4" fill="#14352a"/><path d="M0 178H1200" stroke="#14352a" stroke-width="2"/>`, "xMidYMax slice");
}
// 383 : bande ondulée (trois vagues bleues, un filet ambre) jusqu'à la bande de mentions
function vagues383() {
  const vague = (y, a, p, ph) => { let d = `M0 ${y}`; for (let x = 0; x <= 1200; x += 20) d += ` L${x} ${n(y + Math.sin(x / p + ph) * a)}`; return d; };
  return S(1200, 100, `<rect width="1200" height="100" fill="#1e3a8a"/><path d="${vague(38, 12, 90, 0)} V100H0Z" fill="#2748a8"/><path d="${vague(50, 10, 70, 1.5)}" fill="none" stroke="#fbbf24" stroke-width="3"/><path d="${vague(62, 11, 110, 3)} V100H0Z" fill="#203f98"/><path d="${vague(80, 8, 60, 4.2)} V100H0Z" fill="#17306f"/>`, "none");
}
// 384 : tracé de pouls magenta sur papier millimétré, croix à repères carrés au départ
function pouls384() {
  const beat = (x) => `L${x} 70 L${x + 14} 70 L${x + 24} 54 L${x + 34} 70 L${x + 56} 70 L${x + 66} 118 L${x + 82} 8 L${x + 98} 100 L${x + 108} 70 L${x + 140} 70 L${x + 158} 50 L${x + 184} 70`;
  let d = "M120 70"; for (let b = 0; b < 5; b++) d += ` ${beat(150 + b * 220)}`; d += " L1200 70";
  return S(1200, 130, `<defs><pattern id="m384" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#be185d" stroke-opacity=".14"/></pattern><linearGradient id="l384" x1="0" x2="1"><stop offset="0" stop-color="#be185d"/><stop offset="1" stop-color="#16101a"/></linearGradient></defs><rect width="1200" height="130" fill="#ffffff"/><rect width="1200" height="130" fill="url(#m384)"/><rect x="48" y="46" width="24" height="68" fill="#be185d" transform="translate(0 -22)"/><rect x="26" y="68" width="68" height="24" fill="#be185d" transform="translate(0 -22)"/><path d="${d}" fill="none" stroke="url(#l384)" stroke-width="4" stroke-linejoin="round"/><rect x="0" y="126" width="1200" height="4" fill="#16101a"/>`, "xMidYMid slice");
}
// 385 : sceau à couronne de laurier et gerbe, doubles cercles or (pour fond brun)
function sceau385() {
  let l = ""; for (let i = 0; i < 11; i++) { const t = 28 + i * 13; [-1, 1].forEach((s) => { const a = (s * t * Math.PI) / 180, x = n(100 + Math.sin(a) * 66), y = n(100 + Math.cos(a) * 66), rot = n(s * (t - 90 + 180) * -1 + 0); l += `<path d="M0 0Q8 -11 0 -26Q-8 -11 0 0Z" fill="#f0b36a" transform="translate(${x} ${y}) rotate(${n(s * (t + 90) + (s < 0 ? 0 : 0))})" opacity="${n(0.95 - i * 0.03)}"/>`; void rot; }); }
  let g = ""; for (let i = 0; i < 5; i++) { const y = 128 - i * 14; g += `<path d="M100 ${y}Q${112 + i * 2} ${y - 6} ${116 + i * 2} ${y - 18}Q104 ${y - 10} 100 ${y}Z" fill="#f6e9d6"/><path d="M100 ${y}Q${88 - i * 2} ${y - 6} ${84 - i * 2} ${y - 18}Q96 ${y - 10} 100 ${y}Z" fill="#f6e9d6"/>`; }
  return S(200, 200, `<circle cx="100" cy="100" r="96" fill="none" stroke="#f0b36a" stroke-width="2"/><circle cx="100" cy="100" r="90" fill="none" stroke="#f0b36a" stroke-width="1"/>${l}<path d="M100 140V52" stroke="#f6e9d6" stroke-width="3"/><circle cx="100" cy="46" r="6" fill="#f0b36a"/><path d="M70 146H130" stroke="#f0b36a" stroke-width="3"/><path d="M100 146V156" stroke="#f0b36a" stroke-width="2"/>${g}`);
}
const _old = { W, portique374, amphi375, trace376, trame377, orbe378, rayons379, dunes380, cortege381, quartier382, vagues383, pouls384, sceau385 };

// ── Seconde passe : le nettoyeur de la plateforme ne garde que svg, g, path, circle, rect, line, polyline, polygon, ellipse, defs, dégradés et stop ;
// ni filtre, ni motif, ni tirets, ni stroke-opacity : le flou est donc imité par des couches d'épaisseur croissante et de faible opacité.
const doux = (d, couleur, pas = 7, n_ = 6, o = 0.1, pleine = true) => { let t = ""; for (let i = n_; i >= 1; i--) t += `<path d="${d}" fill="${pleine ? couleur : "none"}" stroke="${couleur}" stroke-width="${i * pas}" stroke-linejoin="round" stroke-linecap="round" opacity="${o}"/>`; return t; };
const orbe = (cx, cy, r, couleur, n_ = 10, o = 0.07) => { let t = ""; for (let i = n_; i >= 1; i--) t += `<circle cx="${cx}" cy="${cy}" r="${n(r + i * 9)}" fill="${couleur}" opacity="${o}"/>`; return t; };
const halo = (cx, cy, rx, ry, c, mx = 0.7, st = 14) => { let t = ""; for (let i = 0; i < st; i++) { const f = 1 - i / st; t += `<ellipse cx="${cx}" cy="${cy}" rx="${n(rx * f)}" ry="${n(ry * f)}" fill="${c}" opacity="${n(mx / st * 1.4)}"/>`; } return t; };
const fondu = (w, y0, h, c, st = 16) => { let t = ""; for (let i = 0; i < st; i++) t += `<rect x="0" y="${n(y0 + i * h / st)}" width="${w}" height="${n(h / st + 1)}" fill="${c}" opacity="${n((i + 1) / st)}"/>`; return t; };
const HALO_ANCIEN = (id, c, a = 0.7) => `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const FONDU_ANCIEN = (id, c, a0 = 0.55) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="${a0}" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
// 374 : monogramme monumental (arche coupée + pilier + demi-disque) crème aux bords doux sur noir, halo bordeaux
function monogramme374() {
  const a = "M470 40H690V300Q640 280 590 330Q540 380 470 300Z", b = "M420 190Q450 150 520 190Q560 230 560 290V560H420Z", c = "M700 240Q780 210 840 250V560H600Q640 430 700 240Z";
  return S(1200, 560, `<rect width="1200" height="560" fill="#0a0a0c"/>${halo(600, 510, 470, 170, "#c2384c", 0.8)}${doux(a, "#f4d9c0", 6, 5, 0.1)}${doux(b, "#f4d9c0", 6, 5, 0.1)}${doux(c, "#f4d9c0", 6, 5, 0.1)}<path d="${a}" fill="#f3e3cf"/><path d="${b}" fill="#f3e3cf"/><path d="${c}" fill="#f3e3cf"/>${fondu(1200, 300, 260, "#0a0a0c")}`);
}
// 375 : gradins d'amphithéâtre (arcs ocre), allées sombres, halo ocre
function amphi375() {
  let a = "";
  for (let i = 0; i < 7; i++) { const rx = 70 + i * 42, ry = rx * 0.78; a += `<path d="M${300 - rx} 214A${rx} ${ry} 0 0 1 ${300 + rx} 214" fill="none" stroke="#e8b04b" stroke-width="${n(7 - i * 0.4)}" opacity="${n(1 - i * 0.11)}"/>`; }
  let r = ""; for (let j = -3; j <= 3; j++) { const t = j * 0.42; r += `<path d="M300 214L${n(300 + Math.sin(t) * 380)} ${n(214 - Math.cos(t) * 300)}" stroke="#12233f" stroke-width="7"/>`; }
  return S(600, 220, `${halo(300, 214, 330, 210, "#e8b04b", 0.6)}${a}${r}<rect x="248" y="196" width="104" height="18" fill="#f3f5f9"/><rect x="270" y="186" width="60" height="10" fill="#e8b04b"/><rect x="0" y="214" width="600" height="6" fill="#e8b04b"/>`);
}
// 376 : relevé d'oscilloscope, trace verte à halo (couches), quadrillage en tracés fins
function trace376() {
  const al = alea(376); let d = "M0 90", marks = "";
  for (let x = 20; x <= 1200; x += 20) { const base = 90 + Math.sin(x / 70) * 14; const pic = al() > 0.9 ? -(30 + al() * 40) : 0; const y = n(base + pic + (al() - 0.5) * 8); d += ` L${x} ${y}`; if (pic) marks += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="#e6edf3"/>`; }
  let g = ""; for (let x = 40; x < 1200; x += 40) g += `M${x} 0V160`; for (let y = 40; y < 160; y += 40) g += `M0 ${y}H1200`;
  return S(1200, 160, `<rect width="1200" height="160" fill="#0d1117"/><path d="${g}" stroke="#e6edf3" stroke-width="1" opacity=".12" fill="none"/><path d="M0 90H1200" stroke="#7ee787" stroke-width="1" opacity=".35"/><path d="${d}" fill="none" stroke="#7ee787" stroke-width="16" opacity=".1" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#7ee787" stroke-width="10" opacity=".15" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#7ee787" stroke-width="2.5" stroke-linejoin="round"/>${marks}`);
}
// 377 : grande cellule noire à trame de points qui fondent, coupée par deux arcs, sur jaune acide
function atome377() {
  let c = ""; for (let i = 0; i < 30; i++) for (let j = 0; j < 12; j++) { const x = 330 + i * 18, y = 40 + j * 18, d = Math.hypot(x - 600, y - 250); if (d < 215) c += `<circle cx="${x}" cy="${y}" r="${n(1 + 5 * (1 - d / 215))}" fill="#dff24a"/>`; }
  return S(1200, 520, `<rect width="1200" height="520" fill="#dff24a"/>${orbe(600, 250, 230, "#0b0b0b", 6, 0.06)}<circle cx="600" cy="250" r="230" fill="#0b0b0b"/><path d="M370 250A230 230 0 0 1 830 250" fill="none" stroke="#dff24a" stroke-width="14"/><path d="M140 250Q600 60 1060 250Q600 440 140 250Z" fill="none" stroke="#0b0b0b" stroke-width="10"/>${c}${fondu(1200, 380, 140, "#dff24a")}`);
}
// 378 : orbe lilas doux (couches), anneaux fins, poussière d'étoiles
function orbe378() {
  const al = alea(378); let e = ""; for (let i = 0; i < 46; i++) e += `<circle cx="${n(al() * 1200)}" cy="${n(al() * 250)}" r="${n(0.8 + al() * 2)}" fill="#c9b6ff" opacity="${n(0.25 + al() * 0.6)}"/>`;
  let r = ""; for (let i = 1; i <= 5; i++) r += `<circle cx="600" cy="300" r="${70 + i * 52}" fill="none" stroke="#c9b6ff" stroke-width="1.5" opacity="${n(0.55 - i * 0.08)}"/>`;
  return S(1200, 280, `<rect width="1200" height="280" fill="#2a1458"/>${fondu(1200, 0, 280, "#3b1d7a", 12)}${e}${r}${orbe(600, 300, 130, "#c9b6ff", 12, 0.06)}<circle cx="600" cy="300" r="118" fill="#e4d9ff"/>`);
}
// 379 : escalier monumental aux bords doux, crème-turquoise sur teal profond, halo doré
function escalier379() {
  let g = "", ombre = ""; for (let i = 0; i < 6; i++) { const x = 280 + i * 40, y = 380 - i * 58, w = 640 - i * 80; g += `<rect x="${x}" y="${y}" width="${w}" height="58" fill="${i % 2 ? "#bff2ea" : "#effffc"}"/>`; ombre += `<rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="78" fill="#bff2ea" opacity=".05"/><rect x="${x - 22}" y="${y - 22}" width="${w + 44}" height="102" fill="#bff2ea" opacity=".04"/>`; }
  return S(1200, 480, `<rect width="1200" height="480" fill="#073a36"/>${halo(600, 140, 380, 125, "#ffd27a", 0.75)}${ombre}${g}${fondu(1200, 270, 210, "#073a36")}`);
}
// 375 : quatre pastilles rondes à icône dessinée (livre, fiole, épingle, enveloppe)
function pastilles375() {
  const ic = [`<path d="M-10 -8H-1V9H-10ZM1 -8H10V9H1Z" fill="none" stroke="#12233f" stroke-width="2.4"/>`, `<path d="M-3 -10H3M-2 -10V-2L-9 9H9L2 -2V-10" fill="none" stroke="#12233f" stroke-width="2.4"/>`, `<path d="M0 10Q-9 0 -9 -4A9 9 0 0 1 9 -4Q9 0 0 10Z" fill="none" stroke="#12233f" stroke-width="2.4"/><circle cx="0" cy="-4" r="3" fill="#12233f"/>`, `<path d="M-10 -7H10V7H-10ZM-10 -7L0 2L10 -7" fill="none" stroke="#12233f" stroke-width="2.4"/>`];
  return S(260, 56, ic.map((d, i) => `<g transform="translate(${28 + i * 68} 28)"><circle r="26" fill="#e8b04b"/><circle r="22" fill="none" stroke="#12233f" stroke-width="1" opacity=".3"/>${d}</g>`).join(""), "xMinYMid meet");
}
// 376 : mot « LABO » en contour vert (halo par couches), flacon dessiné, fondu vers le noir
function mot376() {
  const L = "M0 0V100H56", A = "M0 100L34 0L68 100M12 68H56", B = "M0 0V100H38Q66 100 66 76Q66 52 38 50H0M0 50H34Q58 50 58 25Q58 0 34 0H0", O = "M33 0Q0 0 0 50Q0 100 33 100Q66 100 66 50Q66 0 33 0Z";
  const lettres = [L, A, B, O].map((d, i) => `transform="translate(${340 + i * 200} 40) scale(2.4 2.4)" d="${d}"`);
  const ch = (w, o, st) => lettres.map((t) => `<path ${t} fill="none" stroke="${st}" stroke-width="${w}" opacity="${o}" stroke-linejoin="round" stroke-linecap="round"/>`).join("");
  const flacon = "M170 60H210M180 60V130L130 250H260L210 130V60M146 210H244";
  return S(1200, 300, `<rect width="1200" height="300" fill="#0d1117"/>${ch(22, 0.08, "#7ee787")}${ch(14, 0.12, "#7ee787")}${ch(4, 1, "#59d36b")}<path d="${flacon}" fill="none" stroke="#59d36b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>${fondu(1200, 120, 180, "#0d1117")}`, "xMidYMin slice");
}
// 384 : pouls magenta lumineux sur noir à halo rose, croix à repères carrés
function pouls384b() {
  const beat = (x) => `L${x} 100 L${x + 14} 100 L${x + 24} 84 L${x + 34} 100 L${x + 56} 100 L${x + 66} 168 L${x + 82} 20 L${x + 98} 150 L${x + 108} 100 L${x + 140} 100 L${x + 158} 80 L${x + 184} 100`;
  let d = "M140 100"; for (let b = 0; b < 5; b++) d += ` ${beat(170 + b * 210)}`; d += " L1200 100";
  return S(1200, 200, `<rect width="1200" height="200" fill="#0b050a"/>${halo(600, 100, 590, 120, "#be185d", 0.65)}<rect x="52" y="52" width="30" height="92" fill="#ec4899"/><rect x="21" y="83" width="92" height="30" fill="#ec4899"/><path d="${d}" fill="none" stroke="#ec4899" stroke-width="20" opacity=".12" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ec4899" stroke-width="11" opacity=".2" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fdf2f8" stroke-width="3" stroke-linejoin="round"/>`, "xMidYMid slice");
}
module.exports = { ..._old, monogramme374, atome377, escalier379, pastilles375, mot376, pouls384b, amphi375, trace376, orbe378 };
