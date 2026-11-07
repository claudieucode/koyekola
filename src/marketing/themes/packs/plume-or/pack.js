// Plume d'Or — maison d'instruments d'écriture de luxe. Direction artistique : la précision de l'atelier. Fond parchemin froid, laque pétrole, filet d'or double, titres en capitales
// gravées (Forum) ; chaque produit est posé sur un carré de laque. Composant signature : la GRAVURE PERSONNALISÉE avec aperçu —
// un stylo dessiné en SVG, sur lequel le texte tapé s'affiche en direct (aperçu indicatif, fabriqué par motion.js). Le texte réellement commandé se saisit sur la fiche produit,
// via la personnalisation par ligne du moteur (réglage par produit : libellé, longueur maximale, obligatoire) — jamais ici.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const nib = `<svg class="po-nib" viewBox="0 0 24 40" aria-hidden="true"><path d="M12 1l9 17-9 21L3 18z" fill="currentColor"/><path d="M12 14v14" stroke="#0e2a30" stroke-width="1.4" fill="none"/><circle cx="12" cy="14" r="1.8" fill="#0e2a30"/></svg>`;
// Stylo horizontal : fût en laque (couleur portée par la classe), capuchon, clip, bague d'or, plume. Le texte gravé est du HTML superposé (le filtre de sécurité n'accepte pas <text>).
const pen = (label) => `<div class="po-pen" role="img" aria-label="${esc(label)}"><svg viewBox="0 0 640 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <rect class="po-b" x="150" y="22" width="360" height="46" rx="23"/><rect class="po-c" x="20" y="28" width="150" height="34" rx="17"/>
  <rect class="po-g" x="168" y="22" width="9" height="46"/><rect class="po-g" x="182" y="22" width="3" height="46"/><rect class="po-g" x="486" y="22" width="9" height="46"/>
  <path class="po-g" d="M34 36h96v4H34z"/><path class="po-n" d="M510 28l92 17-92 17z"/><line class="po-l" x1="530" y1="45" x2="590" y2="45"/>
  <rect class="po-s" x="150" y="26" width="360" height="5" rx="2.5"/></svg>
  <span class="po-engr" data-po-out>A. Marchand</span></div>`;

const header = (c) => `<header class="po-head pk-bleed"><div class="po-promo">Gravure offerte sur toute la collection · Étui écrin inclus</div>
  <div class="po-bar"><a class="po-logo" href="/" aria-label="Plume d'Or, accueil">${nib}<span>Plume d'Or<i>instruments d'écriture</i></span></a>
  <details class="po-menu"><summary><span class="po-sum-t">Menu</span></summary><div class="po-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></details>
  <div class="po-act"><a href="/boutique/compte">Compte</a><a class="po-cart" href="/boutique/panier">Panier</a></div></div></header>`;
const footer = (c) => `<footer class="po-foot pk-bleed"><div class="po-wrap po-foot-g">
  <div><p class="po-lab">Plume d'Or</p><p class="po-small">Atelier de précision, Saint-Claude.<br>Visites sur rendez-vous.</p></div>
  <div><p class="po-lab">Boutique</p><p class="po-fl"><a href="/boutique">Tous les instruments</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="po-lab">Informations</p><p class="po-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="po-lab">Entretien</p><p class="po-small">Rincez la plume à l'eau tiède, essuyez sans frotter, rangez le stylo à plat dans son étui.</p></div></div>
  <p class="po-copy">© Plume d'Or — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="po-ph pk-bleed"><div class="po-wrap po-narrow"><p class="po-lab">${esc(kicker)}</p><div class="po-h1" role="heading" aria-level="1">${esc(title)}</div><p class="po-lead">${esc(lead)}</p></div></section>`);

// Composant signature : gravure personnalisée avec aperçu. Sans script, l'aperçu garde un texte d'exemple fixe ; avec motion.js, un champ de saisie et des styles sont ajoutés.
const gravure = () => sec(`<section class="po-grav pk-bleed" data-po-grav data-max="20"><div class="po-wrap"><p class="po-lab">Gravure personnalisée</p><h2 class="po-h2">Votre nom sur le fût</h2>
  <div class="po-stage">${pen("Aperçu d'un stylo laqué portant une gravure")}</div>
  <div class="po-tools" data-po-tools></div>
  <div class="po-note"><p class="po-small"><b>Aperçu indicatif.</b> Il montre la forme et la place de la gravure, pas le rendu exact au laser. Le texte à graver se saisit sur la fiche du stylo, dans le champ de personnalisation, quand la maison l'a activé pour ce produit ; sa longueur maximale est fixée par produit. Le prix ne change pas avec la gravure.</p></div>
  <p><a class="po-btn" href="/boutique">Choisir un stylo à graver</a></p></div></section>`);

