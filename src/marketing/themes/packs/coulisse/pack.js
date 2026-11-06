// Coulisse — conférence professionnelle. Direction artistique : l'envers du décor d'un grand rendez-vous des métiers techniques du spectacle (événement fictif « Rencontres Coulisse », Lyon,
// 18-19 mars 2027). Nuit de plateau, faisceaux de projecteurs en dégradés coniques, titres condensés en capitales, billets à encoche. Signature : programme multi-salles en grille horaire,
// filtrable par jour, salle et thème, avec « Mon programme » (étoiles conservées sur l'appareil, détection des conflits d'horaire, export agenda) et compte à rebours réel.
// Les sessions et intervenants sont écrits dans les pages du thème : le CMS n'a pas (encore) de type de contenu « session » ; la fiche le déclare.
const { sec, esc, nav } = require("../kit");

const SAL = { g: "Grande scène", a: "Atelier", s: "Studio" };
const SLOTS = [["09:30", "10:30"], ["11:00", "12:00"], ["14:00", "15:00"], ["15:30", "16:30"], ["17:00", "18:00"]];
const THEMES = { regie: "Régie", son: "Son", lumiere: "Lumière", securite: "Sécurité", durable: "Durabilité" };
const SPK = {
  ml: ["Mathilde Lavergne", "Directrice technique", "Opéra de Lyon (fictif)", "Dix-huit ans de plateaux, de la salle de 300 places aux tournées internationales."],
  ob: ["Omar Benslimane", "Ingénieur du son", "Studio Harmonie (fictif)", "Il mixe en direct pour des festivals depuis 2008 et enseigne l'acoustique des salles."],
  cd: ["Camille Dufresne", "Cheffe éclairagiste", "Compagnie Lumen (fictive)", "Elle conçoit des éclairages de théâtre et de comédies musicales, sans jamais oublier le budget."],
  tp: ["Thibault Perrin", "Responsable sécurité", "Palais des Congrès (fictif)", "Ancien sapeur-pompier, il forme les équipes à l'évacuation des salles de plus de 1 000 personnes."],
  ig: ["Inès Garnier", "Directrice de production", "Festival Premières Lueurs (fictif)", "Elle coordonne trente équipes et un budget de 2,4 millions d'euros chaque été."],
  rm: ["Raphaël Mercier", "Régisseur général", "Théâtre de la Lanterne (fictif)", "Il a rédigé le guide de régie utilisé par une vingtaine de salles de la région."],
  sh: ["Sabrina Haddad", "Ingénieure en éco-conception", "Agence Sobre (fictive)", "Elle mesure l'empreinte carbone des événements et propose des plans de réduction réalistes."],
  lb: ["Lucas Berger", "Concepteur vidéo", "Atelier Pixel (fictif)", "Il crée des scénographies vidéo pour le spectacle vivant et les congrès."],
  ep: ["Éloïse Prat", "Cheffe de plateau", "Cirque du Rhône (fictif)", "Spécialiste du montage rapide de structures et de gréages en extérieur."],
  nk: ["Nathan Kessler", "Juriste du spectacle", "Cabinet Kessler (fictif)", "Il conseille les organisateurs sur les contrats, les assurances et les autorisations."],
};
// [jour, créneau, salle, thème, type, titre, intervenants, résumé] ; salle "*" = plénière
const SES = [
  [1, 0, "*", "regie", "Plénière", "Ouverture : le plateau de demain", ["ml", "ig"], "Les grandes tendances techniques et humaines du spectacle vivant pour les cinq prochaines années."],
  [1, 1, "g", "regie", "Conférence", "Monter un festival en trois semaines", ["ig"], "Planning, sous-traitants, imprévus : retour sur dix éditions d'un festival d'été."],
  [1, 1, "a", "son", "Atelier", "Régler une salle en quarante minutes", ["ob"], "Méthode pas à pas pour égaliser une salle inconnue avec du matériel de tournée."],
  [1, 1, "s", "securite", "Conférence", "Évacuer 1 200 personnes en 6 minutes", ["tp"], "Ce que les exercices grandeur nature enseignent sur les issues, la signalétique et la voix."],
  [1, 2, "g", "lumiere", "Table ronde", "Éclairer avec moins : sobriété et création", ["cd", "sh"], "Des artistes et des ingénieurs confrontent leurs façons de concevoir avec moins de puissance."],
  [1, 2, "a", "regie", "Atelier", "Écrire une conduite lisible par tous", ["rm"], "Atelier pratique : de la feuille de conduite au dossier de régie utilisable par une équipe tournante."],
  [1, 2, "s", "durable", "Conférence", "Mesurer l'empreinte d'un événement", ["sh"], "Les trois postes qui pèsent 80 % du bilan, et comment les mesurer sans usine à gaz."],
  [1, 3, "g", "son", "Conférence", "Le direct à l'ère de l'ultra-basse latence", ["ob", "lb"], "Réseaux audio et vidéo : ce que gagne et ce que risque un plateau entièrement numérique."],
  [1, 3, "a", "lumiere", "Atelier", "Programmer un éclairage en 90 minutes", ["cd"], "Pupitre, mémoires et effets : un atelier à manipuler, sans connaissance préalable."],
  [1, 3, "s", "securite", "Conférence", "Rigging : les erreurs qui coûtent cher", ["ep"], "Cas réels d'incidents de gréage, analysés avec les rapports d'enquête (anonymisés)."],
  [1, 4, "g", "regie", "Table ronde", "Métiers techniques : attirer et garder", ["ml", "ig", "rm"], "Formation, horaires, rémunération : ce qui fait rester ou partir les techniciens."],
  [1, 4, "a", "son", "Atelier", "Microphoner un chœur de vingt voix", ["ob"], "Placement, phase, retours : l'atelier le plus demandé de l'édition précédente."],
  [1, 4, "s", "durable", "Conférence", "Réemploi des décors : le marché existe", ["sh", "ep"], "Plateformes d'échange, stockage mutualisé et règles de transport : mode d'emploi."],
  [2, 0, "*", "securite", "Plénière", "Responsabilité : qui signe quoi ?", ["nk", "tp"], "Contrats, assurances, autorisations : les responsabilités de chacun avant, pendant et après le spectacle."],
  [2, 1, "g", "lumiere", "Conférence", "La vidéo comme lumière", ["lb", "cd"], "Quand les écrans remplacent les projecteurs : avantages, limites et nouvelles écritures."],
  [2, 1, "a", "regie", "Atelier", "Planifier une tournée de quinze dates", ["ig"], "Camions, hébergements, fiches techniques : l'outil de planification qui évite les trous."],
  [2, 1, "s", "durable", "Conférence", "Alimentation des équipes : le levier oublié", ["sh"], "Repas, déchets, circuits courts : l'impact réel d'une cantine d'événement."],
  [2, 2, "g", "son", "Table ronde", "Acoustique et voisinage", ["ob", "nk"], "Limiter le bruit sans limiter la création : normes, mesures et dialogue avec les riverains."],
  [2, 2, "a", "securite", "Atelier", "Premiers secours en coulisses", ["tp"], "Gestes d'urgence adaptés aux plateaux : chutes, brûlures, malaises, avec mannequins."],
  [2, 2, "s", "regie", "Conférence", "Documenter pour transmettre", ["rm"], "Pourquoi tout ce qui n'est pas écrit disparaît : formats, outils et habitudes d'équipe."],
  [2, 3, "g", "lumiere", "Conférence", "Éclairer en extérieur : vent, pluie, nuit", ["cd", "ep"], "Contraintes mécaniques et électriques d'un éclairage en plein air, avec des exemples chiffrés."],
  [2, 3, "a", "son", "Atelier", "Écoute critique : cinq mixages, cinq choix", ["ob"], "On écoute ensemble, on discute : ce que l'oreille entraînée entend que la mesure ne dit pas."],
  [2, 3, "s", "durable", "Table ronde", "Budgets verts : qui paie la transition ?", ["sh", "ig", "nk"], "Financeurs, organisateurs et prestataires comparent leurs marges de manœuvre."],
  [2, 4, "*", "regie", "Plénière", "Clôture : ce que nous emportons", ["ml"], "Synthèse des deux jours, annonce de l'édition 2028 et remise du prix de la régie."],
];
const TICKETS = [["Journée", "140 €", "Un jour au choix", ["Accès à toutes les sessions du jour", "Déjeuner et pauses", "Supports de présentation"], false], ["Pass 2 jours", "240 €", "Le plus choisi", ["Accès aux deux jours", "Déjeuners, pauses et soirée", "Atelier réservé en priorité", "Supports et enregistrements"], true], ["Étudiant", "60 €", "Sur justificatif", ["Accès aux deux jours", "Pauses incluses", "Atelier au choix"], false]];
const FAQ = [["Les billets sont-ils remboursables ?", "Oui, jusqu'à quinze jours avant l'événement. Ensuite, le billet est transférable à un collègue sans frais."], ["Les sessions sont-elles enregistrées ?", "Les conférences de la Grande scène le sont. Les ateliers, non : ils reposent sur la pratique en salle."], ["Y a-t-il un tarif pour les équipes ?", "À partir de cinq billets achetés ensemble, une remise de 15 % est appliquée. Écrivez-nous pour un devis."], ["Le lieu est-il accessible ?", "Toutes les salles sont de plain-pied ou desservies par ascenseur. Une boucle magnétique équipe la Grande scène."]];
const MON = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const sid = (i) => `s${i + 1}`;
const sp = (k) => SPK[k][0];
const ini = (k) => SPK[k][0].split(" ").map((w) => w[0]).join("");

