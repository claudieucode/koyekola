// Commun — association polyvalente. Direction artistique : la fête de quartier. Violet profond, jaune soleil, corail, fond crème ; guirlande de fanions sous l'en-tête, billets d'agenda aux encoches, autocollants dessinés.
// Composants signature : calculateur de cotisation (cotisation + don, coût réel après réduction), agenda filtrable, missions de bénévolat filtrables avec places restantes. Données écrites dans le thème (le CMS n'a pas de type « événement »).
const { sec, esc } = require("../kit");

/* ---------- Données ---------- */
const BUREAU = [["Sylvie Morel", "Présidente"], ["Karim Ndiaye", "Trésorier"], ["Joëlle Caron", "Secrétaire"], ["Bastien Lemoine", "Coordinateur salarié"], ["Amina Diallo", "Responsable du jardin"], ["Louis Perrin", "Responsable du Repair Café"]];
const TYPES = ["Atelier", "Fête", "Réunion", "Sortie", "Formation"];
const MOIS = [["novembre", "Novembre"], ["decembre", "Décembre"], ["janvier", "Janvier"], ["fevrier", "Février"], ["mars", "Mars"], ["avril", "Avril"]];
// [id, titre, type, date, horaire, lieu, tarif, places, description]
const EV = [
  ["repair", "Repair Café de novembre", "Atelier", "2026-11-14", "14 h – 17 h", "Salle des Forges", "Gratuit", "Sans inscription", "Apportez l'objet qui ne marche plus : grille-pain, lampe, vêtement, vélo. Des bénévoles réparent avec vous."],
  ["soupe", "Soupe partagée et jeux de société", "Fête", "2026-11-21", "18 h 30", "Salle des Forges", "Prix libre", "60 places", "Chacun apporte un légume ; la soupe se prépare sur place, les jeux sortent après le dessert."],
  ["ag", "Assemblée des adhérents", "Réunion", "2026-11-25", "19 h", "Maison de quartier", "Gratuit", "Ouverte à tous", "Bilan de l'année, vote du budget, élection de trois membres du bureau. Une garderie est assurée."],
  ["noel-prep", "Atelier de préparation du marché de Noël", "Atelier", "2026-11-28", "10 h – 16 h", "Salle des Forges", "Gratuit", "20 places", "Décorations, étiquettes, pâtisseries : on prépare les stands ensemble."],
  ["noel", "Marché de Noël des créateurs du quartier", "Fête", "2026-12-05", "10 h – 18 h", "Place de la Gare", "Entrée libre", "Sans inscription", "Quarante stands d'artisans, de potiers et de producteurs. Les bénéfices financent le mobilier de la salle."],
  ["opera", "Sortie à l'Opéra de Rennes", "Sortie", "2026-12-12", "14 h 30", "Départ place de la Gare", "12 €", "28 places", "Matinée de ballet, transport en car compris. Tarif réduit pour les moins de 18 ans."],
  ["secours", "Formation aux premiers secours", "Formation", "2026-12-16", "19 h – 22 h", "Maison de quartier", "10 €", "12 places", "Gestes qui sauvent, massage cardiaque, position latérale de sécurité. Animée par un formateur de la Croix-Rouge."],
  ["galette", "Galette des rois du quartier", "Fête", "2027-01-09", "15 h", "Salle des Forges", "Prix libre", "80 places", "Une galette par table, une couronne par enfant, et le tirage de la tombola de l'association."],
  ["maroc", "Atelier cuisine du monde : le Maroc", "Atelier", "2027-01-23", "10 h – 14 h", "Cuisine collective", "8 €", "12 places", "Tajine, salade de carottes et thé à la menthe avec Fatima. On mange ensemble à la fin."],
  ["rando", "Randonnée dans la vallée de la Vilaine", "Sortie", "2027-02-06", "9 h", "Départ place de la Gare", "Gratuit", "30 places", "Douze kilomètres, pique-nique tiré du sac. Chaussures de marche obligatoires."],
  ["taille", "Chantier du jardin : taille des arbres", "Atelier", "2027-02-20", "9 h – 12 h", "Jardin partagé", "Gratuit", "15 places", "Un arboriculteur montre les gestes sur les pommiers et les poiriers. Gants et sécateurs prêtés."],
  ["carnaval", "Carnaval des enfants", "Fête", "2027-03-13", "14 h", "Rues du quartier", "Gratuit", "Sans inscription", "Défilé costumé, fanfare et goûter. Les enfants fabriquent leur masque la semaine précédente."],
  ["reunion-forma", "Formation : animer une réunion", "Formation", "2027-03-27", "9 h 30 – 16 h 30", "Maison de quartier", "15 €", "10 places", "Donner la parole, tenir le temps, décider ensemble. Pour les bénévoles qui animent déjà ou veulent s'y mettre."],
  ["troc", "Troc de plantes", "Fête", "2027-04-10", "10 h – 13 h", "Jardin partagé", "Gratuit", "Sans inscription", "Boutures, graines et plants à échanger. Le jardin ouvre ses portes pour la saison."],
];
// [titre, pôle, engagement, temps, places, description]
const MISSIONS = [
  ["Accueil du jeudi", "Accueil", "Régulier", "2 h par semaine", 2, "Recevoir les adhérents, répondre aux questions, tenir le registre des visites."],
  ["Réparateur ou réparatrice au Repair Café", "Atelier", "Ponctuel", "Un samedi par mois", 3, "Aider à diagnostiquer et réparer petit électroménager, couture ou vélos. Aucun diplôme requis."],
  ["Cuisine de la soupe partagée", "Cuisine", "Ponctuel", "3 h par mois", 4, "Éplucher, cuisiner et servir une soupe pour soixante personnes."],
  ["Arrosage et entretien du jardin", "Jardin", "Régulier", "1 h par semaine", 5, "Arroser, désherber et ramasser pendant la belle saison. Les outils sont fournis."],
  ["Animation d'ateliers pour enfants", "Animation", "Régulier", "Mercredis après-midi", 2, "Proposer un atelier créatif ou un jeu aux enfants de 6 à 10 ans, avec un animateur salarié."],
  ["Aide aux devoirs", "Animation", "Régulier", "2 h par semaine", 6, "Accompagner un élève de primaire ou de collège dans ses devoirs, deux soirs par semaine."],
  ["Tenue des comptes de l'association", "Administratif", "Régulier", "3 h par mois", 1, "Saisir les factures et préparer les justificatifs pour le trésorier. Notions de comptabilité souhaitées."],
  ["Photographies et réseaux sociaux", "Administratif", "Ponctuel", "Lors des événements", 2, "Photographier les temps forts et publier un compte rendu sur la page de l'association."],
];
const POLES = ["Accueil", "Atelier", "Cuisine", "Jardin", "Animation", "Administratif"];
const PROJETS = [
  ["Le jardin partagé", "Une parcelle de 600 mètres carrés, trente familles, un composteur collectif. La collecte finance une serre et un abri à outils.", 8000, 6400, "jardin"],
  ["La cuisine collective", "Plaques, four, lave-vaisselle : équiper la cuisine de la salle des Forges pour cuisiner à cent personnes.", 5000, 3150, "cuisine"],
  ["La bibliothèque de rue", "Deux boîtes à livres devant la gare, alimentées par les habitants. Projet terminé en septembre.", 1500, 1500, "livres"],
  ["Le mobilier de la salle des Forges", "Quarante chaises, douze tables pliantes et une estrade. Les recettes du marché de Noël y sont consacrées.", 3200, 900, "salle"],
  ["Les ateliers numériques pour seniors", "Douze séances d'initiation aux démarches en ligne, avec dix tablettes prêtées par l'association.", 4200, 2800, "numerique"],
];
// [id, titre, rubrique, auteur, date, extrait]
const ART = [
  ["jardin", "Le jardin partagé a fêté ses trois ans", "Vie de l'association", "Amina Diallo", "2026-10-24", "Quatre-vingts personnes, trois gâteaux et une récolte de courges record : retour sur la journée d'anniversaire du jardin."],
  ["devoirs", "Appel : six bénévoles pour l'aide aux devoirs", "Appels", "Bastien Lemoine", "2026-10-17", "Vingt-quatre élèves attendent un accompagnateur. Deux soirs par semaine, deux heures, aucune compétence particulière."],
  ["odette", "Portrait : Odette, 82 ans, reine du Repair Café", "Portraits", "Joëlle Caron", "2026-10-09", "Elle répare les machines à coudre depuis quarante ans et les transmet depuis cinq. Rencontre avec une bénévole précieuse."],
  ["cuisine", "Cuisine collective : 63 % de l'objectif atteint", "Projets", "Karim Ndiaye", "2026-09-30", "Merci aux 142 donateurs. Il manque encore 1 850 euros pour équiper la cuisine avant le marché de Noël."],
  ["ag-2026", "Compte rendu de l'assemblée générale", "Vie de l'association", "Joëlle Caron", "2026-09-19", "412 adhérents, un budget à l'équilibre et trois nouvelles personnes au bureau : l'essentiel de l'assemblée du 12 septembre."],
  ["biblio", "La bibliothèque de rue est installée", "Projets", "Sylvie Morel", "2026-09-04", "Deux boîtes à livres devant la gare, peintes par les enfants du centre de loisirs. Déjà trois cents livres échangés."],
  ["yanis", "Portrait : Yanis, bénévole depuis l'âge de 14 ans", "Portraits", "Joëlle Caron", "2026-08-21", "Il a commencé en distribuant des tracts. Il coordonne aujourd'hui les bénévoles du carnaval."],
  ["saison", "Nouvelle saison d'ateliers : le programme", "Vie de l'association", "Bastien Lemoine", "2026-08-07", "Quarante-huit ateliers de septembre à juin : cuisine, couture, numérique, jardinage, écriture. Les inscriptions sont ouvertes."],
];
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const D = (iso) => new Date(`${iso}T12:00:00Z`);
const fdate = (iso) => D(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dday = (iso) => D(iso).toLocaleDateString("fr-FR", { day: "numeric", timeZone: "UTC" });
const dmon = (iso) => D(iso).toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }).replace(".", "");
const monthSlug = (iso) => slug(D(iso).toLocaleDateString("fr-FR", { month: "long", timeZone: "UTC" }));
const eur = (n) => n.toLocaleString("fr-FR");

