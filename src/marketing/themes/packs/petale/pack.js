// Pétale — atelier fleuriste. Direction artistique : aquarelle fraîche sur blanc pur. Fleurs dessinées en SVG (pivoines, tulipes, eucalyptus), hero qui s'épanouit,
// onglets de saison qui recolorent tout le site, grille masonry de bouquets, composeur de bouquet (redessiné en direct) et créneau de livraison.
const { sec, form, esc, nav } = require("../kit");

/* ---------- Dessin des fleurs (SVG en ligne ; couleur = attribut fill="#…" ou class="pt-cN" pour suivre la saison). Les pétales d'une couronne forment UN seul tracé (poids léger). ---------- */
const R = (n) => Math.round(n);
const ring = (n, L, W, a, off = 0, op = 0.9) => {
  let d = "";
  for (let i = 0; i < n; i++) { const t = ((off + (i * 360) / n) * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), P = (x, y) => `${R(x * c - y * s)} ${R(x * s + y * c)}`; d += `M0 0C${P(-W, -L * 0.25)} ${P(-W * 0.9, -L * 0.95)} ${P(0, -L)}C${P(W * 0.9, -L * 0.95)} ${P(W, -L * 0.25)} 0 0Z`; }
  return `<path ${a} d="${d}" opacity="${op}" stroke="#fff" stroke-width="1"/>`;
};
const F = (k) => `fill="${k}"`;
const dots = (pts, r) => pts.map(([x, y, q = r]) => `M${R(x - q)} ${R(y)}a${q} ${q} 0 1 0 ${2 * q} 0a${q} ${q} 0 1 0 ${-2 * q} 0`).join("");
const peony = (x, y, r, a, b, c, d = "pt-d1", rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="pt-bl ${d}"><g class="pt-r1">${ring(9, r, r * 0.52, a, 0, 0.88)}</g><g class="pt-r2">${ring(7, r * 0.78, r * 0.44, b, 24, 0.92)}</g><g class="pt-r3">${ring(6, r * 0.5, r * 0.3, c, 8, 0.96)}</g><circle r="${R(r * 0.1)}" fill="#f6c453"/></g></g>`;
const rose = (x, y, r, a, d = "pt-d2") => `<g transform="translate(${x} ${y})"><g class="pt-bl ${d}">${ring(5, r, r * 0.6, a, 10, 0.88)}<circle r="${R(r * 0.62)}" ${a} stroke="#fff"/><path d="M${R(-r * 0.4)} 0a${R(r * 0.4)} ${R(r * 0.4)} 0 1 1 ${R(r * 0.4)} ${R(r * 0.4)}" fill="none" stroke="#fff" stroke-width="1.4"/></g></g>`;
const daisy = (x, y, r, a, b, d = "pt-d3") => `<g transform="translate(${x} ${y})"><g class="pt-bl ${d}">${ring(12, r, r * 0.17, a, 0, 0.96)}<circle r="${R(r * 0.26)}" ${b}/></g></g>`;
const lilac = (x, y, s, a, rot = 0, d = "pt-d4") => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><g class="pt-bl pt-bb ${d}"><path ${a} d="${dots(Array.from({ length: 12 }, (_, j) => [Math.sin(j * 2.3) * (7 - j * 0.45), -j * 3.6, 3.8 - j * 0.12]), 3)}"/></g></g>`;
const tulip = (x, y, s, a, len, leaf, d = "pt-d3") => `<g transform="translate(${x} ${y}) scale(${s})"><g class="pt-bl pt-bb ${d}"><path d="M0 0V${len}" stroke-width="3" fill="none" ${leaf.stem}/><path d="M0 ${len}C-26 ${len - 30} -30 ${len - 80} -10 ${len - 112}C-8 ${len - 66} -3 ${len - 40} 0 ${len}ZM0 ${len - 6}C24 ${len - 34} 28 ${len - 70} 12 ${len - 100}C8 ${len - 64} 2 ${len - 36} 0 ${len - 6}Z" ${leaf.fill} opacity=".85"/><path d="M-15 -2C-19 -28 -9 -44 0 -48C9 -44 19 -28 15 -2C9 6 -9 6 -15 -2Z" ${a}/><path d="M-15 -2C-19 -28 -9 -44 -2 -47C-5 -28 -3 -8 3 5C-6 6 -12 3 -15 -2Z" fill="#fff" opacity=".3"/></g></g>`;
const leaf = (cx, cy, rx, ry, deg) => { const t = (deg * Math.PI) / 180, dx = rx * Math.cos(t), dy = rx * Math.sin(t); return `M${R(cx - dx)} ${R(cy - dy)}A${R(rx)} ${R(ry)} ${deg} 1 0 ${R(cx + dx)} ${R(cy + dy)}A${R(rx)} ${R(ry)} ${deg} 1 0 ${R(cx - dx)} ${R(cy - dy)}`; };
const euc = (x, y, len, rot, lf, sw = "pt-s1") => {
  const n = Math.max(4, Math.floor(len / 32)), c = len * 0.09; let d1 = "", d2 = "";
  for (let i = 0; i < n; i++) { const t = (i + 1) / (n + 1), side = i % 2 ? 1 : -1, r = 14 - 6 * t, px = 2 * t * (1 - t) * c, s = leaf(px + side * (6 + r * 0.9), -len * t, r * 1.25, r * 0.85, side * 32); if (i % 3) d1 += s; else d2 += s; }
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="pt-swy ${sw}"><path d="M0 0Q${R(c)} ${R(-len / 2)} 0 ${-len}" fill="none" stroke-width="2.4" ${lf.stem}/><path d="${d1}${leaf(0, -len - 8, 11, 8, 90)}" ${lf.f1} opacity=".92"/><path d="${d2}" ${lf.f2} opacity=".92"/></g></g>`;
};
const SEASON_LEAF = { f1: 'class="pt-lf1"', f2: 'class="pt-lf2"', stem: 'class="pt-ls"' };
const LEAFG = { f1: F("#7db38f"), f2: F("#b4d8bf"), stem: 'stroke="#5f9473"' };
const LEAFS = { f1: F("#6fa57f"), f2: F("#a8cf9f"), stem: 'stroke="#5f9473"' };
const TULEAF = { stem: 'class="pt-ls"', fill: 'class="pt-lf1"' };
const TULEAF2 = { stem: 'stroke="#5f9473"', fill: F("#7db38f") };
const petalP = (L, W) => `M0 0C${-W} ${R(-L * 0.25)} ${R(-W * 0.9)} ${R(-L * 0.95)} 0 ${-L}C${R(W * 0.9)} ${R(-L * 0.95)} ${W} ${R(-L * 0.25)} 0 0Z`;
const fall = (x, y, a, d) => `<g transform="translate(${x} ${y})"><g class="pt-fall ${d}"><path ${a} d="${petalP(26, 11)}" opacity=".75" transform="rotate(30)"/></g></g>`;

/* Hero : composition qui s'épanouit, colorée par la saison (classes pt-c1..c4) */
const heroArt = () => `<svg class="pt-hero-svg" viewBox="0 0 600 640" role="img" aria-label="Composition florale : pivoines, tulipes, lilas et branches d'eucalyptus"><title>Composition florale aquarelle</title>
  <circle cx="300" cy="320" r="262" class="pt-wa" opacity=".34"/><circle cx="170" cy="440" r="150" class="pt-wb" opacity=".36"/><circle cx="450" cy="210" r="140" class="pt-wc" opacity=".4"/>
  ${euc(300, 620, 360, -52, SEASON_LEAF, "pt-s1")}${euc(300, 620, 400, -26, SEASON_LEAF, "pt-s2")}${euc(300, 620, 420, 4, SEASON_LEAF, "pt-s3")}${euc(300, 620, 390, 30, SEASON_LEAF, "pt-s1")}${euc(300, 620, 330, 54, SEASON_LEAF, "pt-s2")}
  ${tulip(168, 258, 1.5, 'class="pt-c2"', 235, TULEAF, "pt-d4")}${tulip(438, 236, 1.55, 'class="pt-c3"', 270, TULEAF, "pt-d5")}${tulip(366, 128, 1.15, 'class="pt-c2"', 330, TULEAF, "pt-d6")}
  ${peony(298, 340, 124, 'class="pt-c1"', 'class="pt-c2"', 'class="pt-c3"', "pt-d1", -8)}${peony(168, 430, 84, 'class="pt-c2"', 'class="pt-c3"', 'class="pt-c1"', "pt-d2", 12)}${peony(432, 410, 90, 'class="pt-c1"', 'class="pt-c3"', 'class="pt-c2"', "pt-d3", 20)}${peony(300, 176, 58, 'class="pt-c3"', 'class="pt-c2"', 'class="pt-c1"', "pt-d5")}
  ${lilac(96, 360, 1.25, 'class="pt-c4"', -24, "pt-d5")}${lilac(520, 330, 1.2, 'class="pt-c4"', 22, "pt-d6")}${lilac(236, 512, 1, 'class="pt-c4"', -8, "pt-d6")}${lilac(366, 520, 1, 'class="pt-c4"', 10, "pt-d5")}
  ${daisy(104, 516, 24, F("#fff"), 'class="pt-c2"', "pt-d6")}${daisy(500, 500, 26, F("#fff"), 'class="pt-c3"', "pt-d5")}
  ${fall(120, 90, 'class="pt-c1"', "pt-f1")}${fall(520, 120, 'class="pt-c4"', "pt-f2")}${fall(60, 220, 'class="pt-c3"', "pt-f3")}${fall(560, 440, 'class="pt-c2"', "pt-f4")}${fall(280, 40, 'class="pt-c2"', "pt-f5")}
</svg>`;

/* Bouquets de la vitrine : les cartes sont dessinées par motion.js avec le même moteur que le composeur (données dans data-art : fleurs | style | feuillage | vase | palette) */
const BQ = [
  { n: "Aube rose", p: 38, cat: "amour anniversaire", se: "Printemps", it: "pivoine:3,rose:1", st: "romantique", lf: "euc", v: "verre", pal: "f7a3b5,fcc8d2,fde4e8", ar: 1, d: "pivoines, rose de jardin et eucalyptus dans un vase en verre", w: "pt-w1" },
  { n: "Tulipes en fête", p: 29, cat: "anniversaire remerciement", se: "Printemps", it: "tulipe:7", st: "champetre", lf: "euc", v: "papier", pal: "ff8a73,ffb59c,ffe0d2", ar: 3, d: "sept tulipes corail et pêche en papier kraft", w: "pt-w2" },
  { n: "Prairie d'été", p: 34, cat: "anniversaire interieur", se: "Été", it: "marguerite:6,lilas:2", st: "champetre", lf: "fougere", v: "cruche", pal: "ffd166,ffa8a8,cdb8f3", ar: 2, d: "marguerites, lilas et fougères dans une cruche bleue", w: "pt-w3" },
  { n: "Grande romance", p: 56, cat: "amour", se: "Été", it: "pivoine:5,rose:3", st: "romantique", lf: "euc", v: "gres", pal: "f27c6b,ffb39e,ffe5dc", ar: 1, d: "pivoines et roses corail en dôme dense", w: "pt-w1" },
  { n: "Solo pivoine", p: 24, cat: "remerciement interieur naissance", se: "Printemps", it: "pivoine:1,tulipe:1", st: "moderne", lf: "euc", v: "verre", pal: "c9b2f0,e4d8fa,f1ebfd", ar: 2, d: "une grande pivoine lilas, une tulipe et des branches d'eucalyptus", w: "pt-w4" },
  { n: "Petit rond pêche", p: 26, cat: "naissance remerciement", se: "Été", it: "rose:5,marguerite:4", st: "rond", lf: "aucun", v: "papier", pal: "ffb98f,ffd3b8,fff0e6", ar: 3, d: "bouquet rond de roses et marguerites en papier kraft", w: "pt-w2" },
  { n: "Jardin d'automne", p: 42, cat: "anniversaire amour", se: "Automne", it: "pivoine:3,rose:3,lilas:1", st: "champetre", lf: "olivier", v: "cruche", pal: "d9573a,f0a25a,f6d3a8", ar: 1, d: "pivoines rouille, roses ocre et feuillage doré", w: "pt-w3" },
  { n: "Givre lilas", p: 36, cat: "interieur naissance", se: "Hiver", it: "pivoine:4,lilas:2", st: "romantique", lf: "euc", v: "gres", pal: "b6a4ea,d7ccf5,efeafc", ar: 2, d: "pivoines lilas pâle et eucalyptus argenté", w: "pt-w4" },
  { n: "Champs libres", p: 31, cat: "interieur remerciement", se: "Été", it: "marguerite:8,lilas:2,rose:1", st: "champetre", lf: "fougere", v: "verre", pal: "ffa8c0,ffe29a,c9e8c4", ar: 3, d: "marguerites roses et jaunes, lilas et herbes folles", w: "pt-w5" },
  { n: "Ligne claire", p: 39, cat: "interieur amour", se: "Hiver", it: "pivoine:2,tulipe:2", st: "moderne", lf: "olivier", v: "cruche", pal: "f27c6b,ffb39e,ffe5dc", ar: 1, d: "deux pivoines corail, deux tulipes et de hautes branches d'olivier", w: "pt-w1" },
];
const eur = (n) => `${n} €`;
const card = (b, i, link = "/composer") => `<article class="pt-card ${b.w}" data-cat="${b.cat}" data-reveal><a class="pt-card-art pt-ar${b.ar}" href="${link}" data-art="${b.it}|${b.st}|${b.lf}|${b.v}|${b.pal}" aria-label="${esc(`Composer à partir de « ${b.n} » : ${b.d}`)}"></a><div class="pt-card-body"><span class="pt-badge">${b.se}</span><h3>${esc(b.n)}</h3><p>${esc(b.d.charAt(0).toUpperCase() + b.d.slice(1))}.</p><div class="pt-card-foot"><b>dès ${eur(b.p)}</b><a class="pt-link" href="${link}">Composer le mien</a></div></div></article>`;

/* ---------- Icônes ---------- */
const ICO = {
  printemps: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21v-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7 4c0 5 2 8 5 9 3-1 5-4 5-9-2 1-3 0-5-2-2 2-3 3-5 2z" fill="currentColor"/></svg>`,
  ete: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  automne: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C4 10 9 4 20 4c0 11-6 16-15 15z" fill="currentColor"/><path d="M5 19 14 10" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>`,
  hiver: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>`,
};
const SEASONS = [["printemps", "Printemps"], ["ete", "Été"], ["automne", "Automne"], ["hiver", "Hiver"]];
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const bloomLogo = `<svg class="pt-logo-ico" viewBox="0 0 40 40" aria-hidden="true"><g transform="translate(20 20)">${ring(6, 17, 8, 'class="pt-lg1"', 0, 0.95)}${ring(6, 11, 6, 'class="pt-lg2"', 30, 1)}<circle r="3" fill="#f6c453"/></g></svg>`;

/* ---------- Structure commune ---------- */
const header = (c) => `<header class="pt-head pk-bleed">
  <div class="pt-bar"><a class="pt-logo" href="/" aria-label="${esc(c.brand)} — accueil">${bloomLogo}<span><b>Pétale</b><small>atelier fleuriste</small></span></a>
    <div class="pt-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <a class="pt-btn pt-btn--s" href="/composer">Composer</a>
    <details class="pt-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="pt-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="pt-link" href="/recherche">Rechercher</a><a class="pt-btn" href="/composer">Composer mon bouquet</a></div></details></div>
  <div class="pt-seasons-wrap"><div class="pt-seasons" role="tablist" aria-label="Saison du site : change les couleurs et les fleurs mises en avant"><span class="pt-sea-l">Saison</span>${SEASONS.map(([k, l], i) => `<a class="pt-tab${i ? "" : " is-on"}" href="#${k}" role="tab" data-season="${k}" aria-selected="${i ? "false" : "true"}">${ICO[k]}<span>${l}</span></a>`).join("")}</div></div></header>`;

const footer = (c) => `<footer class="pt-foot pk-bleed"><div class="pt-foot-art" aria-hidden="true"><svg viewBox="0 0 1200 90" preserveAspectRatio="none"><path d="M0 90V50C80 20 140 70 230 40S380 10 470 44 640 70 740 36 920 10 1010 44 1130 60 1200 30V90Z" fill="currentColor"/></svg></div>
  <div class="pt-wrap pt-foot-grid"><div><div class="pt-foot-logo">${bloomLogo}<b>Pétale</b></div><p class="pt-foot-lead">Des fleurs de saison, composées à la main et livrées avec soin.</p><address>8 rue des Tilleuls<br>69003 Lyon<br><a href="mailto:bonjour@petale.example">bonjour@petale.example</a></address></div>
  <div><h3>L'atelier</h3>${nav(c.menu.slice(1, 5), "pt-fl")}</div><div><h3>Infos</h3><a class="pt-fl" href="/contact">Contact</a><a class="pt-fl" href="/recherche">Recherche</a><p class="pt-hours">Boutique : mardi–samedi, 9 h–19 h<br>Livraisons : du mardi au samedi</p></div></div>
  <p class="pt-legal">© Pétale — site de démonstration. Boutique, bouquets, prix et adresses fictifs ; aucun paiement ni commande n'est enregistré.</p></footer>`;

const pagehead = (kicker, title, sub, art = "") => sec(`<section class="pt-ph pk-bleed"><div class="pt-wrap pt-ph-in"><div><p class="pt-kicker" data-reveal>${esc(kicker)}</p><div class="pt-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="pt-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${art ? `<div class="pt-ph-art" aria-hidden="true">${art}</div>` : ""}</div></section>`);

const sprig = (n = 1) => `<svg viewBox="0 0 260 220" aria-hidden="true">${euc(110, 214, 160, -18, SEASON_LEAF, "pt-s2")}${euc(150, 214, 140, 26, SEASON_LEAF, "pt-s1")}${peony(132, 76, 46, 'class="pt-c1"', 'class="pt-c2"', 'class="pt-c3"', "pt-d1", 10)}${n > 1 ? `${rose(64, 108, 22, 'class="pt-c2"', "pt-d3")}${daisy(204, 100, 18, F("#fff"), 'class="pt-c3"', "pt-d4")}` : ""}</svg>`;

/* ---------- Accueil ---------- */
const SEASONLIST = {
  printemps: ["Pivoines|#f47c6d", "Tulipes|#ffb79a", "Lilas|#b8a1e6", "Renoncules|#ffd9c9"],
  ete: ["Dahlias|#ff9a3c", "Marguerites|#ffd166", "Pois de senteur|#ff6f91", "Tournesols|#f6c453"],
  automne: ["Dahlias rouille|#d9573a", "Chrysanthèmes|#f0a25a", "Hortensias séchés|#8e3b5a", "Feuillage doré|#c9b36a"],
  hiver: ["Hellébores|#8e7cd8", "Amaryllis|#c7bdf2", "Eucalyptus argenté|#7fb3ab", "Branches de coton|#d9d4f2"],
};
const seasonBlock = () => `<section class="pt-now pk-bleed"><div class="pt-wrap pt-now-in"><div><p class="pt-kicker" data-reveal>Dans les seaux en ce moment</p><h2 class="pt-h2" data-reveal>Ce qui fleurit <em><span class="pt-st" data-s="printemps">au printemps</span><span class="pt-st" data-s="ete">en été</span><span class="pt-st" data-s="automne">en automne</span><span class="pt-st" data-s="hiver">en hiver</span></em></h2><p class="pt-sub" data-reveal>Changez de saison avec les onglets en haut de page : les couleurs, les fleurs et les bouquets mis en avant suivent.</p></div>
  <div class="pt-nowlists" data-reveal>${SEASONS.map(([k]) => `<ul class="pt-nowlist" data-s="${k}">${SEASONLIST[k].map((s) => { const [n, col] = s.split("|"); return `<li><svg viewBox="0 0 40 40" aria-hidden="true"><g transform="translate(20 20)">${ring(5, 17, 8, F(col), 0, 0.92)}<circle r="3.4" fill="#fff" opacity=".7"/></g></svg><b>${n}</b></li>`; }).join("")}</ul>`).join("")}</div></div></section>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="pt-hero pk-bleed"><div class="pt-wrap pt-hero-in">
    <div class="pt-hero-copy"><p class="pt-kicker" data-reveal>Atelier fleuriste · Lyon 3<sup>e</sup></p>
      <div class="pt-mega" role="heading" aria-level="1" data-reveal>Des fleurs qui <em>s'épanouissent</em> chez vous.</div>
      <p class="pt-lead" data-reveal>Pivoines, tulipes, eucalyptus : nous composons à la main des bouquets de saison, livrés le matin, l'après-midi ou le soir, à la date que vous choisissez.</p>
      <div class="pt-actions" data-reveal><a class="pt-btn pt-btn--lg" href="/composer">Composer mon bouquet ${arrow}</a><a class="pt-btn pt-btn--line pt-btn--lg" href="/bouquets">Voir les bouquets</a></div>
      <ul class="pt-chips" data-reveal><li>Fleurs de saison</li><li>Livraison par créneau</li><li>Composé à la main</li></ul></div>
    <div class="pt-hero-art" aria-hidden="false"><div class="pt-hero-blob"></div>${heroArt()}</div></div></section>`),
  sec(seasonBlock()),
  sec(`<section class="pt-sec pt-sec--wash pk-bleed"><div class="pt-wrap"><div class="pt-sechead"><div><p class="pt-kicker" data-reveal>La vitrine</p><h2 class="pt-h2" data-reveal>Les bouquets de l'atelier</h2></div><a class="pt-more" href="/bouquets" data-reveal>Tous les bouquets ${arrow}</a></div>
    <div class="pt-masonry">${[0, 1, 2, 3, 4, 5].map((i) => card(BQ[i], i)).join("")}</div></div></section>`),
  sec(`<section class="pt-sec pt-comp-teaser pk-bleed"><div class="pt-wrap pt-tz"><div><p class="pt-kicker" data-reveal>Le composeur</p><h2 class="pt-h2" data-reveal>Dessinez votre bouquet, <em>tige par tige</em>.</h2><p class="pt-sub" data-reveal>Choisissez un style, comptez vos pivoines, ajoutez du feuillage, posez-le dans un vase : le dessin se refait sous vos yeux. Puis réservez un créneau de livraison.</p><a class="pt-btn pt-btn--lg" href="/composer" data-reveal>Ouvrir le composeur ${arrow}</a></div>
    <ol class="pt-tz-steps" data-reveal><li><b>1</b><span>Le style</span></li><li><b>2</b><span>Les fleurs</span></li><li><b>3</b><span>Le feuillage</span></li><li><b>4</b><span>Le vase</span></li><li><b>5</b><span>Le créneau</span></li></ol></div></section>`),
  sec(`<section class="pt-sec pk-bleed"><div class="pt-wrap pt-duo">
    <article class="pt-big pt-big--a" data-reveal><div class="pt-big-art" aria-hidden="true"><svg viewBox="0 0 300 200">${peony(90, 110, 52, F("#f7a3b5"), F("#fcc8d2"), F("#fde4e8"), "pt-d1")}${rose(170, 88, 30, F("#ffb39e"), "pt-d2")}${daisy(220, 130, 24, F("#fff"), F("#f6c453"), "pt-d3")}${euc(250, 200, 120, 24, LEAFG)}${euc(40, 200, 110, -26, LEAFS)}</svg></div><h3>Mariages et événements</h3><p>Arche, bouquet de mariée, tables, vitrines d'entreprise : un devis sur mesure autour de votre palette.</p><a class="pt-btn pt-btn--line" href="/mariages">Découvrir ${arrow}</a></article>
    <article class="pt-big pt-big--b" data-reveal><div class="pt-big-art" aria-hidden="true"><svg viewBox="0 0 300 200">${tulip(80, 70, 0.9, F("#ff8a73"), 120, TULEAF2, "pt-d1")}${tulip(130, 60, 0.9, F("#ffb59c"), 130, TULEAF2, "pt-d2")}${tulip(180, 72, 0.9, F("#cdb8f3"), 118, TULEAF2, "pt-d3")}${lilac(235, 160, 1.4, F("#b8a1e6"), 10)}</svg></div><h3>Abonnements floraux</h3><p>Un bouquet frais chaque semaine ou chaque mois, selon la saison. À la maison comme au bureau.</p><a class="pt-btn pt-btn--line" href="/abonnements">Voir les formules ${arrow}</a></article></div></section>`),
  sec(`<section class="pt-sec pt-sec--wash pk-bleed"><div class="pt-wrap pt-promises"><article data-reveal><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42V22M24 22C14 22 10 14 10 6c8 0 14 4 14 16 0-12 6-16 14-16 0 8-4 16-14 16z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><h3>Fleurs de saison</h3><p>Nous travaillons ce qui pousse, quand cela pousse : moins de kilomètres, plus de parfum.</p></article>
    <article data-reveal><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="10" width="32" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8 20h32M17 6v8M31 6v8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><h3>Un créneau, pas une fenêtre de six heures</h3><p>Matin, après-midi ou soir : vous choisissez le jour et le moment de la remise.</p></article>
    <article data-reveal><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 34c6 8 22 8 28 0M14 28c2-10 18-10 20 0M24 8v10M18 12l6-4 6 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><h3>Composé à la main</h3><p>Chaque bouquet est monté à l'atelier le jour même, puis emballé sans plastique.</p></article></div></section>`),
  sec(footer(c)),
];

