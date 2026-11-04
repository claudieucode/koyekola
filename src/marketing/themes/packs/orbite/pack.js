// Orbite — plateforme SaaS fictive de pilotage de projets. Direction artistique : produit lumineux en mode sombre (bleu nuit, dégradé violet → cyan, halos flous, verre 1 px),
// en-tête en pilule flottante, grande maquette d'application en perspective, bento de fonctionnalités avec spotlight au curseur, bascule mensuel/annuel réelle.
const { sec, esc, nav } = require("../kit");

// ---------- petits éléments dessinés ----------
const P = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.8-6 6.5-6s6.5 2.4 6.5 6M17 5a3.5 3.5 0 0 1 0 7M18.5 14.4c2 .7 3.5 2.6 3.5 5.6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  doc: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.3 7.8 8 9 4.7-1.2 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  cloud: '<path d="M7 18a5 5 0 1 1 1.2-9.8A6 6 0 0 1 19 11a3.5 3.5 0 0 1-.5 7z"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  heart: '<path d="M12 20s-8-4.7-8-10.5A4.500 4.500 0 0 1 12 7a4.500 4.500 0 0 1 8 2.500C20 15.300 12 20 12 20z"/>',
};
const ico = (n, cls = "or-i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;
const mark = `<svg class="or-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="6.5" class="or-m1"/><ellipse cx="16" cy="16" rx="14" ry="5.5" transform="rotate(-28 16 16)" fill="none" class="or-m2" stroke-width="2.4"/><circle cx="26.200" cy="9.500" r="2.300" class="or-m3"/></svg>`;
const av = (t, n = 1) => `<span class="or-av or-av${n}">${t}</span>`;
const avs = (list) => `<span class="or-avs">${list.map(([t, n]) => av(t, n)).join("")}</span>`;
const badge = (t, k = "a") => `<span class="or-badge or-badge--${k}">${esc(t)}</span>`;
const bar = (p, k = "a") => `<svg class="or-pbar or-pbar--${k}" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="6" rx="3" class="or-pt"/><rect width="${p}" height="6" rx="3" class="or-pf"/></svg>`;
const btn = (label, href, k = "p", extra = "") => `<a class="or-btn or-btn--${k}${extra ? " " + extra : ""}" href="${href}">${label}</a>`;
const sparks = (pts, cls = "or-sp") => `<svg class="${cls}" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

// Courbe avec aire en fondu (le dégradé vient du CSS : masque sur le SVG, pas de dégradé SVG car les id sont retirés)
const chart = (line, area, line2) => `<div class="or-chart"><svg class="or-ca" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path d="${area}"/></svg><svg class="or-cl" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">${[40, 20, 60].map((y) => `<line x1="0" y1="${y}" x2="200" y2="${y}" class="or-cg"/>`).join("")}${line2 ? `<polyline points="${line2}" class="or-l2"/>` : ""}<polyline points="${line}" class="or-l1"/></svg><span class="or-scan" aria-hidden="true"></span></div>`;
const L1 = "0,60 20,54 40,58 60,42 80,46 100,30 120,34 140,20 160,24 180,10 200,14";
const A1 = "M0 60 20 54 40 58 60 42 80 46 100 30 120 34 140 20 160 24 180 10 200 14V80H0z";
const L2 = "0,66 30,62 60,64 90,52 120,54 150,42 180,38 200,32";

const task = (t, tag, k, p, who) => `<div class="or-task"><div class="or-task-t">${esc(t)}</div><div class="or-task-m">${badge(tag, k)}${avs(who)}</div>${p != null ? bar(p, k) : ""}</div>`;
const kanban = (compact) => `<div class="or-kan">
  <div class="or-col"><div class="or-col-h"><span>À faire</span><b>4</b></div>${task("Maquettes de l'onboarding", "Design", "a", 20, [["LM", 1]])}${compact ? "" : task("Brief partenaires", "Produit", "b", null, [["SB", 3]])}</div>
  <div class="or-col"><div class="or-col-h"><span>En cours</span><b>3</b></div>${task("API de notifications", "Dev", "c", 64, [["YD", 2], ["AK", 4]])}${compact ? "" : task("Tests de charge", "Qualité", "a", 38, [["NR", 5]])}</div>
  <div class="or-col"><div class="or-col-h"><span>Terminé</span><b>9</b></div>${task("Migration des données", "Dev", "c", 100, [["JT", 6]])}${compact ? "" : task("Charte graphique v2", "Design", "b", 100, [["LM", 1], ["SB", 3]])}</div></div>`;

const win = (url, inner, cls = "") => `<div class="or-win ${cls}"><div class="or-win-bar"><i></i><i></i><i></i><span class="or-url">${esc(url)}</span></div>${inner}</div>`;

const side = `<div class="or-side"><div class="or-side-logo">${mark}<b>Orbite</b></div>
  <div class="or-side-i is-on">${ico("grid")}<span>Vue d'ensemble</span></div><div class="or-side-i">${ico("list")}<span>Tâches</span></div><div class="or-side-i">${ico("cal")}<span>Chronologie</span></div><div class="or-side-i">${ico("chart")}<span>Analyses</span></div><div class="or-side-i">${ico("bolt")}<span>Automatisations</span></div>
  <div class="or-side-h">Projets</div><div class="or-side-p"><i class="or-d1"></i>Lancement v3</div><div class="or-side-p"><i class="or-d2"></i>Refonte mobile</div><div class="or-side-p"><i class="or-d3"></i>Programme pilote</div></div>`;

const dashWin = () => win("app.orbite.demo/projets/lancement-v3", `<div class="or-win-body">${side}<div class="or-main">
  <div class="or-main-h"><div><div class="or-main-t">Lancement produit v3</div><div class="or-main-s">Mis à jour il y a 2 minutes</div></div><div class="or-main-r">${badge("En bonne voie", "c")}${avs([["LM", 1], ["YD", 2], ["SB", 3], ["+4", 7]])}<span class="or-fakebtn">Partager</span></div></div>
  <div class="or-kpis"><div class="or-kpi"><span>Avancement</span><b>72 %</b>${sparks("0,26 15,22 30,24 45,16 60,18 75,9 100,4")}</div><div class="or-kpi"><span>Tâches ouvertes</span><b>148</b>${sparks("0,6 20,10 40,8 60,16 80,14 100,24")}</div><div class="or-kpi"><span>Risque de retard</span><b>−12 %</b>${sparks("0,20 20,16 40,22 60,12 80,10 100,6")}</div></div>
  <div class="or-main-g"><div class="or-panel"><div class="or-panel-h">Vélocité de l'équipe</div>${chart(L1, A1, L2)}</div><div class="or-panel or-panel--k">${kanban(true)}</div></div></div></div>`, "or-win--hero");

const ganttRows = [["Recherche", 0, 34, "a"], ["Conception", 22, 40, "b"], ["Développement", 40, 52, "a"], ["Recette", 78, 30, "b"], ["Lancement", 92, 14, "a"]];
const ganttWin = () => win("app.orbite.demo/chronologie", `<div class="or-win-body or-win-body--s"><div class="or-main"><div class="or-main-h"><div><div class="or-main-t">Chronologie du trimestre</div><div class="or-main-s">5 jalons · 3 équipes</div></div>${badge("Sur le plan", "c")}</div>
  <div class="or-gantt"><div class="or-gantt-w"><span>Oct.</span><span>Nov.</span><span>Déc.</span><span>Janv.</span></div>${ganttRows.map(([l, x, w, k]) => `<div class="or-gr"><span>${l}</span><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="3" width="100" height="4" rx="2" class="or-pt"/><rect x="${x * 0.9}" y="1" width="${Math.min(w, 100 - x * 0.9)}" height="8" rx="4" class="or-gb or-gb--${k}"/></svg></div>`).join("")}<span class="or-today" aria-hidden="true"></span></div></div></div>`);

const statsWin = () => win("app.orbite.demo/analyses", `<div class="or-win-body or-win-body--s"><div class="or-main"><div class="or-main-h"><div><div class="or-main-t">Analyses de la semaine</div><div class="or-main-s">Comparé à la semaine précédente</div></div>${badge("+18 %", "c")}</div>
  <div class="or-stats"><div class="or-panel"><div class="or-panel-h">Tâches terminées par jour</div><svg class="or-bars" viewBox="0 0 140 70" preserveAspectRatio="none" aria-hidden="true">${[28, 40, 34, 52, 46, 64, 58].map((h, i) => `<rect x="${i * 20 + 4}" y="${70 - h}" width="12" height="${h}" rx="4" class="or-bar${i % 2 ? " or-bar--b" : ""}"/>`).join("")}</svg></div>
  <div class="or-panel or-panel--d"><div class="or-panel-h">Répartition</div><svg class="or-donut" viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="15.915" class="or-dt"/><circle cx="21" cy="21" r="15.915" class="or-d-a"/><circle cx="21" cy="21" r="15.915" class="or-d-b"/><circle cx="21" cy="21" r="15.915" class="or-d-c"/></svg><ul class="or-leg"><li><i class="or-d1"></i>Produit 52 %</li><li><i class="or-d2"></i>Dev 28 %</li><li><i class="or-d3"></i>Design 12 %</li></ul></div></div></div></div>`);

const autoWin = () => win("app.orbite.demo/automatisations", `<div class="or-win-body or-win-body--s"><div class="or-main"><div class="or-main-h"><div><div class="or-main-t">Règle : revue terminée</div><div class="or-main-s">Active · exécutée 214 fois</div></div><span class="or-sw is-on" aria-hidden="true"><i></i></span></div>
  <div class="or-flow"><div class="or-node">${ico("check")}<b>Quand</b><span>une revue est validée</span></div><span class="or-link" aria-hidden="true"></span><div class="or-node">${ico("layers")}<b>Si</b><span>le projet est « Lancement v3 »</span></div><span class="or-link" aria-hidden="true"></span><div class="or-node or-node--hot">${ico("bolt")}<b>Alors</b><span>passer la tâche à « Terminé » et prévenir l'équipe</span></div></div></div></div>`);

// ---------- structure commune ----------
const header = (c) => `<header class="or-head pk-bleed"><div class="or-pill">
  <a class="or-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span>Orbite</span></a>
  <div class="or-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  ${btn("Demander une démo", "/contact", "p", "or-btn--sm or-head-cta")}
  <details class="or-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="or-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}${btn("Demander une démo", "/contact", "p")}</div></details>
</div></header>`;

const footer = (c) => `<footer class="or-foot pk-bleed"><div class="or-wrap"><div class="or-foot-top"><div class="or-foot-brand"><a class="or-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span>Orbite</span></a><p>Piloter ses projets avec calme et précision. Un produit imaginaire pour illustrer un site de logiciel.</p></div>
  <div><h2 class="or-fh">Produit</h2><a class="or-fl" href="/produit">Fonctionnalités</a><a class="or-fl" href="/tarifs">Tarifs</a><a class="or-fl" href="/ressources">Ressources</a></div>
  <div><h2 class="or-fh">Société</h2><a class="or-fl" href="/apropos">À propos</a><a class="or-fl" href="/contact">Contact</a><a class="or-fl" href="/recherche">Recherche</a></div>
  <div><h2 class="or-fh">Parlons-en</h2><a class="or-fl" href="/contact">Demander une démo</a><a class="or-fl" href="mailto:bonjour@orbite.example">bonjour@orbite.example</a></div></div>
  <p class="or-legal">© Orbite — site de démonstration. Produit, entreprises, chiffres, tarifs et personnes sont fictifs ; aucune inscription ni aucun paiement n'est possible ici.</p></div></footer>`;

const pagehead = (kicker, title, sub, extra = "") => sec(`<section class="or-ph pk-bleed"><span class="or-halo or-halo--a" aria-hidden="true"></span><span class="or-halo or-halo--b" aria-hidden="true"></span><div class="or-wrap or-ph-in"><p class="or-eyebrow" data-reveal>${esc(kicker)}</p><div class="or-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="or-sub" data-reveal>${esc(sub)}</p>` : ""}${extra}</div></section>`);
const g = (t) => `<span class="or-grad">${t}</span>`;
const sechead = (kicker, title, sub = "") => `<div class="or-sh"><p class="or-eyebrow" data-reveal>${esc(kicker)}</p><h2 class="or-h2" data-reveal>${title}</h2>${sub ? `<p class="or-sub" data-reveal>${esc(sub)}</p>` : ""}</div>`;

// ---------- sections réutilisables ----------
const brands = [["Axiome", '<circle cx="12" cy="12" r="8"/>'], ["Nimbus", '<path d="M4 16a4 4 0 0 1 2-7 6 6 0 0 1 11 1 3.500 3.500 0 0 1 3 6z"/>'], ["Quartz", '<path d="m12 3 8 6-3 11H7L4 9z"/>'], ["Helion", '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'], ["Kairos", '<path d="M5 5h14L5 19h14"/>'], ["Lumina", '<path d="M12 3c4 4 6 6 6 9a6 6 0 0 1-12 0c0-3 2-5 6-9z"/>'], ["Tessera", '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>'], ["Nordal", '<path d="M12 3 4 20h16z"/>']];
const logoItem = ([n, p]) => `<span class="or-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">${p}</svg>${n}</span>`;
const marquee = () => `<section class="or-logos pk-bleed" aria-label="Entreprises fictives utilisant Orbite"><p class="or-logos-t">Adopté par des équipes (fictives) de toutes tailles</p><div class="or-mq"><div class="or-mq-track">${brands.map(logoItem).join("")}<span class="or-mq-copy" aria-hidden="true">${brands.map(logoItem).join("")}</span></div></div></section>`;

const metrics = () => `<section class="or-metrics pk-bleed"><div class="or-wrap"><ul class="or-mets"><li data-reveal><b data-count="3200" data-suffix="+">3 200+</b><span>équipes sur la plateforme</span></li><li data-reveal><b data-count="98" data-suffix=" %">98 %</b><span>de satisfaction (exemple)</span></li><li data-reveal><b data-count="40" data-suffix="+">40+</b><span>intégrations disponibles</span></li><li data-reveal><b data-count="99.9" data-dec="1" data-suffix=" %">99,9 %</b><span>de disponibilité visée</span></li></ul><p class="or-note">Chiffres de démonstration, non contractuels.</p></div></section>`;

const bento = () => `<section class="or-bento-s or-sec pk-bleed"><div class="or-wrap">${sechead("Fonctionnalités", `Tout ce qu'il faut pour ${g("garder le cap")}.`, "Des modules qui s'emboîtent : activez ce dont vous avez besoin, ignorez le reste.")}
  <div class="or-bento">
   <article class="or-card or-b-a" data-spot data-reveal><div class="or-b-copy"><span class="or-ic">${ico("chart")}</span><h3>Une vue d'ensemble en direct</h3><p>Avancement, charge et risques se mettent à jour à chaque modification, sans export ni tableur.</p></div>
     <div class="or-b-demo"><div class="or-live"><i></i>En direct</div><svg class="or-bars or-bars--big" viewBox="0 0 240 90" preserveAspectRatio="none" aria-hidden="true">${[30, 46, 38, 58, 50, 70, 62, 80, 72, 86, 78, 90].map((h, i) => `<rect x="${i * 20 + 3}" y="${90 - h}" width="13" height="${h}" rx="5" class="or-bar${i % 3 === 1 ? " or-bar--b" : ""}"/>`).join("")}</svg></div></article>
   <article class="or-card or-b-b" data-spot data-reveal><span class="or-ic">${ico("bolt")}</span><h3>Automatisations</h3><p>Déclencheur, condition, action.</p><div class="or-sws"><div><span>Prévenir l'équipe</span><span class="or-sw is-on" aria-hidden="true"><i></i></span></div><div><span>Clore les doublons</span><span class="or-sw or-sw--anim" aria-hidden="true"><i></i></span></div><div><span>Rappel du lundi</span><span class="or-sw is-on" aria-hidden="true"><i></i></span></div></div></article>
   <article class="or-card or-b-c" data-spot data-reveal><span class="or-ic">${ico("check")}</span><h3>Tâches claires</h3><p>Chacun sait quoi faire ensuite.</p><ul class="or-checks"><li><i>${ico("check", "or-i")}</i>Valider le budget</li><li><i>${ico("check", "or-i")}</i>Envoyer le brief</li><li><i>${ico("check", "or-i")}</i>Préparer la démo</li></ul></article>
   <article class="or-card or-b-d" data-spot data-reveal><div class="or-b-copy"><span class="or-ic">${ico("users")}</span><h3>Équipe synchronisée</h3><p>Voyez qui travaille sur quoi, en temps réel.</p></div><div class="or-b-demo or-pres"><span class="or-cur or-cur--1"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 1.500 14 7l-5 1.500L7 14z"/></svg><em>Léa</em></span><span class="or-cur or-cur--2"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 1.500 14 7l-5 1.500L7 14z"/></svg><em>Yanis</em></span>${avs([["LM", 1], ["YD", 2], ["SB", 3], ["AK", 4]])}<div class="or-skel"><i></i><i></i><i></i></div></div></article>
   <article class="or-card or-b-e" data-spot data-reveal><div class="or-b-copy"><span class="or-ic">${ico("target")}</span><h3>Objectifs mesurables</h3><p>Reliez chaque tâche à un résultat attendu.</p></div><div class="or-b-demo or-goal"><svg class="or-ring" viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="15.915" class="or-dt"/><circle cx="21" cy="21" r="15.915" class="or-rg"/></svg><b class="or-ring-n"><span data-count="76">76</span> %</b></div></article>
  </div></div></section>`;

const steps = () => `<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("En trois étapes", `Opérationnel ${g("en une après-midi")}.`)}
  <ol class="or-steps">${[["01", "layers", "Importez vos projets", "Partez d'un modèle ou reprenez vos listes existantes : les colonnes se reconnaissent toutes seules."], ["02", "list", "Organisez vos vues", "Tableau, liste, chronologie : chaque personne choisit la vue qui lui convient."], ["03", "chart", "Pilotez avec des indicateurs", "Des tableaux de bord prêts à partager avec la direction, sans les refaire chaque semaine."]].map(([n, i, t, d]) => `<li class="or-card or-step" data-spot data-reveal><span class="or-step-n">${n}</span><span class="or-ic">${ico(i)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`;

const integs = [["mail", "Messagerie d'équipe", "Natif"], ["cal", "Agenda partagé", "Natif"], ["code", "Dépôt de code", "API"], ["doc", "Tableur en ligne", "Natif"], ["help", "Support client", "API"], ["card", "Facturation", "API"], ["cloud", "Stockage de fichiers", "Natif"], ["video", "Visioconférence", "Natif"]];
const integrations = () => `<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("Intégrations", `Se branche sur ${g("vos outils")}.`, "Une quarantaine de connecteurs fictifs pour illustrer la page : messagerie, agenda, code, finance.")}
  <div class="or-integs">${integs.map(([i, n, t]) => `<div class="or-card or-integ" data-spot data-reveal><span class="or-ic">${ico(i)}</span><div><b>${n}</b><span>${badge(t, t === "API" ? "b" : "c")}</span></div></div>`).join("")}</div></div></section>`;

const testis = [["LM", 1, "Léa Marchetti", "Cheffe de projet · Axiome (fictif)", "Nous avons divisé par deux les réunions de point d'étape : tout est visible au même endroit."], ["YD", 2, "Yanis Dufour", "Directeur technique · Nimbus (fictif)", "Les automatisations ont supprimé des heures de saisie. L'équipe a retrouvé du temps pour créer."], ["SB", 3, "Samia Benali", "Responsable PMO · Quartz (fictif)", "Les tableaux de bord se partagent d'un clic. La direction suit sans nous solliciter."]];
const testimonials = () => `<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("Retours d'usage", `Ils en parleraient ${g("ainsi")}.`, "Exemples fictifs rédigés pour la démonstration : ce ne sont pas de vrais avis clients.")}
  <div class="or-testis">${testis.map(([t, n, nm, r, q]) => `<figure class="or-card or-testi" data-spot data-reveal><span class="or-badge or-badge--b">Exemple fictif</span><blockquote>${q}</blockquote><figcaption>${av(t, n)}<span><b>${nm}</b><small>${r}</small></span></figcaption></figure>`).join("")}</div></div></section>`;

// ---------- tarifs ----------
const plans = [
  { n: "Solo", d: "Pour organiser ses propres projets.", m: 9, y: 7, tm: "Facturé 9 € par mois", ty: "Soit 84 € par an", f: ["3 projets actifs", "Vues liste et tableau", "5 automatisations", "Support par e-mail"] },
  { n: "Équipe", d: "Pour les équipes qui livrent ensemble.", m: 24, y: 19, hot: 1, tm: "Facturé 24 € par mois", ty: "Soit 228 € par an", f: ["Projets illimités", "Chronologie et analyses", "Automatisations illimitées", "20 intégrations", "Support prioritaire"] },
  { n: "Échelle", d: "Pour les organisations structurées.", m: 59, y: 49, tm: "Facturé 59 € par mois", ty: "Soit 588 € par an", f: ["Tout le plan Équipe", "Droits et rôles avancés", "Journal d'audit", "Accompagnement dédié", "Engagement de disponibilité"] },
];
const toggle = () => `<div class="or-toggle" role="group" aria-label="Période de facturation"><i class="or-knob" aria-hidden="true"></i><a href="#mensuel" data-bill="m" class="is-on" aria-pressed="true">Mensuel</a><a href="#annuel" data-bill="y" aria-pressed="false">Annuel <em>−20 %</em></a></div>`;
const pricing = (full) => `<div class="or-pricing" data-pricing>${toggle()}<div class="or-plans">${plans.map((p) => `<article class="or-card or-plan${p.hot ? " or-plan--hot" : ""}" data-spot data-reveal>${p.hot ? '<span class="or-flag">Le plus choisi</span>' : ""}<h3>${p.n}</h3><p class="or-plan-d">${p.d}</p>
  <p class="or-price"><span class="or-eur">€</span><b class="or-amt" data-m="${p.m}" data-y="${p.y}">${p.m}</b><small>/ utilisateur / mois</small></p><p class="or-plan-n" data-m="${p.tm}" data-y="${p.ty}">${p.tm}</p>
  <ul>${p.f.map((x) => `<li>${ico("check")}${x}</li>`).join("")}</ul>${btn("Demander une démo", "/contact", p.hot ? "p" : "g", "or-btn--block")}</article>`).join("")}</div><p class="or-note">${full ? "Tarifs fictifs de démonstration. " : ""}Aucun paiement ni inscription possible sur ce site : les boutons mènent au formulaire de contact.</p></div>`;

const ck = `<span class="or-yes" role="img" aria-label="Inclus">${ico("check")}</span>`, no = `<span class="or-no" role="img" aria-label="Non inclus">—</span>`;
const cmpRows = [["Projets actifs", "3", "Illimités", "Illimités"], ["Vues liste et tableau", ck, ck, ck], ["Chronologie (Gantt)", no, ck, ck], ["Analyses et tableaux de bord", no, ck, ck], ["Automatisations", "5", "Illimitées", "Illimitées"], ["Intégrations", "5", "20", "40+"], ["Rôles et droits avancés", no, no, ck], ["Journal d'audit", no, no, ck], ["Support", "E-mail", "Prioritaire", "Dédié"]];
const compare = () => `<table class="or-cmp" data-reveal><caption class="or-sr">Comparatif des trois formules</caption><thead><tr><th scope="col">Fonctionnalité</th><th scope="col">Solo</th><th scope="col" class="is-hot">Équipe</th><th scope="col">Échelle</th></tr></thead><tbody>${cmpRows.map(([n, a, b, c]) => `<tr><th scope="row">${n}</th><td data-label="Solo">${a}</td><td data-label="Équipe" class="is-hot">${b}</td><td data-label="Échelle">${c}</td></tr>`).join("")}</tbody></table>`;

const faqItems = [["Puis-je essayer Orbite avant de m'engager ?", "Sur ce site de démonstration, aucune inscription n'est ouverte. Pour un vrai produit, vous trouveriez ici les modalités d'essai : écrivez-nous via le formulaire de contact."], ["Comment fonctionne la facturation annuelle ?", "La bascule mensuel / annuel de cette page recalcule les prix affichés : l'annuel applique une remise de 20 % dans cet exemple."], ["Mes données sont-elles protégées ?", "Dans un produit réel, nous détaillerions ici le chiffrement, l'hébergement et les sauvegardes. Ces informations sont fictives dans cette démonstration."], ["Puis-je importer mes projets existants ?", "L'importation depuis un tableur ou un autre outil de gestion de projet serait guidée pas à pas, avec une correspondance automatique des colonnes."], ["Proposez-vous un accompagnement ?", "La formule Échelle inclurait un accompagnement dédié. Contactez-nous pour en discuter."]];
const faq = (n = 5) => `<section class="or-sec pk-bleed"><div class="or-wrap or-faq"><div>${sechead("Questions fréquentes", `Vous vous ${g("demandez")}…`)}${btn("Poser une question", "/contact", "g")}</div><div class="or-faq-l">${faqItems.slice(0, n).map(([q, a]) => `<details class="or-card" data-reveal><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>`;

const cta = (t = "Prêt à garder le cap ?") => `<section class="or-cta pk-bleed"><div class="or-wrap"><div class="or-cta-in" data-reveal><span class="or-halo or-halo--c" aria-hidden="true"></span><div class="or-h2">${t}</div><p class="or-sub">Parlez-nous de votre équipe : nous vous montrons Orbite sur vos propres cas d'usage.</p><div class="or-actions">${btn("Demander une démo " + ico("arrow"), "/contact", "p", "or-btn--lg")}${btn("Voir les tarifs", "/tarifs", "g", "or-btn--lg")}</div></div></div></section>`;

// ---------- pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="or-hero pk-bleed"><span class="or-halo or-halo--a" aria-hidden="true"></span><span class="or-halo or-halo--b" aria-hidden="true"></span><span class="or-halo or-halo--c" aria-hidden="true"></span>
    <div class="or-wrap or-hero-in"><p class="or-pillnote" data-reveal><i></i>Nouveau · Orbite 3.0, version de démonstration</p>
    <div class="or-h1 or-h1--xl" role="heading" aria-level="1" data-reveal>Pilotez tous vos projets ${g("en pleine lumière")}.</div>
    <p class="or-sub or-sub--l" data-reveal>Orbite réunit tâches, calendrier et indicateurs dans une seule plateforme claire et rapide, pour des équipes qui veulent avancer sans friction.</p>
    <div class="or-actions" data-reveal>${btn("Demander une démo " + ico("arrow"), "/contact", "p", "or-btn--lg")}${btn(ico("play") + " Découvrir le produit", "/produit", "g", "or-btn--lg")}</div>
    <p class="or-proof" data-reveal>${avs([["LM", 1], ["YD", 2], ["SB", 3], ["AK", 4]])}<span>Interface de démonstration · aucune inscription requise</span></p></div>
    <div class="or-stage" data-stage role="img" aria-label="Aperçu de l'application Orbite : tableau de bord d'un projet avec indicateurs, courbe et tâches"><span class="or-stage-glow" aria-hidden="true"></span>${dashWin()}</div></section>`),
  sec(marquee()),
  sec(metrics()),
  sec(bento()),
  sec(steps()),
  sec(integrations()),
  sec(testimonials()),
  sec(`<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("Tarifs", `Simple, ${g("sans surprise")}.`, "Trois formules pour illustrer la page. Faites basculer la période pour voir les prix changer.")}${pricing(false)}</div></section>`),
  sec(faq(4)),
  sec(cta()),
  sec(footer(c)),
];

const feat = (side, kicker, title, text, list, visual) => `<div class="or-fr${side ? " or-fr--r" : ""}"><div class="or-fr-t" data-reveal><p class="or-eyebrow">${kicker}</p><h3 class="or-h3">${title}</h3><p class="or-sub">${text}</p><ul class="or-fl-ul">${list.map((x) => `<li>${ico("check")}${x}</li>`).join("")}</ul></div><div class="or-fr-v" data-reveal><span class="or-stage-glow" aria-hidden="true"></span>${visual}</div></div>`;
const produit = (c) => [sec(header(c)), pagehead("Le produit", `Une plateforme, ${g("quatre façons de voir")} votre travail.`, "Passez d'une vue à l'autre sans perdre le fil : les mêmes données, présentées pour chaque rôle."),
  sec(`<section class="or-feat or-sec pk-bleed"><div class="or-wrap"><div class="or-tabs" role="tablist" aria-label="Vues du produit"><a href="#tableau" class="is-on" data-tab="t1" role="tab" aria-selected="true">${ico("grid")}Tableau</a><a href="#chrono" data-tab="t2" role="tab" aria-selected="false">${ico("cal")}Chronologie</a><a href="#analyses" data-tab="t3" role="tab" aria-selected="false">${ico("chart")}Analyses</a><a href="#auto" data-tab="t4" role="tab" aria-selected="false">${ico("bolt")}Automatisations</a></div>
    <div class="or-panels"><div class="or-tp" data-panel="t1">${feat(0, "Tableau", "Chaque tâche, à sa place.", "Glissez-déposez les cartes d'une colonne à l'autre, assignez, commentez, joignez des fichiers. Les statuts se synchronisent partout.", ["Colonnes personnalisables", "Sous-tâches et dépendances", "Filtres enregistrés par personne"], win("app.orbite.demo/tableau", `<div class="or-win-body or-win-body--s"><div class="or-main">${kanban(false)}</div></div>`))}</div>
    <div class="or-tp" data-panel="t2">${feat(0, "Chronologie", "Voir loin, décider tôt.", "Visualisez les jalons du trimestre, repérez les chevauchements de charge et déplacez une échéance en un geste.", ["Jalons et dépendances", "Détection des conflits de charge", "Export pour la direction"], ganttWin())}</div>
    <div class="or-tp" data-panel="t3">${feat(0, "Analyses", "Des chiffres qui parlent à tous.", "Vélocité, répartition, risques de retard : des indicateurs prêts à l'emploi, que vous personnalisez à votre guise.", ["Tableaux de bord partageables", "Comparaison semaine par semaine", "Alertes sur seuils"], statsWin())}</div>
    <div class="or-tp" data-panel="t4">${feat(0, "Automatisations", "Le répétitif, c'est fini.", "Composez des règles « quand, si, alors » sans écrire une ligne de code, et laissez Orbite s'occuper du reste.", ["Modèles prêts à l'emploi", "Historique d'exécution", "Activation par projet"], autoWin())}</div></div></div></section>`),
  sec(`<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("Au quotidien", `Pensé pour ${g("chaque rôle")}.`)}
    ${feat(0, "Pour les équipes", "Moins de réunions, plus de livraisons.", "Un fil d'activité unique remplace les points d'étape : chacun voit l'avancement et agit au bon moment.", ["Fil d'activité en direct", "Mentions et commentaires", "Notifications maîtrisées"], win("app.orbite.demo/activite", `<div class="or-win-body or-win-body--s"><div class="or-main"><div class="or-act">${[["LM", 1, "Léa a terminé", "Maquettes de l'onboarding", "il y a 2 min"], ["YD", 2, "Yanis a commenté", "API de notifications", "il y a 14 min"], ["SB", 3, "Samia a déplacé", "Brief partenaires → En cours", "il y a 1 h"], ["AK", 4, "Amine a créé", "Tests de charge", "il y a 3 h"]].map(([t, n, a, b, w]) => `<div class="or-act-i">${av(t, n)}<span><b>${a}</b> ${b}<small>${w}</small></span></div>`).join("")}</div></div></div>`))}
    ${feat(1, "Pour les responsables", "Un tableau de bord qui se tient tout seul.", "Les indicateurs se calculent depuis le travail réel de l'équipe : plus de relances ni de tableur à mettre à jour.", ["Risques de retard anticipés", "Charge par personne", "Rapports en un clic"], statsWin())}
    ${feat(0, "Pour la direction", "La vision d'ensemble, sans le bruit.", "Regroupez plusieurs projets dans un portefeuille et suivez les objectifs de l'organisation d'un seul coup d'œil.", ["Portefeuilles de projets", "Objectifs reliés aux tâches", "Partage en lecture seule"], ganttWin())}</div></section>`),
  sec(integrations()), sec(cta("Voir Orbite sur vos projets")), sec(footer(c))];

const tarifs = (c) => [sec(header(c)), pagehead("Tarifs", `Des formules ${g("lisibles")}.`, "Choisissez la période de facturation : les prix affichés changent instantanément."),
  sec(`<section class="or-sec or-sec--t pk-bleed"><div class="or-wrap">${pricing(true)}</div></section>`),
  sec(`<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("Comparatif", `Tout, ${g("côte à côte")}.`)}${compare()}</div></section>`),
  sec(faq(5)), sec(cta("Une question sur les formules ?")), sec(footer(c))];

const resCards = [
  ["guide", "Guide", "Lancer un projet sans se perdre", "Les cinq décisions à prendre avant la première tâche.", "8 min", 0],
  ["cas", "Étude de cas", "Comment une équipe fictive a réduit ses délais", "Un exemple chiffré pour illustrer la méthode.", "6 min", 1],
  ["produit", "Produit", "Nouveautés d'Orbite 3.0", "Chronologie repensée, automatisations visuelles et analyses.", "4 min", 2],
  ["guide", "Guide", "Bien choisir ses indicateurs", "Ce qu'il faut mesurer, et ce qu'on peut ignorer.", "7 min", 3],
  ["cas", "Étude de cas", "Piloter un programme pilote en six semaines", "Retour d'expérience imaginé pour la démonstration.", "9 min", 4],
  ["produit", "Produit", "Les raccourcis qui font gagner du temps", "Dix gestes clavier pour aller plus vite.", "3 min", 5],
];
const cover = (i) => {
  const v = [
    '<circle cx="60" cy="40" r="26" class="rc1"/><circle cx="60" cy="40" r="38" fill="none" class="rc2"/><circle cx="100" cy="22" r="6" class="rc3"/>',
    '<rect x="14" y="44" width="16" height="22" rx="5" class="rc1"/><rect x="38" y="30" width="16" height="36" rx="5" class="rc3"/><rect x="62" y="18" width="16" height="48" rx="5" class="rc1"/><rect x="86" y="8" width="16" height="58" rx="5" class="rc3"/>',
    '<rect x="16" y="12" width="88" height="56" rx="10" fill="none" class="rc2"/><rect x="26" y="22" width="32" height="14" rx="5" class="rc1"/><rect x="26" y="42" width="68" height="8" rx="4" class="rc3"/><rect x="26" y="56" width="44" height="6" rx="3" class="rc2f"/>',
    '<path d="M10 62c20-4 28-30 46-30s26 18 54 6" fill="none" class="rc2" stroke-width="3"/><circle cx="56" cy="32" r="7" class="rc1"/>',
    '<circle cx="40" cy="40" r="22" class="rc1"/><circle cx="76" cy="40" r="22" class="rc3" opacity=".7"/>',
    '<path d="M60 8 100 30v22L60 74 20 52V30z" fill="none" class="rc2" stroke-width="3"/><path d="M60 8v32l40-10M60 40 20 30" fill="none" class="rc2" stroke-width="2"/>',
  ][i % 6];
  return `<svg class="or-cover" viewBox="0 0 120 76" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${v}</svg>`;
};
const ressources = (c) => [sec(header(c)), pagehead("Ressources", `Apprendre, ${g("comparer")}, s'inspirer.`, "Guides, études de cas et nouveautés du produit. Les articles de cette page sont des exemples de démonstration."),
  sec(`<section class="or-res or-sec pk-bleed"><div class="or-wrap"><div class="or-chips" role="tablist" aria-label="Filtrer les ressources"><a href="#tout" class="is-on" data-filter="all" role="tab" aria-selected="true">Tout</a><a href="#guides" data-filter="guide" role="tab" aria-selected="false">Guides</a><a href="#cas" data-filter="cas" role="tab" aria-selected="false">Études de cas</a><a href="#produit" data-filter="produit" role="tab" aria-selected="false">Produit</a></div>
    <div class="or-rgrid">${resCards.map(([k, l, t, d, m, i]) => `<article class="or-card or-rc${i === 0 ? " or-rc--big" : ""}" data-spot data-cat="${k}" data-reveal>${cover(i).replace("<svg", `<svg data-v="${i % 3}"`)}<div class="or-rc-b"><div class="or-rc-m">${badge(l, k === "guide" ? "a" : k === "cas" ? "b" : "c")}<span>${ico("clock")}${m}</span></div><h3>${t}</h3><p>${d}</p><a class="or-more" href="/contact">Demander ce contenu ${ico("arrow")}</a></div></article>`).join("")}</div></div></section>`),
  sec(`<section class="or-sec pk-bleed"><div class="or-wrap"><div class="or-card or-news" data-spot data-reveal><div><h2 class="or-h3">Recevoir les nouveautés</h2><p class="or-sub">Pas de lettre d'information dans cette démonstration : écrivez-nous et nous vous répondons.</p></div>${btn("Nous écrire " + ico("arrow"), "/contact", "p")}</div></div></section>`),
  sec(footer(c))];