/* ---------- Dessins ---------- */
function bunting(n, seed) {
  const cols = ["#6d3fc0", "#f2b705", "#e8574a", "#2bb3a3", "#ff8fb1"]; let o = `<path d="M0 6Q${n * 30} 36 ${n * 60} 6" fill="none" stroke="#231a3a" stroke-width="2"/>`;
  for (let i = 0; i < n; i++) { const x = 8 + i * 60 / 1 * (1) / 1; const y = 6 + Math.sin((i + 0.5) / n * Math.PI) * 15; o += `<path d="M${x} ${y.toFixed(1)}h38l-19 38z" fill="${cols[(i + seed) % cols.length]}"/>`; }
  return `<svg class="cm-bunt" viewBox="0 0 ${n * 60} 60" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">${o}</svg>`;
}
const STICK = {
  soleil: `<circle cx="30" cy="30" r="12" fill="#f2b705"/><path d="M30 6v8M30 46v8M6 30h8M46 30h8M13 13l6 6M41 41l6 6M13 47l6-6M41 19l6-6" stroke="#f2b705" stroke-width="3.4" stroke-linecap="round"/>`,
  jardin: `<path d="M30 52V28" stroke="#2f7d4a" stroke-width="4"/><path d="M30 34C14 34 12 20 14 12c14 0 18 8 16 22zM30 28c14 0 18-8 16-16-14 0-18 6-16 16z" fill="#4bb26b"/><path d="M14 52h32" stroke="#231a3a" stroke-width="3.4" stroke-linecap="round"/>`,
  cuisine: `<path d="M12 28h36v8a14 14 0 0 1-14 14h-8a14 14 0 0 1-14-14z" fill="#e8574a"/><path d="M8 28h44" stroke="#231a3a" stroke-width="3.4" stroke-linecap="round"/><path d="M24 20c-3-4 3-6 0-10M34 20c-3-4 3-6 0-10" stroke="#231a3a" stroke-width="2.6" fill="none"/>`,
  livres: `<rect x="10" y="14" width="12" height="34" fill="#6d3fc0"/><rect x="24" y="10" width="12" height="38" fill="#f2b705"/><rect x="38" y="18" width="12" height="30" fill="#e8574a" transform="rotate(8 44 33)"/><path d="M6 50h48" stroke="#231a3a" stroke-width="3.4" stroke-linecap="round"/>`,
  salle: `<path d="M10 50V26l20-14 20 14v24z" fill="#2bb3a3"/><rect x="25" y="34" width="10" height="16" fill="#231a3a"/><path d="M6 28l24-18 24 18" stroke="#231a3a" stroke-width="3.4" fill="none" stroke-linejoin="round"/>`,
  numerique: `<rect x="14" y="8" width="32" height="44" rx="4" fill="#fff" stroke="#231a3a" stroke-width="3.4"/><circle cx="30" cy="45" r="3" fill="#231a3a"/><path d="M20 18h20M20 25h20M20 32h12" stroke="#6d3fc0" stroke-width="3.2"/>`,
  main: `<path d="M18 50c-6-8-8-16-4-22 4-4 8 0 8 4V16c0-4 6-4 6 0v10c0-4 6-4 6 0v2c0-4 6-4 6 0v6c0-3 6-3 6 0v8c0 8-6 14-14 14z" fill="#ff8fb1" stroke="#231a3a" stroke-width="2.6" stroke-linejoin="round"/>`,
  cle: `<circle cx="20" cy="22" r="10" fill="none" stroke="#231a3a" stroke-width="4"/><path d="M27 29l22 22M38 40l6-6M44 46l6-6" stroke="#231a3a" stroke-width="4" stroke-linecap="round"/>`,
};
const sticker = (k, cls = "") => `<svg class="cm-st ${cls}" viewBox="0 0 60 60" aria-hidden="true" focusable="false">${STICK[k] || STICK.soleil}</svg>`;
const ARR = `<svg class="cm-ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const MARK = `<svg class="cm-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="22" fill="#6d3fc0"/><circle cx="17" cy="20" r="6" fill="#f2b705"/><circle cx="31" cy="20" r="6" fill="#ff8fb1"/><path d="M10 31q14 16 28 0" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>`;
const BUNT = bunting(22, 0);

