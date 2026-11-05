// Héliade — énergie solaire et transition écologique (entreprise fictive). Direction artistique : journée claire, data verte.
// Blanc très clair, jaune soleil, vert profond, bleu ciel ; soleil et courbe de production animés (cycle du jour), panneaux dessinés en SVG,
// barre transparente qui devient pleine au défilement, arguments en bento clair, calculateur d'économies d'énergie en direct.
const { sec, form, esc, nav } = require("../kit");

const arrow = `<svg class="he-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const rays = (n, r1, r2, cx = 0, cy = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, f = (v) => v.toFixed(1); return `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}"/>`; }).join("");
const sunMark = `<svg class="he-mark" viewBox="-20 -20 40 40" aria-hidden="true"><circle r="7" fill="#ffb400"/><g stroke="#ffb400" stroke-width="2.6" stroke-linecap="round">${rays(8, 11, 16)}</g></svg>`;

// Panneaux solaires : grille de parallélogrammes (perspective de toit)
const panels = (x, y, cols, rows, w, h, skew, fill = "#1b4f8a", line = "#8fc1ee") => {
  let s = ""; for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const px = x + k * w + r * skew * -1, py = y + r * h; s += `<polygon points="${px},${py} ${px + w - 2},${py} ${px + w - 2 - skew},${py + h - 2} ${px - skew},${py + h - 2}" fill="${fill}" stroke="${line}" stroke-width=".8"/>`; }
  return s;
};
const scene = (kind, tone = 0) => {
  const sky = ["#dff1fb", "#fff3cf", "#e3f4e6", "#e8eefb"][tone % 4], gr = ["#b9dcae", "#cfe3a0", "#a9d1b7", "#bfdca8"][tone % 4];
  const base = `<rect width="320" height="200" fill="${sky}"/><circle cx="262" cy="46" r="20" fill="#ffb400"/><g stroke="#ffb400" stroke-width="3" stroke-linecap="round" transform="translate(262 46)">${rays(10, 27, 35)}</g><path d="M0 160c60-22 120-18 180-6s100 8 140-8v54H0z" fill="${gr}"/>`;
  const k = {
    maison: `<rect x="70" y="102" width="150" height="76" fill="#fffaf0"/><polygon points="52,104 145,48 238,104" fill="#c9694a"/>${panels(104, 72, 4, 2, 24, 14, 6)}<rect x="132" y="130" width="26" height="48" fill="#0a5c46"/><rect x="82" y="120" width="28" height="24" fill="#bfe3f7"/><rect x="180" y="120" width="28" height="24" fill="#bfe3f7"/>`,
    hangar: `<rect x="30" y="100" width="250" height="78" fill="#f1f4f2"/><polygon points="22,100 50,70 262,70 290,100" fill="#8aa09a"/>${panels(58, 74, 8, 2, 25, 13, 5, "#143f73")}<rect x="60" y="134" width="46" height="44" fill="#0a5c46"/><rect x="190" y="122" width="62" height="14" fill="#bfe3f7"/>`,
    ferme: `<rect x="60" y="106" width="170" height="72" fill="#d9a064"/><polygon points="46,108 145,54 244,108" fill="#7a4e32"/>${panels(96, 78, 5, 2, 24, 13, 6, "#1b4f8a")}<rect x="130" y="134" width="40" height="44" fill="#fff4dd"/><rect x="236" y="92" width="28" height="86" fill="#e9d9b5"/><ellipse cx="250" cy="92" rx="14" ry="8" fill="#cdbb8c"/>`,
    immeuble: `<rect x="80" y="40" width="130" height="138" fill="#eef2f6"/><g fill="#bfe3f7">${[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => `<rect x="${94 + c * 38}" y="${54 + r * 24}" width="22" height="14"/>`).join("")).join("")}</g><rect x="76" y="32" width="138" height="10" fill="#0a5c46"/>${panels(86, 22, 5, 1, 26, 10, 0, "#143f73")}<rect x="130" y="150" width="28" height="28" fill="#0a5c46"/>`,
    ombriere: `<rect x="40" y="120" width="240" height="8" fill="#9fb2ac"/><g fill="#8aa09a">${[56, 134, 212, 270].map((x) => `<rect x="${x}" y="82" width="6" height="64"/>`).join("")}</g><polygon points="30,86 60,56 292,56 262,86" fill="#143f73" stroke="#8fc1ee" stroke-width="1"/><rect x="90" y="132" width="52" height="22" rx="8" fill="#ffb400"/><rect x="174" y="132" width="52" height="22" rx="8" fill="#0a5c46"/>`,
  }[kind];
  return `<svg class="he-scene-svg" viewBox="0 0 320 200" role="img" aria-label="Illustration : ${esc(kind)} équipé de panneaux solaires">${base}${k}</svg>`;
};

// Mini-graphiques (bento)
const spark = (pts, col = "#0a5c46") => `<svg class="he-spark" viewBox="0 0 160 56" aria-hidden="true"><polygon points="${pts} 160,56 0,56" fill="${col}" opacity=".14"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="he-draw"/></svg>`;
const bars = (vals, col = "#ffb400") => `<svg class="he-bars" viewBox="0 0 160 64" aria-hidden="true">${vals.map((v, i) => `<rect x="${i * 13 + 2}" y="${62 - v * 56}" width="9" height="${v * 56}" rx="3" fill="${i === vals.length - 1 ? "#0a5c46" : col}" class="he-bar-i"/>`).join("")}</svg>`;
const gauge = `<svg class="he-gauge" viewBox="0 0 120 70" aria-hidden="true"><path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke="#e2efe9" stroke-width="12" stroke-linecap="round"/><path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke="#0a5c46" stroke-width="12" stroke-linecap="round" class="he-gv"/></svg>`;

const sunFull = `<svg viewBox="-60 -60 120 120" aria-hidden="true"><circle r="22" fill="#ffb400"/><circle r="30" fill="none" stroke="#f6cf70" stroke-width="2"/><g stroke="#ffb400" stroke-width="5" stroke-linecap="round">${rays(12, 38, 52)}</g></svg>`;

