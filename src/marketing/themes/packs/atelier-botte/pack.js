// Atelier Botte — bottier sur mesure. Direction artistique : le papier de patron, le trait de craie bleue, la forme en bois, les perforations d'un soulier richelieu.
// Fond kraft clair, bandes noir-vert fumé, cordovan, craie bleue. Formes : ARCHES (le haut d'une forme de bottier) et rangées de perforations (broguing).
// Composant signature : la FICHE D'ESSAYAGE — un rendez-vous en atelier (brique « rendez-vous » du moteur), le choix de la finition (variante « Finition » du produit) et la gravure d'initiales
// (personnalisation par ligne du moteur). L'aperçu de patine est une illustration éditable ; rien n'est simulé côté panier, paiement, avis, stock ou agenda.
const { sec, esc } = require("../kit");
const { shopgrid, wrap } = require("../shopkit");

const ICON = {
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 20c1-4 4-5 7-5s6 1 7 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  mark: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3c7 0 11 7 10 15-1 5-4 7-4 11 0 4-2 8-6 8s-6-4-6-8c0-4-3-6-4-11C9 10 13 3 20 3z" fill="none" stroke="#8fb8c6" stroke-width="1.8"/><path class="ab-dash" d="M15 12h10M14 18h12" stroke="#8fb8c6" stroke-width="1.4" fill="none"/></svg>`,
};
// Gabarit de semelle vu de dessus (patron du bottier) : contour à la craie, axe, lignes de cote. Les libellés sont en HTML (le SVG ne porte aucun texte).
const gabarit = () => `<svg viewBox="0 0 240 440" role="img" aria-label="Gabarit d'une semelle de soulier, avec lignes de cote">
<path class="ab-sole" d="M120 18C160 18 192 68 190 138C189 183 160 213 158 253C157 298 172 338 170 373C168 408 145 422 120 422C95 422 72 408 70 373C68 338 83 298 82 253C80 213 51 183 50 138C48 68 80 18 120 18Z"/>
<path class="ab-chalk ab-draw" d="M120 8V432"/>
<path class="ab-chalk ab-dots" d="M50 138H190M82 253H158M70 373H170"/>
<path class="ab-cote ab-draw" d="M20 18V422M14 18H26M14 422H26"/>
<path class="ab-cote ab-draw" d="M50 436H190M50 430V442M190 430V442"/>
<circle class="ab-pt" cx="120" cy="138" r="3.5"/><circle class="ab-pt" cx="120" cy="253" r="3.5"/><circle class="ab-pt" cx="120" cy="373" r="3.5"/></svg>`;
// Soulier de profil (aperçu de finition et de patine) : le cuir se règle par variables CSS, la patine est un voile d'ombre.
const soulier = () => `<svg viewBox="0 0 460 230" role="img" aria-label="Soulier en cuir de profil, aperçu de la finition">
<path class="ab-sh-sole" d="M22 178H436Q448 178 448 190Q448 204 430 206H62Q22 206 22 178Z"/>
<path class="ab-sh-heel" d="M24 178H128V200H46Q24 200 24 178Z"/>
<path class="ab-sh-up" d="M40 176Q36 120 66 104Q130 92 168 62Q196 40 236 40Q262 40 270 62Q292 110 350 126Q432 142 440 172Q441 178 432 178H40Z"/>
<path class="ab-sh-patine" d="M40 176Q36 120 66 104Q130 92 168 62Q196 40 236 40Q262 40 270 62Q292 110 350 126Q432 142 440 172Q441 178 432 178H40Z"/>
<path class="ab-sh-cap" d="M330 122Q392 138 410 176"/>
<path class="ab-sh-weld" d="M40 178H436"/>
<path class="ab-sh-lace" d="M196 58L238 80M210 48L252 72M224 42L268 66"/>
<path class="ab-sh-brogue" d="M346 140Q382 150 398 168"/></svg>`;

