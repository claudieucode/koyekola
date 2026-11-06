// Berceau — famille et parentalité. Direction artistique : un mobile de chambre d'enfant. Menthe pâle, corail, jaune beurre ; galets aux angles inégaux, nuages, vagues douces, sept bulles d'âge qui
// forment une frise (grossesse, 0-12 mois, 1-3 ans, 3-6 ans, 6-11 ans, 11-15 ans, 15-18 ans). Rubriques par âge filtrables et listes à cocher (valise de maternité, trousse de secours, rentrée…) dont l'état est gardé
// dans le navigateur du visiteur (localStorage) : écrites dans les pages du thème, ce ne sont pas un type de contenu du CMS. Contenus fictifs et généraux, jamais un avis médical.
const { sec, esc, nav } = require("../kit");

/* ---------- Page « Blocs » et pages légales (communes aux 5 thèmes de ce lot, écrites avec le préfixe du thème) ---------- */
const svgDemo = (a, b, label) => `<svg viewBox="0 0 640 360" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="${a}"/><circle cx="470" cy="120" r="70" fill="${b}" opacity=".85"/><path d="M0 300C120 220 220 330 340 260S560 230 640 290V360H0Z" fill="${b}" opacity=".55"/><path d="M0 330C140 280 260 350 400 310S580 300 640 330V360H0Z" fill="#000" opacity=".12"/></svg>`;
function blocsPage(P, c, head, foot, lead, col) {
  return [head(c), lead, sec(`<div class="${P}-wrap ${P}-prose ${P}-blocs">
  <section class="${P}-bl"><h2>Titres et texte courant</h2>
    <p>Le texte courant garde une taille d'au moins 16 pixels sur téléphone et une ligne de 60 à 80 caractères sur ordinateur. Un paragraphe peut contenir un <a href="/blocs">lien souligné</a>, du <strong>texte en gras</strong>, de l'<em>italique</em>, un <mark>passage surligné</mark>, une touche <kbd>Ctrl</kbd> + <kbd>F</kbd>, une abréviation comme <abbr title="Taux annuel effectif global">TAEG</abbr> et une note<sup>1</sup>.</p>
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Le titre de niveau 1 est celui de la page, en haut : il n'y en a jamais qu'un seul.</p></section>
  <section class="${P}-bl"><h2>Listes</h2>
    <ul><li>Une liste à puces simple</li><li>Avec un deuxième élément<ul><li>et un niveau imbriqué</li></ul></li><li>Et un troisième</li></ul>
    <ol><li>Une liste numérotée</li><li>Les étapes se suivent</li><li>Le compteur reste lisible</li></ol>
    <dl><dt>Terme</dt><dd>Sa définition, en une ou deux phrases.</dd><dt>Autre terme</dt><dd>Une seconde définition.</dd></dl></section>
  <section class="${P}-bl"><h2>Citations</h2>
    <blockquote class="${P}-quote"><p>Une citation courte se lit mieux quand elle a de l'air autour d'elle.</p><cite>${col.cite}</cite></blockquote>
    <p class="${P}-pull">Une citation mise en exergue peut porter une idée forte de l'article.</p></section>
  <section class="${P}-bl"><h2>Images et légendes</h2>
    <figure class="${P}-fig">${svgDemo(col.a, col.b, "Illustration abstraite : un soleil et deux collines")}<figcaption>Illustration abstraite, sa légende en dessous. ${col.legend}</figcaption></figure>
    <div class="${P}-cols ${P}-cols--2"><figure class="${P}-fig">${svgDemo(col.b, col.a, "Illustration abstraite aux couleurs inversées")}<figcaption>Une image en colonne.</figcaption></figure><figure class="${P}-fig">${svgDemo(col.a, col.c, "Illustration abstraite, troisième variante")}<figcaption>Une deuxième image en colonne.</figcaption></figure></div></section>
  <section class="${P}-bl"><h2>Tableau</h2>
    <div class="${P}-tablewrap" role="region" aria-label="Tableau à faire défiler sur petit écran"><table class="${P}-table"><caption>${col.cap}</caption><thead><tr><th scope="col">Élément</th><th scope="col">Détail</th><th scope="col">Valeur</th><th scope="col">Remarque</th></tr></thead><tbody><tr><th scope="row">Premier</th><td>Une ligne d'exemple</td><td>12,50</td><td>Au-dessus de la moyenne</td></tr><tr><th scope="row">Deuxième</th><td>Une autre ligne</td><td>8,00</td><td>Stable</td></tr><tr><th scope="row">Troisième</th><td>Encore une ligne</td><td>21,90</td><td>À surveiller</td></tr></tbody></table></div></section>
  <section class="${P}-bl"><h2>Code</h2><p>Du code en ligne : <code>total = a + b</code>. Et un bloc :</p><pre class="${P}-code"><code>function total(a, b) {
  return a + b;
}
console.log(total(2, 3)); // 5</code></pre></section>
  <section class="${P}-bl"><h2>Boutons</h2><p class="${P}-btns"><a class="${P}-btn" href="/contact">Bouton principal</a><a class="${P}-btn ${P}-btn--alt" href="/recherche">Bouton secondaire</a><a class="${P}-btn ${P}-btn--ghost" href="/">Bouton discret</a></p></section>
  <section class="${P}-bl"><h2>Colonnes</h2><div class="${P}-cols ${P}-cols--3"><div class="${P}-col"><h3>Colonne un</h3><p>Trois colonnes sur ordinateur, une seule sur téléphone.</p></div><div class="${P}-col"><h3>Colonne deux</h3><p>Chaque colonne garde sa propre largeur de lecture.</p></div><div class="${P}-col"><h3>Colonne trois</h3><p>Les espaces restent réguliers d'une colonne à l'autre.</p></div></div></section>
  <section class="${P}-bl"><h2>Encadrés</h2>
    <aside class="${P}-callout ${P}-callout--info"><strong>À retenir</strong><p>${col.info}</p></aside>
    <aside class="${P}-callout ${P}-callout--warn"><strong>Attention</strong><p>${col.warn}</p></aside>
    <aside class="${P}-callout ${P}-callout--tip"><strong>Astuce</strong><p>${col.tip}</p></aside></section>
</div>`), foot(c)];
}
const LEGAL = {
  mentions: (b, e) => [
    ["Éditeur du site", `${b} est un site de démonstration créé avec Kolakisa. L'éditeur est une entité fictive : ${e}. Aucun service réel n'est proposé et aucun achat n'est possible.`],
    ["Directeur de la publication", "Le responsable de la publication est la personne qui administre ce site de démonstration. Elle peut être jointe grâce à la page Contact."],
    ["Hébergement", "Le site est hébergé par le prestataire choisi par son administrateur. Ses coordonnées doivent être indiquées ici lors de la mise en ligne réelle du site."],
    ["Propriété intellectuelle", "Les textes, illustrations et mises en page de ce thème de démonstration sont fournis à titre d'exemple. Les noms, personnes, chiffres et situations présentés sont fictifs."],
    ["Responsabilité", "Les informations sont données à titre indicatif et ne constituent pas un conseil personnalisé. Remplacez ce texte par vos mentions légales avant toute publication."],
  ],
  confidentialite: (b) => [
    ["Données que nous recevons", `Quand vous utilisez le formulaire de la page Contact, ${b} reçoit les informations que vous saisissez : nom, adresse électronique et message. Rien d'autre n'est demandé.`],
    ["À quoi elles servent", "Ces informations servent uniquement à répondre à votre message. Elles ne sont ni vendues, ni cédées, ni utilisées pour de la publicité."],
    ["Cookies et mesure d'audience", "Ce thème n'installe aucun cookie publicitaire. Les préférences d'affichage que vous réglez (par exemple une case cochée) restent dans votre navigateur et ne sont jamais envoyées au site."],
    ["Durée de conservation", "Les messages sont conservés le temps nécessaire pour y répondre, puis supprimés dans un délai de douze mois."],
    ["Vos droits", "Vous pouvez demander l'accès à vos données, leur correction ou leur suppression en écrivant depuis la page Contact. Vous pouvez aussi saisir la CNIL si vous estimez que vos droits ne sont pas respectés."],
  ],
};
function legalPage(P, kind, c, head, foot, lead, brand, editor) {
  const items = LEGAL[kind](brand, editor);
  return [head(c), lead, sec(`<div class="${P}-wrap ${P}-prose ${P}-legal">${items.map(([t, x], i) => `<section class="${P}-bl"><h2>${i + 1}. ${t}</h2><p>${x}</p></section>`).join("")}<p class="${P}-fine">Dernière mise à jour : 5 novembre 2026. Texte de démonstration, à adapter avant toute mise en ligne.</p></div>`), foot(c)];
}


