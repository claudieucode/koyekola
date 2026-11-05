// Roulotte — food truck et street food. Direction artistique : une carte de ville dessinée et un camion. Fond blanc bleuté, jaune moutarde, rouge tomate, turquoise et rose ;
// navigation en onglets d'autocollants, camion SVG qui arrive sur la route, cartes de plats inclinées, tournée de la semaine sur une carte de quartiers (jours cliquables,
// camion qui se déplace, compte à rebours « prochain arrêt »), menu filtrable avec panier-récapitulatif qui renvoie vers /contact.
const { sec, esc } = require("../kit");

// ---------- Illustrations ----------
const INK = "#1b1340";
// Pièces du camion (réutilisées en grand, en mini sur la carte et en décor des en-têtes)
const truckParts = () => `<ellipse cx="190" cy="205" rx="168" ry="8" fill="${INK}" opacity=".16"/>
  <g class="rt-puff" aria-hidden="true"><circle cx="14" cy="150" r="7" fill="#fff" opacity=".8"/><circle cx="2" cy="140" r="5" fill="#fff" opacity=".6"/></g>
  <path class="rt-t-body" d="M22 62Q22 38 46 38H238V160H22Z" fill="#d62a16" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M22 134H238V160H22Z" fill="#ffc41f" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path class="rt-t-cab" d="M238 72H300Q318 72 330 94L352 126Q358 134 358 144V160H238Z" fill="#ffc41f" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M256 88H298Q307 88 313 98L328 124H256Z" fill="#19c7bb" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M262 94H292L300 112H262Z" fill="#fff" opacity=".45"/>
  <rect x="58" y="78" width="148" height="52" rx="7" fill="#fff6d6" stroke="${INK}" stroke-width="4"/>
  <rect x="58" y="112" width="148" height="18" fill="#ff86c2" stroke="${INK}" stroke-width="4"/>
  <circle cx="86" cy="100" r="9" fill="#d62a16" stroke="${INK}" stroke-width="3"/><circle cx="112" cy="102" r="7" fill="#19c7bb" stroke="${INK}" stroke-width="3"/><rect x="132" y="92" width="52" height="8" rx="4" fill="#ffc41f" stroke="${INK}" stroke-width="3"/>
  <path d="M46 60H218L224 80H40Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${46 + i * 25} 60H${58 + i * 25}L${61 + i * 25} 80H${46 + i * 25 - 2}Z" fill="${i % 2 ? "#ff86c2" : "#d62a16"}" opacity="${i % 2 ? 1 : 0.95}"/>`).join("")}
  <path d="M40 80Q52 94 64 80Q76 94 88 80Q100 94 112 80Q124 94 136 80Q148 94 160 80Q172 94 184 80Q196 94 208 80L224 80" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <rect x="88" y="14" width="96" height="26" rx="13" fill="#ff86c2" stroke="${INK}" stroke-width="4"/>
  <circle cx="106" cy="27" r="5" fill="#fff"/><circle cx="136" cy="27" r="5" fill="#ffc41f"/><circle cx="166" cy="27" r="5" fill="#fff"/>
  <rect x="204" y="26" width="18" height="14" rx="3" fill="#cfc6ff" stroke="${INK}" stroke-width="4"/>
  <rect x="354" y="138" width="10" height="14" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="16" y="140" width="8" height="14" rx="2" fill="#d62a16" stroke="${INK}" stroke-width="3"/>
  <g class="rt-wheel" aria-hidden="true"><circle cx="96" cy="168" r="27" fill="${INK}"/><circle cx="96" cy="168" r="12" fill="#ffc41f" stroke="#fff" stroke-width="3"/><path d="M96 144V192M72 168H120M79 151L113 185M113 151L79 185" stroke="#fff" stroke-width="2.5" opacity=".7"/></g>
  <g class="rt-wheel" aria-hidden="true"><circle cx="292" cy="168" r="27" fill="${INK}"/><circle cx="292" cy="168" r="12" fill="#ffc41f" stroke="#fff" stroke-width="3"/><path d="M292 144V192M268 168H316M275 151L309 185M309 151L275 185" stroke="#fff" stroke-width="2.5" opacity=".7"/></g>`;
const truck = (cls = "") => `<svg class="rt-truck ${cls}" viewBox="-10 8 392 208" role="img" aria-label="Le camion Roulotte, dessiné">${truckParts()}</svg>`;
const truckMini = `<svg class="rt-mini" viewBox="-10 8 392 208" aria-hidden="true">${truckParts().replace(/class="rt-wheel"/g, 'class="rt-wheel rt-wheel--s"')}</svg>`;

const DISH = {
  burger: `<path d="M12 36Q12 10 40 10T68 36Z" fill="#f0a13a" stroke="${INK}" stroke-width="3"/><circle cx="30" cy="22" r="2" fill="#fff6d6"/><circle cx="44" cy="17" r="2" fill="#fff6d6"/><circle cx="53" cy="26" r="2" fill="#fff6d6"/><path d="M8 38Q16 32 24 38T40 38T56 38T72 38V44H8Z" fill="#43c15a" stroke="${INK}" stroke-width="3"/><rect x="10" y="44" width="60" height="9" rx="4" fill="#7a3f1b" stroke="${INK}" stroke-width="3"/><path d="M14 53H66L58 61H22Z" fill="#ffc41f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M12 62H68Q68 72 58 72H22Q12 72 12 62Z" fill="#f0a13a" stroke="${INK}" stroke-width="3"/>`,
  taco: `<path d="M6 58Q6 12 40 12T74 58Z" fill="#ffd45a" stroke="${INK}" stroke-width="3"/><circle cx="26" cy="22" r="7" fill="#43c15a" stroke="${INK}" stroke-width="3"/><circle cx="42" cy="17" r="7" fill="#d62a16" stroke="${INK}" stroke-width="3"/><circle cx="57" cy="24" r="6" fill="#ffc41f" stroke="${INK}" stroke-width="3"/><path d="M14 58Q22 42 40 42T66 58" fill="none" stroke="${INK}" stroke-width="3"/>`,
  fries: `<path d="M20 34H60L56 70H24Z" fill="#d62a16" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="8" width="7" height="30" rx="2" fill="#ffc41f" stroke="${INK}" stroke-width="2.5"/><rect x="33" y="4" width="7" height="34" rx="2" fill="#ffd45a" stroke="${INK}" stroke-width="2.5"/><rect x="42" y="10" width="7" height="28" rx="2" fill="#ffc41f" stroke="${INK}" stroke-width="2.5"/><rect x="50" y="6" width="7" height="32" rx="2" fill="#ffd45a" stroke="${INK}" stroke-width="2.5"/><path d="M30 46H50" stroke="#fff" stroke-width="4"/>`,
  bowl: `<path d="M6 34H74Q74 68 40 68T6 34Z" fill="#19c7bb" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="30" r="9" fill="#43c15a" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="26" r="10" fill="#ffc41f" stroke="${INK}" stroke-width="3"/><circle cx="58" cy="30" r="9" fill="#d62a16" stroke="${INK}" stroke-width="3"/><circle cx="48" cy="38" r="5" fill="#fff6d6" stroke="${INK}" stroke-width="2.5"/>`,
  churros: `<rect x="10" y="40" width="54" height="12" rx="6" transform="rotate(-38 37 46)" fill="#e29a4b" stroke="${INK}" stroke-width="3"/><rect x="20" y="52" width="54" height="12" rx="6" transform="rotate(-38 47 58)" fill="#d8863a" stroke="${INK}" stroke-width="3"/><circle cx="30" cy="30" r="2" fill="#fff"/><circle cx="42" cy="22" r="2" fill="#fff"/><circle cx="52" cy="42" r="2" fill="#fff"/><path d="M52 56H72L70 70H54Z" fill="#7a3f1b" stroke="${INK}" stroke-width="3"/>`,
  drink: `<path d="M22 20H58L53 68H27Z" fill="#ff86c2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M24 30H56" stroke="#fff" stroke-width="4"/><path d="M44 20L52 4H64" fill="none" stroke="${INK}" stroke-width="4"/><circle cx="36" cy="46" r="5" fill="#ffc41f" stroke="${INK}" stroke-width="2.5"/>`,
  wrap: `<rect x="10" y="26" width="58" height="26" rx="13" transform="rotate(-18 39 39)" fill="#ffd45a" stroke="${INK}" stroke-width="3"/><circle cx="62" cy="22" r="8" fill="#43c15a" stroke="${INK}" stroke-width="3"/><circle cx="52" cy="14" r="6" fill="#d62a16" stroke="${INK}" stroke-width="3"/><path d="M20 50L58 38" stroke="${INK}" stroke-width="3"/>`,
  cookie: `<circle cx="40" cy="40" r="28" fill="#e29a4b" stroke="${INK}" stroke-width="3"/><circle cx="30" cy="30" r="5" fill="#5b2e14"/><circle cx="50" cy="28" r="4.5" fill="#5b2e14"/><circle cx="46" cy="48" r="5" fill="#5b2e14"/><circle cx="28" cy="49" r="4" fill="#5b2e14"/><circle cx="58" cy="44" r="3.5" fill="#5b2e14"/>`,
};
const dishIcon = (k) => `<svg class="rt-dish-ic" viewBox="0 0 80 76" aria-hidden="true">${DISH[k]}</svg>`;

const arrow = `<svg class="rt-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-7 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3"/></svg>`;
const star = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="currentColor"/></svg>`;