/* ---------- Bouquets ---------- */
const bouquets = (c) => [sec(header(c)),
  pagehead("La vitrine", "Les bouquets <em>de l'atelier</em>", "Dix compositions dessinées à l'atelier. Filtrez par occasion, puis partez de l'une d'elles dans le composeur.", sprig(2)),
  sec(`<section class="pt-sec pk-bleed"><div class="pt-wrap"><div class="pt-filters" data-filters role="tablist" aria-label="Filtrer par occasion"><a href="#tous" class="is-on" role="tab" aria-selected="true" data-f="all">Tous</a><a href="#amour" role="tab" aria-selected="false" data-f="amour">Amour</a><a href="#anniversaire" role="tab" aria-selected="false" data-f="anniversaire">Anniversaire</a><a href="#naissance" role="tab" aria-selected="false" data-f="naissance">Naissance</a><a href="#remerciement" role="tab" aria-selected="false" data-f="remerciement">Merci</a><a href="#interieur" role="tab" aria-selected="false" data-f="interieur">Pour la maison</a></div>
    <div class="pt-masonry" data-grid>${BQ.map((b, i) => card(b, i)).join("")}</div>
    <p class="pt-note">Prix indicatifs en euros, selon la saison et la taille. Rien n'est commandé ici : la demande finale passe par le formulaire de contact.</p></div></section>`),
  sec(`<section class="pt-cta pk-bleed"><div class="pt-wrap pt-cta-in"><h2 class="pt-h2" data-reveal>Aucun ne vous ressemble tout à fait ?</h2><a class="pt-btn pt-btn--lg pt-btn--inv" href="/composer" data-reveal>Composer le mien ${arrow}</a></div></section>`),
  sec(footer(c))];

