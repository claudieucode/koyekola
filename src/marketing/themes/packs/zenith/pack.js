// Zénith — planétarium et observatoire. Direction artistique : carte du ciel. Nuit indigo profond, encre blanche, or des constellations ; un planisphère circulaire
// qui tourne lentement, des constellations reliées qui s'allument au survol, un programme de coupole filtrable avec réservation de places et un « ciel ce soir » par mois.
const { sec, form, esc, nav } = require("../kit");

/* ---------- données du ciel (ascension droite en heures, déclinaison en degrés) ---------- */
const CONS = [
  { k: "ourse", n: "Grande Ourse", ra: 11.2, dec: 56, circ: true, star: "Dubhé et Mérak montrent la Polaire", t: "Sept étoiles dessinent la « Grande Casserole ». Prolongez de cinq fois la distance entre Mérak et Dubhé : vous tombez sur l'étoile Polaire. Elle ne se couche jamais sous nos latitudes.",
    pts: [[-44, -2], [-8, -8], [2, 20], [-36, 26], [26, -22], [58, -34], [88, -28]], ln: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [5, 6]], big: [0, 1, 5] },
  { k: "cassiopee", n: "Cassiopée", ra: 1.0, dec: 61, circ: true, star: "Schédar, au creux du W", t: "Cinq étoiles en W (ou en M selon l'heure). Elle fait face à la Grande Ourse de l'autre côté de la Polaire : quand l'une est haute, l'autre est basse.",
    pts: [[-36, 8], [-18, -12], [0, 6], [19, -12], [38, 10]], ln: [[0, 1], [1, 2], [2, 3], [3, 4]], big: [2] },
  { k: "orion", n: "Orion", ra: 5.6, dec: 1, star: "Bételgeuse, supergéante rouge", t: "Le chasseur : Bételgeuse rougeoie à l'épaule, Rigel brille de blanc-bleu au pied et les trois étoiles du Baudrier forment un alignement parfait. Sous le Baudrier, la nébuleuse d'Orion se devine aux jumelles.",
    pts: [[-22, -42], [24, -40], [-13, 0], [0, 2], [13, 4], [-22, 44], [28, 46], [0, -54]], ln: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 7], [1, 7]], big: [0, 6] },
  { k: "gemeaux", n: "Gémeaux", ra: 7.1, dec: 26, star: "Castor et Pollux, têtes jumelles", t: "Castor et Pollux, deux étoiles voisines, figurent les têtes des jumeaux ; deux lignes parallèles dessinent leurs corps jusqu'aux pieds, près de la Voie lactée d'hiver.",
    pts: [[-14, -38], [10, -34], [-20, -8], [4, -4], [-28, 24], [-6, 26], [18, 20]], ln: [[0, 1], [0, 2], [2, 4], [1, 3], [3, 5], [3, 6]], big: [0, 1] },
  { k: "lion", n: "Lion", ra: 10.6, dec: 14, star: "Régulus, le cœur du Lion", t: "Une faucille en point d'interrogation renversé finit sur Régulus, l'étoile du cœur, puis un triangle de trois étoiles dessine la croupe jusqu'à Dénébola.",
    pts: [[-32, 24], [-30, 2], [-24, -18], [-10, -32], [6, -28], [36, -8], [32, 20], [70, 6]], ln: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 7], [5, 6], [6, 7]], big: [0] },
  { k: "lyre", n: "Lyre", ra: 18.9, dec: 37, star: "Véga, reine du ciel d'été", t: "Un petit parallélogramme accroché à Véga, l'une des étoiles les plus brillantes du ciel. Entre les deux étoiles du bas se loge la nébuleuse planétaire de la Lyre, au télescope.",
    pts: [[0, -28], [-9, 0], [13, 2], [9, 30], [-13, 26]], ln: [[0, 1], [0, 2], [1, 2], [1, 4], [2, 3], [3, 4]], big: [0] },
  { k: "cygne", n: "Cygne", ra: 20.6, dec: 42, star: "Deneb et Albiréo", t: "La « Croix du Nord » : Deneb marque la queue, Albiréo le bec. Cette dernière est une étoile double dorée et bleue, un joyau au télescope. La Voie lactée l'enveloppe.",
    pts: [[0, -46], [0, -2], [0, 46], [-38, -8], [38, -14]], ln: [[0, 1], [1, 2], [3, 1], [1, 4]], big: [0, 2] },
  { k: "scorpion", n: "Scorpion", ra: 17.0, dec: -30, low: true, star: "Antarès, le cœur rouge", t: "Une longue courbe se termine par un dard ; Antarès, supergéante rouge, en occupe le cœur. Basse sur l'horizon sud de nos latitudes, elle demande un horizon dégagé.",
    pts: [[-14, -34], [-30, -20], [-10, -12], [0, 0], [12, 16], [24, 38], [18, 60], [-2, 70], [-20, 62]], ln: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]], big: [3] },
  { k: "pegase", n: "Pégase", ra: 22.9, dec: 20, star: "Le Grand Carré, repère d'automne", t: "Le Grand Carré d'automne : quatre étoiles aux coins d'un carré presque parfait. Depuis son coin nord-est, un alignement mène à la galaxie d'Andromède, visible à l'œil nu loin des lumières.",
    pts: [[-32, -30], [30, -30], [34, 28], [-28, 28], [-66, 48], [-92, 66]], ln: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5]], big: [0] },
];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const meridian = (m) => { const doy = (m - 0.5) * 30.44; return ((((doy - 80) / 365.25) * 24 + 10) % 24 + 24) % 24; };
const dRA = (a, b) => { const d = Math.abs(a - b) % 24; return Math.min(d, 24 - d); };
for (const c of CONS) { c.months = []; for (let m = 1; m <= 12; m++) if (c.circ || dRA(c.ra, meridian(m)) <= (c.low ? 3.4 : 5.6)) c.months.push(m); }
const period = (c) => {
  if (c.circ) return "Visible toute l'année";
  const ms = c.months, set = new Set(ms); let start = ms.find((m) => !set.has(((m + 10) % 12) + 1)); if (!start) start = ms[0];
  let end = start; while (set.has((end % 12) + 1) && (end % 12) + 1 !== start) end = (end % 12) + 1;
  return ms.length === 1 ? `Bien placée en ${MOIS[start - 1]}` : `Visible de ${MOIS[start - 1]} à ${MOIS[end - 1]}`;
};

