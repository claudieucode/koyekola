// Ledger — néobanque fictive. Direction artistique : tableau de bord de précision. Nuit verte profonde, vert menthe, ambre pour les alertes ; chiffres tabulaires,
// barre de navigation « palette de commandes », hero à tableau de bord animé, cartes de données, simulateur épargne / prêt entièrement fonctionnel.
const { sec, form, esc, nav } = require("../kit");

const IC = {
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  chart: '<path d="M4 19V5M4 19h16"/><path d="m8 14 3-3 3 2 5-6"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  pie: '<path d="M12 3v9h9"/><path d="M20.5 15A9 9 0 1 1 9 3.5"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9c-.5-1-1.500-1.500-2.500-1.500-1.500 0-2.500.8-2.500 2s1 1.700 2.500 2 2.500.8 2.500 2-1 2-2.500 2c-1 0-2-.5-2.500-1.500M12 6v1.500M12 16.500V18"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.500 2h-15z"/><path d="M10 21h4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l3 3"/>',
  search: '<circle cx="11" cy="11" r="6.500"/><path d="m16 16 4.500 4.500"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h6M10 16h6"/>',
  users: '<circle cx="9" cy="9" r="3.500"/><path d="M3 20c0-3.500 2.700-6 6-6s6 2.500 6 6"/><path d="M16 6.500a3.500 3.500 0 0 1 0 6.500M18 14.500c2 .8 3 2.800 3 5.500"/>',
};
const ic = (n, cls = "lg-ic") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