/* ---------- Composeur ---------- */
const STYLES = [
  ["champetre", "Champêtre", "Libre et aérien, comme cueilli au jardin", '<circle cx="8" cy="22" r="5"/><circle cx="24" cy="8" r="6"/><circle cx="34" cy="26" r="4.5"/><circle cx="18" cy="30" r="3.5"/>'],
  ["romantique", "Romantique", "Dense et rond, un dôme de pétales", '<circle cx="20" cy="22" r="8"/><circle cx="9" cy="26" r="6"/><circle cx="31" cy="26" r="6"/><circle cx="20" cy="9" r="6"/>'],
  ["moderne", "Moderne", "Une ligne, du vide, un geste", '<circle cx="9" cy="32" r="3.5"/><circle cx="18" cy="23" r="5"/><circle cx="28" cy="14" r="6.5"/><circle cx="35" cy="6" r="3"/>'],
  ["rond", "Rond serré", "Un bouquet de poche, compact", '<circle cx="20" cy="20" r="6"/><circle cx="20" cy="7" r="4.5"/><circle cx="31" cy="26" r="4.5"/><circle cx="9" cy="26" r="4.5"/>'],
];
const FLOWERS = [["pivoine", "Pivoine", 4.5, "#f47c6d"], ["tulipe", "Tulipe", 2.2, "#ff8a73"], ["rose", "Rose de jardin", 3.5, "#ffb39e"], ["lilas", "Lilas", 3, "#b8a1e6"], ["marguerite", "Marguerite", 1.6, "#ffd166"]];
const FOLIAGE = [["euc", "Eucalyptus", 3.5], ["fougere", "Fougère", 3], ["olivier", "Olivier", 4], ["aucun", "Sans feuillage", 0]];
const VASESL = [["verre", "Vase en verre", 14, "Transparent, à poser"], ["gres", "Pot en grès", 18, "Terre cuite émaillée"], ["cruche", "Cruche bleue", 22, "Émail bleu, anse"], ["papier", "Papier kraft", 0, "Emballage sans plastique"]];
const fr = (n) => String(n).replace(".", ",");
const composer = (c) => [sec(header(c)),
  pagehead("Le composeur", "Composez <em>votre bouquet</em>", "Cinq choix, un dessin qui se refait à chaque geste, et un récapitulatif à nous envoyer. Total indicatif : rien n'est payé ici.", sprig(1)),
  sec(`<section class="pt-comp pk-bleed" data-comp><div class="pt-wrap pt-comp-in">
  <p class="pt-nojs">Le composeur a besoin de JavaScript pour dessiner le bouquet. Vous pouvez aussi nous écrire directement via la page <a href="/contact">contact</a>.</p>
  <div class="pt-steps">
    <article class="pt-step"><h2 class="pt-h3"><span class="pt-n">1</span>Le style</h2><div class="pt-opts pt-opts--4" role="radiogroup" aria-label="Style du bouquet">${STYLES.map(([k, l, d, ic], i) => `<a class="pt-opt${i ? "" : " is-on"}" href="#${k}" role="radio" aria-checked="${i ? "false" : "true"}" data-style="${k}"><svg viewBox="0 0 42 40" aria-hidden="true">${ic}</svg><b>${l}</b><small>${d}</small></a>`).join("")}</div></article>
    <article class="pt-step"><h2 class="pt-h3"><span class="pt-n">2</span>Les fleurs <small>30 tiges au plus</small></h2><div class="pt-rows">${FLOWERS.map(([k, l, p, col], i) => `<div class="pt-row" data-fl="${k}" data-pr="${p}"><span class="pt-dot"><svg viewBox="0 0 40 40" aria-hidden="true"><g transform="translate(20 20)">${ring(5, 18, 8.5, F(col), 0, 0.95)}<circle r="3.4" fill="#fff" opacity=".75"/></g></svg></span><div class="pt-row-t"><b>${l}</b><small>${fr(p.toFixed(2))} € la tige</small></div><div class="pt-qty"><a href="#moins" role="button" data-d="-1" aria-label="Retirer : ${l}">−</a><span class="pt-q" role="status" aria-label="Quantité de ${l}">${[3, 2, 0, 1, 0][i]}</span><a href="#plus" role="button" data-d="1" aria-label="Ajouter : ${l}">+</a></div></div>`).join("")}</div></article>
    <article class="pt-step"><h2 class="pt-h3"><span class="pt-n">3</span>Le feuillage</h2><div class="pt-opts pt-opts--4 pt-opts--s" role="radiogroup" aria-label="Feuillage" data-g="lf">${FOLIAGE.map(([k, l, p], i) => `<a class="pt-opt${i ? "" : " is-on"}" href="#${k}" role="radio" aria-checked="${i ? "false" : "true"}" data-lf="${k}" data-pr="${p}" data-lbl="${l}"><b>${l}</b><small>${p ? `+ ${fr(p.toFixed(2))} €` : "—"}</small></a>`).join("")}</div></article>
    <article class="pt-step"><h2 class="pt-h3"><span class="pt-n">4</span>Le vase</h2><div class="pt-opts pt-opts--4 pt-opts--s" role="radiogroup" aria-label="Vase ou emballage" data-g="v">${VASESL.map(([k, l, p, d], i) => `<a class="pt-opt${i ? "" : " is-on"}" href="#${k}" role="radio" aria-checked="${i ? "false" : "true"}" data-v="${k}" data-pr="${p}" data-lbl="${l}"><b>${l}</b><small>${d}${p ? ` · + ${p} €` : " · inclus"}</small></a>`).join("")}</div></article>
    <article class="pt-step"><h2 class="pt-h3"><span class="pt-n">5</span>La livraison <small>du mardi au samedi</small></h2>
      <div class="pt-cal" data-cal aria-label="Calendrier de livraison"></div>
      <div class="pt-slots" role="radiogroup" aria-label="Créneau de livraison"><a class="pt-slot" href="#matin" role="radio" aria-checked="false" data-slot="matin" data-fee="0" data-lbl="le matin (9 h–12 h)"><b>Matin</b><small>9 h – 12 h</small></a><a class="pt-slot" href="#apres-midi" role="radio" aria-checked="false" data-slot="apres-midi" data-fee="0" data-lbl="l'après-midi (14 h–17 h)"><b>Après-midi</b><small>14 h – 17 h</small></a><a class="pt-slot" href="#soir" role="radio" aria-checked="false" data-slot="soir" data-fee="4" data-lbl="le soir (18 h–20 h)"><b>Soir</b><small>18 h – 20 h · + 4 €</small></a></div></article>
    <a class="pt-btn pt-btn--block pt-step-send" href="/contact" data-send>Envoyer ma demande</a>
  </div>
  <aside class="pt-recap" aria-label="Aperçu et récapitulatif"><div class="pt-prev" data-art><svg viewBox="0 0 320 380" role="img" aria-label="Aperçu du bouquet"><circle cx="160" cy="170" r="132" fill="#ffe0d6" opacity=".5"/><path d="M118 262H202C214 262 220 302 214 332C210 354 196 362 160 362C124 362 110 354 106 332C100 302 106 262 118 262Z" fill="#dff1f7" stroke="#8fbdd0" stroke-width="2"/></svg></div>
    <ul class="pt-lines" data-recap></ul><p class="pt-total"><span>Total indicatif</span><b data-total aria-live="polite">—</b></p>
    <a class="pt-btn pt-btn--block" href="/contact" data-send>Envoyer ma demande ${arrow}</a><a class="pt-link pt-copy" href="#copier" role="button" data-copy>Copier le récapitulatif</a>
    <p class="pt-fine" data-msg role="status">Total indicatif, à confirmer par la fleuriste : aucun paiement ici. Le récapitulatif sera repris dans le formulaire de contact.</p></aside></div></section>`),
  sec(`<section class="pt-sec pt-sec--wash pk-bleed"><div class="pt-wrap pt-faq"><h2 class="pt-h2" data-reveal>Bon à savoir</h2><div>
    <details data-reveal><summary>Combien de tiges pour quelle taille ?</summary><p>Comptez 8 à 12 tiges pour un petit bouquet, 15 à 20 pour un bouquet généreux. Le dessin vous donne une idée du volume.</p></details>
    <details data-reveal><summary>Les fleurs sont-elles toujours disponibles ?</summary><p>Elles dépendent de la saison. Si une variété manque, la fleuriste vous propose un remplacement de même teinte.</p></details>
    <details data-reveal><summary>Où livrez-vous ?</summary><p>Lyon et proche couronne, du mardi au samedi. Le tarif de livraison de démonstration est de 7 €.</p></details></div></div></section>`),
  sec(footer(c))];

