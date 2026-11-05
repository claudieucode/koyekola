// Pellicule — société de production cinéma. Direction artistique : salle noire, grain argentique, format letterbox 2,39 avec bande-annonce simulée,
// filmographie en rangées horizontales (filtre année / genre, fiche film en panneau), générique de fin, navigation en barre de chapitres fixée en bas.
const { sec, esc, nav } = require("../kit");

/* ---------- Données de démonstration (tout est fictif) ---------- */
const PEOPLE = { ines: "Inès Marchetti", karim: "Karim Delorme", camille: "Camille Roussel", hugo: "Hugo Vasseur", lea: "Léa Fontaine", paul: "Paul Garnier", sofia: "Sofia Lenoir", theo: "Théo Marchand", clara: "Clara Dubois", yanis: "Yanis Aït" };
// slug, titre, année, genre (clé), libellé de genre, durée, réalisateur, image, musique, motif, couleur de fond, couleur de lumière, synopsis, accroche
const FILMS = [
  ["heures-basses", "Les Heures Basses", 2026, "drame", "Drame", "1 h 52", "ines", "paul", "clara", "moon", "#13232c", "#e6dfc9", "Une infirmière de nuit quitte la ville la veille d'un orage et retrouve, sur une route désertée, le frère qu'elle n'avait pas revu depuis dix ans.", "Il y a des routes qu'on ne prend qu'une fois."],
  ["sel-cendre", "Sel et Cendre", 2025, "thriller", "Thriller", "1 h 38", "karim", "paul", "theo", "tower", "#1c1c1e", "#d8d2c0", "Dans un port à l'arrêt, un inspecteur des assurances découvre qu'un incendie déclaré accidentel a été préparé trois ans plus tôt.", "Tout ce qui brûle laisse une signature."],
  ["cinquieme-etage", "Le Cinquième Étage", 2025, "comedie", "Comédie noire", "1 h 29", "camille", "sofia", "yanis", "window", "#2a1d1b", "#e8cf9d", "Un syndic de copropriété vient annoncer la fin de l'ascenseur ; l'immeuble décide de le garder prisonnier jusqu'à la réparation.", "Le règlement, rien que le règlement."],
  ["maree", "Ce que dit la marée", 2024, "drame", "Drame", "2 h 04", "ines", "paul", "clara", "wave", "#102a33", "#bfd3d1", "Trois générations d'une famille de pêcheurs se disputent la vente du bateau, pendant qu'une tempête d'automne ferme le port.", "On hérite aussi de ce qu'on tait."],
  ["fenetre-nuit", "Fenêtre sur nuit", 2023, "thriller", "Thriller", "1 h 44", "karim", "sofia", "theo", "eye", "#161a24", "#cfd3df", "Une traductrice insomniaque croit reconnaître, dans l'appartement d'en face, la scène d'un crime qu'elle vient de traduire.", "Elle regarde. Quelqu'un regarde aussi."],
  ["ete-autres", "L'Été des autres", 2022, "drame", "Drame", "1 h 41", "lea", "paul", "clara", "sun", "#2b2216", "#ecd9a4", "Une adolescente garde la maison de vacances d'inconnus et apprend leur vie à travers les objets qu'ils ont laissés.", "Un été prêté, des souvenirs empruntés."],
  ["dernieres-salles", "Les Dernières Salles", 2026, "documentaire", "Documentaire", "1 h 12", "hugo", "sofia", "yanis", "seats", "#1d1517", "#e2c9bd", "Portrait de cinq projectionnistes qui font tourner les dernières salles de village, séance après séance, bobine après bobine.", "Le faisceau dans le noir."],
  ["voix-plomb", "Voix de plomb", 2024, "documentaire", "Documentaire", "0 h 58", "hugo", "paul", "theo", "rings", "#1a1f1d", "#c6d1c6", "Des anciens typographes rejouent une dernière fois la composition au plomb d'un journal disparu.", "Chaque lettre pèse."],
  ["mine-memoire", "La Mine en mémoire", 2023, "documentaire", "Documentaire", "1 h 26", "hugo", "sofia", "clara", "arch", "#241c14", "#d6bf93", "Quarante ans après la fermeture du puits, ses ouvriers guident leurs petits-enfants dans la galerie restée intacte.", "Descendre pour transmettre."],
  ["pierres-vives", "Pierres vives", 2021, "documentaire", "Documentaire", "0 h 52", "hugo", "paul", "yanis", "stones", "#222018", "#d9d3b6", "Un chantier de muret en pierre sèche, filmé pendant une année, du premier bloc à la dernière lauze.", "Rien ne tient que par l'équilibre."],
  ["dernier-metro", "Dernier métro", 2025, "animation", "Animation", "0 h 14", "lea", "sofia", "clara", "rails", "#14182a", "#c9cfee", "Un conducteur de métro découvre, au terminus, que la ligne continue dans un tunnel que personne n'a jamais dessiné.", "Un arrêt de plus."],
  ["frere-nuit", "Mon frère, la nuit", 2024, "drame", "Drame", "0 h 19", "ines", "paul", "clara", "moon", "#1a1626", "#d9d2e8", "Deux frères se parlent au téléphone toute une nuit sans jamais aborder l'objet de l'appel.", "Raccrocher n'est pas répondre."],
  ["papier-peint", "Papier peint", 2023, "animation", "Animation", "0 h 09", "lea", "sofia", "yanis", "lozenge", "#2a1c22", "#ecd0d5", "Les motifs d'un papier peint se détachent un à un du mur pour quitter l'appartement du locataire sortant.", "Les murs ont des idées."],
  ["interphone", "Interphone", 2022, "comedie", "Comédie noire", "0 h 16", "camille", "sofia", "yanis", "panel", "#1b2020", "#dfe6e1", "Un soir de réveillon, un livreur sonne au mauvais interphone et se retrouve invité à un dîner qu'on ne peut pas quitter.", "Merci de patienter."],
];
const ROWS = [
  ["Longs métrages", "Fictions", ["heures-basses", "sel-cendre", "cinquieme-etage", "maree", "fenetre-nuit", "ete-autres"]],
  ["Documentaires", "Réel", ["dernieres-salles", "voix-plomb", "mine-memoire", "pierres-vives"]],
  ["Courts métrages", "Formes brèves", ["dernier-metro", "frere-nuit", "papier-peint", "interphone"]],
];
const film = (slug) => FILMS.find((f) => f[0] === slug);
const band = (y) => (y <= 2022 ? "avant" : String(y));
const GENRES = [["drame", "Drame"], ["thriller", "Thriller"], ["comedie", "Comédie noire"], ["documentaire", "Documentaire"], ["animation", "Animation"]];

