// Étoile — glamping et camping nature. Direction artistique : un ciel de nuit bleu-prune qui se transforme (bascule jour/nuit réelle), des planches de bois miel,
// la lueur orange d'une lanterne, des illustrations dessinées (tentes, cabanes, bulles, tipis, forêt, feu de camp). Navigation en planches suspendues sous la barre,
// hébergements posés sur une carte dessinée du domaine (fiche, dates, voyageurs, récapitulatif envoyé vers /contact).
const { sec, esc } = require("../kit");

const INK = "#2a1a45";
// ---------- Données de démonstration ----------
const SEASONS = [
  { k: "hiver", n: "Hiver", m: "novembre à mars", f: 0.9, months: [10, 11, 0, 1, 2], t: "Poêles allumés, nuits longues, ciel d'une grande netteté. Le domaine est calme, les bains chauffés au bois sont de sortie." },
  { k: "printemps", n: "Printemps", m: "avril à juin", f: 1.05, months: [3, 4, 5], t: "Sous-bois en fleurs, chants d'oiseaux dès l'aube, soirées encore fraîches autour du feu. La saison des randonnées." },
  { k: "ete", n: "Été", m: "juillet et août", f: 1.35, months: [6, 7], t: "Longues soirées, baignade au lac, nuits des étoiles filantes. C'est la pleine saison : mieux vaut anticiper." },
  { k: "automne", n: "Automne", m: "septembre et octobre", f: 1, months: [8, 9], t: "Forêt cuivrée, brume le matin, champignons de saison et veillées sous plaid. Notre préférée pour le calme." },
];
const FACT = Array.from({ length: 12 }, (_, m) => SEASONS.find((s) => s.months.includes(m)).f);
const TYPES = {
  safari: { n: "Tente safari", e: ["Lit double 160 cm et couchage d'appoint", "Salle d'eau privée avec douche chaude", "Poêle à bois et réserve de bûches", "Terrasse couverte et brasero", "Linge de lit et serviettes fournis", "Prises USB et lampes à piles rechargeables"], base: 120 },
  cabane: { n: "Cabane", e: ["Couchage en mezzanine sous la charpente", "Coin cuisine : bouilloire, plaque, vaisselle", "Poêle et plaids en laine", "Douche et sanitaires privatifs", "Terrasse suspendue face à la forêt", "Café, thé et infusions offerts"], base: 135 },
  bulle: { n: "Bulle étoilée", e: ["Dôme transparent chauffé, rideau occultant", "Lit double face au ciel", "Sanitaires privatifs à 20 mètres", "Jumelles et carte du ciel du mois", "Plaids, bouillottes et lampe rouge", "Petit-déjeuner livré au lever du jour"], base: 175 },
  tipi: { n: "Tipi", e: ["Matelas épais et couettes chaudes", "Poêle central et lanternes", "Sanitaires partagés à 40 mètres", "Coin feu et vaisselle de camp", "Hamacs sous les arbres", "Idéal pour les familles et les groupes"], base: 90 },
};
const UNITS = [
  { id: "s1", t: "safari", name: "Aube", cap: 4, base: 120, extra: 20, m2: 28, d: "Orientée à l'est, elle s'éveille avec le soleil. Une terrasse large pour le café du matin, au bord de la clairière." },
  { id: "s2", t: "safari", name: "Crépuscule", cap: 5, base: 135, extra: 20, m2: 34, d: "Plus vaste, avec deux espaces de couchage séparés par un rideau : pensée pour les familles qui aiment la nature confortable." },
  { id: "c1", t: "cabane", name: "Le Chêne", cap: 4, base: 145, extra: 20, m2: 24, d: "Perchée à trois mètres, bâtie autour d'un vieux chêne. La mezzanine ouvre sur la cime des arbres." },
  { id: "c2", t: "cabane", name: "La Noisette", cap: 2, base: 135, extra: 0, m2: 18, d: "Un nid pour deux, entre noisetiers et fougères. Petite, chaude, silencieuse : la préférée des escapades romantiques." },
  { id: "t1", t: "tipi", name: "Brume", cap: 5, base: 90, extra: 15, m2: 22, d: "Un tipi de toile épaisse où l'on s'endort au son de la rivière. Matelas, couettes et poêle : le camping, en plus doux." },
  { id: "t2", t: "tipi", name: "Braise", cap: 6, base: 105, extra: 15, m2: 30, d: "Le plus grand du domaine, à deux pas du feu collectif. Parfait pour une tribu d'amis ou une famille nombreuse." },
  { id: "b1", t: "bulle", name: "Lyre", cap: 2, base: 175, extra: 0, m2: 16, d: "Une bulle posée près du lac : le ciel pour plafond, les reflets de l'eau pour compagnie." },
  { id: "b2", t: "bulle", name: "Vega", cap: 3, base: 190, extra: 20, m2: 20, d: "Au milieu d'une prairie sans lampadaire, une bulle plus grande pour observer la Voie lactée à trois." },
];
// Positions sur la carte (pourcentages de la carte 800 × 600)
const POS = { s1: [18, 30], s2: [30, 54], c1: [50, 20], c2: [68, 36], t1: [86, 16], t2: [90, 50], b1: [44, 76], b2: [62, 68] };
const lowest = (base) => Math.round(base * 0.9);
const eur = (n) => `${n} €`;

// ---------- Illustrations ----------
const rnd = (seed) => { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; };
const stars = (n, w, h, seed, maxY) => {
  const r = rnd(seed); let o = "";
  for (let i = 0; i < n; i++) {
    const x = Math.round(r() * w), y = Math.round(r() * h * maxY), rad = (0.7 + r() * 1.5).toFixed(1), k = ["et-tw et-t1", "et-tw et-t2", "et-tw et-t3", "et-tw et-t4", "", ""][Math.floor(r() * 6)];
    o += `<circle class="et-st ${k}" cx="${x}" cy="${y}" r="${rad}"/>`;
  }
  return o;
};
const glow = (x, y, r, cls = "") => `<g class="et-gl ${cls}"><circle cx="${x}" cy="${y}" r="${r}" opacity=".05"/><circle cx="${x}" cy="${y}" r="${(r * 0.68).toFixed(0)}" opacity=".07"/><circle cx="${x}" cy="${y}" r="${(r * 0.42).toFixed(0)}" opacity=".11"/><circle cx="${x}" cy="${y}" r="${(r * 0.22).toFixed(0)}" opacity=".3"/></g>`;
const pine = (x, y, s, cls = "et-pn") => `<g transform="translate(${x} ${y}) scale(${s})" class="${cls}"><path d="M0 -104 L22 -58 L10 -58 L30 -18 L14 -18 L38 30 L-38 30 L-14 -18 L-30 -18 L-10 -58 L-22 -58Z"/><rect x="-5" y="30" width="10" height="16"/></g>`;
const pines = (list, cls) => list.map(([x, y, s]) => pine(x, y, s, cls)).join("");

