// Corde et bois — boutique d'instruments de musique. Direction artistique : la scène avant le concert. Rideau de velours sombre, cône de projecteur, bois verni, laiton, cordes tendues qui vibrent
// (SVG, aucune photo), portée de cinq lignes sous l'en-tête. Composant signature : les FILTRES PAR NIVEAU ET PAR STYLE — une grille débutant / intermédiaire / pro × classique / folk / jazz / rock.
// C'est un bloc éditable du Page Builder : chaque case est un lien vers une VRAIE étiquette du moteur (/boutique/etiquette/<niveau>-<style>), la grille fonctionne sans script, et motion.js
// ajoute des choix par puces qui surlignent la case et proposent le lien exact. Les cases sans produit ne sont pas des liens. Les accessoires compatibles passent par les étiquettes de famille
// (/boutique/categorie/accessoires?etiquette=<famille>) : un accessoire porte la même étiquette que l'instrument qu'il équipe.
// Audio : le Page Builder a bien un widget « audio », mais il exige l'adresse d'un vrai fichier .mp3/.m4a/.ogg/.wav ; ce thème n'en invente aucun, donc aucune démo sonore n'est affichée.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");
const demo = require("./demo");

const TAGS = new Set(demo.products.flatMap((p) => p[6]));
const NIVEAUX = [["debutant", "Débutant", "Premiers accords, premier instrument"], ["intermediaire", "Intermédiaire", "Vous jouez déjà, vous voulez mieux"], ["pro", "Confirmé", "Scène, studio, conservatoire"]];
const STYLES = [["classique", "Classique"], ["folk", "Folk"], ["jazz", "Jazz"], ["rock", "Rock"]];
const FAMILLES = [["guitare", "Guitare"], ["basse", "Basse"], ["clavier", "Clavier"], ["violon", "Violon"], ["batterie", "Batterie"], ["ukulele", "Ukulélé"]];

/* Illustrations (SVG sans texte, sans photo) */
const FHOLE = `<svg class="cb-fh" viewBox="0 0 40 64" aria-hidden="true"><path d="M20 4c-5 6-3 12 0 16 3 4 3 8-1 12 6-1 9-6 7-12-1-4-4-6-4-10 0-2 1-4 3-6-2-1-4-1-5 0zM20 60c5-6 3-12 0-16-3-4-3-8 1-12-6 1-9 6-7 12 1 4 4 6 4 10 0 2-1 4-3 6 2 1 4 1 5 0z" fill="currentColor"/></svg>`;
const STRINGS = [0, 1, 2, 3, 4, 5].map((i) => `<path class="cb-str cb-str--${i + 1}" d="M20 ${62 + i * 28}H500" fill="none" stroke="currentColor" stroke-width="${(3.2 - i * 0.4).toFixed(1)}" stroke-linecap="round"/>`).join("");
const FRETS = [90, 160, 225, 285, 340, 390].map((x) => `<path d="M${x} 44V198" stroke="#8c6a3c" stroke-width="3" fill="none"/>`).join("");
const neck = (cls = "") => `<svg class="cb-neck ${cls}" viewBox="0 0 520 240" role="img" aria-label="Illustration d'un manche de guitare aux six cordes tendues"><path d="M10 40h340l60-26c40-12 100 4 100 40v132c0 36-60 52-100 40l-60-26H10z" fill="#5a3320"/><path d="M10 44h400v152H10z" fill="#3a2114"/>${FRETS}<circle cx="132" cy="120" r="7" fill="#e6c98a"/><circle cx="252" cy="120" r="7" fill="#e6c98a"/><circle cx="364" cy="108" r="6" fill="#e6c98a"/><circle cx="364" cy="132" r="6" fill="#e6c98a"/><circle class="cb-rose" cx="452" cy="120" r="44" fill="#120b08" stroke="#c8952e" stroke-width="5"/><circle cx="452" cy="120" r="30" fill="none" stroke="#c8952e" stroke-width="2" opacity=".6"/><g class="cb-strs">${STRINGS}</g></svg>`;

const header = (c) => `<header class="cb-head pk-bleed"><div class="cb-strip">Niveau, style, prix et disponibilité : tout se filtre depuis les vraies fiches de la boutique</div>
  <div class="cb-bar"><a class="cb-logo" href="/" aria-label="Corde et bois, accueil">${FHOLE}<span>Corde<i>&amp;</i>Bois</span></a>
  <div class="cb-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="cb-act"><a href="/boutique/compte">Compte</a><a class="cb-cart" href="/boutique/panier">Panier</a></div></div><div class="cb-staff" aria-hidden="true"></div></header>`;
