// Cercle Privé — club de ventes privées. Direction artistique : la discrétion d'un salon réservé. Nuit d'aubergine, filet de champagne, cartons d'invitation à encoches semi-circulaires,
// sceau rond, grande porte entrebâillée en ouverture. Composant signature : le PASSE MEMBRE (trois étapes : invitation, compte, accès) et la VENTE À FENÊTRE RÉELLE — un bloc éditable du
// Page Builder qui n'affiche une date que si le vendeur l'a posée dans les attributs du bloc (data-debut / data-fin, heure UTC). Aucun délai n'est inventé, réinitialisé ni bouclé : sur les
// fiches et les grilles du moteur, les dates viennent de la base (brique « accès membre et ventes privées »). Le thème consomme les briques (invitation, cadenas, comparateur, rendez-vous,
// listes de cadeaux, souhaits, créneaux de livraison) ; il ne les réimplémente jamais. Le vendeur les règle dans l'admin : voir la page « Configurer ».
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  key: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="15" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M23 24h20M36 24v7M41 24v5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  seal: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" stroke-width="1"/><path d="M17 27c3 5 11 5 14 0M17 21c3-5 11-5 14 0" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  door: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 42V8h20v34M12 42h28M32 8l8 4v30" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="27" cy="26" r="1.5" fill="currentColor"/></svg>`,
};
const mono = `<span class="cp-mono" aria-hidden="true"><i>C</i><i>P</i></span>`;

const header = (c) => `<header class="cp-head pk-bleed"><div class="cp-bar">
  <a class="cp-logo" href="/" aria-label="Cercle Privé, accueil">${mono}<span><b>Cercle Privé</b><i>club de ventes privées</i></span></a>
  <div class="cp-member" role="navigation" aria-label="Espace membre"><a class="cp-pass" href="/boutique/invitation">${ICON.lock}<span>Espace membre</span></a><a class="cp-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="cp-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div>
  <div class="cp-menu" role="navigation" aria-label="Navigation principale"><div class="cp-wrap">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></div></header>`;
const footer = (c) => `<footer class="cp-foot pk-bleed"><div class="cp-wrap cp-foot-g">
  <div><p class="cp-lab">Cercle Privé</p><p class="cp-small">Un club de ventes privées. L'accès se fait sur invitation ou après validation de votre compte par la maison.</p></div>
  <div><p class="cp-lab">Membres</p><p class="cp-fl"><a href="/boutique/invitation">Espace membre</a><a href="/boutique/compte">Mon compte</a><a href="/boutique/souhaits">Mes souhaits</a><a href="/boutique/panier">Panier</a></p></div>
  <div><p class="cp-lab">La maison</p><p class="cp-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="cp-lab">Discrétion</p><p class="cp-small">Colis sans logo sur demande, facture séparée du colis. Vos données ne servent qu'à traiter vos commandes.</p></div></div>
  <p class="cp-copy">© Cercle Privé — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="cp-ph pk-bleed"><div class="cp-wrap cp-narrow"><p class="cp-lab">${esc(kicker)}</p><div class="cp-h1" role="heading" aria-level="1">${esc(title)}</div><p class="cp-lead">${esc(lead)}</p></div></section>`);

// ----- Signature 1 : le passe membre. Trois étapes réelles de la brique accès membre.
const passe = (title = "Entrer au Cercle") => sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap"><p class="cp-lab">Le passe membre</p><h2 class="cp-h2">${esc(title)}</h2>
  <p class="cp-lead">Trois façons d'être reconnu, toutes vérifiées par la boutique elle-même. Rien ici n'est un décor : chaque étape est une page réelle.</p>
  <ol class="cp-passes">
    <li class="cp-card"><span class="cp-num" aria-hidden="true">I</span>${ICON.key}<h3 class="cp-h3">Un code d'invitation</h3><p>Vous avez reçu un code de la maison : saisissez-le sur la page d'accès. Son nombre d'usages et sa date d'expiration sont contrôlés à chaque utilisation.</p><a class="cp-link" href="/boutique/invitation">Saisir mon code</a></li>
    <li class="cp-card"><span class="cp-num" aria-hidden="true">II</span>${ICON.seal}<h3 class="cp-h3">Un compte approuvé</h3><p>Pas de code ? Créez votre compte client puis demandez l'accès : le vendeur valide chaque demande lui-même, ce n'est pas automatique.</p><a class="cp-link" href="/boutique/compte">Créer ou ouvrir mon compte</a></li>
    <li class="cp-card"><span class="cp-num" aria-hidden="true">III</span>${ICON.door}<h3 class="cp-h3">Les portes s'ouvrent</h3><p>Une fois membre, les pièces réservées passent du cadenas à l'achat. Le serveur refuse tout achat sans accès, même en forçant l'adresse.</p><a class="cp-link" href="/boutique">Voir la boutique</a></li>
  </ol></div></section>`);

