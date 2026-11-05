// Charpente — entreprise de construction et travaux publics. Direction artistique : plan de chantier. Béton clair, noir acier, jaune sécurité ; structure apparente
// (poutrelles, grue, hachures), typographie technique étroite, barre jaune et noire à indicateurs, portfolio de chantiers avant/après à curseur glissant.
const { sec, secs, form, esc, nav } = require("../kit");

/* ---------- Illustrations de chantier (SVG dessinés, avant / après) ---------- */
const R = (x, y, w, h, f, o = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o}/>`;
const L = (x1, y1, x2, y2, s, w = 2, o = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}"${o}/>`;
const P = (pts, f, o = "") => `<polygon points="${pts}" fill="${f}"${o}/>`;
const grid = (n, m, fn) => { let s = ""; for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) s += fn(i, j); return s; };
const sc = (inner) => `<svg class="cp-sc" viewBox="0 0 400 260" width="400" height="260" aria-hidden="true">${inner}</svg>`;

const SCENES = {
  immeuble: (a, v) => {
    const y0 = 36 + v * 8, h = 220 - y0, sky = a ? "#efe9d6" : "#b4b8b8";
    let s = R(0, 0, 400, 260, sky) + (a ? `<circle cx="340" cy="46" r="20" fill="#ffc400"/>` : R(0, 0, 400, 60, "#a3a8a8", ' opacity=".6"')) + R(0, 220, 400, 40, a ? "#5b6670" : "#77746c");
    s += R(96, y0, 208, h, a ? "#f3f1ea" : "#8b887f");
    if (a) {
      s += R(96, y0, 208, 10, "#ffc400") + grid(4, 4, (i, j) => (y0 + 22 + j * 38 < 200 ? R(112 + i * 48, y0 + 22 + j * 38, 32, 26, "#5b6670") + P(`${112 + i * 48},${y0 + 48 + j * 38} ${144 + i * 48},${y0 + 22 + j * 38} ${144 + i * 48},${y0 + 32 + j * 38} ${126 + i * 48},${y0 + 48 + j * 38}`, "#ffffff", ' opacity=".25"') : "")) + R(186, 190, 28, 30, "#16181a") + R(190, 194, 20, 26, "#ffc400") + `<circle cx="70" cy="196" r="20" fill="#6b7f5a"/><circle cx="332" cy="200" r="16" fill="#6b7f5a"/>` + L(70, 210, 70, 220, "#16181a", 3);
    } else {
      s += grid(4, 4, (i, j) => (y0 + 22 + j * 38 < 200 ? R(112 + i * 48, y0 + 22 + j * 38, 32, 26, "#3f3d39") + L(112 + i * 48, y0 + 22 + j * 38, 144 + i * 48, y0 + 48 + j * 38, "#7a6a4a", 3) : "")) + `<polyline points="120,${y0} 130,${y0 + 30} 122,${y0 + 60} 136,${y0 + 100} 128,${y0 + 150}" fill="none" stroke="#4c4a45" stroke-width="2"/><polyline points="260,${y0} 252,${y0 + 40} 266,${y0 + 90}" fill="none" stroke="#4c4a45" stroke-width="2"/>` + R(186, 190, 28, 30, "#3a3835") + P("30,220 36,200 42,220", "#6c7a5a") + P("330,220 338,196 346,220", "#6c7a5a") + R(96, y0 + 110, 208, 14, "#7d7a72", ' opacity=".5"');
    }
    return s;
  },
  charpente: (a, v) => {
    const ax = 52 + v * 6;
    let s = R(0, 0, 400, 260, a ? "#efe9d6" : "#b4b8b8") + R(0, 220, 400, 40, a ? "#5b6670" : "#77746c") + R(70, 130, 260, 90, a ? "#f3f1ea" : "#a8a49a");
    s += grid(3, 1, (i) => R(96 + i * 82, 150, 36, 40, a ? "#5b6670" : "#4a4742")) + R(186, 160, 28, 60, a ? "#ffc400" : "#4a4742");
    if (a) {
      s += P(`200,${ax} 360,134 40,134`, "#2d3338") + [...Array(7).keys()].map((k) => L(60 + k * 6, 134 - k * 11, 340 - k * 6, 134 - k * 11, "#3f484f", 1.5)).join("") + L(200, ax, 360, 134, "#ffc400", 4) + L(200, ax, 40, 134, "#ffc400", 4) + R(268, 70, 18, 38, "#8b887f") + P("152,98 176,84 176,104", "#5b6670");
    } else {
      s += P(`200,${ax} 360,134 40,134`, "none", ' stroke="#c08a4a" stroke-width="5"') + [...Array(7).keys()].map((k) => L(200, ax, 60 + k * 47, 134, "#c08a4a", 3)).join("") + L(120, 96, 280, 96, "#c08a4a", 3) + L(86, 116, 314, 116, "#c08a4a", 3) + L(200, ax, 200, 134, "#c08a4a", 3) + `<circle cx="200" cy="${ax}" r="4" fill="#16181a"/>`;
    }
    return s;
  },
  voirie: (a, v) => {
    let s = R(0, 0, 400, 260, a ? "#efe9d6" : "#b4b8b8") + R(0, 70, 400, 30, a ? "#cfcdc6" : "#9d9a92") + grid(6, 1, (i) => R(10 + i * 66, 52 - ((i * 7 + v * 5) % 22), 42, 60, a ? "#b9b6ad" : "#8e8b84"));
    s += R(0, 98, 400, 162, a ? "#b9b6ad" : "#7e7b72") + P("150,98 250,98 400,260 0,260", a ? "#2a2d30" : "#8a867d");
    if (a) {
      s += P("196,100 204,100 214,260 186,260", "#ffffff", ' opacity=".9"') + L(160, 98, 20, 260, "#ffc400", 3) + L(240, 98, 380, 260, "#ffc400", 3) + [[120, 120], [290, 126]].map(([x, y]) => L(x, y - 40, x, y + 22, "#16181a", 3) + `<circle cx="${x}" cy="${y - 42}" r="6" fill="#ffc400"/>`).join("");
    } else {
      s += `<ellipse cx="190" cy="176" rx="34" ry="12" fill="#4b4944"/><ellipse cx="236" cy="226" rx="46" ry="14" fill="#4b4944"/><ellipse cx="150" cy="140" rx="14" ry="5" fill="#4b4944"/><polyline points="200,100 190,140 206,180 186,230 200,260" fill="none" stroke="#3e3c38" stroke-width="2"/>` + P("0,230 50,222 90,260 0,260", "#a5906a", ' opacity=".7"') + L(40, 140, 70, 126, "#e8761c", 4);
    }
    return s;
  },
  hangar: (a, v) => {
    let s = R(0, 0, 400, 260, a ? "#efe9d6" : "#b4b8b8") + R(0, 214, 400, 46, a ? "#8b887f" : "#77746c");
    if (a) {
      s += R(54, 110, 292, 104, "#d9d6cd") + [...Array(24).keys()].map((k) => L(60 + k * 12, 110, 60 + k * 12, 214, "#bdbab1", 1.5)).join("") + P("44,112 200,64 356,112 346,120 54,120", "#5b6670") + R(54, 150, 292, 10, "#ffc400") + R(150, 164, 100, 50, "#2b3238") + [...Array(5).keys()].map((k) => L(150, 170 + k * 10, 250, 170 + k * 10, "#ffc400", 2)).join("") + R(76, 128, 52, 10, "#5b6670") + R(272, 128, 52, 10, "#5b6670");
    } else {
      s += [60, 130, 270, 340].map((x) => R(x - 4, 100 + (x > 100 && x < 300 ? 0 : 12), 8, 114, "#5b6670")).join("") + L(56, 106, 200, 62, "#5b6670", 6) + L(200, 62, 344, 106, "#5b6670", 6) + L(60, 214, 130, 108, "#5b6670", 2) + L(130, 214, 60, 108, "#5b6670", 2) + L(270, 214, 340, 108, "#5b6670", 2) + L(340, 214, 270, 108, "#5b6670", 2) + L(130, 130, 270, 130, "#5b6670", 5) + L(300, 214, 300, 40, "#ffc400", 4) + L(300, 40, 372, 40, "#ffc400", 4) + L(360, 40, 360, 84, "#16181a", 2) + R(352, 84, 16, 12, "#ffc400");
    }
    return s;
  },
};
const scene = (k, a, v) => sc(SCENES[k](a, v));
const ba = (k, v, label) => `<div class="cp-ba" data-ba aria-label="${esc(label)}"><div class="cp-ba-l">${scene(k, false, v)}</div><div class="cp-ba-r">${scene(k, true, v)}</div><span class="cp-tag cp-tag-a">Avant</span><span class="cp-tag cp-tag-b">Après</span><div class="cp-ba-h" role="slider" aria-label="Curseur avant / après : ${esc(label)}"><svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><rect x="0" y="0" width="44" height="44" fill="#ffc400"/><path d="M15 15l-7 7 7 7M29 15l7 7-7 7" fill="none" stroke="#16181a" stroke-width="3"/></svg></div></div>`;

