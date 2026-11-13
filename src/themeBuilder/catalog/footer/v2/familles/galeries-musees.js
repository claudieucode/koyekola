// Famille v2 « Galeries et musées » — 6 modèles (ft2-356 à ft2-361), inspirés des captures d'inspiration 22, 23 et 24 : ANGLES DROITS partout, marques fictives, aucune coordonnée ni chiffre inventé.
// Les coordonnées et horaires viennent des Données de l'entreprise du site ; libellés de collections et adresses de réseaux = exemples à renommer.
// Mouvement (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, UNE animation visible par modèle (point ou bouton qui « respire », case qui se remplit, ligne qui s'indente), pas d'animation d'entrée.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const DOUX = 360; // ms : durée des transitions de survol / focus
const PH = ["48px", "32px", "20px"]; // marges latérales des bandes (bureau, tablette, mobile)

// ── Aides LOCALES à la famille (toutes à angles droits) ──
const gp = (g) => { const [r, c] = g.split(" "); return { rowGap: r, columnGap: c }; }; // gap à deux valeurs interdit sur k.row / k.col
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.fg, fontFamily: o.police || k.S.font, maxWidth: o.max, fontWeight: o.poids, fontStyle: o.style, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  if (o.titreCouleur) n.parts.title.styles.desktop = { ...n.parts.title.styles.desktop, color: o.titreCouleur, lineHeight: 1.4 };
  if (o.introCouleur) n.parts.intro.styles.desktop = { ...n.parts.intro.styles.desktop, color: o.introCouleur };
  if (o.boutonTexte) n.parts.button.styles.desktop = { ...n.parts.button.styles.desktop, color: o.boutonTexte };
  if (o.boutonSurvol) n.parts.button.states = { hover: o.boutonSurvol, focus: GK.focus(o.boutonSurvol.backgroundColor) };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: o.padH || "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const mentionsBande = (G, k, env, fond, o = {}) => {
  const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: o.couleur, liens: o.liens })(k, env, o.centre);
  const b = G.bande(k, [mentions], { fond, colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
  b.styles.desktop.color = o.liens || o.couleur || k.S.fg; // la ligne légale de la plateforme reprend la couleur de la dernière bande
  return b;
};

const FAM = "galeries-musees";
const I = require("../aides-illus-musgal");
const bandeIllus = (G, k, sc, fond, o = {}) => G.bande(k, I.illus(k, sc, o.st), { fond, colonne: true, gap: "0px", aligne: "stretch", padV: o.padV || ["0px", "0px", "0px"], padB: o.padB || ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: o.nom || "Illustration" });
const marqueW = (k, i, o, t = "64px") => k.W("html", { html: I.marque(i, o) }, { width: t, display: "block", fontSize: "0px", lineHeight: 0.8, flexShrink: 0 });
const colLiens = (G, k, titre, liste, o = {}) => G.colonne(k, [caps(k, titre, { couleur: o.titre, suivi: "0.16em" }), ...liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: "500", couleur: o.couleur, h: "44px", survol: o.survol, focus: o.focus }))], { poids: 1, min: o.min || "170px", gap: "2px" });
const rangLien = (k, t, u, o) => lien(k, `${t}  →`, u, { taille: o.taille || 18, poids: o.poids || "600", police: o.police, couleur: o.couleur, h: "58px", bloc: true, padH: "6px", survol: o.survol, focus: o.focus, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: o.filet } });

