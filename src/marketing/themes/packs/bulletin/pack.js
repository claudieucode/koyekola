// Bulletin — actualités d'entreprise. Direction artistique : le tableau d'affichage de l'usine. Bleu pétrole profond, vermillon d'alerte, blanc cassé ; blocs de date en rail, pictogrammes industriels dessinés,
// coins coupés, filets épais. Composant signature : le fil d'actualités filtrable (type, année, mot) lié à un espace presse complet (contacts, dossier de presse, agenda financier avec compte à rebours réel).
const { sec, esc } = require("../kit");

/* ---------- Données (écrites dans le thème : le CMS n'a pas de type « communiqué ») ---------- */
const AUTEURS = {
  marion: { n: "Marion Fabre", r: "Directrice de la communication", m: "marion.fabre@example.com" },
  julien: { n: "Julien Castel", r: "Directeur des ressources humaines", m: "julien.castel@example.com" },
  sandrine: { n: "Sandrine Oyono", r: "Directrice de la recherche et du développement", m: "sandrine.oyono@example.com" },
  pierre: { n: "Pierre Lemaire", r: "Directeur administratif et financier", m: "pierre.lemaire@example.com" },
};
const TYPES = ["Communiqué", "Produit", "Résultats", "Ressources humaines", "Événement", "Innovation"];
// [id, titre, type, date, auteur, minutes, extrait, étiquette thématique]
const NEWS = [
  ["t3", "Résultats du troisième trimestre : chiffre d'affaires en hausse de 6,4 %", "Résultats", "2026-10-29", "pierre", 3, "Le chiffre d'affaires atteint 112 millions d'euros sur le trimestre, porté par les services et la pompe VX. La prévision annuelle est confirmée.", "Finance"],
  ["lyon", "Brémond ouvre un centre de service à Lyon-Vénissieux", "Communiqué", "2026-10-15", "marion", 2, "Quatorze techniciens et un stock de pièces de 3 000 références pour intervenir en moins de quatre heures dans la région Auvergne-Rhône-Alpes.", "International"],
  ["vx300", "Lancement de la pompe VX-300 : 22 % d'énergie en moins", "Produit", "2026-10-02", "sandrine", 4, "Troisième génération de la gamme VX, avec moteur à aimants permanents et pilotage connecté. Disponible dès novembre en cinq tailles.", "Produits"],
  ["apprentis", "Quarante apprentis rejoignent les ateliers de Cholet", "Ressources humaines", "2026-09-18", "julien", 3, "La promotion 2026 compte douze femmes. Les apprentis seront formés en alternance aux métiers de la fonderie, de l'usinage et de la maintenance.", "Emploi"],
  ["salon", "Salon Pumps & Systems : rendez-vous du 24 au 26 novembre à Lyon", "Événement", "2026-09-09", "marion", 2, "Brémond présentera sa gamme VX-300 sur le stand B14 et animera deux conférences sur l'efficacité énergétique des stations de pompage.", "Événements"],
  ["fonderie", "Un nouveau procédé de fonderie réduit de 30 % les rebuts", "Innovation", "2026-08-27", "sandrine", 5, "Après dix-huit mois d'essais, la simulation du refroidissement permet d'ajuster chaque coulée. L'usine de Cholet généralise la méthode.", "Industrie 4.0"],
  ["s1", "Résultats du premier semestre 2026", "Résultats", "2026-07-23", "pierre", 3, "Chiffre d'affaires de 214 millions d'euros, résultat opérationnel en progression de 9 %. La dette nette recule de 18 millions d'euros.", "Finance"],
  ["nantes", "Accord de partenariat avec l'université de Nantes", "Communiqué", "2026-07-09", "marion", 2, "Trois thèses cofinancées sur la cavitation et l'usure des roues de pompes. Les premiers résultats sont attendus en 2028.", "Recherche"],
  ["securite", "Sécurité : 500 jours sans accident avec arrêt à Cholet", "Ressources humaines", "2026-06-25", "julien", 2, "Le site de Cholet franchit un jalon symbolique. Les équipes ont travaillé sur les gestes répétitifs et la signalisation des zones de manutention.", "Santé-sécurité"],
  ["carbone", "Bilan carbone 2025 : 11 % d'émissions en moins", "Communiqué", "2026-06-10", "marion", 4, "Les émissions des sites reculent à 41 000 tonnes équivalent CO2. Le groupe vise 30 % de baisse en 2030 par rapport à 2023.", "Environnement"],
  ["px", "La gamme PX renouvelée : trois modèles, une même interface", "Produit", "2026-05-21", "sandrine", 3, "Les pompes PX gagnent un afficheur commun et une maintenance simplifiée. Les anciens modèles restent supportés dix ans.", "Produits"],
  ["ag", "Assemblée générale du 19 mai : toutes les résolutions adoptées", "Communiqué", "2026-05-20", "pierre", 2, "Les actionnaires ont approuvé les comptes 2025 et un dividende de 1,25 euro par action. Le compte rendu complet est disponible sur demande.", "Finance"],
  ["portes", "Journées portes ouvertes à Cholet : 1 200 visiteurs", "Événement", "2026-04-14", "marion", 2, "Familles, élèves et anciens salariés ont visité la fonderie et l'atelier d'assemblage pendant deux jours.", "Événements"],
  ["recrute", "Recrutement : trente postes ouverts en maintenance industrielle", "Ressources humaines", "2026-03-31", "julien", 2, "Un plan de recrutement en CDI pour trois sites, avec parcours de formation interne et prime d'installation.", "Emploi"],
  ["annuels", "Résultats annuels 2025 : une année de transition réussie", "Résultats", "2026-02-26", "pierre", 4, "Chiffre d'affaires de 410 millions d'euros, résultat net de 28 millions. La part des services passe à 31 % de l'activité.", "Finance"],
  ["labo", "Un laboratoire d'essais hydrauliques inauguré à Nantes", "Innovation", "2026-01-28", "sandrine", 3, "Banc d'essai de 2 mégawatts, quatre cuves, ouvert aux clients pour tester leurs installations avant livraison.", "Industrie 4.0"],
  ["nomination", "Nomination d'une nouvelle directrice industrielle", "Communiqué", "2025-12-10", "marion", 2, "Céline Aubert, quinze ans d'expérience dans l'automobile, rejoint le comité de direction et prend la tête des quatre usines.", "Gouvernance"],
  ["prix", "Prix de l'innovation industrielle 2025 pour le moteur à aimants permanents", "Innovation", "2025-11-13", "sandrine", 3, "Le jury a salué un gain de rendement de 6 points et une conception facile à réparer.", "Produits"],
];
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const D = (iso) => new Date(`${iso}T12:00:00Z`);
const fdate = (iso) => D(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dday = (iso) => D(iso).toLocaleDateString("fr-FR", { day: "numeric", timeZone: "UTC" });
const dmon = (iso) => D(iso).toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }).replace(".", "");
const year = (iso) => iso.slice(0, 4);
const AGENDA = [["2027-02-04", "Chiffre d'affaires du quatrième trimestre", "Publication après clôture de Bourse", "Finance"], ["2027-02-25", "Résultats annuels 2026", "Conférence de presse à 9 h, siège de Cholet", "Finance"], ["2027-05-19", "Assemblée générale des actionnaires", "Cholet, salle des Forges, 14 h", "Gouvernance"], ["2027-07-22", "Résultats du premier semestre 2027", "Communiqué avant ouverture des marchés", "Finance"]];

