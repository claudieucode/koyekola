// Pointure — boutique de sneakers et de revente authentifiée. Direction artistique : l'énergie d'un drop. Noir mat, jaune acide, blocs en biais, titres condensés énormes,
// bandeau d'infos fixe, cartes en mosaïque (la première paire prend deux colonnes). Composant signature : le GUIDE DES POINTURES INTERNATIONALES (tableau EU / UK / US / cm)
// et le badge « authentifiée » — réel : c'est une étiquette de produit du moteur, pas un autocollant décoratif.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const header = (c) => `<header class="pt-head pk-bleed"><div class="pt-strip">Paires vérifiées à la main · Retours sous 14 jours · Livraison suivie</div>
  <div class="pt-bar"><a class="pt-logo" href="/" aria-label="Pointure, accueil">POINTURE<i>/</i></a>
  <div class="pt-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="pt-act"><a href="/boutique/compte">Compte</a><a class="pt-cart" href="/boutique/panier">Panier</a></div></div></header>`;
const footer = (c) => `<footer class="pt-foot pk-bleed"><div class="pt-wrap pt-foot-g"><div><p class="pt-big">POINTURE</p><p class="pt-small">Sneakers neuves, éditions limitées et occasion authentifiée.</p></div>
  <div><p class="pt-lab">Boutique</p><p class="pt-fl"><a href="/boutique">Toutes les paires</a><a href="/boutique/etiquette/authentifiee">Paires authentifiées</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="pt-lab">Aide</p><p class="pt-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><p class="pt-copy">© Pointure — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="pt-ph pk-bleed"><div class="pt-wrap"><p class="pt-lab">${esc(kicker)}</p><div class="pt-h1" role="heading" aria-level="1">${esc(title)}</div><p class="pt-lead">${esc(lead)}</p></div></section>`);

const SIZES = [["39", "6", "6,5", "24,5"], ["40", "6,5", "7", "25"], ["41", "7,5", "8", "26"], ["42", "8", "8,5", "26,5"], ["43", "9", "9,5", "27,5"], ["44", "9,5", "10", "28"], ["45", "10,5", "11", "29"], ["46", "11", "12", "30"]];
const guide = () => sec(`<section class="pt-guide pk-bleed"><div class="pt-wrap"><p class="pt-lab">Guide des pointures</p><h2 class="pt-h2">EU, UK, US, centimètres</h2>
  <table class="pt-table"><caption class="pt-sr">Correspondance des pointures internationales</caption><thead><tr><th scope="col">EU</th><th scope="col">UK</th><th scope="col">US (homme)</th><th scope="col">Pied (cm)</th></tr></thead>
  <tbody>${SIZES.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody></table>
  <p class="pt-small">Mesurez votre pied du talon au gros orteil. Entre deux pointures, prenez la plus grande. Les coupes varient selon le modèle : la fiche produit le précise.</p></div></section>`);
