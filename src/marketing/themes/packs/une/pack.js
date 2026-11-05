// Le Relais — magazine d'actualité (démonstration, tout est fictif). Direction artistique : « une » de magazine multi-colonnes. Blanc, noir d'encre, rouge d'info ;
// titres Abril Fatface, texte Source Serif, filets, bandeaux d'édition, méga-menu des rubriques, grille dense à 12 colonnes.
// Composant signature : rubriques filtrables, mode lecture (taille, colonnes), « à lire aussi » calculé par rubrique, temps de lecture.
const { sec, esc } = require("../kit");

const RUB = { monde: "Monde", societe: "Société", economie: "Économie", culture: "Culture", sciences: "Sciences", sport: "Sport" };
const AUT = {
  aubrac: { n: "Clémence Aubrac", r: "Cheffe du service Société", rub: "societe", bio: "Dix-huit ans de terrain dans les gares, les écoles et les mairies de province." },
  valcourt: { n: "Théo Valcourt", r: "Grand reporter, Monde", rub: "monde", bio: "Couvre les fleuves, les frontières et les négociations qui durent." },
  dorsan: { n: "Maëlys Dorsan", r: "Rédactrice en chef adjointe, Économie", rub: "economie", bio: "Lit les bilans comptables comme d'autres lisent des romans." },
  pelletan: { n: "Anouk Pelletan", r: "Critique, Culture", rub: "culture", bio: "Festivals, librairies et scènes de petite jauge : la culture de proximité." },
  esteve: { n: "Raphaël Estève-Lorme", r: "Journaliste scientifique", rub: "sciences", bio: "Ancien chimiste devenu reporter de laboratoire." },
  brandales: { n: "Sofia Brandalès", r: "Cheffe du service Sport", rub: "sport", bio: "Du stade de quartier à la ligue : le sport raconté par ceux qui le font." },
};
// id, rubrique, titre, chapô, auteur, date, mots, kicker
const A = [
  ["calderia", "monde", "Au sommet de Calderia, les délégués signent un pacte de l'eau", "Après six nuits de négociations, douze États riverains s'engagent à partager les crues et les étiages du fleuve Orsane.", "valcourt", "4 nov.", 980, "Diplomatie"],
  ["portlavande", "societe", "À Port-Lavande, le dernier train de nuit reprend du service", "Après quatre ans d'interruption, la ligne qui reliait Port-Lavande à la capitale repart le 12 décembre. Le retour de la couchette divise autant qu'il rassemble.", "aubrac", "4 nov.", 0, "Transports"],
  ["valdorme", "economie", "Les ateliers de Val-d'Orme parient sur la réparation", "Trois PME ont transformé leurs chaînes de montage en ateliers de remise à neuf. Le modèle tient-il hors des subventions ?", "dorsan", "4 nov.", 860, "Industrie"],
  ["veilleurs", "culture", "Le festival des Veilleurs ouvre avec un opéra sans orchestre", "Douze voix, un clavecin désaccordé et une nef de pierre : la création de la compositrice fictive Ysaline Roch divise la salle.", "pelletan", "3 nov.", 720, "Festival"],
  ["lichen", "sciences", "Un lichen des Hautes-Terres intrigue les biologistes", "Il pousse à 3 100 mètres, résiste au gel et semble absorber le dioxyde de soufre. Ses secrets tiennent dans un caisson de laboratoire.", "esteve", "3 nov.", 1100, "Biologie"],
  ["rochefaye", "sport", "Le club de Rochefaye retrouve la première division après onze ans", "Une victoire 2-1 dans les arrêts de jeu, une ville en fête et un entraîneur qui refuse de parler de miracle.", "brandales", "3 nov.", 640, "Football"],
  ["ostrel", "monde", "Dans les ports de la mer d'Ostrel, la saison des tempêtes s'allonge", "Les capitaineries comptent désormais trois semaines de vents forts en plus. Les pêcheurs réorganisent leurs campagnes.", "valcourt", "2 nov.", 1320, "Climat"],
  ["ble", "economie", "Le prix du blé tendre : trois lectures d'un même graphique", "Hausse, stabilisation ou simple rebond ? Trois économistes fictifs lisent la même courbe et n'en tirent pas la même histoire.", "dorsan", "2 nov.", 940, "Marchés"],
  ["classeunique", "societe", "Écoles de montagne : la classe unique fait de la résistance", "Dans le val de Haute-Brine, quatorze élèves de six à onze ans partagent une salle, un poêle et une institutrice.", "aubrac", "2 nov.", 1050, "Éducation"],
  ["librairie", "culture", "Une librairie itinérante sillonne les routes du Haut-Pays", "Un camion, deux mille titres et un calendrier de tournée affiché sur les portes des boulangeries.", "pelletan", "1er nov.", 580, "Livres"],
  ["silence", "sciences", "Mesurer le silence : les stations d'écoute du Marais Noir", "Quarante micros posés dans les roseaux pour dresser l'inventaire sonore d'une zone humide. Résultat : moins de voix qu'en 1990.", "esteve", "1er nov.", 1180, "Écologie"],
  ["lanternes", "sport", "Marathon de Sainte-Aurèle : la course des mille lanternes", "Au crépuscule, quatre mille coureurs tiennent une lanterne de papier. Un format de course né d'un pari entre voisins.", "brandales", "31 oct.", 700, "Course à pied"],
  ["mines", "economie", "Énergie : le pari de la chaleur des mines abandonnées", "Des galeries inondées à 40 °C pourraient chauffer une petite ville. Les ingénieurs de Vieille-Houille y croient, les riverains attendent.", "dorsan", "31 oct.", 1260, "Énergie"],
  ["muet", "culture", "Rétrospective : le cinéma muet des vallées", "Quinze films retrouvés dans un grenier de Saint-Orme, projetés avec un pianiste et un narrateur en direct.", "pelletan", "30 oct.", 820, "Cinéma"],
  ["ventrelle", "monde", "Élections à Ventrelle : ce que changent les nouvelles règles", "Vote anticipé, découpage revu, parrainages simplifiés : le mode d'emploi d'un scrutin fictif mais très commenté.", "valcourt", "30 oct.", 900, "Politique"],
];

