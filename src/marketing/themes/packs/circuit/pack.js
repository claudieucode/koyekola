// Circuit — matériel grand public (enceinte nomade fictive « Tonda »). Direction artistique : rendu produit en lumière de studio, planches de bureau d'études (cotes, repères, cartouche).
// Gris-blanc dégradé, objet dessiné en SVG (ombres douces), accent unique orange sécurité. Le produit entier se démonte au défilement ; une caractéristique = un plein écran épinglé.
const { sec, form, esc } = require("../kit");

const r1 = (v) => Math.round(v * 10) / 10;
const gauss = (u, m, s) => Math.exp(-(((u - m) / s) ** 2));

// ---------- Dessin : cylindres éclairés (pas de dégradé SVG possible : on cumule des bandes translucides) ----------
function shade(rx, ry, h, n) {
  const g = {};
  for (let i = 0; i < n; i++) {
    const x0 = -rx + (2 * rx * i) / n, x1 = Math.min(rx, -rx + (2 * rx * (i + 1)) / n + 0.6), u = (x0 + x1) / 2 / rx;
    const b = 0.5 - 0.46 * u + 0.3 * gauss(u, -0.52, 0.1) - 0.1 * gauss(u, 0.86, 0.09);
    const d = b - 0.5, a = Math.round(Math.abs(d) * (d > 0 ? 0.95 : 0.8) * 25) / 25;
    if (a < 0.03) continue;
    const yb = (x) => h + ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
    const k = (d > 0 ? "#fff" : "#000") + "|" + a;
    (g[k] = g[k] || []).push(`M${r1(x0)} 0V${r1(yb(x0))}L${r1(x1)} ${r1(yb(x1))}V0Z`);
  }
  return Object.entries(g).map(([k, v]) => { const [c, a] = k.split("|"); return `<path fill="${c}" opacity="${a}" d="${v.join("")}"/>`; }).join("");
}
// arc de la face avant d'un cylindre, entre deux abscisses, à la hauteur y (0 = haut)
const front = (rx, ry, y, x0, x1) => { const f = (x) => r1(y + ry * Math.sqrt(1 - (x / rx) ** 2)); return `M${x0} ${f(x0)}A${rx} ${ry} 0 0 0 ${x1} ${f(x1)}`; };
const band = (rx, ry, y0, y1) => `M${-rx} ${y0}A${rx} ${ry} 0 0 0 ${rx} ${y0}V${y1}A${rx} ${ry} 0 0 1 ${-rx} ${y1}Z`;
function cyl({ rx, ry, h, cls, topCls, n = 20, extra = "", topExtra = "" }) {
  const side = `M${-rx} 0V${h}A${rx} ${ry} 0 0 0 ${rx} ${h}V0Z`;
  const sheen = [0.86, 0.64, 0.44, 0.26].map((k) => `<ellipse cx="${r1(-rx * 0.1 * (1 - k))}" cy="${r1(-ry * 0.12 * (1 - k))}" rx="${r1(rx * k)}" ry="${r1(ry * k)}" fill="#fff" opacity=".045"/>`).join("");
  return `<path class="${cls}" d="${side}"/>${extra}${shade(rx, ry, h, n)}<ellipse class="${topCls || cls}" rx="${rx}" ry="${ry}"/>${sheen}${topExtra}<ellipse rx="${rx}" ry="${ry}" fill="none" stroke="#fff" opacity=".5" stroke-width="1.2"/>`;
}
const dots = (rx, ry, ks, w = 3.2, op = 0.4) => ks.map((k) => `<ellipse rx="${r1(rx * k)}" ry="${r1(ry * k)}" fill="none" stroke="#000" opacity="${op}" stroke-width="${w}" class="cx-dt"/>`).join("");

