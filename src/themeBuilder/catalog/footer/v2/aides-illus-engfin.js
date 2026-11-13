// Aides + illustrations SVG des familles « Engins et matériel » et « Fintech et paiement » (passe illustration). Hors de familles/ : non chargé comme famille.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("./kit-v2");
const { sty, compact } = require("../../kit");

const DOUX = 360; // ms : transitions de survol / focus

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
// petit carré plein (statut, repère) : jamais rond
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// Lettre d'information : habille toutes les parties du widget pour un fond précis (angles droits)
function lettre(k, env, G, o) {
  const abo = G.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte, fondChamp: o.fondChamp, rembChamp: o.rembChamp })(k, env);
  const P = abo.parts;
  P.title.styles.desktop = { ...P.title.styles.desktop, color: o.couleurTitre || o.texte, lineHeight: 1.4 };
  P.intro.styles.desktop = { ...P.intro.styles.desktop, color: o.texte };
  P.consent.styles.desktop = { ...P.consent.styles.desktop, color: o.texte };
  P.missing.styles.desktop = { ...P.missing.styles.desktop, color: o.texte };
  P.button.styles.desktop = { ...P.button.styles.desktop, color: o.surBouton, backgroundColor: o.accent, borderRadius: "0px", transitionDuration: DOUX };
  P.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.survolTexte || o.fond, transform: { y: -2 } }, focus: GK.focus(o.focus || o.texte) };
  return abo;
}
const nomDuSite = (k, env, taille, couleur, extra = {}) => {
  const S = k.S, nom = Moteur.item(k, `title:${taille}`, env);
  nom.styles.desktop = { ...nom.styles.desktop, color: couleur, fontFamily: S.head, fontWeight: "700", letterSpacing: "-0.01em", lineHeight: 1.1, ...extra };
  nom.parts = { ...(nom.parts || {}), link: { ...((nom.parts || {}).link || {}), styles: { desktop: { color: couleur, textDecoration: "none" }, mobile: { display: "inline-block", minHeight: "44px", paddingTop: "10px", paddingBottom: "10px" } } } };
  return nom;
};
// Rangée de lien pleine largeur (filet bas, fond qui change et glisse au survol) — angles droits
const rangee = (k, label, url, o) => lien(k, label, url, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, police: o.police, bloc: true, h: o.h || "48px", padH: o.padH || "12px", survol: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, transform: { x: 6 } }, focus: o.focus, extra: { width: "100%", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.ligne } });
// Panneau / case à angles droits, qui passe à la ligne et se redimensionne tout seul
const panneau = (k, enfants, o = {}) => k.col(enfants, { flexGrow: o.poids ?? 1, flexBasis: o.base || "0px", minWidth: o.min || "320px", gap: o.gap || "16px", justifyContent: o.justifie, alignItems: o.aligne || "flex-start", paddingTop: o.padV?.[0] || "56px", paddingBottom: o.padV?.[0] || "56px", paddingLeft: o.padH?.[0] || "56px", paddingRight: o.padH?.[0] || "56px", backgroundColor: o.fond, minHeight: o.hauteur, borderRadius: "0px", borderStyle: "solid", borderWidth: "0px", ...(o.extra || {}) },
  { paddingTop: o.padV?.[1] || "44px", paddingBottom: o.padV?.[1] || "44px", paddingLeft: o.padH?.[1] || "32px", paddingRight: o.padH?.[1] || "32px" },
  { paddingTop: o.padV?.[2] || "36px", paddingBottom: o.padV?.[2] || "36px", paddingLeft: o.padH?.[2] || "20px", paddingRight: o.padH?.[2] || "20px", minWidth: "0px", flexBasis: "100%" });
