// Recueil — services funéraires. Direction artistique : silence et dignité. Gris-pierre chaud, encre anthracite, un seul accent sauge éteint, serif de lecture ample,
// filets fins, une branche d'olivier en trait. Hero = texte seul. Composant signature : avis de décès (recherche, fiche, plan) et espace de condoléances (message préparé vers /contact, bougie symbolique).
const { sec, esc, nav } = require("../kit");

const NUM = "0 800 000 000";
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const fr = (iso, jour) => { const [y, m, d] = iso.split("-").map(Number); const dt = new Date(Date.UTC(y, m - 1, d)); return `${jour ? JOURS[dt.getUTCDay()] + " " : ""}${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
const num = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y} ${d}/${m}`; };

const AVIS = [
  { s: "henri-delaunay", nom: "Henri Delaunay", age: 84, ville: "Valmorin", deces: "2026-11-01", cer: "Cérémonie religieuse", date: "2026-11-07", h: "14&nbsp;h&nbsp;30", lieu: "Église Saint-Martin", adr: "Place de l'Église, Valmorin", suite: "Inhumation au cimetière communal, dans l'intimité.", msgs: 14, bou: 31, mot: "Il aimait ses tilleuls, ses livres et le silence du matin.", ex: [["Élise", "Une pensée pour vous tous. Il me parlait de son jardin avec tant de tendresse."], ["Un voisin", "Merci pour toutes ces années de bonjour par-dessus la haie."]] },
  { s: "marguerite-lenoir", nom: "Marguerite Lenoir", age: 91, ville: "Rochebrune", deces: "2026-10-30", cer: "Cérémonie civile", date: "2026-11-05", h: "10&nbsp;h&nbsp;00", lieu: "Salle de recueillement, Maison Valcour", adr: "12 rue des Acacias, Rochebrune", suite: "Crémation, suivie d'un temps de partage avec les proches.", msgs: 22, bou: 47, mot: "Institutrice pendant quarante ans, elle a appris à lire à trois générations.", ex: [["Claire", "Elle m'a appris mes premières lettres. Je ne l'oublierai jamais."], ["Ancienne élève", "Avec toute mon affection pour sa famille."]] },
  { s: "paul-ferrand", nom: "Paul Ferrand", age: 67, ville: "Saint-Aubin", deces: "2026-11-02", cer: "Hommage civil", date: "2026-11-09", h: "11&nbsp;h&nbsp;00", lieu: "Crématorium de Saint-Aubin", adr: "Chemin des Pins, Saint-Aubin", suite: "La famille remercie de ne pas envoyer de fleurs.", msgs: 9, bou: 18, mot: "Menuisier de métier, il laisse derrière lui des escaliers et des souvenirs.", ex: [["Julien", "Cher Paul, merci pour tout ce que tu m'as transmis à l'atelier."], ["Collègue", "Nos pensées accompagnent ta famille."]] },
  { s: "odette-marchand", nom: "Odette Marchand", age: 88, ville: "Valmorin", deces: "2026-11-03", cer: "Cérémonie religieuse", date: "2026-11-10", h: "15&nbsp;h&nbsp;00", lieu: "Église Saint-Martin", adr: "Place de l'Église, Valmorin", suite: "Inhumation au cimetière communal de Valmorin.", msgs: 6, bou: 12, mot: "Une voix douce, un tablier fleuri, une table toujours ouverte.", ex: [["Marie", "Merci pour vos confitures et vos sourires, Odette."], ["Famille proche", "Nous pensons très fort à vous."]] },
  { s: "jean-vasseur", nom: "Jean Vasseur", age: 79, ville: "Clairval", deces: "2026-10-28", cer: "Cérémonie civile", date: "2026-11-04", h: "09&nbsp;h&nbsp;30", lieu: "Salle des adieux, Clairval", adr: "3 avenue du Parc, Clairval", suite: "Inhumation au cimetière de Clairval.", msgs: 17, bou: 26, mot: "Marin d'eau douce et conteur, il savait faire rire dans les heures sombres.", ex: [["Thomas", "Un grand bonhomme. Il nous manquera à tous."], ["Club de pêche", "Avec toute notre sympathie."]] },
  { s: "lucie-aubanel", nom: "Lucie Aubanel", age: 73, ville: "Rochebrune", deces: "2026-11-04", cer: "Cérémonie religieuse", date: "2026-11-12", h: "14&nbsp;h&nbsp;00", lieu: "Chapelle Sainte-Anne", adr: "Rue de la Chapelle, Rochebrune", suite: "Inhumation au cimetière de Rochebrune.", msgs: 4, bou: 9, mot: "Elle chantait à la chorale chaque dimanche, et la rue entière l'entendait.", ex: [["Une amie", "Ta voix reste avec nous, Lucie."], ["Chorale", "Nous chanterons pour toi."]] },
];
const VILLES = [...new Set(AVIS.map((a) => a.ville))].sort();
const sorted = AVIS.slice().sort((a, b) => b.date.localeCompare(a.date));

