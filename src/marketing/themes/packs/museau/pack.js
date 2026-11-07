// Museau — animalerie en ligne. Direction artistique : la boutique joyeuse et chaleureuse, bleu électrique, mandarine et jaune soleil sur une crème d'abricot, mascottes dessinées
// en SVG (chien, chat, lapin — aucune photo), cartes « autocollants » légèrement penchées, vagues de couleur entre les sections.
// Composant signature : le PROFIL D'ANIMAL — chien, chat ou petit animal, âge, gabarit. C'est un bloc éditable du Page Builder : la liste de liens (étiquettes et catégories réelles du moteur)
// est écrite en clair dans le bloc et fonctionne SANS script (menus « details ») ; motion.js la transforme en sélecteur interactif avec mascotte, et peut mémoriser le choix dans ce navigateur.
// Rien n'est simulé : chaque lien ouvre le vrai catalogue filtré (/boutique/etiquette/<étiquette> ou /boutique/categorie/<catégorie>?etiquette=<étiquette>).
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

/* Mascottes (SVG sans texte). Les couleurs viennent de classes CSS du thème ; la queue et les oreilles portent des classes animées. */
const dog = (cls = "") => `<svg class="mu-fig mu-fig--chien ${cls}" viewBox="0 0 240 240" role="img" aria-label="Illustration d'un chien assis"><path class="mu-tail mu-dark" d="M176 196c26-4 42-30 30-52-4 12-14 22-30 26z"/><ellipse class="mu-fur" cx="120" cy="196" rx="64" ry="42"/><ellipse class="mu-light" cx="120" cy="204" rx="30" ry="30"/><path class="mu-dark mu-ear mu-ear--l" d="M70 70c-26 6-34 40-24 68 22 0 36-22 34-48z"/><path class="mu-dark mu-ear mu-ear--r" d="M170 70c26 6 34 40 24 68-22 0-36-22-34-48z"/><circle class="mu-fur" cx="120" cy="112" r="56"/><ellipse class="mu-light" cx="120" cy="134" rx="32" ry="26"/><ellipse class="mu-grey" cx="120" cy="136" rx="34" ry="28"/><circle class="mu-eye" cx="98" cy="104" r="7"/><circle class="mu-eye" cx="142" cy="104" r="7"/><circle class="mu-glint" cx="100" cy="101" r="2.4"/><circle class="mu-glint" cx="144" cy="101" r="2.4"/><ellipse class="mu-nose" cx="120" cy="124" rx="11" ry="8"/><path class="mu-line" d="M120 132v6m0 0c-6 8-16 6-18 0m18 0c6 8 16 6 18 0"/><path class="mu-tongue" d="M112 146c0 14 16 14 16 0z"/><path class="mu-collar" d="M80 160c26 14 54 14 80 0l4 12c-30 16-58 16-88 0z"/><circle class="mu-tag" cx="120" cy="180" r="8"/></svg>`;
const cat = (cls = "") => `<svg class="mu-fig mu-fig--chat ${cls}" viewBox="0 0 240 240" role="img" aria-label="Illustration d'un chat assis"><path class="mu-tail mu-fur" d="M176 214c40 6 54-36 28-60-6 10-2 24 6 32-6 12-18 14-34 12z"/><ellipse class="mu-fur" cx="120" cy="196" rx="58" ry="44"/><ellipse class="mu-light" cx="120" cy="206" rx="26" ry="30"/><path class="mu-fur mu-ear mu-ear--l" d="M62 98 54 36l46 28z"/><path class="mu-fur mu-ear mu-ear--r" d="M178 98l8-62-46 28z"/><path class="mu-pink" d="M68 80 64 52l22 14zM172 80l4-28-22 14z"/><ellipse class="mu-fur" cx="120" cy="116" rx="62" ry="54"/><path class="mu-stripe" d="M108 66v14M120 64v16M132 66v14"/><ellipse class="mu-light" cx="120" cy="134" rx="26" ry="20"/><ellipse class="mu-grey" cx="120" cy="136" rx="28" ry="22"/><ellipse class="mu-eye" cx="96" cy="108" rx="7" ry="9"/><ellipse class="mu-eye" cx="144" cy="108" rx="7" ry="9"/><circle class="mu-glint" cx="98" cy="104" r="2.4"/><circle class="mu-glint" cx="146" cy="104" r="2.4"/><path class="mu-pink" d="M114 124h12l-6 8z"/><path class="mu-line" d="M120 132c-4 8-14 8-18 2m18-2c4 8 14 8 18 2M52 120l28 6M52 134l28-2M188 120l-28 6M188 134l-28-2"/><path class="mu-collar" d="M84 164c24 12 48 12 72 0l4 10c-28 14-52 14-80 0z"/><circle class="mu-tag" cx="120" cy="182" r="7"/></svg>`;
const bunny = (cls = "") => `<svg class="mu-fig mu-fig--petit ${cls}" viewBox="0 0 240 240" role="img" aria-label="Illustration d'un lapin assis"><circle class="mu-light" cx="186" cy="204" r="14"/><ellipse class="mu-fur" cx="120" cy="198" rx="56" ry="42"/><ellipse class="mu-light" cx="120" cy="208" rx="26" ry="28"/><g class="mu-ear mu-ear--l"><ellipse class="mu-fur" cx="92" cy="50" rx="18" ry="48"/><ellipse class="mu-pink" cx="92" cy="54" rx="8" ry="34"/></g><g class="mu-ear mu-ear--r"><ellipse class="mu-fur" cx="148" cy="50" rx="18" ry="48"/><ellipse class="mu-pink" cx="148" cy="54" rx="8" ry="34"/></g><ellipse class="mu-fur" cx="120" cy="124" rx="56" ry="50"/><ellipse class="mu-light" cx="120" cy="140" rx="28" ry="20"/><ellipse class="mu-grey" cx="120" cy="142" rx="30" ry="22"/><circle class="mu-eye" cx="98" cy="114" r="7"/><circle class="mu-eye" cx="142" cy="114" r="7"/><circle class="mu-glint" cx="100" cy="111" r="2.4"/><circle class="mu-glint" cx="144" cy="111" r="2.4"/><circle class="mu-blush" cx="82" cy="134" r="9"/><circle class="mu-blush" cx="158" cy="134" r="9"/><path class="mu-pink" d="M114 130h12l-6 7z"/><path class="mu-line" d="M120 137c-4 8-12 8-16 3m16-3c4 8 12 8 16 3"/><rect class="mu-teeth" x="114" y="146" width="12" height="12" rx="3"/></svg>`;
const paw = (cls = "mu-paw") => `<svg class="${cls}" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="27" rx="10" ry="8" fill="currentColor"/><ellipse cx="8" cy="16" rx="4" ry="5.5" fill="currentColor"/><ellipse cx="16" cy="9" rx="4" ry="5.5" fill="currentColor"/><ellipse cx="25" cy="9" rx="4" ry="5.5" fill="currentColor"/><ellipse cx="33" cy="16" rx="4" ry="5.5" fill="currentColor"/></svg>`;
const wave = (cls = "") => `<svg class="mu-wave ${cls}" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 28C180 64 360 -6 540 26S900 62 1080 28 1300 4 1440 30V60H0z" fill="currentColor"/></svg>`;

