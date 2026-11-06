// Gradin — école en ligne fictive de Noémie Garnier : formations de comptabilité pour indépendants (« Compta d'indépendant, sans panique »). Direction artistique : des gradins et des marches,
// orange brique sur papier chaud, encre brun-noir, vert sapin pour le gratuit, coins en escalier. Composants signature : programme par modules avec leçons à cocher (progression, durée restante,
// mémorisée dans le navigateur), choix de formule avec paiement en une fois ou en trois fois (calcul réel), FAQ et garantie. Tout est démonstration : personne, formations, tarifs, avis et
// chiffres sont fictifs, aucun achat n'est possible. Les formations sont écrites dans les pages du thème (aucun type de contenu du CMS n'est simulé).
const { sec, esc, nav } = require("../kit");

const MODULES = [
  ["Poser les bases", "Comprendre ce que l'on doit tenir, et pourquoi.", [["Ce qu'est vraiment la comptabilité d'un indépendant", 8, 1], ["Micro-entreprise ou société : ce qui change", 14], ["Ouvrir un compte professionnel, ou pas", 9], ["Votre calendrier de l'année en une page", 11]]],
  ["Facturer sans erreur", "Des factures complètes, numérotées, qui se font payer.", [["Les mentions obligatoires, une par une", 12, 1], ["Numérotation et ordre chronologique", 7], ["Acomptes, avoirs et factures rectificatives", 13], ["Délais de paiement et pénalités de retard", 10], ["Modèle de facture à personnaliser", 6]]],
  ["Suivre ses dépenses", "Un classeur qui tient en quinze minutes par semaine.", [["Le classeur qui tient en quinze minutes", 10], ["Justificatifs numériques : ce qui est accepté", 9], ["Frais professionnels ou personnels ?", 12], ["Véhicule, domicile, matériel : les cas fréquents", 15]]],
  ["La TVA sans migraine", "Collectée, déductible, déclarée : le circuit complet.", [["Êtes-vous concerné(e) par la TVA ?", 8], ["Calculer la TVA d'un devis", 9], ["Déclarer : mensuel, trimestriel ou annuel", 13], ["Les erreurs qui coûtent cher", 11]]],
  ["Cotisations et impôts", "Savoir ce qu'on va payer, et le mettre de côté.", [["Cotisations sociales : le principe", 12], ["Impôt sur le revenu : trois régimes", 14], ["Mettre de côté chaque mois, sans y penser", 8], ["Simuler une année type", 16]]],
  ["Votre tableau de bord", "Piloter son activité avec cinq chiffres.", [["Les cinq chiffres à suivre chaque mois", 10], ["Construire votre tableau en 30 minutes", 18], ["Préparer un rendez-vous avec un comptable", 9]]],
];
const FORMATIONS = [
  { k: "compta", t: "Compta d'indépendant, sans panique", niv: "debutant", nivl: "Débutant", d: "6 h 40", p: 149, acc: "Tout comprendre pour tenir ses comptes seul(e), de la première facture à la déclaration.", pub: "Indépendants, auto-entrepreneurs, créateurs" },
  { k: "factures", t: "Facturer et relancer", niv: "debutant", nivl: "Débutant", d: "1 h 30", p: 49, acc: "Un mini-parcours pour des factures conformes et des relances efficaces.", pub: "Toute personne qui facture" },
  { k: "tva", t: "La TVA en clair", niv: "intermediaire", nivl: "Intermédiaire", d: "2 h 10", p: 79, acc: "Collectée, déductible, déclarée : le circuit de la TVA expliqué avec des exemples réels.", pub: "Indépendants assujettis à la TVA" },
  { k: "pilotage", t: "Piloter son activité en cinq chiffres", niv: "intermediaire", nivl: "Intermédiaire", d: "3 h 00", p: 99, acc: "Construire un tableau de bord simple et le lire chaque mois.", pub: "Indépendants installés depuis plus d'un an" },
];
const PLANS = [
  { k: "autonome", n: "Autonome", p: 149, d: "Tout le parcours, à votre rythme.", items: ["6 modules et 22 leçons vidéo", "Accès à vie et mises à jour", "Modèles de factures et tableaux", "Communauté d'entraide"] },
  { k: "accompagne", n: "Accompagné", p: 299, d: "Le parcours, plus de l'aide humaine.", items: ["Tout le contenu de la formule Autonome", "Trois séances de questions en groupe", "Relecture de votre modèle de facture", "Réponse aux questions sous 48 h"], vedette: true },
  { k: "atelier", n: "Atelier", p: 549, d: "Le parcours, avec un suivi personnel.", items: ["Tout le contenu de la formule Accompagné", "Deux séances individuelles de 45 minutes", "Audit de votre organisation actuelle", "Suivi pendant trois mois"] },
];
const FAQ = [
  ["Faut-il des connaissances en comptabilité ?", "Aucune. Le parcours commence par les bases et utilise des exemples d'indépendants : une graphiste, un plombier, une consultante."],
  ["Combien de temps faut-il y consacrer ?", "Un peu moins de sept heures de vidéos, plus des exercices. La plupart des élèves terminent en trois à quatre semaines, à raison d'une heure par semaine."],
  ["Y a-t-il une garantie ?", "Oui : si le parcours ne vous convient pas, vous êtes remboursé(e) intégralement dans les 14 jours, sans justification (garantie fictive dans cette démonstration)."],
  ["Les contenus sont-ils à jour ?", "Les leçons sont revues chaque année en janvier, et vous gardez l'accès aux mises à jour à vie."],
  ["Puis-je payer en plusieurs fois ?", "Oui, en trois fois sans frais pour toutes les formules. Le choix se fait au moment de la commande."],
  ["Remplacez-vous un expert-comptable ?", "Non. La formation vous rend autonome pour le quotidien et vous aide à dialoguer avec un expert-comptable, pas à le remplacer pour les situations complexes."],
];
const AVIS = [["Le module sur la TVA m'a enfin fait comprendre ce que je déclarais depuis deux ans. Clair, concret, sans jargon.", "Sofiane, plombier-chauffagiste (avis fictif)"], ["Je facture maintenant sans stress, et mes clients paient dans les délais. Le modèle de relance vaut à lui seul le prix.", "Élodie, graphiste indépendante (avis fictif)"], ["Des vidéos courtes, des exercices utiles, et Noémie répond vraiment aux questions.", "Pierre, consultant en informatique (avis fictif)"]];
const nbLessons = MODULES.reduce((n, m) => n + m[2].length, 0);
const totalMin = MODULES.reduce((n, m) => n + m[2].reduce((a, l) => a + l[1], 0), 0);
const hm = (min) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
const eur = (n) => `${n} €`;
// Cohérence des chiffres : la durée et le nombre de leçons du parcours viennent du programme
FORMATIONS[0].d = hm(totalMin);
PLANS.forEach((p) => { p.items[0] = p.items[0].replace("6 modules et 22 leçons vidéo", `6 modules et ${nbLessons} leçons vidéo`); });
FAQ[1][1] = `Environ ${Math.floor(totalMin / 60)} heures et ${totalMin % 60} minutes de vidéo, plus des exercices. La plupart des élèves terminent en trois à quatre semaines, à raison d'une heure par semaine.`;

