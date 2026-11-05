// Infusion — boutique premium de thés et cafés d'origine. Direction artistique : rituel et terroir, matière sombre (feuilles, grains, vapeur), étiquettes et cartes de provenance.
// Signature : fiche d'origine (carte, altitude, récolte, roue des saveurs, minuteur d'infusion) + boutique filtrable + panier fictif (récapitulatif vers /contact, aucune vente).
const { sec: rawSec, esc, nav } = require("../kit");
const sec = (h) => rawSec(String(h).replace(/ class=""/g, ""));

/* ---------- données ---------- */
const mapXY = (lon, lat) => [Math.round(((lon + 180) / 360) * 1000), Math.round(((90 - lat) / 180) * 500)];
const ORIGINS = {
  darjeeling: { n: "Darjeeling", p: "Inde", alt: 1900, lon: 88.3, lat: 27, rec: "Mars–avril (premier flush), puis mai–juin", cl: "Brumes fraîches de l'Himalaya, pentes à 40 %", pr: "Flétrissage lent, roulage léger, oxydation courte", t: "Thé noir léger" },
  uji: { n: "Uji", p: "Japon", alt: 150, lon: 135.8, lat: 34.9, rec: "Fin avril–mai, après 20 jours d'ombrage", cl: "Vallée de rivière, brumes du matin", pr: "Vapeur immédiate pour garder la couleur", t: "Thé vert" },
  alishan: { n: "Alishan", p: "Taïwan", alt: 1250, lon: 120.8, lat: 23.5, rec: "Printemps et hiver, cueillette à la main", cl: "Montagne, nuages bas, fort écart jour-nuit", pr: "Oxydation partielle, roulage en boule", t: "Oolong" },
  yunnan: { n: "Yunnan", p: "Chine", alt: 1600, lon: 101.5, lat: 25, rec: "Avril (printemps), arbres de plus de 80 ans", cl: "Plateau subtropical, saison des pluies marquée", pr: "Oxydation complète, séchage au soleil", t: "Thé noir corsé" },
  yirgacheffe: { n: "Yirgacheffe", p: "Éthiopie", alt: 1900, lon: 38.2, lat: 6.2, rec: "Octobre–janvier, cerises mûres cueillies à la main", cl: "Haut plateau, petites parcelles familiales", pr: "Lavé, séchage sur lits africains", t: "Café" },
  huila: { n: "Huila", p: "Colombie", alt: 1700, lon: -75.5, lat: 2.5, rec: "Avril–juin et octobre–décembre", cl: "Cordillère, sols volcaniques, pluies régulières", pr: "Lavé, fermentation de 36 heures", t: "Café" },
  cederberg: { n: "Cederberg", p: "Afrique du Sud", alt: 500, lon: 19.2, lat: -32.4, rec: "Janvier–mars, séchage au soleil sur aires", cl: "Montagnes sèches, étés chauds", pr: "Coupé, oxydé puis séché", t: "Rooibos" },
};
const TYPES = { "the-vert": "Thé vert", "the-noir": "Thé noir", oolong: "Oolong", infusion: "Infusion", cafe: "Café" };
const GLYPH = { "the-vert": "#46602a", "the-noir": "#7a3b1c", oolong: "#8a6a24", infusion: "#8f2f26", cafe: "#3b2418" };
const TIN = { "the-vert": "#5f7d3a", "the-noir": "#8a4a26", oolong: "#7b7a3a", infusion: "#a34535", cafe: "#4a3022" };
const PRODUCTS = [
  { id: "darjeeling", n: "Darjeeling premier flush", t: "the-noir", o: "darjeeling", f: 2, b: 1, p: 18.9, w: "50 g", nt: "Fleur de muscat, pêche blanche" },
  { id: "sencha", n: "Sencha d'Uji", t: "the-vert", o: "uji", f: 2, b: 1, p: 16.5, w: "50 g", nt: "Herbe fraîche, noisette verte" },
  { id: "matcha", n: "Matcha cérémonie", t: "the-vert", o: "uji", f: 4, b: 1, p: 24, w: "30 g", nt: "Umami, crème, algue douce" },
  { id: "genmaicha", n: "Genmaïcha", t: "the-vert", o: "uji", f: 1, b: 0, p: 11.5, w: "80 g", nt: "Riz soufflé, céréale grillée" },
  { id: "alishan", n: "Oolong d'Alishan", t: "oolong", o: "alishan", f: 2, b: 0, p: 21, w: "50 g", nt: "Orchidée, beurre frais" },
  { id: "dianhong", n: "Dian Hong du Yunnan", t: "the-noir", o: "yunnan", f: 4, b: 0, p: 14.5, w: "80 g", nt: "Cacao, miel de châtaignier" },
  { id: "puerh", n: "Pu-erh d'arbres anciens", t: "the-noir", o: "yunnan", f: 5, b: 0, p: 19, w: "60 g", nt: "Sous-bois, cuir, cacao noir" },
  { id: "rooibos", n: "Rooibos nature", t: "infusion", o: "cederberg", f: 1, b: 1, p: 9.5, w: "100 g", nt: "Miel, bois chaud, vanille" },
  { id: "rooibosorange", n: "Rooibos orange-cannelle", t: "infusion", o: "cederberg", f: 1, b: 0, p: 10.5, w: "100 g", nt: "Zeste, cannelle, caramel" },
  { id: "yirgacheffe", n: "Yirgacheffe lavé", t: "cafe", o: "yirgacheffe", f: 2, b: 1, p: 15.9, w: "250 g", nt: "Jasmin, bergamote, citron" },
  { id: "huila", n: "Huila équilibré", t: "cafe", o: "huila", f: 3, b: 0, p: 13.9, w: "250 g", nt: "Caramel, noisette, orange" },
  { id: "huilanoir", n: "Huila torréfaction foncée", t: "cafe", o: "huila", f: 5, b: 0, p: 14.5, w: "250 g", nt: "Chocolat noir, épices, fumé" },
];
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";

