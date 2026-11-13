// Famille v2 « Santé numérique et pharmacie » — 6 modèles (ft2-392 à ft2-397), famille « inspirée de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds de cabinets connectés, pharmacies, services de téléconsultation et d'espace patient. Six archétypes différents (voir DIVERSITE_STRICTE.md) : deux demi-pages (E), barre unique (D), fenêtre / console (K),
// frise en étapes (I), mosaïque asymétrique (H), escalier de bandes (L). Marques FICTIVES ; AUCUNE coordonnée, horaire, chiffre ni promesse médicale inventés : horaires, adresse et téléphone viennent des Données de
// l'entreprise du site. Les services (rendez-vous, téléconsultation, ordonnance, espace patient) sont des intitulés d'EXEMPLE à adapter ; adresses de réseaux = exemples. Aucun conseil médical n'est affiché.
//
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré qui « respire », croix de pharmacie, curseur de console, point de frise, lien qui glisse) ;
// pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const DOUX = 360; // ms : durée des transitions de survol / focus

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: typeof o.taille === "string" ? o.taille : `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: o.aligne || "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, paddingTop: o.padV, paddingBottom: o.padV, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, fontStyle: o.style, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: o.casse === undefined ? "uppercase" : o.casse, suivi: o.suivi || "0.06em", couleur: o.texte, h: o.h || "54px", padH: o.padH || "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const PH = ["48px", "32px", "20px"]; // marges latérales des bandes (bureau, tablette, mobile)
const mentions = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);
const reseaux = (G, k, env, liste, o) => G.reseauxTexte(liste, { taille: 15, poids: "700", ...o })(k, env);
const RS = [["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]];

const FAM = "sante-numerique";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-392 « Deux consultations » — archétype E (deux demi-pages bord à bord de couleurs opposées : gauche = message, droite = actions) — inspiré de la capture « Bruno » (grande phrase serif + actions)
// Idée : à gauche un panneau vert sarcelle profond avec « Se soigner, simplement. » en grand serif ; à droite un panneau crème chaud avec quatre grandes actions en rangées à flèche (la première respire doucement) qui se décalent et se teintent au survol.
// Instrument Serif (titres) et Instrument Sans (texte). Mobile : les deux panneaux s'empilent.
const deuxId = identite({
  key: "c392", label: "Sarcelle profond et crème chaud", humeur: "dark",
  fond: "#05414a", texte: "#f3fbfa", discret: "#b6d9d6", accent: "#8ff0dc", surface: "#0a525c", encre: "#05414a", surEncre: "#f3fbfa",
  police: "font.instrument-sans", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f3fbfa40",
});
const deuxConsultations = modeleV2({
  id: identifiantV2(392, "deux-consultations"), concept: "c-392-deux-consultations",
  name: "Deux consultations", family: FAM,
  description: "Pour un cabinet connecté : un liseré menthe, deux demi-pages bord à bord, un panneau sarcelle avec « Se soigner, simplement. » en grand serif, un panneau crème avec quatre actions en rangées à flèche qui se décalent au survol, horaires d'accueil, réseaux et mentions.",
  tags: ["cabinet", "téléconsultation", "deux panneaux", "grand serif", "sarcelle", "crème", "actions", "angles droits"],
  identity: deuxId,
  racine: racineDe("#05414a"),
  widgets: ["text", "link", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, SARC = "#05414a", MENTHE = "#8ff0dc", CREME = "#fff1e3", CORAIL = "#b93815";
    const phrase = G.geant(`<p>Se soigner,<br><em>simplement.</em></p>`, { taille: [52, 124], tablette: { taille: [80, 110] }, mobile: { taille: [52, 72] }, lh: 0.98, suivi: "-0.015em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    const etiquette = caps(k, "Un cabinet à portée de main", { couleur: MENTHE, suivi: "0.2em" });
    const intro = texte(k, "Un rendez-vous, un échange avec votre professionnel de santé, vos documents au même endroit.", { taille: 17, couleur: S.mute, largeur: "400px" });
    const gauche = G.colonne(k, [etiquette, phrase, intro, G.colonne(k, [caps(k, "Accueil", { couleur: MENTHE }), horaires(k, { couleur: S.fg })], { gap: "10px", aligne: "stretch" })], { poids: 1, base: "0px", min: "340px", gap: "32px", extra: { backgroundColor: SARC, paddingTop: "88px", paddingBottom: "88px", paddingLeft: "64px", paddingRight: "56px", boxSizing: "border-box", justifyContent: "space-between" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingTop: "56px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px", flexBasis: "100%" } });
    const action = ([t, u], i) => {
      const l = lien(k, `${t}  →`, u, { taille: "fluid:26-40", poids: "400", police: S.head, couleur: SARC, lh: 1.1, bloc: true, h: "84px", padH: "16px", survol: { backgroundColor: "#ffe2c4", color: CORAIL, transform: { x: 8 }, textDecoration: "none" }, focus: CORAIL, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#05414a59", backgroundColor: CREME } });
      return i === 0 ? souffle(l, 4200) : l;
    };
    const haut = G.colonne(k, [caps(k, "Je souhaite", { couleur: CORAIL, extra: { paddingBottom: "14px" } }), trait(k, SARC, "3px"), ...[["Prendre rendez-vous", "/contact"], ["Consulter à distance", "/contact"], ["Renouveler une ordonnance", "/connexion"], ["Ouvrir mon espace patient", "/connexion"]].map(action)], { gap: "0px", aligne: "stretch" });
    const basDroite = G.colonne(k, [trait(k, SARC, "1px"), k.col([G.reseauxTexte(RS, { taille: 15, poids: "700", couleur: SARC, survol: CORAIL, focus: CORAIL })(k, env)], { paddingTop: "8px" })], { gap: "12px", aligne: "stretch" });
    const droite = G.colonne(k, [haut, basDroite], { poids: 1, base: "0px", min: "340px", gap: "48px", aligne: "stretch", extra: { backgroundColor: CREME, paddingTop: "88px", paddingBottom: "88px", paddingLeft: "56px", paddingRight: "64px", boxSizing: "border-box", justifyContent: "space-between" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px", flexBasis: "100%" } });
    const corps = G.bande(k, [gauche, droite], { fond: SARC, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Deux panneaux" });
    const bas = G.bande(k, [mentions(G, k, env, { couleur: S.mute, liens: S.fg })], { fond: SARC, colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    const bandeau = G.bande(k, [souffle(carre(k, SARC, "12px"), 3200), caps(k, "Cabinet Aubépine · santé en ligne", { couleur: SARC, suivi: "0.22em" })], { fond: MENTHE, gap: "12px", aligne: "center", padV: ["16px", "14px", "14px"], padB: ["16px", "14px", "14px"], padH: PH, nom: "Bandeau" });
    return [G.racine(k, [bandeau, corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-393 « Enseigne verte » — archétype D (ligne unique type barre de navigation inversée : tout sur 1 à 2 lignes, compacte)
// Idée : une barre verte de pharmacie très compacte : croix blanche qui « respire », nom, quatre liens en capitales séparés par des filets sur UNE ligne ; une seconde ligne sombre pour les mentions. Rien d'autre.
// Barlow Semi Condensed (titres) et Barlow (texte). Pharmacie fictive « du Marché ».
const croixId = identite({
  key: "c393", label: "Vert pharmacie et jaune citron", humeur: "dark",
  fond: "#087a45", texte: "#ffffff", discret: "#d6f2e3", accent: "#f3ff8a", surface: "#066338", encre: "#04301c", surEncre: "#ffffff",
  police: "font.barlow", titres: "font.barlow-semi-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff59",
});
const enseigneVerte = modeleV2({
  id: identifiantV2(393, "enseigne-verte"), concept: "c-393-enseigne-verte",
  name: "Enseigne verte", family: FAM,
  description: "Pour une pharmacie : une barre verte très compacte, croix blanche qui respire, nom, quatre liens en capitales séparés par des filets sur une seule ligne, puis une ligne sombre pour les mentions. Vert pharmacie et jaune citron.",
  tags: ["pharmacie", "barre compacte", "une ligne", "croix", "vert", "jaune citron", "ordonnance", "angles droits"],
  identity: croixId,
  racine: racineDe("#04301c"),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, VERT = "#087a45", CITRON = "#f3ff8a", SOMBRE = "#04301c";
    const croix = souffle(k.col([k.T("<p>+</p>", { fontFamily: S.head, fontSize: "36px", fontWeight: "700", lineHeight: 1, color: VERT })], { backgroundColor: "#ffffff", width: "48px", height: "48px", alignItems: "center", justifyContent: "center", borderRadius: "0px", flexShrink: 0 }), 3000);
    const nom = k.T("<p>Pharmacie du Marché</p>", { fontFamily: S.head, fontSize: "26px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#ffffff", lineHeight: 1 });
    const marque = k.row([croix, nom], { gap: "14px", alignItems: "center", flexWrap: "nowrap" });
    const cellule = ([t, u], i) => k.col([lien(k, t, u, { taille: 15, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: "#ffffff", padH: "16px", survol: { color: CITRON, textDecoration: "underline" }, focus: CITRON })], { flexGrow: 1, flexBasis: "0px", minWidth: "150px", alignItems: "center", justifyContent: "center", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#ffffff59", borderRadius: "0px" }, undefined, { borderLeftWidth: "0px", flexBasis: "100%" });
    const liens = k.row([["Ordonnances", "/connexion"], ["Conseils", "/blog"], ["Horaires et garde", "/contact"], ["Nous écrire", "/contact"]].map(cellule), { gap: "0px", alignItems: "stretch", flexWrap: "wrap", flexGrow: 1, flexBasis: "420px" });
    const barre = G.bande(k, [marque, liens], { fond: VERT, gap: "12px 24px", aligne: "center", padV: ["28px", "24px", "28px"], padB: ["28px", "24px", "28px"], padH: PH, nom: "Barre" });
    const bas = G.bande(k, [mentions(G, k, env, { couleur: "#b9dcc8", liens: "#ffffff" })], { fond: SOMBRE, colonne: true, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [barre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-394 « Console patient » — archétype K (fenêtre / console / formulaire : le pied ressemble à un bloc d'interface)
// Idée : une fenêtre à angles droits sur fond nuit : barre de titre avec trois carrés et un nom de fichier en police mono, des commandes-liens préfixées par « > » (le curseur menthe respire), puis la lettre d'information
// en champ de formulaire, barre d'état avec les mentions. Fenêtre étroite (720 px) centrée. JetBrains Mono (titres) et Geist (texte). Service fictif « Soignio ».
const consoleId = identite({
  key: "c394", label: "Graphite et menthe", humeur: "dark",
  fond: "#0b1118", texte: "#e6edf3", discret: "#9fb0c3", accent: "#5eead4", surface: "#121b26", encre: "#0b1118", surEncre: "#e6edf3",
  police: "font.geist", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2b3b4e",
});
const consolePatient = modeleV2({
  id: identifiantV2(394, "console-patient"), concept: "c-394-console-patient",
  name: "Console patient", family: FAM,
  description: "Pour un service de santé numérique : le pied est une fenêtre à angles droits, barre de titre à trois carrés, commandes-liens en police mono, curseur menthe qui respire, lettre d'information en champ de formulaire et barre d'état. Graphite et menthe.",
  tags: ["santé numérique", "fenêtre", "console", "police mono", "graphite", "menthe", "formulaire", "angles droits"],
  identity: consoleId,
  racine: racineDe("#0b1118"),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, MENTHE = "#5eead4", TITRE = "#1a2635", BORD = "#2b3b4e";
    const barreTitre = k.row([carre(k, "#9fb0c3", "10px"), carre(k, "#9fb0c3", "10px"), carre(k, MENTHE, "10px"), k.T("<p>soignio — espace-patient — aide</p>", { fontFamily: S.head, fontSize: "13px", color: S.mute, marginLeft: "12px" })], { gap: "6px", alignItems: "center", flexWrap: "nowrap", width: "100%", boxSizing: "border-box", backgroundColor: TITRE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: BORD });
    const invite = k.T("<p>$ aide --patient <span style=\"color:#5eead4\">█</span></p>", { fontFamily: S.head, fontSize: "15px", color: MENTHE });
    souffle(invite, 2600);
    const commande = ([t, u]) => lien(k, `> ${t}`, u, { taille: 16, poids: "500", police: S.head, couleur: S.fg, h: "44px", bloc: true, survol: { color: MENTHE, transform: { x: 6 }, textDecoration: "none" }, focus: MENTHE, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#2b3b4e" } });
    const abo = abonnement(k, env, { titre: "$ lettre --abonner", intro: "Des nouvelles du service, rarement, sans publicité.", bouton: "Envoyer", largeur: "100%", accent: MENTHE, texte: S.fg, fondChamp: "#0b1118", rembChamp: "12px", policeChamp: S.head, tailleChamp: "15px", survolBouton: "#ffffff", survolTexte: "#0b1118", styleTitre: { fontFamily: S.head, color: MENTHE, fontSize: "15px", fontWeight: "500", marginBottom: "6px" } });
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderWidth: "1px", borderColor: BORD, borderBottomWidth: "1px", borderStyle: "solid" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#0b1118", fontFamily: S.head };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: S.mute };
    const corps = k.col([invite, ...[["rendez-vous", "/contact"], ["ordonnances", "/connexion"], ["messagerie-securisee", "/connexion"], ["questions-frequentes", "/faq"]].map(commande), k.col([abo], { paddingTop: "20px" })], { gap: "0px", width: "100%", boxSizing: "border-box", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "28px", paddingRight: "28px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const etat = k.col([mentions(G, k, env, { couleur: S.mute, liens: S.fg })], { width: "100%", boxSizing: "border-box", backgroundColor: TITRE, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: BORD });
    const fenetre = k.col([barreTitre, corps, etat], { gap: "0px", width: "100%", backgroundColor: "#121b26", borderStyle: "solid", borderWidth: "1px", borderColor: BORD, borderRadius: "0px" });
    const bande = G.bande(k, [fenetre], { fond: "#0b1118", colonne: true, padV: ["72px", "56px", "40px"], padB: ["40px", "32px", "24px"], padH: PH, max: "720px", nom: "Fenêtre" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-395 « Parcours de soin » — archétype I (frise horizontale en étapes, points carrés)
// Idée : sur bleu ciel clair, quatre étapes : point carré marine (le premier respire) posé sur un filet épais, titre-lien dessous. Une bande marine porte la mention d'urgence en clair, les coordonnées et les mentions.
// Les quatre étapes sont des intitulés d'EXEMPLE à adapter au vrai service. Lexend (titres) et Mulish (texte). Service fictif « Cap Santé ».
const parcoursId = identite({
  key: "c395", label: "Bleu ciel clair et marine", humeur: "light",
  fond: "#e8f1fb", texte: "#0b2a4a", discret: "#3f536b", accent: "#1458c8", surface: "#d6e6f8", encre: "#0b2a4a", surEncre: "#e8f1fb",
  police: "font.mulish", titres: "font.lexend",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#0b2a4a59",
});
const parcoursDeSoin = modeleV2({
  id: identifiantV2(395, "parcours-de-soin"), concept: "c-395-parcours-de-soin",
  name: "Parcours de soin", family: FAM,
  description: "Pour un service de santé en ligne : une frise de quatre étapes sur bleu ciel, chaque titre-lien sous un point carré et un filet épais (le premier point respire), puis une bande marine avec mention d'urgence, coordonnées et mentions.",
  tags: ["frise", "étapes", "parcours patient", "points carrés", "bleu ciel", "marine", "santé en ligne", "angles droits"],
  identity: parcoursId,
  racine: racineDe("#e8f1fb"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, MARINE = "#0b2a4a", AZUR = "#1458c8";
    const titre = k.T("<p>Votre parcours,<br>étape par étape.</p>", { fontFamily: S.head, fontSize: "fluid:30-58", lineHeight: 1.08, fontWeight: "700", color: MARINE, letterSpacing: "-0.02em" });
    const entete = titre;
    const etapes = [["Je prends rendez-vous", "/contact", "Choisissez un créneau en cabinet ou à distance."], ["Je consulte", "/contact", "Un échange avec votre professionnel de santé."], ["Je retrouve mon ordonnance", "/connexion", "Dans votre espace patient, à tout moment."], ["Je suis mon traitement", "/faq", "Conseils et questions fréquentes."]];
    const etape = ([t, u], i) => {
      const point = i === 0 ? souffle(carre(k, MARINE, "18px"), 3000) : carre(k, MARINE, "18px");
      const l = lien(k, t, u, { taille: 21, poids: "700", police: S.head, couleur: MARINE, lh: 1.25, h: "56px", bloc: true, aligne: "flex-start", padV: "14px", survol: { color: AZUR, textDecoration: "underline" }, focus: AZUR, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: MARINE } });
      return k.col([point, l], { gap: "0px", flexGrow: 1, flexBasis: "200px", minWidth: "0px", alignItems: "flex-start" });
    };
    const frise = k.row(etapes.map(etape), { rowGap: "0px", columnGap: "28px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const urgence = G.colonne(k, [caps(k, "En cas d'urgence", { couleur: "#9cc4ff" }), texte(k, "En cas d'urgence vitale, contactez immédiatement les secours. Ce site ne remplace pas un avis médical.", { taille: 15, couleur: "#ffffff", largeur: "420px" })], { poids: 1, min: "260px", gap: "8px" });
    const contact = G.colonne(k, [caps(k, "Nous écrire", { couleur: "#9cc4ff" }), coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: "#9cc4ff", focus: "#9cc4ff" })], { poids: 1, min: "260px", gap: "8px" });
    const haut = G.bande(k, [entete, frise], { fond: "#e8f1fb", colonne: true, gap: "48px", padV: ["80px", "60px", "44px"], padB: ["72px", "56px", "44px"], padH: PH, innerMobile: { rowGap: "32px" }, nom: "Frise" });
    const infos = G.bande(k, [G.ligne(k, [urgence, contact], { gap: "28px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { fond: MARINE, colonne: true, padV: ["48px", "40px", "36px"], padB: ["48px", "40px", "36px"], padH: PH, nom: "Urgence et contact" });
    const bas = G.bande(k, [mentions(G, k, env, { couleur: S.mute, liens: MARINE })], { fond: "#e8f1fb", colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, infos, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-396 « Mosaïque santé » — archétype H (mosaïque asymétrique : une grande case + trois petites)
// Idée : une grande case pêche avec « Votre santé, en clair. » et un bouton, et trois petites cases empilées : annuaire (sombre, se remplit au survol), contact (blanche) et réseaux (miel). Les cases se touchent presque (filets de 6 px).
// Young Serif (titres) et Hanken Grotesk (texte). Mobile : les cases s'empilent. Marque fictive « Clairvie ».
const mosaId = identite({
  key: "c396", label: "Pêche, ardoise et miel", humeur: "light",
  fond: "#fff7ef", texte: "#3a1208", discret: "#6a4638", accent: "#b8300f", surface: "#ffd9c7", encre: "#1f2a37", surEncre: "#ffffff",
  police: "font.hanken-grotesk", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#3a120840",
});
const mosaiqueSante = modeleV2({
  id: identifiantV2(396, "mosaique-sante"), concept: "c-396-mosaique-sante",
  name: "Mosaïque santé", family: FAM,
  description: "Pour un service de santé : une grande case pêche avec « Votre santé, en clair. » et un bouton, et trois petites cases (contact et horaires sur blanc, annuaire ardoise qui se remplit au survol, réseaux en liste sur miel). Mentions sur fond crème.",
  tags: ["mosaïque", "asymétrique", "cases", "annuaire", "pêche", "ardoise", "miel", "angles droits"],
  identity: mosaId,
  racine: racineDe("#fff7ef"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#3a1208", ROUGE = "#b8300f", ARDOISE = "#1f2a37", MIEL = "#ffe7a8", PECHE = "#ffd9c7";
    const phrase = G.geant(`<p>Votre santé,<br>en clair.</p>`, { taille: [48, 112], tablette: { taille: [72, 96] }, mobile: { taille: [48, 64] }, lh: 1.0, suivi: "-0.02em", poids: "400", police: S.head, couleur: ENCRE })(k, env);
    const b = souffle(bouton(k, "Créer mon espace", "/inscription", { texte: "#ffffff", fond: ROUGE, bord: ROUGE, survol: { backgroundColor: ENCRE, borderColor: ENCRE, color: "#ffffff", transform: { y: -3 } }, focus: ENCRE }), 4200);
    const grande = G.colonne(k, [phrase, texte(k, "Rendez-vous, documents et échanges avec vos professionnels de santé, au même endroit.", { taille: 17, couleur: ENCRE, largeur: "420px" }), trait(k, "#3a120859", "2px"), b], { poids: 1.5, base: "0px", min: "320px", gap: "28px", extra: { backgroundColor: PECHE, paddingTop: "56px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "40px", boxSizing: "border-box", justifyContent: "space-between" }, mobile: { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" } });
    const annuaire = lien(k, "Annuaire des professionnels ↗", "/blog", { taille: 24, poids: "400", police: S.head, couleur: "#ffffff", bloc: true, h: "160px", aligne: "flex-end", padH: "24px", padV: "20px", lh: 1.15, survol: { backgroundColor: "#ffffff", color: ARDOISE, textDecoration: "none", transform: { y: -3 } }, focus: ROUGE, extra: { backgroundColor: ARDOISE, flexGrow: 1, boxSizing: "border-box", width: "100%" } });
    const contact = k.col([caps(k, "Contact", { couleur: ROUGE }), horaires(k, { couleur: ENCRE, taille: 14 }), coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: ROUGE, focus: ROUGE, taille: 14 })], { backgroundColor: "#ffffff", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", gap: "10px", boxSizing: "border-box", width: "100%", borderRadius: "0px" });
    const suivre = k.col([caps(k, "Suivre Clairvie", { couleur: ROUGE }), k.col(RS.map(([t, u]) => lien(k, `${t} ↗`, u, { taille: 15, poids: "700", couleur: ENCRE, survol: { color: ROUGE, transform: { x: 4 }, textDecoration: "underline" }, focus: ROUGE })), { gap: "0px" })], { backgroundColor: MIEL, paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", gap: "6px", boxSizing: "border-box", width: "100%", borderRadius: "0px" });
    const petites = G.colonne(k, [contact, annuaire, suivre], { poids: 1, base: "0px", min: "300px", gap: "6px", aligne: "stretch" });
    const mosaique = k.row([grande, petites], { gap: "6px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const intitule = k.T("<p>Clairvie, la santé qui se simplifie.</p>", { fontFamily: S.font, fontSize: "13px", fontWeight: "800", letterSpacing: "0.16em", textTransform: "uppercase", color: ENCRE });
    const corps = G.bande(k, [intitule, trait(k, ENCRE, "2px"), mosaique], { gap: "20px", fond: "#fff7ef", colonne: true, padV: ["56px", "44px", "28px"], padB: ["32px", "28px", "20px"], padH: PH, nom: "Mosaïque" });
    const bas = G.bande(k, [mentions(G, k, env, { couleur: S.mute, liens: ENCRE })], { fond: "#fff7ef", colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-397 « Étages du cabinet » — archétype L (pied en escalier : bandes de largeurs décroissantes alignées à gauche) — inspiré de la capture « Bruno » (nom monumental)
// Idée : quatre marches violettes de plus en plus étroites et de plus en plus sombres, alignées à gauche : le nom monumental « Medilis » (lavande), les liens de service, les horaires et le contact (violet vif), les mentions (nuit).
// Le vide à droite des marches est volontaire. Sora (titres) et Onest (texte). Marque fictive « Medilis ». Mobile : toutes les marches passent à 100 %.
const etagesId = identite({
  key: "c397", label: "Lavande, violet vif et nuit", humeur: "dark",
  fond: "#140e33", texte: "#f4f1ff", discret: "#c3b9f0", accent: "#b7a4ff", surface: "#201650", encre: "#140e33", surEncre: "#f4f1ff",
  police: "font.onest", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f4f1ff40",
});
const etagesCabinet = modeleV2({
  id: identifiantV2(397, "etages-du-cabinet"), concept: "c-397-etages-du-cabinet",
  name: "Étages du cabinet", family: FAM,
  description: "Pour une plateforme de santé : quatre marches de plus en plus étroites et sombres alignées à gauche, le nom monumental sur lavande, les services, horaires et contact sur violet vif, les mentions sur nuit. Lavande, violet et nuit.",
  tags: ["escalier", "bandes", "nom monumental", "lavande", "violet", "nuit", "plateforme santé", "angles droits"],
  identity: etagesId,
  racine: racineDe("#140e33"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NUIT = "#140e33", LAV = "#ede9ff", PRUNE = "#1b1340", VIF = "#6b4fe0", MID = "#c9bdff";
    const marche = (largeur, fond, enfants, o = {}) => (o.ligne ? k.row : k.col)(enfants, { width: largeur, backgroundColor: fond, boxSizing: "border-box", paddingTop: o.pv || "36px", paddingBottom: o.pv || "36px", paddingLeft: "48px", paddingRight: "48px", ...(o.ligne ? { rowGap: "20px", columnGap: "40px", alignItems: "flex-end", justifyContent: "space-between" } : { gap: o.gap || "16px" }), borderRadius: "0px" }, { width: o.tab || "100%", paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "28px", paddingBottom: "28px" });
    const nom = G.geant(`<p>Medilis</p>`, { taille: [56, 190], tablette: { taille: [110, 160] }, mobile: { taille: [56, 80] }, lh: 0.95, suivi: "-0.04em", poids: "800", police: S.head, couleur: PRUNE })(k, env);
    const m1 = marche("100%", LAV, [nom, k.row([souffle(carre(k, PRUNE, "12px"), 3400), caps(k, "Plateforme de santé en ligne", { couleur: PRUNE, suivi: "0.22em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" })], { pv: "56px", ligne: true });
    const lienMarche = ([t, u]) => lien(k, t, u, { taille: 19, poids: "600", police: S.head, couleur: PRUNE, bloc: true, h: "48px", padH: "12px", survol: { color: "#ffffff", backgroundColor: PRUNE, textDecoration: "none", transform: { x: 4 } }, focus: PRUNE, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1b134059" } });
    const m2 = marche("78%", MID, [k.col([["Prendre rendez-vous", "/contact"], ["Téléconsultation", "/contact"], ["Ordonnances", "/connexion"], ["Espace patient", "/connexion"]].map(lienMarche), { gap: "0px", width: "100%" })], { tab: "92%", pv: "24px" });
    const bloc = (titre, enfant) => G.colonne(k, [caps(k, titre, { couleur: "#ffffff" }), enfant], { poids: 1, min: "220px", gap: "10px", aligne: "stretch" });
    const m3 = marche("56%", VIF, [bloc("Accueil", horaires(k, { couleur: "#ffffff" })), bloc("Nous joindre", coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: "#e0d8ff", focus: "#ffffff" }))], { tab: "84%", pv: "32px", ligne: true });
    const m4 = marche("34%", NUIT, [mentions(G, k, env, { couleur: S.mute, liens: S.fg })], { tab: "76%", pv: "24px" });
    const bande = G.bande(k, [m1, m2, m3, m4], { fond: NUIT, colonne: true, gap: "0px", aligne: "flex-start", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Escalier" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Santé numérique et pharmacie", target: 6, built: true,
  description: "Pieds de cabinets connectés, pharmacies et services de santé en ligne, angles droits, inspirés de captures : deux demi-pages, barre compacte, console, frise d'étapes, mosaïque, escalier de bandes.",
  models: [deuxConsultations, enseigneVerte, consolePatient, parcoursDeSoin, mosaiqueSante, etagesCabinet],
};
