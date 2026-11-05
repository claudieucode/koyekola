// Épiderme — marque de soins fictive, « laboratoire de beauté ». Direction artistique : clinique et sensorielle. Blanc cassé, pêche, corail doux et vert d'eau ;
// textures vues en gros plan (gouttes, gels, crèmes, perles) dessinées en CSS et SVG ; diagnostic de routine en 5 étapes, fiches de formule, glossaire d'ingrédients filtrable.
// Aucune allégation médicale : on décrit des textures, des gestes et des listes d'ingrédients, jamais un résultat promis.
const { sec, esc } = require("../kit");

/* ---------- catalogue (formules fictives de démonstration) ---------- */
const CATS = [["nettoyer", "Nettoyer"], ["serum", "Sérums"], ["creme", "Crèmes"], ["masque", "Masques"]];
const PEACH = ["#f6c3ae", "#c04630"], MINT = ["#cfe8de", "#1f4f45"], CREAM = ["#f3e6d6", "#8a6a4a"], ROSE = ["#f2b5a3", "#7a3a2e"], SAGE = ["#b9d8c9", "#2c5a50"], SAND = ["#ecd3b4", "#6f5236"];
const P = [
  { id: "gel-rosee", n: "Gel Rosée", cat: "nettoyer", t: "gel", tl: "Gel fondant", fmt: "150 ml", kind: "pump", col: PEACH, slot: "clean", skin: "seche normale mixte grasse", need: "-", flags: "-", when: "Matin et soir",
    d: "Un gel transparent qui mousse à peine, rincé en quelques gestes. Il laisse la peau propre sans sensation de tiraillement au toucher.",
    ing: ["aqua", "glycerine", "panthenol", "aloe", "xanthane", "citrique"], use: ["Humidifier le visage à l'eau tiède.", "Émulsionner une noisette de gel entre les paumes.", "Masser 30 secondes, éviter le contour des yeux, rincer."], g: [8, 9, 2] },
  { id: "mousse-perle", n: "Mousse Perle", cat: "nettoyer", t: "mousse", tl: "Mousse aérienne", fmt: "120 ml", kind: "tube", col: MINT, slot: "clean", skin: "normale mixte grasse", need: "-", flags: "-", when: "Matin et soir",
    d: "Une mousse dense en petites perles, au toucher frais. Elle se rince sans laisser de film.",
    ing: ["aqua", "glycerine", "kaolin", "allantoine", "citrique", "benzoate"], use: ["Déposer une noisette sur peau humide.", "Faire mousser du bout des doigts, en mouvements circulaires.", "Rincer abondamment à l'eau tiède."], g: [7, 10, 2] },
  { id: "baume-fondant", n: "Baume Fondant", cat: "nettoyer", t: "baume", tl: "Baume huileux", fmt: "90 ml", kind: "jar", col: CREAM, slot: "clean", skin: "seche normale", need: "-", flags: "huile", when: "Soir",
    d: "Un baume qui fond en huile soyeuse au contact de la peau, pour le démaquillage du soir. S'émulsionne à l'eau en lait léger.",
    ing: ["jojoba", "amande", "candelilla", "tocopherol", "squalane", "aqua"], use: ["Chauffer une noix de baume entre les doigts.", "Appliquer sur peau sèche, masser lentement.", "Ajouter un peu d'eau, émulsionner, rincer."], g: [4, 3, 9] },
  { id: "serum-goutte", n: "Sérum Goutte 01", cat: "serum", t: "serum", tl: "Sérum aqueux", fmt: "30 ml", kind: "dropper", col: PEACH, slot: "serum", skin: "seche normale mixte grasse", need: "hydra confort", flags: "-", when: "Matin et soir",
    d: "Un sérum clair qui file sur la peau comme une goutte d'eau. Formule courte autour de deux humectants, sans parfum ajouté.",
    ing: ["aqua", "hyaluronate", "glycerine", "panthenol", "xanthane", "benzoate"], use: ["Sur peau propre, déposer 3 à 4 gouttes dans la paume.", "Presser doucement sur le visage et le cou.", "Laisser absorber une minute avant la crème."], g: [10, 7, 2] },
  { id: "serum-aurore", n: "Sérum Aurore 02", cat: "serum", t: "serum", tl: "Sérum satiné", fmt: "30 ml", kind: "dropper", col: ROSE, slot: "serum", skin: "seche normale mixte grasse", need: "eclat", flags: "-", when: "Matin",
    d: "Un sérum fluide à la teinte pêche, aux reflets doux. Sa formule associe un dérivé stable de vitamine C à un humectant.",
    ing: ["aqua", "ascorbyl", "glycerine", "tocopherol", "citrique", "benzoate"], use: ["Le matin, sur peau propre et sèche.", "Appliquer 3 gouttes sur le visage, en tapotant.", "Poursuivre avec la crème."], g: [9, 6, 3] },
  { id: "serum-satin", n: "Sérum Satin 03", cat: "serum", t: "gel", tl: "Gel-sérum mat", fmt: "30 ml", kind: "dropper", col: SAGE, slot: "serum", skin: "normale mixte grasse", need: "mat", flags: "-", when: "Matin et soir",
    d: "Un gel-sérum vert d'eau au fini poudré, pensé pour les peaux qui brillent vite en fin de journée. Niacinamide et silice.",
    ing: ["aqua", "niacinamide", "silice", "glycerine", "xanthane", "benzoate"], use: ["Sur peau propre, appliquer 2 pressions.", "Étaler du centre du visage vers l'extérieur.", "Compléter avec une crème légère."], g: [7, 8, 3] },
  { id: "voile-lactique", n: "Voile Lactique 04", cat: "serum", t: "serum", tl: "Voile exfoliant", fmt: "30 ml", kind: "dropper", col: SAND, slot: "serum", skin: "normale mixte grasse", need: "grain", flags: "acide", when: "Soir, 2 fois par semaine",
    d: "Un voile léger à l'acide lactique pour lisser le toucher de la peau. À réserver au soir et à introduire progressivement.",
    ing: ["aqua", "lactique", "glycerine", "allantoine", "xanthane", "benzoate"], use: ["Le soir, sur peau propre et sèche, 2 fois par semaine au début.", "Appliquer une fine couche, éviter le contour des yeux.", "Ne pas rincer ; utiliser une crème ensuite."], g: [9, 5, 2] },
  { id: "creme-nuage", n: "Crème Nuage", cat: "creme", t: "creme", tl: "Crème légère", fmt: "50 ml", kind: "jar", col: MINT, slot: "cream", skin: "normale mixte", need: "-", flags: "-", when: "Matin et soir",
    d: "Une crème blanche qui se fond en un instant, ni grasse ni collante. Texture de chantilly fouettée.",
    ing: ["aqua", "squalane", "glycerine", "cetylique", "tocopherol", "benzoate"], use: ["Réchauffer une noisette entre les doigts.", "Poser sur le visage, lisser vers les tempes.", "Terminer par le cou."], g: [6, 6, 5] },
  { id: "creme-cocon", n: "Crème Cocon", cat: "creme", t: "creme", tl: "Crème riche", fmt: "50 ml", kind: "jar", col: CREAM, slot: "cream", skin: "seche normale", need: "confort", flags: "huile", when: "Matin et soir",
    d: "Une crème épaisse et enveloppante au beurre de karité. Elle laisse un voile confortable sur les peaux qui se sentent tendues.",
    ing: ["aqua", "karite", "squalane", "glycerine", "cetylique", "tocopherol"], use: ["Prélever une noisette avec la spatule.", "Réchauffer entre les paumes, presser sur le visage.", "Insister sur les zones qui tiraillent."], g: [2, 3, 10] },
  { id: "gelee-fraiche", n: "Gelée Fraîche", cat: "creme", t: "gel", tl: "Gel-crème", fmt: "50 ml", kind: "tube", col: SAGE, slot: "cream", skin: "mixte grasse", need: "mat", flags: "-", when: "Matin et soir",
    d: "Un gel-crème translucide et frais, sans huile ajoutée. Il s'étale comme une gelée et disparaît à l'application.",
    ing: ["aqua", "aloe", "glycerine", "hyaluronate", "silice", "benzoate"], use: ["Presser une petite quantité dans la paume.", "Étaler en couche fine sur tout le visage.", "Renouveler le soir si la peau le demande."], g: [9, 10, 1] },
  { id: "masque-argile", n: "Masque Argile Menthe", cat: "masque", t: "argile", tl: "Masque à l'argile", fmt: "75 ml", kind: "tube", col: SAGE, slot: "mask", skin: "normale mixte grasse", need: "-", flags: "-", when: "1 à 2 fois par semaine",
    d: "Une pâte verte d'argile blanche, onctueuse et fraîche à l'application. Se rince à l'eau tiède.",
    ing: ["kaolin", "aqua", "glycerine", "aloe", "xanthane", "benzoate"], use: ["Étaler une couche généreuse sur peau propre.", "Laisser poser 8 à 10 minutes, sans laisser sécher complètement.", "Rincer à l'eau tiède, tamponner."], g: [4, 8, 6] },
  { id: "masque-nuit", n: "Masque Nuit Perlée", cat: "masque", t: "creme", tl: "Crème-masque de nuit", fmt: "50 ml", kind: "jar", col: ROSE, slot: "mask", skin: "seche normale mixte grasse", need: "-", flags: "-", when: "1 à 2 fois par semaine, le soir",
    d: "Une crème-masque nacrée qui se pose en couche fine avant la nuit. Elle laisse un toucher souple au réveil.",
    ing: ["aqua", "glycerine", "squalane", "centella", "hyaluronate", "tocopherol"], use: ["Le soir, après le sérum, appliquer une couche fine.", "Ne pas rincer.", "Au réveil, rincer à l'eau tiède si besoin."], g: [6, 5, 7] },
];
const PID = Object.fromEntries(P.map((p) => [p.id, p]));

