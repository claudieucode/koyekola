// Cimaise — galerie d'art contemporain fictive. Direction artistique : salle blanche. Murs blanc cassé, noir d'encre, un seul accent vert-de-gris ; titres Spectral légers, cartels de musée,
// accrochage mural en hero, index latéral numéroté des salles, parcours d'exposition (plan interactif, clavier) et fiche d'œuvre en panneau avec zoom. Œuvres et artistes inventés.
const { sec, esc } = require("../kit");

/* ---------- œuvres : compositions originales dessinées en SVG ---------- */
const rng = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const n = (x) => Math.round(x * 10) / 10;
const ART = {
  mesures(w, h) {
    let s = `<rect width="${w}" height="${h}" fill="#d9d2c3"/><rect width="${n(w * .62)}" height="${h}" fill="#b9ae98"/><rect x="${n(w * .62)}" width="${n(w * .38)}" height="${h}" fill="#8d9a93"/>`;
    let d = ""; for (let x = 8; x < w - 6; x += 7) d += `M${x} ${10 + (x % 3) * 4}V${h - 10 - (x % 5) * 3}`; s += `<path d="${d}" stroke="#2c2c2a" stroke-width=".35" opacity=".55"/>`;
    return s + `<rect x="${n(w * .62 - 4)}" y="${n(h * .58)}" width="8" height="15" fill="#c2543a"/>`;
  },
  archipel(w, h) {
    const r = rng(11), c = ["#2f6f64", "#c2543a", "#1d1d1d", "#d8b24a", "#8b9fa6"]; let s = `<rect width="${w}" height="${h}" fill="#e8e1d2"/><circle cx="${w * .42}" cy="${h * .55}" r="${h * .42}" fill="none" stroke="#1d1d1d" stroke-width=".4" opacity=".5"/>`;
    for (let i = 0; i < 16; i++) s += `<circle cx="${n(8 + r() * (w - 16))}" cy="${n(8 + r() * (h - 16))}" r="${n(2 + r() * 9)}" fill="${c[i % 5]}" opacity="${n(.55 + r() * .4)}"/>`;
    return s;
  },
  lever(w, h) {
    let s = `<rect width="${w}" height="${h}" fill="#f1dcb8"/><path d="M${w * .3} ${h * .62}a${w * .2} ${w * .2} 0 0 1 ${w * .4} 0z" fill="#d4552f"/>`;
    const b = ["#e8c48e", "#2b4a52", "#3d6b73", "#2b4a52", "#1f353b"];
    b.forEach((col, i) => { s += `<rect y="${n(h * (.62 + i * .08))}" width="${w}" height="${n(h * .09)}" fill="${col}"/>`; });
    for (let i = 0; i < 7; i++) s += `<line x1="${n(w * .3 + i * w * .06)}" y1="${n(h * .7)}" x2="${n(w * .3 + i * w * .06 + 6)}" y2="${n(h * .9)}" stroke="#f1dcb8" stroke-width=".5" opacity=".5"/>`;
    return s;
  },
  nocturne(w, h) {
    const r = rng(5); let s = `<rect width="${w}" height="${h}" fill="#ece7dc"/>`;
    let d = ""; for (let i = 0; i < 46; i++) { const y = 6 + i * ((h - 12) / 46); d += `M${Math.round(6 + r() * 8)} ${Math.round(y)}L${Math.round(w - 6 - r() * 8)} ${Math.round(y + 7)}`; } s += `<path d="${d}" stroke="#1b1b1b" stroke-width=".3" opacity=".6"/>`;
    return s + `<rect x="${n(w * .22)}" y="${n(h * .28)}" width="${n(w * .5)}" height="${n(h * .42)}" fill="#151515" opacity=".88"/><rect x="${n(w * .22)}" y="${n(h * .7)}" width="${n(w * .5)}" height="1.4" fill="#2f6f64"/>`;
  },
  fenetres(w, h) {
    const c = ["#f0c36a", "#e0975a", "#1d262b", "#f6dca0", "#1d262b", "#c97b4f"]; let s = `<rect width="${w}" height="${h}" fill="#2e3a40"/>`; const cw = (w - 28) / 2, ch = (h - 40) / 3;
    for (let i = 0; i < 6; i++) { const x = 10 + (i % 2) * (cw + 8), y = 10 + Math.floor(i / 2) * (ch + 10); s += `<rect x="${n(x)}" y="${n(y)}" width="${n(cw)}" height="${n(ch)}" fill="${c[i]}"/><line x1="${n(x + cw / 2)}" y1="${n(y)}" x2="${n(x + cw / 2)}" y2="${n(y + ch)}" stroke="#2e3a40" stroke-width="1.2"/><line x1="${n(x)}" y1="${n(y + ch * .6)}" x2="${n(x + cw)}" y2="${n(y + ch * .6)}" stroke="#2e3a40" stroke-width="1.2"/>`; }
    return s;
  },
  breche(w, h) {
    return `<rect width="${w}" height="${h}" fill="#efebe2"/><polygon points="0,0 ${w * .46},0 ${w * .3},${h} 0,${h}" fill="#1a1a1a"/><polygon points="${w * .46},0 ${w * .62},0 ${w * .5},${h} ${w * .3},${h}" fill="#2f6f64"/><polygon points="${w * .66},0 ${w},0 ${w},${h * .7}" fill="#d9a441"/><line x1="${w * .55}" y1="0" x2="${w * .4}" y2="${h}" stroke="#efebe2" stroke-width=".7"/><line x1="${w * .62}" y1="${h}" x2="${w}" y2="${h * .3}" stroke="#1a1a1a" stroke-width=".5"/>`;
  },
  horizon(w, h) {
    const b = ["#c9d6d6", "#a9bfc2", "#8aa6aa", "#e5d8b8", "#cbb88c", "#6f6a5a"]; let y = 0, s = "";
    b.forEach((c, i) => { const bh = h * [.2, .17, .15, .1, .16, .22][i]; s += `<rect y="${n(y)}" width="${w}" height="${n(bh + 1)}" fill="${c}"/>`; y += bh; });
    return s + `<line x1="0" y1="${n(h * .52)}" x2="${w}" y2="${n(h * .52)}" stroke="#1d1d1d" stroke-width=".5"/><circle cx="${n(w * .78)}" cy="${n(h * .3)}" r="4" fill="#c2543a"/>`;
  },
  veilleuse(w, h) {
    let s = `<rect width="${w}" height="${h}" fill="#14232a"/>`;
    for (let i = 7; i > 0; i--) s += `<circle cx="${w / 2}" cy="${h / 2}" r="${i * 4.6}" fill="none" stroke="#e8d9a8" stroke-width=".7" opacity="${n(.9 - i * .1)}"/>`;
    return s + `<circle cx="${w / 2}" cy="${h / 2}" r="7" fill="#e0a43a"/>`;
  },
  tissage(w, h) {
    const col = ["#b33a2e", "#8e2a22", "#d4624f", "#6e1f1a"], ds = ["", "", "", ""], cw = (w - 12) / 8, ch = (h - 12) / 6;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { const x = n(6 + i * cw), y = n(6 + j * ch); ds[(i * 3 + j) % 4] += (i + j) % 2 ? `M${x} ${y}h${n(cw - 1)}v${n(ch - 1)}h-${n(cw - 1)}z` : `M${n(x + cw * .3)} ${y}h${n(cw * .4)}v${n(ch - 1)}h-${n(cw * .4)}z`; }
    return `<rect width="${w}" height="${h}" fill="#efe3dc"/>` + ds.map((d, k) => `<path d="${d}" fill="${col[k]}"/>`).join("");
  },
  port(w, h) {
    return `<rect width="${w}" height="${h}" fill="#dde5e4"/><circle cx="${w * .75}" cy="${h * .24}" r="${h * .1}" fill="#e3b04a"/><rect y="${h * .62}" width="${w}" height="${h * .38}" fill="#5f8a8a"/><polygon points="${w * .16},${h * .6} ${w * .3},${h * .6} ${w * .23},${h * .3}" fill="#fbfaf6"/><polygon points="${w * .38},${h * .64} ${w * .56},${h * .64} ${w * .47},${h * .22}" fill="#c2543a"/><polygon points="${w * .6},${h * .66} ${w * .72},${h * .66} ${w * .66},${h * .42}" fill="#1d1d1d"/><path d="M${w * .12} ${h * .62}h${w * .24}l-4 6h-${w * .16}z M${w * .34} ${h * .66}h${w * .26}l-4 6h-${w * .18}z" fill="#1f353b" opacity=".85"/><line x1="0" y1="${h * .78}" x2="${w}" y2="${h * .78}" stroke="#dde5e4" stroke-width=".6" opacity=".6"/>`;
  },
  portrait(w, h) {
    return `<rect width="${w}" height="${h}" fill="#cfc6b4"/><rect x="${w * .08}" y="${h * .08}" width="${w * .32}" height="${h * .84}" fill="#b8ad98"/><path d="M${w * .18} ${h}c0-${h * .3} ${w * .12}-${h * .38} ${w * .32}-${h * .38}s${w * .32} ${h * .08} ${w * .32} ${h * .38}z" fill="#2f6f64"/><ellipse cx="${w * .5}" cy="${h * .36}" rx="${w * .17}" ry="${h * .17}" fill="#e0c8a8"/><path d="M${w * .33} ${h * .34}c0-${h * .2} ${w * .34}-${h * .2} ${w * .34} 0c-${w * .1}-${h * .07}-${w * .24}-${h * .07}-${w * .34} 0z" fill="#1f1f1f"/><rect x="${w * .46}" y="${h * .5}" width="${w * .08}" height="${h * .06}" fill="#cdb08c"/>`;
  },
  feuillage(w, h) {
    const r = rng(23), g = ["#5c7a4a", "#8aa66a", "#3f5a3a", "#b7c48a", "#d9a441"]; let s = `<rect width="${w}" height="${h}" fill="#e9ecdf"/>`;
    for (let i = 0; i < 14; i++) { const x = Math.round(r() * w), y = Math.round(r() * h); s += `<ellipse cx="${x}" cy="${y}" rx="${Math.round(4 + r() * 6)}" ry="${Math.round(12 + r() * 14)}" fill="${g[i % 5]}" opacity=".55" transform="rotate(${Math.round(r() * 180)} ${x} ${y})"/>`; }
    return s;
  },
};
const art = (wk, cls = "") => `<svg class="cm-art${cls ? " " + cls : ""}" viewBox="0 0 ${wk.w} ${wk.h}" width="${wk.w}" height="${wk.h}" aria-hidden="true">${ART[wk.id](wk.w, wk.h)}</svg>`;