const IC = {
  arr: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.5 19.7l1.2-6.1L3.2 9.4l6.1-.8z" fill="currentColor"/>',
};
const ic = (k) => `<svg class="gr-ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const STAIRS = `<div class="gr-stairs" role="img" aria-label="Escalier de six marches, une par module du parcours">${MODULES.map((m, i) => `<div class="gr-st gr-st${i + 1}"><span>${i + 1}</span><b>${esc(m[0])}</b></div>`).join("")}<span class="gr-flag" aria-hidden="true">Vous êtes ici</span></div>`;

const header = (c) => `<header class="gr-head pk-bleed"><div class="gr-rub"><div class="gr-w gr-rub-in"><span>Offre de rentrée : 20 % de remise sur le parcours complet jusqu'au 30 novembre (démonstration)</span><a href="/tarifs">Voir les tarifs</a></div></div>
<div class="gr-w gr-head-in"><a class="gr-brand" href="/" aria-label="${esc(c.brand)} — accueil"><span class="gr-logo" aria-hidden="true"><i></i><i></i><i></i></span><span class="gr-brand-n">Gradin</span></a>
<div class="gr-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "gr-nl")}</div><a class="gr-cta" href="/tarifs">Commencer ${ic("arr")}</a></div></header>`;
const footer = (c) => `<footer class="gr-foot pk-bleed"><div class="gr-w gr-foot-in"><div class="gr-foot-a"><a class="gr-brand gr-brand--f" href="/" aria-label="${esc(c.brand)} — accueil"><span class="gr-logo" aria-hidden="true"><i></i><i></i><i></i></span><span class="gr-brand-n">Gradin</span></a><p>Des formations courtes et concrètes pour les indépendants qui veulent comprendre leurs chiffres. École fictive créée pour la démonstration.</p></div>
<div class="gr-foot-c"><h2 class="gr-foot-t">Apprendre</h2><a href="/formations">Toutes les formations</a><a href="/formation">Parcours complet</a><a href="/programme">Programme et progression</a><a href="/tarifs">Tarifs</a></div>
<div class="gr-foot-c"><h2 class="gr-foot-t">L'école</h2><a href="/a-propos">À propos</a><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="/blocs">Éléments de page</a></div>
<div class="gr-foot-c"><h2 class="gr-foot-t">Légal</h2><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div></div>
<div class="gr-foot-f"><div class="gr-w">© 2026 Gradin — site de démonstration. L'école, les formations, les tarifs et les avis sont fictifs ; aucun achat n'est possible.</div></div></footer>`;
const head = (kicker, title, lead, crumbs) => sec(`<section class="gr-ph pk-bleed"><div class="gr-w">${crumbs ? `<p class="gr-crumb">${crumbs}</p>` : ""}<p class="gr-kicker" data-reveal>${esc(kicker)}</p><div class="gr-h1" role="heading" aria-level="1" data-reveal>${title}</div>${lead ? `<p class="gr-lead" data-reveal>${esc(lead)}</p>` : ""}</div></section>`);
const btn = (label, url, cls = "") => `<a class="gr-btn ${cls}" href="${url}">${esc(label)} ${ic("arr")}</a>`;
const fcard = (f) => `<li class="gr-f" data-niv="${f.niv}"><a class="gr-f-a" href="/formation"><span class="gr-f-lv">${esc(f.nivl)}</span><span class="gr-f-t">${esc(f.t)}</span><span class="gr-f-x">${esc(f.acc)}</span></a><span class="gr-f-m"><span>${esc(f.d)} de vidéo</span><span>${esc(f.pub)}</span></span><b class="gr-f-p">${eur(f.p)}</b></li>`;
const lesson = (l, id) => `<li class="gr-l" data-id="${id}" data-min="${l[1]}"><a class="gr-chk" href="#fait" role="checkbox" aria-checked="false" aria-label="Marquer comme terminée : ${esc(l[0])}"><svg viewBox="0 0 24 24" aria-hidden="true">${IC.ok}</svg></a><span class="gr-l-t">${esc(l[0])}</span>${l[2] ? '<span class="gr-l-f">Aperçu gratuit</span>' : ""}<span class="gr-l-d">${l[1]} min</span></li>`;
const module_ = (m, i, open) => `<details class="gr-mod" data-mod${open ? " open" : ""}><summary><span class="gr-mod-n">Module ${i + 1}</span><span class="gr-mod-t">${esc(m[0])}</span><span class="gr-mod-m">${m[2].length} leçons · ${m[2].reduce((a, l) => a + l[1], 0)} min</span></summary><p class="gr-mod-x">${esc(m[1])}</p><ul class="gr-ll">${m[2].map((l, j) => lesson(l, `m${i + 1}l${j + 1}`)).join("")}</ul></details>`;
const planCard = (p) => `<article class="gr-pl${p.vedette ? " gr-pl--v" : ""}" data-plan data-price="${p.p}" data-reveal>${p.vedette ? '<span class="gr-pl-f">Le plus choisi</span>' : ""}<h3 class="gr-pl-n">${esc(p.n)}</h3><p class="gr-pl-d">${esc(p.d)}</p><p class="gr-pl-p"><b data-amount>${p.p} €</b><span data-per>paiement unique</span></p><ul>${p.items.map((x) => `<li>${ic("ok")}${esc(x)}</li>`).join("")}</ul>${btn("Choisir " + p.n, "/contact", p.vedette ? "" : "gr-btn--g")}</article>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="gr-hero pk-bleed"><div class="gr-w gr-hero-in"><div class="gr-hero-l"><p class="gr-kicker" data-reveal>Formations pour indépendants</p>
<div class="gr-h1 gr-h1--home" role="heading" aria-level="1" data-reveal>Montez vos comptes <em>marche après marche.</em></div>
<p class="gr-lead" data-reveal>Six modules, ${nbLessons} leçons de moins de vingt minutes, des modèles prêts à l'emploi. Noémie, ancienne experte-comptable, explique ce qu'on ne vous a jamais appris en créant votre activité.</p>
<div class="gr-actions" data-reveal>${btn("Voir le programme", "/programme")}${btn("Essayer gratuitement", "/formation", "gr-btn--g")}</div>
<ul class="gr-trust" data-reveal><li><b>2 140</b> élèves</li><li><b>4,8</b>/5 ${ic("star")}</li><li><b>14 jours</b> satisfait ou remboursé</li></ul><p class="gr-fine">Chiffres fictifs, donnés à titre de démonstration.</p></div>
<div class="gr-hero-r" data-reveal>${STAIRS}</div></div></section>`),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><div class="gr-bt"><div><p class="gr-kicker">Au catalogue</p><h2 class="gr-h2">Quatre formations, un même esprit</h2></div><a class="gr-more" href="/formations">Toutes les formations ${ic("arr")}</a></div><ul class="gr-fl">${FORMATIONS.map(fcard).join("")}</ul></div></section>`),
  sec(`<section class="gr-sec gr-sec--alt pk-bleed"><div class="gr-w"><p class="gr-kicker">Comment ça marche</p><ol class="gr-steps">${[["Vous choisissez", "Un parcours complet ou une mini-formation, selon votre besoin du moment."], ["Vous avancez", "Des leçons courtes, à regarder quand vous voulez, avec des exercices et des modèles."], ["Vous appliquez", "Vous remplissez vos propres documents au fil des leçons : à la fin, tout est prêt."]].map((s, i) => `<li data-reveal><span class="gr-sn">${i + 1}</span><h3 class="gr-h3">${esc(s[0])}</h3><p>${esc(s[1])}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><p class="gr-kicker">Ils ont gravi les marches</p><ul class="gr-av">${AVIS.map((a) => `<li data-reveal><blockquote><p>${esc(a[0])}</p><cite>${esc(a[1])}</cite></blockquote></li>`).join("")}</ul></div></section>`),
  sec(`<section class="gr-cta2 pk-bleed"><div class="gr-w gr-cta2-in"><div><h2 class="gr-h2">La première marche est gratuite.</h2><p class="gr-lead">Deux leçons du parcours sont en accès libre : regardez-les avant de décider.</p></div>${btn("Voir les leçons gratuites", "/programme", "gr-btn--w")}</div></section>`),
  sec(footer(c)),
];