const ICON = {
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
};

const header = (c) => `<header class="mu-head pk-bleed"><div class="mu-bar"><a class="mu-logo" href="/" aria-label="Museau, accueil">${paw("mu-paw mu-paw--logo")}<span>Museau</span></a>
  <div class="mu-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="mu-act"><a class="mu-chip" data-museau-mon href="/profil">Mon animal</a><a class="mu-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="mu-ic mu-ic--cart" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div></header>`;
const footer = (c) => `<footer class="mu-foot pk-bleed">${wave("mu-wave--top")}<div class="mu-wrap mu-foot-g">
  <div>${paw("mu-paw mu-paw--foot")}<p class="mu-big">Museau</p><p class="mu-small">Animalerie en ligne : alimentation, jouets, confort et soins pour chiens, chats et petits animaux.</p></div>
  <div><p class="mu-lab">Boutique</p><p class="mu-fl"><a href="/boutique">Tous les produits</a><a href="/boutique/etiquette/chien">Chiens</a><a href="/boutique/etiquette/chat">Chats</a><a href="/boutique/etiquette/petit-animal">Petits animaux</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="mu-lab">Aide</p><p class="mu-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div>
  <p class="mu-copy">© Museau — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="mu-ph pk-bleed"><div class="mu-wrap"><p class="mu-lab">${esc(kicker)}</p><div class="mu-h1" role="heading" aria-level="1">${esc(title)}</div><p class="mu-lead">${esc(lead)}</p></div>${wave("mu-wave--ph")}</section>`);

