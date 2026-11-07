// Mandat — site de consultante indépendante fictive (Anouk Ferrand, conseil en organisation commerciale pour PME). Direction artistique : papier à lettre, encre bleu carbone, tampon rouge,
// articles numérotés façon contrat, signature manuscrite dessinée. Composants signature : estimateur de mission (jours, urgence, déplacement → HT / TTC calculés dans le navigateur)
// et choix d'un créneau de rendez-vous (jours ouvrés réels à partir d'aujourd'hui). Tout est démonstration : personne, clients, tarifs et résultats sont fictifs ; aucune réservation n'est enregistrée.
const { sec, esc, nav } = require("../kit");

const SECTEURS = { industrie: "Industrie", commerce: "Commerce", sante: "Santé", services: "Services", asso: "Association" };
// [slug, titre, secteur, durée, résultat, contexte, ce qui a été fait (3), chiffre clé, libellé du chiffre]
const MISSIONS = [
  ["fonderie-vasseur", "Remettre un devis en 48 heures plutôt qu'en deux semaines", "industrie", "4 mois", "Délai de devis divisé par 6", "Une fonderie familiale de 60 salariés perdait des affaires faute de répondre assez vite à ses clients.", ["Cartographie du circuit du devis, de la demande au retour client", "Gabarit de chiffrage partagé entre bureau d'études et commercial", "Tableau de suivi hebdomadaire des devis en attente"], "48 h", "délai moyen de réponse"],
  ["librairie-des-quais", "Structurer une offre aux collectivités pour une librairie indépendante", "commerce", "3 mois", "+ 22 % de chiffre d'affaires collectivités", "La librairie répondait aux appels d'offres au coup par coup, sans méthode ni catalogue dédié.", ["Catalogue de sélections thématiques pour bibliothèques et écoles", "Trame de réponse type aux marchés publics", "Relance annuelle des acheteurs habituels"], "+22 %", "ventes aux collectivités"],
  ["cabinet-kine", "Passer de trois cabinets à un parcours patient commun", "sante", "5 mois", "Taux de rendez-vous manqués ramené de 14 % à 5 %", "Trois cabinets de kinésithérapie associés gardaient des agendas et des habitudes différents.", ["Parcours patient unique, de la prise de contact au suivi", "Rappels de rendez-vous harmonisés", "Indicateurs mensuels partagés entre associés"], "5 %", "rendez-vous manqués"],
  ["agence-evenement", "Tarifer des prestations sans brader : l'atelier prix d'une agence", "services", "6 semaines", "Marge brute remontée de 8 points", "Une agence événementielle alignait ses prix sur ceux des concurrents, sans connaître ses coûts réels.", ["Calcul du coût réel par type de prestation", "Grille de prix avec trois niveaux de service", "Argumentaire de négociation pour les commerciaux"], "+8 pts", "de marge brute"],
  ["asso-sport", "Fidéliser les bénévoles d'une association de quartier", "asso", "2 mois", "Renouvellement des bénévoles passé à 71 %", "Les bénévoles arrivaient en septembre et disparaissaient avant Noël.", ["Entretiens avec trente bénévoles actuels et anciens", "Parcours d'accueil en trois étapes", "Rôles clairs et durée d'engagement choisie"], "71 %", "de bénévoles réinscrits"],
  ["negoce-bois", "Piloter les relances clients d'un négoce de matériaux", "commerce", "3 mois", "Retards de paiement réduits de moitié", "Les factures en retard étaient suivies sur des fichiers personnels, sans règle commune.", ["Calendrier de relance en quatre temps", "Modèles de messages courtois puis fermes", "Revue hebdomadaire des encours en trente minutes"], "÷ 2", "retards de paiement"],
  ["bureau-etudes", "Choisir les bons clients : segmenter un bureau d'études", "services", "2 mois", "Trois clients sur dix représentaient 70 % de la marge", "Le bureau d'études répondait à toute demande, y compris celles qui coûtaient plus qu'elles ne rapportaient.", ["Analyse de rentabilité par client et par type de mission", "Critères écrits d'acceptation d'une affaire", "Plan de désengagement poli des clients déficitaires"], "70 %", "de la marge sur 3 clients"],
  ["atelier-ceramique", "Lancer une boutique en ligne sans y perdre son atelier", "commerce", "10 semaines", "Premier mois : 140 commandes expédiées", "Une céramiste voulait vendre en ligne mais redoutait de passer ses journées à emballer.", ["Choix d'un catalogue réduit de huit produits", "Organisation de l'expédition par lots, deux jours par semaine", "Plan de lancement auprès de la clientèle existante"], "140", "commandes le premier mois"],
];
const OFFRES = [
  { k: "diagnostic", n: "Diagnostic", d: "Un regard extérieur, un plan d'action écrit.", p: "1 560", u: "€ HT, forfait", dur: "2 jours + restitution", items: ["Entretiens avec trois à cinq personnes clés", "Analyse de vos chiffres commerciaux", "Rapport de dix pages et priorités classées", "Restitution en visioconférence"] },
  { k: "mission", n: "Mission ciblée", d: "Un problème précis, résolu de bout en bout.", p: "7 200", u: "€ HT, 10 jours", dur: "4 à 8 semaines", items: ["Cadrage écrit des objectifs mesurables", "Ateliers avec vos équipes", "Outils livrés et transmis (modèles, tableaux)", "Point de suivi à trois mois offert"], vedette: true },
  { k: "accompagnement", n: "Accompagnement", d: "Une présence régulière pour tenir dans la durée.", p: "2 800", u: "€ HT par mois", dur: "engagement de 6 mois", items: ["Quatre jours par mois, planifiés à l'avance", "Participation à vos comités commerciaux", "Joignable entre deux séances", "Bilan écrit chaque trimestre"] },
];
const NIVEAUX = ["Diagnostic", "Mission ciblée", "Accompagnement"];
const COMPARE = [["Livrable écrit", ["Rapport", "Outils + rapport", "Bilans trimestriels"]], ["Ateliers avec vos équipes", ["—", "2 à 4", "Réguliers"]], ["Durée", ["2 jours", "10 jours", "6 mois"]], ["Suivi après mission", ["—", "À trois mois", "Continu"]], ["Joignable entre deux séances", ["—", "Par e-mail", "Oui, sous 24 h"]]];
const FAQ = [
  ["Travaillez-vous avec de très petites entreprises ?", "Oui, à partir de trois personnes. Le diagnostic a été pensé pour cela : deux jours, un plan, et vous décidez ensuite seul de la suite."],
  ["Les tarifs sont-ils négociables ?", "Le tarif journalier est fixe, mais le périmètre l'est rarement. Mieux vaut réduire une mission que rogner sur le prix : nous cherchons ensemble ce qui est vraiment utile."],
  ["Vous déplacez-vous ?", "Oui, dans toute la France. Les déplacements sont facturés 60 € HT par jour sur site, les frais réels de transport en plus."],
  ["Que se passe-t-il si les résultats ne viennent pas ?", "Aucun consultant sérieux ne garantit un chiffre. Je m'engage sur la méthode, les livrables et un point de contrôle à mi-parcours, où nous décidons ensemble de continuer ou d'arrêter."],
  ["Comment protégez-vous nos informations ?", "Un accord de confidentialité est signé avant le premier échange de documents, et les données restent sur vos outils."],
];
const ETAPES = [["Premier échange", "Trente minutes, gratuites, pour vérifier que je peux vous être utile. Parfois, la réponse est non, et je vous oriente alors vers quelqu'un d'autre."], ["Proposition écrite", "Sous 48 heures : objectifs, périmètre, calendrier, prix. Une page, pas vingt."], ["Mission", "Ateliers, analyses, outils. Un point d'étape chaque semaine, par écrit."], ["Transmission", "Tout est documenté pour que vous continuiez sans moi. C'est le but."]];

