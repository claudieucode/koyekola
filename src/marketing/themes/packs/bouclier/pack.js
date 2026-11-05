// Bouclier — cabinet de cybersécurité. Direction artistique : terminal et centre d'opérations de sécurité. Fond noir-vert, texte vert phosphore, ambre d'alerte,
// police monospace, grille de points et scanlines. Hero = terminal interactif ; navigation = barre de commandes (palette ouverte par / ou Ctrl+K) ;
// signature = tableau de menaces animé (flux, filtre par gravité, carte de points) + audit de maturité en 6 questions.
const { sec, form, esc, nav } = require("../kit");

// ----- carte de points (continents en ellipses, rendue en lignes pointillées) -----
const ELL = [[14, 8, 9, 5], [17, 13, 5, 3], [6, 5, 3, 2], [16, 4, 9, 3], [27, 3, 3, 2], [24, 19, 4, 6], [22, 16, 3, 2], [34, 7, 4, 3], [36, 4, 2, 2], [34, 15, 5, 6], [36, 11, 5, 3], [46, 7, 11, 4], [49, 12, 6, 3], [46, 14, 2, 3], [54, 15, 3, 2], [55, 21, 4, 2], [58, 9, 1, 2], [31, 6, 1, 1.5]];
const land = (x, y) => ELL.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
const mapSvg = () => {
  let out = "";
  for (let y = 0; y < 28; y++) {
    let x = 0;
    while (x < 64) {
      if (!land(x, y)) { x++; continue; }
      let e = x; while (e + 1 < 64 && land(e + 1, y)) e++;
      out += `<line x1="${x * 8 + 4}" y1="${y * 8 + 4}" x2="${e * 8 + 4}" y2="${y * 8 + 4}"/>`;
      x = e + 1;
    }
  }
  return `<svg class="bq-map" viewBox="0 0 512 224" role="img" aria-label="Carte de points du monde : les cercles marquent l'origine des événements de démonstration"><title>Origine des événements (démonstration)</title><g class="bq-land">${out}</g><g class="bq-pulses" data-pulses></g></svg>`;
};

const SEV = { crit: "CRIT", high: "HAUT", med: "MOY", info: "INFO" };
const EVENTS = [
  ["09:41:07", "crit", "Rançongiciel bloqué sur un poste", "198.51.100.23 → compta-02", "EU"],
  ["09:40:52", "high", "Force brute SSH (412 essais)", "203.0.113.77 → bastion-01", "AS"],
  ["09:40:31", "med", "Balayage de ports répété", "192.0.2.14 → dmz-web", "NA"],
  ["09:39:58", "high", "Exfiltration anormale vers l'extérieur", "10.20.4.18 → 198.51.100.9", "SA"],
  ["09:39:20", "info", "Certificat expirant sous 14 jours", "vpn.exemple.test", "EU"],
  ["09:38:44", "crit", "Compte administrateur : connexion improbable", "svc-backup → pays inhabituel", "AF"],
  ["09:38:03", "med", "Courriel d'hameçonnage signalé", "3 destinataires · quarantaine", "NA"],
  ["09:37:16", "info", "Correctif appliqué sur 38 serveurs", "fenêtre de maintenance", "OC"],
];
const evLi = (e) => `<li class="bq-ev" data-sev="${e[1]}"><time>${e[0]}</time><b class="bq-sev">${SEV[e[1]]}</b><span class="bq-ev-t">${esc(e[2])}</span><span class="bq-ev-m">${esc(e[3])} · ${e[4]}</span></li>`;
const filters = (counts) => `<div class="bq-filters" role="group" aria-label="Filtrer par gravité" data-fbar>${[["all", "tous"], ["crit", "critique"], ["high", "haute"], ["med", "moyenne"], ["info", "info"]].map(([v, l], i) => `<a href="#f-${v}" data-sev="${v}" class="${i ? "" : "is-on "}bq-f bq-f--${v}" aria-pressed="${i ? "false" : "true"}">${l}${counts ? ` <b data-n="${v}">0</b>` : ""}</a>`).join("")}</div>`;

