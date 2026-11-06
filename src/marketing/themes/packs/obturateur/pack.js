// Obturateur — photo-journal. Direction artistique : la planche-contact. Gris papier photo, noir de chambre noire, rouge de lampe inactinique ; images en SVG (scènes dessinées), numéros de vue sur le bord du film,
// légendes et données de prise de vue en monospace. Composant signature : visionneuse (clavier, compteur, panneau EXIF) sur une planche filtrable par série et par photographe.
const { sec, secs, esc } = require("../kit");

/* ---------- Données (écrites dans le thème : le CMS n'a pas de type « photo ») ---------- */
const PH = {
  ines: { n: "Inès Marchand", r: "Villes et lumière du matin", b: "Photographe de presse pendant douze ans, elle ne travaille plus qu'à l'aube, avec un seul boîtier et un seul objectif.", gear: "Leica Q2 · Summilux 28 mm", type: "Numérique" },
  paul: { n: "Paul-Émile Roche", r: "Paysages en moyen format", b: "Il marche des heures avec un Pentax 67 sur le dos et ne développe qu'une pellicule sur trois, par économie et par exigence.", gear: "Pentax 67 · 105 mm f/2,4", type: "Argentique" },
  yasmine: { n: "Yasmine Haddad", r: "Portraits et marchés", b: "Elle photographie les gens qui travaillent. Elle leur demande toujours la permission, et leur envoie toujours un tirage.", gear: "Fujifilm X-T5 · 35 mm f/1,4", type: "Numérique" },
  colin: { n: "Colin Berthier", r: "Rues et nuits, noir et blanc", b: "Ancien projectionniste, il développe lui-même ses Tri-X dans une salle de bains et pousse la sensibilité sans regret.", gear: "Nikon FM2 · 50 mm f/1,8", type: "Argentique" },
};
const SER = ["Villes", "Portraits", "Paysages", "Rues", "Nuit"];
// [id, titre, série, photographe, date, lieu, légende, étiquettes, motif, focale, ouverture, vitesse, iso]
const P = [
  ["pont-six-heures", "Pont de pierre, six heures", "Villes", "ines", "2026-10-28", "Bordeaux", "La brume remonte la Garonne et efface le pont arche après arche. Il restait dix minutes de lumière avant les premiers bus.", ["brume", "pont", "aube"], "ville", 28, 8, "1/250", 200],
  ["marchand-journaux", "Le marchand de journaux", "Portraits", "yasmine", "2026-10-21", "Marseille", "Quarante ans derrière le même comptoir, et le même sourire pour chaque client, même celui qui n'achète rien.", ["portrait", "commerce", "métier"], "portrait", 35, 1.4, "1/500", 400],
  ["dune-ouest", "Dune du Pilat, vent d'ouest", "Paysages", "paul", "2026-10-14", "La Teste-de-Buch", "Le sable avance de quatre mètres par an. Le vent dessine des crêtes qui n'existent que quelques heures.", ["dune", "vent", "sable"], "dune", 105, 16, "1/125", 400],
  ["roquette-23h", "Rue de la Roquette, 23 h", "Nuit", "colin", "2026-10-07", "Paris", "Pellicule poussée à 1600, pose de 1/30 seconde au bord du trottoir : le bruit du grain remplace celui de la rue.", ["néons", "grain", "nuit"], "nuit", 50, 1.8, "1/30", 1600],
  ["nageuses-pantin", "Les nageuses de Pantin", "Rues", "ines", "2026-09-30", "Pantin", "Le bassin du canal rouvre l'été. Elles se jettent à l'eau avant le café, en rang d'oignons.", ["canal", "été", "sport"], "rue", 28, 5.6, "1/500", 100],
  ["toits-zinc", "Toits de zinc", "Villes", "yasmine", "2026-09-23", "Paris", "Des milliers de cheminées, trois siècles de couvreurs. La lumière de fin d'après-midi donne au zinc sa couleur de ciel.", ["toits", "zinc", "hauteur"], "ville", 35, 8, "1/320", 160],
  ["cheval-halage", "Cheval de halage", "Paysages", "colin", "2026-09-16", "Ill-et-Vilaine", "Un attelage reconstitué le temps d'une fête. Le cheval connaissait la route mieux que son meneur.", ["cheval", "canal", "tradition"], "dune", 50, 11, "1/250", 400],
  ["cafe-moka", "Café Moka, fermeture", "Nuit", "ines", "2026-09-09", "Lyon", "Le patron relève les chaises une à une. Dans la vitrine, son reflet et celui du dernier client se confondent.", ["café", "reflet", "fermeture"], "nuit", 28, 2, "1/60", 3200],
  ["accordeoniste", "L'accordéoniste", "Portraits", "paul", "2026-09-02", "Toulouse", "Elle joue depuis soixante ans. Le moyen format a capté le grain de la peau et le doré de l'instrument.", ["musique", "main", "portrait"], "portrait", 105, 4, "1/125", 400],
  ["escalier-d", "Escalier D, bloc 4", "Villes", "colin", "2026-08-26", "Sarcelles", "Une cage d'escalier repeinte chaque année par les habitants. Cette année, ils ont choisi le jaune.", ["architecture", "couleur", "habitants"], "ville", 50, 5.6, "1/60", 400],
  ["lac-gele", "Lac gelé, 7 h", "Paysages", "yasmine", "2026-08-19", "Annecy", "Une pellicule de glace de deux centimètres, un pêcheur au loin, et le soleil qui hésite derrière la crête.", ["lac", "glace", "hiver"], "dune", 35, 11, "1/200", 100],
  ["pluie-tram", "Pluie sur le tram", "Rues", "ines", "2026-08-12", "Nantes", "Les essuie-glaces du tram dessinent des demi-lunes sur la vitre. Un voyageur sourit à son téléphone.", ["pluie", "tram", "ville"], "rue", 28, 2.8, "1/125", 800],
  ["mains-couturiere", "Les mains de la couturière", "Portraits", "colin", "2026-08-05", "Roubaix", "Une dernière robe de mariée avant la retraite. Les doigts connaissent le tissu sans le regarder.", ["mains", "textile", "métier"], "portrait", 50, 2.8, "1/60", 800],
  ["neons-gare", "Néons de la gare", "Nuit", "yasmine", "2026-07-29", "Lille", "Les enseignes de la galerie marchande baignent le hall de rose et de vert. Un agent d'entretien dessine un cercle propre.", ["gare", "néons", "voyageurs"], "nuit", 35, 1.4, "1/80", 2000],
  ["dernier-ferry", "Le dernier ferry", "Paysages", "paul", "2026-07-22", "Île d'Yeu", "Treize minutes avant le départ, la file d'attente se tait. La mer est d'un gris qui ne se photographie qu'en pellicule.", ["mer", "ferry", "île"], "dune", 105, 8, "1/250", 400],
  ["marche-samedi", "Marché du samedi", "Rues", "yasmine", "2026-07-15", "Vannes", "Cageots, sourires, un parapluie rouge. La photographie de rue vit de ces cinq secondes où tout se range.", ["marché", "couleurs", "foule"], "rue", 35, 4, "1/500", 200],
  ["grue-crepuscule", "Grue au crépuscule", "Villes", "paul", "2026-07-08", "Le Havre", "Les ports ne dorment jamais : les grues travaillent, découpées sur un ciel de pêche mûre.", ["port", "grue", "crépuscule"], "ville", 105, 11, "1/160", 100],
  ["chien-quai", "Chien de quai", "Rues", "colin", "2026-07-01", "Marseille", "Il surveille les cageots du poissonnier depuis le matin. Personne ne sait à qui il appartient, tout le monde le nourrit.", ["animal", "port", "humour"], "rue", 50, 4, "1/250", 400],
  ["lea-contrejour", "Portrait de Léa, contre-jour", "Portraits", "ines", "2026-06-24", "Rennes", "Une fenêtre, un rideau et vingt minutes de patience : la lumière a décidé de la pose avant nous.", ["contre-jour", "portrait", "fenêtre"], "portrait", 28, 2, "1/250", 100],
  ["lune-salines", "Lune sur les salines", "Nuit", "paul", "2026-06-17", "Guérande", "Pose de huit secondes sur trépied. Les tas de sel sont devenus des dunes éclairées de l'intérieur.", ["lune", "sel", "pose longue"], "nuit", 105, 5.6, "8 s", 400],
];
const idx = (id) => P.findIndex((p) => p[0] === id);
const fdate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fnum = (n) => String(n).replace(".", ",");
const exifLine = (p) => `f/${fnum(p[10])} · ${p[11]} · ISO ${p[12]}`;
const bw = (p) => PH[p[3]].type === "Argentique" && (p[3] === "colin");

