// Chaîne — créateur de contenu / YouTubeur (créateur fictif « Mika » et sa chaîne « Bouillon TV »). Direction artistique : crème glacée et encre noire, aplats rouge tomate, jaune et bleu électrique,
// cadre de lecteur géant (16:9, progression, chapitres cliquables), vignettes dessinées avec visages-avatars, bouton « S'abonner » qui bascule, mur de vidéos filtrable avec lecteur en tiroir,
// kit média (audience, tarifs, démographie) et liens partenaires avec codes à copier. Tout est démonstration : aucune vidéo réelle, aucun achat, aucune offre réelle.
const { sec, esc, nav } = require("../kit");

const K = "#111";
const RED = "#dc2a18", YEL = "#ffd60a", BLU = "#2447ff";

// ---------- visages-avatars (tête centrée en 0,0, rayon 31) ----------
const HAIR = {
  tuft: (c) => `<path d="M-31-2C-40-36-10-48 2-36 16-50 42-30 31-2 24-22-12-26-31-2z" fill="${c}"/>`,
  cap: (c) => `<path d="M-32-4C-34-42 34-42 32-4z" fill="${c}"/><path d="M-6-14H46q4 0 4 6H-6z" fill="${c}"/>`,
  bun: (c) => `<circle cy="-40" r="12" fill="${c}"/><path d="M-31-4C-36-34 36-34 31-4 20-20-20-20-31-4z" fill="${c}"/>`,
  curly: (c) => `<g fill="${c}"><circle cx="-22" cy="-20" r="13"/><circle cy="-27" r="14"/><circle cx="22" cy="-20" r="13"/><circle cx="-30" cy="-4" r="9"/><circle cx="30" cy="-4" r="9"/></g>`,
  long: (c) => `<path d="M-33 26C-46-32 46-32 33 26 30-4 22-22 0-22S-30-4-33 26z" fill="${c}"/>`,
  beanie: (c) => `<path d="M-32-6C-34-44 34-44 32-6z" fill="${c}"/><rect x="-34" y="-12" width="68" height="12" rx="5" fill="${c}"/><circle cy="-42" r="6" fill="#fff"/>`,
  none: () => "",
};
const EYES = {
  w: '<circle cx="-11" cy="-4" r="8.5" fill="#fff"/><circle cx="11" cy="-4" r="8.5" fill="#fff"/><circle cx="-10" cy="-3" r="3.4" fill="#111" stroke="none"/><circle cx="12" cy="-3" r="3.4" fill="#111" stroke="none"/>',
  h: '<path d="M-19-2q8-9 16 0M3-2q8-9 16 0" fill="none"/>',
  g: '<circle cx="-12" cy="-5" r="10" fill="#7fd1ff"/><circle cx="12" cy="-5" r="10" fill="#7fd1ff"/><path d="M-2-5h4M-31-8l-6-3M31-8l6-3" fill="none"/><circle cx="-14" cy="-8" r="2.4" fill="#fff" stroke="none"/><circle cx="10" cy="-8" r="2.4" fill="#fff" stroke="none"/>',
  s: '<path d="M-20-4h15M5-4h15" fill="none"/><circle cx="-12" cy="2" r="3.4" fill="#111" stroke="none"/><circle cx="13" cy="2" r="3.4" fill="#111" stroke="none"/>',
};
const BROW = { up: '<path d="M-20-19q7-6 14-1M6-20q7-5 14 1" fill="none"/>', mad: '<path d="M-20-20l15 6M20-20l-15 6" fill="none"/>', none: "" };
const MOUTH = {
  o: '<ellipse cy="17" rx="8" ry="10" fill="#3b0d0a" stroke-width="3"/>',
  grin: '<path d="M-15 8Q0 32 15 8z" fill="#fff" stroke-width="3"/>',
  tongue: '<path d="M-15 8Q0 32 15 8z" fill="#fff" stroke-width="3"/><path d="M-5 20q5 11 10 0z" fill="#ff6b81" stroke-width="2.5"/>',
  smirk: '<path d="M-10 15Q0 22 13 10" fill="none"/>',
  flat: '<path d="M-9 17h18" fill="none"/>',
};
function face(x, y, s, o = {}) {
  const { skin = "#f2c29b", hair = "tuft", hc = "#111", mouth = "o", eyes = "w", shirt = BLU, brow = "up", cls = "" } = o;
  return `<g${cls ? ` class="${cls}"` : ""} transform="translate(${x} ${y}) scale(${s})"><path d="M-44 64c0-24 18-32 44-32s44 8 44 32z" fill="${shirt}"/><circle cx="-31" cy="2" r="7" fill="${skin}"/><circle cx="31" cy="2" r="7" fill="${skin}"/><circle r="31" fill="${skin}"/>${HAIR[hair](hc)}${EYES[eyes]}${BROW[brow]}${MOUTH[mouth]}</g>`;
}
// accessoires dessinés
const PROP = {
  box: '<path d="M-30-22h60v50h-60z" fill="#d9a066"/><path d="M-30-22l8-10h44l8 10z" fill="#c28748"/><path d="M-8-22v14h16v-14" fill="#f4e3b5"/>',
  clock: '<circle r="26" fill="#fff"/><path d="M0 0V-16M0 0l11 7" fill="none"/><path d="M-6-31h12" stroke-width="6"/><circle r="3" fill="#111"/>',
  gear: '<path d="M0-30v10M0 20v10M-30 0h10M20 0h10M-21-21l7 7M14 14l7 7M21-21l-7 7M-14 14l-7 7" stroke-width="8"/><circle r="20" fill="#9aa4b2"/><circle r="7" fill="#fff"/>',
  bulb: '<path d="M0-44v-8M-30-26l-8-6M30-26l8-6" fill="none"/><circle cy="-6" r="22" fill="#ffd60a"/><path d="M-9 14h18v14h-18z" fill="#cbd2dc"/>',
  phone: '<rect x="-18" y="-32" width="36" height="64" rx="7" fill="#111"/><rect x="-12" y="-24" width="24" height="44" rx="2" fill="#7fd1ff" stroke="none"/>',
  crack: '<path d="M-26-30h52v40c0 14-16 24-26 28-10-4-26-14-26-28z" fill="#e8eef5"/><path d="M-4-30L6-12-6-2 8 12 0 30" fill="none"/>',
  bolt: '<path d="M8-34L-18 4h14L-8 34 22-8H6z" fill="#ffd60a"/>',
  bucket: '<path d="M-24-20h48l-6 48h-36z" fill="#2447ff"/><ellipse cy="-20" rx="24" ry="7" fill="#fff"/><circle cy="8" r="11" fill="#111"/><circle cy="8" r="4" fill="#fff" stroke="none"/>',
  fridge: '<rect x="-20" y="-36" width="40" height="72" rx="5" fill="#e8eef5"/><path d="M-20-6h40M-12-24v10M-12 4v14" fill="none"/>',
  pan: '<ellipse rx="26" ry="10" fill="#555"/><path d="M26 0h28" stroke-width="9" fill="none"/><circle cx="-4" cy="-3" r="7" fill="#fff"/><circle cx="-4" cy="-3" r="3" fill="#ffd60a" stroke="none"/>',
  robot: '<circle r="30" fill="#e8eef5"/><circle r="12" fill="#ffd60a"/><circle cx="16" cy="-17" r="3.5" fill="#dc2a18" stroke="none"/>',
  lamp: '<path d="M-22 10L-10-24h20L22 10z" fill="#ffd60a"/><path d="M0 10v26M-14 36h28" fill="none"/>',
  heart: '<path d="M0 24C-34-2-26-30-8-26 0-24 0-14 0-14s0-10 8-12C26-30 34-2 0 24z" fill="#dc2a18"/>',
  cam: '<rect x="-28" y="-16" width="56" height="36" rx="7" fill="#222"/><circle r="12" fill="#7fd1ff"/><circle cx="20" cy="-8" r="3" fill="#dc2a18" stroke="none"/>',
  cup: '<path d="M-18-24h36l-4 40a14 14 0 0 1-28 0z" fill="#ffd60a"/><path d="M-18-16h-10q-4 14 8 18M18-16h10q4 14-8 18" fill="none"/><path d="M-12 36h24" stroke-width="7"/>',
  mic: '<rect x="-12" y="-34" width="24" height="40" rx="12" fill="#e8eef5"/><path d="M-20 0q0 20 20 20T20 0M0 20v16M-12 36h24" fill="none"/>',
};
const prop = (k, x, y, s = 1, rot = 0, cls = "") => `<g${cls ? ` class="${cls}"` : ""} transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${PROP[k]}</g>`;
const arrow = (x, y, rot, s = 1, fill = YEL) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0-9H42V-20L68 0 42 20V9H0z" fill="${fill}"/></g>`;
function burst(cx, cy, r1, r2, n, fill, rot = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n + rot, r = i % 2 ? r1 : r2; pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`); }
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
}

// ---------- vidéos fictives ----------
// [id, série, titre, texte de vignette, durée (s), vues, date, durée (court/moyen/long), description, vignette]
const SERIES = { defi: ["Défis", "d1"], bidouille: ["Bidouille", "d2"], test: ["Test & casse", "d3"], vlog: ["Vlogs", "d4"] };
const T = (a, b, f, p, ar, tp) => ({ a, b, f, p, ar, tp });
const VIDEOS = [
  ["v1", "defi", "Défi : 24 heures enfermé dans un carton", "24 H DANS UN CARTON", 872, 1230000, "2026-10-30", "Un carton, un sac de chips, une chaise pliante et vingt-quatre heures à tenir sans sortir. Spoiler : le chat de la voisine a tout vu.", T(RED, YEL, [112, 112, 1.35, { hair: "tuft", mouth: "o", shirt: BLU }], [["box", 250, 118, 1.5, -6]], [[210, 60, 200, 0.8]], "bl")],
  ["v2", "bidouille", "Je transforme un frigo en jukebox", "FRIGO = JUKEBOX", 668, 860000, "2026-10-23", "Un vieux frigo récupéré, deux enceintes, un peu de soudure et beaucoup de peinture. Le plan complet est dans la description (fictive, bien sûr).", T(YEL, BLU, [104, 114, 1.35, { hair: "cap", hc: BLU, eyes: "g", mouth: "grin", shirt: RED, brow: "none" }], [["fridge", 248, 104, 1.7, 5], ["gear", 280, 40, 0.7]], [[200, 150, 190, 0.75, RED]], "tl")],
  ["v3", "test", "Ce gadget à 9 € tient-il ses promesses ?", "GADGET À 9 € ?!", 521, 2140000, "2026-10-16", "On teste un gadget commandé au hasard : il promet de tout faire, on vérifie tout. Verdict à la minute 7, et il y a eu de la fumée.", T(BLU, YEL, [210, 116, 1.35, { hair: "curly", hc: "#3a2417", skin: "#c98a5e", mouth: "o", eyes: "w", shirt: YEL }], [["phone", 84, 96, 1.7, -10], ["bolt", 150, 40, 0.9, 12]], [[120, 150, 330, 0.7, RED]], "tr")],
  ["v4", "vlog", "Vlog : ma première convention de créateurs", "PREMIÈRE CONVENTION", 1045, 310000, "2026-10-09", "Trois jours dans un hall immense : premières rencontres, premiers selfies, premier pied de micro cassé. Une vraie aventure.", T("#fff", YEL, [200, 112, 1.35, { hair: "bun", hc: "#6a3b1c", skin: "#e0a77c", mouth: "grin", eyes: "h", shirt: RED, brow: "none" }], [["cam", 82, 100, 1.5, -8], ["heart", 262, 40, 0.8, 10]], [], "bl")],
  ["v5", "defi", "Défi : cuisiner sans utiliser les mains", "CUISINE SANS MAINS", 590, 1710000, "2026-10-02", "Des œufs, une poêle, des idées étranges. Mika cuisine un repas complet les mains dans le dos : la cuisine ne s'en est pas remise.", T(RED, "#fff", [108, 114, 1.35, { hair: "beanie", hc: YEL, mouth: "tongue", eyes: "w", shirt: BLU }], [["pan", 240, 128, 1.5, -8], ["clock", 270, 44, 0.8]], [[196, 84, 215, 0.7, YEL]], "tr")],
  ["v6", "bidouille", "L'enceinte en pot de peinture", "ENCEINTE EN POT", 372, 540000, "2026-09-25", "Six minutes pour fabriquer une enceinte avec un pot de peinture vide. Pas besoin de matériel de pro, juste de patience.", T(BLU, "#fff", [112, 112, 1.35, { hair: "tuft", hc: YEL, mouth: "smirk", eyes: "g", shirt: YEL, brow: "none" }], [["bucket", 246, 112, 1.7, 6], ["bolt", 290, 40, 0.8]], [[196, 150, 330, 0.75, YEL]], "tl")],
  ["v7", "test", "Test & casse : la coque « incassable »", "COQUE INCASSABLE ?", 347, 3410000, "2026-09-18", "Elle est vendue comme incassable. On la jette, on la roule, on la laisse tomber du toit. Le résultat nous a surpris.", T(YEL, RED, [206, 116, 1.35, { hair: "tuft", hc: "#111", mouth: "o", eyes: "w", shirt: BLU, skin: "#8d5a3b" }], [["crack", 88, 100, 1.7, -8], ["bolt", 160, 38, 0.9]], [[140, 150, 340, 0.7, BLU]], "bl")],
  ["v8", "vlog", "Vlog : un jour entier sans écran", "SANS ÉCRAN", 723, 420000, "2026-09-11", "On a rangé tous les écrans pendant une journée. Entre jeux de cartes, balade et ennui profond, voici ce qui s'est vraiment passé.", T("#cfe9ff", YEL, [110, 114, 1.35, { hair: "long", hc: "#7a4a22", mouth: "smirk", eyes: "s", shirt: "#fff", brow: "none" }], [["phone", 248, 104, 1.5, 12], ["lamp", 282, 120, 0.8]], [], "tr")],
  ["v9", "defi", "Défi : 100 questions en 10 minutes", "100 QUESTIONS", 610, 980000, "2026-09-04", "Cent questions, dix minutes, un chronomètre sans pitié. Avec l'aide d'un invité surprise (qui n'a pas aidé du tout).", T(RED, BLU, [210, 112, 1.35, { hair: "curly", hc: "#111", skin: "#d99a6c", mouth: "grin", eyes: "w", shirt: YEL }], [["clock", 96, 96, 1.6, 0], ["mic", 150, 140, 0.9]], [[142, 58, 12, 0.7, YEL]], "bl")],
  ["v10", "bidouille", "La lampe qui suit ma voix", "LAMPE PARLANTE", 920, 690000, "2026-08-28", "Un microphone, une petite carte électronique et une lampe : elle s'allume quand on parle. Tutoriel complet, sans casse (cette fois).", T(YEL, "#fff", [108, 114, 1.35, { hair: "cap", hc: RED, mouth: "o", eyes: "g", shirt: BLU, brow: "none" }], [["lamp", 244, 104, 1.8, -6], ["mic", 288, 130, 0.8]], [[198, 144, 330, 0.7, BLU]], "tl")],
  ["v11", "test", "Test : le robot aspirateur contre le chat", "ROBOT VS CHAT", 458, 1560000, "2026-08-21", "Un robot aspirateur neuf face au chat le plus têtu du quartier. Qui va gagner ? Le suspense n'a duré que quatre minutes.", T(BLU, RED, [206, 114, 1.35, { hair: "bun", hc: "#111", skin: "#f6d2b4", mouth: "tongue", eyes: "w", shirt: "#fff" }], [["robot", 92, 120, 1.5, 0], ["bolt", 70, 44, 0.8]], [[150, 150, 340, 0.7, YEL]], "tr")],
  ["v12", "vlog", "Vlog : 500 000 merci", "500 000 MERCI", 1244, 640000, "2026-08-14", "Le grand vlog de remerciement : retour sur l'année, coulisses du studio et premier aperçu de ce qui arrive. Gâteau compris.", T(YEL, RED, [160, 112, 1.5, { hair: "tuft", hc: "#111", mouth: "grin", eyes: "h", shirt: BLU, brow: "none" }], [["heart", 60, 52, 1, -12], ["cup", 270, 112, 1.5, 6]], [], "bl")],
];
VIDEOS.forEach((v, i) => { VIDEOS[i] = [...v.slice(0, 7), null, ...v.slice(7)]; });
const durCat = (s) => (s < 480 ? "court" : s <= 900 ? "moyen" : "long");
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const nf = (n) => n.toLocaleString("fr-FR").replace(/ | /g, " ");
const views = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} M vues` : `${Math.round(n / 1000)} k vues`);
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

