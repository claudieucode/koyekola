// Glane — curation et veille. Direction artistique : le carnet d'une veilleuse. Papier clair, encre verte, surligneur jaune, étiquettes de masking tape légèrement penchées, notes en marge.
// Chaque lien est commenté (« pourquoi le lire »), classé par thème, source et date. Signature : filtres (thème, source, type, mot), suivi « lu », sélection « pour la lettre » et
// copie d'un digest en Markdown prêt à coller. La veille de démonstration (24 liens, 8 sources) est écrite dans les pages du thème ; les adresses sont des exemples (example.org),
// le CMS n'ayant pas de type de contenu « lien commenté ». Tout est fictif.
const { sec, esc, nav } = require("../kit");

const TH = { energie: "Énergie", donnees: "Données", regle: "Réglementation", usages: "Usages", materiel: "Matériel" };
const SRC = {
  rt: ["Revue Territoires", "Mensuel sur l'action publique locale."], jb: ["Journal du Bâtiment Sobre", "Quotidien professionnel de la construction sobre."], od: ["Observatoire des Données Ouvertes", "Études et jeux de données sur l'ouverture publique."], cn: ["Cahiers du Numérique Responsable", "Revue trimestrielle d'écoconception."],
  as: ["Atelier Sécurité", "Blog technique sur la sécurité des systèmes."], rf: ["Radio Fréquence Sobre", "Podcast hebdomadaire sur les réseaux et l'énergie."], cr: ["Collectif Réemploi", "Réseau de professionnels du réemploi du matériel."], iu: ["Institut des Usages", "Enquêtes sur les pratiques numériques."],
};
const TYP = { article: "Article", etude: "Étude", outil: "Outil", audio: "Podcast" };
// [id, titre, source, date, thème, type, minutes, note]
const IT = [
  [1, "Datacenters : la chaleur fatale enfin revendue aux piscines", "rt", "2026-11-04", "energie", "article", 6, "Trois exemples chiffrés, dont un contrat à 18 €/MWh. À lire avant de croire aux annonces."],
  [2, "Mesurer la consommation d'un site web sans outil payant", "cn", "2026-11-03", "usages", "outil", 8, "Un tutoriel qui fonctionne vraiment, avec les limites de la méthode clairement posées."],
  [3, "Le registre européen des appareils reconditionnés : mode d'emploi", "cr", "2026-11-03", "regle", "article", 5, "Ce que change l'obligation d'étiquetage pour les petits revendeurs. Utile et sans jargon."],
  [4, "Ouvrir ses données sans exposer ses habitants", "od", "2026-11-02", "donnees", "etude", 14, "Le meilleur retour d'expérience lu cette année sur l'anonymisation de données de mobilité."],
  [5, "Pourquoi nos mots de passe finissent dans des tableurs", "as", "2026-11-02", "usages", "article", 7, "Enquête auprès de 40 PME. Le constat est sévère, les solutions sont modestes et réalistes."],
  [6, "Écrans : prolonger la vie de 2 ans, un gain équivalent à 40 % du bilan", "cn", "2026-11-01", "materiel", "etude", 12, "Les hypothèses sont publiées, ce qui permet de contester les chiffres. Rare et précieux."],
  [7, "Réseaux ruraux : la fibre, oui, mais à quel coût énergétique ?", "rf", "2026-11-01", "energie", "audio", 38, "Une heure de débat contradictoire. Les dix dernières minutes valent le détour."],
  [8, "Les chiffres de la sobriété numérique dans les mairies", "iu", "2026-10-30", "usages", "etude", 10, "Premier panorama sur 300 communes. Attention aux échantillons : les grandes villes sont sous-représentées."],
  [9, "Directive sur l'écoconception : ce qui s'applique en 2027", "rt", "2026-10-28", "regle", "article", 9, "Un tableau synthétique par catégorie de produit, à garder sous la main."],
  [10, "Sauvegarder sans dupliquer : la règle du 3-2-1 revisitée", "as", "2026-10-27", "donnees", "article", 6, "Propose une version sobre de la règle classique, sans sacrifier la sécurité."],
  [11, "Un lecteur de cartes à 4 € qui prolonge les vieux ordinateurs", "cr", "2026-10-26", "materiel", "outil", 4, "Bricolage malin et documenté. Les risques de sécurité sont indiqués honnêtement."],
  [12, "Stockage à froid : jusqu'où ranger sans jamais consulter ?", "od", "2026-10-26", "donnees", "etude", 11, "Une étude qui chiffre ce que coûte le stockage de données que personne ne lit."],
  [13, "Bâtiments : le calcul qui montre que la rénovation bat la reconstruction", "jb", "2026-10-24", "energie", "article", 8, "La méthode de calcul est reproductible. Les conclusions, nuancées, tiennent."],
  [14, "Travail à distance : l'empreinte réelle, mesurée sur un an", "iu", "2026-10-23", "usages", "etude", 13, "Comparaison de deux entreprises. La principale surprise concerne les déplacements du week-end."],
  [15, "Aide à la réparation : où en sont les bonus dans les régions ?", "rt", "2026-10-22", "regle", "article", 5, "Carte des dispositifs en vigueur, mise à jour chaque mois. Les montants varient du simple au triple."],
  [16, "Le podcast des câbles : visite d'un atelier de sertissage", "rf", "2026-10-21", "materiel", "audio", 27, "Un épisode qui montre un métier invisible. On apprend plus qu'on ne le pense."],
  [17, "Choisir un hébergeur : six questions qui comptent vraiment", "cn", "2026-10-20", "usages", "article", 7, "Une grille simple pour comparer les engagements environnementaux sans se laisser éblouir."],
  [18, "Chiffrement des disques : les erreurs de configuration courantes", "as", "2026-10-20", "donnees", "article", 9, "Cinq erreurs observées sur le terrain, avec la correction pour chacune."],
  [19, "Un carnet de bord pour suivre la durée de vie de son matériel", "cr", "2026-10-19", "materiel", "outil", 3, "Modèle de tableur gratuit. Étonnamment efficace pour décider quand remplacer."],
  [20, "Programmation des chauffe-eau : économies mesurées chez 200 foyers", "jb", "2026-10-19", "energie", "etude", 10, "Résultats solides, protocole transparent. Les économies dépendent surtout de la taille du foyer."],
  [21, "Ce que le règlement sur les données change pour les associations", "od", "2026-10-19", "regle", "article", 6, "Un décryptage utile pour les petites structures, avec les échéances importantes."],
  [22, "Faut-il garder ses vieux mails ? Un calcul honnête", "iu", "2026-10-18", "usages", "article", 4, "Le résultat dément une idée reçue, et celle d'en face aussi."],
  [23, "Batteries d'ordinateurs : comment les garder en bonne santé", "cr", "2026-10-17", "materiel", "article", 5, "Conseils pratiques validés par un réparateur. Quatre gestes suffisent."],
  [24, "Énergie et réseaux : ce que les opérateurs publient (et ne publient pas)", "rf", "2026-10-16", "energie", "audio", 31, "Un entretien avec une chercheuse qui a épluché les rapports. Précis et mesuré."],
];
const WEEKS = [["Semaine du 2 novembre", (d) => d >= "2026-11-01"], ["Semaine du 26 octobre", (d) => d >= "2026-10-26" && d < "2026-11-01"], ["Semaine du 19 octobre", (d) => d >= "2026-10-19" && d < "2026-10-26"], ["Semaine du 12 octobre", (d) => d < "2026-10-19"]];
const MON = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MON[m - 1]}`; };
const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const url = (i) => `https://example.org/glane/${SRC[i[2]][0] ? slug(SRC[i[2]][0]) : "x"}/${slug(i[1]).slice(0, 40)}`;

