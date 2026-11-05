// Speakeasy — bar à cocktails clandestin des années 1920. Direction artistique : art déco vert-bleu très sombre et laiton ; éventail doré qui scintille sur une lumière tamisée,
// porte-menu vertical doré à gauche, carte à filets pointillés (cocktails par spiritueux, fiche détaillée), recette à l'échelle et demande de table qui renvoie vers /contact.
const { sec, esc } = require("../kit");

// ---------- Illustrations ----------
const R = ["I", "II", "III", "IV", "V", "VI", "VII"];
const P = (cx, cy, r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy - r * Math.sin(a)).toFixed(1)}`;
// Éventail déco : secteurs annulaires en bandes (opacité décroissante vers l'extérieur), festons, arcs, rayon de lumière qui balaie
function fan(n, mini) {
  const cx = 400, cy = 410, bands = mini ? [[36, 330]] : [[44, 140], [152, 250], [262, 336]];
  let rays = "";
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (i / n) + 0.012, a1 = Math.PI * ((i + 1) / n) - 0.012;
    const fill = i % 2 === 0;
    let d = "";
    bands.forEach(([r0, r1]) => { d += `M${P(cx, cy, r0, a0)}L${P(cx, cy, r1, a0)}A${r1} ${r1} 0 0 0 ${P(cx, cy, r1, a1)}L${P(cx, cy, r0, a1)}A${r0} ${r0} 0 0 1 ${P(cx, cy, r0, a0)}Z`; });
    rays += `<g class="sp-ray sp-rd${i % 5}"><path class="${fill ? "sp-rf" : "sp-ro"}" d="${d}"/></g>`;
  }
  let scal = "";
  if (!mini) for (let i = 0; i < n; i++) { const a0 = Math.PI * (i / n), a1 = Math.PI * ((i + 1) / n), s = (340 * Math.sin(Math.PI / n / 2)).toFixed(1); scal += `M${P(cx, cy, 346, a0)}A${s} ${s} 0 0 0 ${P(cx, cy, 346, a1)}`; }
  const arcs = mini ? "" : [150, 258].map((r) => `<path class="sp-arc" d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}"/>`).join("");
  const sweep = mini ? "" : `<path class="sp-sweep" d="M${cx} ${cy}L${P(cx, cy, 340, Math.PI / 2 + 0.2)}A340 340 0 0 0 ${P(cx, cy, 340, Math.PI / 2 - 0.2)}Z"/>`;
  const spark = mini ? "" : [[120, 230], [690, 200], [250, 110], [560, 70], [400, 38]].map(([x, y], i) => `<path class="sp-spark sp-sd${i}" d="M${x} ${y - 11}L${x + 3} ${y - 3}L${x + 11} ${y}L${x + 3} ${y + 3}L${x} ${y + 11}L${x - 3} ${y + 3}L${x - 11} ${y}L${x - 3} ${y - 3}Z"/>`).join("");
  return `<svg class="sp-fan${mini ? " sp-fan--mini" : ""}" viewBox="0 ${mini ? 60 : 20} 800 ${mini ? 370 : 410}" role="img" aria-label="Éventail art déco doré"><g>${rays}</g>${scal ? `<path class="sp-scal" d="${scal}"/>` : ""}${arcs}${sweep}<path class="sp-arc" d="M${cx - 358} ${cy}A358 358 0 0 1 ${cx + 358} ${cy}"/><path class="sp-hub" d="M${cx - 36} ${cy}A36 36 0 0 1 ${cx + 36} ${cy}Z"/><path class="sp-arc" d="M30 ${cy}H770"/>${spark}</svg>`;
}

const GLASS = {
  coupe: (c) => `<path d="M12 22H68C68 46 52 56 40 56S12 46 12 22Z" fill="rgba(255,255,255,.05)"/><path d="M16 28H64C62 44 50 52 40 52S18 44 16 28Z" fill="${c}"/><path class="g" d="M12 22H68C68 46 52 56 40 56S12 46 12 22ZM40 56V86M24 90Q40 82 56 90Z"/>`,
  martini: (c) => `<path d="M8 18H72L40 58Z" fill="rgba(255,255,255,.05)"/><path d="M15 25H65L40 54Z" fill="${c}"/><path class="g" d="M8 18H72L40 58ZM40 58V86M24 90Q40 82 56 90Z"/><circle cx="58" cy="19" r="4" fill="#9ccf4a" stroke="#05201f"/>`,
  rocks: (c) => `<path d="M16 30L20 86H60L64 30Z" fill="rgba(255,255,255,.05)"/><path d="M18 46L21 84H59L62 46Z" fill="${c}"/><rect x="28" y="52" width="16" height="16" rx="2" transform="rotate(-12 36 60)" fill="rgba(255,255,255,.22)"/><rect x="42" y="60" width="13" height="13" rx="2" transform="rotate(10 48 66)" fill="rgba(255,255,255,.16)"/><path class="g" d="M16 30L20 86H60L64 30Z"/>`,
  highball: (c) => `<path d="M24 12L27 90H53L56 12Z" fill="rgba(255,255,255,.05)"/><path d="M25.5 28L27.5 88H52.5L54.5 28Z" fill="${c}"/><path class="g" d="M24 12L27 90H53L56 12ZM46 4L40 70"/><circle cx="55" cy="14" r="6" fill="none" stroke="#f2d98f" stroke-width="2"/>`,
  flute: (c) => `<path d="M31 8H49L47 58Q40 64 33 58Z" fill="rgba(255,255,255,.05)"/><path d="M32 22H48L46.5 56Q40 61 33.5 56Z" fill="${c}"/><circle cx="38" cy="40" r="1.6" fill="#fff" opacity=".7"/><circle cx="43" cy="31" r="1.3" fill="#fff" opacity=".7"/><path class="g" d="M31 8H49L47 58Q40 64 33 58ZM40 62V86M24 90Q40 82 56 90Z"/>`,
};
const glass = (k, c, cls = "") => `<svg class="sp-glass ${cls}" viewBox="0 0 80 100" aria-hidden="true">${GLASS[k](c)}</svg>`;
const BOTTLE = {
  gin: `<path d="M13 4h6v10l3 4v22H10V18l3-4z"/>`, rhum: `<path d="M12 4h8v8c4 3 6 6 6 10v18H6V22c0-4 2-7 6-10z"/>`,
  whisky: `<path d="M12 6h8v6l7 8v20H5V20l7-8z"/>`, tequila: `<path d="M14 2h4v10c3 3 4 5 4 9v19H10V21c0-4 1-6 4-9z"/>`, zero: `<path d="M16 4c-5 8-9 13-9 22a9 9 0 0 0 18 0c0-9-4-14-9-22z"/>`,
};
const bottle = (k) => `<svg class="sp-bot" viewBox="0 0 32 44" aria-hidden="true">${BOTTLE[k]}</svg>`;

