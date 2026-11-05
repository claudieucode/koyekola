// Clarté — communauté spirituelle œcuménique (fictive). Direction artistique : lumière à travers un vitrail. Ivoire, bleu ciel doux, or pâle ; arches, rosace et rayons
// dessinés en SVG ; barre à sous-menus ; agenda des célébrations (semaine / mois / fichier .ics) et médiathèque de prédications avec lecteur d'extrait simulé.
const { sec, esc } = require("../kit");

const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`; };
const wedge = (r1, r2, a0, a1, fill) => `<path d="M${pt(r1, a0)}L${pt(r2, a0)}L${pt(r2, a1)}L${pt(r1, a1)}Z" fill="${fill}"/>`;
const GLASS = ["#2a5d93", "#d9b45f", "#9cc5e6", "#f1dfa6", "#5f8fbd", "#e8c875"];
// Rosace de vitrail : trois couronnes de segments autour d'une étoile
const rose = (cls = "") => {
  let s = `<svg class="cl-rose ${cls}" viewBox="-100 -100 200 200" aria-hidden="true"><circle r="97" fill="#17304d"/>`;
  for (let i = 0; i < 12; i++) s += wedge(62, 92, i * 30 + 1.5, i * 30 + 28.5, GLASS[i % 2 ? 1 : 0]);
  for (let i = 0; i < 12; i++) s += wedge(36, 58, i * 30 + 16.5, i * 30 + 43.5, GLASS[i % 2 ? 2 : 3]);
  for (let i = 0; i < 8; i++) s += `<polygon points="0 0 ${pt(31, i * 45 - 9)} ${pt(31, i * 45)} ${pt(31, i * 45 + 9)}" fill="${GLASS[i % 2 ? 3 : 4]}"/>`;
  s += `<circle r="9" fill="#d9b45f"/><circle r="95" fill="none" stroke="#d9b45f" stroke-width="2"/></svg>`;
  return s;
};
// Fenêtre en lancette : arc brisé, œil central et losanges
const lancet = (cls = "", seed = 0) => {
  const c = (i) => GLASS[(i + seed) % GLASS.length];
  let s = `<svg class="cl-lancet ${cls}" viewBox="0 0 120 240" aria-hidden="true"><path d="M6 236V98Q6 34 60 3Q114 34 114 98V236Z" fill="#17304d"/><path d="M14 228V98Q14 42 60 15Q106 42 106 98V228Z" fill="#cfe3f3" opacity=".25"/>`;
  s += `<circle cx="60" cy="72" r="27" fill="${c(2)}"/><circle cx="60" cy="72" r="18" fill="${c(1)}"/><polygon points="60 56 66 72 60 88 54 72" fill="${c(0)}"/><polygon points="44 72 60 66 76 72 60 78" fill="${c(0)}"/>`;
  [136, 164, 192, 220].forEach((y, r) => [28, 60, 92].forEach((x, k) => { s += `<polygon points="${x} ${y - 13} ${x + 17} ${y} ${x} ${y + 13} ${x - 17} ${y}" fill="${c(r + k)}"/>`; }));
  return s + `<path d="M6 236V98Q6 34 60 3Q114 34 114 98V236Z" fill="none" stroke="#d9b45f" stroke-width="2.5"/></svg>`;
};
const rays = (n = 15) => {
  let s = `<svg class="cl-raysvg" viewBox="-500 -500 1000 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">`;
  for (let i = 0; i < n; i++) { const a = -86 + i * (172 / (n - 1)), w = 2.4 + (i % 3); s += `<polygon points="0 0 ${(900 * Math.sin((a - w) * Math.PI / 180)).toFixed(0)} ${(-900 * Math.cos((a - w) * Math.PI / 180)).toFixed(0)} ${(900 * Math.sin((a + w) * Math.PI / 180)).toFixed(0)} ${(-900 * Math.cos((a + w) * Math.PI / 180)).toFixed(0)}" fill="#fff6d6" opacity="${i % 2 ? 0.35 : 0.6}"/>`; }
  return s + `</svg>`;
};
const ICONS = {
  sun: `<circle cx="24" cy="24" r="8" fill="currentColor"/><path d="M24 4v8M24 36v8M4 24h8M36 24h8M10 10l6 6M32 32l6 6M38 10l-6 6M16 32l-6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  book: `<path d="M6 10c7-3 13-2 18 2v28c-5-4-11-5-18-2zM42 10c-7-3-13-2-18 2v28c5-4 11-5 18-2z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`,
  hands: `<path d="M6 22c0 12 8 20 18 20s18-8 18-20z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M24 4c5 6 7 9 7 12a7 7 0 0 1-14 0c0-3 2-6 7-12z" fill="currentColor"/>`,
  note: `<path d="M18 36V10l22-4v26" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="12" cy="37" r="6" fill="currentColor"/><circle cx="34" cy="33" r="6" fill="currentColor"/>`,
  child: `<circle cx="24" cy="12" r="7" fill="currentColor"/><path d="M10 42c0-12 5-20 14-20s14 8 14 20z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`,
  door: `<path d="M10 44V18Q10 6 24 4Q38 6 38 18v26z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="31" cy="28" r="2.6" fill="currentColor"/>`,
  dove: `<path d="M4 28c10-2 14-8 14-16 6 4 8 10 8 14 6-1 10-5 14-12 0 14-8 26-24 26-6 0-10-3-12-12z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`,
  table: `<path d="M6 18h36M10 18v22M38 18v22M14 10h20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
};
const icon = (k) => `<svg class="cl-ico" viewBox="0 0 48 48" aria-hidden="true">${ICONS[k]}</svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SITE = "Communauté de la Clarté";

// ----- navigation à sous-menus -----
const NAV = [
  ["Accueil", "/", null],
  ["Célébrations", "/celebrations", [["Agenda des célébrations", "/celebrations"], ["Médiathèque de prédications", "/mediatheque"]]],
  ["Communauté", "/groupes", [["Groupes et vie fraternelle", "/groupes"], ["Actualités", "/actualites"]]],
  ["À propos", "/apropos", [["Notre foi et nos valeurs", "/apropos"], ["Nous rejoindre", "/rejoindre"]]],
  ["Contact", "/contact", null],
];
const navDesk = () => NAV.map(([l, u, sub]) => sub
  ? `<div class="cl-dd"><a class="cl-dd-t" href="${u}">${l}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></a><div class="cl-sub">${sub.map(([a, b]) => `<a href="${b}">${a}</a>`).join("")}</div></div>`
  : `<a class="cl-nl" href="${u}">${l}</a>`).join("");
const navMob = () => NAV.map(([l, u, sub]) => sub
  ? `<div class="cl-mg"><a class="cl-mt" href="${u}">${l}</a>${sub.map(([a, b]) => `<a class="cl-ms" href="${b}">${a}</a>`).join("")}</div>`
  : `<div class="cl-mg"><a class="cl-mt" href="${u}">${l}</a></div>`).join("");

