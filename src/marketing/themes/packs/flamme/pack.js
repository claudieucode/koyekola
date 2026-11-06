// Flamme — chandelier de maison, parfums d'intérieur. Direction artistique : l'intimité d'une pièce éclairée à la bougie. Fond brun-noir chaud, halo de flamme qui vacille doucement,
// titres en italique sur serif de Didot (Prata), menu en tiroir latéral. Composant signature : le FILTRE PAR AMBIANCE ET PAR PIÈCE — des liens vers les vrais filtres du moteur
// (étiquettes de produits), donc toujours à jour avec le catalogue réel.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const flame = `<svg class="fl-flame" viewBox="0 0 40 70" aria-hidden="true"><path class="fl-f1" d="M20 2C28 18 36 28 36 44a16 16 0 0 1-32 0C4 30 12 24 20 2z"/><path class="fl-f2" d="M20 30c4 7 8 11 8 17a8 8 0 0 1-16 0c0-6 4-9 8-17z"/></svg>`;
const header = (c) => `<header class="fl-head pk-bleed"><div class="fl-bar"><details class="fl-menu"><summary><span class="fl-sum-ic" aria-hidden="true"><i></i><i></i></span><span class="fl-sum-t">Menu</span></summary>
  <div class="fl-drawer" role="navigation" aria-label="Menu principal"><p class="fl-lab">Flamme · Maison de bougies</p><div class="fl-dl">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div><p class="fl-small">Coulées à la main, à Grasse.<br>Cire végétale, mèche en coton.</p></div></details>
  <a class="fl-logo" href="/" aria-label="Flamme, accueil">${flame}<span>Flamme</span></a>
  <div class="fl-act"><a href="/boutique/compte">Compte</a><a class="fl-cart" href="/boutique/panier">Panier</a></div></div></header>`;
const footer = (c) => `<footer class="fl-foot pk-bleed"><div class="fl-wrap fl-foot-g"><div><p class="fl-lab">Flamme</p><p class="fl-small">Atelier de coulage, Grasse.<br>Visites sur rendez-vous.</p></div>
  <div><p class="fl-lab">Boutique</p><p class="fl-fl"><a href="/boutique">Toutes les bougies</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="fl-lab">Aide</p><p class="fl-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div></div><p class="fl-copy">© Flamme — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="fl-ph pk-bleed"><div class="fl-wrap fl-narrow"><p class="fl-lab">${esc(kicker)}</p><div class="fl-h1" role="heading" aria-level="1">${esc(title)}</div><p class="fl-lead">${esc(lead)}</p></div></section>`);

const AMB = [["Boisé", "boise"], ["Floral", "floral"], ["Frais", "frais"], ["Fumé", "fume"], ["Vert", "vert"], ["Ambré", "ambre"]];
const ROOMS = [["Salon", "salon"], ["Chambre", "chambre"], ["Cuisine", "cuisine"], ["Bureau", "bureau"], ["Salle de bain", "salle-de-bain"]];
const tag = (arr) => arr.map(([l, t]) => `<a class="fl-chip" href="/boutique/etiquette/${t}">${esc(l)}</a>`).join("");
const ambiance = () => sec(`<section class="fl-amb pk-bleed"><div class="fl-wrap"><p class="fl-lab">Choisir une bougie</p><h2 class="fl-h2">Par ambiance, par pièce</h2>
  <div class="fl-amb-g"><div><p class="fl-lab">L'ambiance</p><div class="fl-chips">${tag(AMB)}</div></div><div><p class="fl-lab">La pièce</p><div class="fl-chips">${tag(ROOMS)}</div></div></div>
  <p class="fl-small">Chaque lien ouvre le vrai catalogue filtré : seuls les produits qui portent cette étiquette dans la boutique s'affichent.</p></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="fl-hero pk-bleed"><div class="fl-halo" aria-hidden="true"></div><div class="fl-wrap fl-hero-in"><p class="fl-lab">Cire végétale · Coulée à la main</p><div class="fl-h1 fl-h1--xl" role="heading" aria-level="1">Une pièce<br><em>s'allume</em></div><p class="fl-lead">Douze parfums, une seule intention : changer l'air d'une pièce en une allumette.</p><p><a class="fl-btn" href="/boutique">Voir les bougies</a></p></div></section>`),
  ambiance(),
  sec(`<section class="fl-sec pk-bleed"><div class="fl-wrap"><p class="fl-lab">Nos préférées</p><h2 class="fl-h2">À allumer ce soir</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "4/5" })),
  sec(`<section class="fl-sec pk-bleed"><div class="fl-wrap fl-narrow"><p class="fl-lab">Le soin de la flamme</p><h2 class="fl-h2">Quatre gestes</h2><ol class="fl-steps"><li><b>Première fois</b>Laissez fondre toute la surface : trois heures.</li><li><b>Mèche</b>Coupez à 5 mm avant chaque allumage.</li><li><b>Durée</b>Pas plus de quatre heures d'affilée.</li><li><b>Fin</b>Éteignez avec un snuffer, jamais en soufflant.</li></ol></div></section>`),
  sec(footer(c))];