const formations = (c) => [
  sec(header(c)),
  head("Catalogue", "Toutes les formations", "Quatre parcours courts. Filtrez par niveau pour trouver le bon point de départ."),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><div class="gr-filt" data-filters role="group" aria-label="Filtrer par niveau"><a class="gr-chip is-on" href="#tous" role="button" data-niv="tous" aria-pressed="true">Tous les niveaux</a><a class="gr-chip" href="#debutant" role="button" data-niv="debutant" aria-pressed="false">Débutant</a><a class="gr-chip" href="#intermediaire" role="button" data-niv="intermediaire" aria-pressed="false">Intermédiaire</a></div>
<ul class="gr-fl gr-fl--full" data-list>${FORMATIONS.map(fcard).join("")}</ul><p class="gr-empty" data-empty hidden>Aucune formation à ce niveau pour le moment.</p></div></section>`),
  sec(footer(c)),
];

const formation = (c) => [
  sec(header(c)),
  sec(`<section class="gr-ph gr-ph--f pk-bleed"><div class="gr-w gr-ph-in"><div><p class="gr-crumb"><a href="/">Accueil</a> › <a href="/formations">Formations</a> › Parcours complet</p><p class="gr-kicker" data-reveal>Formation · Débutant</p><div class="gr-h1" role="heading" aria-level="1" data-reveal>Compta d'indépendant, sans panique</div><p class="gr-lead" data-reveal>De la première facture à la déclaration : tout ce qu'il faut pour tenir vos comptes seul(e), expliqué par une ancienne experte-comptable.</p>
<ul class="gr-meta" data-reveal><li><b>${hm(totalMin)}</b> de vidéo</li><li><b>${nbLessons}</b> leçons</li><li><b>6</b> modules</li><li><b>Accès à vie</b></li></ul><div class="gr-actions">${btn("Commencer le parcours", "/tarifs")}${btn("Regarder les aperçus", "/programme", "gr-btn--g")}</div></div>
<aside class="gr-box" aria-label="Récapitulatif"><p class="gr-box-p"><b>149 €</b> <span>ou 3 × 49,67 €</span></p><ul>${["Remboursé sous 14 jours", "Modèles de factures et tableaux", "Mises à jour incluses", "Certificat de fin de parcours"].map((x) => `<li>${ic("ok")}${esc(x)}</li>`).join("")}</ul>${btn("Voir les formules", "/tarifs")}</aside></div></section>`),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w gr-two"><div><h2 class="gr-h2">Ce que vous saurez faire</h2><ul class="gr-ck">${["Choisir le statut qui correspond à votre activité", "Établir des factures conformes en dix minutes", "Classer vos justificatifs sans y passer vos soirées", "Calculer et déclarer votre TVA sans erreur", "Mettre de côté ce qu'il faut pour les cotisations", "Suivre votre activité avec cinq chiffres simples"].map((x) => `<li>${ic("ok")}${esc(x)}</li>`).join("")}</ul></div>
<div><h2 class="gr-h2">Pour qui ?</h2><p class="gr-p">Pour toute personne qui travaille à son compte et n'a jamais eu de formation à la gestion : auto-entrepreneurs, artisans, freelances, créateurs et créatrices.</p><p class="gr-p">Pas besoin d'aimer les chiffres : l'objectif est que vous vous sentiez à l'aise, pas que vous deveniez comptable.</p><blockquote class="gr-q"><p>« J'ai voulu faire la formation que j'aurais rêvé de suivre à mes débuts. »</p><cite>Noémie Garnier (personnage fictif)</cite></blockquote></div></div></section>`),
  sec(`<section class="gr-sec gr-sec--alt pk-bleed"><div class="gr-w"><div class="gr-bt"><div><p class="gr-kicker">Extrait du programme</p><h2 class="gr-h2">Les trois premiers modules</h2></div><a class="gr-more" href="/programme">Programme complet ${ic("arr")}</a></div><div class="gr-mods">${MODULES.slice(0, 3).map((m, i) => `<details class="gr-mod"><summary><span class="gr-mod-n">Module ${i + 1}</span><span class="gr-mod-t">${esc(m[0])}</span><span class="gr-mod-m">${m[2].length} leçons</span></summary><p class="gr-mod-x">${esc(m[1])}</p></details>`).join("")}</div></div></section>`),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><p class="gr-kicker">Questions fréquentes</p><div class="gr-faq">${FAQ.slice(0, 4).map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div></section>`),
  sec(footer(c)),
];

const programme = (c) => [
  sec(header(c)),
  head("Programme et progression", "Suivez votre parcours, leçon après leçon", `Cochez les leçons terminées : la progression est conservée dans votre navigateur. Deux leçons sont gratuites. Total : ${nbLessons} leçons, ${hm(totalMin)} de vidéo.`),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w gr-prog-in"><aside class="gr-ring-w" aria-label="Votre progression" data-ring><div class="gr-ring" aria-hidden="true"><span data-pct>0 %</span></div><p class="gr-ring-t"><b data-done>0</b> / <span data-total>${nbLessons}</span> leçons</p><p class="gr-ring-s" data-left>${hm(totalMin)} restantes</p><p class="gr-ring-m" data-msg role="status" aria-live="polite">Première marche : choisissez une leçon.</p><p><a class="gr-more" href="#reset" role="button" data-reset>Réinitialiser</a></p></aside>
<div class="gr-mods" data-mods><p class="gr-tools"><a class="gr-chip" href="#tout" role="button" data-expand>Tout ouvrir</a><a class="gr-chip" href="#replier" role="button" data-collapse>Tout replier</a></p>${MODULES.map((m, i) => module_(m, i, i === 0)).join("")}</div></div></section>`),
  sec(footer(c)),
];

