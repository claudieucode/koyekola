// Meeple — boutique et ludothèque de jeux de société. Direction artistique : une table de jeu. Tapis de feutrine vert profond (ou bleu canard), bois clair, pions rouge/bleu/jaune/vert ;
// plateau dessiné en haut de page où quatre pions avancent sur un chemin (dé lancé au clic, case qui s'ouvre sur une rubrique du site), navigation en pions posés sur des cases, boîtes de jeux dessinées en
// perspective, catalogue filtrable (âge, durée, joueurs, tri) avec fiche en panneau et aide « quel jeu ce soir ? », réservation d'une table vue de dessus qui renvoie vers /contact.
const { sec: kitSec, esc } = require("../kit");
// Le filtre de sécurité retire l'attribut hidden : les éléments à cacher portent data-mp-h, que le script convertit en vrai hidden
const sec = (html) => kitSec(String(html).replace(/ hidden(?=[ >])/g, " data-mp-h"));

// ---------- Données ----------
const CATS = {
  famille: ["Famille", "fam", "Des parties simples à expliquer, que les petits comme les grands finissent en riant."],
  strategie: ["Stratégie", "str", "Des plans à long terme, des choix serrés et ce petit sourire quand tout s'enchaîne."],
  ambiance: ["Ambiance", "amb", "Cartes sur table, rires garantis : des jeux qui font parler tout le monde."],
  coop: ["Coopératif", "coop", "On gagne ensemble ou on perd ensemble : une équipe contre le jeu."],
  duel: ["Duel", "duel", "Deux joueurs, une table, aucun répit. Bluff, tactique et revanches."],
  cartes: ["Cartes", "cartes", "Un paquet, quelques minutes, et la partie est lancée. Idéal à emporter."],
};
// Jeux fictifs (noms inventés). m = motif de la boîte ; mood = ambiance pour l'aide « quel jeu ce soir ? »
const G = [
  { id: "passeurs", n: "Les Passeurs de Brume", c: "strategie", age: 10, dur: 60, a: 2, b: 4, d: 4, mood: "cerveau", m: "hex", c1: "#2d6fd1", c2: "#f2b705", tag: "Posez des tuiles, ouvrez des routes à travers la brume et livrez vos cargaisons avant les autres.", rules: ["À votre tour, posez une tuile et prolongez un chemin avec l'un de vos pions.", "Chaque chemin fermé rapporte des cargaisons selon sa longueur.", "Après neuf manches, celui qui a livré le plus gagne la partie."], mech: ["Pose de tuiles", "Majorité", "Gestion de main"], inc: "72 tuiles, 24 pions, 4 plateaux joueurs, 1 sac en tissu" },
  { id: "caramba", n: "Caramba Express", c: "famille", age: 6, dur: 20, a: 2, b: 6, d: 1, mood: "rire", m: "dice", c1: "#d8352a", c2: "#f2b705", tag: "Une course de train en dés : qui arrivera le premier en gare sans dérailler ?", rules: ["Lancez les cinq dés et gardez ceux que vous voulez, jusqu'à trois lancers.", "Chaque combinaison fait avancer votre train d'autant de gares.", "Trois dérapages de suite et vous reculez : le premier à la gare finale gagne."], mech: ["Lancer de dés", "Course", "Prise de risque"], inc: "5 dés, 6 trains en bois, 1 piste pliable" },
  { id: "chuchotis", n: "Chuchotis", c: "ambiance", age: 8, dur: 30, a: 4, b: 8, d: 2, mood: "rire", m: "face", c1: "#7b4fb0", c2: "#ffd23f", tag: "Faites deviner un mot à votre équipe en chuchotant... sans jamais le dire.", rules: ["Tirez une carte : un mot secret et trois mots interdits.", "Votre équipe a une minute pour le deviner avec vos seuls indices chuchotés.", "Chaque mot trouvé fait avancer le pion de l'équipe : premier au sommet gagne."], mech: ["Indices", "Équipes", "Sablier"], inc: "300 cartes, 1 sablier, 2 pions, 1 piste" },
  { id: "phare", n: "Phare Rouge", c: "coop", age: 8, dur: 45, a: 2, b: 5, d: 3, mood: "equipe", m: "sun", c1: "#1d7a8c", c2: "#d8352a", tag: "La tempête arrive : l'équipe doit rallumer le phare avant la nuit.", rules: ["Chacun joue deux actions : se déplacer, réparer ou aider un équipier.", "À la fin du tour, la tempête avance et abîme une case de l'île.", "Si le phare est rallumé avant la dernière vague, tout le monde gagne."], mech: ["Coopération", "Gestion d'actions", "Pression du temps"], inc: "1 plateau d'île, 5 figurines, 40 cartes tempête, 20 jetons" },
  { id: "sommet", n: "Duel au Sommet", c: "duel", age: 10, dur: 20, a: 2, b: 2, d: 3, mood: "duel", m: "cards", c1: "#c2291f", c2: "#2d6fd1", tag: "Deux alpinistes, une seule cime : bluffez, grimpez et faites glisser l'autre.", rules: ["Chacun joue une carte face cachée, puis on les retourne ensemble.", "La plus forte avance d'une case, sauf si l'autre a bluffé avec un piolet.", "Le premier à atteindre le sommet gagne la manche ; deux manches suffisent."], mech: ["Bluff", "Cartes simultanées", "Course"], inc: "54 cartes, 2 alpinistes, 1 montagne en carton" },
  { id: "milledes", n: "Mille et un Dés", c: "famille", age: 5, dur: 15, a: 2, b: 5, d: 1, mood: "rire", m: "dice", c1: "#3aa655", c2: "#f2b705", tag: "Un conte oriental à jouer en lançant des dés géants, parfait dès cinq ans.", rules: ["Lancez le dé de couleur et déplacez votre tapis volant sur la case de même teinte.", "Une lampe magique vous offre un lancer bonus.", "Le premier tapis arrivé au palais gagne un tour de pistaches (en bois)."], mech: ["Lancer de dés", "Parcours", "Chance"], inc: "2 gros dés, 5 tapis volants, 1 plateau, 12 lampes" },
  { id: "forgerons", n: "Forgerons d'Ambre", c: "strategie", age: 12, dur: 120, a: 1, b: 4, d: 5, mood: "cerveau", m: "castle", c1: "#9a5a1c", c2: "#3aa655", tag: "Bâtissez votre forge, enchaînez les ressources et forgez la plus belle épée du royaume.", rules: ["Placez vos ouvriers sur les ateliers pour récolter minerai, bois et ambre.", "Transformez ces ressources en lames, boucliers et bijoux à vendre.", "Après six saisons, le royaume couronne la forge la plus prospère."], mech: ["Placement d'ouvriers", "Moteur de ressources", "Solo possible"], inc: "4 forges, 60 ouvriers, 120 jetons de ressources, 1 plateau double" },
  { id: "piquepique", n: "Pique-Pique", c: "cartes", age: 7, dur: 15, a: 2, b: 6, d: 1, mood: "rire", m: "cards", c1: "#16794f", c2: "#d8352a", tag: "Un jeu de cartes de rapidité où l'on tape sur le tas avant les autres.", rules: ["Chacun pose une carte à son tour sur le tas central.", "Dès que deux cartes identiques se suivent, tout le monde tape dessus !", "Le dernier à poser sa main ramasse le tas ; celui qui n'a plus de cartes gagne."], mech: ["Rapidité", "Réflexes", "Pioche"], inc: "60 cartes, 1 règle illustrée" },
  { id: "sentiers", n: "Les Sentiers du Vent", c: "famille", age: 8, dur: 40, a: 2, b: 4, d: 2, mood: "cerveau", m: "path", c1: "#ec8e1f", c2: "#2d6fd1", tag: "Reliez les villages de la vallée avant que le vent ne referme les sentiers.", rules: ["Piochez deux cartes sentier et posez-en une pour relier deux villages.", "Un village relié vous donne une carte récompense à utiliser plus tard.", "Quand la pioche est vide, le réseau le plus étendu l'emporte."], mech: ["Construction de réseau", "Collection", "Objectifs secrets"], inc: "1 plateau de vallée, 90 cartes, 40 pions, 8 villages" },
  { id: "contrebande", n: "Contrebande", c: "ambiance", age: 12, dur: 30, a: 3, b: 6, d: 2, mood: "rire", m: "face", c1: "#223a6b", c2: "#f2b705", tag: "Faites passer vos marchandises à la douane, mentez avec aplomb, démasquez les autres.", rules: ["Le douanier ouvre le tour : chacun présente un sac, annonce son contenu... ou ment.", "Le douanier fouille ou laisse passer ; le menteur pris paie une amende.", "Quand le sac de pièces est vide, le plus riche passeur gagne."], mech: ["Bluff", "Négociation", "Tour de rôle"], inc: "6 sacs, 120 marchandises, 80 pièces, 6 écrans" },
  { id: "lucioles", n: "Jardin des Lucioles", c: "coop", age: 6, dur: 25, a: 1, b: 4, d: 1, mood: "equipe", m: "sun", c1: "#2e8a5a", c2: "#ffd23f", tag: "Aidez les lucioles à rentrer au jardin avant la tombée de la nuit.", rules: ["Lancez le dé : il vous dit quelle luciole se déplace d'une fleur.", "Si l'araignée apparaît, elle avance d'un fil vers le jardin.", "Rentrez toutes les lucioles avant qu'elle n'arrive : vous gagnez ensemble."], mech: ["Coopération", "Lancer de dés", "Jeu solo possible"], inc: "1 plateau jardin, 6 lucioles, 1 araignée, 1 dé" },
  { id: "citadelles", n: "Citadelles de Sable", c: "strategie", age: 10, dur: 90, a: 2, b: 4, d: 4, mood: "cerveau", m: "castle", c1: "#c98d4a", c2: "#1d7a8c", tag: "Choisissez vos bâtisseurs, drafter vos plans et construisez la cité du désert la plus élégante.", rules: ["Chaque manche, chacun choisit un bâtisseur secret avec son pouvoir.", "Dépensez vos pièces pour poser des quartiers dans votre cité.", "La cité de huit quartiers ferme la partie : le plus beau score l'emporte."], mech: ["Draft", "Pouvoirs spéciaux", "Construction"], inc: "4 cités, 70 quartiers, 8 bâtisseurs, 100 pièces" },
  { id: "zero", n: "Zéro Pointé", c: "cartes", age: 10, dur: 20, a: 3, b: 7, d: 2, mood: "rire", m: "cards", c1: "#7b4fb0", c2: "#3aa655", tag: "Un jeu de plis où le but est de ne rien ramasser... ou de tout ramasser d'un coup.", rules: ["Chacun joue une carte et la plus haute ramasse le pli.", "Chaque carte ramassée vaut des points de pénalité, sauf le grand coup.", "Après sept manches, celui qui a le moins de points gagne."], mech: ["Plis", "Prise de risque", "Mémoire"], inc: "66 cartes, 1 bloc de score" },
  { id: "archipel", n: "Cap sur l'Archipel", c: "famille", age: 8, dur: 45, a: 2, b: 5, d: 2, mood: "equipe", m: "path", c1: "#1c8fc4", c2: "#ffd23f", tag: "Explorez des îles, commerçez et rapportez vos trésors au port.", rules: ["Déplacez votre bateau d'une à trois îles et découvrez la tuile qui s'y cache.", "Échangez vos marchandises au port pour gagner des perles.", "Quand la dernière île est révélée, le plus de perles l'emporte."], mech: ["Exploration", "Échanges", "Collection"], inc: "40 tuiles îles, 5 bateaux, 100 perles, 1 sac" },
  { id: "sorciers", n: "Le Grand Duel des Sorciers", c: "duel", age: 12, dur: 30, a: 2, b: 2, d: 4, mood: "duel", m: "face", c1: "#5a2d82", c2: "#d8352a", tag: "Construisez votre grimoire pendant la partie et terrassez l'autre sorcier.", rules: ["Chaque tour, achetez un sort au marché commun pour votre paquet.", "Jouez votre main de sorts pour attaquer ou vous protéger.", "Le sorcier qui tombe à zéro point de vie perd le duel."], mech: ["Construction de paquet", "Combat", "Marché commun"], inc: "110 cartes sorts, 2 grimoires, 40 jetons de vie" },
  { id: "ecureuils", n: "Les Écureuils Voleurs", c: "famille", age: 4, dur: 15, a: 2, b: 4, d: 1, mood: "rire", m: "face", c1: "#e07b2a", c2: "#3aa655", tag: "Dès quatre ans : retrouvez où se cachent les noisettes avant les écureuils malins.", rules: ["Retournez une carte arbre et rappelez-vous ce qu'elle cache.", "Si vous trouvez une noisette, gardez-la ; sinon, un écureuil avance.", "Si les noisettes sont toutes à vous avant l'écureuil, bravo !"], mech: ["Mémoire", "Dès 4 ans", "Chance"], inc: "24 cartes arbres, 20 noisettes, 4 écureuils" },
];
const gById = Object.fromEntries(G.map((g) => [g.id, g]));
const countBy = (c) => G.filter((g) => g.c === c).length;
const plr = (g) => (g.a === g.b ? `${g.a} joueurs` : g.a === 1 ? `1 à ${g.b} joueurs` : `${g.a} à ${g.b} joueurs`);
const PNAME = ["Rouge", "Bleu", "Jaune", "Vert"];

