// Maison Noir — maison de mode et de luxe. Direction artistique : magazine de mode. Noir profond, ivoire, or mat ; titres Didone monumentaux (Bodoni Moda),
// compositions asymétriques qui chevauchent les visuels, menu plein écran, lookbook en défilement horizontal, croquis de mode dessinés en SVG.
const { sec, esc } = require("../kit");

/* ---------- croquis de mode (SVG sans dégradés : les identifiants sont filtrés, on joue sur des bandes translucides) ---------- */
const R = Math.round;
const pleats = (xa0, xa1, ya, xb0, xb1, yb, n) => {
  let a = "", b = "";
  for (let i = 0; i < n; i++) {
    const m = i % 3; if (m === 2) continue;
    const t0 = i / n, t1 = (i + 1) / n;
    const seg = `M${R(xa0 + (xa1 - xa0) * t0)} ${ya}H${R(xa0 + (xa1 - xa0) * t1)}L${R(xb0 + (xb1 - xb0) * t1)} ${yb}H${R(xb0 + (xb1 - xb0) * t0)}Z`;
    if (m === 0) a += seg; else b += seg;
  }
  return `<path class="nr-s" opacity=".26" d="${a}"/><path class="nr-h" opacity=".13" d="${b}"/>`;
};
const HEAD = `<path class="nr-sk" d="M95 54h10v30H95z"/><ellipse class="nr-sk" cx="100" cy="38" rx="12" ry="16"/><path class="nr-hr" d="M87 38C84 14 116 14 113 38C109 27 95 26 87 38Z"/><circle class="nr-hr" cx="100" cy="17" r="6"/>`;
const ARMS = `<path class="nr-arm" d="M72 90C63 130 65 190 73 232M128 90C137 130 135 190 127 232"/>`;
const SHOES = (y) => `<path class="nr-hr" d="M82 ${y}h14l-1 10H78zM104 ${y}h14l4 10h-16z"/>`;
const gown = (n) => `${HEAD}${ARMS}<path class="nr-f1" d="M72 87C84 80 94 83 100 86C106 83 116 80 128 87L122 128L116 172L176 388Q100 398 24 388L84 172L78 128Z"/>${pleats(84, 116, 172, 24, 176, 390, n)}<path class="nr-ln" d="M88 85Q100 108 112 85M82 172H118"/>`;
const skirt = (n) => `${HEAD}${ARMS}<path class="nr-f1" d="M72 87C84 80 94 83 100 86C106 83 116 80 128 87L122 128L116 172L146 262Q100 270 54 262L84 172L78 128Z"/>${pleats(84, 116, 172, 54, 146, 264, n)}<path class="nr-ln" d="M88 85Q100 108 112 85M82 172H118"/><path class="nr-leg" d="M91 264L89 374M109 264L111 374"/>${SHOES(374)}`;
const coat = (n) => `${HEAD}<path class="nr-leg" d="M88 340L86 380M112 340L114 380"/>${SHOES(378)}<path class="nr-f1" d="M62 90C76 80 92 82 100 86C108 82 124 80 138 90L146 198L164 342Q100 356 36 342L54 198Z"/><path class="nr-f1" d="M63 90L46 204L62 208L76 112ZM137 90L154 204L138 208L124 112Z"/><path class="nr-s" opacity=".3" d="M100 86L82 148L100 200L118 148Z"/><path class="nr-s" opacity=".35" d="M52 192H148V204H52Z"/>${pleats(54, 146, 204, 36, 164, 348, n)}<path class="nr-ln" d="M100 86L82 148L100 200L118 148ZM76 112L62 208M124 112L138 208"/><circle class="nr-lf" cx="100" cy="228" r="2.6"/><circle class="nr-lf" cx="100" cy="258" r="2.6"/>`;
const suit = (n) => `${HEAD}<path class="nr-f1" d="M70 206H100L102 388H48ZM100 206H130L152 388H98Z"/>${pleats(70, 130, 206, 48, 152, 388, n)}<path class="nr-f1" d="M64 92C78 82 92 82 100 86C108 82 122 82 136 92L132 208L68 208Z"/><path class="nr-f1" d="M64 92L52 216L66 218L76 112ZM136 92L148 216L134 218L124 112Z"/><path class="nr-s" opacity=".32" d="M100 86L86 140L100 178L114 140Z"/><path class="nr-ln" d="M100 86L86 140L100 178L114 140ZM100 178V208M75 218L74 388M125 218L126 388"/><circle class="nr-lf" cx="100" cy="196" r="2.4"/>`;
const bag = `<path class="nr-ln" stroke-width="5" d="M66 196C62 110 138 110 134 196"/><path class="nr-f1" d="M34 190H166L178 340Q100 356 22 340Z"/><path class="nr-s" opacity=".3" d="M34 190Q100 262 166 190Z"/><path class="nr-h" opacity=".12" d="M34 190H70L56 346L22 340ZM120 190H132L148 350L110 352Z"/><circle class="nr-lf" cx="100" cy="242" r="7"/><path class="nr-ln" d="M34 190Q100 262 166 190"/>`;
const heel = `<path class="nr-f1" d="M26 196L52 188C64 226 98 262 152 282C170 288 178 304 168 314C140 320 96 316 72 304L56 352L46 352L48 300C36 270 28 232 26 196Z"/><path class="nr-s" opacity=".3" d="M52 188C64 226 98 262 152 282L72 304C54 280 46 232 52 188Z"/><path class="nr-ln" d="M30 196C80 168 118 170 128 214"/><path class="nr-h" opacity=".16" d="M60 214C90 250 120 268 150 280L112 280C84 262 66 240 60 214Z"/>`;
const FIG = { g: gown, s: skirt, c: coat, u: suit };
const fig = (kind, n = 6) => (typeof FIG[kind] === "function" ? FIG[kind](n) : kind === "b" ? bag : heel);
const plate = (pal, shape, kind, n = 6, cls = "") => `<div class="nr-pl nr-pl--${pal} nr-sh--${shape}${cls ? " " + cls : ""}"><svg class="nr-fig" viewBox="0 0 200 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${fig(kind, n)}</svg></div>`;
const hanger = (cls = "nr-hanger") => `<svg class="${cls}" viewBox="0 0 160 100" aria-hidden="true"><path d="M80 44V32C80 22 94 22 94 12C94 3 84 0 77 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M80 44L10 82Q4 86 12 90H148Q156 86 150 82Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const arrow = (dir = 1) => `<svg viewBox="0 0 28 12" aria-hidden="true"${dir < 0 ? ' class="nr-flip"' : ""}><path d="M0 6H26M20 1l6 5-6 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
const SEASON = { ah26: "Automne-Hiver 26", pe26: "Printemps-Été 26", cr27: "Croisière 27", ar: "Archives" };