/* ---------- glossaire (descriptions de rôle dans la formule, jamais d'effet promis) ---------- */
const FAM = [["hydra", "Hydratants"], ["apais", "Apaisants"], ["gras", "Corps gras"], ["actif", "Actifs"], ["mineral", "Minéraux"], ["tex", "Texture & conservation"]];
const ING = {
  aqua: ["Eau purifiée", "Aqua", "tex", "La base de presque toutes nos formules : elle dissout les humectants et porte la texture."],
  glycerine: ["Glycérine", "Glycerin", "hydra", "Un humectant classique : il retient l'eau en surface et donne au gel son toucher souple."],
  hyaluronate: ["Acide hyaluronique", "Sodium Hyaluronate", "hydra", "Une longue molécule qui fixe l'eau et donne aux sérums leur fluidité filante."],
  aloe: ["Aloé vera", "Aloe Barbadensis Leaf Juice", "hydra", "Le jus de feuille apporte de la fraîcheur et un toucher léger aux gels."],
  panthenol: ["Panthénol", "Panthenol", "apais", "Un composé doux issu de la vitamine B5, utilisé pour le confort de la formule."],
  allantoine: ["Allantoïne", "Allantoin", "apais", "Une poudre fine, courante dans les soins pour peaux sensibles, appréciée pour son toucher doux."],
  centella: ["Centella asiatica", "Centella Asiatica Extract", "apais", "Un extrait de plante traditionnel dans les soins de confort."],
  niacinamide: ["Niacinamide", "Niacinamide", "actif", "Une forme de vitamine B3. Elle structure nos gels-sérums au fini poudré."],
  ascorbyl: ["Glucoside d'ascorbyle", "Ascorbyl Glucoside", "actif", "Un dérivé stable de la vitamine C, plus facile à formuler que la forme pure."],
  lactique: ["Acide lactique", "Lactic Acid", "actif", "Un acide doux qui lisse le toucher de la peau. À introduire progressivement ; déconseillé en cas de sensibilité aux acides."],
  tocopherol: ["Vitamine E", "Tocopherol", "actif", "Un antioxydant qui protège les huiles de la formule de l'oxydation."],
  squalane: ["Squalane", "Squalane", "gras", "Un corps gras très léger, d'origine végétale, au toucher sec et soyeux."],
  karite: ["Beurre de karité", "Butyrospermum Parkii Butter", "gras", "Un beurre riche qui donne aux crèmes confortables leur corps."],
  jojoba: ["Huile de jojoba", "Simmondsia Chinensis Seed Oil", "gras", "En réalité une cire liquide ; elle forme la base des baumes démaquillants."],
  amande: ["Huile d'amande douce", "Prunus Amygdalus Dulcis Oil", "gras", "Une huile classique, fluide et peu odorante."],
  candelilla: ["Cire de candelilla", "Candelilla Cera", "gras", "Une cire végétale qui solidifie les baumes sans ajouter de pétrole."],
  cetylique: ["Alcool cétylique", "Cetyl Alcohol", "tex", "Un corps gras doux qui épaissit les crèmes et les stabilise ; ce n'est pas un alcool qui assèche."],
  kaolin: ["Kaolin (argile blanche)", "Kaolin", "mineral", "L'argile la plus douce : elle donne aux masques leur pâte onctueuse et aux mousses leur corps."],
  silice: ["Silice", "Silica", "mineral", "Des micro-sphères minérales qui donnent un toucher poudré et un fini mat."],
  xanthane: ["Gomme xanthane", "Xanthan Gum", "tex", "Un épaississant naturel obtenu par fermentation, qui donne aux gels leur tenue."],
  citrique: ["Acide citrique", "Citric Acid", "tex", "Ajuste l'acidité (pH) de la formule."],
  benzoate: ["Benzoate de sodium", "Sodium Benzoate", "tex", "Un conservateur : une formule à base d'eau en a besoin pour rester saine après ouverture."],
};
const used = (k) => P.filter((p) => p.ing.includes(k));