/* ---------- Données : âges, rubriques, auteurs, articles (18), listes à cocher ---------- */
const AGES = [
  ["grossesse", "Grossesse", "Avant la naissance", "Préparer l'arrivée, se rassurer, s'organiser."],
  ["0-1", "0–12 mois", "Le nourrisson", "Sommeil, repas, premiers gestes : tout est nouveau, pour vous aussi."],
  ["1-3", "1–3 ans", "Les premiers pas", "Marcher, parler, dire non : l'âge des grandes découvertes."],
  ["3-6", "3–6 ans", "L'âge des questions", "Maternelle, imagination, copains : un monde qui s'élargit."],
  ["6-11", "6–11 ans", "L'école élémentaire", "Lire, compter, s'organiser, se faire des amis."],
  ["11-15", "11–15 ans", "Le collège", "Corps qui change, autonomie, premiers écrans."],
  ["15-18", "15–18 ans", "Vers l'âge adulte", "Orientation, confiance, lâcher prise des deux côtés."],
];
const AGE = Object.fromEntries(AGES.map((a) => [a[0], a]));
const CATS = { sommeil: "Sommeil", repas: "Repas", sante: "Santé", eveil: "Éveil et jeux", ecole: "École", emotions: "Émotions", famille: "Vie de famille" };
const AUTH = {
  helene: { n: "Hélène Marchetti", r: "Puéricultrice", i: "HM", b: "Vingt ans en maternité puis en protection maternelle et infantile. Elle écrit comme elle parle aux jeunes parents : posément." },
  samir: { n: "Samir Haddad", r: "Éducateur de jeunes enfants et père de trois enfants", i: "SH", b: "Travaille en crèche et à domicile. Aime les solutions simples qui tiennent le jeudi soir à 18 h 30." },
  louise: { n: "Louise Vanhove", r: "Psychologue de l'enfant", i: "LV", b: "Reçoit des familles et des écoles. Son principe : comprendre ce que l'enfant essaie de dire avant de corriger ce qu'il fait." },
  anais: { n: "Anaïs Perrin", r: "Pédiatre (personnage fictif)", i: "AP", b: "Relit les articles de santé du site. Rappelle toujours que seul votre médecin peut juger de la situation de votre enfant." },
};
// id, titre, rubrique, âges, auteur, date, minutes, extrait
const ART = [
  ["nuits", "Les nuits du nouveau-né : à quoi s'attendre vraiment", "sommeil", ["0-1"], "helene", "2026-10-30", 7, "Cycles courts, réveils fréquents, rythme qui se met en place peu à peu : ce qui est normal et ce qui mérite d'en parler."],
  ["valise", "Valise de maternité : l'essentiel, sans le superflu", "famille", ["grossesse"], "helene", "2026-10-27", 5, "Trois sacs plutôt qu'un, et une liste à cocher pour ne rien oublier le jour J."],
  ["diversification", "Diversification alimentaire : par où commencer ?", "repas", ["0-1"], "anais", "2026-10-23", 8, "Quand, quels aliments, quelle texture : un calendrier souple pour accompagner les premières cuillères."],
  ["opposition", "Dire non sans crier : comprendre la phase d'opposition", "emotions", ["1-3"], "louise", "2026-10-20", 6, "Quand tout devient « non », ce n'est pas un défi : c'est une façon de dire « je suis quelqu'un »."],
  ["pot", "Le pot : quand, comment, et pourquoi pas de pression", "eveil", ["1-3"], "samir", "2026-10-16", 6, "Les signes de disponibilité, le matériel utile et les accidents qui font partie du chemin."],
  ["maternelle", "Préparer la rentrée en maternelle sans stress", "ecole", ["3-6"], "louise", "2026-10-13", 8, "Visite de l'école, doudou, rituels du matin : un plan sur trois semaines, avec sa liste à cocher."],
  ["peurs", "Les peurs de la nuit : rassurer sans les entretenir", "sommeil", ["3-6"], "louise", "2026-10-09", 6, "Monstres, noir, bruits : comment écouter la peur sans la grossir."],
  ["dehors", "Jouer dehors, même quand il pleut", "eveil", ["3-6", "6-11"], "samir", "2026-10-06", 5, "Cinq idées de jeux qui ne coûtent rien et un équipement minimum pour sortir par tous les temps."],
  ["lecture", "Apprendre à lire : accompagner sans devenir maître d'école", "ecole", ["6-11"], "louise", "2026-10-02", 7, "Lire ensemble, laisser se tromper, féliciter l'effort : un rôle de parent différent de celui de l'enseignant."],
  ["devoirs", "Les devoirs du soir : une routine qui tient", "ecole", ["6-11"], "samir", "2026-09-29", 6, "Heure, lieu, goûter : trois repères qui évitent le bras de fer chaque soir."],
  ["ecrans", "Écrans : des règles que toute la famille peut suivre", "famille", ["6-11", "11-15"], "samir", "2026-09-25", 7, "Plutôt qu'une interdiction, un accord écrit, valable pour les enfants comme pour les adultes."],
  ["telephone", "Premier téléphone : quand et comment", "famille", ["11-15"], "louise", "2026-09-22", 8, "L'âge compte moins que la préparation : usages, limites, mots de passe et confiance."],
  ["college", "Entrée au collège : les inquiétudes de septembre", "ecole", ["11-15"], "louise", "2026-09-18", 7, "Casier, emploi du temps, nouveaux camarades : comment aider sans faire à la place."],
  ["ado-dialogue", "Garder le dialogue quand il ne répond que « rien »", "emotions", ["11-15", "15-18"], "louise", "2026-09-15", 7, "Les moments où un adolescent parle : en voiture, tard le soir, quand on ne le regarde pas."],
  ["orientation", "Orientation après la troisième : les questions à poser", "ecole", ["15-18"], "helene", "2026-09-11", 9, "Voie générale, technologique ou professionnelle : poser le cadre sans choisir à la place du jeune."],
  ["fievre", "Fièvre chez le tout-petit : les gestes qui rassurent", "sante", ["0-1", "1-3"], "anais", "2026-09-08", 6, "Mesurer, couvrir ou pas, surveiller, savoir quand appeler : une information générale, jamais un diagnostic."],
  ["creche", "Premier jour de crèche : la préparation en cinq étapes", "famille", ["0-1", "1-3"], "samir", "2026-09-04", 6, "Adaptation progressive, objets de transition, séparation sans drame ni culpabilité."],
  ["taches", "Partager les tâches à deux : le tableau qui évite les disputes", "famille", ["1-3", "3-6"], "samir", "2026-09-01", 6, "Rendre visible la charge mentale, répartir par domaines et non par tâches isolées."],
].map(([id, t, cat, ages, au, d, min, x]) => ({ id, t, cat, ages, au, d, min, x }));
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fr = (d) => { const [y, m, j] = d.split("-"); return `${Number(j)} ${MOIS[Number(m) - 1]} ${y}`; };
const LISTS = [
  ["valise", "Valise de maternité", "grossesse", ["Carte d'identité, carte vitale et dossier médical", "Carnet de santé et papiers de la maternité", "Chemises de nuit ou t-shirts amples, 3 ou 4", "Culottes jetables ou filets, produits d'hygiène", "Trousse de toilette et brosse à dents", "Chaussons et gilet chaud", "Tenue de sortie pour le bébé, 2 bodies, 1 pyjama", "Bonnet, chaussettes et gigoteuse de naissance", "Chargeur de téléphone et petits en-cas", "Siège auto installé et vérifié à l'avance"]],
  ["trousse", "Trousse de secours de la maison", "0-1", ["Thermomètre qui fonctionne, piles de rechange", "Sérum physiologique en unidoses", "Compresses stériles et pansements de plusieurs tailles", "Antiseptique sans alcool", "Ciseaux à bouts ronds et pince à épiler", "Crème pour le change", "Numéros d'urgence affichés près du téléphone", "Carnet de santé à portée de main", "Médicaments uniquement sur conseil du médecin ou du pharmacien"]],
  ["creche", "Premier jour de crèche", "1-3", ["Visite et rencontre avec l'équipe faites", "Carnet de vaccination à jour", "Doudou et tétine marqués au nom de l'enfant", "Vêtements de rechange, 2 jeux complets", "Couches et lingettes pour la semaine", "Biberons ou repas selon le règlement", "Fiche de contacts et personnes autorisées à venir chercher", "Horaires d'adaptation notés dans l'agenda", "Un mot de rituel pour la séparation : court, joyeux, identique chaque jour"]],
  ["maternelle", "Rentrée en maternelle", "3-6", ["Inscription et certificat de scolarité", "Visite de l'école avant la rentrée", "Cartable à sa taille, étiquettes au nom de l'enfant", "Vêtements faciles à enfiler seul", "Chaussons ou baskets à scratch", "Boîte de mouchoirs et change de rechange", "Rythme du coucher avancé deux semaines avant", "Attestation d'assurance scolaire", "Présentation de la maîtresse par un livre ou une photo", "Rituel du matin : le même chaque jour"]],
  ["sortie", "Voyage avec un jeune enfant", "1-3", ["Carte d'identité de l'enfant à jour", "Carnet de santé et ordonnances utiles", "Siège auto adapté ou réservation du siège sur place", "Doudou, tétine et livres préférés", "Couches et lingettes pour le trajet plus un jour", "Encas et boisson, sans sucre ajouté", "Petits jeux silencieux et nouveaux autocollants", "Vêtements de rechange dans le bagage à main", "Pauses prévues toutes les deux heures"]],
  ["anniversaire", "Anniversaire à la maison", "3-6", ["Liste des invités et invitations envoyées", "Date et heure qui ne gênent pas la sieste", "Trois jeux prévus, dont un en cas de pluie", "Gâteau, bougies et allumettes hors de portée", "Allergies et régimes des invités vérifiés", "Sacs de départ, un petit cadeau par enfant", "Un adulte pour dix enfants au maximum", "Photos prises avant la fatigue"]],
].map(([id, t, age, items]) => ({ id, t, age, items }));

