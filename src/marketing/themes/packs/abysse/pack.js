// Abysse — club de plongée. Direction artistique : une descente. Le fond de page est un seul dégradé vertical (turquoise de surface, bleu profond, noir-bleu) ;
// faisceaux de lumière en opacités empilées, bulles qui montent, poissons, tortue et raie dessinés en SVG ; navigation = jauge de profondeur fixe à droite (0 m, 8 m, 18 m…) ;
// grille en paliers qui s'enfoncent ; composants : niveaux de formation (frise cliquable) et sorties programmées (filtres + récapitulatif vers /contact). Rien n'est réservé : la demande part vers le formulaire.
const { sec, esc, nav } = require("../kit");

// ---------- dessins SVG (aplats et opacités : les dégradés SVG sont filtrés) ----------
const fish = (a = "#ffb347", b = "#ff7a3d", cls = "ab-fish") => `<svg class="${cls}" viewBox="0 0 80 40" aria-hidden="true"><path d="M60 20 79 7 74 20 79 33Z" fill="${b}"/><path d="M26 10Q36 0 47 10Z" fill="${b}"/><path d="M5 20C18 3 48 3 63 20 48 37 18 37 5 20Z" fill="${a}"/><path d="M30 8c6 8 6 16 0 24 8 0 12-8 12-12S38 8 30 8Z" fill="#fff" opacity=".25"/><path d="M8 24C22 33 46 33 60 22 48 38 20 38 8 24Z" fill="#fff" opacity=".18"/><circle cx="17" cy="17" r="2.6" fill="#021428"/><circle cx="16.3" cy="16.3" r=".9" fill="#fff"/></svg>`;
const school = (cls, col = "#9fe7ee") => {
  const p = [[10, 30, 1], [44, 10, .9], [48, 46, 1.05], [86, 28, 1], [118, 8, .8], [122, 50, .95], [156, 30, .9], [190, 20, .8], [188, 52, .85]];
  return `<svg class="${cls}" viewBox="0 0 240 90" aria-hidden="true">${p.map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 8C8 -3 22 -3 30 8 22 19 8 19 0 8Z" fill="${col}"/><path d="M29 8 38 2V14Z" fill="${col}" opacity=".8"/><circle cx="6" cy="6" r="1.4" fill="#021428"/></g>`).join("")}</svg>`;
};
const turtle = (cls = "ab-turtle") => `<svg class="${cls}" viewBox="0 0 170 112" aria-hidden="true"><ellipse cx="40" cy="86" rx="17" ry="6" transform="rotate(32 40 86)" fill="#7fbf8a"/><ellipse cx="40" cy="24" rx="17" ry="6" transform="rotate(-32 40 24)" fill="#7fbf8a"/><path d="M26 53 5 57 26 61Z" fill="#7fbf8a"/><ellipse cx="96" cy="101" rx="38" ry="7" transform="rotate(28 96 101)" fill="#9bd7a3"/><ellipse cx="96" cy="9" rx="38" ry="7" transform="rotate(-28 96 9)" fill="#9bd7a3"/><path d="M110 44 140 46 140 66 110 66Z" fill="#8fcf9a"/><ellipse cx="146" cy="55" rx="19" ry="12" fill="#a9dfb0"/><circle cx="152" cy="51" r="2.6" fill="#05232a"/><path d="M142 61q8 4 16 0" stroke="#05232a" stroke-width="1.6" fill="none" opacity=".5"/><ellipse cx="74" cy="55" rx="50" ry="35" fill="#3e7f5c"/><ellipse cx="74" cy="55" rx="50" ry="35" fill="none" stroke="#c9f0cf" stroke-width="2.4" opacity=".55"/><path d="M62 55 72 41H88L98 55 88 69H72Z" fill="#2c6246" stroke="#c9f0cf" stroke-width="1.6" opacity=".95"/><path d="M72 41 66 26M88 41 94 26M98 55 116 55M88 69 94 84M72 69 66 84M62 55 44 55" stroke="#c9f0cf" stroke-width="1.6" opacity=".6" fill="none"/></svg>`;
const ray = (cls = "ab-ray") => `<svg class="${cls}" viewBox="0 0 220 120" aria-hidden="true"><path d="M110 16C140 24 174 8 216 42 176 46 150 58 122 68L110 116 98 68C70 58 44 46 4 42 46 8 80 24 110 16Z" fill="#17466f"/><path d="M110 30C138 34 166 26 198 44 166 50 142 60 122 66L110 100 98 66C78 60 54 50 22 44 54 26 82 34 110 30Z" fill="#2a76a5" opacity=".7"/><path d="M110 70 108 118 112 118Z" fill="#0d2f4d"/><path d="M96 18 88 6 100 12ZM124 18 132 6 120 12Z" fill="#17466f"/><circle cx="98" cy="28" r="2" fill="#a8e8ff"/><circle cx="122" cy="28" r="2" fill="#a8e8ff"/><path d="M100 46q10 8 20 0" stroke="#a8e8ff" stroke-width="1.6" fill="none" opacity=".5"/></svg>`;
const diver = (cls = "ab-diver") => `<svg class="${cls}" viewBox="0 0 150 196" aria-hidden="true"><g transform="rotate(12 75 98)"><rect x="26" y="46" width="24" height="74" rx="12" fill="#f2b632"/><rect x="26" y="66" width="24" height="7" fill="#b9831a"/><rect x="34" y="38" width="8" height="10" rx="2" fill="#c8ccd2"/><path d="M52 44C70 36 94 40 96 62L92 114C82 122 62 122 54 114Z" fill="#0d2f4d"/><path d="M56 70H93" stroke="#35d6e0" stroke-width="5" opacity=".9"/><path d="M60 114C57 136 52 152 48 170M82 114C88 136 93 152 99 168" stroke="#0d2f4d" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M38 168 56 166 62 190 34 192ZM92 166 112 168 116 190 90 190Z" fill="#35d6e0"/><path d="M88 54C102 62 110 76 120 84M63 58C52 72 52 86 57 98" stroke="#0d2f4d" stroke-width="10" stroke-linecap="round" fill="none"/><circle cx="76" cy="30" r="18" fill="#0d2f4d"/><rect x="70" y="21" width="28" height="15" rx="6" fill="#8be9ff" opacity=".9" stroke="#e8fbff" stroke-width="1.4"/><path d="M60 30C46 34 42 46 44 52" stroke="#1e4a6e" stroke-width="3" fill="none"/><circle cx="121" cy="85" r="6" fill="#fff6bf"/><path d="M121 85 150 100 150 70Z" fill="#fff6bf" opacity=".16"/></g></svg>`;
const seabed = (cls = "ab-seabed") => `<svg class="${cls}" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true"><path d="M0 150V92C90 70 150 96 240 84S380 44 470 66 620 100 720 80 880 40 980 60 1140 100 1230 82 1380 60 1440 76V150Z" fill="#010a14" opacity=".65"/><path d="M0 150V110C120 92 200 116 320 104S520 76 640 98 840 122 960 100 1160 80 1280 104 1400 100 1440 106V150Z" fill="#010812"/><g stroke="#1b6f86" stroke-width="7" stroke-linecap="round" fill="none" opacity=".55"><path d="M170 112V80M170 96 156 82M170 90 184 74"/><path d="M610 108V70M610 90 594 74M610 84 626 64"/><path d="M1010 104V74M1010 90 996 76M1010 84 1024 68"/></g><g stroke="#16a5a0" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"><path d="M300 118C290 100 312 94 300 74M338 118C348 96 326 90 340 70M860 112C850 94 872 88 860 70M1250 112C1240 94 1262 88 1250 68"/></g></svg>`;
const bubbles = `<span class="ab-bub b1"></span><span class="ab-bub b2"></span><span class="ab-bub b3"></span><span class="ab-bub b4"></span><span class="ab-bub b5"></span>`;
const logoMark = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8 24C13 18 17 28 22 22S29 20 32 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="26" cy="11" r="2.4" fill="currentColor"/><circle cx="17" cy="9" r="1.4" fill="currentColor"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const down = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------- données de démonstration ----------
const LV = [
  { k: "decouverte", n: "Découverte", m: 6, pre: "Dès 8 ans, savoir nager. Aucun certificat de niveau.", dur: "Une demi-journée : 2 h 30 dont 20 min sous l'eau", prix: "65 €", tag: "Baptême", intro: "Respirer sous l'eau pour la première fois, à deux pas de la plage, avec un moniteur rien que pour vous.", items: ["Briefing sécurité et gestes de base", "Équipement complet prêté", "Une plongée encadrée en tête-à-tête jusqu'à 6 m", "Remise de votre carnet de plongeur"] },
  { k: "open-water", n: "Open Water", m: 20, pre: "Dès 14 ans (10 ans en version junior), certificat médical, nager 200 m.", dur: "4 jours : 3 séances en bassin et 4 plongées en mer", prix: "390 €", tag: "Premier brevet", intro: "Le brevet qui ouvre la porte des océans : on apprend à s'équiper, à équilibrer et à plonger en palanquée.", items: ["Théorie : pression, flottabilité, signes", "Trois séances en bassin chauffé", "Quatre plongées en mer jusqu'à 20 m", "Brevet reconnu partout dans le monde"] },
  { k: "advanced", n: "Advanced", m: 30, pre: "Open Water validé et 10 plongées au carnet.", dur: "2 jours : 5 plongées thématiques", prix: "290 €", tag: "Explorer", intro: "Vous plongez déjà ? Passez à 30 m, apprenez à vous orienter, à plonger de nuit et sur épave.", items: ["Plongée profonde jusqu'à 30 m", "Orientation au compas et aux repères", "Plongée de nuit et sur épave", "Gestion de l'air et de la consommation"] },
  { k: "rescue", n: "Rescue", m: 30, pre: "Advanced validé, 20 plongées et brevet de premiers secours à jour.", dur: "3 jours : théorie et 8 mises en situation", prix: "340 €", tag: "Prendre soin des autres", intro: "Apprendre à prévenir, à repérer et à secourir : le cap le plus formateur, celui qui change le regard.", items: ["Prévention et gestion du stress", "Remontée assistée et remorquage", "Recherche d'un plongeur disparu", "Oxygénothérapie et alerte des secours"] },
  { k: "divemaster", n: "Divemaster", m: 40, pre: "Rescue validé, 60 plongées et 18 ans révolus.", dur: "6 semaines de stage encadré au club", prix: "1 190 €", tag: "Encadrer", intro: "Devenir professionnel de l'encadrement : briefer, guider, tenir une palanquée et animer des baptêmes.", items: ["Démonstrations de compétences en eau", "Briefing et conduite de palanquée", "Assistance aux formations du club", "Matériel, compresseur et gestion du centre"] },
];
const SITES = [
  { n: "Plage des Tortues", z: "1 – 6 m", max: 6, min: 0, lvl: 0, d: "Baie abritée au fond de sable clair, herbier de posidonies. C'est ici que se passent nos baptêmes.", fa: ["Tortue verte", "Hippocampe", "Seiche", "Mulet doré"], vis: "20 m", cur: "Nulle", lien: "Accès depuis la plage, 5 min de marche", c: ["#ffd166", "#ff9f43"] },
  { n: "Récif des Sirènes", z: "3 – 18 m", max: 18, min: 3, lvl: 1, d: "Plateau rocheux couvert de gorgones et d'éponges jaunes, parfait pour les premières plongées en mer.", fa: ["Castagnole", "Poulpe", "Sar à tête noire", "Mérou brun"], vis: "25 m", cur: "Faible", lien: "Bateau, 10 min", c: ["#ff9f6b", "#e0564f"] },
  { n: "Grotte de l'Aiguille", z: "8 – 22 m", max: 22, min: 8, lvl: 1, d: "Une cavité éclairée par une voûte percée : les rayons tombent en colonnes bleues dans la salle principale.", fa: ["Murène", "Crevette cavernicole", "Corb", "Gobie"], vis: "15 m", cur: "Faible", lien: "Bateau, 15 min", c: ["#7fd1c8", "#2b9d9a"] },
  { n: "Banc du Large", z: "18 – 30 m", max: 30, min: 18, lvl: 2, d: "Haut-fond au large où l'eau bleue apporte les grands bancs et, certains matins, les raies.", fa: ["Raie pastenague", "Thon rouge", "Barracuda", "Liche amie"], vis: "30 m", cur: "Moyenne", lien: "Bateau, 35 min", c: ["#8bb8ff", "#4f7fd6"] },
  { n: "Épave du Cormoran", z: "22 – 32 m", max: 32, min: 22, lvl: 2, d: "Un chalutier coulé en 1987, posé droit sur le sable : la timonerie se visite, la cale abrite des congres.", fa: ["Congre", "Mérou", "Rascasse", "Banc de bogues"], vis: "20 m", cur: "Moyenne", lien: "Bateau, 25 min", c: ["#b6a4ff", "#6a5cd6"] },
  { n: "Tombant de la Moraine", z: "15 – 40 m", max: 40, min: 15, lvl: 2, d: "Un mur vertical plonge dans le noir. Corail rouge à 38 m, gorgones géantes et courants qui apportent la vie.", fa: ["Corail rouge", "Gorgone", "Raie manta", "Dentex"], vis: "35 m", cur: "Forte", lien: "Bateau, 40 min", c: ["#ff7aa8", "#c2386c"] },
];
const MOIS = ["", "", "", "", "avril", "mai", "juin", "juillet"];
const WD = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const SORT = [
  [4, 3, 0, 0, "09:30", 6, 10, "Baptême sur la plage"], [4, 10, 1, 1, "08:30", 4, 12, "Palier matinal sur le récif"], [4, 17, 2, 1, "08:00", 2, 8, "Lumière dans la grotte"], [4, 24, 4, 2, "07:30", 5, 10, "Descente sur l'épave"],
  [5, 8, 1, 1, "08:30", 9, 12, "Plongée de reprise au récif"], [5, 15, 3, 2, "07:00", 3, 10, "Les bancs du large"], [5, 22, 2, 1, "08:00", 7, 8, "Grotte et crevettes"], [5, 29, 5, 2, "07:00", 1, 8, "Premier palier à 30 m"],
  [6, 5, 0, 0, "10:00", 8, 10, "Baptême en famille"], [6, 12, 4, 2, "07:30", 6, 10, "Épave : visite de la timonerie"], [6, 19, 5, 4, "06:45", 2, 6, "Tombant à 40 m (encadrants)"], [6, 26, 3, 2, "07:00", 4, 10, "Raies et thons au large"], [7, 3, 1, 3, "08:30", 5, 8, "Ateliers de sauvetage"],
].map(([mo, j, s, l, h, p, t, titre], i) => ({ i, mo, j, s, l, h, p, t, titre, wd: WD[new Date(Date.UTC(2027, mo - 1, j)).getUTCDay()] }));
const slugM = { 4: "avril", 5: "mai", 6: "juin", 7: "juillet" };

