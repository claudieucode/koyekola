// Convoi — entreprise de logistique et de transport. Direction artistique : tour de contrôle. Bleu pétrole, jaune ambre, blanc, gris ardoise ;
// carte de flux animée (routes, hubs, colis en mouvement), barre à deux niveaux, zones en tableau et cartes, suivi de colis et calculateur de devis.
const { sec, esc } = require("../kit");

/* ---------- illustrations ---------- */
const W = `fill="#fff" stroke="currentColor" stroke-width="3"`;
const ICO = {
  van: `<path d="M4 12h48v30H4z" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M52 18h18l16 16v8H52z" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M58 23h10l10 11H58z" fill="currentColor"/><circle cx="20" cy="44" r="7" ${W}/><circle cx="72" cy="44" r="7" ${W}/>`,
  truck: `<path d="M2 8h58v34H2z" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 8v34M26 8v34M38 8v34M50 8v34" stroke="currentColor" stroke-width="1.5" opacity=".4"/><path d="M60 18h18l16 16v8H60z" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M66 23h10l10 11H66z" fill="currentColor"/><circle cx="18" cy="46" r="7" ${W}/><circle cx="34" cy="46" r="7" ${W}/><circle cx="78" cy="46" r="7" ${W}/>`,
  plane: `<path d="M4 30 24 25 52 22 70 6h9L70 24l17 2 7 4-7 4-17 2 9 18h-9L52 38 24 35z" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 28h40" class="cv-d2" stroke="currentColor" stroke-width="2"/>`,
  ship: `<path d="M4 36h88l-12 14H18z" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><rect x="14" y="22" width="16" height="12" fill="currentColor"/><rect x="32" y="22" width="16" height="12" fill="currentColor" class="cv-f2"/><rect x="50" y="22" width="16" height="12" fill="currentColor"/><rect x="22" y="10" width="16" height="12" fill="currentColor" class="cv-f2"/><path d="M70 36V16h12v20" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5"/>`,
  pallet: `<rect x="14" y="8" width="30" height="20" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5"/><rect x="46" y="8" width="30" height="20" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5"/><rect x="30" y="-4" width="30" height="12" fill="currentColor" stroke="currentColor" stroke-width="2.5" transform="translate(0 4)"/><path d="M6 32h84v6H6zM12 38h10v8H12zM43 38h10v8H43zM74 38h10v8H74z" fill="currentColor"/>`,
  box: `<path d="M48 6 86 20v26L48 54 10 46V20z" fill="currentColor" class="cv-f1" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 20 48 32 86 20M48 32v22" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M30 14l38 12v10" stroke="#f5a623" stroke-width="5" fill="none"/>`,
};
const ico = (k, cls = "") => `<svg class="cv-ico ${cls}" viewBox="0 0 96 56" aria-hidden="true">${ICO[k]}</svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const logoMark = `<svg class="cv-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="#0b5563"/><path d="M8 28c6 0 6-16 12-16s6 16 12 16" fill="none" stroke="#f5a623" stroke-width="4" stroke-linecap="round"/><circle cx="8" cy="28" r="3" fill="#fff"/><circle cx="32" cy="28" r="3" fill="#fff"/></svg>`;

/* ---------- carte de flux ---------- */
const CITY = ["Lille", "Paris", "Strasbourg", "Nantes", "Lyon", "Bordeaux", "Marseille", "Air", "Mer"];
const HUBS = [[330, 70], [310, 140], [500, 150], [170, 190], [410, 270], [190, 330], [430, 390]];
const BIG = [0, 1, 4, 6];
const ROUTES = [
  ["M330 70 L310 140", "road"], ["M310 140 Q380 190 410 270", "road"], ["M410 270 Q440 330 430 390", "road"], ["M310 140 Q230 150 170 190", "road"],
  ["M170 190 Q160 260 190 330", "road"], ["M190 330 Q300 400 430 390", "road"], ["M310 140 Q430 110 500 150", "road"], ["M410 270 Q470 200 500 150", "road"],
  ["M310 140 Q460 30 610 50", "air"], ["M430 390 Q500 450 570 470", "sea"],
];
const mapSvg = (big) => `<div class="cv-mapbox${big ? " cv-mapbox--big" : ""}"><svg class="cv-map" viewBox="0 0 640 500" role="img" aria-label="Carte du réseau : sept hubs reliés par des routes, une liaison aérienne et une liaison maritime, avec des colis en mouvement">
  <title>Réseau de transport Convoi</title><desc>Carte schématique et fictive du réseau, de Lille à Marseille.</desc>
    <g class="cv-grid"><path d="M0 100h640M0 200h640M0 300h640M0 400h640M100 0v500M200 0v500M300 0v500M400 0v500M500 0v500M600 0v500"/></g>
  <polygon class="cv-land" points="300,30 400,45 470,100 520,150 500,230 540,330 480,400 380,420 300,440 200,400 120,330 140,230 80,170 130,110 210,90 250,50" stroke-width="2" stroke-linejoin="round"/>
  <path d="M170 150 Q250 110 330 150 T470 190M150 250 Q260 220 360 260 T500 300M200 360 Q300 330 400 350" fill="none" class="cv-cont" stroke-width="2"/>
  ${ROUTES.map(([d, k], i) => `<path class="cv-route-${k}" d="${d}" data-route="${k}" fill="none" stroke-linecap="round"/>`).join("")}
  ${HUBS.map(([x, y], i) => `<g class="cv-hubdot"><circle class="cv-ring" cx="${x}" cy="${y}" r="${BIG.includes(i) ? 9 : 6}"/><circle cx="${x}" cy="${y}" r="${BIG.includes(i) ? 8 : 5.5}" fill="#f5a623" stroke="#fff" stroke-width="2.5"/></g>`).join("")}
  <g fill="#fff" stroke="#f5a623" stroke-width="2"><circle cx="610" cy="50" r="5"/><circle cx="570" cy="470" r="5"/></g></svg>
  ${CITY.map((n, i) => `<span class="cv-lbl cv-p${i}${i > 6 ? " cv-lbl--o" : ""}">${n}</span>`).join("")}</div>`;