const board = (full) => `<div class="bq-board${full ? " bq-board--full" : ""}" data-board data-max="${full ? 14 : 8}" data-fscope>
  <div class="bq-board-head"><p class="bq-ps"><span>soc@bouclier:~$</span> <b>tail -f flux.log</b></p><p class="bq-demo">DÉMONSTRATION · événements fictifs</p></div>
  <div class="bq-board-tools">${filters(true)}<a href="#pause" class="bq-pause" data-pause aria-pressed="false">pause</a></div>
  <div class="bq-board-body"><ol class="bq-feed" data-flist data-feed aria-label="Flux d'événements de démonstration">${EVENTS.map(evLi).join("")}</ol>
    <div class="bq-mapbox">${mapSvg()}<p class="bq-legend"><span class="s-crit">critique</span><span class="s-high">haute</span><span class="s-med">moyenne</span><span class="s-info">info</span></p></div></div>
  <p class="bq-sr" aria-live="polite" data-fstatus></p></div>`;

// ----- en-tête, pied, tête de page -----
const header = (c) => `<header class="bq-head pk-bleed"><div class="bq-scan" aria-hidden="true"></div>
  <div class="bq-status"><span class="bq-blink">●</span> SOC de démonstration · niveau de menace <b>ÉLEVÉ</b><span class="bq-st-r">UTC <span data-clock>09:41:00</span></span></div>
  <div class="bq-bar"><a class="bq-logo" href="/" aria-label="${esc(c.brand)} — accueil"><svg viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1 22 5v9c0 6-4 10-10 13C6 24 2 20 2 14V5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 14 3 3 5-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>bouclier<i>_</i></a>
    <a class="bq-cmd" href="#palette" data-palette aria-label="Ouvrir la barre de commandes"><span class="bq-cmd-p">$</span><span class="bq-cmd-ph">aller à une page ou une commande…</span><b class="bq-key">/</b><b class="bq-key bq-key2">Ctrl K</b></a>
    <a class="bq-cta" href="/audit">lancer l'audit</a>
    <details class="bq-ls"><summary aria-label="Liste des pages"><span>ls</span></summary><div class="bq-ls-list" role="navigation" aria-label="Pages du site">${c.menu.map(({ label, url }, i) => `<a href="${esc(url)}"><i>${String(i + 1).padStart(2, "0")}</i>${esc(label)}</a>`).join("")}<a href="/recherche"><i>${String(c.menu.length + 1).padStart(2, "0")}</i>Recherche</a></div></details></div></header>`;

const footer = (c) => `<footer class="bq-foot pk-bleed"><div class="bq-wrap bq-foot-in">
  <div><p class="bq-ps"><span>visiteur@bouclier:~$</span> <b>cat a-propos.txt</b></p><p class="bq-foot-lead">Cabinet de cybersécurité fictif : audit, supervision, réponse à incident.</p><p class="bq-dim">12 rue du Chiffre · 69002 Lyon (adresse fictive)</p></div>
  <div><h3 class="bq-fh">./pages</h3>${nav(c.menu, "bq-fl")}</div>
  <div><h3 class="bq-fh">./outils</h3><a class="bq-fl" href="/audit">Audit de maturité</a><a class="bq-fl" href="/menaces">Centre de menaces</a><a class="bq-fl" href="/recherche">Recherche</a></div>
  <div><h3 class="bq-fh">./contact</h3><a class="bq-fl" href="/contact">Formulaire</a><a class="bq-fl" href="mailto:contact@bouclier.example">contact@bouclier.example</a></div></div>
  <p class="bq-legal pk-bleed">© Bouclier — site de démonstration. Alertes, avis, adresses IP, produits et chiffres sont fictifs ; aucune analyse réelle n'est effectuée. <span class="bq-cursor">█</span></p></footer>`;