function thumb(v, lite) {
  const { a, b, p, ar } = v[9]; const f = [v[9].f[0], v[9].f[1] + 14, v[9].f[2], v[9].f[3]];
  const dark = a === BLU || a === RED;
  return `<svg class="ch-svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g stroke="${K}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect width="320" height="180" fill="${a}" stroke="none"/>${burst(f[0], f[1], 70, 118, 14, b, 0.2)}<path d="M-4 150L324 120V190H-4z" fill="${dark ? K : "#fff"}" stroke="none" opacity=".22"/>${lite ? "" : p.map((q) => prop(...q)).join("")}${face(f[0], f[1], f[2], f[3])}${lite ? [] : ar.map((q) => arrow(q[0], q[1], q[2], q[3], q[4])).join("")}</g></svg>`;
}
const SERLAB = (k) => SERIES[k][0];
const card = (v, extra = "") => {
  const [id, ser, title, txt, sec_, vw, date, , , spec] = v;
  return `<a class="ch-card ${extra}" href="/video#${id}" data-id="${id}" data-ser="${ser}" data-dur="${durCat(sec_)}" data-sec="${sec_}" data-views="${vw}" data-date="${date}" data-title="${esc(title)}" data-meta="${views(vw)} · ${dfr(date)} · ${mmss(sec_)}" data-reveal>
<span class="ch-th ch-th--${spec.f[0] < 150 ? "tr" : "tl"}">${thumb(v)}<span class="ch-th-t">${esc(txt)}</span><span class="ch-dur">${mmss(sec_)}</span><span class="ch-playi" aria-hidden="true"></span></span>
<span class="ch-card-b"><span class="ch-ser ch-ser--${ser}">${esc(SERLAB(ser))}</span><h3 class="ch-card-t">${esc(title)}</h3><span class="ch-meta">${views(vw)} · ${dfr(date)}</span></span></a>`;
};
const miniCard = (v) => `<a class="ch-mini" href="/video#${v[0]}" data-id="${v[0]}" data-title="${esc(v[2])}" data-meta="${views(v[5])} · ${dfr(v[6])} · ${mmss(v[4])}" data-sec="${v[4]}"><span class="ch-th ch-th--${v[9].f[0] < 150 ? "tr" : "tl"}">${thumb(v, true)}<span class="ch-dur">${mmss(v[4])}</span></span><span class="ch-mini-b"><span class="ch-ser ch-ser--${v[1]}">${esc(SERLAB(v[1]))}</span><b>${esc(v[2])}</b><small>${views(v[5])}</small></span></a>`;

