// Sou — finances personnelles. Direction artistique : un carnet de comptes à petits carreaux posé sur un bureau de caisse d'épargne. Vert billet, ocre de pièce, filets comptables (double trait des totaux),
// tickets de caisse perforés et encadrés pédagogiques (« À retenir », « Piège », « Exemple chiffré », « Jargon »). Trois calculateurs réels (intérêts composés, règle 50/30/20, mensualité de crédit) écrits
// dans les pages du thème et calculés dans le navigateur ; ce ne sont PAS un type de contenu du CMS. Les chiffres, personnes et situations sont fictifs ; rien ici n'est un conseil financier.
const { sec, esc, nav } = require("../kit");

/* ---------- Page « Blocs » et pages légales (communes aux 5 thèmes de ce lot, écrites avec le préfixe du thème) ---------- */
const svgDemo = (a, b, label) => `<svg viewBox="0 0 640 360" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="${a}"/><circle cx="470" cy="120" r="70" fill="${b}" opacity=".85"/><path d="M0 300C120 220 220 330 340 260S560 230 640 290V360H0Z" fill="${b}" opacity=".55"/><path d="M0 330C140 280 260 350 400 310S580 300 640 330V360H0Z" fill="#000" opacity=".12"/></svg>`;
function blocsPage(P, c, head, foot, lead, col) {
  return [head(c), lead, sec(`<div class="${P}-wrap ${P}-prose ${P}-blocs">
  <section class="${P}-bl"><h2>Titres et texte courant</h2>
    <p>Le texte courant garde une taille d'au moins 16 pixels sur téléphone et une ligne de 60 à 80 caractères sur ordinateur. Un paragraphe peut contenir un <a href="/blocs">lien souligné</a>, du <strong>texte en gras</strong>, de l'<em>italique</em>, un <mark>passage surligné</mark>, une touche <kbd>Ctrl</kbd> + <kbd>F</kbd>, une abréviation comme <abbr title="Taux annuel effectif global">TAEG</abbr> et une note<sup>1</sup>.</p>
    <h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
    <p>Le titre de niveau 1 est celui de la page, en haut : il n'y en a jamais qu'un seul.</p></section>
  <section class="${P}-bl"><h2>Listes</h2>
    <ul><li>Une liste à puces simple</li><li>Avec un deuxième élément<ul><li>et un niveau imbriqué</li></ul></li><li>Et un troisième</li></ul>
    <ol><li>Une liste numérotée</li><li>Les étapes se suivent</li><li>Le compteur reste lisible</li></ol>
    <dl><dt>Terme</dt><dd>Sa définition, en une ou deux phrases.</dd><dt>Autre terme</dt><dd>Une seconde définition.</dd></dl></section>
  <section class="${P}-bl"><h2>Citations</h2>
    <blockquote class="${P}-quote"><p>Une citation courte se lit mieux quand elle a de l'air autour d'elle.</p><cite>${col.cite}</cite></blockquote>
    <p class="${P}-pull">Une citation mise en exergue peut porter une idée forte de l'article.</p></section>
  <section class="${P}-bl"><h2>Images et légendes</h2>
    <figure class="${P}-fig">${svgDemo(col.a, col.b, "Illustration abstraite : un soleil et deux collines")}<figcaption>Illustration abstraite, sa légende en dessous. ${col.legend}</figcaption></figure>
    <div class="${P}-cols ${P}-cols--2"><figure class="${P}-fig">${svgDemo(col.b, col.a, "Illustration abstraite aux couleurs inversées")}<figcaption>Une image en colonne.</figcaption></figure><figure class="${P}-fig">${svgDemo(col.a, col.c, "Illustration abstraite, troisième variante")}<figcaption>Une deuxième image en colonne.</figcaption></figure></div></section>
  <section class="${P}-bl"><h2>Tableau</h2>
    <div class="${P}-tablewrap" role="region" aria-label="Tableau à faire défiler sur petit écran"><table class="${P}-table"><caption>${col.cap}</caption><thead><tr><th scope="col">Élément</th><th scope="col">Détail</th><th scope="col">Valeur</th><th scope="col">Remarque</th></tr></thead><tbody><tr><th scope="row">Premier</th><td>Une ligne d'exemple</td><td>12,50</td><td>Au-dessus de la moyenne</td></tr><tr><th scope="row">Deuxième</th><td>Une autre ligne</td><td>8,00</td><td>Stable</td></tr><tr><th scope="row">Troisième</th><td>Encore une ligne</td><td>21,90</td><td>À surveiller</td></tr></tbody></table></div></section>
  <section class="${P}-bl"><h2>Code</h2><p>Du code en ligne : <code>total = a + b</code>. Et un bloc :</p><pre class="${P}-code"><code>function total(a, b) {
  return a + b;
}
console.log(total(2, 3)); // 5</code></pre></section>
  <section class="${P}-bl"><h2>Boutons</h2><p class="${P}-btns"><a class="${P}-btn" href="/contact">Bouton principal</a><a class="${P}-btn ${P}-btn--alt" href="/recherche">Bouton secondaire</a><a class="${P}-btn ${P}-btn--ghost" href="/">Bouton discret</a></p></section>
  <section class="${P}-bl"><h2>Colonnes</h2><div class="${P}-cols ${P}-cols--3"><div class="${P}-col"><h3>Colonne un</h3><p>Trois colonnes sur ordinateur, une seule sur téléphone.</p></div><div class="${P}-col"><h3>Colonne deux</h3><p>Chaque colonne garde sa propre largeur de lecture.</p></div><div class="${P}-col"><h3>Colonne trois</h3><p>Les espaces restent réguliers d'une colonne à l'autre.</p></div></div></section>
  <section class="${P}-bl"><h2>Encadrés</h2>
    <aside class="${P}-callout ${P}-callout--info"><strong>À retenir</strong><p>${col.info}</p></aside>
    <aside class="${P}-callout ${P}-callout--warn"><strong>Attention</strong><p>${col.warn}</p></aside>
    <aside class="${P}-callout ${P}-callout--tip"><strong>Astuce</strong><p>${col.tip}</p></aside></section>
</div>`), foot(c)];
}
const LEGAL = {
  mentions: (b, e) => [
    ["Éditeur du site", `${b} est un site de démonstration créé avec Kolakisa. L'éditeur est une entité fictive : ${e}. Aucun service réel n'est proposé et aucun achat n'est possible.`],
    ["Directeur de la publication", "Le responsable de la publication est la personne qui administre ce site de démonstration. Elle peut être jointe grâce à la page Contact."],
    ["Hébergement", "Le site est hébergé par le prestataire choisi par son administrateur. Ses coordonnées doivent être indiquées ici lors de la mise en ligne réelle du site."],
    ["Propriété intellectuelle", "Les textes, illustrations et mises en page de ce thème de démonstration sont fournis à titre d'exemple. Les noms, personnes, chiffres et situations présentés sont fictifs."],
    ["Responsabilité", "Les informations sont données à titre indicatif et ne constituent pas un conseil personnalisé. Remplacez ce texte par vos mentions légales avant toute publication."],
  ],
  confidentialite: (b) => [
    ["Données que nous recevons", `Quand vous utilisez le formulaire de la page Contact, ${b} reçoit les informations que vous saisissez : nom, adresse électronique et message. Rien d'autre n'est demandé.`],
    ["À quoi elles servent", "Ces informations servent uniquement à répondre à votre message. Elles ne sont ni vendues, ni cédées, ni utilisées pour de la publicité."],
    ["Cookies et mesure d'audience", "Ce thème n'installe aucun cookie publicitaire. Les préférences d'affichage que vous réglez (par exemple une case cochée) restent dans votre navigateur et ne sont jamais envoyées au site."],
    ["Durée de conservation", "Les messages sont conservés le temps nécessaire pour y répondre, puis supprimés dans un délai de douze mois."],
    ["Vos droits", "Vous pouvez demander l'accès à vos données, leur correction ou leur suppression en écrivant depuis la page Contact. Vous pouvez aussi saisir la CNIL si vous estimez que vos droits ne sont pas respectés."],
  ],
};
function legalPage(P, kind, c, head, foot, lead, brand, editor) {
  const items = LEGAL[kind](brand, editor);
  return [head(c), lead, sec(`<div class="${P}-wrap ${P}-prose ${P}-legal">${items.map(([t, x], i) => `<section class="${P}-bl"><h2>${i + 1}. ${t}</h2><p>${x}</p></section>`).join("")}<p class="${P}-fine">Dernière mise à jour : 5 novembre 2026. Texte de démonstration, à adapter avant toute mise en ligne.</p></div>`), foot(c)];
}