// Les quatre hébergements dessinés (viewBox 200 × 150, sol à y = 134)
function unitArt(type) {
  const lantern = `<circle class="et-glow-f" cx="100" cy="108" r="5"/>`;
  if (type === "safari") return `<g class="et-ua"><rect class="et-wood" x="20" y="124" width="160" height="11" rx="2"/><path class="et-wood2" d="M30 135v10M100 135v10M170 135v10"/>
    <rect class="et-canvas" x="36" y="78" width="128" height="47"/><path class="et-canvas2" d="M16 82 100 24 184 82Z"/><path d="M100 24V82M58 53V82M142 53V82" fill="none" opacity=".45"/>
    <path class="et-dark" d="M84 125 91 88H109L116 125Z"/><path d="M91 88 80 125M109 88 120 125" fill="none"/><rect class="et-glow-f" x="46" y="92" width="26" height="20" rx="2"/><rect class="et-glow-f" x="128" y="92" width="26" height="20" rx="2"/>
    <path d="M46 102H72M59 92V112M128 102H154M141 92V112" fill="none" opacity=".6"/><rect class="et-wood" x="30" y="80" width="5" height="45"/><rect class="et-wood" x="165" y="80" width="5" height="45"/><path d="M100 24V10" fill="none"/><path class="et-flag" d="M100 10 114 14 100 18Z"/></g>`;
  if (type === "cabane") return `<g class="et-ua"><rect class="et-wood2" x="34" y="106" width="8" height="30"/><rect class="et-wood2" x="158" y="106" width="8" height="30"/><rect class="et-wood" x="26" y="100" width="148" height="10" rx="2"/>
    <rect class="et-wood" x="40" y="58" width="120" height="43"/><path d="M40 72H160M40 86H160" fill="none" opacity=".5"/><path class="et-roof" d="M26 62 100 20 174 62Z"/><path d="M60 40 100 62 140 40M80 30 120 52" fill="none" opacity=".35"/>
    <rect class="et-dark" x="88" y="70" width="24" height="31" rx="2"/><rect class="et-glow-f" x="52" y="70" width="24" height="18" rx="2"/><rect class="et-glow-f" x="124" y="70" width="24" height="18" rx="2"/><path d="M64 70V88M52 79H76M136 70V88M124 79H148" fill="none" opacity=".6"/>
    <rect class="et-wood2" x="126" y="14" width="12" height="26"/><path class="et-smoke" d="M132 8c-8-6 8-10 0-18" fill="none" opacity=".5"/><path class="et-wood2" d="M70 110 56 134M130 110 144 134M60 120H140" fill="none"/></g>`;
  if (type === "bulle") return `<g class="et-ua"><rect class="et-wood" x="22" y="124" width="156" height="11" rx="2"/><path class="et-wood2" d="M34 135v10M100 135v10M166 135v10"/>
    <path class="et-dome" d="M30 124A70 70 0 0 1 170 124Z"/><path d="M100 54V124M64 70 76 124M136 70 124 124M44 98H156" fill="none" opacity=".45"/>
    <rect class="et-bed" x="64" y="104" width="72" height="20" rx="5"/><path class="et-bed2" d="M64 104H136V112H64Z"/><circle class="et-st" cx="118" cy="76" r="2.2"/><circle class="et-st" cx="84" cy="88" r="1.8"/><circle class="et-st" cx="132" cy="94" r="1.5"/><circle class="et-glow-f" cx="146" cy="108" r="5"/></g>`;
  return `<g class="et-ua"><path class="et-canvas" d="M100 14 36 134H164Z"/><path d="M100 14 74 134M100 14 126 134" fill="none" opacity=".4"/><path class="et-band" d="M58 100 100 94 142 100 150 116 100 110 50 116Z"/>
    <path class="et-dark" d="M86 134 100 76 114 134Z"/><path d="M100 76V134" fill="none"/><path class="et-wood2" d="M100 14 90 0M100 14 110 0M100 14 100 -2M100 14 84 4M100 14 116 4" fill="none"/>
    <path d="M44 134H156" fill="none"/>${lantern.replace('cy="108"', 'cy="122"').replace('cx="100"', 'cx="132"')}</g>`;
}
const ground = () => `<path class="et-gr" d="M0 134C40 126 70 138 110 132S170 126 200 134V150H0Z"/><path class="et-gr2" d="M0 142C50 136 90 146 140 140S185 140 200 142V150H0Z"/>`;
const sceneSvg = (type, label) => `<svg class="et-scene" viewBox="0 0 200 150" role="img" aria-label="${esc(label)}" focusable="false"><g class="et-sc-sky">${stars(9, 200, 150, 5 + type.length, 0.5)}</g>${pines([[16, 112, 0.34], [38, 118, 0.26], [180, 114, 0.34], [160, 120, 0.24]], "et-pn")}${ground()}${unitArt(type)}</svg>`;
// Pictogrammes (viewBox 48)
const GLYPH = {
  safari: `<path d="M6 36 24 10l18 26ZM24 10v26M18 36l6-12 6 12"/>`,
  cabane: `<path d="M7 22 24 8l17 14M12 20v18h24V20M21 38V28h6v10"/>`,
  bulle: `<path d="M6 37a18 18 0 0 1 36 0ZM4 41h40M24 19v18M14 29q10-6 20 0"/>`,
  tipi: `<path d="M24 7 8 38h32ZM24 7 20 2M24 7l4-5M17 38l7-16 7 16"/>`,
};
const glyph = (t, cls = "et-gly") => `<svg class="${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${GLYPH[t]}</svg>`;
const arrow = `<svg class="et-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;
const tick = `<svg class="et-tk" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m4 10.5 4 4 8-9"/></svg>`;
const logoMark = `<svg class="et-logo-m" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path class="et-lg-a" d="M4 40 24 8l20 32Z"/><path class="et-lg-b" d="M17 40l7-14 7 14Z"/><path class="et-lg-c" d="m24 -1 1.6 4.4 4.4 1.6-4.4 1.6L24 12l-1.6-4.4L18 6l4.4-1.6Z" transform="translate(0 1)"/></svg>`;

// Cime de pins qui sépare deux bandes (la couleur vient de la classe)
const treeline = (cls) => { const r = rnd(41); let d = "M0 60"; for (let x = 0; x <= 1440; x += 40) { const h = 14 + r() * 34; d += `L${x} ${60 - h * 0.45}L${x + 14} ${60 - h}L${x + 26} ${60 - h * 0.45}`; } return `<svg class="et-tl ${cls}" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}L1440 60Z"/></svg>`; };