/* ---------- En-tête et pied ---------- */
const NAV = [["Accueil", "/"], ["Agenda", "/agenda"], ["Actualités", "/actualites"], ["Projets", "/projets"], ["Bénévolat", "/benevolat"], ["L'association", "/association"]];
const header = (c) => `<header class="cm-head pk-bleed">
  <div class="cm-announce"><div class="cm-wrap cm-announce-in"><span>Prochain rendez-vous : <b>Repair Café</b>, samedi 14 novembre, salle des Forges</span><a href="/agenda">Voir l'agenda ${ARR}</a></div></div>
  <div class="cm-wrap cm-bar">
    <a class="cm-logo" href="/" aria-label="${esc(c.brand)}, accueil">${MARK}<span><b>Maison Commune</b><small>association de quartier</small></span></a>
    <div class="cm-nav" role="navigation" aria-label="Navigation principale">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}</div>
    <a class="cm-btn cm-btn--hd" href="/adhesion">Adhérer</a>
    <details class="cm-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cm-drawer" role="navigation" aria-label="Menu mobile">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}<a href="/contact">Contact</a><a href="/recherche">Rechercher</a><a class="cm-btn" href="/adhesion">Adhérer</a></div></details>
  </div>${BUNT}</header>`;
const footer = () => `<footer class="cm-foot pk-bleed"><div class="cm-wrap"><div class="cm-foot-top">
  <div class="cm-foot-brand">${MARK}<p><b>Maison Commune</b> réunit les habitants du quartier de la gare autour d'ateliers, de fêtes et de projets partagés depuis 2014.</p></div>
  <div class="cm-fcol" role="navigation" aria-label="L'association"><p class="cm-fh">L'association</p><a href="/association">Qui sommes-nous</a><a href="/projets">Nos projets</a><a href="/actualites">Actualités</a><a href="/blocs">Exemples de mise en page</a></div>
  <div class="cm-fcol" role="navigation" aria-label="S'engager"><p class="cm-fh">S'engager</p><a href="/adhesion">Adhérer</a><a href="/benevolat">Devenir bénévole</a><a href="/agenda">Agenda</a><a href="/contact">Nous écrire</a></div>
  <div class="cm-fcol" role="navigation" aria-label="Informations"><p class="cm-fh">Informations</p><address>Salle des Forges<br>12 place de la Gare<br>Permanence : jeudi 17 h – 19 h</address><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div>
</div><p class="cm-legal">© Maison Commune — site de démonstration : l'association, ses événements, ses chiffres et ses membres sont fictifs.</p></div></footer>`;