/* ---------- Données : rubriques, auteurs, articles (18), glossaire ---------- */
const CATS = { budget: "Budget", epargne: "Épargne", credits: "Crédits", impots: "Impôts", retraite: "Retraite", banque: "Banque au quotidien", assurance: "Assurance" };
const AUTH = {
  camille: { n: "Camille Roche", r: "Conseillère budgétaire", b: "Quinze ans à aider des ménages à reprendre la main sur leurs dépenses, d'abord en association, puis en indépendante." },
  idriss: { n: "Idriss Benali", r: "Ancien analyste crédit", b: "A passé dix ans à lire des dossiers de prêt. Explique ce que les banques regardent et ce que les contrats cachent dans les petites lignes." },
  nadege: { n: "Nadège Fournier", r: "Fiscaliste", b: "Accompagne des particuliers dans leur déclaration de revenus. Son principe : une case bien comprise vaut mieux qu'une astuce." },
  paul: { n: "Paul Lemoine", r: "Économiste de l'épargne", b: "Chercheur puis pédagogue, il traduit les rapports sur l'épargne et la retraite en phrases que l'on peut lire un dimanche matin." },
};
// id, titre, rubrique, étiquettes, auteur, date, minutes, extrait
const ART = [
  ["interets", "Intérêts composés : pourquoi commencer tôt compte plus que mettre beaucoup", "epargne", ["intérêts", "long terme"], "paul", "2026-10-28", 9, "Vingt-cinq ans à 100 euros par mois ou quinze ans à 160 : l'écart se creuse là où on ne l'attend pas."],
  ["budget-503020", "Le budget 50/30/20 sans se priver : mode d'emploi", "budget", ["budget", "méthode"], "camille", "2026-10-24", 7, "Une règle simple pour répartir ses revenus entre besoins, envies et épargne, et la façon de l'adapter quand le loyer pèse lourd."],
  ["compte-courant", "Combien garder sur son compte courant ?", "banque", ["compte courant", "trésorerie"], "camille", "2026-10-21", 5, "Ni trop peu, pour éviter le découvert, ni trop, pour ne pas laisser dormir l'argent : une façon de trouver son seuil."],
  ["taeg", "Comprendre le TAEG avant de signer un crédit", "credits", ["crédit", "taux"], "idriss", "2026-10-17", 8, "Le taux affiché n'est pas le coût du crédit. Le TAEG regroupe les frais, et c'est lui qu'il faut comparer."],
  ["precaution", "Constituer une épargne de précaution en six mois", "epargne", ["précaution", "objectif"], "paul", "2026-10-14", 6, "Un plan réaliste pour mettre l'équivalent de trois mois de dépenses de côté sans bouleverser son quotidien."],
  ["cases-oubliees", "Déclaration de revenus : les cases qu'on oublie", "impots", ["déclaration", "déductions"], "nadege", "2026-10-10", 7, "Frais de garde, dons, pension versée : un tour d'horizon des rubriques souvent laissées vides."],
  ["releve-carriere", "Retraite : lire son relevé de carrière sans stress", "retraite", ["retraite", "trimestres"], "paul", "2026-10-06", 8, "Trimestres, points, salaires reportés : ce que chaque ligne signifie et comment signaler une erreur."],
  ["emprunteur", "Assurance emprunteur : quand la changer", "assurance", ["assurance", "crédit immobilier"], "idriss", "2026-10-02", 6, "On peut changer d'assurance de prêt en cours de route. Les conditions, les pièges et le calcul de l'économie possible."],
  ["frais-caches", "Les frais bancaires cachés, un par un", "banque", ["frais", "carte"], "camille", "2026-09-29", 6, "Tenue de compte, retrait à l'étranger, incident de paiement : le tableau pour savoir ce que l'on paie vraiment."],
  ["anticipe", "Rembourser par anticipation : bonne idée ou pas ?", "credits", ["remboursement", "indemnités"], "idriss", "2026-09-25", 7, "Avant de solder un prêt, trois questions à se poser : le taux, les pénalités et ce que l'on fait de l'argent libéré."],
  ["vocabulaire", "Fonds, actions, obligations : le vocabulaire en dix minutes", "epargne", ["placement", "vocabulaire"], "paul", "2026-09-22", 10, "Un lexique illustré pour lire une brochure de placement sans hocher la tête par politesse."],
  ["budget-couple", "Faire un budget à deux sans se disputer", "budget", ["couple", "organisation"], "camille", "2026-09-18", 6, "Compte commun, comptes séparés ou formule mixte : comment choisir selon les revenus et les habitudes de chacun."],
  ["depenses-annuelles", "Le calendrier des dépenses annuelles qui piègent le budget", "budget", ["calendrier", "anticiper"], "camille", "2026-09-15", 5, "Taxe, assurance, vacances, rentrée : les dépenses qui arrivent une fois par an se préparent douze mois avant."],
  ["premiere-declaration", "Première déclaration d'impôts : guide pas à pas", "impots", ["déclaration", "débutant"], "nadege", "2026-09-11", 9, "Se connecter, vérifier les montants préremplis, ajouter ce qui manque : un parcours détaillé pour ne rien rater."],
  ["inflation", "Inflation : pourquoi 1 000 euros ne valent plus pareil", "epargne", ["inflation", "pouvoir d'achat"], "paul", "2026-09-08", 6, "Un petit calcul montre ce que l'inflation fait à un compte qui ne rapporte rien, année après année."],
  ["epargne-retraite", "Épargne retraite : trois questions avant de s'engager", "retraite", ["retraite", "placement"], "paul", "2026-09-04", 8, "Blocage, frais, fiscalité : les points à vérifier avant de verser le premier euro dans un contrat."],
  ["mutuelle", "Mutuelle et complémentaire : décoder un devis", "assurance", ["santé", "devis"], "idriss", "2026-09-01", 7, "Remboursement en pourcentage de la base, forfaits, délais de carence : lire un devis ligne par ligne."],
  ["decouvert", "Découvert autorisé : ce qu'il coûte vraiment", "banque", ["découvert", "agios"], "idriss", "2026-08-28", 5, "Quelques jours de découvert coûtent peu, quelques mois coûtent cher : exemple chiffré à l'appui."],
].map(([id, t, cat, tags, au, d, min, x]) => ({ id, t, cat, tags, au, d, min, x }));
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fr = (d) => { const [y, m, j] = d.split("-"); return `${Number(j)} ${MOIS[Number(m) - 1]} ${y}`; };
const TERMS = [
  ["Agios", "Intérêts facturés par la banque quand votre compte est à découvert. Ils s'ajoutent aux frais éventuels."],
  ["Amortissement", "Part du capital que vous remboursez à chaque mensualité d'un prêt. Au début elle est petite, à la fin elle domine."],
  ["Capital", "La somme de départ : celle que l'on emprunte ou que l'on place, avant les intérêts."],
  ["Découvert", "Situation où le solde du compte devient négatif. Il peut être autorisé (convenu avec la banque) ou non."],
  ["Diversification", "Répartir un placement sur plusieurs supports pour qu'un seul incident n'abîme pas l'ensemble."],
  ["Échéance", "Date à laquelle un paiement est dû : une mensualité, une prime d'assurance, un impôt."],
  ["Intérêts composés", "Intérêts qui produisent eux-mêmes des intérêts. C'est ce qui donne à l'épargne sa courbe en crosse de hockey."],
  ["Inflation", "Hausse générale des prix. Avec 2 % d'inflation, ce qui coûte 100 euros aujourd'hui en coûtera environ 102 l'an prochain."],
  ["Livret", "Compte d'épargne dont l'argent reste disponible à tout moment, avec un taux modeste."],
  ["Mensualité", "Somme versée chaque mois pour rembourser un crédit : capital, intérêts et parfois assurance."],
  ["Plafond", "Montant maximal que l'on peut placer sur un produit d'épargne donné."],
  ["Rendement", "Ce que rapporte un placement sur une période, exprimé en pourcentage du capital."],
  ["Taux nominal", "Le taux d'intérêt du contrat, sans les frais. Il ne suffit pas pour comparer deux crédits."],
  ["TAEG", "Taux annuel effectif global : le coût réel d'un crédit, frais et assurance obligatoire compris. C'est lui qu'on compare."],
  ["Taux d'effort", "Part des revenus qui part en remboursement de dettes. Les banques regardent rarement au-delà d'un tiers."],
  ["Trésorerie", "L'argent disponible tout de suite, sur le compte courant et les livrets."],
];