/* ---------- Illustrations SVG (sans identifiant : le filtre de sécurité les supprime) ---------- */
const MOTIF = {
  moon: (b) => `<circle cx="100" cy="112" r="48" fill="${b}" opacity=".92"/><circle cx="100" cy="112" r="84" fill="${b}" opacity=".08"/><path d="M0 214l52-34 40 22 56-40 52 36v106H0z" fill="#000" opacity=".6"/><path d="M0 246l70-20 60 14 70-18v90H0z" fill="#000" opacity=".8"/>`,
  sun: (b) => `<circle cx="100" cy="150" r="38" fill="${b}"/><g stroke="${b}" stroke-width="3" opacity=".6"><path d="M100 82v-18M52 102l-12-12M148 102l12-12M30 150H12M170 150h18"/></g><rect y="188" width="200" height="112" fill="#000" opacity=".55"/><path d="M0 188h200" stroke="${b}" stroke-width="1.5" opacity=".6"/>`,
  tower: (b) => `<rect x="62" y="70" width="52" height="230" fill="#000" opacity=".7"/><rect x="118" y="120" width="36" height="180" fill="#000" opacity=".55"/><rect x="30" y="160" width="30" height="140" fill="#000" opacity=".5"/><g fill="${b}" opacity=".85"><rect x="72" y="92" width="6" height="8"/><rect x="92" y="116" width="6" height="8"/><rect x="72" y="140" width="6" height="8"/><rect x="126" y="150" width="6" height="8"/><rect x="40" y="190" width="6" height="8"/><rect x="92" y="188" width="6" height="8"/></g><circle cx="150" cy="60" r="18" fill="${b}" opacity=".35"/>`,
  window: (b) => `<g fill="#000" opacity=".5"><rect x="30" y="60" width="140" height="190"/></g><g fill="${b}"><rect x="42" y="72" width="28" height="36" opacity=".9"/><rect x="86" y="72" width="28" height="36" opacity=".25"/><rect x="130" y="72" width="28" height="36" opacity=".25"/><rect x="42" y="124" width="28" height="36" opacity=".25"/><rect x="86" y="124" width="28" height="36" opacity=".6"/><rect x="130" y="124" width="28" height="36" opacity=".25"/><rect x="42" y="176" width="28" height="36" opacity=".25"/><rect x="86" y="176" width="28" height="36" opacity=".25"/><rect x="130" y="176" width="28" height="36" opacity=".85"/></g>`,
  wave: (b) => `<g fill="none" stroke="${b}" stroke-width="2.4"><path d="M0 130q25-22 50 0t50 0 50 0 50 0" opacity=".9"/><path d="M0 156q25-22 50 0t50 0 50 0 50 0" opacity=".7"/><path d="M0 182q25-22 50 0t50 0 50 0 50 0" opacity=".5"/><path d="M0 208q25-22 50 0t50 0 50 0 50 0" opacity=".35"/><path d="M0 234q25-22 50 0t50 0 50 0 50 0" opacity=".2"/></g><circle cx="140" cy="70" r="16" fill="${b}" opacity=".8"/>`,
  eye: (b) => `<path d="M20 140q80-70 160 0-80 70-160 0z" fill="none" stroke="${b}" stroke-width="2.6"/><circle cx="100" cy="140" r="26" fill="${b}" opacity=".85"/><circle cx="100" cy="140" r="10" fill="#000"/><g stroke="${b}" stroke-width="1.4" opacity=".4"><path d="M100 60v-30M60 72 46 50M140 72l14-22M100 220v30"/></g>`,
  seats: (b) => `<path d="M100 30 20 290H180z" fill="${b}" opacity=".12"/><g fill="#000" opacity=".7"><path d="M20 220q80-34 160 0v18q-80-34-160 0z"/><path d="M10 250q90-40 180 0v22q-90-40-180 0z"/><path d="M0 284q100-46 200 0v16H0z"/></g><rect x="70" y="40" width="60" height="6" fill="${b}"/>`,
  rings: (b) => `<g fill="none" stroke="${b}"><circle cx="100" cy="140" r="14" stroke-width="3"/><circle cx="100" cy="140" r="34" stroke-width="2.4" opacity=".8"/><circle cx="100" cy="140" r="56" stroke-width="2" opacity=".55"/><circle cx="100" cy="140" r="80" stroke-width="1.6" opacity=".35"/><circle cx="100" cy="140" r="106" stroke-width="1.2" opacity=".2"/></g>`,
  arch: (b) => `<g fill="none" stroke="${b}" stroke-width="2.4"><path d="M30 290V150a70 70 0 0 1 140 0v140" opacity=".9"/><path d="M52 290V156a48 48 0 0 1 96 0v134" opacity=".6"/><path d="M74 290V162a26 26 0 0 1 52 0v128" opacity=".4"/></g><circle cx="100" cy="190" r="6" fill="${b}"/>`,
  stones: (b) => `<g fill="#000" opacity=".5"><path d="M10 250l30-40 52 6 18 44z"/><path d="M96 262l16-52 58 8 20 44z"/><path d="M40 210l24-44 50 4 14 42z"/></g><g fill="none" stroke="${b}" stroke-width="1.6" opacity=".7"><path d="M10 250l30-40 52 6 18 44zM96 262l16-52 58 8 20 44zM40 210l24-44 50 4 14 42z"/></g>`,
  rails: (b) => `<g stroke="${b}" stroke-width="2.4" fill="none"><path d="M100 120 40 300M100 120 160 300" opacity=".85"/><path d="M100 120 76 300M100 120 124 300" opacity=".4"/></g><g stroke="${b}" stroke-width="2" opacity=".6"><path d="M92 150h16M84 180h32M74 220h52M62 270h76"/></g><circle cx="100" cy="112" r="14" fill="${b}"/>`,
  lozenge: (b) => `<g fill="none" stroke="${b}" stroke-width="2"><path d="M40 60l20 28-20 28-20-28zM100 60l20 28-20 28-20-28zM160 60l20 28-20 28-20-28zM70 130l20 28-20 28-20-28zM130 130l20 28-20 28-20-28zM40 200l20 28-20 28-20-28zM100 200l20 28-20 28-20-28zM160 200l20 28-20 28-20-28z" opacity=".75"/></g>`,
  panel: (b) => `<rect x="56" y="70" width="88" height="150" rx="6" fill="#000" opacity=".55" stroke="${b}" stroke-width="2"/><g fill="${b}"><circle cx="100" cy="100" r="9"/><circle cx="78" cy="140" r="5" opacity=".6"/><circle cx="100" cy="140" r="5" opacity=".6"/><circle cx="122" cy="140" r="5" opacity=".6"/><circle cx="78" cy="166" r="5" opacity=".6"/><circle cx="100" cy="166" r="5" opacity=".6"/><circle cx="122" cy="166" r="5" opacity=".6"/></g>`,
};
const poster = (f) => `<svg class="pe-ps" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="200" height="300" fill="${f[10]}"/><rect y="150" width="200" height="150" fill="#000" opacity=".22"/>${MOTIF[f[9]](f[11])}</svg>`;

