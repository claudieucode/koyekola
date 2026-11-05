// Obscura — photographe professionnel. Direction artistique : minimalisme absolu, l'image est l'unique héros. Fond neutre, aucune ornementation, serif éditorial fin,
// navigation en deux étiquettes dans les coins, planche-contact en colonnes, visionneuse plein écran (clavier, glissement tactile, légendes, compteur).
// Les « photographies » sont des compositions SVG/CSS dessinées dans ce fichier (aucune image externe).
const { sec, esc } = require("../kit");

// ---------- petites fonctions de dessin ----------
const rng = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const n = (x) => Math.round(x * 10) / 10;
const q = Math.round;
// crête de montagnes / dunes : courbes douces à pics aléatoires
const ridge = (seed, W, H, y, amp, fill, op, steps = 14) => {
  const r = rng(seed); const p = []; for (let i = 0; i <= steps; i++) p.push([q(W * i / steps), q(y + (r() - 0.5) * 2 * amp)]);
  let d = `M0 ${p[0][1]}`; for (let i = 1; i < p.length; i++) { const mx = q((p[i - 1][0] + p[i][0]) / 2); d += `C${mx} ${p[i - 1][1]} ${mx} ${p[i][1]} ${p[i][0]} ${p[i][1]}`; }
  return `<path d="${d}V${q(H)}H0Z" fill="${fill}" opacity="${op}"/>`;
};
const band = (y, h, W, fill, op) => `<rect x="0" y="${q(y)}" width="${q(W)}" height="${q(h)}" fill="${fill}" opacity="${op}"/>`;

