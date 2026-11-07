// Courrier — publication indépendante et newsletter. Direction artistique : la lettre qui arrive. Papier journal chaud, encre bleu outremer, jaune de timbre ; manchette centrée aux filets doubles,
// timbres dentelés dessinés en SVG, tampon postal, enveloppe. L'abonnement est partout (manchette, Une, bande collante, page dédiée). Composant signature : archives des numéros filtrables + recherche instantanée.
const { sec, esc } = require("../kit");

/* ---------- Données (écrites dans le thème : le CMS n'a pas de type « numéro ») ---------- */
const PLUMES = {
  helene: { n: "Hélène Aubry", r: "Éditrice et rédactrice en chef", b: "Vingt ans de presse quotidienne, puis la décision de fonder une lettre qui ne vit que de ses lecteurs. Elle signe l'éditorial de chaque numéro." },
  nadir: { n: "Nadir Benali", r: "Économie", b: "Ancien économiste en banque centrale. Il explique les chiffres sans les déguiser et refuse les titres alarmistes." },
  louise: { n: "Louise Charpentier", r: "Culture", b: "Critique et traductrice, elle tient la chronique des livres, des festivals et des métiers de la culture." },
  gaspard: { n: "Gaspard Verhaegen", r: "Science", b: "Docteur en biologie, il raconte la recherche en cours, y compris quand elle hésite." },
  anouk: { n: "Anouk Delmas", r: "Société et idées", b: "Sociologue de formation, elle enquête sur la vie quotidienne : eau, logement, école, temps de travail." },
};
const RUB = ["Économie", "Culture", "Science", "Société", "Idées"];
const MOIS = ["juillet", "août", "septembre", "octobre", "novembre"];
// [n°, titre, rubrique, plume, minutes, chapeau, étiquettes]
const NUM = [
  [52, "Le prix de l'eau : pourquoi la facture ne dit pas tout", "Société", "anouk", 11, "Deux foyers voisins, deux factures qui varient du simple au double. Enquête dans les coulisses de la tarification de l'eau.", ["eau", "factures", "collectivités"]],
  [51, "Quatre jours par semaine : les entreprises qui ont tenté", "Économie", "nadir", 9, "Dix-sept entreprises, trois ans de recul : ce que la semaine raccourcie a changé pour la productivité, les salaires et le moral.", ["travail", "temps", "entreprises"]],
  [50, "Le retour des librairies de quartier", "Culture", "louise", 8, "Elles disparaissaient. Elles rouvrent, plus petites, plus spécialisées, souvent coopératives. Visite de cinq adresses.", ["livres", "commerce", "quartiers"]],
  [49, "Comment les abeilles apprennent à lire les fleurs", "Science", "gaspard", 7, "Une équipe a filmé des milliers de butinages pour comprendre comment une abeille choisit, mémorise puis transmet sa route.", ["abeilles", "cognition", "terrain"]],
  [48, "Faut-il encore apprendre l'orthographe ?", "Idées", "helene", 10, "Les correcteurs automatiques écrivent à notre place. Que perd-on, que garde-t-on, et que doit enseigner l'école ?", ["école", "langue", "écriture"]],
  [47, "Retraites : lire les chiffres sans se laisser lire", "Économie", "nadir", 12, "Taux d'emploi, âge moyen de départ, espérance de vie : quatre graphiques pour séparer les faits des slogans.", ["retraites", "chiffres", "décryptage"]],
  [46, "Les bibliothèques ouvertes le dimanche", "Société", "anouk", 8, "Vingt communes ont élargi les horaires de leur médiathèque. Qui vient, et que cherchent-ils vraiment ?", ["bibliothèques", "services publics", "lecture"]],
  [45, "Le silence, nouveau luxe des open spaces", "Idées", "helene", 6, "Casques, cabines, salles de calme : le bruit du bureau est devenu un sujet de négociation et un marché.", ["bureau", "bruit", "travail"]],
  [44, "Une brève histoire du fuseau horaire", "Science", "gaspard", 9, "Avant les chemins de fer, chaque ville avait son heure. Comment le temps a été unifié, et pourquoi on le conteste encore.", ["temps", "histoire", "chemins de fer"]],
  [43, "Festivals : l'été où les cachets ont explosé", "Culture", "louise", 10, "Les têtes d'affiche coûtent deux fois plus cher qu'il y a cinq ans. Comment les petits festivals survivent.", ["musique", "festivals", "économie"]],
  [42, "Loyers : que disent vraiment les observatoires ?", "Économie", "nadir", 11, "Dix villes, deux méthodes, des conclusions opposées. Un mode d'emploi pour lire les chiffres du logement.", ["logement", "loyers", "statistiques"]],
  [41, "Pourquoi les villes plantent des forêts miniatures", "Science", "gaspard", 7, "Quelques dizaines de mètres carrés, trois cents arbres : la méthode japonaise séduit les communes. Qu'en attendre ?", ["villes", "arbres", "climat"]],
  [40, "Le métier de traducteur face aux machines", "Culture", "louise", 9, "Les traducteurs littéraires décrivent un métier qui change moins qu'on ne le croit, mais qui paie de moins en moins.", ["traduction", "métiers", "édition"]],
  [39, "Une rentrée sans cartable lourd", "Société", "anouk", 6, "Casiers, manuels numériques, photocopies : comment les écoles allègent les dos, et ce que cela coûte aux familles.", ["école", "rentrée", "coût"]],
  [38, "L'ennui, ce temps retrouvé", "Idées", "helene", 7, "Les enfants s'ennuient moins, les adultes aussi. Un éloge raisonné d'un état que l'on croyait inutile.", ["attention", "temps", "enfance"]],
  [37, "Lettre d'été : ce que vous nous avez écrit", "Société", "helene", 5, "Trois cents réponses à notre enquête : ce que vous lisez, ce que vous aimeriez lire, et ce que nous ne ferons pas.", ["lecteurs", "courrier", "bilan"]],
];
const DATE0 = Date.UTC(2026, 10, 5);
const dateOf = (n) => new Date(DATE0 - (52 - n) * 7 * 864e5);
const iso = (n) => dateOf(n).toISOString().slice(0, 10);
const long = (n) => dateOf(n).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const mois = (n) => dateOf(n).toLocaleDateString("fr-FR", { month: "long", timeZone: "UTC" });
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- Dessins : timbres dentelés (motif selon le numéro) ---------- */
const COLS = [["#334e9a", "#e8b923"], ["#a3321f", "#f1d9a8"], ["#1d6b5c", "#f3e4a8"], ["#5b3a8c", "#f2c84b"], ["#c0561b", "#f6e3b4"]];
function timbre(n, label) {
  const [a, b] = COLS[n % COLS.length]; const k = n % 4; let m = "";
  if (k === 0) m = `<circle cx="40" cy="42" r="22" fill="${b}"/><path d="M0 70Q20 48 40 62T80 52V90H0Z" fill="${a}"/>`;
  else if (k === 1) m = `<path d="M0 30h80M0 44h80M0 58h80" stroke="${b}" stroke-width="6"/><circle cx="56" cy="30" r="12" fill="${b}"/><path d="M0 90L40 40l40 50Z" fill="${a}" opacity=".85"/>`;
  else if (k === 2) m = `<rect x="14" y="16" width="52" height="58" fill="${b}"/><path d="M14 74L40 36l26 38Z" fill="${a}"/><circle cx="52" cy="30" r="6" fill="${a}"/>`;
  else m = `<circle cx="40" cy="45" r="30" fill="none" stroke="${b}" stroke-width="5"/><circle cx="40" cy="45" r="18" fill="${a}"/><circle cx="40" cy="45" r="6" fill="${b}"/>`;
  return `<svg class="co-tim" viewBox="0 0 80 100" role="img" aria-label="${esc(label)}"><rect width="80" height="100" fill="${a}" opacity=".12"/>${m}<path d="M8 90h64" stroke="${a}" stroke-width="2"/></svg>`;
}
const ENV = `<svg class="co-env" viewBox="0 0 48 36" aria-hidden="true" focusable="false"><rect x="2" y="3" width="44" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M3 5l21 17L45 5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`;
const ARR = `<svg class="co-ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

/* ---------- En-tête et pied ---------- */
const NAV = [["Accueil", "/"], ["Les numéros", "/numeros"], ["Dernier numéro", "/numero"], ["Les plumes", "/plumes"], ["Contact", "/contact"]];
const header = (c) => `<header class="co-head pk-bleed">
  <div class="co-strip"><div class="co-wrap co-strip-in"><span>N° 52 · jeudi 5 novembre 2026</span><span class="co-strip-m">Lettre hebdomadaire indépendante, sans publicité</span><a href="/abonnement">S'abonner gratuitement ${ARR}</a></div></div>
  <div class="co-wrap co-mast">
    <a class="co-logo" href="/" aria-label="${esc(c.brand)}, accueil"><span class="co-logo-mark">${ENV}</span><span class="co-logo-t"><b>Courrier</b><small>la lettre du jeudi</small></span></a>
    <div class="co-nav" role="navigation" aria-label="Navigation principale">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}<a class="co-nav-s" href="/recherche">Rechercher</a></div>
    <a class="co-btn co-btn--sub" href="/abonnement">S'abonner</a>
    <details class="co-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="co-drawer" role="navigation" aria-label="Menu mobile">${NAV.map(([l, u]) => `<a href="${u}">${esc(l)}</a>`).join("")}<a href="/recherche">Rechercher</a><a class="co-btn co-btn--sub" href="/abonnement">S'abonner</a></div></details>
  </div></header>`;
const footer = () => `<div class="co-subbar pk-bleed" data-subbar><div class="co-wrap co-subbar-in"><span class="co-subbar-t">${ENV}<b>Courrier chaque jeudi à 7 h</b></span><a class="co-btn co-btn--sub" href="/abonnement">S'abonner</a></div></div>
<footer class="co-foot pk-bleed"><div class="co-wrap"><div class="co-foot-top">
  <div class="co-foot-brand"><p class="co-foot-logo">Courrier</p><p>Une lettre hebdomadaire écrite par cinq plumes, financée par ses lecteurs. Pas de publicité, pas de traçage.</p><a class="co-btn co-btn--sub" href="/abonnement">S'abonner</a></div>
  <div class="co-fcol" role="navigation" aria-label="Lire"><p class="co-fh">Lire</p><a href="/numeros">Les numéros</a><a href="/numero">Dernier numéro</a><a href="/plumes">Les plumes</a><a href="/blocs">Exemples de mise en page</a></div>
  <div class="co-fcol" role="navigation" aria-label="Le courrier"><p class="co-fh">Courrier</p><a href="/abonnement">S'abonner</a><a href="/contact">Écrire à la rédaction</a><a href="/recherche">Rechercher</a></div>
  <div class="co-fcol" role="navigation" aria-label="Informations légales"><p class="co-fh">Informations</p><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div>
