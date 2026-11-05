// Colophon — maison d'édition littéraire (démonstration). Direction artistique : la page imprimée. Crème, encre et rouge de reliure ; double page ouverte avec extrait,
// table des matières en barre, catalogue en rayonnage de dos de livres (ou en cartes) filtrable, extrait lisible en mode livre (pagination, taille, papier/sépia/nuit, progression, clavier).
const { sec, form, esc } = require("../kit");

// ---------- données fictives (livres, auteurs et extraits inventés) ----------
const AU = {
  marvanne: ["Élise Marvanne", "EM", "née en 1974 à Saint-Malo", "Romancière de la côte et du non-dit, elle écrit des intérieurs battus par les saisons. Ancienne correctrice de presse, elle compose chaque livre au crayon avant de le passer à la machine."],
  quillevic: ["Théodore Quillevic", "TQ", "né en 1969 à Brest", "Nouvelliste et romancier, ancien restaurateur de pendules. Ses récits tiennent comme des mécanismes : peu de pièces, aucune de trop."],
  doreval: ["Anaïs Doreval", "AD", "née en 1981 à Grenoble", "Essayiste et poète, elle enseigne la philosophie du langage. Elle écrit sur ce que les pièces, les gares et les lettres gardent de ceux qui y passent."],
  ormerod: ["Basile Ormerod", "BO", "né en 1958 à Lille", "Ancien instituteur, romancier de la patience. Ses livres suivent des villages en hiver, des fêtes qui n'ont pas lieu et des voisinages qui se réparent."],
  sauveterre: ["Mathilde Sauveterre", "MS", "née en 1990 à Toulouse", "Poète et traductrice. Elle travaille le vers court, le blanc de la page et l'oreille : chaque recueil est lu à voix haute avant d'être composé."],
  kerlan: ["Isidore Kerlan", "IK", "né en 1947 à Quimper", "Romancier épistolier, ancien facteur rural. Il écrit des histoires faites de lettres perdues, retrouvées, jamais tout à fait envoyées."],
  vauclair: ["Jeanne Vauclair", "JV", "née en 1985 à Dijon", "Essayiste du quotidien. Elle prend un sujet minuscule — attendre, marcher, ranger — et en tire un livre court, drôle et précis."],
  lenormel: ["Octave Lenormel", "OL", "né en 1976 à Rouen", "Cartographe de formation, romancier par entêtement. Ses intrigues se déplient comme des cartes : il faut en connaître les plis pour s'y retrouver."],
};
const GEN = { roman: "Roman", nouvelles: "Nouvelles", poesie: "Poésie", essai: "Essai" };
const COL = { marges: "Marges", fil: "Fil d'encre", reliure: "Petite Reliure", cahiers: "Cahiers du soir" };
// slug, titre, auteur, genre, collection, année, ton (0-7), motif (0-7), hauteur (0-3), largeur (0-2), extrait ?, résumé
const BK = [
  ["maison-des-marees", "La Maison des marées", "marvanne", "roman", "marges", 2026, 1, 1, 3, 2, 1, "Lucie hérite d'une maison que la mer visite deux fois par jour. Entre les registres du notaire et les cahiers de sa grand-mère, elle apprend à lire l'eau."],
  ["heures-creuses", "Les Heures creuses", "quillevic", "nouvelles", "reliure", 2025, 5, 7, 2, 1, 1, "Neuf nouvelles dans l'atelier d'un horloger, pendant les heures où personne ne passe. Chaque pendule remontée ouvre une histoire."],
  ["cartographie-du-silence", "Cartographie du silence", "doreval", "essai", "cahiers", 2026, 3, 4, 1, 1, 1, "Une promenade de quarante-deux pages dans les lieux où l'on se tait : chambres, bibliothèques, salles d'attente. Un essai pour apprendre à écouter."],
  ["hiver-saint-orme", "Un hiver à Saint-Orme", "ormerod", "roman", "marges", 2025, 2, 6, 3, 1, 0, "Quand la neige coupe la route, tout un village doit organiser la fête de Noël sans électricité. Le roman le plus chaleureux de la saison."],
  ["sel-et-cendre", "Sel et cendre", "sauveterre", "poesie", "fil", 2026, 0, 2, 0, 0, 0, "Soixante poèmes brefs sur ce qui reste après le feu et après la marée. Format à l'italienne, papier vergé."],
  ["passeur-de-lettres", "Le Passeur de lettres", "kerlan", "roman", "marges", 2024, 4, 3, 2, 2, 0, "Un facteur de montagne garde trente ans de courrier non distribué. Le jour où il décide de le rendre, il refait le monde."],
  ["traite-de-la-lenteur", "Petit traité de la lenteur", "vauclair", "essai", "cahiers", 2024, 6, 0, 1, 0, 0, "Marcher sans but, attendre le café, laisser mûrir une phrase : le plaidoyer joyeux d'une essayiste pressée de ralentir."],
  ["aout-volets-clos", "Août, les volets clos", "marvanne", "nouvelles", "reliure", 2023, 7, 5, 2, 1, 0, "Sept nouvelles sur les maisons de vacances en dehors de la saison, les clefs sous le pot et les étés qui reviennent."],
  ["lanternes", "Lanternes", "sauveterre", "poesie", "fil", 2024, 2, 1, 0, 0, 0, "Un recueil de nuit : fenêtres allumées, trains, veilleuses. Des poèmes à lire à haute voix, lampe baissée."],
  ["atlas-des-absents", "L'Atlas des absents", "lenormel", "roman", "marges", 2023, 5, 4, 3, 2, 0, "Un cartographe dessine les villages que l'on a rayés des cartes. Chacun lui envoie un souvenir ; l'atlas devient un roman choral."],
  ["chambres-d-echo", "Chambres d'écho", "doreval", "poesie", "fil", 2023, 3, 2, 1, 0, 0, "Quarante poèmes sur les pièces vides et les voix qui y résonnent encore. Premier recueil de l'autrice."],
  ["saisons-de-pierre", "Les Saisons de pierre", "quillevic", "roman", "marges", 2022, 0, 6, 2, 1, 0, "Quatre saisons dans une carrière du Jura, vues par quatre générations de tailleurs. Un roman de gestes, de poussière et de fidélité."],
];
const B = BK.map(([s, t, a, g, c, y, tone, m, h, w, ex, r]) => ({ s, t, a, g, c, y, tone, m, h, w, ex, r }));
const bySlug = (s) => B.find((b) => b.s === s);