/* ---------- illustrations : formes translucides en couches (les dégradés viennent du CSS : aucun identifiant SVG n'est conservé) ---------- */
const bottle = (kind, [liq, cap], cls = "ep-bt") => {
  const hl = `<rect x="38" y="76" width="7" height="58" rx="3.5" fill="#fff" opacity=".55"/>`;
  const sh = `<ellipse cx="60" cy="164" rx="36" ry="5" fill="#26322f" opacity=".12"/>`;
  const body = {
    pump: `<rect x="32" y="64" width="56" height="98" rx="16" fill="${liq}"/><rect x="32" y="64" width="56" height="98" rx="16" fill="#fff" opacity=".22"/><rect x="32" y="112" width="56" height="50" rx="16" fill="${cap}" opacity=".12"/>${hl}<rect x="50" y="50" width="20" height="16" rx="3" fill="${cap}"/><rect x="56" y="26" width="8" height="26" fill="${cap}"/><path d="M42 20h38a4 4 0 0 1 4 4v6H42z" fill="${cap}"/><rect x="78" y="22" width="14" height="6" rx="3" fill="${cap}"/>`,
    dropper: `<rect x="34" y="68" width="52" height="94" rx="14" fill="${liq}"/><rect x="34" y="68" width="52" height="94" rx="14" fill="#fff" opacity=".2"/><rect x="34" y="120" width="52" height="42" rx="14" fill="${cap}" opacity=".12"/>${hl}<rect x="44" y="54" width="32" height="16" rx="3" fill="${cap}"/><path d="M49 54V32a11 11 0 0 1 22 0v22z" fill="${cap}" opacity=".85"/><path d="M54 50V34a6 6 0 0 1 4-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`,
    jar: `<rect x="22" y="58" width="76" height="26" rx="8" fill="${cap}"/><rect x="26" y="62" width="68" height="4" rx="2" fill="#fff" opacity=".3"/><rect x="26" y="82" width="68" height="80" rx="16" fill="${liq}"/><rect x="26" y="82" width="68" height="80" rx="16" fill="#fff" opacity=".22"/><rect x="26" y="126" width="68" height="36" rx="16" fill="${cap}" opacity=".12"/><rect x="33" y="92" width="7" height="52" rx="3.5" fill="#fff" opacity=".55"/>`,
    tube: `<path d="M38 156 42 50h36l4 106z" fill="${liq}"/><path d="M38 156 42 50h36l4 106z" fill="#fff" opacity=".22"/><rect x="46" y="22" width="28" height="30" rx="6" fill="${cap}"/><rect x="36" y="150" width="48" height="10" rx="2" fill="${cap}" opacity=".85"/><path d="M48 62 46 140" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5"/>`,
  }[kind];
  return `<svg class="${cls}" viewBox="0 0 120 172" aria-hidden="true">${sh}${body}</svg>`;
};
const dropIco = `<svg class="ep-dropico" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 2C12 2 3 13 3 19a9 9 0 0 0 18 0C21 13 12 2 12 2z" fill="currentColor"/><path d="M8 19a4 4 0 0 0 4 4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></svg>`;
const cartIco = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 11H7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const arrow = `<svg class="ep-arr" viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6h21m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const swirl = `<svg class="ep-swirl" viewBox="0 0 600 600" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke-linecap="round"><path d="M-20 420C80 330 150 470 260 400S420 260 520 330 620 280 640 250" stroke="#fff" stroke-width="64" opacity=".55"/><path d="M-20 460C90 380 160 510 270 440S430 310 530 380" stroke="#f6c3ae" stroke-width="26" opacity=".5"/><path d="M-30 150C70 90 150 200 250 140S410 40 500 100 600 80 640 60" stroke="#fff" stroke-width="54" opacity=".5"/><path d="M-30 180C80 130 150 230 250 170S410 80 500 135" stroke="#cfe8de" stroke-width="22" opacity=".7"/><path d="M100 640C120 540 220 520 300 560S480 640 560 540" stroke="#fff" stroke-width="40" opacity=".4"/></g></svg>`;
const ruler = `<svg class="ep-ruler" viewBox="0 0 220 20" aria-hidden="true"><g stroke="currentColor" stroke-width="1" fill="none"><path d="M2 14h216"/>${Array.from({ length: 23 }, (_, i) => `<path d="M${2 + i * 9.4} ${i % 5 === 0 ? 4 : 9}v10"/>`).join("")}</g></svg>`;

const ICON = {
  nettoyer: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8C32 8 14 30 14 42a18 18 0 0 0 36 0C50 30 32 8 32 8z" fill="#f6c3ae"/><path d="M24 42a8 8 0 0 0 8 8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/><circle cx="46" cy="14" r="4" fill="#cfe8de"/><circle cx="52" cy="26" r="2.5" fill="#cfe8de"/></svg>`,
  soigner: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="20" y="22" width="24" height="34" rx="7" fill="#cfe8de"/><rect x="26" y="14" width="12" height="10" rx="2" fill="#1f4f45"/><path d="M32 4v10" stroke="#1f4f45" stroke-width="4" stroke-linecap="round"/><rect x="25" y="28" width="4" height="20" rx="2" fill="#fff" opacity=".7"/><circle cx="50" cy="52" r="5" fill="#f6c3ae"/></svg>`,
  envelopper: `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="46" rx="26" ry="10" fill="#f3e6d6"/><path d="M8 40c4-18 44-18 48 0z" fill="#fff" opacity=".9"/><path d="M18 36c4-10 24-10 28 0" fill="none" stroke="#f6c3ae" stroke-width="3" stroke-linecap="round"/><path d="M22 30c2-8 18-8 20 0" fill="none" stroke="#c04630" stroke-width="2" stroke-linecap="round" opacity=".5"/></svg>`,
};

/* ---------- briques communes ---------- */
const add = (p, cls = "") => `<a class="ep-add${cls ? " " + cls : ""}" href="#ajouter" role="button" aria-pressed="false" data-add="${p.id}" data-name="${esc(p.n)}" data-slot="${p.cat}"><span class="ep-add-t">Ajouter à ma routine</span></a>`;
const card = (p, i = 0) => `<article class="ep-card" data-cat="${p.cat}" data-reveal>
  <a class="ep-pill ep-t-${p.t}" href="/produit#${p.id}"><span class="ep-pearl ep-pearl--a"></span>${bottle(p.kind, p.col)}<span class="ep-pill-tag">${p.tl}</span></a>
  <div class="ep-card-b"><p class="ep-eyebrow">${CATS.find((x) => x[0] === p.cat)[1]} · ${p.fmt}</p><h3 class="ep-card-t"><a href="/produit#${p.id}">${esc(p.n)}</a></h3><p class="ep-card-d">${p.d.split(".")[0]}.</p>
  <div class="ep-card-f">${add(p)}<a class="ep-more" href="/produit#${p.id}">Fiche ${arrow}</a></div></div></article>`;

const header = (c) => `<header class="ep-head pk-bleed"><div class="ep-bar">
  <a class="ep-logo" href="/" aria-label="Épiderme, accueil">${dropIco}<span class="ep-logo-w">épiderme</span></a>
  <div class="ep-links" role="navigation" aria-label="Navigation principale">${c.menu.filter((m) => m.url !== "/").map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div>
  <div class="ep-tools">
    <details class="ep-cart"><summary class="ep-cart-s" aria-label="Ma routine"><span class="ep-cart-i">${cartIco}</span><span class="ep-cart-l">Ma routine</span><span class="ep-cart-n" data-cart-n>0</span></summary>
      <div class="ep-cart-p"><p class="ep-cart-h">Ma routine <small>(sélection fictive)</small></p><ul class="ep-cart-ul" data-cart-list></ul><p class="ep-cart-empty" data-cart-empty>Rien pour l'instant. Ajoutez des formules depuis le catalogue ou lancez le diagnostic.</p>
      <div class="ep-cart-a"><a class="ep-btn ep-btn--s" href="/diagnostic">Diagnostic</a><a class="ep-btn ep-btn--s ep-btn--ghost" href="/contact">Demander cette routine</a></div><p class="ep-cart-note">Aucune commande n'est passée ici : la sélection s'envoie via le formulaire de contact.</p></div></details>
    <details class="ep-menu"><summary class="ep-menu-s" aria-label="Menu"><span class="ep-burger"><i></i><i></i></span><span class="ep-menu-l">Menu</span></summary>
      <div class="ep-menu-p" role="navigation" aria-label="Menu mobile">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}</div></details>
  </div></div></header>`;

const footer = (c) => `<footer class="ep-foot pk-bleed"><div class="ep-wrap ep-foot-g">
  <div class="ep-foot-b"><a class="ep-logo ep-logo--l" href="/">${dropIco}<span class="ep-logo-w">épiderme</span></a><p>Laboratoire de beauté fictif : des textures dessinées de très près, des formules courtes, des ingrédients expliqués.</p></div>
  <div><p class="ep-foot-h">Explorer</p><ul>${[["Produits", "/produits"], ["Diagnostic", "/diagnostic"], ["Ingrédients", "/ingredients"], ["Notre approche", "/approche"], ["Journal", "/journal"]].map(([l, u]) => `<li><a href="${u}">${l}</a></li>`).join("")}</ul></div>
  <div><p class="ep-foot-h">Contact</p><ul><li><a href="/contact">Écrire au laboratoire</a></li><li><a href="/recherche">Rechercher</a></li><li><a href="mailto:bonjour@epiderme.example">bonjour@epiderme.example</a></li></ul></div>
  <p class="ep-foot-n">Site de démonstration : Épiderme est une marque fictive. Les formules, ingrédients et conseils présentés sont des exemples, sans valeur médicale ; en cas de doute sur votre peau, demandez l'avis d'un professionnel de santé.</p></div></footer>`;

const pagehead = (kick, title, sub, mod = "") => sec(`<section class="ep-ph ep-ph--${mod || "a"} pk-bleed"><span class="ep-ph-b ep-ph-b1"></span><span class="ep-ph-b ep-ph-b2"></span><span class="ep-ph-b ep-ph-b3"></span><div class="ep-wrap"><p class="ep-eyebrow">${kick}</p><div class="ep-h1" role="heading" aria-level="1">${title}</div><p class="ep-lead">${sub}</p></div></section>`);

const journalData = [
  ["textures", "Textures", "Gel, crème, baume : lire une texture avant de l'essayer", "Cinq mots pour décrire ce que fait une formule sous le doigt : glisse, fondant, nacré, poudré, enveloppant.", "6 min", "/produits"],
  ["ingredients", "Ingrédients", "Lire une liste INCI sans se perdre", "Les ingrédients sont classés par proportion décroissante. Voici comment repérer l'essentiel en trente secondes.", "5 min", "/ingredients"],
  ["routines", "Routines", "Une routine de trois gestes, pas une de douze", "Nettoyer, soigner, envelopper : pourquoi la régularité compte plus que le nombre de produits.", "4 min", "/diagnostic"],
  ["coulisses", "Coulisses", "Dans le laboratoire : la journée d'un lot de gel", "De la pesée des poudres à la mise en tube, les étapes d'une petite production de démonstration.", "8 min", "/approche"],
  ["ingredients", "Ingrédients", "L'acide hyaluronique, une molécule qui aime l'eau", "Ce que fait réellement cet humectant dans un sérum et pourquoi nos formules n'en contiennent pas plus.", "5 min", "/ingredients"],
  ["routines", "Routines", "Introduire un acide doux : y aller progressivement", "Fréquence, moment de la journée et signaux d'alerte pour tester un exfoliant sans se précipiter.", "7 min", "/diagnostic"],
  ["textures", "Textures", "Pourquoi une crème se sent plus ou moins riche", "Eau, corps gras, émulsifiants : la recette d'une texture, expliquée avec des schémas.", "6 min", "/produit#creme-cocon"],
];

/* ---------- accueil ---------- */
const home = (c) => [sec(header(c)),
  sec(`<section class="ep-hero pk-bleed" data-hero><div class="ep-wrap ep-hero-g">
    <div class="ep-hero-t"><p class="ep-chip"><span class="ep-dot"></span>Laboratoire de beauté · démonstration</p>
      <div class="ep-h1 ep-h1--xl" role="heading" aria-level="1">La peau,<br>vue de <em>très près</em></div>
      <p class="ep-lead">Gels, crèmes et sérums dessinés comme des gros plans. Des formules courtes, des textures lisibles, des ingrédients expliqués un par un.</p>
      <div class="ep-cta"><a class="ep-btn" href="/diagnostic">Faire mon diagnostic ${arrow}</a><a class="ep-btn ep-btn--ghost" href="/produits">Voir les formules</a></div>
      <dl class="ep-facts"><div><dt>Formules</dt><dd><b data-count="${P.length}">${P.length}</b></dd></div><div><dt>Ingrédients par formule</dt><dd><b data-count="6">6</b></dd></div><div><dt>Parfum ajouté</dt><dd><b data-count="0">0</b></dd></div></dl></div>
    <div class="ep-macro" role="img" aria-label="Dessin en gros plan d'une goutte translucide pêche, entourée de perles et d'une crème étalée en volutes">
      <span class="ep-m-glow"></span>${swirl}
      <span class="ep-m-drip"></span>
      <span class="ep-m-lens"><span class="ep-m-in ep-m-in1"></span><span class="ep-m-in ep-m-in2"></span><span class="ep-m-in ep-m-in3"></span><span class="ep-m-spec"></span><span class="ep-m-caus"></span></span>
      <span class="ep-m-pearl ep-m-p1"></span><span class="ep-m-pearl ep-m-p2"></span><span class="ep-m-pearl ep-m-p3"></span><span class="ep-m-pearl ep-m-p4"></span><span class="ep-m-pearl ep-m-p5"></span><span class="ep-m-pearl ep-m-p6"></span>
      <span class="ep-m-tag ep-m-t1">gel fondant</span><span class="ep-m-tag ep-m-t2">perle de crème</span><span class="ep-m-tag ep-m-t3">×40</span>${ruler}</div></div></section>`),
  sec(`<section class="ep-strip pk-bleed" aria-label="Textures"><div class="ep-strip-in">${["Gel", "Crème", "Baume", "Sérum", "Brume", "Mousse", "Perle", "Lait", "Voile", "Gelée"].concat(["Gel", "Crème", "Baume", "Sérum", "Brume", "Mousse", "Perle", "Lait", "Voile", "Gelée"]).map((w, i) => `<span class="ep-strip-w ep-strip-w${i % 3}">${w}</span>`).join("")}</div></section>`),
  sec(`<section class="ep-gestes pk-bleed"><div class="ep-wrap"><div class="ep-sh"><p class="ep-eyebrow">La méthode</p><h2 class="ep-h2">Trois gestes, <em>rien de plus</em></h2><p class="ep-lead">Une routine tient en trois temps. Le reste est une question de préférence, pas d'obligation.</p></div>
    <ol class="ep-g3">${[["nettoyer", "Nettoyer", "Un gel ou une mousse qui se rince sans laisser de film. Deux minutes, de l'eau tiède.", "01"], ["soigner", "Soigner", "Un sérum choisi pour une seule intention : hydrater, rendre éclatant, matifier ou lisser le toucher.", "02"], ["envelopper", "Envelopper", "Une crème adaptée à la texture que vous aimez sentir : nuage léger ou cocon riche.", "03"]].map(([k, t, d, n]) => `<li class="ep-g3-i" data-reveal><span class="ep-g3-n">${n}</span><span class="ep-g3-ico">${ICON[k]}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="ep-board pk-bleed"><div class="ep-wrap"><div class="ep-sh ep-sh--l"><p class="ep-eyebrow ep-eyebrow--l">Planche de textures</p><h2 class="ep-h2">Cinq matières, <em>cinq façons de s'étaler</em></h2></div>
    <div class="ep-bgrid">${[["gel", "Gel", "Transparent, frais, glisse sans effort.", "ep-b-a"], ["creme", "Crème", "Blanche, dense, se fond au contact.", "ep-b-b"], ["baume", "Baume", "Solide au repos, huile soyeuse sur la peau.", "ep-b-c"], ["serum", "Sérum", "Fluide, filant, prêt à être pressé.", "ep-b-d"], ["mousse", "Mousse", "Mille perles d'air pour un nettoyage doux.", "ep-b-e"]].map(([t, n, d, cl]) => `<a class="ep-bt-tile ${cl} ep-t-${t}" href="/produits" data-reveal><span class="ep-pearl ep-pearl--a"></span><span class="ep-pearl ep-pearl--b"></span><span class="ep-pearl ep-pearl--c"></span><span class="ep-bt-n">${n}</span><span class="ep-bt-d">${d}</span></a>`).join("")}</div></div></section>`),
  sec(`<section class="ep-feat pk-bleed"><div class="ep-wrap"><div class="ep-sh ep-sh--row"><div><p class="ep-eyebrow">Formules du moment</p><h2 class="ep-h2">À <em>regarder de près</em></h2></div><a class="ep-more ep-more--l" href="/produits">Tout le catalogue ${arrow}</a></div>
    <div class="ep-grid ep-grid--4">${["gel-rosee", "serum-goutte", "creme-nuage", "masque-argile"].map((k) => card(PID[k])).join("")}</div></div></section>`),
  sec(`<section class="ep-dcta pk-bleed"><span class="ep-pearl ep-pearl--a ep-dcta-p1"></span><span class="ep-pearl ep-pearl--b ep-dcta-p2"></span><span class="ep-pearl ep-pearl--c ep-dcta-p3"></span><div class="ep-wrap ep-dcta-g"><div><p class="ep-eyebrow">Diagnostic de routine</p><h2 class="ep-h2">Quatre questions, <em>une routine matin et soir</em></h2><p class="ep-lead">Type de peau, envies, sensibilités, habitudes : le diagnostic assemble une routine à partir de nos douze formules. Ce n'est pas un acte médical, seulement une aide au choix.</p><a class="ep-btn" href="/diagnostic">Commencer ${arrow}</a></div>
    <ol class="ep-dsteps" aria-label="Les étapes">${["Type de peau", "Envies", "Sensibilités", "Habitudes", "Ma routine"].map((s, i) => `<li><span>${i + 1}</span>${s}</li>`).join("")}</ol></div></section>`),
  sec(`<section class="ep-jt pk-bleed"><div class="ep-wrap"><div class="ep-sh ep-sh--row"><div><p class="ep-eyebrow">Journal du laboratoire</p><h2 class="ep-h2">Lire, <em>comprendre</em></h2></div><a class="ep-more ep-more--l" href="/journal">Tous les articles ${arrow}</a></div>
    <div class="ep-jt-g">${[0, 1, 3].map((i) => { const [, cat, t, x, m, u] = journalData[i]; return `<a class="ep-jt-c" href="${u}" data-reveal><span class="ep-jt-art ep-jt-art${i % 3}"><span class="ep-pearl ep-pearl--a"></span><span class="ep-pearl ep-pearl--b"></span></span><span class="ep-eyebrow">${cat} · ${m}</span><h3>${t}</h3><p>${x}</p></a>`; }).join("")}</div></div></section>`),
  sec(footer(c))];

