// Jardin — notes et jardin numérique. Direction artistique : un carnet de jardinier ouvert sur le lin. Dix-huit notes courtes à trois stades de maturité (graine, pousse, arbre), reliées entre elles :
// chaque note affiche ses liens sortants et ses liens entrants (calculés à partir des données du thème), les liens internes ont un aperçu au survol, et une carte du jardin (graphe) se parcourt à la souris
// ou au clavier. Tout est écrit dans les pages du thème et géré par motion.js : ce n'est PAS le module de notes liées du CMS (à vérifier, voir la phase 0). Contenus fictifs.
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


const STAGES = { graine: "Graine", pousse: "Pousse", arbre: "Arbre" };
const STAGE_TX = { graine: "Une idée à peine jetée : elle peut changer ou disparaître.", pousse: "Une idée qui prend forme : relue, corrigée, reliée.", arbre: "Une idée solide : elle a été éprouvée et relue plusieurs fois." };
// id, titre, stade, étiquettes, planté, soigné, liens, résumé, texte
const N = [
  ["ecrire-pour-penser", "Écrire pour penser", "arbre", ["écriture", "pensée"], "2025-11-02", "2026-10-28", ["notes-courtes", "relire", "attention"], "On n'écrit pas ce qu'on pense : on découvre ce qu'on pense en l'écrivant.", "Une idée reste floue tant qu'elle n'a pas de phrases. Écrire oblige à choisir un ordre, un verbe, une conclusion. Les trous du raisonnement apparaissent au moment où l'on cherche le mot suivant. C'est pourquoi je garde une note par idée, même incomplète."],
  ["notes-courtes", "Des notes courtes", "arbre", ["écriture", "méthode"], "2025-11-09", "2026-10-21", ["ecrire-pour-penser", "liens", "graines"], "Une note ne contient qu'une idée, en quelques phrases, et un titre qui dit laquelle.", "Une note longue se lit une fois. Une note courte se relit, se déplace, se relie. La contrainte de taille force à trancher : si la note a deux idées, elle devient deux notes."],
  ["liens", "Relier plutôt que classer", "pousse", ["méthode", "structure"], "2026-01-14", "2026-10-02", ["notes-courtes", "jardin-numerique"], "Un dossier impose un seul endroit ; un lien permet autant de chemins qu'on veut.", "Classer demande de décider où vit une idée. Relier demande seulement de dire à quoi elle fait penser. Le premier choix est souvent faux, le second ne l'est jamais tout à fait."],
  ["relire", "Relire ses notes une fois par semaine", "pousse", ["méthode", "habitude"], "2026-02-03", "2026-10-09", ["ecrire-pour-penser", "memoire"], "Ce qu'on ne relit pas est une note perdue, quelle que soit sa qualité.", "Le dimanche, vingt minutes : ouvrir cinq notes au hasard, corriger une phrase, ajouter un lien. Ce rituel fait plus pour le jardin que n'importe quelle nouvelle note."],
  ["memoire", "La mémoire n'est pas un classeur", "arbre", ["mémoire", "pensée"], "2025-12-01", "2026-09-30", ["relire", "oubli"], "On se souvient en reconstruisant, pas en ouvrant un tiroir.", "Chaque souvenir est refabriqué à partir d'indices. Les notes servent d'indices : elles ne contiennent pas le souvenir, elles aident à le reconstituer."],
  ["oubli", "Oublier est un travail", "graine", ["mémoire"], "2026-09-12", "2026-09-12", ["memoire"], "Oublier le détail permet de retenir le principe.", "Hypothèse à vérifier : une bonne note aide à oublier sans perdre. Elle garde la structure et laisse partir le bruit."],
  ["attention", "Le coût d'un changement de tâche", "pousse", ["attention", "travail"], "2026-03-18", "2026-10-15", ["ecrire-pour-penser", "ennui"], "Passer d'une tâche à l'autre coûte plus qu'on ne le croit : le temps de revenir, mais aussi le fil perdu.", "J'ai essayé de noter, pendant une semaine, chaque interruption et le temps pris pour retrouver où j'en étais. Entre cinq et quinze minutes, presque chaque fois."],
  ["ennui", "Défendre l'ennui", "graine", ["attention", "loisir"], "2026-10-05", "2026-10-05", ["attention", "marche"], "L'ennui est le terrain où les idées se rencontrent.", "Notes en vrac : trajets sans téléphone, files d'attente, regarder par la fenêtre. À creuser : qu'est-ce qui, concrètement, se passe dans la tête ?"],
  ["marche", "Penser en marchant", "pousse", ["corps", "pensée"], "2026-04-02", "2026-09-22", ["ennui", "ville"], "Le rythme des pas rythme les phrases : certains problèmes se résolvent à la sortie de la ville.", "Les promenades les plus fécondes sont celles dont on ne connaît pas le but. Une note par promenade, écrite en rentrant, pas pendant."],
  ["ville", "Lire une ville par ses escaliers", "graine", ["ville", "regard"], "2026-08-30", "2026-08-30", ["marche"], "Les escaliers disent l'histoire des pentes et des propriétés.", "Une ville se lit en marchant, et ses escaliers racontent les chemins qu'on a voulu abréger. Idée de série : un escalier par semaine."],
  ["compost", "Le compost : garder ce qu'on a jeté", "arbre", ["méthode", "jardin"], "2025-12-20", "2026-10-11", ["oubli", "brouillons"], "Les notes abandonnées nourrissent les suivantes.", "Je ne supprime jamais une note : je la déplace dans le compost, où elle se décompose. Une fois par saison, je regarde ce que le compost a donné."],
  ["brouillons", "Publier des brouillons", "pousse", ["publication", "méthode"], "2026-05-07", "2026-10-19", ["compost", "jardin-numerique"], "Montrer une idée avant qu'elle soit finie change la façon de l'écrire.", "Le stade de maturité, affiché sur chaque note, prévient le lecteur : voici une graine, ne lui demandez pas de l'ombre."],
  ["jardin-numerique", "Qu'est-ce qu'un jardin numérique ?", "arbre", ["jardin", "publication"], "2025-10-12", "2026-10-30", ["notes-courtes", "brouillons", "liens"], "Un espace de notes publiques qui poussent, se relient et se corrigent, sans date de péremption.", "Contrairement à un blog, un jardin n'est pas classé par date : on y circule par liens. Chaque note a un stade, une date de plantation et une date de dernier soin."],
  ["outils", "Un outil, une fonction", "pousse", ["outils", "méthode"], "2026-06-11", "2026-09-14", ["papier"], "Chaque outil fait une chose ; quand il en fait trois, il faut en choisir une.", "Un carnet pour dessiner, un fichier pour retrouver, un cahier pour penser. Mélanger les trois empêche de bien faire l'un des trois."],
  ["papier", "Garder le papier pour ce qui compte", "graine", ["outils", "écriture"], "2026-09-18", "2026-09-18", ["outils", "ecrire-pour-penser"], "Le papier ralentit, et c'est parfois ce qu'on lui demande.", "Hypothèse : les idées difficiles gagnent à passer d'abord par la main. À tester sur un mois, avec une note de contrôle chaque dimanche."],
  ["lecture-lente", "Lire lentement, noter vite", "pousse", ["lecture", "méthode"], "2026-07-01", "2026-10-07", ["relire", "notes-courtes"], "Lire sans noter fait oublier ; noter sans lire fait ressasser.", "Un crayon, un cahier, une note par chapitre. Je note ce qui m'étonne, pas ce qui me semble important : c'est ce qui revient le plus souvent."],
  ["graines", "Écrire une note en trois phrases", "graine", ["écriture", "méthode"], "2026-10-22", "2026-10-22", ["notes-courtes"], "Trois phrases : l'idée, une raison, un exemple.", "Gabarit de départ pour qui n'ose pas commencer. À améliorer avec l'usage."],
  ["saisons", "Élaguer à l'automne", "pousse", ["jardin", "habitude"], "2026-09-24", "2026-10-26", ["compost", "relire"], "Une fois par an, retirer les notes qui n'ont plus rien à dire.", "Pas de suppression brutale : on fusionne, on archive, on laisse au compost. À l'automne, quand tout ralentit, c'est plus facile."],
].map(([id, t, s, tags, p, m, ln, x, b]) => ({ id, t, s, tags, p, m, ln, x, b }));
const ID = Object.fromEntries(N.map((n) => [n.id, n]));
const BACK = Object.fromEntries(N.map((n) => [n.id, N.filter((o) => o.ln.includes(n.id)).map((o) => o.id)]));
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fr = (d) => { const [y, m, j] = d.split("-"); return `${Number(j)} ${MOIS[Number(m) - 1]} ${y}`; };
const TAGS = [...new Set(N.flatMap((n) => n.tags))].sort((a, b) => a.localeCompare(b, "fr"));