// ---------- Illustrations ----------
const mix = (hex, f) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return "#" + v.map((x) => Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f).toString(16).padStart(2, "0")).join(""); };
const PAWN = "M16 2a5 5 0 0 0-3 9c-4 1-7 2-11 2 3 3 5 4 6 6-1 5-3 9-6 13h9l5-5 5 5h9c-3-4-5-8-6-13 1-2 3-3 6-6-4 0-7-1-11-2a5 5 0 0 0-3-9z";
const pawn = (cls = "") => `<svg class="mp-pw ${cls}" viewBox="0 0 32 34" aria-hidden="true"><path d="${PAWN}" fill="currentColor" stroke="#1d1209" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
// Les couleurs des boîtes viennent du CSS (classe mp-g-<id> : --c1, --c2...) pour garder le HTML très léger
const MOTIF = {
  dice: `<g transform="rotate(-12 62 128)"><rect class="cr" x="38" y="104" width="46" height="46" rx="9"/><path class="dt" d="M50 116h0M72 116h0M61 127h0M50 138h0M72 138h0"/></g><g transform="rotate(14 106 140)"><rect class="c2" x="86" y="122" width="40" height="40" rx="8"/><path class="dt dc" d="M97 133h0M106 142h0M115 151h0"/></g>`,
  cards: `<rect class="cr" x="60" y="102" width="38" height="58" rx="6" transform="rotate(-22 80 166)"/><rect class="cl" x="62" y="102" width="38" height="58" rx="6" transform="rotate(22 80 166)"/><rect class="wh" x="61" y="100" width="38" height="58" rx="6"/><path class="c2 n" d="M80 118c-8-8-14 0-9 6l9 9 9-9c5-6-1-14-9-6z"/>`,
  hex: `<path class="cr" d="M62 93l16 9v18l-16 9-16-9v-18zM98 93l16 9v18l-16 9-16-9v-18z"/><path class="c2" d="M80 123l16 9v18l-16 9-16-9v-18z"/><path class="cl" d="M116 123l16 9v18l-16 9-16-9v-18z"/>`,
  castle: `<path class="cr" d="M62 116h36v46H62z"/><path class="cl" d="M38 100h24v62H38zM98 100h24v62H98z"/><path class="c2" d="M72 162v-18a8 8 0 0 1 16 0v18zM80 110V92l14 5z"/>`,
  path: `<path class="pa" d="M32 158C52 120 70 164 92 130S122 112 130 98"/><circle class="c2" cx="34" cy="156" r="8"/><circle class="cl" cx="94" cy="130" r="8"/><path class="rd" d="M128 100V84l14 5z"/>`,
  sun: `<circle class="yl" cx="80" cy="120" r="19"/><path class="ry" d="M80 90v-6M80 150v-6M50 120h-6M116 120h-6M59 99l-4-4M101 99l4-4"/><path class="cl" d="M20 150q10-9 20 0t20 0t20 0t20 0t20 0v20H20z"/>`,
  face: `<path class="c2" d="M52 108l6 18H36zM108 108l-6 18h22z"/><circle class="cr" cx="80" cy="136" r="27"/><path class="dt" d="M70 130h0M90 130h0"/><path class="n ik" d="M75 139h10l-5 6z"/>`,
};
// Boîte de jeu vue en perspective (face, côté et dessus), motif propre à chaque jeu
const box = (g, cls = "") => `<svg class="mp-box mp-g-${g.id} ${cls}" viewBox="0 0 200 190" aria-hidden="true"><ellipse class="sh n" cx="102" cy="179" rx="86" ry="8"/><path class="bd" d="M140 60 178 44V152L140 170z"/><path class="bt" d="M20 60 58 44H178L140 60z"/><path class="bf" d="M20 60H140V170H20z"/><path class="bx" d="M20 60H140V82H20z"/><path class="cr n" d="M30 66h62v6H30z"/>${MOTIF[g.m]}</svg>`;
const dice = (n) => `<span class="mp-dice d${n}" role="img" aria-label="Difficulté ${n} sur 5"><i></i><i></i><i></i><i></i><i></i></span>`;
const ICON = {
  famille: `<path d="M3 11 12 4l9 7v9H3z" fill="currentColor"/>`, strategie: `<path d="M5 20V9h2V6h3v3h4V6h3v3h2v11z" fill="currentColor"/>`,
  ambiance: `<path d="M12 2l2.9 6.3 6.8.8-5 4.7 1.3 6.8L12 17.2 6 20.6l1.3-6.8-5-4.7 6.8-.8z" fill="currentColor"/>`,
  coop: `<circle cx="8" cy="8" r="3.2" fill="currentColor"/><circle cx="16" cy="8" r="3.2" fill="currentColor"/><path d="M2 20c0-3.2 2.7-5.5 6-5.5s6 2.300 6 5.500zM10 20c0-3.200 2.700-5.500 6-5.500s6 2.300 6 5.500z" fill="currentColor"/>`,
  duel: `<path d="M4 4l16 16M20 4 4 20" stroke="currentColor" stroke-width="3.200" stroke-linecap="round"/>`,
  cartes: `<rect x="5" y="3" width="14" height="18" rx="2.500" fill="currentColor"/><path d="M12 15c-3-2.500-4.500-4.200-3-5.800 1-1 2.300-.6 3 .5.700-1.100 2-1.500 3-.5 1.500 1.600 0 3.300-3 5.800z" fill="#fff3d6"/>`,
  soirees: `<path d="M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z" fill="currentColor"/>`, ludo: `<path d="M4 7l8-4 8 4v10l-8 4-8-4z" fill="currentColor"/><path d="M4 7l8 4 8-4M12 11v10" fill="none" stroke="#fff3d6" stroke-width="1.500"/>`,
  start: `<path d="M6 3v18" stroke="currentColor" stroke-width="2.500" stroke-linecap="round"/><path d="M7 4h12l-3 4 3 4H7z" fill="currentColor"/>`,
};
const ic = (k, cls = "mp-ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
const arrow = `<svg class="mp-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-7 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const dieBtn = `<svg class="mp-dsvg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.500" y="2.500" width="19" height="19" rx="5" fill="currentColor"/><circle cx="8" cy="8" r="1.700" fill="#fff3d6"/><circle cx="16" cy="16" r="1.700" fill="#fff3d6"/><circle cx="12" cy="12" r="1.700" fill="#fff3d6"/><circle cx="16" cy="8" r="1.700" fill="#fff3d6"/><circle cx="8" cy="16" r="1.700" fill="#fff3d6"/></svg>`;

