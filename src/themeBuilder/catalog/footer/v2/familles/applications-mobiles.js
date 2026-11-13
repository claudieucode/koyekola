// Famille v2 « Applications mobiles » — 6 modèles (ft2-296 à ft2-301), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds d'applications mobiles (marques fictives). Aucune image ni capture d'écran (les « boutons de boutique » sont des liens texte vers l'accueil des boutiques d'applications, adresses d'EXEMPLE à remplacer par celles de l'application),
// aucun chiffre, note ni nombre de téléchargements inventés. Les rubriques (Fonctionnalités, Nouveautés, Aide…) sont des intitulés d'exemple. Chaque modèle a sa palette, ses polices (2 au plus) et son archétype
// de composition (A, H, B, C, J, L), en mode « solo ». Refonte « illustrée » : chaque pied reprend le parti pris visuel d'une capture (07 : logo + halo d'arcs + colonnes + lettre ; 08 : grand appel en serif + champ à contour puis bloc sombre ; 09 : titre centré + colonnes + barre de logo) avec un dessin SVG propre. Composition seulement.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 14 px) ; UNE animation visible par modèle (carré qui respire, case qui se remplit,
// bouton qui se soulève, ligne qui s'indente) ; pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");
const I = require("../aides-illus-a02");

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
const colLiens = (k, titre, liste, o = {}) => k.col([caps(k, titre, { couleur: o.titreCouleur, police: o.policeTitre || k.S.head, suivi: "0.18em" }),
  ...liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.couleur, padH: "0px", police: o.police, survol: o.survol, focus: o.focus }))], { gap: "2px", flexGrow: 1, flexBasis: o.base || "150px", minWidth: "130px" });
const reseauxMini = (G, k, env, o) => G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, poids: "600", couleur: o.couleur, survol: o.survol, focus: o.focus })(k, env);

// ═══ ft2-296 « Rail d'application » — application grand public — capture 07 : marque, halo bleu lumineux, colonnes, lettre, téléphone dessiné ═══
// Fond bleu nuit à dégradé électrique : à gauche marque Pomelo, promesse et boutons de boutique ; au centre trois colonnes ; à droite un grand TÉLÉPHONE dessiné (liste cochée) dans un halo ; en dessous lettre et mentions.
const rail = identite({
  key: "c296", label: "Bleu nuit et bleu électrique", humeur: "dark",
  fond: "#070d3a", texte: "#f2f4ff", discret: "#b4bcee", accent: "#ffe14d", surface: "#101a6a", encre: "#070d3a", surEncre: "#f2f4ff",
  police: "font.nunito-sans", titres: "font.plus-jakarta-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f2f4ff33",
});
const BLEUE = "#1d3fff", NUIT = "#070d3a", BLANC = "#ffffff", JAUNE = "#ffe14d";
const railApp = modeleV2({
  id: identifiantV2(296, "rail-d-application"), concept: "c-296-rail-d-application",
  name: "Rail d'application", family: FAM,
  description: "Pour une application grand public : fond bleu nuit à halo électrique, marque et boutons de boutique à gauche, trois colonnes, grand téléphone dessiné à droite, lettre d'information et mentions.",
  tags: ["application mobile", "grand public", "téléphone dessiné", "halo bleu", "boutons de boutique", "lettre"],
  identity: rail,
  racine: racineDe(NUIT),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "html"],
  compose(k, env, G) {
    const S = k.S;
    const marque = k.row([carre(k, JAUNE, "18px"), k.T("<p>Pomelo</p>", { fontSize: "fluid:40-64", fontWeight: "800", fontFamily: S.head, color: BLANC, letterSpacing: "-0.03em", lineHeight: 1 })], { gap: "14px", alignItems: "center", flexWrap: "nowrap" });
    souffle(marque.children ? marque.children[0] : marque, 2800);
    const promesse = k.T("<p>Vos listes, vos rappels et vos projets, au même endroit.</p>", { fontSize: "18px", lineHeight: 1.5, color: "#d3d9ff", fontFamily: S.font, maxWidth: "320px" });
    const boutique = (t, u) => bouton(k, t, u, { texte: NUIT, fond: BLANC, taille: 14, survol: { backgroundColor: JAUNE, borderColor: JAUNE, color: NUIT, transform: { y: -4 } }, focus: BLANC });
    const gauche = G.colonne(k, [marque, promesse, k.row([boutique("App Store ↗", APPLE), boutique("Google Play ↗", GOOGLE)], { gap: "10px" }), reseauxMini(G, k, env, { couleur: BLANC, survol: JAUNE, focus: JAUNE })], { poids: 1.2, base: "280px", min: "260px", gap: "24px" });
    const o = { titreCouleur: JAUNE, couleur: BLANC, survol: { color: JAUNE, transform: { x: 6 } }, focus: JAUNE };
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Nouveautés de l'application", intro: "Un message à chaque grande mise à jour.", bouton: "Je m'abonne", largeur: "100%", accent: JAUNE, texte: BLANC }), { titre: JAUNE, intro: "#d3d9ff", boutonTexte: NUIT, survolFond: BLANC, survolTexte: NUIT, focus: BLANC });
    const cols = k.col([k.row([colLiens(k, "Application", [["Fonctionnalités", "/blog"], ["Nouveautés", "/blog"], ["Confidentialité", "/faq"]], o), colLiens(k, "Aide", [["Questions", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]], o)], { rowGap: "24px", columnGap: "32px", alignItems: "flex-start", width: "100%" }), abo], { gap: "28px", flexBasis: "420px", flexGrow: 1.6 });
    const tel = G.colonne(k, [I.dessin(k, I.telephone296(), { maxWidth: "340px" })], { poids: 0.8, base: "260px", min: "220px", aligne: "center", justifie: "flex-end" });
    const haut = G.bande(k, [gauche, cols, tel], { fond: NUIT, degrade: { from: "#070d3a", to: "#1d3fff", angle: 125 }, gap: "36px 48px", aligne: "center", padV: ["72px", "56px", "44px"], padB: ["40px", "32px", "28px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Marque, colonnes et téléphone" });
    return [G.racine(k, [haut, mentionsBande(G, k, env, { fond: "#050a2c", texte: "#b4bcee", liens: BLANC })])];
  },
}, FAM);