/* ---------- Carte : disposition calculée une fois (simulation de forces à graine fixe) ---------- */
function layout(W, H) {
  const ids = N.map((n) => n.id), P = {}; let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ids.forEach((id, i) => { const a = (i / ids.length) * Math.PI * 2; P[id] = { x: W / 2 + Math.cos(a) * W * 0.3 + rnd() * 20, y: H / 2 + Math.sin(a) * H * 0.3 + rnd() * 20, vx: 0, vy: 0 }; });
  const E = []; N.forEach((n) => n.ln.forEach((l) => { if (!E.some(([a, b]) => (a === n.id && b === l) || (a === l && b === n.id))) E.push([n.id, l]); }));
  for (let it = 0; it < 320; it++) {
    for (const a of ids) for (const b of ids) { if (a >= b) continue; const dx = P[a].x - P[b].x, dy = P[a].y - P[b].y, d2 = Math.max(dx * dx + dy * dy, 25), f = 5200 / d2, d = Math.sqrt(d2); P[a].vx += (dx / d) * f; P[a].vy += (dy / d) * f; P[b].vx -= (dx / d) * f; P[b].vy -= (dy / d) * f; }
    for (const [a, b] of E) { const dx = P[b].x - P[a].x, dy = P[b].y - P[a].y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - 95) * 0.02; P[a].vx += (dx / d) * f; P[a].vy += (dy / d) * f; P[b].vx -= (dx / d) * f; P[b].vy -= (dy / d) * f; }
    for (const id of ids) { P[id].vx += (W / 2 - P[id].x) * 0.004; P[id].vy += (H / 2 - P[id].y) * 0.004; P[id].x += P[id].vx * 0.6; P[id].y += P[id].vy * 0.6; P[id].vx *= 0.7; P[id].vy *= 0.7; }
  }
  const xs = ids.map((i) => P[i].x), ys = ids.map((i) => P[i].y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), m = 34;
  ids.forEach((id) => { P[id].x = Math.round(m + ((P[id].x - x0) / (x1 - x0 || 1)) * (W - 2 * m)); P[id].y = Math.round(m + ((P[id].y - y0) / (y1 - y0 || 1)) * (H - 2 * m)); });
  return { P, E };
}
const LAY = layout(800, 520);
const graph = (cls, label) => {
  const { P, E } = LAY, R = { graine: 7, pousse: 10, arbre: 14 };
  return `<svg class="ja-g ${cls}" viewBox="0 0 800 520" role="img" aria-label="${esc(label)}" data-ja-svg><g>${E.map(([a, b]) => `<line class="ja-e" x1="${P[a].x}" y1="${P[a].y}" x2="${P[b].x}" y2="${P[b].y}" data-a="${a}" data-b="${b}"/>`).join("")}</g><g>${N.map((n) => `<circle class="ja-n ja-n--${n.s}" cx="${P[n.id].x}" cy="${P[n.id].y}" r="${R[n.s]}" data-id="${n.id}" data-t="${esc(n.t)}" data-s="${n.s}" data-x="${esc(n.x)}"/>`).join("")}</g></svg>`;
};
const ICON = {
  graine: `<path d="M12 21v-8"/><path d="M12 13c-4.5 0-6.5-3-6.5-6 4.5 0 6.5 2 6.5 6z"/>`,
  pousse: `<path d="M12 21V9"/><path d="M12 14c-4 0-6-2.5-6-5.5 4 0 6 2 6 5.5z"/><path d="M12 11c4 0 6-2.5 6-5.5-4 0-6 2-6 5.5z"/>`,
  arbre: `<path d="M12 21v-6"/><circle cx="12" cy="9" r="6"/><path d="M12 15l-3-3m3 1l3-3"/>`,
};
const icon = (s) => `<svg class="ja-ic ja-ic--${s}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[s]}</svg>`;
const stage = (s) => `<span class="ja-stage ja-stage--${s}">${icon(s)}${STAGES[s]}</span>`;
const wl = (id, label) => `<a class="ja-wl" href="/note" data-t="${esc(ID[id].t)}" data-s="${ID[id].s}" data-x="${esc(ID[id].x)}">${esc(label || ID[id].t)}</a>`;
const arrow = `<svg class="ja-arr" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const NOTE = { fait: "Ce que j'ai observé", doute: "Ce dont je doute", essai: "À essayer" };
const noteBox = (k, html) => `<aside class="ja-callout ja-callout--${k}"><p class="ja-callout-k">${NOTE[k]}</p>${html}</aside>`;

const header = (c) => sec(`<header class="ja-head pk-bleed"><div class="ja-head-in"><a class="ja-logo" href="/" aria-label="${esc(c.brand)} : accueil"><svg class="ja-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20 36V18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M20 22c-8 0-12-5-12-11 8 0 12 4 12 11z" fill="currentColor" opacity=".9"/><path d="M20 18c7 0 10-4 10-9-7 0-10 3-10 9z" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>Jardin<small>carnet de notes reliées</small></span></a>
  <div class="ja-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <div class="ja-legend" aria-label="Stades de maturité"><p class="ja-legend-t">Stades</p>${Object.keys(STAGES).map((s) => `<p>${stage(s)}</p>`).join("")}</div>
  <details class="ja-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="ja-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a href="/recherche">Recherche</a></div></details></div></header>`);
const footer = (c) => sec(`<footer class="ja-foot pk-bleed"><div class="ja-wrap ja-foot-in"><div class="ja-foot-lead"><p class="ja-foot-q">Un jardin se visite, ne se termine pas.</p><p class="ja-fine">Jardin est un site de démonstration : les notes, les liens et les dates sont fictifs.</p></div>
  <div class="ja-foot-col"><h2>Notes</h2>${nav(c.menu.slice(1, 5), "ja-fl")}</div><div class="ja-foot-col"><h2>Le site</h2><a class="ja-fl" href="/contact">Contact</a><a class="ja-fl" href="/recherche">Recherche</a><a class="ja-fl" href="/blocs">Blocs de mise en page</a><a class="ja-fl" href="/mentions-legales">Mentions légales</a><a class="ja-fl" href="/confidentialite">Confidentialité</a></div></div></footer>`);
const pagehead = (kick, title, sub) => sec(`<section class="ja-ph pk-bleed"><div class="ja-wrap ja-ph-in"><p class="ja-kick">${esc(kick)}</p><div class="ja-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="ja-sub">${esc(sub)}</p>` : ""}</div></section>`);