const ART = {
  // paysage : crêtes dans la brume, soleil bas
  brume: (W, H) => `<circle cx="${n(W * (W > 900 ? 0.56 : 0.68))}" cy="${n(H * 0.575)}" r="${n(W * 0.045)}" fill="#fff1d6" opacity=".85"/>` +
    ridge(11, W, H, H * 0.6, H * 0.05, "#8a9199", 0.7, 8) + band(H * 0.6, H * 0.08, W, "#efe3cf", 0.22) +
    ridge(23, W, H, H * 0.7, H * 0.06, "#59636d", 0.85, 7) + band(H * 0.69, H * 0.09, W, "#e6dccb", 0.2) +
    ridge(37, W, H, H * 0.82, H * 0.05, "#2f373e", 0.92, 6) + band(H * 0.84, H * 0.07, W, "#d9cdb8", 0.14) + ridge(51, W, H, H * 0.95, H * 0.025, "#14181c", 1, 5),
  // paysage : troncs dans la brume
  foret: (W, H) => { const r = rng(5); const tr = (cnt, w0, w1, f, o) => { let d = ""; for (let i = 0; i < cnt; i++) { const x = Math.round(r() * W), w = Math.round(w0 + r() * w1); d += `M${x} 0h${w}V${H}h-${w}z`; } return `<path d="${d}" fill="${f}" opacity="${o}"/>`; };
    let s = tr(26, 3, 5, "#3f4a42", 0.24) + band(H * 0.35, H * 0.3, W, "#e8e1cd", 0.28) + tr(12, 8, 9, "#242c27", 0.5) + band(H * 0.62, H * 0.22, W, "#e8e1cd", 0.2);
    s += `<path d="${[[70, 24], [210, 30], [335, 20], [430, 36]].map(([x, w]) => `M${x} 0h${w}V${H}h-${w}z`).join("")}" fill="#101512" opacity=".92"/>`;
    return s + `<path d="M0 ${H}V${n(H * 0.92)}C120 ${n(H * 0.89)} 300 ${n(H * 0.95)} ${W} ${n(H * 0.9)}V${H}Z" fill="#0a0d0b"/>`; },
  // paysage : ferme avant le jour
  nuit: (W, H) => { const r = rng(9); const g = [[], [], []]; for (let i = 0; i < 36; i++) g[i % 3].push(`M${Math.round(r() * W)} ${Math.round(r() * H * 0.6)}h.1`);
    let s = g.map((d, i) => `<path d="${d.join("")}" stroke="#f4efe3" stroke-width="${[1, 1.5, 2.2][i]}" stroke-linecap="round" opacity="${[0.3, 0.55, 0.85][i]}"/>`).join("");
    s += `<circle cx="${n(W * 0.8)}" cy="${n(H * 0.2)}" r="9" fill="#ece7da" opacity=".92"/>` + ridge(4, W, H, H * 0.78, H * 0.05, "#0a0f18", 1, 9) +
      `<g transform="translate(${Math.round(W * 0.34)} ${Math.round(H * 0.7)})"><path d="M-34 10 0-18 34 10zM-28 10h56v34h-56z" fill="#05070b"/><circle cx="-8" cy="24" r="16" fill="#ffcf7a" opacity=".12"/><circle cx="-8" cy="24" r="9" fill="#ffcf7a" opacity=".18"/><path d="M-13 19h10v11h-10z" fill="#ffcf7a" opacity=".95"/></g>`;
    return s + ridge(8, W, H, H * 0.93, H * 0.02, "#030508", 1, 8); },
  // paysage : horizon et marée descendante (panoramique)
  maree: (W, H) => { const r = rng(21); const hz = H * 0.5; const g = [[], [], []];
    for (let i = 0; i < 46; i++) { const y = Math.round(hz + 8 + Math.pow(i / 46, 1.6) * (H * 0.46)), w = Math.round(30 + r() * (60 + i * 5)), x = Math.round(r() * (W - w)); g[i % 3].push(`M${x} ${y}h${w}`); }
    let s = `<circle cx="${n(W * 0.62)}" cy="${n(H * 0.46)}" r="16" fill="#fff3da" opacity=".9"/><path d="M0 ${hz}H${W}v6H0z" fill="#202a31" opacity=".6"/>` + g.map((d, i) => `<path d="${d.join("")}" stroke="#dfe4e6" stroke-width="${[0.8, 1.2, 1.8][i]}" opacity="${[0.16, 0.24, 0.32][i]}"/>`).join("");
    let rf = ""; for (let i = 0; i < 12; i++) { const w = 36 + i * 6; rf += `M${Math.round(W * 0.6 - w / 2)} ${Math.round(hz + 10 + i * 17)}h${w}`; }
    return s + `<path d="${rf}" stroke="#fff3da" stroke-width="1.4" opacity=".55"/>` + ridge(33, W, H, H * 0.97, H * 0.02, "#1a2127", 0.9, 10); },
  // paysage : dunes au vent d'est
  dune: (W, H) => `<circle cx="${n(W * 0.78)}" cy="${n(H * 0.3)}" r="${n(W * 0.04)}" fill="#fff0d2" opacity=".8"/>` +
    `<path d="M0 ${n(H * 0.62)}C${n(W * 0.2)} ${n(H * 0.46)} ${n(W * 0.38)} ${n(H * 0.5)} ${n(W * 0.55)} ${n(H * 0.62)}S${n(W * 0.88)} ${n(H * 0.72)} ${W} ${n(H * 0.55)}V${H}H0Z" fill="#c9784e"/>` +
    `<path d="M0 ${n(H * 0.62)}C${n(W * 0.2)} ${n(H * 0.46)} ${n(W * 0.38)} ${n(H * 0.5)} ${n(W * 0.55)} ${n(H * 0.62)}" fill="none" stroke="#ffe3bf" stroke-width="1.2" opacity=".7"/>` +
    `<path d="M0 ${n(H * 0.8)}C${n(W * 0.25)} ${n(H * 0.58)} ${n(W * 0.5)} ${n(H * 0.66)} ${n(W * 0.68)} ${n(H * 0.78)}S${n(W * 0.92)} ${n(H * 0.74)} ${W} ${n(H * 0.7)}V${H}H0Z" fill="#8c4a2d"/>` +
    `<path d="M${n(W * 0.28)} ${n(H * 0.7)}C${n(W * 0.45)} ${n(H * 0.62)} ${n(W * 0.55)} ${n(H * 0.7)} ${n(W * 0.68)} ${n(H * 0.78)}V${H}H${n(W * 0.28)}Z" fill="#3b1f15" opacity=".55"/>` +
    `<path d="M0 ${n(H * 0.93)}C${n(W * 0.3)} ${n(H * 0.84)} ${n(W * 0.6)} ${n(H * 0.95)} ${W} ${n(H * 0.86)}V${H}H0Z" fill="#2b1710"/>`,
  // portrait : lumière de fenêtre
  portA: (W, H) => `<polygon points="0,0 190,0 120,${H} 0,${H}" fill="#fff" opacity=".055"/><polygon points="250,0 310,0 270,${H} 230,${H}" fill="#fff" opacity=".035"/>` +
    `<path d="M50 ${H}C62 480 160 450 232 440L252 440C330 450 424 480 436 ${H}Z" fill="#0b0b0c"/><rect x="214" y="372" width="56" height="80" fill="#1d1816"/>` +
    `<ellipse cx="242" cy="262" rx="78" ry="100" fill="#2c2420"/><path d="M164 262C164 190 196 164 242 164L242 362C196 362 164 330 164 262Z" fill="#d1a283" opacity=".62"/>` +
    `<path d="M160 258C150 170 214 128 262 140C316 154 336 200 322 262C316 214 290 182 250 178C206 176 172 200 160 258Z" fill="#0c0a09"/>` +
    `<path d="M62 ${H}C72 490 150 462 200 452L196 ${H}Z" fill="#d1a283" opacity=".22"/>`,
  // portrait : profil, contre-jour
  portB: (W, H) => `<path d="M168 ${H}C170 505 188 470 210 442C192 420 186 382 192 342C170 332 162 300 176 270C182 202 230 152 292 160C342 166 370 206 372 246L398 288L372 294C374 306 372 320 366 330C372 338 372 348 360 352C350 382 336 412 300 432C300 462 322 482 362 500C422 522 442 562 442 ${H}Z" fill="#0d0d0e"/>` +
    `<path d="M398 288L372 294C374 306 372 320 366 330C372 338 372 348 360 352C350 382 336 412 300 432" fill="none" stroke="#f1dcc0" stroke-width="2" opacity=".75"/><path d="M372 246C370 206 342 166 292 160" fill="none" stroke="#f1dcc0" stroke-width="2" opacity=".5"/>` +
    `<path d="M176 270C182 202 230 152 292 160C250 170 214 210 208 262Z" fill="#050505"/>`,
  // portrait : halo, de face
  portC: (W, H) => `<circle cx="250" cy="236" r="178" fill="none" stroke="#f6e8cf" stroke-width="1" opacity=".3"/><circle cx="250" cy="236" r="132" fill="none" stroke="#f6e8cf" stroke-width="1" opacity=".18"/>` +
    `<path d="M70 ${H}C80 400 170 372 250 372C330 372 420 400 430 ${H}Z" fill="#0e0d0c"/><rect x="224" y="320" width="52" height="64" fill="#1a1613"/>` +
    `<ellipse cx="250" cy="236" rx="60" ry="76" fill="#1a1613"/><path d="M190 236C190 190 210 160 250 160C290 160 312 190 310 236C298 214 280 200 250 198C222 198 202 212 190 236Z" fill="#080706"/>` +
    `<path d="M310 236C312 190 290 160 250 160" fill="none" stroke="#fff3dc" stroke-width="2" opacity=".7"/>`,
  // architecture : façade, ombre portée
  facade: (W, H) => { let d = "", lit = "", sill = ""; for (let c = 0; c < 4; c++) for (let l = 0; l < 7; l++) { const x = 58 + c * 100, y = 96 + l * 74, w = `M${x} ${y}h64v48h-64z`; if ((c * 3 + l * 5) % 11 === 0) lit += w; else d += w; sill += `M${x} ${y + 48}h64v3h-64z`; }
    return band(0, 70, W, "#e9e3d4", 0.55) + `<path d="M30 70h${W - 60}V${H}H30z" fill="#35383a"/><path d="${d}" fill="#12151a"/><path d="${lit}" fill="#f2d8a0" opacity=".9"/><path d="${sill}" fill="#8b8f8e"/>` +
      `<path d="M30 ${H}V70h220L480 ${H}z" fill="#000" opacity=".42"/><path d="M30 ${H - 30}h${W - 60}v30H30z" fill="#17191b"/>`; },
  // architecture : escalier en colimaçon vu d'en haut
  escalier: (W, H) => { let s = ""; for (let i = 0; i < 8; i++) { const z = 470 - i * 56, o = 250 - z / 2; s += `<rect x="${q(o)}" y="${q(o)}" width="${z}" height="${z}" fill="none" stroke="#efe3cc" stroke-width="${n(1.2 + i * 0.15)}" opacity="${n(0.14 + i * 0.07)}" transform="rotate(${i * 10} 250 250)"/>`; }
    return s + `<circle cx="250" cy="250" r="16" fill="#0a0b0c"/><circle cx="250" cy="250" r="3" fill="#e0553a"/>`; },
  // architecture : arcades en perspective
  arches: (W, H) => { let s = ""; for (let i = 0; i < 5; i++) { const w = 330 - i * 60, x = (W - w) / 2, top = 70 + i * 26, bot = 372 - i * 8; s += `<path d="M${n(x)} ${bot}V${n(top + w / 2)}A${n(w / 2)} ${n(w / 2)} 0 0 1 ${n(x + w)} ${n(top + w / 2)}V${bot}Z" fill="${i % 2 ? "#cdb99b" : "#161a20"}" opacity="${n(0.96 - i * 0.04)}" stroke="#6f685c" stroke-width=".8"/>`; }
    return s + `<rect x="0" y="372" width="${W}" height="28" fill="#0c0e11"/>`; },
  // abstrait : soustraction de disques
  absA: () => `<circle cx="205" cy="240" r="132" fill="#17181b" opacity=".92"/><circle cx="305" cy="240" r="132" fill="#e0553a" opacity=".62"/><circle cx="255" cy="165" r="132" fill="#f4eee1" opacity=".78"/><circle cx="255" cy="250" r="190" fill="none" stroke="#17181b" stroke-width="1" opacity=".5"/>`,
  // abstrait : verticales
  absB: (W, H) => { const bands = [[40, 70, "#0a1220", 1], [110, 24, "#27456e", 0.9], [134, 130, "#16294a", 1], [264, 10, "#d8e2f0", 0.85], [274, 90, "#2f5a8f", 0.7], [364, 40, "#0a1220", 1], [404, 36, "#1d3a64", 0.9]];
    return bands.map(([x, w, f, o]) => `<rect x="${x}" y="0" width="${w}" height="${H}" fill="${f}" opacity="${o}"/>`).join("") + `<rect x="0" y="${H * 0.62}" width="${W}" height="1.4" fill="#f0e3cc" opacity=".8"/>`; },
  // abstrait : houle
  absC: (W, H) => { let s = ""; for (let i = 0; i < 7; i++) { let d = ""; for (let x = 0; x <= W; x += 75) { const y = Math.round(60 + i * 48 + Math.sin(x / 70 + i * 0.5) * (16 + i * 1.5) + Math.sin(x / 31 + i) * 3); d += (x ? "L" : "M") + x + " " + y; } s += `<path d="${d}" fill="none" stroke="${i === 4 ? "#e0553a" : "#e8e2d4"}" stroke-width="${i === 4 ? 1.8 : 1}" opacity="${i === 4 ? 0.95 : n(0.25 + i * 0.09)}"/>`; }
    return s; },
};
const DIM = { brume: [600, 400], foret: [480, 600], nuit: [600, 400], maree: [800, 400], dune: [600, 400], portA: [480, 600], portB: [480, 600], portC: [500, 500], facade: [480, 600], escalier: [500, 500], arches: [600, 400], absA: [500, 500], absB: [480, 600], absC: [600, 400] };