// Paysage du hero : ciel, astres, étoiles, collines, pins, camp et feu
function heroSvg() {
  const tent = `<g transform="translate(548 404) scale(1.18)">${unitArt("safari")}</g>`;
  const tipi = `<g transform="translate(944 426) scale(.96)">${unitArt("tipi")}</g>`;
  const cab = `<g transform="translate(1088 438) scale(.5)">${unitArt("bulle")}</g>`;
  const bulbs = [0.16, 0.34, 0.52, 0.7, 0.86].map((t, i) => { const x = (1 - t) * (1 - t) * 700 + 2 * (1 - t) * t * 850 + t * t * 1018, y = (1 - t) * (1 - t) * 436 + 2 * (1 - t) * t * 530 + t * t * 452; return `${glow(Math.round(x), Math.round(y + 6), 24, "et-bulb et-b" + (i % 3))}<circle class="et-bulbc" cx="${Math.round(x)}" cy="${Math.round(y + 6)}" r="4.5"/>`; }).join("");
  const fl = Array.from({ length: 7 }, (_, i) => `<circle class="et-fly et-fl${i % 4}" cx="${520 + i * 96}" cy="${430 + (i % 3) * 36}" r="2.2"/>`).join("");
  return `<svg class="et-sky-svg" viewBox="0 -120 1440 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <g class="et-stars"><g transform="translate(0 -120)">${stars(110, 1440, 760, 7, 0.6)}</g><ellipse class="et-milky" cx="720" cy="150" rx="640" ry="50" transform="rotate(-16 720 150)"/><ellipse class="et-milky et-milky2" cx="700" cy="160" rx="420" ry="22" transform="rotate(-16 700 160)"/></g>
  <g class="et-shoot et-shoot1"><polygon class="et-trail" points="0,0 -130,-4 -130,4"/><circle class="et-st" r="3.6"/></g><g class="et-shoot et-shoot2"><polygon class="et-trail" points="0,0 -90,-3 -90,3"/><circle class="et-st" r="3"/></g>
  <g class="et-clouds"><g class="et-cloud et-cl1"><circle cx="300" cy="150" r="26"/><circle cx="332" cy="140" r="34"/><circle cx="372" cy="152" r="24"/><rect x="290" y="150" width="96" height="26" rx="13"/></g><g class="et-cloud et-cl2"><circle cx="1100" cy="96" r="18"/><circle cx="1128" cy="88" r="26"/><circle cx="1160" cy="98" r="18"/><rect x="1090" y="98" width="82" height="18" rx="9"/></g></g>
  <g transform="translate(990 138)"><g class="et-orb et-moon">${glow(0, 0, 130, "et-gl-moon")}<circle class="et-moond" r="42"/><circle class="et-crat" cx="-12" cy="-8" r="8"/><circle class="et-crat" cx="14" cy="12" r="10"/><circle class="et-crat" cx="10" cy="-20" r="5"/></g><g class="et-orb et-sun"><g class="et-rays">${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-58" x2="0" y2="-76" transform="rotate(${i * 30})"/>`).join("")}</g>${glow(0, 0, 150, "et-gl-sun")}<circle class="et-sund" r="44"/></g></g>
  <path class="et-far" d="M0 420 120 350l110 60 140-90 150 90 120-50 140 70 150-90 150 80 140-70 140 60 100-30V640H0Z"/>
  ${pines([[60, 430, 0.5], [160, 424, 0.42], [330, 436, 0.4], [470, 440, 0.36], [1150, 436, 0.42], [1290, 428, 0.5], [1400, 434, 0.44]], "et-pn3")}
  <path class="et-mid" d="M0 470C200 424 340 452 520 466S860 430 1040 456 1320 440 1440 470V640H0Z"/>
  ${pines([[110, 470, 0.7], [250, 464, 0.62], [400, 476, 0.52], [1080, 470, 0.58], [1230, 466, 0.72], [1370, 472, 0.6]], "et-pn2")}
  <path class="et-near" d="M0 524C240 494 500 534 720 528S1160 494 1440 524V640H0Z"/>
  <g transform="translate(40 0)">${tent}${tipi}${cab}
  <path class="et-rope" d="M700 436Q850 530 1018 452" fill="none"/>${bulbs}
  <g class="et-campfire" transform="translate(826 556)">${glow(0, -10, 150, "et-gl-fire")}<ellipse class="et-ash" cx="0" cy="6" rx="40" ry="8"/><path class="et-flame et-f1" d="M-18 4C-30-14-12-30-8-50-2-34 14-22 8-4Z"/><path class="et-flame et-f2" d="M2 4C-10-14 6-24 12-46 20-30 32-18 20 4Z"/><path class="et-flame et-f3" d="M-8 4C-14-6-4-14 0-26 6-14 12-8 6 4Z"/>
    <path class="et-log" d="M-40 10 8 -2l6 10-48 12Z"/><path class="et-log" d="M40 10-8-2l-6 10 48 12Z"/><circle class="et-spark et-sp1" cx="-6" cy="-52" r="2"/><circle class="et-spark et-sp2" cx="10" cy="-60" r="1.8"/><circle class="et-spark et-sp3" cx="0" cy="-70" r="1.5"/></g></g>
  ${pines([[24, 520, 1.5], [150, 540, 1.2], [300, 552, 0.8], [1180, 548, 0.86], [1300, 540, 1.3], [1420, 524, 1.6]], "et-pn1")}
  ${fl}
  <path class="et-front" d="M0 600C300 570 560 612 760 604S1180 574 1440 598V640H0Z"/></svg>`;
}

// Carte dessinée du domaine (viewBox 800 × 600)
function mapSvg() {
  const r = rnd(99); const keep = (x, y) => Object.values(POS).every(([px, py]) => Math.hypot(x - px * 8, y - py * 6) > 62) && Math.hypot(x - 400, (y - 296) * 0.7) > 80 && !(x > 540 && x < 740 && y > 140 && y < 185) && !(x < 330 && y > 390) && Math.hypot(x - 640, y - 525) > 85 && !(x < 250 && y < 120);
  let trees = ""; let n = 0, guard = 0;
  while (n < 78 && guard++ < 900) { const x = Math.round(r() * 780 + 10), y = Math.round(r() * 560 + 20); if (!keep(x, y)) continue; trees += `M${x} ${y - 11}l6 9h-3l5 8H${x - 8}l5-8h-3Z`; n++; }
  const paths = Object.entries(POS).map(([id, [px, py]]) => { const x = px * 8, y = py * 6, mx = (400 + x) / 2 + (id.charCodeAt(1) % 2 ? 26 : -26), my = (276 + y) / 2 - 18; return `<path d="M400 276Q${mx} ${my} ${x} ${y}"/>`; }).join("");
  return `<svg class="et-mapsvg" viewBox="0 0 800 600" preserveAspectRatio="none" role="img" aria-label="Carte dessinée du domaine : le feu de camp au centre, le lac au sud-ouest, la forêt au nord-est et les huit hébergements reliés par des sentiers" focusable="false">
  <rect class="et-mp-bg" width="800" height="600"/><rect class="et-mp-frame" x="10" y="10" width="780" height="580" rx="14"/>
  <path class="et-mp-hill" d="M520 74 580 40l30 26 36-40 44 50 40-28 60 40"/><path class="et-mp-hill" d="M40 560 90 530l30 22 40-36 40 36"/>
  <path class="et-mp-lake" d="M44 430C70 396 160 380 238 392S322 440 296 508 186 570 110 552 22 470 44 430Z"/><path class="et-mp-rip" d="M90 450q20-10 40 0t40 0M130 490q20-10 40 0t40 0M100 520q20-8 36 0t36 0"/>
  <path class="et-mp-river" d="M700 -4C640 60 560 120 470 130S300 150 300 220 330 330 300 392"/>
  <path class="et-mp-trees" d="${trees}"/>
  <g class="et-mp-trail">${paths}<path d="M640 505Q520 470 440 330"/></g>
  <g transform="translate(400 276)">${glow(0, 0, 70, "et-gl-fire")}<path class="et-flame et-f1" d="M-9 8C-15-4-6-14-3-26 1-16 9-10 5 8Z"/><path class="et-flame et-f2" d="M2 8C-4-2 4-8 7-20 12-10 16-4 11 8Z"/><path class="et-log" d="M-18 12 6 8l2 4-24 5ZM18 12-6 8l-2 4 24 5Z"/></g>
  <g transform="translate(640 505)"><rect class="et-mp-hut" x="-30" y="-14" width="60" height="30"/><path class="et-mp-roof" d="M-38 -12 0 -40l38 28Z"/><rect class="et-mp-door" x="-6" y="0" width="12" height="16"/></g>
  <g class="et-mp-rose" transform="translate(70 70)"><circle r="30"/><path d="M0 -38V38M-38 0H38"/><path class="et-mp-n" d="M0 -38 7 -8H-7Z"/></g>
  <path class="et-mp-doodle" d="M700 560l4 -10 4 10 10 4-10 4-4 10-4-10-10-4Z"/></svg>`;
}

// Mini-ciel des en-têtes de pages intérieures
const miniSky = (seed) => `<svg class="et-ph-sky" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g class="et-stars">${stars(46, 1440, 300, seed, 0.85)}</g></svg><svg class="et-ph-hills" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="et-mid" d="M0 50C200 14 380 60 600 40S1000 8 1240 36 1400 40 1440 30V90H0Z"/>${pines([[60, 70, 0.4], [150, 66, 0.3], [260, 72, 0.34], [1180, 66, 0.36], [1290, 70, 0.4], [1390, 64, 0.3]], "et-pn2")}</svg>`;

// ---------- Structure commune ----------
const planks = (menu, active, cls = "") => menu.map((m, i) => `<a class="et-plank et-pk${(i % 4) + 1}${cls}" href="${esc(m.url)}"${m.url === active ? ' aria-current="page"' : ""}><span>${esc(m.label)}</span></a>`).join("");
const header = (c, active = "/") => `<header class="et-head pk-bleed"><div class="et-bar"><div class="et-wrap et-bar-in">
  <a class="et-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span class="et-logo-t">Étoile<small>glamping &amp; ciel de nuit</small></span></a>
  <a class="et-mode" href="#jour-nuit" role="switch" aria-checked="true" aria-label="Basculer entre le ciel de nuit et le ciel de jour"><span class="et-mode-track"><i class="et-mode-knob"></i></span><span class="et-mode-t" data-mode-t>Nuit</span></a>
  <a class="et-cta" href="/hebergements">Choisir mes dates</a>
  <details class="et-burger"><summary aria-label="Ouvrir le menu"><span class="et-bur-l"><i></i><i></i><i></i></span><span class="et-bur-t">Menu</span></summary>
    <div class="et-drawer" role="navigation" aria-label="Menu mobile">${planks(c.menu, active, " et-pkd")}<a class="et-plank et-pk2 et-pkd et-plank--cta" href="/hebergements"><span>Choisir mes dates</span></a></div></details>