/* nom, silhouette, palette, forme du fond, saison, matière */
const LOOKS = [
  ["Manteau Minuit", "c", "nuit", "arc", "ah26", "Cachemire double face"], ["Robe Aube", "g", "sang", "sun", "ah26", "Soie plissée main"],
  ["Costume Étroit", "u", "ivoire", "bars", "ah26", "Laine froide"], ["Fourreau Encre", "g", "or", "arc", "pe26", "Crêpe de soie"],
  ["Jupe Éventail", "s", "vif", "sun", "pe26", "Organza plissé"], ["Cape Carmin", "c", "sang", "bars", "ah26", "Drap de laine"],
  ["Smoking Nacre", "u", "nuit", "arc", "cr27", "Satin de laine"], ["Robe Veuve", "g", "sable", "band", "cr27", "Mousseline"],
  ["Redingote Brume", "c", "sable", "sun", "cr27", "Gabardine"], ["Robe Éclat", "s", "or", "band", "pe26", "Lamé mat"],
  ["Pantalon Orage", "u", "vif", "arc", "ar", "Twill de laine"], ["Robe du Soir", "g", "nuit", "sun", "ar", "Velours de soie"],
];
const two = (n) => String(n).padStart(2, "0");

/* ---------- en-tête et pied de page ---------- */
const header = (c) => `<header class="nr-head pk-bleed"><div class="nr-bar">
  <details class="nr-menu"><summary class="nr-sum"><span class="nr-sum-ic" aria-hidden="true"><i></i><i></i></span><span class="nr-sum-a">Menu</span><span class="nr-sum-b">Fermer</span></summary>
    <div class="nr-ov" role="navigation" aria-label="Menu principal"><div class="nr-ov-in">
      <p class="nr-lab nr-ov-lab">Sommaire — N° 27 · Automne-Hiver 2026</p>
      <ol class="nr-ov-list">${c.menu.map((m, i) => `<li><a href="${esc(m.url)}"><span class="nr-ov-n">${two(i + 1)}</span><span class="nr-ov-t">${esc(m.label)}</span></a></li>`).join("")}</ol>
      <div class="nr-ov-side"><p class="nr-lab">La Maison</p><address>9 rue de la Pierre-Noire<br>75003 Paris</address><p><a class="nr-lnk" href="/contact">Prendre rendez-vous</a></p><p><a class="nr-lnk" href="/recherche">Rechercher</a></p><p class="nr-small">Site de démonstration.</p></div>
    </div></div></details>
  <a class="nr-logo" href="/" aria-label="Maison Noir, accueil"><span class="nr-logo-a">Maison</span><span class="nr-logo-b">Noir</span></a>
  <a class="nr-bar-r" href="/boutique">Boutique</a>
</div></header>`;

const footer = (c) => `<footer class="nr-foot pk-bleed"><div class="nr-wrap">
  <div class="nr-foot-word" aria-hidden="true">Maison Noir</div>
  <div class="nr-foot-grid">
    <div><p class="nr-lab">La Maison</p><address>9 rue de la Pierre-Noire<br>75003 Paris<br>Sur rendez-vous, du mardi au samedi</address></div>
    <div><p class="nr-lab">Explorer</p><div class="nr-foot-l">${c.menu.slice(1, 6).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div>
    <div><p class="nr-lab">Service</p><div class="nr-foot-l"><a href="/contact">Contact</a><a href="/contact">Demander la disponibilité</a><a href="/recherche">Recherche</a></div></div>
    <div class="nr-foot-h">${hanger()}</div>
  </div>
  <p class="nr-legal">© Maison Noir — site de démonstration. Maison, collections, produits et personnes fictifs. Aucune vente en ligne.</p>
</div></footer>`;