// ---------- Données ----------
const DAYS = [
  { d: "Lundi", a: "Lun", dow: 1, name: "Les Halles", addr: "Place des Halles, côté fontaine", start: "11:30", end: "14:30", x: 110, y: 95, p: "p0", spec: "Le Tomate-Tomate et les frites de patate douce", note: "Le rendez-vous des bureaux : commande prise en quatre minutes, fournée rapide." },
  { d: "Mardi", a: "Mar", dow: 2, name: "Campus des Tilleuls", addr: "Esplanade, face à la bibliothèque", start: "11:30", end: "14:30", x: 300, y: 70, p: "p1", spec: "Wrap falafel, bowl Soleil, limonade rose", note: "Beaucoup de végétarien aujourd'hui : le wrap falafel part vite." },
  { d: "Mercredi", a: "Mer", dow: 3, name: "Parc des Rives", addr: "Entrée nord, près du kiosque à musique", start: "11:30", end: "14:00", x: 500, y: 110, p: "p2", spec: "Churros sucre-cannelle et cookie poêlé", note: "Mercredi des familles : portions enfants et goûter sucré dès 14 h." },
  { d: "Jeudi", a: "Jeu", dow: 4, name: "Parvis de la Gare", addr: "Côté quai 1, sous la verrière", start: "18:00", end: "22:00", x: 545, y: 215, p: "p3", spec: "Taco pibil et burger Piquant", note: "Service du soir : idéal pour le retour du travail, c'est chaud et c'est pimenté." },
  { d: "Vendredi", a: "Ven", dow: 5, name: "Port des Marées", addr: "Quai du Port, devant les grues", start: "18:00", end: "22:30", x: 400, y: 285, p: "p4", spec: "Burger Piquant, frites cheddar-oignon", note: "Le soir qui dure : musique, lumières et dernière fournée à 22 h 15." },
  { d: "Samedi", a: "Sam", dow: 6, name: "Marché des Tanneurs", addr: "Allée centrale, stand 14", start: "10:00", end: "15:00", x: 170, y: 250, p: "p5", spec: "Bowl Soleil, wrap falafel, cookie poêlé", note: "Ambiance de marché : on goûte, on discute, on repart avec un sac plein." },
  { d: "Dimanche", a: "Dim", dow: 0, name: "Quai des Rives", addr: "Pique-nique sur le quai, côté péniches", start: "12:00", end: "17:00", x: 70, y: 310, p: "p6", spec: "Menu pique-nique et limonade rose", note: "Tout est prévu pour manger sur l'herbe : couverts en bois et plaid offert." },
];
const DISHES = [
  { id: "tomate", n: "Le Tomate-Tomate", t: "Bœuf haché, tomate confite, cheddar, sauce maison.", p: 9.5, tags: "gourmand", ic: "burger", c: "Burgers" },
  { id: "piquant", n: "Le Piquant", t: "Poulet croustillant, piment doux, cornichons, mayo fumée.", p: 10, tags: "epice", ic: "burger", c: "Burgers" },
  { id: "jardinier", n: "Le Jardinier", t: "Galette de pois chiches, avocat, roquette, sauce yaourt.", p: 9, tags: "vege", ic: "burger", c: "Burgers" },
  { id: "pibil", n: "Taco Pibil", t: "Porc effiloché à l'orange, oignons rouges, piment habanero.", p: 8.5, tags: "epice", ic: "taco", c: "Tacos et wraps" },
  { id: "falafel", n: "Wrap Falafel", t: "Falafels dorés, houmous, crudités, menthe fraîche.", p: 8, tags: "vege", ic: "wrap", c: "Tacos et wraps" },
  { id: "patate", n: "Frites de patate douce", t: "Épices douces et sauce yaourt-citron.", p: 4.5, tags: "vege sg", ic: "fries", c: "À partager" },
  { id: "cheddar", n: "Frites cheddar-oignon", t: "Cheddar fondu, oignons frits, ciboulette.", p: 5.5, tags: "vege", ic: "fries", c: "À partager" },
  { id: "soleil", n: "Bowl Soleil", t: "Quinoa, légumes rôtis, pois chiches, citron et herbes.", p: 9.5, tags: "vege sg", ic: "bowl", c: "Bowls" },
  { id: "mangue", n: "Bowl Poulet-Mangue", t: "Riz parfumé, poulet mariné, mangue, piment en poudre.", p: 10.5, tags: "epice sg", ic: "bowl", c: "Bowls" },
  { id: "churros", n: "Churros sucre-cannelle", t: "Cinq churros chauds et sauce chocolat.", p: 5, tags: "vege sucre", ic: "churros", c: "Sucré" },
  { id: "cookie", n: "Cookie poêlé", t: "Pépites de chocolat, cœur coulant, fleur de sel.", p: 4, tags: "vege sucre", ic: "cookie", c: "Sucré" },
  { id: "limo", n: "Limonade rose", t: "Citron pressé, hibiscus, glaçons et menthe.", p: 3.5, tags: "vege sg sucre", ic: "drink", c: "Boissons" },
];
const TAGNAME = { vege: "Végé", epice: "Épicé", sg: "Sans gluten", sucre: "Sucré" };
const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";