// ---------- Les cinq pièces de l'éclaté (centre x = 500, hauteur compacte 290 → 590) ----------
const LAYERS = [
  { i: 1, y: 290, s: -200, side: "r", mid: 50, rx: 135 },
  { i: 2, y: 390, s: -105, side: "l", mid: 12, rx: 128 },
  { i: 3, y: 416, s: -8, side: "r", mid: 5, rx: 128 },
  { i: 4, y: 430, s: 90, side: "l", mid: 35, rx: 118 },
  { i: 5, y: 520, s: 190, side: "r", mid: 31, rx: 135 },
];
const body = {
  1: () => cyl({ rx: 135, ry: 36, h: 100, cls: "cx-shell", n: 22,
    extra: [30, 52, 74].map((y) => `<path d="${front(135, 36, y, -131, 131)}" fill="none" stroke="#000" opacity=".38" stroke-width="3.4" class="cx-dt"/>`).join("") + `<path class="cx-trim" d="${band(135, 36, 90, 96)}"/>`,
    topExtra: dots(135, 36, [0.9, 0.76, 0.62, 0.48, 0.34, 0.2]) + `<ellipse rx="8" ry="2.2" class="cx-trim" cy="-1"/>` }),
  2: () => cyl({ rx: 128, ry: 34, h: 24, cls: "cx-metal", n: 18,
    topExtra: `<ellipse rx="84" ry="22.3" fill="#12161a"/><ellipse rx="84" ry="22.3" fill="none" stroke="#fff" opacity=".3" stroke-width="1.2"/><ellipse rx="72" ry="19" fill="none" stroke="#fff" opacity=".12"/>` +
      [35, 145, 215, 325].map((t) => `<circle cx="${r1(106 * Math.cos((t * Math.PI) / 180))}" cy="${r1(28 * Math.sin((t * Math.PI) / 180))}" r="3.6" fill="#12161a"/>`).join("") + `<circle cy="-28" r="3.4" class="cx-trim"/>`,
    extra: `<path d="${front(128, 34, 12, -52, 52)}" fill="none" class="cx-trimS" stroke-width="3.6" stroke-linecap="round"/>` }),
  3: () => cyl({ rx: 128, ry: 33, h: 10, cls: "cx-pcb", topCls: "cx-pcb2", n: 16,
    topExtra: `<g transform="scale(1 .258)"><circle r="108" fill="none" class="cx-d65" stroke="#6f93a6" stroke-width="3"/><path d="M26 0h44v-34h34M-26 14h-48v38h-22M0 26v54M0 -26v-60h36" fill="none" stroke="#6f93a6" stroke-width="3"/>` +
      `<rect x="-26" y="-26" width="52" height="52" rx="5" fill="#0f1418"/><rect x="-26" y="-26" width="52" height="52" rx="5" fill="none" class="cx-d34" stroke="#b8c4cc" stroke-width="5"/>` +
      `<rect x="52" y="-44" width="30" height="24" rx="3" fill="#0f1418"/><rect x="-96" y="10" width="34" height="26" rx="3" fill="#0f1418"/><rect x="-14" y="64" width="28" height="18" rx="2" fill="#c9d0d6"/>` +
      `<circle cx="-62" cy="-62" r="7" class="cx-trim"/><circle cx="74" cy="48" r="6" fill="#d8b26a"/><circle cx="-34" cy="64" r="6" fill="#d8b26a"/><circle cx="96" cy="-8" r="5" fill="#d8b26a"/>` +
      `<path d="M-100 -30h26v-16h-12v-14h26v30h-14" fill="none" stroke="#d8b26a" stroke-width="3"/></g>` }),
  4: () => cyl({ rx: 118, ry: 31, h: 70, cls: "cx-cell", n: 20, extra: `<path class="cx-trim" d="${band(118, 31, 22, 46)}"/>`,
    topExtra: `<ellipse rx="96" ry="25" fill="#2a3036"/><rect x="-60" y="-5" width="36" height="9" rx="2" class="cx-trim"/><rect x="24" y="-5" width="36" height="9" rx="2" fill="#c9d0d6"/><path d="M-24 0h48" stroke="#c9d0d6" stroke-width="3"/>` }),
  5: () => `<ellipse cy="78" rx="150" ry="30" fill="#000" opacity=".05"/><ellipse cy="78" rx="128" ry="24" fill="#000" opacity=".07"/><ellipse cy="78" rx="104" ry="18" fill="#000" opacity=".1"/><ellipse cy="76" rx="80" ry="12" fill="#000" opacity=".12"/>` +
    cyl({ rx: 135, ry: 36, h: 62, cls: "cx-foot", n: 20, extra: `<path class="cx-trim" d="${band(135, 36, 4, 8)}"/>`,
      topExtra: `<ellipse rx="112" ry="29.8" fill="#1a1f24"/><ellipse rx="88" ry="23.4" fill="#2d343b"/><ellipse rx="64" ry="17" fill="#1a1f24"/><ellipse rx="26" ry="7" fill="#3a434b"/><ellipse rx="26" ry="7" fill="none" stroke="#fff" opacity=".3"/><ellipse rx="88" ry="23.4" fill="none" stroke="#fff" opacity=".22"/>` }),
};
function layerSvg(L, withLead = true) {
  const sg = L.side === "r" ? 1 : -1, x0 = sg * (L.rx + 10), x1 = sg * (L.rx + 80);
  const lead = withLead ? `<g class="cx-ld is-on cx-${L.side}"><line x1="${x0}" y1="${L.mid}" x2="${x1}" y2="${L.mid}"/><circle cx="${x0}" cy="${L.mid}" r="3.4"/><circle cx="${x1}" cy="${L.mid}" r="2.6" class="cx-ldot"/></g>` : "";
  const dim = L.i === 5 && withLead ? `<g class="cx-dimD"><path d="M-135 124H135M-135 114v20M135 114v20" fill="none"/></g>` : "";
  return `<g transform="translate(500 ${L.y})" class="cx-l cx-l${L.i}"><g class="cx-m">${body[L.i]()}${lead}${dim}</g></g>`;
}
const explodedSvg = () => `<svg class="cx-svg" viewBox="0 0 1000 860" role="img" aria-label="Vue éclatée de l'enceinte Tonda T1 : coque, capteurs, carte, batterie, transducteur"><path class="cx-axis" d="M500 24V850"/><g class="cx-dimH"><path d="M300 254V626M290 254h20M290 626h20" fill="none"/></g>${LAYERS.map((L) => layerSvg(L)).join("")}</svg>`;

// Enceinte assemblée, petit format (vignettes du comparateur, 404, accessoires)
function miniSvg(k = 1, label = "Enceinte Tonda") {
  const c = (rx, h, cls, ex = "") => ({ rx: r1(rx * k), ry: r1(rx * k * 0.27), h: r1(h * k), cls, ex });
  const parts = [[c(66, 26, "cx-foot"), 112], [c(62, 10, "cx-metal"), 90], [c(66, 56, "cx-shell"), 40]];
  const top0 = 40;
  return `<svg class="cx-mini" viewBox="0 0 220 190" role="img" aria-label="${esc(label)}"><ellipse cx="110" cy="${r1(164 - (1 - k) * 8)}" rx="${r1(86 * k)}" ry="${r1(14 * k)}" fill="#000" opacity=".07"/>${parts.map(([p, y]) => `<g transform="translate(110 ${r1(top0 + (y - 40) * k + (1 - k) * 60)})">${cyl({ rx: p.rx, ry: p.ry, h: p.h, cls: p.cls, n: 12, topExtra: p.cls === "cx-shell" ? dots(p.rx, p.ry, [0.8, 0.55, 0.3], 2.4, 0.35) : "" })}</g>`).join("")}</svg>`;
}

