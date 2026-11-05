// Signature — portfolio personnel / CV d'un·e designer-développeur·se (personnage fictif : Lou Verdier).
// Direction artistique : carnet d'une main — le nom en très grand (Gloock), ratures et annotations manuscrites (Caveat), surligneur vert émeraude sur papier ivoire, filets d'encre.
// Composant signature : parcours (expériences, formations, compétences) filtrable + projets filtrables (discipline, technologie, année) en liste ou vignettes avec fiche en panneau + CV imprimable.
const { sec, form, esc, nav } = require("../kit");

const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const scribble = (cls = "") => `<svg class="sg-scrib ${cls}" viewBox="0 0 400 24" aria-hidden="true"><path d="M4 16C60 4 120 22 190 10S330 20 396 6" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/></svg>`;
const loopArrow = (cls = "") => `<svg class="sg-loop ${cls}" viewBox="0 0 120 90" aria-hidden="true"><path d="M6 8C40 2 78 14 70 40S28 52 40 30s60-6 68 44" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M92 62l16 14 6-20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const MAIL = "bonjour@louverdier.example";

const header = (c) => `<header class="sg-head pk-bleed"><div class="sg-bar">
  <a class="sg-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="sg-logo-l">L</span><span class="sg-logo-t">ou Verdier</span></a>
  <div class="sg-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}<span class="sg-ind" aria-hidden="true"></span></div>
  <a class="sg-avail" href="/contact"><i aria-hidden="true"></i>Dispo janvier 2027</a>
  <details class="sg-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><div class="sg-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="sg-btn" href="/contact">Me contacter ${arrow}</a></div></details>
</div></header>`;

const footer = (c) => `<footer class="sg-foot pk-bleed"><div class="sg-wrap">
  <p class="sg-foot-hand" aria-hidden="true">à bientôt, j'espère</p>
  <div class="sg-foot-word" aria-hidden="true">Lou Verdier</div>
  <div class="sg-foot-grid"><div><p class="sg-foot-lead">Designer et développeuse indépendante, à Lyon. Je réponds en général sous deux jours ouvrés.</p><a class="sg-ul" href="mailto:${MAIL}">${MAIL}</a></div>
  <div><h3>Pages</h3>${nav(c.menu.slice(1), "sg-fl")}</div>
  <div><h3>Utile</h3><a class="sg-fl" href="/parcours">Télécharger le CV</a><a class="sg-fl" href="/recherche">Rechercher</a><a class="sg-fl" href="/contact">Écrire</a></div></div>
  <p class="sg-legal">© Lou Verdier — site de démonstration. Personnage, clients et projets fictifs.</p></div></footer>`;

const pagehead = (kicker, title, sub, extra = "") => sec(`<section class="sg-ph pk-bleed"><div class="sg-wrap"><p class="sg-kicker" data-reveal>${esc(kicker)}</p><div class="sg-giant" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="sg-ph-sub" data-reveal>${esc(sub)}</p>` : ""}${extra}</div></section>`);

// ---------- projets (données de démonstration) ----------
const DISC = { produit: "Design produit", dev: "Développement", identite: "Identité" };
const PROJECTS = [
  { id: "carnet", t: "Carnet de route", k: "Application de covoiturage rural", d: "produit", tech: ["figma", "react"], y: 2026, sum: "Une application qui relie les villages entre eux : trajets partagés, arrêts à la demande, aucune carte à regarder pendant qu'on conduit.", role: "Recherche, design d'interface, prototype codé", res: "Prototype testé avec 14 habitants, parcours de réservation ramené de 7 à 3 écrans." },
  { id: "aubrac", t: "Maison Aubrac", k: "Identité et site d'une fromagerie", d: "identite", tech: ["figma", "astro"], y: 2025, sum: "Un logo tracé à la main, une palette de crème et de brique, et un site statique qui charge en moins d'une seconde.", role: "Identité, design, intégration", res: "Site de 12 pages, 98 au score de performance mesuré en laboratoire." },
  { id: "marees", t: "Tableau des marées", k: "Visualisation de données ouvertes", d: "dev", tech: ["typescript", "d3"], y: 2025, sum: "Un tableau de bord lisible des hauteurs d'eau, pensé pour les pêcheurs à pied : une seule courbe, un seul chiffre à retenir.", role: "Conception, développement", res: "Fonctionne hors ligne ; lecture possible sans souris, au clavier." },
  { id: "mediatheque", t: "Médiathèque de Brénoux", k: "Site public accessible", d: "dev", tech: ["react", "a11y"], y: 2024, sum: "Refonte du site d'une médiathèque communale avec un objectif simple : que chacun puisse emprunter, quel que soit son matériel.", role: "Intégration, accessibilité, formation de l'équipe", res: "Audit interne : 94 % des critères du référentiel vérifiés conformes." },
  { id: "fonderie", t: "Fonderie Lemoine", k: "Système de design", d: "produit", tech: ["figma", "typescript"], y: 2024, sum: "Trente composants documentés pour une PME industrielle, de la maquette au code, avec un seul vocabulaire partagé.", role: "Design system, bibliothèque de composants", res: "Un nouvel écran se monte désormais en une demi-journée au lieu de trois." },
  { id: "phare", t: "Petit Phare", k: "Identité d'une librairie jeunesse", d: "identite", tech: ["figma"], y: 2023, sum: "Un phare, des rayons qui servent de rayonnages, et une signalétique que les enfants peuvent lire seuls.", role: "Identité, signalétique, papeterie", res: "Livret de marque de 24 pages remis à la librairie." },
  { id: "haies", t: "Atlas des haies", k: "Carte participative", d: "dev", tech: ["node", "typescript"], y: 2023, sum: "Les habitants dessinent, datent et décrivent les haies de leur commune ; l'atlas les assemble en une carte consultable.", role: "Développement, accompagnement des bénévoles", res: "Premier relevé : 310 tronçons saisis en trois week-ends." },
  { id: "voila", t: "Voilà, voilà", k: "Lecture à voix haute", d: "produit", tech: ["figma", "react"], y: 2026, sum: "Une application pour lire des histoires à voix haute : texte qui défile à la vitesse de la voix, silences respectés.", role: "Design interactif, prototype", res: "Prototype cliquable présenté en atelier avec 9 familles." },
];
const TECH = { figma: "Figma", react: "React", typescript: "TypeScript", node: "Node.js", astro: "Astro", d3: "D3", a11y: "Accessibilité" };

