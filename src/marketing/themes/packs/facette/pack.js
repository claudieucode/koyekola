// Facette — joaillerie artisanale. Direction artistique : un écrin vert bouteille, des reflets de gemme et des filets très fins.
// Barre fine centrée, hero à gemme taillée dont les facettes scintillent (et réagissent au pointeur), vitrines à deux colonnes,
// atelier de création : pièce zoomable à la loupe (pointeur ou clavier) dont le métal, la pierre et la taille recolorent réellement le dessin ; le récapitulatif part vers /contact.
const { sec, esc } = require("../kit");

// ---------- Dessin des gemmes (facettes calculées) ----------
const f1 = (n) => Math.round(n * 10) / 10;
const pt = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
const pts = (arr) => arr.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(" ");
// Éclairage : lumière venue du haut à gauche → ton g0 (clair) à g3 (sombre)
const tone = (a, bias = 0) => {
  const v = Math.cos(((a + 135) * Math.PI) / 180) + bias; // -1..1
  return v > 0.55 ? 0 : v > 0 ? 1 : v > -0.55 ? 2 : 3;
};
const facet = (p, a, t, live) => (live ? `<polygon class="fc-f fc-g${t}" data-a="${Math.round(((a % 360) + 360) % 360)}" points="${pts(p)}"/>` : `<polygon class="fc-g${t}" points="${pts(p)}"/>`);
// Taille brillant vue de dessus : table octogonale, étoiles, cerfs-volants et facettes de ceinture
function gem(cx, cy, R, cls = "fc-gem") {
  if (cls.includes("fc-gem-s")) return gemS(cx, cy, R, cls);
  const live = cls.includes("fc-live");
  const T = [], M = [], O = [];
  for (let i = 0; i < 8; i++) { T.push(pt(cx, cy, R * 0.5, 22.5 + 45 * i)); M.push(pt(cx, cy, R * 0.78, 45 * i)); O.push(pt(cx, cy, R, 22.5 + 45 * i)); }
  let out = "";
  for (let i = 0; i < 8; i++) {
    const p = (i + 7) % 8, n = (i + 1) % 8;
    out += facet([O[p], O[i], M[i]], 45 * i, tone(45 * i, -0.15), live);
    out += facet([T[i], M[i], O[i], M[n]], 22.5 + 45 * i, tone(22.5 + 45 * i), live);
    out += facet([T[p], T[i], M[i]], 45 * i, tone(45 * i, 0.2), live);
  }
  out += facet(T, 270, 0, live);
  return `<g class="${cls}">${out}<polygon class="fc-gl" points="${pts(T)}"/></g>`;
}
// Petite pierre : quatre facettes seulement (pavage, halo)
function gemS(cx, cy, R, cls) {
  const O = Array.from({ length: 8 }, (_, i) => pt(cx, cy, R, 22.5 + 45 * i)), T = Array.from({ length: 8 }, (_, i) => pt(cx, cy, R * 0.5, 22.5 + 45 * i));
  return `<g class="${cls}"><polygon class="fc-g1" points="${pts(O)}"/><polygon class="fc-g3" points="${pts([O[4], O[5], O[6], O[7], T[7], T[4]])}"/><polygon class="fc-g2" points="${pts([O[0], O[1], O[2], O[3], T[3], T[0]])}"/><polygon class="fc-g0" points="${pts(T)}"/></g>`;
}
// Taille poire (goutte)
function pear(cx, cy, w, h, cls = "fc-gem") {
  const P = [[0, -1], [0.55, -0.76], [0.86, -0.3], [0.82, 0.16], [0.46, 0.6], [0, 1], [-0.46, 0.6], [-0.82, 0.16], [-0.86, -0.3], [-0.55, -0.76]];
  const O = P.map(([x, y]) => [cx + (x * w) / 2, cy + (y * h) / 2]);
  const T = P.map(([x, y]) => [cx + (x * w) / 2 * 0.42, cy - h * 0.06 + (y * h) / 2 * 0.46]);
  let out = "";
  for (let i = 0; i < 10; i++) {
    const n = (i + 1) % 10, a = (Math.atan2((O[i][1] + O[n][1]) / 2 - cy, (O[i][0] + O[n][0]) / 2 - cx) * 180) / Math.PI;
    out += facet([T[i], T[n], O[n], O[i]], a, tone(a, i % 2 ? 0.12 : -0.12), false);
  }
  out += facet(T, 270, 0, false);
  return `<g class="${cls}">${out}</g>`;
}
const ring = (cx, cy, ro, ri, c = "fc-mb") => `<path class="${c}" fill-rule="evenodd" d="M${cx - ro} ${cy}a${ro} ${ro} 0 1 0 ${ro * 2} 0a${ro} ${ro} 0 1 0 ${-ro * 2} 0ZM${cx - ri} ${cy}a${ri} ${ri} 0 1 1 ${ri * 2} 0a${ri} ${ri} 0 1 1 ${-ri * 2} 0Z"/>`;
const arc = (cx, cy, r, a0, a1, c, w = 3) => { const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1); return `<path class="${c}" fill="none" stroke-width="${w}" stroke-linecap="round" d="M${f1(x0)} ${f1(y0)}A${r} ${r} 0 0 1 ${f1(x1)} ${f1(y1)}"/>`; };
const chain = (x0, x1, y0, ymax) => `<path class="fc-chain" fill="none" stroke-width="2.4" d="M${x0} ${y0}Q${(x0 + x1) / 2} ${ymax} ${x1} ${y0}"/>`;

