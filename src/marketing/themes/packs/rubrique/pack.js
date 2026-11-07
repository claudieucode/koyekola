// Rubrique — blog magazine multi-catégories. Direction artistique : la maquette d'un hebdomadaire imprimé. Papier crème, encre noire, manchette à double filet, une couleur de rubrique
// (société, culture, cuisine, voyage, idées) qui teinte les filets, les pastilles et les illustrations géométriques dessinées en SVG. Une à trois colonnes, « les plus lus » numérotés,
// archives par mois. Les 16 articles de démonstration sont définis ici (données du thème) ; la page « article » les affiche réellement à partir de l'ancre (#a1 … #a16).
const { sec, esc, nav } = require("../kit");

/* ---------- Données : rubriques, auteurs, articles ---------- */
const RUB = {
  soc: { n: "Société", c: "#b42318", t: "#fde8e6", d: "Enquêtes, vie locale et débats qui nous concernent tous." },
  cul: { n: "Culture", c: "#6d3fc0", t: "#efe8fb", d: "Livres, disques, expositions : ce qui mérite votre soirée." },
  cui: { n: "Cuisine", c: "#b45309", t: "#fcefdc", d: "Recettes de saison, gestes de base et courses raisonnées." },
  voy: { n: "Voyage", c: "#0e7490", t: "#def3f8", d: "Récits de route, itinéraires lents et adresses vérifiées." },
  ide: { n: "Idées", c: "#4d7c0f", t: "#ecf5da", d: "Points de vue, essais courts et expériences du quotidien." },
};
const RK = Object.keys(RUB);
const AUT = {
  cm: { n: "Claire Maurel", r: "Rédactrice en chef", b: "Ancienne journaliste de presse régionale, elle dirige la rédaction et signe les enquêtes de société." },
  ib: { n: "Idriss Benali", r: "Reporter", b: "Il couvre la vie locale, les transports et le logement, carnet à la main et sans prétention." },
  hv: { n: "Hélène Vasseur", r: "Critique culture", b: "Libraire pendant quinze ans, elle chronique livres, disques et expositions." },
  tl: { n: "Thomas Lefèvre", r: "Voyageur et photographe", b: "Il voyage lentement, en train de préférence, et rapporte des itinéraires que l'on peut refaire." },
  nr: { n: "Nadia Roussel", r: "Cuisinière et autrice", b: "Cheffe de cuisine devenue autrice, elle écrit des recettes courtes qui marchent du premier coup." },
};
// [id, rubrique, titre, chapô, auteur, date, minutes, lectures, étiquettes, 3 paragraphes]
const ART = [
  [1, "soc", "Les bibliothèques de quartier rouvrent le dimanche", "Après dix ans de portes closes, trois bibliothèques de la métropole ouvrent à nouveau le dernier jour de la semaine. Premier bilan.", "ib", "2026-11-03", 6, 4120, ["vie locale", "lecture publique"], ["Il est dix heures, un dimanche, et la file s'allonge devant la médiathèque Jean-Moulin. Des familles, des étudiants, quelques retraités qui ont gardé l'habitude de venir tôt. La mairie a financé trois postes supplémentaires pour tenir ces ouvertures.", "Les chiffres du premier mois sont encourageants : 1 800 entrées chaque dimanche, dont près de la moitié de nouveaux inscrits. Les emprunts, eux, progressent moins vite que la fréquentation. On vient d'abord pour s'asseoir, travailler, lire sur place.", "Reste la question des moyens. Les équipes réclament une prime et un second agent d'accueil. La municipalité promet de trancher au prochain budget, en décembre, après un bilan complet de l'expérience."]],
  [2, "soc", "Quatre jours par semaine : ce que disent les premières entreprises", "Une dizaine de PME ont testé la semaine de quatre jours pendant un an. Les résultats sont moins spectaculaires qu'annoncé, et plus utiles.", "cm", "2026-10-30", 8, 6870, ["travail", "entreprises"], ["Dans l'atelier de menuiserie de Pierre Gaudin, le vendredi est devenu un jour de fermeture. Douze salariés, la même paie, trente-deux heures au lieu de trente-cinq. Un an plus tard, le chiffre d'affaires n'a pas bougé, mais les arrêts maladie ont diminué d'un tiers.", "Toutes les entreprises ne racontent pas la même histoire. Dans un centre d'appels voisin, la compression des horaires a fatigué les équipes et l'expérience s'est arrêtée après six mois. Le secteur, la taille et la façon d'organiser les remplacements font toute la différence.", "Les économistes consultés restent prudents. Ils rappellent que les entreprises volontaires ne ressemblent pas à la moyenne, et qu'un test réussi ne vaut pas règle générale. Il dit surtout qu'on peut essayer, mesurer, puis décider."]],
  [3, "soc", "Covoiturer au quotidien : le pari des villes moyennes", "Parkings dédiés, voies réservées, application locale : plusieurs villes de 50 000 habitants misent sur le covoiturage domicile-travail.", "ib", "2026-10-24", 5, 2980, ["transports", "environnement"], ["À la sortie de l'autoroute, un parking de 120 places affiche complet dès sept heures. Ici, on se retrouve, on change de voiture et on file vers la zone d'activités. Le dispositif existe depuis dix-huit mois et personne ne parle de l'arrêter.", "L'astuce de la collectivité tient en une ligne : une prime de 2 euros par trajet partagé, versée au conducteur. Le coût est modeste au regard des voies qu'il aurait fallu élargir pour absorber le trafic.", "Les limites sont connues. Le covoiturage fonctionne bien aux heures de pointe sur des trajets réguliers, beaucoup moins pour les horaires décalés. Les élus étudient des navettes à la demande pour les compléter."]],
  [4, "soc", "Eau chaude et chaudière collective : l'enquête dans un immeuble", "Quarante logements, une seule chaudière et des factures qui divergent. Comment une copropriété a fini par comprendre ses charges.", "cm", "2026-10-17", 9, 3340, ["logement", "enquête"], ["Tout a commencé par un courrier du syndic. Les charges de chauffage de l'immeuble du 14, rue des Tilleuls ont augmenté de 38 % en deux ans, alors que l'hiver n'avait rien de particulier. Les copropriétaires ont demandé les relevés.", "Un ingénieur thermicien, venu à la demande du conseil syndical, a trouvé la cause en une matinée : un circuit de bouclage d'eau chaude sans isolation, qui perdait de la chaleur jour et nuit. Les travaux ont coûté 9 000 euros.", "Six mois plus tard, la consommation a baissé de 22 %. Le conseil syndical a décidé de publier ses relevés chaque trimestre, pour que chacun puisse suivre. C'est peut-être le plus durable des résultats."]],
  [5, "cul", "Cinq romans à lire avant la rentrée littéraire", "Quelques semaines avant le tourbillon des prix, cinq livres sortis discrètement qui n'ont pas à rougir des gros titres.", "hv", "2026-11-01", 5, 3560, ["livres", "romans"], ["La liste se veut modeste et partiale. Elle commence par un roman de campagne, tendre et sec à la fois, où une vieille femme reprend l'exploitation de son frère. L'écriture avance sans effet, et c'est ce qui la rend si précise.", "Viennent ensuite un récit de voyage déguisé en polar, une histoire de famille racontée par les objets, un premier roman sur une usine de porcelaine et un recueil de nouvelles dont chaque texte tient en dix pages.", "Aucun de ces livres ne fera la une. Tous méritent un après-midi de pluie. Si l'on devait n'en garder qu'un, ce serait le premier : on le referme avec l'envie d'appeler quelqu'un."]],
  [6, "cul", "Le retour du disque vinyle en milieu rural", "Dans une petite commune de l'Ain, un disquaire ouvre trois jours par semaine et refuse de vendre en ligne. Il ne s'en porte pas plus mal.", "hv", "2026-10-27", 6, 2210, ["musique", "commerce local"], ["La boutique tient dans un ancien bureau de poste, entre la boulangerie et la mairie. Des bacs de bois, un tourne-disque en démonstration, un canapé que l'on dirait venu d'un salon voisin. On y entre pour chercher un titre et on reste pour discuter.", "Le gérant achète ses disques d'occasion par lots, chez des particuliers, et les nettoie un à un. Il vend aussi du neuf, mais seulement ce qu'il a écouté. Sa clientèle a entre quinze et quatre-vingts ans.", "Le modèle n'a rien d'universel, il le sait. Sans loyer élevé et avec un second revenu à mi-temps, la boutique tient. Elle tient surtout parce que les gens du village y ont retrouvé un lieu où l'on s'arrête."]],
  [7, "cul", "Le musée qui prête ses oeuvres aux écoles", "Tous les mois, une classe de primaire accueille une peinture ou une sculpture du fonds régional. Mode d'emploi d'une idée simple.", "hv", "2026-10-19", 5, 1890, ["musée", "éducation"], ["Le dispositif tient dans un mot : confiance. Le musée prête une toile à l'école pour trois semaines, assurée, encadrée, accompagnée d'un petit livret. Les élèves la regardent chaque jour et en parlent. Beaucoup la dessinent de mémoire.", "La première classe à avoir tenté l'expérience, à Villars, a reçu un paysage de 1890. Les enfants lui ont donné un nom, l'ont défendu contre une rumeur de déménagement et ont organisé un vernissage pour leurs parents.", "Les conservateurs reconnaissent une part de risque. Ils préfèrent celui-là à l'idée d'un patrimoine que l'on n'approche qu'avec un billet et un audioguide."]],
  [8, "cui", "La soupe de potimarron, version paresseuse", "Une soupe en quarante minutes, sans éplucher le potiron, avec quatre ingrédients et un secret de beurre noisette.", "nr", "2026-11-02", 4, 5240, ["recettes", "soupes", "automne"], ["Le potimarron a un avantage sur toutes les autres courges : sa peau se mange. Lavez-le, coupez-le en gros morceaux sans l'éplucher, retirez les graines. Un oignon, une gousse d'ail, un litre d'eau ou de bouillon, c'est tout.", "Faites revenir l'oignon dans une noix de beurre, ajoutez le potimarron, couvrez d'eau et laissez cuire vingt-cinq minutes. Mixez longuement : la peau doit disparaître dans la texture. Salez après la cuisson, jamais avant.", "Le secret tient à la dernière minute. Faites chauffer du beurre jusqu'à ce qu'il sente la noisette, versez-le sur la soupe avec quelques graines grillées. On ne s'en lasse pas."]],
  [9, "cui", "Pain maison : les erreurs que tout le monde fait", "Trop de levure, pas assez de temps, four tiède : les cinq fautes classiques de la première fournée et comment les éviter.", "nr", "2026-10-28", 7, 4410, ["pain", "techniques"], ["Première erreur : croire que plus de levure donne plus de goût. C'est l'inverse. Une pincée suffit, à condition de laisser faire douze heures au frais. La fermentation lente développe les arômes, la levure rapide les étouffe.", "Deuxième erreur : un four qui n'est pas assez chaud. Préchauffez-le à fond pendant quarante minutes avec la cocotte dedans. Le choc thermique donne le gonflement et la croûte qui craque au refroidissement.", "Troisième erreur, la plus fréquente : couper trop tôt. Un pain sorti du four continue de cuire de l'intérieur. Attendez une heure. Votre patience sera récompensée par une mie qui ne colle pas."]],
  [10, "cui", "Marchés d'automne : acheter moins, mais mieux", "Un tour de marché avec une maraîchère pour apprendre à repérer le bon produit, le bon prix et la bonne quantité.", "nr", "2026-10-21", 6, 1740, ["courses", "saison"], ["Il est sept heures et demie, la camionnette de Sylvie est déjà à moitié vide. Elle vend des légumes de sa ferme, à vingt minutes de là, et ne propose que ce qui pousse. En novembre, cela fait un étal modeste et magnifique.", "Son conseil principal tient en une phrase : demandez ce qu'il y a de meilleur cette semaine, pas ce qu'il y a. Le vendeur sait. Il vous orientera vers les poireaux plutôt que vers les courgettes de serre, et vous ferez des économies.", "Autre règle : n'achetez que pour trois jours. Un frigo plein est un frigo où l'on oublie. Un panier léger, rempli deux fois dans la semaine, évite le gaspillage et fait du marché un rendez-vous."]],
  [11, "voy", "Trois jours à Trieste, sans voiture", "Une ville-frontière, des cafés qui ont connu Joyce et un tram qui monte à flanc de colline : itinéraire d'un long week-end.", "tl", "2026-10-31", 7, 3980, ["Italie", "city-break"], ["On arrive à Trieste par le train, et c'est déjà une manière de comprendre la ville. La gare est ancienne, la place d'en face est immense, la mer commence au bout de la rue. Tout se fait à pied, ou presque.", "Le premier jour est pour la vieille ville : la piazza dell'Unità, les cafés historiques, le canal. Le deuxième pour le tramway de Opicina, qui grimpe vers le plateau et révèle la baie. Le troisième pour les bains de mer, ouverts jusqu'en octobre.", "Mangez dans les buffets, ces petits restaurants où le bouilli est servi à la louche. Évitez le vent de bora, il peut faire tomber un parapluie à l'autre bout de la rue. Et emportez un livre, il y a toujours un banc."]],
  [12, "voy", "Le train de nuit, ce confort retrouvé", "Couchettes rénovées, nouvelles liaisons : le train de nuit revient sur les cartes. Ce qu'il faut savoir avant de réserver.", "tl", "2026-10-25", 6, 5120, ["train", "transports"], ["Le train de nuit n'a jamais vraiment disparu, il s'était seulement raréfié. Depuis deux ans, plusieurs lignes ont rouvert, avec des voitures remises à neuf et des compartiments individuels pour les voyageurs seuls.", "Le tarif varie beaucoup. Comptez entre 40 et 120 euros pour une couchette, davantage pour un compartiment privé. Réservez trois mois à l'avance, surtout pour les départs de vendredi. Les offres du dernier moment existent, mais restent rares.", "Le vrai luxe est ailleurs : arriver au centre-ville à sept heures, la journée devant soi, sans avoir perdu une nuit d'hôtel. Une paire de bouchons d'oreilles et un bon livre suffisent."]],
  [13, "voy", "Randonner en novembre : mode d'emploi", "Moins de monde, une lumière rasante et des sentiers qui changent de visage. Équipement, horaires et erreurs à éviter.", "tl", "2026-10-15", 5, 2760, ["randonnée", "montagne"], ["Novembre est un mois à part. Les feuilles sont tombées, la boue guette et la nuit arrive vers dix-sept heures. Mais les chemins sont vides, les points de vue dégagés, et la lumière donne aux forêts une profondeur que l'été oublie.", "Partez tôt, avec une marge d'une heure avant le coucher du soleil. Emportez une lampe frontale même pour une sortie courte. Trois couches, des chaussettes de rechange, une boisson chaude dans un thermos : c'est tout le secret.", "Choisissez des itinéraires que vous connaissez, ou proches d'un village. Évitez les hauteurs si la neige est annoncée. Et laissez toujours une personne informée de votre parcours."]],
  [14, "ide", "Pourquoi nous gardons trop de choses", "Câbles, cartons, vêtements trop petits : enquête sur l'attachement aux objets et sur les méthodes pour s'en libérer sans regret.", "cm", "2026-11-04", 7, 4630, ["quotidien", "consommation"], ["Dans chaque maison, il existe un tiroir qui ne ferme plus. On y garde des câbles dont on ne sait plus l'usage, des piles à moitié mortes et des objets qui pourraient servir un jour. Ce « un jour » n'arrive presque jamais.", "Les psychologues parlent d'aversion à la perte : nous accordons plus de valeur à ce que nous possédons qu'à ce que nous pourrions recevoir. Jeter, c'est admettre qu'on a gaspillé. Garder, c'est repousser le moment de décider.", "Une méthode simple consiste à fixer une date. Tout ce que l'on n'a pas utilisé en un an est mis dans un carton, scotché, daté. Si le carton reste fermé six mois, il part. Cela marche mieux qu'on ne le croit."]],
  [15, "ide", "Lire lentement : petit éloge de la marge", "Annoter, relire, revenir en arrière : et si la lecture lente était la seule qui laisse une trace ?", "hv", "2026-10-29", 5, 1960, ["lecture", "essai"], ["On lit vite parce que tout invite à aller vite. Le texte défile, la notification suit, le fil continue. Pourtant, les livres qui nous marquent sont rarement ceux qu'on a avalés. Ce sont ceux dont on a recopié des phrases.", "La marge est un lieu de conversation. On y met un point d'interrogation, un désaccord, une date, un souvenir. Dans dix ans, ces annotations en disent plus sur nous que le texte lui-même.", "Rien n'oblige à noircir des pages. Un simple trait au crayon suffit. L'essentiel est de ralentir, une demi-heure par jour, et de redécouvrir ce plaisir très simple : comprendre ce que l'on lit."]],
  [16, "ide", "Le téléphone dans la poche : deux semaines d'expérience", "Un reporter a rangé son smartphone dans un tiroir pendant quinze jours, avec un téléphone à touches pour seule exception. Compte rendu.", "ib", "2026-10-12", 6, 5980, ["numérique", "expérience"], ["Le premier jour a été le plus difficile. Le réflexe de sortir le téléphone à chaque attente, au feu rouge, dans la file du pain. Les mains cherchaient une occupation, les yeux un écran. La rue, elle, était pleine de choses à regarder.", "Au troisième jour, l'impatience s'est transformée en curiosité. J'ai relu des journaux en papier, parlé au boulanger, retrouvé le trajet à pied jusqu'au bureau. Les plans de ville en papier ont refait surface au fond d'un sac.", "Au bout de quinze jours, le smartphone est revenu, mais pas tout à fait comme avant. Les notifications sont éteintes, l'écran est en niveaux de gris, et une règle s'impose : aucun écran avant le premier café."]],
];
const ids = ART.map((a) => a[0]);
const MON = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MON[m - 1]} ${y}`; };
const ini = (k) => AUT[k].n.split(" ").map((w) => w[0]).join("");
const byDate = ART.slice().sort((a, b) => (a[5] < b[5] ? 1 : -1));
const top = ART.slice().sort((a, b) => b[7] - a[7]);

/* ---------- Illustrations géométriques par rubrique ---------- */
const rnd = (seed) => { let s = (Math.imul(seed + 11, 2654435761) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
const n1 = (n) => Math.round(n * 10) / 10;
function art(rub, seed, cls = "") {
  const R = RUB[rub], r = rnd(seed), c = R.c;
  let g = "";
  if (rub === "soc") for (let i = 0; i < 7; i++) { const h = 40 + r() * 120, x = 20 + i * 52; g += `<rect x="${x}" y="${220 - h}" width="40" height="${h}" fill="${c}" opacity="${n1(0.35 + r() * 0.55)}"/><rect x="${x + 8}" y="${220 - h + 10}" width="8" height="8" fill="#fff" opacity=".7"/>`; }
  else if (rub === "cul") for (let i = 0; i < 6; i++) g += `<circle cx="${n1(130 + r() * 140)}" cy="${n1(110 + r() * 40)}" r="${30 + i * 22}" fill="none" stroke="${c}" stroke-width="${n1(2 + r() * 6)}" opacity="${n1(0.9 - i * 0.12)}"/>`;
  else if (rub === "cui") for (let i = 0; i < 5; i++) g += `<circle cx="${n1(50 + r() * 300)}" cy="${n1(40 + r() * 170)}" r="${n1(24 + r() * 46)}" fill="${c}" opacity="${n1(0.25 + r() * 0.5)}"/>`;
  else if (rub === "voy") { for (let i = 0; i < 4; i++) { const x = n1(r() * 340 - 20), w = n1(110 + r() * 150), h = n1(60 + r() * 110); g += `<path d="M${x} 230L${n1(x + w / 2)} ${n1(230 - h)}L${n1(x + w)} 230z" fill="${c}" opacity="${n1(0.3 + r() * 0.5)}"/>`; } g += `<circle cx="${n1(300 + r() * 60)}" cy="52" r="22" fill="${c}" opacity=".9"/>`; }
  else for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) g += `<circle cx="${34 + x * 41}" cy="${36 + y * 38}" r="${n1(2 + r() * 11)}" fill="${c}" opacity="${n1(0.3 + r() * 0.6)}"/>`;
  return `<svg class="rb-art ${cls}" viewBox="0 0 400 250" role="img" aria-label="Illustration de la rubrique ${esc(R.n)}" preserveAspectRatio="xMidYMid slice"><rect width="400" height="250" fill="${R.t}"/>${g}<rect x="0" y="236" width="400" height="14" fill="${c}"/></svg>`;
}

/* ---------- Éléments récurrents ---------- */
const pill = (rub) => `<a class="rb-pill rb-r-${rub}" href="/articles#rub-${rub}">${esc(RUB[rub].n)}</a>`;
const meta = (a) => `<p class="rb-meta"><span class="rb-by">${esc(AUT[a[4]].n)}</span><time datetime="${a[5]}">${dfr(a[5])}</time><span>${a[6]} min</span></p>`;
const card = (a, extra = "") => `<article class="rb-card rb-r-${a[1]} ${extra}" data-rub="${a[1]}" data-aut="${a[4]}" data-date="${a[5]}" data-views="${a[7]}" data-mois="${a[5].slice(0, 7)}" data-txt="${esc((a[2] + " " + a[8].join(" ")).toLowerCase())}"><a class="rb-card-a" href="/article#a${a[0]}"><span class="rb-cart rb-p${a[0] % 4}" aria-hidden="true"></span><span class="rb-card-b"><span class="rb-kick">${esc(RUB[a[1]].n)}</span><h3 class="rb-card-t">${esc(a[2])}</h3><span class="rb-card-x">${esc(a[3])}</span>${meta(a)}</span></a></article>`;
const small = (a) => `<li class="rb-r-${a[1]}"><a href="/article#a${a[0]}"><span class="rb-kick">${esc(RUB[a[1]].n)}</span><span class="rb-small-t">${esc(a[2])}</span></a><span class="rb-small-m">${dfr(a[5])} · ${a[6]} min</span></li>`;
const ranked = (n) => `<ol class="rb-rank">${top.slice(0, n).map((a, i) => `<li class="rb-r-${a[1]}"><span class="rb-rank-n" aria-hidden="true">${i + 1}</span><a href="/article#a${a[0]}">${esc(a[2])}</a><span class="rb-rank-v">${a[7].toLocaleString("fr-FR").replace(/\s| /g, " ")} lectures</span></li>`).join("")}</ol>`;

const header = (c) => `<header class="rb-head pk-bleed">
<div class="rb-top"><div class="rb-wrap rb-top-in"><span class="rb-date" data-date>Édition du jour</span><span class="rb-tag">Le magazine des idées ordinaires</span><a class="rb-top-s" href="/recherche">Rechercher</a></div></div>
<div class="rb-mast"><div class="rb-wrap rb-mast-in"><a class="rb-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="rb-logo-t">${esc(c.brand)}</span><span class="rb-logo-s">magazine · depuis 2019</span></a>
<div role="navigation" class="rb-nav" aria-label="Navigation principale">${nav(c.menu)}</div>
<details class="rb-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div role="navigation" class="rb-drawer" aria-label="Menu mobile">${nav(c.menu)}<a href="/recherche">Rechercher</a></div></details></div></div>
<div role="navigation" class="rb-rubs" aria-label="Rubriques"><div class="rb-wrap rb-rubs-in">${RK.map(pill).join("")}</div></div></header>`;

const footer = (c) => `<footer class="rb-foot pk-bleed"><div class="rb-wrap rb-foot-in">
<div class="rb-foot-brand"><div class="rb-foot-logo">${esc(c.brand)}</div><p>Un magazine indépendant sur la société, la culture, la cuisine, le voyage et les idées. Rédaction, articles et chiffres fictifs, pour la démonstration.</p></div>
<div class="rb-foot-c"><h2>Rubriques</h2>${RK.map((k) => `<a href="/articles#rub-${k}">${RUB[k].n}</a>`).join("")}</div>
<div class="rb-foot-c"><h2>Le magazine</h2>${nav(c.menu.slice(1))}<a href="/recherche">Recherche</a></div>
<div class="rb-foot-c"><h2>Informations</h2><a href="/mentions">Mentions légales</a><a href="/confidentialite">Confidentialité</a><a href="/blocs">Éléments de mise en page</a></div></div>
<p class="rb-legal">© ${esc(c.brand)} — site de démonstration. Articles, auteurs et chiffres sont fictifs.</p></footer>`;

const pagehead = (kick, title, sub, crumb) => sec(`<section class="rb-ph pk-bleed"><div class="rb-wrap"><p class="rb-crumb"><a href="/">Accueil</a> <span aria-hidden="true">/</span> ${esc(crumb || kick)}</p><p class="rb-kick rb-kick--b">${esc(kick)}</p><div class="rb-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="rb-lead">${esc(sub)}</p>` : ""}</div></section>`);
const bandHead = (title, link) => `<div class="rb-bh"><h2 class="rb-h2">${esc(title)}</h2>${link ? `<a class="rb-more" href="${link[1]}">${esc(link[0])} →</a>` : ""}</div>`;

