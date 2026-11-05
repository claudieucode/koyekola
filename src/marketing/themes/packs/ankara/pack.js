// Ankara — collectif culturel et festival d'art afro-contemporain (Nyota, fictif). Direction artistique : afro-futurisme. Fond indigo profond, bandes d'ocre, d'émeraude et de rose vif,
// motifs géométriques originaux (soleils concentriques, losanges, arches, écailles) dessinés en SVG/CSS et qui dérivent lentement ; navigation en « carte » plein écran repliable,
// mosaïque d'artistes aux tuiles inégales avec fiche détaillée en panneau, agenda culturel filtrable (discipline, ville, mois) avec « mon parcours ».
const { sec, form, esc, nav } = require("../kit");

const K = { ind: "#1b1450", ind2: "#2e2290", ocre: "#f2a81d", em: "#0b6b4a", emb: "#19c37d", ro: "#d81b60", rob: "#ff5a9b", cr: "#fff6e3" };

const range = (n) => Array.from({ length: n }, (_, i) => i);
const art = (i, p, cls = "an-art") => `<div class="${cls} an-m${i % 8} an-p${p % 8}" aria-hidden="true"></div>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`;
const star = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="currentColor"/></svg>`;

const MAPNAMES = ["Accueil", "Programme", "Artistes", "Œuvres", "Résidences", "À propos", "Presse", "Contact"];
const header = (c) => `<header class="an-head pk-bleed"><a class="an-logo" href="/" aria-label="${esc(c.brand)} — accueil">${star}<span>Nyota</span><small>Festival afro-contemporain</small></a>
  <a class="an-head-cta" href="/programme">Programme 2027</a>
  <details class="an-map"><summary aria-label="Ouvrir ou fermer la carte du site"><span class="an-sum-open">Carte</span><span class="an-sum-close">Fermer</span><i aria-hidden="true"></i></summary>
    <div class="an-mapbox" role="navigation" aria-label="Carte du festival"><p class="an-map-t">Où allez-vous ?</p><div class="an-map-grid">${c.menu.map(({ label, url }, i) => `<a class="an-mt" href="${esc(url)}">${art(i, i + 1)}<b>${esc(label)}</b><span>${String(i + 1).padStart(2, "0")}</span></a>`).join("")}</div></div></details></header>`;

const footer = (c) => `<footer class="an-foot pk-bleed"><div class="an-foot-band" aria-hidden="true"></div>
  <div class="an-foot-in"><div class="an-foot-brand"><div class="an-foot-word" aria-hidden="true">Nyota</div><p>Un collectif, cinq villes, une constellation d'artistes. Dakar, Abidjan, Lagos, Kinshasa, Paris.</p></div>
  <div><h2>Explorer</h2>${nav(c.menu.slice(1, 5), "an-fl")}</div><div><h2>Le collectif</h2>${nav(c.menu.slice(5), "an-fl")}<a class="an-fl" href="/recherche">Recherche</a></div>
  <div><h2>Écrire</h2><a class="an-fl" href="mailto:bonjour@nyota.example">bonjour@nyota.example</a><address>Maison Nyota<br>12 rue des Cadrans, Dakar</address></div></div>
  <p class="an-legal">© Collectif Nyota — site de démonstration. Artistes, œuvres, lieux et dates sont fictifs.</p></footer>`;

const pagehead = (kicker, title, sub, k = 0) => sec(`<section class="an-ph pk-bleed"><div class="an-drift an-pt-${k % 3}" aria-hidden="true"></div><div class="an-ph-in"><p class="an-kicker" data-reveal>${esc(kicker)}</p><div class="an-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="an-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div><div class="an-ph-art" aria-hidden="true">${art(k, k + 2)}</div></section>`);

// ---------- données ----------
const DISC = { arts: "Arts visuels", musique: "Musique", danse: "Danse", perf: "Performance", cinema: "Cinéma", mode: "Mode" };
const VILLE = { dakar: "Dakar", abidjan: "Abidjan", lagos: "Lagos", kinshasa: "Kinshasa", paris: "Paris" };
const MOIS = { "02": "février", "03": "mars", "04": "avril", "05": "mai", "06": "juin" };
const EVENTS = [
  ["e1", "2027-02-26", "perf", "abidjan", "Halle du Plateau", "19 h", "Veillée des Cadrans", "Ouverture de la saison : douze performeurs règlent leurs horloges sur d'autres fuseaux, de minuit à l'aube."],
  ["e2", "2027-03-05", "danse", "dakar", "Théâtre de la Corniche", "20 h", "Atelier du vent", "Création pour huit danseuses : le corps comme girouette, sur une partition de souffles enregistrés."],
  ["e3", "2027-03-06", "arts", "dakar", "Galerie Baobab Bleu", "18 h", "Cartographies du soleil", "Vernissage d'une exposition collective : cartes imaginaires, tapisseries lumineuses et sculptures de cuivre."],
  ["e4", "2027-03-12", "musique", "lagos", "Entrepôt 9", "21 h", "Fréquences Lagos–Kinshasa", "Synthétiseurs modulaires et percussions en duel amical, dix heures de set en continu."],
  ["e5", "2027-03-19", "cinema", "paris", "Cinéma Le Mirage", "19 h 30", "Les Tisseuses de signaux", "Cycle de courts métrages d'animation : des grand-mères ingénieures réparent un réseau de satellites."],
  ["e6", "2027-03-27", "mode", "abidjan", "Cour des Ateliers", "17 h", "Défilé des étoffes futures", "Dix créateurs, des tissus teints à l'indigo et des coupes pensées pour l'apesanteur."],
  ["e7", "2027-04-09", "musique", "paris", "Studio 104", "20 h 30", "Chorale des machines", "Un chœur de quarante voix dialogue avec des instruments fabriqués à partir de ferrailles recyclées."],
  ["e8", "2027-04-17", "perf", "kinshasa", "Centre Lubuto", "16 h", "Archives vivantes", "Des habitants racontent un souvenir ; des performeurs le rejouent en direct, sans filet."],
  ["e9", "2027-04-24", "arts", "lagos", "Terrasse Ikoyi", "18 h 30", "Mur de lumière", "Fresque monumentale de panneaux colorés qui change de visage entre le jour et la nuit."],
  ["e10", "2027-05-14", "cinema", "kinshasa", "Cinéma Étoile", "19 h", "Nuit des cartes", "Projection en plein air de films de science-fiction réalisés par de jeunes cinéastes."],
  ["e11", "2027-05-29", "danse", "paris", "La Fabrique du Nord", "19 h", "Danses de seuil", "Trois chorégraphes explorent les portes, les couloirs et les passages entre deux mondes."],
  ["e12", "2027-06-12", "musique", "dakar", "Esplanade du Port", "20 h", "Grand bal des constellations", "Clôture : orchestre de trente musiciens, danse pour tous et feu d'artifice de lumières."],
];
const dfr = (iso) => { const [, m, d] = iso.split("-"); return [String(+d), MOIS[m]]; };
const eventLi = ([id, iso, di, vi, lieu, h, t, d]) => { const [dd, mm] = dfr(iso); return `<li class="an-ev" data-item data-disc="${di}" data-ville="${vi}" data-mois="${iso.slice(5, 7)}" data-ev="${id}" data-iso="${iso}">
  <time class="an-ev-date" datetime="${iso}"><b>${dd}</b><span>${mm}</span></time>
  <div class="an-ev-body"><span class="an-badge an-b-${di}">${DISC[di]}</span><h3>${esc(t)}</h3><p>${esc(d)}</p><p class="an-ev-meta"><strong>${VILLE[vi]}</strong> · ${esc(lieu)} · ${h}</p></div>
  <a class="an-pick" href="#parcours" role="button" aria-pressed="false" data-pick="${id}" data-title="${esc(t)}" data-city="${VILLE[vi]}" data-when="${dd} ${mm}"><span class="an-pick-off">+ Mon parcours</span><span class="an-pick-on">Dans mon parcours</span></a></li>`; };
const chips = (group, label, map) => `<div class="an-fg"><span class="an-fl-t">${label}</span><a class="an-chip is-on" href="#tous" role="button" aria-pressed="true" data-filter="${group}" data-val="*">Tous</a>${Object.entries(map).map(([k, v]) => `<a class="an-chip" href="#${group}-${k}" role="button" aria-pressed="false" data-filter="${group}" data-val="${k}">${v}</a>`).join("")}</div>`;
const agenda = (n, withMois = true) => `<div class="an-fscope an-agenda" data-unit="rendez-vous">
  <div class="an-filters" role="group" aria-label="Filtrer l'agenda">${chips("disc", "Discipline", DISC)}${chips("ville", "Ville", VILLE)}${withMois ? chips("mois", "Mois", MOIS) : ""}</div>
  <p class="an-count" role="status" aria-live="polite" data-count-out>${n} rendez-vous</p>
  <div class="an-agenda-cols"><ol class="an-evlist">${EVENTS.slice(0, n).map(eventLi).join("")}</ol>
  <aside class="an-trip" aria-label="Mon parcours"><h3>Mon parcours</h3><p class="an-trip-sum" data-trip-sum>Aucune date choisie. Touchez « + Mon parcours » sur un rendez-vous pour composer votre semaine de festival.</p><ol class="an-trip-list" data-trip-list></ol>
  <p class="an-trip-note">Ce récapitulatif reste sur votre appareil : rien n'est réservé. Pour venir en groupe ou poser une question, écrivez-nous.</p><a class="an-btn an-btn--sm" href="/contact">Écrire au collectif ${arrow}</a></aside></div>
  <p class="an-empty" data-empty>Aucun rendez-vous ne correspond à ces filtres. Essayez « Tous ».</p></div>`;

const ARTISTS = [
  ["aissatou", "Aïssatou Kerfala", "arts", "dakar", "Tapisseries de fibres optiques et d'indigo", "Aïssatou tisse des fils de lumière dans des toiles teintes à l'indigo. Ses grandes tentures racontent des villes qui n'existent pas encore, vues depuis le toit d'une maison de famille.", "Mémoire d'un ciel à venir", "Une tenture de quatre mètres où des fibres lumineuses dessinent les trajets d'une famille sur trois générations.", "e3"],
  ["tunde", "Tunde Okonjo", "musique", "lagos", "Synthétiseurs modulaires et percussions", "Producteur et percussionniste, Tunde fabrique ses instruments avec des pièces récupérées. Ses morceaux superposent rythmes de marché et textures électroniques lentes.", "Marché de nuit, version 3", "Un set de soixante minutes où les bruits d'un marché sont rejoués au clavier modulaire.", "e4"],
  ["mireille", "Mireille Ntumba", "danse", "kinshasa", "Chorégraphie des seuils", "Chorégraphe, Mireille travaille sur la façon dont un corps traverse une porte. Elle dirige huit danseuses dans des pièces courtes, précises et très physiques.", "Seuils", "Une pièce de vingt minutes pour huit interprètes, jouée dans un couloir de trois mètres de large.", "e11"],
  ["kossi", "Kossi Adjovi", "cinema", "paris", "Cinéma d'animation", "Réalisateur d'animation, Kossi dessine à la main chaque image de ses courts métrages, ensuite recolorés en numérique. Ses héroïnes sont ingénieures, navigatrices, réparatrices.", "Les Tisseuses de signaux", "Un court métrage de douze minutes : trois grands-mères remettent en marche un réseau de satellites.", "e5"],
  ["zainab", "Zainab Diallo", "mode", "abidjan", "Textile teint et coupes sculptées", "Styliste, Zainab teint ses étoffes elle-même et conçoit des silhouettes amples, pliables, pensées pour bouger. Elle forme chaque année six apprenties dans son atelier.", "Collection Apesanteur", "Dix silhouettes en coton teint à l'indigo, aux volumes qui flottent à la marche.", "e6"],
  ["oumar", "Oumar Sylla", "perf", "dakar", "Performance et son en direct", "Oumar crée des performances où le public se déplace dans l'espace. Il mêle récit, chant et objets du quotidien détournés en instruments.", "Veillée des cadrans", "Une nuit de douze heures où douze performeurs font tourner des horloges sur des fuseaux imaginaires.", "e1"],
  ["nadege", "Nadège Mbarga", "arts", "abidjan", "Sculpture de cuivre et de verre", "Nadège travaille le cuivre martelé et le verre soufflé. Ses sculptures captent la lumière du jour et la rendent en reflets chauds sur les murs.", "Soleil de poche", "Un ensemble de sept sphères de cuivre et de verre, à tenir dans les mains.", "e3"],
  ["chidi", "Chidi Eze", "musique", "paris", "Direction de chœur et machines", "Chef de chœur, Chidi associe quarante voix amatrices à des instruments sculptés dans la ferraille. Il donne des ateliers ouverts dans chaque ville du festival.", "Chorale des machines", "Un concert pour chœur et instruments recyclés, créé avec des habitants du nord de Paris.", "e7"],
  ["fatou", "Fatou Bamba", "mode", "paris", "Mode circulaire et accessoires", "Fatou récupère chutes de tissu et fermetures de vêtements pour composer des accessoires graphiques. Elle documente chaque pièce comme une petite archive.", "Archive de chutes", "Vingt pièces uniques, chacune accompagnée d'un carnet décrivant d'où viennent ses tissus.", "e6"],
  ["yemi", "Yemi Adesanya", "cinema", "lagos", "Science-fiction documentaire", "Cinéaste, Yemi filme les habitants de Lagos imaginant leur quartier dans cinquante ans, puis monte leurs récits en courts films de science-fiction.", "Quartier 2077", "Un film de vingt-cinq minutes composé de rêves de voisins, à moitié documentaire, à moitié fiction.", "e10"],
  ["leonce", "Léonce Mabiala", "perf", "kinshasa", "Théâtre documentaire", "Léonce collecte des souvenirs d'habitants et les rejoue avec une troupe de dix comédiens. Chaque représentation dépend de ce que le public raconte ce soir-là.", "Archives vivantes", "Une représentation unique, recomposée à chaque fois à partir des souvenirs donnés avant le spectacle.", "e8"],
  ["awa", "Awa Kouyaté", "danse", "abidjan", "Danse contemporaine et pédagogie", "Awa danse depuis l'enfance et enseigne aux adolescents. Sa compagnie mêle gestes traditionnels de transmission et écriture contemporaine.", "Atelier du vent", "Une création pour huit danseuses, où chaque geste est inspiré d'un mouvement d'air.", "e2"],
];
const SIZES = ["L", "T", "T", "M", "M", "S", "S", "S", "S", "T", "L", "T"];
const artistTile = ([k, name, di, vi, pratique, bio, oeuvre, oeuvreD, ev], i) => `<article class="an-t an-t-${SIZES[i]}" data-item data-disc="${di}" data-ville="${vi}" data-reveal>
  <a class="an-tile" href="#artiste-${k}" data-artist="${k}" aria-label="Ouvrir la fiche de ${esc(name)}">${art(i, i + 3, "an-art")}<span class="an-tile-txt"><span class="an-badge an-b-${di}">${DISC[di]}</span><b>${esc(name)}</b><i>${VILLE[vi]}</i></span></a>
  <div class="an-fiche">${art(i + 4, i + 3, "an-fiche-art")}<h3>${esc(name)}</h3><p class="an-fiche-meta">${DISC[di]} · ${VILLE[vi]}</p><p class="an-fiche-prat">${esc(pratique)}</p><p>${esc(bio)}</p><h4>Œuvre présentée</h4><p><strong>${esc(oeuvre)}</strong> — ${esc(oeuvreD)}</p><p class="an-fiche-ev">Rendez-vous au festival : ${esc(EVENTS.find((e) => e[0] === ev)[6])}, ${VILLE[EVENTS.find((e) => e[0] === ev)[3]]}, ${dfr(EVENTS.find((e) => e[0] === ev)[1]).join(" ")}.</p><a class="an-btn an-btn--sm" href="/contact">Écrire à propos de cet artiste ${arrow}</a></div></article>`;
const mosaic = (n) => `<div class="an-fscope" data-unit="artistes"><div class="an-filters" role="group" aria-label="Filtrer les artistes">${chips("disc", "Discipline", DISC)}${chips("ville", "Ville", VILLE)}</div><p class="an-count" role="status" aria-live="polite" data-count-out>${n} artistes</p>
  <div class="an-mosaic">${ARTISTS.slice(0, n).map(artistTile).join("")}</div><p class="an-empty" data-empty>Aucun artiste ne correspond à ces filtres.</p></div>`;

const WORKS = [
  ["Mémoire d'un ciel à venir", "Aïssatou Kerfala", "Fibres optiques sur toile d'indigo", 2026, "Des fils de lumière suivent les trajets d'une famille sur trois générations."],
  ["Soleil de poche", "Nadège Mbarga", "Cuivre martelé et verre soufflé", 2025, "Sept sphères à tenir dans les mains, qui rendent la lumière en reflets chauds."],
  ["Collection Apesanteur", "Zainab Diallo", "Coton teint à l'indigo", 2026, "Dix silhouettes aux volumes qui flottent, teintes en cuves à l'atelier."],
  ["Archive de chutes", "Fatou Bamba", "Chutes de tissu, fermetures, carnets", 2026, "Vingt accessoires uniques, chacun accompagné d'un carnet d'origine."],
  ["Mur de lumière", "Collectif Nyota", "Panneaux peints, acrylique", 2027, "Fresque monumentale de panneaux qui change entre le jour et la nuit."],
  ["Quartier 2077", "Yemi Adesanya", "Film, 25 minutes", 2026, "Les rêves de voisins d'un quartier de Lagos, montés en science-fiction."],
  ["Seuils", "Mireille Ntumba", "Pièce chorégraphique, 20 minutes", 2025, "Huit interprètes traversent un couloir de trois mètres de large."],
  ["Marché de nuit, version 3", "Tunde Okonjo", "Synthétiseurs modulaires, percussions", 2026, "Les bruits d'un marché rejoués au clavier modulaire."],
  ["Les Tisseuses de signaux", "Kossi Adjovi", "Film d'animation, 12 minutes", 2026, "Trois grands-mères remettent en marche un réseau de satellites."],
];
const workFig = ([t, a, tech, y, d], i) => `<figure class="an-work an-w${i % 3}" data-reveal>${art(i + 2, i + 1)}<figcaption><b>${esc(t)}</b><span>${esc(a)} · ${y}</span><em>${esc(tech)}</em><p>${esc(d)}</p></figcaption></figure>`;

// ---------- pages ----------
const HERO_SVG = `<svg class="an-totem" viewBox="0 0 400 460" aria-hidden="true">
  <g class="an-spin"><circle cx="200" cy="190" r="170" fill="#f2a81d"/><circle cx="200" cy="190" r="135" fill="#1b1450"/><circle cx="200" cy="190" r="110" fill="#ff5a9b"/><circle cx="200" cy="190" r="80" fill="#fff6e3"/><circle cx="200" cy="190" r="52" fill="#0b6b4a"/><circle cx="200" cy="190" r="22" fill="#f2a81d"/></g>
  <g class="an-spin an-spin--r"><polygon points="200,6 214,50 258,32 240,76 288,80 250,110 288,140 240,144 258,188 214,170 200,214 186,170 142,188 160,144 112,140 150,110 112,80 160,76 142,32 186,50" fill="none" stroke="#fff6e3" stroke-width="2.5" opacity=".8" transform="translate(0 0)"/></g>
  <path class="an-float" d="M60 460V330a140 140 0 0 1 280 0v130z" fill="#0b6b4a"/><path d="M95 460V340a105 105 0 0 1 210 0v120z" fill="#f2a81d"/><path d="M130 460V350a70 70 0 0 1 140 0v110z" fill="#d81b60"/><path d="M165 460V360a35 35 0 0 1 70 0v100z" fill="#1b1450"/>
  <g class="an-float an-float--b"><polygon points="340,260 372,300 340,340 308,300" fill="#19c37d"/><polygon points="340,282 356,300 340,318 324,300" fill="#1b1450"/><polygon points="52,120 76,148 52,176 28,148" fill="#ff5a9b"/><circle cx="360" cy="90" r="16" fill="#fff6e3"/><circle cx="360" cy="90" r="6" fill="#d81b60"/></g></svg>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="an-hero pk-bleed"><div class="an-drift an-pt-0" aria-hidden="true"></div><div class="an-drift an-drift--b an-pt-1" aria-hidden="true"></div>
    <div class="an-hero-in"><div class="an-hero-copy"><p class="an-kicker" data-reveal>Festival Nyota · 2e édition · février – juin 2027</p>
      <div class="an-h1 an-h1--hero" role="heading" aria-level="1"><span data-reveal>Le futur</span><span data-reveal>se <em>tisse</em></span><span data-reveal>ici.</span></div>
      <p class="an-lead" data-reveal>Cinq mois d'expositions, de concerts, de films et de résidences entre Dakar, Abidjan, Lagos, Kinshasa et Paris. Trente-huit artistes imaginent demain à partir de leurs mémoires.</p>
      <div class="an-actions" data-reveal><a class="an-btn" href="/programme">Voir le programme ${arrow}</a><a class="an-btn an-btn--line" href="/artistes">Rencontrer les artistes</a></div></div>
      <div class="an-hero-art" data-depth="14">${HERO_SVG}</div></div></section>`),
  sec(`<section class="an-strip pk-bleed" aria-label="Les disciplines du festival"><div class="an-strip-track">${["Arts visuels", "Musique", "Danse", "Performance", "Cinéma", "Mode"].concat(["Arts visuels", "Musique", "Danse", "Performance", "Cinéma", "Mode"]).map((x) => `<span>${x}${star}</span>`).join("")}</div></section>`),
  sec(`<section class="an-intro pk-bleed"><div class="an-wrap an-intro-in"><div><p class="an-kicker an-kicker--ink" data-reveal>Notre point de départ</p><h2 class="an-h2" data-reveal>Une mémoire riche, un avenir à inventer.</h2></div>
    <div data-reveal><p class="an-lead">L'afro-futurisme n'est pas une mode : c'est une façon de se projeter. Nyota invite des artistes qui partent de leurs héritages — textiles, rythmes, récits familiaux — pour dessiner des mondes à venir, sans nostalgie ni folklore.</p><a class="an-more" href="/a-propos">Lire notre manifeste ${arrow}</a></div></div>
    <ul class="an-nums"><li data-reveal><b data-count="38">38</b><span>artistes invités</span></li><li data-reveal><b data-count="5">5</b><span>villes, un seul fil</span></li><li data-reveal><b data-count="12">12</b><span>rendez-vous à l'affiche</span></li><li data-reveal><b data-count="6">6</b><span>disciplines croisées</span></li></ul></section>`),
  sec(`<section class="an-agsec pk-bleed"><div class="an-wrap"><div class="an-sechead"><div><p class="an-kicker" data-reveal>Agenda culturel</p><h2 class="an-h2" data-reveal>Composez votre parcours.</h2></div><a class="an-more" href="/programme" data-reveal>Programme complet ${arrow}</a></div>${agenda(6, false)}</div></section>`),
  sec(`<section class="an-artsec pk-bleed"><div class="an-wrap"><div class="an-sechead"><div><p class="an-kicker an-kicker--ink" data-reveal>Les artistes</p><h2 class="an-h2" data-reveal>Neuf voix, neuf mondes.</h2></div><a class="an-more" href="/artistes" data-reveal>Tous les artistes ${arrow}</a></div>
    <div class="an-mosaic">${ARTISTS.slice(0, 9).map(artistTile).join("")}</div></div></section>`),
  sec(`<section class="an-oeuv pk-bleed"><div class="an-wrap"><div class="an-sechead"><div><p class="an-kicker" data-reveal>Œuvres à la une</p><h2 class="an-h2" data-reveal>Trois pièces à ne pas manquer.</h2></div><a class="an-more" href="/oeuvres" data-reveal>La galerie ${arrow}</a></div>
    <div class="an-works an-works--3">${WORKS.slice(0, 3).map(workFig).join("")}</div></div></section>`),
  sec(`<section class="an-quote pk-bleed"><div class="an-drift an-pt-2" aria-hidden="true"></div><div class="an-wrap"><blockquote data-reveal><p>« Nos grands-mères ont toujours su lire l'avenir dans le dessin d'un tissu. Nous, nous apprenons à le construire. »</p><footer>Texte d'intention du collectif — démonstration</footer></blockquote></div></section>`),
  sec(`<section class="an-resi pk-bleed"><div class="an-wrap an-resi-in"><div data-reveal><p class="an-kicker an-kicker--ink">Résidences</p><h2 class="an-h2">Du temps, un atelier, des pairs.</h2><p class="an-lead">Chaque année, trois résidences accueillent des artistes de toute la diaspora pour quatre à huit semaines de travail. Un cadre simple, des rencontres, une restitution publique.</p><a class="an-btn an-btn--ink" href="/residences">Découvrir les résidences ${arrow}</a></div>
    <div class="an-resi-art" aria-hidden="true">${art(2, 2)}${art(0, 4)}${art(6, 0)}</div></div></section>`),
  sec(footer(c)),
];

