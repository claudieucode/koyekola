// Sève — maison de santé pluridisciplinaire. Direction artistique : jardin apaisant. Lin chaud, prune profonde, sauge et miel ; Fraunces (serif doux), formes de galets et d'arches,
// feuillages dessinés au trait, barre d'urgence rassurante avec réglage de la taille du texte, parcours patient en sentier sinueux, exercice de respiration, conseils dépliables.
const { sec, esc, nav } = require("../kit");

/* ---------- illustrations (SVG en ligne, sans identifiants) ---------- */
const leaf = (x, y, r, s, fill, op = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C12-20 36-20 52 0C36 20 12 20 0 0Z" fill="${fill}" opacity="${op}"/><path d="M4 0H46" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".4"/></g>`;
const sprout = (cls = "sv-spr") => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 58V30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M32 34C32 20 22 14 8 14c0 14 8 20 24 20z" fill="currentColor" opacity=".9"/><path d="M32 28C32 16 40 8 56 8c0 14-8 20-24 20z" fill="currentColor" opacity=".6"/></svg>`;

const ICON = {
  gen: `<path d="M24 38S9 29 9 19a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 10-15 19-15 19z"/><path d="M24 17v11M18.5 22.5h11"/>`,
  ped: `<path d="M24 42V24"/><path d="M24 28c0-8-6-13-15-13 0 9 5 13 15 13z"/><path d="M24 24c0-7 5-12 14-12 0 8-4 12-14 12z"/>`,
  sage: `<circle cx="24" cy="24" r="15"/><circle cx="24" cy="27" r="6"/><path d="M24 9v6"/>`,
  kine: `<circle cx="24" cy="10" r="4"/><path d="M24 16v13M11 22l13-5 13 5M24 29l-7 13M24 29l7 13"/>`,
  osteo: `<rect x="19" y="5" width="10" height="7" rx="3"/><rect x="18" y="15" width="12" height="7" rx="3"/><rect x="17" y="25" width="14" height="7" rx="3"/><rect x="18" y="35" width="12" height="7" rx="3"/>`,
  podo: `<path d="M18 40c-5 0-7-6-7-14s3-16 8-16 6 5 6 12c0 11-2 18-7 18z"/><circle cx="31" cy="12" r="2.4"/><circle cx="37" cy="16" r="2.2"/><circle cx="40" cy="22" r="2"/><circle cx="41" cy="28" r="1.8"/>`,
  psy: `<circle cx="18" cy="24" r="11"/><circle cx="30" cy="24" r="11"/>`,
  diet: `<path d="M24 15c-5-4-15-2-15 9 0 9 6 17 11 17 2 0 2-1 4-1s2 1 4 1c5 0 11-8 11-17 0-11-10-13-15-9z"/><path d="M24 15c0-5 3-8 8-9"/>`,
  inf: `<path d="M24 6C16 16 12 22 12 29a12 12 0 0 0 24 0c0-7-4-13-12-23z"/><path d="M24 24v10M19 29h10"/>`,
};
const icon = (k, cls = "sv-ic") => `<span class="${cls}"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg></span>`;

const SKIN = ["#f0c6a0", "#d89c74", "#b57553", "#8a5a3c", "#f5d5ba"];
const HAIR = ["#3b2a22", "#1f1a1a", "#7a4a2a", "#c9a15b", "#9a9a9a", "#5a2f3d", "#2a2320"];
const COAT = ["#fffdf9", "#dce6d3", "#f1d6cc", "#e8dcef"];
const avatar = (i) => {
  const sk = SKIN[i % 5], hr = HAIR[(i * 3) % 7], ct = COAT[i % 4], bg = ["#dce6d3", "#f6dfc2", "#e8dcef", "#f1d6cc"][i % 4];
  const hairs = [
    `<path d="M62 100c0-34 20-48 38-48s38 14 38 48c-8-18-22-24-38-24s-30 6-38 24z" fill="${hr}"/>`,
    `<path d="M58 118c-6-44 14-66 42-66s48 22 42 66c-4-14-6-30-8-38-12 6-40 6-52-2-2 8-4 24-24 40z" fill="${hr}"/><path d="M58 112c0 24 4 40 10 46l8-10c-6-10-8-24-8-36z" fill="${hr}"/><path d="M142 112c0 24-4 40-10 46l-8-10c6-10 8-24 8-36z" fill="${hr}"/>`,
    `<circle cx="100" cy="48" r="17" fill="${hr}"/><path d="M62 100c0-30 18-42 38-42s38 12 38 42c-10-16-22-20-38-20s-28 4-38 20z" fill="${hr}"/>`,
    `<path d="M64 98c0-28 16-40 36-40s36 12 36 40c-6-10-14-16-36-16s-30 6-36 16z" fill="${hr}"/>`,
  ];
  return `<svg viewBox="0 0 200 240" aria-hidden="true"><rect width="200" height="240" fill="${bg}"/><circle cx="150" cy="50" r="30" fill="#ffffff" opacity=".45"/>
  <path d="M20 240c0-52 32-80 80-80s80 28 80 80z" fill="${ct}"/><path d="M82 160l18 30 18-30" fill="none" stroke="#4f2547" stroke-width="3" opacity=".5"/>
  <rect x="88" y="130" width="24" height="34" rx="10" fill="${sk}"/><ellipse cx="100" cy="106" rx="35" ry="40" fill="${sk}"/>${hairs[i % 4]}
  <circle cx="86" cy="108" r="3.2" fill="#2a1f2b"/><circle cx="114" cy="108" r="3.2" fill="#2a1f2b"/><path d="M90 126c6 6 14 6 20 0" fill="none" stroke="#2a1f2b" stroke-width="3" stroke-linecap="round"/></svg>`;
};

const heroArt = () => `<svg viewBox="0 0 480 580" aria-hidden="true">
  <rect width="480" height="580" fill="#f6e3cf"/><circle cx="330" cy="200" r="118" fill="#e9a53a" opacity=".18"/><circle cx="330" cy="200" r="76" fill="#e9a53a" opacity=".92"/>
  <path d="M0 390C80 336 170 346 250 376S410 404 480 346V580H0z" fill="#cddcc3"/><path d="M0 448C100 396 200 428 284 446S424 466 480 416V580H0z" fill="#9fbb98"/>
  <path d="M0 512C130 478 250 512 480 478V580H0z" fill="#4f2547"/>
  <path d="M-10 528C60 446 124 366 192 256C224 204 262 156 306 124" fill="none" stroke="#3f5f46" stroke-width="5" stroke-linecap="round"/>
  ${leaf(52, 452, -62, 1, "#3f5f46")}${leaf(70, 436, 8, 1.1, "#6f9a6b")}${leaf(104, 392, -70, 1.1, "#6f9a6b")}${leaf(118, 380, 6, 1, "#3f5f46")}${leaf(150, 332, -64, 1.2, "#3f5f46")}${leaf(166, 318, 10, 1.1, "#6f9a6b")}
  ${leaf(194, 262, -66, 1.2, "#6f9a6b")}${leaf(212, 242, 6, 1.2, "#3f5f46")}${leaf(236, 200, -60, 1.1, "#3f5f46")}${leaf(256, 186, 14, 1.1, "#6f9a6b")}${leaf(282, 150, -50, 1, "#6f9a6b")}${leaf(300, 128, -10, 0.9, "#3f5f46")}
  <circle cx="90" cy="300" r="4" fill="#e9a53a"/><circle cx="62" cy="262" r="3" fill="#fffdf9"/><circle cx="140" cy="230" r="3.5" fill="#e9a53a"/><circle cx="380" cy="360" r="3" fill="#fffdf9"/>
  <path d="M376 96l10 7 10-7" fill="none" stroke="#4f2547" stroke-width="2.4" stroke-linecap="round"/><path d="M410 124l8 6 8-6" fill="none" stroke="#4f2547" stroke-width="2.4" stroke-linecap="round"/></svg>`;

const phArt = () => `<svg class="sv-ph-art" viewBox="0 0 320 260" aria-hidden="true"><path d="M60 40C120-10 250 0 290 70s-10 150-80 175-170 0-190-80S0 80 60 40z" fill="#dce6d3"/><path d="M160 250C150 190 170 130 220 70" fill="none" stroke="#3f5f46" stroke-width="4" stroke-linecap="round"/>${leaf(165, 205, -70, 1.1, "#6f9a6b")}${leaf(175, 170, 10, 1, "#3f5f46")}${leaf(190, 135, -64, 1.1, "#3f5f46")}${leaf(206, 104, 6, 1, "#6f9a6b")}${leaf(218, 76, -50, 0.9, "#6f9a6b")}<circle cx="90" cy="90" r="30" fill="#e9a53a" opacity=".85"/></svg>`;
const wave = (cls = "") => `<svg class="sv-wave ${cls}" viewBox="0 0 1440 90" aria-hidden="true"><path d="M0 50C220 100 440 0 720 44S1200 96 1440 30V90H0z" fill="currentColor"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---------- données fictives ---------- */
const HOURS = [["Lundi", "8 h – 19 h"], ["Mardi", "8 h – 19 h"], ["Mercredi", "8 h – 19 h"], ["Jeudi", "8 h – 19 h"], ["Vendredi", "8 h – 18 h"], ["Samedi", "9 h – 12 h 30"], ["Dimanche", "Fermé"]];
const CARE = [
  ["gen", "Médecine générale", "famille", "Suivi régulier, prévention, bilans, orientation et coordination avec les autres praticiens de la maison.", "Adultes et familles"],
  ["ped", "Pédiatrie", "famille", "Croissance, vaccinations selon le calendrier en vigueur, questions de sommeil et d'alimentation des petits.", "De la naissance à l'adolescence"],
  ["sage", "Sage-femme", "famille", "Suivi de grossesse, préparation à la naissance, rééducation du périnée, accompagnement après l'accouchement.", "Futurs et jeunes parents"],
  ["kine", "Kinésithérapie", "corps", "Rééducation après blessure ou opération, douleurs de dos, mobilité, exercices à pratiquer chez soi.", "Sur prescription"],
  ["osteo", "Ostéopathie", "corps", "Approche manuelle des tensions et gênes musculo-squelettiques, en complément du suivi médical.", "Adultes, enfants"],
  ["podo", "Podologie", "corps", "Bilan de la marche et de la posture, soins des pieds, semelles adaptées lorsque cela est utile.", "Tous âges, sportifs"],
  ["psy", "Psychologie", "esprit", "Un espace d'écoute confidentiel pour traverser une période difficile, le stress ou un deuil.", "Adolescents, adultes"],
  ["diet", "Diététique", "nutrition", "Rééquilibrage alimentaire pensé avec vous, sans interdits : habitudes, plaisir et contraintes du quotidien.", "Adultes, enfants"],
  ["inf", "Soins infirmiers", "corps", "Prises de sang, pansements, injections et suivi de traitement, au cabinet ou selon organisation, à domicile.", "Sur prescription"],
];
const TEAM = [
  ["Dr Camille Aubry", "Médecin généraliste", "Lun · Mar · Jeu", "Passionnée de médecine de famille, Camille prend le temps d'expliquer chaque décision et d'écouter ce que vous en pensez.", "Sa devise : une question vaut toujours d'être posée."],
  ["Dr Malik Benssaïd", "Pédiatre", "Mar · Mer · Ven", "Malik accompagne les enfants et leurs parents dans les premières années : croissance, sommeil, alimentation, petits bobos du quotidien.", "Il joue du ukulélé pour rassurer les plus timides."],
  ["Inès Verdier", "Sage-femme", "Lun · Mer · Ven", "Inès suit les grossesses et soutient les jeunes parents, du premier rendez-vous aux semaines qui suivent la naissance.", "Elle anime des ateliers collectifs un samedi par mois."],
  ["Théo Garnier", "Kinésithérapeute", "Du lundi au vendredi", "Rééducation, mobilité, exercices à refaire chez soi : Théo adapte le rythme à votre quotidien et à vos envies.", ""],
  ["Nora Lefèvre", "Psychologue", "Mar · Jeu · Sam", "Dans un cadre confidentiel et sans jugement, Nora vous accompagne à votre rythme, par la parole.", ""],
  ["Hugo Marchetti", "Ostéopathe", "Lun · Jeu · Sam", "Hugo associe écoute et gestes doux, en lien avec le reste de l'équipe lorsque vous le souhaitez.", ""],
  ["Léa Tran", "Diététicienne", "Mer · Ven", "Léa construit avec vous des repères alimentaires simples, adaptés à votre vie et à votre budget.", ""],
  ["Sophie Roussel", "Infirmière", "Du lundi au samedi", "Soins, pansements et suivi de traitement : Sophie veille à ce que chaque geste soit expliqué.", ""],
  ["Yann Collet", "Podologue", "Mar · Ven", "Bilan de posture, soins des pieds et semelles sur mesure lorsque c'est utile.", ""],
];
const STEPS = [
  ["Prendre contact", "Écrivez-nous via le formulaire en précisant le motif et le praticien souhaité, ou dites-nous simplement que vous ne savez pas à qui vous adresser : l'équipe vous oriente.", "Quelques lignes suffisent"],
  ["Être accueilli", "Arrivez dix minutes en avance. L'accueil vous installe dans une salle d'attente calme et vous indique le déroulé. Pensez à votre carte Vitale et à vos documents.", "Un lieu de plain-pied"],
  ["Prendre le temps d'échanger", "La consultation commence par l'écoute de votre histoire. Les examens, options et conseils vous sont expliqués avec des mots simples ; vous décidez avec le praticien.", "Vos questions sont bienvenues"],
  ["Construire votre plan de soins", "Si plusieurs praticiens interviennent, ils se coordonnent avec votre accord, pour que chacun connaisse ce qui a déjà été fait et que rien ne soit répété inutilement.", "Un seul fil conducteur"],
  ["Poursuivre le suivi", "Un point est fait au rythme qui vous convient : ajustements, conseils de prévention, prochains rendez-vous. Vous gardez la main à chaque étape.", "À votre rythme"],
];
const TIPS = [
  ["sommeil", "Sommeil", "Retrouver des soirées plus calmes", "7 min", "Le sommeil se prépare dès la fin d'après-midi. Quelques repères simples peuvent aider, sans en faire une contrainte.", ["Garder des horaires de coucher et de lever assez réguliers.", "Baisser les lumières et les écrans une heure avant de dormir.", "Éviter les repas lourds et la caféine en soirée.", "Si les difficultés durent plusieurs semaines, en parler à un professionnel de santé."]],
  ["mouvement", "Mouvement", "Bouger un peu chaque jour, sans se forcer", "5 min", "Il n'est pas nécessaire de faire du sport intensif : l'important est de bouger régulièrement et avec plaisir.", ["Marcher quelques minutes après les repas.", "Se lever et s'étirer toutes les heures en cas de travail assis.", "Choisir une activité que l'on aime, même modeste.", "En cas de douleur ou de maladie, demander conseil avant de reprendre."]],
  ["alimentation", "Alimentation", "Une assiette variée, sans culpabilité", "6 min", "Manger varié et à son rythme compte plus que les règles strictes. Chacun a des besoins différents selon son âge et sa santé.", ["Faire une place aux légumes, aux fruits et aux fibres.", "Boire de l'eau régulièrement dans la journée.", "Prendre le temps de manger, sans écran si possible.", "Pour un régime particulier, solliciter un avis personnalisé."]],
  ["enfants", "Enfants", "Accompagner un enfant avant un rendez-vous", "4 min", "Un rendez-vous médical peut impressionner un petit. Quelques mots à l'avance rendent souvent la visite plus sereine.", ["Expliquer simplement ce qui va se passer.", "Apporter son doudou ou un livre.", "Lui laisser poser ses questions au praticien.", "Montrer l'exemple : le calme des parents est contagieux."]],
  ["stress", "Stress", "Trois minutes pour retrouver son souffle", "3 min", "Respirer lentement aide beaucoup de personnes à se détendre. Cet exercice est un petit moment de pause, pas un traitement.", ["Inspirer par le nez pendant quatre secondes.", "Expirer doucement par la bouche pendant six secondes.", "Répéter pendant trois minutes, assis confortablement.", "Si l'anxiété est envahissante ou persiste, parlez-en à un professionnel."]],
  ["sommeil", "Sommeil", "La sieste : alliée ou piège ?", "4 min", "Une courte sieste peut redonner de l'énergie, mais une sieste trop longue peut décaler la nuit suivante.", ["Viser vingt minutes environ, avant 16 h.", "S'allonger dans un endroit calme et tamisé.", "Programmer un réveil doux.", "Si vous êtes très somnolent en journée, un avis médical est utile."]],
];
const FAQ = [
  ["rdv", "Prendre rendez-vous", [
    ["Comment prendre rendez-vous ?", "Utilisez le formulaire de la page Contact en indiquant le motif et le praticien souhaité. Dans cette démonstration, aucun envoi réel n'est garanti ; en situation réelle, l'équipe vous répondrait dans les meilleurs délais."],
    ["Puis-je être vu rapidement ?", "Les délais dépendent de la disponibilité de chaque praticien. Précisez dans votre message si votre demande est urgente ; l'équipe vous orientera, et en cas d'urgence vitale, appelez le 15 ou le 112."],
    ["Que faire si je ne sais pas à qui m'adresser ?", "Décrivez votre situation en quelques lignes : l'accueil vous proposera le professionnel le plus adapté."]]],
  ["venir", "Venir au cabinet", [
    ["Le cabinet est-il accessible en fauteuil roulant ?", "Les locaux sont de plain-pied avec un accès sans marche. Prévenez-nous si vous avez des besoins particuliers afin que nous puissions nous organiser."],
    ["Où se garer ?", "Quelques places sont situées devant la maison de santé, et un parking public se trouve à cinq minutes à pied. Vélos : un abri couvert est à votre disposition."],
    ["Puis-je venir accompagné ?", "Oui, avec votre accord et celui du praticien. Les enfants sont toujours accompagnés d'un adulte."]]],
  ["docs", "Documents et prise en charge", [
    ["Que dois-je apporter ?", "Votre carte Vitale, votre pièce d'identité, vos ordonnances et résultats d'examens récents, ainsi que la liste de vos médicaments."],
    ["Comment fonctionne le remboursement ?", "Il dépend de votre situation et des praticiens consultés. Renseignez-vous auprès de votre caisse d'assurance maladie et de votre complémentaire santé."],
    ["Les tarifs sont-ils affichés ?", "Dans une vraie structure, les tarifs seraient affichés à l'accueil et communiqués avant la consultation. Cette page est une démonstration et n'indique aucun prix."]]],
  ["donnees", "Confidentialité", [
    ["Mes informations sont-elles protégées ?", "Le secret médical s'applique à toute l'équipe. Les informations ne sont partagées entre praticiens qu'avec votre accord."],
    ["Puis-je consulter mon dossier ?", "Vous avez le droit d'accéder à votre dossier et de demander des précisions. Adressez votre demande au praticien concerné ou à l'accueil."]]],
];

/* ---------- gabarits ---------- */
const header = (c) => `<header class="sv-head pk-bleed">
  <div class="sv-alert"><div class="sv-alert-in"><p class="sv-urg"><span class="sv-pulse" aria-hidden="true"></span><strong>Urgence vitale ?</strong> Appelez le <b>15</b> ou le <b>112</b>.</p>
    <p class="sv-open" data-open="1-5:8-19;6:9-12.5" aria-live="polite">Horaires sur la page Infos pratiques</p>
    <div class="sv-size" role="group" aria-label="Taille du texte"><span class="sv-size-l">Texte</span><a href="#texte-normal" role="button" aria-pressed="true" data-size="normal" aria-label="Taille normale du texte">A</a><a href="#texte-grand" role="button" aria-pressed="false" data-size="grand" aria-label="Agrandir le texte">A+</a></div></div></div>
  <div class="sv-bar"><a class="sv-logo" href="/" aria-label="${esc(c.brand)} — accueil"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4C13 14 8 22 8 30a16 16 0 0 0 32 0c0-8-5-16-16-26z" fill="#4f2547"/><path d="M24 40V22M24 30c-4-1-7-4-8-8M24 26c3-1 6-4 7-8" fill="none" stroke="#e9a53a" stroke-width="2.6" stroke-linecap="round"/></svg><span class="sv-logo-t"><b>Sève</b><small>Maison de santé</small></span></a>
    <div class="sv-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <a class="sv-btn sv-btn--cta" href="/contact">Prendre rendez-vous</a>
    <details class="sv-burger"><summary aria-label="Ouvrir le menu"><span class="sv-bt">Menu</span><i></i><i></i></summary><div class="sv-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="sv-btn sv-btn--cta" href="/contact">Prendre rendez-vous</a></div></details></div></header>`;

const footer = (c) => `<footer class="sv-foot pk-bleed">${wave("sv-foot-wave")}<div class="sv-foot-in"><div class="sv-wrap sv-foot-grid">
  <div class="sv-foot-brand"><p class="sv-foot-logo">Sève</p><p>Maison de santé pluridisciplinaire.<br>Prendre soin, sans se presser.</p><address>12 rue des Tilleuls<br>31000 Toulouse<br>Accueil : 01 23 45 67 89</address></div>
  <div><h2 class="sv-foot-h">Le cabinet</h2>${nav(c.menu.slice(1, 6), "sv-fl")}</div>
  <div><h2 class="sv-foot-h">Aide</h2><a class="sv-fl" href="/faq">Questions fréquentes</a><a class="sv-fl" href="/infos">Horaires et accès</a><a class="sv-fl" href="/contact">Nous écrire</a><a class="sv-fl" href="/recherche">Rechercher</a></div>
  <div class="sv-foot-urg"><h2 class="sv-foot-h">Urgences</h2><p><b>15</b> SAMU<br><b>112</b> numéro d'urgence européen<br><b>3114</b> prévention du suicide</p></div></div>
  <p class="sv-legal sv-wrap">© Maison de santé Sève — site de démonstration. Praticiens, adresse, horaires et contenus fictifs. Les informations de ce site ne remplacent pas l'avis d'un professionnel de santé.</p></div></footer>`;

const pagehead = (path, kicker, title, sub) => sec(`<section class="sv-ph pk-bleed"><div class="sv-wrap sv-ph-in"><div class="sv-ph-copy"><p class="sv-crumb" data-reveal><a href="/">Accueil</a> <span aria-hidden="true">/</span> ${esc(path)}</p><p class="sv-kicker" data-reveal>${esc(kicker)}</p><div class="sv-h1" role="heading" aria-level="1" data-reveal>${title}</div><p class="sv-ph-sub" data-reveal>${esc(sub)}</p></div>${phArt()}</div></section>`);

const careCard = ([ic, name, cat, text, who], i) => `<article class="sv-care sv-c${i % 3}" data-cat="${cat}" data-reveal>${icon(ic)}<h3>${esc(name)}</h3><p>${esc(text)}</p><p class="sv-care-who">${esc(who)}</p><a class="sv-more" href="/contact">Prendre rendez-vous ${arrow}</a></article>`;
const hoursTable = (cap = "Horaires d'ouverture") => `<table class="sv-hours"><caption class="sv-sr">${cap}</caption><thead><tr><th scope="col">Jour</th><th scope="col">Horaires</th></tr></thead><tbody>${HOURS.map(([d, h], i) => `<tr data-day="${(i + 1) % 7}"><th scope="row">${d}</th><td>${h}</td></tr>`).join("")}</tbody></table>`;

const artCard = ([cat, label, title, time, intro, tips]) => `<article class="sv-art" data-cat="${cat}" data-reveal><details><summary><span class="sv-tag">${label}</span><h3>${esc(title)}</h3><span class="sv-time">Lecture ${time}</span><span class="sv-plus" aria-hidden="true"></span></summary><div class="sv-art-body"><p>${esc(intro)}</p><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p class="sv-note">Conseil général, non personnalisé : il ne remplace pas une consultation.</p></div></details></article>`;

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="sv-hero pk-bleed"><div class="sv-wrap sv-hero-in">
    <div class="sv-hero-copy"><p class="sv-pill" data-reveal><span class="sv-dot" aria-hidden="true"></span>Maison de santé pluridisciplinaire · démonstration</p>
      <div class="sv-h1 sv-h1--xl" role="heading" aria-level="1" data-reveal>Prendre soin,<br><em>sans se presser.</em></div>
      <p class="sv-lead" data-reveal>Médecins, sage-femme, kinésithérapeute, psychologue, diététicienne… Une équipe réunie sous le même toit pour vous écouter, vous expliquer et coordonner vos soins.</p>
      <div class="sv-actions" data-reveal><a class="sv-btn sv-btn--cta sv-btn--lg" href="/contact">Prendre rendez-vous ${arrow}</a><a class="sv-btn sv-btn--soft sv-btn--lg" href="/soins">Découvrir les soins</a></div>
      <ul class="sv-reassure" data-reveal><li>Lieu de plain-pied</li><li>Salle d'attente calme</li><li>Explications en mots simples</li></ul></div>
    <div class="sv-hero-art" data-reveal><div class="sv-arch">${heroArt()}</div>
      <aside class="sv-float sv-float--a" aria-label="Aujourd'hui"><span class="sv-float-k">Aujourd'hui</span><b data-open-short="1-5:8-19;6:9-12.5">Consultez nos horaires</b></aside>
      <aside class="sv-float sv-float--b" aria-label="Équipe">${sprout("sv-float-ic")}<span><b>9 praticiens</b><small>8 disciplines</small></span></aside></div></div>
    ${wave("sv-hero-wave")}</section>`),
  sec(`<section class="sv-values pk-bleed"><div class="sv-wrap"><ul class="sv-values-in">
    <li data-reveal><span class="sv-seed">1</span><h2 class="sv-h3">Écouter d'abord</h2><p>Chaque consultation commence par votre histoire, pas par un formulaire.</p></li>
    <li data-reveal><span class="sv-seed">2</span><h2 class="sv-h3">Coordonner les soins</h2><p>Les praticiens échangent, avec votre accord, pour un suivi cohérent.</p></li>
    <li data-reveal><span class="sv-seed">3</span><h2 class="sv-h3">Prévenir et expliquer</h2><p>Des conseils clairs et des ateliers pour mieux comprendre sa santé.</p></li></ul></div></section>`),
  sec(`<section class="sv-care-sec pk-bleed"><div class="sv-wrap"><div class="sv-sechead"><div><p class="sv-kicker" data-reveal>Nos soins</p><h2 class="sv-h2" data-reveal>Une équipe,<br>huit disciplines.</h2></div><a class="sv-more sv-more--r" href="/soins" data-reveal>Tous les soins ${arrow}</a></div>
    <div class="sv-care-grid sv-care-grid--home">${CARE.slice(0, 6).map(careCard).join("")}</div></div></section>`),
  sec(`<section class="sv-breath pk-bleed"><div class="sv-wrap sv-breath-in"><div class="sv-breath-copy"><p class="sv-kicker sv-kicker--light" data-reveal>Une minute pour vous</p><h2 class="sv-h2 sv-h2--light" data-reveal>Respirons<br>ensemble.</h2><p class="sv-lead sv-lead--light" data-reveal>Suivez le rythme du cercle : inspirez quand il grandit, expirez quand il se rétracte. Un petit moment de pause, qui ne remplace pas un suivi de santé.</p></div>
    <div class="sv-breath-orb" data-breath data-reveal><span class="sv-ring sv-ring--3"></span><span class="sv-ring sv-ring--2"></span><span class="sv-ring sv-ring--1"></span><span class="sv-breath-core"><b data-breath-label>Inspirez</b></span></div></div></section>`),
  sec(`<section class="sv-path-sec pk-bleed"><div class="sv-wrap"><div class="sv-sechead"><div><p class="sv-kicker" data-reveal>Votre parcours</p><h2 class="sv-h2" data-reveal>De la première question<br>au suivi.</h2></div><a class="sv-more sv-more--r" href="/parcours" data-reveal>Voir le parcours ${arrow}</a></div>
    <ol class="sv-mini">${STEPS.slice(0, 4).map(([t, , tag], i) => `<li data-reveal><span class="sv-mini-n">${i + 1}</span><h3>${esc(t)}</h3><p>${esc(tag)}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="sv-team-sec pk-bleed"><div class="sv-wrap"><div class="sv-sechead"><div><p class="sv-kicker" data-reveal>L'équipe</p><h2 class="sv-h2" data-reveal>Des visages<br>que l'on connaît.</h2></div><a class="sv-more sv-more--r" href="/equipe" data-reveal>Rencontrer l'équipe ${arrow}</a></div>
    <div class="sv-faces">${TEAM.slice(0, 4).map((t, i) => `<figure class="sv-face" data-reveal><div class="sv-portrait">${avatar(i)}</div><figcaption><b>${esc(t[0])}</b><span>${esc(t[1])}</span></figcaption></figure>`).join("")}</div></div></section>`),
  sec(`<section class="sv-info pk-bleed"><div class="sv-wrap sv-info-in"><div class="sv-info-card" data-reveal><p class="sv-kicker">Horaires</p><h2 class="sv-h3 sv-h3--lg">Nous sommes là<br>presque tous les jours.</h2>${hoursTable()}<a class="sv-more" href="/infos">Accès et informations ${arrow}</a></div>
    <aside class="sv-urgence" data-reveal><span class="sv-urg-ic" aria-hidden="true">${sprout()}</span><h2 class="sv-h3 sv-h3--lg">En cas d'urgence</h2><p>Pour une urgence vitale, n'attendez pas : appelez le <b>15</b> (SAMU) ou le <b>112</b>. Notre formulaire n'est pas un service d'urgence.</p><a class="sv-btn sv-btn--light" href="/infos">Que faire en urgence ?</a></aside></div></section>`),
  sec(`<section class="sv-tips pk-bleed"><div class="sv-wrap"><div class="sv-sechead"><div><p class="sv-kicker" data-reveal>Conseils santé</p><h2 class="sv-h2" data-reveal>Petits gestes,<br>grands effets.</h2></div><a class="sv-more sv-more--r" href="/conseils" data-reveal>Tous les conseils ${arrow}</a></div>
    <div class="sv-tips-grid">${TIPS.slice(0, 3).map(([cat, label, title, time], i) => `<a class="sv-tipcard sv-t${i}" href="/conseils" data-reveal><span class="sv-tag">${label}</span><h3>${esc(title)}</h3><span class="sv-time">Lecture ${time}</span></a>`).join("")}</div></div></section>`),
  sec(`<section class="sv-final pk-bleed"><div class="sv-wrap sv-final-in" data-reveal>${sprout("sv-final-ic")}<h2 class="sv-h2 sv-h2--light">Une question ? Écrivez-nous.</h2><p class="sv-lead sv-lead--light">Dites-nous en quelques lignes ce qui vous amène : l'équipe vous oriente vers le bon interlocuteur.</p><a class="sv-btn sv-btn--cta sv-btn--lg" href="/contact">Prendre rendez-vous ${arrow}</a></div></section>`),
  sec(footer(c)),
];

const soins = (c) => [sec(header(c)), pagehead("Soins", "Spécialités", "Des soins<br><em>pour chaque moment de vie.</em>", "Neuf professionnels, huit disciplines. Filtrez par thème ou parcourez tout le cabinet."),
  sec(`<section class="sv-care-sec sv-care-sec--page pk-bleed sv-fscope"><div class="sv-wrap"><div class="sv-chips" role="group" aria-label="Filtrer les soins"><a href="#tous" role="button" aria-pressed="true" class="is-on" data-filter="tous">Tous</a><a href="#famille" role="button" aria-pressed="false" data-filter="famille">Famille et enfants</a><a href="#corps" role="button" aria-pressed="false" data-filter="corps">Corps et mouvement</a><a href="#esprit" role="button" aria-pressed="false" data-filter="esprit">Esprit</a><a href="#nutrition" role="button" aria-pressed="false" data-filter="nutrition">Alimentation</a></div>
    <p class="sv-count" aria-live="polite"><b data-fcount>9</b> soins affichés</p><div class="sv-care-grid">${CARE.map(careCard).join("")}</div></div></section>`),
  sec(`<section class="sv-note-sec pk-bleed"><div class="sv-wrap sv-note-in" data-reveal>${sprout("sv-note-ic")}<p><b>Bon à savoir.</b> Certains soins nécessitent une prescription médicale. Les prises en charge dépendent de votre situation : renseignez-vous auprès de votre caisse d'assurance maladie. En cas de doute, <a href="/contact">écrivez-nous</a>.</p></div></section>`),
  sec(footer(c))];

const equipe = (c) => [sec(header(c)), pagehead("Équipe", "Les praticiens", "Neuf professionnels,<br><em>un même souci de vous.</em>", "Des parcours différents, une façon commune de travailler : écoute, clarté et coordination."),
  sec(`<section class="sv-spot pk-bleed"><div class="sv-wrap">${TEAM.slice(0, 3).map((t, i) => `<article class="sv-spot-row${i % 2 ? " sv-spot-row--r" : ""}" data-reveal><div class="sv-portrait sv-portrait--lg">${avatar(i)}</div><div class="sv-spot-txt"><p class="sv-kicker">${esc(t[1])}</p><h2 class="sv-h2 sv-h2--m">${esc(t[0])}</h2><p class="sv-lead">${esc(t[3])}</p><p class="sv-quote">${esc(t[4])}</p><p class="sv-days"><span>Présence</span> ${esc(t[2])}</p></div></article>`).join("")}</div></section>`),
  sec(`<section class="sv-team-sec sv-team-sec--grid pk-bleed"><div class="sv-wrap"><div class="sv-sechead"><div><p class="sv-kicker">Et aussi</p><h2 class="sv-h2">Toute l'équipe</h2></div></div>
    <div class="sv-roster">${TEAM.slice(3).map((t, i) => `<article class="sv-mem" data-reveal><div class="sv-portrait">${avatar(i + 3)}</div><div class="sv-mem-t"><h3>${esc(t[0])}</h3><p class="sv-role">${esc(t[1])}</p><p>${esc(t[3])}</p><p class="sv-days"><span>Présence</span> ${esc(t[2])}</p></div></article>`).join("")}</div></div></section>`),
  sec(footer(c))];

const parcours = (c) => [sec(header(c)), pagehead("Parcours patient", "Étape par étape", "Votre parcours,<br><em>sans mauvaise surprise.</em>", "De la prise de contact au suivi : voici comment se déroule une prise en charge chez Sève."),
  sec(`<section class="sv-trail pk-bleed"><div class="sv-wrap"><ol class="sv-steps">${STEPS.map(([t, d, tag], i) => `<li class="sv-step${i % 2 ? " sv-step--r" : ""}" data-reveal><span class="sv-step-n" aria-hidden="true">${i + 1}</span><div class="sv-step-card"><p class="sv-step-tag">${esc(tag)}</p><h2 class="sv-h3 sv-h3--lg">${esc(t)}</h2><p>${esc(d)}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="sv-bring pk-bleed"><div class="sv-wrap sv-bring-in"><div data-reveal><p class="sv-kicker">Préparer sa venue</p><h2 class="sv-h2">À apporter<br>le jour du rendez-vous.</h2></div>
    <ul class="sv-check" data-reveal><li>Carte Vitale et pièce d'identité</li><li>Ordonnances et courriers récents</li><li>Résultats d'analyses ou d'imagerie</li><li>Liste de vos médicaments</li><li>Vos questions, notées si besoin</li></ul></div></section>`),
  sec(`<section class="sv-final sv-final--soft pk-bleed"><div class="sv-wrap sv-final-in" data-reveal><h2 class="sv-h2">Prêt à faire le premier pas ?</h2><p class="sv-lead">Un message suffit. Nous revenons vers vous pour organiser la suite.</p><a class="sv-btn sv-btn--cta sv-btn--lg" href="/contact">Nous écrire ${arrow}</a></div></section>`),
  sec(footer(c))];

const infos = (c) => [sec(header(c)), pagehead("Informations pratiques", "Horaires, accès, urgences", "Tout pour<br><em>venir sereinement.</em>", "Horaires d'ouverture, accès au cabinet et conduite à tenir en cas d'urgence."),
  sec(`<section class="sv-urg-sec pk-bleed"><div class="sv-wrap"><aside class="sv-urg-banner" data-reveal><span class="sv-urg-ic" aria-hidden="true">${sprout()}</span><div><h2 class="sv-h3 sv-h3--lg">Urgence : n'attendez pas.</h2><p>Malaise, difficulté à respirer, douleur intense, accident : appelez immédiatement le <b>15</b> (SAMU) ou le <b>112</b>. Pour une détresse psychique, le <b>3114</b> répond jour et nuit. Ce site n'est pas un service d'urgence.</p></div></aside></div></section>`),
  sec(`<section class="sv-practical pk-bleed"><div class="sv-wrap sv-practical-in"><div class="sv-info-card" data-reveal><p class="sv-kicker">Horaires</p><h2 class="sv-h3 sv-h3--lg">Ouverture de l'accueil</h2>${hoursTable()}<p class="sv-small">Les praticiens consultent sur rendez-vous, selon leurs jours de présence.</p></div>
    <div class="sv-access" data-reveal><p class="sv-kicker">Accès</p><h2 class="sv-h3 sv-h3--lg">Nous trouver</h2><address><b>Maison de santé Sève</b><br>12 rue des Tilleuls<br>31000 Toulouse</address>
      <dl class="sv-dl"><div><dt>Bus</dt><dd>Ligne 14, arrêt « Les Tilleuls » (2 min à pied)</dd></div><div><dt>Vélo</dt><dd>Abri couvert devant l'entrée</dd></div><div><dt>Voiture</dt><dd>Quelques places devant le cabinet, parking public à 5 min</dd></div><div><dt>Accessibilité</dt><dd>Entrée de plain-pied, sanitaires adaptés</dd></div></dl></div></div></section>`),
  { type: "layout", children: [{ type: "map", props: { address: "12 rue des Tilleuls, 31000 Toulouse", zoom: 14, height: 360 } }] },
  sec(`<section class="sv-final sv-final--soft pk-bleed"><div class="sv-wrap sv-final-in" data-reveal><h2 class="sv-h2">Besoin d'un renseignement ?</h2><p class="sv-lead">Notre accueil vous répond sur les horaires, l'accès et l'organisation.</p><a class="sv-btn sv-btn--cta sv-btn--lg" href="/contact">Nous contacter ${arrow}</a></div></section>`),
  sec(footer(c))];

const conseils = (c) => [sec(header(c)), pagehead("Conseils santé", "Le carnet de Sève", "Des repères simples,<br><em>à lire à votre rythme.</em>", "Conseils généraux rédigés par l'équipe (exemples fictifs de démonstration). Ils ne remplacent jamais une consultation."),
  sec(`<section class="sv-tips-page pk-bleed sv-fscope"><div class="sv-wrap"><div class="sv-chips" role="group" aria-label="Filtrer les conseils"><a href="#tous" role="button" aria-pressed="true" class="is-on" data-filter="tous">Tous</a><a href="#sommeil" role="button" aria-pressed="false" data-filter="sommeil">Sommeil</a><a href="#mouvement" role="button" aria-pressed="false" data-filter="mouvement">Mouvement</a><a href="#alimentation" role="button" aria-pressed="false" data-filter="alimentation">Alimentation</a><a href="#enfants" role="button" aria-pressed="false" data-filter="enfants">Enfants</a><a href="#stress" role="button" aria-pressed="false" data-filter="stress">Stress</a></div>
    <p class="sv-count" aria-live="polite"><b data-fcount>6</b> articles affichés</p><div class="sv-arts">${TIPS.map(artCard).join("")}</div></div></section>`),
  sec(`<section class="sv-note-sec pk-bleed"><div class="sv-wrap sv-note-in" data-reveal>${sprout("sv-note-ic")}<p><b>Important.</b> Ces contenus sont informatifs et généraux. En cas de symptômes, de doute ou de traitement en cours, demandez l'avis d'un professionnel de santé. Urgence : <b>15</b> ou <b>112</b>.</p></div></section>`),
  sec(footer(c))];

const faq = (c) => [sec(header(c)), pagehead("FAQ", "Questions fréquentes", "Vos questions,<br><em>nos réponses.</em>", "Rendez-vous, accès, documents, confidentialité : l'essentiel avant votre venue."),
  sec(`<section class="sv-faq pk-bleed sv-fscope"><div class="sv-wrap sv-faq-in"><aside class="sv-faq-side"><p class="sv-kicker">Thèmes</p><div class="sv-chips sv-chips--col" role="group" aria-label="Filtrer les questions"><a href="#tous" role="button" aria-pressed="true" class="is-on" data-filter="tous">Toutes les questions</a>${FAQ.map(([k, l]) => `<a href="#${k}" role="button" aria-pressed="false" data-filter="${k}">${l}</a>`).join("")}</div><p class="sv-count" aria-live="polite"><b data-fcount>${FAQ.reduce((n, g) => n + g[2].length, 0)}</b> questions</p></aside>
    <div class="sv-faq-list">${FAQ.map(([k, l, qs]) => qs.map(([q, a]) => `<details class="sv-q" data-cat="${k}" data-reveal><summary><span class="sv-q-t"><small>${l}</small>${esc(q)}</span><span class="sv-plus" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join("")).join("")}</div></div></section>`),
  sec(`<section class="sv-final sv-final--soft pk-bleed"><div class="sv-wrap sv-final-in" data-reveal><h2 class="sv-h2">Vous ne trouvez pas votre réponse ?</h2><p class="sv-lead">Écrivez-nous, nous vous répondons avec plaisir.</p><a class="sv-btn sv-btn--cta sv-btn--lg" href="/contact">Poser ma question ${arrow}</a></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("Contact", "Nous écrire", "Dites-nous<br><em>ce qui vous amène.</em>", "Quelques lignes suffisent : motif, praticien souhaité, disponibilités. Pas d'informations médicales détaillées par message."),
  sec(`<section class="sv-warn pk-bleed"><div class="sv-wrap"><p class="sv-warn-in" data-reveal><span class="sv-pulse" aria-hidden="true"></span><span><b>Urgence ?</b> Ne passez pas par ce formulaire : appelez le <b>15</b> ou le <b>112</b>.</span></p></div></section>`),
  { type: "form", heading: "Votre message", intro: "Nous vous répondons dès que possible pendant les heures d'ouverture. Ne transmettez pas d'informations médicales sensibles par ce formulaire." },
  sec(footer(c))];

const recherche = (c) => [sec(header(c)), pagehead("Recherche", "Rechercher", "Une information ?<br><em>Cherchons ensemble.</em>", "Un soin, un praticien, un conseil, une question."),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];

const introuvable = (c) => [sec(header(c)), sec(`<section class="sv-404 pk-bleed"><div class="sv-wrap sv-404-in">${phArt()}<p class="sv-kicker">Page introuvable</p><div class="sv-h1 sv-h1--xl" role="heading" aria-level="1">Oups, vous vous<br><em>êtes égaré.</em></div><p class="sv-lead">Cette page n'existe pas ou a changé d'adresse. Reprenons un chemin plus sûr.</p><div class="sv-actions"><a class="sv-btn sv-btn--cta sv-btn--lg" href="/">Retour à l'accueil</a><a class="sv-btn sv-btn--soft sv-btn--lg" href="/contact">Nous contacter</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "seve", name: "Sève", version: "2.0.0", category: "sante", tags: ["naturel", "chaleureux", "moderne"], siteType: "Maison de santé et cabinet de soins", featured: true,
  concept: "Un jardin apaisant : formes de galets et d'arches, feuillages dessinés, parcours patient en sentier, taille du texte réglable et conseils santé dépliables.",
  description: "Maison de santé pluridisciplinaire : lin chaud, prune, sauge et miel, formes organiques, barre d'urgence rassurante, soins filtrables, équipe, parcours patient, horaires et accès, conseils et FAQ.",
  brand: "Maison de santé Sève", modules: ["formulaires", "recherche", "cartes"],
  dna: { header: "barre-urgence-et-taille-du-texte", hero: "arche-botanique-et-galets-flottants", grid: "galets-organiques-et-sentier-du-parcours", motion: "respiration-guidee-et-feuillage-qui-pousse" },
  tokens: {
    colors: { primary: "#4f2547", secondary: "#2a1f2b", accent: "#e9a53a", background: "#f5f0e8", surface: "#fffdf9", text: "#2a1f2b", muted: "#5e5260", success: "#2f6b4f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.fraunces", body: "font.figtree", button: "font.figtree", link: "font.figtree" },
    radius: { sm: 12, md: 20, lg: 32, button: 999, field: 16, card: 28 }, shadow: { card: "0 14px 40px rgba(79,37,71,.12)", button: "0 6px 18px rgba(79,37,71,.22)" }, border: { width: 2, color: "#d9cfc0" },
    type: { h1: { size: 72, weight: 500, lineHeight: 1.04, transform: "none" }, h2: { size: 46, weight: 500, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur miel", type: "color", default: "#e9a53a" },
    { key: "plum", label: "Couleur principale (prune)", type: "color", default: "#4f2547" },
    { key: "formes", label: "Formes", type: "choice", default: "organique", choices: [["organique", "Galets organiques"], ["sobre", "Arrondis sobres"]] },
    { key: "urgence", label: "Barre d'urgence", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
    { key: "texte", label: "Taille du texte", type: "choice", default: "normal", choices: [["normal", "Normale"], ["grand", "Confortable"]] },
  ],
  menu: [["Accueil", "/"], ["Soins", "/soins"], ["Équipe", "/equipe"], ["Parcours", "/parcours"], ["Infos pratiques", "/infos"], ["Conseils", "/conseils"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "soins", name: "Soins et spécialités", render: soins }, { key: "equipe", name: "Équipe", render: equipe },
    { key: "parcours", name: "Parcours patient", render: parcours }, { key: "infos", name: "Informations pratiques", render: infos }, { key: "conseils", name: "Conseils santé", render: conseils },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