const item = (i) => `<article class="gl-it" data-id="${i[0]}" data-th="${i[4]}" data-src="${i[2]}" data-typ="${i[5]}" data-txt="${esc((i[1] + " " + i[7]).toLowerCase())}"><div class="gl-it-m"><span class="gl-tape gl-tape--${i[4]}">${TH[i[4]]}</span><time datetime="${i[3]}">${dfr(i[3])}</time><span class="gl-it-s">${esc(SRC[i[2]][0])}</span></div><div class="gl-it-b"><h3 class="gl-it-t"><a href="${url(i)}" target="_blank" rel="noopener">${esc(i[1])}</a></h3><p class="gl-note"><mark>${esc(i[7])}</mark></p><p class="gl-it-f"><span>${TYP[i[5]]} · ${i[6]} min</span><a class="gl-pick" href="#garder-${i[0]}" role="button" aria-pressed="false" data-pick="${i[0]}">Pour la lettre</a><a class="gl-read" href="#lu-${i[0]}" role="button" aria-pressed="false" data-read="${i[0]}">Marquer comme lu</a></p></div></article>`;
const week = (w, k) => `<section class="gl-wk pk-bleed" data-week><div class="gl-wrap"><h2 class="gl-wk-h">${w[0]} <span class="gl-wk-n" data-wn></span></h2><div class="gl-list" data-grid>${IT.filter((i) => w[1](i[3])).map(item).join("")}</div></div></section>`;

