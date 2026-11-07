// Dentelle — lingerie haut de gamme. Direction artistique : la sensualité élégante, par la retenue. Fond chair rosé, texte noir prune, festons de dentelle dessinés en CSS,
// cartes en arche, titres en Bellefair (serif fin à fort contraste) sur Josefin Sans. Composant signature : le GUIDE DES TAILLES — un bloc éditable depuis le Page Builder
// (details + tableaux), dont toutes les correspondances (dessous de poitrine → bande, écart → bonnet, tailles sœurs, pays) sont CALCULÉES ci-dessous à partir de trois règles
// de mesure standard, donc cohérentes entre elles. Aucun calculateur simulé : pas de champ de saisie (le filtre de sécurité les retire), le guide est un barème lisible.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

/* ===== Barème des tailles (règles standard de lingerie, mesures en centimètres) =====
   1. Bande européenne = tour de dessous de poitrine arrondi au multiple de 5 (EU 70 = 68 à 72 cm). Bande française = bande européenne + 15. Bande UK/US en pouces = 30 + 2 × (EU − 65) / 5.
   2. Bonnet = écart entre le tour de poitrine (le plus fort) et le tour de dessous de poitrine : AA 10-11, A 12-13, B 14-15, C 16-17, D 18-19, E 20-21, F 22-23, G 24-25, H 26-27.
      Lettres UK : A, B, C, D identiques ; E = DD ; F = E ; G = F ; H = FF.
   3. Tailles sœurs (même volume de bonnet) : bande + 5 et bonnet − 1 lettre, ou bande − 5 et bonnet + 1 lettre. */