/* ---------- Dessins : scènes de photographie en SVG (une graine par photo) ---------- */
function scene(p, n) {
  const kind = p[8]; let s = (n * 7919 + 104729) % 233280; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280); const R = (a, b) => Math.round(a + r() * (b - a));
  const portrait = kind === "portrait", W = portrait ? 240 : 300, H = portrait ? 300 : 200;
  const tint = [["#d9c7ae", "#7a5a40", "#2a2118"], ["#b9c8d6", "#4a627a", "#161d26"], ["#d6d0c4", "#6b6a5d", "#1d1e1a"], ["#e0c3b2", "#8a5a46", "#2b1812"]][n % 4];
  let body = "";
  if (kind === "ville") {
    for (let i = 0, x = 0; x < W; i++) { const w = R(22, 44), h = R(50, 130); body += `<path d="M${x} ${H - 40}V${H - 40 - h}h${w}V${H - 40}Z" fill="${tint[2]}" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`; if (i % 2) body += `<rect x="${x + 6}" y="${H - 40 - h + 10}" width="5" height="7" fill="#f5c26b"/>`; x += w + R(0, 5); }
    body += `<rect y="${H - 40}" width="${W}" height="40" fill="${tint[1]}" opacity=".55"/>`;
  } else if (kind === "portrait") {
    for (let i = 0; i < 5; i++) body += `<circle cx="${R(20, W - 20)}" cy="${R(20, 150)}" r="${R(16, 40)}" fill="${tint[0]}" opacity=".35"/>`;
    body += `<path d="M30 ${H}Q40 ${H - 100} ${W / 2} ${H - 108}T${W - 30} ${H}Z" fill="${tint[2]}"/><ellipse cx="${W / 2}" cy="${H - 150}" rx="42" ry="52" fill="${tint[1]}"/><path d="M${W / 2 - 46} ${H - 160}Q${W / 2} ${H - 235} ${W / 2 + 46} ${H - 160}Q${W / 2} ${H - 190} ${W / 2 - 46} ${H - 160}Z" fill="${tint[2]}"/>`;
  } else if (kind === "dune") {
    body += `<circle cx="${R(60, 240)}" cy="${R(40, 70)}" r="${R(16, 24)}" fill="#fbf1d6" opacity=".9"/><path d="M0 ${R(110, 130)}Q${R(60, 110)} ${R(70, 90)} ${R(150, 190)} ${R(105, 120)}T${W} ${R(100, 125)}V${H}H0Z" fill="${tint[1]}" opacity=".75"/><path d="M0 ${R(145, 160)}Q${R(70, 120)} ${R(110, 130)} ${R(160, 200)} ${R(140, 155)}T${W} ${R(135, 150)}V${H}H0Z" fill="${tint[2]}"/>`;
  } else if (kind === "nuit") {
    for (let i = 0; i < 7; i++) { const x = R(10, W - 30), y = R(30, H - 70); body += `<rect x="${x}" y="${y}" width="${R(14, 40)}" height="${R(8, 22)}" fill="${["#ff4d6d", "#4dd6c1", "#ffd166"][i % 3]}" opacity=".85"/><circle cx="${x + 8}" cy="${y + 6}" r="${R(22, 38)}" fill="${["#ff4d6d", "#4dd6c1", "#ffd166"][i % 3]}" opacity=".12"/>`; }
    body += `<path d="M0 ${H - 36}H${W}V${H}H0Z" fill="#05070b"/>`;
  } else {
    const vx = R(110, 190), vy = R(70, 100);
    body += `<path d="M0 ${H}L${vx} ${vy}L${W} ${H}Z" fill="${tint[1]}" opacity=".5"/><path d="M${vx - 30} ${vy + 4}H${vx + 40}V${vy + 40}H${vx - 30}Z" fill="${tint[2]}"/><path d="M0 0V${H}L${vx - 60} ${vy + 10}V0Z" fill="${tint[2]}" opacity=".85"/><circle cx="${R(40, 260)}" cy="${R(125, 170)}" r="9" fill="#f5c26b" opacity=".8"/>`;
  }
  const dark = kind === "nuit";
  return { svg: `<svg class="ob-img${bw(p) ? " ob-bw" : ""}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(`${p[1]} — ${p[6].split(".")[0]}`)}"><rect width="${W}" height="${H}" fill="${dark ? "#0b1020" : tint[0]}"/><rect y="${Math.round(H * 0.45)}" width="${W}" height="${Math.round(H * 0.3)}" fill="${dark ? "#1b1630" : "#f2ece0"}" opacity=".35"/><rect y="${Math.round(H * 0.7)}" width="${W}" height="${H}" fill="${dark ? "#1b1630" : "#f2ece0"}" opacity=".35"/>${body}</svg>`, ratio: portrait ? "4/5" : "3/2" };
}

