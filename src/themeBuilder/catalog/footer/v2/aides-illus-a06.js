// Illustrations SVG (vectorielles, sans texte, sans image externe) de la passe « ILLUSTRATION » : familles boissons-cave et cafe-boulangerie (ft2-338 à ft2-349).
// Chaque fonction renvoie le code SVG d'une illustration UNIQUE ; svgW() l'enveloppe dans le widget « html ».
const A = require("./aides-inspire-b");
const { lien, caps, texte, trait, case_, Moteur } = A;
const f = (n) => Number(n.toFixed(1));
const ouvre = (id, vb, extra = "") => `<svg viewBox="${vb}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="${extra || "xMidYMid meet"}">`;

function svgW(k, svg, st = {}) {
  if (svg.length > 19000) throw new Error(`illustration trop longue (${svg.length})`);
  return k.W("html", { html: svg }, { width: "100%", display: "block", fontSize: "0px", lineHeight: 1, ...st });
}

// 338 — casier à bouteilles (culs de bouteilles en quinconce, capsules champagne) sous un halo doré
function casier() {
  let c = `<rect width="600" height="440" fill="#150609"/>`;
  [[250, 0.05], [200, 0.06], [150, 0.07], [105, 0.08], [60, 0.09]].forEach(([r, o]) => { c += `<circle cx="300" cy="200" r="${r}" fill="#e3b565" opacity="${o}"/>`; });
  for (let r = 0; r < 7; r++) c += `<rect x="14" y="${40 + r * 54 + 28}" width="572" height="6" fill="#8a5a2b"/>`;
  for (let r = 0; r < 7; r++) for (let q = 0; q < 8; q++) {
    const x = 50 + q * 70 + (r % 2 ? 35 : 0), y = 56 + r * 54; if (x > 565) continue;
    const or = (r * 3 + q) % 4 === 0;
    c += `<circle cx="${x}" cy="${y}" r="26" fill="#0d0407"/><circle cx="${x}" cy="${y}" r="22" fill="#4a1727" stroke="#e3b56566" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="15" fill="#6b1f33"/><circle cx="${x}" cy="${y}" r="11" fill="${or ? "#e3b565" : "#150609"}"/>`;
  }
  return ouvre("c338", "0 0 600 440", "xMidYMid slice") + c + "</svg>";
}

// 339 — mousse de bière : grosses bulles jaunes qui débordent dans la bande sombre (bande ondulée)
function mousse() {
  let c = `<rect width="1200" height="150" fill="#1a1a17"/><rect width="1200" height="70" fill="#f4b400"/>`;
  const rs = [34, 46, 28, 54, 38, 30, 50, 36, 44, 26, 52, 40, 32, 48, 36];
  let x = 10, i = 0;
  while (x < 1230) { const r = rs[i % rs.length]; c += `<circle cx="${x + r}" cy="${60 + (i % 3) * 8}" r="${r}" fill="#f4b400"/>`; x += r * 1.55; i++; }
  for (let j = 0; j < 14; j++) c += `<circle cx="${60 + j * 86 + (j % 2) * 18}" cy="${104 + (j % 3) * 14}" r="${5 + (j % 4) * 2}" fill="none" stroke="#f4b400" stroke-width="2.5" opacity="0.8"/>`;
  return ouvre("c339", "0 0 1200 150", "xMidYMin slice") + c + "</svg>";
}

