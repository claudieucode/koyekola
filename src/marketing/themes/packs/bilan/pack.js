// Bilan — cabinet d'expertise comptable. Direction artistique : le carnet de comptes. Fond blanc doux, vert-sauge profond, accent corail ; calendrier de l'année dont les échéances
// s'allument un mois à la fois, registre de services en lignes pointillées, cases à cocher dessinées, calendrier fiscal par profil et simulateur de charges / TVA / impôt.
const { sec, form, esc, nav } = require("../kit");

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const PROF = { micro: "Micro", sarl: "SARL", part: "Particulier" };
// [mois, jour, intitulé, profils, précision]  (dates indicatives, France ; à confirmer chaque année)
const EV = [
  [1, 31, "Déclaration du chiffre d'affaires du 4e trimestre", "micro", "Sur l'espace de l'URSSAF, si vous déclarez au trimestre."],
  [2, 20, "TVA de janvier", "sarl", "Pour les sociétés à la TVA mensuelle (régime réel normal) : date variable selon le dossier."],
  [3, 15, "Premier acompte d'impôt sur les sociétés", "sarl", "Acomptes dus si l'impôt de l'exercice précédent dépasse 3 000 €."],
  [4, 30, "Déclaration du chiffre d'affaires du 1er trimestre", "micro", "Même démarche que pour le trimestre précédent."],
  [5, 4, "Liasse fiscale et déclaration annuelle de TVA", "sarl", "Pour un exercice clos le 31 décembre : à déposer vers le 2e jour ouvré suivant le 1er mai."],
  [5, 28, "Déclaration de revenus (date limite)", "micro part", "La date exacte dépend du département et du mode de dépôt : vérifiez sur impots.gouv.fr."],
  [6, 15, "Deuxième acompte d'impôt sur les sociétés", "sarl", "Calculé sur la base de l'exercice précédent."],
  [6, 30, "Approbation des comptes en assemblée", "sarl", "Dans les six mois suivant la clôture de l'exercice."],
  [7, 31, "Déclaration du chiffre d'affaires du 2e trimestre", "micro", "Pensez à déclarer même un trimestre à zéro."],
  [9, 15, "Troisième acompte d'impôt sur les sociétés", "sarl", "Dernier versement avant la clôture."],
  [9, 15, "Solde de l'impôt sur le revenu", "part", "Si un solde est dû après la déclaration, il est prélevé à cette période."],
  [10, 15, "Taxe foncière", "part", "Paiement en ligne possible jusqu'à quelques jours après la date indiquée sur l'avis."],
  [10, 31, "Déclaration du chiffre d'affaires du 3e trimestre", "micro", "Dernier trimestre de l'année à venir."],
  [12, 15, "Quatrième acompte et cotisation foncière des entreprises", "micro sarl", "La CFE est à régler en ligne sur votre espace professionnel."],
  [12, 31, "Clôture de l'exercice et dons ou versements déductibles", "sarl part", "Dernier jour pour les opérations à rattacher à l'année."],
];
const pills = (p) => p.split(" ").map((k) => `<span class="bl-pill bl-pill--${k}">${PROF[k]}</span>`).join("");
const pad = (n) => String(n).padStart(2, "0");

const ICON = {
  logo: `<svg class="bl-logo-i" viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="4" width="26" height="32" rx="4" fill="#1f5b52"/><path d="M10 14h16M10 20h16M10 26h9" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/><circle cx="29" cy="28" r="9" fill="#e8694a"/><path d="m24.5 28 3 3 5-6" fill="none" stroke="#17302c" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tick: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  micro: `<svg class="bl-ico" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="18" width="48" height="32" rx="4" fill="#fff" stroke="#1f5b52" stroke-width="3"/><path d="M4 50h56l-4 6H8z" fill="#1f5b52"/><circle cx="32" cy="34" r="6" fill="#e8694a"/><path d="M22 18v-4h20v4" fill="none" stroke="#1f5b52" stroke-width="3"/></svg>`,
  sarl: `<svg class="bl-ico" viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="8" width="26" height="48" rx="3" fill="#fff" stroke="#1f5b52" stroke-width="3"/><rect x="38" y="24" width="16" height="32" rx="3" fill="#1f5b52"/><path d="M19 18h4m4 0h4M19 28h4m4 0h4M19 38h4m4 0h4M45 34h2m-2 8h2" stroke="#e8694a" stroke-width="3" stroke-linecap="round"/></svg>`,
  part: `<svg class="bl-ico" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 30 32 10l24 20" fill="none" stroke="#1f5b52" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 28v26h36V28" fill="#fff" stroke="#1f5b52" stroke-width="3"/><rect x="27" y="38" width="10" height="16" fill="#e8694a"/></svg>`,
};
const chk = (id, label, cls = "") => `<a class="bl-chk${cls ? " " + cls : ""}" href="#c-${id}" role="checkbox" aria-checked="false" data-chk="${id}"><span class="bl-box">${ICON.tick}</span><span class="bl-chk-t">${label}</span></a>`;
const days = (m) => EV.filter((e) => e[0] === m);

