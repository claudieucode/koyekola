// Famille v2 « Écoles et établissements » — 5 modèles (ft2-226 à ft2-230), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds d'établissements : école privée, lycée, centre de formation, école de commerce, crèche. Inscriptions, espace parents, contact et horaires (widget « Données de l'entreprise »), lettre d'information, mentions légales.
// Marques fictives ; AUCUNE date, coordonnée ni chiffre inventé : « portes ouvertes » est un simple lien vers la page dédiée (les dates se publient dans l'éditeur). Les rubriques, niveaux et filières sont des intitulés d'EXEMPLE à renommer.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions longues et douces de 360 ms (couleur, fond, filet qui s'épaissit, décalage de 2 à 8 px) ;
//   · UNE animation visible par modèle : carré de statut qui « respire », filet d'accent qui s'épaissit, rangée qui s'indente, repère d'étape qui s'inverse, bloc de jeu qui se soulève.
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu (voir BRIEF_CARRE.md).
const FAM = "ecoles-etablissements";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

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
// ft2-226 « Papier à en-tête » — école privée   [archétype J : cartouche centré, filets doubles, liens en ligne centrée]
// Idée : le pied est un PAPIER À EN-TÊTE d'école. Tout est centré entre deux doubles filets sauge : « Établissement scolaire », le nom en grand serif, une devise, l'adresse (Données de l'entreprise),
// puis une ligne centrée de liens (inscriptions, portes ouvertes — sans date —, espace parents, contact) ; un carré sauge « respire » devant « Portes ouvertes ». Ni horaires ni lettre : sobriété d'une correspondance.
// Polices : Cormorant Garamond (titres, en grand) et Hanken Grotesk. Mobile : liens empilés, filets pleine largeur.
const encre = identite({
  key: "c226", label: "Encre bleue et sauge", humeur: "dark",
  fond: "#16233a", texte: "#eef2ea", discret: "#b4c2d3", accent: "#9fd0a8", surface: "#1d2e4a", encre: "#16233a", surEncre: "#eef2ea",
  police: "font.hanken-grotesk", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eef2ea33",
});
const ENC = "#16233a", SAUGE = "#9fd0a8", LIN = "#eef2ea";

