// Ricochet — page de liens (« link in bio »), mobile d'abord. Créatrice fictive : Maëlle Rivière, illustratrice et autrice de bandes dessinées. Direction artistique : une colonne d'ardoise nocturne,
// ondes concentriques d'un galet qui ricoche, liens en « galets » qui rebondissent à l'arrivée, vagues d'encre au toucher, compte à rebours réel de précommande, boutons « copier » et « partager »,
// barre d'onglets en bas de l'écran sur mobile. Tout est démonstration : personne, liens et dates fictifs (les liens sortants pointent vers example.org).
// Les liens sont écrits dans les pages du thème (le bloc « lien en bio » du CMS reste utilisable à côté) ; le filtre, la copie et le compte à rebours sont dans motion.js.
const { sec, esc, nav } = require("../kit");
const common = require("./communes");

const IC = {
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  bag: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  mail: '<path d="M3 6h18v12H3zM3 7l9 7 9-7"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM8 20a3 3 0 0 1-3-3"/>',
  cam: '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
  pen: '<path d="m4 20 1-5L16 4l4 4L9 19zM14 6l4 4"/>',
  heart: '<path d="M12 20S4 15 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.700l1-1"/>',
  arr: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
};
const ic = (k, c = "rc-i") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

const U = "https://example.org/maelle";
// [id, rubrique, titre, sous-titre, icône, adresse, pastille]
const LINKS = [
  ["album", "creations", "Galets — mon nouvel album", "Précommande ouverte, dédicace incluse", "book", `${U}/galets`, "Nouveau"],
  ["estampes", "boutique", "La boutique d'estampes", "Impressions numérotées, format A4 et A3", "bag", `${U}/boutique`, ""],
  ["newsletter", "me-lire", "La lettre du mardi", "Un dessin, trois liens, zéro bruit", "mail", `${U}/lettre`, ""],
  ["atelier", "creations", "Atelier de dessin en ligne", "Quatre soirées, prochaine session en janvier", "pen", `${U}/atelier`, "12 places"],
  ["podcast", "ecouter", "Le podcast « Marges »", "Conversations avec des autrices, 38 épisodes", "mic", `${U}/marges`, ""],
  ["video", "ecouter", "Dessiner sans stress, en vidéo", "Série de 12 séances de 10 minutes", "play", `${U}/video`, ""],
  ["carnet", "me-lire", "Le carnet de bord", "Coulisses, ratés et croquis", "pen", "/actus", ""],
  ["insta", "reseaux", "Instagram", "Le dessin du jour", "cam", `${U}/instagram`, ""],
  ["fedi", "reseaux", "Mastodon", "Nouvelles brèves et discussions", "link", `${U}/mastodon`, ""],
  ["tube", "reseaux", "Chaîne vidéo", "Time-lapses et tutoriels", "play", `${U}/chaine`, ""],
  ["dons", "boutique", "Soutenir le travail", "Don libre, à partir de 3 € par mois", "heart", `${U}/soutien`, ""],
  ["presse", "me-lire", "Kit de presse", "Photos, biographie, extraits", "star", "/a-propos", ""],
  ["pro", "boutique", "Commandes et illustration jeunesse", "Livres, affiches, identités : devis sous 5 jours", "mail", "/contact", ""],
  ["archives", "creations", "Archives des planches", "Toutes les planches en ligne, par album", "book", `${U}/archives`, ""],
];
const CAT = { creations: "Créations", boutique: "Boutique et soutien", ecouter: "Écouter, regarder", "me-lire": "Me lire", reseaux: "Réseaux" };
const ext = (u) => u.startsWith("https://");
const rowOf = (l, big = false) => {
  const [id, cat, t, s, i, u, b] = l;
  return `<div class="rc-row" data-cat="${cat}" data-hay="${esc((t + " " + s + " " + CAT[cat]).toLowerCase())}"><a class="rc-link${big ? " rc-link--big" : ""}" href="${esc(u)}"${ext(u) ? ' target="_blank"' : ""}><span class="rc-ico">${ic(i)}</span><span class="rc-txt"><b>${esc(t)}</b><small>${esc(s)}</small></span>${b ? `<span class="rc-pill">${b}</span>` : ""}<span class="rc-go">${ic("arr")}</span></a><a class="rc-copy" href="#copier" role="button" data-rc-copy="${ext(u) ? esc(u) : esc("https://example.org" + u)}" aria-label="Copier le lien : ${esc(t)}">${ic("copy")}</a></div>`;
};