const rangeeDe = (k, enfants, o = {}) => k.row(enfants, { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", backgroundColor: o.fond, ...(o.extra || {}) });
const PAGE_LARGEUR = { padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"] };
const mentionsBande = (k, env, G, fond, couleur, liens, o = {}) => G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur, liens })(k, env)], { fond, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions", ...o });

// ═══ ILLUSTRATIONS (SVG inline autorisé : svg g path circle rect line polyline polygon ellipse defs linearGradient radialGradient stop) ═══
const SV = (vb, corps) => `<svg viewBox="${vb}" width="100%" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg>`;
const R = (x, y, w, h, fill, ex = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${ex}/>`;
const P = (pts, fill, ex = "") => `<polygon points="${pts}" fill="${fill}" ${ex}/>`;
const C = (cx, cy, r, fill, ex = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${ex}/>`;
const L = (pts, stroke, w, ex = "") => `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${ex}/>`;
const HALOC = (cx, cy, r, couleur, opa = 0.6) => [1, 0.8, 0.62, 0.46, 0.32, 0.2].map((f) => C(cx, cy, Math.round(r * f), couleur, `opacity="${(opa / 5).toFixed(2)}"`)).join("");
const POLY = (n, cx, cy, r, rot = 0) => Array.from({ length: n }, (_, i) => { const a = rot + (i * 2 * Math.PI) / n; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
// svgDeux : variante large (bureau/tablette) + variante recadrée (mobile) ; le CSS plateforme impose height:auto, la hauteur suit donc le viewBox
function svgDeux(k, large, etroit, st = {}) {
  const base = compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st });
  if (!etroit) return [k.W("html", { html: large }, base)];
  return [{ ...k.W("html", { html: large }, base), hideOn: ["mobile"] }, { ...k.W("html", { html: etroit }, base), hideOn: ["desktop", "tablet"] }];
}
// engrenage : dents en polygone
const ROUE = (cx, cy, rExt, rInt, dents, fill) => { const pts = []; for (let i = 0; i < dents; i++) { const a = (i * 2 * Math.PI) / dents, w = Math.PI / dents / 2; for (const [r, d] of [[rInt, -w * 1.6], [rExt, -w * 0.8], [rExt, w * 0.8], [rInt, w * 1.6]]) pts.push(`${(cx + r * Math.cos(a + d)).toFixed(1)},${(cy + r * Math.sin(a + d)).toFixed(1)}`); } return P(pts.join(" "), fill); };

// 266 : emblème hexagonal jaune avec bras de pelle découpé (grand logo dessiné)
const illEmblemeChantier = (J = "#f2c230", N = "#0b0b0b") => SV("0 0 420 420",
  P("210,8 400,112 400,308 210,412 20,308 20,112", J) + P("210,48 362,132 362,288 210,372 58,288 58,132", N) +
  P("210,70 340,142 340,278 210,350 80,278 80,142", J) +
  R(118, 290, 190, 30, N) + C(142, 305, 11, J) + C(212, 305, 11, J) + C(282, 305, 11, J) + R(138, 250, 100, 40, N) + P("160,250 160,196 214,196 232,250", N) + P("172,208 172,238 204,238 212,208", J) +
  L("232,252 292,152 352,196", N, 22, 'stroke-linejoin="miter"') + L("352,196 326,262", N, 16) + P("296,262 350,252 336,304 286,296", N));
// 267 : chargeuse sur pneus, cobalt et encre
const illChargeuse = (CO = "#1f4fd8", E = "#14161a", B = "#ffffff") => SV("0 0 640 420",
  R(0, 372, 640, 8, E) + P("40,372 120,356 240,372", "#b9bbb3") + P("380,372 470,350 600,372", "#b9bbb3") +
  R(210, 250, 230, 80, CO) + P("250,250 270,170 380,170 400,250", CO) + P("284,184 284,242 340,242 366,184", B) + R(262, 160, 130, 12, E) +
  R(240, 330, 190, 26, E) + C(260, 316, 58, E) + C(260, 316, 30, "#8a8d95") + C(260, 316, 10, B) + C(410, 316, 58, E) + C(410, 316, 30, "#8a8d95") + C(410, 316, 10, B) +
  P("430,262 540,224 548,238 440,284", E) + L("436,268 530,236", E, 20) + P("530,226 606,226 596,314 534,326", B, `stroke="${E}" stroke-width="10"`) + P("540,246 590,246 584,300 544,308", CO));
// 268 : radar de flotte (cercles, repères carrés, itinéraires)
const illRadar = (CY = "#4cc9f0", B = "#d6e4f5") => SV("0 0 480 480",
  HALOC(240, 240, 236, CY, 0.5) +
  [220, 160, 100, 40].map((r) => C(240, 240, r, "none", `stroke="${CY}" stroke-width="2" opacity="0.7"`)).join("") +
  `<line x1="240" y1="4" x2="240" y2="476" stroke="${CY}" stroke-width="2" opacity="0.5"/><line x1="4" y1="240" x2="476" y2="240" stroke="${CY}" stroke-width="2" opacity="0.5"/>` +
  P("240,240 456,150 470,230", CY, 'opacity="0.22"') + L("240,240 456,150", CY, 3) +
  L("70,380 120,330 190,350 240,290 300,300 350,220", B, 4) + L("90,120 150,150 200,110 260,150", CY, 4) + L("350,400 390,340 430,360", B, 4) +
  [[70, 380], [350, 220], [90, 120], [260, 150], [430, 360], [190, 350]].map(([x, y], i) => R(x - 9, y - 9, 18, 18, i % 2 ? B : CY)).join(""));
// 269 : deux engrenages emboîtés, rognés
const illEngrenages = (N = "#15130f", F = "#ff6a00") => SV("70 0 450 520",
  ROUE(200, 330, 200, 168, 16, N) + C(200, 330, 130, F) + C(200, 330, 100, N) + C(200, 330, 34, F) +
  [0, 60, 120, 180, 240, 300].map((a) => `<line x1="200" y1="330" x2="${(200 + 130 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" y2="${(330 + 130 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" stroke="${F}" stroke-width="16"/>`).join("") +
  ROUE(448, 150, 110, 90, 10, N) + C(448, 150, 60, F) + C(448, 150, 22, N));
// 270 : mini-pelle orange sur dalle de roche, halo chaud (image d'en-tête)
const illPelleSurDalle = () => SV("0 0 600 580",
  R(0, 0, 600, 580, "#150a06") + HALOC(400, 300, 300, "#ff7a1a", 0.95) +
  P("90,500 230,250 520,100 570,340 470,540", "#2d1a12") + P("230,250 520,100 500,260 330,300", "#6a3a24") + P("330,300 500,260 470,540 290,500", "#3f2318") + P("90,500 230,250 330,300 290,500", "#241309") +
  L("230,250 330,300 290,500", "#c0693a", 2, 'opacity="0.7"') + L("520,100 500,260 470,540", "#c0693a", 2, 'opacity="0.7"') +
  `<g transform="translate(-232 -128) scale(1.5)"><ellipse cx="400" cy="330" rx="130" ry="12" fill="#000000" opacity="0.5"/>` +
  R(310, 296, 190, 30, "#1a0f0a", 'stroke="#ff7a1a" stroke-width="3"') + C(326, 311, 11, "#ff7a1a") + C(405, 311, 11, "#ff7a1a") + C(484, 311, 11, "#ff7a1a") +
  R(335, 252, 110, 44, "#ff7a1a") + P("350,252 354,206 404,206 424,252", "#ff7a1a") + P("362,214 364,244 408,244 396,214", "#ffd9b8") +
  L("440,262 500,196 544,236", "#ff7a1a", 14, 'stroke-linejoin="miter"') + L("544,236 524,292", "#ff7a1a", 12) + P("508,292 552,284 542,326 500,320", "#ff7a1a") + "</g>");
// 271 : bouteur (bulldozer) sable sur dalle verte, halo
const illBouteur = () => SV("0 0 600 580",
  R(0, 0, 600, 580, "#0c1d16") + HALOC(300, 330, 290, "#e8c547", 0.55) +
  P("40,520 160,300 440,260 580,480 520,550", "#1a3a2c") + P("160,300 440,260 420,330 220,360", "#2f6a4f") + P("220,360 420,330 580,480 360,520", "#14301f") +
  L("160,300 220,360 360,520", "#e8c547", 2, 'opacity="0.5"') +
  R(210, 370, 270, 40, "#0a120e", 'stroke="#e8c547" stroke-width="4"') + C(222, 390, 30, "#0a120e", 'stroke="#e8c547" stroke-width="4"') + C(468, 390, 30, "#0a120e", 'stroke="#e8c547" stroke-width="4"') +
  [260, 300, 340, 380, 420].map((x) => R(x, 372, 10, 36, "#e8c547")).join("") +
  P("260,370 270,300 440,300 440,370", "#e8c547") + P("300,300 310,240 400,240 410,300", "#e8c547") + P("316,252 318,292 396,292 392,252", "#10281f") +
  R(130, 320, 36, 90, "#ebe6d3") + P("166,330 220,340 220,380 166,396", "#ebe6d3") + R(470, 250, 6, 70, "#ebe6d3") + R(440, 244, 36, 8, "#ebe6d3"));
// 272 : pile de cartes en éventail, halo lilas (paiement)
const illCartes = () => SV("0 0 560 520",
  HALOC(280, 260, 250, "#b7a1ff", 0.9) + HALOC(380, 150, 120, "#ffffff", 0.4) +
  `<g transform="rotate(-14 280 260)">${R(110, 150, 340, 214, "#c9bbff")}${R(110, 190, 340, 40, "#2a0f9a")}</g>` +
  `<g transform="rotate(-4 280 260)">${R(110, 150, 340, 214, "#1a1233")}${R(150, 190, 56, 42, "#e9c46a")}${R(150, 300, 120, 12, "#8f7cf0")}${R(150, 326, 70, 10, "#8f7cf0")}</g>` +
  `<g transform="rotate(8 280 260)">${R(110, 150, 340, 214, "#ffffff")}${R(110, 150, 340, 14, "#4a1fe0")}${R(150, 200, 56, 42, "#bfb3ee")}${L("350,200 350,244", "#4a1fe0", 6)}${L("372,190 372,254", "#4a1fe0", 6)}${L("394,180 394,264", "#4a1fe0", 6)}${R(150, 300, 150, 12, "#1a1233")}${R(150, 326, 90, 10, "#8f7cf0")}</g>`);
// 273 : terminal de paiement noir + ticket dentelé, sur citron
const illTerminal = () => SV("0 0 480 560",
  P("120,20 360,20 360,48 120,48", "#0d0f08") + R(110, 40, 260, 80, "#f4ffb0", 'stroke="#0d0f08" stroke-width="8"') +
  P("140,70 340,70 340,520 140,520", "#0d0f08") + R(112, 130, 256, 400, "#0d0f08") + R(138, 150, 204, 96, "#d8ff3c") + R(158, 170, 110, 12, "#0d0f08") + R(158, 196, 70, 10, "#0d0f08") + R(158, 218, 150, 10, "#0d0f08") +
  [0, 1, 2].map((r) => [0, 1, 2].map((c) => R(138 + c * 72, 270 + r * 62, 60, 48, r === 2 && c === 2 ? "#d8ff3c" : "#33380f", 'stroke="#8a9a1a" stroke-width="2"')).join("")).join("") +
  P("160,0 160,-20 320,-20 320,0", "#0d0f08") + P("150,20 150,-8 330,-8 330,20", "#e7ff7a") +
  P("170,560 170,420 190,408 210,420 230,408 250,420 270,408 290,420 310,408 310,560", "#ffffff", 'stroke="#0d0f08" stroke-width="3" opacity="0"'));
// 274 : deux rives, fleuve sinueux, pont, soleil (paysage)
const illRives = () => SV("0 0 640 520",
  R(0, 0, 640, 520, "#0a2a24") + R(0, 0, 640, 130, "#14594a") + R(0, 130, 640, 130, "#0f4a3c") + R(0, 260, 640, 130, "#0c382f") + HALOC(440, 150, 190, "#7be3b5", 0.8) + C(440, 150, 54, "#e4f6ec") +
  P("0,300 120,230 220,290 340,210 460,280 640,200 640,520 0,520", "#0f4a3c") + P("0,360 150,310 280,360 400,300 640,350 640,520 0,520", "#0a3b30") +
  P("250,520 290,420 330,360 400,300 470,340 420,420 450,520", "#7be3b5") + P("300,520 330,430 370,370 410,340 430,400 390,470 390,520", "#e4f6ec", 'opacity="0.55"') +
  R(90, 392, 36, 28, "#e4f6ec") + P("84,392 108,370 132,392", "#e4f6ec") + R(530, 400, 40, 32, "#e4f6ec") + P("524,400 550,376 576,400", "#e4f6ec") + R(30, 430, 30, 26, "#7be3b5") + R(590, 450, 30, 26, "#7be3b5") +
  L("120,470 220,420 300,430", "#e4f6ec", 8) + [140, 180, 220, 260].map((x) => R(x, 424 + (x > 200 ? 0 : 4), 6, 52, "#e4f6ec")).join(""));
// 275 : blocs isométriques en escalier (croissance), marine
const bloc3d = (x, y, w, h, haut, gauche, droite) => P(`${x},${y} ${x + w},${y - w / 2} ${x + 2 * w},${y} ${x + w},${y + w / 2}`, haut) + P(`${x},${y} ${x + w},${y + w / 2} ${x + w},${y + w / 2 + h} ${x},${y + h}`, gauche) + P(`${x + 2 * w},${y} ${x + w},${y + w / 2} ${x + w},${y + w / 2 + h} ${x + 2 * w},${y + h}`, droite);
const illBlocs = () => SV("0 0 560 540",
  HALOC(320, 250, 270, "#ffd84d", 0.45) +
  bloc3d(40, 450, 80, 40, "#7f9cf0", "#2d4fae", "#1b3578") + bloc3d(200, 450, 80, 90, "#ffe27a", "#e0b42a", "#b88a10") + bloc3d(120, 300, 80, 150, "#ffffff", "#b9c7ec", "#8aa0d8") +
  bloc3d(280, 330, 80, 200, "#ff9b85", "#e0573d", "#b03a22") + bloc3d(200, 150, 80, 260, "#7f9cf0", "#2d4fae", "#1b3578") +
  L("40,500 160,420 240,380 330,250 430,150", "#ffffff", 4) + R(420, 140, 20, 20, "#ffd84d"));
// 276 : schéma d'un virement : deux bâtiments, chemin de carrés qui grossissent
const batiment = (x, couleur, fronton) => P(`${x},120 ${x + 90},70 ${x + 180},120`, fronton) + R(x, 124, 180, 16, couleur) + [0, 1, 2, 3].map((i) => R(x + 14 + i * 42, 146, 22, 64, couleur)).join("") + R(x - 10, 214, 200, 22, couleur);
const illVirement = () => SV("0 0 1000 260",
  R(0, 236, 1000, 6, "#1b1f3b") + batiment(60, "#1b1f3b", "#c4410f") + batiment(760, "#c4410f", "#1b1f3b") +
  Array.from({ length: 11 }, (_, i) => { const t = i / 10, x = 290 + t * 380, y = 150 - Math.sin(t * Math.PI) * 90, s = 8 + Math.sin(t * Math.PI) * 14; return R((x - s / 2).toFixed(1), (y - s / 2).toFixed(1), s.toFixed(1), s.toFixed(1), i % 2 ? "#c4410f" : "#1b1f3b"); }).join("") +
  P("690,150 730,172 690,194", "#c4410f"));
// 277 : rosace guillochée (sécurité de billet), bordeaux
const illRosace = (B = "#8c1d3f") => SV("0 0 420 420",
  Array.from({ length: 36 }, (_, i) => `<ellipse cx="210" cy="210" rx="190" ry="64" fill="none" stroke="${B}" stroke-width="1.6" transform="rotate(${i * 5} 210 210)" opacity="0.85"/>`).join("") +
  Array.from({ length: 24 }, (_, i) => `<ellipse cx="210" cy="210" rx="120" ry="34" fill="none" stroke="#3a0f1c" stroke-width="1.4" transform="rotate(${i * 7.5 + 3} 210 210)"/>`).join("") +
  C(210, 210, 200, "none", `stroke="${B}" stroke-width="5"`) + C(210, 210, 188, "none", `stroke="${B}" stroke-width="1.5"`) + C(210, 210, 52, "#f6efe2", `stroke="${B}" stroke-width="5"`) + P(POLY(8, 210, 210, 32, 0.39), B));

// ═══ Aides de composition partagées par les deux familles ═══
const MS = DOUX;
// réseaux en pastilles d'icônes à angles droits (contour)
function pastilles(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = "square";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderRadius: "0px", borderColor: o.contour || o.couleur || S.fg, transitionDuration: MS }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.fg, borderColor: o.survolFond || S.accent }, focus: GK.focus(o.focus || S.accent) } });
  return n;
}
// mot géant ton sur ton, rogné en bas de page (le nom du site)
function fantome(k, env, o) {
  const nom = nomDuSite(k, env, 120, o.couleur, { fontSize: o.taille || "fluid:90-200", lineHeight: 0.85, fontWeight: o.poids || "700", textTransform: o.casse, letterSpacing: o.suivi || "-0.02em", fontStyle: o.italique ? "italic" : undefined, overflowWrap: "anywhere", fontFamily: o.police || k.S.head, transitionDuration: MS });
  nom.parts.link.states = { hover: { color: o.survol || o.couleur }, focus: GK.focus(o.focus || o.couleur) };
  return k.col([nom], { width: "100%", paddingTop: "0px", paddingBottom: "0px", backgroundColor: o.fond, ...(o.extra || {}) });
}
const colLiens = (k, titre, items, o = {}) => bloc(k, titre, items.map((t) => lien(k, t, "/contact", { taille: o.taille || 16, couleur: o.couleur, police: o.police, survol: o.survol, focus: o.focus })), { couleurTitre: o.couleurTitre, min: o.min || "160px", gap: o.gap || "4px", police: o.policeTitre, extra: o.extra });
module.exports = { DOUX, sty, compact, modeleV2, identifiantV2, identite, GK, Moteur, racineDe, lien, caps, trait, souffle, carre, partie, horaires, coordonnees, bloc, lettre, nomDuSite, rangee, panneau, rangeeDe, PAGE_LARGEUR, mentionsBande,
  pastilles, fantome, colLiens, SV, R, P, C, L, HALOC, POLY, svgDeux, ROUE,
  illEmblemeChantier, illChargeuse, illRadar, illEngrenages, illPelleSurDalle, illBouteur, illCartes, illTerminal, illRives, illBlocs, illVirement, illRosace };