// 340 — rangée de quatre vignettes de bouteilles au trait (whisky, rhum, gin, cognac) sur papier
function bouteilles() {
  const enc = "#111111", vert = "#0f5c4d";
  const cell = (x, corps, nom) => `<g transform="translate(${x} 0)"><rect x="1" y="1" width="298" height="238" fill="#efe9dc" stroke="${enc}" stroke-width="2"/><rect x="40" y="196" width="220" height="8" fill="${vert}"/>${corps}</g>`;
  const whisky = `<rect x="125" y="30" width="50" height="22" fill="${enc}"/><rect x="132" y="52" width="36" height="30" fill="none" stroke="${enc}" stroke-width="3"/><path d="M100 82 H200 V196 H100 Z" fill="${vert}" stroke="${enc}" stroke-width="3"/><rect x="112" y="116" width="76" height="52" fill="#efe9dc" stroke="${enc}" stroke-width="2"/><path d="M122 132 H178 M122 142 H178 M122 152 H160" stroke="${enc}" stroke-width="2"/>`;
  const rhum = `<rect x="136" y="26" width="28" height="18" fill="${enc}"/><path d="M140 44 H160 V92 L196 128 V196 H104 V128 L140 92 Z" fill="#b25a1c" stroke="${enc}" stroke-width="3"/><path d="M104 150 H196" stroke="${enc}" stroke-width="3"/><circle cx="150" cy="172" r="11" fill="#efe9dc" stroke="${enc}" stroke-width="2"/>`;
  const gin = `<rect x="132" y="22" width="36" height="16" fill="${enc}"/><path d="M138 38 H162 V74 H138 Z" fill="#cfe3dc" stroke="${enc}" stroke-width="3"/><rect x="108" y="74" width="84" height="122" fill="#cfe3dc" stroke="${enc}" stroke-width="3"/><circle cx="150" cy="134" r="26" fill="#efe9dc" stroke="${enc}" stroke-width="2"/><path d="M150 118 V150 M134 134 H166" stroke="${vert}" stroke-width="3"/>`;
  const cognac = `<ellipse cx="150" cy="40" rx="20" ry="14" fill="${enc}"/><path d="M142 52 H158 V84 C200 100 214 140 214 168 C214 190 200 196 186 196 H114 C100 196 86 190 86 168 C86 140 100 100 142 84 Z" fill="#8a4a12" stroke="${enc}" stroke-width="3"/><path d="M110 160 H190" stroke="#efe9dc" stroke-width="3"/>`;
  return ouvre("c340", "0 0 1200 240") + cell(0, whisky) + cell(300, rhum) + cell(600, gin) + cell(900, cognac) + "</svg>";
}

// 341 — coteaux de vignes en terrasses : rangs courbes, grappes, soleil couchant lie-de-vin
function terrasses() {
  let c = `<rect width="1200" height="260" fill="#f3ede1"/><circle cx="930" cy="96" r="66" fill="#d9a441" opacity="0.85"/><circle cx="930" cy="96" r="92" fill="none" stroke="#d9a441" opacity="0.5"/>`;
  c += `<path d="M0 150 C200 90 380 120 560 100 C760 78 960 130 1200 96 V260 H0 Z" fill="#cdb98f"/>`;
  const teintes = ["#9a4a52", "#7a1f2b", "#5f1521", "#47101a"];
  for (let r = 0; r < 4; r++) {
    const y = 130 + r * 34;
    c += `<path d="M0 ${y} C240 ${y - 36 + r * 6} 520 ${y + 14} 760 ${y - 10} S1080 ${y + 22} 1200 ${y - 8} V260 H0 Z" fill="${teintes[r]}"/>`;
    for (let q = 0; q < 26; q++) { const x = 20 + q * 47 + (r % 2) * 20; c += `<circle cx="${x}" cy="${y + 12 + Math.sin(q + r) * 4}" r="${5 + r}" fill="#f3ede1" opacity="0.18"/>`; }
  }
  c += `<g transform="translate(120 36)" fill="none" stroke="#7a1f2b" stroke-width="3"><path d="M0 0 C30 30 60 20 80 50"/><path d="M40 20 l-14 -22 l24 4 z" fill="#7a1f2b"/></g>`;
  for (let g = 0; g < 9; g++) c += `<circle cx="${190 + (g % 3) * 15 + (g > 5 ? 8 : 0)}" cy="${80 + Math.floor(g / 3) * 15}" r="8" fill="#7a1f2b"/>`;
  return ouvre("c341", "0 0 1200 260", "xMidYMax slice") + c + "</svg>";
}

