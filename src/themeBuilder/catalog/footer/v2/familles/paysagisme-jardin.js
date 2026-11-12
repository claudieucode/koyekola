// Famille v2 « Paysagisme et jardinage » — 5 modèles (ft2-251 à ft2-255), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds d'un paysagiste, d'une jardinerie, d'une entreprise d'élagage, d'une pépinière et d'un prestataire d'entretien d'espaces verts : saisons, rayons, devis, formules d'entretien. Verts et terres francs, sans kitsch.
// Marques fictives ; AUCUNE coordonnée, AUCUN horaire, prix ni chiffre inventé (horaires et coordonnées viennent des Données de l'entreprise du site). Rubriques, rayons, formules : intitulés d'EXEMPLE à renommer.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions longues et douces de 360 ms (couleur, fond, retrait qui grandit, décalage de 2 à 8 px) ;
//   · UNE animation visible par modèle : carré de statut qui « respire », flèche qui glisse, bloc qui s'indente ou se soulève.
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu (voir BRIEF_CARRE.md).
const FAM = "paysagisme-jardin";
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
// bouton carré (plein ou à contour) qui se soulève au survol
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "700", couleur: o.texte, h: "52px", padH: "28px", casse: o.casse, suivi: o.suivi, police: o.police, survol: o.survol || { backgroundColor: o.texte, color: o.fond, transform: { y: -3 } }, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const PH = ["48px", "32px", "20px"];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-251 « Quatre saisons » — paysagiste      [archétype E : deux demi-pages bord à bord de couleurs opposées]
// Idée : à gauche, le MESSAGE sur craie (« Un jardin, quatre saisons. », paragraphe, bouton de devis, coordonnées) ; à droite, les ACTIONS : quatre grands blocs pleins empilés, un par saison (printemps vert tendre, été blé,
// automne rouille, hiver ardoise) qui s'indentent au survol. Une barre d'encre pour les mentions. Pas de lettre, pas d'horaires. Rubriques d'exemple. Polices : Fraunces (titres, 800) et Mulish.
// Mobile : le message passe au-dessus, les blocs de saison dessous, pleine largeur.
const saisons = identite({
  key: "c251", label: "Craie, vert prairie et quatre saisons", humeur: "light",
  fond: "#f6f4ec", texte: "#1f2a1c", discret: "#47523f", accent: "#2f6b2a", surface: "#ffffff", encre: "#1f2a1c",
  police: "font.mulish", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#1f2a1c33",
});
const CRAIE = "#f6f4ec", ENCRE_S = "#1f2a1c", PRAIRIE = "#2f6b2a";