const branch = (cls = "") => `<svg class="rc-branch ${cls}" viewBox="0 0 160 44" width="160" height="44" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 32C40 30 90 26 154 12"/><g id="l"><path d="M30 31c3-9 10-12 17-12-1 8-8 13-17 12z"/><path d="M62 29c3-9 10-12 17-12-1 8-8 13-17 12z" transform="translate(0 0)"/><path d="M98 25c3-9 10-12 17-12-1 8-8 13-17 12z"/><path d="M126 20c3-9 10-12 17-12-1 8-8 13-17 12z"/><path d="M44 33c-1 8 4 12 11 12 1-8-4-12-11-12z"/><path d="M80 30c-1 8 4 12 11 12 1-8-4-12-11-12z"/><path d="M114 25c-1 8 4 12 11 12 1-8-4-12-11-12z"/></g></g></svg>`.replace(' id="l"', "");
const leaf = `<svg class="rc-leaf" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19 14 10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const rule = `<div class="rc-rule" aria-hidden="true"><span></span>${leaf}<span></span></div>`;

const header = (c) => `<header class="rc-head pk-bleed"><div class="rc-bar"><a class="rc-logo" href="/" aria-label="${esc(c.brand)}, accueil">${leaf}<span class="rc-logo-t"><b>Maison Valcour</b><small>Services funéraires</small></span></a>
<div class="rc-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div><p class="rc-bar-tel"><small>Écoute 24 h/24</small><b>${NUM}</b></p>
<details class="rc-burger"><summary><span>Menu</span></summary><div class="rc-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<p class="rc-bar-tel rc-bar-tel--m"><small>Écoute 24 h/24</small><b>${NUM}</b></p></div></details></div></header>`;

const footer = (c) => `<footer class="rc-foot pk-bleed"><div class="rc-foot-in"><div class="rc-foot-brand">${branch("rc-branch--s")}<p class="rc-foot-name">Maison Valcour</p><p>Services funéraires · obsèques, prévoyance, marbrerie.</p><address>12 rue des Acacias<br>Rochebrune</address></div>
<div><h2 class="rc-foot-h">Nous trouver</h2>${nav(c.menu.slice(1), "rc-fl")}<a class="rc-fl" href="/recherche">Recherche</a></div>
<div><h2 class="rc-foot-h">À tout moment</h2><p class="rc-foot-tel">${NUM}</p><p class="rc-foot-s">Écoute et permanence 24 h/24, 7 j/7. Appel gratuit.</p><a class="rc-fl" href="/contact">Nous contacter</a></div></div>
<p class="rc-legal">© Maison Valcour — site de démonstration. Numéro de téléphone, noms, avis, lieux et messages entièrement fictifs.</p></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="rc-ph pk-bleed"><div class="rc-col rc-center"><p class="rc-kicker" data-reveal>${esc(kicker)}</p><div class="rc-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="rc-sub" data-reveal>${esc(sub)}</p>` : ""}${branch()}</div></section>`);

const avItem = (a) => `<li class="rc-av" data-ville="${esc(a.ville)}" data-search="${esc(`${a.nom} ${a.ville} ${fr(a.deces)} ${fr(a.date, true)} ${num(a.deces)} ${num(a.date)} ${a.lieu}`)}"><article><div class="rc-av-main"><h3 class="rc-av-nom"><a href="/fiche#${a.s}">${esc(a.nom)}</a></h3><p class="rc-av-meta">${a.age} ans · ${esc(a.ville)} · décédé(e) le <time datetime="${a.deces}">${fr(a.deces)}</time></p><p class="rc-av-cer">${esc(a.cer)} le <time datetime="${a.date}">${fr(a.date, true)}</time> à ${a.h}<br>${esc(a.lieu)}</p><p class="rc-demo">Avis fictif, démonstration</p></div>
<a class="rc-av-lien" href="/fiche#${a.s}">Lire l'avis et écrire un message<span class="rc-sr"> pour ${esc(a.nom)}</span></a></article></li>`;

