// Balance — site fictif d'avis et de comparatifs (« Balance », tests de machines à café). Direction artistique : le plateau de la balance, vert verdict sur papier gris-vert, empattement
// mécanique (Arvo) et sans-serif humaniste (Maven Pro), cadrans de notes tracés en SVG, barres de critères, bandeau de transparence toujours visible.
// Composants signature : comparateur de produits (choisir jusqu'à trois colonnes, meilleure valeur surlignée), classement filtrable par budget et triable, liens d'affiliation
// réels du moteur (bloc « Bouton » avec rel="sponsored", ouverture dans un nouvel onglet) accompagnés d'une mention visible « lien affilié ».
// Tout est démonstration : produits, marques, tests, notes et marchands sont fictifs ; aucun achat n'est possible. Le CMS n'ayant pas de type « avis » (ni de données structurées Review),
// les tests sont écrits dans les pages du thème et la fiche le déclare (contentModel).
const { sec, esc, nav } = require("../kit");

const CRIT = [["q", "Qualité du café", .4], ["f", "Facilité d'usage", .2], ["e", "Entretien", .15], ["v", "Rapport qualité-prix", .25]];
// [slug, nom, type, prix, [q, f, e, v], plus (3), moins (2), idéal pour, semaines de test, verdict]
const P = [
  ["cremona-s2", "Cremona S2", "Expresso avec broyeur", 249, [9.0, 8.5, 7.5, 8.6], ["Broyeur précis et silencieux", "Mousse de lait stable", "Réservoir de 1,8 litre"], ["Nettoyage du bac à marc un peu long", "Écran tactile parfois lent"], "Un foyer de deux à quatre personnes qui veut un vrai expresso sans apprentissage.", 6, "La meilleure machine de notre sélection pour la majorité des foyers : excellent café, prise en main immédiate, prix cohérent."],
  ["barista-nano", "Barista Nano", "Expresso manuel compact", 129, [7.6, 6.5, 7.8, 8.4], ["Très compact, tient sous un meuble", "Montée en température en 25 secondes", "Prix doux"], ["Pas de broyeur intégré", "Buse vapeur capricieuse"], "Une petite cuisine et un budget serré, avec l'envie d'apprendre.", 5, "Un excellent point d'entrée si l'on accepte de moudre son café à part et de soigner son geste."],
  ["aroma-duo", "Aroma Duo", "Expresso double chaudière", 379, [9.3, 7.8, 7.2, 7.9], ["Deux chaudières : lait et café en même temps", "Construction métal très solide", "Pression stable"], ["Encombrante", "Entretien à calendrier strict"], "Les amateurs qui boivent plusieurs cafés au lait par jour.", 8, "Le meilleur café de la sélection, au prix d'un encombrement et d'un entretien plus exigeants."],
  ["tazza-easy", "Tazza Easy", "Machine à dosettes", 89, [6.4, 9.2, 8.8, 7.3], ["Prête en 15 secondes", "Nettoyage quasi inexistant", "Format très réduit"], ["Café moins riche", "Dosettes plus chères au litre"], "Une personne seule ou un bureau, pour qui la rapidité prime.", 4, "Imbattable en simplicité ; le goût reste en retrait face aux machines à broyeur."],
  ["pressa-pro-15", "Pressa Pro 15", "Expresso semi-pro", 459, [9.6, 6.9, 6.4, 7.2], ["Café digne d'un comptoir", "Porte-filtre de 58 mm", "Réparable, pièces disponibles"], ["Demande de la pratique", "Prix élevé"], "Les passionnés prêts à régler leur mouture et leur dosage.", 10, "La référence pour progresser, mais clairement pas la machine du dimanche matin pressé."],
  ["kafei-capsule", "Kafei Capsule", "Machine à capsules", 119, [6.9, 9.0, 8.5, 7.1], ["Plusieurs tailles de tasse", "Réservoir amovible", "Silencieuse"], ["Capsules propriétaires", "Plastique d'aspect léger"], "Les familles qui veulent du café sans y penser.", 4, "Un bon compromis simplicité-goût, avec la réserve de la dépendance aux capsules de la marque."],
  ["vapore-mini", "Vapore Mini", "Expresso avec buse vapeur", 169, [8.0, 7.4, 7.6, 8.0], ["Buse vapeur efficace", "Deux filtres fournis", "Plateau chauffant"], ["Réservoir de 1 litre seulement", "Pas de programmation"], "Les amateurs de cappuccino au budget raisonnable.", 5, "Une bonne machine polyvalente, juste limitée par un réservoir petit pour un usage familial."],
  ["lungo-sense", "Lungo Sense", "Expresso connecté", 299, [8.5, 8.2, 8.0, 7.6], ["Réglages mémorisables par profil", "Nettoyage guidé", "Application bien conçue"], ["Application obligatoire pour certains réglages", "Prix en hausse récente"], "Les foyers avec plusieurs buveurs aux goûts différents.", 6, "Les profils personnalisés sont un vrai plus, pourvu que l'on aime piloter sa machine depuis le téléphone."],
];
const note = (s) => Math.round((s[0] * .4 + s[1] * .2 + s[2] * .15 + s[3] * .25) * 10) / 10;
const PR = P.map((p, i) => ({ slug: p[0], name: p[1], type: p[2], price: p[3], s: p[4], g: note(p[4]), pros: p[5], cons: p[6], ideal: p[7], weeks: p[8], verdict: p[9], i }));
const budget = (p) => (p < 150 ? "petit" : p <= 300 ? "moyen" : "grand");
const fr = (n) => String(n).replace(".", ",");
const rank = [...PR].sort((a, b) => b.g - a.g);

