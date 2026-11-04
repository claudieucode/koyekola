// Arène — club et ligue sportifs. Direction artistique : affiche de match. Papier crème, noir profond, orange signal ; titres monumentaux Anton en capitales,
// découpes en biais, bandeau de scores défilant, compte à rebours du prochain match, tableaux de résultats, classement, joueurs en carrousel tactile.
const { sec, form, esc, nav } = require("../kit");

const EMBLEM = {
  A: (c) => `<path d="M32 14 46 50H38l-6-16-6 16h-8z" fill="${c}"/><path d="M24 44h16v5H24z" fill="${c}"/>`,
  T: () => `<path d="M14 18h36v8H36v26h-8V26H14z" fill="#fff"/>`,
  C: () => `<path d="M10 52 32 16l22 36z" fill="#fff" opacity=".9"/><path d="M22 52 32 34l10 18z" fill="#00000055"/>`,
  V: () => `<path d="M14 18l18 34 18-34h-9L32 38 23 18z" fill="#fff"/>`,
  R: () => `<circle cx="32" cy="35" r="15" fill="none" stroke="#fff" stroke-width="6"/><path d="M5 38h54" stroke="#fff" stroke-width="5"/>`,
  G: () => `<path d="M8 36c8-14 20-18 24-18s16 4 24 18c-10-4-16-3-24 8-8-11-14-12-24-8z" fill="#fff"/>`,
};
const crest = (c1, c2, letter) => `<svg class="ar-crest" viewBox="0 0 64 72" aria-hidden="true"><path d="M32 3 59 12v26c0 17-12 27-27 31C17 65 5 55 5 38V12z" fill="${c1}"/><path d="M32 3 59 12v26c0 17-12 27-27 31z" fill="${c2}" opacity=".35"/>${(EMBLEM[letter] || EMBLEM.T)("#fff")}</svg>`;
const bolt = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`;

const header = (c) => `<header class="ar-head pk-bleed">
  <div class="ar-ticker" aria-label="Derniers résultats"><div class="ar-ticker-track">${[["Arène", 3, "Valmont", 1], ["Rives FC", 0, "Arène", 2], ["Arène", 1, "Cimes", 1], ["Torrent", 2, "Arène", 4]].concat([["Arène", 3, "Valmont", 1], ["Rives FC", 0, "Arène", 2], ["Arène", 1, "Cimes", 1], ["Torrent", 2, "Arène", 4]]).map(([a, x, b, y]) => `<span class="ar-tick"><b>${a}</b> <em>${x}–${y}</em> <b>${b}</b></span>`).join("")}</div></div>
  <div class="ar-bar"><a class="ar-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="ar-slash"></span>ARÈNE<small>Sporting Club</small></a>
    <div class="ar-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <a class="ar-btn ar-btn--tilt" href="/billetterie">Billetterie</a>
    <details class="ar-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="ar-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="ar-btn ar-btn--tilt" href="/billetterie">Billetterie</a></div></details>
  </div></header>`;

const footer = (c) => `<footer class="ar-foot pk-bleed"><div class="ar-foot-word" aria-hidden="true">ARÈNE</div>
  <div class="ar-foot-grid"><div><p class="ar-foot-lead">Chaque match est une fête. Venez la vivre.</p><p>Stade des Rives · 14 allée du Stade<br>69100 Villeurbanne</p></div>
  <div><h3>Le club</h3>${nav(c.menu.slice(1, 4), "ar-fl")}</div><div><h3>Infos</h3><a class="ar-fl" href="/billetterie">Billetterie</a><a class="ar-fl" href="/contact">Contact</a><a class="ar-fl" href="/recherche">Recherche</a></div>
  <div><h3>Suivre</h3><a class="ar-fl" href="/actualites">Actualités</a><a class="ar-fl" href="/contact">Presse</a></div></div>
  <p class="ar-legal">© Arène Sporting Club — site de démonstration. Clubs, scores et joueurs fictifs.</p></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="ar-ph pk-bleed"><p class="ar-kicker" data-reveal>${esc(kicker)}</p><div class="ar-giant" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="ar-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</section>`);