// ---------- gabarits communs ----------
const gauge = (marks) => `<details class="ab-gauge" data-gauge><summary aria-label="Jauge de profondeur : aller à une section"><span class="ab-g-now" data-g-now>0 m</span></summary><div class="ab-g-body" role="navigation" aria-label="Jauge de profondeur">
  <p class="ab-g-cap">Profondeur <b class="ab-g-now" data-g-now>0 m</b></p><div class="ab-g-wrap"><div class="ab-g-track" aria-hidden="true"><i class="ab-g-mark" data-g-mark></i></div><div class="ab-g-ticks">${marks.map(([d, l], i) => `<a class="ab-g-tick" href="#palier-${i}" data-go="${i}" data-d="${d}"><b>${d} m</b><span>${esc(l)}</span></a>`).join("")}</div></div></div></details>`;

const header = (c, marks) => `<header class="ab-head pk-bleed">
  <div class="ab-amb" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ab-dark" aria-hidden="true"></div>
  <div class="ab-bar"><a class="ab-logo" href="/" aria-label="${esc(c.brand)} — accueil">${logoMark}<span>Abysse<small>Club de plongée</small></span></a>
    <div class="ab-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <a class="ab-btn ab-btn--sm" href="/formations">Essai découverte</a>
    <details class="ab-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="ab-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="ab-btn" href="/formations">Essai découverte</a></div></details></div>
  ${gauge(marks)}</header>`;

