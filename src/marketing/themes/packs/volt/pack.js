// Volt — vélo électrique et mobilité urbaine (marque fictive). Direction artistique : vert acide sur gris-blanc froid et noir graphite, angles dynamiques (clip-path diagonal,
// bandes en biais), vélo dessiné en SVG qui traverse une ville filaire dans une traînée de vitesse ; barre de navigation inclinée avec jauge de batterie ; configurateur de vélo
// qui redessine le dessin (modèle, couleur, batterie, accessoires) et comparateur d'autonomie à courbe. Le récapitulatif renvoie vers le formulaire de contact.
const { sec, esc, nav } = require("../kit");

// ---------- géométrie du vélo (viewBox 400 x 240, sol à y = 218) ----------
const f = (n) => String(Math.round(n * 10) / 10);
const pt = (p) => `${f(p[0])} ${f(p[1])}`;
const ln = (a, b) => `M${pt(a)}L${pt(b)}`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const arc = (c, rad, a0, a1) => { const p = (a) => [c[0] + rad * Math.cos((a * Math.PI) / 180), c[1] + rad * Math.sin((a * Math.PI) / 180)]; return `M${pt(p(a0))}A${f(rad)} ${f(rad)} 0 0 1 ${pt(p(a1))}`; };
const GEO = {
  urbain: { r: 46, R: [86, 172], F: [314, 172], BB: [178, 174], S: [154, 102], H1: [270, 96], H2: [278, 116], post: [266, 78], sp: 16, rack: 112 },
  cargo: { r: 44, R: [64, 174], F: [338, 174], BB: [170, 176], S: [144, 102], H1: [286, 94], H2: [294, 114], post: [282, 76], sp: 16, rack: 108 },
  pliant: { r: 33, R: [122, 185], F: [290, 185], BB: [198, 187], S: [176, 126], H1: [268, 112], H2: [276, 136], post: [262, 62], sp: 32, rack: 130 },
};
const LEN = { 400: 0.34, 500: 0.46, 750: 0.66 };
const wheel = (c, r) => {
  let sp = ""; for (let i = 0; i < 8; i++) { const a = (i * 22.5 * Math.PI) / 180, x = (r - 7) * Math.cos(a), y = (r - 7) * Math.sin(a); sp += `M${f(x)} ${f(y)}L${f(-x)} ${f(-y)}`; }
  return `<g class="vl-wheel" transform="translate(${c[0]} ${c[1]})"><circle class="vl-tire" r="${r}"/><circle class="vl-rim" r="${r - 5}"/><g class="vl-spin"><path class="vl-spk" d="${sp}"/></g><circle class="vl-hub" r="4"/></g>`;
};
// o.all : toutes les variantes (le CSS du configurateur en affiche une) ; sinon seulement o.b (batterie) et o.ac (accessoires)
function bike(model, o = {}) {
  const g = GEO[model], { R, F, BB, S, H1, H2, r } = g, all = !!o.all, ac = new Set(o.ac || []);
  const tubes = [ln(R, BB), ln(R, S), ln(BB, S), ln(S, H1), ln(BB, H2), ln(H1, H2)].join("");
  const SP = [S[0] - 4, S[1] - g.sp], T = g.post;
  let s = "";
  if (model === "cargo") s += `<path class="vl-fo" d="M16 108H152M38 108 66 172M126 108 84 164"/><path class="vl-fr vl-thin" d="M16 108H152M38 108 66 172M126 108 84 164"/><g class="vl-box"><rect x="22" y="70" width="92" height="36" rx="4"/><path d="M22 84H114"/><path class="vl-led" d="M30 78H60"/></g>`;
  s += wheel(R, r) + wheel(F, r);
  s += `<path class="vl-chain" d="${ln(mix(R, BB, 0.1), [BB[0], BB[1] + 9])}"/>`;
  // batteries
  for (const b of all ? [400, 500, 750] : [o.b || 500]) {
    const a = mix(BB, H2, 0.16), z = mix(BB, H2, 0.16 + LEN[b]);
    s += `<g class="vl-bt" data-b="${b}"><path class="vl-bt-o" d="${ln(a, z)}"/><path class="vl-bt-i" d="${ln(a, z)}"/><path class="vl-led" d="${ln(mix(a, z, 0.12), mix(a, z, 0.88))}"/></g>`;
  }
  s += `<path class="vl-fk" d="${ln(H2, F)}"/><path class="vl-fo" d="${tubes}"/><path class="vl-fr" d="${tubes}"/><path class="vl-fo vl-thick" d="${ln(H1, H2)}"/><path class="vl-fr vl-thick" d="${ln(H1, H2)}"/>`;
  if (model === "pliant") s += `<circle class="vl-hinge" cx="${f((S[0] + H1[0]) / 2)}" cy="${f((S[1] + H1[1]) / 2)}" r="5"/>`;
  s += `<path class="vl-bar" d="${ln(H1, T)}M${T[0] - 14} ${T[1] + 2}L${T[0] + 22} ${T[1] - 3}"/><path class="vl-grip" d="M${T[0] + 14} ${T[1] - 1}L${T[0] + 24} ${T[1] - 3}"/>`;
  s += `<path class="vl-bar" d="${ln(S, SP)}"/><path class="vl-saddle" d="M${SP[0] - 20} ${SP[1] - 3}L${SP[0] + 16} ${SP[1] - 4}"/>`;
  s += `<circle class="vl-motor" cx="${BB[0]}" cy="${BB[1]}" r="13"/><circle class="vl-ring" cx="${BB[0]}" cy="${BB[1]}" r="7"/><path class="vl-bar" d="M${BB[0] - 14} ${BB[1] + 16}L${BB[0] + 14} ${BB[1] - 16}"/>`;
  const A = (k, inner) => (all || ac.has(k) ? `<g class="vl-ac vl-ac--${k}">${inner}</g>` : "");
  const rb = [R[0] - 18, g.rack];
  s += A("garde", `<path class="vl-fender" d="${arc(R, r + 7, -172, -22)}${arc(F, r + 7, -158, -8)}"/>`);
  s += A("panier", `<path class="vl-basket" d="M${H1[0] + 2} ${H1[1] - 18}h50l-7 32h-38zM${H1[0] + 14} ${H1[1] - 18}l2 32M${H1[0] + 27} ${H1[1] - 18}v32M${H1[0] + 40} ${H1[1] - 18}l-2 32"/>`);
  s += A("lampe", `<rect class="vl-lamp" x="${H1[0] + 5}" y="${H1[1] - 11}" width="11" height="8" rx="2"/><path class="vl-beam" d="M${H1[0] + 17} ${H1[1] - 8}L${H1[0] + 84} ${H1[1] - 26}V${H1[1] + 6}Z"/><rect class="vl-tail" x="${f(mix(R, S, 0.5)[0] - 9)}" y="${f(mix(R, S, 0.5)[1] - 2)}" width="6" height="12" rx="2"/>`);
  s += A("sacoche", `<path class="vl-fo" d="M${rb[0]} ${rb[1]}H${S[0] + 6}M${rb[0] + 8} ${rb[1]} ${R[0] - 4} ${R[1] - 20}"/><g class="vl-bag"><rect x="${R[0] - 22}" y="${rb[1]}" width="${model === "cargo" ? 38 : 30}" height="${model === "pliant" ? 28 : 38}" rx="6"/><path class="vl-led" d="M${R[0] - 14} ${rb[1] + 10}h${model === "cargo" ? 22 : 14}"/></g>`);
  s += A("bequille", `<path class="vl-stand" d="M${BB[0] - 8} ${BB[1] + 4}L${BB[0] - 30} 216"/>`);
  return `<g class="vl-m" data-m="${model}">${s}</g>`;
}
const bikeSvg = (inner, cls, label) => `<svg class="${cls}" viewBox="0 0 400 240" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${inner}</svg>`;
const bikeFig = (model, o = {}, cls = "vl-bike") => bikeSvg(bike(model, o), cls, `Dessin d'un vélo ${{ urbain: "urbain", cargo: "cargo", pliant: "pliant" }[model]} à assistance électrique`);