const ROOMS = [
  [1, "Seuil", "Pour entrer, quelques mesures : des aplats retenus, des lignes fines, une seule tache de couleur qui fait battre la salle.", "Inès Marcellin"],
  [2, "Archipels", "Des îles de couleur posées sur le papier, puis des ports de papier : la mer comme espace de calme et de déplacement.", "Tomas Wyrzykowski"],
  [3, "Lumières", "Le soleil bas, une veilleuse, des fenêtres allumées : trois manières de peindre ce qui éclaire sans se montrer.", "Aya Koffi-Lemaire, Maud Perrenoud"],
  [4, "Nuit à la règle", "L'encre, la règle et la patience. Une nuit construite trait après trait, puis un portrait sans visage.", "Élian Voss"],
  [5, "Brèches", "Les formes se fendent, les feuilles se superposent, les fils se croisent : la dernière salle ouvre le mur.", "Joaquim Sarr, Maud Perrenoud"],
];
const WORKS = [
  { id: "mesures", t: "Mesures du silence", a: "Inès Marcellin", s: "marcellin", y: 2023, tech: "Huile sur toile", kind: "peinture", w: 120, h: 90, room: 1, inv: "CIM-2023-014", txt: "Deux champs de gris-ocre se touchent sans se confondre. Des lignes verticales, tracées à main levée, scandent la surface comme un mètre ruban distendu. Au point de jonction, un petit rectangle rouge fait office de signal : c'est le seul endroit où le regard s'arrête." },
  { id: "horizon", t: "Étude pour un horizon", a: "Inès Marcellin", s: "marcellin", y: 2022, tech: "Huile sur lin", kind: "peinture", w: 160, h: 60, room: 1, inv: "CIM-2022-031", txt: "Six bandes horizontales ramenées à leur plus simple appareil. L'artiste a repeint chaque bande onze fois pour obtenir la transition exacte entre ciel et terre. Un soleil minuscule rappelle que tout cela est un paysage." },
  { id: "archipel", t: "Archipel nº 4", a: "Tomas Wyrzykowski", s: "wyrzykowski", y: 2021, tech: "Gouache sur papier", kind: "papier", w: 76, h: 56, room: 2, inv: "CIM-2021-006", txt: "Seize îles de gouache flottent dans un cercle tracé au crayon, comme une carte dont on aurait perdu la légende. Le papier est laissé nu sur les bords : la couleur n'occupe que le centre." },
  { id: "port", t: "Port de papier", a: "Tomas Wyrzykowski", s: "wyrzykowski", y: 2023, tech: "Collage et gouache", kind: "mixte", w: 100, h: 72, room: 2, inv: "CIM-2023-022", txt: "Trois voiles découpées, une blanche, une rouge, une noire, glissent sur une mer d'aplat. Le collage est assumé : on voit les bords coupés aux ciseaux et la colle qui dépasse." },
  { id: "lever", t: "Lever de sel", a: "Aya Koffi-Lemaire", s: "koffi", y: 2022, tech: "Acrylique sur toile", kind: "peinture", w: 140, h: 100, room: 3, inv: "CIM-2022-009", txt: "Un demi-soleil orange se pose sur des bandes de bleu nuit comme sur des marais salants. Les stries claires dans l'eau ont été réservées au masquage, puis révélées à la dernière couche." },
  { id: "veilleuse", t: "Veilleuse", a: "Aya Koffi-Lemaire", s: "koffi", y: 2024, tech: "Huile sur bois", kind: "peinture", w: 70, h: 70, room: 3, inv: "CIM-2024-003", txt: "Sept cercles concentriques s'éteignent peu à peu autour d'un point chaud. Le format carré, petit, impose de s'approcher : la lumière ne se laisse voir qu'à moins d'un mètre." },
  { id: "fenetres", t: "Deux fenêtres, six lumières", a: "Maud Perrenoud", s: "perrenoud", y: 2019, tech: "Huile sur toile", kind: "peinture", w: 90, h: 110, room: 3, inv: "CIM-2019-018", txt: "Une façade vue de nuit : certaines fenêtres sont allumées, d'autres éteintes, aucune n'a de visage derrière. La peinture épaisse des carreaux contraste avec le fond, presque lavé." },
  { id: "nocturne", t: "Nocturne à la règle", a: "Élian Voss", s: "voss", y: 2020, tech: "Encre sur papier", kind: "papier", w: 56, h: 76, room: 4, inv: "CIM-2020-041", txt: "Quarante-six lignes d'encre tirées à la règle, une par une, puis recouvertes d'un rectangle noir qui ne laisse affleurer que leurs extrémités. Le filet vert-de-gris à la base est le seul trait d'une autre couleur." },
  { id: "portrait", t: "Portrait sans visage", a: "Élian Voss", s: "voss", y: 2023, tech: "Gouache et encre", kind: "mixte", w: 80, h: 100, room: 4, inv: "CIM-2023-027", txt: "Un buste de face, des épaules vertes, des cheveux sombres : le visage est réduit à une ellipse de peau. C'est l'unique figure de l'exposition ; elle regarde la salle suivante." },
  { id: "breche", t: "Brèche", a: "Joaquim Sarr", s: "sarr", y: 2024, tech: "Technique mixte sur toile", kind: "mixte", w: 130, h: 95, room: 5, inv: "CIM-2024-011", txt: "Trois lames, noire, verte et jaune, découpent le tableau en diagonale. Les arêtes nettes ont été obtenues avec du ruban de masquage ; la ligne blanche a été griffée dans la peinture fraîche." },
  { id: "feuillage", t: "Feuillage, 17 h", a: "Joaquim Sarr", s: "sarr", y: 2022, tech: "Aquarelle et gouache", kind: "papier", w: 90, h: 90, room: 5, inv: "CIM-2022-016", txt: "Vingt feuilles translucides se recouvrent en fin d'après-midi, quand la lumière traverse le jardin. Chaque couche est posée quand la précédente est encore humide, d'où ces bords flous." },
  { id: "tissage", t: "Tissage rouge", a: "Maud Perrenoud", s: "perrenoud", y: 2021, tech: "Huile sur toile", kind: "peinture", w: 100, h: 80, room: 5, inv: "CIM-2021-024", txt: "Une trame de rectangles rouges alterne le plein et le fil, comme un tissu vu de très près. Le damier est trompeur : aucune case n'est exactement carrée." },
];
const byId = Object.fromEntries(WORKS.map((x) => [x.id, x]));
const SZ = (wk) => (wk.w <= 80 ? "s" : wk.w <= 110 ? "m" : "l");
const dims = (wk) => `${wk.h} × ${wk.w} cm`;
const num = (i) => String(i).padStart(2, "0");
const rel = (wk) => WORKS.filter((o) => o.id !== wk.id && (o.s === wk.s || o.room === wk.room)).slice(0, 3).map((o) => o.id).join(" ");
const roomName = (n_) => ROOMS[n_ - 1][1];
const ARTISTS = [["marcellin", "Inès Marcellin"], ["wyrzykowski", "Tomas Wyrzykowski"], ["koffi", "Aya Koffi-Lemaire"], ["voss", "Élian Voss"], ["perrenoud", "Maud Perrenoud"], ["sarr", "Joaquim Sarr"]];
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;