// ---------- Éléments communs ----------
const COL = [["graphite", "Graphite"], ["givre", "Givre"], ["brume", "Brume"], ["signal", "Signal"]];
const swatches = (cls = "") => `<div class="cx-sw ${cls}" role="group" aria-label="Choisir le coloris">${COL.map(([k, l], i) => `<a href="#coloris-${k}" role="button" data-col="${k}" aria-pressed="${i === 0}"><i class="cx-sw-${k}"></i><span>${l}</span></a>`).join("")}</div>`;
const arrow = `<svg class="cx-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const logo = `<svg class="cx-lg" viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="7" rx="11" ry="4" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="16" cy="16" rx="11" ry="4" fill="none" stroke="currentColor" stroke-width="1.8" opacity=".7"/><ellipse cx="16" cy="25" rx="11" ry="4" fill="currentColor"/><path d="M16 1v30" class="cx-d32" stroke="#ff6a13" stroke-width="1.6"/></svg>`;
const tabsHtml = (c) => c.menu.map(({ label, url }, i) => `<a class="cx-tab" href="${esc(url)}"><i>0${i + 1}</i>${esc(label)}</a>`).join("");

const header = (c) => `<header class="cx-head pk-bleed"><div class="cx-bar">
  <a class="cx-logo" href="/" aria-label="${esc(c.brand)}, accueil">${logo}<span><b>circuit</b><small>audio lab</small></span></a>
  <div class="cx-tabs" role="navigation" aria-label="Navigation principale">${tabsHtml(c)}</div>
  <p class="cx-rev" aria-hidden="true">Tonda T1 · rév. B</p>
  <details class="cx-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cx-drawer" role="navigation" aria-label="Menu mobile">${tabsHtml(c)}</div></details>
