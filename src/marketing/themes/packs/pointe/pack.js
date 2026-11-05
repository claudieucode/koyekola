// Pointe — école de danse. Direction artistique : chronophotographie. Fond blanc-lilas, encre bleu nuit-violet, un seul accent magenta profond ; silhouettes de danseurs
// en traits fluides dont les traînées se dessinent, barre latérale fine à libellés verticaux, bandes courbes, frise de saison filtrable par niveau et par style.
const { sec, form, esc, nav } = require("../kit");

/* ---------- Poses de danseur (boîte 100 x 160, sol à y = 150). h tête, n cou, p bassin, b courbure du buste, la/ra bras (coude, main), ll/rl jambes (genou, pied) ---------- */
const POSES = {
  plie: { h: [50, 24], n: [50, 38], p: [50, 84], b: 0, la: [30, 62, 38, 84], ra: [70, 62, 62, 84], ll: [30, 114, 42, 148], rl: [70, 114, 58, 148] },
  passe: { h: [50, 20], n: [50, 34], p: [50, 80], b: 0, la: [28, 44, 46, 12], ra: [72, 44, 54, 12], ll: [50, 116, 50, 148], rl: [76, 90, 52, 102] },
  arab: { h: [36, 32], n: [44, 44], p: [56, 86], b: -7, la: [28, 46, 8, 40], ra: [66, 50, 86, 50], ll: [80, 92, 98, 70], rl: [56, 118, 56, 148] },
  jete: { h: [50, 30], n: [50, 44], p: [50, 82], b: 0, la: [34, 40, 16, 24], ra: [66, 40, 84, 24], ll: [26, 86, 4, 102], rl: [74, 76, 98, 62] },
  floor: { h: [38, 52], n: [46, 64], p: [62, 94], b: -9, la: [34, 80, 16, 106], ra: [62, 64, 86, 48], ll: [40, 112, 12, 144], rl: [80, 120, 90, 148] },
  freeze: { h: [52, 30], n: [52, 44], p: [50, 86], b: 5, la: [28, 60, 16, 84], ra: [74, 44, 90, 22], ll: [34, 116, 18, 148], rl: [64, 112, 80, 148] },
  afric: { h: [50, 28], n: [50, 42], p: [50, 86], b: 0, la: [28, 36, 22, 14], ra: [72, 62, 86, 82], ll: [30, 110, 36, 148], rl: [72, 100, 88, 124] },
  petit: { h: [50, 60], n: [50, 72], p: [50, 104], b: 0, la: [30, 74, 22, 52], ra: [70, 74, 78, 52], ll: [40, 128, 38, 148], rl: [60, 128, 62, 148] },
};
const limbs = (s) => {
  const [hx, hy] = s.h, [nx, ny] = s.n, [px, py] = s.p;
  const a = (v) => `M${nx} ${ny}Q${v[0]} ${v[1]} ${v[2]} ${v[3]}`;
  const l = (v) => `M${px} ${py}Q${v[0]} ${v[1]} ${v[2]} ${v[3]}`;
  return [`M${hx} ${hy + 7}L${nx} ${ny}`, `M${nx} ${ny}Q${(nx + px) / 2 + s.b} ${(ny + py) / 2} ${px} ${py}`, a(s.la), a(s.ra), l(s.ll), l(s.rl)];
};
const figG = (k, tf = "", cls = "") => { const s = POSES[k]; return `<g class="pt-fg ${cls}"${tf ? ` transform="${tf}"` : ""}><circle cx="${s.h[0]}" cy="${s.h[1]}" r="7"/>${limbs(s).map((d) => `<path d="${d}"/>`).join("")}</g>`; };
const fig = (k, cls = "") => `<svg class="pt-svg ${cls}" viewBox="0 0 100 160" aria-hidden="true" focusable="false">${figG(k)}</svg>`;
// courbe lisse (Catmull-Rom) passant par des points
const smooth = (pts) => { let d = `M${pts[0][0].toFixed(0)} ${pts[0][1].toFixed(0)}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(0)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(0)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(0)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(0)} ${p2[0].toFixed(0)} ${p2[1].toFixed(0)}`; } return d; };
// chronophotographie : n poses qui s'enchaînent, la dernière en accent, traînées des mains et de la tête
const chrono = (keys, W, H, s, y0, cls) => {
  const n = keys.length, figs = [], hands = [], heads = [], feet = [];
  keys.forEach((k, i) => {
    const P = POSES[k], cx = (W * (2 * i + 1)) / (2 * n), x0 = cx - 50 * s, o = (0.16 + 0.84 * Math.pow(i / (n - 1), 1.6)).toFixed(2);
    figs.push(figG(k, `translate(${x0.toFixed(1)} ${y0}) scale(${s})`, `pt-pose pt-pose${i}${i === n - 1 ? " pt-last" : ""}`).replace('class="', `opacity="${o}" class="`));
    const hand = P.ra.slice(2);
    hands.push([x0 + hand[0] * s, y0 + hand[1] * s]); heads.push([x0 + P.h[0] * s, y0 + P.h[1] * s]); feet.push([x0 + P.rl[2] * s, y0 + P.rl[3] * s]);
  });
  return `<svg class="pt-svg pt-chrono ${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><path class="pt-ground" d="M0 ${y0 + 150 * s + 6}H${W}"/><path class="pt-trail pt-trail--h" d="${smooth(heads)}"/><path class="pt-trail pt-trail--f" d="${smooth(feet)}"/>${figs.join("")}<path class="pt-trail" d="${smooth(hands)}"/></svg>`;
};
// grande traînée décorative
const swoosh = (cls, d) => `<svg class="pt-swoosh ${cls}" viewBox="0 0 600 200" aria-hidden="true" focusable="false"><path class="pt-trail" d="${d}"/><path class="pt-trail pt-trail--f" d="${d.replace(/(\d+) (\d+)/g, (m, a, b) => `${a} ${+b + 14}`)}"/></svg>`;