// ----- Signature 2 : vente à fenêtre réelle. Les dates ne s'affichent QUE si le vendeur les pose dans data-debut / data-fin (ISO 8601 en UTC, ex. 2026-12-01T18:00:00Z). Aucun défaut, aucune boucle.
const vente = (nom, texte, debut = "", fin = "") => `<article class="cp-vente cp-card" data-cp-vente${debut ? ` data-debut="${esc(debut)}"` : ""}${fin ? ` data-fin="${esc(fin)}"` : ""}><p class="cp-lab">Vente privée</p><h3 class="cp-h3">${esc(nom)}</h3><p>${esc(texte)}</p>
  <p class="cp-etat" data-cp-etat role="status">Les dates de cette vente sont lues dans la base de la boutique. Elles s'affichent sur la fiche de chaque produit concerné, avec l'heure de fin, en heure UTC.</p>
  <p><a class="cp-btn" href="/boutique">Voir les pièces</a></p></article>`;
const ventes = (titre = "Des fenêtres qui ouvrent et ferment vraiment") => sec(`<section class="cp-sec cp-night pk-bleed"><div class="cp-wrap"><p class="cp-lab">Ventes à durée limitée</p><h2 class="cp-h2">${esc(titre)}</h2>
  <p class="cp-lead">Une vente privée a un début et une fin enregistrés par le vendeur. Avant l'ouverture comme après la clôture, la boutique refuse l'ajout au panier et la commande. Nous n'affichons aucun décompte : seulement la date de fin réelle.</p>
  <div class="cp-ventes">${vente("Exemple de vente en cours", "Bloc modifiable : le vendeur y pose le nom de la vente et, s'il le souhaite, ses dates de début et de fin en heure UTC.")}${vente("Exemple de prochaine vente", "Sans dates renseignées, le bloc n'affiche aucune échéance. Il ne devine rien.")}</div></div></section>`);

const cadenas = () => sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-split"><div><p class="cp-lab">Cadenas et pièces masquées</p><h2 class="cp-h2">Deux façons de rester discret</h2><p class="cp-small">Le vendeur choisit, pièce par pièce ou catégorie par catégorie, ce que voit un visiteur non membre.</p></div>
  <div class="cp-duo"><div class="cp-card cp-lock"><span class="cp-padlock">${ICON.lock}</span><h3 class="cp-h3">Visible avec cadenas</h3><p>La pièce apparaît, mention « Réservé aux membres », et l'achat est bloqué jusqu'à l'accès. Utile pour donner envie.</p></div>
  <div class="cp-card"><span class="cp-padlock cp-padlock--off">${ICON.lock}</span><h3 class="cp-h3">Masquée du catalogue</h3><p>La pièce n'existe pas pour un non-membre : ni dans la liste, ni dans la recherche de la boutique. Utile pour une vraie confidentialité.</p></div></div></div></section>`);