/* Données du profil : [animal, étiquette, libellé, [âges: étiquette, libellé], [gabarits], [rubriques: catégorie, libellé]] — toutes les étiquettes existent dans demo.js */
const ANIMAUX = [
  { v: "chien", nom: "Chien", ages: [["junior", "Chiot"], ["adulte", "Adulte"], ["senior", "Senior"]], tailles: [["petit", "Petit gabarit"], ["grand", "Grand gabarit"]], rub: [["alimentation", "Croquettes et pâtées"], ["jouets", "Jouets"], ["promenade-et-confort", "Promenade et paniers"], ["hygiene-et-soin", "Hygiène et soin"]] },
  { v: "chat", nom: "Chat", ages: [["junior", "Chaton"], ["adulte", "Adulte"], ["senior", "Senior"]], tailles: [], rub: [["alimentation", "Croquettes et pâtées"], ["jouets", "Jouets"], ["promenade-et-confort", "Paniers et arbres"], ["hygiene-et-soin", "Hygiène et soin"], ["habitat-et-litiere", "Litières et eau"]] },
  { v: "petit-animal", nom: "Petit animal", ages: [["junior", "Jeune"], ["adulte", "Adulte"], ["senior", "Senior"]], tailles: [], rub: [["alimentation", "Foin et granulés"], ["jouets", "Jouets"], ["habitat-et-litiere", "Cages et accessoires"]] },
];
const lien = (href, label, kind, v) => `<a${kind ? ` data-kind="${kind}" data-v="${v}"` : ""} href="${esc(href)}">${esc(label)}</a>`;
const animalBloc = (a, i) => `<details class="mu-an" data-animal="${a.v}" data-nom="${esc(a.nom)}"${i === 0 ? " open" : ""}><summary>${esc(a.nom)}</summary>
  <p class="mu-fine">Son âge</p><p class="mu-lk">${a.ages.map(([v, l]) => lien(`/boutique/etiquette/${a.v}-${v}`, l, "age", v)).join("")}</p>
  ${a.tailles.length ? `<p class="mu-fine">Son gabarit</p><p class="mu-lk">${a.tailles.map(([v, l]) => lien(`/boutique/etiquette/${a.v}-${v}`, l, "taille", v)).join("")}</p>` : ""}
  <p class="mu-fine">Les rayons</p><p class="mu-lk">${a.rub.map(([s, l]) => lien(`/boutique/categorie/${s}?etiquette=${a.v}`, l, "rubrique", s)).join("")}</p>
  <p class="mu-lk">${lien(`/boutique/etiquette/${a.v}`, `Tout pour mon ${a.nom.toLowerCase()}`, "tout", a.v).replace("<a ", '<a class="mu-all" ')}</p></details>`;
const profil = (title = "Pour qui faites-vous les courses ?", lead = "Dites-nous qui vous accompagne : chien, chat ou petit animal, son âge, son gabarit. On vous mène droit aux produits qui lui conviennent.") => sec(`<section class="mu-profil pk-bleed" data-museau-profil><div class="mu-wrap"><p class="mu-lab">Profil d'animal</p><h2 class="mu-h2">${esc(title)}</h2><p class="mu-lead">${esc(lead)}</p>
  <div class="mu-pf"><div class="mu-pf-stage" data-museau-stage aria-hidden="true">${dog()}${cat()}${bunny()}</div>
  <div class="mu-pf-body"><div class="mu-pf-ui" data-museau-ui></div><div class="mu-pf-list" data-museau-liste>${ANIMAUX.map(animalBloc).join("")}</div>
  <p class="mu-small">Chaque lien ouvre le vrai catalogue filtré : les prix et les stocks affichés sont ceux de la boutique.</p></div></div></div></section>`);

