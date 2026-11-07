// Monture Claire — lunetterie de luxe. Direction artistique : le design d'objet, la transparence, l'architecture d'une monture. Fond cristal gris-bleu, verre dépoli, filets fins,
// écaille ambrée en seule couleur ; titres en Jost léger (casse normale), lecture en Newsreader. Les montures sont dessinées en SVG (aucune photo, aucun texte dans les SVG).
// Composant signature : le SÉLECTEUR DE FORMES PAR VISAGE (ovale, rond, carré, cœur, long). C'est un bloc éditable du Page Builder : la liste de liens est écrite en clair dans le bloc
// et fonctionne SANS script (menus « details »). motion.js ajoute l'aperçu (visage + monture) et l'ouverture exclusive. Chaque lien ouvre le VRAI catalogue filtré :
// /boutique/etiquette/<forme de monture> (étiquettes présentes dans demo.js) ou /boutique/categorie/<catégorie>. Les conseils de forme sont des repères esthétiques, pas des règles.
// Non fournis, car absents du moteur : comparateur de montures, essayage virtuel. Rien n'est simulé côté panier, paiement, avis ou stock.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`,
  mark: `<svg viewBox="0 0 64 24" aria-hidden="true"><circle class="mc-fr" cx="16" cy="12" r="9"/><circle class="mc-fr" cx="48" cy="12" r="9"/><path class="mc-fr" d="M25 10q7-5 14 0"/></svg>`,
};