// ---------- illustrations ----------
const SIGN = `<svg class="md-sign" viewBox="0 0 220 70" role="img" aria-label="Signature manuscrite d'Anouk Ferrand"><path d="M8 48c18-34 30-38 34-24 3 12-14 30-8 32 9 2 20-26 34-26 8 0 2 14 8 14 8 0 12-16 20-14 6 2-2 14 4 14 10 0 16-10 30-12 10-2 6 8 18 6 8-1 14-8 26-10M60 60c40-6 90-8 150-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const STAMP = (t1, t2) => `<span class="md-stamp" role="img" aria-label="${esc(t1)} ${esc(t2)}"><b>${esc(t1)}</b><span>${esc(t2)}</span></span>`;
const IC = {
  arr: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
const ic = (k) => `<svg class="md-ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

// ---------- structure commune ----------
const header = (c) => `<header class="md-head pk-bleed"><div class="md-w md-head-in">
<a class="md-brand" href="/" aria-label="Anouk Ferrand, conseil — accueil"><span class="md-brand-n">Anouk Ferrand</span><span class="md-brand-r">conseil en organisation commerciale</span></a>
<div class="md-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "md-nl")}</div>
<a class="md-rdv" href="/rendez-vous">${ic("cal")}<span>Prendre rendez-vous</span></a></div></header>`;
const footer = (c) => `<footer class="md-foot pk-bleed"><div class="md-w md-foot-in">
<div class="md-foot-sig"><p class="md-foot-l">Cordialement,</p>${SIGN}<p class="md-foot-n">Anouk Ferrand<br><span>Consultante indépendante, Nantes (démonstration)</span></p></div>
<div class="md-foot-c"><h2 class="md-foot-t">Le cabinet</h2><a href="/offres">Offres et tarifs</a><a href="/missions">Missions</a><a href="/a-propos">À propos</a><a href="/rendez-vous">Rendez-vous</a></div>
<div class="md-foot-c"><h2 class="md-foot-t">Pratique</h2><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a><a href="/blocs">Éléments de page</a></div>
</div><p class="md-w md-foot-f">© 2026 Anouk Ferrand — site de démonstration. La personne, les clients, les tarifs et les résultats sont fictifs.</p></footer>`;
const head = (art, title, lead) => sec(`<section class="md-ph pk-bleed"><div class="md-w md-ph-in"><p class="md-art" data-reveal>${esc(art)}</p><div><div class="md-h1" role="heading" aria-level="1" data-reveal>${title}</div>${lead ? `<p class="md-lead" data-reveal>${esc(lead)}</p>` : ""}</div></div></section>`);
const clause = (n, t, body, cls = "") => `<section class="md-cl ${cls}" data-reveal><p class="md-art">Article ${n}</p><div class="md-cl-b"><h2 class="md-h2">${esc(t)}</h2>${body}</div></section>`;
const btn = (label, url, cls = "") => `<a class="md-btn ${cls}" href="${url}">${esc(label)} ${ic("arr")}</a>`;
const missionCard = (m, i) => `<li class="md-m" data-sect="${m[2]}" data-n="${i}"><a class="md-m-a" href="/mission#${m[0]}"><span class="md-m-s">${esc(SECTEURS[m[2]])} · ${esc(m[3])}</span><span class="md-m-t">${esc(m[1])}</span><span class="md-m-r">${esc(m[4])}</span></a><span class="md-m-k"><b>${esc(m[7])}</b><span>${esc(m[8])}</span></span></li>`;
const offre = (o) => `<article class="md-of${o.vedette ? " md-of--v" : ""}" data-reveal>${o.vedette ? '<span class="md-of-f">Le plus choisi</span>' : ""}<h3 class="md-of-n">${esc(o.n)}</h3><p class="md-of-d">${esc(o.d)}</p><p class="md-of-p"><b>${o.p}</b> <span>${esc(o.u)}</span></p><p class="md-of-dur">${esc(o.dur)}</p><ul>${o.items.map((x) => `<li>${ic("ok")}${esc(x)}</li>`).join("")}</ul>${btn("Demander cette formule", "/contact", o.vedette ? "" : "md-btn--g")}</article>`;