const tarifs = (c) => [
  sec(header(c)),
  head("Tarifs", "Choisissez votre formule", "Le même parcours, avec plus ou moins d'accompagnement. Payez en une fois ou en trois fois sans frais.", ),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><div class="gr-pay" data-pay role="group" aria-label="Mode de paiement"><a class="gr-chip is-on" href="#une" role="button" data-n="1" aria-pressed="true">Paiement unique</a><a class="gr-chip" href="#trois" role="button" data-n="3" aria-pressed="false">En 3 fois sans frais</a></div>
<div class="gr-pls">${PLANS.map(planCard).join("")}</div><p class="gr-fine">Tarifs et formules fictifs. Garantie « satisfait ou remboursé » de 14 jours (fictive). Aucune commande n'est possible dans cette démonstration : le bouton mène au formulaire de contact.</p>
<div class="gr-sec-in"><p class="gr-kicker">Comparatif</p><div class="gr-tw"><table><caption>Ce que contient chaque formule</caption><thead><tr><th scope="col">Inclus</th><th scope="col">Autonome</th><th scope="col">Accompagné</th><th scope="col">Atelier</th></tr></thead><tbody><tr><th scope="row">Leçons vidéo</th><td>${nbLessons}</td><td>${nbLessons}</td><td>${nbLessons}</td></tr><tr><th scope="row">Modèles et tableaux</th><td>Oui</td><td>Oui</td><td>Oui</td></tr><tr><th scope="row">Séances en groupe</th><td>—</td><td>3</td><td>3</td></tr><tr><th scope="row">Séances individuelles</th><td>—</td><td>—</td><td>2</td></tr><tr><th scope="row">Suivi personnel</th><td>—</td><td>—</td><td>3 mois</td></tr></tbody></table></div></div>
<div class="gr-sec-in"><p class="gr-kicker">Questions fréquentes</p><div class="gr-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div></div></section>`),
  sec(footer(c)),
];

