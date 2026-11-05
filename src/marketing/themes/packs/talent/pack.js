// Talent — agence de recrutement. Direction artistique : portraits dessinés en aplats (aucune photo), jaune soleil, bleu ciel vif et corail sur blanc.
// Mosaïque de visages souriants qui se retournent autour du titre, compteur d'offres dans la barre, offres filtrables avec fiche en panneau et candidature guidée en 3 étapes.
const { sec, form, esc, nav } = require("../kit");

// ---------- Portraits en aplats ----------
const SKIN = ["#f7cfa8", "#e9a97c", "#c98b5b", "#8f5a36", "#fbdcc0", "#a8734b"];
const HAIR = ["#2a1a12", "#7b3f1c", "#f0b43c", "#16161d", "#bfc2cc", "#b3432a"];
const BG = ["#ffc933", "#2f7bff", "#ff6a55", "#bfe0ff", "#ffe39a", "#ffc4b8", "#8bbcff", "#fff0bd"];
const TOP = ["#17204a", "#ffffff", "#2f7bff", "#ff6a55", "#ffc933", "#2fa88a"];
const HAIRPATH = [
  (h) => `<path d="M30 40c-1-15 8-24 20-24s21 9 20 24c-5-8-11-11-20-11s-15 3-20 11z" fill="${h}"/>`,
  (h) => `<path d="M26 66V42c0-17 10-26 24-26s24 9 24 26v24c-3 0-5-2-6-6l-2-18c-6-2-11-6-14-12-4 7-9 11-16 12l-4 18c-1 4-3 6-6 6z" fill="${h}"/>`,
  (h) => `<circle cx="50" cy="14" r="9" fill="${h}"/><path d="M30 41c-1-15 8-23 20-23s21 8 20 23c-5-7-11-10-20-10s-15 3-20 10z" fill="${h}"/>`,
  (h) => `<g fill="${h}"><circle cx="34" cy="30" r="10"/><circle cx="50" cy="22" r="11"/><circle cx="66" cy="30" r="10"/><circle cx="31" cy="42" r="7"/><circle cx="69" cy="42" r="7"/></g>`,
  (h) => `<path d="M31 46c0 13 8 22 19 22s19-9 19-22c-3 6-8 10-19 10S34 52 31 46z" fill="${h}"/><path d="M31 38c0-12 8-19 19-19s19 7 19 19c-5-4-10-6-19-6s-14 2-19 6z" fill="${h}" opacity=".0"/>`,
  (h, t) => `<path d="M30 38c0-13 8-21 20-21s20 8 20 21z" fill="${t}"/><path d="M28 38h50c0 3-3 5-6 5H30z" fill="${t}"/>`,
];
// Un visage : bg, peau, cheveux, haut, coiffure (0–5), lunettes, sourire (large ou doux)
function face(n) {
  const s = SKIN[n % 6], h = HAIR[(n * 5 + 1) % 6], bg = BG[(n * 3 + 1) % 8], t = TOP[(n * 7 + 2) % 6], st = (n * 11 + 3) % 6, gl = n % 4 === 1, wide = n % 3 !== 2;
  const behind = st === 1 ? HAIRPATH[1](h) : "";
  const front = st === 1 ? `<path d="M31 36c6-1 13-6 17-13 4 7 11 12 21 13-2-7-9-15-19-15s-17 8-19 15z" fill="${h}"/>` : HAIRPATH[st](h, TOP[(n + 3) % 6]);
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="${bg}"/>${behind}<path d="M10 100c0-19 16-29 40-29s40 10 40 29z" fill="${t}"/><path d="M43 62h14v13c-5 4-9 4-14 0z" fill="${s}"/><ellipse cx="50" cy="45" rx="19" ry="21" fill="${s}"/>${front}<circle cx="42" cy="46" r="2.3" fill="#17204a"/><circle cx="58" cy="46" r="2.3" fill="#17204a"/>${gl ? `<g fill="none" stroke="#17204a" stroke-width="1.8"><circle cx="42" cy="46" r="6.5"/><circle cx="58" cy="46" r="6.5"/><path d="M48.5 46h3"/></g>` : ""}<path d="${wide ? "M40 55q10 10 20 0z" : "M42 56q8 6 16 0"}" fill="${wide ? "#fff" : "none"}" stroke="#17204a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
const avatar = (n, cls = "tl-av") => `<span class="${cls}">${face(n)}</span>`;

const mark = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#ffc933"/><circle cx="14" cy="16" r="2.6" fill="#17204a"/><circle cx="26" cy="16" r="2.6" fill="#17204a"/><path d="M10 24q10 12 20 0z" fill="#17204a"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------- Offres (démonstration) ----------
const OFFERS = [
  { t: "Développeuse front-end", co: "Lumio Studio", sec: "Numérique", ct: "CDI", city: "Lyon", rem: "hybride", sal: "42–52 k€", s: 47, d: 2, sk: ["React", "Accessibilité", "TypeScript"], ab: "Studio de produits numériques de 38 personnes, spécialisé dans les services publics et la santé.",
    mi: ["Concevoir et développer des interfaces accessibles", "Relire le code de l'équipe et partager les bonnes pratiques", "Travailler avec les designers dès les maquettes"], pr: ["3 ans d'expérience avec React", "Sensibilité accessibilité (RGAA)", "Goût du travail en équipe"], av: ["2 jours de télétravail par semaine", "Budget de formation annuel", "Mutuelle prise en charge"] },
  { t: "Infirmier coordinateur", co: "Clinique des Tilleuls", sec: "Santé", ct: "CDI", city: "Nantes", rem: "non", sal: "34–40 k€", s: 37, d: 1, sk: ["Coordination", "Soins", "Planning"], ab: "Clinique de 120 lits, réputée pour son accompagnement des patients et de ses équipes.",
    mi: ["Coordonner les parcours de soins du service", "Encadrer une équipe de 12 soignants", "Assurer le lien avec les familles"], pr: ["Diplôme d'État d'infirmier", "2 ans en service hospitalier", "Sens de l'écoute"], av: ["Horaires planifiés trois mois à l'avance", "Primes de coordination", "Crèche d'entreprise"] },
  { t: "Responsable de boutique", co: "Maison Orée", sec: "Commerce", ct: "CDI", city: "Bordeaux", rem: "non", sal: "30–36 k€", s: 33, d: 4, sk: ["Management", "Vente", "Merchandising"], ab: "Maison de décoration et d'artisanat d'art présente dans quatre villes.",
    mi: ["Animer une équipe de 5 vendeurs", "Piloter les ventes et le stock", "Imaginer les vitrines de saison"], pr: ["Expérience en boutique ou en magasin", "Leadership bienveillant", "Sens de l'esthétique"], av: ["Prime sur objectifs collectifs", "Remise de 30 % sur la collection", "Samedis tournants"] },
  { t: "Technicienne de maintenance", co: "Forges du Rhin", sec: "Industrie", ct: "CDI", city: "Strasbourg", rem: "non", sal: "32–38 k€", s: 35, d: 6, sk: ["Électromécanique", "Automatismes", "Sécurité"], ab: "Fonderie familiale qui modernise ses lignes de production.",
    mi: ["Assurer la maintenance préventive des lignes", "Diagnostiquer et réparer les pannes", "Proposer des améliorations d'équipements"], pr: ["Bac pro ou BTS maintenance", "Habilitation électrique appréciée", "Rigueur et autonomie"], av: ["Équipe stable de 8 techniciens", "Prime d'astreinte", "Formations certifiantes"] },
  { t: "Comptable fournisseurs", co: "Cabinet Verdier", sec: "Finance", ct: "CDD", city: "Lille", rem: "hybride", sal: "31–35 k€", s: 33, d: 3, sk: ["Comptabilité", "Rapprochements", "Excel"], ab: "Cabinet d'expertise comptable de 25 collaborateurs au cœur de Lille.",
    mi: ["Saisir et contrôler les factures fournisseurs", "Préparer les règlements et rapprochements", "Appuyer l'équipe lors des clôtures"], pr: ["BTS ou DUT comptabilité", "1 an d'expérience", "Maîtrise d'Excel"], av: ["Contrat de 9 mois avec perspective de CDI", "Tickets restaurant", "Télétravail 2 jours"] },
  { t: "Data analyst", co: "Alpha Mobilités", sec: "Numérique", ct: "CDI", city: "Toulouse", rem: "total", sal: "45–55 k€", s: 50, d: 5, sk: ["SQL", "Python", "Visualisation"], ab: "Opérateur de services de mobilité partagée, présent dans douze agglomérations.",
    mi: ["Construire des tableaux de bord pour les équipes terrain", "Analyser l'usage des services", "Fiabiliser les données avec les ingénieurs"], pr: ["3 ans en analyse de données", "SQL avancé, Python", "Pédagogie auprès des non-spécialistes"], av: ["Télétravail total possible", "Deux séminaires par an", "Matériel au choix"] },
  { t: "Cheffe de projet digital", co: "Atelier Nord", sec: "Numérique", ct: "Freelance", city: "Lyon", rem: "total", sal: "450–550 €/jour", s: 55, d: 8, sk: ["Pilotage", "Agilité", "Recette"], ab: "Agence de création de sites et d'applications pour des marques régionales.",
    mi: ["Piloter une refonte de site sur 5 mois", "Animer les rituels agiles", "Suivre budgets et plannings"], pr: ["5 ans de gestion de projets web", "Autonomie complète", "Bon sens du relationnel client"], av: ["Mission de 5 mois renouvelable", "Télétravail total", "Paiement à 30 jours"] },
  { t: "Assistant marketing en alternance", co: "Maison Orée", sec: "Commerce", ct: "Alternance", city: "Nantes", rem: "hybride", sal: "Selon barème légal", s: 22, d: 7, sk: ["Réseaux sociaux", "Rédaction", "Photographie"], ab: "Maison de décoration et d'artisanat d'art présente dans quatre villes.",
    mi: ["Préparer le calendrier éditorial", "Rédiger newsletters et fiches produits", "Aider à l'organisation des événements en boutique"], pr: ["Bac+2 à bac+3 en marketing ou communication", "Plume soignée", "Curiosité pour les métiers d'art"], av: ["Rythme 3 jours / 2 jours", "Tutorat dédié", "Possibilité d'embauche à l'issue"] },
  { t: "Responsable logistique", co: "Transports Cavaillé", sec: "Logistique", ct: "CDI", city: "Lille", rem: "non", sal: "40–48 k€", s: 44, d: 9, sk: ["Entrepôt", "Transport", "Management"], ab: "Transporteur régional avec 90 véhicules et trois plateformes.",
    mi: ["Organiser les tournées et les quais", "Encadrer 25 personnes sur deux sites", "Améliorer les délais et la sécurité"], pr: ["5 ans en logistique", "Management d'équipe", "Maîtrise d'un outil de gestion d'entrepôt"], av: ["Voiture de fonction", "Prime de performance", "13e mois"] },
  { t: "Aide-soignante", co: "Résidence Les Aubépines", sec: "Santé", ct: "CDD", city: "Bordeaux", rem: "non", sal: "26–29 k€", s: 28, d: 2, sk: ["Accompagnement", "Hygiène", "Équipe"], ab: "Résidence pour seniors de 70 chambres, ouverte sur son quartier.",
    mi: ["Accompagner les résidents au quotidien", "Participer aux animations", "Transmettre à l'équipe soignante"], pr: ["Diplôme d'aide-soignant", "Douceur et patience", "Goût du travail en binôme"], av: ["CDD de 6 mois renouvelable", "Primes de dimanche", "Plannings équitables"] },
  { t: "Designer d'expérience", co: "Lumio Studio", sec: "Numérique", ct: "CDI", city: "Lyon", rem: "hybride", sal: "40–50 k€", s: 45, d: 10, sk: ["Recherche utilisateur", "Prototypage", "Design system"], ab: "Studio de produits numériques de 38 personnes, spécialisé dans les services publics et la santé.",
    mi: ["Mener des entretiens avec les utilisateurs", "Prototyper et tester les parcours", "Faire vivre le design system"], pr: ["3 ans en conception d'interfaces", "Portfolio solide", "Esprit d'atelier"], av: ["2 jours de télétravail par semaine", "Journées de recherche payées", "Mutuelle prise en charge"] },
  { t: "Contrôleuse de gestion", co: "Groupe Valmy", sec: "Finance", ct: "CDI", city: "Toulouse", rem: "hybride", sal: "46–56 k€", s: 51, d: 12, sk: ["Budget", "Reporting", "Analyse"], ab: "Groupe de distribution de 600 salariés, en croissance depuis cinq ans.",
    mi: ["Construire et suivre les budgets", "Produire le reporting mensuel", "Conseiller les directions opérationnelles"], pr: ["Bac+5 en finance", "4 ans en contrôle de gestion", "Clarté de communication"], av: ["3 jours de télétravail possibles", "Participation et intéressement", "Parcours de carrière défini"] },
];
const SECTORS = ["Numérique", "Santé", "Commerce", "Industrie", "Finance", "Logistique"];
const REM = { non: "Sur site", hybride: "Hybride", total: "Télétravail" };
const ago = (d) => (d === 1 ? "hier" : d < 7 ? `il y a ${d} j` : `il y a ${Math.round(d / 7)} sem.`);
const initials = (co) => co.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const bubble = (i, co) => `<span class="tl-logo tl-lg${i % 5}" aria-hidden="true">${esc(initials(co))}</span>`;
const ul = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

function card(o, i, withMore = true) {
  const more = withMore ? `<div class="tl-more" hidden><p>${esc(o.ab)}</p><h4>Vos missions</h4>${ul(o.mi)}<h4>Votre profil</h4>${ul(o.pr)}<h4>Ce que vous trouverez</h4>${ul(o.av)}</div>` : "";
  return `<article class="tl-card" data-reveal data-sector="${esc(o.sec)}" data-contract="${esc(o.ct)}" data-city="${esc(o.city)}" data-rem="${o.rem}" data-days="${o.d}" data-sal="${o.s}" data-skills="${esc(o.sk.join("|"))}" data-co="${esc(o.co)}" data-salary="${esc(o.sal)}">
  <div class="tl-card-top">${bubble(i, o.co)}<span class="tl-ct tl-ct--${o.ct.toLowerCase()}">${esc(o.ct)}</span><span class="tl-ago">${ago(o.d)}</span></div>
  <h3 class="tl-card-t"><a href="/offre" data-tl-open>${esc(o.t)}</a></h3><p class="tl-card-co">${esc(o.co)} · ${esc(o.sec)}</p>
  <ul class="tl-meta"><li class="tl-loc">${esc(o.city)}</li><li class="tl-rem tl-rem--${o.rem}">${REM[o.rem]}</li></ul>
  <p class="tl-skills">${o.sk.map((k) => `<span>${esc(k)}</span>`).join("")}</p>
  <div class="tl-card-foot"><b>${esc(o.sal)}</b><span class="tl-go">Voir l'offre</span></div>${more}</article>`;
}

// ---------- En-tête et pied ----------
const header = (c) => `<header class="tl-head pk-bleed"><div class="tl-bar">
  <a class="tl-logo-brand" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span>talent</span></a>
  <div class="tl-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <a class="tl-live" href="/offres" aria-label="Offres en ligne"><i class="tl-dot" aria-hidden="true"></i><b data-live="148">148</b> offres en ligne</a>
  <a class="tl-btn tl-btn--blue tl-cv" href="/contact">Déposer mon CV</a>
  <details class="tl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="tl-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="tl-live tl-live--m" href="/offres"><i class="tl-dot" aria-hidden="true"></i><b data-live="148">148</b> offres en ligne</a><a class="tl-btn tl-btn--blue" href="/contact">Déposer mon CV</a></div></details>
</div></header>`;

const footer = (c) => `<footer class="tl-foot pk-bleed"><div class="tl-wrap"><div class="tl-foot-faces" aria-hidden="true">${[3, 8, 14, 19, 25, 30, 37].map((n) => avatar(n, "tl-av tl-av--s")).join("")}</div>
  <div class="tl-foot-grid"><div><p class="tl-foot-lead">Chaque poste est une rencontre.</p><p>Talent · 18 quai des Teinturiers<br>69002 Lyon<br><a href="mailto:bonjour@talent.example">bonjour@talent.example</a></p></div>
  <div><h3>Candidats</h3><a href="/offres">Offres d'emploi</a><a href="/candidats">Conseils</a><a href="/contact">Déposer mon CV</a></div>
  <div><h3>Entreprises</h3><a href="/entreprises">Nos services</a><a href="/a-propos">Notre équipe</a><a href="/contact">Nous écrire</a></div>
  <div><h3>Le site</h3><a href="/recherche">Recherche</a><a href="/contact">Contact</a><a href="/introuvable">Plan d'accès</a></div></div>
  <p class="tl-legal">© Talent — site de démonstration. Entreprises, offres, personnes et chiffres fictifs ; aucune candidature n'est réellement transmise.</p></div></footer>`;

const pagehead = (kicker, title, sub, extra = "") => sec(`<section class="tl-ph pk-bleed"><div class="tl-wrap tl-ph-in"><div><p class="tl-kicker" data-reveal>${esc(kicker)}</p><div class="tl-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="tl-ph-sub" data-reveal>${esc(sub)}</p>` : ""}${extra}</div>
  <div class="tl-ph-faces" aria-hidden="true">${[5, 12, 21, 26].map((n, i) => avatar(n, `tl-av tl-av--p${i}`)).join("")}</div></div></section>`);

const cta = (title, text, label = "Nous écrire") => sec(`<section class="tl-cta pk-bleed"><div class="tl-wrap tl-cta-in"><div><h2 class="tl-h2" data-reveal>${title}</h2><p data-reveal>${esc(text)}</p></div><a class="tl-btn tl-btn--ink tl-btn--lg" href="/contact" data-reveal>${esc(label)} ${arrow}</a></div></section>`);

// ---------- Accueil ----------
const home = (c) => {
  const tiles = Array.from({ length: 12 }, (_, i) => `<div class="tl-t tl-t${i % 4}"><div class="tl-flip"><div class="tl-fa">${face(i)}</div><div class="tl-fb">${face(i + 12)}</div></div></div>`).join("");
  return [
    sec(header(c)),
    sec(`<section class="tl-hero pk-bleed"><div class="tl-hero-grid">
      <div class="tl-hero-copy"><p class="tl-kicker" data-reveal>Agence de recrutement · Lyon, Nantes, Lille</p>
        <div class="tl-h1 tl-h1--xl" role="heading" aria-level="1" data-reveal>Derrière chaque poste, <span class="tl-hl">un sourire</span> à rencontrer.</div>
        <p class="tl-lead" data-reveal>Nous mettons en relation des personnes et des entreprises qui se ressemblent. Des échanges humains, des offres claires, un accompagnement jusqu'au premier jour.</p>
        <div class="tl-actions" data-reveal><a class="tl-btn tl-btn--blue tl-btn--lg" href="/offres">Voir les offres ${arrow}</a><a class="tl-btn tl-btn--coral tl-btn--lg" href="/entreprises">Je recrute</a></div></div>
      ${tiles}</div></section>`),
    sec(`<section class="tl-sectors pk-bleed"><div class="tl-wrap"><p class="tl-kicker" data-reveal>Explorer par secteur</p><ul class="tl-chips">${SECTORS.map((s, i) => `<li data-reveal><a class="tl-chip tl-chip--${i % 3}" href="/offres">${esc(s)}<b>${OFFERS.filter((o) => o.sec === s).length * 12 + 4}</b></a></li>`).join("")}</ul></div></section>`),
    sec(`<section class="tl-latest pk-bleed"><div class="tl-wrap"><div class="tl-sechead"><h2 class="tl-h2" data-reveal>Les dernières offres</h2><a class="tl-more-link" href="/offres" data-reveal>Toutes les offres ${arrow}</a></div>
      <div class="tl-grid">${OFFERS.slice(0, 6).map((o, i) => card(o, i, false)).join("")}</div></div></section>`),
    sec(`<section class="tl-steps pk-bleed"><div class="tl-wrap"><p class="tl-kicker" data-reveal>Comment ça marche</p><h2 class="tl-h2" data-reveal>Trois rencontres, pas un formulaire de plus.</h2>
      <ol class="tl-steps-in">
        <li data-reveal><span class="tl-num">1</span>${avatar(9, "tl-av tl-av--m")}<h3>On se parle</h3><p>Trente minutes au téléphone ou en visio pour comprendre votre parcours, vos envies, vos limites.</p></li>
        <li data-reveal><span class="tl-num">2</span>${avatar(16, "tl-av tl-av--m")}<h3>On vous présente</h3><p>Nous ne transmettons que les profils qui correspondent vraiment, avec un mot personnel pour chaque entreprise.</p></li>
        <li data-reveal><span class="tl-num">3</span>${avatar(22, "tl-av tl-av--m")}<h3>On reste à vos côtés</h3><p>Préparation d'entretien, retours francs, suivi pendant les premières semaines en poste.</p></li></ol></div></section>`),
    sec(`<section class="tl-duo pk-bleed"><div class="tl-duo-in">
      <article class="tl-duo-a" data-reveal><div class="tl-duo-faces" aria-hidden="true">${avatar(4, "tl-av")}${avatar(11, "tl-av")}</div><h2 class="tl-h2">Vous cherchez un poste</h2><p>Conseils sur le CV, préparation d'entretien, accès à des offres qui ne sont pas toutes publiques.</p><a class="tl-btn tl-btn--yellow" href="/candidats">Nos conseils ${arrow}</a></article>
      <article class="tl-duo-b" data-reveal><div class="tl-duo-faces" aria-hidden="true">${avatar(18, "tl-av")}${avatar(27, "tl-av")}</div><h2 class="tl-h2">Vous recrutez</h2><p>Un cahier des charges écrit à deux, des candidats présentés en quinze jours, une période de suivi incluse.</p><a class="tl-btn tl-btn--ink" href="/entreprises">Nos services ${arrow}</a></article></div></section>`),
    sec(`<section class="tl-stats pk-bleed"><ul class="tl-wrap tl-stats-in"><li data-reveal><b data-count="1240">1240</b><span>personnes accompagnées l'an dernier</span></li><li data-reveal><b data-count="86" data-suffix=" %">86 %</b><span>encore en poste après un an</span></li><li data-reveal><b data-count="19">19</b><span>jours pour une première présentation</span></li><li data-reveal><b data-count="340">340</b><span>entreprises partenaires</span></li></ul><p class="tl-demo">Chiffres de démonstration.</p></section>`),
    cta("Votre prochain poste commence par une conversation.", "Dites-nous qui vous êtes, nous cherchons avec vous."),
    sec(footer(c)),
  ];
};