const thumb = (id) => {
  const p = {
    carnet: `<rect class="k0" width="160" height="120"/><path class="s2" d="M-5 100C30 90 40 50 80 56S130 30 170 14"/><circle class="k1" cx="40" cy="78" r="8"/><circle class="k2" cx="124" cy="34" r="10"/><rect class="k3" x="60" y="82" width="44" height="22" rx="11"/>`,
    aubrac: `<rect class="k2" width="160" height="120"/><path class="k3" d="M30 90A52 52 0 0 1 130 90z"/><circle class="k1" cx="70" cy="76" r="6"/><circle class="k1" cx="98" cy="82" r="4"/><circle class="k1" cx="86" cy="62" r="3"/>`,
    marees: `<rect class="k1" width="160" height="120"/><path class="s3" d="M0 70C20 40 40 40 60 70S100 100 120 70 150 44 160 52"/><path class="s2" d="M0 90C20 60 40 60 60 90S100 120 120 90 150 64 160 72"/><circle class="k2" cx="120" cy="30" r="9"/>`,
    mediatheque: `<rect class="k0" width="160" height="120"/><rect class="k1" x="26" y="30" width="18" height="70"/><rect class="k2" x="48" y="42" width="18" height="58"/><rect class="k3" x="70" y="24" width="18" height="76"/><rect class="k1" x="92" y="50" width="18" height="50"/><path class="s1" d="M18 102h124"/>`,
    fonderie: `<rect class="k3" width="160" height="120"/><rect class="k1" x="22" y="22" width="52" height="34"/><rect class="k2" x="82" y="22" width="56" height="34" rx="17"/><rect class="k0" x="22" y="64" width="34" height="34"/><circle class="k1" cx="82" cy="81" r="17"/><rect class="k2" x="106" y="64" width="32" height="34"/>`,
    phare: `<rect class="k1" width="160" height="120"/><path class="k3" d="M70 100 76 40h8l6 60z"/><rect class="k2" x="72" y="30" width="16" height="12"/><path class="s3" d="M60 36 10 22M100 36l50-14M60 40 14 50M100 40l46 10"/>`,
    haies: `<rect class="k0" width="160" height="120"/><path class="s1" d="M10 90C40 60 70 100 110 64S140 50 152 30"/><circle class="k2" cx="30" cy="80" r="6"/><circle class="k1" cx="62" cy="86" r="5"/><circle class="k2" cx="96" cy="70" r="7"/><circle class="k1" cx="126" cy="54" r="5"/><circle class="k2" cx="148" cy="34" r="6"/>`,
    voila: `<rect class="k2" width="160" height="120"/><circle class="s1" cx="80" cy="60" r="16"/><circle class="s1" cx="80" cy="60" r="32"/><circle class="s1" cx="80" cy="60" r="48"/><circle class="k1" cx="80" cy="60" r="7"/>`,
  }[id];
  return `<svg class="sg-th" viewBox="0 0 160 120" aria-hidden="true">${p}</svg>`;
};

const filterBar = (extra = "") => `<div class="sg-filters" data-reveal>
  <div class="sg-fgroup" role="group" aria-label="Discipline"><span class="sg-flabel">Discipline</span>${[["all", "Toutes"], ["produit", DISC.produit], ["dev", DISC.dev], ["identite", DISC.identite]].map(([v, l], i) => `<a href="#f-d-${v}" class="sg-chip${i ? "" : " is-on"}" role="button" aria-pressed="${i ? "false" : "true"}" data-fg="d" data-fv="${v}">${l}</a>`).join("")}</div>
  <div class="sg-fgroup" role="group" aria-label="Technologie"><span class="sg-flabel">Technologie</span>${[["all", "Toutes"], ...Object.entries(TECH).slice(0, 6)].map(([v, l], i) => `<a href="#f-t-${v}" class="sg-chip${i ? "" : " is-on"}" role="button" aria-pressed="${i ? "false" : "true"}" data-fg="t" data-fv="${v}">${l}</a>`).join("")}</div>
  <div class="sg-fgroup" role="group" aria-label="Année"><span class="sg-flabel">Année</span>${["all", "2026", "2025", "2024", "2023"].map((v, i) => `<a href="#f-y-${v}" class="sg-chip${i ? "" : " is-on"}" role="button" aria-pressed="${i ? "false" : "true"}" data-fg="y" data-fv="${v}">${v === "all" ? "Toutes" : v}</a>`).join("")}</div>
  ${extra}</div>`;