const header = () => `<header class="cl-head pk-bleed"><div class="cl-bar">
  <a class="cl-logo" href="/" aria-label="${SITE} — accueil">${rose("cl-logo-r")}<span><b>Clarté</b><small>Communauté ouverte</small></span></a>
  <div class="cl-nav" role="navigation" aria-label="Navigation principale">${navDesk()}</div>
  <a class="cl-btn cl-btn--sm cl-cta" href="/rejoindre">Venir dimanche</a>
  <details class="cl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cl-drawer" role="navigation" aria-label="Menu mobile">${navMob()}<a class="cl-btn" href="/rejoindre">Venir dimanche</a></div></details>
</div></header>`;

const footer = () => `<footer class="cl-foot pk-bleed"><div class="cl-foot-glow" aria-hidden="true">${rose("cl-foot-r")}</div><div class="cl-wrap">
  <div class="cl-foot-grid"><div><p class="cl-foot-brand">${SITE}</p><p class="cl-foot-verse">« Ta parole est une lampe à mon pied, et une lumière sur mon sentier. »<br><small>Psaume 119, 105</small></p><address>8 rue des Tilleuls<br>Rivemont</address></div>
  <div><h2>Célébrer</h2><a href="/celebrations">Agenda</a><a href="/mediatheque">Médiathèque</a><a href="/rejoindre">Première visite</a></div>
  <div><h2>Communauté</h2><a href="/groupes">Groupes</a><a href="/actualites">Actualités</a><a href="/apropos">Notre foi</a></div>
  <div><h2>Nous joindre</h2><a href="/contact">Écrire à l'accueil</a><a href="/recherche">Rechercher</a><a href="mailto:accueil@clarte-demo.example">accueil@clarte-demo.example</a></div></div>
  <p class="cl-legal">© ${SITE} — site de démonstration. Communauté, personnes, lieux et événements fictifs. Ouverte à toutes et à tous, quelle que soit la sensibilité.</p></div></footer>`;

const pagehead = (kicker, title, sub, seed = 0) => sec(`<section class="cl-ph pk-bleed"><div class="cl-ph-rays" aria-hidden="true">${rays(11)}</div><div class="cl-wrap cl-ph-in"><div class="cl-ph-txt"><p class="cl-kicker" data-reveal>${esc(kicker)}</p><div class="cl-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="cl-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div><div class="cl-ph-win" aria-hidden="true">${lancet("", seed)}${lancet("cl-lancet--b", seed + 2)}</div></div></section>`);

// ----- données -----
const TYPES = [["celebration", "Célébrations"], ["priere", "Prière"], ["musique", "Musique"], ["familles", "Familles"], ["communaute", "Rencontres"]];
const EV = [
  { dow: 0, t: "10:00", d: 90, ty: "celebration", n: "Célébration dominicale", p: "Sanctuaire", x: "Chants, lectures, message et temps de prière. Ouverte à toutes et à tous." },
  { dow: 0, t: "10:00", d: 90, ty: "familles", n: "Éveil des enfants", p: "Salle des Lucioles", x: "Un temps adapté aux 3-11 ans pendant le message." },
  { dow: 0, t: "11:45", d: 60, ty: "communaute", n: "Café-rencontre", p: "Parvis couvert", x: "Boissons chaudes et conversation après la célébration." },
  { dow: 2, t: "19:30", d: 45, ty: "priere", n: "Veillée de prière", p: "Chapelle", x: "Silence, psaume et intentions partagées à voix haute ou en pensée." },
  { dow: 3, t: "18:30", d: 90, ty: "musique", n: "Répétition de la chorale", p: "Salle Cécile", x: "Chants du dimanche, tous niveaux. Ni audition ni solfège exigés." },
  { dow: 4, t: "12:15", d: 30, ty: "priere", n: "Prière de midi", p: "Chapelle", x: "Une pause de trente minutes au cœur de la journée." },
  { dow: 5, t: "19:00", d: 120, ty: "familles", n: "Soirée des jeunes", p: "Salle des Lucioles", x: "Repas, jeux et discussion libre pour les 13-25 ans." },
  { dow: 6, t: "17:30", d: 40, ty: "priere", n: "Vêpres chantées", p: "Sanctuaire", x: "Office du soir chanté à la lumière des bougies." },
  { date: "2026-11-15", t: "16:00", d: 75, ty: "musique", n: "Concert d'orgue d'automne", p: "Sanctuaire", x: "Œuvres de Bach et de Franck. Entrée libre." },
  { date: "2026-11-22", t: "12:00", d: 180, ty: "communaute", n: "Repas partagé de l'automne", p: "Salle Cécile", x: "Chacun apporte un plat à partager ; tables ouvertes aux voisins." },
  { date: "2026-11-29", t: "18:00", d: 60, ty: "celebration", n: "Veillée de l'Avent", p: "Sanctuaire", x: "Première bougie de l'Avent, chants et lectures." },
  { date: "2026-12-24", t: "18:00", d: 60, ty: "celebration", n: "Veillée de Noël", p: "Sanctuaire", x: "Contes, chants et lumières, pensée pour les familles." },
  { date: "2026-12-25", t: "10:30", d: 75, ty: "celebration", n: "Célébration de Noël", p: "Sanctuaire", x: "Célébration festive suivie d'un goûter partagé." },
  { date: "2027-01-10", t: "10:00", d: 90, ty: "communaute", n: "Dimanche d'accueil des nouveaux", p: "Sanctuaire", x: "Une célébration pensée pour celles et ceux qui arrivent." },
  { date: "2027-02-14", t: "17:00", d: 75, ty: "musique", n: "Concert de la chorale", p: "Sanctuaire", x: "Chants du monde, entrée libre." },
];
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const hm = (t) => t.replace(":", " h ");
const evStatic = () => EV.map((e) => `<article class="cl-ev" data-type="${e.ty}" data-time="${e.t}" data-dur="${e.d}" ${e.date ? `data-date="${e.date}"` : `data-dow="${e.dow}"`}><p class="cl-ev-w">${e.date ? new Date(e.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Chaque " + DAYS[e.dow].toLowerCase()} · ${hm(e.t)}</p><h3 class="cl-ev-t">${esc(e.n)}</h3><p class="cl-ev-p">${esc(e.p)}</p><p class="cl-ev-d">${esc(e.x)}</p></article>`).join("");