const plan = (i) => `<svg class="rc-plan" viewBox="0 0 320 180" role="img" aria-label="Plan schématique : le lieu de la cérémonie, à proximité de deux rues et d'une rivière" focusable="false"><title>Plan schématique du lieu</title><rect width="320" height="180" fill="none"/><g fill="none" stroke="currentColor" stroke-width="1" opacity=".55"><path d="M${-10 + i * 6} 120C80 100 150 150 330 ${110 - i * 4}"/><path d="M0 60H320M${70 + i * 12} 0V180M${230 - i * 8} 0V180M0 150H320"/><rect x="${96 + i * 12}" y="72" width="62" height="42" opacity=".7"/><rect x="${240 - i * 8}" y="16" width="52" height="34" opacity=".5"/></g><g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="${127 + i * 12}" cy="93" r="9"/><path d="M${127 + i * 12} 84v18M${118 + i * 12} 93h18"/></g></svg>`;

const fiche = (a, i) => sec(`<section class="rc-fiche pk-bleed" data-av="${a.s}"><div class="rc-col"><article aria-label="Avis de décès de ${esc(a.nom)}" class="rc-card">
<p class="rc-kicker">Avis de décès · <time datetime="${a.deces}">${fr(a.deces)}</time></p><h2 class="rc-fnom">${esc(a.nom)}</h2><p class="rc-fage">${a.age} ans · ${esc(a.ville)}</p>${branch("rc-branch--s")}
<p class="rc-fmot">${esc(a.mot)}</p><p class="rc-ftxt">Sa famille a la profonde tristesse de vous faire part de son décès et vous invite à se recueillir et à l'accompagner lors de la cérémonie.</p>
<h3 class="rc-h3">La cérémonie</h3><dl class="rc-dl"><div><dt>Cérémonie</dt><dd>${esc(a.cer)}</dd></div><div><dt>Date</dt><dd><time datetime="${a.date}">${fr(a.date, true)}</time></dd></div><div><dt>Horaire</dt><dd>${a.h}</dd></div><div><dt>Lieu</dt><dd>${esc(a.lieu)}</dd></div><div><dt>Adresse</dt><dd>${esc(a.adr)}</dd></div><div><dt>Ensuite</dt><dd>${esc(a.suite)}</dd></div></dl>
<h3 class="rc-h3">Plan d'accès</h3><figure class="rc-fig">${plan(i)}<figcaption>Schéma indicatif. <a href="https://www.openstreetmap.org/search?query=${encodeURIComponent(a.adr).replace(/'/g, "%27")}">Ouvrir l'adresse dans une carte</a></figcaption></figure>
<h3 class="rc-h3">Espace de condoléances</h3><p class="rc-cnt" aria-live="polite"><span><b data-rc-n="msgs">${a.msgs}</b> messages</span><span><b data-rc-n="bou">${a.bou}</b> bougies allumées</span></p>
<div class="rc-candle" data-rc-candle data-av="${a.s}"></div>
<ul class="rc-msgs">${a.ex.map(([n, t]) => `<li><blockquote><p>${esc(t)}</p><footer>${esc(n)} <small>message d'exemple, démonstration</small></footer></blockquote></li>`).join("")}</ul>
<div class="rc-compose" data-rc-compose data-av="${a.s}" data-nom="${esc(a.nom)}"><p class="rc-note">Pour laisser un message, activez JavaScript ou écrivez-nous depuis la <a href="/contact">page Contact</a>.</p></div>
</article></div></section>`);

const SERVICES = [
  ["01", "Organisation d'obsèques", "Nous vous accompagnons de la première heure jusqu'au dernier hommage, en respectant les volontés de la personne et le rythme de la famille.", ["Prise en charge et soins de présentation", "Choix de la cérémonie : religieuse, civile ou laïque", "Démarches administratives et avis de décès", "Transport, salon de recueillement, crémation ou inhumation"]],
  ["02", "Prévoyance obsèques", "Préparer à l'avance, c'est épargner des décisions difficiles à ceux qui restent. Nous prenons le temps d'écouter vos souhaits et de les consigner.", ["Entretien confidentiel, sans engagement", "Volontés écrites : cérémonie, musique, lieu", "Documents remis et conservés avec soin", "Révisables à tout moment"]],
  ["03", "Marbrerie funéraire", "Monuments, plaques, gravures et entretien des sépultures : un travail de pierre, patient et soigné, réalisé avec des artisans de la région.", ["Choix des pierres, des finitions et des inscriptions", "Pose, rénovation et nettoyage", "Fleurissement et entretien régulier", "Plaque de souvenir pour les lieux de dispersion"]],
];
const ETAPES = [["Premier contact", "Un conseiller vous répond à toute heure et fixe un rendez-vous, chez vous ou à l'agence."], ["Organisation", "Choix du lieu, des horaires, des textes et de la musique, avec vous."], ["Cérémonie", "Un maître de cérémonie veille au déroulement dans le calme."], ["Après", "Démarches restantes, entretien de la sépulture, suivi des proches."]];

const GUIDE = [
  ["Dans les 24 heures", [["Faire constater le décès", "Un médecin établit le certificat de décès. À domicile, appelez le médecin traitant ou le service des urgences."], ["Prévenir la famille proche", "Informez les proches avant de publier un avis, pour qu'ils l'apprennent de vous."], ["Nous appeler", "Nous prenons le relais pour la mise en bière, le transport et le choix de la date : " + NUM + " (numéro fictif)."]]],
  ["Dans les 48 heures", [["Déclarer le décès en mairie", "La déclaration est faite à la mairie du lieu du décès ; nous pouvons la réaliser pour vous avec le certificat."], ["Rechercher les volontés", "Contrat de prévoyance, testament, souhaits écrits : ils guident le choix de la cérémonie."], ["Fixer la cérémonie", "Date, lieu, forme de l'hommage, avis de décès dans la presse et sur notre site."]]],
  ["Dans la première semaine", [["Prévenir l'employeur", "Si la personne travaillait, ou son ancien employeur pour la retraite complémentaire."], ["Informer les caisses et les assurances", "Retraite, assurance maladie, mutuelle, assureurs : un courrier avec l'acte de décès suffit."], ["Contacter le notaire", "Il ouvre la succession et vous indique les pièces à réunir."]]],
  ["Dans le premier mois", [["Informer les banques", "Les comptes sont bloqués ; les frais d'obsèques peuvent être prélevés sur le compte du défunt dans certaines limites."], ["Résilier ou transférer les contrats", "Électricité, téléphone, abonnements, bail, assurance habitation et véhicule."], ["Prévenir les impôts", "Une déclaration de revenus du défunt est à déposer dans les six mois."]]],
  ["Dans les mois suivants", [["Régler la succession", "Avec le notaire : inventaire, partage, déclaration de succession."], ["Demander les pensions de réversion", "Pour le conjoint survivant, auprès des caisses de retraite."], ["Prendre soin de vous", "Le deuil prend le temps qu'il prend. Des groupes de parole et des professionnels peuvent vous accompagner."]]],
];

const home = (c) => [
  sec(header(c)),
  sec(`<section class="rc-hero pk-bleed"><div class="rc-col rc-center">${branch("rc-branch--l")}<p class="rc-kicker" data-reveal>Maison Valcour · services funéraires</p>
<div class="rc-h1 rc-h1--hero" role="heading" aria-level="1" data-reveal>Nous sommes là, à toute heure, pour que vous ne soyez pas seuls.</div>
<p class="rc-lead" data-reveal>Dans ces moments, rien ne presse. Nous écoutons, nous expliquons, nous nous occupons de tout ce qui peut l'être, avec respect et discrétion.</p>
<div class="rc-urgence" data-reveal><p class="rc-urg-l">Écoute et urgence, 24 h/24 et 7 j/7</p><p class="rc-urg-n" aria-label="Zéro huit cent, zéro zéro zéro, zéro zéro zéro">${NUM}</p><p class="rc-urg-s">Appel gratuit. Numéro fictif de démonstration.</p></div>
<p class="rc-act" data-reveal><a class="rc-btn" href="/contact">Nous contacter</a></p></div></section>`),
  sec(`<section class="rc-band pk-bleed"><div class="rc-col"><h2 class="rc-h2" data-reveal>Ce que nous faisons</h2>
<ul class="rc-svc">${SERVICES.map(([n, t, p]) => `<li data-reveal><span class="rc-svc-n" aria-hidden="true">${n}</span><div><h3 class="rc-h3"><a href="/services">${esc(t)}</a></h3><p>${esc(p)}</p></div></li>`).join("")}</ul></div></section>`),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col"><h2 class="rc-h2" data-reveal>Derniers avis de décès</h2><p class="rc-muted" data-reveal>Noms fictifs, présentés pour la démonstration.</p>
<ul class="rc-list" data-reveal>${sorted.slice(0, 3).map(avItem).join("")}</ul><p class="rc-more"><a class="rc-btn rc-btn--line" href="/avis">Tous les avis et la recherche</a></p></div></section>`),
  sec(`<section class="rc-band pk-bleed"><div class="rc-col"><h2 class="rc-h2" data-reveal>Vous venez de perdre un proche ?</h2><p class="rc-lead2" data-reveal>Voici, dans l'ordre, ce qu'il faut faire dans les premières heures. Le reste peut attendre.</p>
<ol class="rc-first" data-reveal>${GUIDE[0][1].map(([t, p]) => `<li><b>${esc(t)}</b><span>${esc(p)}</span></li>`).join("")}</ol><p class="rc-more"><a class="rc-btn rc-btn--line" href="/deuil">Le guide des démarches, pas à pas</a></p></div></section>`),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col rc-center">${rule}<blockquote class="rc-quote" data-reveal><p>Accompagner une famille, c'est d'abord se taire, écouter, puis agir sans bruit.</p><footer>La direction de la maison</footer></blockquote></div></section>`),
  sec(footer(c)),
];