const mask = `<svg class="co-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v8a8 8 0 0 1-16 0zM8 10h2M14 10h2M9 15q3 2.5 6 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const header = (c) => `<header class="co-head pk-bleed"><div class="co-date"><div class="co-wrap co-date-in"><span>18-19 mars 2027 · Lyon · 3 salles · 24 sessions</span><span class="co-cd" role="timer" aria-label="Compte à rebours avant l'événement">J-<b data-cd="d">—</b> <b data-cd="h">—</b> h <b data-cd="m">—</b> min</span></div></div>
<div class="co-bar"><div class="co-wrap co-bar-in"><a class="co-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mask}<span>${esc(c.brand)}</span></a><div class="co-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu.slice(1))}</div><a class="co-cta" href="/billetterie">Réserver ma place</a>
<details class="co-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="co-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a href="/billetterie">Réserver ma place</a></div></details></div></div></header>`;
const footer = (c) => `<footer class="co-foot pk-bleed"><div class="co-wrap co-foot-in"><div class="co-foot-b"><div class="co-foot-logo">${esc(c.brand)}</div><p>Rencontres des métiers techniques du spectacle vivant et de l'événementiel. Événement, intervenants et tarifs fictifs, pour la démonstration.</p></div>
<div class="co-foot-c"><h2>L'événement</h2><a href="/programme">Programme</a><a href="/intervenants">Intervenants</a><a href="/billetterie">Billetterie</a><a href="/infos">Infos pratiques</a></div>
<div class="co-foot-c"><h2>Aide</h2><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="/blocs">Éléments de page</a></div>
<div class="co-foot-c"><h2>Légal</h2><a href="/mentions">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div></div>
<p class="co-legal">© ${esc(c.brand)} — site de démonstration. Événement, programme, personnes et tarifs sont fictifs.</p></footer>`;
const pagehead = (kick, title, sub, crumb) => sec(`<section class="co-ph pk-bleed"><div class="co-beams" aria-hidden="true"></div><div class="co-wrap co-ph-in"><p class="co-crumb"><a href="/">Accueil</a> <span aria-hidden="true">/</span> ${esc(crumb || kick)}</p><p class="co-kick">${esc(kick)}</p><div class="co-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="co-lead">${esc(sub)}</p>` : ""}</div></section>`);

