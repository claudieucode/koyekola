// Poudre — spa et institut de beauté. Direction artistique : sérénité minérale. Rose poudré, grège, pierre et bronze doux ; pierres empilées, marbre veiné, vapeur qui monte très lentement ;
// catalogue de soins en lignes aérées (durées, tarifs de démonstration) où l'on compose « mon rituel » avant de l'envoyer au formulaire de contact.
const { sec, esc } = require("../kit");

/* ---------- illustrations (SVG en ligne, sans identifiants : couches de formes translucides) ---------- */
const pebble = (cx, cy, rx, ry, base, hi, lo) => `<g><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${base}"/><path d="M${cx - rx} ${cy}a${rx} ${ry} 0 0 0 ${rx * 2} 0a${rx} ${ry * 0.55} 0 0 1 ${-rx * 2} 0z" fill="${lo}" opacity=".35"/><ellipse cx="${cx - rx * 0.32}" cy="${cy - ry * 0.45}" rx="${rx * 0.46}" ry="${ry * 0.28}" fill="${hi}" opacity=".55"/></g>`;
const vein = (d, o = ".5", w = 1.2) => `<path d="${d}" fill="none" stroke="#a98f86" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
const steam = `<g class="po-steam" fill="none" stroke="#fff" stroke-linecap="round"><path class="po-s1" d="M250 238c-28-34 26-58-2-92s20-52 4-84" stroke-width="2.2" opacity=".75"/><path class="po-s2" d="M296 226c26-30-24-52 4-84s-14-50 2-80" stroke-width="1.6" opacity=".6"/><path class="po-s3" d="M270 214c-14-26 14-40 0-66" stroke-width="1.2" opacity=".5"/></g>`;
const heroArt = () => `<svg class="po-hero-art" viewBox="0 0 520 640" role="img" aria-label="Dessin de pierres empilées sur un marbre veiné, surmontées de vapeur"><title>Pierres empilées et vapeur</title>
  <rect x="0" y="0" width="520" height="640" fill="#eadcd5"/><circle cx="262" cy="250" r="190" fill="#f6ece7"/><circle cx="262" cy="250" r="140" fill="#fbf4f0"/>
  <g>${vein("M-10 120C80 150 120 90 210 130s140 40 330-20")}${vein("M-10 420C70 380 160 460 250 410s190-30 290 20", ".4")}${vein("M40 640C70 560 120 560 160 500", ".35")}${vein("M380 640C400 580 450 560 540 560", ".35")}${vein("M120 20C150 70 110 110 170 170", ".3", 2)}</g>
  <rect x="0" y="470" width="520" height="170" fill="#d9c7bd"/><path d="M0 470h520" stroke="#fff" stroke-width="2" opacity=".6"/>${vein("M30 520C120 500 180 560 290 530s160-10 230-20", ".45")}${vein("M0 590C100 575 200 610 320 585", ".3")}
  <ellipse cx="262" cy="478" rx="150" ry="14" fill="#4a3a35" opacity=".18"/>
  ${pebble(262, 440, 128, 36, "#b9a094", "#e8d8cf", "#5b4640")}${pebble(268, 382, 98, 30, "#c9a79a", "#f1ddd5", "#7a5448")}${pebble(256, 332, 72, 24, "#a98a7e", "#e2cfc6", "#4f3a34")}${pebble(262, 292, 48, 18, "#d9bfb3", "#fff", "#8a6a5e")}${pebble(262, 262, 28, 12, "#8a5a4a", "#d2b0a2", "#3a2b27")}
  ${steam}</svg>`;
const stack = (s = 1) => `<svg class="po-stack" viewBox="0 0 120 120" aria-hidden="true" width="${120 * s}" height="${120 * s}">${pebble(60, 96, 46, 12, "#b9a094", "#e8d8cf", "#5b4640")}${pebble(62, 74, 34, 10, "#c9a79a", "#f1ddd5", "#7a5448")}${pebble(58, 55, 24, 8, "#a98a7e", "#e2cfc6", "#4f3a34")}${pebble(60, 40, 14, 6, "#d9bfb3", "#fff", "#8a6a5e")}</svg>`;
const wave = `<svg class="po-wave" viewBox="0 0 160 24" aria-hidden="true"><path d="M2 12c14-14 26 14 40 0s26 14 40 0 26 14 40 0 22 10 36 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const ICON = {
  pierre: `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="46" rx="22" ry="8" fill="#b9a094"/><ellipse cx="32" cy="32" rx="15" ry="6" fill="#c9a79a"/><ellipse cx="32" cy="21" rx="8" ry="4" fill="#8a5a4a"/></svg>`,
  marbre: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="10" width="48" height="44" rx="6" fill="#f1e6e0" stroke="#b9a094" stroke-width="1.2"/><path d="M10 24c10 6 14-6 24 0s14 6 20-2M16 52c6-12 14-6 20-14" fill="none" stroke="#a98f86" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  galet: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 38c0-14 12-22 24-22s22 8 20 22-12 12-24 12S10 50 10 38z" fill="#d9bfb3"/><ellipse cx="26" cy="29" rx="9" ry="4.5" fill="#fff" opacity=".55"/></svg>`,
  vapeur: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 54c-8-10 8-14 0-24s8-14 2-22M34 54c-8-10 8-14 0-24s8-14 2-22M46 54c-8-10 8-14 0-24s8-14 2-22" fill="none" stroke="#8a5a4a" stroke-width="2" stroke-linecap="round"/></svg>`,
};
const arrow = `<svg class="po-arrow" viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6h21m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---------- données : catalogue de soins (tarifs et durées de démonstration) ---------- */
const CATS = [["visage", "Visage"], ["corps", "Corps"], ["mains", "Mains & pieds"], ["duo", "En duo"]];
const SOINS = [
  ["eclat-mineral", "Éclat minéral", "visage", 50, 78, "Nettoyage doux, masque de poudre de nacre et modelage du visage à la pierre tiède."],
  ["argile-rose", "Argile rose purifiante", "visage", 45, 68, "Un masque d'argile rose, des vapeurs tièdes et un soin apaisant pour les peaux sensibles."],
  ["quartz-rose", "Lifting au quartz", "visage", 60, 92, "Modelage lent du visage, du cou et des épaules avec deux pierres de quartz rose."],
  ["pierres-chaudes", "Pierres chaudes", "corps", 75, 110, "Galets de basalte chauffés, huile tiède et gestes amples : le grand lâcher-prise."],
  ["massage-lent", "Massage lent aux huiles", "corps", 60, 95, "Un massage enveloppant, à rythme très lent, à l'huile d'amande douce et de santal."],
  ["gommage-sel", "Gommage au sel de roche", "corps", 40, 62, "Sel rose, huile de noyau et rinçage à l'eau chaude pour une peau douce comme un galet."],
  ["vapeur-enveloppante", "Enveloppement de vapeur", "corps", 50, 80, "Cocon de linge chaud, brume d'eau thermale et respiration guidée."],
  ["dos-nuque", "Dos & nuque profonds", "corps", 30, 52, "Le soin des épaules chargées : pression ferme, chaleur de pierre, sans parler."],
  ["manucure", "Manucure poudrée", "mains", 45, 48, "Limage, soin des cuticules, bain de mains tiède et vernis rose poudré ou nu."],
  ["pedicure-galet", "Pédicure au galet", "mains", 60, 62, "Bain de sels, gommage au galet poli, massage des pieds et finition au choix."],
  ["duo-pierres", "Duo pierres chaudes", "duo", 90, 210, "Deux tables côte à côte, le même rituel de pierres chaudes, un thé partagé ensuite."],
  ["duo-hammam", "Rituel hammam en duo", "duo", 120, 260, "Vapeur, gommage, enveloppement et massage lent, à deux dans la cabine de marbre."],
];
const catName = Object.fromEntries(CATS);
const soinRow = ([id, nom, cat, min, prix, txt], i) => `<li class="po-soin" data-id="${id}" data-nom="${esc(nom)}" data-cat="${cat}" data-min="${min}" data-prix="${prix}" data-order="${i}">
  <span class="po-s-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
  <div class="po-s-t"><h3><a href="/soin">${esc(nom)}</a></h3><p>${esc(txt)}</p><span class="po-s-cat">${esc(catName[cat])}</span></div>
  <span class="po-s-d"><b>${min}</b> min</span><span class="po-s-p"><b>${prix}</b> €</span>
  <a class="po-pick" href="#ajouter" role="button" aria-pressed="false" data-add="${id}"><span class="po-pick-on">Ajouter</span><span class="po-pick-off">Retirer</span></a></li>`;

/* ---------- gabarits communs ---------- */
const header = (c) => `<header class="po-head pk-bleed"><div class="po-bar">
  <details class="po-menu"><summary aria-label="Ouvrir le menu"><span class="po-lines" aria-hidden="true"></span><span class="po-menu-l">Menu</span></summary>
    <div class="po-sheet" role="navigation" aria-label="Menu principal"><div class="po-sheet-in"><ol class="po-sheet-links">${c.menu.map((m, i) => `<li><a href="${esc(m.url)}"><i>${String(i + 1).padStart(2, "0")}</i>${esc(m.label)}</a></li>`).join("")}</ol>
      <div class="po-sheet-side">${stack(0.9)}<p>12 rue des Galets<br>69002 Lyon</p><p>Mardi au samedi<br>10 h à 19 h</p><a class="po-link" href="/contact">Prendre rendez-vous</a></div></div></div></details>
  <a class="po-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="po-logo-n">Poudre</span><small>spa &amp; institut</small></a>
  <a class="po-book" href="/contact">Réserver<span class="po-book-x"> un moment</span></a></div></header>`;

const footer = (c) => `<footer class="po-foot pk-bleed"><div class="po-foot-in">${stack(1.1)}<p class="po-foot-lead">Prenez le temps. Le reste attendra.</p>
  <div class="po-foot-links" role="navigation" aria-label="Pied de page">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/recherche">Recherche</a></div>
  <p class="po-foot-addr">12 rue des Galets · 69002 Lyon · du mardi au samedi, 10 h à 19 h</p>
  <p class="po-legal">© Poudre Spa &amp; Institut — site de démonstration. Lieux, soins, tarifs et équipe fictifs ; aucune réservation ni paiement en ligne.</p></div></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="po-ph pk-bleed"><p class="po-kicker" data-reveal>${esc(kicker)}</p><div class="po-title" role="heading" aria-level="1" data-reveal>${title}</div>${wave}${sub ? `<p class="po-sub" data-reveal>${esc(sub)}</p>` : ""}</section>`);

const teaser = SOINS.slice(3, 7).map(([id, nom, , min, prix], i) => `<li data-reveal><a class="po-line" href="/soins"><span class="po-line-n">${String(i + 1).padStart(2, "0")}</span><span class="po-line-t">${esc(nom)}</span><span class="po-line-dots" aria-hidden="true"></span><span class="po-line-d">${min} min</span><span class="po-line-p">${prix} €</span></a></li>`).join("");

/* ---------- accueil ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="po-hero pk-bleed"><div class="po-hero-grid">
    <div class="po-hero-copy"><p class="po-kicker" data-reveal>Spa &amp; institut de beauté · Lyon</p>
      <div class="po-display" role="heading" aria-level="1"><span data-reveal>La douceur</span><span data-reveal>des pierres</span><span data-reveal><em>tièdes.</em></span></div>
      <p class="po-lead" data-reveal>Des soins du visage et du corps, donnés lentement, dans des cabines de marbre pâle. Ici, on ne se dépêche de rien.</p>
      <div class="po-cta" data-reveal><a class="po-btn" href="/soins">Composer mon rituel ${arrow}</a><a class="po-link" href="/institut">Découvrir l'institut</a></div></div>
    <div class="po-hero-fig" data-reveal><div class="po-pebble-frame">${heroArt()}</div><p class="po-cap">Étude de pierres, de marbre et de vapeur — <em>planche I</em></p></div></div>
    <a class="po-scroll" href="#manifeste" data-scrollto aria-label="Descendre vers la suite"><span></span></a></section>`),
  sec(`<section class="po-manif pk-bleed" data-anchor="manifeste"><p class="po-manif-t" data-reveal>Nous croyons qu'un soin réussi est celui dont on ne se souvient presque pas : seulement d'un souffle plus long, d'épaules plus basses, d'une peau qui se tait enfin.</p>${stack(1)}</section>`),
  sec(`<section class="po-menu-s pk-bleed"><div class="po-wrap po-split"><div class="po-split-h"><p class="po-kicker" data-reveal>Le catalogue</p><h2 class="po-h2" data-reveal>Quelques soins<br>pour commencer.</h2><p class="po-muted" data-reveal>Douze soins, des durées claires, des tarifs de démonstration. Choisissez-en un ou plusieurs : vous obtenez la durée et le total de votre rituel.</p><a class="po-link" href="/soins" data-reveal>Voir tout le catalogue ${arrow}</a></div>
    <ul class="po-lines-list">${teaser}</ul></div></section>`),
  sec(`<section class="po-els pk-bleed"><div class="po-wrap"><h2 class="po-h2 po-center" data-reveal>Quatre matières, rien de plus.</h2><ul class="po-els-in">
    ${[["pierre", "Pierre", "Du basalte chauffé à 48 °C, posé, jamais frotté."], ["marbre", "Marbre", "Des cabines claires qui gardent la fraîcheur et la lumière."], ["galet", "Galet", "Polis par l'eau, ils servent aux pieds et aux paumes."], ["vapeur", "Vapeur", "Une brume tiède d'eau thermale pour ouvrir le souffle."]].map(([k, t, x]) => `<li data-reveal>${ICON[k]}<h3>${t}</h3><p>${x}</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="po-feat pk-bleed"><div class="po-wrap po-feat-in"><div class="po-feat-art" data-reveal>${stack(2.2)}</div><div data-reveal><p class="po-kicker">Le rituel du moment</p><h2 class="po-h2">Rituel Galet &amp; Vapeur</h2><p class="po-lead">Enveloppement de vapeur, gommage au sel rose, pierres chaudes sur le dos, thé au gingembre. Deux heures et demie, sans téléphone, sans montre.</p>
    <p class="po-feat-meta"><span><b>2 h 30</b> de durée</span><span>dès <b>235 €</b></span></p><a class="po-btn" href="/rituels">Voir les rituels ${arrow}</a></div></div></section>`),
  sec(`<section class="po-inst pk-bleed"><div class="po-wrap"><ul class="po-facts"><li data-reveal><b data-count="6">6</b><span>cabines de marbre</span></li><li data-reveal><b data-count="12">12</b><span>soins au catalogue</span></li><li data-reveal><b data-count="48" data-suffix=" °">48 °</b><span>température des pierres</span></li><li data-reveal><b data-count="2012">2012</b><span>ouverture de l'institut</span></li></ul>
    <p class="po-inst-t" data-reveal>Une équipe de huit praticiennes, formées à la lenteur. <a class="po-link" href="/institut">Faire connaissance</a></p></div></section>`),
  sec(`<section class="po-jt pk-bleed"><div class="po-wrap"><div class="po-sechead"><h2 class="po-h2" data-reveal>Au journal</h2><a class="po-link" href="/journal">Tous les textes ${arrow}</a></div><ul class="po-jlist">
    ${[["Mars", "Rituels", "Pourquoi la pierre chaude détend plus vite", "5 min"], ["Février", "Peau", "Les gestes d'une routine de soir en trois minutes", "4 min"], ["Janvier", "Souffle", "Respirer lentement : un exercice avant le soin", "3 min"]].map(([d, k, t, r]) => `<li data-reveal><a class="po-j" href="/journal"><span class="po-j-d">${d}</span><span class="po-j-k">${k}</span><span class="po-j-t">${t}</span><span class="po-j-r">${r}</span></a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="po-end pk-bleed"><div class="po-wrap po-center"><h2 class="po-display po-display--s" data-reveal>Un moment,<br><em>rien qu'à vous.</em></h2><p class="po-lead" data-reveal>Écrivez-nous : nous vous proposons un créneau et préparons la cabine.</p><a class="po-btn" href="/contact" data-reveal>Prendre rendez-vous ${arrow}</a></div></section>`),
  sec(footer(c)),
];

/* ---------- soins : catalogue signature ---------- */
const soins = (c) => [
  sec(header(c)),
  pagehead("Le catalogue de soins", "Choisir<br>ses soins", "Filtrez par famille ou par durée, triez, puis ajoutez ce qui vous tente : votre rituel se compose à côté."),
  sec(`<section class="po-cat pk-bleed" aria-label="Catalogue de soins"><div class="po-wrap">
    <div class="po-tools" role="group" aria-label="Filtres du catalogue">
      <div class="po-fgroup"><span class="po-flabel">Famille</span><div class="po-chips"><a href="#toutes" class="is-on" data-fcat="all" role="button" aria-pressed="true">Tous</a>${CATS.map(([k, n]) => `<a href="#${k}" data-fcat="${k}" role="button" aria-pressed="false">${n}</a>`).join("")}</div></div>
      <div class="po-fgroup"><span class="po-flabel">Durée</span><div class="po-chips"><a href="#toutes-durees" class="is-on" data-fdur="all" role="button" aria-pressed="true">Toutes</a><a href="#court" data-fdur="short" role="button" aria-pressed="false">45 min et moins</a><a href="#moyen" data-fdur="mid" role="button" aria-pressed="false">50 à 75 min</a><a href="#long" data-fdur="long" role="button" aria-pressed="false">90 min et plus</a></div></div>
      <div class="po-fgroup"><span class="po-flabel">Trier</span><div class="po-chips"><a href="#ordre" class="is-on" data-sort="order" role="button" aria-pressed="true">Le catalogue</a><a href="#tri-duree" data-sort="min" role="button" aria-pressed="false">Durée</a><a href="#tri-tarif" data-sort="prix" role="button" aria-pressed="false">Tarif</a><a href="#tri-nom" data-sort="nom" role="button" aria-pressed="false">A à Z</a></div></div></div>
    <div class="po-cat-grid"><div><p class="po-count" role="status" aria-live="polite"><b data-n>12</b> soins affichés</p>
      <ol class="po-soins" data-list>${SOINS.map(soinRow).join("")}</ol><p class="po-empty" data-empty hidden>Aucun soin ne correspond à ces filtres. Essayez « Tous » ou « Toutes ».</p></div>
      <aside class="po-ritual" aria-label="Mon rituel" data-ritual><div class="po-r-in"><p class="po-kicker">Mon rituel</p><h2 class="po-r-h">Votre sélection</h2>
        <p class="po-r-empty" data-r-empty>Rien pour l'instant. Ajoutez un soin avec « Ajouter ».</p><ol class="po-r-list" data-r-list aria-live="polite"></ol>
        <div class="po-r-bar" aria-hidden="true" data-r-bar></div>
        <dl class="po-r-tot"><div><dt>Durée totale</dt><dd data-r="dur">0 min</dd></div><div><dt>Total de démonstration</dt><dd data-r="prix">0 €</dd></div></dl>
        <p class="po-r-note">Durées et tarifs indicatifs d'un site de démonstration : aucune réservation ni paiement n'est enregistré ici.</p>
        <a class="po-btn po-btn--block" href="/contact" data-send>Envoyer mon rituel ${arrow}</a><a class="po-link po-r-clear" href="#vider" data-clear>Vider ma sélection</a></div></aside></div></div>
    <a class="po-chipbar" href="#rituel" data-goto-ritual hidden><b data-r="n">0</b> soin · <span data-r="dur">0 min</span> · <span data-r="prix">0 €</span></a></section>`),
  sec(footer(c)),
];

/* ---------- soin (détail) ---------- */
const soin = (c) => [
  sec(header(c)),
  sec(`<section class="po-det pk-bleed"><div class="po-wrap po-det-in"><div class="po-det-copy"><p class="po-kicker" data-reveal>Corps · soin signature</p><div class="po-title po-title--l" role="heading" aria-level="1" data-reveal>Pierres chaudes</div>${wave}
      <p class="po-lead" data-reveal>Des galets de basalte chauffés à 48 °C glissent sur le dos, les jambes et le ventre, puis se posent le long de la colonne. La chaleur travaille, les mains accompagnent.</p>
      <dl class="po-spec" data-reveal><div><dt>Durée</dt><dd>75 min</dd></div><div><dt>Tarif de démonstration</dt><dd>110 €</dd></div><div><dt>Cabine</dt><dd>Marbre, lumière tamisée</dd></div><div><dt>Pour qui</dt><dd>Tensions, fatigue, hiver</dd></div></dl>
      <div class="po-cta" data-reveal><a class="po-btn" href="/contact">Demander ce soin ${arrow}</a><a class="po-link" href="/soins">Composer un rituel</a></div></div>
    <div class="po-det-fig" data-reveal><div class="po-pebble-frame po-pebble-frame--b">${heroArt()}</div></div></div></section>`),
  sec(`<section class="po-steps pk-bleed"><div class="po-wrap"><h2 class="po-h2" data-reveal>Le déroulé</h2><ol class="po-timeline">
    ${[["0", "Accueil", "Thé tiède, questions sur vos tensions, choix de l'huile."], ["10", "Installation", "Linge chaud, lumière basse, première respiration lente."], ["20", "Pierres glissées", "Les galets chauds parcourent le dos puis les jambes."], ["55", "Pierres posées", "Le long de la colonne, quelques minutes d'immobilité."], ["70", "Retour", "Eau tiède, tisane, temps de repos sans parole."]].map(([m, t, x]) => `<li data-reveal><span class="po-tl-m">${m}<small>min</small></span><div><h3>${t}</h3><p>${x}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="po-good pk-bleed"><div class="po-wrap po-split"><div><h2 class="po-h2" data-reveal>Bon à savoir</h2></div><ul class="po-notes">
    <li data-reveal><b>Avant</b><span>Venez dix minutes en avance, sans repas lourd. Prévenez-nous en cas de grossesse, de varices ou d'allergie aux huiles.</span></li>
    <li data-reveal><b>Pendant</b><span>La température se règle à tout moment : un mot ou un geste suffit.</span></li>
    <li data-reveal><b>Après</b><span>Buvez de l'eau tiède et gardez la soirée calme.</span></li></ul></div></section>`),
  sec(`<section class="po-more pk-bleed"><div class="po-wrap"><div class="po-sechead"><h2 class="po-h2" data-reveal>Pour poursuivre</h2></div><ul class="po-lines-list">${[SOINS[4], SOINS[2], SOINS[10]].map(([id, nom, , min, prix], i) => `<li data-reveal><a class="po-line" href="/soins"><span class="po-line-n">${String(i + 1).padStart(2, "0")}</span><span class="po-line-t">${esc(nom)}</span><span class="po-line-dots" aria-hidden="true"></span><span class="po-line-d">${min} min</span><span class="po-line-p">${prix} €</span></a></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

/* ---------- rituels (forfaits en frises de durée) ---------- */
const RITUELS = [
  ["Rituel Respiration", "Une pause de deux heures pour souffler.", 120, 175, [["Vapeur", 30, 1], ["Gommage", 30, 2], ["Massage lent", 60, 3]]],
  ["Rituel Galet & Vapeur", "Notre rituel de saison, du bain tiède aux pierres.", 150, 235, [["Vapeur", 30, 1], ["Gommage", 30, 2], ["Pierres", 75, 4], ["Thé", 15, 5]]],
  ["Rituel Marbre en duo", "Une demi-journée à deux dans la cabine de marbre.", 210, 420, [["Hammam", 45, 1], ["Gommage", 30, 2], ["Pierres", 90, 4], ["Visage", 45, 3]]],
];
const rituels = (c) => [
  sec(header(c)),
  pagehead("Forfaits et parcours", "Les rituels", "Des enchaînements pensés pour durer : chaque frise montre le temps passé dans chaque geste."),
  sec(`<section class="po-rit pk-bleed"><div class="po-wrap"><ol class="po-rit-list">${RITUELS.map(([n, x, min, prix, segs], i) => `<li class="po-rit-i" data-reveal><div class="po-rit-h"><span class="po-rit-n">${String(i + 1).padStart(2, "0")}</span><div><h2 class="po-h3">${n}</h2><p>${x}</p></div><p class="po-rit-p"><span>${Math.floor(min / 60)} h ${min % 60 ? String(min % 60).padStart(2, "0") : "00"}</span><b>dès ${prix} €</b></p></div>
    <ul class="po-seglist" aria-label="Déroulé du rituel">${segs.map(([t, m, tone]) => `<li class="po-seg" data-tone="${tone}" data-w="${m}"><span>${t}</span><small>${m} min</small></li>`).join("")}</ul>
    <div class="po-rit-a"><a class="po-link" href="/contact">Demander ce rituel ${arrow}</a></div></li>`).join("")}</ol>
    <p class="po-fine" data-reveal>Tarifs et durées de démonstration. Un rituel sur mesure se compose dans <a class="po-link" href="/soins">le catalogue de soins</a>.</p></div></section>`),
  sec(`<section class="po-incl pk-bleed"><div class="po-wrap po-split"><h2 class="po-h2" data-reveal>Toujours inclus</h2><ul class="po-ticks">${["Un accueil avec thé tiède", "Une cabine privée avec douche", "Linge, peignoir et chaussons", "Un temps de repos sans parole", "Une tisane pour la sortie"].map((t) => `<li data-reveal>${t}</li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

/* ---------- l'institut ---------- */
const institut = (c) => [
  sec(header(c)),
  pagehead("L'institut", "Un lieu<br>qui ralentit", "Ouvert en 2012 dans un ancien atelier de taille de pierre, au cœur de Lyon."),
  sec(`<section class="po-story pk-bleed"><div class="po-wrap po-story-in"><div class="po-story-fig" data-reveal><div class="po-pebble-frame po-pebble-frame--c">${heroArt()}</div></div><div class="po-story-t"><p class="po-lead" data-reveal>L'atelier taillait autrefois du marbre pour les cheminées. Nous avons gardé les dalles, la poussière claire dans la lumière et le silence.</p>
    <p data-reveal>Six cabines, un hammam, un salon de repos où personne ne parle fort. Les pierres sont chauffées chaque matin, les huiles sont mélangées sur place, les serviettes sont lavées à basse température.</p><p data-reveal>Nous donnons peu de soins par jour, volontairement : chaque rendez-vous commence et finit sans compte à rebours.</p></div></div></section>`),
  sec(`<section class="po-vals pk-bleed"><div class="po-wrap"><h2 class="po-h2 po-center" data-reveal>Nos trois principes</h2><ol class="po-vals-in">
    ${[["La lenteur", "Chaque geste est tenu plus longtemps qu'il n'est nécessaire. C'est le but."], ["La chaleur juste", "Pierres à 48 °C, cabines à 24 °C, eau à la main : tout est contrôlé, jamais forcé."], ["Le silence choisi", "On parle si vous le souhaitez. Sinon, la cabine se tait avec vous."]].map(([t, x], i) => `<li data-reveal><span>${String(i + 1).padStart(2, "0")}</span><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="po-team pk-bleed"><div class="po-wrap"><h2 class="po-h2" data-reveal>L'équipe</h2><ul class="po-team-in">
    ${[["Élise Martin", "Fondatrice, praticienne", "ém"], ["Naïma Benali", "Responsable des soins du corps", "nb"], ["Camille Roux", "Esthéticienne visage", "cr"], ["Jeanne Dufour", "Mains, pieds, accueil", "jd"]].map(([n, r, ini]) => `<li data-reveal><span class="po-ini" aria-hidden="true">${ini}</span><h3>${n}</h3><p>${r}</p></li>`).join("")}</ul><p class="po-fine">Prénoms et noms fictifs, pour la démonstration.</p></div></section>`),
  sec(`<section class="po-hours pk-bleed"><div class="po-wrap po-split"><div><h2 class="po-h2" data-reveal>Horaires &amp; accès</h2><address class="po-addr" data-reveal>12 rue des Galets<br>69002 Lyon<br><a class="po-link" href="mailto:bonjour@poudre-demo.example">bonjour@poudre-demo.example</a></address></div>
    <table class="po-table" data-reveal><caption class="po-sr">Horaires d'ouverture</caption><thead><tr><th scope="col">Jour</th><th scope="col">Ouverture</th></tr></thead><tbody><tr><th scope="row">Lundi</th><td>Fermé</td></tr><tr><th scope="row">Mardi – vendredi</th><td>10 h – 19 h</td></tr><tr><th scope="row">Samedi</th><td>9 h – 18 h</td></tr><tr><th scope="row">Dimanche</th><td>Fermé</td></tr></tbody></table></div></section>`),
  sec(footer(c)),
];

/* ---------- cartes cadeaux (explication seulement, aucune vente) ---------- */
const card = (t, s) => `<svg class="po-gcard" viewBox="0 0 240 150" role="img" aria-label="Carte cadeau ${t}"><title>Carte cadeau ${t}</title><rect x="2" y="2" width="236" height="146" rx="16" fill="#f1e1da" stroke="#c9a79a" stroke-width="1.2"/><path d="M2 100c40-26 74 14 118-8s80 10 118-6v52a16 16 0 0 1-16 16H18A16 16 0 0 1 2 134z" fill="#e0c6bb" opacity=".7"/><path d="M20 60c20-14 30 8 50-2s30 8 50-2" fill="none" stroke="#a98f86" stroke-width="1" opacity=".6"/>${pebble(188, 58, 28, 9, "#b9a094", "#e8d8cf", "#5b4640")}${pebble(190, 42, 18, 6, "#c9a79a", "#f1ddd5", "#7a5448")}</svg>`;
const cartes = (c) => [
  sec(header(c)),
  pagehead("Offrir un temps", "Cartes<br>cadeaux", "Une façon simple d'offrir du silence. Nous préparons chaque carte avec vous : le montant, le soin, le mot."),
  sec(`<section class="po-gift pk-bleed"><div class="po-wrap"><ul class="po-gift-in">
    <li data-reveal>${card("montant libre")}<h2 class="po-h3">Montant libre</h2><p>Vous choisissez la somme ; la personne choisit son soin. Pratique quand on ne connaît pas ses goûts.</p></li>
    <li data-reveal>${card("soin choisi")}<h2 class="po-h3">Un soin choisi</h2><p>Un soin du catalogue, avec sa durée, glissé dans une enveloppe de papier de soie.</p></li>
    <li data-reveal>${card("rituel en duo")}<h2 class="po-h3">Un rituel en duo</h2><p>Pour offrir à deux : la cabine de marbre et le thé partagé ensuite.</p></li></ul></div></section>`),
  sec(`<section class="po-flow pk-bleed"><div class="po-wrap"><h2 class="po-h2" data-reveal>Comment ça se passe</h2><ol class="po-flow-in">
    ${[["Écrivez-nous", "Par le formulaire de contact : indiquez le soin ou le montant imaginé."], ["Nous répondons", "Sous deux jours ouvrés, avec les modalités de la carte."], ["Nous préparons", "La carte est rédigée, pliée et prête à être remise en main propre ou envoyée."], ["Elle est utilisée", "La personne choisit son créneau, sans limite de temps trop courte."]].map(([t, x], i) => `<li data-reveal><span>${String(i + 1).padStart(2, "0")}</span><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol>
    <p class="po-note" data-reveal>Ce site de démonstration ne vend aucune carte et n'enregistre aucun paiement. Le formulaire de contact transmet seulement votre demande.</p><a class="po-btn" href="/contact" data-reveal>Écrire pour une carte cadeau ${arrow}</a></div></section>`),
  sec(`<section class="po-faq pk-bleed"><div class="po-wrap po-split"><h2 class="po-h2" data-reveal>Questions</h2><div>
    <details data-reveal><summary>Combien de temps la carte est-elle valable ?</summary><p>Les modalités de validité sont à définir avec l'institut au moment de votre demande.</p></details>
    <details data-reveal><summary>Peut-on l'utiliser à plusieurs reprises ?</summary><p>Oui, un montant libre peut être utilisé en plusieurs fois ; le solde est noté sur la carte.</p></details>
    <details data-reveal><summary>Peut-on l'offrir à distance ?</summary><p>Oui : nous pouvons l'envoyer sous enveloppe avec votre mot. Précisez-le dans votre message.</p></details></div></div></section>`),
  sec(footer(c)),
];

/* ---------- journal ---------- */
const TEXTES = [
  ["12 mars", "Rituels", "Pourquoi la pierre chaude détend plus vite", "5 min", "La chaleur profonde fait baisser le tonus des muscles avant même que la main n'appuie. C'est pourquoi nous commençons toujours par poser les pierres, puis seulement par masser."],
  ["26 février", "Peau", "Les gestes d'une routine de soir en trois minutes", "4 min", "Un lait doux, une eau florale, une huile : le tout en dessinant des cercles lents, du centre vers l'extérieur du visage. Le geste compte plus que le produit."],
  ["14 janvier", "Souffle", "Respirer lentement : un exercice avant le soin", "3 min", "Inspirez sur quatre temps, retenez deux, expirez sur six. Répétez cinq fois, assis, les mains sur les cuisses. Le soin commence déjà."],
  ["3 décembre", "Matières", "Le marbre et le sel : deux saisons de cabine", "6 min", "En hiver, le marbre garde la chaleur des pierres ; en été, il fraîchit la pièce. Le sel de roche, lui, change de grain avec la saison."],
  ["20 octobre", "Rituels", "Préparer son corps à un soin de vapeur", "4 min", "Mangez léger, buvez une tisane tiède, évitez le café. La vapeur travaille mieux sur un corps qui n'est pas pressé."],
];
const journal = (c) => [
  sec(header(c)),
  pagehead("Le journal", "Textes<br>lents", "Quelques pages sur la peau, le souffle et les gestes de l'institut."),
  sec(`<section class="po-jour pk-bleed"><div class="po-wrap"><div class="po-jfeat" data-reveal><div class="po-jfeat-art">${stack(1.6)}</div><div><p class="po-kicker">À lire en premier · ${TEXTES[0][1]}</p><h2 class="po-h2">${TEXTES[0][2]}</h2><p class="po-lead">${TEXTES[0][4]}</p><p class="po-fine">${TEXTES[0][0]} · ${TEXTES[0][3]} de lecture</p></div></div>
    <ul class="po-jrows">${TEXTES.slice(1).map(([d, k, t, r, x]) => `<li data-reveal><details><summary><span class="po-j-d">${d}</span><span class="po-j-k">${k}</span><span class="po-j-t">${t}</span><span class="po-j-r">${r}</span></summary><p>${x}</p></details></li>`).join("")}</ul></div></section>`),
  sec(`<section class="po-end pk-bleed"><div class="po-wrap po-center"><h2 class="po-display po-display--s" data-reveal>Une question<br><em>sur un soin ?</em></h2><a class="po-btn" href="/contact" data-reveal>Nous écrire ${arrow}</a></div></section>`),
  sec(footer(c)),
];

/* ---------- pages système ---------- */
const contact = (c) => [sec(header(c)), pagehead("Prendre rendez-vous", "Écrivez-nous", "Un soin, un rituel, une carte cadeau : dites-nous ce qui vous ferait du bien."),
  { type: "form", heading: "Votre demande", intro: "Si vous avez composé un rituel dans le catalogue, son résumé est déjà dans le message. Nous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une envie ?", "Un soin, un rituel, un texte du journal."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un soin, un rituel…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="po-nf pk-bleed">${stack(1.4)}<div class="po-title" role="heading" aria-level="1">Page introuvable</div>${wave}<p class="po-sub">Cette page s'est évaporée, ou a changé d'adresse.</p><a class="po-btn" href="/">Retour à l'accueil ${arrow}</a></section>`), sec(footer(c))];

module.exports = {
  key: "poudre", name: "Poudre", version: "2.0.0", category: "beaute", tags: ["minimaliste", "naturel", "luxe"], siteType: "Spa et institut de beauté", featured: false,
  concept: "Un spa de pierre et de marbre où tout ralentit : hero minéral dessiné, catalogue de soins en lignes aérées, et un rituel que l'on compose soi-même.",
  description: "Spa et institut : rose poudré, grège et bronze doux, pierres empilées, marbre veiné et vapeur très lente. Catalogue de soins filtrable avec durées et tarifs de démonstration, composition de « mon rituel » envoyée au contact.",
  brand: "Poudre Spa & Institut", modules: ["formulaires", "recherche"],
  dna: { header: "barre-centree-minimale-et-menu-discret-en-nappe", hero: "gros-plan-mineral-pierres-empilees-marbre-et-vapeur", grid: "catalogue-de-soins-en-lignes-aerees-a-pointilles", motion: "vapeur-montante-tres-lente-et-apparition-douce", shapes: "pierres-ovales-veines-de-marbre-et-filets-poudres", rhythm: "contemplatif-tres-espace", signature: "catalogue-de-soins-et-composition-de-mon-rituel" },
  tokens: {
    colors: { primary: "#8a5a4a", secondary: "#3a2f2c", accent: "#c9a79a", background: "#f3e9e3", surface: "#fbf6f2", text: "#3a2f2c", muted: "#6b5e58", success: "#4f6b4a", warning: "#8a5a1a", error: "#a63d3d" },
    fonts: { heading: "font.gilda-display", body: "font.raleway", button: "font.raleway", link: "font.raleway" },
    radius: { sm: 8, md: 16, lg: 32, button: 999, field: 14, card: 32 }, shadow: { card: "0 18px 50px rgba(90,60,50,.10)", button: "none" }, border: { width: 1, color: "#d9c7bd" },
    type: { h1: { size: 88, weight: 400, lineHeight: 1.02, transform: "none" }, h2: { size: 48, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Bronze doux", type: "color", default: "#8a5a4a" },
    { key: "fond", label: "Fond poudré", type: "color", default: "#f3e9e3" },
    { key: "vapeur", label: "Vapeur animée", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masquée"]] },
    { key: "veines", label: "Veines de marbre", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masquées"]] },
    { key: "air", label: "Aération (%)", type: "range", default: 100, min: 80, max: 130, step: 10 },
  ],
  menu: [["Accueil", "/"], ["Soins", "/soins"], ["Rituels", "/rituels"], ["L'institut", "/institut"], ["Cartes cadeaux", "/cartes-cadeaux"], ["Journal", "/journal"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "soins", name: "Soins", render: soins }, { key: "soin", name: "Soin", render: soin }, { key: "rituels", name: "Rituels", render: rituels },
    { key: "institut", name: "L'institut", render: institut }, { key: "cartes-cadeaux", name: "Cartes cadeaux", render: cartes }, { key: "journal", name: "Journal", render: journal },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