const matchRows = [
  ["Sam. 14 déc.", "19:00", "Arène", "A", "#ff4b1f", "Torrent", "T", "#1b3a6b", "Stade des Rives", "Billets"],
  ["Dim. 22 déc.", "15:30", "Cimes", "C", "#2f6b4f", "Arène", "A", "#ff4b1f", "Parc des Cimes", "Billets"],
  ["Sam. 11 janv.", "18:00", "Arène", "A", "#ff4b1f", "Valmont", "V", "#7a1d2e", "Stade des Rives", "Billets"],
  ["Dim. 19 janv.", "20:45", "Rives FC", "R", "#444", "Arène", "A", "#ff4b1f", "Arena Rives", "Billets"],
];
const resultRows = [
  ["Sam. 7 déc.", "Arène", "A", "#ff4b1f", 3, "Valmont", "V", "#7a1d2e", 1, "V"],
  ["Dim. 1 déc.", "Rives FC", "R", "#444", 0, "Arène", "A", "#ff4b1f", 2, "V"],
  ["Sam. 23 nov.", "Arène", "A", "#ff4b1f", 1, "Cimes", "C", "#2f6b4f", 1, "N"],
  ["Dim. 17 nov.", "Torrent", "T", "#1b3a6b", 2, "Arène", "A", "#ff4b1f", 4, "V"],
  ["Sam. 9 nov.", "Arène", "A", "#ff4b1f", 0, "Aigles", "G", "#b8860b", 1, "D"],
];
const fixtures = () => matchRows.map(([d, h, a, la, ca, b, lb, cb, lieu]) => `<li class="ar-row"><span class="ar-date"><b>${d}</b><i>${h}</i></span><span class="ar-team ar-team--l">${a}${crest(ca, "#000", la)}</span><span class="ar-vs">VS</span><span class="ar-team">${crest(cb, "#000", lb)}${b}</span><span class="ar-lieu">${lieu}</span><a class="ar-chip" href="/billetterie">Billets</a></li>`).join("");
const results = () => resultRows.map(([d, a, la, ca, x, b, lb, cb, y, r]) => `<li class="ar-row ar-res-${r}"><span class="ar-date"><b>${d}</b><i>Terminé</i></span><span class="ar-team ar-team--l">${a}${crest(ca, "#000", la)}</span><span class="ar-score">${x}<u>–</u>${y}</span><span class="ar-team">${crest(cb, "#000", lb)}${b}</span><span class="ar-lieu">${r === "V" ? "Victoire" : r === "N" ? "Nul" : "Défaite"}</span><a class="ar-chip ar-chip--ghost" href="/actualites">Résumé</a></li>`).join("");

const players = [["9", "Mathis Roche", "Attaquant", "14 buts"], ["10", "Yanis Dufour", "Meneur", "9 passes"], ["1", "Léo Benali", "Gardien", "7 clean sheets"], ["5", "Hugo Lemaire", "Défenseur", "92 % duels"], ["7", "Noé Carpentier", "Ailier", "11 buts"], ["8", "Ilyes Marchand", "Milieu", "88 % passes"]];
const playerCards = () => players.map(([n, name, pos, stat], i) => `<article class="ar-player ar-p${i % 3}" data-reveal><span class="ar-num" aria-hidden="true">${n}</span><svg class="ar-silh" viewBox="0 0 120 150" aria-hidden="true"><circle cx="60" cy="42" r="24" fill="currentColor"/><path d="M12 150c0-40 20-62 48-62s48 22 48 62z" fill="currentColor"/></svg><div class="ar-pinfo"><h3>${esc(name)}</h3><p>${esc(pos)}</p><b>${esc(stat)}</b></div></article>`).join("");

