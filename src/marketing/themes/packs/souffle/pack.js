// Souffle — studio de yoga et de bien-être. Direction artistique : douceur aquarelle, formes fluides, lenteur. Brume lavande, pêche, eucalyptus clair ;
// cercle guide de respiration, barre d'application en bas sur mobile / pilule flottante centrée sur ordinateur, planning de la semaine en colonnes de jours.
const { sec, form, esc, nav } = require("../kit");

// ---------- illustrations (SVG en trait continu, sans dégradés référencés : les id sont retirés par le filtre) ----------
const FIG = {
  assis: `<svg class="so-fig" viewBox="0 0 200 170" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="38" r="16" fill="currentColor" opacity=".18"/><path d="M100 58c-17 4-24 32-21 52h42c3-20-4-48-21-52z" fill="currentColor" opacity=".12"/><path d="M84 70c-14 20-18 34-10 46M116 70c14 20 18 34 10 46"/><path d="M52 132c12-18 84-18 96 0-12 12-84 12-96 0z" fill="currentColor" opacity=".12"/><path d="M60 148c26 8 54 8 80 0" opacity=".5"/></g></svg>`,
  arbre: `<svg class="so-fig" viewBox="0 0 140 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="70" cy="34" r="13" fill="currentColor" opacity=".18"/><path d="M70 50v72"/><path d="M70 70c-26-8-30-38-2-60 28 22 24 52 2 60z" fill="currentColor" opacity=".12"/><path d="M70 122v66M70 126l30 24-30 4" /><path d="M40 190h60" opacity=".5"/></g></svg>`,
  enfant: `<svg class="so-fig" viewBox="0 0 220 130" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="46" cy="92" r="14" fill="currentColor" opacity=".18"/><path d="M60 84c30-30 90-30 116 4 8 10 14 18 30 18H60" fill="currentColor" opacity=".12"/><path d="M60 84c30-30 90-30 116 4"/><path d="M30 106c-12 4-20 10-24 18M30 98c-14-2-24 0-30 6" opacity=".6"/><path d="M20 118h190" opacity=".5"/></g></svg>`,
  guerrier: `<svg class="so-fig" viewBox="0 0 220 180" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="110" cy="30" r="13" fill="currentColor" opacity=".18"/><path d="M110 46v54"/><path d="M20 70h180"/><path d="M110 100 64 120v40M110 100l54 26 20 34" /><path d="M40 164h60M150 164h60" opacity=".5"/></g></svg>`,
  allonge: `<svg class="so-fig" viewBox="0 0 240 110" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="36" cy="60" r="13" fill="currentColor" opacity=".18"/><path d="M52 62c40-12 110-12 160 2 8 2 16 4 22 6-6 10-14 10-22 8-50-8-120-8-160 0z" fill="currentColor" opacity=".12"/><path d="M60 80c30 6 100 6 150 0" opacity=".5"/><path d="M92 36c4-12 14-16 24-12M126 30c8-10 20-10 28 0" opacity=".5"/></g></svg>`,
  lune: `<svg class="so-fig" viewBox="0 0 160 160" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M104 22a58 58 0 1 0 34 92 48 48 0 0 1-34-92z" fill="currentColor" opacity=".14"/><path d="M118 40l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" opacity=".7"/><path d="M42 122h0" opacity=".5"/></g></svg>`,
};
const leaf = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON = {
  home: `<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>`,
  lotus: `<path d="M12 20c-4 0-8-3-9-8 4 0 7 2 9 5 2-3 5-5 9-5-1 5-5 8-9 8zM12 17c-3-2-3-8 0-13 3 5 3 11 0 13z"/>`,
  cal: `<rect x="4" y="5" width="16" height="15" rx="4"/><path d="M8 3v4M16 3v4M4 10h16"/>`,
  tag: `<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>`,
  more: `<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>`,
};
const ico = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