// ═══ ft2-356 « Cimaise » — galerie d'art contemporain. Parti pris de la capture 22 : fond clair, grande marque + phrase + bouton à gauche, colonnes de liens à droite, grande scène PEINTE pleine largeur en bas (ici une salle d'exposition : tableaux, deux visiteurs, banc).
const cimaise = identite({
  key: "c356", label: "Blanc cassé, noir et vermillon", humeur: "light",
  fond: "#fbfaf6", texte: "#121212", discret: "#555550", accent: "#c8321b", surface: "#f0eee7", encre: "#121212",
  police: "font.inter", titres: "font.italiana",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#12121255",
});
const cimaiseM = modeleV2({
  id: identifiantV2(356, "cimaise"), concept: "c-356-cimaise",
  name: "Cimaise", family: FAM,
  description: "Pour une galerie d'art contemporain : le nom en capitales fines, un bouton vermillon et deux colonnes de liens, puis une grande salle d'exposition illustrée pleine largeur (tableaux abstraits, deux visiteurs, banc). Blanc cassé, noir, vermillon.",
  tags: ["galerie", "art contemporain", "illustration", "salle d'exposition", "tableaux", "blanc", "vermillon", "angles droits"],
  identity: cimaise,
  racine: racineDe("#d3cdbd"),
  widgets: ["text", "link", "html", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#121212", VERM = "#c8321b", BLANC = "#fbfaf6";
    const nom = texte(k, `Cimaise<span style="color:${VERM}">.</span>`, { taille: 120, couleur: NOIR, police: S.head, lh: 0.95, align: "center", extra: { fontSize: "fluid:72-200", letterSpacing: "-0.02em", width: "100%" } });
    const legende = k.row([souffle(carre(k, VERM, "14px"), 3200), caps(k, "Galerie d'art contemporain", { couleur: NOIR, suivi: "0.3em" })], { gap: "14px", flexWrap: "nowrap", justifyContent: "center" });
    const l = (t, u) => lien(k, t, u, { taille: 17, poids: "500", couleur: NOIR, soulign: true, h: "48px", padH: "6px", survol: { color: VERM, letterSpacing: "0.06em" }, focus: VERM });
    const liens = k.row([l("Expositions en cours", "/blog"), l("Artistes", "/blog"), l("Éditions", "/blog"), l("Visiter la galerie", "/contact"), l("Contact", "/contact")], { ...gp("0px 36px"), justifyContent: "center", flexWrap: "wrap" });
    const texteB = G.bande(k, [marqueW(k, 6, { fond: BLANC, trait: NOIR, accent: VERM }, "72px"), nom, legende, trait(k, "#12121255"), liens], { fond: BLANC, colonne: true, gap: "26px", aligne: "center", padV: ["96px", "72px", "52px"], padB: ["56px", "44px", "32px"], padH: PH, nom: "Nom" });
    return [G.racine(k, [texteB, bandeIllus(G, k, "s356", BLANC, { nom: "Salle" }), mentionsBande(G, k, env, "#d3cdbd", { couleur: "#3b3a36", liens: NOIR })])];
  },
}, FAM);