// ---------- ville filaire (scène du hero) ----------
const cityPath = (seed, base, minH, maxH, width, step) => {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; let d = "", x = 0;
  while (x < width) { const w = 38 + Math.floor(rnd() * 46), h = minH + Math.floor(rnd() * (maxH - minH)), y = base - h; d += `M${x} ${base}V${y}H${x + w}V${base}`; for (let k = 1; k * step < h - 10; k++) if (rnd() > 0.42) d += `M${x + 7} ${y + k * step}H${x + w - 7}`; if (rnd() > 0.6) d += `M${x + w / 2} ${y}V${y - 18}`; x += w + (rnd() > 0.5 ? 0 : 12); }
  return d;
};
const scene = () => {
  const near = cityPath(11, 410, 70, 230, 600, 26), far = cityPath(5, 410, 40, 150, 1240, 22);
  return `<svg class="vl-scene" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <g class="vl-city vl-city--far"><path d="${far}"/></g>
  <g class="vl-city vl-city--near"><g class="vl-city-run"><path d="${near}"/><path transform="translate(600 0)" d="${near}"/><path transform="translate(1200 0)" d="${near}"/></g></g>
  <path class="vl-road" d="M-20 570 1220 428M-20 618 1220 470"/><path class="vl-road-dash" d="M-20 594 1220 449"/>
  <g transform="translate(900 452) rotate(-6.4) scale(1.1) translate(-200 -218)"><g class="vl-ride">
    <g class="vl-trail"><path d="M-170 120H30"/><path d="M-130 148H20"/><path d="M-210 176H18" /><path d="M-110 204H26"/><path d="M-180 92H-40"/></g>
    ${bike("urbain", { b: 500, ac: ["lampe"] })}</g></g></svg>`;
};

// ---------- pictogrammes ----------
const IC = {
  conseil: '<circle cx="24" cy="22" r="10"/><path d="M6 56c2-14 10-20 18-20s16 6 18 20M40 12h18v14H48l-6 6z"/>',
  essai: '<circle cx="14" cy="46" r="10"/><circle cx="50" cy="46" r="10"/><path d="M14 46 26 24h16l8 22M26 24l8 22h-20M20 24h-4M40 24l-4-8h8"/>',
  livraison: '<path d="M4 18h34v26H4zM38 28h14l8 10v6H38z"/><circle cx="16" cy="48" r="6"/><circle cx="48" cy="48" r="6"/>',
  atelier: '<path d="M10 54 34 30M40 8a14 14 0 0 0-12 20l-18 18a5 5 0 0 0 8 8l18-18A14 14 0 0 0 52 24l-8 8-8-4-4-8z"/>',
  batterie: '<rect x="6" y="18" width="46" height="28" rx="4"/><path d="M52 27h6v10h-6M30 22 22 34h10l-8 10"/>',
  moteur: '<circle cx="32" cy="32" r="14"/><circle cx="32" cy="32" r="5"/><path d="M32 6v10M32 48v10M6 32h10M48 32h10M14 14l7 7M43 43l7 7M14 50l7-7M43 21l7-7"/>',
  frein: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="6"/><path d="M32 10v8M32 46v8M10 32h8M46 32h8"/>',
  chaine: '<circle cx="16" cy="32" r="10"/><circle cx="48" cy="32" r="6"/><path d="M16 22 48 26M16 42l32-4"/>',
  roue: '<circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="3"/><path d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49"/>',
  eclair: '<path d="M36 4 14 36h14l-4 24 26-34H36z"/>',
};
const ico = (k, cls = "vl-ico") => `<svg class="${cls}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
const arrow = '<svg class="vl-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h15M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>';
const chev = '<svg class="vl-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 4 8 8-8 8M13 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>';

// ---------- données ----------
const euro = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
const MODELS = [
  { id: "ville-s", base: "urbain", cat: "ville", name: "Ville S", tag: "Le quotidien sans effort", kg: "22,4", wh: 400, km: 70, price: 1890, col: "acide", text: "Cadre bas ou haut, garde-boues et éclairage intégrés : pour aller travailler sans y penser." },
  { id: "ville-gt", base: "urbain", cat: "ville", name: "Ville GT", tag: "Plus loin, plus vite", kg: "24,1", wh: 750, km: 130, price: 2690, col: "menthe", text: "Batterie longue durée et fourche suspendue pour les grands trajets et les pavés." },
  { id: "cargo-famille", base: "cargo", cat: "charge", name: "Cargo Famille", tag: "Deux enfants, un vélo", kg: "33,5", wh: 500, km: 80, price: 3190, col: "corail", text: "Longtail stable, double béquille et deux sièges enfants en option : l'école sans voiture." },
  { id: "cargo-pro", base: "cargo", cat: "charge", name: "Cargo Pro", tag: "Livrer sans émettre", kg: "36,2", wh: 750, km: 100, price: 3890, col: "graphite", text: "Charge utile de 150 kg, freins à disque renforcés et caisse modulable pour les tournées urbaines." },
  { id: "pliant-mini", base: "pliant", cat: "pliant", name: "Pliant Mini", tag: "Dans le train, sous le bureau", kg: "17,8", wh: 400, km: 55, price: 1590, col: "glace", text: "Se plie en dix secondes, se range dans un coffre et pèse moins qu'un gros sac de courses." },
  { id: "pliant-max", base: "pliant", cat: "pliant", name: "Pliant Max", tag: "Compact, mais endurant", kg: "19,5", wh: 500, km: 75, price: 1990, col: "acide", text: "Roues de 20 pouces, batterie plus grande et trois vitesses : la liberté des correspondances." },
];
const CATS = [["tous", "Tous les modèles"], ["ville", "Ville"], ["charge", "Charge"], ["pliant", "Pliants"]];

// ---------- en-tête et pied ----------
const batt = '<svg class="vl-batt-svg" viewBox="0 0 52 24" aria-hidden="true"><rect class="vl-batt-o" x="1.5" y="2.5" width="43" height="19" rx="3"/><rect class="vl-batt-c" x="46" y="8" width="4.5" height="8" rx="1"/>' + [0, 1, 2, 3, 4].map((i) => `<rect class="vl-seg" data-i="${i}" x="${5 + i * 7.8}" y="6" width="5.6" height="12" rx="1"/>`).join("") + "</svg>";
const header = (c) => `<header class="vl-head pk-bleed"><div class="vl-bar">
  <a class="vl-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="vl-logo-m" aria-hidden="true">${ico("eclair", "vl-logo-i")}</span><span class="vl-logo-t"><b>Volt</b><small>Vélos électriques</small></span></a>
  <div class="vl-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <div class="vl-batt" title="Charge de la page : votre progression de lecture"><span class="vl-sr">Progression de la page</span>${batt}<b data-vl-pct>0 %</b></div>
  <a class="vl-cta" href="/configurateur">Configurer</a>
  <details class="vl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="vl-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="vl-cta" href="/configurateur">Configurer mon vélo</a></div></details>
  </div></header>`;
const footer = (c) => `<footer class="vl-foot vl-b vl-b--l pk-bleed"><div class="vl-wrap vl-foot-in">
  <div class="vl-foot-brand"><div class="vl-foot-logo">Volt<i></i></div><p>Vélos à assistance électrique pour la ville : modèles urbains, cargos et pliants, assemblés et réglés dans notre atelier.</p><address>18 quai des Mobilités<br>69007 Lyon<br><a href="mailto:bonjour@volt.example">bonjour@volt.example</a></address></div>
  <div><p class="vl-ft">Explorer</p>${nav(c.menu.slice(0, 5), "vl-fl")}</div>
  <div><p class="vl-ft">Aide</p><a class="vl-fl" href="/contact">Contact</a><a class="vl-fl" href="/recherche">Recherche</a><a class="vl-fl" href="/entretien">Garanties</a></div>
  <div><p class="vl-ft">Atelier</p><p class="vl-foot-h">Mar – Ven : 9 h – 19 h<br>Samedi : 9 h – 17 h<br>Dimanche et lundi : fermé</p></div></div>
  <p class="vl-legal">© Volt — site de démonstration. Marque, modèles, prix, garanties et chiffres fictifs ; aucune commande n'est possible ici.</p></footer>`;