const SCENE = `<svg class="pe-scene" viewBox="0 0 1195 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="1195" height="500" fill="#06080a"/><rect y="140" width="1195" height="110" fill="#1c2b31" opacity=".4"/><rect y="220" width="1195" height="80" fill="#455453" opacity=".3"/><rect y="280" width="1195" height="40" fill="#9a8c6b" opacity=".28"/><circle cx="830" cy="150" r="190" fill="#e9e3d2" opacity=".04"/><circle cx="830" cy="150" r="120" fill="#e9e3d2" opacity=".07"/><circle cx="830" cy="150" r="64" fill="#ece6d6"/><path d="M0 300l120-52 120 36 140-60 140 52 140-40 160 50 160-56 120 40 95-26v116H0z" fill="#0c1316"/><path d="M0 332l200-26 220 22 280-28 250 24 245-18v54H0z" fill="#04070a"/><rect y="324" width="1195" height="176" fill="#030405"/><path d="M566 324h68l236 176H330z" fill="#0d1011"/><path d="M566 324 330 500M634 324 870 500" stroke="#2a3235" stroke-width="2"/><g fill="#3b4548"><path d="M598 326h4l8 36h-20z"/><path d="M596 376h8l12 52h-32z"/><path d="M592 446h16l18 54h-52z"/></g><g stroke="#000" stroke-width="3" fill="none"><path d="M180 190v150M150 205h60M170 214l-12 12M190 214l12 12"/><path d="M360 232v100M340 242h40" stroke-width="2.4"/><path d="M470 270v58M458 276h24" stroke-width="2"/></g><path d="M180 205Q270 222 360 242T470 276" stroke="#000" stroke-width="1.4" fill="none" opacity=".8"/><polygon points="600,338 540,404 660,404" fill="#f3eed9" opacity=".05"/><rect x="592" y="334" width="16" height="7" fill="#000"/><circle cx="595" cy="338" r="2.4" class="pe-dot"/><circle cx="605" cy="338" r="2.4" class="pe-dot"/><g fill="none" stroke="#06080a" stroke-width="2.2"><path d="M880 86q8-9 16 0 8-9 16 0M930 106q6-7 12 0 6-7 12 0M700 60q6-7 12 0 6-7 12 0"/></g></svg>`;

const FRAMES = [
  `<rect width="240" height="100" fill="#13202a"/><circle cx="170" cy="36" r="16" fill="#e6dfc9"/><path d="M0 70l50-20 50 14 60-24 80 22v38H0z" fill="#050709"/>`,
  `<rect width="240" height="100" fill="#2a1d1b"/><rect x="40" y="18" width="52" height="70" fill="#e8cf9d" opacity=".8"/><rect x="100" y="18" width="52" height="70" fill="#000" opacity=".5"/><path d="M60 88v-30" stroke="#000" stroke-width="3"/>`,
  `<rect width="240" height="100" fill="#161a24"/><path d="M20 50q100-60 200 0-100 60-200 0z" fill="none" stroke="#cfd3df" stroke-width="2"/><circle cx="120" cy="50" r="14" fill="#cfd3df"/><circle cx="120" cy="50" r="5" fill="#000"/>`,
  `<rect width="240" height="100" fill="#102a33"/><path d="M0 50q30-14 60 0t60 0 60 0 60 0M0 68q30-14 60 0t60 0 60 0 60 0M0 86q30-14 60 0t60 0 60 0 60 0" fill="none" stroke="#bfd3d1" stroke-width="2" opacity=".7"/>`,
  `<rect width="240" height="100" fill="#1d1517"/><path d="M120 6 70 100h100z" fill="#e2c9bd" opacity=".14"/><path d="M0 84q120-30 240 0v16H0z" fill="#000" opacity=".7"/>`,
  `<rect width="240" height="100" fill="#2b2216"/><circle cx="60" cy="58" r="22" fill="#ecd9a4"/><rect y="70" width="240" height="30" fill="#000" opacity=".6"/>`,
];
const frame = (i) => `<svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${FRAMES[i % FRAMES.length]}</svg>`;