</div><p class="co-legal">© Courrier — site de démonstration : la publication, ses numéros, ses auteurs et ses chiffres sont fictifs.</p></div></footer>`;

const head = (kicker, title, sub) => sec(`<section class="co-ph pk-bleed"><div class="co-wrap"><p class="co-kick">${esc(kicker)}</p><div class="co-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="co-lead">${esc(sub)}</p>` : ""}</div></section>`);
const chips = (label, key, list, all) => `<div class="co-fg"><p class="co-fl">${label}</p><ul class="co-chips" role="group" aria-label="${label}" data-chips="${key}"><li><a href="#filtre" class="is-on" data-v="tout">${all}</a></li>${list.map((x) => `<li><a href="#filtre" data-v="${esc(slug(x))}">${esc(x)}</a></li>`).join("")}</ul></div>`;

/* ---------- Ligne de numéro (3 mises en liste par CSS : chrono, grille, colonnes) ---------- */
function row(x) {
  const [n, t, rub, pl, min, ch, tags] = x;
  return `<li class="co-row" data-rub="${slug(rub)}" data-mois="${slug(mois(n))}"><a class="co-row-in" href="/numero"><span class="co-row-n"><small>N°</small><b>${n}</b></span><span class="co-row-pic">${timbre(n, `Timbre illustré du numéro ${n}`)}</span><span class="co-row-tx"><span class="co-meta"><span class="co-rub">${esc(rub)}</span><time datetime="${iso(n)}">${long(n)}</time></span><span class="co-row-t">${esc(t)}</span><span class="co-row-x">${esc(ch)}</span><span class="co-meta co-meta--b"><span>${esc(PLUMES[pl].n)}</span><span>${min} min</span></span></span></a></li>`;
}
const rows = (list, cls = "") => `<ul class="co-rows ${cls}" data-list>${list.map(row).join("")}</ul><div class="co-none" data-none hidden><div class="co-none-ic">${ENV}</div><h2>Aucun numéro ne correspond</h2><p>Essayez une autre rubrique ou un autre mois. <a href="#tout" data-reset>Tout afficher</a></p></div>`;

