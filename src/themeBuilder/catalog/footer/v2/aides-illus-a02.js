// Aides « ILLUSTRATION » de l'agent a02 (familles data-ia ft2-290 à 295 et applications-mobiles ft2-296 à 301).
// Chaque fonction retourne le TEXTE d'un dessin SVG décoratif (formes seulement : ni script, ni image externe, ni arrondi CSS) à placer dans le widget « html ».
// Les dessins sont propres à chaque modèle (marques fictives) et déterministes (graine fixe). Les identifiants internes (dégradés, filtres) portent un préfixe unique.
const { compact } = require("../../kit");

const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const n1 = (x) => Math.round(x * 10) / 10;
const ouvre = (vb) => `<svg viewBox="${vb}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">`;

// Widget html (le CSS de la plateforme impose height:auto aux SVG : la hauteur suit la largeur). Variante unique, ou deux variantes (large / étroite) pour le mobile.
const dessin = (k, markup, st) => k.W("html", { html: markup }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st }));
const dessinDeux = (k, large, etroit, st) => [{ ...dessin(k, large, st), hideOn: ["mobile"] }, { ...dessin(k, etroit, st), hideOn: ["desktop", "tablet"] }];

// courbe sinusoïdale (liste de points) ; fermée vers le bas si `ferme` est fourni
const vaguePoints = (w, h0, amp, freq, phase, pas = 10) => { const p = []; for (let x = 0; x <= w + pas; x += pas) p.push([x, n1(h0 + amp * Math.sin(x * freq + phase))]); return p; };
// Halo SANS dégradé (le nettoyeur du HTML sécurisé retire les dégradés) : cercles translucides empilés
const halo = (cx, cy, r, couleur, force = 0.5, n = 7) => { let o = ""; for (let i = 0; i < n; i++) o += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r * (1 - i / n))}" fill="${couleur}" opacity="${n1(force / n * 1.6)}"/>`; return o; };
const chemin = (p) => p.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");


// Contraintes du widget « html » : liste blanche (svg g path circle rect line polyline polygon ellipse defs linearGradient radialGradient stop), attributs limités (pas de stroke-opacity, fill-opacity,
// stroke-dasharray, text, mask, pattern, filter) et 20 000 caractères au plus : on dessine donc les lettres en tracés et on utilise `opacity`.
const GLYPHE = { V: "M0 0L2 6L4 0", E: "M4 0H0V6H4M0 3H3", C: "M4 0H0V6H4", T: "M0 0H4M2 0V6", R: "M0 6V0H4V3H0M2 3L4 6", A: "M0 6L2 0L4 6M.8 4H3.2", N: "M0 6V0L4 6V0", S: "M4 0H0V3H4V6H0", O: "M0 0H4V6H0Z", D: "M0 0H3L4 1.5V4.5L3 6H0Z", M: "M0 6V0L2 3L4 0V6", L: "M0 0V6H4", I: "M2 0V6", X: "M0 0L4 6M4 0L0 6", U: "M0 0V6H4V0", Z: "M0 0H4L0 6H4", P: "M0 6V0H4V3H0", K: "M0 0V6M4 0L0 3L4 6" };
// Mot dessiné en tracés : largeur w, haut en y, dégradé (userSpaceOnUse en unités de lettre) ; retourne { defs, corps, hauteur }
const motTrace = (id, texte, w, x, y, c1, c2, o = {}) => {
  const g = o.espace ?? 1.4, n = texte.length, u = n * 4 + (n - 1) * g, sw = o.epaisseur ?? 0.95, s = w / (u + sw + 0.6);
  const lettres = texte.split("").map((c, i) => `<path transform="translate(${n1(i * (4 + g))} 0)" d="${GLYPHE[c] || ""}"/>`).join("");

  const g1 = (stroke, dx, dy, op) => `<g transform="translate(${n1(x + dx + (sw / 2 + 0.3) * s)} ${n1(y + dy + (sw / 2 + 0.3) * s)}) scale(${n1(s * 1000) / 1000})" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter" stroke-linecap="square"${op ? ` opacity="${op}"` : ""}>${lettres}</g>`;
  return { defs: "", corps: (o.ombre ? g1(o.ombre, 0.45, -0.45, 0.5) : "") + g1(c1, 0, 0), hauteur: (6 + sw + 0.6) * s };
};
const letraits = (texte, x, y, h, couleur, sw, g = 1.4) => { const s = h / 6, n = texte.length; return texte.split("").map((c, i) => `<path transform="translate(${n1(x + i * (4 + g) * s)} ${y}) scale(${n1(s * 1000) / 1000})" d="${GLYPHE[c] || ""}" fill="none" stroke="${couleur}" stroke-width="${sw}" stroke-linecap="square"/>`).join(""); };