const header = (c) => `<header class="he-head pk-bleed"><div class="he-bar"><a class="he-logo" href="/" aria-label="${esc(c.brand)} — accueil">${sunMark}<span>Héliade</span></a>
  <div class="he-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu.filter((m) => m.url !== "/contact"))}</div>
  <a class="he-btn he-btn--sun he-head-cta" href="/calculateur">Estimer mes économies</a>
  <details class="he-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="he-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="he-btn he-btn--sun" href="/calculateur">Estimer mes économies</a></div></details></div></header>`;

const footer = (c) => `<footer class="he-foot pk-bleed"><svg class="he-foot-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40C240 80 480 0 720 30s480 50 720 0V80H0z" fill="#0a3d33"/></svg>
  <div class="he-wrap he-foot-grid"><div><a class="he-logo he-logo--w" href="/">${sunMark}<span>Héliade</span></a><p>Énergie solaire et transition écologique pour les maisons, les entreprises et les collectivités.</p><address>12 quai des Écluses<br>44000 Nantes<br><a href="mailto:bonjour@heliade.example">bonjour@heliade.example</a></address></div>
  <div><h3>Découvrir</h3>${nav(c.menu.slice(1, 4), "he-fl")}<a class="he-fl" href="/solution">Fiche : toiture 6 kWc</a></div>
  <div><h3>Ressources</h3><a class="he-fl" href="/aides">Aides &amp; démarches</a><a class="he-fl" href="/blog">Blog</a><a class="he-fl" href="/a-propos">À propos</a><a class="he-fl" href="/recherche">Recherche</a></div>
  <div><h3>Parlons-en</h3><a class="he-fl" href="/contact">Demander un échange</a><a class="he-fl" href="/calculateur">Calculateur</a></div></div>
  <p class="he-legal he-wrap">© Héliade — site de démonstration. Entreprise, chantiers, chiffres et tarifs fictifs et indicatifs : aucune économie n'est garantie.</p></footer>`;

const pagehead = (kicker, title, sub, art = "") => sec(`<section class="he-ph pk-bleed"><div class="he-wrap he-ph-in"><div><p class="he-kicker" data-reveal>${esc(kicker)}</p><div class="he-h1 he-h1--p" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="he-lead" data-reveal>${esc(sub)}</p>` : ""}</div>${art ? `<div class="he-ph-art" aria-hidden="true">${art}</div>` : `<div class="he-ph-art" aria-hidden="true"><svg viewBox="-60 -60 120 120" class="he-ph-sun">${sunFull.replace(/<\/?svg[^>]*>/g, "")}</svg></div>`}</div></section>`);

const cta = `<section class="he-cta pk-bleed"><div class="he-wrap he-cta-in" data-reveal><div><h2 class="he-h2">Combien votre toit peut-il produire&nbsp;?</h2><p>Quelques réponses, une estimation indicative en direct. Sans engagement.</p></div><a class="he-btn he-btn--sun he-btn--lg" href="/calculateur">Ouvrir le calculateur ${arrow}</a></div></section>`;

// ------------------------------------------------------------------ ACCUEIL
const heroScene = `<figure class="he-live" data-cycle aria-label="Illustration animée : le soleil traverse le ciel et la courbe de production suit sa course">
  <svg class="he-sky" viewBox="0 0 600 330" role="img" aria-label="Soleil au-dessus d'une maison équipée de panneaux solaires">
    <rect width="600" height="330" fill="#a6dbf5"/><rect y="120" width="600" height="210" fill="#c4e8f9"/><rect y="200" width="600" height="130" fill="#e1f4fc"/><rect width="600" height="330" fill="#ffb27a" opacity="0" data-dusk/>
    <path class="he-arc" d="M40 290Q300 -10 560 290" fill="none" stroke="#e9b94a" stroke-width="2" stroke-linecap="round"/>
    <g data-sun transform="translate(300 140)"><circle r="78" fill="#ffd25a" opacity=".16"/><circle r="60" fill="#ffd25a" opacity=".22"/><g class="he-sun-rays" stroke="#ffb400" stroke-width="5" stroke-linecap="round">${rays(14, 34, 48)}</g><circle r="26" fill="#ffb400"/><circle r="18" fill="#ffd25a" opacity=".6" cx="-5" cy="-5"/></g>
    <g class="he-cloud" fill="#fff" opacity=".9"><ellipse cx="110" cy="84" rx="42" ry="14"/><ellipse cx="136" cy="74" rx="26" ry="14"/></g><g class="he-cloud he-cloud--b" fill="#fff" opacity=".85"><ellipse cx="470" cy="124" rx="36" ry="12"/><ellipse cx="492" cy="114" rx="22" ry="12"/></g>
    <path d="M0 270c90-30 170-34 260-14s200 10 340-22v96H0z" fill="#79c08c"/><path d="M0 296c120-24 220-18 330-4s190 4 270-14v52H0z" fill="#0a5c46"/>
    <g transform="translate(330 214)"><rect x="0" y="40" width="190" height="82" fill="#fffaf0"/><polygon points="-18,42 95,-14 208,42" fill="#c9694a"/>${panels(36, 6, 5, 2, 28, 15, 7)}<rect x="82" y="72" width="28" height="50" fill="#0a5c46"/><rect x="18" y="62" width="30" height="26" fill="#bfe3f7"/><rect x="142" y="62" width="30" height="26" fill="#bfe3f7"/></g>
  </svg>
  <div class="he-chart"><div class="he-chart-top"><span><b data-kw>0,0</b> kW</span><span class="he-chart-t" data-time>06 h 00</span><span>Cumul : <b data-kwh>0,0</b> kWh</span></div>
  <svg viewBox="0 0 600 130" role="img" aria-label="Courbe de production solaire sur une journée type (démonstration)">    <g stroke="#cfe3dc" stroke-width="1"><line x1="20" y1="110" x2="580" y2="110"/><line class="he-dash" x1="20" y1="60" x2="580" y2="60"/></g>
    <path data-area d="M20 110L580 110Z" fill="#ffb400" opacity=".3"/><path data-curve d="M20 110L580 110" fill="none" stroke="#0a5c46" stroke-width="3.2" stroke-linecap="round"/>
    <circle data-dot r="6.5" cx="20" cy="110" fill="#ffb400" stroke="#fff" stroke-width="3"/>
    </svg><div class="he-axis" aria-hidden="true"><span>6 h</span><span>13 h</span><span>20 h</span></div></div></figure>`;

const benefits = [
  ["Produisez votre énergie", "Jusqu'à la moitié de votre consommation couverte en journée, selon le profil du foyer (estimation de démonstration).", "sun"],
  ["Pilotez en temps réel", "Une application claire : production, consommation et surplus, heure par heure.", "chart"],
  ["Pose par des artisans locaux", "Équipes certifiées, bureau d'études interne, chantier propre et suivi photographique.", "tools"],
  ["Garanties lisibles", "Panneaux garantis 25 ans par le fabricant, onduleur 12 ans, main-d'œuvre 10 ans.", "shield"],
  ["Un seul interlocuteur", "De l'étude de toiture au raccordement : une personne dédiée.", "chat"],
];
const ico = (k) => ({
  sun: `<svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="7" fill="#ffb400"/><g stroke="#ffb400" stroke-width="2.6" stroke-linecap="round">${rays(8, 11, 16)}</g></svg>`,
  chart: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 33h30M8 27l8-8 6 5 11-14" fill="none" stroke="#0a5c46" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tools: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 30 24 16m-2-8a8 8 0 0 0 10 10l-3 3-7-7z" fill="none" stroke="#0a5c46" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  shield: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5 33 10v10c0 8-6 13-13 15C13 33 7 28 7 20V10z" fill="none" stroke="#0a5c46" stroke-width="3" stroke-linejoin="round"/><path d="m14 20 5 5 8-9" fill="none" stroke="#ffb400" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chat: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 10h28v18H18l-8 6v-6H6z" fill="none" stroke="#0a5c46" stroke-width="3" stroke-linejoin="round"/></svg>`,
}[k]);