/* ---------- Pictogrammes (SVG dessinés) ---------- */
const ICON = {
  communique: `<path d="M8 12h24v18H8zM8 12l12 10 12-10" fill="none" stroke="currentColor" stroke-width="2.4"/>`,
  produit: `<circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M20 9v22M9 20h22M12 12l16 16M28 12L12 28" stroke="currentColor" stroke-width="2"/>`,
  resultats: `<path d="M6 32h28M10 28V18M18 28V12M26 28V20M34 28V8" stroke="currentColor" stroke-width="3.4" fill="none"/>`,
  "ressources-humaines": `<circle cx="14" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="27" cy="16" r="4" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M5 32c0-7 18-7 18 0M23 32c0-5 12-5 12 0" fill="none" stroke="currentColor" stroke-width="2.4"/>`,
  evenement: `<rect x="7" y="9" width="26" height="24" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M7 16h26M14 5v8M26 5v8" stroke="currentColor" stroke-width="2.4"/><rect x="12" y="21" width="5" height="5" fill="currentColor"/>`,
  innovation: `<path d="M20 5a10 10 0 0 0-5 18v5h10v-5a10 10 0 0 0-5-18zM16 33h8" fill="none" stroke="currentColor" stroke-width="2.4"/>`,
};
const ic = (t, cls = "") => `<svg class="bu-ic ${cls}" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${ICON[slug(t)] || ICON.communique}</svg>`;
const MARK = `<svg class="bu-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M4 4h32v26l-8 6H4z" fill="currentColor"/><path d="M11 12h18M11 19h18M11 26h10" stroke="#fff" stroke-width="3"/></svg>`;
const ARR = `<svg class="bu-ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;
const IMPELLER = `<svg class="bu-imp" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width="3" opacity=".5"/><circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"/><path d="M100 100C100 60 125 35 160 40 150 70 135 95 100 100zM100 100C140 100 165 125 160 160 130 150 105 135 100 100zM100 100C100 140 75 165 40 160 50 130 65 105 100 100zM100 100C60 100 35 75 40 40 70 50 95 65 100 100z" fill="currentColor" opacity=".85"/><circle cx="100" cy="100" r="9" fill="#f3f4f1"/></svg>`;