// Pièce accrochée : lien vers la fiche (JS) ou la page œuvre (sans JS), avec son cartel mural.
const piece = (wk, cls = "") => `<figure class="cm-piece cm-sz-${SZ(wk)} ${cls}"><a class="cm-work" href="/oeuvre" data-open="${wk.id}" aria-label="Ouvrir la fiche : ${esc(wk.t)}, ${esc(wk.a)}">${art(wk)}</a><figcaption class="cm-label"><b>${esc(wk.t)}</b><span>${esc(wk.a)}, ${wk.y}</span><small>${esc(wk.tech)} · ${dims(wk)}</small></figcaption></figure>`;

// Registre des œuvres (données de la fiche) : masqué, lu par le JS ; découpé pour rester sous la limite de taille d'un bloc.
const registry = () => {
  const items = WORKS.map((wk) => `<article class="cm-reg-i" data-w="${wk.id}" data-t="${esc(wk.t)}" data-a="${esc(wk.a)}" data-y="${wk.y}" data-tech="${esc(wk.tech)}" data-dim="${dims(wk)}" data-room="${wk.room}" data-roomn="${esc(roomName(wk.room))}" data-inv="${wk.inv}" data-txt="${esc(wk.txt)}" data-rel="${rel(wk)}">${art(wk)}</article>`);
  const out = []; let cur = "";
  for (const it of items) { if (cur.length + it.length > 15000) { out.push(cur); cur = ""; } cur += it; }
  out.push(cur);
  return out.map((h) => sec(`<div class="cm-reg" aria-hidden="true">${h}</div>`));
};
const panel = () => sec(`<a class="cm-scrim" href="#fermer" data-close tabindex-x="" aria-label="Fermer la fiche"></a>
<aside class="cm-panel" role="dialog" aria-modal="true" aria-label="Fiche de l'œuvre">
  <div class="cm-pbar"><span class="cm-pk">Fiche de l'œuvre</span><a class="cm-x" href="#fermer" data-close aria-label="Fermer la fiche">Fermer <i aria-hidden="true">×</i></a></div>
  <div class="cm-pscroll">
    <div class="cm-zoom"><div class="cm-zoom-in" data-slot="art"></div></div>
    <div class="cm-ztools" role="group" aria-label="Zoom"><a href="#zoom-moins" data-zoom="-1" aria-label="Réduire le zoom">−</a><span class="cm-zv" aria-live="polite">100 %</span><a href="#zoom-plus" data-zoom="1" aria-label="Agrandir le zoom">+</a><small>Clic sur l'image ou touches + et −</small></div>
    <div class="cm-pbody"><p class="cm-room-k" data-slot="room"></p><h2 class="cm-ptitle" data-slot="title">Œuvre</h2><p class="cm-partist" data-slot="artist"></p>
      <dl class="cm-dl" data-slot="dl"></dl><p class="cm-ptxt" data-slot="txt"></p>
      <div class="cm-prel"><h3>Œuvres liées</h3><div class="cm-prel-in" data-slot="rel"></div></div>
      <p class="cm-pfull"><a href="/oeuvre">Voir la page œuvre ${arrow}</a></p></div>
  </div>
  <div class="cm-pnav"><a href="#precedente" data-pnav="-1">${arrow}<span>Précédente</span></a><a href="#suivante" data-pnav="1"><span>Suivante</span>${arrow}</a></div>
</aside>`.replace(' tabindex-x=""', ""));