</div></div><div class="et-planks" role="navigation" aria-label="Navigation principale"><div class="et-wrap et-planks-in">${planks(c.menu, active)}</div></div></header>`;

const footer = (c) => `<footer class="et-foot pk-bleed">${treeline("et-tl--foot")}<div class="et-foot-body"><div class="et-wrap et-foot-in">
  <div class="et-foot-brand"><div class="et-foot-logo">${logoMark}<span>Étoile</span></div><p>Huit hébergements dessinés pour dormir dehors, au chaud, sous un vrai ciel de nuit.</p><address>Domaine des Hautes-Clairières<br>Chemin du Lac des Mésanges, 00000 (adresse fictive)</address></div>
  <div><h2 class="et-foot-h">Le domaine</h2><div class="et-fl-col"><a class="et-fl" href="/hebergements">Carte des hébergements</a><a class="et-fl" href="/activites">Activités</a><a class="et-fl" href="/saisons">Saisons et tarifs</a></div></div>
  <div><h2 class="et-foot-h">Nous écrire</h2><div class="et-fl-col"><a class="et-fl" href="/contact">Demande de séjour</a><a class="et-fl" href="/recherche">Rechercher sur le site</a><a class="et-fl" href="mailto:bonsoir@etoile.example">bonsoir@etoile.example</a></div></div></div>
  <p class="et-legal">© Étoile — site de démonstration. Hébergements, prix et horaires fictifs ; aucune réservation ni paiement n'est possible ici.</p></div></footer>`;