/* ---------- Dessins ---------- */
const cloud = `<svg class="be-cloud" viewBox="0 0 64 44" aria-hidden="true" focusable="false"><path class="be-cloud-p" d="M16 38a12 12 0 0 1-1-24 14 14 0 0 1 27-3 11 11 0 0 1 8 21 8 8 0 0 1-3 6z"/><circle class="be-cloud-e" cx="26" cy="26" r="1.8"/><circle class="be-cloud-e" cx="38" cy="26" r="1.8"/><path class="be-cloud-m" d="M29 31c2 2 4 2 6 0"/></svg>`;
const ICON = {
  grossesse: `<circle cx="20" cy="14" r="6"/><path d="M12 38c0-9 3-14 8-14s10 5 10 12c0 3-2 5-5 5"/>`,
  "0-1": `<path d="M26 8a14 14 0 1 0 8 24A12 12 0 0 1 26 8z"/><circle cx="31" cy="12" r="1.5"/>`,
  "1-3": `<rect x="6" y="22" width="12" height="12"/><rect x="20" y="22" width="12" height="12"/><rect x="13" y="9" width="12" height="12"/>`,
  "3-6": `<path d="M10 32l16-20 6 5-16 20-8 3z"/><path d="M26 12l6 5"/>`,
  "6-11": `<path d="M8 10h12c3 0 4 2 4 4v20c0-2-1-4-4-4H8z"/><path d="M32 10H20c-3 0-4 2-4 4v20c0-2 1-4 4-4h12z" transform="translate(4 0)"/>`,
  "11-15": `<rect x="12" y="6" width="18" height="30" rx="4"/><path d="M19 31h4"/>`,
  "15-18": `<circle cx="21" cy="21" r="14"/><path d="M27 15l-4 10-8 3 4-10z"/>`,
};
const ageIcon = (k) => `<svg class="be-ic" viewBox="0 0 42 42" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
const arrow = `<svg class="be-arr" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const wave = (cls) => `<svg class="be-wave ${cls || ""}" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 30C150 70 300 -10 450 25S750 70 900 30s220-30 300 5V60H0z"/></svg>`;
const NOTE = { pro: "Mot de pro", faire: "À faire ce week-end", doc: "Quand en parler au médecin", idee: "Une idée simple" };
const note = (k, html) => `<aside class="be-note be-note--${k}"><p class="be-note-k">${NOTE[k]}</p>${html}</aside>`;