// ---------- données ----------
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const LV = { debutant: "Débutant", inter: "Intermédiaire", avance: "Avancé", tous: "Tous niveaux" };
const TEACH = [
  { id: "ines", name: "Inès Marchetti", role: "Hatha & Yin", since: "14 ans de pratique", fig: "assis", bio: "Elle enseigne un yoga lent, attentif aux sensations, où l'on reste assez longtemps dans une posture pour la sentir se transformer." },
  { id: "malo", name: "Malo Duret", role: "Vinyasa & flow dynamique", since: "10 ans de pratique", fig: "guerrier", bio: "Danseur à l'origine, il relie les postures par le souffle et propose des enchaînements fluides, du plus doux au plus tonique." },
  { id: "aya", name: "Aya Benhamou", role: "Yoga nidra & méditation", since: "12 ans de pratique", fig: "lune", bio: "Elle guide la détente profonde et l'attention au présent, avec une voix calme et des consignes simples, allongé·e ou assis·e." },
  { id: "theo", name: "Théo Lacombe", role: "Mobilité du dos & respiration", since: "8 ans de pratique", fig: "arbre", bio: "Kinésithérapeute de formation, il adapte chaque posture au corps de chacun et met le souffle au cœur du mouvement." },
];
const COURSES = [
  { id: "hatha", name: "Hatha doux", lv: "debutant", min: 60, fig: "assis", tone: "lav", txt: "Postures simples tenues quelques respirations, pour s'étirer, se stabiliser et se poser. Le cours idéal pour commencer." },
  { id: "vinyasa", name: "Vinyasa fluide", lv: "inter", min: 75, fig: "guerrier", tone: "peach", txt: "Un enchaînement continu, calé sur le souffle. On chauffe doucement, on construit, puis on retombe en douceur." },
  { id: "flow", name: "Flow dynamique", lv: "avance", min: 75, fig: "arbre", tone: "euca", txt: "Équilibres, renforcement et transitions plus engagées pour celles et ceux qui connaissent déjà les bases." },
  { id: "yin", name: "Yin & étirements", lv: "tous", min: 75, fig: "enfant", tone: "lav", txt: "Peu de postures, très longtemps, au sol. On laisse les tissus profonds se relâcher et l'esprit ralentir." },
  { id: "nidra", name: "Yoga nidra", lv: "tous", min: 45, fig: "allonge", tone: "peach", txt: "Une relaxation guidée allongé·e, entre veille et sommeil. Aucune posture à réussir, seulement écouter." },
  { id: "souffle", name: "Respiration & méditation", lv: "tous", min: 30, fig: "lune", tone: "euca", txt: "Trente minutes pour apprendre quelques techniques de respiration et s'asseoir en silence, même si l'on n'a jamais médité." },
  { id: "dos", name: "Mobilité du dos", lv: "debutant", min: 60, fig: "arbre", tone: "euca", txt: "Un cours pensé pour les dos raides ou fatigués : mobiliser la colonne, ouvrir les épaules, respirer plus bas." },
];
const cx = (id) => COURSES.find((c) => c.id === id);
const tx = (id) => TEACH.find((t) => t.id === id);
// [jour, heure, cours, professeur]
const SLOTS = [
  [0, "08:00", "hatha", "ines"], [0, "12:30", "souffle", "aya"], [0, "19:00", "vinyasa", "malo"],
  [1, "07:30", "flow", "malo"], [1, "18:30", "yin", "ines"], [1, "20:00", "nidra", "aya"],
  [2, "09:30", "dos", "theo"], [2, "12:30", "hatha", "ines"], [2, "19:00", "vinyasa", "malo"],
  [3, "08:00", "souffle", "theo"], [3, "18:30", "hatha", "ines"], [3, "20:00", "yin", "aya"],
  [4, "07:30", "vinyasa", "malo"], [4, "12:30", "dos", "theo"], [4, "18:00", "nidra", "aya"],
  [5, "09:00", "flow", "malo"], [5, "10:45", "hatha", "ines"], [5, "17:00", "yin", "aya"],
  [6, "10:00", "nidra", "aya"], [6, "11:30", "souffle", "theo"],
];
const bucket = (m) => (m <= 45 ? "court" : m <= 60 ? "moyen" : "long");
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? String(m % 60).padStart(2, "0") : ""}` : `${m} min`);
const chip = (fk, fv, label, on) => `<a href="#${fk}-${fv}" class="so-chip${on ? " is-on" : ""}" role="button" aria-pressed="${on ? "true" : "false"}" data-fk="${fk}" data-fv="${fv}">${esc(label)}</a>`;
const fgroup = (label, fk, opts) => `<div class="so-fgroup" role="group" aria-label="${esc(label)}"><span class="so-flabel">${esc(label)}</span>${chip(fk, "all", "Tous", true)}${opts.map(([v, l]) => chip(fk, v, l, false)).join("")}</div>`;

// ---------- composants communs ----------
const header = (c) => {
  const m = c.menu.filter((x) => x.url !== "/contact");
  const main = ["/", "/cours", "/planning", "/tarifs"];
  const tab = [["Accueil", "/", "home"], ["Cours", "/cours", "lotus"], ["Planning", "/planning", "cal"], ["Tarifs", "/tarifs", "tag"]];
  const more = m.filter((x) => !main.includes(x.url));
  return `<header class="so-head pk-bleed">
  <div class="so-top"><a class="so-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="so-mark" aria-hidden="true"></span><b>Souffle</b></a></div>
  <div class="so-dock" role="navigation" aria-label="Navigation principale"><a class="so-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="so-mark" aria-hidden="true"></span><b>Souffle</b></a>${nav(m, "so-dl")}<a class="so-btn so-btn--sm" href="/contact">Nous écrire</a></div>
  <div class="so-tab" role="navigation" aria-label="Navigation de l'application">${tab.map(([l, u, i]) => `<a class="so-tl" href="${u}">${ico(i)}<span>${l}</span></a>`).join("")}
    <details class="so-more"><summary class="so-tl" aria-label="Plus de pages">${ico("more")}<span>Plus</span></summary><div class="so-sheet" role="navigation" aria-label="Autres pages">${nav(more, "so-sl")}<a class="so-sl" href="/contact">Contact</a><a class="so-sl" href="/recherche">Recherche</a></div></details></div>
  </header>`;
};
const footer = (c) => `<footer class="so-foot pk-bleed"><div class="so-wrap so-foot-in">
  <div><a class="so-logo so-logo--l" href="/"><span class="so-mark" aria-hidden="true"></span><b>Souffle</b></a><p class="so-foot-lead">Un studio pour ralentir, respirer, se retrouver.</p><address>12 rue des Tilleuls<br>44000 Nantes</address></div>
  <div><p class="so-h6">Pratiquer</p>${["Cours|/cours", "Planning|/planning", "Professeurs|/professeurs", "Tarifs|/tarifs"].map((s) => { const [l, u] = s.split("|"); return `<a class="so-fl" href="${u}">${l}</a>`; }).join("")}</div>
  <div><p class="so-h6">Découvrir</p>${["Ateliers & retraites|/ateliers", "Le journal|/blog", "Contact|/contact", "Recherche|/recherche"].map((s) => { const [l, u] = s.split("|"); return `<a class="so-fl" href="${u}">${l}</a>`; }).join("")}</div></div>
  <p class="so-legal so-wrap">© Souffle — site de démonstration. Studio, professeurs, horaires et tarifs fictifs.</p></footer>`;

const pagehead = (kicker, title, sub, fig = "assis", tone = "lav") => sec(`<section class="so-ph so-ph--${tone} pk-bleed"><div class="so-wrap so-ph-in"><div><p class="so-kicker" data-reveal>${esc(kicker)}</p><div class="so-h1" role="heading" aria-level="1" data-reveal>${title}</div><p class="so-lead" data-reveal>${esc(sub)}</p></div><div class="so-ph-art" aria-hidden="true"><i class="so-b so-b1"></i><i class="so-b so-b2"></i>${FIG[fig]}</div></div><div class="so-wavedn" aria-hidden="true"></div></section>`);

const secHead = (kicker, title, extra = "") => `<div class="so-sechead"><div><p class="so-kicker" data-reveal>${esc(kicker)}</p><h2 class="so-h2" data-reveal>${title}</h2></div>${extra}</div>`;

const courseCard = (k, i) => `<article class="so-cc so-tone-${k.tone}" data-reveal><div class="so-cc-art" aria-hidden="true"><i class="so-b so-b${(i % 3) + 1}"></i>${FIG[k.fig]}</div><h3 class="so-h3">${esc(k.name)}</h3><p class="so-meta"><span>${LV[k.lv]}</span><span>${hm(k.min)}</span></p><p>${esc(k.txt)}</p></article>`;

// Exercice de respiration guidée (composant signature n°2) — animé en transform/opacity par motion.js
const breather = (dark) => `<div class="so-breath${dark ? " so-breath--dark" : ""}" data-breath>
  <div class="so-breath-stage"><div class="so-orb-wrap"><i class="so-halo" aria-hidden="true"></i><div class="so-orb" role="img" aria-label="Cercle guide : il grandit pendant l'inspiration, reste stable pendant la rétention et rétrécit pendant l'expiration."><span class="so-orb-core"></span></div><div class="so-orb-txt"><b data-ph>Prêt·e ?</b><span data-cd aria-hidden="true">&nbsp;</span></div></div></div>
  <div class="so-breath-ctl"><p class="so-kicker">Respiration guidée</p><h2 class="so-h2">Une minute pour<br>vous poser.</h2>
    <p>Suivez le cercle : il grandit quand vous inspirez, rétrécit quand vous expirez. Sans animation (mouvement réduit), le texte et le décompte vous guident.</p>
    <div class="so-fgroup" role="group" aria-label="Rythme"><span class="so-flabel">Rythme</span><a href="#rythme-coherence" class="so-chip is-on" role="button" aria-pressed="true" data-bm="coherence">Cohérence 5-5</a><a href="#rythme-carre" class="so-chip" role="button" aria-pressed="false" data-bm="carre">Carré 4-4-4-4</a><a href="#rythme-478" class="so-chip" role="button" aria-pressed="false" data-bm="478">Apaisant 4-7-8</a></div>
    <div class="so-fgroup" role="group" aria-label="Durée"><span class="so-flabel">Durée</span><a href="#duree-1" class="so-chip is-on" role="button" aria-pressed="true" data-bd="1">1 min</a><a href="#duree-3" class="so-chip" role="button" aria-pressed="false" data-bd="3">3 min</a><a href="#duree-5" class="so-chip" role="button" aria-pressed="false" data-bd="5">5 min</a></div>
    <p><a class="so-btn" href="#demarrer" role="button" data-bgo>Commencer</a></p>
    <p class="so-small" data-cyc>Aucun cycle pour l'instant.</p><p class="so-sr" data-live aria-live="polite"></p>
    <p class="so-small">Exercice de détente simple, sans but médical. En cas de gêne, de vertige ou de grossesse avancée, respirez normalement et arrêtez.</p></div></div>`;

const cta = (t = "Une première séance ?", s = "Écrivez-nous, nous vous aidons à choisir le cours qui vous convient.") => sec(`<section class="so-cta pk-bleed"><div class="so-wrap so-cta-in"><i class="so-b so-b1" aria-hidden="true"></i><h2 class="so-h2" data-reveal>${t}</h2><p class="so-lead" data-reveal>${s}</p><a class="so-btn so-btn--lg" href="/contact" data-reveal>Nous écrire ${arrow}</a></div></section>`);

// ---------- planning ----------
const slotItem = ([d, h, cid, tid]) => {
  const k = cx(cid), t = tx(tid);
  const sum = `Demande de cours — ${k.name}, ${DAYS[d].toLowerCase()} à ${h.replace(":", " h ")} (${hm(k.min)}, ${LV[k.lv].toLowerCase()}), avec ${t.name}.`;
  return `<li class="so-item so-slot so-tone-${k.tone}" data-niveau="${k.lv} tous-niv" data-duree="${bucket(k.min)}" data-prof="${t.id}"><a class="so-slotlink" href="#choisir" role="button" aria-pressed="false" data-pick data-title="${esc(k.name)} · ${DAYS[d]} ${h.replace(":", " h ")}" data-detail="${esc(`${hm(k.min)} · ${LV[k.lv]} · avec ${t.name}`)}" data-msg="${esc(sum)}"><time>${h.replace(":", " h ")}</time><b>${esc(k.name)}</b><span>${hm(k.min)} · ${esc(t.name.split(" ")[0])}</span><em>${LV[k.lv]}</em></a></li>`;
};
const week = () => `<div class="so-week">${DAYS.map((nm, d) => `<section class="so-day" data-jour="${d}"><h3 class="so-dayh"><span>${nm}</span><i>${SLOTS.filter((s) => s[0] === d).length} cours</i></h3><ul class="so-slots">${SLOTS.filter((s) => s[0] === d).map(slotItem).join("")}</ul><p class="so-empty">Aucun cours avec ces filtres.</p></section>`).join("")}</div>`;
const planFilters = () => `<div class="so-filters">${fgroup("Jour", "jour", DAYS.map((n, i) => [String(i), n.slice(0, 3) + "."]))}${fgroup("Niveau", "niveau", [["debutant", "Débutant"], ["inter", "Intermédiaire"], ["avance", "Avancé"]])}${fgroup("Durée", "duree", [["court", "Moins de 45 min"], ["moyen", "60 min"], ["long", "75 min et plus"]])}${fgroup("Professeur", "prof", TEACH.map((t) => [t.id, t.name.split(" ")[0]]))}</div>`;
const summary = () => `<aside class="so-sum" data-sum aria-label="Résumé de votre demande"><p class="so-sum-empty">Touchez un cours de la semaine pour préparer votre demande.</p><div class="so-sum-body" hidden><p class="so-kicker">Votre demande</p><h3 class="so-h3" data-s="title"></h3><p data-s="detail" class="so-meta"></p><p class="so-sum-msg" data-s="msg"></p><a class="so-btn" href="/contact" data-s="go">Envoyer ma demande ${arrow}</a><p class="so-small" data-s="note">Aucune place n'est réservée ici : le résumé est copié, collez-le dans le formulaire de contact. Nous vous répondons pour confirmer.</p></div></aside>`;