/* ---------- Données de démonstration : chantiers (fictifs) ---------- */
const TYPES = { renovation: "Rénovation", charpente: "Charpente", voirie: "Voirie et réseaux", industriel: "Industriel" };
const CH = [
  { n: "Résidence Les Quais", k: "immeuble", t: "renovation", v: "Nantes", y: 2024, s: "3 400 m²", d: "14 mois", c: "Bailleur social (exemple)", st: ["Études et diagnostic|2 mois", "Curage et désamiantage|3 mois", "Reprise de structure|4 mois", "Façade et menuiseries|3 mois", "Réception|2 mois"], i: 0 },
  { n: "Halle Pasteur", k: "hangar", t: "industriel", v: "Lille", y: 2025, s: "5 200 m²", d: "9 mois", c: "Groupe industriel (exemple)", st: ["Terrassement et fondations|2 mois", "Dallage industriel|2 mois", "Montage de la charpente métallique|3 mois", "Bardage et couverture|1 mois", "Finitions et essais|1 mois"], i: 1 },
  { n: "Groupe scolaire Jean-Zay", k: "charpente", t: "charpente", v: "Lyon", y: 2023, s: "1 850 m²", d: "7 mois", c: "Commune (exemple)", st: ["Relevé et calepinage|1 mois", "Fabrication en atelier|2 mois", "Levage et assemblage|1 mois", "Couverture et zinguerie|2 mois", "Réception|1 mois"], i: 2 },
  { n: "Rue des Forges", k: "voirie", t: "voirie", v: "Bordeaux", y: 2024, s: "2 400 m²", d: "5 mois", c: "Métropole (exemple)", st: ["Déviation et signalisation|1 semaine", "Dépose et terrassement|1 mois", "Réseaux humides|2 mois", "Structure de chaussée|1 mois", "Enrobés et marquage|2 semaines"], i: 3 },
  { n: "Maison des Associations", k: "charpente", t: "charpente", v: "Nantes", y: 2025, s: "920 m²", d: "6 mois", c: "Ville (exemple)", st: ["Études d'exécution|1 mois", "Gros œuvre|2 mois", "Charpente bois lamellé|1 mois", "Couverture|1 mois", "Aménagements|1 mois"], i: 4 },
  { n: "Tour Belvédère", k: "immeuble", t: "renovation", v: "Lyon", y: 2023, s: "6 800 m²", d: "18 mois", c: "Copropriété (exemple)", st: ["Diagnostics|2 mois", "Échafaudage et dépose|3 mois", "Réfection des planchers|6 mois", "Isolation et façade|5 mois", "Réception|2 mois"], i: 5 },
  { n: "Plateforme logistique Nord", k: "hangar", t: "industriel", v: "Lille", y: 2024, s: "8 100 m²", d: "11 mois", c: "Opérateur logistique (exemple)", st: ["Plateforme et fondations|3 mois", "Ossature acier|3 mois", "Enveloppe et quais|3 mois", "Réseaux et sprinklage|1 mois", "Essais et remise|1 mois"], i: 6 },
  { n: "Avenue du Port", k: "voirie", t: "voirie", v: "Bordeaux", y: 2025, s: "3 600 m²", d: "4 mois", c: "Collectivité (exemple)", st: ["Phasage de circulation|1 semaine", "Purge de chaussée|1 mois", "Assainissement|1 mois", "Couche de roulement|1 mois", "Éclairage et marquage|2 semaines"], i: 7 },
];
const card = (c) => `<article class="cp-card cp-it" data-type="${c.t}" data-ville="${c.v}" data-an="${c.y}" data-name="${esc(c.n)}" data-surf="${esc(c.s)}" data-dur="${esc(c.d)}" data-client="${esc(c.c)}" data-steps="${esc(c.st.join("~"))}" data-reveal>${ba(c.k, c.i % 4, c.n)}<div class="cp-card-b"><p class="cp-ct">${TYPES[c.t]} · ${c.v}</p><h3>${esc(c.n)}</h3><ul class="cp-spec"><li><b>${esc(c.s)}</b>surface</li><li><b>${esc(c.d)}</b>durée</li><li><b>${c.y}</b>livraison</li></ul><a class="cp-more" href="/realisation" data-open>Fiche chantier<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="3"/></svg></a></div></article>`;
const panel = `<aside class="cp-panel" role="dialog" aria-label="Fiche chantier" aria-modal="true"><div class="cp-panel-in"><a class="cp-close" href="#fermer" data-close>Fermer la fiche</a><div class="cp-pbody"></div></div></aside>`;