const processSteps = [["Étude de toiture", "Orientation, ombrages et charpente analysés à distance puis sur place."], ["Devis détaillé", "Puissance, matériel, prix et production indicative, noir sur blanc."], ["Démarches", "Dossier de raccordement et formalités préparés avec vous."], ["Pose", "Chantier de un à trois jours pour une maison, selon la surface."], ["Mise en service", "Contrôle, application de suivi et prise en main."]];
const processHtml = () => `<ol class="he-steps">${processSteps.map(([t, x], i) => `<li data-reveal><span class="he-step-n">${i + 1}</span><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol>`;

const rcard = (kind, tone, tag, title, meta) => `<article class="he-rc" data-cat="${tag[0]}" data-reveal><div class="he-rc-art">${scene(kind, tone)}</div><div class="he-rc-body"><span class="he-chip">${tag[1]}</span><h3>${title}</h3><p>${meta}</p></div></article>`;
const REAL = [
  ["maison", 0, ["maison", "Maison"], "Maison de famille, Rezé", "6 kWc · production indicative 7 000 kWh/an · pose en 2 jours"],
  ["hangar", 1, ["pro", "Entreprise"], "Atelier de menuiserie, Saint-Herblain", "36 kWc · toiture plate · autoconsommation en journée"],
  ["ferme", 2, ["agri", "Agricole"], "Ferme laitière, Vallet", "54 kWc · hangar de stockage · projet pluriannuel"],
  ["immeuble", 3, ["coll", "Collectif"], "Résidence de 24 logements, Nantes", "18 kWc · parties communes · partage de la production"],
  ["ombriere", 0, ["pro", "Entreprise"], "Ombrière de parking, Carquefou", "90 kWc · 40 places ombragées · bornes de recharge"],
  ["maison", 1, ["maison", "Maison"], "Longère rénovée, Clisson", "4,5 kWc · tuiles anciennes · intégration discrète"],
];

const home = (c) => [
  sec(header(c)),
  sec(`<section class="he-hero pk-bleed"><div class="he-wrap he-hero-in"><div class="he-hero-copy"><p class="he-kicker he-kicker--sun" data-reveal><span class="he-pulse"></span>Énergie solaire · Transition écologique</p>
    <div class="he-h1" role="heading" aria-level="1" data-reveal>Laissez le soleil <em>payer</em> une partie de vos factures.</div>
    <p class="he-lead" data-reveal>Héliade conçoit, installe et suit des centrales solaires pour les maisons, les entreprises et les collectivités. Étude honnête, chiffres lisibles, aucune promesse magique.</p>
    <div class="he-actions" data-reveal><a class="he-btn he-btn--sun he-btn--lg" href="/calculateur">Estimer mes économies ${arrow}</a><a class="he-btn he-btn--line he-btn--lg" href="/solutions">Voir les solutions</a></div>
    <ul class="he-trust" data-reveal><li><b>18 ans</b> d'expérience</li><li><b>1 200</b> toitures étudiées</li><li><b>25 ans</b> de garantie panneaux</li></ul></div>
    ${heroScene}</div><p class="he-note he-wrap">Courbe et chiffres : démonstration, journée type ensoleillée. Aucune production réelle n'est garantie.</p></section>`),
  sec(`<section class="he-stats pk-bleed"><ul class="he-wrap he-stats-in"><li data-reveal><b data-count="1200" data-suffix="+">1 200+</b><span>toitures étudiées</span></li><li data-reveal><b data-count="48" data-suffix=" MWc">48 MWc</b><span>installés (démonstration)</span></li><li data-reveal><b data-count="96" data-suffix=" %">96 %</b><span>de clients qui nous recommandent*</span></li><li data-reveal><b data-count="25" data-suffix=" ans">25 ans</b><span>de garantie panneaux</span></li></ul><p class="he-small he-wrap">* Indicateur fictif de démonstration.</p></section>`),
  sec(`<section class="he-bento-s pk-bleed"><div class="he-wrap"><div class="he-sechead"><p class="he-kicker" data-reveal>Pourquoi Héliade</p><h2 class="he-h2" data-reveal>Cinq raisons de regarder votre toit autrement.</h2></div>
    <div class="he-bento">
      <article class="he-bc he-bc--a" data-reveal><span class="he-bc-ico">${ico("sun")}</span><h3>${benefits[0][0]}</h3><p>${benefits[0][1]}</p>${spark("0,46 20,40 40,30 60,22 80,12 100,10 120,14 140,24 160,34")}</article>
      <article class="he-bc he-bc--b" data-reveal><span class="he-bc-ico">${ico("chart")}</span><h3>${benefits[1][0]}</h3><p>${benefits[1][1]}</p>${bars([.3, .45, .6, .8, .95, .9, .7, .5, .35, .55, .75, .9])}</article>
      <article class="he-bc he-bc--c he-bc--dark" data-reveal><div class="he-gauge-w">${gauge}<b>72 %</b></div><h3>Autoconsommation</h3><p>Part de la production utilisée sur place, pour un foyer avec pilotage des usages (exemple).</p></article>
      <article class="he-bc he-bc--d" data-reveal><span class="he-bc-ico">${ico("tools")}</span><h3>${benefits[2][0]}</h3><p>${benefits[2][1]}</p></article>
      <article class="he-bc he-bc--e" data-reveal><span class="he-bc-ico">${ico("shield")}</span><h3>${benefits[3][0]}</h3><p>${benefits[3][1]}</p></article>
      <article class="he-bc he-bc--f he-bc--sun" data-reveal><span class="he-bc-ico">${ico("chat")}</span><h3>${benefits[4][0]}</h3><p>${benefits[4][1]}</p><a class="he-more" href="/contact">Rencontrer l'équipe ${arrow}</a></article>
    </div></div></section>`),
  sec(`<section class="he-duo pk-bleed"><div class="he-wrap he-duo-in">
    <a class="he-duo-c he-duo-c--1" href="/solutions" data-reveal><div class="he-duo-art">${scene("maison", 0)}</div><div><span class="he-chip">Particuliers</span><h3>Une maison qui produit</h3><p>Toiture, ombrière, batterie, borne de recharge : le kit sur mesure pour le foyer.</p><span class="he-more">Découvrir ${arrow}</span></div></a>
    <a class="he-duo-c he-duo-c--2" href="/solutions" data-reveal><div class="he-duo-art">${scene("hangar", 1)}</div><div><span class="he-chip">Professionnels</span><h3>Une toiture qui travaille</h3><p>Hangars, commerces, exploitations et collectivités : réduire la facture et verdir l'activité.</p><span class="he-more">Découvrir ${arrow}</span></div></a></div></section>`),
  sec(`<section class="he-proc pk-bleed"><div class="he-wrap"><div class="he-sechead"><p class="he-kicker" data-reveal>Le parcours</p><h2 class="he-h2" data-reveal>De la toiture au premier kilowattheure.</h2></div>${processHtml()}</div></section>`),
  sec(`<section class="he-real pk-bleed"><div class="he-wrap"><div class="he-sechead he-sechead--row"><div><p class="he-kicker" data-reveal>Réalisations</p><h2 class="he-h2" data-reveal>Des toits, des vrais chantiers.</h2></div><a class="he-more" href="/realisations">Toutes les réalisations ${arrow}</a></div>
    <div class="he-rgrid">${REAL.slice(0, 3).map((r) => rcard(...r)).join("")}</div><p class="he-small">Projets fictifs, présentés à titre de démonstration.</p></div></section>`),
  sec(`<section class="he-blogt pk-bleed"><div class="he-wrap"><div class="he-sechead he-sechead--row"><div><p class="he-kicker" data-reveal>Blog</p><h2 class="he-h2" data-reveal>Comprendre avant d'investir.</h2></div><a class="he-more" href="/blog">Tous les articles ${arrow}</a></div>
    <div class="he-posts">${[["Guide", "Orientation et inclinaison : ce qui compte vraiment", "5 min"], ["Pratique", "Autoconsommation : décaler ses usages sans se priver", "4 min"], ["Environnement", "Que deviennent les panneaux en fin de vie ?", "6 min"]].map(([t, h, m]) => `<a class="he-post" href="/blog" data-reveal><span class="he-chip">${t}</span><h3>${h}</h3><span class="he-small">${m} de lecture</span></a>`).join("")}</div></div></section>`),
  sec(cta), sec(footer(c)),
];