const BREVES = [["0548", "05 h 48", "Port-Lavande : la brume retarde les premiers ferries d'une demi-heure."], ["0612", "06 h 12", "Val-d'Orme : l'usine de câbles rouvre ses portes aux visiteurs samedi."], ["0940", "09 h 40", "Calderia : le texte du pacte de l'eau sera publié dans les trois langues du fleuve."], ["1105", "11 h 05", "Haute-Brine : l'école de la vallée obtient une classe numérique mobile."], ["1210", "12 h 10", "Sainte-Aurèle : les dossards de la course des lanternes sont épuisés."], ["1430", "14 h 30", "Ostrel : un cargo de blé amarré en rade, sans dégât."], ["1645", "16 h 45", "Rochefaye : le stade rouvre ses tribunes pour une fête populaire."], ["1720", "17 h 20", "Marais Noir : une première nichée de butors étoilés observée au printemps tardif."]];

const rt = (w) => Math.max(1, Math.round(w / 220));

// Article complet (le seul rédigé en entier dans la démonstration)
const BODY = [
  ["p", "Il est 22 h 41 sur le quai 3 de la gare centrale de Port-Lavande, et Mireille Saunier ne tient pas en place. À soixante-douze ans, cette ancienne receveuse des postes a pris, pendant trente ans, le train de nuit pour rendre visite à sa sœur dans la capitale. Il a disparu en 2022. Il reviendra le 12 décembre, avec trois voitures-couchettes rénovées et deux voitures-lits."],
  ["p", "« On s'endormait dans un paysage, on se réveillait dans une autre vie », résume-t-elle. Elle fait partie des 3 400 signataires d'une pétition fictive qui a convaincu la région de financer la remise en service de la ligne."],
  ["h2", "Une ligne que l'on croyait perdue"],
  ["p", "La suppression du train de nuit avait été présentée comme inéluctable : trop peu de passagers, un matériel vieillissant, des horaires qui ne séduisaient plus. Pourtant, les chiffres de l'office régional des transports racontent autre chose. Entre 2018 et 2022, la fréquentation avait progressé de 11 % sur la période estivale, et la couchette était, de loin, la place la plus souvent complète."],
  ["p", "Le retour de la ligne repose sur un montage inhabituel : la région achète les voitures, un exploitant privé fournit les équipes, et l'État compense une partie du déficit pendant cinq ans. Un contrat de service public de 18 millions d'euros, chiffre fictif présenté en conférence de presse la semaine dernière."],
  ["q", "Un train de nuit, ce n'est pas un train lent. C'est un hôtel qui roule pendant que vous dormez.", "Étienne Marchal, directeur fictif de la mobilité régionale"],
  ["h2", "Des riverains partagés"],
  ["p", "Tous ne se réjouissent pas. À Vieux-Pont, petite commune traversée à 3 h 12, une quinzaine d'habitants redoutent le bruit. Une association a demandé des murs antibruit et une limitation de vitesse en traversée. L'exploitant promet des essais de nuit et un numéro d'appel dédié aux riverains."],
  ["p", "Du côté des cheminots, le retour de la nuit signifie des embauches : une quarantaine de postes de contrôleurs, de conducteurs et d'agents de bord. « Nous avons déjà reçu plus de six cents candidatures », indique la direction des ressources humaines. Les premiers recrutés se forment depuis le mois dernier sur un simulateur installé dans un ancien dépôt."],
  ["a", "Repères", [["Départ", "22 h 52, quai 3, Port-Lavande"], ["Arrivée", "6 h 38, gare du Nord-Est, capitale"], ["Durée", "7 h 46, dont trois arrêts de nuit"], ["Voitures", "3 couchettes, 2 lits, 1 voiture-bar"], ["Fréquence", "Cinq nuits par semaine dès le 12 décembre"]]],
  ["h2", "Ce que les voyageurs attendent"],
  ["p", "Pour Inès, étudiante qui rentre chaque vendredi chez ses parents, c'est d'abord une question de prix. Pour Jules, consultant, c'est une journée gagnée. Pour les familles, c'est la promesse d'un voyage sans voiture. Les tarifs ne sont pas encore connus ; la région parle d'une grille « accessible » et d'un tarif jeune, sans plus de précision."],
  ["p", "Reste une inconnue : la fiabilité. Un train de nuit retardé de deux heures n'est plus un hôtel, c'est une salle d'attente. Les ingénieurs ont prévu des marges horaires et des créneaux de repli sur la voie principale. Réponse définitive le 12 décembre, à 22 h 52."],
];
BODY.words = BODY.reduce((n, b) => n + (b[0] === "a" ? b[2].map((r) => r.join(" ")).join(" ") : b[0] === "q" ? b[1] : b[1]).split(/\s+/).length, 0);
const ART = A.map(([id, rub, t, ch, au, d, w, k], i) => ({ id, rub, t, ch, au, d, w: id === "portlavande" ? BODY.words : w, k, i }));
const byId = (id) => ART.find((a) => a.id === id);
const inRub = (r, not) => ART.filter((a) => a.rub === r && a.id !== not);