const APER = `<svg class="ob-ap" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 3l7 14M35 13L21 20M32 31L19 22M16 36l1-15M5 26l15-6M9 10l12 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const ARR = `<svg class="ob-ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

/* ---------- En-tête et pied ---------- */
const NAV = [["Accueil", "/"], ["La planche", "/planche"], ["Séries", "/series"], ["Photographes", "/photographes"], ["Réglages", "/reglages"], ["Contact", "/contact"]];
const header = (c) => `<header class="ob-head pk-bleed"><div class="ob-bar">
  <a class="ob-logo" href="/" aria-label="${esc(c.brand)}, accueil">${APER}<span>obturateur</span></a>
  <div class="ob-nav" role="navigation" aria-label="Navigation principale">${NAV.map(([l, u], i) => `<a href="${u}"><i>${String(i).padStart(2, "0")}</i>${esc(l)}</a>`).join("")}<a class="ob-nav-s" href="/recherche"><i>→</i>Rechercher</a></div>
  <p class="ob-head-note">Photo-journal · 4 photographes · ${P.length} vues</p>
  <details class="ob-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="ob-drawer" role="navigation" aria-label="Menu mobile">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}<a href="/recherche">Rechercher</a></div></details>
</div></header>`;
const footer = () => `<footer class="ob-foot pk-bleed"><div class="ob-foot-in"><div class="ob-foot-top">
  <div class="ob-foot-brand">${APER}<p><b>obturateur</b> est un photo-journal collectif : une vue par semaine, quatre regards, des légendes écrites à la main et les réglages de chaque prise de vue.</p></div>
  <div class="ob-fcol" role="navigation" aria-label="Regarder"><p class="ob-fh">Regarder</p><a href="/planche">La planche</a><a href="/series">Séries</a><a href="/reglages">Réglages</a><a href="/blocs">Exemples de mise en page</a></div>
  <div class="ob-fcol" role="navigation" aria-label="Le collectif"><p class="ob-fh">Le collectif</p><a href="/photographes">Photographes</a><a href="/contact">Écrire</a><a href="/recherche">Rechercher</a></div>
  <div class="ob-fcol" role="navigation" aria-label="Informations légales"><p class="ob-fh">Informations</p><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div>
</div><p class="ob-legal">© obturateur — site de démonstration : les photographes, les lieux et les scènes sont fictifs ; les images sont des dessins.</p></div></footer>`;

