// Famille v2 « Droit et notariat » — 5 modèles (ft2-201 à ft2-205), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius), sobriété solennelle.
// Cabinet d'avocats, étude notariale, commissaire de justice (huissier), médiation, conseil juridique. Domaines d'intervention donnés en EXEMPLES (à remplacer dans l'éditeur) ; coordonnées et horaires lus dans les
// « Données de l'entreprise » ; AUCUNE mention déontologique inventée (titre professionnel, barreau ou chambre, assurance, numéros) : le pied dit seulement qu'elles sont à renseigner par le professionnel.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; au moins une animation visible par modèle (carré qui respire, rangée qui s'illumine, case qui se soulève, filet qui s'épaissit).
// Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const DOUX = 360; // ms : transitions de survol / focus

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
// petit carré plein (statut, repère) : jamais rond
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// Lettre d'information : habille toutes les parties du widget pour un fond précis (angles droits)
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
const FAM = "droit-notariat";
const rangee = (k, label, url, o) => lien(k, label, url, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, police: o.police, bloc: true, h: o.h || "48px", padH: o.padH || "12px", survol: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, transform: { x: o.glisse ?? 6 } }, focus: o.focus, extra: { width: "100%", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.ligne } });
const panneau = (k, enfants, o = {}) => k.col(enfants, { flexGrow: o.poids ?? 1, flexBasis: o.base || "0px", minWidth: o.min || "320px", gap: o.gap || "16px", justifyContent: o.justifie, alignItems: o.aligne || "flex-start", paddingTop: o.padV?.[0] || "56px", paddingBottom: o.padV?.[0] || "56px", paddingLeft: o.padH?.[0] || "56px", paddingRight: o.padH?.[0] || "56px", backgroundColor: o.fond, minHeight: o.hauteur, borderRadius: "0px", borderStyle: "solid", borderWidth: "0px", ...(o.extra || {}) },
  { paddingTop: o.padV?.[1] || "44px", paddingBottom: o.padV?.[1] || "44px", paddingLeft: o.padH?.[1] || "32px", paddingRight: o.padH?.[1] || "32px" },
  { paddingTop: o.padV?.[2] || "36px", paddingBottom: o.padV?.[2] || "36px", paddingLeft: o.padH?.[2] || "20px", paddingRight: o.padH?.[2] || "20px", minWidth: "0px", flexBasis: "100%" });
