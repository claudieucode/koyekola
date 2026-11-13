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
const I = require("../aides-illus-musgal");
const bandeIllus = (G, k, sc, fond, o = {}) => G.bande(k, I.illus(k, sc, o.st), { fond, colonne: true, gap: "0px", aligne: "stretch", padV: o.padV || ["0px", "0px", "0px"], padB: o.padB || ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: o.nom || "Illustration" });
const marqueW = (k, i, o, t = "64px") => k.W("html", { html: I.marque(i, o) }, { width: t, display: "block", fontSize: "0px", lineHeight: 0.8, flexShrink: 0 });
const colLiens = (G, k, titre, liste, o = {}) => G.colonne(k, [caps(k, titre, { couleur: o.titre, suivi: "0.16em" }), ...liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: "500", couleur: o.couleur, h: "44px", survol: o.survol, focus: o.focus }))], { poids: 1, min: o.min || "170px", gap: "2px" });
const rangLien = (k, t, u, o) => lien(k, `${t}  →`, u, { taille: o.taille || 18, poids: o.poids || "600", police: o.police, couleur: o.couleur, h: "58px", bloc: true, padH: "6px", survol: o.survol, focus: o.focus, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: o.filet } });

// ═══ ft2-350 « Programme de salle » — maison de musique. Parti pris de la capture 24 : fond noir profond, grand objet lumineux au centre (ici un disque vinyle doré, arcs roses, objets flottants), puis marque et quatre colonnes de liens.
const velours = identite({
  key: "c350", label: "Noir velours et or", humeur: "dark",
  fond: "#100d0a", texte: "#f4ead6", discret: "#b9ac95", accent: "#d9a441", surface: "#1a1612", encre: "#100d0a", surEncre: "#f4ead6",
  police: "font.hanken-grotesk", titres: "font.bodoni-moda",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#d9a44166",
});
const programmeDeSalle = modeleV2({
  id: identifiantV2(350, "programme-de-salle"), concept: "c-350-programme-de-salle",
  name: "Programme de salle", family: FAM,
  description: "Pour une maison de musique : un grand disque vinyle doré qui rayonne sur noir velours, avec arcs lumineux et objets flottants, puis la marque, un bouton de réservation et quatre colonnes de liens. Noir velours et or.",
  tags: ["salle de concert", "musique", "vinyle", "illustration", "billetterie", "noir", "or", "angles droits"],
  identity: velours,
  racine: racineDe("#100d0a"),
  widgets: ["text", "link", "bizcontact", "html", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, OR = "#d9a441", NOIR = "#100d0a", IV = "#f4ead6";
    const haut = bandeIllus(G, k, "s350", NOIR, { padV: ["40px", "24px", "8px"], padB: ["0px", "0px", "0px"], nom: "Disque" });
    const marque = k.row([marqueW(k, 0, { fond: NOIR, trait: OR, accent: IV }), texte(k, "Maison Aria", { taille: 28, police: S.head, couleur: IV, lh: 1.1 })], { gap: "14px", flexWrap: "nowrap", alignItems: "center" });
    const btn = souffle(bouton(k, "Réserver une place", "/contact", { texte: NOIR, fond: OR, h: "56px", survol: { backgroundColor: IV, borderColor: IV, color: NOIR, transform: { y: -3 } }, focus: IV }), 4800);
    const gauche = G.colonne(k, [marque, texte(k, "Concerts, résidences et rencontres : la saison de la maison se lit ici.", { taille: 16, couleur: "#d6cbb6", max: "340px" }), btn], { poids: 2, min: "280px", gap: "20px" });
    const coord = G.colonne(k, [caps(k, "Nous trouver", { couleur: OR, suivi: "0.16em" }), coordonnees(k, { couleur: IV, lien: IV, survol: OR, focus: OR, taille: 15 })], { poids: 1, min: "220px", gap: "10px" });
    gauche.children.push(coord);
    const ligneP = (num, nom, url, bordG) => lien(k, `${num}   ${nom}  →`, url, { taille: 30, poids: "400", police: S.head, couleur: IV, h: "88px", bloc: true, padH: "16px", lh: 1.1, survol: { backgroundColor: OR, color: NOIR, paddingLeft: "32px" }, focus: IV, extra: { flexGrow: 1, flexBasis: "240px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderLeftWidth: bordG ? "1px" : "0px", borderColor: "#d9a44199" } });
    const paire = (x, y) => k.row([ligneP(...x, false), ligneP(...y, true)], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const liste = k.col([paire(["01", "Concerts", "/blog"], ["02", "Saison", "/blog"]), paire(["03", "Billetterie", "/contact"], ["04", "Résidences", "/blog"]), paire(["05", "Salle et accès", "/contact"], ["06", "Presse", "/contact"])], { gap: "0px", width: "100%", alignItems: "stretch", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#d9a44199" });
    const corps = G.bande(k, [gauche, G.colonne(k, [liste], { poids: 2, min: "300px", aligne: "stretch" })], { fond: NOIR, gap: "40px 64px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Programme" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["Spotify", "https://open.spotify.com/"]], { taille: 15, poids: "600", couleur: IV, survol: OR, focus: OR })(k, env);
    const bas = G.bande(k, [trait(k, "#d9a44166"), reseaux], { fond: NOIR, colonne: true, gap: "8px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Réseaux" });
    return [G.racine(k, [haut, corps, bas, mentionsBande(G, k, env, NOIR, { couleur: "#b9ac95", liens: IV })])];
  },
}, FAM);

// ═══ ft2-351 « Rideau rouge » — théâtre. Parti pris de la capture 22 : fond clair, marque + phrase + bouton à gauche, colonnes de liens à droite, grande scène PEINTE pleine largeur en bas (ici la scène, rideaux, projecteurs, public).
const rideau = identite({
  key: "c351", label: "Bordeaux et crème", humeur: "light",
  fond: "#f4ecdd", texte: "#2a0d10", discret: "#5e4a4a", accent: "#a3182b", surface: "#ebe0cc", encre: "#7d0f1f",
  police: "font.albert-sans", titres: "font.abril-fatface",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#2a0d1055",
});
const rideauRouge = modeleV2({
  id: identifiantV2(351, "rideau-rouge"), concept: "c-351-rideau-rouge",
  name: "Rideau rouge", family: FAM,
  description: "Pour un théâtre : marque, phrase, bouton de réservation et lettre d'information à gauche, colonnes de liens et horaires à droite, puis une grande scène illustrée pleine largeur (rideaux bordeaux, projecteurs, silhouettes, public). Bordeaux et crème.",
  tags: ["théâtre", "spectacle vivant", "réservation", "illustration", "scène", "bordeaux", "crème", "angles droits"],
  identity: rideau,
  racine: racineDe("#f4ecdd"),
  widgets: ["text", "link", "bizhours", "emailsubscribe", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BORD = "#7d0f1f", CREME = "#f4ecdd", ENC = "#2a0d10";
    const marque = k.row([marqueW(k, 1, { fond: BORD, trait: CREME, accent: "#e6b34a" }), texte(k, "Théâtre du Rideau", { taille: 28, police: S.head, couleur: BORD, lh: 1.1 })], { gap: "14px", flexWrap: "nowrap", alignItems: "center" });
    const btn = souffle(bouton(k, "Réserver une place", "/contact", { texte: CREME, fond: BORD, h: "60px", survol: { backgroundColor: ENC, borderColor: ENC, color: CREME, transform: { y: -3 } }, focus: ENC }), 4200);
    const abo = abonnement(k, env, { titre: "La lettre du théâtre", intro: "Nouveaux spectacles et rencontres : un message de temps en temps.", bouton: "Je m'abonne", largeur: "340px", accent: BORD, texte: ENC, titreCouleur: BORD, introCouleur: "#5e4a4a", boutonTexte: CREME, boutonSurvol: { backgroundColor: ENC, color: CREME } });
    const boite = k.col([abo], { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "2px", borderColor: ENC, paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: "#ebe0cc" });
    const gauche = G.colonne(k, [marque, texte(k, "Le rideau se lève : théâtre, musique et spectacle vivant toute la saison.", { taille: 17, couleur: ENC, max: "360px" }), btn, boite], { poids: 2, min: "300px", gap: "20px" });
    const rang = (t, u) => rangLien(k, t, u, { taille: 20, poids: "600", police: S.head, couleur: ENC, survol: { color: BORD, paddingLeft: "16px" }, focus: BORD, filet: "#2a0d1055" });
    const liens = k.col([rang("Le programme", "/blog"), rang("Abonnements et tarifs", "/faq"), rang("Groupes et scolaires", "/contact"), rang("Accès et accessibilité", "/contact")], { gap: "0px", width: "100%", alignItems: "stretch" });
    const droite = G.colonne(k, [caps(k, "Venir au spectacle", { couleur: BORD, suivi: "0.16em" }), liens, caps(k, "Horaires de la billetterie", { couleur: BORD, suivi: "0.16em" }), horaires(k, { couleur: ENC, taille: 15 })], { poids: 2, min: "320px", gap: "14px", aligne: "stretch" });
    const texteB = G.bande(k, [gauche, droite], { fond: CREME, gap: "36px 72px", aligne: "flex-start", padV: ["72px", "56px", "40px"], padB: ["56px", "44px", "32px"], padH: PH, nom: "Texte" });
    return [G.racine(k, [bandeIllus(G, k, "s351", CREME, { nom: "Scène" }), texteB, mentionsBande(G, k, env, "#14070a", { couleur: "#d9c3c6", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-352 « Console de mixage » — club. Parti pris de la capture 24 : nuit profonde, grand objet lumineux en tête (ici un soleil vert rayé sur des rangées d'égaliseur), puis invite de commande, onglets et lettre en barre d'état.
const phosphore = identite({
  key: "c352", label: "Graphite et vert phosphore", humeur: "dark",
  fond: "#0f1115", texte: "#d8e1d6", discret: "#93a39a", accent: "#6dff9a", surface: "#171a20", encre: "#0f1115", surEncre: "#d8e1d6",
  police: "font.ibm-plex-mono", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#6dff9a44",
});
const consoleDeMixage = modeleV2({
  id: identifiantV2(352, "console-de-mixage"), concept: "c-352-console-de-mixage",
  name: "Console de mixage", family: FAM,
  description: "Pour un club de musiques actuelles : un soleil vert lumineux sur des rangées d'égaliseur en tête de pied, puis invite de commande, cinq onglets qui s'allument, lettre d'information et coordonnées. Mono, graphite et vert phosphore.",
  tags: ["club", "musiques actuelles", "égaliseur", "illustration", "mono", "graphite", "vert", "angles droits"],
  identity: phosphore,
  racine: racineDe("#0f1115"),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, VERT = "#6dff9a", GRAPH = "#0f1115", BORD = "#2f4a3a";
    const haut = bandeIllus(G, k, "s352", GRAPH, { padV: ["32px", "20px", "8px"], nom: "Soleil" });
    const invite = k.row([texte(k, "salle@scène:~$ ls programme", { taille: 15, couleur: VERT }), souffle(carre(k, VERT, "10px"), 1600)], { gap: "8px", flexWrap: "nowrap", alignItems: "center" });
    const cellule = (t, u) => lien(k, `> ${t}`, u, { taille: 16, poids: "500", couleur: S.fg, h: "52px", bloc: true, padH: "14px", survol: { backgroundColor: "#1f2a22", color: VERT }, focus: VERT, extra: { flexGrow: 1, flexBasis: "180px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "2px", borderColor: BORD } });
    const onglets = k.row([cellule("Concerts", "/blog"), cellule("Résidences", "/contact"), cellule("Billetterie", "/contact"), cellule("Infos pratiques", "/faq"), cellule("Presse", "/contact")], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderBottomWidth: "2px", borderColor: BORD });
    const abo = abonnement(k, env, { titre: "$ subscribe --lettre", intro: "Les dates, les premières parties et les soirées à venir.", bouton: "Envoyer", largeur: "380px", accent: VERT, texte: S.fg, titreCouleur: VERT, introCouleur: S.mute, boutonTexte: GRAPH, boutonSurvol: { backgroundColor: S.fg, color: GRAPH } });
    const coord = G.colonne(k, [caps(k, "# coordonnées", { couleur: VERT, taille: "13px", poids: "500" }), coordonnees(k, { couleur: S.fg, lien: S.fg, survol: VERT, focus: VERT, taille: 14 })], { poids: 1, min: "260px", gap: "12px" });
    const etat = k.row([G.colonne(k, [abo], { poids: 1, min: "280px" }), coord], { ...gp("28px 56px"), alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [invite, onglets, etat], { fond: GRAPH, colonne: true, gap: "24px", padV: ["28px", "24px", "20px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Console" });
    return [G.racine(k, [haut, corps, mentionsBande(G, k, env, GRAPH, { couleur: "#93a39a", liens: "#d8e1d6" })])];
  },
}, FAM);

// ═══ ft2-353 « Affiche en mosaïque » — festival. Parti pris de la capture 23 : bande claire en haut avec une ligne d'objets en silhouette posés sur un trait de sol, puis pied sombre (écusson de marque, colonnes, appel à l'action, lignes à filets).
const affiche = identite({
  key: "c353", label: "Jaune, rose et noir", humeur: "dark",
  fond: "#111111", texte: "#ffffff", discret: "#cfcfcf", accent: "#ffd400", surface: "#1c1c1c", encre: "#111111", surEncre: "#ffffff",
  police: "font.space-grotesk", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff44",
});
const afficheFestival = modeleV2({
  id: identifiantV2(353, "affiche-en-mosaique"), concept: "c-353-affiche-en-mosaique",
  name: "Affiche en mosaïque", family: FAM,
  description: "Pour un festival : une bande jaune où la scène, la grande roue, le chapiteau, les arbres et le camion se détachent en silhouette sur une ligne de sol, puis un pied noir (écusson, colonnes, billetterie, lignes à filets). Anton, jaune, rose.",
  tags: ["festival", "concerts", "silhouettes", "illustration", "billetterie", "jaune", "rose", "noir", "angles droits"],
  identity: affiche,
  racine: racineDe("#111111"),
  widgets: ["text", "link", "bizcontact", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, JAUNE = "#ffd400", NOIR = "#111111", ROSE = "#ff2e88", BL = "#ffffff";
    const haut = bandeIllus(G, k, "s353", JAUNE, { padV: ["40px", "28px", "20px"], padB: ["0px", "0px", "0px"], nom: "Silhouettes" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["Spotify", "https://open.spotify.com/"]], { taille: 15, poids: "700", couleur: BL, survol: JAUNE, focus: JAUNE })(k, env);
    const gauche = G.colonne(k, [marqueW(k, 3, { fond: NOIR, trait: JAUNE, accent: ROSE }, "96px"), texte(k, "Festival de musiques", { taille: 34, police: S.head, couleur: BL, lh: 1.1, extra: { textTransform: "uppercase" } }), reseaux], { poids: 1, min: "240px", gap: "18px" });
    const o = { titre: JAUNE, couleur: BL, survol: { color: JAUNE, textDecoration: "underline" }, focus: JAUNE };
    const coord = G.colonne(k, [caps(k, "Infos pratiques", { couleur: JAUNE }), coordonnees(k, { couleur: BL, lien: BL, survol: JAUNE, focus: JAUNE, taille: 15 })], { poids: 1, min: "230px", gap: "10px" });
    const btn = souffle(bouton(k, "Billetterie", "/contact", { texte: NOIR, fond: JAUNE, h: "56px", survol: { backgroundColor: ROSE, borderColor: ROSE, color: BL, transform: { y: -3 } }, focus: BL }), 4200);
    const appel = G.colonne(k, [texte(k, "Prêt pour la scène ?", { taille: 30, police: S.head, couleur: BL, lh: 1.1, extra: { textTransform: "uppercase" } }), texte(k, "Trois jours de concerts et de scènes en plein air.", { taille: 16, couleur: "#cfcfcf", max: "280px" }), btn], { poids: 1, min: "260px", gap: "16px" });
    const cols = G.bande(k, [gauche, colLiens(G, k, "Le festival", [["Programme", "/blog"], ["Artistes", "/blog"], ["Scènes", "/blog"]], o), coord, appel], { fond: NOIR, gap: "36px 48px", aligne: "flex-start", padV: ["64px", "48px", "40px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Colonnes" });
    const r = (t, u) => rangLien(k, t, u, { taille: 22, poids: "400", police: S.head, couleur: BL, survol: { backgroundColor: JAUNE, color: NOIR, paddingLeft: "20px" }, focus: JAUNE, filet: "#ffffff66" });
    const rows = G.bande(k, [caps(k, "Scènes et lieux", { couleur: JAUNE }), k.col([r("Grande scène", "/blog"), r("Scène des jardins", "/blog"), r("Chapiteau", "/blog"), r("Infos et accès", "/faq")], { gap: "0px", width: "100%", alignItems: "stretch", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#ffffff66" })], { fond: NOIR, colonne: true, gap: "14px", padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Lieux" });
    return [G.racine(k, [haut, cols, rows, mentionsBande(G, k, env, NOIR, { couleur: "#cfcfcf", liens: BL })])];
  },
}, FAM);

// ═══ ft2-354 « Saison en frise » — orchestre. Parti pris de la capture 23 (objets en silhouette sur un trait de sol), ici une ligne d'instruments : violoncelle, harpe, pupitres, chef, piano à queue, trompette, timbales.
const frise = identite({
  key: "c354", label: "Gris bleuté, marine et orange", humeur: "light",
  fond: "#e9eef2", texte: "#14213d", discret: "#4a5a73", accent: "#a23304", surface: "#dbe3ea", encre: "#14213d",
  police: "font.public-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#14213d55",
});
const saisonEnFrise = modeleV2({
  id: identifiantV2(354, "saison-en-frise"), concept: "c-354-saison-en-frise",
  name: "Saison en frise", family: FAM,
  description: "Pour un orchestre : titre et frise des quatre saisons, puis une ligne d'instruments en silhouette (violoncelle, harpe, chef, piano, trompette, timbales) posée sur un trait marine, et un pied marine avec écusson, coordonnées et liens. Gris bleuté, marine, orange.",
  tags: ["orchestre", "saison", "frise", "instruments", "illustration", "silhouettes", "marine", "orange", "angles droits"],
  identity: frise,
  racine: racineDe("#14213d"),
  widgets: ["text", "link", "bizcontact", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, MAR = "#14213d", ORA = "#a23304", CLAIR = "#e9eef2", ORC = "#ff9a66";
    const titre = G.geant(`<p>La saison en<br>quatre temps.</p>`, { taille: [44, 92], tablette: { taille: [64, 84] }, mobile: { taille: [40, 56] }, lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: MAR })(k, env);
    const prog = bouton(k, "Voir le programme", "/blog", { texte: CLAIR, fond: MAR, survol: { backgroundColor: ORA, borderColor: ORA, color: "#ffffff", transform: { y: -3 } }, focus: ORA });
    const tete = G.bande(k, [G.colonne(k, [caps(k, "Orchestre et chœur", { couleur: ORA, suivi: "0.22em" }), titre], { poids: 3, min: "300px", gap: "16px" }), prog], { fond: CLAIR, gap: "28px 48px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Titre" });
    const etape = (i, saison, nom, url) => {
      const point = i === 0 ? souffle(carre(k, ORA, "18px"), 2800) : carre(k, ORA, "18px");
      point.styles.desktop.marginTop = "-12px";
      const l = lien(k, nom, url, { taille: 21, poids: "600", police: S.head, couleur: MAR, h: "56px", bloc: true, lh: 1.2, survol: { color: ORA, paddingLeft: "10px" }, focus: ORA });
      return k.col([point, caps(k, saison, { couleur: ORA, suivi: "0.2em" }), l], { flexGrow: 1, flexBasis: "200px", minWidth: "160px", gap: "10px", alignItems: "flex-start", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: MAR, paddingRight: "20px" });
    };
    const rail = k.row([etape(0, "Automne", "Concerts de rentrée", "/blog"), etape(1, "Hiver", "Soirées d'hiver", "/blog"), etape(2, "Printemps", "Festival de printemps", "/blog"), etape(3, "Été", "Scènes en plein air", "/blog")], { ...gp("40px 0px"), alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const frBande = G.bande(k, [rail], { fond: CLAIR, colonne: true, padV: ["24px", "20px", "16px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Frise" });
    const ill = bandeIllus(G, k, "s354", CLAIR, { nom: "Instruments" });
    const o = { titre: ORC, couleur: "#ffffff", survol: { color: ORC, textDecoration: "underline" }, focus: ORC };
    const coord = G.colonne(k, [caps(k, "Nous trouver", { couleur: ORC }), coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: ORC, focus: ORC })], { poids: 1, min: "250px", gap: "10px" });
    const marque = G.colonne(k, [marqueW(k, 4, { fond: MAR, trait: "#ffffff", accent: ORC }, "88px"), texte(k, "Orchestre et chœur", { taille: 24, police: S.head, couleur: "#ffffff", lh: 1.1 })], { poids: 1, min: "220px", gap: "14px" });
    const pied = G.bande(k, [marque, colLiens(G, k, "Saison", [["Concerts", "/blog"], ["Abonnements", "/faq"], ["Jeune public", "/blog"]], o), colLiens(G, k, "Pratique", [["Billetterie", "/contact"], ["Accès et salle", "/contact"], ["Presse", "/contact"], ["Mécénat", "/contact"]], o), coord], { fond: MAR, gap: "36px 48px", aligne: "flex-start", padV: ["40px", "36px", "32px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Pied marine" });
    return [G.racine(k, [tete, frBande, ill, pied, mentionsBande(G, k, env, MAR, { couleur: "#c8d2e4", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-355 « Coulisses » — compagnie. Parti pris de la capture 22 : paysage PEINT pleine largeur (collines, arbres, chemin, roulotte de théâtre, guirlande, panneau, enfant qui montre du doigt) dont la colline proche se prolonge dans le pied vert-de-gris.
const coulisses = identite({
  key: "c355", label: "Vert-de-gris, crème et ambre", humeur: "dark",
  fond: "#0b3b3c", texte: "#f6f1e7", discret: "#cfe0dc", accent: "#f2b45a", surface: "#0f4a4b", encre: "#0b3b3c", surEncre: "#f6f1e7",
  police: "font.inter-tight", titres: "font.libre-caslon-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f6f1e755",
});
const coulissesM = modeleV2({
  id: identifiantV2(355, "coulisses"), concept: "c-355-coulisses",
  name: "Coulisses", family: FAM,
  description: "Pour une compagnie de théâtre : un grand paysage illustré (collines, arbres, roulotte, guirlande de fanions, chemin, enfant) dont la colline se prolonge dans un pied vert-de-gris avec nom, bouton ambre, liens et lettre. Libre Caslon, vert-de-gris, crème, ambre.",
  tags: ["compagnie", "théâtre", "paysage", "illustration", "roulotte", "vert-de-gris", "crème", "ambre", "angles droits"],
  identity: coulisses,
  racine: racineDe("#0b3b3c"),
  widgets: ["text", "link", "emailsubscribe", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, TEAL = "#0b3b3c", CREME = "#f6f1e7", AMBRE = "#f2b45a";
    const haut = bandeIllus(G, k, "s355", CREME, { nom: "Paysage" });
    const marque = k.col([marqueW(k, 5, { fond: TEAL, trait: CREME, accent: AMBRE }, "72px"), G.geant(`<p>Les Coulisses</p>`, { taille: [44, 92], tablette: { taille: [56, 80] }, mobile: { taille: [40, 52] }, lh: 1.0, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME, extra: { textAlign: "center" } })(k, env)], { gap: "10px", alignItems: "center", width: "100%" });
    const resa = souffle(bouton(k, "Réserver", "/contact", { texte: TEAL, fond: AMBRE, survol: { backgroundColor: CREME, borderColor: CREME, color: TEAL, transform: { y: -3 } }, focus: CREME }), 4200);
    const mot = (t, u) => lien(k, t, u, { taille: 19, poids: "500", police: S.head, couleur: CREME, soulign: true, h: "48px", survol: { color: AMBRE, paddingLeft: "6px" }, focus: AMBRE });
    const mots = k.row([mot("La saison", "/blog"), mot("Jeune public", "/blog"), mot("Créations", "/blog"), mot("Billetterie", "/contact"), mot("Accès", "/contact"), mot("Mécénat", "/contact"), mot("Presse", "/contact")], { ...gp("0px 28px"), flexWrap: "wrap", justifyContent: "center" });
    const abo = abonnement(k, env, { titre: "La lettre de la compagnie", intro: "Nouvelles créations et rencontres : un message de temps en temps.", bouton: "Je m'abonne", largeur: "460px", accent: AMBRE, texte: CREME, titreCouleur: AMBRE, introCouleur: "#cfe0dc", boutonTexte: TEAL, boutonSurvol: { backgroundColor: CREME, color: TEAL } });
    const boite = k.col([abo], { width: "100%", maxWidth: "620px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "2px", borderColor: CREME, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 15, poids: "600", couleur: CREME, survol: AMBRE, focus: AMBRE })(k, env, true);
    const pied = G.bande(k, [marque, texte(k, "Du texte, de la musique, des corps en scène : une maison pour les créations.", { taille: 18, couleur: "#cfe0dc", max: "420px", align: "center" }), resa, mots, boite, reseaux], { fond: TEAL, colonne: true, gap: "20px", aligne: "center", padV: ["24px", "24px", "16px"], padB: ["48px", "40px", "32px"], padH: PH, nom: "Pied centré" });
    return [G.racine(k, [haut, pied, mentionsBande(G, k, env, TEAL, { couleur: "#cfe0dc", liens: CREME })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Musique et spectacle", target: 6, built: true,
  description: "Pieds de lieux de musique et de spectacle, angles droits, animations fluides : maison de musique, théâtre, club, festival, orchestre, compagnie.",
  models: [programmeDeSalle, rideauRouge, consoleDeMixage, afficheFestival, saisonEnFrise, coulissesM],
};