/* ---------- Pages ---------- */
const L = NUM[0];
const home = (c) => [sec(header(c)),
  sec(`<section class="co-une pk-bleed"><div class="co-wrap co-une-in">
    <article class="co-lead-story"><p class="co-kick">À la Une · N° 52 · ${long(52)}</p><div class="co-h1" role="heading" aria-level="1">${esc(L[1])}</div><p class="co-stand">${esc(L[5])}</p>
      <p class="co-meta co-meta--l"><span>${esc(PLUMES[L[3]].n)}</span><span>${L[4]} min de lecture</span><span>${esc(L[2])}</span></p><div class="co-actions"><a class="co-btn" href="/numero">Lire le numéro ${ARR}</a><a class="co-btn co-btn--line" href="/numeros">Tous les numéros</a></div></article>
    <aside class="co-sommaire" aria-label="Au sommaire"><p class="co-fh">Aussi dans ce numéro</p><ol>${["L'éditorial : pourquoi nous ne ferons pas de paywall", "Le chiffre de la semaine : 1,8 euro le mètre cube", "Trois lectures à emporter", "Le courrier des lecteurs"].map((t, i) => `<li><span>${i + 1}</span><a href="/numero">${esc(t)}</a></li>`).join("")}</ol></aside>
    <aside class="co-card-sub" aria-label="Abonnement"><div class="co-env-big">${ENV}</div><h2>Recevez Courrier chaque jeudi à 7 h</h2><p>Une lecture de dix minutes, gratuite, sans publicité. Désinscription en un clic.</p><a class="co-btn co-btn--sub co-btn--block" href="/abonnement">Je m'abonne ${ARR}</a><p class="co-fine">Ou <a href="/abonnement">soutenez la lettre</a> à partir de 6 € par mois.</p></aside>
  </div></section>`),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-sh"><h2>Les derniers numéros</h2><a class="co-more" href="/numeros">Les ${NUM.length} numéros de la saison ${ARR}</a></div>${rows(NUM.slice(1, 7))}</div></section>`),
  sec(`<section class="co-s co-s--tint pk-bleed"><div class="co-wrap"><h2 class="co-center">Comment ça marche</h2><ol class="co-steps"><li><span class="co-step-n">1</span><h3>Vous vous inscrivez</h3><p>Une adresse de courriel suffit. Pas de mot de passe, pas de compte à créer.</p></li><li><span class="co-step-n">2</span><h3>Le jeudi, à 7 h</h3><p>Un numéro arrive dans votre boîte : un grand sujet, trois lectures, le courrier des lecteurs.</p></li><li><span class="co-step-n">3</span><h3>Vous gardez la main</h3><p>Un lien de désinscription dans chaque envoi. Les archives restent accessibles à tous.</p></li></ol></div></section>`),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-sh"><h2>Les cinq plumes</h2><a class="co-more" href="/plumes">Les rencontrer ${ARR}</a></div><ul class="co-plumes">${Object.values(PLUMES).map((p) => `<li><b>${esc(p.n)}</b><span>${esc(p.r)}</span></li>`).join("")}</ul></div></section>`),
  { type: "form", heading: "S'abonner à Courrier", intro: "Indiquez votre adresse de courriel : vous recevrez le prochain numéro jeudi à 7 h. Vous pouvez vous désinscrire à tout moment." },
  sec(footer())];