const FACE = '<svg class="rc-face" viewBox="0 0 120 120" role="img" aria-label="Portrait dessiné de Maëlle Rivière"><circle cx="60" cy="60" r="60" fill="#ff6f91"/><path d="M22 120c0-26 16-36 38-36s38 10 38 36z" fill="#5ee6c6"/><circle cx="60" cy="56" r="26" fill="#f6d3b3"/><path d="M32 58c-4-30 20-40 34-34 16 0 28 14 22 34-4-14-14-18-26-18-14 0-24 6-30 18z" fill="#2a1d3d"/><circle cx="50" cy="58" r="8" fill="none" stroke="#2a1d3d" stroke-width="3"/><circle cx="70" cy="58" r="8" fill="none" stroke="#2a1d3d" stroke-width="3"/><path d="M58 58h4" stroke="#2a1d3d" stroke-width="3"/><path d="M52 72q8 7 16 0" fill="none" stroke="#2a1d3d" stroke-width="3" stroke-linecap="round"/></svg>';
const RIP = '<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="currentColor"><circle class="rc-w rc-w1" cx="200" cy="130" r="24"/><circle class="rc-w rc-w2" cx="200" cy="130" r="24"/><circle class="rc-w rc-w3" cx="200" cy="130" r="24"/><circle class="rc-w rc-w4" cx="200" cy="130" r="24"/></g></svg>';
const SOC = [["cam", "Instagram", `${U}/instagram`], ["link", "Mastodon", `${U}/mastodon`], ["play", "Chaîne vidéo", `${U}/chaine`], ["mic", "Podcast", `${U}/marges`], ["mail", "Lettre du mardi", `${U}/lettre`]];
const socials = () => `<div class="rc-soc">${SOC.map(([i, n, u]) => `<a href="${u}" target="_blank" aria-label="${n}">${ic(i)}</a>`).join("")}</div>`;

// ---------- structure commune ----------
const header = (c) => `<header class="rc-head pk-bleed"><div class="rc-head-in"><a class="rc-brand" href="/"><span class="rc-brand-dot" aria-hidden="true"></span>Ricochet<small>maëlle rivière</small></a><div class="rc-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "rc-nl")}</div><details class="rc-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="rc-bmenu">${nav(c.menu, "rc-bl")}<a class="rc-bl" href="/recherche">Rechercher</a></div></details></div></header>
<div class="rc-tabs pk-bleed" role="navigation" aria-label="Onglets"><a href="/">${ic("home")}<span>Liens</span></a><a href="/liens">${ic("list")}<span>Tout</span></a><a href="/actus">${ic("pen")}<span>Carnet</span></a><a href="/a-propos">${ic("user")}<span>Moi</span></a><a href="/recherche">${ic("search")}<span>Chercher</span></a></div>`;
const footer = () => `<footer class="rc-foot pk-bleed"><div class="rc-col"><div class="rc-foot-card">${socials()}<p>Ricochet est un thème de page de liens. Maëlle Rivière, ses liens, ses albums et ses dates sont fictifs.</p></div><p class="rc-foot-l"><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a><a href="/contact">Contact</a><a href="/blocs">Blocs</a><a class="rc-share" href="#partager" role="button" data-rc-share>${ic("share")} Partager cette page</a></p><p class="rc-copyr">© Ricochet — site de démonstration.</p></div></footer>`;
const page = (eyebrow, title, lead) => `<section class="rc-ph pk-bleed"><div class="rc-ripples" aria-hidden="true">${RIP}</div><div class="rc-col"><p class="rc-eyebrow">${eyebrow}</p><div class="rc-h1" role="heading" aria-level="1">${title}</div><p class="rc-lead">${lead}</p></div></section>`;
const body = (h, cls = "") => sec(`<section class="rc-sec pk-bleed${cls ? " " + cls : ""}"><div class="rc-col">${h}</div></section>`);