const head = (kicker, title, sub) => sec(`<section class="ob-ph pk-bleed"><div class="ob-wrap"><p class="ob-kick">${esc(kicker)}</p><div class="ob-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="ob-lead">${esc(sub)}</p>` : ""}</div></section>`);

/* ---------- Vue de planche-contact ---------- */
function frame(p, i, num) {
  const n = idx(p[0]), sc = scene(p, n), ph = PH[p[3]];
  return `<li class="ob-fr ob-r${sc.ratio === "4/5" ? "45" : "32"}" data-serie="${slug(p[2])}" data-ph="${p[3]}"><a class="ob-fr-in" href="/photo" data-photo data-info="${esc([p[5], fdate(p[4]), ph.n, ph.gear, `${p[9]} mm`, `f/${fnum(p[10])}`, p[11], p[12], ph.type].join("|"))}">
    <span class="ob-fr-img">${sc.svg}</span><span class="ob-fr-no" aria-hidden="true">▸ ${String(num ?? n + 1).padStart(2, "0")}A</span><span class="ob-fr-cap"><b>${esc(p[1])}</b><span class="ob-ex">${exifLine(p)}</span></span></a></li>`;
}
const frames = (list, cls = "") => `<ul class="ob-sheet ${cls}" data-frames>${list.map((p) => frame(p)).join("")}</ul>`;
const chips = (label, key, list, all) => `<div class="ob-fg"><p class="ob-fl">${label}</p><ul class="ob-chips" role="group" aria-label="${label}" data-chips="${key}"><li><a href="#filtre" class="is-on" data-v="tout">${all}</a></li>${list.map(([v, l]) => `<li><a href="#filtre" data-v="${esc(v)}">${esc(l)}</a></li>`).join("")}</ul></div>`;
const none = `<div class="ob-none" data-none hidden><div class="ob-none-fr" aria-hidden="true"></div><h2>Aucune vue sur cette planche</h2><p>Aucune photo ne correspond à ces filtres. <a href="#tout" data-reset>Tout afficher</a></p></div>`;

/* ---------- Pages ---------- */
const H0 = P[0], HS = scene(H0, 0);
const home = (c) => [sec(header(c)),
  sec(`<section class="ob-hero pk-bleed"><div class="ob-hero-img">${HS.svg}</div><div class="ob-hero-cap"><p class="ob-kick">Photo de la semaine · vue n° 01A</p><div class="ob-h1" role="heading" aria-level="1">${esc(H0[1])}</div><p class="ob-hero-t">${esc(H0[6])}</p><p class="ob-ex ob-ex--l">${PH[H0[3]].n} · ${esc(H0[5])} · ${exifLine(H0)}</p><div class="ob-actions"><a class="ob-btn" href="/photo">Voir la photo ${ARR}</a><a class="ob-btn ob-btn--line" href="/planche">La planche complète</a></div></div></section>`),
  sec(`<section class="ob-s pk-bleed" data-lightbox-zone><div class="ob-wrap"><div class="ob-sh"><h2>La dernière planche</h2><a class="ob-more" href="/planche">${P.length} vues ${ARR}</a></div>${frames(P.slice(1, 9), "ob-sheet--home")}<p class="ob-fine">Cliquez sur une vue pour l'agrandir ; flèches du clavier pour passer à la suivante, Échap pour fermer.</p></div></section>`),
  sec(`<section class="ob-s ob-s--ink pk-bleed"><div class="ob-wrap"><div class="ob-sh"><h2>Cinq séries en cours</h2><a class="ob-more" href="/series">Toutes les séries ${ARR}</a></div><ul class="ob-series">${SER.map((s, i) => { const f = P.find((p) => p[2] === s); return `<li><a href="/series"><span class="ob-series-img">${scene(f, idx(f[0])).svg}</span><b>${esc(s)}</b><small>${P.filter((p) => p[2] === s).length} vues</small></a></li>`; }).join("")}</ul></div></section>`),
  sec(`<section class="ob-s pk-bleed"><div class="ob-wrap ob-two"><div><p class="ob-kick">Le collectif</p><h2>Quatre regards, une règle</h2><p class="ob-lead">Une vue par semaine et par photographe maximum. Chaque photographie est accompagnée de ce qu'il faut pour la refaire : boîtier, focale, ouverture, vitesse, sensibilité.</p><a class="ob-more" href="/photographes">Rencontrer les photographes ${ARR}</a></div>
    <ul class="ob-people">${Object.values(PH).map((p) => `<li><b>${esc(p.n)}</b><span>${esc(p.r)}</span><small class="ob-ex">${esc(p.gear)}</small></li>`).join("")}</ul></div></section>`),
  sec(footer())];