const home = (c) => [
  sec(header(c)),
  sec(`<section class="ar-hero pk-bleed">
    <div class="ar-hero-copy"><p class="ar-kicker" data-reveal>Saison 2026 / 27 · Division 1</p><div class="ar-mega" role="heading" aria-level="1"><span data-reveal>Le club</span><span data-reveal>qui fait</span><span class="ar-hot" data-reveal>vibrer</span><span data-reveal>la ville.</span></div>
      <p class="ar-lead" data-reveal>Plus de quarante ans de maillots orange, un stade qui ne se tait jamais et une équipe qui joue pour gagner. Rejoignez la tribune.</p>
      <div class="ar-actions" data-reveal><a class="ar-btn ar-btn--tilt ar-btn--lg" href="/billetterie">Réserver ma place ${arrow}</a><a class="ar-btn ar-btn--line ar-btn--lg" href="/calendrier">Voir le calendrier</a></div></div>
    <aside class="ar-next" data-reveal aria-label="Prochain match"><p class="ar-next-label">${bolt} Prochain match · Division 1 · J.18</p>
      <div class="ar-vsline"><div>${crest("#ff4b1f", "#000", "A")}<b>Arène</b></div><span>VS</span><div>${crest("#1b3a6b", "#000", "T")}<b>Torrent</b></div></div>
      <p class="ar-next-meta">Samedi 14 décembre · 19 h 00 · Stade des Rives</p>
      <div class="ar-count" data-countdown="2026-12-14T19:00:00" aria-live="off"><div><b data-u="d">00</b><i>jours</i></div><div><b data-u="h">00</b><i>heures</i></div><div><b data-u="m">00</b><i>min</i></div><div><b data-u="s">00</b><i>sec</i></div></div>
      <a class="ar-btn ar-btn--block" href="/billetterie">Billets dès 12 €</a></aside>
    <div class="ar-cut" aria-hidden="true"></div></section>`),
  sec(`<section class="ar-stats pk-bleed"><ul class="ar-stats-in"><li data-reveal><b data-count="14">14</b><span>victoires cette saison</span></li><li data-reveal><b data-count="42">42</b><span>buts marqués</span></li><li data-reveal><b data-count="18" data-suffix="k">18k</b><span>supporters au stade</span></li><li data-reveal><b data-count="1984">1984</b><span>année de fondation</span></li></ul></section>`),
  sec(`<section class="ar-fix pk-bleed"><div class="ar-wrap"><div class="ar-sechead"><h2 class="ar-h2" data-reveal>Matchs</h2>
    <div class="ar-tabs" role="tablist"><a href="#a-venir" class="is-on" data-tab="fix" role="tab">À venir</a><a href="#resultats" data-tab="res" role="tab">Résultats</a></div></div>
    <ol class="ar-list" data-panel="fix">${fixtures()}</ol><ol class="ar-list" data-panel="res" hidden>${results()}</ol></div></section>`),
  sec(`<section class="ar-squad pk-bleed"><div class="ar-wrap"><div class="ar-sechead"><h2 class="ar-h2" data-reveal>L'effectif</h2><div class="ar-arrows"><a href="#prec" data-scroll="-1" aria-label="Joueurs précédents">${arrow}</a><a href="#suiv" data-scroll="1" aria-label="Joueurs suivants">${arrow}</a></div></div></div>
    <div class="ar-rail" aria-label="Joueurs de l'équipe">${playerCards()}</div></section>`),
  sec(`<section class="ar-table pk-bleed"><div class="ar-wrap ar-split"><div><p class="ar-kicker" data-reveal>Classement</p><h2 class="ar-h2" data-reveal>En course<br>pour le titre.</h2><p class="ar-muted" data-reveal>Le classement se met à jour après chaque journée. Cinq points d'avance sur le dauphin.</p><a class="ar-btn ar-btn--line" href="/calendrier" data-reveal>Tout le calendrier</a></div>
    <table class="ar-rank" data-reveal><caption class="ar-sr">Classement de Division 1</caption><thead><tr><th>#</th><th>Club</th><th>J</th><th>Pts</th><th>Forme</th></tr></thead><tbody>
    <tr class="is-us"><td>1</td><td>Arène</td><td>17</td><td>38</td><td><i class="w"></i><i class="w"></i><i class="d"></i><i class="w"></i><i class="w"></i></td></tr>
    <tr><td>2</td><td>Torrent</td><td>17</td><td>33</td><td><i class="w"></i><i class="l"></i><i class="w"></i><i class="w"></i><i class="d"></i></td></tr>
    <tr><td>3</td><td>Cimes</td><td>17</td><td>31</td><td><i class="d"></i><i class="w"></i><i class="w"></i><i class="l"></i><i class="w"></i></td></tr>
    <tr><td>4</td><td>Valmont</td><td>17</td><td>27</td><td><i class="l"></i><i class="l"></i><i class="w"></i><i class="d"></i><i class="w"></i></td></tr>
    <tr><td>5</td><td>Rives FC</td><td>17</td><td>24</td><td><i class="w"></i><i class="d"></i><i class="l"></i><i class="l"></i><i class="d"></i></td></tr></tbody></table></div></section>`),
  sec(`<section class="ar-news pk-bleed"><div class="ar-wrap"><div class="ar-sechead"><h2 class="ar-h2" data-reveal>À la une</h2><a class="ar-more" href="/actualites">Toutes les actualités ${arrow}</a></div>
    <div class="ar-news-grid"><a class="ar-card ar-card--big" href="/actualites" data-reveal><span class="ar-tag">Club</span><h3>Le stade passe à 20 000 places dès janvier</h3><p>Une nouvelle tribune nord, plus proche du terrain, pour faire monter le volume.</p></a>
      <a class="ar-card" href="/actualites" data-reveal><span class="ar-tag">Match</span><h3>Roche signe un doublé face à Valmont</h3><p>Retour sur une soirée où tout a réussi.</p></a>
      <a class="ar-card" href="/actualites" data-reveal><span class="ar-tag">Jeunes</span><h3>L'académie ouvre ses détections</h3><p>Rendez-vous les 18 et 19 janvier.</p></a></div></div></section>`),
  sec(`<section class="ar-join pk-bleed"><div class="ar-wrap ar-join-in"><h2 class="ar-mega ar-mega--s" data-reveal>Rejoignez<br>la tribune.</h2><div data-reveal><p class="ar-lead">Abonnement saison dès 189 €. Places assises, tribune debout, carte famille : choisissez votre place.</p><a class="ar-btn ar-btn--tilt ar-btn--lg" href="/billetterie">Voir les abonnements ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

const calendrier = (c) => [sec(header(c)), pagehead("Division 1 · Saison 2026 / 27", "Calendrier<br>& résultats", "Tous les matchs de l'Arène, à domicile et à l'extérieur."),
  sec(`<section class="ar-fix pk-bleed"><div class="ar-wrap"><div class="ar-sechead"><h2 class="ar-h2">Matchs</h2><div class="ar-tabs" role="tablist"><a href="#a-venir" class="is-on" data-tab="fix" role="tab">À venir</a><a href="#resultats" data-tab="res" role="tab">Résultats</a></div></div>
    <ol class="ar-list" data-panel="fix">${fixtures()}</ol><ol class="ar-list" data-panel="res" hidden>${results()}</ol></div></section>`),
  sec(footer(c))];

const equipe = (c) => [sec(header(c)), pagehead("Effectif 2026 / 27", "Les joueurs", "Vingt-deux joueurs, un seul objectif."),
  sec(`<section class="ar-squad ar-squad--grid pk-bleed"><div class="ar-wrap ar-grid3">${playerCards()}</div></section>`), sec(footer(c))];

const billetterie = (c) => [sec(header(c)), pagehead("Saison 2026 / 27", "Billetterie", "Abonnements et places à l'unité. Paiement et retrait au stade : fonctionnement à définir avec le club."),
  sec(`<section class="ar-tiers pk-bleed"><div class="ar-wrap ar-tiers-in">
    <article class="ar-tier" data-reveal><h3>Tribune debout</h3><p class="ar-price">12 €<small>/match</small></p><ul><li>Ambiance des virages</li><li>Accès supporters</li><li>Carte de fidélité</li></ul><a class="ar-btn ar-btn--line ar-btn--block" href="/contact">Réserver</a></article>
    <article class="ar-tier ar-tier--hot" data-reveal><span class="ar-flag">Le plus choisi</span><h3>Abonnement saison</h3><p class="ar-price">189 €<small>/saison</small></p><ul><li>Place assise numérotée</li><li>17 matchs à domicile</li><li>Maillot offert</li><li>Priorité coupe</li></ul><a class="ar-btn ar-btn--tilt ar-btn--block" href="/contact">S'abonner</a></article>
    <article class="ar-tier" data-reveal><h3>Carte famille</h3><p class="ar-price">320 €<small>/saison</small></p><ul><li>2 adultes + 2 enfants</li><li>Tribune familiale</li><li>Animations jeunesse</li></ul><a class="ar-btn ar-btn--line ar-btn--block" href="/contact">Réserver</a></article></div></section>`),
  sec(`<section class="ar-faq pk-bleed"><div class="ar-wrap ar-faq-in"><h2 class="ar-h2" data-reveal>Questions</h2><div>
    <details data-reveal><summary>Puis-je revendre ma place ?</summary><p>Les modalités de revente sont à définir par le club ; contactez la billetterie.</p></details>
    <details data-reveal><summary>Les enfants paient-ils ?</summary><p>Tarif réduit jusqu'à 12 ans, gratuit jusqu'à 5 ans accompagnés.</p></details>
    <details data-reveal><summary>Le stade est-il accessible ?</summary><p>Oui : places dédiées, entrée prioritaire et accompagnants admis.</p></details></div></div></section>`),
  sec(footer(c))];

const actualites = (c) => [sec(header(c)), pagehead("Le journal du club", "Actualités", "Matchs, club, jeunes et coulisses."),
  sec(`<section class="ar-news pk-bleed"><div class="ar-wrap"><div class="ar-news-grid ar-news-grid--list">${["Le stade passe à 20 000 places dès janvier|Club|Une nouvelle tribune nord, plus proche du terrain.", "Roche signe un doublé face à Valmont|Match|Une soirée où tout a réussi.", "L'académie ouvre ses détections|Jeunes|Rendez-vous les 18 et 19 janvier.", "Interview : le capitaine avant le choc|Club|« On joue pour la tribune. »", "Le calendrier des fêtes est tombé|Match|Quatre matchs en douze jours."].map((r) => { const [t, tag, x] = r.split("|"); return `<a class="ar-card" href="/contact" data-reveal><span class="ar-tag">${tag}</span><h3>${t}</h3><p>${x}</p></a>`; }).join("")}</div></div></section>`),
  sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("On vous répond", "Contact", "Billetterie, presse, partenariats ou recrutement."),
  { type: "form", heading: "Écrire au club", intro: "Indiquez votre demande : nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une info ?", "Un match, un joueur, un article."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ar-404 pk-bleed"><p class="ar-kicker">Hors-jeu</p><div class="ar-giant" role="heading" aria-level="1">404</div><p class="ar-ph-sub">Cette page n'existe pas ou a changé d'adresse.</p><a class="ar-btn ar-btn--tilt ar-btn--lg" href="/">Retour à l'accueil</a></section>`), sec(footer(c))];

