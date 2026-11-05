// Barreau — cabinet d'avocats (fictif). Direction artistique : autorité sobre. Bordeaux profond, papier ivoire, laiton discret ; Libre Caslon Text, filets doubles,
// colonnes numérotées, mega-menu des domaines d'expertise, domaines filtrables, fiche d'associé en panneau et formulaire d'orientation (aucun conseil juridique réel).
const { sec, form, esc, nav } = require("../kit");

const DOMS = [
  { id: "affaires", n: "Droit des sociétés et des contrats", tags: "ent conseil", d: "Création, gouvernance, cessions et contrats commerciaux : sécuriser les décisions d'une entreprise avant qu'elles ne deviennent des différends.", m: ["Statuts et pactes d'associés", "Cessions et reprises d'entreprise", "Contrats commerciaux et conditions générales"], a: ["ravel", "montfort"], ic: '<rect x="9" y="17" width="30" height="21"/><path d="M18 17v-5h12v5M9 27h30M22 27v4h4v-4"/>' },
  { id: "social", n: "Droit social", tags: "ent part contentieux", d: "Relations individuelles et collectives de travail, du contrat à la rupture, du côté de l'employeur comme du salarié.", m: ["Contrats, avenants et règlements intérieurs", "Ruptures de contrat et transactions", "Représentation devant le conseil de prud'hommes"], a: ["vasseur"], ic: '<circle cx="17" cy="16" r="6"/><circle cx="33" cy="18" r="5"/><path d="M6 38c0-8 5-12 11-12s11 4 11 12M29 27c6 0 11 3 12 11"/>' },
  { id: "famille", n: "Famille et patrimoine", tags: "part conseil", d: "Séparation, filiation, succession et transmission : un accompagnement discret, attentif aux équilibres entre les personnes.", m: ["Divorce et séparation, enfants", "Successions, donations et testaments", "Protection d'un proche vulnérable"], a: ["castellane"], ic: '<path d="M7 23 24 9l17 14"/><path d="M12 20v19h24V20M20 39V28h8v11"/>' },
  { id: "immobilier", n: "Immobilier et construction", tags: "part ent contentieux", d: "Acquisitions, baux, copropriété et chantiers : lire les actes, anticiper les risques, défendre un droit de propriété.", m: ["Baux d'habitation, commerciaux et professionnels", "Copropriété et litiges de voisinage", "Désordres de construction et assurances"], a: ["vasseur", "ravel"], ic: '<rect x="12" y="8" width="24" height="31"/><path d="M18 15h4M26 15h4M18 22h4M26 22h4M18 29h4M26 29h4M22 39v-5h4v5"/>' },
  { id: "penal", n: "Pénal des affaires", tags: "ent contentieux", d: "Enquêtes, mises en cause et conformité : une défense mesurée, préparée dès les premières auditions.", m: ["Assistance en audition et en garde à vue", "Délits financiers et de gestion", "Programmes de conformité"], a: ["aubrac"], ic: '<path d="M24 7 38 12v11c0 9-6 15-14 18C16 38 10 32 10 23V12z"/><path d="m18 24 4 4 8-9"/>' },
  { id: "contentieux", n: "Contentieux et arbitrage", tags: "ent part contentieux", d: "Préparer et plaider : analyse du dossier, stratégie de preuve, négociation, médiation et audience.", m: ["Litiges commerciaux et civils", "Médiation et négociation encadrée", "Procédures d'urgence, référés"], a: ["aubrac", "ravel"], ic: '<path d="M24 8v30M13 38h22M10 15h28"/><path d="m10 15-5 12h10zM38 15l-5 12h10z"/>' },
  { id: "pi", n: "Propriété intellectuelle et numérique", tags: "ent conseil", d: "Marques, droits d'auteur, logiciels et données personnelles : protéger ce qui fait la valeur d'une activité.", m: ["Dépôt et défense de marques", "Contrats de licence et de développement", "Données personnelles et conformité"], a: ["montfort"], ic: '<circle cx="24" cy="24" r="15"/><path d="M29 19a7 7 0 1 0 0 10"/>' },
  { id: "fiscal", n: "Fiscalité", tags: "ent part conseil", d: "Conseil fiscal des entreprises et des personnes, accompagnement des contrôles et des demandes de rescrit.", m: ["Structuration et transmission", "Contrôles et propositions de rectification", "Rescrits et demandes d'éclaircissement"], a: ["ravel"], ic: '<circle cx="16" cy="16" r="5"/><circle cx="32" cy="32" r="5"/><path d="M35 11 13 37"/>' },
];
const ASSOC = [
  { id: "ravel", n: "Hélène Ravel", i: "HR", r: "Associée fondatrice", d: ["affaires", "fiscal", "immobilier", "contentieux"], since: "Barreau depuis 1991", lang: "Français, anglais, espagnol",
    bio: "Ancienne collaboratrice d'un cabinet parisien, Hélène Ravel a fondé le cabinet en 1987 avec Marc Aubrac. Elle conseille des entreprises familiales et des dirigeants sur leurs opérations structurantes.", formation: "Master de droit des affaires ; diplôme de notariat (démonstration)", approche: "Écrire peu, écrire juste : un conseil doit pouvoir être relu dans cinq ans." },
  { id: "aubrac", n: "Marc Aubrac", i: "MA", r: "Associé fondateur", d: ["contentieux", "penal"], since: "Barreau depuis 1989", lang: "Français, allemand",
    bio: "Plaideur, Marc Aubrac intervient en défense comme en demande dans les litiges civils, commerciaux et pénaux. Il enseigne la procédure à des élèves-avocats.", formation: "Master de procédure et voies d'exécution (démonstration)", approche: "Une audience se gagne d'abord dans le dossier : pièces, chronologie, cohérence." },
  { id: "castellane", n: "Inès Castellane", i: "IC", r: "Associée", d: ["famille"], since: "Barreau depuis 2005", lang: "Français, italien",
    bio: "Inès Castellane accompagne les familles dans les séparations, les successions et les transmissions, avec une préférence marquée pour les solutions négociées et la médiation.", formation: "Master de droit des personnes et de la famille (démonstration)", approche: "Chercher d'abord l'accord possible, sans jamais se priver de plaider." },
  { id: "vasseur", n: "Julien Vasseur", i: "JV", r: "Associé", d: ["social", "immobilier"], since: "Barreau depuis 2009", lang: "Français, anglais",
    bio: "Julien Vasseur conseille employeurs et salariés en droit du travail et intervient en droit immobilier, notamment sur les baux professionnels et les copropriétés.", formation: "Master de droit social ; DU de droit immobilier (démonstration)", approche: "Expliquer chaque étape de la procédure, ses délais et ses limites." },
  { id: "montfort", n: "Claire Montfort", i: "CM", r: "Associée", d: ["pi", "affaires"], since: "Barreau depuis 2013", lang: "Français, anglais",
    bio: "Claire Montfort assiste des créateurs, des éditeurs de logiciels et des sociétés innovantes sur leurs marques, leurs licences et la conformité de leurs données.", formation: "Master de propriété intellectuelle (démonstration)", approche: "Protéger tôt, contractualiser clairement, documenter chaque création." },
];
const domName = (id) => DOMS.find((x) => x.id === id).n;
const assoc = (id) => ASSOC.find((x) => x.id === id);
const TAGS = [["ent", "Entreprises"], ["part", "Particuliers"], ["conseil", "Conseil"], ["contentieux", "Contentieux"]];