const rdvUrl = "/boutique/rendez-vous";
const header = (c) => `<header class="ab-head pk-bleed"><div class="ab-ruler" aria-hidden="true"></div>
  <div class="ab-promo">Sur rendez-vous à l'atelier · Finitions au choix · Délais et retours : voir les conditions</div>
  <div class="ab-bar"><a class="ab-rdv" href="${rdvUrl}">Prendre rendez-vous</a>
  <a class="ab-logo" href="/" aria-label="Atelier Botte, accueil">${ICON.mark}<div><span>Atelier Botte</span><i>bottier sur mesure</i></div></a>
  <div class="ab-nav ab-nav--ic" role="navigation" aria-label="Boutique"><a class="ab-ic" href="/boutique/souhaits" aria-label="Mes souhaits">${ICON.heart}</a><a class="ab-ic" href="/boutique/compte" aria-label="Mon compte">${ICON.user}</a><a class="ab-ic" href="/boutique/panier" aria-label="Panier">${ICON.bag}</a></div></div>
  <div class="ab-nav ab-nav--main" role="navigation" aria-label="Navigation principale">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></header>`;
const footer = (c) => `<footer class="ab-foot pk-bleed"><div class="ab-wrap ab-foot-g">
  <div><p class="ab-lab">Atelier Botte</p><p class="ab-small">Bottier sur mesure.<br>Sur rendez-vous du mardi au samedi.</p><p><a class="ab-btn ab-btn--ghost" href="${rdvUrl}">Prendre rendez-vous</a></p></div>
  <div><p class="ab-lab">Boutique</p><p class="ab-fl"><a href="/boutique">Tous les modèles</a><a href="/boutique/comparer">Comparer</a><a href="/boutique/souhaits">Mes souhaits</a><a href="/boutique/panier">Panier</a><a href="/boutique/compte">Mon compte</a></p></div>
  <div><p class="ab-lab">Informations</p><p class="ab-fl">${c.menu.filter((m) => !m.url.startsWith("/boutique") && m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/configurer">Comment configurer</a></p></div>
  <div><p class="ab-lab">Entretien</p><p class="ab-small">Embauchoirs en bois après chaque port, repos d'une journée entre deux ports, cirage à la brosse douce.</p></div></div>
  <p class="ab-copy">© Atelier Botte — boutique de démonstration du thème</p></footer>`;
const head = (kicker, title, lead) => sec(`<section class="ab-ph pk-bleed"><div class="ab-wrap ab-narrow"><p class="ab-lab">${esc(kicker)}</p><div class="ab-h1" role="heading" aria-level="1">${esc(title)}</div><p class="ab-lead">${esc(lead)}</p></div></section>`);

// ----- Composant signature : la fiche d'essayage. data-* lus par motion.js (éditables dans le Page Builder). Sans script, l'illustration et la note restent lisibles.
const FINITIONS = "Noir ciré:#1b1512;Cognac patiné:#9a5428;Havane brossé:#7a4a2a;Cordovan:#5c2323";
const ficheBloc = (title = "Choisir sa finition, réserver son essayage") => sec(`<section class="ab-fiche pk-bleed"><div class="ab-wrap"><p class="ab-lab">Fiche d'essayage</p><h2 class="ab-h2">${esc(title)}</h2>
  <p class="ab-lead">Voyez comment une finition vieillit, puis réservez un créneau d'essayage à l'atelier.</p>
  <div class="ab-fx" data-ab-patine data-finitions="${FINITIONS}" data-etats="Neuf;Après un an;Après cinq ans">
    <div class="ab-stage" data-ab-stage>${soulier()}</div>
    <div class="ab-ctl" data-ab-ui><p class="ab-fallback">L'aperçu interactif demande JavaScript. Sans lui, choisissez la finition dans la liste de la fiche du produit.</p></div>
  </div>
  <p class="ab-note">Aperçu illustratif : la couleur réelle d'un cuir patiné varie d'une peau à l'autre. La finition se choisit à la commande comme variante « Finition » du produit ; les initiales à graver se saisissent dans le champ de personnalisation de la fiche, pour les produits où l'atelier l'a activé (le prix affiché ne change pas).</p>
  <ol class="ab-steps"><li><div><b>Réserver l'essayage</b><span>La page de rendez-vous propose uniquement les créneaux réellement libres de l'atelier. Aucun paiement à cette étape.</span></div></li><li><div><b>Choisir la finition</b><span>Chaque finition est une variante du modèle, avec son propre stock.</span></div></li><li><div><b>Faire graver ses initiales</b><span>Le texte exact est enregistré par ligne de panier et visible de l'atelier sur la commande.</span></div></li></ol>
  <p><a class="ab-btn" href="${rdvUrl}">Prendre rendez-vous d'essayage</a> <a class="ab-link" href="/boutique">Voir les modèles</a></p></div></section>`);