const numeros = (c) => [sec(header(c)), head("Archives", "Tous les <em>numéros</em>", `${NUM.length} numéros depuis la rentrée d'été. Filtrez par rubrique ou par mois, ou cherchez un mot précis ; les ${36} premiers numéros (2025) sont en cours de mise en ligne.`),
  sec(`<section class="co-s pk-bleed" data-filter="num"><div class="co-wrap"><div class="co-filters">${chips("Rubrique", "rub", RUB, "Toutes")}${chips("Mois", "mois", MOIS, "Tous")}</div><p class="co-count" data-count aria-live="polite"><b>${NUM.length}</b> numéros</p>${rows(NUM)}</div></section>`),
  sec(footer())];

const A = (t) => `<div class="co-art-s"><p class="co-rub">${esc(t[0])}</p><h2>${esc(t[1])}</h2>${t[2]}</div>`;
const numero = (c) => [sec(header(c)),
  sec(`<section class="co-arth pk-bleed"><div class="co-wrap"><div class="co-crumb" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/numeros">Numéros</a><span>/</span><span>N° 52</span></div>
    <p class="co-kick">N° 52 · ${long(52)} · ${esc(L[2])}</p><div class="co-h1" role="heading" aria-level="1">${esc(L[1])}</div><p class="co-stand">${esc(L[5])}</p>
    <p class="co-meta co-meta--l"><span>Par ${esc(PLUMES[L[3]].n)}</span><span>${L[4]} min de lecture</span><span>Lettre n° 52</span></p></div></section>`),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap co-issue">
    <div class="co-prose">
      <p class="co-edito"><b>Éditorial.</b> Vous êtes nombreux à nous demander si nous passerons un jour au payant. La réponse tient en une ligne : non. La lettre restera gratuite, financée par ceux qui peuvent la soutenir. Voici comment ce choix tient, chiffres à l'appui.</p>
      ${A(["Enquête", "Deux voisins, deux factures", `<p>Rue des Tanneurs, à Villeneuve, Marc paie 2,10 euros le mètre cube. Sa voisine de l'autre côté de la rue, rattachée à un autre syndicat des eaux, en paie 3,85. Même robinet, même rivière, mêmes tuyaux ; une frontière administrative a suffi à presque doubler la note.</p><p>La tarification de l'eau obéit à une règle simple en apparence : l'eau paie l'eau. Les abonnés financent le captage, le traitement, le réseau, puis l'assainissement. Mais chaque collectivité fixe ses propres priorités, et le prix du mètre cube raconte autant d'histoire que de technique.</p><blockquote class="co-quote"><p>On ne compare pas deux factures d'eau, on compare deux siècles d'investissements.</p><cite>Ingénieur d'un syndicat des eaux, interrogé en octobre</cite></blockquote><p>Pour comprendre l'écart, nous avons recueilli quarante-deux factures et interrogé quatre syndicats. Trois facteurs expliquent presque tout : l'âge du réseau, la densité d'habitants et la part de la dette.</p>`])}
      ${A(["Le chiffre de la semaine", "1,8 euro", `<p>C'est le prix moyen du mètre cube d'eau potable <em>seul</em>, avant assainissement, dans les communes de notre échantillon. L'assainissement ajoute en moyenne 2,05 euros ; les taxes, 0,40 euro.</p>`])}
      <div class="co-tbl"><table><caption>Prix du mètre cube selon la taille du service des eaux</caption><thead><tr><th scope="col">Taille du service</th><th scope="col">Eau potable</th><th scope="col">Assainissement</th><th scope="col">Total</th></tr></thead><tbody><tr><td>Moins de 5 000 habitants</td><td>2,35 €</td><td>2,60 €</td><td>5,35 €</td></tr><tr><td>5 000 à 50 000</td><td>1,85 €</td><td>2,10 €</td><td>4,35 €</td></tr><tr><td>Plus de 50 000</td><td>1,55 €</td><td>1,80 €</td><td>3,75 €</td></tr></tbody></table></div>
      ${A(["À emporter", "Trois lectures", `<ol><li><b>« L'eau, une histoire de tuyaux »</b>, longue lecture d'un hebdomadaire régional, pour comprendre l'origine des réseaux.</li><li><b>Un rapport de la Cour des comptes</b> sur la gestion des services d'eau, lisible malgré son titre.</li><li><b>Un podcast de vingt minutes</b> sur le métier d'égoutier, étonnamment joyeux.</li></ol>`])}
      <p class="co-sign">Bonne lecture, et à jeudi prochain. — Hélène</p>
      <div class="co-share"><span>Faire suivre cette lettre</span><a href="/abonnement">Inviter un ami</a><a href="/numeros">Numéros précédents</a></div>
    </div>
    <aside class="co-side" aria-label="Dans ce numéro"><div class="co-side-in"><p class="co-fh">Dans ce numéro</p><ol><li>L'éditorial</li><li>Enquête : deux voisins, deux factures</li><li>Le chiffre de la semaine</li><li>Trois lectures à emporter</li></ol>${timbre(52, "Timbre du numéro 52")}<a class="co-btn co-btn--sub co-btn--block" href="/abonnement">Recevoir le prochain</a></div></aside></div></section>`),
  sec(`<section class="co-s co-s--tint pk-bleed"><div class="co-wrap"><div class="co-sh"><h2>Numéros précédents</h2></div><ul class="co-rows co-rows--three">${[NUM[1], NUM[2], NUM[3]].map(row).join("")}</ul></div></section>`),
  sec(footer())];