/* ---------- Dessins techniques (métiers) ---------- */
const hatch = (x, y, w, h, st = 8, col = "#ffc400") => { let s = ""; for (let o = -h; o < w; o += st) s += `<line x1="${x + Math.max(0, o)}" y1="${y + Math.max(0, -o)}" x2="${x + Math.min(w, o + h)}" y2="${y + Math.min(h, w - o)}" stroke="${col}" stroke-width="1"/>`; return s; };
const BP = {
  gros: () => R(30, 110, 260, 22, "none", ' stroke="#fff" stroke-width="2"') + hatch(30, 110, 260, 22, 9) + R(60, 132, 50, 40, "none", ' stroke="#fff" stroke-width="2"') + hatch(60, 132, 50, 40) + R(210, 132, 50, 40, "none", ' stroke="#fff" stroke-width="2"') + hatch(210, 132, 50, 40) + R(120, 40, 14, 70, "none", ' stroke="#fff" stroke-width="2"') + R(176, 40, 14, 70, "none", ' stroke="#fff" stroke-width="2"') + R(114, 30, 82, 10, "#ffc400") + L(20, 172, 300, 172, "#fff", 2, '') + L(30, 190, 290, 190, "#ffc400", 1.5) + L(30, 184, 30, 196, "#ffc400", 1.5) + L(290, 184, 290, 196, "#ffc400", 1.5),
  charp: () => L(30, 150, 290, 150, "#fff", 4) + L(30, 150, 160, 50, "#fff", 4) + L(160, 50, 290, 150, "#fff", 4) + [95, 125, 195, 225].map((x) => L(x, 150, 160, 50 + Math.abs(x - 160) * 0.1, "#ffc400", 1.5)).join("") + L(95, 150, 125, 100, "#ffc400", 2) + L(225, 150, 195, 100, "#ffc400", 2) + L(125, 100, 195, 100, "#ffc400", 2) + [30, 160, 290].map((x) => `<circle cx="${x}" cy="${x === 160 ? 50 : 150}" r="5" fill="#16181a" stroke="#ffc400" stroke-width="2"/>`).join("") + L(30, 176, 290, 176, "#fff", 1.5) + L(30, 170, 30, 182, "#fff", 1.5) + L(290, 170, 290, 182, "#fff", 1.5),
  reno: () => R(70, 40, 40, 140, "none", ' stroke="#fff" stroke-width="2"') + hatch(70, 40, 40, 140, 10) + R(210, 40, 40, 140, "none", ' stroke="#fff" stroke-width="2"') + hatch(210, 40, 40, 140, 10, "#5b6670") + L(110, 70, 210, 70, "#ffc400", 5) + L(110, 120, 210, 120, "#ffc400", 5) + L(110, 70, 210, 120, "#fff", 1.5, '') + L(110, 120, 210, 70, "#fff", 1.5, '') + L(40, 180, 280, 180, "#fff", 2),
  voie: () => R(30, 60, 260, 20, "#2a2d30", ' stroke="#fff" stroke-width="2"') + R(30, 80, 260, 28, "none", ' stroke="#fff" stroke-width="2"') + hatch(30, 80, 260, 28, 12, "#5b6670") + R(30, 108, 260, 34, "none", ' stroke="#fff" stroke-width="2"') + [...Array(30).keys()].map((k) => `<circle cx="${40 + k * 8.5}" cy="${118 + (k % 3) * 8}" r="2" fill="#ffc400"/>`).join("") + R(30, 142, 260, 30, "none", ' stroke="#fff" stroke-width="2"') + hatch(30, 142, 260, 30, 10, "#fff") + R(120, 142, 80, 18, "none", ' stroke="#ffc400" stroke-width="4"') + L(300, 60, 300, 172, "#ffc400", 1.5) + L(294, 60, 306, 60, "#ffc400", 1.5) + L(294, 172, 306, 172, "#ffc400", 1.5),
};
const bp = (k) => `<svg class="cp-bp-svg" viewBox="0 0 320 200" width="320" height="200" aria-hidden="true">${BP[k]()}</svg>`;
const hat = `<svg class="cp-hat" viewBox="0 0 48 40" width="44" height="36" aria-hidden="true"><path d="M6 30c0-12 8-22 18-22s18 10 18 22z" fill="#16181a"/><rect x="2" y="30" width="44" height="6" fill="#16181a"/><rect x="21" y="6" width="6" height="22" fill="#ffc400"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="3"/></svg>`;
const SIGN = {
  w: `<svg class="cp-sign" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><path d="M32 6 60 56H4z" fill="#ffc400" stroke="#16181a" stroke-width="4" stroke-linejoin="round"/><rect x="29" y="22" width="6" height="18" fill="#16181a"/><circle cx="32" cy="47" r="3.5" fill="#16181a"/></svg>`,
  o: `<svg class="cp-sign" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#2b3238" stroke="#fff" stroke-width="4"/><path d="M16 38c0-10 7-18 16-18s16 8 16 18z" fill="#ffc400"/><rect x="13" y="38" width="38" height="5" fill="#ffc400"/></svg>`,
  i: `<svg class="cp-sign" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><rect x="5" y="5" width="54" height="54" fill="#fff" stroke="#16181a" stroke-width="4"/><path d="M18 34l10 10 18-22" fill="none" stroke="#16181a" stroke-width="7"/></svg>`,
};

/* ---------- Charpente de page : en-tête, pied, bandeau de page ---------- */
const header = (c) => {
  const bar = c.menu.filter(({ url }) => url !== "/" && url !== "/devis");
  return `<header class="cp-head pk-bleed">
  <div class="cp-top"><ul class="cp-ind" aria-label="Indicateurs de chantier (valeurs de démonstration)"><li><span class="cp-dot"></span><b>14</b> chantiers en cours</li><li><b>412</b> jours sans accident</li><li><b>3</b> levages cette semaine</li></ul><a class="cp-top-a" href="/contact">Urgence chantier : contactez-nous</a></div>
  <div class="cp-bar"><a class="cp-logo" href="/" aria-label="${esc(c.brand)} — accueil">${hat}<span><b>CHARPENTE</b><i>Bâtiment · Travaux publics</i></span></a>
    <div class="cp-nav" role="navigation" aria-label="Navigation principale">${nav(bar)}</div>
    <a class="cp-btn cp-btn--k" href="/devis">Demander un devis${arrow}</a>
    <details class="cp-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cp-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="cp-btn cp-btn--k" href="/devis">Demander un devis${arrow}</a></div></details></div>
  <div class="cp-haz cp-stripe" aria-hidden="true"></div></header>`;
};
const footer = (c) => `<footer class="cp-foot pk-bleed"><div class="cp-haz cp-stripe" aria-hidden="true"></div><div class="cp-foot-word" aria-hidden="true">CHARPENTE</div>
  <div class="cp-foot-grid"><div><p class="cp-foot-lead">Nous construisons, rénovons et réparent ce sur quoi vous comptez.</p><address>12 quai de la Grue<br>59000 Lille<br><a href="mailto:chantiers@charpente-demo.example">chantiers@charpente-demo.example</a></address></div>
  <div><h3>Savoir-faire</h3>${nav(c.menu.slice(1, 4), "cp-fl")}</div><div><h3>L'entreprise</h3>${nav(c.menu.slice(4, 6), "cp-fl")}<a class="cp-fl" href="/devis">Devis</a></div><div><h3>Aide</h3><a class="cp-fl" href="/contact">Contact</a><a class="cp-fl" href="/recherche">Recherche</a></div></div>
  <p class="cp-legal">© Charpente BTP — site de démonstration. Entreprise, chantiers, chiffres et indicateurs fictifs.</p></footer>`;