// ------------------------------------------------------------------ SOLUTIONS
const offer = (t, p, items, hot) => `<article class="he-offer${hot ? " he-offer--hot" : ""}" data-reveal>${hot ? '<span class="he-flag">La plus demandée</span>' : ""}<h3>${t}</h3><p class="he-offer-p">${p}</p><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul><a class="he-btn ${hot ? "he-btn--sun" : "he-btn--line"} he-btn--block" href="/solution">Voir la fiche</a></article>`;
const solutions = (c) => [sec(header(c)),
  pagehead("Particuliers et professionnels", "Des solutions <em>à la taille</em> de votre toit.", "Chaque projet commence par une étude. Voici les grandes familles d'installations que nous réalisons."),
  sec(`<section class="he-sol pk-bleed" data-tabs><div class="he-wrap"><div class="he-tabs" role="tablist" aria-label="Type de client"><a href="#particuliers" class="is-on" data-tab="part" role="tab">Particuliers</a><a href="#professionnels" data-tab="pro" role="tab">Professionnels</a></div>
    <div class="he-panel" data-panel="part"><div class="he-offers">${offer("Toiture 3 kWc", "À partir de 7 500 € TTC*", ["6 à 8 panneaux", "Petite maison ou chauffe-eau solaire", "Application de suivi"], 0)}${offer("Toiture 6 kWc", "À partir de 12 900 € TTC*", ["12 à 14 panneaux", "Famille de 4 personnes", "Pilotage ballon d'eau chaude", "Garantie 25 ans panneaux"], 1)}${offer("Toiture + batterie", "À partir de 19 800 € TTC*", ["Stockage 5 à 10 kWh", "Autonomie accrue en soirée", "Secours en cas de coupure"], 0)}</div></div>
    <div class="he-panel" data-panel="pro"><div class="he-offers">${offer("Toiture plate 36 kWc", "Sur devis", ["Ateliers, commerces, bureaux", "Calcul d'autoconsommation à l'heure", "Suivi mensuel"], 0)}${offer("Ombrière de parking", "Sur devis", ["Ombre et recharge de véhicules", "Éclairage intégré", "Visuel d'implantation"], 1)}${offer("Exploitation agricole", "Sur devis", ["Hangars et bâtiments d'élevage", "Étude de charpente incluse", "Plan de financement détaillé"], 0)}</div></div>
    <p class="he-small">* Prix de démonstration hors aides, pose comprise ; ils ne constituent pas une offre. Les économies dépendent de l'ensoleillement et de vos usages.</p></div></section>`),
  sec(`<section class="he-cmp pk-bleed"><div class="he-wrap"><h2 class="he-h2" data-reveal>Comparer d'un coup d'œil</h2>
    <table class="he-table" data-reveal><caption class="he-sr">Comparatif des installations (valeurs indicatives de démonstration)</caption><thead><tr><th scope="col">Installation</th><th scope="col">Puissance</th><th scope="col">Production indicative</th><th scope="col">Pose</th><th scope="col">Pour qui</th></tr></thead><tbody>
    <tr><th scope="row">Toiture 3 kWc</th><td data-l="Puissance">3 kWc</td><td data-l="Production">3 300 kWh/an</td><td data-l="Pose">1 jour</td><td data-l="Pour qui">Petit foyer</td></tr>
    <tr><th scope="row">Toiture 6 kWc</th><td data-l="Puissance">6 kWc</td><td data-l="Production">6 800 kWh/an</td><td data-l="Pose">2 jours</td><td data-l="Pour qui">Famille</td></tr>
    <tr><th scope="row">Toiture + batterie</th><td data-l="Puissance">6 kWc + 10 kWh</td><td data-l="Production">6 800 kWh/an</td><td data-l="Pose">3 jours</td><td data-l="Pour qui">Forte présence en soirée</td></tr>
    <tr><th scope="row">Toiture plate 36 kWc</th><td data-l="Puissance">36 kWc</td><td data-l="Production">39 000 kWh/an</td><td data-l="Pose">1 à 2 semaines</td><td data-l="Pour qui">Entreprise, commerce</td></tr>
    <tr><th scope="row">Ombrière 90 kWc</th><td data-l="Puissance">90 kWc</td><td data-l="Production">99 000 kWh/an</td><td data-l="Pose">3 à 5 semaines</td><td data-l="Pour qui">Parking, collectivité</td></tr></tbody></table></div></section>`),
  sec(cta), sec(footer(c))];

