// Défilé — one-page polyvalent. Direction artistique : un récit continu qui se lit de haut en bas, avec un fil vertical numéroté (01 … 07), une rampe de points qui suit la section active et une
// barre de progression. Violet profond sur blanc lavande, grandes formes arrondies, arcs boréaux dessinés. Démonstration : le studio fictif « Studio Boréal » (identité, sites, édition).
// Les ancres (#apropos, #services…) sont posées par le script du thème à partir des attributs data-sec : une page du Page Builder n'accepte pas d'identifiants dans ses blocs HTML.
const { sec, esc, nav } = require("../kit");

const SECS = [["apropos", "À propos"], ["services", "Services"], ["methode", "Méthode"], ["projets", "Projets"], ["avis", "Avis"], ["tarifs", "Tarifs"], ["contact", "Contact"]];
// [clé, titre, type, client, année, résumé]
const PROJ = [
  ["maree", "Marée haute", "Identité", "Poissonnerie Le Grand Bleu", 2026, "Nouvelle identité, enseigne et emballages pour une poissonnerie familiale de Saint-Malo."],
  ["cadran", "Cadran", "Site web", "Horlogerie Vasseur", 2026, "Site vitrine et catalogue de restauration de montres anciennes, avec prise de rendez-vous."],
  ["lisiere", "Lisière", "Édition", "Collectif Hors-Piste", 2025, "Livre de photographies de montagne : direction artistique, maquette et suivi d'impression."],
  ["sillage", "Sillage", "Identité", "Voiles de l'Ouest", 2025, "Identité visuelle et signalétique d'une école de voile, déclinée sur les bateaux et les voiles."],
  ["fenaison", "Fenaison", "Packaging", "Laiterie des Hautes Combes", 2025, "Gamme de fromages : étiquettes, caisses et affiche de marché imprimées en deux couleurs."],
  ["veillee", "Veillée", "Site web", "Théâtre de la Lanterne", 2024, "Billetterie et programme d'une salle de 220 places, pensés d'abord pour le téléphone."],
  ["aubade", "Aubade", "Édition", "Festival Premières Lueurs", 2024, "Programme imprimé, affiches et signalétique pour un festival de musique de chambre."],
  ["comptine", "Comptine", "Packaging", "Biscuiterie Lamy", 2024, "Boîtes de biscuits illustrées et coffret de fin d'année en série limitée."],
];
const TYPES = [...new Set(PROJ.map((p) => p[2]))];
const tk = (t) => t.toLowerCase().replace(/[^a-z]/g, "");
const SERV = [["Identité", "Logo, couleurs, typographie et règles d'usage : une base claire pour tout ce que vous publierez ensuite.", "M4 20L12 4l8 16z"], ["Sites web", "Des sites rapides, lisibles et faciles à mettre à jour, conçus pour le téléphone avant l'ordinateur.", "M3 5h18v14H3zM3 9h18"], ["Édition", "Livres, programmes, rapports : de la maquette au fichier d'impression, avec suivi chez l'imprimeur.", "M5 4h11l3 3v13H5zM8 10h8M8 14h8"], ["Packaging", "Étiquettes et emballages pensés pour être fabriqués : gabarits, nuanciers, essais.", "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"]];
const STEPS = [["Écoute", "Un atelier d'une demi-journée pour comprendre votre activité, vos clients et vos contraintes."], ["Piste", "Trois directions courtes, présentées avec des exemples d'usage réels, pas des maquettes abstraites."], ["Fabrication", "Vous choisissez, nous construisons : fichiers, site, impressions, avec des points d'étape toutes les deux semaines."], ["Passation", "Livraison d'un guide d'usage et d'une formation d'une heure. Vous restez autonome."]];
const AVIS = [["Nous avons enfin des emballages qui ressemblent à ce que nous faisons. Les ventes de la gamme ont progressé de 18 % sur l'automne.", "Claire Lamy", "Biscuiterie Lamy"], ["Le site s'est mis en ligne un mardi, la billetterie a vendu 140 places le jeudi. Tout était déjà prévu.", "Mathieu Perrin", "Théâtre de la Lanterne"], ["Un studio qui écoute, qui dit non quand il le faut, et qui livre à la date promise. Rare.", "Anaïs Guillot", "Voiles de l'Ouest"]];
const PLANS = [["Essentiel", "1 900 €", "Pour démarrer", ["Logo et palette", "Guide d'usage de 8 pages", "Deux allers-retours", "Livraison en 3 semaines"], false], ["Studio", "4 800 €", "Le plus choisi", ["Identité complète", "Site de 5 pages", "Formation d'une heure", "Livraison en 8 semaines"], true], ["Sur mesure", "dès 9 500 €", "Pour un projet d'envergure", ["Identité, site et édition", "Atelier de lancement", "Suivi sur six mois", "Calendrier partagé"], false]];
const FAQ = [["Combien de temps dure un projet ?", "De trois à douze semaines selon l'ampleur. Le calendrier est fixé au départ et partagé avec vous."], ["Travaillez-vous à distance ?", "Oui, pour plus de la moitié des projets. Les ateliers de lancement se font de préférence sur place."], ["Qui possède les fichiers ?", "Vous. À la livraison, tous les fichiers sources et les polices libres vous sont remis."], ["Pouvez-vous reprendre un site existant ?", "Oui, après un audit d'une demi-journée qui dit honnêtement ce qui vaut la peine d'être gardé."]];