/* ---------- En-tête et pied ---------- */
const NAV = [["Accueil", "/"], ["Actualités", "/actualites"], ["L'entreprise", "/entreprise"], ["Agenda", "/agenda"], ["Espace presse", "/presse"], ["Contact", "/contact"]];
const header = (c) => `<header class="bu-head pk-bleed">
  <div class="bu-ticker" data-ticker><div class="bu-wrap bu-ticker-in"><span class="bu-ticker-l">À la une</span><a class="bu-ticker-a" href="/actualite" data-ticker-a>${esc(NEWS[0][1])}</a></div></div>
  <div class="bu-util"><div class="bu-wrap bu-util-in"><span class="bu-util-t">Groupe Brémond · pompes et systèmes de pompage · Cholet</span><div class="bu-util-l"><a href="/presse">Espace presse</a><a href="/recherche">Rechercher</a><a href="/contact">Contact</a></div></div></div>
  <div class="bu-wrap bu-main">
    <a class="bu-logo" href="/" aria-label="${esc(c.brand)}, accueil">${MARK}<span><b>Bulletin</b><small>Brémond</small></span></a>
    <div class="bu-nav" role="navigation" aria-label="Navigation principale">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}</div>
    <details class="bu-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="bu-drawer" role="navigation" aria-label="Menu mobile">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}<a href="/recherche">Rechercher</a></div></details>
  </div></header>`;
const footer = () => `<footer class="bu-foot pk-bleed"><div class="bu-wrap"><div class="bu-foot-top">
  <div class="bu-foot-brand">${MARK}<p><b>Bulletin Brémond</b> rassemble les actualités du groupe : résultats, produits, ressources humaines, innovation. Un espace presse est ouvert aux journalistes.</p></div>
  <div class="bu-fcol" role="navigation" aria-label="Actualités"><p class="bu-fh">Actualités</p><a href="/actualites">Toutes les actualités</a><a href="/agenda">Agenda</a><a href="/entreprise">L'entreprise</a><a href="/blocs">Exemples de mise en page</a></div>
  <div class="bu-fcol" role="navigation" aria-label="Presse"><p class="bu-fh">Presse</p><a href="/presse">Espace presse</a><a href="/contact">Contacter la communication</a><a href="/recherche">Rechercher</a></div>
  <div class="bu-fcol" role="navigation" aria-label="Informations légales"><p class="bu-fh">Informations</p><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div>
</div><p class="bu-legal">© Groupe Brémond — site de démonstration : l'entreprise, ses résultats, ses produits et ses collaborateurs sont fictifs.</p></div></footer>`;

const head = (kicker, title, sub) => sec(`<section class="bu-ph pk-bleed"><div class="bu-wrap"><p class="bu-kick">${esc(kicker)}</p><div class="bu-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="bu-lead">${esc(sub)}</p>` : ""}</div></section>`);
const chips = (label, key, list, all) => `<div class="bu-fg"><p class="bu-fl">${label}</p><ul class="bu-chips" role="group" aria-label="${label}" data-chips="${key}"><li><a href="#filtre" class="is-on" data-v="tout">${all}</a></li>${list.map(([v, l]) => `<li><a href="#filtre" data-v="${esc(v)}">${esc(l)}</a></li>`).join("")}</ul></div>`;

/* ---------- Ligne d'actualité (trois mises en liste : fil, cartes, tableau) ---------- */
function row(n) {
  const [id, t, ty, date, au, min, ex, th] = n;
  return `<li class="bu-n bu-c-${slug(ty)}" data-type="${slug(ty)}" data-an="${year(date)}" data-q="${esc(slug(`${t} ${ty} ${th}`))}"><a class="bu-n-in" href="/actualite"><span class="bu-date"><b>${dday(date)}</b><small>${dmon(date)}</small><i>${year(date)}</i></span><span class="bu-n-tx"><span class="bu-tag">${esc(ty)}</span><span class="bu-n-t">${esc(t)}</span><span class="bu-n-x">${esc(ex)}</span><span class="bu-meta"><span>${esc(AUTEURS[au].n)}</span><span>${esc(th)}</span><span>${min} min</span></span></span></a></li>`;
}
const rows = (list, cls = "") => `<ul class="bu-news ${cls}" data-list>${list.map(row).join("")}</ul>`;
const none = `<div class="bu-none" data-none hidden><div class="bu-none-ic">${ic("communique")}</div><h2>Aucune actualité ne correspond</h2><p>Aucun article ne répond à ces critères. <a href="#tout" data-reset>Tout afficher</a></p></div>`;

/* ---------- Pages ---------- */
const L = NEWS[0];
const KEYS = [["2 840", "collaborateurs"], ["410", "M€ de chiffre d'affaires 2025"], ["38", "pays desservis"], ["7", "sites de production et de service"]];
const home = (c) => [sec(header(c)),
  sec(`<section class="bu-hero pk-bleed"><div class="bu-wrap bu-hero-in">
    <article class="bu-lead-card"><div class="bu-lead-bg" aria-hidden="true">${IMPELLER}</div><p class="bu-kick">À la une · ${esc(L[2])} · ${fdate(L[3])}</p><div class="bu-h1" role="heading" aria-level="1">${esc(L[1])}</div><p class="bu-stand">${esc(L[6])}</p><div class="bu-actions"><a class="bu-btn" href="/actualite">Lire le communiqué ${ARR}</a><a class="bu-btn bu-btn--line" href="/actualites">Toutes les actualités</a></div></article>
    <aside class="bu-last" aria-label="Dernières actualités"><p class="bu-fh">Dernières actualités</p><ul>${NEWS.slice(1, 5).map((n) => `<li class="bu-c-${slug(n[2])}"><a href="/actualite"><span class="bu-d">${dday(n[3])} ${dmon(n[3])}</span><span class="bu-lt">${esc(n[1])}</span><span class="bu-lk">${esc(n[2])}</span></a></li>`).join("")}</ul></aside></div></section>`),
  sec(`<section class="bu-keys pk-bleed"><div class="bu-wrap"><ul class="bu-keys-l">${KEYS.map(([v, l]) => `<li><b data-count="${v.replace(/\s/g, "")}">${v}</b><span>${esc(l)}</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="bu-s pk-bleed"><div class="bu-wrap"><div class="bu-sh"><h2>Le fil d'actualités</h2><a class="bu-more" href="/actualites">Les ${NEWS.length} actualités ${ARR}</a></div>${rows(NEWS.slice(5, 11))}</div></section>`),
  sec(`<section class="bu-s bu-s--tint pk-bleed"><div class="bu-wrap bu-two"><div><p class="bu-kick">Espace presse</p><h2>Les journalistes ont leur page</h2><p class="bu-lead">Contacts directs, dossier de presse, chiffres clés et calendrier financier : tout ce qu'il faut pour écrire sur Brémond, sans passer par un formulaire.</p><a class="bu-btn" href="/presse">Ouvrir l'espace presse ${ARR}</a></div>
    <div class="bu-next" data-next><p class="bu-fh">Prochaine échéance financière</p><p class="bu-next-d" data-next-d>${fdate(AGENDA[0][0])}</p><p class="bu-next-t" data-next-t>${esc(AGENDA[0][1])}</p><p class="bu-next-c"><b data-next-n>${Math.max(0, Math.ceil((D(AGENDA[0][0]) - Date.UTC(2026, 10, 5)) / 864e5))}</b> <span>jours restants</span></p><a class="bu-more" href="/agenda">Tout le calendrier ${ARR}</a></div></div></section>`),
  { type: "form", heading: "Recevoir les communiqués", intro: "Indiquez votre adresse de courriel : vous recevrez chaque communiqué du groupe le jour de sa publication. Désinscription en un clic." },
  sec(footer())];