const quatreSaisons = modeleV2({
  id: identifiantV2(251, "quatre-saisons"), concept: "c-251-quatre-saisons",
  name: "Quatre saisons", family: FAM,
  description: "Pour un paysagiste : deux demi-pages opposées, le message et le devis sur craie à gauche, quatre grands blocs de saison (printemps, été, automne, hiver) empilés à droite qui s'indentent au survol. Vert prairie, blé, rouille.",
  tags: ["paysagiste", "saisons", "devis", "deux demi-pages", "vert prairie", "rouille", "angles droits"],
  identity: saisons,
  racine: racineDe(ENCRE_S),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Un jardin,<br>quatre<br>saisons.</p>`, { taille: [44, 92], tablette: { taille: [64, 84] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.02em", poids: "800", police: S.head, couleur: ENCRE_S })(k, env);
    const intro = k.T("<p>Création, plantation, entretien : dites-nous ce que vous imaginez, nous venons voir le terrain et vous proposons un devis.</p>", { fontSize: "18px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "440px" });
    const btn = bouton(k, "Demander un devis", "/contact", { texte: "#ffffff", fond: PRAIRIE, survol: { backgroundColor: ENCRE_S, borderColor: ENCRE_S, color: "#ffffff", transform: { x: 6 } }, focus: ENCRE_S, extra: { alignSelf: "flex-start" } });
    const gauche = G.colonne(k, [caps(k, "Paysagiste", { couleur: PRAIRIE, suivi: "0.22em" }), phrase, intro, btn, coordonnees(k, { taille: 15, lien: ENCRE_S, survol: PRAIRIE, focus: PRAIRIE })], { poids: 6, min: "380px", gap: "24px", extra: { backgroundColor: CRAIE, paddingTop: "88px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "48px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    const SAISONS = [["Printemps", "Plantation, semis, première tonte", "#cfe8b0", ENCRE_S, "#2f6b2a"], ["Été", "Arrosage, taille légère, entretien", "#f3d36b", ENCRE_S, "#6b4b00"], ["Automne", "Feuilles, taille, préparation du sol", "#a8481a", "#ffffff", "#ffe2c9"], ["Hiver", "Élagage, protection, projets", "#3d5a6c", "#ffffff", "#d6e8f2"]];
    const bloc4 = ([nom, sous, fond, encre, vif]) => {
      const t = lien(k, nom, "/contact", { taille: 38, poids: "800", police: S.head, couleur: encre, survol: { color: vif }, focus: encre, h: "52px", lh: 1.05 });
      const r = k.row([k.col([t, k.T(`<p>${sous}</p>`, { fontSize: "16px", lineHeight: 1.4, color: encre, fontFamily: S.font })], { gap: "2px", flexGrow: 1 }), k.T("<p>→</p>", { fontSize: "28px", color: encre, fontFamily: S.font, lineHeight: 1 })], { flexGrow: 1, flexBasis: "0px", minHeight: "150px", flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between", gap: "16px", width: "100%", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "44px", paddingRight: "40px", backgroundColor: fond, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minHeight: "0px", flexBasis: "auto", paddingLeft: "20px", paddingRight: "20px" });
      r.states = { hover: { paddingLeft: "72px" } };
      return r;
    };
    const droite = G.colonne(k, SAISONS.map(bloc4), { poids: 6, min: "380px", gap: "0px", extra: { alignSelf: "stretch" }, mobile: { minWidth: "100%" } });
    const deux = G.bande(k, [gauche, droite], { fond: CRAIE, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Deux pages" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6dccf", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { fond: ENCRE_S, padV: ["24px", "22px", "18px"], padB: ["24px", "22px", "18px"], padH: PH, nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [deux, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-252 « Les rayons » — jardinerie      [archétype G : index / sommaire en lignes pleine largeur, sans cartes]
// Idée : le PLAN DES RAYONS d'une jardinerie comme un sommaire de catalogue : six lignes pleine largeur, grand libellé en serif Young Serif (plantes d'intérieur, d'extérieur, arbustes et haies, outils, terreaux, pots),
// flèche et filet fin ; au survol la ligne vire au blanc et le retrait grandit. En tête une phrase courte et le bouton « Visiter le magasin » ; en bas une seule ligne : nom, coordonnées, mentions. Pas de lettre ni de colonnes.
// Rayons d'exemple. Polices : Young Serif (titres) et Nunito. Mobile : lignes pleine largeur, libellés qui passent à la ligne.
const hortensia = identite({
  key: "c252", label: "Hortensia, feuille et blanc bleuté", humeur: "light",
  fond: "#eef0fb", texte: "#1d2540", discret: "#4a5273", accent: "#4b52c9", surface: "#ffffff", encre: "#1d2540",
  police: "font.nunito", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#1d254044",
});
const HORT = "#eef0fb", INDIGO = "#1d2540", HORT_V = "#4b52c9", FEUILLE = "#2f7d4f";

const lesRayons = modeleV2({
  id: identifiantV2(252, "les-rayons"), concept: "c-252-les-rayons",
  name: "Les rayons", family: FAM,
  description: "Pour une jardinerie : le plan des rayons en sommaire de catalogue, six grandes lignes pleine largeur en serif avec flèche et filet qui s'indentent au survol, puis une seule ligne de contact et de mentions. Hortensia et feuille.",
  tags: ["jardinerie", "rayons", "sommaire", "index", "plantes", "hortensia", "angles droits"],
  identity: hortensia,
  racine: racineDe(INDIGO),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.T("<p>Où trouver quoi, rayon par rayon.</p>", { fontSize: "30px", lineHeight: 1.2, fontFamily: S.head, color: INDIGO, maxWidth: "520px" });
    const btn = bouton(k, "Visiter le magasin", "/contact", { texte: "#ffffff", fond: HORT_V, survol: { backgroundColor: FEUILLE, borderColor: FEUILLE, color: "#ffffff", transform: { x: 6 } }, focus: INDIGO });
    const tete = G.bande(k, [G.colonne(k, [caps(k, "La jardinerie", { couleur: HORT_V, suivi: "0.22em" }), phrase], { poids: 8, min: "300px", gap: "12px" }), G.colonne(k, [btn], { poids: 3, min: "220px", soi: "flex-end", aligne: "flex-end", mobile: { alignItems: "flex-start" } })], { fond: HORT, gap: "24px 40px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "20px"], padH: PH, nom: "Entrée" });
    const RAYONS = ["Plantes d'intérieur", "Plantes d'extérieur", "Arbustes et haies", "Outils et arrosage", "Terreaux et engrais", "Pots et poteries"];
    const ligneR = (t) => {
      const l = lien(k, t, "/contact", { taille: 44, poids: "400", police: S.head, couleur: INDIGO, survol: { color: HORT_V }, focus: HORT_V, h: "88px", lh: 1.1, extra: { flexGrow: 1 } });
      const r = k.row([l, k.T("<p>→</p>", { fontSize: "30px", color: HORT_V, fontFamily: S.font, lineHeight: 1 })], { flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between", gap: "16px", width: "100%", paddingLeft: "0px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1d254066", borderRadius: "0px", backgroundColor: HORT, transitionDuration: DOUX }, undefined, { paddingRight: "8px" });
      r.states = { hover: { backgroundColor: "#ffffff", paddingLeft: "24px" } };
      return r;
    };
    const liste = k.col(RAYONS.map(ligneR), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: INDIGO });
    const index = G.bande(k, [liste], { fond: HORT, colonne: true, padV: ["0px", "0px", "0px"], padB: ["64px", "52px", "40px"], padH: PH, nom: "Sommaire" });
    const nom = nomDuSite(k, env, 28, "#ffffff", { fontFamily: S.head, fontWeight: "400" });
    const colN = G.colonne(k, [nom, k.T("<p>Rayons d'exemple : renommez-les selon votre magasin.</p>", { fontSize: "14px", color: "#c9cdea", fontFamily: S.font })], { poids: 1, min: "240px", gap: "6px" });
    const colC = G.colonne(k, [coordonnees(k, { taille: 15, lien: "#ffffff", couleur: "#e4e6f8", survol: "#b7e3c9", focus: "#ffffff" })], { poids: 1, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c9cdea", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.ligne(k, [colN, colC], { gap: "20px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), mentions], { fond: INDIGO, colonne: true, gap: "24px", padV: ["44px", "36px", "32px"], padB: ["24px", "20px", "20px"], padH: PH, nom: "Pied" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, index, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-253 « Coupe nette » — élagage et abattage      [archétype F : bandeau d'appel XXL en haut + liens en une seule colonne étroite à droite]
// Idée : un BANDEAU XXL lichen « Un arbre à tailler ? Devis gratuit. » (capitales Anton, bouton écorce) ; dessous, sur écorce, un grand vide à gauche avec une phrase de confiance et les coordonnées, et à droite UNE colonne
// étroite de liens (abattage, élagage, taille de haies, dessouchage, évacuation, questions). Les liens glissent de 6 px et leur filet se colore. Pas de lettre, pas d'horaires. Polices : Anton (titres) et Work Sans.
// Mobile : bandeau, puis colonne de liens pleine largeur sous le texte.
const ecorce = identite({
  key: "c253", label: "Écorce, os et lichen", humeur: "dark",
  fond: "#2b1f17", texte: "#ece3d2", discret: "#c9bca6", accent: "#b8c76a", surface: "#37281e", encre: "#2b1f17", surEncre: "#ece3d2",
  police: "font.work-sans", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#ece3d233",
});
const ECORCE = "#2b1f17", OS = "#ece3d2", LICHEN = "#b8c76a";

const coupeNette = modeleV2({
  id: identifiantV2(253, "coupe-nette"), concept: "c-253-coupe-nette",
  name: "Coupe nette", family: FAM,
  description: "Pour une entreprise d'élagage : un bandeau lichen XXL « Un arbre à tailler ? » avec bouton de devis, puis sur écorce un grand vide, une phrase de confiance, les coordonnées et une seule colonne étroite de liens de services.",
  tags: ["élagage", "abattage", "devis", "bandeau XXL", "colonne de liens", "écorce", "lichen", "angles droits"],
  identity: ecorce,
  racine: racineDe(ECORCE),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Un arbre<br>à tailler ?</p>`, { taille: [64, 170], tablette: { taille: [96, 150] }, mobile: { taille: [64, 100] }, lh: 0.95, suivi: "0.005em", poids: "400", police: S.head, couleur: ECORCE, extra: { textTransform: "uppercase" } })(k, env);
    const btn = bouton(k, "Devis gratuit", "/contact", { texte: LICHEN, fond: ECORCE, survol: { backgroundColor: "#ffffff", borderColor: ECORCE, color: ECORCE, transform: { x: 8 } }, focus: ECORCE, casse: "uppercase", suivi: "0.08em", taille: 18, extra: { height: "64px", minHeight: "64px", paddingLeft: "40px", paddingRight: "40px" } });
    const droit = G.colonne(k, [k.T("<p>Visite sur place, devis écrit, intervention propre et déchets évacués.</p>", { fontSize: "19px", lineHeight: 1.5, color: ECORCE, fontFamily: S.font, maxWidth: "340px" }), btn], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" });
    const xxl = G.bande(k, [G.colonne(k, [phrase], { poids: 8, min: "300px" }), droit], { fond: LICHEN, gap: "32px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["80px", "64px", "44px"], padH: PH, nom: "Appel" });
    // dessous : vide à gauche, colonne étroite de liens à droite
    const gauche = G.colonne(k, [caps(k, "Intervention encadrée", { couleur: LICHEN, suivi: "0.22em" }), k.T("<p>Un arbre dangereux, une haie qui déborde, une souche gênante : décrivez-nous la situation, nous vous répondons.</p>", { fontSize: "20px", lineHeight: 1.55, color: OS, fontFamily: S.font, maxWidth: "460px" }), coordonnees(k, { taille: 16, lien: OS, survol: LICHEN, focus: LICHEN })], { poids: 7, min: "300px", gap: "20px" });
    const LIENS = [["Abattage", "/contact"], ["Élagage et taille", "/contact"], ["Taille de haies", "/contact"], ["Dessouchage", "/contact"], ["Évacuation des déchets verts", "/faq"], ["Questions fréquentes", "/faq"]];
    const ligneL = ([t, u]) => {
      const l = lien(k, t, u, { taille: 17, poids: "600", couleur: OS, survol: { color: LICHEN, transform: { x: 6 } }, focus: LICHEN, h: "52px", extra: { width: "100%" } });
      const c = k.col([l], { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#ece3d244", borderRadius: "0px", transitionDuration: DOUX });
      c.states = { hover: { borderColor: LICHEN } };
      return c;
    };
    const colonne = G.colonne(k, [caps(k, "Nos interventions", { couleur: LICHEN }), k.col(LIENS.map(ligneL), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: LICHEN })], { poids: 3, min: "260px", gap: "14px", extra: { maxWidth: "340px" } });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [G.ligne(k, [gauche, colonne], { gap: "40px 80px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), trait(k, S.line), mentions], { fond: ECORCE, colonne: true, gap: "36px", padV: ["72px", "56px", "44px"], padB: ["24px", "20px", "20px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Pied" });
    return [G.racine(k, [xxl, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-254 « Racines » — pépinière      [archétype B : nom monumental seul au centre, très peu de liens, grand vide]
// Idée : presque RIEN. Sur prune profond, au centre d'un grand vide, le mot « Racines. » en très grand Cormorant ; dessous une seule ligne centrée de cinq liens (arbres, arbustes, vivaces, haies, fruitiers) dont le filet
// vert tendre se dessine au survol, le nom du site en petit, un lien « Nous écrire » et les mentions. Aucun widget de données. Rubriques d'exemple. Polices : Cormorant Garamond (titres, 500) et Albert Sans.
// Mobile : le mot se réduit, les liens passent à la ligne, centrés.
const prune = identite({
  key: "c254", label: "Prune, vert tendre et blanc cassé", humeur: "dark",
  fond: "#2d1730", texte: "#f4efe6", discret: "#cdbfd0", accent: "#a8d98f", surface: "#3b2140", encre: "#2d1730", surEncre: "#f4efe6",
  police: "font.albert-sans", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f4efe633",
});
const PRUNE = "#2d1730", VERT_T = "#a8d98f", PAPIER_P = "#f4efe6";

const racines = modeleV2({
  id: identifiantV2(254, "racines"), concept: "c-254-racines",
  name: "Racines", family: FAM,
  description: "Pour une pépinière : le mot « Racines. » monumental au centre d'un grand vide sur prune profond, une seule ligne centrée de cinq liens (arbres, arbustes, vivaces, haies, fruitiers) au filet vert tendre, et les mentions.",
  tags: ["pépinière", "monumental", "minimal", "centré", "arbres", "prune", "vert tendre", "angles droits"],
  identity: prune,
  racine: racineDe(PRUNE),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const mot = G.geant(`<p>Racines.</p>`, { taille: [76, 200], tablette: { taille: [130, 200] }, mobile: { taille: [76, 120] }, lh: 0.95, suivi: "-0.02em", poids: "500", police: S.head, couleur: PAPIER_P })(k, env);
    const cap = caps(k, "Pépinière", { couleur: VERT_T, suivi: "0.4em" });
    const lienP = (t, u) => {
      const l = lien(k, t, u, { taille: 17, poids: "500", couleur: PAPIER_P, survol: { color: VERT_T }, focus: VERT_T, h: "44px", padH: "4px" });
      const c = k.col([l], { alignItems: "center", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: PRUNE, borderRadius: "0px", transitionDuration: DOUX });
      c.states = { hover: { borderColor: VERT_T } };
      return c;
    };
    const rang = k.row([["Arbres", "/blog"], ["Arbustes", "/blog"], ["Vivaces", "/blog"], ["Haies", "/blog"], ["Fruitiers", "/blog"]].map(([t, u]) => lienP(t, u)), { rowGap: "8px", columnGap: "36px", justifyContent: "center", flexWrap: "wrap" });
    const nom = nomDuSite(k, env, 26, VERT_T);
    const ecrire = lien(k, "Nous écrire →", "/contact", { taille: 16, poids: "600", couleur: PAPIER_P, soulign: true, survol: { color: VERT_T, transform: { x: 6 } }, focus: VERT_T, extra: { alignSelf: "center" } });
    const centre = G.bande(k, [cap, mot, rang, nom, ecrire], { fond: PRUNE, colonne: true, gap: "26px", aligne: "center", padV: ["150px", "110px", "72px"], padB: ["110px", "84px", "56px"], padH: PH, innerMobile: { rowGap: "20px" }, nom: "Monogramme" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [trait(k, S.line), mentions], { fond: PRUNE, colonne: true, gap: "18px", padV: ["0px", "0px", "0px"], padB: ["26px", "22px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [centre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-255 « Bandes de tonte » — entretien d'espaces verts      [archétype L : pied en escalier, bandes de largeurs décroissantes alignées à gauche]
// Idée : les BANDES D'UNE PELOUSE TONDUE. Un liséré de seize rayures vertes en tête, puis quatre étages alignés à gauche dont la largeur diminue (100 %, 78 %, 56 %, 34 %) : gazon avec « Bien tondu, bien vu. » et le bouton de devis,
// vert profond avec les formules (ponctuel, saisonnier, annuel), jaune pissenlit avec les horaires, encre avec les coordonnées. Chaque étage glisse de 6 px au survol de ses liens. Une barre de mentions pleine largeur.
// Formules d'exemple. Polices : Red Hat Display (titres, 800) et Lato. Mobile : les étages prennent toute la largeur.
const gazon = identite({
  key: "c255", label: "Gazon, vert profond et jaune pissenlit", humeur: "dark",
  fond: "#1f7a3c", texte: "#ffffff", discret: "#d8f0df", accent: "#f2c200", surface: "#14532a", encre: "#10331c", surEncre: "#ffffff",
  police: "font.lato", titres: "font.red-hat-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff44",
});
const GAZON = "#1f7a3c", GAZON2 = "#27903f", PROFOND = "#14532a", PISSENLIT = "#f2c200", ENCRE_G = "#10331c", NUIT_G = "#0b2415", CRAIE_G = "#f4f1e6";

const bandesDeTonte = modeleV2({
  id: identifiantV2(255, "bandes-de-tonte"), concept: "c-255-bandes-de-tonte",
  name: "Bandes de tonte", family: FAM,
  description: "Pour l'entretien d'espaces verts : un liséré de rayures de pelouse puis un escalier de quatre étages alignés à gauche, de plus en plus étroits (devis, formules, horaires, contact), en gazon, vert profond, jaune pissenlit et encre.",
  tags: ["espaces verts", "entretien", "pelouse", "escalier", "étagé", "gazon", "pissenlit", "angles droits"],
  identity: gazon,
  racine: racineDe(NUIT_G),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // liséré de rayures
    const rayures = G.bande(k, [k.row(Array.from({ length: 16 }, (_, i) => k.col([], { flexGrow: 1, flexBasis: "0px", height: "44px", backgroundColor: i % 2 ? GAZON2 : "#1a6a34", borderRadius: "0px" })), { gap: "0px", flexWrap: "nowrap", width: "100%" })], { fond: GAZON, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Rayures" });
    const etage = (largeur, fond, enfants, o = {}) => k.col(enfants, { width: largeur, maxWidth: "100%", backgroundColor: fond, gap: o.gap || "16px", paddingTop: o.padV || "40px", paddingBottom: o.padV || "40px", paddingLeft: "48px", paddingRight: "48px", borderRadius: "0px" }, { width: "100%", paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "28px", paddingBottom: "28px" });
    // 1 · gazon : phrase + devis
    const phrase = G.geant(`<p>Bien tondu,<br>bien vu.</p>`, { taille: [44, 104], tablette: { taille: [64, 90] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.02em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const btn = bouton(k, "Demander un devis", "/contact", { texte: ENCRE_G, fond: PISSENLIT, survol: { backgroundColor: "#ffffff", borderColor: "#ffffff", color: ENCRE_G, transform: { x: 6 } }, focus: "#ffffff", extra: { alignSelf: "flex-start" } });
    const e1 = etage("100%", GAZON, [caps(k, "Entretien d'espaces verts", { couleur: "#ffffff", suivi: "0.22em" }), phrase, btn], { padV: "64px", gap: "20px" });
    // 2 · vert profond : formules
    const FORM = [["Entretien ponctuel", "/contact"], ["Formule saisonnière", "/contact"], ["Contrat annuel", "/contact"], ["Questions fréquentes", "/faq"]];
    const e2 = etage("78%", PROFOND, [caps(k, "Nos formules (exemples)", { couleur: PISSENLIT }), k.row(FORM.map(([t, u]) => lien(k, t, u, { taille: 18, poids: "700", couleur: "#ffffff", soulign: true, survol: { color: PISSENLIT, transform: { x: 6 } }, focus: PISSENLIT, padH: "0px", extra: { marginRight: "28px" } })), { gap: "0px", flexWrap: "wrap" })]);
    // 3 · pissenlit : horaires
    const e3 = etage("56%", PISSENLIT, [k.row([souffle(carre(k, ENCRE_G, "10px"), 3000), caps(k, "Horaires", { couleur: ENCRE_G })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { taille: 16, couleur: ENCRE_G })]);
    // 4 · encre : coordonnées
    const e4 = etage("34%", ENCRE_G, [caps(k, "Nous joindre", { couleur: PISSENLIT }), coordonnees(k, { taille: 16, couleur: "#ffffff", lien: "#ffffff", survol: PISSENLIT, focus: PISSENLIT })]);
    const escalier = G.bande(k, [e1, e2, e3, e4], { fond: CRAIE_G, colonne: true, gap: "0px", aligne: "flex-start", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], innerMobile: { rowGap: "0px" }, nom: "Escalier" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfe3d6", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: NUIT_G, padV: ["24px", "22px", "18px"], padB: ["24px", "22px", "18px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [rayures, escalier, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Paysagisme et jardinage", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits : deux demi-pages de saisons, sommaire de rayons de jardinerie, bandeau d'élagage XXL, mot monumental de pépinière, escalier de bandes de tonte.",
  models: [quatreSaisons, lesRayons, coupeNette, racines, bandesDeTonte],
};