const apropos = (c) => [
  sec(header(c)),
  head("À propos", "Noémie, ancienne experte-comptable", "Quinze ans de cabinet, puis l'envie d'expliquer simplement ce que les indépendants devraient savoir dès le départ."),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w gr-two"><div class="gr-portrait" aria-hidden="true"><div class="gr-pt"><span>NG</span></div><p class="gr-fine">Portrait fictif : les initiales remplacent volontairement une photographie.</p></div><div class="gr-prose"><h2>Pourquoi Gradin ?</h2><p>En quinze ans de cabinet, Noémie a vu les mêmes difficultés revenir : des factures incomplètes, des justificatifs perdus, des déclarations faites dans la panique. Rien d'insurmontable, mais personne pour l'expliquer calmement.</p><p>Elle a créé Gradin pour cela : des parcours courts, découpés en marches, où chaque leçon répond à une seule question.</p><h2>Sa méthode</h2><ul><li>Une idée par leçon, vingt minutes au plus.</li><li>Des exemples d'indépendants réels (anonymisés).</li><li>Des modèles à remplir pendant la leçon.</li></ul><blockquote><p>On n'apprend pas la gestion en lisant le Code général des impôts, on l'apprend en remplissant sa première facture.</p><cite>Noémie Garnier (personnage fictif)</cite></blockquote></div></div></section>`),
  sec(footer(c)),
];