const SM = [
  { th: "confiance", n: "Marcher dans la confiance", w: "Élise Marchand", dt: "2 nov. 2026", len: 420, notes: ["La confiance se pratique avant de se ressentir.", "Un pas à la fois suffit pour avancer.", "Se laisser accompagner n'est pas un échec."], tr: [[0, "Accueil", "Bonjour à toutes et à tous. Avant de commencer, prenons une respiration ensemble et laissons derrière nous l'agitation de la semaine."], [95, "Le récit", "Imaginez un voyageur au crépuscule : il ne voit que quelques mètres de chemin. La lanterne n'éclaire pas tout, mais assez pour le prochain pas."], [210, "Ce que cela change", "Faire confiance, ce n'est pas tout comprendre. C'est accepter d'avancer avec ce que l'on a et de recevoir l'aide de ceux qui marchent à nos côtés."], [330, "Pour la semaine", "Cette semaine, choisissez une petite chose à confier plutôt qu'à porter seul. Puis remarquez ce qui se passe."]] },
  { th: "service", n: "Le repas partagé", w: "Thomas Roche, invité", dt: "26 oct. 2026", len: 360, notes: ["Une table ouverte raconte plus qu'un long discours.", "Partager, c'est d'abord se rendre disponible.", "Chacun a quelque chose à apporter."], tr: [[0, "Ouverture", "Il y a des moments où une soupe chaude dit plus qu'un grand discours. C'est de ces repas-là que je voudrais vous parler ce matin."], [80, "La table", "Dans notre quartier, une table a été dressée chaque jeudi pendant un hiver. Personne n'était invité, et pourtant tout le monde se sentait attendu."], [190, "Les mains", "On croit souvent qu'aider, c'est donner beaucoup. Parfois c'est simplement tenir la porte, éplucher des légumes, écouter jusqu'au bout."], [290, "Envoi", "Que chacun reparte avec une question simple : à quelle table puis-je m'asseoir, ou laquelle puis-je ouvrir ?"]] },
  { th: "paix", n: "Une paix qui se construit", w: "Hélène Duval", dt: "19 oct. 2026", len: 480, notes: ["La paix est un travail de patience.", "Écouter avant de répondre désarme déjà beaucoup.", "Commencer petit : un voisin, une famille, un atelier."], tr: [[0, "Introduction", "La paix n'est pas l'absence de bruit. Elle ressemble plutôt à une maison que l'on bâtit, pierre après pierre, avec des gestes parfois minuscules."], [120, "Les fondations", "Première pierre : écouter sans préparer sa réponse. Deuxième : reconnaître que l'autre a ses raisons, même quand nous ne les partageons pas."], [250, "Les difficultés", "Il y aura des fissures. Une parole de travers, un malentendu. Réparer fait partie de la construction ; ce n'est pas un aveu d'échec."], [380, "Prière finale", "Donne-nous la patience des bâtisseurs et la joie de ceux qui ouvrent les fenêtres. Amen, ou simplement : ainsi soit-il."]] },
  { th: "priere", n: "Prier sans savoir dire", w: "Élise Marchand", dt: "12 oct. 2026", len: 300, notes: ["Le silence est déjà une forme de prière.", "Quelques mots simples suffisent.", "Prier à plusieurs allège ce qui pèse."], tr: [[0, "Accueil", "Beaucoup d'entre nous avouent ne pas savoir prier. Rassurez-vous : il n'y a pas de formule obligatoire ni de niveau à atteindre."], [70, "Trois gestes", "S'asseoir. Respirer lentement. Nommer en une phrase ce qui occupe notre cœur : merci, aide-moi, pardon, ou simplement : me voici."], [160, "Le silence", "Le silence n'est pas un vide à remplir. C'est un espace où quelque chose peut arriver, y compris rien du tout, et c'est déjà bien."], [235, "Exercice", "Nous allons maintenant faire une minute de silence. Si votre esprit s'égare, revenez doucement à votre respiration."]] },
  { th: "service", n: "Les mains ouvertes", w: "Samuel Okoye", dt: "5 oct. 2026", len: 390, notes: ["Servir, c'est accepter d'être aussi servi.", "Un engagement durable commence petit.", "La gratitude change le regard sur la fatigue."], tr: [[0, "Ouverture", "On parle beaucoup de service, parfois comme d'une charge. Ce matin, je voudrais le décrire comme une manière de respirer ensemble."], [100, "Deux histoires", "Un jardinier bénévole et une bibliothécaire de quartier. Ni l'un ni l'autre ne se disent héroïques ; tous deux disent recevoir autant qu'ils donnent."], [220, "Garder le souffle", "S'engager sans s'épuiser demande de dire non parfois, de se reposer, de demander de l'aide. Les mains ouvertes savent aussi recevoir."], [320, "Envoi", "Pensez à une action modeste que vous pouvez tenir : une visite par mois, une heure d'accueil, une course pour un voisin."]] },
  { th: "esperance", n: "Veilleurs d'aube", w: "Hélène Duval", dt: "28 sept. 2026", len: 420, notes: ["Espérer n'est pas se rassurer à bon compte.", "Les veilleurs préparent le jour sans le provoquer.", "La lumière se partage mieux qu'elle ne se garde."], tr: [[0, "Accueil", "Il existe un métier ancien et discret : celui de veilleur. Il reste éveillé quand les autres dorment, et il guette les premières lueurs."], [100, "L'attente", "Espérer ne consiste pas à se répéter que tout ira bien. C'est regarder l'obscurité en face et continuer à tourner la tête vers l'est."], [230, "Une lumière commune", "Quand une bougie en allume une autre, la première ne perd rien. L'espérance se transmet de la même façon, sans diminuer."], [340, "Pour avancer", "Cette semaine, soyez le veilleur de quelqu'un : un message, un appel, une présence silencieuse à une heure où l'on est seul."]] },
];
const THEMES = [["confiance", "Confiance"], ["priere", "Prière"], ["paix", "Paix"], ["service", "Service"], ["esperance", "Espérance"]];
const mm = (s) => `${Math.floor(s / 60)} min`;
const sermonRow = (s, i) => `<article class="cl-sm" data-cat="${s.th}" data-len="${s.len}" data-i="${i}"><span class="cl-sm-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div class="cl-sm-b"><p class="cl-sm-th">${THEMES.find((t) => t[0] === s.th)[1]}</p><h3 class="cl-sm-t">${esc(s.n)}</h3><p class="cl-sm-m">${esc(s.w)} · ${s.dt} · extrait de ${mm(s.len)}</p>
  <div class="cl-sm-a"><a href="#ecouter" class="cl-play" data-i="${i}">${arrow}<span>Écouter l'extrait</span></a></div>
  <details class="cl-notes"><summary>Notes et transcription</summary><ul>${s.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><div class="cl-tr">${s.tr.map(([t, c, x]) => `<p data-t="${t}" data-ch="${esc(c)}">${esc(x)}</p>`).join("")}</div></details></div></article>`;

// ----- briques de page -----
const filterBar = (label, forCls, items, extra = "") => `<div class="cl-filters ${extra}" role="group" aria-label="${esc(label)}" data-for="${forCls}"><a href="#tous" class="is-on" data-f="all" role="button" aria-pressed="true">Tout</a>${items.map(([k, l]) => `<a href="#${k}" data-f="${k}" role="button" aria-pressed="false">${l}</a>`).join("")}<span class="cl-count" role="status" aria-live="polite"></span></div>`;