// Mini courbe : (valeurs, largeur, hauteur) -> {line, area}
const spark = (vals, w = 160, h = 48, pad = 4) => {
  const mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1;
  const pts = vals.map((v, i) => [pad + (i * (w - 2 * pad)) / (vals.length - 1), h - pad - ((v - mn) / sp) * (h - 2 * pad)].map((n) => n.toFixed(1)));
  const line = "M" + pts.map((p) => p.join(" ")).join("L");
  return { line, area: `${line}L${pts[pts.length - 1][0]} ${h}L${pts[0][0]} ${h}Z` };
};
const sparkSvg = (vals, cls = "", w = 160, h = 48) => {
  const s = spark(vals, w, h);
  return `<svg class="lg-spark ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${s.area}" fill="#3df0b0" opacity=".14"/><path d="${s.line}" fill="none" stroke="#3df0b0" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
};
const logo = `<svg class="lg-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="#0c1f1a" stroke="#3df0b0" stroke-width="1.500"/><path d="M9 22V14M15 22V9M21 22v-5" stroke="#2a8f6e" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="10" r="2" fill="#ffb454"/></svg>`;

const MENU = [["Accueil", "/"], ["Produits", "/produits"], ["Tarifs", "/tarifs"], ["Sécurité", "/securite"], ["Simulateur", "/simulateur"], ["Ressources", "/ressources"], ["À propos", "/apropos"], ["Contact", "/contact"]];
const inline = MENU.slice(1, 7);
const PAL = [
  ["Pages", [["Accueil", "/", "g a"], ["Produits : comptes et cartes", "/produits", "g p"], ["Tarifs : tableau comparatif", "/tarifs", "g t"], ["Sécurité", "/securite", "g s"], ["Ressources et guides", "/ressources", "g r"], ["À propos", "/apropos", "g o"]]],
  ["Actions", [["Lancer le simulateur épargne / prêt", "/simulateur", "s"], ["Écrire à l'équipe", "/contact", "c"], ["Rechercher sur le site", "/recherche", "/"]]],
];

const header = (c) => `<header class="lg-head pk-bleed">
  <div class="lg-demo"><span class="lg-dot"></span>Démonstration : néobanque fictive. Aucun compte, aucune carte, aucun agrément réel.</div>
  <div class="lg-bar"><a class="lg-logo" href="/" aria-label="${esc(c.brand)} : accueil">${logo}<b>Kalmé</b><small>ledger</small></a>
    <div class="lg-nav" role="navigation" aria-label="Navigation principale">${inline.map(([l, u]) => `<a href="${u}">${l}</a>`).join("")}</div>
    <a class="lg-k" href="/recherche" data-pal aria-haspopup="dialog">${ic("search")}<span class="lg-k-t">Rechercher ou aller à…</span><span class="lg-k-b">Ctrl K</span></a>
    <a class="lg-btn lg-btn--sm" href="/simulateur">Simulateur</a>
    <details class="lg-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="lg-drawer" role="navigation" aria-label="Menu mobile">${MENU.map(([l, u]) => `<a href="${u}">${l}</a>`).join("")}<a class="lg-btn" href="/simulateur">Lancer le simulateur</a></div></details>
  </div>
  <div class="lg-pal" role="dialog" aria-modal="true" aria-label="Palette de commandes"><a class="lg-pal-bg" href="#fermer" data-pal-close aria-label="Fermer la palette"></a>
    <div class="lg-pal-box"><div class="lg-pal-q">${ic("search")}<span class="lg-pal-t" aria-live="polite">Tapez pour filtrer</span><span class="lg-pal-esc">Échap</span></div>
      <div class="lg-pal-list">${PAL.map(([g, items]) => `<p class="lg-pal-g">${g}</p>${items.map(([l, u, k]) => `<a class="lg-pal-i" href="${u}" data-pal-i><span>${l}</span><i>${k}</i></a>`).join("")}`).join("")}<p class="lg-pal-none">Aucune commande ne correspond.</p></div>
      <p class="lg-pal-foot">Flèches pour naviguer, Entrée pour ouvrir. Ctrl K ou / pour rouvrir.</p></div></div>
</header>`;

const footer = (c) => `<footer class="lg-foot pk-bleed"><div class="lg-wrap"><div class="lg-foot-top"><div class="lg-foot-brand"><a class="lg-logo" href="/">${logo}<b>Kalmé</b><small>ledger</small></a><p>Une néobanque imaginaire pour montrer ce que précision, données et clarté peuvent donner à une interface financière.</p></div>
  <div><h3>Produits</h3><a href="/produits">Comptes et cartes</a><a href="/tarifs">Tarifs</a><a href="/simulateur">Simulateur</a></div>
  <div><h3>Confiance</h3><a href="/securite">Sécurité</a><a href="/ressources">Ressources</a><a href="/apropos">À propos</a></div>
  <div><h3>Aide</h3><a href="/contact">Contact</a><a href="/recherche">Recherche</a><a href="mailto:demo@example.com">demo@example.com</a></div></div>
  <p class="lg-legal">© Kalmé : site de démonstration. Établissement, offres, taux, frais et chiffres fictifs ; aucun agrément, aucun dépôt, aucune promesse de rendement. Les résultats du simulateur sont purement illustratifs et ne constituent pas un conseil financier.</p></div></footer>`;

const pagehead = (path, title, sub, chips = []) => sec(`<section class="lg-ph pk-bleed"><div class="lg-wrap"><p class="lg-crumb" data-reveal><span>kalmé</span> / <b>${esc(path)}</b></p><div class="lg-h1 lg-h1--p" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="lg-sub" data-reveal>${esc(sub)}</p>` : ""}${chips.length ? `<ul class="lg-chips" data-reveal>${chips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div></section>`);

const cta = (t, s, b = "Nous écrire", u = "/contact") => sec(`<section class="lg-cta pk-bleed"><div class="lg-wrap lg-cta-in" data-reveal><div><h2 class="lg-h2">${t}</h2><p class="lg-sub">${esc(s)}</p></div><a class="lg-btn lg-btn--lg" href="${u}">${b}${ic("arrow", "lg-ic lg-ic--s")}</a></div></section>`);

// ---------- données de démonstration ----------
const PROD = [
  { k: "compte", n: "Essentiel", t: "Compte courant", d: "Le compte du quotidien : catégories en direct, alertes de solde et carte virtuelle incluse.", m: "0", y: "0", f: ["Carte virtuelle", "Catégories automatiques", "Alertes de solde"] },
  { k: "compte", n: "Plus", t: "Compte courant", d: "Pour piloter un budget : sous-comptes, objectifs d'épargne et carte physique.", m: "4,90", y: "49", f: ["Carte physique", "Sous-comptes illimités", "Objectifs d'épargne"] },
  { k: "compte", n: "Pro", t: "Compte professionnel", d: "Une vue claire de la trésorerie : export comptable, cartes d'équipe et plafonds par membre.", m: "12,90", y: "129", f: ["Cartes d'équipe", "Export comptable", "Plafonds par carte"] },
  { k: "carte", n: "Carte Virtuelle", t: "Carte", d: "Numéro jetable pour chaque achat en ligne, gel instantané dans l'application.", m: "0", y: "0", f: ["Numéros jetables", "Gel en un geste", "Plafond réglable"] },
  { k: "carte", n: "Carte Graphite", t: "Carte", d: "Carte physique sans contact, suivi des dépenses par catégorie, plafonds modifiables.", m: "2,00", y: "20", f: ["Sans contact", "Plafonds modifiables", "Opposition immédiate"] },
  { k: "epargne", n: "Coffre Objectifs", t: "Épargne", d: "Des pots nommés avec un objectif et une date ; la courbe montre si vous êtes dans les temps.", m: "0", y: "0", f: ["Pots nommés", "Courbe d'avancement", "Taux de démonstration"] },
];
const TXS = [["Café des Halles", "Sorties", "−3,20", "neg"], ["Salaire (exemple)", "Revenus", "+2 140,00", "pos"], ["Biocoop Rivage", "Courses", "−42,87", "neg"], ["Abonnement trains", "Transport", "−75,00", "neg"], ["Pot « Voyage »", "Épargne", "−150,00", "neg"], ["Remboursement ami", "Virements", "+28,50", "pos"]];

const productCard = (p, i) => `<article class="lg-pcard" data-item data-cat="${p.k}" data-reveal><div class="lg-pcard-v">${p.k === "carte" ? `<svg viewBox="0 0 220 130" aria-hidden="true"><rect x="6" y="10" width="208" height="112" rx="14" fill="#10241f" stroke="#2a8f6e"/><rect x="24" y="34" width="30" height="22" rx="5" fill="#ffb454" opacity=".85"/><path d="M30 34v22M42 34v22M24 45h30" stroke="#0a1714" stroke-width="1"/><path d="M24 92h86M24 104h44" stroke="#2a8f6e" stroke-width="3" stroke-linecap="round"/><circle cx="178" cy="98" r="14" fill="#3df0b0" opacity=".85"/><circle cx="164" cy="98" r="14" fill="#ffb454" opacity=".7"/></svg>` : sparkSvg([3, 4, 3.600, 5, 4.800, 6.200, 6, 7.500, 7.200, 8.800].map((v) => v + i), "", 220, 130)}</div>
  <div class="lg-pcard-b"><p class="lg-tag">${esc(p.t)}</p><h3>${esc(p.n)}</h3><p>${esc(p.d)}</p><ul>${p.f.map((x) => `<li>${ic("check", "lg-ic lg-ic--s")}${esc(x)}</li>`).join("")}</ul><p class="lg-pcard-p"><b class="lg-n"><span class="lg-m">${p.m} €</span><span class="lg-y">${p.y} €</span></b><small><span class="lg-m">/ mois</span><span class="lg-y">/ an</span> · prix fictif</small></p></div></article>`;

// Série d'épargne par défaut (mêmes calculs que le simulateur) pour un rendu correct même sans JavaScript
const defSeries = () => { const r = 0.025 / 12; let b = 5000; const s = [b]; for (let m = 1; m <= 120; m++) { b = b * (1 + r) + 200; if (m % 12 === 0) s.push(b); } return s; };
const fr = (n) => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");

// ---------- ACCUEIL ----------
const home = (c) => {
  const ser = defSeries(); const sp = spark(ser, 600, 200, 6);
  return [
    sec(header(c)),
    sec(`<section class="lg-hero pk-bleed"><div class="lg-hero-in lg-wrap">
    <div class="lg-dash" data-live aria-label="Aperçu animé d'un tableau de bord. Données fictives.">
      <div class="lg-dash-top"><span class="lg-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="lg-dash-t">tableau-de-bord / démo</span><span class="lg-live"><span class="lg-dot"></span>en direct</span></div>
      <div class="lg-dash-g">
        <div class="lg-w lg-w--bal"><p class="lg-w-k">Solde total (fictif)</p><p class="lg-bal lg-n"><span data-count="12480" data-dec="0">12 480</span><small>,36 €</small></p><p class="lg-delta"><span class="lg-up">▲ 3,2 %</span> sur 30 jours</p>
          <svg class="lg-live-chart" data-livechart viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true"><path class="lg-lc-a" d="M0 60L50 52L100 58L150 40L200 46L250 28L300 22V90H0Z" fill="#3df0b0" opacity=".13"/><path class="lg-lc-l" d="M0 60L50 52L100 58L150 40L200 46L250 28L300 22" fill="none" stroke="#3df0b0" stroke-width="2.200" stroke-linejoin="round" stroke-linecap="round"/></svg></div>
        <div class="lg-w lg-w--don"><p class="lg-w-k">Dépenses du mois</p><svg viewBox="0 0 120 120" class="lg-donut" aria-hidden="true"><circle cx="60" cy="60" r="44" fill="none" stroke="#1d3631" stroke-width="14"/>${[[0,.38,"#3df0b0"],[.40,.63,"#ffb454"],[.65,.80,"#7aa2ff"]].map(([a,b,c])=>{const f=(t)=>[60+44*Math.sin(t*6.2832),60-44*Math.cos(t*6.2832)].map((n)=>n.toFixed(1)).join(" ");return `<path d="M${f(a)}A44 44 0 ${b-a>.5?1:0} 1 ${f(b)}" fill="none" stroke="${c}" stroke-width="14"/>`}).join("")}</svg>
          <ul class="lg-leg"><li><i class="lg-c1"></i>Courses<b class="lg-n">40 %</b></li><li><i class="lg-c2"></i>Sorties<b class="lg-n">25 %</b></li><li><i class="lg-c3"></i>Transport<b class="lg-n">17 %</b></li></ul></div>
        <div class="lg-w lg-w--feed"><p class="lg-w-k">Flux récents</p><ul class="lg-feed" data-feed>${TXS.slice(0, 4).map(([n, k, a, s]) => `<li><span class="lg-fi">${n.charAt(0)}</span><span><b>${n}</b><i>${k}</i></span><span class="lg-n lg-${s}">${a} €</span></li>`).join("")}</ul></div>
        <div class="lg-w lg-w--goal"><p class="lg-w-k">Objectifs</p><div class="lg-goal"><span>Voyage <b class="lg-n">68 %</b></span><div class="lg-bar-t"><i class="lg-p68"></i></div></div><div class="lg-goal"><span>Fonds d'urgence <b class="lg-n">41 %</b></span><div class="lg-bar-t"><i class="lg-p41"></i></div></div></div>
      </div></div>
    <div class="lg-copy"><p class="lg-eyebrow" data-reveal><span class="lg-dot"></span>Néobanque fictive · données de démonstration</p>
      <div class="lg-h1" role="heading" aria-level="1" data-reveal>Votre argent, <em>lisible</em> au centime près.</div>
      <p class="lg-lead" data-reveal>Kalmé imagine une banque où chaque chiffre s'explique : courbes en direct, catégories claires, objectifs visibles. Testez le simulateur d'épargne et de prêt, tout se calcule dans votre navigateur.</p>
      <div class="lg-actions" data-reveal><a class="lg-btn lg-btn--lg" href="/simulateur">Tester le simulateur${ic("arrow", "lg-ic lg-ic--s")}</a><a class="lg-btn lg-btn--ghost lg-btn--lg" href="/produits">Voir les comptes</a></div>
      <ul class="lg-trust" data-reveal><li>${ic("shield", "lg-ic lg-ic--s")}Aucun vrai compte</li><li>${ic("lock", "lg-ic lg-ic--s")}Aucune donnée collectée</li><li>${ic("doc", "lg-ic lg-ic--s")}Taux illustratifs</li></ul></div></div></section>`),
    sec(`<section class="lg-metrics pk-bleed"><ul class="lg-wrap lg-metrics-in"><li data-reveal><b class="lg-n" data-count="1250000">1 250 000</b><span>opérations simulées par jour</span></li><li data-reveal><b class="lg-n"><span data-count="99.98" data-dec="2">99,98</span> %</b><span>disponibilité affichée (démo)</span></li><li data-reveal><b class="lg-n" data-count="24">24</b><span>devises dans le tableau de bord</span></li><li data-reveal><b class="lg-n"><span data-count="0" data-dec="0">0</span> €</b><span>frais de tenue sur Essentiel</span></li></ul></section>`),
    sec(`<section class="lg-feat pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Fonctions</p><h2 class="lg-h2">Chaque donnée a sa carte.</h2><p class="lg-sub">Une grille de modules que vous composez : on garde ce qui compte, on masque le reste.</p></div>
    <div class="lg-cards">${[
      ["chart", "Budget en direct", "La courbe du mois se met à jour à chaque opération et se compare au mois précédent.", [4, 5, 4.500, 6, 5.500, 7, 6.800, 8]],
      ["pie", "Catégories claires", "Courses, transport, sorties : chaque dépense est rangée, vous corrigez d'un geste.", [6, 5, 6.500, 4, 5, 3.500, 4.200, 3]],
      ["coin", "Objectifs d'épargne", "Des pots nommés avec une date ; la courbe indique si vous êtes dans les temps.", [1, 2, 2.500, 3.800, 4.200, 5.600, 6.400, 7.800]],
      ["card", "Cartes virtuelles", "Un numéro jetable par achat, un plafond par carte, un gel instantané.", [3, 3, 5, 4, 6, 5, 7, 7]],
      ["bell", "Alertes utiles", "Seuil de solde, prélèvement inhabituel, objectif atteint : vous choisissez ce qui sonne.", [5, 4, 6, 3, 5, 2.500, 4, 3.500]],
      ["doc", "Exports propres", "Un relevé lisible, un fichier tableur, un résumé annuel par catégorie.", [2, 3, 3.500, 5, 4.500, 6, 6.500, 8]],
    ].map(([i, t, d, v]) => `<article class="lg-card" data-reveal>${ic(i)}<h3>${t}</h3><p>${d}</p>${sparkSvg(v, "lg-spark--c", 160, 40)}</article>`).join("")}</div></div></section>`),
    sec(`<section class="lg-simt pk-bleed"><div class="lg-wrap lg-simt-in"><div data-reveal><p class="lg-eyebrow">Simulateur</p><h2 class="lg-h2">Et si vous épargniez 200 € par mois ?</h2><p class="lg-sub">Avec 5 000 € de départ, 10 ans et un taux de démonstration de 2,5 %, le calcul ci-contre donne un capital de <b class="lg-n">${fr(ser[ser.length - 1])} €</b>. Changez les valeurs dans le vrai simulateur et suivez la courbe en direct.</p><a class="lg-btn" href="/simulateur">Ouvrir le simulateur${ic("arrow", "lg-ic lg-ic--s")}</a></div>
      <figure class="lg-simt-fig" data-reveal><svg viewBox="0 0 600 200" preserveAspectRatio="none" role="img" aria-label="Courbe de démonstration d'une épargne sur dix ans"><path d="M0 50H600M0 100H600M0 150H600" stroke="#1d3631"/><path d="${sp.area}" fill="#3df0b0" opacity=".16"/><path d="${sp.line}" fill="none" stroke="#3df0b0" stroke-width="3"/></svg><figcaption class="lg-n">${fr(ser[0])} € → ${fr(ser[ser.length - 1])} € en 10 ans (illustratif)</figcaption></figure></div></section>`),
    sec(`<section class="lg-prod pk-bleed"><div class="lg-wrap"><div class="lg-sechead lg-sechead--row" data-reveal><div><p class="lg-eyebrow">Produits</p><h2 class="lg-h2">Trois comptes, un même tableau de bord.</h2></div><a class="lg-more" href="/produits">Tous les produits${ic("arrow", "lg-ic lg-ic--s")}</a></div>
    <div class="lg-pgrid">${PROD.slice(0, 3).map(productCard).join("")}</div></div></section>`),
    sec(`<section class="lg-secu pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Confiance</p><h2 class="lg-h2">La sécurité se montre, elle ne se promet pas.</h2></div>
    <ul class="lg-secu-g">${[["lock", "Chiffrement de bout en bout", "Principe illustré dans la page Sécurité."], ["key", "Double validation", "Chaque opération sensible demande une seconde confirmation."], ["bell", "Alertes en temps réel", "Un événement inhabituel, une notification."], ["shield", "Gel de carte immédiat", "Un geste pour bloquer, un geste pour rouvrir."]].map(([i, t, d]) => `<li data-reveal>${ic(i)}<h3>${t}</h3><p>${d}</p></li>`).join("")}</ul></div></section>`),
    sec(`<section class="lg-rsec pk-bleed"><div class="lg-wrap"><div class="lg-sechead lg-sechead--row" data-reveal><div><p class="lg-eyebrow">Ressources</p><h2 class="lg-h2">Apprendre sans jargon.</h2></div><a class="lg-more" href="/ressources">Toutes les ressources${ic("arrow", "lg-ic lg-ic--s")}</a></div>
    <div class="lg-rgrid">${[["Guide", "Comprendre un taux annuel et un taux mensuel", "6 min"], ["Analyse", "Lire sa courbe de dépenses sans se décourager", "5 min"], ["Produit", "Pourquoi des cartes à numéro jetable", "4 min"]].map(([t, h, m]) => `<a class="lg-rcard" href="/ressources" data-reveal><span class="lg-tag">${t}</span><h3>${h}</h3><span class="lg-n lg-muted">${m} de lecture</span></a>`).join("")}</div></div></section>`),
    cta("Une question sur cette démonstration ?", "Le site est un exemple de thème : écrivez-nous pour en savoir plus."),
    sec(footer(c)),
  ];
};

// ---------- PRODUITS ----------
const produits = (c) => [
  sec(header(c)), pagehead("produits", "Comptes, cartes<br>et <em>épargne</em>", "Six produits imaginaires pour montrer comment une interface financière peut rester claire, du plus simple au plus complet.", ["3 comptes", "2 cartes", "1 coffre d'épargne"]),
  sec(`<section class="lg-prod lg-prod--page pk-bleed"><div class="lg-wrap"><div class="lg-toolbar" data-reveal><div class="lg-tabs" role="tablist" aria-label="Filtrer les produits" data-filter><a href="#tous" class="is-on" data-f="tous" role="tab">Tous</a><a href="#compte" data-f="compte" role="tab">Comptes</a><a href="#carte" data-f="carte" role="tab">Cartes</a><a href="#epargne" data-f="epargne" role="tab">Épargne</a></div>
    <div class="lg-tabs lg-tabs--s" role="group" aria-label="Période de facturation" data-bill><a href="#mensuel" class="is-on" data-b="m">Mensuel</a><a href="#annuel" data-b="y">Annuel</a></div></div>
    <div class="lg-pgrid lg-pgrid--all" data-filter-scope>${PROD.map(productCard).join("")}</div></div></section>`),
  sec(`<section class="lg-how pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Parcours type</p><h2 class="lg-h2">De l'ouverture au premier objectif, en quatre étapes.</h2></div>
    <ol class="lg-steps">${[["01", "Créer son profil", "Quelques informations de démonstration, aucune pièce demandée."], ["02", "Choisir un compte", "Essentiel, Plus ou Pro : on peut changer à tout moment."], ["03", "Ajouter une carte", "Virtuelle tout de suite, physique si besoin."], ["04", "Fixer un objectif", "Un montant, une date, une courbe à suivre."]].map(([n, t, d]) => `<li data-reveal><b class="lg-n">${n}</b><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`),
  cta("Comparez les offres côte à côte.", "Le tableau des tarifs détaille chaque ligne.", "Voir les tarifs", "/tarifs"), sec(footer(c)),
];

// ---------- TARIFS ----------
const rows = [
  ["Frais de tenue de compte", ["0 €", "4,90 €", "12,90 €"], ["0 €", "49 €", "129 €"]],
  ["Carte virtuelle", ["Incluse", "Incluse", "Incluse"]],
  ["Carte physique", ["En option", "Incluse", "Incluse"]],
  ["Sous-comptes", ["2", "Illimités", "Illimités"]],
  ["Objectifs d'épargne", ["1", "10", "Illimités"]],
  ["Cartes d'équipe", ["Non", "Non", "Jusqu'à 10"]],
  ["Export comptable", ["Non", "Mensuel", "Continu"]],
  ["Alertes personnalisées", ["3", "20", "Illimitées"]],
  ["Support", ["Messagerie", "Messagerie", "Messagerie prioritaire"]],
];
const tarifs = (c) => [
  sec(header(c)), pagehead("tarifs", "Des prix <em>lisibles</em>,<br>ligne par ligne", "Tous les montants ci-dessous sont fictifs et servent à illustrer un tableau comparatif.", ["Aucun frais caché imaginaire", "Annuel : 2 mois offerts (démo)"]),
  sec(`<section class="lg-cmp pk-bleed" data-bill-scope><div class="lg-wrap"><div class="lg-toolbar" data-reveal><p class="lg-muted">Prix de démonstration en euros, par compte.</p><div class="lg-tabs lg-tabs--s" role="group" aria-label="Période de facturation" data-bill><a href="#mensuel" class="is-on" data-b="m">Mensuel</a><a href="#annuel" data-b="y">Annuel</a></div></div>
  <table class="lg-table" data-reveal><caption class="lg-sr">Comparatif des comptes Essentiel, Plus et Pro</caption><thead><tr><th scope="col">Fonction</th><th scope="col">Essentiel</th><th scope="col" class="lg-hot">Plus <span class="lg-flag">le plus choisi</span></th><th scope="col">Pro</th></tr></thead><tbody>${rows.map(([l, a, y]) => `<tr><th scope="row">${l}</th>${a.map((v, i) => `<td data-label="${["Essentiel", "Plus", "Pro"][i]}"${i === 1 ? ' class="lg-hot"' : ""}>${y ? `<b class="lg-n"><span class="lg-m">${v}</span><span class="lg-y">${y[i]}</span></b>` : v}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <p class="lg-note" data-reveal>Ces tarifs n'existent pas : ils servent uniquement à montrer le composant. Pour toute question sur la mise en place de ce thème, utilisez le formulaire de contact.</p></div></section>`),
  sec(`<section class="lg-faq pk-bleed"><div class="lg-wrap lg-faq-in"><div data-reveal><p class="lg-eyebrow">Questions</p><h2 class="lg-h2">Ce que l'on demande souvent.</h2></div><div>${[["Les frais sont-ils réels ?", "Non. Kalmé est une banque fictive : aucun montant n'est facturé ni prélevé."], ["Puis-je changer d'offre ?", "Dans cette démonstration, le changement est simplement décrit : il se ferait à tout moment, sans pénalité."], ["Où voir l'effet d'un taux ?", "Dans le simulateur, qui recalcule la courbe à chaque modification."], ["Un agrément est-il affiché ?", "Aucun : la démonstration n'en revendique pas et n'en fait pas apparaître de faux."]].map(([q, a]) => `<details data-reveal><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>`),
  cta("Chiffrez un projet.", "Le simulateur calcule une épargne ou un prêt avec des taux de démonstration.", "Ouvrir le simulateur", "/simulateur"), sec(footer(c)),
];

// ---------- SÉCURITÉ ----------
const securite = (c) => [
  sec(header(c)), pagehead("securite", "La sécurité,<br><em>couche par couche</em>", "Un schéma pour comprendre comment une néobanque protège un compte. Description pédagogique, sans aucune revendication de certification.", ["Défense en profondeur", "Contrôles visibles"]),
  sec(`<section class="lg-lay pk-bleed"><div class="lg-wrap lg-lay-in"><figure class="lg-rings" data-reveal><svg viewBox="0 0 320 320" role="img" aria-label="Schéma en anneaux : données au centre, puis chiffrement, authentification, surveillance et appareil"><circle cx="160" cy="160" r="150" fill="none" stroke="#1d3631" stroke-width="1.500"/><circle cx="160" cy="160" r="120" fill="#0c1a17" stroke="#2c4a43"/><circle cx="160" cy="160" r="90" fill="#0f2420" stroke="#2c4a43"/><circle cx="160" cy="160" r="60" fill="#133029" stroke="#2a8f6e"/><circle cx="160" cy="160" r="30" fill="#3df0b0"/><path d="M148 160l8 8 16-17" stroke="#06100e" stroke-width="4.500" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle class="lg-orbit" cx="160" cy="10" r="6" fill="#ffb454"/><circle cx="160" cy="40" r="4" fill="#3df0b0"/><circle cx="160" cy="70" r="4" fill="#3df0b0"/><circle cx="160" cy="100" r="4" fill="#3df0b0"/></svg><figcaption>Du centre vers l'extérieur : vos données, le chiffrement, l'authentification, la surveillance, l'appareil.</figcaption></figure>
    <ol class="lg-layers">${[["1", "Vos données", "Le cœur : solde, opérations, identité."], ["2", "Chiffrement", "Les échanges et le stockage sont chiffrés (principe illustré)."], ["3", "Authentification", "Double validation pour les opérations sensibles."], ["4", "Surveillance", "Des règles repèrent les écarts : montant, lieu, rythme."], ["5", "Appareil", "Appareils de confiance, verrouillage, gel de carte."]].map(([n, t, d]) => `<li data-reveal><b class="lg-n">${n}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="lg-ctls pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Tableau de contrôles</p><h2 class="lg-h2">Ce qu'une page de sécurité devrait montrer.</h2></div>
    <div class="lg-ctl-g">${[["Double validation", "Actif par défaut", "ok"], ["Gel de carte", "Instantané", "ok"], ["Alertes de connexion", "À configurer", "wa"], ["Appareils connectés", "3 appareils", "ok"], ["Plafonds de paiement", "Réglables", "ok"], ["Historique des accès", "90 jours", "ok"]].map(([t, v, s]) => `<div class="lg-ctl-i" data-reveal><span class="lg-st lg-st--${s}"></span><b>${t}</b><span class="lg-n">${v}</span></div>`).join("")}</div>
    <p class="lg-note" data-reveal>Valeurs d'exemple. Kalmé ne détient aucun agrément et ne protège aucun dépôt réel ; une vraie institution afficherait ici ses références réglementaires vérifiables.</p></div></section>`),
  sec(`<section class="lg-tips pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Réflexes</p><h2 class="lg-h2">Six gestes qui protègent vraiment.</h2></div><ul class="lg-secu-g lg-secu-g--3">${[["lock", "Mot de passe unique", "Un mot de passe différent par service."], ["key", "Gestionnaire de mots de passe", "Il génère et retient à votre place."], ["bell", "Alertes activées", "Ne désactivez pas les notifications de paiement."], ["globe", "Réseaux publics", "Évitez les opérations sensibles sur un réseau ouvert."], ["shield", "Faux messages", "Aucune banque ne demande votre code par message."], ["card", "Cartes jetables", "Un numéro jetable limite les dégâts d'une fuite."]].map(([i, t, d]) => `<li data-reveal>${ic(i)}<h3>${t}</h3><p>${d}</p></li>`).join("")}</ul></div></section>`),
  cta("Une question de sécurité ?", "Écrivez-nous : cette page est un exemple de contenu pour un thème.", "Nous écrire", "/contact"), sec(footer(c)),
];

// ---------- SIMULATEUR ----------
const slider = (key, label, unit, modes, cfg) => `<div class="lg-ctl" data-ctl="${key}" data-modes="${modes}" data-sav="${cfg.sav || "-"}" data-loan="${cfg.loan || "-"}" data-unit="${unit}"><div class="lg-ctl-h"><span class="lg-ctl-l">${label}</span><span class="lg-ctl-v lg-n" data-val>—</span></div>
  <div class="lg-ctl-r"><a class="lg-step" href="#moins" data-st="-1" aria-label="Diminuer : ${label}">−</a><div class="lg-slider" data-slider data-label="${label}"><div class="lg-sl-fill"></div><div class="lg-sl-thumb"></div></div><a class="lg-step" href="#plus" data-st="1" aria-label="Augmenter : ${label}">+</a></div></div>`;
const simulateur = (c) => {
  const ser = defSeries(); const sp = spark(ser, 600, 240, 8);
  return [
    sec(header(c)), pagehead("simulateur", "Simulez une <em>épargne</em><br>ou un <em>prêt</em>", "Réglez le montant, la durée et un taux de démonstration : la courbe et les résultats se recalculent en direct, dans votre navigateur.", ["Calcul local", "Aucune donnée envoyée", "Taux fictifs"]),
    sec(`<section class="lg-sim pk-bleed"><div class="lg-wrap"><div class="lg-simbox" data-sim data-reveal>
    <div class="lg-sim-l"><div class="lg-tabs lg-tabs--s lg-tabs--full" role="tablist" aria-label="Type de simulation" data-mode><a href="#epargne" class="is-on" data-m="sav" role="tab">Épargne</a><a href="#pret" data-m="loan" role="tab">Prêt</a></div>
      ${slider("amount", "Montant de départ", " €", "sav loan", { sav: "0,50000,500,5000,Capital de départ", loan: "1000,100000,500,15000,Montant emprunté" })}
      ${slider("monthly", "Versement mensuel", " €", "sav", { sav: "0,1500,25,200" })}
      ${slider("years", "Durée", " ans", "sav loan", { sav: "1,30,1,10", loan: "1,25,1,5" })}
      ${slider("rate", "Taux annuel de démonstration", " %", "sav loan", { sav: "0,6,0.1,2.5", loan: "0.5,10,0.1,4.5" })}
      <p class="lg-note lg-note--s">Les curseurs se règlent à la souris, au doigt ou au clavier (flèches, Début, Fin, Page haut / bas). Les taux sont fictifs.</p></div>
    <div class="lg-sim-r"><div class="lg-res"><div class="lg-res-main"><p class="lg-w-k" data-res-k>Capital estimé après 10 ans</p><p class="lg-res-big lg-n" aria-hidden="true" data-res-big>${fr(ser[ser.length - 1])} €</p></div>
      <dl class="lg-res-d"><div><dt data-res-a-k>Total versé</dt><dd class="lg-n" data-res-a>${fr(5000 + 200 * 120)} €</dd></div><div><dt data-res-b-k>Intérêts estimés</dt><dd class="lg-n lg-up" data-res-b>${fr(ser[ser.length - 1] - 5000 - 24000)} €</dd></div></dl></div>
      <div class="lg-chart" data-chart><svg viewBox="0 0 640 280" role="img" aria-label="Courbe de simulation, mise à jour en direct"><path d="${sp.area}" transform="translate(20 8)" fill="#3df0b0" opacity=".14"/><path d="${sp.line}" transform="translate(20 8)" fill="none" stroke="#3df0b0" stroke-width="2.500"/></svg><div class="lg-tip" aria-hidden="true"></div></div>
      <div class="lg-legend"><span><i class="lg-lg1"></i><span data-leg1>Capital cumulé</span></span><span><i class="lg-lg2"></i><span data-leg2>Total versé</span></span></div>
      <p class="lg-sr" role="status" aria-live="polite" data-res-sr>Avec 5 000 euros de départ et 200 euros par mois pendant 10 ans à 2,5 %, le capital estimé est de ${fr(ser[ser.length - 1])} euros.</p>
      <div class="lg-sum"><p class="lg-sum-t"><b>Résumé</b><span data-sum>Épargne : 5 000 € au départ, 200 € par mois, 10 ans, taux de démonstration 2,5 % → capital estimé ${fr(ser[ser.length - 1])} €.</span></p>
        <div class="lg-sum-a"><a class="lg-btn" href="/contact" data-sum-link>Envoyer ce résumé à l'équipe${ic("arrow", "lg-ic lg-ic--s")}</a><a class="lg-btn lg-btn--ghost" href="#copier" data-copy>Copier le résumé</a></div></div>
      <details class="lg-dt"><summary>Voir les valeurs année par année</summary><div class="lg-dt-b" data-table></div></details></div></div>
    <p class="lg-note" data-reveal>Simulation purement illustrative, calculée avec des intérêts composés mensuels. Elle ne constitue ni une offre, ni un conseil, ni un engagement. Aucun produit réel n'est proposé.</p></div></section>`),
    sec(`<section class="lg-how pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Comment lire le résultat</p><h2 class="lg-h2">Trois repères, rien de caché.</h2></div><ol class="lg-steps lg-steps--3">${[["01", "Courbe verte", "En épargne, le capital cumulé ; en prêt, le capital restant dû."], ["02", "Courbe ambre", "En épargne, ce que vous avez versé ; en prêt, les intérêts déjà payés."], ["03", "Écart", "La zone entre les deux est le travail du taux dans le temps."]].map(([n, t, d]) => `<li data-reveal><b class="lg-n">${n}</b><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`),
    sec(footer(c)),
  ];
};

// ---------- RESSOURCES ----------
const ART = [
  ["guide", "Guide", "Comprendre un taux annuel et un taux mensuel", "6 min", "Un taux annuel de 3 % ne s'applique pas d'un bloc : il est converti en un taux mensuel puis appliqué douze fois. C'est ce que fait le simulateur, et pourquoi la courbe s'incurve avec le temps."],
  ["analyse", "Analyse", "Lire sa courbe de dépenses sans se décourager", "5 min", "Une courbe en dents de scie est normale : loyer en début de mois, courses toutes les semaines. Regardez plutôt la moyenne mobile sur trente jours."],
  ["produit", "Produit", "Pourquoi des cartes à numéro jetable", "4 min", "Un numéro unique par achat limite l'impact d'une fuite : s'il est copié, il ne sert plus. C'est l'une des mesures les plus simples à expliquer."],
  ["guide", "Guide", "Fixer un objectif d'épargne réaliste", "7 min", "Divisez le montant par le nombre de mois : si la mensualité vous gêne, allongez la durée plutôt que d'abandonner."],
  ["analyse", "Analyse", "Épargner ou rembourser : comment arbitrer ?", "8 min", "Comparez le taux du prêt et celui de l'épargne. Un écart important penche vers le remboursement, sauf besoin de réserve."],
  ["produit", "Produit", "Nos règles pour des alertes utiles", "3 min", "Trop d'alertes tuent l'alerte : trois seuils bien choisis valent mieux que vingt notifications."],
];
const ressources = (c) => [
  sec(header(c)), pagehead("ressources", "Guides et <em>analyses</em>", "Des articles courts et fictifs pour montrer une page de ressources : filtres, extrait déroulant, glossaire.", ["6 articles", "3 rubriques"]),
  sec(`<section class="lg-art pk-bleed"><div class="lg-wrap"><article class="lg-feature" data-reveal><div class="lg-feature-v">${sparkSvg([2, 3, 2.500, 4, 5, 4.500, 6.500, 8, 9], "", 400, 200)}</div><div class="lg-feature-b"><span class="lg-tag">À la une · Guide</span><h2 class="lg-h2">Les intérêts composés, expliqués en une courbe</h2><p>Pourquoi les premières années comptent peu et les dernières beaucoup : une lecture visuelle, sans formule.</p><a class="lg-btn" href="/simulateur">Voir la courbe dans le simulateur${ic("arrow", "lg-ic lg-ic--s")}</a></div></article>
    <div class="lg-toolbar" data-reveal><div class="lg-tabs" role="tablist" aria-label="Filtrer les articles" data-filter><a href="#tous" class="is-on" data-f="tous" role="tab">Tous</a><a href="#guide" data-f="guide" role="tab">Guides</a><a href="#analyse" data-f="analyse" role="tab">Analyses</a><a href="#produit" data-f="produit" role="tab">Produit</a></div></div>
    <div class="lg-rgrid lg-rgrid--6" data-filter-scope>${ART.map(([k, tag, t, m, x]) => `<article class="lg-acard" data-item data-cat="${k}" data-reveal><span class="lg-tag">${tag}</span><h3>${t}</h3><span class="lg-n lg-muted">${m} de lecture</span><details><summary>Lire l'extrait</summary><p>${x}</p></details></article>`).join("")}</div></div></section>`),
  sec(`<section class="lg-gl pk-bleed"><div class="lg-wrap lg-faq-in"><div data-reveal><p class="lg-eyebrow">Glossaire</p><h2 class="lg-h2">Les mots, sans jargon.</h2></div><div>${[["Intérêts composés", "Les intérêts d'une période s'ajoutent au capital et produisent eux-mêmes des intérêts."], ["TAEG", "Taux annuel effectif global : le coût total d'un crédit rapporté à une année. Ici, tout est fictif."], ["Amortissement", "Remboursement progressif du capital : la part d'intérêts baisse, celle du capital monte."], ["Plafond", "Montant maximal autorisé sur une période, que vous pouvez régler."]].map(([q, a]) => `<details data-reveal><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>`),
  cta("Un sujet à traiter ?", "Proposez une idée de guide via le formulaire de contact."), sec(footer(c)),
];

// ---------- À PROPOS ----------
const apropos = (c) => [
  sec(header(c)), pagehead("a-propos", "Une banque <em>imaginaire</em>,<br>un vrai souci du détail", "Kalmé est un exemple : une marque inventée pour montrer ce que la précision visuelle peut apporter à la finance.", ["Marque fictive", "Équipe imaginaire"]),
  sec(`<section class="lg-story pk-bleed"><div class="lg-wrap lg-story-in"><div data-reveal><p class="lg-eyebrow">Notre idée</p><h2 class="lg-h2">Montrer les chiffres avant de les vanter.</h2><p class="lg-lead">Dans une interface financière, la confiance vient de la clarté : alignements, chiffres tabulaires, états explicites. Kalmé rassemble ces principes dans un thème prêt à être habillé de vos propres contenus.</p></div>
    <ol class="lg-tl">${[["2019", "L'idée", "Un carnet de croquis de tableaux de bord."], ["2021", "Le prototype", "Premières courbes en direct et grille de cartes."], ["2023", "Le simulateur", "Un calcul d'épargne et de prêt entièrement local."], ["2025", "Le thème Ledger", "Une direction visuelle complète et documentée."]].map(([y, t, d]) => `<li data-reveal><b class="lg-n">${y}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="lg-vals pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Principes</p><h2 class="lg-h2">Quatre règles de conception.</h2></div><ul class="lg-secu-g">${[["chart", "Précision", "Chaque nombre s'aligne et se lit d'un coup d'œil."], ["shield", "Honnêteté", "Pas de promesse, pas de faux agrément, des mentions claires."], ["bolt", "Réactivité", "Les interactions répondent tout de suite."], ["users", "Accessibilité", "Clavier, contrastes, mouvement réduit respectés."]].map(([i, t, d]) => `<li data-reveal>${ic(i)}<h3>${t}</h3><p>${d}</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="lg-team pk-bleed"><div class="lg-wrap"><div class="lg-sechead" data-reveal><p class="lg-eyebrow">Équipe imaginaire</p><h2 class="lg-h2">Des personnages pour la démonstration.</h2></div><ul class="lg-team-g">${[["Inès Moreau", "Direction produit"], ["Karim Bellon", "Données et calculs"], ["Julie Fontaine", "Design d'interface"], ["Mathieu Roux", "Sécurité"]].map(([n, r]) => `<li data-reveal><span class="lg-av" aria-hidden="true">${n.split(" ").map((x) => x[0]).join("")}</span><b>${n}</b><span>${r}</span></li>`).join("")}</ul><p class="lg-note" data-reveal>Noms et fonctions inventés pour la démonstration.</p></div></section>`),
  cta("Parlons de votre projet.", "Utilisez le formulaire de contact pour toute question sur ce thème."), sec(footer(c)),
];

const contact = (c) => [sec(header(c)), pagehead("contact", "Écrivez-<em>nous</em>", "Une question sur la démonstration ou sur une simulation ? Le formulaire ci-dessous fonctionne réellement."),
  { type: "form", heading: "Envoyer un message", intro: "Indiquez votre demande. Si vous venez du simulateur, collez le résumé copié dans votre message." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("recherche", "Rechercher", "Une page, un guide, un mot du glossaire."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="lg-404 pk-bleed"><div class="lg-wrap"><p class="lg-crumb"><span>kalmé</span> / <b>erreur</b></p><div class="lg-h1" role="heading" aria-level="1"><span class="lg-n lg-big">404</span></div><p class="lg-sub">Cette page n'existe pas ou a changé d'adresse. Essayez la palette de commandes (Ctrl K) ou revenez à l'accueil.</p><div class="lg-actions"><a class="lg-btn lg-btn--lg" href="/">Retour à l'accueil</a><a class="lg-btn lg-btn--ghost lg-btn--lg" href="/recherche">Rechercher</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "ledger", name: "Ledger", version: "2.0.0", category: "tech", tags: ["sombre", "technique", "moderne"], siteType: "Néobanque et fintech (démonstration)", featured: true,
  concept: "Un tableau de bord de précision : nuit verte, chiffres tabulaires, palette de commandes et simulateur d'épargne ou de prêt qui se recalcule en direct.",
  description: "Néobanque fictive : hero à tableau de bord animé, navigation en palette de commandes (Ctrl K), cartes de données, tableau de tarifs et simulateur épargne / prêt avec graphique en direct. Mentions de démonstration partout.",
  brand: "Kalmé Ledger", modules: ["formulaires", "recherche"],
  dna: { header: "barre-palette-de-commandes", hero: "tableau-de-bord-anime-a-gauche", grid: "cartes-de-donnees-modulaires", motion: "courbes-en-direct-et-chiffres-tabulaires", shapes: "coins-nets-filets-lumineux", rhythm: "tabulaire-precis", signature: "simulateur-epargne-pret-graphique-direct" },
  tokens: {
    colors: { primary: "#3df0b0", secondary: "#0c1a17", accent: "#ffb454", background: "#06100e", surface: "#0c1a17", text: "#e6f4ef", muted: "#93aba3", success: "#3df0b0", warning: "#ffb454", error: "#ff7a6b" },
    fonts: { heading: "font.manrope", body: "font.public-sans", button: "font.jetbrains-mono", link: "font.public-sans" },
    radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 12 }, shadow: { card: "0 0 0 1px #1d3631", button: "none" }, border: { width: 1, color: "#1d3631" },
    type: { h1: { size: 64, weight: 800, lineHeight: 1.04 }, h2: { size: 40, weight: 800, lineHeight: 1.1 } },
  },
  options: [
    { key: "accent", label: "Couleur principale", type: "color", default: "#3df0b0" },
    { key: "alert", label: "Couleur d'alerte", type: "color", default: "#ffb454" },
    { key: "grid", label: "Quadrillage de fond", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "demo", label: "Bandeau « démonstration »", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "radius", label: "Angles des cartes", type: "range", default: 12, min: 0, max: 22, step: 2 },
  ],
  menu: MENU,
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "produits", name: "Produits", render: produits }, { key: "tarifs", name: "Tarifs", render: tarifs },
    { key: "securite", name: "Sécurité", render: securite }, { key: "simulateur", name: "Simulateur", render: simulateur }, { key: "ressources", name: "Ressources", render: ressources },
    { key: "apropos", name: "À propos", render: apropos }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