// ---------- accueil : la page de liens ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="rc-stage pk-bleed"><div class="rc-ripples" aria-hidden="true">${RIP}</div><div class="rc-col rc-prof"><span class="rc-avatar">${FACE}</span><div class="rc-h1" role="heading" aria-level="1">Maëlle Rivière</div><p class="rc-handle">@maelle.galets · illustratrice et autrice de BD</p><p class="rc-bio">Je dessine des histoires de mer, de familles bruyantes et de goûters qui tournent mal. Voici tout ce que je fais, au même endroit.</p>${socials()}</div></section>`),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col"><div class="rc-feat"><p class="rc-eyebrow">Précommande ouverte</p><h2 class="rc-h2">Galets, l'album</h2><p>Quarante-huit pages, une dédicace dessinée et un marque-page imprimé pour les cent premiers.</p><div class="rc-count" data-rc-countdown="2026-12-15T23:59:00"><span><b data-d>--</b>jours</span><span><b data-h>--</b>heures</span><span><b data-m>--</b>min</span><span><b data-s>--</b>s</span></div><p class="rc-count-n" data-rc-cd-text>Précommande jusqu'au 15 décembre 2026.</p><a class="rc-btn" href="${U}/galets" target="_blank">Précommander ${ic("arr")}</a></div></div></section>`),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col"><h2 class="rc-h2">Mes liens</h2><div class="rc-links">${LINKS.slice(0, 8).map((l) => rowOf(l)).join("")}</div><a class="rc-all" href="/liens">Voir les ${LINKS.length} liens, par rubrique ${ic("arr")}</a></div></section>`),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col"><div class="rc-news"><h2 class="rc-h3">La lettre du mardi</h2><p>Un dessin, trois liens, zéro bruit. Écrivez-moi pour vous inscrire : je vous réponds en personne.</p><a class="rc-btn rc-btn--line" href="/contact">S'inscrire ${ic("arr")}</a></div></div></section>`),
  sec(footer()),
];

// ---------- tous les liens (archive filtrable) ----------
const liens = (c) => [
  sec(header(c)),
  sec(page("Tous les liens", "Tout ce que je fais", "Quatorze liens, rangés par rubrique. Filtrez, cherchez, copiez l'adresse d'un lien pour l'envoyer à quelqu'un.")),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col"><div class="rc-filters" role="group" aria-label="Rubriques"><a class="rc-chip is-on" href="#tout" role="button" data-rc-f="tout">Tout</a>${Object.entries(CAT).map(([k, v]) => `<a class="rc-chip" href="#${k}" role="button" data-rc-f="${k}">${v}</a>`).join("")}</div><div class="rc-fsearch" data-rc-search></div><p class="rc-count-o" data-rc-count aria-live="polite">${LINKS.length} liens</p><div class="rc-links rc-links--all" data-rc-list>${LINKS.map((l) => rowOf(l)).join("")}</div><div class="rc-empty rc-hid" data-rc-empty><p class="rc-empty-t">Aucun lien ne correspond.</p><p>Retirez la recherche ou <a href="#tout" data-rc-reset>réaffichez tous les liens</a>.</p></div></div></section>`),
  sec(footer()),
];