/* ---------- produits ---------- */
const produits = (c) => [sec(header(c)), pagehead("Catalogue", "Douze formules, <em>six ingrédients</em> en moyenne", "Filtrez par famille, ajoutez à votre routine, ouvrez la fiche pour lire la liste complète des ingrédients, l'usage et la texture.", "b"),
  sec(`<section class="ep-cat pk-bleed"><div class="ep-wrap"><div class="ep-filters" role="group" aria-label="Filtrer par famille"><a class="ep-fchip is-on" href="#tous" role="button" aria-pressed="true" data-filter="*">Tout <small>${P.length}</small></a>${CATS.map(([k, l]) => `<a class="ep-fchip" href="#${k}" role="button" aria-pressed="false" data-filter="${k}">${l} <small>${P.filter((p) => p.cat === k).length}</small></a>`).join("")}</div>
    <p class="ep-count" role="status" aria-live="polite" data-filter-count>${P.length} formules affichées</p>
    <div class="ep-grid ep-grid--3" data-filter-grid>${P.map(card).join("")}</div></div></section>`),
  sec(`<section class="ep-note pk-bleed"><div class="ep-wrap"><p class="ep-note-t"><strong>À savoir.</strong> Cette sélection ne remplace pas l'avis d'un professionnel de santé. Aucun prix ni paiement n'est géré sur ce site de démonstration : la sélection se transmet par le formulaire de contact.</p></div></section>`),
  sec(footer(c))];