const auth = () => sec(`<section class="pt-auth pk-bleed"><div class="pt-wrap pt-auth-in"><div><p class="pt-lab pt-lab--y">Authentification</p><h2 class="pt-h2">Chaque paire vérifiée à la main</h2><p class="pt-lead">Cuir, coutures, semelle, boîte, numéro de série : cinq contrôles avant l'envoi. Le badge « authentifiée » correspond à une étiquette réelle du produit dans la boutique.</p><p><a class="pt-btn" href="/boutique/etiquette/authentifiee">Voir les paires authentifiées</a></p></div>
  <ol class="pt-checks"><li>Matières</li><li>Coutures</li><li>Semelle</li><li>Boîte</li><li>Numéro de série</li></ol></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="pt-hero pk-bleed"><div class="pt-wrap pt-hero-in"><div><p class="pt-lab pt-lab--y">Nouveaux arrivages</p><div class="pt-h1 pt-h1--xl" role="heading" aria-level="1">Les bonnes paires<br><span>au bon moment</span></div><p class="pt-lead">Neuves, en édition limitée ou d'occasion authentifiée. Les stocks affichés sont les stocks réels.</p><p><a class="pt-btn" href="/boutique">Voir le catalogue</a> <a class="pt-btn pt-btn--o" href="/pointures">Trouver ma pointure</a></p></div>
  <div class="pt-blocks" aria-hidden="true"><i></i><i></i><i></i></div></div></section>`),
  sec(`<section class="pt-sec pk-bleed"><div class="pt-wrap"><p class="pt-lab">À la une</p><h2 class="pt-h2">Sélection de la semaine</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 8, columns: "4", orderby: "featured", ratio: "1/1" })),
  auth(), guide(), sec(footer(c))];

const pointures = (c) => [sec(header(c)), head("Taille", "Trouver sa pointure", "Un tableau, une règle, zéro erreur."), guide(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="pt-sec pk-bleed"><div class="pt-wrap pt-prose"><h2 class="pt-h2">Livraison</h2><p>Les paires partent en boîte renforcée. Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande.</p><h2 class="pt-h2">Retours</h2><p>Quatorze jours pour retourner une paire non portée, dans sa boîte d'origine. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Authenticité, taille, état."),
  sec(`<section class="pt-sec pk-bleed"><div class="pt-wrap"><details class="pt-q"><summary>Comment vérifiez-vous l'authenticité ?</summary><p>Cinq contrôles manuels : matières, coutures, semelle, boîte et numéro de série.</p></details><details class="pt-q"><summary>Que veut dire « occasion, état 9/10 » ?</summary><p>La paire a été portée très peu de fois ; l'état précis figure sur la fiche.</p></details><details class="pt-q"><summary>Comment choisir ma pointure ?</summary><p>Utilisez le <a href="/pointures">guide des pointures</a> ; la fiche précise si la coupe taille petit ou grand.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Contact", "Nous écrire", "Une paire, une taille, une authentification."), { type: "form", heading: "Écrire à l'équipe", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une paire", "Un modèle, une couleur, une édition."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une paire…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pt-ph pk-bleed"><div class="pt-wrap"><p class="pt-lab pt-lab--y">Page introuvable</p><div class="pt-h1 pt-h1--xl" role="heading" aria-level="1">Rupture<br><span>de page</span></div><p class="pt-lead"><a href="/boutique">Retourner au catalogue</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "pointure", name: "Pointure", version: "1.0.0", category: "ecommerce", tags: ["audacieux", "sombre", "moderne"], siteType: "Sneakers et revente authentifiée", featured: true,
  concept: "L'énergie d'un drop : noir mat, jaune acide, titres condensés énormes, bandeau d'infos, mosaïque de paires et guide des pointures EU / UK / US / cm.",
  description: "Sneakers neuves et revente authentifiée : noir mat et jaune acide, titres condensés géants, mosaïque de paires, bandeau fixe, guide des pointures internationales et badge authentifiée relié aux étiquettes réelles.",
  brand: "Pointure", modules: ["formulaires", "recherche", "commerce"], shop: { card: "mosaique-premiere-carte-double", gallery: "galerie-defilement-horizontal", cart: "page-dediee-contrastee-bouton-fixe-mobile", catalog: "barre-de-filtres-en-puces-defilantes" },
  dna: { header: "bandeau-info-et-barre-noire", hero: "titre-condense-geant-et-blocs-en-biais", grid: "mosaique-premiere-carte-double", motion: "glissement-des-blocs", shapes: "biais-et-aplats-acides", rhythm: "drop-percutant", signature: "guide-pointures-et-badge-authentifiee" },
  tokens: {
    colors: { primary: "#d7ff2f", secondary: "#0d0d0d", accent: "#ff4d2e", background: "#101010", surface: "#1b1b1b", text: "#f4f4f0", muted: "#a5a5a0", success: "#7ddc7a", warning: "#ffb020", error: "#ff6b57" },
    fonts: { heading: "font.teko", body: "font.chivo", button: "font.teko", link: "font.chivo" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#2c2c2c" },
    type: { h1: { size: 110, weight: 600, lineHeight: 0.9, transform: "uppercase" }, h2: { size: 52, weight: 600, lineHeight: 0.95, transform: "uppercase" } },
  },
  options: [
    { key: "acide", label: "Couleur acide", type: "color", default: "#d7ff2f" },
    { key: "biais", label: "Blocs en biais", type: "choice", default: "on", choices: [["on", "Activés"], ["off", "À plat"]] },
    { key: "mode", label: "Ambiance", type: "choice", default: "sombre", choices: [["sombre", "Noir mat"], ["clair", "Blanc cassé"]] },
  ],
  menu: [["Accueil", "/"], ["Catalogue", "/boutique"], ["Pointures", "/pointures"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "pointures", name: "Guide des pointures", render: pointures }, { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