/* ---------- suivi : exemples ---------- */
const STEPS = ["Pris en charge", "Triage au hub", "En transit", "Hub d'arrivée", "Livré"];
const CASES = [
  { no: "CV-482913", flux: "Colis express", route: ["Lille", "Lyon", "Marseille"], pos: 2, prog: 0.55, status: "En transit", eta: "Livraison prévue demain avant 14 h", times: ["Lun. 08:12 · Lille", "Lun. 09:40 · Hub de Lille", "Lun. 21:05 · Entre Lyon et Marseille", "Prévu mar. 07:30 · Marseille", "Prévu mar. 13:00"] },
  { no: "CV-205577", flux: "Palette · groupage", route: ["Nantes", "Paris", "Strasbourg"], pos: 3, prog: 0.9, status: "Arrivé au hub", eta: "Livraison prévue aujourd'hui en fin de matinée", times: ["Dim. 16:30 · Nantes", "Dim. 18:10 · Hub de Nantes", "Dim. 23:00 · Axe Paris – Strasbourg", "Lun. 06:45 · Hub de Strasbourg", "Prévu lun. 11:30"] },
  { no: "CV-731048", flux: "Livraison urbaine", route: ["Bordeaux", "Tours", "Paris"], pos: 4, prog: 1, status: "Livré", eta: "Remis en main propre, signature enregistrée", times: ["Ven. 07:00 · Bordeaux", "Ven. 08:20 · Hub de Bordeaux", "Ven. 13:40 · En route", "Ven. 17:10 · Hub de Paris", "Ven. 18:25 · Remis"] },
];
const caseMap = (c) => `<div class="cv-cmap"><svg viewBox="0 0 640 130" aria-hidden="true"><path class="cv-rt cv-d1" d="M40 90 C160 20 220 20 320 70 S500 120 600 50" fill="none" stroke="#0b5563" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="90" r="9" fill="#fff" stroke="#0b5563" stroke-width="4"/><circle cx="320" cy="70" r="9" fill="#fff" stroke="#0b5563" stroke-width="4"/><circle cx="600" cy="50" r="9" fill="#fff" stroke="#0b5563" stroke-width="4"/><g class="cv-mk"><circle r="15" class="cv-f3"/><circle r="8" fill="#f5a623" stroke="#14212a" stroke-width="2.5"/></g></svg><span>${c.route[0]}</span><span>${c.route[1]}</span><span>${c.route[2]}</span></div>`;
const caseHtml = (c, full) => `<article class="cv-case" data-no="${c.no}" data-pos="${c.pos}" data-prog="${c.prog}">
  <header class="cv-case-h"><div><p class="cv-case-no">${c.no}</p><p class="cv-case-fl">${c.flux} · ${c.route[0]} → ${c.route[2]}</p></div><span class="cv-badge cv-badge--${c.pos === 4 ? "ok" : "go"}">${c.status}</span></header>
  <p class="cv-eta">${c.eta}</p>
  ${full ? `${caseMap(c)}<ol class="cv-steps">${STEPS.map((s, i) => `<li><b>${s}</b><span>${c.times[i]}</span></li>`).join("")}</ol>` : `<div class="cv-prog" aria-hidden="true"><i class="cv-pc cv-pc-${[10, 30, 55, 80, 100][c.pos]}"></i></div>`}
</article>`;
const tracker = (full, cls = "") => `<div class="cv-trk ${cls}" data-track><div class="cv-trk-ui"></div><div class="cv-cases">${CASES.map((c) => caseHtml(c, full)).join("")}</div></div>`;

/* ---------- en-tête, pied ---------- */
const MAIN = [["Services", "/services"], ["Suivi", "/suivi"], ["Réseau", "/reseau"], ["Secteurs", "/secteurs"]];
const UTIL = [["Engagements", "/engagements"], ["Carrières", "/carrieres"], ["Recherche", "/recherche"], ["Contact", "/contact"]];
const a = ([l, u], on) => `<a href="${u}"${on === u ? ' aria-current="page"' : ""}>${l}</a>`;
const header = (c, on) => `<header class="cv-head pk-bleed">
  <div class="cv-util"><div class="cv-util-in"><p class="cv-status"><span class="cv-dot" aria-hidden="true"></span>Réseau fluide · 98,2 % des livraisons à l'heure cette semaine</p>
    <div class="cv-util-links" role="navigation" aria-label="Liens utiles">${UTIL.map((x) => a(x, on)).join("")}</div></div></div>
  <div class="cv-bar"><a class="cv-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span>CONVOI<small>Logistique &amp; transport</small></span></a>
    <div class="cv-nav" role="navigation" aria-label="Navigation principale">${MAIN.map((x) => a(x, on)).join("")}</div>
    <a class="cv-btn cv-btn--ghost cv-hide-s" href="/suivi">Suivre un colis</a><a class="cv-btn cv-hide-s" href="/devis">Demander un devis</a>
    <details class="cv-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cv-drawer" role="navigation" aria-label="Menu mobile">${[["Accueil", "/"]].concat(MAIN, [["Devis", "/devis"]], UTIL).map((x) => a(x, on)).join("")}<a class="cv-btn" href="/devis">Demander un devis</a></div></details>
  </div></header>`;
const footer = (c) => `<footer class="cv-foot pk-bleed"><div class="cv-foot-in">
  <div class="cv-foot-brand"><a class="cv-logo cv-logo--w" href="/" aria-label="Accueil">${logoMark}<span>CONVOI<small>Logistique &amp; transport</small></span></a><p>Des flux qui avancent, de la collecte à la livraison.<br>12 quai des Flux, 69002 Lyon (adresse fictive)</p></div>
  <div><h3>Offre</h3><a href="/services">Services</a><a href="/secteurs">Secteurs</a><a href="/devis">Devis</a><a href="/suivi">Suivi de colis</a></div>
  <div><h3>Entreprise</h3><a href="/reseau">Réseau &amp; agences</a><a href="/engagements">Engagements</a><a href="/carrieres">Carrières</a></div>
  <div><h3>Aide</h3><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="mailto:bonjour@convoi.example">bonjour@convoi.example</a></div></div>
  <p class="cv-legal">© Convoi Logistique — site de démonstration. Entreprise, numéros de suivi, tarifs et chiffres fictifs.</p></footer>`;