const header = (c) => `<header class="gl-head pk-bleed"><div class="gl-wrap gl-head-in"><a class="gl-logo" href="/" aria-label="${esc(c.brand)} — accueil"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29V13M16 18C10 18 8 12 8 6c6 0 8 4 8 12zM16 22c5 0 8-4 8-9-5 0-8 3-8 9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${esc(c.brand)}</span></a><p class="gl-ed" data-ed>Veille numérique sobre · n° 87</p>
<div class="gl-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu.slice(1))}</div>
<details class="gl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="gl-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a href="/recherche">Rechercher</a></div></details></div></header>`;
const footer = (c) => `<footer class="gl-foot pk-bleed"><div class="gl-wrap gl-foot-in"><div class="gl-foot-b"><div class="gl-foot-logo">${esc(c.brand)}</div><p>Une veille hebdomadaire sur le numérique sobre : vingt-quatre liens commentés, triés par thème. Veille, sources et liens d'exemple, pour la démonstration.</p></div>
<div class="gl-foot-c"><h2>Lire</h2><a href="/veille">Toute la veille</a><a href="/themes">Par thème</a><a href="/sources">Les sources</a><a href="/note">La note de la semaine</a></div>
<div class="gl-foot-c"><h2>Le carnet</h2><a href="/apropos">À propos</a><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="/blocs">Éléments de page</a></div>
<div class="gl-foot-c"><h2>Légal</h2><a href="/mentions">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div></div>
<p class="gl-legal">© ${esc(c.brand)} — site de démonstration. Veilleuse, articles, sources et adresses sont fictifs.</p></footer>`;
const pagehead = (kick, title, sub, crumb) => sec(`<section class="gl-ph pk-bleed"><div class="gl-wrap"><p class="gl-crumb"><a href="/">Accueil</a> <span aria-hidden="true">/</span> ${esc(crumb || kick)}</p><p class="gl-kick">${esc(kick)}</p><div class="gl-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="gl-lead">${esc(sub)}</p>` : ""}</div></section>`);

const tools = () => `<section class="gl-tools pk-bleed" data-veille><div class="gl-wrap"><div class="gl-tl" role="group" aria-label="Filtres de la veille">
<div class="gl-chips" data-g="th"><span class="gl-lab">Thème</span><a class="gl-chip is-on" href="#theme-all" role="button" data-v="all" aria-pressed="true">Tous</a>${Object.entries(TH).map(([k, n]) => `<a class="gl-chip gl-tape--${k}" href="#theme-${k}" role="button" data-v="${k}" aria-pressed="false">${n}</a>`).join("")}</div>
<div class="gl-chips" data-g="typ"><span class="gl-lab">Type</span><a class="gl-chip is-on" href="#type-all" role="button" data-v="all" aria-pressed="true">Tous</a>${Object.entries(TYP).map(([k, n]) => `<a class="gl-chip" href="#type-${k}" role="button" data-v="${k}" aria-pressed="false">${n}</a>`).join("")}</div>
<div class="gl-chips" data-g="src"><span class="gl-lab">Source</span><a class="gl-chip is-on" href="#source-all" role="button" data-v="all" aria-pressed="true">Toutes</a>${Object.entries(SRC).map(([k, v]) => `<a class="gl-chip" href="#source-${k}" role="button" data-v="${k}" aria-pressed="false">${esc(v[0])}</a>`).join("")}</div></div>
<div class="gl-bar"><p class="gl-count" role="status"><b data-n>24</b> lien(s) · <b data-unread>24</b> non lu(s)</p><div class="gl-digest"><span class="gl-digest-n"><b data-pn>0</b> pour la lettre</span><a class="gl-btn" href="#copier" role="button" data-digest>Copier le digest (Markdown)</a></div></div></div></section>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="gl-hero pk-bleed"><div class="gl-wrap gl-hero-in"><div><p class="gl-kick">Numéro 87 · 4 novembre 2026</p><div class="gl-h1" role="heading" aria-level="1">Vingt-quatre liens lus <mark>pour que vous n'ayez pas à le faire</mark>.</div><p class="gl-lead">Chaque semaine, une veilleuse lit des dizaines de sources sur le numérique sobre et ne garde que ce qui vaut le détour, avec une note : pourquoi le lire, ce qu'il faut en penser.</p><p><a class="gl-btn" href="/veille">Ouvrir la veille</a> <a class="gl-btn gl-btn--o" href="/note">La note de la semaine</a></p></div>
<aside class="gl-card" aria-label="Chiffres de la veille"><p class="gl-card-t">Cette semaine</p><dl><div><dt>Liens retenus</dt><dd>8</dd></div><div><dt>Sources lues</dt><dd>112</dd></div><div><dt>Taux de rejet</dt><dd>93 %</dd></div></dl></aside></div></section>`),
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap"><div class="gl-sh"><h2 class="gl-h2">Les huit liens de la semaine</h2><a class="gl-more" href="/veille">Toute la veille →</a></div><div class="gl-list">${IT.slice(0, 8).map(item).join("")}</div></div></section>`),
  sec(`<section class="gl-s gl-s--t pk-bleed"><div class="gl-wrap"><div class="gl-sh"><h2 class="gl-h2">Cinq thèmes suivis</h2><a class="gl-more" href="/themes">Voir les thèmes →</a></div><ul class="gl-themes">${Object.entries(TH).map(([k, n]) => `<li><a href="/veille#theme-${k}"><span class="gl-tape gl-tape--${k}">${n}</span><b>${IT.filter((i) => i[4] === k).length} liens</b><span>${IT.filter((i) => i[4] === k)[0][1].slice(0, 56)}…</span></a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap gl-2"><div><h2 class="gl-h2">Comment je choisis</h2><p class="gl-lead">Quatre règles simples, appliquées à chaque lien : une source identifiable, des chiffres vérifiables, une idée neuve, un résultat que l'on peut utiliser.</p><p><a class="gl-more" href="/apropos">Lire la méthode →</a></p></div><ol class="gl-rules"><li><b>Source identifiable.</b> Pas d'article sans signature.</li><li><b>Chiffres vérifiables.</b> Les hypothèses doivent être publiées.</li><li><b>Idée neuve.</b> Pas de redite de la semaine passée.</li><li><b>Utilité.</b> On doit pouvoir en faire quelque chose.</li></ol></div></section>`),
  sec(footer(c)),
];
const veille = (c) => [
  sec(header(c)),
  pagehead("Veille", "Toute la veille, semaine après semaine", "Filtrez, cochez ce qui vaut d'être relayé, puis copiez le digest pour votre propre lettre.", "Veille"),
  sec(tools()),
  ...WEEKS.map((w, k) => sec(week(w, k))),
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap"><div class="gl-empty" data-empty><p class="gl-h3">Aucun lien ne correspond.</p><p><a href="#theme-all" data-reset>Réinitialiser les filtres</a></p></div></div></section>`),
  sec(footer(c)),
];
const themes = (c) => [
  sec(header(c)),
  pagehead("Thèmes", "Cinq thèmes suivis de près", "Chaque thème a sa question directrice et ses sources de référence.", "Thèmes"),
  ...Object.entries(TH).map(([k, n], x) => { const l = IT.filter((i) => i[4] === k); const q = { energie: "Que consomme vraiment le numérique, et comment le réduire sans le supprimer ?", donnees: "Comment stocker, ouvrir et protéger les données avec mesure ?", regle: "Quelles obligations arrivent, pour qui, et à quelle date ?", usages: "Que font réellement les gens, et qu'est-ce qui change leurs habitudes ?", materiel: "Comment faire durer, réparer et réemployer les appareils ?" }[k]; return sec(`<section class="gl-theme pk-bleed"><div class="gl-wrap gl-theme-in"><div><span class="gl-tape gl-tape--${k}">${n}</span><h2 class="gl-h2">${esc(q)}</h2><p class="gl-fine">${l.length} liens cette saison · ${[...new Set(l.map((i) => SRC[i[2]][0]))].length} sources</p><a class="gl-more" href="/veille#theme-${k}">Lire les ${l.length} liens →</a></div><ul class="gl-mini">${l.slice(0, 3).map((i) => `<li><a href="${url(i)}" target="_blank" rel="noopener">${esc(i[1])}</a><small>${esc(SRC[i[2]][0])} · ${dfr(i[3])}</small></li>`).join("")}</ul></div></section>`); }),
  sec(footer(c)),
];
const sources = (c) => [
  sec(header(c)),
  pagehead("Sources", "Huit sources suivies", "Les publications que la veille lit en priorité, et ce que l'on en retient.", "Sources"),
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap"><div class="gl-scroll" data-scroll><table class="gl-tab"><caption>Sources et nombre de liens retenus</caption><thead><tr><th scope="col">Source</th><th scope="col">Description</th><th scope="col" class="gl-num">Liens retenus</th></tr></thead><tbody>${Object.entries(SRC).map(([k, v]) => `<tr><th scope="row">${esc(v[0])}</th><td>${esc(v[1])}</td><td class="gl-num"><a href="/veille#source-${k}">${IT.filter((i) => i[2] === k).length}</a></td></tr>`).join("")}</tbody></table></div><p class="gl-fine">Les adresses des liens de la démonstration pointent vers un domaine d'exemple : aucune de ces publications n'existe.</p></div></section>`),
  sec(footer(c)),
];
const note = (c) => [
  sec(header(c)),
  pagehead("La note de la semaine", "Faut-il vraiment tout mesurer ?", "Une réflexion de fond, une fois par semaine, à partir de ce que la veille a fait remonter.", "La note"),
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap gl-art"><aside class="gl-aside" aria-label="Repères"><p class="gl-lab">Publié le</p><p><time datetime="2026-11-04">4 novembre 2026</time></p><p class="gl-lab">Lecture</p><p>6 minutes</p><p class="gl-lab">Liens cités</p><p>3 sur 24</p><p class="gl-lab">Partager</p><p><a href="#copier" role="button" data-copy-link>Copier le lien</a></p></aside>
<div class="gl-prose"><p>Cette semaine, trois des vingt-quatre liens retenus parlent de mesure : consommation d'un site, bilan d'un parc d'écrans, empreinte d'une année de télétravail. Tous trois montrent la même chose : <mark>mesurer demande de l'énergie, du temps et des hypothèses</mark>, et chacune de ces hypothèses est discutable.</p>
<h2>Mesurer pour décider, pas pour décorer</h2><p>Le piège est de produire des chiffres qui ne changent aucune décision. Une mesure utile répond à une question précise : faut-il remplacer ce parc d'écrans cette année ou dans deux ans ? Le site est-il plus lourd que la moyenne de son secteur ? Sans question, le chiffre n'est qu'un décor.</p>
<blockquote class="gl-quote"><p>« Un bilan qui n'est suivi d'aucune décision est une dépense de plus. »</p><cite>Note de la veilleuse</cite></blockquote>
<h2>Trois questions avant de mesurer</h2><ol><li>Quelle décision ce chiffre va-t-il éclairer ?</li><li>Quelle précision faut-il réellement pour décider ?</li><li>Qui refera la mesure l'an prochain, et avec quels moyens ?</li></ol>
<p>Si l'on ne sait pas répondre à la première, mieux vaut s'abstenir. Les deux autres déterminent la méthode : un ordre de grandeur suffit presque toujours, et un protocole simple, refait chaque année, vaut mieux qu'une étude exhaustive jamais reconduite.</p>
<h2>À lire cette semaine</h2><ul class="gl-lst"><li><a href="${url(IT[1])}" target="_blank" rel="noopener">${esc(IT[1][1])}</a></li><li><a href="${url(IT[5])}" target="_blank" rel="noopener">${esc(IT[5][1])}</a></li><li><a href="${url(IT[13])}" target="_blank" rel="noopener">${esc(IT[13][1])}</a></li></ul><p><a class="gl-btn" href="/veille">Toute la veille</a> <a class="gl-btn gl-btn--o" href="/apropos">La méthode</a></p></div></div></section>`),
  sec(footer(c)),
];
const apropos = (c) => [
  sec(header(c)),
  pagehead("À propos", "Une veilleuse, un carnet", "Qui lit, comment elle choisit, et ce qu'elle ne fait pas.", "À propos"),
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap"><div class="gl-prose"><h2>Qui lit ?</h2><p>Glane est tenu par Léa Fontaine (personnage fictif), ancienne documentaliste. Elle lit une centaine de sources par semaine, deux heures chaque matin, et n'en garde qu'une vingtaine.</p><h2>Ce que la veille ne fait pas</h2><ul><li>Elle ne vend rien et ne reçoit aucune commission sur les liens.</li><li>Elle ne résume pas à votre place : elle dit pourquoi lire, pas ce qu'il y a dedans.</li><li>Elle ne republie jamais un article en entier.</li></ul><h2>Sa méthode</h2><ol><li>Lecture large, sans filtre.</li><li>Tri par règles écrites (voir l'accueil).</li><li>Note d'une ou deux phrases, relue le lendemain.</li><li>Publication le mercredi matin.</li></ol><p><a class="gl-btn" href="/contact">Écrire à la veilleuse</a></p></div></div></section>`),
  sec(footer(c)),
];
const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Proposer un lien, écrire à la veilleuse", "Une source à suivre, une erreur à corriger, une question : tout est lu.", "Contact"),
  { type: "form", heading: "Votre message", intro: "La démonstration n'envoie rien à une vraie veilleuse, mais le formulaire fonctionne comme sur un vrai site." },
  sec(`<section class="gl-s gl-s--t pk-bleed"><div class="gl-wrap gl-3"><div><h2 class="gl-h3">Proposer un lien</h2><p>Indiquez l'adresse, la source et pourquoi il mérite d'être lu.</p></div><div><h2 class="gl-h3">Signaler une erreur</h2><p>Citez le lien concerné ; la correction est publiée le mercredi.</p></div><div><h2 class="gl-h3">Délai de réponse</h2><p>Sous une semaine (démonstration).</p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Recherche", "Chercher dans le carnet", "Un mot, une source, un thème.", "Recherche"),
  { type: "layout", children: [{ type: "search", props: { target: "catalogue", placeholder: "Rechercher…" } }] },
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap"><div class="gl-nores"><h2 class="gl-h3">Aucun résultat ?</h2><p>Cherchez un mot plus court, ou filtrez directement la veille par thème ou par source.</p><p><a class="gl-btn" href="/veille">Ouvrir la veille</a> <a class="gl-btn gl-btn--o" href="/themes">Voir les thèmes</a></p></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="gl-404 pk-bleed"><div class="gl-wrap gl-404-in"><div class="gl-404-n" aria-hidden="true"><span>4</span><span>0</span><span>4</span></div><div><p class="gl-kick">Page introuvable</p><div class="gl-h1" role="heading" aria-level="1">Ce lien <mark>n'a pas été retenu</mark>.</div><p class="gl-lead">Comme 93 % des liens lus par la veille, celui-ci n'a pas passé la sélection. Reprenez depuis l'accueil.</p><p><a class="gl-btn" href="/">Accueil</a> <a class="gl-btn gl-btn--o" href="/veille">La veille</a> <a class="gl-btn gl-btn--o" href="/recherche">Rechercher</a></p></div></div></section>`),
  sec(footer(c)),
];
const legal = (title, crumb, html) => (c) => [sec(header(c)), pagehead("Informations légales", title, "", crumb), sec(`<section class="gl-s pk-bleed"><div class="gl-wrap"><div class="gl-prose">${html}</div></div></section>`), sec(footer(c))];
const mentions = legal("Mentions légales", "Mentions légales", `<h2>Éditeur</h2><p>Ce site est une démonstration du thème « Glane ». Aucune publication réelle ne l'exploite. Remplacez ces mentions par l'identité de l'éditeur, son adresse et le responsable de la publication.</p><h2>Hébergement</h2><p>Indiquez le nom et l'adresse de votre hébergeur.</p><h2>Liens externes</h2><p>Les liens de la démonstration pointent vers un domaine d'exemple. Sur un vrai site, indiquez que vous n'êtes pas responsable du contenu des sites cités.</p><h2>Contact</h2><p>Utilisez la <a href="/contact">page de contact</a>.</p>`);
const confidentialite = legal("Politique de confidentialité", "Confidentialité", `<h2>Données traitées</h2><p>Le formulaire recueille votre nom, votre adresse électronique et votre message pour répondre à votre demande. Dans cette démonstration, rien n'est transmis.</p><h2>Liens lus et sélection</h2><p>Les liens que vous marquez comme lus ou choisissez pour la lettre sont conservés uniquement dans votre navigateur. Ils ne sont envoyés nulle part.</p><h2>Vos droits</h2><p>Accès, rectification, suppression : écrivez depuis la <a href="/contact">page de contact</a>.</p><h2>Durée</h2><p>Messages conservés douze mois au plus (exemple à adapter).</p>`);
const blocs = (c) => [
  sec(header(c)),
  pagehead("Guide de mise en page", "Éléments de mise en page", "Titres, listes, citations, tableaux, code, boutons et colonnes du thème.", "Éléments"),
  sec(`<section class="gl-s pk-bleed"><div class="gl-wrap"><div class="gl-prose">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec un <a href="/veille">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, un passage <mark>surligné au stabilo</mark> et du <code>code en ligne</code>. La ligne reste entre soixante et quatre-vingts caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li><li>Troisième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote class="gl-quote"><p>« Une citation avec son filet vert. »</p><cite>La veilleuse</cite></blockquote>
<figure class="gl-fig"><div class="gl-fig-art" aria-hidden="true"><span class="gl-tape gl-tape--energie">Énergie</span><span class="gl-tape gl-tape--donnees">Données</span><span class="gl-tape gl-tape--usages">Usages</span></div><figcaption>Une image avec sa légende : étiquettes de masking tape.</figcaption></figure>
<div class="gl-scroll" data-scroll><table class="gl-tab"><caption>Liens par thème</caption><thead><tr><th scope="col">Thème</th><th scope="col" class="gl-num">Liens</th><th scope="col" class="gl-num">Minutes de lecture</th></tr></thead><tbody>${Object.entries(TH).map(([k, n]) => `<tr><th scope="row">${n}</th><td class="gl-num">${IT.filter((i) => i[4] === k).length}</td><td class="gl-num">${IT.filter((i) => i[4] === k).reduce((s, i) => s + i[6], 0)}</td></tr>`).join("")}</tbody></table></div>
<pre><code>- [Titre du lien](https://example.org/…) — note</code></pre>
<p><a class="gl-btn" href="/veille">Bouton plein</a> <a class="gl-btn gl-btn--o" href="/themes">Bouton contour</a></p>
<div class="gl-3"><div><h3>Colonne un</h3><p>Trois colonnes sur grand écran.</p></div><div><h3>Colonne deux</h3><p>Deux sur tablette.</p></div><div><h3>Colonne trois</h3><p>Une sur mobile.</p></div></div>
<aside class="gl-box"><p><b>Encadré.</b> Une information détachée du texte courant.</p></aside></div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "glane", name: "Glane", version: "1.0.0", category: "edition", tags: ["editorial", "naturel"], siteType: "Curation et veille", collection: "pro",
  concept: "Le carnet d'une veilleuse : liens commentés par thème, source et date, notes en marge au surligneur, étiquettes de masking tape, avec filtres, suivi « lu » et digest Markdown à copier.",
  description: "Site de curation et de veille : liens commentés triés par thème, source et type, notes au stabilo, suivi de lecture, sélection « pour la lettre » et copie d'un digest Markdown. Fond papier, encre verte.",
  brand: "Glane", modules: ["formulaires", "recherche"],
  dna: {
    hero: "titre-avec-passage-au-surligneur-et-fiche-chiffree-de-la-semaine-en-carte-penchee",
    header: "logo-et-numero-d-edition-puis-menu-de-texte-ou-colonne-laterale-fixe-au-choix",
    grid: "colonne-de-marge-pour-les-metadonnees-et-colonne-principale-pour-le-lien-commente",
    typo: "domine-et-karla",
    shapes: "etiquettes-de-masking-tape-penchees-surligneur-et-filets-de-cahier",
    motion: "filtrage-instantane-suivi-de-lecture-et-compteurs-sans-mouvement-decoratif",
    rhythm: "semaines-en-sections-separees-par-titres-soulignes-au-trait-de-cahier",
    signature: "filtres-theme-source-type-suivi-lu-selection-pour-la-lettre-et-digest-markdown-copiable",
    palette: "papier-clair-encre-verte-surligneur-jaune-et-cinq-teintes-de-theme",
    image: "aucune-photo-etiquettes-colorees-et-motifs-de-cahier-en-css",
    list: "marges-ou-lignes-compactes-ou-cartes-au-choix",
    article: "note-de-la-semaine-avec-colonne-de-reperes-a-gauche-et-passages-surlignes",
    sidebar: "reperes-publication-lecture-et-liens-cites-a-gauche-de-la-note",
    reading: "colonne-de-66-caracteres-serif-18-px-interligne-1-7-fond-papier",
  },
  tokens: {
    colors: { primary: "#1f7a35", secondary: "#14301c", accent: "#ffe066", background: "#fbfaf5", surface: "#ffffff", text: "#1c261f", muted: "#52605a", success: "#1f7a35", warning: "#8a5a00", error: "#b42318" },
    fonts: { heading: "font.domine", body: "font.karla", button: "font.karla", link: "font.karla" },
    radius: { sm: 3, md: 4, lg: 6, button: 3, field: 4, card: 4 }, shadow: { card: "2px 3px 0 rgba(20,48,28,.15)", button: "none" }, border: { width: 1, color: "#d9d6c6" },
    type: { h1: { size: 52, weight: 700, lineHeight: 1.1, transform: "none" }, h2: { size: 32, weight: 700, lineHeight: 1.2, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Vert d'encre (liens, boutons)", type: "color", default: "#1f7a35" },
    { key: "entete", label: "En-tête", type: "choice", default: "bandeau", choices: [["bandeau", "Bandeau : logo, numéro et menu"], ["ligne", "Ligne unique compacte"], ["marge", "Colonne latérale fixe à gauche"]] },
    { key: "liste", label: "Liste des liens", type: "choice", default: "marges", choices: [["marges", "Métadonnées dans la marge"], ["compacte", "Lignes compactes"], ["cartes", "Cartes en deux colonnes"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "grand", choices: [["grand", "Quatre colonnes"], ["mince", "Une ligne"]] },
    { key: "note", label: "Note de la semaine", type: "choice", default: "marge", choices: [["marge", "Colonne de repères à gauche"], ["centre", "Colonne centrée"]] },
    { key: "surligneur", label: "Surligneur des notes", type: "choice", default: "on", choices: [["on", "Jaune"], ["off", "Sans surlignage"]] },
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "papier", choices: [["papier", "Papier clair"], ["nuit", "Nuit verte"]] },
  ],
  menu: [["Accueil", "/"], ["Veille", "/veille"], ["Thèmes", "/themes"], ["Sources", "/sources"], ["La note", "/note"], ["À propos", "/apropos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "veille", name: "Toute la veille", render: veille }, { key: "themes", name: "Thèmes", render: themes }, { key: "sources", name: "Sources", render: sources },
    { key: "note", name: "La note de la semaine", render: note }, { key: "apropos", name: "À propos", render: apropos }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable }, { key: "mentions", name: "Mentions légales", render: mentions },
    { key: "confidentialite", name: "Confidentialité", render: confidentialite }, { key: "blocs", name: "Éléments de mise en page", render: blocs },
  ],
};