const papierEnTete = modeleV2({
  id: identifiantV2(226, "papier-a-en-tete"), concept: "c-226-papier-a-en-tete",
  name: "Papier à en-tête", family: FAM,
  description: "Pour une école privée : un cartouche centré comme un papier à en-tête, doubles filets sauge, nom de l'école en grand serif, adresse et une ligne de liens (inscriptions, portes ouvertes, espace parents). Bleu nuit, très sobre.",
  tags: ["école privée", "papier à en-tête", "centré", "doubles filets", "bleu nuit", "sauge", "serif", "angles droits"],
  identity: encre,
  racine: racineDe(ENC),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const double = () => k.col([trait(k, SAUGE, "1px"), trait(k, SAUGE, "1px")], { gap: "5px", width: "100%" });
    const nom = nomDuSite(k, env, 64, LIN, { fontWeight: "500", textAlign: "center", letterSpacing: "0em" });
    nom.styles.desktop.fontSize = "fluid:44-84";
    const centre = (n) => { n.styles.desktop = { ...n.styles.desktop, textAlign: "center", alignSelf: "center" }; return n; };
    const devise = para(k, "Apprendre, grandir, réussir ensemble.", { taille: 22, couleur: "#d5dfe9", align: "center", police: S.head, extra: { fontStyle: "italic" } });
    const adresse = centre(coordonnees(k, { taille: 15, lien: LIN, survol: SAUGE, focus: SAUGE }));
    adresse.styles.desktop.width = "fit-content"; adresse.styles.desktop.maxWidth = "100%";
    const point = () => caps(k, "·", { couleur: SAUGE });
    const pt = souffle(carre(k, SAUGE, "9px"), 3000);
    const portesOuvertes = k.row([pt, lien(k, "Portes ouvertes", "/blog", { taille: 16, poids: "600", couleur: LIN, survol: { color: SAUGE, transform: { y: -2 } }, focus: SAUGE })], { gap: "8px", alignItems: "center", flexWrap: "nowrap" });
    const l = (t, u) => lien(k, t, u, { taille: 16, poids: "600", couleur: LIN, survol: { color: SAUGE, transform: { y: -2 } }, focus: SAUGE, padH: "6px" });
    const liens = k.row([l("Inscriptions", "/contact"), point(), portesOuvertes, point(), l("Espace parents", "/connexion"), point(), l("Nous écrire", "/contact")], { rowGap: "0px", columnGap: "12px", justifyContent: "center", alignItems: "center" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c3cfdc", liens: LIN })(k, env, true);
    const cartouche = G.colonne(k, [double(), caps(k, "Établissement scolaire", { couleur: SAUGE, suivi: "0.3em", extra: { textAlign: "center" } }), nom, devise, adresse, liens, double(), mentions], { poids: 1, min: "0px", gap: "26px", aligne: "stretch", extra: { maxWidth: "860px", width: "100%", alignItems: "center", marginLeft: "auto", marginRight: "auto" } });
    cartouche.children.forEach((c) => { if (c.type === "text") c.styles.desktop = { ...c.styles.desktop, textAlign: "center" }; });
    const bande = G.bande(k, [cartouche], { fond: ENC, colonne: true, padV: ["104px", "80px", "56px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Cartouche" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-227 « Barre des niveaux » — lycée   [archétype A : colonne latérale pleine hauteur + zone principale]
// Idée : une BARRE VERTICALE violette de 320 px à gauche, sur toute la hauteur du pied : « Lycée. » en capitales condensées, puis les quatre niveaux (Seconde, Première, Terminale, Après le bac) empilés
// en liens blancs qui s'indentent au survol, et le bouton d'inscription. La zone principale, claire, ne dit que l'essentiel : une grande phrase en gras, l'adresse, la lettre. Niveaux d'exemple.
// Polices : Barlow Condensed et Public Sans. Mobile : la barre passe au-dessus (niveaux en pile).
const beton = identite({
  key: "c227", label: "Béton clair et violet", humeur: "light",
  fond: "#eceef2", texte: "#15171c", discret: "#444955", accent: "#6d28d9", surface: "#ffffff", encre: "#15171c",
  police: "font.public-sans", titres: "font.barlow-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#15171c33",
});
const BETON = "#eceef2", VIOLET = "#6d28d9", NOIR2 = "#15171c";

const barreNiveaux = modeleV2({
  id: identifiantV2(227, "barre-des-niveaux"), concept: "c-227-barre-des-niveaux",
  name: "Barre des niveaux", family: FAM,
  description: "Pour un lycée : une barre verticale violette sur toute la hauteur avec « Lycée » en capitales condensées, les niveaux empilés en liens qui s'indentent, le bouton d'inscription ; à côté, une grande phrase, l'adresse et la lettre.",
  tags: ["lycée", "barre latérale", "niveaux", "violet", "béton", "capitales condensées", "angles droits"],
  identity: beton,
  racine: racineDe(NOIR2),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // barre latérale
    const mot = G.geant(`<p>Lycée.</p>`, { taille: [44, 76], tablette: { taille: [52, 64] }, mobile: { taille: [56, 80] }, lh: 0.9, suivi: "0em", poids: "800", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const niv = (t, u) => {
      const a = lien(k, t, u, { taille: 22, poids: "700", police: S.head, casse: "uppercase", suivi: "0.04em", couleur: "#ffffff", bloc: true, h: "52px", survol: { color: "#ffffff" }, focus: "#ffffff", extra: { width: "100%", paddingLeft: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff66" } });
      a.states = { ...(a.states || {}), hover: { color: "#15171c", backgroundColor: "#ffffff", paddingLeft: "16px" } };
      return a;
    };
    const niveaux = k.col([niv("Seconde", "/faq"), niv("Première", "/faq"), niv("Terminale", "/faq"), niv("Après le bac", "/blog")], { gap: "0px", width: "100%" });
    const btn = lien(k, "S'inscrire", "/contact", { taille: 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: VIOLET, h: "54px", padH: "30px", survol: { backgroundColor: NOIR2, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", justifyContent: "center", alignSelf: "flex-start" } });
    const barre = k.col([caps(k, "Établissement", { couleur: "#ffffff", suivi: "0.22em" }), mot, niveaux, btn], { flexGrow: 0, flexShrink: 0, flexBasis: "320px", width: "320px", gap: "24px", paddingTop: "72px", paddingBottom: "56px", paddingLeft: "36px", paddingRight: "36px", backgroundColor: VIOLET, borderRadius: "0px" }, { width: "260px", flexBasis: "260px", paddingLeft: "24px", paddingRight: "24px" }, { width: "100%", flexBasis: "auto", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    // zone principale
    const phrase = G.geant(`<p>Chaque élève a sa voie.<br>Nous aidons à la trouver.</p>`, { taille: [32, 64], tablette: { taille: [30, 48] }, mobile: { taille: [28, 36] }, lh: 1.08, suivi: "-0.01em", poids: "800", police: S.head, couleur: NOIR2 })(k, env);
    const nom = nomDuSite(k, env, 22, VIOLET, { fontWeight: "800" });
    const adresse = bloc(k, "Adresse", [coordonnees(k, { taille: 16, lien: NOIR2, survol: VIOLET, focus: VIOLET })], { couleurTitre: VIOLET, min: "220px" });
    const abo = lettre(k, env, G, { titre: "Lettre du lycée", intro: "Informations pratiques, par courriel.", bouton: "S'abonner", largeur: "360px", accent: VIOLET, surBouton: "#ffffff", texte: NOIR2, couleurTitre: VIOLET, fond: BETON, survolBouton: NOIR2, survolTexte: "#ffffff", focus: NOIR2 });
    const duo = G.ligne(k, [adresse, G.colonne(k, [abo], { poids: 1, min: "260px" })], { gap: "28px 48px", aligne: "flex-start", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const principal = k.col([G.colonne(k, [nom, phrase], { gap: "18px", poids: 0, min: "0px" }), duo, trait(k, S.line), mentions], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "44px", justifyContent: "space-between", paddingTop: "72px", paddingBottom: "32px", paddingLeft: "64px", paddingRight: "56px", backgroundColor: BETON, borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const corps = G.bande(k, [barre, principal], { fond: BETON, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Barre latérale" });
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-228 « Du dossier à la rentrée » — centre de formation   [archétype I : frise horizontale en étapes à repères carrés]
// Idée : une FRISE en quatre étapes (Information, Dossier, Financement, Entrée en formation) : repères carrés corail reliés par un filet ; au survol le repère s'inverse (le carré devient clair) et le titre glisse.
// Au-dessus, un grand titre d'invitation ; dessous une seule ligne : adresse et lien vers un conseiller. Pas de lettre, pas d'horaires : le pied accompagne le parcours. Étapes d'exemple, sans date ni aide chiffrée.
// Polices : Red Hat Display et Noto Sans. Mobile : étapes empilées, filet vertical remplacé par un filet horizontal.
const petrole = identite({
  key: "c228", label: "Pétrole et corail", humeur: "dark",
  fond: "#0f4c5c", texte: "#f2fbfb", discret: "#c3e2e6", accent: "#ff9a85", surface: "#14606f", encre: "#0f4c5c", surEncre: "#f2fbfb",
  police: "font.noto-sans", titres: "font.red-hat-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f2fbfb40",
});
const PET = "#0f4c5c", PET2 = "#0a3a47", CORAIL = "#ff9a85", GLACE = "#f2fbfb";

const dossierRentree = modeleV2({
  id: identifiantV2(228, "du-dossier-a-la-rentree"), concept: "c-228-du-dossier-a-la-rentree",
  name: "Du dossier à la rentrée", family: FAM,
  description: "Pour un centre de formation : un grand titre d'invitation, puis une frise de quatre étapes (information, dossier, financement, entrée en formation) à repères carrés corail reliés par un filet, et une ligne d'adresse. Pétrole et corail.",
  tags: ["centre de formation", "frise", "étapes", "inscription", "pétrole", "corail", "angles droits"],
  identity: petrole,
  racine: racineDe(PET2),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Votre formation<br>commence <span style="color:${CORAIL}">ici.</span></p>`, { taille: [44, 96], tablette: { taille: [56, 80] }, mobile: { taille: [40, 52] }, lh: 1.0, suivi: "-0.02em", poids: "800", police: S.head, couleur: GLACE })(k, env);
    const btn = lien(k, "Parler à un conseiller", "/contact", { taille: 16, poids: "800", couleur: PET, h: "54px", padH: "28px", survol: { backgroundColor: GLACE, transform: { y: -3 } }, focus: GLACE, extra: { backgroundColor: CORAIL, justifyContent: "center", alignSelf: "flex-start" } });
    const haut = G.bande(k, [G.colonne(k, [titre], { poids: 8, min: "300px" }), G.colonne(k, [btn], { poids: 3, min: "240px", soi: "flex-end" })], { fond: PET, gap: "28px 48px", aligne: "flex-end", padV: ["84px", "64px", "44px"], padB: ["56px", "44px", "32px"], padH: ["48px", "32px", "20px"], nom: "Invitation" });
    // frise
    const etape = (num, titreE, texte, url, dernier) => {
      const rep = k.col([k.T(`<p>${num}</p>`, { fontSize: "18px", fontWeight: "800", fontFamily: S.head, color: PET, lineHeight: 1, textAlign: "center" })], { width: "48px", height: "48px", flexShrink: 0, alignItems: "center", justifyContent: "center", backgroundColor: CORAIL, borderRadius: "0px", transitionDuration: DOUX });
      rep.states = { hover: { backgroundColor: GLACE } };
      const filet = k.col([], { flexGrow: 1, height: "3px", backgroundColor: dernier ? "transparent" : "#f2fbfb55", borderRadius: "0px" });
      const marque = k.row([rep, filet], { flexWrap: "nowrap", alignItems: "center", gap: "0px", width: "100%" });
      const t = lien(k, titreE, url, { taille: 22, poids: "800", police: S.head, couleur: GLACE, survol: { color: CORAIL, transform: { x: 6 } }, focus: CORAIL, h: "48px" });
      const c = k.col([marque, t, para(k, texte, { taille: 15, couleur: "#c3e2e6" })], { flexGrow: 1, flexBasis: "0px", minWidth: "210px", gap: "10px", paddingRight: "20px" }, undefined, { minWidth: "100%" });
      return c;
    };
    const frise = G.ligne(k, [
      etape("1", "Information", "Découvrez les formations et leurs modalités.", "/faq"),
      etape("2", "Dossier", "Constituez votre dossier avec un conseiller.", "/contact"),
      etape("3", "Financement", "Repérez les aides possibles pour votre projet.", "/faq"),
      etape("4", "Entrée en formation", "Confirmez votre inscription et préparez la rentrée.", "/contact", true),
    ], { gap: "32px 0px", aligne: "flex-start", largeur: "100%" });
    const bandeFrise = G.bande(k, [frise], { fond: PET, colonne: true, padV: ["16px", "16px", "8px"], padB: ["88px", "64px", "48px"], padH: ["48px", "32px", "20px"], nom: "Frise" });
    // ligne unique
    const adresse = G.colonne(k, [coordonnees(k, { taille: 15, lien: GLACE, survol: CORAIL, focus: CORAIL })], { poids: 1, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c3e2e6", liens: GLACE })(k, env);
    const bas = G.bande(k, [adresse, G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { fond: PET2, gap: "24px 40px", aligne: "flex-end", padV: ["36px", "32px", "28px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Adresse" });
    bas.styles.desktop.color = GLACE;
    return [G.racine(k, [haut, bandeFrise, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-229 « Campus » — école de commerce   [archétype B : nom monumental seul au centre, très peu de liens, grand vide]
// Idée : presque rien. Le mot « Campus. » en immense serif saumon, centré dans un grand vide indigo, et une seule ligne de quatre liens (Programmes, Admissions, International, Contact) sous un filet. Mentions en dessous.
// Marque fictive. Polices : Playfair Display (900) et Albert Sans. Mobile : le mot s'adapte (plafonné), liens en deux lignes.
const indigo = identite({
  key: "c229", label: "Indigo et saumon", humeur: "dark",
  fond: "#1b1f6b", texte: "#f5f4ff", discret: "#c3c6f0", accent: "#ff9e8f", surface: "#252a82", encre: "#1b1f6b", surEncre: "#f5f4ff",
  police: "font.albert-sans", titres: "font.playfair-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f5f4ff40",
});
const INDIGO = "#1b1f6b", SAUMON = "#ff9e8f", NACRE = "#f5f4ff";

const campusMonument = modeleV2({
  id: identifiantV2(229, "campus"), concept: "c-229-campus",
  name: "Campus monumental", family: FAM,
  description: "Pour une école de commerce : le mot « Campus » en immense serif saumon, centré dans un grand vide indigo, une seule ligne de quatre liens (programmes, admissions, international, contact) sous un filet, puis les mentions.",
  tags: ["école de commerce", "monogramme", "nom monumental", "centré", "indigo", "saumon", "serif", "angles droits"],
  identity: indigo,
  racine: racineDe(INDIGO),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const mot = G.geant(`<p>Campus<span style="color:${NACRE}">.</span></p>`, { taille: [88, 200], tablette: { taille: [120, 180] }, mobile: { taille: [64, 96] }, lh: 0.9, suivi: "-0.03em", poids: "900", police: S.head, couleur: SAUMON, align: "center" })(k, env, true);
    const sous = caps(k, "École de commerce", { couleur: NACRE, suivi: "0.4em", extra: { textAlign: "center" } });
    const l = (t, u) => lien(k, t, u, { taille: 16, poids: "700", couleur: NACRE, survol: { color: SAUMON, transform: { y: -3 } }, focus: SAUMON, padH: "10px" });
    const liens = k.row([l("Programmes", "/faq"), l("Admissions", "/contact"), l("International", "/blog"), l("Contact", "/contact")], { rowGap: "0px", columnGap: "28px", justifyContent: "center" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c3c6f0", liens: NACRE })(k, env, true);
    const cand = lien(k, "Candidater", "/contact", { taille: 16, poids: "800", casse: "uppercase", suivi: "0.1em", couleur: INDIGO, h: "54px", padH: "34px", survol: { backgroundColor: NACRE, transform: { y: -3 } }, focus: NACRE, extra: { backgroundColor: SAUMON, justifyContent: "center", alignSelf: "center", marginTop: "36px" } });
    const centre = G.colonne(k, [sous, mot, cand], { poids: 1, min: "0px", gap: "20px", aligne: "stretch", extra: { width: "100%", alignItems: "center" } });
    centre.children.forEach((c) => { c.styles.desktop = { ...c.styles.desktop, textAlign: "center" }; });
    const nav = G.bande(k, [liens], { fond: INDIGO, colonne: true, padV: ["36px", "32px", "24px"], padB: ["0px", "0px", "0px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    const haut = G.bande(k, [centre], { fond: INDIGO, colonne: true, padV: ["128px", "96px", "64px"], padB: ["128px", "96px", "64px"], padH: ["48px", "32px", "20px"], nom: "Nom" });
    const bas = G.bande(k, [trait(k, "#f5f4ff55", "1px"), mentions], { fond: INDIGO, colonne: true, gap: "18px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "14px" }, nom: "Mentions" });
    bas.styles.desktop.color = NACRE;
    return [G.racine(k, [nav, haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-230 « Les gros blocs » — crèche   [archétype H : mosaïque asymétrique, une grande case + trois petites]
// Idée : une MOSAÏQUE de blocs de jeu. Une grande case jaune (nom de la crèche, phrase, horaires d'accueil), et à droite trois cases plus petites empilées — pêche « Inscrire mon enfant », menthe « Visiter la crèche »,
// blanche « Espace parents » ; chaque case se soulève et noircit son filet haut au survol. Une fine barre marine porte l'adresse et les mentions. Pas de lettre. Polices : Fredoka (titres) et Nunito.
// Mobile : la grande case puis les trois petites, pleine largeur.
const ciel = identite({
  key: "c230", label: "Ciel, jaune et pêche", humeur: "light",
  fond: "#def0f7", texte: "#1d3b4f", discret: "#355468", accent: "#b93a0d", surface: "#ffffff", encre: "#1d3b4f",
  police: "font.nunito", titres: "font.fredoka",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#1d3b4f33",
});
const CIEL = "#def0f7", MARIN = "#1d3b4f", JAUNE = "#ffd166", PECHE = "#ffb199", MENTHE = "#a8e0c4";

const grosBlocs = modeleV2({
  id: identifiantV2(230, "les-gros-blocs"), concept: "c-230-les-gros-blocs",
  name: "Les gros blocs", family: FAM,
  description: "Pour une crèche : une mosaïque de blocs de jeu, une grande case jaune avec le nom et les horaires d'accueil, trois cases plus petites (inscrire son enfant, visiter, espace parents) qui se soulèvent, et une barre marine pour l'adresse.",
  tags: ["crèche", "petite enfance", "mosaïque", "blocs", "jaune", "pêche", "menthe", "angles droits"],
  identity: ciel,
  racine: racineDe(MARIN),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 44, MARIN, { fontWeight: "600" });
    const pt = souffle(carre(k, "#b93a0d", "10px"), 3200);
    const grande = k.col([k.row([pt, caps(k, "Accueil des enfants", { couleur: MARIN })], { gap: "10px", alignItems: "center" }), nom, para(k, "Un lieu doux et sûr pour grandir, jouer et découvrir, avec une équipe attentive.", { taille: 18, couleur: MARIN, max: "420px" }), horaires(k, { taille: 16 })], { flexGrow: 5, flexBasis: "0px", minWidth: "300px", gap: "16px", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "44px", paddingRight: "44px", backgroundColor: JAUNE, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "0px", borderColor: MARIN, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    grande.states = { hover: { backgroundColor: "#ffdb85" } };
    const petite = (num, t, texte, url, fond) => {
      const a = lien(k, t, url, { taille: 26, poids: "600", police: S.head, couleur: MARIN, survol: { color: MARIN, transform: { x: 8 } }, focus: MARIN, h: "48px" });
      const c = k.col([caps(k, num, { couleur: MARIN, suivi: "0.2em" }), a, para(k, texte, { taille: 15, couleur: MARIN })], { flexGrow: 1, flexBasis: "0px", minHeight: "128px", gap: "6px", paddingTop: "20px", paddingBottom: "18px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: fond, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "0px", borderColor: MARIN, borderRadius: "0px", transitionDuration: DOUX }, undefined, { paddingLeft: "20px", paddingRight: "20px" });
      c.states = { hover: { transform: { y: -6 }, borderTopWidth: "8px" } };
      return c;
    };
    const pile = k.col([petite("01", "Inscrire mon enfant", "Demande d'accueil et premier rendez-vous.", "/contact", PECHE), petite("02", "Visiter la crèche", "Venez rencontrer l'équipe sur place.", "/contact", MENTHE), petite("03", "Espace parents", "Documents et informations du quotidien.", "/connexion", "#ffffff")], { flexGrow: 4, flexBasis: "0px", minWidth: "280px", gap: "10px" }, undefined, { minWidth: "100%" });
    const mosaique = G.ligne(k, [grande, pile], { gap: "10px", aligne: "stretch", largeur: "100%" });
    const haut = G.bande(k, [mosaique], { fond: CIEL, colonne: true, padV: ["56px", "44px", "28px"], padB: ["56px", "44px", "28px"], padH: ["48px", "32px", "20px"], nom: "Mosaïque" });
    const adresse = G.colonne(k, [coordonnees(k, { taille: 15, lien: "#ffffff", survol: JAUNE, focus: JAUNE })], { poids: 1, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfe0ea", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [adresse, G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { fond: MARIN, gap: "20px 40px", aligne: "flex-end", padV: ["32px", "28px", "24px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Adresse" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Écoles et établissements", target: 5, built: true,
  description: "Pieds d'établissements standard et très professionnels, à angles droits : papier à en-tête, barre latérale de niveaux, frise d'inscription, nom monumental, mosaïque de blocs.",
  models: [papierEnTete, barreNiveaux, dossierRentree, campusMonument, grosBlocs],
};
