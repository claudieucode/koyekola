// Bibliothèque d'illustrations de l'administration KOLAKISA (CMS et Marketing).
// Direction artistique : « Marine & lumière » — petites scènes géométriques en cartes superposées sur une forme douce,
// barres de fenêtre marine, accents bleu et ciel, une seule touche chaude (étincelle). Toutes les couleurs viennent de
// variables CSS (--a-*, définies dans public/css/kola-compose.css) : les scènes suivent donc le mode clair et sombre.
// Usage dans une vue EJS : <%- illu("articles") %>  ·  <%- illu("seo", { label: "Référencement" }) %>.
// Règle : une illustration par grand module ou état vide ; jamais dans un tableau dense, un formulaire technique ni un éditeur.

const r1 = (n) => Math.round(n * 10) / 10;
const rect = (x, y, w, h, r, cls, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" class="${cls}"${extra ? " " + extra : ""}/>`;
const circ = (x, y, r, cls, extra = "") => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" class="${cls}"${extra ? " " + extra : ""}/>`;
const path = (d, cls, extra = "") => `<path d="${d}" class="${cls}"${extra ? " " + extra : ""}/>`;
const g = (inner, transform) => `<g${transform ? ` transform="${transform}"` : ""}>${inner}</g>`;

// Fond : forme douce + halo, légèrement différente d'une scène à l'autre (v = 0..3)
function stage(v = 0) {
  const shapes = [
    "M62 118c-6-44 28-86 78-90s104 12 122 52-6 86-52 100-84 14-112-8-32-30-36-54z",
    "M52 104c4-42 44-76 96-76s112 22 124 66-22 92-76 100-98-4-124-34-24-32-20-56z",
    "M70 132c-14-40 10-84 62-98s106 0 128 40-4 90-54 106-92 8-118-14-12-20-18-34z",
    "M58 112c2-46 46-80 100-78s108 28 108 74-34 88-90 94-90-10-112-40-6-22-6-50z",
  ];
  return path(shapes[v % shapes.length], "ice") + circ(246, 62, 30, "sky", 'opacity=".3"') + circ(246, 62, 16, "sky", 'opacity=".3"') + `<ellipse cx="160" cy="198" rx="104" ry="9" class="gnd"/>`;
}

// Fenêtre : carte à ombre portée décalée, barre marine avec trois points
function win(x, y, w, h, bar = true) {
  let s = rect(x + 3, y + 5, w, h, 10, "sh") + rect(x, y, w, h, 10, "card");
  if (bar) s += path(`M${x} ${y + 18}V${y + 10}a10 10 0 0 1 10-10H${x + w - 10}a10 10 0 0 1 10 10V${y + 18}Z`, "navy") + circ(x + 10, y + 9, 2, "sky") + circ(x + 17.5, y + 9, 2, "sky", 'opacity=".7"') + circ(x + 25, y + 9, 2, "sky", 'opacity=".45"');
  return s;
}
const card = (x, y, w, h, r = 8) => rect(x + 2, y + 4, w, h, r, "sh") + rect(x, y, w, h, r, "card");
// Lignes de texte (placeholders) : widths = largeurs
const lines = (x, y, widths, gap = 9, h = 5, cls = "ln") => widths.map((w, i) => rect(x, y + i * gap, w, h, h / 2, i === 0 && cls === "ln" ? "ln2" : cls)).join("");
const sparkle = (x, y, s = 5, cls = "spark") => path(`M${x} ${y - s}L${r1(x + s * 0.28)} ${r1(y - s * 0.28)}L${x + s} ${y}L${r1(x + s * 0.28)} ${r1(y + s * 0.28)}L${x} ${y + s}L${r1(x - s * 0.28)} ${r1(y + s * 0.28)}L${x - s} ${y}L${r1(x - s * 0.28)} ${r1(y - s * 0.28)}Z`, cls);
const plus = (x, y, s = 4) => path(`M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`, "stk", 'stroke-width="1.6"');
const pill = (x, y, w, cls = "blue") => rect(x, y, w, 12, 6, cls);
const avatar = (x, y, r, tone = "blue") => circ(x, y - r * 0.28, r * 0.42, tone) + path(`M${r1(x - r * 0.78)} ${r1(y + r * 0.78)}c${r1(r * 0.08)}-${r1(r * 0.62)} ${r1(r * 0.34)}-${r1(r * 0.86)} ${r1(r * 0.78)}-${r1(r * 0.86)}s${r1(r * 0.7)} ${r1(r * 0.24)} ${r1(r * 0.78)} ${r1(r * 0.86)}z`, tone);
const arrow = (x1, y1, x2, y2, cls = "stk") => path(`M${x1} ${y1}L${x2} ${y2}`, cls) ;
const check = (x, y, s = 6) => path(`M${x - s} ${y}l${r1(s * 0.7)} ${r1(s * 0.7)} ${r1(s * 1.4)}-${r1(s * 1.5)}`, "stkw");
const badge = (x, y, r = 11, cls = "blue") => circ(x, y, r, cls) + check(x, y + 0.5, r * 0.45);
const gear = (x, y, r, cls = "navy") => {
  let teeth = "";
  for (let i = 0; i < 8; i++) teeth += rect(x - r * 0.18, y - r * 1.12, r * 0.36, r * 0.42, 1.5, cls, `transform="rotate(${i * 45} ${x} ${y})"`);
  return teeth + circ(x, y, r * 0.86, cls) + circ(x, y, r * 0.38, "card");
};

const circle5 = (x, y) => [0, 1, 2, 3, 4].map((i) => circ(x + i * 11, y, 2.4, "ln2")).join("");

const SCENES = {
  // Tableau de bord : pilotage du site (carte de mesures, jauge, flèche de progression)
  dashboard: () => stage(0) + win(56, 40, 170, 118) + [0, 1, 2, 3, 4].map((i) => rect(72 + i * 20, 138 - [26, 38, 30, 52, 70][i], 12, [26, 38, 30, 52, 70][i], 3, i === 4 ? "blue" : "sky", i === 4 ? "" : 'opacity=".55"')).join("") +
    path("M72 100c20-6 28 8 48-2s30-24 52-22 24-10 40-18", "stk", 'stroke-dasharray="2 5"') +
    card(188, 104, 92, 70, 10) + circ(218, 138, 17, "none", 'stroke="var(--a-soft)" stroke-width="7"') + circ(218, 138, 17, "none", 'stroke="var(--a-blue)" stroke-width="7" stroke-linecap="round" stroke-dasharray="72 107" transform="rotate(-90 218 138)"') + lines(244, 128, [26, 18], 10, 5) +
    rect(236, 30, 56, 22, 11, "card") + path("M247 43l5-6 4 4 6-7", "stk", 'stroke-width="2"') + circ(280, 41, 4, "spark") + sparkle(46, 62, 6) + plus(300, 120) + circ(40, 150, 3, "blue", 'opacity=".4"'),

  // Pages : composition de mise en page, curseur et bloc glissé
  pages: () => stage(1) + win(64, 36, 150, 138) + rect(76, 58, 126, 36, 5, "ice") + rect(84, 66, 52, 6, 3, "navy", 'opacity=".85"') + rect(84, 78, 80, 5, 2.5, "sky") + rect(84, 87, 22, 5, 2.5, "blue") +
    rect(76, 102, 60, 40, 5, "soft") + rect(144, 102, 58, 18, 5, "soft") + rect(144, 124, 58, 18, 5, "soft") + lines(76, 152, [80, 54], 9, 5) +
    rect(196, 62, 82, 54, 9, "card", 'stroke-dasharray="4 4"') + rect(206, 72, 62, 8, 4, "ln") + rect(206, 86, 40, 6, 3, "ln") + circ(262, 100, 8, "blue") + plus(262, 100, 3.5).replace('class="stk"', 'class="stkw"') +
    path("M232 140l-2 30 9-8 6 14 7-3-6-14 12-2z", "navy") + sparkle(284, 150, 6) + circ(48, 54, 3.5, "blue", 'opacity=".45"'),

  // Articles : feuille éditoriale, plume, étincelle
  articles: () => stage(2) + card(92, 28, 128, 158, 10) + rect(104, 42, 70, 8, 4, "navy") + lines(104, 60, [100, 92, 100, 64], 10, 5) + rect(104, 106, 104, 38, 6, "ice") + path("M110 138l22-20 16 14 14-10 36 16z", "sky", 'opacity=".8"') + circ(192, 120, 5, "spark") + lines(104, 154, [96, 70], 9, 5) +
    g(rect(-4, -58, 8, 62, 4, "blue") + path("M-4 4h8l-4 10z", "navy") + rect(-4, -66, 8, 10, 3, "sky"), "translate(246 152) rotate(38)") + path("M222 178c6-3 12 2 18-1", "stk", 'stroke-dasharray="1 5"') +
    rect(236, 36, 44, 22, 11, "card") + rect(246, 44, 24, 6, 3, "blue") + sparkle(60, 60, 6) + plus(54, 150) + circ(280, 100, 3, "blue", 'opacity=".5"'),

  // Médias : photos superposées, soleil, lecture
  media: () => stage(3) + g(card(76, 46, 110, 86, 10) + rect(84, 54, 94, 56, 6, "ice") + path("M84 110l28-26 22 18 16-12 28 20v6H84z", "sky", 'opacity=".7"'), "rotate(-7 130 90)") +
    card(112, 62, 122, 100, 10) + rect(120, 70, 106, 66, 6, "ice") + circ(206, 92, 9, "spark") + path("M120 136l32-34 24 22 18-14 32 26v0H120z", "blue", 'opacity=".9"') + path("M120 136l24-22 18 14 22-20 42 28z", "navy", 'opacity=".9"') + lines(120, 146, [64, 40], 9, 5) +
    circ(236, 56, 18, "navy") + path("M231 48l14 8-14 8z", "wh") + rect(238, 150, 46, 22, 11, "card") + circ(250, 161, 4, "blue") + rect(258, 158, 18, 6, 3, "ln") + sparkle(54, 58, 6) + plus(290, 96),

  // Commentaires : bulles de conversation
  commentaires: () => stage(0) + card(60, 44, 128, 62, 12) + path("M80 106l-4 22 22-14z", "card") + avatar(82, 68, 12, "blue") + lines(104, 58, [66, 50, 58], 10, 5) +
    rect(116, 112, 134, 60, 12, "navy") + path("M232 172l6 20-22-14z", "navy") + lines(130, 126, [92, 70, 82], 10, 5, "wh").replace(/class="wh"/g, 'class="wh" opacity=".85"') +
    rect(204, 38, 62, 24, 12, "card") + circ(220, 50, 3.5, "blue") + circ(233, 50, 3.5, "sky") + circ(246, 50, 3.5, "ln2") + path("M268 96c0-6 9-6 9 0s-9 10-9 10-9-4-9-10 9-6 9 0z", "spark", 'transform="translate(2 -22)"') + sparkle(48, 146, 6) + plus(286, 160),

  // Utilisateurs : équipe reliée
  utilisateurs: () => stage(1) + path("M104 128L160 88 218 128", "stkl") + card(130, 54, 60, 70, 10) + avatar(160, 88, 22, "blue") + rect(140, 108, 40, 6, 3, "ln") +
    card(62, 112, 56, 62, 10) + avatar(90, 142, 17, "navy") + rect(72, 160, 36, 5, 2.5, "ln") + card(204, 112, 56, 62, 10) + avatar(232, 142, 17, "sky") + rect(214, 160, 36, 5, 2.5, "ln") +
    badge(190, 58, 10) + circ(272, 70, 14, "card") + plus(272, 70, 5) + sparkle(50, 70, 6) + circ(290, 150, 3, "blue", 'opacity=".5"'),

  // Apparence / thèmes : mise en page, nuancier, pinceau
  themes: () => stage(2) + win(60, 38, 150, 118) + rect(72, 60, 126, 28, 5, "navy", 'opacity=".9"') + rect(80, 69, 42, 7, 3.5, "wh", 'opacity=".85"') + rect(72, 96, 60, 48, 5, "ice") + rect(140, 98, 58, 8, 4, "ln") + rect(140, 112, 44, 6, 3, "ln") + rect(140, 124, 52, 6, 3, "ln") + rect(140, 134, 30, 10, 5, "blue") +
    card(188, 96, 96, 70, 10) + [["navy", 0], ["blue", 1], ["sky", 2], ["spark", 3]].map(([c, i]) => circ(206 + i * 22, 122, 9, c)).join("") + rect(198, 142, 76, 6, 3, "ln") +
    g(rect(-4, -36, 8, 40, 4, "blue") + path("M-4 4h8c0 8-3 12-4 18-1-6-4-10-4-18z", "navy"), "translate(262 56) rotate(34)") + sparkle(46, 66, 6) + plus(300, 140),

  // Extensions / modules : blocs qui s'emboîtent
  extensions: () => stage(3) + card(70, 96, 70, 70, 10) + rect(86, 112, 38, 38, 8, "ice") + rect(150, 96, 70, 70, 10, "sh") + rect(148, 92, 70, 70, 10, "card") + rect(164, 108, 38, 38, 8, "sky", 'opacity=".6"') +
    g(card(110, 40, 70, 56, 10) + rect(124, 52, 42, 32, 7, "blue") + path("M148 56l-12 14h10l-4 12 14-16h-10z", "wh"), "") + rect(137, 92, 14, 10, 3, "navy") + circ(250, 70, 14, "card") + path("M244 70h12M250 64v12", "stk", 'stroke-width="2"') + circ(250, 140, 20, "navy") + path("M243 140h10m-5-7v14", "stkw") +
    sparkle(52, 66, 6) + plus(290, 106) + circ(54, 150, 3.5, "blue", 'opacity=".45"'),

  // SEO : loupe sur courbe ascendante
  seo: () => stage(0) + win(62, 40, 156, 112) + [30, 44, 38, 62, 78].map((h, i) => rect(78 + i * 26, 142 - h, 14, h, 3, i === 4 ? "blue" : "sky", i === 4 ? "" : 'opacity=".55"')).join("") + lines(78, 62, [70, 46], 9, 5) +
    path("M78 112c18-4 24-20 44-16s24 18 44 6 22-24 42-34", "stk") + path("M196 66l10-2-3 10", "stk") +
    circ(224, 128, 34, "card") + circ(224, 128, 34, "none", 'fill="none" stroke="var(--a-navy)" stroke-width="7"') + path("M249 153l26 26", "stkn") + path("M208 130l12 10 20-24", "stk", 'stroke-width="5"') +
    circ(266, 52, 13, "spark") + path("M266 46v7l4 3", "stkn", 'stroke-width="2"') + sparkle(48, 70, 6) + plus(296, 96),

  // Redirections : une adresse, deux destinations
  redirections: () => stage(1) + card(48, 82, 64, 54, 10) + rect(58, 96, 44, 7, 3.5, "navy") + rect(58, 110, 30, 6, 3, "ln") + path("M112 108c26 0 30-34 56-34", "stk") + path("M112 108c26 0 30 34 56 34", "stk", 'stroke-dasharray="4 5"') + path("M164 68l8 6-8 6", "stk") + path("M164 136l8 6-8 6", "stk") +
    card(174, 48, 78, 52, 10) + rect(184, 60, 58, 6, 3, "ln2") + rect(184, 74, 40, 6, 3, "ln") + badge(244, 52, 10) + card(174, 120, 78, 52, 10) + rect(184, 132, 58, 6, 3, "ln") + rect(184, 146, 36, 6, 3, "ln") + circ(244, 124, 10, "spark") + path("M240 124h8", "stkn", 'stroke-width="2"') +
    sparkle(278, 100, 6) + plus(40, 56) + circ(40, 162, 3.5, "blue", 'opacity=".45"'),

  // Navigation : barre de menu et arborescence
  navigation: () => stage(2) + win(56, 40, 208, 40, false) + rect(68, 54, 30, 12, 6, "navy") + [0, 1, 2].map((i) => rect(110 + i * 38, 57, 28, 6, 3, i === 0 ? "blue" : "ln2")).join("") + circ(246, 60, 5, "sky") +
    card(76, 98, 150, 76, 10) + [0, 1, 2].map((i) => rect(88 + (i === 1 ? 16 : 0), 110 + i * 22, i === 1 ? 74 : 96, 14, 5, i === 1 ? "ice" : "soft")).join("") + [0, 1, 2].map((i) => circ(98 + (i === 1 ? 16 : 0), 117 + i * 22, 2.5, i === 1 ? "blue" : "ln2")).join("") +
    path("M84 124v22", "stkl", 'stroke-width="1.4"') + g(card(212, 114, 62, 30, 8) + circ(226, 129, 3, "blue") + rect(234, 126, 28, 6, 3, "ln"), "rotate(5 243 129)") + sparkle(48, 124, 6) + plus(292, 70) + circ(286, 168, 3.5, "blue", 'opacity=".45"'),

  // Outils : cadran de contrôle et clé
  outils: () => stage(3) + card(70, 50, 170, 118, 12) + path("M104 138a50 50 0 0 1 102 0", "none", 'fill="none" stroke="var(--a-soft)" stroke-width="12" stroke-linecap="round"') + path("M104 138a50 50 0 0 1 60-49", "none", 'fill="none" stroke="var(--a-blue)" stroke-width="12" stroke-linecap="round"') + path("M155 138l26-34", "stkn", 'stroke-width="4"') + circ(155, 138, 7, "navy") + circ(155, 138, 3, "card") +
    lines(98, 152, [40, 28], 8, 4) + g(path("M-5-50a14 14 0 0 1 10 0l-2 8a6 6 0 1 0-6 0z", "blue") + rect(-5, -34, 10, 56, 5, "blue"), "translate(256 128) rotate(36)") + gear(76, 52, 14, "sky").replace(/class="card"/, 'class="card"') + sparkle(278, 54, 6) + plus(46, 160),

  // Diagnostic : moniteur avec pulsation
  diagnostic: () => stage(0) + win(60, 40, 180, 116) + path("M74 110h28l10-26 16 52 14-38 10 12h42", "stk", 'stroke-width="3"') + lines(74, 66, [48, 30], 9, 5) + rect(188, 64, 40, 14, 7, "ice") + circ(198, 71, 3.5, "blue") + rect(206, 69, 16, 4, 2, "ln") +
    rect(124, 156, 52, 8, 4, "navy") + rect(108, 164, 84, 8, 4, "sh") + path("M262 84l24 8v20c0 16-10 26-24 32-14-6-24-16-24-32V92z", "navy") + check(262, 114, 8) + sparkle(54, 62, 6) + plus(292, 54),

  // Sauvegardes : nuage, bouclier, flèche
  sauvegardes: () => stage(1) + path("M98 140a30 30 0 0 1 4-60 40 40 0 0 1 76-8 34 34 0 0 1 36 26 28 28 0 0 1 4 42z", "card", 'stroke="var(--a-line)" stroke-width="1.2"') + path("M98 140a30 30 0 0 1 4-60 40 40 0 0 1 76-8", "none", 'fill="none"') + path("M144 136v-34m-14 12l14-14 14 14", "stk", 'stroke-width="4"') +
    card(190, 118, 76, 50, 10) + rect(200, 130, 56, 7, 3.5, "navy") + rect(200, 144, 38, 6, 3, "ln") + badge(262, 120, 11) + g(rect(0, 0, 54, 12, 6, "blue") + rect(0, 16, 54, 12, 6, "sky") + rect(0, 32, 54, 12, 6, "ice"), "translate(66 150)") + circ(76, 156, 2.5, "wh") + circ(76, 172, 2.5, "blue") + sparkle(272, 62, 6) + plus(50, 76),

  // Paramètres : curseurs et engrenage
  parametres: () => stage(2) + card(60, 44, 170, 122, 12) + [0, 1, 2].map((i) => rect(78, 70 + i * 32, 134, 6, 3, "soft") + rect(78, 70 + i * 32, [88, 54, 110][i], 6, 3, i === 1 ? "sky" : "blue") + circ(78 + [88, 54, 110][i], 73 + i * 32, 9, "card", 'stroke="var(--a-blue)" stroke-width="2.4"')).join("") +
    rect(78, 52, 40, 6, 3, "ln2") + g(gear(0, 0, 26, "navy"), "translate(248 138)") + g(gear(0, 0, 14, "sky"), "translate(224 92)") + sparkle(272, 66, 6) + plus(48, 150) + circ(290, 100, 3, "blue", 'opacity=".5"'),

  // E-mail : enveloppe et avion en papier
  email: () => stage(3) + rect(64, 76, 148, 98, 12, "sh", 'transform="translate(3 5)"') + rect(64, 76, 148, 98, 12, "card") + path("M64 90a12 12 0 0 1 12-14h124a12 12 0 0 1 12 14l-74 52z", "ice") + path("M64 90l74 52 74-52", "stk", 'stroke="var(--a-line2)" stroke-width="2"') +
    g(path("M0 0l60-26-22 56-12-22z", "blue") + path("M26 34l12-22 22-38z", "navy"), "translate(200 52)") + path("M180 92c10-12 22-16 28-26", "stkl", 'stroke-dasharray="2 5"') + sparkle(52, 70, 6) + plus(290, 130) + circ(70, 188, 3, "blue", 'opacity=".45"'),

  // Contacts : cartes de visite
  contacts: () => stage(0) + g(card(72, 50, 136, 82, 10) + avatar(100, 90, 14, "sky") + lines(124, 76, [64, 48, 56], 10, 5), "rotate(-5 140 90)") + card(112, 88, 150, 84, 10) + avatar(144, 128, 17, "blue") + rect(172, 108, 70, 8, 4, "navy") + lines(172, 124, [60, 44], 10, 5) + pill(172, 148, 34, "ice") + pill(210, 148, 26, "soft") +
    badge(256, 92, 11) + sparkle(54, 160, 6) + plus(284, 56),

  // Formulaires : champs, case, bouton
  formulaires: () => stage(1) + win(70, 38, 150, 132) + rect(84, 62, 122, 18, 5, "soft") + rect(90, 68, 36, 6, 3, "ln2") + rect(84, 88, 122, 18, 5, "soft") + rect(90, 94, 52, 6, 3, "ln2") + rect(84, 114, 14, 14, 4, "blue") + check(91, 121, 4) + rect(106, 118, 60, 6, 3, "ln") + rect(84, 138, 56, 20, 10, "blue") + rect(94, 146, 36, 5, 2.5, "wh") +
    card(206, 70, 76, 48, 10) + rect(216, 82, 34, 6, 3, "ln2") + rect(262, 80, 12, 10, 5, "blue") + circ(268, 85, 3.5, "wh") + rect(216, 98, 54, 6, 3, "ln") + sparkle(48, 64, 6) + plus(290, 150),

  // Automatisations : graphe de nœuds
  automatisations: () => stage(2) + path("M96 100h38m20 0h36m-56 0c14 0 14-38 28-38m-28 38c14 0 14 38 28 38", "stk", 'stroke-width="2.2"') + card(52, 76, 60, 48, 10) + rect(62, 88, 40, 7, 3.5, "navy") + rect(62, 102, 26, 6, 3, "ln") +
    rect(134, 78, 36, 44, 10, "blue") + path("M155 86l-10 16h9l-3 12 12-18h-9z", "wh") + card(192, 40, 70, 40, 9) + circ(208, 60, 6, "sky") + rect(220, 56, 32, 6, 3, "ln") + card(192, 120, 70, 40, 9) + circ(208, 140, 6, "spark") + rect(220, 136, 32, 6, 3, "ln") + circ(284, 100, 3.5, "blue", 'opacity=".5"') + sparkle(60, 160, 6) + plus(290, 150),

  // Connecteurs : deux services reliés
  connecteurs: () => stage(3) + path("M118 110h84", "stk", 'stroke-width="3" stroke-dasharray="1 7"') + g(card(52, 76, 70, 68, 12) + circ(87, 104, 14, "blue") + rect(70, 128, 34, 6, 3, "ln"), "") + g(card(198, 76, 70, 68, 12) + rect(220, 92, 26, 26, 7, "navy") + rect(210, 128, 46, 6, 3, "ln"), "") + circ(160, 110, 17, "card") + circ(160, 110, 17, "none", 'fill="none" stroke="var(--a-blue)" stroke-width="2.6"') + path("M153 110h14m-7-7v14", "stk", 'stroke-width="2.4"') +
    rect(138, 40, 44, 22, 11, "card") + circ(150, 51, 4, "spark") + rect(158, 48, 16, 6, 3, "ln") + rect(120, 160, 80, 14, 7, "ice") + sparkle(46, 56, 6) + plus(290, 56) + circ(292, 152, 3.5, "blue", 'opacity=".45"'),

  // Aucun résultat : loupe sur page vide
  recherche: () => stage(0) + card(84, 40, 124, 134, 10) + rect(98, 56, 60, 8, 4, "ln2") + lines(98, 76, [96, 80, 88], 11, 5, "ln") + rect(98, 118, 96, 36, 6, "soft", 'stroke-dasharray="4 4" stroke="var(--a-line)" stroke-width="1.2"') +
    circ(206, 128, 30, "card") + circ(206, 128, 30, "none", 'fill="none" stroke="var(--a-navy)" stroke-width="7"') + path("M228 150l24 24", "stkn") + path("M196 120l20 16m0-16l-20 16", "stk", 'stroke="var(--a-line2)" stroke-width="3.2"') + sparkle(262, 60, 6) + plus(54, 74) + circ(54, 150, 3.5, "blue", 'opacity=".45"'),

  // Import / export : boîte et flux
  echanges: () => stage(1) + path("M84 108l76-34 76 34v58l-76 28-76-28z", "card", 'stroke="var(--a-line)" stroke-width="1.2"') + path("M84 108l76 30 76-30", "stk", 'stroke="var(--a-line)" stroke-width="1.6"') + path("M160 138v56", "stk", 'stroke="var(--a-line)" stroke-width="1.6"') + path("M84 108l76-34 76 34-76 30z", "ice") +
    path("M130 62V30m-12 12l12-12 12 12", "stk", 'stroke-width="3.4"') + path("M196 30v32m-12-12l12 12 12-12", "stk", 'stroke="var(--a-navy)" stroke-width="3.4"') + rect(120, 150, 40, 22, 11, "blue") + rect(128, 158, 24, 6, 3, "wh") + sparkle(60, 70, 6) + plus(284, 130) + circ(278, 60, 3.5, "blue", 'opacity=".45"'),

  // Widgets : grille de blocs et bloc glissé
  widgets: () => stage(2) + [[64, 48], [128, 48], [64, 112]].map(([x, y], i) => card(x, y, 54, 54, 10) + rect(x + 12, y + 12, 30, 30, 8, i === 0 ? "blue" : i === 1 ? "sky" : "ice", i === 1 ? 'opacity=".7"' : "")).join("") + rect(128, 112, 54, 54, 10, "card", 'stroke-dasharray="4 4"') + plus(155, 139, 6) +
    g(card(0, 0, 60, 60, 10) + rect(12, 12, 36, 36, 9, "navy") + path("M30 20l-8 12h7l-2 10 10-14h-7z", "wh"), "translate(204 62) rotate(10)") + path("M186 116c10 4 12 8 22 4", "stkl", 'stroke-dasharray="2 5"') + sparkle(54, 36, 6) + plus(290, 162) + circ(292, 54, 3.5, "blue", 'opacity=".45"'),

  // Corbeille
  corbeille: () => stage(3) + g(rect(0, 0, 90, 12, 6, "navy") + rect(30, -8, 30, 10, 5, "navy"), "translate(100 56)") + path("M106 76h78l-6 90a10 10 0 0 1-10 9h-46a10 10 0 0 1-10-9z", "card", 'stroke="var(--a-line)" stroke-width="1.2"') + [0, 1, 2].map((i) => rect(124 + i * 18, 92, 6, 66, 3, "soft")).join("") +
    g(card(0, 0, 36, 44, 6) + lines(7, 10, [20, 16], 9, 4), "translate(208 70) rotate(14)") + sparkle(66, 70, 6) + plus(268, 150) + circ(60, 150, 3.5, "blue", 'opacity=".45"'),

  // Tests A/B : deux variantes
  tests: () => stage(0) + card(54, 52, 92, 108, 10) + rect(54, 52, 92, 20, 10, "navy") + rect(54, 64, 92, 8, 0, "navy") + rect(68, 84, 64, 26, 5, "ice") + lines(68, 120, [64, 46], 10, 5) + rect(68, 140, 36, 10, 5, "sky") +
    card(174, 40, 92, 124, 10) + rect(174, 40, 92, 20, 10, "blue") + rect(174, 52, 92, 8, 0, "blue") + rect(188, 74, 64, 34, 5, "ice") + lines(188, 118, [64, 46], 10, 5) + rect(188, 142, 44, 12, 6, "blue") +
    circ(160, 106, 15, "card") + path("M152 106h16m-5-5l5 5-5 5", "stk", 'stroke-width="2"') + badge(256, 44, 11) + sparkle(46, 40, 6) + plus(292, 138),

  // Statistiques : courbe et anneau
  analytics: () => stage(1) + win(52, 42, 150, 112) + path("M68 128c18-24 30-8 46-28s26-6 44-30 24-4 30-14", "stk", 'stroke-width="3"') + path("M68 128c18-24 30-8 46-28s26-6 44-30 24-4 30-14v72H68z", "blue", 'opacity=".12"') + lines(68, 62, [50, 32], 9, 5) +
    card(192, 98, 86, 74, 10) + circ(222, 136, 20, "none", 'fill="none" stroke="var(--a-soft)" stroke-width="9"') + path("M222 116a20 20 0 0 1 19 26", "stk", 'stroke-width="9"') + path("M222 116a20 20 0 0 0-19 26", "stk", 'stroke="var(--a-navy)" stroke-width="9"') + lines(250, 128, [18, 14], 10, 5) + rect(214, 30, 62, 24, 12, "card") + circ(228, 42, 5, "spark") + rect(238, 39, 28, 6, 3, "ln") + sparkle(46, 62, 6) + plus(296, 86),

  // Accueil par défaut : cartes et étincelles
  accueil: () => stage(0) + win(70, 46, 150, 108) + rect(84, 70, 122, 30, 6, "ice") + lines(84, 112, [90, 64], 10, 5) + circ(244, 84, 22, "navy") + path("M244 70l4 10 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1z", "spark") + card(190, 130, 80, 40, 9) + rect(200, 142, 40, 6, 3, "ln2") + rect(200, 154, 28, 5, 2.5, "ln") + sparkle(52, 66, 6) + plus(290, 150) + circ(56, 150, 3.5, "blue", 'opacity=".45"'),
  // Titan XXVIII — formations (lecteur, progression, parcours d'étapes), tunnels (entonnoir en trois couches), réussite (anneau validé et étincelles)
  formations: () => stage(2) + win(52, 40, 156, 120) + rect(66, 62, 128, 58, 6, "ice") + circ(130, 91, 15, "blue") + path("M125 83l14 8-14 8z", "wh") + rect(66, 130, 128, 6, 3, "soft") + rect(66, 130, 82, 6, 3, "blue") + rect(66, 144, 70, 5, 2.5, "ln") +
    card(204, 76, 74, 92, 10) + [0, 1, 2].map((i) => circ(220, 98 + i * 24, 7, i < 2 ? "blue" : "soft") + rect(234, 95 + i * 24, 34, 6, 3, i < 2 ? "ln2" : "ln")).join("") + path("M216 98l3 3 5-6", "stkw", 'stroke-width="2"') +
    path("M222 40l30-14 30 14-30 14z", "navy") + path("M236 48v12c0 5 32 5 32 0V48", "navy", 'opacity=".85"') + path("M282 40v18", "stk", 'stroke-width="2.4"') + circ(282, 62, 3.5, "spark") + sparkle(46, 62, 6) + plus(298, 120),
  tunnels: () => stage(1) + [[110, 40, 5, "sky"], [160, 32, 5, "blue"], [208, 42, 5, "sky"]].map(([x, y, r, c]) => circ(x, y, r, c, 'opacity=".8"')).join("") +
    path("M76 60h168l-16 30H92z", "ice", 'stroke="var(--a-line)" stroke-width="1.2"') + path("M92 90h136l-16 30H108z", "sky", 'opacity=".75"') + path("M108 120h104l-14 26h-76z", "blue") + rect(142, 146, 36, 26, 6, "navy") + badge(160, 188, 10, "blue") +
    path("M110 46v10M160 38v18M208 48v8", "stk", 'stroke-width="1.8" stroke-dasharray="2 4"') + sparkle(268, 96, 6) + plus(52, 128),
  succes: () => stage(3) + circ(160, 104, 56, "card") + circ(160, 104, 46, "none", 'fill="none" stroke="var(--a-blue)" stroke-width="7" stroke-linecap="round" stroke-dasharray="230 60" transform="rotate(-70 160 104)"') + circ(160, 104, 34, "ice") + path("M141 106l14 14 28-30", "stk", 'stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"') +
    sparkle(86, 56, 7) + sparkle(244, 70, 6) + sparkle(252, 148, 5) + circ(80, 140, 4, "sky") + circ(236, 36, 3.5, "blue", 'opacity=".5"') + plus(98, 168) + plus(262, 112),

  // Palier visuel 2 — scènes de création de site (éditeur, IA, modèles, boutique, publication, assistant, état vide, plateforme, connexion)
  // Éditeur : colonne de blocs, page en cours d'édition avec un bloc sélectionné (poignées), curseur
  editeur: () => stage(1) + win(48, 36, 224, 140) + rect(58, 58, 44, 108, 6, "soft") + [0, 1, 2, 3].map((i) => rect(64, 66 + i * 24, 32, 18, 5, i === 1 ? "blue" : "card")).join("") +
    rect(112, 58, 150, 108, 6, "ice") + rect(120, 66, 134, 36, 5, "navy", 'opacity=".92"') + rect(128, 76, 56, 7, 3.5, "wh", 'opacity=".9"') + rect(128, 88, 84, 5, 2.5, "sky") + rect(222, 80, 24, 14, 7, "spark") +
    rect(120, 110, 40, 48, 5, "card") + rect(166, 110, 40, 48, 5, "card") + rect(212, 110, 42, 48, 5, "card") + rect(116, 62, 142, 44, 7, "none", 'fill="none" stroke="var(--a-blue)" stroke-width="1.6" stroke-dasharray="4 3"') + [[116, 62], [258, 62], [116, 106], [258, 106]].map(([x, y]) => rect(x - 3, y - 3, 6, 6, 1.5, "blue")).join("") +
    path("M236 128l-2 26 8-7 5 12 6-3-5-12 10-1z", "navy") + sparkle(40, 62, 6) + plus(296, 70) + circ(290, 156, 3.5, "blue", 'opacity=".45"'),

  // IA : une demande en texte devient une page (étapes reliées, étincelles)
  ia: () => stage(0) + card(40, 48, 100, 70, 10) + rect(50, 58, 54, 6, 3, "ln2") + lines(50, 72, [76, 62, 70], 10, 5) + rect(50, 104, 30, 8, 4, "blue") +
    path("M146 83h22", "stk", 'stroke-width="2.6" stroke-dasharray="1 6"') + circ(158, 83, 14, "navy") + path("M158 75l2.8 6.4 6.4 2.8-6.4 2.8L158 93l-2.8-6.4-6.4-2.8 6.4-2.8z", "spark") +
    win(176, 40, 104, 118) + rect(186, 62, 84, 26, 5, "ice") + rect(192, 69, 38, 6, 3, "navy") + rect(192, 79, 54, 4, 2, "sky") + rect(186, 96, 38, 30, 5, "soft") + rect(230, 96, 40, 13, 5, "soft") + rect(230, 113, 40, 13, 5, "soft") + rect(186, 134, 52, 12, 6, "blue") +
    [0, 1, 2].map((i) => circ(70 + i * 24, 156, 8, i < 2 ? "blue" : "soft")).join("") + path("M66 156l3 3 5-6", "stkw", 'stroke-width="2"') + path("M90 156l3 3 5-6", "stkw", 'stroke-width="2"') + sparkle(300, 60, 6) + plus(38, 28) + circ(292, 168, 3.5, "blue", 'opacity=".45"'),

  // Bibliothèque de modèles : grille de pages miniatures, une est choisie
  bibliotheque: () => stage(2) + [[44, 40], [118, 40], [192, 40], [44, 108], [118, 108], [192, 108]].map(([x, y], i) => {
      const body = [rect(x + 6, y + 14, 56, 22, 3, "ice") + lines(x + 8, y + 42, [50, 34], 7, 4), rect(x + 6, y + 14, 26, 38, 3, "ice") + rect(x + 36, y + 14, 26, 16, 3, "soft") + rect(x + 36, y + 34, 26, 18, 3, "soft"), rect(x + 6, y + 14, 56, 14, 3, "navy", 'opacity=".9"') + [0, 1, 2].map((k) => rect(x + 6 + k * 20, y + 34, 16, 24, 3, "soft")).join(""), rect(x + 6, y + 14, 56, 44, 3, "soft") + circ(x + 34, y + 36, 11, "sky") + rect(x + 22, y + 47, 24, 4, 2, "blue"), lines(x + 8, y + 16, [48, 40, 52, 30], 9, 4) + rect(x + 8, y + 54, 30, 8, 4, "blue"), rect(x + 6, y + 14, 56, 24, 3, "sky", 'opacity=".55"') + rect(x + 6, y + 42, 26, 16, 3, "ice") + rect(x + 36, y + 42, 26, 16, 3, "ice")][i];
      return card(x, y, 68, 68, 8) + body;
    }).join("") + rect(114, 36, 76, 76, 11, "none", 'fill="none" stroke="var(--a-blue)" stroke-width="2.4"') + badge(186, 40, 10) + sparkle(30, 34, 6) + plus(304, 100) + circ(300, 178, 3.5, "blue", 'opacity=".45"'),

  // Boutique : vitrine à auvent, produits, panier
  boutique: () => stage(3) + card(54, 78, 150, 96, 8) + path("M48 78l10-30h132l10 30z", "navy") + [0, 1, 2, 3, 4].map((i) => rect(52 + i * 30, 70, 30, 12, 6, i % 2 ? "sky" : "card")).join("") +
    [0, 1, 2].map((i) => rect(66 + i * 44, 98, 36, 36, 6, "ice") + circ(84 + i * 44, 112, 8, i === 1 ? "spark" : "blue") + rect(70 + i * 44, 140, 28, 5, 2.5, "ln") + rect(70 + i * 44, 150, 16, 5, 2.5, "ln2")).join("") +
    card(218, 92, 60, 74, 10) + path("M232 108h6l5 22h20l4-14h-27", "stk", 'stroke-width="2.4"') + circ(246, 140, 3.2, "navy") + circ(260, 140, 3.2, "navy") + rect(230, 148, 36, 8, 4, "blue") + circ(272, 90, 11, "spark") + rect(268, 87, 8, 6, 3, "wh") +
    sparkle(40, 60, 6) + plus(296, 60) + circ(38, 160, 3.5, "blue", 'opacity=".45"'),

  // Publication : page reliée à un globe, coche de mise en ligne
  publication: () => stage(0) + win(40, 56, 116, 98) + rect(50, 78, 96, 28, 5, "ice") + rect(56, 86, 40, 6, 3, "navy") + rect(56, 96, 60, 4, 2, "sky") + lines(50, 114, [76, 56], 9, 5) + rect(50, 134, 38, 12, 6, "blue") +
    path("M158 105h30", "stk", 'stroke-width="2.6" stroke-dasharray="1 6"') + circ(236, 104, 44, "card") + circ(236, 104, 44, "none", 'fill="none" stroke="var(--a-blue)" stroke-width="2.4"') + path("M192 104h88M236 60v88", "stkl", 'stroke-width="1.6"') + path("M204 78c20 8 52 8 64 0M204 130c20-8 52-8 64 0", "stkl", 'stroke-width="1.6"') + path("M236 60c-24 24-24 64 0 88c24-24 24-64 0-88z", "stkl", 'stroke-width="1.6"') +
    badge(270, 70, 13) + rect(188, 36, 58, 18, 9, "navy") + rect(196, 43, 30, 4, 2, "sky") + sparkle(34, 40, 6) + plus(300, 160) + circ(176, 176, 3.5, "blue", 'opacity=".45"'),

  // Assistant : trois étapes, la première validée, la seconde en cours
  assistant: () => stage(3) + path("M92 108h30m62 0h30", "stk", 'stroke-width="2.4" stroke-dasharray="2 6"') +
    card(40, 66, 74, 84, 10) + circ(77, 94, 14, "blue") + check(77, 94.5, 6).replace('class="stkw"', 'class="stkw"') + rect(54, 120, 46, 6, 3, "ln2") + rect(60, 132, 34, 5, 2.5, "ln") +
    g(card(118, 54, 84, 108, 11), "") + rect(118, 54, 84, 108, 11, "none", 'fill="none" stroke="var(--a-blue)" stroke-width="2.2"') + circ(160, 90, 16, "navy") + path("M154 90h12m-6-6v12", "stkw", 'stroke-width="2.4"') + rect(132, 118, 56, 7, 3.5, "navy") + rect(138, 132, 44, 5, 2.5, "ln") + rect(142, 142, 36, 10, 5, "blue") +
    card(206, 66, 74, 84, 10) + circ(243, 94, 14, "soft") + rect(220, 120, 46, 6, 3, "ln") + rect(226, 132, 34, 5, 2.5, "ln") + sparkle(46, 46, 6) + plus(294, 46) + circ(292, 168, 3.5, "blue", 'opacity=".45"') + rect(132, 36, 56, 12, 6, "ice"),

  // Aucun site : fenêtre vide en pointillés et grand « + » à remplir
  nouveausite: () => stage(2) + rect(62, 46, 196, 124, 12, "none", 'fill="var(--a-card)" fill-opacity=".55" stroke="var(--a-line2)" stroke-width="2" stroke-dasharray="7 6"') + path("M62 68V58a12 12 0 0 1 12-12h172a12 12 0 0 1 12 12v10z", "ice") + circ(76, 57, 2.4, "sky") + circ(85, 57, 2.4, "sky", 'opacity=".7"') + circ(94, 57, 2.4, "sky", 'opacity=".45"') +
    circ(160, 112, 30, "blue") + path("M160 96v32M144 112h32", "stkw", 'stroke-width="5"') + rect(116, 152, 88, 6, 3, "ln") + rect(134, 162, 52, 5, 2.5, "ln2") + sparkle(46, 70, 6) + sparkle(280, 140, 7) + plus(290, 62) + circ(46, 150, 3.5, "blue", 'opacity=".45"'),

  // Plateforme (hero) : l'éditeur au centre, une boutique, une formation et des mesures qui l'entourent
  plateforme: () => stage(0) + win(88, 30, 150, 116) + rect(98, 52, 130, 34, 5, "navy", 'opacity=".92"') + rect(106, 62, 54, 7, 3.5, "wh", 'opacity=".9"') + rect(106, 74, 80, 5, 2.5, "sky") + rect(196, 60, 24, 14, 7, "spark") + rect(98, 94, 40, 42, 5, "ice") + rect(144, 94, 40, 42, 5, "soft") + rect(190, 94, 38, 42, 5, "ice") +
    g(card(0, 0, 70, 78, 10) + rect(8, 8, 54, 36, 6, "ice") + circ(35, 26, 9, "blue") + rect(8, 52, 40, 5, 2.5, "ln2") + rect(8, 62, 26, 5, 2.5, "ln") + circ(58, 62, 7, "spark"), "translate(14 98) rotate(-5)") +
    g(card(0, 0, 76, 70, 10) + rect(8, 8, 60, 34, 6, "navy") + circ(38, 25, 9, "card") + path("M35 20l9 5-9 5z", "blue") + rect(8, 48, 60, 5, 2.5, "soft") + rect(8, 48, 38, 5, 2.5, "blue"), "translate(236 96) rotate(5)") +
    card(236, 28, 70, 46, 10) + path("M246 62c8-14 14-4 22-14s14-4 28-12", "stk", 'stroke-width="2.4"') + circ(292, 38, 3.2, "spark") +
    card(20, 30, 62, 40, 9) + circ(36, 50, 9, "sky") + path("M31 50l4 4 7-8", "stk", 'stroke="var(--a-navy)" stroke-width="2.4"') + rect(50, 44, 24, 5, 2.5, "ln2") + rect(50, 54, 16, 5, 2.5, "ln") +
    path("M60 94c8-10 14-12 24-12M240 92c-8-8-12-12-22-12", "stkl", 'stroke-dasharray="2 5"') + sparkle(172, 14, 7) + plus(308, 150) + plus(12, 150) + circ(160, 184, 3.5, "blue", 'opacity=".45"'),

  // Connexion : carte de compte, cadenas et clé
  connexion: () => stage(1) + card(84, 40, 152, 118, 12) + circ(160, 78, 18, "ice") + avatar(160, 80, 16, "blue") + rect(112, 106, 96, 14, 7, "soft") + rect(120, 111, 44, 4, 2, "ln2") + rect(112, 126, 96, 14, 7, "soft") + circle5(130, 133) +
    g(rect(0, 12, 40, 32, 7, "navy") + path("M8 12V8a12 12 0 0 1 24 0v4", "none", 'fill="none" stroke="var(--a-navy)" stroke-width="5"') + circ(20, 27, 4, "spark") + rect(18, 29, 4, 8, 2, "spark"), "translate(220 118)") +
    g(circ(0, 0, 9, "spark") + circ(0, 0, 3.4, "card") + rect(8, -2.5, 30, 5, 2.5, "spark") + rect(28, 2, 5, 8, 1.5, "spark"), "translate(58 132) rotate(-18)") + sparkle(50, 60, 6) + plus(286, 62) + circ(290, 176, 3.5, "blue", 'opacity=".45"'),
};

const ALIASES = {
  pages: "pages", page: "pages", landing: "pages", articles: "articles", article: "articles", blog: "articles", mediatheque: "media", medias: "media", media: "media", fichiers: "media",
  commentaires: "commentaires", comments: "commentaires", utilisateurs: "utilisateurs", users: "utilisateurs", equipe: "utilisateurs", themes: "themes", apparence: "themes", styles: "themes", polices: "themes",
  extensions: "extensions", modules: "extensions", composants: "extensions", seo: "seo", redirections: "redirections", "liens-casses": "redirections", navigation: "navigation", menus: "navigation",
  outils: "outils", diagnostic: "diagnostic", sante: "diagnostic", maintenance: "outils", sauvegardes: "sauvegardes", systeme: "outils", cache: "outils", parametres: "parametres", reglages: "parametres",
  email: "email", emailing: "email", campagnes: "email", modeles: "email", contacts: "contacts", listes: "contacts", segments: "contacts", formulaires: "formulaires", sondages: "formulaires",
  automatisations: "automatisations", parcours: "automatisations", tunnels: "automatisations", connecteurs: "connecteurs", integrations: "connecteurs", webhooks: "connecteurs", api: "connecteurs",
  recherche: "recherche", vide: "recherche", import: "echanges", importer: "echanges", exporter: "echanges", export: "echanges", widgets: "widgets", corbeille: "corbeille", "tests-ab": "tests", tests: "tests",
  analytics: "analytics", statistiques: "analytics", dashboard: "dashboard", "tableau-de-bord": "dashboard", accueil: "accueil", sites: "dashboard",
  // Noms d'icônes (src/utils/icons.js) : un état vide qui ne précise que son icône reçoit la scène du même thème
  layout: "pages", layers: "extensions", arrowrightleft: "redirections", users: "utilisateurs", user: "contacts", globe: "dashboard", searchcheck: "seo", search: "recherche", inbox: "commentaires",
  filetext: "articles", image: "media", palette: "themes", settings: "parametres", sliders: "outils", send: "email", mail: "email", listchecks: "formulaires", zap: "automatisations", plug: "connecteurs",
  download: "echanges", upload: "echanges", trash: "corbeille", list: "contacts", tag: "articles", shield: "sauvegardes", activity: "analytics", barchart: "analytics", messagesquare: "commentaires", menu: "navigation", link: "redirections",
  filter: "automatisations", funnel: "tunnels", funnels: "tunnels", formation: "formations", cours: "formations", lms: "formations", apprentissage: "formations", reussite: "succes", felicitations: "succes", valide: "succes", clock: "sauvegardes", editeur: "editeur", "editeur-de-site": "editeur", "page-builder": "editeur", ia: "ia", ai: "ia", intelligence: "ia", sparkles: "ia", wand: "ia", bibliotheque: "bibliotheque", "modeles-de-site": "bibliotheque", gabarits: "bibliotheque", boutique: "boutique", shop: "boutique", commerce: "boutique", produits: "boutique", panier: "boutique", shoppingcart: "boutique", publication: "publication", publier: "publication", "en-ligne": "publication", assistant: "assistant", "creer-site": "assistant", wizard: "assistant", etapes: "assistant", nouveausite: "nouveausite", "nouveau-site": "nouveausite", "aucun-site": "nouveausite", plateforme: "plateforme", kolakisa: "plateforme", connexion: "connexion", login: "connexion", compte: "connexion", securite: "connexion", lock: "connexion", checkcircle: "diagnostic", smartphone: "email", home: "accueil", star: "accueil",
};

const NAMES = Object.keys(SCENES);

/** Clé de scène pour un nom (alias compris) ; renvoie « accueil » à défaut. */
function resolve(name) {
  const k = String(name || "").toLowerCase();
  if (SCENES[k]) return k;
  return ALIASES[k] || "accueil";
}

/**
 * Illustration inline.
 * @param {string} name   nom de scène ou alias (voir NAMES / ALIASES)
 * @param {{label?: string, className?: string}} [opts]  label : texte alternatif ; sans label, l'image est décorative (aria-hidden)
 */
function illu(name, opts = {}) {
  const key = resolve(name);
  const a11y = opts.label ? `role="img" aria-label="${String(opts.label).replace(/"/g, "&quot;")}"` : 'aria-hidden="true"';
  return `<svg class="kx-art kx-art--${key}${opts.className ? " " + opts.className : ""}" viewBox="0 0 320 210" width="320" height="210" ${a11y} focusable="false" xmlns="http://www.w3.org/2000/svg">${SCENES[key]()}</svg>`;
}

module.exports = { illu, resolve, NAMES, ALIASES };