// 342 — alambic (pot still) en cuivre au centre d'un halo de braise
function alambic() {
  const cu = "#c98a4b", cl = "#e8b27a", cf = "#7a4a1f";
  let c = `<rect width="640" height="420" fill="#15110d"/>`;
  [[300, 0.04], [250, 0.05], [205, 0.06], [165, 0.07], [125, 0.08], [90, 0.09]].forEach(([r, o]) => { c += `<ellipse cx="320" cy="240" rx="${r * 1.05}" ry="${r * 0.7}" fill="#c98a4b" opacity="${o}"/>`; });
  const reflet = `<path d="M172 320 C172 266 208 232 258 208 V320 Z" fill="#e8b27a" opacity="0.45"/>`;
  c += `<path d="M140 330 C140 250 200 210 250 190 L250 150 C250 120 290 110 320 110 L388 120 C440 126 470 148 520 196 L560 196 V212 L510 212 C488 190 470 176 440 168 L400 160 L388 190 C440 210 500 250 500 330 Z" fill="#c98a4b" stroke="#15110d" stroke-width="3"/>`;
  c += reflet + `<rect x="130" y="326" width="380" height="22" fill="${cf}"/><rect x="118" y="346" width="404" height="14" fill="#15110d" stroke="${cu}" stroke-width="2"/>`;
  c += `<circle cx="320" cy="286" r="34" fill="none" stroke="#15110d" stroke-width="3"/><circle cx="320" cy="286" r="6" fill="#15110d"/>`;
  c += `<rect x="552" y="190" width="40" height="150" fill="#c98a4b" stroke="#15110d" stroke-width="3"/><path d="M552 340 H592 V362 H552 Z" fill="${cf}"/>`;
  c += `<path d="M300 366 q12 22 0 40 M330 366 q12 22 0 40 M360 366 q12 22 0 40" fill="none" stroke="#e8b27a" stroke-width="3" opacity="0.8"/>`;
  return ouvre("c342", "0 0 640 420") + c + "</svg>";
}

// 343 — frise de pommes rouges et feuilles sur fond coquelicot
function pommes() {
  let c = `<rect width="1200" height="110" fill="#c8281c"/>`;
  for (let i = 0; i < 12; i++) {
    const x = 50 + i * 100, y = 56 + (i % 2) * 6, s = 1 + (i % 3) * 0.12;
    c += `<g transform="translate(${x} ${y}) scale(${f(s)})"><path d="M0 -26 C-34 -40 -46 4 -26 28 C-14 42 -6 38 0 36 C6 38 14 42 26 28 C46 4 34 -40 0 -26 Z" fill="${i % 4 === 2 ? "#fff3c4" : "#ffffff"}"/><path d="M0 -26 V-42" stroke="#ffffff" stroke-width="4"/><path d="M2 -38 C16 -52 30 -46 34 -40 C22 -30 10 -30 2 -38 Z" fill="#fff3c4"/><path d="M-18 -6 C-22 4 -18 14 -12 20" fill="none" stroke="#c8281c" opacity="0.35" stroke-width="3"/></g>`;
  }
  return ouvre("c343", "0 0 1200 110", "xMidYMid slice") + c + "</svg>";
}

// 344 — tasse d'espresso fumante et grains de café, au trait crème sur espresso
function tasse() {
  const cr = "#f6efe3", cl = "#e8b894";
  let c = `<rect width="320" height="300" fill="#2a1a12"/>`;
  c += `<path d="M70 150 H230 C230 214 204 246 150 246 C96 246 70 214 70 150 Z" fill="none" stroke="${cr}" stroke-width="5"/><path d="M230 164 C268 160 268 210 224 214" fill="none" stroke="${cr}" stroke-width="5"/><ellipse cx="150" cy="260" rx="112" ry="14" fill="none" stroke="${cr}" stroke-width="5"/><path d="M84 152 H216" stroke="${cl}" stroke-width="6"/>`;
  c += `<path d="M120 124 C100 96 140 82 118 52 C108 36 120 26 128 20 M158 126 C138 98 178 84 156 54 M194 124 C176 100 208 88 192 62" fill="none" stroke="${cl}" stroke-width="4" stroke-linecap="square"/>`;
  [[34, 40, 20], [66, 76, 8], [276, 70, -26], [250, 30, 40], [286, 130, 10]].forEach(([x, y, a]) => { c += `<g transform="translate(${x} ${y}) rotate(${a})"><ellipse rx="14" ry="9" fill="${cl}"/><path d="M-12 0 C-4 -3 4 3 12 0" fill="none" stroke="#2a1a12" stroke-width="2.5"/></g>`; });
  return ouvre("c344", "0 0 320 300") + c + "</svg>";
}