const actualites = (c) => [sec(header(c)), head("Actualités", "Le fil d'<em>actualités</em>", `${NEWS.length} publications depuis novembre 2025. Combinez le type, l'année et un mot pour retrouver un communiqué.`),
  sec(`<section class="bu-s pk-bleed" data-filter="actu"><div class="bu-wrap"><div class="bu-filters">${chips("Type", "type", TYPES.map((t) => [slug(t), t]), "Tous")}${chips("Année", "an", [["2026", "2026"], ["2025", "2025"]], "Toutes")}<div class="bu-fg bu-fg--q"><p class="bu-fl">Mot</p><div class="bu-q" data-q-box></div></div></div><p class="bu-count" data-count aria-live="polite"><b>${NEWS.length}</b> actualités</p>${rows(NEWS)}${none}</div></section>`),
  sec(footer())];

const A0 = NEWS[2];
const actualite = (c) => [sec(header(c)),
  sec(`<section class="bu-arth pk-bleed"><div class="bu-wrap"><div class="bu-crumb" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/actualites">Actualités</a><span>/</span><span>Produit</span></div>
    <p class="bu-kick">Communiqué de presse · ${esc(A0[2])}</p><div class="bu-h1" role="heading" aria-level="1">${esc(A0[1])}</div><p class="bu-stand">${esc(A0[6])}</p>
    <dl class="bu-ref"><dt>Date</dt><dd>${fdate(A0[3])}</dd><dt>Lieu</dt><dd>Cholet</dd><dt>Référence</dt><dd>CP-2026-17</dd><dt>Auteur</dt><dd>${esc(AUTEURS[A0[4]].n)}</dd></dl></div></section>`),
  sec(`<section class="bu-s pk-bleed"><div class="bu-wrap bu-art">
    <article class="bu-prose">
      <p><strong>Cholet, le 2 octobre 2026.</strong> Brémond lance la VX-300, troisième génération de sa pompe centrifuge pour les stations de pompage d'eau potable et d'eaux usées. Le nouveau modèle consomme jusqu'à 22 % d'énergie en moins que la génération précédente, à débit égal.</p>
      <h2>Un rendement qui change la facture</h2>
      <p>La VX-300 associe un moteur à aimants permanents, une roue redessinée par simulation numérique et un variateur intégré. Sur une station de 400 mètres cubes par heure, l'économie annuelle atteint 18 000 kilowattheures, soit la consommation de six foyers.</p>
      <blockquote class="bu-quote"><p>Nous avons passé trois ans à gagner chaque point de rendement. Le plus difficile n'était pas la technique, c'était de rendre la pompe aussi simple à entretenir que la précédente.</p><cite>Sandrine Oyono, directrice de la recherche et du développement</cite></blockquote>
      <h2>Disponibilité et prix</h2>
      <p>La gamme comprend cinq tailles, de 15 à 160 kilowatts. Les premières livraisons sont prévues en novembre 2026. Le tarif de base de la VX-300 est identique à celui de la VX-200 ; les options de pilotage connecté sont facturées en supplément.</p>
      <div class="bu-tbl"><table><caption>Gamme VX-300 : caractéristiques principales</caption><thead><tr><th scope="col">Taille</th><th scope="col">Puissance</th><th scope="col">Débit maximal</th><th scope="col">Rendement</th><th scope="col">Livraison</th></tr></thead><tbody><tr><td>VX-300/15</td><td>15 kW</td><td>120 m³/h</td><td>88 %</td><td>Novembre</td></tr><tr><td>VX-300/55</td><td>55 kW</td><td>360 m³/h</td><td>90 %</td><td>Novembre</td></tr><tr><td>VX-300/160</td><td>160 kW</td><td>900 m³/h</td><td>92 %</td><td>Janvier</td></tr></tbody></table></div>
      <h3>À propos de Brémond</h3>
      <p class="bu-boiler">Brémond conçoit et fabrique des pompes et des systèmes de pompage depuis 1961. Le groupe compte 2 840 collaborateurs, sept sites et réalise 410 millions d'euros de chiffre d'affaires dans 38 pays. Brémond est une entreprise fictive créée pour la démonstration de ce thème.</p>
    </article>
    <aside class="bu-side" aria-label="Contact presse"><div class="bu-side-in"><p class="bu-fh">Contact presse</p><p class="bu-who"><b>${esc(AUTEURS.marion.n)}</b><span>${esc(AUTEURS.marion.r)}</span></p><p><a href="mailto:${AUTEURS.marion.m}">${AUTEURS.marion.m}</a></p><p class="bu-fine">Réponse sous une journée ouvrée. Visuels haute définition disponibles sur demande.</p><a class="bu-btn bu-btn--block" href="/presse">Espace presse ${ARR}</a>
      <p class="bu-fh bu-fh--m">Dans la même rubrique</p><ul class="bu-mini">${[NEWS[10], NEWS[5], NEWS[15]].map((n) => `<li><a href="/actualite"><small>${fdate(n[3])}</small>${esc(n[1])}</a></li>`).join("")}</ul></div></aside></div></section>`),
  sec(footer())];

