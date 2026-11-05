// Chrome — concession automobile premium (marques et modèles fictifs). Direction artistique : salle d'exposition de nuit. Gris carbone, argent, un seul accent bleu glace ;
// véhicules dessinés en SVG en très grand, éclairés par un reflet qui suit la souris, mega-menu par gamme, configurateur et comparateur en colonnes.
const { sec, esc, nav } = require("../kit");

/* ------------------------------------------------------------------ véhicules (SVG) */
// Chaque silhouette : viewBox 1200 × 430, sol à y = 394. Les couleurs viennent du CSS (classes cr-*), jamais d'attributs : la teinte et les jantes se changent donc sans toucher au dessin.
const wheel = (cx, cy, r, lite) => {
  const q = (k) => Math.round(r * k);
  const spokes = (par) => { let d = ""; for (let i = par; i < 10; i += 2) { const t = (i * 36 * Math.PI) / 180, s = Math.sin(t), c = Math.cos(t); d += `M${Math.round(r * 0.2 * s)} ${-Math.round(r * 0.2 * c)}L${Math.round(r * 0.66 * s)} ${-Math.round(r * 0.66 * c)}`; } return d; };
  const detail = lite ? "" : `<path class="cr-sp cr-sp--o" d="${spokes(0)}"/><path class="cr-sp cr-sp--e" d="${spokes(1)}"/><circle class="cr-disc" r="${q(0.66)}"/><path class="cr-cal" d="M ${q(0.28)} ${-q(0.58)} A ${q(0.64)} ${q(0.64)} 0 0 1 ${q(0.58)} ${-q(0.26)}"/>`;
  return `<g class="cr-wheel" transform="translate(${cx} ${cy})"><circle class="cr-tire" r="${r}"/><circle class="cr-wall" r="${q(0.8)}"/><circle class="cr-rimd" r="${q(0.7)}"/>${detail}<circle class="cr-hub" r="${q(0.13)}"/></g>`;
};
const KINDS = {
  vesta: { rx: 270, fx: 905, r: 70, a: 88, cy: 324,
    top: "M 92 324 C 78 314 74 280 86 258 C 92 246 110 240 150 236 L 255 228 C 330 192 400 150 500 134 C 560 126 650 124 700 130 C 770 140 830 186 870 214 L 990 236 C 1060 244 1110 252 1128 276 C 1140 292 1140 312 1128 324 L 1092 328",
    glass: "M 300 226 C 360 190 420 156 505 143 C 570 136 650 134 692 140 C 742 148 782 180 814 208 Z", pillar: "M 560 138 L 552 224", seam: "M 552 226 L 548 306 M 760 214 L 764 304", handle: "M 590 240 L 640 238",
    hi: "M 330 194 C 400 152 470 138 560 130 C 640 126 690 128 700 132", line: "M 130 250 C 400 238 700 234 1000 248", head: "M 1066 254 C 1090 254 1112 260 1126 272 L 1090 268 Z", tail: "M 88 262 L 124 256 L 120 268 L 88 274 Z", streak: "M 430 240 L 530 240 L 450 320 L 370 320 Z" },
  aria: { rx: 262, fx: 912, r: 68, a: 86, cy: 326,
    top: "M 90 326 C 76 316 72 282 84 260 C 90 248 106 242 140 238 L 290 228 C 304 224 316 214 332 200 C 372 168 420 146 480 138 C 550 130 650 128 720 134 C 790 142 832 176 868 208 L 986 232 C 1060 242 1112 252 1130 278 C 1142 296 1140 316 1128 326 L 1092 330",
    glass: "M 346 214 C 384 182 430 160 484 151 C 550 144 650 142 714 148 C 770 154 806 182 832 208 Z", pillar: "M 590 146 L 584 218", seam: "M 584 220 L 580 308 M 780 214 L 784 306", handle: "M 612 232 L 662 230",
    hi: "M 380 178 C 430 150 490 140 560 135 C 640 130 700 130 720 136", line: "M 130 252 C 400 240 700 236 1000 250", head: "M 1066 258 C 1090 258 1112 262 1126 274 L 1092 272 Z", tail: "M 88 266 L 128 260 L 124 274 L 88 278 Z", streak: "M 420 244 L 520 244 L 440 324 L 360 324 Z" },
  kora: { rx: 270, fx: 905, r: 76, a: 96, cy: 318,
    top: "M 90 316 C 76 304 72 250 84 220 C 90 206 104 200 128 198 L 170 194 C 184 150 204 110 236 94 C 276 78 330 72 420 72 L 700 72 C 770 74 810 92 840 126 C 860 150 872 172 884 194 L 1000 214 C 1072 226 1120 240 1136 266 C 1148 288 1146 306 1134 316 L 1098 318",
    glass: "M 214 190 C 222 146 236 112 262 98 C 300 90 350 90 420 90 L 698 90 C 748 92 782 112 808 142 C 826 164 838 182 848 196 Z", pillar: "M 560 90 L 554 192", seam: "M 554 194 L 550 298 M 770 198 L 774 298", handle: "M 590 212 L 640 210",
    hi: "M 270 80 C 320 72 380 70 440 70 L 700 70", line: "M 130 224 C 400 216 700 214 1010 228", head: "M 1072 238 C 1096 240 1118 248 1132 262 L 1094 256 Z", tail: "M 80 238 L 118 234 L 116 252 L 80 256 Z", streak: "M 420 222 L 530 222 L 450 304 L 360 304 Z" },
  lume: { rx: 262, fx: 908, r: 70, a: 88, cy: 324,
    top: "M 86 324 C 72 314 70 258 82 232 C 88 220 102 214 124 212 L 168 206 C 190 166 214 140 250 130 C 330 118 500 112 640 112 C 730 114 790 134 826 168 C 846 186 860 202 872 214 L 990 234 C 1060 244 1112 254 1128 278 C 1140 294 1140 314 1128 324 L 1092 328",
    glass: "M 214 206 C 232 172 252 150 280 142 C 350 132 500 128 640 128 C 722 130 772 148 806 180 C 822 194 832 204 840 212 Z", pillar: "M 520 128 L 514 212", seam: "M 514 214 L 510 306 M 740 214 L 744 306", handle: "M 552 236 L 604 234",
    hi: "M 270 138 C 340 124 480 120 640 120 C 700 122 730 128 750 138", line: "M 126 240 C 400 232 700 232 1000 248", head: "M 1066 256 C 1090 256 1112 262 1126 274 L 1090 270 Z", tail: "M 84 250 L 122 246 L 120 266 L 84 270 Z", streak: "M 410 240 L 510 240 L 430 322 L 350 322 Z" },
};
// kind : vesta | aria | kora | lume ; opts.wire : dessin au trait (plan technique) ; opts.cls : classes supplémentaires
const car = (kind, opts = {}) => {
  const k = KINDS[kind] || KINDS.vesta, { rx, fx, r, a, cy } = k, lite = /mini/.test(opts.cls || ""), quiet = opts.quiet;
  const body = `${k.top} L ${fx + a} ${cy} A ${a} ${a} 0 0 0 ${fx - a} ${cy} L ${rx + a} ${cy} A ${a} ${a} 0 0 0 ${rx - a} ${cy} Z`;
  const shade = `M ${rx - a - 30} ${cy - 24} L ${fx + a + 150} ${cy - 24} L ${fx + a + 150} ${cy} L ${rx - a - 30} ${cy} Z`;
  return `<svg class="cr-car cr-car--${kind}${opts.wire ? " cr-car--wire" : ""}${opts.cls ? " " + opts.cls : ""}" viewBox="0 0 1200 430" ${quiet ? 'aria-hidden="true"' : `role="img" aria-label="${esc(opts.label || "Silhouette du véhicule")}"`}>
<ellipse class="cr-gshadow" cx="600" cy="396" rx="520" ry="14"/><circle class="cr-well" cx="${rx}" cy="${cy}" r="${a}"/><circle class="cr-well" cx="${fx}" cy="${cy}" r="${a}"/>
<path class="cr-body" d="${body}"/><path class="cr-shade" d="${shade}"/><path class="cr-streak" d="${k.streak}"/><path class="cr-glass" d="${k.glass}"/><path class="cr-pillar" d="${k.pillar}"/><path class="cr-seam" d="${k.seam}"/><path class="cr-hl" d="${k.hi}"/>${lite ? "" : `<path class="cr-hl cr-hl--b" d="${k.line}"/><path class="cr-handle" d="${k.handle}"/>`}<path class="cr-head" d="${k.head}"/><path class="cr-tail" d="${k.tail}"/>
${wheel(rx, cy, r, lite)}${wheel(fx, cy, r, lite)}</svg>`;
};
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const mark = `<svg class="cr-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 36 11v18L20 37 4 29V11z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 25 20 12l9 13M14 21h12" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`;