// ---------- Plateau : 20 cases en anneau (7 colonnes × 5 lignes) ----------
const CELLS = [
  ["start", "Case départ", "Tout commence ici : le catalogue complet vous attend.", "/catalogue", "Ouvrir le catalogue"],
  ["famille"], ["ambiance"], ["strategie"], ["cartes"], ["coop"],
  ["soirees", "Soirées jeux", "Soirées découverte, tournois et après-midis en famille : réservez votre table.", "/soirees", "Voir les soirées"],
  ["duel"], ["famille"],
  ["ludo", "Ludothèque", "Empruntez des jeux à la maison pour quelques semaines, sans en acheter dix.", "/ludotheque", "Voir les formules"],
  ["strategie"], ["ambiance"], ["coop"], ["cartes"], ["duel"],
  ["soirees", "Soirées jeux", "Soirées découverte, tournois et après-midis en famille : réservez votre table.", "/soirees", "Voir les soirées"],
  ["famille"], ["ludo", "Ludothèque", "Empruntez des jeux à la maison pour quelques semaines, sans en acheter dix.", "/ludotheque", "Voir les formules"], ["ambiance"], ["strategie"],
];
const KIND = (k) => { const d = CELLS.find((c) => c[0] === k); return CATS[k] ? [CATS[k][0], CATS[k][2], `/catalogue#${k}`, `Voir les ${countBy(k)} jeux`] : [d[1], d[2], d[3], d[4]]; };
const kindList = () => `<ul class="mp-kinds" hidden>${["start", ...Object.keys(CATS), "soirees", "ludo"].map((k) => { const v = KIND(k); return `<li data-k="${k}" data-t="${esc(v[0])}" data-p="${esc(v[1])}" data-u="${v[2]}" data-l="${esc(v[3])}"></li>`; }).join("")}</ul>`;
const cell = (def, i) => { const k = def[0], cl = CATS[k] ? CATS[k][1] : k; return `<a class="mp-cell mp-k-${cl} mp-c${i}" href="#case-${i + 1}" data-k="${k}" aria-label="Case ${i + 1} : ${esc(KIND(k)[0])}">${ic(k)}<i>${i + 1}</i></a>`; };

// ---------- Morceaux de page ----------
const NAVCOL = ["p0", "p1", "p2", "p3", "p0"];
const navLinks = (menu, cls) => menu.map((m, i) => `<a class="${cls}" href="${esc(m.url)}">${pawn("mp-" + NAVCOL[i % 5])}<span>${esc(m.label)}</span></a>`).join("");
const header = (c) => `<header class="mp-head pk-bleed"><div class="mp-head-in"><a class="mp-logo" href="/" aria-label="${esc(c.brand)} — accueil">${pawn("mp-p0 mp-logo-pw")}<span class="mp-logo-t">Meeple<small>jeux de société</small></span></a>
  <div class="mp-nav" role="navigation" aria-label="Navigation principale">${navLinks(c.menu, "mp-nv")}</div>
  <details class="mp-burger"><summary aria-label="Ouvrir le menu"><span class="mp-bur-i"><i></i><i></i><i></i></span><span>Menu</span></summary><div class="mp-drawer" role="navigation" aria-label="Menu mobile">${navLinks(c.menu, "mp-nv mp-nv--m")}</div></details></div></header>`;
