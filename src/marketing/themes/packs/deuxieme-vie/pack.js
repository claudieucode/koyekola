// Deuxième Vie — mode de seconde main premium. Direction artistique : l'étiquette cartonnée qui pend à un vêtement, sur du papier recyclé, en bleu de travail et rouge ficelle.
// Composant signature : la FICHE D'ÉTAT DU PRODUIT — une échelle à quatre niveaux (neuf avec étiquette, très bon état, bon état, état correct) dont chaque ligne ouvre le VRAI catalogue
// filtré par l'étiquette correspondante (/boutique/etiquette/<étiquette>). Le bloc est éditable dans le Page Builder ; l'état de chaque pièce est une vraie étiquette du produit, jamais un texte codé en dur.
// Bloc IMPACT : aucun chiffre n'est inventé. Les cases chiffrées sont des emplacements « à remplacer » que la boutique remplit avec ses propres chiffres ET leur source ; sans source, on garde le texte qualitatif.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

/* Échelle d'état : [étiquette réelle, libellé, niveau sur 4, définition]. Chaque étiquette existe dans demo.js. */
const ETATS = [
  ["neuf-avec-etiquette", "Neuf avec étiquette", 4, "Jamais porté, étiquette d'origine encore attachée."],
  ["tres-bon-etat", "Très bon état", 3, "Peu porté, sans défaut visible à distance normale. Un détail mineur éventuel est décrit."],
  ["bon-etat", "Bon état", 2, "Signes d'usage légers (petites bouloches, léger défraîchissement). Chacun est décrit en toutes lettres."],
  ["etat-correct", "État correct", 1, "Usure ou petit défaut visible (tache, accroc, couture reprise), décrit précisément. Le prix en tient compte."],
];
const gauge = (n) => `<span class="dv-g" data-n="${n}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
const ligne = ([t, l, n, d]) => `<a class="dv-et" href="/boutique/etiquette/${t}" data-dv-etat>${gauge(n)}<span class="dv-et-t"><b>${esc(l)}</b><span>${esc(d)}</span></span><span class="dv-et-n">Niveau ${n} sur 4</span></a>`;

const header = (c) => `<header class="dv-head pk-bleed"><p class="dv-ann">Pièces uniques : l'état est noté et les défauts sont décrits sur chaque fiche.</p>
  <div class="dv-bar"><div class="dv-nav" role="navigation" aria-label="Rubriques">${c.menu.slice(1, 5).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <a class="dv-logo" href="/" aria-label="Deuxième Vie, accueil"><span class="dv-hole" aria-hidden="true"></span><b>Deuxième</b><i>Vie</i></a>
  <div class="dv-act"><a href="/boutique/souhaits">Souhaits</a><a href="/boutique/compte">Compte</a><a class="dv-cart" href="/boutique/panier">Panier</a></div></div>
  <div class="dv-ong" role="navigation" aria-label="Par état"><span>Par état</span>${ETATS.map(([t, l]) => `<a href="/boutique/etiquette/${t}">${esc(l)}</a>`).join("")}<a href="/boutique">Toutes les pièces</a></div></header>`;
const footer = (c) => `<footer class="dv-foot pk-bleed"><div class="dv-wrap dv-foot-g"><div><p class="dv-big">Deuxième Vie</p><p class="dv-small">Mode de seconde main : des pièces choisies une à une, un état noté, des défauts dits.</p></div>
  <div><p class="dv-lab">Boutique</p><p class="dv-fl"><a href="/boutique">Toutes les pièces</a>${ETATS.map(([t, l]) => `<a href="/boutique/etiquette/${t}">${esc(l)}</a>`).join("")}<a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="dv-lab">Infos</p><p class="dv-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><p class="dv-copy">© Deuxième Vie — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="dv-ph pk-bleed"><div class="dv-wrap"><p class="dv-lab">${esc(kicker)}</p><div class="dv-h1" role="heading" aria-level="1">${esc(title)}</div><p class="dv-lead">${esc(lead)}</p></div></section>`);

/* SIGNATURE 1 : la fiche d'état (liens vers les vraies étiquettes) */
const fiche = (title = "Quel état, exactement ?", lead = "Chaque pièce porte une étiquette d'état. Choisissez le niveau qui vous convient : le catalogue s'ouvre filtré, avec les vrais prix et la vraie disponibilité.") => sec(`<section class="dv-fiche pk-bleed"><div class="dv-wrap"><p class="dv-lab">Fiche d'état</p><h2 class="dv-h2">${esc(title)}</h2><p class="dv-lead">${esc(lead)}</p>
  <div class="dv-ets">${ETATS.map(ligne).join("")}</div>
  <p class="dv-small">Les défauts éventuels sont toujours écrits dans la description de la pièce. Le prix neuf de référence, quand vous le connaissez, se note aussi dans la description. Texte modèle : à adapter à vos pratiques.</p></div></section>`);

/* SIGNATURE 2 : l'impact. Aucun chiffre inventé : emplacements à remplacer, avec source obligatoire. */
const SLOTS = [["Pièces remises en circulation", "Votre chiffre"], ["Émissions de CO₂ évitées", "Votre chiffre et son unité"], ["Eau économisée", "Votre chiffre et son unité"]];
const impact = () => sec(`<section class="dv-imp pk-bleed"><div class="dv-wrap"><p class="dv-lab">Impact</p><h2 class="dv-h2">Ce que la seconde main change, et ce qu'elle ne change pas</h2>
  <div class="dv-imp-g"><div class="dv-imp-t"><p>Acheter une pièce déjà fabriquée évite d'en produire une neuve, et prolonge la vie d'un vêtement. C'est un geste utile, pas un geste neutre : le transport, l'emballage et le nettoyage ont aussi un coût pour la planète.</p>
  <p>Nous ne donnons un chiffre que lorsque nous pouvons dire d'où il vient. Les trois cases ci-contre sont des emplacements à remplir avec vos propres chiffres, leur méthode de calcul et leur source. Sans source, supprimez la case et gardez ce texte.</p></div>
  <div class="dv-imp-c">${SLOTS.map(([k, v]) => `<div class="dv-slot"><span class="dv-flag">Exemple à remplacer</span><p class="dv-k">${esc(k)}</p><p class="dv-v">[${esc(v)}]</p><p class="dv-src">Source : [à indiquer : étude, méthode, année]</p></div>`).join("")}</div></div></div></section>`);

const trois = () => sec(`<section class="dv-sec dv-sec--k pk-bleed"><div class="dv-wrap"><p class="dv-lab">Comment ça marche</p><h2 class="dv-h2">Du bon choix à la bonne taille</h2>
  <ol class="dv-steps"><li><b>Choisissez un état</b>De « neuf avec étiquette » à « état correct » : plus l'usure est visible, plus le prix baisse.</li><li><b>Lisez la fiche</b>L'état et les défauts sont dans la description. La taille se choisit sur la fiche.</li><li><b>Commandez en un geste</b>Le bouton d'achat reste sous votre pouce sur mobile.</li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="dv-hero pk-bleed"><div class="dv-wrap dv-hero-in"><div><p class="dv-lab">Mode de seconde main</p><div class="dv-h1 dv-h1--xl" role="heading" aria-level="1">Des pièces qui<br>ont déjà vécu,<br>et ça se voit bien</div><p class="dv-lead">Chaque vêtement est unique, noté de « neuf avec étiquette » à « état correct », avec ses défauts écrits noir sur blanc. Pas de mauvaise surprise, pas de promesse floue.</p><p><a class="dv-btn" href="/boutique">Voir les pièces</a> <a class="dv-btn dv-btn--o" href="/etat">Lire l'échelle d'état</a></p></div>
  <div class="dv-tagwrap" aria-hidden="true"><div class="dv-tag"><span class="dv-tag-hole"></span><p class="dv-tag-h">Fiche d'état</p><p class="dv-tag-r"><span>Taille</span><u></u></p><p class="dv-tag-r"><span>Matière</span><u></u></p><p class="dv-tag-r"><span>Défauts</span><u></u></p><div class="dv-tag-s">${gauge(3)}</div></div></div></div></section>`),
  fiche(),
  sec(`<section class="dv-sec pk-bleed"><div class="dv-wrap"><p class="dv-lab">Nouveautés</p><h2 class="dv-h2">Arrivées récentes</h2></div></section>`),
  wrap(shopgrid({ source: "newest", count: 8, columns: "4", orderby: "newest", ratio: "4/5" })),
  trois(), impact(),
  sec(`<section class="dv-sec pk-bleed"><div class="dv-wrap"><p class="dv-lab">Petits prix</p><h2 class="dv-h2">Promotions en cours</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 3, columns: "3", orderby: "newest", ratio: "4/5" })),
  sec(footer(c))];

const etat = (c) => [sec(header(c)), head("L'échelle d'état", "Comprendre l'état d'une pièce", "Quatre niveaux, une définition claire pour chacun, et les défauts toujours décrits."), fiche("Les quatre niveaux", "Cliquez sur un niveau pour voir les pièces concernées."),
  sec(`<section class="dv-sec pk-bleed"><div class="dv-wrap dv-prose"><h2 class="dv-h2">Comment lire une fiche</h2><p>Chaque description commence par l'état, puis nomme les défauts : tache, accroc, couture reprise, bouton remplacé. La taille se choisit sur la fiche (variante), et une pièce vendue passe en « rupture de stock » : elle ne revient pas.</p><p>Une photo ne remplace pas un défaut écrit. Si un détail vous inquiète, <a href="/contact">écrivez-nous</a> avant de commander.</p></div></section>`), sec(footer(c))];
const demarche = (c) => [sec(header(c)), head("Notre démarche", "Une mode qui dure", "Ce que nous faisons, ce que nous ne prétendons pas."), impact(),
  sec(`<section class="dv-sec pk-bleed"><div class="dv-wrap dv-prose"><h2 class="dv-h2">Nos engagements, sans slogan</h2><p>Décrire chaque défaut. Ne jamais gonfler un chiffre. Dire quand une information nous manque. Chaque engagement de cette page est un texte modèle : adaptez-le à ce que votre boutique fait vraiment.</p></div></section>`), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="dv-sec pk-bleed"><div class="dv-wrap dv-prose"><h2 class="dv-h2">Livraison</h2><p>Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Les pièces sont pliées dans un emballage sobre.</p><h2 class="dv-h2">Retours</h2><p>Une pièce qui ne correspond pas à sa fiche ? Écrivez-nous depuis la page <a href="/contact">contact</a> avec le numéro de commande. Les conditions précises de retour sont à compléter par la boutique.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "État, taille, retours."),
  sec(`<section class="dv-sec pk-bleed"><div class="dv-wrap dv-prose"><details class="dv-q"><summary>Que veut dire « état correct » ?</summary><p>Une usure ou un petit défaut est visible. Il est décrit dans la fiche et le prix en tient compte. Voir <a href="/etat">l'échelle d'état</a>.</p></details><details class="dv-q"><summary>Comment choisir ma taille ?</summary><p>Les tailles d'une marque varient selon les époques. Choisissez la variante proposée sur la fiche et écrivez-nous en cas de doute.</p></details><details class="dv-q"><summary>Pourquoi une pièce est-elle en rupture ?</summary><p>Chaque pièce est unique : une fois vendue, elle disparaît du stock.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Contact", "Nous écrire", "Une question sur un défaut, une taille ou une pièce à déposer ?"), { type: "form", heading: "Écrire à l'équipe", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une pièce", "Un nom, une matière, une taille."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="dv-ph pk-bleed"><div class="dv-wrap"><p class="dv-lab">Page introuvable</p><div class="dv-h1 dv-h1--xl" role="heading" aria-level="1">Cette étiquette<br>s'est décrochée</div><p class="dv-lead"><a href="/boutique">Retourner à la boutique</a> ou <a href="/etat">lire l'échelle d'état</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "deuxieme-vie", name: "Deuxième Vie", version: "1.0.0", category: "ecommerce", tags: ["editorial", "naturel", "classique"], siteType: "Mode de seconde main premium", featured: false,
  concept: "Une étiquette cartonnée accrochée à un vêtement : papier recyclé, bleu de travail, rouge ficelle, et une fiche d'état à quatre niveaux reliée aux vraies étiquettes de la boutique, avec un bloc d'impact honnête, sans chiffre inventé.",
  description: "Boutique de mode de seconde main : fiche d'état à quatre niveaux reliée aux étiquettes réelles, défauts décrits, bloc d'impact à compléter avec vos propres chiffres sourcés, cartes en étiquettes cartonnées et bouton d'achat fixe sur mobile.",
  brand: "Deuxième Vie", modules: ["formulaires", "recherche", "commerce"], shop: { card: "etiquette-cartonnee-coin-coupe-et-oeillet", gallery: "image-papier-et-fiche-d-etat-collante", cart: "page-dediee-papier-kraft-et-total-souligne", catalog: "onglets-d-etat-et-colonne-de-filtres" },
  dna: {
    header: "annonce-kraft-logo-etiquette-central-et-onglets-d-etat", hero: "titre-en-trois-lignes-et-etiquette-cartonnee-a-remplir", grid: "quatre-colonnes-cartes-etiquettes-a-coin-coupe", typo: "newsreader+hanken-grotesk",
    shapes: "coins-coupes-oeillets-et-pointilles-de-couture", motion: "etiquette-qui-se-balance-au-fil-et-barres-d-etat-qui-se-remplissent", rhythm: "bandes-de-papier-recycle-separees-par-des-filets-pointilles",
    signature: "fiche-d-etat-quatre-niveaux-et-impact-a-sourcer", palette: "papier-recycle-bleu-de-travail-et-rouge-ficelle", image: "surface-de-papier-teinte-sans-photo-et-etiquette-d-etat", list: "etiquettes-cartonnees-prix-en-pied-et-etat-en-tete",
    article: "etapes-numerotees-sur-fiches-lignees", sidebar: "filtres-en-colonne-collante-et-onglets-d-etat", reading: "newsreader-18-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#27507a", secondary: "#1e2328", accent: "#b83e1a", background: "#eae8de", surface: "#fbfaf5", text: "#1e2328", muted: "#555b60", success: "#2d6a4f", warning: "#8a5a00", error: "#a3281c" },
    fonts: { heading: "font.newsreader", body: "font.hanken-grotesk", button: "font.hanken-grotesk", link: "font.hanken-grotesk" },
    radius: { sm: 2, md: 4, lg: 6, button: 2, field: 4, card: 4 }, shadow: { card: "none", button: "0 2px 0 rgba(30,35,40,.35)" }, border: { width: 1.5, color: "#1e2328" },
    type: { h1: { size: 62, weight: 500, lineHeight: 1.02, transform: "none" }, h2: { size: 34, weight: 500, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur principale (bleu de travail)", type: "color", default: "#27507a" },
    { key: "achat", label: "Couleur du bouton d'achat (rouge ficelle)", type: "color", default: "#b83e1a" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "recycle", choices: [["recycle", "Papier recyclé"], ["blanc", "Blanc cassé"], ["kraft", "Kraft clair"]] },
    { key: "balancement", label: "Étiquette qui se balance", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
    { key: "remplissage", label: "Barres d'état qui se remplissent", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
    { key: "coins", label: "Cartes à coin coupé", type: "choice", default: "coupes", choices: [["coupes", "Coin coupé"], ["droits", "Angles droits"]] },
    { key: "annonce", label: "Bandeau d'annonce du haut", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "pointilles", label: "Filets pointillés de couture", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["État des pièces", "/etat"], ["Démarche", "/demarche"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "etat", name: "Échelle d'état", render: etat }, { key: "demarche", name: "Démarche et impact", render: demarche }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
