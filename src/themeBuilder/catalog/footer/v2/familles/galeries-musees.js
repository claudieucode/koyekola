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

// ═══ ft2-356 « Cimaise » — galerie d'art contemporain (archétype B : nom monumental seul, grand vide)
// Inspiration : le grand vide autour du seul objet central de la capture 24 et le logo isolé de la capture 22. Un seul mot géant « Cimaise. » centré en Italiana sur blanc cassé, un point vermillon qui « respire »
// (le point rouge du « vendu »), trois liens seulement et la ligne légale. Aucune colonne, aucune carte.
const cimaise = identite({
  key: "c356", label: "Blanc cassé, noir et vermillon", humeur: "light",
  fond: "#fbfaf6", texte: "#121212", discret: "#555550", accent: "#c8321b", surface: "#f0eee7", encre: "#121212",
  police: "font.inter", titres: "font.italiana",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#12121255",
});
const cimaiseM = modeleV2({
  id: identifiantV2(356, "cimaise"), concept: "c-356-cimaise",
  name: "Cimaise", family: FAM,
  description: "Pour une galerie d'art contemporain : un seul mot monumental centré en capitales fines sur blanc cassé, un point vermillon qui respire, trois liens seulement, un grand vide et la ligne légale. Blanc cassé, noir, vermillon.",
  tags: ["galerie", "art contemporain", "nom monumental", "minimal", "blanc", "vermillon", "angles droits"],
  identity: cimaise,
  racine: racineDe("#fbfaf6"),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#121212", VERM = "#c8321b", BLANC = "#fbfaf6";
    const nom = texte(k, `Cimaise<span style="color:${VERM}">.</span>`, { taille: 120, couleur: NOIR, police: S.head, lh: 0.95, align: "center", extra: { fontSize: "fluid:72-200", letterSpacing: "-0.02em", width: "100%" } });
    const point = souffle(carre(k, VERM, "14px"), 3200);
    const legende = k.row([point, caps(k, "Galerie d'art contemporain", { couleur: NOIR, suivi: "0.34em" })], { gap: "14px", justifyContent: "center", flexWrap: "nowrap" });
    const l = (t, u) => lien(k, t, u, { taille: 16, poids: "500", couleur: NOIR, soulign: true, h: "48px", padH: "6px", survol: { color: VERM, letterSpacing: "0.06em" }, focus: VERM });
    const liens = k.col([k.row([l("Expositions en cours", "/blog"), l("Artistes", "/blog")], { ...gp("0px 40px"), justifyContent: "center" }), l("Visiter la galerie", "/contact")], { gap: "0px", alignItems: "center" });
    const centre = G.bande(k, [nom, trait(k, "#12121255"), legende, liens], { fond: BLANC, colonne: true, gap: "40px", aligne: "center", padV: ["144px", "104px", "72px"], padB: ["120px", "88px", "64px"], padH: PH, nom: "Nom" });
    return [G.racine(k, [centre, mentionsBande(G, k, env, BLANC, { couleur: "#555550", liens: NOIR, centre: true })])];
  },
}, FAM);