const ic = (d) => `<svg class="df-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const aurora = (cls = "") => `<svg class="df-aur ${cls}" viewBox="0 0 400 300" aria-hidden="true"><circle cx="200" cy="300" r="250" fill="none" stroke="currentColor" stroke-width="2" opacity=".25"/><circle cx="200" cy="300" r="200" fill="none" stroke="currentColor" stroke-width="3" opacity=".4"/><circle cx="200" cy="300" r="150" fill="none" stroke="currentColor" stroke-width="5" opacity=".6"/><circle cx="200" cy="300" r="100" fill="currentColor" opacity=".9"/></svg>`;
const thumb = (p, i) => `<span class="df-th df-th${i % 5}" aria-hidden="true"><b>${esc(p[1])}</b></span>`;
const pcard = (p, i) => `<article class="df-pc" data-t="${tk(p[2])}"><a href="/projet"><span class="df-pc-a">${thumb(p, i)}</span><span class="df-pc-b"><span class="df-tag">${esc(p[2])}</span><h3 class="df-pc-t">${esc(p[1])}</h3><span class="df-pc-x">${esc(p[3])} · ${p[4]}</span></span></a></article>`;
const sech = (n, kick, title, lead) => `<div class="df-sh"><span class="df-num" aria-hidden="true">0${n}</span><div><p class="df-kick">${esc(kick)}</p><h2 class="df-h2">${title}</h2>${lead ? `<p class="df-lead">${esc(lead)}</p>` : ""}</div></div>`;

const header = (c) => `<header class="df-head pk-bleed"><div class="df-prog" aria-hidden="true"><i data-prog></i></div><div class="df-wrap df-head-in">
<a class="df-logo" href="/" aria-label="${esc(c.brand)} — accueil"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="26" r="20" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="16" cy="26" r="12" fill="currentColor"/></svg><span>${esc(c.brand)}</span></a>
<div class="df-nav" role="navigation" aria-label="Sections de la page">${SECS.slice(0, 6).map(([k, n]) => `<a href="/#${k}" data-go="${k}">${n}</a>`).join("")}<a href="/realisations">Réalisations</a></div>
<a class="df-cta" href="/#contact" data-go="contact">Parler de mon projet</a>
<details class="df-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="df-drawer" role="navigation" aria-label="Menu mobile">${SECS.map(([k, n]) => `<a href="/#${k}" data-go="${k}">${n}</a>`).join("")}<a href="/realisations">Toutes les réalisations</a></div></details></div></header>
<div class="df-rail" role="navigation" aria-label="Progression dans la page">${SECS.map(([k, n], i) => `<a href="/#${k}" data-go="${k}" data-rail="${k}"><i></i><span>${n}</span></a>`).join("")}</div>`;

const footer = (c) => `<footer class="df-foot pk-bleed"><div class="df-wrap df-foot-in"><div class="df-foot-b"><div class="df-foot-logo">${esc(c.brand)}</div><p>Studio de design indépendant : identité, sites, édition et packaging. Studio, clients et chiffres fictifs, pour la démonstration.</p></div>
<div class="df-foot-c"><h2>Sections</h2>${SECS.slice(0, 5).map(([k, n]) => `<a href="/#${k}" data-go="${k}">${n}</a>`).join("")}</div>
<div class="df-foot-c"><h2>Pages</h2><a href="/realisations">Réalisations</a><a href="/tarifs">Tarifs détaillés</a><a href="/recherche">Recherche</a><a href="/blocs">Éléments de page</a></div>
<div class="df-foot-c"><h2>Informations</h2><a href="/contact">Contact</a><a href="/mentions">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div></div>
<p class="df-legal">© ${esc(c.brand)} — site de démonstration. Personnes, projets, tarifs et chiffres sont fictifs.</p></footer>`;

const pagehead = (kick, title, sub, crumb) => sec(`<section class="df-ph pk-bleed"><div class="df-wrap df-ph-in"><div><p class="df-crumb"><a href="/">Accueil</a> <span aria-hidden="true">/</span> ${esc(crumb || kick)}</p><p class="df-kick">${esc(kick)}</p><div class="df-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="df-lead">${esc(sub)}</p>` : ""}</div>${aurora("df-ph-aur")}</div></section>`);