// ═══ ft2-297 « Mosaïque de poche » — application de services — capture 07 : marque orange, halo chaud, vignettes d'icônes, colonnes, lettre ═══
const mosaique = identite({
  key: "c297", label: "Charbon, orange et crème", humeur: "dark",
  fond: "#141414", texte: "#fff3e0", discret: "#d6c9b6", accent: "#ff6a1a", surface: "#1f1f1f", encre: "#141414", surEncre: "#fff3e0",
  police: "font.karla", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#fff3e033",
});
const ORANGE = "#ff6a1a", NOIR = "#141414", CREME = "#fff3e0", MENTHE = "#b8f0d8";
const mosaiquePoche = modeleV2({
  id: identifiantV2(297, "mosaique-de-poche"), concept: "c-297-mosaique-de-poche",
  name: "Mosaïque de poche", family: FAM,
  description: "Pour une application de services : fond charbon à halo orange, nom Zéphyr et « Dans votre poche. » à gauche, quatre vignettes d'icônes dessinées à ombres dures à droite, colonnes de liens, lettre et mentions.",
  tags: ["application de services", "vignettes dessinées", "icônes", "halo orange", "boutons de boutique", "charbon"],
  identity: mosaique,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "html"],
  compose(k, env, G) {
    const S = k.S;
    const rec = k.row([souffle(carre(k, ORANGE, "16px"), 2600), caps(k, "Application Zéphyr", { couleur: ORANGE, suivi: "0.22em", police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Dans<br>votre <span style="color:${ORANGE}">poche</span>.</p>`, { taille: [52, 112], tablette: { taille: [72, 100] }, mobile: { taille: [52, 68] }, lh: 0.95, suivi: "-0.02em", poids: "800", police: S.head, couleur: CREME })(k, env);
    const boutique = (t, u) => bouton(k, t, u, { texte: NOIR, fond: ORANGE, taille: 14, survol: { backgroundColor: CREME, borderColor: CREME, color: NOIR, transform: { y: -4 } }, focus: CREME });
    const gauche = G.colonne(k, [rec, phrase, k.row([boutique("App Store ↗", APPLE), boutique("Google Play ↗", GOOGLE)], { gap: "10px" })], { poids: 1.3, base: "300px", min: "260px", gap: "26px" });
    const vign = G.colonne(k, [I.dessin(k, I.vignettes297(), { maxWidth: "330px" })], { poids: 0.8, base: "240px", min: "220px", aligne: "center" });
    const haut = G.bande(k, [gauche, vign], { fond: NOIR, degrade: { from: "#141414", to: "#4a1a03", angle: 135 }, gap: "32px 56px", aligne: "center", padV: ["80px", "60px", "44px"], padB: ["48px", "40px", "32px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Nom et vignettes" });
    const o = { titreCouleur: ORANGE, couleur: CREME, police: S.font, survol: { color: ORANGE, transform: { x: 6 } }, focus: ORANGE, policeTitre: S.head };
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Lettre", intro: "Les mises à jour, sans bruit.", bouton: "OK", largeur: "100%", accent: ORANGE, texte: CREME }), { titre: ORANGE, intro: "#d6c9b6", boutonTexte: NOIR, survolFond: CREME, survolTexte: NOIR, focus: CREME });
    const cols = G.bande(k, [colLiens(k, "Aide", [["Questions fréquentes", "/faq"], ["Contact", "/contact"]], o), colLiens(k, "Nouveautés", [["Le blog", "/blog"], ["Connexion", "/connexion"]], o), colLiens(k, "Société", [["À propos", "/blog"], ["Presse", "/contact"]], o), k.col([abo], { flexGrow: 1.6, flexBasis: "260px", minWidth: "240px" })], { fond: "#0d0d0d", gap: "28px 40px", aligne: "flex-start", padV: ["44px", "36px", "32px"], padB: ["44px", "36px", "32px"], padH: PH, innerMobile: { rowGap: "24px" }, filetHaut: { epaisseur: "4px", couleur: ORANGE }, nom: "Colonnes et lettre" });
    return [G.racine(k, [haut, cols, mentionsBande(G, k, env, { fond: NOIR, texte: "#d6c9b6", liens: CREME })])];
  },
}, FAM);

// ═══ ft2-298 « Lune en grand » — application de sommeil — capture 08 : scène nocturne, appel en serif centré, bloc sombre à marque ═══
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
  description: "Pour une application de sommeil : scène nocturne dessinée (croissant, étoiles, collines), appel centré en serif avec champ e-mail à contour, puis bloc violet sombre à marque « lune. », trois colonnes et boutiques.",
  tags: ["application de bien-être", "sommeil", "scène dessinée", "lune", "collines", "serif", "lilas", "lettre"],
  identity: lune,
  racine: racineDe(VIOLET),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "html"],
  compose(k, env, G) {
    const S = k.S;
    const scene = G.bande(k, I.dessinDeux(k, I.nuit298(1440, 300, "d"), I.nuit298(390, 200, "m"), {}), { fond: LILAS, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", aligne: "stretch", nom: "Scène nocturne" });
    const phrase = G.geant(`<p>Trouvons le <span style="color:#cfc2ff">calme</span> ensemble.</p>`, { taille: [40, 88], tablette: { taille: [60, 80] }, mobile: { taille: [40, 54] }, lh: 1, suivi: "-0.02em", poids: "400", police: S.head, couleur: "#ffffff", align: "center" })(k, env, true);
    const abo = ABO_STYLE(abonnement(k, env, { titre: "", intro: "Une histoire du soir, chaque semaine.", bouton: "Envoyer", largeur: "520px", accent: "#cfc2ff", texte: "#ffffff", soulignement: "2px" }), { titre: "#ffffff", intro: "#cfc2ff", boutonTexte: VIOLET, survolFond: "#ffffff", survolTexte: VIOLET, focus: "#ffffff" });
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, backgroundColor: "#cfc2ff" };
    souffle(abo, 3600);
    const nav = (t, u) => lien(k, t, u, { taille: 15, poids: "700", couleur: "#ffffff", casse: "uppercase", suivi: "0.14em", padH: "6px", survol: { color: "#cfc2ff", transform: { y: -3 } }, focus: "#ffffff" });
    const liens = G.ligne(k, [nav("Nuits", "/blog"), nav("Sons", "/blog"), nav("Aide", "/faq"), nav("Contact", "/contact"), nav("App Store ↗", APPLE), nav("Google Play ↗", GOOGLE)], { gap: "0px 22px", aligne: "center", justifie: "center" });
    const marque = k.T("<p>lune.</p>", { fontSize: "fluid:96-200", fontFamily: S.head, color: "#cfc2ff", lineHeight: 0.9, letterSpacing: "-0.03em", textAlign: "center" });
    const bloc = G.bande(k, [phrase, k.row([abo], { justifyContent: "center", width: "100%" }), trait(k, "#cfc2ff44"), liens, marque], { fond: VIOLET, colonne: true, gap: "30px", aligne: "center", padV: ["64px", "52px", "40px"], padB: ["40px", "32px", "28px"], padH: PH, max: "960px", nom: "Appel centré, liens et marque" });
    return [G.racine(k, [scene, bloc, mentionsBande(G, k, env, { fond: "#0e0922", texte: "#cfc2ff", liens: "#ffffff" })])];
  },
}, FAM);

// ═══ ft2-299 « Damier des écrans » — application multiplateforme — capture 08 : appel + champ, frise d'écrans dessinés, bloc sombre à quatre colonnes ═══
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
  description: "Pour une application multiplateforme : bandeau cyan « Un compte, tous vos écrans. » avec champ e-mail, grande frise dessinée d'écrans (portable, tablette, téléphone, montre) sur trame en damier, puis bloc charbon à quatre colonnes.",
  tags: ["application multiplateforme", "écrans dessinés", "damier", "cyan", "charbon", "condensé", "lettre"],
  identity: damier,
  racine: racineDe(CHARBON),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "html"],
  compose(k, env, G) {
    const S = k.S;
    const strip = G.bande(k, I.dessinDeux(k, I.ecrans299("0 0 1400 240", "d"), I.ecrans299("330 0 740 240", "m"), {}), { fond: CHARBON, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", aligne: "stretch", nom: "Écrans dessinés" });
    const base = { flexGrow: 1, flexBasis: "30%", minWidth: "260px", gap: "16px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "36px", paddingRight: "36px" };
    const phrase = G.geant(`<p>Un compte,<br>tous vos écrans.</p>`, { taille: [36, 64], tablette: { taille: [48, 60] }, mobile: { taille: [36, 48] }, lh: 0.98, suivi: "-0.01em", poids: "700", police: S.head, couleur: ENCRE2, casse: "uppercase" })(k, env);
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Lettre", intro: "Les mises à jour, sans bruit.", bouton: "OK", largeur: "100%", accent: ENCRE2, texte: ENCRE2, consentCouleur: ENCRE2 }), { titre: ENCRE2, intro: ENCRE2, boutonTexte: CYAN, survolFond: GIVRE, survolTexte: ENCRE2, focus: ENCRE2 });
    souffle(abo, 3000);
    const t1 = k.col([caps(k, "Application Relais", { couleur: ENCRE2, suivi: "0.22em", police: S.head }), phrase, abo], { backgroundColor: CYAN, ...base, flexBasis: "58%", justifyContent: "space-between", gap: "24px" });
    const o = { titreCouleur: CYAN, couleur: GIVRE, survol: { color: CYAN, transform: { x: 6 } }, focus: CYAN, taille: 18, poids: "600", police: S.head };
    const t2 = k.col([colLiens(k, "Télécharger", [["iPhone et iPad ↗", APPLE], ["Android ↗", GOOGLE], ["Version web", "/connexion"], ["Aide", "/faq"], ["Contact", "/contact"]], o)], { backgroundColor: ENCRE2, ...base });
    const tuiles = G.bande(k, [t1, t2], { fond: CHARBON, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Trois tuiles" });
    return [G.racine(k, [strip, tuiles, mentionsBande(G, k, env, { fond: ENCRE2, texte: "#aeb8bf", liens: GIVRE })])];
  },
}, FAM);

// ═══ ft2-300 « Papier de première version » — application de lecture — capture 09 : médaillon centré, titre, cinq colonnes centrées, barre de logo ═══
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
  description: "Pour une application de lecture : grand médaillon gravé (livre ouvert dans une couronne de rayons), titre centré, cinq colonnes centrées à filets, boutiques, lettre centrée et mentions. Ivoire, bordeaux, or terni.",
  tags: ["application de lecture", "médaillon dessiné", "centré", "cinq colonnes", "serif", "ivoire", "bordeaux"],
  identity: papier,
  racine: racineDe(IVOIRE),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider", "html"],
  compose(k, env, G) {
    const S = k.S, centre = { textAlign: "center" };
    const medaillon = k.row([I.dessin(k, I.medaillon300(), { maxWidth: "260px" })], { justifyContent: "center", width: "100%" });
    souffle(medaillon, 4000);
    const nom = G.geant(`<p>Pomona</p>`, { taille: [52, 108], tablette: { taille: [72, 96] }, mobile: { taille: [52, 68] }, lh: 1, suivi: "-0.01em", poids: "600", police: S.head, couleur: BORDEAUX, align: "center" })(k, env, true);
    const devise = k.T("<p>Des livres et des articles, dans la poche, hors connexion.</p>", { fontSize: "19px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, textAlign: "center", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Le courrier de la maison", intro: "Une lettre à chaque nouvelle version.", bouton: "Recevoir", largeur: "440px", accent: BORDEAUX, texte: ENCRE3 }), { titre: BORDEAUX, intro: S.mute, boutonTexte: IVOIRE, survolFond: ENCRE3, survolTexte: IVOIRE, focus: ENCRE3 });
    const haut = G.bande(k, [trait(k, BORDEAUX, "3px"), medaillon, nom, devise, k.row([abo], { justifyContent: "center", width: "100%" })], { fond: IVOIRE, colonne: true, gap: "20px", aligne: "center", padV: ["56px", "44px", "36px"], padB: ["32px", "28px", "24px"], padH: PH, max: "900px", nom: "Médaillon et titre" });
    haut.styles.desktop.color = ENCRE3;
    const o = { titreCouleur: BORDEAUX, couleur: ENCRE3, survol: { color: BORDEAUX, transform: { y: -2 } }, focus: BORDEAUX, taille: 16, police: S.font, policeTitre: S.head };
    const centrer = (c) => { c.styles.desktop = { ...c.styles.desktop, alignItems: "center", textAlign: "center" }; c.children.forEach((e) => { e.styles = e.styles || {}; e.styles.desktop = { ...(e.styles.desktop || {}), justifyContent: "center", textAlign: "center" }; }); return c; };
    const col = (t, l) => centrer(colLiens(k, t, l, o));
    const cols = k.row([col("Lire", [["Bibliothèque", "/blog"], ["Nouveautés", "/blog"], ["Hors connexion", "/faq"]]), col("Aide", [["Questions", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]]), col("Boutiques", [["App Store ↗", APPLE], ["Google Play ↗", GOOGLE], ["Instagram ↗", "https://www.instagram.com/"]])], { rowGap: "24px", columnGap: "28px", alignItems: "flex-start", width: "100%", maxWidth: "760px" });
    const milieu = G.bande(k, [cols], { fond: "#f4ecda", colonne: true, gap: "30px", aligne: "center", padV: ["40px", "36px", "32px"], padB: ["44px", "36px", "32px"], padH: PH, nom: "Colonnes et lettre" });
    milieu.styles.desktop.color = ENCRE3;
    return [G.racine(k, [haut, milieu, mentionsBande(G, k, env, { fond: IVOIRE, texte: "#5c3a42", liens: ENCRE3 })])];
  },
}, FAM);

// ═══ ft2-301 « Escalier du lancement » — application de transport — capture 09 : titre centré, ligne de bus en escalier dessinée, cinq colonnes, barre de logo ═══
const marches = identite({
  key: "c301", label: "Rouge brique, corail et rose pâle", humeur: "light",
  fond: "#fff4ee", texte: "#240803", discret: "#5d2f24", accent: "#c8321e", surface: "#fde4da", encre: "#240803", surEncre: "#fff4ee",
  police: "font.nunito-sans", titres: "font.rubik",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#24080340",
});
const BRIQUE = "#c8321e", CORAIL = "#f2704f", ROSE = "#f9b8a3", FOND = "#fff4ee", ENCRE4 = "#240803";
const escalier = modeleV2({
  id: identifiantV2(301, "escalier-du-lancement"), concept: "c-301-escalier-du-lancement",
  name: "Escalier du lancement", family: FAM,
  description: "Pour une application de transport : titre centré « Un pas de plus. », grande ligne de bus en escalier dessinée (tracé brique, corail et rose, arrêts carrés, autobus), cinq colonnes de liens et barre à logo, boutiques et mentions.",
  tags: ["application de transport", "ligne dessinée", "escalier", "autobus", "cinq colonnes", "rouge brique", "corail"],
  identity: marches,
  racine: racineDe(FOND),
  widgets: ["text", "link", "copyright", "bizlegal", "divider", "html"],
  compose(k, env, G) {
    const S = k.S;
    const strip = G.bande(k, I.dessinDeux(k, I.ligne301(1440, 230, "d"), I.ligne301(390, 170, "m"), {}), { fond: FOND, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", aligne: "stretch", nom: "Ligne de bus" });
    const phrase = G.geant(`<p>Un pas <span style="color:${BRIQUE}">de plus</span>.</p>`, { taille: [44, 96], tablette: { taille: [64, 88] }, mobile: { taille: [44, 60] }, lh: 1, suivi: "-0.03em", poids: "800", police: S.head, couleur: ENCRE4 })(k, env);
    const boutique = (t, u) => bouton(k, t, u, { texte: FOND, fond: ENCRE4, taille: 14, survol: { backgroundColor: BRIQUE, borderColor: BRIQUE, color: "#ffffff", transform: { y: -4 } }, focus: ENCRE4 });
    const logo = k.row([I.dessin(k, I.etoileLogo(8, "#c8321e", "#f2704f", "#240803"), { width: "44px", flexShrink: 0 }), caps(k, "Marée · Application de transport", { couleur: "#a52714", suivi: "0.2em", police: S.head })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    souffle(logo, 3200);
    const gauche = G.colonne(k, [logo, phrase, k.row([boutique("App Store ↗", APPLE), boutique("Google Play ↗", GOOGLE)], { gap: "10px" })], { poids: 1, base: "0px", min: "280px", gap: "24px" });
    const lk = (t, u) => lien(k, t, u, { taille: 17, poids: "700", couleur: ENCRE4, padH: "0px", survol: { color: BRIQUE, transform: { x: 8 } }, focus: BRIQUE });
    const rang = (titre, liste) => k.row([caps(k, titre, { couleur: "#a52714", police: S.head, extra: { flexBasis: "120px", flexShrink: 0 } }), G.ligne(k, liste.map(([t, u]) => lk(t, u)), { gap: "0px 26px", aligne: "center" })], { rowGap: "0px", columnGap: "24px", alignItems: "center", width: "100%", paddingTop: "6px", paddingBottom: "6px" });
    const droite = G.colonne(k, [trait(k, "#24080333"), rang("Itinéraires", [["Lignes", "/blog"], ["Horaires", "/blog"], ["Perturbations", "/blog"]]), trait(k, "#24080333"), rang("Billets", [["Tarifs", "/blog"], ["Abonnements", "/blog"], ["Paiement", "/faq"]]), trait(k, "#24080333"), rang("Aide", [["Questions", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]]), trait(k, "#24080333"), rang("Société", [["À propos", "/blog"], ["Presse", "/contact"], ["Recrutement", "/contact"]]), trait(k, "#24080333")], { poids: 1.3, base: "0px", min: "300px", gap: "0px" });
    const corps = G.bande(k, [gauche, droite], { fond: "#fde4da", gap: "36px 72px", aligne: "center", padV: ["56px", "44px", "36px"], padB: ["48px", "40px", "32px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Marque et rubriques" });
    corps.styles.desktop.color = ENCRE4;
    return [G.racine(k, [strip, corps, mentionsBande(G, k, env, { fond: "#fde4da", texte: S.mute, liens: ENCRE4 })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Applications mobiles", target: 6, built: true,
  description: "Pieds d'applications mobiles illustrés, angles droits, animations fluides : téléphone et halo, vignettes d'icônes, scène nocturne, écrans dessinés, médaillon gravé, ligne de bus.",
  models: [railApp, mosaiquePoche, luneEnGrand, damierEcrans, papierVersion, escalier],
};