// ---------- pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="so-hero pk-bleed"><i class="so-wash so-wash1" aria-hidden="true"></i><i class="so-wash so-wash2" aria-hidden="true"></i>
    <div class="so-wrap so-hero-in"><div class="so-hero-copy"><p class="so-kicker" data-reveal>Studio de yoga · Nantes</p>
      <div class="so-h1 so-h1--xl" role="heading" aria-level="1" data-reveal>Reprenez<br>votre <em>souffle</em>.</div>
      <p class="so-lead" data-reveal>Du yoga lent, des respirations guidées et un lieu où le temps s'étire. Sept cours différents, quatre professeurs, tous les niveaux.</p>
      <div class="so-actions" data-reveal><a class="so-btn so-btn--lg" href="/planning">Voir le planning ${arrow}</a><a class="so-btn so-btn--ghost so-btn--lg" href="/cours">Découvrir les cours</a></div></div>
    <div class="so-hero-orb" aria-hidden="true" data-reveal><i class="so-ring so-ring3"></i><i class="so-ring so-ring2"></i><i class="so-ring so-ring1"></i><div class="so-hcore"><span data-hero-lbl>Respirez</span></div><i class="so-pebble so-pb1"></i><i class="so-pebble so-pb2"></i><i class="so-pebble so-pb3"></i></div></div>
    <div class="so-wavedn" aria-hidden="true"></div></section>`),
  sec(`<section class="so-three pk-bleed"><div class="so-wrap"><ul class="so-three-in">
    <li data-reveal><span class="so-tn">01</span><h2 class="so-h3">Lenteur</h2><p>Chaque posture est tenue assez longtemps pour être habitée. Ici, personne ne court après la performance.</p></li>
    <li data-reveal><span class="so-tn">02</span><h2 class="so-h3">Souffle</h2><p>La respiration conduit chaque cours. On apprend à la sentir, à la ralentir, puis à l'emporter avec soi.</p></li>
    <li data-reveal><span class="so-tn">03</span><h2 class="so-h3">Présence</h2><p>Petits groupes, consignes claires, ajustements possibles : chacun·e avance à son rythme, avec ses limites.</p></li></ul></div></section>`),
  sec(`<section class="so-breath-sec pk-bleed"><div class="so-wrap">${breather(true)}</div></section>`),
  sec(`<section class="so-courses pk-bleed"><div class="so-wrap">${secHead("Les cours", "Pour chaque<br>état du corps.", `<a class="so-more-link" href="/cours">Tous les cours ${arrow}</a>`)}<div class="so-cc-grid">${COURSES.slice(0, 3).map(courseCard).join("")}</div></div></section>`),
  sec(`<section class="so-mini pk-bleed"><div class="so-wrap">${secHead("La semaine", "Une semaine<br>qui respire.", `<a class="so-more-link" href="/planning">Planning complet ${arrow}</a>`)}
    <ol class="so-mini-week">${DAYS.map((n, d) => `<li class="so-mini-day" data-reveal><b>${n.slice(0, 3)}.</b><ul>${SLOTS.filter((s) => s[0] === d).map((s) => `<li><time>${s[1].replace(":", " h ")}</time>${esc(cx(s[2]).name)}</li>`).join("")}</ul></li>`).join("")}</ol></div></section>`),
  sec(`<section class="so-team pk-bleed"><div class="so-wrap">${secHead("L'équipe", "Quatre voix,<br>une même douceur.", `<a class="so-more-link" href="/professeurs">Rencontrer l'équipe ${arrow}</a>`)}<ul class="so-team-row">${TEACH.map((t, i) => `<li class="so-tm so-tm${i}" data-reveal><div class="so-tm-art" aria-hidden="true"><i class="so-b so-b${(i % 3) + 1}"></i>${FIG[t.fig]}</div><h3 class="so-h3">${esc(t.name)}</h3><p>${esc(t.role)}</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="so-retreat pk-bleed"><div class="so-wavetop" aria-hidden="true"></div><div class="so-wrap so-retreat-in"><div data-reveal><p class="so-kicker">Ateliers & retraites</p><h2 class="so-h2">Trois jours<br>au bord de l'eau.</h2><p class="so-lead">Une retraite de printemps pour marcher, pratiquer deux fois par jour et ne rien devoir à personne. Programme et conditions à découvrir.</p><a class="so-btn" href="/ateliers">Voir les rendez-vous ${arrow}</a></div>
    <div class="so-retreat-art" aria-hidden="true"><i class="so-b so-b1"></i><i class="so-b so-b3"></i>${FIG.arbre}</div></div></section>`),
  sec(`<section class="so-faq pk-bleed"><div class="so-wrap so-faq-in"><div><p class="so-kicker" data-reveal>Avant de venir</p><h2 class="so-h2" data-reveal>Vos premières<br>questions.</h2></div><div>
    <details class="so-det" data-reveal><summary>Je n'ai jamais fait de yoga, est-ce pour moi ?</summary><p>Oui. Les cours « Hatha doux » et « Mobilité du dos » sont conçus pour démarrer. Prévenez le professeur de vos douleurs ou de vos limites en arrivant.</p></details>
    <details class="so-det" data-reveal><summary>Que dois-je apporter ?</summary><p>Une tenue souple et confortable. Tapis, briques, sangles et couvertures sont à disposition au studio.</p></details>
    <details class="so-det" data-reveal><summary>Combien de temps avant le cours dois-je arriver ?</summary><p>Une dizaine de minutes avant, pour vous installer au calme. Le cours commence à l'heure indiquée.</p></details></div></div></section>`),
  cta(),
  sec(footer(c)),
];