// ═══ ft2-357 « Cartel » — musée de l'estampe. Parti pris de la capture 24 : nuit profonde, grand globe lumineux (ici une sphère armillaire gravée, anneaux, arcs roses, planche, croissant), puis un cartouche d'identité et ses liens.
const papier = identite({
  key: "c357", label: "Nuit indigo, crème et corail", humeur: "dark",
  fond: "#0d1030", texte: "#f3eee2", discret: "#bcb9d8", accent: "#ff8a7a", surface: "#161a46", encre: "#0d1030", surEncre: "#f3eee2",
  police: "font.literata", titres: "font.marcellus",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#f3eee266",
});
const cartel = modeleV2({
  id: identifiantV2(357, "cartel"), concept: "c-357-cartel",
  name: "Cartel", family: FAM,
  description: "Pour un musée : une grande sphère armillaire gravée qui rayonne sur nuit indigo (anneaux, arcs lumineux, planche, croissant), puis un cartouche à double cadre avec nom, adresse et horaires, et une ligne de liens. Indigo, crème, corail.",
  tags: ["musée", "estampe", "sphère armillaire", "illustration", "cartouche", "indigo", "crème", "angles droits"],
  identity: papier,
  racine: racineDe("#0d1030"),
  widgets: ["text", "link", "bizcontact", "bizhours", "html", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENC = "#f3eee2", COR = "#ff8a7a", FOND = "#0d1030";
    const haut = bandeIllus(G, k, "s357", FOND, { padV: ["32px", "20px", "8px"], nom: "Sphère" });
    const nom = texte(k, "Musée de l'Estampe", { taille: 44, couleur: ENC, police: S.head, align: "center", lh: 1.1, extra: { fontSize: "fluid:30-54", letterSpacing: "0.04em", width: "100%" } });
    const sous = caps(k, "Gravures · dessins · éditions anciennes", { couleur: COR, suivi: "0.22em", extra: { textAlign: "center", width: "100%" } });
    const infos = k.row([G.colonne(k, [caps(k, "Adresse et contact", { couleur: COR, extra: { textAlign: "center", width: "100%" } }), coordonnees(k, { couleur: ENC, lien: ENC, survol: COR, focus: COR, align: "center", taille: 15 })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" }), G.colonne(k, [caps(k, "Horaires d'ouverture", { couleur: COR, extra: { textAlign: "center", width: "100%" } }), horaires(k, { couleur: ENC, taille: 15, align: "center" })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" })], { ...gp("24px 48px"), flexWrap: "wrap", width: "100%", alignItems: "flex-start" });
    const interne = k.col([nom, sous, trait(k, "#f3eee266"), infos], { gap: "20px", alignItems: "center", width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: ENC, paddingTop: "40px", paddingBottom: "36px", paddingLeft: "40px", paddingRight: "40px" }, undefined, { paddingLeft: "18px", paddingRight: "18px", paddingTop: "28px", paddingBottom: "28px" });
    const cartouche = k.col([interne], { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: ENC, padding: "6px", maxWidth: "860px", marginLeft: "auto", marginRight: "auto" });
    const l = (t, u) => lien(k, t, u, { taille: 16, poids: "500", couleur: ENC, h: "48px", padH: "10px", survol: { color: COR, textDecoration: "underline" }, focus: COR });
    const pt = () => texte(k, "·", { taille: 18, couleur: COR, extra: { width: "10px", textAlign: "center" } });
    const liens = k.row([l("Collections", "/blog"), pt(), l("Expositions", "/blog"), pt(), l("Visites guidées", "/contact"), pt(), l("Boutique", "/contact"), pt(), l("Mécénat", "/contact")], { ...gp("0px 6px"), justifyContent: "center", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [cartouche, liens], { fond: FOND, colonne: true, gap: "28px", aligne: "stretch", padV: ["24px", "20px", "16px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Cartouche" });
    return [G.racine(k, [haut, corps, mentionsBande(G, k, env, FOND, { couleur: "#bcb9d8", liens: ENC, centre: true })])];
  },
}, FAM);

// ═══ ft2-358 « Damier d'exposition » — centre d'art. Parti pris de la capture 23 : bande claire avec une ligne d'objets en silhouette sur un trait de sol (ici fronton, sculptures sur socles, cubes, grue, arbres), puis pied noir en colonnes.
const damierId = identite({
  key: "c358", label: "Gris pierre, noir et orange signal", humeur: "dark",
  fond: "#141414", texte: "#ffffff", discret: "#d0d0cc", accent: "#ff8a4c", surface: "#1e1e1e", encre: "#141414", surEncre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.epilogue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff55",
});
const damier = modeleV2({
  id: identifiantV2(358, "damier-d-exposition"), concept: "c-358-damier-d-exposition",
  name: "Damier d'exposition", family: FAM,
  description: "Pour un centre d'art : une bande gris pierre où le fronton, les sculptures, les cubes, la grue et les arbres se détachent en silhouette sur un trait de sol, puis un pied noir (écusson, liens, horaires, accès, lettre) et un bouton orange. Gris pierre, noir, orange.",
  tags: ["centre d'art", "silhouettes", "illustration", "sculptures", "horaires", "gris", "noir", "orange", "angles droits"],
  identity: damierId,
  racine: racineDe("#141414"),
  widgets: ["text", "link", "bizcontact", "bizhours", "emailsubscribe", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#141414", ORA = "#ff8a4c", PIERRE = "#e8e8e4", BL = "#ffffff";
    const haut = bandeIllus(G, k, "s358", PIERRE, { padV: ["40px", "28px", "20px"], nom: "Silhouettes" });
    const btn = souffle(bouton(k, "Soutenir le centre", "/contact", { texte: NOIR, fond: ORA, h: "54px", survol: { backgroundColor: BL, borderColor: BL, color: NOIR, transform: { y: -3 } }, focus: BL }), 4800);
    const carteBase = (enfants, max) => k.col(enfants, { flexGrow: 1, flexBasis: "420px", minWidth: "0px", boxSizing: "border-box", gap: "10px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", borderStyle: "solid", borderWidth: "2px", borderColor: ORA });
    const lc = (t, u) => lien(k, `${t}  ↗`, u, { taille: 20, poids: "800", police: S.head, couleur: BL, h: "48px", bloc: true, survol: { color: ORA, paddingLeft: "8px" }, focus: ORA });
    const c1 = carteBase([marqueW(k, 7, { fond: NOIR, trait: BL, accent: ORA }, "72px"), texte(k, "Centre d'art", { taille: 30, police: S.head, couleur: BL, lh: 1.1 }), btn]);
    const c2 = carteBase([caps(k, "01 · Visiter", { couleur: ORA }), lc("Expositions", "/blog"), lc("Collections", "/blog"), lc("Visites", "/contact"), lc("Boutique", "/contact")]);
    const c3 = carteBase([caps(k, "02 · Horaires et accès", { couleur: ORA }), horaires(k, { couleur: BL, taille: 15 }), coordonnees(k, { couleur: BL, lien: BL, survol: ORA, focus: ORA, taille: 15 })]);
    const abo = abonnement(k, env, { titre: "03 · La lettre", intro: "Vernissages et nouvelles expositions.", bouton: "Je m'abonne", largeur: "100%", accent: ORA, texte: BL, titreCouleur: ORA, introCouleur: "#d0d0cc", boutonTexte: NOIR, boutonSurvol: { backgroundColor: BL, color: NOIR } });
    const pied = G.bande(k, [k.col([k.row([c1, c2], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" }), k.row([c3, carteBase([abo])], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { gap: "0px", width: "100%", alignItems: "stretch" })], { fond: NOIR, colonne: true, padV: ["56px", "44px", "32px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Cases" });
    return [G.racine(k, [haut, pied, mentionsBande(G, k, env, NOIR, { couleur: "#d0d0cc", liens: BL })])];
  },
}, FAM);

// ═══ ft2-359 « Grand accrochage » — musée. Parti pris de la capture 22 : fond franc, phrase + bouton + liens en haut, grande illustration en bas (ici la façade du musée : pédiment, colonnes, soleil, marches, visiteurs) sur corail.
const accroch = identite({
  key: "c359", label: "Corail, noir et blanc chaud", humeur: "light",
  fond: "#ff6b57", texte: "#1b1b1f", discret: "#3a1a15", accent: "#1b1b1f", surface: "#ff8472", encre: "#1b1b1f",
  police: "font.hanken-grotesk", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#1b1b1f66",
});
const grandAccrochage = modeleV2({
  id: identifiantV2(359, "grand-accrochage"), concept: "c-359-grand-accrochage",
  name: "Grand accrochage", family: FAM,
  description: "Pour un musée : « Entrez dans l'œuvre. » en grand sur corail, un énorme bouton noir qui respire et une colonne de liens, puis la façade du musée illustrée pleine largeur (pédiment, colonnes, soleil, marches, visiteurs) et une bande noire d'infos.",
  tags: ["musée", "façade", "illustration", "appel à l'action", "corail", "noir", "angles droits"],
  identity: accroch,
  racine: racineDe("#1b1b1f"),
  widgets: ["text", "link", "bizcontact", "bizhours", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#1b1b1f", CORAIL = "#ff6b57", CREME = "#fff4ea";
    const phrase = G.geant(`<p>Entrez dans<br>l'œuvre.</p>`, { taille: [52, 150], tablette: { taille: [56, 76] }, mobile: { taille: [44, 60] }, lh: 0.96, suivi: "-0.035em", poids: "800", police: S.head, couleur: NOIR })(k, env);
    const intro = texte(k, "Collections permanentes, expositions temporaires, ateliers : la visite commence ici.", { taille: 19, couleur: NOIR, max: "440px", poids: "500" });
    const btn = souffle(bouton(k, "Préparer ma visite", "/contact", { texte: CREME, fond: NOIR, h: "80px", taille: 20, padH: "44px", survol: { backgroundColor: CREME, borderColor: NOIR, color: NOIR, transform: { y: -3 } }, focus: CREME, extra: { alignSelf: "flex-start" } }), 4200);
    const gauche = G.colonne(k, [caps(k, "Musée d'art", { couleur: NOIR, suivi: "0.26em" }), phrase, intro, btn], { poids: 3, min: "300px", gap: "20px" });
    const rang = (t, u) => rangLien(k, t, u, { taille: 18, poids: "700", couleur: NOIR, survol: { color: CREME, paddingLeft: "16px", backgroundColor: NOIR }, focus: NOIR, filet: NOIR });
    const colonne = G.colonne(k, [caps(k, "Dans le musée", { couleur: NOIR }), k.col([rang("Collections", "/blog"), rang("Expositions", "/blog"), rang("Ateliers et visites", "/contact"), rang("Boutique", "/contact")], { gap: "0px", width: "100%", alignItems: "stretch", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: NOIR })], { poids: 0, base: "290px", min: "250px", gap: "14px", aligne: "stretch", extra: { flexShrink: 0 } });
    const bandeau = G.bande(k, [gauche, colonne], { fond: CORAIL, gap: "40px 80px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["24px", "16px", "8px"], padH: PH, nom: "Appel" });
    const infoC = G.colonne(k, [caps(k, "Nous trouver", { couleur: "#ffb3a8" }), coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: CORAIL, focus: CORAIL, taille: 15 })], { poids: 1, min: "240px", gap: "10px" });
    const infoH = G.colonne(k, [caps(k, "Horaires du musée", { couleur: "#ffb3a8" }), horaires(k, { couleur: "#ffffff", taille: 15 })], { poids: 1, min: "240px", gap: "10px" });
    const fine = G.bande(k, [infoC, infoH], { fond: NOIR, gap: "28px 64px", aligne: "flex-start", padV: ["40px", "32px", "28px"], padB: ["8px", "8px", "4px"], padH: PH, nom: "Infos" });
    return [G.racine(k, [bandeau, bandeIllus(G, k, "s359", CORAIL, { nom: "Façade" }), fine, mentionsBande(G, k, env, NOIR, { couleur: "#d6d0cc", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-360 « Rail de cimaise » — fondation d'art. Parti pris de la capture 23 : tout en une barre compacte (marque, liens, bouton) et une bande de silhouettes sur un trait de sol, ici un quai : bâtiment vitré, pont, voilier, quatre rangs de vagues bleues qui rejoignent le bas du pied.
const rail = identite({
  key: "c360", label: "Pierre claire, noir et bleu outremer", humeur: "light",
  fond: "#dcd8cc", texte: "#14141a", discret: "#4a4a50", accent: "#1d3a8a", surface: "#e8e5db", encre: "#14141a",
  police: "font.newsreader", titres: "font.red-hat-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#14141a66",
});
const railDeCimaise = modeleV2({
  id: identifiantV2(360, "rail-de-cimaise"), concept: "c-360-rail-de-cimaise",
  name: "Rail de cimaise", family: FAM,
  description: "Pour une fondation d'art : une barre compacte (écusson, nom, liens, bouton « Visiter », réseaux) puis un quai illustré (bâtiment vitré, pont, voilier, quatre rangs de vagues bleues) qui se fond dans le bas du pied bleu. Pierre claire, noir, bleu outremer.",
  tags: ["fondation", "barre compacte", "illustration", "vagues", "quai", "pierre", "bleu", "angles droits"],
  identity: rail,
  racine: racineDe("#1d3a8a"),
  widgets: ["text", "link", "html", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#14141a", BLEU = "#1d3a8a", PIERRE = "#dcd8cc";
    const marque = k.row([marqueW(k, 9, { fond: BLEU, trait: PIERRE, accent: "#ffffff" }, "56px"), souffle(carre(k, BLEU, "14px"), 3000), texte(k, "Fondation Lumeline", { taille: 22, poids: "800", police: S.head, couleur: NOIR, lh: 1.1 })], { gap: "12px", flexWrap: "nowrap", alignItems: "center" });
    const l = (t, u) => { const n = lien(k, t, u, { taille: 17, poids: "500", couleur: NOIR, h: "56px", padH: "4px", survol: { color: BLEU, borderBottomWidth: "3px" }, focus: BLEU, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "3px", borderColor: "transparent" } }); n.states.hover = { ...n.states.hover, borderColor: BLEU }; return n; };
    const liens = k.row(["Expositions|/blog", "Collections|/blog", "Soutenir|/contact", "Contact|/contact"].map((s) => { const [t, u] = s.split("|"); return l(t, u); }), { ...gp("0px 24px"), flexWrap: "wrap", alignItems: "center" });
    const visiter = bouton(k, "Visiter", "/contact", { texte: "#ffffff", fond: BLEU, h: "48px", taille: 14, padH: "24px", survol: { backgroundColor: NOIR, borderColor: NOIR, color: "#ffffff" }, focus: NOIR });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, poids: "600", couleur: NOIR, survol: BLEU, focus: BLEU })(k, env);
    const BL = "#ffffff";
    const l2 = (t, u) => { const n = lien(k, t, u, { taille: 17, poids: "500", couleur: BL, h: "56px", padH: "4px", survol: { color: "#dbe4ff", borderBottomWidth: "3px" }, focus: BL, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "3px", borderColor: "transparent" } }); n.states.hover = { ...n.states.hover, borderColor: BL }; return n; };
    const liens2 = k.row(["Expositions|/blog", "Collections|/blog", "Soutenir|/contact", "Contact|/contact"].map((s) => { const [t, u] = s.split("|"); return l2(t, u); }), { ...gp("0px 24px"), flexWrap: "wrap", alignItems: "center" });
    const marque2 = k.row([marqueW(k, 9, { fond: BLEU, trait: PIERRE, accent: BL }, "56px"), souffle(carre(k, BL, "14px"), 3000), texte(k, "Fondation Lumeline", { taille: 22, poids: "800", police: S.head, couleur: BL, lh: 1.1 })], { gap: "12px", flexWrap: "nowrap", alignItems: "center" });
    const visiter2 = bouton(k, "Visiter", "/contact", { texte: BLEU, fond: BL, h: "48px", taille: 14, padH: "24px", survol: { backgroundColor: PIERRE, borderColor: PIERRE, color: NOIR }, focus: PIERRE });
    const reseaux2 = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, poids: "600", couleur: BL, survol: "#dbe4ff", focus: BL })(k, env);
    const barre = G.bande(k, [caps(k, "Fondation d'art · expositions, collections, soutien", { couleur: "#dbe4ff", suivi: "0.2em" }), k.row([marque2, visiter2], { ...gp("12px 40px"), justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", width: "100%" }), trait(k, "#ffffff66"), k.row([liens2, reseaux2], { ...gp("8px 40px"), justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", width: "100%" })], { fond: BLEU, colonne: true, gap: "8px", padV: ["32px", "28px", "24px"], padB: ["32px", "24px", "20px"], padH: PH, nom: "Barre" });
    return [G.racine(k, [bandeIllus(G, k, "s360", PIERRE, { nom: "Quai" }), barre, mentionsBande(G, k, env, BLEU, { couleur: "#dbe4ff", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-361 « Escalier des salles » — musée. Parti pris de la capture 24 : objet lumineux monumental sur fond sombre (ici un soleil citron à rayons posé sur des gradins verts), puis les marches du pied qui rétrécissent comme les gradins du dessin.
const escalier = identite({
  key: "c361", label: "Vert forêt, sauge et blanc d'os", humeur: "dark",
  fond: "#20231d", texte: "#f1f3e8", discret: "#c3c9b4", accent: "#d8e48f", surface: "#3a4033", encre: "#10120e", surEncre: "#f1f3e8",
  police: "font.manrope", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f1f3e855",
});
const escalierM = modeleV2({
  id: identifiantV2(361, "escalier-des-salles"), concept: "c-361-escalier-des-salles",
  name: "Escalier des salles", family: FAM,
  description: "Pour un musée : un soleil citron à rayons posé sur des gradins verts, sur fond forêt, puis quatre bandes alignées à gauche qui rétrécissent comme des marches (nom géant, liens, coordonnées, lettre). Newsreader, vert forêt, sauge, blanc d'os.",
  tags: ["musée", "soleil", "gradins", "illustration", "bandes étagées", "vert", "sauge", "angles droits"],
  identity: escalier,
  racine: racineDe("#20231d"),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, FORET = "#20231d", MOYEN = "#3a4033", SAUGE = "#7c8a6a", PALE = "#d6dcc8", OS = "#f1f3e8", CITRON = "#d8e48f", FOND = "#e9ecdf", ENC = "#10120e";
    const marche = (larg, fond, enfants, extra) => k.col(enfants, { width: larg, boxSizing: "border-box", backgroundColor: fond, gap: "20px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "48px", paddingRight: "40px", alignItems: "flex-start", ...(extra || {}) }, { width: larg, paddingLeft: "32px", paddingRight: "28px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const haut = bandeIllus(G, k, "s361", FORET, { padV: ["32px", "20px", "8px"], nom: "Soleil" });
    const nom = G.geant(`<p>Les Salles<br>du Levant.</p>`, { taille: [48, 120], tablette: { taille: [64, 100] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.02em", poids: "400", police: S.head, couleur: OS })(k, env);
    const resa = souffle(bouton(k, "Préparer ma visite", "/contact", { texte: FORET, fond: CITRON, h: "56px", survol: { backgroundColor: OS, borderColor: OS, color: FORET, transform: { y: -3 } }, focus: OS }), 4200);
    const m1 = marche("100%", FORET, [caps(k, "Musée des arts", { couleur: CITRON, suivi: "0.26em" }), nom, resa], { paddingTop: "40px", paddingBottom: "64px" });
    const lc = (t, u) => lien(k, t, u, { taille: 18, poids: "600", couleur: OS, h: "48px", padH: "4px", survol: { color: CITRON, transform: { x: 6 } }, focus: CITRON });
    const m2 = marche("78%", MOYEN, [k.row([lc("Collections", "/blog"), lc("Expositions", "/blog"), lc("Visites et ateliers", "/contact"), lc("Boutique", "/contact"), lc("Mécénat", "/contact")], { ...gp("0px 32px"), flexWrap: "wrap" })], { paddingTop: "28px", paddingBottom: "28px" });
    const m3 = marche("56%", SAUGE, [caps(k, "Nous trouver", { couleur: ENC }), coordonnees(k, { couleur: ENC, lien: ENC, survol: OS, focus: ENC, taille: 16 })], { paddingTop: "32px", paddingBottom: "32px" });
    const abo = abonnement(k, env, { titre: "La lettre du musée", intro: "Expositions et rencontres, de temps en temps.", bouton: "Je m'abonne", largeur: "300px", accent: FORET, texte: ENC, titreCouleur: FORET, introCouleur: "#2c3226", boutonTexte: OS, boutonSurvol: { backgroundColor: SAUGE, color: ENC } });
    const m4 = marche("34%", PALE, [abo], { paddingTop: "28px", paddingBottom: "28px", minWidth: "340px", color: ENC });
    return [G.racine(k, [haut, m1, m2, m3, m4, mentionsBande(G, k, env, FOND, { couleur: "#3a4033", liens: ENC })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Galeries et musées", target: 6, built: true,
  description: "Pieds de galeries, musées et centres d'art, angles droits, animations fluides : galerie contemporaine, musée, centre d'art, fondation.",
  models: [cimaiseM, cartel, damier, grandAccrochage, railDeCimaise, escalierM],
};