const agenda = () => sec(`<section class="cl-ag pk-bleed"><div class="cl-wrap">
  <div class="cl-ag-bar"><div class="cl-seg" role="group" aria-label="Affichage"><a href="#semaine" class="is-on" data-view="week" role="button" aria-pressed="true">Semaine</a><a href="#mois" data-view="month" role="button" aria-pressed="false">Mois</a></div>
  <div class="cl-pager"><a href="#prec" data-go="-1" aria-label="Période précédente">‹</a><span class="cl-ag-title" role="status" aria-live="polite">Semaine type</span><a href="#suiv" data-go="1" aria-label="Période suivante">›</a><a href="#auj" data-go="0" class="cl-today">Aujourd'hui</a></div></div>
  <div class="cl-chips" role="group" aria-label="Filtrer par type de rendez-vous"><a href="#tous" class="is-on" data-type="all" role="button" aria-pressed="true">Tout</a>${TYPES.map(([k, l]) => `<a href="#${k}" class="cl-ty-${k}" data-type="${k}" role="button" aria-pressed="false">${l}</a>`).join("")}</div>
  <div class="cl-ag-out"></div>
  <p class="cl-ag-note">Le bouton « Ajouter au calendrier » télécharge un fichier .ics, lisible par la plupart des agendas. Horaires de démonstration.</p>
  <div class="cl-ag-static"><h2 class="cl-h2">Rendez-vous de la communauté</h2><div class="cl-ag-list">${evStatic()}</div></div></div></section>`);

const SERMON_UI = () => sec(`<section class="cl-med pk-bleed"><div class="cl-wrap cl-med-in">
  <div class="cl-med-list">${filterBar("Filtrer les prédications par thème", ".cl-sms", THEMES)}<div class="cl-sms">${SM.map(sermonRow).join("")}</div></div>
  <aside class="cl-pl" aria-label="Lecteur d'extrait"><p class="cl-pl-sim">Lecture simulée · aucun son n'est émis</p><p class="cl-pl-th"></p><h2 class="cl-pl-title">Choisissez une prédication</h2><p class="cl-pl-meta"></p>
    <div class="cl-pl-ctl"><a href="#reculer" data-pl="-15" aria-label="Reculer de 15 secondes">−15 s</a><a href="#lecture" class="cl-pl-play" data-pl="play" aria-label="Lecture"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="cl-i-play" d="M8 5v14l11-7z" fill="currentColor"/><path class="cl-i-pause" d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg></a><a href="#avancer" data-pl="15" aria-label="Avancer de 15 secondes">+15 s</a><a href="#vitesse" data-pl="speed" class="cl-pl-sp" aria-label="Vitesse de lecture">×1</a></div>
    <div class="cl-seek" aria-label="Position dans l'extrait"><span class="cl-seek-fill"></span></div><p class="cl-pl-time"><span class="cl-t-now">0:00</span><span class="cl-t-len">0:00</span></p>
    <h3 class="cl-pl-h">Chapitres</h3><ol class="cl-chs"></ol><h3 class="cl-pl-h">Transcription</h3><div class="cl-trs" aria-live="off"></div></aside></div></section>`);