// ═══ Panneau d'arcs géants et halo lumineux (capture 07 : tourbillon de bandes courbes qui s'éteint dans un halo) ═══
const arcs07 = (w, h, sfx, o) => {
  const cx = w * (o.cx ?? 0.86), cy = h * (o.cy ?? 0.98);
  let s = ouvre(`0 0 ${w} ${h}`) + `<rect x="0" y="0" width="${w}" height="${h}" fill="${o.fond}"/>` + halo(cx, cy, h * 0.95, o.halo, o.force ?? 0.6, 9);
  for (let i = 0; i < 9; i++) { const rr = h * (0.2 + i * 0.105); s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(rr)}" fill="none" stroke="${i % 3 === 0 ? o.arc2 : o.arc}" opacity="${n1(0.5 - i * 0.04)}" stroke-width="${i % 2 ? 3 : 16}"/>`; }
  for (let i = 0; i < 4; i++) { const rr = h * (0.3 + i * 0.2); s += `<path d="M${n1(cx - rr)} ${n1(cy)} A${n1(rr)} ${n1(rr)} 0 0 1 ${n1(cx)} ${n1(cy - rr)}" fill="none" stroke="${o.arc2}" stroke-width="${2 + i}"/>`; }
  return s + `</svg>`;
};
// Marque : globe filaire (290)
const globeMini290 = () => {
  let s = ouvre("0 0 100 100") + `<circle cx="50" cy="50" r="44" fill="#0b0f14" stroke="#b6f23c" stroke-width="4"/>`;
  for (let i = 1; i < 4; i++) s += `<ellipse cx="50" cy="50" rx="${n1(44 * Math.abs(Math.cos((i * Math.PI) / 4)))}" ry="44" fill="none" stroke="#b6f23c" stroke-width="2"/>`;
  return s + `<path d="M6 50H94" stroke="#b6f23c" stroke-width="2"/><rect x="42" y="42" width="16" height="16" fill="#b6f23c"/></svg>`;
};
// Nom monumental en lettres tracées à dégradé, pleine largeur (291)
const nomMonumental = (id, texte, w, h, o) => {
  const m = motTrace("nm" + id, texte, w * 0.78, w * 0.11, h * 0.07, o.c1, o.c2, { ombre: o.c2, epaisseur: 1 });
  return ouvre(`0 0 ${w} ${h}`) + `<rect x="0" y="0" width="${w}" height="${h}" fill="${o.fond}"/>` + halo(w / 2, h * 1.05, w * 0.4, o.c1, 0.45, 8) + m.corps + `</svg>`;
};
// Logo en étoile de rayons (capture 09)
const etoileLogo = (n, c1, c2, fond) => {
  let s = ouvre("0 0 100 100");
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, l = i % 2 ? 40 : 48; s += `<path d="M${n1(50 + 8 * Math.cos(a))} ${n1(50 + 8 * Math.sin(a))}L${n1(50 + l * Math.cos(a))} ${n1(50 + l * Math.sin(a))}" stroke="${i % 2 ? c2 : c1}" stroke-width="${i % 2 ? 6 : 9}"/>`; }
  return s + `<rect x="42" y="42" width="16" height="16" fill="${fond || c1}"/></svg>`;
};
// Mot-symbole en lettres tracées avec filet (capture 08)
const nomBiseau = (id, texte, w, h, c1, c2) => { const m = motTrace("nb" + id, texte, w, 0, 0, c1, c2, { epaisseur: 1.1 }); return ouvre(`0 0 ${w} ${n1(m.hauteur + 14)}`) + `${m.corps}<path d="M0 ${n1(m.hauteur + 8)}H${w}" stroke="${c2}" stroke-width="4"/></svg>`; };