const trois = () => sec(`<section class="mu-sec mu-sec--alt pk-bleed"><div class="mu-wrap"><p class="mu-lab">En trois étapes</p><h2 class="mu-h2">Du bon choix à la gamelle</h2>
  <ol class="mu-steps"><li><b>Choisissez votre animal</b>Chien, chat ou petit animal, puis son âge et son gabarit.</li><li><b>Parcourez la sélection</b>Prix, promotions et disponibilité sont ceux de la boutique, sans détour.</li><li><b>Commandez en quelques clics</b>Le bouton d'achat reste sous votre pouce sur mobile.</li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="mu-hero pk-bleed"><div class="mu-wrap mu-hero-in"><div><p class="mu-lab">Animalerie en ligne</p><div class="mu-h1 mu-h1--xl" role="heading" aria-level="1">Tout pour<br>les <span>museaux</span> que vous aimez</div><p class="mu-lead">Alimentation, jouets, paniers et soins pour chiens, chats et petits animaux. Choisissez par profil : âge et gabarit, sans chercher.</p><p><a class="mu-btn" href="/profil">Choisir pour mon animal</a> <a class="mu-btn mu-btn--o" href="/boutique">Voir la boutique</a></p></div>
  <div class="mu-bubble" aria-hidden="true"><div class="mu-blob"></div>${dog("mu-h-chien")}${cat("mu-h-chat")}${bunny("mu-h-petit")}${paw("mu-paw mu-paw--1")}${paw("mu-paw mu-paw--2")}${paw("mu-paw mu-paw--3")}</div></div>${wave("mu-wave--hero")}</section>`),
  profil(), trois(),
  sec(`<section class="mu-sec pk-bleed"><div class="mu-wrap"><p class="mu-lab">À la une</p><h2 class="mu-h2">Les chouchous du moment</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "1/1" })),
  sec(`<section class="mu-sec pk-bleed"><div class="mu-wrap"><p class="mu-lab">Petits prix</p><h2 class="mu-h2">Promotions en cours</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 3, columns: "3", orderby: "newest", ratio: "1/1" })),
  sec(`<section class="mu-sec pk-bleed"><div class="mu-wrap"><p class="mu-lab">Pour compléter</p><h2 class="mu-h2">Le coin repos et propreté</h2></div></section>`),
  wrap(shopgrid({ source: "category", category: "habitat-et-litiere", count: 3, columns: "3", orderby: "featured", ratio: "1/1" })),
  sec(footer(c))];