// ---------- Morceaux de page ----------
const tabs = (menu, cls = "") => menu.map((m, i) => `<a class="rt-tab rt-c${i % 4} ${cls}" href="${esc(m.url)}">${esc(m.label)}</a>`).join("");
const header = (c) => `<header class="rt-head pk-bleed"><div class="rt-head-in">
  <a class="rt-logo" href="/" aria-label="${esc(c.brand)} — accueil">${truckMini}<span class="rt-logo-t">Roulotte<small>street food en tournée</small></span></a>
  <div class="rt-tabs" role="navigation" aria-label="Navigation principale">${tabs(c.menu)}</div>
  <details class="rt-burger"><summary aria-label="Ouvrir le menu"><span class="rt-bur-l"><i></i><i></i><i></i></span><span class="rt-bur-t">Menu</span></summary>
    <div class="rt-drawer" role="navigation" aria-label="Menu mobile">${tabs(c.menu)}<a class="rt-tab rt-c1 rt-tab--cta" href="/evenements">Réserver le truck</a></div></details>
</div><div class="rt-edge" aria-hidden="true"></div></header>`;

const footer = (c) => `<footer class="rt-foot pk-bleed"><div class="rt-foot-road" aria-hidden="true"><div class="rt-foot-truck">${truck("rt-truck--foot")}</div></div>
  <div class="rt-foot-in"><div class="rt-foot-brand"><div class="rt-foot-logo">Roulotte</div><p>Du vrai street food, cuit minute, qui roule dans sept coins de la ville.</p><address>Dépôt : 8 rue des Ateliers, 69000 (adresse fictive)</address></div>
  <div><h2 class="rt-foot-h">Le truck</h2><div class="rt-fl-col">${c.menu.slice(1, 4).map((m) => `<a class="rt-fl" href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div>
  <div><h2 class="rt-foot-h">Plus</h2><div class="rt-fl-col"><a class="rt-fl" href="/contact">Contact</a><a class="rt-fl" href="/recherche">Recherche</a><a class="rt-fl" href="/evenements">Traiteur et événements</a></div></div></div>
  <p class="rt-legal">© Roulotte — site de démonstration. Lieux, horaires, plats et prix fictifs ; aucune commande ni paiement n'est possible ici.</p></footer>`;

const pagehead = (kicker, title, sub, col) => sec(`<section class="rt-ph rt-ph--${col} pk-bleed"><div class="rt-wrap rt-ph-in"><div><p class="rt-sticker rt-sticker--k" data-reveal>${esc(kicker)}</p><div class="rt-title" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="rt-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div><div class="rt-ph-truck" aria-hidden="true">${truck("rt-truck--ph")}</div></div></section>`);