const sesCard = (s, i) => {
  const [d, sl, sa, th, ty, ti, sps, re] = s, plen = sa === "*";
  return `<article class="co-ses co-s-${plen ? "all" : sa}${plen ? " co-ses--all" : ""}" data-id="${sid(i)}" data-day="${d}" data-slot="${sl}" data-salle="${plen ? "g" : sa}" data-th="${th}"><div class="co-ses-h"><span class="co-ses-t">${SLOTS[sl][0]} – ${SLOTS[sl][1]}</span><span class="co-ses-r">${plen ? "Toutes salles" : SAL[sa]}</span></div><h3 class="co-ses-ti">${esc(ti)}</h3><p class="co-ses-p">${sps.map(sp).map(esc).join(" · ")}</p><p class="co-ses-x">${esc(re)}</p><div class="co-ses-f"><span class="co-badge">${esc(ty)}</span><span class="co-badge co-badge--t">${THEMES[th]}</span><a class="co-star" href="#favori-${sid(i)}" role="button" aria-pressed="false" data-star="${sid(i)}"><span aria-hidden="true">☆</span><span class="co-star-l">Ajouter</span></a></div></article>`.replace('', "");
};
const dayGrid = (d) => `<div class="co-day" data-dayblock="${d}"><h3 class="co-day-h">${d === 1 ? "Jeudi 18 mars" : "Vendredi 19 mars"} 2027</h3><div class="co-cols" aria-hidden="true"><span></span><span class="co-c-g">Grande scène</span><span class="co-c-a">Atelier</span><span class="co-c-s">Studio</span></div>${SLOTS.map((t, sl) => {
  const row = SES.map((s, i) => [s, i]).filter(([s]) => s[0] === d && s[1] === sl);
  return `<div class="co-row" data-row><div class="co-time">${t[0]}<small>${t[1]}</small></div><div class="co-cells">${row.map(([s, i]) => sesCard(s, i)).join("")}</div></div>`;
}).join("")}</div>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="co-hero pk-bleed"><div class="co-beams co-beams--h" aria-hidden="true"></div><div class="co-wrap co-hero-in"><p class="co-kick">Rencontres des métiers techniques · 3ᵉ édition</p><div class="co-h1" role="heading" aria-level="1">Passez de l'autre côté du rideau.</div><p class="co-lead">Deux jours à Lyon pour ceux qui font tenir les spectacles debout : régie, son, lumière, sécurité, production. 24 sessions, 10 intervenants, 3 salles.</p><p><a class="co-btn" href="/billetterie">Réserver ma place</a> <a class="co-btn co-btn--o" href="/programme">Voir le programme</a></p>
<dl class="co-fig"><div><dt>Dates</dt><dd>18-19 mars 2027</dd></div><div><dt>Lieu</dt><dd>Halle Tony-Garnier, Lyon</dd></div><div><dt>Début dans</dt><dd><span class="co-cd2"><b data-cd="d">—</b> j <b data-cd="h">—</b> h</span></dd></div></dl></div></section>`),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-sh"><h2 class="co-h2">Deux jours, trois salles</h2><a class="co-more" href="/programme">Programme complet →</a></div><div class="co-three">${[["g", "Grande scène", "Conférences, tables rondes et plénières, 800 places."], ["a", "Atelier", "Pratique, matériel en main, 60 places."], ["s", "Studio", "Conférences ciblées et retours de terrain, 150 places."]].map(([k, n, x]) => `<article class="co-room co-s-${k}"><p class="co-room-n">${n}</p><p>${x}</p><p class="co-room-c">${SES.filter((q) => q[2] === k || (k === "g" && q[2] === "*")).length} sessions</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="co-s co-s--t pk-bleed"><div class="co-wrap"><div class="co-sh"><h2 class="co-h2">Cinq thèmes</h2></div><ul class="co-themes">${Object.entries(THEMES).map(([k, n]) => `<li><a href="/programme#theme-${k}"><b>${n}</b><span>${SES.filter((s) => s[3] === k).length} sessions</span></a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-sh"><h2 class="co-h2">Ils parleront</h2><a class="co-more" href="/intervenants">Tous les intervenants →</a></div><div class="co-spk">${Object.entries(SPK).slice(0, 5).map(([k, v]) => `<a class="co-sp" href="/intervenant"><span class="co-av" aria-hidden="true">${ini(k)}</span><b>${esc(v[0])}</b><span>${esc(v[1])}</span></a>`).join("")}</div></div></section>`),
  sec(`<section class="co-band pk-bleed"><div class="co-wrap co-band-in"><p>Pass 2 jours à 240 € jusqu'au 31 décembre, puis 290 €.</p><a class="co-btn" href="/billetterie">Voir les tarifs</a></div></section>`),
  sec(footer(c)),
];