/* ---------- Données ---------- */
const LEVELS = [["eveil", "Éveil", 1], ["debutant", "Débutant", 2], ["inter", "Intermédiaire", 3], ["avance", "Avancé", 4]];
const STYLES = [["classique", "Classique", "passe"], ["contemporain", "Contemporain", "floor"], ["jazz", "Jazz", "jete"], ["hiphop", "Hip-hop", "freeze"], ["africaines", "Danses africaines", "afric"]];
const LV = Object.fromEntries(LEVELS.map(([k, n, i]) => [k, { n, i }])), ST = Object.fromEntries(STYLES.map(([k, n, p]) => [k, { n, p }]));
const PROFS = {
  helene: { name: "Hélène Marchetti", role: "Classique", pose: "arab", bio: "Quinze ans de scène en compagnie, puis la pédagogie : une barre exigeante, une salle bienveillante.", teach: "Classique, de l'éveil aux pointes" },
  ines: { name: "Inès Lambert", role: "Contemporain", pose: "floor", bio: "Elle travaille le poids, le souffle et la chute. Ses élèves apprennent à composer avant de reproduire.", teach: "Contemporain, atelier de création" },
  theo: { name: "Théo Bastien", role: "Jazz", pose: "jete", bio: "Ancien danseur de comédie musicale, il fait de chaque cours une petite revue : énergie, précision, sourire.", teach: "Jazz et comédie musicale" },
  dario: { name: "Dario Mensah", role: "Hip-hop", pose: "freeze", bio: "Du cercle de rue au studio : bases, grooves et freestyle, avec une règle d'or, le respect du cercle.", teach: "Hip-hop, freestyle, battle" },
  awa: { name: "Awa Diallo", role: "Danses africaines", pose: "afric", bio: "Elle danse sur des percussions jouées en direct et transmet les rythmes d'Afrique de l'Ouest, pas à pas.", teach: "Danses africaines et percussions" },
  camille: { name: "Camille Roussel", role: "Éveil", pose: "petit", bio: "Éducatrice formée à la danse : contes, comptines et jeux pour apprendre à bouger sans se prendre au sérieux.", teach: "Éveil et initiation, 4 à 8 ans" },
};
// id, nom, style, niveau, date de début, horaire, prof, salle, durée, âge
const RAW = [
  ["eveil", "Éveil à la danse", "classique", "eveil", "2026-09-12", "10 h – 10 h 45", "camille", "Salle Paviot", "45 min", "4 – 6 ans"],
  ["clas-deb", "Classique débutant", "classique", "debutant", "2026-09-14", "18 h 30 – 20 h", "helene", "Salle Paviot", "1 h 30", "dès 12 ans"],
  ["hh-deb", "Hip-hop débutant", "hiphop", "debutant", "2026-09-17", "19 h – 20 h 15", "dario", "Studio Brique", "1 h 15", "dès 11 ans"],
  ["afr-deb", "Danses africaines, premiers rythmes", "africaines", "debutant", "2026-10-07", "19 h – 20 h 30", "awa", "Studio Brique", "1 h 30", "dès 14 ans"],
  ["cont-int", "Contemporain intermédiaire", "contemporain", "inter", "2026-10-13", "19 h 30 – 21 h", "ines", "Salle Paviot", "1 h 30", "dès 15 ans"],
  ["jazz-int", "Jazz intermédiaire", "jazz", "inter", "2026-11-12", "20 h – 21 h 30", "theo", "Studio Brique", "1 h 30", "dès 14 ans"],
  ["eveil-conte", "Éveil créatif, le conte dansé", "contemporain", "eveil", "2026-12-05", "11 h – 11 h 45", "camille", "Salle Paviot", "45 min", "6 – 8 ans"],
  ["clas-av", "Classique avancé, travail sur pointes", "classique", "avance", "2027-01-12", "18 h – 19 h 45", "helene", "Salle Paviot", "1 h 45", "dès 15 ans"],
  ["hh-int", "Hip-hop intermédiaire, freestyle", "hiphop", "inter", "2027-02-10", "19 h 15 – 20 h 45", "dario", "Studio Brique", "1 h 30", "dès 13 ans"],
  ["cont-av", "Contemporain avancé, création", "contemporain", "avance", "2027-03-09", "20 h – 22 h", "ines", "Salle Paviot", "2 h", "dès 16 ans"],
  ["jazz-av", "Jazz avancé, comédie musicale", "jazz", "avance", "2027-04-14", "19 h 30 – 21 h 30", "theo", "Studio Brique", "2 h", "dès 15 ans"],
  ["afr-int", "Danses africaines, percussions vivantes", "africaines", "inter", "2027-05-12", "19 h – 20 h 45", "awa", "Studio Brique", "1 h 45", "dès 14 ans"],
];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MFULL = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const COURSES = RAW.map(([id, name, sty, lv, iso, hours, prof, room, dur, age]) => {
  const d = new Date(iso + "T12:00:00Z"), wd = JOURS[d.getUTCDay()], short = `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
  const slots = [0, 7, 14].map((k) => { const e = new Date(d.getTime() + k * 864e5); return `${wd} ${e.getUTCDate()} ${MOIS[e.getUTCMonth()]}`; });
  return { id, name, sty, lv, iso, hours, prof, room, dur, age, wd, short, long: `${wd} ${d.getUTCDate()} ${MFULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`, m: (d.getUTCMonth() + 4) % 12, slots };
});
const pips = (n) => `<span class="pt-pips" role="img" aria-label="Niveau ${n} sur 4">${[1, 2, 3, 4].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;
const loupe = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 5.5 5.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const mark = `<svg class="pt-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 34C10 14 22 6 32 6M12 34c4-8 8-12 14-14M18 34c2-4 4-6 8-8" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="31" cy="6.5" r="3" fill="currentColor"/></svg>`;

/* ---------- Structure commune ---------- */
const header = (c) => `<header class="pt-side pk-bleed">
  <a class="pt-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span class="pt-logo-w">Pointe</span></a>
  <div class="pt-snav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <a class="pt-sq" href="/recherche" aria-label="Rechercher sur le site">${loupe}</a>
  <span class="pt-prog" aria-hidden="true"><i></i></span>
  <details class="pt-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="pt-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="pt-btn" href="/contact">Cours d'essai</a></div></details>
</header>`;
const footer = (c) => `<footer class="pt-foot pk-bleed"><div class="pt-wrap pt-foot-in">
  <div class="pt-foot-brand">${mark}<p class="pt-foot-w">Pointe</p><p>École de danse<br>12 rue des Capucines · 44000 Nantes</p><p><a href="mailto:bonjour@pointe-danse.example">bonjour@pointe-danse.example</a></p></div>
  <div><h2 class="pt-h6">L'école</h2>${nav(c.menu.slice(1), "pt-fl")}</div>
  <div><h2 class="pt-h6">Pratique</h2><a class="pt-fl" href="/fiche-cours">Fiche de cours</a><a class="pt-fl" href="/recherche">Recherche</a><a class="pt-fl" href="/contact">Cours d'essai</a></div>
  <div class="pt-foot-sw" aria-hidden="true">${swoosh("pt-sw-foot", "M10 150C120 40 220 190 320 90S500 30 590 70")}</div>
  <p class="pt-legal">© Pointe — site de démonstration. École, professeurs, horaires et spectacles fictifs ; aucune inscription n'est enregistrée ici.</p></div></footer>`;
const pagehead = (kicker, title, sub, pose) => sec(`<section class="pt-ph pk-bleed"><div class="pt-wrap pt-ph-in"><div><p class="pt-kicker" data-reveal>${esc(kicker)}</p><div class="pt-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="pt-sub" data-reveal>${esc(sub)}</p>` : ""}</div>
  <div class="pt-ph-art" aria-hidden="true"><svg class="pt-svg pt-ph-fig" viewBox="-40 -6 190 172" focusable="false">${figG(pose, "", "pt-pose pt-last")}<path class="pt-trail" d="M-30 150C-10 60 40 150 60 60S120 10 150 40"/></svg></div></div></section>`);

/* ---------- Composant signature : frise de saison ---------- */
const filters = () => `<div class="pt-filters"><div class="pt-fgrp" role="group" aria-label="Filtrer par niveau"><span class="pt-fl-t">Niveau</span><a class="pt-f is-on" href="#niveau-tous" data-f="lv" data-v="all" aria-pressed="true">Tous</a>${LEVELS.map(([k, n, i]) => `<a class="pt-f" href="#niveau-${k}" data-f="lv" data-v="${k}" aria-pressed="false">${pips(i)}${n}</a>`).join("")}</div>
  <div class="pt-fgrp" role="group" aria-label="Filtrer par style"><span class="pt-fl-t">Style</span><a class="pt-f is-on" href="#style-tous" data-f="sty" data-v="all" aria-pressed="true">Tous</a>${STYLES.map(([k, n]) => `<a class="pt-f" href="#style-${k}" data-f="sty" data-v="${k}" aria-pressed="false">${n}</a>`).join("")}</div></div>`;
const card = (k) => `<li class="pt-ev" data-id="${k.id}" data-m="${k.m}" data-lv="${k.lv}" data-sty="${k.sty}" data-name="${esc(k.name)}" data-prof="${esc(PROFS[k.prof].name)}" data-when="${esc(`${k.wd} · ${k.hours}`)}" data-room="${esc(k.room)}" data-dur="${esc(k.dur)}" data-age="${esc(k.age)}" data-lvn="${LV[k.lv].n}" data-lvi="${LV[k.lv].i}" data-stn="${ST[k.sty].n}" data-start="${esc(k.long)}" data-slots="${esc(k.slots.join("|"))}">
  <a class="pt-card" href="#cours-${k.id}">${pips(LV[k.lv].i)}<span class="pt-card-fig">${fig(ST[k.sty].p)}</span><b class="pt-cn">${esc(k.name)}</b><span class="pt-cm">${esc(k.wd)} · ${esc(k.hours)}</span><span class="pt-cs">${esc(ST[k.sty].n)} · ${esc(LV[k.lv].n)}</span></a>
  <span class="pt-node"><time datetime="${k.iso}">${esc(k.short)}</time></span></li>`;
const fiche = (k) => `<article class="pt-fiche" aria-live="polite"><div class="pt-fi-head"><p class="pt-kicker" data-o="meta">${esc(ST[k.sty].n)} · ${esc(LV[k.lv].n)}</p><h3 class="pt-fi-t" data-o="name">${esc(k.name)}</h3></div>
  <dl class="pt-fi-dl"><div><dt>Professeur</dt><dd data-o="prof">${esc(PROFS[k.prof].name)}</dd></div><div><dt>Horaires</dt><dd data-o="when">${esc(`${k.wd} · ${k.hours}`)}</dd></div><div><dt>Salle</dt><dd data-o="room">${esc(k.room)}</dd></div><div><dt>Durée</dt><dd data-o="dur">${esc(k.dur)}</dd></div><div><dt>Public</dt><dd data-o="age">${esc(k.age)}</dd></div><div><dt>Premier cours</dt><dd data-o="start">${esc(k.long)}</dd></div></dl>
  <div class="pt-fi-act"><a class="pt-btn" href="#essai" data-essai>Demander un cours d'essai ${arrow}</a><a class="pt-btn pt-btn--ghost" href="/fiche-cours">Fiche détaillée</a></div>
  <div class="pt-essai" data-o="essai"><p class="pt-es-t">Étape 1 : choisissez une séance d'essai</p><div class="pt-slots" role="group" aria-label="Séances d'essai proposées" data-o="slots">${k.slots.map((s, i) => `<a class="pt-slot${i ? "" : " is-on"}" href="#seance-${i + 1}" data-slot="${esc(s)}" aria-pressed="${i ? "false" : "true"}">${esc(s)}</a>`).join("")}</div>
    <p class="pt-es-t">Étape 2 : votre récapitulatif</p><p class="pt-recap" data-o="recap"></p>
    <div class="pt-fi-act"><a class="pt-btn" href="/contact" data-go>Étape 3 : écrire à l'école ${arrow}</a><a class="pt-btn pt-btn--ghost" href="#copier" data-copy>Copier le récapitulatif</a></div>
    <p class="pt-note">Rien n'est réservé sur cette page : la demande part du formulaire de contact et l'école confirme ensuite. Démonstration.</p></div></article>`;
const friseSec = (title, intro) => sec(`<section class="pt-frise pt-top pk-bleed" data-frise><div class="pt-wrap"><div class="pt-sechead"><p class="pt-kicker" data-reveal>Frise de saison 2026 – 2027</p><h2 class="pt-h2" data-reveal>${title}</h2><p class="pt-lead" data-reveal>${esc(intro)}</p></div>${filters()}<p class="pt-count" data-o="count" aria-live="polite">${COURSES.length} cours sur ${COURSES.length}</p></div>
  <div class="pt-railbox"><div class="pt-arrows"><a href="#precedent" data-nav="-1" aria-label="Cours précédents">${arrow}</a><a href="#suivant" data-nav="1" aria-label="Cours suivants">${arrow}</a></div>
  <div class="pt-rail" data-rail role="region" aria-label="Frise de la saison : faites défiler pour parcourir les cours"><ol class="pt-line">${COURSES.map(card).join("")}</ol></div>
  <div class="pt-mbar"><span class="pt-mtrack" aria-hidden="true"><i data-thumb></i></span><div class="pt-months" role="group" aria-label="Aller à un mois">${["Sept.", "Oct.", "Nov.", "Déc.", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin"].map((m, i) => `<a href="#mois-${i}" data-month="${i}">${m}</a>`).join("")}</div></div>
  <p class="pt-empty" data-o="empty">Aucun cours ne correspond à cette combinaison. Essayez « Tous » pour l'un des filtres.</p></div>
  <div class="pt-wrap">${fiche(COURSES[1])}</div></section>`);

/* ---------- Accueil ---------- */
const DESK = ["plie", "passe", "arab", "jete", "floor", "afric"];
const hero = () => sec(`<section class="pt-hero pk-bleed"><div class="pt-wrap">
  <p class="pt-kicker" data-reveal>École de danse · Nantes · saison 2026 – 2027</p>
  <div class="pt-h1 pt-h1--xl" role="heading" aria-level="1" data-reveal>Danser, c'est<br>dessiner <em>le temps.</em></div>
  <p class="pt-lead" data-reveal>Du premier pas d'éveil aux pointes, cinq styles, quatre niveaux et six professeurs. Chaque mouvement laisse une trace : venez écrire la vôtre.</p>
  <div class="pt-actions" data-reveal><a class="pt-btn pt-btn--lg" href="/cours">Voir la frise de la saison ${arrow}</a><a class="pt-btn pt-btn--ghost pt-btn--lg" href="/contact">Cours d'essai</a></div></div>
  <div class="pt-seq" role="img" aria-label="Chronophotographie : une danseuse enchaîne six poses, de la préparation au grand jeté, puis à la danse au sol.">${chrono(DESK, 1200, 400, 2.2, 14, "pt-only-d")}${chrono(["passe", "arab", "jete", "floor"], 360, 230, 1.18, 8, "pt-only-m")}
    <ol class="pt-frames pt-only-d" aria-hidden="true">${["Préparation", "Passé", "Arabesque", "Grand jeté", "Au sol", "Rythme"].map((t, i) => `<li><b>0${i + 1}</b>${t}</li>`).join("")}</ol></div>
  <div class="pt-wrap"><ul class="pt-stats"><li data-reveal><b data-count="5">5</b><span>styles de danse</span></li><li data-reveal><b data-count="4">4</b><span>niveaux, de l'éveil à l'avancé</span></li><li data-reveal><b data-count="6">6</b><span>professeurs</span></li><li data-reveal><b data-count="2">2</b><span>salles lumineuses</span></li></ul></div></section>`);

const styleBands = () => STYLES.map(([k, n, p], i) => {
  const d = { classique: "La barre, le port de bras, la ligne : la grammaire de toutes les danses.", contemporain: "Poids, souffle, chute et relâché : on invente son propre mouvement.", jazz: "Rythme, isolations et énergie de comédie musicale.", hiphop: "Bases, grooves et freestyle dans le respect du cercle.", africaines: "Percussions en direct, énergie collective et pas venus d'Afrique de l'Ouest." }[k];
  const n2 = COURSES.filter((x) => x.sty === k).length;
  return `<a class="pt-sband pt-sb${i}" href="/cours" data-reveal><span class="pt-sb-fig">${fig(p)}</span><span class="pt-sb-txt"><b>${n}</b><span>${d}</span></span><span class="pt-sb-meta">${n2} cours cette saison ${arrow}</span></a>`;
}).join("");
const ladder = () => [["Éveil", "4 – 8 ans", "Jeux, contes et comptines pour apprivoiser l'espace, le rythme et les autres."], ["Débutant", "ados et adultes", "Les bases du style choisi, sans prérequis, dans une salle où l'on a le droit de se tromper."], ["Intermédiaire", "après un an", "Enchaînements, musicalité et premiers petits solos."], ["Avancé", "sur avis du professeur", "Technique fine, création et préparation du spectacle de fin d'année."]]
  .map(([n, a, t], i) => `<li class="pt-step pt-step${i}" data-reveal><span class="pt-step-n">0${i + 1}</span><div><h3>${n}</h3><p class="pt-step-a">${a}</p><p>${t}</p></div>${pips(i + 1)}</li>`).join("");
const profMini = () => ["helene", "ines", "dario"].map((k) => `<article class="pt-pm" data-reveal><span class="pt-oval">${fig(PROFS[k].pose)}</span><h3>${PROFS[k].name}</h3><p>${PROFS[k].role}</p></article>`).join("");

const home = (c) => [
  sec(header(c)), hero(),
  friseSec("La saison, de septembre à juin", "Chaque cours est un point sur la ligne du temps. Filtrez par niveau ou par style, ouvrez une fiche, puis demandez un cours d'essai : le récapitulatif vous suit jusqu'au formulaire."),
  sec(`<section class="pt-styles pt-top pk-bleed"><div class="pt-wrap"><div class="pt-sechead"><p class="pt-kicker" data-reveal>Cinq styles</p><h2 class="pt-h2" data-reveal>Cinq façons de laisser une trace.</h2></div><div class="pt-sbands">${styleBands()}</div></div></section>`),
  sec(`<section class="pt-levels pt-top pk-bleed"><div class="pt-wrap pt-lv-in"><div class="pt-sechead"><p class="pt-kicker" data-reveal>Parcours par niveau</p><h2 class="pt-h2" data-reveal>Quatre marches,<br>aucune pression.</h2><p class="pt-lead" data-reveal>On progresse à son rythme. Les passages de niveau se décident avec le professeur, jamais par un examen.</p><a class="pt-btn" href="/cours" data-reveal>Explorer les cours ${arrow}</a></div><ol class="pt-steps">${ladder()}</ol></div></section>`),
  sec(`<section class="pt-team pt-top pk-bleed"><div class="pt-wrap"><div class="pt-sechead pt-sechead--row"><div><p class="pt-kicker" data-reveal>L'équipe</p><h2 class="pt-h2" data-reveal>Six regards sur le mouvement.</h2></div><a class="pt-more" href="/professeurs" data-reveal>Tous les professeurs ${arrow}</a></div><div class="pt-pms">${profMini()}</div></div></section>`),
  sec(`<section class="pt-gala pt-top pk-bleed"><div class="pt-wrap pt-gala-in"><div><p class="pt-kicker" data-reveal>Fin de saison</p><h2 class="pt-h2" data-reveal>Les Saisons Dansées</h2><p class="pt-lead" data-reveal>Samedi 19 et dimanche 20 juin 2027, huit tableaux, soixante élèves sur scène. Tous les niveaux dansent, de l'éveil aux avancés.</p><a class="pt-btn pt-btn--light" href="/spectacles" data-reveal>Découvrir le spectacle ${arrow}</a></div><div class="pt-gala-art" aria-hidden="true">${chrono(["arab", "jete", "freeze"], 600, 300, 1.5, 6, "pt-gala-chrono")}</div></div></section>`),
  sec(`<section class="pt-cta pt-top pk-bleed"><div class="pt-wrap pt-cta-in"><h2 class="pt-h2" data-reveal>Un premier cours<br>pour essayer.</h2><div data-reveal><p class="pt-lead">Venez avec une tenue souple et des chaussettes : le reste se prête. Dites-nous le style qui vous tente, nous vous répondons sous deux jours ouvrés.</p><a class="pt-btn pt-btn--lg" href="/contact">Demander un cours d'essai ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

/* ---------- Cours ---------- */
const bandRows = (sty) => COURSES.filter((k) => k.sty === sty).map((k) => `<a class="pt-crow" href="/fiche-cours"><span class="pt-crow-n"><b>${esc(k.name)}</b>${pips(LV[k.lv].i)}</span><span>${esc(LV[k.lv].n)}</span><span>${esc(k.wd)} · ${esc(k.hours)}</span><span>${esc(PROFS[k.prof].name)} · ${esc(k.room)}</span><span class="pt-crow-go">dès le ${esc(k.short)} ${arrow}</span></a>`).join("");
const matrix = () => `<table class="pt-mx"><caption class="pt-sr">Premier cours de la saison selon le style et le niveau</caption><thead><tr><th scope="col">Style</th>${LEVELS.map(([, n]) => `<th scope="col">${n}</th>`).join("")}</tr></thead><tbody>${STYLES.map(([k, n]) => `<tr><th scope="row">${n}</th>${LEVELS.map(([lk, ln]) => { const f = COURSES.find((x) => x.sty === k && x.lv === lk); return `<td data-label="${ln}">${f ? `<span class="pt-mx-on">${esc(f.short)}</span>` : `<span class="pt-mx-off">—</span>`}</td>`; }).join("")}</tr>`).join("")}</tbody></table>`;
const cours = (c) => [
  sec(header(c)), pagehead("Saison 2026 – 2027", "Les cours,<br>jour après jour", "Une frise du 12 septembre au 12 mai : filtrez, ouvrez une fiche, demandez un essai.", "passe"),
  friseSec("Tous les cours sur une ligne", "Faites glisser la frise, ou choisissez un mois. Les filtres se combinent : par exemple, jazz et avancé."),
  ...STYLES.map(([k, n, p], i) => sec(`<section class="pt-band pt-top pt-band${i % 2} pk-bleed"><div class="pt-wrap pt-band-in"><div class="pt-band-h"><span class="pt-band-fig" aria-hidden="true">${fig(p)}</span><div><h2 class="pt-h2" data-reveal>${n}</h2><p class="pt-lead" data-reveal>${{ classique: "Une technique patiente, du port de bras aux pointes.", contemporain: "Du sol à l'envol, avec une vraie place pour la création.", jazz: "Précision, énergie, musicalité, jusqu'à la comédie musicale.", hiphop: "Des bases solides pour oser le freestyle.", africaines: "Des danses de joie, portées par les percussions." }[k]}</p></div></div><div class="pt-crows" data-reveal>${bandRows(k)}</div></div></section>`)),
  sec(`<section class="pt-matrix pt-top pk-bleed"><div class="pt-wrap"><div class="pt-sechead"><p class="pt-kicker" data-reveal>Carte des niveaux</p><h2 class="pt-h2" data-reveal>Où commencer ?</h2><p class="pt-lead" data-reveal>Date du premier cours pour chaque style et chaque niveau. Un tiret signale qu'aucun cours n'est ouvert cette saison.</p></div>${matrix()}</div></section>`),
  sec(`<section class="pt-how pt-top pk-bleed"><div class="pt-wrap"><h2 class="pt-h2" data-reveal>Comment venir essayer</h2><ol class="pt-how-l">${[["Choisir", "Repérez un cours sur la frise et ouvrez sa fiche."], ["Résumer", "Choisissez une séance d'essai : le récapitulatif se prépare tout seul."], ["Écrire", "Envoyez-le via le formulaire de contact, l'école vous répond."]].map(([t, x], i) => `<li data-reveal><b>0${i + 1}</b><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  sec(footer(c))];

/* ---------- Fiche cours ---------- */
const FK = COURSES.find((x) => x.id === "cont-int");
const ficheCours = (c) => [
  sec(header(c)),
  sec(`<section class="pt-fh pk-bleed"><div class="pt-wrap pt-fh-in"><div><p class="pt-kicker" data-reveal>Contemporain · Intermédiaire</p><div class="pt-h1" role="heading" aria-level="1" data-reveal>Contemporain<br>intermédiaire</div><p class="pt-lead" data-reveal>Un cours pour ceux qui connaissent déjà les bases et veulent composer leur propre mouvement : transferts de poids, spirales, travail au sol et phrases chorégraphiées.</p>
    <p class="pt-tags" data-reveal><span>${pips(3)} Niveau 3 sur 4</span><span>Mardi soir</span><span>Salle Paviot</span></p></div>
    <div class="pt-fh-art" aria-hidden="true">${chrono(["floor", "arab", "jete"], 560, 330, 1.7, 8, "pt-fh-chrono")}</div></div></section>`),
  sec(`<section class="pt-fbody pt-top pk-bleed"><div class="pt-wrap pt-fb-in"><div class="pt-fb-main">
    <h2 class="pt-h3" data-reveal>Le déroulé d'une séance</h2><ol class="pt-run">${[["0 – 20 min", "Échauffement au sol", "Respiration, colonne, roulés : le corps se met en route."], ["20 – 45 min", "Travail du centre", "Transferts de poids, spirales, équilibres déstabilisés."], ["45 – 75 min", "Traversées", "Déplacements dans l'espace, sauts, chutes contrôlées."], ["75 – 90 min", "Phrase chorégraphiée", "Une courte composition, reprise en petits groupes puis retour au calme."]].map(([t, n, x]) => `<li data-reveal><span class="pt-run-t">${t}</span><div><h3>${n}</h3><p>${x}</p></div></li>`).join("")}</ol>
    <h2 class="pt-h3" data-reveal>Une saison en trois temps</h2><div class="pt-tri">${[["Octobre – décembre", "Construire", "Reprise des bases du poids et du sol, premières phrases."], ["Janvier – mars", "Composer", "Improvisations guidées, écriture à deux et à trois."], ["Avril – juin", "Présenter", "Mise en scène d'un tableau pour Les Saisons Dansées."]].map(([t, n, x]) => `<article data-reveal><p class="pt-kicker">${t}</p><h3>${n}</h3><p>${x}</p></article>`).join("")}</div>
    <h2 class="pt-h3" data-reveal>Questions fréquentes</h2><div class="pt-faq">
      <details data-reveal><summary>Quelle tenue prévoir ?</summary><p>Un vêtement souple qui laisse voir les articulations, des chaussettes ou des demi-pointes. Les cheveux attachés.</p></details>
      <details data-reveal><summary>Faut-il avoir fait de la danse avant ?</summary><p>Une ou deux années de pratique sont conseillées. En cas de doute, le cours d'essai permet de voir avec la professeure.</p></details>
      <details data-reveal><summary>Peut-on changer de niveau en cours d'année ?</summary><p>Oui, sur avis de la professeure, à la fin d'un trimestre.</p></details></div></div>
    <aside class="pt-fb-side" aria-label="Informations pratiques"><div class="pt-ticket" data-reveal><p class="pt-kicker">Fiche pratique</p><dl><div><dt>Professeure</dt><dd>${esc(PROFS.ines.name)}</dd></div><div><dt>Horaires</dt><dd>${esc(`${FK.wd} · ${FK.hours}`)}</dd></div><div><dt>Salle</dt><dd>${FK.room}</dd></div><div><dt>Durée</dt><dd>${FK.dur}</dd></div><div><dt>Public</dt><dd>${FK.age}</dd></div><div><dt>Premier cours</dt><dd>${esc(FK.long)}</dd></div></dl>
    <a class="pt-btn pt-btn--block" href="/contact">Demander un cours d'essai ${arrow}</a><a class="pt-btn pt-btn--ghost pt-btn--block" href="/cours">Retour à la frise</a></div></aside></div></section>`),
  sec(`<section class="pt-slotsec pt-top pk-bleed"><div class="pt-wrap"><h2 class="pt-h3" data-reveal>Séances d'essai proposées</h2><table class="pt-tt"><caption class="pt-sr">Séances d'essai du cours Contemporain intermédiaire</caption><thead><tr><th scope="col">Séance</th><th scope="col">Horaire</th><th scope="col">Salle</th><th scope="col">Professeure</th></tr></thead><tbody>${FK.slots.map((s) => `<tr><th scope="row" data-label="Séance">${esc(s)}</th><td data-label="Horaire">${esc(FK.hours)}</td><td data-label="Salle">${FK.room}</td><td data-label="Professeure">${esc(PROFS.ines.name)}</td></tr>`).join("")}</tbody></table><p class="pt-note">Pour participer à une séance, écrivez via le formulaire de contact : aucune place n'est réservée sur cette page.</p></div></section>`),
  sec(footer(c))];

/* ---------- Professeurs ---------- */
const professeurs = (c) => [
  sec(header(c)), pagehead("L'équipe pédagogique", "Six professeurs,<br>six élans", "Des artistes en activité qui aiment transmettre.", "arab"),
  sec(`<section class="pt-profs pt-top pk-bleed"><div class="pt-wrap pt-profs-in">${Object.entries(PROFS).map(([k, p], i) => `<article class="pt-prof pt-prof${i % 3}" data-reveal><span class="pt-oval pt-oval--l">${fig(p.pose)}<svg class="pt-swoosh pt-oval-tr" viewBox="0 0 600 200" aria-hidden="true" focusable="false"><path class="pt-trail" d="M20 160C140 20 260 200 360 90S520 40 580 100"/></svg></span><div><p class="pt-kicker">${p.role}</p><h2 class="pt-h3">${p.name}</h2><p>${p.bio}</p><p class="pt-teach"><b>Enseigne :</b> ${p.teach}</p></div></article>`).join("")}</div></section>`),
  sec(`<section class="pt-method pt-top pk-bleed"><div class="pt-wrap pt-method-in"><h2 class="pt-h2" data-reveal>Notre façon<br>d'enseigner</h2><ul>${[["Un corps à la fois", "Les groupes restent petits : quinze élèves au plus par cours."], ["Corriger avec douceur", "On nomme ce qui fonctionne avant de pointer ce qui peut progresser."], ["Danser ensemble", "Chaque trimestre, un cours croise deux styles pour se surprendre."]].map(([t, x]) => `<li data-reveal><h3>${t}</h3><p>${x}</p></li>`).join("")}</ul></div></section>`),
  sec(footer(c))];

/* ---------- Spectacles ---------- */
const TABLEAUX = [["Prélude en pliés", "Éveil", "6 min", "plie"], ["Le Cygne qui hésite", "Classique", "9 min", "passe"], ["Sous la pluie des tambours", "Danses africaines", "8 min", "afric"], ["Chute libre", "Contemporain", "10 min", "floor"], ["Entracte", "Rafraîchissements dans le hall", "15 min", "petit"], ["Revue de nuit", "Jazz", "9 min", "jete"], ["Le Cercle", "Hip-hop", "8 min", "freeze"], ["Finale : Les Saisons Dansées", "Tous niveaux", "12 min", "arab"]];
const spectacles = (c) => [
  sec(header(c)),
  sec(`<section class="pt-affiche pk-bleed"><div class="pt-wrap pt-aff-in"><div><p class="pt-kicker" data-reveal>Spectacle de fin d'année · 2027</p><div class="pt-h1 pt-h1--xl" role="heading" aria-level="1" data-reveal>Les Saisons<br><em>Dansées</em></div><p class="pt-lead" data-reveal>Huit tableaux, quatre saisons et soixante élèves de 5 à 60 ans, du premier plié au grand jeté.</p>
    <dl class="pt-aff-dl" data-reveal><div><dt>Quand</dt><dd>Sam. 19 juin · 20 h<br>Dim. 20 juin · 16 h</dd></div><div><dt>Où</dt><dd>Théâtre du Pré-Vert<br>Nantes</dd></div><div><dt>Durée</dt><dd>1 h 20 avec entracte</dd></div></dl><a class="pt-btn pt-btn--light pt-btn--lg" href="/contact" data-reveal>Demander des places ${arrow}</a></div>
    <div class="pt-aff-art" aria-hidden="true">${chrono(["arab", "jete", "floor"], 600, 340, 1.7, 8, "pt-aff-chrono")}${swoosh("pt-aff-sw", "M0 150C120 0 200 190 320 80S500 20 600 90")}</div></div></section>`),
  sec(`<section class="pt-prog-sec pt-top pk-bleed"><div class="pt-wrap"><div class="pt-sechead"><p class="pt-kicker" data-reveal>Programme</p><h2 class="pt-h2" data-reveal>Huit tableaux</h2></div><ol class="pt-tabl">${TABLEAUX.map(([t, s, d, p], i) => `<li data-reveal><span class="pt-tn">0${i + 1}</span><span class="pt-tf">${fig(p)}</span><div><h3>${t}</h3><p>${s}</p></div><span class="pt-td">${d}</span></li>`).join("")}</ol></div></section>`),
  sec(`<section class="pt-rep pt-top pk-bleed"><div class="pt-wrap pt-rep-in"><div><h2 class="pt-h2" data-reveal>Avant le grand soir</h2><p class="pt-lead" data-reveal>Quatre rendez-vous pour préparer la scène. Ils concernent les élèves inscrits aux cours.</p></div><ul class="pt-dates">${[["8 mai", "Répétition en salle", "Salle Paviot"], ["29 mai", "Répétition costumes", "Studio Brique"], ["12 juin", "Filage au théâtre", "Théâtre du Pré-Vert"], ["18 juin", "Générale", "Théâtre du Pré-Vert"]].map(([d, t, l], i) => `<li data-reveal><b>${d}</b><span>${t}<small>${l}</small></span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="pt-infos pt-top pk-bleed"><div class="pt-wrap"><h2 class="pt-h3" data-reveal>Infos pratiques</h2><div class="pt-faq"><details data-reveal><summary>Comment obtenir des places ?</summary><p>Écrivez-nous via le formulaire de contact en précisant la date et le nombre de places. Cette démonstration n'enregistre aucune réservation.</p></details><details data-reveal><summary>Le théâtre est-il accessible ?</summary><p>Oui, des emplacements sont prévus pour les fauteuils roulants : indiquez-le simplement dans votre message.</p></details><details data-reveal><summary>Les enfants peuvent-ils assister au spectacle ?</summary><p>Bien sûr : le spectacle est tout public et l'entracte laisse le temps de se dégourdir les jambes.</p></details></div></div></section>`),
  sec(footer(c))];

/* ---------- Contact, recherche, 404 ---------- */
const contact = (c) => [sec(header(c)), pagehead("On vous répond sous deux jours", "Écrire à l'école", "Cours d'essai, inscriptions, spectacle ou simple question : tout passe par ici.", "plie"),
  sec(`<section class="pt-cinfo pt-top pk-bleed"><div class="pt-wrap pt-cinfo-in"><div data-reveal><h2 class="pt-h6">Adresse</h2><address>12 rue des Capucines<br>44000 Nantes</address></div><div data-reveal><h2 class="pt-h6">Secrétariat</h2><p>Mardi et jeudi, 16 h – 20 h<br>Samedi, 9 h – 12 h</p></div><div data-reveal><h2 class="pt-h6">Écrire</h2><p><a href="mailto:bonjour@pointe-danse.example">bonjour@pointe-danse.example</a></p></div><p class="pt-recapbox" data-recapbox data-reveal></p></div></section>`),
  { type: "form", heading: "Votre message", intro: "Indiquez le cours qui vous tente et vos disponibilités pour une séance d'essai." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une question ?", "Un cours, un professeur, un spectacle.", "passe"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un cours, un professeur…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="pt-404 pk-bleed"><div class="pt-wrap pt-404-in"><div><p class="pt-kicker">Faux pas</p><div class="pt-h1 pt-h1--xl" role="heading" aria-level="1">404</div><p class="pt-lead">Cette page n'existe pas ou a changé d'adresse. Reprenez la chorégraphie à l'accueil.</p><div class="pt-actions"><a class="pt-btn pt-btn--lg" href="/">Retour à l'accueil</a><a class="pt-btn pt-btn--ghost pt-btn--lg" href="/cours">Voir les cours</a></div></div><div class="pt-404-art" aria-hidden="true">${chrono(["arab", "floor"], 480, 300, 1.6, 6, "pt-404-chrono")}</div></div></section>`), sec(footer(c))];

module.exports = {
  key: "pointe", name: "Pointe", version: "2.0.0", category: "divertissement", tags: ["moderne", "editorial", "chaleureux"], siteType: "École de danse", featured: true,
  concept: "Une chronophotographie : des danseurs en traits fluides dont les traînées se dessinent, une barre latérale à libellés verticaux et une frise de saison filtrable par niveau et par style.",
  description: "École de danse : fond blanc-lilas, encre bleu nuit et magenta profond, séquence de poses du danseur, bandes courbes, frise de saison filtrable (niveau, style), fiches de cours, professeurs, spectacle de fin d'année.",
  brand: "École de danse Pointe", modules: ["formulaires", "recherche"],
  dna: { header: "barre-laterale-fine-a-libelles-verticaux-et-trait-de-progression", hero: "chronophotographie-de-poses-de-danseur-et-trainees-tracees", grid: "bandes-courbes-a-bords-elliptiques-et-frise-horizontale", motion: "trainees-qui-se-dessinent-et-poses-qui-s-enchainent", shapes: "silhouettes-en-traits-fluides-ovales-et-bandes-courbes", rhythm: "mouvement-en-sequences-et-bandes-lilas-et-nuit-alternees", signature: "frise-de-saison-filtrable-par-niveau-et-style-fiche-de-cours-et-essai-guide" },
  tokens: {
    colors: { primary: "#b3125f", secondary: "#1d1b4b", accent: "#ff7ab8", background: "#f3f0fa", surface: "#ffffff", text: "#1d1b4b", muted: "#57547f", success: "#1e7e5a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.tenor-sans", body: "font.epilogue", button: "font.epilogue", link: "font.epilogue" },
    radius: { sm: 8, md: 16, lg: 28, button: 999, field: 14, card: 28 }, shadow: { card: "0 18px 40px -22px rgba(29,27,75,.35)", button: "none" }, border: { width: 1, color: "#d9d2ee" },
    type: { h1: { size: 76, weight: 400, lineHeight: 1.02 }, h2: { size: 44, weight: 400, lineHeight: 1.08 } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent", type: "color", default: "#b3125f" },
    { key: "ink", label: "Encre bleu nuit", type: "color", default: "#1d1b4b" },
    { key: "trail", label: "Traînées de mouvement", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "ghosts", label: "Poses fantômes du héros", type: "choice", default: "on", choices: [["on", "Séquence complète"], ["off", "Dernière pose seule"]] },
    { key: "side", label: "Libellés de la barre latérale", type: "choice", default: "vertical", choices: [["vertical", "Verticaux"], ["flat", "Horizontaux"]] },
  ],
  menu: [["Accueil", "/"], ["Cours", "/cours"], ["Professeurs", "/professeurs"], ["Spectacles", "/spectacles"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "cours", name: "Cours", render: cours }, { key: "fiche-cours", name: "Fiche de cours", render: ficheCours },
    { key: "professeurs", name: "Professeurs", render: professeurs }, { key: "spectacles", name: "Spectacles de fin d'année", render: spectacles },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