// ------------------------------------------------------------------ SOLUTION (détail)
const flow = `<svg class="he-flow" viewBox="0 0 640 150" role="img" aria-label="Schéma : les panneaux alimentent l'onduleur, puis la maison, la batterie ou le réseau">  <g fill="#fff" stroke="#0a5c46" stroke-width="2"><rect x="8" y="40" width="110" height="70" rx="14"/><rect x="190" y="40" width="110" height="70" rx="14"/><rect x="380" y="6" width="110" height="52" rx="14"/><rect x="380" y="92" width="110" height="52" rx="14"/><rect x="530" y="40" width="100" height="70" rx="14"/></g>
  <g stroke="#0a5c46" stroke-width="2.4" fill="none" class="he-flowline"><line x1="120" y1="75" x2="186" y2="75"/><path d="M302 66C330 66 340 32 376 32"/><path d="M302 84C330 84 340 118 376 118"/><line x1="492" y1="32" x2="526" y2="62"/><line x1="492" y1="118" x2="526" y2="88"/></g>
  <g fill="#0a5c46"><polygon points="188,75 178,70 178,80"/><polygon points="378,32 368,27 369,38"/><polygon points="378,118 369,113 368,124"/><polygon points="528,63 517,63 522,53"/><polygon points="528,87 522,97 517,87"/></g>
  <g transform="translate(63 75)"><g fill="#1b4f8a" stroke="#8fc1ee" stroke-width=".8"><rect x="-34" y="-20" width="30" height="18"/><rect x="-2" y="-20" width="30" height="18"/><rect x="-34" y="2" width="30" height="18"/><rect x="-2" y="2" width="30" height="18"/></g></g>
  <g transform="translate(245 75)" stroke="#ffb400" stroke-width="3" fill="none" stroke-linecap="round"><path d="M-16 8 0-16 16 8M-10 0h20"/></g>
  <g transform="translate(435 32)"><circle r="12" fill="#ffb400"/></g><g transform="translate(435 118)"><rect x="-14" y="-8" width="28" height="16" rx="3" fill="#0a5c46"/><rect x="14" y="-3" width="4" height="6" fill="#0a5c46"/></g>
  <g transform="translate(580 75)"><polygon points="-22,6 0,-18 22,6" fill="#c9694a"/><rect x="-16" y="6" width="32" height="20" fill="#fffaf0" stroke="#0a5c46" stroke-width="1.5"/></g></svg>`;
const solution = (c) => [sec(header(c)),
  pagehead("Fiche solution · Particuliers", "Toiture <em>6 kWc</em> en autoconsommation.", "L'installation la plus choisie par les familles : une production de jour utilisée sur place, le surplus injecté dans le réseau.", scene("maison", 1)),
  sec(`<section class="he-det pk-bleed"><div class="he-wrap he-det-in"><div class="he-det-main">
    <h2 class="he-h2" data-reveal>Comment ça fonctionne</h2><p data-reveal>Les panneaux transforment la lumière en courant continu. L'onduleur le convertit en courant alternatif utilisable dans la maison. Ce que vous ne consommez pas sur le moment peut être stocké dans une batterie (en option) ou injecté dans le réseau.</p>
    <div class="he-flow-w" data-reveal>${flow}<div class="he-flow-l" aria-hidden="true"><span>Panneaux</span><span>Onduleur</span><span>Maison · batterie · réseau</span></div></div>
    <h2 class="he-h2" data-reveal>Ce qui est inclus</h2>
    <ul class="he-checks" data-reveal><li>Étude de toiture et dimensionnement</li><li>12 à 14 panneaux monocristallins</li><li>Onduleur et coffret de protection</li><li>Pose, câblage et mise en service</li><li>Dossier de raccordement préparé</li><li>Application de suivi de la production</li></ul>
    <h2 class="he-h2" data-reveal>Questions fréquentes</h2>
    <div class="he-faq" data-reveal><details><summary>Mon toit est-il adapté ?</summary><p>Une orientation du sud-est au sud-ouest, peu d'ombre et une charpente saine sont idéales. Nous vérifions chaque point lors de l'étude.</p></details>
    <details><summary>Combien de temps dure la pose ?</summary><p>Généralement deux jours pour 6 kWc, hors délais administratifs.</p></details>
    <details><summary>Que se passe-t-il par temps nuageux ?</summary><p>La production baisse mais ne s'arrête pas ; votre fournisseur d'électricité prend le relais, sans coupure.</p></details>
    <details><summary>Quelles économies puis-je espérer ?</summary><p>Cela dépend de votre consommation, de votre région et de vos habitudes. Le calculateur donne une estimation indicative, jamais une garantie.</p></details></div></div>
    <aside class="he-spec" data-reveal aria-label="Fiche technique"><h3>Fiche technique</h3><dl><dt>Puissance</dt><dd>6 kWc</dd><dt>Surface de toit</dt><dd>≈ 33 m²</dd><dt>Production indicative</dt><dd>6 800 kWh/an</dd><dt>Prix indicatif*</dt><dd>12 900 € TTC</dd><dt>Garantie panneaux</dt><dd>25 ans</dd><dt>Garantie onduleur</dt><dd>12 ans</dd></dl><p class="he-small">* Valeurs de démonstration hors aides.</p><a class="he-btn he-btn--sun he-btn--block" href="/calculateur">Estimer pour mon toit</a><a class="he-btn he-btn--line he-btn--block" href="/contact">Demander un échange</a></aside></div></section>`),
  sec(cta), sec(footer(c))];