const apropos = (c) => [sec(header(c)), pagehead("À propos", `Nous construisons ${g("le calme")} dans les projets.`, "Orbite est une entreprise imaginaire. Cette page montre comment présenter une histoire, des valeurs et une équipe."),
  sec(`<section class="or-sec pk-bleed"><div class="or-wrap or-about"><div data-reveal><h2 class="or-h3">Notre histoire</h2><p class="or-sub">Tout commence autour d'un tableau blanc saturé de notes. Trois collègues imaginent un outil qui rend le travail visible sans le compliquer. Quelques années plus tard, Orbite accompagne des équipes de toutes tailles.</p><p class="or-sub">Notre conviction : un bon outil de pilotage s'efface devant le travail qu'il raconte.</p></div>
    <ol class="or-time">${[["2019", "Le premier prototype", "Un tableau, des cartes, et beaucoup de café."], ["2021", "Ouverture aux premières équipes", "Les automatisations arrivent."], ["2023", "Orbite 2.0", "Chronologie et analyses intégrées."], ["2026", "Orbite 3.0", "Une interface repensée, plus rapide."]].map(([y, t, d]) => `<li class="or-card" data-spot data-reveal><b>${y}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("Valeurs", `Ce qui nous ${g("guide")}.`)}<div class="or-vals">${[["shield", "Clarté", "Dire les choses simplement, dans le produit comme dans nos échanges."], ["heart", "Soin", "Les détails comptent : un bon outil se remarque à ce qu'on ne voit pas."], ["layers", "Ouverture", "Des intégrations, une API, et vos données qui restent les vôtres."]].map(([i, t, d]) => `<article class="or-card" data-spot data-reveal><span class="or-ic">${ico(i)}</span><h3>${t}</h3><p>${d}</p></article>`).join("")}</div></div></section>`),
  sec(metrics()),
  sec(`<section class="or-sec pk-bleed"><div class="or-wrap">${sechead("L'équipe", `Des visages ${g("imaginaires")}.`, "Personnes fictives, créées pour la démonstration.")}<div class="or-team">${[["LM", 1, "Léa Marchetti", "Cofondatrice, produit"], ["YD", 2, "Yanis Dufour", "Cofondateur, technique"], ["SB", 3, "Samia Benali", "Design"], ["AK", 4, "Amine Kader", "Relation client"]].map(([t, n, nm, r]) => `<article class="or-card or-member" data-spot data-reveal>${av(t, n).replace("or-av ", "or-av or-av--xl ")}<h3>${nm}</h3><p>${r}</p></article>`).join("")}</div></div></section>`),
  sec(cta("Envie de travailler avec nous ?")), sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Contact", `Parlons de ${g("votre équipe")}.`, "Démonstration produit, question sur les formules ou presse : écrivez-nous."),
  sec(`<section class="or-ct pk-bleed"><div class="or-wrap or-ct-in">${[["mail", "Écrire", "bonjour@orbite.example"], ["clock", "Réponse", "Sous deux jours ouvrés"], ["pin", "Studio fictif", "12 rue de l'Orbite, 75000 Ville"]].map(([i, t, d]) => `<div class="or-card or-ctc" data-spot data-reveal><span class="or-ic">${ico(i)}</span><div><b>${t}</b><span>${d}</span></div></div>`).join("")}</div></section>`),
  { type: "form", heading: "Demander une démo", intro: "Dites-nous qui vous êtes et ce que vous souhaitez piloter. Ce formulaire est la seule action disponible sur ce site de démonstration." },
  sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Recherche", `Que cherchez-${g("vous")} ?`, "Une fonctionnalité, un guide, une réponse."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="or-404 pk-bleed"><span class="or-halo or-halo--a" aria-hidden="true"></span><span class="or-halo or-halo--b" aria-hidden="true"></span><div class="or-wrap"><svg class="or-planet" viewBox="0 0 200 120" aria-hidden="true"><circle cx="100" cy="60" r="34" class="or-pl1"/><ellipse cx="100" cy="60" rx="86" ry="22" transform="rotate(-18 100 60)" fill="none" class="or-pl2" stroke-width="3"/><circle cx="170" cy="36" r="6" class="or-pl3"/><circle cx="30" cy="92" r="3" class="or-pl3"/><circle cx="52" cy="20" r="2" class="or-pl3"/></svg><p class="or-eyebrow">Erreur 404</p><div class="or-h1" role="heading" aria-level="1">Cette page a quitté ${g("l'orbite")}.</div><p class="or-sub">Elle n'existe pas ou a changé d'adresse. Revenez à l'accueil ou lancez une recherche.</p><div class="or-actions">${btn("Retour à l'accueil", "/", "p", "or-btn--lg")}${btn("Rechercher", "/recherche", "g", "or-btn--lg")}</div></div></section>`), sec(footer(c))];