// 345 — corbeille de pains : boule, baguettes et croissant sur toile à carreaux
function pains() {
  const cr = "#a64a14", dore = "#e0a050", clair = "#f2c47e", enc = "#3a1d0c";
  let c = `<rect width="640" height="300" fill="#fff3dc"/><path d="M60 230 H580 L550 290 H90 Z" fill="#f7e2bd" stroke="${enc}" stroke-width="4"/><path d="M80 250 H560 M95 270 H545" stroke="${enc}" stroke-width="2"/>`;
  c += `<g stroke="${enc}" stroke-width="4"><rect x="130" y="40" width="64" height="200" fill="${dore}" transform="rotate(-24 162 140)"/><rect x="200" y="30" width="64" height="210" fill="${clair}" transform="rotate(-10 232 135)"/></g>`;
  for (let i = 0; i < 4; i++) c += `<path d="M${150 + i * 14} ${90 + i * 40} l24 -8" stroke="${enc}" stroke-width="3" transform="rotate(-24 162 140)"/>`;
  for (let i = 0; i < 4; i++) c += `<path d="M${222 + i * 6} ${70 + i * 40} l24 -8" stroke="${enc}" stroke-width="3" transform="rotate(-10 232 135)"/>`;
  c += `<g stroke="${enc}" stroke-width="4"><circle cx="370" cy="170" r="76" fill="${dore}"/></g><path d="M326 130 L414 150 M322 168 L420 190 M334 204 L406 214" stroke="${enc}" stroke-width="4" fill="none"/>`;
  c += `<g stroke="${enc}" stroke-width="4" fill="${clair}"><path d="M470 220 C470 160 500 120 540 120 C560 120 580 140 570 170 C560 200 540 220 520 230 Z"/></g><path d="M490 190 L520 160 M512 214 L542 176 M536 220 L560 190" stroke="${cr}" stroke-width="4" fill="none"/>`;
  return ouvre("c345", "0 0 640 300") + c + "</svg>";
}