/* ---------- Structure commune ---------- */
const header = (c) => sec(`<header class="be-head pk-bleed"><div class="be-wrap be-bar"><a class="be-logo" href="/" aria-label="${esc(c.brand)} : accueil">${cloud}<span>Berceau<small>le magazine des familles</small></span></a>
  <div class="be-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <details class="be-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="be-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}</div></details></div></header>`);
const footer = (c) => sec(`<footer class="be-foot pk-bleed">${wave("be-wave--foot")}<div class="be-foot-bg"><div class="be-wrap be-foot-in"><div class="be-foot-lead">${cloud}<p class="be-foot-q">Grandir ensemble, un jour après l'autre.</p><p class="be-fine">Berceau est un site de démonstration. Les articles sont généraux et fictifs : ils ne remplacent ni un médecin, ni un professionnel de la petite enfance.</p></div>
  <div class="be-foot-col"><h2>Par âge</h2>${AGES.slice(0, 4).map((a) => `<a class="be-fl" href="/ages">${a[1]}</a>`).join("")}</div><div class="be-foot-col"><h2>Lire et cocher</h2>${nav(c.menu.slice(1, 4), "be-fl")}</div>
  <div class="be-foot-col"><h2>Le site</h2><a class="be-fl" href="/contact">Contact</a><a class="be-fl" href="/recherche">Recherche</a><a class="be-fl" href="/blocs">Blocs de mise en page</a><a class="be-fl" href="/mentions-legales">Mentions légales</a><a class="be-fl" href="/confidentialite">Confidentialité</a></div></div>
  <div class="be-wrap be-foot-end"><p>© 2026 Berceau, site de démonstration.</p><p>En cas d'urgence pour un enfant, appelez le 15 ou le 112.</p></div></div></footer>`);