const pagehead = (no, kicker, title, sub, mod = "") => sec(`<section class="nr-ph pk-bleed ${mod}"><div class="nr-wrap nr-ph-in"><span class="nr-ph-no" aria-hidden="true">${no}</span>
  <div class="nr-ph-t"><p class="nr-lab" data-reveal>${esc(kicker)}</p><div class="nr-giant" role="heading" aria-level="1" data-split="l">${title}</div>${sub ? `<p class="nr-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></div></section>`);

const marquee = (words) => { const row = words.map((w) => `<span>${esc(w)}</span>`).join(""); return `<div class="nr-marq pk-bleed"><div class="nr-marq-t"><div class="nr-marq-r">${row}</div><div class="nr-marq-r" aria-hidden="true">${row}</div></div></div>`; };

const quote = (text, who, ref) => `<section class="nr-quote pk-bleed"><div class="nr-wrap nr-quote-in"><span class="nr-qm" aria-hidden="true">“</span><blockquote data-reveal><p class="nr-q">${text}</p><footer><span class="nr-lab">${esc(who)}</span> <i>${esc(ref)}</i></footer></blockquote></div></section>`;

const newsletter = () => sec(`<section class="nr-news pk-bleed"><div class="nr-wrap nr-news-in"><div><p class="nr-lab" data-reveal>La lettre de la Maison</p><h2 class="nr-h2" data-split="w">Un courrier, quatre fois l'an.</h2></div>
  <div data-reveal><p class="nr-lead">Les coulisses des collections, les dates des présentations et les nouvelles de l'atelier. L'inscription se fait par un message via le formulaire de contact.</p><a class="nr-btn" href="/contact">Demander la lettre ${arrow()}</a><p class="nr-small">Démonstration : aucun envoi automatique n'est effectué.</p></div></div></section>`);

const lookCard = (i, n = 5) => { const [name, k, pal, sh, , mat] = LOOKS[i]; return `<article class="nr-look"><figure>${plate(pal, sh, k, n)}<figcaption><span class="nr-no">${two(i + 1)}</span><b>${esc(name)}</b><i>${esc(mat)}</i></figcaption></figure></article>`; };

/* ---------- accueil ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="nr-hero pk-bleed"><div class="nr-wrap">
    <div class="nr-hero-meta nr-lab"><span>N° 27</span><span>Automne-Hiver 2026</span><span>Paris</span></div>
    <div class="nr-hero-grid">
      <figure class="nr-hv nr-hv--a" data-par="-0.05">${plate("sang", "arc", "g", 14)}<figcaption class="nr-cap"><b>Fig. 01</b> Robe Aube, soie plissée main — p. 04</figcaption></figure>
      <figure class="nr-hv nr-hv--b" data-par="0.09">${plate("nuit", "sun", "c", 10)}<figcaption class="nr-cap"><b>Fig. 02</b> Manteau Minuit — p. 12</figcaption></figure>
      <div class="nr-title" role="heading" aria-level="1" data-split="l"><span class="nr-t1">Maison</span><span class="nr-t2">Noir</span></div>
      <span class="nr-pageno" aria-hidden="true">01</span>
    </div>
    <div class="nr-hero-foot"><p class="nr-lead" data-reveal>Une maison de couture parisienne qui ne travaille que la nuit : coupes nettes, plis cousus main et une seule couleur qui compte vraiment.</p>
      <ol class="nr-sommaire" data-reveal aria-label="Au sommaire"><li><span>04</span>Les robes plissées</li><li><span>12</span>Manteaux de minuit</li><li><span>28</span>Le lookbook</li></ol>
      <div class="nr-actions" data-reveal><a class="nr-btn" href="/collections">Découvrir la collection ${arrow()}</a><a class="nr-lnk" href="/lookbook">Feuilleter le lookbook</a></div></div>
  </div></section>`),
  sec(marquee(["Haute couture", "Prêt-à-porter", "Plissés main", "Atelier parisien", "Sur mesure", "Depuis 1962"]) + quote("L'élégance, c'est laisser le vêtement parler plus bas que celle qui le porte.", "Odile Verrier, fondatrice", "Édito, N° 27, p. 03")),
  sec(`<section class="nr-lb pk-bleed"><div class="nr-wrap nr-lb-head"><div><p class="nr-lab" data-reveal>Lookbook · Automne-Hiver 26</p><h2 class="nr-h2" data-split="w">Douze silhouettes</h2></div>
    <div class="nr-lb-ctl"><span class="nr-count" aria-live="polite"><b data-cur>01</b><i>/</i><span data-tot>12</span></span><div class="nr-arrows"><a href="#precedent" data-dir="-1" aria-label="Look précédent">${arrow(-1)}</a><a href="#suivant" data-dir="1" aria-label="Look suivant">${arrow()}</a></div></div></div>
    <div class="nr-rail" data-rail role="region" aria-label="Lookbook, défilement horizontal">${LOOKS.map((_, i) => lookCard(i)).join("")}</div></section>`),
  sec(`<section class="nr-duo pk-bleed"><div class="nr-wrap"><div class="nr-duo-head"><p class="nr-lab" data-reveal>Les collections</p><h2 class="nr-h2" data-split="w">Quatre saisons, une même nuit.</h2></div>
    <div class="nr-duo-grid"><div class="nr-duo-c">
      <a class="nr-cc" href="/collections" data-reveal><figure>${plate("sang", "band", "g", 8)}</figure><span class="nr-lab">N° 01 · Automne-Hiver 26</span><h3>Nuit de Velours</h3><p>Plis profonds, velours de soie et rouge sang.</p></a>
      <a class="nr-cc" href="/collections" data-reveal><figure>${plate("ivoire", "bars", "u", 8)}</figure><span class="nr-lab">N° 03 · Croisière 27</span><h3>Ivoire Absolu</h3><p>Le tailleur d'été, taillé comme une architecture.</p></a></div>
    <div class="nr-duo-c nr-duo-c--2">
      <a class="nr-cc" href="/collections" data-reveal><figure>${plate("or", "sun", "s", 8)}</figure><span class="nr-lab">N° 02 · Printemps-Été 26</span><h3>Éclats d'Or</h3><p>Organza plissé et lamé mat pour les soirs longs.</p></a>
      <a class="nr-cc" href="/collections" data-reveal><figure>${plate("sable", "arc", "c", 8)}</figure><span class="nr-lab">N° 04 · Archives</span><h3>Brume</h3><p>Les manteaux de la maison, remis à la coupe.</p></a></div></div>
    <p class="nr-more" data-reveal><a class="nr-lnk" href="/collections">Toutes les collections</a></p></div></section>`),
  sec(`<section class="nr-mais pk-bleed"><div class="nr-wrap nr-mais-in"><div class="nr-mais-t"><p class="nr-lab" data-reveal>La Maison</p><h2 class="nr-h2" data-split="w">Depuis 1962, la nuit nous habille.</h2>
    <p class="nr-lead" data-reveal>Trente-huit mains, un atelier sous les toits du Marais et une règle : un vêtement n'est terminé que lorsque l'on n'y voit plus la couture.</p><a class="nr-lnk" href="/maison" data-reveal>Lire l'histoire de la Maison</a></div>
    <div class="nr-mais-s" aria-hidden="true"><div class="nr-tx nr-tx--pli" data-par="-0.05"><span>Plissé main</span></div><div class="nr-tx nr-tx--tweed" data-par="0.06"><span>Pied-de-poule</span></div><div class="nr-tx nr-tx--soie" data-par="-0.03"><span>Soie sauvage</span></div></div></div></section>`),
  sec(`<section class="nr-toc pk-bleed"><div class="nr-wrap"><div class="nr-sechead"><h2 class="nr-h2" data-split="w">Au journal</h2><a class="nr-lnk" href="/journal">Tout le journal</a></div>
    <ol class="nr-toc-l">${[["Le geste du plissé", "Atelier", "Quarante heures pour une robe, et pas une de plus."], ["Pourquoi le noir ?", "Édito", "Une couleur, mille nuances de lumière."], ["Dans les coulisses du défilé", "Coulisses", "Six minutes sur le podium, six mois de travail."]].map((r, i) => `<li data-reveal><a href="/journal"><span class="nr-toc-n">${two(i + 1)}</span><span class="nr-toc-t"><b>${esc(r[0])}</b><i>${esc(r[2])}</i></span><span class="nr-lab">${esc(r[1])}</span>${arrow()}</a></li>`).join("")}</ol></div></section>`),
  newsletter(),
  sec(footer(c)),
];

/* ---------- collections ---------- */
const FILTERS = [["toutes", "Toutes"], ["ah26", SEASON.ah26], ["pe26", SEASON.pe26], ["cr27", SEASON.cr27], ["ar", SEASON.ar]];
const collections = (c) => [sec(header(c)),
  pagehead("02", "Les collections · 2026 / 27", "Les<br>collections", "Chaque saison est un chapitre. Filtrez par saison pour parcourir les pièces de la Maison."),
  sec(`<section class="nr-col pk-bleed"><div class="nr-wrap"><div class="nr-filter" data-filter role="group" aria-label="Filtrer par saison">${FILTERS.map((f, i) => `<a href="#${f[0]}" data-f="${f[0]}"${i === 0 ? ' class="is-on" aria-pressed="true"' : ' aria-pressed="false"'}>${esc(f[1])}</a>`).join("")}<span class="nr-filter-n" aria-live="polite"><b data-n>12</b> pièces</span></div>
    <div class="nr-mason">${LOOKS.map((l, i) => `<a class="nr-mc nr-mc--${i % 3}" href="/lookbook" data-season="${l[4]}"><figure>${plate(l[2], l[3], l[1], 6)}</figure><span class="nr-mc-n">${two(i + 1)}</span><span class="nr-lab">${esc(SEASON[l[4]])}</span><h3>${esc(l[0])}</h3><p>${esc(l[5])}</p></a>`).join("")}</div></div></section>`),
  newsletter(), sec(footer(c))];

/* ---------- lookbook (pleine page horizontale) ---------- */
const lookbook = (c) => [sec(header(c)),
  sec(`<section class="nr-lbp pk-bleed"><div class="nr-lbp-top nr-wrap"><div><p class="nr-lab">Automne-Hiver 2026 · N° 27</p><div class="nr-giant nr-giant--s" role="heading" aria-level="1" data-split="l">Lookbook</div></div></div>
    <div class="nr-rail nr-rail--full" data-rail role="region" aria-label="Lookbook plein écran, défilement horizontal">${LOOKS.map((l, i) => `<article class="nr-lbs"><figure class="nr-lbs-f">${plate(l[2], l[3], l[1], 7)}</figure><div class="nr-lbs-t"><span class="nr-lbs-n" aria-hidden="true">${two(i + 1)}</span><p class="nr-lab">Look ${two(i + 1)} · ${esc(SEASON[l[4]])}</p><h2 class="nr-h3">${esc(l[0])}</h2><p>${esc(l[5])}.</p></div></article>`).join("")}</div>
    <div class="nr-lbp-bar nr-wrap"><span class="nr-count" aria-live="polite"><b data-cur>01</b><i>/</i><span data-tot>12</span></span><span class="nr-prog" aria-hidden="true"><i data-prog></i></span><div class="nr-arrows"><a href="#precedent" data-dir="-1" aria-label="Look précédent">${arrow(-1)}</a><a href="#suivant" data-dir="1" aria-label="Look suivant">${arrow()}</a></div></div></section>`),
  sec(`<section class="nr-lbend pk-bleed"><div class="nr-wrap nr-lbend-in"><p class="nr-lead" data-reveal>Une pièce vous a arrêtée ? Les modèles se commandent sur rendez-vous, à l'atelier.</p><div class="nr-actions" data-reveal><a class="nr-btn" href="/boutique">Voir la boutique ${arrow()}</a><a class="nr-lnk" href="/contact">Prendre rendez-vous</a></div></div></section>`),
  sec(footer(c))];

/* ---------- la maison ---------- */
const TL = [["1962", "Rue de la Pierre-Noire", "Odile Verrier ouvre un atelier de quatre tables sous les toits du Marais."], ["1974", "Le premier plissé", "La Maison invente son point signature : le pli cousu à la main, jamais repassé."], ["1989", "Tout en noir", "Le défilé « Encre » fait du noir la seule couleur de la saison, et de la Maison."], ["2003", "La nouvelle génération", "Camille Verrier reprend l'atelier et y ajoute le tailleur, le manteau, l'accessoire."], ["2026", "Aujourd'hui", "Trente-huit mains, deux collections par an, et toujours une seule porte, au 9."]];
const maison = (c) => [sec(header(c)),
  sec(`<section class="nr-ph nr-ph--maison pk-bleed"><div class="nr-wrap nr-ph-in"><div class="nr-ph-t"><p class="nr-lab" data-reveal>Histoire · N° 27, p. 18</p><div class="nr-giant" role="heading" aria-level="1" data-split="l">La<br>Maison</div><p class="nr-ph-sub" data-reveal>Soixante ans à travailler le noir, le pli et la patience.</p></div>
    <figure class="nr-ph-v" data-par="-0.05">${plate("nuit", "arc", "g", 12)}<figcaption class="nr-cap"><b>Archive</b> Robe « Encre », collection 1989</figcaption></figure></div></section>`),
  sec(`<section class="nr-story pk-bleed"><div class="nr-wrap nr-story-in"><aside class="nr-margin" data-reveal><p class="nr-lab">En marge</p><p>« Un pli ne se repasse pas. Il se pense, il se coud, puis il s'oublie. »</p><p class="nr-small">— Atelier, carnet de 1974</p>${hanger()}</aside>
    <div class="nr-prose"><p class="nr-lab" data-reveal>Chapitre I</p><h2 class="nr-h2" data-split="w">Une porte, un escalier, quatre tables.</h2>
    <p class="nr-dropcap" data-reveal>Tout commence en 1962, au sixième étage d'un immeuble sans ascenseur. Odile Verrier y installe quatre tables, une machine d'occasion et un mannequin de bois qu'elle nomme Léonie. Elle ne veut pas habiller la ville ; elle veut habiller la nuit, celles qui sortent tard et n'ont pas besoin d'être vues pour être remarquées.</p>
    <p data-reveal>La règle de la Maison est née ce premier hiver et n'a pas changé : une coupe nette, une matière qui tombe juste, et aucune couture qui cherche l'attention. Le noir n'est pas un parti pris, c'est une manière de laisser parler la forme.</p>
    <p data-reveal>Aujourd'hui, l'atelier compte trente-huit personnes : premières d'atelier, plisseuses, tailleurs, brodeuses. Chaque pièce passe par au moins sept paires de mains avant de quitter la rue de la Pierre-Noire.</p></div></div></section>`),
  sec(`<section class="nr-tl pk-bleed"><div class="nr-wrap"><div class="nr-sechead"><h2 class="nr-h2" data-split="w">Soixante ans en cinq dates</h2></div><ol class="nr-tl-l">${TL.map((t, i) => `<li data-reveal><span class="nr-tl-y">${t[0]}</span><div><h3>${esc(t[1])}</h3><p>${esc(t[2])}</p></div><span class="nr-tl-n" aria-hidden="true">${two(i + 1)}</span></li>`).join("")}</ol></div></section>`),
  sec(`<section class="nr-mat pk-bleed"><div class="nr-wrap"><p class="nr-lab" data-reveal>Matières</p><h2 class="nr-h2" data-split="w">Ce que l'on touche d'abord.</h2>
    <div class="nr-mat-g"><div class="nr-mat-i" data-reveal><div class="nr-tx nr-tx--pli"></div><h3>Le plissé main</h3><p>Chaque pli est piqué à l'aiguille puis vaporisé, jamais thermofixé.</p></div>
    <div class="nr-mat-i" data-reveal><div class="nr-tx nr-tx--tweed"></div><h3>Le pied-de-poule</h3><p>Une laine tissée en Écosse, coupée dans le sens exact du motif.</p></div>
    <div class="nr-mat-i" data-reveal><div class="nr-tx nr-tx--soie"></div><h3>La soie sauvage</h3><p>Mate, légèrement nervurée, elle prend la lumière sans la rendre.</p></div>
    <div class="nr-mat-i" data-reveal><div class="nr-tx nr-tx--cuir"></div><h3>Le cuir pleine fleur</h3><p>Tanné végétal, pour les sacs et les souliers qui vieillissent bien.</p></div></div></div></section>`),
  sec(`<section class="nr-nums pk-bleed"><div class="nr-wrap"><ul class="nr-nums-l"><li data-reveal><b data-count="38">38</b><span>mains à l'atelier</span></li><li data-reveal><b data-count="40">40</b><span>heures par robe plissée</span></li><li data-reveal><b data-count="62">62</b><span>années de la Maison</span></li><li data-reveal><b data-count="2">2</b><span>collections par an</span></li></ul></div></section>`),
  sec(quote("Nous ne suivons pas la mode. Nous lui tenons la porte, puis nous la refermons.", "Camille Verrier, directrice de la création", "Entretien, N° 27, p. 22")),
  sec(footer(c))];

/* ---------- boutique de démonstration ---------- */
const PALN = { nuit: "Noir", sang: "Rouge sang", ivoire: "Ivoire", or: "Or mat", sable: "Sable", vif: "Carmin" };
const prod = (i, ref, cat, name, desc, kind, shape, pals, sizes, specs, n) => `<article class="nr-prod nr-prod--${i % 2 ? "r" : "l"}" data-prod><figure class="nr-prod-f" data-par="${i % 2 ? 0.04 : -0.04}">${plate(pals[0], shape, kind, n)}<figcaption class="nr-cap"><b>Réf. ${ref}</b> ${esc(cat)}</figcaption></figure>
  <div class="nr-prod-i"><p class="nr-lab" data-reveal>${esc(cat)} · ${ref}</p><h2 class="nr-h2" data-split="w">${esc(name)}</h2><p class="nr-lead" data-reveal>${esc(desc)}</p>
  <ul class="nr-spec" data-reveal>${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
  <div class="nr-opt" data-reveal><span class="nr-lab" id="">Taille</span><div class="nr-pills" data-opt="taille" role="radiogroup" aria-label="Taille">${sizes.map((s, k) => `<a href="#taille" role="radio" aria-checked="${k === 1}" data-v="${s}"${k === 1 ? ' class="is-on"' : ""}>${s}</a>`).join("")}</div></div>
  <div class="nr-opt" data-reveal><span class="nr-lab">Coloris</span><div class="nr-pills nr-pills--dots" data-opt="coloris" role="radiogroup" aria-label="Coloris">${pals.map((p, k) => `<a href="#coloris" role="radio" aria-checked="${k === 0}" aria-label="${PALN[p]}" data-v="${PALN[p]}" data-pal="${p}" class="nr-dot nr-dot--${p}${k === 0 ? " is-on" : ""}"></a>`).join("")}</div></div>
  <p class="nr-sel" aria-live="polite">Sélection : taille <b data-o="taille">${sizes[1]}</b> · <b data-o="coloris">${PALN[pals[0]]}</b></p>
  <div class="nr-actions" data-reveal><a class="nr-btn" href="/contact">Demander la disponibilité ${arrow()}</a></div></div></article>`.replace(' id=""', "");
const boutique = (c) => [sec(header(c)),
  pagehead("05", "Boutique de démonstration", "La<br>boutique", "Quatre pièces de la saison. Choisissez une taille et un coloris, puis demandez la disponibilité : la Maison vous répond.", "nr-ph--r"),
  sec(`<section class="nr-note pk-bleed"><div class="nr-wrap"><p class="nr-small">Boutique de démonstration : il n'y a ni panier ni paiement en ligne. Les pièces se réservent sur demande, par le formulaire de contact.</p></div></section>`),
  sec(`<section class="nr-shop pk-bleed">${prod(0, "NM-0127", "Prêt-à-porter", "Manteau Minuit", "Un long manteau croisé en cachemire double face, épaules tracées, ceinture amovible et boutons de corne.", "c", "arc", ["nuit", "sang", "sable", "ivoire"], ["XS", "S", "M", "L", "XL"], ["Cachemire double face", "Doublure en soie", "Fait à l'atelier, 22 heures"], 8)}
    ${prod(1, "NM-0214", "Soirée", "Robe Aube", "La robe plissée main de la saison : bustier net, jupe en soixante plis qui s'ouvrent à la marche.", "g", "sun", ["sang", "nuit", "or", "vif"], ["XS", "S", "M", "L"], ["Soie plissée main", "Fermeture invisible dans le dos", "Fait à l'atelier, 40 heures"], 14)}</section>`),
  sec(`<section class="nr-shop pk-bleed">${prod(2, "NM-0331", "Accessoires", "Sac Arc", "Une ligne unique et un rabat qui épouse la courbe. Pleine fleur tannée végétal, fermoir doré mat.", "b", "band", ["or", "nuit", "sang", "ivoire"], ["PM", "MM", "GM"], ["Cuir pleine fleur", "Anse rigide", "Pièce numérotée"], 3)}
    ${prod(3, "NM-0408", "Souliers", "Escarpin Nuit Blanche", "Un escarpin à talon fin, bride de cheville, cambrure dessinée pour marcher toute une nuit.", "h", "arc", ["nuit", "sang", "or", "ivoire"], ["36", "37", "38", "39", "40"], ["Chevreau glacé", "Talon de 85 mm", "Semelle cuir cousue"], 3)}</section>`),
  newsletter(), sec(footer(c))];

/* ---------- journal ---------- */
const ARTS = [["Le geste du plissé", "Atelier", "12 oct. 2026", "6 min", "Quarante heures pour une robe, et pas une de plus.", "Dans l'atelier du dernier étage, trois plisseuses travaillent en silence. Chaque pli est piqué d'un fil de bâti, vaporisé, puis laissé au repos une nuit entière. C'est ce temps-là, disent-elles, que l'on retrouve dans la chute du tissu."],
  ["Pourquoi le noir ?", "Édito", "28 sept. 2026", "4 min", "Une couleur, mille nuances de lumière.", "Le noir n'est pas l'absence de couleur : c'est la seule qui laisse voir la forme. À la Maison, on en compte quatorze, du noir d'encre au noir de fumée, chacun teint dans son propre bain."],
  ["Dans les coulisses du défilé", "Coulisses", "14 sept. 2026", "8 min", "Six minutes sur le podium, six mois de travail.", "À l'aube du défilé, l'atelier ressemble à une salle d'opération. Chaque silhouette a son habilleuse, son numéro et sa dernière retouche, apportée à la minute où le mannequin se lève."],
  ["Rencontre avec Camille Verrier", "Entretien", "2 sept. 2026", "7 min", "« Je dessine ce que je voudrais retrouver dans trente ans. »", "Directrice de la création depuis 2003, Camille Verrier parle de transmission, de patience et de la manière dont une maison apprend à se contredire sans se perdre."],
  ["Le manteau, cette architecture", "Savoir-faire", "19 août 2026", "5 min", "Soixante-douze pièces de patron pour une seule ligne.", "Un manteau se construit comme un petit bâtiment : une charpente de toile, des épaules montées à la main, un col tracé à la craie. On ne voit rien de tout cela, et c'est le but."],
  ["Les souliers de la nuit", "Accessoires", "5 août 2026", "3 min", "Un talon de 85 millimètres, et tout bascule.", "Le talon fin est un exercice d'équilibre. Chaque modèle est essayé par l'atelier en marchant une heure entière, avant d'entrer au catalogue."]];
const journal = (c) => [sec(header(c)),
  pagehead("06", "Éditoriaux · Coulisses · Entretiens", "Le<br>journal", "Textes, entretiens et notes d'atelier, publiés au rythme des saisons.", "nr-ph--c"),
  sec(`<section class="nr-feat pk-bleed"><div class="nr-wrap nr-feat-in"><figure class="nr-feat-f" data-par="-0.04">${plate("sang", "sun", "g", 12)}<figcaption class="nr-cap"><b>À la une</b> « Encre », reprise 2026</figcaption></figure>
    <div class="nr-feat-t"><p class="nr-lab" data-reveal>À la une · Édito</p><h2 class="nr-h2" data-split="w">Le noir ne s'explique pas, il se porte.</h2><p class="nr-lead" data-reveal>Pour ses soixante ans, la Maison reprend sa robe la plus célèbre et raconte, en six pages, pourquoi elle n'a jamais cessé de l'aimer.</p><p class="nr-small" data-reveal>Odile et Camille Verrier · 10 min de lecture</p></div></div></section>`),
  sec(`<section class="nr-jr pk-bleed"><div class="nr-wrap"><div class="nr-sechead"><h2 class="nr-h2" data-split="w">Tous les textes</h2><span class="nr-lab">Ouvrez un extrait</span></div>
    <div class="nr-jr-l">${ARTS.map((a, i) => `<details class="nr-art" data-reveal><summary><span class="nr-art-n">${two(i + 1)}</span><span class="nr-art-t"><b>${esc(a[0])}</b><i>${esc(a[4])}</i></span><span class="nr-art-m"><span class="nr-lab">${esc(a[1])}</span><time>${esc(a[2])}</time></span><span class="nr-art-x" aria-hidden="true"></span></summary><div class="nr-art-b"><p>${esc(a[5])}</p><p class="nr-small">${esc(a[3])} de lecture · Extrait de démonstration.</p></div></details>`).join("")}</div></div></section>`),
  newsletter(), sec(footer(c))];

/* ---------- contact, recherche, introuvable ---------- */
const contact = (c) => [sec(header(c)),
  pagehead("07", "Rendez-vous · Presse · Disponibilités", "Nous<br>écrire", "Une question, une demande de disponibilité, un rendez-vous à l'atelier : la Maison répond sous deux jours ouvrés."),
  { type: "form", heading: "Écrire à la Maison", intro: "Précisez la pièce, la taille et le coloris souhaités, ou votre demande de rendez-vous." },
  sec(`<section class="nr-info pk-bleed"><div class="nr-wrap nr-info-in"><div data-reveal><p class="nr-lab">L'atelier</p><address>9 rue de la Pierre-Noire<br>75003 Paris</address></div><div data-reveal><p class="nr-lab">Horaires</p><p>Du mardi au samedi<br>10 h – 19 h, sur rendez-vous</p></div><div data-reveal><p class="nr-lab">Presse</p><p>Dossiers et prêts de pièces par le formulaire ci-dessus.</p></div><div class="nr-info-h">${hanger()}</div></div></section>`),
  sec(footer(c))];
const recherche = (c) => [sec(header(c)),
  pagehead("08", "Rechercher", "Chercher", "Une pièce, une collection, un texte du journal."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce, une collection…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)),
  sec(`<section class="nr-404 pk-bleed"><div class="nr-wrap nr-404-in">${hanger("nr-hanger nr-hanger--xl")}<p class="nr-lab">Page introuvable</p><div class="nr-giant nr-giant--404" role="heading" aria-level="1" data-split="l">404</div><p class="nr-ph-sub">Ce modèle a quitté le portant : la page n'existe pas ou a changé d'adresse.</p><div class="nr-actions"><a class="nr-btn" href="/">Retour à l'accueil ${arrow()}</a><a class="nr-lnk" href="/collections">Voir les collections</a></div></div></section>`),
  sec(footer(c))];