const footer = (c) => `<footer class="cb-foot pk-bleed"><div class="cb-wrap cb-foot-g"><div>${FHOLE}<p class="cb-big">Corde &amp; Bois</p><p class="cb-small">Guitares, claviers, cordes frottées et percussions, pour jouer chez soi comme sur scène.</p></div>
  <div><p class="cb-lab">Boutique</p><p class="cb-fl"><a href="/boutique">Tous les instruments</a><a href="/choisir">Niveau et style</a><a href="/boutique/categorie/accessoires">Accessoires</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="cb-lab">Aide</p><p class="cb-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/" && m.url !== "/choisir").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><p class="cb-copy">© Corde &amp; Bois — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="cb-ph pk-bleed"><div class="cb-wrap"><p class="cb-lab">${esc(kicker)}</p><div class="cb-h1" role="heading" aria-level="1">${esc(title)}</div><p class="cb-lead">${esc(lead)}</p></div></section>`);

/* Grille niveau × style : une case est un lien seulement si l'étiquette existe dans le catalogue de démonstration */
const cell = (n, s) => {
  const t = `${n[0]}-${s[0]}`;
  return TAGS.has(t) ? `<td data-niveau="${n[0]}" data-style="${s[0]}"><a data-kind="combo" data-niveau="${n[0]}" data-style="${s[0]}" href="/boutique/etiquette/${t}"><span class="cb-cl">${esc(n[1])}</span><span class="cb-cs">${esc(s[1])}</span></a></td>`
    : `<td class="cb-none" data-niveau="${n[0]}" data-style="${s[0]}"><span class="cb-vh">Aucun instrument ${esc(n[1].toLowerCase())} en ${esc(s[1].toLowerCase())} pour le moment</span><i aria-hidden="true">—</i></td>`;
};
const filtre = (title = "Quel est votre niveau, quel est votre style ?", lead = "Choisissez une case : elle ouvre le vrai catalogue, filtré par l'étiquette correspondante. Les cases grisées n'ont pas encore d'instrument.") => sec(`<section class="cb-fil pk-bleed" data-corde-filtres><div class="cb-wrap"><p class="cb-lab">Filtres par niveau et par style</p><h2 class="cb-h2">${esc(title)}</h2><p class="cb-lead">${esc(lead)}</p>
  <div class="cb-ui" data-corde-ui></div>
  <div class="cb-mx" data-corde-liste><table class="cb-tab"><caption class="cb-vh">Niveau et style : chaque case ouvre les instruments correspondants</caption><thead><tr><td class="cb-corner"></td>${NIVEAUX.map((n) => `<th scope="col" data-niveau="${n[0]}"><a href="/boutique/etiquette/${n[0]}">${esc(n[1])}</a><span>${esc(n[2])}</span></th>`).join("")}</tr></thead>
  <tbody>${STYLES.map((s) => `<tr data-style-row="${s[0]}"><th scope="row" data-style="${s[0]}"><a href="/boutique/etiquette/${s[0]}">${esc(s[1])}</a></th>${NIVEAUX.map((n) => cell(n, s)).join("")}</tr>`).join("")}</tbody></table></div>
  <p class="cb-small">Les titres de colonne et de ligne ouvrent tout un niveau ou tout un style. Prix et stocks affichés sont ceux de la boutique.</p></div></section>`);

/* Ventes croisées légères : accessoires par famille d'instrument (même étiquette que l'instrument) */
const accessoires = (title = "Les accessoires qui vont avec", lead = "Cordes, accordeurs, housses : chaque accessoire porte l'étiquette de la famille d'instrument qu'il équipe.") => sec(`<section class="cb-acc pk-bleed"><div class="cb-wrap"><p class="cb-lab">Compatibles avec votre instrument</p><h2 class="cb-h2">${esc(title)}</h2><p class="cb-lead">${esc(lead)}</p>
  <p class="cb-chips">${FAMILLES.map(([v, l]) => `<a href="/boutique/categorie/accessoires?etiquette=${v}">${esc(l)}</a>`).join("")}<a class="cb-chips-all" href="/boutique/categorie/accessoires">Tous les accessoires</a></p></div></section>`);