/* ---------- Dessins ---------- */
const coin = (cls = "") => `<svg class="so-coin ${cls}" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle class="so-coin-o" cx="24" cy="24" r="22"/><circle class="so-coin-i" cx="24" cy="24" r="16.5"/><path class="so-coin-s" d="M29.5 17.5c-1.4-1.6-3.4-2.4-5.5-2.4-3 0-5.2 1.6-5.2 4 0 5.8 11 3 11 9 0 2.6-2.4 4.4-5.6 4.4-2.4 0-4.6-1-6-2.6M24 12.5v23"/></svg>`;
const arrow = `<svg class="so-arr" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const NOTE = { retenir: "À retenir", piege: "Piège à éviter", exemple: "Exemple chiffré", jargon: "Jargon décodé" };
const note = (k, title, html) => `<aside class="so-note so-note--${k}"><p class="so-note-k"><span class="so-note-ic" aria-hidden="true"></span>${NOTE[k]}</p>${title ? `<p class="so-note-t">${title}</p>` : ""}<div class="so-note-b">${html}</div></aside>`;

/* ---------- Calculateurs (mont​és par motion.js ; le contenu de repli est un exemple résolu) ---------- */
const CALC = {
  interets: { t: "Intérêts composés", q: "Que devient une épargne régulière ?", ex: "Avec 1 000 € au départ, 100 € par mois pendant 10 ans à 3 % par an, on obtient environ 15 300 € dont 2 300 € d'intérêts." },
  budget: { t: "Règle 50/30/20", q: "Comment répartir un revenu ?", ex: "Avec 2 000 € nets par mois : 1 000 € pour les besoins, 600 € pour les envies, 400 € pour l'épargne." },
  credit: { t: "Mensualité de crédit", q: "Combien coûte un emprunt ?", ex: "Pour emprunter 15 000 € sur 5 ans à 4 % : environ 276 € par mois, soit environ 1 575 € d'intérêts au total." },
};
const calc = (k, cls = "") => `<div class="so-calc ${cls}" data-so-calc="${k}"><div class="so-calc-fb"><p class="so-calc-fbt">${CALC[k].t}</p><p>${CALC[k].ex}</p><p class="so-fine">Le calculateur interactif demande que JavaScript soit activé.</p></div></div>`;

/* ---------- Structure commune ---------- */
const header = (c) => sec(`<header class="so-head pk-bleed"><div class="so-ticker"><div class="so-wrap so-ticker-in"><p><span>Repère d'exemple</span> Livret type <b>1,7 %</b></p><p>Inflation d'exemple <b>2,1 %</b></p><p>Crédit conso d'exemple <b>5,2 %</b></p><p class="so-ticker-n">Valeurs fictives pour illustrer les articles.</p></div></div>
  <div class="so-bar so-wrap"><a class="so-logo" href="/" aria-label="${esc(c.brand)} : accueil">${coin("so-logo-c")}<span>Sou<small>finances personnelles</small></span></a>
  <div class="so-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div><a class="so-btn so-btn--sm so-head-cta" href="/calculateurs">Calculer</a>
  <details class="so-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="so-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="so-btn" href="/calculateurs">Calculer</a></div></details></div></header>`);
const footer = (c) => sec(`<footer class="so-foot pk-bleed"><div class="so-wrap so-foot-in"><div class="so-foot-lead">${coin("so-foot-c")}<p class="so-foot-q">Un sou est un sou : mieux vaut savoir où il va.</p><p class="so-fine">Sou est un site de démonstration. Les personnes, chiffres et produits sont fictifs. Aucun contenu ne constitue un conseil en investissement.</p></div>
  <div class="so-foot-col"><h2>Lire</h2>${nav(c.menu.slice(1, 4), "so-fl")}</div><div class="so-foot-col"><h2>Rubriques</h2>${Object.entries(CATS).slice(0, 5).map(([k, v]) => `<a class="so-fl" href="/articles?cat=${k}">${v}</a>`).join("")}</div>
  <div class="so-foot-col"><h2>Le site</h2><a class="so-fl" href="/contact">Contact</a><a class="so-fl" href="/recherche">Recherche</a><a class="so-fl" href="/blocs">Blocs de mise en page</a><a class="so-fl" href="/mentions-legales">Mentions légales</a><a class="so-fl" href="/confidentialite">Confidentialité</a></div></div>
  <div class="so-wrap so-foot-end"><p>© 2026 Sou, site de démonstration.</p><p class="so-total" aria-hidden="true"><span></span></p></div></footer>`);
const pagehead = (kick, title, sub) => sec(`<section class="so-ph pk-bleed"><div class="so-wrap so-ph-in"><p class="so-kick">${esc(kick)}</p><div class="so-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="so-sub">${esc(sub)}</p>` : ""}</div></section>`);