/* ---------- Mariages et événements ---------- */
const arch = () => `<svg viewBox="0 0 360 400" aria-hidden="true"><path d="M60 400V170C60 90 112 40 180 40s120 50 120 130v230" fill="none" stroke="#d9c9f5" stroke-width="3"/>${euc(70, 400, 230, 6, SEASON_LEAF, "pt-s1")}${euc(290, 400, 250, -8, SEASON_LEAF, "pt-s2")}${euc(180, 52, 120, -80, SEASON_LEAF, "pt-s3")}${euc(180, 52, 120, 80, SEASON_LEAF, "pt-s1")}${peony(180, 56, 46, 'class="pt-c1"', 'class="pt-c2"', 'class="pt-c3"', "pt-d1")}${peony(86, 150, 40, 'class="pt-c2"', 'class="pt-c3"', 'class="pt-c1"', "pt-d2")}${peony(276, 136, 42, 'class="pt-c3"', 'class="pt-c1"', 'class="pt-c2"', "pt-d3")}${rose(120, 70, 24, 'class="pt-c2"', "pt-d4")}${rose(242, 76, 24, 'class="pt-c1"', "pt-d5")}${daisy(70, 250, 20, F("#fff"), 'class="pt-c2"', "pt-d6")}${daisy(292, 240, 20, F("#fff"), 'class="pt-c3"', "pt-d6")}${lilac(60, 330, 1.2, 'class="pt-c4"', -8)}${lilac(300, 330, 1.2, 'class="pt-c4"', 8)}</svg>`;
const PALETTES = [["Poudre & pivoine", ["#fcc8d2", "#f7a3b5", "#fff", "#b4d8bf"], "Romantique, très lumineuse"], ["Corail & pêche", ["#ff8a73", "#ffb59c", "#ffe0d2", "#7db38f"], "Chaleureuse, d'été"], ["Lilas & argent", ["#b6a4ea", "#d7ccf5", "#eef1f6", "#9cc3bd"], "Fraîche, un peu rêveuse"], ["Rouille & ocre", ["#d9573a", "#f0a25a", "#f6d3a8", "#8fa05b"], "Automnale, solaire"]];
const mariages = (c) => [sec(header(c)),
  sec(`<section class="pt-wed pk-bleed"><div class="pt-wrap pt-wed-in"><div class="pt-wed-copy"><p class="pt-kicker" data-reveal>Mariages et événements</p><div class="pt-h1 pt-h1--l" role="heading" aria-level="1" data-reveal>Le plus beau jour, <em>en fleurs</em>.</div><p class="pt-lead" data-reveal>Bouquet de mariée, arche, centres de table, cérémonie laïque, baptême, soirée d'entreprise : nous dessinons avec vous une palette, puis nous la faisons fleurir le jour J.</p><div class="pt-actions" data-reveal><a class="pt-btn pt-btn--lg" href="/contact">Demander un devis ${arrow}</a><a class="pt-btn pt-btn--line pt-btn--lg" href="#formules" data-jump>Voir les formules</a></div></div>
    <div class="pt-wed-art" aria-hidden="true"><div class="pt-hero-blob pt-hero-blob--b"></div>${arch()}</div></div></section>`),
  sec(`<section class="pt-sec pt-sec--wash pk-bleed"><div class="pt-wrap"><p class="pt-kicker" data-reveal>Vos palettes</p><h2 class="pt-h2" data-reveal>Quatre ambiances pour commencer</h2><div class="pt-pal">${PALETTES.map(([n, cols, d]) => `<article class="pt-pal-c" data-reveal><svg class="pt-sw" viewBox="0 0 160 40" aria-hidden="true">${cols.map((k, i) => `<circle cx="${20 + i * 40}" cy="20" r="18" fill="${k}" stroke="#e8dce0" stroke-width="1.5"/>`).join("")}</svg><h3>${n}</h3><p>${d}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="pt-sec pk-bleed" data-anchor="formules"><div class="pt-wrap"><p class="pt-kicker" data-reveal>Les formules</p><h2 class="pt-h2" data-reveal>Trois façons de fleurir la fête</h2>
    <table class="pt-table" data-reveal><caption class="pt-sr">Comparatif des formules mariage et événement (tarifs indicatifs de démonstration)</caption><thead><tr><th scope="col">Formule</th><th scope="col">Cérémonie</th><th scope="col">Réception</th><th scope="col">Grand jour</th></tr></thead><tbody>
    <tr><th scope="row">Bouquet de mariée et boutonnière</th><td data-l="Cérémonie">Oui</td><td data-l="Réception">Oui</td><td data-l="Grand jour">Oui</td></tr>
    <tr><th scope="row">Arche ou décor d'autel</th><td data-l="Cérémonie">Petite</td><td data-l="Réception">—</td><td data-l="Grand jour">Grande arche</td></tr>
    <tr><th scope="row">Centres de table</th><td data-l="Cérémonie">—</td><td data-l="Réception">Jusqu'à 10</td><td data-l="Grand jour">Jusqu'à 20</td></tr>
    <tr><th scope="row">Bouquets d'accueil</th><td data-l="Cérémonie">2</td><td data-l="Réception">4</td><td data-l="Grand jour">8</td></tr>
    <tr><th scope="row">Installation sur place</th><td data-l="Cérémonie">Oui</td><td data-l="Réception">Oui</td><td data-l="Grand jour">Oui + dépose</td></tr>
    <tr class="pt-tr-p"><th scope="row">À partir de (indicatif)</th><td data-l="Cérémonie"><b>650 €</b></td><td data-l="Réception"><b>1 200 €</b></td><td data-l="Grand jour"><b>2 400 €</b></td></tr></tbody></table></div></section>`),
  sec(`<section class="pt-sec pt-sec--wash pk-bleed"><div class="pt-wrap pt-proc"><div><p class="pt-kicker" data-reveal>Le déroulé</p><h2 class="pt-h2" data-reveal>De la première idée au dernier pétale</h2></div>
    <ol class="pt-tl"><li data-reveal><span class="pt-tl-n">1</span><div><h3>Rencontre</h3><p>Nous parlons lieu, saison, couleurs, budget. Venez avec des inspirations, même floues.</p></div></li><li data-reveal><span class="pt-tl-n">2</span><div><h3>Palette et devis</h3><p>Un nuancier dessiné, une liste de fleurs de saison et un devis détaillé.</p></div></li><li data-reveal><span class="pt-tl-n">3</span><div><h3>Essai</h3><p>Nous montons un bouquet test, pour ajuster les formes et les teintes.</p></div></li><li data-reveal><span class="pt-tl-n">4</span><div><h3>Le jour J</h3><p>Livraison, installation, retouches : tout est prêt avant l'arrivée des invités.</p></div></li></ol></div></section>`),
  sec(`<section class="pt-cta pk-bleed"><div class="pt-wrap pt-cta-in"><h2 class="pt-h2" data-reveal>Parlez-nous de votre date.</h2><a class="pt-btn pt-btn--lg pt-btn--inv" href="/contact" data-reveal>Écrire à l'atelier ${arrow}</a></div></section>`),
  sec(footer(c))];

/* ---------- Abonnements ---------- */
const PLANS = [
  ["Petit jardin", "Pour un bureau ou une table de chevet", [18, 34, 62], ["8 à 10 tiges de saison", "Papier kraft ou vase fourni", "Livraison le jour de votre choix"]],
  ["Grand jardin", "Notre formule la plus choisie", [32, 60, 112], ["15 à 20 tiges de saison", "Feuillage et fleur vedette", "Vase prêté et repris", "Changement de créneau gratuit"], 1],
  ["Maison & bureau", "Accueil, comptoir, salle d'attente", [48, 92, 170], ["2 compositions par livraison", "Palette à vos couleurs", "Entretien des vases", "Facture mensuelle unique"]],
];
const FREQS = [["hebdo", "Chaque semaine", 0], ["bimensuel", "Toutes les 2 semaines", 1], ["mensuel", "Chaque mois", 2]];
const abonnements = (c) => [sec(header(c)),
  pagehead("Abonnements floraux", "Un bouquet frais, <em>sans y penser</em>", "Choisissez une formule et un rythme ; nous composons selon la saison. Tarifs indicatifs de démonstration, aucun prélèvement n'est mis en place ici.", sprig(2)),
  sec(`<section class="pt-sec pk-bleed" data-plans><div class="pt-wrap"><div class="pt-freq" data-freqs role="tablist" aria-label="Rythme de livraison">${FREQS.map(([k, l], i) => `<a href="#${k}" role="tab" aria-selected="${i ? "false" : "true"}" class="pt-fq${i ? "" : " is-on"}" data-q="${i}">${l}</a>`).join("")}</div>
    <div class="pt-plans">${PLANS.map(([n, d, pr, li, hot]) => `<article class="pt-plan${hot ? " pt-plan--hot" : ""}" data-reveal>${hot ? '<span class="pt-flag">La plus choisie</span>' : ""}<h3>${n}</h3><p class="pt-plan-d">${d}</p><p class="pt-price"><b data-pr data-v="${pr.join(",")}">${pr[0]}</b> €<small>/ livraison</small></p><ul>${li.map((x) => `<li>${x}</li>`).join("")}</ul><a class="pt-btn ${hot ? "" : "pt-btn--line "}pt-btn--block" href="/contact">Demander cette formule</a></article>`).join("")}</div>
    <p class="pt-note">Prix par livraison, indicatifs. La mise en place se fait par échange avec l'atelier via la page contact.</p></div></section>`),
  sec(`<section class="pt-sec pt-sec--wash pk-bleed"><div class="pt-wrap pt-how"><h2 class="pt-h2" data-reveal>Comment ça fleurit</h2><div class="pt-how-g">
    <article data-reveal><b>01</b><h3>Vous choisissez</h3><p>Formule, rythme, jour et créneau de remise.</p></article><article data-reveal><b>02</b><h3>Nous composons</h3><p>Selon ce qui fleurit : pivoines au printemps, dahlias à la rentrée, hellébores l'hiver.</p></article><article data-reveal><b>03</b><h3>Nous livrons</h3><p>Le matin, l'après-midi ou le soir, vase prêté et repris si besoin.</p></article><article data-reveal><b>04</b><h3>Vous ajustez</h3><p>Pause, changement de couleur ou de rythme : un simple message suffit.</p></article></div></div></section>`),
  sec(`<section class="pt-sec pk-bleed"><div class="pt-wrap pt-faq"><h2 class="pt-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Puis-je mettre mon abonnement en pause ?</summary><p>Oui, avant le mardi qui précède la livraison. Les modalités exactes sont définies avec l'atelier.</p></details>
    <details data-reveal><summary>Quelles fleurs vais-je recevoir ?</summary><p>Celles de la saison, dans la palette que vous avez choisie. La surprise est toujours fraîche.</p></details>
    <details data-reveal><summary>Peut-on offrir un abonnement ?</summary><p>Oui : indiquez le nom et l'adresse de la personne dans le formulaire de contact, avec un petit mot.</p></details></div></div></section>`),
  sec(footer(c))];

/* ---------- Contact, recherche, introuvable ---------- */
const contact = (c) => [sec(header(c)), pagehead("Écrivez-nous", "Parlons <em>fleurs</em>", "Un bouquet sur mesure, un mariage, un abonnement ou une simple question : l'atelier répond sous deux jours ouvrés.", sprig(1)),
  sec(`<section class="pt-sec pk-bleed pt-info"><div class="pt-wrap pt-info-in"><article><h3>L'atelier</h3><address>8 rue des Tilleuls<br>69003 Lyon</address></article><article><h3>Horaires</h3><p>Mardi au samedi, 9 h – 19 h.<br>Livraisons : mardi au samedi.</p></article><article><h3>Écrire</h3><p><a href="mailto:bonjour@petale.example">bonjour@petale.example</a><br>Si vous venez du composeur, votre récapitulatif est déjà dans le message.</p></article></div></section>`),
  { type: "form", heading: "Votre message", intro: "Dites-nous ce dont vous rêvez : date, occasion, couleurs, budget approximatif. Nous revenons vers vous avec une proposition." },
  sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une fleur, <em>un bouquet</em> ?", "Bouquets, mariages, abonnements, conseils d'entretien.", sprig(1)),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher : pivoine, mariage, abonnement…" } }] },
  sec(`<section class="pt-sec pk-bleed"><div class="pt-wrap pt-sugg"><p class="pt-kicker">Pistes</p><div class="pt-chips2"><a href="/bouquets">Les bouquets</a><a href="/composer">Composer</a><a href="/mariages">Mariages</a><a href="/abonnements">Abonnements</a><a href="/contact">Contact</a></div></div></section>`),
  sec(footer(c))];
const introuvable = (c) => [sec(header(c)),
  sec(`<section class="pt-404 pk-bleed"><div class="pt-wrap pt-404-in"><svg viewBox="0 0 220 300" aria-hidden="true"><path d="M110 296C112 220 100 170 76 126" fill="none" stroke="#5f9473" stroke-width="4" stroke-linecap="round"/><path d="M110 270C80 250 50 252 36 276C66 284 92 282 110 270Z" fill="#7db38f" opacity=".85"/><g transform="translate(76 126) rotate(-62)"><path d="M-22 6C-30 -30 -14 -58 0 -64C14 -58 30 -30 22 6C14 16 -14 16 -22 6Z" fill="#f27c6b"/><path d="M-22 6C-30 -30 -14 -58 -3 -62C-8 -34 -6 -8 4 14C-10 16 -18 12 -22 6Z" fill="#fff" opacity=".3"/></g><path d="M178 210c8 10 8 26-2 34-8-8-8-24 2-34z" fill="#f27c6b" opacity=".8"/><path d="M40 90c8 10 8 26-2 34-8-8-8-24 2-34z" fill="#f27c6b" opacity=".6"/></svg>
    <div><p class="pt-kicker">Erreur 404</p><div class="pt-h1" role="heading" aria-level="1">Cette page <em>a fané</em>.</div><p class="pt-sub">Elle n'existe pas ou a changé d'adresse. Remettons-la dans l'eau fraîche en retournant à l'accueil.</p><div class="pt-actions"><a class="pt-btn pt-btn--lg" href="/">Retour à l'accueil ${arrow}</a><a class="pt-btn pt-btn--line pt-btn--lg" href="/bouquets">Voir les bouquets</a></div></div></div></section>`),
  sec(footer(c))];

module.exports = {
  key: "petale", name: "Pétale", version: "2.0.0", category: "nature", tags: ["naturel", "chaleureux", "ludique"], siteType: "Fleuriste", featured: true,
  concept: "Une aquarelle fraîche sur blanc pur : des fleurs dessinées qui s'épanouissent, quatre onglets de saison qui recolorent le site et un composeur qui redessine le bouquet en direct.",
  description: "Fleuriste : fleurs dessinées en SVG (pivoines, tulipes, eucalyptus), onglets de saison qui changent l'ambiance, bouquets en masonry, composeur de bouquet avec vase et créneau de livraison, mariages, abonnements.",
  brand: "Pétale — atelier fleuriste", modules: ["formulaires", "recherche"],
  dna: {
    header: "onglets-de-saison-en-classeur-qui-recolorent-tout-le-site",
    hero: "composition-florale-aquarelle-qui-s-epanouit",
    grid: "masonry-de-cartes-bouquets-a-hauteurs-variees",
    motion: "fleurs-qui-eclosent-feuillage-qui-se-balance-et-petales-qui-tombent",
    shapes: "coins-en-feuille-lavis-translucides-et-blobs-organiques",
    rhythm: "bandes-de-lavis-saisonnieres-et-grandes-respirations-blanches",
    signature: "composeur-de-bouquet-dessine-en-direct-et-creneau-de-livraison",
  },
  tokens: {
    colors: { primary: "#c9402f", secondary: "#2b2233", accent: "#b8a1e6", background: "#ffffff", surface: "#fff7f6", text: "#2b2233", muted: "#6a5f70", success: "#2e7d4f", warning: "#8a5a00", error: "#c62828" },
    fonts: { heading: "font.dm-serif-display", body: "font.lexend", button: "font.lexend", link: "font.lexend" },
    radius: { sm: 8, md: 16, lg: 34, button: 28, field: 14, card: 34 }, shadow: { card: "0 18px 40px -22px rgba(120,70,90,.35)", button: "none" }, border: { width: 1, color: "#f0d9d6" },
    type: { h1: { size: 72, weight: 400, lineHeight: 1.02 }, h2: { size: 46, weight: 400, lineHeight: 1.08 } },
  },
  options: [
    { key: "season", label: "Saison au départ", type: "choice", default: "auto", choices: [["auto", "Selon la date du jour"], ["printemps", "Printemps"], ["ete", "Été"], ["automne", "Automne"], ["hiver", "Hiver"]] },
    { key: "accent", label: "Corail du printemps", type: "color", default: "#c9402f" },
    { key: "ink", label: "Encre (textes et pied de page)", type: "color", default: "#2b2233" },
    { key: "wash", label: "Lavis décoratifs", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "petals", label: "Pétales qui tombent", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Bouquets", "/bouquets"], ["Composer", "/composer"], ["Mariages et événements", "/mariages"], ["Abonnements", "/abonnements"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "bouquets", name: "Bouquets", render: bouquets }, { key: "composer", name: "Composer", render: composer },
    { key: "mariages", name: "Mariages et événements", render: mariages }, { key: "abonnements", name: "Abonnements", render: abonnements }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