const blocs = (c) => [
  sec(header(c)),
  head("Annexe", "Éléments de page", "Titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés dans le style du thème."),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><article class="gr-prose gr-prose--long">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec du <strong>gras</strong>, de l'<em>italique</em>, un <a href="/formations">lien</a>, du <code>code en ligne</code> et une <mark>mise en évidence</mark>. Le texte courant reste à 17 px minimum, sur une ligne de 60 à 75 caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote><p>Une citation se détache par un grand guillemet orange et un filet en escalier.</p><cite>Personne fictive</cite></blockquote>
<figure class="gr-fig">${STAIRS}<figcaption>Illustration avec légende : l'escalier est un dessin en HTML, texte alternatif fourni.</figcaption></figure>
<div class="gr-tw"><table><caption>Tableau défilant sur mobile</caption><thead><tr><th scope="col">Leçon</th><th scope="col">Durée</th><th scope="col">Accès</th><th scope="col">Remarque</th></tr></thead><tbody><tr><td>Mentions obligatoires</td><td>12 min</td><td>Gratuit</td><td>Aperçu</td></tr><tr><td>Calculer la TVA</td><td>9 min</td><td>Payant</td><td>Avec exercice</td></tr></tbody></table></div>
<pre class="gr-pre"><code>Total HT : 1 200,00 €\nTVA 20 % : 240,00 €\nTotal TTC : 1 440,00 €</code></pre>
<p class="gr-actions">${btn("Bouton principal", "/formations")}${btn("Bouton secondaire", "/tarifs", "gr-btn--g")}</p>
<div class="gr-cols"><div><h3>Colonne 1</h3><p>Deux colonnes côte à côte, empilées sur mobile.</p></div><div><h3>Colonne 2</h3><p>Chaque colonne garde une mesure de lecture confortable.</p></div></div>
<aside class="gr-note"><b>Astuce.</b> Un encadré d'information.</aside><aside class="gr-note gr-note--w"><b>Attention.</b> Un encadré de mise en garde.</aside>
</article></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  head("Contact", "Une question avant de commencer ?", "Écrivez-nous : nous répondons sous deux jours ouvrés. Pour une question sur le contenu d'une formation, précisez la leçon concernée."),
  { type: "form", heading: "Écrire à l'équipe Gradin", intro: "Le formulaire fonctionne comme sur un vrai site ; dans cette démonstration, personne ne lira votre message et aucune commande n'est prise." },
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w gr-two"><div><h2 class="gr-h3">Avant de nous écrire</h2><p class="gr-p">La réponse se trouve peut-être dans la <a href="/tarifs">foire aux questions</a>. Sinon, précisez la formule qui vous intéresse et votre situation (statut, ancienneté).</p></div><div><h2 class="gr-h3">Entreprises et organismes</h2><p class="gr-p">Pour une formation de groupe ou un financement par un organisme, indiquez le nombre de personnes et vos dates souhaitées.</p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  head("Recherche", "Rechercher une formation ou une leçon", "Un mot, un thème, un niveau : tapez ce que vous cherchez."),
  { type: "layout", children: [{ type: "search", props: { target: "catalogue", placeholder: "Rechercher une formation, une leçon…", button: "Chercher" } }] },
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><div class="gr-none"><div class="gr-none-s" aria-hidden="true"><i></i><i></i><i></i></div><div><h2 class="gr-h2">Aucun résultat ?</h2><p class="gr-p">Essayez un mot plus court. Vous pouvez aussi parcourir <a href="/formations">le catalogue</a>, <a href="/programme">le programme du parcours complet</a> ou <a href="/contact">nous écrire</a>.</p></div></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="gr-404 pk-bleed"><div class="gr-w gr-404-in"><div class="gr-404-s" aria-hidden="true"><i></i><i></i><i></i><i></i><span>404</span></div><div><p class="gr-kicker">Marche manquante</p><div class="gr-h1" role="heading" aria-level="1">Cette page est introuvable</div><p class="gr-lead">Vous avez raté une marche : l'adresse n'existe pas ou a changé. Reprenez l'escalier par un endroit sûr.</p><div class="gr-actions">${btn("Retour à l'accueil", "/")}${btn("Voir les formations", "/formations", "gr-btn--g")}${btn("Le programme", "/programme", "gr-btn--g")}</div></div></div></section>`),
  sec(footer(c)),
];
const legal = (kicker, title, items) => (c) => [
  sec(header(c)),
  head(kicker, title, "Texte de démonstration, à adapter par l'éditeur réel du site."),
  sec(`<section class="gr-sec pk-bleed"><div class="gr-w"><article class="gr-prose gr-prose--long">${items.map(([t, p]) => `<h2>${esc(t)}</h2><p>${p}</p>`).join("")}<p><a href="/contact">Une question sur ce texte ? Écrivez-nous.</a></p></article></div></section>`),
  sec(footer(c)),
];
const mentions = legal("Mentions", "Mentions légales", [
  ["Éditeur", "Gradin est une école en ligne fictive éditée pour la démonstration. Remplacez ces lignes par la raison sociale, l'adresse, le numéro d'immatriculation et le numéro de TVA de votre structure, ainsi que son numéro de déclaration d'activité de formation le cas échéant."],
  ["Direction de la publication", "Noémie Garnier (personnage fictif), joignable par le <a href=\"/contact\">formulaire de contact</a>."],
  ["Hébergement", "Indiquez ici la dénomination, l'adresse et les coordonnées de l'hébergeur réel du site et des vidéos."],
  ["Conditions de vente", "Pour une vraie vente en ligne, joignez ici les conditions générales : prix TTC, droit de rétractation, modalités de remboursement et service après-vente. Les tarifs de cette démonstration n'engagent personne."],
  ["Propriété intellectuelle", "Les contenus pédagogiques, textes, modèles et mises en page de la démonstration sont fictifs et fournis pour illustrer le thème."],
]);
const confidentialite = legal("Confidentialité", "Politique de confidentialité", [
  ["Données collectées", "Le formulaire de contact recueille votre nom, votre adresse e-mail et votre message. La progression des leçons reste dans votre navigateur et n'est transmise à personne."],
  ["Finalité", "Répondre à votre demande et, après un achat réel, gérer votre accès et votre facturation. Aucune donnée n'est revendue."],
  ["Conservation", "Les messages sont conservés douze mois, puis supprimés. Les données de facturation sont conservées selon les obligations légales."],
  ["Vos droits", "Accès, rectification, suppression, opposition, portabilité : écrivez via le <a href=\"/contact\">formulaire de contact</a>. Vous pouvez aussi saisir l'autorité de contrôle compétente."],
  ["Mémoire du navigateur", "Le suivi de progression utilise le stockage local de votre navigateur ; il ne dépose aucun cookie de suivi et peut être effacé à tout moment."],
]);