// ---------- carnet (actualités) ----------
const POSTS = [
  ["Un galet qui ricoche sept fois", "2026-11-03", "Coulisses", "Comment une planche ratée est devenue la couverture de l'album : trois versions, un éclat de rire et une tasse de thé renversée."],
  ["Les cent premières dédicaces", "2026-10-27", "Album", "Un marque-page, une phrase, un petit dessin : le choix des dédicaces pour les cent premières précommandes."],
  ["Dessiner debout, dessiner assis", "2026-10-19", "Atelier", "Ce que j'ai appris en changeant de posture pendant un mois, et pourquoi mon poignet me remercie."],
  ["Cinq encres testées sur du papier à grain", "2026-10-11", "Matériel", "Test sans prétention de cinq encres noires sur trois papiers, avec les taches en prime."],
  ["Marges, épisode 38 : écrire pour les enfants", "2026-10-02", "Podcast", "Une conversation avec l'autrice Salomé Brière sur les histoires qu'on n'ose pas raconter aux adultes."],
  ["Mon carnet de voyage à Ouessant", "2026-09-24", "Voyage", "Trois jours, un vent à décorner les mouettes, onze pages dessinées au crayon et à la gouache."],
  ["Pourquoi je réponds à tous les messages", "2026-09-15", "Coulisses", "Une règle simple, parfois fatigante, qui m'a offert mes meilleures rencontres."],
  ["Les planches de la saison un", "2026-09-06", "Archives", "Retour sur la première série en ligne : choix, abandons et planches préférées des lecteurs."],
];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
const actus = (c) => [
  sec(header(c)),
  sec(page("Le carnet", "Les derniers ricochets", "Coulisses, tests de matériel, épisodes du podcast : un billet court quand j'ai quelque chose à dire.")),
  body(`<div class="rc-posts">${POSTS.map(([t, d, k, x], i) => `<article class="rc-post"><p class="rc-post-k"><span>${k}</span><time datetime="${d}">${dfr(d)}</time></p><h3 class="rc-post-t"><a href="/actu">${esc(t)}</a></h3><p class="rc-post-x">${esc(x)}</p><a class="rc-more" href="/actu">Lire le billet ${ic("arr")}</a></article>`).join("")}</div><p class="rc-fine">Les billets pointent vers le billet modèle du thème.</p>`),
  sec(footer()),
];
const actu = (c) => [
  sec(header(c)),
  sec(`<section class="rc-ph rc-ph--post pk-bleed"><div class="rc-ripples" aria-hidden="true">${RIP}</div><div class="rc-col"><div class="rc-crumbs" role="navigation" aria-label="Fil d'Ariane"><a href="/">Liens</a><span aria-hidden="true">/</span><a href="/actus">Carnet</a></div><p class="rc-post-k"><span>Coulisses</span><time datetime="2026-11-03">3 novembre 2026</time><span>4 min de lecture</span></p><div class="rc-h1" role="heading" aria-level="1">Un galet qui ricoche sept fois</div><p class="rc-lead">Comment une planche ratée est devenue la couverture de l'album.</p></div></section>`),
  body(`<div class="rc-prose"><p>La couverture de « Galets » n'était pas prévue. C'était une page d'essai, griffonnée un soir de novembre pour tester une encre bleue, et que j'ai failli jeter trois fois.</p><h2>Le premier jet</h2><p>Sur la première version, le galet ne ricochait pas : il coulait. Mon éditrice a dit, avec beaucoup de tact, que la couverture ressemblait à un enterrement. Elle avait raison.</p><blockquote><p>Un dessin raté est un dessin qui n'a pas encore trouvé son mouvement.</p><cite>Maëlle Rivière</cite></blockquote><h2>Trois versions</h2><ol><li>Le galet qui coule, trop sombre ;</li><li>Le galet en plein vol, trop sage ;</li><li>Sept ronds dans l'eau et un petit personnage qui rit : la bonne.</li></ol><h3>Ce que j'en retiens</h3><p>Garder les ratés. Ils servent de preuve que le chemin existe, et de matière pour la prochaine fois. Les trois versions sont affichées dans l'atelier en ligne, si vous voulez voir la différence.</p><div class="rc-note"><strong>À lire aussi.</strong> Les <a href="/actus">autres billets du carnet</a> et la <a href="/liens">liste de tous mes liens</a>.</div></div><div class="rc-authorbox"><span class="rc-avatar rc-avatar--s">${FACE}</span><div><b>Maëlle Rivière</b><p>Illustratrice et autrice, installée à Rennes. Fictive, comme tout le reste de cette démonstration.</p></div></div>`),
  sec(footer()),
];
const apropos = (c) => [
  sec(header(c)),
  sec(page("À propos", "Qui dessine ici ?", "Une autrice de bandes dessinées qui préfère les histoires de mer et les goûters qui tournent mal.")),
  body(`<div class="rc-prose"><h2>En quelques lignes</h2><p>Maëlle Rivière vit à Rennes, dessine à la gouache et à l'encre de Chine, et publie ses planches en ligne avant de les imprimer. Trois albums, un podcast et un atelier de dessin en ligne.</p><h2>Parcours</h2><ul><li><b>2016.</b> Premier fanzine photocopié, tiré à 80 exemplaires ;</li><li><b>2019.</b> Premier album « Marée basse », sélection d'un festival de BD ;</li><li><b>2022.</b> Lancement du podcast « Marges » ;</li><li><b>2026.</b> « Galets », le troisième album.</li></ul><h2>Kit de presse</h2><p>Biographie courte, trois portraits libres de droits et des extraits de planches sont disponibles sur demande via la <a href="/contact">page de contact</a>.</p></div>`),
  sec(footer()),
];
const contact = (c) => [
  sec(header(c)),
  sec(page("Contact", "Écrivez-moi", "Commande, presse, dédicace, simple bonjour : je réponds à tout, parfois avec un dessin.")),
  { type: "form", heading: "Votre message", intro: "Dites-moi qui vous êtes et ce dont vous avez besoin. Le formulaire fonctionne comme sur un vrai site, mais cette démonstration ne l'envoie à personne." },
  body(`<div class="rc-note"><strong>Délais.</strong> Réponse sous cinq jours ouvrés. Pour une commande d'illustration, précisez l'usage, le format et l'échéance.</div>`),
  sec(footer()),
];
const recherche = (c) => [
  sec(header(c)),
  sec(page("Recherche", "Chercher un lien, un billet", "Un mot suffit.")),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un lien ou un billet…" } }] },
  body(`<div class="rc-empty"><p class="rc-empty-t">Rien ne correspond ?</p><p>Essayez un mot plus court, ou parcourez <a href="/liens">tous les liens</a> et <a href="/actus">le carnet</a>.</p></div>`),
  sec(footer()),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="rc-ph rc-404 pk-bleed"><div class="rc-ripples" aria-hidden="true">${RIP}</div><div class="rc-col"><p class="rc-eyebrow">Erreur 404</p><div class="rc-h1" role="heading" aria-level="1">Plouf. Cette page a coulé.</div><p class="rc-lead">Le galet a ricoché six fois puis disparu : ce lien n'existe plus. Retournez sur la rive.</p><div class="rc-stone" aria-hidden="true"><svg viewBox="0 0 200 60"><ellipse class="rc-stone-s" cx="30" cy="30" rx="16" ry="9" fill="#ff6f91"/></svg></div><div class="rc-actions"><a class="rc-btn" href="/">Retour aux liens ${ic("arr")}</a><a class="rc-btn rc-btn--line" href="/liens">Tous les liens</a></div></div></section>`),
  sec(footer()),
];
const wrapLegal = (c, parts) => [sec(header(c)), ...parts, sec(footer())];