/* ------------------------------------------------------------------ données de démonstration */
const MODELS = [
  { k: "aria", n: "Aria", t: "Berline", p: 52900, d: 0, s: 0, len: "4 780 mm", boot: "520 L", seats: "5", dot: "Berline tricorps, ligne tendue", lead: "La berline qui glisse.", feat: "Suspension pilotée adaptative", cons: "5,4 L/100 km" },
  { k: "kora", n: "Kora", t: "SUV", p: 61400, d: -20, s: 0.4, len: "4 690 mm", boot: "610 L", seats: "5", dot: "SUV haut perché, garde au sol réglable", lead: "Le SUV qui s'accroche.", feat: "Transmission intégrale", cons: "6,1 L/100 km" },
  { k: "vesta", n: "Vesta", t: "Coupé", p: 68500, d: 40, s: -0.4, len: "4 560 mm", boot: "380 L", seats: "4", dot: "Coupé 2+2, toit fuyant", lead: "Le coupé qui retient son souffle.", feat: "Échappement à clapets", cons: "6,6 L/100 km" },
  { k: "lume", n: "Lume", t: "Break", p: 55900, d: -10, s: 0.2, len: "4 920 mm", boot: "640 L", seats: "5", dot: "Break long, toit panoramique", lead: "Le break qui emmène tout.", feat: "Coffre à seuil bas", cons: "5,7 L/100 km" },
];
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
const TINTS = [["argent", "Argent glacé", 0], ["carbone", "Gris carbone", 0], ["onyx", "Noir onyx", 0], ["nacre", "Blanc nacré", 900], ["neve", "Bleu Névé", 900], ["cuivre", "Cuivre brossé", 900]];
const RIMS = [["a", "19″ Étoile", 0], ["b", "20″ Turbine graphite", 1400], ["c", "21″ Disque aéro", 2100]];
const ENGINES = [["ess", "Essence 2.0 T", "245 ch", 0, 245, 6.4], ["hyb", "Hybride rechargeable", "306 ch", 6800, 306, 5.6], ["ele", "Électrique", "408 ch", 11500, 408, 5.1]];
const OPTS = [["toit", "Toit panoramique", 1900], ["siege", "Sièges chauffants et ventilés", 1200], ["son", "Audio 16 haut-parleurs", 1600], ["aide", "Pack aides à la conduite", 1400]];

/* ------------------------------------------------------------------ en-tête et pied */
const mini = (m) => `<a class="cr-mm" href="/gamme">${car(m.k, { cls: "cr-car--mini", label: `Halden ${m.n}` })}<b>${m.n}</b><span>${m.t} · dès ${money(m.p)}</span></a>`;
const header = (c) => `<header class="cr-head pk-bleed"><div class="cr-bar">
  <a class="cr-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span>HALDEN</span><small>Automobiles</small></a>
  <div class="cr-nav" role="navigation" aria-label="Navigation principale">
    <a href="/">Accueil</a>
    <div class="cr-has"><a href="/gamme" aria-haspopup="true">Gamme</a>
      <div class="cr-mega"><div class="cr-mega-in"><div class="cr-mega-cars">${MODELS.map(mini).join("")}</div>
        <div class="cr-mega-side"><p class="cr-eyebrow">Outils</p><a href="/comparateur">Configurer et comparer ${arrow}</a><a href="/occasions">Véhicules d'occasion ${arrow}</a><a href="/financement">Simuler un financement ${arrow}</a><a href="/modele">Fiche détaillée Kora ${arrow}</a></div></div></div></div>
    <a href="/occasions">Occasions</a><a href="/comparateur">Comparateur</a><a href="/service">Atelier</a><a href="/financement">Financement</a>
  </div>
  <a class="cr-btn cr-btn--sm" href="/contact">Essai</a>
  <details class="cr-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cr-drawer" role="navigation" aria-label="Menu mobile">
    <a href="/">Accueil</a><p class="cr-eyebrow">Gamme</p>${MODELS.map((m) => `<a class="cr-sub" href="/gamme">Halden ${m.n} <small>${m.t}</small></a>`).join("")}
    <a href="/modele">Fiche modèle</a><a href="/occasions">Occasions</a><a href="/comparateur">Comparateur</a><a href="/service">Atelier</a><a href="/financement">Financement</a><a href="/contact">Contact</a><a class="cr-btn" href="/contact">Réserver un essai</a></div></details>
</div></header>`;