// ------------------------------------------------------------------ CALCULATEUR
const calculateur = (c) => [sec(header(c)),
  pagehead("Calculateur d'économies", "Votre toit, <em>en chiffres.</em>", "Indiquez l'orientation, la surface, votre consommation et votre région : le graphique se met à jour à chaque réglage. Estimation indicative, sans engagement.", `<svg viewBox="0 0 200 160"><rect x="10" y="100" width="180" height="2" fill="#0a5c46" opacity=".3"/>${[.4, .7, 1, .8, .55, .35].map((v, i) => `<rect x="${24 + i * 28}" y="${100 - v * 80}" width="18" height="${v * 80}" rx="6" fill="${i === 2 ? "#ffb400" : "#0a5c46"}" opacity="${i === 2 ? 1 : .75}"/>`).join("")}<circle cx="100" cy="26" r="14" fill="#ffb400"/></svg>`),
  sec(`<section class="he-calc-s pk-bleed"><div class="he-wrap"><div class="he-calc" data-calc>
    <div class="he-calc-form"><h2 class="he-h3">Votre situation</h2><div class="he-fields" data-fields><p class="he-small">Le calculateur se charge… (JavaScript requis).</p></div></div>
    <div class="he-calc-res"><div class="he-kpis"><div class="he-kpi he-kpi--big"><span>Production estimée</span><b data-k="prod">—</b></div><div class="he-kpi"><span>Économies indicatives / an</span><b data-k="save">—</b></div><div class="he-kpi"><span>Amortissement indicatif</span><b data-k="pay">—</b></div><div class="he-kpi"><span>Puissance installée</span><b data-k="kwc">—</b></div></div>
      <div class="he-chartbox" data-chart><div class="he-legend" aria-hidden="true"><span class="he-lg he-lg--p">Production</span><span class="he-lg he-lg--c">Consommation</span></div><svg viewBox="0 0 640 280" role="img" aria-label="Production et consommation mensuelles estimées"></svg><div class="he-tip" aria-hidden="true"></div></div>
      <p class="he-sum" data-sum aria-live="polite"></p><p class="he-sr" data-sr aria-live="polite"></p>
      <a class="he-btn he-btn--sun he-btn--lg" data-link href="/contact">Discuter de ce résumé ${arrow}</a></div></div>
    <p class="he-small he-disc">Estimation de démonstration fondée sur des hypothèses simplifiées (ensoleillement moyen par région, 6 m² par kWc, tarif d'achat 0,22 €/kWh, revente du surplus 0,13 €/kWh, coût 2 300 € par kWc). Elle ne constitue ni un devis ni une promesse d'économies.</p></div></section>`),
  sec(`<section class="he-hyp pk-bleed"><div class="he-wrap"><h2 class="he-h2" data-reveal>Les hypothèses, en toute transparence</h2><div class="he-hyp-g">
    <article data-reveal><h3>Orientation</h3><p>Plein sud = référence. Est ou ouest : environ 15 % de moins sur l'année ; plat avec supports : environ 10 % de moins.</p></article>
    <article data-reveal><h3>Région</h3><p>Le rendement annuel moyen par kWc varie d'environ 1 000 à 1 450 kWh selon les régions.</p></article>
    <article data-reveal><h3>Autoconsommation</h3><p>45 % de la production est utilisée sur place ; 60 % avec un pilotage des usages (démonstration).</p></article>
    <article data-reveal><h3>Limites</h3><p>Ombrages, vieillissement, météo de l'année et évolution des tarifs ne sont pas modélisés finement.</p></article></div></div></section>`),
  sec(footer(c))];

// ------------------------------------------------------------------ RÉALISATIONS
const realisations = (c) => [sec(header(c)),
  pagehead("Chantiers fictifs de démonstration", "Des toits <em>qui produisent.</em>", "Maisons, ateliers, fermes, résidences : quelques exemples d'installations, avec leurs chiffres indicatifs."),
  sec(`<section class="he-rl pk-bleed" data-filters><div class="he-wrap"><div class="he-tabs he-tabs--wrap" role="group" aria-label="Filtrer les réalisations"><a href="#toutes" class="is-on" data-filter="all">Toutes</a><a href="#maisons" data-filter="maison">Maisons</a><a href="#entreprises" data-filter="pro">Entreprises</a><a href="#collectif" data-filter="coll">Collectif</a><a href="#agricole" data-filter="agri">Agricole</a></div>
    <div class="he-rgrid he-rgrid--4">${REAL.map((r) => rcard(...r)).join("")}</div><p class="he-small he-empty">Aucune réalisation dans cette catégorie.</p><p class="he-small">Projets fictifs. Chiffres de production indicatifs, non contractuels.</p></div></section>`),
  sec(`<section class="he-stats he-stats--g pk-bleed"><ul class="he-wrap he-stats-in"><li data-reveal><b data-count="320" data-suffix=" t">320 t</b><span>de CO₂ évitées par an (ordre de grandeur)</span></li><li data-reveal><b data-count="214">214</b><span>installations réalisées</span></li><li data-reveal><b data-count="12" data-suffix=" ans">12 ans</b><span>de recul sur nos plus anciens toits</span></li></ul></section>`),
  sec(cta), sec(footer(c))];

// ------------------------------------------------------------------ AIDES
const aides = (c) => [sec(header(c)),
  pagehead("Aides &amp; démarches", "Comprendre le <em>cadre</em> avant de se lancer.", "Une explication générale des types de soutien et des démarches. Les montants et conditions évoluent : référez-vous toujours aux organismes officiels."),
  sec(`<section class="he-aid pk-bleed"><div class="he-wrap he-aid-in"><div><h2 class="he-h2" data-reveal>Les grandes familles de soutien</h2><p class="he-muted" data-reveal>Selon le projet, plusieurs mécanismes peuvent exister. Nous ne chiffrons ici aucun montant : il dépend de votre situation et de la réglementation en vigueur.</p>
    <div class="he-faq" data-reveal><details open><summary>Soutien à l'autoconsommation</summary><p>Certains dispositifs encouragent les installations en autoconsommation, souvent selon la puissance. Ils peuvent prendre la forme d'une prime versée progressivement.</p></details>
    <details><summary>Rachat du surplus injecté</summary><p>L'électricité non consommée sur place peut être rachetée à un tarif réglementé, par contrat, pendant une durée définie.</p></details>
    <details><summary>Fiscalité réduite</summary><p>Un taux réduit de TVA s'applique parfois aux petites installations résidentielles, sous conditions techniques.</p></details>
    <details><summary>Financement et prêts</summary><p>Des prêts adaptés à la rénovation énergétique existent. Comparez toujours plusieurs offres et lisez les conditions.</p></details>
    <details><summary>Collectivités et entreprises</summary><p>Des appels à projets, amortissements et soutiens régionaux peuvent compléter le plan de financement.</p></details></div></div>
    <aside class="he-warn" data-reveal><h3>À retenir</h3><ul><li>Aucune aide n'est automatique.</li><li>Les conditions changent régulièrement.</li><li>Une aide ne remplace pas une étude sérieuse.</li><li>Gardez vos devis et factures.</li></ul></aside></div></section>`),
  sec(`<section class="he-dem pk-bleed"><div class="he-wrap"><h2 class="he-h2" data-reveal>Les démarches, étape par étape</h2><ol class="he-timeline">${[["Déclaration en mairie", "Une déclaration préalable est souvent requise avant la pose ; nous préparons le dossier."], ["Demande de raccordement", "Elle est adressée au gestionnaire du réseau, avec la puissance prévue."], ["Contrat d'achat du surplus", "Optionnel : à signer si vous souhaitez revendre l'électricité injectée."], ["Attestation de conformité", "Un contrôle de l'installation est exigé avant la mise en service."], ["Mise en service", "Le gestionnaire pose ou configure le compteur ; l'installation démarre."]].map(([t, x], i) => `<li data-reveal><span class="he-tl-n">${i + 1}</span><div><h3>${t}</h3><p>${x}</p></div></li>`).join("")}</ol>
    <p class="he-small">Informations générales, sans valeur de conseil juridique ou fiscal. Vérifiez les règles en vigueur auprès des administrations compétentes.</p></div></section>`),
  sec(cta), sec(footer(c))];

// ------------------------------------------------------------------ À PROPOS
const avatar = (i, bg) => `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="40" fill="${bg}"/><circle cx="40" cy="32" r="13" fill="#fff" opacity=".92"/><path d="M14 74c3-18 14-26 26-26s23 8 26 26z" fill="#fff" opacity=".92"/></svg>`;
const aPropos = (c) => [sec(header(c)),
  pagehead("Notre histoire", "Une entreprise née <em>au soleil</em> de Loire.", "Héliade est une entreprise fictive de démonstration : voici l'esprit que nous aimerions voir dans un installateur solaire."),
  sec(`<section class="he-story pk-bleed"><div class="he-wrap he-story-in"><div class="he-story-t"><h2 class="he-h2" data-reveal>Faire simple, faire juste</h2><p data-reveal>Tout commence dans un garage nantais, avec trois ingénieurs convaincus que l'énergie solaire méritait mieux que des promesses floues. Nous avons choisi un principe : dire ce que nous savons, et ce que nous ne savons pas.</p><p data-reveal>Aujourd'hui, une équipe de vingt personnes étudie, pose et suit des installations pour des maisons, des entreprises et des collectivités.</p></div>
    <ul class="he-values">${[["Honnêteté des chiffres", "Des estimations prudentes, des hypothèses écrites."], ["Qualité de pose", "Des artisans formés, un chantier propre et contrôlé."], ["Sobriété d'abord", "Réduire la consommation avant de produire."], ["Durée", "Du matériel garanti, une maintenance suivie."]].map(([t, x], i) => `<li data-reveal><span>${i + 1}</span><div><h3>${t}</h3><p>${x}</p></div></li>`).join("")}</ul></div></section>`),
  sec(`<section class="he-team pk-bleed"><div class="he-wrap"><h2 class="he-h2" data-reveal>L'équipe (personnages fictifs)</h2><div class="he-team-g">${[["Camille Aubry", "Direction", "#0a5c46"], ["Malik Perrin", "Bureau d'études", "#1b4f8a"], ["Inès Garnier", "Cheffe de chantier", "#d98e00"], ["Théo Marchand", "Relation clients", "#4a8f6a"]].map(([n, r, b], i) => `<article data-reveal>${avatar(i, b)}<h3>${n}</h3><p>${r}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="he-stats he-stats--g pk-bleed"><ul class="he-wrap he-stats-in"><li data-reveal><b data-count="2008">2008</b><span>année de création (fictive)</span></li><li data-reveal><b data-count="20">20</b><span>personnes dans l'équipe</span></li><li data-reveal><b data-count="3" data-suffix=" régions">3 régions</b><span>d'intervention</span></li></ul></section>`),
  sec(cta), sec(footer(c))];

// ------------------------------------------------------------------ BLOG
const POSTS = [
  ["guide", "Guide", "Orientation et inclinaison : ce qui compte vraiment", "5 min", "Le plein sud n'est pas une obligation. Une toiture orientée à l'est ou à l'ouest produit un peu moins sur l'année, mais plus tôt ou plus tard dans la journée, ce qui peut mieux correspondre à vos usages."],
  ["pratique", "Pratique", "Autoconsommation : décaler ses usages sans se priver", "4 min", "Lancer le lave-linge à midi, chauffer l'eau en journée, recharger le vélo électrique au soleil : de petits gestes peuvent augmenter la part de production utilisée sur place."],
  ["env", "Environnement", "Que deviennent les panneaux en fin de vie ?", "6 min", "Le verre, l'aluminium et une partie du silicium sont recyclables grâce à des filières dédiées. La durée de vie d'un panneau dépasse souvent vingt-cinq ans."],
  ["guide", "Guide", "Lire un devis solaire sans se perdre", "7 min", "Puissance en kWc, production annuelle estimée, marque des composants, garanties, aides déduites ou non : voici la liste des lignes à comparer d'un devis à l'autre."],
  ["pratique", "Pratique", "Entretenir son installation en dix minutes par an", "3 min", "Un coup d'œil à l'application, une inspection visuelle, un nettoyage en cas de salissures importantes : l'entretien courant reste léger."],
  ["env", "Environnement", "Empreinte carbone d'un panneau : l'ordre de grandeur", "6 min", "Fabriquer un panneau émet du carbone ; il est généralement compensé en quelques années de production. Le chiffre exact dépend de l'origine et de la région."],
];
const blog = (c) => [sec(header(c)),
  pagehead("Le journal d'Héliade", "Comprendre le <em>solaire</em>, simplement.", "Guides, conseils pratiques et éclairages écologiques. Articles de démonstration."),
  sec(`<section class="he-blog pk-bleed" data-filters><div class="he-wrap"><div class="he-tabs he-tabs--wrap" role="group" aria-label="Filtrer les articles"><a href="#tous" class="is-on" data-filter="all">Tous</a><a href="#guides" data-filter="guide">Guides</a><a href="#pratique" data-filter="pratique">Pratique</a><a href="#environnement" data-filter="env">Environnement</a></div>
    <div class="he-posts he-posts--l">${POSTS.map(([k, t, h, m, x], i) => `<article class="he-art${i === 0 ? " he-art--first" : ""}" data-cat="${k}" data-reveal><div class="he-art-art" aria-hidden="true">${scene(["maison", "ombriere", "ferme", "hangar", "immeuble", "maison"][i], i)}</div><div class="he-art-b"><span class="he-chip">${t}</span><h3>${h}</h3><span class="he-small">${m} de lecture</span><details><summary>Lire l'extrait</summary><p>${x}</p></details></div></article>`).join("")}</div><p class="he-small he-empty">Aucun article dans cette catégorie.</p></div></section>`),
  sec(cta), sec(footer(c))];

// ------------------------------------------------------------------ CONTACT / RECHERCHE / 404
const contact = (c) => [sec(header(c)), pagehead("Parlons de votre toit", "Un échange, <em>sans engagement.</em>", "Décrivez votre projet : nous revenons vers vous sous deux jours ouvrés. Vous avez fait une estimation ? Collez le résumé dans votre message."),
  { type: "form", heading: "Votre projet solaire", intro: "Dites-nous où vous habitez, le type de bâtiment et votre consommation approximative." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une <em>question</em> ?", "Une solution, un article, une démarche."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="he-404 pk-bleed"><div class="he-wrap"><div class="he-404-sun" aria-hidden="true">${sunFull}</div><p class="he-kicker">Éclipse</p><div class="he-h1" role="heading" aria-level="1">Cette page est dans l'ombre.</div><p class="he-lead">Elle n'existe pas ou a changé d'adresse.</p><a class="he-btn he-btn--sun he-btn--lg" href="/">Retour à l'accueil</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "heliade", name: "Héliade", version: "2.0.0", category: "nature", tags: ["moderne", "naturel", "geometrique"], siteType: "Énergie solaire et transition écologique", featured: true,
  concept: "Une journée claire : un soleil et une courbe de production animés, des panneaux dessinés, un bento lumineux et un calculateur d'économies en direct.",
  description: "Entreprise d'énergie solaire fictive : blanc lumineux, jaune soleil, vert profond et bleu ciel, cycle du jour animé, bento clair, solutions, réalisations, aides et calculateur d'économies avec graphique mensuel.",
  brand: "Héliade", modules: ["formulaires", "recherche"],
  dna: { header: "barre-transparente-qui-se-solidifie-au-defilement", hero: "soleil-et-courbe-de-production-animes-en-cycle-du-jour", grid: "bento-clair-a-mini-graphiques", motion: "cycle-du-jour-courbes-qui-se-tracent-et-compteurs", shapes: "soleils-rayons-panneaux-et-courbes-de-production", rhythm: "aere-clair-alterne-ciel-et-paille", signature: "calculateur-d-economies-d-energie-production-et-amortissement" },
  tokens: {
    colors: { primary: "#0a5c46", secondary: "#0a3d33", accent: "#ffb400", background: "#fbfdfa", surface: "#ffffff", text: "#12302a", muted: "#4f6a62", success: "#1e7e46", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.outfit", body: "font.mulish", button: "font.outfit", link: "font.mulish" },
    radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 22 }, shadow: { card: "0 18px 40px -24px rgba(10,92,70,.35)", button: "0 10px 24px -12px rgba(255,180,0,.8)" }, border: { width: 1, color: "#d6e8e0" },
    type: { h1: { size: 64, weight: 700, lineHeight: 1.04 }, h2: { size: 40, weight: 700, lineHeight: 1.12 } },
  },
  options: [
    { key: "sun", label: "Jaune soleil", type: "color", default: "#ffb400" },
    { key: "green", label: "Vert profond", type: "color", default: "#0a5c46" },
    { key: "sky", label: "Bleu ciel", type: "color", default: "#8ecff3" },
    { key: "shape", label: "Coins des cartes", type: "choice", default: "round", choices: [["round", "Arrondis"], ["soft", "Légers"]] },
    { key: "cycle", label: "Cycle du jour animé", type: "choice", default: "on", choices: [["on", "Animé"], ["off", "Fixe (midi)"]] },
  ],
  menu: [["Accueil", "/"], ["Solutions", "/solutions"], ["Calculateur", "/calculateur"], ["Réalisations", "/realisations"], ["Aides", "/aides"], ["À propos", "/a-propos"], ["Blog", "/blog"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "solutions", name: "Solutions", render: solutions }, { key: "solution", name: "Solution : toiture 6 kWc", render: solution },
    { key: "calculateur", name: "Calculateur", render: calculateur }, { key: "realisations", name: "Réalisations", render: realisations }, { key: "aides", name: "Aides & démarches", render: aides },
    { key: "a-propos", name: "À propos", render: aPropos }, { key: "blog", name: "Blog", render: blog }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