const ph = (no, kicker, title, sub) => sec(`<section class="cp-ph cp-bp pk-bleed"><div class="cp-ph-in"><p class="cp-kicker" data-reveal><span>${no}</span>${esc(kicker)}</p><div class="cp-giant" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="cp-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div><div class="cp-cartouche" aria-hidden="true"><span>Plan ${no}</span><span>Éch. 1/50</span><span>Démonstration</span></div></section>`);
const h2 = (k, t, extra = "") => `<div class="cp-sh" data-reveal><p class="cp-kicker"><span>//</span>${esc(k)}</p><h2>${t}</h2>${extra}</div>`;
const cta = (t, s) => sec(`<section class="cp-cta cp-haz-b pk-bleed"><div class="cp-cta-in" data-reveal><h2>${t}</h2><p>${esc(s)}</p><a class="cp-btn cp-btn--k cp-btn--lg" href="/devis">Demander un devis${arrow}</a><a class="cp-btn cp-btn--line cp-btn--lg" href="/contact">Parler à un conducteur de travaux</a></div></section>`);
const filterBar = (groups, label) => `<div class="cp-fbar" role="group" aria-label="${esc(label)}">${groups.map(([f, name, vals]) => `<div class="cp-fg"><span class="cp-fl-t">${name}</span>${[["*", "Tous"]].concat(vals).map(([v, l], i) => `<a class="cp-chip${i ? "" : " is-on"}" href="#${f}-${v === "*" ? "tous" : String(v).toLowerCase()}" role="button" aria-pressed="${i ? "false" : "true"}" data-f="${f}" data-v="${v}">${esc(l)}</a>`).join("")}</div>`).join("")}<p class="cp-count" role="status" aria-live="polite"><b data-count>${CH.length}</b> chantiers affichés</p></div>`;

