// Sommeil doux — literie et matelas en ligne. Direction artistique : le crépuscule avant de dormir. Brume lavande, bleu de nuit, lueur de lampe ambrée, formes de galets et de coussins,
// coupe de matelas en couches qui respire doucement. Composant signature : le QUIZ DE RECOMMANDATION DE MATELAS (position de sommeil, sensation, seul ou à deux) qui aboutit à un lien vers
// les VRAIS filtres du catalogue (catégorie « matelas » + étiquette de fermeté). Sans JavaScript, le même choix reste possible avec des repères dépliants et des liens.
// Honnêteté : aucune promesse chiffrée écrite en dur (durée d'essai, délais, prix) — le bloc « essai à domicile » est un texte modèle à adapter à la politique réelle de la boutique.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const CAT = "matelas";
const moon = (cls = "sd-moon") => `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true"><path d="M31 6a19 19 0 1 0 11 33A16 16 0 0 1 31 6z" fill="currentColor"/></svg>`;
const star = (x, y, r) => `<circle class="sd-star" cx="${x}" cy="${y}" r="${r}"/>`;
const layers = () => `<svg class="sd-bed" viewBox="0 0 460 380" role="img" aria-label="Coupe d'un matelas : housse, mousse de confort, ressorts ensachés, base">
  <g aria-hidden="true">${star(60, 50, 2.5)}${star(130, 110, 1.8)}${star(380, 40, 2.2)}${star(430, 120, 1.6)}${star(300, 90, 1.8)}${star(40, 160, 1.6)}</g>
  <path class="sd-bed-moon" d="M352 34a46 46 0 1 0 26 80A38 38 0 0 1 352 34z"/>
  <g class="sd-lay sd-lay--1"><rect class="sd-l1" x="40" y="150" width="380" height="46" rx="23"/><path class="sd-quilt" d="M70 173h320" /></g>
  <g class="sd-lay sd-lay--2"><rect class="sd-l2" x="40" y="196" width="380" height="40" rx="20"/></g>
  <g class="sd-lay sd-lay--3"><rect class="sd-l3" x="40" y="236" width="380" height="70" rx="22"/>${[78, 124, 170, 216, 262, 308, 354].map((x) => `<path class="sd-spring" d="M${x} 246c14 6-14 14 0 20s-14 14 0 20"/>`).join("")}</g>
  <g class="sd-lay sd-lay--4"><rect class="sd-l4" x="40" y="306" width="380" height="30" rx="15"/></g>
  <path class="sd-bed-shadow" d="M70 350h320"/></svg>`;

const header = (c) => `<header class="sd-head pk-bleed"><div class="sd-strip"><a href="/essai">Essai à domicile : conditions détaillées sur la page Essai</a></div>
  <div class="sd-bar"><div class="sd-side"><a href="/recherche">Rechercher</a><a href="/boutique/compte">Compte</a></div>
  <a class="sd-logo" href="/" aria-label="Sommeil doux, accueil">${moon()}<span>Sommeil doux</span></a>
  <div class="sd-side sd-side--r"><a href="/quiz" class="sd-quizlink">Mon matelas</a><a class="sd-cart" href="/boutique/panier">Panier</a></div></div>
  <div class="sd-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></header>`;
const footer = (c) => `<footer class="sd-foot pk-bleed"><div class="sd-wrap sd-foot-g"><div>${moon("sd-moon sd-moon--l")}<p class="sd-small">Literie et matelas.<br>Boutique de démonstration du thème.</p></div>
  <div><p class="sd-lab">Boutique</p><p class="sd-fl"><a href="/boutique?categorie=${CAT}">Matelas</a><a href="/boutique/etiquette/couple">Pour deux</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="sd-lab">Bien choisir</p><p class="sd-fl"><a href="/quiz">Quiz du matelas</a><a href="/essai">Essai à domicile</a><a href="/guide">Guide du sommeil</a></p></div>
  <div><p class="sd-lab">Aide</p><p class="sd-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && !["/", "/quiz", "/essai", "/guide"].includes(m.url)).map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><p class="sd-copy">© Sommeil doux — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="sd-ph pk-bleed"><div class="sd-wrap"><p class="sd-lab">${esc(kicker)}</p><div class="sd-h1" role="heading" aria-level="1">${esc(title)}</div><p class="sd-lead">${esc(lead)}</p></div></section>`);