const header = (c) => `<header class="bl-head pk-bleed">
  <div class="bl-band"><div class="bl-wrap bl-band-in"><span class="bl-band-l">Prochaines échéances</span><ul class="bl-nxl" data-next-band aria-label="Prochaines échéances fiscales"><li class="bl-nx-fb"><a href="/calendrier">Voir le calendrier fiscal de l'année</a></li></ul><a class="bl-band-r" href="/calendrier">Tout le calendrier ${ICON.arrow}</a></div>
    <ul class="bl-up-data">${EV.map((e, i) => `<li data-m="${e[0]}" data-d="${e[1]}" data-p="${e[3]}">${esc(e[2])}</li>`).join("")}</ul></div>
  <div class="bl-bar"><div class="bl-wrap bl-bar-in"><a class="bl-logo" href="/" aria-label="${esc(c.brand)} — accueil">${ICON.logo}<span><b>Bilan</b><small>Expertise comptable</small></span></a>
    <div class="bl-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
    <a class="bl-btn bl-btn--coral bl-bar-cta" href="/contact">Parler à un expert</a>
    <details class="bl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="bl-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="bl-btn bl-btn--coral" href="/contact">Parler à un expert</a></div></details></div></div></header>`;

const footer = (c) => `<footer class="bl-foot pk-bleed"><div class="bl-wrap"><div class="bl-foot-top"><div class="bl-foot-brand">${ICON.logo}<p class="bl-foot-lead">Des comptes clairs, des échéances tenues, un interlocuteur qui répond.</p><p class="bl-foot-addr">Cabinet Bilan &amp; Associés<br>12 rue des Écritures, 69002 Lyon</p></div>
  <div><h3>Le cabinet</h3>${nav(c.menu.slice(1, 6), "bl-fl")}</div><div><h3>Outils</h3><a class="bl-fl" href="/calendrier">Calendrier fiscal</a><a class="bl-fl" href="/simulateur">Simulateur</a><a class="bl-fl" href="/tarifs">Formules</a></div>
  <div><h3>Contact</h3><a class="bl-fl" href="/contact">Écrire au cabinet</a><a class="bl-fl" href="/recherche">Rechercher</a></div></div>
  <p class="bl-legal">© Cabinet Bilan &amp; Associés — site de démonstration. Cabinet, équipe, tarifs et chiffres fictifs. Les dates et calculs proposés sont indicatifs et ne remplacent pas l'avis d'un professionnel.</p></div></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="bl-ph pk-bleed"><div class="bl-wrap bl-ph-in"><p class="bl-kick" data-reveal>${esc(kicker)}</p><div class="bl-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="bl-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);
const warn = `<p class="bl-warn" role="note"><b>Estimation indicative.</b> Ces informations ne remplacent ni l'avis d'un expert-comptable ni les sites officiels ; elles dépendent de votre situation exacte.</p>`;

/* ---------- hero : calendrier de l'année ---------- */
const yearGrid = () => MONTHS.map((m, i) => { const n = i + 1, d = days(n); return `<a class="bl-mo" href="#mois-${n}" data-mo="${n}" aria-label="${m} : ${d.length ? d.length + " échéance" + (d.length > 1 ? "s" : "") : "mois calme"}"><i class="bl-mo-ring" aria-hidden="true"></i><span class="bl-mo-n">${pad(n)}</span><span class="bl-mo-name">${m}</span><span class="bl-pips" aria-hidden="true">${d.map((e) => `<i class="bl-pip">${e[1]}</i>`).join("")}</span></a>`; }).join("");
const monthPanels = () => MONTHS.map((m, i) => { const n = i + 1, d = days(n); return `<div class="bl-mp${n === 1 ? " is-on" : ""}" data-mp="${n}"><div class="bl-mp-h"><h3>${m}</h3><span>${d.length ? d.length + " échéance" + (d.length > 1 ? "s" : "") : "mois calme"}</span></div>${d.length ? `<ul>${d.map((e) => `<li><time class="bl-mp-d"><b>${pad(e[1])}</b> ${SHORT[i]}</time><span class="bl-mp-t">${esc(e[2])}</span>${pills(e[3])}</li>`).join("")}</ul>` : `<p class="bl-mp-calm">Peu d'échéances ce mois-ci : c'est le bon moment pour faire le point sur la trésorerie et classer vos pièces.</p>`}</div>`; }).join("");

const regRows = [
  ["01", "Tenue et révision des comptes", "SARL, micro", "mensuelle", "m", "micro sarl"],
  ["02", "Bilan et liasse fiscale", "SARL", "annuelle", "a", "sarl"],
  ["03", "Déclarations de TVA", "SARL, micro", "mensuelle ou trimestrielle", "m", "micro sarl"],
  ["04", "Paie et bulletins de salaire", "SARL", "mensuelle", "m", "sarl"],
  ["05", "Déclaration de revenus", "Particulier, micro", "annuelle", "a", "part micro"],
  ["06", "Création et choix du statut", "Micro, SARL", "ponctuelle", "p", "micro sarl"],
];
const regTable = (rows, full) => `<table class="bl-reg"><caption class="bl-sr">Registre des prestations du cabinet</caption><thead><tr><th scope="col">N°</th><th scope="col">Prestation</th><th scope="col">Pour qui</th><th scope="col">Rythme</th>${full ? `<th scope="col">Ce qui est inclus</th>` : ""}<th scope="col"><span class="bl-sr">Détail</span></th></tr></thead><tbody>${rows.map((r, i) => `<tr data-p="${r[5]}"><td data-l="N°"><span class="bl-no">${r[0]}</span></td><th scope="row" data-l="Prestation">${esc(r[1])}</th><td data-l="Pour qui">${esc(r[2])}</td><td data-l="Rythme">${esc(r[3])}</td>${full ? `<td data-l="Inclus">${esc(r[6] || "")}</td>` : ""}<td class="bl-reg-go"><a href="/contact" aria-label="Demander un devis : ${esc(r[1])}">Demander ${ICON.arrow}</a></td></tr>`).join("")}</tbody></table>`;

const home = (c) => [
  sec(header(c)),
  sec(`<section class="bl-hero pk-bleed"><div class="bl-wrap bl-hero-in">
    <div class="bl-hero-copy"><p class="bl-kick" data-reveal>Cabinet d'expertise comptable · Lyon</p><div class="bl-h1" role="heading" aria-level="1" data-reveal>Chaque échéance <em>à sa place</em>, toute l'année.</div>
      <p class="bl-lead" data-reveal>Nous tenons vos comptes, préparons vos déclarations et vous prévenons avant chaque date limite. Vous gardez l'esprit libre pour votre activité.</p>
      <div class="bl-actions" data-reveal><a class="bl-btn bl-btn--coral bl-btn--lg" href="/calendrier">Mon calendrier fiscal ${ICON.arrow}</a><a class="bl-btn bl-btn--line bl-btn--lg" href="/simulateur">Simuler mes charges</a></div>
      <ul class="bl-trust" data-reveal><li>${ICON.tick}Un seul interlocuteur dédié</li><li>${ICON.tick}Rappels avant chaque date limite</li><li>${ICON.tick}Réponse sous un jour ouvré</li></ul></div>
    <div class="bl-yearbox" data-year data-reveal><div class="bl-yearhead"><span class="bl-yh-t">L'année en un coup d'œil</span><a class="bl-yh-play" href="#pause" data-play aria-pressed="false">Mettre en pause</a></div>
      <div class="bl-year" aria-label="Les douze mois de l'année et leurs échéances">${yearGrid()}</div>
      <div class="bl-mpanel" aria-live="off">${monthPanels()}</div></div></div></section>`),
  sec(`<section class="bl-stats pk-bleed"><div class="bl-wrap"><ul class="bl-stats-in"><li data-reveal><b data-count="28">28</b><span>ans d'exercice du cabinet</span></li><li data-reveal><b data-count="12">12</b><span>experts et collaborateurs</span></li><li data-reveal><b data-count="94" data-suffix=" %">94 %</b><span>de déclarations déposées avec avance</span></li><li data-reveal><b data-count="1">1</b><span>interlocuteur nommé par dossier</span></li></ul><p class="bl-fine">Chiffres de démonstration.</p></div></section>`),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap"><div class="bl-sechead"><div><p class="bl-kick" data-reveal>Le registre du cabinet</p><h2 class="bl-h2" data-reveal>Ce que nous tenons pour vous</h2></div><a class="bl-more" href="/services">Toutes les prestations ${ICON.arrow}</a></div>
    <div class="bl-regwrap" data-reveal>${regTable(regRows.slice(0, 5))}</div></div></section>`),
  sec(`<section class="bl-method pk-bleed"><div class="bl-wrap bl-method-in"><div class="bl-method-copy"><p class="bl-kick" data-reveal>Notre façon de travailler</p><h2 class="bl-h2" data-reveal>Quatre pages de carnet, aucune mauvaise surprise.</h2><p class="bl-muted" data-reveal>Chaque dossier suit le même parcours, daté et partagé avec vous. Vous savez toujours où nous en sommes et ce qu'il reste à faire.</p><a class="bl-btn bl-btn--line" href="/tarifs" data-reveal>Voir les formules</a></div>
    <ol class="bl-notebook" data-reveal><li><span class="bl-step-n">1</span><div><h3>On fait connaissance</h3><p>Un rendez-vous pour comprendre votre activité, votre statut et vos priorités.</p></div></li><li><span class="bl-step-n">2</span><div><h3>On classe</h3><p>Vos pièces sont rangées et rapprochées de votre banque, sans ressaisie.</p></div></li><li><span class="bl-step-n">3</span><div><h3>On déclare</h3><p>Nous préparons chaque déclaration et vous la faisons valider avant dépôt.</p></div></li><li><span class="bl-step-n">4</span><div><h3>On anticipe</h3><p>Un point régulier sur votre trésorerie, vos impôts et les choix à faire.</p></div></li></ol></div></section>`),
  sec(`<section class="bl-sect bl-sect--mint pk-bleed"><div class="bl-wrap"><div class="bl-sechead"><div><p class="bl-kick" data-reveal>Pour qui ?</p><h2 class="bl-h2" data-reveal>Trois situations, trois calendriers</h2></div></div>
    <div class="bl-profiles"><article class="bl-prof" data-reveal>${ICON.micro}<h3>Micro-entrepreneur</h3><p>Déclarer son chiffre d'affaires à temps, éviter les dépassements de seuils.</p><ul><li>${ICON.tick}Déclarations trimestrielles ou mensuelles</li><li>${ICON.tick}Suivi des seuils de TVA</li><li>${ICON.tick}Passage éventuel en société</li></ul><a class="bl-go" href="/calendrier">Son calendrier ${ICON.arrow}</a></article>
      <article class="bl-prof" data-reveal>${ICON.sarl}<h3>SARL et sociétés</h3><p>Comptes annuels, TVA, acomptes d'impôt et rémunération du dirigeant.</p><ul><li>${ICON.tick}Bilan et liasse fiscale</li><li>${ICON.tick}TVA et acomptes d'impôt</li><li>${ICON.tick}Paie et assemblées</li></ul><a class="bl-go" href="/calendrier">Son calendrier ${ICON.arrow}</a></article>
      <article class="bl-prof" data-reveal>${ICON.part}<h3>Particulier</h3><p>Déclaration de revenus, taxe foncière et décisions de fin d'année.</p><ul><li>${ICON.tick}Déclaration de revenus</li><li>${ICON.tick}Revenus fonciers</li><li>${ICON.tick}Dons et versements déductibles</li></ul><a class="bl-go" href="/calendrier">Son calendrier ${ICON.arrow}</a></article></div></div></section>`),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap bl-close-in"><div data-reveal><p class="bl-kick">Un petit carnet pratique</p><h2 class="bl-h2">Avant la clôture, cochez ce qui est prêt.</h2><p class="bl-muted">Six pièces que nous demandons toujours. Vos coches restent dans votre navigateur.</p></div>
    <div class="bl-checklist" data-reveal data-checklist><div class="bl-cl-head"><span>Ma clôture</span><b data-prog-t>0 / 6</b></div><div class="bl-bar-prog" aria-hidden="true"><i data-prog></i></div>
      <ul>${[["releves", "Relevés bancaires de toute l'année"], ["factures", "Factures de ventes et d'achats"], ["notes", "Notes de frais justifiées"], ["stock", "État des stocks au dernier jour"], ["emprunts", "Tableaux d'amortissement des emprunts"], ["paie", "Récapitulatif des salaires versés"]].map(([id, t]) => `<li>${chk("cl-" + id, t)}</li>`).join("")}</ul></div></div></section>`),
  sec(`<section class="bl-sect bl-sect--mint pk-bleed"><div class="bl-wrap bl-faq-in"><h2 class="bl-h2" data-reveal>Questions fréquentes</h2><div>
    <details data-reveal><summary>Quand dois-je vous transmettre mes pièces ?</summary><p>Idéalement chaque mois. Nous convenons ensemble d'un rythme simple : dépôt en ligne, photo ou envoi bancaire automatique.</p></details>
    <details data-reveal><summary>Les dates du calendrier sont-elles garanties ?</summary><p>Non : elles sont indicatives et peuvent varier selon votre dossier, votre département ou la loi de finances. Nous les confirmons pour vous.</p></details>
    <details data-reveal><summary>Puis-je changer de formule en cours d'année ?</summary><p>Oui, nous adaptons la formule à l'évolution de votre activité. Parlons-en lors d'un rendez-vous.</p></details>
    <details data-reveal><summary>Et si je suis en retard ?</summary><p>Contactez-nous au plus vite : certaines pénalités peuvent être évitées ou réduites si la régularisation est rapide.</p></details></div></div></section>`),
  sec(`<section class="bl-cta pk-bleed"><div class="bl-wrap bl-cta-in"><h2 class="bl-h2" data-reveal>Parlons de votre année.</h2><div data-reveal><p class="bl-lead">Un premier rendez-vous pour faire le point, sans engagement.</p><a class="bl-btn bl-btn--coral bl-btn--lg" href="/contact">Prendre contact ${ICON.arrow}</a></div></div></section>`),
  sec(footer(c)),
];

/* ---------- services ---------- */
const svcRows = [
  ["01", "Tenue et révision des comptes", "SARL, micro", "mensuelle", "m", "micro sarl", "Saisie, rapprochement bancaire, contrôle des pièces"],
  ["02", "Bilan et liasse fiscale", "SARL", "annuelle", "a", "sarl", "Comptes annuels, annexes, dépôt et archivage"],
  ["03", "Déclarations de TVA", "SARL, micro", "mensuelle ou trimestrielle", "m", "micro sarl", "Calcul, déclaration, rappel avant chaque date"],
  ["04", "Paie et bulletins de salaire", "SARL", "mensuelle", "m", "sarl", "Bulletins, déclarations sociales, registre"],
  ["05", "Déclaration de revenus", "Particulier, micro", "annuelle", "a", "part micro", "Préparation, optimisation, vérification des avis"],
  ["06", "Création et choix du statut", "Micro, SARL", "ponctuelle", "p", "micro sarl", "Comparaison de statuts, formalités, premier budget"],
  ["07", "Revenus fonciers et location", "Particulier", "annuelle", "a", "part", "Régime réel ou micro-foncier, déclaration 2044"],
  ["08", "Conseil en rémunération du dirigeant", "SARL", "semestrielle", "s", "sarl", "Salaire, dividendes, simulation de charges"],
  ["09", "Suivi des seuils et passage en société", "Micro", "trimestrielle", "t", "micro", "Alerte de dépassement, étude de transformation"],
];
const services = (c) => [sec(header(c)), pagehead("Le registre du cabinet", "Nos prestations, <em>ligne par ligne</em>", "Choisissez votre profil : le registre ne garde que ce qui vous concerne."),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap" data-scope><div class="bl-chips" role="tablist" aria-label="Filtrer par profil"><a href="#tous" class="is-on" role="tab" aria-selected="true" data-fl="all">Tous</a><a href="#micro" role="tab" aria-selected="false" data-fl="micro">Micro-entrepreneur</a><a href="#sarl" role="tab" aria-selected="false" data-fl="sarl">SARL</a><a href="#particulier" role="tab" aria-selected="false" data-fl="part">Particulier</a></div>
    <p class="bl-sr" aria-live="polite" data-fl-out></p><div class="bl-regwrap bl-regwrap--full">${regTable(svcRows, true)}</div></div></section>`),
  sec(`<section class="bl-sect bl-sect--mint pk-bleed"><div class="bl-wrap"><div class="bl-sechead"><div><p class="bl-kick" data-reveal>Nos engagements</p><h2 class="bl-h2" data-reveal>Ce que vous pouvez attendre de nous</h2></div></div><div class="bl-pledges">
    <article data-reveal><span class="bl-pledge-n">1</span><h3>Des délais écrits</h3><p>Nous indiquons une date de remise pour chaque livrable, dès le début.</p></article>
    <article data-reveal><span class="bl-pledge-n">2</span><h3>Un langage clair</h3><p>Chaque chiffre est expliqué, chaque choix présenté avec ses conséquences.</p></article>
    <article data-reveal><span class="bl-pledge-n">3</span><h3>Aucun frais caché</h3><p>Ce qui est inclus est écrit noir sur blanc dans la lettre de mission.</p></article></div></div></section>`),
  sec(`<section class="bl-cta pk-bleed"><div class="bl-wrap bl-cta-in"><h2 class="bl-h2">Une prestation vous manque ?</h2><div><p class="bl-lead">Décrivez votre besoin : nous vous répondons avec une proposition claire.</p><a class="bl-btn bl-btn--coral bl-btn--lg" href="/contact">Demander un devis ${ICON.arrow}</a></div></div></section>`), sec(footer(c))];