// ---------- dessins : cadran et barres tracés à la fabrication ----------
function arc(score, r = 40) {
  const a = Math.min(359.9, (score / 10) * 360) * Math.PI / 180, x = 50 + r * Math.sin(a), y = 50 - r * Math.cos(a);
  return `M50 ${50 - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
}
const dial = (g, cls = "") => `<svg class="bl-dial ${cls}" viewBox="0 0 100 100" role="img" aria-label="Note globale : ${fr(g)} sur 10"><circle cx="50" cy="50" r="40" fill="none" stroke-width="9" class="bl-dial-bg"/><path d="${arc(g)}" fill="none" stroke-width="9" stroke-linecap="round" class="bl-dial-fg"/></svg>`;
const bar = (v) => `<svg class="bl-bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="${fr(v)} sur 10"><rect x="0" y="0" width="100" height="10" class="bl-bar-bg"/><rect x="0" y="0" width="${(v * 10).toFixed(0)}" height="10" class="bl-bar-fg"/></svg>`;
const CUP = `<svg class="bl-cup" viewBox="0 0 160 120" role="img" aria-label="Dessin d'une tasse de café sur une balance"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 100h120M80 100V40M30 40h100M30 40l-14 28h28zM130 40l-14 28h28z"/><path d="M52 24h28v10q0 10-14 10t-14-10zM80 28h6a5 5 0 0 1 0 10h-6"/></g></svg>`;
const IC = {
  arr: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  minus: '<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
};
const ic = (k) => `<svg class="bl-ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const MENTION = "Certains liens sont affiliés : nous touchons une commission sans surcoût pour vous. Cela ne change ni nos notes ni notre classement.";

// ---------- éléments communs ----------
const header = (c) => `<header class="bl-head pk-bleed"><div class="bl-disc"><div class="bl-w bl-disc-in"><span><b>Transparence.</b> ${esc(MENTION)}</span><a href="/transparence">Notre méthode</a></div></div>
<div class="bl-w bl-head-in"><a class="bl-brand" href="/" aria-label="${esc(c.brand)} — accueil"><svg class="bl-logo" viewBox="0 0 40 32" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 28V6M6 28h28M5 8h30M5 8l-4 10h8zM35 8l-4 10h8z"/></g></svg><span class="bl-brand-n">Balance</span><span class="bl-brand-t">avis & comparatifs</span></a>
<div class="bl-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu, "bl-nl")}</div></div></header>`;
const footer = (c) => `<footer class="bl-foot pk-bleed"><div class="bl-w bl-foot-in"><div class="bl-foot-a"><a class="bl-brand bl-brand--f" href="/" aria-label="${esc(c.brand)} — accueil"><span class="bl-brand-n">Balance</span></a><p>Des tests menés pendant plusieurs semaines, des notes calculées avec une formule publique, des liens affiliés toujours signalés.</p></div>
<div class="bl-foot-c"><h2 class="bl-foot-t">Lire</h2><a href="/avis">Tous les avis</a><a href="/comparateur">Comparateur</a><a href="/guide">Guide d'achat</a><a href="/test">Un test en détail</a></div>
<div class="bl-foot-c"><h2 class="bl-foot-t">Confiance</h2><a href="/transparence">Méthode et affiliation</a><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="/blocs">Éléments de page</a></div>
<div class="bl-foot-c"><h2 class="bl-foot-t">Légal</h2><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div></div>
<div class="bl-foot-m"><div class="bl-w"><p><b>Mention d'affiliation.</b> ${esc(MENTION)} Les liens concernés portent la mention « lien affilié » et l'attribut <code>rel="sponsored"</code>. Site de démonstration : marques, produits, tests et marchands sont fictifs.</p></div></div></footer>`;
const head = (kicker, title, lead, crumb) => sec(`<section class="bl-ph pk-bleed"><div class="bl-w">${crumb ? `<p class="bl-crumb">${crumb}</p>` : ""}<p class="bl-kicker" data-reveal>${esc(kicker)}</p><div class="bl-h1" role="heading" aria-level="1" data-reveal>${title}</div>${lead ? `<p class="bl-lead" data-reveal>${esc(lead)}</p>` : ""}</div></section>`);
const btn = (label, url, cls = "") => `<a class="bl-btn ${cls}" href="${url}">${esc(label)} ${ic("arr")}</a>`;
// Bouton d'affiliation réel du moteur : rel="sponsored", nouvel onglet, mention visible dans le libellé
const affil = (p) => ({ type: "layout", children: [{ type: "button", props: { label: `Voir l'offre pour ${p.name} (lien affilié)`, url: `https://example.com/offre/${p.slug}`, variant: "primary", newTab: true, rel: "sponsored" } }] });
const dw = (g, cls) => `<span class="bl-dw">${dial(g, cls)}<b class="bl-g">${fr(g)}</b></span>`;
const crit = (p) => `<ul class="bl-crit">${CRIT.map(([k, l], j) => `<li><span class="bl-crit-l">${esc(l)}</span>${bar(p.s[j])}<b>${fr(p.s[j])}</b></li>`).join("")}</ul>`;
const row = (p, n) => `<li class="bl-r" data-slug="${p.slug}" data-budget="${budget(p.price)}" data-score="${p.g}" data-price="${p.price}" data-n="${n}"><span class="bl-r-n" aria-hidden="true">${n + 1}</span>${dw(p.g, "bl-dial--s")}<a class="bl-r-a" href="/test#${p.slug}"><span class="bl-r-t">${esc(p.name)}</span><span class="bl-r-ty">${esc(p.type)}</span><span class="bl-r-v">${esc(p.verdict)}</span></a><span class="bl-r-m"><b>${p.price} €</b><span>${p.weeks} semaines de test</span><span class="bl-tag">${n === 0 ? "Notre choix" : p.price === Math.min(...PR.map((x) => x.price)) ? "Petit prix" : p.g >= 9 ? "Excellence" : budget(p.price) === "petit" ? "Économique" : "Recommandé"}</span></span></li>`;
const prodBlock = (p, n) => ({ type: "layout", children: [{ type: "html", props: { html: `<ol class="bl-rl bl-rl--one" start="${n + 1}">${row(p, n)}</ol>` } }, affil(p).children[0]] });

// ---------- pages ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="bl-hero pk-bleed"><div class="bl-w bl-hero-in"><div class="bl-hero-l"><p class="bl-kicker" data-reveal>Machines à café · 8 modèles testés</p>
<div class="bl-h1 bl-h1--home" role="heading" aria-level="1" data-reveal>Le café sur la balance, <em>sans parti pris.</em></div>
<p class="bl-lead" data-reveal>Chaque machine est utilisée pendant plusieurs semaines, notée sur quatre critères avec une formule publique, puis comparée aux autres. Vous voyez nos notes avant de voir un prix.</p>
<div class="bl-actions" data-reveal>${btn("Voir le classement", "/avis")}${btn("Comparer des modèles", "/comparateur", "bl-btn--g")}</div></div>
<div class="bl-hero-r" data-reveal><div class="bl-podium" aria-label="Podium de notre sélection">${rank.slice(0, 3).map((p, i) => `<a class="bl-pod bl-pod${i + 1}" href="/test#${p.slug}"><span class="bl-pod-n">${i + 1}</span>${dw(p.g, "bl-dial--m")}<b>${esc(p.name)}</b><span>${p.price} €</span></a>`).join("")}</div>${CUP}</div></div></section>`),
  sec(`<section class="bl-stat pk-bleed"><div class="bl-w"><ul class="bl-st"><li><b data-count="8">8</b><span>machines testées cette saison</span></li><li><b data-count="52">52</b><span>semaines de test cumulées</span></li><li><b>4</b><span>critères, une formule publique</span></li><li><b data-count="0">0</b><span>test payé par une marque</span></li></ul></div></section>`),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><div class="bl-bt"><div><p class="bl-kicker">Classement</p><h2 class="bl-h2">Les trois meilleures notes</h2></div><a class="bl-more" href="/avis">Les huit avis ${ic("arr")}</a></div></div></section>`),
  prodBlock(rank[0], 0), prodBlock(rank[1], 1), prodBlock(rank[2], 2),
  sec(`<section class="bl-sec bl-sec--alt pk-bleed"><div class="bl-w bl-two"><div><p class="bl-kicker">Comment nous notons</p><h2 class="bl-h2">Quatre critères, une formule</h2><p class="bl-p">La note globale est la moyenne pondérée de quatre critères. Nous la calculons avant de chercher les offres, pour qu'aucun prix ni aucune commission n'influence le résultat.</p><p><a class="bl-more" href="/transparence">Lire la méthode complète ${ic("arr")}</a></p></div>
<ul class="bl-w8">${CRIT.map(([, l, w]) => `<li><span>${esc(l)}</span><b>${Math.round(w * 100)} %</b></li>`).join("")}</ul></div></section>`),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><p class="bl-kicker">Par budget</p><ul class="bl-bud">${[["petit", "Moins de 150 €", "Pour démarrer sans se ruiner."], ["moyen", "De 150 à 300 €", "Le meilleur rapport qualité-prix."], ["grand", "Plus de 300 €", "Pour les passionnés."]].map(([k, t, d]) => `<li data-reveal><a href="/avis#${k}"><b>${t}</b><span>${d}</span><i>${PR.filter((p) => budget(p.price) === k).length} modèles ${ic("arr")}</i></a></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const avis = (c) => [
  sec(header(c)),
  head("Tous les avis", "Classement des machines à café", "Huit modèles, classés par note globale. Filtrez par budget, changez le tri : le classement officiel reste celui de la note."),
  sec(`<section class="bl-sec bl-sec--tight pk-bleed"><div class="bl-w"><div class="bl-filters" data-filters><p class="bl-fl">Budget</p><div class="bl-chips" role="group" aria-label="Filtrer par budget"><a class="bl-chip is-on" href="#tous" role="button" data-budget="tous" aria-pressed="true">Tous</a><a class="bl-chip" href="#petit" role="button" data-budget="petit" aria-pressed="false">Moins de 150 €</a><a class="bl-chip" href="#moyen" role="button" data-budget="moyen" aria-pressed="false">150 à 300 €</a><a class="bl-chip" href="#grand" role="button" data-budget="grand" aria-pressed="false">Plus de 300 €</a></div>
<p class="bl-fl">Tri</p><div class="bl-chips" role="group" aria-label="Trier"><a class="bl-chip is-on" href="#note" role="button" data-sort="score" aria-pressed="true">Meilleure note</a><a class="bl-chip" href="#prix" role="button" data-sort="price" aria-pressed="false">Prix croissant</a></div><p class="bl-count" role="status" aria-live="polite"><b data-count-n>8</b> avis</p></div></div></section>`),
  sec(`<section class="bl-sec bl-sec--tight pk-bleed"><div class="bl-w"><ol class="bl-rl" data-list>${rank.map((p, i) => row(p, i)).join("")}</ol><p class="bl-empty" data-empty hidden>Aucun modèle dans cette tranche de prix.</p>
<p class="bl-fine">Les offres affiliées sont proposées sur la page de chaque test. ${esc(MENTION)}</p></div></section>`),
  sec(footer(c)),
];

const test = (c) => { const p = PR[0]; return [
  sec(header(c)),
  sec(`<section class="bl-ph bl-ph--t pk-bleed"><div class="bl-w bl-ph-in"><div><p class="bl-crumb"><a href="/">Accueil</a> › <a href="/avis">Avis</a> › <span data-t-crumb>${esc(p.name)}</span></p><p class="bl-kicker" data-t-type>${esc(p.type)} · testée ${p.weeks} semaines</p><div class="bl-h1" role="heading" aria-level="1" data-t-title>Test de la ${esc(p.name)} : la machine qui convient à presque tout le monde</div>
<p class="bl-lead" data-t-lead>${esc(p.verdict)}</p><p class="bl-by">Par <b>Camille Rivière</b>, rédactrice · mis à jour le <time datetime="2026-11-02">2 novembre 2026</time> · lecture 9 min</p></div>
<div class="bl-score" data-score-box>${dial(p.g, "bl-dial--l")}<div><b data-t-g>${fr(p.g)}</b><span>/ 10</span><p class="bl-score-t">Note globale</p></div></div></div></section>`),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w bl-art-in"><article class="bl-prose" data-t-body>
<p>La ${esc(p.name)} est notre machine de référence depuis six semaines. Nous l'avons utilisée tous les jours à la rédaction, avec trois cafés différents, du lait animal et végétal, et avons mesuré ce qui compte : le goût, la facilité, l'entretien, et le prix au regard de tout cela.</p>
<h2>Le café : une vraie mousse, un goût équilibré</h2><p>Le broyeur conique règle la mouture finement et sans bruit. À réglage égal, nous obtenons des cafés réguliers d'un jour à l'autre, ce qui est rare à ce prix. La température d'extraction reste stable sur dix cafés consécutifs.</p>
<blockquote><p>On ne sent jamais la machine : on sent le café.</p><cite>Camille Rivière, après quarante tasses</cite></blockquote>
<h2>Au quotidien : un geste, une tasse</h2><p>L'écran tactile propose cinq boissons et mémorise vos préférences. La buse vapeur se détache pour le nettoyage, et le réservoir de 1,8 litre évite de remplir chaque matin.</p>
<ul><li>Montée en température : 28 secondes.</li><li>Niveau sonore du broyeur : 62 dB, à un mètre.</li><li>Capacité du bac à marc : environ 14 cafés.</li></ul>
<h2>Entretien : le point à surveiller</h2><p>Le programme de détartrage se déclenche tous les deux mois avec une eau moyennement dure. Le bac à marc est facile à sortir mais délicat à vider sans en renverser : c'est notre seule vraie réserve.</p>
<div class="bl-tw"><table><caption>Comparée à deux concurrentes directes (notes sur 10)</caption><thead><tr><th scope="col">Critère</th><th scope="col">${esc(p.name)}</th><th scope="col">${esc(PR[7].name)}</th><th scope="col">${esc(PR[6].name)}</th></tr></thead><tbody>${CRIT.map(([, l], j) => `<tr><th scope="row">${esc(l)}</th><td>${fr(PR[0].s[j])}</td><td>${fr(PR[7].s[j])}</td><td>${fr(PR[6].s[j])}</td></tr>`).join("")}<tr><th scope="row">Prix constaté</th><td>${PR[0].price} €</td><td>${PR[7].price} €</td><td>${PR[6].price} €</td></tr></tbody></table></div>
<aside class="bl-note"><b>Bon à savoir.</b> Les prix évoluent chaque semaine ; nous indiquons celui relevé le jour du test. ${esc(MENTION)}</aside>
<h2>Notre verdict</h2><p>${esc(p.verdict)} Si votre budget est plus serré, regardez plutôt la <a href="/test#barista-nano">${esc(PR[1].name)}</a> ; si vous voulez le meilleur café, la <a href="/test#aroma-duo">${esc(PR[2].name)}</a>.</p>
</article>
<aside class="bl-verdict" aria-label="En bref" data-t-side><div class="bl-v-top"><b>${p.price} €</b><span>prix relevé le 28 octobre 2026</span></div><h2 class="bl-v-h">En bref</h2>${crit(p)}
<div class="bl-pc"><div><h3 class="bl-v-s">${ic("plus")} On aime</h3><ul>${p.pros.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h3 class="bl-v-s bl-v-s--m">${ic("minus")} On aime moins</h3><ul>${p.cons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
<p class="bl-ideal"><b>Idéale pour :</b> ${esc(p.ideal)}</p><p class="bl-fine">Lien d'offre en bas de page, marqué « lien affilié ».</p></aside></div></section>`),
  sec(`<section class="bl-offer pk-bleed"><div class="bl-w"><p class="bl-offer-t">Où l'acheter ?</p><p class="bl-offer-p">${esc(MENTION)} Le bouton ci-dessous est un lien affilié.</p></div></section>`),
  affil(p),
  sec(`<section class="bl-data pk-bleed" data-data hidden>${PR.map((x) => `<article data-slug="${x.slug}" data-name="${esc(x.name)}" data-type="${esc(x.type)}" data-weeks="${x.weeks}" data-g="${fr(x.g)}" data-price="${x.price}" data-ideal="${esc(x.ideal)}" data-verdict="${esc(x.verdict)}" data-s="${x.s.map(fr).join("|")}" data-pros="${esc(x.pros.join("|"))}" data-cons="${esc(x.cons.join("|"))}"></article>`).join("")}</section>`),
  sec(footer(c)),
]; };