const home = (c) => [
  sec(header(c)),
  sec(`<section class="df-hero pk-bleed" data-sec="debut"><div class="df-wrap df-hero-in"><div><p class="df-kick">Studio de design · Rennes</p><div class="df-h1" role="heading" aria-level="1">Des marques et des sites qui se lisent <em>d'un seul trait</em>.</div><p class="df-lead">Studio Boréal accompagne les petites entreprises et les lieux culturels : une identité claire, un site rapide, des imprimés soignés. Descendez : tout tient sur cette page.</p><p><a class="df-btn" href="/#projets" data-go="projets">Voir les projets</a> <a class="df-btn df-btn--o" href="/#methode" data-go="methode">Notre méthode</a></p></div>${aurora("df-hero-aur")}</div><a class="df-scroll" href="/#apropos" data-go="apropos" aria-label="Aller à la section À propos"><span>Défiler</span><i></i></a></section>`),
  sec(`<section class="df-s pk-bleed" data-sec="apropos"><div class="df-wrap">${sech(1, "À propos", "Quatre personnes, une table, beaucoup de papier.", "")}<div class="df-2"><div class="df-prose"><p>Le studio est né en 2016 dans un atelier partagé de Rennes. Nous sommes quatre : une directrice artistique, un développeur, une éditrice et un chargé de production. Chacun suit les projets de la première réunion à la livraison.</p><p>Nous disons non aux projets que nous ne saurions pas bien faire, et nous préférons dix clients fidèles à cent clients de passage.</p></div><dl class="df-stats"><div><dt>Projets livrés</dt><dd><b data-count="212">212</b></dd></div><div><dt>Années d'activité</dt><dd><b data-count="10">10</b></dd></div><div><dt>Clients fidèles</dt><dd><b data-count="38">38</b></dd></div></dl></div></div></section>`),
  sec(`<section class="df-s df-s--t pk-bleed" data-sec="services"><div class="df-wrap">${sech(2, "Services", "Ce que nous faisons, et rien d'autre.", "")}<div class="df-srv">${SERV.map(([t, x, d]) => `<article class="df-sv">${ic(d)}<h3 class="df-h3">${t}</h3><p>${esc(x)}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="df-s pk-bleed" data-sec="methode"><div class="df-wrap">${sech(3, "Méthode", "Quatre étapes, un calendrier partagé.", "")}<ol class="df-steps">${STEPS.map(([t, x], i) => `<li><span class="df-step-n" aria-hidden="true">${i + 1}</span><h3 class="df-h3">${t}</h3><p>${esc(x)}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="df-s df-s--t pk-bleed" data-sec="projets"><div class="df-wrap">${sech(4, "Projets", "Six réalisations récentes.", "")}<div class="df-pg">${PROJ.slice(0, 6).map(pcard).join("")}</div><p class="df-center"><a class="df-btn df-btn--o" href="/realisations">Toutes les réalisations</a></p></div></section>`),
  sec(`<section class="df-s pk-bleed" data-sec="avis"><div class="df-wrap">${sech(5, "Avis", "Ce que disent nos clients.", "")}<div class="df-av">${AVIS.map(([q, n, o]) => `<figure class="df-q"><blockquote><p>« ${esc(q)} »</p></blockquote><figcaption><b>${esc(n)}</b><span>${esc(o)}</span></figcaption></figure>`).join("")}</div></div></section>`),
  sec(`<section class="df-s df-s--t pk-bleed" data-sec="tarifs"><div class="df-wrap">${sech(6, "Tarifs", "Trois formules, des prix affichés.", "Hors taxes. Un devis détaillé est remis après l'atelier d'écoute.")}<div class="df-pl">${PLANS.map(([n, p, s, l, hot]) => `<article class="df-plan${hot ? " df-plan--hot" : ""}"><p class="df-kick">${esc(s)}</p><h3 class="df-h3">${n}</h3><p class="df-price">${p}</p><ul>${l.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><a class="df-btn${hot ? "" : " df-btn--o"}" href="/#contact" data-go="contact">Choisir ${n}</a></article>`).join("")}</div><p class="df-center"><a class="df-more" href="/tarifs">Comparer en détail et lire la FAQ →</a></p></div></section>`),
  sec(`<section class="df-s df-contact pk-bleed" data-sec="contact"><div class="df-wrap">${sech(7, "Contact", "Parlons de votre projet.", "Décrivez-le en quelques lignes : nous répondons sous deux jours ouvrés.")}</div></section>`),
  { type: "form", heading: "Votre message", intro: "La démonstration n'envoie rien à un vrai studio, mais le formulaire fonctionne comme sur un vrai site." },
  sec(footer(c)),
];

const realisations = (c) => [
  sec(header(c)),
  pagehead("Réalisations", "Huit projets, quatre métiers", "Filtrez par type de travail.", "Réalisations"),
  sec(`<section class="df-s pk-bleed" data-works><div class="df-wrap"><div class="df-chips" role="group" aria-label="Type de projet"><a class="df-chip is-on" href="#type-all" role="button" data-v="all" aria-pressed="true">Tous</a>${TYPES.map((t) => `<a class="df-chip" href="#type-${tk(t)}" role="button" data-v="${tk(t)}" aria-pressed="false">${t}</a>`).join("")}</div><p class="df-count" role="status"><b data-n>8</b> projet(s)</p><div class="df-pg df-pg--l" data-grid>${PROJ.map(pcard).join("")}</div><p class="df-empty" data-empty>Aucun projet de ce type.</p></div></section>`),
  sec(footer(c)),
];

const projet = (c) => {
  const p = PROJ[0];
  return [
    sec(header(c)),
    pagehead("Étude de cas · Identité", p[1], p[5], "Réalisations"),
    sec(`<section class="df-s pk-bleed"><div class="df-wrap df-case"><div class="df-case-m"><dl><dt>Client</dt><dd>${esc(p[3])}</dd><dt>Année</dt><dd>${p[4]}</dd><dt>Durée</dt><dd>7 semaines</dd><dt>Livrables</dt><dd>Logo, enseigne, emballages, guide d'usage</dd></dl></div>
<div class="df-prose"><span class="df-th df-th1 df-th--big" aria-hidden="true"><b>${esc(p[1])}</b></span><h2>Le point de départ</h2><p>La poissonnerie du Grand Bleu tient son étal depuis trois générations. Son enseigne, repeinte tant de fois, avait perdu son lisibilité, et les emballages n'existaient pas : le poisson partait dans du papier gris.</p><h2>Notre réponse</h2><p>Nous avons dessiné un signe simple, une vague en deux courbes, qui se lit de loin comme de près. Deux couleurs seulement, un bleu de marée et un blanc d'écume, pour que l'impression reste économique.</p><blockquote class="df-quote"><p>« Les clients nous disent que l'étal a l'air plus frais. Il n'a pourtant pas changé de fournisseur. »</p><cite>Gérant, Poissonnerie Le Grand Bleu</cite></blockquote><h2>Résultats</h2><ul><li>Emballages papier alimentaire en deux couleurs, 12 000 pièces livrées.</li><li>Enseigne lumineuse fabriquée localement.</li><li>Fréquentation de l'étal en hausse de 14 % au premier trimestre.</li></ul><p><a class="df-btn" href="/#contact" data-go="contact">Discuter d'un projet voisin</a> <a class="df-btn df-btn--o" href="/realisations">Autres réalisations</a></p></div></div></section>`),
    sec(footer(c)),
  ];
};

const tarifs = (c) => [
  sec(header(c)),
  pagehead("Tarifs", "Les formules en détail", "Ce qui est compris, ce qui ne l'est pas, et les questions que l'on nous pose le plus.", "Tarifs"),
  sec(`<section class="df-s pk-bleed"><div class="df-wrap"><div class="df-scroll-t" data-scroll><table class="df-tab"><caption>Comparatif des formules (prix hors taxes)</caption><thead><tr><th scope="col">Compris</th><th scope="col">Essentiel</th><th scope="col">Studio</th><th scope="col">Sur mesure</th></tr></thead><tbody><tr><th scope="row">Prix</th><td>1 900 €</td><td>4 800 €</td><td>dès 9 500 €</td></tr><tr><th scope="row">Logo et palette</th><td>Oui</td><td>Oui</td><td>Oui</td></tr><tr><th scope="row">Guide d'usage</th><td>8 pages</td><td>24 pages</td><td>Sur mesure</td></tr><tr><th scope="row">Site web</th><td>Non</td><td>5 pages</td><td>Jusqu'à 20 pages</td></tr><tr><th scope="row">Édition ou packaging</th><td>Non</td><td>Non</td><td>Oui</td></tr><tr><th scope="row">Formation</th><td>Non</td><td>1 heure</td><td>3 heures</td></tr><tr><th scope="row">Délai</th><td>3 semaines</td><td>8 semaines</td><td>12 semaines</td></tr></tbody></table></div>
<h2 class="df-h2 df-mt">Questions fréquentes</h2><div class="df-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div><p class="df-center"><a class="df-btn" href="/#contact" data-go="contact">Demander un devis</a></p></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Écrivez-nous", "Un projet, une question, une simple envie de discuter : le plus simple est de nous écrire.", "Contact"),
  { type: "form", heading: "Votre message", intro: "La démonstration n'envoie rien à un vrai studio, mais le formulaire fonctionne comme sur un vrai site." },
  sec(`<section class="df-s df-s--t pk-bleed"><div class="df-wrap df-3"><div><h2 class="df-h3">Atelier</h2><address>Studio Boréal<br>14 rue de la Monnaie<br>35000 Rennes<br><small>Adresse fictive</small></address></div><div><h2 class="df-h3">Écrire</h2><p><a href="mailto:bonjour@studio-boreal.example">bonjour@studio-boreal.example</a></p></div><div><h2 class="df-h3">Horaires</h2><p>Du lundi au jeudi, 9 h – 18 h. Rendez-vous le vendredi sur demande.</p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher sur le site", "Un mot, un projet, un service.", "Recherche"),
  { type: "layout", children: [{ type: "search", props: { target: "catalogue", placeholder: "Rechercher…" } }] },
  sec(`<section class="df-s pk-bleed"><div class="df-wrap"><div class="df-nores"><h2 class="df-h3">Aucun résultat ?</h2><p>Essayez un mot plus simple, ou parcourez le récit de la page d'accueil : tout y est, de haut en bas.</p><p><a class="df-btn" href="/">Retour au récit</a> <a class="df-btn df-btn--o" href="/realisations">Voir les projets</a> <a class="df-btn df-btn--o" href="/tarifs">Voir les tarifs</a></p></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="df-404 pk-bleed"><div class="df-wrap df-404-in">${aurora("df-404-aur")}<div><p class="df-kick">Erreur 404</p><div class="df-h1" role="heading" aria-level="1">Vous avez dépassé la fin du défilé.</div><p class="df-lead">Cette page n'existe pas ou plus. Remontez : le récit complet est à l'accueil.</p><p><a class="df-btn" href="/">Remonter au début</a> <a class="df-btn df-btn--o" href="/realisations">Les réalisations</a> <a class="df-btn df-btn--o" href="/recherche">Rechercher</a></p></div></div></section>`),
  sec(footer(c)),
];
const legal = (title, crumb, html) => (c) => [sec(header(c)), pagehead("Informations légales", title, "", crumb), sec(`<section class="df-s pk-bleed"><div class="df-wrap"><div class="df-prose">${html}</div></div></section>`), sec(footer(c))];
const mentions = legal("Mentions légales", "Mentions légales", `<h2>Éditeur</h2><p>Ce site est une démonstration du thème « Défilé ». Aucun studio réel ne l'exploite. Remplacez ces mentions par votre dénomination, votre statut, votre adresse, votre numéro d'immatriculation et le nom du responsable de publication.</p><h2>Hébergement</h2><p>Indiquez le nom et l'adresse de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les projets, textes et visuels de cette démonstration sont fictifs.</p><h2>Contact</h2><p>Utilisez la <a href="/contact">page de contact</a>.</p>`);
const confidentialite = legal("Politique de confidentialité", "Confidentialité", `<h2>Données traitées</h2><p>Le formulaire recueille votre nom, votre adresse électronique et votre message pour répondre à votre demande. Dans cette démonstration, rien n'est transmis.</p><h2>Traceurs</h2><p>Le thème n'ajoute aucun traceur. Le script ne garde que l'état d'affichage de la page, dans la page.</p><h2>Vos droits</h2><p>Accès, rectification, suppression : écrivez depuis la <a href="/contact">page de contact</a>.</p><h2>Durée</h2><p>Messages conservés douze mois au plus (exemple à adapter).</p>`);
const blocs = (c) => [
  sec(header(c)),
  pagehead("Guide de mise en page", "Éléments de mise en page", "Titres, listes, citations, tableaux, code, boutons et colonnes du thème.", "Éléments"),
  sec(`<section class="df-s pk-bleed"><div class="df-wrap"><div class="df-prose">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec un <a href="/realisations">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, du <mark>surligné</mark> et du <code>code en ligne</code>. La ligne reste entre soixante et quatre-vingts caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li><li>Troisième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote class="df-quote"><p>« Une citation en grand, avec son filet violet. »</p><cite>Anaïs Guillot</cite></blockquote>
<figure class="df-fig"><span class="df-th df-th3 df-th--big" aria-hidden="true"><b>Image</b></span><figcaption>Une image avec sa légende.</figcaption></figure>
<div class="df-scroll-t" data-scroll><table class="df-tab"><caption>Projets par type</caption><thead><tr><th scope="col">Type</th><th scope="col">Projets</th><th scope="col">Délai moyen</th></tr></thead><tbody>${TYPES.map((t, i) => `<tr><th scope="row">${t}</th><td>${PROJ.filter((p) => p[2] === t).length}</td><td>${5 + i * 2} semaines</td></tr>`).join("")}</tbody></table></div>
<pre><code>.section { scroll-margin-top: 80px; }</code></pre>
<p><a class="df-btn" href="/contact">Bouton plein</a> <a class="df-btn df-btn--o" href="/realisations">Bouton contour</a></p>
<div class="df-3"><div><h3>Colonne un</h3><p>Trois colonnes sur grand écran.</p></div><div><h3>Colonne deux</h3><p>Deux sur tablette.</p></div><div><h3>Colonne trois</h3><p>Une sur mobile.</p></div></div>
<aside class="df-box"><p><b>Encadré.</b> Une information détachée du texte courant.</p></aside></div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "defile", name: "Défilé", version: "1.0.0", category: "agence", tags: ["moderne", "geometrique"], siteType: "One-page polyvalent", collection: "pro",
  concept: "Un récit continu sur une seule page : sections numérotées 01 à 07, rampe de points qui suit la section active, barre de progression et arcs boréaux dessinés ; quelques pages annexes pour les projets et les tarifs.",
  description: "One-page polyvalent en violet profond : sections numérotées, rampe d'ancres avec section active, progression de lecture, projets filtrables, avis, tarifs et FAQ. Pages annexes incluses.",
  brand: "Studio Boréal", modules: ["formulaires", "recherche"],
  dna: {
    hero: "titre-typographique-avec-mot-en-italique-et-arcs-boreaux-concentriques",
    header: "barre-transparente-d-ancres-avec-bouton-et-rampe-de-points-fixe-a-droite",
    grid: "sections-pleine-largeur-numerotees-avec-grand-chiffre-a-gauche-du-titre",
    typo: "funnel-display-et-rethink-sans",
    shapes: "grands-arrondis-pilules-cercles-concentriques-et-vignettes-a-motifs-geometriques",
    motion: "section-active-par-observation-barre-de-progression-et-compteurs-au-premier-affichage",
    rhythm: "recit-continu-en-sept-sections-alternant-lavande-et-blanc",
    signature: "rampe-d-ancres-avec-section-active-et-defilement-doux-pose-par-le-script-sur-des-attributs-data",
    palette: "blanc-lavande-violet-profond-et-orange-vif-d-accent",
    image: "vignettes-typographiques-a-motifs-css-et-arcs-svg",
    list: "grille-mosaique-ou-lignes-de-projets-au-choix",
    article: "etude-de-cas-a-fiche-technique-laterale-ou-en-bandeau",
    sidebar: "fiche-client-collante-a-gauche-de-l-etude-de-cas",
    reading: "colonne-de-66-caracteres-sans-serif-17-px-interligne-1-7",
  },
  tokens: {
    colors: { primary: "#5f3dc4", secondary: "#241a4d", accent: "#f76707", background: "#f8f6ff", surface: "#ffffff", text: "#1f1840", muted: "#554f78", success: "#2b7a3b", warning: "#8a5a00", error: "#b42318" },
    fonts: { heading: "font.funnel-display", body: "font.rethink-sans", button: "font.rethink-sans", link: "font.rethink-sans" },
    radius: { sm: 10, md: 18, lg: 28, button: 99, field: 14, card: 24 }, shadow: { card: "0 12px 30px -18px rgba(95,61,196,.45)", button: "none" }, border: { width: 1, color: "#d9d2f4" },
    type: { h1: { size: 64, weight: 600, lineHeight: 1.05, transform: "none" }, h2: { size: 40, weight: 600, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur principale (violet)", type: "color", default: "#5f3dc4" },
    { key: "entete", label: "En-tête", type: "choice", default: "barre", choices: [["barre", "Barre d'ancres collante"], ["centre", "Logo centré, ancres dessous"], ["flottant", "Pilule flottante"]] },
    { key: "liste", label: "Liste des réalisations", type: "choice", default: "grille", choices: [["grille", "Grille de trois colonnes"], ["mosaique", "Mosaïque à une vignette large"], ["lignes", "Lignes avec vignette à gauche"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "grand", choices: [["grand", "Quatre colonnes"], ["mince", "Une ligne"]] },
    { key: "projet", label: "Étude de cas", type: "choice", default: "marge", choices: [["marge", "Fiche technique à gauche"], ["bandeau", "Fiche en bandeau au-dessus"]] },
    { key: "rampe", label: "Rampe de points à droite", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "clair", choices: [["clair", "Lavande clair"], ["sombre", "Nuit violette"]] },
  ],
  menu: [["Accueil", "/"], ["Réalisations", "/realisations"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil (récit en une page)", render: home }, { key: "realisations", name: "Réalisations", render: realisations }, { key: "projet", name: "Étude de cas", render: projet },
    { key: "tarifs", name: "Tarifs et questions", render: tarifs }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche },
    { key: "introuvable", name: "Page introuvable", render: introuvable }, { key: "mentions", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite },
    { key: "blocs", name: "Éléments de mise en page", render: blocs },
  ],
};