const W = [
  { k: "brume", g: "paysages", t: "Premières crêtes", lieu: "Aubrac", an: 2024, c: "Cinq heures vingt : quatre plans de brume, un seul point de lumière." },
  { k: "foret", g: "paysages", t: "Hêtres dans la brume", lieu: "Aubrac", an: 2024, c: "Une forêt qui se dissout : les troncs lointains ne sont plus que des souvenirs." },
  { k: "nuit", g: "paysages", t: "Ferme, 4 h 12", lieu: "Aubrac", an: 2023, c: "La seule fenêtre allumée à des kilomètres. Pose de trente secondes, lune dans le dos." },
  { k: "maree", g: "paysages", t: "Marée descendante", lieu: "Baie de Somme", an: 2022, c: "L'eau se retire en laissant des lignes ; le panoramique laisse respirer le ciel." },
  { k: "dune", g: "paysages", t: "Dune, vent d'est", lieu: "Merzouga", an: 2022, c: "Deux courbes, une ombre. Le vent efface l'empreinte de la veille toutes les nuits." },
  { k: "portA", g: "portraits", t: "Marguerite, lumière de fenêtre", lieu: "Lyon", an: 2025, c: "Une fenêtre, un store à moitié tiré. Marguerite a oublié l'appareil." },
  { k: "portB", g: "portraits", t: "Samuel, de profil", lieu: "Lyon", an: 2025, c: "Le contre-jour dessine le visage mieux que tout éclairage." },
  { k: "portC", g: "portraits", t: "Nina, halo", lieu: "Villeurbanne", an: 2025, c: "Un cercle de lumière derrière la tête, comme une icône sans dorure." },
  { k: "facade", g: "architecture", t: "Façade, rue des Carmes", lieu: "Lyon", an: 2023, c: "Une ombre en diagonale coupe l'immeuble ; trois fenêtres restent allumées." },
  { k: "escalier", g: "architecture", t: "Colimaçon", lieu: "Besançon", an: 2024, c: "Vu d'en haut, l'escalier devient un diagramme ; le point rouge est la rampe." },
  { k: "arches", g: "architecture", t: "Viaduc, trois heures", lieu: "Millau", an: 2023, c: "Les arcades s'enfilent comme une respiration. Elles ne sont jamais deux fois du même gris." },
  { k: "absA", g: "abstraits", t: "Soustraction n° 3", lieu: "Atelier", an: 2026, c: "Trois disques qui se retranchent, réalisés sans appareil : papier, lampe, miroir." },
  { k: "absB", g: "abstraits", t: "Verticales, bleu de nuit", lieu: "Atelier", an: 2026, c: "Une ligne claire à hauteur d'œil, tout le reste tombe : étude sur le silence." },
  { k: "absC", g: "abstraits", t: "Houle", lieu: "Atelier", an: 2026, c: "Neuf lignes, une seule rouge, photographiées sur un bain à contre-lumière." },
];
const WK = Object.fromEntries(W.map((w, i) => [w.k, Object.assign({ i }, w)]));
const GENRES = [["paysages", "Paysages"], ["portraits", "Portraits"], ["architecture", "Architecture"], ["abstraits", "Abstraits"]];
const num = (i) => String(i + 1).padStart(2, "0");