const programme = (c) => [
  sec(header(c)),
  pagehead("Programme", "Programme des deux jours", "Filtrez par jour, salle ou thème, puis étoilez vos sessions : « Mon programme » signale les conflits d'horaire.", "Programme"),
  sec(`<section class="co-s pk-bleed" data-prog><div class="co-wrap"><div class="co-tools" role="group" aria-label="Filtres du programme">
<div class="co-chips" data-g="day"><span class="co-lab">Jour</span><a class="co-chip is-on" href="#jour-all" role="button" data-v="all" aria-pressed="true">Les deux</a><a class="co-chip" href="#jour-1" role="button" data-v="1" aria-pressed="false">Jeudi 18</a><a class="co-chip" href="#jour-2" role="button" data-v="2" aria-pressed="false">Vendredi 19</a></div>
<div class="co-chips" data-g="salle"><span class="co-lab">Salle</span><a class="co-chip is-on" href="#salle-all" role="button" data-v="all" aria-pressed="true">Toutes</a>${Object.entries(SAL).map(([k, n]) => `<a class="co-chip co-s-${k}" href="#salle-${k}" role="button" data-v="${k}" aria-pressed="false">${n}</a>`).join("")}</div>
<div class="co-chips" data-g="th"><span class="co-lab">Thème</span><a class="co-chip is-on" href="#theme-all" role="button" data-v="all" aria-pressed="true">Tous</a>${Object.entries(THEMES).map(([k, n]) => `<a class="co-chip" href="#theme-${k}" role="button" data-v="${k}" aria-pressed="false">${n}</a>`).join("")}</div></div>
<p class="co-count" role="status"><b data-n>24</b> session(s) affichée(s)</p>
<aside class="co-mine" aria-label="Mon programme"><h2 class="co-h3">Mon programme</h2><p class="co-mine-n" role="status"><b data-mine-n>0</b> session(s) · <b data-mine-h>0 h</b></p><ol class="co-mine-l" data-mine-list></ol><p class="co-mine-w" data-mine-warn></p><p class="co-fine" data-mine-empty>Étoilez une session pour la retrouver ici. Vos choix restent sur cet appareil.</p><a class="co-btn co-btn--o" href="#agenda" role="button" data-ics>Exporter vers mon agenda</a></aside></div></section>`),
  sec(`<section class="co-s co-s--days pk-bleed"><div class="co-wrap" data-days>${dayGrid(1)}</div></section>`),
  sec(`<section class="co-s co-s--days pk-bleed"><div class="co-wrap" data-days>${dayGrid(2)}<div class="co-empty" data-empty><p class="co-h3">Aucune session ne correspond.</p><p><a href="#jour-all" data-reset>Réinitialiser les filtres</a></p></div></div></section>`),
  sec(footer(c)),
];