const logo = `<svg class="pe-logo" viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="8" width="34" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 14h34M3 26h34" stroke="currentColor" stroke-width="1.6"/><circle cx="20" cy="20" r="3.6" class="pe-dot"/><path d="M8 11h2M14 11h2M24 11h2M30 11h2M8 29h2M14 29h2M24 29h2M30 29h2" stroke="currentColor" stroke-width="1.6"/></svg>`;
const playIco = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>`;
const arrowIco = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

/* ---------- En-tête, barre de chapitres, pied ---------- */
const keyOf = (u) => (u === "/" ? "accueil" : u.slice(1));
const header = (c, cur) => {
  const items = c.menu.map((m, i) => ({ ...m, n: String(i + 1).padStart(2, "0"), on: keyOf(m.url) === cur }));
  const here = items.find((m) => m.on) || { n: "—", label: "Pellicule" };
  const ch = (m, cls) => `<a class="${cls}" href="${esc(m.url)}"${m.on ? ' aria-current="page"' : ""}><b>${m.n}</b><span>${esc(m.label)}</span></a>`;
  return `<header class="pe-top pk-bleed"><div class="pe-grain" aria-hidden="true"></div>
  <div class="pe-top-in"><a class="pe-brand" href="/">${logo}<span class="pe-brand-t"><strong>Pellicule</strong><small>Productions cinéma</small></span></a>
  <div class="pe-top-r"><span class="pe-tc" data-tc aria-hidden="true">00:00:00:00</span><a class="pe-top-l" href="/recherche">Rechercher</a></div></div></header>
  <div class="pe-chap pk-bleed"><span class="pe-prog" aria-hidden="true"></span>
  <div class="pe-chap-list" role="navigation" aria-label="Chapitres du site">${items.map((m) => ch(m, "pe-ch")).join("")}</div>
  <details class="pe-chap-m"><summary aria-label="Ouvrir les chapitres"><span class="pe-cur"><b>${here.n}</b> ${esc(here.label)}</span><span class="pe-more">Chapitres</span></summary>
  <div class="pe-sheet" role="navigation" aria-label="Chapitres (mobile)">${items.map((m) => ch(m, "pe-ch")).join("")}<a class="pe-ch pe-ch--s" href="/recherche"><b>—</b><span>Rechercher</span></a></div></details></div>`;
};
const footer = (c) => `<footer class="pe-end pk-bleed"><div class="pe-end-in">
  <div class="pe-end-fin"><span class="pe-fin" aria-hidden="true">FIN</span><p>Pellicule — films de fiction, documentaires et courts métrages, produits à Lyon depuis 2009.</p></div>
  <div class="pe-end-cols"><div><h3>Chapitres</h3>${nav(c.menu.slice(0, 5), "pe-fl")}</div><div><h3>Maison</h3><a class="pe-fl" href="/contact">Soumettre un scénario</a><a class="pe-fl" href="/contact">Presse et ventes</a><a class="pe-fl" href="/recherche">Recherche</a></div>
  <div><h3>Atelier</h3><address class="pe-addr">12 quai des Teinturiers<br>69002 Lyon<br><a class="pe-fl" href="mailto:bonjour@pellicule.example">bonjour@pellicule.example</a></address></div></div>
  <p class="pe-legal">© Pellicule — site de démonstration. Films, personnes, festivals et dates sont fictifs. Projeté en 2,39:1.</p></div></footer>`;

/* ---------- Briques ---------- */
const pagehead = (n, kicker, title, sub) => sec(`<section class="pe-ph pk-bleed"><div class="pe-wrap"><p class="pe-k" data-reveal><span>Chapitre ${n}</span> ${esc(kicker)}</p><div class="pe-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="pe-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);
const trig = (f, label = "Bande-annonce", cls = "pe-btn pe-btn--acc") => `<a class="${cls}" href="#bande-annonce" data-pe-trailer data-p="${f[0]}" data-t="${esc(f[1])}" data-by="${esc(PEOPLE[f[6]])}" data-tag="${esc(f[13])}" data-g="${esc(f[4])} · ${f[2]}">${playIco}<span>${esc(label)}</span></a>`;
const tech = (f) => [["Réalisation", PEOPLE[f[6]]], ["Image", PEOPLE[f[7]]], ["Musique", PEOPLE[f[8]]], ["Durée", f[5]], ["Format", f[3] === "documentaire" ? "1,85:1 · Couleur" : "2,39:1 · Scope"], ["Son", f[3] === "documentaire" ? "Stéréo" : "5.1"], ["Langue", "Français"]];
const dl = (rows) => `<dl class="pe-dl">${rows.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>`;
const card = (slug) => {
  const f = film(slug);
  return `<li class="pe-film" data-slug="${f[0]}" data-year="${f[2]}" data-band="${band(f[2])}" data-genre="${f[3]}">
  <a class="pe-poster" href="#${f[0]}" data-pe-film="${f[0]}" aria-label="Ouvrir la fiche du film ${esc(f[1])}, ${f[2]}">${poster(f)}<span class="pe-pt">${esc(f[1])}</span><span class="pe-pgo">Fiche film</span></a>
  <div class="pe-fm"><span>${f[2]}</span><span>${esc(f[4])}</span><span>${f[5]}</span></div>
  <div class="pe-fiche"><p class="pe-fk">${esc(f[4])} · ${f[2]} · ${f[5]}</p><div class="pe-fh" role="heading" aria-level="2">${esc(f[1])}</div><p class="pe-fsyn">${esc(f[12])}</p>${dl(tech(f))}
  <div class="pe-fact">${trig(f)}<a class="pe-btn pe-btn--line" href="${f[0] === "heures-basses" ? "/fiche" : "/contact"}">${f[0] === "heures-basses" ? "Page du film" : "Demander le dossier"}</a></div></div></li>`;
};
const rowsec = (title, kick, slugs, n) => `<section class="pe-rowsec" data-pe-rowsec><div class="pe-wrap pe-rowhead"><div><p class="pe-k pe-k--s">${esc(kick)}</p><h2 class="pe-h2">${esc(title)}</h2></div>
  <div class="pe-arrows" role="group" aria-label="Défiler la rangée ${esc(title)}"><a class="pe-arr" href="#precedent" data-pe-nav="-1" aria-label="Films précédents">${arrowIco}</a><a class="pe-arr pe-arr--n" href="#suivant" data-pe-nav="1" aria-label="Films suivants">${arrowIco}</a></div></div>
  <ul class="pe-row">${slugs.map(card).join("")}</ul></section>`;

const chips = (axis, label, vals) => `<div class="pe-fgroup" role="group" aria-label="Filtrer par ${label}"><span class="pe-flab">${label}</span>${vals.map(([v, l], i) => `<a class="pe-chip" href="#${axis}-${v}" role="button" data-axis="${axis}" data-val="${v}" aria-pressed="${i === 0 ? "true" : "false"}">${esc(l)}</a>`).join("")}</div>`;

const reel = () => `<section class="pe-reel pk-bleed" aria-label="Photogrammes"><div class="pe-reel-track">${[0, 1].map((k) => `<div class="pe-reel-set"${k ? ' aria-hidden="true"' : ""}>${FRAMES.map((_, i) => `<figure class="pe-frame">${frame(i)}<figcaption>${["Les Heures Basses", "Le Cinquième Étage", "Fenêtre sur nuit", "Ce que dit la marée", "Les Dernières Salles", "L'Été des autres"][i]} · plan ${12 + i * 7}</figcaption></figure>`).join("")}</div>`).join("")}</div></section>`;

