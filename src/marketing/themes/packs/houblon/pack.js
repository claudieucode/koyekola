// Houblon — brasserie artisanale. Direction artistique : étiquettes de bière gravées, rétro-industriel. Chai vert houblon foncé, cuivre, crème d'étiquette ; capsules, fûts et cuves
// dessinés en SVG ; bandeau de navigation en forme d'étiquette ; catalogue de bières filtrable avec profil de goût en radar comparable ; composeur de visite (récapitulatif → contact).
const { sec, form, esc, nav } = require("../kit");

/* ---------- données de démonstration (bières fictives) ---------- */
const AX = ["Amertume", "Douceur", "Fruité", "Corps", "Houblonnage"];
const FAM = { blonde: "Blonde", blanche: "Blanche", ipa: "IPA", ambree: "Ambrée", noire: "Noire" };
const BEERS = [
  { k: "sentier", n: "Sentier", f: "blonde", st: "Blonde des chemins", a: 5.0, ab: "5,0", r: [3, 5, 4, 4, 4], note: "Pain frais, fleur de tilleul, finale sèche.", pair: "Poissons grillés, fromages frais" },
  { k: "mousse", n: "Mousse Blanche", f: "blanche", st: "Blanche aux écorces", a: 4.6, ab: "4,6", r: [2, 6, 7, 3, 3], note: "Écorce d'orange, coriandre, texture soyeuse.", pair: "Salades, crevettes, tartes aux agrumes" },
  { k: "cone", n: "Cône", f: "ipa", st: "India Pale Ale", a: 6.4, ab: "6,4", r: [8, 3, 7, 5, 9], note: "Pamplemousse, résine, amertume nette et longue.", pair: "Cuisine épicée, burgers, cheddar vieux" },
  { k: "vapeur", n: "Vapeur", f: "ipa", st: "Pale ale", a: 5.2, ab: "5,2", r: [5, 4, 8, 4, 6], note: "Fruits jaunes, peau d'agrume, corps léger.", pair: "Tacos, poulet rôti, plateau de charcuterie" },
  { k: "chaudron", n: "Chaudron", f: "ambree", st: "Ambrée cuivrée", a: 5.8, ab: "5,8", r: [4, 6, 3, 7, 4], note: "Caramel, pain grillé, noisette.", pair: "Viandes rôties, comté, tarte tatin" },
  { k: "maraicher", n: "Maraîcher", f: "blonde", st: "Saison de ferme", a: 6.0, ab: "6,0", r: [4, 3, 6, 4, 5], note: "Poivre, herbes fraîches, finale très sèche.", pair: "Légumes rôtis, chèvre, cuisine du marché" },
  { k: "futnoir", n: "Fût Noir", f: "noire", st: "Stout d'hiver", a: 7.2, ab: "7,2", r: [6, 5, 2, 9, 3], note: "Café torréfié, cacao amer, onctueuse.", pair: "Desserts chocolatés, huîtres, côte de bœuf" },
  { k: "brumaire", n: "Brumaire", f: "noire", st: "Brune de garde", a: 6.8, ab: "6,8", r: [3, 7, 4, 8, 2], note: "Pruneau, épices douces, bois fumé.", pair: "Gibier, fromages à croûte lavée, pain d'épices" },
];
const bySlug = (k) => BEERS.find((b) => b.k === k);

/* ---------- géométrie du radar ---------- */
const CX = 100, RR = 66;
const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
const pt = (i, v) => `${(CX + (RR * v / 10) * Math.cos(ang(i))).toFixed(1)},${(CX + (RR * v / 10) * Math.sin(ang(i))).toFixed(1)}`;
const poly = (vals) => vals.map((v, i) => pt(i, v)).join(" ");
const GRID = [2, 4, 6, 8, 10].map((n) => `<polygon class="hb-g" points="${poly([n, n, n, n, n])}"/>`).join("");
const SPOKES = AX.map((_, i) => `<line class="hb-sp" x1="100" y1="100" x2="${pt(i, 10).split(",")[0]}" y2="${pt(i, 10).split(",")[1]}"/>`).join("");
const LBL = AX.map((a, i) => `<span class="hb-rl hb-rl${i}" style="">${a}</span>`.replace(' style=""', "")).join("");
const labelPos = AX.map((_, i) => i); // positions gérées en CSS (classes hb-rl0..4)

/* ---------- capsules, fûts, cuves ---------- */
const teeth = (n, r1, r2) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n - Math.PI / 2; const r = i % 2 ? r2 : r1; p.push(`${(32 + r * Math.cos(a)).toFixed(1)},${(32 + r * Math.sin(a)).toFixed(1)}`); } return p.join(" "); };
const TEETH = teeth(21, 31, 27.6);
const HOP = `<path class="hb-hop" d="M32 15c7 3 10 10 9 17-1 7-5 11-9 16-4-5-8-9-9-16-1-7 2-14 9-17z"/><path class="hb-hopl" d="M24 27q8 5 16 0M24.5 34q7.500 5 15 0M28 41q4 3 8 0M32 15v33"/>`;
const cap = (cls = "") => `<svg class="hb-cap ${cls}" viewBox="0 0 64 64" aria-hidden="true"><polygon points="${TEETH}"/><circle cx="32" cy="32" r="23"/>${HOP}</svg>`;