// 346 — médaillon : théière ornée dans une couronne de lauriers
function medaillon() {
  const enc = "#1d2433", rg = "#8c1c13";
  let c = `<circle cx="160" cy="160" r="150" fill="#fdfbf6" stroke="${enc}" stroke-width="3"/><circle cx="160" cy="160" r="138" fill="none" stroke="${enc}" stroke-width="1"/>`;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, x = 160 + Math.cos(a) * 118, y = 160 + Math.sin(a) * 118; c += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="16" ry="6" fill="${i % 2 ? rg : enc}" transform="rotate(${f(a * 180 / Math.PI + 90)} ${f(x)} ${f(y)})"/>`; }
  c += `<path d="M100 150 C100 110 130 98 160 98 C190 98 220 110 220 150 C220 190 200 214 160 214 C120 214 100 190 100 150 Z" fill="#f1ede2" stroke="${enc}" stroke-width="4"/><path d="M220 130 C260 120 262 168 222 176" fill="none" stroke="${enc}" stroke-width="4"/><path d="M100 140 L66 112 C58 108 54 120 64 126 L100 160" fill="#f1ede2" stroke="${enc}" stroke-width="4"/><rect x="142" y="86" width="36" height="12" fill="${enc}"/><circle cx="160" cy="78" r="8" fill="${rg}"/><path d="M116 150 H204 M122 176 H198" stroke="${rg}" stroke-width="3"/><rect x="104" y="214" width="112" height="10" fill="${enc}"/>`;
  c += `<path d="M120 62 q6 -14 0 -26 M160 56 q6 -14 0 -26 M200 62 q6 -14 0 -26" fill="none" stroke="${rg}" stroke-width="3"/>`;
  return ouvre("c346", "0 0 320 320") + c + "</svg>";
}

// 347 — pixel art (rectangles) : un croissant et une baguette dans la fenêtre console
function pixels() {
  const lignes = [
    "..........cccc..........",
    "........ccddddcc........",
    "......ccddddddddcc......",
    ".....cddllddddllddc.....",
    "....cddddddddddddddc....",
    "...cddllddddddddllddc...",
    "..cdddddddllllddddddc...",
    ".cddllddddddddddllddc...",
    ".cdddddddddddddddddc....",
    "..ccdddddddddddddcc.....",
    "....cccddddddddccc......",
    "......ccccccccc........."
  ];
  const col = { c: "#7a4a1f", d: "#ffd84d", l: "#fff2b0" };
  let c = `<rect width="240" height="120" fill="#0d0d0d"/>`;
  lignes.forEach((ln, y) => { for (let x = 0; x < ln.length; x++) { const t = ln[x]; if (t !== ".") c += `<rect x="${x * 10}" y="${y * 10}" width="10" height="10" fill="${col[t]}"/>`; } });
  [[8, 2], [15, 0], [2, 9]].forEach(([x, y]) => { c += `<rect x="${x * 10 + 200}" y="${y * 10}" width="10" height="10" fill="#9cf0b0"/>`; });
  return ouvre("c347", "0 0 240 120", "xMidYMid meet") + c + "</svg>";
}

// 348 — moulin à vent sur sa colline, ciel rose, ailes en croix
function moulin() {
  const br = "#3b1f1a", rg = "#9e2f1a";
  let c = `<rect width="420" height="320" fill="#f2c9ba"/><circle cx="330" cy="70" r="40" fill="#f9ddd2"/><path d="M0 260 C80 220 160 230 240 250 C320 268 380 240 420 230 V320 H0 Z" fill="#9e2f1a"/><path d="M0 290 C100 262 200 280 300 290 C350 296 390 290 420 284 V320 H0 Z" fill="#3b1f1a"/>`;
  c += `<path d="M150 250 L172 120 H236 L258 250 Z" fill="#f9ddd2" stroke="${br}" stroke-width="5"/><path d="M164 120 L204 78 L244 120 Z" fill="${rg}" stroke="${br}" stroke-width="5"/><rect x="190" y="196" width="28" height="54" fill="${br}"/><rect x="186" y="140" width="36" height="22" fill="${br}"/>`;
  c += `<g transform="translate(204 104)" stroke="${br}" stroke-width="4"><path d="M0 0 L-92 -54 L-70 -78 L8 -16 Z" fill="#f9ddd2"/><path d="M0 0 L54 -92 L78 -70 L16 8 Z" fill="#f9ddd2"/><path d="M0 0 L92 54 L70 78 L-8 16 Z" fill="#f9ddd2"/><path d="M0 0 L-54 92 L-78 70 L-16 -8 Z" fill="#f9ddd2"/><circle r="9" fill="${br}"/></g>`;
  for (let i = 0; i < 7; i++) c += `<path d="M${30 + i * 22} 300 V272 M${24 + i * 22} 282 l6 -10 l6 10" stroke="#f9ddd2" stroke-width="3" fill="none"/>`;
  return ouvre("c348", "0 0 420 320", "xMidYMax meet") + c + "</svg>";
}

// 349 — grand épi d'orge dans un soleil concentrique (escalier de grain)
function epi() {
  const vf = "#14291c", v2 = "#24593a";
  let c = `<circle cx="200" cy="200" r="190" fill="#cfe0c0"/><circle cx="200" cy="200" r="150" fill="#a9cf9b"/><circle cx="200" cy="200" r="110" fill="#e6eedb"/>`;
  c += `<path d="M200 380 V120" stroke="${vf}" stroke-width="6"/>`;
  for (let i = 0; i < 8; i++) {
    const y = 130 + i * 24;
    c += `<g fill="${i % 2 ? v2 : vf}"><path d="M200 ${y} C170 ${y - 6} 154 ${y - 30} 150 ${y - 50} C178 ${y - 40} 196 ${y - 22} 200 ${y}Z"/><path d="M200 ${y} C230 ${y - 6} 246 ${y - 30} 250 ${y - 50} C222 ${y - 40} 204 ${y - 22} 200 ${y}Z"/></g><path d="M160 ${y - 44} L128 ${y - 120 + i * 6} M240 ${y - 44} L272 ${y - 120 + i * 6}" stroke="${vf}" stroke-width="2"/>`;
  }
  c += `<path d="M200 130 L200 40" stroke="${vf}" stroke-width="3"/><path d="M200 380 C180 340 140 330 110 340 M200 380 C222 344 262 336 292 346" fill="none" stroke="${v2}" stroke-width="8"/>`;
  return ouvre("c349", "0 0 400 400") + c + "</svg>";
}


// ── Gabarits communs aux trois captures ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Tuile carrée d'icône de réseau (capture 19) : widget « Réseaux sociaux » à une icône, centré dans une case qui se soulève.
function tuileIcone(k, env, reseau, o = {}) {
  const ic = Moteur.item(k, `socials:${reseau}|big`, env, true);
  return case_(k, [ic], { fond: o.fond, pad: "0px", min: "0px", h: o.h || "150px", justifie: "center", extra: { alignItems: "center" }, survol: o.survol || { transform: { y: -4 } } });
}
// Colonne de liens : titre en capitales (souligné d'un filet si `filet`), liens qui glissent au survol.
function colLiens(k, titre, liste, o = {}) {
  const S = k.S, ent = [caps(k, titre, { couleur: o.titre || S.fg, taille: o.tt || "13px", suivi: o.suivi || "0.14em" })];
  if (o.filet) ent.push(trait(k, o.filet, "2px"));
  liste.forEach(([t, u]) => ent.push(lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.couleur || S.fg, bloc: true, survol: { color: o.survol || S.accent, transform: { x: 6 } }, focus: o.survol || S.accent })));
  return k.col(ent, { gap: o.gap || "2px", flexGrow: 1, flexBasis: "0px", minWidth: o.min || "150px" });
}
// Formulaire d'inscription habillé (couleurs imposées pour rester lisible sur un dégradé).
function formulaire(k, env, G, o) {
  const S = k.S;
  const f1 = A.abo(k, env, G, { titre: o.titre || "", intro: o.intro || "", bouton: o.bouton || "S'abonner", largeur: o.largeur || "480px", accent: o.btnFond, texte: o.texte, consentCouleur: o.texte, styleTitre: { color: o.texte, fontFamily: S.font, fontWeight: "800", ...(o.styleTitre || {}) }, survolBouton: o.survolFond, survolTexte: o.survolTexte });
  f1.parts.button.styles.desktop = { ...f1.parts.button.styles.desktop, color: o.btnTexte, backgroundColor: o.btnFond };
  f1.parts.intro.styles.desktop = { ...f1.parts.intro.styles.desktop, color: o.texte };
  f1.parts.missing.styles.desktop = { ...f1.parts.missing.styles.desktop, color: o.texte };
  return f1;
}
// Rangée de pictos de services dessinés (capture 21 : badges de paiement), sans marque réelle : carte, pièce, cadeau, cadenas, camion.
function badges(k, o = {}) {
  const t = o.trait || "#111111", fo = o.fond || "#ffffff", ac = o.accent || "#0f5c4d";
  const tuile = (x, d) => `<g transform="translate(${x} 0)"><rect x="1.5" y="1.5" width="62" height="45" fill="${fo}" stroke="${t}" stroke-width="2"/>${d}</g>`;
  const carte = `<rect x="12" y="13" width="40" height="22" fill="none" stroke="${t}" stroke-width="2.5"/><rect x="12" y="19" width="40" height="5" fill="${ac}"/><rect x="17" y="29" width="10" height="3" fill="${t}"/>`;
  const piece = `<circle cx="32" cy="24" r="14" fill="none" stroke="${t}" stroke-width="2.5"/><path d="M32 16 V32 M27 21 H35 M27 27 H35" stroke="${ac}" stroke-width="2.5"/>`;
  const cadeau = `<rect x="14" y="20" width="36" height="20" fill="none" stroke="${t}" stroke-width="2.5"/><rect x="12" y="14" width="40" height="7" fill="${ac}"/><path d="M32 14 V40" stroke="${t}" stroke-width="2.5"/>`;
  const cadenas = `<rect x="18" y="22" width="28" height="18" fill="${ac}"/><path d="M24 22 V16 C24 8 40 8 40 16 V22" fill="none" stroke="${t}" stroke-width="2.5"/><rect x="30" y="28" width="4" height="6" fill="${fo}"/>`;
  const camion = `<rect x="10" y="16" width="26" height="18" fill="none" stroke="${t}" stroke-width="2.5"/><path d="M36 22 H46 L54 28 V34 H36 Z" fill="${ac}" stroke="${t}" stroke-width="2"/><circle cx="20" cy="36" r="4" fill="${fo}" stroke="${t}" stroke-width="2.5"/><circle cx="45" cy="36" r="4" fill="${fo}" stroke="${t}" stroke-width="2.5"/>`;
  const svg = `<svg viewBox="0 0 354 48" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${[carte, piece, cadeau, cadenas, camion].map((d, i) => tuile(i * 72, d)).join("")}</svg>`;
  return svgW(k, svg, { maxWidth: o.max || "360px" });
}

module.exports = { tuileIcone, colLiens, formulaire, badges, svgW, casier, mousse, bouteilles, terrasses, alambic, pommes, tasse, pains, medaillon, pixels, moulin, epi };
