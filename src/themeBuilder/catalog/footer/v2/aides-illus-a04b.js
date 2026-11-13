// Compositions d'illustration (agent a04) : trois partis pris tirés des captures 13 (appel centré + curseurs + rangée de pictos + pied), 14 (nom monumental) et 15 (scène illustrée en bas + mascotte).
const A = require("./aides-a04");
const I = require("./aides-illus-a04");
const { lien, caps, texte, trait, souffle, bouton, mentions, PAD } = A;
const { dessin, P, r, alea } = I;


// colonne de liens en quatre variantes de structure : 1 pile, 2 pile imbriquée, 3 liens en ligne, 4 liens numérotés
function colV(k, G, cv, titre, liens, c) {
  const L = (a, u) => lien(k, a, u, { taille: c.taille || 16, poids: "500", couleur: c.lien, survol: { color: c.surv, transform: { x: 4 } }, focus: c.surv });
  const T = caps(k, titre, { couleur: c.titre, taille: c.tt, suivi: c.ts });
  const o = { poids: 1, min: c.min || "130px", gap: "4px", base: c.base, extra: c.extra };
  if (cv === 2) return G.colonne(k, [T, k.col(liens.map(([a, u]) => L(a, u)), { gap: "0px", alignItems: "flex-start", width: "100%", flexGrow: 1 })], o);
  if (cv === 3) return G.colonne(k, [T, k.row(liens.map(([a, u]) => L(a, u)), { gap: "0px 18px", flexWrap: "wrap", alignItems: "center" })], { ...o, poids: 1.2, min: "170px" });
  if (cv === 4) return G.colonne(k, [T, ...liens.map(([a, u], i) => k.row([caps(k, `0${i + 1}`, { couleur: c.titre, taille: "11px" }), L(a, u)], { gap: "10px", alignItems: "center", flexWrap: "nowrap", justifyContent: "space-between" }))], o);
  return G.colonne(k, [T, ...liens.map(([a, u]) => L(a, u))], o);
}

// pastilles d'icônes de réseaux : cases carrées pleines avec le sigle (liens https d'exemple)
function pastilles(k, o) {
  const l = [["In", "https://www.instagram.com/", "Instagram"], ["Fb", "https://www.facebook.com/", "Facebook"], ["Pi", "https://www.pinterest.com/", "Pinterest"], ["Yt", "https://www.youtube.com/", "YouTube"]].slice(0, o.n || 3);
  return k.row(l.map(([s, u, n]) => { const x = lien(k, s, u, { taille: 15, poids: "800", couleur: o.texte, h: "44px", extra: { width: "44px", justifyContent: "center", backgroundColor: o.fond, borderRadius: "0px", transitionDuration: A.DOUX }, survol: { backgroundColor: o.survol, color: o.surTexte || o.fond }, focus: o.focus || o.survol }); x.props = { ...(x.props || {}), ariaLabel: n }; return x; }), { gap: "10px", flexWrap: "wrap", alignItems: "center" });
}

// nom monumental dessiné sur toute la largeur de la bande (capture 14) ; deco = formes en « unités de lettre » ; fondSvg = fond SVG facultatif (halo)
function bandeMot(k, G, o) {
  const sw = o.sw || 26, ec = o.ecart || 22, m = I.mot(o.texte, o.couleur, sw, ec), U = m.w + 34, kk = 1200 / U, haut = 140 + (o.marge || 0);
  const H = Math.round((haut + 20) * kk);
  const gen = () => `<g transform="translate(${r(17 * kk)} ${r(((o.marge || 0) + 10) * kk)}) scale(${r(kk)})">${o.deco0 ? o.deco0(m.w) : ""}${m.corps}${o.deco ? o.deco(m.w) : ""}</g>`;
  return G.bande(k, dessin(k, [1200, H, gen], null, { marginBottom: "-4px" }), { fond: o.fond, colonne: true, padV: o.padV || ["8px", "8px", "8px"], padB: o.padB || ["0px", "0px", "0px"], padH: PAD, nom: o.nom || "Nom monumental" });
}

