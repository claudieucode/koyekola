// Famille v2 « Mobilité électrique et vélos » — 6 modèles (ft2-416 à ft2-421), série « inspirée de captures » : ANGLES DROITS partout (aucun border-radius), un archétype de composition différent par modèle
// (A colonne latérale pleine hauteur · D barre unique inversée · F bandeau d'appel XXL + colonne étroite · H mosaïque asymétrique · I frise en étapes · K console). Pieds de vélocistes, boutiques de trottinettes et vélos électriques, bornes de recharge.
// Idées reprises des captures (jamais copiées : autres couleurs, autres marques fictives, aucune photo) : nom monumental (37), lettre d'information en tête + colonnes + réseaux en bout de ligne (38), carte sombre posée sur un aplat vif (39).
// Contenu utile et réel (liens de la plateforme, coordonnées et horaires des « Données de l'entreprise », lettre, mentions légales) ; marques fictives ; AUCUNE coordonnée ni chiffre inventé (aucune autonomie, aucun prix). Adresses de réseaux : exemples.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 6 px) ; au moins une animation visible par modèle (carré qui « respire », étape qui s'allume, bouton qui s'inverse, curseur de console).
// Limites du moteur : pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const DOUX = 360; // ms : transitions de survol / focus (angles droits partout)

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, fontStyle: o.style, letterSpacing: o.suivi }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
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
function lettre(k, env, G, o) {
  const abo = G.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "420px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte, fondChamp: o.fondChamp })(k, env);
  const P = abo.parts;
  P.title.styles.desktop = { ...P.title.styles.desktop, color: o.couleurTitre || o.texte, lineHeight: 1.4 };
  P.intro.styles.desktop = { ...P.intro.styles.desktop, color: o.texte };
  P.consent.styles.desktop = { ...P.consent.styles.desktop, color: o.texte };
  P.missing.styles.desktop = { ...P.missing.styles.desktop, color: o.texte };
  P.input.styles.desktop = { ...P.input.styles.desktop, borderRadius: "0px" };
  P.button.styles.desktop = { ...P.button.styles.desktop, color: o.surBouton, backgroundColor: o.accent, borderRadius: "0px", transitionDuration: DOUX };
  P.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.survolTexte || o.fond, transform: { y: -2 } }, focus: GK.focus(o.focus || o.texte) };
  return abo;
}
// Conteneur pleine largeur libre (bord à bord) : pour les demi-pages, étagères, etc.
const plein = (enfants, st = {}, mob) => ({ type: "container", props: { full: true }, children: enfants, ...sty(compact({ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", gap: "0px", width: "100%", ...st }), undefined, mob) });
// Case / bloc à fond propre (angles droits)
const caseDe = (k, enfants, st = {}, mob, hover) => { const n = k.col(enfants, compact({ flexBasis: "0px", flexGrow: 1, flexShrink: 1, minWidth: "240px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", alignItems: "flex-start", borderRadius: "0px", transitionDuration: DOUX, ...st }), undefined, mob); if (hover) n.states = { hover }; return n; };
const reseaux = (k, env, liste, o) => GK.reseauxTexte(liste, o)(k, env);
const RS = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Pinterest", "https://www.pinterest.com/"]];
const legale = (k, env, o) => GK.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);

const FAM = "mobilite-electrique";
const lienListe = (k, liste, o = {}) => liste.map(([l, u]) => lien(k, l, u, o));

// ═══ ft2-416 « Volt Atelier » — archétype A : colonne latérale pleine hauteur (barre verticale citron) + zone principale ═══
const volt = identite({ key: "c416", label: "Charbon et citron vif", humeur: "dark", fond: "#14161a", texte: "#f3f4ef", discret: "#b9bcb2", accent: "#c6f432", surface: "#1e2126", encre: "#14161a", police: "font.dm-sans", titres: "font.unbounded", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f3f4ef44" });
const voltAtelier = modeleV2({
  id: identifiantV2(416, "volt-atelier"), concept: "c-416-volt-atelier", name: "Volt Atelier", family: FAM,
  description: "Pour un vélociste électrique : une barre verticale citron vif sur toute la hauteur (nom, réseaux), et à droite sur charbon les rubriques vélos, services et la lettre d'information. Énergique, lisible, angles droits.",
  tags: ["vélos électriques", "vélociste", "colonne latérale", "citron", "charbon", "lettre", "angles droits"],
  identity: volt, racine: racineDe("#14161a"), widgets: ["text", "link", "emailsubscribe", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, CIT = "#c6f432", CH = "#14161a", BL = "#f3f4ef";
    const nom = G.geant("<p>Volt<br>Atelier</p>", { taille: [34, 58], lh: 0.95, suivi: "-0.03em", poids: "700", police: S.head, couleur: CH })(k, env);
    const barre = k.col([k.row([souffle(carre(k, CH, "14px"), 3200), caps(k, "Vélos électriques", { couleur: CH })], { gap: "10px", alignItems: "center" }), nom, k.col([caps(k, "Suivez-nous", { couleur: CH }), G.reseauxTexte(RS, { couleur: CH, survol: "#ffffff", focus: CH })(k, env)], { gap: "6px", alignItems: "flex-start" })], { width: "300px", flexShrink: 0, backgroundColor: CIT, paddingTop: "56px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "32px", gap: "40px", justifyContent: "space-between", alignItems: "flex-start" }, { width: "100%", paddingLeft: "32px", paddingTop: "40px", paddingBottom: "36px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "28px" });
    const colL = (titre, liste) => k.col([caps(k, titre, { couleur: CIT }), ...lienListe(k, liste, { taille: 16, couleur: BL, poids: "500", survol: { color: CIT, transform: { x: 6 } }, focus: CIT })], { gap: "4px", flexBasis: "0px", flexGrow: 1, minWidth: "150px" });
    const cols = k.row([colL("Vélos", [["Urbains", "/boutique"], ["Cargos", "/boutique"], ["Pliants", "/boutique"], ["Tout-terrain", "/boutique"]]), colL("Atelier", [["Entretien", "/faq"], ["Réparation", "/catalogue"], ["Pièces et batteries", "/catalogue"]]), colL("Aide", [["Essai gratuit", "/contact"], ["Livraison", "/faq"], ["Garanties", "/catalogue"], ["Contact", "/contact"]])], { gap: "28px 36px", alignItems: "flex-start", width: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre de l'atelier", intro: "Nouveaux modèles et conseils d'entretien.", bouton: "Je m'inscris", accent: CIT, texte: BL, surBouton: CH, fond: CH, survolBouton: BL, survolTexte: CH, largeur: "460px" });
    const h = k.col([caps(k, "Horaires de l'atelier", { couleur: CIT }), horaires(k, { couleur: BL, taille: 15 })], { gap: "10px", flexBasis: "0px", flexGrow: 1, minWidth: "220px" });
    const bas = k.row([k.col([abo], { flexBasis: "0px", flexGrow: 1.4, minWidth: "260px" }), h], { gap: "32px 48px", alignItems: "flex-start", width: "100%" });
    const main = k.col([cols, trait(k, "#f3f4ef33"), bas, legale(k, env, { couleur: "#b9bcb2", liens: BL })], { flexBasis: "0px", flexGrow: 1, minWidth: "320px", backgroundColor: CH, paddingTop: "56px", paddingBottom: "36px", paddingLeft: "56px", paddingRight: "56px", gap: "36px", alignItems: "stretch" }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px" });
    return [G.racine(k, [plein([barre, main], { flexWrap: "wrap" })])];
  },
}, FAM);

// ═══ ft2-417 « Pédale Urbaine » — archétype D : ligne unique type barre de navigation inversée, très compacte ═══
const urbaine = identite({ key: "c417", label: "Turquoise et encre", humeur: "dark", fond: "#00a6a6", texte: "#04202a", discret: "#073a46", accent: "#ffffff", surface: "#58d3d0", encre: "#04202a", police: "font.rubik", titres: "font.oswald", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#04202a55" });
const pedaleUrbaine = modeleV2({
  id: identifiantV2(417, "pedale-urbaine"), concept: "c-417-pedale-urbaine", name: "Pédale Urbaine", family: FAM,
  description: "Pour un loueur de vélos en libre-service ou une coopérative de mobilité : tout tient en deux lignes sur aplat turquoise, nom en capitales condensées, rubriques en ligne, réseaux et mentions. Compact, efficace, angles droits.",
  tags: ["location de vélos", "mobilité douce", "barre compacte", "turquoise", "une ligne", "angles droits"],
  identity: urbaine, racine: racineDe("#04202a"), widgets: ["link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#04202a", BL = "#ffffff";
    const marque = k.row([carre(k, ENC, "18px"), k.LINK("PÉDALE URBAINE", "/", { fontFamily: S.head, fontSize: "26px", fontWeight: "700", letterSpacing: "0.04em", color: ENC, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "44px" })], { gap: "12px", alignItems: "center" });
    GK.fini(k, marque.children[1], { hover: { color: BL }, focus: GK.focus(BL) });
    const nav = k.row(lienListe(k, [["Stations", "/blog"], ["Abonnements", "/catalogue"], ["Aide", "/faq"], ["Entreprises", "/catalogue"], ["Contact", "/contact"]], { taille: 15, poids: "600", couleur: ENC, casse: "uppercase", suivi: "0.08em", extra: { borderBottomWidth: "0px" }, survol: { color: BL, transform: { y: -3 } }, focus: ENC }), { gap: "0px 28px", alignItems: "center", flexWrap: "wrap" });
    const bt = lien(k, "Créer mon compte", "/catalogue", { taille: 14, poids: "700", couleur: BL, h: "44px", padH: "22px", survol: { backgroundColor: BL, color: ENC }, focus: ENC, extra: { backgroundColor: ENC, justifyContent: "center" } });
    souffle(bt, 4000);
    const b1 = G.bande(k, [marque, nav, bt], { fond: "#00a6a6", gap: "12px 36px", aligne: "center", padV: ["22px", "20px", "20px"], padB: ["14px", "12px", "12px"], padH: ["40px", "28px", "16px"], nom: "Barre" });
    const b2 = G.bande(k, [trait(k, "#04202a66"), k.row([G.reseauxTexte(RS, { couleur: ENC, survol: BL, focus: ENC, taille: 14 })(k, env), legale(k, env, { couleur: ENC, liens: ENC })], { justifyContent: "space-between", alignItems: "center", gap: "10px 32px", width: "100%" })], { colonne: true, fond: "#00a6a6", gap: "10px", padV: ["0px", "0px", "0px"], padB: ["18px", "16px", "14px"], padH: ["40px", "28px", "16px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

// ═══ ft2-418 « Kilowatt Club » — archétype F : bandeau d'appel XXL en haut + liens en une seule colonne étroite à droite ═══
const kilowatt = identite({ key: "c418", label: "Orange vif et graphite", humeur: "dark", fond: "#111111", texte: "#f5f5f5", discret: "#bdbdbd", accent: "#ff5a1f", surface: "#1d1d1d", encre: "#111111", police: "font.epilogue", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f5f5f544" });
const kilowattClub = modeleV2({
  id: identifiantV2(418, "kilowatt-club"), concept: "c-418-kilowatt-club", name: "Kilowatt Club", family: FAM,
  description: "Pour un club ou une marque de scooters et motos électriques : un énorme bandeau d'appel orange (« Roulez électrique ») avec bouton d'essai, puis sur graphite une seule colonne étroite de liens à droite et la lettre à gauche. Frontal, angles droits.",
  tags: ["scooters électriques", "motos électriques", "bandeau d'appel", "orange", "graphite", "colonne étroite", "lettre"],
  identity: kilowatt, racine: racineDe("#111111"), widgets: ["text", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OR = "#ff5a1f", GR = "#111111", BL = "#f5f5f5";
    const grand = G.geant("<p>ROULEZ<br>ÉLECTRIQUE.</p>", { taille: [56, 168], lh: 0.92, suivi: "0em", poids: "400", police: S.head, couleur: GR })(k, env);
    const bt = lien(k, "Réserver un essai", "/contact", { taille: 16, poids: "800", couleur: BL, casse: "uppercase", suivi: "0.08em", h: "60px", padH: "32px", survol: { backgroundColor: BL, color: GR, transform: { x: 6 } }, focus: GR, extra: { backgroundColor: GR, justifyContent: "center", alignSelf: "flex-start" } });
    souffle(bt, 3800);
    const b1 = G.bande(k, [k.col([caps(k, "Kilowatt Club · mobilité électrique", { couleur: GR }), grand], { gap: "18px", flexBasis: "0px", flexGrow: 3, minWidth: "300px" }), bt], { fond: OR, gap: "32px 48px", aligne: "flex-end", padV: ["64px", "52px", "40px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const abo = lettre(k, env, G, { titre: "Lettre du club", intro: "Sorties du club, nouveautés et conseils de sécurité.", bouton: "OK", accent: OR, texte: BL, surBouton: GR, fond: GR, survolBouton: BL, survolTexte: GR, largeur: "460px" });
    const gauche = k.col([abo, k.col([caps(k, "Nous écrire", { couleur: OR }), coordonnees(k, { couleur: BL, lien: BL, survol: OR, focus: OR })], { gap: "8px", paddingTop: "12px" })], { flexBasis: "0px", flexGrow: 3, minWidth: "300px", gap: "28px" });
    const etroite = k.col([caps(k, "Rubriques", { couleur: OR }), ...lienListe(k, [["Modèles", "/catalogue"], ["Recharge", "/catalogue"], ["Assurance", "/catalogue"], ["Équipement", "/catalogue"], ["Entretien", "/faq"], ["Questions", "/faq"], ["Contact", "/contact"]], { taille: 17, couleur: BL, bloc: true, poids: "600", survol: { color: OR, transform: { x: 6 } }, focus: OR, extra: { borderBottomStyle: "solid" } }), trait(k, "#f5f5f544"), k.col([G.reseauxTexte(RS.slice(0, 2), { couleur: BL, survol: OR, focus: OR })(k, env)], { paddingTop: "8px", width: "100%" })], { gap: "0px", width: "240px", flexShrink: 0 }, { width: "100%" });
    const b2 = G.bande(k, [gauche, etroite], { fond: GR, gap: "40px 80px", aligne: "flex-start", padV: ["56px", "44px", "36px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    const b3 = G.bande(k, [trait(k, "#f5f5f544"), legale(k, env, { couleur: "#bdbdbd", liens: BL })], { fond: GR, colonne: true, gap: "20px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2, b3])];
  },
}, FAM);

// ═══ ft2-419 « Borne et Cie » — archétype H : mosaïque asymétrique (une grande case + trois petites) ═══
const borne = identite({ key: "c419", label: "Violet, jaune et blanc cassé", humeur: "light", fond: "#f2f0ea", texte: "#17142b", discret: "#4c4866", accent: "#4b2bd6", surface: "#e4e0d6", encre: "#17142b", police: "font.outfit", titres: "font.syne", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#17142b33" });
const borneCie = modeleV2({
  id: identifiantV2(419, "borne-et-cie"), concept: "c-419-borne-et-cie", name: "Borne et Cie", family: FAM,
  description: "Pour un réseau de bornes de recharge et un installateur : une mosaïque asymétrique sur blanc cassé, une grande case violette (nom et lettre) et trois petites cases jaune, graphite et blanche (horaires, contact, rubriques). Franc et graphique, angles droits.",
  tags: ["bornes de recharge", "installateur", "mosaïque", "violet", "jaune", "horaires", "contact", "lettre"],
  identity: borne, racine: racineDe("#f2f0ea"), widgets: ["text", "link", "emailsubscribe", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, VI = "#4b2bd6", JA = "#ffd400", EN = "#17142b", BL = "#ffffff", PAP = "#f2f0ea";
    const nom = G.geant("<p>Borne<br>&amp; Cie</p>", { taille: [44, 96], lh: 0.95, suivi: "-0.03em", poids: "700", police: S.head, couleur: BL })(k, env);
    const abo = lettre(k, env, G, { titre: "Lettre de la borne", intro: "Nouvelles stations et conseils de recharge à domicile.", bouton: "Je m'inscris", accent: JA, texte: BL, surBouton: EN, fond: VI, survolBouton: BL, survolTexte: VI, largeur: "420px" });
    const grande = k.col([k.row([souffle(carre(k, JA, "14px"), 3200), caps(k, "Recharge et installation", { couleur: BL })], { gap: "10px", alignItems: "center" }), nom, abo], { flexBasis: "0px", flexGrow: 3, minWidth: "300px", backgroundColor: VI, paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", gap: "28px", justifyContent: "space-between", alignItems: "flex-start" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px" });
    const p1 = k.col([caps(k, "Horaires", { couleur: EN }), horaires(k, { couleur: EN, taille: 15 })], { backgroundColor: JA, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", alignItems: "flex-start" });
    const p2 = k.col([caps(k, "Contact", { couleur: JA }), coordonnees(k, { couleur: BL, lien: BL, survol: JA, focus: JA, taille: 15 })], { backgroundColor: EN, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", alignItems: "flex-start" });
    const p3 = k.col([caps(k, "Rubriques", { couleur: VI }), k.row(lienListe(k, [["Bornes", "/catalogue"], ["Installation", "/catalogue"], ["Aides", "/catalogue"], ["FAQ", "/faq"]], { taille: 15, couleur: EN, poids: "700", soulign: true, survol: { color: VI, transform: { y: -2 } }, focus: VI }), { gap: "0px 20px", alignItems: "center" })], { backgroundColor: BL, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", alignItems: "flex-start" });
    p1.states = { hover: { backgroundColor: "#ffe24d" } }; p2.states = { hover: { backgroundColor: "#26224a" } }; p3.states = { hover: { backgroundColor: "#f7f5ff" } };
    p1.styles.desktop.transitionDuration = DOUX; p2.styles.desktop.transitionDuration = DOUX; p3.styles.desktop.transitionDuration = DOUX;
    const petites = k.col([p1, p2, p3], { flexBasis: "0px", flexGrow: 2, minWidth: "280px", gap: "0px", alignItems: "stretch" });
    const mosaique = k.row([grande, petites], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const b1 = G.bande(k, [mosaique], { fond: PAP, colonne: true, padV: ["48px", "36px", "24px"], padB: ["20px", "16px", "12px"], padH: ["40px", "28px", "16px"], nom: "Mosaïque" });
    const b2 = G.bande(k, [k.row([G.reseauxTexte(RS, { couleur: EN, survol: VI, focus: VI })(k, env)], { width: "100%" }), legale(k, env, { couleur: "#4c4866", liens: EN })], { fond: PAP, colonne: true, gap: "14px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["40px", "28px", "16px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

// ═══ ft2-420 « Trajet » — archétype I : frise horizontale en quatre étapes à points carrés ═══
const trajet = identite({ key: "c420", label: "Bleu océan et corail", humeur: "dark", fond: "#0a3d62", texte: "#f4f9fc", discret: "#c4dbea", accent: "#ff8a6b", surface: "#0f5486", encre: "#0a3d62", police: "font.red-hat-display", titres: "font.sora", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f4f9fc55" });
const trajetModele = modeleV2({
  id: identifiantV2(420, "trajet"), concept: "c-420-trajet", name: "Trajet", family: FAM,
  description: "Pour un concessionnaire de vélos et trottinettes électriques : une frise horizontale en quatre étapes à points carrés (choisir, essayer, acheter, entretenir), chacune un lien, sur bleu océan avec accents corail ; coordonnées et lettre en dessous. Pédagogique, angles droits.",
  tags: ["concessionnaire", "frise", "étapes", "bleu océan", "corail", "parcours d'achat", "contact"],
  identity: trajet, racine: racineDe("#0a3d62"), widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OC = "#0a3d62", CO = "#ff8a6b", BL = "#f4f9fc";
    const titre = G.geant("<p>De l'envie au guidon,<br>en quatre étapes.</p>", { taille: [30, 60], lh: 1.05, suivi: "-0.02em", poids: "600", police: S.head, couleur: BL })(k, env);
    const etape = (n, l, sous, u, allume) => {
      const pt = carre(k, allume ? CO : BL, "18px"); if (allume) souffle(pt, 3200);
      const lk = lien(k, l, u, { taille: 22, couleur: BL, poids: "700", police: S.head, survol: { color: CO, transform: { y: -3 } }, focus: CO });
      return k.col([pt, k.row([caps(k, n, { couleur: CO }), lk], { gap: "10px", alignItems: "baseline", flexWrap: "wrap" }), para(k, sous, { couleur: "#c4dbea", taille: 14, largeur: "230px" })], { flexBasis: "0px", flexGrow: 1, minWidth: "200px", gap: "12px", alignItems: "flex-start", paddingTop: "0px" });
    };
    const frise = k.row([etape("Étape 1", "Choisir", "Un guide par usage : ville, charge, loisir.", "/faq", true), etape("Étape 2", "Essayer", "Réservez un essai en magasin.", "/contact", false), etape("Étape 3", "Acheter", "Paiement, livraison et mise en route.", "/boutique", false), etape("Étape 4", "Entretenir", "Révision, pièces et batterie.", "/faq", false)], { gap: "32px 28px", alignItems: "flex-start", width: "100%" });
    const guide = lien(k, "Lire le guide d'achat", "/faq", { taille: 15, poids: "700", couleur: OC, h: "52px", padH: "24px", survol: { backgroundColor: BL, transform: { y: -2 } }, focus: BL, extra: { backgroundColor: CO, justifyContent: "center" } });
    const b1 = G.bande(k, [k.row([titre, guide], { justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px", width: "100%" }), k.divider({ width: "100%", borderColor: "#f4f9fc88", borderTopWidth: "2px", marginTop: "0px", marginBottom: "0px" }), frise], { colonne: true, fond: OC, gap: "48px", padV: ["64px", "52px", "40px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Frise" });
    const abo = lettre(k, env, G, { titre: "Lettre du concessionnaire", intro: "Nouveaux modèles, journées d'essai.", bouton: "S'abonner", accent: CO, texte: BL, surBouton: OC, fond: "#0f5486", survolBouton: BL, survolTexte: OC, largeur: "460px" });
    const bloc = k.col([abo], { backgroundColor: "#0f5486", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "28px", paddingRight: "28px", flexBasis: "0px", flexGrow: 1, minWidth: "280px" });
    const adr = k.col([caps(k, "Nous trouver", { couleur: CO }), coordonnees(k, { couleur: BL, lien: BL, survol: CO, focus: CO })], { gap: "10px", flexBasis: "0px", flexGrow: 1, minWidth: "240px" });
    const b2 = G.bande(k, [adr, bloc], { fond: OC, gap: "28px 56px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Adresse et lettre" });
    const b3 = G.bande(k, [trait(k, "#f4f9fc55"), k.row([G.reseauxTexte(RS, { couleur: BL, survol: CO, focus: CO })(k, env), legale(k, env, { couleur: "#c4dbea", liens: BL })], { justifyContent: "space-between", gap: "14px 32px", alignItems: "center", width: "100%" })], { fond: OC, colonne: true, gap: "18px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2, b3])];
  },
}, FAM);

// ═══ ft2-421 « Console Wattmètre » — archétype K : le pied ressemble à une fenêtre de console (barre de titre, lignes de commande) ═══
const console_ = identite({ key: "c421", label: "Noir console et ambre", humeur: "dark", fond: "#0d1117", texte: "#e6edf3", discret: "#a7b1bd", accent: "#ffb000", surface: "#161b22", encre: "#0d1117", police: "font.space-grotesk", titres: "font.jetbrains-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#e6edf344" });
const consoleWattmetre = modeleV2({
  id: identifiantV2(421, "console-wattmetre"), concept: "c-421-console-wattmetre", name: "Console Wattmètre", family: FAM,
  description: "Pour une plateforme de suivi de recharge et de flottes électriques : le pied est une fenêtre de console (barre de titre à trois carrés, commandes en monospace, curseur ambre qui respire) avec rubriques, lettre et mentions. Technique, angles droits.",
  tags: ["flotte électrique", "recharge", "console", "monospace", "ambre", "fenêtre", "lettre"],
  identity: console_, racine: racineDe("#0d1117"), widgets: ["text", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, AM = "#ffb000", BG = "#0d1117", PN = "#161b22", BL = "#e6edf3", MO = S.head;
    const barre = k.row([k.row([carre(k, "#ff5f56", "12px"), carre(k, AM, "12px"), carre(k, "#27c93f", "12px")], { gap: "8px", alignItems: "center" }), caps(k, "wattmetre — session de pied de page", { couleur: "#a7b1bd", police: MO, taille: "12px", suivi: "0.04em" })], { gap: "20px", alignItems: "center", backgroundColor: "#21262d", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", width: "100%" });
    const cmd = (c, l, u) => k.row([k.T(`<p>$ ${c}</p>`, { fontFamily: MO, fontSize: "14px", color: AM, minWidth: "190px" }), lien(k, l, u, { taille: 16, couleur: BL, poids: "600", police: MO, soulign: true, survol: { color: AM, transform: { x: 6 } }, focus: AM })], { gap: "4px 20px", alignItems: "center", width: "100%" });
    const curs = souffle(k.T("<p>█</p>", { fontFamily: MO, fontSize: "18px", color: AM, lineHeight: 1 }), 1800);
    const lignes = k.col([cmd("ouvrir --suivi", "Suivi de recharge", "/faq"), cmd("ouvrir --flotte", "Gestion de flotte", "/catalogue"), cmd("ouvrir --bornes", "Carte des bornes", "/catalogue"), cmd("ouvrir --aide", "Documentation", "/catalogue"), cmd("ecrire --equipe", "Contacter l'équipe", "/contact"), k.row([k.T("<p>$</p>", { fontFamily: MO, fontSize: "14px", color: AM }), curs], { gap: "8px", alignItems: "center" })], { gap: "2px", flexBasis: "0px", flexGrow: 1.3, minWidth: "300px" });
    const abo = lettre(k, env, G, { titre: "s'abonner --lettre", intro: "Nouveautés de la plateforme, sans spam.", bouton: "Valider", accent: AM, texte: BL, surBouton: BG, fond: PN, survolBouton: BL, survolTexte: BG, largeur: "400px", couleurTitre: AM });
    const droite = k.col([abo, k.col([caps(k, "contact", { couleur: AM, police: MO, suivi: "0.04em" }), coordonnees(k, { couleur: BL, lien: BL, survol: AM, focus: AM, taille: 14 })], { gap: "8px" })], { flexBasis: "0px", flexGrow: 1, minWidth: "280px", gap: "24px" });
    const corps = k.row([lignes, droite], { gap: "32px 56px", alignItems: "flex-start", width: "100%", paddingTop: "28px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px" });
    const fenetre = k.col([barre, corps, trait(k, "#e6edf333"), k.col([legale(k, env, { couleur: "#a7b1bd", liens: BL })], { paddingTop: "14px", paddingBottom: "16px", paddingLeft: "28px", paddingRight: "28px", width: "100%" })], { gap: "0px", width: "100%", backgroundColor: PN, borderStyle: "solid", borderWidth: "1px", borderColor: "#e6edf355" });
    const b1 = G.bande(k, [fenetre], { fond: BG, colonne: true, padV: ["56px", "44px", "32px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "16px"], nom: "Fenêtre" });
    return [G.racine(k, [b1])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Mobilité électrique et vélos", target: 6, built: true,
  description: "Pieds de vélocistes, scooters, bornes de recharge et flottes électriques : colonne latérale, barre compacte, bandeau XXL, mosaïque, frise, console ; angles droits.",
  models: [voltAtelier, pedaleUrbaine, kilowattClub, borneCie, trajetModele, consoleWattmetre],
};