const planche = (c) => [sec(header(c)), head("La planche", "Toutes les <em>vues</em>", `${P.length} photographies, de juin à octobre. Filtrez par série ou par photographe ; cliquez sur une vue pour l'agrandir avec ses réglages.`),
  sec(`<section class="ob-s ob-s--flush pk-bleed" data-filter="vues"><div class="ob-wrap"><div class="ob-filters">${chips("Série", "serie", SER.map((s) => [slug(s), s]), "Toutes")}${chips("Photographe", "ph", Object.entries(PH).map(([k, v]) => [k, v.n]), "Tous")}</div><p class="ob-count" data-count aria-live="polite"><b>${P.length}</b> vues</p>${none}</div></section>`),
  ...secs(`<section class="ob-s ob-s--flush pk-bleed" data-lightbox-zone><div class="ob-wrap">${frames(P.slice(0, 10))}</div></section>`, `<section class="ob-s ob-s--flush pk-bleed" data-lightbox-zone><div class="ob-wrap">${frames(P.slice(10))}</div></section>`),
  sec(footer())];

const PX = P[0], PXS = scene(PX, 0);
const photo = (c) => [sec(header(c)),
  sec(`<section class="ob-view pk-bleed"><div class="ob-view-img">${PXS.svg}</div><div class="ob-view-side"><div class="ob-crumb" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/planche">Planche</a><span>/</span><span>Villes</span></div>
    <p class="ob-kick">Villes · vue n° 01A</p><div class="ob-h1" role="heading" aria-level="1">${esc(PX[1])}</div><p class="ob-meta"><span>${PH[PX[3]].n}</span><time datetime="${PX[4]}">${fdate(PX[4])}</time><span>${esc(PX[5])}</span></p>
    <p class="ob-cap">${esc(PX[6])}</p>
    <div class="ob-exif" aria-label="Données de prise de vue"><p class="ob-fh">Données de prise de vue</p><dl><dt>Boîtier</dt><dd>${esc(PH[PX[3]].gear.split(" · ")[0])}</dd><dt>Objectif</dt><dd>${esc(PH[PX[3]].gear.split(" · ")[1])}</dd><dt>Focale</dt><dd>${PX[9]} mm</dd><dt>Ouverture</dt><dd>f/${fnum(PX[10])}</dd><dt>Vitesse</dt><dd>${PX[11]} s</dd><dt>Sensibilité</dt><dd>ISO ${PX[12]}</dd><dt>Support</dt><dd>${PH[PX[3]].type}</dd></dl></div></div></section>`),
  sec(`<section class="ob-s pk-bleed"><div class="ob-wrap"><div class="ob-prose"><h2>Notes de prise de vue</h2>
    <p>Il est 6 h 12 quand nous arrivons sur le quai. La brume est montée avec la marée, et le pont de pierre n'est déjà plus qu'une succession d'arches grises dans un blanc de lait. Nous savons que cela ne durera pas : le soleil se lève derrière la rive gauche, et la brume se déchire quand il touche l'eau.</p>
    <p>Le choix du 28 mm tient à une envie simple : garder les arches proches du bord et laisser le fleuve occuper le premier plan. À f/8, tout est net de dix mètres à l'infini, et la vitesse de 1/250 fige les mouettes. Nous avons fait vingt-trois déclenchements ; celui-ci est le douzième.</p>
    <blockquote class="ob-quote"><p>Une photographie de brume se décide avant de la prendre : il faut accepter que presque rien ne soit visible.</p><cite>Inès Marchand</cite></blockquote>
    <h3>Pour refaire cette image</h3><ol><li>Arriver quarante minutes avant le lever du soleil.</li><li>Surexposer d'un tiers de diaphragme pour garder le blanc de la brume.</li><li>Attendre qu'un élément traverse le cadre : un bus, un cycliste, une mouette.</li></ol>
    <div class="ob-pn"><a href="/planche">← Vue précédente</a><a href="/planche">Vue suivante →</a></div></div></div></section>`),
  sec(`<section class="ob-s ob-s--ink pk-bleed" data-lightbox-zone><div class="ob-wrap"><div class="ob-sh"><h2>Dans la même série</h2></div>${frames([P[5], P[9], P[16], P[0]].slice(0, 3), "ob-sheet--three")}</div></section>`),
  sec(footer())];

const series = (c) => [sec(header(c)), head("Séries", "Cinq <em>séries</em> au long cours", "Chaque série est un sujet suivi sur plusieurs mois. Les vues s'ajoutent à la planche au fil des semaines."),
  ...SER.map((s, i) => { const L = P.filter((p) => p[2] === s); const T = ["Les villes vues de haut, de loin et à l'aube : ce qui reste quand les gens ne sont pas encore là.", "Des visages de métier, photographiés avec l'autorisation de chacun et avec la promesse d'un tirage.", "Marches, dunes, lacs et côtes : des paysages qui changent d'heure en heure, au moyen format.", "La photographie de rue, ses cinq secondes de grâce et ses quatre-vingt-quinze secondes d'attente.", "Pose longue, grain poussé, néons et reflets : la ville quand le soleil s'est retiré."][i]; return sec(`<section class="ob-s ${i % 2 ? "ob-s--ink" : ""} pk-bleed" data-lightbox-zone><div class="ob-wrap ob-serie"><div class="ob-serie-tx"><p class="ob-kick">Série ${String(i + 1).padStart(2, "0")} · ${L.length} vues</p><h2>${esc(s)}</h2><p>${esc(T)}</p><a class="ob-more" href="/planche">Voir sur la planche ${ARR}</a></div>${frames(L.slice(0, 4), "ob-sheet--four")}</div></section>`); }),
  sec(footer())];