const CUPS = ["AA", "A", "B", "C", "D", "E", "F", "G", "H"];
const CUPS_UK = ["AA", "A", "B", "C", "D", "DD", "E", "F", "FF"];
const cupRange = (i) => [10 + 2 * i, 11 + 2 * i];
const BANDS = [60, 65, 70, 75, 80, 85, 90, 95, 100];
const fr = (eu) => eu + 15;
const uk = (eu) => 30 + (2 * (eu - 65)) / 5;
const bandRows = BANDS.map((eu) => `<tr><th scope="row">${eu - 2} – ${eu + 2} cm</th><td>${fr(eu)}</td><td>${eu}</td><td>${uk(eu)}</td></tr>`).join("");
const cupRows = CUPS.map((c, i) => { const [a, b] = cupRange(i); return `<tr><th scope="row">${a} – ${b} cm</th><td>${c}</td><td>${CUPS_UK[i]}</td></tr>`; }).join("");
const SISTERS = [[85, 2], [85, 3], [90, 3], [90, 4], [95, 4], [100, 5]]; // [bande FR, indice de bonnet dans CUPS]
const sisterRows = SISTERS.map(([b, i]) => `<tr><th scope="row">${b}${CUPS[i]}</th><td>${b + 5}${CUPS[i - 1]}</td><td>${b - 5}${CUPS[i + 1]}</td></tr>`).join("");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`,
};
const header = (c) => `<header class="dt-head pk-bleed"><div class="dt-promo">Emballage discret · Retours sous quatorze jours</div>
  <div class="dt-bar"><a class="dt-logo" href="/" aria-label="Dentelle, accueil"><span>Dentelle</span><i>lingerie</i></a>
  <div class="dt-nav" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="dt-act"><a class="dt-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="dt-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div><div class="dt-fest" aria-hidden="true"></div></header>`;
const footer = (c) => `<footer class="dt-foot pk-bleed"><div class="dt-fest dt-fest--up" aria-hidden="true"></div><div class="dt-wrap dt-foot-g">
  <div><p class="dt-lab">Dentelle</p><p class="dt-small">Atelier de lingerie, Calais.<br>Sur rendez-vous, du mardi au samedi.</p></div>
  <div><p class="dt-lab">Boutique</p><p class="dt-fl"><a href="/boutique">Toute la collection</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="dt-lab">Conseils</p><p class="dt-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</p></div>
  <div><p class="dt-lab">Entretien</p><p class="dt-small">Lavage à la main ou en filet, 30 °C, sans adoucissant. Séchage à plat, loin d'une source de chaleur.</p></div></div>
  <p class="dt-copy">© Dentelle — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="dt-ph pk-bleed"><div class="dt-wrap dt-narrow"><p class="dt-lab">${esc(kicker)}</p><div class="dt-h1" role="heading" aria-level="1">${esc(title)}</div><p class="dt-lead">${esc(lead)}</p></div></section>`);

const tables = () => `<div class="dt-guide">
  <details class="dt-g" open><summary><span class="dt-g-n">1</span><span class="dt-g-t">Prendre ses mesures</span><span class="dt-g-s">Deux mesures, un mètre ruban souple.</span></summary>
    <div class="dt-g-b"><ol class="dt-steps"><li><b>Dessous de poitrine.</b> Debout, bras le long du corps, passez le mètre juste sous la poitrine, bien à plat dans le dos. Il doit être ajusté sans comprimer. Notez la mesure en centimètres à l'expiration.</li><li><b>Poitrine.</b> Passez le mètre sur la pointe de la poitrine, toujours à l'horizontale et sans serrer. Notez la mesure.</li><li><b>Écart.</b> Soustrayez la première mesure de la seconde : c'est l'écart qui donne la lettre du bonnet.</li></ol></div></details>
  <details class="dt-g"><summary><span class="dt-g-n">2</span><span class="dt-g-t">Trouver la bande</span><span class="dt-g-s">Du tour de dessous de poitrine à la taille, par pays.</span></summary>
    <div class="dt-g-b"><div class="dt-tw"><table class="dt-tb"><caption>Tour de dessous de poitrine et bande par pays</caption><thead><tr><th scope="col">Dessous de poitrine</th><th scope="col">France, Belgique</th><th scope="col">Allemagne, Pays-Bas, Europe</th><th scope="col">Royaume-Uni, États-Unis (pouces)</th></tr></thead><tbody>${bandRows}</tbody></table></div>
    <p class="dt-small">Entre deux tailles, une mesure à la limite : prenez la bande qui ferme sur le dernier cran sans gêner la respiration, ou la taille au-dessus si vous hésitez.</p></div></details>
  <details class="dt-g"><summary><span class="dt-g-n">3</span><span class="dt-g-t">Trouver le bonnet</span><span class="dt-g-s">De l'écart poitrine / dessous de poitrine à la lettre.</span></summary>
    <div class="dt-g-b"><div class="dt-tw"><table class="dt-tb"><caption>Écart et bonnet</caption><thead><tr><th scope="col">Écart (poitrine − dessous)</th><th scope="col">France, Europe</th><th scope="col">Royaume-Uni</th></tr></thead><tbody>${cupRows}</tbody></table></div>
    <p class="dt-small">Arrondissez l'écart au centimètre le plus proche. Les bonnets américains suivent les lettres britanniques jusqu'au D, puis varient selon les marques : référez-vous alors à la fiche du modèle.</p></div></details>
  <details class="dt-g"><summary><span class="dt-g-n">4</span><span class="dt-g-t">Un exemple, pas à pas</span><span class="dt-g-s">77 cm sous la poitrine, 93 cm sur la poitrine.</span></summary>
    <div class="dt-g-b"><ol class="dt-steps"><li>Dessous de poitrine 77 cm : la ligne « 73 – 77 cm » du tableau 2, donc bande européenne 75, <b>française 90</b>, britannique 34.</li><li>Écart 93 − 77 = 16 cm : la ligne « 16 – 17 cm » du tableau 3, donc bonnet <b>C</b> (C aussi en britannique).</li><li>Taille à choisir en France : <b class="dt-big">90C</b>.</li></ol></div></details>
  <details class="dt-g"><summary><span class="dt-g-n">5</span><span class="dt-g-t">Tailles sœurs</span><span class="dt-g-s">Même volume de bonnet, bande différente.</span></summary>
    <div class="dt-g-b"><div class="dt-tw"><table class="dt-tb"><caption>Équivalences en tailles françaises</caption><thead><tr><th scope="col">Votre taille</th><th scope="col">Bande plus large</th><th scope="col">Bande plus étroite</th></tr></thead><tbody>${sisterRows}</tbody></table></div>
    <p class="dt-small">Si la bande remonte dans le dos, descendez d'une bande et montez d'une lettre. Si elle serre, montez d'une bande et descendez d'une lettre. Le bonnet garde le même volume.</p></div></details>
  <details class="dt-g"><summary><span class="dt-g-n">6</span><span class="dt-g-t">Bien porté ?</span><span class="dt-g-s">Quatre vérifications devant le miroir.</span></summary>
    <div class="dt-g-b"><ul class="dt-list"><li>La bande est horizontale et reste à plat dans le dos, sans glisser.</li><li>Le centre du soutien-gorge touche le sternum.</li><li>La poitrine remplit le bonnet, sans déborder ni plisser.</li><li>Les bretelles ne soutiennent qu'une petite part du poids : le maintien vient de la bande.</li></ul></div></details>
  <p class="dt-small dt-g-note">Les marques taillent parfois différemment. Chaque fiche produit indique les tailles réellement disponibles ; les <a href="/boutique">tailles épuisées</a> sont signalées par le catalogue. Un doute : <a href="/contact">écrivez-nous</a>.</p>