/* ---------- Pages ---------- */
const home = (c) => {
  const [a, b, d] = byDate;
  const lead = byDate[0], two = [byDate[1], byDate[2]];
  return [
    sec(header(c)),
    sec(`<section class="rb-une pk-bleed"><div class="rb-wrap rb-une-in">
<article class="rb-lead-a rb-r-${lead[1]}"><a href="/article#a${lead[0]}">${art(lead[1], lead[0], "rb-lead-art")}</a><div class="rb-lead-b"><p class="rb-kick">${esc(RUB[lead[1]].n)} · À la une</p><div class="rb-h1" role="heading" aria-level="1"><a href="/article#a${lead[0]}">${esc(lead[2])}</a></div><p class="rb-lead">${esc(lead[3])}</p>${meta(lead)}</div></article>
<div class="rb-side2">${two.map((x) => `<article class="rb-r-${x[1]}"><a href="/article#a${x[0]}">${art(x[1], x[0], "rb-s2-art")}<p class="rb-kick">${esc(RUB[x[1]].n)}</p><h2 class="rb-h3">${esc(x[2])}</h2></a>${meta(x)}</article>`).join("")}</div>
<aside class="rb-most" aria-label="Les plus lus"><h2 class="rb-h4">Les plus lus</h2>${ranked(5)}</aside></div></section>`),
    sec(`<section class="rb-band pk-bleed"><div class="rb-wrap">${bandHead("Dernières publications", ["Toutes les publications", "/articles"])}<div class="rb-row4">${byDate.slice(3, 7).map((x) => card(x)).join("")}</div></div></section>`),
    ...["cul", "cui", "voy"].map((k, i) => sec(`<section class="rb-rubsec rb-r-${k} pk-bleed"><div class="rb-wrap"><div class="rb-rs-h"><h2 class="rb-h2"><span class="rb-dot" aria-hidden="true"></span>${RUB[k].n}</h2><p>${esc(RUB[k].d)}</p><a class="rb-more" href="/articles#rub-${k}">Tout ${RUB[k].n.toLowerCase()} →</a></div>
<div class="rb-rs-g ${i % 2 ? "rb-rs-g--r" : ""}">${(() => { const l = ART.filter((x) => x[1] === k).sort((p, q) => (p[5] < q[5] ? 1 : -1)); return card(l[0], "rb-card--big") + `<ul class="rb-smalls">${l.slice(1, 4).map(small).join("")}</ul>`; })()}</div></div></section>`)),
    sec(`<section class="rb-edito pk-bleed"><div class="rb-wrap rb-edito-in"><div><p class="rb-kick rb-kick--b">L'éditorial</p><h2 class="rb-h2">Ce que nous essayons de faire ici</h2><p class="rb-lead">Un article par jour, jamais plus de dix minutes de lecture, et une règle : si un sujet ne nous a rien appris, il ne vous apprendra rien non plus. La rédaction compte cinq personnes, toutes visibles, toutes joignables.</p><p><a class="rb-btn" href="/redaction">Rencontrer la rédaction</a> <a class="rb-btn rb-btn--o" href="/contact">Proposer un sujet</a></p></div>
<ul class="rb-auts">${Object.entries(AUT).map(([k, v]) => `<li><span class="rb-av" aria-hidden="true">${ini(k)}</span><span><b>${esc(v.n)}</b><small>${esc(v.r)}</small></span></li>`).join("")}</ul></div></section>`),
    sec(footer(c)),
  ];
};