const programme = (c) => [sec(header(c)), pagehead("Saison 2027 · cinq villes", "Le programme", "Douze rendez-vous de février à juin. Filtrez par discipline, ville ou mois, puis composez votre parcours.", 1),
  sec(`<section class="an-agsec pk-bleed"><div class="an-wrap">${agenda(12, true)}</div></section>`),
  sec(`<section class="an-lieux pk-bleed"><div class="an-wrap"><h2 class="an-h2" data-reveal>Les lieux</h2><dl class="an-dl">${[["Dakar", "Théâtre de la Corniche, Galerie Baobab Bleu, Esplanade du Port"], ["Abidjan", "Halle du Plateau, Cour des Ateliers"], ["Lagos", "Entrepôt 9, Terrasse Ikoyi"], ["Kinshasa", "Centre Lubuto, Cinéma Étoile"], ["Paris", "Cinéma Le Mirage, Studio 104, La Fabrique du Nord"]].map(([v, l], i) => `<div data-reveal><dt>${art(i, i + 2)}${v}</dt><dd>${l}</dd></div>`).join("")}</dl></div></section>`),
  sec(`<section class="an-faq pk-bleed"><div class="an-wrap an-faq-in"><h2 class="an-h2" data-reveal>Bon à savoir</h2><div>
    <details data-reveal><summary>Les lieux sont-ils accessibles ?</summary><p>Chaque lieu indique son accessibilité dans le détail du programme ; écrivez-nous pour préparer une venue.</p></details>
    <details data-reveal><summary>Les dates peuvent-elles changer ?</summary><p>Ce programme est une démonstration : dates, lieux et artistes sont fictifs.</p></details>
    <details data-reveal><summary>Peut-on venir en groupe ?</summary><p>Oui : indiquez votre projet dans le formulaire de contact, nous vous répondrons.</p></details></div></div></section>`),
  sec(footer(c))];