</div>`;
const guide = () => sec(`<section class="dt-gd pk-bleed"><div class="dt-wrap"><p class="dt-lab">Guide des tailles</p><h2 class="dt-h2">Trouver sa taille</h2>${tables()}</div></section>`);

const MATIERES = [["Dentelle", "dentelle"], ["Soie", "soie"], ["Satin", "satin"], ["Coton", "coton"], ["Sans armature", "sans-armature"], ["À armatures", "armatures"], ["Nuit", "nuit"], ["Coffrets", "coffret"]];
const matieres = () => sec(`<section class="dt-sec pk-bleed"><div class="dt-wrap"><p class="dt-lab">Par matière et par modèle</p><h2 class="dt-h2">Parcourir la collection</h2><div class="dt-chips">${MATIERES.map(([l, t]) => `<a class="dt-chip" href="/boutique/etiquette/${t}">${esc(l)}</a>`).join("")}</div><p class="dt-small">Chaque lien ouvre le vrai catalogue filtré : seuls les produits qui portent cette étiquette dans la boutique s'affichent.</p></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="dt-hero pk-bleed"><div class="dt-wrap dt-hero-in"><div class="dt-hero-t"><p class="dt-lab">Collection permanente</p><div class="dt-h1 dt-h1--xl" role="heading" aria-level="1">L'élégance<br><em>se devine</em></div><p class="dt-lead">Dentelle souple, soie lavée et coupes qui se font oublier. De la lingerie pensée pour la peau, avant le regard.</p><p><a class="dt-btn" href="/boutique">Voir la collection</a> <a class="dt-link" href="/tailles">Trouver ma taille</a></p></div>
    <div class="dt-arch" aria-hidden="true"><div class="dt-arch-in"></div></div></div></section>`),
  sec(`<section class="dt-sec pk-bleed"><div class="dt-wrap"><p class="dt-lab">Sélection</p><h2 class="dt-h2">Pièces à la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 6, columns: "3", orderby: "featured", ratio: "3/4" })),
  guide(), matieres(),
  sec(`<section class="dt-sec pk-bleed"><div class="dt-wrap dt-narrow"><p class="dt-lab">Nos engagements</p><ul class="dt-vals"><li><b>Discrétion</b>Colis sans mention de contenu sur l'extérieur.</li><li><b>Confort</b>Coutures plates, élastiques doux, bretelles réglables.</li><li><b>Honnêteté</b>Les prix affichés sont les prix payés. Pas de compte à rebours, pas de stock inventé : ce que vous voyez vient du catalogue.</li></ul></div></section>`),
  sec(footer(c))];