/* ---------- Pages ---------- */
const lots = [
  ["01", "Gros œuvre", "gros", "Fondations, voiles, dalles, ouvrages en béton armé. Du terrassement au clos-couvert."],
  ["02", "Charpente et ossature", "charp", "Charpente bois, lamellé-collé et métallique, fabriquée en atelier puis levée en un temps."],
  ["03", "Rénovation lourde", "reno", "Curage, reprise en sous-œuvre, renforcement de planchers, façades et isolation."],
  ["04", "Voirie et réseaux", "voie", "Terrassement, assainissement, chaussées, trottoirs, éclairage. Chantiers sous circulation."],
];
const heroSvg = `<svg class="cp-struct" viewBox="0 0 640 520" width="640" height="520" role="img" aria-label="Dessin d'une structure métallique en cours de montage avec une grue"><title>Structure en cours de montage</title>
  <g stroke="#16181a" stroke-width="1" opacity=".18">${[...Array(13).keys()].map((k) => L(k * 50, 0, k * 50, 520, "#16181a", 1)).join("")}${[...Array(11).keys()].map((k) => L(0, k * 50, 640, k * 50, "#16181a", 1)).join("")}</g>
  ${R(0, 470, 640, 50, "#16181a")}${hatch(0, 470, 640, 50, 14)}
  <g class="cp-cols">${[70, 230, 390].map((x) => R(x, 120, 16, 350, "#16181a") + R(x - 10, 120, 36, 8, "#16181a") + R(x - 14, 462, 44, 10, "#5b6670")).join("")}</g>
  ${L(78, 470, 238, 360, "#5b6670", 3)}${L(238, 470, 78, 360, "#5b6670", 3)}${L(238, 470, 398, 360, "#5b6670", 3)}${L(398, 470, 238, 360, "#5b6670", 3)}
  <g class="cp-beams">${R(60, 340, 350, 14, "#ffc400")}${R(60, 230, 350, 14, "#ffc400")}${R(60, 120, 350, 14, "#ffc400")}</g>
  ${L(78, 240, 238, 130, "#16181a", 3)}${L(238, 240, 78, 130, "#16181a", 3)}${L(238, 240, 398, 130, "#16181a", 3)}${L(398, 240, 238, 130, "#16181a", 3)}
  ${[70, 150, 230, 310, 390].map((x) => `<circle cx="${x + 8}" cy="${127}" r="4" fill="#16181a"/><circle cx="${x + 8}" cy="${237}" r="4" fill="#16181a"/>`).join("")}
  <g>${R(480, 40, 14, 430, "#16181a")}${R(470, 456, 34, 14, "#5b6670")}${[...Array(9).keys()].map((k) => L(480, 60 + k * 46, 494, 60 + (k + 1) * 46, "#ffc400", 2) + L(494, 60 + k * 46, 480, 60 + (k + 1) * 46, "#ffc400", 2)).join("")}
   <g class="cp-jib">${R(300, 40, 300, 12, "#16181a")}${P("480,40 487,8 494,40", "#ffc400")}${L(487, 8, 320, 40, "#16181a", 2)}${L(487, 8, 590, 40, "#16181a", 2)}${R(560, 52, 28, 22, "#16181a")}
   <g class="cp-hook">${L(340, 52, 340, 200, "#16181a", 2)}${R(326, 200, 28, 14, "#ffc400")}${R(300, 214, 80, 12, "#16181a")}${L(310, 226, 340, 200, "#16181a", 1.5)}${L(370, 226, 340, 200, "#16181a", 1.5)}</g></g></g>
  <g stroke="#16181a" stroke-width="2">${L(30, 100, 30, 470, "#16181a", 1.5)}${L(22, 100, 38, 100, "#16181a", 2)}${L(22, 470, 38, 470, "#16181a", 2)}${L(22, 230, 38, 230, "#16181a", 2)}</g></svg>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="cp-hero cp-bp pk-bleed"><div class="cp-hero-in"><div class="cp-hero-copy"><p class="cp-kicker" data-reveal><span>N° 01</span>Entreprise générale · Depuis 1997</p>
    <div class="cp-mega" role="heading" aria-level="1"><span data-reveal>On bâtit</span><span data-reveal>ce qui</span><span class="cp-hl" data-reveal>tient.</span></div>
    <p class="cp-lead" data-reveal>Gros œuvre, charpente, rénovation lourde et travaux publics. Une équipe intégrée, des ouvrages livrés dans les délais et un chantier toujours propre et sûr.</p>
    <div class="cp-actions" data-reveal><a class="cp-btn cp-btn--k cp-btn--lg" href="/devis">Demander un devis${arrow}</a><a class="cp-btn cp-btn--line cp-btn--lg" href="/realisations">Voir les chantiers</a></div></div>
    <div class="cp-plan" data-reveal>${heroSvg}<p class="cp-plan-cap"><b>Plan 01</b> Ossature acier, niveaux R+2 · en montage</p></div></div></section>`),
  sec(`<section class="cp-belt pk-bleed" aria-label="Chiffres clés (démonstration)"><div class="cp-belt-track">${[0, 1].map((k) => `<div class="cp-belt-set"${k ? ' aria-hidden="true"' : ""}>${["28 ans de chantiers", "140 ouvrages livrés", "320 compagnons", "14 chantiers en cours", "Plan de prévention sur chaque site"].map((t) => `<span><i></i>${t}</span>`).join("")}</div>`).join("")}</div></section>`),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Savoir-faire", "Quatre métiers, <em>une seule équipe</em>", `<p>Nous réalisons nous-mêmes l'essentiel des lots : moins d'intermédiaires, un planning tenu.</p>`)}
    <div class="cp-lots">${lots.map(([n, t, k, d]) => `<article class="cp-lot" data-reveal><span class="cp-lot-n">${n}</span><div class="cp-lot-draw">${bp(k)}</div><h3>${t}</h3><p>${d}</p><a class="cp-more" href="/metiers">Voir le métier${arrow}</a></article>`).join("")}</div></div></section>`),
  sec(`<section class="cp-sec cp-sec--steel cp-sec--tight pk-bleed"><div class="cp-wrap">${h2("Chantiers livrés", "Avant, <em>après</em>. Faites glisser.", `<p>Chaque ouvrage se compare d'un geste : glissez le curseur, ou utilisez les flèches du clavier.</p>`)}<div class="cp-grid cp-grid--list">${CH.slice(0, 2).map(card).join("")}</div></div></section>`),
  sec(`<section class="cp-sec cp-sec--steel cp-sec--flush pk-bleed"><div class="cp-wrap"><div class="cp-grid cp-grid--list">${CH.slice(2, 4).map(card).join("")}</div><p class="cp-more-row"><a class="cp-btn cp-btn--y cp-btn--lg" href="/realisations">Tous les chantiers, avec filtres${arrow}</a></p></div></section>`), sec(panel),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Méthode", "Du plan à la <em>remise des clés</em>")}
    <ol class="cp-steps">${[["Visite et étude", "On relève, on diagnostique, on chiffre."], ["Planning et sécurité", "Phasage, PPSPS, installation du chantier."], ["Réalisation", "Compagnons permanents, point hebdomadaire."], ["Réception", "Levée des réserves, dossier des ouvrages, garanties."]].map(([t, d], i) => `<li data-reveal><span class="cp-sn">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="cp-sec cp-sec--ink pk-bleed"><div class="cp-wrap cp-numbers" aria-label="Chiffres (démonstration)">${[["28", "ans d'expérience"], ["140", "ouvrages livrés"], ["96", "% de chantiers livrés à la date prévue"], ["412", "jours sans accident"]].map(([n, l]) => `<div class="cp-num" data-reveal><b data-to="${n}">${n}</b><span>${l}</span></div>`).join("")}</div></section>`),
  cta("Un projet ? Parlons de votre terrain.", "Décrivez-nous l'ouvrage : un conducteur de travaux vous rappelle sous deux jours ouvrés."),
  sec(footer(c)),
];

const metiers = (c) => [
  sec(header(c)), ph("02", "Savoir-faire", "Les métiers<br>du chantier", "Quatre lots maîtrisés en interne, des sous-traitants uniquement pour les spécialités rares."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-trades">${lots.map(([n, t, k, d], i) => `<article class="cp-trade${i % 2 ? " cp-trade--r" : ""}" data-reveal><div class="cp-trade-draw cp-bp-dark">${bp(k)}<span class="cp-trade-n">${n}</span></div><div class="cp-trade-t"><h2>${t}</h2><p>${d}</p><ul class="cp-ticks">${[["Gros œuvre", "Béton armé, banché, dalles, murs de soutènement"], ["Charpente et ossature", "Bois massif, lamellé-collé, acier, assemblage et levage"], ["Rénovation lourde", "Curage, reprise en sous-œuvre, façades, isolation par l'extérieur"], ["Voirie et réseaux", "Terrassement, canalisations, enrobés, éclairage public"]][i][1].split(", ").map((x) => `<li>${x}</li>`).join("")}</ul></div></article>`).join("")}</div></section>`),
  sec(`<section class="cp-sec cp-sec--steel pk-bleed"><div class="cp-wrap">${h2("Capacités", "Ce que nous <em>savons lever</em>")}
    <div class="cp-tablewrap" data-reveal><table class="cp-table"><caption>Capacités indicatives de l'entreprise (valeurs de démonstration)</caption><thead><tr><th>Domaine</th><th>Taille type</th><th>Équipe</th><th>Délai indicatif</th></tr></thead><tbody>
    <tr><td data-l="Domaine">Maison, extension</td><td data-l="Taille type">80 à 400 m²</td><td data-l="Équipe">6 à 10</td><td data-l="Délai indicatif">4 à 8 mois</td></tr>
    <tr><td data-l="Domaine">Immeuble collectif</td><td data-l="Taille type">1 500 à 7 000 m²</td><td data-l="Équipe">20 à 60</td><td data-l="Délai indicatif">12 à 20 mois</td></tr>
    <tr><td data-l="Domaine">Halle, entrepôt</td><td data-l="Taille type">2 000 à 10 000 m²</td><td data-l="Équipe">15 à 40</td><td data-l="Délai indicatif">8 à 12 mois</td></tr>
    <tr><td data-l="Domaine">Voirie urbaine</td><td data-l="Taille type">1 000 à 5 000 m²</td><td data-l="Équipe">10 à 25</td><td data-l="Délai indicatif">3 à 6 mois</td></tr></tbody></table></div></div></section>`),
  cta("Un lot précis à confier ?", "Nous intervenons aussi en lot séparé : charpente seule, voirie seule, reprise de structure."), sec(footer(c)),
];

