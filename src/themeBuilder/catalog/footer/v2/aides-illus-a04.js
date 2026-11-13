// Aides d'illustration (agent a04) : dessins vectoriels inline uniques par modèle, insérés dans le widget « html » (formes seulement, aria-hidden, couleurs en dur).
const enveloppe = (w, h, corps) => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg>`;
// large = [w, h, gen], etroit (facultatif) = variante mobile. Renvoie un tableau de widgets html.
function dessin(k, large, etroit, st) {
  const un = (d) => k.W("html", { html: enveloppe(d[0], d[1], d[2](d[0], d[1])) }, { width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...(st || {}) });
  if (!etroit) return [un(large)];
  return [{ ...un(large), hideOn: ["mobile"] }, { ...un(etroit), hideOn: ["desktop", "tablet"] }];
}
const P = (pts) => pts.map((p) => `${r(p[0])},${r(p[1])}`).join(" ");
const r = (n) => Math.round(n * 10) / 10;

// Sans dégradé ni filtre (le nettoyeur du HTML les retire) : fond « dégradé » = bandes de couleurs, halo = cercles translucides empilés.
const lerp = (a, b, t) => { const x = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = x(a), B = x(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const bandesCol = (W, H, c1, c2, n = 10) => { let s = ""; for (let i = 0; i < n; i++) s += `<rect x="0" y="${r(H * i / n)}" width="${W}" height="${r(H / n + 1)}" fill="${lerp(c1, c2, i / (n - 1))}"/>`; return s; };
const halo = (cx, cy, R, c, n = 7, op = 0.09) => { let s = ""; for (let i = 0; i < n; i++) s += `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * (1 - i / n))}" fill="${c}" opacity="${op}"/>`; return s; };
const alea = (g) => { let a = g >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ── Police dessinée à la main (traits épais, angles vifs) pour les noms monumentaux : lettres de 140 de haut, corps x de 40 à 130.
const GL = { // [chemin, avance, extra (formes pleines)]
  o: ['<ellipse cx="50" cy="85" rx="38" ry="33"/>', 100], c: ['<path d="M84,62 A38,33 0 1 0 84,108"/>', 100],
  e: ['<path d="M12,85 H88 A38,33 0 1 0 74,110"/>', 100], n: ['<path d="M12,130 V40 M12,82 C12,48 88,44 88,86 V130"/>', 100],
  m: ['<path d="M12,130 V40 M12,82 C12,48 70,44 70,86 V130 M70,86 C70,48 128,44 128,86 V130"/>', 140], r: ['<path d="M12,130 V40 M12,86 C12,56 58,44 90,54"/>', 96],
  a: ['<ellipse cx="46" cy="85" rx="34" ry="33"/><path d="M80,40 V130"/>', 100], u: ['<path d="M12,40 V90 A38,26 0 0 0 88,90 M88,40 V130"/>', 100],
  l: ['<path d="M12,130 V0"/>', 36], i: ['<path d="M12,130 V40"/>', 36, '<rect x="0" y="0" width="24" height="24" stroke="none"/>'],
  s: ['<path d="M84,66 C84,42 16,42 16,68 C16,94 84,82 84,108 C84,134 16,134 16,110"/>', 100],
};
// mot(« orme », couleur) -> { corps, w } ; les lettres inconnues sont ignorées. `sw` = épaisseur du trait.
function mot(texte, couleur, sw = 24, ecart = 16) {
  let x = 0, s = "";
  for (const c of texte) { const g = GL[c]; if (!g) continue; s += `<g transform="translate(${x} 0)" fill="none" stroke="${couleur}" stroke-width="${sw}" stroke-linejoin="miter" stroke-linecap="butt">${g[0]}</g>`; if (g[2]) s += `<g transform="translate(${x} 0)" fill="${couleur}">${g[2]}</g>`; x += g[1] + ecart; }
  return { corps: s, w: x - ecart + 12 };
}

// ── 314 « orme » : lettres noires, carré orange, cintre accroché sur le m
function nomOrme(W, H) {
  const m = mot("orme", "#0d0d0d", 26, 22); const vw = m.w, h = 160, k = W / vw;
  return `<g transform="translate(0 ${r(H - 150 * k)}) scale(${r(k)})">${m.corps}</g>` + `<g transform="scale(${r(k)})"><rect x="${r(vw * 0.78)}" y="10" width="30" height="30" fill="#c8381a"/><path d="M${r(vw * 0.5)},-4 V10 M${r(vw * 0.5 - 34)},38 L${r(vw * 0.5)},8 L${r(vw * 0.5 + 34)},38 Z" stroke="#c8381a" stroke-width="7" fill="none"/></g>`;
}
nomOrme.ratio = (W) => { const m = mot("orme", "#0"); return Math.round(W * 160 / m.w); };
// générique : mot sur toute la largeur ; retourne [corps, hauteur]
function monument(texte, W, o = {}) {
  const m = mot(texte, o.couleur, o.sw || 26, o.ecart || 22), k = W / m.w, haut = o.haut || 150;
  return { H: Math.round((haut + (o.marge || 0)) * k), corps: `<g transform="translate(0 ${r((o.marge || 0) * k)}) scale(${r(k)})">${m.corps}</g>`, k, vw: m.w };
}

// ── pictogrammes : cinq vignettes alignées (remplacent la rangée de logos de partenaires)
function rangee(pictos, fond, trait, accent) {
  return (W, H) => { const n = pictos.length, pas = W / n; let s = `<rect width="${W}" height="${H}" fill="${fond}"/>`; pictos.forEach((p, i) => { const cx = pas * (i + 0.5); const q = Math.min(1, pas / 118); s += `<g transform="translate(${r(cx - 50 * q)} ${r(H / 2 - 50 * q)}) scale(${r(q)})" fill="none" stroke="${trait}" stroke-width="5" stroke-linejoin="miter">${p(trait, accent)}</g><rect x="${r(cx - 38 * q)}" y="${r(H / 2 + 62 * q)}" width="${r(76 * q)}" height="7" fill="${trait}" opacity="0.5"/>`; }); return s; };
}
const garments = [
  (t, a) => `<path d="M20,30 L40,14 H60 L80,30 L94,52 L78,60 L72,48 V96 H28 V48 L22,60 L6,52 Z"/><path d="M40,14 L50,28 L60,14" stroke="${a}"/>`,
  (t, a) => `<path d="M26,8 H74 V30 L82,96 H58 L50,44 L42,96 H18 L26,30 Z"/><path d="M26,22 H74" stroke="${a}"/>`,
  (t, a) => `<path d="M24,18 H76 L90,40 V96 H10 V40 Z"/><path d="M24,18 L50,40 L76,18"/><line x1="50" y1="40" x2="50" y2="96" stroke="${a}"/>`,
  (t, a) => `<path d="M30,12 H70 V26 H30 Z"/><path d="M26,26 H74 V96 H26 Z"/><path d="M26,52 H74" stroke="${a}"/><circle cx="50" cy="74" r="8"/>`,
  (t, a) => `<path d="M14,70 C14,50 50,20 86,70 V86 H14 Z"/><path d="M14,86 H86 V96 H14 Z" fill="${a}" stroke="none"/>`,
];
const urbains = [
  (t, a) => `<path d="M8,70 C8,50 40,56 52,42 L66,52 L92,56 V76 H8 Z"/><path d="M8,76 H92 V88 H8 Z" fill="${a}" stroke="none"/><path d="M30,50 L34,60 M42,46 L46,58"/>`,
  (t, a) => `<path d="M14,60 C14,24 86,24 86,60 Z"/><path d="M6,60 H72 L94,70 H6 Z" fill="${a}" stroke="none"/>`,
  (t, a) => `<path d="M24,18 L10,40 L22,50 V92 H78 V50 L90,40 L76,18 H62 L50,32 L38,18 Z"/><path d="M50,32 V92" stroke="${a}"/>`,
  (t, a) => `<rect x="18" y="34" width="64" height="56"/><path d="M34,34 C34,10 66,10 66,34"/><rect x="40" y="52" width="20" height="14" fill="${a}" stroke="none"/>`,
  (t, a) => `<path d="M30,12 H70 L66,56 H34 Z"/><path d="M26,56 H74 V92 H26 Z" fill="${a}" stroke="none"/><path d="M34,74 H66"/>`,
];
const ingredients = [
  (t, a) => `<path d="M50,92 C20,70 22,30 50,10 C78,30 80,70 50,92 Z"/><path d="M50,92 V28" stroke="${a}"/><path d="M50,60 L32,46 M50,46 L68,34"/>`,
  (t, a) => `<path d="M50,8 L24,56 A27,27 0 1 0 76,56 Z"/><path d="M38,64 a14,14 0 0 0 10,16" stroke="${a}"/>`,
  (t, a) => `<ellipse cx="50" cy="52" rx="22" ry="38"/><path d="M50,14 V90 M28,52 H72" stroke="${a}"/>`,
  (t, a) => `<circle cx="50" cy="50" r="12" fill="${a}" stroke="none"/><path d="M50,38 L38,8 H62 Z M62,50 L92,38 V62 Z M50,62 L62,92 H38 Z M38,50 L8,62 V38 Z"/>`,
  (t, a) => `<path d="M50,6 V60 M50,60 C30,60 20,76 14,94 M50,60 C70,60 80,76 86,94 M50,60 V94"/><path d="M50,20 L32,28 M50,34 L70,40" stroke="${a}"/>`,
];
const molecules = [
  (t, a) => { const p = [0, 1, 2, 3, 4, 5].map((i) => [50 + 38 * Math.cos(Math.PI / 3 * i + Math.PI / 6), 52 + 38 * Math.sin(Math.PI / 3 * i + Math.PI / 6)]); return `<polygon points="${P(p)}"/>` + p.filter((_, i) => i % 2).map((q) => `<circle cx="${r(q[0])}" cy="${r(q[1])}" r="6" fill="${a}" stroke="none"/>`).join(""); },
  (t, a) => `<path d="M38,8 H62 M42,8 V36 L16,86 H84 L58,36 V8"/><path d="M26,66 H74" stroke="${a}"/>`,
  (t, a) => `<circle cx="30" cy="60" r="14"/><circle cx="72" cy="30" r="10"/><circle cx="74" cy="76" r="14" fill="${a}" stroke="none"/><path d="M42,52 L62,36 M42,66 L62,74"/>`,
  (t, a) => `<rect x="22" y="14" width="56" height="76"/><path d="M22,40 H78 M22,66 H78" stroke="${a}"/><circle cx="50" cy="27" r="5"/>`,
  (t, a) => `<path d="M10,70 L30,40 L50,60 L70,22 L92,44"/><circle cx="30" cy="40" r="5" fill="${a}" stroke="none"/><circle cx="70" cy="22" r="5" fill="${a}" stroke="none"/><path d="M10,90 H92" stroke="${a}"/>`,
];

// ── Étiquettes flottantes à curseur (comme les curseurs nommés de la capture) : pastille colorée + barre de nom, flèche de curseur
function curseurs(couleurs, fond, guide) {
  return (W, H) => {
    const al = alea(W + H); let s = `<rect width="${W}" height="${H}" fill="${fond}"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${r(W * 0.06)}" y="${r(H * (0.12 + i * 0.15))}" width="${r(W * 0.88)}" height="1.5" fill="${guide}" opacity="0.28"/>`;
    [[0.14, 0.2, 0], [0.84, 0.34, 1], [0.08, 0.62, 2], [0.78, 0.8, 3], [0.46, 0.1, 4]].forEach(([fx, fy, i]) => { const x = Math.min(W * fx, W - 124), y = H * fy, c = couleurs[i % couleurs.length]; s += `<polygon points="${P([[x, y], [x + 4, y + 20], [x + 11, y + 14]])}" fill="${c}"/><rect x="${r(x + 8)}" y="${r(y + 18)}" width="${r(i % 2 ? 108 : 86)}" height="26" fill="${c}"/><rect x="${r(x + 14)}" y="${r(y + 25)}" width="12" height="12" fill="#ffffff" opacity="0.9"/><rect x="${r(x + 32)}" y="${r(y + 29)}" width="${i % 2 ? 56 : 34}" height="5" fill="#ffffff" opacity="0.9"/>`; });
    return s;
  };
}

// ── Emblème de marque (petit médaillon dessiné)
const embleme = (k, couleur, fond, forme) => dessin(k, [64, 64, () => `<rect width="64" height="64" fill="${couleur}"/>` + forme(fond)], null, { width: "56px" })[0];
const formes = {
  cintre: (f) => `<path d="M32,12 V20 M12,44 L32,20 L52,44 Z" stroke="${f}" stroke-width="5" fill="none"/>`,
  soleil: (f) => `<circle cx="32" cy="32" r="11" fill="${f}"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${r(32 + Math.cos(i * 0.785) * 17)}" y1="${r(32 + Math.sin(i * 0.785) * 17)}" x2="${r(32 + Math.cos(i * 0.785) * 25)}" y2="${r(32 + Math.sin(i * 0.785) * 25)}" stroke="${f}" stroke-width="4"/>`).join(""),
  pelote: (f) => `<circle cx="32" cy="32" r="20" fill="none" stroke="${f}" stroke-width="4"/><path d="M14,26 Q32,40 50,26 M14,38 Q32,52 50,38 M26,14 Q40,32 26,50" stroke="${f}" stroke-width="3" fill="none"/>`,
  feuille: (f) => `<path d="M32,54 C10,40 12,16 32,8 C52,16 54,40 32,54 Z" fill="${f}"/><path d="M32,54 V20" stroke="#000" opacity=".35" stroke-width="3"/>`,
  goutte: (f) => `<path d="M32,8 L16,36 A16,16 0 1 0 48,36 Z" fill="${f}"/>`,
  fiole: (f) => `<path d="M24,8 H40 M27,8 V26 L12,54 H52 L37,26 V8" stroke="${f}" stroke-width="5" fill="none"/>`,
  cube: (f) => `<polygon points="32,10 52,21 32,32 12,21" fill="${f}"/><polygon points="12,25 30,35 30,56 12,46" fill="${f}" opacity=".75"/><polygon points="52,25 34,35 34,56 52,46" fill="${f}" opacity=".5"/>`,
  voile: (f) => `<polygon points="32,8 32,42 12,42" fill="${f}"/><polygon points="36,16 36,42 52,42" fill="${f}" opacity=".7"/><rect x="10" y="46" width="44" height="6" fill="${f}"/>`,
};

