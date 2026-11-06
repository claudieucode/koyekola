// Verdure — boutique de plantes d'intérieur. Direction artistique : l'atelier de serre, clair et pédagogique. Fond lin vert très pâle, feuilles dessinées en SVG, grosses pastilles de
// cartes, barre de recherche centrale dans l'en-tête. Composant signature : le FILTRE PAR LUMINOSITÉ ET PAR NIVEAU D'ENTRETIEN (liens vers les vrais filtres d'étiquettes du moteur).
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const leaf = (cls = "vd-leaf") => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 56C8 28 28 8 56 8c0 28-20 48-48 48z" fill="currentColor" opacity=".9"/><path d="M8 56L40 24" stroke="#f3f7ef" stroke-width="2" fill="none"/></svg>`;
const header = (c) => `<header class="vd-head pk-bleed"><div class="vd-bar"><a class="vd-logo" href="/" aria-label="Verdure, accueil">${leaf()}<span>Verdure</span></a>
  <a class="vd-search" href="/recherche"><span>Rechercher une plante, un pot, un conseil…</span><b>Rechercher</b></a>
  <div class="vd-act"><a href="/boutique/compte">Compte</a><a class="vd-cart" href="/boutique/panier">Panier</a></div></div>
  <div class="vd-sub" role="navigation" aria-label="Rubriques">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></header>`;
const footer = (c) => `<footer class="vd-foot pk-bleed"><div class="vd-wrap vd-foot-g"><div>${leaf("vd-leaf vd-leaf--l")}<p class="vd-small">Pépinière-boutique, Angers.<br>Plantes cultivées en France.</p></div>
  <div><p class="vd-lab">Boutique</p><p class="vd-fl"><a href="/boutique">Toutes les plantes</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="vd-lab">Aide</p><p class="vd-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><p class="vd-copy">© Verdure — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="vd-ph pk-bleed"><div class="vd-wrap"><p class="vd-lab">${esc(kicker)}</p><div class="vd-h1" role="heading" aria-level="1">${esc(title)}</div><p class="vd-lead">${esc(lead)}</p></div></section>`);