const months = () => { const m = {}; ART.forEach((a) => { m[a[5].slice(0, 7)] = (m[a[5].slice(0, 7)] || 0) + 1; }); return Object.entries(m).sort((x, y) => (x[0] < y[0] ? 1 : -1)); };
const articles = (c) => [
  sec(header(c)),
  pagehead("Archives", "Tous les articles", "Seize articles, cinq rubriques. Filtrez par rubrique, par auteur ou par mois, ou cherchez un mot.", "Articles"),
  sec(`<section class="rb-list pk-bleed" data-list><div class="rb-wrap">
<div class="rb-tools" role="group" aria-label="Filtres">
<div class="rb-chips" data-g="rub"><a class="rb-chip is-on" href="#rub-all" role="button" data-v="all" aria-pressed="true">Toutes</a>${RK.map((k) => `<a class="rb-chip rb-r-${k}" href="#rub-${k}" role="button" data-v="${k}" aria-pressed="false">${RUB[k].n}</a>`).join("")}</div>
<div class="rb-chips rb-chips--s" data-g="aut"><span class="rb-lab">Auteur</span><a class="rb-chip is-on" href="#aut-all" role="button" data-v="all" aria-pressed="true">Tous</a>${Object.entries(AUT).map(([k, v]) => `<a class="rb-chip" href="#aut-${k}" role="button" data-v="${k}" aria-pressed="false">${esc(v.n.split(" ")[0])}</a>`).join("")}</div>
<div class="rb-chips rb-chips--s" data-g="tri"><span class="rb-lab">Tri</span><a class="rb-chip is-on" href="#tri-new" role="button" data-v="new" aria-pressed="true">Plus récents</a><a class="rb-chip" href="#tri-pop" role="button" data-v="pop" aria-pressed="false">Plus lus</a></div></div>
<p class="rb-count" role="status"><b data-n>16</b> article(s) affiché(s)</p>
<div class="rb-lg"><div class="rb-grid" data-grid>${byDate.map((a) => card(a)).join("")}</div>
<aside class="rb-arch" aria-label="Archives"><h2 class="rb-h4">Archives par mois</h2><ul>${months().map(([m, n]) => `<li><a href="#mois-${m}" data-mois="${m}">${MON[+m.slice(5) - 1][0].toUpperCase() + MON[+m.slice(5) - 1].slice(1)} ${m.slice(0, 4)} <span>${n}</span></a></li>`).join("")}</ul><h2 class="rb-h4">Étiquettes</h2><p class="rb-tags">${[...new Set(ART.flatMap((a) => a[8]))].slice(0, 16).map((t) => `<a href="#etq-${t.replace(/[^a-z]/gi, "").toLowerCase()}" data-etq="${esc(t)}">${esc(t)}</a>`).join("")}</p></aside></div>
<div class="rb-empty" data-empty><p class="rb-h3">Aucun article ne correspond.</p><p>Essayez une autre rubrique ou <a href="#rub-all" data-reset>réinitialisez les filtres</a>.</p></div></div></section>`),
  sec(footer(c)),
];