const reperes = () => sec(`<section class="cb-sec cb-sec--alt pk-bleed"><div class="cb-wrap"><p class="cb-lab">Avant d'acheter</p><h2 class="cb-h2">Trois repères pour bien choisir</h2>
  <ol class="cb-steps"><li><b>Votre niveau d'abord</b>Un instrument d'étude bien réglé vaut mieux qu'un modèle pro dont on n'exploite pas la moitié.</li><li><b>Votre style ensuite</b>Cordes nylon pour le classique, acier pour le folk, micros pour le rock : le style guide le type d'instrument.</li><li><b>L'équipement enfin</b>Cordes de rechange, accordeur, housse : on les ajoute depuis les accessoires de la même famille.</li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="cb-hero pk-bleed"><div class="cb-wrap cb-hero-in"><div><p class="cb-lab cb-lab--b">Instruments de musique</p><div class="cb-h1 cb-h1--xl" role="heading" aria-level="1">Jouez.<br>Le reste<br><span>est de la scène</span></div><p class="cb-lead">Guitares, claviers, violons, batteries. Dites-nous votre niveau et votre style : on vous mène aux instruments qui vous conviennent, avec les bons accessoires.</p><p><a class="cb-btn" href="/choisir">Trouver mon instrument</a> <a class="cb-btn cb-btn--o" href="/boutique">Voir la boutique</a></p></div>
  <div class="cb-stage" aria-hidden="true"><div class="cb-spot"></div>${neck()}</div></div></section>`),
  filtre(),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap"><p class="cb-lab">À la une</p><h2 class="cb-h2">La sélection du moment</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 8, columns: "4", orderby: "featured", ratio: "3/4" })),
  accessoires(),
  wrap(shopgrid({ source: "category", category: "accessoires", count: 4, columns: "4", orderby: "featured", ratio: "1/1" })),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap"><p class="cb-lab">Petits prix</p><h2 class="cb-h2">Promotions en cours</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 4, columns: "4", orderby: "newest", ratio: "3/4" })),
  reperes(), sec(footer(c))];