const head = (kicker, title, sub) => sec(`<section class="cm-ph pk-bleed"><div class="cm-wrap"><p class="cm-kick">${esc(kicker)}</p><div class="cm-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="cm-lead">${esc(sub)}</p>` : ""}</div></section>`);
const chips = (label, key, list, all) => `<div class="cm-fg"><p class="cm-fl">${label}</p><ul class="cm-chips" role="group" aria-label="${label}" data-chips="${key}"><li><a href="#filtre" class="is-on" data-v="tout">${all}</a></li>${list.map(([v, l]) => `<li><a href="#filtre" data-v="${esc(v)}">${esc(l)}</a></li>`).join("")}</ul></div>`;
const none = (msg) => `<div class="cm-none" data-none hidden>${sticker("soleil")}<h2>Rien de prévu pour ce choix</h2><p>${msg} <a href="#tout" data-reset>Tout afficher</a></p></div>`;

/* ---------- Billets d'agenda ---------- */
const ticket = (e, href) => `<li class="cm-ev" data-type="${slug(e[2])}" data-mois="${monthSlug(e[3])}"><a class="cm-tk" href="${href}"><span class="cm-tk-d"><b>${dday(e[3])}</b><small>${dmon(e[3])}</small></span><span class="cm-tk-b"><span class="cm-tag cm-t-${slug(e[2])}">${esc(e[2])}</span><b class="cm-tk-t">${esc(e[1])}</b><span class="cm-tk-m">${esc(e[4])} · ${esc(e[5])}</span><span class="cm-tk-x">${esc(e[8])}</span><span class="cm-tk-p"><b>${esc(e[6])}</b><span>${esc(e[7])}</span></span></span></a></li>`;
const tickets = (list, href, cls = "") => `<ul class="cm-evs ${cls}" data-list>${list.map((e) => ticket(e, href)).join("")}</ul>`;

/* ---------- Pages ---------- */
const home = (c) => [sec(header(c)),
  sec(`<section class="cm-hero pk-bleed"><div class="cm-wrap cm-hero-in"><div class="cm-hero-tx"><p class="cm-kick">Association de quartier · depuis 2014</p><div class="cm-h1" role="heading" aria-level="1">Ici, <em>on fait</em> les choses ensemble.</div><p class="cm-lead">Repair Café, jardin partagé, soupe du vendredi, aide aux devoirs : 412 voisins, 63 bénévoles et 48 rendez-vous par an pour que le quartier reste un endroit où l'on se parle.</p><div class="cm-actions"><a class="cm-btn" href="/adhesion">Adhérer dès 8 € ${ARR}</a><a class="cm-btn cm-btn--line" href="/benevolat">Devenir bénévole</a></div></div>
    <div class="cm-hero-art" aria-hidden="true"><div class="cm-sun">${sticker("soleil")}</div><div class="cm-pile">${sticker("jardin", "cm-st--a")}${sticker("cuisine", "cm-st--b")}${sticker("livres", "cm-st--c")}${sticker("main", "cm-st--d")}</div></div></div></section>`),
  sec(`<section class="cm-nums pk-bleed"><div class="cm-wrap"><ul class="cm-nums-l">${[["412", "adhérents"], ["63", "bénévoles actifs"], ["48", "ateliers par an"], ["142", "donateurs cette année"]].map(([v, l]) => `<li><b data-count="${v}">${v}</b><span>${l}</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap"><div class="cm-sh"><h2>Les prochains rendez-vous</h2><a class="cm-more" href="/agenda">Tout l'agenda ${ARR}</a></div>${tickets(EV.slice(0, 4), "/agenda")}</div></section>`),
  sec(`<section class="cm-s cm-s--sun pk-bleed"><div class="cm-wrap cm-two"><div><p class="cm-kick">Appel</p><h2>Nous cherchons des bénévoles</h2><p class="cm-lead">Huit missions ouvertes, de 1 heure par semaine à un samedi par mois. Aucun diplôme, aucune expérience : de la bonne humeur et un peu de régularité.</p><a class="cm-btn" href="/benevolat">Voir les missions ${ARR}</a></div>
    <ul class="cm-miss-mini">${MISSIONS.slice(0, 4).map((m) => `<li><b>${esc(m[0])}</b><span>${esc(m[3])} · ${m[4]} places</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap"><div class="cm-sh"><h2>Nos projets en cours</h2><a class="cm-more" href="/projets">Tous les projets ${ARR}</a></div><ul class="cm-proj-mini">${PROJETS.slice(0, 3).map((p) => `<li>${sticker(p[4])}<div><b>${esc(p[0])}</b><span>${Math.round(p[3] / p[2] * 100)} % de l'objectif</span></div></li>`).join("")}</ul></div></section>`),
  sec(`<section class="cm-s cm-s--tint pk-bleed"><div class="cm-wrap"><div class="cm-sh"><h2>Dernières nouvelles</h2><a class="cm-more" href="/actualites">Toutes les actualités ${ARR}</a></div><ul class="cm-arts">${ART.slice(0, 3).map((a) => `<li><a href="/actualite"><span class="cm-tag">${esc(a[2])}</span><b>${esc(a[1])}</b><span class="cm-fine">${esc(fdate(a[4]))}</span></a></li>`).join("")}</ul></div></section>`),
  { type: "form", heading: "Rester informé de la vie du quartier", intro: "Un courriel par mois : l'agenda, les appels à bénévoles et les nouvelles des projets. Désinscription en un clic." },
  sec(footer())];

const agenda = (c) => [sec(header(c)), head("Agenda", "Les <em>rendez-vous</em> du quartier", `${EV.length} dates de novembre à avril. Filtrez par type ou par mois ; pour vous inscrire, écrivez-nous depuis la page de contact.`),
  sec(`<section class="cm-s pk-bleed" data-filter="agenda"><div class="cm-wrap"><div class="cm-filters">${chips("Type", "type", TYPES.map((t) => [slug(t), t]), "Tous")}${chips("Mois", "mois", MOIS, "Tous")}</div><p class="cm-count" data-count aria-live="polite"><b>${EV.length}</b> rendez-vous</p>${tickets(EV, "/contact")}${none("Aucun rendez-vous ne correspond à ces filtres.")}</div></section>`),
  sec(footer())];

const adhesion = (c) => [sec(header(c)), head("Adhésion", "Rejoignez <em>Maison Commune</em>", "Une adhésion, c'est une voix à l'assemblée, un tarif réduit aux ateliers et la certitude que l'association peut payer le loyer de la salle."),
  sec(`<section class="cm-s pk-bleed" data-calc><div class="cm-wrap cm-calc"><div><h2>Calculez votre cotisation</h2><p class="cm-lead">Choisissez votre formule, ajoutez un don si vous le souhaitez : le coût réel après réduction d'impôt s'affiche tout de suite.</p>
    <ul class="cm-formules" data-formules>${[["15", "Individuelle", "Une personne, valable un an"], ["8", "Réduite", "Étudiants, demandeurs d'emploi, minima sociaux"], ["25", "Famille", "Toute la famille vivant sous le même toit"], ["50", "Membre soutien", "Pour financer les actions du quartier"]].map(([v, t, d], i) => `<li data-v="${v}"${i === 0 ? ' class="is-on"' : ""}><b>${v} €</b><span><i>${t}</i>${d}</span></li>`).join("")}</ul></div>
    <aside class="cm-bill" aria-label="Votre adhésion" aria-live="polite"><p class="cm-fh">Votre adhésion</p><dl><dt>Cotisation</dt><dd><b data-t="cot">15</b> €</dd><dt>Don libre</dt><dd><b data-t="don">0</b> €</dd><dt>Total versé</dt><dd><b data-t="tot">15</b> €</dd><dt>Réduction fiscale sur le don</dt><dd>− <b data-t="red">0</b> €</dd><dt class="cm-bill-r">Coût réel pour vous</dt><dd class="cm-bill-r"><b data-t="net">15</b> €</dd></dl><p class="cm-fine">Hypothèse indicative : 66 % du don est déductible de l'impôt sur le revenu, la cotisation ne l'est pas. L'association de cette démonstration est fictive.</p></aside></div></section>`),
  { type: "form", heading: "Bulletin d'adhésion", intro: "Indiquez votre nom, votre adresse de courriel et la formule choisie. Le trésorier vous répond avec les modalités de paiement." },
  sec(`<section class="cm-s cm-s--tint pk-bleed"><div class="cm-wrap cm-faq"><h2>Questions sur l'adhésion</h2><div><details><summary>L'adhésion est-elle annuelle ?</summary><p>Oui, elle court du 1er septembre au 31 août. Une adhésion prise en cours d'année n'est pas diminuée.</p></details><details><summary>Puis-je participer sans adhérer ?</summary><p>Oui, les fêtes et le Repair Café sont ouverts à tous. L'adhésion donne accès au tarif réduit des ateliers et au vote à l'assemblée.</p></details><details><summary>Que devient mon argent ?</summary><p>Le loyer de la salle, l'assurance, le matériel des ateliers et un tiers du salaire du coordinateur. Les comptes sont présentés à chaque assemblée.</p></details></div></div></section>`),
  sec(footer())];

const mission = (m, i) => `<li class="cm-mi" data-pole="${slug(m[1])}" data-eng="${slug(m[2])}"><div class="cm-mi-h">${sticker(["main", "cle", "cuisine", "jardin", "soleil", "livres", "numerique", "salle"][i], "cm-st--s")}<div><span class="cm-tag">${esc(m[1])}</span><h2>${esc(m[0])}</h2></div></div><p>${esc(m[5])}</p><p class="cm-mi-m"><span>${esc(m[2])}</span><span>${esc(m[3])}</span><span class="cm-places" data-places="${m[4]}">${m[4]} place${m[4] > 1 ? "s" : ""}</span></p></li>`;
const benevolat = (c) => [sec(header(c)), head("Bénévolat", "Donnez un peu de <em>temps</em>, gagnez beaucoup de voisins", `${MISSIONS.length} missions ouvertes. Filtrez par pôle ou par engagement, puis écrivez-nous : un bénévole référent vous rappelle sous trois jours.`),
  sec(`<section class="cm-s pk-bleed" data-filter="missions"><div class="cm-wrap"><div class="cm-filters">${chips("Pôle", "pole", POLES.map((p) => [slug(p), p]), "Tous")}${chips("Engagement", "eng", [["ponctuel", "Ponctuel"], ["regulier", "Régulier"]], "Tous")}</div><p class="cm-count" data-count aria-live="polite"><b>${MISSIONS.length}</b> missions</p><ul class="cm-miss" data-list>${MISSIONS.map(mission).join("")}</ul>${none("Aucune mission ne correspond à ces filtres.")}</div></section>`),
  { type: "form", heading: "Je me propose", intro: "Indiquez la mission qui vous intéresse et vos disponibilités. Un référent vous contacte sous trois jours pour une première rencontre autour d'un café." },
  sec(footer())];

const projets = (c) => [sec(header(c)), head("Projets", "Ce que nous <em>construisons</em> ensemble", "Cinq projets financés par les dons et les recettes des fêtes. Les barres indiquent la collecte au 5 novembre 2026."),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap"><ul class="cm-projs">${PROJETS.map((p) => { const pc = Math.round(p[3] / p[2] * 100); return `<li class="cm-proj">${sticker(p[4], "cm-st--l")}<div><h2>${esc(p[0])}</h2><p>${esc(p[1])}</p><div class="cm-bar-w" role="img" aria-label="${pc} % de l'objectif atteint"><span class="cm-bar-f cm-w${Math.round(pc / 5) * 5}"></span></div><p class="cm-proj-m"><b>${eur(p[3])} €</b> collectés sur ${eur(p[2])} € · ${pc >= 100 ? "objectif atteint" : `${pc} %`}</p></div></li>`; }).join("")}</ul><p class="cm-fine">Pour contribuer, rendez-vous sur la page <a href="/adhesion">adhésion</a> ou parlez-en à la permanence du jeudi.</p></div></section>`),
  sec(footer())];

const association = (c) => [sec(header(c)), head("L'association", "Un quartier, <em>une maison</em>", "Maison Commune est née en 2014 d'un voisinage qui voulait sauver sa salle de quartier. Elle est aujourd'hui gérée par ses adhérents et trois salariés."),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap cm-two"><div><h2>Nos valeurs</h2><ul class="cm-vals"><li>${sticker("main", "cm-st--s")}<div><b>Participation.</b> Chaque adhérent vote, chaque bénévole peut proposer un projet.</div></li><li>${sticker("soleil", "cm-st--s")}<div><b>Convivialité.</b> On cuisine, on répare, on joue : on ne fait rien seul si on peut le faire à plusieurs.</div></li><li>${sticker("salle", "cm-st--s")}<div><b>Accessibilité.</b> Les prix sont libres ou réduits, les salles sont de plain-pied.</div></li></ul></div>
    <div><h2>Le bureau</h2><ul class="cm-bureau">${BUREAU.map(([n, r]) => `<li><b>${esc(n)}</b><span>${esc(r)}</span></li>`).join("")}</ul></div></div></section>`),
  sec(`<section class="cm-s cm-s--tint pk-bleed"><div class="cm-wrap"><div class="cm-sh"><h2>Rapport d'activité 2025-2026</h2></div><div class="cm-tbl"><table><caption>Les chiffres de l'année</caption><thead><tr><th scope="col">Indicateur</th><th scope="col">2024-2025</th><th scope="col">2025-2026</th><th scope="col">Évolution</th></tr></thead><tbody><tr><td>Adhérents</td><td>371</td><td>412</td><td>+11 %</td></tr><tr><td>Bénévoles actifs</td><td>51</td><td>63</td><td>+24 %</td></tr><tr><td>Ateliers et fêtes</td><td>41</td><td>48</td><td>+17 %</td></tr><tr><td>Budget (en euros)</td><td>71 400</td><td>78 900</td><td>+11 %</td></tr></tbody></table></div></div></section>`),
  sec(footer())];

const actualites = (c) => [sec(header(c)), head("Actualités", "Les <em>nouvelles</em> du quartier", "Portraits, comptes rendus, appels : tout ce qui a fait la vie de l'association depuis la rentrée."),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap"><ul class="cm-news">${ART.map((a, i) => `<li class="cm-new"><a class="cm-new-in" href="/actualite"><span class="cm-new-st">${sticker(["jardin", "main", "cle", "cuisine", "salle", "livres", "soleil", "numerique"][i])}</span><span class="cm-new-tx"><span class="cm-tag">${esc(a[2])}</span><b class="cm-new-t">${esc(a[1])}</b><span class="cm-new-x">${esc(a[5])}</span><span class="cm-fine">${esc(a[3])} · ${esc(fdate(a[4]))}</span></span></a></li>`).join("")}</ul></div></section>`),
  sec(footer())];