// ----- Composant signature : le quiz. Les attributs data-* sont lus par motion.js (modifiables dans le Page Builder) ; le contenu ci-dessous est la version SANS script, déjà fonctionnelle.
const POS = [
  ["Je dors sur le côté", "souple", "Épaules et hanches ont besoin de s'enfoncer un peu : un accueil souple garde la colonne alignée."],
  ["Je dors sur le dos", "mi-ferme", "Le creux des reins doit être soutenu sans être poussé : un soutien médian convient à la plupart."],
  ["Je dors sur le ventre", "ferme", "Le bassin ne doit pas s'enfoncer : une surface plus ferme évite de cambrer le dos."],
];
const PL = { souple: "souples", "mi-ferme": "mi-fermes", ferme: "fermes" };
const fallback = () => `<div class="sd-fb"><p class="sd-fb-t">Votre position de sommeil donne un premier repère. Ouvrez la vôtre.</p>
  ${POS.map(([t, tag, why], i) => `<details class="sd-fbq"${i === 0 ? " open" : ""}><summary>${esc(t)}</summary><p>${esc(why)}</p><a class="sd-btn" href="/boutique?categorie=${CAT}&etiquette=${tag}">Voir les matelas ${PL[tag]}</a></details>`).join("")}
  <details class="sd-fbq"><summary>Je change de position dans la nuit</summary><p>Un soutien médian est le choix le plus polyvalent : ni trop enveloppant, ni trop plat.</p><a class="sd-btn" href="/boutique?categorie=${CAT}&etiquette=mi-ferme">Voir les matelas mi-fermes</a></details>
  <p class="sd-small">Vous dormez à deux ? <a href="/boutique/etiquette/couple">Voir les matelas conçus pour les couples</a> (mouvements mieux isolés).</p></div>`;
const quizBloc = (title = "Quel matelas pour votre façon de dormir ?") => sec(`<section class="sd-quiz pk-bleed"><div class="sd-wrap"><p class="sd-lab sd-lab--l">Quiz de recommandation</p><h2 class="sd-h2">${esc(title)}</h2>
  <p class="sd-lead">Trois questions, une recommandation de fermeté. Le résultat ouvre le vrai catalogue, déjà filtré.</p>
  <div class="sd-qz" data-sommeil-quiz data-cat="${CAT}" data-tags="souple;mi-ferme;ferme" data-couple="couple">${fallback()}</div>
  <p class="sd-note">Repère général fondé sur la position de sommeil et la sensation recherchée, pas un avis médical. Le poids, les douleurs et les habitudes comptent aussi : en cas de douleur persistante, parlez-en à un professionnel de santé. L'essai à domicile, s'il est proposé par la boutique, permet de vérifier le choix en vrai.</p></div></section>`);