const footer = (c) => `<footer class="cr-foot pk-bleed"><div class="cr-foot-word" aria-hidden="true">HALDEN</div><div class="cr-wrap cr-foot-grid">
  <div><p class="cr-foot-lead">Des automobiles dessinées comme des instruments.</p><address>${esc(c.brand)}<br>Showroom, 18 avenue des Moulins<br>38000 Grenoble</address></div>
  <div><h3>Gamme</h3>${MODELS.map((m) => `<a class="cr-fl" href="/gamme">${m.n} · ${m.t}</a>`).join("")}</div>
  <div><h3>Services</h3><a class="cr-fl" href="/occasions">Occasions</a><a class="cr-fl" href="/service">Atelier</a><a class="cr-fl" href="/financement">Financement</a><a class="cr-fl" href="/comparateur">Comparateur</a></div>
  <div><h3>Maison</h3><a class="cr-fl" href="/contact">Contact</a><a class="cr-fl" href="/recherche">Recherche</a><a class="cr-fl" href="/modele">Fiche modèle</a></div></div>
  <p class="cr-legal cr-wrap">© Halden Automobiles — site de démonstration. Marques, modèles, prix et chiffres fictifs, donnés à titre d'exemple. Aucune commande ni aucun crédit ne peut être conclu ici.</p></footer>`;

const pagehead = (kicker, title, sub, extra = "") => sec(`<section class="cr-ph pk-bleed"><div class="cr-wrap"><p class="cr-eyebrow" data-reveal>${esc(kicker)}</p><div class="cr-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="cr-sub-lead" data-reveal>${esc(sub)}</p>` : ""}${extra}</div><div class="cr-ph-line" aria-hidden="true"></div></section>`);

/* ------------------------------------------------------------------ blocs réutilisés */
const tintRow = (cls = "") => `<div class="cr-tints ${cls}" role="group" aria-label="Choisir une teinte">${TINTS.map(([k, n], i) => `<a href="#teinte" class="cr-sw cr-t-${k}${i === 0 ? " is-on" : ""}" data-tint="${k}" title="${n}" aria-label="${n}"></a>`).join("")}</div>`;
const specStrip = `<section class="cr-strip pk-bleed"><ul class="cr-wrap cr-strip-in"><li data-reveal><b data-count="408">408</b><span>chevaux, au sommet de la gamme</span></li><li data-reveal><b data-count="51" data-dec="1">5,1</b><span>secondes de 0 à 100 km/h</span></li><li data-reveal><b data-count="520">520</b><span>km d'autonomie électrique annoncée</span></li><li data-reveal><b data-count="8">8</b><span>ans de garantie batterie (démonstration)</span></li></ul></section>`;

const gammeRows = () => MODELS.map((m, i) => `<article class="cr-row${i % 2 ? " cr-row--r" : ""} pk-bleed" data-reveal><div class="cr-wrap cr-row-in">
  <div class="cr-row-copy"><p class="cr-eyebrow">0${i + 1} · ${m.t}</p><h3 class="cr-row-name">${m.n}</h3><p class="cr-row-lead">${m.lead}</p><ul class="cr-row-spec"><li><b>${m.len}</b><span>longueur</span></li><li><b>${m.boot}</b><span>coffre</span></li><li><b>${money(m.p)}</b><span>à partir de</span></li></ul>
  <div class="cr-actions"><a class="cr-btn" href="/modele">Découvrir ${arrow}</a><a class="cr-btn cr-btn--line" href="/comparateur">Configurer</a></div></div>
  <div class="cr-row-car">${car(m.k, { label: `Halden ${m.n}, ${m.t}` })}<span class="cr-row-ghost" aria-hidden="true">${m.n}</span></div></div></article>`).join("");

const occ = [
  ["Halden Aria 245 T", "aria", "berline", "essence", 2023, "38 400", 41200, "Gris carbone", "carbone"],
  ["Halden Kora Hybride", "kora", "suv", "hybride", 2024, "49 800", 18700, "Bleu Névé", "neve"],
  ["Halden Vesta Électrique", "vesta", "coupe", "electrique", 2024, "61 900", 9400, "Blanc nacré", "nacre"],
  ["Halden Lume 245 T", "lume", "break", "essence", 2022, "33 200", 63500, "Argent glacé", "argent"],
  ["Norvik Tern GT", "vesta", "coupe", "essence", 2021, "44 500", 52100, "Noir onyx", "onyx"],
  ["Lorenz Mistral E", "aria", "berline", "electrique", 2023, "41 700", 27800, "Cuivre brossé", "cuivre"],
  ["Halden Kora 245 T", "kora", "suv", "essence", 2022, "42 900", 58400, "Gris carbone", "carbone"],
  ["Norvik Alta Tourer", "lume", "break", "hybride", 2023, "39 600", 33900, "Bleu Névé", "neve"],
];
const occRows = (from, to) => occ.slice(from, to).map(([n, k, ty, fu, y, pr, km, col, t]) => `<li class="cr-oc cr-t-${t}" data-type="${ty}" data-fuel="${fu}"><div class="cr-oc-car">${car(k, { cls: "cr-car--mini", label: n })}</div><div class="cr-oc-main"><h3>${n}</h3><p>${col} · ${fu === "electrique" ? "Électrique" : fu === "hybride" ? "Hybride rechargeable" : "Essence"}</p></div><dl class="cr-oc-meta"><div><dt>Année</dt><dd>${y}</dd></div><div><dt>Kilométrage</dt><dd>${String(km).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} km</dd></div></dl><p class="cr-oc-price">${pr.replace(" ", " ")} €</p><a class="cr-btn cr-btn--line cr-btn--sm" href="/contact">Demander</a></li>`).join("");