// ═══ 292 — bandes ondulées aubergine, mauve et pêche, pleine largeur ═══
const vagues292 = (w, h, sfx) => {
  let s = ouvre(`0 0 ${w} ${h}`) + `<rect x="0" y="0" width="${w}" height="${h}" fill="#20102c"/>`;
  const f = w < 600 ? 0.016 : 0.0052, couches = [["#3a1d52", 0.46, 0.42, 0], ["#5a2a6a", 0.56, 0.36, 1.3], ["#9a4a84", 0.66, 0.3, 2.4], ["#ff9c78", 0.77, 0.24, 3.6], ["#20102c", 0.9, 0.18, 4.8]];
  for (const [fill, y0, a, ph] of couches) s += `<path d="${chemin(vaguePoints(w, h * y0, h * a * 0.4, f, ph, 24))}L${w + 24} ${h}L0 ${h}Z" fill="${fill}"/>`;
  return s + `</svg>`;
};
// ═══ 293 — arbre de preuve ═══
const preuve293 = () => {
  const N = "#111111";
  let s = ouvre("0 0 520 300");
  for (let x = 10; x < 520; x += 40) for (let y = 10; y < 300; y += 40) s += `<rect x="${x}" y="${y}" width="3" height="3" fill="${N}" opacity="0.35"/>`;
  const racine = [20, 132, 36], milieu = [[180, 28], [180, 132], [180, 236]], feuilles = [[350, 8], [350, 70], [350, 132], [350, 196], [350, 258]];
  const lien = (x1, y1, x2, y2, ep, op) => `<path d="M${x1} ${y1}H${n1((x1 + x2) / 2)}V${y2}H${x2}" fill="none" stroke="${N}" stroke-width="${ep}" opacity="${op}" stroke-linejoin="miter"/>`;
  milieu.forEach(([x, y], i) => { s += lien(racine[0] + 36, racine[1] + 18, x, y + 18, i === 1 ? 6 : 2, i === 1 ? 1 : 0.5); });
  [[0, 0], [0, 1], [1, 2], [1, 3], [2, 4]].forEach(([m, f]) => { const [mx, my] = milieu[m], [fx, fy] = feuilles[f]; const c = m === 1 && f === 2; s += lien(mx + 36, my + 18, fx, fy + 18, c ? 6 : 2, c ? 1 : 0.5); });
  s += `<rect x="${racine[0]}" y="${racine[1]}" width="36" height="36" fill="${N}"/><rect x="${racine[0] + 11}" y="${racine[1] + 11}" width="14" height="14" fill="#ffc933"/>`;
  milieu.forEach(([x, y], i) => { s += `<rect x="${x}" y="${y}" width="36" height="36" fill="${i === 1 ? N : "#ffc933"}" stroke="${N}" stroke-width="3"/>`; s += i !== 1 ? `<path d="M${x + 8} ${y + 18}H${x + 28}" stroke="${N}" stroke-width="3"/>` : `<path d="M${x + 9} ${y + 18}H${x + 27}M${x + 18} ${y + 9}V${y + 27}" stroke="#ffc933" stroke-width="3"/>`; });
  feuilles.forEach(([x, y], i) => { const v = i === 2; s += `<rect x="${x}" y="${y}" width="${v ? 150 : 110}" height="36" fill="${v ? N : "#ffc933"}" stroke="${N}" stroke-width="3"/><path d="M${x + 12} ${y + 14}H${x + (v ? 96 : 70)}M${x + 12} ${y + 24}H${x + (v ? 70 : 50)}" stroke="${v ? "#ffc933" : N}" stroke-width="3"/>`; });
  return s + `<path d="M472 150l9 9l17-20" fill="none" stroke="#ffc933" stroke-width="5"/></svg>`;
};
// ═══ 294 — dictionnaire : pile de pages, onglets A D M R V, grand A ═══
const dico294 = () => {
  const E = "#1b1b1b", V = "#b92f14";
  let s = ouvre("0 0 440 380");
  [["#e3dacb", 70, 20], ["#ece4d5", 52, 40], ["#f6f1e7", 34, 60], ["#faf7f1", 16, 80]].forEach(([c, dx, dy]) => { s += `<rect x="${dx}" y="${dy}" width="300" height="270" fill="${c}" stroke="${E}" stroke-width="2.5"/>`; });
  ["A", "D", "M", "R", "V"].forEach((l, i) => { const y = 50 + i * 54; s += `<rect x="372" y="${y}" width="56" height="40" fill="${i === 2 ? V : "#f2ede4"}" stroke="${E}" stroke-width="2.5"/>` + letraits(l, 390, y + 10, 20, i === 2 ? "#ffffff" : E, 1.1); });
  s += `<rect x="0" y="100" width="300" height="270" fill="#faf7f1" stroke="${E}" stroke-width="3"/><rect x="0" y="100" width="300" height="12" fill="${V}"/>`;
  s += letraits("A", 34, 130, 100, V, 1.3) + letraits("A", 150, 160, 70, E, 1.3);
  for (let i = 0; i < 4; i++) s += `<path d="M26 ${262 + i * 22}H${i === 3 ? 150 : 270}" stroke="${E}" stroke-width="3" opacity="${i === 3 ? 1 : 0.55}"/>`;
  return s + `<rect x="270" y="112" width="30" height="48" fill="${E}"/></svg>`;
};
// ═══ 295 — du brut au déployé : points épars qui s'alignent puis deviennent des carrés ═══
const flux295 = (w, h, sfx) => {
  const r = alea(295 + w), mid = h / 2, pas = w < 600 ? 34 : 52;
  let s = ouvre(`0 0 ${w} ${h}`) + `<rect x="0" y="0" width="${w}" height="${h}" fill="#041f1c"/>`;
  s += `<path d="M0 6L${w} ${mid - 22}V${mid + 22}L0 ${h - 6}Z" fill="#6ff0c4" opacity="0.12"/><path d="M0 6L${w} ${mid - 22}M0 ${h - 6}L${w} ${mid + 22}" stroke="#6ff0c4" opacity="0.5" stroke-width="1.5"/>`;
  for (let x = pas / 2; x < w; x += pas) {
    const t = x / w, demi = ((h - 12) / 2) * (1 - t) + 22 * t - 8, n = Math.min(7, Math.max(2, Math.round(1 + demi / 14)));
    for (let i = 0; i < n; i++) {
      const base = mid + ((i / (n - 1)) * 2 - 1) * demi, y = n1(base + (r() - 0.5) * 34 * Math.max(0, 1 - t * 1.5)), taille = n1(4 + t * 10);
      s += t < 0.45 ? `<circle cx="${n1(x + (r() - 0.5) * 10)}" cy="${y}" r="${n1(2 + r() * 2.6)}" fill="#6ff0c4" opacity="${n1(0.4 + r() * 0.5)}"/>` : `<rect x="${n1(x - taille / 2)}" y="${n1(y - taille / 2)}" width="${taille}" height="${taille}" fill="${t > 0.8 ? "#6ff0c4" : "none"}" stroke="#6ff0c4" stroke-width="1.6"/>`;
    }
  }
  return s + `<path d="M0 ${mid}H${w}" stroke="#e6faf4" opacity="0.35" stroke-width="1"/></svg>`;
};
// ═══ 296 — téléphone dessiné sur halo blanc ═══
const telephone296 = () => {
  const r = alea(296);
  let s = ouvre("0 0 260 330") + `` + halo(130, 165, 150, "#ffffff", 0.4, 7) + ``;
  for (let i = 0; i < 9; i++) s += `<rect x="${n1(r() * 240)}" y="${n1(r() * 310)}" width="${i % 3 ? 6 : 10}" height="${i % 3 ? 6 : 10}" fill="${i % 4 ? "#ffffff" : "#ffe14d"}" opacity="${i % 4 ? 0.5 : 1}"/>`;
  s += `<rect x="62" y="18" width="136" height="296" fill="#0c1230" stroke="#ffffff" stroke-width="5"/><rect x="72" y="42" width="116" height="256" fill="#ffffff"/><rect x="104" y="26" width="52" height="8" fill="#ffffff"/><rect x="72" y="42" width="116" height="40" fill="#1d3fff"/><path d="M84 62H132" stroke="#ffffff" stroke-width="5"/>`;
  [["#ffe14d", 112], ["#1d3fff", 156], ["#ffffff", 200], ["#ffffff", 244]].forEach(([c, y], i) => { s += `<rect x="82" y="${y}" width="24" height="24" fill="${c}" stroke="#0c1230" stroke-width="3"/>`; if (i < 2) s += `<path d="M87 ${y + 12}l6 6l9-12" fill="none" stroke="${i ? "#ffffff" : "#0c1230"}" stroke-width="3.5"/>`; s += `<path d="M116 ${y + 12}H${i === 1 ? 150 : 174}" stroke="#0c1230" stroke-width="4" opacity="${i < 2 ? 0.35 : 0.9}"/>`; });
  return s + `</svg>`;
};
// ═══ 297 — quatre vignettes dessinées en grille 2 × 2 ═══
const vignettes297 = () => {
  const N = "#141414", C = "#fff3e0", M = "#b8f0d8";
  let s = ouvre("0 0 290 290");
  const fonds = [C, M, N, C], ico = [
    `<path d="M60 22C40 22 30 38 30 52C30 72 60 98 60 98C60 98 90 72 90 52C90 38 80 22 60 22Z" fill="#ff6a1a" stroke="${N}" stroke-width="4"/><circle cx="60" cy="52" r="10" fill="${C}" stroke="${N}" stroke-width="4"/>`,
    `<rect x="26" y="28" width="68" height="44" fill="#ffffff" stroke="${N}" stroke-width="4"/><path d="M42 72V94L66 72" fill="#ffffff" stroke="${N}" stroke-width="4"/><path d="M40 46H80M40 58H66" stroke="${N}" stroke-width="4"/>`,
    `<rect x="22" y="34" width="76" height="52" fill="#ff6a1a" stroke="${C}" stroke-width="4"/><rect x="22" y="46" width="76" height="12" fill="${C}"/><path d="M32 74H54" stroke="${C}" stroke-width="4"/>`,
    `<path d="M34 80H86L80 70V54C80 40 72 32 60 32C48 32 40 40 40 54V70Z" fill="#ff6a1a" stroke="${N}" stroke-width="4"/><circle cx="60" cy="92" r="6" fill="${N}"/><path d="M60 24V32" stroke="${N}" stroke-width="4"/>`,
  ];
  fonds.forEach((f, i) => { const x = (i % 2) * 150, y = Math.floor(i / 2) * 150; if (f !== N) s += `<rect x="${x + 6}" y="${y + 6}" width="136" height="130" fill="#ff6a1a"/>`; s += `<rect x="${x}" y="${y}" width="136" height="130" fill="${f}" stroke="${N}" stroke-width="4"/><g transform="translate(${x + 8} ${y + 4})">${ico[i]}</g>`; });
  return s + `</svg>`;
};
// ═══ 298 — nuit de lune : pleine lune, étoiles et collines superposées ═══
const nuit298 = (w, h, sfx) => {
  const r = alea(298 + w);
  let s = ouvre(`0 0 ${w} ${h}`);
  ["#cfc2ff", "#ccbfff", "#c8baff", "#c4b6fb", "#c0b1f8", "#bcadf6", "#b9a8f5"].forEach((c, i) => { s += `<rect x="0" y="${n1(i * h / 7)}" width="${w}" height="${n1(h / 7 + 1)}" fill="${c}"/>`; });
  const mx = w * 0.66, my = h * 0.32, mr = h * 0.18;
  s += halo(mx, my, mr * 3, "#ffffff", 0.55, 6) + `<circle cx="${n1(mx)}" cy="${n1(my)}" r="${n1(mr)}" fill="#fff8e1"/><circle cx="${n1(mx - mr * 0.3)}" cy="${n1(my - mr * 0.2)}" r="${n1(mr * 0.22)}" fill="#e9dcc0"/><circle cx="${n1(mx + mr * 0.35)}" cy="${n1(my + mr * 0.3)}" r="${n1(mr * 0.3)}" fill="#e9dcc0"/><circle cx="${n1(mx + mr * 0.1)}" cy="${n1(my - mr * 0.55)}" r="${n1(mr * 0.12)}" fill="#e9dcc0"/>`;
  for (let i = 0; i < (w < 600 ? 14 : 30); i++) { const x = n1(r() * w), y = n1(r() * h * 0.55), t = n1(3 + r() * 5); s += `<path d="M${x} ${n1(y - t)}L${n1(x + t * 0.3)} ${n1(y - t * 0.3)}L${n1(x + t)} ${y}L${n1(x + t * 0.3)} ${n1(y + t * 0.3)}L${x} ${n1(y + t)}L${n1(x - t * 0.3)} ${n1(y + t * 0.3)}L${n1(x - t)} ${y}L${n1(x - t * 0.3)} ${n1(y - t * 0.3)}Z" fill="#160f33" opacity="${n1(0.35 + r() * 0.5)}"/>`; }
  const f = w < 600 ? 0.014 : 0.0042;
  [["#8f7bea", 0.62, 0.1, 0.4], ["#a08ceb", 0.74, 0.09, 2.1], ["#b9a8f5", 0.88, 0.08, 4.2]].forEach(([c, y0, a, ph]) => { s += `<path d="${chemin(vaguePoints(w, h * y0, h * a, f, ph, 24))}L${w + 24} ${h}L0 ${h}Z" fill="${c}"/>`; });
  return s + `</svg>`;
};
// ═══ 299 — écrans alignés sur trame de carrés ═══
const ecrans299 = (vb) => {
  let s = ouvre(vb) + `<rect x="0" y="0" width="1400" height="240" fill="#1c1f24"/>`;
  for (let i = 0; i < 31; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 0) s += `<rect x="${i * 46}" y="${j * 46}" width="46" height="46" fill="#ffffff" opacity="0.04"/>`;
  s += `<rect x="0" y="212" width="1400" height="4" fill="#00b8d9"/>`;
  s += `<rect x="410" y="34" width="290" height="170" fill="#0b1114" stroke="#00b8d9" stroke-width="5"/><rect x="430" y="52" width="130" height="14" fill="#00b8d9"/><rect x="430" y="80" width="250" height="8" fill="#f2f6f8" opacity="0.5"/><rect x="430" y="98" width="200" height="8" fill="#f2f6f8" opacity="0.5"/><rect x="430" y="124" width="110" height="64" fill="#00b8d9" opacity="0.85"/><rect x="556" y="124" width="124" height="64" fill="#f2f6f8" opacity="0.2"/><rect x="380" y="204" width="350" height="10" fill="#00b8d9"/>`;
  s += `<rect x="740" y="64" width="124" height="148" fill="#0b1114" stroke="#f2f6f8" stroke-width="5"/><rect x="756" y="82" width="92" height="40" fill="#f2f6f8" opacity="0.85"/><rect x="756" y="134" width="60" height="8" fill="#00b8d9"/><rect x="756" y="152" width="92" height="8" fill="#f2f6f8" opacity="0.4"/>`;
  s += `<rect x="884" y="96" width="76" height="116" fill="#00b8d9" stroke="#0b1114" stroke-width="5"/><rect x="896" y="112" width="52" height="32" fill="#0b1114"/><rect x="896" y="156" width="36" height="8" fill="#0b1114"/><rect x="990" y="124" width="54" height="54" fill="#0b1114" stroke="#f2f6f8" stroke-width="5"/><rect x="1004" y="138" width="26" height="26" fill="#00b8d9"/><rect x="1006" y="96" width="22" height="28" fill="#f2f6f8" opacity="0.5"/><rect x="1006" y="178" width="22" height="34" fill="#f2f6f8" opacity="0.5"/></svg>`;
  return s;
};
// ═══ 300 — médaillon d'éditeur ═══
const medaillon300 = () => {
  const B = "#7a1f38", O = "#8a6a1f";
  let s = ouvre("0 0 240 240") + `<circle cx="120" cy="120" r="112" fill="none" stroke="${B}" stroke-width="4"/><circle cx="120" cy="120" r="104" fill="none" stroke="${B}" stroke-width="1.5"/>`;
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, r1 = i % 2 ? 90 : 98; s += `<path d="M${n1(120 + 70 * Math.cos(a))} ${n1(120 + 70 * Math.sin(a))}L${n1(120 + r1 * Math.cos(a))} ${n1(120 + r1 * Math.sin(a))}" stroke="${O}" stroke-width="${i % 2 ? 1.5 : 2.5}"/>`; }
  s += `<circle cx="120" cy="120" r="64" fill="#f4ecda" stroke="${B}" stroke-width="3"/><path d="M120 96C104 88 84 88 66 94V148C84 142 104 142 120 150Z" fill="#fbf6ec" stroke="${B}" stroke-width="3"/><path d="M120 96C136 88 156 88 174 94V148C156 142 136 142 120 150Z" fill="#fbf6ec" stroke="${B}" stroke-width="3"/>`;
  [104, 114, 124].forEach((y) => { s += `<path d="M76 ${y}C86 ${y - 3} 98 ${y - 3} 110 ${y + 2}M130 ${y + 2}C142 ${y - 3} 154 ${y - 3} 164 ${y}" fill="none" stroke="${B}" opacity="0.55" stroke-width="2"/>`; });
  return s + `<path d="M120 62L124 72L134 72L126 78L129 88L120 82L111 88L114 78L106 72L116 72Z" fill="${O}"/><path d="M104 156H136" stroke="${B}" stroke-width="3"/></svg>`;
};
// ═══ 301 — ligne de bus en escalier ═══
const ligne301 = (w, h) => {
  const marches = w < 600 ? 4 : 8, dx = (w - 140) / marches, dy = (h - 70) / marches;
  let s = ouvre(`0 0 ${w} ${h}`) + `<rect x="0" y="0" width="${w}" height="${h}" fill="#fff4ee"/>`;
  const pts = []; for (let i = 0; i <= marches; i++) pts.push([n1(40 + i * dx), n1(34 + i * dy)]);
  const trace = (d) => { let p = `M${pts[0][0]} ${pts[0][1] + d}`; for (let i = 1; i < pts.length; i++) p += `H${pts[i][0]}V${pts[i][1] + d}`; return p; };
  s += `<path d="${trace(14)}" fill="none" stroke="#f9b8a3" stroke-width="10"/><path d="${trace(7)}" fill="none" stroke="#f2704f" stroke-width="10"/><path d="${trace(0)}" fill="none" stroke="#c8321e" stroke-width="12"/>`;
  pts.forEach(([x, y], i) => { s += `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" fill="${i === pts.length - 1 ? "#c8321e" : "#ffffff"}" stroke="#240803" stroke-width="4"/>`; });
  const bx = w - 150, by = h - 62;
  s += `<rect x="${bx}" y="${by}" width="120" height="42" fill="#c8321e" stroke="#240803" stroke-width="4"/><rect x="${bx + 10}" y="${by + 8}" width="20" height="14" fill="#fff4ee"/><rect x="${bx + 38}" y="${by + 8}" width="20" height="14" fill="#fff4ee"/><rect x="${bx + 66}" y="${by + 8}" width="20" height="14" fill="#fff4ee"/><rect x="${bx + 94}" y="${by + 8}" width="18" height="26" fill="#f9b8a3"/><circle cx="${bx + 26}" cy="${by + 44}" r="9" fill="#240803"/><circle cx="${bx + 92}" cy="${by + 44}" r="9" fill="#240803"/><path d="M0 ${h - 2}H${w}" stroke="#240803" stroke-width="3"/></svg>`;
  return s;
};

module.exports = { dessin, dessinDeux, arcs07, globeMini290, nomMonumental, etoileLogo, nomBiseau, vagues292, preuve293, dico294, flux295, telephone296, vignettes297, nuit298, ecrans299, medaillon300, ligne301 };
