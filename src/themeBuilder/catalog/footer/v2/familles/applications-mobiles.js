// Famille v2 « Applications mobiles » — 6 modèles (ft2-296 à ft2-301), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds d'applications mobiles (marques fictives). Aucune image ni capture d'écran (les « boutons de boutique » sont des liens texte vers l'accueil des boutiques d'applications, adresses d'EXEMPLE à remplacer par celles de l'application),
// aucun chiffre, note ni nombre de téléchargements inventés. Les rubriques (Fonctionnalités, Nouveautés, Aide…) sont des intitulés d'exemple. Chaque modèle a sa palette, ses polices (2 au plus) et son archétype
// de composition (A, H, B, C, J, L), en mode « solo ». Idées reprises des captures (07 : logo + colonnes + lettre, 08 : bandeau de lettre, 09 : liens en colonnes sous un titre centré) : composition seulement, jamais de copie.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 14 px) ; UNE animation visible par modèle (carré qui respire, case qui se remplit,
// bouton qui se soulève, ligne qui s'indente) ; pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const DOUX = 360; // ms : durée des transitions de survol / focus

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg }; // message « non configuré » lisible sur le fond de SA bande
  return n;
};
const ABO_STYLE = (abo, o) => { // habille le widget e-mail : titre, texte, bouton et survol du bouton
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.titre };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.intro };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.boutonTexte };
  abo.parts.button.states = { hover: { backgroundColor: o.survolFond, color: o.survolTexte }, focus: GK.focus(o.focus) };
  return abo;
};
// Bouton plein ou à contour, angles droits, qui se soulève et change de couleur au survol
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });

const PH = ["48px", "32px", "20px"];
const ZERO = ["0px", "0px", "0px"];
const mentionsBande = (G, k, env, o) => { // dernière bande : texte légal lisible sur le fond de la bande
  const b = G.bande(k, [G.ligneLegale({ taille: 13, couleur: o.texte, liens: o.liens, sansCookies: true })(k, env)], { fond: o.fond, gap: "12px 40px", aligne: "center", padV: ["22px", "20px", "16px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Mentions" });
  b.styles.desktop.color = o.liens;
  return b;
};

const FAM = "applications-mobiles";
const APPLE = "https://www.apple.com/app-store/", GOOGLE = "https://play.google.com/";
const reseauxMini = (G, k, env, o) => G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, poids: "600", couleur: o.couleur, survol: o.survol, focus: o.focus })(k, env);