const A0 = ART[0];
const actualite = (c) => [sec(header(c)),
  sec(`<section class="cm-arth pk-bleed"><div class="cm-wrap"><div class="cm-crumb" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/actualites">Actualités</a><span>/</span><span>Vie de l'association</span></div><p class="cm-kick">${esc(A0[2])}</p><div class="cm-h1" role="heading" aria-level="1">${esc(A0[1])}</div><p class="cm-lead">${esc(A0[5])}</p><p class="cm-meta"><span>Par ${esc(A0[3])}</span><time datetime="${A0[4]}">${esc(fdate(A0[4]))}</time><span>4 min de lecture</span></p></div></section>`),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap cm-art"><article class="cm-prose">
    <p>Il a fallu trois barbecues, deux bâches et un nombre incalculable de gâteaux pour fêter les trois ans du jardin partagé, samedi dernier. Quatre-vingts personnes ont répondu à l'invitation, dont dix-sept enfants qui ont passé l'après-midi à chercher des vers de terre.</p>
    <h2>Une récolte de courges record</h2>
    <p>Amina Diallo, responsable du jardin, a présenté le bilan de la saison : 214 kilos de courges, 96 de tomates, et une première récolte de kiwis qui a surpris tout le monde. « Nous pensions que les kiwis ne pousseraient jamais ici, sourit-elle. Ils nous ont répondu. »</p>
    <blockquote class="cm-quote"><p>Le jardin n'est pas un endroit où l'on produit des légumes. C'est un endroit où l'on apprend à se rencontrer.</p><cite>Amina Diallo, responsable du jardin</cite></blockquote>
    <h2>Ce qui vient ensuite</h2>
    <p>La collecte pour la serre est déjà à 80 % de son objectif. Les travaux commenceront en février, avec un chantier collectif le 20. Un arboriculteur viendra montrer la taille des pommiers.</p>
    <div class="cm-box"><b>Pour venir donner un coup de main</b><p>Rendez-vous au jardin le 20 février, de 9 h à 12 h. Gants et sécateurs sont prêtés. Inscription sur la page <a href="/agenda">agenda</a>.</p></div>
    <h3>En bref</h3>
    <ul><li>Trois ans, 30 familles, 600 m² cultivés.</li><li>214 kilos de courges et 96 kilos de tomates.</li><li>Prochaine échéance : chantier de février.</li></ul>
    <p class="cm-sign">— Amina</p>
    <div class="cm-share"><span>À lire aussi</span><a href="/actualites">Autres nouvelles</a><a href="/projets">Le projet de serre</a></div>
  </article><aside class="cm-side" aria-label="S'engager"><div class="cm-side-in">${sticker("jardin")}<p class="cm-fh">Venez au jardin</p><p>Le jardin partagé accueille tous les adhérents, le samedi matin dès 9 h.</p><a class="cm-btn cm-btn--block" href="/adhesion">Adhérer ${ARR}</a><a class="cm-btn cm-btn--line cm-btn--block" href="/benevolat">Devenir bénévole</a></div></aside></div></section>`),
  sec(footer())];

const contact = (c) => [sec(header(c)), head("Contact", "Venez nous <em>dire bonjour</em>", "Une question, une inscription à un atelier, une idée de projet : écrivez-nous ou passez à la permanence du jeudi, de 17 h à 19 h."),
  { type: "form", heading: "Votre message", intro: "Pour une inscription à un atelier, indiquez son nom et le nombre de personnes. Nous répondons sous trois jours." }, sec(footer())];

const rechData = [...EV.map((e) => ["Agenda", e[1], `${fdate(e[3])} · ${e[5]}`, "/agenda", `${e[1]} ${e[2]} ${e[5]} ${e[8]}`]), ...ART.map((a) => ["Actualité", a[1], `${a[2]} · ${fdate(a[4])}`, "/actualite", `${a[1]} ${a[2]} ${a[5]}`]), ...MISSIONS.map((m) => ["Bénévolat", m[0], `${m[1]} · ${m[3]}`, "/benevolat", `${m[0]} ${m[1]} ${m[5]}`])];
const recherche = (c) => [sec(header(c)), head("Recherche", "Chercher dans <em>le quartier</em>", "Un atelier, une nouvelle, une mission : la liste se réduit pendant la saisie."),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap cm-srch" data-search><p class="cm-fine" data-hint>Saisissez quelques lettres pour filtrer les ${rechData.length} contenus.</p><ul class="cm-results" data-results>${rechData.map(([t, ti, d, u, q]) => `<li class="cm-res" data-q="${esc(slug(q))}"><a href="${u}"><span class="cm-tag">${t}</span><b>${esc(ti)}</b><small>${esc(d)}</small></a></li>`).join("")}</ul><div class="cm-none" data-none hidden>${sticker("soleil")}<h2>Rien trouvé, mais le soleil est là</h2><p>Aucun contenu ne correspond à cette recherche. Essayez un mot plus court, ou <a href="/agenda">consultez l'agenda</a>.</p></div></div></section>`),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans tout le site…" } }] }, sec(footer())];