// ----- Bloc « essai à domicile » : texte modèle à adapter. Aucun chiffre promis ici.
const essaiBloc = (full = false) => sec(`<section class="sd-essai pk-bleed"><div class="sd-wrap sd-essai-in"><div><p class="sd-lab">Essai à domicile</p><h2 class="sd-h2">Dormez dessus avant de décider</h2>
  <p class="sd-lead">Un matelas se juge après plusieurs nuits, pas en trois minutes. Le corps a souvent besoin d'un temps d'adaptation.</p>
  <p class="sd-badge">Texte modèle à adapter à la politique réelle de la boutique</p></div>
  <ol class="sd-steps"><li><b>Commandez et recevez</b><span>Livraison calculée à la commande selon votre pays et la méthode choisie.</span></li><li><b>Dormez dessus</b><span>Durée d'essai : à indiquer par la boutique (exemple à remplacer : « XX nuits »).</span></li><li><b>Gardez-le, ou renvoyez-le</b><span>Conditions de reprise, frais éventuels et état attendu du matelas : à indiquer par la boutique.</span></li></ol></div>
  ${full ? `<div class="sd-wrap"><dl class="sd-dl"><div><dt>Durée de l'essai</dt><dd>À renseigner par la boutique</dd></div><div><dt>Frais de reprise</dt><dd>À renseigner par la boutique</dd></div><div><dt>État du matelas</dt><dd>À renseigner (housse protégée, absence de taches, etc.)</dd></div><div><dt>Remboursement</dt><dd>Délai et mode à renseigner par la boutique</dd></div></dl></div>` : `<div class="sd-wrap"><p><a class="sd-btn sd-btn--o" href="/essai">Lire les conditions de l'essai</a></p></div>`}</section>`);

const GAUGE = [["Souple", "souple", "Accueil enveloppant. Souvent apprécié des dormeurs sur le côté.", 1], ["Mi-ferme", "mi-ferme", "Le plus polyvalent. Soutien médian pour le dos ou une position changeante.", 2], ["Ferme", "ferme", "Surface plane et soutien franc. Souvent choisi pour le dos et le ventre.", 3]];
const fermete = () => sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap"><p class="sd-lab">La fermeté en un coup d'œil</p><h2 class="sd-h2">Souple, mi-ferme ou ferme</h2><div class="sd-gauges">${GAUGE.map(([l, tag, d, n]) => `<a class="sd-gauge" href="/boutique?categorie=${CAT}&etiquette=${tag}"><span class="sd-gdots" aria-hidden="true">${[1, 2, 3].map((k) => `<i${k <= n ? ' class="on"' : ""}></i>`).join("")}</span><b>${l}</b><span>${esc(d)}</span><u>Voir les matelas</u></a>`).join("")}</div></div></section>`);
const reassure = () => sec(`<section class="sd-rea pk-bleed"><div class="sd-wrap"><ul class="sd-rea-g"><li><b>Dimensions</b>Chaque fiche liste les tailles disponibles.</li><li><b>Livraison</b>Frais et délai calculés à la commande.</li><li><b>Essai</b><a href="/essai">Conditions sur la page Essai</a></li><li><b>Conseil</b><a href="/contact">Une question ? Écrivez-nous</a></li></ul></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="sd-hero sd-dusk pk-bleed"><div class="sd-wrap sd-hero-in"><div><p class="sd-lab sd-lab--l">Literie et matelas</p><div class="sd-h1 sd-h1--xl" role="heading" aria-level="1">Une bonne nuit<br>se choisit <em>doucement</em></div><p class="sd-lead">Des matelas, des oreillers et du linge expliqués simplement. Répondez à trois questions, on vous indique la fermeté qui vous convient.</p>
    <p><a class="sd-btn" href="/quiz">Trouver mon matelas</a> <a class="sd-link" href="/boutique?categorie=${CAT}">Voir tous les matelas</a></p></div><div class="sd-hero-art">${layers()}<p class="sd-hero-cap">Housse, mousse de confort, ressorts ensachés, base</p></div></div></section>`),
  reassure(), quizBloc(),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap"><p class="sd-lab">Les matelas</p><h2 class="sd-h2">Pour commencer</h2></div></section>`),
  wrap(shopgrid({ source: "category", category: CAT, count: 4, columns: "4", orderby: "featured", ratio: "4/3" })),
  fermete(), essaiBloc(),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap"><p class="sd-lab">Pour compléter</p><h2 class="sd-h2">Les oreillers qui vont avec</h2><p class="sd-small">Un oreiller adapté à votre position complète le matelas.</p></div></section>`),
  wrap(shopgrid({ source: "category", category: "oreillers", count: 4, columns: "4", orderby: "featured", ratio: "4/3" })),
  sec(footer(c))];