const staves = (() => { let s = ""; for (const dx of [-30, -20, -10, 0, 10, 20, 30]) { const h = Math.sqrt(40 * 40 - dx * dx); s += `<line x1="${50 + dx}" y1="${(50 - h).toFixed(1)}" x2="${50 + dx}" y2="${(50 + h).toFixed(1)}"/>`; } return s; })();
const barrelSvg = `<svg class="hb-barrel" viewBox="0 0 100 100" aria-hidden="true"><circle class="hb-b0" cx="50" cy="50" r="48"/><circle class="hb-b1" cx="50" cy="50" r="40"/><g class="hb-bs">${staves}</g><circle class="hb-b2" cx="50" cy="50" r="44"/><circle class="hb-b3" cx="50" cy="50" r="36"/><circle class="hb-bung" cx="50" cy="12" r="3.2"/></svg>`;

const tank = (cls = "") => `<svg class="hb-tank ${cls}" viewBox="0 0 120 320" aria-hidden="true">
  <path class="hb-t-leg" d="M22 236v70M98 236v70M60 250v56M14 306h28M78 306h28M46 306h28"/>
  <path class="hb-t-cone" d="M12 214h96l-30 40H42z"/>
  <path class="hb-t-body" d="M12 70h96v144H12z"/>
  <path class="hb-t-dome" d="M12 70c0-34 22-52 48-52s48 18 48 52z"/>
  <path class="hb-t-sh" d="M24 70v144M34 70v144M88 76v138" />
  <path class="hb-t-ring" d="M12 100h96M12 150h96M12 190h96"/>
  <rect class="hb-t-win" x="46" y="108" width="28" height="34" rx="14"/><circle class="hb-t-rv" cx="60" cy="33" r="3"/>
  <rect class="hb-t-gtube" x="100" y="86" width="9" height="108" rx="4.500"/><rect class="hb-t-lvl" x="102" y="112" width="5" height="80" rx="2.500"/>
  <path class="hb-t-pipe" d="M60 254v22h38M98 276v30"/><circle class="hb-t-valve" cx="98" cy="282" r="5"/>
</svg>`;

const ICO = {
  grain: `<path d="M24 8c-5 6-5 14 0 20 5-6 5-14 0-20zM15 20c-5 4-6 10-2 17 6-3 8-10 2-17zM33 20c5 4 6 10 2 17-6-3-8-10-2-17zM24 30v12"/>`,
  pot: `<path d="M8 20h32v14c0 6-6 9-16 9S8 40 8 34zM6 20h36M14 14c0-4 4-3 4-7M24 14c0-4 4-3 4-7M34 14c0-4 4-3 4-7"/>`,
  filter: `<path d="M8 10h32L28 26v12l-8 4V26zM12 14h24"/>`,
  hop: `<path d="M24 6c7 3 10 10 9 17-1 7-5 11-9 17-4-6-8-10-9-17-1-7 2-14 9-17zM15 20q9 6 18 0M16 28q8 6 16 0M24 6v34"/>`,
  tank: `<path d="M12 14h24v20H12zM12 14c0-6 5-9 12-9s12 3 12 9M12 34l6 8h12l6-8M20 40v4M28 40v4M18 22h12M18 28h12"/>`,
  cold: `<path d="M24 5v38M8 14l32 20M40 14L8 34M19 8l5 5 5-5M19 40l5-5 5 5"/>`,
  bottle: `<path d="M20 5h8v10c0 6 8 8 8 16v10c0 2-2 3-4 3H16c-2 0-4-1-4-3V31c0-8 8-10 8-16zM12 28h24M12 36h24M20 5h8"/>`,
};
const ico = (n) => `<svg class="hb-ico" viewBox="0 0 48 48" aria-hidden="true">${ICO[n]}</svg>`;
const arrow = `<svg class="hb-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>`;
const rule = `<div class="hb-rule" aria-hidden="true"><i></i><b></b><i></i></div>`;

/* ---------- en-tête (bandeau en forme d'étiquette) et pied ---------- */
const header = (c) => `<header class="hb-head pk-bleed">
  <div class="hb-strip"><span>Brasserie artisanale · Cuvées brassées sur place</span><span class="hb-strip-r">À consommer avec modération</span></div>
  <div class="hb-band"><div class="hb-band-in">
    <a class="hb-logo" href="/" aria-label="${esc(c.brand)} — accueil">${cap("hb-cap--logo")}<span class="hb-logo-t"><b>Trois Cuves</b><small>Brasserie · Est. 2014</small></span></a>
    <div class="hb-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <a class="hb-cta" href="/visites">Visiter</a>
    <details class="hb-burger"><summary aria-label="Ouvrir le menu"><span class="hb-bg" aria-hidden="true"></span><span class="hb-bgt">Menu</span></summary>
      <div class="hb-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="hb-cta" href="/visites">Visiter la brasserie</a></div></details>
  </div></div></header>`;

const footer = (c) => `<footer class="hb-foot pk-bleed">
  <div class="hb-foot-caps" aria-hidden="true">${Array.from({ length: 9 }, () => cap("hb-cap--f")).join("")}</div>
  <div class="hb-wrap hb-foot-grid">
    <div><a class="hb-logo hb-logo--f" href="/">${cap("hb-cap--logo")}<span class="hb-logo-t"><b>Trois Cuves</b><small>Brasserie artisanale</small></span></a>
      <p>12 quai des Tonneliers<br>Cour de la Malterie · 69007 Lyon</p><p>Ouvert du mercredi au samedi, 14 h – 19 h.</p></div>
    <div><h3>La maison</h3>${nav(c.menu.slice(0, 4), "hb-fl")}</div>
    <div><h3>Pratique</h3><a class="hb-fl" href="/biere">Fiche bière</a><a class="hb-fl" href="/contact">Contact</a><a class="hb-fl" href="/recherche">Recherche</a></div>
  </div>
  <p class="hb-legal">© Brasserie Trois Cuves — site de démonstration : bières, adresse et horaires fictifs. L'abus d'alcool est dangereux pour la santé. À consommer avec modération.</p></footer>`;