const introuvable = (c) => [sec(header(c)), sec(`<section class="cm-404 pk-bleed"><div class="cm-wrap cm-404-in"><div><p class="cm-kick">Erreur 404</p><div class="cm-h1" role="heading" aria-level="1">Cette page est <em>partie en balade</em>.</div><p class="cm-lead">L'adresse n'existe pas ou la page a changé de place. Revenez à la salle des Forges, on vous y attend.</p><div class="cm-actions"><a class="cm-btn" href="/">Retour à l'accueil ${ARR}</a><a class="cm-btn cm-btn--line" href="/agenda">L'agenda</a><a class="cm-btn cm-btn--line" href="/recherche">Rechercher</a></div></div><div class="cm-404-fig" aria-hidden="true">${sticker("cle", "cm-st--xl")}<span>404</span></div></div></section>`), sec(footer())];

const blocs = (c) => [sec(header(c)), head("Exemples de mise en page", "Tous les <em>blocs</em> de l'association", "Titres, listes, citations, tableaux, code, boutons et encadrés tels que le thème les met en forme."),
  sec(`<section class="cm-s pk-bleed"><div class="cm-wrap"><div class="cm-prose cm-prose--solo">
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Un paragraphe courant avec un <a href="/agenda">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, une <mark>mise en évidence</mark> et une abréviation comme <abbr title="Assemblée générale">AG</abbr>. La ligne reste entre soixante et quatre-vingts caractères sur grand écran.</p>
    <ul><li>Une liste à puces</li><li>Avec plusieurs entrées</li><li>Et un sous-niveau :<ul><li>sous-entrée un</li><li>sous-entrée deux</li></ul></li></ul>
    <ol><li>Une liste numérotée</li><li>Pour les étapes d'un atelier</li><li>Et les consignes</li></ol>
    <blockquote class="cm-quote"><p>Une citation d'adhérent, entourée d'une bulle de conversation.</p><cite>Nom de la personne</cite></blockquote>
    <figure class="cm-figure">${sticker("jardin", "cm-st--xl")}<figcaption>Une légende d'illustration : l'autocollant du jardin partagé.</figcaption></figure>
    <div class="cm-box"><b>Encadré</b><p>Un encadré « bon à savoir » pour les infos pratiques.</p></div>
    <div class="cm-tbl"><table><caption>Tarifs des ateliers</caption><thead><tr><th scope="col">Atelier</th><th scope="col">Adhérent</th><th scope="col">Non-adhérent</th><th scope="col">Durée</th><th scope="col">Places</th></tr></thead><tbody><tr><td>Cuisine du monde</td><td>8 €</td><td>12 €</td><td>4 h</td><td>12</td></tr><tr><td>Initiation numérique</td><td>Gratuit</td><td>5 €</td><td>2 h</td><td>10</td></tr><tr><td>Repair Café</td><td>Gratuit</td><td>Gratuit</td><td>3 h</td><td>Libre</td></tr></tbody></table></div>
    <pre><code>Atelier : cuisine du monde
Date : 23 janvier 2027
Lieu : cuisine collective</code></pre>
    <p>Du code en ligne : <code>coût réel = cotisation + don × 0,34</code>.</p>
    <div class="cm-actions"><a class="cm-btn" href="/adhesion">Bouton principal</a><a class="cm-btn cm-btn--line" href="/benevolat">Bouton secondaire</a></div>
    <div class="cm-cols"><div><h3>Colonne gauche</h3><p>Un texte court en deux colonnes pour comparer deux formules.</p></div><div><h3>Colonne droite</h3><p>La seconde colonne passe sous la première sur mobile.</p></div></div>
    <details><summary>Un volet repliable</summary><p>Le contenu s'affiche à l'ouverture.</p></details>
  </div></div></section>`), sec(footer())];