const CREDITS = [["Une production", "Pellicule"], ["Direction de production", "Nadia Benhamou"], ["Production déléguée", "Agnès Valtat · Mathieu Orsini"], ["Développement et écriture", "Jeanne Colin"], ["Réalisations associées", "Inès Marchetti · Karim Delorme · Camille Roussel · Hugo Vasseur · Léa Fontaine"], ["Direction de la photographie", "Paul Garnier"], ["Montage", "Sofia Lenoir"], ["Son et mixage", "Théo Marchand"], ["Musique originale", "Clara Dubois"], ["Étalonnage", "Yanis Aït"], ["Ventes et festivals", "Mélanie Roy"], ["Administration", "Olivier Peyrot"], ["Tourné en", "Pellicule 35 mm et capteur numérique"], ["Remerciements", "Aux équipes, aux salles de village et à tous ceux qui sont restés jusqu'à la fin du générique"]];
const credits = () => `<section class="pe-credits pk-bleed" aria-label="Générique de la maison"><div class="pe-wrap pe-credits-in"><div class="pe-credits-l"><p class="pe-k" data-reveal><span>Générique</span> Ceux qui font les films</p><h2 class="pe-h2" data-reveal>Seize personnes, un seul plateau.</h2><p class="pe-sub" data-reveal>Une petite équipe permanente, des techniciens fidèles et des auteurs que nous accompagnons de l'écriture à la salle. Le générique défile ici comme à la fin d'une séance.</p><a class="pe-btn pe-btn--line" href="/equipe" data-reveal>Toute l'équipe ${arrowIco}</a></div>
  <div class="pe-roll" aria-label="Générique défilant"><div class="pe-roll-track">${[0, 1].map((k) => `<div class="pe-roll-set"${k ? ' aria-hidden="true"' : ""}>${CREDITS.map(([r, n]) => `<p class="pe-cr"><small>${esc(r)}</small><strong>${esc(n)}</strong></p>`).join("")}</div>`).join("")}</div></div></div></section>`;

/* ---------- Accueil ---------- */
const hf = film("heures-basses");
const home = (c) => [
  sec(header(c, "accueil")),
  sec(`<section class="pe-hero pk-bleed"><div class="pe-wrap pe-hero-top"><p class="pe-k" data-reveal><span>Nouveau</span> Séance d'ouverture</p><p class="pe-hero-meta" data-reveal>Fiction · Lyon · 2,39:1</p></div>
  <div class="pe-stage" data-reveal><div class="pe-flick">${SCENE}</div><div class="pe-beam" aria-hidden="true"></div>
    <div class="pe-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="pe-rec" aria-hidden="true"><i></i> Bande-annonce 00:30</p>
    <a class="pe-play" href="#bande-annonce" data-pe-trailer data-p="scene" data-t="${esc(hf[1])}" data-by="${esc(PEOPLE[hf[6]])}" data-tag="${esc(hf[13])}" data-g="${esc(hf[4])} · ${hf[2]}" aria-label="Lancer la bande-annonce simulée de ${esc(hf[1])}">${playIco}</a>
    <p class="pe-subtitle" aria-hidden="true">« Il y a des routes qu'on ne prend qu'une fois. »</p></div>
  <div class="pe-wrap pe-hero-low"><div class="pe-hero-copy"><div class="pe-h1" role="heading" aria-level="1" data-reveal>Pellicule produit des films qui restent allumés après la séance.</div>
    <p class="pe-lead" data-reveal>Société de production indépendante : fictions d'auteur, documentaires et courts métrages, de l'écriture à la salle.</p>
    <div class="pe-actions" data-reveal>${trig(hf, "Lancer la bande-annonce")}<a class="pe-btn pe-btn--line" href="/films">Parcourir la filmographie ${arrowIco}</a></div></div>
    <dl class="pe-slate" data-reveal><div><dt>À l'affiche</dt><dd>${esc(hf[1])}</dd></div><div><dt>Réalisation</dt><dd>${esc(PEOPLE[hf[6]])}</dd></div><div><dt>Durée</dt><dd>${hf[5]}</dd></div><div><dt>Sortie</dt><dd>Automne 2026</dd></div></dl></div></section>`),
  sec(`<section class="pe-band pk-bleed"><div class="pe-wrap"><ul class="pe-figs" aria-label="Chiffres de la maison"><li data-reveal><b data-count="28">28</b><span>films produits depuis 2009</span></li><li data-reveal><b data-count="14">14</b><span>titres au catalogue actuel</span></li><li data-reveal><b data-count="61">61</b><span>sélections en festivals (démonstration)</span></li><li data-reveal><b data-count="16">16</b><span>personnes à l'année</span></li></ul></div></section>`),
  sec(`<section class="pe-rowwrap pk-bleed"><div class="pe-wrap pe-intro"><p class="pe-k" data-reveal><span>Filmographie</span> À l'affiche</p><p class="pe-sub" data-reveal>Cliquez sur une affiche pour ouvrir la fiche : synopsis, fiche technique et bande-annonce simulée.</p></div>${rowsec("Dernières séances", "Récents", ["heures-basses", "dernieres-salles", "sel-cendre", "cinquieme-etage", "dernier-metro", "maree"])}<div class="pe-wrap pe-more-l"><a class="pe-btn pe-btn--line" href="/films">Les 14 films, avec filtres ${arrowIco}</a></div></section>`),
  sec(`<section class="pe-creed pk-bleed"><div class="pe-wrap pe-creed-in"><div data-reveal><p class="pe-k"><span>Parti pris</span> Trois promesses</p><h2 class="pe-h2">Nous prenons le temps de regarder.</h2></div>
  <ol class="pe-oath"><li data-reveal><b>01</b><div><h3>La durée</h3><p>Dix-huit mois de développement en moyenne : le temps qu'un scénario devienne un film et pas seulement un budget.</p></div></li><li data-reveal><b>02</b><div><h3>La lumière</h3><p>Tournages en pellicule quand le sujet le demande, numérique quand il le mérite. Toujours un chef opérateur dès l'écriture.</p></div></li><li data-reveal><b>03</b><div><h3>La salle</h3><p>Chaque film est pensé pour être vu à plusieurs, dans le noir, avant de l'être chez soi.</p></div></li></ol></div></section>`),
  sec(reel()),
  sec(`<section class="pe-fest pk-bleed"><div class="pe-wrap"><p class="pe-k" data-reveal><span>Festivals</span> Prochaines projections</p><ul class="pe-fest-list">${[["12 nov.", "Festival du film de Port-Valdor", "Les Heures Basses", "Compétition"], ["03 déc.", "Rencontres du court de Valmont", "Dernier métro", "Panorama animation"], ["21 janv.", "Biennale du documentaire de Rives", "Les Dernières Salles", "Séance spéciale"]].map(([d, f, t, s]) => `<li data-reveal><time>${d}</time><div><strong>${f}</strong><span>${t} · ${s}</span></div></li>`).join("")}</ul><a class="pe-btn pe-btn--line" href="/actualites">Tout le calendrier ${arrowIco}</a></div></section>`),
  sec(credits()),
  sec(`<section class="pe-cta pk-bleed"><div class="pe-wrap pe-cta-in"><h2 class="pe-h2" data-reveal>Vous avez un scénario, un sujet, une salle ?</h2><p class="pe-sub" data-reveal>Écrivez-nous une page : nous lisons tout et répondons à chaque envoi.</p><a class="pe-btn pe-btn--acc" href="/contact" data-reveal>Écrire à la production ${arrowIco}</a></div></section>`),
  sec(footer(c)),
];