// Mur de bouteilles sous une arche (hero de la maison)
function wall() {
  const arch = [0, 14, 28].map((i) => `<path class="sp-arc${i ? " sp-arc--f" : ""}" d="M${20 + i} 440V${176 + i * .3}A${160 - i} ${160 - i} 0 0 1 ${340 - i} ${176 + i * .3}V440"/>`).join("");
  const rows = [[200, 5, 88], [290, 7, 56], [380, 7, 56]];
  let out = "";
  rows.forEach(([y, n, x0], r) => {
    out += `<path class="sp-shelf" d="M${x0 - 12} ${y}H${360 - x0 + 12}"/>`;
    for (let j = 0; j < n; j++) {
      const x = x0 + j * ((360 - 2 * x0) / (n - 1)) - 9, h = 44 + ((j * 7 + r * 3) % 5) * 8, w = 18, fill = (j + r) % 3 === 0 ? "#10463f" : (j + r) % 3 === 1 ? "#0b3532" : "#17524a";
      out += `<g><rect x="${x.toFixed(1)}" y="${y - h}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#d2ac5a" stroke-width="1"/><rect x="${(x + 6).toFixed(1)}" y="${y - h - 14}" width="6" height="15" fill="${fill}" stroke="#d2ac5a" stroke-width="1"/><rect x="${(x + 3).toFixed(1)}" y="${y - h * .55}" width="12" height="${h * .22}" fill="#d2ac5a" opacity="${j % 2 ? ".85" : ".5"}"/></g>`;
    }
  });
  return `<svg class="sp-wall" viewBox="0 0 360 440" role="img" aria-label="Mur de bouteilles sous une arche dorée"><rect x="34" y="176" width="292" height="264" fill="#031a19" opacity=".7"/>${arch}<g class="sp-wall-fan"><svg x="130" y="52" width="100" height="62" viewBox="0 60 800 370">${fan(9, true).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg></g>${out}<circle class="sp-glow" cx="180" cy="120" r="70"/></svg>`;
}
const room = (k) => {
  const base = `<path class="sp-arc" d="M10 150V80A70 70 0 0 1 150 80V150Z"/><path class="sp-arc sp-arc--f" d="M22 150V82A58 58 0 0 1 138 82V150Z"/>`;
  const scenes = {
    fumoir: `<path d="M44 150V124Q44 112 56 112H104Q116 112 116 124V150Z" fill="#12423d" stroke="#d2ac5a"/><path d="M52 112V96Q52 86 62 86H98Q108 86 108 96V112" fill="#0e3733" stroke="#d2ac5a"/><circle cx="124" cy="54" r="22" class="sp-glow"/><path d="M124 54V112M118 112H130" stroke="#d2ac5a" stroke-width="2"/><path d="M114 56L124 38L134 56Z" fill="#f2d98f"/>`,
    salon: `<path d="M32 40V150M52 40V150M108 40V150M128 40V150" stroke="#d2ac5a" stroke-width="1" opacity=".6"/><path d="M32 40Q42 70 52 40M108 40Q118 70 128 40" fill="none" stroke="#d2ac5a"/><rect x="58" y="118" width="44" height="32" fill="#12423d" stroke="#d2ac5a"/><circle cx="80" cy="74" r="20" class="sp-glow"/><circle cx="80" cy="74" r="6" fill="#f2d98f"/>`,
    arriere: `<ellipse cx="80" cy="112" rx="44" ry="10" fill="#12423d" stroke="#d2ac5a"/><path d="M80 122V150M60 150H100" stroke="#d2ac5a" stroke-width="2"/><path d="M62 104L66 86H74L70 104ZM88 104L92 86H100L96 104Z" fill="#c18a2a" opacity=".85"/><circle cx="80" cy="58" r="22" class="sp-glow"/><path d="M70 58L80 38L90 58Z" fill="#f2d98f"/>`,
  };
  return `<svg class="sp-room" viewBox="0 0 160 160" aria-hidden="true">${base}${scenes[k]}</svg>`;
};
const door = `<svg class="sp-door-svg" viewBox="0 0 220 300" role="img" aria-label="Porte close du bar"><path class="sp-arc" d="M12 296V110A98 98 0 0 1 208 110V296Z"/><path class="sp-arc sp-arc--f" d="M26 296V112A84 84 0 0 1 194 112V296Z" fill="#031a19"/><path class="sp-arc" d="M44 296V116A66 66 0 0 1 176 116V296M110 50V296" fill="none"/><circle cx="92" cy="190" r="6" fill="#d2ac5a"/><circle cx="128" cy="190" r="6" fill="#d2ac5a"/><circle cx="110" cy="130" r="22" fill="#05201f" stroke="#d2ac5a"/><path d="M110 122a7 7 0 1 1 0 14v10M105 143h10" stroke="#d2ac5a" stroke-width="2" fill="none"/></svg>`;
const arrow = `<svg class="sp-arr" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6H21M16 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
const diamond = `<svg class="sp-dm" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0L12 6L6 12L0 6Z" fill="currentColor"/></svg>`;

