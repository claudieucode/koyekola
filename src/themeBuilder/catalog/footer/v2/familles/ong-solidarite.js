// Famille v2 « ONG et solidarité » — 6 modèles (ft2-380 à ft2-385), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Inspirations (idées de composition uniquement, aucune copie) : capture 29 (phrase à gauche, colonnes de liens à droite, mentions en bas), 30 (appel XXL, trois grands chiffres, formulaire), 28 (rangée de liens à flèches).
// Marques fictives ; AUCUNE coordonnée ni chiffre inventé : rubriques, campagnes et étapes sont des intitulés d'EXEMPLE à renommer dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (bouton qui se soulève, ligne qui s'indente, carré qui respire, case qui se soulève, repère qui s'inverse, lien qui se soulève).
const FAM = "ong-solidarite";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");
const I = require("../aides-illus-a09");

const DOUX = 360; // ms : transitions de survol / focus

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.55, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
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
const liensStd = (k, couleur, survol, liste, o = {}) => (liste || [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Espace client", "/connexion"]]).map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur, survol: { color: survol, transform: { x: 6 } }, focus: survol, ...o }));

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-380 « Barre du don » — association d'aide humanitaire   [archétype A : colonne latérale pleine hauteur, à DROITE ; capture 29 : phrase à gauche, deux colonnes de liens à droite]
// Idée : la grande phrase et les deux colonnes de liens de la capture 29 occupent la zone claire à gauche ; à droite une BARRE VERTICALE terre cuite sur toute la hauteur : « Agir. » en capitales, trois façons d'aider (donner, devenir bénévole, relayer) en lignes qui s'indentent, et le bouton « Faire un don ».
// Polices : Bitter (titres) et Nunito Sans. Mobile : la barre passe sous la zone claire.
const sable = identite({
  key: "c380", label: "Sable et terre cuite", humeur: "light",
  fond: "#fbf6ee", texte: "#2a1b14", discret: "#5c4639", accent: "#b43a0f", surface: "#ffffff", encre: "#2a1b14",
  police: "font.nunito-sans", titres: "font.bitter",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2a1b1433",
});
const SABLE = "#fbf6ee", TERRE = "#b43a0f", CAFE = "#2a1b14";

const barreDon = modeleV2({
  id: identifiantV2(380, "barre-du-don"), concept: "c-380-barre-du-don",
  name: "Barre du don", family: FAM,
  description: "Pour une association d'aide humanitaire : une grande phrase et deux colonnes de liens sur fond sable, et à droite une barre verticale terre cuite sur toute la hauteur avec « Agir », trois façons d'aider et le bouton « Faire un don ».",
  tags: ["association", "humanitaire", "barre latérale", "don", "terre cuite", "sable", "slab serif", "angles droits"],
  identity: sable,
  racine: racineDe(SABLE),
  widgets: ["sitetitle", "text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 22, TERRE, { fontWeight: "800" });
    const phrase = G.geant(`<p>Là où la vie est fragile,<br>nous restons.</p>`, { taille: [32, 64], tablette: { taille: [30, 48] }, mobile: { taille: [28, 36] }, lh: 1.08, suivi: "-0.01em", poids: "700", police: S.head, couleur: CAFE })(k, env);
    const col = (titre, liste) => G.colonne(k, [caps(k, titre, { couleur: TERRE }), ...liensStd(k, CAFE, TERRE, liste, { taille: 17, poids: "600" })], { poids: 1, min: "160px", gap: "0px" });
    const adresse = coordonnees(k, { taille: 15, lien: CAFE, survol: TERRE, focus: TERRE });
    const cols = G.ligne(k, [col("Nos actions", [["Urgences", "/faq"], ["Santé et eau", "/faq"], ["Éducation", "/faq"], ["Rapports", "/blog"]]), col("L'association", [["Qui sommes-nous", "/faq"], ["Presse", "/blog"], ["Transparence", "/faq"], ["Contact", "/contact"]])], { gap: "24px 32px", aligne: "flex-start", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#5c4639", liens: CAFE })(k, env);
    const tete = k.row([nom, caps(k, "Aide humanitaire", { couleur: CAFE, suivi: "0.24em" })], { justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" });
    const principal = k.col([tete, phrase, cols], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "44px", justifyContent: "space-between", paddingTop: "72px", paddingBottom: "32px", paddingLeft: "64px", paddingRight: "56px", backgroundColor: SABLE, borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "48px", minWidth: "100%" });
    const aide = (t, u) => {
      const a = lien(k, t, u, { taille: 19, poids: "700", couleur: "#ffffff", bloc: true, h: "52px", survol: { color: CAFE }, focus: "#ffffff", extra: { width: "100%", paddingLeft: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff77" } });
      a.states = { ...(a.states || {}), hover: { color: CAFE, backgroundColor: "#ffffff", paddingLeft: "16px" } };
      return a;
    };
    const mot = G.geant(`<p>Agir.</p>`, { taille: [56, 96], tablette: { taille: [56, 80] }, mobile: { taille: [56, 80] }, lh: 0.9, suivi: "0em", poids: "800", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const btn = lien(k, "Faire un don", "/contact", { taille: 17, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: TERRE, h: "58px", padH: "32px", survol: { backgroundColor: CAFE, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", justifyContent: "center", alignSelf: "stretch" } });
    const barre = k.col([I.W(k, I.dunes380(), { maxWidth: "300px" }), caps(k, "Trois façons d'aider", { couleur: "#ffffff", suivi: "0.2em" }), mot, k.col([aide("Donner", "/contact"), aide("Devenir bénévole", "/contact"), aide("Relayer notre appel", "/blog")], { gap: "0px", width: "100%" }), btn], { flexGrow: 0, flexShrink: 0, flexBasis: "340px", width: "340px", gap: "26px", paddingTop: "72px", paddingBottom: "56px", paddingLeft: "36px", paddingRight: "36px", backgroundColor: TERRE, borderRadius: "0px" }, { width: "280px", flexBasis: "280px", paddingLeft: "24px", paddingRight: "24px" }, { width: "100%", flexBasis: "auto", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const corps = G.bande(k, [k.row([principal, barre], { gap: "0px", flexWrap: "wrap", alignItems: "stretch", width: "100%" })], { fond: SABLE, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Barre latérale" });
    const pied = G.bande(k, [G.colonne(k, [adresse], { poids: 1, min: "260px" }), G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { fond: SABLE, gap: "20px 40px", aligne: "flex-end", padV: ["24px", "24px", "24px"], padB: ["28px", "28px", "24px"], padH: ["64px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: "#2a1b1433" }, nom: "Adresse" });
    return [G.racine(k, [corps, pied])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-381 « Appel à agir » — ONG de défense des droits   [archétype F : bandeau d'appel XXL en haut + liens en une seule colonne étroite à droite ; capture 30 : « Subscribe… » en gros + bouton]
// Idée : en haut un BANDEAU XXL jaune tournesol : une phrase d'appel démesurée en noir et un gros bouton « Signer et agir » ; dessous, sur noir, à gauche la lettre d'information et les coordonnées, à droite UNE SEULE colonne étroite de liens en capitales condensées qui glissent.
// Polices : League Gothic (appel) et Work Sans. Mobile : appel réduit, colonne de liens sous la lettre.
const tournesol = identite({
  key: "c381", label: "Tournesol et noir", humeur: "dark",
  fond: "#111111", texte: "#f5f5f0", discret: "#bdbdb4", accent: "#ffc933", surface: "#1c1c1c", encre: "#111111", surEncre: "#f5f5f0",
  police: "font.work-sans", titres: "font.league-gothic",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f5f5f040",
});
const JAUNE2 = "#ffc933", NOIR3 = "#111111", BLANC3 = "#f5f5f0";

const appelAgir = modeleV2({
  id: identifiantV2(381, "appel-a-agir"), concept: "c-381-appel-a-agir",
  name: "Appel à agir", family: FAM,
  description: "Pour une ONG de défense des droits : un bandeau jaune tournesol XXL avec une phrase d'appel démesurée et un gros bouton, puis sur noir la lettre d'information et les coordonnées à gauche, une seule colonne étroite de liens à droite.",
  tags: ["ONG", "droits humains", "appel", "bandeau XXL", "jaune", "noir", "condensé", "angles droits"],
  identity: tournesol,
  racine: racineDe(NOIR3),
  widgets: ["sitetitle", "text", "link", "html", "emailsubscribe", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const appel = G.geant(`<p>Se taire n'est<br>pas une option.</p>`, { taille: [64, 200], tablette: { taille: [96, 160] }, mobile: { taille: [60, 80] }, lh: 0.88, suivi: "0.005em", poids: "400", police: S.head, couleur: NOIR3, extra: { textTransform: "uppercase" } })(k, env);
    const btn = lien(k, "Signer et agir", "/contact", { taille: 20, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: JAUNE2, h: "68px", padH: "40px", survol: { backgroundColor: "#ffffff", color: NOIR3, transform: { y: -4 } }, focus: NOIR3, extra: { backgroundColor: NOIR3, justifyContent: "center", alignSelf: "flex-start" } });
    const haut = G.bande(k, [caps(k, "Pétitions et campagnes", { couleur: NOIR3, suivi: "0.24em" }), appel, btn], { fond: JAUNE2, colonne: true, gap: "28px", padV: ["88px", "72px", "48px"], padB: ["40px", "32px", "24px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const cortege = G.bande(k, [I.W(k, I.cortege381())], { fond: JAUNE2, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Cortège" });
    const nom = nomDuSite(k, env, 24, BLANC3, { fontWeight: "400", fontFamily: S.head, letterSpacing: "0.04em" });
    const abo = lettre(k, env, G, { titre: "Suivre les campagnes", intro: "Un message de temps en temps, jamais de pression.", bouton: "S'abonner", largeur: "400px", accent: JAUNE2, surBouton: NOIR3, texte: BLANC3, couleurTitre: JAUNE2, fond: NOIR3, survolBouton: BLANC3, survolTexte: NOIR3, focus: BLANC3 });
    const gauche = G.colonne(k, [nom, G.ligne(k, [G.colonne(k, [abo], { poids: 1, min: "260px" }), G.colonne(k, [coordonnees(k, { taille: 15, lien: BLANC3, survol: JAUNE2, focus: JAUNE2 })], { poids: 1, min: "200px" })], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" })], { poids: 3, min: "280px", gap: "28px" });
    const l = (t, u) => lien(k, t, u, { taille: 24, poids: "400", police: S.head, casse: "uppercase", suivi: "0.05em", couleur: BLANC3, bloc: true, h: "52px", survol: { color: JAUNE2, transform: { x: 8 } }, focus: JAUNE2, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f5f5f040" } });
    const droite = G.colonne(k, [caps(k, "Rubriques", { couleur: JAUNE2, suivi: "0.2em" }), l("Nos campagnes", "/blog"), l("Témoignages", "/blog"), l("Agir près de chez vous", "/contact"), l("Transparence", "/faq"), l("Presse", "/blog")], { poids: 1, min: "240px", gap: "6px", extra: { maxWidth: "320px" }, aligne: "stretch" });
    const milieu = G.bande(k, [gauche, droite], { fond: NOIR3, gap: "40px 80px", aligne: "flex-start", padV: ["64px", "48px", "36px"], padB: ["40px", "32px", "24px"], padH: ["48px", "32px", "20px"], nom: "Lettre et liens" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#bdbdb4", liens: BLANC3 })(k, env);
    const bas = G.bande(k, [mentions], { fond: NOIR3, colonne: true, padV: ["0px", "0px", "0px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    bas.styles.desktop.color = BLANC3;
    return [G.racine(k, [haut, cortege, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-382 « Mosaïque solidaire » — association d'entraide locale   [archétype H : mosaïque asymétrique, une grande case + trois petites ; capture 30 : blocs sur fond sombre, bouton rose]
// Idée : une GRANDE case verte pleine largeur (mission, lettre d'information) et dessous trois petites cases égales de couleurs franches (rose « Faire un don », jaune « Devenir bénévole », blanche « Nos actions ») ; chaque petite case se soulève et épaissit son filet bas au survol. Fine barre d'adresse et de mentions.
// Polices : DM Serif Display et Mulish. Mobile : la grande case puis les trois petites en pile.
const prairie = identite({
  key: "c382", label: "Vert prairie, rose et jaune", humeur: "light",
  fond: "#fff7f0", texte: "#14352a", discret: "#33584a", accent: "#1f6f50", surface: "#ffffff", encre: "#14352a",
  police: "font.mulish", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#14352a33",
});
const CREME2 = "#fff7f0", VERT = "#1f6f50", VERTF = "#14352a", ROSE = "#f9c5d1", PAILLE = "#fde68a";

const mosaiqueSolidaire = modeleV2({
  id: identifiantV2(382, "mosaique-solidaire"), concept: "c-382-mosaique-solidaire",
  name: "Mosaïque solidaire", family: FAM,
  description: "Pour une association d'entraide locale : une grande case verte avec la mission et la lettre d'information, trois petites cases franches dessous (don, bénévolat, actions) qui se soulèvent, et une barre d'adresse et de mentions.",
  tags: ["association", "entraide", "mosaïque", "vert", "rose", "jaune", "serif", "angles droits"],
  identity: prairie,
  racine: racineDe(VERTF),
  widgets: ["sitetitle", "text", "link", "html", "emailsubscribe", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 34, "#ffffff", { fontWeight: "400" });
    const abo = lettre(k, env, G, { titre: "Lettre des bénévoles", intro: "Les rendez-vous et les besoins du moment, par courriel.", bouton: "S'abonner", largeur: "400px", accent: PAILLE, surBouton: VERTF, texte: "#ffffff", couleurTitre: PAILLE, fond: VERT, survolBouton: "#ffffff", survolTexte: VERTF, focus: "#ffffff" });
    const grande = k.row([k.col([k.row([souffle(carre(k, PAILLE, "10px"), 3200), caps(k, "Entraide de proximité", { couleur: "#ffffff", suivi: "0.22em" })], { gap: "10px", alignItems: "center" }), G.geant(`<p>Un voisin aidé,<br>c'est un quartier plus fort.</p>`, { taille: [30, 56], tablette: { taille: [30, 44] }, mobile: { taille: [28, 34] }, lh: 1.1, suivi: "-0.01em", poids: "400", police: S.head, couleur: "#ffffff" })(k, env), nom], { flexGrow: 3, flexBasis: "0px", minWidth: "280px", gap: "20px" }), k.col([abo], { flexGrow: 2, flexBasis: "0px", minWidth: "280px", justifyContent: "flex-end" })], { width: "100%", boxSizing: "border-box", rowGap: "32px", columnGap: "56px", alignItems: "flex-end", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "48px", paddingRight: "48px", backgroundColor: VERT, borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const petite = (t, texte, url, fond) => {
      const a = lien(k, `${t}  →`, url, { taille: 26, poids: "400", police: S.head, couleur: VERTF, survol: { color: VERTF, transform: { x: 6 } }, focus: VERTF, h: "48px" });
      const c = k.col([a, para(k, texte, { taille: 15, couleur: VERTF })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", minHeight: "140px", gap: "6px", paddingTop: "24px", paddingBottom: "22px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: fond, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "0px", borderColor: VERTF, borderRadius: "0px", transitionDuration: DOUX, boxSizing: "border-box" }, undefined, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px" });
      c.states = { hover: { transform: { y: -6 }, borderBottomWidth: "8px" } };
      return c;
    };
    const trois = G.ligne(k, [petite("Faire un don", "Chaque geste compte, même modeste.", "/contact", ROSE), petite("Devenir bénévole", "Donnez un peu de votre temps.", "/contact", PAILLE), petite("Nos actions", "Ce que nous faisons, près de chez vous.", "/faq", "#ffffff")], { gap: "10px", aligne: "stretch", largeur: "100%" });
    const mosaique = k.col([grande, trois], { gap: "10px", width: "100%" });
    const haut = G.bande(k, [mosaique], { fond: CREME2, colonne: true, padV: ["24px", "24px", "20px"], padB: ["56px", "44px", "28px"], padH: ["48px", "32px", "20px"], nom: "Mosaïque" });
    const adresse = G.colonne(k, [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: PAILLE, focus: PAILLE })], { poids: 1, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfe3da", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [trait(k, "#ffffff55"), k.row([adresse, G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { rowGap: "20px", columnGap: "40px", alignItems: "flex-end", width: "100%" })], { fond: VERTF, colonne: true, gap: "24px", padV: ["32px", "28px", "24px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Adresse" });
    bas.styles.desktop.color = "#ffffff";
    const entete = G.bande(k, [caps(k, "Association d'entraide", { couleur: VERTF, suivi: "0.24em" }), caps(k, "Bénévoles et voisins", { couleur: VERT, suivi: "0.24em" })], { fond: CREME2, gap: "10px 40px", aligne: "center", padV: ["40px", "32px", "24px"], padB: ["0px", "0px", "0px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const rue = G.bande(k, [I.W(k, I.quartier382())], { fond: CREME2, colonne: true, padV: ["16px", "12px", "8px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Quartier" });
    return [G.racine(k, [entete, rue, haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-383 « Barre d'entraide » — fondation   [archétype D : ligne unique type barre de navigation inversée ; capture 29 : copyright à gauche, liens légaux à droite]
// Idée : tout tient sur UNE ligne compacte bleu roi : le nom de la fondation à gauche, cinq liens au centre, le bouton ambre « Faire un don » à droite ; une seconde ligne très fine porte les mentions. Rien d'autre : le pied d'un site qui va à l'essentiel.
// Polices : Barlow Semi Condensed. Animation : le bouton se soulève, les liens se soulignent. Mobile : la ligne devient une pile.
const roi = identite({
  key: "c383", label: "Bleu roi et ambre", humeur: "dark",
  fond: "#1e3a8a", texte: "#f4f7ff", discret: "#c3d0f5", accent: "#fbbf24", surface: "#2748a8", encre: "#1e3a8a", surEncre: "#f4f7ff",
  police: "font.barlow-semi-condensed", titres: "font.barlow-semi-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f4f7ff40",
});
const ROI = "#1e3a8a", ROI2 = "#17306f", AMBRE = "#fbbf24", GLACE2 = "#f4f7ff";

const barreEntraide = modeleV2({
  id: identifiantV2(383, "barre-d-entraide"), concept: "c-383-barre-d-entraide",
  name: "Barre d'entraide", family: FAM,
  description: "Pour une fondation : tout tient sur une ligne compacte bleu roi, avec le nom à gauche, cinq liens au centre et le bouton ambre « Faire un don » à droite, puis une fine ligne de mentions. Le pied d'un site qui va à l'essentiel.",
  tags: ["fondation", "ligne unique", "compact", "barre", "bleu roi", "ambre", "condensé", "angles droits"],
  identity: roi,
  racine: racineDe(ROI2),
  widgets: ["sitetitle", "text", "link", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 26, GLACE2, { fontWeight: "700", letterSpacing: "0.02em" });
    const l = (t, u) => k.row([carre(k, AMBRE, "8px"), lien(k, t, u, { taille: 17, poids: "600", casse: "uppercase", suivi: "0.08em", couleur: GLACE2, padH: "6px", survol: { color: AMBRE, transform: { y: -2 } }, focus: AMBRE })], { gap: "4px", alignItems: "center", flexWrap: "nowrap" });
    const liens = k.row([l("Missions", "/faq"), l("Projets", "/faq"), l("Rapports", "/blog"), l("Presse", "/blog"), l("Contact", "/contact")], { rowGap: "0px", columnGap: "22px", alignItems: "center", justifyContent: "center" });
    const btn = lien(k, "Faire un don", "/contact", { taille: 17, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: ROI2, h: "52px", padH: "28px", survol: { backgroundColor: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: AMBRE, justifyContent: "center" } });
    const ligne1 = G.bande(k, [k.row([nom, liens], { rowGap: "16px", columnGap: "40px", alignItems: "center", flexWrap: "wrap" }), btn], { fond: ROI, rowGap: "16px", columnGap: "32px", aligne: "center", padV: ["28px", "28px", "28px"], padB: ["28px", "28px", "24px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "10px" }, nom: "Ligne unique" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c3d0f5", liens: GLACE2 })(k, env);
    const bas = G.bande(k, [mentions], { fond: ROI2, colonne: true, padV: ["16px", "14px", "14px"], padB: ["16px", "14px", "14px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    bas.styles.desktop.color = GLACE2;
    const fine = G.bande(k, [caps(k, "Fondation reconnue d'intérêt général", { couleur: AMBRE, suivi: "0.24em" })], { fond: ROI2, colonne: true, padV: ["14px", "12px", "12px"], padB: ["14px", "12px", "12px"], padH: ["48px", "32px", "20px"], filetHaut: { epaisseur: "0px", couleur: ROI2 }, nom: "Mention" });
    const onde = G.bande(k, [I.W(k, I.vagues383())], { fond: ROI, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Vagues" });
    return [G.racine(k, [fine, ligne1, onde, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-384 « Le chemin du don » — ONG de santé   [archétype I : frise horizontale en trois étapes à repères carrés ; capture 30 : chiffres géants alignés en rangée, titre et bouton]
// Idée : à la place des trois gros chiffres de la capture, une FRISE en trois étapes (Vous donnez, Nous agissons, Nous rendons compte) sur fond blanc : repères carrés magenta reliés par un filet noir ; au survol le repère s'inverse. Une ligne sous la frise : liens, bouton, adresse. Aucun chiffre.
// Polices : Epilogue et Source Sans 3. Mobile : étapes empilées.
const magenta = identite({
  key: "c384", label: "Blanc, noir et magenta", humeur: "light",
  fond: "#ffffff", texte: "#16101a", discret: "#4a3f52", accent: "#be185d", surface: "#f6f0f4", encre: "#16101a",
  police: "font.source-sans-3", titres: "font.epilogue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#16101a",
});
const MAG = "#be185d", ENCRE4 = "#16101a";

const cheminDon = modeleV2({
  id: identifiantV2(384, "le-chemin-du-don"), concept: "c-384-le-chemin-du-don",
  name: "Le chemin du don", family: FAM,
  description: "Pour une ONG de santé : une frise en trois étapes (vous donnez, nous agissons, nous rendons compte) à repères carrés magenta reliés par un filet noir, sur fond blanc ; le repère s'inverse au survol. Liens, bouton et adresse sur une ligne.",
  tags: ["ONG", "santé", "frise", "étapes", "blanc", "magenta", "noir", "angles droits"],
  identity: magenta,
  racine: racineDe(ENCRE4),
  widgets: ["sitetitle", "text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 24, ENCRE4, { fontWeight: "800" });
    const titre = G.geant(`<p>Votre don,<br>étape par étape.</p>`, { taille: [30, 52], tablette: { taille: [36, 48] }, mobile: { taille: [32, 40] }, lh: 1.04, suivi: "-0.02em", poids: "800", police: S.head, couleur: ENCRE4 })(k, env);
    const etape = (lettreE, t, texte, url, dernier) => {
      const rep = k.col([k.T(`<p>${lettreE}</p>`, { fontSize: "20px", fontWeight: "800", fontFamily: S.head, color: "#ffffff", lineHeight: 1, textAlign: "center" })], { width: "52px", height: "52px", flexShrink: 0, alignItems: "center", justifyContent: "center", backgroundColor: MAG, borderStyle: "solid", borderWidth: "2px", borderColor: MAG, borderRadius: "0px", transitionDuration: DOUX });
      rep.states = { hover: { backgroundColor: "#ffffff" } };
      const filet = k.col([], { flexGrow: 1, height: "2px", backgroundColor: dernier ? "transparent" : ENCRE4, borderRadius: "0px" });
      const marque = k.row([rep, filet], { flexWrap: "nowrap", alignItems: "center", gap: "0px", width: "100%" });
      const a = lien(k, t, url, { taille: 24, poids: "800", police: S.head, couleur: ENCRE4, survol: { color: MAG, transform: { x: 6 } }, focus: MAG, h: "48px" });
      return k.col([marque, a, para(k, texte, { taille: 16, couleur: "#4a3f52" })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "10px", paddingRight: "24px" }, undefined, { minWidth: "100%" });
    };
    const frise = G.ligne(k, [etape("A", "Vous donnez", "Un don, régulier ou ponctuel, en quelques minutes.", "/contact"), etape("B", "Nous agissons", "Les équipes sur le terrain soignent et préviennent.", "/faq"), etape("C", "Nous rendons compte", "Les comptes et rapports sont publics.", "/blog", true)], { gap: "32px 0px", aligne: "flex-start", largeur: "100%" });
    const milieu = G.bande(k, [G.colonne(k, [nom, titre], { poids: 3, min: "300px", gap: "16px" }), Object.assign(frise.styles.desktop, { flexGrow: 5, flexBasis: "0px", minWidth: "300px", width: "auto" }) && frise], { fond: "#ffffff", rowGap: "40px", columnGap: "56px", aligne: "flex-start", padV: ["88px", "64px", "44px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Titre et frise" });
    const btn = lien(k, "Faire un don", "/contact", { taille: 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: "#ffffff", h: "54px", padH: "30px", survol: { backgroundColor: ENCRE4, transform: { y: -3 } }, focus: ENCRE4, extra: { backgroundColor: MAG, justifyContent: "center" } });
    const adresse = G.colonne(k, [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: "#f9a8d4", focus: "#f9a8d4" })], { poids: 2, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9cfe0", liens: "#ffffff" })(k, env);
    const lm = (t, u) => lien(k, t, u, { taille: 16, poids: "600", couleur: "#ffffff", padH: "4px", survol: { color: "#f9a8d4", transform: { y: -2 } }, focus: "#f9a8d4" });
    const bas = G.bande(k, [k.row([lm("Missions", "/faq"), lm("Rapports", "/blog"), lm("Presse", "/blog"), lm("Contact", "/contact"), btn], { rowGap: "4px", columnGap: "24px", alignItems: "center", width: "100%" }), trait(k, "#ffffff55"), adresse, mentions], { fond: ENCRE4, colonne: true, gap: "24px", padV: ["48px", "40px", "32px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Contact" });
    bas.styles.desktop.color = "#ffffff";
    const pouls = G.bande(k, [I.W(k, I.pouls384b())], { fond: "#0b050a", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Pouls" });
    return [G.racine(k, [milieu, pouls, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-385 « Papier de l'association » — association caritative   [archétype J : papier à en-tête, cartouche centré, doubles filets, liens en ligne centrée ; capture 29 : texte sobre sur aplat]
// Idée : un papier à en-tête sur terre brune : double filet or, nom de l'association en grand serif centré, devise en italique, ligne centrée de liens, adresse centrée, double filet. Aucune colonne, aucun widget de lettre : la retenue d'une association de longue date.
// Polices : EB Garamond et Karla. Animation : les liens se soulignent d'un filet qui s'étire. Mobile : liens en deux lignes centrées.
const brun = identite({
  key: "c385", label: "Terre brune et or pâle", humeur: "dark",
  fond: "#4a2416", texte: "#f6e9d6", discret: "#dcc3a4", accent: "#f0b36a", surface: "#5a2d1c", encre: "#4a2416", surEncre: "#f6e9d6",
  police: "font.karla", titres: "font.eb-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#f6e9d655",
});
const BRUN = "#4a2416", PAPIER = "#f6e9d6", OR = "#f0b36a";

const papierAssociation = modeleV2({
  id: identifiantV2(385, "papier-de-l-association"), concept: "c-385-papier-de-l-association",
  name: "Papier de l'association", family: FAM,
  description: "Pour une association caritative : un papier à en-tête sur terre brune, avec double filet or, nom en grand serif centré, devise en italique, une ligne centrée de liens, l'adresse centrée et un second double filet. Sobre et durable.",
  tags: ["association", "caritatif", "papier à en-tête", "centré", "doubles filets", "brun", "or", "serif", "angles droits"],
  identity: brun,
  racine: racineDe(BRUN),
  widgets: ["sitetitle", "text", "link", "html", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const double = () => k.col([trait(k, OR, "1px"), trait(k, OR, "1px")], { gap: "5px", width: "100%" });
    const nom = nomDuSite(k, env, 64, PAPIER, { fontWeight: "500", letterSpacing: "0em", textAlign: "center" });
    nom.styles.desktop.fontSize = "fluid:38-80";
    const devise = para(k, "Donner, partager, durer.", { taille: 22, couleur: "#dcc3a4", police: S.head, align: "center", extra: { fontStyle: "italic" } });
    const l = (t, u) => lien(k, t, u, { taille: 16, poids: "600", casse: "uppercase", suivi: "0.14em", couleur: PAPIER, padH: "8px", survol: { color: OR, transform: { y: -2 } }, focus: OR });
    const liens = k.row([l("Missions", "/faq"), l("Faire un don", "/contact"), l("Bénévolat", "/contact"), l("Rapports", "/blog"), l("Contact", "/contact")], { rowGap: "0px", columnGap: "26px", justifyContent: "center", alignItems: "center" });
    const adresse = coordonnees(k, { taille: 15, lien: PAPIER, survol: OR, focus: OR, couleur: "#dcc3a4" });
    const adr = k.col([adresse], { alignItems: "center", textAlign: "center", width: "100%", maxWidth: "340px", marginLeft: "auto", marginRight: "auto" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#dcc3a4", liens: PAPIER })(k, env, true);
    const tete = G.bande(k, [k.col([double(), I.W(k, I.sceau385(), { maxWidth: "180px", marginLeft: "auto", marginRight: "auto" }), k.col([caps(k, "Association d'entraide", { couleur: OR, suivi: "0.3em", extra: { textAlign: "center" } }), nom, devise], { gap: "14px", alignItems: "center", width: "100%" }), liens, double()], { gap: "36px", alignItems: "stretch", width: "100%", boxSizing: "border-box", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", borderStyle: "solid", borderWidth: "1px", borderColor: "#f0b36a88", borderRadius: "0px" })], { fond: BRUN, colonne: true, gap: "36px", padV: ["80px", "64px", "44px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "En-tête" });
    const bas = G.bande(k, [adr, mentions], { fond: BRUN, colonne: true, gap: "28px", padV: ["16px", "12px", "8px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "20px" }, nom: "Adresse" });
    bas.styles.desktop.color = PAPIER;
    return [G.racine(k, [tete, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "ONG et solidarité", target: 6, built: true,
  description: "Pieds d'ONG et d'associations, à angles droits : barre latérale du don, bandeau d'appel XXL, mosaïque solidaire, ligne unique, frise du don, papier à en-tête.",
  models: [barreDon, appelAgir, mosaiqueSolidaire, barreEntraide, cheminDon, papierAssociation],
};
