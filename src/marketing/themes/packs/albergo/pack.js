// Albergo — hôtel boutique fictif (Maison Solana). Direction artistique : luxe chaleureux. Lin, terre cuite, laiton ; plâtre, grain, zellige et terrazzo dessinés en CSS/SVG ;
// « photographie lente » : scènes SVG (chambres, patio, petit-déjeuner) en diaporama lent ; sélecteur de chambres et de dates avec calendrier accessible, nuits calculées et demande envoyée à /contact.
const { sec, esc, nav } = require("../kit");
const K = { lin: "#f1e7d6", pla: "#e7d2b4", pla2: "#d6b992", terra: "#b9552f", terra2: "#8c3b20", brass: "#b58b3c", brassL: "#e0c277", olive: "#66714a", oliveD: "#454e2e", deep: "#3a2a20", cream: "#fbf5ea", teal: "#2f6f6a", sky: "#c4dadb", sun: "#f5dca0", rose: "#c2456e", wood: "#c99a6b", woodD: "#a87848" };
const R = (x, y, w, h, f, o = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o}/>`;
const RR = (x, y, w, h, rx, f, o = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"${o}/>`;
const E = (cx, cy, rx, ry, f, o = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"${o}/>`;
const C = (cx, cy, r, f, o = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${o}/>`;
const Pa = (d, f, o = "") => `<path d="${d}" fill="${f}"${o}/>`;
const L = (d, s, w = 2, o = "") => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round"${o}/>`;
const PG = (pts, f, o = "") => `<polygon points="${pts}" fill="${f}"${o}/>`;
const wrap = (inner, label, vb = "0 0 640 800") => `<svg class="al-scene" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${inner}</svg>`;

// Sol en zellige (losanges décalés, trois teintes)
function zellige(y0, y1, size, cols) {
  let s = "", row = 0;
  for (let y = y0; y < y1; y += size / 2, row++) {
    for (let x = (row % 2 ? size / 2 : 0) - size; x < 700; x += size) {
      const f = cols[(Math.floor(x / size) + row) % cols.length];
      s += PG(`${x},${y} ${x + size / 2},${y - size / 3} ${x + size},${y} ${x + size / 2},${y + size / 3}`, f, ` stroke="${K.cream}" stroke-width="2"`);
    }
  }
  return s;
}

function bedroom(v = "olive", label = "Chambre") {
  const T = { olive: { wall: "#e8d6b8", deco: K.terra, floor: K.wood }, sea: { wall: "#ece3d2", deco: K.teal, floor: "#d8b98e" }, patio: { wall: "#e1c7a4", deco: K.olive, floor: K.woodD }, roof: { wall: "#efdcc3", deco: "#7d3b2a", floor: K.wood } }[v];
  const view = {
    olive: R(60, 90, 200, 400, "#cfe0d8") + C(160, 330, 62, K.olive) + C(120, 300, 44, K.oliveD, ' opacity=".8"') + C(200, 310, 40, "#7c8a58") + R(155, 340, 10, 150, K.deep) + R(60, 430, 200, 60, "#a8b484", ' opacity=".8"') + C(190, 200, 26, K.sun, ' opacity=".8"'),
    sea: R(60, 90, 200, 190, "#cfe3e6") + R(60, 280, 200, 210, "#6fa7ab") + R(60, 280, 200, 4, K.cream) + L("M80 330h60M150 360h80M95 400h70", K.cream, 3, ' opacity=".6"') + C(205, 190, 24, K.sun),
    patio: R(60, 90, 200, 400, "#9bb089") + R(60, 90, 200, 150, "#d9c29b") + Pa("M90 490V300a40 40 0 0 1 80 0V490z", K.deep, ' opacity=".6"') + C(210, 330, 38, K.rose, ' opacity=".85"') + C(230, 370, 30, "#d9638b", ' opacity=".8"'),
    roof: R(60, 90, 200, 140, "#f0b985") + R(60, 230, 200, 80, "#e98d5f") + C(160, 250, 34, K.sun) + Pa("M60 380Q120 300 180 360T260 340V490H60z", "#7a5a46") + Pa("M60 430Q140 370 260 420V490H60z", K.oliveD),
  }[v];
  return wrap(
    R(0, 0, 640, 560, T.wall) + R(0, 0, 640, 560, K.cream, ' opacity=".18"') + R(0, 552, 640, 248, T.floor) +
    L("M0 610H640M0 680H640M0 770H640", K.deep, 2, ' opacity=".18"') + R(0, 548, 640, 12, K.cream) +
    Pa("M60 490V190a100 100 0 0 1 200 0V490z", K.sky) + `<g>${view}</g>` + Pa("M60 490V190a100 100 0 0 1 200 0V490z", "none", ` stroke="${K.deep}" stroke-width="9"`) + L("M160 90V490M60 300H260", K.deep, 5) +
    PG("60,490 260,490 470,800 150,800", K.sun, ' opacity=".28"') + PG("260,170 560,100 560,170 260,300", K.sun, ' opacity=".12"') +
    Pa("M22 90h40v420H22z", K.cream) + L("M34 100V500M46 100V500", K.pla2, 3) + Pa("M258 90h40v420h-40z", K.cream) + L("M270 100V500M282 100V500", K.pla2, 3) +
    Pa("M110 800 140 640H660L700 800z", T.deco, ' opacity=".5"') + L("M130 690H680M120 740H690", K.cream, 3, ' opacity=".7"') +
    Pa("M250 560V380a170 100 0 0 1 340 0V560z", T.deco) + Pa("M268 560V386a152 84 0 0 1 304 0V560z", "none", ` stroke="${K.brassL}" stroke-width="3"`) +
    RR(235, 500, 370, 120, 14, K.cream) + RR(235, 500, 370, 20, 10, "#fff", ' opacity=".6"') +
    RR(272, 452, 130, 66, 26, "#fffaf0") + RR(412, 452, 130, 66, 26, "#fffaf0") + L("M290 470q40 14 100 0M430 470q40 14 100 0", K.pla2, 2) + RR(340, 498, 160, 40, 18, K.olive, ' opacity=".9"') +
    L("M260 560q60 20 120 4t120-2", K.pla2, 3) + R(235, 585, 370, 36, T.deco, ' opacity=".9"') + L("M235 596h370M235 608h370", K.brassL, 2) + RR(225, 608, 390, 14, 6, K.pla2, ' opacity=".8"') +
    E(420, 636, 220, 16, K.deep, ' opacity=".22"') +
    R(116, 508, 70, 96, K.woodD) + R(116, 508, 70, 10, K.deep, ' opacity=".35"') + R(124, 604, 8, 30, K.deep) + R(170, 604, 8, 30, K.deep) +
    R(147, 470, 7, 40, K.brass) + PG("124,420 178,420 190,470 112,470", K.cream) + E(151, 470, 40, 8, K.sun, ' opacity=".7"') + C(151, 440, 74, K.sun, ' opacity=".12"') +
    L("M560 0V120", K.deep, 2) + Pa("M520 120a40 36 0 0 1 80 0z", K.brass) + E(560, 124, 34, 8, K.sun, ' opacity=".6"') + C(560, 150, 70, K.sun, ' opacity=".1"'),
    label);
}

function patio(label = "Le patio") {
  let beams = ""; for (let x = 20; x < 640; x += 70) beams += R(x, 40, 10, 70, K.deep, ' opacity=".7"');
  let bulbs = ""; for (let i = 0; i < 9; i++) { const x = 40 + i * 70, y = 128 + Math.sin(i * 1.57) * 18 + 8; bulbs += C(x, y, 6, K.sun) + C(x, y, 17, K.sun, ' opacity=".18"'); }
  return wrap(
    R(0, 0, 640, 140, "#cfe2e3") + R(0, 110, 640, 420, K.pla) + R(0, 110, 640, 420, K.terra, ' opacity=".08"') +
    R(0, 52, 640, 14, K.deep) + beams + R(0, 98, 640, 12, K.terra2) +
    [70, 250, 430].map((x, i) => Pa(`M${x} 520V320a70 70 0 0 1 140 0V520z`, "#4d392c") + Pa(`M${x + 12} 520V324a58 58 0 0 1 116 0V520z`, i === 1 ? "#f0cd8a" : "#6e5238", ` opacity="${i === 1 ? ".85" : ".7"}"`) + Pa(`M${x} 520V320a70 70 0 0 1 140 0V520z`, "none", ` stroke="${K.terra}" stroke-width="7"`)).join("") +
    L("M10 126Q170 190 330 126T640 126", K.deep, 2) + bulbs +
    C(560, 300, 34, K.rose, ' opacity=".9"') + C(590, 340, 40, "#d9638b", ' opacity=".85"') + C(540, 360, 28, K.rose, ' opacity=".85"') + C(600, 280, 22, "#e06e96") +
    R(0, 520, 640, 280, K.cream) + zellige(560, 860, 120, [K.teal, K.cream, K.terra, K.sun]) +
    E(320, 690, 190, 50, K.pla2) + E(320, 682, 180, 44, K.cream) + E(320, 682, 160, 36, K.teal) + E(320, 682, 160, 36, K.sky, ' opacity=".3"') + L("M200 684q40 8 80 0M360 676q40 8 80 0", K.cream, 2, ' opacity=".6"') +
    R(310, 570, 20, 110, K.pla2) + E(320, 572, 38, 10, K.pla2) + L("M320 564q-40-40-70 10M320 564q40-40 70 10M320 564V520", K.brassL, 4) + E(320, 520, 8, 4, K.sky) +
    Pa("M70 800 84 680H156L170 800z", K.terra) + R(76, 676, 88, 14, K.terra2) + C(120, 610, 56, K.olive) + C(88, 640, 34, K.oliveD) + C(150, 636, 38, "#7c8a58") + R(114, 650, 10, 40, K.deep) +
    Pa("M470 800 484 690H566L580 800z", K.terra) + R(476, 686, 98, 14, K.terra2) + C(525, 630, 50, "#8a9a52") + C(500, 650, 30, K.sun, ' opacity=".9"') + C(552, 640, 26, K.brassL),
    label);
}

function breakfast(label = "Le petit-déjeuner") {
  let slats1 = "", slats2 = ""; for (let y = 64; y < 360; y += 40) { slats1 += L(`M32 ${y}H168`, "#3d4727", 3, ' opacity=".6"'); slats2 += L(`M472 ${y}H608`, "#3d4727", 3, ' opacity=".6"'); }
  return wrap(
    R(0, 0, 640, 400, K.pla) + RR(180, 50, 280, 320, 4, "#d7e8ea") + C(320, 190, 70, K.sun, ' opacity=".6"') + L("M180 210H460M320 50V370", K.cream, 6) +
    R(20, 40, 160, 340, K.olive) + slats1 + R(460, 40, 160, 340, K.olive) + slats2 + R(0, 372, 640, 14, K.cream) +
    R(0, 386, 640, 414, K.lin) + R(0, 386, 640, 414, K.pla2, ' opacity=".25"') + R(0, 386, 640, 18, K.terra, ' opacity=".85"') + L("M0 420H640M0 700H640", K.pla2, 2) +
    PG("180,50 460,50 640,386 0,386", K.sun, ' opacity=".12"') +
    E(190, 600, 150, 52, K.deep, ' opacity=".16"') + E(190, 590, 144, 48, "#fff") + E(190, 590, 112, 34, K.cream, ' stroke="#e5d9c4" stroke-width="2"') +
    Pa("M110 590q10-44 54-40-14 18-12 46z", "#dba04a") + Pa("M166 578q18-40 62-30-12 20-8 44z", "#e0ad5a") + Pa("M130 604q30 18 70 0-6 20-35 22t-35-22z", "#c98a3a") + L("M126 574l18-8M180 566l18-8", "#a8702c", 2) +
    E(480, 590, 96, 34, K.deep, ' opacity=".18"') + E(480, 560, 92, 50, "#9a6a3a") + E(480, 548, 80, 38, "#c28a4a") + E(450, 540, 34, 16, "#e5b872") + E(500, 536, 34, 16, "#d9a45e") + L("M440 548q10-8 20 0M490 544q10-8 20 0", "#a8702c", 2) +
    R(320, 500, 70, 84, K.brass) + Pa("M320 500q35-30 70 0z", K.brassL) + Pa("M390 520q30 4 40-14", "none", ` stroke="${K.brass}" stroke-width="9"`) + R(332, 584, 46, 8, K.brass) + R(346, 480, 18, 20, K.brass) + C(355, 478, 8, K.brassL) +
    E(280, 680, 56, 18, "#fff") + E(280, 668, 34, 14, K.cream) + E(280, 666, 24, 8, "#3d2a1f") + E(420, 690, 56, 18, "#fff") + E(420, 678, 34, 14, K.cream) + E(420, 676, 24, 8, "#3d2a1f") +
    Pa("M70 540h46l-4 100H74z", "#fbe9c8", ' opacity=".9"') + Pa("M72 570h42l-2 70H74z", "#f2a33a") + E(93, 540, 23, 5, "#fff", ' opacity=".7"') +
    C(560, 680, 26, "#ee8a2a") + C(600, 700, 22, "#f09a3a") + C(540, 720, 24, "#e87a1e") + Pa("M562 654q10-14 20-10-4 12-20 10z", K.olive) +
    R(130, 700, 70, 66, K.brass, ' opacity=".9"') + R(134, 692, 62, 14, K.deep) + R(140, 716, 50, 30, K.cream) +
    Pa("M580 400 590 300", "none", ` stroke="${K.oliveD}" stroke-width="4"`) + R(560, 340, 46, 56, "#e0d4bd") + R(566, 330, 34, 14, "#d2c3a6") + C(590, 300, 14, K.rose) + C(572, 318, 12, "#e5a0b4") + C(606, 322, 12, "#fff") + L("M583 340 575 330M591 340 600 326", K.olive, 4),
    label);
}

function spa(label = "Le hammam") {
  return wrap(
    R(0, 0, 640, 800, "#c98e6a") + R(0, 0, 640, 800, K.terra, ' opacity=".12"') + L("M0 120Q320 160 640 110M0 250Q320 290 640 240", "#b87c58", 3, ' opacity=".5"') +
    Pa("M110 560V280a210 210 0 0 1 420 0V560z", "#6e3a28") + Pa("M135 560V285a185 185 0 0 1 370 0V560z", "#4a2819") + Pa("M110 560V280a210 210 0 0 1 420 0V560z", "none", ` stroke="${K.brassL}" stroke-width="6"`) +
    C(320, 380, 150, K.sun, ' opacity=".1"') + [210, 320, 430].map((x, i) => R(x - 6, 480 - i % 2 * 20, 12, 40 + i % 2 * 20, K.cream) + Pa(`M${x} ${470 - i % 2 * 20}q-8-14 0-26 8 12 0 26z`, "#ffd27a") + C(x, 462 - i % 2 * 20, 26, K.sun, ' opacity=".2"')).join("") +
    R(60, 560, 520, 50, "#a6603f") + R(60, 560, 520, 8, K.cream, ' opacity=".5"') + R(0, 610, 640, 190, "#8f4a2c") +
    R(0, 640, 640, 160, K.teal) + R(0, 640, 640, 160, K.deep, ' opacity=".12"') + L("M60 690q60 12 120 0t120 0t120 0t120 0M20 740q70 12 140 0t140 0t140 0t140 0", K.sky, 3, ' opacity=".5"') + E(320, 665, 170, 14, K.sun, ' opacity=".25"') +
    RR(430, 520, 110, 40, 12, K.cream) + RR(440, 490, 100, 40, 12, "#f4ead6") + RR(450, 460, 90, 40, 12, K.cream) + L("M450 478h90M440 508h100", K.pla2, 2) +
    Pa("M190 430q-30-60 10-110t-10-110", "none", ` stroke="#fff" stroke-width="22" opacity=".18" stroke-linecap="round"`) + Pa("M460 400q-30-60 10-110t-10-100", "none", ` stroke="#fff" stroke-width="18" opacity=".14" stroke-linecap="round"`) +
    L("M110 0V70", K.deep, 2) + L("M530 0V110", K.deep, 2) + PG("90,70 130,70 140,120 80,120", K.brass) + PG("510,110 550,110 560,160 500,160", K.brass) + C(110, 98, 8, K.sun) + C(530, 138, 8, K.sun) + C(110, 98, 50, K.sun, ' opacity=".12"') + C(530, 138, 50, K.sun, ' opacity=".12"') +
    E(60, 780, 28, 12, "#7d6a5a") + E(110, 786, 22, 9, "#9a8672") + E(570, 782, 30, 12, "#7d6a5a"),
    label);
}

function dinner(label = "La salle du soir") {
  const lamp = (x, y) => L(`M${x} 0V${y}`, K.brass, 2) + Pa(`M${x - 34} ${y + 44}a34 44 0 0 1 68 0z`, K.brass) + E(x, y + 46, 34, 7, K.sun) + C(x, y + 60, 70, K.sun, ' opacity=".16"');
  return wrap(
    R(0, 0, 640, 800, "#2c3322") + R(0, 0, 640, 800, "#000", ' opacity=".12"') + Pa("M170 560V240a150 150 0 0 1 300 0V560z", "#27425a") + Pa("M170 560V330a150 150 0 0 1 300 0V560z", "#3d5f78", ' opacity=".5"') + C(380, 210, 22, K.sun, ' opacity=".85"') + Pa("M170 560V240a150 150 0 0 1 300 0V560z", "none", ` stroke="${K.brassL}" stroke-width="6"`) + L("M320 90V560M170 330H470", K.brassL, 4) +
    Pa("M170 520Q250 440 320 500T470 470V560H170z", K.oliveD) + lamp(90, 120) + lamp(320, 40) + lamp(550, 140) +
    R(0, 560, 640, 240, "#4a2f20") + L("M0 640H640M0 730H640", "#2c1c12", 3, ' opacity=".6"') +
    PG("0,600 640,600 700,800 -60,800", K.cream) + PG("0,600 640,600 640,616 0,616", "#fff", ' opacity=".8"') + L("M60 700h520", K.pla2, 2) +
    RR(30, 470, 110, 150, 28, K.terra, ' opacity=".95"') + RR(500, 470, 110, 150, 28, K.terra, ' opacity=".95"') +
    E(200, 690, 78, 22, "#fff") + E(200, 686, 54, 14, K.cream, ' stroke="#e5d9c4" stroke-width="2"') + E(440, 690, 78, 22, "#fff") + E(440, 686, 54, 14, K.cream, ' stroke="#e5d9c4" stroke-width="2"') +
    Pa("M120 690 128 620 136 690z", "#fff", ' opacity=".5"') + Pa("M290 690q0-44 18-56h24q18 12 18 56z", "#fff", ' opacity=".4"') + R(318, 650, 4, 40, "#fff", ' opacity=".5"') + Pa("M296 664q24 8 48 0v14q-24 8-48 0z", "#7a1d3a", ' opacity=".85"') +
    R(310, 560, 20, 110, K.deep) + R(314, 556, 12, 8, K.deep) + Pa("M368 700q0-46 18-56h24q18 10 18 56z", "#fff", ' opacity=".4"') +
    R(224, 720, 10, 54, K.cream) + Pa("M229 716q-8-14 0-26 8 12 0 26z", "#ffd27a") + C(229, 704, 30, K.sun, ' opacity=".25"') + R(404, 724, 10, 50, K.cream) + Pa("M409 720q-8-14 0-26 8 12 0 26z", "#ffd27a") + C(409, 708, 30, K.sun, ' opacity=".25"'),
    label);
}

function terrace(label = "La terrasse au couchant") {
  return wrap(
    R(0, 0, 640, 200, "#f6c98a") + R(0, 120, 640, 120, "#f0a36b") + R(0, 220, 640, 120, "#df7f5a") + R(0, 0, 640, 80, "#f3dca8", ' opacity=".6"') + C(430, 300, 80, K.sun, ' opacity=".35"') + C(430, 300, 48, "#fff3cf") +
    Pa("M0 380Q120 300 240 360T460 330T640 360V520H0z", "#9a5a48") + Pa("M0 440Q160 370 300 430T640 410V540H0z", "#6e4d3e") + Pa("M0 490Q200 440 380 480T640 470V560H0z", K.oliveD) +
    [90, 150, 560].map((x, i) => E(x, 430 + i % 2 * 12, 14, 70, "#2f3820") + L(`M${x} ${500}V ${520}`, K.deep, 4)).join("") +
    R(0, 540, 640, 260, K.cream) + R(0, 540, 640, 20, K.pla2) + RR(60, 580, 520, 150, 8, K.teal) + RR(60, 580, 520, 150, 8, K.sky, ' opacity=".35"') + L("M100 620q40 10 80 0t80 0t80 0M180 670q40 10 80 0t80 0", K.cream, 3, ' opacity=".6"') + PG("300,590 440,590 380,730 250,730", "#f6c98a", ' opacity=".35"') +
    RR(40, 570, 560, 16, 4, K.pla2) + R(0, 740, 640, 60, K.pla) +
    PG("460,640 620,640 600,720 480,720", K.cream, ' opacity="0"') +
    L("M505 520V740", K.deep, 5) + Pa("M440 520Q505 450 570 520z", K.terra) + L("M472 505V520M505 488V520M538 505V520", K.cream, 3) +
    RR(90, 750, 130, 26, 12, K.cream) + RR(70, 740, 40, 14, 6, K.terra) + RR(250, 750, 130, 26, 12, K.cream) + RR(230, 740, 40, 14, 6, K.terra) +
    Pa("M0 800 14 700H80L94 800z", K.terra) + C(47, 668, 40, K.olive) + Pa("M546 800 560 710H622L636 800z", K.terra) + C(590, 690, 32, "#8a9a52"),
    label);
}

// Vignette légère (sélecteur de chambre) : fenêtre en arche et lit stylisés
const thumb = (v) => { const T = { olive: ["#e8d6b8", "#b9552f", "#8da07a"], sea: ["#ece3d2", "#2f6f6a", "#8fc0c4"], patio: ["#e1c7a4", "#66714a", "#9bb089"], roof: ["#efdcc3", "#7d3b2a", "#f0a36b"] }[v]; return wrap(R(0, 0, 320, 200, T[0]) + R(0, 150, 320, 50, "#c99a6b") + Pa("M40 150V70a40 40 0 0 1 80 0v80z", T[2]) + Pa("M40 150V70a40 40 0 0 1 80 0v80z", "none", ` stroke="${K.deep}" stroke-width="4"`) + Pa("M170 150V95a60 36 0 0 1 120 0v55z", T[1]) + RR(160, 128, 140, 40, 8, K.cream) + RR(172, 112, 50, 24, 10, "#fffaf0") + R(160, 150, 140, 12, T[1], ' opacity=".85"'), "", "0 0 320 200"); };


const ROOMS = [
  { id: "lin", name: "Chambre Lin", size: 26, max: 2, price: 165, view: "sea", cat: "duo", tag: "Vue sur le jardin", line: "Lit king 180, douche à l'italienne, lin lavé et lumière du matin.", feats: ["Lit king 180 × 200", "Douche à l'italienne en tadelakt", "Bureau et fauteuil en rotin", "Climatisation silencieuse", "Wi-Fi fibre"] },
  { id: "olivier", name: "Chambre Olivier", size: 32, max: 2, price: 195, view: "olive", cat: "duo", tag: "Baignoire îlot", line: "Fenêtre en arche sur les oliviers, baignoire îlot et tête de lit en terre cuite.", feats: ["Lit king 180 × 200", "Baignoire îlot et douche", "Fenêtre en arche sur les oliviers", "Minibar de la maison", "Wi-Fi fibre"] },
  { id: "patio", name: "Suite Patio", size: 46, max: 3, price: 285, view: "patio", cat: "famille", tag: "Accès direct au patio", line: "Chambre, salon et porte-fenêtre sur le patio : idéale pour trois voyageurs.", feats: ["Lit king + canapé-lit", "Salon séparé", "Accès direct au patio", "Salle de bain double vasque", "Machine à café et bouilloire"] },
  { id: "belvedere", name: "Suite Belvédère", size: 62, max: 4, price: 395, view: "roof", cat: "famille", tag: "Terrasse privée", line: "Sous le toit : terrasse privée, bain extérieur et vue sur les collines au couchant.", feats: ["Lit king + deux lits simples", "Terrasse privée de 20 m²", "Bain extérieur", "Cheminée au bois", "Bar privé"] },
];
const roomScene = (r, lab) => bedroom(r.view, lab === undefined ? r.name : lab);
const eur = (n) => `${n} €`;

const mark = `<svg class="al-mark" viewBox="0 0 40 44" aria-hidden="true"><path d="M5 42V18a15 15 0 0 1 30 0v24z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M11 42V19a9 9 0 0 1 18 0v23z" fill="currentColor" opacity=".16"/><circle cx="20" cy="17" r="3.4" fill="currentColor"/><path d="M3 42h34" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const arrow = `<svg class="al-ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const star = `<svg class="al-orn" viewBox="0 0 60 12" aria-hidden="true"><path d="M2 6h20M38 6h20" stroke="currentColor" stroke-width="1" opacity=".6"/><path d="M30 0l3.5 6L30 12l-3.5-6z" fill="currentColor"/></svg>`;
const ico = {
  sun: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  leaf: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 26C6 14 14 6 27 5c0 13-7 21-19 21z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 26 20 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  cup: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 12h18v7a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7zM23 14h3a3 3 0 0 1 0 6h-3M10 4c0 3 3 3 3 6M16 4c0 3 3 3 3 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  key: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="10" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16h13M24 16v5M28 16v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  pin: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29c6-7 9-12 9-16a9 9 0 0 0-18 0c0 4 3 9 9 16z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="13" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  car: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 21v-5l3-7h18l3 7v5zM4 21v3h5v-3M23 21v3h5v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="17" r="1.4" fill="currentColor"/><circle cx="22" cy="17" r="1.4" fill="currentColor"/></svg>`,
};

const header = (c) => `<header class="al-head pk-bleed"><div class="al-bar"><a class="al-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mark}<span class="al-logo-t"><b>Albergo</b><small>Maison Solana</small></span></a>
  <div class="al-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <a class="al-btn al-btn--sm al-reserve" href="/reserver">Réserver</a>
  <details class="al-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="al-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="al-btn" href="/reserver">Réserver</a></div></details></div></header>`;

const footer = (c) => `<footer class="al-foot pk-bleed al-tex"><div class="al-foot-top al-wrap"><div class="al-foot-brand">${mark}<p class="al-foot-name">Albergo</p><p class="al-foot-lead">Une maison de quatorze chambres, un patio, une table et du temps.</p><address>12 rue des Fontaines<br>Saint-Aurèle, Provence<br><a href="mailto:bonjour@albergo-solana.example">bonjour@albergo-solana.example</a></address></div>
  <div><h3>La maison</h3>${nav(c.menu.slice(1, 6), "al-fl")}</div><div><h3>Séjourner</h3><a class="al-fl" href="/reserver">Réserver un séjour</a><a class="al-fl" href="/chambre">Détail d'une chambre</a><a class="al-fl" href="/contact">Nous écrire</a><a class="al-fl" href="/recherche">Rechercher</a></div>
  <div><h3>Réception</h3><p>Tous les jours, 7 h – 23 h</p><p>Arrivée dès 15 h<br>Départ avant 11 h</p></div></div>
  <div class="al-zel" aria-hidden="true"></div><p class="al-legal al-wrap">© Albergo — Maison Solana. Site de démonstration : établissement, tarifs, menus et avis fictifs ; aucune réservation n'est enregistrée.</p></footer>`;

const pagehead = (kicker, title, sub, scene) => sec(`<section class="al-ph pk-bleed al-tex"><div class="al-wrap al-ph-in"><div class="al-ph-copy"><p class="al-kicker" data-reveal>${esc(kicker)}</p><div class="al-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="al-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${scene ? `<div class="al-ph-art" data-reveal><div class="al-arch al-arch--s">${scene}</div></div>` : ""}</div></section>`);

const sh = (kicker, title, sub = "", cls = "") => `<div class="al-sh ${cls}"><p class="al-kicker" data-reveal>${esc(kicker)}</p><h2 class="al-h2" data-reveal>${title}</h2>${sub ? `<p class="al-sub" data-reveal>${sub}</p>` : ""}</div>`;

// Sélecteur de chambre et de dates (composant signature) : le squelette est statique, motion.js construit le calendrier, les voyageurs, les options et le récapitulatif.
const booking = (room, title = "Choisissez votre chambre et vos dates") => sec(`<section class="al-book pk-bleed al-tex" data-book data-room="${room}"><div class="al-wrap">
  <div class="al-bhead"><p class="al-kicker">Composer un séjour</p><h2 class="al-h2">${title}</h2><p class="al-sub">Calcul de démonstration : nuits, majorations et total sont indicatifs. Aucune réservation n'est enregistrée ; la demande part vers le formulaire de contact.</p></div>
  <p class="al-nojs">Ce sélecteur demande JavaScript. Sans lui, <a href="/contact">écrivez-nous</a> vos dates et la chambre souhaitée.</p>
  <div class="al-bgrid"><div class="al-bmain">
    <div class="al-bstep"><h3 class="al-step"><span>1</span>Votre chambre</h3><div class="al-rooms" role="radiogroup" aria-label="Chambre">${ROOMS.map((r) => `<a class="al-rm" href="#${r.id}" data-room="${r.id}" data-name="${r.name}" data-price="${r.price}" data-max="${r.max}"><span class="al-rm-art" aria-hidden="true">${thumb(r.view)}</span><span class="al-rm-t"><b>${r.name}</b><i>${r.size} m² · ${r.max} pers. max</i></span><span class="al-rm-p">dès ${eur(r.price)}</span></a>`).join("")}</div></div>
    <div class="al-bstep"><h3 class="al-step"><span>2</span>Vos dates</h3><div class="al-cal" data-cal></div><p class="al-hint" data-hint role="status"></p></div>
    <div class="al-bstep"><h3 class="al-step"><span>3</span>Voyageurs et attentions</h3><div class="al-guests" data-guests></div><div class="al-opts" data-opts></div></div></div>
    <aside class="al-recap" data-recap aria-label="Récapitulatif du séjour"><h3 class="al-recap-t">Votre séjour</h3><div class="al-recap-b" data-recap-body aria-live="polite"><p>Choisissez une chambre puis vos dates d'arrivée et de départ.</p></div>
      <a class="al-btn al-btn--block al-cta" href="/contact" data-send aria-disabled="true">Envoyer ma demande</a><p class="al-fine">Estimation de démonstration, sans engagement. La maison vous répondra par le formulaire de contact.</p></aside></div></div></section>`);

const roomCard = (r) => `<article class="al-card" data-item data-cats="${r.cat}" data-reveal><a class="al-card-art" href="/chambre#${r.id}" aria-hidden="true">${roomScene(r, "")}<span class="al-badge">${r.tag}</span></a>
  <div class="al-card-b"><p class="al-card-m">${r.size} m² · ${r.max} personnes</p><h3><a href="/chambre#${r.id}">${r.name}</a></h3><p>${r.line}</p><div class="al-card-f"><span class="al-price"><small>dès</small> ${eur(r.price)}<small>/nuit</small></span><a class="al-more" href="/chambre#${r.id}">Découvrir ${arrow}</a></div></div></article>`;

const heroSlides = [
  { s: () => roomScene(ROOMS[1], "La chambre Olivier, au matin"), cap: "Chambre Olivier, au matin" },
  { s: () => patio("Le patio et sa fontaine en zellige"), cap: "Le patio et sa fontaine" },
  { s: () => breakfast("Le petit-déjeuner sous les volets"), cap: "Le petit-déjeuner de la maison" },
];

const home = (c) => [
  sec(header(c)),
  sec(`<section class="al-hero pk-bleed al-tex"><div class="al-hero-in">
    <div class="al-hero-copy"><p class="al-kicker" data-reveal>Maison d'hôtes · 14 chambres · Saint-Aurèle</p>
      <div class="al-hero-t" role="heading" aria-level="1" data-reveal>Une maison de lin et de terre cuite, où <em>le temps ralentit.</em></div>
      <p class="al-lead" data-reveal>Un ancien relais de poste au cœur des oliviers, transformé en hôtel boutique : chambres baignées de lumière, patio en zellige, table du marché et hammam à la bougie.</p>
      <div class="al-actions" data-reveal><a class="al-btn" href="/reserver">Réserver un séjour ${arrow}</a><a class="al-btn al-btn--ghost" href="/chambres">Voir les chambres</a></div>
      <ul class="al-facts" data-reveal><li><b>14</b><span>chambres</span></li><li><b>1887</b><span>la maison</span></li><li><b>3</b><span>patios</span></li></ul></div>
    <div class="al-show" data-show aria-roledescription="diaporama" aria-label="Photographies de la maison"><div class="al-arch">${heroSlides.map((x, i) => `<figure class="al-slide${i ? "" : " is-on"}" data-cap="${esc(x.cap)}"${i ? ' aria-hidden="true"' : ""}>${x.s()}</figure>`).join("")}<div class="al-sun" aria-hidden="true"></div></div>
      <div class="al-showbar"><p class="al-cap" data-capout>${heroSlides[0].cap}</p><div class="al-ctrl"><a class="al-prev" href="#precedente" data-step="-1" aria-label="Image précédente">${arrow}</a><span class="al-dots">${heroSlides.map((x, i) => `<a href="#image-${i + 1}" data-go="${i}" aria-label="Image ${i + 1} sur 3 : ${esc(x.cap)}"><i></i></a>`).join("")}</span><a class="al-next" href="#suivante" data-step="1" aria-label="Image suivante">${arrow}</a><a class="al-pause" href="#pause" data-pause aria-label="Mettre le diaporama en pause">Pause</a></div></div></div></div></section>`),
  booking("olivier", "Votre séjour, en quelques gestes"),
  sec(`<section class="al-house pk-bleed"><div class="al-wrap al-house-in"><div>${sh("La maison", "Un lieu que l'on habite,<br>pas que l'on traverse.", "")}<p class="al-p" data-reveal>Murs à la chaux, sols de terre cuite, lin lavé et laiton patiné : chaque pièce a été pensée avec des artisans de la vallée. Pas de comptoir de réception, mais un salon où l'on vous offre un verre de bienvenue et la clé, en main propre.</p><ul class="al-checks" data-reveal><li>Petit-déjeuner de saison servi jusqu'à 11 h</li><li>Hammam et soins sur rendez-vous</li><li>Vélos et paniers pique-nique à disposition</li></ul><a class="al-more" href="/spa" data-reveal>Le spa et les expériences ${arrow}</a></div>
    <div class="al-stack" data-reveal><div class="al-frame al-frame--a">${spa("Le hammam à la bougie")}</div><div class="al-frame al-frame--b">${terrace("La terrasse au couchant")}</div><div class="al-tz" aria-hidden="true"></div></div></div></section>`),
  sec(`<section class="al-rooms-sec pk-bleed al-tex"><div class="al-wrap">${sh("Les chambres", "Quatre façons<br>de se poser.")}<div class="al-cards">${ROOMS.map(roomCard).join("")}</div><p class="al-center" data-reveal><a class="al-btn al-btn--ghost" href="/chambres">Comparer toutes les chambres</a></p></div></section>`),
  sec(`<section class="al-day pk-bleed"><div class="al-wrap">${sh("Une journée à Solana", "Du matin<br>au dernier verre.")}<ol class="al-days">
    <li class="al-dayc" data-reveal><div class="al-dayc-art">${breakfast("")}</div><p class="al-time">8 h – 11 h</p><h3>Le petit-déjeuner</h3><p>Pain du four du village, confitures maison, œufs du voisin, jus pressés.</p></li>
    <li class="al-dayc" data-reveal><div class="al-dayc-art">${patio("")}</div><p class="al-time">12 h – 17 h</p><h3>Le patio</h3><p>Sieste à l'ombre, lecture, bassin et fontaine. Les vélos attendent.</p></li>
    <li class="al-dayc" data-reveal><div class="al-dayc-art">${dinner("")}</div><p class="al-time">19 h – 22 h</p><h3>La table du soir</h3><p>Cuisine du marché, vins du Luberon, cocktails à l'olive.</p></li></ol></div></section>`),
  sec(`<section class="al-table pk-bleed al-tex"><div class="al-wrap al-table-in"><div class="al-table-art" data-reveal><div class="al-arch al-arch--s">${dinner("La salle du soir")}</div></div><div>${sh("Restaurant & bar", "Une cuisine qui suit<br>les saisons.", "")}<p class="al-p" data-reveal>Le chef compose chaque matin selon le marché : tomates anciennes, agneau des Alpilles, huile d'olive pressée à deux kilomètres. Le bar, lui, ouvre à l'heure où le patio s'allume.</p><dl class="al-menu-mini" data-reveal><div><dt>Tian de légumes, chèvre frais</dt><dd>16 €</dd></div><div><dt>Agneau confit, polenta, thym</dt><dd>29 €</dd></div><div><dt>Figues rôties, glace au miel</dt><dd>12 €</dd></div></dl><a class="al-btn al-btn--light" href="/restaurant" data-reveal>Voir la carte ${arrow}</a></div></div></section>`),
  sec(`<section class="al-care pk-bleed"><div class="al-wrap">${sh("Nos attentions", "Les petits riens<br>qui font un séjour.")}<ul class="al-care-g">
    <li data-reveal>${ico.sun}<h3>Lumière naturelle</h3><p>Chaque chambre regarde le jardin, le patio ou les collines.</p></li><li data-reveal>${ico.leaf}<h3>Matières vraies</h3><p>Lin, chaux, laiton, terre cuite : rien de factice.</p></li><li data-reveal>${ico.cup}<h3>Table locale</h3><p>Produits de producteurs situés à moins de vingt kilomètres.</p></li><li data-reveal>${ico.key}<h3>Accueil en main propre</h3><p>Une clé de laiton, un verre, et le plan des balades.</p></li></ul></div></section>`),
  sec(`<section class="al-gal pk-bleed"><div class="al-wrap">${sh("Galerie", "La maison en images.")}<div class="al-strip" data-reveal><a class="al-strip-i" href="/galerie" aria-hidden="true">${terrace("")}</a><a class="al-strip-i" href="/galerie" aria-hidden="true">${spa("")}</a><a class="al-strip-i" href="/galerie" aria-hidden="true">${roomScene(ROOMS[2], "")}</a><a class="al-strip-i" href="/galerie" aria-hidden="true">${breakfast("")}</a></div><p class="al-center" data-reveal><a class="al-more" href="/galerie">Parcourir la galerie ${arrow}</a></p></div></section>`),
  sec(`<section class="al-final pk-bleed al-tex"><div class="al-wrap al-final-in"><div>${star}<h2 class="al-h2" data-reveal>Venez poser vos valises.</h2><p class="al-sub" data-reveal>Choisissez vos dates, nous faisons le reste. Une question avant de venir ? La maison vous répond.</p></div><div class="al-actions" data-reveal><a class="al-btn" href="/reserver">Réserver un séjour ${arrow}</a><a class="al-btn al-btn--ghost-l" href="/contact">Nous écrire</a></div></div></section>`),
  sec(footer(c)),
];

const chambres = (c) => [
  sec(header(c)), pagehead("Les chambres", "Quatre chambres,<br><em>une même douceur.</em>", "Du lit king sous la fenêtre en arche à la terrasse privée sous le toit : comparez, puis composez votre séjour.", roomScene(ROOMS[0], "La chambre Lin")),
  sec(`<section class="al-list pk-bleed"><div class="al-wrap"><div class="al-filter" data-tabs="filtre" role="group" aria-label="Filtrer les chambres"><a href="#toutes" class="is-on" data-tab="toutes" aria-pressed="true">Toutes</a><a href="#duo" data-tab="duo" aria-pressed="false">Pour deux</a><a href="#famille" data-tab="famille" aria-pressed="false">Familles et amis</a></div><div class="al-cards al-cards--2" data-filter="filtre">${ROOMS.map(roomCard).join("")}</div></div></section>`),
  sec(`<section class="al-cmp pk-bleed al-tex"><div class="al-wrap">${sh("En un coup d'œil", "Comparer les chambres.")}<table class="al-tbl" data-reveal><caption class="al-sr">Comparatif des chambres</caption><thead><tr><th scope="col">Chambre</th><th scope="col">Surface</th><th scope="col">Voyageurs</th><th scope="col">Atout</th><th scope="col">Dès (par nuit)</th></tr></thead><tbody>${ROOMS.map((r) => `<tr><th scope="row" data-l="Chambre"><a href="/chambre#${r.id}">${r.name}</a></th><td data-l="Surface">${r.size} m²</td><td data-l="Voyageurs">${r.max}</td><td data-l="Atout">${r.tag}</td><td data-l="Dès"><b>${eur(r.price)}</b></td></tr>`).join("")}</tbody></table><p class="al-fine al-center">Tarifs de démonstration, taxe de séjour en sus. Majoration week-end et été appliquée dans le sélecteur.</p></div></section>`),
  sec(`<section class="al-incl pk-bleed"><div class="al-wrap">${sh("Dans toutes les chambres", "Toujours inclus.")}<ul class="al-care-g al-care-g--3"><li data-reveal>${ico.cup}<h3>Café et thé</h3><p>Une sélection de la maison, à toute heure.</p></li><li data-reveal>${ico.leaf}<h3>Produits de bain</h3><p>Savons à l'huile d'olive, flacons rechargeables.</p></li><li data-reveal>${ico.sun}<h3>Literie en lin</h3><p>Draps lavés à la pierre, couette en coton bio.</p></li></ul></div></section>`),
  sec(`<section class="al-final al-final--s pk-bleed al-tex"><div class="al-wrap al-final-in"><div><h2 class="al-h2">Choisir ses dates ?</h2></div><div class="al-actions"><a class="al-btn" href="/reserver">Ouvrir le sélecteur ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

const chambre = (c) => {
  const panel = (r, i) => `<article class="al-rd" data-panel-group="chambre" data-panel="${r.id}"${i ? " data-off=\"1\"" : ""}><div class="al-wrap al-rd-in"><div class="al-rd-art"><div class="al-arch al-arch--w">${roomScene(r)}</div><div class="al-rd-thumbs" aria-hidden="true">${["olive", "sea", "patio"].map((v) => `<span>${thumb(v)}</span>`).join("")}</div></div>
    <div class="al-rd-copy"><p class="al-kicker">${r.tag}</p><h2 class="al-h2">${r.name}</h2><p class="al-p">${r.line}</p><dl class="al-spec"><div><dt>Surface</dt><dd>${r.size} m²</dd></div><div><dt>Voyageurs</dt><dd>${r.max} max.</dd></div><div><dt>Dès</dt><dd>${eur(r.price)} / nuit</dd></div></dl>
    <h3 class="al-h3">Équipements</h3><ul class="al-checks">${r.feats.map((f) => `<li>${f}</li>`).join("")}</ul><p class="al-fine">Tarif de démonstration, petit-déjeuner en option.</p></div></div></article>`;
  return [
    sec(header(c)), pagehead("Détail d'une chambre", "Chambres<br><em>et suites.</em>", "Choisissez une chambre pour la découvrir : photographies, équipements, surface.", null),
    sec(`<section class="al-rtabs pk-bleed"><div class="al-wrap"><div class="al-filter" data-tabs="chambre" role="group" aria-label="Choisir une chambre">${ROOMS.map((r, i) => `<a href="#${r.id}" ${i ? "" : 'class="is-on" '}data-tab="${r.id}" aria-pressed="${i ? "false" : "true"}">${r.name}</a>`).join("")}</div></div></section>`),
    sec(`<section class="al-rdetail pk-bleed al-tex">${ROOMS.slice(0, 2).map((r, i) => panel(r, i)).join("")}</section>`),
    sec(`<section class="al-rdetail al-rdetail--b pk-bleed al-tex">${ROOMS.slice(2).map((r) => panel(r, 1)).join("")}</section>`),
    booking("lin", "Réserver cette chambre"),
    sec(`<section class="al-faq pk-bleed"><div class="al-wrap al-faq-in">${sh("Bon à savoir", "Avant d'arriver.")}<div><details data-reveal><summary>Peut-on ajouter un lit bébé ?</summary><p>Oui, sans supplément dans toutes les chambres ; précisez-le dans votre demande.</p></details><details data-reveal><summary>Les animaux sont-ils acceptés ?</summary><p>Les petits chiens sont les bienvenus dans la Suite Patio, sur demande.</p></details><details data-reveal><summary>Peut-on arriver tard ?</summary><p>La réception est ouverte jusqu'à 23 h ; au-delà, une boîte à clés est prévue.</p></details></div></div></section>`),
    sec(footer(c)),
  ];
};

const reserver = (c) => [
  sec(header(c)), pagehead("Réserver", "Composer<br><em>votre séjour.</em>", "Chambre, dates, voyageurs : le récapitulatif se met à jour en direct. Vous envoyez ensuite votre demande à la maison.", null),
  booking("olivier", "Chambre, dates, voyageurs"),
  sec(`<section class="al-faq pk-bleed al-tex"><div class="al-wrap al-faq-in">${sh("Conditions", "Comment ça marche ?")}<div><details open data-reveal><summary>Est-ce une réservation ferme ?</summary><p>Non. Ce sélecteur est une démonstration : il calcule une estimation et prépare un message. Aucune chambre n'est bloquée et aucun paiement n'est demandé.</p></details><details data-reveal><summary>Comment les nuits sont-elles calculées ?</summary><p>Entre la date d'arrivée et la date de départ. Une majoration de 15 % s'applique les nuits de vendredi et samedi, et de 25 % en juillet et août (valeurs de démonstration).</p></details><details data-reveal><summary>Quelle est la durée de séjour possible ?</summary><p>De 1 à 14 nuits dans ce sélecteur.</p></details><details data-reveal><summary>Et la taxe de séjour ?</summary><p>2,30 € par adulte et par nuit, ajoutée au récapitulatif à titre indicatif.</p></details></div></div></section>`),
  sec(footer(c)),
];

const dish = ([n, d, p]) => `<li><div><b>${n}</b><span>${d}</span></div><i>${p}</i></li>`;
const menus = {
  matin: [["Pain, beurre baratté, confitures", "Pain du four du village, trois confitures maison", "Inclus"], ["Œufs de la ferme voisine", "Brouillés, coque ou en cocotte aux herbes", "9 €"], ["Fromage blanc, miel et figues", "Miel de lavande, noix toastées", "8 €"], ["Jus d'orange pressé", "À la minute", "5 €"]],
  midi: [["Salade de tomates anciennes", "Burrata, basilic, huile d'olive nouvelle", "15 €"], ["Pissaladière du jour", "Oignons confits, anchois, olives", "14 €"], ["Pan bagnat de la maison", "Thon, œuf, légumes croquants", "13 €"], ["Panier pique-nique", "À emporter, sur demande la veille", "24 €"]],
  soir: [["Tian de légumes, chèvre frais", "Courgette, aubergine, tomate, thym", "16 €"], ["Rouget, fenouil confit", "Beurre blanc au citron", "28 €"], ["Agneau confit, polenta, thym", "Jus corsé, ail rose", "29 €"], ["Figues rôties, glace au miel", "Amandes caramélisées", "12 €"]],
};
const restaurant = (c) => [
  sec(header(c)), pagehead("Restaurant & bar", "La table<br><em>du marché.</em>", "Une cuisine de saison, des vins du Luberon et un bar qui ouvre quand le patio s'allume.", dinner("La salle du soir")),
  sec(`<section class="al-menu pk-bleed al-tex"><div class="al-wrap">${sh("La carte", "Trois services, une même exigence.")}<div class="al-filter al-filter--c" data-tabs="carte" role="group" aria-label="Choisir un service"><a href="#matin" class="is-on" data-tab="matin" aria-pressed="true">Petit-déjeuner</a><a href="#midi" data-tab="midi" aria-pressed="false">Déjeuner</a><a href="#soir" data-tab="soir" aria-pressed="false">Dîner</a></div>
    ${Object.entries(menus).map(([k, v], i) => `<div class="al-menu-p" data-panel-group="carte" data-panel="${k}"${i ? " data-off=\"1\"" : ""}><ul class="al-dishes">${v.map(dish).join("")}</ul></div>`).join("")}<p class="al-fine al-center">Carte de démonstration, prix indicatifs. Menu enfant et plats végétariens à chaque service.</p></div></section>`),
  sec(`<section class="al-bar2 pk-bleed"><div class="al-wrap al-split"><div>${sh("Le bar", "Cocktails à l'olive<br>et vins de la vallée.")}<p class="al-p" data-reveal>Le bar du patio ouvre de 17 h à minuit. Sélection courte, produits locaux, quelques classiques revisités.</p></div>
    <ul class="al-dishes al-dishes--l" data-reveal>${[["Spritz à la verveine", "Vin blanc, tonic maison, verveine", "11 €"], ["Negroni de Solana", "Gin, vermouth, bitter, orange confite", "13 €"], ["Olive Martini", "Gin, vermouth sec, saumure d'olive", "13 €"], ["Verre de rosé du Luberon", "Domaine voisin, 12 cl", "6 €"]].map(dish).join("")}</ul></div></section>`),
  sec(`<section class="al-hours pk-bleed al-tex"><div class="al-wrap">${sh("Horaires", "Quand venir ?")}<table class="al-tbl al-tbl--s" data-reveal><caption class="al-sr">Horaires du restaurant et du bar</caption><thead><tr><th scope="col">Service</th><th scope="col">Horaires</th><th scope="col">Jours</th></tr></thead><tbody><tr><th scope="row" data-l="Service">Petit-déjeuner</th><td data-l="Horaires">8 h – 11 h</td><td data-l="Jours">Tous les jours</td></tr><tr><th scope="row" data-l="Service">Déjeuner</th><td data-l="Horaires">12 h 15 – 14 h 30</td><td data-l="Jours">Du mercredi au dimanche</td></tr><tr><th scope="row" data-l="Service">Dîner</th><td data-l="Horaires">19 h – 22 h</td><td data-l="Jours">Du mardi au dimanche</td></tr><tr><th scope="row" data-l="Service">Bar du patio</th><td data-l="Horaires">17 h – minuit</td><td data-l="Jours">Tous les jours</td></tr></tbody></table><p class="al-center" data-reveal><a class="al-btn" href="/contact">Demander une table ${arrow}</a></p></div></section>`),
  sec(footer(c)),
];

const soins = [["Rituel du Lin", "Gommage au sel, enveloppement, huile tiède", "60 min", "95 €"], ["Hammam à la bougie", "Bain de vapeur privatisé pour deux, thé à la menthe", "45 min", "70 €"], ["Massage Oliveraie", "Huile d'olive tiède et herbes de Provence", "50 min", "85 €"], ["Soin visage Lavande", "Nettoyage, masque à l'argile, massage du visage", "40 min", "75 €"]];
const experiences = [["Balade à vélo dans les oliveraies", "Demi-journée avec pique-nique, vélos électriques", "dès 35 €"], ["Atelier zellige", "Dessiner et émailler son propre carreau", "dès 55 €"], ["Dégustation d'huile d'olive", "Visite du moulin voisin et dégustation commentée", "dès 20 €"], ["Yoga au patio", "Séance douce à l'aube, tapis fournis", "dès 18 €"]];
const spaPage = (c) => [
  sec(header(c)), pagehead("Spa & expériences", "Prendre<br><em>son temps.</em>", "Un hammam à la bougie, des soins à l'huile d'olive, et des journées à vivre dehors.", spa("Le hammam à la bougie")),
  sec(`<section class="al-soins pk-bleed al-tex"><div class="al-wrap">${sh("Les soins", "Quatre rituels pour déposer la journée.")}<ol class="al-rituals">${soins.map(([n, d, t, p], i) => `<li class="al-rit" data-reveal><span class="al-rit-n" aria-hidden="true">0${i + 1}</span><div><h3>${n}</h3><p>${d}</p></div><span class="al-rit-t">${t}</span><b class="al-rit-p">${p}</b></li>`).join("")}</ol><p class="al-fine al-center">Sur rendez-vous, prix de démonstration. Réservation du spa via le formulaire de contact.</p></div></section>`),
  sec(`<section class="al-parcours pk-bleed"><div class="al-wrap al-split al-split--r"><div class="al-frame-big" data-reveal>${spa("Le hammam")}</div><div>${sh("Le parcours", "Chaleur, eau, repos.")}<ol class="al-steps" data-reveal><li><b>Vapeur</b><span>Quinze minutes de hammam pour ouvrir les pores.</span></li><li><b>Bassin</b><span>Un bain frais dans le bassin de pierre.</span></li><li><b>Repos</b><span>Tisane, fruits secs et lumière douce, drapé dans le lin.</span></li></ol></div></div></section>`),
  sec(`<section class="al-exp pk-bleed al-tex"><div class="al-wrap">${sh("Expériences", "Dehors, à la mode d'ici.")}<ul class="al-expg">${experiences.map(([n, d, p], i) => `<li class="al-expc" data-reveal><span class="al-expn" aria-hidden="true">${["I", "II", "III", "IV"][i]}</span><h3>${n}</h3><p>${d}</p><b>${p}</b></li>`).join("")}</ul><p class="al-center" data-reveal><a class="al-btn" href="/contact">Demander une expérience ${arrow}</a></p></div></section>`),
  sec(footer(c)),
];

const GAL = [
  ["chambres", "La chambre Olivier", () => roomScene(ROOMS[1], "La chambre Olivier")], ["patio", "Le patio", () => patio("Le patio et sa fontaine")], ["tables", "Le petit-déjeuner", () => breakfast("Le petit-déjeuner")],
  ["bienetre", "Le hammam", () => spa("Le hammam à la bougie")], ["tables", "La salle du soir", () => dinner("La salle du soir")], ["patio", "La terrasse au couchant", () => terrace("La terrasse au couchant")],
  ["chambres", "La Suite Patio", () => roomScene(ROOMS[2], "La Suite Patio")], ["chambres", "La chambre Lin", () => roomScene(ROOMS[0], "La chambre Lin")], ["chambres", "La Suite Belvédère", () => roomScene(ROOMS[3], "La Suite Belvédère")],
];
const galerie = (c) => {
  const fig = ([cat, t, f], i) => `<figure class="al-g al-g${i % 4}" data-item data-cats="${cat}" data-reveal><a href="#voir" data-zoom aria-label="Agrandir : ${esc(t)}">${f()}</a><figcaption>${t}</figcaption></figure>`;
  return [
    sec(header(c)), pagehead("Galerie", "La maison<br><em>en images.</em>", "Des scènes dessinées pour la démonstration : lumière du matin, patio, tables dressées.", null),
    sec(`<section class="al-galp pk-bleed"><div class="al-wrap"><div class="al-filter" data-tabs="gal" role="group" aria-label="Filtrer les images"><a href="#toutes" class="is-on" data-tab="toutes" aria-pressed="true">Tout</a><a href="#chambres" data-tab="chambres" aria-pressed="false">Chambres</a><a href="#patio" data-tab="patio" aria-pressed="false">Patio et terrasse</a><a href="#tables" data-tab="tables" aria-pressed="false">Tables</a><a href="#bienetre" data-tab="bienetre" aria-pressed="false">Bien-être</a></div><div class="al-mason" data-filter="gal">${GAL.slice(0, 3).map((g, i) => fig(g, i)).join("")}</div></div></section>`),
    sec(`<section class="al-galp pk-bleed"><div class="al-wrap"><div class="al-mason" data-filter="gal">${GAL.slice(3, 6).map((g, i) => fig(g, i + 3)).join("")}</div></div></section>`),
    sec(`<section class="al-galp pk-bleed"><div class="al-wrap"><div class="al-mason" data-filter="gal">${GAL.slice(6).map((g, i) => fig(g, i + 6)).join("")}</div><p class="al-fine al-center">Illustrations de démonstration. Cliquez sur une image pour l'agrandir ; Échap pour fermer, flèches pour naviguer.</p></div></section>`),
    sec(footer(c)),
  ];
};

const acces = (c) => [
  sec(header(c)), pagehead("Accès & infos", "Venir<br><em>jusqu'à nous.</em>", "À quarante minutes de la gare TGV, au bout d'un chemin de cyprès.", terrace("La terrasse au couchant")),
  { type: "layout", children: [{ type: "map", props: { address: "12 rue des Fontaines, Saint-Aurèle", zoom: 14, height: 360 } }] },
  sec(`<section class="al-acc pk-bleed al-tex"><div class="al-wrap">${sh("Y arriver", "Trois façons de venir.")}<ul class="al-care-g al-care-g--3"><li data-reveal>${ico.car}<h3>En voiture</h3><p>Sortie Saint-Aurèle, puis 6 km. Parking gratuit dans la cour, bornes de recharge sur demande.</p></li><li data-reveal>${ico.pin}<h3>En train</h3><p>Gare TGV à 40 minutes. Navette de la maison disponible sur réservation.</p></li><li data-reveal>${ico.sun}<h3>En avion</h3><p>Aéroport à 55 minutes de route ; transferts organisés sur demande.</p></li></ul></div></section>`),
  sec(`<section class="al-infos pk-bleed"><div class="al-wrap al-split"><div>${sh("Infos pratiques", "Tout ce qu'il faut savoir.")}<dl class="al-dl" data-reveal><div><dt>Arrivée</dt><dd>À partir de 15 h</dd></div><div><dt>Départ</dt><dd>Avant 11 h</dd></div><div><dt>Réception</dt><dd>7 h – 23 h, tous les jours</dd></div><div><dt>Adresse</dt><dd>12 rue des Fontaines, Saint-Aurèle</dd></div><div><dt>Fermeture annuelle</dt><dd>Du 5 janvier au 6 février</dd></div></dl></div>
    <div><details open data-reveal><summary>Animaux de compagnie</summary><p>Petits chiens acceptés dans la Suite Patio, sur demande.</p></details><details data-reveal><summary>Accessibilité</summary><p>Une chambre de plain-pied avec douche accessible ; patio et restaurant sans marche.</p></details><details data-reveal><summary>Arrivée tardive</summary><p>Boîte à clés disponible après 23 h, à prévoir avec la réception.</p></details><details data-reveal><summary>Stationnement</summary><p>Cour fermée de douze places, gratuite pour les clients.</p></details></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [sec(header(c)), pagehead("Contact", "Écrivez-<em>nous.</em>", "Une demande de séjour, une table, un soin ou une simple question : la maison répond sous un jour ouvré.", null),
  { type: "form", heading: "Votre message", intro: "Indiquez vos dates, la chambre souhaitée et le nombre de voyageurs. Si vous venez du sélecteur de séjour, le récapitulatif est prérempli." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une envie ?", "Une chambre, un plat, un soin.", null), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="al-404 pk-bleed al-tex"><div class="al-wrap al-404-in"><div class="al-arch al-arch--s al-404-art">${patio("Le patio")}</div><div><p class="al-kicker">Page introuvable</p><div class="al-h1" role="heading" aria-level="1">Vous vous êtes<br><em>égaré(e).</em></div><p class="al-sub">Cette page n'existe pas ou a changé d'adresse. Le patio, lui, est toujours là.</p><div class="al-actions"><a class="al-btn" href="/">Retour à l'accueil</a><a class="al-btn al-btn--ghost" href="/chambres">Voir les chambres</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "albergo", name: "Albergo", version: "2.0.0", category: "voyage", tags: ["luxe", "chaleureux", "classique"], siteType: "Hôtel boutique et maison d'hôtes", featured: true,
  concept: "Un hôtel boutique de lin et de terre cuite : photographies lentes en diaporama, sélecteur de chambre et de dates avec calendrier et récapitulatif, patio en zellige.",
  description: "Hôtel boutique fictif : lin, terre cuite et laiton, grain de plâtre, zellige dessiné en CSS, diaporama lent de scènes SVG, cartes de chambres, restaurant, spa, galerie et sélecteur de séjour avec calendrier accessible.",
  brand: "Albergo — Maison Solana", modules: ["formulaires", "recherche"],
  dna: { header: "barre-classique-lin-et-bouton-reserver", hero: "split-asymetrique-arche-et-diaporama-lent", grid: "cartes-de-chambres-a-photographie", motion: "diaporama-lent-fondu-et-derive", shapes: "arches-zellige-terrazzo-et-filets-laiton", rhythm: "alterne-chaleureux-par-textures", signature: "selecteur-de-chambre-calendrier-et-recapitulatif-de-sejour" },
  tokens: {
    colors: { primary: "#b1502b", secondary: "#2e2118", accent: "#7d5f1f", background: "#f4ede1", surface: "#fbf6ec", text: "#2b2018", muted: "#6b5b4c", success: "#3f6b3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.playfair-display", body: "font.lato", button: "font.lato", link: "font.lato" },
    radius: { sm: 4, md: 8, lg: 18, button: 999, field: 6, card: 14 }, shadow: { card: "0 18px 40px -22px rgba(58,42,32,.45)", button: "none" }, border: { width: 1, color: "#d9c8ad" },
    type: { h1: { size: 72, weight: 500, lineHeight: 1.04, transform: "none" }, h2: { size: 44, weight: 500, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Terre cuite", type: "color", default: "#b1502b" },
    { key: "brass", label: "Laiton", type: "color", default: "#7d5f1f" },
    { key: "grain", label: "Grain de plâtre", type: "choice", default: "on", choices: [["on", "Visible"], ["off", "Masqué"]] },
    { key: "zellige", label: "Frises de zellige", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "tempo", label: "Tempo du diaporama", type: "choice", default: "slow", choices: [["slow", "Lent (7 s)"], ["slower", "Très lent (11 s)"]] },
  ],
  menu: [["Accueil", "/"], ["Chambres", "/chambres"], ["Restaurant", "/restaurant"], ["Spa", "/spa"], ["Galerie", "/galerie"], ["Accès", "/acces"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "chambres", name: "Chambres", render: chambres }, { key: "chambre", name: "Détail d'une chambre", render: chambre }, { key: "reserver", name: "Réserver", render: reserver },
    { key: "restaurant", name: "Restaurant & bar", render: restaurant }, { key: "spa", name: "Spa & expériences", render: spaPage }, { key: "galerie", name: "Galerie", render: galerie }, { key: "acces", name: "Accès & infos", render: acces },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
