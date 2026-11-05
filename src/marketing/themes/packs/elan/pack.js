// Élan — ONG / association humanitaire (fictive). Direction artistique : reportage documentaire. Crème, noir doux, rouge-orangé ; gravures SVG en aplats granuleux,
// titres Merriweather, chiffre d'impact animé, témoignages en alternance et module de don de démonstration (jamais de saisie bancaire).
const { sec, form, esc, nav } = require("../kit");

/* ---------- gravures : personnes et lieux en aplats (aucun identifiant : pas de dégradé nommé) ---------- */
const f = (n) => Math.round(n * 10) / 10;
const SK = ["#7a4a2b", "#5e3720", "#8f5d3a", "#4a2b18"];
const person = (x, y, h, cloth, skin, o = {}) => {
  const w = h * 0.19, r = h * 0.095, hy = y - h + r + 1;
  const hair = o.scarf
    ? `<path d="M${f(x - r * 1.15)} ${f(hy + r * 0.3)}Q${x} ${f(hy - r * 2)} ${f(x + r * 1.15)} ${f(hy + r * 0.3)}Q${x} ${f(hy - r * 0.2)} ${f(x - r * 1.15)} ${f(hy + r * 0.3)}Z" fill="${o.scarf}"/>`
    : `<path d="M${f(x - r)} ${f(hy)}Q${x} ${f(hy - r * 1.6)} ${f(x + r)} ${f(hy)}Q${x} ${f(hy - r * 0.6)} ${f(x - r)} ${f(hy)}Z" fill="#1d1815"/>`;
  return `<g>${o.jar ? `<ellipse cx="${x}" cy="${f(hy - r - h * 0.06)}" rx="${f(r * 1.5)}" ry="${f(h * 0.085)}" fill="#b5651d"/><rect x="${f(x - r)}" y="${f(hy - r - h * 0.02)}" width="${f(r * 2)}" height="${f(h * 0.03)}" fill="#8a4a12"/>` : ""}<path d="M${f(x - w)} ${y}L${f(x - w * 0.85)} ${f(y - h * 0.7)}Q${x} ${f(y - h * 0.84)} ${f(x + w * 0.85)} ${f(y - h * 0.7)}L${f(x + w)} ${y}Z" fill="${cloth}"/><circle cx="${x}" cy="${f(hy)}" r="${f(r)}" fill="${skin}"/>${hair}</g>`;
};
const lab = (a) => (a ? `role="img" aria-label="${esc(a)}"` : `aria-hidden="true"`);
const hatch = (x, y, w, h, step, col, op = 0.22) => { let s = ""; for (let i = step; i < w + h; i += step) s += `M${x + Math.min(i, w)} ${y + Math.max(0, i - w)}L${x + Math.max(0, i - h)} ${y + Math.min(i, h)}`; return `<path d="${s}" stroke="${col}" stroke-width="1.2" opacity="${op}" fill="none"/>`; };
const C = { red: "#c8321a", ochre: "#e8a33d", cream: "#f7f0e4", ink: "#1d1815", sand: "#d9c3a0", slate: "#3b3430", water: "#5d7f87", clay: "#a8553a", olive: "#6b6a3a" };
const frame = (sky, sun, far, near, ground) => `<rect width="400" height="300" fill="${sky}"/><circle cx="318" cy="84" r="46" fill="${sun}" opacity=".95"/><circle cx="318" cy="84" r="62" fill="${sun}" opacity=".18"/><path d="M0 190C60 150 120 160 190 178S330 150 400 172V300H0Z" fill="${far}"/>${hatch(0, 168, 400, 40, 9, C.ink, 0.12)}<path d="M0 232C80 214 150 226 230 218S340 212 400 224V300H0Z" fill="${near}"/><rect y="252" width="400" height="48" fill="${ground}"/>`;
const hut = (x, y, w, h, wall, roof) => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${wall}"/><path d="M${x - 6} ${y - h}L${f(x + w / 2)} ${y - h - 24}L${x + w + 6} ${y - h}Z" fill="${roof}"/><rect x="${f(x + w * 0.38)}" y="${y - h * 0.55}" width="${f(w * 0.24)}" height="${f(h * 0.55)}" fill="${C.ink}" opacity=".7"/>`;
const SCENES = {
  eau: (a) => `<svg class="el-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" ${lab(a)}>${frame("#f1c68a", C.red, "#b98557", "#8d5a3a", "#6d4228")}${hut(36, 238, 62, 44, C.sand, C.slate)}${hut(300, 232, 70, 50, C.sand, C.clay)}<rect x="168" y="196" width="72" height="56" fill="${C.slate}"/><rect x="176" y="204" width="56" height="48" fill="${C.water}"/><rect x="160" y="170" width="6" height="40" fill="${C.ink}"/><rect x="242" y="170" width="6" height="40" fill="${C.ink}"/><path d="M152 172L204 142 256 172Z" fill="${C.red}"/><path d="M204 172V214" stroke="${C.ink}" stroke-width="2"/><rect x="198" y="212" width="12" height="10" fill="#b5651d"/>${person(112, 266, 96, C.red, SK[0], { jar: 1, scarf: C.ochre })}${person(276, 270, 100, C.cream, SK[1])}${person(304, 272, 54, C.ochre, SK[2])}<path d="M0 262C100 254 300 270 400 258V300H0Z" fill="${C.ink}" opacity=".16"/></svg>`,
  ecole: (a) => `<svg class="el-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" ${lab(a)}><rect width="400" height="300" fill="#e9d6b3"/><rect y="236" width="400" height="64" fill="#8d5a3a"/>${hatch(0, 236, 400, 64, 10, C.ink, 0.15)}<rect x="40" y="46" width="320" height="130" fill="${C.slate}" stroke="#8a6a48" stroke-width="8"/><path d="M62 92c30-18 52 14 86-2s48 10 74-4M62 128h140M240 120l40-30M240 90l40 30" fill="none" stroke="${C.cream}" stroke-width="3" opacity=".8" stroke-linecap="round"/><circle cx="318" cy="84" r="18" fill="${C.ochre}"/><rect x="60" y="200" width="90" height="10" fill="#6d4228"/><rect x="70" y="210" width="6" height="36" fill="#6d4228"/><rect x="134" y="210" width="6" height="36" fill="#6d4228"/><rect x="240" y="200" width="90" height="10" fill="#6d4228"/><rect x="250" y="210" width="6" height="36" fill="#6d4228"/><rect x="314" y="210" width="6" height="36" fill="#6d4228"/>${person(104, 202, 78, C.red, SK[2])}${person(284, 202, 78, C.ochre, SK[0])}${person(188, 252, 126, C.cream, SK[1], { scarf: C.red })}<rect x="82" y="190" width="30" height="10" fill="${C.cream}"/><rect x="262" y="190" width="30" height="10" fill="${C.cream}"/></svg>`,
  soins: (a) => `<svg class="el-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" ${lab(a)}>${frame("#efd2a6", C.ochre, "#c79a6a", "#9a6844", "#6d4228")}<path d="M70 252V152L180 96 290 152V252Z" fill="${C.cream}"/><path d="M70 152L180 96 290 152Z" fill="#e6d9c2"/>${hatch(70, 152, 220, 100, 12, C.ink, 0.1)}<rect x="168" y="168" width="24" height="64" fill="${C.red}"/><rect x="148" y="188" width="64" height="24" fill="${C.red}"/><rect x="226" y="198" width="44" height="54" fill="${C.ink}" opacity=".75"/>${person(98, 270, 104, C.red, SK[3], { scarf: C.cream })}${person(332, 272, 106, C.ochre, SK[0], { scarf: C.red })}${person(300, 274, 50, C.cream, SK[2])}<path d="M0 266C100 258 300 274 400 262V300H0Z" fill="${C.ink}" opacity=".16"/></svg>`,
  abri: (a) => `<svg class="el-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" ${lab(a)}>${frame("#e8bf93", C.red, "#a87a52", "#7d5233", "#5e3b24")}${hut(26, 240, 70, 52, C.sand, C.slate)}${hut(116, 244, 80, 62, "#e6d2ac", C.red)}<path d="M206 244L252 176 298 244Z" fill="${C.olive}"/><path d="M252 176V244" stroke="${C.ink}" stroke-width="2" opacity=".5"/><path d="M290 244L330 192 370 244Z" fill="${C.clay}"/><rect x="96" y="150" width="10" height="64" fill="${C.ink}" opacity=".6"/>${person(218, 276, 98, C.cream, SK[1])}${person(366, 278, 56, C.ochre, SK[0])}<path d="M200 190l14 14M210 190l-14 14" stroke="${C.ink}" stroke-width="3"/><path d="M0 268C100 260 300 276 400 264V300H0Z" fill="${C.ink}" opacity=".16"/></svg>`,
  repas: (a) => `<svg class="el-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" ${lab(a)}><rect width="400" height="300" fill="#e7c9a0"/><rect y="238" width="400" height="62" fill="#7d5233"/>${hatch(0, 238, 400, 62, 10, C.ink, 0.15)}<path d="M120 146C120 110 160 112 160 146M170 130c-10-18 14-24 4-44M196 134c-10-16 14-24 4-42" fill="none" stroke="${C.ink}" stroke-width="3" opacity=".3" stroke-linecap="round"/><path d="M90 168h140c0 40-24 64-70 64s-70-24-70-64Z" fill="${C.ink}"/><rect x="84" y="162" width="152" height="10" fill="${C.slate}"/><path d="M96 212l-22 30M224 212l22 30" stroke="${C.ink}" stroke-width="6"/>${person(280, 262, 124, C.red, SK[0], { scarf: C.cream })}${person(52, 266, 100, C.ochre, SK[2])}${person(334, 270, 58, C.cream, SK[1])}${person(368, 272, 50, C.ochre, SK[3])}<ellipse cx="318" cy="222" rx="14" ry="5" fill="${C.cream}"/></svg>`,
  crue: (a) => `<svg class="el-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" ${lab(a)}><rect width="400" height="300" fill="#d6b894"/><circle cx="72" cy="74" r="40" fill="${C.red}" opacity=".9"/><path d="M0 150C70 120 150 138 220 120S340 110 400 134V300H0Z" fill="#b08b64"/>${hatch(0, 120, 400, 50, 8, C.ink, 0.12)}<path d="M0 196C60 184 90 206 150 194S250 184 310 198 380 190 400 194V300H0Z" fill="${C.water}"/><path d="M0 230c30-10 50 10 90 0s60-10 100 0 70 10 110 0 70-8 100 0V300H0Z" fill="#46676f"/>${hut(20, 206, 60, 40, C.sand, C.slate)}${hut(318, 204, 64, 44, C.sand, C.clay)}<path d="M120 236L150 252H260L290 236Z" fill="${C.slate}"/><rect x="198" y="188" width="5" height="48" fill="${C.ink}"/><path d="M203 190L240 222H203Z" fill="${C.cream}"/>${person(160, 240, 70, C.red, SK[0], { scarf: C.cream })}${person(244, 242, 64, C.ochre, SK[2])}<path d="M30 280c40-10 90 4 140-4M230 282c50-10 100 2 160-6" stroke="${C.cream}" stroke-width="2" opacity=".35" fill="none"/></svg>`,
};
const plate = (kind, alt, cap, cls = "") => `<figure class="el-plate ${cls}">${SCENES[kind](alt)}<span class="el-grain" aria-hidden="true"></span>${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}</figure>`;