const pagehead = (cmd, title, sub) => sec(`<section class="bq-ph pk-bleed"><div class="bq-wrap"><p class="bq-ps" data-reveal><span>visiteur@bouclier:~$</span> <b>${esc(cmd)}</b></p><div class="bq-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="bq-lead" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);
const h2 = (n, t, sub) => `<div class="bq-sh" data-reveal><span class="bq-n">${n}</span><h2 class="bq-h2">${t}</h2>${sub ? `<p class="bq-sub">${sub}</p>` : ""}</div>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;

// ----- terminal -----
const helpLines = [["help", "liste des commandes"], ["scan", "simule un balayage de surface d'attaque"], ["audit", "lance l'audit de maturité (6 questions)"], ["status", "état des services de supervision"], ["menaces", "derniers événements du flux"], ["services", "catalogue des prestations"], ["contact", "joindre l'équipe"], ["cd &lt;page&gt;", "ouvre une page (ls pour la liste)"]];
const terminal = (boot, lines) => `<div class="bq-term" data-term data-boot="${esc(boot)}"><div class="bq-term-bar"><i></i><i></i><i></i><span>bouclier-shell 2.0 — session de démonstration</span></div>
  <div class="bq-term-out" data-term-out role="log" aria-live="polite" aria-label="Sortie du terminal">${lines}</div>
  <div class="bq-term-in" data-term-in><span class="bq-ps1">visiteur@bouclier:~$</span><span class="bq-fake" data-term-fake>saisie au clavier : JavaScript requis</span></div></div>`;
const chips = (list) => `<p class="bq-chips"><span>Essayez :</span>${list.map((x) => `<a href="#cmd-${x.replace(/\W+/g, "-")}" data-cmd="${x}">${x}</a>`).join("")}</p>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="bq-hero pk-bleed"><div class="bq-wrap bq-hero-in">
    <div class="bq-hero-copy"><p class="bq-kicker" data-reveal>// centre opérationnel de sécurité · démonstration</p>
      <div class="bq-h1 bq-h1--hero" role="heading" aria-level="1" data-reveal>On surveille.<br>On détecte.<br><em>On répond.</em></div>
      <p class="bq-lead" data-reveal>Bouclier protège les systèmes d'information des PME et des collectivités : audits, supervision continue et gestion de crise. Ce terminal est le vôtre : tapez une commande.</p>
      <div class="bq-actions" data-reveal><a class="bq-btn" href="/audit">Mesurer ma maturité ${arrow}</a><a class="bq-btn bq-btn--ghost" href="/menaces">Voir le flux de menaces</a></div></div>
    ${terminal("status", `<div class="bq-ln bq-dim">Session de démonstration — aucune donnée réelle n'est lue ni envoyée.</div><div class="bq-ln"><span class="bq-cmdln">$ help</span></div>${helpLines.map(([a, b]) => `<div class="bq-ln bq-help"><b>${a}</b><span>${b}</span></div>`).join("")}`)}
    ${chips(["help", "scan", "status", "menaces", "audit", "contact"])}</div></section>`),
  sec(`<section class="bq-stats pk-bleed"><ul class="bq-wrap bq-stats-in"><li data-reveal><b data-count="1842">1842</b><span>actifs surveillés <small>(démo)</small></span></li><li data-reveal><b data-count="14" data-suffix=" min">14 min</b><span>détection médiane <small>(démo)</small></span></li><li data-reveal><b data-count="96" data-suffix=" %">96 %</b><span>alertes qualifiées <small>(démo)</small></span></li><li data-reveal><b data-count="24" data-suffix="/7">24/7</b><span>astreinte d'analystes <small>(démo)</small></span></li></ul></section>`),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap">${h2("01", "Menaces en direct", "Un aperçu du flux que nos analystes voient défiler. Filtrez par gravité.")}${board(false)}<p class="bq-more"><a href="/menaces">Ouvrir le centre de menaces ${arrow}</a></p></div></section>`),
  sec(`<section class="bq-sec bq-sec--alt pk-bleed"><div class="bq-wrap">${h2("02", "Services", "Six prestations, du diagnostic à la gestion de crise.")}
    <div class="bq-files" role="list">${[["drwx", "audit/", "Audit & test d'intrusion", "Cartographier ce qui est exposé et le prouver par l'attaque contrôlée."], ["drwx", "soc/", "Supervision continue", "Journaux centralisés, détection et analystes d'astreinte."], ["drwx", "reponse/", "Réponse à incident", "Contenir, enquêter, remettre en service, tirer les leçons."], ["drwx", "conformite/", "Conformité", "ISO 27001, RGPD, NIS2 : un plan réaliste, pas un classeur."], ["drwx", "humain/", "Sensibilisation", "Ateliers courts et hameçonnage simulé, sans piège humiliant."], ["drwx", "cloud/", "Cloud & identités", "Droits, secrets, configuration : le plus gros risque est souvent là."]].map(([p, f, t, d]) => `<a class="bq-file" role="listitem" href="/services" data-reveal><span class="bq-perm">${p}</span><b class="bq-fname">${f}</b><span class="bq-ftitle">${t}</span><span class="bq-fdesc">${d}</span></a>`).join("")}</div></div></section>`),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap">${h2("03", "Réponse en quatre temps")}
    <ol class="bq-pipe">${[["detecter", "Une alerte est qualifiée en quelques minutes : vraie, fausse, ou à surveiller."], ["contenir", "On isole la machine ou le compte touché pour stopper la propagation."], ["eradiquer", "On retire la cause : accès volé, faille, logiciel malveillant."], ["rétablir", "Retour à la normale, puis rapport clair et mesures pour la suite."]].map(([t, d], i) => `<li data-reveal><span class="bq-pn">0${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="bq-sec bq-sec--alt pk-bleed"><div class="bq-wrap">${h2("04", "Avis de sécurité", "Les dernières lignes du journal public. Les identifiants sont fictifs.")}
    <ol class="bq-log">${[["2026-11-03", "crit", "BQ-2026-014", "Passerelle VPN Hexa : contournement d'authentification"], ["2026-10-29", "high", "BQ-2026-013", "Messagerie Postal : exécution de code via une pièce jointe"], ["2026-10-22", "med", "BQ-2026-012", "Imprimantes réseau : mot de passe d'usine à changer"], ["2026-10-15", "info", "BQ-2026-011", "Bonnes pratiques : renouveler les clés d'accès cloud"]].map(([d, s, id, t]) => `<li data-sev="${s}" data-reveal><a href="/ressources"><time>${d}</time><b class="bq-sev">${SEV[s]}</b><span class="bq-id">${id}</span><span class="bq-lt">${t}</span></a></li>`).join("")}</ol><p class="bq-more"><a href="/ressources">Tous les avis ${arrow}</a></p></div></section>`),
  sec(`<section class="bq-cta-band pk-bleed"><div class="bq-wrap bq-cta-in"><div><p class="bq-ps" data-reveal><span>visiteur@bouclier:~$</span> <b>audit --maturite</b></p><h2 class="bq-h2 bq-h2--big" data-reveal>Où en êtes-vous<br>vraiment ?</h2><p class="bq-lead" data-reveal>Six questions, deux minutes, un score sur 100 et la formule d'audit qui vous convient. Rien n'est enregistré.</p></div><a class="bq-btn bq-btn--lg" href="/audit" data-reveal>Lancer le questionnaire ${arrow}</a></div></section>`),
  sec(footer(c)),
];

// ----- services : mise en page « page de manuel » -----
const SERVICES = [
  ["AUDIT", "Audit de sécurité et test d'intrusion", "audit [--perimetre] [--profondeur=standard]", "Nous inventorions vos systèmes exposés, puis nous tentons de les compromettre avec votre accord écrit, dans un cadre défini. Vous obtenez des preuves, pas des suppositions.", ["Cartographie des actifs exposés", "Tests techniques (web, réseau, postes)", "Rapport priorisé et plan d'action sur 30 jours"], "1 à 5 jours selon le périmètre"],
  ["SOC", "Supervision continue (SOC)", "soc --sources=journaux,postes,cloud", "Vos journaux sont centralisés et surveillés par des analystes. Chaque alerte est qualifiée avant de vous être transmise : peu de bruit, un seul interlocuteur.", ["Collecte et corrélation des journaux", "Qualification des alertes et astreinte", "Rapport mensuel et revue trimestrielle"], "Abonnement mensuel"],
  ["IR", "Réponse à incident", "ir --urgence", "En cas d'attaque, une équipe prend la main : contenir, comprendre, remettre en service. Un plan préparé à l'avance divise le temps perdu.", ["Cellule de crise et conduite des opérations", "Analyse technique et préservation des preuves", "Retour d'expérience et plan de reprise"], "Intervention à la demande ou sous contrat"],
  ["GRC", "Conformité et gouvernance", "grc --referentiel=iso27001,nis2,rgpd", "Transformer un référentiel en actions concrètes : politique, registre des risques, mesures proportionnées à la taille de l'organisation.", ["Analyse d'écart et feuille de route", "Politiques et procédures utilisables", "Préparation aux audits de certification"], "Mission de 2 à 8 semaines"],
  ["HUM", "Sensibilisation des équipes", "hum --format=atelier,simulation", "Le maillon humain est aussi le meilleur capteur. Ateliers courts, exercices d'hameçonnage simulés et retours bienveillants.", ["Ateliers de 45 minutes", "Campagnes d'hameçonnage simulé", "Indicateurs de progression par équipe"], "Programme annuel"],
  ["CLD", "Sécurité cloud et identités", "cld --audit-droits --secrets", "Revue des droits, des secrets, des sauvegardes et de la configuration de vos services cloud, là où se concentrent les erreurs coûteuses.", ["Revue des identités et des droits", "Contrôle des configurations", "Plan de sauvegarde et de restauration"], "Mission de 1 à 3 semaines"],
];
const services = (c) => [sec(header(c)), pagehead("man bouclier-services", "Services<br><em>(section 1)</em>", "Chaque prestation se lit comme une page de manuel : nom, synopsis, description, livrables."),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap bq-man-in"><aside class="bq-index" aria-label="Sommaire des services"><p class="bq-ps"><span>$</span> <b>ls services/</b></p>${SERVICES.map(([k, t], i) => `<a href="#s-${k.toLowerCase()}" data-goto="${k}"><i>${String(i + 1).padStart(2, "0")}</i>${t}</a>`).join("")}</aside>
    <div class="bq-mans">${SERVICES.map(([k, t, syn, desc, liv, form_]) => `<article class="bq-man" data-sec="${k}" data-reveal><header class="bq-man-h"><span>${k}(1)</span><span>BOUCLIER</span><span>${k}(1)</span></header>
      <h2 class="bq-man-t">${t}</h2>
      <dl><dt>NOM</dt><dd>${k.toLowerCase()} — ${t.toLowerCase()}</dd><dt>SYNOPSIS</dt><dd><span class="bq-syn">${syn}</span></dd><dt>DESCRIPTION</dt><dd>${desc}</dd><dt>LIVRABLES</dt><dd><ul>${liv.map((x) => `<li>${x}</li>`).join("")}</ul></dd><dt>FORMAT</dt><dd>${form_}</dd></dl></article>`).join("")}</div></div></section>`),
  sec(`<section class="bq-sec bq-sec--alt pk-bleed"><div class="bq-wrap">${h2("A", "Quatre formules d'audit", "Le questionnaire d'audit vous oriente vers l'une d'elles. Les durées sont indicatives.")}
    <table class="bq-table" data-reveal><caption class="bq-sr">Comparatif des formules d'audit</caption><thead><tr><th>Formule</th><th>Pour qui</th><th>Contenu</th><th>Durée</th></tr></thead><tbody>
    <tr><th data-l="Formule">Éclair</th><td data-l="Pour qui">Premiers pas, petite structure</td><td data-l="Contenu">Revue de configuration, 10 points vitaux, plan sur 30 jours</td><td data-l="Durée">1 jour</td></tr>
    <tr><th data-l="Formule">Standard</th><td data-l="Pour qui">PME avec un informaticien</td><td data-l="Contenu">Audit technique et organisationnel, rapport priorisé</td><td data-l="Durée">3 à 5 jours</td></tr>
    <tr><th data-l="Formule">Approfondi</th><td data-l="Pour qui">Organisation déjà structurée</td><td data-l="Contenu">Test d'intrusion, revue des identités, exercice de crise</td><td data-l="Durée">2 à 3 semaines</td></tr>
    <tr><th data-l="Formule">Continu</th><td data-l="Pour qui">Maturité élevée, enjeux forts</td><td data-l="Contenu">Supervision, scénarios d'attaque réguliers, comité trimestriel</td><td data-l="Durée">Sur l'année</td></tr></tbody></table>
    <p class="bq-more"><a href="/audit">Trouver ma formule ${arrow}</a></p></div></section>`),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap bq-faq">${h2("B", "Questions fréquentes")}<div>
    <details data-reveal><summary>Faut-il un accord avant un test d'intrusion ?</summary><p>Oui, toujours : périmètre, dates et règles sont signés avant la moindre manipulation.</p></details>
    <details data-reveal><summary>Intervenez-vous pendant une attaque en cours ?</summary><p>C'est la mission de la réponse à incident. Le premier échange se fait via le formulaire de contact de cette démonstration.</p></details>
    <details data-reveal><summary>Mes données quittent-elles mon entreprise ?</summary><p>Par défaut non : nous travaillons sur des copies de journaux et des accès temporaires, détaillés avant la mission.</p></details></div></div></section>`),
  sec(footer(c))];