// ---------- pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="md-hero pk-bleed"><div class="md-w md-hero-in"><div class="md-hero-l"><p class="md-art" data-reveal>Objet : vos ventes, votre organisation</p>
<div class="md-h1 md-h1--home" role="heading" aria-level="1" data-reveal>Des ventes qui s'organisent, <em>sans jargon.</em></div>
<p class="md-lead" data-reveal>Je conseille les entreprises de dix à deux cents personnes qui vendent déjà bien, mais pas assez régulièrement. Un diagnostic écrit, un plan court, des outils que vos équipes gardent.</p>
<div class="md-actions" data-reveal>${btn("Prendre rendez-vous", "/rendez-vous")}${btn("Voir les formules", "/offres", "md-btn--g")}</div></div>
<aside class="md-hero-r" data-reveal aria-label="Disponibilité"><div class="md-letter"><p class="md-letter-h">Nantes, le 5 novembre 2026</p><p>Madame, Monsieur,</p><p>Quarante missions en onze ans, et une règle : <b>ne rien vendre qui ne se mesure pas.</b></p>${SIGN}</div>${STAMP("DISPONIBLE", "à partir de janvier")}</aside></div></section>`),
  sec(`<section class="md-chiffres pk-bleed"><div class="md-w"><ul class="md-ch"><li><b data-count="40">40</b><span>missions menées depuis 2015</span></li><li><b data-count="11">11</b><span>ans d'expérience commerciale</span></li><li><b data-count="92" data-suf=" %">92 %</b><span>de clients qui me recontactent</span></li><li><b data-count="48" data-suf=" h">48 h</b><span>pour une proposition écrite</span></li></ul><p class="md-fine">Chiffres fictifs, donnés à titre de démonstration.</p></div></section>`),
  sec(`<section class="md-sec pk-bleed"><div class="md-w">${clause(1, "Ce que je fais", `<ul class="md-ls"><li><b>Diagnostiquer.</b> Où se perdent les affaires, entre le premier contact et la facture ?</li><li><b>Structurer.</b> Prix, devis, relances, suivi : des règles simples, écrites, partagées.</li><li><b>Transmettre.</b> Vos équipes repartent avec les outils et la méthode, pas avec une dépendance à moi.</li></ul>`)}
${clause(2, "Les formules", `<div class="md-ofs">${OFFRES.map(offre).join("")}</div><p class="md-fine">Tarifs indicatifs fictifs, hors déplacements. <a href="/offres">Détail et comparatif</a>.</p>`)}
${clause(3, "Missions récentes", `<ul class="md-ml">${MISSIONS.slice(0, 4).map(missionCard).join("")}</ul><p><a class="md-more" href="/missions">Toutes les missions ${ic("arr")}</a></p>`)}</div></section>`),
  sec(`<section class="md-quote pk-bleed"><div class="md-w"><blockquote><p>« En deux jours, Anouk a vu ce que nous ne voyions plus depuis dix ans. Ses outils servent encore, deux ans après. »</p><cite>Directeur d'une fonderie de 60 salariés (témoignage fictif)</cite></blockquote></div></section>`),
  sec(`<section class="md-cta pk-bleed"><div class="md-w md-cta-in"><div><h2 class="md-h2">Parlons de votre situation.</h2><p class="md-lead">Trente minutes, gratuites, sans engagement. Choisissez un créneau ou écrivez-moi.</p></div><div class="md-actions">${btn("Choisir un créneau", "/rendez-vous")}${btn("Écrire", "/contact", "md-btn--w")}</div></div></section>`),
  sec(footer(c)),
];