/* ---------- fiche produit ---------- */
const gauge = (l, v) => `<div class="ep-gauge"><span>${l}</span><svg viewBox="0 0 100 8" aria-hidden="true" preserveAspectRatio="none"><rect width="100" height="8" rx="4" fill="currentColor" opacity=".15"/><rect width="${v * 10}" height="8" rx="4" fill="currentColor"/></svg><b>${v}/10</b></div>`;
const fiche = (p) => `<article class="ep-fiche" data-fiche="${p.id}"><div class="ep-fiche-v ep-t-${p.t}"><span class="ep-pearl ep-pearl--a"></span><span class="ep-pearl ep-pearl--b"></span><span class="ep-pearl ep-pearl--c"></span>${bottle(p.kind, p.col, "ep-bt ep-bt--xl")}${ruler}</div>
  <div class="ep-fiche-t"><p class="ep-eyebrow">${CATS.find((x) => x[0] === p.cat)[1]} · ${p.tl} · ${p.fmt}</p><h2 class="ep-h2">${esc(p.n)}</h2><p class="ep-lead">${p.d}</p>
    <ul class="ep-tags">${p.flags ? "" : ""}<li>Sans parfum ajouté</li><li>${p.when}</li>${p.flags === "acide" ? "<li>Contient un acide doux</li>" : ""}${p.flags === "huile" ? "<li>Contient des corps gras végétaux</li>" : ""}</ul>
    <div class="ep-fiche-a">${add(p, "ep-add--l")}<a class="ep-btn ep-btn--ghost" href="/diagnostic">Trouver ma routine</a></div>
    <div class="ep-acc"><details open><summary>Ingrédients</summary><ol class="ep-ingl">${p.ing.map((k, i) => `<li><span class="ep-ingl-n">${i + 1}</span><span><b>${ING[k][0]}</b> <small>${ING[k][1]}</small></span></li>`).join("")}</ol><p class="ep-small">Liste dans l'ordre décroissant des proportions. <a href="/ingredients">Comprendre chaque ingrédient</a></p></details>
    <details><summary>Usage</summary><ol class="ep-use">${p.use.map((u) => `<li>${u}</li>`).join("")}</ol><p class="ep-small">Test préalable conseillé au pli du coude. Arrêtez en cas d'inconfort.</p></details>
    <details><summary>Texture</summary><div class="ep-gauges">${gauge("Fluidité", p.g[0])}${gauge("Fraîcheur", p.g[1])}${gauge("Richesse", p.g[2])}</div><p class="ep-small">Notes sensorielles de démonstration, données à titre indicatif.</p></details></div></div></article>`;