const avis = (c) => [sec(header(c)), pagehead("Avis de décès", "Avis de décès", "Cherchez un avis par nom, par ville ou par date. Tous les noms sont fictifs."),
  sec(`<section class="rc-sec pk-bleed rc-sec--list"><div class="rc-col"><div class="rc-find" data-rc-find data-villes="${esc(VILLES.join("|"))}"><p class="rc-note">Pour rechercher dans la liste, activez JavaScript ; la liste complète est affichée ci-dessous.</p></div>
<ul class="rc-list" data-rc-list>${sorted.map(avItem).join("")}</ul><p class="rc-empty" data-rc-empty hidden>Aucun avis ne correspond à votre recherche. Vérifiez l'orthographe, essayez seulement le nom, ou une autre ville.</p></div></section>`),
  sec(footer(c))];

const fichePage = (c) => [sec(header(c)), pagehead("Avis et condoléances", "Avis de décès et condoléances", "Cérémonie, lieu, horaires et espace pour écrire à la famille."),
  ...AVIS.map(fiche),
  sec(`<section class="rc-sec pk-bleed rc-others"><div class="rc-col"><h2 class="rc-h2">Autres avis</h2><ul class="rc-others-l">${sorted.map((a) => `<li><a href="/fiche#${a.s}" data-rc-go="${a.s}">${esc(a.nom)}<small> · ${esc(a.ville)}</small></a></li>`).join("")}</ul><p class="rc-more"><a class="rc-btn rc-btn--line" href="/avis">Retour à la liste des avis</a></p></div></section>`),
  sec(footer(c))];