// chapitres et liens (données de la description, lisibles même sans JavaScript)
const CHAPN = {
  defi: ["Les règles du défi", "Première heure", "Le moment difficile", "Le rebondissement", "Verdict"],
  bidouille: ["Le matériel", "Démontage", "Assemblage", "Premier essai", "Résultat final"],
  test: ["Le gadget", "Promesses de la boîte", "Les tests", "Le moment qui casse", "Verdict"],
  vlog: ["Le départ", "Les premières heures", "Les rencontres", "Les coulisses", "La conclusion"],
};
const FR = [0, 0.09, 0.3, 0.58, 0.82];
const LINKS = {
  defi: [["Code partenaire Toastik (fictif)", "/liens"], ["Les autres défis", "/videos"]],
  bidouille: [["Liste du matériel (démonstration)", "/liens"], ["Toutes les bidouilles", "/videos"]],
  test: [["Code partenaire Pixelbox (fictif)", "/liens"], ["Proposer un test", "/contact"]],
  vlog: [["Soutenir la chaîne : le kit média", "/kit-media"], ["Écrire à Mika", "/contact"]],
};
const chaps = (v) => CHAPN[v[1]].map((n, i) => [Math.round(v[4] * FR[i]), n]);
const dataArt = (svg) => (v) => `<article data-id="${v[0]}" data-title="${esc(v[2])}" data-meta="${views(v[5])} · ${dfr(v[6])} · ${mmss(v[4])}" data-sec="${v[4]}" data-ser="${v[1]}" data-serl="${esc(SERLAB(v[1]))}">${svg ? thumb(v) : ""}<p data-k="desc">${esc(v[8])}</p><ol data-k="chaps">${chaps(v).map(([t, n]) => `<li data-t="${t}">${esc(n)}</li>`).join("")}</ol><ul data-k="links">${LINKS[v[1]].map(([n, u]) => `<li><a href="${u}">${esc(n)}</a></li>`).join("")}</ul></article>`;
const dataBlocks = (svg) => [VIDEOS.slice(0, 6), VIDEOS.slice(6)].map((h) => sec(`<div class="ch-data ch-off pk-bleed" data-data aria-hidden="true">${h.map(dataArt(svg)).join("")}</div>`));