// ----- menaces -----
const menaces = (c) => [sec(header(c)), pagehead("tail -f /var/log/flux", "Centre<br>de menaces", "Un flux d'événements de démonstration : filtrez par gravité, mettez en pause, regardez d'où viennent les tentatives."),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap">${board(true)}</div></section>`),
  sec(`<section class="bq-sec bq-sec--alt pk-bleed"><div class="bq-wrap bq-split"><div>${h2("A", "Techniques observées", "Répartition fictive sur 24 h.")}<ul class="bq-bars">${[["Hameçonnage", 78], ["Force brute", 61], ["Balayage de ports", 52], ["Rançongiciel", 24], ["Exfiltration", 17]].map(([l, v]) => `<li data-reveal><span>${l}</span><i data-w="${v}"><u></u></i><b>${v} %</b></li>`).join("")}</ul></div>
    <div>${h2("B", "Lire le flux", "Quatre niveaux de gravité.")}<dl class="bq-defs" data-reveal><dt class="s-crit">CRIT</dt><dd>Compromission probable : intervention immédiate.</dd><dt class="s-high">HAUT</dt><dd>Activité hostile confirmée, à traiter dans l'heure.</dd><dt class="s-med">MOY</dt><dd>Comportement suspect à qualifier dans la journée.</dd><dt class="s-info">INFO</dt><dd>À savoir : maintenance, expiration, correctif.</dd></dl></div></div></section>`),
  sec(footer(c))];