const PIECE_SVG = {
  aurore: () => `${ring(120, 156, 62, 49)}${arc(120, 156, 55.5, 200, 262, "fc-ma-s", 3)}${arc(120, 156, 55.5, 20, 100, "fc-mc-s", 3)}
    <path class="fc-mc" d="M92 98L104 120H136L148 98Z"/><path class="fc-mb" d="M98 98L108 112H132L142 98Z"/>
    ${[[-28, 72], [28, 72], [-30, 100], [30, 100]].map(([x, y]) => `<path class="fc-ma-s" d="M${120 + x} ${y}l${x < 0 ? 5 : -5} 22" stroke-width="5" stroke-linecap="round" fill="none"/>`).join("")}
    ${gem(120, 74, 32)}`,
  lumiere: () => `${ring(120, 128, 78, 56)}${arc(120, 128, 67, 195, 285, "fc-ma-s", 4)}${arc(120, 128, 67, 20, 130, "fc-mc-s", 4)}
    ${[-60, -30, 0, 30, 60].map((d) => { const [x, y] = pt(120, 128, 67, -90 + d); return `<circle class="fc-mc" cx="${f1(x)}" cy="${f1(y)}" r="10.5"/>${gem(f1(x), f1(y), 8, "fc-gem fc-gem-s")}`; }).join("")}`,
  rosee: () => `${chain(24, 216, 12, 150)}<circle class="fc-mb" cx="120" cy="86" r="7"/><circle cx="120" cy="86" r="3" fill="#06130f"/>
    <circle class="fc-mb" cx="120" cy="156" r="58"/>${arc(120, 156, 53, 190, 290, "fc-ma-s", 3)}
    ${Array.from({ length: 10 }, (_, i) => { const [x, y] = pt(120, 156, 44, i * 36); return `<circle class="fc-mc" cx="${f1(x)}" cy="${f1(y)}" r="9"/>${gem(f1(x), f1(y), 6.8, "fc-gem fc-gem-s")}`; }).join("")}
    <circle class="fc-mc" cx="120" cy="156" r="29"/>${gem(120, 156, 25)}`,
  goutte: () => `${chain(24, 216, 12, 150)}<circle class="fc-mb" cx="120" cy="92" r="7"/><circle cx="120" cy="92" r="3" fill="#06130f"/>
    <path class="fc-mb" d="M120 98C150 98 178 128 176 166C174 196 148 224 120 232C92 224 66 196 64 166C62 128 90 98 120 98Z"/>
    <path class="fc-ma-s" fill="none" stroke-width="3" stroke-linecap="round" d="M82 126C94 108 106 102 118 102"/>${pear(120, 170, 78, 112)}`,
  etincelle: () => [72, 168].map((x) => `<path class="fc-mc" d="M${x - 5} 20h10v52h-10Z"/><circle class="fc-mc" cx="${x}" cy="118" r="50"/><circle class="fc-mb" cx="${x}" cy="116" r="46"/>${arc(x, 116, 42, 190, 280, "fc-ma-s", 3)}${[45, 135, 225, 315].map((a) => { const [px, py] = pt(x, 116, 33, a); return `<circle class="fc-ma" cx="${f1(px)}" cy="${f1(py)}" r="5"/>`; }).join("")}${gem(x, 116, 30)}`).join(""),
  cascade: () => [64, 176].map((x) => `<path class="fc-chain" fill="none" stroke-width="2.4" d="M${x} 14C${x + 16} 14 ${x + 18} 38 ${x} 40"/><circle class="fc-mb" cx="${x}" cy="52" r="15"/>${gem(x, 52, 11)}
    <path class="fc-chain" fill="none" stroke-width="2.4" d="M${x} 66V94"/><path class="fc-mb" d="M${x} 90C${x + 22} 92 ${x + 36} 122 ${x + 34} 150C${x + 32} 182 ${x + 14} 206 ${x} 214C${x - 14} 206 ${x - 32} 182 ${x - 34} 150C${x - 36} 122 ${x - 22} 92 ${x} 90Z"/>${pear(x, 150, 50, 92)}`).join(""),
  orbe: () => `<ellipse class="fc-mc" cx="120" cy="124" rx="104" ry="76"/><ellipse cx="120" cy="116" rx="86" ry="56" fill="#06130f" opacity=".92"/>
    <path class="fc-mb" fill-rule="evenodd" d="M16 124A104 76 0 0 0 224 124L214 116A86 56 0 0 1 26 116Z"/>
    <path class="fc-mb" d="M16 124A104 76 0 0 1 224 124L206 118A86 58 0 0 0 34 118Z"/>
    <path class="fc-ma-s" fill="none" stroke-width="4" stroke-linecap="round" d="M30 106A104 76 0 0 1 104 50"/>
    ${[[66, 190], [120, 202], [174, 190]].map(([x, y], i) => `<circle class="fc-mc" cx="${x}" cy="${y}" r="${i === 1 ? 19 : 14.5}"/>${gem(x, y, i === 1 ? 15 : 11, "fc-gem" + (i === 1 ? "" : " fc-gem-s"))}`).join("")}`,
  fil: () => {
    let o = "";
    for (let i = 0; i <= 15; i++) { const t = i / 15, x = 14 + 212 * t, y = 62 + 104 * Math.sin(Math.PI * t), dy = 104 * Math.PI * Math.cos(Math.PI * t) / 212, a = (Math.atan(dy) * 180) / Math.PI; o += `<ellipse class="fc-link" fill="none" stroke-width="3" cx="${f1(x)}" cy="${f1(y)}" rx="${i % 2 ? 6 : 11}" ry="${i % 2 ? 4.4 : 5.2}" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})"/>`; }
    return `${o}<path class="fc-chain" stroke-width="3" d="M120 166v6"/><circle class="fc-mb" cx="120" cy="198" r="30"/>${arc(120, 198, 26, 195, 285, "fc-ma-s", 3)}<circle class="fc-mc" cx="120" cy="198" r="23"/>${gem(120, 198, 20)}`;
  },
};
const piece = (id, cls = "") => `<svg class="fc-piece ${cls}" viewBox="0 0 240 240" role="img" aria-label="${esc(PIECES.find((p) => p.id === id).name)}, dessin de la pièce">${PIECE_SVG[id]()}</svg>`;