module.exports = {
  key: "arene", name: "Arène", version: "2.0.0", category: "sport", tags: ["audacieux", "moderne", "geometrique"], siteType: "Club et ligue sportifs", featured: true,
  concept: "Une affiche de match : titres monumentaux en biais, bandeau de scores qui défile, compte à rebours en direct, classement et joueurs en carrousel.",
  description: "Club ou ligue sportifs : affiche de match crème, noir et orange signal, compte à rebours du prochain match, calendrier et résultats à onglets, classement, effectif en carrousel, billetterie.",
  brand: "Arène Sporting Club", modules: ["formulaires", "recherche"],
  dna: { header: "ticker-barre-noire", hero: "titre-monumental-avec-carte-match", grid: "listes-matchs-et-carrousel", motion: "compte-a-rebours-et-compteurs" },
  tokens: {
    colors: { primary: "#ff4b1f", secondary: "#0e0e0e", accent: "#ffd23f", background: "#f3efe6", surface: "#ffffff", text: "#111111", muted: "#5d5a52", success: "#1e7e34", warning: "#8a5a00", error: "#c62828" },
    fonts: { heading: "font.anton", body: "font.work-sans", button: "font.barlow-condensed", link: "font.work-sans" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#111111" },
    type: { h1: { size: 96, weight: 400, lineHeight: 0.92, transform: "uppercase" }, h2: { size: 56, weight: 400, lineHeight: 0.95, transform: "uppercase" } },
  },
  options: [
    { key: "accent", label: "Couleur signal", type: "color", default: "#ff4b1f" },
    { key: "ink", label: "Noir des bandeaux", type: "color", default: "#0e0e0e" },
    { key: "tilt", label: "Biais des boutons", type: "choice", default: "tilt", choices: [["tilt", "Incliné"], ["flat", "Droit"]] },
    { key: "ticker", label: "Bandeau de scores", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Calendrier", "/calendrier"], ["Équipe", "/equipe"], ["Actualités", "/actualites"], ["Billetterie", "/billetterie"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "calendrier", name: "Calendrier", render: calendrier }, { key: "equipe", name: "Équipe", render: equipe },
    { key: "actualites", name: "Actualités", render: actualites }, { key: "billetterie", name: "Billetterie", render: billetterie }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