// capture 13 : appel centré, curseurs flottants, rangée de pictos, pied de colonnes, ligne basse avec pastilles. Quatre variantes de structure (o.v = 1 à 4).
function heros(k, env, G, o) {
  const S = k.S, v = o.v || 1;
  const forme = () => `<rect width="64" height="64" fill="${o.accent}"/>` + I.formes[o.emblemeForme](o.fond);
  const marque = (t) => dessin(k, [64, 64, forme], null, { width: t });
  const curGen = I.curseurs(o.curseurs, o.fondCurs || o.fond, o.encre);
  const titre = (c) => G.geant(o.titre, { taille: [40, 88], tablette: { taille: [52, 72] }, mobile: { taille: [38, 48] }, lh: 1.02, suivi: o.suivi || "-0.02em", poids: o.poidsTitre || "700", police: S.head, couleur: o.encre })(k, env, c);
  const sous = (c) => texte(k, o.sous, { taille: 19, couleur: o.discret, largeur: "560px", align: c ? "center" : undefined });
  const b1 = souffle(bouton(k, o.b1[0], o.b1[1], { texte: o.b1[3], fond: o.b1[2], bord: o.b1[2], survol: { backgroundColor: o.survol, borderColor: o.survol, color: o.surTexte, transform: { y: -3 } }, focus: o.survol }), 4200);
  const b2 = bouton(k, o.b2[0], o.b2[1], { texte: o.encre, fond: o.b2[2], bord: o.encre, survol: { backgroundColor: o.encre, color: o.fond, transform: { y: -3 } }, focus: o.encre });
  const btns = (c) => k.row([b1, b2], { gap: "14px", justifyContent: c ? "center" : "flex-start", flexWrap: "wrap" });
  const curBande = G.bande(k, dessin(k, [1200, 220, curGen], [390, 200, curGen]), { fond: o.fondCurs || o.fond, colonne: true, padV: ["24px", "20px", "16px"], padB: ["0px", "0px", "0px"], padH: PAD, nom: "Curseurs" });
  const pict = (n) => dessin(k, [1200, 150, I.rangee(o.pictos, o.fondRangee || o.fond, o.traitRangee, o.accentRangee || o.accent)], [390, 110, I.rangee(o.pictos.slice(0, 4), o.fondRangee || o.fond, o.traitRangee, o.accentRangee || o.accent)]);
  const rg = G.bande(k, pict(), { fond: o.fondRangee || o.fond, colonne: true, padV: ["16px", "12px", "8px"], padB: ["16px", "12px", "8px"], padH: PAD, nom: "Rangée de pictos" });
  const col = (t, l, cadre) => colV(k, G, o.cv || 1, t, l, { titre: o.titreCol, lien: o.encre, surv: o.accent2 || o.accent, extra: cadre ? { borderStyle: "solid", borderWidth: "1px", borderColor: o.filet, boxSizing: "border-box", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px" } : undefined });
  const contact = () => G.colonne(k, [caps(k, "Nous trouver", { couleur: o.titreCol }), A.coordonnees(k, { couleur: o.discret, lien: o.encre, survol: o.accent2 || o.accent, focus: o.accent2 || o.accent, taille: 15 })], { poids: 1.4, min: "200px", gap: "6px" });
  const nomMarque = () => k.row([...marque("36px"), k.T(`<p>${o.marqueNom}</p>`, { fontSize: "26px", fontWeight: "700", fontFamily: S.head, color: o.encre, lineHeight: 1.1 })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
  const mots = (w) => texte(k, o.phrase, { taille: 16, couleur: o.discret, largeur: w || "300px" });
  const pas = (n) => pastilles(k, { fond: o.encre, texte: o.fond, survol: o.accent, surTexte: o.fond, n: n || 4 });
  const mentionsBas = () => mentions(k, env, { couleur: o.discret, liens: o.encre });
  const filtres = o.cols; let bandes = [], bas;
  if (v === 1) {
    const centre = G.bande(k, [...marque("56px"), titre(true), sous(true), btns(true)], { fond: o.fond, colonne: true, gap: "22px", aligne: "center", padV: ["48px", "40px", "32px"], padB: ["56px", "44px", "36px"], padH: PAD, nom: "Appel" });
    const pied = G.bande(k, [G.colonne(k, [nomMarque(), mots()], { poids: 1.2, min: "240px", gap: "16px" }), k.row([...filtres.map(([t, l]) => col(t, l)), ...(o.contactCol ? [contact()] : [])], { gap: "24px 32px", alignItems: "flex-start", flexWrap: "wrap", flexGrow: 3, flexBasis: "560px" })], { fond: o.fondPied || o.fond, gap: "40px 56px", aligne: "flex-start", padV: ["56px", "44px", "36px"], padB: ["40px", "32px", "28px"], padH: PAD, nom: "Marque et colonnes" });
    bas = G.bande(k, [mentionsBas(), pas()], { fond: o.fondPied || o.fond, gap: "16px 40px", aligne: "center", padV: ["12px", "12px", "12px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: o.filet }, nom: "Mentions" });
    centre.styles.desktop.color = o.discret;
    bandes = [curBande, centre, rg, pied];
  } else if (v === 2) {
    // appel à gauche, curseurs à droite dans la même rangée ; pictos ; pied en deux étages (marque + pastilles, puis colonnes à plat)
    const gauche = G.colonne(k, [titre(false), sous(false), btns(false)], { poids: 1.3, min: "300px", gap: "22px" });
    const droite = k.col(dessin(k, [560, 320, curGen], [390, 200, curGen]), { flexGrow: 1, flexBasis: "320px", minWidth: "280px" });
    const hero = G.bande(k, [gauche, droite], { fond: o.fond, gap: "32px 56px", aligne: "center", padV: ["64px", "48px", "36px"], padB: ["48px", "36px", "28px"], padH: PAD, nom: "Appel et curseurs" });
    const marqueBande = G.bande(k, [k.row([nomMarque(), mots("360px")], { gap: "20px 32px", alignItems: "center", flexWrap: "wrap" }), pas(4)], { fond: o.fondPied || o.fond, gap: "16px 32px", aligne: "center", padV: ["40px", "32px", "24px"], padB: ["8px", "8px", "8px"], padH: PAD, nom: "Marque" });
    const colsBande = G.bande(k, [...filtres.map(([t, l]) => col(t, l))], { fond: o.fondPied || o.fond, gap: "28px 40px", aligne: "flex-start", padV: ["28px", "24px", "20px"], padB: ["36px", "28px", "24px"], padH: PAD, nom: "Colonnes" });
    bas = G.bande(k, [mentionsBas()], { fond: o.fondPied || o.fond, colonne: true, padV: ["16px", "14px", "12px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: o.filet }, nom: "Mentions" });
    hero.styles.desktop.color = o.discret;
    bandes = [hero, rg, marqueBande, colsBande];
  } else if (v === 3) {
    // tout l'appel dans UNE bande centrée (curseurs, marque, titre, boutons, pictos) puis un pied en deux colonnes : carte cadrée + grille
    const haut = G.bande(k, [...dessin(k, [1200, 220, curGen], [390, 200, curGen]), ...marque("56px"), titre(true), sous(true), btns(true), ...pict()], { fond: o.fond, colonne: true, gap: "20px", aligne: "center", padV: ["24px", "20px", "16px"], padB: ["24px", "20px", "16px"], padH: PAD, nom: "Appel complet" });
    const carte = G.colonne(k, [nomMarque(), mots("320px"), contact(), pas(3)], { poids: 1, min: "260px", gap: "18px", extra: { borderStyle: "solid", borderWidth: "1px", borderColor: o.filet, boxSizing: "border-box", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" } });
    const grille = k.col([k.row([col(...filtres[0]), col(...filtres[1])], { gap: "24px 32px", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }), k.row([col(...filtres[2])], { width: "100%" })], { gap: "28px", flexGrow: 1.6, flexBasis: "380px", minWidth: "260px" });
    const pied = G.bande(k, [carte, grille], { fond: o.fondPied || o.fond, gap: "32px 56px", aligne: "stretch", padV: ["40px", "32px", "28px"], padB: ["40px", "32px", "28px"], padH: PAD, nom: "Carte et colonnes" });
    bas = G.bande(k, [mentionsBas()], { fond: o.fondPied || o.fond, colonne: true, padV: ["12px", "12px", "12px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: o.filet }, nom: "Mentions" });
    haut.styles.desktop.color = o.discret;
    bandes = [haut, pied];
  } else {
    // pictos en tête, appel, puis quatre cartes cadrées pleine largeur ; pastilles dans la ligne basse
    const centre = G.bande(k, [titre(true), sous(true), btns(true), ...dessin(k, [1200, 220, curGen], [390, 200, curGen], { marginTop: "8px" })], { fond: o.fond, colonne: true, gap: "18px", aligne: "center", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: PAD, nom: "Appel" });
    const cartes = G.bande(k, [k.row(filtres.map(([t, l]) => col(t, l, true)), { gap: "0px", flexWrap: "wrap", alignItems: "stretch", width: "100%" })], { fond: o.fondPied || o.fond, colonne: true, padV: ["24px", "20px", "16px"], padB: ["24px", "20px", "16px"], padH: PAD, nom: "Cartes de liens" });
    bas = G.bande(k, [nomMarque(), pas(3), mentionsBas()], { fond: o.fondPied || o.fond, gap: "16px 32px", aligne: "center", padV: ["16px", "14px", "12px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: o.filet }, nom: "Marque et mentions" });
    centre.styles.desktop.color = o.discret;
    bandes = [rg, centre, cartes];
  }
  bas.styles.desktop.color = o.discret;
  return [...bandes, bas];
}

// capture 15 : scène illustrée, mascotte, marque + contact + pastilles, quatre colonnes à titres colorés. Quatre variantes (o.v = 1 à 4).
function paysage(k, env, G, o) {
  const S = k.S, v = o.v || 1;
  const forme = () => `<rect width="64" height="64" fill="${o.accent}"/>` + I.formes[o.emblemeForme](o.fond);
  const nom = () => k.row([...dessin(k, [64, 64, forme], null, { width: "40px" }), k.T(`<p>${o.marqueNom}</p>`, { fontSize: "30px", fontWeight: "700", fontFamily: S.head, color: o.encre, lineHeight: 1.1, letterSpacing: o.suivi || "0em", textTransform: o.casse })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
  const phrase = () => texte(k, o.phrase, { taille: 18, couleur: o.encre, largeur: "420px", lh: 1.45 });
  const pas = (n) => pastilles(k, { fond: o.accent, texte: o.fond, survol: o.encre, surTexte: o.fond, n: n || 5 });
  const mascotte = (flex) => { const m = k.col(dessin(k, [200, 224, o.mascotte], null, { width: "160px" }), { flexGrow: 0, flexShrink: 0, flexBasis: "160px", alignItems: "center", ...(flex || {}) }); m.hideOn = ["mobile"]; return m; };
  const col = (t, l) => colV(k, G, o.cv || 1, t, l, { titre: o.titreCol, tt: "15px", ts: "0.08em", lien: o.discret, surv: o.encre, taille: 17, min: "150px", base: "150px" });
  const contact = () => A.coordonnees(k, { couleur: o.discret, lien: o.discret, survol: o.accent2, focus: o.accent2, taille: 15 });
  const ment = () => mentions(k, env, { couleur: o.discret, liens: o.encre });
  const scene = (haut) => G.bande(k, dessin(k, [1400, 520, o.scene], [390, 300, o.scene]), { fond: o.fond, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Scène illustrée" });
  let bandes;
  if (v === 1) {
    const gauche = G.colonne(k, [nom(), phrase(), o.contact ? contact() : trait(k, o.filet), pas(5), ment()], { poids: 1.5, min: "280px", gap: "20px" });
    const grille = k.col([k.row([col(...o.cols[0]), col(...o.cols[1])], { gap: "28px 40px", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }), k.row([col(...o.cols[2]), col(...o.cols[3])], { gap: "28px 40px", flexWrap: "wrap", alignItems: "flex-start", width: "100%" })], { gap: "36px", flexGrow: 1.6, flexBasis: "380px", minWidth: "260px" });
    const haut = G.bande(k, [gauche, mascotte(), grille], { fond: o.fond, gap: "40px 48px", aligne: "flex-start", padV: ["80px", "60px", "44px"], padB: ["56px", "44px", "32px"], padH: PAD, nom: "Marque, mascotte et colonnes" });
    haut.styles.desktop.color = o.discret; bandes = [haut, scene()];
  } else if (v === 2) {
    // marque et pastilles en tête (une ligne), quatre colonnes à plat avec la mascotte en bout de rangée, scène, mentions seules
    const tete = G.bande(k, [k.row([nom(), phrase()], { gap: "16px 40px", alignItems: "center", flexWrap: "wrap" }), pas(4)], { fond: o.fond, gap: "20px 32px", aligne: "center", padV: ["56px", "44px", "32px"], padB: ["16px", "12px", "8px"], padH: PAD, nom: "Marque" });
    const cols = G.bande(k, [...o.cols.map(([t, l]) => col(t, l)), mascotte({ flexBasis: "140px" })], { fond: o.fond, gap: "28px 40px", aligne: "flex-start", padV: ["24px", "20px", "16px"], padB: ["32px", "24px", "20px"], padH: PAD, nom: "Colonnes et mascotte" });
    tete.styles.desktop.color = o.discret; cols.styles.desktop.color = o.discret;
    const ments = G.bande(k, [ment()], { fond: o.fond, colonne: true, padV: ["0px", "0px", "0px"], padB: ["20px", "16px", "12px"], padH: PAD, nom: "Mentions" });
    bandes = [tete, cols, scene(), ments];
  } else if (v === 3) {
    // la scène EN TÊTE (comme une bannière), puis trois zones : mascotte et phrase / colonnes en grille / pastilles et mentions
    const zones = G.bande(k, [G.colonne(k, [k.col(dessin(k, [200, 224, o.mascotte], null, { width: "140px" }), { alignItems: "flex-start" }), nom(), phrase()], { poids: 1, min: "260px", gap: "16px" }), k.row(o.cols.map(([t, l]) => col(t, l)), { gap: "28px 36px", flexWrap: "wrap", alignItems: "flex-start", flexGrow: 2, flexBasis: "520px" })], { fond: o.fond, gap: "32px 56px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: PAD, nom: "Marque et colonnes" });
    const bas3 = G.bande(k, [pas(5), ment()], { fond: o.fond, gap: "16px 40px", aligne: "center", padV: ["8px", "8px", "8px"], padB: ["32px", "28px", "24px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: o.filet }, nom: "Pastilles et mentions" });
    zones.styles.desktop.color = o.discret; bandes = [scene(), zones, bas3];
  } else {
    // tout centré : mascotte, marque, phrase, colonnes en rangée, pastilles, mentions, puis la scène
    const centre = G.bande(k, [mascotte({ alignSelf: "center" }), nom(), phrase(), k.row(o.cols.map(([t, l]) => col(t, l)), { gap: "24px 40px", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center", width: "100%" }), o.contact ? contact() : trait(k, o.filet), pas(4), ment()], { fond: o.fond, colonne: true, gap: "22px", aligne: "center", padV: ["56px", "44px", "32px"], padB: ["40px", "32px", "24px"], padH: PAD, max: "980px", nom: "Marque centrée" });
    centre.styles.desktop.color = o.discret; centre.styles.desktop.textAlign = "center"; bandes = [centre, scene()];
  }
  return bandes;
}
module.exports = { pastilles, bandeMot, heros, paysage };