module.exports = {
  key: "gradin", name: "Gradin", version: "1.0.0", category: "education", tags: ["moderne", "chaleureux", "geometrique"], siteType: "Créateur de formations / école en ligne", collection: "pro",
  concept: "Une école en ligne pensée comme un escalier : programme en modules avec leçons à cocher et progression mémorisée, formules aux marches ascendantes, paiement en une ou trois fois calculé en direct.",
  description: "Site de formations en ligne : papier chaud, orange brique, encre brun-noir, coins en escalier, catalogue filtrable, programme par modules avec progression, formules et paiement en trois fois, FAQ, avis.",
  brand: "Gradin", modules: ["formulaires", "recherche"],
  contentModel: "Formations, modules, leçons, formules, avis et FAQ sont écrits dans les pages du thème (aucun type de contenu ni paiement du CMS n'est simulé) ; la progression des leçons est enregistrée dans le navigateur du visiteur seulement.",
  dna: {
    header: "ruban-promotionnel-puis-barre-a-logo-en-trois-marches-et-bouton-commencer",
    hero: "texte-a-gauche-et-escalier-de-six-marches-aux-modules-avec-drapeau-vous-etes-ici",
    grid: "colonnes-de-gradins-a-hauteurs-ascendantes-et-liste-de-formations-en-lignes-indentees",
    typo: "plus-jakarta-sans-pour-les-titres-et-fira-sans-pour-les-lecons",
    shapes: "coins-coupes-en-escalier-pastilles-numerotees-et-cases-a-cocher-carrees",
    motion: "marches-qui-montent-anneau-de-progression-et-montants-recalcules-au-changement-de-paiement",
    rhythm: "bandes-alternees-papier-et-sable-avec-numeros-de-marche",
    signature: "programme-par-modules-a-lecons-cochables-avec-progression-memorisee-et-paiement-en-une-ou-trois-fois",
    palette: "papier-chaud-orange-brique-brun-noir-et-vert-sapin",
    image: "escaliers-dessines-en-html-pastilles-d-initiales-sans-photographie",
    list: "formations-en-lignes-avec-niveau-duree-public-et-prix-a-droite",
    article: "page-de-vente-avec-encadre-prix-collant-resultats-programme-et-faq",
    sidebar: "encadre-de-prix-a-droite-sur-la-fiche-anneau-de-progression-sur-le-programme",
    reading: "fira-sans-17-px-ligne-de-64-caracteres-citations-a-guillemet-orange",
  },
  tokens: {
    colors: { primary: "#c2410c", secondary: "#231a14", accent: "#0f6b4f", background: "#fff7ec", surface: "#ffffff", text: "#231a14", muted: "#6a5a4d", success: "#13803f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.plus-jakarta-sans", body: "font.fira-sans", button: "font.plus-jakarta-sans", link: "font.fira-sans" },
    radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "6px 6px 0 #f1d9bd", button: "none" }, border: { width: 2, color: "#231a14" },
    type: { h1: { size: 56, weight: 800, lineHeight: 1.05, transform: "none" }, h2: { size: 34, weight: 700, lineHeight: 1.12, transform: "none" } },
  },
  options: [
    { key: "brique", label: "Orange brique (couleur principale)", type: "color", default: "#c2410c" },
    { key: "sapin", label: "Vert sapin (gratuit)", type: "color", default: "#0f6b4f" },
    { key: "entete", label: "En-tête", type: "choice", default: "ruban", choices: [["ruban", "Ruban promotionnel et barre"], ["marches", "Barre à marches"], ["centre", "Logo centré"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "escalier", choices: [["escalier", "Colonnes en escalier"], ["simple", "Simple"]] },
    { key: "liste", label: "Liste des formations", type: "choice", default: "lignes", choices: [["lignes", "Lignes indentées"], ["cartes", "Cartes"], ["tableau", "Tableau"]] },
    { key: "page", label: "Fiche de formation", type: "choice", default: "colonne", choices: [["colonne", "Encadré de prix à droite"], ["pleine", "Pleine largeur"]] },
    { key: "marches", label: "Marches décoratives", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
  ],
  menu: [["Accueil", "/"], ["Formations", "/formations"], ["Programme", "/programme"], ["Tarifs", "/tarifs"], ["À propos", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "formations", name: "Catalogue des formations", render: formations }, { key: "formation", name: "Fiche de formation", render: formation },
    { key: "programme", name: "Programme et progression", render: programme }, { key: "tarifs", name: "Tarifs et FAQ", render: tarifs }, { key: "a-propos", name: "À propos", render: apropos }, { key: "blocs", name: "Éléments de page", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite },
  ],
};