const cd = () => `<div class="rt-cd" role="timer" aria-label="Temps avant le prochain arrêt"><span><b data-nx="d">00</b><i>jours</i></span><span><b data-nx="h">00</b><i>heures</i></span><span><b data-nx="m">00</b><i>min</i></span><span><b data-nx="s">00</b><i>sec</i></span></div>`;

// Carte de la ville : quartiers, rivière, routes, tracé de la tournée, camion-repère (déplacé par motion.js)
const cityMap = () => `<svg class="rt-map" viewBox="0 0 640 380" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Carte dessinée de la ville avec les sept arrêts de la semaine">
  <rect width="640" height="380" fill="#fffdf2"/>
  <path d="M-10 366C150 330 330 392 650 328" fill="none" stroke="#fff" stroke-width="50"/><path d="M-10 366C150 330 330 392 650 328" fill="none" stroke="#7fe2da" stroke-width="40"/><path d="M-10 366C150 330 330 392 650 328" fill="none" stroke="#fff" stroke-width="3" class="rt-dsh1" opacity=".8"/>
  <path d="M20 40H200L214 150H34Z" fill="#ffc7e3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M232 28H378L386 112H240Z" fill="#ffe08a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M410 40H600L590 168H420Z" fill="#b9f0a8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M470 186H610L618 268H460Z" fill="#d4ccff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M300 196H428L432 296H296Z" fill="#9deae3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M60 186H260L270 290H70Z" fill="#ffd3a6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M20 200H52L56 312H24Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <g fill="#fff" opacity=".85"><rect x="50" y="58" width="22" height="26" rx="3"/><rect x="80" y="58" width="22" height="26" rx="3"/><rect x="50" y="94" width="52" height="26" rx="3"/><rect x="256" y="46" width="30" height="30" rx="3"/><rect x="296" y="46" width="30" height="30" rx="3"/><rect x="496" y="62" width="26" height="26" rx="13"/><rect x="540" y="96" width="24" height="24" rx="12"/><rect x="486" y="114" width="20" height="20" rx="10"/><rect x="494" y="204" width="46" height="22" rx="3"/><rect x="320" y="216" width="36" height="46" rx="3"/><rect x="92" y="204" width="46" height="26" rx="3"/><rect x="152" y="212" width="48" height="26" rx="3"/></g>
  <g fill="none" stroke="#fff" stroke-width="9"><path d="M0 160H640"/><path d="M222 0V330"/><path d="M398 0V330"/></g><g fill="none" stroke="${INK}" stroke-width="1.6" class="rt-dsh2" opacity=".35"><path d="M0 160H640"/><path d="M222 0V330"/><path d="M398 0V330"/></g>
  <path d="M110 95L300 70L500 110L545 215L400 285L170 250L70 310" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>
  <path class="rt-route" d="M110 95L300 70L500 110L545 215L400 285L170 250L70 310" fill="none" stroke="#d62a16" stroke-width="4.5" stroke-linejoin="round"/>
  <g class="rt-pin" aria-hidden="true"><g class="rt-flip"><g transform="translate(-36 -49) scale(.19)"><g class="rt-pin-t">${truckParts().replace(/<g class="rt-puff"[\s\S]*?<\/g>/, "")}</g></g></g></g>
</svg>`;

const tourBox = (big) => `<div class="rt-tour${big ? " rt-tour--big" : ""}" data-tour>
  <div class="rt-days" role="tablist" aria-label="Jours de la semaine">${DAYS.map((d, i) => `<a class="rt-day rt-c${i % 4}" href="#jour-${i}" role="tab" aria-selected="false" data-i="${i}" data-dow="${d.dow}" data-start="${d.start}" data-end="${d.end}" data-x="${d.x}" data-y="${d.y}" data-name="${esc(d.name)}" data-day="${d.d}"><span class="rt-day-a">${d.a}</span><span class="rt-day-p">${esc(d.name.split(" ").slice(-1)[0])}</span></a>`).join("")}</div>
  <div class="rt-tour-grid"><div class="rt-mapbox">${cityMap()}${DAYS.map((d, i) => `<span class="rt-dot rt-${d.p}" data-i="${i}" aria-hidden="true">${d.a}</span>`).join("")}<div class="rt-compass" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M24 7L30 24H18Z" fill="#d62a16"/><path d="M24 41L18 24H30Z" fill="${INK}"/></svg></div></div>
  <div class="rt-side"><div class="rt-next rt-nextbox"><p class="rt-next-k">${star} Prochain arrêt</p><p class="rt-next-n" data-nx="name">Les Halles</p><p class="rt-next-w" data-nx="when">Lundi · 11 h 30</p>${cd()}<a class="rt-btn rt-btn--sun rt-goto" href="#prochain">Montrer sur la carte ${arrow}</a></div>
    <div class="rt-panels" aria-live="polite">${DAYS.map((d, i) => `<article class="rt-panel" data-i="${i}"><p class="rt-panel-d">${d.d}</p><h3 class="rt-panel-h">${esc(d.name)}</h3><p class="rt-panel-a">${esc(d.addr)}</p><p class="rt-panel-t"><strong>${d.start.replace(":", " h ")}</strong> à <strong>${d.end.replace(":", " h ")}</strong></p><p class="rt-panel-s"><em>Au menu :</em> ${esc(d.spec)}.</p><p class="rt-panel-n">${esc(d.note)}</p></article>`).join("")}</div></div></div></div>`;

