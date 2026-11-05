// Essence — ébéniste et mobilier artisanal. Direction artistique : le calme d'un atelier de menuiserie. Gris de copeaux, graphite, aplats de chêne, noyer, frêne, merisier et hêtre ;
// veines, nœuds et cernes dessinés en SVG, coupes d'assemblage (queues d'aronde, tenon-mortaise, mi-bois) au trait. Galerie de réalisations filtrable et configurateur d'essences et de dimensions.
const { sec, esc, nav } = require("../kit");

/* ---------- Essences (couleurs, prix du dm³ en €, style de fil, jours d'appro en semaines) ---------- */
const ESS = {
  chene: { n: "Chêne", c: "#c2a06b", v: "#85602f", l: "#dcc392", d: "#6b4c22", p: 2.6, g: "a", s: 2, dur: "Dur", teinte: "Miel doré", grain: "Droit, mailles visibles", usage: "Tables, bibliothèques, structures", sech: "3 ans en plein air puis 6 semaines en séchoir" },
  noyer: { n: "Noyer", c: "#6e4c34", v: "#3a2415", l: "#8c6747", d: "#4a3020", p: 3.9, g: "b", s: 3, dur: "Mi-dur", teinte: "Brun chocolat", grain: "Ondé, veiné de sombre", usage: "Lits, tables basses, pièces de salon", sech: "2 ans en plein air puis 5 semaines en séchoir" },
  frene: { n: "Frêne", c: "#d6c6a0", v: "#a58e5b", l: "#e8dcbb", d: "#b4a27a", p: 2.1, g: "c", s: 2, dur: "Dur et souple", teinte: "Blond clair", grain: "En cathédrales marquées", usage: "Chaises, plans de travail", sech: "2 ans en plein air puis 4 semaines en séchoir" },
  merisier: { n: "Merisier", c: "#b06a40", v: "#6f3a1d", l: "#c98960", d: "#8d4f2c", p: 3.3, g: "d", s: 3, dur: "Mi-dur", teinte: "Rose cuivré", grain: "Fin, lisse, très régulier", usage: "Bibliothèques, meubles de chambre", sech: "3 ans en plein air puis 6 semaines en séchoir" },
  hetre: { n: "Hêtre", c: "#dcb892", v: "#b08358", l: "#ebcfae", d: "#bd9770", p: 1.7, g: "e", s: 1, dur: "Dur", teinte: "Rose pâle", grain: "Très fin, piqueté", usage: "Chaises, rangements, mobilier d'enfant", sech: "1 an en plein air puis 4 semaines en séchoir" },
};
const ORDER = ["chene", "noyer", "frene", "merisier", "hetre"];