/* ---------- dessins ---------- */
const tin = (p) => `<svg class="ia-tin" viewBox="0 0 120 150" aria-hidden="true"><rect x="24" y="12" width="72" height="14" rx="3" fill="#b8693a"/><rect x="18" y="24" width="84" height="118" rx="8" fill="${TIN[p.t]}"/><rect x="30" y="52" width="60" height="68" rx="3" fill="#efe4cc"/>${p.t === "cafe" ? `<ellipse cx="60" cy="82" rx="12" ry="17" transform="rotate(25 60 82)" fill="${GLYPH.cafe}"/><path d="M52 94c8-8 8-16 16-24" fill="none" stroke="#efe4cc" stroke-width="2"/>` : `<path d="M60 64c16 8 18 26 0 40-18-14-16-32 0-40z" fill="${GLYPH[p.t]}"/><path d="M60 70v30" stroke="#efe4cc" stroke-width="1.6"/>`}<path d="M38 110h44M44 115h32" stroke="#2a1b12" opacity=".45" stroke-width="2"/></svg>`;
const dots = (n) => `<span class="ia-force" role="img" aria-label="Force ${n}/5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
const card = (p) => {
  const o = ORIGINS[p.o];
  return `<article class="ia-card" data-type="${p.t}" data-origin="${p.o}" data-force="${p.f}" data-bio="${p.b}" data-price="${p.p}"><a class="ia-art" href="/produit" aria-label="${esc(p.n)} : fiche d'origine">${tin(p)}<span class="ia-seal">${o.alt}<small>m</small></span></a>
  <div class="ia-lab"><p class="ia-orig">${o.n} · ${o.p}</p><h3>${esc(p.n)}</h3><p class="ia-nt">${esc(p.nt)}</p><ul class="ia-meta"><li>${TYPES[p.t]}</li><li>${dots(p.f)}</li>${p.b ? '<li class="ia-bio">Bio</li>' : ""}</ul>
  <div class="ia-buy"><b>${eur(p.p)}</b><small>/ ${p.w}</small><a class="ia-add" href="#ajouter" data-add="${p.id}" data-name="${esc(p.n)} (${p.w})" data-price="${p.p}">Ajouter</a></div></div></article>`;
};
const arr = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
const leafMark = `<svg class="ia-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3c9 5 10 15 0 26C6 18 7 8 16 3z" fill="currentColor"/><path d="M16 9v18" stroke="#1c130e" stroke-width="1.4"/></svg>`;

const wedge = (a0, a1, r0, r1) => {
  const P = (r, a) => [(r * Math.sin((a * Math.PI) / 180)).toFixed(1), (-r * Math.cos((a * Math.PI) / 180)).toFixed(1)];
  const [x0, y0] = P(r1, a0), [x1, y1] = P(r1, a1), [x2, y2] = P(r0, a1), [x3, y3] = P(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
};
const WCOL = ["#e0a08a", "#e5b04a", "#9bb866", "#c4623a", "#a9825a", "#f0d28a"];
const wheel = (vals) => `<svg class="ia-wheel" viewBox="-112 -112 224 224" role="img" aria-label="Roue des saveurs"><circle r="106" fill="none" stroke="#efe4cc" opacity=".15"/>${vals.map((v, i) => `<path class="ia-wb" d="${wedge(i * 60 + 1.5, i * 60 + 58.5, 26, 100)}" fill="#efe4cc" opacity=".07"/>`).join("")}${vals.map((v, i) => `<path class="ia-wseg" data-note="${i}" d="${wedge(i * 60 + 1.5, i * 60 + 58.5, 26, 26 + (v / 5) * 74)}" fill="${WCOL[i]}"/>`).join("")}<circle r="24" fill="#1c130e" stroke="#c9783f" stroke-width="1.5"/><path d="M0-12c9 5 10 14 0 24-10-10-9-19 0-24z" fill="#9bb866"/></svg>`;

const LAND = ["M470 140 500 110 540 85 620 68 740 62 860 78 935 112 905 150 872 166 842 200 800 214 772 198 742 188 722 214 692 190 652 186 622 170 582 152 530 146 490 152Z", "M468 192 496 160 538 152 578 158 616 190 646 214 622 250 604 282 588 330 556 362 526 352 514 300 498 252 468 232Z", "M70 100 150 66 250 72 304 108 284 152 252 190 214 186 200 162 150 152 100 140Z", "M258 218 322 228 344 282 322 342 292 404 272 384 262 300Z", "M798 298 880 292 904 338 852 366 806 340Z", "M200 52 250 40 292 56 262 80 224 78Z"];
const worldMap = (cls = "") => `<svg class="ia-world ${cls}" viewBox="0 0 1000 440" role="group" aria-label="Carte des origines">
  <g class="ia-land">${LAND.map((d) => `<path d="${d}"/>`).join("")}</g>
  <g class="ia-lat"><line x1="0" y1="250" x2="1000" y2="250"/><line x1="0" y1="190" x2="1000" y2="190"/><line x1="0" y1="310" x2="1000" y2="310"/></g>
  ${Object.entries(ORIGINS).map(([k, o]) => { const [x, y] = mapXY(o.lon, o.lat); return `<g class="ia-pin" data-o="${k}" transform="translate(${x} ${y})"><circle class="ia-pulse" r="7"/><circle class="ia-dot" r="5"/><title>${o.n}, ${o.p} — ${o.alt} m</title></g>`; }).join("")}