const produit = (c) => {
  const hs = [0, 4, 8].map((i) => P.slice(i, i + 4).map(fiche).join(""));
  return [sec(header(c)), pagehead("Fiche de formule", "Lire une formule <em>de près</em>", "Choisissez une formule : ingrédients, usage et texture se déplient en un geste.", "c"),
    sec(`<section class="ep-pick pk-bleed"><div class="ep-wrap"><div class="ep-filters ep-filters--scroll" role="group" aria-label="Choisir une formule">${P.map((p, i) => `<a class="ep-fchip${i === 0 ? " is-on" : ""}" href="#${p.id}" role="button" aria-pressed="${i === 0}" data-pick="${p.id}">${esc(p.n)}</a>`).join("")}</div></div></section>`),
    ...hs.map((h, i) => sec(`<section class="ep-fiches${i ? " ep-fiches--2" : ""} pk-bleed"><div class="ep-wrap">${h}</div></section>`)), sec(footer(c))];
};

/* ---------- diagnostic ---------- */
const opt = (v, t, d, role) => `<a class="ep-opt" href="#choix" role="${role}" aria-checked="false" data-v="${v}"><span class="ep-opt-m"></span><span class="ep-opt-t"><b>${t}</b><small>${d}</small></span></a>`;
const step = (n, h, sub, role, opts, extra = "") => `<article class="ep-step" data-step="${n}"><p class="ep-eyebrow">Étape ${n} sur 5</p><h2 class="ep-h2">${h}</h2><p class="ep-lead">${sub}</p><div class="ep-opts" role="${role === "radio" ? "radiogroup" : "group"}" aria-label="${h}" data-multi="${role === "checkbox" ? 1 : 0}">${opts}</div>${extra}
  <div class="ep-snav">${n > 1 ? `<a class="ep-btn ep-btn--ghost" href="#retour" role="button" data-prev>Retour</a>` : "<span></span>"}<a class="ep-btn" href="#suite" role="button" data-next>${n === 4 ? "Voir ma routine" : "Continuer"} ${arrow}</a></div></article>`;
const diagnostic = (c) => [sec(header(c)), pagehead("Diagnostic de routine", "Ma routine <em>en quatre questions</em>", "Un outil d'aide au choix, pas un acte médical : vos réponses restent dans votre navigateur.", "d"),
  sec(`<section class="ep-quiz pk-bleed"><div class="ep-wrap ep-quiz-w" data-quiz>
    <ol class="ep-prog" aria-label="Progression">${["Peau", "Envies", "Sensibilités", "Habitudes", "Routine"].map((s, i) => `<li ${i === 0 ? 'class="is-on" ' : ""}data-p="${i + 1}"><span>${i + 1}</span><em>${s}</em></li>`).join("")}</ol>
    <p class="ep-live" role="status" aria-live="polite" data-live></p>
    <div class="ep-steps">
      ${step(1, "Comment décririez-vous votre peau ?", "Choisissez la description qui revient le plus souvent en fin de journée.", "radio", opt("seche", "Sèche", "Elle tire, se sent tendue après le nettoyage.", "radio") + opt("normale", "Équilibrée", "Ni brillante ni tendue, confortable.", "radio") + opt("mixte", "Mixte", "Brillance sur le front et le nez, joues plus calmes.", "radio") + opt("grasse", "Brillante", "Elle luit sur tout le visage dès le milieu de journée.", "radio"))}
      ${step(2, "Qu'aimeriez-vous sentir ?", "Jusqu'à deux envies. Nous parlons de sensations, pas de promesses.", "checkbox", opt("hydra", "De l'hydratation", "Une peau souple, plus rebondie au toucher.", "checkbox") + opt("eclat", "Un teint lumineux", "Un aspect plus frais et éclatant.", "checkbox") + opt("confort", "Du confort", "Un voile enveloppant sur les zones tendues.", "checkbox") + opt("mat", "Un fini mat", "Moins de brillance dans la journée.", "checkbox") + opt("grain", "Un toucher lisse", "Un grain de peau plus uniforme au toucher.", "checkbox"))}
      ${step(3, "Y a-t-il des ingrédients à éviter ?", "Nous écarterons les formules concernées. Vous pouvez ne rien cocher.", "checkbox", opt("acide", "Les acides exfoliants", "Pas de voile lactique.", "checkbox") + opt("huile", "Les huiles et beurres", "Pas de baume ni de crème riche.", "checkbox") + opt("parfum", "Le parfum", "Aucune de nos formules n'en contient : nous le notons dans votre résumé.", "checkbox"))}
      ${step(4, "Combien de temps pour votre routine ?", "Mieux vaut une routine tenable qu'une routine parfaite.", "radio", opt("express", "Express · 2 minutes", "Une crème le matin ; un nettoyant et une crème le soir.", "radio") + opt("classique", "Classique · 5 minutes", "Nettoyant, sérum et crème, matin et soir.", "radio") + opt("complete", "Complète · 10 minutes", "Classique, plus un second sérum et un masque hebdomadaire.", "radio"))}
      <article class="ep-step ep-step--out" data-step="5" aria-live="polite"><p class="ep-eyebrow">Étape 5 sur 5</p><h2 class="ep-h2">Votre routine proposée</h2><p class="ep-lead ep-sum" data-sum>Répondez aux quatre questions pour voir la routine qui vous correspond.</p>
        <div class="ep-routine"><section class="ep-rt ep-rt--am"><h3><span class="ep-rt-i">☀</span>Matin</h3><ol data-am></ol></section><section class="ep-rt ep-rt--pm"><h3><span class="ep-rt-i">☾</span>Soir</h3><ol data-pm></ol></section></div>
        <p class="ep-small ep-weekly" data-weekly></p>
        <div class="ep-snav ep-snav--out"><a class="ep-btn ep-btn--ghost" href="#retour" role="button" data-prev>Modifier mes réponses</a><a class="ep-btn ep-btn--ghost" href="#ajouter-routine" role="button" data-addall>Ajouter à ma routine</a><a class="ep-btn ep-btn--ghost" href="#copier" role="button" data-copy>Copier le résumé</a><a class="ep-btn" href="/contact">Envoyer ce résumé ${arrow}</a></div>
        <p class="ep-small">Pour transmettre votre routine, copiez le résumé puis collez-le dans le formulaire de contact. Aucune commande n'est enregistrée.</p></article>
    </div></div></section>`),
  sec(`<section class="ep-pool pk-bleed"><div class="ep-wrap"><h2 class="ep-h3">Les douze formules prises en compte</h2><ul class="ep-poolul">${P.map((p) => `<li data-id="${p.id}" data-name="${esc(p.n)}" data-slot="${p.slot}" data-skin="${p.skin}" data-need="${p.need}" data-flags="${p.flags}" data-when="${esc(p.when)}"><a href="/produit#${p.id}">${esc(p.n)}</a> <small>${p.tl}</small></li>`).join("")}</ul></div></section>`), sec(footer(c))];