const legal = (title, kicker, body) => (c) => [sec(header(c)), head(kicker, title, ""), sec(`<section class="cm-s pk-bleed"><div class="cm-wrap"><div class="cm-prose cm-prose--solo">${body}</div></div></section>`), sec(footer())];
const mentions = legal("Mentions <em>légales</em>", "Informations légales", `<h2>Éditeur du site</h2><p>Maison Commune est un site de démonstration. Association fictive régie par la loi du 1er juillet 1901, siège : salle des Forges, 12 place de la Gare, 35000 Rennes. Présidente et directrice de la publication : Sylvie Morel. Contact : <a href="/contact">formulaire de contact</a>.</p><h2>Hébergement</h2><p>Le site est hébergé par le prestataire choisi par l'exploitant du CMS. Remplacez ce paragraphe par les coordonnées de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les textes et illustrations de cette démonstration sont fictifs. Précisez ici les conditions de réutilisation de vos contenus.</p><h2>Dons et réductions d'impôt</h2><p>Les calculs de la page d'adhésion sont indicatifs. Seule votre association, si elle est habilitée à délivrer des reçus fiscaux, peut en établir un.</p>`);
const confid = legal("Politique de <em>confidentialité</em>", "Vos données", `<h2>Ce que nous collectons</h2><p>Les informations saisies dans les formulaires (nom, adresse de courriel, message, formule d'adhésion) et votre adresse si vous vous abonnez à la lettre mensuelle.</p><h2>Pourquoi</h2><p>Pour gérer les adhésions, répondre à vos messages et vous informer de la vie de l'association. Aucune donnée n'est vendue ni cédée à des tiers à des fins publicitaires.</p><h2>Durée de conservation</h2><p>Les données d'adhésion sont conservées trois ans après la dernière cotisation. Les messages sont conservés douze mois au plus.</p><h2>Vos droits</h2><p>Accès, rectification, effacement : écrivez-nous via le <a href="/contact">formulaire de contact</a>.</p>`);