// ═══ ft2-296 « Rail d'application » — application grand public — ARCHÉTYPE A : colonne latérale pleine hauteur ═══
// Idée : une haute COLONNE BLEUE à droite (marque, promesse, deux boutons de boutique blancs qui se soulèvent, réseaux) et, à gauche, une zone blanc bleuté avec trois rangées de liens (Application, Aide, Société), la lettre d'information
// et les mentions. Un carré de statut respire près de « Disponible sur mobile ». Bleu électrique, blanc bleuté, encre. Polices : Plus Jakarta Sans (titres) et Nunito Sans (texte). Rubriques d'exemple.
const rail = identite({
  key: "c296", label: "Bleu électrique et blanc bleuté", humeur: "light",
  fond: "#f5f6fb", texte: "#0c1230", discret: "#454c6e", accent: "#1d3fff", surface: "#ffffff", encre: "#0c1230", surEncre: "#f5f6fb",
  police: "font.nunito-sans", titres: "font.plus-jakarta-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#0c123333",
});
const BLEUE = "#1d3fff", PALE = "#f5f6fb", ENCRE = "#0c1230", BLANC = "#ffffff";
const railApp = modeleV2({
  id: identifiantV2(296, "rail-d-application"), concept: "c-296-rail-d-application",
  name: "Rail d'application", family: FAM,
  description: "Pour une application grand public : haute colonne bleue à droite (marque, promesse, deux boutons de boutique, réseaux) et zone claire à gauche avec trois rangées de liens, lettre d'information et mentions. Bleu électrique et blanc bleuté.",
  tags: ["application mobile", "grand public", "colonne latérale", "boutons de boutique", "bleu électrique", "lettre"],
  identity: rail,
  racine: racineDe(PALE),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const stat = k.row([souffle(carre(k, BLANC, "12px"), 2800), caps(k, "Disponible sur mobile", { couleur: BLANC, suivi: "0.2em", police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const marque = k.T("<p>Pomelo</p>", { fontSize: "fluid:40-64", fontWeight: "800", fontFamily: S.head, color: BLANC, letterSpacing: "-0.03em", lineHeight: 1 });
    const promesse = k.T("<p>Vos listes, vos rappels et vos projets, au même endroit.</p>", { fontSize: "18px", lineHeight: 1.5, color: "#e3e8ff", fontFamily: S.font, maxWidth: "280px" });
    const boutique = (t, u) => bouton(k, t, u, { texte: BLEUE, fond: BLANC, taille: 14, survol: { backgroundColor: ENCRE, borderColor: ENCRE, color: BLANC, transform: { y: -4 } }, focus: BLANC, extra: { width: "100%" } });
    const lat = G.colonne(k, [stat, marque, promesse, k.col([boutique("App Store ↗", APPLE), boutique("Google Play ↗", GOOGLE)], { gap: "10px", width: "100%" }), reseauxMini(G, k, env, { couleur: BLANC, survol: "#ffe14d", focus: BLANC })], { poids: 0, base: "340px", min: "290px", gap: "26px", justifie: "flex-start", extra: { backgroundColor: BLEUE, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "36px", paddingRight: "36px", flexGrow: 0, flexShrink: 0 }, mobile: { flexGrow: 1, flexBasis: "100%" } });
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "500", couleur: ENCRE, padH: "0px", survol: { color: BLEUE, transform: { y: -2 } }, focus: BLEUE });
    const rang = (titre, liste) => k.row([caps(k, titre, { couleur: BLEUE, police: S.head, extra: { flexBasis: "130px", flexShrink: 0 } }), G.ligne(k, liste.map(([t, u]) => lk(t, u)), { gap: "0px 28px", aligne: "center" })], { rowGap: "0px", columnGap: "24px", alignItems: "center", width: "100%", paddingTop: "4px", paddingBottom: "4px" });
    const colonnes = k.col([rang("Application", [["Fonctionnalités", "/blog"], ["Nouveautés", "/blog"], ["Confidentialité", "/faq"]]), trait(k, "#0c123326"), rang("Aide", [["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]]), trait(k, "#0c123326"), rang("Société", [["À propos", "/blog"], ["Presse", "/contact"], ["Recrutement", "/contact"]])], { gap: "4px", width: "100%" });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Nouveautés de l'application", intro: "Un message à chaque grande mise à jour.", bouton: "Je m'abonne", largeur: "460px", accent: BLEUE, texte: ENCRE }), { titre: BLEUE, intro: S.mute, boutonTexte: BLANC, survolFond: ENCRE, survolTexte: BLANC, focus: ENCRE });
    const mentions = G.ligneLegale({ taille: 13, couleur: S.mute, liens: ENCRE, sansCookies: true })(k, env);
    const principal = G.colonne(k, [abo, colonnes, k.col([], { width: "100%", height: "1px", backgroundColor: "#c9cde0", flexShrink: 0 }), mentions], { poids: 1, base: "0px", min: "300px", gap: "34px", justifie: "space-between", extra: { backgroundColor: PALE, paddingTop: "64px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "48px" }, mobile: { paddingLeft: "20px", paddingRight: "20px" } });
    const zone = G.bande(k, [principal, lat], { fond: PALE, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Colonne latérale et zone principale" });
    zone.styles.desktop.color = ENCRE;
    return [G.racine(k, [zone])];
  },
}, FAM);

// ═══ ft2-297 « Mosaïque de poche » — application de services — ARCHÉTYPE H : mosaïque asymétrique ═══
// Idée : une MOSAÏQUE : une grande case orange « Dans votre poche. » avec les deux boutons de boutique noirs, à droite, et à gauche trois petites cases superposées : Aide (crème), Nouveautés (noir), Lettre d'information (menthe).
// Pas de colonnes de liens. Orange, noir, crème, menthe. Polices : Syne (titres) et Karla (texte). La case orange se remplit de noir au survol de ses boutons ; rubriques d'exemple.
const mosaique = identite({
  key: "c297", label: "Orange, noir, crème et menthe", humeur: "light",
  fond: "#fff3e0", texte: "#141414", discret: "#4a4640", accent: "#ff6a1a", surface: "#ffffff", encre: "#141414", surEncre: "#fff3e0",
  police: "font.karla", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#14141433",
});
const ORANGE = "#ff6a1a", NOIR = "#141414", CREME = "#fff3e0", MENTHE = "#b8f0d8";
const mosaiquePoche = modeleV2({
  id: identifiantV2(297, "mosaique-de-poche"), concept: "c-297-mosaique-de-poche",
  name: "Mosaïque de poche", family: FAM,
  description: "Pour une application de services : mosaïque asymétrique, une grande case orange (« Dans votre poche. » et deux boutons de boutique) et trois petites cases superposées (aide, nouveautés, lettre). Orange, noir, crème, menthe.",
  tags: ["application de services", "mosaïque", "asymétrique", "boutons de boutique", "orange", "menthe", "cases"],
  identity: mosaique,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, PAD = { paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" };
    const rec = k.row([souffle(carre(k, NOIR, "14px"), 2600), caps(k, "Application Zéphyr", { couleur: NOIR, suivi: "0.2em", police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Dans<br>votre<br>poche.</p>`, { taille: [44, 96], tablette: { taille: [48, 60] }, mobile: { taille: [44, 60] }, lh: 0.95, suivi: "-0.02em", poids: "800", police: S.head, couleur: NOIR })(k, env);
    const boutique = (t, u) => bouton(k, t, u, { texte: CREME, fond: NOIR, taille: 14, survol: { backgroundColor: CREME, borderColor: NOIR, color: NOIR, transform: { y: -4 } }, focus: NOIR });
    const grande = G.colonne(k, [rec, phrase, k.row([boutique("App Store ↗", APPLE), boutique("Google Play ↗", GOOGLE)], { gap: "10px" })], { poids: 1.15, base: "0px", min: "320px", gap: "28px", justifie: "space-between", extra: { backgroundColor: ORANGE, paddingTop: "40px", paddingBottom: "40px", paddingLeft: "36px", paddingRight: "36px", minHeight: "420px" } });
    const lk = (t, u, c, s) => lien(k, t, u, { taille: 16, poids: "600", couleur: c, padH: "0px", survol: { color: s, transform: { x: 6 } }, focus: s });
    const aide = k.col([caps(k, "Aide", { couleur: "#8a3a05", police: S.head }), lk("Questions fréquentes", "/faq", NOIR, "#8a3a05"), lk("Contact", "/contact", NOIR, "#8a3a05")], { gap: "2px", backgroundColor: CREME, ...PAD, flexGrow: 1 });
    const nouv = k.col([caps(k, "Nouveautés", { couleur: ORANGE, police: S.head }), lk("Le blog", "/blog", CREME, ORANGE), lk("Connexion", "/connexion", CREME, ORANGE)], { gap: "2px", backgroundColor: NOIR, ...PAD, flexGrow: 1 });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Lettre", intro: "Les mises à jour, sans bruit.", bouton: "OK", largeur: "100%", accent: NOIR, texte: NOIR, consentCouleur: NOIR }), { titre: NOIR, intro: NOIR, boutonTexte: MENTHE, survolFond: CREME, survolTexte: NOIR, focus: NOIR });
    const lettre = k.col([abo], { backgroundColor: MENTHE, ...PAD, flexGrow: 1, justifyContent: "center" });
    const petites = G.colonne(k, [aide, nouv, lettre], { poids: 1, base: "0px", min: "280px", gap: "0px", extra: { alignItems: "stretch" } });
    const mosa = G.bande(k, [petites, grande], { fond: NOIR, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Mosaïque" });
    return [G.racine(k, [mosa, mentionsBande(G, k, env, { fond: NOIR, texte: "#c9c4b8", liens: CREME })])];
  },
}, FAM);

// ═══ ft2-298 « Lune en grand » — application de bien-être — ARCHÉTYPE B : nom monumental seul ═══
// Idée : presque rien : le NOM de l'application (« lune. ») en DM Serif Display jusqu'à 200 px, centré dans un grand vide lilas, puis une barre violette qui porte les deux liens de boutique et les mentions.
// Lilas, encre violette. Polices : DM Serif Display et Manrope. Très peu de liens, grand vide. Le nom reste calme ; seul un point carré respire et les liens de boutique se soulèvent.
const lune = identite({
  key: "c298", label: "Lilas et encre violette", humeur: "light",
  fond: "#cfc2ff", texte: "#160f33", discret: "#3d3270", accent: "#4a2cd6", surface: "#e0d8ff", encre: "#160f33", surEncre: "#cfc2ff",
  police: "font.manrope", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#160f3340",
});
const LILAS = "#cfc2ff", VIOLET = "#160f33";
const luneEnGrand = modeleV2({
  id: identifiantV2(298, "lune-en-grand"), concept: "c-298-lune-en-grand",
  name: "Lune en grand", family: FAM,
  description: "Pour une application de méditation ou de sommeil : le nom en immense serif au centre d'un grand vide lilas, deux liens de boutique et une ligne de mentions. Presque rien d'autre. Lilas et encre violette.",
  tags: ["application de bien-être", "méditation", "nom monumental", "minimal", "centré", "lilas", "grand vide"],
  identity: lune,
  racine: racineDe(VIOLET),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>lune.</p>`, { taille: [110, 200], tablette: { taille: [150, 200] }, mobile: { taille: [110, 150] }, lh: 0.9, suivi: "-0.03em", poids: "400", police: S.head, couleur: VIOLET, extra: { textAlign: "center" } })(k, env);
    const petit = k.row([souffle(carre(k, S.accent, "10px"), 3200), caps(k, "Application de sommeil", { couleur: S.mute, suivi: "0.28em", police: S.font })], { gap: "10px", alignItems: "center", flexWrap: "nowrap", justifyContent: "center" });
    const boutique = (t, u) => lien(k, t, u, { taille: 14, poids: "800", couleur: VIOLET, casse: "uppercase", suivi: "0.16em", soulign: true, padH: "6px", survol: { color: "#ffffff", transform: { y: -3 } }, focus: VIOLET });
    const liens = k.row([boutique("App Store ↗", APPLE), boutique("Google Play ↗", GOOGLE)], { rowGap: "6px", columnGap: "36px", alignItems: "center" });
    const haut = G.bande(k, [k.col([nom, k.col([], { height: "6px" }), petit], { alignItems: "center", gap: "10px", width: "100%" })], { fond: LILAS, colonne: true, aligne: "center", padV: ["128px", "96px", "72px"], padB: ["96px", "72px", "56px"], padH: PH, nom: "Nom monumental" });
    haut.styles.desktop.color = VIOLET;
    const milieu = G.bande(k, [liens, caps(k, "Sommeil, respiration, sons", { couleur: VIOLET, suivi: "0.2em", extra: { textAlign: "right" } })], { fond: "#b9a8f5", gap: "14px 40px", aligne: "center", justifie: "center", padV: ["22px", "20px", "18px"], padH: PH, innerMobile: { rowGap: "10px" }, nom: "Boutiques" });
    milieu.styles.desktop.color = VIOLET;
    return [G.racine(k, [haut, milieu, mentionsBande(G, k, env, { fond: VIOLET, texte: "#cfc2ff", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-299 « Damier des écrans » — application multiplateforme — ARCHÉTYPE C : damier de six cases ═══
// Idée : un DAMIER de six grandes cases carrées (3 × 2) alternant charbon et cyan, où CHAQUE case est un lien ou une information : marque, iPhone et iPad, Android, version web, lettre d'information, aide et contact.
// Case qui se remplit au survol. Charbon, cyan. Polices : Barlow Condensed (titres) et Barlow (texte). Rubriques d'exemple.
const damier = identite({
  key: "c299", label: "Charbon et cyan", humeur: "dark",
  fond: "#1c1f24", texte: "#f2f6f8", discret: "#aeb8bf", accent: "#00b8d9", surface: "#252a30", encre: "#0b1114", surEncre: "#f2f6f8",
  police: "font.barlow", titres: "font.barlow-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f2f6f840",
});
const CHARBON = "#1c1f24", CYAN = "#00b8d9", ENCRE2 = "#0b1114", GIVRE = "#f2f6f8";
const damierEcrans = modeleV2({
  id: identifiantV2(299, "damier-des-ecrans"), concept: "c-299-damier-des-ecrans",
  name: "Damier des écrans", family: FAM,
  description: "Pour une application disponible sur plusieurs écrans : damier de six cases carrées charbon et cyan, chacune un lien ou une information (marque, iPhone et iPad, Android, version web, lettre, aide). Charbon et cyan, typographie condensée.",
  tags: ["application multiplateforme", "damier", "cases", "iPhone", "Android", "web", "cyan", "charbon"],
  identity: damier,
  racine: racineDe(CHARBON),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, base = { flexGrow: 1, flexBasis: "33%", minWidth: "260px", minHeight: "230px", justifyContent: "space-between", gap: "14px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "26px", paddingRight: "26px" };
    const grand = (t, u, sous, dark) => lien(k, t, u, { taille: 38, poids: "700", couleur: dark ? GIVRE : ENCRE2, police: S.head, casse: "uppercase", suivi: "0.01em", lh: 1, h: "230px", padH: "26px", survol: dark ? { backgroundColor: CYAN, color: ENCRE2 } : { backgroundColor: ENCRE2, color: CYAN }, focus: dark ? CYAN : ENCRE2, extra: { alignItems: "flex-end", paddingBottom: "24px", flexGrow: 1, flexBasis: "33%", minWidth: "260px", backgroundColor: dark ? CHARBON : CYAN } });
    const c1 = k.col([k.row([souffle(carre(k, CYAN, "14px"), 2800), caps(k, "Application Relais", { couleur: CYAN, suivi: "0.22em", police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), k.T("<p>Une seule application, sur tous vos écrans.</p>", { fontSize: "fluid:26-38", lineHeight: 1.05, fontFamily: S.head, fontWeight: "700", color: GIVRE, textTransform: "uppercase" })], { backgroundColor: CHARBON, ...base });
    const c5 = k.col([ABO_STYLE(abonnement(k, env, { titre: "Lettre", intro: "Les mises à jour, sans bruit.", bouton: "OK", largeur: "100%", accent: CYAN, texte: GIVRE }), { titre: CYAN, intro: "#aeb8bf", boutonTexte: ENCRE2, survolFond: GIVRE, survolTexte: ENCRE2, focus: GIVRE })], { backgroundColor: CHARBON, ...base, justifyContent: "center" });
    const c6 = k.col([caps(k, "Aide", { couleur: ENCRE2, police: S.head }), lien(k, "Questions fréquentes", "/faq", { taille: 18, poids: "700", couleur: ENCRE2, padH: "0px", soulign: true, survol: { color: "#ffffff", transform: { x: 6 } }, focus: ENCRE2 }), lien(k, "Écrire à l'équipe", "/contact", { taille: 18, poids: "700", couleur: ENCRE2, padH: "0px", soulign: true, survol: { color: "#ffffff", transform: { x: 6 } }, focus: ENCRE2 })], { backgroundColor: CYAN, ...base, justifyContent: "center", gap: "4px" });
    const r1 = G.ligne(k, [c1, grand("iPhone et iPad ↗", APPLE, "", false), grand("Android ↗", GOOGLE, "", true)], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const r2 = G.ligne(k, [grand("Version web →", "/connexion", "", false), c5, c6], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const cases = k.col([r1, r2], { gap: "0px", width: "100%" });
    const grille = G.bande(k, [cases], { fond: CHARBON, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", nom: "Damier" });
    return [G.racine(k, [grille, mentionsBande(G, k, env, { fond: CHARBON, texte: "#aeb8bf", liens: GIVRE })])];
  },
}, FAM);

// ═══ ft2-300 « Papier de première version » — application de lecture — ARCHÉTYPE J : papier à en-tête ═══
// Idée : un PAPIER À EN-TÊTE d'éditeur d'application : double filet, nom en Cormorant, une ligne « Disponible sur · App Store · Google Play », une ligne centrée de rubriques, un petit encart de lettre centré, double filet et mentions.
// Pas de colonnes. Ivoire, bordeaux, or terni. Polices : Cormorant Garamond et Mulish. Mobile : tout reste centré et empilé. Rubriques d'exemple.
const papier = identite({
  key: "c300", label: "Ivoire, bordeaux et or terni", humeur: "light",
  fond: "#fbf6ec", texte: "#2a1218", discret: "#5c3a42", accent: "#7a1f38", surface: "#f4ecda", encre: "#2a1218", surEncre: "#fbf6ec",
  police: "font.mulish", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#2a121840",
});
const IVOIRE = "#fbf6ec", BORDEAUX = "#7a1f38", OR = "#8a6a1f", ENCRE3 = "#2a1218";
const papierVersion = modeleV2({
  id: identifiantV2(300, "papier-de-premiere-version"), concept: "c-300-papier-de-premiere-version",
  name: "Papier de première version", family: FAM,
  description: "Pour une application de lecture : papier à en-tête ivoire, double filet bordeaux, nom en Cormorant, ligne de boutiques, rubriques centrées et petite lettre d'information centrée, puis mentions. Sans colonnes. Ivoire, bordeaux, or terni.",
  tags: ["application de lecture", "papier à en-tête", "centré", "double filet", "serif", "ivoire", "bordeaux"],
  identity: papier,
  racine: racineDe(IVOIRE),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, centre = { textAlign: "center" };
    const etiq = caps(k, "Application de lecture · Pomona", { couleur: OR, suivi: "0.34em", extra: centre });
    const nom = G.geant(`<p>Pomona</p>`, { taille: [52, 104], tablette: { taille: [72, 96] }, mobile: { taille: [52, 68] }, lh: 1, suivi: "-0.01em", poids: "600", police: S.head, couleur: BORDEAUX, extra: centre })(k, env);
    const devise = k.T("<p>Des livres et des articles, dans la poche, hors connexion.</p>", { fontSize: "19px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, textAlign: "center", maxWidth: "500px" });
    const boutique = (t, u) => lien(k, t, u, { taille: 15, poids: "800", couleur: ENCRE3, casse: "uppercase", suivi: "0.14em", soulign: true, padH: "6px", survol: { color: BORDEAUX, transform: { y: -3 } }, focus: BORDEAUX });
    const dispo = k.row([caps(k, "Disponible sur", { couleur: S.mute, suivi: "0.2em" }), boutique("App Store ↗", APPLE), carre(k, OR, "6px"), boutique("Google Play ↗", GOOGLE)], { rowGap: "8px", columnGap: "18px", justifyContent: "center", alignItems: "center" });
    const rubr = [["Fonctionnalités", "/blog"], ["Nouveautés", "/blog"], ["Aide", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]];
    const rangee = k.row(rubr.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "600", couleur: ENCRE3, casse: "uppercase", suivi: "0.14em", survol: { color: BORDEAUX, transform: { y: -2 } }, focus: BORDEAUX })), { rowGap: "0px", columnGap: "30px", justifyContent: "center", alignItems: "center" });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Le courrier de la maison", intro: "Une lettre à chaque nouvelle version.", bouton: "Recevoir", largeur: "420px", accent: BORDEAUX, texte: ENCRE3 }), { titre: BORDEAUX, intro: S.mute, boutonTexte: IVOIRE, survolFond: ENCRE3, survolTexte: IVOIRE, focus: ENCRE3 });
    const haut = G.bande(k, [trait(k, BORDEAUX, "3px"), etiq, nom, devise, dispo], { fond: IVOIRE, colonne: true, gap: "24px", aligne: "center", padV: ["64px", "52px", "40px"], padB: ["44px", "36px", "28px"], padH: PH, innerMobile: { rowGap: "22px" }, max: "880px", nom: "En-tête" });
    haut.styles.desktop.color = ENCRE3;
    const milieu = G.bande(k, [rangee, k.row([abo], { justifyContent: "center", width: "100%" })], { fond: "#f4ecda", colonne: true, gap: "30px", aligne: "center", padV: ["44px", "36px", "32px"], padB: ["44px", "36px", "32px"], padH: PH, max: "880px", filetHaut: { epaisseur: "1px", couleur: "#2a121840" }, nom: "Rubriques et lettre" });
    milieu.styles.desktop.color = ENCRE3;
    return [G.racine(k, [haut, milieu, mentionsBande(G, k, env, { fond: IVOIRE, texte: "#5c3a42", liens: ENCRE3 })])];
  },
}, FAM);

// ═══ ft2-301 « Escalier du lancement » — application de transport — ARCHÉTYPE L : pied en escalier ═══
// Idée : quatre MARCHES alignées à gauche, de largeurs décroissantes (100 %, 78 %, 56 %, 34 %) et de teintes de plus en plus claires : la marque et « Un pas de plus. » sur la plus large, les rubriques sur la suivante,
// les deux boutons de boutique, puis les mentions sur la plus étroite. Sur mobile les marches font toutes la pleine largeur. Rouge brique, corail, rose pâle. Polices : Rubik (titres) et Nunito Sans (texte). Rubriques d'exemple.
const marches = identite({
  key: "c301", label: "Rouge brique, corail et rose pâle", humeur: "light",
  fond: "#fff4ee", texte: "#240803", discret: "#5d2f24", accent: "#c8321e", surface: "#fde4da", encre: "#240803", surEncre: "#fff4ee",
  police: "font.nunito-sans", titres: "font.rubik",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#24080340",
});
const BRIQUE = "#c8321e", CORAIL = "#f2704f", ROSE = "#f9b8a3", ROSEP = "#fde4da", ENCRE4 = "#240803", FOND = "#fff4ee";
const escalier = modeleV2({
  id: identifiantV2(301, "escalier-du-lancement"), concept: "c-301-escalier-du-lancement",
  name: "Escalier du lancement", family: FAM,
  description: "Pour une application de transport : quatre marches alignées à gauche de largeurs décroissantes (marque et « Un pas de plus. », rubriques, boutiques, mentions) en rouge brique, corail et rose pâle. Pleine largeur sur mobile.",
  tags: ["application de transport", "escalier", "marches", "largeurs décroissantes", "rouge brique", "corail", "boutiques"],
  identity: marches,
  racine: racineDe(FOND),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, m = (largeur, fond, enfants, extra = {}) => k.col(enfants, { width: largeur, backgroundColor: fond, gap: "16px", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "40px", paddingRight: "40px", ...extra }, undefined, { width: "100%", paddingLeft: "20px", paddingRight: "20px" });
    const marque = caps(k, "■ Marée · Application de transport", { couleur: "#ffffff", suivi: "0.2em", police: S.head });
    const phrase = G.geant(`<p>Un pas de plus.</p>`, { taille: [44, 104], tablette: { taille: [64, 92] }, mobile: { taille: [44, 60] }, lh: 0.98, suivi: "-0.03em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const rub = (t, u) => lien(k, t, u, { taille: 16, poids: "700", couleur: ENCRE4, padH: "0px", survol: { color: "#ffffff", transform: { y: -2 } }, focus: ENCRE4 });
    const boutique = (t, u) => bouton(k, t, u, { texte: FOND, fond: ENCRE4, taille: 14, survol: { backgroundColor: "#ffffff", borderColor: ENCRE4, color: ENCRE4, transform: { y: -4 } }, focus: ENCRE4 });
    const marche = (marcheK, nom) => { const b = G.bande(k, [marcheK], { fond: FOND, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", aligne: "flex-start", nom }); b.styles.desktop.color = ENCRE4; return b; };
    const m1 = marche(m("100%", BRIQUE, [phrase, marque], { paddingTop: "56px", paddingBottom: "44px" }), "Marche 1");
    const m2 = marche(m("78%", CORAIL, [k.row([caps(k, "Rubriques", { couleur: ENCRE4, police: S.head }), rub("Itinéraires", "/blog"), rub("Nouveautés", "/blog"), rub("Aide et contact", "/faq")], { rowGap: "0px", columnGap: "28px", alignItems: "center" })], { paddingTop: "18px", paddingBottom: "18px" }), "Marche 2");
    const m3 = marche(m("56%", ROSE, [boutique("App Store ↗", APPLE), boutique("Google Play ↗", GOOGLE)], { paddingTop: "18px", paddingBottom: "18px" }), "Marche 3");
    const m4 = marche(m("34%", ROSEP, [G.ligneLegale({ taille: 13, couleur: S.mute, liens: ENCRE4, sansCookies: true, pile: true })(k, env)], { paddingTop: "16px", paddingBottom: "16px", minWidth: "260px" }), "Marche 4");
    return [G.racine(k, [m1, m2, m3, m4])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Applications mobiles", target: 6, built: true,
  description: "Pieds d'applications mobiles, angles droits, animations fluides : colonne latérale, mosaïque, nom monumental, damier des écrans, papier à en-tête, escalier.",
  models: [railApp, mosaiquePoche, luneEnGrand, damierEcrans, papierVersion, escalier],
};