/* ---------- ingrédients ---------- */
const ingredients = (c) => [sec(header(c)), pagehead("Glossaire", "Chaque ingrédient, <em>à son rôle</em>", "Vingt et un ingrédients, leur nom INCI, ce qu'ils font dans la formule et les produits où on les trouve.", "e"),
  sec(`<section class="ep-gl pk-bleed"><div class="ep-wrap"><div class="ep-filters" role="group" aria-label="Filtrer par famille"><a class="ep-fchip is-on" href="#tous" role="button" aria-pressed="true" data-filter="*">Tous <small>${Object.keys(ING).length}</small></a>${FAM.map(([k, l]) => `<a class="ep-fchip" href="#${k}" role="button" aria-pressed="false" data-filter="${k}">${l} <small>${Object.values(ING).filter((x) => x[2] === k).length}</small></a>`).join("")}</div>
    <p class="ep-count" role="status" aria-live="polite" data-filter-count>${Object.keys(ING).length} ingrédients affichés</p>
    <dl class="ep-dl" data-filter-grid>${Object.entries(ING).map(([k, [n, inci, f, d]]) => `<div class="ep-dli" data-cat="${f}" data-reveal><dt><span class="ep-dli-f ep-fam-${f}">${FAM.find((x) => x[0] === f)[1]}</span><b>${n}</b><small>${inci}</small></dt><dd><p>${d}</p><p class="ep-dli-u"><span>Dans :</span> ${used(k).map((p) => `<a href="/produit#${p.id}">${esc(p.n)}</a>`).join(", ") || "—"}</p></dd></div>`).join("")}</dl></div></section>`),
  sec(`<section class="ep-note pk-bleed"><div class="ep-wrap"><p class="ep-note-t"><strong>Lire une liste INCI.</strong> Les noms sont écrits dans l'ordre décroissant des proportions, jusqu'à 1 %. Au-delà, l'ordre est libre. Cette page décrit le rôle de chaque ingrédient dans la formule, pas un effet sur votre peau.</p></div></section>`), sec(footer(c))];