const services = (c) => [sec(header(c)), pagehead("Nos services", "Un accompagnement, de la première heure au souvenir", "Trois domaines, une même attention."),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col">${SERVICES.map(([n, t, p, l]) => `<article class="rc-sv" data-reveal><p class="rc-sv-n" aria-hidden="true">${n}</p><h2 class="rc-h2">${esc(t)}</h2><p>${esc(p)}</p><ul class="rc-ul">${l.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article>`).join(rule)}</div></section>`),
  sec(`<section class="rc-band pk-bleed"><div class="rc-col"><h2 class="rc-h2" data-reveal>Le déroulé d'une organisation</h2><table class="rc-table" data-reveal><caption class="rc-sr">Les quatre étapes d'une organisation d'obsèques</caption><thead><tr><th scope="col">Étape</th><th scope="col">Ce qui se passe</th></tr></thead><tbody>${ETAPES.map(([a, b]) => `<tr><th scope="row">${a}</th><td>${b}</td></tr>`).join("")}</tbody></table>
<p class="rc-muted" data-reveal>Les devis détaillés sont remis lors du rendez-vous, avant tout engagement ; aucun tarif n'est présenté dans cette démonstration.</p>
<div class="rc-faq" data-reveal><details><summary>Pouvez-vous respecter des volontés particulières ?</summary><p>Oui. Cérémonie laïque, musique choisie, textes lus par les proches : nous adaptons le déroulé à ce qui compte pour la famille.</p></details><details><summary>Intervenez-vous en dehors de la commune ?</summary><p>Nous nous déplaçons dans tout le département et organisons le transport pour d'autres régions.</p></details><details><summary>Peut-on préparer ses obsèques à l'avance ?</summary><p>Oui, c'est le rôle de la prévoyance : un rendez-vous confidentiel, des volontés écrites, sans obligation.</p></details></div>
<p class="rc-more"><a class="rc-btn" href="/contact">Prendre rendez-vous</a></p></div></section>`),
  sec(footer(c))];