// ---------- pictogrammes ----------
const IC = {
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>',
  pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>',
  bell: '<path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  arr: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
};
const ic = (k, cls = "ch-ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const SUBBTN = (cls = "") => `<a class="ch-sub ${cls}" href="#abonnement" role="button" aria-pressed="false" data-sub>${ic("bell")}<span class="ch-sub-a">S'abonner</span><span class="ch-sub-b">Abonné ✓</span></a>`;

// ---------- en-tête et pied ----------
const header = (c) => `<header class="ch-head pk-bleed">
<div class="ch-tick" role="note"><div class="ch-wrap ch-tick-in"><span class="ch-live" aria-hidden="true"></span><span>Prochaine vidéo : vendredi 18 h (démonstration) — <b data-next>dans 3 jours</b></span><span class="ch-tick-r">482 300 abonnés (chiffres fictifs)</span></div></div>
<div class="ch-hb"><div class="ch-wrap ch-hb-in">
<a class="ch-logo" href="/" aria-label="${esc(c.brand)} — accueil"><svg viewBox="0 0 48 34" aria-hidden="true"><rect x="2" y="2" width="44" height="30" rx="9" fill="${RED}" stroke="${K}" stroke-width="3"/><path d="M19 10v14l12-7z" fill="#fff"/></svg><span><b>Bouillon</b><i>TV</i></span></a>
<div class="ch-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
<div class="ch-hb-r"><span class="ch-subs"><b data-subs>482 300</b><small>abonnés</small></span>${SUBBTN()}</div>
<details class="ch-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="ch-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}${SUBBTN("ch-sub--wide")}</div></details>
</div></div></header>`;

const footer = (c) => `<footer class="ch-foot pk-bleed"><div class="ch-wrap ch-foot-in">
<div class="ch-foot-brand"><div class="ch-foot-logo">Bouillon<i>TV</i></div><p>La chaîne de Mika : défis, bidouille, tests et vlogs, tous les vendredis. Créateur, chaîne et chiffres fictifs, pour la démonstration.</p>${SUBBTN("ch-sub--wide")}</div>
<div><h3>La chaîne</h3>${nav(c.menu.slice(0, 5), "ch-fl")}</div>
<div><h3>Séries</h3><a class="ch-fl" href="/videos#serie-defi">Défis</a><a class="ch-fl" href="/videos#serie-bidouille">Bidouille</a><a class="ch-fl" href="/videos#serie-test">Test &amp; casse</a><a class="ch-fl" href="/videos#serie-vlog">Vlogs</a></div>
<div><h3>Réseaux (fictifs)</h3><a class="ch-fl" href="https://example.com/bouillon-tv" target="_blank" rel="noopener">Vidéos courtes</a><a class="ch-fl" href="https://example.com/bouillon-tv" target="_blank" rel="noopener">Podcast</a><a class="ch-fl" href="https://example.com/bouillon-tv" target="_blank" rel="noopener">Communauté</a><a class="ch-fl" href="/recherche">Recherche</a></div></div>
<p class="ch-legal">© Bouillon TV — site de démonstration. Créateur, vidéos, chiffres, marques, offres et codes sont fictifs.</p></footer>`;

const pagehead = (kicker, title, sub, color, crumb) => sec(`<section class="ch-ph pk-bleed ch-s-${color}"><div class="ch-wrap ch-ph-in"><div class="ch-ph-t"><p class="ch-crumb" data-reveal><a href="/">Bouillon TV</a> <span aria-hidden="true">›</span> ${esc(crumb || kicker)}</p><div class="ch-h1 ch-h1--page" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="ch-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>
<div class="ch-ph-art" aria-hidden="true"><svg viewBox="0 0 220 160"><g stroke="${K}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${burst(110, 80, 56, 86, 12, color === "yellow" ? "#fff" : YEL, 0.1)}${face(110, 88, 1.55, { hair: ["tuft", "cap", "curly", "bun"][crumb ? crumb.length % 4 : 0], hc: K, mouth: ["grin", "o", "tongue", "smirk"][(crumb || kicker).length % 4], shirt: color === "blue" ? RED : BLU })}${arrow(14, 130, -20, 0.55, "#fff")}</g></svg></div></div></section>`);

const bandTitle = (n, kick, title, right) => `<div class="ch-sechead"><div><p class="ch-pl" data-reveal><span class="ch-pl-i">${ic("play")}</span> Playlist ${n} · ${esc(kick)}</p><h2 class="ch-h2" data-reveal>${title}</h2></div>${right || ""}</div>`;
const more = (label, url) => `<a class="ch-more" href="${url}" data-reveal>${esc(label)} ${ic("arr")}</a>`;

// ---------- lecteur ----------
const CH_HERO = [[0, "Salut, c'est Mika"], [12, "Les défis"], [26, "La bidouille"], [40, "Test et casse"], [52, "Rejoins la bande"]];
const chapList = (list, attr = "") => `<ol class="ch-chaps"${attr}>${list.map(([t, n], i) => `<li><a href="#chap-${i + 1}" data-t="${t}"><b>${mmss(t)}</b><span>${esc(n)}</span></a></li>`).join("")}</ol>`;
const controls = (dur, rate) => `<div class="ch-ctrl"><a class="ch-pbtn" href="#lecture" role="button" aria-label="Lecture" data-toggle>${ic("play")}</a>
<span class="ch-time"><b data-time>0:00</b> / <span data-total>${mmss(dur)}</span></span>
<a class="ch-bar" href="#progression" role="slider" aria-label="Position de lecture" aria-valuemin="0" aria-valuemax="${dur}" aria-valuenow="0" aria-valuetext="0:00"><span class="ch-bar-f"></span><span class="ch-bar-k"></span></a>
<a class="ch-rate" href="#vitesse" role="button" aria-label="Vitesse de lecture simulée" data-rate>×${rate}</a><span class="ch-hd" aria-hidden="true">HD</span></div>`;
const bigPlay = `<a class="ch-big" href="#lecture" role="button" aria-label="Lancer la lecture" data-toggle><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="${RED}" stroke="${K}" stroke-width="5"/><path d="M32 22v36l28-18z" fill="#fff" stroke="${K}" stroke-width="3" stroke-linejoin="round"/></svg></a>`;

const heroScene = `<svg class="ch-hscene" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g stroke="${K}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
<path d="M0 430L960 380V540H0z" fill="${K}" stroke="none" opacity=".25"/>
<g class="ch-a-wig">${prop("clock", 760, 130, 2.2, 0)}</g>
<g class="ch-a-hop">${prop("box", 750, 390, 3.1, -4)}</g>
<g class="ch-a-wig2">${prop("bolt", 80, 140, 2.4, 14)}</g>
<g class="ch-a-bob">${face(290, 300, 4.4, { hair: "tuft", hc: "#111", mouth: "o", eyes: "w", shirt: BLU })}</g>
<g class="ch-a-arrow">${arrow(540, 130, 24, 1.5, YEL)}</g>
<g class="ch-a-pop">${burst(560, 440, 48, 82, 10, "#fff", 0.3)}${prop("heart", 560, 445, 1.8, -10)}</g></g></svg>`;

const hero = () => `<div class="ch-player ch-player--hero" data-player data-dur="64" data-rate="1" data-scene="0">
<div class="ch-frame"><div class="ch-screen"><div class="ch-rays" aria-hidden="true"></div>${heroScene}
<span class="ch-hbadge ch-hbadge--a">Bande-annonce</span><span class="ch-hbadge ch-hbadge--b">Épisode 213 · Démo</span>
<div class="ch-bubble" aria-hidden="true">Trop fort ?!</div><p class="ch-cap" data-cap aria-live="off">Salut, c'est Mika</p>${bigPlay}</div>
${controls(64, 1)}</div>
<div class="ch-chap-wrap"><p class="ch-chap-h">Chapitres</p>${chapList(CH_HERO)}</div></div>`;

// ---------- accueil ----------
const SERTILE = [
  ["defi", "Défis", "Tenir, relever, rater en beauté.", "box", 3, "red"], ["bidouille", "Bidouille", "On démonte, on bricole, on rallume.", "gear", 3, "yellow"],
  ["test", "Test &amp; casse", "Les promesses des boîtes, mises à l'épreuve.", "crack", 3, "blue"], ["vlog", "Vlogs", "Les coulisses, les voyages, les merci.", "cam", 3, "white"],
];
const sertile = ([k, n, t, p, cnt, col]) => `<a class="ch-st ch-st--${col}" href="/videos#serie-${k}" data-reveal><svg viewBox="0 0 90 90" aria-hidden="true"><g stroke="${K}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${burst(45, 45, 30, 42, 10, col === "yellow" ? "#fff" : YEL, 0.2)}${prop(p, 45, 47, 1.05)}</g></svg><span class="ch-st-t"><b>${n}</b><small>${t}</small></span><em>${cnt} vidéos</em></a>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="ch-hero pk-bleed ch-s-cream"><div class="ch-wrap"><div class="ch-hero-top"><div><p class="ch-kicker" data-reveal><span class="ch-tag">Chaîne de démonstration</span> Créateur fictif</p>
<div class="ch-h1" role="heading" aria-level="1" data-reveal>Des défis <span class="ch-nw"><mark>bouillants</mark>,</span> une vidéo chaque vendredi.</div></div>
<div class="ch-hero-r" data-reveal><p class="ch-lead">Mika relève des défis absurdes, bidouille des objets, teste (et casse) des gadgets. Appuie sur lecture pour voir la bande-annonce de la chaîne.</p><div class="ch-actions">${SUBBTN("ch-sub--lg")}<a class="ch-btn ch-btn--line" href="/videos">Voir les vidéos ${ic("arr")}</a></div></div></div>
${hero()}
<div class="ch-stickers" aria-hidden="true"><span class="ch-stk ch-stk--1">NOUVEAU</span><span class="ch-stk ch-stk--2">+212 vidéos</span><span class="ch-stk ch-stk--3">★ 4 séries</span></div></div></section>`),
  sec(`<section class="ch-stats pk-bleed ch-s-ink"><div class="ch-wrap"><ul class="ch-stats-in"><li><b data-count="482300" data-sep="1">482 300</b><span>abonnés</span></li><li><b data-count="212">212</b><span>vidéos publiées</span></li><li><b data-count="96">96</b><span>millions de vues cumulées</span></li><li><b data-count="5">5</b><span>ans de chaîne</span></li></ul><p class="ch-fine ch-fine--l">Chiffres fictifs, donnés à titre de démonstration.</p></div></section>`),
  sec(`<section class="ch-latest pk-bleed ch-s-white"><div class="ch-wrap">${bandTitle("01", "Dernières vidéos", "Sorties de la semaine, et un peu avant.", more("Toutes les vidéos", "/videos"))}
<div class="ch-wall">${VIDEOS.slice(0, 6).map((v) => card(v)).join("")}</div></div></section>`),
  sec(`<section class="ch-series pk-bleed ch-s-yellow"><div class="ch-wrap">${bandTitle("02", "Les séries", "Quatre façons de passer le vendredi.")}<div class="ch-st-grid">${SERTILE.map(sertile).join("")}</div></div></section>`),
  sec(`<section class="ch-about pk-bleed ch-s-cream"><div class="ch-wrap ch-about-in"><div class="ch-portrait" data-reveal aria-hidden="true"><svg viewBox="0 0 320 320"><g stroke="${K}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><circle cx="160" cy="160" r="150" fill="${YEL}"/>${burst(160, 160, 120, 150, 18, "#fff", 0.1)}${face(160, 170, 3.3, { hair: "tuft", mouth: "grin", eyes: "w", shirt: RED })}${prop("mic", 252, 250, 1.4, 12)}</g></svg><span class="ch-stk ch-stk--4">Mika</span></div>
<div><p class="ch-pl" data-reveal><span class="ch-pl-i">${ic("play")}</span> Playlist 03 · La personne derrière l'écran</p><h2 class="ch-h2" data-reveal>Mika, 29 ans, trop de projets.</h2>
<p class="ch-lead" data-reveal>Créateur fictif de cette démonstration, Mika monte ses vidéos sur une table de cuisine devenue studio. Il aime les idées simples, les ratés assumés et les montages qui vont trop vite.</p>
<ul class="ch-facts" data-reveal><li><b>2021</b><span>première vidéo</span></li><li><b>1 / semaine</b><span>vendredi, 18 h</span></li><li><b>3</b><span>personnes dans l'équipe</span></li></ul>
<div class="ch-chips" data-reveal><a class="ch-chip" href="https://example.com/bouillon-tv" target="_blank" rel="noopener">Vidéos courtes</a><a class="ch-chip" href="https://example.com/bouillon-tv" target="_blank" rel="noopener">Podcast</a><a class="ch-chip" href="https://example.com/bouillon-tv" target="_blank" rel="noopener">Communauté</a><a class="ch-chip ch-chip--y" href="/contact">Écrire à Mika</a></div></div></div></section>`),
  sec(`<section class="ch-kit pk-bleed ch-s-blue"><div class="ch-wrap ch-kit-in"><div><p class="ch-pl ch-pl--l" data-reveal><span class="ch-pl-i">${ic("play")}</span> Playlist 04 · Pour les marques</p><h2 class="ch-h2 ch-h2--l" data-reveal>Une audience jeune, curieuse, fidèle.</h2><p class="ch-lead ch-lead--l" data-reveal>Le kit média rassemble l'audience, les formats et les tarifs indicatifs de la chaîne. Tout y est fictif, mais construit comme un vrai.</p>
<div class="ch-actions" data-reveal><a class="ch-btn ch-btn--yel" href="/kit-media">Ouvrir le kit média ${ic("arr")}</a><a class="ch-btn ch-btn--ghost" href="/liens">Voir les partenaires</a></div></div>
<ul class="ch-kit-n" data-reveal><li><b>3,8 M</b><span>vues par mois</span></li><li><b>7 min 42</b><span>visionnage moyen</span></li><li><b>6,4 %</b><span>engagement</span></li></ul></div></section>`),
  sec(`<section class="ch-brands pk-bleed ch-s-white" aria-label="Marques partenaires fictives"><div class="ch-wrap"><p class="ch-brands-h" data-reveal>Ils ont (fictivement) collaboré avec la chaîne</p><ul class="ch-brands-in" data-reveal>${["Nimbus", "Toastik", "Pixelbox", "Voltige", "Sèvelaine", "Quartz"].map((n, i) => `<li><span class="ch-lg ch-lg${i + 1}">${n[0]}</span>${n}</li>`).join("")}</ul></div></section>`),
  sec(`<section class="ch-band pk-bleed"><div class="ch-wrap ch-band-in"><div class="ch-band-t" role="heading" aria-level="2" data-reveal>Ne rate pas la prochaine.</div>${SUBBTN("ch-sub--lg ch-sub--inv")}</div></section>`),
  sec(footer(c)),
];