const realisations = (c) => [
  sec(header(c)), ph("03", "Portfolio", "Réalisations", "Huit chantiers livrés. Filtrez par type, par ville ou par année, puis glissez pour comparer l'avant et l'après."),
  sec(`<section class="cp-sec cp-sec--tight pk-bleed"><div class="cp-wrap">${filterBar([["type", "Type", Object.entries(TYPES)], ["ville", "Ville", ["Bordeaux", "Lille", "Lyon", "Nantes"].map((v) => [v, v])], ["an", "Année", ["2025", "2024", "2023"].map((v) => [v, v])]], "Filtres des chantiers")}</div></section>`),
  ...[0, 2, 4, 6].map((i) => sec(`<section class="cp-sec cp-sec--flush cp-sec--tight pk-bleed"><div class="cp-wrap"><div class="cp-grid cp-grid--list">${CH.slice(i, i + 2).map(card).join("")}</div></div></section>`)),
  sec(`<section class="cp-sec cp-sec--flush pk-bleed"><div class="cp-wrap"><p class="cp-empty" role="status">Aucun chantier ne correspond à ces filtres. <a href="/contact">Parlez-nous de votre projet</a>.</p></div></section>`), sec(panel),
  cta("Le prochain chantier pourrait être le vôtre.", "Envoyez-nous votre plan ou votre idée : nous vous disons ce qui est faisable."), sec(footer(c)),
];

const GANT = [["Terrassement et fondations", 0, 2], ["Dallage industriel", 2, 2], ["Charpente métallique", 4, 3], ["Bardage et couverture", 7, 1], ["Finitions et essais", 8, 1]];
const gantt = (rows, n) => `<ol class="cp-gantt" aria-label="Planning du chantier">${rows.map(([l, o, w, dd]) => `<li><span class="cp-g-l">${l}</span><span class="cp-g-t" aria-hidden="true"><i class="cp-o${o} cp-w${w}"></i></span><span class="cp-g-d">${dd || (w + (w > 1 ? " mois" : " mois"))}</span></li>`).join("")}</ol>`;
const realisation = (c) => {
  const h = CH[1];
  return [
    sec(header(c)), ph("04", "Fiche chantier · Industriel", "Halle<br>Pasteur", "Lille · livrée en 2025. Une halle de production de 5 200 m² montée en neuf mois, sans arrêt de l'activité voisine."),
    sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-detail"><div class="cp-detail-ba" data-reveal>${ba(h.k, 1, h.n)}<p class="cp-hint">Glissez le curseur ou utilisez les flèches gauche et droite.</p></div>
      <dl class="cp-sheet" data-reveal><div><dt>Surface</dt><dd>5 200 m²</dd></div><div><dt>Durée</dt><dd>9 mois</dd></div><div><dt>Ville</dt><dd>Lille</dd></div><div><dt>Livraison</dt><dd>2025</dd></div><div><dt>Acier posé</dt><dd>186 tonnes</dd></div><div><dt>Effectif de pointe</dt><dd>34 compagnons</dd></div></dl></div></section>`),
    sec(`<section class="cp-sec cp-sec--steel pk-bleed"><div class="cp-wrap cp-detail2"><div data-reveal>${h2("Déroulé", "Neuf mois, <em>cinq étapes</em>")}<p class="cp-p">Les poteaux ont été assemblés en atelier, puis levés par grue mobile en trois nuits pour ne pas gêner la circulation voisine.</p></div><div data-reveal>${gantt(GANT)}</div></div></section>`),
    sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Autres chantiers", "À voir <em>aussi</em>")}<div class="cp-minis">${[CH[6], CH[2], CH[0]].map((x) => `<a class="cp-mini" href="/realisations" data-reveal><span>${TYPES[x.t]} · ${x.v}</span><b>${esc(x.n)}</b><em>${x.s} · ${x.d}</em></a>`).join("")}</div></div></section>`),
    cta("Un ouvrage de cette taille ?", "Parlons planning, accès et phasage dès la visite de site."), sec(footer(c)),
  ];
};