const pagehead = (kicker, title, sub, seed, art = "") => sec(`<section class="et-ph pk-bleed">${miniSky(seed)}<div class="et-wrap et-ph-in"><div class="et-ph-copy"><p class="et-kicker" data-reveal>${esc(kicker)}</p><div class="et-title" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="et-ph-sub" data-reveal>${sub}</p>` : ""}</div>${art ? `<div class="et-ph-art" aria-hidden="true">${art}</div>` : ""}</div></section>`);

// ---------- Accueil ----------
const homeCard = (t, i, txt, from) => `<a class="et-hc et-hc${i}" href="/hebergements" data-reveal><span class="et-hc-pin">${i}</span><span class="et-hc-art">${sceneSvg(t, TYPES[t].n)}</span><span class="et-hc-b"><b class="et-hc-n">${TYPES[t].n}</b><span class="et-hc-t">${txt}</span><span class="et-hc-p">dès ${eur(from)} la nuit</span></span></a>`;

const home = (c) => [
  sec(header(c, "/")),
  sec(`<section class="et-hero pk-bleed"><div class="et-skyn" aria-hidden="true"></div><div class="et-skyd" aria-hidden="true"></div><div class="et-hero-art">${heroSvg()}</div>
    <div class="et-wrap et-hero-in"><div class="et-hero-copy"><p class="et-kicker">Glamping &amp; camping nature · 8 hébergements en forêt</p>
    <div class="et-h1" role="heading" aria-level="1">Dormir dehors,<br><em>sous la lanterne</em><br>et les étoiles.</div>
    <p class="et-lead">Tentes safari, cabanes, bulles et tipis posés dans une clairière sans lampadaire : le confort d'un vrai lit, la nuit d'un vrai campement.</p>
    <div class="et-actions"><a class="et-btn" href="/hebergements">Explorer la carte du domaine ${arrow}</a><a class="et-btn et-btn--ghost" href="#jour-nuit" data-mode-btn>Faire se lever le jour</a></div>
    <p class="et-hint">Le ciel de ce site suit le vôtre : essayez la bascule jour/nuit, en haut à droite.</p></div></div></section>`),
  sec(`<section class="et-sec et-sec--stats pk-bleed"><div class="et-wrap"><ul class="et-stats">
    <li data-reveal><b class="et-num" data-count="8">8</b><span>hébergements dispersés dans le domaine</span></li>
    <li data-reveal><b class="et-num" data-count="14" data-suffix=" ha">14 ha</b><span>de forêt, de prairie et de lac</span></li>
    <li data-reveal><b class="et-num" data-count="4">4</b><span>façons de dormir dehors, sans renoncer au chaud</span></li>
    <li data-reveal><b class="et-num">0</b><span>lampadaire : la nuit reste vraiment noire</span></li></ul></div></section>`),
  sec(`<section class="et-sec et-sec--map pk-bleed"><div class="et-wrap"><p class="et-kicker" data-reveal>Le domaine, posé sur la carte</p><h2 class="et-h2" data-reveal>Quatre façons de dormir dehors</h2>
    <p class="et-lead et-lead--s" data-reveal>Chaque hébergement a sa place dans la clairière, au bord du lac ou dans les arbres. Suivez le sentier pointillé, puis ouvrez la carte pour choisir le vôtre.</p>
    <div class="et-hmap">${homeCard("safari", 1, "Toile épaisse, vrai lit, poêle à bois et terrasse couverte.", lowest(120))}${homeCard("cabane", 2, "Perchée dans les chênes, avec mezzanine et vue sur la cime.", lowest(135))}${homeCard("bulle", 3, "Un dôme transparent au bord du lac, pour s'endormir sous la Voie lactée.", lowest(175))}${homeCard("tipi", 4, "Le plus simple et le plus convivial, à deux pas du feu collectif.", lowest(90))}</div>
    <p class="et-center" data-reveal><a class="et-btn" href="/hebergements">Ouvrir la carte et choisir mes dates ${arrow}</a></p></div></section>`),
  sec(`<section class="et-sec et-sec--night pk-bleed">${treeline("et-tl--a")}<div class="et-wrap et-cycle-w"><p class="et-kicker" data-reveal>Une nuit au domaine</p><h2 class="et-h2" data-reveal>Du dernier rayon à la première étoile</h2>
    <ol class="et-cycle"><li class="et-cy" data-reveal><svg class="et-cy-i" viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M8 44h64M20 44a20 20 0 0 1 40 0M40 14v-6M16 22l-5-4M64 22l5-4"/></svg><b>Le soir</b><p>Arrivée dès 16 h. On allume le poêle, on descend au feu. La clairière se vide de ses couleurs, la lanterne prend le relais.</p></li>
    <li class="et-cy" data-reveal><svg class="et-cy-i" viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M50 10a20 20 0 1 0 14 34 16 16 0 0 1-14-34ZM18 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM30 44l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/></svg><b>La nuit</b><p>Veillée, guimauves, puis le silence. Une carte du ciel, des jumelles et une lampe rouge pour garder les yeux habitués à l'obscurité.</p></li>
    <li class="et-cy" data-reveal><svg class="et-cy-i" viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 44h68M18 44a22 22 0 0 1 44 0M40 8v8M22 18l5 5M58 18l-5 5"/><path d="M26 52h28" opacity=".5"/></svg><b>L'aube</b><p>Les oiseaux d'abord, la brume ensuite. Le café arrive sur la terrasse pendant que le soleil monte au-dessus de la forêt.</p></li></ol></div></section>`),
  sec(`<section class="et-sec pk-bleed"><div class="et-wrap et-act-w"><div><p class="et-kicker" data-reveal>Ici, on ne s'ennuie pas</p><h2 class="et-h2" data-reveal>Des activités qui suivent la lumière</h2>
    <p class="et-lead et-lead--s" data-reveal>Randonnée au lever, canoë à midi, veillée au crépuscule : le programme se compose librement, sans horaire imposé.</p>
    <p data-reveal><a class="et-btn et-btn--wood" href="/activites">Voir les activités ${arrow}</a></p></div>
    <div class="et-post" data-reveal aria-label="Idées d'activités"><span class="et-post-pole" aria-hidden="true"></span>
    <a class="et-sign et-sg1" href="/activites"><b>Crêtes</b><small>randonnée · 3 h</small></a><a class="et-sign et-sg2" href="/activites"><b>Lac des Mésanges</b><small>canoë · 1 h 30</small></a><a class="et-sign et-sg3" href="/activites"><b>Feu de camp</b><small>veillée · le soir</small></a><a class="et-sign et-sg4" href="/activites"><b>Observatoire</b><small>étoiles · la nuit</small></a></div></div></section>`),
  sec(`<section class="et-sec et-sec--alt pk-bleed"><div class="et-wrap"><p class="et-kicker" data-reveal>Nos engagements</p><h2 class="et-h2" data-reveal>Dormir dehors, doucement</h2>
    <div class="et-pledges"><article class="et-pl" data-reveal><b class="et-pl-n">1</b><h3>Un ciel préservé</h3><p>Éclairages bas et orientés vers le sol, lampes rouges prêtées pour les observations : la nuit reste noire.</p></article>
    <article class="et-pl" data-reveal><b class="et-pl-n">2</b><h3>Des matériaux sobres</h3><p>Bois local, toile épaisse, poêles à bûches : chaque hébergement se démonte sans laisser de trace.</p></article>
    <article class="et-pl" data-reveal><b class="et-pl-n">3</b><h3>Un confort sans fausse note</h3><p>Vrai lit, linge fourni, eau chaude : on vient pour la forêt, pas pour avoir froid.</p></article></div>
    <div class="et-band-cta" data-reveal><div><b class="et-band-h">Une clairière vous attend ?</b><p>Choisissez un hébergement, indiquez vos dates : nous vous répondons avec les disponibilités.</p></div><a class="et-btn" href="/contact">Écrire au domaine ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

// ---------- Hébergements : carte, fiche et préparation du séjour ----------
const spot = (u) => { const [px, py] = POS[u.id]; return `<a class="et-spot et-p-${u.id}" href="#${u.id}" data-id="${u.id}" data-type="${u.t}" aria-label="${esc(`${TYPES[u.t].n} ${u.name}, ${u.cap} personnes au plus, dès ${lowest(u.base)} euros la nuit`)}">${glyph(u.t)}<span class="et-spot-n">${u.id.toUpperCase()}</span></a>`; };
const fiche = (u, i) => `<article class="et-fiche${i === 0 ? " is-on" : ""}" data-id="${u.id}" data-cap="${u.cap}" data-base="${u.base}" data-extra="${u.extra}" data-name="${esc(`${TYPES[u.t].n} ${u.name}`)}" aria-label="Fiche : ${esc(`${TYPES[u.t].n} ${u.name}`)}">
  <div class="et-fiche-art">${sceneSvg(u.t, `Dessin : ${TYPES[u.t].n} ${u.name}`)}</div><p class="et-chip">${TYPES[u.t].n} · ${u.id.toUpperCase()}</p><h3 class="et-fiche-h">${esc(u.name)}</h3><p class="et-fiche-d">${esc(u.d)}</p>
  <ul class="et-specs"><li><span>Capacité</span><b>${u.cap > 2 && u.t !== "bulle" ? "2 à " + u.cap : u.cap === 2 ? "2" : "2 à " + u.cap} personnes</b></li><li><span>Surface</span><b>${u.m2} m²</b></li><li><span>Prix indicatif</span><b>dès ${eur(lowest(u.base))} la nuit</b></li></ul>
  <ul class="et-eq">${TYPES[u.t].e.map((e) => `<li>${tick}${esc(e)}</li>`).join("")}</ul>
  <a class="et-btn et-btn--block" href="#plan" data-anchor="plan">Choisir mes dates ${arrow}</a></article>`;

const hebergements = (c) => [
  sec(header(c, "/hebergements")),
  pagehead("La carte du domaine", "Choisissez votre <em>coin de nuit</em>", "Touchez un point de la carte : la fiche s'ouvre, puis réglez vos dates et le nombre de voyageurs pour obtenir un récapitulatif.", 11, `<svg viewBox="0 0 200 150" class="et-ph-svg" focusable="false">${unitArt("safari")}</svg>`),
  sec(`<section class="et-sec et-sec--tight pk-bleed"><div class="et-wrap">
    <div class="et-dom" data-domain>
      <div class="et-dom-top"><div class="et-filters" role="group" aria-label="Filtrer par type d'hébergement"><a class="et-flt is-on" href="#tout" data-flt="all" aria-pressed="true">Tous</a>${Object.entries(TYPES).map(([k, v]) => `<a class="et-flt" href="#${k}" data-flt="${k}" aria-pressed="false">${glyph(k, "et-gly et-gly--s")}${v.n}</a>`).join("")}</div>
        <p class="et-count" aria-live="polite" data-count-out>8 hébergements</p></div>
      <div class="et-dom-grid"><div class="et-map"><div class="et-map-in">${mapSvg()}<span class="et-lb et-lb1">Lac des Mésanges</span><span class="et-lb et-lb2">Feu collectif</span><span class="et-lb et-lb3">Accueil</span><span class="et-lb et-lb4">Forêt des Hiboux</span>${UNITS.map(spot).join("")}</div>
        <p class="et-map-note">Carte dessinée, hors échelle. Les sentiers pointillés rejoignent le feu collectif.</p></div>
      <div class="et-fiches" data-fiches></div></div>
      <p class="et-sr" aria-live="polite" data-live></p></div></div></section>`),
  sec(`<section class="et-sec et-sec--plan pk-bleed" data-sec="plan">${treeline("et-tl--a")}<div class="et-wrap"><div class="et-plan" data-plan data-f="${FACT.join(",")}">
    <p class="et-kicker">Préparer mon séjour</p><h2 class="et-h2">Vos dates, vos voyageurs, un récapitulatif</h2>
    <div class="et-plan-grid"><div class="et-plan-main"><div class="et-plan-pick"><span class="et-chip et-chip--g" data-plan-unit>Choisissez un hébergement sur la carte</span></div>
      <div class="et-calw"><div class="et-cal-bar"><a class="et-cal-nav" href="#mois-precedent" data-cal-nav="-1" aria-label="Mois précédent">‹</a><b class="et-cal-t" data-cal-title aria-live="polite"></b><a class="et-cal-nav" href="#mois-suivant" data-cal-nav="1" aria-label="Mois suivant">›</a></div>
        <div class="et-cal" data-cal role="group" aria-label="Calendrier : choisissez l'arrivée puis le départ"></div><p class="et-nojs">Le calendrier demande JavaScript : indiquez vos dates directement dans le formulaire de contact.</p><p class="et-cal-help" data-cal-help aria-live="polite">Choisissez votre jour d'arrivée.</p></div>
      <div class="et-who"><span class="et-who-l">Voyageurs</span><div class="et-step" role="group" aria-label="Nombre de voyageurs"><a href="#moins" data-pp="-1" aria-label="Un voyageur de moins">−</a><b data-pp-n aria-live="polite">2</b><a href="#plus" data-pp="1" aria-label="Un voyageur de plus">+</a></div><span class="et-who-c" data-pp-cap>2 à 4 personnes</span></div></div>
      <aside class="et-recap" aria-label="Récapitulatif de la demande"><b class="et-recap-h">Mon récapitulatif</b>
        <ul class="et-rl"><li><span>Hébergement</span><b data-r="unit">—</b></li><li><span>Arrivée</span><b data-r="in">—</b></li><li><span>Départ</span><b data-r="out">—</b></li><li><span>Nuits</span><b data-r="nights">—</b></li><li><span>Voyageurs</span><b data-r="pers">2</b></li><li class="et-rl-t"><span>Total indicatif</span><b data-r="total">—</b></li></ul>
        <p class="et-recap-w" data-r="warn" aria-live="polite"></p><pre class="et-sum" data-sum></pre>
        <a class="et-btn et-btn--block" href="/contact" data-send>Envoyer ma demande au domaine ${arrow}</a><a class="et-btn et-btn--ghost et-btn--block" href="#copier" data-copy>Copier le récapitulatif</a>
        <p class="et-fine">Prix indicatifs de démonstration. Aucune réservation ni paiement ici : votre récapitulatif arrive dans le formulaire de contact.</p></aside></div></div></div></section>`),
  sec(`<section class="et-sec et-sec--alt pk-bleed"><div class="et-wrap"><h2 class="et-h2" data-reveal>Bon à savoir avant de venir</h2><div class="et-notes">
    <article class="et-note" data-reveal><h3>Arrivée et départ</h3><p>Arrivée entre 16 h et 20 h, départ avant 11 h. Séjour de deux nuits au minimum.</p></article>
    <article class="et-note" data-reveal><h3>Accès</h3><p>Parking à l'accueil, puis sentier balisé de 5 à 10 minutes. Brouette de transport pour les bagages.</p></article>
    <article class="et-note" data-reveal><h3>Animaux</h3><p>Les chiens sont acceptés dans les tipis et les cabanes, tenus en laisse sur le domaine.</p></article>
    <article class="et-note" data-reveal><h3>Météo</h3><p>Chaque hébergement est chauffé ou couvert. Un orage ne gâche rien : on regarde la pluie depuis la terrasse.</p></article></div></div></section>`),
  ...[UNITS.slice(0, 3), UNITS.slice(3, 6), UNITS.slice(6)].map((g, k) => sec(`<section class="et-sec et-cat pk-bleed"><div class="et-wrap">${k === 0 ? `<p class="et-kicker">Le détail de chaque hébergement</p><h2 class="et-h2">Les huit fiches</h2>` : ""}<div class="et-cat-g">${g.map((u, i) => fiche(u, 1)).join("")}</div></div></section>`)),
  sec(footer(c)),
];

// ---------- Activités ----------
const ACT = [
  { c: "jour", n: "Randonnée des crêtes", d: "3 h", l: "Moyen", t: "Un sentier balisé jusqu'aux crêtes, pique-nique dans le sac et vue sur tout le domaine.", g: `<path d="M4 38 18 14l8 12 6-8 12 20ZM18 14l-4 7 4-2 3 3Z"/>` },
  { c: "jour famille", n: "Canoë sur le lac", d: "1 h 30", l: "Facile", t: "Pagaies et gilets prêtés, sortie guidée au calme pour apercevoir hérons et libellules.", g: `<path d="M4 30c8 8 32 8 40 0ZM24 8v16M24 12l10 10H24M4 40q5 3 10 0t10 0 10 0 10 0"/>` },
  { c: "soir famille", n: "Veillée au feu de camp", d: "1 h 30", l: "Facile", t: "Contes, chansons, guimauves grillées. Les bûches sont fournies, la bonne humeur aussi.", g: `<path d="M24 6c-4 8 6 10 2 18 5-2 8-6 6-12 6 6 6 18-8 22C12 36 12 26 18 20c0 3 2 4 3 4-2-6-1-12 3-18ZM8 42l32-4M8 38l32 4"/>` },
  { c: "soir calme", n: "Observation des étoiles", d: "2 h", l: "Facile", t: "Jumelles, carte du ciel du mois et lampes rouges : on apprend à lire constellations et planètes.", g: `<path d="M12 38 30 14l4 3-14 24ZM30 14l8-6 3 3-7 8M18 44h12M24 40v4"/>` },
  { c: "jour famille", n: "Atelier cabane et nœuds", d: "1 h", l: "Facile", t: "Apprendre les nœuds de camp et monter un abri de branches, pour les enfants et les grands enfants.", g: `<path d="M6 40 24 8l18 32ZM14 40l10-18 10 18M10 28q14 6 28 0"/>` },
  { c: "jour calme", n: "Yoga au lever du soleil", d: "1 h", l: "Tous niveaux", t: "Sur la plateforme face à l'est, tapis fournis, avant le petit-déjeuner. Le calme du domaine fait le reste.", g: `<path d="M24 10a4 4 0 1 0 .1 0ZM8 40l8-12h16l8 12M24 18v10M12 22q12 6 24 0M4 44h40"/>` },
  { c: "soir", n: "Cuisine au feu de bois", d: "2 h", l: "Facile", t: "Un cuisinier du domaine montre comment préparer un repas simple et généreux sur braises, que l'on partage ensuite.", g: `<path d="M8 22h32l-3 16H11ZM6 22h36M14 14q4-6 0-10M24 14q4-6 0-10M34 14q4-6 0-10"/>` },
  { c: "soir calme", n: "Bain chauffé au bois", d: "1 h", l: "Détente", t: "Un tonneau d'eau chaude face à la forêt, chauffé au bois, pour regarder passer les étoiles filantes.", g: `<path d="M8 20h32l-3 20H11ZM6 20h36M14 14q3-4 0-8M24 14q3-4 0-8M34 14q3-4 0-8"/>` },
];
const actCard = (a) => `<article class="et-ac" data-cat="${a.c}" data-reveal><svg class="et-ac-i" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${a.g}</svg><h3 class="et-ac-h">${a.n}</h3><p>${a.t}</p><p class="et-ac-m"><span>${a.d}</span><span>${a.l}</span><span>${a.c.includes("soir") ? "Soirée" : "Journée"}</span></p></article>`;
const CONST = [
  { k: "ourse", n: "La Grande Ourse", s: "Visible toute l'année", t: "Sept étoiles dessinent la casserole. Prolongez de cinq fois l'écart entre les deux étoiles du bord : vous tombez sur l'étoile Polaire.", p: "20,40 60,36 98,52 134,60 150,92 196,98 190,56 134,60", dots: [[20, 40], [60, 36], [98, 52], [134, 60], [150, 92], [196, 98], [190, 56]] },
  { k: "cassiopee", n: "Cassiopée", s: "Visible toute l'année", t: "Un grand W facile à reconnaître, en face de la Grande Ourse par rapport à la Polaire. Un repère fiable pour débuter.", p: "18,70 56,34 96,66 136,30 180,64", dots: [[18, 70], [56, 34], [96, 66], [136, 30], [180, 64]] },
  { k: "orion", n: "Orion", s: "Surtout en hiver", t: "Trois étoiles alignées forment sa ceinture, encadrées par Bételgeuse et Rigel. La constellation reine des soirées d'hiver.", p: "70,20 100,60 80,100 120,98 140,56 120,22 100,60", dots: [[70, 20], [120, 22], [100, 60], [140, 56], [80, 100], [120, 98], [60, 62]] },
  { k: "cygne", n: "Le Cygne", s: "Surtout en été", t: "Une grande croix qui suit la Voie lactée. Sa tête pointe vers le sud : on la repère dès que la nuit est tombée, en juillet.", p: "100,16 100,106 40,60 160,60", dots: [[100, 16], [100, 56], [100, 106], [40, 60], [160, 60]] },
];
const constPane = (k, i) => `<div class="et-cs${i === 0 ? " is-on" : ""}" data-pane="${k.k}"><svg class="et-cs-svg" viewBox="0 0 216 120" role="img" aria-label="Schéma de ${esc(k.n)}" focusable="false"><g class="et-stars">${stars(26, 216, 120, 30 + i, 1)}</g><polyline class="et-cs-l" points="${k.p}"/>${k.dots.map(([x, y]) => `<circle class="et-cs-d" cx="${x}" cy="${y}" r="3.4"/>`).join("")}</svg><div><p class="et-chip">${esc(k.s)}</p><h3 class="et-cs-h">${esc(k.n)}</h3><p>${esc(k.t)}</p></div></div>`;

const activites = (c) => [
  sec(header(c, "/activites")),
  pagehead("Journée, soirée, nuit", "Un programme qui <em>suit la lumière</em>", "Randonnées, canoë, veillée, observation du ciel : composez votre séjour avec les activités du domaine. Rien n'est obligatoire.", 23, `<svg viewBox="0 0 160 170" class="et-ph-svg et-ph-sign" focusable="false"><rect class="et-wood2" x="76" y="14" width="10" height="150"/><path class="et-wood" d="M20 26h92l16 14-16 14H20Z"/><path class="et-wood" d="M140 64H52L36 78l16 14h88Z"/><path class="et-wood" d="M20 102h86l16 14-16 14H20Z"/><path d="M30 40h70M60 78h70M30 116h66" fill="none" opacity=".35"/></svg>`),
  sec(`<section class="et-sec et-sec--tight pk-bleed"><div class="et-wrap" data-filterbox>
    <div class="et-filters et-filters--c" role="group" aria-label="Filtrer les activités"><a class="et-flt is-on" href="#toutes" data-cat="all" aria-pressed="true">Toutes</a><a class="et-flt" href="#jour" data-cat="jour" aria-pressed="false">En journée</a><a class="et-flt" href="#soir" data-cat="soir" aria-pressed="false">En soirée</a><a class="et-flt" href="#famille" data-cat="famille" aria-pressed="false">En famille</a><a class="et-flt" href="#calme" data-cat="calme" aria-pressed="false">Moments calmes</a></div>
    <p class="et-count" aria-live="polite" data-count-out>8 activités</p><div class="et-acts">${ACT.map(actCard).join("")}</div>
    <p class="et-fine et-fine--l">Durées et niveaux indicatifs. Certaines activités sont proposées selon la saison et la météo ; le détail vous est confirmé lors de la prise de contact.</p></div></section>`),
  sec(`<section class="et-sec et-sec--night pk-bleed">${treeline("et-tl--a")}<div class="et-wrap"><p class="et-kicker">Ce soir, levez les yeux</p><h2 class="et-h2">Quatre repères pour lire le ciel</h2>
    <div class="et-cons" data-tabs><div class="et-cons-tabs" role="group" aria-label="Choisir une constellation">${CONST.map((k, i) => `<a class="et-flt${i === 0 ? " is-on" : ""}" href="#${k.k}" data-tab="${k.k}" aria-pressed="${i === 0}">${esc(k.n)}</a>`).join("")}</div><div class="et-cons-panes">${CONST.map(constPane).join("")}</div></div></div></section>`),
  sec(`<section class="et-sec pk-bleed"><div class="et-wrap"><h2 class="et-h2" data-reveal>Une journée type</h2><ol class="et-day">
    <li data-reveal><time>7 h 30</time><b>Café sur la terrasse</b><p>Le panier du matin arrive devant votre hébergement.</p></li><li data-reveal><time>10 h</time><b>Randonnée ou canoë</b><p>Départ libre, cartes et pagaies à l'accueil.</p></li>
    <li data-reveal><time>13 h</time><b>Pique-nique au bord du lac</b><p>Ou sieste en hamac, selon l'humeur.</p></li><li data-reveal><time>18 h</time><b>Feu et cuisine sur braises</b><p>Le feu collectif s'allume au coucher du soleil.</p></li>
    <li data-reveal><time>22 h</time><b>Le ciel</b><p>Jumelles, carte du ciel et lampes rouges au pied de la bulle.</p></li></ol>
    <p class="et-center" data-reveal><a class="et-btn" href="/hebergements">Choisir où dormir ${arrow}</a></p></div></section>`),
  sec(footer(c)),
];

// ---------- Saisons et tarifs ----------
const seasonIcon = {
  hiver: `<path d="M24 4v40M6 14l36 20M6 34l36-20M18 6l6 5 6-5M18 42l6-5 6 5"/>`,
  printemps: `<path d="M24 44V22M24 22c-10 0-14-8-14-14 8 0 14 4 14 14ZM24 28c8 0 12-6 12-12-7 0-12 4-12 12Z"/>`,
  ete: `<circle cx="24" cy="24" r="9"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/>`,
  automne: `<path d="M24 44V26M24 6c10 6 16 16 8 26-4 4-12 4-16 0-8-10-2-20 8-26ZM24 26l8-8M24 32l-8-8"/>`,
};
const priceRows = (f) => Object.entries(TYPES).map(([k, v]) => `<tr><th scope="row">${glyph(k, "et-gly et-gly--s")}${v.n}</th><td data-label="Pour 2 personnes">${eur(Math.round(v.base * f))}</td><td data-label="Personne en plus">${eur(k === "tipi" ? Math.round(15 * f) : Math.round(20 * f))}</td></tr>`).join("");
const seasonPane = (s, i) => `<div class="et-sn${i === 2 ? " is-on" : ""}" data-pane="${s.k}"><div class="et-sn-l"><svg class="et-sn-i" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${seasonIcon[s.k]}</svg><p class="et-chip">${s.m}</p><h3 class="et-sn-h">${s.n}</h3><p>${s.t}</p><p class="et-sn-f">Coefficient de saison : ×${String(s.f).replace(".", ",")}</p></div>
  <table class="et-tab"><caption>Prix indicatifs par nuit, ${s.n.toLowerCase() === "été" ? "en été" : s.n === "Automne" ? "en automne" : s.n === "Hiver" ? "en hiver" : "au printemps"}</caption><thead><tr><th scope="col">Hébergement</th><th scope="col">Pour 2 personnes</th><th scope="col">Personne en plus</th></tr></thead><tbody>${priceRows(s.f)}</tbody></table></div>`;
const MON = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], MONF = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const saisons = (c) => [
  sec(header(c, "/saisons")),
  pagehead("Quand venir ?", "Chaque saison a <em>son ciel</em>", "Choisissez votre saison pour voir les tarifs indicatifs. Les prix évoluent avec la fréquentation, jamais avec la météo.", 37, `<svg viewBox="0 0 160 160" class="et-ph-svg et-ph-wheel" focusable="false"><circle class="et-wh0" cx="80" cy="80" r="62"/>${SEASONS.map((s, i) => `<path class="et-wh et-wh${i + 1}" d="M80 80 80 18A62 62 0 0 ${i < 3 ? 1 : 1} ${[142, 80, 18, 80][i]} ${[80, 142, 80, 18][i]}Z" transform="rotate(${i * 90 - 90} 80 80)"/>`).join("")}<circle class="et-wh0" cx="80" cy="80" r="22"/><path class="et-star4" d="m80 62 3.6 14.4L98 80l-14.4 3.6L80 98l-3.6-14.4L62 80l14.4-3.6Z"/></svg>`),
  sec(`<section class="et-sec et-sec--tight pk-bleed"><div class="et-wrap"><div class="et-seas" data-tabs><div class="et-cons-tabs" role="group" aria-label="Choisir une saison">${SEASONS.map((s, i) => `<a class="et-flt${i === 2 ? " is-on" : ""}" href="#${s.k}" data-tab="${s.k}" aria-pressed="${i === 2}">${s.n}</a>`).join("")}</div><div class="et-seas-panes">${SEASONS.map(seasonPane).join("")}</div></div>
    <p class="et-fine et-fine--l">Tarifs indicatifs de démonstration, taxe de séjour non comprise. Le montant exact est confirmé par le domaine après votre demande.</p></div></section>`),
  sec(`<section class="et-sec et-sec--alt pk-bleed"><div class="et-wrap"><p class="et-kicker" data-reveal>L'année en un coup d'œil</p><h2 class="et-h2" data-reveal>Le calendrier des saisons</h2>
    <ol class="et-year" data-reveal>${MON.map((m, i) => { const s = SEASONS.find((x) => x.months.includes(i)); return `<li class="et-mo et-mo--${s.k}"><b aria-hidden="true">${m}</b><span class="et-sr">${MONF[i]} : ${s.n.toLowerCase()}</span><i aria-hidden="true">×${String(s.f).replace(".", ",")}</i></li>`; }).join("")}</ol>
    <ul class="et-legend" data-reveal>${SEASONS.map((s) => `<li><i class="et-lg et-mo--${s.k}"></i>${s.n} · ${s.m}</li>`).join("")}</ul></div></section>`),
  sec(`<section class="et-sec pk-bleed"><div class="et-wrap et-faq-w"><div><p class="et-kicker" data-reveal>Questions fréquentes</p><h2 class="et-h2" data-reveal>Avant de partir</h2><p class="et-lead et-lead--s" data-reveal>Une autre question ? Écrivez-nous, nous répondons sous deux jours ouvrés.</p><p data-reveal><a class="et-btn" href="/contact">Poser une question ${arrow}</a></p></div>
    <div class="et-faq" data-reveal><details><summary>Que comprend le prix ?</summary><p>La nuit pour deux personnes, le linge de lit, le bois du poêle et l'accès aux sanitaires et au feu collectif. Les activités et les repas sont en supplément.</p></details>
    <details><summary>Quelle durée minimale ?</summary><p>Deux nuits au minimum, pour avoir le temps de s'installer et de profiter vraiment du ciel.</p></details>
    <details><summary>Puis-je annuler ?</summary><p>Les conditions détaillées sont envoyées avec la réponse à votre demande. Ce site de démonstration n'enregistre aucune réservation.</p></details>
    <details><summary>Les enfants sont-ils les bienvenus ?</summary><p>Oui, surtout dans les tentes safari et les tipis. Les bulles sont réservées aux grands enfants, pour des raisons de sécurité.</p></details>
    <details><summary>Et s'il fait froid ?</summary><p>Chaque hébergement est chauffé ou équipé d'un poêle, avec couettes et bouillottes. En hiver, on vient justement pour la netteté du ciel.</p></details></div></div></section>`),
  sec(footer(c)),
];

// ---------- Contact, recherche, introuvable ----------
const contact = (c) => [
  sec(header(c, "/contact")),
  pagehead("Bonsoir !", "Écrivez-<em>nous</em>", "Une envie de nuit en forêt ? Indiquez vos dates, le nombre de voyageurs et l'hébergement qui vous fait envie : nous répondons sous deux jours ouvrés.", 53, `<svg viewBox="0 0 120 150" class="et-ph-svg" focusable="false"><path class="et-wood2" d="M60 4v26"/><rect class="et-wood" x="40" y="30" width="40" height="14" rx="3"/><path class="et-lant" d="M44 44h32l6 62H38Z"/><path d="M60 44v62M44 70h32" fill="none" opacity=".5"/><rect class="et-wood" x="34" y="106" width="52" height="12" rx="3"/><circle class="et-glow-f" cx="60" cy="76" r="14"/></svg>`),
  { type: "form", heading: "Envoyer ma demande de séjour", intro: "Si vous avez utilisé la carte, votre récapitulatif est déjà dans le message. Sinon, précisez vos dates et le nombre de voyageurs." },
  sec(`<section class="et-sec et-sec--tight pk-bleed"><div class="et-wrap et-notes et-notes--3"><article class="et-note" data-reveal><h3>Le domaine</h3><address>Domaine des Hautes-Clairières<br>Chemin du Lac des Mésanges<br>00000 (adresse fictive)</address></article>
    <article class="et-note" data-reveal><h3>Choisir avant d'écrire</h3><p>La carte permet de repérer l'hébergement et d'obtenir un prix indicatif.</p><a class="et-more" href="/hebergements">Ouvrir la carte ${arrow}</a></article>
    <article class="et-note" data-reveal><h3>Quand venir ?</h3><p>Chaque saison a son ciel, ses tarifs et son ambiance.</p><a class="et-more" href="/saisons">Voir les saisons ${arrow}</a></article></div></section>`),
  sec(footer(c)),
];

const recherche = (c) => [
  sec(header(c, "/recherche")),
  pagehead("Chercher dans le domaine", "Qu'est-ce qui vous <em>fait rêver</em> ?", "Un hébergement, une activité, une saison : cherchez sur tout le site.", 61, `<svg viewBox="0 0 160 150" class="et-ph-svg" focusable="false"><path class="et-wood" d="M30 130 80 50l8 5-44 82Z"/><path class="et-wood2" d="M82 46 118 18l10 12-30 34Z"/><rect class="et-canvas" x="106" y="14" width="14" height="30" rx="2" transform="rotate(38 113 29)"/><path class="et-wood2" d="M40 140h60M70 118l-10 22M70 118l10 22" fill="none"/><circle class="et-st" cx="132" cy="24" r="2.4"/><circle class="et-st" cx="148" cy="52" r="1.8"/></svg>`),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Tipi, bulle, feu de camp, étoiles…" } }] },
  sec(footer(c)),
];

const introuvable = (c) => [
  sec(header(c, "")),
  sec(`<section class="et-404 pk-bleed"><div class="et-skyn" aria-hidden="true"></div><div class="et-skyd" aria-hidden="true"></div><svg class="et-404-sky" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><g class="et-stars">${stars(80, 1440, 640, 77, 0.6)}</g><g class="et-shoot et-shoot1"><polygon class="et-trail" points="0,0 -130,-4 -130,4"/><circle class="et-st" r="3.6"/></g><g class="et-shoot et-wish" data-wish-star><polygon class="et-trail" points="0,0 -160,-5 -160,5"/><circle class="et-st" r="4.6"/></g>
      <path class="et-far" d="M0 470 160 400l140 60 160-80 180 90 140-50 170 60 160-80 160 70 170-60V640H0Z"/>${pines([[80, 520, 1.3], [210, 536, 0.9], [1220, 530, 1], [1350, 520, 1.4]], "et-pn1")}<path class="et-near" d="M0 560C300 530 560 574 760 566S1180 534 1440 560V640H0Z"/>
      <g transform="translate(900 470) scale(.7)">${unitArt("tipi")}</g><g transform="translate(560 556)">${glow(0, -6, 90, "et-gl-fire")}<path class="et-flame et-f1" d="M-12 4C-20-8-8-18-6-34 0-22 10-14 5 4Z"/><path class="et-flame et-f2" d="M2 4C-4-6 4-14 8-28 14-16 20-8 14 4Z"/><path class="et-log" d="M-28 8 6 0l4 7-34 8ZM28 8-6 0l-4 7 34 8Z"/></g></svg>
    <div class="et-wrap et-404-in"><p class="et-kicker">Sentier perdu</p><div class="et-h1 et-h1--404" role="heading" aria-level="1">404</div><p class="et-lead">La page que vous cherchez a quitté le campement : elle n'existe pas ou a changé d'adresse. Rien de grave, la lanterne est restée allumée.</p>
    <div class="et-actions"><a class="et-btn" href="/">Retour au campement ${arrow}</a><a class="et-btn et-btn--ghost" href="/hebergements">Voir la carte</a><a class="et-btn et-btn--ghost" href="#voeu" data-wish>Faire un vœu</a></div><p class="et-hint" data-wish-out aria-live="polite">Touchez « Faire un vœu » : une étoile filante passe.</p></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "etoile", name: "Étoile", version: "2.0.0", category: "nature", tags: ["naturel", "chaleureux", "sombre"], siteType: "Glamping et camping nature", featured: true,
  concept: "Un ciel de nuit bleu-prune qui devient jour d'un geste : des planches de bois suspendues sous la barre et des hébergements posés sur une carte dessinée du domaine.",
  description: "Glamping sous les étoiles : ciel animé avec vraie bascule jour/nuit, planches de bois en navigation, carte dessinée du domaine avec tentes, cabanes, bulles et tipis cliquables, fiche, dates, voyageurs et récapitulatif envoyé par message.",
  brand: "Étoile Glamping", modules: ["formulaires", "recherche"],
  dna: {
    header: "planches-de-bois-suspendues-sous-la-barre-et-bascule-jour-nuit",
    hero: "campement-sous-un-ciel-etoile-anime-avec-bascule-jour-nuit-reelle",
    grid: "hebergements-positionnes-sur-une-carte-dessinee-du-domaine",
    motion: "etoiles-qui-scintillent-etoile-filante-et-flammes-du-feu-de-camp",
    shapes: "tentes-dessinees-silhouettes-de-pins-lanternes-et-planches-cloutees",
    rhythm: "du-soir-a-l-aube-bandes-nuit-et-bois-separees-par-des-cimes",
    signature: "carte-du-domaine-cliquable-fiche-dates-voyageurs-et-recapitulatif",
  },
  tokens: {
    colors: { primary: "#f0a03c", secondary: "#b9803f", accent: "#ffd479", background: "#1c1237", surface: "#2d2056", text: "#f7ecd8", muted: "#c9bcdc", success: "#7fd39a", warning: "#ffd479", error: "#ff9a8a" },
    fonts: { heading: "font.londrina-solid", body: "font.alegreya-sans", button: "font.londrina-solid", link: "font.alegreya-sans" },
    radius: { sm: 6, md: 10, lg: 16, button: 10, field: 10, card: 14 }, shadow: { card: "0 10px 30px rgba(8,4,24,.45)", button: "0 3px 0 rgba(42,22,8,.7)" }, border: { width: 2, color: "#7a4c22" },
    type: { h1: { size: 84, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 48, weight: 400, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "lantern", label: "Lueur de lanterne", type: "color", default: "#ffb454" },
    { key: "wood", label: "Bois des planches", type: "color", default: "#b9803f" },
    { key: "start", label: "Ciel à l'arrivée", type: "choice", default: "nuit", choices: [["nuit", "Nuit"], ["jour", "Jour"], ["auto", "Selon l'heure"]] },
    { key: "stars", label: "Étoiles qui scintillent", type: "choice", default: "on", choices: [["on", "Animées"], ["off", "Fixes"]] },
    { key: "shoot", label: "Étoile filante", type: "choice", default: "on", choices: [["on", "Oui"], ["off", "Non"]] },
  ],
  menu: [["Accueil", "/"], ["Hébergements", "/hebergements"], ["Activités", "/activites"], ["Saisons et tarifs", "/saisons"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "hebergements", name: "Hébergements", render: hebergements }, { key: "activites", name: "Activités", render: activites },
    { key: "saisons", name: "Saisons et tarifs", render: saisons }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