const intervenants = (c) => [
  sec(header(c)),
  pagehead("Intervenants", "Dix professionnels de terrain", "Des praticiens, pas des conférenciers de métier : chacun présente un retour d'expérience.", "Intervenants"),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-spk co-spk--l">${Object.entries(SPK).map(([k, v]) => { const n = SES.filter((s) => s[6].includes(k)).length; return `<a class="co-sp" href="/intervenant"><span class="co-av" aria-hidden="true">${ini(k)}</span><b>${esc(v[0])}</b><span>${esc(v[1])}, ${esc(v[2])}</span><span class="co-sp-b">${esc(v[3])}</span><span class="co-sp-n">${n} session${n > 1 ? "s" : ""}</span></a>`; }).join("")}</div></div></section>`),
  sec(footer(c)),
];

const intervenant = (c) => {
  const k = "ob", v = SPK[k], mine = SES.map((s, i) => [s, i]).filter(([s]) => s[6].includes(k));
  return [
    sec(header(c)),
    pagehead("Intervenant", esc(v[0]), `${v[1]}, ${v[2]}`, "Intervenants"),
    sec(`<section class="co-s pk-bleed"><div class="co-wrap co-fiche"><aside class="co-fiche-m"><span class="co-av co-av--l" aria-hidden="true">${ini(k)}</span><p class="co-lab">Fonction</p><p>${esc(v[1])}</p><p class="co-lab">Structure</p><p>${esc(v[2])}</p><p class="co-lab">Thèmes</p><p>Son, direct, acoustique</p></aside>
<div class="co-prose"><h2>Parcours</h2><p>${esc(v[3])} Il a débuté comme assistant en salle de concert, avant de devenir responsable son d'un festival de musiques actuelles, puis ingénieur indépendant.</p><p>Ses interventions mêlent écoute, mesure et démonstration : le public repart avec une méthode qu'il peut appliquer dès le lendemain.</p><blockquote class="co-quote"><p>« Une bonne sonorisation, c'est celle dont personne ne parle. »</p><cite>${esc(v[0])}</cite></blockquote><h2>Ses sessions</h2><ul class="co-lst">${mine.map(([s, i]) => `<li><b>${s[0] === 1 ? "Jeudi" : "Vendredi"} ${SLOTS[s[1]][0]}</b> — ${esc(s[5])} <small>(${s[2] === "*" ? "Toutes les salles" : SAL[s[2]]})</small></li>`).join("")}</ul><p><a class="co-btn" href="/programme">Voir le programme</a> <a class="co-btn co-btn--o" href="/intervenants">Tous les intervenants</a></p></div></div></section>`),
    sec(footer(c)),
  ];
};