const choisir = (c) => [sec(header(c)), head("Niveau et style", "Trouver mon instrument", "Un niveau, un style : une case, un catalogue filtré."), filtre("Choisissez votre case", "Chaque case mène aux instruments portant l'étiquette correspondante dans la boutique."), accessoires(), reperes(), sec(footer(c))];
const conseils = (c) => [sec(header(c)), head("Conseils", "Bien choisir son instrument", "Niveau, style, budget : les repères de base."),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-prose"><h2 class="cb-h2">Débuter sans se tromper</h2><p>Pour une première guitare, visez un modèle d'initiation correctement réglé : consultez les <a href="/boutique/etiquette/debutant-classique">guitares classiques débutant</a>, les <a href="/boutique/etiquette/debutant-folk">instruments folk débutant</a> ou les <a href="/boutique/etiquette/debutant-rock">guitares électriques débutant</a>.</p>
  <h2 class="cb-h2">Progresser</h2><p>Quand le jeu s'affirme, l'instrument compte davantage : bois massif, micros plus fins, meilleure tenue d'accord. Parcourez les instruments <a href="/boutique/etiquette/intermediaire">intermédiaires</a>.</p>
  <h2 class="cb-h2">Entretenir</h2><p>Changer les cordes, accorder à chaque séance, ranger l'instrument à l'abri de la chaleur : les <a href="/boutique/categorie/accessoires">accessoires</a> sont classés par famille d'instrument. Pour un conseil précis, demandez à votre professeur ou à un luthier.</p></div></section>`), filtre(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-prose"><h2 class="cb-h2">Livraison</h2><p>Les instruments voyagent calés dans un emballage renforcé. Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande, avec le poids et le volume du colis.</p><h2 class="cb-h2">Instrument abîmé ou inadapté</h2><p>Écrivez-nous depuis la page <a href="/contact">contact</a> avec le numéro de commande et des photos : nous trouvons une solution.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Niveau, taille, accessoires."),
  sec(`<section class="cb-sec pk-bleed"><div class="cb-wrap cb-prose"><details class="cb-q"><summary>Comment savoir quel niveau choisir ?</summary><p>Débutant : vous commencez ou vous jouez depuis moins d'un an. Intermédiaire : vous jouez régulièrement et voulez un meilleur son. Confirmé : vous jouez en public ou en studio.</p></details><details class="cb-q"><summary>Quelle taille de violon ou de guitare pour un enfant ?</summary><p>Elle dépend de la longueur de bras et de la taille de la main : consultez la variante « taille » de la fiche et, au besoin, <a href="/contact">écrivez-nous</a>.</p></details><details class="cb-q"><summary>Comment trouver les accessoires compatibles ?</summary><p>Depuis la page <a href="/choisir">niveau et style</a> ou la rubrique <a href="/boutique/categorie/accessoires">accessoires</a>, filtrez par famille d'instrument.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur un instrument ? Dites-nous votre niveau et votre style."), { type: "form", heading: "Écrire à l'équipe", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un instrument", "Un modèle, une marque, un accessoire."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un instrument…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cb-ph pk-bleed"><div class="cb-wrap"><p class="cb-lab cb-lab--b">Page introuvable</p><div class="cb-h1 cb-h1--xl" role="heading" aria-level="1">Fausse note :<br><span>cette page n'existe pas</span></div><p class="cb-lead"><a href="/boutique">Retourner à la boutique</a> ou <a href="/choisir">trouver mon instrument</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "corde-et-bois", name: "Corde et bois", version: "1.0.0", category: "ecommerce", tags: ["chaleureux", "classique", "sombre"], siteType: "Boutique d'instruments de musique", featured: false,
  concept: "La scène avant le concert : rideau sombre, projecteur, bois verni et laiton, cordes qui vibrent, et une grille niveau × style reliée aux vraies étiquettes de la boutique.",
  description: "Instruments de musique : scène aux cordes qui vibrent, grille de filtres niveau × style reliée aux étiquettes réelles, accessoires compatibles par famille, bouton d'achat fixe sur mobile.",
  brand: "Corde et bois", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carte-bois-coins-biseautes-portrait", gallery: "image-portrait-et-infos-decisives-collantes", cart: "page-dediee-ebene-bouton-d-achat-fixe-mobile", catalog: "grille-niveau-style-et-rayons-d-accessoires" },
  dna: {
    header: "bandeau-info-barre-ebene-et-portee-de-cinq-lignes", hero: "scene-rideau-projecteur-et-manche-de-guitare", grid: "quatre-colonnes-cartes-bois-portrait-coins-biseautes", typo: "ibarra-real-nova+albert-sans",
    shapes: "coins-biseautes-ouies-en-f-et-filets-de-laiton", motion: "vibration-des-cordes-et-balayage-du-projecteur", rhythm: "actes-de-concert-alternant-scene-sombre-et-papier-chaud", signature: "grille-niveau-par-style-reliee-aux-etiquettes",
    palette: "ebene-rouge-de-vernis-laiton-sur-papier-de-partition", image: "manche-de-guitare-svg-sans-photo", list: "cartes-bois-portrait-prix-en-laiton",
    article: "reperes-numerotes-en-trois-temps", sidebar: "aucune-chips-d-accessoires-en-bandeau", reading: "albert-sans-17-px-mesure-60-caracteres",
  },
  tokens: {
    colors: { primary: "#a8401f", secondary: "#1b1411", accent: "#c8952e", background: "#ede2cc", surface: "#faf4e6", text: "#241a14", muted: "#6a5848", success: "#2f6b3f", warning: "#8f5a0a", error: "#a8321f" },
    fonts: { heading: "font.ibarra-real-nova", body: "font.albert-sans", button: "font.albert-sans", link: "font.albert-sans" },
    radius: { sm: 2, md: 4, lg: 6, button: 2, field: 3, card: 4 }, shadow: { card: "0 10px 24px rgba(27,20,17,.18)", button: "0 3px 0 rgba(27,20,17,.4)" }, border: { width: 1, color: "#b9a380" },
    type: { h1: { size: 64, weight: 700, lineHeight: 1.02, transform: "none" }, h2: { size: 36, weight: 700, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur du vernis", type: "color", default: "#a8401f" },
    { key: "laiton", label: "Couleur du laiton (filets, prix)", type: "color", default: "#c8952e" },
    { key: "achat", label: "Couleur du bouton d'achat", type: "color", default: "#a8401f" },
    { key: "ambiance", label: "Ambiance de l'accueil", type: "choice", default: "scene", choices: [["scene", "Scène sombre"], ["atelier", "Atelier clair"]] },
    { key: "cordes", label: "Cordes qui vibrent", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
    { key: "projecteur", label: "Cône de projecteur", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "cartes", label: "Angles des cartes", type: "choice", default: "biseautes", choices: [["biseautes", "Coins biseautés"], ["droits", "Coins droits"]] },
    { key: "portee", label: "Portée sous l'en-tête", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "memoire", label: "Retenir le niveau choisi sur cet appareil", type: "choice", default: "on", choices: [["on", "Oui, dans le navigateur"], ["off", "Non"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Niveau et style", "/choisir"], ["Conseils", "/conseils"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "choisir", name: "Niveau et style", render: choisir }, { key: "conseils", name: "Conseils", render: conseils }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