const PLUMES = [["EF", "Extra-fine", "Trait de 0,4 mm. Notes serrées, petits carnets."], ["F", "Fine", "Trait de 0,5 mm. L'écriture quotidienne."], ["M", "Moyenne", "Trait de 0,7 mm. Souple, généreuse en encre."], ["B", "Large", "Trait de 1 mm. Signatures et calligraphie."]];
const MATIERES = [["Laque de Chine", "Vingt couches posées à la main, polies entre chacune.", [["Séchage", "6 semaines"], ["Finition", "Brillante"], ["Entretien", "Chiffon doux"]]],
  ["Résine précieuse", "Moulée en bloc puis tournée : aucun fût n'a les mêmes veines.", [["Tournage", "À l'unité"], ["Finition", "Satinée"], ["Entretien", "Eau tiède"]]],
  ["Plume or 18 carats", "Taillée à la main, réglée à l'écriture avant l'expédition.", [["Alliage", "750 ‰"], ["Réglage", "Atelier"], ["Garantie", "Deux ans"]]]];
const plumes = () => sec(`<section class="po-plumes pk-bleed"><div class="po-wrap"><p class="po-lab">Choisir sa plume</p><h2 class="po-h2">Quatre largeurs de trait</h2>
  <div class="po-tr">${PLUMES.map((p) => `<div class="po-tr-i"><span class="po-tr-k">${esc(p[0])}</span><b>${esc(p[1])}</b><span>${esc(p[2])}</span><i class="po-trait po-trait--${p[0].toLowerCase()}" aria-hidden="true"></i></div>`).join("")}</div></div></section>`);