const deuil = (c) => [sec(header(c)), pagehead("Accompagnement du deuil", "Les démarches, dans l'ordre", "Cinq étapes, à votre rythme. Cochez au fur et à mesure : votre progression reste sur cet appareil."),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col"><p class="rc-prog" aria-live="polite" data-rc-prog hidden></p>${GUIDE.map(([t, items], gi) => `<section class="rc-gp" aria-label="${esc(t)}"><h2 class="rc-h2"><span class="rc-gp-n" aria-hidden="true">${gi + 1}</span>${esc(t)}</h2><ol class="rc-steps">${items.map(([a, b], ii) => `<li data-step="${gi}-${ii}"><h3 class="rc-h3">${esc(a)}</h3><p>${esc(b)}</p></li>`).join("")}</ol></section>`).join("")}
<p class="rc-note2">Ce guide est un repère général ; les règles varient selon la situation. Nous vous aidons volontiers à le vérifier.</p><p class="rc-more"><a class="rc-btn" href="/contact">Demander de l'aide</a></p></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Nous contacter", "Écrivez-nous, ou appelez à toute heure", "Nous répondons avec le plus grand soin à chaque message."),
  sec(`<section class="rc-sec pk-bleed"><div class="rc-col rc-center"><div class="rc-urgence"><p class="rc-urg-l">Urgence, 24 h/24</p><p class="rc-urg-n">${NUM}</p><p class="rc-urg-s">Appel gratuit. Numéro fictif de démonstration.</p></div><p class="rc-muted">Agence : 12 rue des Acacias, Rochebrune. Accueil sur rendez-vous, de 9 h à 18 h.</p></div></section>`),
  { type: "form", heading: "Votre message", intro: "Décrivez votre demande. Si vous avez préparé un message de condoléances, il sera repris ici." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Recherche", "Rechercher sur le site", "Un avis, un service, une démarche."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un nom, un service…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="rc-ph rc-404 pk-bleed"><div class="rc-col rc-center">${branch("rc-branch--l")}<p class="rc-kicker">Page introuvable</p><div class="rc-h1" role="heading" aria-level="1">Nous ne trouvons pas cette page.</div><p class="rc-sub">Elle a peut-être été déplacée. Reprenez par l'accueil, ou appelez-nous si vous cherchez un avis précis.</p><p class="rc-act"><a class="rc-btn" href="/">Retour à l'accueil</a> <a class="rc-btn rc-btn--line" href="/avis">Les avis de décès</a></p></div></section>`), sec(footer(c))];

module.exports = {
  key: "recueil", name: "Recueil", version: "2.0.0", category: "services", tags: ["minimaliste", "classique", "naturel"], siteType: "Services funéraires",
  concept: "Le silence et la dignité : un texte calme, une branche d'olivier, des avis de décès consultables et un espace de condoléances sobre.",
  description: "Services funéraires : gris-pierre chaud, encre anthracite, sauge éteint, serif de lecture ample. Avis de décès avec recherche et fiche, condoléances préparées vers le contact, services, guide du deuil.",
  brand: "Maison Valcour", featured: false, modules: ["formulaires", "recherche"],
  dna: { header: "barre-sobre-liens-soulignes-et-ligne-d-ecoute-24h", hero: "texte-seul-phrase-d-accueil-numero-d-ecoute-et-branche-d-olivier", grid: "une-colonne-de-lecture-etroite-et-avis-a-filets", motion: "fondu-tres-doux-a-l-apparition-sinon-quasi-statique", shapes: "filets-fins-branche-d-olivier-en-trait-et-encadres-sans-ombre", rhythm: "silencieux-tres-aere-bandes-pierre-separees-par-un-filet", signature: "avis-de-deces-recherche-fiche-ceremonie-plan-et-condoleances-sobres" },
  tokens: {
    colors: { primary: "#566b5a", secondary: "#2d3033", accent: "#6f8a8f", background: "#f2f0ec", surface: "#faf9f7", text: "#2d3033", muted: "#5b5f5c", success: "#3f6b4a", warning: "#7a5a1e", error: "#a23b3b" },
    fonts: { heading: "font.sorts-mill-goudy", body: "font.literata", button: "font.literata", link: "font.literata" },
    radius: { sm: 0, md: 2, lg: 2, button: 2, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d4d0c8" },
    type: { h1: { size: 44, weight: 400, lineHeight: 1.2, transform: "none" }, h2: { size: 30, weight: 400, lineHeight: 1.25, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent (sauge)", type: "color", default: "#566b5a" },
    { key: "fond", label: "Fond de page", type: "color", default: "#f2f0ec" },
    { key: "taille", label: "Taille du texte", type: "choice", default: "normale", choices: [["normale", "Confortable"], ["grande", "Très grande"]] },
    { key: "ornement", label: "Branche d'olivier", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "fondu", label: "Fondu à l'apparition", type: "choice", default: "on", choices: [["on", "Très doux"], ["off", "Aucun"]] },
  ],
  menu: [["Accueil", "/"], ["Avis de décès", "/avis"], ["Nos services", "/services"], ["Le deuil", "/deuil"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "avis", name: "Avis de décès", render: avis }, { key: "fiche", name: "Avis et condoléances", render: fichePage },
    { key: "services", name: "Nos services", render: services }, { key: "deuil", name: "Accompagnement du deuil", render: deuil }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