const svg = (inner, cls = "", vb = "0 0 48 48") => `<svg class="${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const icon = (d) => svg(d.ic, "bq-ic");
const arrow = `<svg class="bq-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 12h17m-5-5 5 5-5 5"/></svg>`;
const mark = `<svg class="bq-mark" viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3h34v26c0 9-8 14-17 17C11 43 3 38 3 29z"/><path d="M20 12v24M12 36h16M10 18h20"/><path d="m10 18-3 8h6zM30 18l-3 8h6z"/></svg>`;

// Frontispice : fronton, cinq colonnes et balance, tracés fins laiton sur fond bordeaux
const colonnade = () => {
  let cols = "";
  for (let i = 0; i < 5; i++) {
    const x = 62 + i * 52;
    cols += `<g class="bq-col"><rect x="${x - 4}" y="146" width="36" height="8"/><rect x="${x}" y="154" width="28" height="170"/><path d="M${x + 7} 154v170M${x + 14} 154v170M${x + 21} 154v170" opacity=".55"/><rect x="${x - 5}" y="324" width="38" height="8"/></g>`;
  }
  return `<svg class="bq-front" viewBox="0 0 380 440" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" role="img" aria-label="Façade à colonnes surmontée d'une balance"><title>Frontispice</title>
    <rect x="6" y="6" width="368" height="428" opacity=".5"/><rect x="14" y="14" width="352" height="412" opacity=".9"/>
    <polygon points="44,126 190,48 336,126"/><polygon points="64,122 190,56 316,122" opacity=".45"/><rect x="44" y="126" width="292" height="20"/>
    <path d="M190 66v44M160 110h60M170 72h40" /><path d="M170 72l-14 24h28zM210 72l-14 24h28z" opacity=".9"/>
    ${cols}
    <rect x="44" y="332" width="292" height="10"/><rect x="34" y="342" width="312" height="10"/><rect x="24" y="352" width="332" height="10"/>
    <path d="M60 392h260M60 400h260" opacity=".5"/></svg>`;
};

const domMenu = () => DOMS.map((x) => `<a class="bq-mi" href="${x.id === "affaires" ? "/expertise" : "/expertises"}">${icon(x)}<span>${esc(x.n)}</span></a>`).join("");

const header = (c) => `<header class="bq-head pk-bleed">
  <div class="bq-band"><p>Cabinet fictif — site de démonstration. Aucun conseil juridique n'est donné sur ce site.</p></div>
  <div class="bq-bar bq-wrap"><a class="bq-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span><b>Ravel &amp; Aubrac</b><small>Avocats · Barreau de démonstration</small></span></a>
    <div class="bq-nav" role="navigation" aria-label="Navigation principale">
      <a href="/">Accueil</a>
      <div class="bq-has-mega"><a href="/expertises" aria-haspopup="true">Expertises <svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>
        <div class="bq-mega"><div class="bq-mega-in bq-wrap"><div class="bq-mega-intro"><p class="bq-eyebrow">Huit domaines</p><p class="bq-mega-t">Une pratique de conseil et de plaidoirie, au service des entreprises et des particuliers.</p><a class="bq-link" href="/expertises">Orienter ma demande ${arrow}</a></div><div class="bq-mega-grid">${domMenu()}</div></div></div></div>
      ${nav(c.menu.filter((m) => !["/", "/expertises", "/contact"].includes(m.url)), "")}
    </div>
    <a class="bq-btn bq-btn--s" href="/contact">Prendre contact</a>
    <details class="bq-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="bq-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<p class="bq-eyebrow">Domaines d'expertise</p>${DOMS.map((x) => `<a class="bq-sub" href="${x.id === "affaires" ? "/expertise" : "/expertises"}">${esc(x.n)}</a>`).join("")}</div></details>
  </div></header>`;