const offres = (c) => [
  sec(header(c)),
  head("Conditions générales", "Offres et tarifs", "Trois formules, un tarif journalier affiché, aucun frais caché. Le périmètre est écrit avant le premier jour."),
  sec(`<section class="md-sec pk-bleed"><div class="md-w">${clause(1, "Choisir sa formule", `<div class="md-ofs">${OFFRES.map(offre).join("")}</div>`)}
${clause(2, "Comparatif", `<div class="md-tw"><table><caption>Ce que contient chaque formule</caption><thead><tr><th scope="col">Critère</th>${NIVEAUX.map((n) => `<th scope="col">${n}</th>`).join("")}</tr></thead><tbody>${COMPARE.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th>${v.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`)}
${clause(3, "Déroulé d'une collaboration", `<ol class="md-steps">${ETAPES.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol>`)}
${clause(4, "Questions fréquentes", `<div class="md-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`)}
${clause(5, "Estimer une mission", `<p>L'estimateur ci-dessous calcule un ordre de grandeur en fonction du nombre de jours. Il ne remplace pas une proposition écrite.</p><p>${btn("Ouvrir l'estimateur", "/rendez-vous")}</p>`)}</div></section>`),
  sec(footer(c)),
];

const missions = (c) => [
  sec(header(c)),
  head("Références", "Missions menées", "Huit missions récentes, présentées avec leur contexte, leur méthode et leur résultat. Les noms sont fictifs."),
  sec(`<section class="md-sec pk-bleed"><div class="md-w"><div class="md-filt" data-filters role="group" aria-label="Filtrer par secteur"><a class="md-chip is-on" href="#tous" role="button" data-sect="tous" aria-pressed="true">Tous les secteurs</a>${Object.entries(SECTEURS).map(([k, v]) => `<a class="md-chip" href="#${k}" role="button" data-sect="${k}" aria-pressed="false">${esc(v)}</a>`).join("")}</div>
<ul class="md-ml md-ml--full" data-list>${MISSIONS.map(missionCard).join("")}</ul><p class="md-empty" data-empty hidden>Aucune mission dans ce secteur pour le moment.</p></div></section>`),
  sec(footer(c)),
];

const mission = (c) => { const m = MISSIONS[0]; return [
  sec(header(c)),
  sec(`<section class="md-ph pk-bleed"><div class="md-w md-ph-in"><p class="md-art" data-m-sect>Mission · ${esc(SECTEURS[m[2]])} · ${esc(m[3])}</p><div><div class="md-h1" role="heading" aria-level="1" data-m-title>${esc(m[1])}</div><p class="md-lead" data-m-ctx>${esc(m[5])}</p></div></div></section>`),
  sec(`<section class="md-sec pk-bleed"><div class="md-w"><div class="md-case" data-case>
${clause(1, "Le contexte", `<p data-m-ctx2>${esc(m[5])} La direction souhaitait un résultat mesurable avant la fin de l'exercice, sans bloquer la production ni recruter.</p>`)}
${clause(2, "Ce qui a été fait", `<ol class="md-steps" data-m-steps>${m[6].map((x, i) => `<li><b>Étape ${i + 1}</b><span>${esc(x)}</span></li>`).join("")}</ol>`)}
${clause(3, "Le résultat", `<p class="md-big"><b data-m-k>${esc(m[7])}</b><span data-m-kl>${esc(m[8])}</span></p><p data-m-res>${esc(m[4])}. Les chiffres sont suivis chaque mois par la direction, avec le tableau remis en fin de mission.</p>`)}
</div>
<div class="md-data" data-data hidden>${MISSIONS.map((x) => `<article data-slug="${x[0]}" data-title="${esc(x[1])}" data-ctx="${esc(x[5])}" data-sect="${esc(SECTEURS[x[2]])} · ${esc(x[3])}" data-k="${esc(x[7])}" data-kl="${esc(x[8])}" data-res="${esc(x[4])}">${x[6].map((s) => `<p>${esc(s)}</p>`).join("")}</article>`).join("")}</div>
<p class="md-fine">Mission de démonstration, entreprise fictive. <a href="/missions">Voir toutes les missions</a>.</p></div></section>`),
  sec(`<section class="md-cta pk-bleed"><div class="md-w md-cta-in"><div><h2 class="md-h2">Une situation proche de la vôtre ?</h2><p class="md-lead">Racontez-la en trente minutes, je vous dirai franchement si je peux aider.</p></div><div class="md-actions">${btn("Choisir un créneau", "/rendez-vous")}</div></div></section>`),
  sec(footer(c)),
]; };

const rdv = (c) => [
  sec(header(c)),
  head("Prise de rendez-vous", "Estimer, puis choisir un créneau", "Deux outils pour préparer notre premier échange. Rien n'est enregistré : vous obtenez un récapitulatif à copier ou à m'envoyer."),
  sec(`<section class="md-sec pk-bleed"><div class="md-w md-two">
<div class="md-tool" data-est>${clause(1, "Estimer une mission", `<div class="md-fields"><div class="md-fld"><span class="md-fl">Type de mission</span><div class="md-opts" role="group" aria-label="Type de mission">${[["diag", "Diagnostic", 780], ["cible", "Mission ciblée", 720], ["atelier", "Atelier d'équipe", 840], ["interim", "Direction commerciale par intérim", 900]].map((o, i) => `<a class="md-opt${i === 0 ? " is-on" : ""}" href="#t-${o[0]}" role="button" aria-pressed="${i === 0}" data-type="${o[0]}" data-tjm="${o[2]}">${o[1]}<small>${o[2]} € HT / jour</small></a>`).join("")}</div></div>
<div class="md-fld"><span class="md-fl">Nombre de jours</span><div class="md-step" role="group" aria-label="Nombre de jours"><a class="md-s" href="#moins" role="button" aria-label="Retirer un jour" data-d="-1">−</a><span class="md-days" data-days aria-live="polite">2</span><a class="md-s" href="#plus" role="button" aria-label="Ajouter un jour" data-d="1">+</a><span class="md-fine">de 1 à 30 jours</span></div></div>
<div class="md-fld"><span class="md-fl">Options</span><div class="md-opts" role="group" aria-label="Options"><a class="md-opt" href="#urgence" role="button" aria-pressed="false" data-opt="urgence" data-pct="15">Démarrage sous 15 jours<small>+ 15 %</small></a><a class="md-opt" href="#site" role="button" aria-pressed="false" data-opt="site" data-day="60">Travail sur site<small>+ 60 € HT / jour</small></a></div></div></div>
<div class="md-res" aria-live="polite"><p class="md-res-l">Estimation indicative</p><p class="md-res-p"><b data-ht>1 560 €</b> HT</p><p class="md-res-s">soit <span data-ttc>1 872 €</span> TTC (TVA 20 %) · <span data-rem></span></p><p class="md-fine">Dégressivité : 5 % dès 10 jours, 10 % dès 20 jours. Estimation fictive, sans valeur de devis.</p></div>`)}</div>
<div class="md-tool" data-slots>${clause(2, "Choisir un créneau", `<p class="md-fine">Dix prochains jours ouvrés, entretiens de trente minutes en visioconférence (heure de Paris).</p><div class="md-days-g" data-grid></div><p class="md-pick" data-pick role="status" aria-live="polite">Aucun créneau choisi.</p>
<div class="md-actions"><a class="md-btn" href="#copier" role="button" data-copy>Copier le récapitulatif ${ic("arr")}</a><a class="md-btn md-btn--g" href="/contact">Envoyer par le formulaire</a></div>`)}</div>
</div></section>`),
  sec(footer(c)),
];

const apropos = (c) => [
  sec(header(c)),
  head("Curriculum", "À propos", "Onze ans à vendre, quatre ans à diriger une équipe commerciale, sept ans à conseiller ceux qui se lancent dans la même aventure."),
  sec(`<section class="md-sec pk-bleed"><div class="md-w"><div class="md-ab"><div class="md-ab-p">${STAMP("ANOUK", "FERRAND")}<p class="md-fine">Portrait fictif : le tampon remplace volontairement une photographie.</p></div><div>
${clause(1, "Parcours", `<ol class="md-tl"><li><b>2004-2010</b><span>Commerciale puis responsable de secteur dans une entreprise de matériel médical.</span></li><li><b>2010-2015</b><span>Directrice commerciale d'une PME industrielle de 80 salariés.</span></li><li><b>2015-aujourd'hui</b><span>Consultante indépendante : quarante missions, de la fonderie à la librairie.</span></li></ol>`)}
${clause(2, "Méthode", `<p>Je commence par écouter ceux qui vendent et ceux qui livrent : ce sont eux qui savent où l'entreprise perd du temps. Je ne propose ensuite que des changements qu'une équipe peut tenir sans moi.</p><blockquote><p>Un bon conseil tient sur une page et se retrouve dans les gestes du lundi matin.</p></blockquote>`)}
${clause(3, "Engagements", `<ul class="md-ls"><li><b>Prix annoncé.</b> Le tarif est écrit avant de commencer.</li><li><b>Confidentialité.</b> Accord signé avant tout échange de documents.</li><li><b>Transmission.</b> Tous les livrables vous appartiennent.</li></ul>`)}</div></div></div></section>`),
  sec(footer(c)),
];

const blocs = (c) => [
  sec(header(c)),
  head("Annexe", "Éléments de page", "Titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés dans leur forme finale."),
  sec(`<section class="md-sec pk-bleed"><div class="md-w"><article class="md-prose">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec du <strong>gras</strong>, de l'<em>italique</em>, un <a href="/offres">lien</a>, du <code>code en ligne</code> et une <mark>mise en évidence</mark>. Le texte courant reste à 17 px minimum sur une ligne de 60 à 75 caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote><p>Une citation prend la marge comme une note de bas de lettre.</p><cite>Personne fictive</cite></blockquote>
<figure class="md-fig">${STAMP("PIÈCE", "jointe")}<figcaption>Image avec légende : le tampon est un dessin en ligne, avec texte alternatif.</figcaption></figure>
<div class="md-tw"><table><caption>Tableau défilant sur mobile</caption><thead><tr><th scope="col">Poste</th><th scope="col">Jours</th><th scope="col">Montant HT</th><th scope="col">Remarque</th></tr></thead><tbody><tr><td>Diagnostic</td><td>2</td><td>1 560 €</td><td>Rapport inclus</td></tr><tr><td>Ateliers</td><td>3</td><td>2 520 €</td><td>Avec vos équipes</td></tr></tbody></table></div>
<pre class="md-pre"><code>Objet : proposition de mission\nDurée : 10 jours\nTarif : 7 200 € HT</code></pre>
<p class="md-actions">${btn("Bouton principal", "/offres")}${btn("Bouton secondaire", "/missions", "md-btn--g")}</p>
<div class="md-cols"><div><h3>Colonne 1</h3><p>Deux colonnes côte à côte, empilées sur mobile.</p></div><div><h3>Colonne 2</h3><p>Chaque colonne garde une mesure de lecture confortable.</p></div></div>
<aside class="md-note"><b>Note.</b> Un encadré d'information, bordé d'un filet bleu.</aside><aside class="md-note md-note--w"><b>Important.</b> Un encadré de mise en garde, bordé de rouge tampon.</aside>
</article></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  head("Correspondance", "Contact", "Décrivez votre situation en quelques lignes : je réponds sous deux jours ouvrés, par écrit ou par téléphone selon votre préférence."),
  { type: "form", heading: "Écrire à Anouk Ferrand", intro: "Le formulaire fonctionne comme sur un vrai site ; dans cette démonstration, personne ne lira votre message." },
  sec(`<section class="md-sec pk-bleed"><div class="md-w md-two"><div>${clause(1, "Avant d'écrire", `<ul class="md-ls"><li>Indiquez le secteur et la taille de votre entreprise.</li><li>Dites quel problème vous voulez voir disparaître.</li><li>Précisez l'échéance, même approximative.</li></ul>`)}</div><div>${clause(2, "Autres moyens", `<p>Pour un premier échange, vous pouvez aussi <a href="/rendez-vous">réserver trente minutes</a>. Adresse de correspondance : bonjour@anouk-ferrand.example (fictive).</p>`)}</div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  head("Recherche", "Rechercher sur le site", "Une formule, une mission, un mot : tapez ce que vous cherchez."),
  { type: "layout", children: [{ type: "search", props: { target: "catalogue", placeholder: "Rechercher une formule, une mission…", button: "Chercher" } }] },
  sec(`<section class="md-sec pk-bleed"><div class="md-w"><div class="md-none"><div class="md-none-s" aria-hidden="true">${STAMP("AUCUN", "résultat")}</div><div><h2 class="md-h2">Aucun résultat ?</h2><p>Essayez un mot plus court ou parcourez les pages principales : <a href="/offres">offres et tarifs</a>, <a href="/missions">missions</a>, <a href="/rendez-vous">rendez-vous</a>. Vous pouvez aussi <a href="/contact">poser la question directement</a>.</p></div></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="md-404 pk-bleed"><div class="md-w md-404-in"><div class="md-404-s" aria-hidden="true">${STAMP("REFUSÉ", "404")}</div><div><p class="md-art">Courrier retourné à l'expéditeur</p><div class="md-h1" role="heading" aria-level="1">Cette page est introuvable</div><p class="md-lead">L'adresse n'existe pas ou a été déplacée. Le plus simple : repartir de l'accueil ou de la liste des offres.</p><div class="md-actions">${btn("Retour à l'accueil", "/")}${btn("Voir les offres", "/offres", "md-btn--g")}${btn("Contact", "/contact", "md-btn--g")}</div></div></div></section>`),
  sec(footer(c)),
];
const legal = (art, title, items) => (c) => [
  sec(header(c)),
  head(art, title, "Texte de démonstration, à adapter par l'éditrice réelle du site."),
  sec(`<section class="md-sec pk-bleed"><div class="md-w"><article class="md-prose">${items.map(([t, p]) => `<h2>${esc(t)}</h2><p>${p}</p>`).join("")}<p><a href="/contact">Une question sur ce texte ? Écrivez-moi.</a></p></article></div></section>`),
  sec(footer(c)),
];
const mentions = legal("Mentions", "Mentions légales", [
  ["Éditrice", "Ce site de démonstration présente une consultante fictive, Anouk Ferrand, entrepreneuse individuelle imaginaire. Remplacez ces lignes par votre identité, votre adresse, votre numéro SIREN et, le cas échéant, votre numéro de TVA."],
  ["Directrice de la publication", "Anouk Ferrand (personne fictive), joignable par le <a href=\"/contact\">formulaire de contact</a>."],
  ["Hébergement", "Indiquez ici la dénomination, l'adresse et les coordonnées de l'hébergeur réel du site."],
  ["Propriété intellectuelle", "Les textes, les dessins en ligne (signature, tampons) et la présentation de ce thème sont fournis pour la démonstration."],
  ["Tarifs et offres", "Les tarifs affichés sont fictifs. Une proposition écrite fait seule foi entre le consultant et son client."],
]);
const confidentialite = legal("Confidentialité", "Politique de confidentialité", [
  ["Données collectées", "Le formulaire de contact recueille votre nom, votre adresse e-mail, le nom de votre entreprise et votre message. L'estimateur et le choix de créneau fonctionnent dans votre navigateur et n'envoient rien."],
  ["Finalité", "Répondre à votre demande et, si elle aboutit, préparer une proposition commerciale. Aucune donnée n'est revendue."],
  ["Conservation", "Les messages restent conservés trois ans au plus après le dernier échange, puis sont supprimés."],
  ["Vos droits", "Accès, rectification, suppression, opposition : écrivez via le <a href=\"/contact\">formulaire de contact</a>. Vous pouvez aussi saisir l'autorité de contrôle compétente."],
  ["Témoins de connexion", "Ce thème ne dépose aucun cookie de suivi."],
]);

module.exports = {
  key: "mandat", name: "Mandat", version: "1.0.0", category: "services", tags: ["classique", "editorial", "chaleureux"], siteType: "Freelance / consultant indépendant", collection: "pro",
  concept: "Le site d'une consultante vu comme un courrier contractuel : papier à lettre, articles numérotés, tampon rouge, signature dessinée, estimateur de mission calculé en direct et choix d'un créneau de rendez-vous.",
  description: "Site de consultant indépendant : papier crème, encre bleu carbone, tampon rouge, articles numérotés, formules et comparatif, missions filtrables, estimateur de tarif et créneaux de rendez-vous réels, FAQ.",
  brand: "Anouk Ferrand", modules: ["formulaires", "recherche"],
  contentModel: "Offres, tarifs, missions, FAQ et créneaux sont écrits dans les pages du thème ou calculés dans le navigateur (aucun type de contenu ni agenda du CMS n'est simulé) ; aucune réservation n'est enregistrée.",
  dna: {
    header: "papier-a-en-tete-nom-en-serif-et-bouton-de-rendez-vous-encadre",
    hero: "lettre-dactylographiee-avec-signature-dessinee-et-tampon-de-disponibilite",
    grid: "articles-numerotes-en-marge-gauche-et-corps-de-clause-a-droite",
    typo: "baskervville-pour-les-titres-et-geologica-pour-les-clauses",
    shapes: "filets-doubles-tampons-ronds-encadres-a-angle-droit-et-cases-a-cocher",
    motion: "tampon-qui-s-appose-compteurs-de-chiffres-et-resume-qui-se-met-a-jour",
    rhythm: "clauses-separees-par-des-filets-fins-et-bandes-de-papier-alternees",
    signature: "estimateur-de-mission-en-direct-et-grille-de-creneaux-de-rendez-vous-reels",
    palette: "papier-creme-encre-bleu-carbone-et-rouge-tampon",
    image: "dessins-en-ligne-signature-et-tampons-sans-photographie",
    list: "dossiers-de-mission-en-lignes-avec-chiffre-cle-a-droite",
    article: "etude-de-cas-en-trois-articles-contexte-methode-resultat",
    sidebar: "aucune-colonne-laterale-les-articles-numerotes-font-office-de-marge",
    reading: "geologica-17-px-ligne-de-66-caracteres-articles-a-marge-gauche",
  },
  tokens: {
    colors: { primary: "#27409c", secondary: "#14161f", accent: "#c4361f", background: "#f2efe7", surface: "#fbf9f3", text: "#14161f", muted: "#545866", success: "#13803f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.baskervville", body: "font.geologica", button: "font.geologica", link: "font.geologica" },
    radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#14161f" },
    type: { h1: { size: 56, weight: 400, lineHeight: 1.08, transform: "none" }, h2: { size: 32, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "encre", label: "Encre (couleur principale)", type: "color", default: "#27409c" },
    { key: "tampon", label: "Rouge tampon", type: "color", default: "#c4361f" },
    { key: "entete", label: "En-tête", type: "choice", default: "papier", choices: [["papier", "Papier à en-tête"], ["marge", "Marge verticale à gauche"], ["bandeau", "Bandeau sombre"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "lettre", choices: [["lettre", "Formule de politesse et signature"], ["clauses", "Colonnes sobres"]] },
    { key: "liste", label: "Liste des missions", type: "choice", default: "dossiers", choices: [["dossiers", "Dossiers en lignes"], ["cartes", "Cartes"], ["frise", "Frise compacte"]] },
    { key: "papier", label: "Fond de page", type: "choice", default: "creme", choices: [["creme", "Papier crème"], ["blanc", "Blanc"], ["quadrille", "Papier quadrillé"]] },
    { key: "tampon-anim", label: "Tampon animé", type: "choice", default: "on", choices: [["on", "Apposé à l'arrivée"], ["off", "Fixe"]] },
  ],
  menu: [["Accueil", "/"], ["Offres", "/offres"], ["Missions", "/missions"], ["Rendez-vous", "/rendez-vous"], ["À propos", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "offres", name: "Offres et tarifs", render: offres }, { key: "missions", name: "Missions", render: missions }, { key: "mission", name: "Étude de cas", render: mission },
    { key: "rendez-vous", name: "Estimation et rendez-vous", render: rdv }, { key: "a-propos", name: "À propos", render: apropos }, { key: "blocs", name: "Éléments de page", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite },
  ],
};