const ph = (k, big, lab) => { const [w, h] = big ? [1600, 900] : DIM[k]; return `<div class="ob-ph ob-a-${k}"${lab ? ` role="img" aria-label="${esc(WK[k].t + ", " + WK[k].lieu + " " + WK[k].an)}"` : ' aria-hidden="true"'}><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="${big ? "xMidYMax" : "xMidYMid"} slice" aria-hidden="true">${ART[k](w, h)}</svg></div>`; };
// vignette cliquable → visionneuse plein écran
const fr = (k, cls = "", opt = {}) => { const w = WK[k], [dw, dh] = opt.big ? [16, 9] : DIM[k];
  return `<a class="ob-fr ${cls}" href="${opt.href || "/serie"}" data-lb data-r="${n(dw / dh)}" data-genre="${w.g}" data-title="${esc(w.t)}" data-meta="${esc(`${w.lieu} · ${w.an}`)}" data-cap="${esc(w.c)}"><figure>${ph(k, opt.big, opt.big)}<figcaption><span>${num(w.i)}</span><b>${esc(w.t)}</b><i>${esc(w.lieu)}, ${w.an}</i></figcaption></figure></a>`; };

// ---------- structure commune ----------
const header = (c) => `<header class="ob-head pk-bleed"><a class="ob-mark" href="/" aria-label="${esc(c.brand)}, accueil">Obscura</a>
  <details class="ob-idx"><summary aria-label="Ouvrir l'index"><span class="ob-idx-t">Index</span><span class="ob-idx-ic" aria-hidden="true"><i></i><i></i></span></summary>
    <div class="ob-panel" role="navigation" aria-label="Navigation principale"><ol class="ob-panel-list">${c.menu.map((m, i) => `<li><a href="${esc(m.url)}"><span>${num(i)}</span>${esc(m.label)}</a></li>`).join("")}</ol>
      <p class="ob-panel-foot"><a href="mailto:atelier@obscura-demo.example">atelier@obscura-demo.example</a><span>Lyon · sur rendez-vous</span></p></div></details></header>`;

const footer = (c) => `<footer class="ob-foot pk-bleed" data-reveal><div class="ob-foot-in">
  <p class="ob-foot-word">Anselme Dray<small>Photographe · Lyon</small></p>
  <div role="navigation" aria-label="Pied de page" class="ob-foot-nav">${c.menu.slice(1).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/recherche">Recherche</a></div>
  <p class="ob-foot-addr">Atelier Obscura · 9 rue des Chartreux · 69001 Lyon<br><a href="mailto:atelier@obscura-demo.example">atelier@obscura-demo.example</a></p></div>
  <p class="ob-legal">© Obscura — site de démonstration. Photographe, séries, lieux, expositions et éditions fictifs ; images composées en SVG et CSS.</p></footer>`;