</div></header>`;

const footer = (c) => `<footer class="cx-foot pk-bleed"><div class="cx-wrap"><div class="cx-foot-grid">
  <div><a class="cx-logo cx-logo--f" href="/" aria-label="Accueil">${logo}<span><b>circuit</b><small>audio lab</small></span></a><p class="cx-foot-lead">Des objets que l'on peut ouvrir des yeux, avant de les posséder.</p><address>Atelier Circuit · 21 quai des Forges<br>44000 Nantes</address></div>
  <div><h3>Produit</h3><a href="/caracteristiques">Caractéristiques</a><a href="/comparer">Comparer</a><a href="/accessoires">Accessoires</a></div>
  <div><h3>Aide</h3><a href="/assistance">Assistance</a><a href="/contact">Contact</a><a href="/recherche">Recherche</a></div>
  <dl class="cx-cart" aria-label="Cartouche"><div><dt>Projet</dt><dd>Tonda T1</dd></div><div><dt>Échelle</dt><dd>1 : 2</dd></div><div><dt>Cotes</dt><dd>mm</dd></div><div><dt>Rév.</dt><dd>B</dd></div></dl></div>
  <p class="cx-legal">© Circuit Audio Lab. Site de démonstration : appareil, chiffres et société fictifs.</p></div></footer>`;

const pagehead = (sheet, kicker, title, sub) => sec(`<section class="cx-ph pk-bleed"><div class="cx-wrap cx-ph-in"><div><p class="cx-kicker" data-reveal>${esc(kicker)}</p><div class="cx-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="cx-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>
  <dl class="cx-cart cx-cart--ph" aria-hidden="true"><div><dt>Planche</dt><dd>${sheet}</dd></div><div><dt>Échelle</dt><dd>1 : 2</dd></div><div><dt>Rév.</dt><dd>B</dd></div></dl></div></section>`);

// ---------- Données produit ----------
const TAGS = [
  ["01", "Coque", "Aluminium anodisé 1,2 mm · 118 g"],
  ["02", "Capteurs", "4 micros MEMS · proximité · tactile"],
  ["03", "Carte mère", "Ø 88 mm · Bluetooth 5.3 · 4 couches"],
  ["04", "Batterie", "Li-ion 4 800 mAh · 26 h d'écoute"],
  ["05", "Transducteur", "Haut-parleur 58 mm · 40 W · pied"],
];
const tag = (t, i) => `<li class="cx-tag cx-t${i + 1} is-on" data-i="${i + 1}"><b>${t[0]}</b><strong>${t[1]}</strong><span>${t[2]}</span></li>`;

const MODELS = [
  { k: "mini", n: "Tonda Mini", s: 0.78, d: "Format sac à dos" },
  { k: "t1", n: "Tonda T1", s: 1, d: "Le modèle de référence" },
  { k: "max", n: "Tonda Max", s: 1.12, d: "Pour la terrasse" },
];
const SPECS = [
  ["auto", "Autonomie", "h", [18, 26, 40], "hi"],
  ["poids", "Poids", "g", [420, 780, 1300], "lo"],
  ["diam", "Diamètre", "mm", [72, 96, 118], "no"],
  ["grave", "Grave jusqu'à", "Hz", [70, 52, 38], "lo"],
  ["puiss", "Puissance", "W", [20, 40, 80], "hi"],
  ["ip", "Indice IP", "IP", [54, 67, 67], "hi"],
  ["mics", "Micros", "", [2, 4, 6], "hi"],
  ["port", "Portée", "m", [20, 30, 40], "hi"],
];
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// ---------- Planches épinglées : une caractéristique = un plein écran ----------
const PL = [
  { n: "01", k: "Acoustique", t: "Le grave descend jusqu'à 52 Hz.", p: "Un haut-parleur de 58 mm, deux radiateurs passifs et une coque en aluminium qui ne vibre pas : la basse est franche, même à faible volume.", to: 52, from: 200, u: "Hz", lab: "grave à −3 dB", cap: ["20 Hz", "100", "1 k", "10 k", "20 kHz"] },
  { n: "02", k: "Énergie", t: "Vingt-six heures sans prise.", p: "Une cellule Li-ion de 4 800 mAh et un processeur sobre. Quinze minutes de charge USB-C suffisent pour quatre heures d'écoute.", to: 26, from: 0, u: "h", lab: "d'écoute continue", cap: ["0 h", "5", "10", "15", "20", "26 h"] },
  { n: "03", k: "Connexion", t: "Trente mètres, deux téléphones.", p: "Bluetooth 5.3 multipoint : deux appareils restent appairés, le son suit celui qui joue. Aucune application obligatoire.", to: 30, from: 0, u: "m", lab: "de portée en champ libre", cap: ["10 m", "20 m", "30 m"] },
  { n: "04", k: "Capteurs", t: "Quatre micros, une seule oreille.", p: "Un réseau de quatre micros MEMS isole la voix, annule l'écho de la pièce et règle le volume selon le bruit ambiant.", to: 4, from: 0, u: "micros", lab: "en réseau directif", cap: ["Avant", "Droite", "Arrière", "Gauche"] },
  { n: "05", k: "Robustesse", t: "Étanche IP67, chute de 1,5 m.", p: "Joints moulés, ports obturés, coque anodisée : l'enceinte supporte pluie, poussière et chutes sur carrelage. Testée avant chaque lot.", to: 1.5, from: 0, u: "m", dec: 1, lab: "de chute supportée", cap: ["Sol", "0,5 m", "1 m", "1,5 m"] },
];
const wedge = (cx, cy, r, a, w) => { const p = (t) => [r1(cx + r * Math.cos((t * Math.PI) / 180)), r1(cy + r * Math.sin((t * Math.PI) / 180))]; const [x0, y0] = p(a - w), [x1, y1] = p(a + w); return `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}Z`; };
const VIS = [
  () => `<svg viewBox="0 0 520 330" class="cx-vis" role="img" aria-label="Courbe de réponse en fréquence de 20 Hz à 20 kHz">${[50, 98, 146, 194, 242].map((y) => `<path d="M40 ${y}H500" class="cx-gr"/>`).join("")}${[40, 130, 220, 310, 400, 490].map((x) => `<path d="M${x} 30V290" class="cx-gr"/>`).join("")}
    <path d="M40 270C80 268 100 170 150 142C200 124 260 128 320 126C380 124 420 128 450 150C470 164 480 190 492 218V290H40Z" class="cx-area"/><path d="M40 270C80 268 100 170 150 142C200 124 260 128 320 126C380 124 420 128 450 150C470 164 480 190 492 218" class="cx-curve" fill="none"/>
    <rect x="30" y="20" width="480" height="276" class="cx-cover"/><path d="M40 290H500M40 30V290" class="cx-ax"/><path d="M118 40V290" class="cx-cote"/><circle cx="118" cy="170" r="5" class="cx-pt"/><path d="M118 306H492M118 298v16M492 298v16" class="cx-dim"/></svg>`,
  () => `<svg viewBox="0 0 520 330" class="cx-vis" role="img" aria-label="Jauge de batterie : 26 heures"><rect x="40" y="90" width="410" height="150" rx="18" class="cx-ol"/><rect x="450" y="138" width="26" height="54" rx="6" class="cx-ol"/>
    <g class="cx-fillbar"><rect x="54" y="104" width="382" height="122" rx="9" class="cx-bar2"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${54 + (i + 1) * 31.8} 104V226" class="cx-seg"/>`).join("")}</g>
    <path d="M40 276H450M40 266v20M450 266v20M${[1, 2, 3, 4].map((i) => `${40 + i * 78.8} 270v12`).join("M")}" class="cx-dim"/></svg>`,
  () => `<svg viewBox="0 0 520 330" class="cx-vis" role="img" aria-label="Portée Bluetooth : anneaux à 10, 20 et 30 mètres">${[145, 100, 55].map((r, i) => `<circle cx="260" cy="165" r="${r}" class="cx-ring cx-ring${i + 1}"/>`).join("")}<path d="M260 165H405M260 165V20" class="cx-cote"/>
    <circle cx="392" cy="115" r="9" class="cx-ph1 cx-dev"/><circle cx="150" cy="232" r="9" class="cx-ph2 cx-dev"/><circle cx="260" cy="165" r="22" class="cx-core"/><circle cx="260" cy="165" r="6" class="cx-ldot"/></svg>`,
  () => `<svg viewBox="0 0 520 330" class="cx-vis" role="img" aria-label="Quatre micros en réseau directif">${[0, 90, 180, 270].map((a, i) => `<path d="${wedge(260, 165, 150, a - 90, 24)}" class="cx-beam cx-b${i + 1}"/>`).join("")}<circle cx="260" cy="165" r="150" class="cx-ring"/><circle cx="260" cy="165" r="62" class="cx-core"/><circle cx="260" cy="165" r="44" class="cx-hole"/>${[45, 135, 225, 315].map((a) => `<circle cx="${r1(260 + 53 * Math.cos((a * Math.PI) / 180))}" cy="${r1(165 + 53 * Math.sin((a * Math.PI) / 180))}" r="5" class="cx-mic"/>`).join("")}<circle cx="260" cy="165" r="5" class="cx-ldot"/></svg>`,
  () => `<svg viewBox="0 0 520 330" class="cx-vis" role="img" aria-label="Test de chute de 1,5 mètre"><path d="M40 296H480" class="cx-ax"/><path d="M96 50V296M84 50h24M84 296h24" class="cx-dim"/><ellipse cx="290" cy="296" rx="70" ry="10" class="cx-shadow"/>
    <g class="cx-drop"><g transform="translate(290 190)">${cyl({ rx: 52, ry: 14, h: 76, cls: "cx-shell", n: 14, topExtra: dots(52, 14, [0.75, 0.45], 2.2, 0.35) })}</g></g><ellipse cx="290" cy="296" rx="60" ry="9" class="cx-imp cx-imp1"/><ellipse cx="290" cy="296" rx="100" ry="15" class="cx-imp cx-imp2"/></svg>`,
];
const cartIcon = (n) => `<div class="cx-cartouche" aria-hidden="true"><span>Feuille ${n}/05</span><span>Cotes en mm</span></div>`;
const panel = (i) => {
  const d = PL[i];
  return sec(`<section class="cx-panel pk-bleed" data-story="draw">
    <div class="cx-track"><div class="cx-pin cx-pin--panel"><div class="cx-wrap cx-pgrid">
      <div class="cx-ptext"><p class="cx-idx" aria-hidden="true">${d.n}</p><p class="cx-kicker">${d.k}</p><h2 class="cx-h2">${d.t}</h2><p class="cx-lead">${d.p}</p>
        <p class="cx-big"><b data-to="${d.to}" data-from="${d.from}"${d.dec ? ` data-dec="${d.dec}"` : ""}>${d.dec ? String(d.to).replace(".", ",") : d.to}</b><span>${d.u}</span><small>${d.lab}</small></p></div>
      <figure class="cx-plate cx-plate--${i + 1}">${VIS[i]()}<figcaption><ul class="cx-capline">${d.cap.map((x) => `<li>${x}</li>`).join("")}</ul>${cartIcon(d.n.slice(1))}</figcaption></figure>
    </div><div class="cx-rail" aria-hidden="true"><i></i></div></div></div></section>`);
};

// ---------- Accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="cx-hero pk-bleed" data-story="explode"><div class="cx-track"><div class="cx-pin">
    <div class="cx-hero-copy"><p class="cx-kicker">Tonda T1 · enceinte nomade 360°</p><div class="cx-mega" role="heading" aria-level="1">Le son, démonté<br>pièce par pièce.</div>
      <p class="cx-lead">Cinq pièces, aucune zone d'ombre. Faites défiler : l'enceinte s'ouvre sous vos yeux et chaque organe dévoile sa fiche technique.</p>
      <div class="cx-actions"><a class="cx-btn" href="/caracteristiques">Voir les caractéristiques ${arrow}</a><a class="cx-btn cx-btn--line" href="/comparer">Comparer les modèles</a></div></div>
    <div class="cx-stage"><div class="cx-fig">${explodedSvg()}</div>
      <ol class="cx-tags" aria-label="Les pièces de l'enceinte">${TAGS.map(tag).join("")}<li class="cx-tag cx-tH" aria-hidden="true"><strong>H 186</strong></li><li class="cx-tag cx-tD" aria-hidden="true"><strong>Ø 96</strong></li></ol></div>
    <div class="cx-hud"><p class="cx-scrollhint" aria-hidden="true">Défilez pour démonter <b>↓</b></p>${swatches()}</div>
    <div class="cx-rail" aria-hidden="true"><i></i></div></div></div></section>`),
  sec(`<section class="cx-band cx-band--dark pk-bleed"><div class="cx-wrap cx-nums"><div data-reveal><b data-count="5">5</b><span>pièces, toutes visibles</span></div><div data-reveal><b data-count="26">26</b><span>heures d'autonomie</span></div><div data-reveal><b data-count="67">67</b><span>indice de protection IP</span></div><div data-reveal><b data-count="360">360</b><span>degrés de diffusion</span></div></div></section>`),
  panel(0), panel(1), panel(2),
  sec(`<section class="cx-models pk-bleed"><div class="cx-wrap"><div class="cx-sechead"><div><p class="cx-kicker" data-reveal>Trois déclinaisons</p><h2 class="cx-h2" data-reveal>Même conception, trois formats.</h2></div><a class="cx-more" href="/comparer">Comparer en détail ${arrow}</a></div>
    <div class="cx-mgrid">${MODELS.map((m, i) => `<article class="cx-mcard" data-reveal><div class="cx-mfig">${miniSvg(m.s, m.n)}</div><h3>${m.n}</h3><p>${m.d}</p><p class="cx-mk">${SPECS[0][3][i]} h · ${SPECS[1][3][i] >= 1000 ? "1,3 kg" : SPECS[1][3][i] + " g"} · IP${SPECS[5][3][i]}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="cx-cta pk-bleed"><div class="cx-wrap cx-cta-in"><h2 class="cx-h2" data-reveal>Une question avant d'ouvrir la boîte ?</h2><div data-reveal><p class="cx-lead">Dites-nous l'usage que vous imaginez : nous répondons avec la fiche technique qui va avec.</p><a class="cx-btn" href="/contact">Écrire à l'équipe ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

// ---------- Caractéristiques ----------
const caracteristiques = (c) => [
  sec(header(c)),
  pagehead("02/06", "Caractéristiques", "Cinq organes,<br>cinq fiches.", "Chaque plein écran s'anime avec le défilement : le tracé se dessine, la cote s'affiche."),
  panel(0), panel(1), panel(2), panel(3), panel(4),
  sec(`<section class="cx-spec pk-bleed"><div class="cx-wrap"><div class="cx-sechead"><div><p class="cx-kicker" data-reveal>Nomenclature</p><h2 class="cx-h2" data-reveal>Fiche technique complète</h2></div></div>
    <div class="cx-specs">${[
      ["Audio", [["Transducteur", "58 mm, aimant néodyme"], ["Radiateurs passifs", "2, 70 × 40 mm"], ["Puissance", "40 W (2 × 20 W)"], ["Réponse", "52 Hz – 20 kHz"]]],
      ["Énergie", [["Batterie", "Li-ion 4 800 mAh"], ["Autonomie", "26 h à 50 % du volume"], ["Charge", "USB-C, 15 min = 4 h"], ["Veille", "90 jours"]]],
      ["Connexion", [["Bluetooth", "5.3, multipoint ×2"], ["Codecs", "SBC, AAC, LC3"], ["Portée", "30 m en champ libre"], ["Entrée filaire", "Jack 3,5 mm"]]],
      ["Mécanique", [["Matériau", "Aluminium anodisé 1,2 mm"], ["Dimensions", "Ø 96 × H 186 mm"], ["Poids", "780 g"], ["Protection", "IP67, chute 1,5 m"]]],
    ].map(([g, rows]) => `<article class="cx-sgrp" data-reveal><h3>${g}</h3><dl>${rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl></article>`).join("")}</div></div></section>`),
  sec(footer(c)),
];

// ---------- Comparer (composant signature : comparateur + coloris) ----------
const comparer = (c) => [
  sec(header(c)), pagehead("03/06", "Comparer", "Trois formats,<br>une seule famille.", "Choisissez deux ou trois modèles et un coloris : le tableau met en avant la meilleure valeur de chaque ligne."),
  sec(`<section class="cx-cmp pk-bleed" data-cmp><div class="cx-wrap">
    <div class="cx-ctl"><div class="cx-ctl-g"><p class="cx-ctl-l">Modèles à comparer</p><div class="cx-chips" role="group" aria-label="Modèles à comparer">${MODELS.map((m, i) => `<a href="#m-${m.k}" role="button" data-m="${m.k}" aria-pressed="${i !== 0 ? "true" : "true"}" class="is-on">${m.n}</a>`).join("")}</div></div>
      <div class="cx-ctl-g"><p class="cx-ctl-l">Coloris</p>${swatches("cx-sw--ctl")}</div>
      <div class="cx-ctl-g"><p class="cx-ctl-l">Affichage</p><a href="#diff" role="button" class="cx-chip" data-diff aria-pressed="false">Seulement les différences</a></div></div>
    <p class="cx-sr" aria-live="polite" data-cmp-live></p>
    <div class="cx-cards">${MODELS.map((m, mi) => `<article class="cx-cc" data-m="${m.k}" data-n="${m.n}"><div class="cx-ccfig">${miniSvg(m.s, m.n)}</div><h3>${m.n}</h3><p class="cx-cd">${m.d}</p>
      <dl>${SPECS.map(([k, l, u, v, best]) => `<div data-k="${k}" data-hl="${best}"><dt>${l}</dt><dd data-v="${v[mi]}">${u === "IP" ? "IP" + v[mi] : fmt(v[mi]) + (u ? " " + u : "")}</dd></div>`).join("")}</dl></article>`).join("")}</div>
    <div class="cx-recap"><div><p class="cx-ctl-l">Votre sélection</p><p class="cx-recap-t" data-recap aria-live="polite">Tonda Mini, Tonda T1 et Tonda Max — coloris Graphite.</p></div>
      <div class="cx-recap-a"><a class="cx-btn" href="/contact">Demander des informations ${arrow}</a><a class="cx-btn cx-btn--line" href="#copier" role="button" data-copy>Copier le récapitulatif</a></div></div>
    <p class="cx-fine">Démonstration : aucune commande ni réservation n'est enregistrée ici. Pour en savoir plus, écrivez-nous depuis la page Contact et collez votre récapitulatif.</p></div></section>`),
  sec(footer(c)),
];

// ---------- Accessoires ----------
const ACC = [
  ["Étui de transport", "Coque rigide, mousse découpée", "mini t1 max", "rangement", `<rect x="14" y="26" width="52" height="34" rx="8"/><path d="M28 26v-6h24v6M14 42h52"/>`],
  ["Dragonne tressée", "Se clipse sur l'anse, 60 cm", "mini t1", "rangement", `<path d="M40 12c-14 0-22 10-22 22s8 14 22 14 22-2 22-14-8-22-22-22zM40 12v-4"/><circle cx="40" cy="58" r="6"/>`],
  ["Dock de charge", "Recharge par contacts", "t1 max", "energie", `<ellipse cx="40" cy="52" rx="28" ry="8"/><path d="M12 52v-6M68 52v-6M30 46v-20h20v20M40 32v8"/>`],
  ["Câble USB-C tressé", "1,5 m, charge 60 W", "mini t1 max", "energie", `<path d="M14 54c10-24 22 6 36-14 6-8 10-14 16-14M60 20h8v8h-8z"/><circle cx="14" cy="54" r="4"/>`],
  ["Support mural", "Visserie fournie, pivotant", "t1 max", "fixation", `<path d="M20 14v52M20 26h30M20 54h30"/><ellipse cx="54" cy="40" rx="12" ry="14"/>`],
  ["Pied de table", "Réglable de 20 à 45 cm", "mini t1", "fixation", `<ellipse cx="40" cy="62" rx="20" ry="5"/><path d="M40 62V24M30 24h20l-4-10H34z"/>`],
  ["Housse silicone", "Protège des rayures, 6 coloris", "mini t1 max", "protection", `<path d="M22 20h36l4 8v32H18V28z"/><path d="M26 36h28M26 46h28" opacity=".5"/>`],
  ["Télécommande", "Piles boutons, portée 10 m", "t1 max", "controle", `<rect x="28" y="12" width="24" height="56" rx="12"/><circle cx="40" cy="30" r="6"/><path d="M34 46h12M34 54h12"/>`],
];
const accessoires = (c) => [
  sec(header(c)), pagehead("04/06", "Accessoires", "Tout ce qui<br>va autour.", "Filtrez par modèle : seuls les accessoires compatibles restent affichés."),
  sec(`<section class="cx-acc pk-bleed" data-fscope><div class="cx-wrap">
    <div class="cx-ctl"><div class="cx-ctl-g"><p class="cx-ctl-l">Compatible avec</p><div class="cx-chips" role="group" aria-label="Filtrer par modèle"><a href="#tous" role="button" data-f="all" class="is-on" aria-pressed="true">Tous</a>${MODELS.map((m) => `<a href="#f-${m.k}" role="button" data-f="${m.k}" aria-pressed="false">${m.n}</a>`).join("")}</div></div>
      <p class="cx-count" aria-live="polite"><b data-fcount>8</b> accessoires affichés</p></div>
    <ul class="cx-agrid" data-filterable>${ACC.map(([n, d, m, cat, ic]) => `<li class="cx-acard" data-m="${m}" data-reveal><svg viewBox="0 0 80 80" class="cx-aic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ic}</svg><h3>${n}</h3><p>${d}</p><p class="cx-compat">${m.split(" ").map((x) => MODELS.find((o) => o.k === x).n.replace("Tonda ", "")).join(" · ")}</p><a class="cx-more" href="/contact">Se renseigner ${arrow}</a></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

// ---------- Assistance ----------
const SYM = [
  ["son", "Pas de son", ["Vérifiez que l'enceinte est chargée : le voyant avant doit s'allumer.", "Appuyez 3 secondes sur le bouton Bluetooth pour relancer l'appairage.", "Supprimez Tonda de la liste de votre téléphone, puis reconnectez-la.", "Toujours rien ? Réinitialisez (guide ci-dessous) ou écrivez-nous."]],
  ["batterie", "Batterie courte", ["Désactivez l'éclairage du voyant dans les réglages.", "Baissez le volume sous 70 % : l'autonomie double presque.", "Chargez avec un bloc 5 V / 2 A minimum, jamais sur un port de clavier.", "Après un an, la capacité baisse un peu : c'est normal."]],
  ["connexion", "Coupures Bluetooth", ["Éloignez l'enceinte des routeurs Wi-Fi et micro-ondes.", "Gardez moins de 10 m et évitez les murs porteurs.", "Déconnectez le second téléphone pour tester en mode simple.", "Mettez à jour le micrologiciel (guide ci-dessous)."]],
];
const GUIDES = [
  ["Première mise en route", ["Chargez 2 heures avec le câble USB-C.", "Maintenez le bouton marche 2 secondes.", "Sélectionnez Tonda dans les réglages Bluetooth."]],
  ["Appairer deux téléphones", ["Connectez le premier téléphone normalement.", "Maintenez le bouton Bluetooth 3 secondes.", "Connectez le second : le son suit celui qui joue."]],
  ["Réinitialiser l'enceinte", ["Éteignez l'enceinte.", "Maintenez marche et volume − pendant 8 secondes.", "Le voyant clignote orange : c'est fait."]],
  ["Mettre à jour le micrologiciel", ["Branchez l'enceinte à un ordinateur en USB-C.", "Copiez le fichier de mise à jour dans le disque Tonda.", "Débranchez : l'enceinte redémarre seule."]],
];
const FAQ = [
  ["L'enceinte résiste-t-elle à l'eau de mer ?", "Elle est protégée contre l'immersion douce d'eau claire (IP67). Rincez-la à l'eau douce après la plage et séchez le port USB-C."],
  ["Puis-je l'utiliser en stéréo avec une seconde Tonda ?", "Oui : le mode duo relie deux enceintes sans fil, gauche et droite, depuis le bouton Bluetooth."],
  ["La batterie est-elle remplaçable ?", "Elle est accessible en ouvrant la base : le guide de démontage est publié avec la fiche technique."],
  ["Où trouver la déclaration de conformité ?", "Elle accompagne la notice. Pour une copie, écrivez-nous depuis la page Contact."],
];
const assistance = (c) => [
  sec(header(c)), pagehead("05/06", "Assistance", "On ouvre,<br>on règle, on explique.", "Guides pas à pas, diagnostic rapide et questions fréquentes."),
  sec(`<section class="cx-diag pk-bleed" data-scope><div class="cx-wrap"><div class="cx-sechead"><div><p class="cx-kicker" data-reveal>Diagnostic rapide</p><h2 class="cx-h2" data-reveal>Quel symptôme ?</h2></div>
    <div class="cx-chips" role="tablist" aria-label="Symptômes">${SYM.map(([k, l], i) => `<a href="#s-${k}" role="tab" data-tab="${k}" ${i === 0 ? 'class="is-on" ' : ""}aria-selected="${i === 0}">${l}</a>`).join("")}</div></div>
    ${SYM.map(([k, l, st], i) => `<ol class="cx-steps" data-panel="${k}" aria-label="${l}"${i ? " hidden" : ""}>${st.map((s, j) => `<li><b>${j + 1}</b><span>${s}</span></li>`).join("")}</ol>`).join("")}</div></section>`),
  sec(`<section class="cx-guides pk-bleed"><div class="cx-wrap"><div class="cx-sechead"><div><p class="cx-kicker" data-reveal>Guides</p><h2 class="cx-h2" data-reveal>Pas à pas</h2></div></div>
    <div class="cx-gg">${GUIDES.map(([t, st], i) => `<article class="cx-gcard" data-reveal><span class="cx-gn">G${i + 1}</span><h3>${t}</h3><ol>${st.map((s) => `<li>${s}</li>`).join("")}</ol></article>`).join("")}</div></div></section>`),
  sec(`<section class="cx-faq pk-bleed"><div class="cx-wrap cx-faq-in"><h2 class="cx-h2" data-reveal>Questions fréquentes</h2><div>${FAQ.map(([q, a]) => `<details data-reveal><summary>${q}</summary><p>${a}</p></details>`).join("")}<p class="cx-fine">Une autre question ? <a href="/contact">Écrivez-nous</a>, nous répondons sous deux jours ouvrés.</p></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [sec(header(c)), pagehead("06/06", "Contact", "Parlons<br>de votre projet.", "Une question technique, un besoin de groupe, une demande de presse : écrivez-nous."),
  { type: "form", heading: "Écrire à l'équipe", intro: "Indiquez le modèle et l'usage qui vous intéressent : nous répondons avec la fiche technique adaptée." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("—", "Recherche", "Chercher<br>une pièce, un guide.", "Un modèle, une caractéristique, un accessoire."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une caractéristique, un guide…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)),
  sec(`<section class="cx-404 pk-bleed"><div class="cx-wrap cx-404-in"><div><p class="cx-kicker">Pièce manquante</p><div class="cx-h1 cx-h1--xl" role="heading" aria-level="1">404</div><p class="cx-ph-sub">Cette page n'existe pas ou a changé d'adresse. Le reste de l'enceinte est en place.</p><div class="cx-actions"><a class="cx-btn" href="/">Retour à l'accueil ${arrow}</a><a class="cx-btn cx-btn--line" href="/recherche">Rechercher</a></div></div>
    <div class="cx-lost" aria-hidden="true">${miniSvg(1, "Enceinte incomplète")}<span></span></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "circuit", name: "Circuit", version: "2.0.0", category: "tech", tags: ["technique", "moderne", "minimaliste"], siteType: "Matériel électronique grand public", featured: false,
  concept: "Un rendu produit de studio : l'enceinte entière se démonte au défilement, chaque pièce révèle sa fiche et sa ligne de cote, puis chaque caractéristique prend un plein écran.",
  description: "Matériel grand public : fond gris-blanc de studio, objet dessiné en SVG, cotes de bureau d'études, éclaté qui s'ouvre au défilement, caractéristiques en plein écran épinglé, comparateur et coloris.",
  brand: "Circuit Audio Lab", modules: ["formulaires", "recherche"],
  dna: { header: "barre-sombre-a-onglets-de-caracteristiques-numerotes", hero: "produit-eclate-vertical-qui-se-demonte-au-defilement", grid: "sections-epinglees-plein-ecran-une-par-caracteristique", motion: "translation-liee-au-defilement-et-cotes-qui-se-tracent", shapes: "disques-en-perspective-ombres-douces-et-lignes-de-cote", rhythm: "alterne-gris-studio-et-bandes-sombres-par-planches-techniques", signature: "vue-produit-specs-revelees-comparateur-et-coloris-recolorant-le-svg" },
  tokens: {
    colors: { primary: "#ff6a13", secondary: "#14181d", accent: "#ff6a13", background: "#eceff2", surface: "#ffffff", text: "#14181d", muted: "#4f5a65", success: "#1e7e5a", warning: "#8a5300", error: "#c0392b" },
    fonts: { heading: "font.bai-jamjuree", body: "font.sofia-sans", button: "font.martian-mono", link: "font.sofia-sans" },
    radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 12 }, shadow: { card: "0 18px 40px -22px rgba(20,24,29,.35)", button: "none" }, border: { width: 1, color: "#c4ccd4" },
    type: { h1: { size: 84, weight: 600, lineHeight: 1, transform: "none" }, h2: { size: 44, weight: 600, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Orange sécurité", type: "color", default: "#ff6a13" },
    { key: "ink", label: "Barre sombre", type: "color", default: "#14181d" },
    { key: "coloris", label: "Coloris du produit", type: "choice", default: "graphite", choices: [["graphite", "Graphite"], ["givre", "Givre"], ["brume", "Brume"], ["signal", "Signal"]] },
    { key: "grille", label: "Quadrillage de planche", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "cotes", label: "Lignes de cote", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
  ],
  menu: [["Aperçu", "/"], ["Caractéristiques", "/caracteristiques"], ["Comparer", "/comparer"], ["Accessoires", "/accessoires"], ["Assistance", "/assistance"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "caracteristiques", name: "Caractéristiques", render: caracteristiques }, { key: "comparer", name: "Comparer", render: comparer },
    { key: "accessoires", name: "Accessoires", render: accessoires }, { key: "assistance", name: "Assistance", render: assistance }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