/* ------------------------------------------------------------------ accueil */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="cr-hero pk-bleed" data-glint><div class="cr-hero-top cr-wrap"><p class="cr-eyebrow" data-reveal>Nouvelle Halden Vesta · Coupé 2027</p>
    <div class="cr-mega-title" role="heading" aria-level="1"><span data-reveal>Le métal</span><span class="cr-out" data-reveal>qui respire.</span></div>
    <div class="cr-hero-side" data-reveal><p>Quatre silhouettes, trois motorisations, une seule exigence : que chaque reflet raconte quelque chose. Passez votre curseur sur la carrosserie.</p>
      <div class="cr-actions"><a class="cr-btn" href="/comparateur">Configurer ma Halden ${arrow}</a><a class="cr-btn cr-btn--line" href="/gamme">Voir la gamme</a></div></div></div>
    <div class="cr-stage cr-stage--hero" data-stage><div class="cr-car-wrap">${car("vesta", { cls: "cr-car--hero", label: "Halden Vesta, coupé, vue de profil" })}<div class="cr-glint" aria-hidden="true"></div></div>
      <div class="cr-floor" aria-hidden="true"><div class="cr-reflect">${car("vesta", { cls: "cr-car--ref" })}</div></div></div>
    <div class="cr-hero-foot cr-wrap"><div class="cr-tint-box"><span class="cr-tag">Teinte</span>${tintRow()}</div><p class="cr-hero-note">Vesta 408 ch · à partir de ${money(68500)} · prix de démonstration</p></div></section>`),
  sec(specStrip),
  sec(`<section class="cr-gamme pk-bleed"><div class="cr-wrap cr-gamme-head"><p class="cr-eyebrow" data-reveal>La gamme</p><h2 class="cr-h2" data-reveal>Quatre carrosseries,<br>un même dessin.</h2></div>${gammeRows()}</section>`),
  sec(`<section class="cr-tool pk-bleed"><div class="cr-wrap cr-tool-in"><div data-reveal><p class="cr-eyebrow">Configurateur</p><h2 class="cr-h2">Votre Halden,<br>au détail près.</h2><p class="cr-sub-lead">Modèle, teinte, jantes, motorisation, options : le prix de démonstration se met à jour à chaque choix, et jusqu'à trois modèles se comparent en colonnes.</p><a class="cr-btn" href="/comparateur">Ouvrir le configurateur ${arrow}</a></div>
    <ul class="cr-tool-list" data-reveal><li><b>6</b><span>teintes de carrosserie</span></li><li><b>3</b><span>modèles de jantes</span></li><li><b>3</b><span>motorisations</span></li><li><b>4</b><span>options à la carte</span></li></ul></div></section>`),
  sec(`<section class="cr-duo pk-bleed"><div class="cr-wrap cr-duo-in">
    <a class="cr-duo-card" href="/occasions" data-reveal><p class="cr-eyebrow">Occasions certifiées</p><h3>Des Halden de seconde main, contrôlées en atelier.</h3><span class="cr-more">Filtrer les occasions ${arrow}</span></a>
    <a class="cr-duo-card" href="/financement" data-reveal><p class="cr-eyebrow">Financement</p><h3>Estimez une mensualité, sans engagement.</h3><span class="cr-more">Ouvrir le simulateur ${arrow}</span></a>
    <a class="cr-duo-card" href="/service" data-reveal><p class="cr-eyebrow">Atelier</p><h3>Entretien, pneumatiques, carrosserie : tout sous un toit.</h3><span class="cr-more">Découvrir l'atelier ${arrow}</span></a></div></section>`),
  sec(`<section class="cr-cta pk-bleed"><div class="cr-wrap cr-cta-in"><h2 class="cr-mega-title cr-mega-title--s" data-reveal>Venez la voir<br><span class="cr-out">sous la lumière.</span></h2><div data-reveal><p class="cr-sub-lead">Un conseiller vous reçoit au showroom et prépare l'essai de votre choix. Écrivez-nous : nous revenons vers vous sous deux jours ouvrés.</p><a class="cr-btn" href="/contact">Réserver un essai ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

/* ------------------------------------------------------------------ gamme : comparateur en colonnes */
const gammeCols = () => MODELS.map((m) => `<article class="cr-col" data-reveal><div class="cr-col-car">${car(m.k, { cls: "cr-car--mini", label: `Halden ${m.n}` })}</div><p class="cr-eyebrow">${m.t}</p><h3>Halden ${m.n}</h3><p class="cr-col-lead">${m.lead}</p>
  <dl class="cr-dl"><div><dt>Longueur</dt><dd>${m.len}</dd></div><div><dt>Coffre</dt><dd>${m.boot}</dd></div><div><dt>Places</dt><dd>${m.seats}</dd></div><div><dt>Puissance</dt><dd>245 à ${408 + m.d} ch</dd></div><div><dt>Consommation</dt><dd>${m.cons}</dd></div><div><dt>Signature</dt><dd>${m.feat}</dd></div></dl>
  <p class="cr-col-price"><small>à partir de</small> ${money(m.p)}</p><div class="cr-actions"><a class="cr-btn cr-btn--sm" href="/modele">Détails</a><a class="cr-btn cr-btn--line cr-btn--sm" href="/comparateur">Configurer</a></div></article>`).join("");
const gamme = (c) => [sec(header(c)), pagehead("La gamme 2027", "Quatre silhouettes.<br>Un seul caractère.", "Comparez les modèles côte à côte : dimensions, puissance, consommation, signature technique."),
  sec(`<section class="cr-cols pk-bleed"><div class="cr-wrap cr-cols-in">${gammeCols()}</div></section>`),
  sec(`<section class="cr-engines pk-bleed"><div class="cr-wrap"><p class="cr-eyebrow" data-reveal>Motorisations</p><h2 class="cr-h2" data-reveal>Trois façons d'avancer.</h2><div class="cr-eng-grid">
    ${ENGINES.map(([k, n, ch, p, pw, t], i) => `<article class="cr-eng" data-reveal><span class="cr-eng-n">0${i + 1}</span><h3>${n}</h3><p class="cr-eng-ch"><b>${pw}</b> ch</p><p>0 à 100 km/h en ${String(t).replace(".", ",")} s</p><p class="cr-muted">${i === 0 ? "Quatre cylindres turbo, boîte à double embrayage à 8 rapports." : i === 1 ? "Moteur thermique et électrique, 62 km en mode électrique." : "Deux moteurs, batterie de 98 kWh, recharge rapide jusqu'à 250 kW."}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="cr-cta pk-bleed"><div class="cr-wrap cr-cta-in"><h2 class="cr-mega-title cr-mega-title--s" data-reveal>Choisissez,<br><span class="cr-out">puis composez.</span></h2><div data-reveal><p class="cr-sub-lead">Le configurateur calcule un prix de démonstration et prépare un résumé que vous nous transmettez par le formulaire de contact.</p><a class="cr-btn" href="/comparateur">Ouvrir le configurateur ${arrow}</a></div></div></section>`),
  sec(footer(c))];

/* ------------------------------------------------------------------ modèle (détail Kora) */
const modele = (c) => [sec(header(c)),
  sec(`<section class="cr-md pk-bleed" data-glint><div class="cr-wrap cr-md-top"><p class="cr-eyebrow" data-reveal>Halden Kora · SUV · 2027</p><div class="cr-h1" role="heading" aria-level="1" data-reveal>Kora.<br><span class="cr-out">Haut perché, bien posé.</span></div>
    <p class="cr-sub-lead" data-reveal>Un SUV de 4,69 m qui garde la tenue d'une berline : garde au sol réglable sur 40 mm, centre de gravité abaissé et ligne de toit tendue.</p></div>
    <div class="cr-stage cr-stage--md" data-stage><div class="cr-car-wrap">${car("kora", { cls: "cr-car--hero", label: "Halden Kora, SUV, vue de profil" })}<div class="cr-glint cr-glint--kora" aria-hidden="true"></div></div></div>
    <div class="cr-wrap cr-md-foot"><div class="cr-tint-box"><span class="cr-tag">Teinte</span>${tintRow()}</div><a class="cr-btn" href="/comparateur">Configurer la Kora ${arrow}</a></div></section>`),
  sec(`<section class="cr-tabsec pk-bleed"><div class="cr-wrap"><div class="cr-tabs" role="tablist" aria-label="Rubriques du modèle"><a href="#design" class="is-on" role="tab" aria-selected="true" data-tab="design">Design</a><a href="#technique" role="tab" aria-selected="false" data-tab="technique">Technologie</a><a href="#habitacle" role="tab" aria-selected="false" data-tab="habitacle">Habitacle</a></div>
    <div class="cr-panel is-on" data-panel="design" role="tabpanel"><div class="cr-p2"><h2 class="cr-h2">Une ligne,<br>un seul trait.</h2><div><p class="cr-lead">La ceinture de caisse monte d'un seul geste jusqu'au hayon. Les poignées affleurantes et les optiques en fin ruban donnent à la Kora une face calme, presque minérale.</p><ul class="cr-ticks"><li>Calandre fermée à lamelles actives</li><li>Optiques matricielles de signature glacée</li><li>Jantes de 19 à 21 pouces</li></ul></div></div></div>
    <div class="cr-panel" data-panel="technique" role="tabpanel"><div class="cr-p2"><h2 class="cr-h2">Du calcul,<br>pas du bruit.</h2><div><p class="cr-lead">Transmission intégrale à répartition continue, suspension pilotée et direction à rapport variable : la Kora corrige avant que vous ne le sentiez.</p><ul class="cr-ticks"><li>Garde au sol réglable de 40 mm</li><li>Mode remorquage jusqu'à 2 000 kg</li><li>Mises à jour logicielles à distance (démonstration)</li></ul></div></div></div>
    <div class="cr-panel" data-panel="habitacle" role="tabpanel"><div class="cr-p2"><h2 class="cr-h2">Un salon<br>de métal brossé.</h2><div><p class="cr-lead">Garnitures en aluminium brossé, cuir pleine fleur ou textile recyclé, éclairage d'ambiance à six teintes. Cinq vraies places et un coffre de 610 litres.</p><ul class="cr-ticks"><li>Écran incurvé de 14,5 pouces</li><li>Sièges chauffants et ventilés en option</li><li>Audio 16 haut-parleurs en option</li></ul></div></div></div></div></section>`),
  sec(`<section class="cr-blue pk-bleed"><div class="cr-wrap cr-blue-in"><div data-reveal><p class="cr-eyebrow">Dimensions</p><h2 class="cr-h2">Le plan,<br>sans artifice.</h2><dl class="cr-dl cr-dl--wide"><div><dt>Longueur</dt><dd>4 690 mm</dd></div><div><dt>Largeur</dt><dd>1 940 mm</dd></div><div><dt>Hauteur</dt><dd>1 665 mm</dd></div><div><dt>Empattement</dt><dd>2 810 mm</dd></div><div><dt>Coffre</dt><dd>610 à 1 780 L</dd></div><div><dt>Poids à vide</dt><dd>1 870 kg</dd></div></dl></div>
    <figure class="cr-blue-fig" data-reveal>${car("kora", { wire: true, label: "Plan technique de la Halden Kora" })}<figcaption>Plan technique, échelle indicative.</figcaption></figure></div></section>`),
  sec(`<section class="cr-duo pk-bleed"><div class="cr-wrap cr-duo-in cr-duo-in--2"><a class="cr-duo-card" href="/comparateur" data-reveal><p class="cr-eyebrow">Comparer</p><h3>La Kora face à l'Aria et à la Lume.</h3><span class="cr-more">Ouvrir le comparateur ${arrow}</span></a><a class="cr-duo-card" href="/contact" data-reveal><p class="cr-eyebrow">Essai</p><h3>Réservez un essai de la Kora au showroom.</h3><span class="cr-more">Écrire au conseiller ${arrow}</span></a></div></section>`),
  sec(footer(c))];

/* ------------------------------------------------------------------ occasions */
const chips = (grp, items) => items.map(([v, l], i) => `<a href="#f-${grp}-${v}" class="cr-chip${i === 0 ? " is-on" : ""}" data-f="${grp}" data-v="${v}" role="radio" aria-checked="${i === 0}">${l}</a>`).join("");
const occasions = (c) => [sec(header(c)), pagehead("Occasions certifiées", "Seconde main,<br>première qualité.", "Chaque véhicule passe un contrôle de 120 points à l'atelier avant d'être présenté (exemples de démonstration)."),
  sec(`<section class="cr-occ pk-bleed"><div class="cr-wrap"><div class="cr-filters"><div class="cr-fg"><span class="cr-tag">Carrosserie</span><div role="radiogroup" aria-label="Filtrer par carrosserie" class="cr-chips">${chips("type", [["all", "Toutes"], ["berline", "Berline"], ["suv", "SUV"], ["coupe", "Coupé"], ["break", "Break"]])}</div></div>
    <div class="cr-fg"><span class="cr-tag">Énergie</span><div role="radiogroup" aria-label="Filtrer par énergie" class="cr-chips">${chips("fuel", [["all", "Toutes"], ["essence", "Essence"], ["hybride", "Hybride"], ["electrique", "Électrique"]])}</div></div></div>
    <p class="cr-count" aria-live="polite"><b data-occ-n>${occ.length}</b> véhicules affichés</p><ul class="cr-oc-list">${occRows(0, 4)}</ul></div></section>`),
  sec(`<section class="cr-occ cr-occ--b pk-bleed"><div class="cr-wrap"><ul class="cr-oc-list">${occRows(4, 8)}</ul><p class="cr-empty">Aucun véhicule ne correspond à ces filtres. Essayez « Toutes ».</p></div></section>`),
  sec(`<section class="cr-guar pk-bleed"><div class="cr-wrap cr-guar-in"><div data-reveal><p class="cr-eyebrow">Notre engagement</p><h2 class="cr-h2">Contrôlée,<br>documentée.</h2></div><ul class="cr-ticks" data-reveal><li>Contrôle de 120 points en atelier</li><li>Historique d'entretien présenté (exemple)</li><li>Garantie constructeur prolongée possible (démonstration)</li><li>Reprise de votre ancien véhicule à étudier</li></ul></div></section>`),
  sec(footer(c))];

/* ------------------------------------------------------------------ comparateur + configurateur */
const radio = (k, v, label, extra = "", on = false, cls = "") => `<a href="#${k}-${v}" class="cr-opt ${cls}${on ? " is-on" : ""}" role="radio" aria-checked="${on}" data-k="${k}" data-v="${v}" ${extra}>${label}</a>`;
const cfgControls = () => `<div class="cr-ctl" data-cfg>
  <div class="cr-grp" role="group" aria-label="1 · Modèle"><p class="cr-leg">1 · Modèle</p><div class="cr-opts" role="radiogroup" aria-label="Modèle">${MODELS.map((m, i) => radio("m", m.k, `<b>${m.n}</b><small>${m.t} · ${money(m.p)}</small>`, `data-p="${m.p}" data-d="${m.d}" data-s="${m.s}" data-n="Halden ${m.n}"`, i === 2)).join("")}</div></div>
  <div class="cr-grp" role="group" aria-label="2 · Teinte"><p class="cr-leg">2 · Teinte</p><div class="cr-opts cr-opts--sw" role="radiogroup" aria-label="Teinte">${TINTS.map(([k, n, p], i) => radio("t", k, `<span class="cr-sw cr-t-${k}"></span><small>${n}${p ? " · +" + money(p) : ""}</small>`, `data-p="${p}" data-n="${n}"`, i === 0, "cr-opt--sw")).join("")}</div></div>
  <div class="cr-grp" role="group" aria-label="3 · Jantes"><p class="cr-leg">3 · Jantes</p><div class="cr-opts" role="radiogroup" aria-label="Jantes">${RIMS.map(([k, n, p], i) => radio("r", k, `<b>${n}</b><small>${p ? "+" + money(p) : "De série"}</small>`, `data-p="${p}" data-n="${n}"`, i === 0)).join("")}</div></div>
  <div class="cr-grp" role="group" aria-label="4 · Motorisation"><p class="cr-leg">4 · Motorisation</p><div class="cr-opts" role="radiogroup" aria-label="Motorisation">${ENGINES.map(([k, n, ch, p, pw, t], i) => radio("e", k, `<b>${n}</b><small>${ch} · ${p ? "+" + money(p) : "De série"}</small>`, `data-p="${p}" data-ch="${pw}" data-t="${t}" data-n="${n}"`, i === 1)).join("")}</div></div>
  <div class="cr-grp" role="group" aria-label="5 · Options"><p class="cr-leg">5 · Options</p><div class="cr-opts" role="group" aria-label="Options">${OPTS.map(([k, n, p]) => `<a href="#o-${k}" class="cr-opt" role="checkbox" aria-checked="false" data-k="o" data-v="${k}" data-p="${p}" data-n="${n}"><b>${n}</b><small>+${money(p)}</small></a>`).join("")}</div></div></div>`;
const cmpHead = `<tr><th scope="col"><span class="cr-sr">Caractéristique</span></th>${MODELS.map((m) => `<th scope="col" class="cr-c-${m.k}">Halden ${m.n}<small>${m.t}</small></th>`).join("")}</tr>`;
const cmpRow = (label, f, calc = "") => `<tr${calc ? ` data-calc="${calc}"` : ""}><th scope="row">${label}</th>${MODELS.map((m) => `<td class="cr-c-${m.k}" data-l="Halden ${m.n}" data-m="${m.k}">${f(m)}</td>`).join("")}</tr>`;
const comparateur = (c) => [sec(header(c)), pagehead("Configurateur et comparateur", "Composez.<br><span class=\"cr-out\">Comparez.</span>", "Prix de démonstration : aucune commande n'est possible ici. Votre résumé se transmet par le formulaire de contact."),
  sec(`<section class="cr-cfg pk-bleed" data-glint><div class="cr-wrap cr-cfg-in">
    <div class="cr-cfg-stage"><div class="cr-stage cr-stage--cfg" data-stage data-model="vesta" data-rim="a">${MODELS.map((m) => `<div class="cr-car-wrap cr-m-${m.k}">${car(m.k, { cls: "cr-car--cfg", label: `Halden ${m.n} configurée`, quiet: m.k !== "vesta" })}</div>`).join("")}<div class="cr-glint cr-glint--soft" aria-hidden="true"></div><div class="cr-floor" aria-hidden="true"></div></div>
      <div class="cr-sum" aria-live="polite"><p class="cr-sum-name" data-out="name">Halden Vesta</p><p class="cr-sum-line" data-out="sum"></p>
        <dl class="cr-sum-kpi"><div><dt>Puissance</dt><dd data-out="ch">—</dd></div><div><dt>0 à 100 km/h</dt><dd data-out="t">—</dd></div><div><dt>Mensualité indicative</dt><dd data-out="mo">—</dd></div></dl>
        <p class="cr-sum-price"><small>Prix de démonstration</small><b data-out="price">—</b></p>
        <div class="cr-actions"><a class="cr-btn" href="/contact">Envoyer ce résumé ${arrow}</a><a class="cr-btn cr-btn--line" href="#copier" data-copy>Copier le résumé</a></div><p class="cr-note" data-out="copied" role="status">Collez le résumé dans votre message de contact : il sera lu par un conseiller.</p></div></div>
    ${cfgControls()}</div></section>`),
  sec(`<section class="cr-cmp-sec pk-bleed"><div class="cr-wrap"><p class="cr-eyebrow" data-reveal>Comparateur</p><h2 class="cr-h2" data-reveal>Jusqu'à trois modèles,<br>en colonnes.</h2>
    <div class="cr-pick" role="group" aria-label="Modèles à comparer (trois au maximum)">${MODELS.map((m, i) => `<a href="#cmp-${m.k}" class="cr-chip${i < 3 ? " is-on" : ""}" data-cmp="${m.k}" role="checkbox" aria-checked="${i < 3}">Halden ${m.n}</a>`).join("")}</div>
    <p class="cr-note">Le prix, la puissance et le 0 à 100 km/h suivent votre configuration (teinte, jantes, motorisation, options).</p>
    <table class="cr-cmp" data-sel="aria kora vesta"><caption class="cr-sr">Comparatif des modèles Halden</caption><thead>${cmpHead}</thead><tbody>
    ${cmpRow("Carrosserie", (m) => m.t)}${cmpRow("Longueur", (m) => m.len)}${cmpRow("Coffre", (m) => m.boot)}${cmpRow("Places", (m) => m.seats)}${cmpRow("Signature", (m) => m.feat)}
    ${cmpRow("Prix de base", (m) => money(m.p))}${cmpRow("Prix configuré", () => "—", "price")}${cmpRow("Mensualité indicative", () => "—", "mo")}${cmpRow("Puissance configurée", () => "—", "ch")}${cmpRow("0 à 100 km/h", () => "—", "t")}</tbody></table></div></section>`),
  sec(footer(c))];

/* ------------------------------------------------------------------ atelier */
const service = (c) => [sec(header(c)), pagehead("Service et atelier", "L'atelier,<br><span class=\"cr-out\">sous le même toit.</span>", "Entretien, pneumatiques, carrosserie et véhicules électriques : un interlocuteur, un devis clair, un véhicule rendu lavé."),
  sec(`<section class="cr-wk pk-bleed"><div class="cr-wrap cr-wk-in"><figure class="cr-lift" data-reveal><div class="cr-lift-car">${car("aria", { wire: true, label: "Véhicule sur pont élévateur" })}</div><svg class="cr-lift-svg" viewBox="0 0 1200 120" aria-hidden="true"><rect x="140" y="20" width="14" height="100" fill="currentColor" opacity=".5"/><rect x="1046" y="20" width="14" height="100" fill="currentColor" opacity=".5"/><rect x="120" y="14" width="960" height="10" fill="currentColor" opacity=".7"/><rect x="100" y="112" width="1000" height="8" fill="currentColor" opacity=".35"/></svg><figcaption>Pont à deux colonnes : accès complet au soubassement.</figcaption></figure>
    <div><div class="cr-tabs" role="tablist" aria-label="Prestations de l'atelier"><a href="#entretien" class="is-on" role="tab" aria-selected="true" data-tab="entretien">Entretien</a><a href="#pneus" role="tab" aria-selected="false" data-tab="pneus">Pneumatiques</a><a href="#carrosserie" role="tab" aria-selected="false" data-tab="carrosserie">Carrosserie</a><a href="#electrique" role="tab" aria-selected="false" data-tab="electrique">Électrique</a></div>
    <div class="cr-panel is-on" data-panel="entretien" role="tabpanel"><h2 class="cr-h3">Révision constructeur</h2><p class="cr-muted">Vidange, filtres, freins, niveaux et mise à jour logicielle, avec un compte rendu photo.</p><p class="cr-from">à partir de <b>290&nbsp;€</b> <small>tarif de démonstration</small></p></div>
    <div class="cr-panel" data-panel="pneus" role="tabpanel"><h2 class="cr-h3">Pneumatiques</h2><p class="cr-muted">Montage, équilibrage, géométrie et stockage saisonnier de vos roues.</p><p class="cr-from">à partir de <b>120&nbsp;€</b> <small>tarif de démonstration</small></p></div>
    <div class="cr-panel" data-panel="carrosserie" role="tabpanel"><h2 class="cr-h3">Carrosserie et peinture</h2><p class="cr-muted">Débosselage sans peinture, réparation d'éclats, polissage et protection céramique.</p><p class="cr-from">devis sur <b>mesure</b> <small>gratuit et sans engagement</small></p></div>
    <div class="cr-panel" data-panel="electrique" role="tabpanel"><h2 class="cr-h3">Électrique et hybride</h2><p class="cr-muted">Diagnostic de batterie, contrôle des câbles de recharge et mise à niveau du logiciel.</p><p class="cr-from">à partir de <b>90&nbsp;€</b> <small>tarif de démonstration</small></p></div></div></div></section>`),
  sec(`<section class="cr-steps pk-bleed"><div class="cr-wrap"><p class="cr-eyebrow" data-reveal>Déroulé</p><h2 class="cr-h2" data-reveal>De la prise de rendez-vous<br>à la restitution.</h2><ol class="cr-steps-in">
    ${[["Diagnostic", "Un technicien relève l'état du véhicule avec vous."], ["Devis", "Le détail des pièces et de la main-d'œuvre, avant toute intervention."], ["Intervention", "Réalisée à l'atelier, suivie par photos."], ["Restitution", "Véhicule lavé, compte rendu expliqué, clés remises."]].map(([t, x], i) => `<li data-reveal><span class="cr-step-n">0${i + 1}</span><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="cr-faq pk-bleed"><div class="cr-wrap cr-faq-in"><h2 class="cr-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Puis-je obtenir un véhicule de courtoisie ?</summary><p>Selon disponibilité et durée de l'intervention : précisez-le dans votre demande de rendez-vous.</p></details>
    <details data-reveal><summary>Entretenez-vous les autres marques ?</summary><p>L'atelier prend en charge les modèles Halden ; pour les autres marques, contactez-nous avec la référence du véhicule.</p></details>
    <details data-reveal><summary>Comment prendre rendez-vous ?</summary><p>Par le formulaire de contact : indiquez le modèle, le kilométrage et la prestation souhaitée.</p></details></div></div></section>`),
  sec(footer(c))];

/* ------------------------------------------------------------------ financement */
const step = (k, label, val, unit) => `<div class="cr-stp"><span class="cr-tag">${label}</span><div class="cr-stp-in"><a href="#${k}-moins" data-step="${k}" data-dir="-1" aria-label="Diminuer : ${label}">−</a><span class="cr-out-v" data-v="${k}">${val}</span><a href="#${k}-plus" data-step="${k}" data-dir="1" aria-label="Augmenter : ${label}">+</a></div><small>${unit}</small></div>`;
const financement = (c) => [sec(header(c)), pagehead("Financement", "Comprendre avant<br><span class=\"cr-out\">de s'engager.</span>", "Trois façons de financer un véhicule, et un simulateur indicatif pour estimer une mensualité. Sans engagement."),
  sec(`<section class="cr-fin pk-bleed"><div class="cr-wrap cr-fin-in"><div class="cr-sim" data-sim><p class="cr-eyebrow">Simulateur indicatif</p><h2 class="cr-h3">Estimez votre mensualité</h2>
    <div class="cr-stps">${step("prix", "Prix du véhicule", "55 000", "euros, de 15 000 à 120 000")}${step("apport", "Apport", "5 000", "euros")}${step("duree", "Durée", "48", "mois (24 à 72)")}${step("taux", "Taux illustratif", "4,9", "% par an, hors assurance")}</div>
    <div class="cr-res" aria-live="polite"><div><small>Mensualité estimée</small><b data-r="mens">—</b></div><div><small>Montant financé</small><b data-r="fin">—</b></div><div><small>Coût total du crédit</small><b data-r="cout">—</b></div></div>
    <p class="cr-note">Simulation purement indicative, sans valeur contractuelle et sans engagement. Un crédit vous engage et doit être remboursé : vérifiez vos capacités de remboursement avant de vous engager.</p><a class="cr-btn" href="/contact">Demander un conseil ${arrow}</a></div>
    <div class="cr-fin-info"><h2 class="cr-h3">Les formules</h2><ul class="cr-forms">
      <li data-reveal><h3>Crédit classique</h3><p>Vous devenez propriétaire dès la livraison et remboursez par mensualités constantes.</p></li>
      <li data-reveal><h3>Location avec option d'achat</h3><p>Loyers plus doux, avec la possibilité d'acheter le véhicule au terme du contrat.</p></li>
      <li data-reveal><h3>Location longue durée</h3><p>Un loyer incluant l'entretien, sans propriété à la fin du contrat.</p></li></ul></div></div></section>`),
  sec(`<section class="cr-faq pk-bleed"><div class="cr-wrap cr-faq-in"><h2 class="cr-h2" data-reveal>Bon à savoir</h2><div>
    <details data-reveal><summary>Le simulateur m'engage-t-il ?</summary><p>Non. C'est un calcul indicatif réalisé dans votre navigateur ; aucune donnée n'est transmise et aucune offre n'est émise.</p></details>
    <details data-reveal><summary>Pourquoi le taux est-il « illustratif » ?</summary><p>Le taux réel dépend de votre situation, de la durée et de l'organisme prêteur ; il ne peut être donné que par une offre écrite.</p></details>
    <details data-reveal><summary>Puis-je reprendre mon véhicule actuel ?</summary><p>Une reprise peut être étudiée : indiquez le modèle, l'année et le kilométrage dans votre message.</p></details></div></div></section>`),
  sec(footer(c))];

/* ------------------------------------------------------------------ contact, recherche, introuvable */
const contact = (c) => [sec(header(c)), pagehead("Showroom Halden", "Contact", "Essai, reprise, atelier ou financement : décrivez votre projet. Si vous avez utilisé le configurateur, collez-y votre résumé."),
  { type: "form", heading: "Écrire à un conseiller", intro: "Indiquez le modèle, le type de demande et, si vous le souhaitez, le résumé de votre configuration. Réponse sous deux jours ouvrés." },
  sec(`<section class="cr-addr pk-bleed"><div class="cr-wrap cr-addr-in"><address><b>Showroom Halden</b><br>18 avenue des Moulins, 38000 Grenoble</address><p>Du mardi au samedi, 9 h à 19 h (horaires de démonstration)</p></div></section>`), sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une réponse,<br>un modèle ?", "Un modèle, une prestation, une question de financement."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cr-404 pk-bleed"><div class="cr-wrap"><p class="cr-eyebrow">Panne sèche</p><div class="cr-h1" role="heading" aria-level="1">404</div><p class="cr-sub-lead">Cette page n'existe pas ou a changé d'adresse.</p><div class="cr-404-car">${car("lume", { cls: "cr-car--cfg", label: "Véhicule à l'arrêt" })}</div><a class="cr-btn" href="/">Retour à l'accueil ${arrow}</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "chrome", name: "Chrome", version: "2.0.0", category: "auto", tags: ["luxe", "sombre", "technique"], siteType: "Concession automobile premium", featured: true,
  concept: "Une salle d'exposition de nuit : des véhicules dessinés en très grand, éclairés par un reflet qui suit la souris, un mega-menu par gamme et un configurateur-comparateur en colonnes.",
  description: "Concession automobile premium fictive : gris carbone, argent et bleu glace, véhicules en SVG avec reflet qui suit la souris, mega-menu par gamme, configurateur de teinte, jantes et motorisation, comparateur de trois modèles, occasions filtrables, simulateur de financement.",
  brand: "Halden Automobiles", modules: ["formulaires", "recherche"],
  dna: { header: "barre-fine-et-mega-menu-par-gamme", hero: "vehicule-geant-eclaire-par-reflet-souris", grid: "comparateur-en-colonnes-et-rangees-geantes", motion: "reflet-qui-suit-la-souris-et-teinte-vivante", shapes: "carrosseries-svg-reflets-et-filets-argent", rhythm: "showroom-nocturne-bandes-carbone-et-argent", signature: "configurateur-teinte-jantes-motorisation-et-comparateur-trois-modeles" },
  tokens: {
    colors: { primary: "#9cc7ee", secondary: "#1b1f25", accent: "#d5dae1", background: "#101215", surface: "#171a1f", text: "#eceff3", muted: "#9aa3ae", success: "#7bd3a0", warning: "#e0b46a", error: "#ff8a80" },
    fonts: { heading: "font.oswald", body: "font.barlow", button: "font.saira-condensed", link: "font.barlow" },
    radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "0 18px 40px rgba(0,0,0,.45)", button: "none" }, border: { width: 1, color: "#2a2f37" },
    type: { h1: { size: 104, weight: 600, lineHeight: 0.92, transform: "uppercase" }, h2: { size: 54, weight: 600, lineHeight: 0.98, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Bleu glace", type: "color", default: "#9cc7ee" },
    { key: "carbon", label: "Gris carbone du fond", type: "color", default: "#101215" },
    { key: "glint", label: "Reflet sur la carrosserie", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "floor", label: "Sol brillant sous les véhicules", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Gamme", "/gamme"], ["Occasions", "/occasions"], ["Comparateur", "/comparateur"], ["Atelier", "/service"], ["Financement", "/financement"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "gamme", name: "Gamme", render: gamme }, { key: "modele", name: "Modèle", render: modele }, { key: "occasions", name: "Occasions", render: occasions },
    { key: "comparateur", name: "Comparateur", render: comparateur }, { key: "service", name: "Service et atelier", render: service }, { key: "financement", name: "Financement", render: financement },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