const pagehead = (kicker, title, sub, art) => sec(`<section class="vl-ph vl-b vl-b--r vl-dark pk-bleed"><div class="vl-wrap vl-ph-in"><div><p class="vl-kicker" data-reveal>${esc(kicker)}</p><div class="vl-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="vl-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${art ? `<div class="vl-ph-art" aria-hidden="true">${art}</div>` : ""}</div><div class="vl-ph-lines" aria-hidden="true"><i></i><i></i><i></i></div></section>`);
const cta = (title, text, href, label) => sec(`<section class="vl-cta-band vl-b vl-b--r vl-acid pk-bleed"><div class="vl-wrap vl-cta-in"><div><div class="vl-h2" role="heading" aria-level="2" data-reveal>${title}</div><p data-reveal>${esc(text)}</p></div><a class="vl-btn vl-btn--ink" href="${href}" data-reveal>${esc(label)} ${arrow}</a></div></section>`);
const FAQ = (items) => `<div class="vl-faq">${items.map(([q, a]) => `<details class="vl-q" data-reveal><summary>${esc(q)}<span class="vl-plus" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join("")}</div>`;

// ---------- cartes de modèles (blocs diagonaux) ----------
const card = (m, i) => `<article class="vl-mod vl-mod--${i % 3}" data-cat="${m.cat}" data-reveal><div class="vl-mod-art" data-col="${m.col}">${bikeFig(m.base, { b: m.wh, ac: m.base === "cargo" ? ["sacoche"] : ["lampe"] })}</div>
  <div class="vl-mod-t"><p class="vl-tag">${esc(m.tag)}</p><h3>${esc(m.name)}</h3><p>${esc(m.text)}</p><ul class="vl-spec"><li><b>${m.wh}</b> Wh</li><li><b>${m.km}</b> km</li><li><b>${m.kg}</b> kg</li></ul><div class="vl-mod-f"><span class="vl-price"><small>dès</small> ${euro(m.price)}</span><a class="vl-more" href="/configurateur" aria-label="Configurer le ${esc(m.name)}">Configurer ${arrow}</a></div></div></article>`;

const filters = (id = "modeles") => `<div class="vl-filters" role="group" aria-label="Filtrer les modèles" data-vl-filters="${id}">${CATS.map(([k, l], i) => `<a class="vl-chip${i ? "" : " is-on"}" href="#${k}" data-f="${k}"${i ? "" : ' aria-current="true"'}>${esc(l)}</a>`).join("")}</div>`;

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="vl-hero vl-b vl-b--l pk-bleed"><div class="vl-hero-bg" data-col="glace" aria-hidden="true"><div class="vl-slab"></div>${scene()}</div>
    <div class="vl-wrap vl-hero-in"><div class="vl-hero-copy"><p class="vl-kicker" data-reveal>Vélos électriques · Lyon · atelier-boutique</p>
      <div class="vl-h1" role="heading" aria-level="1"><span data-reveal>La ville file.</span><span data-reveal class="vl-h1-acc">Vous aussi.</span></div>
      <p class="vl-lead" data-reveal>Des vélos à assistance électrique pensés pour les trajets de tous les jours : urbain, cargo ou pliant. Composez le vôtre, estimez son autonomie, venez l'essayer à l'atelier.</p>
      <div class="vl-actions" data-reveal><a class="vl-btn vl-btn--acid" href="/configurateur">Composer mon vélo ${arrow}</a><a class="vl-btn vl-btn--line" href="/autonomie">Estimer l'autonomie</a></div>
      <ul class="vl-chips" data-reveal><li><b>25</b> km/h assistés</li><li><b>130</b> km max.</li><li><b>3</b> h pour 80 %</li></ul></div></div></section>`),
  sec(`<section class="vl-marq vl-b vl-dark pk-bleed" aria-hidden="true"><div class="vl-marq-track">${Array(2).fill(["Sans bruit", "Sans file", "Sans parking", "Sans essence", "Sans sueur", "Sans excuse"].map((w) => `<span>${w}</span><i></i>`).join("")).join("")}</div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-light pk-bleed"><div class="vl-wrap"><div class="vl-sechead"><div><p class="vl-kicker" data-reveal>Trois familles</p><h2 class="vl-h2" data-reveal>Un vélo pour chaque trajet.</h2></div><a class="vl-more" href="/modeles" data-reveal>Tous les modèles ${arrow}</a></div>
    <div class="vl-mods">${[MODELS[0], MODELS[2], MODELS[4]].map(card).join("")}</div><p class="vl-fine" data-reveal>Prix et autonomies indicatifs, donnés à titre de démonstration.</p></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--l vl-dark pk-bleed"><div class="vl-wrap vl-duo"><div><p class="vl-kicker" data-reveal>Le configurateur</p><h2 class="vl-h2" data-reveal>Changez la couleur, la batterie, les accessoires : le dessin suit.</h2>
    <p class="vl-lead" data-reveal>Choisissez le modèle, la teinte du cadre, la batterie de 400 à 750 Wh et vos accessoires. Le vélo se redessine, le prix indicatif et l'autonomie se mettent à jour, et le récapitulatif part vers notre conseiller.</p>
    <div class="vl-actions" data-reveal><a class="vl-btn vl-btn--acid" href="/configurateur">Ouvrir le configurateur ${arrow}</a></div></div>
    <div class="vl-duo-art" data-reveal><div class="vl-swatches" aria-hidden="true"><i data-col="acide"></i><i data-col="menthe"></i><i data-col="corail"></i><i data-col="glace"></i><i data-col="graphite"></i></div>${bikeFig("urbain", { b: 750, ac: ["garde", "lampe", "panier"] }, "vl-bike vl-bike--xl")}</div></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-light pk-bleed"><div class="vl-wrap"><p class="vl-kicker" data-reveal>En chiffres</p><h2 class="vl-h2" data-reveal>Fait pour durer, pensé pour rouler.</h2>
    <div class="vl-stats">${[["25", "km/h", "d'assistance, la limite légale"], ["130", "km", "d'autonomie maximale annoncée"], ["5", "ans", "de garantie sur le cadre (démonstration)"], ["3", "h", "pour recharger de 0 à 80 %"]].map(([n, u, t], i) => `<div class="vl-stat vl-stat--${i}" data-reveal><b data-count="${n}">${n}</b><span class="vl-stat-u">${u}</span><span class="vl-stat-t">${t}</span></div>`).join("")}</div></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--l vl-acid pk-bleed"><div class="vl-wrap"><p class="vl-kicker vl-kicker--d" data-reveal>Du choix à la route</p><h2 class="vl-h2" data-reveal>Quatre étapes, aucune paperasse inutile.</h2>
    <ol class="vl-steps">${[["conseil", "On vous écoute", "Trajet, charge, budget : un conseiller vous oriente en dix minutes."], ["essai", "Vous essayez", "Essai libre d'une heure à l'atelier, pavés et côtes comprises."], ["livraison", "On prépare", "Montage, réglages et mise à votre taille avant la remise."], ["atelier", "On suit", "Première révision offerte, puis entretien annuel à l'atelier."]].map(([k, t, d], i) => `<li class="vl-step vl-step--${i}" data-reveal><span class="vl-step-n">0${i + 1}</span>${ico(k)}<h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-light pk-bleed"><div class="vl-wrap vl-faq-wrap"><div><p class="vl-kicker" data-reveal>Questions fréquentes</p><h2 class="vl-h2" data-reveal>Avant de monter en selle.</h2><p class="vl-lead" data-reveal>Vous ne trouvez pas la vôtre ? <a href="/contact">Écrivez-nous</a>.</p></div>${FAQ([
    ["Faut-il un permis ou une assurance ?", "Non : un vélo à assistance limitée à 25 km/h est un vélo. Une assurance responsabilité civile ou vol reste conseillée."],
    ["Peut-on rouler sans la batterie ?", "Oui, le vélo reste un vélo. Il est simplement plus lourd à pédaler sans l'assistance."],
    ["Combien de temps dure une batterie ?", "Environ 500 cycles de charge complète avant de passer sous 70 % de capacité, soit plusieurs années d'usage quotidien."],
    ["Peut-on essayer avant d'acheter ?", "Oui, à l'atelier, sur rendez-vous : demandez-le depuis la page contact."],
  ])}</div></section>`),
  cta("Prêt à décoller du trafic ?", "Dites-nous votre trajet : nous vous proposons le vélo, la batterie et l'essai qui vont avec.", "/contact", "Parler à l'atelier"),
  sec(footer(c))];

// ---------- modèles ----------
const SPECS = [["Batterie", (m) => `${m.wh} Wh`], ["Autonomie max.", (m) => `${m.km} km`], ["Poids", (m) => `${m.kg} kg`], ["Prix indicatif", (m) => euro(m.price)]];
const modeles = (c) => [
  sec(header(c)),
  pagehead("Le catalogue", "Six vélos, <em>trois</em> façons de rouler.", "Urbains, cargos et pliants : filtrez, comparez, puis passez au configurateur.", bikeFig("cargo", { b: 750, ac: ["sacoche", "lampe"] }, "vl-bike")),
  sec(`<section class="vl-sec vl-b vl-b--l vl-light pk-bleed"><div class="vl-wrap">${filters()}<p class="vl-count" aria-live="polite"><b data-vl-n>6</b> modèles affichés</p><div class="vl-mods vl-mods--6" data-vl-list="modeles">${MODELS.map(card).join("")}</div></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-dark pk-bleed"><div class="vl-wrap"><p class="vl-kicker" data-reveal>Comparatif</p><h2 class="vl-h2" data-reveal>Tous les chiffres côte à côte.</h2>
    <div class="vl-tw" data-reveal><table class="vl-table"><caption class="vl-sr">Comparatif des six modèles</caption><thead><tr><th scope="col">Modèle</th>${SPECS.map(([l]) => `<th scope="col">${l}</th>`).join("")}<th scope="col">Famille</th></tr></thead><tbody>${MODELS.map((m) => `<tr><th scope="row" data-label="Modèle">${esc(m.name)}</th>${SPECS.map(([l, fn]) => `<td data-label="${l}">${fn(m)}</td>`).join("")}<td data-label="Famille">${{ ville: "Ville", charge: "Charge", pliant: "Pliant" }[m.cat]}</td></tr>`).join("")}</tbody></table></div><p class="vl-fine" data-reveal>Autonomie maximale en mode éco, cycliste léger, terrain plat. Pour votre cas, utilisez le <a href="/autonomie">comparateur d'autonomie</a>.</p></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--l vl-light pk-bleed"><div class="vl-wrap"><p class="vl-kicker" data-reveal>Comment choisir</p><h2 class="vl-h2" data-reveal>Trois questions suffisent.</h2><div class="vl-blocks">${[["Où roulez-vous ?", "Centre-ville dense : le pliant ou le Ville S. Périphérie et dénivelé : le Ville GT et sa grande batterie."], ["Que transportez-vous ?", "Un sac : n'importe lequel. Deux enfants ou des colis : un cargo, sans hésiter."], ["Où le rangez-vous ?", "Appartement sans cave : le pliant se range à l'intérieur. Local à vélos : tous les autres."]].map(([t, d], i) => `<div class="vl-block vl-block--${i}" data-reveal><span class="vl-block-n">${i + 1}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></div></section>`),
  cta("Votre vélo, à votre façon.", "Couleur, batterie, accessoires : composez-le et recevez le récapitulatif.", "/configurateur", "Ouvrir le configurateur"),
  sec(footer(c))];