const EXTRAITS = {
  "maison-des-marees": {
    chap: "I", titre: "Le seuil", pages: "248 p.", format: "12,5 × 20 cm", parution: "Septembre 2026",
    textes: [
      "Quand Lucie arriva à la maison, la mer s'était retirée depuis longtemps et avait laissé sur la grève cette odeur de linge mouillé qu'on ne retrouve nulle part ailleurs. Le notaire lui avait remis trois clefs sur un anneau de laiton, en précisant que la plus petite n'ouvrait rien de connu.",
      "Elle posa sa valise dans le couloir. Le carrelage portait encore, à hauteur de plinthe, une ligne claire, très droite, comme si quelqu'un avait tiré un trait au cordeau sur les murs. Elle mit un moment à comprendre que c'était la trace de l'eau, celle des grandes marées de mars, qui montait jusqu'ici sans jamais déranger personne.",
      "Dans la cuisine, un cahier à couverture toile était ouvert sur la table. Sa grand-mère y notait chaque matin deux colonnes de chiffres, l'une pour l'heure, l'autre pour le coefficient, et dans la marge, d'une écriture qui s'inclinait avec les années, une seule phrase : « Elle est venue » ou « Elle n'est pas venue ». Lucie ne demanda pas de qui l'on parlait.",
      "Elle fit le tour des pièces. Au premier, la chambre donnait sur le large et sentait la lavande et le sel. Un lit étroit, une chaise, un miroir dont le tain s'était décollé en fleurs brunes. Sur la commode, une lampe à pétrole que personne n'avait eu le cœur d'électrifier. Elle l'alluma par jeu, et la flamme resta droite, sans un souffle, comme si la maison retenait son haleine.",
      "Vers le soir, elle descendit sur la plage. Le sable était encore gorgé d'eau et chaque pas y laissait une empreinte qui se remplissait aussitôt d'un reflet de ciel. Elle marcha jusqu'aux rochers, s'assit, et attendit sans savoir quoi. Le bruit de la mer revenait par petites vagues espacées, de plus en plus proches, et il lui sembla qu'on s'approchait d'elle, doucement, pour ne pas l'effrayer.",
      "Quand elle remonta, la marée avait recouvert ses traces. Dans la cuisine, la petite clef était posée sur le cahier, bien au centre de la page du jour. Elle était certaine de l'avoir laissée dans sa poche. Elle prit un crayon, et, sous les deux colonnes de chiffres, dans la marge, elle écrivit : « Elle est venue. »",
      "La nuit tomba d'un coup, comme tombent les nuits de bord de mer, sans crépuscule. Lucie ferma les volets l'un après l'autre, en comptant les crochets. Il en manquait un, au rez-de-chaussée, côté plage. Elle le laissa ouvert. Sur le seuil, l'eau montait déjà, très lentement, avec la politesse de quelqu'un qui connaît les lieux.",
    ],
  },
  "heures-creuses": {
    chap: "III", titre: "Le remontoir", pages: "192 p.", format: "11,5 × 18 cm", parution: "Mars 2025",
    textes: [
      "Monsieur Aubertin n'aimait pas les horloges qui sonnent. Il les réparait avec patience et sans reproche, mais il en parlait comme d'amis un peu bruyants, qu'on invite à condition qu'ils partent avant minuit. Son atelier, rue des Tanneurs, ne comptait pas moins de quarante pendules en cours de convalescence, et pas une n'indiquait la même heure.",
      "Cet après-midi-là, une femme entra avec un carton à chapeau. Elle le posa sur l'établi sans un mot, défit la ficelle et sortit un petit mouvement de cuivre, nu, sans cadran ni boîte, qu'elle tenait de la main gauche comme on tient un oiseau. « Il ne démarre plus, dit-elle. Mon père disait qu'il fallait lui parler. »",
      "Aubertin ajusta sa loupe. Le mouvement était d'une facture ancienne, rare, avec un échappement à cheville qu'il n'avait vu qu'en gravure. Il le prit, le souleva à hauteur d'oreille, et attendit. On n'entendait rien, bien sûr. Mais il lui sembla que la pièce se mettait à écouter avec lui.",
      "« Revenez jeudi », dit-il. Elle hocha la tête, laissa le carton, et partit sans demander le prix. Pendant trois jours, il ne toucha à rien d'autre. Il nettoya chaque pignon à la pointe de bois, détendit le ressort, graissa les pivots d'une goutte d'huile à peine visible, et ne parla pas, non plus, à la mouche qui tournait autour de sa lampe.",
      "Le jeudi matin, il remonta le ressort d'un demi-tour. Rien. D'un tour entier. Rien encore. Alors, par une habitude dont il n'aurait su dire l'origine, il posa le mouvement sur sa paume et murmura : « Allons. » L'aiguille de la seconde, qui n'existait pas, sembla tressaillir. Quelque chose se mit à battre, très doucement, au creux de sa main.",
    ],
  },
  "cartographie-du-silence": {
    chap: "II", titre: "Ce que dit une pièce vide", pages: "96 p.", format: "11 × 17 cm", parution: "Janvier 2026",
    textes: [
      "On croit qu'une pièce vide ne dit rien. C'est l'inverse : elle parle d'autant plus qu'on l'a débarrassée. Les murs gardent le pâle rectangle des cadres décrochés, le parquet la rayure d'un fauteuil, et l'air lui-même, légèrement plus froid que dans le couloir, donne une idée assez exacte de ce qui s'y est tenu.",
      "J'ai passé un hiver à visiter des appartements en vente, sans rien vouloir acheter. Les agents me prenaient pour une cliente exigeante. J'étais surtout une écouteuse. Dans chaque pièce, je restais immobile une minute, et je notais ce que j'entendais : un radiateur, une chasse d'eau chez le voisin, le grain d'une voix qui montait de la cour.",
      "Le silence n'est jamais une absence. C'est une matière que l'on traverse, plus ou moins dense selon les lieux. Celui d'une bibliothèque est épais et poli, il a la patine des choses touchées. Celui d'une salle d'attente est tendu comme une toile : un seul toussotement et il se déchire, et tout le monde fait semblant de n'avoir rien entendu.",
      "Il existe pourtant un silence qui n'appartient à personne, et c'est celui que je cherche ici. Il ne vient ni du respect ni de la gêne. Il s'installe quand une conversation s'est bien terminée, quand les derniers invités sont partis, quand il ne reste dans la cuisine que des verres rincés et la certitude confuse que quelque chose a eu lieu.",
      "Dessiner sa carte demande des instruments modestes : un carnet, un crayon, une montre, et la patience de ne pas conclure. On y porte les lieux comme des îles, on y trace les courants d'un bruit à l'autre, et on laisse volontairement des blancs. Les blancs sont ce qu'il y a de plus exact sur une carte du silence.",
    ],
  },
};

