// Fleur de sel — restaurant gastronomique. Direction artistique : livre de cuisine de luxe. Ivoire chaud, vert profond, filet doré très discret ; Cormorant Garamond à fort contraste,
// lettrines, numérotation des plats, menu dégustation à points de conduite, illustrations au trait (assiettes vues de dessus, branches, cloche) et grands aplats de dégradés.
const { sec, esc, nav } = require("../kit");

/* ---------- illustrations au trait (SVG en ligne, sans identifiants : dégradés faits en CSS) ---------- */
const bez = (p0, p1, p2, t) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
const sprig = (cls = "", n = 9) => {
  const P = [[16, 210], [60, 90], [200, 20]];
  let d = "";
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), x = bez(P[0][0], P[1][0], P[2][0], t), y = bez(P[0][1], P[1][1], P[2][1], t);
    const a = -60 + (i % 2 ? -42 : 42) + t * 20, s = 1 - t * 0.35;
    d += `<ellipse cx="${(x + (i % 2 ? -13 : 13) * s).toFixed(1)}" cy="${(y - 4 * s).toFixed(1)}" rx="${(17 * s).toFixed(1)}" ry="${(5.5 * s).toFixed(1)}" transform="rotate(${a.toFixed(0)} ${(x + (i % 2 ? -13 : 13) * s).toFixed(1)} ${(y - 4 * s).toFixed(1)})"/>`;
  }
  d += `<ellipse cx="201" cy="16" rx="13" ry="4.5" transform="rotate(-35 201 16)"/>`;
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 220 220" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" aria-hidden="true"><path d="M16 210Q60 90 200 20"/>${d}</svg>`;
};
const mark = `<svg class="fl-mark" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="20" cy="20" r="18.5"/><path d="M20 31V15"/><path d="M20 22c-6-1-8-6-8-9 5 0 8 3 8 9zM20 22c6-1 8-6 8-9-5 0-8 3-8 9zM20 28c-4 0-6-3-6-5 3 0 6 1 6 5zM20 28c4 0 6-3 6-5-3 0-6 1-6 5z"/></svg>`;
const food = [
  `<circle cx="168" cy="184" r="34" fill="currentColor" opacity=".13"/><circle cx="168" cy="184" r="34"/><circle cx="168" cy="184" r="22" opacity=".5"/><path d="M118 238c36 42 120 46 160-6" stroke-width="2"/><circle cx="244" cy="170" r="5" fill="currentColor"/><circle cx="262" cy="190" r="3" fill="currentColor"/><circle cx="226" cy="154" r="2.5" fill="currentColor"/><path d="M214 120c10 10 14 24 6 40M226 118c12 4 22 14 24 28" opacity=".8"/>`,
  `<path d="M104 206c30-44 98-52 150-14-8 40-60 70-106 52-18-6-34-20-44-38z" fill="currentColor" opacity=".1"/><path d="M104 206c30-44 98-52 150-14-8 40-60 70-106 52-18-6-34-20-44-38z"/><path d="M254 192l30-24v52z"/><circle cx="140" cy="206" r="3" fill="currentColor"/><path d="M130 218c30 16 70 12 104-8M150 184c24-10 52-8 74 4" opacity=".6"/><circle cx="200" cy="270" r="4" fill="currentColor"/><circle cx="224" cy="276" r="2.5" fill="currentColor"/>`,
  `<circle cx="200" cy="200" r="70"/><circle cx="200" cy="200" r="62" opacity=".5"/><path d="M140 200h120M200 140v120M158 158l84 84M242 158l-84 84" opacity=".45"/><circle cx="200" cy="200" r="10" fill="currentColor" opacity=".5"/><circle cx="200" cy="200" r="70" fill="currentColor" opacity=".08"/>`,
];
const plate = (v = 0, cls = "") => `<svg class="fl-plate ${cls}" viewBox="0 0 400 400" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" aria-hidden="true"><circle cx="200" cy="200" r="192"/><circle cx="200" cy="200" r="178" opacity=".55"/><circle cx="200" cy="200" r="124" opacity=".4"/><circle cx="200" cy="200" r="116" opacity=".3"/>${food[v % food.length]}</svg>`;
const cloche = (cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 240 190" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M34 140a86 86 0 0 1 172 0z"/><path d="M52 132a68 68 0 0 1 56-60" opacity=".55"/><circle cx="120" cy="46" r="7"/><path d="M120 53v8M14 148h212M24 158h192" opacity=".8"/><path d="M60 170h120" opacity=".4"/></svg>`;
const glass = (cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 120 220" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M26 16h68c4 50-6 98-34 100-28-2-38-50-34-100z"/><path d="M30 60h60" opacity=".6"/><path d="M60 116v78M34 200h52"/><path d="M36 30c-2 20 0 40 6 56" opacity=".5"/></svg>`;
const shell = `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M60 100 18 52C26 26 44 14 60 14s34 12 42 38z"/><path d="M60 100 36 20M60 100 48 15M60 100V14M60 100l12-85M60 100l24-80" opacity=".6"/><path d="M44 100h32l-4 8H48z"/></svg>`;
const mushroom = `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M14 66c0-30 22-48 46-48s46 18 46 48z"/><path d="M48 66c-2 20-6 32-8 40h40c-2-8-6-20-8-40" /><path d="M30 52c6-10 14-16 24-18M72 34c6 2 12 6 16 12" opacity=".6"/></svg>`;
const pear = `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M60 24c10 0 14 12 16 22 2 10 22 20 22 42 0 18-16 28-38 28S22 106 22 88c0-22 20-32 22-42 2-10 6-22 16-22z"/><path d="M60 24c0-8 2-12 6-16M60 16c8-6 18-4 22 0-6 6-16 6-22 0z"/><path d="M40 80c0 10 6 16 14 18" opacity=".6"/></svg>`;
const citrus = `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><circle cx="60" cy="60" r="44"/><circle cx="60" cy="60" r="37" opacity=".5"/><path d="M60 60V23M60 60l26-26M60 60h37M60 60l26 26M60 60v37M60 60 34 86M60 60H23M60 60 34 34"/></svg>`;
const bust = `<svg class="fl-bust" viewBox="0 0 320 400" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M92 120c-26-6-38-34-22-52 10-12 26-14 38-8 6-24 36-34 58-22 10-14 40-10 48 8 24-4 42 14 36 36-4 14-14 22-28 24l-4 24H114l-4-24c-6 0-12-2-18-6z"/><path d="M112 144h96M116 128h88" opacity=".5"/><path d="M122 144c-6 36 4 82 38 90 34-8 44-54 38-90" /><path d="M140 176c6 4 12 4 18 0M170 176c6 4 12 4 18 0M148 206c8 6 18 6 26 0" opacity=".8"/><path d="M60 400c4-84 26-130 74-148M260 400c-4-84-26-130-74-148M134 252l26 56 26-56"/><path d="M96 330c20 14 108 14 128 0M70 372c40 14 140 14 180 0" opacity=".5"/><path d="M158 308l-6 92M162 308l6 92" opacity=".4"/></svg>`;
const rule = `<div class="fl-rule" aria-hidden="true"></div>`;
const orn = `<div class="fl-orn" aria-hidden="true"><i></i><svg viewBox="0 0 40 20" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M20 3 24 10 20 17 16 10z"/><path d="M4 10h8M28 10h8" opacity=".7"/></svg><i></i></div>`;
const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/* ---------- en-tête, pied de page, têtes de page ---------- */
const header = (c) => `<header class="fl-head pk-bleed"><div class="fl-bar">
  <div class="fl-nav fl-nav--l" role="navigation" aria-label="Navigation principale, première partie">${nav(c.menu.slice(0, 3))}</div>
  <a class="fl-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span class="fl-logo-n">Fleur de sel</span><small>Maison de cuisine · Bordeaux</small></a>
  <div class="fl-nav fl-nav--r" role="navigation" aria-label="Navigation principale, seconde partie">${nav(c.menu.slice(3))}<a class="fl-btn fl-btn--sm" href="/contact">Réserver</a></div>
  <details class="fl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="fl-drawer" role="navigation" aria-label="Menu mobile">${sprig("fl-drawer-art")}<a href="/">Accueil</a>${nav(c.menu)}<a class="fl-btn fl-btn--fill" href="/contact">Réserver une table</a></div></details>
</div>${rule}</header>`;

const footer = (c) => `<footer class="fl-foot pk-bleed">${sprig("fl-foot-art")}<div class="fl-foot-top">${mark}<p class="fl-foot-name">Fleur de sel</p><p class="fl-foot-tag">Cuisine de saison, sel de l'Atlantique et feu de bois.</p></div>${rule}
  <div class="fl-foot-grid"><div><h3>La maison</h3><address>12 quai des Brumes<br>33000 Bordeaux<br><a href="mailto:table@fleurdesel.example">table@fleurdesel.example</a></address></div>
  <div><h3>Heures d'ouverture</h3><p>Mardi au samedi<br>Déjeuner 12 h – 14 h<br>Dîner 19 h 30 – 22 h<br>Dimanche : déjeuner seul</p></div>
  <div><h3>Explorer</h3>${nav(c.menu.slice(0, 5), "fl-fl")}</div>
  <div><h3>Réserver</h3><p>Par le formulaire de contact : nous confirmons chaque table sous 24 heures.</p><a class="fl-btn fl-btn--sm" href="/contact">Réserver une table</a></div></div>
  <p class="fl-legal">© Fleur de sel — site de démonstration. Maison, chef, menus et producteurs fictifs ; tarifs donnés à titre d'exemple.</p></footer>`;

const ph = (n, kicker, title, sub) => sec(`<section class="fl-ph pk-bleed">${sprig("fl-ph-art fl-ph-art--l")}${sprig("fl-ph-art fl-ph-art--r")}<p class="fl-kick fl-in" data-reveal>${roman[n] ? roman[n] + " · " : ""}${esc(kicker)}</p><div class="fl-h1 fl-in" role="heading" aria-level="1">${title}</div>${orn}<p class="fl-sub" data-reveal>${esc(sub)}</p></section>`);

const tabs = (items) => `<div class="fl-tabs" role="tablist" aria-label="Choisir la carte">${items.map(([k, l], i) => `<a href="#${k}" ${i ? "" : 'class="is-on" '}data-tab="${k}" role="tab" aria-selected="${i ? "false" : "true"}">${l}</a>`).join("")}</div>`;

/* ---------- composants spécifiques ---------- */
const tasting = [
  ["Huître de Marennes", "gelée d'eau de mer, perle de concombre, fleur de sel", "Muscadet sur lie, Domaine des Brumes 2022"],
  ["Saint-Jacques", "beurre noisette, panais rôti, copeaux de truffe d'été", "Chablis premier cru, Clos Aubépine 2020"],
  ["Cèpe de pays", "œuf de ferme à 63 °, jus de volaille rôti", "Pessac-Léognan blanc, Château Lunel 2019"],
  ["Bar de ligne", "fenouil confit, émulsion safran, écaille croustillante", "Sancerre, Domaine des Vignes Hautes 2021"],
  ["Pigeon des Landes", "betterave cuite aux braises, cerise noire, jus corsé", "Saint-Émilion grand cru, Château Roc Doré 2016"],
  ["Fromages affinés", "le chariot de la maison, pain au levain, confiture de figue", "Porto tawny, Quinta do Sol 20 ans"],
  ["Poire pochée", "caramel au sel, glace vanille, feuille d'or alimentaire", "Sauternes, Château Miel d'Août 2015"],
];
const dish = (n, name, desc, price, pair, showN = true) => `<li class="fl-dish"><span class="fl-dn" aria-hidden="true">${showN ? n : ""}</span><div class="fl-dbody"><div class="fl-dline"><h3 class="fl-dname">${esc(name)}</h3><i class="fl-dots" aria-hidden="true"></i>${price ? `<b class="fl-dprice">${price}</b>` : ""}</div><p class="fl-ddesc">${esc(desc)}</p>${pair ? `<p class="fl-pair"><span>Accord</span> ${esc(pair)}</p>` : ""}</div></li>`;
const num = (i) => String(i + 1).padStart(2, "0");
const tastingBlock = (withHead = true) => `<div class="fl-tasting">${withHead ? `<div class="fl-tasting-head"><p class="fl-kick" data-reveal>Menu dégustation</p><h2 class="fl-h2" data-reveal>Sept temps, un seul fil</h2><p class="fl-sub-s" data-reveal>Le menu change avec le marché. Servi à l'ensemble de la table, du mardi au samedi soir.</p></div>` : ""}
  <div class="fl-cols"><ol class="fl-dishes" data-reveal>${tasting.slice(0, 4).map((d, i) => dish(num(i), d[0], d[1], "", d[2])).join("")}</ol><ol class="fl-dishes" start="5" data-reveal>${tasting.slice(4).map((d, i) => dish(num(i + 4), d[0], d[1], "", d[2])).join("")}
  <li class="fl-total"><span>Menu en sept temps</span><i class="fl-dots" aria-hidden="true"></i><b>142 €</b></li><li class="fl-total"><span>Accords mets et vins</span><i class="fl-dots" aria-hidden="true"></i><b>68 €</b></li></ol></div></div>`;

const seasonal = () => `<div class="fl-season"><div class="fl-season-head"><p class="fl-kick" data-reveal>Produits de saison</p><h2 class="fl-h2" data-reveal>Ce que novembre nous donne</h2></div>
  <ul class="fl-prods">${[[shell, "Saint-Jacques", "Plongée en baie d'Arcachon", "Novembre – mars"], [mushroom, "Cèpes", "Cueillis dans les Landes", "Octobre – novembre"], [pear, "Poire Doyenné", "Verger de la vallée de la Dordogne", "Octobre – décembre"], [citrus, "Cédrat & agrumes", "Confits à la maison", "Novembre – février"]].map(([ic, n, o, m], i) => `<li class="fl-prod" data-reveal><span class="fl-prod-ic">${ic}</span><span class="fl-prod-no" aria-hidden="true">${roman[i + 1]}</span><h3>${n}</h3><p>${o}</p><small>${m}</small></li>`).join("")}</ul></div>`;

const chefQuote = (cite = true) => `<figure class="fl-quote" data-reveal><svg class="fl-q-mark" viewBox="0 0 60 44" fill="currentColor" aria-hidden="true"><path d="M0 44V26C0 10 8 2 24 0v8C16 10 12 16 12 24h12v20zM34 44V26C34 10 42 2 58 0v8C50 10 46 16 46 24h12v20z"/></svg><blockquote><p>Le sel ne cache rien, il révèle. Toute ma cuisine tient dans cette promesse : un produit juste, une cuisson patiente, et le courage de s'arrêter à temps.</p></blockquote>${cite ? `<figcaption><span class="fl-sign">Élise Varenne</span><small>Cheffe et fondatrice</small></figcaption>` : ""}</figure>`;

const hours = () => `<div class="fl-hours"><p class="fl-kick" data-reveal>Horaires d'ouverture</p><h2 class="fl-h2" data-reveal>À table, à l'heure du marché</h2>
  <dl class="fl-hl" data-reveal>${[["Mardi – vendredi", "12 h – 14 h · 19 h 30 – 22 h"], ["Samedi", "12 h – 14 h 30 · 19 h – 22 h 30"], ["Dimanche", "12 h – 14 h 30"], ["Lundi", "Fermé"]].map(([d, h]) => `<div><dt>${d}</dt><i class="fl-dots" aria-hidden="true"></i><dd>${h}</dd></div>`).join("")}</dl>
  <address data-reveal>12 quai des Brumes, 33000 Bordeaux<br>Dernière prise de commande 45 minutes avant la fermeture.</address></div>`;

const banner = () => sec(`<section class="fl-banner pk-bleed">${sprig("fl-ph-art fl-ph-art--l")}${sprig("fl-ph-art fl-ph-art--r")}<div class="fl-banner-in" data-reveal><p class="fl-kick">Une table vous attend</p><h2 class="fl-h2 fl-h2--l">Réserver une table</h2><p>Dites-nous le jour, le nombre de convives et vos envies : nous vous répondons personnellement.</p><a class="fl-btn fl-btn--fill" href="/contact">Réserver une table</a></div></section>`);

const wines = [["Blancs"], ["Pessac-Léognan", "Château Lunel", "2019", "16", "98"], ["Chablis 1er cru", "Clos Aubépine", "2020", "15", "84"], ["Sancerre", "Domaine des Vignes Hautes", "2021", "14", "72"], ["Rouges"], ["Saint-Émilion grand cru", "Château Roc Doré", "2016", "19", "132"], ["Margaux", "Domaine de la Source", "2015", "21", "160"], ["Chinon", "Les Coteaux Bleus", "2020", "12", "58"], ["Effervescents & doux"], ["Champagne brut nature", "Maison Aurèle", "NM", "22", "125"], ["Sauternes", "Château Miel d'Août", "2015", "17", "110"]];
const wineTable = () => `<table class="fl-wines"><caption class="fl-sr">Carte des vins : appellation, domaine, millésime, prix au verre et à la bouteille</caption><thead><tr><th scope="col">Appellation</th><th scope="col">Domaine</th><th scope="col">Année</th><th scope="col">Verre</th><th scope="col">Bouteille</th></tr></thead><tbody>${wines.map((w) => w.length === 1 ? `<tr class="fl-grp"><th colspan="5" scope="colgroup">${w[0]}</th></tr>` : `<tr><th scope="row" data-label="Appellation">${esc(w[0])}</th><td data-label="Domaine">${esc(w[1])}</td><td data-label="Année">${w[2]}</td><td data-label="Verre">${w[3]} €</td><td data-label="Bouteille">${w[4]} €</td></tr>`).join("")}</tbody></table>`;

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="fl-hero pk-bleed"><div class="fl-hero-bg" aria-hidden="true"></div>
    <div class="fl-hero-art fl-zoom" aria-hidden="true">${plate(0, "fl-hero-plate")}</div>${sprig("fl-hero-sprig fl-hero-sprig--l")}${sprig("fl-hero-sprig fl-hero-sprig--r")}
    <div class="fl-hero-copy"><p class="fl-kick fl-kick--on fl-in">Restaurant gastronomique · Bordeaux</p><div class="fl-h1 fl-h1--hero fl-in" role="heading" aria-level="1">Le sel, le feu,<br><em>le temps.</em></div>
      <p class="fl-hero-p fl-in">Une cuisine de saison, patiente et précise, signée par la cheffe Élise Varenne. Sept temps pour goûter l'Atlantique et ses jardins.</p>
      <div class="fl-hero-act fl-in"><a class="fl-btn fl-btn--hero" href="/contact">Réserver</a><a class="fl-link fl-link--on" href="/carte">Découvrir la carte</a></div></div>
    <ul class="fl-hero-strip"><li>Mardi – samedi<br><b>12 h – 14 h · 19 h 30 – 22 h</b></li><li>12 quai des Brumes<br><b>33000 Bordeaux</b></li><li>Menu dégustation<br><b>sept temps, dès 142 €</b></li></ul></section>`),
  sec(`<section class="fl-intro pk-bleed"><div class="fl-wrap fl-intro-in"><div class="fl-intro-fig" data-reveal>${plate(1, "fl-zoom-s")}<p class="fl-cap">Planche I — Saint-Jacques, vue du dessus</p></div>
    <div class="fl-intro-txt"><p class="fl-kick" data-reveal>I · La maison</p><h2 class="fl-h2" data-reveal>Une table d'auteur, ouverte sur le fleuve</h2>
    <p class="fl-drop" data-reveal>Depuis neuf ans, Fleur de sel cuisine à la même cadence : celle des marées et des saisons. Quarante couverts, une brigade de neuf personnes, un four à bois que l'on allume avant l'aube. Ici, chaque assiette se dessine comme une page : peu d'éléments, tous nécessaires.</p>
    <p data-reveal>On vient pour un déjeuner qui prend son temps, pour un dîner de fête ou pour entendre la cheffe raconter son producteur de poireaux. Rien n'est pressé, tout est préparé.</p>
    <a class="fl-link" href="/chef" data-reveal>Rencontrer la cheffe</a></div></div></section>`),
  sec(`<section class="fl-menu-sec pk-bleed"><div class="fl-wrap">${tastingBlock()}<p class="fl-center" data-reveal><a class="fl-btn" href="/carte">Voir toute la carte</a></p></div></section>`),
  sec(`<section class="fl-season-sec pk-bleed"><div class="fl-wrap">${seasonal()}</div></section>`),
  sec(`<section class="fl-quote-sec pk-bleed"><div class="fl-hero-bg fl-hero-bg--q" aria-hidden="true"></div>${cloche("fl-q-art")}<div class="fl-wrap">${chefQuote()}</div></section>`),
  sec(`<section class="fl-visit pk-bleed"><div class="fl-wrap fl-visit-in">${hours()}<div class="fl-visit-fig" data-reveal>${cloche("fl-zoom-s")}<p class="fl-cap">Planche II — La cloche de service</p></div></div></section>`),
  banner(), sec(footer(c)),
];

const carte = (c) => [sec(header(c)), ph(1, "La carte", "Carte &amp; menus", "Un déjeuner en trois temps, un dîner en sept, et une cave de petits producteurs. Tarifs donnés à titre d'exemple."),
  sec(`<section class="fl-carte pk-bleed"><div class="fl-wrap">${tabs([["dejeuner", "Déjeuner"], ["diner", "Dîner"], ["vins", "Carte des vins"]])}
    <div class="fl-panel" data-panel="dejeuner"><p class="fl-panel-h" data-reveal>Menu du déjeuner · entrée, plat, dessert · 58 €</p><div class="fl-cols">
      <div><h2 class="fl-h3">Entrées</h2><ol class="fl-dishes">${dish("01", "Velouté de potimarron", "huile de noisette, châtaigne grillée", "", "", true)}${dish("02", "Maquereau mariné", "radis, raifort, herbes du jardin", "", "", true)}${dish("03", "Terrine de campagne", "pickles de saison, pain toasté", "", "", true)}</ol></div>
      <div><h2 class="fl-h3">Plats</h2><ol class="fl-dishes">${dish("04", "Lieu jaune rôti", "poireau fondant, beurre blanc", "", "", true)}${dish("05", "Joue de porc braisée", "purée de céleri, jus réduit", "", "", true)}${dish("06", "Risotto aux cèpes", "parmesan vieilli, persil plat", "", "", true)}</ol></div></div>
      <h2 class="fl-h3 fl-h3--c">Desserts</h2><div class="fl-cols"><ol class="fl-dishes">${dish("07", "Tarte fine aux pommes", "crème d'Isigny, calvados", "", "", true)}</ol><ol class="fl-dishes">${dish("08", "Chocolat, sel et noisette", "glace au lait fumé", "", "", true)}</ol></div></div>
    <div class="fl-panel" data-panel="diner" hidden>${tastingBlock(false).replace('class="fl-tasting"', 'class="fl-tasting fl-tasting--tab"')}<p class="fl-note">Menu unique pour l'ensemble de la table. Allergies et régimes : merci de nous le signaler à la réservation.</p></div>
    <div class="fl-panel" data-panel="vins" hidden><p class="fl-panel-h">Une cave de quatre-vingts références, toutes au verre sur demande</p>${wineTable()}<div class="fl-wine-fig" aria-hidden="true">${glass("fl-glass")}</div></div></div></section>`),
  sec(`<section class="fl-season-sec pk-bleed"><div class="fl-wrap">${seasonal()}</div></section>`), banner(), sec(footer(c))];

const chef = (c) => [sec(header(c)), ph(2, "Le chef", "Élise Varenne", "Une cheffe, une brigade, un four à bois. Récit d'une cuisine qui apprend à se taire."),
  sec(`<section class="fl-story pk-bleed"><div class="fl-wrap fl-story-in"><figure class="fl-portrait" data-reveal>${bust}<figcaption class="fl-cap">Planche III — Portrait de la cheffe, gravure</figcaption></figure>
    <div class="fl-story-txt"><p class="fl-kick" data-reveal>Chapitre 1</p><h2 class="fl-h2" data-reveal>Le goût du dimanche</h2><p class="fl-drop" data-reveal>Élise grandit entre un marché de Libourne et la cuisine de sa grand-mère, où l'on salait l'eau « comme la mer ». Elle y apprend l'essentiel : un bon produit demande surtout qu'on lui laisse de la place.</p>
    <p data-reveal>Après dix ans de brigades, à Paris puis à Copenhague, elle revient au fleuve de son enfance et ouvre Fleur de sel avec une idée simple : retirer jusqu'à ce qu'il ne reste que le goût.</p></div></div></section>`),
  sec(`<section class="fl-aside pk-bleed"><div class="fl-wrap">${chefQuote(false)}</div></section>`),
  sec(`<section class="fl-story2 pk-bleed"><div class="fl-wrap fl-story2-in"><div class="fl-story2-txt"><p class="fl-kick" data-reveal>Chapitre 2</p><h2 class="fl-h2" data-reveal>Une brigade, un jardin, un four</h2>
    <p data-reveal>Neuf cuisiniers et cuisinières travaillent à vue, dans un silence que la cheffe tient pour une politesse. Le potager de Saint-Médard fournit les herbes ; les pêcheurs d'Arcachon livrent à six heures.</p>
    <p data-reveal>Le four à bois, allumé à l'aube, donne aux viandes et aux légumes cette note de braise que l'on retrouve de l'entrée au dessert.</p></div>
    <ol class="fl-timeline" data-reveal>${[["2009", "Premiers fourneaux à Paris, rue du Cherche-Midi"], ["2014", "Seconde de cuisine à Copenhague"], ["2017", "Ouverture de Fleur de sel, quai des Brumes"], ["2023", "Création du potager de la maison"]].map(([y, t]) => `<li><b>${y}</b><span>${t}</span></li>`).join("")}</ol></div></section>`),
  sec(`<section class="fl-team pk-bleed"><div class="fl-wrap"><p class="fl-kick fl-center" data-reveal>Ceux qui font la salle</p><ul class="fl-team-in">${[["Élise Varenne", "Cheffe", plate(2)], ["Mathieu Roux", "Chef pâtissier", citrus], ["Camille Aubry", "Sommelière", glass()]].map(([n, r, s]) => `<li data-reveal><span class="fl-team-ic">${s}</span><h3>${n}</h3><p>${r}</p></li>`).join("")}</ul></div></section>`),
  banner(), sec(footer(c))];

const tile = (cls, svg, cap) => `<figure class="fl-tile ${cls}" data-reveal><span class="fl-tile-art fl-zoom-s">${svg}</span><figcaption>${cap}</figcaption></figure>`;
const salle = (c) => [sec(header(c)), ph(3, "La salle", "La salle &amp; la cave", "Quarante couverts, des nappes de lin, la lumière du fleuve. Une salle pensée pour ralentir."),
  sec(`<section class="fl-gal pk-bleed"><div class="fl-wrap"><div class="fl-gal-in">${tile("fl-t0", plate(0), "La grande salle")}${tile("fl-t1", cloche(), "Le passe")}${tile("fl-t2", glass(), "La cave voûtée")}${tile("fl-t3", sprig("", 9), "La terrasse")}${tile("fl-t4", plate(2), "Le salon privé")}${tile("fl-t5", citrus, "Le comptoir")}</div></div></section>`),
  sec(`<section class="fl-plan-sec pk-bleed"><div class="fl-wrap fl-plan-in"><div data-reveal><p class="fl-kick">Le plan</p><h2 class="fl-h2">Quarante couverts, trois ambiances</h2><p class="fl-lead">Douze tables dans la grande salle, un salon privé de douze convives, quelques places au comptoir face aux cuisines.</p>
    <ul class="fl-legend"><li><i class="a"></i>Grande salle</li><li><i class="b"></i>Salon privé</li><li><i class="c"></i>Comptoir</li></ul></div>
    <svg class="fl-plan" viewBox="0 0 400 280" fill="none" stroke="currentColor" stroke-width="1.2" role="img" aria-label="Plan schématique de la salle"><title>Plan schématique de la salle</title><rect x="8" y="8" width="384" height="264"/><rect x="24" y="24" width="230" height="232" opacity=".5"/>${[0, 1, 2].flatMap((r) => [0, 1, 2].map((q) => `<circle cx="${70 + q * 80}" cy="${70 + r * 68}" r="20" fill="currentColor" opacity=".12"/>`)).join("")}<rect x="270" y="24" width="106" height="110" fill="currentColor" opacity=".16"/><ellipse cx="323" cy="79" rx="38" ry="30"/><rect x="270" y="150" width="106" height="106" opacity=".5"/><path d="M286 232h74M286 210h74M286 188h74"/><path d="M254 100h16M254 200h16" stroke-width="6" opacity=".4"/></svg></div></section>`),
  sec(`<section class="fl-visit pk-bleed"><div class="fl-wrap fl-visit-in">${hours()}<div class="fl-visit-fig" data-reveal>${glass("fl-zoom-s fl-glass-l")}<p class="fl-cap">Planche IV — Verre à pied</p></div></div></section>`), banner(), sec(footer(c))];

const reservation = (c) => [sec(header(c)), ph(4, "Réserver &amp; célébrer", "Réservations &amp; événements", "Une table pour deux, un déjeuner d'affaires ou la maison tout entière pour un soir."),
  sec(`<section class="fl-forms pk-bleed"><div class="fl-wrap"><ul class="fl-formulas">${[["01", "Table à deux, à six", "Réservation à la carte ou au menu dégustation. Confirmation par courriel sous 24 heures.", glass()], ["02", "Salon privé", "Jusqu'à douze convives, menu composé avec la cheffe et accords sur mesure.", plate(2)], ["03", "Privatisation", "La salle entière, jusqu'à quarante convives, pour un mariage, un anniversaire ou un séminaire.", cloche()]].map(([n, t, p, s], i) => `<li class="fl-formula" data-reveal><span class="fl-formula-n" aria-hidden="true">${n}</span><span class="fl-formula-ic">${s}</span><h2 class="fl-h3">${t}</h2><p>${p}</p><a class="fl-link" href="/contact">Écrire à la maison</a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="fl-steps pk-bleed"><div class="fl-wrap fl-steps-in"><div data-reveal><p class="fl-kick">Comment faire</p><h2 class="fl-h2">Trois étapes, sans hâte</h2></div><ol class="fl-steps-l">${[["Écrivez-nous", "Date, nombre de convives, occasion, régimes particuliers."], ["Nous composons", "Un retour personnalisé de la maison, avec un projet de menu."], ["Nous confirmons", "Votre table est notée et un courriel de confirmation vous est envoyé."]].map(([t, p], i) => `<li data-reveal><span class="fl-step-n" aria-hidden="true">${roman[i + 1]}</span><div><h3>${t}</h3><p>${p}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="fl-faq pk-bleed"><div class="fl-wrap fl-faq-in"><h2 class="fl-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Peut-on réserver le jour même ?</summary><p>Selon les disponibilités. Écrivez-nous le matin et nous vous répondons dans la journée.</p></details>
    <details data-reveal><summary>Adaptez-vous les menus aux régimes ?</summary><p>Oui, végétarien, sans gluten ou allergies : prévenez-nous à la réservation pour que la cuisine s'y prépare.</p></details>
    <details data-reveal><summary>Accueillez-vous les enfants ?</summary><p>Avec plaisir. Une proposition courte de trois plats est préparée pour les moins de douze ans.</p></details>
    <details data-reveal><summary>Une table est-elle accessible en fauteuil ?</summary><p>Oui, la grande salle est de plain-pied ; précisez-le simplement à la réservation.</p></details></div></div></section>`),
  banner(), sec(footer(c))];

const posts = [
  ["12 novembre 2026", "Carte", "L'automne passe à table", "Cèpes, châtaignes, poire Doyenné : la carte d'automne s'installe jusqu'à la mi-décembre, avec un nouveau plat de gibier cuit au feu de bois."],
  ["28 octobre 2026", "Producteurs", "Visite chez le maraîcher de Saint-Médard", "Nous avons passé une matinée dans les rangs de poireaux et de bettes avec l'équipe du potager. Récit et quelques recettes de saison."],
  ["9 octobre 2026", "Cave", "Trois blancs de Loire à redécouvrir", "Notre sommelière Camille Aubry présente trois bouteilles tendues et salines qui accompagnent merveilleusement les produits de la mer."],
  ["15 septembre 2026", "Maison", "Un nouveau four à bois dans les cuisines", "Quatre semaines de travaux, un four en briques réfractaires et une cuisson qui change le goût des viandes."],
];
const carnet = (c) => [sec(header(c)), ph(5, "Le carnet", "Le carnet de la maison", "Saisons, producteurs, cave : des nouvelles de la cuisine, écrites à la plume."),
  sec(`<section class="fl-journal pk-bleed"><div class="fl-wrap"><article class="fl-post fl-post--big" data-reveal><div class="fl-post-art">${plate(0, "fl-zoom-s")}</div><div><p class="fl-kick"><time>${posts[0][0]}</time> · ${posts[0][1]}</p><h2 class="fl-h2">${posts[0][2]}</h2><p class="fl-drop">${posts[0][3]}</p></div></article>
    <div class="fl-posts">${posts.slice(1).map((p, i) => `<article class="fl-post" data-reveal><span class="fl-post-n" aria-hidden="true">${roman[i + 2]}</span><div><p class="fl-kick"><time>${p[0]}</time> · ${p[1]}</p><details><summary><h2 class="fl-h3">${p[2]}</h2></summary><p>${p[3]}</p></details></div></article>`).join("")}</div></div></section>`),
  banner(), sec(footer(c))];

const contact = (c) => [sec(header(c)), ph(6, "Nous écrire", "Contact", "Une réservation, une question, un événement : écrivez-nous, nous répondons personnellement."),
  sec(`<section class="fl-contact pk-bleed"><div class="fl-wrap fl-contact-in"><div data-reveal><h2 class="fl-h3">La maison</h2><address>12 quai des Brumes<br>33000 Bordeaux<br><a href="mailto:table@fleurdesel.example">table@fleurdesel.example</a></address></div>
    <div data-reveal><h2 class="fl-h3">Ouverture</h2><p>Mardi au samedi : 12 h – 14 h, 19 h 30 – 22 h.<br>Dimanche : déjeuner. Lundi : fermé.</p></div><div data-reveal><h2 class="fl-h3">Pour réserver</h2><p>Indiquez la date, l'heure souhaitée et le nombre de convives dans votre message.</p></div></div></section>`),
  { type: "form", heading: "Réserver une table ou nous écrire", intro: "Dites-nous la date, le nombre de convives et vos envies. Nous confirmons chaque demande par courriel sous 24 heures." },
  { type: "layout", children: [{ type: "map", props: { address: "12 quai des Brumes, 33000 Bordeaux", zoom: 14, height: 360 } }] }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), ph(7, "Rechercher", "Une envie ?", "Un plat, un vin, un article du carnet."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="fl-404 pk-bleed">${cloche("fl-404-art")}<p class="fl-kick">Erreur 404</p><div class="fl-h1" role="heading" aria-level="1">Cette table n'existe pas</div>${orn}<p class="fl-sub">La page demandée a changé d'adresse ou n'a jamais été dressée. Revenons à la salle.</p><div class="fl-center"><a class="fl-btn fl-btn--fill" href="/">Retour à l'accueil</a> <a class="fl-link" href="/carte">Voir la carte</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "fleur", name: "Fleur de sel", version: "2.0.0", category: "gastronomie", tags: ["editorial", "luxe", "classique", "chaleureux"], siteType: "Restaurant gastronomique", featured: true,
  concept: "Un livre de cuisine de luxe : ivoire chaud, vert profond, filet doré, serif à fort contraste, menu à points de conduite et assiettes dessinées au trait.",
  description: "Restaurant gastronomique : fond ivoire et vert profond, menu dégustation en deux colonnes avec accords mets-vins, carte à onglets, histoire de la cheffe, salle illustrée, horaires et réservation.",
  brand: "Fleur de sel", modules: ["formulaires", "recherche"],
  dna: { header: "logo-centre-menu-centre", hero: "plein-ecran-serif-immersif", grid: "menu-degustation-colonnes", motion: "fondu-lent-et-zoom", shapes: "filets-fins-dores", rhythm: "aere-narratif", signature: "menu-degustation-et-accords" },
  tokens: {
    colors: { primary: "#143127", secondary: "#0c1d16", accent: "#b8923f", background: "#f7f1e4", surface: "#fbf7ee", text: "#1c2a23", muted: "#59574a", success: "#2f6b4f", warning: "#7a5f25", error: "#9b2c2c" },
    fonts: { heading: "font.cormorant-garamond", body: "font.newsreader", button: "font.newsreader", link: "font.newsreader" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#b8923f" },
    type: { h1: { size: 88, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 48, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur du filet (or, cuivre)", type: "color", default: "#b8923f" },
    { key: "fond", label: "Fond de la page", type: "choice", default: "light", choices: [["light", "Ivoire clair"], ["dark", "Vert nuit"]] },
    { key: "filets", label: "Style des filets", type: "choice", default: "simple", choices: [["simple", "Simple"], ["double", "Double"], ["pointille", "Pointillé"]] },
    { key: "numeros", label: "Numéros des plats", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "lent", label: "Animations lentes", type: "choice", default: "on", choices: [["on", "Activées"], ["off", "Désactivées"]] },
  ],
  menu: [["La carte", "/carte"], ["Le chef", "/chef"], ["La salle", "/salle"], ["Événements", "/reservation"], ["Carnet", "/carnet"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "carte", name: "La carte", render: carte }, { key: "chef", name: "Le chef", render: chef },
    { key: "salle", name: "La salle", render: salle }, { key: "reservation", name: "Réservations et événements", render: reservation }, { key: "carnet", name: "Carnet", render: carnet },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