const abonnement = (c) => [sec(header(c)), head("Abonnement", "Une lettre, <em>deux façons</em> de la lire", "La lettre est gratuite pour tous. Ceux qui le peuvent la soutiennent, et les archives complètes leur sont réservées."),
  sec(`<section class="co-s pk-bleed" data-plans><div class="co-wrap"><div class="co-bill" role="group" aria-label="Rythme de paiement"><a href="#mensuel" data-bill="m" class="is-on">Mensuel</a><a href="#annuel" data-bill="a">Annuel · deux mois offerts</a></div>
    <ul class="co-plans"><li class="co-plan"><h2>Lecteur</h2><p class="co-price"><b>0 €</b><small>pour toujours</small></p><ul><li>Le numéro du jeudi par courriel</li><li>Les archives des quatre derniers mois</li><li>Le courrier des lecteurs</li></ul><p class="co-fine">Inscription : formulaire en bas de page.</p></li>
    <li class="co-plan co-plan--hot"><span class="co-flag">Le plus choisi</span><h2>Soutien</h2><p class="co-price"><b><span data-price data-m="6" data-a="60">6</span> €</b><small data-per>par mois</small></p><ul><li>Tout ce qui est gratuit</li><li>Les archives complètes depuis le N° 1</li><li>Une question par mois à la rédaction</li><li>Le carnet de notes de l'éditrice</li></ul><p class="co-save" data-save>Passez à l'annuel : <b>12 € d'économie</b> par an.</p><p class="co-fine">Le soutien se choisit après l'inscription gratuite (démonstration).</p></li></ul></div></section>`),
  sec(`<section class="co-s co-s--tint pk-bleed"><div class="co-wrap co-faq"><h2>Questions fréquentes</h2><div class="co-faq-l"><details><summary>Est-ce vraiment gratuit ?</summary><p>Oui. L'abonnement gratuit n'a pas de durée limitée et ne réclame aucune carte bancaire.</p></details><details><summary>À quelle heure arrive la lettre ?</summary><p>Le jeudi vers 7 h, heure de Paris. Si elle n'arrive pas, regardez vos courriers indésirables, puis écrivez-nous.</p></details><details><summary>Comment me désabonner ?</summary><p>Un lien en bas de chaque envoi. L'opération est immédiate et ne demande aucune justification.</p></details><details><summary>Que faites-vous de mon adresse ?</summary><p>Elle sert uniquement à envoyer la lettre. Elle n'est ni vendue ni louée. Voir la <a href="/confidentialite">politique de confidentialité</a>.</p></details></div></div></section>`),
  { type: "form", heading: "Je m'abonne", intro: "Une adresse de courriel suffit. Le prochain numéro part jeudi à 7 h." },
  sec(footer())];