// ── Scènes de pied (capture 15) ────────────────────────────────────────────────────────────────────────────────────
// 322 : îles flottantes de nuit (bleu et or), cascades, tours, arbres
function ilesNuit(W, H) {
  const al = alea(322); let s = bandesCol(W, H, "#0e1a2b", "#1c3354", 9) + halo(W * 0.7, H * 0.3, H * 0.28, "#e2b857", 6, 0.08);
  for (let i = 0; i < 40; i++) s += `<rect x="${r(al() * W)}" y="${r(al() * H * 0.6)}" width="3" height="3" fill="#f2ead7" opacity="${r(0.3 + al() * 0.6)}"/>`;
  s += `<circle cx="${r(W * 0.7)}" cy="${r(H * 0.2)}" r="${r(H * 0.07)}" fill="#f2ead7"/>`;
  const ile = (cx, cy, w, h, tour, arbre) => {
    const g = `<polygon points="${P([[cx - w / 2, cy], [cx + w / 2, cy], [cx + w * 0.38, cy + h * 0.22], [cx + w * 0.2, cy + h * 0.6], [cx + w * 0.06, cy + h], [cx - w * 0.1, cy + h * 0.55], [cx - w * 0.3, cy + h * 0.28]])}" fill="#243f66"/><polygon points="${P([[cx + w * 0.06, cy + h], [cx + w * 0.2, cy + h * 0.6], [cx + w * 0.38, cy + h * 0.22], [cx + w / 2, cy], [cx + w * 0.1, cy]])}" fill="#17294a"/><rect x="${r(cx - w / 2)}" y="${r(cy - h * 0.06)}" width="${r(w)}" height="${r(h * 0.08)}" fill="#6a8a5c"/><rect x="${r(cx - w * 0.04)}" y="${r(cy + h * 0.2)}" width="${r(w * 0.04)}" height="${r(H - cy - h * 0.2)}" fill="#e2b857" opacity="0.28"/>`;
    let t = ""; if (tour) { t += `<polygon points="${P([[cx - w * 0.05, cy - h * 0.06], [cx, cy - h * 1.1], [cx + w * 0.05, cy - h * 0.06]])}" fill="#d9c58f"/><polygon points="${P([[cx + w * 0.12, cy - h * 0.06], [cx + w * 0.16, cy - h * 0.6], [cx + w * 0.2, cy - h * 0.06]])}" fill="#b89c55"/><rect x="${r(cx - 4)}" y="${r(cy - h * 0.8)}" width="8" height="12" fill="#0e1a2b"/>`; }
    if (arbre) { t += `<rect x="${r(cx - w * 0.3 - 4)}" y="${r(cy - h * 0.5)}" width="8" height="${r(h * 0.46)}" fill="#0e1a2b"/><circle cx="${r(cx - w * 0.3)}" cy="${r(cy - h * 0.55)}" r="${r(w * 0.1)}" fill="#e2b857"/><circle cx="${r(cx - w * 0.3 + w * 0.06)}" cy="${r(cy - h * 0.48)}" r="${r(w * 0.07)}" fill="#c99a32"/>`; }
    return g + t;
  };
  s += ile(W * 0.1, H * 0.62, W * 0.2, H * 0.3, false, true) + ile(W * 0.32, H * 0.32, W * 0.16, H * 0.24, true, false) + ile(W * 0.55, H * 0.58, W * 0.24, H * 0.36, true, true) + ile(W * 0.82, H * 0.5, W * 0.18, H * 0.3, false, true) + ile(W * 0.94, H * 0.2, W * 0.1, H * 0.16, true, false);
  for (let i = 0; i < 5; i++) s += `<rect x="${r(al() * W * 0.9)}" y="${r(H * (0.82 + al() * 0.12))}" width="${r(W * (0.12 + al() * 0.15))}" height="14" fill="#f2ead7" opacity="0.08"/>`;
  return s;
}
// 318 : mer au soleil couchant, phare sur son rocher, voilier, mouettes
function merPhare(W, H) {
  const u = H / 520; let s = bandesCol(W, H, "#10261c", "#3d7050", 10) + halo(W / 2, H * 0.66, H * 0.4, "#e8c872", 6, 0.12) + `<circle cx="${r(W / 2)}" cy="${r(H * 0.66)}" r="${r(60 * u)}" fill="#f1ead9"/>`;
  const vague = (y, amp, c, dec, lg) => { let d = `M0,${H} L0,${r(y)}`; for (let x = 0; x <= W; x += 10) d += ` L${x},${r(y + Math.sin((x + dec) / lg) * amp)}`; return `<path d="${d} L${W},${H} Z" fill="${c}"/>`; };
  s += vague(H * 0.7, 6 * u, "#1d4030", 0, 90) + vague(H * 0.78, 9 * u, "#173428", 70, 120) + vague(H * 0.86, 10 * u, "#10261c", 20, 150) + vague(H * 0.94, 8 * u, "#0a1a12", 200, 110);
  const lx = W * 0.16, ly = H * 0.55;
  s += `<polygon points="${P([[lx - 90 * u, H], [lx - 60 * u, ly + 70 * u], [lx + 60 * u, ly + 70 * u], [lx + 100 * u, H]])}" fill="#0a1a12"/><polygon points="${P([[lx - 20 * u, ly + 70 * u], [lx - 12 * u, ly - 60 * u], [lx + 12 * u, ly - 60 * u], [lx + 20 * u, ly + 70 * u]])}" fill="#f1ead9"/><rect x="${r(lx - 18 * u)}" y="${r(ly - 20 * u)}" width="${r(36 * u)}" height="${r(14 * u)}" fill="#c8381a"/><rect x="${r(lx - 16 * u)}" y="${r(ly - 90 * u)}" width="${r(32 * u)}" height="${r(30 * u)}" fill="#e8c872"/><polygon points="${P([[lx - 22 * u, ly - 90 * u], [lx, ly - 112 * u], [lx + 22 * u, ly - 90 * u]])}" fill="#0a1a12"/><polygon points="${P([[lx + 16 * u, ly - 78 * u], [lx + 360 * u, ly - 130 * u], [lx + 360 * u, ly - 20 * u]])}" fill="#e8c872" opacity="0.22"/>`;
  const bx = W * 0.68, by = H * 0.74;
  s += `<polygon points="${P([[bx, by - 120 * u], [bx, by - 4 * u], [bx - 70 * u, by - 4 * u]])}" fill="#f1ead9"/><polygon points="${P([[bx + 6 * u, by - 96 * u], [bx + 6 * u, by - 4 * u], [bx + 58 * u, by - 4 * u]])}" fill="#e8c872"/><polygon points="${P([[bx - 84 * u, by + 4 * u], [bx + 72 * u, by + 4 * u], [bx + 52 * u, by + 28 * u], [bx - 62 * u, by + 28 * u]])}" fill="#f1ead9"/><path d="M${r(bx - 60 * u)},${r(by + 34 * u)} L${r(bx - 460 * u)},${r(by + 70 * u)} M${r(bx - 40 * u)},${r(by + 38 * u)} L${r(bx - 520 * u)},${r(by + 90 * u)}" stroke="#f1ead9" stroke-width="2.5" fill="none" opacity="0.8"/>`;
  [[0.4, 0.2], [0.46, 0.16], [0.82, 0.26], [0.88, 0.2]].forEach(([fx, fy]) => { const x = W * fx, y = H * fy; s += `<path d="M${r(x - 18 * u)},${r(y)} L${r(x)},${r(y + 10 * u)} L${r(x + 18 * u)},${r(y)}" stroke="#f1ead9" stroke-width="3" fill="none"/>`; });
  return s;
}
// 319 : champ de mannequins sous des fanions, collines rose et bleu nuit
function champMannequins(W, H) {
  const u = H / 520; let s = bandesCol(W, H, "#f8e6ea", "#f3c6cf", 8) + halo(W / 2, H * 0.42, H * 0.4, "#ffffff", 6, 0.18);
  const col = ["#1b1a3d", "#e86a8a", "#26255a", "#f3c6cf", "#8c4a9e", "#e86a8a"];
  s += `<path d="M0,${r(40 * u)} Q${r(W / 2)},${r(100 * u)} ${W},${r(40 * u)}" stroke="#1b1a3d" stroke-width="3" fill="none"/>`;
  for (let i = 0; i < 18; i++) { const t = i / 17, x = W * t, y = 40 * u + Math.sin(Math.PI * t) * 60 * u; s += `<polygon points="${P([[x - 14, y], [x + 14, y + 2], [x, y + 36 * u]])}" fill="${col[i % col.length]}"/>`; }
  s += `<path d="M0,${H * 0.7} C${W * 0.2},${H * 0.5} ${W * 0.4},${H * 0.62} ${W * 0.55},${H * 0.66} S${W * 0.9},${H * 0.5} ${W},${H * 0.6} V${H} H0 Z" fill="#e8a2b6"/><path d="M0,${H * 0.82} C${W * 0.25},${H * 0.7} ${W * 0.6},${H * 0.9} ${W},${H * 0.76} V${H} H0 Z" fill="#26255a"/><path d="M0,${H * 0.94} C${W * 0.3},${H * 0.86} ${W * 0.7},${H * 1.0} ${W},${H * 0.9} V${H} H0 Z" fill="#1b1a3d"/>`;
  const forme = (x, base, hh, c, long) => { const t = base - hh; return `<line x1="${r(x)}" y1="${r(base)}" x2="${r(x)}" y2="${r(t + hh * 0.5)}" stroke="#1b1a3d" stroke-width="5"/><rect x="${r(x - 22)}" y="${r(base - 4)}" width="44" height="6" fill="#1b1a3d"/><circle cx="${r(x)}" cy="${r(t - 10)}" r="9" fill="#1b1a3d"/><polygon points="${P([[x - 24, t], [x + 24, t], [x + 16, t + hh * 0.34], [x + (long ? 40 : 22), t + hh * 0.7], [x - (long ? 40 : 22), t + hh * 0.7], [x - 16, t + hh * 0.34]])}" fill="${c}"/><rect x="${r(x - 17)}" y="${r(t + hh * 0.34)}" width="34" height="5" fill="#1b1a3d" opacity="0.4"/>`; };
  [[0.1, 0.78, 190, 0, 1], [0.24, 0.8, 150, 1, 0], [0.38, 0.76, 210, 2, 1], [0.54, 0.8, 160, 3, 0], [0.7, 0.77, 200, 4, 1], [0.86, 0.8, 150, 5, 0]].forEach(([fx, fy, hh, c, l]) => { s += forme(W * fx, H * fy + 22 * u, hh * u, col[c + (c === 1 ? 0 : 0)], l); });
  return s;
}
// 325 : rizières en gradins roses, gouttes de rosée, soleil de goutte
function gradinsRosee(W, H) {
  const al = alea(325); let s = bandesCol(W, H, "#fbf3ef", "#f4d9d0", 8) + halo(W * 0.22, H * 0.34, H * 0.3, "#ffffff", 6, 0.2);
  const goutte = (x, y, q, c) => `<path d="M${r(x)},${r(y - 1.25 * q)} L${r(x - 0.9 * q)},${r(y + 0.1 * q)} A${r(q)},${r(q)} 0 1 0 ${r(x + 0.9 * q)},${r(y + 0.1 * q)} Z" fill="${c}"/><circle cx="${r(x - 0.35 * q)}" cy="${r(y + 0.35 * q)}" r="${r(0.18 * q)}" fill="#ffffff" opacity="0.75"/>`;
  s += goutte(W * 0.22, H * 0.28, H * 0.11, "#7a2b1e");
  const n = 6, teintes = ["#f1c9bf", "#ebb5a8", "#e0a090", "#d28b7b", "#c0725f", "#a8503d"];
  for (let i = 0; i < n; i++) { const y = H * (0.34 + i * 0.11), x0 = W * (0.1 + i * 0.03), x1 = W * (1 - 0.02 * i); s += `<polygon points="${P([[x0, y], [x1, y], [x1 + 14, H], [x0 - 20, H]])}" fill="${teintes[i]}"/><rect x="${r(x0)}" y="${r(y)}" width="${r(x1 - x0)}" height="${r(H * 0.022)}" fill="#7a2b1e" opacity="0.25"/>`; for (let j = 0; j < 7; j++) { const px = x0 + 20 + al() * (x1 - x0 - 40); s += `<path d="M${r(px)},${r(y + H * 0.02)} V${r(y - 16 * H / 520)}" stroke="#6a3a2a" stroke-width="3"/><polygon points="${P([[px, y - 16 * H / 520], [px - 7, y - 26 * H / 520], [px + 1, y - 38 * H / 520], [px + 8, y - 26 * H / 520]])}" fill="#7a2b1e"/>`; } if (i % 2 === 0) s += goutte(x0 + (x1 - x0) * (0.2 + al() * 0.6), y + H * 0.06, 8 + al() * 8, "#fbf3ef"); }
  for (let i = 0; i < 4; i++) s += `<ellipse cx="${r(W * 0.62)}" cy="${r(H * 0.93)}" rx="${70 + i * 40}" ry="${6 + i * 3}" fill="none" stroke="#fbf3ef" stroke-width="2" opacity="${r(0.9 - i * 0.2)}"/>`;
  return s;
}
// ── Mascottes
const bulle = (x, y, c, f, forme) => `<rect x="${x}" y="${y}" width="64" height="44" fill="${f}" stroke="${c}" stroke-width="3"/><polygon points="${P([[x + 10, y + 44], [x + 26, y + 44], [x + 12, y + 60]])}" fill="${f}" stroke="${c}" stroke-width="3"/><rect x="${x + 6}" y="${y + 41}" width="22" height="5" fill="${f}"/>${forme}`;
function mouette(W, H) { return `<ellipse cx="100" cy="150" rx="52" ry="40" fill="#f1ead9"/><path d="M60,150 Q100,90 150,140 Q112,168 60,150 Z" fill="#c9d3c3"/><circle cx="132" cy="96" r="30" fill="#f1ead9"/><polygon points="${P([[160, 94], [196, 102], [160, 112]])}" fill="#e8c872"/><rect x="132" y="82" width="9" height="9" fill="#10261c"/><rect x="100" y="64" width="62" height="14" fill="#c8381a"/><rect x="112" y="52" width="38" height="14" fill="#c8381a"/><rect x="84" y="186" width="6" height="26" fill="#e8c872"/><rect x="112" y="186" width="6" height="26" fill="#e8c872"/>` + bulle(0, 6, "#e8c872", "#10261c", `<path d="M32,16 V34 M24,22 H40 M20,30 Q32,42 44,30" stroke="#e8c872" stroke-width="3" fill="none"/>`); }
function mannequinSalut(W, H) { return `<line x1="100" y1="212" x2="100" y2="150" stroke="#1b1a3d" stroke-width="7"/><rect x="72" y="208" width="56" height="8" fill="#1b1a3d"/><circle cx="100" cy="52" r="20" fill="#1b1a3d"/><polygon points="${P([[70, 76], [130, 76], [120, 120], [146, 172], [54, 172], [80, 120]])}" fill="#e86a8a"/><rect x="82" y="116" width="36" height="7" fill="#1b1a3d" opacity="0.4"/><path d="M130,82 L168,50 L176,28" stroke="#1b1a3d" stroke-width="7" fill="none"/><rect x="170" y="14" width="14" height="14" fill="#1b1a3d"/>` + bulle(0, 4, "#1b1a3d", "#ffffff", `<path d="M32,34 C14,22 18,12 26,12 C30,12 32,16 32,16 C32,16 34,12 38,12 C46,12 50,22 32,34 Z" fill="#e86a8a"/>`); }
function gouttePilote(W, H) { return `<path d="M100,28 L56,112 A46,46 0 1 0 144,112 Z" fill="#e2b857"/><rect x="80" y="122" width="12" height="16" fill="#0e1a2b"/><rect x="108" y="122" width="12" height="16" fill="#0e1a2b"/><path d="M82,152 Q100,168 118,152" stroke="#0e1a2b" stroke-width="5" fill="none"/><path d="M146,128 L180,98 L186,78" stroke="#e2b857" stroke-width="8" fill="none"/><rect x="100" y="8" width="6" height="22" fill="#e2b857"/><rect x="96" y="2" width="14" height="10" fill="#e2b857"/><rect x="60" y="184" width="80" height="6" fill="#e2b857" opacity="0.4"/>` + bulle(0, 40, "#e2b857", "#0e1a2b", `<polygon points="32,52 36,62 47,62 38,69 42,80 32,73 22,80 26,69 17,62 28,62" fill="#e2b857"/>`); }
function gouttePoudree(W, H) { return `<path d="M100,24 L54,112 A48,48 0 1 0 146,112 Z" fill="#c98678"/><circle cx="78" cy="150" r="9" fill="#f4d9d0" opacity="0.7"/><circle cx="122" cy="150" r="9" fill="#f4d9d0" opacity="0.7"/><rect x="78" y="124" width="10" height="14" fill="#2b1512"/><rect x="112" y="124" width="10" height="14" fill="#2b1512"/><path d="M90,150 Q100,158 110,150" stroke="#2b1512" stroke-width="4" fill="none"/><path d="M52,130 L26,104 M148,130 L174,100" stroke="#c98678" stroke-width="8" fill="none"/><circle cx="170" cy="94" r="10" fill="#7a2b1e"/>` + bulle(0, 4, "#7a2b1e", "#fbf3ef", `<circle cx="32" cy="22" r="5" fill="#7a2b1e"/><circle cx="22" cy="26" r="5" fill="#c98678"/><circle cx="42" cy="26" r="5" fill="#c98678"/><circle cx="26" cy="34" r="5" fill="#c98678"/><circle cx="38" cy="34" r="5" fill="#c98678"/>`); }
module.exports = { lerp, bandesCol, halo, dessin, mot, monument, rangee, garments, urbains, ingredients, molecules, curseurs, embleme, formes, ilesNuit, merPhare, champMannequins, gradinsRosee, mouette, mannequinSalut, gouttePilote, gouttePoudree, P, r, alea, nomOrme };