const comparateur = (c) => [
  sec(header(c)),
  head("Comparateur", "Comparer des machines côte à côte", "Choisissez jusqu'à trois modèles. La meilleure valeur de chaque ligne est surlignée.", ""),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><div class="bl-pick" data-pick role="group" aria-label="Modèles à comparer"><p class="bl-fl">Modèles (3 au maximum)</p><div class="bl-chips">${PR.map((p, i) => `<a class="bl-chip${i < 3 ? " is-on" : ""}" href="#m-${p.slug}" role="button" aria-pressed="${i < 3}" data-pid="${p.slug}">${esc(p.name)}</a>`).join("")}</div><p class="bl-count" role="status" aria-live="polite" data-msg></p></div>
<div class="bl-tw bl-tw--cmp"><table data-cmp><caption>Comparatif de huit machines à café (notes sur 10, prix relevés en octobre 2026)</caption><thead><tr><th scope="col">Critère</th>${PR.map((p) => `<th scope="col" data-col="${p.slug}"><a href="/test#${p.slug}">${esc(p.name)}</a></th>`).join("")}</tr></thead><tbody>
<tr data-row="g"><th scope="row">Note globale</th>${PR.map((p) => `<td data-col="${p.slug}" data-v="${p.g}"><b>${fr(p.g)}</b></td>`).join("")}</tr>
${CRIT.map(([, l], j) => `<tr data-row="c${j}"><th scope="row">${esc(l)}</th>${PR.map((p) => `<td data-col="${p.slug}" data-v="${p.s[j]}">${fr(p.s[j])}</td>`).join("")}</tr>`).join("")}
<tr data-row="p" data-low><th scope="row">Prix constaté</th>${PR.map((p) => `<td data-col="${p.slug}" data-v="${p.price}">${p.price} €</td>`).join("")}</tr>
<tr><th scope="row">Type</th>${PR.map((p) => `<td data-col="${p.slug}">${esc(p.type)}</td>`).join("")}</tr>
<tr><th scope="row">Idéale pour</th>${PR.map((p) => `<td data-col="${p.slug}">${esc(p.ideal)}</td>`).join("")}</tr></tbody></table></div>
<p class="bl-fine">Les liens d'achat sont sur la page de chaque test, avec la mention « lien affilié ». ${esc(MENTION)}</p></div></section>`),
  sec(footer(c)),
];

