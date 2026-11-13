// Famille v2 « Musique et spectacle » — 6 modèles (ft2-350 à ft2-355), inspirés des captures d'inspiration 22, 23 et 24 : ANGLES DROITS partout, marques fictives, aucune coordonnée ni chiffre inventé.
// Les coordonnées et horaires viennent des Données de l'entreprise du site ; libellés de programme et adresses de réseaux = exemples à renommer.
// Mouvement (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, UNE animation visible par modèle (carré ou bouton qui « respire », ligne qui s'indente), pas d'animation d'entrée.
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

const FAM = "musique-spectacle";

// ═══ ft2-350 « Programme de salle » — maison de musique (archétype G : index en lignes pleine largeur)
// Inspiration : la liste de régions à filets de la capture 23 (lignes pleine largeur) et le fond nuit de la capture 24. Noir velours et or : six grandes lignes de programme (grand serif Bodoni, filet or),
// chaque ligne s'indente et se remplit d'or au survol. Un petit carré d'or « respire » devant « À l'affiche ». Pas de colonnes, pas de cartes.
const velours = identite({
  key: "c350", label: "Noir velours et or", humeur: "dark",
  fond: "#100d0a", texte: "#f4ead6", discret: "#b9ac95", accent: "#d9a441", surface: "#1a1612", encre: "#100d0a", surEncre: "#f4ead6",
  police: "font.hanken-grotesk", titres: "font.bodoni-moda",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#d9a44166",
});
const programmeDeSalle = modeleV2({
  id: identifiantV2(350, "programme-de-salle"), concept: "c-350-programme-de-salle",
  name: "Programme de salle", family: FAM,
  description: "Pour une maison de musique : six grandes lignes de programme en serif sur filets d'or, qui s'indentent et se remplissent d'or au survol ; titre et bouton de réservation à gauche, coordonnées dessous. Noir velours et or.",
  tags: ["salle de concert", "musique", "programme", "index", "billetterie", "noir", "or", "angles droits"],
  identity: velours,
  racine: racineDe("#100d0a"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, OR = "#d9a441", NOIR = "#100d0a", IVOIRE = "#f4ead6";
    const marque = k.row([souffle(carre(k, OR, "12px"), 3000), caps(k, "À l'affiche", { couleur: OR, suivi: "0.28em" })], { gap: "12px", flexWrap: "nowrap" });
    const titre = G.geant(`<p>La saison<br>au programme.</p>`, { taille: [44, 80], tablette: { taille: [56, 72] }, mobile: { taille: [40, 52] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: IVOIRE })(k, env);
    const grosBtn = souffle(bouton(k, "Réserver une place", "/contact", { texte: NOIR, fond: OR, h: "64px", taille: 16, padH: "32px", survol: { backgroundColor: IVOIRE, borderColor: IVOIRE, color: NOIR, transform: { y: -3 } }, focus: IVOIRE, extra: { alignSelf: "flex-start" } }), 5000);
    const gauche = G.colonne(k, [marque, titre, grosBtn, k.col([], { height: "12px" }), caps(k, "Nous trouver", { couleur: OR }), coordonnees(k, { couleur: IVOIRE, lien: IVOIRE, survol: OR, focus: OR })], { poids: 1, min: "280px", gap: "22px" });
    const ligneP = (num, nom, url, bordG) => lien(k, `${num}   ${nom}  →`, url, { taille: 34, poids: "400", police: S.head, couleur: IVOIRE, h: "96px", bloc: true, padH: "16px", lh: 1.1, survol: { backgroundColor: OR, color: NOIR, paddingLeft: "32px" }, focus: IVOIRE, extra: { flexGrow: 1, flexBasis: "260px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderLeftWidth: bordG ? "1px" : "0px", borderColor: "#d9a44199" } });
    const paire = (a, b) => k.row([ligneP(...a, false), ligneP(...b, true)], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const liste = k.col([paire(["01", "Concerts", "/blog"], ["02", "Saison", "/faq"]), paire(["03", "Billetterie", "/contact"], ["04", "Résidences", "/blog"]), paire(["05", "Salle et accès", "/contact"], ["06", "Presse", "/contact"])], { gap: "0px", width: "100%", alignItems: "stretch", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#d9a44199" });
    const droite = G.colonne(k, [liste], { poids: 2, min: "300px", aligne: "stretch" });
    const milieu = G.bande(k, [gauche, droite], { fond: NOIR, gap: "40px 72px", aligne: "flex-start", padV: ["88px", "64px", "44px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Programme" });
    return [G.racine(k, [milieu, mentionsBande(G, k, env, NOIR, { couleur: "#b9ac95", liens: IVOIRE })])];
  },
}, FAM);

// ═══ ft2-351 « Rideau rouge » — théâtre (archétype E : deux demi-pages bord à bord)
// Inspiration : la bande de marque + bouton d'action de la capture 22, retournée en deux panneaux. À gauche, un rideau bordeaux (grand « Le rideau se lève. » en gras Abril, lettre d'information) ;
// à droite, un panneau crème avec un énorme bouton de réservation qui « respire », quatre liens à filets et les horaires de billetterie. Mobile : le rideau puis le panneau crème.
const rideau = identite({
  key: "c351", label: "Bordeaux et crème", humeur: "light",
  fond: "#f4ecdd", texte: "#2a0d10", discret: "#5e4a4a", accent: "#a3182b", surface: "#ebe0cc", encre: "#7d0f1f",
  police: "font.albert-sans", titres: "font.abril-fatface",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#2a0d1055",
});
const rideauRouge = modeleV2({
  id: identifiantV2(351, "rideau-rouge"), concept: "c-351-rideau-rouge",
  name: "Rideau rouge", family: FAM,
  description: "Pour un théâtre : deux demi-pages bord à bord. Rideau bordeaux avec « Le rideau se lève. » et la lettre d'information ; panneau crème avec un énorme bouton de réservation, liens à filets et horaires de billetterie.",
  tags: ["théâtre", "spectacle vivant", "réservation", "deux panneaux", "bordeaux", "crème", "horaires", "angles droits"],
  identity: rideau,
  racine: racineDe("#f4ecdd"),
  widgets: ["text", "link", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BORD = "#7d0f1f", BORD2 = "#5f0b17", CREME = "#f4ecdd", ROSE = "#f0c9ce";
    const plis = k.row([0, 1, 2, 3, 4, 5, 6].map((i) => k.col([], { flexGrow: 1, flexBasis: "0px", height: "14px", backgroundColor: i % 2 ? BORD2 : "#8e1426", borderRadius: "0px" })), { gap: "0px", width: "100%", flexWrap: "nowrap", alignItems: "stretch" });
    const phrase = G.geant(`<p>Le rideau<br>se lève.</p>`, { taille: [52, 120], tablette: { taille: [72, 100] }, mobile: { taille: [48, 64] }, lh: 1.0, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const abo = abonnement(k, env, { titre: "La lettre du théâtre", intro: "Nouveaux spectacles, reprises, rencontres : un message de temps en temps.", bouton: "Je m'abonne", largeur: "380px", accent: CREME, texte: CREME, titreCouleur: ROSE, introCouleur: "#f1dcdc", boutonTexte: BORD, boutonSurvol: { backgroundColor: ROSE, color: BORD2 } });
    const gauche = G.colonne(k, [plis, k.col([caps(k, "Théâtre et spectacle vivant", { couleur: ROSE, suivi: "0.24em" }), phrase, abo], { gap: "28px", alignItems: "flex-start", paddingTop: "40px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "40px", boxSizing: "border-box", width: "100%" }, { paddingLeft: "32px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px", paddingBottom: "48px" })], { poids: 1, min: "340px", gap: "0px", aligne: "stretch", extra: { backgroundColor: BORD } });
    const reserver = souffle(bouton(k, "Réserver une place", "/contact", { texte: CREME, fond: BORD, h: "84px", taille: 20, padH: "40px", survol: { backgroundColor: "#2a0d10", borderColor: "#2a0d10", color: CREME, transform: { y: -3 } }, focus: "#2a0d10", extra: { alignSelf: "stretch" } }), 4200);
    const rang = (t, u) => lien(k, t, u, { taille: 20, poids: "600", police: S.head, couleur: "#2a0d10", h: "58px", bloc: true, padH: "4px", survol: { color: BORD, paddingLeft: "16px" }, focus: BORD, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#2a0d1055" } });
    const liens = k.col([rang("Le programme", "/blog"), rang("Abonnements et tarifs", "/faq"), rang("Groupes et scolaires", "/contact"), rang("Accès et accessibilité", "/contact")], { gap: "0px", width: "100%", alignItems: "stretch" });
    const droite = G.colonne(k, [caps(k, "Venir au spectacle", { couleur: BORD }), reserver, liens, caps(k, "Horaires de la billetterie", { couleur: BORD }), horaires(k, { couleur: "#2a0d10", taille: 16 })], { poids: 1, min: "340px", gap: "20px", aligne: "stretch", extra: { paddingTop: "56px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", backgroundColor: CREME }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" } });
    const deux = G.bande(k, [gauche, droite], { fond: CREME, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Deux panneaux" });
    return [G.racine(k, [deux, mentionsBande(G, k, env, CREME, { couleur: "#5e4a4a", liens: "#2a0d10" })])];
  },
}, FAM);

// ═══ ft2-352 « Console de mixage » — studio / club de musiques actuelles (archétype K : fenêtre-console)
// Inspiration : le texte discret en notes et l'atmosphère nuit de la capture 24. Le pied est une FENÊTRE : barre de titre à trois carrés, liste de commandes « > Programme » qui s'allument au survol,
// invite de commande avec curseur vert qui « respire », formulaire de lettre. Mono IBM Plex et JetBrains, noir graphite et vert phosphore.
const phosphore = identite({
  key: "c352", label: "Graphite et vert phosphore", humeur: "dark",
  fond: "#0f1115", texte: "#d8e1d6", discret: "#93a39a", accent: "#6dff9a", surface: "#171a20", encre: "#0f1115", surEncre: "#d8e1d6",
  police: "font.ibm-plex-mono", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#6dff9a44",
});
const consoleDeMixage = modeleV2({
  id: identifiantV2(352, "console-de-mixage"), concept: "c-352-console-de-mixage",
  name: "Console de mixage", family: FAM,
  description: "Pour un club de musiques actuelles : le pied est une fenêtre de console, barre de titre à trois carrés, commandes qui s'allument au survol, curseur vert qui respire, lettre d'information et coordonnées. Mono, graphite et vert.",
  tags: ["club", "musiques actuelles", "console", "fenêtre", "mono", "graphite", "vert", "angles droits"],
  identity: phosphore,
  racine: racineDe("#0f1115"),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, VERT = "#6dff9a", GRAPH = "#0f1115", PANNEAU = "#171a20", BORD = "#2f4a3a";
    const titreBarre = k.row([k.row([carre(k, VERT, "12px"), carre(k, "#93a39a", "12px"), carre(k, "#3a4650", "12px")], { gap: "6px", flexWrap: "nowrap" }), caps(k, "console / programme de la salle", { couleur: S.mute, suivi: "0.06em", poids: "500", taille: "13px" })], { gap: "16px", flexWrap: "nowrap", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: BORD, width: "100%", boxSizing: "border-box", backgroundColor: "#1d2127" });
    const cmd = (t, u) => lien(k, `> ${t}`, u, { taille: 17, poids: "500", couleur: S.fg, h: "46px", bloc: true, padH: "10px", survol: { backgroundColor: "#1f2a22", color: VERT, paddingLeft: "22px" }, focus: VERT, extra: { width: "100%", boxSizing: "border-box" } });
    const invite = k.row([texte(k, "salle@scène:~$ ls programme", { taille: 15, couleur: VERT }), souffle(carre(k, VERT, "10px"), 1600)], { gap: "8px", flexWrap: "nowrap", alignItems: "center" });
    const cellule = (t, u) => lien(k, `> ${t}`, u, { taille: 16, poids: "500", couleur: S.fg, h: "52px", bloc: true, padH: "14px", survol: { backgroundColor: "#1f2a22", color: VERT }, focus: VERT, extra: { flexGrow: 1, flexBasis: "180px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "2px", borderColor: BORD } });
    const onglets = k.row([cellule("Concerts", "/blog"), cellule("Résidences", "/contact"), cellule("Billetterie", "/contact"), cellule("Infos pratiques", "/faq"), cellule("Presse", "/contact")], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: BORD });
    const abo = abonnement(k, env, { titre: "$ subscribe --lettre", intro: "Les dates, les premières parties et les soirées à venir.", bouton: "Envoyer", largeur: "380px", accent: VERT, texte: S.fg, titreCouleur: VERT, introCouleur: S.mute, boutonTexte: GRAPH, boutonSurvol: { backgroundColor: S.fg, color: GRAPH } });
    const coord = G.colonne(k, [caps(k, "# coordonnées", { couleur: VERT, taille: "13px", poids: "500" }), coordonnees(k, { couleur: S.fg, lien: S.fg, survol: VERT, focus: VERT, taille: 14 })], { poids: 1, min: "260px", gap: "12px" });
    const etat = k.row([G.colonne(k, [abo], { poids: 1, min: "280px" }), coord], { ...gp("28px 56px"), alignItems: "flex-start", flexWrap: "wrap", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "24px", paddingRight: "24px", boxSizing: "border-box", width: "100%" }, undefined, { paddingLeft: "14px", paddingRight: "14px" });
    const corps = k.col([k.col([invite], { paddingTop: "22px", paddingBottom: "18px", paddingLeft: "24px", paddingRight: "24px" }), onglets, etat], { gap: "0px", width: "100%" });
    const fenetre = k.col([titreBarre, corps], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "2px", borderColor: BORD, backgroundColor: PANNEAU });
    const haut = G.bande(k, [fenetre], { fond: GRAPH, colonne: true, padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Console" });
    return [G.racine(k, [haut, mentionsBande(G, k, env, GRAPH, { couleur: "#93a39a", liens: "#d8e1d6" })])];
  },
}, FAM);

// ═══ ft2-353 « Affiche en mosaïque » — festival (archétype H : mosaïque asymétrique)
// Inspiration : l'illustration monumentale de la capture 24 et ses petits objets flottants, traduits en grands aplats. Une grande case jaune (« EN SCÈNE » en Anton, billetterie, coordonnées) et trois cases empilées
// (rose, bleu électrique, blanc) qui sont des liens et se remplissent de jaune au survol. Mobile : la grande case puis les trois cases en pile.
const affiche = identite({
  key: "c353", label: "Jaune, rose et bleu électrique", humeur: "dark",
  fond: "#111111", texte: "#ffffff", discret: "#cfcfcf", accent: "#ff2e88", surface: "#1c1c1c", encre: "#111111", surEncre: "#ffffff",
  police: "font.space-grotesk", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff44",
});
const afficheFestival = modeleV2({
  id: identifiantV2(353, "affiche-en-mosaique"), concept: "c-353-affiche-en-mosaique",
  name: "Affiche en mosaïque", family: FAM,
  description: "Pour un festival : mosaïque asymétrique, une grande case jaune « EN SCÈNE » avec billetterie et coordonnées, trois cases empilées (programme, artistes, infos) rose, bleu et blanc qui virent au jaune au survol. Anton, aplats francs.",
  tags: ["festival", "concerts", "billetterie", "mosaïque", "jaune", "rose", "bleu", "angles droits"],
  identity: affiche,
  racine: racineDe("#111111"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, JAUNE = "#ffd400", NOIR = "#111111", ROSE = "#ff2e88", BLEU = "#1f3bff";
    const titre = G.geant(`<p>EN<br>SCÈNE</p>`, { taille: [96, 190], tablette: { taille: [120, 170] }, mobile: { taille: [88, 120] }, lh: 0.92, suivi: "0em", poids: "400", police: S.head, couleur: NOIR })(k, env);
    const intro = texte(k, "Trois jours de concerts, des scènes en plein air et une programmation à découvrir.", { taille: 18, couleur: NOIR, max: "420px", poids: "500" });
    const b = souffle(bouton(k, "Billetterie", "/contact", { texte: JAUNE, fond: NOIR, h: "64px", taille: 18, padH: "36px", survol: { backgroundColor: ROSE, borderColor: ROSE, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { alignSelf: "flex-start" } }), 4200);
    const grande = G.colonne(k, [caps(k, "Festival de musiques", { couleur: NOIR, suivi: "0.24em" }), titre, intro, b, coordonnees(k, { couleur: NOIR, lien: NOIR, survol: "#ffffff", focus: NOIR, taille: 15 })], { poids: 2, min: "320px", gap: "22px", extra: { backgroundColor: JAUNE, boxSizing: "border-box", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" } });
    const petite = (nom, url, fond, couleur, bord) => lien(k, `${nom}  ↗`, url, { taille: 34, poids: "400", police: S.head, casse: "uppercase", suivi: "0.02em", couleur, bloc: true, h: "150px", survol: { backgroundColor: JAUNE, color: NOIR, paddingLeft: "40px" }, focus: JAUNE, extra: { width: "100%", flexGrow: 1, boxSizing: "border-box", paddingLeft: "28px", paddingRight: "20px", paddingTop: "20px", paddingBottom: "20px", alignItems: "flex-end", backgroundColor: fond, borderStyle: "solid", borderWidth: bord ? "3px" : "0px", borderColor: "#ffffff" } });
    const pile = G.colonne(k, [petite("Programme", "/blog", ROSE, NOIR), petite("Artistes", "/blog", BLEU, "#ffffff"), petite("Infos pratiques", "/faq", NOIR, "#ffffff", true)], { poids: 1, min: "280px", gap: "0px", aligne: "stretch", extra: { flexBasis: "320px" } });
    const mosaique = G.bande(k, [grande, pile], { fond: NOIR, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Mosaïque" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["Spotify", "https://open.spotify.com/"]], { taille: 15, poids: "700", couleur: "#ffffff", survol: JAUNE, focus: JAUNE })(k, env);
    const reseauBande = G.bande(k, [reseaux], { fond: NOIR, colonne: true, padV: ["24px", "20px", "16px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Réseaux" });
    return [G.racine(k, [mosaique, reseauBande, mentionsBande(G, k, env, NOIR, { couleur: "#cfcfcf", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-354 « Saison en frise » — orchestre / saison culturelle (archétype I : frise à points carrés)
// Inspiration : la silhouette horizontale posée sur une ligne de la capture 23 (moulin, entrepôt, camion, maison alignés sur un trait) : ici quatre étapes (automne, hiver, printemps, été) alignées sur un trait marine,
// chacune marquée d'un point carré orange (le premier « respire ») et d'un lien de programme qui glisse au survol. Aucune date inventée. Fraunces et Public Sans, gris bleuté clair.
const frise = identite({
  key: "c354", label: "Gris bleuté, marine et orange", humeur: "light",
  fond: "#e9eef2", texte: "#14213d", discret: "#4a5a73", accent: "#a23304", surface: "#dbe3ea", encre: "#14213d",
  police: "font.public-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#14213d55",
});
const saisonEnFrise = modeleV2({
  id: identifiantV2(354, "saison-en-frise"), concept: "c-354-saison-en-frise",
  name: "Saison en frise", family: FAM,
  description: "Pour un orchestre ou une saison culturelle : une frise horizontale en quatre temps (automne, hiver, printemps, été) sur un trait marine, points carrés orange, liens de programme qui glissent. Gris bleuté, marine, orange.",
  tags: ["orchestre", "saison", "frise", "chronologie", "programme", "marine", "orange", "angles droits"],
  identity: frise,
  racine: racineDe("#dbe3ea"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, MAR = "#14213d", ORA = "#a23304", CLAIR = "#e9eef2", SURF = "#dbe3ea";
    const titre = G.geant(`<p>La saison en<br>quatre temps.</p>`, { taille: [44, 92], tablette: { taille: [64, 84] }, mobile: { taille: [40, 56] }, lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: MAR })(k, env);
    const prog = bouton(k, "Voir le programme", "/blog", { texte: CLAIR, fond: MAR, survol: { backgroundColor: ORA, borderColor: ORA, color: "#ffffff", transform: { y: -3 } }, focus: ORA });
    const tete = G.bande(k, [G.colonne(k, [caps(k, "Orchestre et chœur", { couleur: ORA, suivi: "0.22em" }), titre], { poids: 3, min: "300px", gap: "16px" }), prog], { fond: CLAIR, gap: "28px 48px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["56px", "48px", "36px"], padH: PH, nom: "Titre" });
    const etape = (i, saison, nom, url) => {
      const point = i === 0 ? souffle(carre(k, ORA, "18px"), 2800) : carre(k, ORA, "18px");
      point.styles.desktop.marginTop = "-12px";
      const l = lien(k, nom, url, { taille: 21, poids: "600", police: S.head, couleur: MAR, h: "56px", bloc: true, lh: 1.2, survol: { color: ORA, paddingLeft: "10px" }, focus: ORA });
      return k.col([point, caps(k, saison, { couleur: ORA, suivi: "0.2em" }), l], { flexGrow: 1, flexBasis: "200px", minWidth: "160px", gap: "10px", alignItems: "flex-start", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: MAR, paddingTop: "0px", paddingRight: "20px" });
    };
    const rail = k.row([etape(0, "Automne", "Concerts de rentrée", "/blog"), etape(1, "Hiver", "Soirées d'hiver", "/blog"), etape(2, "Printemps", "Festival de printemps", "/blog"), etape(3, "Été", "Scènes en plein air", "/blog")], { ...gp("40px 0px"), alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const frBande = G.bande(k, [rail], { fond: CLAIR, colonne: true, padV: ["24px", "20px", "16px"], padB: ["72px", "56px", "48px"], padH: PH, nom: "Frise" });
    const coord = G.colonne(k, [caps(k, "Nous trouver", { couleur: ORA }), coordonnees(k, { couleur: MAR, lien: MAR, survol: ORA, focus: ORA })], { poids: 1, min: "260px", gap: "12px" });
    const rapide = ["Billetterie|/contact", "Accès et salle|/contact", "Presse|/contact", "Mécénat|/contact"].map((s) => { const [t, u] = s.split("|"); return lien(k, t, u, { taille: 16, poids: "700", couleur: MAR, survol: { color: ORA, transform: { x: 4 } }, focus: ORA }); });
    const liens = G.colonne(k, [caps(k, "Pratique", { couleur: ORA }), k.row(rapide, { ...gp("0px 28px"), flexWrap: "wrap" })], { poids: 2, min: "280px", gap: "8px" });
    const bas = G.bande(k, [coord, liens], { fond: SURF, gap: "28px 56px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["12px", "12px", "8px"], padH: PH, nom: "Infos" });
    return [G.racine(k, [tete, frBande, bas, mentionsBande(G, k, env, SURF, { couleur: "#4a5a73", liens: MAR })])];
  },
}, FAM);

// ═══ ft2-355 « Coulisses » — théâtre / compagnie (archétype A : colonne latérale pleine hauteur)
// Inspiration : le bloc « logo, phrase, bouton » à gauche et les colonnes de liens à droite de la capture 22. Barre verticale vert-de-gris pleine hauteur (nom, phrase, bouton ambre qui « respire », réseaux)
// et zone crème avec grande phrase, liens soulignés et lettre en boîte (la barre est à droite). Libre Caslon et Inter Tight. Mobile : la zone crème puis la barre.
const coulisses = identite({
  key: "c355", label: "Vert-de-gris, crème et ambre", humeur: "light",
  fond: "#f6f1e7", texte: "#10292b", discret: "#4b5f5f", accent: "#a14a0b", surface: "#e9e2d2", encre: "#0b3b3c",
  police: "font.inter-tight", titres: "font.libre-caslon-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#10292b55",
});
const coulissesM = modeleV2({
  id: identifiantV2(355, "coulisses"), concept: "c-355-coulisses",
  name: "Coulisses", family: FAM,
  description: "Pour une compagnie ou un théâtre : une zone crème (grande phrase, liens soulignés, lettre en boîte) et, à droite, une barre verticale vert-de-gris pleine hauteur (nom, phrase, bouton ambre, réseaux). Libre Caslon, crème, ambre.",
  tags: ["compagnie", "théâtre", "colonne latérale", "réservation", "vert-de-gris", "crème", "ambre", "angles droits"],
  identity: coulisses,
  racine: racineDe("#f6f1e7"),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, TEAL = "#0b3b3c", CREME = "#f6f1e7", AMBRE = "#f2b45a", ENCRE = "#10292b", MARRON = "#a14a0b";
    const nom = G.geant(`<p>Les<br>Coulisses</p>`, { taille: [44, 64], tablette: { taille: [48, 64] }, mobile: { taille: [44, 52] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const phrase = texte(k, "Du texte, de la musique, des corps en scène : une maison pour les créations.", { taille: 17, couleur: "#cfe0dc", max: "300px" });
    const resa = souffle(bouton(k, "Réserver", "/contact", { texte: TEAL, fond: AMBRE, survol: { backgroundColor: CREME, borderColor: CREME, color: TEAL, transform: { y: -3 } }, focus: CREME }), 4200);
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 15, poids: "600", couleur: CREME, survol: AMBRE, focus: AMBRE })(k, env);
    const barreL = G.colonne(k, [caps(k, "Compagnie et théâtre", { couleur: AMBRE, suivi: "0.22em" }), nom, phrase, resa, k.col([], { height: "16px" }), reseaux], { poids: 0, base: "340px", min: "280px", gap: "20px", justifie: "flex-start", extra: { flexShrink: 0, backgroundColor: TEAL, boxSizing: "border-box", paddingTop: "64px", paddingBottom: "64px", paddingLeft: "40px", paddingRight: "40px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px", paddingBottom: "44px" } });
    const gros = G.geant(`<p>La maison est<br>ouverte à tous.</p>`, { taille: [36, 68], tablette: { taille: [44, 60] }, mobile: { taille: [34, 44] }, lh: 1.08, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENCRE })(k, env);
    const mot = (t, u) => lien(k, t, u, { taille: 20, poids: "500", police: S.head, couleur: ENCRE, soulign: true, h: "48px", survol: { color: MARRON, paddingLeft: "6px" }, focus: MARRON });
    const mots = k.row([mot("La saison", "/blog"), mot("Jeune public", "/blog"), mot("Créations", "/blog"), mot("Billetterie", "/contact"), mot("Accès", "/contact"), mot("Mécénat", "/contact"), mot("Presse", "/contact")], { ...gp("0px 28px"), flexWrap: "wrap" });
    const abo = abonnement(k, env, { titre: "La lettre de la compagnie", intro: "Nouvelles créations et rencontres : un message de temps en temps.", bouton: "Je m'abonne", largeur: "460px", accent: MARRON, texte: ENCRE, titreCouleur: MARRON, introCouleur: "#3d4f4f", boutonTexte: "#ffffff", boutonSurvol: { backgroundColor: TEAL, color: "#ffffff" } });
    const boite = k.col([abo], { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "2px", borderColor: ENCRE, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: "#efe7d6" }, undefined, { paddingLeft: "18px", paddingRight: "18px" });
    const zone = G.colonne(k, [caps(k, "Entrez dans la maison", { couleur: MARRON, suivi: "0.22em" }), gros, mots, boite], { poids: 1, min: "340px", gap: "28px", aligne: "stretch", extra: { backgroundColor: CREME, boxSizing: "border-box", paddingTop: "64px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "48px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" } });
    const deux = G.bande(k, [zone, barreL], { fond: CREME, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Contenu et barre" });
    return [G.racine(k, [deux, mentionsBande(G, k, env, CREME, { couleur: "#4b5f5f", liens: ENCRE })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Musique et spectacle", target: 6, built: true,
  description: "Pieds de lieux de musique et de spectacle, angles droits, animations fluides : maison de musique, théâtre, club, festival, orchestre, compagnie.",
  models: [programmeDeSalle, rideauRouge, consoleDeMixage, afficheFestival, saisonEnFrise, coulissesM],
};