// ---------- Données : la carte ----------
const SP = [
  { k: "gin", n: "Gin", d: "Botaniques, agrumes et fraîcheur." },
  { k: "rhum", n: "Rhum", d: "Chaleur, épices et fruits mûrs." },
  { k: "whisky", n: "Whisky", d: "Bois, fumée et profondeur." },
  { k: "tequila", n: "Tequila", d: "Agave, piment et vivacité." },
  { k: "zero", n: "Sans alcool", d: "Aussi soignés, zéro degré." },
];
// ing : [quantité en cl (ou null), texte] ; pf : sec, acidulé, amer, gourmand (1 à 5)
const CK = [
  { id: "chevron", sp: "gin", n: "Le Chevron", g: "coupe", col: "#cfe7a0", abv: 18, f: 3, pf: [4, 4, 2, 1], t: "Gin, citron vert, sureau et concombre.", ing: [[5, "gin sec"], [2, "liqueur de sureau"], [2, "jus de citron vert"], [null, "3 tranches de concombre"]], gar: "ruban de concombre", dsc: "Vif et floral, le verre de bienvenue de la maison. Le concombre arrondit l'acidité du citron." },
  { id: "emeraude", sp: "gin", n: "Émeraude 1925", g: "coupe", col: "#58c79a", abv: 20, f: 3, pf: [3, 3, 3, 2], t: "Gin, liqueur d'herbes, citron, blanc d'œuf.", ing: [[4.5, "gin sec"], [2, "liqueur d'herbes des Alpes"], [2.5, "jus de citron jaune"], [1.5, "sirop de sucre"], [null, "1 blanc d'œuf"]], gar: "feuille de basilic", dsc: "Notre verre signature : vert profond, texture soyeuse, longueur d'herbes. Fiche complète sur sa page.", sig: true },
  { id: "fumee", sp: "gin", n: "Fumée Blanche", g: "martini", col: "#e6eadb", abv: 28, f: 5, pf: [5, 1, 3, 1], t: "Gin, vermouth blanc, thé fumé.", ing: [[6, "gin sec"], [2, "vermouth blanc"], [1, "thé noir fumé infusé"]], gar: "zeste de citron", dsc: "Très sec, presque austère : un verre pour les amateurs de martini qui aiment la fumée." },
  { id: "havane", sp: "rhum", n: "Havane Minuit", g: "rocks", col: "#7a3b1c", abv: 24, f: 4, pf: [3, 1, 4, 4], t: "Rhum ambré, café, vermouth rouge, cacao.", ing: [[5, "rhum ambré"], [2, "vermouth rouge"], [2, "café froid infusé"], [null, "2 traits de bitter au cacao"]], gar: "zeste d'orange", dsc: "Sombre et enveloppant, à siroter lentement sur un gros glaçon." },
  { id: "eventail", sp: "rhum", n: "Éventail Tropical", g: "highball", col: "#f0c95a", abv: 12, f: 2, pf: [2, 4, 1, 5], t: "Rhum blanc, ananas grillé, citron vert, menthe.", ing: [[4, "rhum blanc"], [6, "jus d'ananas grillé"], [2, "jus de citron vert"], [null, "8 feuilles de menthe"]], gar: "tranche d'ananas", dsc: "Le plus solaire de la carte : l'ananas est grillé au comptoir avant d'être pressé." },
  { id: "laiton", sp: "rhum", n: "Laiton", g: "rocks", col: "#c9922e", abv: 26, f: 4, pf: [2, 2, 3, 4], t: "Rhum vieux, miel, orange, bitter.", ing: [[6, "rhum vieux"], [1, "sirop de miel"], [null, "3 traits de bitter aromatique"], [null, "1 zeste d'orange pressé"]], gar: "zeste d'orange flambé", dsc: "Un classique à notre façon : miel de châtaignier, orange flambée et longueur de boisé." },
  { id: "vieux", sp: "whisky", n: "Vieux Salon", g: "rocks", col: "#a8561f", abv: 30, f: 5, pf: [4, 1, 4, 2], t: "Bourbon, sucre brun, bitter, orange.", ing: [[6, "bourbon"], [0.5, "sirop de sucre brun"], [null, "3 traits de bitter aromatique"]], gar: "zeste d'orange", dsc: "Le verre de ceux qui savent ce qu'ils veulent : court, sec, très boisé." },
  { id: "pasperdus", sp: "whisky", n: "Pas Perdus", g: "coupe", col: "#e8b64e", abv: 16, f: 3, pf: [2, 4, 1, 3], t: "Scotch, miel-gingembre, citron.", ing: [[5, "scotch blended"], [2, "sirop miel-gingembre"], [2.5, "jus de citron jaune"]], gar: "gingembre confit", dsc: "Un whisky sour tout en rondeur, relevé d'une pointe de gingembre frais." },
  { id: "cigare", sp: "whisky", n: "Cigare Doux", g: "rocks", col: "#6b3a1c", abv: 27, f: 4, pf: [2, 1, 3, 5], t: "Whisky fumé, noix, sirop d'érable.", ing: [[5, "whisky tourbé"], [2, "liqueur de noix"], [1, "sirop d'érable"]], gar: "noix caramélisée", dsc: "Fumée, noix et érable : le digestif qui se prend en parlant bas." },
  { id: "soleil", sp: "tequila", n: "Soleil Couchant", g: "highball", col: "#ff8c7a", abv: 11, f: 2, pf: [2, 4, 2, 3], t: "Tequila, pamplemousse rose, sel fumé.", ing: [[4.5, "tequila blanco"], [6, "jus de pamplemousse rose"], [1, "sirop d'agave"], [null, "1 pincée de sel fumé"]], gar: "quartier de pamplemousse", dsc: "Long, frais et légèrement salé : parfait pour commencer la soirée." },
  { id: "verte", sp: "tequila", n: "Verte Nuit", g: "coupe", col: "#8fd48a", abv: 17, f: 3, pf: [4, 4, 1, 1], t: "Tequila, piment doux, concombre, citron vert.", ing: [[5, "tequila blanco"], [2.5, "jus de citron vert"], [1.5, "sirop d'agave"], [null, "3 tranches de concombre et 1 rondelle de piment doux"]], gar: "rondelle de piment", dsc: "Végétal et vif, avec une chaleur douce en fin de bouche." },
  { id: "agave", sp: "tequila", n: "Agave Doré", g: "rocks", col: "#e0a136", abv: 25, f: 4, pf: [3, 2, 2, 4], t: "Tequila reposado, orange, miel, safran.", ing: [[5, "tequila reposado"], [1.5, "liqueur d'orange"], [1, "miel safrané"], [null, "2 traits de bitter à l'orange"]], gar: "pétale de safran", dsc: "Une tequila vieillie en fût, rehaussée de miel au safran : chaleureuse et ronde." },
  { id: "belle", sp: "zero", n: "Belle Époque 0°", g: "flute", col: "#f1e6a8", abv: 0, f: 1, pf: [4, 3, 1, 2], t: "Verjus, raisin blanc, tonic, romarin.", ing: [[4, "verjus blanc"], [4, "jus de raisin blanc"], [8, "tonic léger"], [null, "1 brin de romarin"]], gar: "brin de romarin", dsc: "Un faux brut pétillant, sec et floral, servi dans une flûte glacée." },
  { id: "jardin", sp: "zero", n: "Jardin d'Hiver", g: "rocks", col: "#d9b36a", abv: 0, f: 1, pf: [2, 2, 2, 4], t: "Thé infusé, poire, gingembre.", ing: [[6, "thé noir infusé à froid"], [4, "jus de poire"], [1.5, "sirop de gingembre"], [null, "quelques gouttes de citron"]], gar: "lamelle de poire", dsc: "Doux et épicé, dans un verre à whisky : on ne remarque pas qu'il n'y a pas d'alcool." },
  { id: "perle", sp: "zero", n: "Perle Noire", g: "highball", col: "#5b2a5e", abv: 0, f: 1, pf: [3, 4, 2, 3], t: "Cassis, citron, tonic.", ing: [[4, "crème de cassis sans alcool"], [2, "jus de citron jaune"], [10, "tonic"], [null, "glace pilée"]], gar: "baies de cassis", dsc: "Profond et pétillant, très acidulé : la couleur d'une nuit sans lune." },
];
const dots = (n, cls = "") => `<span class="sp-force ${cls}" role="img" aria-label="Force ${n} sur 5">${[1, 2, 3, 4, 5].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;
const METERS = ["Sec", "Acidulé", "Amer", "Gourmand"];
const meters = (pf) => `<dl class="sp-met">${pf.map((v, i) => `<div><dt>${METERS[i]}</dt><dd role="img" aria-label="${v} sur 5">${[1, 2, 3, 4, 5].map((j) => `<i${j <= v ? ' class="on"' : ""}></i>`).join("")}</dd></div>`).join("")}</dl>`;
const qty = (q, t) => (q == null ? esc(t) : `${String(q).replace(".", ",")} cl · ${esc(t)}`);
const forceTxt = (c) => c.abv ? `${c.f} sur 5 · environ ${c.abv} % vol.` : "0 % vol.";
const fiche = (c) => `<div class="sp-fi"><div class="sp-fi-art">${glass(c.g, c.col)}</div>
  <p class="sp-kick sp-kick--s">${SP.find((s) => s.k === c.sp).n}</p><h3 class="sp-fi-h">${esc(c.n)}</h3><p class="sp-fi-d">${esc(c.dsc)}</p>
  <h4 class="sp-fi-s">Ingrédients</h4><ul class="sp-fi-ing">${c.ing.map(([q, t]) => `<li>${qty(q, t)}</li>`).join("")}</ul>
  <dl class="sp-fi-spec"><div><dt>Verre</dt><dd>${{ coupe: "Coupe", martini: "Verre à martini", rocks: "Verre à whisky", highball: "Grand verre", flute: "Flûte" }[c.g]}</dd></div><div><dt>Force</dt><dd>${forceTxt(c)}</dd></div><div><dt>Garniture</dt><dd>${esc(c.gar)}</dd></div></dl>
  <h4 class="sp-fi-s">Profil</h4>${meters(c.pf)}
  <div class="sp-fi-act"><a class="sp-btn sp-btn--s" href="#ajouter" data-fav="${esc(c.n)}">Noter pour ma soirée</a>${c.sig ? `<a class="sp-more" href="/cocktail">Recette complète ${arrow}</a>` : ""}</div></div>`;
const row = (c, i) => `<article class="sp-row" data-id="${c.id}"><a class="sp-row-a" href="#fiche-${c.id}" data-open="${c.id}" aria-expanded="false"><span class="sp-row-n">${R[i]}</span><span class="sp-row-b">${esc(c.n)}</span><span class="sp-lead" aria-hidden="true"></span>${dots(c.f)}<span class="sp-row-d">${esc(c.t)}</span></a><div class="sp-fiche" data-f="${c.id}">${fiche(c)}</div></article>`;

// ---------- Morceaux de page ----------
const links = (menu, n = true) => menu.map((m, i) => `<a class="sp-nl" href="${esc(m.url)}">${n ? `<i class="sp-nl-n">${R[i]}</i>` : ""}<span>${esc(m.label)}</span></a>`).join("");
const header = (c) => `<header class="sp-head pk-bleed"><div class="sp-rail">
  <a class="sp-mono" href="/" aria-label="${esc(c.brand)} — accueil"><span class="sp-mono-ic">${fan(5, true)}</span><span class="sp-mono-t">Speakeasy<small>Bar à cocktails</small></span></a>
  <div class="sp-nav" role="navigation" aria-label="Navigation principale">${links(c.menu)}</div>
  <a class="sp-rail-cta" href="/contact"><span>Réserver</span></a>
  <details class="sp-burger"><summary aria-label="Ouvrir le menu"><span class="sp-bl"><i></i><i></i><i></i></span><span class="sp-bt">Menu</span></summary>
    <div class="sp-drawer" role="navigation" aria-label="Menu mobile">${links(c.menu)}<a class="sp-btn sp-btn--block" href="/contact">Réserver une table</a></div></details></div></header>`;

const footer = (c) => `<footer class="sp-foot pk-bleed"><div class="sp-frise" aria-hidden="true"></div><div class="sp-wrap sp-foot-in">
  <div class="sp-foot-brand"><span class="sp-foot-fan" aria-hidden="true">${fan(7, true)}</span><div class="sp-foot-logo">Speakeasy</div><p>Un bar à cocktails feutré, derrière une porte verte. On y parle bas et on y reste tard.</p><address>12 passage des Lampes, 69002 (adresse fictive)</address></div>
  <div><p class="sp-foot-h">Le bar</p><div class="sp-fl-col">${c.menu.slice(1).map((m) => `<a class="sp-fl" href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div>
  <div><p class="sp-foot-h">Ce soir</p><div class="sp-fl-col"><a class="sp-fl" href="/cocktail">Cocktail signature</a><a class="sp-fl" href="/recherche">Recherche</a><a class="sp-fl" href="/contact">Réserver une table</a></div><p class="sp-fine">Mardi au jeudi 18 h – 1 h<br>Vendredi et samedi 18 h – 3 h<br>Dimanche 17 h – minuit</p></div></div>
  <p class="sp-legal">© Speakeasy — site de démonstration. Lieux, horaires, cocktails et personnages fictifs ; aucune réservation n'est enregistrée ici. L'abus d'alcool est dangereux pour la santé, à consommer avec modération.</p></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="sp-ph pk-bleed"><div class="sp-lamp" aria-hidden="true"></div><div class="sp-wrap sp-ph-in"><span class="sp-ph-fan" aria-hidden="true">${fan(7, true)}</span><p class="sp-kick" data-reveal>${kicker}</p><div class="sp-title" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="sp-ph-sub" data-reveal>${sub}</p>` : ""}<div class="sp-frise sp-frise--c" aria-hidden="true"></div></div></section>`);
const h2 = (kick, t, extra = "") => `<div class="sp-sh"><p class="sp-kick" data-reveal>${kick}</p><h2 class="sp-h2" data-reveal>${t}</h2>${extra}</div>`;

// Demande de table (sans enregistrement : récapitulatif → /contact)
const reserve = () => `<section class="sp-sec sp-sec--pan pk-bleed" data-res><div class="sp-wrap sp-res">
  <div class="sp-res-copy">${h2("Une table pour ce soir", "Dites-nous<br>quand, on vous<br>garde une place.")}<p class="sp-lead-p" data-reveal>Composez votre soirée : le récapitulatif se prépare tout seul. Il suffit ensuite de l'envoyer par le formulaire de contact — nous confirmons par message.</p></div>
  <div class="sp-res-card" data-reveal><div class="sp-step"><p class="sp-step-h"><b>I</b> Quel soir ?</p><div class="sp-chips" role="radiogroup" aria-label="Soir" data-dates></div><p class="sp-fine sp-nojs">Indiquez la date de votre choix dans le formulaire de contact.</p></div>
    <div class="sp-step"><p class="sp-step-h"><b>II</b> Combien de convives ?</p><div class="sp-stepper"><a href="#moins" data-p="-1" aria-label="Un convive de moins">−</a><b data-pn>2</b><a href="#plus" data-p="1" aria-label="Un convive de plus">+</a><span class="sp-fine" data-pl>personnes</span></div></div>
    <div class="sp-step"><p class="sp-step-h"><b>III</b> À quelle heure ?</p><div class="sp-chips" role="radiogroup" aria-label="Heure" data-times>${["18 h 30", "20 h", "21 h 30", "23 h"].map((t, i) => `<a class="sp-chip${i === 1 ? " is-on" : ""}" href="#heure" role="radio" aria-checked="${i === 1}" data-t="${t}">${t}</a>`).join("")}</div></div>
    <div class="sp-step"><p class="sp-step-h"><b>IV</b> Où s'installer ?</p><div class="sp-chips" role="radiogroup" aria-label="Place" data-places>${["Au comptoir", "Au salon vert", "Dans une alcôve"].map((t, i) => `<a class="sp-chip${i === 1 ? " is-on" : ""}" href="#place" role="radio" aria-checked="${i === 1}" data-pl="${t}">${t}</a>`).join("")}</div></div>
    <div class="sp-ticket" aria-live="polite"><p class="sp-ticket-k">Votre demande</p><p class="sp-ticket-t" data-rs>Choisissez un soir pour composer votre demande.</p></div>
    <div class="sp-actions"><a class="sp-btn" href="/contact" data-rsend>Envoyer ma demande ${arrow}</a><a class="sp-btn sp-btn--ghost" href="#copier" data-rcopy>Copier le récapitulatif</a></div>
    <p class="sp-fine">Demande de démonstration : rien n'est réservé tant que nous n'avons pas répondu à votre message.</p></div></div></section>`;

const HOURS = [["Lundi", 1, null], ["Mardi", 2, [18, 25]], ["Mercredi", 3, [18, 25]], ["Jeudi", 4, [18, 25]], ["Vendredi", 5, [18, 27]], ["Samedi", 6, [18, 27]], ["Dimanche", 0, [17, 24]]];
const hh = (n) => `${n % 24} h`;
const hoursTable = () => `<table class="sp-table" data-hours><caption class="sp-sr">Horaires d'ouverture du bar</caption><thead><tr><th scope="col">Jour</th><th scope="col">Ouverture</th><th scope="col">Dernier verre</th><th scope="col">Cuisine</th></tr></thead><tbody>${HOURS.map(([d, w, h]) => `<tr data-dow="${w}"${h ? ` data-s="${h[0]}" data-e="${h[1]}"` : ""}><th scope="row" data-label="Jour">${d}</th><td data-label="Ouverture">${h ? hh(h[0]) : "Fermé"}</td><td data-label="Dernier verre">${h ? hh(h[1] - 0.5 | 0) + (h[1] % 1 ? "" : " 30") : "—"}</td><td data-label="Cuisine">${h ? (h[1] > 25 ? "jusqu'à 1 h" : "jusqu'à minuit") : "—"}</td></tr>`).join("")}</tbody></table>`;

// ---------- Pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="sp-hero pk-bleed"><div class="sp-lamp" aria-hidden="true"></div><span class="sp-corner sp-corner--a" aria-hidden="true"></span><span class="sp-corner sp-corner--b" aria-hidden="true"></span>
    <div class="sp-hero-fan" aria-hidden="true">${fan(19)}</div>
    <div class="sp-wrap sp-hero-in"><p class="sp-kick" data-reveal>Bar à cocktails · derrière la porte verte</p>
      <div class="sp-title sp-title--xl" role="heading" aria-level="1" data-reveal>Chut…<br>la nuit commence ici.</div>
      <p class="sp-lead-p sp-lead-p--c" data-reveal>Cocktails d'auteur, lumière de laiton et jazz à voix basse. Un salon caché dans l'esprit des années vingt, où l'on prend le temps d'un seul bon verre.</p>
      <div class="sp-actions sp-actions--c" data-reveal><a class="sp-btn" href="/carte">Découvrir la carte ${arrow}</a><a class="sp-btn sp-btn--ghost" href="#reserver">Réserver une table</a></div></div>
    <div class="sp-wrap sp-hero-bar"><div class="sp-status" data-open-box data-reveal><span class="sp-dot" aria-hidden="true"></span><b data-open-t>Ouvert du mardi au dimanche, dès 18 h</b></div><p class="sp-hero-note" data-reveal>Mot de passe ce soir : <em>« Émeraude »</em></p></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap sp-intro"><div class="sp-intro-art" data-reveal>${wall()}</div><div>${h2("L'esprit de la maison", "Un verre, une<br>histoire, une porte<br>qui se referme.")}
    <p class="sp-lead-p" data-reveal>Speakeasy est né d'une idée simple : un bar où l'on ne crie pas pour se faire entendre. Trois salons, une carte courte et des barmans qui connaissent leurs bouteilles par leur prénom.</p>
    <ul class="sp-facts"><li data-reveal><b data-count="1925">1925</b><span>année d'ouverture</span></li><li data-reveal><b data-count="3">3</b><span>salons feutrés</span></li><li data-reveal><b data-count="15">15</b><span>cocktails à la carte</span></li><li data-reveal><b data-count="0">0</b><span>écran allumé</span></li></ul>
    <a class="sp-more" href="/salon" data-reveal>Entrer dans le salon ${arrow}</a></div></div></section>`),
  sec(`<section class="sp-sec sp-sec--ink pk-bleed"><div class="sp-wrap">${h2("Trois verres de la maison", "À la carte ce soir")}
    <div class="sp-carte">${["chevron", "emeraude", "havane"].map((id, i) => { const c = CK.find((x) => x.id === id); return `<article class="sp-cd" data-reveal><div class="sp-cd-art">${glass(c.g, c.col)}</div><div class="sp-cd-b"><p class="sp-kick sp-kick--s">${R[i]} · ${SP.find((s) => s.k === c.sp).n}</p><h3 class="sp-cd-h">${esc(c.n)}</h3><p>${esc(c.t)}</p>${dots(c.f)}</div></article>`; }).join("")}</div>
    <div class="sp-actions"><a class="sp-btn" href="/carte" data-reveal>Toute la carte ${arrow}</a><a class="sp-btn sp-btn--ghost" href="/cocktail" data-reveal>Le cocktail signature</a></div></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${h2("Les règles du salon", "Trois règles,<br>pas une de plus.")}
    <ol class="sp-rules">${[["On parle bas", "Ici, la musique ne couvre jamais la conversation. Le plus fort, c'est le bruit des glaçons."], ["Le téléphone dort", "Une photo du verre, très bien. Un appel, dehors. Le salon est fait pour être regardé en face."], ["On prend son temps", "Pas de carte à rallonge : quinze verres, bien faits. Le dernier est toujours offert à celui qui reste."]].map(([t, p], i) => `<li data-reveal><span class="sp-rule-n" aria-hidden="true">${R[i]}</span><h3>${t}</h3><p>${p}</p></li>`).join("")}</ol></div></section>`),
  sec(reserve()),
  sec(`<section class="sp-sec sp-sec--ink pk-bleed"><div class="sp-wrap sp-evt"><div>${h2("Soirées privées", "Le bar entier<br>rien que pour vous.")}<p class="sp-lead-p" data-reveal>Anniversaire, lancement, dîner d'entreprise : privatisez une alcôve, le salon vert ou tout le bar, avec cocktails sur mesure et service à la table.</p><a class="sp-btn" href="/evenements" data-reveal>Préparer ma soirée ${arrow}</a></div>
    <ul class="sp-evt-list"><li data-reveal><b>De 8 à 90 invités</b><span>Trois espaces, du plus intime au bar complet</span></li><li data-reveal><b>Cocktail maison</b><span>Un verre créé pour votre soirée</span></li><li data-reveal><b>Équipe dédiée</b><span>Barmans et maître de salle jusqu'à la fermeture</span></li></ul></div></section>`),
  sec(footer(c)),
];