const cours = (c) => [sec(header(c)), pagehead("Sept façons de pratiquer", "Les cours", "Du plus doux au plus tonique : trouvez celui qui répond à ce que votre corps demande aujourd'hui.", "enfant", "peach"),
  sec(`<section class="so-zig pk-bleed"><div class="so-wrap">${COURSES.map((k, i) => `<article class="so-zrow${i % 2 ? " is-rev" : ""}" data-reveal><div class="so-zart so-tone-${k.tone}" aria-hidden="true"><i class="so-b so-b${(i % 3) + 1}"></i>${FIG[k.fig]}</div><div class="so-ztxt"><p class="so-meta"><span>${LV[k.lv]}</span><span>${hm(k.min)}</span></p><h2 class="so-h2">${esc(k.name)}</h2><p>${esc(k.txt)}</p><p class="so-small">Professeur·e·s : ${[...new Set(SLOTS.filter((s) => s[2] === k.id).map((s) => tx(s[3]).name.split(" ")[0]))].join(", ")} · ${SLOTS.filter((s) => s[2] === k.id).length} créneaux par semaine</p><a class="so-more-link" href="/planning">Voir les horaires ${arrow}</a></div></article>`).join("")}</div></section>`),
  sec(`<section class="so-breath-sec pk-bleed"><div class="so-wrap">${breather(false)}</div></section>`),
  cta(), sec(footer(c))];