const pagehead = (kick, title, sub) => sec(`<section class="be-ph pk-bleed"><div class="be-wrap be-ph-in"><p class="be-kick">${esc(kick)}</p><div class="be-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="be-sub">${esc(sub)}</p>` : ""}</div>${wave("be-wave--ph")}</section>`);

const card = (a, i) => `<li class="be-item" data-cat="${a.cat}" data-ages="${a.ages.join(" ")}" data-q="${esc((a.t + " " + a.x + " " + CATS[a.cat] + " " + a.ages.map((k) => AGE[k][1]).join(" ") + " " + AUTH[a.au].n).toLowerCase())}"><article class="be-card be-card--${a.ages[0].replace(/[^a-z0-9]/g, "")} be-r${i % 4}"><p class="be-card-top"><span class="be-badge">${ageIcon(a.ages[0])}${a.ages.map((k) => AGE[k][1]).join(" · ")}</span><span class="be-cat">${CATS[a.cat]}</span></p><h3 class="be-card-t"><a href="/article">${esc(a.t)}</a></h3><p class="be-card-x">${esc(a.x)}</p><p class="be-card-f"><span>${AUTH[a.au].n}</span><time datetime="${a.d}">${fr(a.d)}</time><span>${a.min} min</span></p></article></li>`;
const cards = (arr, extra = "") => `<ul class="be-cards ${extra}" data-be-list>${arr.map(card).join("")}</ul>`;
const frise = (link) => `<ul class="be-frise" data-be-ages aria-label="Choisir l'âge de votre enfant">${AGES.map((a, i) => `<li class="be-fr be-fr--${i}"><a href="${link ? "/ages#age-" + a[0] : "/articles?age=" + a[0]}" data-age="${a[0]}"><span class="be-bub">${ageIcon(a[0])}</span><b>${a[1]}</b><small>${a[2]}</small></a></li>`).join("")}</ul>`;
const checklist = (L, open) => `<section class="be-ck" data-be-ck="${L.id}"><div class="be-ck-hd"><p class="be-ck-age">${AGE[L.age][1]}</p><h2 class="be-h3">${L.t}</h2><p class="be-ck-prog" aria-live="polite"><b data-p>0</b> sur ${L.items.length} cochés</p><div class="be-bar2" aria-hidden="true"><i></i></div></div><ul class="be-ck-list">${L.items.map((x) => `<li data-ck>${x}</li>`).join("")}</ul><p class="be-ck-act" data-be-act><span class="be-fine">Sans JavaScript, la liste reste lisible mais ne peut pas être cochée.</span></p></section>`;

/* ---------- Accueil ---------- */
const home = (c) => [header(c),
  sec(`<section class="be-hero pk-bleed"><div class="be-wrap be-hero-in"><div class="be-hero-tx"><p class="be-kick">Magazine des familles</p><div class="be-h1" role="heading" aria-level="1">Chaque âge a ses questions. <em>Voici des réponses calmes.</em></div><p class="be-lead">Des articles écrits par des professionnels de l'enfance et des parents, classés par âge, et des listes à cocher pour ne rien oublier : valise, rentrée, voyage.</p></div>
    <div class="be-hero-art" aria-hidden="true"><svg viewBox="0 0 320 300" focusable="false"><path class="be-mob" d="M160 8v60M60 68h200"/><g class="be-sw be-sw1"><path class="be-mob" d="M80 68v50"/><circle class="be-bl be-bl1" cx="80" cy="140" r="26"/></g><g class="be-sw be-sw2"><path class="be-mob" d="M160 68v90"/><circle class="be-bl be-bl2" cx="160" cy="190" r="34"/></g><g class="be-sw be-sw3"><path class="be-mob" d="M240 68v70"/><circle class="be-bl be-bl3" cx="240" cy="162" r="28"/></g><path class="be-mob" d="M60 68v20M260 68v12"/></svg></div></div>
    <div class="be-wrap be-hero-fr"><p class="be-fr-t">Quel âge a votre enfant ?</p>${frise(false)}</div>${wave("be-wave--hero")}</section>`),
  sec(`<section class="be-sec be-sec--now pk-bleed"><div class="be-wrap"><div class="be-sechead"><div><p class="be-kick">À lire en ce moment</p><h2 class="be-h2" data-be-now>Les derniers articles</h2></div><a class="be-more" href="/articles">Tous les articles ${arrow}</a></div>${cards(ART, "be-cards--home")}<p class="be-empty" data-be-empty hidden>Aucun article pour cet âge pour l'instant. <a href="/articles">Voir tous les articles</a>.</p></div></section>`),
  sec(`<section class="be-sec be-sec--ck pk-bleed">${wave("be-wave--ck")}<div class="be-ck-bg"><div class="be-wrap"><div class="be-sechead"><div><p class="be-kick">Listes à cocher</p><h2 class="be-h2">Pour ne rien oublier</h2></div><a class="be-more" href="/listes">Toutes les listes ${arrow}</a></div><ul class="be-lcards">${LISTS.slice(0, 3).map((L) => `<li><a class="be-lc" href="/listes"><span class="be-lc-n">${L.items.length}<small>points</small></span><span class="be-lc-t">${L.t}</span><span class="be-lc-a">${AGE[L.age][1]}</span></a></li>`).join("")}</ul></div></div></section>`),
  sec(`<section class="be-sec be-sec--voix pk-bleed"><div class="be-wrap"><div class="be-sechead"><div><p class="be-kick">Ils en parlent</p><h2 class="be-h2">Des parents, des vraies journées</h2></div></div><div class="be-voix">
    <blockquote class="be-q be-q--a"><p>La liste de la rentrée m'a évité trois allers-retours au magasin. Et ma fille a coché la moitié toute seule.</p><cite>Sonia, maman de Lina, 4 ans</cite></blockquote>
    <blockquote class="be-q be-q--b"><p>L'article sur les devoirs a changé nos soirées : une heure fixe, un goûter, et c'est réglé.</p><cite>Marc, papa de Jules, 8 ans</cite></blockquote>
    <blockquote class="be-q be-q--c"><p>Lire que mon fils de deux ans n'était pas « en crise » m'a fait un bien fou.</p><cite>Aïcha, maman de Noé</cite></blockquote></div></div></section>`),
  sec(`<section class="be-sec be-sec--auth pk-bleed"><div class="be-wrap"><div class="be-sechead"><div><p class="be-kick">L'équipe</p><h2 class="be-h2">Qui écrit ici ?</h2></div></div><ul class="be-auths">${Object.values(AUTH).map((a) => `<li class="be-au"><span class="be-av" aria-hidden="true">${a.i}</span><div><p class="be-au-n">${a.n}</p><p class="be-au-r">${a.r}</p></div></li>`).join("")}</ul></div></section>`),
  footer(c)];