module.exports = {
  key: "orbite", name: "Orbite", version: "2.0.0", category: "tech", tags: ["sombre", "moderne", "technique"], siteType: "Logiciel SaaS de pilotage de projets", featured: true,
  concept: "Un produit lumineux dans la nuit : verre dépoli, halos violet et cyan, pilule de navigation flottante et grande maquette d'application en perspective.",
  description: "Site de logiciel SaaS en mode sombre (ou clair) : en-tête pilule flottante, maquette d'appli en perspective, bento animé avec spotlight au curseur, tarifs avec bascule mensuel/annuel, comparatif, ressources.",
  brand: "Orbite", modules: ["formulaires", "recherche"],
  dna: { header: "pilule-flottante", hero: "mockup-produit-centre", grid: "bento", motion: "spotlight-curseur-et-bascule-tarifs" },
  tokens: {
    colors: { primary: "#a285ff", secondary: "#2fd4f0", accent: "#2fd4f0", background: "#060818", surface: "#0e1233", text: "#eaedff", muted: "#a4acd4", success: "#34d399", warning: "#fbbf24", error: "#f87171" },
    fonts: { heading: "font.sora", body: "font.inter", button: "font.manrope", link: "font.inter" },
    radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 20 }, shadow: { card: "0 20px 60px -20px rgba(0,0,0,.6)", button: "0 8px 30px -8px rgba(162,133,255,.6)" }, border: { width: 1, color: "#262b55" },
    type: { h1: { size: 76, weight: 700, lineHeight: 1.02 }, h2: { size: 48, weight: 700, lineHeight: 1.08 } },
  },
  options: [
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "dark", choices: [["dark", "Sombre"], ["light", "Clair"]] },
    { key: "hue", label: "Couleurs du dégradé", type: "choice", default: "aurore", choices: [["aurore", "Violet → cyan"], ["braise", "Orange → rose"], ["foret", "Menthe → citron"], ["ocean", "Bleu → vert"]] },
    { key: "halo", label: "Intensité des halos", type: "range", default: 60, min: 0, max: 100, step: 10 },
    { key: "radius", label: "Rayon des coins (px)", type: "range", default: 20, min: 8, max: 28, step: 2 },
    { key: "anim", label: "Animations", type: "choice", default: "on", choices: [["on", "Activées"], ["off", "Désactivées"]] },
  ],
  menu: [["Accueil", "/"], ["Produit", "/produit"], ["Tarifs", "/tarifs"], ["Ressources", "/ressources"], ["À propos", "/apropos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "produit", name: "Produit", render: produit }, { key: "tarifs", name: "Tarifs", render: tarifs },
    { key: "ressources", name: "Ressources", render: ressources }, { key: "apropos", name: "À propos", render: apropos }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