// ---------- Illustrations en SVG : une composition géométrique par rubrique ----------
const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const RED = "#d4121f", INK = "#111", PAP = "#ece9e2";
const ART_BG = { monde: INK, societe: RED, economie: PAP, culture: PAP, sciences: INK, sport: RED };
const art = (rub, seed = 1, mini = false) => {
  const r = rnd(seed + 3); let g = "";
  const ri = (n, m = 0) => m + Math.round(r() * n);
  if (rub === "monde") {
    g = mini ? `<circle cx="200" cy="150" r="100" fill="none" stroke="#fff" stroke-width="5"/><path d="M200 50v200M100 150h200" stroke="#fff" stroke-width="4"/><circle cx="${ri(80, 160)}" cy="${ri(60, 120)}" r="22" fill="${RED}"/>`
      : `<circle cx="200" cy="150" r="112" fill="none" stroke="#fff" stroke-width="2"/><path d="M200 38v224M88 150h224M96 108q104 22 208 0M96 192q104-22 208 0" fill="none" stroke="#fff" stroke-width="1.5"/><ellipse cx="200" cy="150" rx="50" ry="112" fill="none" stroke="#fff" stroke-width="1.5"/><ellipse cx="200" cy="150" rx="92" ry="112" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/><circle cx="${ri(100, 150)}" cy="${ri(80, 110)}" r="13" fill="${RED}"/><circle cx="${ri(60, 170)}" cy="${ri(60, 120)}" r="5" fill="#fff"/>`;
  } else if (rub === "societe") {
    const rows = mini ? 3 : 5, cols = mini ? 5 : 9; let w = "", k = "";
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const cx = Math.round((x + .5) * 400 / cols), cy = Math.round(46 + y * (mini ? 82 : 54)), q = mini ? 2 : 1, d = `M${cx - 7 * q} ${cy}a${7 * q} ${7 * q} 0 1 0 ${14 * q} 0a${7 * q} ${7 * q} 0 1 0-${14 * q} 0M${cx - 12 * q} ${cy + 28 * q}a${12 * q} ${17 * q} 0 0 1 ${24 * q} 0z`; if ((x * 7 + y * 3 + seed) % 11 === 0) k += d; else w += d; }
    g = `<path d="${w}" fill="#fff"/><path d="${k}" fill="${INK}"/>`;
  } else if (rub === "economie") {
    const n = mini ? 5 : 9, bw = Math.round(340 / n); let pts = [], rects = "", hot = "";
    for (let i = 0; i < n; i++) { const h = 40 + ri(150), x = 30 + i * bw; if (i === n - 3) hot = `<rect x="${x}" y="${262 - h}" width="${bw - 12}" height="${h}" fill="${RED}"/>`; else rects += `M${x} 262v-${h}h${bw - 12}v${h}z`; pts.push(`${x + 10},${ri(110, 60)}`); }
    g = `<path d="${rects}" fill="${INK}"/>${hot}<path d="M24 262h352" stroke="${INK}" stroke-width="3"/>${mini ? "" : `<polyline points="${pts.join(" ")}" fill="none" stroke="${RED}" stroke-width="3"/>`}`;
  } else if (rub === "culture") {
    g = `<circle cx="${ri(40, 150)}" cy="140" r="86" fill="${RED}"/><rect x="${ri(30, 190)}" y="60" width="120" height="170" fill="${INK}" opacity=".9"/>${mini ? "" : `<polygon points="70,250 190,90 300,250" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="302" cy="76" r="22" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M40 258h320" stroke="${INK}" stroke-width="3"/>`}`;
  } else if (rub === "sciences") {
    g = `<circle cx="200" cy="150" r="14" fill="${RED}"/>` + [0, 60, 120].slice(0, mini ? 2 : 3).map((a, i) => `<ellipse cx="200" cy="150" rx="${130 - i * 6}" ry="${42 + i * 4}" transform="rotate(${a + seed * 7 % 40} 200 150)" fill="none" stroke="#fff" stroke-width="${mini ? 4 : 1.6}"/>`).join("") + (mini ? "" : `<path d="${Array.from({ length: 6 }, () => { const x = ri(320, 40), y = ri(240, 30); return `M${x} ${y}h4v4h-4z`; }).join("")}" fill="#fff"/>`) + `<circle cx="${ri(30, 290)}" cy="${ri(40, 100)}" r="8" fill="#fff"/>`;
  } else {
    let l = ""; for (let i = -1; i < 10; i += mini ? 3 : 1) l += `M${i * 42} 300L${i * 42 + 180} 0`;
    g = `<path d="${l}" stroke="#fff" stroke-width="${mini ? 18 : 8}" opacity=".35" fill="none"/><circle cx="${ri(120, 130)}" cy="150" r="64" fill="#fff" stroke="${INK}" stroke-width="5"/>${mini ? "" : `<path d="M110 120q70 50 130 0M118 190q60-40 110 10" fill="none" stroke="${INK}" stroke-width="4"/>`}`;
  }
  return `<svg viewBox="0 0 400 300" aria-hidden="true"><rect width="400" height="300" fill="${ART_BG[rub]}"/>${g}</svg>`;
};
const fig = (a, cls = "", mini = false) => `<figure class="un-fig un-fig--${a.rub} ${cls}">${art(a.rub, a.i + 1, mini)}</figure>`;
const avatar = (id, n) => { const r = rnd(n + 9); const hue = [RED, INK, "#6b6b6b"][n % 3]; return `<svg class="un-av" viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" fill="${PAP}"/><circle cx="60" cy="46" r="${20 + Math.round(r() * 4)}" fill="${hue}"/><path d="M18 120c0-34 18-52 42-52s42 18 42 52z" fill="${INK}"/><rect x="${20 + n * 3}" y="96" width="${30 + Math.round(r() * 30)}" height="6" fill="${RED}"/></svg>`; };
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;

// ---------- Briques de page ----------
const L = (a) => `/article#${a.id}`;
const meta = (a) => `<p class="un-meta"><span>${esc(AUT[a.au].n)}</span><span class="un-rt" data-rt>${rt(a.w)} min de lecture</span></p>`;
const tag = (a) => `<a class="un-tag" href="/rubrique#${a.rub}">${esc(RUB[a.rub])}</a>`;
const card = (a, extra = "") => `<article class="un-card ${extra}" data-cat="${a.rub}" data-words="${a.w}" data-n="${a.i}">${fig(a)}<div class="un-card-b"><p class="un-kick">${tag(a)} <span>${esc(a.k)}</span></p><h3 class="un-t3"><a href="${L(a)}">${esc(a.t)}</a></h3><p class="un-ch">${esc(a.ch)}</p>${meta(a)}</div></article>`;
const rowItem = (a) => `<article class="un-row" data-cat="${a.rub}" data-words="${a.w}" data-n="${a.i}">${fig(a, "", true)}<div class="un-row-b"><p class="un-kick">${tag(a)} <span>${esc(a.k)} · ${esc(a.d)}</span></p><h3 class="un-t3"><a href="${L(a)}">${esc(a.t)}</a></h3><p class="un-ch">${esc(a.ch)}</p>${meta(a)}</div></article>`;
const chips = (all = true, active = "") => `<div class="un-chips" role="group" aria-label="Filtrer par rubrique">${all ? `<a href="#tout" class="un-chip${active ? "" : " is-on"}" data-un-filter="tout" aria-pressed="${active ? "false" : "true"}">Tout</a>` : ""}${Object.entries(RUB).map(([k, v]) => `<a href="#${k}" class="un-chip${active === k ? " is-on" : ""}" data-un-filter="${k}" aria-pressed="${active === k ? "true" : "false"}">${v}</a>`).join("")}</div>`;