</svg>`;

const gauge = (alt) => `<svg class="ia-gauge" viewBox="0 0 220 56" role="img" aria-label="Altitude : ${alt} mètres sur 2 500"><path d="M0 52 40 34 70 40 110 14 150 30 190 8 220 24V56H0Z" fill="#efe4cc" opacity=".12"/><path d="M0 52 40 34 70 40 110 14 150 30 190 8 220 24" fill="none" stroke="#c9783f" stroke-width="1.4"/><line x1="${(alt / 2500) * 220}" y1="2" x2="${(alt / 2500) * 220}" y2="56" stroke="#9bb866" stroke-width="2"/><circle cx="${(alt / 2500) * 220}" cy="${Math.max(6, 50 - (alt / 2500) * 44)}" r="4" fill="#9bb866"/></svg>`;

const hero = () => `<svg class="ia-heroart" viewBox="0 0 600 640" aria-hidden="true">
<circle cx="290" cy="320" r="280" fill="#c9783f" opacity=".14"/>
<g class="ia-leafA"><path d="M250 30C395 60 520 190 470 360 390 425 250 400 188 300 140 215 160 90 250 30Z" fill="#587a32"/><path d="M250 30C395 60 520 190 470 360 380 300 300 160 250 30Z" fill="#8fb05a" opacity=".55"/><path d="M250 40C300 160 360 260 440 380M236 100l-50 40M262 140l-66 52M292 180l-80 62M322 216l-92 62M352 258l-74 40M286 120l76-20M316 160l82-24M346 200l86-28M378 246l60-14" stroke="#d6e6a8" opacity=".5" stroke-width="2" fill="none"/></g>
<g class="ia-leafB"><path d="M470 150c60 20 78 90 54 160-48 6-96-24-104-80 4-40 20-64 50-80z" fill="#4f6b2c"/><path d="M480 160c10 50 20 90 34 140" stroke="#cfe0a0" opacity=".45" stroke-width="2" fill="none"/></g>
<path d="M120 90c40 30 54 76 24 130-44-16-66-60-52-100 6-14 14-24 28-30z" fill="#7da248"/>
<g transform="translate(150 470) rotate(-32)"><ellipse rx="120" ry="160" fill="#47291a"/><ellipse cx="-34" cy="-40" rx="60" ry="92" fill="#8a5a3a" opacity=".35"/><path d="M-10-150C50-90-50-30 0 30S40 110 6 156" fill="none" stroke="#150a05" stroke-width="12" stroke-linecap="round"/><path d="M-70-110C-90-30-84 40-62 100" fill="none" stroke="#fff" opacity=".14" stroke-width="10" stroke-linecap="round"/></g>
<g transform="translate(60 590) rotate(20)"><ellipse rx="34" ry="46" fill="#47291a"/><path d="M-2-44C14-24-12-8 2 10" fill="none" stroke="#150a05" stroke-width="4"/></g>
<g transform="translate(250 600) rotate(-70)"><ellipse rx="30" ry="42" fill="#47291a"/><path d="M-2-40C12-22-10-6 2 12" fill="none" stroke="#150a05" stroke-width="4"/></g>
<ellipse cx="410" cy="560" rx="150" ry="22" fill="#000" opacity=".35"/>
<path d="M290 470h240c0 70-40 112-120 112S290 540 290 470z" fill="#d6c8aa"/><ellipse cx="410" cy="470" rx="120" ry="26" fill="#efe4cc"/><ellipse cx="410" cy="472" rx="104" ry="19" fill="#5a2e17"/><ellipse cx="410" cy="470" rx="104" ry="19" fill="none" stroke="#c9783f" stroke-width="2"/><path d="M528 486c44-6 48 44 4 52" fill="none" stroke="#efe4cc" stroke-width="10" stroke-linecap="round"/>
<g class="ia-steams" fill="none" stroke="#efe4cc" stroke-linecap="round"><path class="ia-st s1" d="M380 440c-30-40 30-70-4-110s26-70-6-110" stroke-width="7" opacity=".5"/><path class="ia-st s2" d="M420 440c28-36-26-66 6-108s-24-68 8-106" stroke-width="6" opacity=".4"/><path class="ia-st s3" d="M455 444c-22-30 22-52-2-86" stroke-width="5" opacity=".35"/></g>
</svg>`;

/* ---------- en-tête / pied ---------- */
const CATS = [["the-vert", "Thés verts"], ["the-noir", "Thés noirs"], ["oolong", "Oolongs"], ["infusion", "Infusions"], ["cafe", "Cafés"]];
const header = (c) => {
  const m = c.menu.filter((x) => x.url !== "/");
  const L = m.slice(0, 3), R = m.slice(3, 5);
  return `<header class="ia-head pk-bleed"><div class="ia-bar">
  <div class="ia-nav ia-nav--l" role="navigation" aria-label="Navigation principale">${nav(L)}</div>
  <a class="ia-logo" href="/" aria-label="${esc(c.brand)} — accueil">${leafMark}<span>Infusion</span><small>Thés &amp; cafés d'origine</small></a>
  <div class="ia-nav ia-nav--r" role="navigation" aria-label="Navigation secondaire">${nav(R)}<a href="/contact">Contact</a><a class="ia-cartlink" href="#panier" data-cart-open aria-label="Ouvrir le panier de démonstration"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.4 11H6.4zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>Panier</span><b data-cart-count>0</b></a></div>
  <a class="ia-cartlink ia-cartlink--m" href="#panier" data-cart-open aria-label="Ouvrir le panier de démonstration"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.4 11H6.4zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><b data-cart-count>0</b></a>
  <details class="ia-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="ia-drawer" role="navigation" aria-label="Menu mobile">${nav(m.map((x) => x))}<p>Catégories</p>${CATS.map(([k, l]) => `<a href="/boutique#${k}">${l}</a>`).join("")}</div></details></div>
  <div class="ia-cats" role="navigation" aria-label="Catégories">${CATS.map(([k, l]) => `<a href="/boutique#${k}">${l}</a>`).join("")}<a href="/coffrets">Coffrets</a></div></header>`;
};
const footer = (c) => `<footer class="ia-foot pk-bleed"><div class="ia-wrap"><div class="ia-foot-grid">
  <div><a class="ia-logo ia-logo--f" href="/">${leafMark}<span>Infusion</span></a><p class="ia-fl">Des feuilles et des grains choisis à la source, racontés avec leur altitude, leur récolte et leur façon d'être préparés.</p></div>
  <div><h3>La boutique</h3>${CATS.map(([k, l]) => `<a href="/boutique#${k}">${l}</a>`).join("")}</div>
  <div><h3>Apprendre</h3><a href="/origines">Origines</a><a href="/rituels">Rituels d'infusion</a><a href="/histoire">Notre histoire</a><a href="/coffrets">Coffrets</a></div>
  <div><h3>Nous écrire</h3><a href="/contact">Contact</a><a href="/recherche">Recherche</a><address>12 rue des Écorces<br>69002 Lyon</address></div></div>
  <p class="ia-legal">© Infusion — site de démonstration : boutique fictive, produits, prix et jardins imaginaires. Aucune commande ni aucun paiement n'est possible.</p></div></footer>`;