const footer = (c) => `<footer class="ab-foot pk-bleed"><div class="ab-wrap">${seabed()}<div class="ab-foot-grid"><div><p class="ab-foot-brand">${logoMark}Abysse</p><p>Club de plongée associatif, affilié à une fédération. Port-Oriel, au bout de la jetée est.</p><address>12 quai des Mouettes<br>Port-Oriel</address></div>
  <div><p class="ab-fh">Le club</p>${nav(c.menu.slice(1, 5), "ab-fl")}</div><div><p class="ab-fh">Pratique</p><a class="ab-fl" href="/contact">Contact</a><a class="ab-fl" href="/recherche">Recherche</a><a class="ab-fl" href="/sorties">Prochaines sorties</a></div>
  <div><p class="ab-fh">Horaires</p><p>Mardi et jeudi, 18 h – 21 h</p><p>Samedi, 8 h – 17 h</p></div></div>
  <p class="ab-legal">© Abysse — site de démonstration. Club, moniteurs, tarifs et sorties fictifs ; aucune inscription n'est enregistrée. La plongée se pratique avec un certificat médical et un encadrement qualifié.</p></div></footer>`;

const SEC = (d, label, cls, inner) => `<section class="ab-sec ${cls} pk-bleed" data-depth="${d}" data-label="${esc(label)}">${inner}</section>`;
const head = (d, label, kicker, title, sub, extra = "") => SEC(d, label, "ab-ph", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>${esc(kicker)}</p><div class="ab-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="ab-lead" data-reveal>${esc(sub)}</p>` : ""}${extra}</div><div class="ab-ph-fish" aria-hidden="true">${fish("#ffd166", "#ff9f43")}${bubbles}</div>`);
const cta = (d, label, title, text) => SEC(d, label, "ab-cta", `<div class="ab-wrap ab-cta-in">${turtle("ab-turtle ab-cta-turtle")}<div><h2 class="ab-h2" data-reveal>${title}</h2><p class="ab-lead" data-reveal>${esc(text)}</p><div class="ab-actions" data-reveal><a class="ab-btn ab-btn--lg" href="/contact">Parler au club ${arrow}</a><a class="ab-btn ab-btn--ghost ab-btn--lg" href="/sorties">Voir les sorties</a></div></div></div>`);

const siteCard = (s, i, big) => {
  const pts = [[0, 0], [8, s.min * 0.5 + 2], [30, s.min + 2], [55, Math.max(s.min, s.max * 0.6)], [78, s.max], [100, s.max]];
  const sc = 100 / 44;
  return `<article class="ab-site${big ? " ab-site--big" : ""}" data-reveal><div class="ab-site-prof"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,100 ${pts.map(([x, y]) => `${x},${(Math.min(98, 6 + y * sc * 0.9)).toFixed(1)}`).join(" ")} 100,100" fill="#010a14" opacity=".72"/><polyline points="${pts.map(([x, y]) => `${x},${(Math.min(98, 6 + y * sc * 0.9)).toFixed(1)}`).join(" ")}" fill="none" stroke="${s.c[0]}" stroke-width="1.6"/></svg><span class="ab-site-z"><b>${s.max}</b> m</span>${fish(s.c[0], s.c[1], "ab-fish ab-site-fish")}</div>
  <div class="ab-site-body"><p class="ab-tag">${esc(s.z)} · ${esc(LV[s.lvl].n)} et plus</p><h3>${esc(s.n)}</h3><p>${esc(s.d)}</p>
  <dl class="ab-facts"><div><dt>Visibilité</dt><dd>${esc(s.vis)}</dd></div><div><dt>Courant</dt><dd>${esc(s.cur)}</dd></div><div><dt>Accès</dt><dd>${esc(s.lien)}</dd></div></dl>
  <ul class="ab-chips" aria-label="Faune observée">${s.fa.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div></article>`;
};

const levelStairs = () => `<div class="ab-stairs">${LV.map((l, i) => `<a class="ab-step ab-step--${i}" href="/formations" data-reveal><span class="ab-step-n">${l.m}<small> m</small></span><span class="ab-step-b"><b>${esc(l.n)}</b><small>${esc(l.tag)} · ${esc(l.prix)}</small></span><span class="ab-step-go" aria-hidden="true">${arrow}</span></a>`).join("")}</div>`;

const outItem = (o, teaser) => {
  const s = SITES[o.s], low = o.p <= 3;
  return `<article class="ab-out" data-out="${o.i}" data-lvl="${o.l}" data-site="${o.s}" data-month="${o.mo}" data-reveal><div class="ab-out-date"><b>${o.j}</b><span>${["", "", "", "", "avr.", "mai", "juin", "juil."][o.mo]}</span><i>${o.wd}</i></div>
   <div class="ab-out-main"><h3>${esc(o.titre)}</h3><p class="ab-out-meta">${esc(s.n)} · départ ${o.h.replace(":", " h ")} · ${esc(s.z)}</p><p class="ab-out-tags"><span class="ab-lvl ab-lvl--${o.l}">${esc(LV[o.l].n)} requis</span><span>${esc(s.lien)}</span></p></div>
   <div class="ab-out-side"><p class="ab-places${low ? " ab-places--low" : ""}"><b>${o.p}</b> place${o.p > 1 ? "s" : ""} sur ${o.t}</p>${teaser ? `<a class="ab-link" href="/sorties">Voir la sortie</a>` : `<a class="ab-pick" href="#choisir" role="button" aria-pressed="false" data-pick="${o.i}">Ajouter à ma demande</a>`}</div></article>`;
};

// ---------- pages ----------
const homeMarks = [[0, "Surface"], [8, "Niveaux"], [18, "Sorties"], [28, "Sites"], [38, "Le club"], [45, "Rejoindre"]];
const home = (c) => [
  sec(header(c, homeMarks)),
  sec(SEC(0, "Surface", "ab-hero", `<div class="ab-rays" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
   <div class="ab-wrap ab-hero-in"><div class="ab-hero-copy"><p class="ab-kicker" data-reveal>Club de plongée · Port-Oriel · depuis 1996</p>
    <div class="ab-h1 ab-h1--hero" role="heading" aria-level="1" data-reveal>Descendez. <span>Le bruit reste à la surface.</span></div>
    <p class="ab-lead" data-reveal>Du baptême au brevet de moniteur, Abysse vous emmène du premier mètre jusqu'aux tombants à 40 m, en petits groupes et à votre rythme.</p>
    <div class="ab-actions" data-reveal><a class="ab-btn ab-btn--lg" href="/formations">Choisir ma formation ${arrow}</a><a class="ab-btn ab-btn--ghost ab-btn--lg" href="/sorties">Prochaines sorties</a></div>
    <p class="ab-scrollhint" data-reveal>${down}<span>Faites défiler pour descendre</span></p></div>
    <div class="ab-cut" aria-hidden="true"><div class="ab-cut-wave"><svg viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 18Q25 6 50 18T100 18T150 18T200 18T250 18T300 18T350 18T400 18V40H0Z" fill="#d8fbf7" opacity=".55"/><path d="M0 24Q25 14 50 24T100 24T150 24T200 24T250 24T300 24T350 24T400 24V40H0Z" fill="#8fe6e3" opacity=".6"/></svg></div>
     <ul class="ab-cut-scale"><li>0 m</li><li>10 m</li><li>20 m</li><li>30 m</li><li>40 m</li></ul><i class="ab-cut-line"></i>
     <div class="ab-cut-diver">${diver()}<span class="ab-bub b1"></span><span class="ab-bub b2"></span><span class="ab-bub b3"></span><span class="ab-bub b4"></span></div>
     ${turtle("ab-turtle ab-cut-turtle")}${school("ab-school ab-cut-school")}${ray("ab-ray ab-cut-ray")}${fish("#ffd166", "#ff9f43", "ab-fish ab-cut-fish")}</div></div>
   <div class="ab-stat-band"><div class="ab-wrap"><ul class="ab-stats"><li><b data-count="28">28</b><span>ans de club</span></li><li><b data-count="640" data-suffix="+">640+</b><span>plongées encadrées par an</span></li><li><b data-count="6">6</b><span>sites de 6 à 40 m</span></li><li><b data-count="9">9</b><span>moniteurs bénévoles et pros</span></li></ul></div></div>`)),
  sec(SEC(8, "Niveaux", "ab-levels", `<div class="ab-wrap ab-split"><div class="ab-split-head"><p class="ab-kicker" data-reveal>Formations</p><h2 class="ab-h2" data-reveal>Cinq paliers, du premier souffle au brevet pro</h2><p class="ab-lead" data-reveal>Chaque niveau vous enfonce un peu plus : plus profond, plus autonome, plus responsable. Choisissez le vôtre.</p><a class="ab-btn" href="/formations" data-reveal>Détails des niveaux ${arrow}</a></div>${levelStairs()}</div>`)),
  sec(SEC(18, "Sorties", "ab-outs", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>Calendrier</p><h2 class="ab-h2" data-reveal>Les trois prochaines sorties</h2><div class="ab-out-list">${SORT.slice(1, 4).map((o) => outItem(o, true)).join("")}</div><p class="ab-more" data-reveal><a class="ab-btn ab-btn--ghost" href="/sorties">Filtrer toutes les sorties ${arrow}</a></p></div>`)),
  sec(SEC(28, "Sites", "ab-sites-t", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>Où plonger</p><h2 class="ab-h2" data-reveal>Six sites, de la baie calme au grand tombant</h2><div class="ab-site-grid">${[SITES[1], SITES[4], SITES[5]].map((s, i) => siteCard(s, i)).join("")}</div><p class="ab-more" data-reveal><a class="ab-btn ab-btn--ghost" href="/sites">Les six sites ${arrow}</a></p></div>${school("ab-school ab-sites-school")}`)),
  sec(SEC(38, "Le club", "ab-club-t", `<div class="ab-wrap ab-club-in"><div><p class="ab-kicker" data-reveal>Le club</p><h2 class="ab-h2" data-reveal>Une association, un bateau, une règle : personne ne plonge seul</h2><p class="ab-lead" data-reveal>Le club est géré par ses plongeurs. Nos moniteurs fédéraux et nos encadrants bénévoles partagent un même principe : on remonte ensemble.</p><ul class="ab-ticks" data-reveal><li>Groupes de 4 plongeurs au plus par moniteur</li><li>Bloc d'oxygène et trousse de secours à bord</li><li>Matériel révisé chaque saison</li></ul><a class="ab-btn" href="/club" data-reveal>Rencontrer l'équipe ${arrow}</a></div><div class="ab-club-art" aria-hidden="true">${ray("ab-ray ab-club-ray")}${fish("#9fe7ee", "#35d6e0", "ab-fish ab-club-fish")}</div></div>`)),
  sec(cta(45, "Rejoindre", "Prêt à mouiller le masque ?", "Écrivez-nous : nous répondons sous deux jours ouvrés et proposons un premier créneau en petit groupe.")),
  sec(footer(c))];

const formMarks = [[0, "Introduction"], [6, "Les niveaux"], [20, "Comparatif"], [32, "Questions"], [40, "S'inscrire"]];
const formations = (c) => [
  sec(header(c, formMarks)),
  sec(head(0, "Introduction", "Formations", "Cinq niveaux, une progression", "Cliquez un palier pour voir la profondeur maximale, les prérequis, la durée, le contenu et le tarif indicatif.")),
  sec(SEC(6, "Les niveaux", "ab-lev", `<div class="ab-wrap" data-levels><div class="ab-frise" role="tablist" aria-label="Niveaux de formation">${LV.map((l, i) => `<a class="ab-fr${i === 0 ? " is-on" : ""}" href="#niveau-${l.k}" role="tab" aria-selected="${i === 0}" data-lv="${i}"><span class="ab-fr-dot" aria-hidden="true">${i + 1}</span><b>${esc(l.n)}</b><small>${l.m} m</small></a>`).join("")}</div>
   <div class="ab-fr-panels">${LV.map((l, i) => `<article class="ab-lvl-p${i === 0 ? " is-on" : ""}" role="tabpanel" data-lvp="${i}" aria-label="${esc(l.n)}">
     <div class="ab-lvl-depth" aria-hidden="true"><span class="ab-lvl-gauge ab-lvl-gauge--${l.m}"><i class="ab-lvl-diver"></i></span><b>${l.m}<small> m</small></b></div>
     <div class="ab-lvl-main"><p class="ab-tag">Niveau ${i + 1} sur 5 · ${esc(l.tag)}</p><h2 class="ab-h2">${esc(l.n)}</h2><p class="ab-lead">${esc(l.intro)}</p>
     <dl class="ab-facts ab-facts--lg"><div><dt>Profondeur max.</dt><dd>${l.m} m</dd></div><div><dt>Durée</dt><dd>${esc(l.dur)}</dd></div><div><dt>Prérequis</dt><dd>${esc(l.pre)}</dd></div><div><dt>Tarif indicatif</dt><dd>${esc(l.prix)}</dd></div></dl>
     <p class="ab-sub">Au programme</p><ul class="ab-ticks">${l.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
     <div class="ab-actions"><a class="ab-btn" href="/contact">Demander une place ${arrow}</a><a class="ab-btn ab-btn--ghost" href="/sorties">Sorties de ce niveau</a></div></div></article>`).join("")}</div></div>`)),
  sec(SEC(20, "Comparatif", "ab-cmp", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>En un coup d'œil</p><h2 class="ab-h2" data-reveal>Comparer les niveaux</h2>
   <table class="ab-table" data-reveal><caption>Les cinq niveaux du club</caption><thead><tr><th scope="col">Niveau</th><th scope="col">Profondeur</th><th scope="col">Durée</th><th scope="col">Prérequis</th><th scope="col">Tarif indicatif</th></tr></thead><tbody>${LV.map((l) => `<tr><th scope="row" data-l="Niveau">${esc(l.n)}</th><td data-l="Profondeur">${l.m} m</td><td data-l="Durée">${esc(l.dur)}</td><td data-l="Prérequis">${esc(l.pre)}</td><td data-l="Tarif indicatif">${esc(l.prix)}</td></tr>`).join("")}</tbody></table></div>`)),
  sec(SEC(32, "Questions", "ab-faq", `<div class="ab-wrap ab-faq-in"><div><p class="ab-kicker" data-reveal>Avant de se lancer</p><h2 class="ab-h2" data-reveal>Questions fréquentes</h2></div><div class="ab-faq-list">
   <details data-reveal><summary>Faut-il un certificat médical ?</summary><p>Oui, délivré par un médecin, dès l'Open Water. Pour un baptême, un simple questionnaire de santé suffit, relu avec le moniteur.</p></details>
   <details data-reveal><summary>Je ne suis pas un grand nageur, est-ce un obstacle ?</summary><p>Il faut être à l'aise dans l'eau. Les épreuves demandent 200 m sans limite de temps, avec masque et tuba.</p></details>
   <details data-reveal><summary>Le matériel est-il fourni ?</summary><p>Pour les formations, oui : détendeur, gilet, combinaison et bloc sont prêtés. Masque, tuba et palmes sont conseillés en achat personnel.</p></details>
   <details data-reveal><summary>Peut-on passer un niveau sans tout refaire ?</summary><p>Si vous avez déjà un brevet d'une autre fédération, le moniteur évalue vos acquis lors d'une plongée de validation.</p></details></div></div>`)),
  sec(cta(40, "S'inscrire", "Choisissez votre palier", "Dites-nous votre niveau et votre date souhaitée : le club vous propose la prochaine session.")),
  sec(footer(c))];

const sortMarks = [[0, "Introduction"], [10, "Planning"], [24, "Avant l'eau"], [34, "Demander"]];
const sorties = (c) => [
  sec(header(c, sortMarks)),
  sec(head(0, "Introduction", "Sorties programmées", "Le planning de la saison", "Filtrez par niveau, par site et par mois, ajoutez des sorties à votre demande et envoyez le récapitulatif au club.")),
  sec(SEC(10, "Planning", "ab-plan", `<div class="ab-wrap" data-planner><div class="ab-filters" role="group" aria-label="Filtres des sorties">
    <div class="ab-fg"><p class="ab-fl-t">Mon niveau</p><div class="ab-fchips"><a class="ab-fc is-on" href="#niveau" data-f="lvl" data-v="all">Tous</a>${LV.map((l, i) => `<a class="ab-fc" href="#niveau" data-f="lvl" data-v="${i}">${esc(l.n)}</a>`).join("")}</div></div>
    <div class="ab-fg"><p class="ab-fl-t">Site</p><div class="ab-fchips"><a class="ab-fc is-on" href="#site" data-f="site" data-v="all">Tous</a>${SITES.map((s, i) => `<a class="ab-fc" href="#site" data-f="site" data-v="${i}">${esc(s.n)}</a>`).join("")}</div></div>
    <div class="ab-fg"><p class="ab-fl-t">Mois</p><div class="ab-fchips"><a class="ab-fc is-on" href="#mois" data-f="month" data-v="all">Tous</a>${[4, 5, 6, 7].map((m) => `<a class="ab-fc" href="#mois" data-f="month" data-v="${m}">${slugM[m][0].toUpperCase() + slugM[m].slice(1)}</a>`).join("")}</div></div></div>
   <div class="ab-plan-grid"><div><p class="ab-count" role="status" aria-live="polite" data-count-out>${SORT.length} sorties</p><div class="ab-out-list">${SORT.map((o) => outItem(o, false)).join("")}</div><div class="ab-empty" data-empty hidden><p>Aucune sortie ne correspond à ces filtres. Essayez un autre mois ou un autre site.</p></div></div>
   <aside class="ab-recap" aria-label="Ma demande" data-recap><p class="ab-kicker">Ma demande</p><h2 class="ab-h3">Récapitulatif</h2>
    <div class="ab-fg"><p class="ab-fl-t">Nombre de plongeurs</p><div class="ab-fchips"><a class="ab-fc is-on" href="#nb" data-n="1">1</a><a class="ab-fc" href="#nb" data-n="2">2</a><a class="ab-fc" href="#nb" data-n="3">3</a><a class="ab-fc" href="#nb" data-n="4">4</a></div></div>
    <ul class="ab-recap-list" data-recap-list></ul><p class="ab-recap-empty" data-recap-empty>Aucune sortie choisie. Utilisez « Ajouter à ma demande » dans la liste.</p>
    <p class="ab-recap-note">Démonstration : rien n'est réservé. Copiez le texte puis collez-le dans le formulaire de contact : le club confirmera les places.</p>
    <div class="ab-actions"><a class="ab-btn" href="/contact">Envoyer au club ${arrow}</a><a class="ab-btn ab-btn--ghost" href="#copier" data-copy>Copier le récapitulatif</a></div><p class="ab-copied" role="status" aria-live="polite" data-copied></p></aside></div></div>`)),
  sec(SEC(24, "Avant l'eau", "ab-brief", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>Le jour J</p><h2 class="ab-h2" data-reveal>Comment se déroule une sortie</h2><ol class="ab-steps">
   <li data-reveal><b>1</b><h3>Rendez-vous au quai</h3><p>Trente minutes avant le départ : émargement, contrôle du carnet et du certificat médical.</p></li>
   <li data-reveal><b>2</b><h3>Briefing de palanquée</h3><p>Le directeur de plongée présente le site, la profondeur, la durée et les signes à utiliser.</p></li>
   <li data-reveal><b>3</b><h3>Mise à l'eau</h3><p>Palanquées de quatre plongeurs au plus, contrôle mutuel de l'équipement avant de descendre.</p></li>
   <li data-reveal><b>4</b><h3>Palier et retour</h3><p>Remontée lente, palier de sécurité de trois minutes, puis débriefing et carnet signé.</p></li></ol></div>`)),
  sec(cta(34, "Demander", "Une date vous tente ?", "Envoyez votre récapitulatif depuis le formulaire de contact : nous vous confirmons les places restantes.")),
  sec(footer(c))];

const siteMarks = [[0, "Profondeurs"], [8, "Eaux claires"], [20, "Entre deux eaux"], [34, "Grands fonds"]];
const sites = (c) => [
  sec(header(c, siteMarks)),
  sec(head(0, "Profondeurs", "Sites de plongée", "Six sites, six profondeurs", "Du fond de sable de la baie aux gorgones du tombant : chaque site a sa faune, son niveau et ses conditions.",
    `<div class="ab-depthchart" role="img" aria-label="Profondeur maximale des six sites : ${SITES.map((s) => `${s.n} ${s.max} mètres`).join(", ")}">${SITES.map((s, i) => `<div class="ab-dc ab-dc--${s.max}"><span class="ab-dc-bar"></span><b>${s.max} m</b><small>${esc(s.n)}</small></div>`).join("")}</div>`)),
  sec(SEC(8, "Eaux claires", "ab-zone", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>0 – 20 m</p><h2 class="ab-h2" data-reveal>Les eaux claires</h2><p class="ab-lead" data-reveal>La lumière descend jusqu'au fond : idéal pour apprendre, observer et prendre son temps.</p><div class="ab-site-list">${[0, 1, 2].map((i) => siteCard(SITES[i], i, true)).join("")}</div></div>`)),
  sec(SEC(20, "Entre deux eaux", "ab-zone", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>20 – 30 m</p><h2 class="ab-h2" data-reveal>Entre deux eaux</h2><p class="ab-lead" data-reveal>Le bleu s'épaissit, les couleurs rouges s'éteignent. Brevet Advanced conseillé.</p><div class="ab-site-list">${[3, 4].map((i) => siteCard(SITES[i], i, true)).join("")}</div>${turtle("ab-turtle ab-zone-turtle")}</div>`)),
  sec(SEC(34, "Grands fonds", "ab-zone", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>30 – 40 m</p><h2 class="ab-h2" data-reveal>Les grands fonds</h2><p class="ab-lead" data-reveal>Courant, lumière rare et plongées courtes : réservé aux plongeurs confirmés et à leurs encadrants.</p><div class="ab-site-list">${siteCard(SITES[5], 5, true)}</div>${ray("ab-ray ab-zone-ray")}</div>`)),
  sec(footer(c))];

const TEAM = [["Camille Marchetti", "Directrice technique", "Moniteur fédéral 3e degré", "28 ans de plongée", "#35d6e0"], ["Malik Ouedraogo", "Moniteur Open Water", "Spécialiste baptêmes", "1 800 plongées", "#ffd166"], ["Inès Valcourt", "Monitrice Rescue", "Médecin urgentiste", "Secourisme et oxygène", "#ff9f6b"], ["Tom Berthier", "Pilote du bateau", "Permis côtier et hauturier", "Navigation et sécurité", "#9bd7a3"], ["Zoé Lambrecht", "Monitrice Advanced", "Biologiste marine", "Faune et flore locales", "#c9b6ff"], ["Hugo Delmas", "Responsable matériel", "Technicien compresseur", "Révision des blocs", "#8bb8ff"]];
const GEAR = [["Détendeur et octopus", "Prêté en formation", "Révisé chaque saison", "Location 12 €"], ["Gilet stabilisateur", "Prêté en formation", "Tailles XS à XXL", "Location 10 €"], ["Combinaison 5 mm", "Prêtée en formation", "Intégrale ou shorty", "Location 8 €"], ["Bloc 12 L ou 15 L", "Inclus à la sortie", "Air ou nitrox", "Recharge au club"], ["Ordinateur de plongée", "Location au club", "Profondeur et paliers", "Location 9 €"], ["Masque, tuba, palmes", "Achat personnel", "Essayage conseillé", "Conseils en boutique"]];
const clubMarks = [[0, "Le club"], [10, "L'équipe"], [22, "Le matériel"], [32, "Nos règles"], [40, "Horaires"]];
const club = (c) => [
  sec(header(c, clubMarks)),
  sec(head(0, "Le club", "Le club", "Un club qui prend son temps", "Fondé en 1996 par six plongeurs, Abysse reste une association : on s'y forme, on y plonge et on y apprend à remonter ensemble.")),
  sec(SEC(10, "L'équipe", "ab-team", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>Encadrement</p><h2 class="ab-h2" data-reveal>L'équipe</h2><div class="ab-team-grid">${TEAM.map(([n, r, d, s, col], i) => `<article class="ab-mate" data-reveal><svg class="ab-avatar" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="38" fill="${col}" opacity=".22"/><circle cx="40" cy="34" r="15" fill="#0d2f4d"/><rect x="32" y="29" width="16" height="9" rx="4" fill="${col}"/><path d="M12 72C14 54 28 50 40 50S66 54 68 72Z" fill="#0d2f4d"/><circle cx="58" cy="${14 + (i % 3) * 3}" r="3" fill="#fff" opacity=".6"/></svg><h3>${esc(n)}</h3><p class="ab-role">${esc(r)}</p><p>${esc(d)}</p><p class="ab-muted">${esc(s)}</p></article>`).join("")}</div></div>`)),
  sec(SEC(22, "Le matériel", "ab-gear", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>Équipement</p><h2 class="ab-h2" data-reveal>Le matériel</h2><p class="ab-lead" data-reveal>Tout ce qui respire, flotte ou mesure est révisé par le club avant chaque saison.</p>
   <table class="ab-table" data-reveal><caption>Matériel du club et tarifs de location indicatifs</caption><thead><tr><th scope="col">Équipement</th><th scope="col">Formation</th><th scope="col">Détail</th><th scope="col">Hors formation</th></tr></thead><tbody>${GEAR.map(([a, b, c2, d]) => `<tr><th scope="row" data-l="Équipement">${a}</th><td data-l="Formation">${b}</td><td data-l="Détail">${c2}</td><td data-l="Hors formation">${d}</td></tr>`).join("")}</tbody></table></div>`)),
  sec(SEC(32, "Nos règles", "ab-rules", `<div class="ab-wrap ab-rules-in"><div><p class="ab-kicker" data-reveal>Sécurité</p><h2 class="ab-h2" data-reveal>Quatre règles, jamais négociables</h2></div><ol class="ab-rule-list">
   <li data-reveal><b>1</b><div><h3>Jamais seul</h3><p>Toute plongée se fait en palanquée, avec un équipier qui connaît votre niveau.</p></div></li>
   <li data-reveal><b>2</b><div><h3>La remontée décide</h3><p>Quand la réserve d'air atteint 50 bars, la palanquée remonte, quoi qu'il y ait à voir.</p></div></li>
   <li data-reveal><b>3</b><div><h3>Un site pour chaque niveau</h3><p>Le directeur de plongée peut changer de site le matin même si la mer ou le courant l'exige.</p></div></li>
   <li data-reveal><b>4</b><div><h3>Pas de plongée sans oxygène</h3><p>Le bateau embarque en permanence un bloc d'oxygène et une trousse de secours.</p></div></li></ol></div>`)),
  sec(SEC(40, "Horaires", "ab-hours", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>Nous trouver</p><h2 class="ab-h2" data-reveal>Horaires du club</h2><dl class="ab-hours" data-reveal><div><dt>Mardi et jeudi</dt><dd>18 h – 21 h · bassin et théorie</dd></div><div><dt>Samedi</dt><dd>8 h – 17 h · sorties en mer</dd></div><div><dt>Dimanche</dt><dd>Sur demande · baptêmes</dd></div></dl><address data-reveal>12 quai des Mouettes, Port-Oriel · <a class="ab-link" href="/contact">Nous écrire</a></address></div>`)),
  sec(footer(c))];

const contactMarks = [[0, "Contact"], [14, "Venir au club"]];
const contact = (c) => [
  sec(header(c, contactMarks)),
  sec(head(0, "Contact", "Écrire au club", "Une question avant de plonger ?", "Formation, sortie, location ou baptême : précisez votre niveau et vos dates, nous répondons sous deux jours ouvrés.")),
  { type: "form", heading: "Votre message", intro: "Collez ici votre récapitulatif de sortie, ou décrivez simplement votre projet de plongée." },
  sec(SEC(14, "Venir au club", "ab-find", `<div class="ab-wrap ab-find-in"><div><p class="ab-kicker" data-reveal>Nous trouver</p><h2 class="ab-h2" data-reveal>Au bout de la jetée est</h2><address data-reveal>Abysse, club de plongée<br>12 quai des Mouettes<br>Port-Oriel</address></div><dl class="ab-hours" data-reveal><div><dt>Mardi et jeudi</dt><dd>18 h – 21 h</dd></div><div><dt>Samedi</dt><dd>8 h – 17 h</dd></div><div><dt>Dimanche</dt><dd>Sur demande</dd></div></dl></div>`)),
  sec(footer(c))];

const rechMarks = [[0, "Recherche"], [8, "Raccourcis"]];
const recherche = (c) => [
  sec(header(c, rechMarks)),
  sec(head(0, "Recherche", "Rechercher", "Un site, un niveau, une date ?", "Tapez un mot : formation, épave, tortue, matériel…")),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] },
  sec(SEC(8, "Raccourcis", "ab-quick", `<div class="ab-wrap"><p class="ab-kicker" data-reveal>Raccourcis</p><h2 class="ab-h2" data-reveal>Pages les plus consultées</h2><div class="ab-quick-grid"><a href="/formations" data-reveal><b>Formations</b><span>Les cinq niveaux, du baptême au Divemaster</span></a><a href="/sorties" data-reveal><b>Sorties</b><span>Planning filtrable par niveau, site et mois</span></a><a href="/sites" data-reveal><b>Sites</b><span>Profondeur, visibilité et faune de chaque site</span></a><a href="/club" data-reveal><b>Le club</b><span>L'équipe, le matériel et nos règles</span></a></div></div>`)),
  sec(footer(c))];

const lostMarks = [[45, "Trop profond"], [52, "Remonter"]];
const introuvable = (c) => [
  sec(header(c, lostMarks)),
  sec(SEC(45, "Trop profond", "ab-lost", `<div class="ab-wrap"><p class="ab-kicker">Erreur 404</p><div class="ab-h1" role="heading" aria-level="1">Page introuvable : vous êtes trop profond</div><p class="ab-lead">Cette adresse n'existe pas ou a changé de place. Pas de panique : on remonte lentement, avec un palier de sécurité.</p><div class="ab-lost-art" aria-hidden="true">${diver()}${bubbles}</div></div>`)),
  sec(SEC(52, "Remonter", "ab-lost2", `<div class="ab-wrap"><div class="ab-actions"><a class="ab-btn ab-btn--lg" href="/">Remonter à la surface ${arrow}</a><a class="ab-btn ab-btn--ghost ab-btn--lg" href="/recherche">Rechercher</a><a class="ab-btn ab-btn--ghost ab-btn--lg" href="/contact">Appeler le bateau</a></div></div>`)),
  sec(footer(c))];

module.exports = {
  key: "abysse", name: "Abysse", version: "2.0.0", category: "nature", tags: ["sombre", "naturel", "moderne"], siteType: "Club de plongée sous-marine", featured: true,
  concept: "Une descente : la page s'assombrit du turquoise de surface au noir-bleu des profondeurs, avec une jauge de profondeur à droite pour sauter de palier en palier.",
  description: "Club de plongée : fond en dégradé vertical du turquoise au noir-bleu, faisceaux de lumière, bulles, tortue et raie dessinées, jauge de profondeur fixe, niveaux de formation cliquables et sorties filtrables avec récapitulatif.",
  brand: "Abysse Club de plongée", modules: ["formulaires", "recherche"],
  dna: { header: "jauge-de-profondeur-fixe-a-droite-en-metres", hero: "coupe-verticale-de-l-ocean-plongeur-qui-descend-et-bulles", grid: "paliers-en-escalier-qui-s-enfoncent", motion: "bulles-qui-montent-faisceaux-et-plongeur-qui-descend", shapes: "faisceaux-de-lumiere-verre-depoli-et-silhouettes-marines", rhythm: "descente-continue-le-fond-s-assombrit-a-chaque-palier", signature: "niveaux-de-formation-cliquables-et-sorties-programmees-filtrables" },
  tokens: {
    colors: { primary: "#35d6e0", secondary: "#073c68", accent: "#ffd166", background: "#04182b", surface: "#0a2f4f", text: "#eaf8fb", muted: "#a9cfdc", success: "#5fd39a", warning: "#ffc857", error: "#ff8a80" },
    fonts: { heading: "font.exo-2", body: "font.spline-sans", button: "font.exo-2", link: "font.spline-sans" },
    radius: { sm: 8, md: 16, lg: 24, button: 999, field: 12, card: 20 }, shadow: { card: "0 18px 40px rgba(0,8,20,.45)", button: "none" }, border: { width: 1, color: "#1f5a80" },
    type: { h1: { size: 72, weight: 800, lineHeight: 1.02, transform: "none" }, h2: { size: 42, weight: 700, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur de la lumière", type: "color", default: "#35d6e0" },
    { key: "surface", label: "Turquoise de surface", type: "color", default: "#58cdd0" },
    { key: "abyss", label: "Noir-bleu du fond", type: "color", default: "#010912" },
    { key: "bubbles", label: "Bulles qui montent", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "gauge", label: "Jauge de profondeur", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
  ],
  menu: [["Accueil", "/"], ["Formations", "/formations"], ["Sorties", "/sorties"], ["Sites", "/sites"], ["Le club", "/club"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "formations", name: "Formations", render: formations }, { key: "sorties", name: "Sorties", render: sorties },
    { key: "sites", name: "Sites de plongée", render: sites }, { key: "club", name: "Le club", render: club }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