/* ---------- calendrier fiscal ---------- */
const evList = () => MONTHS.map((m, i) => { const d = days(i + 1); if (!d.length) return ""; return `<section class="bl-grp" data-gm="${i + 1}"><h3 class="bl-grp-h">${m}</h3><ol class="bl-evs">${d.map((e) => { const id = `e${e[0]}-${e[1]}-${e[3].replace(/ /g, "")}`; return `<li class="bl-ev" data-p="${e[3]}" data-m="${e[0]}" data-d="${e[1]}" data-t="${esc(e[2])}"><time class="bl-evd"><b>${pad(e[1])}</b><i>${SHORT[i]}</i></time><div class="bl-evt"><strong>${esc(e[2])}</strong><p>${esc(e[4])}</p><span class="bl-pills">${pills(e[3])}</span></div>${chk(id, "Me le rappeler", "bl-chk--ev")}</li>`; }).join("")}</ol></section>`; }).join("");
const calendrier = (c) => [sec(header(c)), pagehead("Calendrier fiscal", "Vos échéances, <em>par profil</em>", "Choisissez votre situation, cochez celles à retenir, puis exportez la liste."),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap bl-cal" data-scope data-cal>
    <aside class="bl-carnet" aria-label="Outils du calendrier"><div class="bl-rings" aria-hidden="true"></div><div class="bl-carnet-in"><h2 class="bl-h3">Mon profil</h2>
      <div class="bl-chips bl-chips--col" role="tablist" aria-label="Choisir un profil"><a href="#tous" class="is-on" role="tab" aria-selected="true" data-fl="all">Tous les profils</a><a href="#micro" role="tab" aria-selected="false" data-fl="micro">Micro-entrepreneur</a><a href="#sarl" role="tab" aria-selected="false" data-fl="sarl">SARL</a><a href="#particulier" role="tab" aria-selected="false" data-fl="part">Particulier</a></div>
      <div class="bl-next" aria-live="polite"><span class="bl-next-k">Prochaine échéance</span><strong data-next-t>—</strong><span class="bl-next-d" data-next-d></span></div>
      <p class="bl-rem"><b data-rem-n>0</b> rappel(s) retenu(s)</p>
      <div class="bl-export"><a class="bl-btn bl-btn--sage" href="#export-texte" data-export="txt">Exporter la liste en texte</a></div>
      <div class="bl-outbox bl-off" data-out><pre class="bl-pre" data-out-t aria-label="Texte exporté"></pre><a class="bl-btn bl-btn--line" href="#copier" data-copy>Copier le texte</a><p class="bl-status" role="status" data-status></p></div>
      <p class="bl-fine">Dates indicatives pour la France. Si vous cochez des échéances, seules celles-ci sont exportées ; sinon, toutes celles du profil.</p></div></aside>
    <div class="bl-evwrap"><h2 class="bl-sr">Liste des échéances</h2><p class="bl-sr" aria-live="polite" data-fl-out></p>${evList()}<p class="bl-empty bl-off" data-empty>Aucune échéance pour ce profil.</p>${warn}</div></div></section>`),
  sec(footer(c))];

/* ---------- simulateur ---------- */
const simulateur = (c) => [sec(header(c)), pagehead("Simulateur", "Charges, TVA et impôt, <em>en quelques secondes</em>", "Un chiffre d'affaires, un statut : une estimation lisible, avec toutes les hypothèses."),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap"><div class="bl-sim" data-sim><div class="bl-sim-form" data-sim-form><div class="bl-fld"><span class="bl-fld-l">Votre statut</span><div class="bl-opts" role="radiogroup" aria-label="Votre statut"><a href="#st-micro" role="radio" aria-checked="false" data-k="st" data-v="micro">Micro-entrepreneur</a><a href="#st-sarl" role="radio" aria-checked="false" data-k="st" data-v="sarl">SARL</a><a href="#st-part" role="radio" aria-checked="false" data-k="st" data-v="part">Particulier</a></div></div><div class="bl-fld" data-f="act"><span class="bl-fld-l">Activité</span><div class="bl-opts" role="radiogroup" aria-label="Activité"><a href="#act-serv" role="radio" aria-checked="false" data-k="act" data-v="serv">Prestations de services</a><a href="#act-vente" role="radio" aria-checked="false" data-k="act" data-v="vente">Vente de marchandises</a></div></div><div class="bl-fld"><span class="bl-fld-l">Parts de quotient familial <small>(foyer fiscal)</small></span><div class="bl-opts" role="radiogroup" aria-label="Parts de quotient familial"><a href="#parts-1" role="radio" aria-checked="false" data-k="parts" data-v="1">1</a><a href="#parts-15" role="radio" aria-checked="false" data-k="parts" data-v="1.5">1,5</a><a href="#parts-2" role="radio" aria-checked="false" data-k="parts" data-v="2">2</a><a href="#parts-25" role="radio" aria-checked="false" data-k="parts" data-v="2.5">2,5</a><a href="#parts-3" role="radio" aria-checked="false" data-k="parts" data-v="3">3</a></div></div><div class="bl-fld"><span class="bl-fld-l" data-ca-l>Chiffre d'affaires annuel HT</span><div class="bl-num" data-slot="ca" data-a="Montant annuel en euros" data-min="0" data-max="1000000" data-step="500"><span>€</span></div><div data-slot="car" data-a="Montant annuel, curseur" data-min="0" data-max="300000" data-step="1000"></div></div><div class="bl-fld" data-f="sarl"><span class="bl-fld-l">Charges d\'exploitation : <b data-o="ch"></b> % du CA</span><div data-slot="ch" data-a="Charges en pourcentage du chiffre d\'affaires" data-min="0" data-max="80" data-step="1"></div></div><div class="bl-fld" data-f="sarl"><span class="bl-fld-l">Part du bénéfice versée au gérant : <b data-o="rem"></b> %</span><div data-slot="rem" data-a="Part du bénéfice versée en pourcentage" data-min="0" data-max="100" data-step="5"></div></div><p class="bl-muted bl-nojs">Ce simulateur nécessite JavaScript. Pour une étude précise, écrivez-nous.</p></div>
    <div class="bl-sim-res" data-sim-res aria-live="polite"></div></div></div></section>`),
  sec(`<section class="bl-sect bl-sect--mint pk-bleed"><div class="bl-wrap bl-faq-in"><h2 class="bl-h2" data-reveal>Comment lire le résultat</h2><div>
    <details data-reveal><summary>Pourquoi est-ce une estimation ?</summary><p>Le simulateur applique des taux moyens et un barème simplifié : il ignore vos autres revenus, vos réductions d'impôt, la décote et le plafonnement du quotient familial.</p></details>
    <details data-reveal><summary>Les taux sont-ils à jour ?</summary><p>Ils sont arrondis, donnés à titre d'exemple et susceptibles de changer chaque année. Les hypothèses utilisées sont rappelées sous le résultat.</p></details>
    <details data-reveal><summary>Que faire du résumé ?</summary><p>Copiez-le dans le message du formulaire de contact : un expert reprendra vos hypothèses et vous répondra avec un chiffrage précis.</p></details></div></div></section>`),
  sec(footer(c))];