/* ---------- notre approche ---------- */
const approche = (c) => [sec(header(c)), pagehead("Notre approche", "Peu d'ingrédients, <em>beaucoup d'attention</em>", "Une formule courte est plus facile à lire, à comparer et à tolérer. Voici les règles que nous nous donnons.", "f"),
  sec(`<section class="ep-ap pk-bleed"><div class="ep-wrap ep-ap-g"><aside class="ep-ap-s"><div class="ep-ap-card"><p class="ep-eyebrow">En une phrase</p><p class="ep-quote">« Si on ne peut pas expliquer un ingrédient en une ligne, il n'entre pas dans la formule. »</p><span class="ep-pearl ep-pearl--a"></span><span class="ep-pearl ep-pearl--b"></span></div></aside>
    <ol class="ep-rules">${[["Une intention par produit", "Un sérum a une seule mission. Pas de formule qui promet tout à la fois."], ["Six ingrédients en moyenne", "Eau, humectant, texture, conservation, et un ou deux ingrédients de caractère."], ["Pas de parfum ajouté", "Les odeurs naturelles des ingrédients suffisent. Pas de parfum, pas d'huiles essentielles."], ["Des mots simples", "Chaque ingrédient est expliqué dans le glossaire, sans jargon ni promesse de résultat."], ["Des essais avant des mots", "Un lot de démonstration est d'abord décrit : toucher, étalement, odeur, sensation après dix minutes."]].map(([t, d], i) => `<li data-reveal><span class="ep-rules-n">${String(i + 1).padStart(2, "0")}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="ep-anat pk-bleed"><div class="ep-wrap"><div class="ep-sh ep-sh--l"><p class="ep-eyebrow ep-eyebrow--l">Anatomie d'une formule</p><h2 class="ep-h2">Le <em>Sérum Goutte 01</em>, couche par couche</h2><p class="ep-lead">Proportions indicatives d'une formule de démonstration.</p></div>
    <svg class="ep-bar-svg" viewBox="0 0 600 44" role="img" aria-label="Barre de proportions : eau 88 %, humectants 8 %, texture 2 %, conservation 1 %, ajustement du pH 1 %"><rect x="0" y="0" width="528" height="44" rx="22" fill="#f6c3ae"/><rect x="528" y="0" width="48" height="44" fill="#cfe8de"/><rect x="576" y="0" width="12" height="44" fill="#ecd3b4"/><rect x="588" y="0" width="6" height="44" fill="#c04630"/><rect x="594" y="0" width="6" height="44" rx="3" fill="#fff"/></svg>
    <ul class="ep-legend">${[["#f6c3ae", "Eau purifiée", "environ 88 %"], ["#cfe8de", "Humectants et apaisants", "environ 8 %"], ["#ecd3b4", "Texture", "environ 2 %"], ["#c04630", "Conservation", "environ 1 %"], ["#fff", "Ajustement du pH", "environ 1 %"]].map(([col, l, v]) => `<li><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="${col}"/></svg><b>${l}</b><span>${v}</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="ep-cmp pk-bleed"><div class="ep-wrap"><h2 class="ep-h2">Ce qu'il y a, <em>ce qu'il n'y a pas</em></h2>
    <table class="ep-table"><caption class="ep-sr">Comparaison entre ce que contiennent et ne contiennent pas nos formules</caption><thead><tr><th scope="col">Sujet</th><th scope="col">Chez Épiderme</th><th scope="col">Pourquoi</th></tr></thead><tbody>
    ${[["Parfum", "Aucun ajouté", "Il est la première cause d'irritation de contact dans les cosmétiques."], ["Huiles essentielles", "Aucune", "Aromatiques et parfois sensibilisantes."], ["Nombre d'ingrédients", "Six en moyenne", "Plus facile à comprendre, à comparer et à écarter."], ["Conservateur", "Benzoate de sodium", "Une formule à base d'eau en a besoin ; nous l'expliquons."], ["Emballage", "Verre et tubes recyclables", "Information de démonstration."]].map(([a, b, d]) => `<tr><th scope="row">${a}</th><td data-l="Chez Épiderme">${b}</td><td data-l="Pourquoi">${d}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="ep-lab pk-bleed"><div class="ep-wrap"><div class="ep-sh"><p class="ep-eyebrow">Du laboratoire à la peau</p><h2 class="ep-h2">Cinq étapes, <em>dans l'ordre</em></h2></div><ol class="ep-tl">${[["Pesée", "Chaque poudre et chaque eau est pesée au dixième de gramme."], ["Dispersion", "Les gommes se dispersent lentement pour éviter les grumeaux."], ["Chauffe douce", "Les corps gras fondent sans dépasser 70 °C."], ["Émulsion", "Phases aqueuse et grasse se rencontrent au mélangeur."], ["Mise en flacon", "Remplissage à froid, étiquetage, échantillon de contrôle."]].map(([t, d], i) => `<li data-reveal><span class="ep-tl-d">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol><div class="ep-cta ep-cta--c"><a class="ep-btn" href="/diagnostic">Faire le diagnostic ${arrow}</a><a class="ep-btn ep-btn--ghost" href="/ingredients">Lire le glossaire</a></div></div></section>`), sec(footer(c))];

/* ---------- journal ---------- */
const jc = (a, i, big) => { const [cat, catl, t, x, m, u] = a; return `<a class="ep-ja${big ? " ep-ja--big" : ""}" href="${u}" data-cat="${cat}" data-reveal><span class="ep-jt-art ep-jt-art${i % 4}"><span class="ep-pearl ep-pearl--a"></span><span class="ep-pearl ep-pearl--b"></span><span class="ep-pearl ep-pearl--c"></span></span><span class="ep-ja-b"><span class="ep-eyebrow">${catl} · ${m} de lecture</span><h3>${t}</h3><p>${x}</p><span class="ep-more">Lire ${arrow}</span></span></a>`; };
const journal = (c) => [sec(header(c)), pagehead("Journal", "Lire, comprendre, <em>choisir</em>", "Textures, ingrédients, routines et coulisses : des articles courts, écrits sans jargon.", "g"),
  sec(`<section class="ep-jr pk-bleed"><div class="ep-wrap"><div class="ep-filters" role="group" aria-label="Filtrer par rubrique"><a class="ep-fchip is-on" href="#tous" role="button" aria-pressed="true" data-filter="*">Tous <small>${journalData.length}</small></a>${[["textures", "Textures"], ["ingredients", "Ingrédients"], ["routines", "Routines"], ["coulisses", "Coulisses"]].map(([k, l]) => `<a class="ep-fchip" href="#${k}" role="button" aria-pressed="false" data-filter="${k}">${l} <small>${journalData.filter((a) => a[0] === k).length}</small></a>`).join("")}</div>
    <p class="ep-count" role="status" aria-live="polite" data-filter-count>${journalData.length} articles affichés</p>
    <div class="ep-jgrid" data-filter-grid>${journalData.map((a, i) => jc(a, i, i === 0)).join("")}</div></div></section>`),
  sec(`<section class="ep-dcta ep-dcta--s pk-bleed"><div class="ep-wrap ep-dcta-g"><div><p class="ep-eyebrow">Une question ?</p><h2 class="ep-h2">Écrivez au <em>laboratoire</em></h2><p class="ep-lead">Une texture à décrire, un ingrédient à expliquer : le formulaire de contact arrive chez nous.</p></div><a class="ep-btn" href="/contact">Nous écrire ${arrow}</a></div></section>`), sec(footer(c))];

/* ---------- pages système ---------- */
const contact = (c) => [sec(header(c)), pagehead("Contact", "Parlons <em>de votre peau</em>", "Une question sur une formule, un résumé de diagnostic à nous transmettre : écrivez-nous, nous répondons sous quelques jours.", "h"),
  { type: "form", heading: "Écrire au laboratoire", intro: "Indiquez votre demande ou collez le résumé de votre diagnostic. Ce site est une démonstration : aucune commande n'est enregistrée." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Recherche", "Chercher <em>une formule</em>", "Un ingrédient, une texture, un article.", "i"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une formule, un ingrédient…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ep-404 pk-bleed"><span class="ep-m-drip ep-404-d"></span><div class="ep-wrap"><p class="ep-eyebrow">Erreur 404</p><div class="ep-h1 ep-h1--xl" role="heading" aria-level="1">Cette page s'est <em>évaporée</em></div><p class="ep-lead">Elle n'existe pas ou a changé d'adresse. Reprenez par l'accueil ou le catalogue.</p><div class="ep-cta ep-cta--c"><a class="ep-btn" href="/">Retour à l'accueil ${arrow}</a><a class="ep-btn ep-btn--ghost" href="/produits">Voir les formules</a></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "epiderme", name: "Épiderme", version: "2.0.0", category: "beaute", tags: ["minimaliste", "moderne", "naturel"], siteType: "Marque de soins et laboratoire de beauté", featured: false,
  concept: "Un laboratoire de beauté vu au microscope : une goutte translucide en gros plan, des textures dessinées et un diagnostic de routine en cinq étapes.",
  description: "Marque de soins fictive : blanc cassé, pêche et vert d'eau, textures en gros plan, catalogue filtrable, fiches de formule, glossaire d'ingrédients et diagnostic de routine matin et soir.",
  brand: "Épiderme Laboratoire", modules: ["formulaires", "recherche"],
  dna: { header: "barre-minimale-logo-goutte-et-panier-de-routine", hero: "gros-plan-macro-d-une-goutte-translucide-et-perles", grid: "cartes-flacon-sur-pastille-de-texture", motion: "goutte-qui-respire-perles-flottantes-et-parallaxe-macro", shapes: "gouttes-lentilles-perles-et-bords-translucides", rhythm: "planches-de-texture-alternant-blanc-casse-et-vert-d-eau", signature: "diagnostic-de-routine-en-cinq-etapes-et-fiches-de-formule" },
  tokens: {
    colors: { primary: "#c04630", secondary: "#1f4f45", accent: "#f6c3ae", background: "#faf5ef", surface: "#ffffff", text: "#26322f", muted: "#5b6a66", success: "#2c6e49", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.urbanist", body: "font.hanken-grotesk", button: "font.urbanist", link: "font.hanken-grotesk" },
    radius: { sm: 10, md: 20, lg: 32, button: 999, field: 16, card: 28 }, shadow: { card: "0 24px 60px rgba(192,70,48,.12)", button: "none" }, border: { width: 1, color: "#eadfd3" },
    type: { h1: { size: 88, weight: 300, lineHeight: 1, transform: "none" }, h2: { size: 48, weight: 300, lineHeight: 1.08, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Corail des boutons", type: "color", default: "#c04630" },
    { key: "mint", label: "Vert d'eau des planches", type: "color", default: "#1f4f45" },
    { key: "peach", label: "Pêche des gouttes", type: "color", default: "#f6c3ae" },
    { key: "pearls", label: "Perles flottantes", type: "choice", default: "on", choices: [["on", "Animées"], ["off", "Immobiles"]] },
    { key: "cards", label: "Forme des cartes", type: "choice", default: "round", choices: [["round", "Arrondies"], ["lens", "Lentilles"]] },
  ],
  menu: [["Accueil", "/"], ["Produits", "/produits"], ["Diagnostic", "/diagnostic"], ["Ingrédients", "/ingredients"], ["Notre approche", "/approche"], ["Journal", "/journal"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "produits", name: "Produits", render: produits }, { key: "produit", name: "Fiche produit", render: produit },
    { key: "diagnostic", name: "Diagnostic de routine", render: diagnostic }, { key: "ingredients", name: "Ingrédients", render: ingredients }, { key: "approche", name: "Notre approche", render: approche },
    { key: "journal", name: "Journal", render: journal }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
