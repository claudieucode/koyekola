// Écho — podcast (émission fictive « Allô Bulle »). Direction artistique : audio d'abord, jaune soleil, violet profond et blanc ; bulles de BD, micros dessinés, formes d'onde.
// Signature : un lecteur d'épisodes simulé (aucune ressource externe) avec forme d'onde cliquable, chapitres, transcription synchronisée, file d'attente, vitesse
// et mini-lecteur persistant dans la barre de navigation (l'état survit à la navigation grâce à sessionStorage).
const { sec, esc, nav } = require("../kit");

// ---------- données de l'émission (fictives) ----------
const EPS = [
  { id: 1, t: "Le jour où la radio est tombée en panne", g: "Inès Dallaire", r: "technicienne du son", d: 1884, cat: "conversation", date: "3 nov. 2026", face: 0,
    sum: "À 6 h 12, tout s'éteint dans le studio. Onze minutes de silence, un seau, une vieille batterie de voiture et une animatrice qui continue de parler.",
    pts: ["Que faire quand le micro ne répond plus", "Le matériel de secours d'une petite radio", "Pourquoi le public applaudit une panne"], men: ["Une batterie de voiture", "Un seau en zinc", "Le café de 6 h"],
    ch: [[0, "Générique et salutations"], [150, "La panne de 6 h 12"], [640, "Parler dans le vide"], [1180, "Le plan B : un seau et un micro"], [1620, "Ce qu'on retient"]],
    tr: [[0, "Maëlle : Allô Bulle, bonsoir ! Ce soir, une histoire de silence qui a duré onze minutes."], [160, "Inès : À 6 h 12, tout s'est éteint, sauf mon café."], [420, "Théo : Et vous avez fait quoi, concrètement ?"], [660, "Inès : J'ai parlé. Sans savoir si quelqu'un m'entendait."], [900, "Maëlle : C'est la peur de tous les animateurs."], [1200, "Inès : On a branché un micro sur une vieille batterie de voiture."], [1450, "Théo : Et ça a marché ?"], [1650, "Inès : Pendant quarante minutes. Puis le courant est revenu, et tout le monde a applaudi."]] },
  { id: 2, t: "Pourquoi on parle plus fort au téléphone", g: "Samuel Achebe", r: "phonéticien", d: 1630, cat: "enquete", date: "27 oct. 2026", face: 1,
    sum: "Un phonéticien explique pourquoi nous haussons la voix dès qu'un combiné touche notre oreille, et comment s'en défaire sans se vexer.",
    pts: ["L'effet de retour de sa propre voix", "Le « allô ? » : un réflexe de 1876", "Un test à faire chez soi en trente secondes"], men: ["Le combiné à fil", "Un casque fermé", "Le test du doigt sur l'oreille"],
    ch: [[0, "Accroche"], [120, "Entendre sa propre voix"], [520, "L'effet « allô ? »"], [980, "Test en direct"], [1400, "Conseils pour mieux s'entendre"]],
    tr: [[0, "Théo : Samuel, pourquoi crie-t-on au téléphone ?"], [130, "Samuel : Parce qu'on s'entend moins bien, alors on compense."], [330, "Maëlle : Même quand l'autre nous entend parfaitement ?"], [540, "Samuel : Oui. Le cerveau n'a pas lu le mode d'emploi."], [800, "Théo : Et le « allô » ?"], [1000, "Samuel : Un mot court, net, qui dit « je suis là ». Essayons ensemble."], [1420, "Maëlle : Conseil du jour : parlez comme à quelqu'un d'assis à côté de vous."]] },
  { id: 3, t: "Cuisiner en direct sans rien savoir", g: "Amandine Ruiz", r: "cheffe", d: 2162, cat: "conversation", date: "20 oct. 2026", face: 2,
    sum: "Une cheffe guide l'équipe, au micro seulement, pour réussir un repas complet sans jamais voir les casseroles. Le sel s'en souvient.",
    pts: ["Cuisiner par la parole, sans regarder", "Les trois erreurs de débutant", "Une dégustation à l'aveugle en studio"], men: ["Un four sans thermostat", "La sauce qui ne lie pas", "Du sel, beaucoup trop"],
    ch: [[0, "Mise en bouche"], [200, "Le pari"], [700, "Première erreur de sel"], [1300, "La sauce qui lie (ou pas)"], [1800, "Dégustation à l'aveugle"]],
    tr: [[0, "Maëlle : Ce soir, Théo cuisine. Théo, on t'encourage."], [210, "Amandine : Première règle : on goûte avant d'ajouter quoi que ce soit."], [560, "Théo : J'ai déjà ajouté du sel."], [720, "Amandine : Combien ? Théo ? Combien ?"], [1320, "Maëlle : La sauce ressemble à un lac."], [1500, "Amandine : On la fait réduire, on respire."], [1820, "Théo : Ça a le goût… d'une leçon."]] },
  { id: 4, t: "Les bruits de mon enfance", g: "Nadia Perrin", r: "bruiteuse", d: 1488, cat: "conversation", date: "13 oct. 2026", face: 3,
    sum: "Une bruiteuse rejoue les sons de son enfance : le frigo, la pluie sur un toit de tôle, un pas dans la neige. Avec une devinette en fin d'épisode.",
    pts: ["Fabriquer de la pluie avec du riz", "Pourquoi le frigo nous rassure", "Devinette sonore : trouvez l'objet"], men: ["Un sac de riz", "Du papier cellophane", "Une botte d'hiver"],
    ch: [[0, "Écoute d'ouverture"], [140, "Le bruit du frigo"], [520, "Fabriquer la pluie"], [900, "Un pas dans la neige"], [1250, "Devinette sonore"]],
    tr: [[0, "Nadia : Fermez les yeux. Vous entendez ? C'est un frigo."], [150, "Théo : Mon enfance entière tient dans ce ronronnement."], [540, "Nadia : Pour la pluie, du riz sur un plateau. Toujours."], [910, "Maëlle : On dirait vraiment de la neige."], [1100, "Nadia : Du sucre en poudre dans un sac, on appuie doucement."], [1260, "Théo : Devinette ! C'était… une porte de voiture ?"]] },
  { id: 5, t: "Dix minutes de silence, vraiment ?", g: "Louis Verhaeghe", r: "randonneur", d: 1776, cat: "enquete", date: "6 oct. 2026", face: 4,
    sum: "Dix minutes sans parler, en direct. Un randonneur qui marche seul depuis vingt ans raconte ce qu'on entend quand tout le reste se tait.",
    pts: ["Le premier silence est toujours le plus bruyant", "Ce que l'on entend en forêt", "Revenir à la parole en douceur"], men: ["Des chaussures de marche", "Un carnet à spirale", "Le vent dans les épicéas"],
    ch: [[0, "On ferme la porte"], [180, "Le premier silence"], [620, "Ce qu'on entend ensuite"], [1100, "Le bruit de la pensée"], [1500, "Retour à la parole"]],
    tr: [[0, "Maëlle : Pari fou : dix minutes sans un mot. Louis, tu nous guides."], [190, "Louis : Au début, on entend son propre cœur. Ensuite, la pièce."], [640, "Théo : J'entends la lumière… ça existe ?"], [1000, "Louis : Ça existe. C'est le néon qui vibre."], [1120, "Maëlle : Mon cerveau parle plus fort que moi."], [1520, "Théo : On a survécu. Je crois que j'ai faim."]] },
  { id: 6, t: "Le micro est ouvert (épisode spécial)", g: "Les auditrices et auditeurs", r: "invités du jour", d: 2475, cat: "special", date: "29 sept. 2026", face: 5,
    sum: "Toute l'équipe répond aux questions les plus farfelues envoyées par le public, joue au jeu des voix et lit la lettre de la semaine.",
    pts: ["Questions farfelues, réponses sérieuses", "Le jeu des voix : qui parle ?", "La lettre de la semaine"], men: ["Une boîte à questions", "Un chronomètre de cuisine", "La lettre du jeudi"],
    ch: [[0, "Ouverture"], [300, "Questions farfelues"], [900, "Le jeu des voix"], [1500, "Lettre de la semaine"], [2100, "Au revoir sonore"]],
    tr: [[0, "Théo : Le micro est ouvert, et le courrier déborde."], [310, "Maëlle : Question de Camille : les poissons s'entendent-ils parler ?"], [620, "Théo : On a demandé à un poisson. Il n'a rien dit."], [910, "Maëlle : Jeu des voix. Qui parle ? Dix secondes."], [1510, "Théo : Dans la lettre de la semaine, une idée d'émission."], [2110, "Maëlle : À jeudi prochain, et merci de nous écouter."]] },
];
const dur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const mins = (s) => `${Math.round(s / 60)} min`;
const two = (n) => String(n).padStart(2, "0");