const livraison = (c) => [sec(header(c)), head("Livraison · Retours", "Livraison et retours", "Les conditions, sans astérisque."),
  sec(`<section class="dt-sec pk-bleed"><div class="dt-wrap dt-narrow dt-prose"><h2 class="dt-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Les colis sont neutres : aucune mention du contenu à l'extérieur.</p><h2 class="dt-h2">Retours</h2><p>Vous disposez de quatorze jours pour nous retourner une pièce non portée, avec ses étiquettes. Pour des raisons d'hygiène, les culottes dont le film protecteur a été retiré ne sont pas reprises. Écrivez-nous depuis la page <a href="/contact">contact</a>.</p><h2 class="dt-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Taille, entretien, matière."),
  sec(`<section class="dt-sec pk-bleed"><div class="dt-wrap dt-narrow"><details class="dt-q"><summary>Comment choisir ma taille ?</summary><p>Mesurez le dessous et le tour de poitrine, puis suivez le <a href="/tailles">guide des tailles</a> : la bande vient du dessous de poitrine, le bonnet de l'écart entre les deux mesures.</p></details><details class="dt-q"><summary>Comment laver la dentelle ?</summary><p>À la main ou en filet, à 30 °C, sans adoucissant ni essorage. Séchez à plat.</p></details><details class="dt-q"><summary>Ma taille habituelle est épuisée, que faire ?</summary><p>Essayez une taille sœur : même volume de bonnet avec une autre bande (voir le guide des tailles). Les disponibilités affichées sont celles du catalogue en temps réel.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une taille, une matière, une commande."),
  { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher une pièce", "Un modèle, une matière, un coloris."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une pièce…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="dt-ph pk-bleed"><div class="dt-wrap dt-narrow"><p class="dt-lab">Page introuvable</p><div class="dt-h1 dt-h1--xl" role="heading" aria-level="1">Fil <em>coupé</em></div><p class="dt-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "dentelle", name: "Dentelle", version: "1.0.0", category: "luxe", tags: ["luxe", "editorial", "chaleureux"], siteType: "Lingerie haut de gamme", featured: true,
  concept: "La sensualité par la retenue : un fond chair rosé, des festons de dentelle, des cartes en arche et un guide des tailles dont chaque correspondance est calculée et vérifiable.",
  description: "Lingerie haut de gamme : tons chair et noir prune, festons de dentelle dessinés en CSS, cartes en arche, guide des tailles (dessous de poitrine, bonnet, tailles sœurs, pays) éditable depuis le Page Builder, boutique réelle.",
  brand: "Dentelle", modules: ["formulaires", "recherche", "commerce"], shop: { card: "arche-image-legende-gauche", gallery: "image-arche-et-vignettes-sous-l-image", cart: "page-dediee-feston", catalog: "puces-matiere-et-modele-au-dessus-de-la-grille" },
  dna: {
    header: "logo-gauche-menu-capitales-fines-et-feston", hero: "titre-italique-et-arche-de-dentelle", grid: "trois-colonnes-arche-legende-gauche", motion: "feston-qui-ondule-et-fondu-doux",
    shapes: "festons-de-dentelle-et-arches", rhythm: "intime-aere-et-tableaux-fins", signature: "guide-des-tailles-depliant-par-pays",
    typo: "bellefair-sur-josefin", palette: "chair-rose-noir-prune", card: "arche", gallery: "arche-vignettes-dessous", cart: "page-feston", catalog: "puces-matiere", density: "aeree", surface: "tableaux-filets-fins",
  },
  tokens: {
    colors: { primary: "#2a1a1f", secondary: "#d9b3a6", accent: "#9c5a52", background: "#f5e8e1", surface: "#fbf3ee", text: "#2a1a1f", muted: "#6e5a58", success: "#4d6b4f", warning: "#8a6a2f", error: "#a23b34" },
    fonts: { heading: "font.bellefair", body: "font.josefin-sans", button: "font.josefin-sans", link: "font.josefin-sans" },
    radius: { sm: 2, md: 4, lg: 24, button: 2, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#e0c8bd" },
    type: { h1: { size: 60, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur de la dentelle (accent)", type: "color", default: "#9c5a52" },
    { key: "fond", label: "Fond", type: "choice", default: "chair", choices: [["chair", "Chair rosé"], ["ivoire", "Ivoire"], ["noir", "Noir prune"]] },
    { key: "festons", label: "Festons de dentelle", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
    { key: "cartes", label: "Forme des cartes produit", type: "choice", default: "arche", choices: [["arche", "Arche"], ["droite", "Droite"]] },
    { key: "titres", label: "Titres", type: "choice", default: "italique", choices: [["italique", "Mot en italique"], ["droit", "Tout droit"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "air", label: "Aération (%)", type: "range", default: 100, min: 80, max: 130, step: 10 },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Guide des tailles", "/tailles"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "tailles", name: "Guide des tailles", render: (c) => [sec(header(c)), head("Guide des tailles", "Trouver sa taille", "Deux mesures, trois tableaux, une taille juste."), guide(), matieres(), sec(footer(c))] },
    { key: "livraison", name: "Livraison et retours", render: livraison }, { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