const top = (kicker, title, sub) => sec(`<section class="ob-top pk-bleed"><p class="ob-kick" data-reveal>${esc(kicker)}</p><div class="ob-h1 ob-h1--s" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="ob-sub" data-reveal>${esc(sub)}</p>` : ""}</section>`);

// ---------- ACCUEIL ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="ob-hero pk-bleed" data-lbset="accueil">
    ${fr("brume", "ob-hero-img", { big: true, href: "/portfolio" }).replace('class="ob-fr ob-hero-img"', 'class="ob-fr ob-hero-img" aria-label="Voir la photographie en plein écran"').replace(/<figcaption>.*?<\/figcaption>/, "")}
    <div class="ob-hero-copy"><div class="ob-h1" role="heading" aria-level="1">Anselme Dray<span>Photographe</span></div>
      <p class="ob-hero-cap"><b>Premières crêtes</b>Aubrac, 2024 · série <i>Brume d'Aubrac</i></p></div>
    <a class="ob-cue" href="#suite" data-cue aria-label="Descendre vers la suite"><span></span></a></section>`),
  sec(`<section class="ob-intro pk-bleed" data-lbset="accueil"><div class="ob-wrap"><p class="ob-lede" data-reveal>Je photographie ce qui reste quand le bruit retombe : une crête dans la brume, un visage qui ne pose plus, un escalier vu d'en haut.</p>
    <p class="ob-meta" data-reveal>Paysage, portrait, architecture. Tirages d'art en éditions limitées. Commandes éditoriales et d'architecture, partout en France.</p>
    <p class="ob-go" data-reveal><a href="/portfolio">Parcourir les séries</a></p></div></section>`),
  sec(`<section class="ob-plate ob-plate--side pk-bleed" data-lbset="accueil"><div class="ob-wrap ob-plate-in">${fr("portA", "ob-plate-img")}
    <div class="ob-plate-txt" data-reveal><p class="ob-kick">Série 02 · 2025</p><h2 class="ob-h2">Visages d'hiver</h2><p>Quatorze personnes, une fenêtre, une heure chacune. Aucune consigne de sourire, aucune retouche de peau : ce que la lumière de février veut bien donner.</p><p class="ob-go"><a href="/portfolio#portraits">Voir les portraits</a></p></div></div></section>`),
  sec(`<section class="ob-plate ob-plate--wide pk-bleed" data-lbset="accueil"><div class="ob-wrap">${fr("arches", "ob-plate-img")}<div class="ob-plate-row" data-reveal><div><p class="ob-kick">Série 03 · 2023</p><h2 class="ob-h2">Lignes de fuite</h2></div><p>Architecture sans personnages : viaducs, façades, escaliers. Les volumes seulement, et l'heure à laquelle ils se taisent.</p><p class="ob-go"><a href="/portfolio#architecture">Voir l'architecture</a></p></div></div></section>`),
  sec(`<section class="ob-plate ob-plate--edge pk-bleed" data-lbset="accueil">${fr("maree", "ob-plate-img")}<div class="ob-wrap"><p class="ob-edgecap" data-reveal>Marée descendante, baie de Somme, 2022 — format panoramique 2:1.</p></div></section>`),
  sec(`<section class="ob-now pk-bleed"><div class="ob-wrap"><p class="ob-kick" data-reveal>En ce moment</p>
    <dl class="ob-dl">
      <div data-reveal><dt>Exposition</dt><dd><b>Brume d'Aubrac</b> Galerie Hélios, Lyon<time>12 mars — 4 mai 2027</time></dd></div>
      <div data-reveal><dt>Parution</dt><dd><b>Visages d'hiver</b> Livre-objet, 96 pages, éditions du Passage<time>Automne 2026</time></dd></div>
      <div data-reveal><dt>Atelier</dt><dd><b>Lire une lumière</b> Stage de deux jours à Lyon, huit places<time>Sur demande</time></dd></div>
    </dl></div></section>`),
  sec(`<section class="ob-close pk-bleed"><div class="ob-wrap"><p class="ob-lede ob-lede--s" data-reveal>Une édition, une commande, une question&nbsp;?</p><p class="ob-bigl" data-reveal><a href="/contact">Écrire à l'atelier</a></p><p class="ob-meta" data-reveal>Réponse sous quelques jours. Rien n'est vendu en ligne : chaque tirage se discute.</p></div></section>`),
  sec(footer(c)),
];

// ---------- PORTFOLIO ----------
const portfolio = (c) => [sec(header(c)), top("Portfolio", "Séries", "Quatorze images choisies parmi quatre séries. Cliquez sur une image : elle passe en plein écran, avec les flèches du clavier ou au glissement."),
  sec(`<section class="ob-folio pk-bleed" data-lbset="portfolio"><div class="ob-wrap"><div class="ob-filters" role="group" aria-label="Filtrer par genre"><a href="#tout" data-filter="tout" class="is-on" aria-current="true">Tout</a>${GENRES.map(([k, l]) => `<a href="#${k}" data-filter="${k}">${l}</a>`).join("")}<span class="ob-count" data-count aria-live="polite">14 images</span></div>
    <div class="ob-mason">${W.map((w) => fr(w.k, "ob-mason-i")).join("")}</div></div></section>`),
  sec(`<section class="ob-close ob-close--s pk-bleed"><div class="ob-wrap"><p class="ob-meta" data-reveal>Chaque image existe en édition limitée.</p><p class="ob-bigl ob-bigl--s" data-reveal><a href="/tirages">Voir les tirages</a></p></div></section>`),
  sec(footer(c))];