// ----- audit -----
const Q = [
  ["Gouvernance", "Votre sécurité est-elle cadrée par une règle écrite et un responsable ?", ["Aucune règle, personne de désigné", "Des habitudes, mais rien d'écrit", "Une politique écrite et un responsable désigné", "Politique revue chaque année et suivie par la direction"]],
  ["Accès", "Comment protégez-vous les comptes des personnes et des administrateurs ?", ["Mots de passe simples, parfois partagés", "Mots de passe uniques avec un gestionnaire", "Double authentification sur la messagerie et l'administration", "Double authentification partout et revue des droits chaque trimestre"]],
  ["Sauvegardes", "Où en sont vos sauvegardes ?", ["Occasionnelles, sur la même machine", "Régulières, mais jamais testées", "Régulières avec une copie hors ligne ou externe", "Chiffrées, hors ligne, restauration testée chaque trimestre"]],
  ["Correctifs", "Comment gérez-vous les mises à jour ?", ["Quand on y pense", "Chaque mois sur les postes seulement", "Chaque mois, postes et serveurs, avec un inventaire", "Inventaire complet et correctifs critiques sous 72 heures"]],
  ["Détection", "Si une attaque démarrait cette nuit, la verriez-vous ?", ["Non, on le saurait quand tout s'arrête", "Un antivirus seulement", "Des journaux centralisés, consultés après coup", "Supervision continue, alertes et astreinte"]],
  ["Humain", "Les équipes sont-elles sensibilisées aux pièges courants ?", ["Jamais", "Une présentation à l'arrivée", "Une session par an", "Régulièrement, avec exercices d'hameçonnage simulé"]],
];
const audit = (c) => [sec(header(c)), pagehead("./audit --maturite", "Audit de<br>maturité", "Six questions, un score sur 100, la formule d'audit conseillée et un récapitulatif à nous envoyer. Le calcul se fait dans votre navigateur ; rien n'est enregistré."),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap"><div class="bq-quiz" data-quiz>
    <div class="bq-quiz-head"><span data-qstep>6 questions</span><span class="bq-prog"><i data-qbar></i></span></div>
    <p class="bq-jsnote">Le calcul du score nécessite JavaScript. Les questions sont listées ci-dessous.</p>
    ${Q.map(([d, t, o], i) => `<div class="bq-q" data-q data-d="${d}"><p class="bq-q-n">question ${i + 1}/6 · ${d}</p><p class="bq-q-t">${t}</p><div class="bq-opts" role="radiogroup" aria-label="${esc(t)}">${o.map((x, j) => `<a href="#q${i + 1}-${j + 1}" role="radio" aria-checked="false" data-v="${j}"><i>${"abcd"[j]}</i><span>${x}</span></a>`).join("")}</div></div>`).join("")}
    <div class="bq-qnav"><a href="#precedent" data-qprev>← précédent</a><a href="#suivant" data-qnext>suivant →</a></div>
    <div class="bq-result" data-result hidden></div></div></div></section>`),
  sec(`<section class="bq-sec bq-sec--alt pk-bleed"><div class="bq-wrap">${h2("A", "Ce que mesure le score", "Six domaines, notés de 0 à 3, ramenés à 100.")}
    <ul class="bq-doms">${Q.map(([d], i) => `<li data-reveal><span class="bq-pn">0${i + 1}</span><b>${d}</b></li>`).join("")}</ul>
    <p class="bq-note" data-reveal>Outil de démonstration : un score indicatif n'est pas un audit. Seule une revue de vos systèmes donne un état des lieux fiable.</p></div></section>`),
  sec(footer(c))];