const LUM = [["Lumière vive", "lumiere-vive", "Fenêtre plein sud ou ouest"], ["Mi-ombre", "mi-ombre", "À 2 m d'une fenêtre"], ["Ombre", "ombre", "Pièce peu éclairée"]];
const ENT = [["Facile", "facile", "Arrosage toutes les 2 semaines"], ["Moyen", "moyen", "Un œil chaque semaine"], ["Exigeant", "exigeant", "Pour les passionnés"]];
const card = ([l, t, d]) => `<a class="vd-fc" href="/boutique/etiquette/${t}"><b>${esc(l)}</b><span>${esc(d)}</span></a>`;
const filtre = () => sec(`<section class="vd-fil pk-bleed"><div class="vd-wrap"><p class="vd-lab">Trouver ma plante</p><h2 class="vd-h2">Quelle lumière chez vous ?</h2><div class="vd-fg">${LUM.map(card).join("")}</div>
  <h2 class="vd-h2">Quel niveau d'entretien ?</h2><div class="vd-fg">${ENT.map(card).join("")}</div><p class="vd-small">Chaque carte ouvre le vrai catalogue filtré par l'étiquette correspondante.</p></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="vd-hero pk-bleed"><div class="vd-wrap vd-hero-in"><div><p class="vd-lab">Plantes cultivées en France</p><div class="vd-h1 vd-h1--xl" role="heading" aria-level="1">Un peu de<br>jungle chez vous</div><p class="vd-lead">Des plantes saines, livrées emballées avec leur fiche d'entretien. Dites-nous la lumière de votre pièce, on s'occupe du reste.</p><p><a class="vd-btn" href="/boutique">Voir les plantes</a></p></div><div class="vd-art" aria-hidden="true">${leaf("vd-big vd-big--1")}${leaf("vd-big vd-big--2")}${leaf("vd-big vd-big--3")}</div></div></section>`),
  filtre(),
  sec(`<section class="vd-sec pk-bleed"><div class="vd-wrap"><p class="vd-lab">Nos chouchoutes</p><h2 class="vd-h2">Pour bien commencer</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 8, columns: "4", orderby: "featured", ratio: "1/1" })),
  sec(`<section class="vd-sec pk-bleed"><div class="vd-wrap"><h2 class="vd-h2">Trois règles qui sauvent une plante</h2><ol class="vd-rules"><li><b>Observer</b>Doigt dans la terre : sèche sur deux centimètres, on arrose.</li><li><b>Drainer</b>Un pot percé, jamais d'eau stagnante dans la soucoupe.</li><li><b>Patienter</b>Une plante déplacée boude deux semaines. C'est normal.</li></ol></div></section>`),
  sec(footer(c))];

const conseils = (c) => [sec(header(c)), head("Conseils", "Bien soigner ses plantes", "Arrosage, lumière, rempotage."), filtre(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="vd-sec pk-bleed"><div class="vd-wrap vd-prose"><h2 class="vd-h2">Livraison</h2><p>Les plantes voyagent calées dans un carton ventilé. Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande.</p><h2 class="vd-h2">Plante abîmée ?</h2><p>Écrivez-nous depuis la page <a href="/contact">contact</a> avec une photo sous quarante-huit heures.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Arrosage, lumière, animaux."),
  sec(`<section class="vd-sec pk-bleed"><div class="vd-wrap"><details class="vd-q"><summary>Mes plantes sont-elles toxiques pour les chats ?</summary><p>Beaucoup le sont (monstera, pothos). Demandez-nous conseil avant de commander.</p></details><details class="vd-q"><summary>À quelle fréquence arroser ?</summary><p>Cela dépend de la plante, de la saison et du pot : chaque fiche donne un repère.</p></details><details class="vd-q"><summary>Les plantes arrivent-elles en pot ?</summary><p>Oui, en pot de culture, prêtes à être rempotées.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une plante ? Envoyez une photo."), { type: "form", heading: "Écrire à la pépinière", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une plante", "Un nom, une taille, un pot."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une plante…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="vd-ph pk-bleed"><div class="vd-wrap"><p class="vd-lab">Page introuvable</p><div class="vd-h1 vd-h1--xl" role="heading" aria-level="1">Cette feuille<br>est tombée</div><p class="vd-lead"><a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "verdure", name: "Verdure", version: "1.0.0", category: "ecommerce", tags: ["naturel", "moderne", "chaleureux"], siteType: "Boutique de plantes d'intérieur", featured: true,
  concept: "Une serre pédagogique : fond vert très pâle, grandes feuilles dessinées, recherche centrale, et un choix de plante par luminosité et niveau d'entretien relié aux vrais filtres.",
  description: "Plantes d'intérieur en ligne : fond lin vert pâle, feuilles dessinées, recherche centrale, filtre par luminosité et niveau d'entretien relié aux étiquettes réelles, catalogue en cartes arrondies.",
  brand: "Verdure", modules: ["formulaires", "recherche", "commerce"], shop: { card: "carte-pastille-arrondie", gallery: "deux-colonnes-info-collante", cart: "page-dediee-claire", catalog: "recherche-centrale-et-barre-de-rubriques" },
  dna: { header: "recherche-centrale-et-rubriques", hero: "deux-colonnes-feuilles-geantes", grid: "quatre-colonnes-cartes-arrondies", motion: "balancement-des-feuilles", shapes: "arrondis-genereux-feuilles", rhythm: "pedagogique-aere", signature: "filtre-lumiere-et-entretien" },
  tokens: {
    colors: { primary: "#2f7d4f", secondary: "#173a28", accent: "#e8a33d", background: "#f3f7ef", surface: "#ffffff", text: "#1c2a21", muted: "#566a5d", success: "#2f7d4f", warning: "#a8681b", error: "#b3402f" },
    fonts: { heading: "font.epilogue", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" },
    radius: { sm: 8, md: 14, lg: 24, button: 999, field: 12, card: 22 }, shadow: { card: "0 6px 18px rgba(23,58,40,.08)", button: "none" }, border: { width: 1, color: "#d6e2d3" },
    type: { h1: { size: 54, weight: 700, lineHeight: 1.05, transform: "none" }, h2: { size: 30, weight: 700, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent", type: "color", default: "#2f7d4f" },
    { key: "balancement", label: "Balancement des feuilles", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
    { key: "cartes", label: "Angles des cartes", type: "choice", default: "arrondies", choices: [["arrondies", "Très arrondis"], ["droites", "Presque droits"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Conseils", "/conseils"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "conseils", name: "Conseils d'entretien", render: conseils }, { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
