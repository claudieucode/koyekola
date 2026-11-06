// Syntaxe — blog technique fictif « Syntaxe, carnets de développeurs ». Direction artistique : papier clair ou éditeur sombre, violet électrique, monospace en accent (JetBrains Mono),
// texte courant en empattement (IBM Plex Serif) pour lire longtemps, code avec numéros de ligne et bouton « Copier » réel, sommaire flottant qui suit la lecture, arbre de catégories façon explorateur de fichiers.
// Tout est démonstration : articles, auteurs, chiffres et marques sont fictifs. Le composant signature (code copiable, filtres, sommaire, bascule d'article) fonctionne dans motion.js ; aucun type de contenu du CMS n'est simulé :
// les articles de démonstration sont écrits dans les pages du thème (le vrai blog du CMS fournit les mêmes champs : titre, extrait, catégories, étiquettes, auteur).
const { sec, esc, nav } = require("../kit");

// ---------- coloration syntaxique simple (faite à la fabrication de la page, aucune dépendance) ----------
const WORDS = {
  sql: "SELECT FROM WHERE AND OR ORDER BY GROUP LIMIT CREATE INDEX ON INSERT INTO VALUES UPDATE SET JOIN LEFT AS IN NOT NULL EXPLAIN ANALYZE DESC ASC COUNT WITH USING TABLE PRIMARY KEY CONCURRENTLY BETWEEN INTERVAL ALTER ADD COLUMN HAVING",
  js: "const let var function return if else for of await async import from export new class throw try catch true false null undefined",
  bash: "git docker sudo cd ls cat echo npm node export curl grep if then fi for do done pg_dump pg_restore sort head",
  css: "display grid flex color margin padding gap width height position container-type",
  yaml: "name on runs-on steps uses run with jobs",
};
const COMMENT = { sql: "--[^\\n]*", js: "//[^\\n]*", bash: "#[^\\n]*", css: "/\\*.*?\\*/", yaml: "#[^\\n]*", html: "<!--.*?-->" };
function hl(code, lang = "js") {
  const words = (WORDS[lang] || "").split(" ").filter(Boolean).join("|");
  const re = new RegExp(`(${COMMENT[lang] || COMMENT.js})|("[^"\\n]*"|'[^'\\n]*')|(\\b\\d+(?:\\.\\d+)?\\b)${words ? `|(\\b(?:${words})\\b)` : ""}`, lang === "sql" ? "gi" : "g");
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "n" : "k";
    out += `<span class="sx-${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}
const codeBlock = (code, lang, file) => {
  const lines = String(code).replace(/\n$/, "").split("\n");
  return `<figure class="sx-code" data-code><figcaption class="sx-code-h"><span class="sx-code-f">${esc(file || lang)}</span><span class="sx-code-l">${esc(lang)}</span><a class="sx-copy" href="#copier" role="button" data-copy-code aria-label="Copier le code de ${esc(file || lang)}"><span>Copier</span></a></figcaption><pre><code>${lines.map((l) => `<span class="sx-l">${hl(l, lang)}\n</span>`).join("")}</code></pre></figure>`;
};

// ---------- données de démonstration ----------
const AUTHORS = {
  ines: { name: "Inès Marchand", role: "Ingénieure backend", bio: "Dix ans d'API en production, plus de pannes que de certitudes. Écrit sur Node.js, les files de messages et la fiabilité." },
  thomas: { name: "Thomas Duval", role: "Ingénieur plateforme", bio: "Automatise ce qu'il a déjà cassé une fois. Intégration continue, conteneurs, observabilité." },
  lina: { name: "Lina Okafor", role: "Développeuse front-end", bio: "Accessibilité d'abord, animations ensuite. Défend le HTML sémantique dans chaque revue de code." },
  basile: { name: "Basile Roux", role: "Administrateur de bases de données", bio: "Lit des plans d'exécution au petit-déjeuner. Écrit sur PostgreSQL, les index et les migrations sans arrêt." },
};
const CATS = { backend: "Backend", front: "Frontend", devops: "DevOps", donnees: "Bases de données", outils: "Outils", retours: "Retours d'expérience" };
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const dfr = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
// [slug, titre, catégorie, étiquettes, auteur, date, minutes, extrait, [paragraphes], [langage, fichier, code]]
const ARTS = [
  ["index-ignores", "Pourquoi PostgreSQL ignore votre index (et comment le convaincre)", "donnees", ["postgresql", "performance", "sql"], "basile", "2026-11-03", 11, "Un index existe, la requête reste lente. Lire un EXPLAIN, comprendre l'ordre des colonnes et mesurer avant de corriger.", [], ["sql", "plan.sql", "EXPLAIN (ANALYZE, BUFFERS)\nSELECT id, total FROM commandes\nWHERE client_id = 4821 AND statut = 'payee'\nORDER BY cree_le DESC LIMIT 20;"]],
  ["file-messages", "Une file de messages sans perdre un seul message", "backend", ["node", "fiabilité", "architecture"], "ines", "2026-10-27", 9, "Accusés de réception, relances, idempotence : les trois habitudes qui évitent les doublons et les pertes.", ["Une file de messages promet très peu : au mieux, chaque message arrive au moins une fois. Le reste est de votre responsabilité. Le traitement doit donc supporter d'être rejoué sans effet de bord.", "Notre règle d'équipe tient en une ligne : un identifiant de message, une table des identifiants déjà traités, et un accusé de réception envoyé après la validation de la transaction, jamais avant."], ["js", "worker.js", "async function traiter(msg) {\n  if (await dejaVu(msg.id)) return msg.ack();\n  await db.transaction(async (tx) => {\n    await appliquer(tx, msg.payload);\n    await marquerVu(tx, msg.id);\n  });\n  msg.ack(); // seulement après la validation\n}"]],
  ["css-conteneurs", "Les requêtes de conteneur ont changé ma façon d'écrire des composants", "front", ["css", "composants", "responsive"], "lina", "2026-10-20", 7, "Un composant qui s'adapte à son espace, pas à l'écran : retour sur six mois d'usage en production.", ["Pendant des années, nos composants regardaient la largeur de la fenêtre pour décider de leur mise en page. Le jour où la même carte a dû vivre dans une colonne étroite et dans un bandeau large, tout s'est compliqué.", "Avec les requêtes de conteneur, la carte pose une règle simple sur son parent et décide seule. Les media queries restent pour la mise en page globale, rien de plus."], ["css", "carte.css", ".carte-zone { container-type: inline-size; }\n@container (min-width: 480px) {\n  .carte { display: grid; grid-template-columns: 160px 1fr; gap: 16px; }\n}"]],
  ["ci-cache", "Diviser par trois le temps de votre intégration continue", "devops", ["ci", "cache", "docker"], "thomas", "2026-10-13", 8, "Cache de dépendances, couches Docker ordonnées, tests en parallèle : le détail de ce qui a vraiment fait gagner du temps.", ["Avant de paralléliser quoi que ce soit, regardez où part le temps. Chez nous, 60 % de la durée venait de l'installation des dépendances, répétée à chaque exécution.", "Le plus rentable a été le plus banal : une clé de cache calculée sur le fichier de verrouillage, et un Dockerfile qui copie ce fichier avant le reste du code."], ["yaml", "ci.yml", "- name: Cache des dépendances\n  uses: actions/cache@v4\n  with:\n    path: ~/.npm\n    key: npm-${{ hashFiles('package-lock.json') }}"]],
  ["migrations-sans-arret", "Des migrations de schéma sans arrêt de service", "donnees", ["postgresql", "migrations"], "basile", "2026-10-06", 12, "Ajouter une colonne, la remplir, la rendre obligatoire : trois déploiements, zéro minute d'indisponibilité.", ["Le piège classique d'une migration, c'est le verrou. Un simple ALTER TABLE sur une grosse table peut bloquer toutes les écritures le temps de la réécriture.", "La parade tient en trois temps : ajouter la colonne sans contrainte, remplir par petits lots, puis valider la contrainte une fois les données propres."], ["sql", "migration.sql", "ALTER TABLE clients ADD COLUMN pays text;\nCREATE INDEX CONCURRENTLY idx_clients_pays ON clients (pays);\n-- puis, après remplissage par lots :\nALTER TABLE clients ALTER COLUMN pays SET NOT NULL;"]],
  ["git-reflog", "Git reflog : retrouver ce que vous croyiez perdu", "outils", ["git", "astuces"], "thomas", "2026-09-29", 5, "Un rebase raté, une branche supprimée : le journal des références garde presque tout pendant quatre-vingt-dix jours.", ["Git ne supprime presque rien tout de suite. Chaque déplacement de pointeur est consigné dans le reflog, y compris les commits qui n'appartiennent plus à aucune branche.", "Avant de paniquer, listez le journal, repérez l'état d'avant la fausse manœuvre et créez une branche à cet endroit. Vous retrouvez votre travail intact."], ["bash", "terminal", "git reflog -n 10\ngit branch secours HEAD@{3}\ngit switch secours"]],
  ["retour-monolithe", "Pourquoi nous sommes revenus à un monolithe modulaire", "retours", ["architecture", "équipe"], "ines", "2026-09-22", 14, "Dix-huit mois de microservices, une équipe de sept personnes et une facture d'infrastructure en trop : le récit d'un retour en arrière.", ["Nous avions découpé trop tôt. Avec sept développeurs, chaque changement transversal demandait trois dépôts, trois déploiements et une réunion pour se mettre d'accord sur l'ordre.", "Le monolithe modulaire n'est pas une défaite : les frontières restent, appliquées par le code et les tests d'architecture, mais un seul déploiement suffit."], null],
  ["a11y-formulaires", "Des formulaires accessibles sans une ligne de JavaScript", "front", ["accessibilité", "html"], "lina", "2026-09-15", 6, "Libellés, messages d'erreur, ordre de tabulation : le HTML natif fait déjà 90 % du travail.", ["Un champ sans libellé associé est un champ muet pour un lecteur d'écran. L'association explicite coûte deux attributs et règle la moitié des problèmes que nous rencontrons en audit.", "Pour les erreurs, décrivez le problème en texte, reliez-le au champ, et ne comptez jamais sur la couleur seule."], ["html", "champ.html", "<label for=\"email\">Adresse e-mail</label>\n<input id=\"email\" type=\"email\" autocomplete=\"email\"\n       aria-describedby=\"email-aide\" required>\n<p id=\"email-aide\">Nous ne l'utilisons que pour répondre.</p>"]],
  ["docker-slim", "Des images Docker deux fois plus légères", "devops", ["docker", "sécurité"], "thomas", "2026-09-08", 7, "Construction en plusieurs étapes, image de base minimale, utilisateur non privilégié : une recette qui tient en vingt lignes.", ["Une image légère se télécharge plus vite, démarre plus vite et expose moins de surface d'attaque. Les trois gains vont dans le même sens, ce qui est rare en ingénierie.", "La construction en deux étapes sépare les outils de compilation de l'image finale, qui ne garde que le binaire et ses dépendances d'exécution."], ["bash", "terminal", "docker build -t api:slim .\ndocker image ls api\ndocker run --user 10001 api:slim"]],
  ["tests-contrat", "Tests de contrat : arrêter de casser l'API des autres", "backend", ["tests", "api"], "ines", "2026-09-01", 10, "Quand le client et le serveur évoluent chacun de leur côté, un contrat partagé vaut mieux que trois réunions.", ["Le test de contrat décrit ce que le client attend, pas ce que le serveur sait faire. Le serveur rejoue ces attentes à chaque modification, avant le déploiement.", "Le gain n'est pas seulement technique : le contrat devient la documentation vivante de la relation entre deux équipes."], null],
  ["vim-tmux", "Mon environnement de travail en 2026, sans fioritures", "outils", ["terminal", "productivité"], "basile", "2026-08-25", 6, "Un éditeur, un multiplexeur, six alias : pourquoi j'ai arrêté de changer d'outils tous les trois mois.", ["La productivité vient moins des outils que de leur stabilité. Chaque changement de configuration coûte une semaine de gestes ralentis.", "Voici ce qui n'a pas bougé depuis un an, et les deux seuls ajouts que je referais sans hésiter."], null],
  ["grid-subgrid", "CSS Grid et subgrid : aligner les cartes une bonne fois", "front", ["css", "grid"], "lina", "2026-08-18", 6, "Titres, textes et boutons alignés d'une carte à l'autre sans hauteurs fixes ni JavaScript.", ["Le vieux problème des cartes : le bouton du bas ne s'aligne jamais, parce que chaque carte possède sa propre grille. Le subgrid permet à la carte d'hériter des lignes de sa parente.", "Résultat : titres, descriptions et boutons sont sur les mêmes lignes, quelle que soit la longueur du texte."], ["css", "cartes.css", ".cartes { display: grid; grid-template-columns: repeat(3, 1fr); }\n.carte { display: grid; grid-row: span 3; grid-template-rows: subgrid; }"]],
  ["observabilite", "Trois signaux suffisent pour commencer l'observabilité", "devops", ["observabilité", "logs"], "thomas", "2026-08-11", 9, "Journaux structurés, quatre métriques d'or, traces sur les parcours critiques : par où commencer sans tout instrumenter.", ["On vous vendra des tableaux de bord par centaines. Commencez par trois choses : des journaux en JSON, un compteur d'erreurs par service et la latence au 95e centile.", "Le reste viendra des questions que vous vous poserez vraiment pendant un incident."], null],
  ["json-colonnes", "Colonnes JSON dans PostgreSQL : quand c'est une bonne idée", "donnees", ["postgresql", "json"], "basile", "2026-08-04", 8, "Données semi-structurées, index GIN, contraintes : un guide de décision plutôt qu'un dogme.", ["Une colonne JSON est une excellente soupape pour des attributs variables. Elle devient un piège quand elle cache un schéma que vous auriez dû modéliser.", "Notre règle : si vous filtrez ou joignez dessus tous les jours, sortez-le en vraie colonne."], ["sql", "json.sql", "CREATE INDEX idx_prefs ON utilisateurs USING GIN (preferences);\nSELECT id FROM utilisateurs\nWHERE preferences @> '{\"theme\": \"sombre\"}';"]],
  ["incident-matin", "Anatomie d'un incident de production un lundi matin", "retours", ["incident", "équipe"], "ines", "2026-07-28", 13, "Une certification expirée, un cache qui masque le problème, et la chronologie minute par minute de la remise en service.", ["À 8 h 12, les premiers messages d'erreur arrivent. À 8 h 40, nous comprenons que le certificat d'un service interne a expiré pendant le week-end.", "Le plus instructif n'est pas la cause, mais ce que notre organisation a révélé : une alerte existait, mais personne n'en était destinataire."], null],
  ["cli-maison", "Écrire sa propre ligne de commande en vingt minutes", "outils", ["node", "cli"], "basile", "2026-07-21", 5, "Un script qui mérite d'être partagé : arguments, aide intégrée et codes de sortie propres.", ["Un bon outil en ligne de commande répond à trois questions sans documentation : que fais-tu, comment t'appelle-t-on et que s'est-il passé ?", "Quelques lignes suffisent pour lire des arguments, afficher l'aide et retourner un code de sortie utile à vos scripts."], ["js", "outil.js", "const [,, cmd, ...args] = process.argv;\nif (!cmd || cmd === '--aide') {\n  console.log('usage : outil <commande>');\n  process.exit(0);\n}"]],
];
const ARTICLES = ARTS.map((a) => ({ slug: a[0], title: a[1], cat: a[2], tags: a[3], author: a[4], date: a[5], min: a[6], excerpt: a[7], body: a[8], code: a[9] }));
const tagKey = (t) => "t-" + t.replace(/[^a-z0-9]/g, "");
const TAGS = [...new Set(ARTICLES.flatMap((a) => a.tags))].sort();
const SNIPS = [
  ["Retrouver les gros fichiers d'un dépôt", "bash", "gros.sh", "git rev-list --objects --all \\\n  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \\\n  | sort -k3 -n -r | head -10"],
  ["Anti-rebond d'une saisie", "js", "debounce.js", "const debounce = (fn, ms = 250) => {\n  let t;\n  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };\n};"],
  ["Index partiel sur les lignes actives", "sql", "partiel.sql", "CREATE INDEX idx_commandes_ouvertes\nON commandes (cree_le)\nWHERE statut = 'ouverte';"],
  ["Centrer sans y penser", "css", "centre.css", ".centre { display: grid; place-items: center; min-height: 100svh; }"],
  ["Compter les doublons", "sql", "doublons.sql", "SELECT email, COUNT(*) FROM clients\nGROUP BY email HAVING COUNT(*) > 1\nORDER BY COUNT(*) DESC;"],
  ["Réessayer avec attente croissante", "js", "retry.js", "async function reessayer(fn, n = 4) {\n  for (let i = 0; i < n; i++) {\n    try { return await fn(); }\n    catch (e) { if (i === n - 1) throw e; await new Promise((r) => setTimeout(r, 2 ** i * 200)); }\n  }\n}"],
  ["Nettoyer les conteneurs arrêtés", "bash", "nettoyage.sh", "docker container prune -f\ndocker image prune -a --filter \"until=720h\" -f"],
  ["Trier un tableau d'objets en français", "js", "tri.js", "personnes.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));"],
  ["Variables CSS pour un mode sombre", "css", "sombre.css", ".app { --fond: #fff; --texte: #1b1b22; }\n@media (prefers-color-scheme: dark) {\n  .app { --fond: #14121c; --texte: #ecebf3; }\n}"],
  ["Sauvegarde PostgreSQL compressée", "bash", "sauvegarde.sh", "pg_dump -Fc ma_base > sauvegarde-$(date +%F).dump\npg_restore -l sauvegarde-2026-11-03.dump | head"],
  ["Lire un JSON imbriqué sans planter", "js", "chemin.js", "const lire = (o, chemin, defaut) =>\n  chemin.split('.').reduce((v, k) => (v == null ? v : v[k]), o) ?? defaut;"],
  ["Flux de travail de test minimal", "yaml", "tests.yml", "name: tests\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm test"],
];
const LANGS = [...new Set(SNIPS.map((s) => s[1]))];

// ---------- pictogrammes ----------
const IC = {
  arr: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
const ic = (k) => `<svg class="sx-ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

// ---------- éléments communs ----------
const header = (c) => `<header class="sx-head pk-bleed"><div class="sx-w sx-head-in">
<a class="sx-brand" href="/" aria-label="${esc(c.brand)} — accueil"><span class="sx-brand-p" aria-hidden="true">~/</span>syntaxe<span class="sx-caret" aria-hidden="true"></span></a>
<div class="sx-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "sx-nl")}</div>
<a class="sx-find" href="/recherche" aria-label="Rechercher dans le blog"><kbd>/</kbd><span>chercher</span></a>
</div></header>`;
const footer = (c) => `<footer class="sx-foot pk-bleed"><div class="sx-w sx-foot-in">
<div class="sx-foot-a"><a class="sx-brand sx-brand--f" href="/" aria-label="${esc(c.brand)} — accueil"><span class="sx-brand-p" aria-hidden="true">~/</span>syntaxe</a><p>Carnets de développeurs : des articles longs, des extraits de code qui marchent, aucune promesse de miracle.</p></div>
<div class="sx-foot-b"><h2 class="sx-foot-t">Explorer</h2><a href="/articles">Tous les articles</a><a href="/snippets">Extraits de code</a><a href="/auteurs">Les auteurs</a><a href="/blocs">Éléments de rédaction</a></div>
<div class="sx-foot-c"><h2 class="sx-foot-t">Rubriques</h2>${Object.entries(CATS).map(([k, v]) => `<a href="/articles#${k}">${esc(v)}</a>`).join("")}</div>
<div class="sx-foot-d"><h2 class="sx-foot-t">Le site</h2><a href="/contact">Écrire à la rédaction</a><a href="/recherche">Recherche</a><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div>
</div><div class="sx-status"><div class="sx-w sx-status-in"><span><i class="sx-dot" aria-hidden="true"></i> main</span><span>0 erreur · 0 avertissement</span><span>© 2026 Syntaxe — site de démonstration, contenus fictifs</span></div></div></footer>`;
const pagehead = (kicker, title, lead) => sec(`<section class="sx-ph pk-bleed"><div class="sx-w"><p class="sx-prompt" data-reveal><span aria-hidden="true">$</span> ${esc(kicker)}</p><div class="sx-h1" role="heading" aria-level="1" data-reveal>${title}</div>${lead ? `<p class="sx-lead" data-reveal>${esc(lead)}</p>` : ""}</div></section>`);
const catBadge = (k) => `<a class="sx-cat sx-cat--${k}" href="/articles#${k}">${esc(CATS[k])}</a>`;
const artData = (a, i) => `data-slug="${a.slug}" data-cat="${a.cat}" data-tags="${a.tags.map(tagKey).join(" ")}" data-date="${a.date}" data-min="${a.min}" data-n="${i}"`;
const row = (a, i) => `<li class="sx-item" ${artData(a, i)}><a class="sx-item-a" href="/article#${a.slug}"><time class="sx-item-d" datetime="${a.date}">${dfr(a.date)}</time><span class="sx-item-t">${esc(a.title)}</span><span class="sx-item-x">${esc(a.excerpt)}</span></a><span class="sx-item-m">${catBadge(a.cat)}<span class="sx-item-r">${a.min} min · ${esc(AUTHORS[a.author].name)}</span></span></li>`;
const list = (arr, extra = "") => `<ol class="sx-list ${extra}" data-list>${arr.map((a, i) => row(a, i)).join("")}</ol><p class="sx-empty" data-empty hidden>Aucun article ne correspond à ce filtre. <a href="/articles">Réinitialiser</a></p>`;
const chips = (items, attr, all) => `<div class="sx-chips" role="group" aria-label="Filtrer"><a class="sx-chip is-on" href="#tous" role="button" data-${attr}="tous" aria-pressed="true">${all}</a>${items.map(([k, v]) => `<a class="sx-chip" href="#${k}" role="button" data-${attr}="${k}" aria-pressed="false">${esc(v)}</a>`).join("")}</div>`;
const bandTitle = (n, t, sub, more) => `<div class="sx-bt"><div><p class="sx-prompt"><span aria-hidden="true">${n}</span></p><h2 class="sx-h2">${esc(t)}</h2>${sub ? `<p class="sx-sub">${esc(sub)}</p>` : ""}</div>${more ? `<a class="sx-more" href="${more[1]}">${esc(more[0])} ${ic("arr")}</a>` : ""}</div>`;

// ---------- pages ----------
const A0 = ARTICLES[0];
const home = (c) => [
  sec(header(c)),
  sec(`<section class="sx-hero pk-bleed"><div class="sx-w sx-hero-in">
<div class="sx-hero-l"><p class="sx-prompt" data-reveal><span aria-hidden="true">$</span> syntaxe --depuis 2019 --sans-jargon-inutile</p>
<div class="sx-h1 sx-h1--home" role="heading" aria-level="1" data-reveal>Du code expliqué, <em>pas survendu.</em></div>
<p class="sx-lead" data-reveal>Quatre développeurs écrivent ce qu'ils auraient aimé lire : des articles longs, des extraits qui tournent vraiment, et des retours d'expérience où l'on avoue aussi ce qui a raté.</p>
<div class="sx-actions" data-reveal><a class="sx-btn" href="/articles">Lire les articles ${ic("arr")}</a><a class="sx-btn sx-btn--g" href="/snippets">Copier un extrait</a></div></div>
<a class="sx-feat" href="/article#${A0.slug}" data-reveal><div class="sx-feat-bar" aria-hidden="true"><i></i><i></i><i></i><span>a-la-une.md</span></div>
<div class="sx-feat-b"><span class="sx-cat sx-cat--donnees">${CATS[A0.cat]}</span><h2 class="sx-feat-t">${esc(A0.title)}</h2><p>${esc(A0.excerpt)}</p><span class="sx-meta">${esc(AUTHORS[A0.author].name)} · ${dfr(A0.date)} · ${A0.min} min</span>
<pre class="sx-feat-code" aria-hidden="true"><code>${hl(A0.code[2].split("\n").slice(0, 3).join("\n"), "sql")}</code></pre></div></a>
</div></section>`),
  sec(`<section class="sx-tree-s pk-bleed"><div class="sx-w sx-tree-in">
<div class="sx-tree" role="navigation" aria-label="Rubriques"><p class="sx-tree-h">${ic("folder")} ~/articles</p><ul>${Object.entries(CATS).map(([k, v]) => `<li><a href="/articles#${k}"><span aria-hidden="true">├──</span> ${esc(v.toLowerCase().replace(/ /g, "-"))}/ <b>${ARTICLES.filter((a) => a.cat === k).length}</b></a></li>`).join("")}</ul>
<p class="sx-tree-h">${ic("folder")} ~/etiquettes</p><ul class="sx-tree-tags">${TAGS.slice(0, 9).map((t) => `<li><a href="/articles#${tagKey(t)}">#${esc(t)}</a></li>`).join("")}</ul></div>
<div class="sx-tree-m">${bandTitle("01", "Derniers articles", "Publiés ces dernières semaines.", ["Toutes les archives", "/articles"])}${list(ARTICLES.slice(0, 7), "sx-list--home")}</div></div></section>`),
  sec(`<section class="sx-sn pk-bleed"><div class="sx-w">${bandTitle("02", "Extraits à copier", "Petits, testés, commentés. Un clic, et c'est dans votre presse-papiers.", ["Tous les extraits", "/snippets"])}
<div class="sx-sn-g">${SNIPS.slice(0, 3).map((s) => `<article class="sx-sn-c" data-reveal><h3 class="sx-h3">${esc(s[0])}</h3>${codeBlock(s[3], s[1], s[2])}</article>`).join("")}</div></div></section>`),
  sec(`<section class="sx-au pk-bleed"><div class="sx-w">${bandTitle("03", "Qui écrit ici", "Quatre auteurs, chacun dans son domaine.", ["Les auteurs", "/auteurs"])}
<ul class="sx-au-g">${Object.values(AUTHORS).map((a) => `<li class="sx-au-c" data-reveal><span class="sx-av" aria-hidden="true">${a.name.split(" ").map((x) => x[0]).join("")}</span><b>${esc(a.name)}</b><span>${esc(a.role)}</span></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const articles = (c) => [
  sec(header(c)),
  pagehead("ls -l ~/articles", "Tous les articles", "Seize textes, du plus récent au plus ancien. Filtrez par rubrique ou par étiquette ; le choix est conservé dans l'adresse de la page."),
  sec(`<section class="sx-arch pk-bleed"><div class="sx-w">
<div class="sx-filters" data-filters><p class="sx-fl">Rubrique</p>${chips(Object.entries(CATS), "cat", "Toutes")}<p class="sx-fl">Étiquette</p>${chips(TAGS.map((t) => [tagKey(t), "#" + t]), "tag", "Toutes")}
<p class="sx-fl">Tri</p><div class="sx-chips" role="group" aria-label="Trier"><a class="sx-chip is-on" href="#recent" role="button" data-sort="date" aria-pressed="true">Plus récents</a><a class="sx-chip" href="#courts" role="button" data-sort="min" aria-pressed="false">Lectures courtes d'abord</a></div>
<p class="sx-count" role="status" aria-live="polite"><b data-count>${ARTICLES.length}</b> article(s)</p></div>
${list(ARTICLES)}</div></section>`),
  sec(footer(c)),
];

const snippets = (c) => [
  sec(header(c)),
  pagehead("cat ~/snippets/*", "Extraits de code", "Des morceaux courts, relus par un humain et exécutés au moins une fois. Chaque bloc a son bouton « Copier »."),
  sec(`<section class="sx-snip pk-bleed"><div class="sx-w"><div class="sx-filters" data-filters><p class="sx-fl">Langage</p>${chips(LANGS.map((l) => [l, l]), "lang", "Tous")}</div>
<div class="sx-snip-g" data-list>${SNIPS.map((s, i) => `<article class="sx-snip-c" data-lang="${s[1]}" data-n="${i}"><h2 class="sx-h3">${esc(s[0])}</h2>${codeBlock(s[3], s[1], s[2])}</article>`).join("")}</div>
<p class="sx-empty" data-empty hidden>Aucun extrait pour ce langage.</p>
<aside class="sx-callout sx-callout--w"><b>Bon à savoir.</b> Relisez toujours un extrait avant de l'exécuter sur une base de données ou un dépôt qui compte. Ces exemples sont fournis à titre pédagogique.</aside></div></section>`),
  sec(footer(c)),
];

const toc = [["symptome", "Le symptôme"], ["explain", "Lire un EXPLAIN sans se perdre"], ["ordre", "L'ordre des colonnes compte"], ["partiel", "L'index partiel, parent pauvre"], ["mesure", "Mesurer avant et après"], ["conclusion", "Ce qu'on retient"]];
const article = (c) => [
  sec(header(c)),
  sec(`<div class="sx-prog pk-bleed" aria-hidden="true"><i data-prog></i></div><section class="sx-ah pk-bleed"><div class="sx-w sx-ah-in"><p class="sx-crumb"><a href="/">accueil</a> / <a href="/articles">articles</a> / <a href="/articles#donnees" data-a-cat>bases de données</a></p>
<div class="sx-h1 sx-h1--art" role="heading" aria-level="1" data-a-title>${esc(A0.title)}</div>
<p class="sx-lead" data-a-lead>${esc(A0.excerpt)}</p><p class="sx-ameta" data-a-meta>${esc(AUTHORS[A0.author].name)} · ${dfr(A0.date)} · ${A0.min} min de lecture</p></div></section>`),
  sec(`<section class="sx-ab pk-bleed"><div class="sx-w sx-ab-in">
<aside class="sx-toc" aria-label="Sommaire" data-toc><p class="sx-toc-h">Sommaire</p><ol>${toc.map(([k, t]) => `<li><a href="#${k}" data-toc-l="${k}">${esc(t)}</a></li>`).join("")}</ol><p class="sx-toc-r"><a href="#haut" role="button" data-top>↑ Haut de page</a></p></aside>
<article class="sx-art" data-body>
<p>Vous avez créé l'index, la colonne est bien indexée, et pourtant la requête met quatre secondes. Avant d'accuser le moteur, il faut lui demander ce qu'il a fait : c'est le rôle du plan d'exécution. Dans cet article, nous partons d'un cas réel (une table de commandes de 12 millions de lignes) et nous le corrigeons en trois étapes.</p>
<h2 data-anchor="symptome">Le symptôme</h2>
<p>La requête qui affiche les vingt dernières commandes payées d'un client est lente, alors qu'un index sur <code>client_id</code> existe. Voici la requête, avec les options qui rendent le plan lisible :</p>
${codeBlock(A0.code[2], "sql", "plan.sql")}
<p>Le plan montre un parcours séquentiel de toute la table, suivi d'un tri. L'index n'est tout simplement pas utilisé. C'est le comportement attendu dans certains cas, et un bug dans aucun.</p>
<h2 data-anchor="explain">Lire un EXPLAIN sans se perdre</h2>
<p>Un plan se lit de l'intérieur vers l'extérieur, du nœud le plus indenté vers le haut. Trois informations suffisent pour commencer :</p>
<ul><li><strong>Le type de nœud</strong> : <code>Seq Scan</code>, <code>Index Scan</code>, <code>Bitmap Heap Scan</code>.</li><li><strong>Les lignes estimées contre les lignes réelles</strong> : un grand écart signale des statistiques périmées.</li><li><strong>Le temps réel</strong>, que l'on compare nœud par nœud.</li></ul>
<blockquote><p>Le planificateur ne choisit pas l'index le plus malin, il choisit le plan le moins coûteux d'après ses statistiques. Si les statistiques mentent, le plan se trompe.</p><cite>Basile Roux</cite></blockquote>
<h2 data-anchor="ordre">L'ordre des colonnes compte</h2>
<p>Notre requête filtre sur deux colonnes et trie sur une troisième. Un index composite doit suivre cet ordre : d'abord les colonnes comparées par égalité, ensuite celle du tri.</p>
${codeBlock("CREATE INDEX CONCURRENTLY idx_commandes_client_statut_date\nON commandes (client_id, statut, cree_le DESC);", "sql", "index.sql")}
<aside class="sx-callout"><b>Astuce</b> Utilisez toujours <code>CONCURRENTLY</code> sur une table en production : la création est plus longue, mais les écritures ne sont pas bloquées.</aside>
<h2 data-anchor="partiel">L'index partiel, parent pauvre</h2>
<p>Si 95 % des commandes sont déjà terminées et que vous n'interrogez que les ouvertes, indexez seulement ces dernières. L'index est vingt fois plus petit et reste en mémoire.</p>
<h2 data-anchor="mesure">Mesurer avant et après</h2>
<p>Ne vous fiez jamais à une seule exécution : la première remplit le cache. Faites trois mesures et gardez la médiane.</p>
<div class="sx-tw"><table><caption>Temps de la requête, médiane de trois exécutions (jeu de données de démonstration)</caption><thead><tr><th scope="col">Configuration</th><th scope="col">Plan</th><th scope="col">Temps</th></tr></thead><tbody><tr><td>Index sur client_id seul</td><td>Seq Scan + tri</td><td>4 120 ms</td></tr><tr><td>Index composite</td><td>Index Scan</td><td>3,8 ms</td></tr><tr><td>Index partiel</td><td>Index Scan</td><td>2,1 ms</td></tr></tbody></table></div>
<h2 data-anchor="conclusion">Ce qu'on retient</h2>
<ol><li>Lisez le plan avant de créer un index.</li><li>Égalités d'abord, tri ensuite.</li><li>Pensez partiel quand la donnée utile est minoritaire.</li><li>Mesurez trois fois.</li></ol>
<div class="sx-box"><span class="sx-av sx-av--l" aria-hidden="true">BR</span><div><b>Basile Roux</b><p>Administrateur de bases de données. Lit des plans d'exécution au petit-déjeuner. <a href="/auteurs">Tous ses articles</a></p></div></div>
</article></div></section>`),
  sec(`<section class="sx-rel pk-bleed"><div class="sx-w">${bandTitle("→", "À lire ensuite", null)}<ol class="sx-list" data-rel>${ARTICLES.slice(1, 5).map((a, i) => row(a, i + 1)).join("")}</ol></div></section>`),
  sec(`<div class="sx-data pk-bleed" data-data hidden>${ARTICLES.slice(1).map((a) => `<article data-slug="${a.slug}" data-title="${esc(a.title)}" data-lead="${esc(a.excerpt)}" data-cat="${a.cat}" data-catl="${esc(CATS[a.cat])}" data-meta="${esc(AUTHORS[a.author].name)} · ${dfr(a.date)} · ${a.min} min de lecture">${(a.body.length ? a.body : [a.excerpt, "Cet article de démonstration est volontairement bref : sur un vrai site, le texte complet apparaît ici, avec son sommaire et ses extraits de code."]).map((p) => `<p>${esc(p)}</p>`).join("")}${a.code ? codeBlock(a.code[2], a.code[0], a.code[1]) : ""}</article>`).join("")}</div>`),
  sec(footer(c)),
];

const auteurs = (c) => [
  sec(header(c)),
  pagehead("git shortlog -sn", "Les auteurs", "Quatre personnes, un même principe : n'écrire que sur ce qu'on a mis en production."),
  sec(`<section class="sx-aup pk-bleed"><div class="sx-w"><ul class="sx-aup-g">${Object.entries(AUTHORS).map(([k, a]) => `<li class="sx-aup-c" data-reveal><span class="sx-av sx-av--l" aria-hidden="true">${a.name.split(" ").map((x) => x[0]).join("")}</span><div><h2 class="sx-h3">${esc(a.name)}</h2><p class="sx-role">${esc(a.role)}</p><p>${esc(a.bio)}</p>
<p class="sx-aup-l">${ARTICLES.filter((x) => x.author === k).map((x) => `<a href="/article#${x.slug}">${esc(x.title)}</a>`).join("")}</p></div></li>`).join("")}</ul></div></section>`),
  sec(`<section class="sx-join pk-bleed"><div class="sx-w sx-join-in"><div><h2 class="sx-h2">Une idée d'article ?</h2><p class="sx-lead">Nous relisons chaque proposition. Dites-nous ce que vous avez appris à la dure, nous vous aiderons à le raconter.</p></div><a class="sx-btn" href="/contact">Proposer un sujet ${ic("arr")}</a></div></section>`),
  sec(footer(c)),
];

const blocs = (c) => [
  sec(header(c)),
  pagehead("cat styleguide.md", "Éléments de rédaction", "Tous les blocs disponibles pour écrire un article : titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés."),
  sec(`<section class="sx-ab pk-bleed"><div class="sx-w"><article class="sx-art sx-art--wide">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec du <strong>gras</strong>, de l'<em>italique</em>, un <a href="/articles">lien</a>, du <code>code en ligne</code>, une touche <kbd>Ctrl</kbd> + <kbd>C</kbd> et une <mark>mise en évidence</mark>. Le texte courant reste à 17 px minimum, sur une ligne de 60 à 75 caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément<ul><li>Sous-élément</li></ul></li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote><p>Une citation se détache par un filet violet et une marge généreuse.</p><cite>Autrice ou auteur fictif</cite></blockquote>
<figure class="sx-fig"><div class="sx-diag" role="img" aria-label="Schéma de démonstration : un client envoie à une file, qui alimente un worker"><span>client</span><i aria-hidden="true"></i><span>file</span><i aria-hidden="true"></i><span>worker</span></div><figcaption>Figure : une image avec sa légende (schéma réalisé en HTML, texte alternatif fourni).</figcaption></figure>
<div class="sx-tw"><table><caption>Un tableau qui défile horizontalement sur mobile</caption><thead><tr><th scope="col">Nom</th><th scope="col">Type</th><th scope="col">Défaut</th><th scope="col">Description</th></tr></thead><tbody><tr><td>timeout</td><td>nombre</td><td>30</td><td>Durée maximale en secondes avant abandon de la requête.</td></tr><tr><td>retries</td><td>nombre</td><td>3</td><td>Nombre de nouvelles tentatives.</td></tr></tbody></table></div>
${codeBlock("function bonjour(nom) {\n  return `Bonjour ${nom}`; // un commentaire\n}", "js", "exemple.js")}
<p class="sx-actions"><a class="sx-btn" href="/articles">Bouton principal</a><a class="sx-btn sx-btn--g" href="/snippets">Bouton secondaire</a></p>
<div class="sx-cols"><div><h3>Colonne 1</h3><p>Deux colonnes côte à côte sur grand écran, empilées sur mobile.</p></div><div><h3>Colonne 2</h3><p>Chaque colonne garde sa propre mesure de lecture.</p></div></div>
<aside class="sx-callout"><b>Note</b> Un encadré d'information, avec une icône discrète et un contraste conforme.</aside><aside class="sx-callout sx-callout--w"><b>Attention</b> Un encadré d'avertissement pour ce qui peut casser en production.</aside>
</article></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("mail redaction@syntaxe", "Contact", "Une erreur dans un article, une idée de sujet, une question : écrivez-nous. Nous répondons sous quelques jours."),
  { type: "form", heading: "Écrire à la rédaction", intro: "Le formulaire fonctionne comme sur un vrai site ; dans cette démonstration, aucun message n'est lu par une rédaction réelle." },
  sec(`<section class="sx-info pk-bleed"><div class="sx-w sx-info-in"><div><h2 class="sx-h3">Signaler une erreur</h2><p>Indiquez l'adresse de l'article, la phrase concernée et ce que vous avez constaté. Nous corrigeons et nous mentionnons la correction en fin d'article.</p></div><div><h2 class="sx-h3">Proposer un sujet</h2><p>Trois lignes suffisent : le problème, la solution que vous avez retenue, ce qui vous a surpris. Voyez aussi <a href="/auteurs">qui écrit ici</a>.</p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("grep -ri \"…\" ~/articles", "Recherche", "Un mot, un langage, une erreur : tapez ce que vous cherchez."),
  { type: "layout", children: [{ type: "search", props: { target: "blog", placeholder: "Rechercher un article, un langage, une commande…", button: "Chercher" } }] },
  sec(`<section class="sx-none pk-bleed"><div class="sx-w"><div class="sx-term" aria-hidden="true"><span>$ grep -r "xyzzy" ~/articles</span><span>grep: aucun résultat</span><span>$ <i class="sx-caret"></i></span></div><h2 class="sx-h3">Si rien ne s'affiche</h2><p>Essayez un mot plus court, retirez les accents ou parcourez les rubriques : <a href="/articles#backend">Backend</a>, <a href="/articles#front">Frontend</a>, <a href="/articles#devops">DevOps</a>, <a href="/articles#donnees">Bases de données</a>.</p></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="sx-404 pk-bleed"><div class="sx-w"><div class="sx-term sx-term--big" aria-hidden="true"><span>$ curl -I https://syntaxe.example/cette-page</span><span class="sx-e">HTTP/1.1 404 Not Found</span><span>$ <i class="sx-caret"></i></span></div>
<div class="sx-h1" role="heading" aria-level="1">Erreur 404 : page introuvable</div><p class="sx-lead">L'adresse n'existe pas ou a changé. Ce n'est pas vous, c'est (probablement) un lien périmé.</p>
<div class="sx-actions"><a class="sx-btn" href="/">Retour à l'accueil</a><a class="sx-btn sx-btn--g" href="/articles">Parcourir les articles</a><a class="sx-btn sx-btn--g" href="/recherche">Chercher</a></div></div></section>`),
  sec(footer(c)),
];
const legal = (kicker, title, items) => (c) => [
  sec(header(c)),
  pagehead(kicker, title, "Texte de démonstration, à adapter par l'éditeur réel du site."),
  sec(`<section class="sx-ab pk-bleed"><div class="sx-w"><article class="sx-art sx-art--wide">${items.map(([t, p]) => `<h2>${esc(t)}</h2><p>${p}</p>`).join("")}<p><a href="/contact">Une question sur ce texte ? Écrivez-nous.</a></p></article></div></section>`),
  sec(footer(c)),
];
const mentions = legal("cat MENTIONS.md", "Mentions légales", [
  ["Éditeur du site", "Syntaxe est un site de démonstration édité par une structure fictive (« Association Syntaxe »). Aucune activité réelle n'y est exercée ; remplacez ces lignes par l'identité, l'adresse et le numéro d'immatriculation de votre structure."],
  ["Direction de la publication", "La direction de la publication est assurée par un responsable fictif, joignable par le <a href=\"/contact\">formulaire de contact</a>."],
  ["Hébergement", "L'hébergeur réel du site doit être indiqué ici : dénomination, adresse et coordonnées. Cette information est obligatoire pour tout site publié en France."],
  ["Propriété intellectuelle", "Les articles et extraits de code de démonstration sont fictifs. Sur un site réel, précisez la licence (par exemple Creative Commons pour les textes, MIT pour les extraits de code)."],
  ["Responsabilité", "Les extraits de code sont fournis à titre pédagogique, sans garantie. Testez-les dans un environnement isolé avant tout usage en production."],
]);
const confidentialite = legal("cat CONFIDENTIALITE.md", "Politique de confidentialité", [
  ["Données collectées", "Via le formulaire de contact : nom, adresse e-mail et contenu du message. Aucune donnée n'est collectée pour la simple lecture des articles."],
  ["Finalité et base légale", "Les données servent uniquement à répondre à votre demande (intérêt légitime / mesures précontractuelles). Elles ne sont ni revendues ni utilisées à des fins publicitaires."],
  ["Durée de conservation", "Les messages sont conservés douze mois au plus, puis supprimés. Les commentaires, s'ils sont activés, le sont tant que l'article est publié."],
  ["Vos droits", "Vous pouvez demander l'accès, la rectification ou la suppression de vos données via le <a href=\"/contact\">formulaire de contact</a>. Vous pouvez aussi saisir l'autorité de contrôle compétente."],
  ["Cookies et mesure d'audience", "Le thème ne dépose aucun cookie : la progression de lecture reste dans votre navigateur uniquement."],
]);

module.exports = {
  key: "syntaxe", name: "Syntaxe", version: "1.0.0", category: "tech", tags: ["technique", "editorial", "moderne"], siteType: "Blog technique / carnets de développeurs", collection: "blog",
  concept: "Un blog de développeurs façon éditeur de code : monospace en accent, code avec numéros de ligne et bouton Copier réel, sommaire flottant qui suit la lecture, arbre de rubriques comme un explorateur de fichiers.",
  description: "Blog technique : papier clair ou éditeur sombre, violet électrique, JetBrains Mono en accent et texte en empattement, blocs de code copiables, sommaire flottant, filtres par rubrique et étiquette, extraits, 16 articles de démonstration.",
  brand: "Syntaxe", modules: ["blog", "formulaires", "recherche"],
  contentModel: "Les 16 articles, 4 auteurs, rubriques, étiquettes et 12 extraits de code sont écrits dans les pages du thème (aucun type de contenu du CMS n'est simulé) ; le blog réel du CMS fournit les mêmes champs.",
  dna: {
    header: "barre-de-chemin-monospace-avec-curseur-clignotant-et-raccourci-de-recherche",
    hero: "invite-de-commande-et-fenetre-d-article-a-la-une-avec-extrait-de-code",
    grid: "explorateur-de-fichiers-en-colonne-etroite-et-liste-d-articles-en-lignes",
    typo: "geist-pour-les-titres-plex-serif-pour-lire-et-jetbrains-mono-en-accent",
    shapes: "fenetres-d-editeur-aux-coins-vifs-filets-pointilles-et-puces-de-terminal",
    motion: "curseur-qui-clignote-progression-de-lecture-et-sommaire-qui-suit-la-section",
    rhythm: "invites-de-commande-numerotees-et-sections-separees-par-des-lignes-de-code",
    signature: "bloc-de-code-a-numeros-de-ligne-et-bouton-copier-reel-avec-sommaire-flottant-et-filtres-d-archives",
    palette: "papier-blanc-violace-encre-violette-et-variante-editeur-sombre",
    image: "schemas-en-ligne-sobres-et-captures-d-ecran-encadrees-comme-des-fenetres",
    list: "lignes-datees-facon-ls-l-avec-rubrique-et-temps-de-lecture",
    article: "colonne-de-lecture-serree-avec-sommaire-sticky-et-encadres-de-code",
    sidebar: "arbre-de-rubriques-et-etiquettes-sur-l-accueil-sommaire-sur-l-article",
    reading: "serif-17-px-ligne-de-68-caracteres-code-en-bloc-contraste-eleve",
  },
  tokens: {
    colors: { primary: "#6d3fd8", secondary: "#1d1730", accent: "#e8a317", background: "#faf9fd", surface: "#ffffff", text: "#1d1730", muted: "#5a5470", success: "#13803f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.geist", body: "font.ibm-plex-serif", button: "font.jetbrains-mono", link: "font.jetbrains-mono" },
    radius: { sm: 3, md: 6, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d4ea" },
    type: { h1: { size: 52, weight: 700, lineHeight: 1.08, transform: "none" }, h2: { size: 30, weight: 650, lineHeight: 1.2, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent", type: "color", default: "#6d3fd8" },
    { key: "mode", label: "Mode d'affichage", type: "choice", default: "clair", choices: [["clair", "Papier clair"], ["sombre", "Éditeur sombre"]] },
    { key: "entete", label: "En-tête", type: "choice", default: "barre", choices: [["barre", "Barre de chemin"], ["onglets", "Onglets d'éditeur"], ["centre", "Centré, navigation dessous"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "statut", choices: [["statut", "Colonnes et barre d'état"], ["compact", "Compact sur une ligne"]] },
    { key: "liste", label: "Liste des articles", type: "choice", default: "fichiers", choices: [["fichiers", "Lignes façon ls -l"], ["cartes", "Cartes"], ["journal", "Journal compact"]] },
    { key: "article", label: "Page d'article", type: "choice", default: "sommaire", choices: [["sommaire", "Sommaire flottant"], ["centre", "Colonne centrée, sommaire en haut"]] },
    { key: "lignes", label: "Numéros de ligne dans le code", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Articles", "/articles"], ["Extraits", "/snippets"], ["Auteurs", "/auteurs"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "articles", name: "Archives des articles", render: articles }, { key: "article", name: "Article", render: article },
    { key: "snippets", name: "Extraits de code", render: snippets }, { key: "auteurs", name: "Auteurs", render: auteurs }, { key: "blocs", name: "Éléments de rédaction", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite },
  ],
};