const footer = (c) => `<footer class="mp-foot pk-bleed"><div class="mp-wrap mp-foot-in"><div><div class="mp-foot-logo">${pawn("mp-p2")}Meeple</div><p>Boutique et ludothèque de jeux de société : on vous conseille, on vous prête, on joue avec vous.</p><address>Meeple, 14 rue des Quatre Pions, 69000 (adresse fictive)</address></div>
  <div><h2 class="mp-foot-h">Jouer</h2><ul>${c.menu.slice(1, 4).map((m) => `<li><a href="${esc(m.url)}">${esc(m.label)}</a></li>`).join("")}</ul></div>
  <div><h2 class="mp-foot-h">Plus</h2><ul><li><a href="/contact">Contact</a></li><li><a href="/recherche">Recherche</a></li><li><a href="/jeu">Fiche d'un jeu</a></li></ul></div></div>
  <p class="mp-legal">© Meeple — site de démonstration. Jeux, tarifs, horaires et adresse fictifs ; aucune réservation, commande ni paiement n'est possible ici.</p></footer>`;
const pagehead = (kicker, title, sub, extra = "") => sec(`<section class="mp-ph pk-bleed"><div class="mp-wrap mp-ph-in"><div><p class="mp-kicker" data-reveal>${esc(kicker)}</p><div class="mp-title mp-title--s" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="mp-lead" data-reveal>${esc(sub)}</p>` : ""}${extra}</div><div class="mp-ph-art" aria-hidden="true">${pawn("mp-p0")}${pawn("mp-p1")}${pawn("mp-p2")}${pawn("mp-p3")}</div></div></section>`);

// Carte-boîte d'un jeu
const card = (g) => `<article class="mp-game" data-id="${g.id}" data-cat="${g.c}" data-age="${g.age}" data-dur="${g.dur}" data-pmin="${g.a}" data-pmax="${g.b}" data-diff="${g.d}" data-mood="${g.mood}"><a class="mp-game-a" href="#jeu-${g.id}" data-open="${g.id}"><span class="mp-game-art">${box(g)}</span><span class="mp-game-body"><span class="mp-game-c mp-kt-${CATS[g.c][1]}">${CATS[g.c][0]}</span><span class="mp-game-n">${esc(g.n)}</span><span class="mp-game-m"><b>${g.age}+</b> · ${g.dur} min · ${plr(g)}</span>${dice(g.d)}</span></a></article>`;
// Panneau de fiche (les illustrations sont copiées par le script depuis la carte correspondante)
const fiche = (g) => `<article class="mp-fiche" data-fiche="${g.id}" hidden><div class="mp-fiche-art" data-art></div><p class="mp-fiche-c mp-kt-${CATS[g.c][1]}">${CATS[g.c][0]}</p><h3 class="mp-fiche-n">${esc(g.n)}</h3><p class="mp-fiche-t">${esc(g.tag)}</p><ul class="mp-facts"><li><small>Âge</small>dès ${g.age} ans</li><li><small>Durée</small>${g.dur} min</li><li><small>Joueurs</small>${g.a === g.b ? g.a : g.a + " à " + g.b}</li></ul><p class="mp-fiche-d">Difficulté ${dice(g.d)}</p><h4 class="mp-fiche-h">Les règles en 3 lignes</h4><ol class="mp-rules">${g.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ol><ul class="mp-mech">${g.mech.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></article>`;
const panel = (ids) => sec(`<div class="mp-pnl-wrap pk-bleed"><div class="mp-scrim" data-scrim hidden></div><aside class="mp-panel" data-panel role="dialog" aria-modal="true" aria-label="Fiche du jeu" hidden><a class="mp-panel-x" href="#fermer" data-close>Fermer<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></a>${ids.map((i) => fiche(gById[i])).join("")}<div class="mp-fiche-act"><a class="mp-btn" href="/soirees" data-book="passeurs" data-bookbtn>Réserver une table ${arrow}</a><a class="mp-btn mp-btn--ghost" href="/jeu">Fiche complète</a></div></aside></div>`);
const seg = (key, label, items, on) => `<div class="mp-fgroup"><p class="mp-flabel">${label}</p><div class="mp-seg" role="radiogroup" aria-label="${label}" data-key="${key}">${items.map(([v, t]) => `<a class="mp-sg${String(v) === String(on) ? " is-on" : ""}" href="#${key}-${v}" role="radio" aria-checked="${String(v) === String(on)}" data-v="${v}">${t}</a>`).join("")}</div></div>`;

// Aide « quel jeu ce soir ? »
const quiz = () => `<section class="mp-sec mp-sec--duck pk-bleed" data-quiz><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>Un coup de main du caviste</p><h2 class="mp-h2" data-reveal>Quel jeu ce soir ?</h2></div><p class="mp-sechead-p" data-reveal>Trois questions, une suggestion. On tire dans le catalogue ce qui colle le mieux à votre table.</p></div>
  <div class="mp-qbox" data-reveal><ol class="mp-qsteps" aria-hidden="true"><li class="is-on">1</li><li>2</li><li>3</li></ol>
  <div class="mp-q" data-q="0"><h3 class="mp-q-h">Vous êtes combien autour de la table ?</h3><div class="mp-opts"><a class="mp-opt" href="#q-1" data-a="1-2">1 ou 2 joueurs</a><a class="mp-opt" href="#q-2" data-a="3-4">3 ou 4 joueurs</a><a class="mp-opt" href="#q-3" data-a="5-9">5 joueurs et plus</a></div></div>
  <div class="mp-q" data-q="1" hidden><h3 class="mp-q-h">Vous avez combien de temps ?</h3><div class="mp-opts"><a class="mp-opt" href="#t-1" data-a="25">Un quart d'heure ou presque</a><a class="mp-opt" href="#t-2" data-a="60">Une petite heure</a><a class="mp-opt" href="#t-3" data-a="999">Toute la soirée</a></div></div>
  <div class="mp-q" data-q="2" hidden><h3 class="mp-q-h">Quelle ambiance ce soir ?</h3><div class="mp-opts"><a class="mp-opt" href="#m-1" data-a="rire">On rigole</a><a class="mp-opt" href="#m-2" data-a="cerveau">On réfléchit</a><a class="mp-opt" href="#m-3" data-a="equipe">Tous ensemble</a><a class="mp-opt" href="#m-4" data-a="duel">Face à face</a></div></div>
  <div class="mp-qres" data-qres aria-live="polite" hidden></div></div></div></section>`;

// ---------- Pages ----------
const FEAT = ["passeurs", "caramba", "phare", "sommet", "chuchotis", "sentiers", "forgerons", "ecureuils"];
const EVENTS = [
  ["decouverte", "Mercredi", "19 h 30", "Soirée découverte", "Trois jeux sortis de la boîte, expliqués pas à pas. Aucun prérequis."],
  ["enfants", "Mercredi", "14 h", "Après-midi des petits", "Jeux dès 4 ans, goûter partagé et un animateur à chaque table."],
  ["tournoi", "Vendredi", "20 h", "Tournoi de duel", "Élimination directe sur « Duel au Sommet » : un tableau, des revanches, un trophée en bois."],
  ["famille", "Samedi", "15 h", "Jeux en famille", "Grands et petits autour de la même table, avec des jeux choisis pour tous."],
  ["decouverte", "Samedi", "20 h 30", "Soirée coopérative", "Gagnez ensemble ou perdez ensemble : Phare Rouge et d'autres jeux d'équipe."],
  ["tournoi", "Dimanche", "14 h", "Grand tournoi de cartes", "Pique-Pique, Zéro Pointé : plusieurs manches, un classement, des rires."],
  ["famille", "Dimanche", "17 h", "Goûter-jeux", "Une table de jeux rapides, des boissons chaudes et des parties de quinze minutes."],
  ["decouverte", "Jeudi", "19 h", "Soirée stratégie", "Forgerons d'Ambre, Citadelles de Sable : on prend le temps de bâtir."],
];
const evCard = (e, i) => `<li class="mp-ev mp-ev--${i % 2 ? "r" : "l"}" data-t="${e[0]}" data-reveal><span class="mp-ev-n">${i + 1}</span><article class="mp-ev-c"><p class="mp-ev-when"><b>${e[1]}</b> · ${e[2]}</p><h3 class="mp-ev-h">${esc(e[3])}</h3><p>${esc(e[4])}</p><span class="mp-tg mp-tg--${e[0]}">${{ decouverte: "Découverte", enfants: "Enfants", tournoi: "Tournoi", famille: "Famille" }[e[0]]}</span></article></li>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="mp-hero pk-bleed"><div class="mp-hero-deco" aria-hidden="true"><svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice"><g opacity=".9"><g transform="rotate(-14 90 120)"><rect x="40" y="60" width="90" height="130" rx="10" fill="#fff3d6" stroke="#1d1209" stroke-width="3"/><path d="M85 112c-14-14-26 2-16 12l16 16 16-16c10-10-2-26-16-12z" fill="#d8352a"/></g><g transform="rotate(10 1090 90)"><rect x="1040" y="40" width="90" height="130" rx="10" fill="#fff3d6" stroke="#1d1209" stroke-width="3"/><path d="M1085 90l-18 36h36z" fill="#1d1209"/></g><g transform="rotate(18 1120 480)"><rect x="1080" y="440" width="60" height="60" rx="12" fill="#f2b705" stroke="#1d1209" stroke-width="3"/><circle cx="1098" cy="458" r="5" fill="#1d1209"/><circle cx="1122" cy="482" r="5" fill="#1d1209"/></g><g transform="rotate(-20 80 500)"><rect x="50" y="470" width="56" height="56" rx="11" fill="#d8352a" stroke="#1d1209" stroke-width="3"/><circle cx="68" cy="488" r="5" fill="#fff3d6"/><circle cx="88" cy="488" r="5" fill="#fff3d6"/><circle cx="68" cy="508" r="5" fill="#fff3d6"/><circle cx="88" cy="508" r="5" fill="#fff3d6"/></g></g></svg></div>
    <div class="mp-wrap mp-hero-grid"><div class="mp-hero-copy"><p class="mp-kicker" data-reveal>Boutique et ludothèque de jeux de société</p>
      <div class="mp-title" role="heading" aria-level="1" data-reveal>Posez le plateau,<span> lancez le dé.</span></div>
      <p class="mp-lead" data-reveal>Plus de deux cents boîtes à découvrir, à acheter ou à emprunter. Lancez le dé : un pion avance sur le plateau et la case où il s'arrête ouvre une rubrique du site.</p>
      <div class="mp-actions" data-reveal><a class="mp-btn" href="#lancer" data-roll>${dieBtn}Lancer le dé</a><a class="mp-btn mp-btn--ghost" href="/catalogue">Voir le catalogue ${arrow}</a></div>
      <div class="mp-land" data-land aria-live="polite"><p class="mp-land-k">Case 1 · départ</p><h2 class="mp-land-t" data-land-t>Case départ</h2><p class="mp-land-p" data-land-p>${CELLS[0][2]}</p><a class="mp-more" href="/catalogue" data-land-a>Ouvrir le catalogue ${arrow}</a></div></div>
      <div class="mp-boardwrap" data-reveal><div class="mp-board" data-board><div class="mp-ring">${CELLS.map(cell).join("")}${kindList()}
        <div class="mp-core"><svg class="mp-core-bg" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="50" cy="30" r="26" fill="none" stroke="#fff3d6" stroke-width=".6" opacity=".5"/><circle cx="50" cy="30" r="14" fill="none" stroke="#fff3d6" stroke-width=".5" opacity=".4"/><path d="M50 4V56M24 30H76" stroke="#fff3d6" stroke-width=".5" opacity=".35"/><path d="M50 6l3 24-3 24-3-24z" fill="#fff3d6" opacity=".16"/></svg>
          <a class="mp-die" href="#lancer" data-roll data-die data-v="5" aria-label="Lancer le dé">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<i class="mp-pip mp-pip${i}"></i>`).join("")}</a><p class="mp-turn" data-turn>${pawn("mp-p0")}<span>Au tour du pion <b>rouge</b></span></p></div>
        ${[0, 1, 2, 3].map((i) => `<span class="mp-tok mp-p${i}" data-tok="${i}" aria-hidden="true">${pawn("mp-p" + i)}</span>`).join("")}</div></div>
        <ul class="mp-players" aria-label="Position des pions">${PNAME.map((n, i) => `<li${i === 0 ? " class=\"is-turn\"" : ""}>${pawn("mp-p" + i)}<span>${n}</span><b data-pos="${i}">1</b></li>`).join("")}</ul><p class="mp-sr" data-res aria-live="polite"></p></div></div></section>`),
  sec(`<section class="mp-sec mp-sec--felt pk-bleed"><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>Piochez une famille de jeux</p><h2 class="mp-h2" data-reveal>Six paquets sur la table</h2></div><p class="mp-sechead-p" data-reveal>Chaque carte vous emmène vers le catalogue, déjà filtré.</p></div>
    <ul class="mp-decks">${Object.entries(CATS).map(([k, v]) => `<li data-reveal><a class="mp-deck mp-k-${v[1]}" href="/catalogue#${k}">${ic(k, "mp-deck-ic")}<span class="mp-deck-n">${v[0]}</span><span class="mp-deck-c">${countBy(k)} jeux</span></a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="mp-sec mp-sec--wood pk-bleed"><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker mp-kicker--dk" data-reveal>Sur l'étagère cette semaine</p><h2 class="mp-h2 mp-h2--dk" data-reveal>Huit boîtes à ouvrir</h2></div><a class="mp-more mp-more--dk" href="/catalogue" data-reveal>Tout le catalogue ${arrow}</a></div>
    <div class="mp-games">${FEAT.map((i) => card(gById[i])).join("")}</div></div></section>`),
  sec(`<section class="mp-sec mp-sec--duck pk-bleed"><div class="mp-wrap mp-help"><div><p class="mp-kicker" data-reveal>Pas d'idée ?</p><h2 class="mp-h2" data-reveal>Quel jeu ce soir ?</h2><p class="mp-lead" data-reveal>Dites-nous combien vous êtes, combien de temps vous avez et l'ambiance voulue. Trois questions, une suggestion.</p><a class="mp-btn" href="/catalogue#quiz" data-reveal>Répondre aux 3 questions ${arrow}</a></div>
    <ol class="mp-help-steps">${[["3 dés", "Le nombre de joueurs", "1 ou 2, 3 ou 4, 5 et plus."], ["2 dés", "Le temps disponible", "Un quart d'heure, une heure, toute la soirée."], ["1 dé", "L'ambiance", "On rigole, on réfléchit, on s'entraide ou on s'affronte."]].map(([d, t, p]) => `<li data-reveal><span class="mp-hs-d">${d}</span><h3>${t}</h3><p>${p}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="mp-sec mp-sec--felt pk-bleed"><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>À table !</p><h2 class="mp-h2" data-reveal>Les soirées de la semaine</h2></div><a class="mp-more" href="/soirees" data-reveal>Réserver une table ${arrow}</a></div>
    <div class="mp-tickets">${EVENTS.slice(0, 3).map((e, i) => `<article class="mp-tk mp-tk--${i}" data-reveal><p class="mp-tk-d"><b>${e[1]}</b><span>${e[2]}</span></p><h3 class="mp-tk-h">${esc(e[3])}</h3><p>${esc(e[4])}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="mp-sec mp-sec--wood pk-bleed"><div class="mp-wrap mp-lend"><div><p class="mp-kicker mp-kicker--dk" data-reveal>La ludothèque</p><h2 class="mp-h2 mp-h2--dk" data-reveal>Empruntez, jouez, rapportez.</h2><p class="mp-lead mp-lead--dk" data-reveal>Avant d'acheter une boîte, testez-la à la maison pendant trois semaines. Choisissez une formule selon le nombre de jeux dont vous avez envie.</p><a class="mp-btn" href="/ludotheque" data-reveal>Voir les formules ${arrow}</a></div>
    <ul class="mp-lend-list"><li data-reveal><b>3 semaines</b><span>de prêt par jeu</span></li><li data-reveal><b>200+</b><span>boîtes en rayon</span></li><li data-reveal><b>Règles</b><span>vérifiées au retour</span></li></ul></div></section>`),
  panel(FEAT),
  sec(footer(c)),
];

const catalogue = (c) => [
  sec(header(c)),
  pagehead("Le catalogue", "Seize boîtes,<br>à votre mesure", "Filtrez par âge, durée et nombre de joueurs : les critères se combinent. Touchez une boîte pour lire ses règles en trois lignes.", `<a class="mp-more" href="#quiz" data-reveal data-goto="quiz">Pas d'idée ? Quel jeu ce soir ? ${arrow}</a>`),
  sec(`<section class="mp-sec mp-sec--plain mp-cat pk-bleed" data-cat-root><div class="mp-wrap"><details class="mp-filters" open><summary class="mp-filters-s"><span>Filtres et tri</span><b data-count-s>16 jeux</b></summary><div class="mp-filters-in">
    ${seg("cat", "Famille de jeux", [["all", "Tous"], ...Object.entries(CATS).map(([k, v]) => [k, v[0]])], "all")}
    ${seg("age", "Âge du plus jeune joueur", [[0, "Tous"], [5, "5 ans"], [8, "8 ans"], [10, "10 ans"], [12, "12 ans +"]], 0)}
    ${seg("dur", "Durée maximale", [[0, "Peu importe"], [20, "20 min"], [45, "45 min"], [90, "1 h 30"]], 0)}
    ${seg("pl", "Nombre de joueurs", [[0, "Tous"], [1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]], 0)}
    ${seg("sort", "Trier par", [["nom", "Nom"], ["dur", "Durée"], ["age", "Âge"], ["diff", "Difficulté"]], "nom")}
    <a class="mp-reset" href="#reset" data-reset>Tout réinitialiser</a></div></details><p class="mp-count" data-count aria-live="polite">16 jeux sur 16</p></div></section>`),
  sec(`<section class="mp-sec mp-sec--felt mp-sec--grid pk-bleed"><div class="mp-wrap"><div class="mp-games mp-games--cat" data-grid>${G.map((g) => card(g)).join("")}</div>
    <div class="mp-empty" data-empty hidden><div class="mp-empty-art" aria-hidden="true">${dice(0)}</div><h3 class="mp-empty-h">Aucun jeu sur cette table</h3><p>Aucune boîte ne répond à tous ces critères en même temps. Essayez d'en retirer un :</p><div class="mp-empty-opts" data-empty-opts></div><a class="mp-btn mp-btn--ghost" href="#reset" data-reset>Tout réinitialiser</a></div></div></section>`),
  sec(quiz()),
  panel(G.map((g) => g.id)),
  sec(footer(c)),
];

const jeu = (c) => {
  const g = gById.passeurs;
  return [
    sec(header(c)),
    sec(`<section class="mp-sheet pk-bleed"><div class="mp-wrap mp-sheet-in"><div class="mp-sheet-art" data-reveal>${box(g, "mp-box--xl")}<p class="mp-sheet-badge" aria-hidden="true"><b>${g.age}+</b></p></div>
      <div class="mp-sheet-txt"><p class="mp-kicker" data-reveal>Fiche jeu · ${CATS[g.c][0]} · coup de cœur du mois</p><div class="mp-title mp-title--s" role="heading" aria-level="1" data-reveal>${esc(g.n)}</div><p class="mp-lead" data-reveal>${esc(g.tag)}</p>
      <dl class="mp-facts mp-facts--big" data-reveal><div><dt>Âge</dt><dd>dès ${g.age} ans</dd></div><div><dt>Durée</dt><dd>${g.dur} min</dd></div><div><dt>Joueurs</dt><dd>${g.a} à ${g.b}</dd></div><div><dt>Difficulté</dt><dd>${dice(g.d)}</dd></div></dl>
      <div class="mp-actions" data-reveal><a class="mp-btn" href="/soirees" data-book="${g.id}">Réserver une table pour y jouer ${arrow}</a><a class="mp-btn mp-btn--ghost" href="/ludotheque">L'emprunter</a></div></div></div></section>`),
    sec(`<section class="mp-sec mp-sec--wood pk-bleed"><div class="mp-wrap mp-sheet-cols"><div><p class="mp-kicker mp-kicker--dk" data-reveal>Les règles en 3 lignes</p><h2 class="mp-h2 mp-h2--dk" data-reveal>Expliqué en une minute</h2><ol class="mp-rules mp-rules--big">${g.rules.map((r) => `<li data-reveal>${esc(r)}</li>`).join("")}</ol></div>
      <div><p class="mp-kicker mp-kicker--dk" data-reveal>Dans la boîte</p><h2 class="mp-h2 mp-h2--dk" data-reveal>Mécaniques et contenu</h2><ul class="mp-mech mp-mech--dk" data-reveal>${g.mech.map((m) => `<li>${esc(m)}</li>`).join("")}</ul><p class="mp-inc" data-reveal><b>Contenu :</b> ${esc(g.inc)}.</p>
      <div class="mp-est" data-est data-base="50" data-step="6" data-pmin="${g.a}" data-reveal><p class="mp-est-h">Combien de temps pour ma table ?</p><div class="mp-seg" role="radiogroup" aria-label="Nombre de joueurs">${[2, 3, 4].map((n) => `<a class="mp-sg${n === 2 ? " is-on" : ""}" href="#j-${n}" role="radio" aria-checked="${n === 2}" data-v="${n}">${n} joueurs</a>`).join("")}</div><p class="mp-est-out" aria-live="polite"><b data-est-d>50 min</b> de partie, plus <span data-est-s>10 min</span> de mise en place. Estimation indicative de démonstration.</p></div></div></div></section>`),
    sec(`<section class="mp-sec mp-sec--felt pk-bleed"><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>Si vous avez aimé</p><h2 class="mp-h2" data-reveal>À essayer ensuite</h2></div><a class="mp-more" href="/catalogue" data-reveal>Tout le catalogue ${arrow}</a></div><div class="mp-games">${["citadelles", "sentiers", "forgerons", "phare"].map((i) => card(gById[i])).join("")}</div></div></section>`),
    panel(["passeurs", "citadelles", "sentiers", "forgerons", "phare"]),
    sec(footer(c)),
  ];
};

const TABLES = [["t4", "Table de 4", 4], ["t8", "Table de 8", 8], ["salon", "Salon privé", 12]];
const soirees = (c) => [
  sec(header(c)),
  pagehead("Soirées et événements", "Autour de<br>la table", "Découverte, tournois, jeux en famille : le parcours de la semaine, puis réservez votre table de jeu.", ""),
  sec(`<section class="mp-sec mp-sec--felt pk-bleed" data-ev-root><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>Le parcours de la semaine</p><h2 class="mp-h2" data-reveal>Huit cases à jouer</h2></div></div>
    <div class="mp-seg mp-seg--wide" role="radiogroup" aria-label="Type de soirée" data-key="ev">${[["all", "Toutes"], ["decouverte", "Découverte"], ["tournoi", "Tournois"], ["famille", "Famille"], ["enfants", "Enfants"]].map(([v, t], i) => `<a class="mp-sg${i ? "" : " is-on"}" href="#ev-${v}" role="radio" aria-checked="${!i}" data-v="${v}">${t}</a>`).join("")}</div><p class="mp-count" data-ev-count aria-live="polite">8 soirées</p>
    <ol class="mp-trail">${EVENTS.map(evCard).join("")}</ol><p class="mp-fine">Horaires et animations de démonstration.</p></div></section>`),
  sec(`<section class="mp-sec mp-sec--wood pk-bleed" data-book-root><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker mp-kicker--dk" data-reveal>Réserver une table de jeu</p><h2 class="mp-h2 mp-h2--dk" data-reveal>Installez vos joueurs</h2></div><p class="mp-sechead-p mp-sechead-p--dk" data-reveal>Composez votre table : le récapitulatif se met à jour, puis part vers le formulaire de contact.</p></div>
    <div class="mp-bk"><div class="mp-bk-form" data-reveal>
      <div class="mp-fgroup"><p class="mp-flabel">Le jour</p><div class="mp-seg" role="radiogroup" aria-label="Jour" data-key="day">${["Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((d, i) => `<a class="mp-sg${i === 2 ? " is-on" : ""}" href="#d-${i}" role="radio" aria-checked="${i === 2}" data-v="${d}">${d.slice(0, 3)}.</a>`).join("")}</div></div>
      <div class="mp-fgroup"><p class="mp-flabel">Le créneau</p><div class="mp-seg" role="radiogroup" aria-label="Créneau" data-key="slot">${["14 h", "17 h", "19 h 30", "21 h"].map((d, i) => `<a class="mp-sg${i === 2 ? " is-on" : ""}" href="#s-${i}" role="radio" aria-checked="${i === 2}" data-v="${d}">${d}</a>`).join("")}</div></div>
      <div class="mp-fgroup"><p class="mp-flabel">Les joueurs</p><div class="mp-step"><a href="#moins" data-n="-1" aria-label="Un joueur de moins">−</a><b data-n-out>4</b><a href="#plus" data-n="1" aria-label="Un joueur de plus">+</a></div></div>
      <div class="mp-fgroup"><p class="mp-flabel">La table</p><div class="mp-seg" role="radiogroup" aria-label="Table" data-key="tbl">${TABLES.map(([k, n, cap], i) => `<a class="mp-sg${i === 0 ? " is-on" : ""}" href="#t-${k}" role="radio" aria-checked="${i === 0}" data-v="${n}" data-cap="${cap}">${n}</a>`).join("")}</div></div>
      <div class="mp-fgroup"><p class="mp-flabel">Le jeu</p><div class="mp-seg" role="radiogroup" aria-label="Jeu" data-key="game"><a class="mp-sg is-on" href="#g-place" role="radio" aria-checked="true" data-v="place">Au choix sur place</a><a class="mp-sg" href="#g-mien" role="radio" aria-checked="false" data-v="mien">J'apporte le mien</a><a class="mp-sg" href="#g-cat" role="radio" aria-checked="false" data-v="cat">Un jeu du catalogue</a></div>
        <div class="mp-gpick" data-gpick hidden><a href="#prec" data-g="-1" aria-label="Jeu précédent">‹</a><b data-gname>${esc(G[0].n)}</b><a href="#suiv" data-g="1" aria-label="Jeu suivant">›</a></div><ul class="mp-gl" data-gl hidden>${G.map((g) => `<li data-id="${g.id}">${esc(g.n)}</li>`).join("")}</ul></div></div>
    <div class="mp-bk-side" data-reveal><div class="mp-tbl" data-tbl aria-hidden="true"><div class="mp-tbl-top"><span data-tbl-l>4 joueurs</span></div></div>
      <div class="mp-recap"><p class="mp-recap-k">Récapitulatif</p><p class="mp-recap-t" data-recap aria-live="polite">Demande de table — vendredi à 19 h 30, 4 joueurs, table de 4, jeu au choix sur place.</p>
      <a class="mp-btn mp-btn--block" href="/contact" data-send>Envoyer cette demande ${arrow}</a><a class="mp-btn mp-btn--ghost mp-btn--block" href="#copier" data-copy>Copier le récapitulatif</a><p class="mp-fine mp-fine--dk">Rien n'est réservé ici : la demande part via le formulaire de contact, et nous confirmons par message.</p></div></div></div></div></section>`),
  sec(`<section class="mp-sec mp-sec--duck pk-bleed"><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>Une fête à thème</p><h2 class="mp-h2" data-reveal>Anniversaires et groupes</h2></div></div>
    <div class="mp-parties">${[["Anniversaire", "Une table décorée, trois jeux choisis par âge et un animateur pendant deux heures.", "famille"], ["Équipe d'entreprise", "Un tournoi express sur jeux coopératifs ou d'ambiance, idéal pour souder une équipe.", "coop"], ["Entre amis", "Le salon privé, vos jeux préférés et notre sélection de la semaine.", "ambiance"]].map(([t, p, k], i) => `<article class="mp-party mp-k-${CATS[k][1]}" data-reveal>${ic(k, "mp-party-ic")}<h3>${t}</h3><p>${p}</p></article>`).join("")}</div></div></section>`),
  sec(footer(c)),
];

const PLANS = [["Pion", 9, "Pour tester sans s'encombrer", ["2 jeux à la fois", "3 semaines de prêt", "Dépôt de garantie: 30 €"], "p0"], ["Équipe", 16, "La formule des familles", ["4 jeux à la fois", "3 semaines de prêt", "Dépôt de garantie: 50 €", "Soirées à tarif réduit"], "p1"], ["Plateau", 24, "Pour les passionnés", ["6 jeux à la fois", "4 semaines de prêt", "Dépôt de garantie: 80 €", "Soirées à tarif réduit", "Réservation prioritaire"], "p2"]];
const ludotheque = (c) => [
  sec(header(c)),
  pagehead("La ludothèque", "Empruntez<br>avant d'acheter", "Trois formules pour jouer à la maison : choisissez le nombre de jeux, rapportez-les dans les délais, recommencez.", ""),
  sec(`<section class="mp-sec mp-sec--felt pk-bleed" data-bill><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>Les formules</p><h2 class="mp-h2" data-reveal>Trois titres de propriété</h2></div>
    <div class="mp-seg" role="radiogroup" aria-label="Période de facturation" data-key="bill"><a class="mp-sg is-on" href="#mensuel" role="radio" aria-checked="true" data-v="m">Par mois</a><a class="mp-sg" href="#annuel" role="radio" aria-checked="false" data-v="a">Par an</a></div></div>
    <div class="mp-deeds">${PLANS.map(([n, p, t, l, col]) => `<article class="mp-deed" data-reveal><div class="mp-deed-top mp-${col}-bg"><p>Formule</p><h3>${n}</h3>${pawn("mp-" + col)}</div><div class="mp-deed-body"><p class="mp-deed-t">${t}</p><p class="mp-deed-price"><b data-p="${p}">${p} €</b><span data-per>par mois</span></p><ul>${l.map((x) => `<li>${x}</li>`).join("")}</ul></div></article>`).join("")}</div><p class="mp-fine">Tarifs indicatifs de démonstration. Aucune inscription ni paiement n'est possible ici.</p></div></section>`),
  sec(`<section class="mp-sec mp-sec--wood pk-bleed"><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker mp-kicker--dk" data-reveal>En un coup d'œil</p><h2 class="mp-h2 mp-h2--dk" data-reveal>Les formules comparées</h2></div></div>
    <table class="mp-table" data-reveal><caption class="mp-sr">Comparaison des trois formules de la ludothèque</caption><thead><tr><th scope="col">Formule</th><th scope="col">Jeux à la fois</th><th scope="col">Durée du prêt</th><th scope="col">Dépôt de garantie</th><th scope="col">Soirées</th></tr></thead><tbody>
    <tr><th scope="row" data-label="Formule">Pion</th><td data-label="Jeux à la fois">2</td><td data-label="Durée du prêt">3 semaines</td><td data-label="Dépôt de garantie">30 €</td><td data-label="Soirées">Tarif normal</td></tr>
    <tr><th scope="row" data-label="Formule">Équipe</th><td data-label="Jeux à la fois">4</td><td data-label="Durée du prêt">3 semaines</td><td data-label="Dépôt de garantie">50 €</td><td data-label="Soirées">Tarif réduit</td></tr>
    <tr><th scope="row" data-label="Formule">Plateau</th><td data-label="Jeux à la fois">6</td><td data-label="Durée du prêt">4 semaines</td><td data-label="Dépôt de garantie">80 €</td><td data-label="Soirées">Réduit + prioritaire</td></tr></tbody></table></div></section>`),
  sec(`<section class="mp-sec mp-sec--duck pk-bleed"><div class="mp-wrap"><div class="mp-sechead"><div><p class="mp-kicker" data-reveal>Comment ça se joue</p><h2 class="mp-h2" data-reveal>Quatre cases, un prêt</h2></div></div>
    <ol class="mp-path">${[["Choisir", "Parcourez le catalogue et repérez les boîtes disponibles.", "str"], ["Retirer", "Passez à la boutique : on vérifie le contenu ensemble.", "ludo"], ["Jouer", "Trois semaines pour tester, expliquer, rejouer.", "fam"], ["Rapporter", "On recompte les pièces et on rend le dépôt.", "start"]].map(([t, p, k], i) => `<li class="mp-path-s" data-reveal><span class="mp-path-n mp-k-${CATS[{ str: "strategie", fam: "famille" }[k]] ? CATS[{ str: "strategie", fam: "famille" }[k]][1] : k}">${i + 1}</span><h3>${t}</h3><p>${p}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="mp-sec mp-sec--felt pk-bleed"><div class="mp-wrap mp-faq"><h2 class="mp-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Que se passe-t-il s'il manque une pièce ?</summary><p>On compte le contenu au retrait et au retour. Une pièce manquante peut être remplacée ; le dépôt de garantie sert à cela.</p></details>
    <details data-reveal><summary>Puis-je prolonger un prêt ?</summary><p>Oui, une fois, si personne n'attend le jeu. Prévenez-nous avant la date de retour.</p></details>
    <details data-reveal><summary>Les jeux sont-ils expliqués ?</summary><p>Chaque boîte contient sa règle, et nous pouvons vous montrer les premières minutes au comptoir.</p></details>
    <details data-reveal><summary>Peut-on emprunter pour une fête ?</summary><p>Oui, la formule Plateau est pensée pour cela. Écrivez-nous pour préparer un lot de jeux.</p></details></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Une question, une table", "Écrivez-nous", "Un conseil, une demande de table, un prêt de ludothèque : nous répondons sous deux jours ouvrés."),
  sec(`<div class="mp-recapbox pk-bleed" data-recapbox hidden><div class="mp-wrap"><div class="mp-recapbox-in"><p class="mp-recap-k">Votre demande de table</p><p class="mp-recap-t" data-recap-t></p><p class="mp-fine mp-fine--dk">Elle a été recopiée dans le message ci-dessous : il ne reste qu'à envoyer le formulaire.</p><a class="mp-btn mp-btn--ghost" href="#copier" data-copy2>Copier</a></div></div></div>`),
  { type: "form", heading: "Envoyer un message", intro: "Pour une table de jeu, indiquez le jour, l'heure et le nombre de joueurs." },
  sec(`<section class="mp-sec mp-sec--felt pk-bleed"><div class="mp-wrap mp-cards3"><article class="mp-note" data-reveal><h3>La boutique</h3><address>14 rue des Quatre Pions<br>69000 (adresse fictive)</address><p>Parking et métro à quelques pas.</p></article><article class="mp-note" data-reveal><h3>Horaires</h3><p>Mercredi au dimanche, 14 h à 22 h 30.<br>Fermé le lundi et le mardi.</p></article><article class="mp-note" data-reveal><h3>Les soirées</h3><p>Programme et réservation d'une table sur la page dédiée.</p><a class="mp-more" href="/soirees">Voir les soirées ${arrow}</a></article></div></section>`),
  sec(footer(c)),
];

const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une boîte, une règle ?", "Un titre de jeu, une soirée, une formule : cherchez sur tout le site."), { type: "layout", children: [{ type: "search", props: { placeholder: "Phare, tournoi, ludothèque…" } }] }, sec(footer(c))];

const introuvable = (c) => [sec(header(c)), sec(`<section class="mp-404 pk-bleed"><div class="mp-wrap mp-404-in"><p class="mp-kicker">Retour à la case départ</p><div class="mp-title" role="heading" aria-level="1">404</div><p class="mp-lead">Cette case n'existe pas ou a changé de place. Votre pion repart du début du plateau.</p><div class="mp-actions"><a class="mp-btn" href="/">Retour à l'accueil ${arrow}</a><a class="mp-btn mp-btn--ghost" href="/catalogue">Voir le catalogue</a></div><div class="mp-404-art" aria-hidden="true">${pawn("mp-p0")}<span class="mp-404-d"></span>${pawn("mp-p1")}</div></div></section>`), sec(footer(c))];

module.exports = {
  key: "meeple", name: "Meeple", version: "2.0.0", category: "divertissement", tags: ["ludique", "chaleureux", "audacieux"], siteType: "Boutique et ludothèque de jeux de société", featured: true,
  concept: "Une table de jeu : un plateau où des pions avancent au lancer du dé, une navigation en pions posés sur des cases, des boîtes dessinées en perspective et un catalogue filtrable avec aide « quel jeu ce soir ? ».",
  description: "Boutique de jeux de société sur tapis de feutrine : plateau de jeu en hero (pions et dé au clic), navigation en pions, boîtes en perspective, catalogue filtrable par âge, durée et joueurs, aide au choix et réservation de table.",
  brand: "Meeple Jeux de société", modules: ["formulaires", "recherche"],
  dna: { header: "pions-de-navigation-poses-sur-des-cases-de-plateau", hero: "plateau-de-jeu-vu-de-dessus-pions-qui-avancent-et-de-se-lance-au-clic", grid: "cartes-de-boites-de-jeux-dessinees-en-perspective", motion: "de-qui-roule-pions-qui-sautent-de-case-en-case", shapes: "feutrine-piquee-bois-clair-cases-de-plateau-et-pions-meeple", rhythm: "bandes-de-tapis-alternees-vert-canard-et-bois-en-parties", signature: "catalogue-filtrable-age-duree-joueurs-fiche-panneau-et-quel-jeu-ce-soir" },
  tokens: {
    colors: { primary: "#c2291f", secondary: "#2d6fd1", accent: "#f2b705", background: "#0f4c3b", surface: "#f3e3c0", text: "#fbf3df", muted: "#d9cfae", success: "#3aa655", warning: "#f2b705", error: "#ff8a7a" },
    fonts: { heading: "font.grandstander", body: "font.rubik", button: "font.fredoka", link: "font.rubik" },
    radius: { sm: 8, md: 14, lg: 22, button: 14, field: 12, card: 18 }, shadow: { card: "0 8px 0 rgba(0,0,0,.28)", button: "0 4px 0 rgba(0,0,0,.35)" }, border: { width: 3, color: "#1d1209" },
    type: { h1: { size: 72, weight: 800, lineHeight: 1.02, transform: "none" }, h2: { size: 44, weight: 800, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge des boutons", type: "color", default: "#c2291f" },
    { key: "felt", label: "Tapis de table", type: "choice", default: "vert", choices: [["vert", "Feutrine verte"], ["canard", "Bleu canard"], ["bordeaux", "Bordeaux"]] },
    { key: "wood", label: "Essence de bois", type: "choice", default: "clair", choices: [["clair", "Bois clair"], ["miel", "Miel"]] },
    { key: "tilt", label: "Boîtes inclinées au survol", type: "choice", default: "on", choices: [["on", "Inclinées"], ["off", "Droites"]] },
    { key: "roll", label: "Dé du plateau", type: "choice", default: "anim", choices: [["anim", "Animé"], ["fixe", "Sans animation"]] },
  ],
  menu: [["Accueil", "/"], ["Catalogue", "/catalogue"], ["Soirées", "/soirees"], ["Ludothèque", "/ludotheque"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "catalogue", name: "Catalogue des jeux", render: catalogue }, { key: "jeu", name: "Fiche jeu", render: jeu },
    { key: "soirees", name: "Soirées et événements", render: soirees }, { key: "ludotheque", name: "Ludothèque et tarifs", render: ludotheque }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