/* ---------- tarifs ---------- */
const plan = (name, sub, m, y, feats, hot) => `<article class="bl-plan${hot ? " bl-plan--hot" : ""}" data-reveal>${hot ? `<span class="bl-flag">La plus choisie</span>` : ""}<div class="bl-rings bl-rings--h" aria-hidden="true"></div><h3>${name}</h3><p class="bl-plan-sub">${sub}</p><p class="bl-plan-p"><b data-m="${m}" data-y="${y}">${m} €</b><small data-per>/ mois HT</small></p><ul>${feats.map(([ok, t]) => `<li${ok ? "" : ' class="is-no"'}><span class="bl-box${ok ? " is-on" : ""}">${ok ? ICON.tick : ""}</span><span>${ok ? "" : `<span class="bl-sr">Non inclus : </span>`}${t}</span></li>`).join("")}</ul><a class="bl-btn ${hot ? "bl-btn--coral" : "bl-btn--line"} bl-btn--block" href="/contact">Demander cette formule</a></article>`;
const tarifs = (c) => [sec(header(c)), pagehead("Formules", "Trois formules, <em>un prix lisible</em>", "Montants de démonstration. Votre devis personnalisé est établi après un premier rendez-vous."),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap"><div class="bl-billing" role="tablist" aria-label="Rythme de facturation"><a href="#mensuel" class="is-on" role="tab" aria-selected="true" data-bill="m">Mensuel</a><a href="#annuel" role="tab" aria-selected="false" data-bill="y">Annuel (2 mois offerts)</a></div>
    <div class="bl-plans">${plan("Essentiel", "Pour démarrer en micro-entreprise", 39, 33, [[1, "Déclarations de chiffre d'affaires"], [1, "Calendrier fiscal et rappels"], [1, "Suivi des seuils"], [0, "Bilan annuel"], [0, "Paie"]])}
    ${plan("Sérénité", "Pour une société à taille humaine", 189, 158, [[1, "Tenue et révision des comptes"], [1, "Bilan et liasse fiscale"], [1, "TVA et acomptes"], [1, "Point trimestriel"], [0, "Paie"]], true)}
    ${plan("Sur mesure", "Pour une équipe en croissance", 390, 325, [[1, "Tout Sérénité"], [1, "Paie jusqu'à 10 salariés"], [1, "Tableau de bord mensuel"], [1, "Conseil en rémunération"], [1, "Interlocuteur dédié"]])}</div>
    <p class="bl-fine bl-fine--c">Tarifs fictifs de démonstration, hors taxes. Aucun paiement n'est possible sur ce site : la demande passe par le formulaire de contact.</p></div></section>`),
  sec(`<section class="bl-sect bl-sect--mint pk-bleed"><div class="bl-wrap bl-faq-in"><h2 class="bl-h2" data-reveal>Avant de choisir</h2><div>
    <details data-reveal><summary>Y a-t-il des frais de dossier ?</summary><p>La lettre de mission détaille tout ce qui est inclus ; une éventuelle prise en charge initiale y est indiquée.</p></details>
    <details data-reveal><summary>Comment sont comptés les salariés ?</summary><p>Par bulletin de salaire mensuel ; le chiffrage final dépend de votre convention collective.</p></details>
    <details data-reveal><summary>Peut-on résilier ?</summary><p>Les modalités sont précisées dans la lettre de mission, avec un préavis clair.</p></details></div></div></section>`), sec(footer(c))];