const pjItem = (p, i, href = "/projet", open = true) => `<article class="sg-pj" data-fitem data-d="${p.d}" data-t="${p.tech.join(" ")}" data-y="${p.y}" data-title="${esc(p.t)}" data-kind="${esc(p.k)}" data-disc="${DISC[p.d]}" data-techs="${esc(p.tech.map((t) => TECH[t]).join(", "))}" data-sum="${esc(p.sum)}" data-role="${esc(p.role)}" data-res="${esc(p.res)}">
  <span class="sg-pj-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div class="sg-pj-art">${thumb(p.id)}</div>
  <div class="sg-pj-main"><h3><a class="sg-pj-a" href="${href}"${open ? ' data-open' : ""}>${esc(p.t)}</a></h3><p class="sg-pj-k">${esc(p.k)}</p></div>
  <p class="sg-pj-d">${DISC[p.d]}</p><p class="sg-pj-t">${p.tech.map((t) => TECH[t]).join(" · ")}</p><time class="sg-pj-y">${p.y}</time><span class="sg-pj-go" aria-hidden="true">${arrow}</span></article>`;

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="sg-hero pk-bleed"><div class="sg-wrap">
    <div class="sg-hero-top"><p class="sg-hand sg-hand--l" data-reveal>Bonjour, moi c'est</p><a class="sg-pill" href="/contact" data-reveal><i aria-hidden="true"></i>Disponible dès janvier 2027 · 2 jours par semaine</a></div>
    <div class="sg-name" role="heading" aria-level="1"><span class="sg-name-a" data-reveal>Lou</span><span class="sg-name-b" data-reveal><span class="sg-mk"><span>Verdier</span></span>${scribble("sg-draw")}</span></div>
    <div class="sg-hero-grid"><div>
      <p class="sg-lead" data-reveal>Designer <span class="sg-x">graphiste</span> <span class="sg-hand sg-hand--inline">produit</span> et développeuse. Je fabrique des interfaces <mark>lisibles</mark>, rapides et un peu têtues, pour des gens qui ont autre chose à faire que de les comprendre.</p>
      <div class="sg-actions" data-reveal><a class="sg-btn" href="/projets">Voir mes projets ${arrow}</a><a class="sg-btn sg-btn--line" href="/parcours">Parcours &amp; CV</a></div></div>
      <aside class="sg-facts" data-reveal aria-label="En bref"><p class="sg-hand sg-hand--note" aria-hidden="true">${loopArrow()}<span>ce que vous devez savoir</span></p>
        <dl><div><dt>Basée à</dt><dd>Lyon, en télétravail ou chez vous</dd></div><div><dt>Depuis</dt><dd>8 ans de métier, 40 projets livrés</dd></div><div><dt>Langues</dt><dd>Français, anglais, un peu d'italien</dd></div><div><dt>Outils</dt><dd>Figma, TypeScript, du papier</dd></div></dl></aside></div>
  </div></section>`),
  sec(`<section class="sg-sel pk-bleed"><div class="sg-wrap"><div class="sg-sechead"><h2 class="sg-h2" data-reveal>Sélection <span class="sg-hand sg-hand--inline">(2023–2026)</span></h2><a class="sg-more" href="/projets">Tous les projets ${arrow}</a></div>
    <div class="sg-pjs sg-view-list" data-reveal>${PROJECTS.slice(0, 4).map((p, i) => pjItem(p, i, "/projet", false)).join("")}</div></div></section>`),
  sec(`<section class="sg-do pk-bleed"><div class="sg-wrap sg-do-in"><p class="sg-kicker" data-reveal>Ma façon de faire</p>
    <div class="sg-do-grid"><article data-reveal><span class="sg-num">1</span><h3>Concevoir</h3><p>On commence par écouter, dessiner à la main, tester sur du papier. Les écrans viennent quand l'idée tient debout.</p></article>
    <article data-reveal><span class="sg-num">2</span><h3>Construire</h3><p>Je code ce que je dessine : HTML sobre, CSS maîtrisé, TypeScript quand il le faut. Ce qui est beau doit aussi être rapide.</p></article>
    <article data-reveal><span class="sg-num">3</span><h3>Transmettre</h3><p>Chaque projet se termine par un document clair et une formation. L'objectif : que vous n'ayez plus besoin de moi.</p></article></div></div></section>`),
  sec(`<section class="sg-teaser pk-bleed"><div class="sg-wrap sg-teaser-in"><div><p class="sg-kicker" data-reveal>Parcours</p><h2 class="sg-h2" data-reveal>Huit ans,<br>trois endroits.</h2><p class="sg-muted" data-reveal>De l'intégration en agence à l'indépendance, en passant par la direction du design d'un petit studio. Le détail, avec les compétences, est sur la page Parcours.</p>
    <div class="sg-actions" data-reveal><a class="sg-btn" href="/parcours">Ouvrir le parcours ${arrow}</a></div></div>
    <ol class="sg-mini" data-reveal><li><time>2024 →</time><b>Indépendante</b><span>Studio solo, Lyon</span></li><li><time>2021–2024</time><b>Designer produit, lead front</b><span>Studio Quinconce</span></li><li><time>2018–2021</time><b>Intégratrice puis développeuse</b><span>Agence Mirabelle</span></li><li><time>2016–2018</time><b>Master design interactif</b><span>ESAD des Alpes</span></li></ol></div></section>`),
  sec(`<section class="sg-notes pk-bleed"><div class="sg-wrap"><div class="sg-sechead"><h2 class="sg-h2" data-reveal>Notes récentes</h2><a class="sg-more" href="/ecrits">Tous les écrits ${arrow}</a></div>
    <ul class="sg-nl">${NOTES.slice(0, 3).map((n) => `<li data-reveal><time>${n.date}</time><a href="/ecrits"><b>${esc(n.t)}</b><span>${esc(n.x)}</span></a><em>${n.min} min</em></li>`).join("")}</ul></div></section>`),
  sec(`<section class="sg-cta pk-bleed"><div class="sg-wrap"><p class="sg-hand sg-hand--l sg-hand--cta" data-reveal>alors, on se parle ?</p><div class="sg-cta-t" data-reveal>Un projet,<br>une question,<br>un café.</div><div class="sg-actions" data-reveal><a class="sg-btn sg-btn--big" href="/contact">Écrire à Lou ${arrow}</a><a class="sg-ul" href="mailto:${MAIL}">${MAIL}</a></div></div></section>`),
  sec(footer(c)),
];

// ---------- projets ----------
const projets = (c) => [
  sec(header(c)),
  pagehead("Projets 2023–2026", "Ce que j'ai<br>fabriqué.", "Huit projets choisis. Filtrez par discipline, technologie ou année, et passez de la liste aux vignettes."),
  sec(`<section class="sg-work pk-bleed" data-fscope><div class="sg-wrap">
    ${filterBar(`<div class="sg-viewbar"><p class="sg-count" aria-live="polite"><b data-fcount>8</b> projets affichés <a class="sg-reset" href="#reinitialiser" data-freset>Réinitialiser</a></p>
      <div class="sg-views" role="group" aria-label="Affichage"><a href="#vue-liste" class="sg-vbtn is-on" role="button" aria-pressed="true" data-view="list">${`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`}Liste</a><a href="#vue-vignettes" class="sg-vbtn" role="button" aria-pressed="false" data-view="grid"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13" y="4" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="13" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13" y="13" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/></svg>Vignettes</a></div></div>`)}
    <div class="sg-pjs sg-view-list" data-fitems>${PROJECTS.map((p, i) => pjItem(p, i)).join("")}</div>
    <p class="sg-empty" data-fempty>Aucun projet ne correspond à ces filtres. <a class="sg-ul" href="#reinitialiser" data-freset>Tout afficher</a></p></div></section>`),
  sec(`<div class="sg-scrim" data-close></div><aside class="sg-panel" role="dialog" aria-modal="true" aria-label="Fiche projet" aria-hidden="true"><a class="sg-panel-x" href="#fermer" data-close>Fermer<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg></a><div class="sg-panel-body" data-panel-body></div></aside>`),
  sec(footer(c)),
];

// ---------- projet : étude de cas ----------
const phone = `<svg class="sg-phone" viewBox="0 0 200 380" aria-hidden="true"><rect class="p0" x="6" y="6" width="188" height="368" rx="30"/><rect class="p1" x="16" y="30" width="168" height="320" rx="18"/><path class="p2" d="M30 300C60 270 80 200 120 190S160 130 170 100"/><circle class="p3" cx="42" cy="292" r="9"/><circle class="p4" cx="166" cy="104" r="11"/><rect class="p5" x="30" y="56" width="140" height="26" rx="13"/><rect class="p5" x="30" y="318" width="140" height="22" rx="11"/></svg>`;
const projet = (c) => [
  sec(header(c)),
  pagehead("Étude de cas · 2026 · Design produit", "Carnet<br>de route", "Une application pour partager les trajets entre villages, sans carte à fixer en conduisant."),
  sec(`<section class="sg-cs pk-bleed"><div class="sg-wrap sg-cs-top"><div class="sg-cs-art" data-reveal>${thumb("carnet")}<div class="sg-cs-phone">${phone}</div></div>
    <dl class="sg-cs-meta" data-reveal><div><dt>Rôle</dt><dd>Recherche, design d'interface, prototype codé</dd></div><div><dt>Durée</dt><dd>14 semaines, en solo</dd></div><div><dt>Outils</dt><dd>Figma, React, papier calque</dd></div><div><dt>Année</dt><dd>2026</dd></div></dl></div></section>`),
  sec(`<section class="sg-cs2 pk-bleed"><div class="sg-wrap">
    <div class="sg-case" data-reveal><span class="sg-num">01</span><div><h2 class="sg-h3">Le point de départ</h2><p>Dans les villages du Haut-Beaujolais, la voiture est la seule option et un siège sur deux reste vide. Les applications de covoiturage existantes supposent une grande ville, une bonne connexion et des horaires fixes. J'ai commencé par passer quatre jours sur place, sans écran, à écouter ce que les gens faisaient vraiment.</p></div></div>
    <div class="sg-case" data-reveal><span class="sg-num">02</span><div><h2 class="sg-h3">Trois contraintes</h2><ul class="sg-three"><li><b>Mains occupées</b>On consulte l'application avant de partir, jamais pendant. Un seul geste par écran.</li><li><b>Réseau capricieux</b>Tout trajet réservé reste lisible hors ligne, avec l'heure et le point de rendez-vous.</li><li><b>Pas de profil complexe</b>Un prénom, un numéro, une photo facultative. Rien d'autre.</li></ul></div></div>
    <div class="sg-case" data-reveal><span class="sg-num">03</span><div><h2 class="sg-h3">La démarche</h2><ol class="sg-steps"><li><span>Semaine 1–2</span>Entretiens et relevé des trajets réels sur un cahier à spirale.</li><li><span>Semaine 3–6</span>Dix versions papier, testées avec des habitants autour d'une table de cuisine.</li><li><span>Semaine 7–12</span>Prototype codé en React, relu par trois personnes qui n'aiment pas les applications.</li><li><span>Semaine 13–14</span>Livret de design et passation à l'association porteuse.</li></ol></div></div>
    <div class="sg-case" data-reveal><span class="sg-num">04</span><div><h2 class="sg-h3">Ce qui a changé</h2><div class="sg-res"><div><b data-count="3">3</b><span>écrans pour réserver un trajet, contre 7 au départ</span></div><div><b data-count="14">14</b><span>habitants ont testé le prototype</span></div><div><b data-count="0">0</b><span>carte à manipuler pendant la conduite</span></div></div><p class="sg-note">Chiffres issus d'un test en conditions réelles de la démonstration ; ils ne constituent pas une mesure d'usage.</p></div></div>
  </div></section>`),
  sec(`<section class="sg-next pk-bleed"><div class="sg-wrap sg-next-in"><div><p class="sg-kicker">Projet suivant</p><a class="sg-next-t" href="/projets">Maison Aubrac</a><p class="sg-muted">Identité et site d'une fromagerie.</p></div><a class="sg-btn" href="/projets">Retour aux projets ${arrow}</a></div></section>`),
  sec(footer(c)),
];