/* ---------- Films ---------- */
const films = (c) => [
  sec(header(c, "films")),
  pagehead("02", "Filmographie", "Quatorze films, trois rangées.", "Filtrez par année et par genre. Chaque affiche ouvre une fiche : synopsis, fiche technique, bande-annonce simulée."),
  sec(`<section class="pe-fbar pk-bleed"><div class="pe-wrap pe-fbar-in">${chips("annee", "Année", [["all", "Toutes"], ["2026", "2026"], ["2025", "2025"], ["2024", "2024"], ["2023", "2023"], ["avant", "2022 et avant"]])}${chips("genre", "Genre", [["all", "Tous"], ...GENRES])}<p class="pe-count" role="status" aria-live="polite"><b data-pe-count>14</b> films affichés</p></div></section>`),
  ...ROWS.map(([t, k, s], i) => sec(`<section class="pe-rowwrap pk-bleed pe-rowwrap--films">${rowsec(t, k, s, i)}</section>`)),
  sec(`<section class="pe-rowwrap pk-bleed pe-rowwrap--films"><div class="pe-wrap"><p class="pe-empty" data-pe-empty>Aucun film ne correspond à cette combinaison. <a href="#annee-all" data-pe-reset>Réinitialiser les filtres</a>.</p></div></section>`),
  sec(footer(c)),
];

/* ---------- Fiche film ---------- */
const GALLERY = [["Le plan d'ouverture : la route avant l'orage", 0], ["La chambre 14, un jeu d'ombres au plafond", 1], ["Le frère, face à la fenêtre", 2]];
const fiche = (c) => [
  sec(header(c, "fiche")),
  sec(`<section class="pe-fh-hero pk-bleed"><div class="pe-wrap"><div class="pe-stage pe-stage--s"><div class="pe-flick">${SCENE}</div><div class="pe-beam" aria-hidden="true"></div><div class="pe-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <a class="pe-play" href="#bande-annonce" data-pe-trailer data-p="scene" data-t="${esc(hf[1])}" data-by="${esc(PEOPLE[hf[6]])}" data-tag="${esc(hf[13])}" data-g="${esc(hf[4])} · ${hf[2]}" aria-label="Lancer la bande-annonce simulée">${playIco}</a></div>
  <div class="pe-fh-title"><div><p class="pe-k" data-reveal><span>Chapitre 03</span> À l'affiche · Automne 2026</p><div class="pe-h1" role="heading" aria-level="1" data-reveal>Les Heures Basses</div><p class="pe-lead" data-reveal>${esc(hf[13])}</p></div>
  <ul class="pe-tags" data-reveal><li>Drame</li><li>1 h 52</li><li>2,39:1</li><li>Tous publics (démo)</li></ul></div></div></section>`),
  sec(`<section class="pe-fbody pk-bleed"><div class="pe-wrap pe-fbody-in"><div class="pe-fcol">
    <div data-reveal><h2 class="pe-h2">Synopsis</h2><p class="pe-big">${esc(hf[12])}</p><p>Le film s'écrit en une nuit et une journée. Entre l'hôpital et la route, Inès Marchetti filme des gestes plutôt que des explications : une main qui tient un volant, une lampe de poche, une porte qu'on n'ose pas fermer.</p></div>
    <div data-reveal><h2 class="pe-h2">Note d'intention</h2><blockquote class="pe-quote"><p>« Je voulais un film où l'on entend le silence entre deux phrases. Où la nuit n'est pas un décor, mais un personnage qui laisse enfin parler les autres. »</p><footer>Inès Marchetti, réalisatrice <small>(texte de démonstration)</small></footer></blockquote></div>
    <div data-reveal><h2 class="pe-h2">Photogrammes</h2><div class="pe-gal">${GALLERY.map(([l, i]) => `<figure>${frame(i)}<figcaption>${esc(l)}</figcaption></figure>`).join("")}</div></div>
    <div data-reveal><h2 class="pe-h2">Distribution</h2><ul class="pe-cast">${[["Anouk Delaye", "Mathilde"], ["Samir Haddad", "Étienne, le frère"], ["Josiane Pérot", "La standardiste"], ["Marc Lebon", "Le garagiste"]].map(([a, r]) => `<li><strong>${a}</strong><span>${r}</span></li>`).join("")}</ul><p class="pe-note">Comédiens fictifs, pour la démonstration.</p></div>
  </div>
  <aside class="pe-side" aria-label="Fiche technique"><div class="pe-poster pe-poster--s">${poster(hf)}<span class="pe-pt">${esc(hf[1])}</span></div><h2 class="pe-h3">Fiche technique</h2>${dl([...tech(hf), ["Scénario", "Jeanne Colin, Inès Marchetti"], ["Montage", "Sofia Lenoir"], ["Production", "Pellicule"], ["Ventes", "Mélanie Roy"]])}<div class="pe-fact">${trig(hf, "Bande-annonce")}<a class="pe-btn pe-btn--line" href="/contact">Demander le dossier de presse</a></div></aside></div></section>`),
  sec(`<section class="pe-rowwrap pk-bleed"><div class="pe-wrap pe-intro"><p class="pe-k"><span>Dans la même salle</span> Du même univers</p></div>${rowsec("À voir ensuite", "Sélection", ["maree", "sel-cendre", "dernieres-salles", "frere-nuit"])}</section>`),
  sec(footer(c)),
];

