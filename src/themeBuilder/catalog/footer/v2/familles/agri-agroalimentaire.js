// Famille v2 « Agriculture et agroalimentaire » — 5 modèles (ft2-156 à ft2-160), extension « carrée » : ANGLES DROITS partout (aucun border-radius), sites standard très professionnels.
// Exploitation agricole, coopérative, producteur en vente directe, vigneron, transformation agroalimentaire. Marques fictives ; aucune coordonnée ni chiffre inventé (horaires, adresse, téléphone viennent des
// « Données de l'entreprise » ; les adresses de réseaux et les rubriques sont des EXEMPLES à renommer dans l'éditeur).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 300 à 450 ms (fond, filet, couleur, décalage de 2 à 6 px) posées par `transitionDuration` ; « souffle » lent d'un carré (`motion` pulse) ;
//   cartouches qui se soulèvent au survol. Aucune animation d'entrée ni widget « Défilement continu » (limites du moteur, voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "agri-agroalimentaire";

// ── Aides LOCALES (angles droits : aucun rayon, partout 0px) ─────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond, texte) => ({ desktop: { backgroundColor: fond, ...(texte ? { color: texte } : {}), gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
// Bouton franc à angles droits : fond plein ou contour, survol qui change le fond et se soulève de 2 px
function btn(k, label, url, o) {
  return lien(k, label, url, { taille: o.taille || 16, poids: "700", casse: o.casse, suivi: o.suivi, couleur: o.texte, h: o.h || "52px", padH: o.padH || "26px", survol: { backgroundColor: o.survolFond, color: o.survolTexte, transform: { y: -2 } }, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Mouvement du Page Builder : « souffle » lent (animation d'attention, aucun repli animé en mouvement réduit)
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || o.lien || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: GK.MOUVEMENT }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// Lettre d'information à angles droits, habillée
function lettre(k, env, G, o) {
  const abo = G.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre || o.texte, lineHeight: 1.4 };
  if (o.texte) { abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: o.texte }; abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.texteDiscret || o.texte }; abo.parts.consent.styles.desktop = { ...abo.parts.consent.styles.desktop, color: o.texteDiscret || o.texte }; }
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.surBouton || abo.parts.button.styles.desktop.color };
  return G.colonne(k, [abo], { poids: o.poids || 1.5, min: "260px" });
}
// Cartouche à angles droits qui change de fond et de filet au survol (animation fluide 300 ms)
function cartouche(k, enfants, o) {
  const c = k.col(enfants, { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "1px", borderTopWidth: o.haut || "1px", borderColor: o.bord, borderTopColor: o.bordHaut || o.bord, borderRadius: "0px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", gap: o.gap || "10px", flexGrow: 1, flexBasis: "0px", minWidth: o.min || "220px", minHeight: o.hauteur, justifyContent: o.justifie, transitionDuration: 320, ...(o.extra || {}) }, undefined, o.mobile);
  c.states = { hover: { backgroundColor: o.survolFond || o.fond, borderColor: o.survolBord || o.bord, borderTopColor: o.survolHaut || o.bordHaut || o.bord, transform: { y: o.leve === undefined ? -4 : o.leve } } };
  return c;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-156 « Registre de la ferme » — exploitation agricole
// Idée : le pied est un CADASTRE. Sol labouré brun foncé, phrase en capitales « De la parcelle à votre table. », puis quatre parcelles numérotées (cultures, élevage, vente à la ferme, visites) dont le filet
// du haut s'épaissit en blé doré et le fond se réchauffe au survol ; sous la grille, horaires (avec un carré qui « respire »), contact, liens et lettre. Polices : Archivo (titres) et Work Sans.
const sol = identite({
  key: "c156", label: "Sol labouré et blé doré", humeur: "dark",
  fond: "#2a1f17", texte: "#f3ead8", discret: "#cdbfa6", accent: "#e3b448", surface: "#382a20", encre: "#2a1f17", surEncre: "#f3ead8",
  police: "font.work-sans", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#f3ead840",
});
const SOL = "#2a1f17", SOL2 = "#382a20", SOL3 = "#46352a", BLE = "#e3b448", PAILLE = "#f3ead8";

const registreFerme = modeleV2({
  id: identifiantV2(156, "registre-de-la-ferme"), concept: "c-156-registre-de-la-ferme",
  name: "Registre de la ferme", family: FAM,
  description: "Pour une exploitation agricole : phrase en capitales sur sol brun, quatre parcelles numérotées à angles droits qui dorent leur filet au survol, horaires, contact et lettre d'information. Terre et blé, net et sobre.",
  tags: ["exploitation agricole", "ferme", "parcelles", "vente à la ferme", "brun", "blé", "angles droits"],
  identity: sol,
  racine: racineDe(SOL),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>De la parcelle<br><span style="color:${BLE}">à votre table.</span></p>`, { taille: [44, 104], tablette: { taille: [52, 68] }, mobile: { taille: [40, 56] }, lh: 1.0, suivi: "-0.02em", poids: "800", police: S.head, couleur: PAILLE, extra: { textTransform: "uppercase" } })(k, env);
    const mot = k.T("<p>Cultures, élevage, vente à la ferme : tout ce que nous produisons, et comment venir le chercher.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "420px" });
    const gauche = G.colonne(k, [caps(k, "Exploitation agricole", { couleur: BLE, suivi: "0.22em" }), phrase], { poids: 8, min: "300px", gap: "20px" });
    const droite = G.colonne(k, [mot, btn(k, "Nous contacter", "/contact", { texte: SOL, fond: BLE, survolFond: PAILLE, survolTexte: SOL, focus: PAILLE, extra: { alignSelf: "flex-start" } })], { poids: 4, min: "280px", gap: "22px", soi: "flex-end" });
    const tete = G.bande(k, [gauche, droite], { fond: SOL, gap: "40px 64px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    const parcelle = (num, titre, sous, url) => {
      const t = lien(k, titre, url, { taille: 22, poids: "800", police: S.head, bloc: true, survol: { color: BLE, transform: { x: 4 } }, focus: BLE, h: "44px", extra: { textTransform: "uppercase", letterSpacing: "0.02em" } });
      return cartouche(k, [k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "40px", fontWeight: "800", color: BLE, lineHeight: 1 }), t, k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font })], { fond: SOL2, bord: "#f3ead833", bordHaut: "#f3ead833", haut: "4px", survolFond: SOL3, survolHaut: BLE, survolBord: "#f3ead866", hauteur: "200px", min: "230px", leve: -4 });
    };
    const parcelles = G.ligne(k, [parcelle("01", "Cultures", "Céréales, légumes et fourrages de l'exploitation.", "/blog"), parcelle("02", "Élevage", "Les animaux, leur alimentation, leur rythme.", "/blog"), parcelle("03", "Vente à la ferme", "Les produits disponibles et où les trouver.", "/contact"), parcelle("04", "Visites", "Accueil des groupes et des écoles sur demande.", "/contact")], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const bandeParcelles = G.bande(k, [parcelles], { fond: SOL, colonne: true, padV: ["16px", "16px", "8px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Parcelles" });
    const titreH = k.row([souffle(carre(k, BLE), 2800), caps(k, "Horaires de la boutique", { couleur: BLE })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15 })], { poids: 1.2, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: S.fg, survol: BLE, focus: BLE })], { couleurTitre: BLE, poids: 1.2 });
    const colL = bloc(k, "Liens rapides", [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: BLE, transform: { x: 4 } }, focus: BLE })), { couleurTitre: BLE, gap: "0px", min: "200px" });
    const colN = lettre(k, env, G, { titre: "La lettre de la ferme", intro: "Les saisons, les récoltes, les jours de vente : un message de temps en temps.", accent: BLE, survolBouton: PAILLE, survolTexte: SOL, couleurTitre: BLE });
    const grille = G.ligne(k, [colH, colC, colL, colN], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: SOL, colonne: true, gap: "40px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, filetHaut: { epaisseur: "1px", couleur: "#f3ead840" }, nom: "Infos" });
    return [G.racine(k, [tete, bandeParcelles, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-157 « Cercle des adhérents » — coopérative agricole
// Idée : un pied de COOPÉRATIVE, clair et institutionnel. Une barre verticale vert profond borde la phrase en serif « Réunis par la terre. » ; à droite deux grandes lignes d'accès (espace adhérent, devenir
// client ou fournisseur) à filet, qui prennent le vert et glissent au survol ; puis une bande verte : horaires, contact, liens, lettre. Polices : Fraunces (titres) et Public Sans.
const coop = identite({
  key: "c157", label: "Papier vert pâle et vert forêt", humeur: "light",
  fond: "#f3f6ee", texte: "#12301e", discret: "#46594b", accent: "#1f6b3a", surface: "#e4ecdc", encre: "#12301e",
  police: "font.public-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#12301e33",
});
const PAPIER = "#f3f6ee", FORET = "#12301e", VERT = "#1f6b3a", VERT2 = "#e4ecdc", MENTHE = "#a9d9b5";

const cercleAdherents = modeleV2({
  id: identifiantV2(157, "cercle-des-adherents"), concept: "c-157-cercle-des-adherents",
  name: "Cercle des adhérents", family: FAM,
  description: "Pour une coopérative agricole : phrase en serif bordée d'une barre verte, deux grandes lignes d'accès (espace adhérent, devenir client ou fournisseur) qui glissent au survol, puis bande verte avec horaires, contact et lettre.",
  tags: ["coopérative", "adhérents", "agriculture", "espace adhérent", "vert forêt", "institutionnel", "serif"],
  identity: coop,
  racine: racineDe(FORET, "#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const barre = k.col([], { width: "10px", alignSelf: "stretch", backgroundColor: VERT, flexShrink: 0, borderRadius: "0px" }, undefined, { width: "100%", height: "8px", alignSelf: "auto" });
    const phrase = G.geant(`<p>Réunis<br>par <span style="color:${VERT}">la terre.</span></p>`, { taille: [52, 120], tablette: { taille: [76, 100] }, mobile: { taille: [48, 64] }, lh: 1.04, suivi: "-0.02em", poids: "700", police: S.head, couleur: FORET })(k, env);
    const mot = k.T("<p>Une coopérative, ce sont des agriculteurs qui avancent ensemble : productions, collecte, services aux adhérents et aux clients.</p>", { fontSize: "17px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "460px" });
    const texte = G.colonne(k, [caps(k, "Coopérative agricole", { couleur: VERT, suivi: "0.2em" }), phrase, mot], { poids: 1, min: "260px", gap: "20px" });
    const gauche = k.row([barre, texte], { gap: "32px", flexWrap: "nowrap", alignItems: "stretch", flexGrow: 7, flexBasis: "0px", minWidth: "300px" }, undefined, { flexWrap: "wrap", gap: "20px" });
    const acces = (titre, sous, url) => {
      const l = lien(k, `${titre}  →`, url, { taille: 22, poids: "700", police: S.head, bloc: true, couleur: FORET, h: "56px", survol: { color: VERT, transform: { x: 8 } }, focus: VERT, extra: { width: "100%" } });
      const c = k.col([l, k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font })], { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: FORET, paddingTop: "16px", paddingBottom: "22px", paddingLeft: "0px", paddingRight: "0px", gap: "4px", width: "100%", transitionDuration: 380, borderRadius: "0px" });
      c.states = { hover: { borderColor: VERT, paddingLeft: "14px" } };
      return c;
    };
    const droite = G.colonne(k, [acces("Espace adhérent", "Vos documents, vos livraisons, vos contacts.", "/connexion"), acces("Devenir client ou fournisseur", "Présentez-nous votre besoin, nous revenons vers vous.", "/contact"), acces("Actualités de la coopérative", "Campagnes, rendez-vous, informations utiles.", "/blog")], { poids: 5, min: "290px", gap: "0px", soi: "flex-end", extra: { maxWidth: "520px" } });
    const haut = G.bande(k, [gauche, droite], { fond: PAPIER, gap: "48px 72px", aligne: "flex-end", padV: ["88px", "72px", "48px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Coopérative" });
    const titreH = k.row([souffle(carre(k, MENTHE), 2800), caps(k, "Horaires d'accueil", { couleur: MENTHE })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 1.2, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous joindre", [coordonnees(k, { taille: 15, lien: "#ffffff", survol: MENTHE, focus: MENTHE })], { couleurTitre: MENTHE, poids: 1.2 });
    const colL = bloc(k, "La coopérative", [["Accueil", "/"], ["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: "#ffffff", survol: { color: MENTHE, transform: { x: 4 } }, focus: MENTHE })), { couleurTitre: MENTHE, gap: "0px", min: "200px" });
    const colN = lettre(k, env, G, { titre: "Lettre aux adhérents et clients", intro: "Les informations de la coopérative, par courriel.", accent: MENTHE, texte: "#ffffff", survolBouton: "#ffffff", survolTexte: FORET, couleurTitre: MENTHE, surBouton: FORET });
    const grille = G.ligne(k, [colH, colC, colL, colN], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#bfd3c4", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff40"), mentions], { fond: FORET, colonne: true, gap: "40px", padV: ["64px", "52px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Bande verte" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de la dernière bande
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-158 « Étiquette du producteur » — producteur en vente directe
// Idée : l'ÉTIQUETTE de colis. Fond maïs, « Direct du champ. » centré en grandes capitales condensées, trois étiquettes carrées à entête tomate (paniers, marché, commande) qui se soulèvent et noircissent
// leur entête au survol ; une bande tomate sombre porte horaires, contact et lettre. Polices : Bebas Neue (titres) et Karla.
const maisIdentite = identite({
  key: "c158", label: "Maïs, brun et tomate", humeur: "light",
  fond: "#fff1c9", texte: "#2c1d00", discret: "#5c4a1f", accent: "#b3261e", surface: "#ffe7a3", encre: "#2c1d00",
  police: "font.karla", titres: "font.bebas-neue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "2px", ligne: "#2c1d0040",
});
const MAIS = "#fff1c9", BRUN = "#2c1d00", TOMATE = "#b3261e", TOMATE2 = "#8f1c15", CARTON = "#fffaf0";

const etiquetteProducteur = modeleV2({
  id: identifiantV2(158, "etiquette-du-producteur"), concept: "c-158-etiquette-du-producteur",
  name: "Étiquette du producteur", family: FAM,
  description: "Pour un producteur en vente directe : « Direct du champ. » centré en grandes capitales, trois étiquettes carrées à entête tomate (paniers, marché, commande) qui se soulèvent au survol, bande tomate avec horaires, contact et lettre.",
  tags: ["producteur", "vente directe", "paniers", "marché", "circuit court", "tomate", "étiquettes"],
  identity: maisIdentite,
  racine: racineDe(TOMATE2, "#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const sur = caps(k, "Producteur · vente directe", { couleur: TOMATE, suivi: "0.26em", extra: { textAlign: "center" } });
    const phrase = G.geant(`<p>Direct <span style="color:${TOMATE}">du champ.</span></p>`, { taille: [64, 176], tablette: { taille: [110, 150] }, mobile: { taille: [64, 96] }, lh: 0.95, suivi: "0.01em", poids: "400", police: S.head, couleur: BRUN, align: "center", extra: { textTransform: "uppercase" } })(k, env, true);
    const mot = k.T("<p>Pas d'intermédiaire : vous savez qui cultive, quand c'est récolté et où le retirer.</p>", { fontSize: "18px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, textAlign: "center", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" });
    const haut = G.bande(k, [sur, phrase, mot], { fond: MAIS, colonne: true, aligne: "center", gap: "20px", max: "1100px", padV: ["88px", "72px", "52px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    const etiquette = (n, titre, sous, url) => {
      const entete = k.row([k.T(`<p>${n}</p>`, { fontFamily: S.head, fontSize: "26px", color: "#ffffff", lineHeight: 1 }), caps(k, "Étiquette", { couleur: "#ffffff", taille: "12px" })], { gap: "12px", alignItems: "baseline", flexWrap: "nowrap", backgroundColor: TOMATE, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "18px", paddingRight: "18px", width: "100%", transitionDuration: 320, borderRadius: "0px" });
      const corps = k.col([lien(k, `${titre}  →`, url, { taille: 22, poids: "800", bloc: true, couleur: BRUN, survol: { color: TOMATE, transform: { x: 4 } }, focus: TOMATE }), k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font })], { paddingTop: "18px", paddingBottom: "22px", paddingLeft: "18px", paddingRight: "18px", gap: "6px", width: "100%", borderRadius: "0px" });
      const c = k.col([entete, corps], { backgroundColor: CARTON, borderStyle: "solid", borderWidth: "2px", borderColor: BRUN, borderRadius: "0px", gap: "0px", flexGrow: 1, flexBasis: "0px", minWidth: "240px", alignItems: "stretch", transitionDuration: 340 });
      c.states = { hover: { transform: { y: -6 }, backgroundColor: "#ffffff" } };
      return c;
    };
    const etiquettes = G.ligne(k, [etiquette("N°1", "Paniers", "Composition de la semaine, abonnement ou à l'unité.", "/blog"), etiquette("N°2", "Marchés", "Les jours et les lieux où nous installer.", "/blog"), etiquette("N°3", "Commander", "Passer commande et choisir son retrait.", "/contact")], { gap: "20px", aligne: "stretch", largeur: "100%" });
    const bandeE = G.bande(k, [etiquettes], { fond: MAIS, colonne: true, max: "1100px", padV: ["16px", "16px", "8px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Étiquettes" });
    const titreH = k.row([souffle(carre(k, "#ffe27a"), 2800), caps(k, "Retrait et horaires", { couleur: "#ffe27a" })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 1.2, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: "#ffffff", survol: "#ffe27a", focus: "#ffe27a" })], { couleurTitre: "#ffe27a", poids: 1.2 });
    const colN = lettre(k, env, G, { titre: "Les récoltes par courriel", intro: "Ce qui est de saison, ce qui part vite : un message avant chaque vente.", accent: "#ffe27a", texte: "#ffffff", survolBouton: "#ffffff", survolTexte: TOMATE2, couleurTitre: "#ffe27a", surBouton: BRUN });
    const grille = G.ligne(k, [colH, colC, colN], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#ffd9d4", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff55"), mentions], { fond: TOMATE2, colonne: true, gap: "40px", padV: ["64px", "52px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Retrait" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de la dernière bande
    return [G.racine(k, [haut, bandeE, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-159 « Étiquette de cuvée » — vigneron
// Idée : une ÉTIQUETTE DE BOUTEILLE. Bordeaux profond, ivoire et cuivre. À gauche, un cartouche à double filet (nom du domaine fictif, « Du cep à la bouteille. », bouton de visite) ; à droite, un index
// numéroté en chiffres romains (cuvées, visite et dégustation, caveau, commander, actualités) dont chaque ligne éclaircit son fond et glisse au survol. Polices : Cormorant Garamond (titres) et Hanken Grotesk.
// « Domaine des Hautes Vignes » est un nom FICTIF à remplacer dans l'éditeur.
const bordeaux = identite({
  key: "c159", label: "Bordeaux, ivoire et cuivre", humeur: "dark",
  fond: "#2a0e17", texte: "#f3ead9", discret: "#d3c3ae", accent: "#d1a766", surface: "#3a1622", encre: "#2a0e17", surEncre: "#f3ead9",
  police: "font.hanken-grotesk", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f3ead840",
});
const BORD = "#2a0e17", BORD2 = "#3a1622", BORD3 = "#4a1d2c", CUIVRE = "#d1a766", IVOIRE = "#f3ead9";

const etiquetteCuvee = modeleV2({
  id: identifiantV2(159, "etiquette-de-cuvee"), concept: "c-159-etiquette-de-cuvee",
  name: "Étiquette de cuvée", family: FAM,
  description: "Pour un vigneron : cartouche à double filet façon étiquette de bouteille, index en chiffres romains (cuvées, visite, caveau, commande) qui glisse au survol, puis horaires du caveau, contact et lettre. Bordeaux, ivoire et cuivre.",
  tags: ["vigneron", "domaine viticole", "cuvées", "dégustation", "caveau", "bordeaux", "cuivre"],
  identity: bordeaux,
  racine: racineDe(BORD),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const interieur = k.col([
      caps(k, "Vigneron · propriété familiale", { couleur: CUIVRE, suivi: "0.24em", extra: { textAlign: "center" } }),
      G.geant(`<p>Domaine des<br>Hautes Vignes</p>`, { taille: [40, 72], tablette: { taille: [52, 68] }, mobile: { taille: [38, 52] }, lh: 1.05, suivi: "0em", poids: "600", police: S.head, couleur: IVOIRE, align: "center" })(k, env, true),
      G.filet({ largeur: "56px", epaisseur: "1px", couleur: CUIVRE })(k, env, true),
      k.T("<p>Du cep à la bouteille.</p>", { fontFamily: S.head, fontSize: "26px", fontStyle: "italic", fontWeight: "500", color: CUIVRE, textAlign: "center", lineHeight: 1.2 }),
      btn(k, "Venir déguster", "/contact", { texte: BORD, fond: CUIVRE, survolFond: IVOIRE, survolTexte: BORD, focus: IVOIRE, casse: "uppercase", suivi: "0.14em", taille: 14, extra: { alignSelf: "center" } }),
    ], { borderStyle: "solid", borderWidth: "1px", borderColor: "#d1a76699", borderRadius: "0px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "28px", paddingRight: "28px", gap: "20px", alignItems: "center", width: "100%" });
    const cadreExt = k.col([interieur], { borderStyle: "solid", borderWidth: "1px", borderColor: "#d1a76699", borderRadius: "0px", padding: "8px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "8px", paddingRight: "8px", width: "100%", transitionDuration: 400 });
    cadreExt.states = { hover: { borderColor: CUIVRE } };
    const gauche = G.colonne(k, [cadreExt], { poids: 5, min: "300px", extra: { maxWidth: "520px" } });
    const ligneIndex = (num, titre, url) => {
      const l = lien(k, titre, url, { taille: 24, poids: "600", police: S.head, bloc: true, couleur: IVOIRE, h: "56px", survol: { color: CUIVRE, transform: { x: 6 } }, focus: CUIVRE, extra: { width: "100%" } });
      const r = k.row([k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "20px", fontWeight: "500", color: CUIVRE, minWidth: "44px", letterSpacing: "0.06em" }), l, k.T("<p>→</p>", { color: CUIVRE, fontSize: "20px", fontFamily: S.font })], { flexWrap: "nowrap", alignItems: "center", gap: "12px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f3ead840", paddingLeft: "10px", paddingRight: "14px", borderRadius: "0px", transitionDuration: 360 });
      r.states = { hover: { backgroundColor: BORD2, borderColor: CUIVRE } };
      return r;
    };
    const index = G.colonne(k, [caps(k, "Le domaine", { couleur: CUIVRE, suivi: "0.24em", extra: { marginBottom: "6px" } }), ligneIndex("I", "Nos cuvées", "/blog"), ligneIndex("II", "Visite et dégustation", "/contact"), ligneIndex("III", "Caveau et boutique", "/contact"), ligneIndex("IV", "Commander", "/contact"), ligneIndex("V", "Actualités du domaine", "/blog")], { poids: 7, min: "300px", gap: "0px", soi: "center" });
    const haut = G.bande(k, [gauche, index], { fond: BORD, gap: "56px 80px", aligne: "center", padV: ["96px", "72px", "52px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Étiquette" });
    const titreH = k.row([souffle(carre(k, CUIVRE, "10px"), 3600), caps(k, "Horaires du caveau", { couleur: CUIVRE, suivi: "0.2em" })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15 })], { poids: 1.2, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: IVOIRE, survol: CUIVRE, focus: CUIVRE })], { couleurTitre: CUIVRE, suiviTitre: "0.2em", poids: 1.2 });
    const colN = lettre(k, env, G, { titre: "Les nouvelles du domaine", intro: "Millésimes, portes ouvertes, vendanges : quelques lignes, sans excès.", accent: CUIVRE, survolBouton: IVOIRE, survolTexte: BORD, couleurTitre: CUIVRE });
    const grille = G.ligne(k, [colH, colC, colN], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mention = k.T("<p>L'abus d'alcool est dangereux pour la santé. À consommer avec modération.</p>", { fontSize: "13px", color: S.mute, fontFamily: S.font, lineHeight: 1.5 });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mention, mentions], { fond: BORD, colonne: true, gap: "32px", padV: ["24px", "16px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Caveau" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-160 « Fiche technique » — transformation agroalimentaire
// Idée : une FICHE PRODUIT industrielle. Fond gris clair, filet de contrôle en quatre segments colorés, phrase en police mono « De la matière au produit. », puis un tableau de quatre cellules à filets fins
// (qualité, traçabilité, catalogue, espace pro) dont le fond s'éclaircit et le filet du haut devient orange au survol ; deux boutons pros, contact, horaires et bande bleu nuit avec la lettre.
// Polices : IBM Plex Sans (texte) et IBM Plex Mono (titres, libellés). Aucune certification ni chiffre inventé.
const usine = identite({
  key: "c160", label: "Gris clair, bleu nuit et orange", humeur: "light",
  fond: "#eef1f3", texte: "#0f2a43", discret: "#3f566b", accent: "#0f2a43", surface: "#ffffff", encre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0f2a4333",
});
const GRIS = "#eef1f3", NUIT = "#0f2a43", NUIT2 = "#0a1d30", ORANGE = "#f28c28", SAUGE = "#7ea58a", ACIER = "#9aa9b6";

const ficheTechnique = modeleV2({
  id: identifiantV2(160, "fiche-technique"), concept: "c-160-fiche-technique",
  name: "Fiche technique", family: FAM,
  description: "Pour une entreprise de transformation agroalimentaire : filet de contrôle coloré, phrase en police mono, tableau de quatre cellules à filets fins (qualité, traçabilité, catalogue, espace pro), boutons pros, contact et bande bleu nuit.",
  tags: ["agroalimentaire", "transformation", "industrie alimentaire", "professionnels", "fiche technique", "bleu nuit", "orange"],
  identity: usine,
  racine: racineDe(NUIT2, "#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const seg = (c) => k.col([], { flexGrow: 1, flexBasis: "0px", height: "8px", backgroundColor: c, borderRadius: "0px" });
    const controle = { type: "container", props: { full: true }, children: [k.row([seg(NUIT), seg(ORANGE), seg(SAUGE), seg(ACIER)], { gap: "0px", flexWrap: "nowrap", width: "100%", alignItems: "stretch" })], ...sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: GRIS, gap: "0px" }) };
    const phrase = G.geant(`<p>De la matière<br>au <span style="color:#b95a00">produit.</span></p>`, { taille: [36, 92], tablette: { taille: [56, 80] }, mobile: { taille: [34, 48] }, lh: 1.08, suivi: "-0.03em", poids: "700", police: S.head, couleur: NUIT })(k, env);
    const gauche = G.colonne(k, [caps(k, "Transformation agroalimentaire", { couleur: S.mute, suivi: "0.2em", police: S.head }), phrase], { poids: 7, min: "300px", gap: "18px" });
    const boutons = k.row([
      btn(k, "Contacter le service pro", "/contact", { texte: NUIT, fond: ORANGE, survolFond: NUIT, survolTexte: "#ffffff", focus: NUIT, taille: 15 }),
      btn(k, "Demander la documentation", "/contact", { texte: NUIT, fond: undefined, bord: NUIT, survolFond: NUIT, survolTexte: "#ffffff", focus: ORANGE, taille: 15 }),
    ], { gap: "12px" });
    const droite = G.colonne(k, [k.T("<p>Cahiers des charges, fiches produits, échantillons : indiquez votre besoin, un interlocuteur vous répond.</p>", { fontSize: "16px", lineHeight: 1.6, color: S.mute, fontFamily: S.font }), boutons], { poids: 5, min: "290px", gap: "20px", soi: "flex-end" });
    const tete = G.bande(k, [gauche, droite], { fond: GRIS, gap: "36px 64px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Fiche" });
    const cellule = (code, titre, sous, url) => cartouche(k, [caps(k, code, { couleur: "#b95a00", police: S.head, suivi: "0.08em" }), lien(k, `${titre}  →`, url, { taille: 19, poids: "700", police: S.head, bloc: true, couleur: NUIT, survol: { color: "#b95a00", transform: { x: 4 } }, focus: NUIT }), k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font })], { fond: "#ffffff", bord: "#0f2a4333", bordHaut: NUIT, haut: "4px", survolFond: "#fff6ea", survolBord: "#0f2a4333", survolHaut: ORANGE, hauteur: "176px", min: "230px", leve: -3 });
    const tableau = G.ligne(k, [cellule("A1", "Qualité", "Nos engagements et nos contrôles, expliqués simplement.", "/faq"), cellule("A2", "Traçabilité", "D'où viennent les matières premières et comment on les suit.", "/faq"), cellule("A3", "Catalogue", "Les gammes et les formats proposés.", "/blog"), cellule("A4", "Espace pro", "Commandes et documents des clients professionnels.", "/connexion")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandeT = G.bande(k, [tableau], { fond: GRIS, colonne: true, padV: ["8px", "8px", "4px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Tableau" });
    const titreH = k.row([souffle(carre(k, ORANGE, "10px"), 3000), caps(k, "Horaires", { couleur: ORANGE, police: S.head })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 1.2, min: "240px", gap: "14px" });
    const colC = bloc(k, "Contact", [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: ORANGE, focus: ORANGE })], { couleurTitre: ORANGE, police: S.head, poids: 1.2 });
    const colN = lettre(k, env, G, { titre: "Actualités de l'entreprise", intro: "Nouveaux produits et informations pour les clients, par courriel.", accent: ORANGE, texte: "#ffffff", survolBouton: "#ffffff", survolTexte: NUIT, couleurTitre: ORANGE, surBouton: NUIT });
    const grille = G.ligne(k, [colH, colC, colN], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b7c4d1", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff40"), mentions], { fond: NUIT2, colonne: true, gap: "40px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Bande bleu nuit" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de la dernière bande
    return [G.racine(k, [controle, tete, bandeT, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Agriculture et agroalimentaire", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : exploitation, coopérative, producteur, vigneron, transformation agroalimentaire.",
  models: [registreFerme, cercleAdherents, etiquetteProducteur, etiquetteCuvee, ficheTechnique],
};