const footer = (c) => `<footer class="bq-foot pk-bleed"><div class="bq-wrap"><div class="bq-foot-top"><div class="bq-foot-brand">${mark}<p class="bq-foot-name">Ravel &amp; Aubrac</p><p class="bq-devise"><em>Fides, ratio, mensura.</em></p><address>Cabinet fictif<br>12 rue des Archives<br>69002 Lyon (adresse de démonstration)</address></div>
  <div><h2 class="bq-fh">Le cabinet</h2>${["/cabinet|Le cabinet", "/associes|Les associés", "/publications|Publications", "/honoraires|Honoraires et méthode"].map((s) => `<a class="bq-fl" href="${s.split("|")[0]}">${s.split("|")[1]}</a>`).join("")}</div>
  <div><h2 class="bq-fh">Expertises</h2>${DOMS.slice(0, 5).map((x) => `<a class="bq-fl" href="/expertises">${esc(x.n)}</a>`).join("")}<a class="bq-fl" href="/expertises">Tous les domaines</a></div>
  <div><h2 class="bq-fh">Contact</h2><a class="bq-fl" href="/contact">Écrire au cabinet</a><a class="bq-fl" href="/recherche">Recherche</a><p class="bq-foot-small">Réponse sous deux jours ouvrés (démonstration).</p></div></div>
  <p class="bq-legal">© Ravel &amp; Aubrac — site de démonstration. Cabinet, associés, publications et adresses fictifs. Les informations présentées ne constituent pas un conseil juridique et n'emportent aucune garantie de résultat.</p></div></footer>`;