const planning = (c) => [sec(header(c)), pagehead("Semaine type · mise à jour chaque trimestre", "Le planning", "Filtrez par jour, niveau, durée ou professeur, choisissez un cours : nous préparons votre demande pour le formulaire de contact.", "guerrier", "lav"),
  sec(`<section class="so-plan pk-bleed" data-so-filter data-one="cours affiché" data-many="cours affichés"><div class="so-wrap">${planFilters()}<p class="so-count" data-out aria-live="polite"></p>${week()}${summary()}</div></section>`),
  sec(`<section class="so-note pk-bleed"><div class="so-wrap"><p class="so-small">Horaires de démonstration. Les places sont limitées à 14 personnes par cours ; la confirmation d'une demande se fait par retour de message.</p></div></section>`),
  sec(footer(c))];

const professeurs = (c) => [sec(header(c)), pagehead("L'équipe", "Les professeurs", "Quatre personnes qui enseignent comme elles pratiquent : sans bruit, avec attention.", "arbre", "euca"),
  sec(`<section class="so-prof pk-bleed"><div class="so-wrap">${TEACH.map((t, i) => `<article class="so-pr so-pr${i}" data-reveal><div class="so-pr-art" aria-hidden="true"><i class="so-b so-b${(i % 3) + 1}"></i>${FIG[t.fig]}</div><div class="so-pr-txt"><p class="so-kicker">${esc(t.role)}</p><h2 class="so-h2">${esc(t.name)}</h2><p>${esc(t.bio)}</p><p class="so-meta"><span>${esc(t.since)}</span><span>${SLOTS.filter((s) => s[3] === t.id).length} cours / semaine</span></p><p class="so-small">Enseigne : ${[...new Set(SLOTS.filter((s) => s[3] === t.id).map((s) => cx(s[2]).name))].join(", ")}.</p></div></article>`).join("")}</div></section>`),
  cta("Une question avant de choisir ?", "Dites-nous vos envies ou vos douleurs : nous vous orientons vers la bonne personne."), sec(footer(c))];