/* ---------- Équipe ---------- */
const DEPTS = [
  ["Direction", "Production", [["Productrice, fondatrice", "Agnès Valtat"], ["Producteur délégué", "Mathieu Orsini"], ["Directrice de production", "Nadia Benhamou"], ["Administration", "Olivier Peyrot"]]],
  ["Écriture", "Auteurs associés", [["Développement", "Jeanne Colin"], ["Réalisation", "Inès Marchetti"], ["Réalisation", "Karim Delorme"], ["Réalisation", "Camille Roussel"], ["Documentaires", "Hugo Vasseur"], ["Animation", "Léa Fontaine"]]],
  ["Fabrication", "Image, son, montage", [["Direction de la photographie", "Paul Garnier"], ["Montage", "Sofia Lenoir"], ["Son et mixage", "Théo Marchand"], ["Musique originale", "Clara Dubois"], ["Étalonnage", "Yanis Aït"]]],
  ["Diffusion", "Salles et festivals", [["Ventes et festivals", "Mélanie Roy"], ["Relations salles", "Bastien Morel"], ["Presse", "Élodie Garnier"]]],
];
const equipe = (c) => [
  sec(header(c, "equipe")),
  pagehead("04", "L'équipe", "Au générique, dans l'ordre d'apparition.", "Une maison de seize personnes. Pas de hiérarchie à l'écran : chacun apparaît en lettres égales."),
  sec(`<section class="pe-team pk-bleed"><div class="pe-wrap">${DEPTS.map(([n, sub, rows], i) => `<div class="pe-dept" data-reveal><div class="pe-dept-h"><span class="pe-dept-n">${String(i + 1).padStart(2, "0")}</span><h2 class="pe-h3">${n}</h2><p>${sub}</p></div><ul class="pe-dept-l">${rows.map(([r, p]) => `<li><span>${r}</span><i aria-hidden="true"></i><strong>${p}</strong></li>`).join("")}</ul></div>`).join("")}</div></section>`),
  sec(`<section class="pe-slates pk-bleed"><div class="pe-wrap"><p class="pe-k" data-reveal><span>Claps</span> Les réalisateurs associés</p><div class="pe-slate-grid">${[["ines", "Drames intimes", "Les Heures Basses"], ["karim", "Thrillers", "Sel et Cendre"], ["camille", "Comédies noires", "Le Cinquième Étage"], ["hugo", "Documentaire", "Les Dernières Salles"]].map(([k, g, t]) => `<article class="pe-clap" data-reveal><div class="pe-clap-top" aria-hidden="true"></div><svg class="pe-sil" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="28" r="14" fill="currentColor"/><path d="M10 80c0-22 12-34 30-34s30 12 30 34z" fill="currentColor"/></svg><h3>${PEOPLE[k]}</h3><p>${g}</p><small>Dernier film : ${t}</small></article>`).join("")}</div></div></section>`),
  sec(`<section class="pe-cta pk-bleed"><div class="pe-wrap pe-cta-in"><h2 class="pe-h2">Envie de rejoindre le plateau ?</h2><p class="pe-sub">Stages, techniciens, auteurs : écrivez-nous.</p><a class="pe-btn pe-btn--acc" href="/contact">Nous écrire ${arrowIco}</a></div></section>`),
  sec(footer(c)),
];