const PIECES = [
  { id: "aurore", kind: "bague", name: "Bague Aurore", sub: "Solitaire à quatre griffes", metal: "jaune", stone: "diamant" },
  { id: "lumiere", kind: "bague", name: "Alliance Lumière", sub: "Cinq pierres en ligne", metal: "platine", stone: "saphir" },
  { id: "rosee", kind: "pendentif", name: "Pendentif Rosée", sub: "Pierre centrale et halo", metal: "rose", stone: "rubis" },
  { id: "goutte", kind: "pendentif", name: "Pendentif Goutte", sub: "Taille poire sur chaîne fine", metal: "argent", stone: "amethyste" },
  { id: "etincelle", kind: "boucles", name: "Puces Étincelle", sub: "Paire de puces serties", metal: "jaune", stone: "emeraude" },
  { id: "cascade", kind: "boucles", name: "Boucles Cascade", sub: "Pendantes, taille poire", metal: "platine", stone: "diamant" },
  { id: "orbe", kind: "bracelet", name: "Jonc Orbe", sub: "Jonc rigide, trois pierres", metal: "rose", stone: "emeraude" },
  { id: "fil", kind: "bracelet", name: "Bracelet Fil", sub: "Chaîne souple et breloque", metal: "argent", stone: "saphir" },
];
const KIND = { bague: "Bagues", pendentif: "Pendentifs", boucles: "Boucles d'oreilles", bracelet: "Bracelets" };
const METALN = { jaune: "Or jaune", rose: "Or rose", argent: "Argent", platine: "Platine" };
const STONEN = { diamant: "Diamant", emeraude: "Émeraude", saphir: "Saphir", rubis: "Rubis", amethyste: "Améthyste" };
const low = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// ---------- Éléments récurrents ----------
const arrow = `<svg class="fc-arr" viewBox="0 0 24 10" aria-hidden="true"><path d="M0 5h22M17 1l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
const mark = `<svg class="fc-mark" viewBox="0 0 32 28" aria-hidden="true"><path d="M8 2h16l7 8-15 16L1 10Z" fill="none" stroke="currentColor" stroke-width="1"/><path d="M1 10h30M8 2l8 24 8-24M12 10l4-8 4 8" fill="none" stroke="currentColor" stroke-width=".8"/></svg>`;
const sparkle = (cls = "") => `<svg class="fc-spark ${cls}" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0-10Q1 -1 10 0Q1 1 0 10Q-1 1 -10 0Q-1 -1 0-10Z" fill="currentColor"/></svg>`;

const header = (c) => `<header class="fc-head pk-bleed"><div class="fc-head-top"><p class="fc-head-l">Atelier de joaillerie · démonstration</p>
  <a class="fc-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span class="fc-logo-t">Facette</span></a>
  <a class="fc-head-r" href="/contact">Prendre rendez-vous</a>
  <details class="fc-burger"><summary aria-label="Ouvrir le menu"><span class="fc-bur-l"><i></i><i></i></span><span class="fc-bur-t">Menu</span></summary>
    <div class="fc-drawer" role="navigation" aria-label="Menu mobile">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a class="fc-drawer-cta" href="/contact">Prendre rendez-vous</a></div></details></div>
  <div class="fc-nav" role="navigation" aria-label="Navigation principale"><span class="fc-nav-line" aria-hidden="true"></span>${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<span class="fc-nav-line" aria-hidden="true"></span></div></header>`;

const footer = (c) => `<footer class="fc-foot pk-bleed"><div class="fc-wrap fc-foot-in"><div class="fc-foot-brand">${mark}<div class="fc-foot-logo">Facette</div><p>Atelier de joaillerie : des pièces dessinées, taillées et serties à la main, une à une.</p><address>Atelier : 12 passage des Orfèvres, 75003 (adresse fictive)</address></div>
  <div><h2 class="fc-foot-h">La maison</h2><div class="fc-foot-col">${c.menu.slice(1, 5).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div>
  <div><h2 class="fc-foot-h">Contact</h2><div class="fc-foot-col"><a href="/contact">Écrire à l'atelier</a><a href="/recherche">Rechercher</a><a href="/atelier">Composer une pièce</a></div></div></div>
  <p class="fc-legal">© Facette — site de démonstration. Pièces, matières et délais fictifs ; aucune vente ni paiement n'est possible ici.</p></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="fc-ph pk-bleed"><div class="fc-wrap fc-ph-in"><div class="fc-ph-txt"><p class="fc-kicker" data-reveal>${esc(kicker)}</p><div class="fc-title" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="fc-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>
  <svg class="fc-ph-gem" viewBox="0 0 120 120" aria-hidden="true"><g class="fc-ghost">${gem(60, 60, 54, "fc-gem fc-live")}</g></svg></div></section>`);

const vitrine = (p, i, extra = "") => `<article class="fc-vit" data-reveal data-kind="${p.kind}" data-metal="${p.metal}" data-stone="${p.stone}"${extra}>
  <a class="fc-vit-frame" href="/atelier#${p.id}" aria-label="Voir la pièce : ${esc(p.name)}"><span class="fc-vit-glass">${piece(p.id)}<span class="fc-vit-glint" aria-hidden="true"></span></span></a>
  <div class="fc-vit-cap"><span class="fc-vit-n">N° ${String(i + 1).padStart(2, "0")}</span><h3 class="fc-vit-h"><a href="/atelier#${p.id}">${esc(p.name)}</a></h3><p class="fc-vit-s">${esc(p.sub)}</p><p class="fc-vit-m">${METALN[p.metal]} · ${low(STONEN[p.stone])}</p></div></article>`;

const hr = `<div class="fc-rule" aria-hidden="true"><i></i>${sparkle()}<i></i></div>`;
const cta = (title, text, label, url) => sec(`<section class="fc-cta pk-bleed"><div class="fc-wrap fc-cta-in" data-reveal>${hr}<h2 class="fc-h2">${title}</h2><p class="fc-lead">${esc(text)}</p><div class="fc-actions"><a class="fc-btn" href="${url}">${esc(label)} ${arrow}</a><a class="fc-btn fc-btn--ghost" href="/contact">Écrire à l'atelier</a></div></div></section>`);