const pagehead = (num, kicker, title, sub) => sec(`<section class="bq-ph pk-bleed"><div class="bq-wrap"><p class="bq-eyebrow" data-reveal><span>${esc(num)}</span> ${esc(kicker)}</p><div class="bq-h1" role="heading" aria-level="1" data-reveal>${title}</div><div class="bq-rule2" aria-hidden="true"></div>${sub ? `<p class="bq-sub-t" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

const domCard = (x, i, full) => `<article class="bq-dom" data-item data-tags="${x.tags}" data-dom-id="${x.id}" data-reveal><span class="bq-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>${icon(x)}<h3>${esc(x.n)}</h3><p>${esc(x.d)}</p>${full ? `<ul class="bq-miss">${x.m.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p class="bq-refs"><span>Associés référents</span> ${x.a.map((a) => `<a href="#fiche" data-assoc-open="${a}">${esc(assoc(a).n)}</a>`).join(" · ")}</p>` : ""}<a class="bq-link" href="${x.id === "affaires" ? "/expertise" : "/expertises"}">${full ? "Voir ce domaine" : "En savoir plus"} ${arrow}</a></article>`;

const assocCard = (a, full) => `<article class="bq-assoc" data-assoc-id="${a.id}" data-reveal><div class="bq-portrait" aria-hidden="true"><span>${a.i}</span></div><div class="bq-assoc-head"><h3>${esc(a.n)}</h3><p class="bq-role">${esc(a.r)}</p><p class="bq-dl">${a.d.map((d) => esc(domName(d))).join(" · ")}</p></div>
  <div class="bq-assoc-more"><p>${esc(a.bio)}</p><dl><div><dt>Barreau</dt><dd>${esc(a.since)}</dd></div><div><dt>Langues</dt><dd>${esc(a.lang)}</dd></div><div><dt>Formation</dt><dd>${esc(a.formation)}</dd></div></dl><blockquote><p>« ${esc(a.approche)} »</p><footer>— principe de travail (texte de démonstration)</footer></blockquote><a class="bq-btn" href="/contact">Écrire à ${esc(a.n.split(" ")[0])}</a></div>
  ${full ? "" : ""}<a class="bq-link bq-open" href="#fiche" data-assoc-open="${a.id}" aria-haspopup="dialog">Ouvrir la fiche ${arrow}</a></article>`;

const PUBS = [
  ["2026", "Note", "ent", "Pacte d'associés : huit clauses à relire avant de signer", "H. Ravel", "Panorama des clauses qui engendrent le plus de questions lors d'une cession (texte pédagogique de démonstration)."],
  ["2026", "Article", "part", "La médiation familiale en pratique : étapes et limites", "I. Castellane", "Ce que permet une médiation, ce qu'elle ne remplace pas, et dans quels cas saisir le juge."],
  ["2025", "Conférence", "ent", "Conformité et responsabilité des dirigeants", "M. Aubrac", "Intervention donnée devant une association d'entrepreneurs (support fictif)."],
  ["2025", "Note", "ent", "Marques : choisir, déposer, surveiller", "C. Montfort", "Les trois temps de la vie d'une marque, expliqués sans jargon."],
  ["2025", "Article", "part", "Bail d'habitation : le dépôt de garantie en dix questions", "J. Vasseur", "Délais, retenues justifiées, preuves à conserver."],
  ["2024", "Conférence", "ent", "Contrôle fiscal : bien préparer la première réunion", "H. Ravel", "Méthode de préparation d'un dossier et organisation des pièces."],
  ["2024", "Note", "part", "Transmettre son patrimoine : donation ou testament ?", "I. Castellane", "Deux outils, deux logiques ; points de vigilance."],
];
const pubRow = (p) => `<article class="bq-pub" data-item data-tags="${p[1].toLowerCase()}" data-reveal><time class="bq-year">${p[0]}</time><div class="bq-pub-b"><p class="bq-pub-type">${p[1]}</p><h3>${esc(p[3])}</h3><p>${esc(p[5])}</p></div><p class="bq-pub-by">${esc(p[4])}</p><a class="bq-link" href="/contact">Demander le texte ${arrow}</a></article>`;

const stat = (n, label, suf = "") => `<li data-reveal><b data-count="${n}"${suf ? ` data-suffix="${suf}"` : ""}>${n}${suf}</b><span>${label}</span></li>`;
const steps = (list) => `<ol class="bq-steps5">${list.map(([t, p], i) => `<li data-reveal><span class="bq-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></li>`).join("")}</ol>`;
const cta = (t, p, label = "Prendre contact") => sec(`<section class="bq-cta pk-bleed"><div class="bq-wrap bq-cta-in"><div><p class="bq-eyebrow" data-reveal>Première prise de contact</p><h2 class="bq-h2" data-reveal>${t}</h2></div><div data-reveal><p>${esc(p)}</p><a class="bq-btn bq-btn--ivory" href="/contact">${label} ${arrow}</a></div></div></section>`);

const orient = () => {
  const opt = (v, label, extra = "") => `<a class="bq-opt" href="#choix" role="radio" aria-checked="false" data-v="${v}" data-label="${esc(label)}"${extra}>${esc(label)}</a>`;
  return `<section class="bq-orient pk-bleed" data-orient><div class="bq-wrap"><div class="bq-sechead"><p class="bq-eyebrow" data-reveal>Orientation</p><h2 class="bq-h2" data-reveal>Quel domaine correspond à ma situation ?</h2><p class="bq-sub-t" data-reveal>Trois questions pour être orienté vers le bon domaine, puis vers le formulaire de contact avec un résumé prêt à envoyer. Indicatif seulement : ce n'est pas un conseil juridique.</p></div>
  <div class="bq-orient-grid"><div class="bq-qs">
    <div class="bq-q" data-q="profil"><p class="bq-qt"><span>1</span> Vous êtes</p><div class="bq-opts" role="radiogroup" aria-label="Vous êtes">${opt("un particulier", "Un particulier")}${opt("un dirigeant ou une entreprise", "Un dirigeant ou une entreprise")}${opt("une association ou une institution", "Une association ou une institution")}</div></div>
    <div class="bq-q" data-q="sujet"><p class="bq-qt"><span>2</span> Votre sujet principal</p><div class="bq-opts bq-opts--2" role="radiogroup" aria-label="Votre sujet principal">
      ${opt("1", "Créer, céder ou contractualiser", ' data-dom="affaires"')}${opt("2", "Un litige ou une mise en demeure", ' data-dom="contentieux"')}${opt("3", "Un contrat de travail ou une rupture", ' data-dom="social"')}${opt("4", "Divorce, succession, donation", ' data-dom="famille"')}
      ${opt("5", "Bail, achat, chantier, copropriété", ' data-dom="immobilier"')}${opt("6", "Une enquête ou une plainte", ' data-dom="penal"')}${opt("7", "Une marque, un logiciel, des données", ' data-dom="pi"')}${opt("8", "Un contrôle ou un montage fiscal", ' data-dom="fiscal"')}</div></div>
    <div class="bq-q" data-q="etat"><p class="bq-qt"><span>3</span> Où en êtes-vous ?</p><div class="bq-opts" role="radiogroup" aria-label="Où en êtes-vous">${opt("une réflexion préventive", "Je me pose la question")}${opt("un courrier ou un acte reçu", "J'ai reçu un courrier ou un acte")}${opt("une procédure déjà engagée", "Une procédure est engagée", ' data-dom="contentieux"')}</div></div>
  </div>
  <aside class="bq-result" data-result aria-live="polite"><p class="bq-eyebrow">Domaine suggéré</p><p class="bq-res-empty">Répondez aux trois questions : le domaine le plus proche s'affichera ici, avec un résumé à transmettre au cabinet.</p></aside></div></div></section>`;
};

const filterSection = () => sec(`<section class="bq-sig pk-bleed" data-filter><div class="bq-wrap"><div class="bq-toolbar"><div class="bq-search-slot" data-search-slot></div>
  <div class="bq-tags" role="group" aria-label="Filtrer les domaines"><a href="#tous" class="is-on" data-tag="*" aria-pressed="true">Tous</a>${TAGS.map(([k, l]) => `<a href="#${k}" data-tag="${k}" aria-pressed="false">${l}</a>`).join("")}</div></div>
  <p class="bq-count" data-count-out aria-live="polite">8 domaines</p>
  <div class="bq-doms">${DOMS.map((x, i) => domCard(x, i, true)).join("")}</div><p class="bq-empty is-off" data-empty>Aucun domaine ne correspond à cette recherche. Essayez un autre mot ou <a href="/contact">écrivez-nous</a>.</p></div></section>`);

const home = (c) => [
  sec(header(c)),
  sec(`<section class="bq-hero pk-bleed"><div class="bq-wrap bq-hero-in"><div class="bq-hero-copy"><p class="bq-eyebrow" data-reveal><span>Lyon</span> Cabinet fondé en 1987 · fictif</p>
    <div class="bq-h1 bq-h1--xl" role="heading" aria-level="1" data-reveal>La rigueur du dossier,<br>la mesure du conseil.</div>
    <div class="bq-rule2 bq-rule2--draw" aria-hidden="true"></div>
    <p class="bq-devise-big" data-reveal><em>Fides, ratio, mensura.</em><small>Fidélité, raison, mesure.</small></p>
    <p class="bq-lead" data-reveal>Cinq associés conseillent et défendent entreprises et particuliers dans huit domaines du droit. Une écoute attentive, des analyses écrites, des honoraires expliqués dès le premier rendez-vous.</p>
    <div class="bq-actions" data-reveal><a class="bq-btn" href="/expertises">Trouver mon domaine ${arrow}</a><a class="bq-btn bq-btn--line" href="/contact">Prendre contact</a></div></div>
    <figure class="bq-hero-fig" data-reveal>${colonnade()}<figcaption>Illustration de démonstration</figcaption></figure></div></section>`),
  sec(`<section class="bq-stats pk-bleed"><ul class="bq-wrap bq-stats-in">${stat(1987, "année de fondation")}${stat(5, "associés")}${stat(8, "domaines d'expertise")}${stat(3, "langues de travail")}</ul></section>`),
  sec(`<section class="bq-doms-sec pk-bleed"><div class="bq-wrap"><div class="bq-sechead bq-sechead--row"><div><p class="bq-eyebrow" data-reveal>I · Expertises</p><h2 class="bq-h2" data-reveal>Huit domaines,<br>une même exigence.</h2></div><a class="bq-link" href="/expertises" data-reveal>Filtrer par besoin ${arrow}</a></div>
    <div class="bq-doms bq-doms--home">${DOMS.map((x, i) => domCard(x, i, false)).join("")}</div></div></section>`),
  sec(`<section class="bq-method pk-bleed"><div class="bq-wrap"><div class="bq-sechead"><p class="bq-eyebrow" data-reveal>II · Méthode</p><h2 class="bq-h2" data-reveal>Quatre temps, dans l'ordre.</h2></div>
    ${steps([["Écouter", "Un premier entretien pour comprendre la situation, les enjeux et les délais, sans engagement."], ["Analyser", "Étude des pièces, des textes et de la jurisprudence ; restitution écrite des options."], ["Décider", "Vous choisissez la stratégie ; la convention d'honoraires la précise."], ["Agir", "Négociation, rédaction ou plaidoirie, avec un compte rendu à chaque étape."]])}
    <p class="bq-note" data-reveal>Chaque dossier est différent : le cabinet ne garantit aucun résultat. <a href="/honoraires">Honoraires et méthode</a></p></div></section>`),
  sec(`<section class="bq-team pk-bleed"><div class="bq-wrap bq-split"><div><p class="bq-eyebrow" data-reveal>III · Associés</p><h2 class="bq-h2" data-reveal>Des visages,<br>des responsabilités.</h2><p class="bq-muted" data-reveal>Chaque dossier a un associé référent, identifié dès le premier rendez-vous.</p><a class="bq-link" href="/associes" data-reveal>Rencontrer les associés ${arrow}</a></div>
    <ul class="bq-team-list">${ASSOC.map((a) => `<li data-reveal><span class="bq-portrait bq-portrait--s" aria-hidden="true"><span>${a.i}</span></span><div><b>${esc(a.n)}</b><span>${esc(a.r)}</span></div><em>${esc(domName(a.d[0]))}</em></li>`).join("")}</ul></div></section>`),
  sec(`<section class="bq-pubs pk-bleed"><div class="bq-wrap"><div class="bq-sechead bq-sechead--row"><div><p class="bq-eyebrow" data-reveal>IV · Publications</p><h2 class="bq-h2" data-reveal>Écrits et interventions</h2></div><a class="bq-link" href="/publications" data-reveal>Toutes les publications ${arrow}</a></div><div class="bq-pub-list">${PUBS.slice(0, 3).map(pubRow).join("")}</div></div></section>`),
  cta("Un premier entretien pour poser<br>les termes du dossier.", "Décrivez votre situation par écrit : un associé référent vous répond sous deux jours ouvrés. Ce site est une démonstration ; aucun conseil juridique n'y est donné."),
  sec(footer(c)),
];

const expertises = (c) => [sec(header(c)),
  pagehead("§ 1", "Domaines d'expertise", "Huit domaines<br>du droit", "Recherchez un mot, filtrez par public ou par nature de mission. Ouvrez la fiche d'un associé référent sans quitter la page."),
  filterSection(), sec(orient()),
  sec(`<section class="bq-team bq-team--cards pk-bleed"><div class="bq-wrap"><div class="bq-sechead"><p class="bq-eyebrow">Associés référents</p><h2 class="bq-h2">Qui suivra votre dossier ?</h2></div><div class="bq-assocs bq-assocs--compact">${ASSOC.map((a) => assocCard(a)).join("")}</div></div></section>`),
  sec(footer(c))];

const expertise = (c) => {
  const D = DOMS[0];
  return [sec(header(c)),
    pagehead("§ 1.1", "Expertises / Droit des sociétés et des contrats", "Droit des sociétés<br>et des contrats", "Sécuriser les décisions d'une entreprise : de la création à la transmission, des statuts aux contrats du quotidien."),
    sec(`<section class="bq-detail pk-bleed"><div class="bq-wrap bq-detail-in"><aside class="bq-toc" aria-label="Sommaire de la page"><p class="bq-eyebrow">Sommaire</p><ol>${[["missions", "Nos interventions"], ["approche", "Notre approche"], ["cas", "Situations types"], ["faq", "Questions fréquentes"], ["equipe", "Associés référents"]].map(([k, l], i) => `<li><a href="#${k}" data-goto="${k}" ${i ? "" : 'class="is-on"'}><span>${i + 1}</span> ${l}</a></li>`).join("")}</ol><div class="bq-toc-card"><p>Une question sur ce domaine ?</p><a class="bq-btn bq-btn--s" href="/contact">Écrire au cabinet</a></div></aside>
    <div class="bq-detail-body">
      <section data-sec="missions"><h2 class="bq-h3" data-reveal><span>1</span> Nos interventions</h2><p class="bq-lead" data-reveal>${esc(D.d)}</p>
        <div class="bq-cols3">${[["Constituer", "Choix de la forme sociale, rédaction des statuts, pacte d'associés, répartition des pouvoirs."], ["Contractualiser", "Contrats de distribution, de prestation, de licence ; conditions générales et clauses sensibles."], ["Transmettre", "Cession de titres ou de fonds, audit juridique, protocole d'accord, accompagnement jusqu'à la signature."]].map(([t, p]) => `<div data-reveal><h3>${t}</h3><p>${p}</p></div>`).join("")}</div></section>
      <section data-sec="approche"><h2 class="bq-h3" data-reveal><span>2</span> Notre approche</h2>${steps([["Cadrer", "Objectifs, calendrier, parties prenantes."], ["Auditer", "Lecture des documents existants, cartographie des risques."], ["Rédiger", "Projets d'actes commentés, versions comparées."], ["Suivre", "Signature, formalités, revue à six mois."]])}</section>
      <section data-sec="cas"><h2 class="bq-h3" data-reveal><span>3</span> Situations types</h2><p class="bq-muted" data-reveal>Exemples illustratifs et anonymisés ; ils ne préjugent d'aucun résultat.</p>
        <table class="bq-table" data-reveal><caption class="bq-sr">Situations types en droit des sociétés</caption><thead><tr><th>Situation</th><th>Point d'attention</th><th>Délai indicatif</th></tr></thead><tbody>
          <tr><td data-l="Situation">Deux associés souhaitent organiser une sortie</td><td data-l="Point d'attention">Valorisation, préemption, clause de non-concurrence</td><td data-l="Délai indicatif">Quelques semaines</td></tr>
          <tr><td data-l="Situation">Un fondateur veut accueillir un investisseur</td><td data-l="Point d'attention">Gouvernance, dilution, droits de sortie</td><td data-l="Délai indicatif">Un à deux mois</td></tr>
          <tr><td data-l="Situation">Une PME révise ses conditions générales</td><td data-l="Point d'attention">Responsabilité, paiement, litiges</td><td data-l="Délai indicatif">Deux à quatre semaines</td></tr></tbody></table></section>
      <section data-sec="faq"><h2 class="bq-h3" data-reveal><span>4</span> Questions fréquentes</h2><div class="bq-faq" data-reveal>
        <details><summary>Faut-il un pacte d'associés en plus des statuts ?</summary><p>Les statuts sont publics ; le pacte reste confidentiel et organise les relations entre associés. L'opportunité dépend de chaque situation, à examiner avec un avocat.</p></details>
        <details><summary>Combien de temps prend une cession d'entreprise ?</summary><p>La durée varie selon la taille de l'opération et la préparation du dossier ; le cabinet établit un calendrier lors du premier rendez-vous.</p></details>
        <details><summary>Le cabinet peut-il garantir l'issue d'une négociation ?</summary><p>Non. Un avocat est tenu à une obligation de moyens, jamais de résultat.</p></details></div></section>
      <section data-sec="equipe"><h2 class="bq-h3" data-reveal><span>5</span> Associés référents</h2><ul class="bq-team-list bq-team-list--l">${D.a.map((id) => { const a = assoc(id); return `<li data-reveal><span class="bq-portrait bq-portrait--s" aria-hidden="true"><span>${a.i}</span></span><div><b>${esc(a.n)}</b><span>${esc(a.r)}</span></div><a class="bq-link" href="/associes">Voir la fiche ${arrow}</a></li>`; }).join("")}</ul></section>
    </div></div></section>`),
    cta("Parlons de votre<br>projet de société.", "Joignez les documents utiles à votre message : statuts, pacte, projet de contrat. Démonstration : aucun conseil n'est délivré sur ce site."),
    sec(footer(c))];
};

const cabinet = (c) => [sec(header(c)),
  pagehead("§ 2", "Le cabinet", "Trente-cinq ans<br>de pratique", "Un cabinet indépendant, de taille humaine, attaché à la qualité des écrits et à la continuité du suivi."),
  sec(`<section class="bq-story pk-bleed"><div class="bq-wrap bq-split bq-split--wide"><div><p class="bq-dropcap" data-reveal>Fondé en 1987 par Hélène Ravel et Marc Aubrac, le cabinet est resté volontairement de taille humaine. Chaque dossier est suivi par un associé, relu par un second, et documenté de manière à pouvoir être repris sans rupture.</p><p class="bq-muted" data-reveal>Ce texte et les faits présentés sur cette page sont fictifs et servent à la démonstration d'un thème de site.</p></div>
    <ol class="bq-frise">${[["1987", "Fondation du cabinet à Lyon par deux avocats."], ["1996", "Ouverture du département droit des affaires et fiscalité."], ["2005", "Arrivée d'une associée en droit de la famille ; création de la médiation."], ["2013", "Développement de la propriété intellectuelle et du numérique."], ["2024", "Nouvelle charte de transparence sur les honoraires."]].map(([y, t]) => `<li data-reveal><time>${y}</time><p>${t}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="bq-values pk-bleed"><div class="bq-wrap"><div class="bq-sechead"><p class="bq-eyebrow" data-reveal>Principes</p><h2 class="bq-h2" data-reveal>Trois engagements écrits</h2></div><div class="bq-cols3 bq-cols3--big">${[["Indépendance", "Aucun lien avec l'adversaire de nos clients ; analyse systématique des conflits d'intérêts avant tout rendez-vous."], ["Secret professionnel", "Les échanges avec le cabinet sont confidentiels. Les pièces ne sont communiquées que dans la mesure de la mission."], ["Clarté", "Des écrits compréhensibles, des délais annoncés, et des honoraires expliqués dès le premier rendez-vous."]].map(([t, p], i) => `<article data-reveal><span class="bq-num" aria-hidden="true">${["I", "II", "III"][i]}</span><h3>${t}</h3><p>${p}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="bq-loc pk-bleed"><div class="bq-wrap bq-split"><div><p class="bq-eyebrow" data-reveal>Nous rencontrer</p><h2 class="bq-h2" data-reveal>Cabinet et accueil</h2><address class="bq-addr" data-reveal>12 rue des Archives<br>69002 Lyon<br><span>(adresse de démonstration)</span></address></div><dl class="bq-hours" data-reveal><div><dt>Lundi – jeudi</dt><dd>9 h – 18 h 30</dd></div><div><dt>Vendredi</dt><dd>9 h – 16 h</dd></div><div><dt>Rendez-vous</dt><dd>Sur demande, au cabinet ou en visioconférence</dd></div><div><dt>Accessibilité</dt><dd>Locaux de plain-pied, accueil adapté</dd></div></dl></div></section>`),
  cta("Une question sur le cabinet ?", "Écrivez-nous : nous vous indiquerons si le cabinet est le bon interlocuteur pour votre situation.", "Écrire au cabinet"),
  sec(footer(c))];

const associes = (c) => [sec(header(c)),
  pagehead("§ 3", "Les associés", "Cinq associés,<br>cinq responsabilités", "Ouvrez une fiche pour découvrir le parcours, les domaines et le principe de travail de chacun."),
  sec(`<section class="bq-assocs-sec pk-bleed"><div class="bq-wrap"><div class="bq-assocs">${ASSOC.map((a) => assocCard(a)).join("")}</div></div></section>`),
  cta("Choisir un interlocuteur", "Indiquez le domaine concerné dans votre message : il sera transmis à l'associé référent."),
  sec(footer(c))];

const publications = (c) => [sec(header(c)),
  pagehead("§ 4", "Publications", "Notes, articles<br>et conférences", "Des textes pédagogiques de démonstration. Ils illustrent le style éditorial du cabinet et ne constituent pas un conseil juridique."),
  sec(`<section class="bq-pubs bq-pubs--page pk-bleed" data-filter><div class="bq-wrap"><div class="bq-toolbar"><div class="bq-search-slot" data-search-slot></div><div class="bq-tags" role="group" aria-label="Filtrer par type"><a href="#tous" class="is-on" data-tag="*" aria-pressed="true">Tous</a><a href="#note" data-tag="note" aria-pressed="false">Notes</a><a href="#article" data-tag="article" aria-pressed="false">Articles</a><a href="#conference" data-tag="conférence" aria-pressed="false">Conférences</a></div></div><p class="bq-count" data-count-out aria-live="polite">${PUBS.length} publications</p>
  <div class="bq-pub-list">${PUBS.map(pubRow).join("")}</div><p class="bq-empty is-off" data-empty>Aucune publication ne correspond à cette recherche.</p></div></section>`),
  sec(footer(c))];

const honoraires = (c) => [sec(header(c)),
  pagehead("§ 5", "Honoraires et méthode", "Des honoraires<br>expliqués d'avance", "Principes de facturation et déroulé d'une mission. Aucun tarif n'est affiché ici : cette page est une démonstration."),
  sec(`<section class="bq-values bq-values--p pk-bleed"><div class="bq-wrap"><div class="bq-cols3 bq-cols3--big">${[["Information préalable", "Avant toute mission, le cabinet présente le mode de facturation envisagé, les frais annexes éventuels et le périmètre de la mission."], ["Convention écrite", "Les honoraires sont fixés par une convention signée, mise à jour si la mission évolue."], ["Pas de promesse", "Un avocat est tenu à une obligation de moyens. Aucune garantie de résultat n'est donnée."]].map(([t, p], i) => `<article data-reveal><span class="bq-num" aria-hidden="true">${["I", "II", "III"][i]}</span><h3>${t}</h3><p>${p}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="bq-method pk-bleed"><div class="bq-wrap"><div class="bq-sechead"><p class="bq-eyebrow">Déroulé</p><h2 class="bq-h2">Une mission en cinq temps</h2></div>${steps([["Premier échange", "Présentation de la situation, vérification des conflits d'intérêts."], ["Cadrage", "Périmètre, calendrier, associé référent."], ["Convention", "Mode de facturation décrit et signé."], ["Exécution", "Travail, points d'étape, comptes rendus écrits."], ["Clôture", "Facture finale, restitution du dossier, conseils de suite."]])}</div></section>`),
  sec(`<section class="bq-modes pk-bleed"><div class="bq-wrap"><div class="bq-sechead"><p class="bq-eyebrow">Modes de facturation</p><h2 class="bq-h2">Quatre manières de facturer</h2></div>
    <table class="bq-table" data-reveal><caption class="bq-sr">Modes de facturation possibles</caption><thead><tr><th>Mode</th><th>Convient plutôt à</th><th>Ce que cela implique</th></tr></thead><tbody>
    <tr><td data-l="Mode"><b>Forfait</b></td><td data-l="Convient plutôt à">Missions bien délimitées : rédaction d'un acte, consultation</td><td data-l="Ce que cela implique">Montant fixé à l'avance pour un périmètre précis</td></tr>
    <tr><td data-l="Mode"><b>Temps passé</b></td><td data-l="Convient plutôt à">Missions dont l'ampleur est incertaine</td><td data-l="Ce que cela implique">Taux horaire par intervenant, relevés de temps transmis</td></tr>
    <tr><td data-l="Mode"><b>Abonnement</b></td><td data-l="Convient plutôt à">Conseil régulier d'une entreprise</td><td data-l="Ce que cela implique">Enveloppe périodique, bilan trimestriel</td></tr>
    <tr><td data-l="Mode"><b>Honoraire complémentaire</b></td><td data-l="Convient plutôt à">Certaines procédures, en plus d'un honoraire de base</td><td data-l="Ce que cela implique">Encadré par la convention ; ne garantit aucun résultat</td></tr></tbody></table>
    <div class="bq-faq bq-faq--wide" data-reveal><details><summary>Le premier rendez-vous est-il payant ?</summary><p>Le cabinet précise ses conditions lors de la prise de rendez-vous (information de démonstration).</p></details><details><summary>Une aide juridictionnelle est-elle possible ?</summary><p>Selon vos ressources et la nature de la procédure. Le cabinet vous indique les démarches à accomplir.</p></details><details><summary>Qui reçoit mes pièces ?</summary><p>L'associé référent et son équipe, tenus au secret professionnel.</p></details></div></div></section>`),
  cta("Obtenir une présentation chiffrée ?", "Après un premier échange, la convention d'honoraires détaille le mode de facturation retenu. Rien n'est facturé via ce site de démonstration."),
  sec(footer(c))];

const contact = (c) => [sec(header(c)),
  pagehead("§ 6", "Contact", "Écrire au cabinet", "Décrivez brièvement votre situation et le domaine concerné. Ne joignez ni pièces sensibles ni informations confidentielles : site de démonstration."),
  { type: "form", heading: "Votre message", intro: "Un associé référent vous répond sous deux jours ouvrés (démonstration). Si vous venez du formulaire d'orientation, collez le résumé dans le message." },
  sec(`<section class="bq-loc bq-loc--c pk-bleed"><div class="bq-wrap bq-split"><div><p class="bq-eyebrow">Cabinet</p><address class="bq-addr">12 rue des Archives<br>69002 Lyon<br><span>(adresse de démonstration)</span></address></div><p class="bq-muted">Le contenu de ce site est fictif et n'a aucune valeur de consultation juridique. En cas d'urgence réelle, contactez un avocat inscrit à un barreau.</p></div></section>`),
  sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("§ 7", "Recherche", "Chercher dans<br>le site", "Un domaine, un associé, une publication."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="bq-404 pk-bleed"><div class="bq-wrap"><p class="bq-eyebrow">Erreur</p><div class="bq-h1 bq-h1--xl" role="heading" aria-level="1">404</div><div class="bq-rule2" aria-hidden="true"></div><p class="bq-sub-t">Cette page n'existe pas ou a changé d'adresse.</p><div class="bq-actions"><a class="bq-btn" href="/">Retour à l'accueil</a><a class="bq-btn bq-btn--line" href="/expertises">Voir les expertises</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "barreau", name: "Barreau", version: "2.0.0", category: "services", tags: ["classique", "editorial", "luxe"], siteType: "Cabinet d'avocats", featured: false,
  concept: "Un cabinet d'avocats à l'autorité sobre : frontispice à colonnes, devise sous filet double, mega-menu des domaines, domaines filtrables, fiche d'associé en panneau et orientation en trois questions.",
  description: "Cabinet d'avocats fictif : bordeaux profond, papier ivoire et laiton, Libre Caslon, filets doubles et colonnes numérotées ; domaines filtrables, fiche d'associé en panneau, orientation vers le contact. Démonstration.",
  brand: "Ravel & Aubrac Avocats", modules: ["formulaires", "recherche"],
  dna: { header: "barre-sobre-mega-menu-des-expertises", hero: "typographie-classique-filet-et-devise", grid: "colonnes-de-domaines-separees-par-filets", motion: "filets-qui-se-tracent-et-revelation-sobre", shapes: "filets-doubles-colonnes-et-cartouches", rhythm: "solennel-colonnes-numerotees", signature: "domaines-filtrables-fiche-associe-et-orientation" },
  tokens: {
    colors: { primary: "#5e1a2b", secondary: "#2a0f16", accent: "#9a7b3c", background: "#f6f0e2", surface: "#fbf8ef", text: "#241a1c", muted: "#5b4f4a", success: "#2e6b3f", warning: "#7a5a12", error: "#a12a2a" },
    fonts: { heading: "font.libre-caslon-text", body: "font.source-sans-3", button: "font.source-sans-3", link: "font.source-sans-3" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#5e1a2b" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.08, transform: "none" }, h2: { size: 40, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "wine", label: "Bordeaux", type: "color", default: "#5e1a2b" },
    { key: "brass", label: "Laiton", type: "color", default: "#9a7b3c" },
    { key: "rules", label: "Filets des titres", type: "choice", default: "double", choices: [["double", "Doubles"], ["single", "Simples"]] },
    { key: "nums", label: "Numérotation des domaines", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "band", label: "Bandeau « démonstration »", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["Le cabinet", "/cabinet"], ["Associés", "/associes"], ["Publications", "/publications"], ["Honoraires", "/honoraires"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "expertises", name: "Expertises", render: expertises }, { key: "expertise", name: "Domaine d'expertise", render: expertise },
    { key: "cabinet", name: "Le cabinet", render: cabinet }, { key: "associes", name: "Associés", render: associes }, { key: "publications", name: "Publications", render: publications },
    { key: "honoraires", name: "Honoraires et méthode", render: honoraires }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