module.exports = {
  key: "ricochet", name: "Ricochet", version: "1.0.0", category: "divertissement", tags: ["moderne", "ludique", "sombre"], siteType: "Page de liens (link in bio)", collection: "pro", featured: false,
  concept: "Une page de liens pensée d'abord pour le pouce : colonne nocturne, ondes d'un galet qui ricoche, liens en galets qui rebondissent, vagues d'encre au toucher, compte à rebours réel, copie et partage d'adresse, onglets en bas de l'écran.",
  description: "Page de liens mobile d'abord : colonne d'ardoise et corail, liens en galets avec boutons copier et partager, compte à rebours de précommande réel, filtre de liens par rubrique, carnet de billets courts, mode jour en option.",
  brand: "Ricochet", modules: ["formulaires", "recherche"],
  contentModel: "Les liens, rubriques et billets sont écrits dans les pages du thème (le bloc « lien en bio » du CMS reste utilisable) ; aucune statistique de clic n'est affichée tant que le CMS n'en fournit pas. Filtre, copie, partage et compte à rebours sont dans motion.js.",
  dna: {
    hero: "portrait-rond-sur-ondes-concentriques-nom-pseudo-et-reseaux-en-colonne-etroite",
    header: "pastille-flottante-marque-point-et-menu-replie-avec-onglets-en-bas-sur-mobile",
    grid: "colonne-unique-de-cinq-cent-vingt-pixels-sans-grille-avec-lien-vedette",
    typo: "rondeur-grasse-de-galet-pour-les-titres-et-sans-empattement-doux-pour-le-texte",
    shapes: "galets-en-capsules-rondes-ondes-concentriques-et-pastilles-de-couleur",
    motion: "liens-qui-rebondissent-a-l-arrivee-ondes-qui-s-etendent-et-vague-d-encre-au-toucher",
    rhythm: "pile-verticale-de-galets-espaces-regulierement-sans-bandes-de-section",
    signature: "liens-en-galets-avec-copie-partage-filtre-par-rubrique-et-compte-a-rebours-reel",
    palette: "ardoise-nuit-corail-rose-et-menthe",
    image: "portrait-dessine-vectoriel-et-ondes-svg-sans-photographie",
    list: "galets-empiles-grille-d-icones-ou-liste-de-texte-a-fleches",
    article: "billet-court-en-colonne-etroite-avec-citation-large",
    sidebar: "aucune-barre-laterale-onglets-en-bas-d-ecran-sur-mobile",
    reading: "sans-empattement-doux-dix-sept-pixels-colonne-etroite-de-soixante-signes",
  },
  tokens: {
    colors: { primary: "#ff6f91", secondary: "#101828", accent: "#5ee6c6", background: "#101828", surface: "#1b2540", text: "#f4f1ea", muted: "#b4bdd2", success: "#5ee6c6", warning: "#ffd166", error: "#ff8a8a" },
    fonts: { heading: "font.bagel-fat-one", body: "font.rethink-sans", button: "font.rethink-sans", link: "font.rethink-sans" },
    radius: { sm: 10, md: 16, lg: 28, button: 999, field: 16, card: 28 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#2b3a60" },
    type: { h1: { size: 40, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 30, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Corail des galets", type: "color", default: "#ff6f91" },
    { key: "mode", label: "Apparence", type: "choice", default: "nuit", choices: [["nuit", "Nuit : ardoise sombre"], ["jour", "Jour : sable clair"]] },
    { key: "entete", label: "En-tête", type: "choice", default: "flottant", choices: [["flottant", "Pastille flottante centrée"], ["barre", "Barre pleine largeur"], ["discret", "Discret : marque seule, menu replié"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "carte", choices: [["carte", "Carte : réseaux et mentions"], ["discret", "Discret : mentions seulement"]] },
    { key: "liste", label: "Présentation des liens", type: "choice", default: "galets", choices: [["galets", "Galets empilés"], ["grille", "Grille de deux colonnes"], ["texte", "Liste de texte à flèches"]] },
    { key: "billet", label: "Billet du carnet", type: "choice", default: "carnet", choices: [["carnet", "Carnet : texte sur fond de page"], ["affiche", "Affiche : texte sur feuille claire"]] },
    { key: "onglets", label: "Onglets en bas de l'écran (mobile)", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Liens", "/"], ["Tout", "/liens"], ["Carnet", "/actus"], ["À propos", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Page de liens", render: home }, { key: "liens", name: "Tous les liens (filtrables)", render: liens }, { key: "actus", name: "Carnet (liste de billets)", render: actus },
    { key: "actu", name: "Billet", render: actu }, { key: "a-propos", name: "À propos et kit de presse", render: apropos }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: (c) => wrapLegal(c, common.mentions()) }, { key: "confidentialite", name: "Confidentialité", render: (c) => wrapLegal(c, common.confidentialite()) }, { key: "blocs", name: "Blocs de contenu", render: (c) => wrapLegal(c, common.blocs()) },
  ],
};