// ---------- Accueil ----------
const hero = () => `<section class="fc-hero pk-bleed" data-stage><div class="fc-hero-bg" aria-hidden="true"><i class="fc-halo"></i></div>
  <div class="fc-wrap fc-hero-in"><p class="fc-kicker fc-kicker--c" data-reveal>Joaillerie artisanale · Paris, atelier fictif</p>
  <div class="fc-mega" role="heading" aria-level="1" data-reveal>Chaque facette<br><em>capte une lumière</em></div>
  <div class="fc-hero-row"><aside class="fc-hl" data-reveal><p class="fc-label">Taille</p><p>Cinquante-huit facettes tracées au dixième de millimètre pour renvoyer toute la lumière vers l'œil.</p></aside>
    <div class="fc-hero-gemwrap"><svg class="fc-orbit" viewBox="-220 -220 440 440" aria-hidden="true"><g class="fc-orbit-a"><circle r="210" fill="none" stroke="currentColor" stroke-width=".6"/><circle r="186" fill="none" stroke="currentColor" stroke-width=".4"/>${Array.from({ length: 48 }, (_, i) => { const a = i * 7.5, [x0, y0] = pt(0, 0, i % 4 ? 206 : 199, a), [x1, y1] = pt(0, 0, 212, a); return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="currentColor" stroke-width=".6"/>`; }).join("")}</g><circle r="160" fill="none" stroke="currentColor" stroke-width=".5" opacity=".6"/></svg>
      ${sparkle("fc-sp1")}${sparkle("fc-sp2")}${sparkle("fc-sp3")}
      <div class="fc-hero-gem" data-stone="aigue"><svg viewBox="-110 -110 220 220" role="img" aria-label="Une gemme taillée en brillant, dessinée : ses facettes scintillent">${gem(0, 0, 100, "fc-gem fc-live")}<g class="fc-star" aria-hidden="true"><path d="M0-34L3-3 34 0 3 3 0 34-3 3-34 0-3-3Z"/></g></svg></div></div>
    <aside class="fc-hr" data-reveal><p class="fc-label">Métal</p><p>Or jaune, or rose, argent ou platine, poli miroir ou satiné, selon la peau et le geste.</p></aside></div>
  <div class="fc-actions fc-actions--c" data-reveal><a class="fc-btn" href="/collection">Entrer dans la collection ${arrow}</a><a class="fc-btn fc-btn--ghost" href="/atelier">Composer ma pièce</a></div></div></section>`;

const home = (c) => [
  sec(header(c)), sec(hero()),
  sec(`<section class="fc-sec fc-intro pk-bleed"><div class="fc-wrap fc-intro-in"><div data-reveal><p class="fc-kicker">La maison</p><h2 class="fc-h2">Des bijoux qui se regardent de près</h2></div>
    <div data-reveal><p class="fc-lead">Chez Facette, une pièce commence par une pierre et un crayon. Nous dessinons, taillons et sertissons dans un seul atelier, pour que chaque griffe, chaque chaton et chaque bord poli résistent à la loupe.</p>
    <dl class="fc-nums"><div><dt>Heures d'atelier</dt><dd><b data-count="38">38</b><small>par bague, en moyenne</small></dd></div><div><dt>Facettes</dt><dd><b data-count="58">58</b><small>pour une taille brillant</small></dd></div><div><dt>Métaux</dt><dd><b data-count="4">4</b><small>au choix pour chaque pièce</small></dd></div></dl></div></div></section>`),
  sec(`<section class="fc-sec fc-sec--head pk-bleed"><div class="fc-wrap"><div class="fc-sec-head" data-reveal><div><p class="fc-kicker">Dans la vitrine</p><h2 class="fc-h2">Quatre pièces de la saison</h2></div><a class="fc-more" href="/collection">Toute la collection ${arrow}</a></div>
    <div class="fc-vitgrid">${[0, 2].map((k) => vitrine(PIECES[k], k)).join("")}</div></div></section>`),
  sec(`<section class="fc-sec fc-sec--flush fc-sec--end pk-bleed"><div class="fc-wrap"><div class="fc-vitgrid">${[4, 6].map((k) => vitrine(PIECES[k], k)).join("")}</div></div></section>`),
  sec(`<section class="fc-sec fc-try pk-bleed"><div class="fc-wrap fc-try-in"><div class="fc-try-stage" data-fc-demo data-metal="jaune" data-stone="emeraude"><div class="fc-try-glass">${piece("aurore")}</div></div>
    <div data-reveal><p class="fc-kicker">Atelier de création</p><h2 class="fc-h2">Le même bijou, quatre métaux</h2><p class="fc-lead">Changez de métal et regardez la lumière se déplacer. Dans l'atelier, vous composez ensuite la pièce complète : métal, pierre, taille, et même une loupe pour inspecter les griffes.</p>
      <div class="fc-sw fc-sw--demo" role="group" aria-label="Métal de démonstration">${Object.entries(METALN).map(([k, v], i) => `<a class="fc-swatch fc-sw-${k}" href="#${k}" data-demo-metal="${k}" aria-pressed="${i === 0}"><i></i><span>${v}</span></a>`).join("")}</div>
      <a class="fc-btn" href="/atelier">Composer ma pièce ${arrow}</a></div></div></section>`),
  sec(`<section class="fc-sec fc-steps pk-bleed"><div class="fc-wrap"><div class="fc-sec-head" data-reveal><div><p class="fc-kicker">Savoir-faire</p><h2 class="fc-h2">De la pierre brute au poli final</h2></div><a class="fc-more" href="/savoir-faire">Voir l'atelier ${arrow}</a></div>
    <ol class="fc-steps-list">${[["Choisir", "La pierre est examinée sous loupe : couleur, pureté, inclusions."], ["Tailler", "Table, couronne, pavillon : chaque angle règle l'éclat."], ["Sertir", "Les griffes se referment à la main sur la ceinture."], ["Polir", "Dernier passage au feutre, jusqu'au reflet miroir."]].map(([t, d], i) => `<li data-reveal><span class="fc-step-n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`),
  cta("Une pièce à imaginer ?", "Parlez-nous de l'occasion, de la pierre que vous gardez ou du geste que vous aimez : nous dessinons avec vous.", "Découvrir le sur-mesure", "/sur-mesure"),
  sec(footer(c)),
];