const FORM = [
  { id: "unite", name: "Cours à l'unité", price: 18, n: 1, per: "18 € le cours", pts: ["Sans engagement", "Valable 1 mois", "Idéal pour essayer"] },
  { id: "carnet", name: "Carnet de 10 cours", price: 150, n: 10, per: "15 € le cours", pts: ["10 cours à utiliser librement", "Valable 6 mois", "Partageable entre proches"] },
  { id: "mensuel", name: "Mensuel 2 par semaine", price: 79, n: 8, per: "environ 10 € le cours", pts: ["Jusqu'à 2 cours par semaine", "Engagement 3 mois", "Un atelier offert par trimestre"], hot: true },
  { id: "libre", name: "Souffle libre", price: 109, n: 16, per: "à partir de 7 € le cours", pts: ["Cours illimités", "Engagement 3 mois", "−20 % sur les retraites"] },
];
const tarifs = (c) => [sec(header(c)), pagehead("Formules", "Tarifs & formules", "Des formules souples, du premier essai à la pratique régulière. Tarifs indicatifs de démonstration, aucun paiement n'est pris en ligne.", "assis", "peach"),
  sec(`<section class="so-pick pk-bleed" data-pick-box><div class="so-wrap"><p class="so-kicker" data-reveal>Trouvez votre rythme</p><h2 class="so-h2" data-reveal>Combien de fois par semaine<br>pensez-vous venir ?</h2>
    <div class="so-fgroup" role="group" aria-label="Fréquence de pratique"><a href="#rythme-0" class="so-chip" role="button" aria-pressed="false" data-rhythm="0">De temps en temps</a><a href="#rythme-1" class="so-chip" role="button" aria-pressed="false" data-rhythm="1">1 fois</a><a href="#rythme-2" class="so-chip" role="button" aria-pressed="false" data-rhythm="2">2 fois</a><a href="#rythme-3" class="so-chip" role="button" aria-pressed="false" data-rhythm="3">3 fois ou plus</a></div>
    <p class="so-pick-out" aria-live="polite" data-pick-out>Choisissez un rythme : nous mettons en avant la formule la plus adaptée.</p>
    <div class="so-forms">${FORM.map((f) => `<article class="so-form${f.hot ? " is-hot" : ""}" data-formule="${f.id}" data-reveal>${f.hot ? `<span class="so-flag">Notre préférée</span>` : ""}<h3 class="so-h3">${esc(f.name)}</h3><p class="so-price">${f.price} €<small>${f.id === "mensuel" || f.id === "libre" ? " / mois" : f.id === "carnet" ? " les 10" : ""}</small></p><p class="so-small">${f.per}</p><ul>${f.pts.map((p) => `<li>${leaf}${esc(p)}</li>`).join("")}</ul><a class="so-btn so-btn--ghost so-btn--block" href="/contact">Poser une question</a></article>`).join("")}</div></div></section>`),
  sec(`<section class="so-cmp pk-bleed"><div class="so-wrap"><h2 class="so-h2" data-reveal>En un coup d'œil</h2><table class="so-table" data-reveal><caption class="so-sr">Comparatif des formules</caption><thead><tr><th>Formule</th><th>Cours</th><th>Validité</th><th>Prix indicatif</th></tr></thead><tbody>
    <tr><td data-l="Formule">À l'unité</td><td data-l="Cours">1</td><td data-l="Validité">1 mois</td><td data-l="Prix">18 €</td></tr><tr><td data-l="Formule">Carnet</td><td data-l="Cours">10</td><td data-l="Validité">6 mois</td><td data-l="Prix">150 €</td></tr><tr><td data-l="Formule">Mensuel</td><td data-l="Cours">2 / semaine</td><td data-l="Validité">3 mois</td><td data-l="Prix">79 € / mois</td></tr><tr><td data-l="Formule">Souffle libre</td><td data-l="Cours">illimités</td><td data-l="Validité">3 mois</td><td data-l="Prix">109 € / mois</td></tr></tbody></table>
    <p class="so-small">Tarif réduit étudiants, demandeurs d'emploi et seniors : parlons-en via le formulaire de contact.</p></div></section>`),
  cta("Un doute sur la formule ?", "Écrivez-nous votre rythme et vos envies, nous vous conseillons sans engagement."), sec(footer(c))];