const carte = (c) => [
  sec(header(c)),
  pagehead("La carte", "Cinq esprits,<br>quinze verres", "Choisissez un spiritueux : la carte se resserre autour de lui. Touchez un cocktail pour ouvrir sa fiche."),
  sec(`<section class="sp-sec sp-sec--tight pk-bleed"><div class="sp-wrap"><div class="sp-spirits" role="tablist" aria-label="Spiritueux">${SP.map((s, i) => `<a class="sp-sp${i === 0 ? " is-on" : ""}" href="#${s.k}" role="tab" aria-selected="${i === 0}" data-sp="${s.k}">${bottle(s.k)}<span class="sp-sp-n">${s.n}</span><span class="sp-sp-c">${CK.filter((x) => x.sp === s.k).length} verres</span></a>`).join("")}</div></div></section>`),
  ...SP.map((s, k) => sec(`<section class="sp-part sp-sec--tight pk-bleed${k === 0 ? " is-on" : ""}" data-part="${s.k}"><div class="sp-wrap"><div class="sp-menu-grid"><div class="sp-groups" role="tabpanel" aria-label="Cocktails ${s.n.toLowerCase()}"><p class="sp-grp-d">${s.d}</p>${CK.filter((x) => x.sp === s.k).map((x, i) => row(x, i)).join("")}<p class="sp-fine">Force : un point pour un verre léger, cinq pour un verre très alcoolisé. À consommer avec modération.</p></div>
    <aside class="sp-panel" data-panel aria-label="Fiche du cocktail" aria-live="polite"><a class="sp-panel-x" href="#fermer" aria-label="Fermer la fiche">Fermer ✕</a><div class="sp-panel-in" data-panel-in><div class="sp-panel-empty"><span aria-hidden="true">${glass("coupe", "#58c79a")}</span><p>Touchez un cocktail pour lire sa fiche : ingrédients, verre, force et profil.</p></div></div></aside></div></div></section>`)),
  sec(`<section class="sp-sec sp-sec--ink pk-bleed"><div class="sp-wrap">${h2("Pour accompagner", "Petites assiettes")}
    <ul class="sp-bites">${[["Noix de cajou grillées au paprika", "Grillées minute, sel fumé"], ["Olives et amandes marcona", "Marinées au romarin"], ["Toasts d'anchois et beurre doux", "Pain de seigle, citron"], ["Planche de fromages affinés", "Trois fromages, confiture de figues"], ["Croque-monsieur minuscule", "Jambon blanc, comté, béchamel"], ["Chocolat noir et sel de mer", "Pour finir sur une note douce"]].map(([n, d]) => `<li data-reveal><b>${n}</b><span class="sp-lead" aria-hidden="true"></span><i>${d}</i></li>`).join("")}</ul></div></section>`),
  sec(reserve()),
  sec(footer(c)),
];