const photographes = (c) => [sec(header(c)), head("Photographes", "Quatre <em>regards</em>", "Deux travaillent en argentique, deux en numérique. Tous publient leurs réglages."),
  sec(`<section class="ob-s pk-bleed"><div class="ob-wrap"><ul class="ob-team">${Object.entries(PH).map(([k, p], i) => { const f = P.find((x) => x[3] === k); return `<li class="ob-person"><div class="ob-person-img">${scene(f, idx(f[0])).svg}</div><div><p class="ob-kick">${p.type}</p><h2>${esc(p.n)}</h2><p class="ob-role">${esc(p.r)}</p><p>${esc(p.b)}</p><p class="ob-ex">${esc(p.gear)}</p><p class="ob-fine">${P.filter((x) => x[3] === k).length} vues sur la planche</p></div></li>`; }).join("")}</ul></div></section>`),
  sec(footer())];

// Statistiques calculées sur les données de la planche
const bucket = (list, fn) => list.reduce((m, p) => { const k = fn(p); m[k] = (m[k] || 0) + 1; return m; }, {});
const bars = (title, obj, order) => { const mx = Math.max(...Object.values(obj)); return `<div class="ob-stat"><h3>${title}</h3><ul>${order.filter((k) => obj[k]).map((k) => `<li><span class="ob-stat-l">${esc(k)}</span><span class="ob-stat-b"><i class="ob-w${Math.round(obj[k] / mx * 20) * 5}"></i></span><b>${obj[k]}</b></li>`).join("")}</ul></div>`; };
const reglages = (c) => {
  const foc = bucket(P, (p) => (p[9] <= 28 ? "28 mm" : p[9] <= 35 ? "35 mm" : p[9] <= 50 ? "50 mm" : "105 mm"));
  const iso = bucket(P, (p) => (p[12] <= 200 ? "100 à 200" : p[12] <= 800 ? "400 à 800" : "1 600 et plus"));
  const ouv = bucket(P, (p) => (p[10] <= 2 ? "f/1,4 à f/2" : p[10] <= 5.6 ? "f/2,8 à f/5,6" : "f/8 et plus"));
  const sup = bucket(P, (p) => PH[p[3]].type);
  return [sec(header(c)), head("Réglages", "Les <em>données</em> de prise de vue", `Calculées sur les ${P.length} vues de la planche : ce que nous utilisons vraiment, pas ce que nous prétendons utiliser.`),
    sec(`<section class="ob-s pk-bleed"><div class="ob-wrap"><div class="ob-stats">${bars("Focales", foc, ["28 mm", "35 mm", "50 mm", "105 mm"])}${bars("Ouvertures", ouv, ["f/1,4 à f/2", "f/2,8 à f/5,6", "f/8 et plus"])}${bars("Sensibilités", iso, ["100 à 200", "400 à 800", "1 600 et plus"])}${bars("Supports", sup, ["Numérique", "Argentique"])}</div></div></section>`),
    sec(`<section class="ob-s ob-s--ink pk-bleed"><div class="ob-wrap"><div class="ob-sh"><h2>Le matériel de chacun</h2></div><div class="ob-tbl"><table><caption>Boîtiers et objectifs</caption><thead><tr><th scope="col">Photographe</th><th scope="col">Boîtier et objectif</th><th scope="col">Support</th><th scope="col">Vues</th></tr></thead><tbody>${Object.entries(PH).map(([k, p]) => `<tr><td>${esc(p.n)}</td><td>${esc(p.gear)}</td><td>${p.type}</td><td>${P.filter((x) => x[3] === k).length}</td></tr>`).join("")}</tbody></table></div></div></section>`),
    sec(footer())];
};

const contact = (c) => [sec(header(c)), head("Contact", "Écrire au <em>collectif</em>", "Une question sur une prise de vue, une demande de tirage, une proposition de série : une réponse sous une semaine."),
  { type: "form", heading: "Votre message", intro: "Précisez le titre de la vue concernée. Les demandes de tirage sont traitées par le photographe auteur." }, sec(footer())];