/* ---------- gabarits communs ---------- */
const header = (c) => sec(`<header class="cm-head pk-bleed">
  <div class="cm-top"><a class="cm-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="cm-logo-w">Cimaise</span><small>Galerie d'art contemporain · Lyon</small></a>
    <p class="cm-status" data-hours-status>Mardi – dimanche · 11 h – 19 h</p>
    <a class="cm-tbtn" href="/visite">Préparer sa visite</a>
    <details class="cm-burger"><summary aria-label="Ouvrir le menu"><span>Menu</span><i aria-hidden="true"></i></summary><div class="cm-drawer" role="navigation" aria-label="Menu mobile"><ol>${c.menu.map(({ label, url }, i) => `<li><a href="${esc(url)}"><b>${num(i + 1)}</b><span>${esc(label)}</span></a></li>`).join("")}</ol><p>Galerie Cimaise · 12 quai des Verriers, Lyon</p></div></details></div>
  <div class="cm-index" role="navigation" aria-label="Index des salles du site"><ol>${c.menu.map(({ label, url }, i) => `<li><a href="${esc(url)}"><span class="cm-ix-l">${esc(label)}</span><b>${num(i + 1)}</b></a></li>`).join("")}</ol></div></header>`);

const footer = (c) => sec(`<footer class="cm-foot pk-bleed"><div class="cm-foot-word" aria-hidden="true">Cimaise</div>
  <div class="cm-foot-grid"><div class="cm-foot-lead"><p>Une galerie pour regarder lentement.</p><address>12 quai des Verriers<br>69002 Lyon</address></div>
  <div><h2>Parcourir</h2>${c.menu.slice(1, 5).map(({ label, url }) => `<a href="${esc(url)}">${esc(label)}</a>`).join("")}</div>
  <div><h2>Horaires</h2><p>Mardi – dimanche<br>11 h – 19 h<br>Jeudi nocturne jusqu'à 21 h<br>Fermé le lundi</p></div>
  <div><h2>Écrire</h2><a href="/contact">Contact</a><a href="/presse">Presse</a><a href="/recherche">Recherche</a><a href="mailto:bonjour@galerie-cimaise.example">bonjour@galerie-cimaise.example</a></div></div>
  <p class="cm-legal">© Galerie Cimaise — site de démonstration. Galerie, artistes, œuvres, horaires et tarifs fictifs.</p></footer>`);