// ---------- Collection ----------
const collection = (c) => [
  sec(header(c)), pagehead("Collection", "Huit pièces,<br>une vitrine", "Chaque pièce se compose ensuite dans l'atelier : cliquez sur une vitrine pour la voir de près."),
  sec(`<section class="fc-sec fc-sec--tight fc-sec--head pk-bleed" data-coll><div class="fc-wrap"><div class="fc-filters" data-reveal role="group" aria-label="Filtrer la collection"><p class="fc-label">Type</p><div class="fc-chips">
    <a class="fc-chip" href="#tout" data-fk="tout" aria-pressed="true">Tout</a>${Object.entries(KIND).map(([k, v]) => `<a class="fc-chip" href="#${k}" data-fk="${k}" aria-pressed="false">${v}</a>`).join("")}</div>
    <p class="fc-label">Métal</p><div class="fc-chips"><a class="fc-chip" href="#tous" data-fm="tous" aria-pressed="true">Tous</a>${Object.entries(METALN).map(([k, v]) => `<a class="fc-chip" href="#m-${k}" data-fm="${k}" aria-pressed="false">${v}</a>`).join("")}</div></div>
    <p class="fc-count" role="status" aria-live="polite" data-count-out>8 pièces</p>
    <div class="fc-vitgrid">${PIECES.slice(0, 2).map((p, i) => vitrine(p, i)).join("")}</div></div></section>`),
  ...[[2, 4], [4, 6]].map(([x, y]) => sec(`<section class="fc-sec fc-sec--flush pk-bleed"><div class="fc-wrap"><div class="fc-vitgrid">${PIECES.slice(x, y).map((p, i) => vitrine(p, i + x)).join("")}</div></div></section>`)),
  sec(`<section class="fc-sec fc-sec--flush fc-sec--end pk-bleed"><div class="fc-wrap"><div class="fc-vitgrid">${PIECES.slice(6).map((p, i) => vitrine(p, i + 6)).join("")}</div>
    <p class="fc-empty" data-empty>Aucune pièce ne correspond : essayez un autre métal.</p></div></section>`),
  cta("Le métal ne vous convient pas ?", "Chaque vitrine peut être refaite dans un autre métal ou une autre pierre. Essayez-le dans l'atelier.", "Ouvrir l'atelier", "/atelier"),
  sec(footer(c)),
];

// ---------- Atelier (composant signature) ----------
const radios = (g, items, cur, cls = "") => items.map(([v, label, extra = ""]) => `<a class="fc-opt ${cls}" href="#${g}-${v}" role="radio" aria-checked="${v === cur}" data-v="${v}">${extra}<span>${esc(label)}</span></a>`).join("");
const atelier = (c) => {
  const p0 = PIECES[0];
  return [
    sec(header(c)),
    sec(`<section class="fc-atl pk-bleed"><div class="fc-wrap"><div class="fc-atl-head"><p class="fc-kicker" data-reveal>Atelier de création</p><div class="fc-title fc-title--s" role="heading" aria-level="1" data-reveal>Composer sa pièce</div><p class="fc-ph-sub" data-reveal>Choisissez la pièce, le métal, la pierre et sa taille : le dessin se recolore et la loupe permet de vérifier chaque griffe.</p></div>
    <div class="fc-cfg" data-fc-cfg>
      <div class="fc-cfg-l"><div class="fc-stage" data-metal="${p0.metal}" data-stone="${p0.stone}" data-size="classique"><div class="fc-view">${piece(p0.id, "fc-piece--big")}</div><div class="fc-lens" aria-hidden="true"><div class="fc-lens-in"></div></div><span class="fc-stage-hint" aria-hidden="true">Survolez pour agrandir</span></div>
        <div class="fc-tools" role="group" aria-label="Loupe"><a class="fc-tool" href="#loupe" data-zoom="toggle" aria-pressed="false">Loupe</a><a class="fc-tool" href="#moins" data-zoom="out" aria-label="Réduire le grossissement">−</a><span class="fc-zlev" data-zlev>×2,6</span><a class="fc-tool" href="#plus" data-zoom="in" aria-label="Augmenter le grossissement">+</a></div>
        <p class="fc-fine">Clavier : sélectionnez la vue, puis les flèches déplacent la loupe, + et − règlent le grossissement, Entrée l'active.</p>
        </div>
      <div class="fc-cfg-r">
        <div class="fc-step"><h2 class="fc-step-h"><b>1</b> La pièce</h2><div class="fc-opts fc-opts--piece" role="radiogroup" aria-label="Pièce" data-group="piece">${radios("piece", PIECES.map((p) => [p.id, p.name]), p0.id)}</div></div>
        <div class="fc-step"><h2 class="fc-step-h"><b>2</b> Le métal</h2><div class="fc-opts" role="radiogroup" aria-label="Métal" data-group="metal">${Object.entries(METALN).map(([k, v]) => `<a class="fc-opt fc-opt--sw fc-sw-${k}" href="#metal-${k}" role="radio" aria-checked="${k === p0.metal}" data-v="${k}"><i></i><span>${v}</span></a>`).join("")}</div></div>
        <div class="fc-step"><h2 class="fc-step-h"><b>3</b> La pierre</h2><div class="fc-opts" role="radiogroup" aria-label="Pierre" data-group="stone">${Object.entries(STONEN).map(([k, v]) => `<a class="fc-opt fc-opt--sw fc-st-${k}" href="#stone-${k}" role="radio" aria-checked="${k === p0.stone}" data-v="${k}"><i></i><span>${v}</span></a>`).join("")}</div></div>
        <div class="fc-step"><h2 class="fc-step-h"><b>4</b> La taille de la pierre</h2><div class="fc-opts" role="radiogroup" aria-label="Taille de la pierre" data-group="size">${radios("size", [["fine", "Fine"], ["classique", "Classique"], ["genereuse", "Généreuse"]], "classique")}</div></div>
        <div class="fc-recap" role="status" aria-live="polite"><p class="fc-label">Votre sélection</p><dl class="fc-recap-l"><div><dt>Pièce</dt><dd data-r="piece">${p0.name}</dd></div><div><dt>Métal</dt><dd data-r="metal">${METALN[p0.metal]}</dd></div><div><dt>Pierre</dt><dd data-r="stone">${STONEN[p0.stone]}</dd></div><div><dt>Taille</dt><dd data-r="size">Classique, environ 0,8 ct</dd></div></dl>
          <div class="fc-actions"><a class="fc-btn" href="/contact" data-fc-send>Envoyer ma sélection ${arrow}</a><a class="fc-btn fc-btn--ghost" href="#copier" data-fc-copy>Copier le récapitulatif</a></div>
          <p class="fc-fine">Aucun achat ni paiement ici : votre sélection est recopiée dans le formulaire de contact, et l'atelier vous répond avec un devis.</p></div>
      </div></div></div></section>`),
    ...[[0, 3], [3, 6], [6, 8]].map(([a, b]) => sec(`<div class="fc-tpls pk-bleed">${PIECES.slice(a, b).map((p) => `<div class="fc-tpl" data-id="${p.id}" data-name="${esc(p.name)}" data-metal="${p.metal}" data-stone="${p.stone}">${piece(p.id, "fc-piece--big")}</div>`).join("")}</div>`)),
    sec(`<section class="fc-sec fc-sec--tight pk-bleed"><div class="fc-wrap fc-3"><article class="fc-note" data-reveal><h3>Poids indicatifs</h3><p>La taille de la pierre est donnée à titre d'exemple : fine environ 0,5 ct, classique 0,8 ct, généreuse 1,2 ct. Le devis précise les mesures réelles.</p></article><article class="fc-note" data-reveal><h3>Couleurs à l'écran</h3><p>Les teintes d'un écran restent une approximation. Nous montrons les pierres et les métaux en atelier, à la lumière du jour.</p></article><article class="fc-note" data-reveal><h3>Une autre idée ?</h3><p>Pierre de famille, gravure, forme inédite : le sur-mesure part de votre dessin.</p><a class="fc-more" href="/sur-mesure">Voir le sur-mesure ${arrow}</a></article></div></section>`),
    sec(footer(c)),
  ];
};