const guide = (c) => [
  sec(header(c)),
  head("Guide d'achat", "Comment choisir sa machine à café", "Cinq questions à se poser avant de regarder un prix, et les erreurs les plus fréquentes.", `<a href="/">Accueil</a> › Guide d'achat`),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><article class="bl-prose bl-prose--long">
<p>Une machine à café se juge à l'usage, pas à la fiche technique. Voici comment nous raisonnons quand un lecteur nous demande conseil.</p>
<h2>1. Combien de tasses par jour ?</h2><p>Une ou deux : une machine à dosettes ou à capsules suffit. Quatre ou plus, ou du lait tous les matins : un modèle avec broyeur ou une machine à levier se justifie.</p>
<h2>2. Combien de temps y consacrer ?</h2><p>Si le café est un rituel, une machine manuelle vous récompensera. Si c'est un carburant, choisissez l'automatisme.</p>
<div class="bl-tw"><table><caption>Quel type de machine selon l'usage ?</caption><thead><tr><th scope="col">Votre profil</th><th scope="col">Type conseillé</th><th scope="col">Budget indicatif</th></tr></thead><tbody><tr><td>Pressé, une personne</td><td>Dosettes ou capsules</td><td>80 à 130 €</td></tr><tr><td>Foyer, goût avant tout</td><td>Expresso avec broyeur</td><td>230 à 300 €</td></tr><tr><td>Passionné</td><td>Semi-professionnelle</td><td>400 € et plus</td></tr></tbody></table></div>
<h2>3. Quelle place ?</h2><p>Mesurez le meuble, pas seulement le plan de travail : plusieurs machines demandent 30 centimètres de hauteur libre pour remplir le réservoir.</p>
<h2>4. Quel entretien accepter ?</h2><p>Plus une machine est puissante, plus elle demande de soin. Comptez dix minutes par semaine pour un modèle avec broyeur.</p>
<aside class="bl-note bl-note--w"><b>Piège courant.</b> Une machine à capsules paraît bon marché à l'achat, mais le café coûte souvent deux à trois fois plus cher au litre.</aside>
<h2>5. Quel budget, en tout ?</h2><p>Ajoutez le prix du café, du détartrant et, si besoin, d'un moulin. La machine n'est qu'une partie du coût.</p>
<p><a class="bl-more" href="/avis">Voir notre classement ${ic("arr")}</a></p></article></div></section>`),
  sec(footer(c)),
];

const transparence = (c) => [
  sec(header(c)),
  head("Méthode et indépendance", "Comment nous testons, comment nous gagnons notre vie", "Ce que vous devez savoir avant de nous croire : notre formule, nos règles et notre modèle économique.", `<a href="/">Accueil</a> › Transparence`),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><article class="bl-prose bl-prose--long">
<h2>Notre formule de notation</h2><p>La note globale est la moyenne pondérée de quatre critères, chacun noté de 0 à 10 après au moins quatre semaines d'usage.</p>
<div class="bl-tw"><table><caption>Pondération des critères</caption><thead><tr><th scope="col">Critère</th><th scope="col">Poids</th><th scope="col">Ce que nous mesurons</th></tr></thead><tbody><tr><th scope="row">Qualité du café</th><td>40 %</td><td>Goût, régularité, température, mousse</td></tr><tr><th scope="row">Facilité d'usage</th><td>20 %</td><td>Mise en route, réglages, bruit</td></tr><tr><th scope="row">Entretien</th><td>15 %</td><td>Nettoyage, détartrage, pièces</td></tr><tr><th scope="row">Rapport qualité-prix</th><td>25 %</td><td>Prix constaté au regard du reste</td></tr></tbody></table></div>
<h2>Nos règles d'indépendance</h2><ol><li>Nous achetons ou empruntons les produits, sans contrepartie.</li><li>Les notes sont figées avant que nous cherchions les offres d'achat.</li><li>Une marque ne relit jamais un test avant publication.</li><li>Une erreur corrigée est signalée en bas de l'article.</li></ol>
<h2>Comment nous gagnons notre vie</h2><p>${esc(MENTION)} Concrètement, quand vous cliquez sur un bouton « lien affilié » puis achetez chez le marchand, celui-ci nous reverse un pourcentage de la vente. Le prix que vous payez est le même.</p>
<aside class="bl-note"><b>Comment les reconnaître.</b> Tous les liens d'achat portent la mention « lien affilié » dans leur libellé et l'attribut <code>rel="sponsored"</code>, qui signale aux moteurs de recherche une relation commerciale. Ils s'ouvrent dans un nouvel onglet.</aside>
<h2>Ce que nous ne faisons pas</h2><ul><li>Nous n'acceptons aucun test payé.</li><li>Nous ne classons pas selon la commission.</li><li>Nous ne cachons pas les défauts d'un produit qui nous rémunère.</li></ul>
<p><a class="bl-more" href="/contact">Une question sur notre méthode ? Écrivez-nous ${ic("arr")}</a></p></article></div></section>`),
  sec(footer(c)),
];