// ---------- SÉRIE (détail) ----------
const serie = (c) => [sec(header(c)),
  sec(`<section class="ob-top ob-top--serie pk-bleed"><p class="ob-kick" data-reveal>Série 01 · 2022 — 2024</p><div class="ob-h1" role="heading" aria-level="1" data-reveal>Brume d'Aubrac</div>
    <div class="ob-serie-meta"><p data-reveal>Trois hivers sur le plateau de l'Aubrac, toujours avant le lever du soleil. Une photographie par sortie, parfois aucune. La brume n'est pas un effet : c'est le sujet, ce qui efface et ce qui reste.</p>
    <dl class="ob-spec" data-reveal><div><dt>Images</dt><dd>5 + 1 panorama</dd></div><div><dt>Lieux</dt><dd>Aubrac, baie de Somme, Maroc</dd></div><div><dt>Prise de vue</dt><dd>Numérique moyen format</dd></div><div><dt>Tirage</dt><dd>Pigmentaire, édition de 12</dd></div></dl></div></section>`),
  sec(`<section class="ob-s pk-bleed" data-lbset="serie"><div class="ob-wrap">${fr("brume", "ob-s-full")}
    <p class="ob-note" data-reveal>La série commence ici : la première image après une semaine de pluie. J'ai attendu quarante minutes pour que le soleil ne soit qu'un point.</p></div></section>`),
  sec(`<section class="ob-s ob-s--duo pk-bleed" data-lbset="serie"><div class="ob-wrap ob-duo">${fr("foret", "ob-s-a")}${fr("nuit", "ob-s-b")}</div></section>`),
  sec(`<section class="ob-s ob-s--edge pk-bleed" data-lbset="serie">${fr("maree", "ob-s-full")}<div class="ob-wrap"><p class="ob-note ob-note--r" data-reveal>Hors du plateau, mais de la même famille : l'eau qui se retire fait la même chose que la brume qui se lève.</p></div></section>`),
  sec(`<section class="ob-s ob-s--off pk-bleed" data-lbset="serie"><div class="ob-wrap ob-off"><p class="ob-note" data-reveal>Dernière image de la série, tournée au Maroc en décembre. Le sable, enfin, au lieu de la brume.</p>${fr("dune", "ob-s-c")}</div></section>`),
  sec(`<section class="ob-tech pk-bleed"><div class="ob-wrap ob-tech-in"><div data-reveal><p class="ob-kick">Fiche technique</p><h2 class="ob-h2">Comment c'est fait</h2></div>
    <ul class="ob-facts" data-reveal><li><b>Capteur</b>Numérique moyen format, 100 mégapixels, déclenché au câble.</li><li><b>Optiques</b>Focales fixes de 45, 80 et 110 mm ; jamais de zoom.</li><li><b>Développement</b>Fichiers RAW, ajustements de courbe et de contraste uniquement.</li><li><b>Tirage</b>Papier coton 350 g, encres pigmentaires, signé et numéroté au dos.</li></ul></div></section>`),
  sec(`<section class="ob-next pk-bleed"><div class="ob-wrap ob-next-in"><a class="ob-next-l" href="/portfolio#portraits" data-reveal><span>Série suivante</span>Visages d'hiver</a><a class="ob-next-l" href="/tirages" data-reveal><span>Cette série en tirage</span>Demander une édition</a></div></section>`),
  sec(footer(c))];

// ---------- À PROPOS ----------
const apropos = (c) => [sec(header(c)), top("À propos", "Anselme Dray", "Photographe indépendant, basé à Lyon. Né en 1984, autodidacte jusqu'à trente ans, puis dix ans de commandes d'architecture avant de revenir à ses propres séries."),
  sec(`<section class="ob-about pk-bleed" data-lbset="apropos"><div class="ob-wrap ob-about-in"><div class="ob-about-fig">${fr("portB", "ob-about-img", { href: "/apropos" })}<p class="ob-cap">Autoportrait, contre-jour. Atelier Obscura, 2025.</p></div>
    <div class="ob-about-txt"><h2 class="ob-h2" data-reveal>Une manière de faire</h2><p data-reveal>Je travaille lentement et avec peu de matériel : une chambre moyen format, trois focales fixes, un pied lourd. Une sortie donne en général une photographie, parfois aucune.</p><p data-reveal>Je ne mets pas en scène. J'attends que la lumière fasse une phrase, puis je me tais. Les portraits se font chez les gens, à la fenêtre, sans consigne de pose.</p><p data-reveal>Les tirages sont faits à Lyon, sous mes yeux. Chaque édition est limitée à douze exemplaires, signée et numérotée.</p>
    <h2 class="ob-h2" data-reveal>Parcours</h2>
    <table class="ob-tbl" data-reveal><caption class="ob-sr">Expositions et parutions</caption><thead><tr><th>Année</th><th>Lieu</th><th>Intitulé</th></tr></thead><tbody>
      <tr><td data-l="Année">2027</td><td data-l="Lieu">Galerie Hélios, Lyon</td><td data-l="Intitulé">Exposition personnelle, Brume d'Aubrac</td></tr>
      <tr><td data-l="Année">2026</td><td data-l="Lieu">Éditions du Passage</td><td data-l="Intitulé">Livre-objet, Visages d'hiver</td></tr>
      <tr><td data-l="Année">2025</td><td data-l="Lieu">Festival Lumières Hautes, Grenoble</td><td data-l="Intitulé">Exposition collective, section Portrait</td></tr>
      <tr><td data-l="Année">2024</td><td data-l="Lieu">Ateliers du Pont, Millau</td><td data-l="Intitulé">Résidence de trois semaines</td></tr>
      <tr><td data-l="Année">2021</td><td data-l="Lieu">Prix Jeune Regard</td><td data-l="Intitulé">Mention pour la série Lignes de fuite</td></tr></tbody></table>
    <h2 class="ob-h2" data-reveal>Commandes</h2>
    <ul class="ob-facts" data-reveal><li><b>Architecture</b>Livraisons de chantier, dossiers de concours, éditions d'agence.</li><li><b>Portrait</b>Portraits d'artistes, d'artisans et de chercheurs, chez eux.</li><li><b>Édition</b>Couvertures, séries pour la presse, livres.</li><li><b>Transmission</b>Stages de deux jours sur la lumière, en petit groupe.</li></ul>
    <p class="ob-go" data-reveal><a href="/contact">Parler d'une commande</a></p></div></div></section>`),
  sec(footer(c))];