// ---------- Savoir-faire ----------
const side = `<svg class="fc-anat-svg" viewBox="0 0 300 260" role="img" aria-label="Coupe d'une gemme avec ses parties : table, couronne, ceinture, pavillon et culasse">
  <g data-stone="aigue" class="fc-anat">
  <polygon class="fc-part fc-g0" data-part="table" points="100 50 200 50 190 62 110 62"/>
  <polygon class="fc-part fc-g1" data-part="couronne" points="110 62 190 62 250 112 50 112"/>
  <polygon class="fc-part fc-g3" data-part="ceinture" points="50 112 250 112 250 122 50 122"/>
  <polygon class="fc-part fc-g2" data-part="pavillon" points="50 122 250 122 150 232"/>
  <polygon class="fc-part fc-g0" data-part="culasse" points="140 222 160 222 150 240" /></g>
  <g class="fc-anat-l" fill="none" stroke="currentColor" stroke-width=".7"><path d="M110 62L150 112 190 62M150 112L50 122M150 112L250 122M150 122V232M70 112L110 62M230 112L190 62"/></g></svg>`;
const PARTS = [["table", "La table", "La grande facette plane du dessus : la fenêtre par laquelle la lumière entre et ressort."], ["couronne", "La couronne", "La partie haute, taillée en facettes qui décomposent la lumière en éclats colorés."], ["ceinture", "La ceinture", "Le fin bord périphérique, là où les griffes viennent se refermer."], ["pavillon", "Le pavillon", "La partie basse. Son angle renvoie la lumière vers le haut : trop plat ou trop pointu, la pierre s'éteint."], ["culasse", "La culasse", "La pointe minuscule de la pierre, polie pour ne laisser aucun éclat."]];
const savoir = (c) => [
  sec(header(c)), pagehead("Savoir-faire", "Le geste,<br>la patience", "Dessin, taille, sertissage et polissage : quatre métiers réunis dans un seul atelier."),
  sec(`<section class="fc-sec pk-bleed" data-anat><div class="fc-wrap fc-anat-in"><div class="fc-anat-fig" data-reveal>${side}</div><div data-reveal><p class="fc-kicker">Anatomie</p><h2 class="fc-h2">Comprendre l'éclat d'une pierre</h2>
    <div class="fc-tabs" role="tablist" aria-label="Parties de la gemme">${PARTS.map(([k, t, d], i) => `<a class="fc-tab" href="#${k}" role="tab" aria-selected="${i === 0}" data-part-tab="${k}" data-d="${esc(PARTS[i][2])}">${t}</a>`).join("")}</div>
    <div class="fc-panel" role="tabpanel" aria-live="polite"><h3 data-part-t>${PARTS[0][1]}</h3><p data-part-d>${PARTS[0][2]}</p></div></div></div></section>`),
  sec(`<section class="fc-sec fc-craft pk-bleed"><div class="fc-wrap"><div class="fc-sec-head" data-reveal><div><p class="fc-kicker">Les quatre temps</p><h2 class="fc-h2">Du brut au miroir</h2></div></div>
    <div class="fc-craft-list">
    <article class="fc-craft-row" data-reveal><svg viewBox="0 0 120 120" aria-hidden="true" class="fc-craft-svg"><polygon class="fc-g2" points="22 70 38 34 70 22 98 48 92 88 56 100"/><polygon class="fc-g1" points="38 34 70 22 66 56"/><polygon class="fc-g3" points="22 70 38 34 66 56 56 100"/><polygon class="fc-g0" points="70 22 98 48 66 56"/></svg><div><span class="fc-step-n">01</span><h3>Choisir la pierre brute</h3><p>On l'observe sous une loupe de dix grossissements, à la recherche de la meilleure orientation pour garder le plus de matière utile.</p></div></article>
    <article class="fc-craft-row" data-reveal><svg viewBox="0 0 120 120" aria-hidden="true" class="fc-craft-svg">${gem(60, 60, 48)}<g class="fc-guide"><line x1="6" y1="60" x2="114" y2="60"/><line x1="60" y1="6" x2="60" y2="114"/></g></svg><div><span class="fc-step-n">02</span><h3>Tailler les facettes</h3><p>Chaque facette est polie sur un disque à l'angle exact. Une demi-journée suffit pour quelques-unes, des jours pour la pierre entière.</p></div></article>
    <article class="fc-craft-row" data-reveal><svg viewBox="0 0 120 120" aria-hidden="true" class="fc-craft-svg"><circle class="fc-mb" cx="60" cy="68" r="38"/><circle cx="60" cy="68" r="28" fill="#06130f"/>${gem(60, 52, 24)}${[[36, 36], [84, 36], [34, 66], [86, 66]].map(([x, y]) => `<path class="fc-ma-s" stroke-width="5" stroke-linecap="round" fill="none" d="M${x} ${y}L${x < 60 ? x + 7 : x - 7} ${y - 10}"/>`).join("")}</svg><div><span class="fc-step-n">03</span><h3>Sertir à la main</h3><p>Les griffes sont rabattues une à une sur la ceinture avec un poussoir, jusqu'à ce que la pierre ne bouge plus d'un cheveu.</p></div></article>
    <article class="fc-craft-row" data-reveal><svg viewBox="0 0 120 120" aria-hidden="true" class="fc-craft-svg">${ring(60, 66, 44, 32)}${arc(60, 66, 38, 200, 290, "fc-ma-s", 3)}<g class="fc-twk">${sparkle("fc-sp-a")}</g></svg><div><span class="fc-step-n">04</span><h3>Polir jusqu'au miroir</h3><p>Trois passages au feutre, du plus rugueux au plus doux. La pièce est ensuite contrôlée sous loupe avant de quitter l'atelier.</p></div></article></div></div></section>`),
  sec(`<section class="fc-sec fc-sec--tight pk-bleed"><div class="fc-wrap"><div data-reveal><p class="fc-kicker">Repères</p><h2 class="fc-h2">Les quatre « C » d'un diamant</h2></div>
    <table class="fc-table" data-reveal><caption class="fc-sr">Les quatre critères de qualité d'un diamant</caption><thead><tr><th scope="col">Critère</th><th scope="col">Ce que l'on regarde</th><th scope="col">Ce qu'il change</th></tr></thead><tbody>
    <tr><th scope="row" data-l="Critère">Taille (cut)</th><td data-l="Ce que l'on regarde">Proportions, symétrie, poli</td><td data-l="Ce qu'il change">La vivacité des reflets</td></tr>
    <tr><th scope="row" data-l="Critère">Pureté (clarity)</th><td data-l="Ce que l'on regarde">Inclusions et petits défauts</td><td data-l="Ce qu'il change">La netteté, de près seulement</td></tr>
    <tr><th scope="row" data-l="Critère">Couleur (colour)</th><td data-l="Ce que l'on regarde">De l'incolore au jaune pâle</td><td data-l="Ce qu'il change">La blancheur de l'éclat</td></tr>
    <tr><th scope="row" data-l="Critère">Carat (carat)</th><td data-l="Ce que l'on regarde">Le poids : 1 ct = 0,2 g</td><td data-l="Ce qu'il change">La taille apparente</td></tr></tbody></table></div></section>`),
  cta("Voir l'atelier en vrai", "Les visites se font sur rendez-vous, à l'établi, devant une pièce en cours.", "Prendre rendez-vous", "/contact"),
  sec(footer(c)),
];