// ---------- Offres ----------
const offres = (c) => [
  sec(header(c)),
  pagehead("Offres d'emploi", "Trouvez le poste<br>qui vous <span class=\"tl-hl\">ressemble</span>.", "Filtrez par secteur, contrat, ville ou mot-clé. Offres de démonstration.", `<p class="tl-count" aria-live="polite"><b data-tl-total>${OFFERS.length}</b> offres affichées</p>`),
  sec(`<section class="tl-jobs pk-bleed"><div class="tl-wrap"><div class="tl-filters" data-tl-filters role="search" aria-label="Filtrer les offres"></div>
    <div class="tl-grid tl-grid--jobs" data-tl-list>${OFFERS.map((o, i) => card(o, i)).join("")}</div>
    <div class="tl-empty" data-tl-empty hidden>${avatar(2, "tl-av tl-av--m")}<h2 class="tl-h3">Aucune offre pour cette recherche.</h2><p>Essayez moins de filtres, ou laissez-nous votre CV : nous vous écrivons dès qu'un poste correspond.</p><a class="tl-btn tl-btn--blue" href="/contact">Déposer mon CV</a></div></div></section>`),
  sec(footer(c)),
];

// ---------- Fiche offre ----------
const O = OFFERS[0];
const offre = (c) => [
  sec(header(c)),
  sec(`<section class="tl-fiche-head pk-bleed"><div class="tl-wrap"><p class="tl-crumbs"><a href="/">Accueil</a> / <a href="/offres">Offres</a> / ${esc(O.t)}</p>
    <div class="tl-fh"><div>${bubble(0, O.co)}<div class="tl-h1" role="heading" aria-level="1">${esc(O.t)}</div><p class="tl-fh-co">${esc(O.co)} · ${esc(O.city)}</p>
    <ul class="tl-meta tl-meta--big"><li><span class="tl-ct tl-ct--cdi">${O.ct}</span></li><li class="tl-loc">${esc(O.city)}</li><li class="tl-rem tl-rem--${O.rem}">${REM[O.rem]}</li><li>Publiée ${ago(O.d)}</li></ul></div>
    <div class="tl-fh-faces" aria-hidden="true">${avatar(1, "tl-av")}</div></div></div></section>`),
  sec(`<section class="tl-fiche pk-bleed"><div class="tl-wrap tl-fiche-in"><div class="tl-fiche-main">
    <h2 class="tl-h3" data-reveal>L'entreprise</h2><p data-reveal>${esc(O.ab)}</p>
    <h2 class="tl-h3" data-reveal>Vos missions</h2><div data-reveal>${ul(O.mi)}</div>
    <h2 class="tl-h3" data-reveal>Votre profil</h2><div data-reveal>${ul(O.pr)}</div>
    <h2 class="tl-h3" data-reveal>Ce que vous trouverez</h2><div data-reveal>${ul(O.av)}</div>
    <h2 class="tl-h3" data-reveal>Le déroulé du recrutement</h2>
    <ol class="tl-flow" data-reveal><li><b>Candidature</b><span>Réponse sous 5 jours</span></li><li><b>Échange avec Talent</b><span>30 minutes</span></li><li><b>Rencontre avec l'équipe</b><span>1 heure</span></li><li><b>Proposition</b><span>Sous une semaine</span></li></ol></div>
    <aside class="tl-fiche-side" aria-label="Résumé de l'offre"><div class="tl-sum"><p class="tl-sum-sal">${esc(O.sal)}<small>brut annuel indicatif</small></p>
      <dl><div><dt>Contrat</dt><dd>${O.ct}</dd></div><div><dt>Ville</dt><dd>${O.city}</dd></div><div><dt>Télétravail</dt><dd>2 jours par semaine</dd></div><div><dt>Secteur</dt><dd>${O.sec}</dd></div></dl>
      <p class="tl-skills">${O.sk.map((k) => `<span>${esc(k)}</span>`).join("")}</p>
      <a class="tl-btn tl-btn--blue tl-btn--block tl-btn--lg" href="#postuler" data-tl-apply data-title="${esc(O.t)}" data-co="${esc(O.co)}" data-skills="${esc(O.sk.join("|"))}">Postuler en 3 étapes ${arrow}</a><p class="tl-note">Rien n'est envoyé ici : le récapitulatif se termine par notre formulaire de contact.</p></div></aside></div></section>`),
  sec(`<section class="tl-latest tl-latest--alt pk-bleed"><div class="tl-wrap"><div class="tl-sechead"><h2 class="tl-h2">Offres proches</h2><a class="tl-more-link" href="/offres">Toutes les offres ${arrow}</a></div><div class="tl-grid">${[10, 5, 6].map((k, i) => card(OFFERS[k], i + 2, false)).join("")}</div></div></section>`),
  sec(footer(c)),
];