/* ---------- Articles ---------- */
const articles = (c) => [header(c), pagehead("Tous les articles", "Dix-huit articles pour chaque âge", "Choisissez un âge, une rubrique, ou tapez un mot."),
  sec(`<section class="be-sec be-sec--arch pk-bleed"><div class="be-wrap"><h2 class="be-sr">Liste des articles</h2><div class="be-tools" data-be-tools><p class="be-tools-n" role="status" aria-live="polite"><b data-be-n>${ART.length}</b> articles affichés</p>
    <ul class="be-chips" aria-label="Filtrer par âge"><li><a href="/articles" data-age="tous" aria-current="true">Tous les âges</a></li>${AGES.map((a) => `<li><a href="/articles" data-age="${a[0]}">${a[1]}</a></li>`).join("")}</ul>
    <ul class="be-chips be-chips--cat" aria-label="Filtrer par rubrique"><li><a href="/articles" data-cat="tous" aria-current="true">Toutes les rubriques</a></li>${Object.entries(CATS).map(([k, v]) => `<li><a href="/articles" data-cat="${k}">${v}</a></li>`).join("")}</ul></div>
    ${cards(ART)}<div class="be-emptybox" data-be-empty hidden><p class="be-empty-t">Aucun article ne correspond.</p><p>Essayez un autre âge, une autre rubrique, ou <a href="/articles">repartez de la liste complète</a>.</p></div></div></section>`),
  footer(c)];

/* ---------- Article ---------- */
const A0 = ART[5], L0 = LISTS[3];
const article = (c) => [header(c),
  sec(`<section class="be-arh pk-bleed"><div class="be-wrap be-arh-in"><p class="be-crumb"><a href="/">Accueil</a> / <a href="/articles">Articles</a> / ${AGE["3-6"][1]}</p><p class="be-card-top"><span class="be-badge">${ageIcon("3-6")}${AGE["3-6"][1]}</span><span class="be-cat">${CATS.ecole}</span><time datetime="${A0.d}">${fr(A0.d)}</time><span>${A0.min} min de lecture</span></p>
    <div class="be-h1 be-h1--art" role="heading" aria-level="1">${esc(A0.t)}</div><p class="be-sub">${esc(A0.x)}</p><p class="be-by"><span class="be-av" aria-hidden="true">LV</span><span>Par <b>${AUTH.louise.n}</b>, ${AUTH.louise.r.toLowerCase()}</span></p></div>${wave("be-wave--ph")}</section>`),
  sec(`<div class="be-wrap be-art"><div class="be-prose be-body"><p class="be-chapo">La rentrée en petite section est une étape pour toute la famille. Le plus utile n'est pas d'avoir tout prévu, c'est de rendre les trois premières semaines prévisibles pour votre enfant.</p>
    <h2 data-anchor="avant">Trois semaines avant : apprivoiser le lieu</h2><p>Passez devant l'école en vous promenant, nommez ce que vous voyez : le portail, la cour, l'arbre. Si l'établissement propose une visite, profitez-en pour regarder le lieu du coucher, les toilettes et le porte-manteau avec votre enfant.</p>
    ${note("pro", "<p>Les enfants se rassurent avec ce qu'ils peuvent répéter. Dites-leur chaque soir la même phrase : « Demain, on ira à l'école, et je viendrai te chercher après la sieste. »</p>")}
    <h2 data-anchor="rythme">Deux semaines avant : le rythme</h2><p>Avancez doucement le coucher et le réveil, par paliers de quinze minutes. Servez le petit-déjeuner à l'heure où il sera pris les jours d'école. Habillez votre enfant seul quelques matins : vêtements faciles, chaussures à scratch.</p>
    <ul><li><strong>Le doudou</strong> a le droit de venir : marquez son nom discrètement.</li><li><strong>Les rituels</strong> comptent plus que les cadeaux : un câlin, un mot, un geste de la main.</li><li><strong>Les larmes</strong> à la séparation sont fréquentes et passent souvent en quelques minutes.</li></ul>
    <h2 data-anchor="liste">Une liste à cocher pour la semaine</h2><p>Voici la liste de la page « Listes » ; cochez-la ici, elle se souviendra de vous sur cet appareil.</p>${checklist(L0)}
    ${note("faire", "<p>Samedi matin, allez ensemble acheter une boîte de mouchoirs et des étiquettes. Laissez-le coller la première sur son cartable.</p>")}
    <h2 data-anchor="jour">Le jour J</h2><p>Arrivez sans courir, quittez la classe sans vous attarder, sans vous éclipser non plus. Un au revoir clair vaut mieux qu'un départ en cachette. Dites que vous reviendrez et tenez parole.</p>
    <blockquote class="be-quote"><p>Un enfant n'a pas besoin que le départ soit sans larmes. Il a besoin qu'il soit prévisible et que l'adulte qui revient soit celui qui l'a promis.</p><cite>Louise Vanhove</cite></blockquote>
    ${note("doc", "<p>Si votre enfant refuse durablement de manger, de dormir ou de jouer plusieurs semaines après la rentrée, parlez-en à son médecin ou à l'équipe de l'école. Ce site ne remplace pas un avis médical.</p>")}
    <div class="be-tablewrap" role="region" aria-label="Tableau du plan sur trois semaines, à faire défiler sur petit écran"><table class="be-table"><caption>Le plan des trois semaines</caption><thead><tr><th scope="col">Semaine</th><th scope="col">Ce qu'on fait</th><th scope="col">Durée par jour</th></tr></thead><tbody><tr><th scope="row">Avant la rentrée</th><td>Visite, livres sur l'école, vêtements</td><td>10 min</td></tr><tr><th scope="row">Semaine 1</th><td>Matinées seulement, retour après le déjeuner</td><td>3 h</td></tr><tr><th scope="row">Semaine 2</th><td>Déjeuner à l'école, retour avant la sieste</td><td>5 h</td></tr><tr><th scope="row">Semaine 3</th><td>Journée complète si votre enfant est prêt</td><td>6 à 8 h</td></tr></tbody></table></div>
    <div class="be-author"><span class="be-av be-av--l" aria-hidden="true">LV</span><div><p class="be-au-n">${AUTH.louise.n}</p><p class="be-au-r">${AUTH.louise.r}</p><p>${AUTH.louise.b}</p></div></div></div>
    <aside class="be-side" aria-label="Fiche pratique"><div class="be-side-in"><p class="be-side-t">Fiche pratique</p><dl><div><dt>Âge</dt><dd>${AGE["3-6"][1]}</dd></div><div><dt>Préparation</dt><dd>3 semaines</dd></div><div><dt>Liste à cocher</dt><dd>10 points</dd></div><div><dt>Temps de lecture</dt><dd>${A0.min} minutes</dd></div></dl><p class="be-side-l">Dans cet article</p><ol><li><a href="#avant">Apprivoiser le lieu</a></li><li><a href="#rythme">Le rythme</a></li><li><a href="#liste">La liste à cocher</a></li><li><a href="#jour">Le jour J</a></li></ol></div></aside></div>`),
  sec(`<section class="be-sec be-sec--rel pk-bleed"><div class="be-wrap"><div class="be-sechead"><div><p class="be-kick">À lire ensuite</p><h2 class="be-h2">Pour la même tranche d'âge</h2></div></div>${cards([ART[6], ART[7], ART[17]], "be-cards--row")}</div></section>`),
  footer(c)];