// ---------- parcours (CV) ----------
const TL = [
  { k: "exp", when: "2024 — auj.", t: "Designer-développeuse indépendante", o: "Studio Verdier · Lyon", x: "Projets pour des collectivités, des librairies et des PME. Du premier atelier à la mise en ligne, avec accessibilité et sobriété numérique comme règles.", c: ["Design d'interface", "TypeScript", "Accessibilité"] },
  { k: "form", when: "2023", t: "Formation : accessibilité numérique", o: "Cinq jours, organisme de formation professionnelle", x: "Référentiel général d'amélioration de l'accessibilité, tests avec lecteurs d'écran, audits rapides.", c: ["RGAA", "Lecteurs d'écran"] },
  { k: "exp", when: "2021 — 2024", t: "Designer produit & lead front-end", o: "Studio Quinconce · Lyon", x: "Équipe de six personnes. Création du système de design maison, animation d'ateliers clients, relecture de code.", c: ["Systèmes de design", "React", "Ateliers"] },
  { k: "exp", when: "2018 — 2021", t: "Intégratrice puis développeuse front-end", o: "Agence Mirabelle · Grenoble", x: "Une trentaine de sites livrés, du portail associatif à la boutique en ligne. Premiers pas en encadrement d'alternants.", c: ["HTML / CSS", "JavaScript", "Tutorat"] },
  { k: "form", when: "2016 — 2018", t: "Master design interactif", o: "ESAD des Alpes", x: "Mémoire sur la lecture à l'écran des textes longs. Stage de six mois à l'Atelier Rhône.", c: ["Typographie", "Prototypage"] },
  { k: "form", when: "2013 — 2016", t: "Licence arts appliqués", o: "Université de Valbonne", x: "Dessin, histoire du graphisme, premiers cours de programmation créative.", c: ["Dessin", "Édition"] },
];
const SKILLS = [["Design", [["Design d'interface", 5], ["Typographie", 5], ["Systèmes de design", 4], ["Identité visuelle", 4]]], ["Code", [["HTML & CSS", 5], ["TypeScript", 4], ["React", 4], ["Node.js", 3], ["Animation web", 3]]], ["Méthode", [["Accessibilité", 4], ["Ateliers & facilitation", 4], ["Rédaction de documentation", 4]]]];
const pips = (n) => `<span class="sg-pips sg-l${n}" role="img" aria-label="Niveau ${n} sur 5"><i></i><i></i><i></i><i></i><i></i></span><b class="sg-pn">${n}/5</b>`;
const parcours = (c) => [
  sec(header(c)),
  sec(`<section class="sg-printhead"><div class="sg-ph-name">Lou Verdier</div><p class="sg-ph-role">Designer d'interface &amp; développeuse front-end · Lyon</p><p class="sg-ph-contact">${MAIL} · louverdier.example (démonstration)</p><p>Huit ans de métier entre agence, studio et indépendance. Interfaces lisibles, accessibles et rapides ; du premier atelier à la mise en ligne.</p></section>`),
  pagehead("Parcours · 2013 — aujourd'hui", "Parcours<br>&amp; CV", "Expériences, formations et compétences. Filtrez ce qui vous intéresse, ou récupérez tout sur une page imprimable.",
    `<div class="sg-actions sg-noprint" data-reveal><a class="sg-btn" href="#imprimer" data-print>Télécharger le CV ${`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m-5-5 5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}</a><p class="sg-hand sg-hand--inline sg-hint">ouvre l'impression : choisir « Enregistrer au format PDF »</p></div>`),
  sec(`<section class="sg-cv pk-bleed" data-fscope><div class="sg-wrap">
    <div class="sg-fgroup sg-tabs sg-noprint" role="group" aria-label="Filtrer le parcours">${[["all", "Tout"], ["exp", "Expériences"], ["form", "Formations"], ["comp", "Compétences"]].map(([v, l], i) => `<a href="#k-${v}" class="sg-chip${i ? "" : " is-on"}" role="button" aria-pressed="${i ? "false" : "true"}" data-fg="k" data-fv="${v}">${l}</a>`).join("")}<p class="sg-count" aria-live="polite"><b data-fcount>9</b> rubriques</p></div>
    <div class="sg-tlwrap"><span class="sg-tl-fill" aria-hidden="true"></span><ol class="sg-tl" data-fitems>${TL.map((e) => `<li class="sg-tl-i" data-fitem data-k="${e.k}" data-reveal><time class="sg-tl-when">${e.when}</time><div class="sg-tl-body"><span class="sg-tl-tag sg-tag-${e.k}">${e.k === "exp" ? "Expérience" : "Formation"}</span><h3>${esc(e.t)}</h3><p class="sg-tl-org">${esc(e.o)}</p><p>${esc(e.x)}</p><ul class="sg-chips">${e.c.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></li>`).join("")}</ol></div>
    <div class="sg-skills" data-fitem data-k="comp" data-fitems><h2 class="sg-h2">Compétences</h2><div class="sg-sk-grid">${SKILLS.map(([g, l]) => `<div class="sg-sk-col" data-reveal><h3>${g}</h3><ul>${l.map(([n, v]) => `<li><span>${esc(n)}</span>${pips(v)}</li>`).join("")}</ul></div>`).join("")}</div>
      <p class="sg-note">Niveaux indicatifs : 3 = à l'aise, 4 = solide, 5 = référente sur le sujet.</p></div>
    <p class="sg-empty" data-fempty>Rien à afficher. <a class="sg-ul" href="#reinitialiser" data-freset>Tout afficher</a></p>
  </div></section>`),
  sec(`<section class="sg-cvcta pk-bleed sg-noprint"><div class="sg-wrap sg-cvcta-in"><p class="sg-h3">Ce parcours vous parle ?</p><div class="sg-actions"><a class="sg-btn" href="/contact">Écrire à Lou ${arrow}</a><a class="sg-btn sg-btn--line" href="/apropos">En savoir plus sur moi</a></div></div></section>`),
  sec(footer(c)),
];

// ---------- à propos ----------
const portrait = `<svg class="sg-portrait" viewBox="0 0 320 400" aria-hidden="true"><rect class="a0" x="0" y="0" width="320" height="400"/><circle class="a1" cx="170" cy="150" r="88"/><path class="a2" d="M70 400c0-92 44-150 104-150s96 58 96 150z"/><path class="a3" d="M96 128c8-60 62-86 104-62 40 22 44 62 40 96-18-28-56-44-90-38-26 4-44 14-54 4z"/><path class="a4" d="M120 160c10 6 20 6 28 0M190 160c10 6 20 6 28 0M150 206c10 12 28 12 38 0" fill="none"/><circle class="a5" cx="244" cy="320" r="40"/><path class="a6" d="M226 320l12 12 24-26" fill="none"/></svg>`;
const apropos = (c) => [
  sec(header(c)),
  pagehead("À propos", "Un peu<br>de moi.", "Ce qu'on ne dit pas dans un CV."),
  sec(`<section class="sg-about pk-bleed"><div class="sg-wrap sg-about-in"><figure class="sg-fig" data-reveal>${portrait}<figcaption class="sg-hand">autoportrait, un mardi, sans miroir</figcaption></figure>
    <div class="sg-prose" data-reveal><p class="sg-lead">J'ai appris à dessiner des lettres avant d'apprendre à écrire du code, et je n'ai jamais bien séparé les deux.</p>
    <p>Je suis née à Annecy, j'ai grandi entre un atelier de sérigraphie et un ordinateur partagé. Aujourd'hui je travaille depuis Lyon, par petits projets, avec des gens qui savent ce qu'ils veulent protéger : une médiathèque, une fromagerie, un village.</p>
    <p>Je crois qu'une interface réussie est une interface qu'on oublie. Elle ne cherche pas à se faire remarquer, elle rend un service. C'est pour cela que je soigne autant la typographie que le temps de chargement.</p>
    <p>Quand je ne travaille pas : cyclisme sur de mauvaises routes, linogravure, et une collection de cahiers à spirale que je n'ose pas ouvrir.</p></div></div></section>`),
  sec(`<section class="sg-vals pk-bleed"><div class="sg-wrap"><h2 class="sg-h2" data-reveal>Quatre règles</h2><ol class="sg-rules">
    <li data-reveal><span class="sg-num">1</span><div><h3>Dessiner avant de décider</h3><p>Un crayon coûte moins cher qu'un composant. On jette plus vite.</p></div></li>
    <li data-reveal><span class="sg-num">2</span><div><h3>Accessible dès le premier jour</h3><p>Pas une option de fin de projet : la base du contrat.</p></div></li>
    <li data-reveal><span class="sg-num">3</span><div><h3>Léger plutôt que spectaculaire</h3><p>Chaque kilo-octet est une personne avec un vieux téléphone.</p></div></li>
    <li data-reveal><span class="sg-num">4</span><div><h3>Tout documenter</h3><p>Je pars avec mes fichiers rangés, vous restez avec la clé.</p></div></li></ol></div></section>`),
  sec(`<section class="sg-tools pk-bleed"><div class="sg-wrap sg-tools-in"><div data-reveal><p class="sg-kicker">Dans la trousse</p><h2 class="sg-h2">Mes outils</h2></div>
    <ul class="sg-chips sg-chips--big" data-reveal>${["Figma", "TypeScript", "React", "Astro", "Node.js", "D3", "Carnet à spirale", "Linogravure", "Lecteur d'écran", "Un bon clavier"].map((x) => `<li>${x}</li>`).join("")}</ul></div></section>`),
  sec(`<section class="sg-cta sg-cta--s pk-bleed"><div class="sg-wrap"><div class="sg-cta-t sg-cta-t--s" data-reveal>On fait connaissance ?</div><div class="sg-actions" data-reveal><a class="sg-btn" href="/contact">Écrire à Lou ${arrow}</a><a class="sg-btn sg-btn--line" href="/parcours">Voir le parcours</a></div></div></section>`),
  sec(footer(c)),
];

// ---------- écrits ----------
const NOTES = [
  { date: "12 oct. 2026", t: "Pourquoi je dessine d'abord sur papier calque", x: "Un exercice simple pour arrêter de confondre l'idée et sa mise en forme.", topic: "design", min: 6 },
  { date: "28 sept. 2026", t: "Un tableau de bord lisible avec une seule courbe", x: "Retour sur le tableau des marées : ce qu'on retire pour que ça se lise.", topic: "code", min: 8 },
  { date: "03 sept. 2026", t: "Facturer un projet court sans s'épuiser", x: "Trois règles de cadrage apprises à mes dépens.", topic: "pratique", min: 5 },
  { date: "17 juil. 2026", t: "Le focus, ce détail que tout le monde supprime", x: "Un contour visible n'est pas une faute de goût.", topic: "code", min: 4 },
  { date: "21 mai 2026", t: "Choisir deux polices et s'y tenir", x: "Contraste, rythme, et pourquoi trois polices est déjà une de trop.", topic: "design", min: 7 },
  { date: "09 mars 2026", t: "Ranger ses fichiers pour que quelqu'un d'autre les trouve", x: "La passation est un livrable comme un autre.", topic: "pratique", min: 5 },
];
const TOPIC = { design: "Design", code: "Code", pratique: "Pratique" };
const ecrits = (c) => [
  sec(header(c)),
  pagehead("Écrits & notes", "Des notes,<br>pas des posts.", "Ce que j'apprends en travaillant, écrit pour moi d'abord. Une note par mois environ."),
  sec(`<section class="sg-writ pk-bleed" data-fscope><div class="sg-wrap">
    <article class="sg-feat" data-reveal><p class="sg-hand sg-hand--l">la dernière en date</p><span class="sg-tag">Design · 6 min</span><h2 class="sg-feat-t">Pourquoi je dessine d'abord sur papier calque</h2><p class="sg-lead">Un exercice simple pour arrêter de confondre l'idée et sa mise en forme : trois feuilles, un feutre, vingt minutes. Aucun écran avant d'avoir trouvé ce que l'on veut dire.</p><a class="sg-btn sg-btn--line" href="/contact">Réagir à cette note ${arrow}</a></article>
    <div class="sg-fgroup" role="group" aria-label="Thème" data-reveal><span class="sg-flabel">Thème</span>${[["all", "Toutes"], ["design", "Design"], ["code", "Code"], ["pratique", "Pratique"]].map(([v, l], i) => `<a href="#th-${v}" class="sg-chip${i ? "" : " is-on"}" role="button" aria-pressed="${i ? "false" : "true"}" data-fg="topic" data-fv="${v}">${l}</a>`).join("")}<p class="sg-count" aria-live="polite"><b data-fcount>6</b> notes</p></div>
    <ul class="sg-nl sg-nl--big" data-fitems>${NOTES.map((n) => `<li data-fitem data-topic="${n.topic}" data-reveal><time>${n.date}</time><div><b>${esc(n.t)}</b><span>${esc(n.x)}</span></div><em>${TOPIC[n.topic]} · ${n.min} min</em></li>`).join("")}</ul>
    <p class="sg-empty" data-fempty>Aucune note dans ce thème. <a class="sg-ul" href="#reinitialiser" data-freset>Tout afficher</a></p></div></section>`),
  sec(footer(c)),
];

// ---------- contact / recherche / 404 ----------
const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Écrivez-moi.", "Un mot sur le projet, le calendrier et le budget approximatif suffit."),
  sec(`<section class="sg-cinfo pk-bleed"><div class="sg-wrap sg-cinfo-in"><div class="sg-avcard" data-reveal><p class="sg-hand sg-hand--l">disponibilité</p><p class="sg-av"><i aria-hidden="true"></i>Dès janvier 2027</p><p>Deux jours par semaine pour un projet de quelques semaines. Je ne prends jamais plus de deux projets en parallèle.</p></div>
    <div data-reveal><h2 class="sg-h3">Pour que je réponde vite</h2><ol class="sg-tips"><li>Qui êtes-vous, et que fait votre structure ?</li><li>Ce qui ne marche pas aujourd'hui, ou ce que vous voulez lancer.</li><li>Une échéance, même approximative.</li></ol><p class="sg-muted">Vous préférez le courriel ? <a class="sg-ul" href="mailto:${MAIL}">${MAIL}</a></p></div></div></section>`),
  { type: "form", heading: "Le formulaire", intro: "Je réponds en général sous deux jours ouvrés. Vos informations ne servent qu'à vous répondre." },
  sec(footer(c)),
];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une trace ?", "Un projet, une note, une compétence."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="sg-404 pk-bleed"><div class="sg-wrap"><p class="sg-hand sg-hand--l">oups, page raturée</p><div class="sg-giant" role="heading" aria-level="1"><span class="sg-x">404</span></div><p class="sg-ph-sub">Cette page n'existe pas ou a changé d'adresse.</p><div class="sg-actions"><a class="sg-btn" href="/">Retour à l'accueil ${arrow}</a><a class="sg-btn sg-btn--line" href="/projets">Voir les projets</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "signature", name: "Signature", version: "2.0.0", category: "agence", tags: ["editorial", "minimaliste", "experimental"], siteType: "Portfolio personnel et CV de designer-développeur·se", featured: true,
  concept: "Le carnet d'une main : un nom immense, des ratures et des annotations manuscrites, un surligneur vert, des projets filtrables et un parcours qui s'imprime en CV.",
  description: "Portfolio personnel de designer-développeuse : nom géant, ratures et notes manuscrites, noir et surligneur émeraude sur papier ivoire, projets filtrables en liste ou vignettes, parcours filtrable et CV imprimable.",
  brand: "Lou Verdier", modules: ["formulaires", "recherche"],
  dna: { header: "ligne-unique-soulignee-et-indicateur-glissant", hero: "nom-geant-ratures-et-annotations-manuscrites", grid: "projets-filtres-en-liste-ou-vignettes-et-fiche-laterale", motion: "ratures-qui-se-tracent-et-surligneur-qui-balaie", shapes: "traits-de-stylo-soulignements-et-pastilles-surligneur", rhythm: "editorial-minimal-marges-larges-numerotees", signature: "parcours-filtrable-projets-filtrables-et-cv-imprimable" },
  tokens: {
    colors: { primary: "#10b86f", secondary: "#141414", accent: "#0b7a4b", background: "#f6f3ea", surface: "#ffffff", text: "#141414", muted: "#5a574e", success: "#0b7a4b", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.gloock", body: "font.hanken-grotesk", button: "font.hanken-grotesk", link: "font.caveat" },
    radius: { sm: 4, md: 8, lg: 14, button: 999, field: 8, card: 14 }, shadow: { card: "none", button: "none" }, border: { width: 1.5, color: "#141414" },
    type: { h1: { size: 220, weight: 400, lineHeight: 0.84, transform: "none" }, h2: { size: 56, weight: 400, lineHeight: 1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur du surligneur", type: "color", default: "#10b86f" },
    { key: "paper", label: "Papier", type: "choice", default: "ivoire", choices: [["ivoire", "Ivoire"], ["blanc", "Blanc"]] },
    { key: "marker", label: "Surligneur animé", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Discret"]] },
    { key: "notes", label: "Annotations manuscrites", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
  ],
  menu: [["Accueil", "/"], ["Projets", "/projets"], ["Parcours", "/parcours"], ["À propos", "/apropos"], ["Écrits", "/ecrits"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "projets", name: "Projets", render: projets }, { key: "projet", name: "Étude de cas", render: projet },
    { key: "parcours", name: "Parcours & CV", render: parcours }, { key: "apropos", name: "À propos", render: apropos }, { key: "ecrits", name: "Écrits", render: ecrits },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