// ---------- Candidats ----------
const TIPS = [
  { k: "cv", n: "Votre CV", title: "Une page, une histoire.", lead: "Un recruteur lit un CV en moins d'une minute. Aidez-le à retenir l'essentiel.", pts: ["Commencez par un titre clair : le poste visé, pas votre dernier poste", "Trois réalisations chiffrées valent dix lignes de missions", "Un seul format, des polices lisibles, aucun tableau compliqué", "Relisez à voix haute : si vous butez, le recruteur butera aussi"], check: ["Mon titre annonce le poste visé", "J'ai chiffré au moins trois réalisations", "Mon CV tient sur une ou deux pages", "J'ai fait relire mon CV par une personne de confiance"] },
  { k: "entretien", n: "L'entretien", title: "Venir avec des questions.", lead: "Un entretien est un échange à deux. Vous évaluez aussi l'entreprise.", pts: ["Préparez trois histoires vraies : une réussite, un échec, un conflit résolu", "Renseignez-vous sur l'équipe et le produit, pas seulement sur l'entreprise", "Préparez cinq questions sur le quotidien du poste", "Remerciez par écrit dans la journée"], check: ["J'ai lu les dernières actualités de l'entreprise", "J'ai préparé trois histoires vraies", "J'ai écrit cinq questions à poser", "Je connais l'itinéraire et l'heure de départ"] },
  { k: "salaire", n: "La négociation", title: "Parler d'argent sans crispation.", lead: "Une négociation réussie laisse les deux parties satisfaites.", pts: ["Connaissez la fourchette du marché pour votre poste et votre ville", "Annoncez une fourchette, pas un chiffre unique", "Regardez aussi télétravail, formation, congés, intéressement", "Demandez un délai de réflexion avant de répondre"], check: ["J'ai comparé trois sources de salaires", "Je connais mon minimum acceptable", "J'ai listé mes critères autres que le salaire", "Je sais ce que je veux obtenir en priorité"] },
  { k: "reconversion", n: "La reconversion", title: "Changer de métier, pas de valeurs.", lead: "Vos compétences voyagent plus que vous ne le pensez.", pts: ["Listez ce que vous savez faire, indépendamment des intitulés", "Rencontrez trois personnes qui exercent le métier visé", "Testez par une courte mission ou un stage avant de vous lancer", "Parlez de votre parcours comme d'une force, avec des exemples concrets"], check: ["J'ai listé mes compétences transférables", "J'ai parlé à trois professionnels du métier visé", "J'ai identifié une formation courte utile", "J'ai préparé mon récit de reconversion"] },
];
const candidats = (c) => [
  sec(header(c)),
  pagehead("Pour les candidats", "Des conseils<br>qui <span class=\"tl-hl\">servent</span>.", "Quatre sujets, des listes à cocher, des exemples simples. Pas de jargon."),
  sec(`<section class="tl-tips pk-bleed"><div class="tl-wrap" data-tl-tabs>
    <div class="tl-tabs" role="tablist" aria-label="Sujets de conseils">${TIPS.map((t, i) => `<a href="#${t.k}" role="tab" class="tl-tab${i ? "" : " is-on"}" data-tab="${t.k}">${t.n}</a>`).join("")}</div>
    ${TIPS.map((t, i) => `<div class="tl-tabpanel" role="tabpanel" data-panel="${t.k}"${i ? " hidden" : ""}><div class="tl-tip-copy"><h2 class="tl-h2">${t.title}</h2><p class="tl-lead">${t.lead}</p><ul class="tl-pts">${t.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      <div class="tl-check" data-tl-checklist><h3 class="tl-h4">Ma liste avant de m'y mettre</h3><div class="tl-bar-p" aria-hidden="true"><i></i></div><p class="tl-check-n" aria-live="polite"><b>0</b> / ${t.check.length} faits</p><ul>${t.check.map((x) => `<li><a href="#fait" role="checkbox" aria-checked="false" data-tl-check>${esc(x)}</a></li>`).join("")}</ul></div></div>`).join("")}</div></section>`),
  sec(`<section class="tl-path pk-bleed"><div class="tl-wrap"><p class="tl-kicker" data-reveal>Notre accompagnement</p><h2 class="tl-h2" data-reveal>Du premier appel au premier mois.</h2>
    <ol class="tl-path-in">${[["Semaine 1", "Premier échange", "Nous écoutons votre parcours et vos envies."], ["Semaine 2", "Votre dossier", "Nous retravaillons CV et présentation avec vous."], ["Semaine 3", "Présentations", "Votre profil est proposé à des entreprises choisies."], ["Semaine 6", "Entretiens", "Préparation avant, débrief après chaque rencontre."], ["Mois 3", "Premier bilan", "Nous prenons des nouvelles de votre arrivée."]].map(([w, t, x], i) => `<li data-reveal class="tl-pi${i % 2}"><span>${w}</span><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="tl-faq pk-bleed"><div class="tl-wrap tl-faq-in"><h2 class="tl-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Est-ce payant pour les candidats ?</summary><p>Non, l'accompagnement est à la charge de l'entreprise qui recrute. Cette réponse est donnée à titre de démonstration.</p></details>
    <details data-reveal><summary>Combien de temps faut-il pour trouver un poste ?</summary><p>Cela dépend du métier et de la région. Nous vous donnons une estimation honnête dès le premier échange.</p></details>
    <details data-reveal><summary>Mon employeur sera-t-il prévenu ?</summary><p>Jamais sans votre accord. Votre dossier reste confidentiel tant que vous ne dites pas oui.</p></details></div></div></section>`),
  cta("Prêt à en parler ?", "Un message suffit pour démarrer.", "Déposer mon CV"),
  sec(footer(c)),
];

// ---------- Entreprises ----------
const entreprises = (c) => [
  sec(header(c)),
  sec(`<section class="tl-ent pk-bleed"><div class="tl-wrap tl-ent-in"><div class="tl-ent-left"><p class="tl-kicker" data-reveal>Pour les entreprises</p>
    <div class="tl-h1" role="heading" aria-level="1" data-reveal>Recruter, c'est d'abord <span class="tl-hl">bien se comprendre</span>.</div>
    <p class="tl-lead" data-reveal>Trois façons de travailler ensemble, selon l'urgence et l'enjeu. Les conditions précises sont définies avec vous, sans engagement avant un premier échange.</p><a class="tl-btn tl-btn--blue tl-btn--lg" href="/contact" data-reveal>Parler de mon besoin ${arrow}</a></div>
    <ol class="tl-svc">
      <li data-reveal class="tl-svc1"><span class="tl-num">01</span><div><h2 class="tl-h3">Recrutement ciblé</h2><p>Un poste, un cahier des charges rédigé ensemble, une présentation de profils qualifiés en quelques semaines.</p></div>${avatar(6, "tl-av tl-av--m")}</li>
      <li data-reveal class="tl-svc2"><span class="tl-num">02</span><div><h2 class="tl-h3">Renfort temporaire</h2><p>Remplacement, pic d'activité, projet limité : des personnes disponibles rapidement, avec suivi de la mission.</p></div>${avatar(13, "tl-av tl-av--m")}</li>
      <li data-reveal class="tl-svc3"><span class="tl-num">03</span><div><h2 class="tl-h3">Approche directe</h2><p>Pour les postes rares ou confidentiels : nous allons chercher les profils qui ne cherchent pas.</p></div>${avatar(20, "tl-av tl-av--m")}</li></ol></div></section>`),
  sec(`<section class="tl-cmp pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>Choisir la bonne formule</h2>
    <table class="tl-table" data-reveal><caption class="tl-sr">Comparaison des trois formules</caption><thead><tr><th>Critère</th><th>Recrutement ciblé</th><th>Renfort temporaire</th><th>Approche directe</th></tr></thead><tbody>
      <tr><th>Délai habituel</th><td data-l="Recrutement ciblé">4 à 6 semaines</td><td data-l="Renfort temporaire">Sous 10 jours</td><td data-l="Approche directe">6 à 10 semaines</td></tr>
      <tr><th>Type de contrat</th><td data-l="Recrutement ciblé">CDI, CDD</td><td data-l="Renfort temporaire">Mission, intérim</td><td data-l="Approche directe">CDI</td></tr>
      <tr><th>Profils</th><td data-l="Recrutement ciblé">Tous niveaux</td><td data-l="Renfort temporaire">Opérationnels</td><td data-l="Approche directe">Cadres, experts</td></tr>
      <tr><th>Suivi après l'arrivée</th><td data-l="Recrutement ciblé">3 mois</td><td data-l="Renfort temporaire">Pendant la mission</td><td data-l="Approche directe">6 mois</td></tr>
      <tr><th>Tarification</th><td data-l="Recrutement ciblé">Sur devis</td><td data-l="Renfort temporaire">Sur devis</td><td data-l="Approche directe">Sur devis</td></tr></tbody></table></div></section>`),
  sec(`<section class="tl-method pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>Notre méthode en quatre temps</h2><div class="tl-method-in">
    ${[["Écouter", "Une demi-journée dans vos locaux ou en visio pour comprendre l'équipe et la culture."], ["Chercher", "Réseau, offres, approche directe : nous cherchons là où sont les bons profils."], ["Présenter", "Trois à cinq candidats, chacun avec un portrait honnête de ses atouts et de ses limites."], ["Suivre", "Retours après chaque entretien, accompagnement de l'intégration."]].map(([t, x], i) => `<article data-reveal class="tl-mt tl-mt${i}"><span class="tl-num">${i + 1}</span><h3>${t}</h3><p>${x}</p></article>`).join("")}</div></div></section>`),
  cta("Un poste à pourvoir ?", "Racontez-nous le contexte, nous vous répondons sous deux jours ouvrés."),
  sec(footer(c)),
];

// ---------- À propos ----------
const TEAM = [[7, "Camille Aubert", "Directrice, ex-DRH"], [15, "Malik Benhamou", "Recrutement numérique"], [23, "Inès Fournier", "Recrutement santé"], [29, "Théo Marchand", "Industrie et logistique"], [34, "Sofia Lenoir", "Accompagnement candidats"], [40, "Paul Rivière", "Relations entreprises"]];
const apropos = (c) => [
  sec(header(c)),
  pagehead("À propos", "Une petite équipe,<br>de <span class=\"tl-hl\">grandes conversations</span>.", "Fondée à Lyon en 2012 par d'anciens responsables des ressources humaines. Équipe fictive de démonstration."),
  sec(`<section class="tl-story pk-bleed"><div class="tl-wrap tl-story-in"><p class="tl-big" data-reveal>Nous avons créé Talent parce que nous avons trop vu de bons candidats ignorés et de bonnes entreprises découragées. <mark>Rapprocher deux personnes, c'est avant tout les écouter.</mark></p>
    <ol class="tl-years">${[["2012", "Deux fondateurs, un bureau lyonnais"], ["2016", "Ouverture du pôle santé et du bureau de Nantes"], ["2020", "Entretiens en visio et suivi à distance"], ["2024", "Bureau de Lille et charte de transparence"]].map(([y, t]) => `<li data-reveal><b>${y}</b><span>${t}</span></li>`).join("")}</ol></div></section>`),
  sec(`<section class="tl-team pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>L'équipe</h2><div class="tl-team-in">${TEAM.map(([n, name, role], i) => `<article data-reveal class="tl-tm tl-tm${i % 3}">${avatar(n, "tl-av tl-av--l")}<h3>${esc(name)}</h3><p>${esc(role)}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="tl-values pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>Ce qui nous guide</h2><div class="tl-values-in">
    ${[["Dire la vérité", "Un retour franc vaut mieux qu'un silence poli."], ["Respecter le temps", "Réponse à chaque candidature, même négative."], ["Compter sur l'humain", "Les outils aident ; les décisions se prennent à deux."], ["Rester curieux", "Chaque métier nous apprend quelque chose."]].map(([t, x], i) => `<article data-reveal class="tl-val tl-val${i}"><h3>${t}</h3><p>${x}</p></article>`).join("")}</div></div></section>`),
  cta("Venez nous rencontrer.", "Autour d'un café, dans nos bureaux ou en visio."),
  sec(footer(c)),
];

// ---------- Contact, recherche, introuvable ----------
const contact = (c) => [
  sec(header(c)),
  pagehead("On se parle", "Contact", "Candidature, besoin de recrutement, question : un seul formulaire. Si vous avez fini une candidature guidée, collez-y le récapitulatif."),
  { type: "form", heading: "Écrire à Talent", intro: "Indiquez votre demande : nous répondons sous deux jours ouvrés." },
  sec(`<section class="tl-info pk-bleed"><div class="tl-wrap tl-info-in"><address data-reveal><h2 class="tl-h4">Lyon</h2>18 quai des Teinturiers<br>69002 Lyon</address><div data-reveal><h2 class="tl-h4">Horaires</h2><p>Du lundi au vendredi<br>9 h – 18 h</p></div><div data-reveal><h2 class="tl-h4">Écrire</h2><p><a href="mailto:bonjour@talent.example">bonjour@talent.example</a></p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [sec(header(c)), pagehead("Recherche", "Une offre,<br>un conseil ?", "Cherchez un métier, une ville ou un sujet."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une offre, un conseil…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="tl-404 pk-bleed"><div class="tl-wrap"><div class="tl-404-faces" aria-hidden="true">${avatar(2, "tl-av tl-av--l")}<span class="tl-404-n">404</span>${avatar(17, "tl-av tl-av--l")}</div><div class="tl-h1" role="heading" aria-level="1">Oups, cette page s'est perdue.</div><p class="tl-ph-sub">Elle n'existe pas ou a changé d'adresse. Reprenons depuis les offres.</p><div class="tl-actions"><a class="tl-btn tl-btn--blue tl-btn--lg" href="/offres">Voir les offres</a><a class="tl-btn tl-btn--ink tl-btn--lg" href="/">Accueil</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "talent", name: "Talent", version: "2.0.0", category: "agence", tags: ["chaleureux", "moderne", "ludique"], siteType: "Agence de recrutement", featured: true,
  concept: "Une mosaïque de portraits dessinés qui se retournent autour du titre, un compteur d'offres dans la barre et des offres filtrables avec candidature guidée en trois étapes.",
  description: "Agence de recrutement : portraits en aplats, jaune soleil, bleu ciel et corail sur blanc ; offres filtrables par secteur, contrat, ville et télétravail, fiche en panneau, candidature en 3 étapes, conseils et services entreprises.",
  brand: "Talent — agence de recrutement", modules: ["formulaires", "recherche"],
  dna: {
    header: "barre-blanche-a-compteur-d-offres-en-direct-et-bouton-deposer-mon-cv", hero: "mosaique-de-portraits-souriants-qui-se-retournent-autour-du-titre", grid: "cartes-d-offres-a-pastille-logo-et-badges-de-contrat",
    motion: "portraits-qui-se-retournent-en-3d-et-compteur-d-offres-vivant", shapes: "visages-en-aplats-bulles-rondes-a-un-coin-vif-et-badges-colores", rhythm: "bandes-blanches-et-aplats-jaune-bleu-corail-en-alternance-courte",
    signature: "offres-filtrables-fiche-en-panneau-et-candidature-guidee-en-trois-etapes",
  },
  tokens: {
    colors: { primary: "#1f6bff", secondary: "#17204a", accent: "#ffc933", background: "#ffffff", surface: "#f4f8ff", text: "#17204a", muted: "#556080", success: "#13795b", warning: "#8a5a00", error: "#c62828" },
    fonts: { heading: "font.red-hat-display", body: "font.schibsted-grotesk", button: "font.red-hat-display", link: "font.schibsted-grotesk" },
    radius: { sm: 8, md: 16, lg: 28, button: 14, field: 12, card: 22 }, shadow: { card: "0 10px 30px rgba(23,32,74,.10)", button: "none" }, border: { width: 2, color: "#17204a" },
    type: { h1: { size: 64, weight: 900, lineHeight: 1.02 }, h2: { size: 40, weight: 800, lineHeight: 1.08 } },
  },
  options: [
    { key: "sun", label: "Jaune soleil", type: "color", default: "#ffc933" },
    { key: "sky", label: "Bleu ciel", type: "color", default: "#1f6bff" },
    { key: "coral", label: "Corail", type: "color", default: "#ff6a55" },
    { key: "flip", label: "Portraits qui se retournent", type: "choice", default: "on", choices: [["on", "Oui"], ["off", "Non"]] },
    { key: "live", label: "Compteur d'offres dans la barre", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Offres", "/offres"], ["Candidats", "/candidats"], ["Entreprises", "/entreprises"], ["À propos", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "offres", name: "Offres d'emploi", render: offres }, { key: "offre", name: "Fiche offre", render: offre },
    { key: "candidats", name: "Candidats", render: candidats }, { key: "entreprises", name: "Entreprises", render: entreprises }, { key: "a-propos", name: "À propos", render: apropos },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