/* ----- Montures : viewBox 0 0 200 80, verre gauche centré en 55, verre droit en 145. dx > 0 = vers l'extérieur de la monture (le tracé se retourne tout seul). ----- */
const FORMES = [
  ["ronde", "Ronde", "Un cercle simple, héritier des montures d'ingénieur."],
  ["ovale", "Ovale", "Une courbe allongée, discrète et légère."],
  ["carree", "Carrée", "Des angles nets et un volume affirmé."],
  ["rectangulaire", "Rectangulaire", "Large et basse, la ligne la plus graphique."],
  ["pantos", "Pantos", "Un dessus presque droit, un dessous plein."],
  ["aviateur", "Aviateur", "La goutte, fine et fluide, souvent en métal."],
  ["papillon", "Papillon", "Un coin extérieur relevé, pour un regard étiré."],
];
const lens = (shape, c, s) => {
  const X = (dx) => +(c + s * dx).toFixed(1);
  const k = 'class="mc-fr mc-lens"';
  switch (shape) {
    case "ronde": return `<circle ${k} cx="${c}" cy="40" r="30"/>`;
    case "ovale": return `<ellipse ${k} cx="${c}" cy="40" rx="33" ry="24"/>`;
    case "carree": return `<rect ${k} x="${c - 30}" y="14" width="60" height="52" rx="9"/>`;
    case "rectangulaire": return `<rect ${k} x="${c - 33}" y="21" width="66" height="38" rx="6"/>`;
    case "pantos": return `<path ${k} d="M${X(-32)} 24Q${X(0)} 14 ${X(32)} 24Q${X(37)} 52 ${X(10)} 62Q${X(0)} 65 ${X(-10)} 62Q${X(-37)} 52 ${X(-32)} 24Z"/>`;
    case "aviateur": return `<path ${k} d="M${X(-34)} 20Q${X(0)} 13 ${X(34)} 22Q${X(36)} 62 ${X(6)} 64Q${X(-26)} 64 ${X(-34)} 20Z"/>`;
    default: return `<path ${k} d="M${X(-31)} 32Q${X(-31)} 22 ${X(-6)} 24L${X(36)} 14Q${X(34)} 56 ${X(4)} 60Q${X(-29)} 60 ${X(-31)} 32Z"/>`;
  }
};
const frame = (shape, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 200 80" role="img" aria-label="Monture ${esc(shape)} dessinée de face">${lens(shape, 55, -1)}${lens(shape, 145, 1)}<path class="mc-fr" d="M88 32Q100 24 112 32"/><path class="mc-fr" d="M22 28L8 26M178 28L192 26"/></svg>`;
const frameIcon = (shape) => `<svg viewBox="0 0 200 80" aria-hidden="true">${lens(shape, 55, -1)}${lens(shape, 145, 1)}<path class="mc-fr" d="M88 32Q100 24 112 32"/><path class="mc-fr" d="M22 28L8 26M178 28L192 26"/></svg>`;

/* ----- Visages : viewBox 0 0 120 150, ligne des yeux à y = 72 ----- */
const FACE = {
  ovale: `<ellipse class="mc-fc" cx="60" cy="76" rx="40" ry="56"/>`,
  rond: `<ellipse class="mc-fc" cx="60" cy="78" rx="46" ry="49"/>`,
  carre: `<path class="mc-fc" d="M16 40Q16 24 32 24H88Q104 24 104 40V100Q104 126 80 132H40Q16 126 16 100Z"/>`,
  coeur: `<path class="mc-fc" d="M14 50Q14 20 60 20Q106 20 106 50Q106 80 82 108Q68 128 60 136Q52 128 38 108Q14 80 14 50Z"/>`,
  long: `<ellipse class="mc-fc" cx="60" cy="78" rx="34" ry="64"/>`,
};
const face = (v) => `<svg viewBox="0 0 120 150" aria-hidden="true">${FACE[v]}<ellipse class="mc-eye" cx="43" cy="72" rx="5" ry="2.6"/><ellipse class="mc-eye" cx="77" cy="72" rx="5" ry="2.6"/></svg>`;
const stageStatic = (v, shape, s) => `<svg viewBox="0 0 120 150" aria-hidden="true">${FACE[v]}<ellipse class="mc-eye" cx="43" cy="72" rx="5" ry="2.6"/><ellipse class="mc-eye" cx="77" cy="72" rx="5" ry="2.6"/><g transform="translate(${+(60 - 100 * s).toFixed(1)} ${+(72 - 40 * s).toFixed(1)}) scale(${s})">${lens(shape, 55, -1)}${lens(shape, 145, 1)}<path class="mc-fr" d="M88 32Q100 24 112 32"/><path class="mc-fr" d="M22 28L8 26M178 28L192 26"/></g></svg>`;

const VISAGES = [
  { v: "ovale", nom: "Visage ovale", d: "Front et mâchoire en équilibre", s: 0.4, txt: "Des proportions harmonieuses : presque toutes les formes vous vont. Choisissez plutôt selon le caractère que vous voulez donner à votre regard.", f: ["pantos", "rectangulaire", "aviateur"] },
  { v: "rond", nom: "Visage rond", d: "Joues pleines, hauteur et largeur proches", s: 0.44, txt: "Des lignes plus droites structurent le visage et le font paraître un peu plus allongé.", f: ["rectangulaire", "carree", "pantos"] },
  { v: "carre", nom: "Visage carré", d: "Front et mâchoire marqués", s: 0.44, txt: "Des courbes adoucissent les angles : un verre rond ou ovale équilibre la mâchoire.", f: ["ronde", "ovale", "aviateur"] },
  { v: "coeur", nom: "Visage en cœur", d: "Front large, menton fin", s: 0.44, txt: "Une monture plus légère en haut, ou plus ample en bas, rééquilibre le front et le menton.", f: ["ovale", "aviateur", "ronde"] },
  { v: "long", nom: "Visage long", d: "Plus haut que large", s: 0.34, txt: "Des montures hautes ou larges raccourcissent visuellement les proportions.", f: ["carree", "pantos", "papillon"] },
];
const nomForme = (t) => (FORMES.find((f) => f[0] === t) || [t, t])[1];
const visageBloc = (x, i) => `<details class="mc-vis" data-visage="${x.v}" data-echelle="${x.s}"${i === 0 ? " open" : ""}><summary><span class="mc-vis-ic">${face(x.v)}</span><span class="mc-vis-t"><b>${esc(x.nom)}</b><span>${esc(x.d)}</span></span></summary>
  <div class="mc-vis-b"><p>${esc(x.txt)}</p><p class="mc-lab">Formes de monture à essayer</p>
  <div class="mc-fl" role="list">${x.f.map((t) => `<a role="listitem" href="/boutique/etiquette/${t}" data-forme="${t}"><span class="mc-fi">${frameIcon(t)}</span><span class="mc-fn">${esc(nomForme(t))}</span><span class="mc-fs">Voir les montures</span></a>`).join("")}</div>
  <p class="mc-small">Un repère, pas une règle : le mieux reste d'essayer. <a href="/boutique/categorie/lunettes-de-vue">Toutes les montures de vue</a> · <a href="/boutique/categorie/lunettes-de-soleil">Lunettes de soleil</a></p></div></details>`;
const selecteur = (title = "Quelle forme pour votre visage ?", lead = "Choisissez la forme de votre visage : nous vous montrons les formes de monture à essayer, et chaque lien ouvre le vrai catalogue.") => sec(`<section class="mc-selsec pk-bleed" data-monture-visage><div class="mc-wrap"><p class="mc-lab">Sélecteur de formes</p><h2 class="mc-h2">${esc(title)}</h2><p class="mc-lead">${esc(lead)}</p>
  <div class="mc-sel"><div class="mc-stage mc-glass" data-mc-stage>${stageStatic("ovale", "pantos", 0.4)}<p class="mc-vh" role="status" aria-live="polite" data-mc-status></p></div>
  <div class="mc-vlist">${VISAGES.map(visageBloc).join("")}</div></div>
  <p class="mc-note">Les prix, promotions et disponibilités affichés ensuite sont ceux de la boutique. Aucun essayage virtuel : l'illustration est schématique.</p></div></section>`);

const formesGrille = () => sec(`<section class="mc-sec pk-bleed"><div class="mc-wrap"><p class="mc-lab">Les sept formes</p><h2 class="mc-h2">Du cercle au papillon</h2>
  <div class="mc-fgrid">${FORMES.map(([t, n, d]) => `<a class="mc-fcard mc-rv" href="/boutique/etiquette/${t}"><span class="mc-fi">${frameIcon(t)}</span><b>${esc(n)}</b><span>${esc(d)}</span><span class="mc-fs">Voir les montures</span></a>`).join("")}</div></div></section>`);

/* ----- Architecture d'une monture ----- */
const PARTS = [["La façade", "Le cadre qui entoure les verres. Sa forme fait l'allure."], ["Le pont", "Il enjambe le nez ; sa largeur se lit en millimètres."], ["Les plaquettes", "Les appuis sur le nez, souvent réglables sur une monture métal."], ["La charnière", "L'articulation entre façade et branche, vissée ou serrée."], ["La branche", "Elle passe sur l'oreille ; sa longueur se lit aussi en millimètres."]];
const anatomie = (dark = true) => sec(`<section class="mc-anat${dark ? " mc-anat--d" : ""} pk-bleed"><div class="mc-wrap mc-anat-g"><div class="mc-anat-t"><p class="mc-lab">Architecture</p><h2 class="mc-h2">Cinq pièces, un seul objet</h2><p class="mc-lead">Une monture se lit comme un petit bâtiment : une façade, un pont, des appuis, une articulation, deux branches.</p>
  <ol class="mc-parts">${PARTS.map(([t, d], i) => `<li><span class="mc-pn">${i + 1}</span><span><b>${esc(t)}</b> ${esc(d)}</span></li>`).join("")}</ol></div>
  <div class="mc-anat-fig mc-glass">${frame("pantos", "mc-big")}<svg class="mc-pads" viewBox="0 0 200 80" aria-hidden="true"><ellipse class="mc-fr" cx="92" cy="50" rx="2.6" ry="6"/><ellipse class="mc-fr" cx="108" cy="50" rx="2.6" ry="6"/></svg>${PARTS.map((_, i) => `<i class="mc-pin mc-pin--${i + 1}" aria-hidden="true">${i + 1}</i>`).join("")}</div></div></section>`);

const cotes = () => sec(`<section class="mc-sec pk-bleed"><div class="mc-wrap mc-narrow"><p class="mc-lab">Lire les cotes</p><h2 class="mc-h2">49 □ 21 – 145</h2><p class="mc-lead">Trois nombres, gravés à l'intérieur d'une branche, suffisent à comparer deux montures.</p>
  <dl class="mc-dl"><div><dt>Calibre</dt><dd>49</dd><dd class="mc-dd-s">Largeur d'un verre, en millimètres.</dd></div><div><dt>Pont</dt><dd>21</dd><dd class="mc-dd-s">Espace entre les deux verres, au-dessus du nez.</dd></div><div><dt>Branche</dt><dd>145</dd><dd class="mc-dd-s">Longueur de la branche, en millimètres.</dd></div></dl>
  <p class="mc-small">Astuce : relevez ces trois nombres sur une monture que vous portez déjà et à laquelle vous êtes habitué ; sur chaque fiche, les cotes figurent dans la description.</p></div></section>`);

const MATIERES = [
  ["Acétate de cellulose", "Une matière translucide, taillée et polie : elle laisse passer la lumière.", [["Aspect", "Cristal, écaille, uni"], ["Finition", "Biseautée et polie"], ["Entretien", "Eau tiède, savon doux"], ["Réglage", "À chaud, par un opticien"]]],
  ["Titane", "Un métal léger, fin et durable, pour des montures presque invisibles.", [["Aspect", "Brossé ou poli"], ["Finition", "Teinte appliquée en surface"], ["Entretien", "Chiffon microfibre"], ["Réglage", "Plaquettes réglables"]]],
  ["Verres teintés", "Sur les solaires, la teinte donne la couleur du regard.", [["Aspect", "Fumé, brun, vert"], ["Montage", "Verres montés en atelier"], ["Entretien", "Spray nettoyant, microfibre"], ["Rangement", "Étui rigide"]]],
];
const matieres = () => sec(`<section class="mc-sec mc-sec--g pk-bleed"><div class="mc-wrap mc-narrow"><p class="mc-lab">Matières</p><h2 class="mc-h2">Ce que l'on tient entre les doigts</h2>
  <div class="mc-fiches">${MATIERES.map((f, i) => `<details class="mc-fiche"${i === 0 ? " open" : ""}><summary><span class="mc-fiche-t">${esc(f[0])}</span><span class="mc-fiche-s">${esc(f[1])}</span></summary><dl class="mc-sp">${f[2].map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl></details>`).join("")}</div></div></section>`);

/* ----- En-tête, pied, tête de page ----- */
const header = (c) => `<header class="mc-head pk-bleed"><div class="mc-promo">Montures vendues sans verres correcteurs · Livraison et retours : voir les conditions</div>
  <div class="mc-bar"><div class="mc-side"><a class="mc-sidelink" href="/formes">Trouver ma forme</a></div>
  <a class="mc-logo" href="/" aria-label="Monture Claire, accueil">${ICON.mark}<span class="mc-logo-n">Monture Claire</span><i>lunetterie d'objet</i></a>
  <div class="mc-nav mc-nav--ic" role="navigation" aria-label="Boutique"><a class="mc-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="mc-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div>
  <div class="mc-nav mc-nav--main" role="navigation" aria-label="Navigation principale">${c.menu.filter((m) => m.url !== "/formes" && m.url !== "/faq" && m.url !== "/contact").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></header>`;
const footer = (c) => `<footer class="mc-foot pk-bleed"><div class="mc-wrap mc-foot-g">
  <div><p class="mc-lab">Monture Claire</p><p class="mc-small">Lunetterie d'objet.<br>Montures et lunettes de soleil, présentées avec toutes leurs cotes.</p></div>
  <div><p class="mc-lab">Boutique</p><p class="mc-fl2"><a href="/boutique/categorie/lunettes-de-vue">Lunettes de vue</a><a href="/boutique/categorie/lunettes-de-soleil">Lunettes de soleil</a><a href="/boutique/categorie/clips-solaires">Clips solaires</a><a href="/boutique/categorie/etuis-et-entretien">Étuis et entretien</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="mc-lab">Informations</p><p class="mc-fl2">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="mc-lab">Entretien</p><p class="mc-small">Eau tiède, savon doux, chiffon microfibre. Évitez de poser vos lunettes verres contre une surface.</p></div></div>
  <p class="mc-copy">© Monture Claire — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="mc-ph pk-bleed"><div class="mc-wrap mc-narrow"><p class="mc-lab">${esc(kicker)}</p><div class="mc-h1" role="heading" aria-level="1">${esc(title)}</div><p class="mc-lead">${esc(lead)}</p></div></section>`);

/* ----- Pages ----- */
const home = (c) => [sec(header(c)),
  sec(`<section class="mc-hero pk-bleed"><div class="mc-wrap mc-hero-in"><div class="mc-hero-t"><p class="mc-lab">Collection de saison</p><div class="mc-h1 mc-h1--xl" role="heading" aria-level="1">Des montures<br>pensées comme<br><em>des objets</em></div><p class="mc-lead">Acétate poli, titane brossé, verres clairs ou fumés. Chaque modèle est présenté avec ses cotes, sa matière et ses coloris, sans promesse de saison.</p><p><a class="mc-btn" href="/formes">Trouver ma forme</a> <a class="mc-link" href="/boutique">Voir toute la boutique</a></p></div>
    <div class="mc-hero-fig"><div class="mc-glass mc-hero-glass">${frame("pantos", "mc-hero-fr")}<div class="mc-cotes" aria-hidden="true"><span></span><span class="mc-cote"><b>49</b></span><span class="mc-cote mc-cote--p"><b>21</b></span><span class="mc-cote"><b>49</b></span><span></span></div></div>
    <p class="mc-cap">Modèle Arche, vu de face. Calibre 49 · pont 21 · branche 145.</p></div></div></section>`),
  selecteur(),
  sec(`<section class="mc-sec pk-bleed"><div class="mc-wrap"><p class="mc-lab">Les montures</p><h2 class="mc-h2">À la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "5/4" })),
  anatomie(true),
  sec(`<section class="mc-sec pk-bleed"><div class="mc-wrap"><p class="mc-lab">Au soleil</p><h2 class="mc-h2">Verres fumés, lignes nettes</h2></div></section>`),
  wrap(shopgrid({ source: "category", category: "lunettes-de-soleil", count: 3, columns: "3", orderby: "featured", ratio: "5/4" })),
  sec(`<section class="mc-sec pk-bleed"><div class="mc-wrap mc-narrow"><p class="mc-lab">Nos engagements</p><ul class="mc-vals"><li><b>Toutes les cotes</b>Calibre, pont et branche sont indiqués pour chaque modèle.</li><li><b>Montures sans verres</b>Les verres correcteurs ne sont pas vendus ici : le montage se fait chez l'opticien de votre choix.</li><li><b>Prix honnêtes</b>Les prix affichés sont les prix payés. Pas de fausse urgence, pas de compte à rebours.</li></ul></div></section>`),
  sec(footer(c))];

const formes = (c) => [sec(header(c)), head("Sélecteur de formes", "Trouver sa forme", "Cinq visages, sept formes de monture : un point de départ pour essayer avec méthode."), selecteur("Choisissez votre visage", "Ouvrez la forme qui ressemble le plus à la vôtre."), formesGrille(), sec(footer(c))];
const architecture = (c) => [sec(header(c)), head("Architecture", "Anatomie d'une monture", "Les pièces, les cotes et les matières, expliquées simplement."), anatomie(false), cotes(), matieres(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="mc-sec pk-bleed"><div class="mc-wrap mc-narrow mc-prose"><h2 class="mc-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Chaque monture voyage dans son étui rigide.</p><h2 class="mc-h2">Retours</h2><p>Les conditions de retour sont celles indiquées par la boutique au moment de la commande. Pour toute question, écrivez-nous depuis la page <a href="/contact">contact</a>.</p><h2 class="mc-h2">Verres correcteurs</h2><p>Les montures sont vendues seules. Pour les équiper de verres, rapprochez-vous de l'opticien de votre choix, avec votre ordonnance.</p><h2 class="mc-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Cotes, matières, verres, entretien."),
  sec(`<section class="mc-sec pk-bleed"><div class="mc-wrap mc-narrow"><details class="mc-q"><summary>Comment choisir la bonne taille ?</summary><p>Relevez le calibre, le pont et la branche inscrits à l'intérieur d'une monture que vous portez bien, puis comparez avec les cotes indiquées sur la fiche.</p></details><details class="mc-q"><summary>Les montures sont-elles vendues avec des verres ?</summary><p>Non, ce sont des montures seules. Un opticien monte les verres selon votre ordonnance.</p></details><details class="mc-q"><summary>Comment entretenir l'acétate et le titane ?</summary><p>Rincez à l'eau tiède avec un peu de savon doux, puis essuyez avec un chiffon microfibre.</p></details><details class="mc-q"><summary>Les conseils de forme sont-ils une règle ?</summary><p>Non, ce sont des repères esthétiques. L'essentiel est de se sentir bien avec sa monture.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une taille, une matière, une commande."), { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une monture", "Un modèle, une forme, une matière."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une monture…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="mc-ph pk-bleed"><div class="mc-wrap mc-narrow"><p class="mc-lab">Page introuvable</p><div class="mc-h1 mc-h1--xl" role="heading" aria-level="1">Verre <em>embué</em></div><p class="mc-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "monture-claire", name: "Monture Claire", version: "1.0.0", category: "luxe", tags: ["luxe", "minimaliste", "moderne"], siteType: "Lunetterie de luxe", featured: true,
  concept: "La monture comme objet : cristal gris-bleu, verre dépoli, filets fins, écaille ambrée, cotes affichées, et un sélecteur de formes par visage relié au vrai catalogue.",
  description: "Lunetterie de luxe : fond cristal, verre dépoli à reflet lent, montures dessinées en SVG avec leurs cotes, anatomie d'une monture, fiches matières dépliantes et sélecteur de formes par visage (ovale, rond, carré, cœur, long) relié aux étiquettes réelles de la boutique.",
  brand: "Monture Claire", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "vitrine-de-verre-paysage-coins-opposes", gallery: "grande-vitrine-de-verre-puis-details", cart: "page-dediee-verre-depoli-filets", catalog: "barre-de-filtres-sur-verre-depoli" },
  dna: {
    header: "logo-centre-deux-verres-branches-en-filets-navigation-sous-le-pont", hero: "monture-cotee-sur-verre-depoli-mesures-calibre-pont", grid: "trois-colonnes-paysage-vitrines-de-verre", typo: "jost-leger-et-newsreader",
    shapes: "coins-de-verre-opposes-et-filets-de-cote", motion: "reflet-lent-qui-glisse-sur-le-verre", rhythm: "alternance-cristal-clair-et-verre-fume", signature: "selecteur-de-formes-par-visage",
    palette: "cristal-gris-bleu-et-ecaille-ambree", image: "montures-svg-de-face-sans-texte-ni-photo", list: "vitrines-paysage-prix-sous-filet-de-cote",
    article: "colonne-etroite-cotes-en-grandes-valeurs", sidebar: "aucune-cotes-integrees-a-la-fiche", reading: "newsreader-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#8a4b12", secondary: "#101a1f", accent: "#d9a15a", background: "#e8eef0", surface: "#f6f9fa", text: "#101a1f", muted: "#4f5f67", success: "#3f6b4a", warning: "#8a6a2f", error: "#a23b34" },
    fonts: { heading: "font.jost", body: "font.newsreader", button: "font.jost", link: "font.newsreader" },
    radius: { sm: 0, md: 2, lg: 6, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#bccbd1" },
    type: { h1: { size: 58, weight: 300, lineHeight: 1.06, transform: "none" }, h2: { size: 34, weight: 300, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "ecaille", label: "Couleur d'écaille (accent)", type: "color", default: "#8a4b12" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "cristal", choices: [["cristal", "Cristal gris-bleu"], ["blanc", "Blanc glacé"]] },
    { key: "reflet", label: "Reflet qui glisse sur le verre", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "coins", label: "Coins des vitrines", type: "choice", default: "opposes", choices: [["opposes", "Arrondis opposés"], ["droits", "Droits"]] },
    { key: "cotes", label: "Cotes sous la monture du héros", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "visage", label: "Visage ouvert au départ", type: "choice", default: "ovale", choices: [["ovale", "Ovale"], ["rond", "Rond"], ["carre", "Carré"], ["coeur", "En cœur"], ["long", "Long"]] },
    { key: "grille", label: "Grille du catalogue", type: "choice", default: "trois", choices: [["trois", "Trois colonnes"], ["deux", "Deux colonnes larges"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Lunettes de vue", "/boutique/categorie/lunettes-de-vue"], ["Lunettes de soleil", "/boutique/categorie/lunettes-de-soleil"], ["Trouver ma forme", "/formes"], ["Architecture", "/architecture"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "formes", name: "Trouver sa forme", render: formes }, { key: "architecture", name: "Architecture d'une monture", render: architecture },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