const portrait = (bg, cloth, skin, scarf) => `<svg class="el-portrait" viewBox="0 0 120 140" role="img" aria-label="Portrait illustré"><rect width="120" height="140" fill="${bg}"/>${hatch(0, 0, 120, 140, 9, C.ink, 0.1)}${person(60, 140, 118, cloth, skin, scarf ? { scarf } : {})}</svg>`;

const ico = {
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C5 15.5 2 12 2 8.2 2 5.4 4.2 3.5 6.7 3.5c2 0 3.6 1.1 5.3 3.3 1.7-2.2 3.3-3.3 5.3-3.3C19.8 3.5 22 5.4 22 8.2 22 12 19 15.5 12 21Z" fill="currentColor"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`,
  drop: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-13Z" fill="currentColor"/></svg>`,
  bowl: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11h18c0 5-3.5 8-9 8s-9-3-9-8Z" fill="currentColor"/><path d="M8 8c0-2 2-2 1-4M13 8c0-2 2-2 1-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5c4-1.5 7-1 9 1 2-2 5-2.500 9-1v14c-4-1.500-7-1-9 1-2-2-5-2.500-9-1Z" fill="currentColor"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" fill="currentColor"/></svg>`,
};

const header = (c) => `<header class="el-head pk-bleed">
  <div class="el-alert"><span class="el-pulse" aria-hidden="true"></span><span>Urgence (scénario fictif) : crue dans la vallée d'Orun.</span> <a href="/mission">Suivre la mission</a></div>
  <div class="el-bar"><a class="el-logo" href="/" aria-label="${esc(c.brand)} — accueil"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#c8321a"/><path d="M10 27c4-1 7-5 8-12 1 6 4 9 12 9-5 1-8 4-9 9-1-4-4-6-11-6Z" fill="#f7f0e4"/></svg><span>Élan<small>Secours &amp; avenir</small></span></a>
    <div class="el-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <a class="el-give" href="/agir">${ico.heart}<span>Donner</span></a>
    <details class="el-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="el-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="el-give el-give--wide" href="/agir">${ico.heart}<span>Faire un don</span></a></div></details>
  </div></header>`;

const footer = (c) => `<footer class="el-foot pk-bleed"><div class="el-wrap">
  <div class="el-foot-top"><div><div class="el-foot-logo">Élan</div><p class="el-foot-lead">Secourir vite. Rester longtemps. Rendre des comptes.</p><a class="el-give" href="/agir">${ico.heart}<span>Donner</span></a></div>
  <div><h3>L'association</h3>${nav(c.menu.slice(1, 6), "el-fl")}</div><div><h3>S'engager</h3><a class="el-fl" href="/agir">Faire un don</a><a class="el-fl" href="/agir">Devenir bénévole</a><a class="el-fl" href="/contact">Mécénat d'entreprise</a><a class="el-fl" href="/contact">Presse</a></div>
  <div><h3>Contact</h3><address>Maison Élan, 8 rue des Fontaines<br>Ville fictive</address><a class="el-fl" href="/contact">Nous écrire</a><a class="el-fl" href="/recherche">Rechercher</a></div></div>
  <p class="el-legal">© Élan — site de démonstration. Association, lieux, personnes, chiffres et appels à dons imaginaires : aucun paiement n'est collecté et aucune donnée bancaire n'est demandée.</p></div></footer>`;

const pagehead = (kicker, title, sub, kind) => sec(`<section class="el-ph pk-bleed"><div class="el-wrap el-ph-in"><div><p class="el-kicker" data-reveal>${esc(kicker)}</p><div class="el-giant" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="el-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${kind ? plate(kind, "", "", "el-ph-art") : ""}</div></section>`);

/* ---------- données (fictives) ---------- */
const MISSIONS = [
  { k: "eau", cat: "eau", ic: "drop", t: "Eau claire dans la vallée d'Orun", lieu: "Vallée d'Orun", x: "Puits protégés, filtres et comités d'entretien : 38 villages ont de l'eau saine toute l'année.", p: 68, href: "/mission", alt: "Une femme porte une jarre près d'un puits, un enfant la suit" },
  { k: "ecole", cat: "education", ic: "book", t: "Écoles ouvertes sur le plateau de Marel", lieu: "Plateau de Marel", x: "Salles de classe réparées, kits scolaires et cantines pour que les filles comme les garçons restent en classe.", p: 54, href: "/missions", alt: "Une maîtresse et deux élèves devant un tableau noir" },
  { k: "soins", cat: "sante", ic: "cross", t: "Soins de proximité dans le delta de Kasi", lieu: "Delta de Kasi", x: "Postes de soins mobiles, suivi des enfants dénutris et formation d'agentes de santé locales.", p: 77, href: "/missions", alt: "Une infirmière et une mère devant un poste de soins" },
  { k: "abri", cat: "abri", ic: "heart", t: "Abris durables sur les berges de Tamba", lieu: "Berges de Tamba", x: "Maisons surélevées bâties avec les familles, matériaux locaux et formation aux techniques anti-crue.", p: 41, href: "/missions", alt: "Des familles bâtissent des abris sur une berge" },
  { k: "repas", cat: "alimentation", ic: "bowl", t: "Cantines solidaires des Salines", lieu: "Quartier des Salines", x: "Un repas chaud par jour pour les enfants et les personnes âgées, cuisiné par des habitantes.", p: 82, href: "/missions", alt: "Des cuisinières servent un repas chaud à des enfants" },
  { k: "crue", cat: "urgence", ic: "heart", t: "Réponse d'urgence aux crues", lieu: "Vallée d'Orun, berges de Tamba", x: "Barques, kits d'hygiène, couvertures et alerte précoce quand le fleuve monte.", p: 33, href: "/mission", alt: "Une barque évacue deux habitantes dans un village inondé" },
];
const CATS = [["tout", "Toutes"], ["eau", "Eau"], ["education", "Éducation"], ["sante", "Santé"], ["abri", "Abri"], ["alimentation", "Alimentation"], ["urgence", "Urgence"]];
const bar = (p) => `<div class="el-meter" role="img" aria-label="${p} % de l'objectif atteint"><span class="el-fill el-w${p}" data-reveal></span></div>`;
const mcard = (m, i, big) => `<article class="el-mcard${big ? " el-mcard--big" : ""}" data-cat="${m.cat}" data-reveal>${plate(m.k, m.alt, "")}<div class="el-mc-body"><p class="el-tag">${ico[m.ic]}<span>${esc(m.lieu)}</span></p><h3><a href="${m.href}">${esc(m.t)}</a></h3><p>${esc(m.x)}</p>${bar(m.p)}<p class="el-meter-t"><b>${m.p} %</b> de l'objectif 2026 financé (chiffre fictif)</p></div></article>`;

const STORIES = [
  { k: "eau", alt: "Une femme et son enfant près d'un puits", cap: "Planche II — le puits de Sorèle", q: "Avant, je marchais deux heures pour une jarre. Maintenant, mon fils arrive à l'école à l'heure, et moi je tiens le registre du puits.", who: "Amina, 34 ans, Sorèle", facts: [["2 h", "de marche économisées par jour"], ["310", "habitants desservis"]] },
  { k: "ecole", alt: "Des élèves en classe avec leur maîtresse", cap: "Planche III — la classe de Mme Dara", q: "On a repeint le tableau avec les parents. La première semaine, il y avait sept filles de plus. La semaine suivante, onze.", who: "Dara, institutrice, plateau de Marel", facts: [["+38 %", "d'élèves filles en deux ans"], ["14", "classes remises en état"]] },
  { k: "soins", alt: "Une infirmière examine un enfant dans un poste de soins", cap: "Planche IV — le poste mobile de Kasi", q: "Je ne suis pas médecin, mais je sais reconnaître le danger. Hier, j'ai envoyé un enfant à temps. C'est ça, notre victoire.", who: "Léa, agente de santé, delta de Kasi", facts: [["1 900", "consultations par trimestre"], ["22", "agentes formées"]] },
];
const story = (s, i) => `<article class="el-story${i % 2 ? " el-story--rev" : ""}">${plate(s.k, s.alt, s.cap)}<div class="el-story-txt" data-reveal><p class="el-kicker">Histoire ${["I", "II", "III"][i]} · récit fictif de démonstration</p><blockquote><p>« ${esc(s.q)} »</p><footer>${esc(s.who)}</footer></blockquote><ul class="el-facts">${s.facts.map(([n, l]) => `<li><b>${n}</b><span>${l}</span></li>`).join("")}</ul></div></article>`;

const NEWS = [
  ["Terrain", "La crue de l'Orun : 1 200 familles évacuées à temps", "Grâce à l'alerte précoce et aux barques prépositionnées, aucun village n'a été coupé plus de six heures.", "12 oct. 2026", "crue"],
  ["Récits", "Dara et les onze filles du premier rang", "Portrait d'une institutrice qui a décidé de rouvrir l'école avant même la fin des travaux.", "3 oct. 2026", "ecole"],
  ["Rapports", "Rapport d'activité 2025 : ce que nous avons fait, ce que nous n'avons pas pu faire", "Nous publions aussi nos échecs : trois puits à reprendre, un projet suspendu.", "21 sept. 2026", "soins"],
  ["Terrain", "Cantine des Salines : 90 000 repas servis depuis janvier", "Cuisinières, livreurs, bénévoles : l'envers du décor d'une cantine de quartier.", "9 sept. 2026", "repas"],
  ["Récits", "Une maison qui monte avec l'eau", "Reportage sur les premiers abris surélevés des berges de Tamba.", "28 août 2026", "abri"],
  ["Rapports", "Comment nous choisissons nos missions", "Critères, comités locaux, indicateurs : la méthode, étape par étape.", "5 août 2026", "eau"],
];
const ncard = (n, big) => `<article class="el-news${big ? " el-news--big" : ""}" data-cat="${n[0].toLowerCase().replace("é", "e")}" data-reveal>${plate(n[4], "", "")}<div><p class="el-tag"><span>${n[0]}</span> <time>${n[3]}</time></p><h3><a href="/contact">${esc(n[1])}</a></h3><p>${esc(n[2])}</p></div></article>`;

/* ---------- module de don (démonstration) ---------- */
const donation = (cls = "") => `<div class="el-don ${cls}" data-don>
  <p class="el-don-tag"><span class="el-dot" aria-hidden="true"></span>Module de démonstration : aucun paiement, aucune donnée bancaire.</p>
  <p class="el-fl2">Je donne</p>
  <div class="el-seg" role="radiogroup" aria-label="Fréquence du don"><a href="#mensuel" role="radio" aria-checked="true" data-freq="month">Chaque mois</a><a href="#ponctuel" role="radio" aria-checked="false" data-freq="once">Une seule fois</a></div>
  <p class="el-fl2">Montant</p>
  <div class="el-amts" role="radiogroup" aria-label="Montants rapides">${[15, 30, 60, 120].map((a, i) => `<a href="#montant-${a}" role="radio" aria-checked="${i === 1}" data-amt="${a}">${a} €</a>`).join("")}</div>
  <div class="el-step" role="group" aria-label="Autre montant"><a href="#moins" data-step="-5" aria-label="Retirer 5 euros">−</a><span class="el-amount" data-out="amount">30 €</span><a href="#plus" data-step="5" aria-label="Ajouter 5 euros">+</a><small>Autre montant : par pas de 5 €, de 5 à 500 €</small></div>
  <p class="el-fl2">Pour</p>
  <div class="el-causes" role="radiogroup" aria-label="Cause soutenue">${[["eau", "Eau claire", "drop"], ["repas", "Repas chauds", "bowl"], ["ecole", "École", "book"], ["soins", "Soins", "cross"]].map(([k, l, i], n) => `<a href="#cause-${k}" role="radio" aria-checked="${n === 0}" data-cause="${k}">${ico[i]}<span>${l}</span></a>`).join("")}</div>
  <div class="el-res" role="status" aria-live="polite">
    <p class="el-sum">Votre don : <b data-out="sum">30 € par mois</b></p>
    <p class="el-eq"><b data-out="eq">5 mois d'eau potable</b><span data-out="eqtxt">pour une famille entière</span></p>
    <p class="el-year" data-out="year">Sur un an : 360 €, soit 60 mois d'eau potable.</p>
    <p class="el-tax">Déduction fiscale indicative, calcul de démonstration à 66 % : <b data-out="net">coût réel 10,20 €</b></p>
  </div>
  <a class="el-btn el-btn--block el-btn--lg" href="/contact" data-recap>${ico.heart}<span>Envoyer ce récapitulatif</span></a>
  <p class="el-fine">L'étape finale est le formulaire de contact : le récapitulatif est copié pour que vous puissiez le coller. Équivalences et taux fictifs, sans valeur contractuelle.</p>
</div>`;

const impact = () => `<section class="el-impact pk-bleed"><div class="el-wrap"><ul class="el-impact-in">
  <li data-reveal><b data-count="90000">90 000</b><span>repas chauds servis depuis janvier</span></li><li data-reveal><b data-count="126">126</b><span>villages et quartiers</span></li><li data-reveal><b data-count="312">312</b><span>bénévoles actifs</span></li><li data-reveal><b data-count="82" data-suffix=" %">82 %</b><span>des ressources vont aux missions</span></li></ul>
  <p class="el-live" data-reveal><span class="el-pulse" aria-hidden="true"></span>Depuis votre arrivée sur cette page : <b data-live="0.42">+0</b> repas servis dans nos cantines <small>(estimation de démonstration)</small></p></div></section>`;

const cta = (t, x, b, href) => sec(`<section class="el-cta pk-bleed"><div class="el-wrap el-cta-in"><div class="el-mega el-mega--s" data-reveal>${t}</div><div data-reveal><p class="el-lead">${esc(x)}</p><a class="el-btn el-btn--lg" href="${href}">${ico.heart}<span>${esc(b)}</span></a></div></div></section>`);

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="el-hero pk-bleed"><div class="el-wrap el-hero-in">
    <div class="el-hero-copy"><p class="el-kicker" data-reveal>Reportage · Vallée d'Orun, saison des crues</p><div class="el-mega" role="heading" aria-level="1" data-reveal>Ils ont tout perdu. <em>Pas l'espoir.</em></div>
      <p class="el-lead" data-reveal>Élan intervient dans les 48 heures quand l'eau monte, puis reste des années pour reconstruire avec les habitants. Chaque euro est suivi, chaque résultat est publié.</p>
      <div class="el-actions" data-reveal><a class="el-btn el-btn--lg" href="/agir">${ico.heart}<span>Faire un don</span></a><a class="el-btn el-btn--line el-btn--lg" href="/missions">Voir nos missions</a></div></div>
    ${plate("eau", "Une femme porte une jarre près d'un puits au lever du jour", "Planche I — Sorèle, vallée d'Orun. Illustration d'après un récit fictif.", "el-hero-plate")}
    <aside class="el-badge" data-reveal aria-label="Chiffre d'impact"><b data-count="48200">48 200</b><span>personnes accompagnées en 2026 <small>chiffre fictif de démonstration</small></span></aside></div></section>`),
  sec(impact()),
  sec(`<section class="el-missions pk-bleed"><div class="el-wrap"><div class="el-sechead"><div><p class="el-kicker" data-reveal>Nos missions</p><h2 class="el-h2" data-reveal>Six terrains, un même principe : agir avec ceux qui vivent là.</h2></div><a class="el-more" href="/missions" data-reveal>Toutes les missions ${ico.arrow}</a></div>
    <div class="el-mgrid">${MISSIONS.slice(0, 4).map((m, i) => mcard(m, i, i === 0)).join("")}</div></div></section>`),
  sec(`<section class="el-stories pk-bleed"><div class="el-wrap"><p class="el-kicker" data-reveal>Histoires de terrain</p><h2 class="el-h2" data-reveal>Des visages, pas des statistiques.</h2><p class="el-note" data-reveal>Récits imaginés pour la démonstration ; les personnes et les lieux n'existent pas.</p>${STORIES.map(story).join("")}</div></section>`),
  sec(`<section class="el-giving pk-bleed" id-none><div class="el-wrap el-giving-in"><div class="el-giving-copy"><p class="el-kicker el-kicker--light" data-reveal>Agir maintenant</p><h2 class="el-h2 el-h2--light" data-reveal>Voyez ce que votre don permet de faire.</h2><p class="el-lead el-lead--light" data-reveal>Choisissez un montant et une cause : le module calcule l'équivalent sur le terrain et le coût réel après déduction fiscale indicative. Rien n'est enregistré.</p>
    <ul class="el-promises" data-reveal><li>Suivi public de chaque projet</li><li>Rapport d'emploi des fonds en ligne</li><li>Arrêt possible à tout moment</li></ul></div>${donation()}</div></section>`.replace(' id-none', '')),
  sec(`<section class="el-journal pk-bleed"><div class="el-wrap"><div class="el-sechead"><div><p class="el-kicker" data-reveal>Journal de terrain</p><h2 class="el-h2" data-reveal>Dernières nouvelles</h2></div><a class="el-more" href="/actualites" data-reveal>Toutes les actualités ${ico.arrow}</a></div><div class="el-ngrid">${NEWS.slice(0, 3).map((n, i) => ncard(n, false)).join("")}</div></div></section>`),
  sec(`<section class="el-trust pk-bleed"><div class="el-wrap el-trust-in"><div><p class="el-kicker" data-reveal>Transparence</p><h2 class="el-h2" data-reveal>Où va chaque euro ?</h2><p class="el-muted" data-reveal>Chiffres fictifs de démonstration, présentés comme le ferait une vraie association : en clair, avec la méthode.</p><a class="el-btn el-btn--line" href="/transparence" data-reveal>Voir les comptes</a></div>
    <div class="el-split" data-reveal><div class="el-split-bar" role="img" aria-label="82 % missions, 11 % collecte, 7 % fonctionnement"><span class="el-s1 el-w82"></span><span class="el-s2 el-w11"></span><span class="el-s3 el-w7"></span></div>
    <ul class="el-legend"><li><i class="el-k1"></i><b>82 %</b> missions sur le terrain</li><li><i class="el-k2"></i><b>11 %</b> collecte et information</li><li><i class="el-k3"></i><b>7 %</b> fonctionnement</li></ul></div></div></section>`),
  cta("Un geste, <em>un élan.</em>", "Donner, c'est bien. Donner un peu de temps change aussi tout : accueil, logistique, traduction, collecte locale.", "Devenir bénévole", "/agir"),
  sec(footer(c)),
];