const brick = (n) => `<li class="ja-item" data-s="${n.s}" data-tags="${esc(n.tags.join("|"))}" data-d="${n.m}" data-q="${esc((n.t + " " + n.x + " " + n.tags.join(" ")).toLowerCase())}"><article class="ja-brick ja-brick--${n.s}"><p class="ja-brick-top">${stage(n.s)}<time datetime="${n.m}">${fr(n.m)}</time></p><h3 class="ja-brick-t"><a href="/note">${esc(n.t)}</a></h3><p class="ja-brick-x">${esc(n.x)}</p><p class="ja-tags">${n.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</p><p class="ja-brick-l">${n.ln.length} lien${n.ln.length > 1 ? "s" : ""} sortant${n.ln.length > 1 ? "s" : ""} · ${BACK[n.id].length} entrant${BACK[n.id].length > 1 ? "s" : ""}</p></article></li>`;
const bricks = (arr, extra = "") => `<ul class="ja-bricks ${extra}" data-ja-list>${arr.map(brick).join("")}</ul>`;

const home = (c) => [header(c),
  sec(`<section class="ja-hero pk-bleed"><div class="ja-wrap ja-hero-in"><div class="ja-hero-tx"><p class="ja-kick">Jardin numérique</p><div class="ja-h1 ja-h1--hero" role="heading" aria-level="1">Des notes courtes, <em>reliées entre elles</em>, qui poussent.</div><p class="ja-lead">Ici, rien n'est fini et rien n'est classé par date. Chaque note a un stade, des liens vers d'autres notes, et la liste de celles qui la citent.</p><p class="ja-cta"><a class="ja-btn" href="/carte">Explorer la carte ${arrow}</a><a class="ja-btn ja-btn--ghost" href="/notes">Lire les notes</a></p></div>
    <div class="ja-hero-map">${graph("ja-g--hero", "Carte décorative du jardin : dix-huit notes reliées par des traits")}<p class="ja-fine">Chaque point est une note. <a href="/carte">Ouvrir la carte interactive</a>.</p></div></div></section>`),
  sec(`<section class="ja-sec pk-bleed"><div class="ja-wrap"><div class="ja-sechead"><div><p class="ja-kick">Trois stades</p><h2 class="ja-h2">Comment lire une note</h2></div></div><div class="ja-stages">${Object.keys(STAGES).map((s) => `<div class="ja-st ja-st--${s}"><p class="ja-st-n">${N.filter((n) => n.s === s).length}</p><h3>${stage(s)}</h3><p>${STAGE_TX[s]}</p></div>`).join("")}</div></div></section>`),
  sec(`<section class="ja-sec ja-sec--rec pk-bleed"><div class="ja-wrap"><div class="ja-sechead"><div><p class="ja-kick">Soignées récemment</p><h2 class="ja-h2">Les dernières notes touchées</h2></div><a class="ja-more" href="/journal">Journal du jardin ${arrow}</a></div>${bricks([...N].sort((a, b) => b.m.localeCompare(a.m)).slice(0, 6), "ja-bricks--home")}</div></section>`),
  sec(`<section class="ja-sec ja-sec--tags pk-bleed"><div class="ja-wrap"><div class="ja-sechead"><div><p class="ja-kick">Par étiquette</p><h2 class="ja-h2">Les sujets du jardin</h2></div></div><ul class="ja-cloud">${TAGS.map((t) => `<li><a href="/notes?tag=${encodeURIComponent(t.normalize("NFD").replace(/[^a-z]/g, ""))}" class="ja-tag-l">#${esc(t)}<small>${N.filter((n) => n.tags.includes(t)).length}</small></a></li>`).join("")}</ul></div></section>`),
  footer(c)];

const notes = (c) => [header(c), pagehead("Index des notes", "Dix-huit notes, du plus jeune au plus ancien", "Filtrez par stade ou par étiquette, ou tapez un mot."),
  sec(`<section class="ja-sec pk-bleed"><div class="ja-wrap"><h2 class="ja-sr">Liste des notes</h2><div class="ja-tools" data-ja-tools><p class="ja-tools-n" role="status" aria-live="polite"><b data-ja-n>${N.length}</b> notes affichées</p>
    <ul class="ja-chips" aria-label="Filtrer par stade"><li><a href="/notes" data-s="tous" aria-current="true">Tous les stades</a></li>${Object.entries(STAGES).map(([k, v]) => `<li><a href="/notes" data-s="${k}">${v}s</a></li>`).join("")}</ul>
    <ul class="ja-chips ja-chips--t" aria-label="Filtrer par étiquette">${TAGS.map((t) => `<li><a href="/notes?tag=${encodeURIComponent(t.normalize("NFD").replace(/[^a-z]/g, ""))}" data-tag="${esc(t)}">#${esc(t)}</a></li>`).join("")}</ul></div>
    ${bricks(N)}<div class="ja-empty" data-ja-empty hidden><p class="ja-empty-t">Aucune note ne correspond.</p><p>Retirez un filtre ou <a href="/notes">revenez à l'index complet</a>.</p></div></div></section>`),
  footer(c)];

const N0 = ID["ecrire-pour-penser"];
const note = (c) => [header(c),
  sec(`<section class="ja-nh pk-bleed"><div class="ja-wrap ja-nh-in"><p class="ja-crumb"><a href="/">Jardin</a> / <a href="/notes">Notes</a> / ${esc(N0.t)}</p><p class="ja-nmeta">${stage(N0.s)}<span>Plantée le <time datetime="${N0.p}">${fr(N0.p)}</time></span><span>Dernier soin le <time datetime="${N0.m}">${fr(N0.m)}</time></span></p><div class="ja-h1 ja-h1--note" role="heading" aria-level="1">${esc(N0.t)}</div><p class="ja-tags">${N0.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</p></div></section>`),
  sec(`<div class="ja-wrap ja-note"><div class="ja-prose ja-body"><p class="ja-chapo">${esc(N0.x)}</p><p>${esc(N0.b)}</p>
    <p>La contrainte est simple : ${wl("notes-courtes", "une note courte")} ne contient qu'une idée. Quand je veux savoir ce que je pense d'un sujet, j'ouvre une nouvelle note et j'écris trois phrases, comme décrit dans ${wl("graines")}. Je relie ensuite la note à celles dont elle est proche (${wl("liens", "relier plutôt que classer")}).</p>
    <h2 data-anchor="trois">Trois effets observés</h2><ol><li><strong>La clarté :</strong> une phrase qu'on n'arrive pas à finir est une idée qu'on n'a pas encore.</li><li><strong>La mémoire :</strong> ce qu'on écrit se retient mieux, parce qu'il a fallu choisir (voir ${wl("memoire", "la mémoire n'est pas un classeur")}).</li><li><strong>La distance :</strong> relue une semaine plus tard, la note ressemble à celle d'un autre, et on la corrige plus librement (${wl("relire")}).</li></ol>
    ${noteBox("fait", "<p>Sur trente notes écrites en octobre, vingt-deux ont changé de titre à la relecture. Le titre est la dernière chose qu'on comprend.</p>")}
    <blockquote class="ja-quote"><p>Je ne sais pas ce que je pense avant d'avoir vu ce que j'écris.</p><cite>Formule attribuée à plusieurs auteurs, d'où sa prudence</cite></blockquote>
    <h2 data-anchor="limites">Ce dont je doute</h2><p>Écrire pour penser fonctionne mal quand on cherche à écrire bien. Il faut accepter des phrases moches. ${wl("attention", "L'attention")} joue aussi : écrire dans un onglet entouré de notifications ne donne rien.</p>
    ${noteBox("doute", "<p>Je ne sais pas si cette méthode vaut pour toutes les formes de pensée, par exemple en mathématiques ou en musique.</p>")}
    ${noteBox("essai", "<p>Pendant deux semaines, écrire à la main (voir " + wl("papier", "garder le papier") + ") et comparer avec le clavier.</p>")}
    <div class="ja-tablewrap" role="region" aria-label="Tableau des notes liées, à faire défiler sur petit écran"><table class="ja-table"><caption>Notes citées dans cette note</caption><thead><tr><th scope="col">Note</th><th scope="col">Stade</th><th scope="col">Dernier soin</th></tr></thead><tbody>${N0.ln.map((l) => `<tr><th scope="row">${wl(l)}</th><td>${STAGES[ID[l].s]}</td><td>${fr(ID[l].m)}</td></tr>`).join("")}</tbody></table></div></div>
    <aside class="ja-side" aria-label="Liens de la note"><section class="ja-sidebox"><h2 class="ja-side-t">Liens sortants <small>${N0.ln.length}</small></h2><ul class="ja-links">${N0.ln.map((l) => `<li>${wl(l)}<span>${stage(ID[l].s)}</span></li>`).join("")}</ul></section>
    <section class="ja-sidebox ja-sidebox--back"><h2 class="ja-side-t">Liens entrants <small>${BACK[N0.id].length}</small></h2><p class="ja-fine">Notes qui citent celle-ci.</p><ul class="ja-links">${BACK[N0.id].map((l) => `<li>${wl(l)}<span>${stage(ID[l].s)}</span></li>`).join("")}</ul></section>
    <section class="ja-sidebox"><h2 class="ja-side-t">Dans cette note</h2><ol class="ja-toc"><li><a href="#trois">Trois effets observés</a></li><li><a href="#limites">Ce dont je doute</a></li></ol></section></aside></div>`),
  sec(`<section class="ja-sec ja-sec--rel pk-bleed"><div class="ja-wrap"><div class="ja-sechead"><div><p class="ja-kick">En se promenant</p><h2 class="ja-h2">Notes voisines</h2></div></div>${bricks(["relire", "attention", "memoire"].map((i) => ID[i]), "ja-bricks--row")}</div></section>`),
  footer(c)];

const carte = (c) => [header(c), pagehead("Carte du jardin", "Les notes et leurs liens", "Cliquez sur un point, ou parcourez-les au clavier : la note choisie et ses voisines s'éclairent."),
  sec(`<section class="ja-sec pk-bleed"><div class="ja-wrap ja-mapgrid"><div class="ja-mapbox">${graph("ja-g--full", "Carte interactive du jardin : dix-huit notes, reliées par leurs liens")}<p class="ja-fine">Vert foncé : arbres. Vert clair : pousses. Ocre : graines.</p></div>
    <aside class="ja-panel" data-ja-panel aria-live="polite"><p class="ja-panel-t">Aucune note choisie</p><p class="ja-panel-x">Choisissez un point sur la carte pour voir son résumé et ses voisines.</p></aside></div></section>`),
  sec(`<section class="ja-sec ja-sec--gl pk-bleed"><div class="ja-wrap"><div class="ja-sechead"><div><p class="ja-kick">Sans la carte</p><h2 class="ja-h2">La même liste, en texte</h2></div></div><ul class="ja-glist">${N.map((n) => `<li>${wl(n.id)} <span>${stage(n.s)}</span> <small>vers : ${n.ln.map((l) => esc(ID[l].t)).join(", ")}</small></li>`).join("")}</ul></div></section>`),
  footer(c)];

const journal = (c) => {
  const by = [...N].sort((a, b) => b.m.localeCompare(a.m));
  const months = [...new Set(by.map((n) => n.m.slice(0, 7)))];
  const LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return [header(c), pagehead("Journal du jardin", "Ce qui a été planté et soigné", "Les notes classées par date de dernier soin, du plus récent au plus ancien."),
    sec(`<section class="ja-sec pk-bleed"><div class="ja-wrap ja-journal">${months.map((m) => `<section class="ja-mois"><h2 class="ja-mois-t">${LONG[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}</h2><ol class="ja-jl">${by.filter((n) => n.m.startsWith(m)).map((n) => `<li><time datetime="${n.m}">${fr(n.m)}</time><div>${wl(n.id)}<p>${n.p === n.m ? "Plantée ce jour-là." : `Plantée le ${fr(n.p)}, soignée de nouveau.`} ${stage(n.s)}</p></div></li>`).join("")}</ol></section>`).join("")}</div></section>`), footer(c)];
};

const contact = (c) => [header(c), pagehead("Contact", "Écrire à la jardinière", "Une correction, une note à relier, une question : tout est lu."),
  sec(`<section class="ja-info pk-bleed"><div class="ja-wrap ja-info-in"><div><h2 class="ja-h3">Signaler une erreur</h2><p>Indiquez la note et la phrase. Les corrections sont datées sur la note.</p></div><div><h2 class="ja-h3">Proposer un lien</h2><p>Une note vous fait penser à une autre ? Dites lesquelles, et pourquoi.</p></div><div><h2 class="ja-h3">Délai</h2><p>Quelques jours, au rythme du jardin.</p></div></div></section>`),
  { type: "form", heading: "Envoyer un message", intro: "Un mot suffit. Dites quelle note vous concerne si vous le pouvez." }, footer(c)];
const recherche = (c) => [header(c), pagehead("Recherche", "Chercher dans le jardin", "Un mot, une étiquette, un titre de note."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une note, une étiquette…" } }] },
  sec(`<section class="ja-sec pk-bleed"><div class="ja-wrap"><div class="ja-empty ja-empty--static"><p class="ja-empty-t">Aucun résultat ?</p><p>Essayez un mot plus général ou parcourez la carte : les notes voisines sont souvent les bonnes.</p><ul class="ja-chips"><li><a href="/carte">Carte du jardin</a></li><li><a href="/notes">Index des notes</a></li><li><a href="/journal">Journal</a></li></ul></div></div></section>`), footer(c)];
const introuvable = (c) => [header(c), sec(`<section class="ja-404 pk-bleed"><div class="ja-wrap ja-404-in"><div class="ja-404-art" aria-hidden="true"><svg viewBox="0 0 200 120" focusable="false"><path class="ja-404-l" d="M20 100h160"/><path class="ja-404-s" d="M100 100V58"/><path class="ja-404-p" d="M100 70c-18 0-28-12-28-26 18 0 28 10 28 26z"/><circle class="ja-404-d" cx="150" cy="44" r="5"/><circle class="ja-404-d" cx="48" cy="30" r="4"/><path class="ja-404-dash" d="M100 58L150 44M100 58L48 30"/></svg></div><p class="ja-kick">Erreur 404</p><div class="ja-h1" role="heading" aria-level="1">Ce lien ne mène nulle part, pour l'instant.</div><p class="ja-sub">La note n'existe pas encore, ou a été déplacée dans le compost. Reprenez un chemin voisin.</p><p class="ja-cta"><a class="ja-btn" href="/carte">Ouvrir la carte</a><a class="ja-btn ja-btn--ghost" href="/notes">Index des notes</a><a class="ja-btn ja-btn--ghost" href="/">Accueil</a></p></div></section>`), footer(c)];
const blocs = (c) => blocsPage("ja", c, header, footer, pagehead("Blocs de mise en page", "Tous les éléments d'une note, sur une page", "Titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés."), { cite: "Une jardinière numérique", a: "#dfe7c9", b: "#4d6b1c", c: "#b5472f", legend: "Une note peut contenir un schéma.", cap: "Tableau d'exemple : quatre colonnes", info: "Un encadré « Ce que j'ai observé » consigne un fait, sans conclure.", warn: "Un encadré « Ce dont je doute » dit ce que la note ne prouve pas.", tip: "Un encadré « À essayer » propose une expérience simple." });
const legal = (kind, title, kick, sub) => (c) => legalPage("ja", kind, c, header, footer, pagehead(kick, title, sub), "Jardin", "Collectif Jardin (association fictive), 3 rue des Plantes, 34000 Montpellier");

module.exports = {
  key: "jardin", name: "Jardin", version: "1.0.0", category: "science", collection: "blog", tags: ["naturel", "minimaliste", "technique"], siteType: "Notes personnelles et jardin numérique", featured: false,
  concept: "Un carnet de jardinier ouvert sur le lin : dix-huit notes courtes à trois stades de maturité, reliées entre elles, avec liens entrants, aperçus au survol et carte du jardin.",
  description: "Jardin numérique : lin, olive et baies, barre latérale de carnet, notes en briques à trois stades (graine, pousse, arbre), liens sortants et entrants calculés, aperçu au survol, carte interactive des liens et journal des soins.",
  brand: "Jardin", modules: ["formulaires", "recherche", "blog"],
  declare: "Les 18 notes, leurs liens sortants, les liens entrants (calculés dans le pack), la carte et les aperçus sont écrits dans les pages du thème et pilotés par motion.js. Ce n'est pas le module de notes liées du CMS (postNotes, à vérifier) ni un type de contenu « note ».",
  dna: {
    header: "barre-laterale-de-carnet-fixe-a-gauche-avec-legende-des-stades",
    hero: "texte-et-carte-du-jardin-en-graphe-de-points-relies",
    grid: "briques-de-notes-courtes-en-colonnes-continues",
    typo: "serif-faustina-gantari-et-azeret-mono-pour-les-metadonnees",
    shapes: "points-relies-par-des-traits-et-pictogrammes-de-graine-pousse-arbre",
    motion: "points-qui-s-eclairent-avec-leurs-voisins-et-apercu-au-survol",
    rhythm: "carnet-aere-fonds-lin-et-bandes-de-notes",
    signature: "notes-reliees-avec-liens-entrants-apercus-au-survol-et-carte-interactive",
    palette: "lin-olive-et-rouge-de-baie",
    image: "aucune-photo-graphe-et-pictogrammes-de-stade",
    list: "briques-ou-index-a-lignes-ou-chronologie",
    article: "note-courte-avec-liens-dans-le-texte-stade-et-dates-de-soin",
    sidebar: "colonne-de-liens-sortants-et-entrants-a-droite",
    reading: "corps-18-px-interligne-1-7-liens-en-pointilles-et-metadonnees-en-chasse-fixe",
  },
  tokens: {
    colors: { primary: "#4d6b1c", secondary: "#2a2f23", accent: "#b5472f", background: "#f1eee4", surface: "#fbf9f2", text: "#2a2f23", muted: "#5a604f", success: "#2f5d2a", warning: "#8a5a00", error: "#a3302a" },
    fonts: { heading: "font.faustina", body: "font.gantari", button: "font.azeret-mono", link: "font.gantari" },
    radius: { sm: 3, md: 6, lg: 10, button: 6, field: 6, card: 8 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d5d0bd" },
    type: { h1: { size: 54, weight: 600, lineHeight: 1.1, transform: "none" }, h2: { size: 34, weight: 600, lineHeight: 1.18, transform: "none" } },
  },
  options: [
    { key: "baie", label: "Rouge des liens et des accents", type: "color", default: "#b5472f" },
    { key: "entete", label: "Style de l'en-tête", type: "choice", default: "lateral", choices: [["lateral", "Barre latérale de carnet"], ["haut", "Barre en haut"], ["onglets", "En haut, avec légende des stades"]] },
    { key: "pied", label: "Style du pied de page", type: "choice", default: "colonnes", choices: [["colonnes", "Colonnes"], ["ligne", "Une seule ligne"]] },
    { key: "liste", label: "Présentation des listes de notes", type: "choice", default: "briques", choices: [["briques", "Briques en colonnes"], ["index", "Index à lignes"], ["grille", "Grille régulière"]] },
    { key: "note", label: "Mise en page d'une note", type: "choice", default: "marge", choices: [["marge", "Liens dans la marge"], ["bas", "Liens sous le texte"]] },
    { key: "apercu", label: "Aperçu des liens au survol", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
    { key: "nuit", label: "Mode sombre", type: "choice", default: "non", choices: [["non", "Lin clair"], ["oui", "Terreau (sombre)"]] },
  ],
  menu: [["Accueil", "/"], ["Notes", "/notes"], ["Carte", "/carte"], ["Journal", "/journal"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "notes", name: "Index des notes", render: notes }, { key: "note", name: "Note", render: note },
    { key: "carte", name: "Carte du jardin", render: carte }, { key: "journal", name: "Journal", render: journal }, { key: "blocs", name: "Blocs", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: legal("mentions", "Mentions légales", "Informations légales", "Qui édite ce site, qui l'héberge, et ce qu'il faut savoir avant de le copier.") },
    { key: "confidentialite", name: "Confidentialité", render: legal("confidentialite", "Politique de confidentialité", "Vos données", "Ce que reçoit le site, à quoi cela sert, et comment exercer vos droits.") },
  ],
};