/* ---------- carte du ciel en SVG ---------- */
const R = (n) => Math.round(n * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const pol = (ra, dec) => { const r = ((90 - dec) / 130) * 250, a = rad(-ra * 15); return [300 + r * Math.sin(a), 300 - r * Math.cos(a)]; };
const rp = (r, deg) => [300 + r * Math.sin(rad(deg)), 300 - r * Math.cos(rad(deg))];
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const field = (() => { const g = [[], [], []]; let tw = ""; for (let i = 0; i < 130; i++) { const r = Math.sqrt(rnd()) * 246, an = rnd() * 6.2832; const x = R(300 + r * Math.cos(an)), y = R(300 + r * Math.sin(an)); const sz = Math.floor(rnd() * 3); if (i % 6 === 0) tw += `<circle class="zn-tw${1 + (i % 4)}" cx="${x}" cy="${y}" r="1.1" fill="#dfe8ff"/>`; else g[sz].push(`M${x} ${y}h.1`); } return g.map((p, i) => `<path d="${p.join("")}" stroke="#dfe8ff" stroke-width="${[1, 1.6, 2.3][i]}" stroke-linecap="round" opacity="${[0.5, 0.65, 0.85][i]}"/>`).join("") + tw; })();
const ticks = (() => { const g = { big: "", mid: "", min: "" }; for (let d = 0; d < 360; d += 5) { const k = d % 30 === 0 ? "big" : d % 15 === 0 ? "mid" : "min"; const a = rp(k === "big" ? 270 : k === "mid" ? 278 : 283, d), b = rp(292, d); g[k] += `M${R(a[0])} ${R(a[1])}L${R(b[0])} ${R(b[1])}`; } return `<path d="${g.big}" stroke="#f4c95d" stroke-width="1.6" fill="none"/><path d="${g.mid}" stroke="#8c9ad6" stroke-width="1" fill="none"/><path d="${g.min}" stroke="#8c9ad6" stroke-width="1" fill="none" opacity=".7"/>`; })();
const raLines = (() => { let a = "", m = ""; for (let h = 0; h < 24; h++) { const q = rp(250, -h * 15); (h % 6 === 0 ? (m += `M300 300L${R(q[0])} ${R(q[1])}`) : (a += `M300 300L${R(q[0])} ${R(q[1])}`)); } return `<path class="zn-ra" d="${a}"/><path class="zn-ra zn-ra--m" d="${m}"/>`; })();
const decCircles = [60, 30, 0, -30].map((d) => `<circle class="${d === 0 ? "zn-dec zn-dec--eq" : "zn-dec"}" cx="300" cy="300" r="${R(((90 - d) / 130) * 250)}"/>`).join("");
const arc = (r1, r2, a0, a1) => { const p = [rp(r2, a0), rp(r2, a1), rp(r1, a1), rp(r1, a0)].map((q) => `${R(q[0])} ${R(q[1])}`); return `M${p[0]}A${r2} ${r2} 0 0 1 ${p[1]}L${p[2]}A${r1} ${r1} 0 0 0 ${p[3]}Z`; };
const monthArcs = () => { let s = ""; for (let m = 1; m <= 12; m++) { const c = -meridian(m) * 15; s += `<path class="zn-mo" data-m="${m}" d="${arc(256, 268, c - 13, c + 13)}"></path>`; } return s; };
const conSvg = (c) => {
  const [cx, cy] = pol(c.ra, c.dec); const P = c.pts.map(([x, y]) => [R(cx + x * 0.86), R(cy + y * 0.86)]);
  const lines = c.ln.map(([a, b]) => `M${P[a][0]} ${P[a][1]}L${P[b][0]} ${P[b][1]}`).join("");
  const stars = P.map(([x, y], i) => c.big.includes(i) ? `<circle class="zn-halo" cx="${x}" cy="${y}" r="9"/><circle class="zn-st" cx="${x}" cy="${y}" r="3.4"/>` : `<circle class="zn-st" cx="${x}" cy="${y}" r="2.1"/>`).join("");
  const hit = Math.round(Math.max(...P.map(([x, y]) => Math.hypot(x - cx, y - cy))) + 16);
  return `<g class="zn-con" data-con="${c.k}"><title>${esc(c.n)}</title><circle class="zn-hit" cx="${R(cx)}" cy="${R(cy)}" r="${hit}"/><path class="zn-cl" d="${lines}"/>${stars}</g>`;
};
const skyChart = (cls = "") => `<div class="zn-dome ${cls}"><svg class="zn-sky" viewBox="0 0 600 600" role="img" aria-label="Planisphère : neuf constellations reliées par des traits, vues depuis le pôle nord céleste">
  <circle cx="300" cy="300" r="293" fill="none" stroke="#6f7fc7" stroke-width="1.2"/>${ticks}
  <polygon class="zn-ptr" points="300,262 292,248 308,248"/>
  <g class="zn-disc"><circle cx="300" cy="300" r="250" fill="#0c1445" opacity=".55"/><g>${decCircles}${raLines}</g>
    <ellipse class="zn-ecl" cx="345" cy="300" rx="173" ry="192"/>
    <ellipse cx="300" cy="300" rx="250" ry="52" transform="rotate(38 300 300)" fill="#9fb4ff" opacity=".07"/><ellipse cx="300" cy="300" rx="240" ry="26" transform="rotate(38 300 300)" fill="#bcd0ff" opacity=".07"/>
    <g>${field}</g><g>${monthArcs()}</g>${CONS.map(conSvg).join("")}<circle cx="300" cy="300" r="3" fill="#f4c95d"/><circle class="zn-pole" cx="300" cy="300" r="9"/></g></svg></div>`;
const chip = (c) => `<a class="zn-chip" href="#${c.k}" data-con="${c.k}" data-name="${esc(c.n)}" data-star="${esc(c.star)}" data-per="${esc(period(c))}" data-txt="${esc(c.t)}" data-m="${c.months.join(" ")}">${esc(c.n)}</a>`;
const infoBox = () => `<div class="zn-info" aria-live="polite"><p class="zn-info-k">Constellation</p><h3 class="zn-info-n">Survolez le ciel</h3><p class="zn-info-s"></p><p class="zn-info-t">Passez la souris sur une constellation, touchez-la ou choisissez-la dans la liste : la carte la surligne et l'explique.</p><p class="zn-info-m"></p></div>`;

/* ---------- séances ---------- */
const SES = [
  { k: "s1", t: "Voyage au cœur de la Voie lactée", ty: "film", pub: "tous", dur: 38, lang: "fr", cap: 120, sy: "Un film immersif sur 360° : on quitte la Terre, on traverse le disque galactique et on découvre ce que cachent les nuages de poussière. Les étoiles passent au-dessus de vous, jusqu'au centre de la galaxie.", pts: ["Projection en dôme 360°, fauteuils inclinables", "Commentaire d'un médiateur avant la séance (5 min)", "Dès 6 ans"], sl: [["Sam. 14 nov.", "15 h 00", 41], ["Sam. 14 nov.", "17 h 00", 9], ["Dim. 15 nov.", "15 h 00", 63]] },
  { k: "s2", t: "Les étoiles de Mia", ty: "film", pub: "famille", dur: 30, lang: "fr", cap: 120, sy: "Mia ne sait pas dormir sans voir les étoiles. Un conte animé pour les plus jeunes, qui apprend à reconnaître la Lune, quelques constellations et à ne plus avoir peur du noir.", pts: ["Lumière douce, pas de son fort", "Les tout-petits peuvent s'asseoir sur les coussins du premier rang", "De 4 à 8 ans"], sl: [["Mer. 18 nov.", "14 h 30", 56], ["Sam. 21 nov.", "10 h 30", 17], ["Dim. 22 nov.", "10 h 30", 72]] },
  { k: "s3", t: "Trous noirs : l'ombre et la lumière", ty: "film", pub: "adultes", dur: 45, lang: "en", cap: 120, sy: "Du premier trou noir imaginé au XVIIIe siècle jusqu'aux images de leur ombre : un film en version originale anglaise, sous-titré en français, avec simulations réalisées à partir de données scientifiques.", pts: ["Version originale anglaise, sous-titres français", "Simulations numériques en dôme", "À partir de 12 ans"], sl: [["Ven. 20 nov.", "20 h 30", 28], ["Sam. 28 nov.", "20 h 30", 4], ["Ven. 4 déc.", "20 h 30", 90]] },
  { k: "s4", t: "Exoplanètes : le recensement continue", ty: "conf", pub: "adultes", dur: 75, lang: "fr", cap: 120, sy: "Comment détecte-t-on une planète à des années-lumière ? Une astrophysicienne explique les méthodes (transits, vitesses radiales) et ce qu'elles révèlent des mondes possiblement habitables, avec temps de questions.", pts: ["Exposé de 50 min + 25 min de questions", "Illustré par des simulations en dôme", "À partir de 14 ans"], sl: [["Jeu. 19 nov.", "19 h 00", 77], ["Jeu. 3 déc.", "19 h 00", 102]] },
  { k: "s5", t: "Pourquoi la Lune change-t-elle de forme ?", ty: "conf", pub: "famille", dur: 40, lang: "fr", cap: 120, sy: "Une conférence à manipuler : avec une lampe, une balle et un peu d'imagination, on comprend les phases de la Lune, les éclipses et les marées. Les questions des enfants sont les bienvenues.", pts: ["Ateliers de démonstration au centre de la salle", "Un livret de jeux est remis à chaque enfant", "Dès 8 ans"], sl: [["Mer. 25 nov.", "14 h 30", 33], ["Sam. 28 nov.", "14 h 30", 12], ["Mer. 2 déc.", "14 h 30", 80]] },
  { k: "s6", t: "Le Soleil, notre étoile (interprétée en LSF)", ty: "conf", pub: "tous", dur: 55, lang: "lsf", cap: 120, sy: "Taches, éruptions, cycle de onze ans : tout ce qu'il faut savoir sur le Soleil, présenté avec une interprète en langue des signes française placée au pied du dôme. Boucle magnétique disponible.", pts: ["Interprétation en LSF en continu", "Places réservées près de l'interprète", "Boucle d'induction magnétique"], sl: [["Dim. 29 nov.", "16 h 00", 58], ["Dim. 13 déc.", "16 h 00", 95]] },
  { k: "s7", t: "Nuit d'observation au télescope", ty: "obs", pub: "tous", dur: 90, lang: "fr", cap: 30, sy: "Sur la terrasse de l'observatoire, quatre télescopes pointés vers la Lune, les planètes visibles et quelques objets du ciel profond (selon la météo et la saison). Chaque groupe est guidé par un animateur.", pts: ["Sur la terrasse, en extérieur : habillez-vous chaudement", "Séance reportée en cas de ciel couvert", "Dès 8 ans"], sl: [["Ven. 13 nov.", "21 h 00", 11], ["Sam. 21 nov.", "21 h 00", 3], ["Sam. 5 déc.", "21 h 00", 19]] },
  { k: "s8", t: "Initiation : lire le ciel à l'œil nu", ty: "obs", pub: "famille", dur: 60, lang: "fr", cap: 30, sy: "Sans télescope : on apprend à trouver la Polaire, à relier les constellations et à repérer quelques repères du ciel de saison avec un planisphère. Un atelier idéal pour débuter en famille.", pts: ["Un planisphère de poche est prêté", "Lampes rouges fournies pour préserver la vision de nuit", "Dès 7 ans"], sl: [["Mer. 18 nov.", "18 h 30", 21], ["Mer. 9 déc.", "18 h 30", 24]] },
  { k: "s9", t: "Aurores : les lumières du nord", ty: "film", pub: "tous", dur: 50, lang: "en", cap: 120, sy: "Un voyage de la Norvège à l'Alaska pour comprendre d'où viennent les aurores polaires, filmé en haute résolution et projeté en dôme. Version originale anglaise, sous-titres français.", pts: ["Version originale anglaise, sous-titres français", "Livret de traduction pour les plus jeunes", "À partir de 8 ans"], sl: [["Sam. 12 déc.", "17 h 00", 49], ["Dim. 13 déc.", "17 h 00", 86]] },
];
const TYPE = { film: "Film immersif", conf: "Conférence", obs: "Observation" };
const PUB = { tous: "Tout public", famille: "En famille", adultes: "Ados et adultes" };
const LANG = { fr: "Français", en: "English (VOST)", lsf: "LSF" };
const durB = (d) => (d <= 45 ? "court" : d <= 60 ? "moyen" : "long");
const dial = (m) => { const a = Math.min(m / 120, 0.999) * 360; const q = (r, d) => [R(50 + r * Math.sin(rad(d))), R(50 - r * Math.cos(rad(d)))]; const p0 = q(40, 0), p1 = q(40, a); const tk = [0, 90, 180, 270].map((d) => { const u = q(44, d), v = q(49, d); return `<line x1="${u[0]}" y1="${u[1]}" x2="${v[0]}" y2="${v[1]}" stroke="#8c9ad6" stroke-width="1.4"/>`; }).join(""); return `<svg class="zn-dial" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#2a3680" stroke-width="5"/><path d="M${p0[0]} ${p0[1]}A40 40 0 ${a > 180 ? 1 : 0} 1 ${p1[0]} ${p1[1]}" fill="none" stroke="#f4c95d" stroke-width="5" stroke-linecap="round"/><circle cx="${p1[0]}" cy="${p1[1]}" r="3.4" fill="#fff"/>${tk}</svg>`; };
const illus = {
  film: `<svg class="zn-ill" viewBox="0 0 240 160" aria-hidden="true"><path d="M20 130a100 100 0 0 1 200 0z" fill="#111b5c" stroke="#8c9ad6" stroke-width="1.5"/><path d="M40 130a80 80 0 0 1 160 0" fill="none" stroke="#2a3680" stroke-width="1"/><circle cx="120" cy="130" r="5" fill="#f4c95d"/><path d="M120 130 62 66M120 130l-26-70M120 130l26-70M120 130l58-64" stroke="#f4c95d" stroke-width="1" opacity=".55"/><circle cx="62" cy="66" r="3" fill="#fff"/><circle cx="94" cy="60" r="2" fill="#fff"/><circle cx="146" cy="60" r="3.4" fill="#fff"/><circle cx="178" cy="66" r="2" fill="#fff"/><path d="M52 146h136" stroke="#8c9ad6" stroke-width="1.5"/></svg>`,
  conf: `<svg class="zn-ill" viewBox="0 0 240 160" aria-hidden="true"><rect x="28" y="22" width="184" height="104" rx="6" fill="#111b5c" stroke="#8c9ad6" stroke-width="1.5"/><path d="M44 96h40l8-6 8 6h34l6-34 6 34h64" fill="none" stroke="#f4c95d" stroke-width="2" stroke-linejoin="round"/><path d="M44 112h152" stroke="#2a3680" stroke-width="1"/><circle cx="170" cy="48" r="7" fill="#9fe3f2"/><circle cx="170" cy="48" r="12" fill="none" stroke="#9fe3f2" stroke-width="1" opacity=".5"/><path d="M110 126v20m-20 0h40" stroke="#8c9ad6" stroke-width="1.8"/></svg>`,
  obs: `<svg class="zn-ill" viewBox="0 0 240 160" aria-hidden="true"><circle cx="40" cy="36" r="1.6" fill="#fff"/><circle cx="188" cy="24" r="2" fill="#fff"/><circle cx="210" cy="64" r="1.4" fill="#fff"/><circle cx="90" cy="18" r="1.4" fill="#fff"/><path d="M60 142 120 92m0 0 60 50M120 92v50" stroke="#8c9ad6" stroke-width="2.2" stroke-linecap="round"/><path d="M90 84 150 40l10 14-60 44z" fill="#111b5c" stroke="#f4c95d" stroke-width="2" stroke-linejoin="round"/><circle cx="190" cy="40" r="9" fill="#f4c95d" opacity=".9"/><path d="M20 146h200" stroke="#2a3680" stroke-width="1.5"/></svg>`,
};
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const star4 = `<svg class="zn-s4" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1c.8 6.5 4.5 10.2 11 11-6.5.8-10.2 4.5-11 11-.8-6.5-4.5-10.2-11-11 6.5-.8 10.2-4.5 11-11z" fill="currentColor"/></svg>`;
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? " " + String(m % 60).padStart(2, "0") : ""}` : `${m} min`);
const left = (s) => s.sl.reduce((a, x) => a + x[2], 0);
const card = (s, mode = "grid") => { const next = s.sl[0];
  return `<article class="zn-card zn-ty-${s.ty}" data-item data-type="${s.ty}" data-pub="${s.pub === "tous" ? "tous famille adultes" : s.pub}" data-dur="${durB(s.dur)}" data-lang="${s.lang}">
    <div class="zn-dialbox">${dial(s.dur)}<span class="zn-dialtx"><b>${s.dur}</b><i>min</i></span></div>
    <p class="zn-card-ty">${star4}${TYPE[s.ty]}</p><h3 class="zn-card-t">${esc(s.t)}</h3>
    <p class="zn-card-m"><span>${PUB[s.pub]}</span><span>${LANG[s.lang]}</span></p>
    <p class="zn-card-n"><time>${next[0]} · ${next[1]}</time><span${next[2] < 15 ? ' class="zn-few"' : ""}>${next[2]} places restantes</span></p>
    <div class="zn-card-a"><a class="zn-btn zn-btn--gold" href="#reserver" data-reserve="${s.k}">Réserver</a><a class="zn-btn zn-btn--line" href="/seance#${s.k}" aria-label="Fiche de la séance : ${esc(s.t)}">Fiche ${arrow}</a></div></article>`; };

/* ---------- gabarits ---------- */
const MOON = (cls = "") => `<svg class="zn-moon ${cls}" viewBox="0 0 100 100" aria-hidden="true"><circle class="zn-moon-d" cx="50" cy="50" r="46"/><path class="zn-moon-l" d="M50 4A46 46 0 0 1 50 96A23 46 0 0 1 50 4Z"/><circle class="zn-moon-o" cx="50" cy="50" r="46"/></svg>`;
const LOGO = `<svg class="zn-logo" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="#f4c95d" stroke-width="1.6"/><ellipse cx="24" cy="24" rx="21" ry="8" fill="none" stroke="#8c9ad6" stroke-width="1.2" transform="rotate(-24 24 24)"/><circle cx="24" cy="24" r="4.5" fill="#f4c95d"/><circle cx="40" cy="17" r="2.4" fill="#fff"/></svg>`;

const header = (c) => `<header class="zn-head pk-bleed"><div class="zn-bar">
  <a class="zn-brand" href="/" aria-label="${esc(c.brand)} — accueil">${LOGO}<span class="zn-brand-t"><strong>Zénith</strong><small>Planétarium &amp; observatoire</small></span></a>
  <div class="zn-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "zn-nl")}</div>
  <div class="zn-lune" title="Phase de la Lune, calculée pour aujourd'hui" data-moon>${MOON("zn-moon--s")}<span class="zn-lune-t"><i>La Lune ce soir</i><b class="zn-lune-n">Premier quartier</b></span></div>
  <details class="zn-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="zn-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu, "zn-nl")}<a class="zn-btn zn-btn--gold" href="/seances">Réserver une séance</a></div></details>
  </div></header>`;

const footer = (c) => `<footer class="zn-foot pk-bleed"><div class="zn-wrap"><div class="zn-foot-top"><div>${LOGO}<p class="zn-foot-lead">Levez les yeux. Le ciel est déjà là.</p><p class="zn-foot-addr">Observatoire de la Colline<br>2 chemin de l'Étoile · 38000 Grenoble</p></div>
  <div><h3>Visiter</h3>${nav(c.menu.slice(1, 4), "zn-fl")}</div><div><h3>Infos</h3><a class="zn-fl" href="/contact">Contact &amp; accès</a><a class="zn-fl" href="/recherche">Recherche</a><a class="zn-fl" href="/scolaires">Groupes scolaires</a></div>
  <div><h3>Ouverture</h3><p class="zn-foot-h">Mer. – dim. : 14 h – 22 h<br>Soirées d'observation : voir le programme</p></div></div>
  <p class="zn-legal">© Zénith — site de démonstration. Séances, horaires, places et lieux fictifs ; positions des constellations indicatives.</p></div></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="zn-ph pk-bleed"><svg class="zn-ph-art" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="190" fill="none" stroke="#2a3680" stroke-width="1.2"/><circle cx="200" cy="200" r="140" fill="none" stroke="#2a3680" stroke-width="1.2"/><circle cx="200" cy="200" r="90" fill="none" stroke="#3a4aa0" stroke-width="1.2"/><circle cx="200" cy="200" r="40" fill="none" stroke="#f4c95d" stroke-width="1.2" opacity=".6"/><path d="M200 10v380M10 200h380" stroke="#2a3680" stroke-width="1"/><circle cx="314" cy="80" r="4" fill="#f4c95d"/><circle cx="84" cy="150" r="2.4" fill="#fff"/><circle cx="130" cy="320" r="3" fill="#fff"/><circle cx="340" cy="270" r="2" fill="#fff"/></svg>
  <div class="zn-wrap"><p class="zn-kicker" data-reveal>${esc(kicker)}</p><div class="zn-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="zn-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