// ---------- vidéos : mur filtrable + tiroir ----------
const radio = (g, v, label, on) => `<a class="ch-f${on ? " is-on" : ""}" href="#${g}-${v}" role="radio" aria-checked="${on ? "true" : "false"}" data-g="${g}" data-v="${v}">${label}</a>`;
const toolbar = () => `<div class="ch-bar-t" data-tools>
<div class="ch-fg"><p class="ch-fg-l">Série</p><div class="ch-fgr" role="radiogroup" aria-label="Filtrer par série">${radio("serie", "all", "Toutes", 1)}${Object.entries(SERIES).map(([k, [n]]) => radio("serie", k, esc(n))).join("")}</div></div>
<div class="ch-fg"><p class="ch-fg-l">Durée</p><div class="ch-fgr" role="radiogroup" aria-label="Filtrer par durée">${radio("duree", "all", "Toutes", 1)}${radio("duree", "court", "Court · moins de 8 min")}${radio("duree", "moyen", "Moyen · 8 à 15 min")}${radio("duree", "long", "Long · plus de 15 min")}</div></div>
<div class="ch-fg"><p class="ch-fg-l">Trier</p><div class="ch-fgr" role="radiogroup" aria-label="Trier les vidéos">${radio("tri", "new", "Récentes", 1)}${radio("tri", "pop", "Populaires")}</div></div>
<p class="ch-count" aria-live="polite"><b data-n>12</b> vidéos affichées</p></div>`;

const playerPanel = (dur, rate, dflt) => `<div class="ch-player ch-player--pnl" data-player data-dur="${dur}" data-rate="${rate}" data-load="1">
<div class="ch-frame"><div class="ch-screen"><div class="ch-stage" data-stage>${dflt || ""}</div><p class="ch-cap" data-cap aria-live="off"></p>${bigPlay}</div>${controls(dur, rate)}</div></div>`;

const detail = (v, wrapCls) => `<div class="${wrapCls}"><div class="ch-d-top"><span class="ch-ser ch-ser--${v[1]}" data-p="ser">${esc(SERLAB(v[1]))}</span><p class="ch-meta" data-p="meta">${views(v[5])} · ${dfr(v[6])} · ${mmss(v[4])}</p></div>
<p class="ch-desc" data-p="desc">${esc(v[8])}</p>
<h3 class="ch-h3">Chapitres</h3>${chapList(chaps(v), ' data-p="chaps"')}
<h3 class="ch-h3">Dans la description</h3><ul class="ch-links" data-p="links">${LINKS[v[1]].map(([n, u]) => `<li><a href="${u}">${esc(n)} ${ic("arr")}</a></li>`).join("")}</ul></div>`;

const videos = (c) => [
  sec(header(c)),
  pagehead("Les vidéos", "Le mur<br>de vidéos", "Douze vidéos de démonstration. Filtre par série ou par durée, trie par date ou par popularité, clique pour ouvrir le lecteur.", "yellow", "Vidéos"),
  sec(`<section class="ch-wallsec ch-wallsec--a pk-bleed" data-wall><div class="ch-wrap">${toolbar()}
<div class="ch-wall ch-wall--big" data-grid>${VIDEOS.slice(0, 6).map((v) => card(v)).join("")}</div>
<p class="ch-empty ch-off" data-empty>Aucune vidéo ne correspond à ces filtres. Essaie « Toutes » dans la durée ou la série.</p></div></section>`),
  sec(`<section class="ch-wallsec ch-wallsec--b pk-bleed" data-more><div class="ch-wrap"><div class="ch-wall ch-wall--big">${VIDEOS.slice(6).map((v) => card(v)).join("")}</div></div></section>`),
  ...dataBlocks(false),
  sec(`<div class="ch-drawer-w ch-off pk-bleed" data-drawer><a class="ch-scrim" href="#fermer" data-close aria-label="Fermer le lecteur"></a>
<aside class="ch-panel" role="dialog" aria-modal="true" aria-label="Lecteur vidéo"><div class="ch-panel-h"><p class="ch-panel-k">Lecteur de démonstration</p><a class="ch-x" href="#fermer" role="button" data-close aria-label="Fermer le lecteur">${ic("x")}</a></div>
<div class="ch-panel-b"><h2 class="ch-h2 ch-h2--s" data-p="title">${esc(VIDEOS[0][2])}</h2>${playerPanel(VIDEOS[0][4], 30)}${detail(VIDEOS[0], "ch-detail")}<a class="ch-btn ch-btn--red" href="/video#v1" data-p="fiche">Ouvrir la fiche vidéo ${ic("arr")}</a></div></aside></div>`),
  sec(`<section class="ch-band ch-band--y pk-bleed"><div class="ch-wrap ch-band-in"><div class="ch-band-t" role="heading" aria-level="2" data-reveal>Une idée de défi ? Envoie-la.</div><a class="ch-btn ch-btn--ink" href="/contact" data-reveal>Écrire à Mika ${ic("arr")}</a></div></section>`),
  sec(footer(c)),
];