module.exports = {
  key: "noir", name: "Maison Noir", version: "2.0.0", category: "mode", tags: ["editorial", "luxe", "sombre", "classique"], siteType: "Maison de mode et de luxe", featured: true,
  concept: "Un magazine de mode : titres Didone monumentaux qui chevauchent des visuels asymétriques, menu plein écran, lookbook en défilement horizontal et croquis de mode au trait.",
  description: "Maison de mode de luxe : noir profond, ivoire et or mat, titres Didone monumentaux, menu plein écran, lookbook horizontal, collections filtrables, boutique de démonstration avec pastilles de taille et de coloris.",
  brand: "Maison Noir", modules: ["formulaires", "recherche"],
  dna: { header: "logo-centre-plein-ecran-overlay", hero: "composition-asymetrique-typo", grid: "lookbook-defilement-horizontal", motion: "lettres-et-parallaxe-douce" },
  tokens: {
    colors: { primary: "#c9a25f", secondary: "#0b0a09", accent: "#9b1226", background: "#0b0a09", surface: "#15120f", text: "#f2ece1", muted: "#a9a193", success: "#4f8f5b", warning: "#c9a25f", error: "#e0485c" },
    fonts: { heading: "font.bodoni-moda", body: "font.jost", button: "font.jost", link: "font.jost" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3a342b" },
    type: { h1: { size: 168, weight: 400, lineHeight: 0.84, transform: "none" }, h2: { size: 64, weight: 400, lineHeight: 0.98, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent", type: "choice", default: "or", choices: [["or", "Or mat"], ["rouge", "Rouge sang"], ["champagne", "Champagne"]] },
    { key: "mode", label: "Ambiance", type: "choice", default: "sombre", choices: [["sombre", "Noir profond"], ["clair", "Ivoire clair"]] },
    { key: "titres", label: "Style des titres", type: "choice", default: "didone", choices: [["didone", "Didone droit"], ["italique", "Italique"]] },
    { key: "parallaxe", label: "Parallaxe des visuels", type: "choice", default: "on", choices: [["on", "Activée"], ["off", "Désactivée"]] },
    { key: "menu", label: "Ouverture du menu", type: "choice", default: "plein", choices: [["plein", "Plein écran"], ["lateral", "Panneau latéral"]] },
  ],
  menu: [["Accueil", "/"], ["Collections", "/collections"], ["Lookbook", "/lookbook"], ["La Maison", "/maison"], ["Boutique", "/boutique"], ["Journal", "/journal"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "collections", name: "Collections", render: collections }, { key: "lookbook", name: "Lookbook", render: lookbook },
    { key: "maison", name: "La Maison", render: maison }, { key: "boutique", name: "Boutique", render: boutique }, { key: "journal", name: "Journal", render: journal },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