/* ---------- Actualités / festivals ---------- */
const FEST = [
  ["12–19 nov. 2026", "Port-Valdor", "Festival du film de Port-Valdor", "Les Heures Basses", "Compétition fiction"],
  ["03–06 déc. 2026", "Valmont", "Rencontres du court de Valmont", "Dernier métro", "Panorama animation"],
  ["21–28 janv. 2027", "Rives", "Biennale du documentaire de Rives", "Les Dernières Salles", "Séance spéciale"],
  ["09–14 mars 2027", "Montclair", "Festival de Montclair", "Fenêtre sur nuit", "Rétrospective"],
  ["02–08 juin 2027", "Saint-Aurèle", "Semaine du cinéma indépendant", "Ce que dit la marée", "Hors compétition"],
];
const NEWS = [
  ["28 oct. 2026", "Les Heures Basses retenu en compétition", "Le film d'Inès Marchetti ouvrira la compétition fiction du festival de Port-Valdor, en présence de l'équipe.", "Festival"],
  ["14 oct. 2026", "Fin de tournage pour « Mon prochain voyage »", "Cinq semaines en Bretagne, dix-huit jours de nuit : le tournage s'est achevé hier, le montage commence lundi.", "Tournage"],
  ["02 oct. 2026", "Une carte blanche à la Cinémathèque de Valmont", "Quatre séances, quatre films de la maison, présentés par leurs auteurs. Entrée libre dans la limite des places.", "Salles"],
  ["19 sept. 2026", "Le catalogue s'enrichit d'un court d'animation", "« Dernier métro » rejoint les autres courts de la maison et circule dès novembre dans les festivals.", "Catalogue"],
];
const actualites = (c) => [
  sec(header(c, "actualites")),
  pagehead("05", "Festivals et actualités", "Le journal de bord de la maison.", "Sélections, tournages, séances spéciales. Tous les festivals cités sont fictifs."),
  sec(`<section class="pe-cal pk-bleed"><div class="pe-wrap"><h2 class="pe-h2" data-reveal>Calendrier des projections</h2><table class="pe-tbl" data-reveal><caption class="pe-sr">Projections prévues dans les festivals</caption><thead><tr><th scope="col">Dates</th><th scope="col">Festival</th><th scope="col">Ville</th><th scope="col">Film</th><th scope="col">Section</th></tr></thead><tbody>${FEST.map(([d, v, f, t, s]) => `<tr><td data-label="Dates"><time>${d}</time></td><td data-label="Festival"><strong>${f}</strong></td><td data-label="Ville">${v}</td><td data-label="Film">${t}</td><td data-label="Section">${s}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="pe-log pk-bleed"><div class="pe-wrap pe-log-in"><div class="pe-log-l"><p class="pe-k" data-reveal><span>Journal</span> Derniers rushes</p><p class="pe-sub" data-reveal>Lisez les nouvelles dans l'ordre du montage : la plus récente en haut.</p></div><ol class="pe-reels">${NEWS.map(([d, t, p, tag], i) => `<li class="pe-reelitem" data-reveal><div class="pe-reelmark" aria-hidden="true"><span>${String(NEWS.length - i).padStart(2, "0")}</span></div><article><p class="pe-meta"><time>${d}</time><mark>${tag}</mark></p><h3 class="pe-h4">${t}</h3><p>${p}</p></article></li>`).join("")}</ol></div></section>`),
  sec(`<section class="pe-cta pk-bleed"><div class="pe-wrap pe-cta-in"><h2 class="pe-h2">Presse, programmateurs, acheteurs</h2><p class="pe-sub">Dossiers de presse et liens de visionnage sur demande.</p><a class="pe-btn pe-btn--acc" href="/contact">Demander un visionnage ${arrowIco}</a></div></section>`),
  sec(footer(c)),
];

/* ---------- Contact, recherche, introuvable ---------- */
const contact = (c) => [
  sec(header(c, "contact")),
  pagehead("06", "Contact", "Écrire à la production.", "Scénarios, presse, programmation : un seul formulaire, une réponse à chaque envoi."),
  sec(`<section class="pe-ct pk-bleed"><div class="pe-wrap"><div class="pe-ct-grid">${[["Scénarios et projets", "Une page de présentation suffit. Pas de pièce jointe : nous vous répondrons pour la suite.", "Délai de réponse : trois semaines"], ["Presse et festivals", "Visionnages, dossiers de presse, demandes d'interview des réalisateurs.", "Réponse sous deux jours ouvrés"], ["Salles et programmation", "Copies, accompagnements, séances en présence de l'équipe.", "Réponse sous une semaine"]].map(([t, p, d]) => `<article class="pe-slip" data-reveal><h2 class="pe-h4">${t}</h2><p>${p}</p><small>${d}</small></article>`).join("")}</div>
  <address class="pe-addr pe-addr--b" data-reveal><strong>Pellicule — Productions cinéma</strong><br>12 quai des Teinturiers, 69002 Lyon<br><a href="mailto:bonjour@pellicule.example">bonjour@pellicule.example</a></address></div></section>`),
  { type: "form", heading: "Le bordereau de production", intro: "Dites-nous qui vous êtes et ce que vous cherchez. Nous lisons tout." },
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c, "recherche")),
  pagehead("—", "Recherche", "Chercher dans le catalogue.", "Un titre, un réalisateur, un festival."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Un titre, un nom, un festival…" } }] },
  sec(`<section class="pe-sugg pk-bleed"><div class="pe-wrap"><p class="pe-k"><span>Raccourcis</span> Parcourir par genre</p><div class="pe-sugg-l">${GENRES.map(([k, l]) => `<a class="pe-chip" href="/films#genre-${k}">${l}</a>`).join("")}<a class="pe-chip" href="/fiche">À l'affiche</a><a class="pe-chip" href="/actualites">Festivals</a></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c, "introuvable")),
  sec(`<section class="pe-404 pk-bleed"><div class="pe-wrap pe-404-in"><div class="pe-leader" aria-hidden="true"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="100" cy="100" r="66" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".6"/><path d="M8 100h184M100 8v184" stroke="currentColor" stroke-width="1.4" opacity=".6"/><path d="M100 100 100 8A92 92 0 0 1 192 100z" fill="currentColor" opacity=".1" class="pe-sweep"/></svg><span class="pe-leader-n">404</span></div>
  <div><p class="pe-k"><span>Plan coupé</span> Erreur 404</p><div class="pe-h1" role="heading" aria-level="1">Cette scène a été coupée au montage.</div><p class="pe-lead">La page demandée n'existe pas ou a changé d'adresse. Revenons à la séance.</p><div class="pe-actions"><a class="pe-btn pe-btn--acc" href="/">Retour à l'accueil</a><a class="pe-btn pe-btn--line" href="/films">Voir les films</a><a class="pe-btn pe-btn--line" href="/recherche">Rechercher</a></div></div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "pellicule", name: "Pellicule", version: "2.0.0", category: "divertissement", tags: ["sombre", "classique", "editorial"], siteType: "Société de production cinéma", featured: true,
  concept: "Une salle noire : hero en letterbox 2,39 avec bande-annonce simulée, filmographie en rangées horizontales à fiche film en panneau, générique de fin et barre de chapitres fixée en bas.",
  description: "Société de production cinéma : noir grain argentique, letterbox 2,39 avec bande-annonce simulée, filmographie filtrable par année et genre, fiche film en panneau, équipe en générique, calendrier de festivals.",
  brand: "Pellicule", modules: ["formulaires", "recherche"],
  dna: { header: "barre-de-chapitres-fixe-en-bas", hero: "letterbox-2-39-avec-bande-annonce-simulee", grid: "rangees-de-films-horizontales", motion: "grain-argentique-projecteur-et-generique-defilant", shapes: "perforations-de-pellicule-bandes-noires-et-claps", rhythm: "sequence-de-seances-et-generique-de-fin", signature: "filmographie-filtrable-fiche-film-et-lecteur-de-bande-annonce" },
  tokens: {
    colors: { primary: "#ee4b39", secondary: "#141414", accent: "#ece7da", background: "#0a0a0a", surface: "#141414", text: "#ece7da", muted: "#a39e92", success: "#6fbf8a", warning: "#e0b24a", error: "#ff7a6b" },
    fonts: { heading: "font.cinzel", body: "font.dm-mono", button: "font.dm-mono", link: "font.dm-mono" },
    radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#2c2c2c" },
    type: { h1: { size: 52, weight: 500, lineHeight: 1.12, transform: "none" }, h2: { size: 34, weight: 500, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent", type: "color", default: "#ee4b39" },
    { key: "grain", label: "Grain argentique", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masqué"]] },
    { key: "ratio", label: "Format de l'image", type: "choice", default: "239", choices: [["239", "Scope 2,39:1"], ["185", "Standard 1,85:1"]] },
    { key: "timecode", label: "Timecode en en-tête", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "bar", label: "Barre de chapitres", type: "choice", default: "fixed", choices: [["fixed", "Fixée en bas"], ["flow", "Dans la page"]] },
  ],
  menu: [["Accueil", "/"], ["Films", "/films"], ["À l'affiche", "/fiche"], ["Équipe", "/equipe"], ["Festivals", "/actualites"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "films", name: "Films", render: films }, { key: "fiche", name: "Fiche film", render: fiche },
    { key: "equipe", name: "Équipe", render: equipe }, { key: "actualites", name: "Festivals et actualités", render: actualites }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