const dishCard = (d, big) => `<article class="rt-dish${big ? " rt-dish--big" : ""}" data-tags="${d.tags}" data-id="${d.id}" data-name="${esc(d.n)}" data-price="${d.p}" data-reveal>
  <div class="rt-dish-art">${dishIcon(d.ic)}<span class="rt-dish-price">${fmt(d.p)}</span></div><div class="rt-dish-body"><p class="rt-dish-c">${d.c}</p><h3 class="rt-dish-n">${esc(d.n)}</h3><p class="rt-dish-t">${esc(d.t)}</p>
  <p class="rt-dish-tags">${d.tags.split(" ").map((t) => `<span class="rt-tg rt-tg--${t}">${TAGNAME[t] || "Gourmand"}</span>`).join("")}</p>
  <a class="rt-add" href="#ajouter" data-add="${d.id}" aria-label="Ajouter ${esc(d.n)} à ma sélection">+ Ajouter</a></div></article>`;
const dishPreview = (d) => `<article class="rt-dish rt-dish--lite" data-reveal><div class="rt-dish-art">${dishIcon(d.ic)}<span class="rt-dish-price">${fmt(d.p)}</span></div><div class="rt-dish-body"><p class="rt-dish-c">${d.c}</p><h3 class="rt-dish-n">${esc(d.n)}</h3><p class="rt-dish-t">${esc(d.t)}</p></div></article>`;

// ---------- Pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="rt-hero pk-bleed"><div class="rt-hero-bg" aria-hidden="true"><svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice"><g fill="#e1f1ff"><rect x="40" y="30" width="190" height="120" rx="10"/><rect x="270" y="30" width="120" height="120" rx="10"/><rect x="430" y="30" width="250" height="120" rx="10"/><rect x="720" y="30" width="150" height="120" rx="10"/><rect x="910" y="30" width="250" height="120" rx="10"/><rect x="40" y="190" width="120" height="150" rx="10"/><rect x="200" y="190" width="260" height="150" rx="10"/><rect x="500" y="190" width="180" height="150" rx="10"/><rect x="720" y="190" width="230" height="150" rx="10"/><rect x="990" y="190" width="170" height="150" rx="10"/></g><g fill="#ffe9a6"><circle cx="560" cy="110" r="34"/><rect x="760" y="230" width="90" height="70" rx="10"/></g><g fill="#c9f3ee"><rect x="240" y="226" width="150" height="76" rx="10"/><circle cx="1080" cy="260" r="40"/></g><g fill="#ffd3e8"><rect x="60" y="62" width="110" height="56" rx="10"/><rect x="960" y="62" width="150" height="56" rx="10"/></g></svg></div>
    <div class="rt-wrap rt-hero-grid"><div class="rt-hero-copy"><p class="rt-sticker rt-sticker--k" data-reveal>Street food · en tournée toute la semaine</p>
      <div class="rt-mega" role="heading" aria-level="1"><span data-reveal>Le goût de la rue,</span> <span class="rt-mega-hot" data-reveal>sur roues.</span></div>
      <p class="rt-lead" data-reveal>Burgers, tacos, bowls et churros préparés à la minute dans notre camion. Sept arrêts dans la ville, un seul mot d'ordre : se régaler sans se prendre la tête.</p>
      <div class="rt-actions" data-reveal><a class="rt-btn" href="/tournee">Où est le camion ? ${arrow}</a><a class="rt-btn rt-btn--ghost" href="/menu">Voir la carte</a></div></div>
      <aside class="rt-ticket rt-nextbox" data-reveal aria-label="Prochain arrêt du camion"><p class="rt-next-k">${star} Prochain arrêt</p><p class="rt-next-n" data-nx="name">Les Halles</p><p class="rt-next-w" data-nx="when">Lundi · 11 h 30</p>${cd()}<a class="rt-btn rt-btn--sun" href="/tournee">Toute la tournée ${arrow}</a></aside></div>
    <span class="rt-badge rt-badge--a" aria-hidden="true">Fait<br>minute</span><span class="rt-badge rt-badge--b" aria-hidden="true">100 %<br>maison</span>
    <div class="rt-road"><div class="rt-road-line" aria-hidden="true"></div><div class="rt-hero-truck">${truck("rt-truck--hero")}</div></div></section>`),
  sec(`<section class="rt-stats pk-bleed"><ul class="rt-wrap rt-stats-in"><li data-reveal><b data-count="7">7</b><span>arrêts par semaine</span></li><li data-reveal><b data-count="12">12</b><span>recettes à la carte</span></li><li data-reveal><b data-count="4">4</b><span>minutes pour être servi</span></li><li data-reveal><b data-count="100" data-suffix=" %">100 %</b><span>cuit à la commande</span></li></ul></section>`),
  sec(`<section class="rt-sec rt-sec--sun pk-bleed"><div class="rt-wrap"><div class="rt-sechead"><div><p class="rt-sticker" data-reveal>La semaine du camion</p><h2 class="rt-h2" data-reveal>Sur quelle place<br>on se retrouve ?</h2></div><p class="rt-sechead-p" data-reveal>Touchez un jour : le camion se déplace sur la carte et vous montre l'adresse, les horaires et ce qui est au menu.</p></div>${tourBox(false)}<p class="rt-fine" data-reveal>Adresses et horaires de démonstration.</p></div></section>`),
  sec(`<section class="rt-sec pk-bleed"><div class="rt-wrap"><div class="rt-sechead"><div><p class="rt-sticker rt-sticker--teal" data-reveal>À la carte</p><h2 class="rt-h2" data-reveal>Quatre best-sellers</h2></div><a class="rt-more" href="/menu" data-reveal>Toute la carte ${arrow}</a></div>
    <div class="rt-dish-grid">${["tomate", "piquant", "falafel", "churros"].map((id) => dishPreview(DISHES.find((d) => d.id === id))).join("")}</div></div></section>`),
  sec(`<section class="rt-sec rt-sec--pink pk-bleed"><div class="rt-wrap"><div class="rt-sechead"><div><p class="rt-sticker rt-sticker--ink" data-reveal>Comment ça roule</p><h2 class="rt-h2" data-reveal>Trois arrêts,<br>zéro prise de tête.</h2></div></div>
    <ol class="rt-steps"><li data-reveal><span class="rt-step-n">1</span><h3>Repérez le camion</h3><p>Consultez la tournée : chaque jour, une place, des horaires et un plat vedette.</p></li><li data-reveal><span class="rt-step-n">2</span><h3>Composez votre repas</h3><p>Choisissez dans la carte, filtrez le végé ou l'épicé et gardez votre sélection sous la main.</p></li><li data-reveal><span class="rt-step-n">3</span><h3>Venez le chercher</h3><p>Sur place, on cuit à la minute. Pour un groupe ou un événement, on s'organise par message.</p></li></ol></div></section>`),
  sec(`<section class="rt-sec rt-sec--ink pk-bleed"><div class="rt-wrap rt-evt"><div><p class="rt-sticker rt-sticker--sun" data-reveal>Traiteur et événements</p><h2 class="rt-h2 rt-h2--w" data-reveal>Le camion vient<br>chez vous.</h2><p class="rt-lead rt-lead--w" data-reveal>Mariage, séminaire, anniversaire ou fête de quartier : on se gare, on installe la guirlande et on sert vos invités.</p><a class="rt-btn rt-btn--sun" href="/evenements" data-reveal>Préparer mon événement ${arrow}</a></div>
    <ul class="rt-evt-list"><li data-reveal><b>Dès 30 invités</b><span>Formules cocktail ou repas assis</span></li><li data-reveal><b>Camion + équipe</b><span>Installation, service et rangement inclus</span></li><li data-reveal><b>Menu sur mesure</b><span>Végé, sans gluten, sans porc</span></li></ul></div></section>`),
  sec(footer(c)),
];