const pagehead = (kicker, title, sub, deco = "") => sec(`<section class="hb-ph pk-bleed"><div class="hb-wrap hb-ph-in"><div class="hb-ph-card" data-reveal><p class="hb-kicker">${esc(kicker)}</p><div class="hb-h1" role="heading" aria-level="1">${title}</div>${rule}${sub ? `<p class="hb-ph-sub">${esc(sub)}</p>` : ""}</div>${deco}</div></section>`);

/* ---------- radar + laboratoire de goût ---------- */
const dl = (b) => `data-slug="${b.k}" data-name="${esc(b.n)}" data-abv="${b.ab}" data-fam="${b.f}" data-r="${b.r.join(",")}" data-note="${esc(b.note)}"`;
const mini = (v) => `<svg class="hb-mini" viewBox="0 0 200 200" aria-hidden="true"><polygon class="hb-mg" points="${poly([10, 10, 10, 10, 10])}"/><polygon class="hb-mg" points="${poly([5, 5, 5, 5, 5])}"/><polygon class="hb-mv" points="${poly(v)}"/></svg>`;
const lab = (a, extra = "") => {
  const A = bySlug(a);
  return `<div class="hb-lab" data-lab data-a="${A.k}" ${dl(A)}>
    <div class="hb-radar" role="img" aria-label="Profil de goût en radar : amertume, douceur, fruité, corps, houblonnage">
      <svg viewBox="0 0 200 200" aria-hidden="true"><circle class="hb-halo" cx="100" cy="100" r="66"/>${GRID}${SPOKES}<polygon class="hb-pb" points="${poly([0, 0, 0, 0, 0])}"/><polygon class="hb-pa" points="${poly(A.r)}"/></svg>${LBL}</div>
    <div class="hb-lab-info">
      <p class="hb-key-row"><span class="hb-key hb-key--a"><i></i><b data-ka>${esc(A.n)}</b><small data-kaa>${A.ab} %</small></span><span class="hb-key hb-key--b" data-kbw hidden><i></i><b data-kb></b><small data-kba></small></span></p>
      <dl class="hb-vals">${AX.map((x, i) => `<div><dt>${x}</dt><dd><span class="hb-bars"><span class="hb-bar hb-bar--a" data-bar-a="${i}"></span><span class="hb-bar hb-bar--b" data-bar-b="${i}"></span></span><b class="hb-va" data-va="${i}">${A.r[i]}</b><b class="hb-vb" data-vb="${i}" hidden></b></dd></div>`).join("")}</dl>
      <p class="hb-lab-note" data-live aria-live="polite">${esc(A.note)}</p>
      ${extra}
    </div></div>`;
};

/* ---------- étiquettes (cartes de bouteilles) ---------- */
const label = (b, mode = "cat") => `<article class="hb-bot hb-f-${b.f}" ${dl(b)} data-reveal>
  <div class="hb-lbl"><div class="hb-lbl-top">${cap("hb-cap--lbl")}<p class="hb-lbl-style">${esc(b.st)}</p></div>
    <h3 class="hb-lbl-name">${esc(b.n)}</h3>${rule}<p class="hb-lbl-note">${esc(b.note)}</p>
    <div class="hb-lbl-foot"><div class="hb-abv"><b>${b.ab}</b><small>% vol.</small></div>${mini(b.r)}<p class="hb-vol">33 cl<br>75 cl</p></div><div class="hb-liq" aria-hidden="true"></div></div>
  <div class="hb-bot-act">${mode === "cat"
    ? `<a href="#profil-${b.k}" data-pick class="hb-act" aria-label="Voir le profil de ${esc(b.n)}">Profil</a><a href="#comparer-${b.k}" data-cmp class="hb-act hb-act--b" aria-label="Comparer ${esc(b.n)}" aria-pressed="false">Comparer</a>`
    : `<a href="/nos-bieres" class="hb-act hb-act--l">Découvrir ${arrow}</a>`}</div></article>`;

/* ---------- hero : mur de fûts ---------- */
const wall = () => BEERS.map((b) => `<a class="hb-fut hb-f-${b.f}" href="/nos-bieres" aria-label="${esc(b.n)}, ${b.ab} %">${barrelSvg}<span class="hb-fut-l"><i></i><b>${esc(b.n)}</b><small>${b.ab} %</small></span></a>`).join("");

const bubbles = Array.from({ length: 7 }, (_, i) => `<i class="hb-bub hb-bub${i}"></i>`).join("");