const services = () => sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap"><p class="cp-lab">Services de la maison</p><h2 class="cp-h2">Un conseil à la mesure du club</h2>
  <ul class="cp-svc"><li class="cp-card"><h3 class="cp-h3">Rendez-vous privé</h3><p>Réservez un créneau avec la maison, sur place ou en visio selon ses réglages. Seuls les créneaux réellement libres sont proposés.</p><a class="cp-link" href="/boutique/rendez-vous">Prendre rendez-vous</a></li>
  <li class="cp-card"><h3 class="cp-h3">Comparer des pièces</h3><p>Jusqu'à quatre pièces côte à côte, caractéristiques en regard, différences signalées.</p><a class="cp-link" href="/boutique/comparer">Ouvrir le comparateur</a></li>
  <li class="cp-card"><h3 class="cp-h3">Listes de cadeaux</h3><p>Une liste à lien secret pour un événement : chacun offre ce qui reste à offrir.</p><a class="cp-link" href="/boutique/listes">Voir les listes</a></li>
  <li class="cp-card"><h3 class="cp-h3">Mes souhaits</h3><p>Gardez de côté les pièces qui vous plaisent, rattachées à votre compte.</p><a class="cp-link" href="/boutique/souhaits">Ouvrir mes souhaits</a></li></ul></div></section>`);

const engagements = () => sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap"><ul class="cp-vals"><li><b>Sans fausse urgence</b>Pas de compte à rebours, pas de stock inventé : seule la date de fin enregistrée par le vendeur est affichée.</li><li><b>Sans intrusion</b>Votre accès sert à ouvrir des portes, pas à vous suivre. Données limitées à la commande.</li><li><b>Sans surprise</b>Le prix affiché est le prix payé. Les conditions de retour sont écrites avant l'achat.</li></ul></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="cp-hero cp-night pk-bleed"><div class="cp-door cp-door--l" aria-hidden="true"></div><div class="cp-door cp-door--r" aria-hidden="true"></div>
    <div class="cp-wrap cp-hero-in"><div class="cp-invite cp-card"><span class="cp-sealbig" aria-hidden="true">${mono}</span><p class="cp-lab">Sur invitation</p><div class="cp-h1 cp-h1--xl" role="heading" aria-level="1">Le club<br>des <em>ventes privées</em></div>
    <p class="cp-lead">Des pièces choisies, proposées à des membres pendant une fenêtre de vente réelle. L'entrée se fait par un code ou par la validation de votre compte.</p>
    <p><a class="cp-btn" href="/boutique/invitation">Entrer avec mon code</a> <a class="cp-link" href="/espace-membre">Comment devenir membre</a></p></div></div></section>`),
  passe(), ventes(), cadenas(),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap"><p class="cp-lab">Accessibles à tous</p><h2 class="cp-h2">Les pièces en promotion</h2></div></section>`),
  wrap(shopgrid({ source: "sale", count: 3, columns: "3", orderby: "newest", ratio: "4/5" })),
  services(), engagements(), sec(footer(c))];