const ph = (kicker, title, sub, art = "") => sec(`<section class="cv-ph pk-bleed"><div class="cv-ph-in"><div><p class="cv-kicker" data-reveal>${esc(kicker)}</p><div class="cv-h1" role="heading" aria-level="1" data-reveal>${title}</div><p class="cv-sub" data-reveal>${sub}</p></div>${art ? `<div class="cv-ph-art" aria-hidden="true">${art}</div>` : ""}</div></section>`);
const band = (title, text, label = "Demander un devis", url = "/devis") => sec(`<section class="cv-band pk-bleed"><div class="cv-wrap cv-band-in"><div><h2 class="cv-h2" data-reveal>${title}</h2><p data-reveal>${text}</p></div><a class="cv-btn cv-btn--dark cv-btn--lg" href="${url}" data-reveal>${label} ${arrow}</a></div></section>`);
const head2 = (kicker, title, extra = "") => `<div class="cv-sechead"><div><p class="cv-kicker" data-reveal>${kicker}</p><h2 class="cv-h2" data-reveal>${title}</h2></div>${extra}</div>`;

/* ---------- données ---------- */
const SERVICES = [
  ["van", "Messagerie express", "Colis jusqu'à 30 kg collectés le soir, livrés le lendemain avant 13 h.", "J+1", "30 kg", "route", "Remise contre signature"],
  ["pallet", "Palette et groupage", "De 1 à 33 palettes, avec quai ou hayon. Livraison sur rendez-vous.", "J+1 à J+2", "1 000 kg / palette", "route", "Rendez-vous de livraison"],
  ["truck", "Affrètement camion complet", "Un véhicule dédié, départ sous 4 heures, 24 tonnes de charge utile.", "Sous 4 h", "24 t", "route", "Suivi GPS en continu"],
  ["plane", "Fret aérien express", "Pour les envois urgents : prise en charge, vol et livraison coordonnés.", "J+1", "500 kg", "air", "Suivi par étape de vol"],
  ["ship", "Fret maritime conteneur", "Conteneurs 20 et 40 pieds au départ de Marseille, dédouanement inclus.", "8 à 14 jours", "26 t / conteneur", "mer", "Suivi par jalon portuaire"],
  ["box", "Livraison urbaine", "Dernier kilomètre en véhicule électrique ou vélo-cargo, créneau d'une heure.", "Même jour", "60 kg", "urbain", "Créneau d'une heure"],
];
const serviceCard = (s, wide) => `<article class="cv-svc${wide ? " cv-svc--row" : ""}" data-cat="${s[5]}" data-reveal>${ico(s[0])}<div class="cv-svc-b"><h3>${s[1]}</h3><p>${s[2]}</p><ul class="cv-chips"><li>${s[3]}</li><li>${s[4]}</li><li>${s[6]}</li></ul></div><a class="cv-more" href="/devis" aria-label="Estimer : ${esc(s[1])}">Estimer ${arrow}</a></article>`;
const ZONES = [["Locale", "Lyon – Villeurbanne", "moins de 100 km", "J+0", "Même jour", "Créneau 1 h"], ["Régionale", "Lyon – Grenoble", "100 à 400 km", "J+1", "Avant 10 h", "Étapes SMS"], ["Nationale", "Lille – Marseille", "400 à 1 000 km", "J+1 à J+2", "Avant 13 h J+1", "Suivi complet"], ["Europe", "Lyon – Milan", "1 000 à 2 500 km", "J+2 à J+4", "J+2", "Douane incluse"], ["Internationale", "Marseille – Casablanca", "plus de 2 500 km", "J+5 et plus", "Aérien J+2", "Jalons par étape"]];
const zonesTable = () => `<table class="cv-table" data-reveal><caption class="cv-sr">Zones de livraison et délais indicatifs</caption><thead><tr><th>Zone</th><th>Exemple</th><th>Distance</th><th>Délai standard</th><th>Express</th><th>Suivi</th></tr></thead><tbody>${ZONES.map((z) => `<tr><th scope="row">${z[0]}</th>${z.slice(1).map((v, i) => `<td data-l="${["Exemple", "Distance", "Standard", "Express", "Suivi"][i]}">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const HUBDATA = [["Lille", "Hub Nord", "42 000", "36"], ["Paris", "Hub Île-de-France", "88 000", "64"], ["Lyon", "Hub Centre-Est", "61 000", "48"], ["Marseille", "Hub Sud · port", "47 000", "40"], ["Strasbourg", "Plateforme Est", "21 000", "18"], ["Nantes", "Plateforme Ouest", "24 000", "20"], ["Bordeaux", "Plateforme Sud-Ouest", "26 000", "22"]];

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c, "/")),
  sec(`<section class="cv-hero pk-bleed"><div class="cv-hero-in">
    <div class="cv-hero-copy"><p class="cv-kicker cv-kicker--l" data-reveal><span class="cv-dot" aria-hidden="true"></span>Tour de contrôle · 12 480 colis en transit</p>
      <div class="cv-mega" role="heading" aria-level="1" data-reveal>Chaque colis a sa route. <em>Nous la gardons fluide.</em></div>
      <p class="cv-lead" data-reveal>Messagerie, palettes, camions complets, air et mer : un seul réseau de sept hubs, un suivi lisible à chaque étape et des devis en deux minutes.</p>
      <div class="cv-actions" data-reveal><a class="cv-btn cv-btn--lg" href="/devis">Estimer un envoi ${arrow}</a><a class="cv-btn cv-btn--line cv-btn--lg" href="/reseau">Voir le réseau</a></div>
      <div class="cv-minitrk" data-reveal><p class="cv-minitrk-t">Suivre un colis</p>${tracker(false, "cv-trk--mini")}</div></div>
    <div class="cv-hero-map" data-reveal>${mapSvg(false)}<ul class="cv-legend" aria-label="Légende de la carte"><li><i class="cv-k cv-k-hub"></i>Hub</li><li><i class="cv-k cv-k-road"></i>Route</li><li><i class="cv-k cv-k-air"></i>Air</li><li><i class="cv-k cv-k-sea"></i>Mer</li><li><i class="cv-k cv-k-pkg"></i>Colis</li></ul></div></div></section>`),
  sec(`<section class="cv-kpis pk-bleed"><ul class="cv-kpis-in"><li data-reveal><b data-count="98.2" data-dec="1" data-suffix=" %">98,2 %</b><span>livraisons à l'heure</span></li><li data-reveal><b data-count="7">7</b><span>hubs et plateformes</span></li><li data-reveal><b data-count="320" data-suffix="k">320k</b><span>colis par semaine</span></li><li data-reveal><b data-count="45">45</b><span>agences de proximité</span></li></ul></section>`),
  sec(`<section class="cv-sect pk-bleed"><div class="cv-wrap">${head2("Nos flux", "Six façons de faire avancer vos envois", '<a class="cv-more" href="/services">Tous les services ' + arrow + "</a>")}
    <div class="cv-svc-grid">${SERVICES.map((s) => serviceCard(s)).join("")}</div></div></section>`),
  sec(`<section class="cv-sect cv-sect--tint pk-bleed"><div class="cv-wrap">${head2("Zones et délais", "Une grille simple, du quartier à l'international")}${zonesTable()}<p class="cv-note" data-reveal>Délais indicatifs de démonstration, hors cas particuliers (marchandises dangereuses, îles, zones de montagne).</p></div></section>`),
  sec(`<section class="cv-sect pk-bleed"><div class="cv-wrap">${head2("Le parcours", "Quatre étapes, aucune zone d'ombre")}
    <ol class="cv-flow" data-reveal><li><span class="cv-n">1</span><h3>Collecte</h3><p>Enlèvement chez vous, à l'heure convenue, avec scan à la prise en charge.</p></li><li><span class="cv-n">2</span><h3>Hub d'entrée</h3><p>Triage automatisé, contrôle des poids et des volumes, affectation à la bonne route.</p></li><li><span class="cv-n">3</span><h3>Transport</h3><p>Route, air ou mer selon le délai : le suivi se met à jour à chaque jalon.</p></li><li><span class="cv-n">4</span><h3>Livraison</h3><p>Créneau annoncé, remise contre signature et preuve de livraison disponible.</p></li></ol>
    <div class="cv-lane" aria-hidden="true"><i></i><span class="cv-roll">${ico("truck")}</span></div></div></section>`),
  sec(`<section class="cv-sect cv-sect--dark pk-bleed"><div class="cv-wrap">${head2("Les hubs", "Sept points de passage, un rythme continu", '<a class="cv-more cv-more--l" href="/reseau">Réseau &amp; agences ' + arrow + "</a>")}
    <ul class="cv-hubs">${HUBDATA.map((h) => `<li class="cv-hub" data-reveal><b>${h[0]}</b><span>${h[1]}</span><dl><div><dt>colis / jour</dt><dd>${h[2]}</dd></div><div><dt>quais</dt><dd>${h[3]}</dd></div></dl></li>`).join("")}</ul></div></section>`),
  band("Un devis en deux minutes.", "Décrivez votre envoi, obtenez une estimation indicative et envoyez-la à notre équipe."),
  sec(footer(c)),
];

const services = (c) => [
  sec(header(c, "/services")),
  ph("Nos services", "Du colis de 2 kg<br>au convoi de 24 t.", "Six services complémentaires, combinables sur un même trajet : nous choisissons le mode le plus juste pour votre délai.",
    `<svg viewBox="0 0 480 280"><path d="M20 230H460" class="cv-d1 cv-w35" stroke-width="4" stroke-linecap="round"/><g class="cv-cy1" transform="translate(30 150) scale(2.1)">${ICO.truck}</g><g class="cv-cw" transform="translate(240 20) scale(1.6)">${ICO.plane}</g><g class="cv-cc" transform="translate(240 120) scale(1.7)">${ICO.ship}</g></svg>`),
  sec(`<section class="cv-sect pk-bleed" data-fscope><div class="cv-wrap">${head2("Catalogue", "Choisissez un mode", `<div class="cv-tabs" role="group" aria-label="Filtrer par mode"><a href="#tous" class="is-on" data-filter="*">Tous</a><a href="#route" data-filter="route">Route</a><a href="#air" data-filter="air">Air</a><a href="#mer" data-filter="mer">Mer</a><a href="#urbain" data-filter="urbain">Urbain</a></div>`)}
    <div class="cv-svc-list">${SERVICES.map((s) => serviceCard(s, true)).join("")}</div></div></section>`),
  sec(`<section class="cv-sect cv-sect--tint pk-bleed"><div class="cv-wrap">${head2("Comparer", "Quel service pour quel besoin ?")}
    <table class="cv-table cv-table--cmp" data-reveal><caption class="cv-sr">Comparatif des services</caption><thead><tr><th>Service</th><th>Charge max</th><th>Délai type</th><th>Suivi</th><th>Idéal pour</th></tr></thead><tbody>${SERVICES.map((s, i) => `<tr><th scope="row">${s[1]}</th><td data-l="Charge max">${s[4]}</td><td data-l="Délai type">${s[3]}</td><td data-l="Suivi">${s[6]}</td><td data-l="Idéal pour">${["Petits envois urgents", "Stocks et réassorts", "Gros volumes, chantiers", "Pièces critiques", "Import – export", "Commerce et e-commerce local"][i]}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="cv-sect pk-bleed"><div class="cv-wrap">${head2("Options", "Ajoutez ce qu'il vous faut")}<ul class="cv-opts">${[["Assurance marchandises", "Valeur déclarée couverte de bout en bout."], ["Température dirigée", "Chaîne du froid de 2 à 8 °C, enregistrée."], ["Marchandises dangereuses", "Transport ADR par équipes habilitées."], ["Livraison sur rendez-vous", "Créneau confirmé avec le destinataire."]].map((o, i) => `<li data-reveal><span class="cv-n">${i + 1}</span><h3>${o[0]}</h3><p>${o[1]}</p></li>`).join("")}</ul>
    <div class="cv-faq">${[["Peut-on mélanger plusieurs modes sur un envoi ?", "Oui. Un envoi peut partir par la route, prendre l'avion sur le tronçon long puis finir en livraison urbaine. Le suivi reste unique."], ["Comment sont calculés les poids ?", "Nous retenons le plus élevé entre le poids réel et le poids volumétrique, selon un coefficient propre à chaque mode."], ["Les tarifs affichés sont-ils fermes ?", "Non : les estimations du site sont indicatives (démonstration). Un devis ferme est établi par l'équipe commerciale."]].map((f) => `<details data-reveal><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join("")}</div></div></section>`),
  band("Besoin d'un mode sur mesure ?", "Tournées régulières, flux dédiés, plateformes de stockage : parlons de votre schéma logistique.", "Parler à un conseiller", "/contact"),
  sec(footer(c)),
];

const suivi = (c) => [
  sec(header(c, "/suivi")),
  sec(`<section class="cv-trkpage pk-bleed"><div class="cv-wrap"><p class="cv-kicker cv-kicker--l" data-reveal>Suivi de colis</p><div class="cv-h1 cv-h1--s" role="heading" aria-level="1" data-reveal>Où est mon colis ?</div><p class="cv-sub cv-sub--l" data-reveal>Saisissez un numéro de suivi, ou essayez l'un des trois numéros de démonstration proposés : aucun envoi réel n'est interrogé.</p>
    ${tracker(true, "cv-trk--full")}</div></section>`),
  sec(`<section class="cv-sect pk-bleed"><div class="cv-wrap">${head2("Lire le suivi", "Cinq statuts, un seul vocabulaire")}
    <dl class="cv-defs">${[["Pris en charge", "Le colis est scanné chez vous ou en agence."], ["Triage au hub", "Il est pesé, contrôlé et affecté à sa route."], ["En transit", "Il roule, vole ou navigue vers son hub d'arrivée."], ["Hub d'arrivée", "Il est déchargé et prépare sa tournée finale."], ["Livré", "Remis au destinataire, avec preuve de livraison."]].map((d, i) => `<div data-reveal><dt><span class="cv-n">${i + 1}</span>${d[0]}</dt><dd>${d[1]}</dd></div>`).join("")}</dl></div></section>`),
  band("Un problème avec un envoi ?", "Notre équipe exploitation répond du lundi au samedi. Indiquez le numéro de suivi dans votre message.", "Contacter l'exploitation", "/contact"),
  sec(footer(c)),
];

const devis = (c) => [
  sec(header(c, "/devis")),
  sec(`<section class="cv-qpage pk-bleed"><div class="cv-wrap"><div class="cv-qhead"><div><p class="cv-kicker" data-reveal>Devis en ligne</p><div class="cv-h1 cv-h1--d" role="heading" aria-level="1" data-reveal>Estimez votre envoi en 2 minutes.</div></div>
    <ol class="cv-qsteps" data-reveal><li><span class="cv-n">1</span>Décrire</li><li><span class="cv-n">2</span>Estimer</li><li><span class="cv-n">3</span>Envoyer</li></ol></div>
    <div class="cv-quote" data-quote><div class="cv-q-ui"><p class="cv-note">Le calculateur s'affiche avec JavaScript. Sans lui, décrivez votre envoi dans le <a href="/contact">formulaire de contact</a> : type de flux, poids, volume, zone et délai souhaité.</p></div></div></div></section>`),
  sec(`<section class="cv-sect cv-sect--tint pk-bleed"><div class="cv-wrap">${head2("Comprendre l'estimation", "Ce qui fait varier le prix")}
    <dl class="cv-defs cv-defs--4">${[["Le mode", "Le fret aérien coûte plus cher au kilo que la route, mais divise le délai par trois."], ["Le poids taxable", "Nous retenons le plus élevé du poids réel et du poids volumétrique du colis."], ["La zone", "Plus la distance et le nombre de frontières augmentent, plus le prix s'élève."], ["Le délai", "Une livraison économique réduit le prix ; l'express ajoute une priorité à chaque hub."]].map((d, i) => `<div data-reveal><dt><span class="cv-n">${i + 1}</span>${d[0]}</dt><dd>${d[1]}</dd></div>`).join("")}</dl>
    <p class="cv-note" data-reveal>Estimation indicative de démonstration, sans valeur contractuelle. Un devis ferme est établi par un conseiller.</p></div></section>`),
  sec(footer(c)),
];

const reseau = (c) => [
  sec(header(c, "/reseau")),
  ph("Réseau &amp; agences", "Sept hubs,<br>quarante-cinq portes.", "Un maillage pensé pour que chaque point de France soit à moins d'une heure d'une agence Convoi."),
  sec(`<section class="cv-netmap pk-bleed"><div class="cv-wrap cv-netmap-in"><div class="cv-netmap-map" data-reveal>${mapSvg(true)}</div>
    <aside class="cv-netside" data-reveal><h2 class="cv-h3">Les liaisons</h2><ul class="cv-links"><li><i class="cv-k cv-k-road"></i><b>Routes</b><span>8 liaisons inter-hubs, départs toutes les 2 heures</span></li><li><i class="cv-k cv-k-air"></i><b>Air</b><span>Paris – Europe, 2 vols quotidiens</span></li><li><i class="cv-k cv-k-sea"></i><b>Mer</b><span>Marseille – Maghreb, 3 départs par semaine</span></li></ul><a class="cv-btn cv-btn--block" href="/devis">Estimer un envoi</a></aside></div></section>`),
  sec(`<section class="cv-sect pk-bleed" data-fscope><div class="cv-wrap">${head2("Agences", "Trouver une agence", `<div class="cv-tabs" role="group" aria-label="Filtrer par région"><a href="#toutes" class="is-on" data-filter="*">Toutes</a><a href="#nord" data-filter="nord">Nord</a><a href="#ouest" data-filter="ouest">Ouest</a><a href="#est" data-filter="est">Est</a><a href="#sud" data-filter="sud">Sud</a></div>`)}
    <table class="cv-table cv-table--ag" data-reveal><caption class="cv-sr">Agences et hubs Convoi</caption><thead><tr><th>Site</th><th>Type</th><th>Région</th><th>Horaires</th><th>Services</th></tr></thead><tbody>
    ${[["Lille", "Hub", "nord", "24 h / 24", "Tous services"], ["Amiens", "Agence", "nord", "7 h – 19 h", "Messagerie, palette"], ["Paris Gennevilliers", "Hub", "nord", "24 h / 24", "Tous services, air"], ["Nantes", "Plateforme", "ouest", "6 h – 22 h", "Messagerie, palette"], ["Rennes", "Agence", "ouest", "7 h – 19 h", "Messagerie, urbain"], ["Bordeaux", "Plateforme", "ouest", "6 h – 22 h", "Palette, camion complet"], ["Strasbourg", "Plateforme", "est", "6 h – 22 h", "Messagerie, palette"], ["Lyon", "Hub", "est", "24 h / 24", "Tous services"], ["Marseille", "Hub", "sud", "24 h / 24", "Tous services, mer"], ["Toulouse", "Agence", "sud", "7 h – 19 h", "Messagerie, urbain"]].map((r) => `<tr data-cat="${r[2]}"><th scope="row">${r[0]}</th><td data-l="Type">${r[1]}</td><td data-l="Région">${r[2][0].toUpperCase() + r[2].slice(1)}</td><td data-l="Horaires">${r[3]}</td><td data-l="Services">${r[4]}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="cv-sect cv-sect--tint pk-bleed"><div class="cv-wrap">${head2("Capacité", "Colis traités par jour et par hub")}<ul class="cv-bars">${HUBDATA.slice().sort((x, y) => +y[2].replace(" ", "") - +x[2].replace(" ", "")).map((h, i) => `<li data-reveal><span>${h[0]}</span><div class="cv-bar-t"><i class="cv-pc cv-pc-${[100, 70, 55, 50, 30, 28, 24][i]}"></i></div><b>${h[2]}</b></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const SECT = [
  ["01", "E-commerce", "Préparation, expédition et retours, avec pics de fin d'année absorbés par des renforts de tournées.", ["van", "box", "van"], ["Retours simplifiés", "Créneaux consommateur", "Pics maîtrisés"]],
  ["02", "Industrie", "Approvisionnement de lignes en flux tendu, livraison sur quai à l'heure près.", ["truck", "pallet", "truck"], ["Flux tendu", "Quais dédiés", "Pièces critiques par air"]],
  ["03", "Santé et pharmacie", "Température dirigée, traçabilité par lot et équipes formées aux bonnes pratiques de distribution.", ["van", "box", "van"], ["2 à 8 °C enregistré", "Traçabilité par lot", "Livraison sécurisée"]],
  ["04", "Agroalimentaire", "Chaîne du froid de la plateforme au magasin, tournées matinales avant l'ouverture.", ["truck", "pallet", "van"], ["Froid positif et négatif", "Tournées avant 6 h", "Relevés de température"]],
  ["05", "Événementiel", "Matériel, scénographie et bagages d'artistes livrés et récupérés à la minute.", ["truck", "box", "truck"], ["Montage et démontage", "Créneaux serrés", "Chargé et sanglé"]],
  ["06", "Chantiers et BTP", "Matériaux et équipements livrés au pied du chantier, avec hayon ou grue auxiliaire.", ["truck", "pallet", "truck"], ["Livraison chantier", "Hayon et grue", "Retour d'emballages"]],
];
const secteurs = (c) => [
  sec(header(c, "/secteurs")),
  ph("Secteurs", "Votre métier<br>a ses contraintes.", "Nous organisons le transport autour de vos exigences : température, horaires, traçabilité ou accès au chantier."),
  sec(`<section class="cv-sect pk-bleed"><div class="cv-wrap"><ol class="cv-lanes">${SECT.map((s) => `<li class="cv-laneitem" data-reveal><span class="cv-lanenum">${s[0]}</span><div class="cv-laneb"><h2 class="cv-h3">${s[1]}</h2><p>${s[2]}</p></div>
    <div class="cv-laneflow" aria-hidden="true">${s[3].map((k, i) => `<span class="cv-node">${ico(k)}</span>${i < 2 ? "<i></i>" : ""}`).join("")}</div><ul class="cv-chips cv-chips--v">${s[4].map((t) => `<li>${t}</li>`).join("")}</ul></li>`).join("")}</ol></div></section>`),
  band("Votre secteur n'est pas listé ?", "Nous construisons des schémas dédiés pour les flux atypiques. Décrivez-nous votre contrainte.", "Nous écrire", "/contact"),
  sec(footer(c)),
];

const engagements = (c) => [
  sec(header(c, "/engagements")),
  ph("Engagements", "Aller loin,<br>sans aller trop vite.", "Notre feuille de route environnementale et sociale. Les objectifs ci-dessous sont des valeurs de démonstration."),
  sec(`<section class="cv-sect pk-bleed"><div class="cv-wrap"><ul class="cv-big">${[["-30", "%", "d'émissions par colis d'ici 2030 (base 2024)"], ["60", "%", "de la flotte urbaine électrique d'ici 2028"], ["100", "%", "d'emballages recyclés ou réutilisables d'ici 2027"]].map((b) => `<li data-reveal><b data-count="${b[0]}" data-suffix=" ${b[1]}">${b[0]} ${b[1]}</b><span>${b[2]}</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="cv-sect cv-sect--tint pk-bleed"><div class="cv-wrap cv-split">
    <div>${head2("Flotte", "Une flotte qui change de carburant")}<p class="cv-note" data-reveal>Répartition cible de la flotte de collecte et de distribution en 2030, en nombre de véhicules (objectif de démonstration).</p>
    <figure class="cv-mix" data-reveal><svg viewBox="0 0 400 56" role="img" aria-label="Flotte cible 2030 : 35 % électrique, 25 % gaz, 30 % diesel dernière norme, 10 % hydrogène"><rect x="0" y="8" width="140" height="40" fill="#0b5563"/><rect x="140" y="8" width="100" height="40" fill="#5fd0e0"/><rect x="240" y="8" width="120" height="40" fill="#5a6b77"/><rect x="360" y="8" width="40" height="40" fill="#f5a623"/></svg>
    <figcaption><ul class="cv-chips cv-chips--key"><li><i class="cv-sw cv-sw1"></i>Électrique 35 %</li><li><i class="cv-sw cv-sw2"></i>Gaz 25 %</li><li><i class="cv-sw cv-sw3"></i>Diesel dernière norme 30 %</li><li><i class="cv-sw cv-sw4"></i>Hydrogène 10 %</li></ul></figcaption></figure></div>
    <div>${head2("Avancement", "Où nous en sommes")}<ul class="cv-bars cv-bars--g">${[["Collectes en véhicule électrique", 45], ["Hubs alimentés en énergie verte", 80], ["Itinéraires optimisés", 90], ["Emballages réutilisables", 35]].map((g) => `<li data-reveal><span>${g[0]}</span><div class="cv-bar-t"><i class="cv-pc cv-pc-${g[1]}"></i></div><b>${g[1]} %</b></li>`).join("")}</ul></div></div></section>`),
  sec(`<section class="cv-sect pk-bleed"><div class="cv-wrap">${head2("Feuille de route", "2026 – 2030, jalon par jalon")}<ol class="cv-road">${[["2026", "Mesure des émissions par colis et publication du premier rapport."], ["2027", "Tous les emballages recyclés ; hubs de Lyon et Lille en énergie verte."], ["2028", "60 % de la flotte urbaine électrique ; vélos-cargos dans 12 villes."], ["2030", "Réduction de 30 % des émissions par colis par rapport à 2024."]].map((r) => `<li data-reveal><span class="cv-n cv-n--y">${r[0]}</span><p>${r[1]}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="cv-sect cv-sect--dark pk-bleed"><div class="cv-wrap">${head2("Les gens d'abord", "Trois engagements sociaux")}<div class="cv-cols3">${[["Sécurité", "Objectif zéro accident : formation annuelle et pauses obligatoires pour tous les conducteurs."], ["Formation", "Chaque salarié suit au moins 20 heures de formation par an, certifiante pour les métiers du quai."], ["Équité", "Index d'égalité publié, plan d'accès des femmes aux métiers de la conduite."]].map((x) => `<article data-reveal><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join("")}</div></div></section>`),
  band("Une question sur notre démarche ?", "Notre équipe responsabilité d'entreprise répond aux clients, partenaires et candidats.", "Nous contacter", "/contact"),
  sec(footer(c)),
];

const JOBS = [
  ["Conducteur super lourd", "Lyon", "CDI", "conduite", "Tournées nationales de nuit, retour au dépôt chaque semaine.", "Permis CE et FIMO à jour, goût pour la route."],
  ["Conducteur-livreur urbain", "Paris", "CDI", "conduite", "Livraisons électriques en centre-ville, créneaux d'une heure.", "Permis B, sens du service, aisance avec les outils mobiles."],
  ["Cariste de quai", "Lille", "CDI", "exploitation", "Chargement, déchargement et contrôle des palettes au hub.", "CACES 1, 3 et 5, rigueur, travail en équipe."],
  ["Responsable de quai", "Marseille", "CDI", "exploitation", "Pilotage d'une équipe de 25 personnes, respect des délais et de la sécurité.", "Expérience du quai, management de proximité."],
  ["Affréteur", "Bordeaux", "CDI", "exploitation", "Organisation des transports spot et suivi des transporteurs partenaires.", "Première expérience en transport, réactivité."],
  ["Conseiller clientèle", "Nantes", "CDI", "support", "Réponses aux clients, suivi des litiges et relation avec les agences.", "Écoute, rigueur, aisance à l'oral et à l'écrit."],
  ["Analyste données transport", "Lyon", "CDI", "tech", "Modélisation des flux, tableaux de bord de performance et prévisions de volume.", "SQL, statistiques, sens du terrain."],
  ["Développeur applications de suivi", "Remote / Lyon", "CDI", "tech", "Évolution du suivi de colis et des applications des conducteurs.", "Développement web, API, culture produit."],
];
const carrieres = (c) => [
  sec(header(c, "/carrieres")),
  ph("Carrières", "Rejoignez<br>le mouvement.", "1 800 personnes sur la route, au quai, au bureau d'exploitation et dans les équipes techniques. Offres fictives, présentées pour la démonstration.",
    `<svg viewBox="0 0 480 280"><circle cx="240" cy="140" r="110" fill="none" class="cv-d1 cv-w25" stroke-width="3" stroke-linecap="round"/><circle cx="240" cy="140" r="64" class="cv-f4" stroke="#f5a623" stroke-width="3"/><g class="cv-cw" transform="translate(190 118) scale(.55)">${ICO.truck}</g><g class="cv-cy1" transform="translate(40 40) scale(.85)">${ICO.pallet}</g><g class="cv-cc" transform="translate(340 40) scale(.8)">${ICO.plane}</g><g class="cv-cw" transform="translate(330 196) scale(.8)">${ICO.van}</g></svg>`),
  sec(`<section class="cv-kpis cv-kpis--l pk-bleed"><ul class="cv-kpis-in"><li data-reveal><b data-count="1800">1800</b><span>collaborateurs</span></li><li data-reveal><b data-count="92" data-suffix=" %">92 %</b><span>en CDI</span></li><li data-reveal><b data-count="40" data-suffix=" h">40 h</b><span>de formation à l'arrivée</span></li><li data-reveal><b data-count="12">12</b><span>métiers de la logistique</span></li></ul></section>`),
  sec(`<section class="cv-sect pk-bleed" data-fscope><div class="cv-wrap">${head2("Offres", "Huit postes à pourvoir", `<div class="cv-tabs" role="group" aria-label="Filtrer par famille de métiers"><a href="#tous" class="is-on" data-filter="*">Tous</a><a href="#conduite" data-filter="conduite">Conduite</a><a href="#exploitation" data-filter="exploitation">Exploitation</a><a href="#support" data-filter="support">Support</a><a href="#tech" data-filter="tech">Technique</a></div>`)}
    <div class="cv-jobs">${JOBS.map((j) => `<details class="cv-job" data-cat="${j[3]}" data-reveal><summary><span class="cv-job-t">${j[0]}</span><span class="cv-job-m"><i>${j[1]}</i><i>${j[2]}</i><i>${j[3][0].toUpperCase() + j[3].slice(1)}</i></span></summary><div class="cv-job-b"><div><h3>Missions</h3><p>${j[4]}</p></div><div><h3>Profil</h3><p>${j[5]}</p></div><a class="cv-btn" href="/contact">Candidater via le contact</a></div></details>`).join("")}</div></div></section>`),
  sec(`<section class="cv-sect cv-sect--tint pk-bleed"><div class="cv-wrap">${head2("Le recrutement", "Trois étapes, trois semaines")}<ol class="cv-flow cv-flow--3">${[["Échange", "Un premier appel de 20 minutes avec le recruteur."], ["Immersion", "Une demi-journée sur un hub ou en tournée."], ["Réponse", "Un retour écrit sous cinq jours ouvrés."]].map((s, i) => `<li data-reveal><span class="cv-n">${i + 1}</span><h3>${s[0]}</h3><p>${s[1]}</p></li>`).join("")}</ol></div></section>`),
  band("Pas de poste correspondant ?", "Envoyez une candidature spontanée : nous la transmettons au bon responsable.", "Candidature spontanée", "/contact"),
  sec(footer(c)),
];

const contact = (c) => [sec(header(c, "/contact")), ph("Contact", "Parlons de<br>vos flux.", "Devis ferme, exploitation, presse ou recrutement : écrivez-nous et collez ici le résumé de votre estimation si vous en avez fait une."),
  { type: "form", heading: "Écrire à Convoi", intro: "Indiquez votre besoin (flux, poids, zone, délai) ou collez le résumé de votre estimation. Réponse sous un jour ouvré." }, sec(footer(c))];
const recherche = (c) => [sec(header(c, "/recherche")), ph("Recherche", "Une information ?", "Un service, une agence, une offre d'emploi."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cv-404 pk-bleed"><div class="cv-wrap"><p class="cv-kicker cv-kicker--l">Erreur 404</p><div class="cv-h1" role="heading" aria-level="1">Colis introuvable.</div><p class="cv-sub cv-sub--l">Cette page n'existe pas ou a été déplacée. Reprenons la bonne route.</p><div class="cv-actions"><a class="cv-btn cv-btn--lg" href="/">Retour à l'accueil</a><a class="cv-btn cv-btn--line cv-btn--lg" href="/suivi">Suivre un colis</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "convoi", name: "Convoi", version: "2.0.0", category: "services", tags: ["technique", "moderne", "geometrique"], siteType: "Entreprise de logistique et de transport", featured: false,
  concept: "Une tour de contrôle logistique : carte de flux animée, suivi de colis par étapes et calculateur de devis, en bleu pétrole et jaune ambre.",
  description: "Logistique et transport : barre à deux niveaux, carte de flux animée avec colis en mouvement, zones en tableau, suivi de colis de démonstration, devis indicatif, réseau, secteurs, engagements et carrières.",
  brand: "Convoi Logistique", modules: ["formulaires", "recherche"],
  dna: { header: "double-barre-utilitaire-et-principale", hero: "carte-de-flux-animee-routes-hubs-et-colis", grid: "zones-en-tableau-et-cartes-de-services", motion: "colis-qui-circulent-sur-les-routes-et-chiffres", shapes: "routes-pointillees-hubs-ronds-et-vehicules-trait", rhythm: "bandes-fonctionnelles-etapes-numerotees", signature: "suivi-de-colis-par-etapes-et-calculateur-de-devis" },
  tokens: {
    colors: { primary: "#0b5563", secondary: "#1f2a33", accent: "#f5a623", background: "#f1f5f6", surface: "#ffffff", text: "#14212a", muted: "#4f5f6a", success: "#1c7a4d", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.saira", body: "font.ibm-plex-sans", button: "font.saira", link: "font.ibm-plex-sans" },
    radius: { sm: 6, md: 10, lg: 16, button: 8, field: 8, card: 12 }, shadow: { card: "0 8px 24px rgba(20,33,42,.08)", button: "none" }, border: { width: 1, color: "#d3dde1" },
    type: { h1: { size: 64, weight: 700, lineHeight: 1.02, transform: "none" }, h2: { size: 38, weight: 700, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "petrol", label: "Bleu pétrole", type: "color", default: "#0b5563" },
    { key: "amber", label: "Jaune ambre", type: "color", default: "#f5a623" },
    { key: "flux", label: "Colis en mouvement sur la carte", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "util", label: "Barre utilitaire", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "coins", label: "Coins", type: "choice", default: "round", choices: [["round", "Arrondis"], ["sharp", "Francs"]] },
  ],
  menu: [["Accueil", "/"], ["Services", "/services"], ["Suivi", "/suivi"], ["Devis", "/devis"], ["Réseau", "/reseau"], ["Secteurs", "/secteurs"], ["Engagements", "/engagements"], ["Carrières", "/carrieres"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "services", name: "Services", render: services }, { key: "suivi", name: "Suivi de colis", render: suivi }, { key: "devis", name: "Devis", render: devis },
    { key: "reseau", name: "Réseau et agences", render: reseau }, { key: "secteurs", name: "Secteurs", render: secteurs }, { key: "engagements", name: "Engagements", render: engagements }, { key: "carrieres", name: "Carrières", render: carrieres },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