/* ---------- Dessin : générateur déterministe de veines ---------- */
const R = (seed) => { let s = (Math.imul(seed + 7, 2654435761) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
const f1 = (n) => Math.round(n * 10) / 10;
const f0 = (n) => Math.round(n);
const WOB = { a: 0.5, b: 1.5, c: 1.2, d: 0.35, e: 0.3 };

// Fil dans un rectangle : "h" = veines horizontales, "v" = verticales
let CAP = 9;
function stria(x, y, w, h, e, seed, dir, n) {
  n = Math.min(n, CAP);
  const r = R(seed), E = ESS[e], wob = WOB[E.g];
  let o = "";
  for (let i = 0; i < n; i++) {
    const t = (i + 0.35 + r() * 0.4) / n;
    if (dir === "h") {
      const yy = y + t * h, a = (r() - 0.5) * Math.min(h / n * 1.4, 9) * wob;
      o += `<path d="M${f0(x)} ${f0(yy)}Q${f0(x + w * (0.3 + r() * 0.4))} ${f0(yy + a)} ${f0(x + w)} ${f0(yy + a * 0.3)}"/>`;
    } else {
      const xx = x + t * w, a = (r() - 0.5) * Math.min(w / n * 1.4, 9) * wob;
      o += `<path d="M${f0(xx)} ${f0(y)}Q${f0(xx + a)} ${f0(y + h * (0.3 + r() * 0.4))} ${f0(xx + a * 0.3)} ${f0(y + h)}"/>`;
    }
  }
  return `<g fill="none" stroke="${E.v}" opacity=".5">${o}</g>`;
}
// Planche (aplat + fil + liseré clair en haut)
function board(x, y, w, h, e, seed, dir, n) {
  const E = ESS[e];
  return `<rect class="es-bd" x="${f0(x)}" y="${f0(y)}" width="${f0(w)}" height="${f0(h)}" fill="${E.c}"/>${stria(x, y, w, h, e, seed, dir, n)}`;
}
const elevSvg = (inner, label, cls = "") => `<svg class="es-elev ${cls}" viewBox="0 0 300 240" role="img" aria-label="${esc(label)}"><ellipse cx="150" cy="208" rx="118" ry="6" fill="#1d2321" opacity=".13"/>${inner}</svg>`;

// Élévations à plat de chaque type de pièce (proportions : wr, hr entre 0,35 et 1)
function elev(type, e, seed = 1, wr = 1, hr = 1) {
  const G = 206, E = ESS[e];
  if (type === "table") {
    const W = 120 + 140 * wr, H = 70 + 100 * hr, x0 = 150 - W / 2, lw = 14;
    return elevSvg(board(x0 + 12, G - H + 16, lw, H - 16, e, seed, "v", 3) + board(x0 + W - 12 - lw, G - H + 16, lw, H - 16, e, seed + 1, "v", 3) + board(x0 + 12 + lw, G - H + 16, W - 24 - 2 * lw, 15, e, seed + 2, "h", 3) + board(x0, G - H, W, 16, e, seed + 3, "h", 4), "Table, vue de face", "");
  }
  if (type === "chaise") {
    const W = 70 + 50 * wr, H = 120 + 80 * hr, x0 = 150 - W / 2, sy = G - H * 0.48;
    return elevSvg(board(x0 + 4, G - H, 9, H, e, seed, "v", 2) + board(x0 + W - 13, G - H, 9, H, e, seed + 1, "v", 2) + board(x0 + 13, G - H + 10, W - 26, 16, e, seed + 2, "h", 3) + board(x0 + 13, G - H + 40, W - 26, 16, e, seed + 3, "h", 3) + board(x0, sy, W, 10, e, seed + 4, "h", 3) + board(x0 + 8, sy + 10, 9, G - sy - 10, e, seed + 5, "v", 2) + board(x0 + W - 17, sy + 10, 9, G - sy - 10, e, seed + 6, "v", 2) + board(x0 + 17, G - 40, W - 34, 5, e, seed + 7, "h", 1), "Chaise, vue de face");
  }
  if (type === "bibliotheque") {
    const W = 100 + 140 * wr, H = 110 + 100 * hr, x0 = 150 - W / 2, top = G - H, sh = (H - 22) / 3;
    const bks = ["#2b3a2f", "#7d5d18", "#566059", "#8a2f2a", "#d9d6cb", "#3d4a5c"];
    let books = "", r = R(seed + 20);
    for (let k = 0; k < 3; k++) { let bx = x0 + 14; const by = top + 10 + sh * k + sh - 4; while (bx < x0 + W - 30) { const bw = 8 + r() * 9, bh = 20 + r() * (sh - 28); if (r() > 0.4) books += `<rect x="${f1(bx)}" y="${f1(by - bh)}" width="${f1(bw)}" height="${f1(bh)}" fill="${bks[Math.floor(r() * bks.length)]}" opacity=".85"/>`; bx += bw + 1; } }
    return elevSvg(`<rect x="${x0 + 12}" y="${top + 10}" width="${W - 24}" height="${H - 18}" fill="${E.d}" opacity=".8"/>` + books + board(x0, top, 12, H, e, seed, "v", 2) + board(x0 + W - 12, top, 12, H, e, seed + 1, "v", 2) + board(x0, top - 4, W, 12, e, seed + 2, "h", 3) + [0, 1, 2].map((k) => board(x0 + 12, top + 10 + sh * (k + 1) - 5 + (k === 2 ? 0 : 0), W - 24, 6, e, seed + 3 + k, "h", 1)).join("") + board(x0 + 6, G - 10, W - 12, 10, e, seed + 8, "h", 2), "Bibliothèque, vue de face");
  }
  // lit, vu de côté : tête à gauche, pied à droite
  const L = 190 + 70 * wr, x0 = 150 - L / 2, hh = 70 + 90 * hr, fh = 56;
  return elevSvg(board(x0, G - hh, 11, hh, e, seed, "v", 2) + board(x0 + L - 11, G - fh, 11, fh, e, seed + 1, "v", 2) + `<rect x="${x0 + 11}" y="${G - 78}" width="${L - 22}" height="34" rx="6" fill="#f2f3f1" stroke="#9aa39d" stroke-width="1"/><path d="M${x0 + 24} ${G - 62}h${L - 48}M${x0 + 24} ${G - 52}h${L - 48}" stroke="#c9cfca" stroke-width="1" fill="none"/>` + board(x0 + 11, G - 44, L - 22, 12, e, seed + 2, "h", 2) + board(x0 + 4, G - 30, 8, 30, e, seed + 3, "v", 1) + board(x0 + L - 12, G - 30, 8, 30, e, seed + 4, "v", 1), "Lit, vu de côté");
}

/* ---------- Assemblages au trait ---------- */
// Queues d'aronde : deux pièces séparées par un écart g, n queues sur la hauteur hg. cls = classe de trait.
function dovetail(x, y, hg, g, n = 3, L = 64, wl = 120) {
  const p = hg / n, wb = p * 0.17, wt = p * 0.33, xe = x + wl;
  let a = `M${x} ${y}H${xe}`;
  for (let i = 0; i < n; i++) { const cy = y + p * (i + 0.5); a += `V${f1(cy - wb)}L${xe + L} ${f1(cy - wt)}V${f1(cy + wt)}L${xe} ${f1(cy + wb)}`; }
  a += `V${y + hg}H${x}Z`;
  const xr = xe + g; let b = `M${xr} ${y}H${xr + wl}V${y + hg}H${xr}`;
  for (let i = n - 1; i >= 0; i--) { const cy = y + p * (i + 0.5); b += `V${f1(cy + wb)}L${xr + L} ${f1(cy + wt)}V${f1(cy - wt)}L${xr} ${f1(cy - wb)}`; }
  b += "Z";
  return { w: wl * 2 + g, paths: `<path class="es-d" d="${a}"/><path class="es-d" d="${b}"/>`, hatch: [0, 1].map((k) => { const x1 = k ? xr + 6 : x + 6; return `<path d="M${x1} ${y + hg}l${hg > 80 ? 18 : 10} -${hg > 80 ? 18 : 10}M${x1 + 22} ${y + hg}l18 -18" opacity=".45"/>`; }).join("") };
}
// Tenon et mortaise (vue en plan) : montant carré à gauche, traverse à droite avec tenon et cheville
function mortise(x, y) {
  return `<path class="es-d" d="M${x} ${y}h72v72h-72z"/><path class="es-d es-dash" d="M${x + 72} ${y + 22}h-40v28h40"/><circle class="es-d" cx="${x + 46}" cy="${y + 36}" r="5"/>` +
    `<path class="es-d" d="M${x + 150} ${y + 14}h110v44h-110v-8h-40v-28h40z"/><path d="M${x + 150} ${y + 36}h-40" opacity=".0"/><path d="M${x + 112} ${y + 30}h38" class="es-dash" opacity=".7"/><path class="es-d" d="M${x + 76} ${y + 36}h26m-8 -6l8 6-8 6" />`;
}
// Mi-bois : deux pièces à entaille, l'une par-dessus, l'autre par-dessous
function mibois(x, y) {
  return `<path class="es-d" d="M${x} ${y}H${x + 80}V${y + 18}H${x + 116}V${y}H${x + 196}V${y + 36}H${x}Z"/><path class="es-d" d="M${x} ${y + 64}H${x + 196}V${y + 100}H${x + 116}V${y + 82}H${x + 80}V${y + 100}H${x}Z"/><path class="es-d" d="M${x + 98} ${y + 40}v20m-6 -7l6 7 6 -7" opacity=".7"/>`;
}
// Enfourchement : tenon ouvert dans une fourche
function enfourche(x, y) {
  return `<path class="es-d" d="M${x} ${y}H${x + 24}V${y + 44}H${x + 54}V${y}H${x + 78}V${y + 110}H${x}Z"/><path class="es-d" d="M${x + 112} ${y + 44}H${x + 240}V${y + 66}H${x + 112}Z"/><path class="es-d" d="M${x + 84} ${y + 55}h22m-7 -6l7 6 -7 6" opacity=".7"/><circle cx="${x + 39}" cy="${y + 78}" r="4" class="es-d"/>`;
}
const inkSvg = (inner, vb, label) => `<svg class="es-ink" viewBox="${vb}" role="img" aria-label="${esc(label)}">${inner}</svg>`;
const SDOVE = () => { const d = dovetail(20, 20, 150, 56, 3, 52, 90); return inkSvg(d.paths + d.hatch, "0 0 330 190", "Assemblage à queues d'aronde, pièces écartées"); };
const SMORT = () => inkSvg(mortise(14, 30), "0 0 300 140", "Assemblage à tenon et mortaise chevillé, vue en plan");
const SMIBO = () => inkSvg(mibois(20, 12), "0 0 236 130", "Assemblage à mi-bois");
const SENFO = () => inkSvg(enfourche(14, 14), "0 0 270 140", "Assemblage à enfourchement");

/* ---------- Veines pleine largeur (hero et bandeaux) ---------- */
function veins(w, h, n, seed, kn) {
  const r = R(seed);
  let o = "";
  for (let i = 0; i < n; i++) {
    const y0 = (i + 0.5) / n * h + (r() - 0.5) * h / n, k = 1 - Math.abs(y0 - h / 2) / (h / 2), a = (20 + r() * 40) * (0.4 + k);
    o += `<path class="es-v" d="M-20 ${f1(y0)}C${f1(w * 0.2)} ${f1(y0 + a)} ${f1(w * 0.4)} ${f1(y0 - a * 1.1)} ${f1(w * 0.58)} ${f1(y0 + a * 0.4)}S${f1(w * 0.85)} ${f1(y0 - a)} ${w + 20} ${f1(y0 + a * 0.5)}" stroke-width="${f1(0.8 + r() * 1.8)}" opacity="${f1(0.35 + r() * 0.5)}"/>`;
  }
  let knots = "";
  (kn || []).forEach(([kx, ky, s]) => {
    knots += `<ellipse cx="${kx}" cy="${ky}" rx="${s * 1.9}" ry="${s * 0.78}" class="es-kn"/>`;
    for (let k = 0; k < 6; k++) knots += `<ellipse cx="${kx}" cy="${ky}" rx="${f1(s * (1.6 - k * 0.25))}" ry="${f1(s * (0.64 - k * 0.1))}" class="es-v" fill="none" stroke-width="${f1(1.6 - k * 0.2)}" opacity="${f1(0.75 - k * 0.1)}"/>`;
    knots += `<ellipse cx="${kx}" cy="${ky}" rx="${f1(s * 0.2)}" ry="${f1(s * 0.09)}" class="es-kc"/>`;
  });
  return o + knots;
}
const plankStrip = (seed, h = 80) => `<svg class="es-strip" viewBox="0 0 1600 ${h}" preserveAspectRatio="none" aria-hidden="true"><rect class="es-pl" width="1600" height="${h}"/><g class="es-vg" fill="none">${veins(1600, h, 9, seed, [])}</g></svg>`;

// Logo : rondelle à cernes
const logoMark = `<svg class="es-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="20" cy="20" rx="12" ry="11" fill="none" stroke="currentColor" stroke-width="1.4"/><ellipse cx="19" cy="21" rx="6.5" ry="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="18.5" cy="21" r="1.6" fill="currentColor"/><path d="M20 2v6" stroke="currentColor" stroke-width="1.6"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>`;

const header = (c) => sec(`<header class="es-head pk-bleed"><div class="es-bar"><a class="es-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span>Essence<small>Ébénisterie d'atelier</small></span></a>
  <div class="es-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <a class="es-btn es-btn--sm" href="/configurateur">Configurer une pièce</a>
  <details class="es-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="es-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="es-btn" href="/configurateur">Configurer une pièce</a></div></details></div></header>`);

const footer = (c) => sec(`<footer class="es-foot pk-bleed"><div class="es-foot-in"><div class="es-foot-lead">${logoMark}<p>On ne presse pas le bois. On le laisse sécher, on l'écoute, puis on le travaille.</p><address>Atelier Essence<br>12 chemin des Scieries<br>39200 Saint-Claude</address></div>
  <div><h3>Atelier</h3>${nav(c.menu.slice(1, 4), "es-fl")}</div><div><h3>Pratique</h3><a class="es-fl" href="/configurateur">Configurateur</a><a class="es-fl" href="/contact">Demander un devis</a><a class="es-fl" href="/recherche">Recherche</a></div>
  <div><h3>Heures d'atelier</h3><p>Du mardi au vendredi<br>8 h – 12 h · 14 h – 18 h<br>Visite sur rendez-vous</p></div></div>
  <p class="es-legal">© Atelier Essence — site de démonstration. Pièces, tarifs et adresse fictifs ; aucun achat n'est possible ici.</p></footer>`);

/* ---------- Catalogue de réalisations ---------- */
// id, type, nom, essence, dimensions (L×P×H cm), heures, finition, assemblage, wr, hr, texte
const PIECES = [
  ["table-aubrac", "table", "Table Aubrac", "chene", [220, 95, 75], 64, "Huilée", "Tenon-mortaise chevillé", 1, 0.55, "Un plateau de trois lames de chêne collées à fil contrarié, posé sur quatre pieds carrés. Les traverses sont chevillées : rien ne bouge, même après vingt hivers. La table se démonte en dix minutes avec un maillet."],
  ["table-cerne", "table", "Table basse Cerne", "noyer", [110, 60, 38], 28, "Mate", "Queues d'aronde", 0.5, 0.0, "Un plateau taillé dans une seule planche de noyer, choisie pour ses ondes sombres. Les angles du cadre sont assemblés à queues d'aronde visibles : la fierté de l'atelier, laissée apparente."],
  ["chaise-lucarne", "chaise", "Chaise Lucarne", "frene", [44, 48, 82], 14, "Huilée", "Enfourchement et tourillons", 0.4, 0.3, "Un dossier ajouré à deux traverses, un siège plat légèrement creusé. Le frêne, souple et résistant, permet des pieds fins sans craindre la casse. Se commande par lot de deux, quatre ou six."],
  ["chaise-mesure", "chaise", "Chaise Mesure", "hetre", [42, 45, 80], 11, "Vernie", "Tourillons collés", 0.3, 0.2, "La chaise de tous les jours : hêtre vernie mat, assise de 45 cm, dossier droit. Des lignes simples pour une pièce qui se range sous la table et se fait oublier."],
  ["bibliotheque-alignee", "bibliotheque", "Bibliothèque Alignée", "merisier", [240, 34, 210], 96, "Huilée", "Tenon-mortaise et rainures", 0.9, 0.9, "Un mur de merisier à cinq niveaux, tablettes mobiles sur taquets cachés. Le fond en panneau massif rattrape les irrégularités d'un mur ancien. Livrée en trois modules, montée sur place."],
  ["bibliotheque-basse", "bibliotheque", "Bibliothèque basse Ligne", "chene", [160, 32, 110], 52, "Mate", "Mi-bois et queues d'aronde", 0.6, 0.1, "Un meuble bas qui sert de bureau ou de séparation. Chêne clair, trois niveaux, plinthe en retrait pour une ombre légère au sol. Les montants sont assemblés à mi-bois."],
  ["lit-veillee", "lit", "Lit Veillée", "noyer", [170, 210, 95], 88, "Huilée", "Tenon-mortaise chevillé", 0.5, 0.5, "Un lit de 160 à tête haute en noyer, chevillé sans une vis. Les lattes en hêtre se glissent dans des rainures. Il se transporte en quatre éléments et se remonte à la clé."],
  ["lit-plateau", "lit", "Lit Plateau", "chene", [150, 205, 38], 70, "Mate", "Mi-bois et chevilles", 0.4, 0.0, "Un lit bas sur plateau de chêne, sans tête de lit, pour les chambres sous les toits. Les pieds sont en retrait de cinq centimètres : la pièce semble flotter."],
];
const TYPES = [["table", "Tables", "Table"], ["chaise", "Chaises", "Chaise"], ["bibliotheque", "Bibliothèques", "Bibliothèque"], ["lit", "Lits", "Lit"]];
const typeName = (t) => (TYPES.find((x) => x[0] === t) || [])[2];
const dims = (d, t) => (t === "lit" ? `${d[0]} × ${d[1]} cm · tête ${d[2]} cm` : `${d[0]} × ${d[1]} × ${d[2]} cm`);

const SPAN = [7, 5, 4, 4, 4];
const wOf = (i, n) => { let sum = 0; for (let k = 0; k < i; k++) { sum += SPAN[k % 5]; if (sum >= 12) sum = 0; } return i === n - 1 && sum === 0 && i > 0 ? 5 : i % 5; };
function cardE(p, i, n = 5) {
  const [id, type, nom, e, d, h, fin, , wr, hr] = p, E = ESS[e];
  return `<a class="es-lame" data-w="${wOf(i, n)}" data-t="${type}" href="/realisation#${id}" data-reveal><span class="es-edge es-e-${e}"></span><span class="es-fig">${(CAP = 2, elev(type, e, i * 11 + 3, wr, hr))}${(CAP = 9, "")}</span>
    <span class="es-lame-b"><span class="es-chip"><i class="es-e-${e}"></i>${E.n}</span><span class="es-lame-t">${esc(nom)}</span><span class="es-lame-m">${dims(d, type)}</span><span class="es-lame-m es-lame-h">${h} h d'atelier · ${fin.toLowerCase()}</span></span></a>`;
}

const pagehead = (kicker, title, sub, seed) => sec(`<section class="es-ph pk-bleed">${plankStrip(seed, 70)}<div class="es-ph-in"><p class="es-kick" data-reveal>${esc(kicker)}</p><div class="es-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="es-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

/* ---------- Accueil ---------- */
const heroSvg = () => {
  const d = dovetail(980, 150, 190, 70, 3, 70, 110);
  return `<svg class="es-heroplank" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect class="es-pl" width="1600" height="640"/><g class="es-vg" fill="none">${veins(1600, 640, 44, 5, [[700, 130, 46], [470, 540, 38]])}</g>
    <g class="es-chalk" fill="none"><path d="M960 110h480M960 372v24" opacity=".0"/>${d.paths}${d.hatch}<path d="M980 120h250M1250 120h100M980 108v24M1230 108v24" opacity=".6"/><path d="M1220 340c0 38 22 58 52 58" opacity=".0"/><ellipse class="es-d" cx="1340" cy="470" rx="64" ry="62"/><ellipse class="es-d" cx="1344" cy="472" rx="46" ry="44"/><ellipse class="es-d" cx="1346" cy="473" rx="29" ry="27"/><ellipse class="es-d" cx="1347" cy="474" rx="13" ry="12"/><path d="M1340 400v-26m0 168v26M1262 470h-26m168 0h26" opacity=".6"/><path d="M980 380v40m0 0h92m0 0v-40" opacity="0"/></g></svg>`;
};
const home = (c) => [
  header(c),
  sec(`<section class="es-hero pk-bleed">${heroSvg()}
    <div class="es-hero-card"><p class="es-kick" data-reveal>Ébénisterie d'atelier · Jura</p><div class="es-h1 es-h1--xl" role="heading" aria-level="1" data-reveal>Du bois qu'on a laissé<br>le temps d'être beau.</div>
      <p class="es-lead" data-reveal>Tables, chaises, bibliothèques et lits en bois massif, dessinés et fabriqués à la main dans notre atelier. Assemblés sans clou, pour durer plus longtemps que nous.</p>
      <div class="es-actions" data-reveal><a class="es-btn" href="/configurateur">Configurer ma pièce ${arrow}</a><a class="es-btn es-btn--line" href="/realisations">Voir les réalisations</a></div></div>
    <p class="es-hero-leg" aria-hidden="true">Assemblage à queues d'aronde · coupe au 1:5</p></section>`),
  sec(`<section class="es-stats pk-bleed"><ul class="es-stats-in"><li data-reveal><b data-count="1987">1987</b><span>année d'ouverture de l'atelier</span></li><li data-reveal><b data-count="412">412</b><span>pièces livrées</span></li><li data-reveal><b data-count="5">5</b><span>essences de bois travaillées</span></li><li data-reveal><b data-count="24" data-suffix=" mois">24 mois</b><span>de séchage au minimum</span></li></ul></section>`),
  sec(`<section class="es-sec es-sec--lames pk-bleed"><div class="es-wrap"><div class="es-sechead"><div><p class="es-kick" data-reveal>Réalisations</p><h2 class="es-h2" data-reveal>Pièces sorties de l'atelier</h2></div><a class="es-more" href="/realisations" data-reveal>Toutes les réalisations ${arrow}</a></div>
    <div class="es-lames">${PIECES.slice(0, 5).map((p, i) => cardE(p, i)).join("")}</div></div></section>`),
  sec(`<section class="es-sec es-sec--joints pk-bleed"><div class="es-wrap"><div class="es-sechead"><div><p class="es-kick" data-reveal>Savoir-faire</p><h2 class="es-h2" data-reveal>Trois assemblages, aucune vis</h2></div><a class="es-more" href="/savoir-faire" data-reveal>Les étapes de fabrication ${arrow}</a></div>
    <div class="es-joints"><figure class="es-joint" data-reveal>${SDOVE()}<figcaption><b>Queues d'aronde</b><span>La forme en trapèze interdit tout arrachement. Pour les tiroirs et les angles de caisson.</span></figcaption></figure>
    <figure class="es-joint" data-reveal>${SMORT()}<figcaption><b>Tenon et mortaise</b><span>Un tenon taillé dans la traverse, une mortaise creusée dans le pied, une cheville de frêne. Pour les structures.</span></figcaption></figure>
    <figure class="es-joint" data-reveal>${SMIBO()}<figcaption><b>Mi-bois</b><span>Deux pièces entaillées de moitié, qui se croisent à fleur. Pour les châssis et les croisillons.</span></figcaption></figure></div></div></section>`),
  sec(`<section class="es-sec es-sec--cfg pk-bleed"><div class="es-wrap es-cfgteaser"><div><p class="es-kick es-kick--l" data-reveal>Configurateur</p><h2 class="es-h2 es-h2--l" data-reveal>Choisissez l'essence,<br>mesurez la pièce.</h2><p class="es-lead es-lead--l" data-reveal>Chêne, noyer, frêne, merisier ou hêtre : la pièce se redessine à votre mesure, avec un prix indicatif et un délai calculés devant vous.</p><a class="es-btn es-btn--brass" href="/configurateur" data-reveal>Ouvrir le configurateur ${arrow}</a></div>
    <div class="es-nuancier" aria-label="Nuancier des cinq essences" data-reveal>${ORDER.map((k, i) => { const E = ESS[k]; return `<a class="es-nu es-nu${i}" href="/configurateur#e-${k}"><svg viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="300" fill="${E.c}"/>${stria(0, 0, 100, 300, k, 40 + i, "v", 7 + (i % 3) * 2)}</svg><span><b>${E.n}</b><small>${E.teinte}</small></span></a>`; }).join("")}</div></div></section>`),
  sec(`<section class="es-sec es-sec--steps pk-bleed"><div class="es-wrap"><div class="es-sechead"><div><p class="es-kick" data-reveal>De la commande à la livraison</p><h2 class="es-h2" data-reveal>Une pièce, quatre temps</h2></div></div>
    <ol class="es-flow">${[["01", "Échange", "Nous parlons de l'usage, de la pièce et du budget, par téléphone ou à l'atelier."], ["02", "Dessin", "Plans cotés et choix de l'essence. Vous validez avant que la première planche soit sciée."], ["03", "Fabrication", "Débit, assemblage, finition : en moyenne de quatre à douze semaines selon la pièce."], ["04", "Livraison", "Nous livrons et montons la pièce chez vous dans un rayon de 200 km."]].map(([n, t, x]) => `<li data-reveal><b>${n}</b><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="es-sec es-sec--note pk-bleed"><div class="es-wrap es-note"><blockquote data-reveal><p>« Un meuble en bois massif travaille toute sa vie : il gonfle l'été, se resserre l'hiver. Le menuisier ne lutte pas contre cela, il le prévoit dans l'assemblage. »</p><footer>Le maître d'atelier, à propos des pièces de grande largeur</footer></blockquote>
    <div class="es-cta" data-reveal><h2 class="es-h2">Un projet de meuble ?</h2><p class="es-lead">Décrivez-nous la pièce, la pièce de la maison et vos dimensions. Nous répondons sous quatre jours ouvrés.</p><a class="es-btn" href="/contact">Écrire à l'atelier ${arrow}</a></div></div></section>`),
  footer(c),
];

/* ---------- Réalisations ---------- */
const realisations = (c) => [
  header(c), pagehead("Catalogue de l'atelier", "Réalisations", "Huit pièces sorties de l'atelier. Chaque fiche donne l'essence, les dimensions et le temps de fabrication.", 12),
  sec(`<section class="es-sec es-sec--gal pk-bleed"><div class="es-wrap"><div class="es-toolbar"><div class="es-tabs" role="tablist" aria-label="Filtrer par pièce"><a href="#toutes" class="is-on" data-f="all" role="tab" aria-selected="true">Toutes</a>${TYPES.map(([k, pl]) => `<a href="#${k}" data-f="${k}" role="tab" aria-selected="false">${pl}</a>`).join("")}</div><p class="es-count" aria-live="polite"><b data-n>${PIECES.length}</b> pièces affichées</p></div>
    <div class="es-lames es-lames--all">${PIECES.map((p, i) => cardE(p, i, PIECES.length)).join("")}</div><p class="es-empty" hidden>Aucune pièce dans cette catégorie pour l'instant.</p></div></section>`),
  sec(`<section class="es-sec es-sec--cfg pk-bleed"><div class="es-wrap es-cfgteaser"><div><h2 class="es-h2 es-h2--l" data-reveal>Une pièce qui n'existe pas encore ?</h2><p class="es-lead es-lead--l" data-reveal>Partez d'un modèle et modifiez l'essence, les dimensions et la finition dans le configurateur.</p><a class="es-btn es-btn--brass" href="/configurateur" data-reveal>Configurer ma pièce ${arrow}</a></div></div></section>`),
  footer(c),
];

/* ---------- Fiche réalisation ---------- */
function fiche(p, i) {
  const [id, type, nom, e, d, h, fin, ass, wr, hr, txt] = p, E = ESS[e];
  const joint = /aronde/i.test(ass) ? SDOVE() : /mi-bois/i.test(ass) ? SMIBO() : /enfourchement/i.test(ass) ? SENFO() : SMORT();
  const weeks = Math.ceil(h / 30) + E.s;
  return `<article class="es-fiche" data-fiche="${id}"><div class="es-fiche-fig es-bg-${e}" data-reveal>${elev(type, e, i * 11 + 3, wr, hr, "")}<p class="es-fiche-cap">${typeName(type)} en ${E.n.toLowerCase()} · dessin à plat</p></div>
    <div class="es-fiche-txt"><p class="es-kick">${typeName(type)} · ${E.n}</p><h2 class="es-h2">${esc(nom)}</h2><p class="es-lead">${esc(txt)}</p>
    <dl class="es-spec"><div><dt>Essence</dt><dd><i class="es-sw es-e-${e}"></i>${E.n} — ${E.teinte.toLowerCase()}</dd></div><div><dt>Dimensions</dt><dd>${dims(d, type)}</dd></div><div><dt>Temps de fabrication</dt><dd>${h} heures d'atelier, soit environ ${weeks} semaines avec le séchage</dd></div><div><dt>Finition</dt><dd>${fin}</dd></div><div><dt>Assemblage</dt><dd>${ass}</dd></div><div><dt>Séchage du bois</dt><dd>${E.sech}</dd></div></dl>
    <div class="es-fiche-joint">${joint}<span>${ass}</span></div>
    <div class="es-actions"><a class="es-btn" href="/configurateur#p-${id}">Configurer une pièce semblable ${arrow}</a><a class="es-btn es-btn--line" href="/contact">Demander cette pièce</a></div></div></article>`;
}
const realisation = (c) => [
  header(c),
  sec(`<section class="es-crumb pk-bleed"><div class="es-wrap"><div class="es-crumb-in" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/realisations">Réalisations</a><span aria-hidden="true">/</span><span>Fiche réalisation</span></div><div class="es-h1 es-h1--s" role="heading" aria-level="1">Fiche réalisation</div></div></section>`),
  ...PIECES.map((p, i) => sec(`<section class="es-sec es-sec--fiches pk-bleed"><div class="es-wrap es-fiches">${fiche(p, i)}</div></section>`)),
  sec(`<section class="es-sec es-sec--others pk-bleed"><div class="es-wrap"><div class="es-sechead"><h2 class="es-h2">Les autres pièces</h2><a class="es-more" href="/realisations">Retour au catalogue ${arrow}</a></div><div class="es-pick" role="tablist" aria-label="Choisir une fiche">${PIECES.map((p) => `<a href="#${p[0]}" data-pick="${p[0]}" role="tab"><i class="es-e-${p[3]}"></i><b>${esc(p[2])}</b><small>${ESS[p[3]].n} · ${p[5]} h</small></a>`).join("")}</div></div></section>`),
  footer(c),
];

/* ---------- Configurateur ---------- */
const finitions = [["mate", "Mate", "Cire dure, toucher brut"], ["huilee", "Huilée", "Huile dure, ton profond"], ["vernie", "Vernie", "Vernis satiné, protège"]];
const configurateur = (c) => [
  header(c), pagehead("Prix indicatif et délai", "Configurateur", "Choisissez la pièce, l'essence, les dimensions et la finition. Le dessin, le prix et le délai se mettent à jour devant vous.", 31),
  sec(`<section class="es-cfgsec pk-bleed"><div class="es-wrap es-cfg" data-cfg>
    <div class="es-cfg-stage"><div class="es-stage" data-stage>${elev("table", "chene", 3, 1, 0.55, "")}<p class="es-nojs">Le dessin interactif demande JavaScript. Les réalisations de la page <a href="/realisations">Réalisations</a> donnent des exemples complets.</p></div><p class="es-cfg-cap" data-cap aria-live="polite"></p></div>
    <div class="es-cfg-panel">
      <div class="es-grp"><p class="es-lab"><b>1</b> Pièce</p><div class="es-opts" role="radiogroup" aria-label="Type de pièce">${TYPES.map(([k, , s], i) => `<a href="#t-${k}" data-t="${k}" role="radio" aria-checked="${i === 0}">${s}</a>`).join("")}</div></div>
      <div class="es-grp"><p class="es-lab"><b>2</b> Essence</p><div class="es-ess" role="radiogroup" aria-label="Essence de bois">${ORDER.map((k, i) => { const E = ESS[k]; return `<a href="#e-${k}" data-e="${k}" data-c="${E.c}" data-v="${E.v}" data-l="${E.l}" data-d="${E.d}" data-p="${E.p}" data-g="${E.g}" data-s="${E.s}" data-n="${E.n}" role="radio" aria-checked="${i === 0}"><svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="${E.c}"/>${stria(0, 0, 60, 40, k, 70 + i, "h", 5)}</svg><b>${E.n}</b><small>${E.dur}</small></a>`; }).join("")}</div></div>
      <div class="es-grp"><p class="es-lab"><b>3</b> Dimensions</p><div data-sliders class="es-sliders"></div></div>
      <div class="es-grp"><p class="es-lab"><b>4</b> Finition</p><div class="es-opts es-opts--f" role="radiogroup" aria-label="Finition">${finitions.map(([k, n, t], i) => `<a href="#f-${k}" data-f="${k}" role="radio" aria-checked="${i === 0}"><b>${n}</b><small>${t}</small></a>`).join("")}</div></div>
      <div class="es-grp es-grp--models"><p class="es-lab">Partir d'un modèle</p><div class="es-models">${PIECES.map((p) => `<a href="#p-${p[0]}" data-model="${p[0]}" data-mt="${p[1]}" data-me="${p[3]}" data-mx="${p[4][0]}" data-md="${p[4][1]}" data-mh="${p[4][2]}" data-mf="${p[6] === "Mate" ? "mate" : p[6] === "Huilée" ? "huilee" : "vernie"}">${esc(p[2])}</a>`).join("")}</div></div>
    </div>
    <aside class="es-out" aria-label="Estimation" aria-live="polite"><div class="es-out-main"><p class="es-lab es-lab--l">Estimation indicative</p><p class="es-price"><b data-price>—</b><small data-range></small></p><p class="es-delay"><b data-delay>—</b><span> de délai</span></p></div>
      <dl class="es-calc" data-calc></dl>
      <div class="es-out-cta"><p class="es-recap" data-recap></p><a class="es-btn es-btn--brass" href="/contact" data-send>Envoyer ce récapitulatif ${arrow}</a><p class="es-fine">Estimation de démonstration, sans valeur de devis. Le prix définitif dépend du dessin validé et de l'état des stocks de bois.</p></div></aside></div></section>`),
  sec(`<section class="es-sec es-sec--how pk-bleed"><div class="es-wrap es-how"><div><p class="es-kick" data-reveal>La formule</p><h2 class="es-h2" data-reveal>Comment le prix est calculé</h2></div><div class="es-how-t" data-reveal><p><strong>Prix = (matière + main-d'œuvre) × finition</strong></p><ul><li><b>Matière</b> = volume du bois des pièces × 1,35 (chutes de débit) × prix du dm³ de l'essence.</li><li><b>Main-d'œuvre</b> = heures d'atelier × 62 € de l'heure. Les heures dépendent de la pièce (assemblages) et du volume à travailler.</li><li><b>Finition</b> : mate × 1,00 · huilée × 1,06 · vernie × 1,10.</li><li><b>Délai</b> = heures d'atelier ÷ 30 par semaine + séchage de l'essence + temps de finition.</li></ul></div></div></section>`),
  footer(c),
];

/* ---------- Savoir-faire ---------- */
const stepIcons = [
  `<ellipse cx="60" cy="45" rx="42" ry="26" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="60" cy="45" rx="28" ry="16" fill="none" stroke="currentColor" stroke-width="1.4"/><ellipse cx="60" cy="45" rx="14" ry="7" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M18 45H4m114 0h-14" stroke="currentColor" stroke-width="1.4"/>`,
  `<path d="M14 18h92v10H14zM14 34h92v10H14zM14 50h92v10H14zM14 66h92v10H14z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M26 28v6m68-6v6M26 44v6m68-6v6M26 60v6m68-6v6" stroke="currentColor" stroke-width="1.6"/>`,
  `<path d="M8 40h104v22H8z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M40 28v46m40-46v46" stroke="currentColor" stroke-width="1.5" class="es-dash"/><path d="M30 14l24 10m0-10L30 24" stroke="currentColor" stroke-width="1.4"/>`,
  `<path d="M10 56h96l6-10H22z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M34 46l6-18h30l8 18" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M96 40c8-8 16-2 12 6s-14 4-8-2" fill="none" stroke="currentColor" stroke-width="1.4"/>`,
  `<g transform="translate(6 6) scale(.28)" fill="none" stroke="currentColor">${(() => { const d = dovetail(20, 20, 150, 56, 3, 52, 90); return d.paths.replace(/class="es-d" /g, 'stroke-width="5" '); })()}</g>`,
  `<path d="M14 60h92v12H14z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M22 52c14-10 24 10 38 0s24 10 38 0" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M22 40c14-10 24 10 38 0s24 10 38 0" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/>`,
  `<path d="M14 62h92v10H14z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M60 14c10 14 16 22 16 30a16 16 0 0 1-32 0c0-8 6-16 16-30z" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
];
const STEPS = [
  ["Choix du bois", "Nous choisissons les grumes sur pied dans les forêts du Haut-Jura, à moins de 80 km. On lit la planche : fil droit, nœuds sains, couleur régulière.", "1 à 2 jours", "Équerre, mètre, œil"],
  ["Séchage", "Les planches vieillissent à l'air libre, sur lattes, pendant deux ans au moins, puis passent en séchoir. Un bois mal séché se fend : il n'y a pas de raccourci.", "24 à 36 mois", "Lattes, bâche, patience"],
  ["Débit", "On redécoupe les planches aux dimensions de la pièce en gardant le sens du fil. Les belles faces sont réservées aux plateaux et aux façades.", "1 à 3 jours", "Scie à ruban, scie circulaire"],
  ["Corroyage", "Le rabot rend chaque face plane et d'équerre. C'est ici que le bois révèle ses veines : le copeau qui se déroule en est la preuve.", "1 à 4 jours", "Dégauchisseuse, raboteuse, rabot à main"],
  ["Assemblage", "Mortaises, tenons, queues d'aronde : tout est taillé au ciseau et au trait, puis essayé à blanc. Les chevilles ne sont posées qu'à la fin.", "3 à 15 jours", "Ciseaux, bédane, scie à tenon"],
  ["Ponçage", "Trois grains successifs, du plus rude au plus fin, toujours dans le sens du fil. On passe la main : si elle accroche, on recommence.", "1 à 3 jours", "Cales à poncer, grains 120 à 240"],
  ["Finition", "Huile dure, cire ou vernis, en couches fines avec un séchage entre chaque. La finition protège sans cacher la matière.", "3 à 5 jours", "Chiffon, pinceau, ponçage entre couches"],
];
const savoir = (c) => [
  header(c), pagehead("Du tronc à la pièce", "Savoir-faire", "Sept étapes, du choix de l'arbre à la dernière couche d'huile. Aucune ne se hâte.", 47),
  sec(`<section class="es-sec es-sec--steps2 pk-bleed"><div class="es-wrap es-steps2"><aside class="es-rail" aria-label="Sommaire des étapes"><div class="es-rail-line"><i data-prog></i></div><ol>${STEPS.map(([t], i) => `<li><a href="#etape-${i + 1}" data-go="${i + 1}"><b>${String(i + 1).padStart(2, "0")}</b>${t}</a></li>`).join("")}</ol></aside>
    <div class="es-stepcol">${STEPS.map(([t, x, du, ou], i) => `<article class="es-step es-step--${i % 3}" data-step="${i + 1}" data-reveal><svg class="es-stepic" viewBox="0 0 120 90" aria-hidden="true">${stepIcons[i]}</svg><div><p class="es-step-n">Étape ${i + 1} sur 7</p><h2 class="es-h3">${t}</h2><p>${x}</p><dl class="es-mini"><div><dt>Durée</dt><dd>${du}</dd></div><div><dt>Outils</dt><dd>${ou}</dd></div></dl></div></article>`).join("")}</div></div></section>`),
  sec(`<section class="es-sec es-sec--joints pk-bleed"><div class="es-wrap"><div class="es-sechead"><div><p class="es-kick" data-reveal>Les coupes</p><h2 class="es-h2" data-reveal>Quatre assemblages au trait</h2></div></div>
    <div class="es-joints es-joints--4"><figure class="es-joint" data-reveal>${SDOVE()}<figcaption><b>Queues d'aronde</b><span>Les queues en trapèze verrouillent l'angle. Chaque pièce est tracée à la main sur la suivante.</span></figcaption></figure><figure class="es-joint" data-reveal>${SMORT()}<figcaption><b>Tenon et mortaise</b><span>Le tenon fait un tiers de l'épaisseur de la traverse. La cheville serre l'ensemble.</span></figcaption></figure><figure class="es-joint" data-reveal>${SMIBO()}<figcaption><b>Mi-bois</b><span>On enlève la moitié de l'épaisseur à chaque pièce : elles se croisent sans épaisseur en plus.</span></figcaption></figure><figure class="es-joint" data-reveal>${SENFO()}<figcaption><b>Enfourchement</b><span>Une fourche ouverte reçoit une languette. Rapide à ajuster, idéale pour les pieds de chaise.</span></figcaption></figure></div></div></section>`),
  sec(`<section class="es-sec es-sec--ess pk-bleed"><div class="es-wrap"><div class="es-sechead"><div><p class="es-kick" data-reveal>Les essences</p><h2 class="es-h2" data-reveal>Cinq bois, cinq caractères</h2></div></div>
    <div class="es-tablewrap" data-reveal><table class="es-tbl"><caption class="es-sr">Comparatif des cinq essences travaillées par l'atelier</caption><thead><tr><th scope="col">Essence</th><th scope="col">Teinte</th><th scope="col">Dureté</th><th scope="col">Fil</th><th scope="col">Prix du dm³</th><th scope="col">Usages</th></tr></thead><tbody>${ORDER.map((k) => { const E = ESS[k]; return `<tr><th scope="row"><i class="es-sw es-e-${k}"></i>${E.n}</th><td data-l="Teinte">${E.teinte}</td><td data-l="Dureté">${E.dur}</td><td data-l="Fil">${E.grain}</td><td data-l="Prix du dm³">${String(E.p).replace(".", ",")} €</td><td data-l="Usages">${E.usage}</td></tr>`; }).join("")}</tbody></table></div></div></section>`),
  sec(`<section class="es-sec es-sec--faq pk-bleed"><div class="es-wrap es-faq"><h2 class="es-h2" data-reveal>Questions d'atelier</h2><div>
    <details data-reveal><summary>Le bois massif bouge-t-il ?</summary><p>Oui, un peu : il gonfle l'été et se resserre l'hiver. Les assemblages sont prévus pour laisser jouer les planches sans qu'elles se fendent.</p></details>
    <details data-reveal><summary>Peut-on réparer une pièce ?</summary><p>Presque toujours. Une chevillée se démonte, un plateau se rabote et se refinit. C'est l'intérêt de ne pas avoir collé ni vissé.</p></details>
    <details data-reveal><summary>D'où vient le bois ?</summary><p>Principalement de forêts jurassiennes gérées durablement, à moins de 80 km. Le noyer et le merisier peuvent venir de plus loin selon les stocks.</p></details>
    <details data-reveal><summary>Quelles sont les finitions ?</summary><p>Mate à la cire dure, huilée ou vernie satinée. Nous déconseillons le vernis brillant sur les grandes tables.</p></details></div></div></section>`),
  footer(c),
];

/* ---------- Contact, recherche, introuvable ---------- */
const contact = (c) => [header(c), pagehead("Parlons de votre pièce", "Contact", "Une table, une chaise, un meuble sur mesure ? Décrivez votre projet.", 58),
  sec(`<section class="es-info pk-bleed"><div class="es-wrap es-info-in"><div data-reveal><h2 class="es-h3">À l'atelier</h2><address>Atelier Essence<br>12 chemin des Scieries<br>39200 Saint-Claude</address></div><div data-reveal><h2 class="es-h3">Horaires</h2><p>Du mardi au vendredi, 8 h – 12 h et 14 h – 18 h. Visite uniquement sur rendez-vous.</p></div><div data-reveal><h2 class="es-h3">Réponse</h2><p>Sous quatre jours ouvrés. Indiquez l'essence, les dimensions et l'usage de la pièce : nous gagnerons du temps.</p></div></div></section>`),
  { type: "form", heading: "Écrire à l'atelier", intro: "Décrivez la pièce que vous imaginez. Si vous venez du configurateur, votre récapitulatif est repris ici." }, footer(c)];
const recherche = (c) => [header(c), pagehead("Rechercher", "Une pièce, un bois ?", "Un modèle, une essence, un assemblage.", 63), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce, une essence…" } }] }, footer(c)];
const introuvable = (c) => [header(c), sec(`<section class="es-404 pk-bleed"><svg class="es-404-pl" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect class="es-pl" width="1600" height="300"/><g class="es-vg" fill="none">${veins(1600, 300, 18, 9, [[820, 150, 44]])}</g></svg><div class="es-404-in"><p class="es-kick">Planche introuvable</p><div class="es-h1" role="heading" aria-level="1">Cette page n'est plus dans l'atelier.</div><p class="es-sub">Elle a changé de place ou n'a jamais existé. Voici le chemin de retour.</p><div class="es-actions"><a class="es-btn" href="/">Retour à l'accueil</a><a class="es-btn es-btn--line" href="/realisations">Voir les réalisations</a></div></div></section>`), footer(c)];

module.exports = {
  key: "essence", name: "Essence", version: "2.0.0", category: "architecture", tags: ["naturel", "minimaliste", "classique"], siteType: "Ébéniste et mobilier artisanal", featured: false,
  concept: "Le calme d'un atelier de menuiserie : une grande planche dont les veines se révèlent lentement, des assemblages dessinés au trait, un configurateur d'essences et de dimensions.",
  description: "Ébéniste et mobilier artisanal : gris de copeaux et graphite, aplats de chêne, noyer, frêne, merisier et hêtre, veines et cernes dessinés, réalisations filtrables et configurateur d'essence, dimensions, finition, prix indicatif et délai.",
  brand: "Atelier Essence", modules: ["formulaires", "recherche"],
  dna: {
    header: "barre-lente-a-soulignement-de-trait-de-rabot",
    hero: "grande-planche-aux-veines-qui-se-revelent-et-coupe-d-assemblage-tracee",
    grid: "planches-larges-en-lames-de-parquet-de-largeurs-inegales",
    motion: "veines-qui-se-revelent-traits-qui-se-tracent-et-transitions-longues",
    shapes: "veines-noeuds-cernes-et-assemblages-dessines-au-trait",
    rhythm: "lent-par-planches-superposees-gris-copeaux-et-graphite",
    signature: "realisations-filtrables-et-configurateur-d-essences-et-dimensions",
  },
  tokens: {
    colors: { primary: "#2b3a2f", secondary: "#252927", accent: "#80601a", background: "#eceeed", surface: "#f7f8f7", text: "#1d2321", muted: "#566059", success: "#2f6b3f", warning: "#80601a", error: "#a3302a" },
    fonts: { heading: "font.ibarra-real-nova", body: "font.spline-sans", button: "font.chivo-mono", link: "font.spline-sans" },
    radius: { sm: 0, md: 2, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#b9bfbb" },
    type: { h1: { size: 64, weight: 500, lineHeight: 1.06, transform: "none" }, h2: { size: 40, weight: 500, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Laiton des détails", type: "color", default: "#80601a" },
    { key: "graphite", label: "Graphite des bandeaux", type: "color", default: "#252927" },
    { key: "essence", label: "Essence de la planche d'accueil", type: "choice", default: "chene", choices: [["chene", "Chêne"], ["noyer", "Noyer"], ["frene", "Frêne"], ["merisier", "Merisier"], ["hetre", "Hêtre"]] },
    { key: "veines", label: "Veines de la planche", type: "choice", default: "reveal", choices: [["reveal", "Se révèlent lentement"], ["fixes", "Visibles d'emblée"]] },
    { key: "trait", label: "Trait de rabot sous les liens", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Réalisations", "/realisations"], ["Configurateur", "/configurateur"], ["Savoir-faire", "/savoir-faire"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "realisations", name: "Réalisations", render: realisations }, { key: "realisation", name: "Fiche réalisation", render: realisation },
    { key: "configurateur", name: "Configurateur", render: configurateur }, { key: "savoir-faire", name: "Savoir-faire", render: savoir }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