const pagehead = (no, kicker, title, sub) => sec(`<section class="cm-ph pk-bleed"><div class="cm-wrap"><p class="cm-ph-no" data-reveal aria-hidden="true">${no}</p><div class="cm-ph-main"><p class="cm-kicker" data-reveal>${esc(kicker)}</p><div class="cm-h1" role="heading" aria-level="1" data-reveal>${title}</div></div>${sub ? `<p class="cm-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

const plan = (mode) => `<div class="cm-plan" role="group" aria-label="Plan des cinq salles">${ROOMS.map(([i, name]) => mode === "tour"
  ? `<a class="cm-pc cm-pa${i}" href="#salle-${i}" data-go="${i}"><b>${num(i)}</b><span>${esc(name)}</span></a>`
  : `<a class="cm-pc cm-pa${i}" href="/exposition" data-hov="${i}"><b>${num(i)}</b><span>${esc(name)}</span></a>`).join("")}<span class="cm-door" aria-hidden="true">Entrée</span></div>`;

/* ---------- pages ---------- */
const home = (c) => [
  header(c),
  sec(`<section class="cm-hero pk-bleed"><span class="cm-spot" aria-hidden="true"></span>
    <div class="cm-hero-in"><div class="cm-cartel-xl" data-reveal><p class="cm-eyebrow">Exposition en cours · salles 01 à 05</p>
      <div class="cm-title" role="heading" aria-level="1">Mesures<br><em>du silence</em></div><p class="cm-sub">Peinture et retenue, 2019 – 2024. Six artistes, douze œuvres, cinq salles blanches.</p>
      <dl class="cm-meta"><div><dt>Du</dt><dd>12 sept. 2026</dd></div><div><dt>Au</dt><dd>10 janv. 2027</dd></div><div><dt>Lieu</dt><dd>Rez-de-chaussée</dd></div></dl>
      <div class="cm-actions"><a class="cm-btn" href="/exposition">Entrer dans le parcours ${arrow}</a><a class="cm-link" href="/visite">Horaires et tarifs</a></div></div>
    <div class="cm-hang">${piece(byId.mesures, "cm-h1p")}${piece(byId.fenetres, "cm-h2p")}${piece(byId.archipel, "cm-h3p")}</div></div>
    <div class="cm-floor" aria-hidden="true"><svg class="cm-bench" viewBox="0 0 220 40"><rect x="0" y="8" width="220" height="12" fill="#1a1a1a"/><rect x="14" y="20" width="6" height="20" fill="#1a1a1a"/><rect x="200" y="20" width="6" height="20" fill="#1a1a1a"/></svg></div></section>`),
  sec(`<section class="cm-manifest pk-bleed"><div class="cm-wrap cm-man-in"><p class="cm-no" data-reveal>01</p><div><p class="cm-big" data-reveal>Ici, un tableau n'a jamais de concurrent. Quatre murs, une lumière, <em>et le temps qu'il faut.</em></p>
    <ul class="cm-figs"><li data-reveal><b data-count="5">5</b><span>salles blanches</span></li><li data-reveal><b data-count="12">12</b><span>œuvres exposées</span></li><li data-reveal><b data-count="6">6</b><span>artistes vivants</span></li><li data-reveal><b data-count="2400">2400</b><span>lux, pas un de plus</span></li></ul></div></div></section>`),
  sec(`<section class="cm-route pk-bleed"><div class="cm-wrap"><div class="cm-sechead"><p class="cm-kicker" data-reveal>Le parcours</p><h2 class="cm-h2" data-reveal>Cinq salles,<br>une seule promenade.</h2></div>
    <div class="cm-route-grid"><div class="cm-route-plan" data-reveal>${plan("home")}<p class="cm-cap">Plan du rez-de-chaussée. Survolez une salle.</p></div>
    <ol class="cm-rooms">${ROOMS.map(([i, name, txt, who]) => `<li class="cm-rm" data-reveal data-hov="${i}"><a href="/exposition"><b>${num(i)}</b><span class="cm-rm-t"><i>${esc(name)}</i><em>${esc(who)}</em></span><span class="cm-rm-p">${WORKS.filter((x) => x.room === i).map((x) => art(x)).join("")}</span><span class="cm-rm-go" aria-hidden="true">${arrow}</span></a></li>`).join("")}</ol></div></div></section>`),
  sec(`<section class="cm-daily pk-bleed"><div class="cm-wrap cm-daily-in"><div class="cm-daily-wall" data-reveal><figure class="cm-piece cm-sz-l">${`<a class="cm-work" href="/oeuvre" data-open="lever" aria-label="Ouvrir la fiche : Lever de sel, Aya Koffi-Lemaire">${art(byId.lever)}</a>`}</figure><span class="cm-pin" aria-hidden="true"></span></div>
    <div class="cm-daily-txt" data-reveal><p class="cm-kicker">L'œuvre à regarder aujourd'hui</p><h2 class="cm-h2">Lever de sel</h2>
      <dl class="cm-dl"><div><dt>Artiste</dt><dd>Aya Koffi-Lemaire</dd></div><div><dt>Date</dt><dd>2022</dd></div><div><dt>Technique</dt><dd>Acrylique sur toile</dd></div><div><dt>Dimensions</dt><dd>100 × 140 cm</dd></div><div><dt>Salle</dt><dd>03 · Lumières</dd></div></dl>
      <p class="cm-body">${esc(byId.lever.txt)}</p><a class="cm-btn cm-btn--ghost" href="/oeuvre" data-open="lever">Ouvrir la fiche ${arrow}</a></div></div></section>`),
  sec(`<section class="cm-next pk-bleed"><div class="cm-wrap"><div class="cm-sechead cm-sechead--row"><h2 class="cm-h2" data-reveal>Et ensuite</h2><a class="cm-link" href="/expositions" data-reveal>Toutes les expositions</a></div>
    <div class="cm-next-grid"><article class="cm-card" data-reveal><p class="cm-date">30 janv. – 2 mai 2027</p><h3>Atlas de poche</h3><p>Cartes, plans et relevés détournés par quatre dessinateurs. Petits formats, grande précision.</p></article>
    <article class="cm-card" data-reveal><p class="cm-date">22 mai – 5 sept. 2027</p><h3>Les Heures bleues</h3><p>Une exposition en lumière naturelle, ouverte jusqu'à la tombée du jour.</p></article>
    <article class="cm-card" data-reveal><p class="cm-date">Chaque jeudi, 19 h</p><h3>Nocturne commentée</h3><p>Une médiatrice, une salle, quarante minutes. Gratuit, sans réservation.</p></article></div></div></section>`),
  sec(`<section class="cm-visit pk-bleed"><div class="cm-wrap cm-visit-in"><div data-reveal><p class="cm-kicker cm-kicker--l">Aujourd'hui</p><p class="cm-visit-st" data-hours-status>Ouvert du mardi au dimanche, de 11 h à 19 h</p><p class="cm-visit-p">Entrée libre le premier dimanche du mois. Tarifs de démonstration, à retrouver sur la page de visite.</p></div>
    <div class="cm-visit-a" data-reveal><a class="cm-btn cm-btn--light" href="/visite">Horaires et tarifs ${arrow}</a><a class="cm-link cm-link--l" href="/mediation">Ateliers et visites</a></div></div></section>`),
  footer(c), ...registry(), panel(),
];

const EXPOS = [
  ["en-cours", "En cours", "Mesures du silence", "12 sept. 2026 – 10 janv. 2027", "Inès Marcellin, Tomas Wyrzykowski, Aya Koffi-Lemaire, Élian Voss, Maud Perrenoud, Joaquim Sarr", "mesures", "/exposition", "Parcourir"],
  ["a-venir", "À venir", "Atlas de poche", "30 janv. – 2 mai 2027", "Quatre dessinateurs, cartes et relevés détournés", "port", "/contact", "En savoir plus"],
  ["a-venir", "À venir", "Les Heures bleues", "22 mai – 5 sept. 2027", "Exposition collective en lumière naturelle", "horizon", "/contact", "En savoir plus"],
  ["passee", "Passée", "Nuit à la règle", "7 mars – 28 juin 2026", "Élian Voss, dessins à l'encre 2018 – 2025", "nocturne", "/presse", "Dossier de presse"],
  ["passee", "Passée", "Papier, encre, sel", "4 oct. 2025 – 15 févr. 2026", "Six artistes, œuvres sur papier", "feuillage", "/presse", "Dossier de presse"],
  ["passee", "Passée", "Rouge, un fil", "20 avr. – 7 sept. 2025", "Maud Perrenoud, peintures textiles", "tissage", "/presse", "Dossier de presse"],
];
const expositions = (c) => [header(c), pagehead("02", "Programme", "Les<br><em>expositions</em>", "Une exposition à la fois, du premier au dernier jour. Choisissez ce qui est à voir, ce qui arrive, ce qui a eu lieu."),
  sec(`<section class="cm-expo pk-bleed" data-filter><div class="cm-wrap"><div class="cm-chips" role="group" aria-label="Filtrer les expositions"><a href="#tout" class="is-on" data-fk="state" data-fv="all">Toutes</a><a href="#en-cours" data-fk="state" data-fv="en-cours">En cours</a><a href="#a-venir" data-fk="state" data-fv="a-venir">À venir</a><a href="#passees" data-fk="state" data-fv="passee">Passées</a><span class="cm-n"><b data-out>6</b> expositions</span></div>
    <ol class="cm-ex-list">${EXPOS.map(([st, lab, t, d, who, thumb, href, cta], i) => `<li class="cm-ex" data-state="${st}" data-reveal><a href="${href}"><span class="cm-ex-no">${num(i + 1)}</span><span class="cm-ex-main"><i class="cm-ex-st cm-ex-st--${st}">${lab}</i><span class="cm-ex-t">${esc(t)}</span><span class="cm-ex-d">${esc(d)}</span><span class="cm-ex-w">${esc(who)}</span></span><span class="cm-ex-th">${art(byId[thumb])}</span><span class="cm-ex-go">${cta} ${arrow}</span></a></li>`).join("")}</ol></div></section>`),
  footer(c)];

const exposition = (c) => [header(c), pagehead("03", "Mesures du silence · 12 sept. 2026 – 10 janv. 2027", "Le<br><em>parcours</em>", "Entrez salle par salle. Utilisez les flèches du clavier pour passer d'une salle à l'autre, puis cliquez une œuvre pour lire son cartel complet."),
  sec(`<section class="cm-tour pk-bleed"><div class="cm-wrap"><div class="cm-tourbar"><a class="cm-tb" href="#precedente" data-room-nav="-1" aria-label="Salle précédente">${arrow}</a><p class="cm-tcount" aria-live="polite">Salle <b data-tc>01</b> / 05</p><a class="cm-tb cm-tb--n" href="#suivante" data-room-nav="1" aria-label="Salle suivante">${arrow}</a><span class="cm-tkeys">Flèches ← →</span></div>
    <div class="cm-tour-grid"><div class="cm-tour-side">${plan("tour")}<p class="cm-cap">Plan du rez-de-chaussée</p></div>
    <div class="cm-tour-rooms">${ROOMS.map(([i, name, txt, who]) => `<section class="cm-room" data-room="${i}" aria-label="Salle ${num(i)} : ${esc(name)}"><header class="cm-room-h"><p class="cm-room-no" aria-hidden="true">${num(i)}</p><div><h2 class="cm-h2">${esc(name)}</h2><p class="cm-room-who">${esc(who)}</p></div><p class="cm-room-txt">${esc(txt)}</p></header>
      <div class="cm-room-wall"><span class="cm-spot cm-spot--r" aria-hidden="true"></span>${WORKS.filter((x) => x.room === i).map((x) => piece(x)).join("")}</div></section>`).join("")}</div></div></div></section>`),
  footer(c), ...registry(), panel()];

const oeuvre = (c) => { const wk = byId.mesures; return [header(c), pagehead("04", "Salle 01 · Seuil", "Mesures<br><em>du silence</em>", "Inès Marcellin, 2023. Huile sur toile, 90 × 120 cm."),
  sec(`<section class="cm-focus pk-bleed"><div class="cm-wrap cm-focus-in"><div class="cm-focus-wall" data-reveal><span class="cm-spot cm-spot--r" aria-hidden="true"></span><a class="cm-work cm-work--xl" href="/oeuvre" data-open="mesures" aria-label="Agrandir l'œuvre : ${esc(wk.t)}">${art(wk)}</a><a class="cm-zoom-hint" href="/oeuvre" data-open="mesures">Agrandir et zoomer ${arrow}</a></div>
    <div class="cm-focus-card" data-reveal><div class="cm-cartel"><p class="cm-cartel-k">Cartel</p><p class="cm-cartel-a">${esc(wk.a)}</p><p class="cm-cartel-n">Née à Lyon en 1984. Vit et travaille à Villeurbanne.</p><p class="cm-cartel-t"><em>${esc(wk.t)}</em>, ${wk.y}</p>
      <dl class="cm-dl"><div><dt>Technique</dt><dd>${esc(wk.tech)}</dd></div><div><dt>Dimensions</dt><dd>${dims(wk)}</dd></div><div><dt>Inventaire</dt><dd>${wk.inv}</dd></div><div><dt>Provenance</dt><dd>Collection de la galerie</dd></div></dl></div>
      <h2 class="cm-h3">Regard</h2><p class="cm-body">${esc(wk.txt)}</p><h2 class="cm-h3">Technique</h2><p class="cm-body">Huit couches d'huile très diluée, ponçage entre chaque passage. Les lignes sont tracées au pinceau fin, sans règle, d'où leurs légères dérives. Le rouge est un pigment pur, posé en dernier.</p></div></div></section>`),
  sec(`<section class="cm-chrono pk-bleed"><div class="cm-wrap"><h2 class="cm-h2" data-reveal>Repères</h2><ol class="cm-steps"><li data-reveal><b>2021</b><span>Premières mesures : dessins de lignes verticales sur papier.</span></li><li data-reveal><b>2022</b><span>Passage à la toile, série de six études d'horizon.</span></li><li data-reveal><b>2023</b><span>Réalisation de <em>Mesures du silence</em> pendant un hiver d'atelier.</span></li><li data-reveal><b>2026</b><span>Accrochage en salle 01, première œuvre du parcours.</span></li></ol></div></section>`),
  sec(`<section class="cm-related pk-bleed"><div class="cm-wrap"><div class="cm-sechead cm-sechead--row"><h2 class="cm-h2" data-reveal>Œuvres liées</h2><a class="cm-link" href="/collection" data-reveal>Toute la collection</a></div><div class="cm-rel-row">${["horizon", "tissage", "archipel"].map((id) => piece(byId[id])).join("")}</div></div></section>`),
  footer(c), ...registry(), panel()]; };

const collection = (c) => [header(c), pagehead("05", "Collection", "La<br><em>collection</em>", "Les douze œuvres de l'exposition en cours, filtrables par artiste et par technique. Cliquez une œuvre pour ouvrir sa fiche."),
  sec(`<section class="cm-coll pk-bleed" data-filter><div class="cm-wrap"><div class="cm-filters"><div class="cm-chips" role="group" aria-label="Filtrer par artiste"><span class="cm-fl">Artiste</span><a href="#tous" class="is-on" data-fk="artist" data-fv="all">Tous</a>${ARTISTS.map(([k, nme]) => `<a href="#${k}" data-fk="artist" data-fv="${k}">${esc(nme)}</a>`).join("")}</div>
    <div class="cm-chips" role="group" aria-label="Filtrer par technique"><span class="cm-fl">Technique</span><a href="#toutes" class="is-on" data-fk="kind" data-fv="all">Toutes</a><a href="#peinture" data-fk="kind" data-fv="peinture">Peinture</a><a href="#papier" data-fk="kind" data-fv="papier">Papier</a><a href="#mixte" data-fk="kind" data-fv="mixte">Mixte</a><span class="cm-n"><b data-out>12</b> œuvres</span></div></div>
    <ul class="cm-cgrid">${WORKS.map((wk, i) => `<li class="cm-ci" data-artist="${wk.s}" data-kind="${wk.kind}" data-reveal><a href="/oeuvre" data-open="${wk.id}" aria-label="Ouvrir la fiche : ${esc(wk.t)}, ${esc(wk.a)}"><span class="cm-ci-wall">${art(wk)}</span><span class="cm-ci-cap"><b>${esc(wk.t)}</b><span>${esc(wk.a)}, ${wk.y}</span><small>${esc(wk.tech)} · salle ${num(wk.room)}</small></span></a></li>`).join("")}</ul>
    <p class="cm-empty" hidden>Aucune œuvre ne correspond à ces filtres.</p></div></section>`),
  footer(c), ...registry(), panel()];

const HOURS = [["Lundi", "Fermé", 1], ["Mardi", "11 h – 19 h", 2], ["Mercredi", "11 h – 19 h", 3], ["Jeudi", "11 h – 21 h (nocturne)", 4], ["Vendredi", "11 h – 19 h", 5], ["Samedi", "10 h – 19 h", 6], ["Dimanche", "10 h – 18 h", 0]];
const visite = (c) => [header(c), pagehead("06", "Informations pratiques", "Préparer<br><em>sa visite</em>", "Horaires, tarifs et accès de la galerie. Toutes les informations de cette page sont fictives."),
  sec(`<section class="cm-vis pk-bleed"><div class="cm-wrap cm-vis-in"><div class="cm-vis-col" data-reveal><h2 class="cm-h2">Horaires</h2><p class="cm-vis-live" data-hours-status>Mardi – dimanche</p>
    <table class="cm-table"><caption class="cm-sr">Horaires d'ouverture de la galerie</caption><thead><tr><th scope="col">Jour</th><th scope="col">Heures</th></tr></thead><tbody>${HOURS.map(([d, h, k]) => `<tr data-d="${k}"><th scope="row">${d}</th><td>${h}</td></tr>`).join("")}</tbody></table></div>
    <div class="cm-vis-col" data-reveal><h2 class="cm-h2">Tarifs</h2><p class="cm-vis-live">Tarifs de démonstration</p>
    <table class="cm-table cm-table--t"><caption class="cm-sr">Tarifs d'entrée</caption><thead><tr><th scope="col">Billet</th><th scope="col">Tarif</th></tr></thead><tbody><tr><th scope="row">Plein tarif</th><td>9 €</td></tr><tr><th scope="row">Tarif réduit (étudiants, seniors)</th><td>6 €</td></tr><tr><th scope="row">Moins de 18 ans</th><td>Gratuit</td></tr><tr><th scope="row">Premier dimanche du mois</th><td>Gratuit</td></tr><tr><th scope="row">Visite commentée du jeudi</th><td>Incluse</td></tr></tbody></table><p class="cm-note">Le paiement se fait sur place. Aucune réservation en ligne dans cette démonstration : pour un groupe, <a href="/contact">écrivez-nous</a>.</p></div></div></section>`),
  sec(`<section class="cm-access pk-bleed"><div class="cm-wrap"><h2 class="cm-h2" data-reveal>Venir et circuler</h2><div class="cm-access-grid">
    <article class="cm-acc" data-reveal><b>01</b><h3>Adresse</h3><p>12 quai des Verriers<br>69002 Lyon<br>À cinq minutes de la station Cordeliers (ligne A).</p></article>
    <article class="cm-acc" data-reveal><b>02</b><h3>Accessibilité</h3><p>Rez-de-chaussée de plain-pied, ascenseur, bancs dans toutes les salles, fauteuils pliants prêtés à l'accueil.</p></article>
    <article class="cm-acc" data-reveal><b>03</b><h3>Pour votre confort</h3><p>Consigne gratuite, photographie sans flash autorisée, chiens guides bienvenus, livret de salle en gros caractères.</p></article>
    <article class="cm-acc" data-reveal><b>04</b><h3>Durée conseillée</h3><p>Une heure pour le parcours complet, davantage si vous aimez rester devant une seule toile.</p></article></div></div></section>`),
  sec(`<section class="cm-streetmap pk-bleed"><div class="cm-wrap"><svg class="cm-map" viewBox="0 0 800 220" role="img" aria-label="Schéma simplifié : la galerie se trouve quai des Verriers, entre le fleuve et la rue des Cadres."><rect width="800" height="220" fill="#ece9df"/><path d="M0 150c140-24 260 22 400 0s280-30 400-4v74H0z" fill="#b9cfcb"/><path d="M0 150c140-24 260 22 400 0s280-30 400-4" fill="none" stroke="#2f6f64" stroke-width="2"/><g stroke="#cfcab9" stroke-width="10" fill="none"><path d="M60 0v130"/><path d="M240 0v138"/><path d="M520 0v142"/><path d="M700 0v134"/><path d="M0 90h800"/></g><g fill="#d9d5c8"><rect x="80" y="20" width="140" height="56"/><rect x="260" y="20" width="240" height="56"/><rect x="540" y="20" width="140" height="56"/><rect x="80" y="104" width="140" height="22"/><rect x="540" y="104" width="140" height="22"/></g><rect x="260" y="104" width="240" height="26" fill="#151515"/><circle cx="380" cy="117" r="6" fill="#2f6f64"/></svg><p class="cm-cap">Schéma simplifié, sans échelle. Galerie en noir, fleuve en vert-de-gris.</p></div></section>`),
  footer(c)];

const ATELIERS = [
  ["familles", "Familles", "Dimanche 15 h", "Composer un mur", "Chaque enfant accroche trois formes découpées sur un mur de papier, puis écrit son propre cartel.", "6 – 11 ans · 1 h 30 · gratuit"],
  ["familles", "Familles", "Mercredi 14 h", "Le tableau qui change de couleur", "À partir de Veilleuse et de Lever de sel, on mélange des teintes pour fabriquer le soir.", "4 – 8 ans · 1 h · gratuit"],
  ["scolaires", "Scolaires", "Sur rendez-vous", "Une salle, une question", "Une classe, une salle, une question posée par la médiatrice. Dossier pédagogique fourni.", "CE2 – 3ᵉ · 1 h 15 · gratuit"],
  ["adultes", "Adultes", "Jeudi 19 h", "Nocturne commentée", "Quarante minutes devant trois œuvres choisies par une médiatrice, sans jargon.", "Tout public · 40 min · incluse"],
  ["adultes", "Adultes", "Samedi 11 h", "Dessiner à la règle", "Tirer un trait, puis cent : un atelier de dessin inspiré par Nocturne à la règle.", "Dès 16 ans · 2 h · 12 €"],
  ["acces", "Accessibilité", "Sur demande", "Visite à toucher", "Moulages et textures à manipuler avant d'entrer en salle, description orale des œuvres.", "Tout public · 1 h · gratuit"],
];
const mediation = (c) => [header(c), pagehead("07", "Médiation", "Regarder<br><em>ensemble</em>", "Ateliers, visites commentées et parcours pour tous les âges. Les propositions ci-dessous sont des exemples de démonstration."),
  sec(`<section class="cm-med pk-bleed" data-filter><div class="cm-wrap"><div class="cm-chips" role="group" aria-label="Filtrer par public"><a href="#tous" class="is-on" data-fk="pub" data-fv="all">Tous</a><a href="#familles" data-fk="pub" data-fv="familles">Familles</a><a href="#scolaires" data-fk="pub" data-fv="scolaires">Scolaires</a><a href="#adultes" data-fk="pub" data-fv="adultes">Adultes</a><a href="#acces" data-fk="pub" data-fv="acces">Accessibilité</a><span class="cm-n"><b data-out>6</b> propositions</span></div>
    <div class="cm-med-grid">${ATELIERS.map(([k, pub, when, t, txt, meta], i) => `<article class="cm-at" data-pub="${k}" data-reveal><p class="cm-at-top"><span>${pub}</span><time>${when}</time></p><h3>${esc(t)}</h3><p>${esc(txt)}</p><p class="cm-at-meta">${meta}</p><a class="cm-link" href="/contact">Demander des informations</a></article>`).join("")}</div></div></section>`),
  sec(`<section class="cm-method pk-bleed"><div class="cm-wrap cm-method-in"><div data-reveal><p class="cm-kicker cm-kicker--l">Notre façon de faire</p><h2 class="cm-h2 cm-h2--l">Trois gestes pour regarder.</h2></div><ol class="cm-steps cm-steps--l"><li data-reveal><b>1</b><span>S'approcher jusqu'à voir le geste de la main.</span></li><li data-reveal><b>2</b><span>Reculer jusqu'à voir la composition entière.</span></li><li data-reveal><b>3</b><span>Revenir : la même œuvre n'est plus tout à fait la même.</span></li></ol></div></section>`),
  footer(c)];

const presse = (c) => [header(c), pagehead("08", "Presse", "Espace<br><em>presse</em>", "Communiqués, chiffres et visuels de l'exposition en cours. Documents fictifs, fournis à titre de démonstration."),
  sec(`<section class="cm-press pk-bleed"><div class="cm-wrap cm-press-in"><div class="cm-press-main"><h2 class="cm-h2" data-reveal>Communiqués</h2>
    <ol class="cm-pr-list">${[["02 nov. 2026", "Mesures du silence : six artistes, cinq salles", "Présentation de l'exposition d'automne et du parcours."], ["14 sept. 2026", "Ouverture de la saison 2026 – 2027", "Programme, nocturnes du jeudi et premier dimanche gratuit."], ["29 juin 2026", "Bilan de Nuit à la règle", "Fréquentation et temps de visite moyens (chiffres fictifs)."], ["10 mars 2026", "Élian Voss, dessins à l'encre", "Dossier de l'exposition de printemps."]].map(([d, t, s]) => `<li data-reveal><time>${d}</time><div><h3>${esc(t)}</h3><p>${esc(s)}</p></div><a class="cm-link" href="/contact">Demander le dossier</a></li>`).join("")}</ol></div>
    <aside class="cm-press-side" data-reveal><h2 class="cm-h3">Contact presse</h2><address>Léa Fontenay<br>Responsable communication<br><a href="mailto:presse@galerie-cimaise.example">presse@galerie-cimaise.example</a><br>Tél. 04 00 00 00 00 (fictif)</address><h2 class="cm-h3">En chiffres</h2><dl class="cm-dl"><div><dt>Surface</dt><dd>640 m²</dd></div><div><dt>Salles</dt><dd>5</dd></div><div><dt>Œuvres</dt><dd>12</dd></div><div><dt>Fondée</dt><dd>2009 (fictif)</dd></div></dl></aside></div></section>`),
  sec(`<section class="cm-visuals pk-bleed"><div class="cm-wrap"><div class="cm-sechead cm-sechead--row"><h2 class="cm-h2" data-reveal>Visuels</h2><p class="cm-cap" data-reveal>Visuels libres de droits en démonstration. Haute définition sur demande.</p></div><div class="cm-vis-row">${["mesures", "lever", "breche", "portrait"].map((id) => piece(byId[id])).join("")}</div></div></section>`),
  footer(c), ...registry(), panel()];

const contact = (c) => [header(c), pagehead("09", "Écrire à la galerie", "Nous<br><em>écrire</em>", "Une question sur l'exposition, une visite de groupe, une demande presse : nous répondons sous deux jours ouvrés."),
  { type: "form", heading: "Votre message", intro: "Indiquez votre demande, le nombre de personnes et la date souhaitée si vous préparez une visite de groupe." }, footer(c)];
const recherche = (c) => [header(c), pagehead("10", "Rechercher", "Une<br><em>œuvre ?</em>", "Un artiste, une salle, une exposition, un horaire."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un artiste, une œuvre…" } }] }, footer(c)];
const introuvable = (c) => [header(c), sec(`<section class="cm-404 pk-bleed"><div class="cm-wrap"><p class="cm-ph-no" aria-hidden="true">404</p><div class="cm-h1" role="heading" aria-level="1">Cette salle<br><em>est vide.</em></div><p class="cm-ph-sub">La page demandée n'existe pas ou a changé d'adresse. Le cadre est accroché, mais le mur est resté blanc.</p><div class="cm-404-wall" aria-hidden="true"><span></span></div><a class="cm-btn" href="/">Retour à l'accueil ${arrow}</a></div></section>`), footer(c)];

module.exports = {
  key: "cimaise", name: "Cimaise", version: "2.0.0", category: "edition", tags: ["minimaliste", "editorial", "classique"], siteType: "Musée et galerie d'art", featured: true,
  concept: "Une salle blanche : l'accrochage d'œuvres sur un mur, un cartel géant en guise de titre, un index latéral numéroté des salles et un parcours d'exposition à parcourir au clavier.",
  description: "Musée ou galerie d'art : murs blanc cassé, noir d'encre, un seul vert-de-gris, accrochage mural en hero, index des salles, parcours d'exposition avec plan interactif et fiche d'œuvre en panneau avec zoom.",
  brand: "Galerie Cimaise", modules: ["formulaires", "recherche"],
  dna: { header: "index-lateral-droit-numerote-des-salles", hero: "accrochage-mural-d-oeuvres-et-cartel-geant", grid: "salles-en-parcours-et-cimaises-alternees", motion: "projecteur-mobile-et-fondu-de-salle", shapes: "cadres-nus-cartels-et-filets-fins", rhythm: "contemplatif-une-oeuvre-par-respiration", signature: "parcours-d-exposition-plan-et-fiche-oeuvre-zoomable" },
  tokens: {
    colors: { primary: "#2f6f64", secondary: "#151515", accent: "#c2543a", background: "#f7f6f2", surface: "#ffffff", text: "#151515", muted: "#5f5e59", success: "#2f6f64", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.spectral", body: "font.libre-franklin", button: "font.libre-franklin", link: "font.libre-franklin" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d6cc" },
    type: { h1: { size: 88, weight: 300, lineHeight: 0.98, transform: "none" }, h2: { size: 52, weight: 300, lineHeight: 1.04, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Vert-de-gris (accent)", type: "color", default: "#2f6f64" },
    { key: "mur", label: "Teinte des murs", type: "choice", default: "blanc", choices: [["blanc", "Blanc cassé"], ["craie", "Craie"], ["pierre", "Pierre claire"]] },
    { key: "projecteur", label: "Projecteur qui suit la souris", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
    { key: "index", label: "Index latéral des salles", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Expositions", "/expositions"], ["Parcours", "/exposition"], ["Collection", "/collection"], ["Visite", "/visite"], ["Médiation", "/mediation"], ["Presse", "/presse"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "expositions", name: "Expositions", render: expositions }, { key: "exposition", name: "Parcours d'exposition", render: exposition },
    { key: "oeuvre", name: "Œuvre", render: oeuvre }, { key: "collection", name: "Collection", render: collection }, { key: "visite", name: "Visite", render: visite },
    { key: "mediation", name: "Médiation", render: mediation }, { key: "presse", name: "Presse", render: presse }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