// ----- accueil -----
const home = () => [
  sec(header()),
  sec(`<section class="cl-hero pk-bleed"><div class="cl-rays" aria-hidden="true">${rays(17)}</div><div class="cl-hero-win cl-hero-win--l" aria-hidden="true">${lancet("", 0)}</div><div class="cl-hero-win cl-hero-win--r" aria-hidden="true">${lancet("", 3)}</div>
    <div class="cl-arch"><div class="cl-arch-rose" aria-hidden="true">${rose("")}</div><p class="cl-kicker" data-reveal>Communauté ouverte · Rivemont</p>
      <div class="cl-h1 cl-h1--hero" role="heading" aria-level="1" data-reveal>Une maison ouverte, <em>une lumière</em> qui se partage</div>
      <blockquote class="cl-verse" data-reveal><p>« Ta parole est une lampe à mon pied, et une lumière sur mon sentier. »</p><footer>Psaume 119, 105</footer></blockquote>
      <div class="cl-actions" data-reveal><a class="cl-btn" href="/celebrations">Voir les célébrations ${arrow}</a><a class="cl-btn cl-btn--ghost" href="/rejoindre">Préparer ma première visite</a></div></div>
    <aside class="cl-times" aria-label="Prochains horaires" data-reveal><h2 class="cl-times-h">Prochains<br>horaires</h2><ul>
      <li data-nextdow="0" data-time="10:00"><b>Dimanche · 10 h 00</b><span>Célébration dominicale</span><small class="cl-nx">Chaque dimanche</small></li>
      <li data-nextdow="2" data-time="19:30"><b>Mardi · 19 h 30</b><span>Veillée de prière</span><small class="cl-nx">Chaque mardi</small></li>
      <li data-nextdow="6" data-time="17:30"><b>Samedi · 17 h 30</b><span>Vêpres chantées</span><small class="cl-nx">Chaque samedi</small></li></ul></aside></section>`),
  sec(`<section class="cl-pil pk-bleed"><div class="cl-wrap"><div class="cl-center"><p class="cl-kicker" data-reveal>Bienvenue</p><h2 class="cl-h2" data-reveal>Trois portes, une même lumière</h2><p class="cl-lead" data-reveal>Venez comme vous êtes, avec vos questions et vos silences. Personne n'a besoin de connaître les gestes ou les mots pour trouver sa place.</p></div>
    <div class="cl-pil-grid">
    <article class="cl-pc" data-reveal><div class="cl-pc-top">${icon("door")}</div><h3>Accueillir</h3><p>Un café, un sourire, des bénévoles pour vous guider. Les enfants et les personnes à mobilité réduite ont leur place dès l'entrée.</p><a class="cl-more" href="/rejoindre">Première visite ${arrow}</a></article>
    <article class="cl-pc cl-pc--mid" data-reveal><div class="cl-pc-top">${icon("sun")}</div><h3>Célébrer</h3><p>Chants, lectures, silence et message. Une célébration sobre et chaleureuse, ouverte à toutes les sensibilités chrétiennes et aux curieux.</p><a class="cl-more" href="/celebrations">Agenda ${arrow}</a></article>
    <article class="cl-pc" data-reveal><div class="cl-pc-top">${icon("hands")}</div><h3>Servir</h3><p>Repas partagés, visites, accompagnement scolaire : des groupes simples pour vivre l'entraide au quotidien.</p><a class="cl-more" href="/groupes">Vie de communauté ${arrow}</a></article></div></div></section>`),
  sec(`<section class="cl-agt pk-bleed"><div class="cl-wrap"><div class="cl-sechead"><div><p class="cl-kicker" data-reveal>Cette semaine</p><h2 class="cl-h2" data-reveal>Au programme</h2></div><a class="cl-more" href="/celebrations" data-reveal>Tout l'agenda ${arrow}</a></div>
    <div class="cl-agt-grid">
    <article class="cl-c cl-t-celebration" data-reveal data-nextdow="0" data-time="10:00"><p class="cl-c-h"><b>10 h 00</b><span>Célébration</span></p><h3>Célébration dominicale</h3><p class="cl-c-p">Sanctuaire · 90 min</p><p class="cl-c-d">Chants, lectures, message et prière.</p><small class="cl-nx">Chaque dimanche</small></article>
    <article class="cl-c cl-t-priere" data-reveal data-nextdow="2" data-time="19:30"><p class="cl-c-h"><b>19 h 30</b><span>Prière</span></p><h3>Veillée de prière</h3><p class="cl-c-p">Chapelle · 45 min</p><p class="cl-c-d">Silence, psaume et intentions partagées.</p><small class="cl-nx">Chaque mardi</small></article>
    <article class="cl-c cl-t-musique" data-reveal data-nextdow="3" data-time="18:30"><p class="cl-c-h"><b>18 h 30</b><span>Musique</span></p><h3>Répétition de la chorale</h3><p class="cl-c-p">Salle Cécile · 90 min</p><p class="cl-c-d">Tous niveaux, sans audition.</p><small class="cl-nx">Chaque mercredi</small></article>
    <article class="cl-c cl-t-familles" data-reveal data-nextdow="5" data-time="19:00"><p class="cl-c-h"><b>19 h 00</b><span>Familles</span></p><h3>Soirée des jeunes</h3><p class="cl-c-p">Salle des Lucioles · 2 h</p><p class="cl-c-d">Repas, jeux et discussion libre.</p><small class="cl-nx">Chaque vendredi</small></article></div></div></section>`),
  sec(`<section class="cl-medt pk-bleed"><div class="cl-wrap cl-medt-in"><div class="cl-medt-txt"><p class="cl-kicker" data-reveal>Médiathèque</p><h2 class="cl-h2" data-reveal>Réécouter, relire, méditer</h2><p class="cl-lead" data-reveal>Chaque semaine, un extrait de la prédication est mis en ligne avec ses chapitres, ses notes et sa transcription.</p><a class="cl-btn" href="/mediatheque" data-reveal>Ouvrir la médiathèque ${arrow}</a></div>
    <ol class="cl-medt-list">${SM.slice(0, 3).map((s, i) => `<li data-reveal><a href="/mediatheque"><span class="cl-medt-n">${String(i + 1).padStart(2, "0")}</span><span class="cl-medt-b"><b>${esc(s.n)}</b><small>${esc(s.w)} · ${s.dt}</small></span><span class="cl-medt-d">${mm(s.len)}</span></a></li>`).join("")}</ol></div></section>`),
  sec(`<section class="cl-word pk-bleed"><div class="cl-word-glow" aria-hidden="true">${rose("")}</div><div class="cl-wrap cl-word-in"><figure data-reveal><blockquote><p>« Nous ne cherchons pas à convaincre, seulement à tenir la porte ouverte et la lampe allumée. »</p></blockquote><figcaption><b>Élise Marchand</b>, responsable de la communauté (personnage fictif)</figcaption></figure></div></section>`),
  sec(`<section class="cl-news pk-bleed"><div class="cl-wrap"><div class="cl-sechead"><div><p class="cl-kicker" data-reveal>Actualités</p><h2 class="cl-h2" data-reveal>Dans la vie de la communauté</h2></div><a class="cl-more" href="/actualites" data-reveal>Toutes les nouvelles ${arrow}</a></div>
    <div class="cl-news-grid">
    <a class="cl-nc" href="/actualites" data-reveal><time>29 novembre</time><h3>Veillée de l'Avent : allumons la première bougie</h3><p>Chants, lectures et lumières, pour entrer ensemble dans le temps de l'attente.</p></a>
    <a class="cl-nc" href="/actualites" data-reveal><time>15 novembre</time><h3>Un concert d'orgue pour l'automne</h3><p>Entrée libre, pour écouter l'orgue rénové du sanctuaire.</p></a>
    <a class="cl-nc" href="/actualites" data-reveal><time>8 novembre</time><h3>Les jardins partagés cherchent des mains</h3><p>Une matinée de plantation ouverte à toute la ville.</p></a></div></div></section>`),
  sec(`<section class="cl-band pk-bleed"><div class="cl-wrap cl-band-in"><div>${lancet("cl-lancet--s", 1)}</div><div><h2 class="cl-h2" data-reveal>Première visite ?</h2><p class="cl-lead" data-reveal>Nous vous expliquons tout simplement : où se garer, comment se déroule la célébration, ce que vivent les enfants.</p><a class="cl-btn" href="/rejoindre" data-reveal>Préparer ma visite ${arrow}</a></div></div></section>`),
  sec(footer()),
];

// ----- célébrations -----
const celebrations = () => [
  sec(header()), pagehead("Agenda", "Les célébrations<br>et les rendez-vous", "Semaine, mois, filtres par type : retrouvez chaque rencontre et ajoutez-la à votre agenda.", 1), agenda(),
  sec(`<section class="cl-flow pk-bleed"><div class="cl-wrap"><div class="cl-center"><p class="cl-kicker" data-reveal>Déroulé</p><h2 class="cl-h2" data-reveal>Une célébration dominicale, pas à pas</h2></div>
    <ol class="cl-tl">
    <li data-reveal><span class="cl-tl-h">9 h 45</span><div><h3>Accueil</h3><p>Les portes ouvrent quinze minutes avant. Des bénévoles vous orientent et accueillent les enfants.</p></div></li>
    <li data-reveal><span class="cl-tl-h">10 h 00</span><div><h3>Chants et ouverture</h3><p>Deux ou trois chants, un mot de bienvenue et la lecture d'un psaume. Les paroles sont affichées.</p></div></li>
    <li data-reveal><span class="cl-tl-h">10 h 25</span><div><h3>Lectures et message</h3><p>Un texte, un message d'environ vingt minutes, puis un temps de silence. Les enfants rejoignent leur salle.</p></div></li>
    <li data-reveal><span class="cl-tl-h">10 h 55</span><div><h3>Prière et partage</h3><p>Intentions déposées à voix haute ou dans une corbeille, geste de paix, annonces de la semaine.</p></div></li>
    <li data-reveal><span class="cl-tl-h">11 h 30</span><div><h3>Bénédiction et café</h3><p>La célébration se termine par une bénédiction. On prolonge autour d'un café sur le parvis couvert.</p></div></li></ol></div></section>`),
  sec(`<section class="cl-info pk-bleed"><div class="cl-wrap cl-info-grid">
    <article data-reveal>${icon("door")}<h3>Venir</h3><p>8 rue des Tilleuls, Rivemont. Arrêt de bus « Parvis » à deux minutes ; stationnement de vélos dans la cour.</p></article>
    <article data-reveal>${icon("child")}<h3>Avec des enfants</h3><p>Éveil des enfants pendant le message, coin de repos pour les tout-petits, table à langer.</p></article>
    <article data-reveal>${icon("dove")}<h3>Accessibilité</h3><p>Entrée de plain-pied, places réservées, boucle auditive, documents en gros caractères sur demande.</p></article></div></section>`),
  sec(footer()),
];