module.exports = {
  key: "commun", name: "Commun", version: "1.0.0", category: "association", tags: ["chaleureux", "ludique", "moderne"], siteType: "Association polyvalente : adhésion, agenda et bénévolat", featured: false, collection: "pro",
  concept: "La fête de quartier : guirlande de fanions, billets d'agenda aux encoches et autocollants dessinés, avec un calculateur de cotisation, un agenda filtrable et un appel aux bénévoles.",
  description: "Association polyvalente : adhésion avec calculateur de cotisation et de coût réel, agenda filtrable de 14 rendez-vous, missions de bénévolat filtrables, projets financés par des dons, actualités et bureau.",
  brand: "Maison Commune", modules: ["blog", "formulaires", "recherche"],
  dna: {
    header: "bandeau-d-annonce-puis-barre-a-guirlande-de-fanions-avec-trois-formes-fanions-centre-bande",
    hero: "slogan-a-mot-surligne-et-pile-d-autocollants-dessines-sous-un-soleil",
    grid: "grille-de-billets-aux-encoches-et-cartes-d-autocollants",
    typo: "serif-humaniste-chaleureuse-de-titrage-et-sans-rond-de-lecture",
    shapes: "fanions-billets-a-encoches-bulles-de-conversation-et-autocollants",
    motion: "fanions-qui-ondulent-et-compteurs-qui-montent",
    rhythm: "bandes-creme-jaune-soleil-et-violet-comme-un-programme-de-fete",
    signature: "calculateur-de-cotisation-avec-cout-reel-et-agenda-et-missions-filtrables",
    palette: "violet-profond-jaune-soleil-et-corail-sur-fond-creme",
    image: "autocollants-dessines-en-svg-par-theme-jardin-cuisine-livres",
    list: "billets-d-agenda-aux-encoches-agenda-date-ou-mosaique",
    article: "recit-de-quartier-avec-bulle-de-citation-et-encart-pour-agir",
    sidebar: "carte-pour-agir-collee-avec-adhesion-et-benevolat",
    reading: "chapeau-chaleureux-bulle-de-citation-et-encadre-bon-a-savoir",
  },
  tokens: {
    colors: { primary: "#6d3fc0", secondary: "#231a3a", accent: "#f2b705", background: "#fff8ee", surface: "#ffffff", text: "#231a3a", muted: "#5a5070", success: "#2f6b3f", warning: "#8a5a0a", error: "#a3302a" },
    fonts: { heading: "font.alegreya", body: "font.plus-jakarta-sans", button: "font.plus-jakarta-sans", link: "font.plus-jakarta-sans" },
    radius: { sm: 6, md: 12, lg: 20, button: 999, field: 10, card: 16 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#231a3a" },
    type: { h1: { size: 56, weight: 800, lineHeight: 1.06, transform: "none" }, h2: { size: 34, weight: 800, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "soleil", label: "Jaune soleil des autocollants et des surlignages", type: "color", default: "#f2b705" },
    { key: "entete", label: "Forme de l'en-tête", type: "choice", default: "fanions", choices: [["fanions", "Fanions : logo à gauche, guirlande dessous"], ["centre", "Centré : logo au-dessus des rubriques"], ["bande", "Bande violette pleine"]] },
    { key: "liste", label: "Liste des rendez-vous", type: "choice", default: "billets", choices: [["billets", "Billets aux encoches en grille"], ["agenda", "Agenda : lignes datées"], ["mosaique", "Mosaïque de cartes colorées"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "ruche", choices: [["ruche", "Complet : colonnes et permanence"], ["simple", "Simple : une ligne"]] },
    { key: "article", label: "Page d'article", type: "choice", default: "journal", choices: [["journal", "Journal : carte pour agir à droite"], ["affiche", "Affiche : une colonne centrée"]] },
    { key: "soir", label: "Mode sombre", type: "choice", default: "jour", choices: [["jour", "Jour de fête"], ["nuit", "Soir de fête"]] },
    { key: "fanions", label: "Guirlande de fanions", type: "choice", default: "on", choices: [["on", "Affichée et ondulante"], ["off", "Masquée"]] },
  ],
  menu: [["Accueil", "/"], ["Agenda", "/agenda"], ["Actualités", "/actualites"], ["Projets", "/projets"], ["Bénévolat", "/benevolat"], ["Adhésion", "/adhesion"], ["L'association", "/association"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "agenda", name: "Agenda", render: agenda }, { key: "adhesion", name: "Adhésion et calculateur", render: adhesion },
    { key: "benevolat", name: "Appel aux bénévoles", render: benevolat }, { key: "projets", name: "Projets", render: projets }, { key: "association", name: "L'association", render: association },
    { key: "actualites", name: "Actualités", render: actualites }, { key: "actualite", name: "Article", render: actualite }, { key: "blocs", name: "Blocs de mise en page", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confid },
  ],
};