const header = (c) => {
  const navItems = c.menu.map(({ label, url }) => url === "/rubrique"
    ? `<details class="un-mega"><summary>Rubriques ${`<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`}</summary><div class="un-mega-p"><div class="un-wrap un-mega-g">${Object.entries(RUB).map(([k, v]) => `<div class="un-mega-c"><a class="un-mega-t" href="/rubrique#${k}">${v}</a>${inRub(k).slice(0, 2).map((a) => `<a class="un-mega-a" href="${L(a)}">${esc(a.t)}</a>`).join("")}</div>`).join("")}</div><div class="un-wrap un-mega-f"><a href="/rubrique">Toutes les rubriques ${arrow}</a><a href="/archives">Archives</a><a href="/newsletter">Newsletters</a></div></div></details>`
    : `<a href="${esc(url)}">${esc(label)}</a>`).join("");
  const mob = c.menu.map(({ label, url }) => `<a href="${esc(url)}">${esc(label)}</a>`).join("");
  const ticks = BREVES.slice(2).map(([, , t]) => `<span>${esc(t)}</span>`).join("");
  return `<header class="un-head pk-bleed">
  <div class="un-strip"><div class="un-wrap un-strip-in"><span class="un-date">Mercredi 4 novembre 2026</span><span class="un-edno">N° 212</span>
    <div class="un-eds" role="group" aria-label="Choisir l'édition"><a href="#matin" data-un-ed="matin" aria-pressed="false">Matin</a><a href="#midi" data-un-ed="midi" aria-pressed="false">Midi</a><a href="#soir" class="is-on" data-un-ed="soir" aria-pressed="true">Soir</a></div>
    <span class="un-edlabel" data-un-edlabel aria-live="polite">Édition du soir · mise à jour 18 h 00</span><span class="un-strip-sp"></span><a href="/newsletter">Newsletters</a><a href="/archives">Archives</a></div></div>
  <div class="un-wrap un-mast"><span class="un-mast-l">Hebdomadaire d'actualité<br>Fondé en 1998</span><a class="un-logo" href="/" aria-label="${esc(c.brand)} — accueil">Le Relais</a><a class="un-search" href="/recherche">${`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.4"/></svg>`}<span>Rechercher</span></a></div>
  <div class="un-navbar"><div class="un-wrap un-navin"><div class="un-nav" role="navigation" aria-label="Navigation principale">${navItems}</div>
    <details class="un-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span><b>Menu</b></summary><div class="un-drawer" role="navigation" aria-label="Menu mobile">${mob}<p class="un-drawer-t">Rubriques</p><div class="un-drawer-r">${Object.entries(RUB).map(([k, v]) => `<a href="/rubrique#${k}">${v}</a>`).join("")}</div></div></details></div></div>
  <div class="un-flash"><div class="un-wrap un-flash-in"><b class="un-flash-l">Flash info</b><div class="un-flash-w" aria-label="Dernières brèves"><div class="un-flash-t">${ticks}${ticks.replace(/<span>/g, '<span class="un-d" aria-hidden="true">')}</div></div></div></div></header>`;
};

const footer = (c) => `<footer class="un-foot pk-bleed"><div class="un-wrap"><div class="un-foot-w" aria-hidden="true">Le Relais</div>
  <div class="un-foot-g"><div class="un-foot-a"><p class="un-foot-lead">Comprendre l'actualité, sans bruit : une rédaction, six rubriques, une édition par jour.</p><p class="un-foot-s">Le Relais — site de démonstration. Média, rédaction, articles, personnes et faits entièrement fictifs. Seul l'article « Port-Lavande » est rédigé en entier ; les autres titres y mènent à titre d'exemple.</p></div>
  <div><p class="un-ft">Rubriques</p>${Object.entries(RUB).map(([k, v]) => `<a href="/rubrique#${k}">${v}</a>`).join("")}</div>
  <div><p class="un-ft">Le journal</p><a href="/dossier">Dossier</a><a href="/auteurs">Les auteurs</a><a href="/archives">Archives</a><a href="/newsletter">Newsletters</a></div>
  <div><p class="un-ft">Contact</p><a href="/contact">Écrire à la rédaction</a><a href="/recherche">Recherche</a><a href="mailto:redaction@exemple.fr">redaction@exemple.fr</a></div></div>
  <p class="un-legal">© 2026 Le Relais, démonstration — aucune inscription ni abonnement réel. Édition n° 212.</p></div></footer>`;

const pagehead = (kick, title, sub, extra = "") => sec(`<section class="un-ph pk-bleed"><div class="un-wrap"><p class="un-flag">${esc(kick)}</p><div class="un-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="un-dek">${esc(sub)}</p>` : ""}${extra}</div></section>`);

// ---------- Pages ----------
const hero = () => {
  const m = byId("calderia"), s1 = byId("ostrel"), s2 = byId("valdorme");
  return sec(`<section class="un-hero pk-bleed"><div class="un-wrap un-g">
  <article class="un-main"><p class="un-flag un-flag--red">À la une · ${esc(m.k)}</p>${fig(m, "un-fig--wide")}
    <div class="un-main-t" role="heading" aria-level="1"><a href="${L(m)}">${esc(m.t)}</a></div><p class="un-lead">${esc(m.ch)}</p>${meta(m)}
    <ul class="un-also"><li><span>Lire aussi</span><a href="${L(byId("ventrelle"))}">${esc(byId("ventrelle").t)}</a></li><li><span>Analyse</span><a href="${L(byId("ble"))}">${esc(byId("ble").t)}</a></li></ul></article>
  <div class="un-sec"><article class="un-s">${fig(s1)}<p class="un-kick">${tag(s1)} <span>${esc(s1.k)}</span></p><h2 class="un-t2"><a href="${L(s1)}">${esc(s1.t)}</a></h2><p class="un-ch">${esc(s1.ch)}</p>${meta(s1)}</article>
  <article class="un-s">${fig(s2)}<p class="un-kick">${tag(s2)} <span>${esc(s2.k)}</span></p><h2 class="un-t2"><a href="${L(s2)}">${esc(s2.t)}</a></h2><p class="un-ch">${esc(s2.ch)}</p>${meta(s2)}</article></div>
  <aside class="un-brv" aria-label="Brèves"><h2 class="un-brv-h"><span>Brèves</span><i data-un-edname>Édition du soir</i></h2><ol class="un-brv-l">${BREVES.map(([t, h, x]) => `<li data-t="${t}"><time>${h}</time><p>${esc(x)}</p></li>`).join("")}</ol><a class="un-more" href="/archives">Toutes les brèves ${arrow}</a></aside>
  </div></section>`);
};

const home = (c) => [
  sec(header(c)), hero(),
  sec(`<section class="un-band pk-bleed"><div class="un-wrap un-band-in"><div class="un-fig-k"><b data-count="212">212</b><span>éditions publiées</span></div><div class="un-fig-k"><b data-count="6">6</b><span>rubriques</span></div><div class="un-fig-k"><b data-count="42">42</b><span>journalistes (fictifs)</span></div><div class="un-fig-k"><b data-count="3">3</b><span>mises à jour par jour</span></div></div></section>`),
  sec(`<section class="un-feedsec pk-bleed" data-un-scope><div class="un-wrap"><div class="un-sh"><h2 class="un-h2">Toute l'actualité</h2><p class="un-count"><b data-un-count>8</b> articles</p></div>
  ${chips()}<div class="un-feed" data-un-list>${ART.slice(0, 8).map((a) => card(a)).join("")}</div><p class="un-empty" data-un-empty hidden>Aucun article dans cette rubrique pour le moment.</p><a class="un-btn" href="/rubrique">Voir toutes les rubriques ${arrow}</a></div></section>`),
  sec(`<section class="un-cols pk-bleed"><div class="un-wrap un-g">${["monde", "economie", "culture"].map((k, n) => `<div class="un-col"><h2 class="un-rubh"><a href="/rubrique#${k}"><span>0${n + 1}</span>${RUB[k]}</a></h2>${inRub(k).slice(0, 3).map((a, i) => i === 0 ? `<article class="un-cl0">${fig(a, "", true)}<h3 class="un-t3"><a href="${L(a)}">${esc(a.t)}</a></h3>${meta(a)}</article>` : `<article class="un-cl"><h3 class="un-t4"><a href="${L(a)}">${esc(a.t)}</a></h3>${meta(a)}</article>`).join("")}</div>`).join("")}</div></section>`),
  sec(`<section class="un-dos pk-bleed"><div class="un-wrap un-g"><div class="un-dos-a"><p class="un-flag un-flag--w">Dossier · 5 chapitres</p><h2 class="un-dos-t">Le grand dégel des Hautes-Terres</h2><p class="un-dos-p">Glaciers, bergers, eau, argent et avenir : un an d'enquête dans une vallée fictive qui change plus vite que ses cartes.</p><a class="un-btn un-btn--w" href="/dossier">Lire le dossier ${arrow}</a></div>
  <ol class="un-dos-l">${["Les glaciers reculent", "Ce que disent les bergers", "L'eau, bien commun", "Combien ça coûte", "Demain, la vallée"].map((t, i) => `<li><span>${i + 1}</span><a href="/dossier">${t}</a></li>`).join("")}</ol></div></section>`),
  sec(`<section class="un-edi pk-bleed"><div class="un-wrap un-g"><div class="un-edi-q"><p class="un-flag">L'éditorial</p><blockquote class="un-bq">« Informer, ce n'est pas aller plus vite que les autres. C'est arriver avec une phrase de plus qui compte. »<footer>Éditorial fictif de la rédaction en chef</footer></blockquote></div>
  <div class="un-edi-a"><p class="un-flag">Les plumes de la semaine</p><ul class="un-avs">${Object.entries(AUT).slice(0, 4).map(([id, a], n) => `<li>${avatar(id, n)}<div><b>${esc(a.n)}</b><span>${esc(a.r)}</span></div></li>`).join("")}</ul><a class="un-more" href="/auteurs">Toute la rédaction ${arrow}</a></div></div></section>`),
  sec(`<section class="un-nl pk-bleed"><div class="un-wrap un-nl-in"><div><p class="un-flag un-flag--w">Newsletters</p><h2 class="un-nl-t">L'essentiel, à l'heure choisie.</h2><p class="un-nl-p">Trois rendez-vous quotidiens : le matin, le midi, le soir. Découvrez le contenu et écrivez-nous pour recevoir celle qui vous convient.</p></div><div class="un-nl-b"><a class="un-btn un-btn--w" href="/newsletter">Voir les newsletters ${arrow}</a><a class="un-btn un-btn--ghost" href="/contact">Nous écrire</a></div></div></section>`),
  sec(footer(c)),
];

const rubrique = (c) => [sec(header(c)),
  pagehead("Les rubriques", "Toute l'actualité par rubrique", "Choisissez une rubrique, triez par date ou par lecture courte. Le temps de lecture est calculé pour chaque article."),
  sec(`<section class="un-lst pk-bleed" data-un-scope><div class="un-wrap un-g">
  <aside class="un-side"><p class="un-sideh">Rubriques</p><ul class="un-flt" role="group" aria-label="Filtrer par rubrique"><li><a href="#tout" class="is-on" data-un-filter="tout" aria-pressed="true">Toutes <i>${ART.length}</i></a></li>${Object.entries(RUB).map(([k, v]) => `<li><a href="#${k}" data-un-filter="${k}" aria-pressed="false">${v} <i>${inRub(k).length}</i></a></li>`).join("")}</ul>
  <p class="un-sideh">Trier</p><div class="un-sort" role="group" aria-label="Trier les articles"><a href="#recent" class="is-on" data-un-sort="recent" aria-pressed="true">Plus récents</a><a href="#court" data-un-sort="short" aria-pressed="false">Lecture courte</a></div></aside>
  <div class="un-lst-m"><div class="un-sh"><h2 class="un-h2" data-un-title>Toutes les rubriques</h2><p class="un-count"><b data-un-count>${ART.length}</b> articles</p></div><div data-un-list>${ART.map(rowItem).join("")}</div><p class="un-empty" data-un-empty hidden>Aucun article dans cette rubrique.</p></div>
  <aside class="un-mr"><h2 class="un-sideh">Les plus lus</h2><ol class="un-top">${["portlavande", "calderia", "mines", "lichen", "classeunique"].map((id) => byId(id)).map((a) => `<li><a href="${L(a)}">${esc(a.t)}</a><span>${esc(RUB[a.rub])}</span></li>`).join("")}</ol>
  <div class="un-box"><p class="un-flag">Newsletter</p><p>Recevez la sélection de la rédaction chaque matin.</p><a class="un-more" href="/newsletter">En savoir plus ${arrow}</a></div></aside></div></section>`),
  sec(footer(c))];

const articleFull = () => {
  const a = byId("portlavande"); let h2n = 0;
  const body = BODY.map((b) => {
    if (b[0] === "p") return `<p>${esc(b[1])}</p>`;
    if (b[0] === "h2") { h2n++; return `<h2 class="un-sub" data-toc>${esc(b[1])}</h2>`; }
    if (b[0] === "q") return `<blockquote class="un-pull"><p>« ${esc(b[1])} »</p><footer>${esc(b[2])}</footer></blockquote>`;
    return `<aside class="un-enc"><p class="un-enc-t">${esc(b[1])}</p><dl>${b[2].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></aside>`;
  }).join("");
  const rel = inRub("societe", a.id).concat(ART.filter((x) => x.rub !== "societe")).slice(0, 4);
  return sec(`<section class="un-art pk-bleed" data-un-reader><div class="un-readbar"><div class="un-wrap un-readbar-in"><span class="un-readbar-l">Mode lecture</span>
    <div class="un-rd" role="group" aria-label="Taille du texte"><a href="#plus-petit" data-un-size="-1" aria-label="Réduire le texte">A−</a><span data-un-sizeval>100 %</span><a href="#plus-grand" data-un-size="1" aria-label="Agrandir le texte">A+</a></div>
    <div class="un-rd" role="group" aria-label="Nombre de colonnes"><a href="#une-colonne" data-un-cols="1" class="is-on" aria-pressed="true">1 colonne</a><a href="#deux-colonnes" data-un-cols="2" aria-pressed="false">2 colonnes</a></div><span class="un-rtbig"><b data-un-rtime>${rt(a.w)}</b> min de lecture</span></div><div class="un-prog" aria-hidden="true"><i data-un-prog></i></div></div>
  <div class="un-wrap un-g un-art-g"><header class="un-art-h"><p class="un-flag un-flag--red">${tag(a)} · ${esc(a.k)}</p><div class="un-h1 un-h1--art" role="heading" aria-level="1">${esc(a.t)}</div><p class="un-chapo">${esc(a.ch)}</p>
    <p class="un-byline"><span>Par <b>${esc(AUT[a.au].n)}</b>, ${esc(AUT[a.au].r)}</span><time>${esc(a.d)} 2026</time><span>${a.w} mots</span></p></header>
  ${fig(a, "un-fig--hero")}<p class="un-cap">Un quai de nuit à Port-Lavande, illustration. Document fictif.</p>
  <aside class="un-toc" aria-label="Sommaire"><p class="un-sideh">Dans cet article</p><ol data-un-toc></ol></aside>
  <div class="un-body" data-un-body>${body}</div></div>
  <div class="un-wrap"><div class="un-rel" data-un-rel="societe" data-id="${a.id}"><div class="un-sh"><h2 class="un-h2">À lire aussi</h2><div class="un-sort" role="group" aria-label="Critère des suggestions"><a href="#meme-rubrique" class="is-on" data-un-relmode="rub" aria-pressed="true">Même rubrique</a><a href="#toutes" data-un-relmode="all" aria-pressed="false">Toutes les rubriques</a></div></div>
    <div class="un-rel-g" data-un-relout>${rel.map((x) => card(x)).join("")}</div>
</div></div></section>`);
};
const catalog = () => sec(`<section class="un-catalog pk-bleed"><ul>${ART.map((x) => `<li data-id="${x.id}" data-cat="${x.rub}" data-cat-n="${esc(RUB[x.rub])}" data-words="${x.w}" data-t="${esc(x.t)}" data-ch="${esc(x.ch)}" data-by="${esc(AUT[x.au].n)}" data-k="${esc(x.k)}"></li>`).join("")}</ul></section>`);
const article = (c) => [sec(header(c)), articleFull(), catalog(), sec(footer(c))];

const dossier = (c) => {
  const ch = [["Les glaciers reculent", "En trente ans, le glacier de la Brine a perdu un tiers de son épaisseur. Les relevés fictifs de la station de Haute-Roche montrent une accélération depuis 2012 et une source qui, certains étés, tarit avant septembre."], ["Ce que disent les bergers", "Les alpages montent de cent cinquante mètres chaque décennie. Les troupeaux suivent, les chemins aussi. Marthe, bergère de la vallée, a déplacé deux fois sa cabane en dix ans."], ["L'eau, bien commun", "Quatre communes, deux syndicats et une vieille convention de 1954 : le partage de l'eau se joue dans des réunions où personne n'a de pouvoir seul."], ["Combien ça coûte", "Réservoirs, canalisations, sentiers renforcés : le plan d'adaptation chiffre ses besoins à 140 millions d'euros sur quinze ans. Le financement n'est couvert qu'à moitié."], ["Demain, la vallée", "Tourisme d'été, énergie de l'eau, retour d'habitants : trois scénarios pour une vallée qui refuse d'être un musée."]];
  return [sec(header(c)),
  sec(`<section class="un-dcover pk-bleed"><div class="un-wrap un-g"><div class="un-dc-a"><p class="un-flag un-flag--w">Dossier · Enquête de six mois</p><div class="un-h1 un-h1--w" role="heading" aria-level="1">Le grand dégel des Hautes-Terres</div><p class="un-dek un-dek--w">Cinq chapitres pour comprendre ce qui change dans une vallée fictive où le froid ne revient plus tout à fait.</p><p class="un-byline un-byline--w"><span>Enquête de <b>Raphaël Estève-Lorme</b> et <b>Clémence Aubrac</b></span><span>${rt(5400)} min de lecture</span></p></div>
  <div class="un-dc-b">${art("sciences", 11).replace('class="', 'class="')}</div></div></section>`),
  sec(`<section class="un-dnums pk-bleed"><div class="un-wrap un-dn"><div><b data-count="33" data-suffix=" %">33 %</b><span>d'épaisseur perdue par le glacier de la Brine depuis 1990</span></div><div><b data-count="150" data-suffix=" m">150 m</b><span>de montée des alpages par décennie</span></div><div><b data-count="4">4</b><span>communes se partagent la même source</span></div><div><b data-count="140" data-suffix=" M€">140 M€</b><span>de besoins chiffrés sur quinze ans</span></div></div><p class="un-wrap un-note">Chiffres fictifs, créés pour la démonstration.</p></section>`),
  sec(`<section class="un-dbody pk-bleed" data-un-spy><div class="un-wrap un-g"><nav-placeholder></nav-placeholder></div></section>`.replace("<nav-placeholder></nav-placeholder>", `<aside class="un-dnav" aria-label="Chapitres du dossier"><p class="un-sideh">Chapitres</p><ol>${ch.map(([t], i) => `<li><a href="#chapitre-${i + 1}" data-un-spyl="${i}"><span>${i + 1}</span>${t}</a></li>`).join("")}</ol></aside><div class="un-dchap">${ch.map(([t, p], i) => `<section class="un-chap" data-un-spyt="${i}"><p class="un-chap-n">Chapitre ${i + 1}</p><h2 class="un-h2">${t}</h2><div class="un-chap-b"><p class="un-chap-p">${esc(p)}</p>${fig({ rub: ["sciences", "societe", "monde", "economie", "culture"][i], i: i + 20 }, "un-fig--chap")}</div>${i === 1 ? `<blockquote class="un-pull"><p>« Je n'ai pas peur de la montagne qui change. J'ai peur qu'on s'y habitue. »</p><footer>Marthe, bergère fictive du val de Haute-Brine</footer></blockquote>` : ""}</section>`).join("")}</div>`)),
  sec(`<section class="un-tl pk-bleed"><div class="un-wrap"><h2 class="un-h2">Chronologie</h2><table class="un-tbl"><caption class="un-sr">Chronologie du recul des glaciers (données fictives)</caption><thead><tr><th>Année</th><th>Événement</th><th>Épaisseur du glacier</th></tr></thead><tbody><tr><td data-l="Année">1990</td><td data-l="Événement">Premiers relevés de la station de Haute-Roche</td><td data-l="Épaisseur">100 %</td></tr><tr><td data-l="Année">2003</td><td data-l="Événement">Été de canicule, la source de la Brine tarit trois semaines</td><td data-l="Épaisseur">91 %</td></tr><tr><td data-l="Année">2012</td><td data-l="Événement">Signature de la convention des quatre communes</td><td data-l="Épaisseur">82 %</td></tr><tr><td data-l="Année">2020</td><td data-l="Événement">Premier plan d'adaptation voté</td><td data-l="Épaisseur">73 %</td></tr><tr><td data-l="Année">2026</td><td data-l="Événement">Le glacier ne couvre plus le versant nord</td><td data-l="Épaisseur">67 %</td></tr></tbody></table><div class="un-more-r"><p>À lire dans le même esprit</p>${[byId("ostrel"), byId("mines"), byId("lichen")].map((a) => `<a href="${L(a)}">${esc(a.t)}</a>`).join("")}</div></div></section>`),
  sec(footer(c))];
};

const auteurs = (c) => [sec(header(c)), pagehead("La rédaction", "Les auteurs", "Six signatures fictives, six rubriques. Filtrez par rubrique pour trouver qui écrit quoi."),
  sec(`<section class="un-aut pk-bleed" data-un-scope><div class="un-wrap"><div class="un-sh"><h2 class="un-h2">Signatures</h2><p class="un-count"><b data-un-count>6</b> auteurs</p></div>${chips()}<div class="un-aut-g" data-un-list>${Object.entries(AUT).map(([id, a], n) => { const mine = ART.filter((x) => x.au === id); return `<article class="un-au" data-cat="${a.rub}" data-n="${n}">${avatar(id, n)}<div class="un-au-b"><p class="un-kick"><a class="un-tag" href="/rubrique#${a.rub}">${RUB[a.rub]}</a></p><h3 class="un-t3">${esc(a.n)}</h3><p class="un-role">${esc(a.r)}</p><p class="un-ch">${esc(a.bio)}</p><p class="un-meta"><span>${mine.length} articles ce mois-ci</span></p><a class="un-more" href="${L(mine[0])}">${esc(mine[0].t)}</a></div></article>`; }).join("")}</div></div></section>`),
  sec(`<section class="un-chart pk-bleed"><div class="un-wrap un-g"><div class="un-chart-a"><p class="un-flag">Notre charte</p><h2 class="un-h2">Trois engagements fictifs</h2></div><ol class="un-chart-l"><li><b>Indépendance</b><p>Aucun annonceur ne relit un article avant sa publication.</p></li><li><b>Vérification</b><p>Chaque chiffre est sourcé ; chaque citation est confirmée à la source.</p></li><li><b>Correction</b><p>Une erreur est corrigée en haut de l'article, avec la date de modification.</p></li></ol></div></section>`),
  sec(footer(c))];

const newsletter = (c) => [sec(header(c)), pagehead("Newsletters", "L'essentiel, trois fois par jour", "Une newsletter pour chaque moment de la journée. Choisissez celles qui vous intéressent, puis écrivez-nous : cette page de démonstration n'enregistre aucune inscription."),
  sec(`<section class="un-nlp pk-bleed" data-un-pick><div class="un-wrap un-g"><div class="un-nlp-l"><h2 class="un-h2">Choisissez vos rendez-vous</h2><ul class="un-picks">
  ${[["matin", "Le Matin", "6 h 30", "Les trois infos de la nuit, la météo des tempêtes et l'agenda du jour. Lecture : 3 minutes."], ["midi", "Le Midi", "12 h 30", "Un décryptage de la matinée et une idée de lecture longue. Lecture : 5 minutes."], ["soir", "Le Soir", "18 h 00", "La une du jour, les brèves de l'après-midi et le portrait de la semaine. Lecture : 8 minutes."]].map(([k, t, h, d]) => `<li><a href="#${k}" class="un-pick" data-un-pickid="${t}" aria-pressed="false"><span class="un-pick-h">${h}</span><b>${t}</b><span>${d}</span><i class="un-pick-s" data-un-state>Choisir</i></a></li>`).join("")}</ul>
  <div class="un-pick-r" aria-live="polite"><p class="un-sideh">Votre sélection</p><p data-un-picksum>Aucune newsletter choisie pour l'instant.</p><a class="un-btn" href="/contact">Nous écrire pour recevoir ma sélection ${arrow}</a><p class="un-note">Démonstration : le formulaire de contact transmet votre demande à la rédaction ; aucune adresse n'est enregistrée sur cette page.</p></div></div>
  <aside class="un-mail" aria-label="Aperçu d'une newsletter"><div class="un-mail-h"><span>Le Soir</span><span>4 nov. 2026</span></div><p class="un-mail-t">Au sommet de Calderia, un pacte pour l'eau</p><p class="un-mail-p">Douze États, six nuits, une signature. Voici ce que contient l'accord.</p><hr><p class="un-mail-i"><b>17 h 20</b> Marais Noir, première nichée de butors.</p><p class="un-mail-i"><b>16 h 45</b> Rochefaye, la fête dans les tribunes.</p><p class="un-mail-i"><b>14 h 30</b> Ostrel, un cargo de blé en rade.</p><p class="un-mail-f">Aperçu fictif · Désinscription possible à tout moment par un message à la rédaction.</p></aside></div></section>`),
  sec(`<section class="un-faq pk-bleed"><div class="un-wrap un-faq-in"><h2 class="un-h2">Questions fréquentes</h2><div><details><summary>Les newsletters sont-elles gratuites ?</summary><p>Dans cette démonstration, aucune offre ni aucun tarif n'est proposé. Le formulaire de contact permet de poser la question à la rédaction.</p></details><details><summary>Puis-je changer l'heure d'envoi ?</summary><p>Les trois heures (6 h 30, 12 h 30 et 18 h 00) sont fixes. Elles suivent les trois éditions du journal.</p></details><details><summary>Comment me désinscrire ?</summary><p>Un message à la rédaction suffit ; la demande est traitée sous deux jours ouvrés.</p></details><details><summary>Que fait-on de mon adresse ?</summary><p>Elle n'est ni vendue ni partagée. Ici, rien n'est enregistré : c'est un site de démonstration.</p></details></div></div></section>`),
  sec(footer(c))];

const archives = (c) => {
  const yr = (y, start, n) => Array.from({ length: n }, (_, i) => { const a = ART[(i * 3 + y) % ART.length]; const no = start - i; const day = 31 - i * 3; const mo = ["oct.", "sept.", "août"][Math.floor(i / 4) % 3]; return `<tr data-cat="${a.rub}"><td data-l="Édition">N° ${no}</td><td data-l="Date">${((day % 28) + 1)} ${mo} ${y}</td><td data-l="À la une"><a href="${L(a)}">${esc(a.t)}</a></td><td data-l="Rubrique"><a class="un-tag" href="/rubrique#${a.rub}">${RUB[a.rub]}</a></td></tr>`; }).join("");
  const tbl = (y, s, n, on) => `<div class="un-tp${on ? " is-on" : ""}" data-un-panel="${y}"><table class="un-tbl"><caption class="un-sr">Éditions de ${y}</caption><thead><tr><th>Édition</th><th>Date</th><th>À la une</th><th>Rubrique</th></tr></thead><tbody>${yr(y, s, n)}</tbody></table></div>`;
  return [sec(header(c)), pagehead("Archives", "Toutes les éditions", "Remontez le fil : chaque édition garde sa une, ses brèves et sa date. Filtrez par rubrique et changez d'année."),
  sec(`<section class="un-arc pk-bleed" data-un-scope><div class="un-wrap"><div class="un-sh"><h2 class="un-h2">Éditions parues</h2><p class="un-count"><b data-un-count>—</b> lignes affichées</p></div>
  <div class="un-years" role="tablist" aria-label="Année"><a href="#annee-2026" class="is-on" data-un-tab="2026" role="tab" aria-selected="true">2026</a><a href="#annee-2025" data-un-tab="2025" role="tab" aria-selected="false">2025</a><a href="#annee-2024" data-un-tab="2024" role="tab" aria-selected="false">2024</a></div>
  ${chips()}<div data-un-list data-un-rows>${tbl(2026, 212, 10, true)}${tbl(2025, 160, 8)}${tbl(2024, 108, 8)}</div><p class="un-empty" data-un-empty hidden>Aucune édition pour cette rubrique cette année.</p></div></section>`),
  sec(footer(c))];
};

const contact = (c) => [sec(header(c)), pagehead("La rédaction vous répond", "Contact", "Une information, une correction, une demande de newsletter ou une question de presse : écrivez-nous."),
  { type: "form", heading: "Écrire à la rédaction", intro: "Dites-nous qui vous êtes et ce que vous souhaitez. Réponse sous deux jours ouvrés (démonstration)." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Retrouver un article", "Un titre, une rubrique, un nom d'auteur."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans Le Relais…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="un-404 pk-bleed"><div class="un-wrap"><p class="un-flag un-flag--red">Erratum</p><div class="un-h1 un-h1--404" role="heading" aria-level="1">Page introuvable</div><p class="un-dek">Cette page n'existe pas ou a changé d'adresse. Reprenez la lecture à la une.</p><a class="un-btn" href="/">Retour à la une ${arrow}</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "une", name: "Le Relais", version: "2.0.0", category: "edition", tags: ["editorial", "classique", "audacieux"], siteType: "Magazine d'actualité", featured: true,
  concept: "Une « une » de magazine à douze colonnes : un article principal, deux secondaires et des brèves, avec méga-menu des rubriques, mode lecture et « à lire aussi » calculé par rubrique.",
  description: "Magazine d'actualité fictif : blanc, noir d'encre et rouge d'info, titres Abril Fatface, une multicolonne, brèves par édition, rubriques filtrables, mode lecture, dossier, auteurs, archives et newsletters.",
  brand: "Le Relais", modules: ["formulaires", "recherche"],
  dna: { header: "bandeau-date-editions-et-mega-menu-rubriques", hero: "une-de-magazine-principal-secondaires-et-breves", grid: "douze-colonnes-dense-separees-par-filets", motion: "flash-info-defilant-et-barre-de-lecture", shapes: "filets-noirs-bandeaux-rouges-et-encadres-carres", rhythm: "colonnes-serrees-par-rubrique", signature: "rubriques-filtrables-mode-lecture-et-a-lire-aussi" },
  tokens: {
    colors: { primary: "#d4121f", secondary: "#111111", accent: "#ffe14a", background: "#ffffff", surface: "#f3f1ec", text: "#111111", muted: "#5b5b5b", success: "#1e7e34", warning: "#8a5a00", error: "#b00020" },
    fonts: { heading: "font.abril-fatface", body: "font.source-serif-4", button: "font.libre-franklin", link: "font.libre-franklin" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#111111" },
    type: { h1: { size: 72, weight: 400, lineHeight: 1, transform: "none" }, h2: { size: 40, weight: 400, lineHeight: 1.05, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge d'info", type: "color", default: "#d4121f" },
    { key: "paper", label: "Teinte du papier", type: "color", default: "#ffffff" },
    { key: "ticker", label: "Flash info défilant", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "density", label: "Densité de la grille", type: "choice", default: "dense", choices: [["dense", "Serrée"], ["airy", "Aérée"]] },
  ],
  menu: [["Accueil", "/"], ["Rubriques", "/rubrique"], ["Dossier", "/dossier"], ["Auteurs", "/auteurs"], ["Archives", "/archives"], ["Newsletters", "/newsletter"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "rubrique", name: "Rubriques", render: rubrique }, { key: "article", name: "Article", render: article },
    { key: "dossier", name: "Dossier", render: dossier }, { key: "auteurs", name: "Auteurs", render: auteurs }, { key: "newsletter", name: "Newsletters", render: newsletter },
    { key: "archives", name: "Archives", render: archives }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche },
    { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