// ----- médiathèque -----
const mediatheque = () => [
  sec(header()), pagehead("Médiathèque", "Prédications<br>à réécouter", "Extraits, chapitres, notes et transcription. La lecture est simulée dans cette démonstration.", 2), SERMON_UI(),
  sec(`<section class="cl-series pk-bleed"><div class="cl-wrap"><div class="cl-sechead"><div><p class="cl-kicker" data-reveal>Séries</p><h2 class="cl-h2" data-reveal>Parcours thématiques</h2></div></div>
    <div class="cl-series-grid">
    <article data-reveal><span>I</span><h3>Les chemins de la confiance</h3><p>Quatre messages pour avancer quand tout n'est pas clair.</p><small>4 prédications · automne 2026</small></article>
    <article data-reveal><span>II</span><h3>À la table de tous</h3><p>Partage, hospitalité et service au quotidien.</p><small>3 prédications · automne 2026</small></article>
    <article data-reveal><span>III</span><h3>Attendre la lumière</h3><p>Le parcours de l'Avent, semaine après semaine.</p><small>4 prédications · à venir</small></article></div></div></section>`),
  sec(footer()),
];

// ----- groupes -----
const GROUPS = [
  ["familles", "child", "Éveil des enfants", "3-11 ans", "Chaque dimanche, pendant le message : histoires, bricolages et chants adaptés à l'âge.", "Dimanche 10 h"],
  ["jeunes", "sun", "Soirées des jeunes", "13-25 ans", "Repas, jeux, débats libres et projets solidaires. On y vient sans rien préparer.", "Vendredi 19 h"],
  ["musique", "note", "Chorale Clarté", "Tous niveaux", "Quarante voix, un répertoire du chant grégorien aux chants du monde. Aucune audition.", "Mercredi 18 h 30"],
  ["etude", "book", "Cercle d'étude", "Adultes", "Lire ensemble un texte, comparer les traductions, poser les questions sans tabou.", "Jeudi 20 h, une semaine sur deux"],
  ["service", "table", "Repas partagés", "Tout public", "Un repas mensuel ouvert aux voisins. On cuisine, on met la table, on discute.", "Un dimanche par mois"],
  ["service", "hands", "Visites et écoute", "Équipe de bénévoles", "Passer du temps avec les personnes seules ou malades, sans autre but que la présence.", "Selon disponibilités"],
  ["etude", "dove", "Dialogue des sensibilités", "Adultes", "Rencontres avec d'autres traditions chrétiennes, pour apprendre à se connaître.", "Un samedi par trimestre"],
  ["musique", "note", "Atelier orgue et piano", "Débutants bienvenus", "Découvrir le clavier du sanctuaire avec un musicien de la communauté.", "Samedi 14 h"],
];
const groupes = () => [
  sec(header()), pagehead("Vie de communauté", "Des groupes<br>à taille humaine", "Chacun peut y trouver sa place, quel que soit son âge, son parcours ou son temps disponible.", 3),
  sec(`<section class="cl-grp pk-bleed"><div class="cl-wrap">${filterBar("Filtrer les groupes", ".cl-gmos", [["familles", "Enfants"], ["jeunes", "Jeunes"], ["musique", "Musique"], ["etude", "Étude"], ["service", "Entraide"]])}
    <div class="cl-gmos">${GROUPS.map(([cat, ic, t, who, x, when], i) => `<article class="cl-g cl-g${i % 4}" data-cat="${cat}" data-reveal><div class="cl-g-ico">${icon(ic)}</div><p class="cl-g-who">${who}</p><h3>${esc(t)}</h3><p>${esc(x)}</p><p class="cl-g-when"><b>${when}</b></p></article>`).join("")}</div></div></section>`),
  sec(`<section class="cl-year pk-bleed"><div class="cl-wrap"><div class="cl-center"><p class="cl-kicker" data-reveal>Au fil de l'année</p><h2 class="cl-h2" data-reveal>Un calendrier qui suit les saisons</h2></div>
    <ol class="cl-year-row"><li data-reveal><b>Septembre</b><span>Dimanche de rentrée, pique-nique au parc</span></li><li data-reveal><b>Décembre</b><span>Avent, veillée de Noël, marché solidaire</span></li><li data-reveal><b>Mars</b><span>Semaine de silence et de partage</span></li><li data-reveal><b>Juin</b><span>Fête de la musique et de la communauté</span></li></ol></div></section>`),
  sec(`<section class="cl-band pk-bleed"><div class="cl-wrap cl-band-in"><div>${lancet("cl-lancet--s", 4)}</div><div><h2 class="cl-h2">Proposer un groupe</h2><p class="cl-lead">Une idée d'atelier, de rencontre ou de service ? Parlons-en : la communauté se construit avec ce que chacun apporte.</p><a class="cl-btn" href="/contact">Écrire à l'accueil ${arrow}</a></div></div></section>`),
  sec(footer()),
];