// ---------- TIRAGES ----------
const eds = [["brume", "Baryté mat 310 g", "40 × 50 · 60 × 80 · 90 × 120"], ["portA", "Coton texturé 350 g", "30 × 40 · 50 × 60 · 60 × 80"], ["arches", "Baryté mat 310 g", "40 × 50 · 60 × 80 · 90 × 120"], ["maree", "Fine art lisse 300 g", "40 × 80 · 60 × 120 · 90 × 180"], ["absA", "Coton texturé 350 g", "40 × 40 · 60 × 60 · 80 × 80"], ["facade", "Fine art lisse 300 g", "30 × 40 · 50 × 60 · 60 × 80"]];
const tirages = (c) => [sec(header(c)), top("Tirages & éditions", "Des tirages signés", "Chaque image est tirée en douze exemplaires et trois épreuves d'artiste. Aucun achat en ligne : on en parle, on choisit un format, un papier, puis je vous réponds."),
  sec(`<section class="ob-eds pk-bleed" data-lbset="tirages"><div class="ob-wrap ob-eds-in">${eds.map(([k, p, f]) => `<article class="ob-ed" data-reveal>${fr(k, "ob-ed-img")}<div class="ob-ed-txt"><h3>${esc(WK[k].t)}</h3><p class="ob-ed-meta">Édition de 12 + 3 EA · ${esc(p)}</p><p class="ob-ed-f">${esc(f)} cm</p><p class="ob-ed-p">Tarif communiqué sur demande</p><a class="ob-link" href="/contact">Demander cette édition</a></div></article>`).join("")}</div></section>`),
  sec(`<section class="ob-scale pk-bleed" data-scale><div class="ob-wrap ob-scale-in"><div class="ob-scale-txt" data-reveal><p class="ob-kick">Choisir un format</p><h2 class="ob-h2">À l'échelle d'un mur</h2><p>Un mur de 2,6 m de haut, une personne de 1,70 m. Choisissez un format pour voir ce qu'il représente, et à quelle distance il se regarde le mieux.</p>
      <div class="ob-fmts" role="group" aria-label="Format du tirage"><a href="#f30" data-w="30" data-h="40">30 × 40</a><a href="#f50" data-w="50" data-h="60" class="is-on" aria-current="true">50 × 60</a><a href="#f60" data-w="60" data-h="80">60 × 80</a><a href="#f90" data-w="90" data-h="120">90 × 120</a><a href="#f120" data-w="120" data-h="160">120 × 160</a></div>
      <p class="ob-readout" data-readout aria-live="polite">Format 50 × 60 cm · à regarder depuis 1,2 m environ.</p><p class="ob-go"><a href="/contact">Demander ce format</a></p></div>
    <div class="ob-wall" aria-hidden="true"><div class="ob-frame" data-frame>${ph("dune")}</div><svg class="ob-person" viewBox="0 0 60 170"><circle cx="30" cy="16" r="12" fill="currentColor"/><path d="M12 38h36l6 70h-9l-2 62H34V112h-8v58H17l-2-62H6z" fill="currentColor"/></svg><span class="ob-floor"></span></div></div></section>`),
  sec(`<section class="ob-papers pk-bleed"><div class="ob-wrap"><h2 class="ob-h2" data-reveal>Les papiers</h2>
    <table class="ob-tbl" data-reveal><caption class="ob-sr">Papiers disponibles</caption><thead><tr><th>Papier</th><th>Rendu</th><th>Convient à</th></tr></thead><tbody>
      <tr><td data-l="Papier">Baryté mat 310 g</td><td data-l="Rendu">Noirs profonds, grain doux</td><td data-l="Convient à">Portraits, architecture</td></tr>
      <tr><td data-l="Papier">Coton texturé 350 g</td><td data-l="Rendu">Surface vivante, couleurs feutrées</td><td data-l="Convient à">Paysages, abstraits</td></tr>
      <tr><td data-l="Papier">Fine art lisse 300 g</td><td data-l="Rendu">Détail maximal, blancs nets</td><td data-l="Convient à">Panoramiques, façades</td></tr></tbody></table></div></section>`),
  sec(`<section class="ob-faq pk-bleed"><div class="ob-wrap ob-faq-in"><h2 class="ob-h2" data-reveal>Questions</h2><div>
    <details data-reveal><summary>Comment commander ?</summary><p>Par le formulaire de contact : indiquez l'édition, le format et le papier. Je réponds avec la disponibilité, le tarif et le délai. Aucun paiement n'est demandé sur ce site.</p></details>
    <details data-reveal><summary>Que contient un tirage ?</summary><p>L'image sur papier d'art avec une marge blanche, signée et numérotée au dos, accompagnée d'un certificat d'authenticité.</p></details>
    <details data-reveal><summary>L'encadrement est-il possible ?</summary><p>Oui, avec un atelier partenaire lyonnais : cadre bois ou aluminium, verre anti-reflets. Sur demande uniquement.</p></details>
    <details data-reveal><summary>Et pour l'expédition ?</summary><p>Les tirages voyagent à plat ou roulés, assurés. Les modalités se précisent au moment de la commande.</p></details></div></div></section>`),
  sec(footer(c))];