const EVT = [
  { type: "atelier", d: "15", m: "Fév.", t: "Atelier respiration & voix", p: "Aya Benhamou", dur: "2 h 30", txt: "Découvrir comment la voix, le chant doux et le souffle se répondent. Aucune expérience de chant requise." },
  { type: "atelier", d: "08", m: "Mars", t: "Atelier mobilité des épaules", p: "Théo Lacombe", dur: "2 h", txt: "Comprendre ses tensions de nuque et d'épaules et repartir avec une petite routine à faire chez soi." },
  { type: "retraite", d: "09", m: "Mai", t: "Retraite de printemps, 3 jours", p: "Inès Marchetti & Malo Duret", dur: "Vendredi au dimanche", txt: "Deux pratiques par jour, marches lentes, repas végétariens partagés, silence le matin. Lieu en bord de Loire, hébergement à préciser." },
  { type: "atelier", d: "21", m: "Juin", t: "Yoga nidra de la nuit la plus courte", p: "Aya Benhamou", dur: "1 h 30", txt: "Une relaxation guidée au crépuscule, allongé·e dans la salle éclairée à la bougie électrique." },
  { type: "retraite", d: "12", m: "Sept.", t: "Retraite de rentrée, week-end", p: "Malo Duret", dur: "Samedi et dimanche", txt: "Un week-end dynamique pour reprendre en douceur après l'été : flow le matin, yin le soir, détente entre les deux." },
];
const ateliers = (c) => [sec(header(c)), pagehead("Rendez-vous de l'année", "Ateliers & retraites", "Des moments plus longs pour approfondir : un atelier de quelques heures ou une retraite de quelques jours.", "lune", "euca"),
  sec(`<section class="so-evt pk-bleed" data-so-filter data-one="rendez-vous" data-many="rendez-vous"><div class="so-wrap"><div class="so-filters">${fgroup("Type", "type", [["atelier", "Ateliers"], ["retraite", "Retraites"]])}</div><p class="so-count" data-out aria-live="polite"></p>
    <ol class="so-evt-list">${EVT.map((e) => `<li class="so-item so-evrow so-ev--${e.type}" data-type="${e.type}" data-reveal><div class="so-date" aria-hidden="true"><b>${e.d}</b><span>${e.m}</span></div><div class="so-ev-txt"><p class="so-meta"><span>${e.type === "retraite" ? "Retraite" : "Atelier"}</span><span>${e.dur}</span></p><h3 class="so-h3">${esc(e.t)}</h3><p>${esc(e.txt)}</p><p class="so-small">Avec ${esc(e.p)} · dates et conditions indicatives (démonstration)</p></div><a class="so-btn so-btn--ghost so-btn--sm" href="/contact">En savoir plus</a></li>`).join("")}</ol></div></section>`),
  sec(`<section class="so-retreat so-retreat--page pk-bleed"><div class="so-wavetop" aria-hidden="true"></div><div class="so-wrap so-retreat-in"><div data-reveal><p class="so-kicker">Une retraite, concrètement</p><h2 class="so-h2">Une journée type.</h2><ol class="so-day-list"><li><time>7 h 30</time>Pratique douce du matin, en silence</li><li><time>9 h 00</time>Petit-déjeuner partagé</li><li><time>11 h 00</time>Marche lente au bord de l'eau</li><li><time>16 h 30</time>Yoga fluide et respiration</li><li><time>20 h 30</time>Yoga nidra avant la nuit</li></ol></div><div class="so-retreat-art" aria-hidden="true"><i class="so-b so-b2"></i><i class="so-b so-b1"></i>${FIG.assis}</div></div></section>`),
  cta("Une retraite vous tente ?", "Écrivez-nous : nous vous envoyons le programme détaillé dès qu'il est arrêté."), sec(footer(c))];