/* ---------- à propos ---------- */
const person = (ini, c1, c2) => `<svg class="bl-avatar" viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="14" fill="${c1}"/><circle cx="48" cy="38" r="16" fill="${c2}"/><path d="M16 96c2-24 16-36 32-36s30 12 32 36z" fill="${c2}"/><path d="M62 74l12 12" stroke="#e8694a" stroke-width="4" stroke-linecap="round" opacity=".0"/></svg><span class="bl-ini" aria-hidden="true">${ini}</span>`;
const apropos = (c) => [sec(header(c)), pagehead("Le cabinet", "Vingt-huit ans de <em>comptes bien tenus</em>", "Un cabinet indépendant, à taille humaine, qui préfère expliquer plutôt qu'impressionner."),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap bl-about"><div class="bl-about-l" data-reveal><h2 class="bl-h2">Notre carnet de bord</h2><p class="bl-muted">Quelques dates, toutes fictives, pour raconter l'histoire du cabinet de démonstration.</p></div>
    <ol class="bl-log"><li data-reveal><time>1998</time><div><h3>Ouverture du cabinet</h3><p>Deux associés, un bureau et une conviction : un client informé est un client serein.</p></div></li><li data-reveal><time>2008</time><div><h3>Un cap : les sociétés</h3><p>Le cabinet accompagne les premières PME et crée son pôle paie.</p></div></li><li data-reveal><time>2016</time><div><h3>Tout passe en ligne</h3><p>Dépôt des pièces, signature et suivi des échéances accessibles à distance.</p></div></li><li data-reveal><time>2024</time><div><h3>Un calendrier pour chacun</h3><p>Création d'un calendrier fiscal par profil et d'un simulateur à disposition de tous.</p></div></li></ol></div></section>`),
  sec(`<section class="bl-sect bl-sect--mint pk-bleed"><div class="bl-wrap"><div class="bl-sechead"><div><p class="bl-kick" data-reveal>L'équipe</p><h2 class="bl-h2" data-reveal>Des visages derrière les chiffres</h2></div></div><div class="bl-team">
    ${[["Claire Aubert", "Associée, expert-comptable", "CA", "#d9e7e2", "#1f5b52"], ["Marc Delorme", "Associé, commissaire aux comptes", "MD", "#fbe3da", "#8f3a22"], ["Inès Rahal", "Responsable paie", "IR", "#e3ecf6", "#2f4f78"], ["Thomas Vidal", "Conseil aux particuliers", "TV", "#efe9d3", "#6b5a1f"]].map(([n, r, i, a, b]) => `<article class="bl-member" data-reveal><div class="bl-av">${person(i, a, b)}</div><h3>${n}</h3><p>${r}</p></article>`).join("")}</div><p class="bl-fine">Personnes fictives, illustrations de démonstration.</p></div></section>`),
  sec(`<section class="bl-sect pk-bleed"><div class="bl-wrap"><div class="bl-values"><article data-reveal><span class="bl-pledge-n">A</span><h3>Clarté</h3><p>Pas de jargon : chaque ligne d'un bilan peut s'expliquer en une phrase.</p></article><article data-reveal><span class="bl-pledge-n">B</span><h3>Régularité</h3><p>Les échéances sont notre métier : rien ne doit arriver par surprise.</p></article><article data-reveal><span class="bl-pledge-n">C</span><h3>Confidentialité</h3><p>Vos données restent chez nous et ne sont jamais revendues.</p></article></div></div></section>`),
  sec(`<section class="bl-cta pk-bleed"><div class="bl-wrap bl-cta-in"><h2 class="bl-h2">Faisons connaissance.</h2><div><p class="bl-lead">Un café ou une visioconférence : vous choisissez.</p><a class="bl-btn bl-btn--coral bl-btn--lg" href="/contact">Prendre rendez-vous ${ICON.arrow}</a></div></div></section>`), sec(footer(c))];

const contact = (c) => [sec(header(c)), pagehead("On vous répond", "Contact", "Une question, un devis, un rendez-vous : écrivez-nous, nous répondons sous un jour ouvré."),
  { type: "form", heading: "Écrire au cabinet", intro: "Indiquez votre situation (micro-entrepreneur, société ou particulier) et, si vous le souhaitez, collez le résumé de votre simulation." },
  sec(`<section class="bl-sect bl-sect--mint pk-bleed"><div class="bl-wrap bl-contact-info"><address data-reveal><h2 class="bl-h3">Le cabinet</h2>Cabinet Bilan &amp; Associés<br>12 rue des Écritures<br>69002 Lyon</address><div data-reveal><h2 class="bl-h3">Horaires</h2><p>Du lundi au vendredi, de 9 h à 18 h.<br>Rendez-vous en cabinet ou en visioconférence.</p></div><div data-reveal><h2 class="bl-h3">Avant d'écrire</h2><p><a href="/calendrier">Calendrier fiscal</a> · <a href="/simulateur">Simulateur</a> · <a href="/tarifs">Formules</a></p></div></div></section>`), sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une réponse précise ?", "Une prestation, une échéance, une question."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="bl-404 pk-bleed"><div class="bl-wrap bl-404-in"><svg class="bl-404-i" viewBox="0 0 120 140" aria-hidden="true"><rect x="10" y="8" width="90" height="120" rx="8" fill="#fff" stroke="#1f5b52" stroke-width="4"/><path d="M26 40h58M26 58h58M26 76h34" stroke="#cdd9d5" stroke-width="4" stroke-linecap="round"/><circle cx="88" cy="100" r="22" fill="#e8694a"/><path d="m79 91 18 18m0-18-18 18" stroke="#17302c" stroke-width="5" stroke-linecap="round"/></svg><div><p class="bl-kick">Écriture introuvable</p><div class="bl-h1" role="heading" aria-level="1">Cette page ne figure pas <em>au registre</em>.</div><p class="bl-ph-sub">Elle a peut-être changé d'adresse. Reprenons depuis un endroit sûr.</p><div class="bl-actions"><a class="bl-btn bl-btn--coral bl-btn--lg" href="/">Retour à l'accueil</a><a class="bl-btn bl-btn--line bl-btn--lg" href="/recherche">Rechercher</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "bilan", name: "Bilan", version: "2.0.0", category: "services", tags: ["classique", "moderne", "naturel"], siteType: "Cabinet d'expertise comptable", featured: true,
  concept: "Un carnet de comptes rassurant : l'année en douze mois dont les échéances s'allument une à une, un registre de services en lignes, un calendrier fiscal par profil et un simulateur lisible.",
  description: "Cabinet d'expertise comptable : blanc doux, vert-sauge et corail, calendrier de l'année aux échéances qui s'allument, registre de prestations, calendrier fiscal par profil avec rappels et export, simulateur de charges, TVA et impôt.",
  brand: "Cabinet Bilan & Associés", modules: ["formulaires", "recherche"],
  dna: { header: "barre-simple-avec-bandeau-des-prochaines-echeances", hero: "calendrier-de-l-annee-aux-echeances-qui-s-allument-mois-par-mois", grid: "registre-en-lignes-pointillees-devenant-fiches-sur-mobile", motion: "mois-qui-s-allument-coches-qui-se-posent-et-compteurs-sobres", shapes: "carnets-a-spirales-cases-a-cocher-dessinees-et-lignes-de-grand-livre", rhythm: "pages-de-carnet-alternees-avec-bandes-sauge-et-marges-regulieres", signature: "calendrier-fiscal-par-profil-avec-rappels-export-et-simulateur-charges-tva-impot" },
  tokens: {
    colors: { primary: "#1f5b52", secondary: "#143f39", accent: "#c9482b", background: "#fbfcfa", surface: "#ffffff", text: "#17302c", muted: "#4d625d", success: "#1e7a4a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.literata", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" },
    radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "0 2px 0 #cdd9d5", button: "none" }, border: { width: 1, color: "#cdd9d5" },
    type: { h1: { size: 54, weight: 600, lineHeight: 1.08, transform: "none" }, h2: { size: 34, weight: 600, lineHeight: 1.18, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent (corail)", type: "color", default: "#e8694a" },
    { key: "sage", label: "Vert principal", type: "color", default: "#1f5b52" },
    { key: "band", label: "Bandeau des échéances", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "rules", label: "Lignes de cahier", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Discrètes"]] },
    { key: "round", label: "Angles", type: "choice", default: "soft", choices: [["soft", "Doux"], ["sharp", "Francs"]] },
  ],
  menu: [["Accueil", "/"], ["Services", "/services"], ["Calendrier fiscal", "/calendrier"], ["Simulateur", "/simulateur"], ["Formules", "/tarifs"], ["À propos", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "services", name: "Services", render: services }, { key: "calendrier", name: "Calendrier fiscal", render: calendrier },
    { key: "simulateur", name: "Simulateur", render: simulateur }, { key: "tarifs", name: "Formules", render: tarifs }, { key: "a-propos", name: "À propos", render: apropos },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