const plumes = (c) => [sec(header(c)), head("La rédaction", "Cinq <em>plumes</em>, une ligne", "Chacune signe sous son nom, et répond aux lecteurs qui écrivent."),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><ul class="co-team">${Object.values(PLUMES).map((p, i) => `<li class="co-person"><div class="co-person-pic">${timbre(i + 1, `Timbre : ${p.n}`)}</div><div><h2>${esc(p.n)}</h2><p class="co-rub">${esc(p.r)}</p><p>${esc(p.b)}</p></div></li>`).join("")}</ul></div></section>`),
  sec(`<section class="co-s co-s--tint pk-bleed"><div class="co-wrap co-two"><div><h2>Nos règles</h2><p class="co-lead">Trois engagements imprimés au dos de chaque numéro.</p></div><ol class="co-rules"><li><b>Pas de publicité.</b> La lettre vit de ses lecteurs, pas de leurs données.</li><li><b>Sources citées.</b> Chaque chiffre renvoie à son origine, même quand elle contredit notre thèse.</li><li><b>Corrections visibles.</b> Une erreur est corrigée dans le numéro suivant, en tête de lettre.</li></ol></div></section>`),
  sec(footer())];

const contact = (c) => [sec(header(c)), head("Contact", "Écrire à <em>la rédaction</em>", "Une remarque, une correction, une idée de sujet : une plume vous répond en moyenne sous quatre jours."),
  { type: "form", heading: "Votre message", intro: "Précisez le numéro concerné si possible. Merci de ne pas joindre de données personnelles sensibles." }, sec(footer())];

const rechData = NUM.map((x) => `<li class="co-res" data-q="${esc(slug(`${x[1]} ${x[2]} ${x[6].join(" ")} ${PLUMES[x[3]].n} ${x[5]}`))}"><a href="/numero"><span class="co-res-n">N° ${x[0]}</span><b>${esc(x[1])}</b><small>${esc(x[2])} · ${long(x[0])}</small></a></li>`).join("");
const recherche = (c) => [sec(header(c)), head("Recherche", "Chercher dans <em>les numéros</em>", "Un mot du titre, une rubrique, un nom de plume : la liste se réduit pendant la saisie."),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap co-srch" data-search><p class="co-fine" data-hint>Saisissez quelques lettres pour filtrer les ${NUM.length} numéros.</p><ul class="co-results" data-results>${rechData}</ul><div class="co-none co-none--big" data-none hidden><div class="co-none-ic">${ENV}</div><h2>Rien dans la boîte aux lettres</h2><p>Aucun numéro ne correspond à votre recherche. Essayez un mot plus court, ou <a href="/numeros">parcourez toutes les archives</a>.</p></div></div></section>`),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans tout le site…" } }] }, sec(footer())];

const introuvable = (c) => [sec(header(c)), sec(`<section class="co-404 pk-bleed"><div class="co-wrap co-404-in"><div class="co-404-env">${ENV}<span class="co-pm" aria-hidden="true"><i>Retour à</i><b>L'EXPÉDITEUR</b><i>404</i></span></div><div><p class="co-kick">Lettre non distribuée</p><div class="co-h1" role="heading" aria-level="1">Cette page est <em>introuvable</em>.</div><p class="co-lead">L'adresse est erronée ou la page a déménagé. Votre courrier n'est pas perdu : voici où le retrouver.</p><div class="co-actions"><a class="co-btn" href="/">Retour à l'accueil ${ARR}</a><a class="co-btn co-btn--line" href="/numeros">Les numéros</a><a class="co-btn co-btn--line" href="/recherche">Rechercher</a></div></div></div></section>`), sec(footer())];