const item = (a) => `<li class="so-item" data-cat="${a.cat}" data-tags="${esc(a.tags.join("|"))}" data-q="${esc((a.t + " " + a.x + " " + a.tags.join(" ") + " " + CATS[a.cat] + " " + AUTH[a.au].n).toLowerCase())}"><article class="so-tk"><p class="so-tk-top"><span class="so-pill so-pill--${a.cat}">${CATS[a.cat]}</span><time datetime="${a.d}">${fr(a.d)}</time></p><h3 class="so-tk-t"><a href="/article">${esc(a.t)}</a></h3><p class="so-tk-x">${esc(a.x)}</p><p class="so-tk-f"><span>${AUTH[a.au].n}</span><span>${a.min} min de lecture</span></p></article></li>`;
const list = (arr, extra = "") => `<ul class="so-list ${extra}" data-so-list>${arr.map(item).join("")}</ul>`;

/* ---------- Accueil ---------- */
const home = (c) => [header(c),
  sec(`<section class="so-hero pk-bleed"><div class="so-wrap so-hero-in"><div class="so-hero-tx"><p class="so-kick">Carnet de finances personnelles</p><div class="so-h1" role="heading" aria-level="1">Comprendre son argent, <em>un sou</em> après l'autre.</div><p class="so-lead">Des articles sans jargon, des encadrés qui expliquent les mots difficiles et des calculateurs pour tester ses propres chiffres, sans rien envoyer à personne.</p><p class="so-cta"><a class="so-btn" href="/articles">Lire les derniers articles ${arrow}</a><a class="so-btn so-btn--line" href="/calculateurs">Essayer un calculateur</a></p>
    <ul class="so-facts" aria-label="Chiffres du site"><li><b data-so-count="18">18</b><span>articles à lire</span></li><li><b data-so-count="3">3</b><span>calculateurs</span></li><li><b data-so-count="16">16</b><span>mots décodés</span></li></ul></div>
    <div class="so-hero-card"><p class="so-hero-cap">Essayez tout de suite</p>${calc("interets", "so-calc--hero")}</div></div></section>`),
  sec(`<section class="so-sec so-sec--une pk-bleed"><div class="so-wrap"><div class="so-sechead"><div><p class="so-kick">À la une</p><h2 class="so-h2">Les lectures du moment</h2></div><a class="so-more" href="/articles">Tous les articles ${arrow}</a></div>
    <div class="so-une"><article class="so-big"><p class="so-tk-top"><span class="so-pill so-pill--epargne">Épargne</span><time datetime="${ART[0].d}">${fr(ART[0].d)}</time></p><h3 class="so-big-t"><a href="/article">${esc(ART[0].t)}</a></h3><p>${esc(ART[0].x)}</p><p class="so-tk-f"><span>${AUTH.paul.n}</span><span>${ART[0].min} min de lecture</span></p>${note("exemple", "", "<p>100 € par mois pendant 25 ans à 3 % : environ 44 400 € au bout du compte, dont 14 400 € d'intérêts.</p>")}</article>
    ${list(ART.slice(1, 4), "so-list--side")}</div></div></section>`),
  sec(`<section class="so-sec so-sec--rub pk-bleed"><div class="so-wrap"><div class="so-sechead"><div><p class="so-kick">Rubriques</p><h2 class="so-h2">Où se range votre question ?</h2></div></div><ul class="so-rubs">${Object.entries(CATS).map(([k, v]) => `<li><a class="so-rub so-rub--${k}" href="/articles?cat=${k}"><b>${ART.filter((a) => a.cat === k).length}</b><span>${v}</span>${arrow}</a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="so-sec so-sec--calcs pk-bleed"><div class="so-wrap"><div class="so-sechead"><div><p class="so-kick">Calculateurs</p><h2 class="so-h2">Trois outils pour tester ses chiffres</h2></div></div><div class="so-calcs">${Object.entries(CALC).map(([k, v]) => `<a class="so-cc" href="/calculateurs#${k}"><span class="so-cc-n">${v.t}</span><span class="so-cc-q">${v.q}</span><span class="so-cc-go">Ouvrir ${arrow}</span></a>`).join("")}</div>
    ${note("piege", "Un calculateur n'est pas un conseil", "<p>Ces outils appliquent des formules simples à des chiffres que vous saisissez. Ils ne tiennent compte ni de vos impôts, ni de vos frais réels, ni de l'évolution des taux.</p>")}</div></section>`),
  sec(`<section class="so-sec so-sec--jar pk-bleed"><div class="so-wrap so-jar"><div><p class="so-kick">Jargon du jour</p><h2 class="so-h2">${TERMS[13][0]}</h2><p class="so-lead2">${TERMS[13][1]}</p><p><a class="so-more" href="/glossaire">Tout le glossaire ${arrow}</a></p></div>
    <div class="so-jar-r"><ul class="so-mini">${ART.slice(4, 8).map((a) => `<li><a href="/article"><span>${fr(a.d)}</span>${esc(a.t)}</a></li>`).join("")}</ul></div></div></section>`),
  footer(c)];

/* ---------- Articles (liste filtrable) ---------- */
const articles = (c) => [header(c), pagehead("Tous les articles", "Le carnet : dix-huit articles de finances personnelles", "Filtrez par rubrique, cherchez un mot, ou parcourez par ordre de parution."),
  sec(`<section class="so-sec so-sec--arch pk-bleed"><div class="so-wrap"><h2 class="so-sr">Liste des articles</h2><div class="so-tools" data-so-tools><p class="so-tools-n" role="status" aria-live="polite"><b data-so-n>${ART.length}</b> articles affichés</p>
    <ul class="so-chips" aria-label="Filtrer par rubrique"><li><a href="/articles" data-cat="tous" aria-current="true">Toutes</a></li>${Object.entries(CATS).map(([k, v]) => `<li><a href="/articles?cat=${k}" data-cat="${k}">${v}</a></li>`).join("")}</ul></div>
    ${list(ART)}
    <div class="so-empty" data-so-empty hidden><p class="so-empty-t">Aucun article ne correspond.</p><p>Essayez un mot plus court, ou revenez à <a href="/articles">toutes les rubriques</a>.</p></div></div></section>`),
  footer(c)];

/* ---------- Article ---------- */
const A0 = ART[0];
const article = (c) => [header(c),
  sec(`<section class="so-arh pk-bleed"><div class="so-wrap so-arh-in"><p class="so-crumb"><a href="/">Accueil</a> / <a href="/articles?cat=epargne">Épargne</a></p><p class="so-tk-top"><span class="so-pill so-pill--epargne">Épargne</span><time datetime="${A0.d}">${fr(A0.d)}</time><span>${A0.min} min de lecture</span></p>
    <div class="so-h1 so-h1--art" role="heading" aria-level="1">${esc(A0.t)}</div><p class="so-sub">${esc(A0.x)}</p><p class="so-by"><span class="so-av" aria-hidden="true">PL</span><span>Par <b>${AUTH.paul.n}</b>, ${AUTH.paul.r.toLowerCase()}</span></p></div></section>`),
  sec(`<div class="so-wrap so-art"><aside class="so-toc" aria-label="Sommaire de l'article"><p class="so-toc-t">Dans cet article</p><ol><li><a href="#principe">Le principe en une phrase</a></li><li><a href="#simulation">Faire le calcul soi-même</a></li><li><a href="#temps">Le temps contre le montant</a></li><li><a href="#limites">Ce que le calcul ne dit pas</a></li><li><a href="#retenir">Pour finir</a></li></ol></aside>
    <div class="so-prose so-body"><p class="so-chapo">Quand on épargne, l'argent travaille de deux façons : il s'accumule parce qu'on en ajoute, et il grossit parce que les intérêts d'hier produisent des intérêts aujourd'hui. La seconde moitié de cette phrase explique presque tout.</p>
    <h2 data-anchor="principe">Le principe en une phrase</h2><p>Les intérêts composés sont des intérêts calculés sur le capital <em>et</em> sur les intérêts déjà gagnés. Chaque année, la base de calcul grossit. Au début c'est à peine visible ; après quelques années, la courbe se redresse.</p>
    ${note("jargon", "Intérêts simples ou composés ?", "<p>Avec des intérêts simples, 1 000 € à 3 % rapportent toujours 30 € par an. Avec des intérêts composés, la deuxième année rapporte 30,90 €, la troisième 31,83 €, et ainsi de suite.</p>")}
    <h2 data-anchor="simulation">Faire le calcul soi-même</h2><p>Plutôt que de croire une phrase, testez-la. Le calculateur ci-dessous part de valeurs d'exemple ; changez le montant mensuel, le taux ou la durée et regardez ce qui bouge.</p>${calc("interets", "so-calc--art")}
    <h2 data-anchor="temps">Le temps contre le montant</h2><p>Comparons deux épargnants fictifs, Inès et Malo, avec un rendement de 3 % par an.</p>
    <div class="so-tablewrap" role="region" aria-label="Tableau comparatif, à faire défiler sur petit écran"><table class="so-table"><caption>Deux façons d'arriver à un capital proche</caption><thead><tr><th scope="col">Épargnant</th><th scope="col">Par mois</th><th scope="col">Durée</th><th scope="col">Versé</th><th scope="col">Capital final</th></tr></thead><tbody><tr><th scope="row">Inès</th><td>100 €</td><td>25 ans</td><td>30 000 €</td><td>44 400 €</td></tr><tr><th scope="row">Malo</th><td>160 €</td><td>15 ans</td><td>28 800 €</td><td>36 200 €</td></tr><tr class="so-total-row"><th scope="row">Écart</th><td>-60 €</td><td>+10 ans</td><td>+1 200 €</td><td>+8 200 €</td></tr></tbody></table></div>
    <blockquote class="so-quote"><p>Le temps est le seul ingrédient qu'on ne peut pas racheter plus tard.</p><cite>Paul Lemoine</cite></blockquote>
    ${note("retenir", "", "<p>À versement égal, ce sont les <b>années</b> qui font la différence. Commencer petit tôt vaut mieux que commencer fort tard.</p>")}
    <h2 data-anchor="limites">Ce que le calcul ne dit pas</h2><p>Un taux de 3 % constant est une hypothèse de calcul, pas une promesse. Les frais, la fiscalité et l'inflation réduisent le résultat réel.</p>${note("piege", "Rendement ne veut pas dire garanti", "<p>Un produit qui promet un rendement élevé et sans risque n'existe pas. Méfiez-vous des simulations qui ne mentionnent ni frais ni durée de blocage.</p>")}
    <ul><li>Vérifiez les <strong>frais</strong> du support : 1 % de frais annuels, sur vingt ans, retire près d'un cinquième du capital final.</li><li>Gardez une <strong>épargne de précaution</strong> accessible avant de bloquer de l'argent.</li><li>Comparez en <strong>euros constants</strong> : 40 000 € dans vingt ans n'achèteront pas ce que 40 000 € achètent aujourd'hui.</li></ul>
    <h2 data-anchor="retenir">Pour finir</h2><p>Les intérêts composés ne sont ni un secret ni une astuce : c'est de l'arithmétique, et elle est de votre côté si vous lui laissez du temps. Le plus utile est de fixer un montant tenable, de le virer le jour de la paie et de ne plus y penser.</p>
    <div class="so-author"><span class="so-av so-av--l" aria-hidden="true">PL</span><div><p class="so-author-n">${AUTH.paul.n}</p><p class="so-author-r">${AUTH.paul.r}</p><p>${AUTH.paul.b}</p></div></div></div></div>`),
  sec(`<section class="so-sec so-sec--rel pk-bleed"><div class="so-wrap"><div class="so-sechead"><div><p class="so-kick">À lire ensuite</p><h2 class="so-h2">Dans la même rubrique</h2></div></div>${list([ART[4], ART[10], ART[14]], "so-list--row")}</div></section>`),
  footer(c)];

/* ---------- Calculateurs ---------- */
const calculateurs = (c) => [header(c), pagehead("Calculateurs", "Trois outils pour tester ses propres chiffres", "Tout est calculé dans votre navigateur. Rien n'est envoyé, rien n'est conservé."),
  ...["interets", "budget", "credit"].map((k, i) => sec(`<section class="so-sec so-sec--calc so-sec--calc${i} pk-bleed" data-anchor="${k}"><div class="so-wrap so-cgrid"><div class="so-cintro"><p class="so-kick">Calculateur ${i + 1} sur 3</p><h2 class="so-h2">${CALC[k].t}</h2><p class="so-lead2">${CALC[k].q}</p>${[
    note("retenir", "La formule", "<p><b>Capital final</b> = capital × (1 + taux)<sup>années</sup> + versement annuel × ((1 + taux)<sup>années</sup> - 1) ÷ taux. Les versements mensuels sont ramenés à un taux mensuel équivalent.</p>"),
    note("retenir", "La règle", "<p><b>50 %</b> pour les besoins (loyer, énergie, transport, courses), <b>30 %</b> pour les envies, <b>20 %</b> pour l'épargne ou le remboursement de dettes. C'est un point de départ, pas un dogme.</p>"),
    note("jargon", "La mensualité", "<p><b>M</b> = capital × t ÷ (1 - (1 + t)<sup>-n</sup>), avec <b>t</b> le taux mensuel et <b>n</b> le nombre de mois. Les frais de dossier et l'assurance ne sont pas inclus.</p>")][i]}</div>${calc(k)}</div></section>`)),
  footer(c)];

/* ---------- Glossaire ---------- */
const glossaire = (c) => [header(c), pagehead("Glossaire", "Seize mots de finances, décodés", "Un mot, une définition, un exemple si besoin. Tapez pour filtrer."),
  sec(`<section class="so-sec so-sec--glo pk-bleed"><div class="so-wrap"><div class="so-tools" data-so-gloss><p class="so-tools-n" role="status" aria-live="polite"><b data-so-n>${TERMS.length}</b> mots affichés</p></div>
    <dl class="so-gloss" data-so-glist>${TERMS.map(([t, d]) => `<div class="so-term" data-q="${esc((t + " " + d).toLowerCase())}"><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>
    <div class="so-empty" data-so-gempty hidden><p class="so-empty-t">Aucun mot ne correspond.</p><p>Le glossaire ne couvre que seize termes. Essayez la <a href="/recherche">recherche dans tout le site</a>.</p></div></div></section>`),
  footer(c)];

/* ---------- Contact, recherche, introuvable, blocs, légales ---------- */
const contact = (c) => [header(c), pagehead("Contact", "Une question, une erreur, une idée de sujet ?", "La rédaction répond sous cinq jours ouvrés. Elle ne donne pas de conseil personnalisé."),
  sec(`<section class="so-info pk-bleed"><div class="so-wrap so-info-in"><div><h2 class="so-h3">Écrire à la rédaction</h2><p>Signalez une imprécision dans un article, proposez un sujet ou demandez une précision sur un calculateur.</p></div><div><h2 class="so-h3">Ce que nous ne faisons pas</h2><p>Nous ne recommandons pas de produit précis et nous ne répondons pas aux situations personnelles. Pour cela, rapprochez-vous d'un professionnel agréé.</p></div><div><h2 class="so-h3">Presse et partenariats</h2><p>Indiquez simplement votre média ou votre organisme dans le message.</p></div></div></section>`),
  { type: "form", heading: "Envoyer un message", intro: "Dites-nous comment nous pouvons vous aider. Ne communiquez ni numéro de compte ni information bancaire." }, footer(c)];
const recherche = (c) => [header(c), pagehead("Recherche", "Chercher dans le carnet", "Un mot, une rubrique, un nom d'auteur."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un article, un mot du glossaire…" } }] },
  sec(`<section class="so-sec pk-bleed"><div class="so-wrap"><div class="so-empty so-empty--static"><p class="so-empty-t">Aucun résultat ?</p><p>Essayez un mot plus court (« crédit » plutôt que « crédit immobilier »), vérifiez l'orthographe ou parcourez les rubriques.</p><ul class="so-chips">${Object.entries(CATS).map(([k, v]) => `<li><a href="/articles?cat=${k}">${v}</a></li>`).join("")}<li><a href="/glossaire">Glossaire</a></li></ul></div></div></section>`), footer(c)];
const introuvable = (c) => [header(c), sec(`<section class="so-404 pk-bleed"><div class="so-wrap so-404-in"><div class="so-404-c" aria-hidden="true">${coin("so-404-coin")}</div><p class="so-kick">Erreur 404</p><div class="so-h1" role="heading" aria-level="1">Ce sou ne figure pas dans nos comptes.</div><p class="so-sub">La page a changé d'adresse ou n'a jamais existé. Voici de quoi vous remettre sur la bonne ligne.</p><p class="so-cta"><a class="so-btn" href="/">Retour à l'accueil</a><a class="so-btn so-btn--line" href="/articles">Parcourir les articles</a><a class="so-btn so-btn--line" href="/recherche">Rechercher</a></p></div></section>`), footer(c)];
const blocs = (c) => blocsPage("so", c, header, footer, pagehead("Blocs de mise en page", "Tous les éléments d'un article, sur une page", "Titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés."), { cite: "Camille Roche", a: "#c9d9b0", b: "#9a5b00", c: "#3b6b2a", legend: "Un visuel peut accompagner n'importe quel article.", cap: "Tableau d'exemple : quatre colonnes", info: "Un encadré « À retenir » résume l'idée principale d'une section.", warn: "Un encadré « Piège » signale ce qui coûte de l'argent quand on l'oublie.", tip: "Un encadré « Astuce » propose un geste simple à faire tout de suite." });
const legal = (kind, title, kick, sub) => (c) => legalPage("so", kind, c, header, footer, pagehead(kick, title, sub), "Sou", "Atelier Sou SAS (société fictive), 12 rue de la Caisse, 75000 Paris");

module.exports = {
  key: "sou", name: "Sou", version: "1.0.0", category: "services", collection: "blog", tags: ["classique", "editorial", "chaleureux"], siteType: "Blog de finances personnelles et pédagogie de l'argent", featured: false,
  concept: "Un carnet de comptes à petits carreaux : tickets de caisse perforés, filets comptables, encadrés pédagogiques et trois calculateurs qui tournent dans le navigateur (intérêts composés, 50/30/20, mensualité de crédit).",
  description: "Blog de finances personnelles : vert billet et ocre de pièce, papier à petits carreaux, tickets perforés, encadrés pédagogiques, glossaire, dix-huit articles factices filtrables et trois calculateurs réels écrits dans les pages du thème.",
  brand: "Sou",
  modules: ["formulaires", "recherche", "blog"],
  declare: "Les 18 articles, le glossaire et les trois calculateurs sont écrits dans les pages du thème et calculés par motion.js ; ce ne sont ni des articles du CMS ni un type de contenu « calculateur ». Aucune donnée n'est envoyée.",
  dna: {
    header: "bandeau-de-reperes-fictifs-puis-barre-a-piece-et-filet-comptable",
    hero: "titre-a-gauche-et-calculateur-d-interets-vivant-dans-une-fiche-de-caisse",
    grid: "tickets-de-caisse-perfores-sur-papier-a-petits-carreaux",
    typo: "slab-aleo-et-hind-chiffres-tabulaires",
    shapes: "pieces-rondes-tickets-perfores-et-double-filet-des-totaux",
    motion: "compteurs-qui-s-incrementent-et-piece-qui-tombe-au-survol",
    rhythm: "carnet-de-comptes-lignes-regulieres-et-bandes-de-totaux",
    signature: "trois-calculateurs-reels-et-encadres-pedagogiques-a-retenir-piege-exemple",
    palette: "vert-billet-ocre-de-piece-sur-papier-vert-pale",
    image: "sans-photo-pictogrammes-de-pieces-et-schemas-de-courbes",
    list: "tickets-de-caisse-ou-registre-a-colonnes-ou-liste-compacte",
    article: "colonne-de-lecture-avec-sommaire-en-marge-et-encadres-colores",
    sidebar: "sommaire-colle-en-marge-gauche-et-fiche-auteur-en-pied",
    reading: "corps-18-px-interligne-1-7-chiffres-tabulaires-et-tableaux-defilants",
  },
  tokens: {
    colors: { primary: "#3b6b2a", secondary: "#1f2a1a", accent: "#9a5b00", background: "#eef2e6", surface: "#f9fbf4", text: "#1f2a1a", muted: "#4d5a46", success: "#2f6b3f", warning: "#9a5b00", error: "#a3302a" },
    fonts: { heading: "font.aleo", body: "font.hind", button: "font.hind", link: "font.hind" },
    radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#c9d3bb" },
    type: { h1: { size: 56, weight: 700, lineHeight: 1.08, transform: "none" }, h2: { size: 36, weight: 700, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Ocre de la pièce et des filets", type: "color", default: "#9a5b00" },
    { key: "entete", label: "Style de l'en-tête", type: "choice", default: "barre", choices: [["barre", "Bandeau de repères et barre"], ["centre", "Logo centré, navigation dessous"], ["sobre", "Sobre : barre seule, sans bandeau"]] },
    { key: "pied", label: "Style du pied de page", type: "choice", default: "ample", choices: [["ample", "Ample, quatre colonnes"], ["ticket", "Ticket de caisse compact"]] },
    { key: "liste", label: "Présentation des listes d'articles", type: "choice", default: "tickets", choices: [["tickets", "Tickets de caisse"], ["registre", "Registre à colonnes"], ["compact", "Liste compacte"]] },
    { key: "article", label: "Mise en page des articles", type: "choice", default: "marge", choices: [["marge", "Sommaire en marge"], ["colonne", "Colonne unique, sommaire en tête"]] },
    { key: "carreaux", label: "Papier à petits carreaux", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Fond uni"]] },
    { key: "sombre", label: "Mode sombre", type: "choice", default: "non", choices: [["non", "Papier clair"], ["oui", "Nuit de comptable"]] },
  ],
  menu: [["Accueil", "/"], ["Articles", "/articles"], ["Calculateurs", "/calculateurs"], ["Glossaire", "/glossaire"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "articles", name: "Articles", render: articles }, { key: "article", name: "Article", render: article },
    { key: "calculateurs", name: "Calculateurs", render: calculateurs }, { key: "glossaire", name: "Glossaire", render: glossaire }, { key: "blocs", name: "Blocs", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: legal("mentions", "Mentions légales", "Informations légales", "Qui édite ce site, qui l'héberge, et ce qu'il faut savoir avant de le copier.") },
    { key: "confidentialite", name: "Confidentialité", render: legal("confidentialite", "Politique de confidentialité", "Vos données", "Ce que reçoit le site, à quoi cela sert, et comment exercer vos droits.") },
  ],
};