const soin = (c) => [sec(header(c)), head("Savoir-faire", "L'art de la flamme", "Cire de colza et de soja, mèche en coton, parfums sans phtalates."),
  sec(`<section class="fl-sec pk-bleed"><div class="fl-wrap fl-narrow fl-prose"><p>Chaque bougie est coulée à la main dans l'atelier. Les parfums sont composés avec un maître parfumeur de Grasse ; la cire, végétale, brûle proprement.</p><p>Retrouvez les ambiances et les pièces depuis la <a href="/boutique">boutique</a>.</p></div></section>`), ambiance(), sec(footer(c))];
const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Frais et délais exacts calculés à la commande."),
  sec(`<section class="fl-sec pk-bleed"><div class="fl-wrap fl-narrow fl-prose"><h2 class="fl-h2">Livraison</h2><p>Les bougies voyagent dans un carton de protection. Le coût et le délai dépendent de votre pays et de la méthode choisie à la commande.</p><h2 class="fl-h2">Retours</h2><p>Une bougie non allumée peut être retournée sous quatorze jours. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Combustion, parfums, sécurité."),
  sec(`<section class="fl-sec pk-bleed"><div class="fl-wrap fl-narrow"><details class="fl-q"><summary>Quelle est la durée de combustion ?</summary><p>Environ 45 heures pour 190 g et 100 heures pour 450 g.</p></details><details class="fl-q"><summary>Les parfums sont-ils naturels ?</summary><p>Les parfums sont des compositions sans phtalates, certifiées conformes à la réglementation européenne.</p></details><details class="fl-q"><summary>Peut-on réutiliser le verre ?</summary><p>Oui : une fois la cire fondue au bain-marie, le verre se lave et sert de verre à eau.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Choisir un parfum, offrir, personnaliser un coffret."), { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un parfum", "Une note, une pièce, un coffret."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un parfum…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="fl-ph pk-bleed"><div class="fl-wrap fl-narrow"><p class="fl-lab">Page introuvable</p><div class="fl-h1 fl-h1--xl" role="heading" aria-level="1">La flamme<br><em>s'est éteinte</em></div><p class="fl-lead"><a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "flamme", name: "Flamme", version: "1.0.0", category: "luxe", tags: ["sombre", "luxe", "chaleureux"], siteType: "Bougies et parfums d'intérieur", featured: true,
  concept: "Une pièce éclairée à la bougie : fond brun-noir, halo qui vacille doucement, menu en tiroir, et un choix de bougie par ambiance et par pièce branché sur les vrais filtres du catalogue.",
  description: "Bougies et parfums d'intérieur de luxe : fond brun-noir chaud, halo de flamme, tiroir de navigation, filtre par ambiance et par pièce relié aux étiquettes réelles, fiche produit centrée.",
  brand: "Flamme", modules: ["formulaires", "recherche", "commerce"], shop: { card: "image-plein-format-voile", gallery: "image-unique-centree", cart: "page-dediee-nocturne", catalog: "univers-par-ambiance-et-piece" },
  dna: { header: "tiroir-lateral-logo-flamme", hero: "plein-ecran-halo-vacillant", grid: "trois-colonnes-portrait-voile", motion: "halo-vacillant-lent", shapes: "ovale-et-filet-chaud", rhythm: "nocturne-intimiste", signature: "filtre-ambiance-et-piece" },
  tokens: {
    colors: { primary: "#d9a35c", secondary: "#1a120d", accent: "#e8b86e", background: "#171009", surface: "#241913", text: "#efe3d2", muted: "#b3a38e", success: "#7aa57f", warning: "#d9a35c", error: "#e0705f" },
    fonts: { heading: "font.prata", body: "font.mulish", button: "font.mulish", link: "font.mulish" },
    radius: { sm: 2, md: 4, lg: 8, button: 999, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#3b2c21" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "halo", label: "Halo de flamme", type: "choice", default: "on", choices: [["on", "Vacillant"], ["off", "Fixe"]] },
    { key: "accent", label: "Couleur de la flamme", type: "color", default: "#e8b86e" },
    { key: "fond", label: "Fond", type: "choice", default: "brun", choices: [["brun", "Brun chaud"], ["noir", "Noir profond"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Savoir-faire", "/soin"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "soin", name: "Savoir-faire", render: soin }, { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