// ---------- JOURNAL ----------
const posts = [
  ["12 oct. 2026", "Terrain", "4 h 12, la ferme avant le jour", "nuit", "J'ai passé trois nuits à guetter cette fenêtre. Le matin, elle s'est allumée à 4 h 12, juste avant le chien. Trente secondes de pose, la lune dans le dos, et la sensation d'avoir assisté à une confidence."],
  ["28 sept. 2026", "Atelier", "Pourquoi je tire encore à la main", "absB", "Un tirage se décide à la table de lumière : trois degrés de contraste, un quart d'heure de séchage, un nouveau regard sur chaque image. L'écran ne ment pas, mais il pardonne trop."],
  ["9 sept. 2026", "Portrait", "Photographier un visage sans sourire forcé", "portC", "Je ne demande jamais de sourire. Je demande de raconter une journée ordinaire, et je déclenche quand la personne oublie qu'elle est regardée. Cela prend en général neuf minutes."],
  ["14 août 2026", "Architecture", "Trois heures sous un viaduc", "arches", "Un viaduc change de couleur toutes les dix minutes. La seule vraie difficulté est de ne pas bouger, et de décider laquelle de ces couleurs sera la bonne."],
  ["2 juil. 2026", "Tirages", "Choisir un papier : baryté, coton ou fine art", "dune", "Le baryté aime les noirs, le coton aime les teintes douces, le fine art aime le détail. Aucun n'est meilleur ; chacun répond à une image différente."],
  ["19 févr. 2026", "Terrain", "Carnet de brume, Aubrac, janvier", "foret", "Notes de février : moins douze au lever, mille mètres de dénivelé, deux photographies conservées sur quarante déclenchements. Le reste, c'est de la marche."],
];
const journal = (c) => [sec(header(c)), top("Journal", "Carnet", "Notes de terrain, d'atelier et de tirage. Une entrée tous les mois environ."),
  sec(`<section class="ob-jr pk-bleed"><div class="ob-wrap"><ol class="ob-jlist">${posts.map(([d, tag, t, k, p]) => `<li data-reveal><details><summary><time>${d}</time><span class="ob-jt">${esc(t)}</span><em>${tag}</em><i class="ob-plus" aria-hidden="true"></i></summary><div class="ob-jbody"><div class="ob-jthumb">${ph(k)}</div><p>${esc(p)}</p><p class="ob-go"><a href="/portfolio">Voir les images</a></p></div></details></li>`).join("")}</ol></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), top("Contact", "Écrire", "Commande, tirage, atelier ou simple question : un message suffit, je réponds en général sous quelques jours."),
  { type: "form", heading: "Votre message", intro: "Précisez l'image ou l'édition concernée, et le format souhaité s'il s'agit d'un tirage." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), top("Recherche", "Chercher", "Une image, une série, une note du carnet."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)),
  sec(`<section class="ob-lost pk-bleed" data-lbset="perdu">${ph("absA")}<div class="ob-lost-t"><div class="ob-h1" role="heading" aria-level="1">Image introuvable</div><p class="ob-sub">Cette page n'existe pas ou a changé d'adresse.</p><p class="ob-go"><a href="/">Revenir à l'accueil</a></p></div></section>`), sec(footer(c))];

module.exports = {
  key: "obscura", name: "Obscura", version: "2.0.0", category: "agence", tags: ["minimaliste", "editorial", "sombre"], siteType: "Photographe professionnel", featured: false,
  concept: "Une salle noire où l'image est seule : un plein écran, deux étiquettes dans les coins, une planche-contact filtrable et une visionneuse au clavier et au doigt.",
  description: "Portfolio de photographe : une image plein écran, navigation en deux coins, planche-contact en colonnes filtrable par genre, page de série, tirages en édition limitée avec échelle de mur, journal, visionneuse plein écran.",
  brand: "Obscura — Anselme Dray", modules: ["formulaires", "recherche"],
  dna: { header: "etiquettes-de-coin-et-index-plein-ecran", hero: "image-unique-plein-ecran-legende-basse", grid: "planche-contact-en-colonnes", motion: "fondu-lent-et-derive-de-l-image", shapes: "cadres-nus-angles-droits-grain-de-film", rhythm: "une-image-par-ecran", signature: "visionneuse-plein-ecran-legendee" },
  tokens: {
    colors: { primary: "#ece8e0", secondary: "#0d0e0f", accent: "#e0553a", background: "#131415", surface: "#1b1c1e", text: "#ece8e0", muted: "#9b978e", success: "#6fbf8a", warning: "#d9a441", error: "#e5645a" },
    fonts: { heading: "font.instrument-serif", body: "font.inter-tight", button: "font.inter-tight", link: "font.inter-tight" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2c2d30" },
    type: { h1: { size: 96, weight: 400, lineHeight: 1, transform: "none" }, h2: { size: 48, weight: 400, lineHeight: 1.05, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge de laboratoire", type: "color", default: "#e0553a" },
    { key: "mode", label: "Ambiance", type: "choice", default: "nuit", choices: [["nuit", "Salle noire"], ["papier", "Mur clair"]] },
    { key: "grain", label: "Grain de film", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Aucun"]] },
    { key: "legendes", label: "Légendes de la planche", type: "choice", default: "dessous", choices: [["dessous", "Sous l'image"], ["survol", "Au survol"]] },
    { key: "drift", label: "Dérive lente du plein écran", type: "choice", default: "on", choices: [["on", "Active"], ["off", "Image fixe"]] },
  ],
  menu: [["Accueil", "/"], ["Séries", "/portfolio"], ["À propos", "/apropos"], ["Tirages", "/tirages"], ["Journal", "/journal"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "portfolio", name: "Séries", render: portfolio }, { key: "serie", name: "Série", render: serie },
    { key: "apropos", name: "À propos", render: apropos }, { key: "tirages", name: "Tirages", render: tirages }, { key: "journal", name: "Journal", render: journal },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