const body = (a, full) => a[9].map((p, i) => `<p>${esc(p)}</p>${full && i === 0 ? `<aside class="rb-box"><p class="rb-box-t">À retenir</p><ul>${a[8].map((t) => `<li>${esc(t)}</li>`).join("")}<li>${a[6]} minutes de lecture</li></ul></aside>` : ""}${full && i === 1 ? `<blockquote class="rb-quote"><p>« ${esc(a[9][1].split(". ")[0].replace(/\.$/, ""))}. »</p><cite>${esc(AUT[a[4]].n)}</cite></blockquote>` : ""}`).join("");
const article = (c) => {
  const a = ART[0];
  return [
    sec(header(c)),
    sec(`<div class="rb-prog" aria-hidden="true"><i data-prog></i></div><section class="rb-art-h pk-bleed rb-r-${a[1]}" data-art><div class="rb-wrap"><p class="rb-crumb"><a href="/">Accueil</a> <span aria-hidden="true">/</span> <a href="/articles" data-p="crumbr">${RUB[a[1]].n}</a></p><p class="rb-kick rb-kick--b" data-p="kick">${esc(RUB[a[1]].n)}</p><div class="rb-h1" role="heading" aria-level="1" data-p="title">${esc(a[2])}</div><p class="rb-lead" data-p="chapo">${esc(a[3])}</p>
<div class="rb-byline"><span class="rb-av" aria-hidden="true" data-p="av">${ini(a[4])}</span><span><b data-p="aut">${esc(AUT[a[4]].n)}</b><small data-p="when">${dfr(a[5])} · ${a[6]} min de lecture</small></span><a class="rb-copy" href="#copier" role="button" data-copy-link>Copier le lien</a></div></div></section>`),
    sec(`<div class="rb-wrap rb-art-w pk-bleed"><figure class="rb-fig" data-p="fig">${art(a[1], a[0], "rb-fig-art")}<figcaption>Illustration : composition géométrique de la rubrique ${esc(RUB[a[1]].n)}.</figcaption></figure>
<div class="rb-art-g"><aside class="rb-art-m" aria-label="À propos de l'article"><p class="rb-lab">Écrit par</p><p class="rb-m-n" data-p="aut2">${esc(AUT[a[4]].n)}</p><p class="rb-m-r" data-p="role">${esc(AUT[a[4]].r)}</p><p class="rb-lab">Étiquettes</p><p class="rb-tags" data-p="tags">${a[8].map((t) => `<a href="/articles">${esc(t)}</a>`).join("")}</p></aside>
<div class="rb-prose" data-p="body">${body(a, true)}<h2>Pour aller plus loin</h2><p>La rédaction publie chaque semaine un dossier complet sur ce sujet. Vous pouvez aussi lire les <a href="/articles">autres articles de la rubrique</a> ou écrire à l'auteur depuis la <a href="/contact">page de contact</a>.</p></div></div>
<div class="rb-authbox"><span class="rb-av rb-av--l" aria-hidden="true" data-p="av2">${ini(a[4])}</span><div><p class="rb-lab">À propos de l'auteur</p><p class="rb-m-n" data-p="aut3">${esc(AUT[a[4]].n)}</p><p data-p="bio">${esc(AUT[a[4]].b)}</p></div></div>
<div role="navigation" class="rb-pn" aria-label="Articles voisins"><a href="/article#a2" data-prev>← Article précédent</a><a href="/article#a3" data-next>Article suivant →</a></div>
<section class="rb-more-r" aria-label="À lire aussi"><h2 class="rb-h2">À lire aussi</h2><div class="rb-row3" data-also>${byDate.slice(1, 4).map((x) => card(x)).join("")}</div></section>
</div></section>`),
    ...[ART.slice(0, 8), ART.slice(8)].map((g) => sec(`<div class="rb-store">${g.map((x) => `<div data-id="a${x[0]}" data-rub="${x[1]}" data-t="${esc(x[2])}" data-c="${esc(x[3])}" data-a="${x[4]}" data-d="${dfr(x[5])}" data-m="${x[6]}" data-tags="${esc(x[8].join("|"))}">${x[9].map((p) => `<p>${esc(p)}</p>`).join("")}</div>`).join("")}</div>`)),
    sec(footer(c)),
  ];
};