const quiz = (c) => [sec(header(c)), head("Quiz", "Trouver mon matelas", "Position, sensation, seul ou à deux."), quizBloc("Votre recommandation en trois questions"), sec(footer(c))];
const essai = (c) => [sec(header(c)), head("Essai à domicile", "Essai à domicile", "Les conditions, sans astérisque, une fois renseignées par la boutique."), essaiBloc(true),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap sd-prose"><h2 class="sd-h2">Avant de renvoyer un matelas</h2><p>Donnez-lui le temps de s'installer : le corps s'habitue souvent progressivement à une nouvelle surface. Si le doute persiste, écrivez-nous depuis la page <a href="/contact">contact</a> : un autre niveau de fermeté est parfois la bonne réponse.</p></div></section>`), sec(footer(c))];
const guide = (c) => [sec(header(c)), head("Guide", "Guide du sommeil", "Fermeté, tailles, oreiller : l'essentiel pour choisir."), fermete(),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap"><h2 class="sd-h2">Choisir la bonne taille</h2><div class="sd-tbl" role="table" aria-label="Tailles courantes"><div role="row" class="sd-tr sd-th"><span role="columnheader">Taille</span><span role="columnheader">Pour qui</span></div>
    ${[["90 x 190", "Une personne, chambre d'enfant ou d'appoint"], ["140 x 190", "Un grand dormeur seul, ou un couple à l'étroit"], ["160 x 200", "Un couple : le format courant"], ["180 x 200", "Un couple qui aime l'espace"]].map(([a, b]) => `<div role="row" class="sd-tr"><span role="cell">${a}</span><span role="cell">${b}</span></div>`).join("")}</div>
    <h2 class="sd-h2">Et l'oreiller ?</h2><p class="sd-prose">Sur le côté, l'oreiller comble l'espace entre l'épaule et la tête : plutôt haut. Sur le dos, un oreiller moyen. Sur le ventre, un oreiller bas pour éviter de tordre la nuque.</p><p><a class="sd-btn" href="/boutique?categorie=oreillers">Voir les oreillers</a></p></div></section>`), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap sd-prose"><h2 class="sd-h2">Livraison</h2><p>Les frais et délais dépendent de votre pays et de la méthode choisie à la commande. Un matelas volumineux peut demander une livraison spécifique : la boutique précise les conditions qui s'appliquent.</p><h2 class="sd-h2">Retours</h2><p>Les conditions de retour et d'essai sont définies par la boutique : voir la page <a href="/essai">Essai à domicile</a>. Pour toute question, écrivez-nous depuis la page <a href="/contact">contact</a>.</p><h2 class="sd-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens que la boutique a activés.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Fermeté, tailles, entretien."),
  sec(`<section class="sd-sec pk-bleed"><div class="sd-wrap"><details class="sd-q"><summary>Combien de temps pour s'habituer à un nouveau matelas ?</summary><p>Souvent quelques semaines : le corps s'adapte à un nouveau soutien. C'est une des raisons d'un essai à domicile.</p></details><details class="sd-q"><summary>Dormir à deux : quel matelas ?</summary><p>Les ressorts ensachés indépendants limitent la transmission des mouvements. Les modèles concernés portent l'étiquette « couple ».</p></details><details class="sd-q"><summary>Faut-il retourner le matelas ?</summary><p>Cela dépend du modèle : la fiche produit indique s'il se retourne ou s'il a une face unique. Dans tous les cas, aérez la chambre et le lit régulièrement.</p></details><details class="sd-q"><summary>Le quiz remplace-t-il un conseil médical ?</summary><p>Non. Il donne un repère de fermeté. En cas de douleurs de dos persistantes, parlez-en à un professionnel de santé.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur la fermeté, une taille, une commande."), { type: "form", heading: "Écrire à la boutique", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un produit", "Un matelas, un oreiller, une taille."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un produit…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="sd-ph pk-bleed"><div class="sd-wrap"><p class="sd-lab">Page introuvable</p><div class="sd-h1 sd-h1--xl" role="heading" aria-level="1">Cette page<br>s'est <em>endormie</em></div><p class="sd-lead">Elle n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "sommeil-doux", name: "Sommeil doux", version: "1.0.0", category: "ecommerce", tags: ["chaleureux", "moderne", "minimaliste"], siteType: "Literie et matelas en ligne", featured: true,
  concept: "Le crépuscule avant de dormir : brume lavande, bleu de nuit, lueur de lampe ambrée, formes de galets, coupe de matelas qui respire, et un quiz qui recommande une fermeté reliée aux vrais filtres.",
  description: "Literie et matelas en ligne : brume lavande et bleu de nuit, lueur de lampe, cartes en galets, coupe de matelas qui respire doucement, quiz de recommandation (position, sensation, seul ou à deux) relié aux étiquettes réelles du catalogue et bloc d'essai à domicile honnête.",
  brand: "Sommeil doux", modules: ["formulaires", "recherche", "commerce"],
  shop: { card: "galet-bombe-image-large-fermete-lisible", gallery: "image-large-puis-fiche-collante-et-bouton-d-achat-fixe-mobile", cart: "page-dediee-brume-coussin", catalog: "barre-de-filtres-haute-et-cartes-galets" },
  dna: {
    header: "logo-central-croissant-et-onglets-coussin", hero: "crepuscule-coupe-de-matelas-en-couches", grid: "quatre-colonnes-galets-bombes", typo: "young-serif-et-nunito-sans",
    shapes: "galets-et-coussins-tres-arrondis", motion: "respiration-lente-des-couches-et-etoiles", rhythm: "alternance-brume-et-crepuscule", signature: "quiz-matelas-position-sensation-couple-vers-etiquettes",
    palette: "lavande-bleu-de-nuit-lueur-ambree", image: "coupe-svg-de-matelas-et-croissant-sans-photo", list: "galets-avec-jauge-de-fermete-a-trois-points",
    article: "colonne-centree-etapes-en-galets", sidebar: "aucune-bandeau-d-informations-decisives", reading: "nunito-sans-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#46528f", secondary: "#1d2142", accent: "#f0b878", background: "#efebf4", surface: "#fbf9fd", text: "#232846", muted: "#5c6288", success: "#2f7a5a", warning: "#9a6a1f", error: "#b0423c" },
    fonts: { heading: "font.young-serif", body: "font.nunito-sans", button: "font.nunito-sans", link: "font.nunito-sans" },
    radius: { sm: 10, md: 18, lg: 30, button: 999, field: 16, card: 28 }, shadow: { card: "0 10px 26px rgba(29,33,66,.10)", button: "none" }, border: { width: 1, color: "#d9d3e6" },
    type: { h1: { size: 56, weight: 400, lineHeight: 1.08, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur des boutons et accents", type: "color", default: "#46528f" },
    { key: "lueur", label: "Couleur de la lueur de lampe", type: "color", default: "#f0b878" },
    { key: "mode", label: "Ambiance des pages", type: "choice", default: "brume", choices: [["brume", "Brume claire"], ["crepuscule", "Crépuscule sombre"]] },
    { key: "respiration", label: "Respiration du matelas", type: "choice", default: "on", choices: [["on", "Activée"], ["off", "Désactivée"]] },
    { key: "etoiles", label: "Étoiles scintillantes", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "cartes", label: "Forme des cartes", type: "choice", default: "galets", choices: [["galets", "Galets très arrondis"], ["droites", "Coins discrets"]] },
    { key: "bandeau", label: "Bandeau d'information en haut", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "quiz", label: "Disposition des réponses du quiz", type: "choice", default: "grille", choices: [["grille", "En grille"], ["liste", "En liste"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Mon matelas", "/quiz"], ["Essai", "/essai"], ["Guide", "/guide"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "quiz", name: "Quiz du matelas", render: quiz }, { key: "essai", name: "Essai à domicile", render: essai }, { key: "guide", name: "Guide du sommeil", render: guide },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