const EVENTS = [
  ["jeu.", "12", "nov.", "19 h 00", "Lecture-rencontre « La Maison des marées »", "Élise Marvanne en conversation avec une libraire", "Librairie La Passerelle, Lyon", "rencontre"],
  ["sam.", "21", "nov.", "16 h 00", "Atelier d'écriture : la nouvelle en une page", "Théodore Quillevic, pour débutants et confirmés", "Médiathèque des Quais, Nantes", "rencontre"],
  ["mar.", "1", "déc.", "18 h 30", "Soirée poésie à voix haute", "Mathilde Sauveterre lit « Sel et cendre »", "Café des Archers, Toulouse", "rencontre"],
  ["ven.", "11", "déc.", "20 h 00", "Table ronde : écrire le silence", "Anaïs Doreval et Jeanne Vauclair", "Maison du Livre, Dijon", "rencontre"],
  ["sam.", "16", "janv.", "11 h 00", "Dédicace de printemps", "Basile Ormerod et Octave Lenormel", "Librairie du Phare, Lille", "rencontre"],
  ["jeu.", "4", "févr.", "19 h 00", "Présentation de la rentrée de janvier", "L'équipe éditoriale commente les nouveautés", "Siège des éditions, Lyon", "rencontre"],
];
const NEWS = [
  ["Parution", "14 oct. 2026", "« La Maison des marées » rejoint la collection Marges", "Le nouveau roman d'Élise Marvanne paraît ce mois-ci, sous une couverture toile bordeaux et dans un papier vergé choisi avec l'imprimeur.", "parution"],
  ["Coulisses", "2 oct. 2026", "Comment on choisit un papier", "Grammage, main, blancheur : une après-midi à l'imprimerie pour décider si le roman sera plus doux ou plus vif sous le doigt.", "coulisses"],
  ["Parution", "9 sept. 2026", "Mathilde Sauveterre, première lecture de « Sel et cendre »", "Un recueil à l'italienne que l'on lit debout, comme un carnet de notes de bord. Quelques poèmes lisibles en ligne.", "parution"],
  ["Coulisses", "21 août 2026", "Le correcteur et la virgule", "Une journée avec notre correcteur, qui défend depuis vingt ans l'idée qu'une virgule est une respiration et non un caprice.", "coulisses"],
  ["Parution", "30 juin 2026", "« Cartographie du silence » : réimpression en cours", "Le petit essai d'Anaïs Doreval retourne à l'imprimerie, avec une couverture légèrement plus claire.", "parution"],
  ["Coulisses", "5 juin 2026", "Du manuscrit au livre : les neuf étapes", "Lecture, réécriture, correction, maquette, épreuves, bon à tirer, impression, façonnage, mise en place : la chaîne complète.", "coulisses"],
];