// ---------- fiche vidéo ----------
const video = (c) => [
  sec(header(c)),
  sec(`<section class="ch-watch pk-bleed ch-s-cream" data-watch><div class="ch-wrap"><p class="ch-crumb"><a href="/">Bouillon TV</a> <span aria-hidden="true">›</span> <a href="/videos">Vidéos</a> <span aria-hidden="true">›</span> <span data-p="crumb">${esc(VIDEOS[0][2])}</span></p>
<div class="ch-watch-in"><div class="ch-watch-main">${playerPanel(VIDEOS[0][4], 30, thumb(VIDEOS[0]))}
<div class="ch-h1 ch-h1--v" role="heading" aria-level="1" data-p="title">${esc(VIDEOS[0][2])}</div>
<div class="ch-acts">${SUBBTN()}<a class="ch-chip" href="#copier-lien" role="button" data-copy-link>${ic("copy")} Copier le lien</a><a class="ch-chip ch-chip--y" href="/kit-media">${ic("eye")} Kit média</a></div>
${detail(VIDEOS[0], "ch-detail ch-detail--w")}</div>
<aside class="ch-next" aria-label="À suivre"><h2 class="ch-h3">À suivre</h2><div class="ch-next-l" data-list>${["v2", "v3", "v5", "v7", "v10", "v12"].map((id) => miniCard(VIDEOS.find((v) => v[0] === id))).join("")}</div></aside></div></div></section>`),
  ...dataBlocks(true),
  sec(`<section class="ch-band pk-bleed"><div class="ch-wrap ch-band-in"><div class="ch-band-t" role="heading" aria-level="2" data-reveal>Tu as aimé ? Abonne-toi.</div>${SUBBTN("ch-sub--lg ch-sub--inv")}</div></section>`),
  sec(footer(c)),
];