const FICHES = [
  ["Noir ciré", "Un cuir lissé, cire fine : le classique des tenues de ville.", [["Aspect", "Brillant discret"], ["Vieillissement", "Se marque peu"], ["Entretien", "Cirage noir, brosse douce"], ["Variante", "Finition « Noir ciré »"]]],
  ["Cognac patiné", "Une teinte appliquée à la main en plusieurs passes, plus sombre aux bords.", [["Aspect", "Nuancé, profondeur"], ["Vieillissement", "Prend la lumière"], ["Entretien", "Cirage incolore ou miel"], ["Variante", "Finition « Cognac patiné »"]]],
  ["Havane brossé", "Un brun mat, brossé jusqu'au grain ; il se patine à l'usage.", [["Aspect", "Mat, chaud"], ["Vieillissement", "Fonce avec le temps"], ["Entretien", "Crème nourrissante"], ["Variante", "Finition « Havane brossé »"]]],
  ["Cordovan", "Un rouge-brun profond, le cuir le plus dense du catalogue.", [["Aspect", "Reflets de vin"], ["Vieillissement", "Pli lisse"], ["Entretien", "Brosse en crin, cire"], ["Variante", "Finition « Cordovan »"]]],
];
const finitions = () => sec(`<section class="ab-sec pk-bleed"><div class="ab-wrap ab-split"><div><p class="ab-lab">Les finitions</p><h2 class="ab-h2">Quatre façons de porter un cuir</h2><p class="ab-small">Dépliez une fiche. Les variantes proposées sur la boutique sont réglées par l'atelier, produit par produit.</p></div>
  <div class="ab-fiches">${FICHES.map((f, i) => `<details class="ab-det"${i === 0 ? " open" : ""}><summary><span class="ab-det-t">${esc(f[0])}</span><span class="ab-det-s">${esc(f[1])}</span></summary><dl class="ab-dl">${f[2].map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl></details>`).join("")}</div></div></section>`);
const gestes = () => sec(`<section class="ab-dark ab-sec pk-bleed"><div class="ab-wrap ab-geste"><div><p class="ab-lab">Le geste</p><h2 class="ab-h2">De la forme en bois <em>à la dernière cire</em></h2><ol class="ab-steps"><li><div><b>La forme</b><span>Le pied est mesuré à l'essayage ; la forme en bois reproduit ses volumes.</span></div></li><li><div><b>Le patron</b><span>Chaque pièce de l'empeigne est tracée à la craie puis découpée au couteau.</span></div></li><li><div><b>Le montage</b><span>L'empeigne est tirée sur la forme, puis la semelle est cousue, à la main ou à la machine Goodyear selon le modèle.</span></div></li><li><div><b>La finition</b><span>Teinte, brossage, cire : la couleur choisie se construit en plusieurs passes.</span></div></li></ol></div>
  <figure class="ab-gab">${gabarit()}<figcaption>Gabarit de semelle : longueur, largeur au cou-de-pied, largeur du talon.</figcaption></figure></div></section>`);

const home = (c) => [sec(header(c)),
  sec(`<section class="ab-hero pk-bleed"><div class="ab-wrap ab-hero-in"><div><p class="ab-lab">Bottier sur mesure</p><div class="ab-h1 ab-h1--xl" role="heading" aria-level="1">Un soulier<br>qui prend <em>votre pied</em></div><p class="ab-lead">Des souliers de ville montés sur votre forme, en cuir patiné à la main. Venez essayer en atelier : on mesure, vous choisissez la finition, on grave vos initiales si vous le souhaitez.</p><p><a class="ab-btn" href="${rdvUrl}">Prendre rendez-vous d'essayage</a> <a class="ab-link" href="/boutique">Voir les modèles</a></p></div>
    <div class="ab-arch"><div class="ab-arch-in">${gabarit()}</div><p class="ab-arch-cap">Le gabarit de votre pied, tracé à l'atelier</p></div></div></section>`),
  sec(`<section class="ab-sec ab-sec--tight pk-bleed"><div class="ab-wrap"><ul class="ab-trio"><li><b>1 · Rendez-vous</b>Un créneau libre réel, sur place ou à distance selon les types proposés par l'atelier.</li><li><b>2 · Finition</b>Noir ciré, cognac patiné, havane brossé ou cordovan : une variante du modèle.</li><li><b>3 · Gravure</b>Vos initiales, saisies sur la fiche du produit lorsque l'atelier la propose.</li></ul></div></section>`),
  sec(`<section class="ab-sec pk-bleed"><div class="ab-wrap"><p class="ab-lab">Les modèles d'atelier</p><h2 class="ab-h2">À la une</h2></div></section>`),
  wrap(shopgrid({ source: "featured", count: 4, columns: "4", orderby: "featured", ratio: "4/5" })),
  ficheBloc(), gestes(), finitions(),
  sec(`<section class="ab-sec pk-bleed"><div class="ab-wrap"><ul class="ab-vals"><li><b>Ressemelable</b>Un soulier monté Goodyear peut être ressemelé : l'atelier indique sur chaque fiche les modèles concernés.</li><li><b>Prix affichés</b>Le prix affiché est le prix payé. Aucune fausse urgence, aucun compte à rebours.</li><li><b>Avis vérifiés</b>Un avis ne peut venir que d'une commande payée contenant le produit.</li></ul></div></section>`),
  sec(footer(c))];

const essayage = (c) => [sec(header(c)), head("Essayage", "Prendre rendez-vous d'essayage", "Un créneau à l'atelier, ou à distance selon ce que propose la maison."), ficheBloc("Votre essayage, étape par étape"),
  sec(`<section class="ab-sec pk-bleed"><div class="ab-wrap ab-narrow ab-prose"><h2 class="ab-h2">Comment ça se passe</h2><ol class="ab-steps"><li><div><b>Choisissez un type de rendez-vous</b><span>Essayage, prise de mesure, retouche : les types, leur durée et le lieu sont définis par l'atelier.</span></div></li><li><div><b>Choisissez un jour, puis une heure</b><span>Seuls les créneaux libres sont affichés ; deux personnes ne peuvent pas réserver la même heure.</span></div></li><li><div><b>Recevez la confirmation</b><span>Un e-mail récapitulatif contient un lien pour annuler. L'atelier peut confirmer ou reporter votre demande.</span></div></li></ol>
  <p><a class="ab-btn" href="${rdvUrl}">Ouvrir l'agenda de l'atelier</a></p><p class="ab-small">Depuis la fiche d'un modèle, le lien « Essayer ce modèle en atelier » rattache le rendez-vous à ce produit. Aucun paiement n'est demandé pour un rendez-vous.</p></div></section>`), sec(footer(c))];
const finitionsPage = (c) => [sec(header(c)), head("Finitions", "Le guide des finitions", "Couleur, brillance, vieillissement : ce que change chaque finition."), ficheBloc("Voir la patine avec le temps"), finitions(), sec(footer(c))];
const savoir = (c) => [sec(header(c)), head("Savoir-faire", "Le geste de l'atelier", "De la forme en bois à la dernière cire."), gestes(), finitions(), sec(footer(c))];
const entretien = (c) => [sec(header(c)), head("Livraison · Entretien", "Livraison, retours et entretien", "Les conditions, sans astérisque."),
  sec(`<section class="ab-sec pk-bleed"><div class="ab-wrap ab-narrow ab-prose"><h2 class="ab-h2">Livraison</h2><p>Les frais et délais exacts sont calculés à la commande selon votre pays, par les méthodes de livraison réglées dans la boutique. Chaque paire voyage dans une boîte avec ses embauchoirs.</p><h2 class="ab-h2">Retours</h2><p>Une paire non gravée et non portée en extérieur peut être retournée dans le délai indiqué par l'atelier. Écrivez-nous depuis la page <a href="/contact">contact</a>. Une paire portant des initiales est fabriquée pour vous : les conditions sont précisées avant la commande.</p><h2 class="ab-h2">Entretien</h2><p>Embauchoirs en bois après chaque port, une journée de repos entre deux ports, brosse douce, cirage de la teinte choisie. La fiche de chaque finition indique le produit adapté.</p><h2 class="ab-h2">Paiement</h2><p>Le paiement se fait sur la page de commande de la boutique, avec les moyens activés par la maison.</p></div></section>`), sec(footer(c))];
const configurer = (c) => [sec(header(c)), head("Pour le vendeur", "Comment configurer ce thème", "Ce thème met en forme les briques du moteur ; c'est vous qui les réglez dans l'administration."),
  sec(`<section class="ab-sec pk-bleed"><div class="ab-wrap ab-narrow ab-prose"><h2 class="ab-h2">Rendez-vous d'essayage</h2><ol class="ab-steps"><li><div><b>Ouvrir l'onglet « Rendez-vous »</b><span>Dans les réglages, définissez les types (nom, durée, sur place ou visio, description), les disponibilités de la semaine, les exceptions, le pas, le délai minimum et l'horizon de réservation.</span></div></li><li><div><b>Activer la prise de rendez-vous</b><span>Tant qu'elle n'est pas ouverte avec au moins un type, la page publique indique que la prise de rendez-vous n'est pas ouverte.</span></div></li><li><div><b>Rattacher un produit</b><span>Le lien <code>/boutique/rendez-vous?produit=slug-du-produit</code> relie le rendez-vous à un modèle. Sur la fiche produit, le thème ajoute ce lien tout seul.</span></div></li></ol>
  <p class="ab-small">Limites du moteur : heure murale d'un seul fuseau, disponibilités communes à tous les types, pas de lien visio généré, pas de rappel automatique.</p>
  <h2 class="ab-h2">Finitions</h2><p>Dans la fiche produit de l'administration, créez un attribut « Finition » (Noir ciré, Cognac patiné, Havane brossé, Cordovan), puis ajoutez les combinaisons avec leur stock. Un attribut « Pointure » s'ajoute de la même façon. Le thème ne simule rien : le client choisit la variante dans la liste de la fiche.</p>
  <h2 class="ab-h2">Gravure d'initiales</h2><p>Sur le produit, activez la personnalisation : libellé, aide, longueur maximale, caractère obligatoire. Le texte est contrôlé côté serveur, conservé par ligne de panier, visible dans l'administration et dans l'e-mail. Le prix ne varie pas selon la personnalisation. Les produits personnalisables sont exclus des listes de cadeaux.</p>
  <h2 class="ab-h2">Autres briques mises en forme</h2><p>Avis vérifiés (modération dans l'onglet « Avis »), souhaits, comparateur de produits (4 au maximum), listes de cadeaux, accès membre et ventes privées : ces pages gardent l'identité du thème sans rien configurer de plus dans le thème.</p></div></section>`), sec(footer(c))];
const faq = (c) => [sec(header(c)), head("Questions", "Questions fréquentes", "Essayage, finitions, gravure."),
  sec(`<section class="ab-sec pk-bleed"><div class="ab-wrap ab-narrow"><details class="ab-q"><summary>Faut-il payer pour réserver un essayage ?</summary><p>Non. La prise de rendez-vous ne demande aucun paiement.</p></details><details class="ab-q"><summary>Puis-je annuler ou déplacer mon rendez-vous ?</summary><p>Oui : l'e-mail de confirmation contient un lien d'annulation. Pour déplacer, écrivez à l'atelier depuis la page contact.</p></details><details class="ab-q"><summary>La finition change-t-elle le prix ?</summary><p>Le prix est celui de la variante telle que l'atelier l'a réglé, affiché sur la fiche avant l'ajout au panier.</p></details><details class="ab-q"><summary>Combien de lettres puis-je faire graver ?</summary><p>La longueur maximale est réglée par produit et indiquée sur la fiche. Elle est vérifiée par le serveur à l'ajout au panier.</p></details><details class="ab-q"><summary>L'aperçu de patine est-il exact ?</summary><p>C'est une illustration. Les couleurs à l'écran diffèrent légèrement du cuir réel.</p></details></div></section>`), sec(footer(c))];
const contact = (c) => [sec(header(c)), head("Conseil", "Nous écrire", "Une question sur une forme, une finition, un rendez-vous."),
  { type: "form", heading: "Écrire à l'atelier", intro: "Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Chercher un modèle", "Un modèle, une finition, une pointure."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un modèle…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ab-ph pk-bleed"><div class="ab-wrap ab-narrow"><p class="ab-lab">Page introuvable</p><div class="ab-h1 ab-h1--xl" role="heading" aria-level="1">Trait de craie <em>effacé</em></div><p class="ab-lead">Cette page n'existe pas ou plus. <a href="/boutique">Retourner à la boutique</a>.</p></div></section>`), sec(footer(c))];

module.exports = {
  key: "atelier-botte", name: "Atelier Botte", version: "1.0.0", category: "luxe", tags: ["luxe", "classique", "chaleureux"], siteType: "Bottier sur mesure", featured: true,
  concept: "Le patron du bottier : papier kraft, trait de craie bleue, arches de forme en bois, perforations de richelieu, et une fiche d'essayage qui relie rendez-vous, finition et gravure.",
  description: "Bottier sur mesure : papier kraft, craie bleue, arches et perforations, fiche d'essayage reliant le vrai rendez-vous du moteur, les variantes de finition et la gravure d'initiales, avec guide de configuration pour le vendeur.",
  brand: "Atelier Botte", modules: ["formulaires", "recherche", "commerce"], shop: { card: "arche-de-forme-etiquette-de-pointure-perforations", gallery: "grande-image-arche-puis-details-de-finition", cart: "page-dediee-papier-kraft-filet-de-craie", catalog: "reglette-graduee-de-filtres-et-pastilles-de-finition" },
  dna: {
    header: "regle-graduee-logo-centre-rendez-vous-a-gauche-menu-sur-deuxieme-ligne", hero: "texte-a-gauche-gabarit-de-semelle-dans-une-arche-sombre", grid: "quatre-colonnes-cartes-en-arche", typo: "vidaloka-et-mukta",
    shapes: "arches-de-forme-et-rangees-de-perforations", motion: "trace-de-craie-et-patine-qui-vieillit", rhythm: "bandes-kraft-et-noir-vert-separees-par-perforations", signature: "fiche-d-essayage-rendez-vous-finition-et-gravure",
    palette: "kraft-cordovan-craie-bleue", image: "illustrations-svg-de-gabarit-et-de-soulier-sans-photo", list: "etiquettes-de-pointure-prix-sous-perforations",
    article: "colonne-etapes-a-la-craie-marge-gauche", sidebar: "aucune-colonne-de-gabarit-a-droite", reading: "mukta-17-px-mesure-62-caracteres",
  },
  tokens: {
    colors: { primary: "#5c2323", secondary: "#181c1b", accent: "#8fb8c6", background: "#e1dccf", surface: "#efebe0", text: "#211a17", muted: "#625a50", success: "#3f6b45", warning: "#8a6a2f", error: "#a23b34" },
    fonts: { heading: "font.vidaloka", body: "font.mukta", button: "font.mukta", link: "font.mukta" },
    radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#b9b09d" },
    type: { h1: { size: 58, weight: 400, lineHeight: 1.08, transform: "none" }, h2: { size: 34, weight: 400, lineHeight: 1.14, transform: "none" } },
  },
  options: [
    { key: "trace", label: "Couleur du trait de craie", type: "color", default: "#8fb8c6" },
    { key: "fond", label: "Fond des pages", type: "choice", default: "kraft", choices: [["kraft", "Kraft"], ["calque", "Calque clair"]] },
    { key: "regle", label: "Règle graduée de l'en-tête", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "annonce", label: "Bandeau d'annonce", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "arches", label: "Cartes et images", type: "choice", default: "arche", choices: [["arche", "En arche"], ["droit", "Droites"]] },
    { key: "perfo", label: "Perforations décoratives", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "patine", label: "Aperçu de la fiche d'essayage", type: "choice", default: "neuf", choices: [["neuf", "Commence neuf"], ["vieilli", "Commence vieilli"]] },
    { key: "rdv", label: "Bouton rendez-vous de l'en-tête", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Boutique", "/boutique"], ["Essayage", "/essayage"], ["Finitions", "/finitions"], ["Savoir-faire", "/savoir-faire"], ["Livraison", "/livraison"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "essayage", name: "Essayage et rendez-vous", render: essayage }, { key: "finitions", name: "Guide des finitions", render: finitionsPage },
    { key: "savoir-faire", name: "Savoir-faire", render: savoir }, { key: "livraison", name: "Livraison, retours et entretien", render: entretien }, { key: "configurer", name: "Comment configurer", render: configurer },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