// ---------- Sur-mesure ----------
const surmesure = (c) => [
  sec(header(c)), pagehead("Sur-mesure", "Votre dessin,<br>nos mains", "Une pierre de famille, une idée, un souvenir : nous le transformons en pièce unique, étape par étape."),
  sec(`<section class="fc-sec pk-bleed"><div class="fc-wrap"><div class="fc-sec-head" data-reveal><div><p class="fc-kicker">Le parcours</p><h2 class="fc-h2">Cinq temps, du premier mot à la remise</h2></div></div>
    <ol class="fc-line">${[["Rencontre", "Un échange à l'atelier ou en visio : l'occasion, le style, la pierre éventuelle.", "1 semaine"], ["Esquisse", "Deux dessins à la main et un rendu en couleur pour choisir.", "1 à 2 semaines"], ["Maquette", "Un modèle en cire à essayer, pour ajuster la taille et le volume.", "1 semaine"], ["Fabrication", "Fonte, sertissage et polissage dans l'atelier.", "3 à 5 semaines"], ["Remise", "Contrôle sous loupe, écrin et conseils d'entretien.", "Sur rendez-vous"]].map(([t, d, w], i) => `<li data-reveal><span class="fc-line-n">${i + 1}</span><h3>${t}</h3><p>${d}</p><small>${w}</small></li>`).join("")}</ol>
    <p class="fc-fine">Délais indicatifs de démonstration.</p></div></section>`),
  sec(`<section class="fc-sec fc-sec--tight fc-metals pk-bleed"><div class="fc-wrap"><div data-reveal><p class="fc-kicker">Matières</p><h2 class="fc-h2">Choisir son métal</h2></div>
    <table class="fc-table" data-reveal><caption class="fc-sr">Comparaison des quatre métaux proposés</caption><thead><tr><th scope="col">Métal</th><th scope="col">Teinte</th><th scope="col">Au quotidien</th><th scope="col">Pour qui</th></tr></thead><tbody>
    ${[["jaune", "Or jaune", "Chaude, lumineuse", "Se raye légèrement, se repolit", "Les peaux claires comme mates"], ["rose", "Or rose", "Cuivrée, douce", "Plus résistant grâce au cuivre", "Un look vintage et délicat"], ["argent", "Argent", "Blanc brillant", "Se ternit, un chiffon suffit", "Les budgets mesurés, le quotidien"], ["platine", "Platine", "Gris acier profond", "Très dense, s'use très peu", "Les pierres précieuses à garder toute une vie"]].map(([k, n, a, b, d]) => `<tr><th scope="row" data-l="Métal"><span class="fc-dot fc-sw-${k}"><i></i></span>${n}</th><td data-l="Teinte">${a}</td><td data-l="Au quotidien">${b}</td><td data-l="Pour qui">${d}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="fc-sec fc-sec--tight pk-bleed"><div class="fc-wrap fc-faq"><div data-reveal><p class="fc-kicker">Questions</p><h2 class="fc-h2">Avant de commencer</h2></div><div data-reveal>
    <details><summary>Puis-je apporter ma propre pierre ?</summary><p>Oui. Nous l'examinons, vérifions qu'elle supporte le sertissage et dessinons la monture autour d'elle.</p></details>
    <details><summary>Peut-on refaire un bijou ancien ?</summary><p>C'est même un grand classique : on peut transformer, resserrer ou moderniser une pièce de famille en conservant les pierres.</p></details>
    <details><summary>Comment se passe la taille de bague ?</summary><p>Un jeu de bagues témoins permet de mesurer le doigt à l'atelier ; à distance, nous envoyons une bague-mesure gratuite.</p></details>
    <details><summary>Puis-je suivre la fabrication ?</summary><p>Des photos de chaque étape vous sont envoyées, et l'atelier peut se visiter sur rendez-vous.</p></details>
    <details><summary>Cette page garantit-elle un prix ?</summary><p>Non, ce site est une démonstration : aucun prix, délai ou engagement n'est fixé ici.</p></details></div></div></section>`),
  cta("Racontez-nous votre pièce", "Quelques lignes suffisent pour commencer : l'occasion, le métal rêvé, une photo de référence.", "Écrire à l'atelier", "/contact"),
  sec(footer(c)),
];

// ---------- Contact, recherche, introuvable ----------
const contact = (c) => [
  sec(header(c)), pagehead("Contact", "Écrivez à<br>l'atelier", "Une question, une idée de bijou, un rendez-vous : nous répondons sous deux jours ouvrés."),
  { type: "form", heading: "Envoyer un message", intro: "Si vous avez composé une pièce dans l'atelier, sa sélection se recopie ici automatiquement : relisez-la avant d'envoyer." },
  sec(`<section class="fc-sec fc-sec--tight pk-bleed"><div class="fc-wrap fc-3"><article class="fc-note" data-reveal><h3>L'atelier</h3><address>12 passage des Orfèvres<br>75003 (adresse fictive)</address><p>Visites et essayages sur rendez-vous.</p></article><article class="fc-note" data-reveal><h3>Horaires</h3><p>Du mardi au samedi, de 10 h à 18 h. Fermé le dimanche et le lundi.</p></article><article class="fc-note" data-reveal><h3>Composer d'abord ?</h3><p>Préparez votre pièce dans l'atelier : métal, pierre et taille arrivent dans votre message.</p><a class="fc-more" href="/atelier">Ouvrir l'atelier ${arrow}</a></article></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une pierre,<br>un mot ?", "Pièce, métal, pierre, étape de fabrication : cherchez sur tout le site."), { type: "layout", children: [{ type: "search", props: { placeholder: "Bague, saphir, platine, sertissage…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="fc-404 pk-bleed"><div class="fc-wrap fc-404-in"><svg class="fc-404-gem" viewBox="-110 -110 220 220" aria-hidden="true">${gem(0, 0, 100, "fc-gem fc-live fc-broken")}</svg><div><p class="fc-kicker">Facette manquante</p><div class="fc-title" role="heading" aria-level="1">Page introuvable</div><p class="fc-ph-sub">Cette page n'existe pas ou a changé d'adresse : il manque une facette à la pierre.</p><div class="fc-actions"><a class="fc-btn" href="/">Retour à l'accueil ${arrow}</a><a class="fc-btn fc-btn--ghost" href="/collection">Voir la collection</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "facette", name: "Facette", version: "2.0.0", category: "mode", tags: ["luxe", "sombre", "geometrique", "classique"], siteType: "Joaillerie artisanale", featured: true,
  concept: "Un écrin vert bouteille où une gemme dessinée scintille, et un atelier de création dont la loupe suit le pointeur et dont le métal ou la pierre recolorent vraiment le bijou.",
  description: "Joaillerie sur fond vert bouteille : gemme géométrique aux facettes scintillantes, barre fine centrée, vitrines à deux colonnes et atelier de création avec loupe, choix du métal et de la pierre.",
  brand: "Facette Joaillerie", modules: ["formulaires", "recherche"],
  dna: { header: "barre-fine-centree-logo-et-filets-entre-deux-menus", hero: "gemme-geometrique-a-facettes-scintillantes-dans-des-cercles-gradues", grid: "vitrines-sous-verre-a-deux-colonnes", motion: "facettes-qui-scintillent-et-gemme-qui-suit-le-pointeur", shapes: "facettes-triangulaires-filets-tres-fins-et-etincelles-a-quatre-branches", rhythm: "ecrin-sombre-aere-et-pages-de-catalogue", signature: "fiche-bijou-a-loupe-pointeur-clavier-et-choix-metal-pierre-recolorant-le-dessin" },
  tokens: {
    colors: { primary: "#8fd8c0", secondary: "#e7b3a1", accent: "#d8e4f2", background: "#061c18", surface: "#0c2924", text: "#e9f2ee", muted: "#a3beb4", success: "#7fd4a8", warning: "#e6c36a", error: "#f09a9a" },
    fonts: { heading: "font.bellefair", body: "font.didact-gothic", button: "font.tenor-sans", link: "font.didact-gothic" },
    radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2c534a" },
    type: { h1: { size: 76, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 44, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur des filets et reflets", type: "color", default: "#8fd8c0" },
    { key: "fond", label: "Fond de l'écrin", type: "choice", default: "vert", choices: [["vert", "Vert bouteille"], ["nuit", "Bleu nuit"]] },
    { key: "glint", label: "Scintillement des facettes", type: "choice", default: "on", choices: [["on", "Actif"], ["off", "Fixe"]] },
    { key: "cadre", label: "Cadre des vitrines", type: "choice", default: "double", choices: [["double", "Double filet"], ["simple", "Filet simple"]] },
  ],
  menu: [["Accueil", "/"], ["Collection", "/collection"], ["Atelier", "/atelier"], ["Savoir-faire", "/savoir-faire"], ["Sur-mesure", "/sur-mesure"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "collection", name: "Collection", render: collection }, { key: "atelier", name: "Atelier de création", render: atelier },
    { key: "savoir-faire", name: "Savoir-faire", render: savoir }, { key: "sur-mesure", name: "Sur-mesure", render: surmesure }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