const missions = (c) => [sec(header(c)), pagehead("Où nous agissons", "Nos<br>missions", "Six programmes menés avec des comités d'habitants. Filtrez par domaine.", "abri"),
  sec(`<section class="el-missions pk-bleed"><div class="el-wrap"><div class="el-tabs" role="tablist" aria-label="Filtrer par domaine">${CATS.map(([k, l], i) => `<a href="#${k}" role="tab" aria-selected="${i === 0}" ${i === 0 ? 'class="is-on"' : ""} data-filter="${k}">${l}</a>`).join("")}</div>
    <p class="el-count" role="status" aria-live="polite"><b data-out="n">6</b> missions affichées</p>
    <div class="el-mgrid el-mgrid--all" data-filterable>${MISSIONS.slice(0, 3).map((m, i) => mcard(m, i, false)).join("")}</div></div></section>`),
  sec(`<section class="el-missions el-missions--b pk-bleed"><div class="el-wrap"><div class="el-mgrid el-mgrid--all" data-filterable>${MISSIONS.slice(3).map((m, i) => mcard(m, i, false)).join("")}</div></div></section>`),
  sec(`<section class="el-method pk-bleed"><div class="el-wrap"><p class="el-kicker" data-reveal>Notre méthode</p><h2 class="el-h2" data-reveal>Quatre temps, dans cet ordre.</h2><ol class="el-steps">${[["Écouter", "Un comité d'habitants décrit ses besoins avant tout projet."], ["Agir vite", "Une équipe d'urgence part en moins de 48 heures."], ["Construire", "Chantiers menés avec des artisans et matériaux locaux."], ["Transmettre", "Formation, entretien, puis retrait progressif de l'association."]].map(([t, x], i) => `<li data-reveal><span class="el-num">0${i + 1}</span><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  cta("Choisir<br><em>une mission.</em>", "Vous pouvez affecter votre don à l'eau, aux repas, à l'école ou aux soins.", "Faire un don", "/agir"), sec(footer(c))];

const mission = (c) => [sec(header(c)),
  sec(`<section class="el-md pk-bleed"><div class="el-wrap"><p class="el-kicker" data-reveal>Mission en cours · Urgence + reconstruction</p><div class="el-giant" role="heading" aria-level="1" data-reveal>Eau claire dans la vallée d'Orun</div></div>${plate("eau", "Villageoises autour d'un puits protégé", "Planche I — Sorèle, vallée d'Orun. Illustration fictive.", "el-md-plate")}</section>`),
  sec(`<section class="el-mdbody pk-bleed"><div class="el-wrap el-mdgrid"><div class="el-article">
    <h2 class="el-h2" data-reveal>Le problème</h2><p class="el-lead" data-reveal>Quand le fleuve Orun déborde, les puits se souillent. Pendant des mois, les familles boivent une eau qui rend malades, d'abord les enfants.</p>
    <h2 class="el-h2" data-reveal>Notre réponse</h2><p data-reveal>Nous protégeons les puits existants, en creusons de nouveaux sur des sites choisis par les habitants, installons des filtres à sable et formons un comité d'entretien par village. Un tiers des comités est présidé par une femme.</p>
    <h3 class="el-h3" data-reveal>Calendrier</h3>
    <ol class="el-timeline">${[["Mois 1–2", "Diagnostic avec les comités, cartographie des puits."], ["Mois 3–6", "Travaux : margelles, couvercles, filtres, 12 puits neufs."], ["Mois 7–12", "Formation des comités, premiers contrôles de qualité."], ["Année 2", "Passage de relais : l'association se retire."]].map(([d, t]) => `<li data-reveal><time>${d}</time><span>${t}</span></li>`).join("")}</ol>
    <h3 class="el-h3" data-reveal>Budget de la mission (fictif)</h3>
    <table class="el-table" data-reveal><caption>Répartition du budget annuel de la mission eau</caption><thead><tr><th scope="col">Poste</th><th scope="col">Montant</th><th scope="col">Part</th></tr></thead><tbody><tr><td data-l="Poste">Puits et margelles</td><td data-l="Montant">142 000 €</td><td data-l="Part">46 %</td></tr><tr><td data-l="Poste">Filtres et analyses</td><td data-l="Montant">78 000 €</td><td data-l="Part">25 %</td></tr><tr><td data-l="Poste">Formation des comités</td><td data-l="Montant">56 000 €</td><td data-l="Part">18 %</td></tr><tr><td data-l="Poste">Coordination locale</td><td data-l="Montant">34 000 €</td><td data-l="Part">11 %</td></tr></tbody></table></div>
    <aside class="el-fiche" data-reveal aria-label="Fiche de la mission"><h3>Fiche mission</h3><dl><dt>Lieu</dt><dd>Vallée d'Orun (fictive)</dd><dt>Durée</dt><dd>24 mois</dd><dt>Bénéficiaires</dt><dd>38 villages, 11 400 personnes</dd><dt>Partenaires</dt><dd>Comités d'habitants, régie locale de l'eau</dd></dl>
      <p class="el-fiche-m">Financement 2026</p>${bar(68)}<p class="el-meter-t"><b>68 %</b> de l'objectif, chiffre fictif</p><a class="el-btn el-btn--block" href="/agir">${ico.heart}<span>Soutenir cette mission</span></a></aside></div></section>`),
  sec(`<section class="el-stories pk-bleed"><div class="el-wrap">${story(STORIES[0], 0)}</div></section>`),
  sec(`<section class="el-missions pk-bleed"><div class="el-wrap"><div class="el-sechead"><h2 class="el-h2" data-reveal>Autres missions</h2><a class="el-more" href="/missions" data-reveal>Toutes ${ico.arrow}</a></div><div class="el-mgrid el-mgrid--three">${[MISSIONS[1], MISSIONS[2], MISSIONS[4]].map((m, i) => mcard(m, i, false)).join("")}</div></div></section>`),
  sec(footer(c))];

const ROLES = [
  ["accueil", "Accueil et information", "Tenir un stand, renseigner le public lors des collectes.", "2 h par semaine", "Sur place"],
  ["logistique", "Logistique d'entrepôt", "Trier, préparer et expédier les kits d'urgence.", "Un samedi par mois", "Sur place"],
  ["langues", "Traduction et rédaction", "Traduire des récits de terrain et relire les rapports.", "Au rythme choisi", "À distance"],
  ["terrain", "Mission de terrain (3 mois)", "Appuyer une équipe locale ; formation préalable obligatoire.", "3 mois", "À l'étranger"],
  ["collecte", "Collecte locale", "Organiser un événement ou une cagnotte dans son quartier.", "Ponctuel", "Sur place"],
  ["competences", "Mécénat de compétences", "Comptabilité, droit, informatique : donner une journée par mois.", "1 jour par mois", "Mixte"],
];
const agir = (c) => [sec(header(c)), pagehead("Passer à l'action", "Agir", "Donner, donner du temps, ou entraîner votre entreprise. Trois façons de compter.", "repas"),
  sec(`<section class="el-agir pk-bleed"><div class="el-wrap"><div class="el-tabs" role="tablist" aria-label="Façons d'agir"><a href="#don" role="tab" aria-selected="true" class="is-on" data-tab="don">Faire un don</a><a href="#benevolat" role="tab" aria-selected="false" data-tab="ben">Devenir bénévole</a><a href="#entreprise" role="tab" aria-selected="false" data-tab="ent">Entreprises</a></div>
    <div data-panel="don" role="tabpanel" class="el-panel el-panel--don"><div class="el-giving-in">${donation()}<div class="el-why"><h2 class="el-h2">Ce que change votre don</h2><ul class="el-eqlist">${[["drop", "6 €", "un mois d'eau potable pour une famille"], ["bowl", "0,80 €", "un repas chaud pour un enfant"], ["book", "14 €", "un kit scolaire complet"], ["cross", "9 €", "une consultation de proximité"]].map(([i, a, t]) => `<li>${ico[i]}<b>${a}</b><span>${t}</span></li>`).join("")}</ul><p class="el-note">Taux de démonstration, révisés chaque année dans un vrai rapport. Les dons mensuels peuvent être arrêtés à tout moment.</p></div></div></div>
    <div data-panel="ben" role="tabpanel" class="el-panel" hidden><div class="el-tabs el-tabs--sm" role="tablist" aria-label="Filtrer les missions de bénévolat">${[["tout", "Tout"], ["sur-place", "Sur place"], ["distance", "À distance"], ["mixte", "Mixte"]].map(([k, l], i) => `<a href="#b-${k}" role="tab" aria-selected="${i === 0}" ${i === 0 ? 'class="is-on"' : ""} data-vfilter="${k}">${l}</a>`).join("")}</div>
      <ul class="el-roles">${ROLES.map(([k, t, x, d, w]) => `<li class="el-role" data-where="${w.toLowerCase().replace("à distance","distance").replace("sur place","sur-place")}"><div><h3>${t}</h3><p>${x}</p></div><span class="el-chip">${d}</span><span class="el-chip el-chip--line">${w}</span><a class="el-btn el-btn--line" href="/contact">Proposer mon aide</a></li>`).join("")}</ul></div>
    <div data-panel="ent" role="tabpanel" class="el-panel" hidden><div class="el-biz">${[["Mécénat financier", "Financer un programme entier avec rapport dédié et visite de terrain."], ["Mécénat de compétences", "Vos équipes donnent quelques jours à nos pôles finances, juridique, numérique."], ["Arrondi solidaire", "Proposer l'arrondi en caisse ou sur la fiche de paie."]].map(([t, x]) => `<article data-reveal><h3>${t}</h3><p>${x}</p><a class="el-more" href="/contact">En parler ${ico.arrow}</a></article>`).join("")}</div></div></div></section>`),
  cta("Et si on <em>commençait ?</em>", "Un message suffit : nous répondons sous cinq jours ouvrés, sans engagement.", "Nous écrire", "/contact"), sec(footer(c))];

const actualites = (c) => [sec(header(c)), pagehead("Journal de terrain", "Actualités", "Nouvelles des missions, récits d'habitants et rapports.", "crue"),
  sec(`<section class="el-journal pk-bleed"><div class="el-wrap"><div class="el-tabs" role="tablist" aria-label="Filtrer par rubrique">${[["tout", "Tout"], ["terrain", "Terrain"], ["recits", "Récits"], ["rapports", "Rapports"]].map(([k, l], i) => `<a href="#${k}" role="tab" aria-selected="${i === 0}" ${i === 0 ? 'class="is-on"' : ""} data-filter="${k}">${l}</a>`).join("")}</div><p class="el-count" role="status" aria-live="polite"><b data-out="n">6</b> articles affichés</p>
    <div class="el-ngrid el-ngrid--all" data-filterable>${NEWS.slice(0, 4).map((n, i) => ncard(n, i === 0)).join("")}</div></div></section>`),
  sec(`<section class="el-journal el-journal--b pk-bleed"><div class="el-wrap"><div class="el-ngrid el-ngrid--all el-ngrid--two" data-filterable>${NEWS.slice(4).map((n, i) => ncard(n, false)).join("")}</div></div></section>`),
  sec(footer(c))];

const BARS = [["Missions sur le terrain", 82, "k1"], ["Collecte et information", 11, "k2"], ["Fonctionnement", 7, "k3"]];
const transparence = (c) => [sec(header(c)), pagehead("Rendre des comptes", "Transparence", "Comptes, gouvernance, méthode : tout est publié. Les chiffres ci-dessous sont fictifs.", ""),
  sec(`<section class="el-tr pk-bleed"><div class="el-wrap"><div class="el-trgrid"><div><h2 class="el-h2" data-reveal>Emploi des ressources 2025</h2><p class="el-muted" data-reveal>Total : 6,4 millions d'euros de ressources (fictif).</p>${BARS.map(([l, p, k]) => `<div class="el-hbar" data-reveal><p><span>${l}</span><b>${p} %</b></p><div class="el-meter"><span class="el-fill el-${k} el-w${p}"></span></div></div>`).join("")}</div>
    <table class="el-table" data-reveal><caption>Ressources et emplois 2025 (fictif)</caption><thead><tr><th scope="col">Ligne</th><th scope="col">Montant</th><th scope="col">Part</th></tr></thead><tbody>
    <tr><td data-l="Ligne">Dons des particuliers</td><td data-l="Montant">3 980 000 €</td><td data-l="Part">62 %</td></tr><tr><td data-l="Ligne">Mécénat d'entreprise</td><td data-l="Montant">1 150 000 €</td><td data-l="Part">18 %</td></tr><tr><td data-l="Ligne">Subventions publiques</td><td data-l="Montant">900 000 €</td><td data-l="Part">14 %</td></tr><tr><td data-l="Ligne">Autres produits</td><td data-l="Montant">370 000 €</td><td data-l="Part">6 %</td></tr></tbody></table></div></div></section>`),
  sec(`<section class="el-gov pk-bleed"><div class="el-wrap"><h2 class="el-h2" data-reveal>Gouvernance</h2><div class="el-govgrid">${[["Conseil d'administration", "Onze membres bénévoles, dont trois habitants des zones d'intervention.", "#d9c3a0", "#c8321a", SK[2], "#f7f0e4"], ["Comité d'audit", "Revue annuelle des comptes par un cabinet indépendant (fictif).", "#e8a33d", "#1d1815", SK[0], ""], ["Comités locaux", "Chaque village décide de ses priorités et suit les travaux.", "#c8b08a", "#3b3430", SK[1], "#e8a33d"]].map(([t, x, bg, cl, sk, sc]) => `<article data-reveal>${portrait(bg, cl, sk, sc)}<h3>${t}</h3><p>${x}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="el-docs pk-bleed"><div class="el-wrap el-docs-in"><div><h2 class="el-h2" data-reveal>Documents</h2><p class="el-muted" data-reveal>Rapports d'exemple, à demander via le formulaire de contact.</p></div><ul class="el-doclist">${[["Rapport d'activité 2025", "PDF · 48 pages"], ["Comptes certifiés 2025", "PDF · 32 pages"], ["Charte éthique et protection des enfants", "PDF · 12 pages"], ["Politique de collecte de fonds", "PDF · 8 pages"]].map(([t, m]) => `<li data-reveal><span><b>${t}</b><i>${m}</i></span><a class="el-more" href="/contact">Demander ${ico.arrow}</a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="el-faq pk-bleed"><div class="el-wrap el-faq-in"><h2 class="el-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Mon don est-il déductible ?</summary><p>Dans la démonstration, nous utilisons un taux fictif de 66 % pour l'illustrer. Pour une vraie association, seul le reçu fiscal fait foi.</p></details>
    <details data-reveal><summary>Puis-je affecter mon don à un projet ?</summary><p>Oui : eau, repas, école ou soins. Si un projet est financé, l'excédent va à une mission similaire.</p></details>
    <details data-reveal><summary>Comment arrêter un don mensuel ?</summary><p>À tout moment, par un message via le formulaire de contact.</p></details></div></div></section>`),
  sec(footer(c))];

const apropos = (c) => [sec(header(c)), pagehead("Qui nous sommes", "À propos", "Une association née après une crue, tenue par des bénévoles et des salariés.", "ecole"),
  sec(`<section class="el-about pk-bleed"><div class="el-wrap el-about-in"><div class="el-article"><h2 class="el-h2" data-reveal>Notre histoire</h2><p class="el-lead" data-reveal>En 2009, un groupe d'amis retourne dans un village dévasté par une crue avec trois camionnettes. Ils y restent. Élan est née de ce refus de repartir trop tôt.</p><p data-reveal>Aujourd'hui, 74 salariés et 312 bénévoles travaillent dans six zones d'intervention fictives. Nos équipes locales sont majoritaires partout.</p></div>
    <ol class="el-timeline el-timeline--big">${[["2009", "Premier convoi après la crue de l'Orun."], ["2013", "Naissance des comités d'habitants."], ["2018", "Ouverture du programme santé du delta de Kasi."], ["2022", "Alerte précoce : 40 villages équipés."], ["2026", "Publication du premier rapport sur nos échecs."]].map(([d, t]) => `<li data-reveal><time>${d}</time><span>${t}</span></li>`).join("")}</ol></div></section>`),
  sec(`<section class="el-values pk-bleed"><div class="el-wrap"><h2 class="el-h2 el-h2--light" data-reveal>Quatre principes</h2><div class="el-vgrid">${[["Dignité", "Nous montrons les personnes comme elles se voient : actrices de leur avenir."], ["Proximité", "Les décisions se prennent là où se vivent les problèmes."], ["Rigueur", "Chaque euro est tracé, chaque projet évalué."], ["Humilité", "Nous publions ce qui n'a pas marché."]].map(([t, x], i) => `<article data-reveal><span class="el-num">0${i + 1}</span><h3>${t}</h3><p>${x}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="el-team pk-bleed"><div class="el-wrap"><h2 class="el-h2" data-reveal>L'équipe</h2><div class="el-tgrid">${[["Inès Marchal", "Directrice générale", "#e8a33d", "#1d1815", SK[2], "#c8321a"], ["Samir Okoye", "Responsable des opérations", "#d9c3a0", "#c8321a", SK[0], ""], ["Nadia Perrot", "Directrice des finances", "#c8b08a", "#3b3430", SK[3], "#f7f0e4"], ["Paul Lenoir", "Coordinateur bénévoles", "#e7c9a0", "#6b6a3a", SK[1], ""]].map(([n, r, bg, cl, sk, sc]) => `<article data-reveal>${portrait(bg, cl, sk, sc)}<h3>${n}</h3><p>${r}</p></article>`).join("")}</div><p class="el-note">Portraits illustrés ; personnes fictives.</p></div></section>`),
  cta("Travailler<br><em>avec nous.</em>", "Postes, stages, volontariat de longue durée : écrivez-nous.", "Nous contacter", "/contact"), sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("On vous répond", "Contact", "Dons, bénévolat, presse, mécénat : un seul formulaire. Joignez-y votre récapitulatif de don si vous en avez un.", ""),
  { type: "form", heading: "Écrire à Élan", intro: "Dites-nous comment nous pouvons vous aider ou comment vous voulez agir. Nous répondons sous cinq jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une info ?", "Une mission, un récit, un rapport.", ""), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="el-404 pk-bleed"><div class="el-wrap"><p class="el-kicker">Page introuvable</p><div class="el-giant" role="heading" aria-level="1">404</div><p class="el-ph-sub">Cette page n'existe pas ou a changé d'adresse. Le puits, lui, est toujours là.</p><a class="el-btn el-btn--lg" href="/">Retour à l'accueil</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "elan", name: "Élan", version: "2.0.0", category: "association", tags: ["editorial", "chaleureux", "classique"], siteType: "ONG et association humanitaire", featured: true,
  concept: "Un reportage documentaire : gravures en aplats granuleux, grand titre et chiffre d'impact animé, histoires de terrain en alternance et module de don qui calcule l'impact (démonstration).",
  description: "ONG fictive : crème, noir doux et rouge-orangé, illustrations de personnes et de lieux, compteur d'impact animé, témoignages en alternance, module de don avec équivalences et déduction indicative, transparence.",
  brand: "Élan — Secours & avenir", modules: ["formulaires", "recherche"],
  dna: { header: "barre-creme-bouton-donner-et-bandeau-urgence", hero: "editorial-documentaire-titre-gravure-et-chiffre-d-impact", grid: "temoignages-image-texte-en-alternance", motion: "compteurs-d-impact-et-barres-qui-se-remplissent", shapes: "gravures-aplats-granuleux-et-coins-francs", rhythm: "recit-chiffre-appel-a-l-action", signature: "module-de-don-et-calcul-d-impact" },
  tokens: {
    colors: { primary: "#c8321a", secondary: "#1d1815", accent: "#e8a33d", background: "#f7f0e4", surface: "#fffaf1", text: "#1d1815", muted: "#5e5349", success: "#2f6b3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.merriweather", body: "font.open-sans", button: "font.open-sans", link: "font.open-sans" },
    radius: { sm: 2, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#1d1815" },
    type: { h1: { size: 84, weight: 900, lineHeight: 1.04, transform: "none" }, h2: { size: 44, weight: 700, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge d'urgence", type: "color", default: "#c8321a" },
    { key: "ink", label: "Noir doux", type: "color", default: "#1d1815" },
    { key: "alerte", label: "Bandeau d'urgence", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "grain", label: "Grain des gravures", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Aucun"]] },
  ],
  menu: [["Accueil", "/"], ["Nos missions", "/missions"], ["Agir", "/agir"], ["Actualités", "/actualites"], ["Transparence", "/transparence"], ["À propos", "/apropos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "missions", name: "Nos missions", render: missions }, { key: "mission", name: "Mission", render: mission },
    { key: "agir", name: "Agir", render: agir }, { key: "actualites", name: "Actualités", render: actualites }, { key: "transparence", name: "Transparence", render: transparence },
    { key: "apropos", name: "À propos", render: apropos }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