// ---------- kit média ----------
const AGES = [["13–17 ans", 8, "#ffd60a"], ["18–24 ans", 34, RED], ["25–34 ans", 31, BLU], ["35–44 ans", 17, "#111"], ["45 ans et +", 10, "#9aa4b2"]];
const COUNTRIES = [["France", 61], ["Belgique", 12], ["Canada", 9], ["Suisse", 8], ["Autres pays", 10]];
const DEVICES = [["Téléphone", 68], ["Télévision", 17], ["Ordinateur", 12], ["Tablette", 3]];
const MONTHS12 = [210, 224, 236, 251, 270, 298, 322, 351, 380, 412, 449, 482];
const growth = () => {
  const mx = 500, pts = MONTHS12.map((v, i) => `${(i * 28 + 10).toFixed(0)},${(130 - (v / mx) * 120).toFixed(1)}`);
  return `<svg class="ch-growth" viewBox="0 0 330 150" role="img" aria-label="Courbe des abonnés sur douze mois : de 210 000 à 482 000"><title>Abonnés sur douze mois (milliers, fictif)</title><g stroke="#111" stroke-width="2" opacity=".18"><line x1="0" y1="130" x2="330" y2="130"/><line x1="0" y1="90" x2="330" y2="90"/><line x1="0" y1="50" x2="330" y2="50"/><line x1="0" y1="10" x2="330" y2="10"/></g><polygon class="ch-growth-a" points="10,130 ${pts.join(" ")} 318,130" fill="${YEL}" opacity=".55"/><polyline class="ch-growth-l" points="${pts.join(" ")}" fill="none" stroke="${RED}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="318" cy="${(130 - (482 / mx) * 120).toFixed(1)}" r="7" fill="${RED}" stroke="#111" stroke-width="3"/></svg>`;
};
const bars = (list, col) => `<ul class="ch-bars">${list.map(([n, p]) => `<li><span class="ch-bars-n">${esc(n)}</span><svg class="ch-bars-s" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="10" fill="#111" opacity=".1"/><rect class="ch-bars-r" width="${p}" height="10" fill="${col}"/></svg><b>${p} %</b></li>`).join("")}</ul>`;
const heat = () => {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], hours = ["8 h", "12 h", "16 h", "18 h", "20 h", "22 h"];
  const M = [[1, 2, 1, 1, 2, 1], [1, 2, 2, 2, 3, 2], [2, 2, 3, 3, 3, 2], [1, 2, 2, 3, 3, 2], [2, 3, 3, 4, 4, 3], [3, 3, 3, 3, 4, 3], [2, 3, 3, 3, 3, 2]];
  return `<div class="ch-heat" role="img" aria-label="Carte de chaleur : le pic d'écoute est le vendredi à 18 h et 20 h"><div class="ch-heat-h"><i></i>${hours.map((h) => `<span>${h}</span>`).join("")}</div>${days.map((d, i) => `<div class="ch-heat-r"><span>${d}</span>${M[i].map((n) => `<i class="ch-hc ch-hc${n}"></i>`).join("")}</div>`).join("")}</div>`;
};
const donut = () => `<svg class="ch-donut" viewBox="0 0 120 120" role="img" aria-label="Répartition par âge : 18–24 ans 34 %, 25–34 ans 31 %, 35–44 ans 17 %, 45 ans et plus 10 %, 13–17 ans 8 %"><title>Répartition par âge (fictive)</title><g transform="rotate(-90 60 60)" fill="none" stroke-width="24">${AGES.map(([, , col], i) => `<circle class="ch-dn ch-dn${i}" cx="60" cy="60" r="40" stroke="${col}"/>`).join("")}</g><circle cx="60" cy="60" r="52" fill="none" stroke="#111" stroke-width="4"/><circle cx="60" cy="60" r="28" fill="none" stroke="#111" stroke-width="4"/></svg>`;
const PRICES = [
  ["Mention", "30 secondes dans une vidéo, au milieu du récit.", "800", ["1 mention parlée", "Lien en description", "Une relecture"], ""],
  ["Intégration", "Un segment de 60 à 90 secondes, pensé avec la marque.", "1 800", ["Segment scénarisé", "Lien et code", "Deux relectures", "Diffusion des courtes"], "ch-pr--hot"],
  ["Vidéo dédiée", "Toute la vidéo autour de votre produit ou de votre histoire.", "4 500", ["Idée co-écrite", "Montage complet", "Lien, code, épinglé", "Rapport d'audience"], ""],
];
const kit = (c) => [
  sec(header(c)),
  pagehead("Kit média", "Kit média<br>& partenariats", "Audience, formats et tarifs indicatifs de la chaîne. Données de démonstration : rien ici n'est un engagement.", "blue", "Kit média"),
  sec(`<section class="ch-aud pk-bleed ch-s-white" data-aud><div class="ch-wrap">${bandTitle("01", "Audience", "Les chiffres qui comptent.")}
<ul class="ch-big-n"><li class="ch-bn ch-bn--r" data-reveal><b data-count="482300" data-sep="1">482 300</b><span>abonnés</span></li><li class="ch-bn ch-bn--y" data-reveal><b><span data-count="46">46</span></b><span>millions de vues par an</span></li><li class="ch-bn ch-bn--b" data-reveal><b><span data-count="7">7</span> min <span data-count="42">42</span></b><span>de visionnage moyen</span></li><li class="ch-bn" data-reveal><b><span data-count="64" data-dec="1">6,4</span> %</b><span>taux d'engagement</span></li></ul>
<div class="ch-chart-card" data-reveal><div class="ch-chart-h"><h3 class="ch-h3">Abonnés sur douze mois</h3><p class="ch-fine">Milliers, fictif</p></div>${growth()}</div><p class="ch-fine">Données de démonstration, arrondies. Les vrais chiffres seraient fournis et datés par la chaîne.</p></div></section>`),
  sec(`<section class="ch-demo pk-bleed ch-s-cream"><div class="ch-wrap">${bandTitle("02", "Démographie", "Qui regarde, d'où, et quand.")}
<div class="ch-demo-g"><article class="ch-dcard" data-reveal><h3 class="ch-h3">Âge</h3><div class="ch-dcard-b">${donut()}<ul class="ch-leg">${AGES.map(([n, p], i) => `<li><i class="ch-sw ch-sw${i}"></i>${esc(n)} <b>${p} %</b></li>`).join("")}</ul></div></article>
<article class="ch-dcard" data-reveal><h3 class="ch-h3">Pays</h3>${bars(COUNTRIES, RED)}</article>
<article class="ch-dcard" data-reveal><h3 class="ch-h3">Appareils</h3>${bars(DEVICES, BLU)}</article>
<article class="ch-dcard ch-dcard--w" data-reveal><h3 class="ch-h3">Quand la chaîne est regardée</h3>${heat()}<p class="ch-fine">Plus la case est foncée, plus l'écoute est forte. Pic le vendredi, à 18 h et 20 h.</p></article></div></div></section>`),
  sec(`<section class="ch-prices pk-bleed ch-s-yellow"><div class="ch-wrap">${bandTitle("03", "Formats", "Trois façons de travailler ensemble.")}
<div class="ch-pr-g">${PRICES.map(([n, d, p, li, cls]) => `<article class="ch-pr ${cls}" data-reveal>${cls ? '<span class="ch-pr-flag">Le plus demandé</span>' : ""}<h3>${n}</h3><p>${esc(d)}</p><p class="ch-pr-p"><small>à partir de</small><b>${p} €</b><small>indicatif</small></p><ul>${li.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><a class="ch-btn ch-btn--ink ch-btn--block" href="/contact">Demander ce format ${ic("arr")}</a></article>`).join("")}</div>
<p class="ch-fine">Tarifs fictifs, donnés à titre de démonstration : ils ne constituent ni une offre ni un devis. Le formulaire de contact permet de décrire un projet.</p></div></section>`),
  sec(`<section class="ch-how pk-bleed ch-s-white"><div class="ch-wrap">${bandTitle("04", "Méthode", "De l'idée à la mise en ligne.")}
<ol class="ch-how-l">${[["Brief", "Vous racontez votre produit et votre objectif."], ["Idée", "Mika propose un scénario à sa façon."], ["Tournage", "Deux semaines pour tourner et monter."], ["Mise en ligne", "Publication un vendredi, 18 h."]].map(([t, d], i) => `<li data-reveal><span class="ch-how-n">${i + 1}</span><b>${t}</b><span>${d}</span></li>`).join("")}</ol></div></section>`),
  sec(`<section class="ch-contactb pk-bleed ch-s-red"><div class="ch-wrap ch-contactb-in"><div><p class="ch-pl ch-pl--l" data-reveal><span class="ch-pl-i">${ic("play")}</span> Playlist 05 · On se parle ?</p><h2 class="ch-h2 ch-h2--l" data-reveal>Une collaboration en tête ?</h2><p class="ch-lead ch-lead--l" data-reveal>Copie l'adresse de contact fictive ou passe par le formulaire : la démonstration n'envoie rien à une vraie boîte.</p></div>
<div class="ch-copybox" data-reveal><span class="ch-copybox-l">Adresse de contact (fictive)</span><b class="ch-copybox-v">partenariats@bouillon-tv.example</b><div class="ch-actions"><a class="ch-btn ch-btn--yel" href="#copier" role="button" data-copy="partenariats@bouillon-tv.example">${ic("copy")} Copier l'adresse</a><a class="ch-btn ch-btn--ghost" href="/contact">Formulaire ${ic("arr")}</a></div></div></div></section>`),
  sec(footer(c)),
];

// ---------- liens et partenaires ----------
const PARTNERS = [
  ["Nimbus Mobile", "tech", "Forfait mobile sans engagement", "NIMBUS-DEMO", "1 mois offert (offre fictive)", 1],
  ["Toastik", "food", "Box petit-déjeuner du vendredi", "BOUILLON15", "15 % sur la première box (fictif)", 2],
  ["Pixelbox", "tech", "Boîtiers pour micro et caméra", "PIXEL-MIKA", "Livraison offerte (fictif)", 3],
  ["Voltige Vélos", "mobilite", "Location de vélos électriques", "VOLT-DEMO", "Un casque offert (fictif)", 4],
  ["Sèvelaine", "maison", "Plaids et coussins en laine", "SEVE10", "10 % dès deux articles (fictif)", 5],
  ["Quartz Casques", "tech", "Casques audio de studio", "QUARTZ-FR", "Étui offert (fictif)", 6],
];
const MERCH = [
  ["tee", "T-shirt « Trop fort ?! »", "Coton, coupe droite", "24 €", `<path d="M20 30l24-12q6 10 16 0l24 12-8 22-10-4v42H38V48l-10 4z" fill="${RED}"/><circle cx="60" cy="58" r="11" fill="${YEL}"/>`],
  ["mug", "Mug Bouillon", "Céramique, 33 cl", "12 €", `<path d="M26 34h56v44a14 14 0 0 1-14 14H40a14 14 0 0 1-14-14z" fill="${YEL}"/><path d="M82 44h8q10 0 10 12t-10 12h-8" fill="none"/><path d="M40 20c-6 6 6 8 0 14M56 20c-6 6 6 8 0 14" fill="none"/><circle cx="54" cy="62" r="10" fill="${RED}"/>`],
  ["cap", "Casquette tomate", "Réglable, brodée", "19 €", `<path d="M22 62C22 30 98 30 98 62z" fill="${BLU}"/><path d="M40 62h66q8 0 8 8H40z" fill="${BLU}"/><circle cx="60" cy="38" r="6" fill="${YEL}"/><path d="M60 62V42" fill="none"/>`],
];
const liens = (c) => [
  sec(header(c)),
  pagehead("Liens & partenaires", "Liens, codes<br>& boutique", "Les réseaux de Mika, les marques qui soutiennent la chaîne (fictives) et un petit rayon de goodies. Rien ne s'achète ici.", "red", "Liens"),
  sec(`<section class="ch-bio pk-bleed ch-s-cream"><div class="ch-wrap ch-bio-in"><ul class="ch-bio-l">
<li data-reveal><a class="ch-bio-a ch-bio-a--r" href="/videos"><b>Dernière vidéo</b><span>Défi : 24 heures dans un carton</span>${ic("arr")}</a></li>
<li data-reveal><a class="ch-bio-a ch-bio-a--y" href="/kit-media"><b>Kit média</b><span>Audience, formats, tarifs indicatifs</span>${ic("arr")}</a></li>
<li data-reveal><a class="ch-bio-a ch-bio-a--b" href="/contact"><b>Écrire à Mika</b><span>Collaborations, idées de défis</span>${ic("arr")}</a></li>
<li data-reveal><a class="ch-bio-a" href="https://example.com/bouillon-tv" target="_blank" rel="noopener"><b>Vidéos courtes</b><span>Réseau fictif — lien d'exemple</span>${ic("arr")}</a></li></ul>
<div class="ch-bio-c" data-reveal aria-hidden="true"><svg viewBox="0 0 260 260"><g stroke="${K}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${burst(130, 130, 92, 124, 14, YEL, 0.1)}${face(130, 138, 2.7, { hair: "cap", hc: RED, mouth: "tongue", eyes: "w", shirt: BLU })}${arrow(6, 220, -35, 0.7, "#fff")}</g></svg></div></div></section>`),
  sec(`<section class="ch-partners pk-bleed ch-s-white" data-wall data-filter-only><div class="ch-wrap">${bandTitle("01", "Partenaires", "Marques et codes à copier.")}
<div class="ch-bar-t ch-bar-t--s" data-tools><div class="ch-fg"><p class="ch-fg-l">Univers</p><div class="ch-fgr" role="radiogroup" aria-label="Filtrer les partenaires">${radio("cat", "all", "Tous", 1)}${radio("cat", "tech", "Tech")}${radio("cat", "food", "Food")}${radio("cat", "mobilite", "Mobilité")}${radio("cat", "maison", "Maison")}</div></div><p class="ch-count" aria-live="polite"><b data-n>6</b> offres affichées</p></div>
<div class="ch-pt-g" data-grid>${PARTNERS.map(([n, cat, d, code, offer, i]) => `<article class="ch-pt" data-cat="${cat}" data-reveal><div class="ch-pt-h"><span class="ch-lg ch-lg${i}">${n[0]}</span><div><h3>${esc(n)}</h3><p>${esc(d)}</p></div></div><p class="ch-pt-o">${esc(offer)}</p><div class="ch-code"><span class="ch-code-v">${code}</span><a class="ch-code-b" href="#copier" role="button" data-copy="${code}" aria-label="Copier le code ${code}">${ic("copy")}<span>Copier</span></a></div></article>`).join("")}</div>
<p class="ch-empty ch-off" data-empty>Aucune offre dans cet univers.</p><p class="ch-fine">Marques, offres et codes fictifs, pour la démonstration : ils n'ouvrent aucune réduction.</p></div></section>`),
  sec(`<section class="ch-merch pk-bleed ch-s-yellow"><div class="ch-wrap">${bandTitle("02", "Goodies", "Le rayon de la boutique (maquette).")}<div class="ch-mg-g">${MERCH.map(([k, n, d, p, art]) => `<article class="ch-mg" data-reveal><span class="ch-mg-a"><svg viewBox="0 0 120 110" aria-hidden="true"><g stroke="${K}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${art}</g></svg></span><h3>${esc(n)}</h3><p>${esc(d)}</p><p class="ch-mg-p">${p} <small>indicatif</small></p></article>`).join("")}</div>
<p class="ch-fine">Boutique de démonstration : aucune vente en ligne, aucun panier. Prix indicatifs.</p></div></section>`),
  sec(`<section class="ch-band pk-bleed"><div class="ch-wrap ch-band-in"><div class="ch-band-t" role="heading" aria-level="2" data-reveal>Une marque, une idée ? Parlons-en.</div><a class="ch-btn ch-btn--yel" href="/kit-media" data-reveal>Voir le kit média ${ic("arr")}</a></div></section>`),
  sec(footer(c)),
];

// ---------- contact / recherche / 404 ----------
const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Contact", "Une idée de défi, un partenariat, une question sur la chaîne : écris à Mika.", "white", "Contact"),
  { type: "form", heading: "Écrire à Mika", intro: "Décris ton idée ou ton projet de collaboration : la démonstration ne s'envoie à personne, mais le formulaire fonctionne comme sur un vrai site." },
  sec(`<section class="ch-info pk-bleed ch-s-cream"><div class="ch-wrap ch-info-in"><div data-reveal><p class="ch-pl"><span class="ch-pl-i">${ic("play")}</span> Pratique</p><h2 class="ch-h2">Avant d'écrire</h2><ul class="ch-info-l"><li><b>Idée de défi</b><span>Décris-la en trois lignes, avec le matériel nécessaire.</span></li><li><b>Partenariat</b><span>Consulte le <a href="/kit-media">kit média</a> avant de nous écrire.</span></li><li><b>Réponse</b><span>La chaîne répond sous quelques jours (démonstration).</span></li></ul></div>
<div class="ch-copybox ch-copybox--d" data-reveal><span class="ch-copybox-l">Adresse de contact (fictive)</span><b class="ch-copybox-v">bonjour@bouillon-tv.example</b><a class="ch-btn ch-btn--red" href="#copier" role="button" data-copy="bonjour@bouillon-tv.example">${ic("copy")} Copier l'adresse</a></div></div></section>`),
  { type: "layout", children: [{ type: "map", props: { address: "Place du Marché, 59000 Lille", zoom: 14, height: 360 } }] },
  sec(footer(c)),
];
const recherche = (c) => [sec(header(c)), pagehead("Recherche", "Chercher<br>une vidéo", "Un titre, une série, un partenaire : tape un mot.", "yellow", "Recherche"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une vidéo, une série…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ch-404 pk-bleed ch-s-ink"><div class="ch-wrap ch-404-in"><div class="ch-404-screen" aria-hidden="true"><svg viewBox="0 0 320 180"><g stroke="${K}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect width="320" height="180" fill="${BLU}" stroke="none"/>${burst(160, 90, 60, 100, 14, YEL, 0.2)}${face(160, 100, 1.5, { hair: "beanie", hc: RED, mouth: "o", eyes: "w", shirt: "#fff" })}<g class="ch-spin"><path d="M270 22a18 18 0 1 1-18 18" fill="none" stroke="#fff" stroke-width="6"/></g></g></svg><span class="ch-404-b">Chargement…</span></div>
<div><p class="ch-pl ch-pl--l">Erreur 404 · vidéo privée</p><div class="ch-h1" role="heading" aria-level="1">Cette vidéo n'existe pas (ou plus).</div><p class="ch-lead ch-lead--l">Le lien est cassé, ou Mika l'a passée en privé après un raté. Retourne au mur de vidéos, il y en a douze.</p><div class="ch-actions"><a class="ch-btn ch-btn--yel" href="/videos">Voir les vidéos ${ic("arr")}</a><a class="ch-btn ch-btn--ghost" href="/">Accueil</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "chaine", name: "Chaîne", version: "2.0.0", category: "divertissement", tags: ["audacieux", "ludique", "moderne"], siteType: "Créateur de contenu / chaîne vidéo", featured: true,
  concept: "Une chaîne vidéo fictive : lecteur 16:9 géant à chapitres, vignettes dessinées avec visages-avatars, bouton S'abonner qui bascule, mur de vidéos filtrable, kit média et codes partenaires à copier.",
  description: "Site de créateur de contenu : crème glacée et encre noire, aplats rouge tomate, jaune et bleu électrique, lecteur vidéo simulé, vignettes illustrées, mur filtrable avec tiroir de lecture, kit média en graphiques et codes partenaires à copier.",
  brand: "Bouillon TV", modules: ["formulaires", "recherche"],
  dna: {
    header: "barre-blanche-a-bouton-s-abonner-bascule-et-compteur-d-abonnes",
    hero: "lecteur-video-simule-geant-16-9-a-chapitres-cliquables-et-apercu-anime",
    grid: "mur-de-vignettes-16-9-a-duree-et-vues-avec-lecteur-en-tiroir",
    motion: "progression-de-lecture-qui-avance-vignettes-qui-sautent-et-compteurs-d-audience",
    shapes: "cadres-de-lecteur-vignettes-a-contours-noirs-bulles-fleches-et-badges-autocollants",
    rhythm: "playlists-numerotees-en-bandes-creme-blanc-rouge-jaune-et-bleu",
    signature: "mur-de-videos-filtrable-lecteur-en-panneau-kit-media-en-graphiques-et-codes-partenaires-a-copier",
  },
  tokens: {
    colors: { primary: "#dc2a18", secondary: "#111111", accent: "#ffd60a", background: "#fff7e6", surface: "#ffffff", text: "#111111", muted: "#4d4a44", success: "#13803f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.dela-gothic-one", body: "font.poppins", button: "font.bangers", link: "font.poppins" },
    radius: { sm: 8, md: 12, lg: 18, button: 12, field: 10, card: 14 }, shadow: { card: "5px 5px 0 #111111", button: "4px 4px 0 #111111" }, border: { width: 4, color: "#111111" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 40, weight: 400, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge tomate", type: "color", default: "#dc2a18" },
    { key: "blue", label: "Bleu électrique", type: "color", default: "#2447ff" },
    { key: "ticker", label: "Bandeau « prochaine vidéo »", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "stickers", label: "Autocollants décoratifs", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masqués"]] },
    { key: "tilt", label: "Vignettes légèrement inclinées", type: "choice", default: "on", choices: [["on", "Inclinées"], ["off", "Droites"]] },
  ],
  menu: [["Accueil", "/"], ["Vidéos", "/videos"], ["Kit média", "/kit-media"], ["Liens", "/liens"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "videos", name: "Vidéos", render: videos }, { key: "video", name: "Fiche vidéo", render: video },
    { key: "kit-media", name: "Kit média et partenariats", render: kit }, { key: "liens", name: "Liens, partenaires et goodies", render: liens },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