// ═══ ft2-357 « Cartel » — musée de l'estampe (archétype J : papier à en-tête)
// Inspiration : le bloc central d'identité (logo, adresse) de la capture 23, ramené à un cartouche de papier à lettres. Fond papier, double cadre fin, nom en Marcellus, adresse et horaires centrés dans le cartouche,
// ligne de liens centrée séparés de points, double filet, mentions centrées. Marcellus et Literata, papier chaud et rouge de sang de bœuf.
const papier = identite({
  key: "c357", label: "Papier chaud et rouge sang de bœuf", humeur: "light",
  fond: "#efe9dc", texte: "#2b2a28", discret: "#5a564e", accent: "#7a1f1f", surface: "#e4dcca", encre: "#2b2a28",
  police: "font.literata", titres: "font.marcellus",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#2b2a2866",
});
const cartel = modeleV2({
  id: identifiantV2(357, "cartel"), concept: "c-357-cartel",
  name: "Cartel", family: FAM,
  description: "Pour un musée : un pied en papier à en-tête, cartouche centré à double cadre fin avec le nom, l'adresse et les horaires, liens en ligne centrée séparés de points, double filet et mentions. Papier chaud, rouge sang de bœuf.",
  tags: ["musée", "papier à en-tête", "cartouche", "centré", "filets", "papier", "rouge", "angles droits"],
  identity: papier,
  racine: racineDe("#efe9dc"),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#2b2a28", SANG = "#7a1f1f", PAPIER = "#efe9dc";
    const double = () => k.col([trait(k, ENC, "3px"), k.col([], { height: "4px" }), trait(k, ENC, "1px")], { gap: "0px", width: "100%" });
    const nom = texte(k, "Musée de l'Estampe", { taille: 44, couleur: ENC, police: S.head, align: "center", lh: 1.1, extra: { fontSize: "fluid:30-54", letterSpacing: "0.04em", width: "100%" } });
    const sous = caps(k, "Gravures · dessins · éditions anciennes", { couleur: SANG, suivi: "0.22em", extra: { textAlign: "center", width: "100%" } });
    const infos = k.row([G.colonne(k, [caps(k, "Adresse et contact", { couleur: SANG, extra: { textAlign: "center", width: "100%" } }), coordonnees(k, { couleur: ENC, lien: ENC, survol: SANG, focus: SANG, align: "center", taille: 15 })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" }), G.colonne(k, [caps(k, "Horaires d'ouverture", { couleur: SANG, extra: { textAlign: "center", width: "100%" } }), horaires(k, { couleur: ENC, taille: 15, align: "center" })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" })], { ...gp("24px 48px"), flexWrap: "wrap", width: "100%", alignItems: "flex-start" });
    const interne = k.col([nom, sous, trait(k, "#2b2a2866"), infos], { gap: "20px", alignItems: "center", width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: ENC, paddingTop: "40px", paddingBottom: "36px", paddingLeft: "40px", paddingRight: "40px" }, undefined, { paddingLeft: "18px", paddingRight: "18px", paddingTop: "28px", paddingBottom: "28px" });
    const cartouche = k.col([interne], { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: ENC, padding: "6px", backgroundColor: "#f6f1e6", maxWidth: "860px", marginLeft: "auto", marginRight: "auto" });
    const l = (t, u) => lien(k, t, u, { taille: 16, poids: "500", couleur: ENC, h: "48px", padH: "10px", survol: { color: SANG, textDecoration: "underline" }, focus: SANG });
    const pt = () => texte(k, "·", { taille: 18, couleur: SANG, extra: { width: "10px", textAlign: "center" } });
    const liens = k.row([l("Collections", "/blog"), pt(), l("Expositions", "/blog"), pt(), l("Visites guidées", "/contact"), pt(), l("Boutique", "/contact"), pt(), l("Mécénat", "/contact")], { ...gp("0px 6px"), justifyContent: "center", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [double(), cartouche, liens, double()], { fond: PAPIER, colonne: true, gap: "32px", aligne: "stretch", padV: ["72px", "56px", "40px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Papier à en-tête" });
    return [G.racine(k, [corps, mentionsBande(G, k, env, PAPIER, { couleur: "#5a564e", liens: ENC, centre: true })])];
  },
}, FAM);

// ═══ ft2-358 « Damier d'exposition » — centre d'art (archétype C : grille de huit cases égales)
// Inspiration : les colonnes à titres courts alignées de la capture 24 et la rangée d'informations de la capture 23, découpées en huit cases égales à filets noirs : chaque case est un lien ou une information
// (expositions, collections, visite, boutique, horaires, accès, lettre, mécénat). Gris pierre, noir et orange signal ; chaque case lien s'illumine d'orange au survol. Epilogue et IBM Plex Sans.
const damierId = identite({
  key: "c358", label: "Gris pierre, noir et orange signal", humeur: "light",
  fond: "#e8e8e4", texte: "#141414", discret: "#4b4b47", accent: "#a93509", surface: "#f6f6f3", encre: "#141414",
  police: "font.ibm-plex-sans", titres: "font.epilogue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#14141466",
});
const damier = modeleV2({
  id: identifiantV2(358, "damier-d-exposition"), concept: "c-358-damier-d-exposition",
  name: "Damier d'exposition", family: FAM,
  description: "Pour un centre d'art : un damier de huit cases égales à filets noirs, chaque case est un lien ou une information (expositions, collections, visite, boutique, horaires, accès, lettre, mécénat). Gris pierre, noir, orange signal.",
  tags: ["centre d'art", "damier", "grille", "cases", "horaires", "gris", "orange", "angles droits"],
  identity: damierId,
  racine: racineDe("#e8e8e4"),
  widgets: ["text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#141414", ORA = "#a93509", PIERRE = "#e8e8e4", CLAIR = "#f6f6f3";
    const base = (enfants, fond, extra) => k.col(enfants, { flexGrow: 1, flexBasis: "auto", minWidth: "0px", minHeight: "220px", boxSizing: "border-box", gap: "10px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", backgroundColor: fond, borderStyle: "solid", borderWidth: "2px", borderColor: NOIR, transitionDuration: DOUX, ...(extra || {}) });
    const caseLien = (num, nom, url, fond, texteC, num_c, ev) => {
      const l = lien(k, `${nom}  ↗`, url, { taille: 26, poids: "800", police: S.head, couleur: texteC, h: "52px", bloc: true, lh: 1.1, survol: { color: ev.t }, focus: ev.f, extra: { width: "100%" } });
      const c = base([caps(k, num, { couleur: num_c, suivi: "0.2em" }), l], fond, { justifyContent: "space-between" });
      c.states = { hover: { backgroundColor: ev.b, transform: { y: -4 } } };
      return c;
    };
    const ev = { b: ORA, t: "#ffffff", f: NOIR };
    const evN = { b: ORA, t: "#ffffff", f: "#ffffff" };
    const c1 = caseLien("01", "Expositions", "/blog", CLAIR, NOIR, ORA, ev);
    const c2 = caseLien("02", "Collections", "/blog", PIERRE, NOIR, ORA, ev);
    const c3 = caseLien("03", "Visite", "/contact", NOIR, "#ffffff", "#ffb18f", evN);
    const c4 = caseLien("04", "Boutique", "/contact", CLAIR, NOIR, ORA, ev);
    const c5 = base([caps(k, "05  Horaires", { couleur: ORA, suivi: "0.16em" }), horaires(k, { couleur: NOIR, taille: 15 })], PIERRE);
    const c6 = base([caps(k, "06  Accès", { couleur: ORA, suivi: "0.16em" }), coordonnees(k, { couleur: NOIR, lien: NOIR, survol: ORA, focus: ORA, taille: 15 })], CLAIR);
    const abo = abonnement(k, env, { titre: "07  La lettre", intro: "Vernissages et nouvelles expositions.", bouton: "Je m'abonne", largeur: "100%", accent: ORA, texte: NOIR, titreCouleur: ORA, introCouleur: "#4b4b47", boutonTexte: "#ffffff", boutonSurvol: { backgroundColor: NOIR, color: "#ffffff" } });
    const c7 = base([abo], PIERRE);
    const c8 = caseLien("08", "Mécénat", "/contact", ORA, "#ffffff", "#ffe2d1", { b: NOIR, t: "#ffffff", f: "#ffffff" });
    souffle(c8, 4800);
    const pile = (a, b) => k.col([a, b], { gap: "0px", flexGrow: 1, flexBasis: "250px", minWidth: "0px", alignItems: "stretch" });
    const rang1 = k.row([pile(c1, c5), pile(c2, c6), pile(c3, c7), pile(c4, c8)], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const grille = G.bande(k, [rang1], { fond: PIERRE, colonne: true, gap: "0px", padV: ["56px", "44px", "32px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Damier" });
    return [G.racine(k, [grille, mentionsBande(G, k, env, PIERRE, { couleur: "#4b4b47", liens: NOIR })])];
  },
}, FAM);

// ═══ ft2-359 « Grand accrochage » — musée (archétype F : bandeau d'appel XXL + une colonne étroite à droite)
// Inspiration : le grand bloc d'appel et la colonne de liens étroite de la capture 23. Un bandeau corail XXL : « Entrez dans l'œuvre. » en Syne géant, un énorme bouton noir qui « respire », et à droite UNE
// colonne étroite de liens à filets (qui glissent au survol). Dessous, une fine bande noire : coordonnées et horaires en lignes. Aucune carte. Syne et Hanken Grotesk.
const accroch = identite({
  key: "c359", label: "Corail, noir et blanc chaud", humeur: "light",
  fond: "#ff6b57", texte: "#1b1b1f", discret: "#3a1a15", accent: "#1b1b1f", surface: "#ff8472", encre: "#1b1b1f",
  police: "font.hanken-grotesk", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#1b1b1f66",
});
const grandAccrochage = modeleV2({
  id: identifiantV2(359, "grand-accrochage"), concept: "c-359-grand-accrochage",
  name: "Grand accrochage", family: FAM,
  description: "Pour un musée : un bandeau corail XXL « Entrez dans l'œuvre. » avec un énorme bouton noir qui respire, et à droite une seule colonne étroite de liens à filets ; dessous une fine bande noire avec coordonnées et horaires.",
  tags: ["musée", "appel à l'action", "bandeau XXL", "colonne étroite", "corail", "noir", "angles droits"],
  identity: accroch,
  racine: racineDe("#1b1b1f"),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#1b1b1f", CORAIL = "#ff6b57", CREME = "#fff4ea";
    const phrase = G.geant(`<p>Entrez dans<br>l'œuvre.</p>`, { taille: [52, 160], tablette: { taille: [56, 76] }, mobile: { taille: [44, 60] }, lh: 0.96, suivi: "-0.035em", poids: "800", police: S.head, couleur: NOIR })(k, env);
    const intro = texte(k, "Collections permanentes, expositions temporaires, ateliers : la visite commence ici.", { taille: 19, couleur: NOIR, max: "440px", poids: "500" });
    const btn = souffle(bouton(k, "Préparer ma visite", "/contact", { texte: CREME, fond: NOIR, h: "88px", taille: 20, padH: "48px", survol: { backgroundColor: CREME, borderColor: NOIR, color: NOIR, transform: { y: -3 } }, focus: CREME, extra: { alignSelf: "flex-start" } }), 4200);
    const gauche = G.colonne(k, [caps(k, "Musée d'art", { couleur: NOIR, suivi: "0.26em" }), phrase, intro, btn], { poids: 3, min: "300px", gap: "22px" });
    const rang = (t, u) => lien(k, `${t}  →`, u, { taille: 18, poids: "700", couleur: NOIR, h: "58px", bloc: true, padH: "4px", survol: { color: CREME, paddingLeft: "16px", backgroundColor: NOIR }, focus: NOIR, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: NOIR } });
    const colonne = G.colonne(k, [caps(k, "Dans le musée", { couleur: NOIR }), k.col([rang("Collections", "/blog"), rang("Expositions", "/blog"), rang("Ateliers et visites", "/contact"), rang("Boutique", "/contact"), rang("Mécénat", "/contact")], { gap: "0px", width: "100%", alignItems: "stretch", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: NOIR })], { poids: 0, base: "290px", min: "250px", gap: "14px", aligne: "stretch", extra: { flexShrink: 0 } });
    const bandeau = G.bande(k, [gauche, colonne], { fond: CORAIL, gap: "48px 80px", aligne: "flex-end", padV: ["104px", "80px", "56px"], padB: ["88px", "72px", "52px"], padH: PH, nom: "Appel" });
    const infoC = G.colonne(k, [caps(k, "Nous trouver", { couleur: "#ffb3a8" }), coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: CORAIL, focus: CORAIL, taille: 15 })], { poids: 1, min: "240px", gap: "10px" });
    const infoH = G.colonne(k, [caps(k, "Horaires du musée", { couleur: "#ffb3a8" }), horaires(k, { couleur: "#ffffff", taille: 15 })], { poids: 1, min: "240px", gap: "10px" });
    const fine = G.bande(k, [infoC, infoH], { fond: NOIR, gap: "28px 64px", aligne: "flex-start", padV: ["40px", "32px", "28px"], padB: ["8px", "8px", "4px"], padH: PH, nom: "Infos" });
    return [G.racine(k, [bandeau, fine, mentionsBande(G, k, env, NOIR, { couleur: "#d6d0cc", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-360 « Rail de cimaise » — fondation d'art (archétype D : barre unique compacte)
// Inspiration : le pied tout en une ligne (logo, liens, réseaux) sous l'illustration de la capture 24 : ici TOUT tient sur une barre pierre de deux lignes. Ligne 1 : point bleu qui « respire », nom en Red Hat Display,
// cinq liens en ligne qui se soulignent d'un trait épais au survol, bouton bleu « Visiter ». Ligne 2 : filet fin puis réseaux et mentions. Pierre claire, noir, bleu outremer. Red Hat Display et Newsreader.
const rail = identite({
  key: "c360", label: "Pierre claire, noir et bleu outremer", humeur: "light",
  fond: "#dcd8cc", texte: "#14141a", discret: "#4a4a50", accent: "#1d3a8a", surface: "#e8e5db", encre: "#14141a",
  police: "font.newsreader", titres: "font.red-hat-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#14141a66",
});
const railDeCimaise = modeleV2({
  id: identifiantV2(360, "rail-de-cimaise"), concept: "c-360-rail-de-cimaise",
  name: "Rail de cimaise", family: FAM,
  description: "Pour une fondation d'art : tout sur une barre compacte de deux lignes, nom, cinq liens soulignés au survol et bouton « Visiter » sur la première, réseaux et mentions sur la seconde. Pierre claire, noir, bleu outremer.",
  tags: ["fondation", "barre compacte", "ligne unique", "liens", "pierre", "bleu", "angles droits"],
  identity: rail,
  racine: racineDe("#dcd8cc"),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#14141a", BLEU = "#1d3a8a", PIERRE = "#dcd8cc";
    const marque = k.row([souffle(carre(k, BLEU, "14px"), 3000), texte(k, "Fondation Lumeline", { taille: 22, poids: "800", police: S.head, couleur: NOIR, lh: 1.1 })], { gap: "12px", flexWrap: "nowrap", alignItems: "center" });
    const l = (t, u) => lien(k, t, u, { taille: 17, poids: "500", couleur: NOIR, h: "56px", padH: "4px", survol: { color: BLEU, borderBottomWidth: "3px" }, focus: BLEU, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "3px", borderColor: "transparent" } });
    l("x", "/").states.hover.borderColor = BLEU;
    const liens = k.row(["Expositions|/blog", "Collections|/blog", "Soutenir|/contact", "Contact|/contact"].map((s) => { const [t, u] = s.split("|"); const n = l(t, u); n.states.hover = { ...n.states.hover, borderColor: BLEU }; return n; }), { ...gp("0px 24px"), flexWrap: "wrap", alignItems: "center" });
    const visiter = bouton(k, "Visiter", "/contact", { texte: "#ffffff", fond: BLEU, h: "48px", taille: 14, padH: "24px", survol: { backgroundColor: NOIR, borderColor: NOIR, color: "#ffffff" }, focus: NOIR });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, poids: "600", couleur: NOIR, survol: BLEU, focus: BLEU })(k, env);
    const haut = G.bande(k, [marque, visiter], { fond: PIERRE, gap: "12px 40px", aligne: "center", padV: ["40px", "32px", "28px"], padB: ["8px", "8px", "8px"], padH: PH, nom: "Marque" });
    const rangee = k.row([liens, reseaux], { ...gp("8px 40px"), justifyContent: "space-between", alignItems: "center", width: "100%" });
    const bas = G.bande(k, [trait(k, "#14141a66"), rangee], { fond: PIERRE, colonne: true, gap: "6px", padV: ["8px", "8px", "8px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Liens et réseaux" });
    return [G.racine(k, [haut, bas, mentionsBande(G, k, env, PIERRE, { couleur: "#4a4a50", liens: NOIR })])];
  },
}, FAM);

// ═══ ft2-361 « Escalier des salles » — musée (archétype L : bandes étagées de largeurs décroissantes)
// Inspiration : la silhouette en gradins (moulin, entrepôt, maison) qui monte et descend sur la ligne de la capture 23. Quatre bandes alignées à gauche qui rétrécissent comme des marches (100 %, 78 %, 56 %, 34 %) :
// nom géant sur vert forêt, liens sur vert moyen, coordonnées sur vert sauge, lettre sur vert pâle. Chaque marche sur mobile reprend toute la largeur. Newsreader et Manrope.
const escalier = identite({
  key: "c361", label: "Vert forêt, sauge et blanc d'os", humeur: "dark",
  fond: "#20231d", texte: "#f1f3e8", discret: "#c3c9b4", accent: "#d8e48f", surface: "#3a4033", encre: "#10120e", surEncre: "#f1f3e8",
  police: "font.manrope", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f1f3e855",
});
const escalierM = modeleV2({
  id: identifiantV2(361, "escalier-des-salles"), concept: "c-361-escalier-des-salles",
  name: "Escalier des salles", family: FAM,
  description: "Pour un musée : quatre bandes alignées à gauche qui rétrécissent comme des marches (nom géant, liens, coordonnées, lettre) du vert forêt au vert pâle. Newsreader, vert forêt, sauge, blanc d'os.",
  tags: ["musée", "escalier", "bandes étagées", "vert", "sauge", "newsreader", "angles droits"],
  identity: escalier,
  racine: racineDe("#e9ecdf"),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, FORET = "#20231d", MOYEN = "#3a4033", SAUGE = "#7c8a6a", PALE = "#d6dcc8", OS = "#f1f3e8", CITRON = "#d8e48f", FOND = "#e9ecdf", ENC = "#10120e";
    const marche = (larg, fond, enfants, extra) => k.col(enfants, { width: larg, boxSizing: "border-box", backgroundColor: fond, gap: "20px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "48px", paddingRight: "40px", alignItems: "flex-start", ...(extra || {}) }, { width: larg, paddingLeft: "32px", paddingRight: "28px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const nom = G.geant(`<p>Les Salles<br>du Levant.</p>`, { taille: [48, 120], tablette: { taille: [64, 100] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.02em", poids: "400", police: S.head, couleur: OS })(k, env);
    const resa = souffle(bouton(k, "Préparer ma visite", "/contact", { texte: FORET, fond: CITRON, h: "56px", survol: { backgroundColor: OS, borderColor: OS, color: FORET, transform: { y: -3 } }, focus: OS }), 4200);
    const m1 = marche("100%", FORET, [caps(k, "Musée des arts", { couleur: CITRON, suivi: "0.26em" }), nom, resa], { paddingTop: "88px", paddingBottom: "72px" });
    const lc = (t, u) => lien(k, t, u, { taille: 18, poids: "600", couleur: OS, soulign: false, h: "48px", padH: "4px", survol: { color: CITRON, transform: { x: 6 } }, focus: CITRON });
    const m2 = marche("78%", MOYEN, [k.row([lc("Collections", "/blog"), lc("Expositions", "/blog"), lc("Visites et ateliers", "/contact"), lc("Boutique", "/contact"), lc("Mécénat", "/contact")], { ...gp("0px 32px"), flexWrap: "wrap" })], { paddingTop: "28px", paddingBottom: "28px" });
    const m3 = marche("56%", SAUGE, [caps(k, "Nous trouver", { couleur: ENC }), coordonnees(k, { couleur: ENC, lien: ENC, survol: OS, focus: ENC, taille: 16 })], { paddingTop: "32px", paddingBottom: "32px" });
    const abo = abonnement(k, env, { titre: "La lettre du musée", intro: "Expositions et rencontres, de temps en temps.", bouton: "Je m'abonne", largeur: "300px", accent: FORET, texte: ENC, titreCouleur: FORET, introCouleur: "#2c3226", boutonTexte: OS, boutonSurvol: { backgroundColor: SAUGE, color: ENC } });
    const m4 = marche("34%", PALE, [abo], { paddingTop: "28px", paddingBottom: "28px", minWidth: "340px", color: ENC });
    return [G.racine(k, [m1, m2, m3, m4, mentionsBande(G, k, env, FOND, { couleur: "#3a4033", liens: ENC })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Galeries et musées", target: 6, built: true,
  description: "Pieds de galeries, musées et centres d'art, angles droits, animations fluides : galerie contemporaine, musée, centre d'art, fondation.",
  models: [cimaiseM, cartel, damier, grandAccrochage, railDeCimaise, escalierM],
};