const blocs = (c) => [sec(header(c)), head("Exemples de mise en page", "Tous les <em>blocs</em> de la lettre", "Titres, listes, citations, tableaux, code, boutons et encadrés tels que le thème les met en forme."),
  sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-prose co-prose--solo">
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Un paragraphe courant avec un <a href="/numeros">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, une <mark>mise en évidence</mark> et une abréviation comme <abbr title="Taxe sur la valeur ajoutée">TVA</abbr>. La ligne reste entre soixante et quatre-vingts caractères sur grand écran.</p>
    <ul><li>Une liste à puces</li><li>Avec plusieurs entrées</li><li>Et un sous-niveau :<ul><li>sous-entrée un</li><li>sous-entrée deux</li></ul></li></ul>
    <ol><li>Une liste numérotée</li><li>Pour les sommaires</li><li>Et les procédures</li></ol>
    <blockquote class="co-quote"><p>Une citation placée entre deux filets, à la manière d'un journal.</p><cite>Auteur de la citation</cite></blockquote>
    <figure class="co-fig">${timbre(3, "Timbre d'exemple")}<figcaption>Une légende d'illustration, en petites capitales.</figcaption></figure>
    <div class="co-box"><b>Encadré</b><p>Un encadré « à retenir » pour les chiffres et les définitions.</p></div>
    <div class="co-tbl"><table><caption>Lecteurs par rubrique préférée</caption><thead><tr><th scope="col">Rubrique</th><th scope="col">Part</th><th scope="col">Évolution</th><th scope="col">Rang</th><th scope="col">Commentaire</th></tr></thead><tbody><tr><td>Société</td><td>31 %</td><td>+2 pts</td><td>1</td><td>Les enquêtes de terrain</td></tr><tr><td>Économie</td><td>27 %</td><td>−1 pt</td><td>2</td><td>Les décryptages chiffrés</td></tr><tr><td>Idées</td><td>19 %</td><td>+1 pt</td><td>3</td><td>Les essais courts</td></tr></tbody></table></div>
    <pre><code>Sujet : correction
Numéro : 52
Page : enquête sur l'eau</code></pre>
    <p>Du code en ligne : <code>prix = volume × tarif</code>.</p>
    <div class="co-actions"><a class="co-btn" href="/abonnement">Bouton principal</a><a class="co-btn co-btn--line" href="/numeros">Bouton secondaire</a></div>
    <div class="co-cols"><div><h3>Colonne gauche</h3><p>Un texte court en deux colonnes pour comparer deux positions.</p></div><div><h3>Colonne droite</h3><p>La seconde colonne passe sous la première sur mobile.</p></div></div>
    <details><summary>Un volet repliable</summary><p>Le contenu s'affiche à l'ouverture.</p></details>
  </div></div></section>`), sec(footer())];

const legal = (title, kicker, body) => (c) => [sec(header(c)), head(kicker, title, ""), sec(`<section class="co-s pk-bleed"><div class="co-wrap"><div class="co-prose co-prose--solo">${body}</div></div></section>`), sec(footer())];
const mentions = legal("Mentions <em>légales</em>", "Informations légales", `<h2>Éditeur du site</h2><p>Courrier est un site de démonstration. Éditeur fictif : Association Courrier, 8 rue de la Poste, 44000 Nantes. Directrice de la publication : Hélène Aubry. Contact : <a href="/contact">formulaire de contact</a>.</p><h2>Hébergement</h2><p>Le site est hébergé par le prestataire choisi par l'exploitant du CMS. Remplacez ce paragraphe par les coordonnées de votre hébergeur.</p><h2>Propriété intellectuelle</h2><p>Les textes et illustrations de cette démonstration sont fictifs. Précisez ici les conditions de réutilisation de vos propres contenus.</p><h2>Responsabilité</h2><p>Les articles de démonstration ne rapportent aucun fait réel. Les chiffres cités sont inventés pour les besoins de la mise en page.</p>`);
const confid = legal("Politique de <em>confidentialité</em>", "Vos données", `<h2>Ce que nous collectons</h2><p>Votre adresse de courriel lors de l'inscription à la lettre, et les informations saisies dans le formulaire de contact.</p><h2>Pourquoi</h2><p>Pour vous envoyer la lettre et répondre à vos messages. Aucune donnée n'est vendue, louée ni cédée à des tiers publicitaires.</p><h2>Durée de conservation</h2><p>Votre adresse est conservée tant que vous êtes abonné, puis supprimée dans les trente jours qui suivent la désinscription.</p><h2>Vos droits</h2><p>Accès, rectification, effacement : écrivez-nous via le <a href="/contact">formulaire de contact</a>. Chaque lettre contient un lien de désinscription.</p>`);

module.exports = {
  key: "courrier", name: "Courrier", version: "1.0.0", category: "edition", tags: ["editorial", "classique", "chaleureux"], siteType: "Publication indépendante et newsletter", featured: false, collection: "blog",
  concept: "La lettre qui arrive : manchette de journal aux filets doubles, timbres dentelés, enveloppe et tampon postal, avec l'abonnement mis en avant partout et des archives de numéros filtrables.",
  description: "Publication indépendante et newsletter : manchette à filets doubles, Une avec carte d'abonnement, archives de 16 numéros filtrables par rubrique et par mois, recherche instantanée, offres gratuite et soutien.",
  brand: "Courrier", modules: ["blog", "formulaires", "recherche"],
  dna: {
    header: "manchette-de-journal-centree-sous-bande-de-date-avec-trois-formes-manchette-ligne-bandeau",
    hero: "une-de-journal-en-trois-colonnes-article-sommaire-et-carte-d-abonnement",
    grid: "colonnes-de-presse-separees-par-filets-fins",
    typo: "serif-de-presse-a-fort-contraste-et-sans-de-lecture-ouvert",
    shapes: "filets-doubles-timbres-dentele-enveloppe-et-tampon-postal",
    motion: "enveloppe-qui-s-ouvre-et-barre-de-lecture-fine",
    rhythm: "sections-sobres-sur-papier-alternees-de-bandes-teintees-comme-une-gazette",
    signature: "archives-de-numeros-filtrables-par-rubrique-et-mois-avec-recherche-instantanee",
    palette: "bleu-outremer-d-encre-et-jaune-de-timbre-sur-papier-journal",
    image: "timbres-denteles-abstraits-un-par-numero",
    list: "numeros-en-grandes-chiffres-avec-timbre-et-chapeau",
    article: "lettre-en-colonne-unique-ou-gazette-a-deux-colonnes-avec-sommaire-lateral",
    sidebar: "sommaire-du-numero-collant-avec-timbre-et-abonnement",
    reading: "chapeau-en-italique-editorial-en-gras-et-citations-entre-filets",
  },
  tokens: {
    colors: { primary: "#334e9a", secondary: "#14161f", accent: "#a67c00", background: "#f7f5ef", surface: "#fffdf8", text: "#14161f", muted: "#4b4f62", success: "#2f6b3f", warning: "#8a5a0a", error: "#a3302a" },
    fonts: { heading: "font.petrona", body: "font.overpass", button: "font.overpass", link: "font.overpass" },
    radius: { sm: 0, md: 2, lg: 2, button: 2, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#cfc9b8" },
    type: { h1: { size: 56, weight: 700, lineHeight: 1.08, transform: "none" }, h2: { size: 34, weight: 700, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "timbre", label: "Jaune des timbres et des tampons", type: "color", default: "#e8b923" },
    { key: "entete", label: "Forme de l'en-tête", type: "choice", default: "manchette", choices: [["manchette", "Manchette centrée sous la bande de date"], ["ligne", "Ligne : logo, rubriques et abonnement"], ["bandeau", "Bandeau sombre"]] },
    { key: "liste", label: "Liste des numéros", type: "choice", default: "chrono", choices: [["chrono", "Chronologique : grands numéros"], ["grille", "Grille de timbres"], ["colonnes", "Deux colonnes compactes"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "grand", choices: [["grand", "Grand : colonnes et abonnement"], ["mince", "Mince : une ligne"]] },
    { key: "article", label: "Page d'un numéro", type: "choice", default: "lettre", choices: [["lettre", "Lettre : une colonne et sommaire"], ["gazette", "Gazette : deux colonnes de presse"]] },
    { key: "nuit", label: "Mode sombre", type: "choice", default: "non", choices: [["non", "Papier clair"], ["oui", "Lecture de nuit"]] },
    { key: "bande", label: "Bande d'abonnement collante (mobile)", type: "choice", default: "on", choices: [["on", "Affichée"], ["off", "Masquée"]] },
  ],
  menu: [["Accueil", "/"], ["Les numéros", "/numeros"], ["Dernier numéro", "/numero"], ["S'abonner", "/abonnement"], ["Les plumes", "/plumes"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "numeros", name: "Archives des numéros", render: numeros }, { key: "numero", name: "Un numéro", render: numero },
    { key: "abonnement", name: "Abonnement", render: abonnement }, { key: "plumes", name: "Les plumes", render: plumes }, { key: "blocs", name: "Blocs de mise en page", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confid },
  ],
};