// ---------- dessins ----------
const N = 72;
const amp = (i, ep) => 0.14 + 0.86 * (Math.abs(Math.sin(i * 0.37 + ep)) * Math.abs(Math.cos(i * 0.11 + ep * 2)) * 0.7 + Math.abs(Math.sin(i * 1.3 + ep * 5)) * 0.3);
const waveSvg = (ep) => `<svg viewBox="0 0 720 160" preserveAspectRatio="none" aria-hidden="true">${Array.from({ length: N }, (_, i) => { const h = Math.round(amp(i, ep) * 150 * 10) / 10; return `<rect x="${i * 10 + 1.5}" y="${Math.round((80 - h / 2) * 10) / 10}" width="7" height="${h}"/>`; }).join("")}</svg>`;
const bridge = (from, to, flip) => {
  let d = flip ? "M0 0" : "M0 48"; const pts = [];
  for (let x = 0; x <= 1440; x += 30) pts.push(`${x} ${Math.round(24 + Math.sin(x / 90 + (flip ? 2 : 0)) * 14 + Math.sin(x / 37) * 5)}`);
  d += " L" + pts.join(" L") + (flip ? " L1440 0Z" : " L1440 48Z");
  return sec(`<div class="ec-bridge ec-b-${from} pk-bleed" aria-hidden="true"><svg class="ec-f-${to}" viewBox="0 0 1440 48" preserveAspectRatio="none"><path d="${d}" fill="currentColor"/></svg></div>`);
};
const I = {
  play: `<svg class="ec-ico-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`,
  pause: `<svg class="ec-ico-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.5" height="14" fill="currentColor"/><rect x="13.5" y="5" width="4.5" height="14" fill="currentColor"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14l9-7z" fill="currentColor"/><rect x="16" y="5" width="3" height="14" fill="currentColor"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14l-9-7z" fill="currentColor"/><rect x="5" y="5" width="3" height="14" fill="currentColor"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
const playIco = I.play + I.pause;
const logoMark = `<svg class="ec-mark-svg" viewBox="0 0 48 48" aria-hidden="true"><path d="M6 8h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H26l-9 8v-8H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#ffc72c" stroke="#24094f" stroke-width="3" stroke-linejoin="round"/><path d="M19 15a5 5 0 0 1 10 0v7a5 5 0 0 1-10 0z" fill="#4b1fb5"/><path d="M15 21v1a9 9 0 0 0 18 0v-1" fill="none" stroke="#24094f" stroke-width="2.6" stroke-linecap="round"/></svg>`;
const micArt = `<svg class="ec-mic" viewBox="0 0 340 400" aria-hidden="true">
  <g class="ec-rings" fill="none" stroke="#24094f" stroke-width="6" stroke-linecap="round"><path class="ec-ring r1" d="M66 120c-18 30-18 70 0 100"/><path class="ec-ring r2" d="M36 100c-30 42-30 98 0 140"/><path class="ec-ring r1" d="M274 120c18 30 18 70 0 100"/><path class="ec-ring r2" d="M304 100c30 42 30 98 0 140"/></g>
  <path d="M170 292v54M104 352h132" stroke="#24094f" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M82 170v30c0 52 38 84 88 84s88-32 88-84v-30" fill="none" stroke="#24094f" stroke-width="12" stroke-linecap="round"/>
  <path d="M106 112a64 64 0 0 1 128 0v96a64 64 0 0 1-128 0z" fill="#4b1fb5" stroke="#24094f" stroke-width="8"/>
  <g stroke="#7d5fe0" stroke-width="3" opacity=".7"><line x1="114" y1="92" x2="226" y2="92"/><line x1="108" y1="132" x2="232" y2="132"/><line x1="108" y1="172" x2="232" y2="172"/><line x1="114" y1="212" x2="226" y2="212"/></g>
  <circle cx="142" cy="140" r="17" fill="#fff"/><circle cx="198" cy="140" r="17" fill="#fff"/><circle class="ec-pupil" cx="146" cy="143" r="8" fill="#24094f"/><circle class="ec-pupil" cx="202" cy="143" r="8" fill="#24094f"/>
  <path d="M140 176c8 22 52 22 60 0z" fill="#24094f"/><path d="M152 190c8 6 28 6 36 0" fill="none" stroke="#ff7a8a" stroke-width="5" stroke-linecap="round"/>
  <circle cx="122" cy="168" r="9" fill="#ff9bb0" opacity=".85"/><circle cx="218" cy="168" r="9" fill="#ff9bb0" opacity=".85"/></svg>`;
const HAIR = ["#24094f", "#1a1a1a", "#7a3b12", "#d9a441", "#8a8f98", "#c2410c"], SKIN = ["#f1c9a5", "#a8683a", "#e0a57a", "#7a4a2a", "#f5d3b3", "#c98a5c"], BG = ["#ffc72c", "#e9defc", "#ffe48a", "#c9b6f5", "#ffd966", "#ddd0fa"], SHIRT = ["#4b1fb5", "#24094f", "#ff7a8a", "#4b1fb5", "#24094f", "#f59e0b"];
const face = (k) => {
  const h = HAIR[k], s = SKIN[k];
  const back = [`<path d="M26 44c0-22 10-32 22-32s22 10 22 32z" fill="${h}"/>`, `<circle cx="48" cy="38" r="30" fill="${h}"/>`, `<path d="M24 46c0-24 10-34 24-34s24 10 24 34v30H24z" fill="${h}"/>`, `<path d="M30 40c0-18 8-26 18-26s18 8 18 26z" fill="${h}"/>`, `<circle cx="48" cy="14" r="9" fill="${h}"/><path d="M28 42c0-20 8-26 20-26s20 6 20 26z" fill="${h}"/>`, `<circle cx="32" cy="28" r="12" fill="${h}"/><circle cx="48" cy="22" r="13" fill="${h}"/><circle cx="64" cy="28" r="12" fill="${h}"/>`][k];
  const beard = k === 3 ? `<path d="M31 50c2 22 12 26 17 26s15-4 17-26c-5 8-11 10-17 10s-12-2-17-10z" fill="#3a2410"/>` : "";
  const glasses = k === 1 || k === 4 ? `<g fill="none" stroke="#24094f" stroke-width="2.4"><circle cx="40" cy="47" r="7"/><circle cx="56" cy="47" r="7"/><path d="M47 47h2"/></g>` : "";
  return `<svg class="ec-face" viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="47" fill="${BG[k]}"/><g><path d="M12 92c2-22 16-30 36-30s34 8 36 30z" fill="${SHIRT[k]}"/>${back}<ellipse cx="48" cy="48" rx="19" ry="22" fill="${s}"/>${beard}<circle cx="41" cy="47" r="2.4" fill="#24094f"/><circle cx="55" cy="47" r="2.4" fill="#24094f"/>${glasses}<path d="M41 58c4 4 10 4 14 0" fill="none" stroke="#24094f" stroke-width="2.4" stroke-linecap="round"/></g></svg>`;
};

// ---------- briques ----------
const ctl = `<div class="ec-ctl" role="group" aria-label="Commandes de lecture">
  <a class="ec-cb" href="#precedent" role="button" data-ec="prev" aria-label="Épisode précédent ou début">${I.prev}</a>
  <a class="ec-cb ec-cb--t" href="#recul" role="button" data-ec="back" aria-label="Reculer de 15 secondes">−15 s</a>
  <a class="ec-cb ec-cb--big" href="#lecture" role="button" data-ec="toggle" aria-label="Lire">${playIco}</a>
  <a class="ec-cb ec-cb--t" href="#avance" role="button" data-ec="fwd" aria-label="Avancer de 15 secondes">+15 s</a>
  <a class="ec-cb" href="#suivant" role="button" data-ec="next" aria-label="Épisode suivant dans la file">${I.next}</a>
  <a class="ec-cb ec-cb--sp" href="#vitesse" role="button" data-ec="speed" aria-label="Vitesse de lecture : 1 fois. Changer.">1×</a></div>`;
const chapList = (e, kind) => `<ol class="ec-chap ec-chap--${kind}" data-ec="chapters" aria-label="Chapitres">${e.ch.map(([t, s], i) => `<li><a href="#chap-${i + 1}" data-seek="${t}"><i>${dur(t)}</i><span>${esc(s)}</span></a></li>`).join("")}</ol>`;
const player = (e, cls = "") => `<div class="ec-pl ${cls}" role="region" aria-label="Lecteur d'épisodes">
  <div class="ec-pl-top"><span class="ec-pl-num" data-ec="num">Épisode ${e.id}</span><div class="ec-pl-tt"><p class="ec-pl-title" data-ec="title">${esc(e.t)}</p><p class="ec-pl-guest" data-ec="guest">Avec ${esc(e.g)}, ${esc(e.r)}</p></div></div>
  <div class="ec-wave" data-ec="wave">${waveSvg(e.id)}<span class="ec-hov" aria-hidden="true"><i data-ec="hovt">0:00</i></span></div>
  <div class="ec-times"><span data-ec="cur">0:00</span><span class="ec-times-m">Cliquez la forme d'onde pour sauter à un passage</span><span data-ec="dur">${dur(e.d)}</span></div>
  ${ctl}${chapList(e, "chip")}</div>`;
const catalog = `<div class="ec-cat" aria-hidden="true">${EPS.map((e) => `<div data-ep="${e.id}" data-t="${esc(e.t)}" data-g="${esc(e.g)}, ${esc(e.r)}" data-d="${e.d}" data-ch="${e.ch.map(([t, s]) => `${t}|${esc(s)}`).join("~")}" data-tr="${e.tr.map(([t, s]) => `${t}|${esc(s)}`).join("~")}"></div>`).join("")}</div>`;

const header = (c) => sec(`<header class="ec-head pk-bleed">${catalog}<div class="ec-live" role="status" aria-live="polite" aria-atomic="true" data-ec="live"></div>
  <div class="ec-bar"><a class="ec-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span>Allô <b>Bulle</b></span></a>
    <div class="ec-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <div class="ec-mini" role="group" aria-label="Mini-lecteur">
      <a class="ec-mini-play" href="#lecture" role="button" data-ec="toggle" aria-label="Lire">${playIco}</a>
      <a class="ec-mini-info" href="/episode" aria-label="Épisode en cours, ouvrir sa page"><span class="ec-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="ec-mini-t" data-ec="title">${esc(EPS[0].t)}</span><span class="ec-mini-time"><span data-ec="cur">0:00</span> / <span data-ec="dur">${dur(EPS[0].d)}</span></span></a>
      <a class="ec-mini-next" href="#suivant" role="button" data-ec="next" aria-label="Épisode suivant dans la file">${I.next}</a>
      <span class="ec-mini-bar" aria-hidden="true"><i data-ec="fill"></i></span></div>
    <details class="ec-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="ec-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="ec-btn ec-btn--sun" href="/soutenir">Soutenir l'émission</a></div></details></div></header>`);

const footer = (c) => sec(`<footer class="ec-foot pk-bleed"><div class="ec-foot-wave" aria-hidden="true">${waveSvg(4)}</div><div class="ec-wrap ec-foot-grid">
  <div><p class="ec-foot-logo">Allô <b>Bulle</b></p><p class="ec-foot-lead">Le podcast des conversations qui n'étaient pas prévues. Un épisode chaque mardi.</p><a class="ec-btn ec-btn--sun" href="/soutenir">Soutenir l'émission</a></div>
  <div><h2>Écouter</h2>${nav(c.menu.slice(0, 3), "ec-fl")}</div><div><h2>L'émission</h2>${nav(c.menu.slice(3, 6), "ec-fl")}</div>
  <div><h2>Nous écrire</h2><a class="ec-fl" href="/contact">Formulaire de contact</a><a class="ec-fl" href="/recherche">Rechercher</a><a class="ec-fl" href="/actualites">La lettre du jeudi</a></div></div>
  <p class="ec-legal">© Allô Bulle — site de démonstration. Émission, invités, épisodes et chiffres fictifs ; la lecture est simulée.</p></footer>`);

const pagehead = (kicker, title, sub) => sec(`<section class="ec-ph ec-b-sun pk-bleed"><span class="ec-dots" aria-hidden="true"></span><div class="ec-wrap"><p class="ec-kicker" data-reveal>${esc(kicker)}</p><div class="ec-h1 ec-h1--s" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="ec-lead" data-reveal>${esc(sub)}</p>` : ""}</div><div class="ec-deco ec-deco--ph" aria-hidden="true"><span class="ec-bub ec-bub--w">Allô ?</span></div></section>`);

const epRow = (e) => `<li class="ec-ep" data-ep-row="${e.id}" data-cats="${e.cat}"><span class="ec-ep-n" aria-hidden="true">${two(e.id)}</span>
  <div class="ec-ep-b"><p class="ec-ep-meta"><span class="ec-pill">${e.cat === "special" ? "Spécial" : e.cat === "enquete" ? "Enquête" : "Conversation"}</span><time>${e.date}</time><span>${mins(e.d)}</span></p>
    <h3 class="ec-ep-t"><a href="/episode#ep-${e.id}">${esc(e.t)}</a></h3><p class="ec-ep-g">Avec ${esc(e.g)}, ${esc(e.r)}</p><p class="ec-ep-s">${esc(e.sum)}</p></div>
  <div class="ec-ep-a"><a class="ec-btn ec-btn--sm" href="#lire-${e.id}" role="button" data-ec-play="${e.id}" aria-label="Lire : ${esc(e.t)}">${I.play}Lire</a><a class="ec-btn ec-btn--ghost ec-btn--sm" href="#file-${e.id}" role="button" data-ec-add="${e.id}" aria-label="Ajouter à la file : ${esc(e.t)}">+ File</a></div></li>`;

const GUESTS = EPS.slice(0, 5).map((e) => ({ ...e, q: ["« Je parlais dans le vide, et le vide a fini par répondre. »", "« On crie parce qu'on a peur de ne pas être entendu. »", "« Le sel, c'est une promesse qu'on ne retire pas. »", "« Chaque bruit est un souvenir qui n'a pas encore de nom. »", "« Le silence ne dure jamais : il se remplit de vous. »"][e.id - 1] }));
const guestCard = (g) => `<article class="ec-guest" data-reveal>${face(g.face)}<div class="ec-guest-b"><h3>${esc(g.g)}</h3><p class="ec-guest-r">${esc(g.r)} · épisode ${g.id}</p><p class="ec-bub ec-guest-q">${esc(g.q)}</p><a class="ec-more" href="/episode#ep-${g.id}">Écouter l'épisode ${I.arrow}</a></div></article>`;

const NEWS = [["Jeu. 30 oct.", "La lettre du jeudi n° 41", "Trois sons du mois, une recette de pluie en riz et la réponse à la question d'une auditrice."], ["Jeu. 23 oct.", "Pourquoi les épisodes durent trente minutes", "Un format pensé pour un trajet, une vaisselle ou une promenade du chien."], ["Jeu. 16 oct.", "Visite du studio, version dessinée", "Un plan commenté de la petite pièce où tout se passe, du pot de fleurs au tapis anti-écho."], ["Jeu. 9 oct.", "Saison 4 : ce qui change", "Des chapitres plus nombreux, des transcriptions complètes et un jeu des voix à chaque spécial."], ["Jeu. 2 oct.", "Remerciements pour le micro ouvert", "Plus de deux cents questions reçues ; voici comment nous les avons triées."]];

// ---------- pages ----------
const home = (c) => [
  header(c),
  sec(`<section class="ec-hero ec-b-sun pk-bleed"><span class="ec-dots" aria-hidden="true"></span>
    <div class="ec-wrap ec-hero-in"><div class="ec-hero-copy"><p class="ec-kicker" data-reveal>Le podcast des conversations pas prévues</p>
      <div class="ec-h1" role="heading" aria-level="1" data-reveal>Allô <span class="ec-hl">Bulle</span>, on vous écoute&nbsp;!</div>
      <p class="ec-lead" data-reveal>Chaque mardi, Maëlle et Théo invitent quelqu'un qui a une histoire de voix, de bruit ou de silence. Appuyez sur lecture et glissez dans la forme d'onde : tout se joue ici.</p>
      <div class="ec-actions" data-reveal><a class="ec-btn ec-btn--lg" href="#lire-1" role="button" data-ec-play="1">${I.play}Écouter le dernier épisode</a><a class="ec-btn ec-btn--ghost ec-btn--lg" href="/episodes">Tous les épisodes</a></div></div>
      <div class="ec-hero-art" aria-hidden="true">${micArt}<span class="ec-bub ec-bub--w ec-deco ec-b1">Allô ?</span><span class="ec-bub ec-bub--v ec-deco ec-b2">On enregistre !</span><span class="ec-bub ec-bub--w ec-deco ec-b3">Chut…</span></div></div>
    <div class="ec-wrap ec-hero-pl">${player(EPS[0], "ec-pl--hero")}</div></section>`),
  bridge("sun", "w"),
  sec(`<section class="ec-stats pk-bleed"><ul class="ec-wrap ec-stats-in"><li data-reveal><b data-count="86">86</b><span>épisodes en ligne</span></li><li data-reveal><b data-count="4">4</b><span>saisons</span></li><li data-reveal><b data-count="212" data-suffix=" k">212 k</b><span>écoutes (chiffre fictif)</span></li><li data-reveal><b data-count="31" data-suffix=" min">31 min</b><span>durée moyenne</span></li></ul></section>`),
  sec(`<section class="ec-last pk-bleed"><div class="ec-wrap"><div class="ec-sechead"><div><p class="ec-kicker" data-reveal>Dernières sorties</p><h2 class="ec-h2" data-reveal>À écouter maintenant</h2></div><a class="ec-more" href="/episodes">Voir les 86 épisodes ${I.arrow}</a></div>
    <ol class="ec-eplist">${EPS.slice(0, 4).map(epRow).join("")}</ol></div></section>`),
  bridge("w", "v"),
  sec(`<section class="ec-follow ec-b-v pk-bleed"><div class="ec-wrap"><div class="ec-sechead ec-sechead--l"><div><p class="ec-kicker ec-kicker--s" data-reveal>Suivre le fil</p><h2 class="ec-h2" data-reveal>Chapitres, transcription et file d'attente</h2></div></div>
    <div class="ec-follow-grid"><section class="ec-card ec-card--chap" aria-label="Chapitres"><h3 class="ec-card-h">Chapitres</h3>${chapList(EPS[0], "list").replace('aria-label="Chapitres"', 'aria-label="Chapitres de l\'épisode en cours"')}</section>
      <section class="ec-card ec-card--tr"><h3 class="ec-card-h">Transcription synchronisée</h3><div class="ec-tr" data-ec="tr">${EPS[0].tr.map(([t, s]) => `<p><a href="#ligne" data-seek="${t}"><i>${dur(t)}</i> ${esc(s)}</a></p>`).join("")}</div></section>
      <section class="ec-card ec-card--q"><h3 class="ec-card-h">File d'attente</h3><ol class="ec-queue" data-ec="queue" aria-label="File d'attente">${[2, 3].map((i) => `<li class="ec-q"><span class="ec-q-t"><b>${esc(EPS[i - 1].t)}</b><small>${esc(EPS[i - 1].g)} · ${dur(EPS[i - 1].d)}</small></span></li>`).join("")}</ol><p class="ec-card-tip">Ajoutez des épisodes avec « + File » dans la liste.</p></section></div></div></section>`),
  bridge("v", "w"),
  sec(`<section class="ec-guests pk-bleed"><div class="ec-wrap"><div class="ec-sechead"><div><p class="ec-kicker" data-reveal>Ils ont pris le micro</p><h2 class="ec-h2" data-reveal>Des voix à découvrir</h2></div><a class="ec-more" href="/invites">Tous les invités ${I.arrow}</a></div></div>
    <div class="ec-rail" aria-label="Invités récents">${GUESTS.map(guestCard).join("")}</div></section>`),
  bridge("w", "sun", true),
  sec(`<section class="ec-cta ec-b-sun pk-bleed"><span class="ec-dots" aria-hidden="true"></span><div class="ec-wrap ec-cta-in"><div><h2 class="ec-h2 ec-h2--l" data-reveal>Une idée d'épisode ? Une question farfelue ?</h2><p class="ec-lead" data-reveal>Le micro est toujours ouvert. Écrivez-nous, ou lisez comment soutenir l'émission.</p></div><div class="ec-actions" data-reveal><a class="ec-btn ec-btn--lg" href="/contact">Écrire à l'équipe</a><a class="ec-btn ec-btn--ghost ec-btn--lg" href="/soutenir">Soutenir</a></div></div></section>`),
  footer(c),
];

const episodes = (c) => [header(c), pagehead("86 épisodes · saisons 1 à 4", "Tous les<br>épisodes", "Lisez en un clic, ajoutez à la file ou ouvrez la page d'un épisode pour ses chapitres et ses notes."),
  sec(`<section class="ec-list pk-bleed"><div class="ec-wrap"><div class="ec-sechead"><h2 class="ec-h2">Les derniers épisodes</h2><div class="ec-tabs" role="group" aria-label="Filtrer par format"><a href="#tous" class="is-on" data-ec-filter="all" role="button">Tous</a><a href="#conversation" data-ec-filter="conversation" role="button">Conversations</a><a href="#enquete" data-ec-filter="enquete" role="button">Enquêtes</a><a href="#special" data-ec-filter="special" role="button">Spéciaux</a></div></div>
    <ol class="ec-eplist" data-ec="eplist">${EPS.map(epRow).join("")}</ol><p class="ec-note">Épisodes et durées fictifs. La lecture est simulée dans le navigateur : aucun son n'est diffusé.</p></div></section>`),
  footer(c)];

const episodePage = (c) => [header(c), pagehead("Page d'épisode", "Chapitres<br>&amp; notes", "Choisissez un épisode : le lecteur, les chapitres, la transcription et les notes suivent."),
  sec(`<section class="ec-detail pk-bleed"><div class="ec-wrap"><div class="ec-tabs ec-tabs--ep" role="group" aria-label="Choisir l'épisode">${EPS.map((e) => `<a href="#ep-${e.id}" data-ec-ptab="${e.id}" role="button"${e.id === 1 ? ' class="is-on"' : ""}>Ép. ${e.id}</a>`).join("")}</div>${player(EPS[0], "ec-pl--page")}
    <div class="ec-detail-grid"><div class="ec-detail-main"><section class="ec-card"><h2 class="ec-card-h">Chapitres</h2>${chapList(EPS[0], "list").replace('aria-label="Chapitres"', 'aria-label="Chapitres de l\'épisode en cours"')}</section>
      <section class="ec-card"><h2 class="ec-card-h">Transcription</h2><div class="ec-tr" data-ec="tr">${EPS[0].tr.map(([t, s]) => `<p><a href="#ligne" data-seek="${t}"><i>${dur(t)}</i> ${esc(s)}</a></p>`).join("")}</div></section></div>
      <aside class="ec-detail-side" aria-label="Notes de l'épisode">${EPS.map((e) => `<article class="ec-notes" data-ec-panel="${e.id}"><p class="ec-pill">${e.cat === "special" ? "Spécial" : e.cat === "enquete" ? "Enquête" : "Conversation"} · ${e.date}</p><h2 class="ec-notes-t">${esc(e.t)}</h2><p>${esc(e.sum)}</p>
        <h3>Dans l'épisode</h3><ul>${e.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul><h3>Cités dans l'épisode</h3><ul class="ec-tags">${e.men.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <p class="ec-bub ec-notes-g">Invité·e : <strong>${esc(e.g)}</strong>, ${esc(e.r)}</p></article>`).join("")}
      <section class="ec-card ec-card--q"><h2 class="ec-card-h">File d'attente</h2><ol class="ec-queue" data-ec="queue" aria-label="File d'attente"></ol></section></aside></div></div></section>`),
  footer(c)];

const invites = (c) => [header(c), pagehead("Les voix de l'émission", "Nos<br>invités", "Des gens qui font, réparent, écoutent ou cuisinent. Les citations viennent des épisodes fictifs de cette démonstration."),
  sec(`<section class="ec-gg pk-bleed"><div class="ec-wrap ec-gg-in">${GUESTS.map(guestCard).join("")}<article class="ec-guest ec-guest--open" data-reveal><div class="ec-guest-b"><h3>Et vous ?</h3><p>Une histoire de voix, de bruit ou de silence ? Racontez-la-nous en trois lignes.</p><a class="ec-btn" href="/contact">Proposer un invité</a></div></article></div></section>`),
  footer(c)];

const apropos = (c) => [header(c), pagehead("Qui fait quoi", "À propos<br>de l'émission", "Une petite équipe, un studio de neuf mètres carrés et beaucoup de tapis anti-écho."),
  sec(`<section class="ec-about pk-bleed"><div class="ec-wrap ec-about-in"><div class="ec-about-art" aria-hidden="true">${micArt}</div><div><p class="ec-kicker" data-reveal>Pourquoi Allô Bulle</p><h2 class="ec-h2" data-reveal>Parce qu'une bonne conversation ne se planifie pas</h2>
    <p data-reveal>Allô Bulle est né d'une panne de micro et d'un fou rire. Depuis, chaque épisode part d'une question simple et se laisse dériver, comme une bulle de savon vers la fenêtre.</p><p data-reveal>Nous enregistrons en une prise, sans script, avec un chronomètre et une théière. Le montage ne retire que les toux et les silences gênants.</p></div></div></section>`),
  sec(`<section class="ec-team ec-b-v pk-bleed"><div class="ec-wrap"><h2 class="ec-h2 ec-h2--l" data-reveal>L'équipe</h2><div class="ec-team-in">
    <article class="ec-person" data-reveal>${face(0)}<h3>Maëlle Okafor</h3><p class="ec-person-r">Animation et questions</p><p>Pose la question que personne n'osait. Rit toujours en premier.</p></article>
    <article class="ec-person" data-reveal>${face(3)}<h3>Théo Brandt</h3><p class="ec-person-r">Animation et cuisine</p><p>Cuisine, goûte, se trompe de sel. Tient le chronomètre.</p></article>
    <article class="ec-person" data-reveal>${face(2)}<h3>Inès Dallaire</h3><p class="ec-person-r">Son et montage</p><p>Garde l'oreille sur la prise et un seau au cas où.</p></article></div></div></section>`),
  sec(`<section class="ec-steps pk-bleed"><div class="ec-wrap"><p class="ec-kicker" data-reveal>Dans les coulisses</p><h2 class="ec-h2" data-reveal>Comment naît un épisode</h2>
    <ol class="ec-steps-in">${[["Une question", "Elle arrive par le courrier, la rue ou la cuisine."], ["L'invité·e", "On l'appelle, on lui fait boire du thé, on ne lui dit rien."], ["La prise", "Une seule, avec le chronomètre sur la table."], ["Le montage", "Chapitres, transcription, un peu de musique."], ["La sortie", "Chaque mardi, avec la lettre du jeudi derrière."]].map(([t, s], i) => `<li data-reveal><span class="ec-step-n">${i + 1}</span><h3>${t}</h3><p>${s}</p></li>`).join("")}</ol></div></section>`),
  footer(c)];

const soutenir = (c) => [header(c), pagehead("Faire vivre l'émission", "Soutenir<br>Allô Bulle", "Trois façons d'aider, de la plus simple à la plus engagée. Ici, rien ne se paie : on en parle d'abord par le formulaire."),
  sec(`<section class="ec-help pk-bleed"><div class="ec-wrap ec-help-in">
    <article class="ec-way" data-reveal><span class="ec-way-n">1</span><h2>Écouter et partager</h2><p>Parlez d'un épisode à quelqu'un qui en a besoin. C'est gratuit et c'est ce qui compte le plus.</p></article>
    <article class="ec-way ec-way--hot" data-reveal><span class="ec-way-n">2</span><h2>Nous donner une histoire</h2><p>Envoyez une question, un son d'enfance, un invité idéal. Une partie de l'émission est faite avec vous.</p><a class="ec-btn" href="/contact">Écrire à l'équipe</a></article>
    <article class="ec-way" data-reveal><span class="ec-way-n">3</span><h2>Soutenir le studio</h2><p>Un soutien régulier couvrirait le matériel et l'hébergement. Les modalités sont à définir : écrivez-nous pour en discuter.</p><a class="ec-btn ec-btn--ghost" href="/contact">En discuter</a></article></div></section>`),
  sec(`<section class="ec-split ec-b-v pk-bleed"><div class="ec-wrap ec-split-in"><div><p class="ec-kicker ec-kicker--s" data-reveal>Transparence</p><h2 class="ec-h2" data-reveal>Où irait un soutien</h2><p data-reveal>Répartition indicative d'un budget fictif, pour montrer à quoi servirait l'aide.</p></div>
    <div data-reveal><svg class="ec-bar-chart" viewBox="0 0 400 60" role="img" aria-label="Répartition : 40 % matériel, 30 % montage, 20 % hébergement, 10 % imprévus"><title>Répartition indicative</title><rect x="0" y="6" width="160" height="48" fill="#ffc72c"/><rect x="160" y="6" width="120" height="48" fill="#ffffff"/><rect x="280" y="6" width="80" height="48" fill="#c9b6f5"/><rect x="360" y="6" width="40" height="48" fill="#ff9bb0"/></svg>
    <ul class="ec-legend"><li><i class="l1"></i>Matériel de studio · 40 %</li><li><i class="l2"></i>Montage et sous-titres · 30 %</li><li><i class="l3"></i>Hébergement des fichiers · 20 %</li><li><i class="l4"></i>Imprévus (les pannes) · 10 %</li></ul></div></div></section>`),
  sec(`<section class="ec-faq pk-bleed"><div class="ec-wrap ec-faq-in"><h2 class="ec-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Puis-je payer ici ?</summary><p>Non. Cette page est une démonstration : aucun paiement, don ou abonnement n'est pris. Le formulaire de contact sert à engager la discussion.</p></details>
    <details data-reveal><summary>Que reçoivent les soutiens ?</summary><p>À définir avec l'équipe : accès anticipé, épisodes bonus ou simple remerciement dans la lettre du jeudi.</p></details>
    <details data-reveal><summary>Puis-je aider sans argent ?</summary><p>Oui : partagez, commentez, envoyez une question ou proposez un invité depuis le formulaire.</p></details></div></div></section>`),
  footer(c)];

const actualites = (c) => [header(c), pagehead("La lettre du jeudi", "Actualités<br>&amp; lettre", "Les coulisses, les sons du mois et les annonces de l'émission."),
  sec(`<section class="ec-newsl pk-bleed"><div class="ec-wrap"><ol class="ec-newslist">${NEWS.map(([d, t, s], i) => `<li class="ec-newsit" data-reveal><time class="ec-bub ec-newsd">${d}</time><div><h2 class="ec-newst">${esc(t)}</h2><p>${esc(s)}</p>${i === 0 ? '<a class="ec-more" href="#lettre">Recevoir la lettre ' + I.arrow + "</a>" : ""}</div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="ec-lettre ec-b-sun pk-bleed"><span class="ec-dots" aria-hidden="true"></span><div class="ec-wrap"><p class="ec-kicker">La lettre du jeudi</p><h2 class="ec-h2 ec-h2--l">Recevoir la lettre</h2><p class="ec-lead">Indiquez votre adresse et le mot « lettre » dans le formulaire ci-dessous : l'équipe vous répondra. Démonstration, aucune inscription automatique.</p></div></section>`),
  { type: "form", heading: "Recevoir la lettre", intro: "Votre adresse et un mot : l'équipe vous répond sous quelques jours." },
  footer(c)];

const contact = (c) => [header(c), pagehead("Le micro est ouvert", "Contact", "Une question, un invité idéal, un son à nous faire entendre ? Écrivez-nous."),
  { type: "form", heading: "Écrire à l'équipe", intro: "Dites-nous tout : nous lisons chaque message avant l'enregistrement du mardi." }, footer(c)];
const recherche = (c) => [header(c), pagehead("Rechercher", "Un son ?<br>Un mot ?", "Un épisode, un invité, une phrase de la transcription."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un épisode ou un invité…" } }] }, footer(c)];
const introuvable = (c) => [header(c), sec(`<section class="ec-404 ec-b-sun pk-bleed"><span class="ec-dots" aria-hidden="true"></span><div class="ec-wrap"><p class="ec-kicker">Micro coupé</p><div class="ec-h1" role="heading" aria-level="1">404</div><p class="ec-lead">Cette page n'existe pas, ou elle a changé d'adresse. Retournez à l'antenne.</p><a class="ec-btn ec-btn--lg" href="/">Retour à l'accueil</a></div></section>`), footer(c)];

module.exports = {
  key: "echo", name: "Écho", version: "2.0.0", category: "divertissement", tags: ["ludique", "chaleureux", "audacieux"], siteType: "Podcast et émission audio", featured: true,
  concept: "Une émission de radio dessinée en bulles : forme d'onde géante cliquable, lecteur simulé avec chapitres et transcription, et mini-lecteur qui reste dans la barre de navigation.",
  description: "Podcast fictif en jaune soleil, violet profond et blanc : hero à forme d'onde interactive, mini-lecteur persistant, liste d'épisodes filtrable, chapitres, transcription synchronisée, file d'attente, invités et lettre.",
  brand: "Allô Bulle", modules: ["formulaires", "recherche"],
  dna: { header: "barre-bulle-avec-mini-lecteur-persistant", hero: "forme-d-onde-geante-interactive-et-lecteur", grid: "liste-d-episodes-numerotee-et-rail-d-invites", motion: "barres-d-onde-qui-dansent-et-anneaux-sonores", shapes: "bulles-de-bd-micros-dessines-et-ondes", rhythm: "alterne-jaune-violet-conversationnel", signature: "lecteur-d-episodes-a-chapitres-et-transcription-synchronisee" },
  tokens: {
    colors: { primary: "#4b1fb5", secondary: "#24094f", accent: "#ffc72c", background: "#fffdf6", surface: "#ffffff", text: "#24094f", muted: "#5a4a86", success: "#1e7e34", warning: "#8a5a00", error: "#c62828" },
    fonts: { heading: "font.lilita-one", body: "font.nunito-sans", button: "font.lilita-one", link: "font.nunito-sans" },
    radius: { sm: 10, md: 18, lg: 28, button: 999, field: 16, card: 28 }, shadow: { card: "5px 5px 0 #24094f", button: "4px 4px 0 #24094f" }, border: { width: 3, color: "#24094f" },
    type: { h1: { size: 88, weight: 400, lineHeight: 1, transform: "none" }, h2: { size: 48, weight: 400, lineHeight: 1.05, transform: "none" } },
  },
  options: [
    { key: "sun", label: "Jaune soleil", type: "color", default: "#ffc72c" },
    { key: "violet", label: "Violet des boutons", type: "color", default: "#4b1fb5" },
    { key: "bubbles", label: "Bulles décoratives", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "wave", label: "Forme d'onde", type: "choice", default: "live", choices: [["live", "Elle danse"], ["calm", "Elle reste calme"]] },
    { key: "shadow", label: "Ombres", type: "choice", default: "hard", choices: [["hard", "Dures (BD)"], ["soft", "Douces"]] },
  ],
  menu: [["Accueil", "/"], ["Épisodes", "/episodes"], ["Invités", "/invites"], ["À propos", "/apropos"], ["Soutenir", "/soutenir"], ["Actualités", "/actualites"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "episodes", name: "Épisodes", render: episodes }, { key: "episode", name: "Épisode", render: episodePage },
    { key: "invites", name: "Invités", render: invites }, { key: "apropos", name: "À propos", render: apropos }, { key: "soutenir", name: "Soutenir", render: soutenir },
    { key: "actualites", name: "Actualités et lettre", render: actualites }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