const espace = (c) => [sec(header(c)), head("Espace membre", "Votre espace au Cercle", "Code, compte, accès : tout se passe sur les pages réelles de la boutique."), passe("Les trois entrées"),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-narrow cp-prose"><h2 class="cp-h2">Ce que vous voyez, ce que vous ne voyez pas</h2>
  <details class="cp-q" open><summary>Je suis visiteur</summary><p>Vous voyez le catalogue public. Les pièces réservées apparaissent avec un cadenas ou restent absentes, selon le choix du vendeur.</p></details>
  <details class="cp-q"><summary>Je suis membre</summary><p>Les pièces réservées sont accessibles à l'achat. Les ventes privées restent soumises à leur fenêtre : hors fenêtre, la boutique refuse l'achat.</p></details>
  <details class="cp-q"><summary>Ma demande est en attente</summary><p>Le vendeur valide chaque demande à la main. La page d'accès indique si votre demande est en attente.</p></details>
  <details class="cp-q"><summary>Mon accès a été retiré</summary><p>Le vendeur peut retirer un accès. Écrivez-lui depuis la page <a href="/contact">contact</a> si vous pensez à une erreur.</p></details>
  <p><a class="cp-btn" href="/boutique/invitation">Aller à la page d'accès</a></p></div></section>`), sec(footer(c))];

const ventesPage = (c) => [sec(header(c)), head("Ventes privées", "Ventes à durée limitée", "Une fenêtre réelle, enregistrée par la maison. Rien n'est compté à rebours."), ventes("Comment lire une vente"), cadenas(),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap"><p class="cp-lab">En promotion</p><h2 class="cp-h2">Les prix barrés du moment</h2></div></section>`), wrap(shopgrid({ source: "sale", count: 6, columns: "3", orderby: "newest", ratio: "4/5" })), sec(footer(c))];

const discretion = (c) => [sec(header(c)), head("Discrétion", "Livraison, retours, confidentialité", "Des commandes qui ne disent pas qui vous êtes."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-narrow cp-prose"><h2 class="cp-h2">Livraison</h2><p>Frais et délais sont calculés à la commande selon votre pays. Si la maison a activé les créneaux de livraison, vous ne voyez que les créneaux réellement libres, et un créneau complet est refusé au moment de commander.</p><h2 class="cp-h2">Colis discret</h2><p>Emballage sans logo, sur demande écrite à la maison avant l'expédition. Facture séparée du colis. Ces options dépendent de ce que le vendeur a prévu : demandez-les via la page <a href="/contact">contact</a>.</p><h2 class="cp-h2">Retours</h2><p>Les conditions de retour sont précisées par la maison pour chaque vente. Une vente privée n'est pas moins protégée qu'un achat ordinaire.</p><h2 class="cp-h2">Vos données</h2><p>Nous ne conservons que ce qui sert à traiter votre commande et à reconnaître votre accès membre.</p></div></section>`), sec(footer(c))];

const conseil = (c) => [sec(header(c)), head("Conseil privé", "Services de la maison", "Rendez-vous, comparateur, cadeaux, souhaits."), services(), sec(footer(c))];

const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Configurer le Cercle", "Le thème met en forme ; l'administration décide. Voici où régler chaque brique."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-narrow cp-prose"><p class="cp-small">Cette page peut être supprimée avant la mise en ligne. Elle explique comment faire vivre le thème avec votre boutique.</p>
  <ol class="cp-steps"><li><div><b>Réserver des pièces aux membres</b><span>Admin, onglet « Accès membre », section « Produits et catégories réservés » : choisissez « Visible avec cadenas » ou « Masqué du catalogue ».</span></div></li>
  <li><div><b>Créer des codes d'invitation</b><span>Même onglet : un code, un nombre d'usages maximum et une expiration facultative. Le thème renvoie vers <a href="/boutique/invitation">la page d'accès</a>.</span></div></li>
  <li><div><b>Approuver des membres</b><span>Les demandes arrivent dans la liste des membres : vous approuvez ou retirez l'accès.</span></div></li>
  <li><div><b>Programmer une vente privée</b><span>Section « Ventes privées à durée limitée » : nom, début et fin en heure UTC, produits ou catégories. Hors fenêtre, le serveur refuse panier et commande. Les dates s'affichent d'elles-mêmes sur fiches et grilles.</span></div></li>
  <li><div><b>Afficher une vente sur une page du thème</b><span>Dans le Page Builder, ouvrez un bloc « Vente privée » et saisissez ses attributs data-debut et data-fin au format 2026-12-01T18:00:00Z (UTC). Laissés vides, aucune date n'apparaît. Le bloc ne remplace pas la règle du moteur : il l'illustre.</span></div></li>
  <li><div><b>Autres briques</b><span>Rendez-vous (types et disponibilités), comparateur (caractéristiques du produit), listes de cadeaux, avis vérifiés, créneaux de livraison : chacune se règle dans son onglet. Pour un produit soumis à un âge minimum, réglez-le sur le produit ou la catégorie.</span></div></li></ol>
  <p><strong>Limites à connaître.</strong> Les dates sont en UTC. Les grilles du Page Builder traitent tout visiteur comme non-membre : les pièces masquées y sont absentes, les verrouillées y sont visibles. Une commande déjà créée peut encore être payée après la fin d'une vente.</p></div></section>`), sec(footer(c))];

const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Accès, ventes, discrétion."),
  sec(`<section class="cp-sec pk-bleed"><div class="cp-wrap cp-narrow"><details class="cp-q"><summary>Comment obtenir un code ?</summary><p>La maison les remet elle-même. Sans code, créez un compte et demandez l'accès depuis la page <a href="/boutique/invitation">Espace membre</a>.</p></details><details class="cp-q"><summary>Pourquoi je ne peux pas acheter une pièce visible ?</summary><p>Elle est réservée aux membres, ou sa vente n'est pas ouverte. La fiche l'explique avec la date réelle quand il y en a une.</p></details><details class="cp-q"><summary>Les prix changent-ils pendant la vente ?</summary><p>Le prix affiché est celui de la boutique à cet instant. Le thème n'ajoute aucune remise de son chef.</p></details><details class="cp-q"><summary>Mon colis peut-il être discret ?</summary><p>Oui si la maison le propose : écrivez-lui avant l'expédition.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conciergerie", "Nous écrire", "Une demande d'accès, une pièce, une commande."), { type: "form", heading: "Écrire à la conciergerie", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une pièce", "Un nom, une matière, une maison."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cp-ph pk-bleed"><div class="cp-wrap cp-narrow"><p class="cp-lab">Page introuvable</p><div class="cp-h1 cp-h1--xl" role="heading" aria-level="1">Porte <em>close</em></div><p class="cp-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a> ou <a href="/boutique/invitation">entrer avec un code</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "cercle-prive", name: "Cercle Privé", version: "1.0.0", category: "luxe", tags: ["luxe", "sombre", "classique"], siteType: "Club de ventes privées", featured: true,
  concept: "Un salon réservé : nuit d'aubergine, filet de champagne, cartons d'invitation à encoches, porte entrebâillée, passe membre et ventes à fenêtre réelle sans aucun décompte.",
  description: "Club de ventes privées : nuit d'aubergine, champagne, cartons à encoches et porte entrebâillée. Passe membre en trois étapes, cadenas, ventes à dates réelles lues dans la base, sans faux décompte. Branché sur l'accès membre du moteur.",
  brand: "Cercle Privé", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carton-a-encoches-semi-circulaires-mention-d-acces", gallery: "grande-image-puis-bandeau-d-acces-membre", cart: "page-dediee-nuit-aubergine-filet-champagne", catalog: "barre-de-filtres-cadenas-visible-et-fenetre-de-vente" },
  dna: {
    header: "barre-fine-monogramme-gauche-passe-membre-droite-menu-sous-filet", hero: "porte-entrebaillee-deux-battants-et-carton-d-invitation", grid: "trois-colonnes-cartons-a-encoches-decalees", typo: "libre-caslon-display-et-red-hat-text",
    shapes: "encoches-semi-circulaires-et-sceau-rond", motion: "battants-qui-s-ecartent-a-l-ouverture", rhythm: "nuit-aubergine-puis-carton-isole-puis-nuit", signature: "passe-membre-et-vente-a-fenetre-reelle",
    palette: "aubergine-nuit-champagne-prune", image: "cartouches-svg-cle-sceau-cadenas-sans-photo", list: "cartons-prix-sous-filet-et-mention-d-acces",
    article: "colonne-etroite-etapes-en-chiffres-romains", sidebar: "aucune-bande-reservee-aux-membres", reading: "red-hat-text-17-px-mesure-58-caracteres",
  },
  tokens: {
    colors: { primary: "#9a3a6a", secondary: "#1a111d", accent: "#e3d3b0", background: "#1a111d", surface: "#251a29", text: "#f1e9ef", muted: "#b9a9b8", success: "#6fb28a", warning: "#d1a85a", error: "#e0827f" },
    fonts: { heading: "font.libre-caslon-display", body: "font.red-hat-text", button: "font.red-hat-text", link: "font.red-hat-text" },
    radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#4a3650" },
    type: { h1: { size: 58, weight: 400, lineHeight: 1.08, transform: "none" }, h2: { size: 36, weight: 400, lineHeight: 1.14, transform: "none" } },
  },
  options: [
    { key: "champagne", label: "Couleur des filets (champagne)", type: "color", default: "#e3d3b0" },
    { key: "fond", label: "Ambiance des pages", type: "choice", default: "nuit", choices: [["nuit", "Nuit d'aubergine"], ["ivoire", "Ivoire clair"]] },
    { key: "encoches", label: "Encoches des cartons", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Cartons droits"]] },
    { key: "porte", label: "Porte entrebâillée du héros", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "filets", label: "Filets décoratifs", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "sceau", label: "Sceau du monogramme", type: "choice", default: "rond", choices: [["rond", "Rond"], ["carre", "Carré"]] },
    { key: "mention", label: "Mention d'accès sur les cartes", type: "choice", default: "on", choices: [["on", "Mise en valeur"], ["off", "Discrète"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Espace membre", "/espace-membre"], ["Ventes privées", "/ventes-privees"], ["Discrétion", "/discretion"], ["Conseil", "/conseil"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "espace-membre", name: "Espace membre", render: espace }, { key: "ventes-privees", name: "Ventes privées", render: ventesPage },
    { key: "discretion", name: "Discrétion et livraison", render: discretion }, { key: "conseil", name: "Conseil privé", render: conseil }, { key: "configurer", name: "Configurer (vendeur)", render: configurer },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