/* ---------- Rubriques par âge ---------- */
const ages = (c) => [header(c), pagehead("Rubriques par âge", "Sept âges, sept façons de grandir", "Pour chaque étape : ce qui change, les articles à lire et les listes à cocher."),
  sec(`<section class="be-sec be-sec--ages pk-bleed"><div class="be-wrap be-agesgrid"><div class="be-agenav" role="navigation" aria-label="Aller à un âge"><p class="be-side-t">Aller à</p>${AGES.map((a) => `<a href="#age-${a[0]}">${a[1]}</a>`).join("")}</div>
    <div class="be-agelist">${AGES.map((a, i) => `<article class="be-age be-age--${i}" data-anchor="age-${a[0]}"><div class="be-age-hd"><span class="be-bub be-bub--l">${ageIcon(a[0])}</span><div><p class="be-age-k">${a[2]}</p><h2 class="be-h2">${a[1]}</h2></div></div><p class="be-lead2">${a[3]}</p>
      <div class="be-age-cols"><div><h3 class="be-h4">À lire</h3><ul class="be-age-ul">${ART.filter((x) => x.ages.includes(a[0])).slice(0, 3).map((x) => `<li><a href="/article">${esc(x.t)}</a></li>`).join("") || `<li>Bientôt de nouveaux articles.</li>`}</ul></div>
      <div><h3 class="be-h4">À cocher</h3><ul class="be-age-ul">${LISTS.filter((L) => L.age === a[0]).map((L) => `<li><a href="/listes">${L.t}</a></li>`).join("") || `<li>Pas de liste pour cet âge pour l'instant.</li>`}</ul></div></div></article>`).join("")}</div></div></section>`),
  footer(c)];

/* ---------- Listes à cocher ---------- */
const listes = (c) => [header(c), pagehead("Listes à cocher", "Six listes pour ne rien oublier", "Cochez au fil de l'eau : votre progression est gardée sur cet appareil, et nulle part ailleurs."),
  sec(`<section class="be-sec be-sec--lists pk-bleed"><div class="be-wrap"><div class="be-tools"><p class="be-tools-n">Les listes se cochent d'un clic ou d'une pression sur la barre d'espace. Vous pouvez les imprimer.</p><p class="be-reset-all" data-be-resetall></p></div><div class="be-ckgrid">${LISTS.map((L) => checklist(L)).join("")}</div></div></section>`),
  footer(c)];

/* ---------- Contact, recherche, introuvable, blocs, légales ---------- */
const contact = (c) => [header(c), pagehead("Contact", "Une question, une idée de sujet ?", "L'équipe répond sous cinq jours ouvrés. Elle ne pose pas de diagnostic."),
  sec(`<section class="be-info pk-bleed"><div class="be-wrap be-info-in"><div class="be-box be-box--a"><h2 class="be-h3">Écrire à la rédaction</h2><p>Proposez un sujet, signalez une erreur ou racontez ce qui a marché chez vous.</p></div><div class="be-box be-box--b"><h2 class="be-h3">Ce que nous ne faisons pas</h2><p>Nous ne répondons pas aux questions médicales ni aux situations individuelles. Pour cela, appelez votre médecin, la PMI ou le 15 en cas d'urgence.</p></div><div class="be-box be-box--c"><h2 class="be-h3">Presse</h2><p>Indiquez simplement votre média dans le message.</p></div></div></section>`),
  { type: "form", heading: "Envoyer un message", intro: "Ne donnez pas le nom complet ni la date de naissance de votre enfant : les prénoms d'emprunt suffisent." }, footer(c)];