const matiere = () => sec(`<section class="po-mat pk-bleed"><div class="po-wrap"><p class="po-lab">Matières</p><h2 class="po-h2">Ce que l'on tient en main</h2>
  <div class="po-fiches">${MATIERES.map((f, i) => `<details class="po-fiche"${i === 0 ? " open" : ""}><summary><span class="po-fiche-n">0${i + 1}</span><span class="po-fiche-t">${esc(f[0])}</span><span class="po-fiche-s">${esc(f[1])}</span></summary><dl class="po-dl">${f[2].map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl></details>`).join("")}</div></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="po-hero pk-bleed"><div class="po-wrap po-hero-in"><div class="po-hero-t"><p class="po-lab">Atelier d'écriture · Saint-Claude</p><div class="po-h1 po-h1--xl" role="heading" aria-level="1">Le geste<br>d'écrire,<br>précisé</div><p class="po-lead">Stylos plume, roller et porte-mines montés à la main, plume d'or réglée sur votre écriture. Une pièce, un nom, gravé.</p><p><a class="po-btn" href="/boutique">Voir la collection</a> <a class="po-link" href="/gravure">Graver un stylo</a></p></div>
    <div class="po-hero-art" aria-hidden="true"><div class="po-hero-pen"></div><div class="po-hero-rule"></div></div></div></section>`),
  sec(`<section class="po-sec pk-bleed"><div class="po-wrap"><p class="po-lab">La collection</p><h2 class="po-h2">Instruments à la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "1/1" })),
  gravure(), plumes(), matiere(),
  sec(`<section class="po-sec pk-bleed"><div class="po-wrap po-narrow"><p class="po-lab">Nos engagements</p><ul class="po-vals"><li><b>Réglé</b>Chaque plume est essayée et réglée à la main avant l'envoi.</li><li><b>Réparable</b>Une plume tordue ou un remplissage capricieux : l'atelier répare, à vie.</li><li><b>Honnête</b>Les prix affichés sont les prix payés. Pas de compte à rebours, pas de fausse rareté.</li></ul></div></section>`),
  sec(footer(c))];

const gravurePage = (c) => [sec(header(c)), head("Gravure", "Graver un stylo", "Voir où ira votre texte avant de le commander."), gravure(),
  sec(`<section class="po-sec pk-bleed"><div class="po-wrap po-narrow po-prose"><h2 class="po-h2">Comment ça se passe</h2><ol class="po-steps"><li>Choisissez un stylo dans la <a href="/boutique">boutique</a>.</li><li>Sur sa fiche, saisissez le texte à graver dans le champ prévu, s'il est proposé.</li><li>Le texte suit la ligne de commande : l'atelier le reçoit tel que vous l'avez écrit.</li></ol><p>Si une fiche ne propose pas de champ de gravure, ce modèle ne se grave pas. Pour une demande particulière, écrivez-nous depuis la page <a href="/contact">contact</a>.</p></div></section>`), sec(footer(c))];
const atelier = (c) => [sec(header(c)), head("Savoir-faire", "L'atelier", "Matières, plumes et gestes."), matiere(), plumes(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="po-sec pk-bleed"><div class="po-wrap po-narrow po-prose"><h2 class="po-h2">Livraison</h2><p>Chaque instrument voyage dans son étui, calé dans un carton rigide. Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande.</p><h2 class="po-h2">Retours</h2><p>Un stylo non gravé et non encré peut être retourné sous quatorze jours. Une pièce gravée est fabriquée pour vous : écrivez-nous depuis la page <a href="/contact">contact</a> pour étudier votre demande.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Plume, encre, gravure."),
  sec(`<section class="po-sec pk-bleed"><div class="po-wrap po-narrow"><details class="po-q"><summary>Quelle largeur de plume choisir ?</summary><p>La fine (F) convient à la plupart des écritures. Prenez l'extra-fine pour de petits carnets, la large pour signer.</p></details><details class="po-q"><summary>Quelles encres utiliser ?</summary><p>Des encres pour stylo plume, en cartouche ou en flacon. Évitez les encres pigmentées ou de dessin.</p></details><details class="po-q"><summary>Peut-on graver des accents et des symboles ?</summary><p>Les lettres, chiffres et accents courants se gravent. Écrivez-nous pour un symbole ou un logo.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Choisir une plume, offrir, demander une gravure spéciale."), { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un instrument", "Un modèle, une matière, une largeur de plume."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un stylo…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="po-ph pk-bleed"><div class="po-wrap po-narrow"><p class="po-lab">Page introuvable</p><div class="po-h1 po-h1--xl" role="heading" aria-level="1">Plume<br>égarée</div><p class="po-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "plume-or", name: "Plume d'Or", version: "1.0.0", category: "luxe", tags: ["luxe", "classique", "editorial"], siteType: "Instruments d'écriture de luxe", featured: false,
  concept: "La précision de l'atelier : parchemin froid, laque pétrole, filet d'or double, et un aperçu de gravure sur un stylo dessiné où le texte s'écrit en direct.",
  description: "Stylos et instruments d'écriture de luxe : parchemin froid, laque pétrole et filet d'or, produits sur carrés de laque, aperçu de gravure en direct (indicatif), guide des plumes et fiches matières.",
  brand: "Plume d'Or", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carre-laque-legende-gravee", gallery: "image-carree-sur-laque-et-vignettes", cart: "page-dediee-parchemin", catalog: "barre-de-filtres-matiere-et-plume" },
  dna: {
    header: "monogramme-gauche-menu-deroulant-et-bandeau-or", hero: "stylo-oblique-sur-laque-et-regle-graduee", grid: "trois-colonnes-carre-sur-laque", typo: "forum-et-hanken", shapes: "laque-brillante-et-filet-or-double",
    motion: "reflet-de-laque-balayage", rhythm: "precision-d-atelier-regle", signature: "gravure-personnalisee-avec-apercu", palette: "petrole-laque-et-or-champagne",
    image: "produit-sur-carre-de-laque-reflet", list: "cartes-carrees-legende-gravee", article: "fiche-instrument-et-specifications", sidebar: "aucune-fiche-collante-filets", reading: "colonne-moyenne-chiffres-d-atelier",
  },
  tokens: {
    colors: { primary: "#12404a", secondary: "#0b2a30", accent: "#b8964a", background: "#eeebe4", surface: "#f8f6f1", text: "#14262a", muted: "#5d6b6d", success: "#3f6b55", warning: "#8a6a2f", error: "#a23b34" },
    fonts: { heading: "font.forum", body: "font.hanken-grotesk", button: "font.hanken-grotesk", link: "font.hanken-grotesk" },
    radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#cfc9bb" },
    type: { h1: { size: 58, weight: 400, lineHeight: 1.05, transform: "uppercase" }, h2: { size: 32, weight: 400, lineHeight: 1.15, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Couleur du filet d'or", type: "color", default: "#b8964a" },
    { key: "laque", label: "Laque des carrés et du stylo", type: "choice", default: "petrole", choices: [["petrole", "Pétrole"], ["bordeaux", "Bordeaux"], ["nuit", "Bleu nuit"], ["noir", "Noir"]] },
    { key: "fond", label: "Fond", type: "choice", default: "parchemin", choices: [["parchemin", "Parchemin froid"], ["ivoire", "Ivoire"]] },
    { key: "titres", label: "Titres", type: "choice", default: "capitales", choices: [["capitales", "Capitales gravées"], ["normale", "Casse normale"]] },
    { key: "filet", label: "Filet d'or", type: "choice", default: "double", choices: [["double", "Double"], ["simple", "Simple"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "reflet", label: "Reflet de laque", type: "choice", default: "on", choices: [["on", "Balayage au survol"], ["off", "Aucun"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Gravure", "/gravure"], ["L'atelier", "/atelier"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "gravure", name: "Gravure", render: gravurePage }, { key: "atelier", name: "L'atelier", render: atelier },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