const monAnimal = (c) => [sec(header(c)), head("Mon animal", "Trouver les bons produits", "Chien, chat ou petit animal : âge et gabarit mènent aux vraies étiquettes de la boutique."), profil("Qui est votre compagnon ?", "Choisissez, puis ouvrez la sélection. Vous pouvez changer d'avis à tout moment."), trois(), sec(footer(c))];
const conseils = (c) => [sec(header(c)), head("Conseils", "Bien choisir pour son animal", "Alimentation, jouets, confort : les repères de base."),
  sec(`<section class="mu-sec pk-bleed"><div class="mu-wrap mu-prose"><h2 class="mu-h2">Alimentation</h2><p>Une ration adaptée à l'âge compte plus que la marque : un chiot ou un chaton ne mange pas comme un animal senior. Les croquettes sont classées par <a href="/boutique/etiquette/chien-junior">chiots</a>, <a href="/boutique/etiquette/chat-senior">chats seniors</a> ou <a href="/boutique/etiquette/petit-animal-adulte">petits animaux adultes</a>.</p>
  <h2 class="mu-h2">Jouer chaque jour</h2><p>Dix minutes de jeu valent mieux qu'un long moment de distraction. Voyez les <a href="/boutique/categorie/jouets">jouets</a> par animal.</p>
  <h2 class="mu-h2">Un coin à lui</h2><p>Panier, coussin, abri ou cage : un endroit calme, éloigné des courants d'air. Pour les cas particuliers, parlez-en à votre vétérinaire.</p></div></section>`),
  profil(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="mu-sec pk-bleed"><div class="mu-wrap mu-prose"><h2 class="mu-h2">Livraison</h2><p>Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande. Les sacs lourds sont emballés à part.</p><h2 class="mu-h2">Produit abîmé ou inadapté</h2><p>Écrivez-nous depuis la page <a href="/contact">contact</a> avec le numéro de commande : nous trouvons une solution.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Choisir, commander, recevoir."),
  sec(`<section class="mu-sec pk-bleed"><div class="mu-wrap mu-prose"><details class="mu-q"><summary>Comment choisir la bonne taille de croquettes ?</summary><p>La fiche indique le gabarit conseillé. Sans indication, choisissez selon l'âge de votre animal avec le profil d'animal.</p></details><details class="mu-q"><summary>Mon animal a un régime particulier</summary><p>Demandez l'avis de votre vétérinaire avant de changer d'alimentation, puis écrivez-nous pour savoir ce qui est disponible.</p></details><details class="mu-q"><summary>Que faire si un produit ne convient pas ?</summary><p>Contactez-nous depuis la page <a href="/contact">contact</a> : les conditions de retour sont précisées à la commande.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur un produit ? Dites-nous qui est votre animal."), { type: "form", heading: "Écrire à l'équipe", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un produit", "Un nom, un animal, une marque."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un produit…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="mu-ph pk-bleed"><div class="mu-wrap"><p class="mu-lab">Page introuvable</p><div class="mu-h1 mu-h1--xl" role="heading" aria-level="1">Oups, la balle<br>a roulé trop loin</div><p class="mu-lead"><a href="/boutique">Retourner à la boutique</a> ou <a href="/profil">choisir pour mon animal</a>.</p></div>${wave("mu-wave--ph")}</section>`), sec(footer(c))];

module.exports = {
  key: "museau", name: "Museau", version: "1.0.0", category: "ecommerce", tags: ["ludique", "chaleureux", "moderne"], siteType: "Animalerie en ligne", featured: false,
  concept: "Une animalerie joyeuse : bleu électrique, mandarine et jaune soleil, mascottes dessinées, cartes autocollants, et un profil d'animal (chien, chat, petit animal, âge, gabarit) qui mène aux vraies étiquettes de la boutique.",
  description: "Animalerie en ligne : mascottes en SVG, couleurs vives sur crème, cartes autocollants, vagues de couleur, profil d'animal éditable relié aux étiquettes et catégories réelles, bouton d'achat fixe sur mobile.",
  brand: "Museau", modules: ["formulaires", "recherche", "commerce"], shop: { card: "autocollant-penche-prix-en-pastille", gallery: "image-bulle-et-infos-decisives-collantes", cart: "page-dediee-bulles-et-total-en-evidence", catalog: "pastilles-d-animal-et-rayons-en-bulles" },
  dna: {
    header: "barre-flottante-en-pilule-avec-pastille-mon-animal", hero: "bulle-de-mascottes-et-empreintes-sur-vague", grid: "trois-colonnes-cartes-autocollants-penchees", typo: "paytone-one+lexend",
    shapes: "bulles-pilules-et-empreintes-de-pattes", motion: "queue-et-oreilles-qui-remuent-et-rebond", rhythm: "bandes-de-couleur-separees-par-des-vagues", signature: "profil-d-animal-chien-chat-petit-animal-age-gabarit",
    palette: "bleu-electrique-mandarine-jaune-soleil-sur-creme-d-abricot", image: "mascottes-svg-chien-chat-lapin-sans-photo", list: "cartes-autocollants-prix-en-pastille",
    article: "etapes-en-bulles-numerotees", sidebar: "aucune-pastille-conseil-en-bandeau", reading: "lexend-17-px-mesure-58-caracteres",
  },
  tokens: {
    colors: { primary: "#1565ff", secondary: "#14213d", accent: "#ff7a1a", background: "#fff6e2", surface: "#ffffff", text: "#14213d", muted: "#4d5b78", success: "#12805c", warning: "#9a5a00", error: "#c0322b" },
    fonts: { heading: "font.paytone-one", body: "font.lexend", button: "font.lexend", link: "font.lexend" },
    radius: { sm: 10, md: 18, lg: 28, button: 999, field: 14, card: 26 }, shadow: { card: "0 5px 0 rgba(20,33,61,.12)", button: "0 4px 0 rgba(20,33,61,.25)" }, border: { width: 2, color: "#14213d" },
    type: { h1: { size: 58, weight: 400, lineHeight: 1.04, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur principale", type: "color", default: "#1565ff" },
    { key: "achat", label: "Couleur du bouton d'achat", type: "color", default: "#ff7a1a" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "creme", choices: [["creme", "Crème d'abricot"], ["ciel", "Bleu ciel"], ["menthe", "Menthe"]] },
    { key: "mascotte", label: "Mascotte de l'accueil", type: "choice", default: "chien", choices: [["chien", "Le chien"], ["chat", "Le chat"], ["petit", "Le lapin"]] },
    { key: "remue", label: "Queue et oreilles qui remuent", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
    { key: "stickers", label: "Cartes penchées (autocollants)", type: "choice", default: "on", choices: [["on", "Penchées"], ["off", "Bien droites"]] },
    { key: "vagues", label: "Vagues entre les sections", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "memoire", label: "Retenir l'animal choisi sur cet appareil", type: "choice", default: "on", choices: [["on", "Oui, dans le navigateur"], ["off", "Non"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Mon animal", "/profil"], ["Conseils", "/conseils"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "profil", name: "Profil d'animal", render: monAnimal }, { key: "conseils", name: "Conseils", render: conseils }, { key: "livraison", name: "Livraison et retours", render: livraison },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