const entreprise = (c) => [sec(header(c)), head("L'entreprise", "Soixante ans à faire <em>circuler l'eau</em>", "Brémond conçoit des pompes, des stations de pompage et les services pour les maintenir en marche."),
  sec(`<section class="bu-keys bu-keys--solo pk-bleed"><div class="bu-wrap"><ul class="bu-keys-l">${KEYS.map(([v, l]) => `<li><b data-count="${v.replace(/\s/g, "")}">${v}</b><span>${esc(l)}</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="bu-s pk-bleed"><div class="bu-wrap"><div class="bu-sh"><h2>Les dates qui comptent</h2></div><ol class="bu-time">${[["1961", "Création de l'atelier de Cholet par Gaston Brémond : quatre ouvriers, une presse, un brevet de joint."], ["1984", "Première pompe à vitesse variable de la gamme, vendue à une régie des eaux."], ["1999", "Ouverture de la fonderie de Cholet, qui produit toutes les roues du groupe."], ["2008", "Premier site à l'étranger, en Pologne, puis cinq autres en dix ans."], ["2019", "Lancement de l'offre de services connectés : surveillance à distance et maintenance prédictive."], ["2024", "Programme de réduction des émissions : objectif de 30 % de baisse en 2030."], ["2026", "La pompe VX-300 et le laboratoire d'essais de Nantes."]].map(([y, t]) => `<li><b>${y}</b><p>${esc(t)}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="bu-s bu-s--tint pk-bleed"><div class="bu-wrap"><div class="bu-sh"><h2>Sept sites</h2></div><div class="bu-tbl"><table><caption>Implantations du groupe</caption><thead><tr><th scope="col">Site</th><th scope="col">Activité</th><th scope="col">Effectif</th></tr></thead><tbody><tr><td>Cholet (siège)</td><td>Fonderie, assemblage, direction</td><td>1 120</td></tr><tr><td>Nantes</td><td>Recherche et laboratoire d'essais</td><td>260</td></tr><tr><td>Lyon-Vénissieux</td><td>Centre de service</td><td>46</td></tr><tr><td>Wrocław (Pologne)</td><td>Usinage et assemblage</td><td>620</td></tr><tr><td>Turin (Italie)</td><td>Bureau d'études, ventes</td><td>180</td></tr><tr><td>Monterrey (Mexique)</td><td>Assemblage, service</td><td>310</td></tr><tr><td>Pune (Inde)</td><td>Ventes et service</td><td>304</td></tr></tbody></table></div></div></section>`),
  sec(footer())];

const agenda = (c) => [sec(header(c)), head("Agenda", "Rendez-vous et <em>échéances</em>", "Salons, assemblée générale, publications financières : les prochaines dates du groupe. Le compte à rebours part de la date de votre ordinateur."),
  sec(`<section class="bu-s pk-bleed"><div class="bu-wrap"><div class="bu-next bu-next--big" data-next><p class="bu-fh">Prochaine échéance</p><p class="bu-next-d" data-next-d>${fdate(AGENDA[0][0])}</p><p class="bu-next-t" data-next-t>${esc(AGENDA[0][1])}</p><p class="bu-next-c"><b data-next-n>${Math.max(0, Math.ceil((D(AGENDA[0][0]) - Date.UTC(2026, 10, 5)) / 864e5))}</b> <span>jours restants</span></p></div>
    <ol class="bu-agenda" data-agenda>${AGENDA.map((a) => `<li data-date="${a[0]}"><span class="bu-date"><b>${dday(a[0])}</b><small>${dmon(a[0])}</small><i>${year(a[0])}</i></span><div><p class="bu-tag">${ic("evenement")}${esc(a[3])}</p><h2>${esc(a[1])}</h2><p>${esc(a[2])}</p></div></li>`).join("")}</ol>
    <h2 class="bu-h2s">Salons et événements</h2><ul class="bu-events"><li><b>24 au 26 novembre 2026</b><span>Salon Pumps &amp; Systems, Lyon — stand B14</span></li><li><b>9 mars 2027</b><span>Journée de l'industrie, usine de Cholet</span></li><li><b>11 au 14 mai 2027</b><span>Foire internationale de l'eau, Turin</span></li></ul></div></section>`),
  sec(footer())];

const presse = (c) => [sec(header(c)), head("Espace presse", "Tout pour <em>écrire</em> sur Brémond", "Contacts directs, dossier de presse, chiffres clés et derniers communiqués. Les demandes d'interview sont traitées sous une journée ouvrée."),
  sec(`<section class="bu-s pk-bleed"><div class="bu-wrap"><div class="bu-sh"><h2>Contacts presse</h2></div><ul class="bu-contacts">${Object.values(AUTEURS).map((a) => `<li><b>${esc(a.n)}</b><span>${esc(a.r)}</span><a href="mailto:${a.m}">${a.m}</a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="bu-s bu-s--tint pk-bleed"><div class="bu-wrap bu-two"><div><h2>Le dossier de presse</h2><p class="bu-lead">Quatre documents sont tenus à jour par la communication. Ils sont envoyés sur demande, dans la journée.</p><a class="bu-btn" href="mailto:presse@example.com">Demander le dossier ${ARR}</a></div><ul class="bu-kit">${[["Présentation du groupe", "Histoire, chiffres, organisation (12 pages)"], ["Photothèque", "Usines, produits et dirigeants en haute définition"], ["Logos et charte", "Fichiers vectoriels et règles d'usage"], ["Biographies", "Les neuf membres du comité de direction"]].map(([t, d]) => `<li>${ic("communique")}<div><b>${t}</b><span>${d}</span></div></li>`).join("")}</ul></div></section>`),
  sec(`<section class="bu-s pk-bleed" data-filter="presse" data-preset="communique"><div class="bu-wrap"><div class="bu-sh"><h2>Derniers communiqués</h2><a class="bu-more" href="/actualites">Toutes les actualités ${ARR}</a></div><p class="bu-count" data-count aria-live="polite"><b>5</b> communiqués</p>${rows(NEWS.filter((n) => n[2] === "Communiqué"), "bu-news--table")}${none}</div></section>`),
  sec(`<section class="bu-s bu-s--tint pk-bleed"><div class="bu-wrap bu-faq"><h2>Questions de journalistes</h2><div><details><summary>Puis-je citer un porte-parole ?</summary><p>Oui, après validation du texte par la direction de la communication. Précisez le nom et la fonction souhaités.</p></details><details><summary>Qui contacter pour une interview ?</summary><p>Écrivez à la directrice de la communication : elle organise l'entretien avec le dirigeant concerné sous deux jours ouvrés.</p></details><details><summary>Les chiffres sont-ils vérifiables ?</summary><p>Les chiffres financiers renvoient aux publications officielles. Les autres données sont validées par la direction concernée.</p></details></div></div></section>`),
  sec(footer())];

const contact = (c) => [sec(header(c)), head("Contact", "Écrire à <em>la communication</em>", "Une question sur une publication, une demande d'interview ou un message pour un service : une réponse sous une journée ouvrée."),
  { type: "form", heading: "Votre message", intro: "Précisez votre média ou votre organisation s'il s'agit d'une demande de presse." }, sec(footer())];

const rechData = NEWS.map((n) => `<li class="bu-res" data-q="${esc(slug(`${n[1]} ${n[2]} ${n[7]} ${AUTEURS[n[4]].n} ${n[6]}`))}"><a href="/actualite"><span class="bu-d">${fdate(n[3])}</span><b>${esc(n[1])}</b><small>${esc(n[2])} · ${esc(n[7])}</small></a></li>`).join("");
const recherche = (c) => [sec(header(c)), head("Recherche", "Chercher dans <em>les actualités</em>", "Un titre, un produit, un nom : la liste se réduit pendant la saisie."),
  sec(`<section class="bu-s pk-bleed"><div class="bu-wrap bu-srch" data-search><p class="bu-fine" data-hint>Saisissez quelques lettres pour filtrer les ${NEWS.length} actualités.</p><ul class="bu-results" data-results>${rechData}</ul><div class="bu-none" data-none hidden><div class="bu-none-ic">${ic("communique")}</div><h2>Aucun résultat</h2><p>Aucune actualité ne correspond à cette recherche. Essayez un mot plus court ou <a href="/actualites">parcourez toutes les actualités</a>.</p></div></div></section>`),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans tout le site…" } }] }, sec(footer())];

const introuvable = (c) => [sec(header(c)), sec(`<section class="bu-404 pk-bleed"><div class="bu-wrap bu-404-in"><div><p class="bu-kick">Erreur 404</p><div class="bu-h1" role="heading" aria-level="1">Cette page est <em>à l'arrêt</em>.</div><p class="bu-lead">L'adresse n'existe pas ou la publication a été retirée. Reprenons depuis un point de contrôle.</p><div class="bu-actions"><a class="bu-btn" href="/">Retour à l'accueil ${ARR}</a><a class="bu-btn bu-btn--line" href="/actualites">Les actualités</a><a class="bu-btn bu-btn--line" href="/recherche">Rechercher</a></div></div><div class="bu-404-fig" aria-hidden="true">${IMPELLER}<span>404</span></div></div></section>`), sec(footer())];

const blocs = (c) => [sec(header(c)), head("Exemples de mise en page", "Tous les <em>blocs</em> du bulletin", "Titres, listes, citations, tableaux, code, boutons et encadrés tels que le thème les met en forme."),
  sec(`<section class="bu-s pk-bleed"><div class="bu-wrap"><div class="bu-prose bu-prose--solo">
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Un paragraphe courant avec un <a href="/actualites">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, une <mark>mise en évidence</mark> et une abréviation comme <abbr title="Résultat opérationnel courant">ROC</abbr>. La ligne reste entre soixante et quatre-vingts caractères sur grand écran.</p>
    <ul><li>Une liste à puces</li><li>Avec plusieurs entrées</li><li>Et un sous-niveau :<ul><li>sous-entrée un</li><li>sous-entrée deux</li></ul></li></ul>
    <ol><li>Une liste numérotée</li><li>Pour les procédures</li><li>Et les chronologies</li></ol>
    <blockquote class="bu-quote"><p>Une citation de dirigeant, mise en valeur par un filet vermillon.</p><cite>Nom et fonction</cite></blockquote>
    <figure class="bu-figure">${IMPELLER}<figcaption>Une légende de visuel : roue de pompe vue de face.</figcaption></figure>
    <div class="bu-box"><b>Encadré</b><p>Un encadré « à retenir » pour les chiffres et les définitions.</p></div>
    <div class="bu-tbl"><table><caption>Résultats par trimestre</caption><thead><tr><th scope="col">Trimestre</th><th scope="col">Chiffre d'affaires</th><th scope="col">Évolution</th><th scope="col">Services</th><th scope="col">Commentaire</th></tr></thead><tbody><tr><td>T1</td><td>102 M€</td><td>+4,8 %</td><td>29 %</td><td>Bonne tenue de l'Europe</td></tr><tr><td>T2</td><td>112 M€</td><td>+5,1 %</td><td>30 %</td><td>Effet de la gamme PX</td></tr><tr><td>T3</td><td>112 M€</td><td>+6,4 %</td><td>31 %</td><td>Lancement de la VX</td></tr></tbody></table></div>
    <pre><code>Référence : CP-2026-17
Date : 2 octobre 2026
Contact : presse@example.com</code></pre>
    <p>Du code en ligne : <code>rendement = puissance utile / puissance absorbée</code>.</p>
    <div class="bu-actions"><a class="bu-btn" href="/presse">Bouton principal</a><a class="bu-btn bu-btn--line" href="/actualites">Bouton secondaire</a></div>
    <div class="bu-cols"><div><h3>Colonne gauche</h3><p>Un texte court en deux colonnes pour comparer deux indicateurs.</p></div><div><h3>Colonne droite</h3><p>La seconde colonne passe sous la première sur mobile.</p></div></div>
    <details><summary>Un volet repliable</summary><p>Le contenu s'affiche à l'ouverture.</p></details>
  </div></div></section>`), sec(footer())];

const legal = (title, kicker, body) => (c) => [sec(header(c)), head(kicker, title, ""), sec(`<section class="bu-s pk-bleed"><div class="bu-wrap"><div class="bu-prose bu-prose--solo">${body}</div></div></section>`), sec(footer())];
const mentions = legal("Mentions <em>légales</em>", "Informations légales", `<h2>Éditeur du site</h2><p>Bulletin Brémond est un site de démonstration. Éditeur fictif : Groupe Brémond SA, 1 rue des Forges, 49300 Cholet. Directrice de la publication : Marion Fabre. Contact : <a href="/contact">formulaire de contact</a>.</p><h2>Hébergement</h2><p>Le site est hébergé par le prestataire choisi par l'exploitant du CMS. Remplacez ce paragraphe par les coordonnées de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les communiqués, textes et visuels de cette démonstration sont fictifs. Précisez ici les conditions de réutilisation de vos propres contenus.</p><h2>Information financière</h2><p>Les chiffres de cette démonstration sont inventés et ne constituent aucune information réglementée.</p>`);
const confid = legal("Politique de <em>confidentialité</em>", "Vos données", `<h2>Ce que nous collectons</h2><p>Votre adresse de courriel si vous vous abonnez aux communiqués, et les informations saisies dans le formulaire de contact.</p><h2>Pourquoi</h2><p>Pour vous envoyer les communiqués et répondre à vos messages. Aucune donnée n'est vendue ni cédée à des tiers à des fins publicitaires.</p><h2>Durée de conservation</h2><p>Votre adresse est conservée tant que vous êtes abonné, puis supprimée dans les trente jours qui suivent la désinscription. Les messages sont conservés douze mois au plus.</p><h2>Vos droits</h2><p>Accès, rectification, effacement : écrivez-nous via le <a href="/contact">formulaire de contact</a>.</p>`);

module.exports = {
  key: "bulletin", name: "Bulletin", version: "1.0.0", category: "services", tags: ["classique", "moderne", "technique"], siteType: "Actualités d'entreprise et espace presse", featured: false, collection: "blog",
  concept: "Le tableau d'affichage de l'usine : rail de dates, pictogrammes industriels, coins coupés et filets épais, avec un fil d'actualités filtrable et un espace presse complet.",
  description: "Actualités d'entreprise : une à la une, fil de 18 publications filtrable par type, année et mot, article de communiqué avec contact presse, espace presse, agenda financier avec compte à rebours et chiffres clés animés.",
  brand: "Bulletin Brémond", modules: ["blog", "formulaires", "recherche"],
  dna: {
    header: "bandeau-d-info-tournant-sur-barre-utilitaire-et-navigation-avec-trois-formes-deux-etages-compact-marque",
    hero: "une-d-entreprise-bloc-bleu-petrole-a-roue-de-pompe-et-colonne-des-dernieres-actualites",
    grid: "grille-de-tableau-d-affichage-avec-rail-de-dates-et-filets-epais",
    typo: "geometrique-condensee-de-titrage-et-humaniste-de-lecture-courante",
    shapes: "coins-coupes-barres-de-couleur-par-type-et-pictogrammes-industriels",
    motion: "bandeau-defilant-compteurs-qui-montent-et-compte-a-rebours",
    rhythm: "bandes-bleu-petrole-et-blanc-casse-separees-par-filets-epais",
    signature: "fil-d-actualites-filtrable-par-type-annee-et-mot-lie-a-un-espace-presse",
    palette: "bleu-petrole-profond-et-vermillon-d-alerte-sur-blanc-casse",
    image: "pictogrammes-et-roue-de-pompe-en-svg-sans-photographie",
    list: "fil-a-rail-de-dates-cartes-ou-tableau-dense",
    article: "communique-de-presse-avec-fiche-de-reference-et-boilerplate",
    sidebar: "contact-presse-colle-avec-rubrique-voisine",
    reading: "chapeau-standfirst-citation-de-dirigeant-et-tableau-de-caracteristiques",
  },
  tokens: {
    colors: { primary: "#8a5a00", secondary: "#0b2f3d", accent: "#b93a14", background: "#f3f4f1", surface: "#ffffff", text: "#13242c", muted: "#4a5c64", success: "#2f6b3f", warning: "#8a5a0a", error: "#a3302a" },
    fonts: { heading: "font.league-spartan", body: "font.pt-sans", button: "font.league-spartan", link: "font.pt-sans" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#c5cdd0" },
    type: { h1: { size: 52, weight: 800, lineHeight: 1.05, transform: "none" }, h2: { size: 32, weight: 800, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "alerte", label: "Vermillon d'alerte", type: "color", default: "#b93a14" },
    { key: "entete", label: "Forme de l'en-tête", type: "choice", default: "deux", choices: [["deux", "Deux étages : barre utilitaire et navigation"], ["compact", "Compact : une seule ligne"], ["marque", "Marque : bloc de logo bleu pétrole"]] },
    { key: "liste", label: "Liste des actualités", type: "choice", default: "fil", choices: [["fil", "Fil à rail de dates"], ["cartes", "Cartes en grille"], ["tableau", "Tableau dense"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "annuaire", choices: [["annuaire", "Annuaire : colonnes"], ["compact", "Compact : une ligne"]] },
    { key: "article", label: "Page d'un article", type: "choice", default: "communique", choices: [["communique", "Communiqué : contact presse à droite"], ["actualite", "Actualité : une colonne, contact dessous"]] },
    { key: "nuit", label: "Mode sombre", type: "choice", default: "non", choices: [["non", "Blanc cassé"], ["oui", "Salle de contrôle"]] },
    { key: "bandeau", label: "Bandeau d'info tournant", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Actualités", "/actualites"], ["L'entreprise", "/entreprise"], ["Agenda", "/agenda"], ["Espace presse", "/presse"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "actualites", name: "Fil d'actualités", render: actualites }, { key: "actualite", name: "Communiqué", render: actualite },
    { key: "entreprise", name: "L'entreprise", render: entreprise }, { key: "agenda", name: "Agenda", render: agenda }, { key: "presse", name: "Espace presse", render: presse },
    { key: "blocs", name: "Blocs de mise en page", render: blocs }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche },
    { key: "introuvable", name: "Page introuvable", render: introuvable }, { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confid },
  ],
};