// ----- ressources / avis -----
const ADV = [
  ["2026-11-03", "crit", "BQ-2026-014", "Passerelle VPN Hexa 4.2 : contournement d'authentification", "Un attaquant peut ouvrir une session sans identifiants valides.", "Mettre à jour vers 4.2.3 ; en attendant, restreindre l'accès à l'interface d'administration.", "Produit fictif"],
  ["2026-10-29", "high", "BQ-2026-013", "Messagerie Postal : exécution de code via une pièce jointe", "L'ouverture d'un fichier piégé peut lancer du code sur le poste.", "Appliquer le correctif de novembre ; bloquer les macros reçues par courriel.", "Produit fictif"],
  ["2026-10-22", "med", "BQ-2026-012", "Imprimantes réseau : mot de passe d'usine non modifié", "Les interfaces d'administration restent ouvertes avec le compte par défaut.", "Changer les mots de passe, isoler les imprimantes sur un réseau dédié.", "Famille fictive"],
  ["2026-10-15", "info", "BQ-2026-011", "Rotation des clés d'accès cloud", "Des clés anciennes jamais renouvelées augmentent l'impact d'une fuite.", "Renouveler les clés tous les 90 jours et supprimer celles qui ne servent plus.", "Bonne pratique"],
  ["2026-10-08", "high", "BQ-2026-010", "Serveur de fichiers Nuage-FS : élévation de privilèges", "Un utilisateur ordinaire peut obtenir des droits d'administration.", "Installer la version 7.1.2 et auditer les comptes créés ces 30 derniers jours.", "Produit fictif"],
  ["2026-09-30", "med", "BQ-2026-009", "Sites web : en-têtes de sécurité absents", "Sans ces en-têtes, certaines attaques du navigateur sont facilitées.", "Activer la politique de contenu et les cookies sécurisés.", "Bonne pratique"],
  ["2026-09-21", "crit", "BQ-2026-008", "Outil de sauvegarde Coffre : suppression des copies à distance", "Un accès administrateur volé peut effacer toutes les sauvegardes.", "Activer l'immutabilité des copies et la validation à deux personnes.", "Produit fictif"],
];
const ressources = (c) => [sec(header(c)), pagehead("cat avis/*.log", "Avis de<br>sécurité", "Le journal public de Bouclier : alertes à connaître, correctifs et guides. Tout est fictif ; les identifiants et les produits n'existent pas."),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap" data-fscope><div class="bq-board-tools">${filters(false)}<span class="bq-count" data-fcount>7 avis</span></div>
    <ol class="bq-adv" data-flist aria-label="Avis de sécurité de démonstration">${ADV.map(([d, s, id, t, imp, fix, ref]) => `<li data-sev="${s}"><details><summary><time>${d}</time><b class="bq-sev">${SEV[s]}</b><span class="bq-id">${id}</span><span class="bq-lt">${t}</span></summary>
      <dl class="bq-advd"><dt>Impact</dt><dd>${imp}</dd><dt>Que faire</dt><dd>${fix}</dd><dt>Référence</dt><dd>${ref} — démonstration</dd></dl></details></li>`).join("")}</ol><p class="bq-sr" aria-live="polite" data-fstatus></p></div></section>`),
  sec(`<section class="bq-sec bq-sec--alt pk-bleed"><div class="bq-wrap">${h2("A", "Guides pratiques", "Quatre lectures courtes pour commencer.")}
    <div class="bq-guides">${[["guide-01.md", "Les dix réflexes qui évitent 80 % des incidents", "8 min"], ["guide-02.md", "Préparer une sauvegarde qui survit à un rançongiciel", "12 min"], ["guide-03.md", "Reconnaître un courriel d'hameçonnage", "5 min"], ["guide-04.md", "Que faire dans la première heure d'une attaque", "9 min"]].map(([f, t, m]) => `<a class="bq-guide" href="/contact" data-reveal><span class="bq-gf">${f}</span><b>${t}</b><small>${m} de lecture · demandez-le par le formulaire</small></a>`).join("")}</div></div></section>`),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap">${h2("B", "Glossaire")}<dl class="bq-gloss" data-reveal><dt>Hameçonnage</dt><dd>Faux message qui pousse à donner un mot de passe ou à ouvrir un fichier piégé.</dd><dt>Rançongiciel</dt><dd>Logiciel qui chiffre vos fichiers et réclame de l'argent pour les rendre.</dd><dt>Double authentification</dt><dd>Une deuxième preuve (code, clé) en plus du mot de passe.</dd><dt>Test d'intrusion</dt><dd>Attaque simulée, autorisée et encadrée, pour trouver les failles avant les criminels.</dd></dl></div></section>`),
  sec(footer(c))];