const ph = (kicker, title, sub) => sec(`<section class="ia-ph pk-bleed"><div class="ia-wrap"><p class="ia-kicker" data-reveal>${esc(kicker)}</p><div class="ia-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="ia-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);
const wave = `<svg class="ia-wave" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V18c120 14 240 18 360 8s240-26 360-22 240 22 360 24 240-8 360-18v30z" fill="currentColor"/></svg>`;

const originCard = (k) => { const o = ORIGINS[k]; return `<article class="ia-ocard" data-reveal><p class="ia-orig">${o.t}</p><h3>${o.n}</h3><p class="ia-country">${o.p}</p>${gauge(o.alt)}<dl><div><dt>Altitude</dt><dd>${o.alt} m</dd></div><div><dt>Récolte</dt><dd>${o.rec}</dd></div></dl><a class="ia-more" href="/origines">Voir la carte ${arr}</a></article>`; };

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="ia-hero pk-bleed"><div class="ia-wrap ia-hero-in"><div class="ia-hero-copy"><p class="ia-kicker" data-reveal>Thés et cafés d'origine · sélection de démonstration</p>
   <div class="ia-mega" role="heading" aria-level="1" data-reveal>Chaque tasse a <em>une altitude.</em></div>
   <p class="ia-lead" data-reveal>Des feuilles roulées à la main sur les pentes brumeuses, des grains lavés sur les hauts plateaux : nous racontons d'où vient ce que vous buvez, et comment le préparer.</p>
   <div class="ia-actions" data-reveal><a class="ia-btn" href="/boutique">Entrer dans la boutique ${arr}</a><a class="ia-btn ia-btn--line" href="/origines">Explorer les origines</a></div>
   <ul class="ia-hero-facts" data-reveal><li><b>7</b><span>terroirs documentés</span></li><li><b>150–1 900 m</b><span>d'altitude de culture</span></li><li><b>12</b><span>références en démonstration</span></li></ul></div>
   <div class="ia-hero-art" data-reveal>${hero()}<p class="ia-hero-tag"><span>Fiche n° 01</span>Darjeeling, 1 900 m · récolte de printemps</p></div></div>${wave}</section>`),
  sec(`<section class="ia-cream ia-sel pk-bleed"><div class="ia-wrap"><div class="ia-sechead"><div><p class="ia-kicker ia-kicker--d" data-reveal>Cartes de provenance</p><h2 class="ia-h2" data-reveal>Trois terroirs, trois façons d'être attentif</h2></div><a class="ia-more" href="/origines" data-reveal>Toutes les origines ${arr}</a></div>
   <div class="ia-ogrid">${["darjeeling", "uji", "yirgacheffe"].map(originCard).join("")}</div></div></section>`),
  sec(`<section class="ia-shelf pk-bleed"><div class="ia-wrap"><div class="ia-sechead"><div><p class="ia-kicker" data-reveal>Sélection de la saison</p><h2 class="ia-h2" data-reveal>Sur l'étagère en ce moment</h2></div><a class="ia-more" href="/boutique" data-reveal>Toute la boutique ${arr}</a></div>
   <div class="ia-grid ia-grid--4">${["darjeeling", "sencha", "alishan", "yirgacheffe"].map((id) => card(PRODUCTS.find((p) => p.id === id))).join("")}</div></div></section>`),
  sec(`<section class="ia-ritual ia-cream pk-bleed"><div class="ia-wrap ia-ritual-in"><div><p class="ia-kicker ia-kicker--d" data-reveal>Rituel</p><h2 class="ia-h2" data-reveal>Le bon geste,<br>à la seconde près.</h2><p class="ia-muted" data-reveal>Température, dose, durée : chaque famille a sa règle. Lancez le minuteur d'un Sencha et laissez la vapeur faire le reste.</p><ol class="ia-steps" data-reveal><li><b>Chauffer</b> l'eau à la bonne température</li><li><b>Doser</b> 3 g de feuilles pour 25 cl</li><li><b>Patienter</b> sans remuer, puis servir d'un trait</li></ol><a class="ia-btn ia-btn--dk" href="/rituels" data-reveal>Tous les rituels ${arr}</a></div>
   <div class="ia-timerbox" data-reveal><p class="ia-orig">Sencha d'Uji</p>${timer(120, 75, "Sencha d'Uji")}</div></div></section>`),
  sec(`<section class="ia-mapsec pk-bleed"><div class="ia-wrap"><div class="ia-sechead"><div><p class="ia-kicker" data-reveal>Carte du monde</p><h2 class="ia-h2" data-reveal>Sept points, un fil de vapeur</h2></div></div>${worldMap("ia-world--home")}<ul class="ia-legend" data-reveal>${Object.entries(ORIGINS).map(([k, o]) => `<li><a href="/origines#${k}">${o.n}<small>${o.p} · ${o.alt} m</small></a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="ia-gift ia-cream pk-bleed"><div class="ia-wrap ia-gift-in"><div><p class="ia-kicker ia-kicker--d" data-reveal>Coffrets</p><h2 class="ia-h2" data-reveal>Offrir un voyage, sans bagage</h2><p class="ia-muted" data-reveal>Découverte, altitude ou rituel complet : trois coffrets composés autour d'une histoire, avec leur carte de provenance.</p><a class="ia-btn ia-btn--dk" href="/coffrets" data-reveal>Voir les coffrets ${arr}</a></div>
   <ul class="ia-promises" data-reveal><li><b>Traçable</b><span>Altitude, récolte et façon de faire sur chaque étiquette.</span></li><li><b>Frais</b><span>Torréfaction et conditionnement à la commande (démonstration).</span></li><li><b>Expliqué</b><span>Un guide d'infusion glissé dans chaque boîte.</span></li></ul></div></section>`),
  sec(`<section class="ia-cta pk-bleed"><div class="ia-wrap"><div class="ia-cta-in"><h2 class="ia-h2" data-reveal>Une question avant de choisir ?</h2><p class="ia-muted" data-reveal>Racontez-nous vos goûts, nous vous orienterons vers un thé ou un café.</p><a class="ia-btn" href="/contact" data-reveal>Écrire à la maison ${arr}</a></div></div></section>`),
  sec(footer(c)),
];

const fil = (key, label, items) => `<div class="ia-fg" data-fgroup="${key}"><p class="ia-fh">${label}</p><div class="ia-chips">${items.map(([v, l]) => `<a href="#f-${key}-${v || "tous"}" class="ia-chip" data-f="${key}" data-v="${v || "all"}" role="button" aria-pressed="${v === "" ? "true" : "false"}">${l}</a>`).join("")}</div></div>`;
const boutique = (c) => [sec(header(c)), ph("La boutique", "Thés, infusions<br>et cafés", "Filtrez par famille, origine, force, caractère bio ou budget. Boutique fictive : le panier est une démonstration."),
  sec(`<section class="ia-shop pk-bleed"><div class="ia-wrap ia-shop-in"><aside class="ia-filters" aria-label="Filtres de la boutique"><details class="ia-fil-d" open><summary>Filtres <span data-fcount-badge></span></summary>
   ${fil("type", "Famille", [["", "Toutes"], ...Object.entries(TYPES)])}${fil("origin", "Origine", [["", "Toutes"], ...Object.entries(ORIGINS).map(([k, o]) => [k, o.n])])}${fil("force", "Force", [["", "Toutes"], ["douce", "Douce 1–2"], ["moyenne", "Moyenne 3"], ["forte", "Corsée 4–5"]])}${fil("bio", "Culture", [["", "Toutes"], ["1", "Bio uniquement"]])}${fil("price", "Prix", [["", "Tous"], ["low", "Moins de 13 €"], ["mid", "13 à 18 €"], ["high", "Plus de 18 €"]])}
   <a class="ia-reset" href="#reset" data-reset>Réinitialiser les filtres</a></details></aside>
   <div class="ia-results"><p class="ia-count" role="status" aria-live="polite" data-count>12 références</p><div class="ia-grid ia-grid--3" data-shopgrid>${PRODUCTS.map(card).join("")}</div><p class="ia-empty" data-empty hidden>Aucune référence ne correspond à ces filtres. <a href="#reset" data-reset>Réinitialiser</a></p></div></div></section>`),
  sec(`<section class="ia-note pk-bleed"><div class="ia-wrap"><p>Démonstration : prix, stocks et produits sont fictifs. « Ajouter » remplit un panier local qui se résume en un message à envoyer via le <a href="/contact">formulaire de contact</a>.</p></div></section>`),
  sec(footer(c))];

const notes = [["Floral", 4, "Fleur de muscat : le parfum signature du premier flush, délicat et aérien."], ["Fruité", 3, "Pêche blanche et raisin frais, en finale."], ["Végétal", 3, "Feuille verte et herbe coupée, vivacité de la jeune pousse."], ["Épicé", 1, "Une pointe de poivre blanc, à peine perceptible."], ["Boisé", 2, "Écorce claire, trace de l'oxydation très courte."], ["Doux", 3, "Miel d'acacia et rondeur sucrée en fin de bouche."]];
function timer(sec_, temp, name) {
  return `<div class="ia-timer" data-timer data-sec="${sec_}" data-temp="${temp}" data-name="${esc(name)}"><div class="ia-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="#efe4cc" opacity=".18" stroke-width="5"/><circle class="ia-ringfill" cx="60" cy="60" r="54" fill="none" stroke="#c9783f" stroke-width="5" stroke-linecap="round" transform="rotate(-90 60 60)"/></svg><div class="ia-ringtxt"><b data-read>${Math.floor(sec_ / 60)}:${String(sec_ % 60).padStart(2, "0")}</b><span><i data-tempv>${temp}</i> °C</span></div></div><div class="ia-tctl" data-ctl></div><p class="ia-tstat" role="status" aria-live="polite" data-stat></p></div>`;
}
const produit = (c) => [sec(header(c)), sec(`<section class="ia-prod pk-bleed"><div class="ia-wrap ia-prod-in">
  <div class="ia-prod-vis" data-reveal><div class="ia-stage">${tin(PRODUCTS[0]).replace('class="ia-tin"', 'class="ia-tin ia-tin--xl"')}</div><div class="ia-stamp"><span>Fiche d'origine</span><b>N° 01</b></div></div>
  <div class="ia-prod-info"><p class="ia-kicker" data-reveal>Darjeeling · Inde · thé noir léger</p><div class="ia-h1" role="heading" aria-level="1" data-reveal>Darjeeling<br>premier flush</div><p class="ia-lead" data-reveal>La première cueillette du printemps, quand la plante sort de son repos d'hiver : des feuilles claires, un parfum de muscat, une tasse presque verte.</p>
  <ul class="ia-tags" data-reveal><li>Bio</li><li>Force 2 / 5</li><li>Récolte de printemps</li></ul>
  <div class="ia-buybox" data-reveal><b class="ia-price">18,90 €</b><span>pour 50 g · environ 20 tasses</span><a class="ia-add ia-add--lg" href="#ajouter" data-add="darjeeling" data-name="Darjeeling premier flush (50 g)" data-price="18.9">Ajouter au panier</a></div><p class="ia-fine" data-reveal>Fiche de démonstration : jardin et producteur imaginaires.</p></div></div>${wave}</section>`),
  sec(`<section class="ia-cream ia-facts pk-bleed"><div class="ia-wrap"><ul class="ia-tiles"><li data-reveal><span>Altitude</span><b>1 900 m</b>${gauge(1900)}</li><li data-reveal><span>Récolte</span><b>Mars–avril</b><small>Premier flush, cueillette à la main</small></li><li data-reveal><span>Climat</span><b>Brumes fraîches</b><small>Pentes à 40 %, nuits à 6 °C</small></li><li data-reveal><span>Façon de faire</span><b>Oxydation courte</b><small>Flétrissage lent, roulage léger</small></li></ul></div></section>`),
  sec(`<section class="ia-sig pk-bleed"><div class="ia-wrap ia-sig-in">
  <div class="ia-wheelbox" data-wheelbox data-reveal><p class="ia-kicker">Roue des saveurs</p><h2 class="ia-h2">Ce que dit la tasse</h2><div class="ia-wheelrow">${wheel(notes.map((n) => n[1]))}
   <ul class="ia-wlist">${notes.map(([n, v, d], i) => `<li><a href="#note-${i}" class="ia-wnote" data-note="${i}" data-desc="${esc(d)}"><i></i>${n}<small>${v}/5</small></a></li>`).join("")}</ul></div>
   <div class="ia-wdesc" data-wdesc role="status" aria-live="polite"><b>Floral</b> — ${notes[0][2]}</div></div>
  <div class="ia-tbox" data-reveal><p class="ia-kicker">Infusion</p><h2 class="ia-h2">Température et minuteur</h2><dl class="ia-recipe"><div><dt>Eau</dt><dd>85 °C</dd></div><div><dt>Temps</dt><dd>3 min</dd></div><div><dt>Dose</dt><dd>2,5 g / 25 cl</dd></div></dl>${timer(180, 85, "Darjeeling premier flush")}</div></div></section>`),
  sec(`<section class="ia-cream ia-trace pk-bleed"><div class="ia-wrap ia-trace-in"><div><p class="ia-kicker ia-kicker--d">Carte de provenance</p><h2 class="ia-h2">Du jardin à votre théière</h2>${worldMap("ia-world--mini")}</div>
   <ol class="ia-route"><li><b>Cueillette</b><span>Deux feuilles et un bourgeon, à la main, avant 10 h.</span></li><li><b>Flétrissage</b><span>12 à 16 heures sur claies, à l'air de la montagne.</span></li><li><b>Roulage et séchage</b><span>Court et doux, pour préserver le muscat.</span></li><li><b>Conditionnement</b><span>En boîte métal, à l'abri de la lumière.</span></li></ol></div></section>`),
  sec(`<section class="ia-shelf pk-bleed"><div class="ia-wrap"><div class="ia-sechead"><h2 class="ia-h2" data-reveal>À goûter ensuite</h2><a class="ia-more" href="/boutique">Toute la boutique ${arr}</a></div><div class="ia-grid ia-grid--3">${["sencha", "alishan", "dianhong"].map((id) => card(PRODUCTS.find((p) => p.id === id))).join("")}</div></div></section>`),
  sec(footer(c))];

const odetail = (k) => { const o = ORIGINS[k]; const prods = PRODUCTS.filter((p) => p.o === k); return `<article class="ia-opanel" data-opanel="${k}" ${k === "darjeeling" ? "" : "hidden"}><p class="ia-orig">${o.t}</p><h3>${o.n}, ${o.p}</h3>${gauge(o.alt)}<dl><div><dt>Altitude</dt><dd>${o.alt} m</dd></div><div><dt>Récolte</dt><dd>${o.rec}</dd></div><div><dt>Climat</dt><dd>${o.cl}</dd></div><div><dt>Façon de faire</dt><dd>${o.pr}</dd></div></dl><p class="ia-oprod">À la boutique : ${prods.map((p) => esc(p.n)).join(", ")}.</p><a class="ia-more" href="/boutique#${prods[0].t}">Voir ces références ${arr}</a></article>`; };
const origines = (c) => [sec(header(c)), ph("Terroirs", "Les origines,<br>point par point", "Choisissez un point sur la carte : altitude, récolte, climat et façon de faire."),
  sec(`<section class="ia-omap pk-bleed"><div class="ia-wrap ia-omap-in"><div class="ia-mapcol" data-omap>${worldMap("ia-world--big")}<ul class="ia-legend ia-legend--c">${Object.entries(ORIGINS).map(([k, o]) => `<li><a href="#${k}" data-o="${k}">${o.n}</a></li>`).join("")}</ul></div><div class="ia-odetail" data-odetail aria-live="polite">${Object.keys(ORIGINS).map(odetail).join("")}</div></div></section>`),
  sec(`<section class="ia-cream ia-zig pk-bleed"><div class="ia-wrap">${Object.entries(ORIGINS).map(([k, o], i) => `<article class="ia-zrow ${i % 2 ? "is-r" : ""}" data-reveal><div class="ia-zart"><span class="ia-zn">${String(i + 1).padStart(2, "0")}</span>${gauge(o.alt)}<p class="ia-zalt">${o.alt} m</p></div><div class="ia-ztxt"><p class="ia-kicker ia-kicker--d">${o.t}</p><h2 class="ia-h2">${o.n} <small>${o.p}</small></h2><p>${o.cl}. ${o.pr}.</p><p class="ia-zrec"><b>Récolte :</b> ${o.rec}</p></div></article>`).join("")}</div></section>`),
  sec(footer(c))];

const RIT = [["the-vert", "Thé vert", 75, 120, "3 g / 25 cl", "2 à 3", ["Chauffez l'eau sans la faire bouillir : 75 °C.", "Préchauffez la théière pour ne pas choquer les feuilles.", "Infusez 2 minutes, sans remuer.", "Servez d'un seul trait, tasse après tasse."]], ["the-noir", "Thé noir", 90, 210, "3 g / 25 cl", "2", ["Portez l'eau à 90 °C.", "Versez sur les feuilles, couvrez.", "Attendez 3 min 30 pour un thé léger, 4 min pour un thé corsé.", "Retirez les feuilles : l'amertume monte vite."]], ["oolong", "Oolong", 95, 180, "5 g / 15 cl", "4 à 6", ["Rincez les feuilles 10 secondes à l'eau chaude, jetez.", "Infusez une première fois 3 minutes à 95 °C.", "Les infusions suivantes ajoutent 20 secondes chacune.", "Goûtez à chaque fois : le parfum évolue."]], ["infusion", "Rooibos", 100, 360, "4 g / 25 cl", "2", ["Eau bouillante, 100 °C.", "Laissez infuser 6 minutes, voire 8 pour une tasse plus ronde.", "Aucune amertume à craindre, ni de théine.", "Se sert aussi glacé, avec un zeste d'orange."]], ["cafe", "Café filtre", 93, 240, "15 g / 25 cl", "1", ["Moulez moyen, juste avant de servir.", "Mouillez le café 30 secondes (fleurissement).", "Versez en spirale jusqu'à 4 minutes.", "Servez aussitôt dans une tasse chaude."]]];
const rituels = (c) => [sec(header(c)), ph("Rituels", "Infuser avec soin", "Une règle simple par famille. Choisissez-la, lancez le minuteur, laissez la vapeur monter."),
  sec(`<section class="ia-rit pk-bleed"><div class="ia-wrap"><div class="ia-tabs" role="tablist" aria-label="Familles">${RIT.map((r, i) => `<a href="#r-${r[0]}" role="tab" data-tab="${r[0]}" class="${i === 0 ? "is-on" : ""}">${r[1]}</a>`).join("")}</div>
   ${RIT.map((r, i) => `<div class="ia-rpanel" data-panel="${r[0]}" role="tabpanel" ${i ? "hidden" : ""}><div class="ia-rleft"><h2 class="ia-h2">${r[1]}</h2><dl class="ia-recipe"><div><dt>Eau</dt><dd>${r[2]} °C</dd></div><div><dt>Temps</dt><dd>${Math.floor(r[3] / 60)} min${r[3] % 60 ? " " + (r[3] % 60) : ""}</dd></div><div><dt>Dose</dt><dd>${r[4]}</dd></div><div><dt>Infusions</dt><dd>${r[5]}</dd></div></dl><ol class="ia-steps ia-steps--n">${r[6].map((s) => `<li>${s}</li>`).join("")}</ol></div><div class="ia-rright">${timer(r[3], r[2], r[1])}</div></div>`).join("")}</div></section>`),
  sec(`<section class="ia-cream ia-ref pk-bleed"><div class="ia-wrap"><h2 class="ia-h2" data-reveal>Repères en un coup d'œil</h2><table class="ia-table" data-reveal><caption class="ia-sr">Températures et durées d'infusion</caption><thead><tr><th>Famille</th><th>Eau</th><th>Temps</th><th>Dose</th><th>Infusions</th></tr></thead><tbody>${RIT.map((r) => `<tr><th scope="row">${r[1]}</th><td data-l="Eau">${r[2]} °C</td><td data-l="Temps">${Math.floor(r[3] / 60)} min${r[3] % 60 ? " " + (r[3] % 60) : ""}</td><td data-l="Dose">${r[4]}</td><td data-l="Infusions">${r[5]}</td></tr>`).join("")}</tbody></table>
   <ul class="ia-tips"><li data-reveal><b>Eau</b> Une eau peu calcaire révèle mieux les parfums.</li><li data-reveal><b>Théière</b> Préchauffée, elle garde la température.</li><li data-reveal><b>Feuilles</b> Conservez-les au sec, à l'abri de la lumière.</li></ul></div></section>`),
  sec(footer(c))];

const COF = [["Découverte", "Quatre thés, quatre pays", 39, ["Sencha d'Uji, 25 g", "Darjeeling premier flush, 25 g", "Oolong d'Alishan, 25 g", "Dian Hong du Yunnan, 25 g"], "decouverte"], ["Altitude", "Deux cafés et leur histoire", 34, ["Yirgacheffe lavé, 250 g", "Huila équilibré, 250 g", "Carnet de dégustation"], "altitude"], ["Rituel", "Le geste complet", 79, ["Théière en fonte émaillée", "Matcha cérémonie, 30 g", "Sencha d'Uji, 50 g", "Guide d'infusion illustré"], "rituel"]];
const box = (i) => `<svg class="ia-box" viewBox="0 0 280 200" aria-hidden="true"><path d="M30 80 140 40l110 40v90l-110 28L30 170z" fill="#3a281c"/><path d="M30 80 140 118l110-38-110-40z" fill="#4c3626"/><path d="M140 118v80M30 80l110 38" stroke="#c9783f" stroke-width="3" fill="none"/><path d="M118 52c16-26 32-26 44 0-14 6-28 6-44 0z" fill="none" stroke="#c9783f" stroke-width="3"/><rect x="80" y="${96 - i * 6}" width="38" height="46" rx="4" fill="${["#5f7d3a", "#4a3022", "#a34535"][i]}" transform="rotate(-8 99 120)"/><rect x="160" y="${100 - i * 4}" width="38" height="46" rx="4" fill="${["#8a4a26", "#7b7a3a", "#5f7d3a"][i]}" transform="rotate(8 179 120)"/></svg>`;
const coffrets = (c) => [sec(header(c)), ph("Coffrets", "Offrir<br>un voyage", "Trois coffrets composés autour d'une histoire. Chacun contient sa carte de provenance et son guide d'infusion."),
  sec(`<section class="ia-cof pk-bleed"><div class="ia-wrap">${COF.map((k, i) => `<article class="ia-corow ${i % 2 ? "is-r" : ""}" data-reveal><div class="ia-coart">${box(i)}<span class="ia-seal ia-seal--b">N° ${i + 1}</span></div><div class="ia-cotxt"><p class="ia-kicker">Coffret ${k[0]}</p><h2 class="ia-h2">${k[1]}</h2><ul class="ia-colist">${k[3].map((x) => `<li>${x}</li>`).join("")}</ul><div class="ia-buybox"><b class="ia-price">${eur(k[2])}</b><a class="ia-add ia-add--lg" href="#ajouter" data-add="coffret-${k[4]}" data-name="Coffret ${k[0]}" data-price="${k[2]}">Ajouter au panier</a></div></div></article>`).join("")}</div></section>`),
  sec(`<section class="ia-cream ia-cofq pk-bleed"><div class="ia-wrap ia-cofq-in"><h2 class="ia-h2" data-reveal>Bon à savoir</h2><div>
   <details data-reveal><summary>Peut-on ajouter un message ?</summary><p>Oui : indiquez-le dans le récapitulatif de votre panier avant de nous l'envoyer par le formulaire de contact.</p></details>
   <details data-reveal><summary>Les coffrets sont-ils personnalisables ?</summary><p>Nous composons volontiers des variantes : précisez vos goûts dans votre message.</p></details>
   <details data-reveal><summary>Comment commander ?</summary><p>Ce site est une démonstration : aucune commande réelle. Le panier génère un résumé que vous pouvez nous transmettre via la page de contact.</p></details></div></div></section>`),
  sec(footer(c))];

const histoire = (c) => [sec(header(c)), ph("Notre histoire", "Des voyages,<br>puis une étagère", "Une maison imaginaire de thés et de cafés, née de la curiosité plus que du commerce."),
  sec(`<section class="ia-story pk-bleed"><div class="ia-wrap"><blockquote class="ia-quote" data-reveal>« Une tasse, c'est un lieu qu'on boit. »<footer>— devise de la maison (fictive)</footer></blockquote></div></section>`),
  sec(`<section class="ia-cream ia-time pk-bleed"><div class="ia-wrap"><ol class="ia-tl">${[["2012", "Un carnet de voyage", "Premiers repérages dans les jardins d'altitude, notes de goût et d'altitude couchées sur un carnet."], ["2015", "La boutique", "Une petite étagère, douze références, une étiquette qui raconte l'origine."], ["2019", "Les fiches d'origine", "Chaque produit reçoit sa carte, sa roue des saveurs et sa règle d'infusion."], ["2023", "Les coffrets", "Des assortiments pensés comme des voyages, à offrir."], ["Aujourd'hui", "Le même soin", "Moins de références, mieux connues, expliquées sans jargon."]].map(([y, t, d], i) => `<li class="${i % 2 ? "is-r" : ""}" data-reveal><b>${y}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="ia-anat pk-bleed"><div class="ia-wrap ia-anat-in"><div data-reveal><p class="ia-kicker">Lire une étiquette</p><h2 class="ia-h2">Ce que dit chaque boîte</h2><p class="ia-muted">Nous n'écrivons que ce que nous pouvons expliquer. Voici l'anatomie de nos étiquettes d'origine.</p></div>
   <div class="ia-label-demo" data-reveal><div class="ia-ld"><p class="ia-orig">Darjeeling · Inde</p><h3>Premier flush</h3><p class="ia-nt">Fleur de muscat, pêche blanche</p><div class="ia-ld-r"><span>1 900 m</span><span>Mars–avril</span><span>85 °C · 3 min</span></div></div>
   <ul class="ia-callouts"><li><b>1</b> Origine : région et pays</li><li><b>2</b> Nom et récolte</li><li><b>3</b> Notes de dégustation</li><li><b>4</b> Altitude, saison, infusion</li></ul></div></div></section>`),
  sec(`<section class="ia-cream ia-vals pk-bleed"><div class="ia-wrap"><ul class="ia-valgrid">${[["Peu mais bien", "Douze références, pas plus, pour rester capable de tout expliquer."], ["Sans jargon", "Des mots simples : on dit « floral », pas « note de tête ténue »."], ["Honnêteté", "Une fiche vous dit aussi ce qui est ordinaire."]].map(([t, d]) => `<li data-reveal><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), ph("Écrire", "Parlons de vos goûts", "Une question sur un thé, un café ou un coffret ? Collez ici le récapitulatif de votre panier de démonstration si vous en avez un."),
  { type: "form", heading: "Écrire à la maison", intro: "Dites-nous ce que vous aimez boire : nous vous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), ph("Rechercher", "Un thé, un café ?", "Une origine, une note de dégustation, une page."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un thé, une origine…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ia-404 pk-bleed"><div class="ia-wrap"><p class="ia-kicker">Feuille égarée</p><div class="ia-h1" role="heading" aria-level="1">404</div><p class="ia-sub">Cette page n'existe pas ou a changé d'adresse. La tasse, elle, est toujours chaude.</p><a class="ia-btn" href="/">Retour à l'accueil ${arr}</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "infusion", name: "Infusion", version: "2.0.0", category: "gastronomie", tags: ["sombre", "chaleureux", "luxe", "naturel"], siteType: "Boutique de thés et cafés d'origine", featured: false,
  concept: "Une maison de thés et de cafés racontés par leur terroir : fiches d'origine avec carte, altitude et roue des saveurs, minuteur d'infusion et boutique filtrable au panier fictif.",
  description: "Boutique premium de thés et cafés : brun profond, vert thé et cuivre, feuilles et grains en gros plan sous la vapeur, fiches d'origine avec roue des saveurs et minuteur, boutique à filtres, panier fictif vers le contact.",
  brand: "Infusion — thés et cafés d'origine", modules: ["formulaires", "recherche"],
  dna: { header: "barre-centree-logo-au-milieu-categories-et-panier-fictif", hero: "feuille-et-grain-en-gros-plan-sous-la-vapeur", grid: "boutique-filtrable-en-etiquettes-d-origine", motion: "vapeur-qui-monte-et-minuteur-d-infusion", shapes: "etiquettes-d-origine-sceaux-cuivre-et-vagues-de-feuillage", rhythm: "alterne-sombre-et-bandes-creme-par-lots", signature: "fiche-d-origine-roue-des-saveurs-minuteur-et-panier-fictif" },
  tokens: {
    colors: { primary: "#8fb05a", secondary: "#2a1b12", accent: "#c9783f", background: "#1c130e", surface: "#2a1d15", text: "#f1e8d6", muted: "#c4b498", success: "#7fb069", warning: "#e0a63a", error: "#e0705a" },
    fonts: { heading: "font.cormorant-sc", body: "font.karla", button: "font.karla", link: "font.karla" },
    radius: { sm: 4, md: 8, lg: 18, button: 999, field: 8, card: 14 }, shadow: { card: "0 18px 40px rgba(0,0,0,.35)", button: "none" }, border: { width: 1, color: "#4a3626" },
    type: { h1: { size: 76, weight: 500, lineHeight: 1, transform: "none" }, h2: { size: 44, weight: 500, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "copper", label: "Cuivre (accent)", type: "color", default: "#c9783f" },
    { key: "leaf", label: "Vert thé", type: "color", default: "#9bb866" },
    { key: "steam", label: "Vapeur animée", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "grain", label: "Grain de papier", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Origines", "/origines"], ["Rituels", "/rituels"], ["Coffrets", "/coffrets"], ["Histoire", "/histoire"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "boutique", name: "Boutique", render: boutique }, { key: "produit", name: "Fiche d'origine", render: produit }, { key: "origines", name: "Origines", render: origines },
    { key: "rituels", name: "Rituels", render: rituels }, { key: "coffrets", name: "Coffrets", render: coffrets }, { key: "histoire", name: "Notre histoire", render: histoire },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