// ----- à propos -----
const apropos = () => [
  sec(header()), pagehead("À propos et foi", "Une communauté<br>qui cherche la lumière", "Nous sommes une assemblée chrétienne œcuménique : ouverte à toutes les sensibilités, sans polémique.", 5),
  sec(`<section class="cl-ab pk-bleed"><div class="cl-wrap cl-ab-in"><aside class="cl-ab-side" data-reveal><div class="cl-ab-rose" aria-hidden="true">${rose("")}</div><p class="cl-ab-q">« Ouvrir la porte, allumer la lumière. »</p><small>Notre devise</small></aside>
    <div class="cl-ab-main"><h2 class="cl-h2" data-reveal>Ce qui nous rassemble</h2><p class="cl-lead" data-reveal>Nous nous réunissons autour de la lecture des textes bibliques, de la prière et du service du prochain. Des personnes de traditions différentes y cohabitent, avec leurs sensibilités et leurs questions.</p>
      <p data-reveal>Nous ne demandons à personne de signer une déclaration. Nous proposons un lieu pour prier, réfléchir, se taire, chanter et agir ensemble. Chacun avance à son rythme.</p>
      <h3 class="cl-h3" data-reveal>Ce que nous vivons ensemble</h3>
      <div class="cl-acc" data-reveal><details><summary>La prière et le silence</summary><p>La prière est libre : psaumes, chants, silence ou mots simples. Nul n'est obligé de prier à voix haute.</p></details>
      <details><summary>Les textes bibliques</summary><p>Nous lisons la Bible en plusieurs traductions et accueillons les lectures diverses, dans le respect de chacun.</p></details>
      <details><summary>Le service des autres</summary><p>Repas, visites, accompagnement : la foi se vit aussi dans les gestes concrets, auprès des personnes de tous horizons.</p></details>
      <details><summary>Le dialogue entre traditions</summary><p>Nous invitons régulièrement d'autres communautés chrétiennes à partager leur chemin, et restons ouverts aux questions de ceux qui cherchent.</p></details></div></div></div></section>`),
  sec(`<section class="cl-val pk-bleed"><div class="cl-wrap"><div class="cl-center"><p class="cl-kicker" data-reveal>Valeurs</p><h2 class="cl-h2" data-reveal>Quatre repères</h2></div><div class="cl-val-grid">
    <article data-reveal>${icon("door")}<h3>Hospitalité</h3><p>Chacun est accueilli comme il est.</p></article><article data-reveal>${icon("dove")}<h3>Paix</h3><p>Nous évitons les querelles et cherchons la rencontre.</p></article><article data-reveal>${icon("book")}<h3>Écoute</h3><p>Des textes, des personnes, des questions.</p></article><article data-reveal>${icon("hands")}<h3>Service</h3><p>Des gestes simples, durables, à taille humaine.</p></article></div></div></section>`),
  sec(`<section class="cl-hist pk-bleed"><div class="cl-wrap"><div class="cl-center"><p class="cl-kicker" data-reveal>Histoire</p><h2 class="cl-h2" data-reveal>Quelques repères</h2></div><ol class="cl-hist-row">
    <li data-reveal><b>1987</b><span>Quelques familles se retrouvent dans une salle paroissiale prêtée.</span></li><li data-reveal><b>1996</b><span>Le sanctuaire des Tilleuls ouvre ses portes à plusieurs traditions.</span></li><li data-reveal><b>2009</b><span>Naissance de la chorale et des repas partagés.</span></li><li data-reveal><b>2024</b><span>Rénovation de l'orgue et accessibilité complète du lieu.</span></li></ol></div></section>`),
  sec(`<section class="cl-team pk-bleed"><div class="cl-wrap"><div class="cl-sechead"><div><p class="cl-kicker" data-reveal>L'équipe</p><h2 class="cl-h2" data-reveal>Celles et ceux qui vous accueillent</h2></div></div><div class="cl-team-grid">
    ${[["Élise Marchand", "Responsable de la communauté"], ["Samuel Okoye", "Accueil et service"], ["Hélène Duval", "Prédication et études"], ["Paul Lenoir", "Musique et orgue"]].map(([n, r], i) => `<article class="cl-tm" data-reveal><div class="cl-tm-a" aria-hidden="true">${lancet("", i)}</div><h3>${n}</h3><p>${r}</p></article>`).join("")}</div><p class="cl-muted">Personnages fictifs, présentés à titre de démonstration.</p></div></section>`),
  sec(footer()),
];

// ----- nous rejoindre -----
const rejoindre = () => [
  sec(header()), pagehead("Nous rejoindre", "Votre première<br>visite", "Pas d'inscription, pas de tenue imposée : il suffit de pousser la porte.", 4),
  sec(`<section class="cl-steps pk-bleed"><div class="cl-wrap"><ol class="cl-steps-grid">
    <li data-reveal><span>1</span><h3>Venir</h3><p>Dimanche à 9 h 45. L'accueil est sur le parvis ; vous pouvez rester en retrait si vous préférez.</p></li>
    <li data-reveal><span>2</span><h3>Écouter</h3><p>Chants, lectures et message. Rien n'est demandé : ni réponse, ni geste, ni contribution.</p></li>
    <li data-reveal><span>3</span><h3>Échanger</h3><p>Le café-rencontre à 11 h 45 permet de poser des questions à l'équipe ou à d'autres visiteurs.</p></li>
    <li data-reveal><span>4</span><h3>Prolonger</h3><p>Quand vous voudrez, découvrez un groupe, un repas ou un temps de prière.</p></li></ol></div></section>`),
  sec(`<section class="cl-plan pk-bleed"><div class="cl-wrap cl-plan-in"><div><p class="cl-kicker" data-reveal>Conseils sur mesure</p><h2 class="cl-h2" data-reveal>Qui êtes-vous ?</h2><p class="cl-lead" data-reveal>Choisissez la situation qui vous ressemble : nous vous suggérons un rendez-vous.</p>
    <div class="cl-who" role="group" aria-label="Votre situation" data-reveal>
    <a href="#seul" data-plan data-t="Venir seul(e) ou en curieux" data-x="Dimanche 10 h, au fond du sanctuaire si vous le souhaitez. Le café-rencontre à 11 h 45 est un bon moment pour parler sans engagement." role="button" aria-pressed="false">Je viens seul(e)</a>
    <a href="#famille" data-plan data-t="Venir en famille" data-x="Dimanche 10 h : l'Éveil des enfants accueille les 3-11 ans pendant le message. Arrivez à 9 h 45 pour faire connaissance avec l'équipe." role="button" aria-pressed="false">J'ai des enfants</a>
    <a href="#jeune" data-plan data-t="Jeune de 13 à 25 ans" data-x="Vendredi 19 h : repas, jeux et discussion libre à la salle des Lucioles. Vous pouvez venir avec un ami." role="button" aria-pressed="false">J'ai moins de 25 ans</a>
    <a href="#prier" data-plan data-t="Chercher le calme" data-x="Jeudi 12 h 15 ou mardi 19 h 30 : une prière courte et silencieuse dans la chapelle, sans parole obligatoire." role="button" aria-pressed="false">Je cherche le calme</a></div></div>
    <div class="cl-plan-out" role="status" aria-live="polite"><p class="cl-plan-t">Choisissez une situation</p><p>Votre suggestion apparaîtra ici.</p><a class="cl-btn cl-btn--ghost" href="/contact">Poser une question à l'accueil</a></div></div></section>`),
  sec(`<section class="cl-faq pk-bleed"><div class="cl-wrap cl-faq-in"><h2 class="cl-h2" data-reveal>Questions fréquentes</h2><div class="cl-acc" data-reveal>
    <details><summary>Faut-il être baptisé ou croyant ?</summary><p>Non. Toute personne est la bienvenue, croyante, en recherche ou simplement curieuse.</p></details>
    <details><summary>Comment s'habiller ?</summary><p>Comme vous le souhaitez. Il n'y a pas de tenue particulière.</p></details>
    <details><summary>Y a-t-il une quête obligatoire ?</summary><p>Non. Une corbeille est proposée en fin de célébration, la participation est libre et facultative.</p></details>
    <details><summary>Peut-on venir sans parler ?</summary><p>Bien sûr. On peut participer silencieusement et repartir sans avoir échangé un mot.</p></details></div></div></section>`),
  sec(footer()),
];