const RULES = [["w", "Plan de prévention signé avant la première pelle", "Chaque chantier a son plan, relu avec le maître d'ouvrage."], ["o", "Casque, chaussures, gilet : sans exception", "Équipements fournis, contrôlés chaque matin au point d'accueil."], ["i", "Quart d'heure sécurité", "Chaque semaine, toute l'équipe fait le point sur les risques de la phase."], ["w", "Travaux en hauteur encadrés", "Garde-corps avant tout travail, harnais en dernier recours."], ["o", "Levage planifié", "Plan de levage écrit, zone dégagée, élingueur habilité."], ["i", "Chantier propre", "Un chantier rangé est un chantier sûr : nettoyage quotidien."]];
const PH = [["Visite et étude", 0, 1], ["Devis et planning", 1, 1], ["Installation de chantier", 2, 1], ["Gros œuvre", 3, 3], ["Second œuvre", 6, 3], ["Réception et garanties", 9, 1]];
const process = (c) => [
  sec(header(c)), ph("05", "Méthode et sécurité", "Process &amp;<br>sécurité", "Une méthode écrite, des règles non négociables. Voici comment un chantier avance, et comment on rentre tous le soir."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Phasage type", "Six phases, <em>un planning partagé</em>")}<div data-reveal>${gantt(PH.map(([l, o, w]) => [l, o, w, w + " mois"]))}<p class="cp-note">Planning indicatif d'un chantier moyen. Chaque projet reçoit son propre calendrier.</p></div></div></section>`),
  sec(`<section class="cp-sec cp-sec--ink pk-bleed"><div class="cp-wrap">${h2("Sécurité", "Six règles <em>affichées à l'entrée</em>")}
    <div class="cp-rules">${RULES.map(([s, t, d], i) => `<article class="cp-rule" data-reveal><span class="cp-rule-n">0${i + 1}</span>${SIGN[s]}<h3>${t}</h3><p>${d}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-faq">${h2("Questions", "Ce qu'on nous <em>demande souvent</em>")}<div>
    <details data-reveal><summary>Pouvons-nous visiter le chantier ?</summary><p>Oui, sur rendez-vous et accompagnés d'un conducteur de travaux, avec équipements fournis.</p></details>
    <details data-reveal><summary>Comment sommes-nous informés de l'avancement ?</summary><p>Une réunion de chantier chaque semaine, un compte rendu écrit et des photos datées.</p></details>
    <details data-reveal><summary>Que se passe-t-il en cas d'aléa ?</summary><p>Le conducteur de travaux vous prévient le jour même et propose un plan de rattrapage chiffré.</p></details>
    <details data-reveal><summary>Quelles garanties après la réception ?</summary><p>Les garanties légales s'appliquent après la réception ; le détail figure dans votre devis.</p></details></div></div></section>`),
  cta("Un chantier en site occupé ?", "Nous préparons un phasage spécifique pour travailler sans gêner votre activité."), sec(footer(c)),
];

const entreprise = (c) => [
  sec(header(c)), ph("06", "L'entreprise", "Une maison<br>de chantier", "Fondée en 1997 par trois compagnons. Aujourd'hui 320 personnes, la même exigence."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Parcours", "Vingt-huit ans, <em>poutre après poutre</em>")}<ol class="cp-line">${[["1997", "Trois compagnons fondent l'entreprise à Lille, d'abord en charpente."], ["2005", "Ouverture du pôle gros œuvre et premier immeuble collectif."], ["2012", "Création de l'atelier de fabrication de charpente métallique."], ["2018", "Pôle voirie et réseaux : premières interventions pour les collectivités."], ["2024", "Plus de 140 ouvrages livrés, 320 collaborateurs."]].map(([y, t]) => `<li data-reveal><b>${y}</b><p>${t}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="cp-sec cp-sec--steel pk-bleed"><div class="cp-wrap">${h2("Valeurs", "Ce qui <em>porte</em> l'ouvrage")}<div class="cp-vals">${[["Parole tenue", "Un délai annoncé est un délai tenu, ou prévenu à l'avance."], ["Sécurité d'abord", "Aucun planning ne justifie un risque."], ["Transmission", "Chaque année, des apprentis rejoignent l'équipe."], ["Chantier propre", "Respect des voisins, du site et des horaires."]].map(([t, d], i) => `<article class="cp-val" data-reveal><span>0${i + 1}</span><h3>${t}</h3><p>${d}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Direction", "Ceux qui <em>répondent</em> au téléphone")}<div class="cp-team">${[["Marc Delvaux", "Directeur général"], ["Inès Karoui", "Directrice des travaux"], ["Paul Hennequin", "Responsable sécurité"], ["Sofia Marchetti", "Cheffe d'atelier charpente"]].map(([n, r]) => `<article class="cp-person" data-reveal><svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true"><rect width="120" height="120" fill="#cfcdc6"/><path d="M28 70c0-22 14-38 32-38s32 16 32 38z" fill="#ffc400"/><rect x="22" y="68" width="76" height="8" fill="#ffc400"/><circle cx="60" cy="86" r="16" fill="#5b6670"/><path d="M20 120c0-22 18-30 40-30s40 8 40 30z" fill="#16181a"/></svg><h3>${n}</h3><p>${r}</p></article>`).join("")}</div><p class="cp-note">Personnes fictives, pour la démonstration.</p></div></section>`),
  sec(`<section class="cp-sec cp-sec--ink pk-bleed"><div class="cp-wrap">${h2("Qualifications", "Reconnus <em>par les pairs</em>")}<ul class="cp-quals" data-reveal>${["Qualification gros œuvre (exemple)", "Qualification charpente métallique (exemple)", "Management de la sécurité (exemple)", "Management environnemental (exemple)", "Atelier de fabrication contrôlé (exemple)"].map((q) => `<li>${q}</li>`).join("")}</ul></div></section>`),
  cta("Travaillons ensemble.", "Maître d'ouvrage, architecte, bailleur : présentez-nous votre projet."), sec(footer(c)),
];

const JOBS = [["Chef de chantier", "cdi", "Lille", "CDI", "Vous dirigez les équipes d'un chantier de 3 000 à 6 000 m², garantissez la sécurité et le planning.", "8 ans d'expérience en gros œuvre ; lecture de plans ; sens du collectif."], ["Charpentier métallique", "cdi", "Lyon", "CDI", "Fabrication et montage d'ossatures acier en atelier et sur chantier.", "CAP ou bac pro, habilitations de levage appréciées."], ["Conducteur d'engins", "cdi", "Bordeaux", "CDI", "Pelle, chargeuse et compacteur sur chantiers de voirie et réseaux.", "Permis d'engins ; autonomie ; goût du travail d'équipe."], ["Apprenti maçon", "alternance", "Nantes", "Alternance", "Formation de 2 ans en alternance auprès d'un compagnon référent.", "Motivation, goût du concret ; aucune expérience requise."], ["Technicien d'études de prix", "cdi", "Lille", "CDI", "Vous chiffrez les consultations et préparez les offres avec les conducteurs de travaux.", "Bac+2 bâtiment ; rigueur ; maîtrise d'un tableur."], ["Apprenti conducteur de travaux", "alternance", "Lyon", "Alternance", "Vous découvrez le suivi de chantier aux côtés d'un conducteur confirmé.", "Bac+3 en préparation ; curiosité ; sens de l'organisation."]];
const recrutement = (c) => [
  sec(header(c)), ph("07", "Recrutement", "On<br>recrute", "Des compagnons, des techniciens, des apprentis. Des offres présentées à titre d'exemple pour cette démonstration."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Pourquoi nous", "Un métier <em>qui se voit</em>")}<div class="cp-vals">${[["Équipe permanente", "Peu d'intérim : vous travaillez avec les mêmes personnes."], ["Formation continue", "Habilitations, levage, sécurité : prises en charge."], ["Progression", "De compagnon à chef de chantier en passant par la formation interne."]].map(([t, d], i) => `<article class="cp-val" data-reveal><span>0${i + 1}</span><h3>${t}</h3><p>${d}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="cp-sec cp-sec--steel pk-bleed"><div class="cp-wrap">${h2("Offres", "Postes <em>d'exemple</em>")}${filterBar([["contrat", "Contrat", [["cdi", "CDI"], ["alternance", "Alternance"]]], ["ville", "Ville", ["Bordeaux", "Lille", "Lyon", "Nantes"].map((v) => [v, v])]], "Filtres des offres").replace("chantiers affichés", "offres affichées").replace(`>${CH.length}<`, `>${JOBS.length}<`)}
    <div class="cp-jobs">${JOBS.map(([t, k, v, ct, m, p]) => `<details class="cp-job cp-it" data-contrat="${k}" data-ville="${v}" data-reveal><summary><span class="cp-job-t">${t}</span><span class="cp-job-m">${ct} · ${v}</span></summary><div class="cp-job-b"><p><strong>Mission.</strong> ${m}</p><p><strong>Profil.</strong> ${p}</p><a class="cp-btn cp-btn--y" href="/contact">Écrire à l'équipe recrutement${arrow}</a></div></details>`).join("")}</div>
    <p class="cp-empty" role="status">Aucune offre ne correspond. <a href="/contact">Envoyez-nous une candidature spontanée</a>.</p></div></section>`),
  sec(footer(c)),
];

const TABS = [["neuf", "Construction neuve", "6 à 10 mois", ["Titre de propriété ou promesse", "Plan de masse et esquisse", "Étude de sol si disponible", "Budget et calendrier souhaités"]], ["reno", "Rénovation", "3 à 14 mois", ["Plans existants ou relevé", "Diagnostics amiante et plomb", "Photos des zones concernées", "Contraintes d'occupation"]], ["ext", "Extension", "3 à 6 mois", ["Plan du bâti actuel", "Surface visée", "Autorisation d'urbanisme (ou état d'avancement)", "Accès du chantier"]], ["voie", "Voirie et réseaux", "1 à 6 mois", ["Plan de la zone", "Cahier des charges de la collectivité", "Contraintes de circulation", "Plan des réseaux existants"]]];
const devis = (c) => [
  sec(header(c)), ph("08", "Devis", "Votre<br>devis", "Gratuit, détaillé et sans engagement. Voici comment le préparer ; la demande se fait par notre formulaire de contact."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap">${h2("Étapes", "Du premier appel <em>au chiffrage</em>")}<ol class="cp-steps">${[["Votre demande", "Vous décrivez le projet via le formulaire de contact."], ["Visite de site", "Un conducteur de travaux se déplace et prend les mesures."], ["Chiffrage", "Devis détaillé par lot, avec planning prévisionnel."], ["Échange", "On ajuste ensemble avant toute décision."]].map(([t, d], i) => `<li data-reveal><span class="cp-sn">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="cp-sec cp-sec--steel pk-bleed"><div class="cp-wrap">${h2("Préparer", "Ce qu'il faut <em>réunir</em>", `<p>Choisissez votre type de projet : voici la liste de départ. Rien d'obligatoire, tout aide à chiffrer juste.</p>`)}
    <div class="cp-tabs" data-tabs><div class="cp-tablist" role="tablist" aria-label="Type de projet">${TABS.map(([k, l], i) => `<a class="cp-chip${i ? "" : " is-on"}" href="#tab-${k}" role="tab" aria-selected="${i ? "false" : "true"}" data-tab="${k}">${l}</a>`).join("")}</div>
    ${TABS.map(([k, l, d, items], i) => `<div class="cp-tp${i ? "" : " is-on"}" role="tabpanel" data-panel="${k}" aria-label="${l}"><p class="cp-delay"><b>${d}</b> de délai indicatif, selon taille et autorisations.</p><ul class="cp-ticks">${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>
    <p class="cp-more-row"><a class="cp-btn cp-btn--y cp-btn--lg" href="/contact">Remplir le formulaire de contact${arrow}</a></p></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [sec(header(c)), ph("09", "Contact", "Parlons<br>chantier", "Décrivez votre projet : un conducteur de travaux vous répond sous deux jours ouvrés."),
  { type: "form", heading: "Demande de devis ou de contact", intro: "Type d'ouvrage, ville, surface approximative et délai souhaité : ce sont les quatre informations qui nous aident le plus." },
  sec(`<section class="cp-sec cp-sec--ink pk-bleed"><div class="cp-wrap cp-coords"><div><h2>Siège</h2><address>12 quai de la Grue<br>59000 Lille</address></div><div><h2>Écrire</h2><address><a href="mailto:chantiers@charpente-demo.example">chantiers@charpente-demo.example</a></address></div><div><h2>Horaires</h2><p>Du lundi au vendredi, 7 h 30 – 18 h 00. Coordonnées fictives (démonstration).</p></div></div></section>`), sec(footer(c))];
const recherche = (c) => [sec(header(c)), ph("10", "Recherche", "Chercher", "Un chantier, un métier, une offre d'emploi."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cp-404 cp-bp pk-bleed"><div class="cp-ph-in"><p class="cp-kicker"><span>ERR</span>Zone interdite au public</p><div class="cp-giant" role="heading" aria-level="1">404</div><p class="cp-ph-sub">Cette page n'existe pas ou a changé d'adresse. Le chantier est fermé de ce côté.</p><a class="cp-btn cp-btn--k cp-btn--lg" href="/">Retour à l'accueil${arrow}</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "charpente", name: "Charpente", version: "2.0.0", category: "services", tags: ["audacieux", "technique", "geometrique"], siteType: "Entreprise de construction et travaux publics", featured: true,
  concept: "Un plan de chantier : structure apparente, barre jaune et noire à indicateurs, et un portfolio de chantiers où l'on glisse le curseur pour passer de l'avant à l'après.",
  description: "Entreprise de bâtiment et travaux publics : béton, acier et jaune sécurité, hero en poutrelles et grue dessinées, portfolio avant/après à curseur filtrable, fiche chantier, process et sécurité, recrutement, devis.",
  brand: "Charpente BTP", modules: ["formulaires", "recherche"],
  dna: { header: "barre-jaune-noire-a-indicateurs-de-chantier", hero: "structure-apparente-poutrelles-grue-et-titre-massif", grid: "cartes-de-chantier-avant-apres", motion: "poutres-qui-s-assemblent-et-curseur-de-comparaison", shapes: "poutrelles-hachures-de-securite-et-cartouches-de-plan", rhythm: "bandes-de-chantier-numerotees-et-lourdes", signature: "portfolio-avant-apres-a-curseur-et-fiche-chantier" },
  tokens: {
    colors: { primary: "#ffc400", secondary: "#16181a", accent: "#5b6670", background: "#e4e2dc", surface: "#f4f3ef", text: "#16181a", muted: "#4a5058", success: "#1e7e34", warning: "#8a5a00", error: "#c62828" },
    fonts: { heading: "font.archivo-narrow", body: "font.barlow-semi-condensed", button: "font.roboto-mono", link: "font.roboto-mono" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 3, color: "#16181a" },
    type: { h1: { size: 120, weight: 700, lineHeight: 0.88, transform: "uppercase" }, h2: { size: 56, weight: 700, lineHeight: 0.95, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Jaune sécurité", type: "color", default: "#ffc400" },
    { key: "ink", label: "Noir acier", type: "color", default: "#16181a" },
    { key: "indicators", label: "Indicateurs de chantier", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "hazard", label: "Hachures de sécurité", type: "choice", default: "on", choices: [["on", "Jaune et noir"], ["off", "Noir uni"]] },
    { key: "plan", label: "Quadrillage de plan", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Métiers", "/metiers"], ["Réalisations", "/realisations"], ["Process et sécurité", "/process"], ["Entreprise", "/entreprise"], ["Recrutement", "/recrutement"], ["Devis", "/devis"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "metiers", name: "Métiers", render: metiers }, { key: "realisations", name: "Réalisations", render: realisations }, { key: "realisation", name: "Fiche chantier", render: realisation },
    { key: "process", name: "Process et sécurité", render: process }, { key: "entreprise", name: "Entreprise", render: entreprise }, { key: "recrutement", name: "Recrutement", render: recrutement }, { key: "devis", name: "Devis", render: devis },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