const billetterie = (c) => [
  sec(header(c)),
  pagehead("Billetterie", "Réserver sa place", "Trois formules, TVA incluse. Les tarifs de la démonstration sont fictifs.", "Billetterie"),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-tk">${TICKETS.map(([n, p, s, l, hot]) => `<article class="co-ticket${hot ? " co-ticket--hot" : ""}"><p class="co-kick">${esc(s)}</p><h2 class="co-h3">${n}</h2><p class="co-price">${p}</p><ul>${l.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><a class="co-btn${hot ? "" : " co-btn--o"}" href="/contact">Réserver : ${n}</a></article>`).join("")}</div>
<p class="co-fine">La réservation passe par le formulaire de <a href="/contact">contact</a> : indiquez la formule et le nombre de places. Aucun paiement n'est demandé dans cette démonstration.</p>
<h2 class="co-h2 co-mt">Questions fréquentes</h2><div class="co-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div></section>`),
  sec(footer(c)),
];

const infos = (c) => [
  sec(header(c)),
  pagehead("Infos pratiques", "Venir, loger, se restaurer", "Tout ce qu'il faut savoir avant de partir.", "Infos pratiques"),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-3"><div><h2 class="co-h3">Lieu</h2><address>Halle Tony-Garnier (fictive)<br>20 place des Docks<br>69007 Lyon</address><p class="co-fine">Ouverture des portes à 8 h 30.</p></div><div><h2 class="co-h3">Accès</h2><ul class="co-lst"><li><b>Métro</b> ligne B, station Halles (8 min à pied)</li><li><b>Train</b> gare de Lyon-Part-Dieu, 20 minutes</li><li><b>Voiture</b> parking de 400 places, 6 € la journée</li></ul></div><div><h2 class="co-h3">Repas</h2><p>Déjeuner et pauses compris dans les pass. Menus végétariens et sans gluten sur demande lors de la réservation.</p></div></div>
<h2 class="co-h2 co-mt">Horaires types</h2><div class="co-scroll" data-scroll><table class="co-tab"><caption>Journée type</caption><thead><tr><th scope="col">Heure</th><th scope="col">Quoi</th></tr></thead><tbody><tr><th scope="row">8 h 30</th><td>Accueil et café</td></tr><tr><th scope="row">9 h 30</th><td>Première session</td></tr><tr><th scope="row">12 h 00</th><td>Déjeuner (90 minutes)</td></tr><tr><th scope="row">14 h 00</th><td>Sessions de l'après-midi</td></tr><tr><th scope="row">18 h 00</th><td>Fin des sessions, rencontres avec les intervenants</td></tr></tbody></table></div></div></section>`),
  { type: "layout", children: [{ type: "map", props: { address: "20 place des Docks, 69007 Lyon", zoom: 14, height: 360 } }] },
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Nous écrire", "Réservations de groupe, questions, partenariats : indiquez le sujet dans votre message.", "Contact"),
  { type: "form", heading: "Votre message", intro: "La démonstration n'envoie rien à un vrai organisateur, mais le formulaire fonctionne comme sur un vrai site." },
  sec(`<section class="co-s co-s--t pk-bleed"><div class="co-wrap co-3"><div><h2 class="co-h3">Billetterie</h2><p>Réponse sous 48 heures ouvrées.</p></div><div><h2 class="co-h3">Presse</h2><p><a href="mailto:presse@coulisse.example">presse@coulisse.example</a></p></div><div><h2 class="co-h3">Partenaires</h2><p><a href="mailto:partenaires@coulisse.example">partenaires@coulisse.example</a></p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher sur le site", "Un mot, un intervenant, un thème.", "Recherche"),
  { type: "layout", children: [{ type: "search", props: { target: "catalogue", placeholder: "Rechercher…" } }] },
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-nores"><h2 class="co-h3">Aucun résultat ?</h2><p>Essayez un nom d'intervenant ou un thème (« lumière », « sécurité »), ou parcourez directement le programme.</p><p><a class="co-btn" href="/programme">Programme</a> <a class="co-btn co-btn--o" href="/intervenants">Intervenants</a></p></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="co-404 pk-bleed"><div class="co-beams" aria-hidden="true"></div><div class="co-wrap co-404-in"><div class="co-404-n" aria-hidden="true">404</div><div><p class="co-kick">Page introuvable</p><div class="co-h1" role="heading" aria-level="1">Les lumières se sont éteintes.</div><p class="co-lead">Cette page n'existe pas ou plus. Retrouvez la scène depuis l'accueil.</p><p><a class="co-btn" href="/">Retour à l'accueil</a> <a class="co-btn co-btn--o" href="/programme">Programme</a> <a class="co-btn co-btn--o" href="/recherche">Rechercher</a></p></div></div></section>`),
  sec(footer(c)),
];
const legal = (title, crumb, html) => (c) => [sec(header(c)), pagehead("Informations légales", title, "", crumb), sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-prose">${html}</div></div></section>`), sec(footer(c))];
const mentions = legal("Mentions légales", "Mentions légales", `<h2>Éditeur</h2><p>Ce site est une démonstration du thème « Coulisse ». Aucun événement réel n'y est annoncé. Remplacez ces mentions par la dénomination de l'organisateur, son adresse, son numéro d'immatriculation et le responsable de la publication.</p><h2>Hébergement</h2><p>Indiquez le nom et l'adresse de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les noms, programmes et visuels de cette démonstration sont fictifs.</p><h2>Contact</h2><p>Utilisez la <a href="/contact">page de contact</a>.</p>`);
const confidentialite = legal("Politique de confidentialité", "Confidentialité", `<h2>Données traitées</h2><p>Le formulaire recueille votre nom, votre adresse électronique et votre message pour répondre à votre demande. Dans cette démonstration, rien n'est transmis.</p><h2>Mon programme</h2><p>Les sessions étoilées sont conservées uniquement dans votre navigateur, sur votre appareil. Elles ne sont envoyées nulle part.</p><h2>Vos droits</h2><p>Accès, rectification, suppression : écrivez depuis la <a href="/contact">page de contact</a>.</p><h2>Durée</h2><p>Messages conservés douze mois au plus (exemple à adapter).</p>`);
const blocs = (c) => [
  sec(header(c)),
  pagehead("Guide de mise en page", "Éléments de mise en page", "Titres, listes, citations, tableaux, code, boutons et colonnes du thème.", "Éléments"),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-prose">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec un <a href="/programme">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, du <mark>surligné</mark> et du <code>code en ligne</code>. La ligne reste entre soixante et quatre-vingts caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li><li>Troisième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote class="co-quote"><p>« Une citation sous les projecteurs. »</p><cite>Mathilde Lavergne</cite></blockquote>
<figure class="co-fig"><div class="co-beams co-beams--f" aria-hidden="true"></div><figcaption>Une image avec sa légende : faisceaux de projecteurs dessinés en CSS.</figcaption></figure>
<div class="co-scroll" data-scroll><table class="co-tab"><caption>Sessions par thème</caption><thead><tr><th scope="col">Thème</th><th scope="col">Sessions</th><th scope="col">Salle principale</th></tr></thead><tbody>${Object.entries(THEMES).map(([k, n]) => `<tr><th scope="row">${n}</th><td>${SES.filter((s) => s[3] === k).length}</td><td>${["Grande scène", "Atelier", "Studio", "Grande scène", "Studio"][Object.keys(THEMES).indexOf(k)]}</td></tr>`).join("")}</tbody></table></div>
<pre><code>cue 12 : lumière 40 % / son -3 dB / vidéo fondu 2 s</code></pre>
<p><a class="co-btn" href="/billetterie">Bouton plein</a> <a class="co-btn co-btn--o" href="/programme">Bouton contour</a></p>
<div class="co-3"><div><h3>Colonne un</h3><p>Trois colonnes sur grand écran.</p></div><div><h3>Colonne deux</h3><p>Deux sur tablette.</p></div><div><h3>Colonne trois</h3><p>Une sur mobile.</p></div></div>
<aside class="co-box"><p><b>Encadré.</b> Une information détachée du texte courant.</p></aside></div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "coulisse", name: "Coulisse", version: "1.0.0", category: "evenement", tags: ["sombre", "audacieux"], siteType: "Conférence professionnelle", collection: "pro",
  concept: "L'envers du décor d'un grand rendez-vous des métiers du spectacle : nuit de plateau, faisceaux de projecteurs, programme multi-salles en grille horaire filtrable avec « Mon programme » et compte à rebours réel.",
  description: "Site de conférence : programme en grille par salle et horaire, filtres jour/salle/thème, « Mon programme » avec détection des conflits et export agenda, intervenants, billets à encoche, compte à rebours.",
  brand: "Rencontres Coulisse", modules: ["formulaires", "recherche"],
  dna: {
    hero: "faisceaux-de-projecteurs-coniques-titre-condense-et-fiche-dates-lieu-compte-a-rebours",
    header: "bandeau-de-date-avec-compte-a-rebours-puis-barre-sombre-et-bouton-reserver",
    grid: "grille-horaire-par-salle-trois-colonnes-sur-creneaux-avec-colonne-d-heures",
    typo: "league-gothic-capitales-et-sofia-sans",
    shapes: "billets-a-encoche-pastilles-de-salle-colorees-et-faisceaux-de-lumiere",
    motion: "compte-a-rebours-reel-etoiles-de-programme-et-filtrage-instantane",
    rhythm: "nuit-continue-ponctuee-de-bandes-claires-pour-les-annonces-et-les-tarifs",
    signature: "programme-multi-salles-filtrable-avec-mon-programme-conflits-d-horaire-et-export-agenda",
    palette: "noir-de-plateau-cyan-projecteur-ambre-et-rose-par-salle",
    image: "faisceaux-coniques-en-css-et-avatars-a-initiales-sous-projecteur",
    list: "grille-lignes-ou-cartes-larges-d-intervenants-au-choix",
    article: "fiche-d-intervenant-avec-marge-d-identite-ou-bandeau-central",
    sidebar: "panneau-mon-programme-collant-a-droite-de-la-grille-horaire",
    reading: "colonne-de-66-caracteres-sans-serif-17-px-sur-fond-nuit-contraste-eleve",
  },
  tokens: {
    colors: { primary: "#4cc9f0", secondary: "#1c1c26", accent: "#ffb703", background: "#121218", surface: "#1c1c26", text: "#f1f1f6", muted: "#b4b4c4", success: "#5bd68a", warning: "#ffb703", error: "#ff8a80" },
    fonts: { heading: "font.league-gothic", body: "font.sofia-sans", button: "font.sofia-sans", link: "font.sofia-sans" },
    radius: { sm: 4, md: 8, lg: 14, button: 4, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#34344a" },
    type: { h1: { size: 72, weight: 400, lineHeight: 1, transform: "uppercase" }, h2: { size: 44, weight: 400, lineHeight: 1.05, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Couleur de projecteur", type: "color", default: "#4cc9f0" },
    { key: "entete", label: "En-tête", type: "choice", default: "barre", choices: [["barre", "Bandeau de date et barre"], ["centre", "Logo centré, menu dessous"], ["minimal", "Minimal : logo et menu replié"]] },
    { key: "liste", label: "Liste des intervenants", type: "choice", default: "grille", choices: [["grille", "Grille de cartes"], ["lignes", "Lignes compactes"], ["larges", "Cartes larges avec biographie"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "grand", choices: [["grand", "Quatre colonnes"], ["mince", "Une ligne"]] },
    { key: "fiche", label: "Fiche d'intervenant", type: "choice", default: "marge", choices: [["marge", "Marge d'identité à gauche"], ["centre", "Colonne centrée"]] },
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "nuit", choices: [["nuit", "Nuit de plateau"], ["jour", "Jour : fond clair"]] },
  ],
  menu: [["Accueil", "/"], ["Programme", "/programme"], ["Intervenants", "/intervenants"], ["Billetterie", "/billetterie"], ["Infos pratiques", "/infos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "programme", name: "Programme multi-salles", render: programme }, { key: "intervenants", name: "Intervenants", render: intervenants },
    { key: "intervenant", name: "Fiche intervenant", render: intervenant }, { key: "billetterie", name: "Billetterie", render: billetterie }, { key: "infos", name: "Infos pratiques", render: infos },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite }, { key: "blocs", name: "Éléments de mise en page", render: blocs },
  ],
};