/* filtres de la programmation */
const filters = () => `<div class="zn-filters" role="group" aria-label="Filtrer les séances">
  ${[["type", "Type", [["all", "Toutes"], ["film", "Films"], ["conf", "Conférences"], ["obs", "Observations"]]], ["pub", "Public", [["all", "Tous"], ["famille", "Famille"], ["adultes", "Ados / adultes"]]], ["dur", "Durée", [["all", "Toutes"], ["court", "Moins de 45 min"], ["moyen", "45 – 60 min"], ["long", "Plus d'une heure"]]], ["lang", "Langue", [["all", "Toutes"], ["fr", "Français"], ["en", "English"], ["lsf", "LSF"]]]]
    .map(([g, lab, opts]) => `<div class="zn-fg"><span class="zn-fg-l">${lab}</span><div class="zn-fg-o">${opts.map(([v, l], i) => `<a href="#${g}-${v}" class="zn-fo${i ? "" : " is-on"}" data-g="${g}" data-v="${v}" aria-pressed="${i ? "false" : "true"}">${l}</a>`).join("")}</div></div>`).join("")}
  <p class="zn-count" role="status" aria-live="polite"><b data-n>${SES.length}</b> séances affichées</p></div>`;

const booking = (mode) => `<section class="zn-book pk-bleed" data-book="${mode}"><div class="zn-wrap"><div class="zn-book-in"><div class="zn-book-form">
  <p class="zn-kicker">Réserver vos places</p><h2 class="zn-h2">Votre séance, vos places</h2>
  <p class="zn-sub">Démonstration : le compteur de places est fictif et rien n'est enregistré ici. Votre récapitulatif s'envoie ensuite à l'équipe via la page de contact.</p>
  ${mode === "all" ? `<div class="zn-step"><p class="zn-step-t"><b>1</b> Choisissez la séance</p><div class="zn-pick" role="group" aria-label="Séance">${SES.map((s, i) => `<a class="zn-pk${i ? "" : " is-on"}" href="#sel-${s.k}" data-sess="${s.k}" data-title="${esc(s.t)}" data-cap="${s.cap}" aria-pressed="${i ? "false" : "true"}">${esc(s.t)}</a>`).join("")}</div></div>` : ""}
  <div class="zn-step"><p class="zn-step-t"><b>${mode === "all" ? 2 : 1}</b> Choisissez le créneau</p>${SES.map((s, si) => `<div class="zn-slotset" data-for="${s.k}" data-cap="${s.cap}" data-title="${esc(s.t)}"${mode === "all" ? (si ? " hidden" : "") : " hidden"}>${s.sl.map(([d, h, l], i) => `<a class="zn-slot${i ? "" : " is-on"}" href="#cr-${s.k}-${i}" data-label="${d} à ${h.replace(" h ", " h ")}" data-left="${l}" aria-pressed="${i ? "false" : "true"}"><b>${d}</b><span>${h}</span><i>${l} places</i></a>`).join("")}</div>`).join("")}</div>
  <div class="zn-step"><p class="zn-step-t"><b>${mode === "all" ? 3 : 2}</b> Combien de places ?</p><div class="zn-steppers">
    ${[["ad", "Adultes", 2], ["jn", "Jeunes (moins de 18 ans)", 0]].map(([k, l, v]) => `<div class="zn-stp"><span>${l}</span><div><a href="#moins-${k}" class="zn-stp-b" data-st="${k}" data-d="-1" aria-label="Retirer une place : ${l}">−</a><span class="zn-stp-n" data-n="${k}" role="status">${v}</span><a href="#plus-${k}" class="zn-stp-b" data-st="${k}" data-d="1" aria-label="Ajouter une place : ${l}">+</a></div></div>`).join("")}</div></div></div>
  <aside class="zn-recap" aria-live="polite" aria-label="Récapitulatif"><p class="zn-kicker">Récapitulatif</p><p class="zn-recap-s" data-r="sess"></p><p class="zn-recap-d" data-r="slot"></p>
    <p class="zn-recap-p"><b data-r="tot">2</b> place(s) demandée(s)</p>
    <div class="zn-gauge" aria-hidden="true"><div class="zn-gauge-f" data-r="bar"></div></div><p class="zn-recap-l" data-r="left"></p><p class="zn-recap-w" data-r="warn" hidden></p>
    <a class="zn-btn zn-btn--gold zn-btn--block" href="/contact" data-r="send">Envoyer ma demande ${arrow}</a>
    <a class="zn-btn zn-btn--line zn-btn--block" href="#copier" data-r="copy">Copier le récapitulatif</a>
    <p class="zn-recap-n">Aucune place n'est bloquée : l'équipe confirme par retour d'e-mail.</p></aside></div></div></section>`;