const blocs = (c) => [
  sec(header(c)),
  head("Annexe", "Éléments de page", "Titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés dans le style du thème."),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><article class="bl-prose bl-prose--long">
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe avec du <strong>gras</strong>, de l'<em>italique</em>, un <a href="/avis">lien</a>, du <code>code en ligne</code> et une <mark>mise en évidence</mark>. Le texte courant reste à 17 px minimum, sur une ligne de 60 à 75 caractères.</p>
<ul><li>Liste à puces</li><li>Deuxième élément</li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
<blockquote><p>Une citation se détache par un grand filet vert et une marge généreuse.</p><cite>Personne fictive</cite></blockquote>
<figure class="bl-fig">${CUP}<figcaption>Illustration avec légende : dessin en ligne, texte alternatif fourni.</figcaption></figure>
<div class="bl-tw"><table><caption>Tableau défilant sur mobile</caption><thead><tr><th scope="col">Produit</th><th scope="col">Note</th><th scope="col">Prix</th><th scope="col">Remarque</th></tr></thead><tbody><tr><td>${esc(PR[0].name)}</td><td>${fr(PR[0].g)}</td><td>${PR[0].price} €</td><td>Notre choix</td></tr><tr><td>${esc(PR[1].name)}</td><td>${fr(PR[1].g)}</td><td>${PR[1].price} €</td><td>Petit budget</td></tr></tbody></table></div>
<pre class="bl-pre"><code>note = 0,40 × qualité + 0,20 × facilité\n     + 0,15 × entretien + 0,25 × prix</code></pre>
<p class="bl-actions">${btn("Bouton principal", "/avis")}${btn("Bouton secondaire", "/guide", "bl-btn--g")}</p>
<div class="bl-cols"><div><h3>Colonne 1</h3><p>Deux colonnes côte à côte, empilées sur mobile.</p></div><div><h3>Colonne 2</h3><p>Chaque colonne garde une mesure de lecture confortable.</p></div></div>
<aside class="bl-note"><b>Bon à savoir.</b> Un encadré d'information.</aside><aside class="bl-note bl-note--w"><b>Attention.</b> Un encadré de mise en garde.</aside>
</article></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  head("Contact", "Écrire à la rédaction", "Une erreur dans un test, une question sur un produit, une proposition : nous lisons tout. Nous ne répondons pas aux demandes de test payé."),
  { type: "form", heading: "Votre message", intro: "Le formulaire fonctionne comme sur un vrai site ; dans cette démonstration, personne ne lira votre message." },
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w bl-two"><div><h2 class="bl-h3">Signaler une erreur</h2><p class="bl-p">Donnez l'adresse du test et la phrase concernée. Nous corrigeons et nous signalons la correction en bas de l'article.</p></div><div><h2 class="bl-h3">Marques et distributeurs</h2><p class="bl-p">Nous acceptons de recevoir un produit à tester, sans contrepartie ni relecture. Lisez d'abord <a href="/transparence">nos règles</a>.</p></div></div></section>`),
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  head("Recherche", "Rechercher un test ou un guide", "Un modèle, un critère, un budget : tapez ce que vous cherchez."),
  { type: "layout", children: [{ type: "search", props: { target: "blog", placeholder: "Rechercher un test, un guide…", button: "Chercher" } }] },
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><div class="bl-none"><div class="bl-none-s" aria-hidden="true">${CUP}</div><div><h2 class="bl-h2">Rien sur la balance ?</h2><p class="bl-p">Aucun résultat ne correspond ? Essayez un mot plus court, ou parcourez <a href="/avis">le classement</a>, <a href="/comparateur">le comparateur</a> ou <a href="/guide">le guide d'achat</a>.</p></div></div></div></section>`),
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="bl-404 pk-bleed"><div class="bl-w bl-404-in"><div class="bl-404-s" aria-hidden="true">${CUP}</div><div><p class="bl-kicker">Erreur 404</p><div class="bl-h1" role="heading" aria-level="1">Cette page est introuvable</div><p class="bl-lead">La balance penche dans le vide : l'adresse n'existe pas ou a changé. Retrouvez vos repères.</p><div class="bl-actions">${btn("Retour à l'accueil", "/")}${btn("Le classement", "/avis", "bl-btn--g")}${btn("Le comparateur", "/comparateur", "bl-btn--g")}</div></div></div></section>`),
  sec(footer(c)),
];
const legal = (kicker, title, items) => (c) => [
  sec(header(c)),
  head(kicker, title, "Texte de démonstration, à adapter par l'éditeur réel du site."),
  sec(`<section class="bl-sec pk-bleed"><div class="bl-w"><article class="bl-prose bl-prose--long">${items.map(([t, p]) => `<h2>${esc(t)}</h2><p>${p}</p>`).join("")}<p><a href="/contact">Une question sur ce texte ? Écrivez-nous.</a></p></article></div></section>`),
  sec(footer(c)),
];
const mentions = legal("Mentions", "Mentions légales", [
  ["Éditeur", "Balance est un site de démonstration édité par une structure fictive. Remplacez ces lignes par la raison sociale, l'adresse et le numéro d'immatriculation de votre structure."],
  ["Directrice de la publication", "Une personne fictive, joignable par le <a href=\"/contact\">formulaire de contact</a>."],
  ["Hébergement", "Indiquez ici la dénomination, l'adresse et les coordonnées de l'hébergeur réel du site."],
  ["Liens affiliés", "Ce site contient des liens affiliés, signalés par la mention « lien affilié » et l'attribut rel=\"sponsored\". Une commission peut être perçue sur les achats réalisés via ces liens, sans surcoût pour l'acheteur. <a href=\"/transparence\">En savoir plus</a>."],
  ["Propriété intellectuelle", "Les tests, notes, illustrations et mises en page de cette démonstration sont fictifs. Les marques citées n'existent pas."],
]);
const confidentialite = legal("Confidentialité", "Politique de confidentialité", [
  ["Données collectées", "Le formulaire de contact recueille votre nom, votre adresse e-mail et votre message. Le comparateur et les filtres fonctionnent dans votre navigateur, sans rien envoyer."],
  ["Liens affiliés et cookies", "Lorsque vous cliquez sur un lien affilié, le marchand peut déposer un témoin de connexion pour nous attribuer la vente. Ce thème n'en dépose aucun lui-même ; à vous de compléter selon vos partenaires."],
  ["Finalité et conservation", "Répondre à votre demande ; les messages sont conservés douze mois au plus."],
  ["Vos droits", "Accès, rectification, suppression, opposition : écrivez via le <a href=\"/contact\">formulaire de contact</a>. Vous pouvez aussi saisir l'autorité de contrôle compétente."],
]);

module.exports = {
  key: "balance", name: "Balance", version: "1.0.0", category: "edition", tags: ["editorial", "classique", "moderne"], siteType: "Avis, tests et comparatifs (affiliation transparente)", collection: "pro",
  concept: "Un site d'avis posé sur une balance : notes tracées en cadrans, formule publique, comparateur à trois colonnes, bandeau de transparence toujours visible et liens d'affiliation réels en rel=\"sponsored\".",
  description: "Site d'avis et de comparatifs : papier gris-vert, vert verdict, empattement Arvo, cadrans de notes, classement filtrable par budget, comparateur côte à côte, liens affiliés marqués sponsored et mention visible.",
  brand: "Balance", modules: ["formulaires", "recherche"],
  contentModel: "Produits, notes, tests et critères sont écrits dans les pages du thème (le CMS n'a pas de type de contenu « avis » ni de données structurées Review) ; les liens d'affiliation sont des blocs « Bouton » du moteur avec rel=\"sponsored\".",
  dna: {
    header: "bandeau-de-transparence-permanent-puis-logo-balance-et-navigation-sobre",
    hero: "podium-des-trois-meilleures-notes-en-cadrans-avec-tasse-sur-balance",
    grid: "classement-en-lignes-numerotees-avec-cadran-et-fiche-a-droite",
    typo: "arvo-pour-les-titres-et-maven-pro-pour-les-tests",
    shapes: "cadrans-en-arc-barres-de-criteres-et-pastilles-de-verdict-aux-coins-francs",
    motion: "arcs-qui-se-tracent-colonnes-du-comparateur-qui-se-recalculent-et-meilleure-valeur-surlignee",
    rhythm: "bandes-gris-vert-et-blanc-separees-par-des-filets-de-balance",
    signature: "comparateur-a-trois-colonnes-classement-filtrable-par-budget-et-liens-affilies-sponsored-avec-mention-visible",
    palette: "gris-vert-papier-vert-verdict-et-ambre",
    image: "dessin-en-ligne-de-tasse-sur-balance-et-cadrans-svg-sans-photographie",
    list: "classement-numerote-avec-note-prix-duree-de-test-et-etiquette",
    article: "test-en-deux-colonnes-avec-panneau-verdict-collant-et-bouton-d-offre",
    sidebar: "panneau-verdict-collant-a-droite-avec-criteres-points-forts-et-faibles",
    reading: "maven-pro-17-px-ligne-de-66-caracteres-encadres-de-transparence",
  },
  tokens: {
    colors: { primary: "#1c7c54", secondary: "#17211b", accent: "#e8a100", background: "#f3f5ef", surface: "#ffffff", text: "#17211b", muted: "#556158", success: "#13803f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.arvo", body: "font.maven-pro", button: "font.maven-pro", link: "font.maven-pro" },
    radius: { sm: 2, md: 4, lg: 6, button: 3, field: 3, card: 4 }, shadow: { card: "0 1px 0 #d5dccf", button: "none" }, border: { width: 1, color: "#cfd8c8" },
    type: { h1: { size: 50, weight: 700, lineHeight: 1.1, transform: "none" }, h2: { size: 32, weight: 700, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "vert", label: "Vert verdict (couleur principale)", type: "color", default: "#1c7c54" },
    { key: "ambre", label: "Ambre (accent)", type: "color", default: "#e8a100" },
    { key: "entete", label: "En-tête", type: "choice", default: "balance", choices: [["balance", "Logo centré, navigation dessous"], ["barre", "Logo à gauche, navigation à droite"], ["sobre", "Sobre, navigation compacte"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "colonnes", choices: [["colonnes", "Colonnes et mention d'affiliation"], ["mention", "Mention d'affiliation seule"]] },
    { key: "liste", label: "Classement des avis", type: "choice", default: "classement", choices: [["classement", "Lignes numérotées"], ["grille", "Grille de cartes"], ["tableau", "Tableau dense"]] },
    { key: "test", label: "Page de test", type: "choice", default: "lateral", choices: [["lateral", "Verdict collant à droite"], ["haut", "Verdict en pleine largeur au-dessus"]] },
    { key: "note", label: "Affichage de la note", type: "choice", default: "cadran", choices: [["cadran", "Cadran en arc"], ["chiffre", "Chiffre seul"]] },
  ],
  menu: [["Accueil", "/"], ["Avis", "/avis"], ["Comparateur", "/comparateur"], ["Guide d'achat", "/guide"], ["Transparence", "/transparence"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "avis", name: "Classement des avis", render: avis }, { key: "test", name: "Test détaillé", render: test },
    { key: "comparateur", name: "Comparateur", render: comparateur }, { key: "guide", name: "Guide d'achat", render: guide }, { key: "transparence", name: "Méthode et affiliation", render: transparence }, { key: "blocs", name: "Éléments de page", render: blocs },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
    { key: "mentions-legales", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confidentialite },
  ],
};