const menu = (c) => [
  sec(header(c)),
  pagehead("La carte du camion", "Le menu,<br>à la minute", "Douze recettes, cuites à la commande. Filtrez selon vos envies, composez votre sélection et envoyez-la nous par message.", "teal"),
  sec(`<section class="rt-sec rt-menu pk-bleed" data-menu><div class="rt-wrap"><div class="rt-filters" role="tablist" aria-label="Filtrer la carte">
    <a class="rt-chip rt-c0 is-on" href="#tout" data-filter="all" role="tab" aria-selected="true">Tout</a><a class="rt-chip rt-c1" href="#vege" data-filter="vege" role="tab" aria-selected="false">Végé</a><a class="rt-chip rt-c2" href="#epice" data-filter="epice" role="tab" aria-selected="false">Épicé</a><a class="rt-chip rt-c3" href="#sans-gluten" data-filter="sg" role="tab" aria-selected="false">Sans gluten</a><a class="rt-chip rt-c0" href="#sucre" data-filter="sucre" role="tab" aria-selected="false">Sucré</a></div>
    <p class="rt-count" aria-live="polite" data-count-out>12 recettes</p>
    <div class="rt-menu-grid"><div class="rt-dish-list">${DISHES.map((d) => dishCard(d)).join("")}</div>
    <aside class="rt-cart" data-cart aria-label="Ma sélection"><div class="rt-cart-in"><p class="rt-sticker rt-sticker--sun">Ma sélection</p><h2 class="rt-cart-h">Récapitulatif</h2>
      <p class="rt-cart-empty" data-cart-empty>Rien pour l'instant. Touchez « Ajouter » sur un plat.</p><ul class="rt-cart-list" data-cart-list></ul>
      <p class="rt-cart-total" data-cart-totalrow hidden><span>Total indicatif</span><b data-cart-total>0,00 €</b></p>
      <p class="rt-cart-sum" data-cart-sum hidden></p>
      <a class="rt-btn rt-btn--block" href="/contact" data-cart-send>Envoyer ma sélection ${arrow}</a><a class="rt-btn rt-btn--ghost rt-btn--block" href="#copier" data-cart-copy hidden>Copier le récapitulatif</a>
      <p class="rt-fine">Prix indicatifs de démonstration. Aucun paiement ici : le message nous parvient via le formulaire de contact.</p></div></aside></div></div></section>`),
  sec(`<div class="pk-bleed"><a class="rt-cartbar" href="#panier" data-cartbar hidden><span data-cartbar-n>0 plat</span><b data-cartbar-t>0,00 €</b><span>Voir ${arrow}</span></a></div>`),
  sec(footer(c)),
];

const tableRows = DAYS.map((d) => `<tr><th scope="row" data-label="Jour">${d.d}</th><td data-label="Arrêt">${esc(d.name)}</td><td data-label="Adresse">${esc(d.addr)}</td><td data-label="Horaires">${d.start.replace(":", " h ")} – ${d.end.replace(":", " h ")}</td><td data-label="Au menu">${esc(d.spec)}</td></tr>`).join("");
const tournee = (c) => [
  sec(header(c)),
  pagehead("Du lundi au dimanche", "La tournée<br>de la semaine", "Une place par jour, des horaires fixes. Touchez un jour pour déplacer le camion sur la carte.", "sun"),
  sec(`<section class="rt-sec rt-sec--tight pk-bleed"><div class="rt-wrap">${tourBox(true)}<p class="rt-fine">Adresses et horaires de démonstration.</p></div></section>`),
  sec(`<section class="rt-sec rt-sec--teal pk-bleed"><div class="rt-wrap"><div class="rt-sechead"><div><p class="rt-sticker rt-sticker--ink" data-reveal>Le planning en clair</p><h2 class="rt-h2" data-reveal>Toute la semaine</h2></div></div>
    <table class="rt-table" data-reveal><caption class="rt-sr">Planning hebdomadaire du camion</caption><thead><tr><th scope="col">Jour</th><th scope="col">Arrêt</th><th scope="col">Adresse</th><th scope="col">Horaires</th><th scope="col">Au menu</th></tr></thead><tbody>${tableRows}</tbody></table></div></section>`),
  sec(`<section class="rt-sec pk-bleed"><div class="rt-wrap"><div class="rt-sechead"><div><p class="rt-sticker" data-reveal>À savoir</p><h2 class="rt-h2" data-reveal>Avant de venir</h2></div></div>
    <div class="rt-notes"><article class="rt-note rt-note--a" data-reveal><h3>S'il pleut</h3><p>Le camion sert quand même, sous son auvent. Prévoyez simplement un parapluie.</p></article><article class="rt-note rt-note--b" data-reveal><h3>Si on a du retard</h3><p>Le compte à rebours suit les horaires prévus ; un imprévu de circulation peut décaler l'ouverture de quelques minutes.</p></article><article class="rt-note rt-note--c" data-reveal><h3>Besoin d'une autre place ?</h3><p>Proposez-nous un coin de la ville ou un événement : écrivez-nous depuis la page contact.</p><a class="rt-more" href="/contact">Nous écrire ${arrow}</a></article></div></div></section>`),
  sec(footer(c)),
];