// ---------- configurateur ----------
const OPT_M = [["urbain", "Urbain", 1890, "22.4", 22, 1, "Cadre bas, garde-boues, roues de 28 pouces."], ["cargo", "Cargo", 3190, "33.5", 34, 1.2, "Longtail, caisse arrière, charge 100 kg."], ["pliant", "Pliant", 1590, "17.8", 18, 1.05, "Roues de 20 pouces, se plie en 10 secondes."]];
const OPT_C = [["acide", "Vert acide", 0], ["menthe", "Menthe", 0], ["graphite", "Graphite", 0], ["glace", "Blanc glace", 40], ["corail", "Corail", 40]];
const OPT_B = [[400, 0, "2.4", "Ville, 30 à 70 km"], [500, 180, "2.9", "Mixte, 40 à 90 km"], [750, 420, "4.2", "Longue distance, 60 à 130 km"]];
const OPT_A = [["panier", "Panier avant", 59, "0.9"], ["garde", "Garde-boues", 49, "1.1"], ["lampe", "Éclairage intégré", 79, "0.3"], ["sacoche", "Porte-bagages et sacoches", 99, "1.4"], ["bequille", "Béquille", 25, "0.5"]];
const configurateur = (c) => [
  sec(header(c)),
  pagehead("Configurateur", "Composez <em>votre</em> vélo.", "Le dessin se redessine à chaque choix ; prix et autonomie sont indicatifs, le récapitulatif part vers notre conseiller.", ""),
  sec(`<section class="vl-cfg vl-b vl-b--l vl-light pk-bleed"><div class="vl-wrap vl-cfg-in" data-vl-cfg>
    <div class="vl-stage-w"><div class="vl-stage" data-m="urbain" data-b="500" data-col="acide" data-ac="lampe"><div class="vl-stage-lines" aria-hidden="true"><i></i><i></i><i></i></div>
      ${bikeSvg(["urbain", "cargo", "pliant"].map((m) => bike(m, { all: true })).join(""), "vl-bike vl-bike--stage", "Votre vélo, redessiné selon vos choix")}
      <div class="vl-stage-badge"><small>Prix indicatif</small><b data-vl-o="price">1 890 €</b></div></div>
      <ul class="vl-kpis" aria-live="polite"><li><span>Autonomie mixte</span><b data-vl-o="km">— km</b></li><li><span>Poids</span><b data-vl-o="kg">— kg</b></li><li><span>Batterie</span><b data-vl-o="wh">500 Wh</b></li></ul></div>
    <div class="vl-panel">
      <div class="vl-step-h"><span>1</span><p class="vl-lab">Modèle</p></div>
      <div class="vl-opts vl-opts--3" role="radiogroup" aria-label="Modèle" data-vl-group="m">${OPT_M.map(([k, n, p, kg, mass, kk, d]) => `<a class="vl-o" href="#${k}" data-v="${k}" data-p="${p}" data-kg="${kg}" data-mass="${mass}" data-k="${kk}" data-name="${n}"><b>${n}</b><small>dès ${euro(p)}</small><i>${d}</i></a>`).join("")}</div>
      <div class="vl-step-h"><span>2</span><p class="vl-lab">Couleur du cadre</p></div>
      <div class="vl-opts vl-opts--5" role="radiogroup" aria-label="Couleur du cadre" data-vl-group="col">${OPT_C.map(([k, n, p]) => `<a class="vl-o vl-o--sw" href="#c-${k}" data-v="${k}" data-p="${p}" data-name="${n}" title="${n}${p ? " (+ " + p + " €)" : ""}"><i class="vl-sw" data-col="${k}"></i><b>${n}</b><small>${p ? "+ " + p + " €" : "incluse"}</small></a>`).join("")}</div>
      <div class="vl-step-h"><span>3</span><p class="vl-lab">Batterie</p></div>
      <div class="vl-opts vl-opts--3" role="radiogroup" aria-label="Batterie" data-vl-group="b">${OPT_B.map(([wh, p, kg, d]) => `<a class="vl-o" href="#b-${wh}" data-v="${wh}" data-p="${p}" data-kg="${kg}" data-name="${wh} Wh"><b>${wh} Wh</b><small>${p ? "+ " + p + " €" : "incluse"}</small><i>${d}</i></a>`).join("")}</div>
      <div class="vl-step-h"><span>4</span><p class="vl-lab">Accessoires</p></div>
      <div class="vl-opts vl-opts--acc" role="group" aria-label="Accessoires" data-vl-group="ac">${OPT_A.map(([k, n, p, kg]) => `<a class="vl-o" href="#a-${k}" role="checkbox" aria-checked="false" data-v="${k}" data-p="${p}" data-kg="${kg}" data-name="${n}"><b>${n}</b><small>+ ${p} €</small></a>`).join("")}</div>
      <div class="vl-recap"><div class="vl-step-h"><span>5</span><p class="vl-lab">Votre récapitulatif</p></div><ul class="vl-recap-ul" data-vl-recap></ul><p class="vl-recap-tot"><span>Total indicatif</span><b data-vl-o="price2">1 890 €</b></p>
        <p class="vl-recap-txt" data-vl-recap-text></p><div class="vl-actions"><a class="vl-btn vl-btn--ink" href="/contact">Envoyer à un conseiller ${arrow}</a><a class="vl-btn vl-btn--line" href="#copier" data-vl-copy>Copier le récapitulatif</a></div><p class="vl-fine" role="status" data-vl-status>Prix indicatifs de démonstration : aucune commande n'est enregistrée. Sur la page contact, collez le récapitulatif dans votre message.</p></div>
    </div></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-dark pk-bleed"><div class="vl-wrap"><p class="vl-kicker" data-reveal>Bon à savoir</p><h2 class="vl-h2" data-reveal>Ce que le dessin ne montre pas.</h2><div class="vl-blocks">${[["Batterie amovible", "Elle se retire en un geste pour la recharger à l'intérieur, sur n'importe quelle prise."], ["Mise à votre taille", "Hauteur de selle, de guidon et position sont réglées à l'atelier avant la remise."], ["Évolutif", "Accessoires et batterie plus grande peuvent être ajoutés plus tard, à l'atelier."]].map(([t, d], i) => `<div class="vl-block vl-block--${i}" data-reveal><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></div></section>`),
  sec(footer(c))];

// ---------- autonomie ----------
const autonomie = (c) => [
  sec(header(c)),
  pagehead("Comparateur d'autonomie", "Combien de <em>kilomètres</em> ?", "Réglez votre poids, le relief et le niveau d'assistance : la formule est affichée, la courbe suit.", ""),
  sec(`<section class="vl-aut vl-b vl-b--l vl-light pk-bleed"><div class="vl-wrap vl-aut-in" data-vl-aut>
    <div class="vl-aut-ctl"><div class="vl-step-h"><span>A</span><p class="vl-lab">Vélo</p></div>
      <div class="vl-opts vl-opts--3" role="radiogroup" aria-label="Type de vélo" data-vl-group="v">${[["urbain", "Urbain", "22 kg", 22, 1], ["cargo", "Cargo", "34 kg", 34, 1.2], ["pliant", "Pliant", "18 kg", 18, 1.05]].map(([k, n, kg, mass, kk]) => `<a class="vl-o" href="#v-${k}" data-v="${k}" data-mass="${mass}" data-k="${kk}"><b>${n}</b><small>${kg}</small></a>`).join("")}</div>
      <div class="vl-step-h"><span>B</span><p class="vl-lab">Batterie</p></div>
      <div class="vl-opts vl-opts--3" role="radiogroup" aria-label="Batterie" data-vl-group="b">${[400, 500, 750].map((wh) => `<a class="vl-o" href="#b-${wh}" data-v="${wh}"><b>${wh} Wh</b></a>`).join("")}</div>
      <div class="vl-step-h"><span>C</span><p class="vl-lab">Assistance</p></div>
      <div class="vl-opts vl-opts--3" role="radiogroup" aria-label="Niveau d'assistance" data-vl-group="a">${[["eco", "Éco", "17 km/h"], ["tour", "Tour", "20 km/h"], ["turbo", "Turbo", "23 km/h"]].map(([k, n, s]) => `<a class="vl-o" href="#a-${k}" data-v="${k}"><b>${n}</b><small>${s} en moyenne</small></a>`).join("")}</div>
      <div class="vl-step-h"><span>D</span><p class="vl-lab">Conditions</p></div>
      <div data-vl-range="p" data-min="50" data-max="130" data-step="5" data-val="80" data-unit="kg" data-label="Poids du cycliste avec ses affaires"></div>
      <div data-vl-range="d" data-min="0" data-max="300" data-step="10" data-val="100" data-unit="m de dénivelé / 10 km" data-label="Relief du trajet"></div></div>
    <div class="vl-aut-res"><div class="vl-big" role="status" aria-live="polite" aria-atomic="true"><span class="vl-big-l">Autonomie estimée</span><b><span data-vl-o="km">—</span><small> km</small></b><span class="vl-big-s" data-vl-o="sub"></span></div>
      <div class="vl-modes" aria-label="Les trois niveaux d'assistance pour vos réglages">${[["eco", "Éco"], ["tour", "Tour"], ["turbo", "Turbo"]].map(([k, n]) => `<div class="vl-md" data-vl-m="${k}"><span>${n}</span><b>— km</b></div>`).join("")}</div>
      <figure class="vl-chart"><div data-vl-chart></div><figcaption>Autonomie selon le dénivelé, pour les trois niveaux d'assistance ; le point marque votre réglage.</figcaption></figure>
      <div class="vl-formula"><p class="vl-lab">La formule, avec vos chiffres</p><p data-vl-formula class="vl-ftxt"></p></div></div></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-dark pk-bleed"><div class="vl-wrap"><p class="vl-kicker" data-reveal>Comprendre</p><h2 class="vl-h2" data-reveal>Cinq choses qui font varier l'autonomie.</h2><div class="vl-blocks vl-blocks--4">${[["moteur", "L'assistance", "Turbo consomme environ deux fois plus d'énergie qu'éco sur le plat."], ["roue", "Les pneus", "Un pneu à 4 bars au lieu de 2,5 : jusqu'à 10 % d'énergie en moins."], ["chaine", "Le relief", "Chaque 100 m de montée pour 10 km coûte quelques wattheures par kilomètre."], ["batterie", "Le froid", "Sous 5 °C, la batterie rend moins : gardez-la au chaud avant de partir."]].map(([k, t, d], i) => `<div class="vl-block vl-block--${i}" data-reveal>${ico(k)}<h3>${t}</h3><p>${d}</p></div>`).join("")}</div><p class="vl-fine" data-reveal>Estimation simplifiée à but pédagogique : elle ne constitue pas un engagement de performance. Vent, pression des pneus et style de conduite changent le résultat.</p></div></section>`),
  cta("Votre trajet, notre conseil.", "Décrivez-nous votre parcours quotidien : nous vous dirons quelle batterie suffit vraiment.", "/contact", "Écrire à l'atelier"),
  sec(footer(c))];

// ---------- entretien et garanties ----------
const PLAN = [["batterie", "Batterie", "Tous les 6 mois", "Contrôle de capacité, nettoyage des contacts, mise à jour du logiciel.", "Vous : recharge entre 20 et 80 %"], ["frein", "Freins", "Tous les 1 000 km", "Épaisseur des plaquettes, purge si le levier devient mou.", "Atelier"], ["chaine", "Transmission", "Tous les 500 km", "Nettoyage et graissage de la chaîne, mesure de l'usure.", "Vous : graissage, 5 minutes"], ["roue", "Roues et pneus", "Chaque mois", "Pression, rayons, usure de la bande de roulement.", "Vous : pression"], ["moteur", "Moteur et capteurs", "Chaque année", "Diagnostic par l'outil de l'atelier, serrage du carter.", "Atelier"], ["eclair", "Éclairage", "Chaque mois", "Test des feux avant et arrière, remplacement de la pile du feu de secours.", "Vous"]];
const GAR = [["5 ans", "Cadre et fourche", "Défaut de fabrication, y compris soudures."], ["3 ans", "Moteur et contrôleur", "Pièces et main-d'œuvre à l'atelier."], ["2 ans", "Batterie", "Ou 500 cycles tant que la capacité reste au-dessus de 70 %."], ["2 ans", "Équipements", "Éclairage, écran, chargeur et accessoires d'origine."]];
const entretien = (c) => [
  sec(header(c)),
  pagehead("Entretien et garanties", "Un vélo <em>suivi</em> roule plus longtemps.", "Le plan d'entretien, ce que vous pouvez faire seul, et ce que couvrent nos garanties de démonstration.", ""),
  sec(`<section class="vl-sec vl-b vl-b--l vl-light pk-bleed"><div class="vl-wrap"><div class="vl-sechead"><div><p class="vl-kicker" data-reveal>Le plan d'entretien</p><h2 class="vl-h2" data-reveal>Qui fait quoi, et quand.</h2></div></div>
    <div class="vl-filters" role="group" aria-label="Filtrer le plan d'entretien" data-vl-filters="plan">${[["tous", "Tout"], ["vous", "Je peux le faire"], ["atelier", "À l'atelier"]].map(([k, l], i) => `<a class="vl-chip${i ? "" : " is-on"}" href="#${k}" data-f="${k}"${i ? "" : ' aria-current="true"'}>${l}</a>`).join("")}</div>
    <div class="vl-tw"><table class="vl-table vl-table--l"><caption class="vl-sr">Plan d'entretien</caption><thead><tr><th scope="col">Élément</th><th scope="col">Fréquence</th><th scope="col">Ce qu'on contrôle</th><th scope="col">Qui</th></tr></thead><tbody data-vl-list="plan">${PLAN.map(([k, n, fr, d, who]) => `<tr data-cat="${who.startsWith("Atelier") ? "atelier" : "vous"}"><th scope="row" data-label="Élément"><span class="vl-th">${ico(k, "vl-ico vl-ico--s")}${n}</span></th><td data-label="Fréquence">${fr}</td><td data-label="Contrôle">${d}</td><td data-label="Qui"><span class="vl-who">${who}</span></td></tr>`).join("")}</tbody></table></div></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-dark pk-bleed"><div class="vl-wrap vl-duo"><div><p class="vl-kicker" data-reveal>Prochaine révision</p><h2 class="vl-h2" data-reveal>Quand repasser nous voir ?</h2><p class="vl-lead" data-reveal>Indiquez combien de kilomètres vous roulez par semaine : nous calculons la date approximative des deux premières révisions.</p>
    <div class="vl-opts vl-opts--4" role="radiogroup" aria-label="Kilomètres par semaine" data-vl-group="rev" data-reveal>${[[10, "Occasionnel"], [30, "Quotidien"], [60, "Intensif"], [100, "Grand rouleur"]].map(([n, l]) => `<a class="vl-o" href="#r-${n}" data-v="${n}"><b>${n} km</b><small>${l}</small></a>`).join("")}</div></div>
    <div class="vl-rev" role="status" aria-live="polite" data-reveal><div class="vl-rev-i"><span>Première révision (500 km)</span><b data-vl-rev="1">—</b></div><div class="vl-rev-i"><span>Révision complète (2 000 km ou 1 an)</span><b data-vl-rev="2">—</b></div><p class="vl-fine">Estimation indicative. Elle ne remplace pas le carnet d'entretien.</p></div></div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--l vl-light pk-bleed"><div class="vl-wrap"><p class="vl-kicker" data-reveal>Nos garanties (démonstration)</p><h2 class="vl-h2" data-reveal>Ce qui est couvert.</h2><div class="vl-gar">${GAR.map(([y, t, d], i) => `<div class="vl-ga vl-ga--${i}" data-reveal><b>${y}</b><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
    <div class="vl-life" data-reveal><div><p class="vl-lab">Durée de vie de la batterie</p><p class="vl-lifep">Une recharge entre 20 et 80 % et un stockage au frais conservent la capacité bien plus longtemps qu'une charge à 100 % chaque jour. Courbes d'illustration, non contractuelles.</p></div>
    <div class="vl-life-box"><svg class="vl-life-svg" viewBox="0 0 520 260" role="img" aria-label="Courbes de capacité de la batterie selon le nombre de cycles, avec et sans bons gestes"><title>Capacité de la batterie selon les cycles de charge</title>
      <path class="vl-gridl" d="M50 20H500M50 70H500M50 120H500M50 170H500M50 220H500"/><path class="vl-axis" d="M50 20V220H500"/>
      <path class="vl-line-ok" d="M50 36C150 40 260 52 360 76S470 110 500 126"/><path class="vl-line-ko" d="M50 40C130 56 220 92 300 138S440 196 500 212"/>
      <path class="vl-thr" d="M50 150H500"/></svg><span class="vl-lt vl-lt--a">70 % : seuil de garantie</span><span class="vl-lt vl-lt--b">100 %</span><span class="vl-lt vl-lt--c">40 %</span><span class="vl-lt vl-lt--d">0</span><span class="vl-lt vl-lt--e">cycles de charge</span><span class="vl-lt vl-lt--f">1 000</span><span class="vl-lt vl-lt--ok">Bons gestes (20 à 80 %)</span><span class="vl-lt vl-lt--ko">Toujours à 100 %, au chaud</span></div>
    </div></section>`),
  sec(`<section class="vl-sec vl-b vl-b--r vl-dark pk-bleed"><div class="vl-wrap vl-faq-wrap"><div><p class="vl-kicker vl-kicker--d" data-reveal>Garanties</p><h2 class="vl-h2" data-reveal>Les cas qu'on nous demande.</h2></div>${FAQ([
    ["Une chute est-elle couverte ?", "Non, la garantie couvre les défauts de fabrication, pas les dommages dus à une chute ou à un accident."],
    ["Où faire réparer mon vélo ?", "À l'atelier, sur rendez-vous. Pour les petites pannes, comptez en général deux jours ouvrés."],
    ["Puis-je faire entretenir ailleurs ?", "Oui pour les opérations courantes. Le moteur et la batterie doivent être révisés par l'atelier pour rester sous garantie."],
    ["La batterie peut-elle être remplacée ?", "Oui, une batterie neuve peut être commandée à tout moment ; l'ancienne est reprise pour recyclage."],
  ])}</div></section>`),
  cta("Une question sur votre vélo ?", "Panne, réglage, garantie : l'atelier vous répond.", "/contact", "Contacter l'atelier"),
  sec(footer(c))];

// ---------- contact / recherche / introuvable ----------
const contact = (c) => [sec(header(c)), pagehead("Contact", "Parlons de <em>votre trajet</em>.", "Essai, conseil, devis ou récapitulatif du configurateur : écrivez-nous.", ""),
  { type: "form", heading: "Écrire à l'atelier", intro: "Décrivez votre trajet ou collez le récapitulatif de votre vélo : nous répondons sous deux jours ouvrés." },
  sec(`<section class="vl-sec vl-b vl-b--l vl-light pk-bleed"><div class="vl-wrap vl-duo"><div data-reveal><p class="vl-kicker">Où nous trouver</p><h2 class="vl-h2">18 quai des Mobilités.</h2><address class="vl-addr">Volt, atelier-boutique<br>18 quai des Mobilités, 69007 Lyon<br><a href="mailto:bonjour@volt.example">bonjour@volt.example</a></address><p class="vl-fine">Essais sur rendez-vous, bornes de recharge devant l'atelier.</p></div>
    <div class="vl-hours" data-reveal><p class="vl-lab">Horaires</p><table class="vl-table vl-table--s"><caption class="vl-sr">Horaires de l'atelier</caption><tbody>${[["Lundi", "Fermé"], ["Mardi – Vendredi", "9 h – 19 h"], ["Samedi", "9 h – 17 h"], ["Dimanche", "Fermé"]].map(([d, h]) => `<tr><th scope="row" data-label="Jour">${d}</th><td data-label="Horaires">${h}</td></tr>`).join("")}</tbody></table></div></div></section>`),
  { type: "layout", children: [{ type: "map", props: { address: "18 quai des Mobilités, 69007 Lyon", zoom: 14, height: 360 } }] },
  sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Recherche", "Une info <em>rapide</em> ?", "Un modèle, une garantie, un conseil d'entretien.", ""), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="vl-404 vl-b vl-b--l vl-dark pk-bleed"><div class="vl-wrap vl-404-in"><div><p class="vl-kicker">Crevaison</p><div class="vl-h1" role="heading" aria-level="1"><span>Page</span><span class="vl-h1-acc">introuvable.</span></div><p class="vl-lead">Cette page n'existe pas ou a changé d'adresse. Remontez en selle : l'accueil n'est pas loin.</p><div class="vl-actions"><a class="vl-btn vl-btn--acid" href="/">Retour à l'accueil ${arrow}</a><a class="vl-btn vl-btn--line" href="/recherche">Rechercher</a></div></div>
  <div class="vl-404-art" aria-hidden="true"><svg viewBox="0 0 260 260"><circle class="vl-tire" cx="130" cy="130" r="100"/><circle class="vl-rim" cx="130" cy="130" r="92"/><path class="vl-spk" d="M130 38V222M38 130H222M65 65 195 195M195 65 65 195"/><circle class="vl-hub" cx="130" cy="130" r="9"/><path class="vl-flat" d="M62 214c20-12 40-8 56 0s36 12 62-2"/></svg><b class="vl-404-t">404</b></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "volt", name: "Volt", version: "2.0.0", category: "auto", tags: ["moderne", "audacieux", "geometrique"], siteType: "Vélos électriques et mobilité urbaine", featured: true,
  concept: "Un vélo électrique dessiné en diagonale dans une ville filaire, une barre de navigation inclinée à jauge de batterie, un configurateur qui redessine le vélo et un comparateur d'autonomie à courbe.",
  description: "Vélos électriques urbains, cargos et pliants : vert acide sur gris-blanc froid et noir graphite, angles inclinés, vélo SVG en traînée de vitesse, configurateur de vélo, comparateur d'autonomie, entretien et garanties.",
  brand: "Volt Vélos électriques", modules: ["formulaires", "recherche"],
  dna: { header: "barre-parallelogramme-inclinee-avec-jauge-de-batterie-liee-au-defilement", hero: "velo-en-diagonale-traversant-une-ville-filaire-avec-trainee-de-vitesse", grid: "blocs-diagonaux-en-parallelogrammes-chevauches", motion: "trainee-de-vitesse-roues-qui-tournent-et-batterie-qui-se-charge", shapes: "clip-path-diagonal-parallelogrammes-chevrons-et-bandes-en-biais", rhythm: "bandes-en-biais-clair-graphite-et-vert-acide-qui-se-chevauchent", signature: "configurateur-de-velo-redessine-en-svg-et-comparateur-d-autonomie-a-courbe" },
  tokens: {
    colors: { primary: "#b6f400", secondary: "#14181c", accent: "#0e6b3b", background: "#eceff1", surface: "#ffffff", text: "#14181c", muted: "#4b5660", success: "#0e6b3b", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.kanit", body: "font.golos-text", button: "font.kanit", link: "font.golos-text" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#14181c" },
    type: { h1: { size: 88, weight: 800, lineHeight: 0.98, transform: "uppercase" }, h2: { size: 48, weight: 800, lineHeight: 1.04, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Vert de la marque", type: "color", default: "#b6f400" },
    { key: "cut", label: "Inclinaison des angles (px)", type: "range", default: 28, min: 12, max: 48, step: 4 },
    { key: "trail", label: "Traînée de vitesse et roues", type: "choice", default: "on", choices: [["on", "En mouvement"], ["off", "Immobiles"]] },
    { key: "city", label: "Ville filaire du hero", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masquée"]] },
    { key: "gauge", label: "Jauge de batterie de la barre", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masquée"]] },
  ],
  menu: [["Accueil", "/"], ["Modèles", "/modeles"], ["Configurateur", "/configurateur"], ["Autonomie", "/autonomie"], ["Entretien", "/entretien"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "modeles", name: "Modèles", render: modeles }, { key: "configurateur", name: "Configurateur", render: configurateur },
    { key: "autonomie", name: "Autonomie", render: autonomie }, { key: "entretien", name: "Entretien et garanties", render: entretien }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