// ----- actualités -----
const NEWS = [
  ["vie", "29 novembre 2026", "Veillée de l'Avent : allumons la première bougie", "Chants, lectures et lumières pour entrer ensemble dans le temps de l'attente. Ouverte à tous, pensée aussi pour les familles."],
  ["culture", "15 novembre 2026", "Un concert d'orgue pour l'automne", "L'orgue rénové du sanctuaire résonne avec Bach et Franck. Entrée libre, places non réservées."],
  ["solidarite", "8 novembre 2026", "Les jardins partagés cherchent des mains", "Une matinée de plantation ouverte à toute la ville, avec outils et goûter fournis."],
  ["vie", "25 octobre 2026", "Merci pour la rentrée", "Plus de cent personnes au pique-nique de rentrée : retour en images et en sourires."],
  ["solidarite", "11 octobre 2026", "Un repas partagé chaque mois", "Le prochain repas partagé aura lieu en novembre. Inscrivez un plat à apporter auprès de l'accueil."],
  ["culture", "27 septembre 2026", "La chorale recrute des voix", "Aucune audition : venez essayer un mercredi soir, partitions et accueil fournis."],
];
const actualites = () => [
  sec(header()), pagehead("Actualités", "Les nouvelles<br>de la communauté", "Rendez-vous à venir, retours sur les rencontres et appels à participer.", 0),
  sec(`<section class="cl-nl2 pk-bleed"><div class="cl-wrap">${filterBar("Filtrer les actualités", ".cl-nlist", [["vie", "Vie de la communauté"], ["culture", "Musique et culture"], ["solidarite", "Solidarité"]])}
    <div class="cl-nlist">${NEWS.map(([c, d, t, x], i) => `<a class="cl-ni${i === 0 ? " cl-ni--top" : ""}" href="/contact" data-cat="${c}" data-reveal><time>${d}</time><div><h3>${esc(t)}</h3><p>${esc(x)}</p><span class="cl-more">En parler à l'accueil ${arrow}</span></div></a>`).join("")}</div></div></section>`),
  sec(footer()),
];

const contact = () => [sec(header()), pagehead("Contact", "Écrivez-nous", "Une question, une demande de visite, une idée de groupe : l'accueil vous répond sous quelques jours.", 2),
  { type: "form", heading: "Écrire à l'accueil", intro: "Dites-nous qui vous êtes et ce que vous cherchez ; nous répondrons avec simplicité." },
  sec(`<section class="cl-info pk-bleed"><div class="cl-wrap cl-info-grid"><article>${icon("door")}<h3>Adresse</h3><address>8 rue des Tilleuls<br>Rivemont</address></article><article>${icon("sun")}<h3>Permanence</h3><p>Mardi et jeudi, de 14 h à 17 h, à l'accueil du parvis.</p></article><article>${icon("book")}<h3>Par courriel</h3><p><a href="mailto:accueil@clarte-demo.example">accueil@clarte-demo.example</a></p></article></div></section>`),
  sec(footer())];
const recherche = () => [sec(header()), pagehead("Rechercher", "Que cherchez-vous&nbsp;?", "Une célébration, une prédication, un groupe.", 1), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer())];
const introuvable = () => [sec(header()), sec(`<section class="cl-404 pk-bleed"><div class="cl-404-w" aria-hidden="true">${lancet("", 2)}</div><div class="cl-404-t"><p class="cl-kicker">Chemin égaré</p><div class="cl-h1" role="heading" aria-level="1">Cette page est introuvable</div><p class="cl-ph-sub">Elle a peut-être changé d'adresse. Revenez à la lumière du jour.</p><a class="cl-btn" href="/">Retour à l'accueil ${arrow}</a></div></section>`), sec(footer())];

module.exports = {
  key: "clarte", name: "Clarté", version: "2.0.0", category: "association", tags: ["classique", "geometrique", "luxe"], siteType: "Communauté spirituelle œcuménique", featured: false,
  concept: "La lumière d'un vitrail : arche de lumière, rosace et lancettes dessinées en SVG, agenda des célébrations avec export .ics et médiathèque de prédications à lecteur simulé.",
  description: "Communauté spirituelle œcuménique : ivoire, bleu ciel et or pâle, arche de lumière et vitraux géométriques, agenda semaine/mois avec fichier .ics, médiathèque de prédications, groupes et première visite.",
  brand: SITE, modules: ["formulaires", "recherche"],
  dna: { header: "barre-ivoire-sous-menus-deroulants", hero: "arche-de-lumiere-rayons-verset-et-horaires", grid: "agenda-en-cartes-et-mediatheque-en-liste", motion: "rayons-de-lumiere-et-lecteur-simule", shapes: "arches-lancettes-et-rosace-de-vitrail", rhythm: "solennel-lumineux-alterne-ciel-et-ivoire", signature: "agenda-des-celebrations-ics-et-mediatheque-de-predications" },
  tokens: {
    colors: { primary: "#2a5d93", secondary: "#17304d", accent: "#d9b45f", background: "#fbf6e8", surface: "#ffffff", text: "#23324a", muted: "#55627a", success: "#1f7a52", warning: "#8a6a1f", error: "#b3362f" },
    fonts: { heading: "font.cormorant-garamond", body: "font.nunito-sans", button: "font.nunito-sans", link: "font.nunito-sans" },
    radius: { sm: 6, md: 12, lg: 24, button: 999, field: 10, card: 14 }, shadow: { card: "0 10px 30px rgba(23,48,77,.10)", button: "0 6px 16px rgba(42,93,147,.25)" }, border: { width: 1, color: "#e4d7b0" },
    type: { h1: { size: 72, weight: 600, lineHeight: 1.02 }, h2: { size: 46, weight: 600, lineHeight: 1.08 } },
  },
  options: [
    { key: "accent", label: "Bleu des vitraux", type: "color", default: "#2a5d93" },
    { key: "gold", label: "Or des filets", type: "color", default: "#d9b45f" },
    { key: "rays", label: "Rayons de lumière", type: "choice", default: "on", choices: [["on", "Animés"], ["off", "Fixes"]] },
    { key: "glass", label: "Intensité des vitraux", type: "choice", default: "soft", choices: [["soft", "Douce"], ["vivid", "Vive"]] },
  ],
  menu: [["Accueil", "/"], ["Célébrations", "/celebrations"], ["Médiathèque", "/mediatheque"], ["Groupes", "/groupes"], ["À propos", "/apropos"], ["Nous rejoindre", "/rejoindre"], ["Actualités", "/actualites"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "celebrations", name: "Célébrations", render: celebrations }, { key: "mediatheque", name: "Médiathèque", render: mediatheque },
    { key: "groupes", name: "Groupes et vie de communauté", render: groupes }, { key: "apropos", name: "À propos et foi", render: apropos }, { key: "rejoindre", name: "Nous rejoindre", render: rejoindre },
    { key: "actualites", name: "Actualités", render: actualites }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