const FICHES = (list) => list.map((s, i) => `<article class="zn-fiche zn-ty-${s.ty}" data-fiche="${s.k}"${i ? "" : ""}>
  <div class="zn-fiche-art"><div class="zn-fiche-dial">${dial(s.dur)}<span class="zn-dialtx"><b>${s.dur}</b><i>min</i></span></div>${illus[s.ty]}</div>
  <div class="zn-fiche-body"><p class="zn-card-ty">${star4}${TYPE[s.ty]}</p><h2 class="zn-h2 zn-fiche-t">${esc(s.t)}</h2><p class="zn-lead">${esc(s.sy)}</p>
  <dl class="zn-dl"><div><dt>Public</dt><dd>${PUB[s.pub]}</dd></div><div><dt>Durée</dt><dd>${hm(s.dur)}</dd></div><div><dt>Langue</dt><dd>${LANG[s.lang]}</dd></div><div><dt>Lieu</dt><dd>${s.ty === "obs" ? "Terrasse de l'observatoire" : "Coupole, 120 places"}</dd></div></dl>
  <h3 class="zn-h4">Ce qu'il faut savoir</h3><ul class="zn-ul">${s.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  <p class="zn-fiche-p"><b>${s.sl.length}</b> prochaines dates · <b>${left(s)}</b> places en tout (démonstration)</p>
  <a class="zn-btn zn-btn--gold" href="#reserver" data-reserve="${s.k}">Réserver des places ${arrow}</a></div></article>`).join("");

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="zn-hero pk-bleed" data-chart><div class="zn-hero-in">
    <div class="zn-hero-copy"><p class="zn-kicker" data-reveal>Planétarium · Observatoire · Grenoble</p>
      <div class="zn-h1 zn-h1--xl" role="heading" aria-level="1" data-reveal>Le ciel tourne.<br><em>Venez voir&nbsp;comment.</em></div>
      <p class="zn-lead" data-reveal>Une coupole de 18 mètres, une terrasse d'observation et des médiateurs qui racontent l'Univers sans jargon. Cette carte du ciel tourne comme la voûte céleste : touchez une constellation pour la découvrir.</p>
      <div class="zn-actions" data-reveal><a class="zn-btn zn-btn--gold zn-btn--lg" href="/seances">Voir les séances ${arrow}</a><a class="zn-btn zn-btn--line zn-btn--lg" href="/ciel">Le ciel ce soir</a></div></div>
    <div class="zn-hero-map" data-reveal>${skyChart("zn-dome--hero")}</div>
    <div class="zn-hero-side" data-reveal><p class="zn-chips-l">Neuf constellations à explorer</p><div class="zn-chips" role="group" aria-label="Constellations">${CONS.map(chip).join("")}</div>${infoBox()}</div>
  </div></section>`),
  sec(`<section class="zn-nums pk-bleed"><ul class="zn-nums-in"><li data-reveal><b data-count="18">18</b><span>mètres de diamètre pour la coupole</span></li><li data-reveal><b data-count="120">120</b><span>fauteuils inclinables</span></li><li data-reveal><b data-count="9000" data-sep="1">9 000</b><span>étoiles projetées sur le dôme</span></li><li data-reveal><b data-count="4">4</b><span>télescopes sur la terrasse</span></li></ul></section>`),
  sec(`<section class="zn-soon pk-bleed"><div class="zn-wrap"><div class="zn-sechead"><div><p class="zn-kicker" data-reveal>À la coupole</p><h2 class="zn-h2" data-reveal>Les prochaines séances</h2></div><a class="zn-more" href="/seances">Tout le programme ${arrow}</a></div>
    <div class="zn-grid zn-grid--3">${[SES[0], SES[6], SES[3]].map((s) => card(s)).join("")}</div></div></section>`),
  sec(`<section class="zn-ways pk-bleed"><div class="zn-wrap"><div class="zn-sechead"><div><p class="zn-kicker" data-reveal>Trois manières de lever les yeux</p><h2 class="zn-h2" data-reveal>Regarder, comprendre, observer</h2></div></div>
    <div class="zn-ways-in">${[["film", "Films immersifs", "Allongé sous le dôme, on traverse la galaxie à 360°. Des films pour tous les âges, en français ou en version originale sous-titrée."], ["conf", "Conférences", "Des chercheuses et chercheurs racontent leur métier et répondent à toutes les questions, des plus naïves aux plus pointues."], ["obs", "Observations", "Sur la terrasse, de vrais télescopes et des animateurs pour regarder la Lune, les planètes et les étoiles doubles en vrai."]]
      .map(([k, t, p], i) => `<article class="zn-way" data-reveal><div class="zn-way-art"><svg class="zn-way-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="none" stroke="#3a4aa0" stroke-width="1.2"/><circle cx="100" cy="100" r="78" fill="none" stroke="#2a3680" stroke-width="1"/></svg>${illus[k]}</div><p class="zn-way-n">0${i + 1}</p><h3 class="zn-h3">${t}</h3><p>${p}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="zn-moonband pk-bleed" data-moonband><div class="zn-wrap zn-moonband-in"><div class="zn-moonband-art" data-reveal>${MOON("zn-moon--l")}</div>
    <div data-reveal><p class="zn-kicker">Calculé pour aujourd'hui</p><h2 class="zn-h2">La Lune ce soir : <span class="zn-mb-name">premier quartier</span></h2>
    <ul class="zn-mb-list"><li><span>Âge de la Lune</span><b data-mb="age">—</b></li><li><span>Surface éclairée</span><b data-mb="illum">—</b></li><li><span>Prochaine pleine Lune</span><b data-mb="full">—</b></li><li><span>Prochaine nouvelle Lune</span><b data-mb="new">—</b></li></ul>
    <p class="zn-sub">La phase est calculée dans votre navigateur à partir de la durée moyenne d'une lunaison (29,53 jours) : précis à environ un jour.</p><a class="zn-btn zn-btn--line" href="/ciel">Quelles constellations ce soir ? ${arrow}</a></div></div></section>`),
  sec(`<section class="zn-school pk-bleed"><div class="zn-wrap zn-school-in"><div><p class="zn-kicker" data-reveal>Écoles, collèges, lycées</p><h2 class="zn-h2" data-reveal>Une classe sous les étoiles</h2><p class="zn-lead" data-reveal>Expositions à parcourir, ateliers de manipulation et séances de coupole adaptées au programme, de la maternelle au lycée. Le dossier pédagogique accompagne chaque visite.</p><a class="zn-btn zn-btn--ink" href="/scolaires" data-reveal>Expositions et ateliers ${arrow}</a></div>
    <ul class="zn-school-list" data-reveal><li><b>Cycle 1</b><span>Le jour, la nuit, les ombres</span></li><li><b>Cycles 2 et 3</b><span>Le système solaire en maquette</span></li><li><b>Collège</b><span>Saisons, phases, éclipses</span></li><li><b>Lycée</b><span>Lumière, spectres, exoplanètes</span></li></ul></div></section>`),
  sec(`<section class="zn-visit pk-bleed"><div class="zn-wrap zn-visit-in"><div><p class="zn-kicker" data-reveal>Préparer sa visite</p><h2 class="zn-h2" data-reveal>Horaires et accès</h2></div>
    <dl class="zn-hours" data-reveal><div><dt>Mercredi – vendredi</dt><dd>14 h – 18 h</dd></div><div><dt>Samedi – dimanche</dt><dd>10 h – 20 h</dd></div><div><dt>Soirées d'observation</dt><dd>Voir le programme</dd></div><div><dt>Accès</dt><dd>Tramway ligne B, arrêt « Colline »</dd></div></dl>
    <div class="zn-visit-note" data-reveal><p><b>Bon à savoir.</b> Salle accessible en fauteuil, boucle magnétique, séances en LSF. Les horaires de cette démonstration sont fictifs.</p><a class="zn-btn zn-btn--line" href="/contact">Nous écrire ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

const seances = (c) => [sec(header(c)), pagehead("Programme de la coupole", "Les séances", "Films, conférences, observations : filtrez par public, durée et langue, puis réservez vos places."),
  sec(`<section class="zn-prog pk-bleed" data-filter><div class="zn-wrap">${filters()}<div class="zn-grid zn-grid--3" data-items>${SES.map((s) => card(s)).join("")}</div><p class="zn-empty" hidden>Aucune séance ne correspond à ces critères. Essayez d'élargir la durée ou la langue.</p></div></section>`),
  sec(booking("all")), sec(footer(c))];

const seance = (c) => [sec(header(c)), pagehead("Fiche de séance", "Une séance de près", "Choisissez une séance dans la liste : sa fiche s'affiche, avec les dates et la réservation."),
  sec(`<section class="zn-fiches zn-fiches--tabs pk-bleed" data-fiches><div class="zn-wrap"><div class="zn-pick zn-pick--tabs" role="group" aria-label="Choisir une séance">${SES.map((s, i) => `<a class="zn-pk${i ? "" : " is-on"}" href="#${s.k}" data-sel="${s.k}">${esc(s.t)}</a>`).join("")}</div></div></section>`),
  ...[SES.slice(0, 3), SES.slice(3, 6), SES.slice(6)].map((g, i) => sec(`<section class="zn-fiches zn-fiches--body pk-bleed" data-fgroup><div class="zn-wrap">${FICHES(g)}</div></section>`)),
  sec(booking("one")), sec(footer(c))];

const cielPage = (c) => [sec(header(c)), pagehead("Carte du ciel mensuelle", "Le ciel ce soir", "Choisissez un mois : la carte tourne et ne garde en lumière que les constellations bien placées vers 22 h."),
  sec(`<section class="zn-month pk-bleed" data-chart data-month><div class="zn-wrap"><div class="zn-months" role="group" aria-label="Choisir un mois">${MOIS.map((m, i) => `<a href="#mois-${i + 1}" class="zn-mon" data-m="${i + 1}" aria-pressed="false">${["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][i]}<span class="zn-sr"> ${m}</span></a>`).join("")}</div>
    <div class="zn-month-in"><div class="zn-month-map">${skyChart("zn-dome--month")}</div>
    <div class="zn-month-side"><p class="zn-kicker">Vers 22 h, en France</p><h2 class="zn-h2 zn-month-t">Ciel de <span data-mname>novembre</span></h2><p class="zn-sub"><b data-vcount>0</b> constellations bien placées. La pointe dorée, en haut, marque le sud.</p>
      <div class="zn-chips" role="group" aria-label="Constellations">${CONS.map(chip).join("")}</div>${infoBox()}</div></div></div></section>`),
  sec(`<section class="zn-vis pk-bleed"><div class="zn-wrap"><div class="zn-sechead"><div><p class="zn-kicker">À repérer ce mois-ci</p><h2 class="zn-h2">Les constellations visibles</h2></div></div>
    <div class="zn-vis-grid">${CONS.map((c2) => `<article class="zn-vcard" data-vis="${c2.months.join(" ")}"><span class="zn-vcard-n">${esc(c2.n)}</span><p class="zn-vcard-s">${esc(c2.star)}</p><p>${esc(c2.t)}</p><p class="zn-vcard-p">${esc(period(c2))}</p></article>`).join("")}</div>
    <p class="zn-empty zn-empty--vis" hidden>Aucune.</p></div></section>`),
  sec(`<section class="zn-tips pk-bleed"><div class="zn-wrap"><h2 class="zn-h2" data-reveal>Bien regarder le ciel</h2><ol class="zn-tips-in">
    <li data-reveal><b>1</b><h3 class="zn-h3">Laissez vos yeux s'habituer</h3><p>Il faut vingt minutes d'obscurité pour une vision de nuit complète. Évitez l'écran de téléphone, ou passez-le en rouge.</p></li>
    <li data-reveal><b>2</b><h3 class="zn-h3">Partez de la Polaire</h3><p>Elle indique le nord. Une fois face au sud, la carte tournée sur le mois correspond à ce qui se trouve au-dessus de vous.</p></li>
    <li data-reveal><b>3</b><h3 class="zn-h3">Cherchez l'obscurité</h3><p>Éloignez-vous des lampadaires : la Voie lactée apparaît dans un ciel vraiment noir. La Lune pleine éclipse les étoiles faibles.</p></li></ol></div></section>`),
  sec(footer(c))];

const WORKS = [
  ["c1", "Cycle 1", "Maternelle", "Jour et nuit : la Terre tourne", "Une maquette lampe-et-globe pour comprendre pourquoi le Soleil « se couche ».", 45, 25],
  ["c2", "Cycles 2 et 3", "CP – CM2", "Le système solaire à l'échelle", "Les planètes alignées dans le couloir : on marche d'une planète à l'autre.", 60, 30],
  ["c2", "Cycles 2 et 3", "CE2 – CM2", "Les phases de la Lune", "Avec une lampe et une balle, chaque groupe reproduit les phases.", 50, 30],
  ["col", "Collège", "6e – 3e", "Saisons et éclipses", "Modélisation de l'inclinaison de la Terre, simulation d'éclipse en coupole.", 75, 32],
  ["col", "Collège", "4e – 3e", "Lire un spectre", "Spectroscopes en main, on découvre de quoi sont faites les étoiles.", 60, 30],
  ["lyc", "Lycée", "2de – Terminale", "Exoplanètes : méthode des transits", "Analyse d'une vraie courbe de lumière sur tableur.", 90, 28],
  ["lyc", "Lycée", "1re – Terminale", "Soirée d'observation", "Séance de terrasse encadrée, sur demande, en soirée.", 120, 30],
];
const scolaires = (c) => [sec(header(c)), pagehead("Expositions & ateliers", "Une classe sous les étoiles", "Des visites pensées avec des enseignants, de la maternelle au lycée. Dossier pédagogique fourni pour chaque atelier."),
  sec(`<section class="zn-expo pk-bleed"><div class="zn-wrap"><div class="zn-sechead"><div><p class="zn-kicker" data-reveal>Expositions permanentes et temporaires</p><h2 class="zn-h2" data-reveal>À parcourir en classe</h2></div></div>
    ${[["Le grand escalier des échelles", "Un couloir de 40 mètres pour sentir les distances : de la Lune aux galaxies, un pas égale une unité qui grandit à chaque marche.", "Permanente"], ["Poussières d'étoiles", "Comment les éléments de notre corps ont été forgés dans des étoiles : maquettes à toucher, boîtes à mystères, vidéos courtes.", "Jusqu'en mars"], ["Regards sur la Lune", "De Galilée aux missions actuelles : reproductions de cartes lunaires, échantillons de roches terrestres et simulateur de cratères.", "Jusqu'en janvier"]]
      .map(([t, p, tag], i) => `<article class="zn-ex${i % 2 ? " zn-ex--r" : ""}" data-reveal><div class="zn-ex-art"><svg viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="140" fill="none" stroke="#3a4aa0" stroke-width="1.2"/><circle cx="150" cy="150" r="100" fill="none" stroke="#2a3680" stroke-width="1.2"/><circle cx="150" cy="150" r="60" fill="#111b5c" stroke="#f4c95d" stroke-width="1.6"/>${i === 0 ? `<path d="M30 250h240M60 250v-20h30v-20h30v-20h30v-20h30v-20h30" fill="none" stroke="#f4c95d" stroke-width="2"/>` : i === 1 ? `<circle cx="150" cy="150" r="8" fill="#f4c95d"/><circle cx="238" cy="110" r="5" fill="#9fe3f2"/><circle cx="82" cy="206" r="4" fill="#fff"/><circle cx="196" cy="236" r="3" fill="#fff"/>` : `<circle cx="132" cy="136" r="12" fill="none" stroke="#8c9ad6" stroke-width="1.6"/><circle cx="172" cy="158" r="8" fill="none" stroke="#8c9ad6" stroke-width="1.6"/><circle cx="148" cy="178" r="5" fill="none" stroke="#8c9ad6" stroke-width="1.6"/>`}</svg></div><div><p class="zn-ex-tag">${tag}</p><h3 class="zn-h3">${t}</h3><p>${p}</p></div></article>`).join("")}</div></section>`),
  sec(`<section class="zn-atel pk-bleed" data-filter><div class="zn-wrap"><div class="zn-sechead"><div><p class="zn-kicker">Ateliers</p><h2 class="zn-h2">Choisir un atelier par niveau</h2></div></div>
    <div class="zn-filters zn-filters--one" role="group" aria-label="Niveau"><div class="zn-fg-o">${[["all", "Tous les niveaux"], ["c1", "Cycle 1"], ["c2", "Cycles 2 et 3"], ["col", "Collège"], ["lyc", "Lycée"]].map(([v, l], i) => `<a href="#niv-${v}" class="zn-fo${i ? "" : " is-on"}" data-g="niv" data-v="${v}" aria-pressed="${i ? "false" : "true"}">${l}</a>`).join("")}</div></div>
    <table class="zn-table"><caption class="zn-sr">Ateliers scolaires par niveau</caption><thead><tr><th scope="col">Niveau</th><th scope="col">Atelier</th><th scope="col">Durée</th><th scope="col">Groupe</th></tr></thead><tbody data-items>
    ${WORKS.map(([v, lv, cl, t, d, du, g]) => `<tr data-item data-niv="${v}"><td data-l="Niveau"><b>${lv}</b><small>${cl}</small></td><td data-l="Atelier"><strong>${t}</strong><span>${d}</span></td><td data-l="Durée">${du} min</td><td data-l="Groupe">${g} élèves max.</td></tr>`).join("")}</tbody></table>
    <p class="zn-empty" hidden>Aucun atelier pour ce niveau.</p>
    <div class="zn-cta-row"><p>Un projet de classe, un voyage scolaire, une demande particulière ?</p><a class="zn-btn zn-btn--gold" href="/contact">Demander un devis de visite ${arrow}</a></div></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Nous écrire", "Contact", "Réservation de groupe, accueil de classes, presse ou simple question sur le ciel."),
  { type: "form", heading: "Écrire à l'équipe", intro: "Indiquez la séance et le nombre de places souhaités (vous pouvez coller votre récapitulatif). Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une étoile, une séance ?", "Constellation, atelier, conférence, horaire…"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une séance, une constellation…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="zn-404 pk-bleed"><svg class="zn-404-art" viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="140" fill="none" stroke="#2a3680" stroke-width="1.2"/><circle cx="150" cy="150" r="96" fill="none" stroke="#3a4aa0" stroke-width="1.2"/><circle cx="150" cy="150" r="52" fill="none" stroke="#2a3680" stroke-width="1.2"/><path d="M150 10v280M10 150h280" stroke="#2a3680" stroke-width="1"/><circle cx="236" cy="64" r="5" fill="#f4c95d"/><circle cx="64" cy="212" r="3" fill="#fff"/></svg>
  <div class="zn-wrap"><p class="zn-kicker">Hors carte</p><div class="zn-h1 zn-h1--xl" role="heading" aria-level="1">404</div><p class="zn-ph-sub">Cette page est introuvable : elle a quitté son orbite ou n'a jamais existé.</p><a class="zn-btn zn-btn--gold zn-btn--lg" href="/">Revenir à l'accueil ${arrow}</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "zenith", name: "Zénith", version: "2.0.0", category: "science", tags: ["sombre", "technique", "geometrique"], siteType: "Planétarium et observatoire", featured: true,
  concept: "Une carte du ciel vivante : un planisphère qui tourne, des constellations reliées qui s'expliquent au survol, un programme de coupole avec places restantes et un ciel de chaque mois.",
  description: "Planétarium et observatoire : nuit indigo, encre blanche et or. Planisphère rotatif aux constellations interactives, séances filtrables avec réservation de places, ciel ce soir par mois, Lune calculée, ateliers scolaires.",
  brand: "Zénith — Planétarium & observatoire", modules: ["formulaires", "recherche"],
  dna: { header: "barre-fine-centree-logo-et-disque-de-phase-lunaire-calcule", hero: "planisphere-circulaire-rotatif-aux-constellations-reliees-et-fiche-au-survol", grid: "seances-en-cartes-a-cadran-de-duree-centre-en-planete", motion: "rotation-diurne-lente-constellations-qui-s-allument-et-etoiles-qui-scintillent", shapes: "cercles-concentriques-graduations-angulaires-et-etoiles-a-quatre-branches", rhythm: "alternance-nuit-profonde-et-bandes-d-aube-pale-en-pages-de-carte", signature: "programme-de-coupole-filtrable-reservation-de-places-et-ciel-ce-soir-par-mois" },
  tokens: {
    colors: { primary: "#f4c95d", secondary: "#0a1033", accent: "#9fe3f2", background: "#0a1033", surface: "#111b5c", text: "#eef2ff", muted: "#aab5e3", success: "#7be0a8", warning: "#f4c95d", error: "#ff8f8f" },
    fonts: { heading: "font.forum", body: "font.sofia-sans", button: "font.jura", link: "font.sofia-sans" },
    radius: { sm: 6, md: 14, lg: 28, button: 999, field: 12, card: 28 }, shadow: { card: "0 18px 50px rgba(2,4,24,.5)", button: "none" }, border: { width: 1, color: "#2a3680" },
    type: { h1: { size: 76, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 42, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "gold", label: "Or des constellations", type: "color", default: "#f4c95d" },
    { key: "night", label: "Bleu de la nuit", type: "color", default: "#0a1033" },
    { key: "spin", label: "Rotation de la carte", type: "choice", default: "on", choices: [["on", "Lente"], ["off", "Fixe"]] },
    { key: "twinkle", label: "Scintillement des étoiles", type: "choice", default: "on", choices: [["on", "Actif"], ["off", "Éteint"]] },
  ],
  menu: [["Accueil", "/"], ["Séances", "/seances"], ["Le ciel ce soir", "/ciel"], ["Scolaires", "/scolaires"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "seances", name: "Séances", render: seances }, { key: "seance", name: "Fiche séance", render: seance },
    { key: "ciel", name: "Le ciel ce soir", render: cielPage }, { key: "scolaires", name: "Expositions et ateliers scolaires", render: scolaires }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