const rubriques = (c) => [
  sec(header(c)),
  pagehead("Rubriques", "Cinq rubriques, une seule rédaction", "Chaque rubrique a sa couleur, son rythme et ses auteurs de référence.", "Rubriques"),
  ...RK.map((k, i) => { const l = ART.filter((x) => x[1] === k).sort((p, q) => (p[5] < q[5] ? 1 : -1)); return sec(`<section class="rb-rubpage rb-r-${k} pk-bleed"><div class="rb-wrap rb-rp-in ${i % 2 ? "rb-rp-in--r" : ""}"><div class="rb-rp-t">${art(k, 40 + i, "rb-rp-art")}<h2 class="rb-h2"><span class="rb-dot" aria-hidden="true"></span>${RUB[k].n}</h2><p class="rb-lead">${esc(RUB[k].d)}</p><p class="rb-rp-n">${l.length} articles · ${[...new Set(l.map((x) => AUT[x[4]].n))].join(", ")}</p><a class="rb-btn" href="/articles#rub-${k}">Lire la rubrique</a></div><ul class="rb-smalls rb-smalls--b">${l.map(small).join("")}</ul></div></section>`); }),
  sec(footer(c)),
];

const redaction = (c) => [
  sec(header(c)),
  pagehead("La rédaction", "Cinq personnes, un magazine", "Qui écrit quoi, et comment nous travaillons.", "La rédaction"),
  sec(`<section class="rb-team pk-bleed"><div class="rb-wrap"><div class="rb-tg">${Object.entries(AUT).map(([k, v]) => { const l = ART.filter((x) => x[4] === k); return `<article class="rb-tm"><span class="rb-av rb-av--l" aria-hidden="true">${ini(k)}</span><h2 class="rb-h3">${esc(v.n)}</h2><p class="rb-m-r">${esc(v.r)}</p><p>${esc(v.b)}</p><p class="rb-tm-l">${l.length} articles : ${[...new Set(l.map((x) => RUB[x[1]].n))].join(", ")}</p><a class="rb-more" href="/articles#aut-${k}">Lire ses articles →</a></article>`; }).join("")}</div>
<div class="rb-charte"><h2 class="rb-h2">Notre charte</h2><ol><li><b>Signer.</b> Chaque article porte le nom de son auteur.</li><li><b>Corriger.</b> Toute erreur est corrigée en haut de l'article, avec la date.</li><li><b>Séparer.</b> Un contenu sponsorisé est toujours signalé comme tel.</li><li><b>Répondre.</b> Chaque message reçoit une réponse sous une semaine.</li></ol></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Écrire à la rédaction", "Un sujet à proposer, une erreur à signaler, une question sur un article : on lit tout.", "Contact"),
  { type: "form", heading: "Votre message", intro: "Précisez l'article concerné s'il y en a un. La démonstration n'envoie rien à une vraie rédaction, mais le formulaire fonctionne comme sur un vrai site." },
  sec(`<section class="rb-info pk-bleed"><div class="rb-wrap rb-info-in"><div><h2 class="rb-h3">Avant d'écrire</h2><ul class="rb-checks"><li><b>Proposer un sujet.</b> Trois lignes suffisent : le fait, l'angle, pourquoi maintenant.</li><li><b>Signaler une erreur.</b> Indiquez le titre de l'article et le passage.</li><li><b>Réponse.</b> Sous une semaine (démonstration).</li></ul></div><address class="rb-addr"><b>Rédaction ${esc(c.brand)}</b><br>12 rue des Imprimeurs<br>69002 Lyon<br><a href="mailto:redaction@rubrique-magazine.example">redaction@rubrique-magazine.example</a><br><small>Adresse fictive.</small></address></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher dans le magazine", "Un mot, un auteur, une rubrique : tapez et validez.", "Recherche"),
  { type: "layout", children: [{ type: "search", props: { target: "blog", placeholder: "Rechercher un article…" } }] },
  sec(`<section class="rb-nores pk-bleed"><div class="rb-wrap"><div class="rb-empty-s"><p class="rb-h3">Aucun résultat ? Voici quoi essayer.</p><ul><li>Vérifiez l'orthographe ou cherchez un mot plus court (« pain » plutôt que « panification »).</li><li>Parcourez une <a href="/rubriques">rubrique</a> ou les <a href="/articles">archives par mois</a>.</li><li>Écrivez-nous depuis la <a href="/contact">page de contact</a> : nous ajouterons peut-être le sujet.</li></ul></div><h2 class="rb-h4">Les plus lus</h2>${ranked(5)}</div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="rb-404 pk-bleed"><div class="rb-wrap rb-404-in"><div class="rb-404-fig"><span class="rb-404-n" aria-hidden="true">404</span><svg class="rb-404-art" viewBox="0 0 320 220" role="img" aria-label="Une page déchirée au milieu d'une colonne de texte"><rect width="320" height="220" fill="#fcefdc"/><g fill="#1b1b1b" opacity=".75"><rect x="30" y="30" width="110" height="7"/><rect x="30" y="46" width="90" height="7"/><rect x="30" y="62" width="104" height="7"/><rect x="180" y="30" width="110" height="7"/><rect x="180" y="46" width="96" height="7"/></g><path d="M0 110L40 96 80 120 120 98 160 124 200 100 240 122 280 98 320 112V220H0z" fill="#b45309"/></svg></div>
<div><p class="rb-kick rb-kick--b">Erreur 404 · page manquante</p><div class="rb-h1" role="heading" aria-level="1">Cette page a été coupée au montage.</div><p class="rb-lead">Le lien est ancien ou l'article a changé d'adresse. Reprenez par la une, ou cherchez un mot.</p><p><a class="rb-btn" href="/">Retour à la une</a> <a class="rb-btn rb-btn--o" href="/recherche">Rechercher</a> <a class="rb-btn rb-btn--o" href="/articles">Tous les articles</a></p></div></div></section>`),
  sec(footer(c)),
];
const legal = (title, crumb, items) => (c) => [sec(header(c)), pagehead("Informations légales", title, "", crumb), sec(`<section class="rb-legalp pk-bleed"><div class="rb-wrap"><div class="rb-prose">${items}</div></div></section>`), sec(footer(c))];
const mentions = legal("Mentions légales", "Mentions légales", `<h2>Éditeur</h2><p>Le site « Rubrique » est un site de démonstration du thème du même nom. Il n'est exploité par aucune société réelle. Remplacez ces informations par celles de votre structure : raison sociale, adresse, numéro d'immatriculation, directeur de la publication.</p><h2>Hébergement</h2><p>Indiquez ici le nom, l'adresse et le contact de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les textes, illustrations et chiffres de cette démonstration sont fictifs et libres de droits pour l'essai du thème. Pour votre propre site, précisez les conditions de reproduction de vos articles.</p><h2>Contact</h2><p>Pour toute question, utilisez la <a href="/contact">page de contact</a>.</p>`);
const confidentialite = legal("Politique de confidentialité", "Confidentialité", `<h2>Données collectées</h2><p>Le formulaire de contact recueille votre nom, votre adresse e-mail et votre message, uniquement pour répondre à votre demande. Cette démonstration ne transmet rien à un tiers.</p><h2>Cookies et mesure d'audience</h2><p>Le thème n'ajoute aucun traceur. Seuls des réglages d'affichage (filtres, mode de lecture) peuvent être conservés dans votre navigateur, sur votre appareil uniquement.</p><h2>Vos droits</h2><p>Vous pouvez demander l'accès, la rectification ou la suppression de vos données en nous écrivant depuis la <a href="/contact">page de contact</a>.</p><h2>Durée de conservation</h2><p>Les messages sont conservés douze mois au plus, puis supprimés. Adaptez cette durée à votre pratique réelle.</p>`);

const blocs = (c) => [
  sec(header(c)),
  pagehead("Guide de mise en page", "Éléments de mise en page", "Tous les éléments d'un article, tels que le thème les met en forme.", "Éléments"),
  sec(`<section class="rb-legalp pk-bleed"><div class="rb-wrap"><div class="rb-prose">
<h2>Titre de niveau 2 : l'intertitre principal</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe courant avec un <a href="/articles">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, une <mark>surbrillance</mark>, du <code>code en ligne</code> et une note<sup>1</sup>. La ligne reste entre soixante et quatre-vingts caractères pour rester confortable.</p>
<ul><li>Une liste à puces simple</li><li>Avec un deuxième élément</li><li>Et un troisième, plus long, qui passe sur deux lignes lorsque l'écran est étroit</li></ul>
<ol><li>Une liste numérotée</li><li>Pour les étapes</li><li>Dans l'ordre</li></ol>
<blockquote class="rb-quote"><p>« Une citation mise en valeur, avec son filet de rubrique. »</p><cite>Claire Maurel</cite></blockquote>
<figure class="rb-fig">${art("voy", 99, "rb-fig-art")}<figcaption>Une image avec sa légende, en pleine largeur de colonne.</figcaption></figure>
<div class="rb-scroll" role="region" aria-label="Tableau défilant"><table><caption>Lectures par rubrique</caption><thead><tr><th scope="col">Rubrique</th><th scope="col">Articles</th><th scope="col">Lectures</th><th scope="col">Temps moyen</th></tr></thead><tbody>${RK.map((k) => { const l = ART.filter((x) => x[1] === k); return `<tr><th scope="row">${RUB[k].n}</th><td>${l.length}</td><td>${l.reduce((s, x) => s + x[7], 0).toLocaleString("fr-FR")}</td><td>${Math.round(l.reduce((s, x) => s + x[6], 0) / l.length)} min</td></tr>`; }).join("")}</tbody></table></div>
<pre><code>.article { max-width: 68ch; margin: 0 auto; }</code></pre>
<p><a class="rb-btn" href="/contact">Bouton plein</a> <a class="rb-btn rb-btn--o" href="/articles">Bouton contour</a></p>
<div class="rb-cols"><div><h3>Colonne gauche</h3><p>Deux colonnes sur grand écran, une seule sur mobile.</p></div><div><h3>Colonne droite</h3><p>Pratique pour comparer deux points de vue.</p></div></div>
<aside class="rb-box"><p class="rb-box-t">Encadré</p><p>Une information complémentaire, détachée du texte principal.</p></aside>
</div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "rubrique", name: "Rubrique", version: "1.0.0", category: "edition", tags: ["editorial", "classique"], siteType: "Blog magazine multi-catégories", collection: "blog",
  concept: "La maquette d'un hebdomadaire : manchette à double filet, une à trois colonnes, une couleur par rubrique qui teinte pastilles, filets et illustrations, « les plus lus » numérotés et archives par mois.",
  description: "Blog magazine à rubriques colorées : papier crème, encre noire, manchette à double filet, accueil en blocs, archives filtrables par rubrique, auteur et mois, article avec marge d'auteur.",
  brand: "Rubrique", modules: ["blog", "recherche", "formulaires"],
  dna: {
    hero: "une-a-trois-colonnes-grand-sujet-deux-secondaires-et-pile-des-plus-lus",
    header: "manchette-a-double-filet-date-du-jour-et-bandeau-de-rubriques-colorees",
    grid: "colonnes-de-presse-quatre-colonnes-avec-gouttieres-filetees",
    typo: "besley-clarendon-et-pt-sans",
    shapes: "filets-doubles-pastilles-de-rubrique-et-illustrations-geometriques-a-bandeau-colore",
    motion: "barre-de-progression-de-lecture-et-filtrage-par-rubrique-sans-mouvement-decoratif",
    rhythm: "blocs-de-rubrique-alternes-gauche-droite-separes-par-filets-noirs",
    signature: "filtre-par-rubrique-auteur-et-mois-avec-tri-par-lectures-et-article-reel-hydrate-depuis-l-ancre",
    palette: "creme-papier-encre-noire-et-cinq-couleurs-de-rubrique-brique-violet-ambre-cyan-olive",
    image: "illustrations-svg-geometriques-par-rubrique-avec-bandeau-colore-en-pied",
    list: "grille-trois-colonnes-ou-fil-vertical-ou-une-et-colonnes-au-choix",
    article: "chapo-large-marge-d-auteur-a-gauche-encadre-a-retenir-et-citation-filetee",
    sidebar: "archives-par-mois-et-etiquettes-a-droite-de-la-liste",
    reading: "colonne-de-68-caracteres-serif-18-px-interligne-1-7-et-progression-en-haut",
  },
  tokens: {
    colors: { primary: "#c2410c", secondary: "#1b1b1b", accent: "#6d3fc0", background: "#faf8f3", surface: "#ffffff", text: "#1b1b1b", muted: "#55524b", success: "#2b7a3b", warning: "#8a5a00", error: "#b42318" },
    fonts: { heading: "font.besley", body: "font.pt-sans", button: "font.pt-sans", link: "font.pt-sans" },
    radius: { sm: 2, md: 3, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#1b1b1b" },
    type: { h1: { size: 52, weight: 800, lineHeight: 1.08, transform: "none" }, h2: { size: 32, weight: 800, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent (boutons, liens)", type: "color", default: "#c2410c" },
    { key: "entete", label: "En-tête", type: "choice", default: "manchette", choices: [["manchette", "Manchette centrée à double filet"], ["barre", "Barre unique, logo à gauche"], ["compact", "Compact et collant"]] },
    { key: "liste", label: "Liste des articles", type: "choice", default: "grille", choices: [["grille", "Grille de trois colonnes"], ["fil", "Fil vertical avec vignettes"], ["une", "Un grand article puis deux colonnes"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "colonnes", choices: [["colonnes", "Quatre colonnes"], ["mince", "Ligne unique"]] },
    { key: "lecture", label: "Mise en page de l'article", type: "choice", default: "marge", choices: [["marge", "Marge d'auteur à gauche"], ["centre", "Colonne centrée"]] },
    { key: "couleurs", label: "Couleurs de rubrique", type: "choice", default: "on", choices: [["on", "Colorées"], ["off", "Sobres (encre uniquement)"]] },
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "clair", choices: [["clair", "Papier clair"], ["sombre", "Sombre"]] },
  ],
  menu: [["Accueil", "/"], ["Articles", "/articles"], ["Rubriques", "/rubriques"], ["La rédaction", "/redaction"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "articles", name: "Articles et archives", render: articles }, { key: "article", name: "Article", render: article },
    { key: "rubriques", name: "Rubriques", render: rubriques }, { key: "redaction", name: "La rédaction", render: redaction }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite }, { key: "blocs", name: "Éléments de mise en page", render: blocs },
  ],
};