// ---------- éléments dessinés ----------
const fleuron = `<svg class="cf-fl" viewBox="0 0 140 22" aria-hidden="true"><line x1="4" y1="11" x2="48" y2="11" stroke="currentColor" stroke-width="1"/><line x1="92" y1="11" x2="136" y2="11" stroke="currentColor" stroke-width="1"/><path d="M70 2c-5 5-5 12 0 18 5-6 5-13 0-18z" fill="currentColor"/><path d="M58 11c-3-5-6-5-8-3 3 0 5 2 8 3zM82 11c3-5 6-5 8-3-3 0-5 2-8 3zM58 11c-3 5-6 5-8 3 3 0 5-2 8-3zM82 11c3 5 6 5 8 3-3 0-5-2-8-3z" fill="currentColor"/></svg>`;
const arrow = `<svg class="cf-ar" viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6h20m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;

const dots = () => { let s = ""; for (let y = 0; y < 9; y++) for (let x = 0; x < 6; x++) s += `<circle cx="${30 + x * 28}" cy="${40 + y * 26}" r="${2 + ((x + y) % 3)}" fill="currentColor"/>`; return s; };
const waves = () => [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M0 ${120 + i * 22}q25-18 50 0t50 0t50 0t50 0" fill="none" stroke="currentColor" stroke-width="${1 + (i % 3)}" opacity="${0.95 - i * 0.08}"/>`).join("");
const squares = () => [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${40 + i * 10}" y="${70 + i * 10}" width="${120 - i * 20}" height="${120 - i * 20}" fill="none" stroke="currentColor" stroke-width="${i % 2 ? 1 : 2}"/>`).join("");
const MOTIFS = [
  () => [0, 1, 2, 3, 4].map((i) => `<rect x="0" y="${140 + i * 24}" width="200" height="${3 + i * 3}" fill="currentColor" opacity="${0.95 - i * 0.12}"/>`).join("") + `<circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" stroke-width="2"/>`,
  () => `<circle cx="100" cy="125" r="46" fill="currentColor" opacity=".92"/><line x1="0" y1="170" x2="200" y2="170" stroke="currentColor" stroke-width="2"/>` + [0, 1, 2, 3].map((i) => `<line x1="${70 + i * 10}" y1="${180 + i * 9}" x2="${130 - i * 10}" y2="${180 + i * 9}" stroke="currentColor" stroke-width="2"/>`).join(""),
  () => `<path d="M40 210V120a60 60 0 0 1 120 0v90z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M62 210V122a38 38 0 0 1 76 0v88z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M84 210V124a16 16 0 0 1 32 0v86z" fill="currentColor"/>`,
  dots,
  waves,
  () => `<polygon points="0,110 200,50 200,300 0,300" fill="currentColor" opacity=".9"/><line x1="0" y1="110" x2="200" y2="50" stroke="currentColor" stroke-width="3"/><circle cx="150" cy="40" r="14" fill="none" stroke="currentColor" stroke-width="2"/>`,
  squares,
  () => `<line x1="100" y1="70" x2="100" y2="230" stroke="currentColor" stroke-width="2"/>` + [0, 1, 2, 3, 4].map((i) => `<ellipse cx="${100 + (i % 2 ? 22 : -22)}" cy="${100 + i * 28}" rx="20" ry="9" transform="rotate(${i % 2 ? -28 : 28} ${100 + (i % 2 ? 22 : -22)} ${100 + i * 28})" fill="currentColor" opacity=".9"/>`).join("") + `<circle cx="100" cy="62" r="7" fill="currentColor"/>`,
];
const cover = (b, cls = "", css = false) => `<div class="cf-cv cf-t${b.tone} ${cls}${css ? " cf-m" + b.m : ""}">${css ? "" : `<svg class="cf-cv-m" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${MOTIFS[b.m]()}</svg>`}<span class="cf-cv-c">${esc(COL[b.c])}</span><span class="cf-cv-t">${esc(b.t)}</span><span class="cf-cv-a">${esc(AU[b.a][0])}</span></div>`;
const bookUrl = (b) => (b.ex ? `/livre#${b.s}` : `/catalogue#${b.s}`);
const spine = (b, href) => `<a class="cf-spine cf-t${b.tone} cf-sh${b.h} cf-w${b.w}" href="${href || bookUrl(b)}" data-slug="${b.s}" aria-label="${esc(b.t)}, ${esc(AU[b.a][0])}, ${b.y}"><span class="cf-sp-t">${esc(b.t)}</span><i class="cf-sp-m" aria-hidden="true"></i></a>`;
const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// ---------- en-tête / pied ----------
const header = (c) => {
  const folios = [1, 14, 38, 52, 64, 78, 90];
  const items = c.menu.map((m, i) => `<a class="cf-toc-i" href="${esc(m.url)}"><i>${roman[i]}</i><span>${esc(m.label)}</span><u aria-hidden="true"></u><b>${folios[i] || 99}</b></a>`).join("");
  const list = c.menu.map((m, i) => `<a class="cf-toc-i" href="${esc(m.url)}"><i>${roman[i]}</i><span>${esc(m.label)}</span><u aria-hidden="true"></u><b>${folios[i] || 99}</b></a>`).join("");
  return `<header class="cf-head pk-bleed"><div class="cf-top"><p class="cf-run">Maison d'édition indépendante<br>Lyon · fondée en 1987</p>
    <a class="cf-logo" href="/"><span class="cf-logo-s">Éditions du</span><span class="cf-logo-w">Colophon</span>${fleuron}</a>
    <p class="cf-run cf-run--r"><a href="/recherche">Rechercher</a><br><a href="/manuscrits">Envoyer un manuscrit</a></p></div>
    <div class="cf-toc" role="navigation" aria-label="Table des matières du site"><span class="cf-toc-h">Table des matières</span>${items}</div>
    <details class="cf-menu"><summary><span>Table des matières</span><svg viewBox="0 0 20 14" aria-hidden="true"><path d="M1 2h18M1 7h18M1 12h18" stroke="currentColor" stroke-width="1.6"/></svg></summary><div class="cf-menu-l" role="navigation" aria-label="Menu mobile">${list}</div></details></header>`;
};
const footer = (c) => `<footer class="cf-foot pk-bleed"><div class="cf-foot-in"><div class="cf-foot-col"><p class="cf-foot-w">Colophon</p><p>Éditions du Colophon<br>9 rue des Imprimeurs · 69002 Lyon<br><small>(adresse fictive)</small></p></div>
  <div class="cf-foot-col"><h2>Lire</h2><a href="/catalogue">Catalogue</a><a href="/livre">Un extrait</a><a href="/auteurs">Auteurs</a><a href="/collections">Collections</a></div>
  <div class="cf-foot-col"><h2>La maison</h2><a href="/actualites">Rencontres et actualités</a><a href="/manuscrits">Manuscrits</a><a href="/contact">Contact</a><a href="/recherche">Recherche</a></div></div>
  <div class="cf-colo"><p class="cf-colo-t">Achevé de composer en EB Garamond et Crimson Pro,<br>sur une page imaginaire, au mois de novembre deux mille vingt-six.</p>${fleuron}<p class="cf-legal">© Éditions du Colophon — site de démonstration. Maison, livres, auteurs et extraits sont entièrement fictifs.</p></div></footer>`;

const pagehead = (kicker, title, sub, folio) => sec(`<section class="cf-ph pk-bleed"><p class="cf-run-t" data-reveal>${esc(kicker)}</p><div class="cf-ph-t" role="heading" aria-level="1" data-reveal>${title}</div>${fleuron}${sub ? `<p class="cf-ph-s" data-reveal>${esc(sub)}</p>` : ""}<span class="cf-folio" aria-hidden="true">${folio || ""}</span></section>`);

// ---------- pièces communes ----------
const shelfBand = (list, cls = "") => `<div class="cf-shelf ${cls}">${list.map((b) => `<div class="cf-slot">${spine(b)}</div>`).join("")}</div>`;
const eventRow = (e) => `<li class="cf-ev" data-kind="${e[7]}"><time class="cf-ev-d"><span>${e[0]}</span><b>${e[1]}</b><span>${e[2]}</span></time><div class="cf-ev-b"><h3>${esc(e[4])}</h3><p>${esc(e[5])}</p></div><p class="cf-ev-l"><u aria-hidden="true"></u>${e[3]} · ${esc(e[6])}</p></li>`;

const stats = () => `<section class="cf-stats pk-bleed"><ul class="cf-stats-in"><li data-reveal><b data-count="212">212</b><span>titres au catalogue</span></li><li data-reveal><b data-count="38">38</b><span>autrices et auteurs</span></li><li data-reveal><b data-count="4">4</b><span>collections</span></li><li data-reveal><b data-count="1987">1987</b><span>première page tournée</span></li></ul></section>`;

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="cf-hero pk-bleed"><div class="cf-hero-in"><div class="cf-hero-c"><p class="cf-kick" data-reveal>Rentrée littéraire 2026 · Maison d'édition</p>
    <div class="cf-h1" role="heading" aria-level="1" data-reveal>Des livres à lire <em>lentement.</em></div>
    <p class="cf-lead" data-reveal>Romans, nouvelles, poésie et essais : des textes courts et patients, imprimés sur du beau papier et défendus un par un. Ouvrez le livre ci-dessous, c'est déjà un extrait.</p>
    <div class="cf-act" data-reveal><a class="cf-btn" href="/catalogue">Parcourir le catalogue ${arrow}</a><a class="cf-btn cf-btn--l" href="/livre">Lire un extrait</a></div></div></div>
    <div class="cf-spread-w"><div class="cf-spread" data-reveal><div class="cf-pg cf-pg--l"><p class="cf-rh">La Maison des marées</p><p class="cf-ch"><span>Chapitre premier</span><b>Le seuil</b></p>
      <p class="cf-dc">Quand Lucie arriva à la maison, la mer s'était retirée depuis longtemps et avait laissé sur la grève cette odeur de linge mouillé qu'on ne retrouve nulle part ailleurs. Le notaire lui avait remis trois clefs sur un anneau de laiton, en précisant que la plus petite n'ouvrait rien de connu.</p>
      <p>Elle posa sa valise dans le couloir. Le carrelage portait encore, à hauteur de plinthe, une ligne claire, très droite, comme si quelqu'un avait tiré un trait au cordeau sur les murs.</p><span class="cf-fo">7</span></div>
      <div class="cf-pg cf-pg--r"><p class="cf-rh">Élise Marvanne</p><p>Elle mit un moment à comprendre que c'était la trace de l'eau, celle des grandes marées de mars, qui montait jusqu'ici sans jamais déranger personne.</p>
      <p>Dans la cuisine, un cahier à couverture toile était ouvert sur la table. Sa grand-mère y notait chaque matin deux colonnes de chiffres, l'une pour l'heure, l'autre pour le coefficient, et dans la marge, une seule phrase : « Elle est venue » ou « Elle n'est pas venue ».</p>
      <aside class="cf-mg"><span>Note en marge</span>Qui est « elle » ? La réponse tient en une clef de laiton.</aside><span class="cf-fo">8</span><i class="cf-leaf" aria-hidden="true"></i></div></div></div></section>`),
  sec(`<section class="cf-intro pk-bleed"><div class="cf-w cf-intro-g"><div data-reveal><p class="cf-kick">Le livre du mois</p><h2 class="cf-h2">La Maison des marées</h2><p class="cf-by">roman d'Élise Marvanne · collection Marges · 248 pages</p>
    <p class="cf-body cf-dc">Lucie hérite d'une maison que la mer visite deux fois par jour. Entre les registres du notaire et les cahiers de sa grand-mère, elle apprend à lire l'eau, ses retours et ses oublis. Un roman de seuils, de sel et de patience.</p>
    <p class="cf-act"><a class="cf-btn" href="/livre">Lire l'extrait ${arrow}</a><a class="cf-btn cf-btn--l" href="/auteurs">Rencontrer l'autrice</a></p></div>
    <div class="cf-intro-cv" data-reveal>${cover(bySlug("maison-des-marees"), "cf-cv--xl")}<aside class="cf-mg cf-mg--c"><span>Fabrication</span>Couverture toile, papier vergé ivoire, dos carré cousu.</aside></div></div></section>`),
  sec(`<section class="cf-rayon pk-bleed"><div class="cf-w"><div class="cf-sechead"><div><p class="cf-kick" data-reveal>Au rayonnage</p><h2 class="cf-h2" data-reveal>Les derniers livres.</h2></div><a class="cf-more" href="/catalogue">Tout le catalogue ${arrow}</a></div>
    ${shelfBand(B)}<p class="cf-hint">Chaque dos est un livre. Passez dessus pour le sortir du rayon.</p></div></section>`),
  sec(stats()),
  sec(`<section class="cf-auth pk-bleed"><div class="cf-w"><div class="cf-sechead"><div><p class="cf-kick" data-reveal>Les voix de la maison</p><h2 class="cf-h2" data-reveal>Ceux qui écrivent ici.</h2></div><a class="cf-more" href="/auteurs">Toutes les notices ${arrow}</a></div>
    <ul class="cf-au-row">${["marvanne", "quillevic", "doreval", "sauveterre"].map((k) => `<li class="cf-aucard" data-reveal><span class="cf-mono">${AU[k][1]}</span><h3>${esc(AU[k][0])}</h3><p>${esc(AU[k][3].split(". ")[0])}.</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="cf-quote pk-bleed"><div class="cf-w"><blockquote data-reveal><p>« Le silence n'est jamais une absence. C'est une matière que l'on traverse, plus ou moins dense selon les lieux. »</p><footer>Anaïs Doreval, <cite>Cartographie du silence</cite>, extrait</footer></blockquote></div></section>`),
  sec(`<section class="cf-ren pk-bleed"><div class="cf-w cf-ren-g"><div data-reveal><p class="cf-kick">Rencontres</p><h2 class="cf-h2">Au programme.</h2><p class="cf-body">Lectures, ateliers et soirées en librairie, de Lyon à Lille. Toutes les dates sont fictives dans cette démonstration.</p><a class="cf-more" href="/actualites">Tout l'agenda ${arrow}</a></div>
    <ol class="cf-evl" data-reveal>${EVENTS.slice(0, 4).map(eventRow).join("")}</ol></div></section>`),
  sec(`<section class="cf-band pk-bleed"><div class="cf-w cf-band-in"><div data-reveal><p class="cf-kick cf-kick--l">Manuscrits</p><h2 class="cf-h2 cf-h2--l">Vous écrivez ? Nous lisons.</h2></div><div data-reveal><p class="cf-body">Chaque envoi est lu par deux personnes de la maison, qui répondent toujours. Voici comment procéder.</p><a class="cf-btn cf-btn--p" href="/manuscrits">Envoyer un manuscrit ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

// ---------- catalogue ----------
const chips = (name, label, pairs) => `<div class="cf-fg" data-filter="${name}"><h3>${label}</h3><div class="cf-chips"><a href="#tous" class="is-on" data-v="tous" role="button" aria-pressed="true">Tous</a>${pairs.map(([v, l]) => `<a href="#f-${v}" data-v="${v}" role="button" aria-pressed="false">${esc(l)}</a>`).join("")}</div></div>`;
const bookItem = (b) => `<article class="cf-bk" data-slug="${b.s}" data-genre="${b.g}" data-auteur="${b.a}" data-annee="${b.y}" data-coll="${b.c}" data-ex="${b.ex}">
  ${spine(b, "#" + b.s).replace('class="cf-spine', 'role="button" class="cf-spine')}<div class="cf-card"><a class="cf-card-a" href="#${b.s}" role="button" aria-label="Voir ${esc(b.t)}">${cover(b, "", true)}</a><div class="cf-card-in"><p class="cf-gen">${GEN[b.g]} · ${esc(COL[b.c])} · ${b.y}</p><h3>${esc(b.t)}</h3><p class="cf-by">${esc(AU[b.a][0])}</p><p class="cf-res">${esc(b.r)}</p></div></div></article>`;
const catalogue = (c) => [sec(header(c)), pagehead("Catalogue 2022 – 2026", "Le <em>catalogue</em>", "Douze livres, quatre collections. Filtrez par genre, auteur, année ou collection ; rangez-les en rayonnage ou en cartes.", "14"),
  sec(`<section class="cf-cat pk-bleed"><div class="cf-w"><aside class="cf-filters" aria-label="Filtres du catalogue"><details class="cf-fd" open><summary>Affiner le catalogue</summary>
    ${chips("genre", "Genre", Object.entries(GEN))}${chips("coll", "Collection", Object.entries(COL))}${chips("annee", "Année", [2026, 2025, 2024, 2023, 2022].map((y) => [y, String(y)]))}${chips("auteur", "Auteur", Object.entries(AU).map(([k, v]) => [k, v[0]]))}
    <a class="cf-reset" href="#raz" role="button">Réinitialiser les filtres</a></details></aside></div></section>`),
  sec(`<section class="cf-cat cf-cat--r pk-bleed"><div class="cf-w"><div class="cf-res-w"><div class="cf-bar"><p class="cf-count" aria-live="polite"><b>12</b> livres</p><div class="cf-views" role="group" aria-label="Affichage"><a href="#rayon" class="is-on" data-view="shelf" role="button" aria-pressed="true">Rayonnage</a><a href="#cartes" data-view="cards" role="button" aria-pressed="false">Cartes</a></div></div>
    <aside class="cf-detail" hidden aria-live="polite" aria-label="Fiche du livre choisi"></aside>
    <div class="cf-list" data-view="shelf">${B.map(bookItem).join("")}</div><p class="cf-empty" hidden>Aucun livre ne correspond à ces critères. Réinitialisez un filtre.</p></div></div></section>`),
  sec(footer(c))];

// ---------- livre ----------
const edition = (b, i) => {
  const e = EXTRAITS[b.s], au = AU[b.a];
  return `<article class="cf-ed" data-ed="${b.s}"><div class="cf-w cf-fiche"><div class="cf-fiche-cv">${cover(b, "cf-cv--xl")}</div>
    <div class="cf-fiche-t"><p class="cf-kick">${GEN[b.g]} · ${esc(COL[b.c])}</p><h2 class="cf-h2">${esc(b.t)}</h2><p class="cf-by">${esc(au[0])}</p><p class="cf-body">${esc(b.r)}</p>
    <dl class="cf-dl"><div><dt>Parution</dt><dd>${e.parution}</dd></div><div><dt>Volume</dt><dd>${e.pages}</dd></div><div><dt>Format</dt><dd>${e.format}</dd></div><div><dt>Auteur</dt><dd><a href="/auteurs">${esc(au[0])}</a></dd></div></dl>
    <p class="cf-note-s">Démonstration : le livre et son extrait sont inventés. Pour toute demande de service de presse, <a href="/contact">écrivez-nous</a>.</p></div></div>
    <div class="cf-w"><div class="cf-reader" data-reader data-theme="paper" data-slug="${b.s}"><div class="cf-rbar" role="toolbar" aria-label="Réglages de lecture">
      <p class="cf-rt"><span>Extrait</span> Chapitre ${e.chap} · ${esc(e.titre)}</p>
      <div class="cf-rtools"><a href="#taille-moins" data-act="sm" role="button" aria-label="Réduire la taille du texte">A<small>−</small></a><a href="#taille-plus" data-act="sp" role="button" aria-label="Agrandir la taille du texte">A<sup>+</sup></a>
      <span class="cf-sw" role="group" aria-label="Papier"><a href="#papier" data-th="paper" role="button" aria-pressed="true">Papier</a><a href="#sepia" data-th="sepia" role="button" aria-pressed="false">Sépia</a><a href="#nuit" data-th="night" role="button" aria-pressed="false">Nuit</a></span></div></div>
      <div class="cf-view" aria-label="Extrait de ${esc(b.t)}, utilisez les flèches pour tourner les pages"><div class="cf-flow"><h3 class="cf-ch2"><span>Chapitre ${e.chap}</span>${esc(e.titre)}</h3>${e.textes.map((t, k) => `<p${k === 0 ? ' class="cf-dc"' : ""}>${esc(t)}</p>`).join("")}<p class="cf-endx">Fin de l'extrait. <a href="/contact">Demander le livre à la maison</a></p></div></div>
      <div class="cf-rfoot"><a href="#prec" data-act="pv" role="button" aria-label="Page précédente">${arrow}</a><div class="cf-prog"><div class="cf-bar2" role="progressbar" aria-label="Progression de la lecture" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><p class="cf-pgn" aria-live="polite">Pages 1–2 sur —</p></div><a href="#suiv" data-act="nx" role="button" aria-label="Page suivante">${arrow}</a></div>
      <p class="cf-keys">Clavier : ← → pour tourner les pages · + − pour la taille · T pour changer de papier.</p></div></div></article>`;
};
const livre = (c) => [sec(header(c)), pagehead("Fiche et extrait", "Lire <em>avant</em> d'acheter", "Trois extraits à lire en mode livre : tournez les pages, changez la taille du texte, passez en sépia ou en lecture de nuit.", "38"),
  sec(`<section class="cf-pick pk-bleed"><div class="cf-w"><p class="cf-kick">Choisir un livre</p><div class="cf-pickl" role="group" aria-label="Livres disponibles en extrait">${Object.keys(EXTRAITS).map((s, i) => { const b = bySlug(s); return `<a class="cf-pickb${i ? "" : " is-on"}" href="#${s}" data-pick="${s}" role="button" aria-pressed="${i ? "false" : "true"}"><span class="cf-pickc">${cover(b)}</span><span><b>${esc(b.t)}</b><small>${esc(AU[b.a][0])}</small></span></a>`; }).join("")}</div></div></section>`),
  sec(`<section class="cf-eds pk-bleed">${Object.keys(EXTRAITS).map((s, i) => edition(bySlug(s), i)).join("")}</section>`),
  sec(footer(c))];

// ---------- auteurs ----------
const auteurs = (c) => [sec(header(c)), pagehead("Dictionnaire des voix", "Les <em>auteurs</em>", "Huit notices, par ordre alphabétique, comme dans un dictionnaire de bibliothèque.", "52"),
  sec(`<section class="cf-dico pk-bleed"><div class="cf-w"><p class="cf-az" aria-hidden="true">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p><div class="cf-cols">
  ${Object.entries(AU).sort((a, b) => a[1][0].split(" ").pop().localeCompare(b[1][0].split(" ").pop(), "fr")).map(([k, v]) => { const oe = B.filter((b) => b.a === k); return `<article class="cf-notice" data-reveal><div class="cf-mono cf-mono--l">${v[1]}</div><h2 class="cf-hw"><b>${esc(v[0].split(" ").slice(1).join(" ").toUpperCase())}</b>, ${esc(v[0].split(" ")[0])}</h2><p class="cf-dates">${esc(v[2])}</p><p class="cf-body">${esc(v[3])}</p>
    <ul class="cf-works">${oe.map((b) => `<li><a href="${bookUrl(b)}"><em>${esc(b.t)}</em></a><u aria-hidden="true"></u><span>${b.y}</span></li>`).join("")}</ul></article>`; }).join("")}</div></div></section>`),
  sec(footer(c))];

// ---------- collections ----------
const COLS = [
  ["marges", "Marges", "Le roman, en toute liberté", "Romans de 180 à 320 pages, brochés à rabats. Une collection qui laisse de la place dans la marge pour les doutes du lecteur.", "12,5 × 20 cm", "Vergé ivoire 90 g", "Toile bordeaux", 1],
  ["fil", "Fil d'encre", "La poésie qui se lit debout", "Recueils brefs, au format à l'italienne, imprimés en un ou deux noirs. Un poème par page, jamais plus.", "14 × 19 cm à l'italienne", "Bouffant crème 100 g", "Couverture cartonnée sable", 5],
  ["reliure", "Petite Reliure", "La nouvelle à l'unité", "Des recueils de sept à dix nouvelles, au dos cousu et à la couverture toile. Pensés pour la poche d'un manteau.", "11,5 × 18 cm", "Offset ivoire 80 g", "Toile verte", 3],
  ["cahiers", "Cahiers du soir", "L'essai en quatre-vingt-seize pages", "Des essais courts, écrits pour être lus d'une traite. Une couverture claire, une seule couleur d'encre.", "11 × 17 cm", "Bouffant 90 g", "Couverture crème", 2],
];
const collections = (c) => [sec(header(c)), pagehead("Quatre reliures", "Les <em>collections</em>", "Chaque collection a son format, son papier et sa couleur de reliure : on reconnaît un livre à son dos.", "64"),
  sec(`<section class="cf-colls pk-bleed"><div class="cf-w">${COLS.map(([k, n, tag, d, f, p, rel, tone], i) => { const bs = B.filter((b) => b.c === k); return `<article class="cf-coll${i % 2 ? " cf-coll--r" : ""}" data-reveal><div class="cf-coll-sp cf-t${bs[0].tone}"><span>${esc(n)}</span><i aria-hidden="true"></i></div><div class="cf-coll-t"><p class="cf-kick">Collection ${roman[i]}</p><h2 class="cf-h2">${esc(n)}</h2><p class="cf-by">${esc(tag)}</p><p class="cf-body">${esc(d)}</p>
    <dl class="cf-dl"><div><dt>Format</dt><dd>${f}</dd></div><div><dt>Papier</dt><dd>${p}</dd></div><div><dt>Reliure</dt><dd>${rel}</dd></div></dl></div><div class="cf-coll-s">${shelfBand(bs, "cf-shelf--s")}</div></article>`; }).join("")}</div></section>`),
  sec(`<section class="cf-cmp pk-bleed"><div class="cf-w"><h2 class="cf-h2" data-reveal>Les collections en un coup d'œil</h2>
  <table class="cf-tbl" data-reveal><caption class="cf-sr">Comparaison des quatre collections</caption><thead><tr><th>Collection</th><th>Genre</th><th>Pages</th><th>Titres</th></tr></thead><tbody>
  <tr><td data-l="Collection">Marges</td><td data-l="Genre">Roman</td><td data-l="Pages">180 – 320</td><td data-l="Titres">${B.filter((b) => b.c === "marges").length}</td></tr>
  <tr><td data-l="Collection">Fil d'encre</td><td data-l="Genre">Poésie</td><td data-l="Pages">64 – 96</td><td data-l="Titres">${B.filter((b) => b.c === "fil").length}</td></tr>
  <tr><td data-l="Collection">Petite Reliure</td><td data-l="Genre">Nouvelles</td><td data-l="Pages">160 – 220</td><td data-l="Titres">${B.filter((b) => b.c === "reliure").length}</td></tr>
  <tr><td data-l="Collection">Cahiers du soir</td><td data-l="Genre">Essai</td><td data-l="Pages">80 – 112</td><td data-l="Titres">${B.filter((b) => b.c === "cahiers").length}</td></tr></tbody></table></div></section>`),
  sec(footer(c))];

// ---------- actualités / rencontres ----------
const actualites = (c) => [sec(header(c)), pagehead("Gazette de la maison", "Rencontres &amp; <em>actualités</em>", "Où nous trouver, ce qui paraît, ce qui se fabrique.", "78"),
  sec(`<section class="cf-gaz pk-bleed" data-tabs><div class="cf-w"><div class="cf-tabs" role="group" aria-label="Filtrer les actualités"><a href="#tout" class="is-on" data-tab="tout" role="button" aria-pressed="true">Tout</a><a href="#rencontre" data-tab="rencontre" role="button" aria-pressed="false">Rencontres</a><a href="#parution" data-tab="parution" role="button" aria-pressed="false">Parutions</a><a href="#coulisses" data-tab="coulisses" role="button" aria-pressed="false">Coulisses</a></div>
  <div class="cf-gz-g"><div><h2 class="cf-h3">Agenda des rencontres</h2><ol class="cf-evl">${EVENTS.map(eventRow).join("")}</ol></div>
  <div class="cf-news"><h2 class="cf-h3">Dans la marge</h2>${NEWS.map((n) => `<article class="cf-nw" data-kind="${n[4]}"><p class="cf-nw-m"><b>${n[0]}</b><time>${n[1]}</time></p><div><h3>${esc(n[2])}</h3><p>${esc(n[3])}</p></div></article>`).join("")}</div></div><p class="cf-empty" hidden>Rien dans cette rubrique pour l'instant.</p></div></section>`),
  sec(footer(c))];

// ---------- manuscrits ----------
const manuscrits = (c) => [sec(header(c)), pagehead("Aux auteurs à venir", "Envoyer un <em>manuscrit</em>", "Comment nous lisons, ce que nous cherchons, et comment nous vous répondons.", "90"),
  sec(`<section class="cf-ms pk-bleed"><div class="cf-w cf-ms-g"><div class="cf-steps">${[
    ["Envoi", "Un texte complet (ou les cinquante premières pages), un court résumé, quelques lignes sur vous. Par le formulaire de contact, en indiquant « manuscrit » comme objet."],
    ["Première lecture", "Deux personnes de la maison lisent chaque texte, séparément, avec un cahier de notes. Aucune lecture n'est confiée à un logiciel."],
    ["Réponse", "Nous répondons toujours, avec deux ou trois phrases de lecture plutôt qu'un refus de circonstance. Le délai se compte en semaines, pas en jours."],
    ["Travail éditorial", "Si le texte nous retient, nous le relisons ensemble, crayon en main : réécriture, correction, maquette, épreuves, bon à tirer."],
  ].map((s, i) => `<article class="cf-step" data-reveal><b class="cf-stn">${roman[i]}</b><div><h2 class="cf-h3">${s[0]}</h2><p>${s[1]}</p></div></article>`).join("")}</div>
  <div class="cf-sheet-w" data-reveal><div class="cf-sheet" aria-label="Exemple de mise en page recommandée"><span class="cf-dim cf-dim--t">2,5 cm</span><span class="cf-dim cf-dim--l">3 cm</span><p class="cf-sh-h">Titre du manuscrit</p><p class="cf-sh-b">Il y avait ce matin-là, sur la place, une lumière de fin d'été que personne n'avait demandée. Elle posa son sac sur le banc et regarda les pigeons se disputer une miette…</p><p class="cf-sh-b cf-sh-b--f"></p><span class="cf-sh-f">— 1 —</span></div><p class="cf-cap">Mise en page conseillée : corps 12, interligne 1,5, pages numérotées.</p></div></div></section>`),
  sec(`<section class="cf-lk pk-bleed"><div class="cf-w cf-lk-g"><div data-reveal><h2 class="cf-h2">Ce que nous cherchons</h2><ul class="cf-chk"><li>Des romans de 150 à 320 pages, sans genre imposé</li><li>Des recueils de nouvelles cohérents</li><li>Des poèmes en recueils de 40 à 80 pages</li><li>Des essais courts, écrits d'une voix personnelle</li></ul></div>
  <div data-reveal><h2 class="cf-h2">Ce que nous ne publions pas</h2><ul class="cf-chk cf-chk--no"><li>Les manuscrits de plus de 450 pages</li><li>La littérature jeunesse et la bande dessinée</li><li>Les ouvrages pratiques et les guides</li><li>Les textes à compte d'auteur</li></ul></div></div></section>`),
  sec(`<section class="cf-faq pk-bleed"><div class="cf-w cf-faq-g"><h2 class="cf-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Puis-je envoyer un texte déjà publié ?</summary><p>Oui, si vous avez retrouvé vos droits. Précisez-le dans votre message.</p></details>
    <details data-reveal><summary>Faut-il un agent littéraire ?</summary><p>Non. Nous lisons les envois directs avec la même attention.</p></details>
    <details data-reveal><summary>Combien de temps dure la lecture ?</summary><p>Comptez plusieurs semaines. Cette page est une démonstration : aucun délai n'est réellement garanti.</p></details>
    <details data-reveal><summary>Comment envoyer mon texte ?</summary><p>Par le formulaire de contact : décrivez votre texte, nous reviendrons vers vous pour la suite.</p></details></div></div></section>`),
  sec(`<section class="cf-band pk-bleed"><div class="cf-w cf-band-in"><div><h2 class="cf-h2 cf-h2--l">Prêt à nous écrire ?</h2></div><div><a class="cf-btn cf-btn--p" href="/contact">Ouvrir le formulaire ${arrow}</a></div></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Écrire à la maison", "Contact", "Presse, libraires, manuscrits ou simple mot de lecteur : nous répondons à tous.", "98"),
  { type: "form", heading: "Écrire aux éditions", intro: "Indiquez l'objet de votre message (manuscrit, presse, librairie, lecture) : nous vous répondons par courrier électronique." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Index", "Rechercher", "Un titre, un auteur, un mot d'extrait.", "100"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un livre, un auteur…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cf-404 pk-bleed"><p class="cf-run-t">Erratum</p><div class="cf-ph-t" role="heading" aria-level="1">Page <em>manquante</em></div>${fleuron}<p class="cf-ph-s">Cette page a été arrachée, ou n'a jamais été imprimée. Retournez à la table des matières.</p><p class="cf-act cf-act--c"><a class="cf-btn" href="/">Retour à l'accueil</a><a class="cf-btn cf-btn--l" href="/catalogue">Le catalogue</a></p></section>`), sec(footer(c))];

module.exports = {
  key: "colophon", name: "Colophon", version: "2.0.0", category: "edition", tags: ["editorial", "classique", "luxe"], siteType: "Maison d'édition littéraire", featured: true,
  concept: "Une page imprimée qui s'ouvre : double page de livre avec extrait, table des matières en barre, rayonnage de dos de livres et lecteur d'extrait paginé.",
  description: "Maison d'édition littéraire : crème, encre et rouge de reliure, double page ouverte, catalogue en rayonnage ou en cartes filtrable, fiches d'auteurs en dictionnaire, extrait lisible en mode livre.",
  brand: "Éditions du Colophon", modules: ["formulaires", "recherche"],
  dna: { header: "table-des-matieres-en-barre-de-chapitres", hero: "double-page-ouverte-avec-extrait-et-notes-en-marge", grid: "rayonnage-de-dos-de-livres-et-cartes", motion: "page-qui-se-tourne-et-livres-tires-du-rayon", shapes: "pages-superposees-lettrines-et-dos-toile", rhythm: "pagine-par-chapitres-et-folios", signature: "catalogue-filtrable-et-lecteur-d-extrait-pagine" },
  tokens: {
    colors: { primary: "#8a2a34", secondary: "#231c17", accent: "#3a4a5e", background: "#f1e9d6", surface: "#f9f3e3", text: "#231c17", muted: "#5e5446", success: "#2f6b45", warning: "#8a5a00", error: "#a8231f" },
    fonts: { heading: "font.eb-garamond", body: "font.crimson-pro", button: "font.eb-garamond", link: "font.crimson-pro" },
    radius: { sm: 1, md: 2, lg: 3, button: 2, field: 2, card: 2 }, shadow: { card: "0 10px 24px rgba(35,28,23,.18)", button: "none" }, border: { width: 1, color: "#231c17" },
    type: { h1: { size: 76, weight: 500, lineHeight: 1.02 }, h2: { size: 44, weight: 500, lineHeight: 1.1 } },
  },
  options: [
    { key: "accent", label: "Rouge de reliure", type: "color", default: "#8a2a34" },
    { key: "paper", label: "Couleur du papier", type: "color", default: "#f1e9d6" },
    { key: "lettrines", label: "Lettrines", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "notes", label: "Notes en marge", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "grain", label: "Grain du papier", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Lisse"]] },
  ],
  menu: [["Accueil", "/"], ["Catalogue", "/catalogue"], ["Auteurs", "/auteurs"], ["Collections", "/collections"], ["Rencontres", "/actualites"], ["Manuscrits", "/manuscrits"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "catalogue", name: "Catalogue", render: catalogue }, { key: "livre", name: "Livre et extrait", render: livre },
    { key: "auteurs", name: "Auteurs", render: auteurs }, { key: "collections", name: "Collections", render: collections }, { key: "actualites", name: "Rencontres et actualités", render: actualites },
    { key: "manuscrits", name: "Manuscrits", render: manuscrits }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