const POSTS = [
  { cat: "souffle", t: "Pourquoi expirer plus longtemps calme le corps", d: "12 oct.", min: 4, x: "Quand l'expiration est plus longue que l'inspiration, le rythme cardiaque ralentit légèrement. C'est pourquoi tant d'exercices de détente commencent par allonger la sortie du souffle. Essayez : inspirez sur quatre temps, expirez sur six, pendant deux minutes." },
  { cat: "pratique", t: "Premier cours : dix gestes qui rassurent", d: "28 sept.", min: 5, x: "Arrivez dix minutes en avance, signalez vos douleurs, choisissez une place près d'un mur, gardez les genoux souples. Et rappelez-vous : personne ne regarde votre posture, tout le monde cherche la sienne." },
  { cat: "sommeil", t: "Un petit rituel pour mieux s'endormir", d: "9 sept.", min: 3, x: "Éteignez les écrans une demi-heure avant le coucher, allongez-vous jambes surélevées contre un mur pendant cinq minutes, puis pratiquez une respiration lente. Le but n'est pas de dormir tout de suite, mais de baisser le volume." },
  { cat: "pratique", t: "Yin ou vinyasa : lequel choisir ?", d: "21 août", min: 4, x: "Le vinyasa réchauffe et dynamise ; le yin ralentit et étire en profondeur. Beaucoup de pratiquants alternent selon leur énergie du jour : tonique le matin, yin le soir." },
  { cat: "souffle", t: "Méditer cinq minutes, vraiment", d: "3 août", min: 3, x: "Asseyez-vous, posez l'attention sur la sensation du souffle aux narines, et ramenez-la chaque fois qu'elle s'échappe. Ce retour, répété, est déjà la méditation." },
];
const blog = (c) => [sec(header(c)), pagehead("Le journal du studio", "Journal", "Quelques lignes sur la respiration, la pratique et le repos. Textes d'exemple pour la démonstration.", "allonge", "lav"),
  sec(`<section class="so-blog pk-bleed" data-so-filter data-one="article" data-many="articles"><div class="so-wrap"><div class="so-filters">${fgroup("Thème", "cat", [["souffle", "Souffle"], ["pratique", "Pratique"], ["sommeil", "Sommeil"]])}</div><p class="so-count" data-out aria-live="polite"></p>
    <div class="so-posts">${POSTS.map((p, i) => `<article class="so-item so-post${i === 0 ? " is-feat" : ""}" data-cat="${p.cat}" data-reveal><div class="so-post-art" aria-hidden="true"><i class="so-b so-b${(i % 3) + 1}"></i>${FIG[["lune", "assis", "allonge", "enfant", "arbre"][i]]}</div><p class="so-meta"><span>${p.cat[0].toUpperCase() + p.cat.slice(1)}</span><time>${p.d}</time><span>${p.min} min de lecture</span></p><h2 class="so-h3 so-post-t">${esc(p.t)}</h2><details class="so-det so-det--post"><summary>Lire l'extrait</summary><p>${esc(p.x)}</p></details></article>`).join("")}</div></div></section>`),
  cta("Une question sur la pratique ?", "Écrivez-nous, un professeur vous répond."), sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Parlons-en", "Contact", "Une question, une demande de cours ou d'atelier ? Écrivez-nous, nous répondons sous deux jours ouvrés.", "assis", "peach"),
  { type: "form", heading: "Écrire au studio", intro: "Indiquez le cours ou la formule qui vous intéresse (vous pouvez coller ici le résumé préparé depuis le planning)." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une envie ?", "Un cours, un professeur, un article.", "lune", "lav"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="so-ph so-ph--lav so-404 pk-bleed"><div class="so-wrap"><p class="so-kicker">Erreur 404</p><div class="so-h1 so-h1--xl" role="heading" aria-level="1">Respirez,<br>cette page s'est <em>égarée</em>.</div><p class="so-lead">Elle n'existe pas ou a changé d'adresse. Revenons doucement à l'accueil.</p><a class="so-btn so-btn--lg" href="/">Retour à l'accueil ${arrow}</a></div><div class="so-wavedn" aria-hidden="true"></div></section>`), sec(footer(c))];

module.exports = {
  key: "souffle", name: "Souffle", version: "2.0.0", category: "beaute", tags: ["naturel", "chaleureux", "minimaliste"], siteType: "Studio de yoga et de bien-être", featured: true,
  concept: "Un studio qui respire : un cercle guide de respiration, un planning de la semaine en colonnes de jours et des formes douces façon aquarelle.",
  description: "Studio de yoga et de bien-être : brume lavande, pêche et eucalyptus, cercle guide de respiration, barre d'application en bas sur mobile, planning hebdomadaire filtrable, ateliers, retraites et journal.",
  brand: "Souffle — studio de yoga", modules: ["formulaires", "recherche"],
  dna: { header: "pilule-flottante-centree-et-barre-d-application-basse", hero: "cercle-guide-de-respiration-et-lavis-aquarelle", grid: "planning-hebdomadaire-en-colonnes-de-jours", motion: "respiration-lente-et-halos-qui-derivent", shapes: "blobs-vagues-et-lavis-aquarelle", rhythm: "lent-par-vagues-de-couleur", signature: "planning-filtrable-et-respiration-guidee-par-cercle" },
  tokens: {
    colors: { primary: "#5b5a8f", secondary: "#3f6b5c", accent: "#f0a98a", background: "#fbf4ef", surface: "#fffaf6", text: "#2e2a4a", muted: "#625f7a", success: "#2f7a5a", warning: "#8a5a00", error: "#b3362e" },
    fonts: { heading: "font.cormorant-infant", body: "font.manrope", button: "font.manrope", link: "font.manrope" },
    radius: { sm: 14, md: 24, lg: 40, button: 999, field: 20, card: 32 }, shadow: { card: "0 18px 50px -24px rgba(91,90,143,.35)", button: "0 10px 28px -12px rgba(91,90,143,.5)" }, border: { width: 1, color: "#e0d8ea" },
    type: { h1: { size: 76, weight: 500, lineHeight: 1.02 }, h2: { size: 46, weight: 500, lineHeight: 1.1 } },
  },
  options: [
    { key: "accent", label: "Couleur douce (pêche)", type: "color", default: "#f0a98a" },
    { key: "dusk", label: "Violet du soir", type: "color", default: "#5b5a8f" },
    { key: "formes", label: "Formes", type: "choice", default: "fluides", choices: [["fluides", "Fluides (blobs)"], ["rondes", "Rondes (galets réguliers)"]] },
    { key: "halos", label: "Halos qui dérivent", type: "choice", default: "on", choices: [["on", "Animés"], ["off", "Fixes"]] },
    { key: "pause", label: "Vitesse de respiration du cercle", type: "range", default: 9, min: 6, max: 14, step: 1 },
  ],
  menu: [["Accueil", "/"], ["Cours", "/cours"], ["Planning", "/planning"], ["Professeurs", "/professeurs"], ["Tarifs", "/tarifs"], ["Ateliers", "/ateliers"], ["Blog", "/blog"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "cours", name: "Cours", render: cours }, { key: "planning", name: "Planning", render: planning },
    { key: "professeurs", name: "Professeurs", render: professeurs }, { key: "tarifs", name: "Tarifs & formules", render: tarifs }, { key: "ateliers", name: "Ateliers & retraites", render: ateliers },
    { key: "blog", name: "Journal", render: blog }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