const artistes = (c) => [sec(header(c)), pagehead("Trente-huit artistes, douze à découvrir ici", "Les artistes", "Touchez une tuile pour ouvrir la fiche : pratique, œuvre présentée, rendez-vous au festival.", 2),
  sec(`<section class="an-artsec pk-bleed"><div class="an-wrap">${mosaic(12)}</div></section>`), sec(footer(c))];

const oeuvres = (c) => [sec(header(c)), pagehead("Galerie", "Les œuvres", "Neuf pièces de la saison 2027, de la tapisserie lumineuse au court métrage.", 3),
  sec(`<section class="an-oeuv pk-bleed"><div class="an-wrap"><div class="an-works">${WORKS.map(workFig).join("")}</div></div></section>`),
  sec(`<section class="an-quote pk-bleed"><div class="an-drift an-pt-0" aria-hidden="true"></div><div class="an-wrap"><blockquote data-reveal><p>Chaque œuvre est accompagnée d'un texte écrit avec l'artiste, en français et en langue d'origine quand elle existe.</p><footer>Le principe de médiation du festival</footer></blockquote></div></section>`), sec(footer(c))];

const residences = (c) => [sec(header(c)), pagehead("Trois programmes, quatre à huit semaines", "Les résidences", "Un atelier, une bourse de vie modeste, des pairs et une restitution publique à la fin.", 4),
  sec(`<section class="an-rescards pk-bleed"><div class="an-wrap an-rc">${[["Soleil noir", "Dakar", "8 semaines", "Arts visuels, sculpture, textile", "Un atelier de 120 m² face à l'océan et un accompagnement technique pour les pièces de grand format."], ["Laboratoire Signal", "Lagos", "6 semaines", "Musique, son, performance", "Un studio équipé de synthétiseurs modulaires et une scène d'essai pour présenter ses maquettes."], ["Fil d'or", "Abidjan", "4 semaines", "Mode, teinture, design", "Cuves de teinture, métiers à tisser et ateliers de couture, avec des artisans partenaires."]].map(([n, v, d, disc, t], i) => `<article class="an-rcard an-rc${i}" data-reveal>${art(i * 2, i + 1)}<div><h3>${n}</h3><p class="an-rc-meta">${v} · ${d}</p><p><strong>${disc}</strong></p><p>${t}</p></div></article>`).join("")}</div></section>`),
  sec(`<section class="an-cal pk-bleed"><div class="an-wrap"><h2 class="an-h2" data-reveal>Calendrier indicatif</h2><table class="an-table" data-reveal><caption>Dates de démonstration des trois résidences</caption><thead><tr><th>Résidence</th><th>Appel ouvert</th><th>Clôture</th><th>Début</th></tr></thead><tbody>
    <tr><td data-l="Résidence">Soleil noir</td><td data-l="Appel ouvert">1er septembre</td><td data-l="Clôture">15 octobre</td><td data-l="Début">12 janvier</td></tr>
    <tr><td data-l="Résidence">Laboratoire Signal</td><td data-l="Appel ouvert">15 octobre</td><td data-l="Clôture">30 novembre</td><td data-l="Début">23 février</td></tr>
    <tr><td data-l="Résidence">Fil d'or</td><td data-l="Appel ouvert">1er décembre</td><td data-l="Clôture">31 janvier</td><td data-l="Début">5 avril</td></tr></tbody></table>
    <p class="an-muted" data-reveal>Dates fictives. Aucune candidature n'est enregistrée sur ce site de démonstration ; pour toute question, passez par le formulaire de contact.</p></div></section>`),
  sec(`<section class="an-steps pk-bleed"><div class="an-wrap"><h2 class="an-h2" data-reveal>Comment ça se passe</h2><ol class="an-steps-l">${["Présentez votre démarche|Un dossier court : textes, images, une lettre qui dit pourquoi ici, pourquoi maintenant.", "Rencontrez le comité|Un échange d'une demi-heure avec trois membres du collectif et un artiste invité.", "Travaillez|Un atelier, une équipe technique, un déjeuner partagé le vendredi avec les autres résidents.", "Montrez|Une restitution ouverte au public à la fin de la résidence."].map((s, i) => { const [t, d] = s.split("|"); return `<li data-reveal><b>${i + 1}</b><div><h3>${t}</h3><p>${d}</p></div></li>`; }).join("")}</ol><a class="an-btn" href="/contact">Poser une question ${arrow}</a></div></section>`),
  sec(footer(c))];