const rech = P.map((p) => `<li class="ob-res" data-q="${esc(slug(`${p[1]} ${p[2]} ${p[5]} ${p[7].join(" ")} ${PH[p[3]].n} ${p[6]}`))}"><a href="/photo"><b>${esc(p[1])}</b><small>${esc(p[2])} · ${esc(PH[p[3]].n)} · ${esc(p[5])}</small></a></li>`).join("");
const recherche = (c) => [sec(header(c)), head("Recherche", "Chercher une <em>vue</em>", "Un titre, un lieu, une étiquette, un photographe : la liste se réduit pendant la saisie."),
  sec(`<section class="ob-s pk-bleed"><div class="ob-wrap ob-srch" data-search><p class="ob-fine" data-hint>Saisissez quelques lettres pour filtrer les ${P.length} vues.</p><ul class="ob-results" data-results>${rech}</ul><div class="ob-none" data-none hidden><div class="ob-none-fr" aria-hidden="true"></div><h2>Image sous-exposée : rien à voir</h2><p>Aucune vue ne correspond à cette recherche. Essayez un lieu (« Marseille »), une étiquette (« brume ») ou <a href="/planche">parcourez la planche</a>.</p></div></div></section>`),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans tout le site…" } }] }, sec(footer())];

const introuvable = (c) => [sec(header(c)), sec(`<section class="ob-404 pk-bleed"><div class="ob-404-fr" aria-hidden="true"><span>ISO 25600</span><span>1/8000</span><span>f/22</span></div><div class="ob-404-tx"><p class="ob-kick">Erreur 404 · vue manquante</p><div class="ob-h1" role="heading" aria-level="1">Cette page est <em>hors cadre</em>.</div><p class="ob-lead">L'adresse n'existe pas ou la vue a été retirée de la planche. Revenez à un cadre connu.</p><div class="ob-actions"><a class="ob-btn" href="/">Retour à l'accueil ${ARR}</a><a class="ob-btn ob-btn--line" href="/planche">La planche</a><a class="ob-btn ob-btn--line" href="/recherche">Rechercher</a></div></div></section>`), sec(footer())];

const blocs = (c) => [sec(header(c)), head("Exemples de mise en page", "Tous les <em>blocs</em> du journal", "Titres, listes, citations, images, tableaux, code, boutons et encadrés tels que le thème les met en forme."),
  sec(`<section class="ob-s pk-bleed"><div class="ob-wrap"><div class="ob-prose ob-prose--solo">
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Un paragraphe courant avec un <a href="/planche">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, une <mark>mise en évidence</mark> et une abréviation comme <abbr title="International Organization for Standardization">ISO</abbr>. La ligne reste entre soixante et quatre-vingts caractères sur grand écran.</p>
    <ul><li>Une liste à puces</li><li>Avec plusieurs entrées</li><li>Et un sous-niveau :<ul><li>sous-entrée un</li><li>sous-entrée deux</li></ul></li></ul>
    <ol><li>Une liste numérotée</li><li>Pour les étapes de développement</li><li>Et les réglages</li></ol>
    <blockquote class="ob-quote"><p>Une citation, en grand, avec un filet rouge de lampe inactinique.</p><cite>Auteur de la citation</cite></blockquote>
    <figure class="ob-figure">${scene(P[2], 2).svg}<figcaption>Une légende de photographie. <span class="ob-ex">f/16 · 1/125 · ISO 400</span></figcaption></figure>
    <div class="ob-box"><b>Encadré</b><p>Un encadré « à retenir » pour les conseils de prise de vue.</p></div>
    <div class="ob-tbl"><table><caption>Exposition selon la lumière</caption><thead><tr><th scope="col">Lumière</th><th scope="col">Ouverture</th><th scope="col">Vitesse</th><th scope="col">ISO</th><th scope="col">Remarque</th></tr></thead><tbody><tr><td>Plein soleil</td><td>f/16</td><td>1/125</td><td>100</td><td>La règle des 16</td></tr><tr><td>Ciel couvert</td><td>f/8</td><td>1/125</td><td>200</td><td>Ombres douces</td></tr><tr><td>Intérieur</td><td>f/2</td><td>1/60</td><td>800</td><td>Fenêtre proche</td></tr></tbody></table></div>
    <pre><code>Boîtier : Leica Q2
Focale : 28 mm
Réglages : f/8 · 1/250 · ISO 200</code></pre>
    <p>Du code en ligne : <code>EV = log2(N² / t)</code>.</p>
    <div class="ob-actions"><a class="ob-btn" href="/planche">Bouton principal</a><a class="ob-btn ob-btn--line" href="/series">Bouton secondaire</a></div>
    <div class="ob-cols"><div><h3>Colonne gauche</h3><p>Un texte court en deux colonnes pour comparer deux approches.</p></div><div><h3>Colonne droite</h3><p>La seconde colonne passe sous la première sur mobile.</p></div></div>
    <details><summary>Un volet repliable</summary><p>Le contenu s'affiche à l'ouverture.</p></details>
  </div></div></section>`), sec(footer())];

const legal = (title, kicker, body) => (c) => [sec(header(c)), head(kicker, title, ""), sec(`<section class="ob-s pk-bleed"><div class="ob-wrap"><div class="ob-prose ob-prose--solo">${body}</div></div></section>`), sec(footer())];
const mentions = legal("Mentions <em>légales</em>", "Informations légales", `<h2>Éditeur du site</h2><p>obturateur est un site de démonstration. Éditeur fictif : Collectif Obturateur, 5 quai des Chartrons, 33000 Bordeaux. Directeur de la publication : Paul-Émile Roche. Contact : <a href="/contact">formulaire de contact</a>.</p><h2>Hébergement</h2><p>Le site est hébergé par le prestataire choisi par l'exploitant du CMS. Remplacez ce paragraphe par les coordonnées de votre hébergeur.</p><h2>Droits des images</h2><p>Les images de cette démonstration sont des dessins fictifs. Pour vos propres photographies, précisez ici l'auteur, la licence et les conditions de reproduction ; toute reproduction sans autorisation est interdite.</p><h2>Responsabilité</h2><p>Les personnes, lieux et réglages cités sont inventés pour la démonstration.</p>`);
const confid = legal("Politique de <em>confidentialité</em>", "Vos données", `<h2>Ce que nous collectons</h2><p>Uniquement les informations saisies dans le formulaire de contact (nom, adresse de courriel, message) et les statistiques de fréquentation anonymisées éventuellement activées par l'exploitant du site.</p><h2>Pourquoi</h2><p>Pour répondre à votre message. Aucune donnée n'est vendue ni cédée à des tiers à des fins publicitaires.</p><h2>Photographies de personnes</h2><p>Les portraits publiés sont faits avec l'accord des personnes photographiées, qui peuvent demander leur retrait à tout moment via le <a href="/contact">formulaire de contact</a>.</p><h2>Vos droits</h2><p>Accès, rectification, effacement : écrivez-nous. Les messages sont conservés douze mois au plus.</p>`);

module.exports = {
  key: "obturateur", name: "Obturateur", version: "1.0.0", category: "agence", tags: ["editorial", "sombre", "moderne"], siteType: "Photo-journal et blog de photographes", featured: false, collection: "blog",
  concept: "Une planche-contact : l'image d'abord, numéros de vue sur le bord du film, légendes écrites à la main et données de prise de vue en monospace, avec une visionneuse au clavier.",
  description: "Photo-journal : photo de la semaine en pleine page, planche filtrable par série et photographe, visionneuse avec réglages EXIF, statistiques de prise de vue, quatre photographes et 20 vues de démonstration.",
  brand: "obturateur", modules: ["blog", "formulaires", "recherche"],
  dna: {
    header: "barre-de-viseur-en-monospace-avec-trois-formes-bandeau-rail-lateral-flottant",
    hero: "photo-de-la-semaine-en-pleine-page-avec-legende-et-reglages-en-bas-a-gauche",
    grid: "planche-contact-de-vues-numerotees-sur-bord-de-film",
    typo: "grotesque-excentrique-de-titrage-sans-lecture-sobre-et-monospace-de-reglages",
    shapes: "cadres-de-vue-perforations-de-film-et-diaphragme-dessine",
    motion: "developpement-d-image-qui-apparait-et-visionneuse-au-clavier",
    rhythm: "alternance-gris-papier-photo-et-noir-de-chambre-noire",
    signature: "visionneuse-de-planche-avec-compteur-clavier-et-panneau-de-reglages",
    palette: "gris-papier-photo-noir-de-labo-et-rouge-de-lampe-inactinique",
    image: "scenes-dessinees-en-svg-par-genre-ville-portrait-dune-nuit-rue",
    list: "planche-numerotee-mur-a-colonnes-ou-fil-d-images-pleine-largeur",
    article: "vue-en-grand-avec-colonne-de-legende-et-donnees-de-prise-de-vue",
    sidebar: "panneau-de-reglages-en-monospace-colle-a-cote-de-l-image",
    reading: "notes-de-prise-de-vue-en-colonne-etroite-et-citation-a-filet-rouge",
  },
  tokens: {
    colors: { primary: "#1c1c1c", secondary: "#101010", accent: "#b53a08", background: "#e9e8e4", surface: "#f4f3ef", text: "#101010", muted: "#4f4f4a", success: "#2f6b3f", warning: "#8a5a0a", error: "#a3302a" },
    fonts: { heading: "font.familjen-grotesk", body: "font.heebo", button: "font.jetbrains-mono", link: "font.heebo" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#b8b6ae" },
    type: { h1: { size: 56, weight: 700, lineHeight: 1.05, transform: "none" }, h2: { size: 34, weight: 700, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "lampe", label: "Rouge de lampe inactinique", type: "color", default: "#b53a08" },
    { key: "entete", label: "Forme de l'en-tête", type: "choice", default: "bandeau", choices: [["bandeau", "Bandeau fin en haut"], ["rail", "Rail latéral fixe (grand écran)"], ["flottant", "Flottant : logo et menu seuls"]] },
    { key: "liste", label: "Liste des vues", type: "choice", default: "planche", choices: [["planche", "Planche-contact numérotée"], ["mur", "Mur à colonnes"], ["fil", "Fil d'images pleine largeur"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "large", choices: [["large", "Large : colonnes"], ["discret", "Discret : une ligne"]] },
    { key: "article", label: "Page d'une photo", type: "choice", default: "plein", choices: [["plein", "Pleine largeur : image au-dessus"], ["cote", "Côte à côte : image fixe et légende"]] },
    { key: "chambre", label: "Mode sombre", type: "choice", default: "claire", choices: [["claire", "Table lumineuse"], ["noire", "Chambre noire"]] },
    { key: "exif", label: "Réglages sous les vues", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["La planche", "/planche"], ["Séries", "/series"], ["Photographes", "/photographes"], ["Réglages", "/reglages"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "planche", name: "La planche", render: planche }, { key: "photo", name: "Une photo", render: photo },
    { key: "series", name: "Séries", render: series }, { key: "photographes", name: "Photographes", render: photographes }, { key: "reglages", name: "Réglages et statistiques", render: reglages },
    { key: "blocs", name: "Blocs de mise en page", render: blocs }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche },
    { key: "introuvable", name: "Page introuvable", render: introuvable }, { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confid },
  ],
};