const home = (c) => [
  sec(header(c)),
  sec(`<section class="hb-hero pk-bleed" aria-label="Présentation">
    <div class="hb-hero-wall" aria-hidden="true"></div>${tank("hb-tank--l")}${tank("hb-tank--r")}<div class="hb-bubs" aria-hidden="true">${bubbles}</div>
    <div class="hb-wrap hb-hero-in">
      <div class="hb-hero-card" data-reveal><span class="hb-corner hb-corner--tl" aria-hidden="true"></span><span class="hb-corner hb-corner--br" aria-hidden="true"></span>
        <p class="hb-kicker">Brasserie artisanale · Lyon</p>
        <div class="hb-h1 hb-h1--hero" role="heading" aria-level="1">Huit bières, brassées à la main, gravées une à une.</div>${rule}
        <p class="hb-lead">Du malt, du houblon, de l'eau claire et trois cuves de cuivre. Chaque cuvée porte son étiquette et son profil de goût : choisissez la vôtre.</p>
        <div class="hb-actions"><a class="hb-btn" href="/nos-bieres">Découvrir les bières ${arrow}</a><a class="hb-btn hb-btn--line" href="/visites">Visiter la brasserie</a></div></div>
      <div class="hb-rack" aria-label="Le mur de fûts : nos huit bières" data-reveal>${wall()}<span class="hb-beam" aria-hidden="true"></span></div>
    </div></section>`),
  sec(`<section class="hb-stats pk-bleed"><ul class="hb-wrap hb-stats-in">
    <li data-reveal><span class="hb-stat-cap">${cap("hb-cap--s")}<b data-count="8">8</b></span><span>bières à la carte</span></li>
    <li data-reveal><span class="hb-stat-cap">${cap("hb-cap--s")}<b data-count="3">3</b></span><span>cuves de 20 hectolitres</span></li>
    <li data-reveal><span class="hb-stat-cap">${cap("hb-cap--s")}<b data-count="14">14</b></span><span>jours de fermentation</span></li>
    <li data-reveal><span class="hb-stat-cap">${cap("hb-cap--s")}<b data-count="6">6</b></span><span>brasseurs et brasseuses</span></li></ul></section>`),
  sec(`<section class="hb-shelf pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker" data-reveal>Fraîchement tirées</p><h2 class="hb-h2" data-reveal>Sur l'étagère cette semaine</h2></div><a class="hb-more" href="/nos-bieres" data-reveal>Toute la cave ${arrow}</a></div>
    <div class="hb-grid hb-grid--4">${["sentier", "cone", "chaudron", "futnoir"].map((k) => label(bySlug(k), "shelf")).join("")}</div></div></section>`),
  sec(`<section class="hb-moment pk-bleed" data-hb-scope><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker" data-reveal>La bière du moment</p><h2 class="hb-h2" data-reveal>Lisez son goût en un coup d'œil</h2></div></div>
    <p class="hb-intro" data-reveal>Cinq axes, de 0 à 10. Comparez le Cône avec une autre cuvée pour voir ce qui change dans le verre.</p>
    ${lab("cone", `<p class="hb-chips" aria-label="Comparer avec">${["sentier", "chaudron", "futnoir"].map((k) => { const b = bySlug(k); return `<a href="#comparer-${k}" data-cmp class="hb-chip" ${dl(b)} aria-pressed="false">${esc(b.n)}</a>`; }).join("")}</p><a class="hb-more hb-more--l" href="/nos-bieres">Tout le catalogue ${arrow}</a>`)}</div></section>`),
  sec(`<section class="hb-kraft pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker hb-kicker--d" data-reveal>Quatre ingrédients</p><h2 class="hb-h2 hb-h2--d" data-reveal>Ce qu'il y a dans le fût</h2></div><a class="hb-more hb-more--d" href="/brasserie" data-reveal>Le procédé en sept étapes ${arrow}</a></div>
    <ul class="hb-ing">${[["grain", "Le malt", "Orge maltée en plusieurs teintes : elle donne le corps, la couleur et le pain grillé."], ["hop", "Le houblon", "Ajouté en trois temps pour doser l'amertume et les arômes d'agrumes ou de résine."], ["tank", "L'eau", "Une eau claire ajustée à chaque style, pour une bière nette et bien équilibrée."], ["bottle", "La levure", "Elle transforme le sucre en alcool et en bulles, puis travaille encore en bouteille."]].map(([i, t, x]) => `<li class="hb-ing-i" data-reveal>${ico(i)}<h3>${t}</h3><p>${x}</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="hb-visit pk-bleed"><div class="hb-wrap hb-visit-in"><div class="hb-visit-card" data-reveal><p class="hb-kicker">Visites et dégustations</p><h2 class="hb-h2">Venez voir les cuves de près</h2>${rule}<p>Une heure trente entre les cuves, un tour des matières premières et une dégustation de quatre bières. Composez votre visite et envoyez-nous votre demande.</p><a class="hb-btn" href="/visites">Composer ma visite ${arrow}</a></div>
    <div class="hb-visit-art" aria-hidden="true">${tank("hb-tank--m")}${barrelSvg.replace("hb-barrel", "hb-barrel hb-barrel--m")}</div></div></section>`),
  sec(`<section class="hb-agenda pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker" data-reveal>À venir à la brasserie</p><h2 class="hb-h2" data-reveal>Agenda</h2></div><a class="hb-more" href="/visites" data-reveal>Tous les rendez-vous ${arrow}</a></div>
    <ol class="hb-evs">${EVENTS.slice(0, 3).map(evt).join("")}</ol></div></section>`),
  sec(footer(c)),
];

const EVENTS = [
  ["12", "déc.", "Soirée Fût Noir", "Dégustation guidée de la stout d'hiver avec un accord chocolat.", "Vendredi · 19 h"],
  ["17", "janv.", "Brassage participatif", "Une journée à côté des brasseurs : concassage, empâtage, houblonnage.", "Samedi · 9 h"],
  ["07", "févr.", "Portes ouvertes de la cuverie", "Visites libres des cuves toutes les 30 minutes, en petits groupes.", "Samedi · 14 h"],
  ["21", "mars", "Lancement de la saison", "Mise en fût de la Maraîcher nouvelle et dégustation sur le quai.", "Samedi · 17 h"],
];
function evt([d, m, t, x, h]) { return `<li class="hb-ev" data-reveal><span class="hb-ev-d"><b>${d}</b><i>${m}</i></span><div><h3>${esc(t)}</h3><p>${esc(x)}</p></div><span class="hb-ev-h">${esc(h)}</span><a class="hb-ev-a" href="/contact" aria-label="Demander des informations : ${esc(t)}">Infos ${arrow}</a></li>`; }

/* ---------- nos bières ---------- */
const bieres = (c) => [
  sec(header(c)),
  pagehead("La cave", "Nos bières", "Huit cuvées à parcourir par style ou par degré, puis à comparer sur le radar de goût.", `<div class="hb-ph-art" aria-hidden="true">${tank("hb-tank--m")}</div>`),
  sec(`<section class="hb-cat pk-bleed"><div class="hb-wrap">
    <div class="hb-filters" aria-label="Filtrer les bières">
      <div class="hb-fgrp" role="group" aria-label="Style"><span class="hb-flabel">Style</span><a href="#tous" class="hb-chip is-on" data-fg="fam" data-fv="all">Toutes</a>${Object.entries(FAM).map(([k, v]) => `<a href="#${k}" class="hb-chip" data-fg="fam" data-fv="${k}">${v}</a>`).join("")}</div>
      <div class="hb-fgrp" role="group" aria-label="Degré d'alcool"><span class="hb-flabel">Degré</span><a href="#tous-degres" class="hb-chip is-on" data-fg="abv" data-fv="all">Tous</a><a href="#legeres" class="hb-chip" data-fg="abv" data-fv="lo">Moins de 5,5 %</a><a href="#moyennes" class="hb-chip" data-fg="abv" data-fv="mid">5,5 à 6,5 %</a><a href="#fortes" class="hb-chip" data-fg="abv" data-fv="hi">Plus de 6,5 %</a></div>
      <p class="hb-count" aria-live="polite"><b data-n>8</b> bières affichées</p></div>
    <div class="hb-grid hb-grid--4" data-grid>${BEERS.map((b) => label(b, "cat")).join("")}</div>
    <p class="hb-empty" data-empty hidden>Aucune bière ne correspond à ce croisement. Essayez un autre degré ou un autre style.</p></div></section>`),
  sec(`<section class="hb-cat hb-cat--lab pk-bleed"><div class="hb-wrap hb-lab-wrap"><div class="hb-sechead"><div><p class="hb-kicker">Profil de goût</p><h2 class="hb-h2">Comparer deux bières</h2></div></div>
    <p class="hb-intro">Choisissez « Profil » sur une étiquette pour la poser sur le radar, puis « Comparer » sur une seconde pour superposer les deux. <a class="hb-more" href="/biere">Voir la fiche complète du Cône</a></p>
    ${lab("sentier")}</div></section>`),
  sec(`<section class="hb-howto pk-bleed"><div class="hb-wrap"><h2 class="hb-h2" data-reveal>Lire le radar</h2><dl class="hb-defs">${[["Amertume", "La sensation sèche et nette en fin de gorgée."], ["Douceur", "Le sucre résiduel et la rondeur du malt."], ["Fruité", "Agrumes, fruits jaunes, épices : les arômes du houblon et de la levure."], ["Corps", "La densité en bouche, du léger au crémeux."], ["Houblonnage", "L'intensité des arômes de houblon, à l'attaque comme au nez."]].map(([t, x]) => `<div data-reveal><dt>${t}</dt><dd>${x}</dd></div>`).join("")}</dl>
    <p class="hb-fine">Notes de dégustation de démonstration, indiquées de 0 à 10 par l'équipe brassicole.</p></div></section>`),
  sec(footer(c)),
];

/* ---------- fiche bière ---------- */
const bottle = `<div class="hb-bottle" aria-hidden="true"><svg viewBox="0 0 120 340"><path class="hb-bo-g" d="M51 22H69V92C69 120 100 128 100 166V316Q100 332 84 332H36Q20 332 20 316V166C20 128 51 120 51 92Z"/><path class="hb-bo-h" d="M28 170v140M36 150q4-20 4-40"/><rect class="hb-bo-cap" x="46" y="10" width="28" height="14" rx="3"/><path class="hb-bo-ridge" d="M50 12v10M55 12v10M60 12v10M65 12v10M70 12v10"/><rect class="hb-bo-l2" x="20" y="186" width="80" height="108"/><rect class="hb-bo-l3" x="24" y="190" width="72" height="100"/><rect class="hb-bo-nk" x="51" y="58" width="18" height="22"/></svg>
  <span class="hb-bo-t"><small>Trois Cuves</small><b>Cône</b><i>IPA · 6,4 %</i></span></div>`;
const biere = (c) => {
  const b = bySlug("cone");
  return [
    sec(header(c)),
    sec(`<section class="hb-fiche pk-bleed"><div class="hb-wrap hb-fiche-in">
      <div class="hb-fiche-art" data-reveal>${bottle}${cap("hb-cap--big")}</div>
      <div class="hb-fiche-txt" data-reveal><p class="hb-kicker">Fiche bière · exemple</p><div class="hb-h1" role="heading" aria-level="1">Cône</div><p class="hb-fiche-st">India Pale Ale · 6,4 % vol.</p>${rule}
        <p class="hb-lead">${esc(b.note)} Une IPA claire et généreuse, houblonnée à cru, pour les amateurs d'amertume franche.</p>
        <dl class="hb-spec"><div><dt>Robe</dt><dd>Orange doré, légèrement voilée</dd></div><div><dt>Houblons</dt><dd>Variétés d'agrumes et de résine, ajoutées en trois temps</dd></div><div><dt>Service</dt><dd>6 à 8 °C, verre tulipe</dd></div><div><dt>Formats</dt><dd>Bouteille 33 cl et 75 cl, fût 20 l</dd></div></dl>
        <div class="hb-actions"><a class="hb-btn" href="/contact">Demander une dégustation ${arrow}</a><a class="hb-btn hb-btn--line" href="/nos-bieres">Retour au catalogue</a></div></div></div></section>`),
    sec(`<section class="hb-moment hb-moment--f pk-bleed" data-hb-scope><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker">Profil de goût</p><h2 class="hb-h2">Cône face aux autres cuvées</h2></div></div>
      ${lab("cone", `<p class="hb-chips" aria-label="Comparer avec">${BEERS.filter((x) => x.k !== "cone").map((x) => `<a href="#comparer-${x.k}" data-cmp class="hb-chip" ${dl(x)} aria-pressed="false">${esc(x.n)}</a>`).join("")}</p>`)}</div></section>`),
    sec(`<section class="hb-pair pk-bleed"><div class="hb-wrap hb-pair-in">
      <div class="hb-plaque" data-reveal><h2 class="hb-h3">À table</h2>${rule}<p>${esc(b.pair)}.</p><p class="hb-muted">Servez bien frais : le froid accentue l'amertume, un verre plus tempéré révèle les fruits.</p></div>
      <div class="hb-plaque" data-reveal><h2 class="hb-h3">En cuisine</h2>${rule}<p>Quelques centilitres dans un pot de moutarde à l'ancienne, ou pour déglacer des oignons rôtis.</p><p class="hb-muted">Idée de démonstration : aucune recette n'est garantie.</p></div>
      <div class="hb-plaque" data-reveal><h2 class="hb-h3">Dans la cave</h2>${rule}<p>Se garde six mois debout, à l'abri de la lumière et de la chaleur.</p><p class="hb-muted">Meilleure dans les trois premiers mois.</p></div></div></section>`),
    sec(`<section class="hb-shelf pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker">À goûter ensuite</p><h2 class="hb-h2">Du même côté de la cave</h2></div><a class="hb-more" href="/nos-bieres">Tout le catalogue ${arrow}</a></div><div class="hb-grid hb-grid--3">${["vapeur", "mousse", "maraicher"].map((k) => label(bySlug(k), "shelf")).join("")}</div></div></section>`),
    sec(footer(c)),
  ];
};

/* ---------- la brasserie : procédé en étapes ---------- */
const STEPS = [
  ["grain", "Concassage du malt", "L'orge maltée passe entre deux rouleaux : l'écorce reste entière, le cœur devient farine grossière.", ["Moulin à rouleaux", "220 kg par brassin"]],
  ["pot", "Empâtage", "Le grain infuse dans l'eau chaude. Les enzymes transforment l'amidon en sucres fermentescibles.", ["65 °C", "60 minutes"]],
  ["filter", "Filtration", "Le moût sucré est séparé des drêches, qui partent nourrir les bêtes d'une ferme voisine.", ["Cuve-filtre", "Rinçage à 78 °C"]],
  ["hop", "Ébullition et houblonnage", "Le moût bout une heure. Le houblon arrive en trois temps : amertume, saveur, parfum.", ["60 minutes", "3 ajouts"]],
  ["tank", "Fermentation", "Refroidi, le moût rejoint la cuve conique. La levure fait son travail et dégage ses arômes.", ["19 °C", "14 jours"]],
  ["cold", "Garde au froid", "La bière se clarifie et s'arrondit à basse température avant d'être soutirée.", ["2 °C", "3 semaines"]],
  ["bottle", "Embouteillage", "Mise en bouteille ou en fût, avec une pointe de sucre pour une refermentation douce.", ["33 cl · 75 cl · fût 20 l", "Étiquetage à la main"]],
];
const brasserie = (c) => [
  sec(header(c)),
  pagehead("De la céréale au verre", "La brasserie", "Sept étapes, trois cuves, un seul lieu : le procédé de la maison, du concassage à l'étiquette.", `<div class="hb-ph-art" aria-hidden="true">${tank("hb-tank--m")}${tank("hb-tank--m hb-tank--m2")}</div>`),
  sec(`<section class="hb-proc pk-bleed" data-proc><div class="hb-wrap"><div class="hb-pipe" aria-hidden="true"><span class="hb-pipe-fill" data-pipe></span></div>
    <ol class="hb-steps">${STEPS.map(([i, t, x, ch], n) => `<li class="hb-step ${n % 2 ? "hb-step--r" : ""}" data-reveal data-step><span class="hb-node" aria-hidden="true">${String(n + 1).padStart(2, "0")}</span>
      <article class="hb-plaque"><div class="hb-plaque-h">${ico(i)}<h2 class="hb-h3">${esc(t)}</h2></div>${rule}<p>${esc(x)}</p><p class="hb-tags">${ch.map((z) => `<span>${esc(z)}</span>`).join("")}</p></article></li>`).join("")}</ol></div></section>`),
  sec(`<section class="hb-mat pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker hb-kicker--d" data-reveal>Matières premières</p><h2 class="hb-h2 hb-h2--d" data-reveal>Ce qui entre dans la cuve</h2></div></div>
    <table class="hb-table" data-reveal><caption class="hb-sr">Matières premières et rôle dans la bière</caption><thead><tr><th>Matière</th><th>Rôle</th><th>Dans nos bières</th></tr></thead><tbody>
    <tr><th scope="row">Malt d'orge</th><td>Corps, couleur, sucres</td><td>Pâle pour les claires, torréfié pour la Fût Noir</td></tr>
    <tr><th scope="row">Houblon</th><td>Amertume et arômes</td><td>Agrumes pour le Cône, floral pour le Sentier</td></tr>
    <tr><th scope="row">Eau</th><td>Base de la recette</td><td>Ajustée en minéraux selon le style</td></tr>
    <tr><th scope="row">Levure</th><td>Alcool, bulles, fruité</td><td>Souches de saison, blanche et ale</td></tr></tbody></table></div></section>`),
  sec(`<section class="hb-team pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker" data-reveal>Derrière les cuves</p><h2 class="hb-h2" data-reveal>L'équipe de brassage</h2></div></div>
    <div class="hb-grid hb-grid--3">${[["M", "Maëlle R.", "Maître brasseuse", "Elle écrit les recettes et goûte chaque cuve avant la mise en bouteille."], ["T", "Thibault L.", "Responsable cuverie", "Il veille sur les températures, les nettoyages et la fermentation."], ["N", "Noura B.", "Accueil et visites", "Elle guide les visiteurs entre les cuves et anime les dégustations."]].map(([i, n, r, x]) => `<article class="hb-person" data-reveal><span class="hb-pcap">${cap("hb-cap--p")}<b>${i}</b></span><h3>${n}</h3><p class="hb-role">${r}</p><p>${x}</p></article>`).join("")}</div>
    <p class="hb-fine">Équipe fictive, présentée à titre de démonstration.</p></div></section>`),
  sec(footer(c)),
];

/* ---------- visites et événements : composeur de visite ---------- */
const FORMULES = [["classique", "Visite classique", "1 h 30 · cuverie, matières premières, dégustation de 4 bières"], ["atelier", "Atelier brassage", "Demi-journée · brassez une cuve avec l'équipe"], ["accords", "Dégustation et accords", "2 h · six bières, six bouchées de producteurs locaux"]];
const CRENEAUX = [["mer", "Mercredi ou jeudi après-midi"], ["ven", "Vendredi soir"], ["sam", "Samedi"]];
const visites = (c) => [
  sec(header(c)),
  pagehead("Entrez dans le chai", "Visites et événements", "Composez votre visite, puis envoyez-nous le récapitulatif : nous vous répondons pour confirmer.", `<div class="hb-ph-art" aria-hidden="true">${barrelSvg}</div>`),
  sec(`<section class="hb-compose pk-bleed" data-compose><div class="hb-wrap hb-compose-in">
    <div class="hb-opts">
      <div class="hb-og" role="radiogroup" aria-label="Formule"><p class="hb-flabel">1 · La formule</p>${FORMULES.map(([k, t, x], i) => `<a href="#formule-${k}" class="hb-opt ${i === 0 ? "is-on" : ""}" role="radio" aria-checked="${i === 0}" data-g="f" data-v="${esc(t)}"><b>${esc(t)}</b><span>${esc(x)}</span></a>`).join("")}</div>
      <div class="hb-og" role="group" aria-label="Nombre de personnes"><p class="hb-flabel">2 · Le groupe</p><div class="hb-step-in"><a href="#moins" class="hb-pm" data-pm="-1" aria-label="Une personne de moins">−</a><p class="hb-pn"><b data-pn>4</b> <span data-pl>personnes</span></p><a href="#plus" class="hb-pm" data-pm="1" aria-label="Une personne de plus">+</a></div><p class="hb-muted">De 1 à 20 personnes ; au-delà, écrivez-nous.</p></div>
      <div class="hb-og" role="radiogroup" aria-label="Créneau souhaité"><p class="hb-flabel">3 · Le créneau</p>${CRENEAUX.map(([k, t], i) => `<a href="#creneau-${k}" class="hb-opt hb-opt--s ${i === 2 ? "is-on" : ""}" role="radio" aria-checked="${i === 2}" data-g="c" data-v="${esc(t)}"><b>${esc(t)}</b></a>`).join("")}</div></div>
    <aside class="hb-ticket" aria-label="Récapitulatif de votre visite"><span class="hb-corner hb-corner--tl" aria-hidden="true"></span><span class="hb-corner hb-corner--br" aria-hidden="true"></span>${cap("hb-cap--tk")}<h2 class="hb-h3">Votre récapitulatif</h2>${rule}
      <dl class="hb-recap"><div><dt>Formule</dt><dd data-rf>Visite classique</dd></div><div><dt>Groupe</dt><dd data-rn>4 personnes</dd></div><div><dt>Créneau</dt><dd data-rc>Samedi</dd></div></dl>
      <p class="hb-recap-t" data-rt aria-live="polite">Demande de visite : Visite classique, 4 personnes, Samedi.</p>
      <a class="hb-btn hb-btn--block" href="/contact" data-send>Envoyer cette demande ${arrow}</a><a class="hb-copy" href="#copier" data-copy>Copier le récapitulatif</a>
      <p class="hb-fine" data-cm aria-live="polite">Rien n'est réservé ici : collez le récapitulatif dans le formulaire de contact, nous confirmons la date avec vous.</p></aside></div></section>`),
  sec(`<section class="hb-prog pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker hb-kicker--d" data-reveal>Au programme</p><h2 class="hb-h2 hb-h2--d" data-reveal>Une visite, pas à pas</h2></div></div>
    <ol class="hb-prog-l">${[["Accueil au quai", "Un verre de bienvenue et le plan des lieux."], ["La salle de brassage", "Malts à toucher, houblons à sentir, cuves en cuivre."], ["La cave de garde", "Là où la bière s'affine, au frais et dans le silence."], ["La dégustation", "Quatre bières, de la plus claire à la plus sombre."]].map(([t, x], i) => `<li data-reveal><span class="hb-pnum">${i + 1}</span><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="hb-agenda pk-bleed"><div class="hb-wrap"><div class="hb-sechead"><div><p class="hb-kicker" data-reveal>Événements</p><h2 class="hb-h2" data-reveal>Agenda de la saison</h2></div></div><ol class="hb-evs">${EVENTS.map(evt).join("")}</ol><p class="hb-fine">Dates indicatives de démonstration.</p></div></section>`),
  sec(`<section class="hb-faq pk-bleed"><div class="hb-wrap hb-faq-in"><h2 class="hb-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Les visites sont-elles accessibles ?</summary><p>La salle de brassage est de plain-pied ; la cave de garde demande de descendre quelques marches. Dites-le-nous et nous adaptons le parcours.</p></details>
    <details data-reveal><summary>Peut-on venir avec des enfants ?</summary><p>Oui pour la partie visite ; la dégustation est réservée aux adultes, avec des boissons sans alcool pour les plus jeunes.</p></details>
    <details data-reveal><summary>Peut-on privatiser la brasserie ?</summary><p>C'est possible pour des groupes : écrivez-nous avec la date et le nombre de personnes.</p></details></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [sec(header(c)), pagehead("Parlons bière", "Contact", "Une visite, une commande pour un bar ou un événement ? Écrivez-nous.", `<div class="hb-ph-art" aria-hidden="true">${cap("hb-cap--big")}</div>`),
  sec(`<section class="hb-info pk-bleed"><div class="hb-wrap hb-info-in"><div class="hb-plaque" data-reveal><h2 class="hb-h3">La brasserie</h2>${rule}<address>12 quai des Tonneliers<br>Cour de la Malterie<br>69007 Lyon</address></div><div class="hb-plaque" data-reveal><h2 class="hb-h3">Le comptoir</h2>${rule}<p>Du mercredi au samedi<br>14 h – 19 h</p></div><div class="hb-plaque" data-reveal><h2 class="hb-h3">Professionnels</h2>${rule}<p>Bars, caves et restaurants : indiquez votre activité et vos volumes.</p></div></div></section>`),
  { type: "form", heading: "Écrire à la brasserie", intro: "Dites-nous ce que vous cherchez ; nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Fouiller la cave", "Rechercher", "Une bière, un style, une étape du procédé."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une bière, une visite…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="hb-404 pk-bleed"><div class="hb-wrap hb-404-in"><div class="hb-404-art" aria-hidden="true"><svg viewBox="0 0 220 200"><path class="hb-f-body" d="M40 30h110c14 20 14 120 0 140H40c-14-20-14-120 0-140z"/><path class="hb-f-ring" d="M36 56h122M32 100h130M36 144h122"/><path class="hb-f-st" d="M62 36v128M90 32v136M118 32v136M144 36v128"/><rect class="hb-f-tapb" x="150" y="104" width="38" height="12" rx="3"/><rect class="hb-f-tapv" x="180" y="96" width="10" height="28" rx="3"/><path class="hb-f-hand" d="M158 104v-18h20"/></svg><i class="hb-drop"></i></div>
  <div><p class="hb-kicker">Fût vide</p><div class="hb-h1" role="heading" aria-level="1">Erreur 404</div>${rule}<p class="hb-lead">Cette page n'existe pas ou a changé d'adresse. Retournez à la cave pour une autre tournée.</p><div class="hb-actions"><a class="hb-btn" href="/">Retour à l'accueil</a><a class="hb-btn hb-btn--line" href="/nos-bieres">Voir les bières</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "houblon", name: "Houblon", version: "2.0.0", category: "gastronomie", tags: ["chaleureux", "classique", "editorial"], siteType: "Brasserie artisanale", featured: false,
  concept: "Une cave de brasseur : étiquettes gravées sur un chai vert et cuivre, mur de fûts, catalogue filtrable et profil de goût en radar à comparer.",
  description: "Brasserie artisanale : étiquettes de bière gravées, chai vert houblon et cuivre, mur de fûts, catalogue filtrable avec radar de goût comparable, procédé en étapes, composeur de visite.",
  brand: "Brasserie Trois Cuves", modules: ["formulaires", "recherche"],
  dna: { header: "bandeau-etiquette-a-pointes-et-capsule-de-marque", hero: "mur-de-futs-empiles-et-cuves-de-cuivre-sur-chai", grid: "etiquettes-de-bouteilles-a-arche-et-profil-miniature", motion: "radar-de-gout-qui-se-trace-et-bulles-de-cuve", shapes: "capsules-dentelees-etiquettes-a-liseres-cuves-et-hachures-de-gravure", rhythm: "chai-sombre-et-bandes-kraft-par-cuvees-numerotees", signature: "catalogue-par-style-et-degre-radar-de-gout-comparatif-et-composeur-de-visite" },
  tokens: {
    colors: { primary: "#c8742f", secondary: "#12241a", accent: "#e9b872", background: "#12241a", surface: "#f1e6c8", text: "#f1e6c8", muted: "#b9c3a8", success: "#6fae5a", warning: "#e0a63b", error: "#e0705a" },
    fonts: { heading: "font.im-fell-english-sc", body: "font.cabin", button: "font.fjalla-one", link: "font.cabin" },
    radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#c8742f" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.04, transform: "none" }, h2: { size: 44, weight: 400, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur du cuivre", type: "color", default: "#c8742f" },
    { key: "chai", label: "Vert du chai", type: "color", default: "#12241a" },
    { key: "gravure", label: "Hachures de gravure", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "bulles", label: "Bulles des cuves", type: "choice", default: "on", choices: [["on", "Animées"], ["off", "Masquées"]] },
    { key: "radar", label: "Radar de goût", type: "choice", default: "plein", choices: [["plein", "Surface pleine"], ["filet", "Contour seul"]] },
  ],
  menu: [["Accueil", "/"], ["Nos bières", "/nos-bieres"], ["La brasserie", "/brasserie"], ["Visites", "/visites"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "nos-bieres", name: "Nos bières", render: bieres }, { key: "biere", name: "Fiche bière", render: biere },
    { key: "brasserie", name: "La brasserie", render: brasserie }, { key: "visites", name: "Visites et événements", render: visites }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