// ----- contact, recherche, introuvable -----
const contact = (c) => [sec(header(c)), pagehead("mail --to=equipe", "Contact", "Une question, un besoin d'audit ou un incident à signaler ? Écrivez-nous. Site de démonstration : le formulaire est réel, l'équipe est fictive."),
  sec(`<section class="bq-sec pk-bleed"><div class="bq-wrap bq-chan">${[["Question ou devis", "Décrivez votre structure et votre besoin ; nous répondons sous deux jours ouvrés."], ["Incident en cours", "Indiquez « urgence » dans l'objet, ce qui est touché et depuis quand. Ne redémarrez pas les machines."], ["Presse et partenariats", "Précisez le média ou l'organisation et la date limite."]].map(([t, d], i) => `<div class="bq-chan-c" data-reveal><span class="bq-pn">0${i + 1}</span><b>${t}</b><p>${d}</p></div>`).join("")}</div></section>`),
  { type: "form", heading: "Écrire à l'équipe", intro: "Dites-nous qui vous êtes et ce dont vous avez besoin. Si vous venez de l'audit, collez votre récapitulatif dans le message." },
  sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("grep -ri \"…\" site/", "Recherche", "Un service, un avis, un guide."), { type: "layout", children: [{ type: "search", props: { placeholder: "grep : tapez votre recherche…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="bq-ph bq-404 pk-bleed"><div class="bq-wrap"><div class="bq-h1 bq-h1--err" role="heading" aria-level="1">Erreur 404</div>
  ${terminal("cd /", `<div class="bq-ln bq-err">bash: cette page n'existe pas ou a changé d'adresse : No such file or directory</div><div class="bq-ln bq-dim">Astuce : tapez <b>ls</b> pour lister les pages, <b>cd accueil</b> pour revenir, ou touchez une suggestion.</div>`)}
  ${chips(["ls", "cd accueil", "help"])}<p class="bq-actions"><a class="bq-btn" href="/">Retour à l'accueil ${arrow}</a><a class="bq-btn bq-btn--ghost" href="/recherche">Rechercher</a></p></div></section>`), sec(footer(c))];

module.exports = {
  key: "bouclier", name: "Bouclier", version: "2.0.0", category: "tech", tags: ["sombre", "technique", "experimental"], siteType: "Cabinet de cybersécurité", featured: false,
  concept: "Un centre d'opérations de sécurité en mode terminal : on tape des commandes dans le hero, on navigue à la palette, on regarde défiler les alertes et on calcule sa maturité.",
  description: "Cybersécurité : fond noir-vert, texte phosphore et ambre d'alerte, terminal interactif, barre de commandes, flux de menaces avec carte de points et audit de maturité en six questions.",
  brand: "Bouclier Cybersécurité", modules: ["formulaires", "recherche"],
  dna: {
    header: "invite-de-commande-en-haut-palette-slash-qui-filtre-les-pages",
    hero: "terminal-interactif-a-saisie-clavier-et-commandes",
    grid: "flux-d-alertes-en-lignes-de-journal",
    motion: "frappe-au-clavier-flux-qui-defile-et-pulsations-de-carte",
    shapes: "coins-carres-grille-de-points-scanlines-et-curseur-bloc",
    rhythm: "sessions-de-terminal-numerotees-par-invites-de-section",
    signature: "tableau-de-menaces-en-flux-filtre-par-gravite-carte-de-points-et-audit-de-maturite",
  },
  tokens: {
    colors: { primary: "#5cff7a", secondary: "#07140d", accent: "#ffb020", background: "#020a05", surface: "#08150d", text: "#b8f5c6", muted: "#79b38c", success: "#5cff7a", warning: "#ffb020", error: "#ff6a55" },
    fonts: { heading: "font.vt323", body: "font.fira-code", button: "font.fira-code", link: "font.fira-code" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#1d5233" },
    type: { h1: { size: 76, weight: 400, lineHeight: 0.95, transform: "none" }, h2: { size: 44, weight: 400, lineHeight: 1, transform: "none" } },
  },
  options: [
    { key: "phosphor", label: "Vert du texte", type: "color", default: "#5cff7a" },
    { key: "accent", label: "Ambre d'alerte", type: "color", default: "#ffb020" },
    { key: "scan", label: "Scanlines", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masquées"]] },
    { key: "dots", label: "Grille de points", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masquée"]] },
    { key: "glow", label: "Halo phosphore", type: "choice", default: "on", choices: [["on", "Activé"], ["off", "Désactivé"]] },
  ],
  menu: [["Accueil", "/"], ["Services", "/services"], ["Menaces", "/menaces"], ["Audit", "/audit"], ["Ressources", "/ressources"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "services", name: "Services", render: services }, { key: "menaces", name: "Centre de menaces", render: menaces },
    { key: "audit", name: "Audit de maturité", render: audit }, { key: "ressources", name: "Avis de sécurité", render: ressources }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