const FORMULES = [["cocktail", "Cocktail", 14, "Trois bouchées salées, une sucrée et une boisson, servies debout."], ["repas", "Repas assis", 22, "Un plat du camion au choix, un accompagnement, un dessert et une boisson."], ["festival", "Grande fête", 18, "Service continu pendant quatre heures, avec file rapide et deux fenêtres de service."]];
const evenements = (c) => [
  sec(header(c)),
  pagehead("Traiteur et événements", "Le camion<br>fait la fête", "Mariages, séminaires, anniversaires, fêtes de quartier : le camion s'installe chez vous et sert vos invités.", "pink"),
  sec(`<section class="rt-sec pk-bleed"><div class="rt-wrap"><div class="rt-sechead"><div><p class="rt-sticker rt-sticker--teal" data-reveal>Pour quelle occasion ?</p><h2 class="rt-h2" data-reveal>Quatre façons<br>de faire venir le camion</h2></div></div>
    <div class="rt-occ">${[["Mariage", "Un cocktail qui change du traditionnel, avec des bouchées chaudes à minuit.", "burger"], ["Entreprise", "Séminaire, lancement, repas d'équipe : un service rapide pour tout le monde.", "bowl"], ["Anniversaire", "Pour 30 ou 150 invités, un menu festif et un dessert qui claque.", "churros"], ["Fête de quartier", "Un camion, de la musique et des voisins : on s'occupe de la partie gourmande.", "drink"]].map(([t, p, ic], i) => `<article class="rt-occ-card rt-occ-${i}" data-reveal><div class="rt-occ-art">${dishIcon(ic)}</div><h3>${t}</h3><p>${p}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="rt-sec rt-sec--ink pk-bleed" data-est><div class="rt-wrap rt-est"><div class="rt-est-copy"><p class="rt-sticker rt-sticker--sun" data-reveal>Estimation rapide</p><h2 class="rt-h2 rt-h2--w" data-reveal>Combien ça coûte,<br>à peu près ?</h2><p class="rt-lead rt-lead--w" data-reveal>Choisissez une formule et le nombre d'invités : vous obtenez une estimation indicative, à nous envoyer par message pour un devis réel.</p></div>
    <div class="rt-est-card" data-reveal><div class="rt-est-tabs" role="tablist" aria-label="Formule">${FORMULES.map(([k, n, p], i) => `<a class="rt-chip rt-c${i}${i === 0 ? " is-on" : ""}" href="#${k}" role="tab" aria-selected="${i === 0}" data-f="${k}" data-p="${p}" data-n="${n}">${n}</a>`).join("")}</div>
      ${FORMULES.map(([k, , p, t], i) => `<p class="rt-est-desc" data-fd="${k}"${i ? ' hidden' : ""}>${t} <strong>${p} € par invité</strong> (indicatif).</p>`).join("")}
      <div class="rt-est-row"><span class="rt-est-l">Invités</span><div class="rt-stepper"><a href="#moins" data-g="-10" aria-label="Dix invités de moins">−</a><b data-est-g>60</b><a href="#plus" data-g="10" aria-label="Dix invités de plus">+</a></div></div>
      <p class="rt-est-total"><span>Estimation</span><b data-est-total>840 €</b></p><p class="rt-est-sum" data-est-sum>Formule Cocktail pour 60 invités.</p>
      <a class="rt-btn rt-btn--sun rt-btn--block" href="/contact">Demander un devis ${arrow}</a><p class="rt-fine rt-fine--w">Estimation de démonstration, sans engagement. Aucune réservation n'est enregistrée ici.</p></div></div></section>`),
  sec(`<section class="rt-sec rt-sec--teal pk-bleed"><div class="rt-wrap"><div class="rt-sechead"><div><p class="rt-sticker rt-sticker--ink" data-reveal>En pratique</p><h2 class="rt-h2" data-reveal>Du premier message<br>au dernier churros</h2></div></div>
    <ol class="rt-route-steps">${[["Vous écrivez", "Date, lieu, nombre d'invités, régimes alimentaires."], ["On répond", "Un devis détaillé sous deux jours ouvrés."], ["On se cale", "Menu, horaires, accès pour le camion et branchements."], ["On se gare", "Installation une heure avant, service, puis rangement."]].map(([t, p], i) => `<li data-reveal><span class="rt-rs-n">${i + 1}</span><div><h3>${t}</h3><p>${p}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="rt-sec pk-bleed"><div class="rt-wrap rt-faq"><h2 class="rt-h2" data-reveal>Questions<br>fréquentes</h2><div>
    <details data-reveal><summary>De quelle place a besoin le camion ?</summary><p>Environ 7 mètres de long sur 3 de large, un sol plat et un accès de plain-pied. Nous vérifions avec vous avant le jour J.</p></details>
    <details data-reveal><summary>Pouvez-vous gérer les régimes particuliers ?</summary><p>Oui : végétarien, sans gluten et sans porc sont prévus. Précisez-le dans votre message.</p></details>
    <details data-reveal><summary>Faut-il de l'électricité ?</summary><p>Le camion est autonome en gaz et en électricité pour la plupart des services. Nous confirmons selon le lieu.</p></details>
    <details data-reveal><summary>Jusqu'à combien d'invités ?</summary><p>De 30 à 300 personnes selon la formule ; au-delà, un second service est possible.</p></details></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Un mot pour nous", "Écrivez-nous", "Une question, une idée d'arrêt, un événement ? Nous répondons sous deux jours ouvrés.", "teal"),
  { type: "form", heading: "Envoyer un message", intro: "Pour une sélection du menu ou une demande de devis, collez votre récapitulatif dans le message." },
  sec(`<section class="rt-sec rt-sec--tight pk-bleed"><div class="rt-wrap rt-cards3"><article class="rt-note rt-note--a" data-reveal><h3>Le dépôt</h3><address>8 rue des Ateliers<br>69000 (adresse fictive)</address><p>Retrait de groupe sur rendez-vous.</p></article><article class="rt-note rt-note--b" data-reveal><h3>Traiteur</h3><p>Pour un événement, indiquez la date, le lieu et le nombre d'invités.</p><a class="rt-more" href="/evenements">Voir les formules ${arrow}</a></article><article class="rt-note rt-note--c" data-reveal><h3>Où est le camion ?</h3><p>La place du jour et le compte à rebours sont sur la page tournée.</p><a class="rt-more" href="/tournee">Voir la tournée ${arrow}</a></article></div></section>`),
  sec(footer(c)),
];

const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une envie ?", "Un plat, une place, une date : cherchez sur tout le site.", "sun"), { type: "layout", children: [{ type: "search", props: { placeholder: "Burger, taco, Gare, vendredi…" } }] }, sec(footer(c))];

const introuvable = (c) => [sec(header(c)), sec(`<section class="rt-404 pk-bleed"><div class="rt-wrap rt-404-in"><p class="rt-sticker rt-sticker--k">Fausse route</p><div class="rt-title rt-title--404" role="heading" aria-level="1">404</div><p class="rt-ph-sub">Le camion s'est perdu : cette page n'existe pas ou a changé d'adresse.</p><div class="rt-actions"><a class="rt-btn" href="/">Retour à l'accueil ${arrow}</a><a class="rt-btn rt-btn--ghost" href="/tournee">Voir la tournée</a></div></div><div class="rt-road rt-road--s"><div class="rt-road-line" aria-hidden="true"></div><div class="rt-hero-truck rt-hero-truck--lost">${truck("rt-truck--hero")}</div></div></section>`), sec(footer(c))];

module.exports = {
  key: "roulotte", name: "Roulotte", version: "2.0.0", category: "gastronomie", tags: ["ludique", "audacieux", "chaleureux"], siteType: "Food truck et street food", featured: true,
  concept: "Une carte de ville dessinée et un camion qui roule : onglets d'autocollants, plats sur cartes inclinées et tournée de la semaine où chaque jour déplace le camion.",
  description: "Food truck pop sur fond blanc bleuté : camion SVG qui arrive, onglets d'autocollants, tournée de la semaine sur une carte de quartiers avec prochain arrêt en direct, menu filtrable et récapitulatif envoyé par message.",
  brand: "Roulotte Street Food", modules: ["formulaires", "recherche"],
  dna: { header: "onglets-d-autocollants-decoupes-sur-route", hero: "camion-svg-qui-arrive-sur-une-carte-de-ville", grid: "cartes-de-plats-inclinees-sur-planche", motion: "camion-qui-roule-roues-qui-tournent-et-arrets-qui-pulsent", shapes: "autocollants-a-bord-blanc-quartiers-de-carte-et-route-pointillee", rhythm: "bandes-vives-alternees-et-arrets-numerotes", signature: "tournee-de-la-semaine-sur-carte-de-quartiers-et-prochain-arret" },
  tokens: {
    colors: { primary: "#d62a16", secondary: "#19c7bb", accent: "#ffc41f", background: "#f4faff", surface: "#ffffff", text: "#1b1340", muted: "#4d4670", success: "#1c7a3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.shrikhand", body: "font.be-vietnam-pro", button: "font.paytone-one", link: "font.be-vietnam-pro" },
    radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "0 6px 0 rgba(27,19,64,.18)", button: "0 4px 0 rgba(27,19,64,.9)" }, border: { width: 3, color: "#1b1340" },
    type: { h1: { size: 84, weight: 400, lineHeight: 1, transform: "none" }, h2: { size: 48, weight: 400, lineHeight: 1.05, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge tomate", type: "color", default: "#d62a16" },
    { key: "sun", label: "Jaune moutarde", type: "color", default: "#ffc41f" },
    { key: "truck", label: "Couleur du camion", type: "choice", default: "tomate", choices: [["tomate", "Tomate"], ["turquoise", "Turquoise"], ["rose", "Rose"]] },
    { key: "tilt", label: "Cartes inclinées", type: "choice", default: "on", choices: [["on", "Inclinées"], ["off", "Droites"]] },
    { key: "road", label: "Route animée", type: "choice", default: "on", choices: [["on", "Animée"], ["off", "Fixe"]] },
  ],
  menu: [["Accueil", "/"], ["Menu", "/menu"], ["Tournée", "/tournee"], ["Événements", "/evenements"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "menu", name: "Menu", render: menu }, { key: "tournee", name: "Tournée de la semaine", render: tournee },
    { key: "evenements", name: "Événements et traiteur", render: evenements }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