const apropos = (c) => [sec(header(c)), pagehead("Depuis 2019", "À propos", "Un collectif d'artistes, de producteurs et de médiatrices qui préparent le futur avec soin.", 5),
  sec(`<section class="an-about pk-bleed"><div class="an-wrap an-about-in"><div data-reveal>${art(0, 0)}</div><div data-reveal><h2 class="an-h2">Notre manifeste</h2><p class="an-lead">Nous croyons que l'imagination est un travail collectif. Nyota rassemble des artistes qui partent de leurs mémoires — gestes d'atelier, rythmes de quartier, histoires de famille — pour construire des mondes à venir.</p><p>Nous refusons les clichés et les raccourcis : chaque artiste présente sa propre démarche, avec ses mots. Le festival est un lieu de rencontre, pas une vitrine.</p></div></div></section>`),
  sec(`<section class="an-vals pk-bleed"><div class="an-wrap"><h2 class="an-h2" data-reveal>Quatre engagements</h2><ul class="an-vals-l">${[["Respect", "Chaque démarche est présentée telle que l'artiste la formule."], ["Transmission", "Chaque ville accueille des ateliers ouverts aux habitants."], ["Rémunération juste", "Les artistes sont payés pour leur travail, y compris en résidence."], ["Sobriété", "Matériaux récupérés, transports mutualisés, scénographies réutilisées."]].map(([t, d], i) => `<li data-reveal>${art(i * 2 + 1, i + 3)}<h3>${t}</h3><p>${d}</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="an-time pk-bleed"><div class="an-wrap"><h2 class="an-h2" data-reveal>Repères</h2><ol class="an-time-l">${[["2019", "Premières soirées dans un atelier de Dakar."], ["2021", "Naissance du collectif et de la première résidence."], ["2024", "Première édition du festival, trois villes."], ["2027", "Deuxième édition, cinq villes, trente-huit artistes."]].map(([y, t]) => `<li data-reveal><b>${y}</b><p>${t}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="an-team pk-bleed"><div class="an-wrap"><h2 class="an-h2" data-reveal>L'équipe (fictive)</h2><ul class="an-team-l">${[["Binta Sarr-Lambert", "Direction artistique"], ["Marcus Eyoum", "Production"], ["Ines Lopes Farah", "Médiation"], ["Samuel Boateng-Roux", "Résidences"]].map(([n, r], i) => `<li data-reveal>${art(i + 3, i + 5)}<b>${n}</b><span>${r}</span></li>`).join("")}</ul></div></section>`),
  sec(footer(c))];

const presse = (c) => [sec(header(c)), pagehead("Espace presse", "Presse", "Communiqués, visuels libres de droits pour la démonstration, contact de la responsable presse.", 0),
  sec(`<section class="an-press pk-bleed"><div class="an-wrap an-press-in"><div><h2 class="an-h2" data-reveal>Communiqués</h2><ul class="an-pr-l">${[["12 janvier 2027", "Nyota annonce sa deuxième édition", "Cinq villes, trente-huit artistes et trois résidences."], ["3 février 2027", "Ouverture à Abidjan : la Veillée des Cadrans", "Douze performeurs, une nuit entière, entrée libre."], ["20 février 2027", "Le programme musical dévoilé", "Du modulaire à la chorale de ferrailles."], ["2 mars 2027", "Cartographies du soleil, exposition collective à Dakar", "Quinze artistes, des cartes imaginaires."]].map(([d, t, x]) => `<li data-reveal><time>${d}</time><h3>${t}</h3><p>${x}</p></li>`).join("")}</ul><p class="an-muted">Communiqués fictifs rédigés pour la démonstration.</p></div>
    <aside class="an-kit" data-reveal><h2 class="an-h3">Kit médias</h2><ul><li>Logo du festival, versions claire et sombre</li><li>Dossier de présentation (12 pages)</li><li>Biographies des artistes invités</li><li>Visuels de la saison</li></ul><p>Responsable presse : Ines Lopes Farah</p><a class="an-btn an-btn--ink" href="mailto:presse@nyota.example">presse@nyota.example</a><a class="an-more" href="/contact">Ou via le formulaire ${arrow}</a></aside></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Écrire au collectif", "Contact", "Une question, un projet de résidence, une venue en groupe ou une demande presse.", 2),
  { type: "form", heading: "Écrire à Nyota", intro: "Dites-nous qui vous êtes et ce que vous cherchez ; nous répondons sous quelques jours." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une envie ?", "Un artiste, une œuvre, un rendez-vous.", 1), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="an-404 pk-bleed"><div class="an-drift an-pt-1" aria-hidden="true"></div><div class="an-404-in"><div class="an-404-art" aria-hidden="true">${art(0, 2)}</div><p class="an-kicker">Page introuvable</p><div class="an-h1" role="heading" aria-level="1">404</div><p class="an-ph-sub">Cette page n'existe pas ou a changé d'adresse. Le reste de la constellation vous attend.</p><a class="an-btn" href="/">Retour à l'accueil ${arrow}</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "ankara", name: "Ankara", version: "2.0.0", category: "agence", tags: ["audacieux", "geometrique", "chaleureux"], siteType: "Collectif culturel et festival d'art afro-contemporain", featured: true,
  concept: "Un festival afro-futuriste : motifs géométriques originaux qui dérivent, carte de navigation plein écran, mosaïque d'artistes avec fiches en panneau et agenda culturel filtrable.",
  description: "Collectif culturel et festival d'art afro-contemporain : indigo, ocre, émeraude et rose vif, motifs géométriques animés, mosaïque d'artistes, agenda filtrable par discipline, ville et mois, résidences et presse.",
  brand: "Nyota — Festival d'art afro-contemporain", modules: ["formulaires", "recherche"],
  dna: { header: "carte-plein-ecran-repliable", hero: "motifs-geometriques-animes-et-totem-svg", grid: "mosaique-tuiles-inegales-et-fiches-panneau", motion: "motifs-qui-derivent-et-revelation-par-tuile", shapes: "soleils-concentriques-losanges-et-arches", rhythm: "bandes-de-couleur-narratives", signature: "agenda-filtrable-et-fiche-artiste-en-panneau" },
  tokens: {
    colors: { primary: "#d81b60", secondary: "#1b1450", accent: "#f2a81d", background: "#1b1450", surface: "#2e2290", text: "#fff6e3", muted: "#cfc8f5", success: "#19c37d", warning: "#f2a81d", error: "#ff7a8a" },
    fonts: { heading: "font.syne", body: "font.albert-sans", button: "font.syne", link: "font.albert-sans" },
    radius: { sm: 6, md: 14, lg: 28, button: 999, field: 12, card: 22 }, shadow: { card: "0 18px 40px rgba(8,5,40,.35)", button: "none" }, border: { width: 2, color: "#fff6e3" },
    type: { h1: { size: 104, weight: 800, lineHeight: 0.95 }, h2: { size: 52, weight: 800, lineHeight: 1.02 } },
  },
  options: [
    { key: "accent", label: "Rose vif", type: "color", default: "#ff5a9b" },
    { key: "ocre", label: "Ocre du soleil", type: "color", default: "#f2a81d" },
    { key: "motifs", label: "Motifs de fond", type: "choice", default: "drift", choices: [["drift", "Qui dérivent"], ["still", "Immobiles"]] },
    { key: "tuiles", label: "Forme des tuiles", type: "choice", default: "arc", choices: [["arc", "Arrondies en arc"], ["square", "Carrées"]] },
  ],
  menu: [["Accueil", "/"], ["Programme", "/programme"], ["Artistes", "/artistes"], ["Œuvres", "/oeuvres"], ["Résidences", "/residences"], ["À propos", "/a-propos"], ["Presse", "/presse"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "programme", name: "Programme", render: programme }, { key: "artistes", name: "Artistes", render: artistes },
    { key: "oeuvres", name: "Œuvres", render: oeuvres }, { key: "residences", name: "Résidences", render: residences }, { key: "a-propos", name: "À propos", render: apropos },
    { key: "presse", name: "Presse", render: presse }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