const recherche = (c) => [header(c), pagehead("Recherche", "Chercher un sujet, un âge, une liste", "Un mot suffit : sommeil, rentrée, fièvre, écrans."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un article, une liste…" } }] },
  sec(`<section class="be-sec pk-bleed"><div class="be-wrap"><div class="be-emptybox be-emptybox--static"><p class="be-empty-t">Aucun résultat ?</p><p>Essayez un mot plus court ou choisissez un âge. Chaque tranche d'âge a sa page.</p><ul class="be-chips">${AGES.map((a) => `<li><a href="/ages">${a[1]}</a></li>`).join("")}<li><a href="/listes">Listes à cocher</a></li></ul></div></div></section>`), footer(c)];
const introuvable = (c) => [header(c), sec(`<section class="be-404 pk-bleed"><div class="be-wrap be-404-in"><div class="be-404-art" aria-hidden="true">${cloud}</div><p class="be-kick">Erreur 404</p><div class="be-h1" role="heading" aria-level="1">Oups, cette page s'est endormie.</div><p class="be-sub">Elle a changé d'adresse ou n'a jamais existé. Rien de grave : voici un chemin pour revenir.</p><p class="be-cta"><a class="be-btn" href="/">Retour à l'accueil</a><a class="be-btn be-btn--alt" href="/articles">Parcourir les articles</a></p></div></section>`), footer(c)];
const blocs = (c) => blocsPage("be", c, header, footer, pagehead("Blocs de mise en page", "Tous les éléments d'un article, sur une page", "Titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés."), { cite: "Hélène Marchetti", a: "#d8efe0", b: "#c4503a", c: "#f2b84b", legend: "Un visuel peut illustrer un article sur la famille.", cap: "Tableau d'exemple : quatre colonnes", info: "Un encadré « Mot de pro » donne l'avis d'un professionnel de l'enfance.", warn: "Un encadré « Quand en parler au médecin » rappelle les limites du site.", tip: "Un encadré « Une idée simple » propose un geste concret." });
const legal = (kind, title, kick, sub) => (c) => legalPage("be", kind, c, header, footer, pagehead(kick, title, sub), "Berceau", "Atelier Berceau SAS (société fictive), 8 rue des Marronniers, 69000 Lyon");

module.exports = {
  key: "berceau", name: "Berceau", version: "1.0.0", category: "sante", collection: "blog", tags: ["chaleureux", "ludique", "naturel"], siteType: "Magazine famille et parentalité par âge, avec listes à cocher", featured: false,
  concept: "Un mobile de chambre d'enfant : sept bulles d'âge en frise, des galets aux angles inégaux, des nuages et des vagues douces, des listes à cocher qui se souviennent de vous.",
  description: "Magazine famille et parentalité : menthe pâle, corail et jaune beurre, frise de sept âges, dix-huit articles factices filtrables par âge et rubrique, six listes à cocher mémorisées dans le navigateur, fiches pratiques.",
  brand: "Berceau",
  modules: ["formulaires", "recherche", "blog"],
  declare: "Les 18 articles, les rubriques par âge et les 6 listes à cocher sont écrits dans les pages du thème ; la mémorisation des cases (localStorage) et les filtres sont dans motion.js. Ce ne sont pas un type de contenu du CMS ; aucune coche n'est envoyée au serveur.",
  dna: {
    header: "logo-de-nuage-centre-puis-navigation-en-pilules-colorees",
    hero: "mobile-de-chambre-d-enfant-et-frise-de-sept-bulles-d-age-cliquables",
    grid: "galets-aux-angles-inegaux-teintes-par-tranche-d-age",
    typo: "arrondie-fredoka-et-kumbh-sans-grande-lisibilite",
    shapes: "nuages-galets-vagues-douces-et-bulles-rondes",
    motion: "balancement-lent-du-mobile-et-bulles-qui-se-soulevent",
    rhythm: "bandes-separees-par-des-vagues-fond-menthe-et-creme",
    signature: "rubriques-par-age-filtrables-et-listes-a-cocher-memorisees",
    palette: "menthe-pale-corail-jaune-beurre-et-teal-profond",
    image: "pictogrammes-d-age-en-trait-et-formes-douces-sans-photo",
    list: "galets-ou-frise-verticale-par-age-ou-lignes-compactes",
    article: "colonne-douce-avec-fiche-pratique-laterale-et-liste-a-cocher-integree",
    sidebar: "fiche-pratique-a-droite-age-duree-liste-et-sommaire",
    reading: "corps-18-px-interligne-1-75-encadres-mot-de-pro-et-quand-consulter",
  },
  tokens: {
    colors: { primary: "#c4503a", secondary: "#2f5d62", accent: "#8a5a00", background: "#eef6f4", surface: "#ffffff", text: "#27363a", muted: "#4a5f63", success: "#2f7a52", warning: "#9a6200", error: "#a3302a" },
    fonts: { heading: "font.fredoka", body: "font.kumbh-sans", button: "font.fredoka", link: "font.kumbh-sans" },
    radius: { sm: 10, md: 18, lg: 28, button: 99, field: 14, card: 24 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#cfe3de" },
    type: { h1: { size: 54, weight: 600, lineHeight: 1.12, transform: "none" }, h2: { size: 34, weight: 600, lineHeight: 1.18, transform: "none" } },
  },
  options: [
    { key: "corail", label: "Corail des boutons et des accents", type: "color", default: "#c4503a" },
    { key: "entete", label: "Style de l'en-tête", type: "choice", default: "pilules", choices: [["pilules", "Logo centré, navigation en pilules"], ["barre", "Logo à gauche, navigation à droite"], ["nuage", "Navigation dans une capsule douce"]] },
    { key: "pied", label: "Style du pied de page", type: "choice", default: "vague", choices: [["vague", "Vague et trois colonnes"], ["simple", "Une seule ligne, sans vague"]] },
    { key: "liste", label: "Présentation des listes d'articles", type: "choice", default: "galets", choices: [["galets", "Galets colorés"], ["fil", "Fil vertical par âge"], ["lignes", "Lignes compactes"]] },
    { key: "article", label: "Mise en page des articles", type: "choice", default: "guide", choices: [["guide", "Avec fiche pratique à droite"], ["serein", "Colonne seule, sans fiche"]] },
    { key: "sombre", label: "Mode sombre", type: "choice", default: "non", choices: [["non", "Menthe claire"], ["oui", "Veilleuse (sombre)"]] },
  ],
  menu: [["Accueil", "/"], ["Articles", "/articles"], ["Par âge", "/ages"], ["Listes à cocher", "/listes"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "articles", name: "Articles", render: articles }, { key: "article", name: "Article", render: article },
    { key: "ages", name: "Rubriques par âge", render: ages }, { key: "listes", name: "Listes à cocher", render: listes }, { key: "blocs", name: "Blocs", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: legal("mentions", "Mentions légales", "Informations légales", "Qui édite ce site, qui l'héberge, et ce qu'il faut savoir avant de le copier.") },
    { key: "confidentialite", name: "Confidentialité", render: legal("confidentialite", "Politique de confidentialité", "Vos données", "Ce que reçoit le site, à quoi cela sert, et comment exercer vos droits.") },
  ],
};