const rangeeDe = (k, enfants, o = {}) => k.row(enfants, { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", backgroundColor: o.fond, ...(o.extra || {}) });
const NOTE_DEONTO = "Mentions professionnelles (titre, ordre ou chambre d'inscription, assurance, médiation) : à renseigner par le professionnel dans l'éditeur ; rien n'est inventé ici.";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-201 « Index des domaines » — cabinet d'avocats — archétype G : INDEX / SOMMAIRE en lignes pleine largeur
// Idée : le pied d'un cabinet se lit comme la TABLE DES MATIÈRES d'un code : cinq grandes lignes pleine largeur (domaine en grand serif, filet dessous) qui s'éclairent et glissent au survol, chacune menant à la prise de contact.
// Pas de cartes. En haut, le nom du cabinet et un bouton bordeaux ; en bas une bande bordeaux avec les coordonnées et la note sur les mentions déontologiques (à renseigner, non inventées).
// Les domaines sont des EXEMPLES. Polices : EB Garamond (titres) et Public Sans. Mobile : lignes en pile, libellés qui passent à la ligne.
const barreau = identite({
  key: "c201", label: "Ivoire, bordeaux et laiton", humeur: "light",
  fond: "#f5f0e6", texte: "#2a1218", discret: "#5b4a45", accent: "#7a1f33", surface: "#ffffff", encre: "#2a1218",
  police: "font.public-sans", titres: "font.eb-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#2a121833",
});
const BORDEAUX = "#7a1f33", BORDEAUX_F = "#3a0f1a", IVOIRE = "#f5f0e6", LAITON = "#c2a15a";

const indexDomaines = modeleV2({
  id: identifiantV2(201, "index-des-domaines"), concept: "c-201-index-des-domaines",
  name: "Index des domaines", family: FAM,
  description: "Pour un cabinet d'avocats : un sommaire de cinq grandes lignes pleine largeur en serif (domaines d'intervention d'exemple) qui s'éclairent au survol, le nom du cabinet, un bouton bordeaux, et une bande avec coordonnées et note déontologique.",
  tags: ["avocat", "cabinet", "droit", "sommaire", "index", "bordeaux", "ivoire", "angles droits"],
  identity: barreau,
  racine: racineDe(IVOIRE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 44, BORDEAUX, { fontWeight: "500" });
    const prise = lien(k, "Prendre rendez-vous", "/contact", { taille: 16, poids: "700", couleur: "#ffffff", h: "56px", padH: "30px", survol: { backgroundColor: BORDEAUX_F, color: "#ffffff", transform: { y: -3 } }, focus: BORDEAUX_F, extra: { backgroundColor: BORDEAUX, borderStyle: "solid", borderWidth: "2px", borderColor: BORDEAUX } });
    const tete = G.bande(k, [G.colonne(k, [caps(k, "Cabinet d'avocats", { couleur: BORDEAUX, suivi: "0.22em" }), nom], { poids: 1, min: "280px", gap: "8px" }), G.colonne(k, [prise], { poids: 0, min: "240px", soi: "flex-end" })], { fond: IVOIRE, gap: "24px 40px", aligne: "flex-end", padV: ["60px", "48px", "36px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Cabinet" });
    const domaines = ["Droit de la famille", "Droit du travail", "Droit des affaires", "Droit immobilier", "Droit pénal"].map((t) => rangee(k, t, "/contact", { couleur: "#2a1218", police: S.head, taille: 38, poids: "500", h: "84px", padH: "8px", glisse: 14, fondSurvol: "#ffffff", couleurSurvol: BORDEAUX, focus: BORDEAUX, ligne: "#2a121866" }));
    const liste = k.col(domaines, { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: "#2a1218", borderRadius: "0px" });
    const note1 = k.T("<p>Domaines d'intervention donnés en exemples : à remplacer dans l'éditeur.</p>", { fontSize: "14px", color: S.mute, fontFamily: S.font });
    const index = G.bande(k, [liste, note1], { fond: IVOIRE, colonne: true, gap: "16px", padV: ["0px", "0px", "0px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Index" });
    const pt = souffle(carre(k, LAITON, "10px"), 3400);
    const coord = G.colonne(k, [k.row([pt, caps(k, "Nous joindre", { couleur: LAITON })], { gap: "10px", alignItems: "center" }), coordonnees(k, { taille: 16, couleur: "#f1e6e8", lien: "#ffffff", survol: LAITON, focus: "#ffffff" })], { poids: 1, min: "260px", gap: "12px" });
    const deonto = G.colonne(k, [caps(k, "Mentions déontologiques", { couleur: LAITON }), k.T(`<p>${NOTE_DEONTO}</p>`, { fontSize: "14px", lineHeight: 1.6, color: "#e5d3d7", fontFamily: S.font, maxWidth: "460px" })], { poids: 1.4, min: "280px", gap: "10px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#4a3a3d", liens: BORDEAUX })(k, env);
    const fin = G.bande(k, [mentions], { fond: IVOIRE, colonne: true, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    const bas = G.bande(k, [G.ligne(k, [coord, deonto], { gap: "32px 56px", aligne: "flex-start", largeur: "100%" })], { fond: BORDEAUX_F, colonne: true, gap: "28px", padV: ["52px", "44px", "36px"], padB: ["52px", "44px", "36px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Mentions" });
    return [G.racine(k, [tete, index, bas, fin])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-202 « Marches de l'étude » — étude notariale — archétype L : PIED EN ESCALIER (bandes de largeurs décroissantes alignées à gauche)
// Idée : trois marches posées à gauche sur bleu nuit, de plus en plus étroites, comme les marches d'un perron : la plus large, bleu encre, porte le nom de l'étude en grand et le petit sceau rouge carré qui respire ;
// la deuxième, parchemin, les liens et l'adresse ; la troisième, parchemin foncé, la note sur les mentions professionnelles (à renseigner). Une fine barre sombre ferme avec les mentions légales.
// Pas de colonnes, pas de lettre, pas d'horaires. Polices : Marcellus (titres) et Lato. Mobile : les trois marches prennent toute la largeur, empilées.
const sceau = identite({
  key: "c202", label: "Bleu encre, parchemin et rouge sceau", humeur: "dark",
  fond: "#1c2541", texte: "#efe6d2", discret: "#c3c9da", accent: "#e0866b", surface: "#26315a", encre: "#1c2541", surEncre: "#efe6d2",
  police: "font.lato", titres: "font.marcellus",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "1px", ligne: "#efe6d433",
});
const ENCRE_N = "#1c2541", NUIT_N = "#0e1426", PARCHEMIN = "#efe6d2", PARCHEMIN2 = "#ddd0b3", SCEAU = "#c0392b", SCEAU_T = "#8e2a1f";

const sceauEtude = modeleV2({
  id: identifiantV2(202, "marches-de-l-etude"), concept: "c-202-marches-de-l-etude",
  name: "Marches de l'étude", family: FAM,
  description: "Pour une étude notariale : un pied en escalier, trois marches alignées à gauche de plus en plus étroites (nom de l'étude et sceau rouge carré, liens et adresse, note sur les mentions professionnelles), puis une fine barre pour les mentions légales.",
  tags: ["notaire", "étude", "escalier", "marches", "bleu encre", "parchemin", "sceau", "angles droits"],
  identity: sceau,
  racine: racineDe(NUIT_N),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marche = (largeur, fond, enfants, o = {}) => k.col(enfants, { width: largeur, maxWidth: "100%", gap: "18px", backgroundColor: fond, paddingTop: o.padV || "44px", paddingBottom: o.padV || "44px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px", alignItems: "flex-start", transitionDuration: DOUX }, { paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const nom = nomDuSite(k, env, 96, PARCHEMIN, { fontWeight: "400", letterSpacing: "0.01em", lineHeight: 1.0, overflowWrap: "anywhere" });
    nom.styles.mobile = { ...(nom.styles.mobile || {}), fontSize: "48px" };
    const sceauCarre = souffle(carre(k, SCEAU, "20px"), 4200);
    const m1 = marche("100%", ENCRE_N, [k.row([sceauCarre, caps(k, "Étude notariale", { couleur: "#e8c9a0", suivi: "0.4em" })], { gap: "14px", alignItems: "center" }), nom], { padV: "72px" });
    const liens = k.row([["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: "#1c2541", padH: "0px", survol: { color: SCEAU_T, transform: { x: 6 } }, focus: SCEAU_T, extra: { textDecoration: "underline", textUnderlineOffset: "6px", marginRight: "22px" } })), { gap: "0px", alignItems: "center" });
    const adr = coordonnees(k, { taille: 15, couleur: "#2b3354", lien: "#1c2541", survol: SCEAU_T, focus: SCEAU_T });
    const m2 = marche("74%", PARCHEMIN, [liens, adr]);
    const note = k.T(`<p>${NOTE_DEONTO}</p>`, { fontSize: "13px", lineHeight: 1.6, color: "#2b3354", fontFamily: S.font, maxWidth: "520px" });
    const m3 = marche("48%", PARCHEMIN2, [note], { padV: "30px" });
    const escalier = k.col([m1, m2, m3], { gap: "0px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c3c9da", liens: PARCHEMIN })(k, env);
    const bas = G.bande(k, [mentions], { fond: NUIT_N, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["56px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [G.bande(k, [escalier], { fond: NUIT_N, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Pleine largeur" }), bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-203 « Barre du commissaire » — commissaire de justice (huissier) — archétype D : LIGNE UNIQUE « barre de navigation inversée »
// Idée : tout tient en deux lignes fines sur gris pierre : à gauche le nom de l'étude, au centre les liens, à droite un bouton brique « Nous contacter » ; en dessous les mentions et la note à renseigner. Compact et net :
// l'inverse d'un pied qui s'étale. Rien d'inventé : pas de coordonnées en dur, pas d'horaires, pas de lettre.
// Polices : Roboto Condensed (nom) et IBM Plex Sans. Mobile : la barre se replie en pile, liens de 44 px.
const registre = identite({
  key: "c203", label: "Gris pierre, noir et brique", humeur: "light",
  fond: "#e8e8e3", texte: "#1d2023", discret: "#464b50", accent: "#8c2f1b", surface: "#ffffff", encre: "#1d2023",
  police: "font.ibm-plex-sans", titres: "font.roboto-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1d202333",
});
const NOIR_P = "#1d2023", BRIQUE = "#8c2f1b", PIERRE = "#e8e8e3";

const barreCommissaire = modeleV2({
  id: identifiantV2(203, "barre-du-commissaire"), concept: "c-203-barre-du-commissaire",
  name: "Barre du commissaire", family: FAM,
  description: "Pour un commissaire de justice (huissier) : un pied compact en deux lignes sur gris pierre, nom de l'étude à gauche, liens au centre, bouton brique « Nous contacter » à droite, puis les mentions. L'inverse d'un pied qui s'étale.",
  tags: ["commissaire de justice", "huissier", "barre", "compact", "une ligne", "gris pierre", "brique", "angles droits"],
  identity: registre,
  racine: racineDe(PIERRE),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 26, "#ffffff", { fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em" });
    const sigle = k.col([], { width: "8px", height: "36px", backgroundColor: "#e0664a", borderRadius: "0px", flexShrink: 0 });
    const marque = k.row([sigle, nom], { gap: "14px", alignItems: "center", flexWrap: "nowrap" });
    const liens = k.row([["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "600", couleur: "#ffffff", padH: "14px", extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "3px", borderColor: "#1d2023" }, survol: { color: "#ffb4a0", borderColor: "#ffb4a0" }, focus: "#ffffff" })), { gap: "0px", alignItems: "center", justifyContent: "center" });
    const contact = lien(k, "Nous contacter", "/contact", { taille: 15, poids: "700", couleur: "#ffffff", casse: "uppercase", suivi: "0.08em", h: "48px", padH: "26px", survol: { backgroundColor: "#ffffff", color: NOIR_P, transform: { y: -2 } }, focus: "#ffffff", extra: { backgroundColor: "#a63a24", borderStyle: "solid", borderWidth: "2px", borderColor: "#a63a24" } });
    const ligne1 = G.bande(k, [marque, k.col([liens], { alignItems: "center", flexGrow: 1 }), contact], { fond: NOIR_P, gap: "12px 32px", aligne: "center", padV: ["22px", "20px", "20px"], padB: ["22px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Barre" });
    const note = k.T(`<p>${NOTE_DEONTO}</p>`, { fontSize: "13px", lineHeight: 1.55, color: "#464b50", fontFamily: S.font, maxWidth: "720px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#464b50", liens: NOIR_P })(k, env);
    const ligne2 = G.bande(k, [G.colonne(k, [mentions], { poids: 1, min: "260px" }), G.colonne(k, [note], { poids: 2, min: "300px" })], { fond: PIERRE, gap: "10px 40px", aligne: "center", padV: ["18px", "16px", "16px"], padB: ["18px", "16px", "16px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [ligne1, ligne2])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-204 « Terrain d'entente » — médiation — archétype H : MOSAÏQUE ASYMÉTRIQUE (une grande case + trois petites)
// Idée : une grande case bleu givré porte le message (« Et si on en parlait ? », bouton teal) ; à côté, trois petites cases empilées de matières différentes : sable (horaires), teal (coordonnées), blanche (trois liens utiles).
// Les cases se touchent, sans arrondi ; la case des coordonnées respire. Aucune lettre d'information. Bande sombre pour les mentions et la note à renseigner.
// Polices : Fraunces (titres) et Nunito Sans. Mobile : les cases passent l'une sous l'autre, la grande en premier.
const entente = identite({
  key: "c204", label: "Bleu givré, sable et teal", humeur: "light",
  fond: "#dfe9f0", texte: "#1f3144", discret: "#44586b", accent: "#1d6a6a", surface: "#ffffff", encre: "#1f3144",
  police: "font.nunito-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1f314433",
});
const NUIT = "#1f3144", GIVRE = "#dfe9f0", SABLE_M = "#efe5d6", TEAL = "#1d6a6a";

const terrainEntente = modeleV2({
  id: identifiantV2(204, "terrain-d-entente"), concept: "c-204-terrain-d-entente",
  name: "Terrain d'entente", family: FAM,
  description: "Pour un cabinet de médiation : une mosaïque asymétrique de cases qui se touchent, une grande case bleu givré avec le message et le bouton, trois petites (horaires sur sable, coordonnées sur teal, liens utiles sur blanc), sans arrondi.",
  tags: ["médiation", "médiateur", "mosaïque", "cases", "bleu givré", "sable", "teal", "angles droits"],
  identity: entente,
  racine: racineDe(GIVRE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, NUIT, { fontWeight: "600" });
    const phrase = k.T("<p>Et si on en parlait ?</p>", { fontSize: "60px", lineHeight: 1.0, fontFamily: S.head, fontWeight: "500", color: NUIT, letterSpacing: "-0.02em" }, { fontSize: "48px" }, { fontSize: "38px" });
    const mot = k.T("<p>Un désaccord se règle mieux autour d'une table. Un premier échange pour comprendre votre situation et voir si la médiation peut vous aider.</p>", { fontSize: "18px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "480px" });
    const bouton = lien(k, "Demander un premier échange", "/contact", { taille: 17, poids: "800", couleur: "#ffffff", h: "58px", padH: "30px", survol: { backgroundColor: NUIT, color: "#ffffff", transform: { y: -3 } }, focus: NUIT, extra: { backgroundColor: TEAL, borderStyle: "solid", borderWidth: "2px", borderColor: TEAL } });
    const grande = panneau(k, [caps(k, "Médiation", { couleur: TEAL, suivi: "0.24em" }), nom, phrase, mot, bouton], { fond: GIVRE, poids: 5.5, base: "0px", min: "340px", gap: "18px", justifie: "center", padV: ["84px", "56px", "44px"], padH: ["64px", "36px", "20px"], hauteur: "560px" });
    const pt = souffle(carre(k, "#ffffff", "10px"), 3200);
    const petite = (fond, enfants) => k.col(enfants, { flexGrow: 1, flexBasis: "0px", gap: "12px", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "36px", paddingRight: "36px", backgroundColor: fond, borderRadius: "0px", transitionDuration: DOUX }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "28px", paddingBottom: "28px" });
    const cH = petite(SABLE_M, [caps(k, "Horaires", { couleur: TEAL }), horaires(k, { taille: 16, couleur: NUIT })]);
    const cC = petite(TEAL, [k.row([caps(k, "Coordonnées", { couleur: "#ffffff" }), pt], { gap: "10px", alignItems: "center" }), coordonnees(k, { taille: 16, couleur: "#ffffff", lien: "#ffffff", survol: "#d7f0ee", focus: "#ffffff" })]);
    const cL = petite("#ffffff", [caps(k, "Utile", { couleur: TEAL }), k.col([["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "700", couleur: NUIT, survol: { color: TEAL, transform: { x: 6 } }, focus: TEAL })), { gap: "0px" })]);
    cL.states = { hover: { backgroundColor: "#f1f7f9" } };
    const pile = k.col([cH, cC, cL], { flexGrow: 3.5, flexBasis: "0px", minWidth: "320px", gap: "0px", alignItems: "stretch", borderRadius: "0px" }, undefined, { minWidth: "0px", flexBasis: "100%" });
    const mosaique = rangeeDe(k, [grande, pile]);
    const note = k.T(`<p>${NOTE_DEONTO}</p>`, { fontSize: "13px", lineHeight: 1.55, color: "#2f4358", fontFamily: S.font, maxWidth: "620px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#2f4358", liens: NUIT })(k, env);
    const bas = G.bande(k, [note, mentions], { fond: GIVRE, gap: "10px 40px", aligne: "center", padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [G.bande(k, [mosaique], { fond: NUIT, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Pleine largeur" }), bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-205 « Question posée » — conseil juridique — archétype F : BANDEAU D'APPEL À L'ACTION XXL + liens en une seule colonne étroite à droite
// Idée : un énorme bandeau bleu pétrole : « Une question juridique ? » en très grandes capitales blanches avec un soulignement safran, un bouton safran carré ; à droite, UNE colonne étroite, séparée par un filet, qui
// empile les liens utiles et les coordonnées. En dessous, une fine bande blanche pour les mentions et la note à renseigner. Pas de lettre, pas de horaires.
// Polices : Archivo (titre, 800) et Inter Tight. Mobile : le bandeau passe en pile, colonne de liens dessous.
const question = identite({
  key: "c205", label: "Bleu pétrole, safran et blanc", humeur: "dark",
  fond: "#0f4c5c", texte: "#ffffff", discret: "#cfe3e8", accent: "#f2b134", surface: "#13606f", encre: "#0f4c5c", surEncre: "#ffffff",
  police: "font.inter-tight", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#ffffff40",
});
const PETROLE = "#0f4c5c", SAFRAN = "#f2b134";

const questionPosee = modeleV2({
  id: identifiantV2(205, "question-posee"), concept: "c-205-question-posee",
  name: "Question posée", family: FAM,
  description: "Pour un conseil juridique : un énorme bandeau bleu pétrole « Une question juridique ? » en capitales blanches avec soulignement safran et bouton carré, une seule colonne étroite de liens et de coordonnées à droite, puis une fine bande de mentions.",
  tags: ["conseil juridique", "juriste", "appel à l'action", "bandeau", "bleu pétrole", "safran", "angles droits", "coordonnées"],
  identity: question,
  racine: racineDe(PETROLE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant('<p>UNE QUESTION<br>JURIDIQUE ?</p>', { taille: [44, 120], lh: 0.95, suivi: "-0.01em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const souligne = k.col([], { width: "140px", height: "10px", backgroundColor: SAFRAN, borderRadius: "0px", transitionDuration: DOUX });
    souligne.states = { hover: { width: "260px" } };
    const mot = k.T("<p>Particulier, entreprise ou association : posez-la simplement, nous vous disons ce qu'il faut savoir et par où commencer.</p>", { fontSize: "19px", lineHeight: 1.55, color: "#e3f0f3", fontFamily: S.font, maxWidth: "560px" });
    const faq2 = lien(k, "Lire les questions fréquentes", "/faq", { taille: 17, poids: "700", couleur: "#ffffff", soulign: true, survol: { color: SAFRAN, transform: { x: 6 } }, focus: SAFRAN });
    const bouton0 = lien(k, "Poser ma question", "/contact", { taille: 20, poids: "800", couleur: PETROLE, h: "68px", padH: "40px", survol: { backgroundColor: "#ffffff", color: PETROLE, transform: { x: 8 } }, focus: "#ffffff", extra: { backgroundColor: SAFRAN, borderStyle: "solid", borderWidth: "2px", borderColor: SAFRAN } });
    const gauche = G.colonne(k, [caps(k, "Conseil juridique", { couleur: SAFRAN, suivi: "0.26em" }), titre, souligne, mot, k.row([bouton0, faq2], { rowGap: "16px", columnGap: "28px", alignItems: "center" })], { poids: 7, min: "340px", gap: "22px" });
    const nom = nomDuSite(k, env, 24, "#ffffff", { fontWeight: "800" });
    const liens = ["Accueil", "Actualités", "Questions fréquentes", "Espace client", "Nous contacter"].map((t, i) => lien(k, t, ["/", "/blog", "/faq", "/connexion", "/contact"][i], { couleur: "#ffffff", taille: 16, poids: "600", survol: { color: SAFRAN, transform: { x: 6 } }, focus: SAFRAN }));
    const pt = souffle(carre(k, SAFRAN, "10px"), 3200);
    const droite = G.colonne(k, [nom, k.col(liens, { gap: "0px" }), k.row([pt, caps(k, "Coordonnées", { couleur: SAFRAN })], { gap: "10px", alignItems: "center", marginTop: "14px" }), coordonnees(k, { taille: 15, couleur: "#e3f0f3", lien: "#ffffff", survol: SAFRAN, focus: "#ffffff" })],
      { poids: 0, base: "280px", min: "260px", gap: "10px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#ffffff55", paddingLeft: "32px", borderRadius: "0px", flexShrink: 0 }, mobile: { borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "24px" } });
    const bandeau = G.bande(k, [gauche, droite], { fond: PETROLE, gap: "48px 64px", aligne: "flex-start", padV: ["110px", "72px", "52px"], padB: ["110px", "72px", "52px"], padH: ["64px", "36px", "20px"], nom: "Appel" });
    const note = k.T(`<p>${NOTE_DEONTO}</p>`, { fontSize: "13px", lineHeight: 1.55, color: "#d4e6ea", fontFamily: S.font, maxWidth: "640px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d4e6ea", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.colonne(k, [note], { poids: 2, min: "300px" }), G.colonne(k, [mentions], { poids: 1, min: "260px" })], { fond: PETROLE, filetHaut: { epaisseur: "1px", couleur: "#ffffff40" }, gap: "10px 40px", aligne: "center", padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [bandeau, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Droit et notariat", target: 5, built: true,
  description: "Pieds de droit et de notariat, sobres et solennels, angles droits : sommaire de cabinet, nom monumental d'étude, barre compacte de commissaire de justice, mosaïque de médiation, bandeau de conseil juridique.",
  models: [indexDomaines, sceauEtude, barreCommissaire, terrainEntente, questionPosee],
};