const sig = CK.find((x) => x.sig);
const cocktail = (c) => [
  sec(header(c)),
  sec(`<section class="sp-sig pk-bleed"><div class="sp-lamp" aria-hidden="true"></div><div class="sp-wrap sp-sig-in"><div class="sp-sig-art" data-reveal><span class="sp-bub sp-bub--a" aria-hidden="true"></span><span class="sp-bub sp-bub--b" aria-hidden="true"></span><span class="sp-bub sp-bub--c" aria-hidden="true"></span>${glass(sig.g, sig.col, "sp-glass--xl")}</div>
    <div><p class="sp-kick" data-reveal>Cocktail signature · gin</p><div class="sp-title" role="heading" aria-level="1" data-reveal>Émeraude<br>1925</div><p class="sp-lead-p" data-reveal>${esc(sig.dsc.replace(" Fiche complète sur sa page.", ""))} Une histoire de speakeasy, d'herbes de montagne et de citron pressé à la minute.</p>
      <dl class="sp-fi-spec sp-fi-spec--row" data-reveal><div><dt>Verre</dt><dd>Coupe glacée</dd></div><div><dt>Force</dt><dd>3 sur 5 · ≈ 20 % vol.</dd></div><div><dt>Garniture</dt><dd>Feuille de basilic</dd></div><div><dt>Préparation</dt><dd>Environ 3 minutes</dd></div></dl>
      <div class="sp-actions" data-reveal><a class="sp-btn" href="/contact">Réserver une table ${arrow}</a><a class="sp-btn sp-btn--ghost" href="/carte">Retour à la carte</a></div></div></div></section>`),
  sec(`<section class="sp-sec pk-bleed" data-scale><div class="sp-wrap sp-rec"><div>${h2("La recette", "Pour combien<br>de verres ?")}
    <div class="sp-stepper" data-reveal><a href="#moins" data-n="-1" aria-label="Un verre de moins">−</a><b data-sn>1</b><a href="#plus" data-n="1" aria-label="Un verre de plus">+</a><span class="sp-fine" data-sl>verre</span></div>
    <table class="sp-table sp-table--rec" data-reveal><caption class="sp-sr">Ingrédients de l'Émeraude 1925</caption><thead><tr><th scope="col">Ingrédient</th><th scope="col">Quantité</th></tr></thead><tbody>${sig.ing.map(([q, t]) => `<tr><th scope="row" data-label="Ingrédient">${esc(t)}</th><td data-label="Quantité">${q == null ? "selon recette" : `<span><span data-q="${q}">${String(q).replace(".", ",")}</span> cl</span>`}</td></tr>`).join("")}</tbody></table></div>
    <ol class="sp-steps">${[["Refroidir", "Mettez la coupe au congélateur dix minutes avant le service."], ["Secouer à sec", "Versez tous les ingrédients dans un shaker, sans glace, et secouez dix secondes pour monter le blanc."], ["Secouer à froid", "Ajoutez de la glace et secouez vivement quinze secondes."], ["Filtrer et servir", "Filtrez deux fois dans la coupe glacée et posez la feuille de basilic."]].map(([t, p], i) => `<li data-reveal><span class="sp-st-n">${R[i]}</span><div><h3>${t}</h3><p>${p}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="sp-sec sp-sec--ink pk-bleed"><div class="sp-wrap sp-prof"><div>${h2("Le profil", "Ce que l'on<br>y trouve")}${meters(sig.pf)}</div>
    <div class="sp-pair" data-reveal><h3 class="sp-fi-s">À partager avec</h3><ul class="sp-fi-ing"><li>Toasts d'anchois et beurre doux</li><li>Olives et amandes marcona</li><li>Planche de fromages affinés</li></ul><p class="sp-fine">Le verre se boit frais, dans les dix minutes : la mousse du blanc d'œuf ne tient pas la soirée.</p></div></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${h2("Du même salon", "Les voisins de carte")}<div class="sp-carte">${["chevron", "fumee", "verte"].map((id, i) => { const c2 = CK.find((x) => x.id === id); return `<article class="sp-cd" data-reveal><div class="sp-cd-art">${glass(c2.g, c2.col)}</div><div class="sp-cd-b"><p class="sp-kick sp-kick--s">${R[i]} · ${SP.find((s) => s.k === c2.sp).n}</p><h3 class="sp-cd-h">${esc(c2.n)}</h3><p>${esc(c2.t)}</p>${dots(c2.f)}</div></article>`; }).join("")}</div><a class="sp-more" href="/carte" data-reveal>Voir toute la carte ${arrow}</a></div></section>`),
  sec(footer(c)),
];

const TL = [["1925", "La porte verte", "Un ancien magasin de cannes devient, derrière un rideau, le premier salon : trois tables, un comptoir et un mot de passe."], ["1933", "La lumière revient", "Le bar sort de l'ombre mais garde ses habitudes : lampes de laiton, cartes manuscrites, conversation à voix basse."], ["1962", "L'arrière-salle", "On creuse l'alcôve du fond pour les amoureux et les affaires discrètes. Elle porte encore le nom de la première cliente."], ["1998", "Les cocktails d'auteur", "Une nouvelle équipe remplace les verres de comptoir par des recettes écrites à la main, une par esprit."], ["Aujourd'hui", "Même porte, mêmes règles", "Le salon est restauré à l'identique, le mot de passe change chaque soir. La carte, elle, ne compte toujours que quinze verres."]];
const salon = (c) => [
  sec(header(c)),
  pagehead("Histoire et salons", "Un siècle<br>de nuits", "Trois salons, une porte discrète et cent ans d'habitudes à garder."),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${h2("Chronique", "De la porte verte<br>à aujourd'hui")}<ol class="sp-tl">${TL.map(([y, t, p], i) => `<li class="sp-tl-i" data-reveal><span class="sp-tl-y">${y}</span><div class="sp-tl-b"><h3>${t}</h3><p>${p}</p></div></li>`).join("")}</ol><p class="sp-fine">Histoire imaginée pour cette démonstration.</p></div></section>`),
  sec(`<section class="sp-sec sp-sec--ink pk-bleed"><div class="sp-wrap">${h2("Les trois salons", "Où s'asseoir ?")}<div class="sp-rooms">${[["fumoir", "Le Fumoir", "Fauteuils profonds, lampes basses et whiskies bruns. Le salon des conversations lentes.", "Jusqu'à 14 places"], ["salon", "Le Salon vert", "Rideaux d'émeraude, banquettes et grandes tables. Là où la soirée s'installe.", "Jusqu'à 38 places"], ["arriere", "L'Arrière-salle", "Une table ronde, une seule lampe. On y réserve pour être seul à plusieurs.", "Jusqu'à 8 places"]].map(([k, t, p, cap], i) => `<article class="sp-rm" data-reveal>${room(k)}<p class="sp-kick sp-kick--s">${R[i]}</p><h3>${t}</h3><p>${p}</p><p class="sp-cap">${cap}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap sp-hrs"><div>${h2("Horaires", "Quand pousser<br>la porte")}<div class="sp-status sp-status--l" data-open-box data-reveal><span class="sp-dot" aria-hidden="true"></span><b data-open-t>Ouvert du mardi au dimanche, dès 18 h</b></div><p class="sp-fine">Horaires de démonstration. Le lundi, la porte reste close.</p></div><div data-reveal>${hoursTable()}</div></div></section>`),
  sec(`<section class="sp-sec sp-sec--ink pk-bleed"><div class="sp-wrap">${h2("Savoir-vivre", "Avant d'entrer")}<dl class="sp-codes">${[["Tenue", "Élégante mais détendue. Le noir, le vert et les cravates mal nouées sont les bienvenus."], ["Réservation", "Conseillée le week-end ; nous gardons toujours quelques places au comptoir."], ["Groupes", "Au-delà de huit personnes, le salon vert ou une privatisation sont plus confortables."], ["Sans alcool", "Trois cocktails à zéro degré, préparés avec le même soin que les autres."]].map(([t, p]) => `<div data-reveal><dt>${t}</dt><dd>${p}</dd></div>`).join("")}</dl></div></section>`),
  sec(footer(c)),
];

const ROOMS = [["L'Alcôve", 8, 14, 12], ["Le Salon vert", 15, 40, 38], ["Le Bar entier", 41, 90, 90]];
const evenements = (c) => [
  sec(header(c)),
  pagehead("Soirées privées", "Le bar à<br>votre nom", "Anniversaire, lancement ou dîner d'équipe : trois espaces, des cocktails sur mesure et un service jusqu'à la fermeture."),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${h2("Trois formats", "Du plus intime<br>au bar complet")}<div class="sp-arches">${[["alcove", "L'Alcôve", "8 à 14 invités", "Une table ronde et un cocktail créé pour vous. Idéale pour un anniversaire secret.", 1], ["salon", "Le Salon vert", "15 à 40 invités", "Banquettes, rideaux d'émeraude et service à la table. Notre formule la plus demandée.", 2], ["bar", "Le Bar entier", "41 à 90 invités", "Les trois salons et le comptoir, musique live et carte sur mesure.", 3]].map(([k, t, n, p, h], i) => `<article class="sp-ar sp-ar--${h}" data-reveal><div class="sp-ar-top">${fan(5, true)}</div><p class="sp-kick sp-kick--s">${R[i]}</p><h3>${t}</h3><p class="sp-ar-n">${n}</p><p>${p}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="sp-sec sp-sec--pan pk-bleed" data-cap><div class="sp-wrap sp-capwrap"><div>${h2("Trouvez votre espace", "Combien serez-vous ?")}<p class="sp-lead-p" data-reveal>Indiquez le nombre d'invités : nous vous suggérons l'espace le plus juste et préparons le résumé à nous envoyer.</p></div>
    <div class="sp-res-card" data-reveal><div class="sp-stepper"><a href="#moins" data-c="-5" aria-label="Cinq invités de moins">−</a><b data-cn>20</b><a href="#plus" data-c="5" aria-label="Cinq invités de plus">+</a><span class="sp-fine">invités</span></div>
      <div class="sp-ticket" aria-live="polite"><p class="sp-ticket-k">Espace conseillé</p><p class="sp-ticket-t" data-cr>Le Salon vert.</p></div><a class="sp-btn" href="/contact" data-csend>Demander un devis ${arrow}</a><a class="sp-btn sp-btn--ghost" href="#copier" data-ccopy>Copier le résumé</a><p class="sp-fine">Suggestion de démonstration, sans engagement.</p></div></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap">${h2("En un coup d'œil", "Les capacités")}<table class="sp-table" data-reveal><caption class="sp-sr">Capacité des espaces</caption><thead><tr><th scope="col">Espace</th><th scope="col">Debout</th><th scope="col">Assis</th><th scope="col">Idéal pour</th></tr></thead><tbody>${[["L'Alcôve", "14", "10", "Dîner d'amis, anniversaire"], ["Le Salon vert", "40", "28", "Lancement, fête, repas d'équipe"], ["Le Bar entier", "90", "60", "Réception, soirée d'entreprise"]].map(([a, b, d, e]) => `<tr><th scope="row" data-label="Espace">${a}</th><td data-label="Debout">${b}</td><td data-label="Assis">${d}</td><td data-label="Idéal pour">${e}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="sp-sec sp-sec--ink pk-bleed"><div class="sp-wrap">${h2("Du premier message au dernier verre", "Comment ça se passe")}<ol class="sp-flow">${[["Vous écrivez", "Date, nombre d'invités, ambiance souhaitée."], ["On propose", "Un espace, un menu de cocktails et un devis sous deux jours."], ["On met au point", "Le cocktail maison, la musique, les horaires."], ["On ouvre la porte", "Accueil, service à la table et dernier verre offert."]].map(([t, p], i) => `<li data-reveal><span class="sp-st-n">${R[i]}</span><h3>${t}</h3><p>${p}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="sp-sec pk-bleed"><div class="sp-wrap sp-faq">${h2("Questions", "Avant de décider")}<div>
    <details data-reveal><summary>Peut-on apporter un gâteau ?</summary><p>Oui, nous le gardons au frais et le servons à l'heure que vous choisissez, avec des couverts de service.</p></details>
    <details data-reveal><summary>Pouvez-vous créer un cocktail pour l'occasion ?</summary><p>C'est même notre spécialité : nous composons un verre autour de vos goûts, avec ou sans alcool.</p></details>
    <details data-reveal><summary>Y a-t-il de la musique ?</summary><p>Une sélection de jazz et de swing en fond ; un trio live est possible pour le Bar entier.</p></details>
    <details data-reveal><summary>Jusqu'à quelle heure ?</summary><p>La fermeture est à 1 h en semaine et 3 h le week-end ; une prolongation se discute à la demande.</p></details></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Pousser la porte", "Écrivez-nous", "Une table, une soirée privée, une question : nous répondons sous deux jours ouvrés."),
  sec(`<section class="sp-recap pk-bleed" data-recap><div class="sp-wrap"><div class="sp-ticket"><p class="sp-ticket-k">Votre récapitulatif</p><p class="sp-ticket-t" data-recap-t></p><a class="sp-btn sp-btn--ghost sp-btn--s" href="#copier" data-recap-copy>Copier le texte</a><p class="sp-fine">Collez-le dans le message du formulaire ci-dessous.</p></div></div></section>`),
  { type: "form", heading: "Envoyer un message", intro: "Pour une table ou une soirée privée, collez votre récapitulatif dans le message." },
  sec(`<section class="sp-sec sp-sec--tight pk-bleed"><div class="sp-wrap sp-cards3"><article class="sp-note" data-reveal><h3>Le bar</h3><address>12 passage des Lampes<br>69002 (adresse fictive)</address><p>La porte verte, après le passage couvert. Sonnez deux fois.</p></article><article class="sp-note" data-reveal><h3>Soirées privées</h3><p>Précisez la date, le nombre d'invités et l'ambiance souhaitée.</p><a class="sp-more" href="/evenements">Voir les formats ${arrow}</a></article><article class="sp-note" data-reveal><h3>Ouverture</h3><p>Mardi au jeudi 18 h – 1 h, vendredi et samedi 18 h – 3 h, dimanche 17 h – minuit.</p><a class="sp-more" href="/salon">Les horaires ${arrow}</a></article></div></section>`),
  sec(footer(c)),
];

const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Un nom à glisser<br>à l'oreille ?", "Un cocktail, un spiritueux, un salon : cherchez sur tout le site."), { type: "layout", children: [{ type: "search", props: { placeholder: "Gin, Émeraude, salon vert, horaires…" } }] }, sec(footer(c))];

const introuvable = (c) => [sec(header(c)), sec(`<section class="sp-404 pk-bleed"><div class="sp-lamp" aria-hidden="true"></div><div class="sp-wrap sp-404-in"><div class="sp-404-art" aria-hidden="true">${door}</div><div><p class="sp-kick">Porte close</p><div class="sp-title" role="heading" aria-level="1">Erreur 404</div><p class="sp-lead-p">Cette porte reste fermée : la page n'existe pas ou a changé d'adresse. Le mot de passe de ce soir ne vous ouvrira rien ici.</p><div class="sp-actions"><a class="sp-btn" href="/">Retour à l'accueil ${arrow}</a><a class="sp-btn sp-btn--ghost" href="/carte">Voir la carte</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "speakeasy", name: "Speakeasy", version: "2.0.0", category: "gastronomie", tags: ["sombre", "luxe", "classique", "geometrique"], siteType: "Bar à cocktails", featured: true,
  concept: "Un salon clandestin art déco vert-bleu et laiton : un éventail doré qui scintille, un porte-menu vertical, une carte à filets où chaque spiritueux ouvre ses cocktails et leurs fiches.",
  description: "Bar à cocktails art déco, vert pétrole très sombre et dorures de laiton : éventail animé, porte-menu vertical, carte à filets filtrée par spiritueux avec fiches détaillées, recette à l'échelle et demande de table envoyée par message.",
  brand: "Speakeasy Bar à cocktails", modules: ["formulaires", "recherche"],
  dna: { header: "porte-menu-vertical-dore-colle-a-gauche", hero: "eventail-deco-dore-qui-scintille-sur-lumiere-tamisee", grid: "carte-a-filets-pointilles-et-fiche-laterale", motion: "eventail-qui-scintille-balayage-de-lumiere-et-lampe-qui-suit-le-curseur", shapes: "eventails-chevrons-arches-etagees-et-doubles-filets-laiton", rhythm: "panneaux-emeraude-separes-par-frises-de-chevrons-et-chiffres-romains", signature: "carte-des-cocktails-par-spiritueux-fiche-recette-a-l-echelle-et-demande-de-table" },
  tokens: {
    colors: { primary: "#d2ac5a", secondary: "#0b3330", accent: "#58c79a", background: "#05201f", surface: "#0b3330", text: "#f2e9d3", muted: "#a8bfb4", success: "#58c79a", warning: "#e8b64e", error: "#ff8c7a" },
    fonts: { heading: "font.limelight", body: "font.josefin-sans", button: "font.josefin-sans", link: "font.josefin-sans" },
    radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "0 0 0 6px #05201f,0 0 0 7px rgba(210,172,90,.38)", button: "none" }, border: { width: 1, color: "#d2ac5a" },
    type: { h1: { size: 88, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 48, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Dorure (laiton)", type: "color", default: "#d2ac5a" },
    { key: "tone", label: "Teinte du fond", type: "choice", default: "emeraude", choices: [["emeraude", "Vert émeraude"], ["petrole", "Bleu pétrole"], ["bouteille", "Vert bouteille"]] },
    { key: "fan", label: "Éventail du hero", type: "choice", default: "on", choices: [["on", "Scintillant"], ["off", "Fixe"]] },
    { key: "lamp", label: "Lampe tamisée", type: "choice", default: "on", choices: [["on", "Allumée"], ["off", "Éteinte"]] },
    { key: "frise", label: "Frises de chevrons", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masquées"]] },
  ],
  menu: [["Accueil", "/"], ["Carte", "/carte"], ["Salon", "/salon"], ["Événements", "/evenements"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "carte", name: "La carte", render: carte }, { key: "cocktail", name: "Cocktail signature", render: cocktail },
    { key: "salon", name: "Histoire et salons", render: salon }, { key: "evenements", name: "Soirées privées", render: evenements }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
