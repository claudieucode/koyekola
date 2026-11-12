// Famille v2 « Recrutement et formation » — 5 modèles (ft2-161 à ft2-165), extension « carrée » : ANGLES DROITS partout (aucun border-radius), sites standard très professionnels.
// Cabinet de recrutement, agence d'intérim, organisme de formation professionnelle, centre de compétences, coaching professionnel. Marques fictives ; aucune coordonnée, aucun chiffre, aucune certification inventés
// (horaires, adresse, téléphone viennent des « Données de l'entreprise » ; les rubriques et adresses de réseaux sont des EXEMPLES à renommer dans l'éditeur).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 300 à 450 ms (fond, filet, couleur, décalage de 2 à 8 px) posées par `transitionDuration` ; « souffle » lent d'un carré (`motion` pulse) ;
//   cartouches qui se soulèvent au survol. Aucune animation d'entrée ni widget « Défilement continu » (limites du moteur, voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "recrutement-formation";

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
// ft2-161 « Quatre étapes » — cabinet de recrutement
// Idée : la MÉTHODE en quatre étapes numérotées (brief, recherche, entretiens, intégration), chiffres géants cobalt sur fond blanc ; chaque étape a un filet noir qui devient cobalt et un fond bleu très pâle
// au survol ; deux boutons francs (déposer une offre, envoyer sa candidature) ; bande bleu nuit pour contact, horaires et lettre. Polices : Sora (titres) et Inter.
const cabinet = identite({
  key: "c161", label: "Blanc, cobalt et bleu nuit", humeur: "light",
  fond: "#ffffff", texte: "#0b1630", discret: "#46536b", accent: "#1d3fd1", surface: "#eef2ff", encre: "#ffffff",
  police: "font.inter", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#0b163033",
});
const BLANC = "#ffffff", ENCRE = "#0b1630", COBALT = "#1d3fd1", PALE = "#eef2ff", CIEL = "#9db4ff";

const quatreEtapes = modeleV2({
  id: identifiantV2(161, "quatre-etapes"), concept: "c-161-quatre-etapes",
  name: "Quatre étapes", family: FAM,
  description: "Pour un cabinet de recrutement : phrase nette, deux boutons francs (déposer une offre, candidater), quatre étapes numérotées à filet qui devient cobalt au survol, bande bleu nuit avec contact, horaires et lettre.",
  tags: ["cabinet de recrutement", "recrutement", "étapes numérotées", "offre", "candidature", "cobalt", "blanc"],
  identity: cabinet,
  racine: racineDe(ENCRE, "#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Le bon profil,<br><span style="color:${COBALT}">en quatre étapes.</span></p>`, { taille: [40, 96], tablette: { taille: [60, 84] }, mobile: { taille: [38, 52] }, lh: 1.05, suivi: "-0.03em", poids: "800", police: S.head, couleur: ENCRE })(k, env);
    const gauche = G.colonne(k, [caps(k, "Cabinet de recrutement", { couleur: COBALT, suivi: "0.2em" }), phrase], { poids: 8, min: "300px", gap: "18px" });
    const boutons = k.col([
      btn(k, "Déposer une offre", "/contact", { texte: "#ffffff", fond: COBALT, survolFond: ENCRE, survolTexte: "#ffffff", focus: ENCRE, extra: { width: "100%" } }),
      btn(k, "Envoyer sa candidature", "/contact", { texte: ENCRE, fond: undefined, bord: ENCRE, survolFond: ENCRE, survolTexte: "#ffffff", focus: COBALT, extra: { width: "100%" } }),
    ], { gap: "12px", width: "100%", maxWidth: "340px" });
    const droite = G.colonne(k, [boutons], { poids: 4, min: "280px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: BLANC, gap: "36px 64px", aligne: "flex-end", padV: ["88px", "72px", "48px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Méthode" });
    const etape = (n, titre, sous) => cartouche(k, [k.T(`<p>${n}</p>`, { fontFamily: S.head, fontSize: "56px", fontWeight: "800", color: COBALT, lineHeight: 1, letterSpacing: "-0.04em" }), k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "20px", fontWeight: "700", color: ENCRE, lineHeight: 1.2 }), k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.55, color: S.mute, fontFamily: S.font })], { fond: BLANC, bord: "#0b163026", bordHaut: ENCRE, haut: "4px", survolFond: PALE, survolBord: "#0b163026", survolHaut: COBALT, hauteur: "210px", min: "220px", leve: -4 });
    const etapes = G.ligne(k, [etape("01", "Brief", "Nous cernons le poste, l'équipe et ce qui compte vraiment."), etape("02", "Recherche", "Approche directe et réseau pour trouver les bons profils."), etape("03", "Entretiens", "Une sélection argumentée, présentée sans jargon."), etape("04", "Intégration", "Un suivi après l'arrivée pour que la collaboration prenne.")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandeE = G.bande(k, [etapes], { fond: BLANC, colonne: true, padV: ["8px", "8px", "4px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Étapes" });
    const titreH = k.row([souffle(carre(k, CIEL), 2800), caps(k, "Horaires", { couleur: CIEL })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 1.1, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous contacter", [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: CIEL, focus: CIEL })], { couleurTitre: CIEL, poids: 1.1 });
    const colL = bloc(k, "Liens utiles", [["Accueil", "/"], ["Conseils et actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace candidat", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: "#ffffff", survol: { color: CIEL, transform: { x: 4 } }, focus: CIEL })), { couleurTitre: CIEL, gap: "0px", min: "200px" });
    const colN = lettre(k, env, G, { titre: "Offres et conseils", intro: "Les postes à pourvoir et nos conseils de carrière, par courriel.", accent: CIEL, texte: "#ffffff", survolBouton: "#ffffff", survolTexte: ENCRE, couleurTitre: CIEL, surBouton: ENCRE });
    const grille = G.ligne(k, [colH, colC, colL, colN], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b9c3d9", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff40"), mentions], { fond: ENCRE, colonne: true, gap: "40px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Bande bleu nuit" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de la dernière bande
    return [G.racine(k, [haut, bandeE, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-162 « Mission suivante » — agence d'intérim
// Idée : un pied de CHANTIER, jaune sécurité et noir. Grand bloc jaune « On vous place. » (capitales Oswald) avec deux gros boutons noirs (je cherche une mission, je recrute), une bande blanche de trois
// pas numérotés (m'inscrire, rencontrer l'agence, commencer) puis un bas noir : agence (horaires, contact), métiers, lettre. Le carré jaune des horaires « respire ». Polices : Oswald (titres) et Public Sans.
const interim = identite({
  key: "c162", label: "Jaune sécurité et noir", humeur: "dark",
  fond: "#111111", texte: "#ffffff", discret: "#c9c9c9", accent: "#ffd400", surface: "#1d1d1d", encre: "#111111", surEncre: "#ffffff",
  police: "font.public-sans", titres: "font.oswald",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#ffffff40",
});
const JAUNE = "#ffd400", NOIR = "#111111", NOIR2 = "#1d1d1d";

const missionSuivante = modeleV2({
  id: identifiantV2(162, "mission-suivante"), concept: "c-162-mission-suivante",
  name: "Mission suivante", family: FAM,
  description: "Pour une agence d'intérim : bloc jaune « On vous place. » avec deux gros boutons noirs (chercher une mission, recruter), trois pas numérotés, puis bande noire avec agence, horaires, métiers et lettre.",
  tags: ["intérim", "agence d'emploi", "mission", "candidats", "entreprises", "jaune", "noir"],
  identity: interim,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>On vous<br>place.</p>`, { taille: [64, 176], tablette: { taille: [104, 150] }, mobile: { taille: [64, 100] }, lh: 0.98, suivi: "-0.01em", poids: "700", police: S.head, couleur: NOIR, extra: { textTransform: "uppercase" } })(k, env);
    const gauche = G.colonne(k, [caps(k, "Agence d'intérim", { couleur: NOIR, suivi: "0.22em" }), phrase], { poids: 7, min: "300px", gap: "16px" });
    const boutons = k.col([
      btn(k, "Je cherche une mission  →", "/contact", { texte: JAUNE, fond: NOIR, survolFond: "#ffffff", survolTexte: NOIR, bord: NOIR, focus: "#ffffff", h: "64px", taille: 18, casse: "uppercase", suivi: "0.06em", extra: { width: "100%", justifyContent: "space-between" } }),
      btn(k, "Je recrute  →", "/contact", { texte: NOIR, fond: undefined, bord: NOIR, survolFond: NOIR, survolTexte: JAUNE, focus: "#ffffff", h: "64px", taille: 18, casse: "uppercase", suivi: "0.06em", extra: { width: "100%", justifyContent: "space-between" } }),
    ], { gap: "12px", width: "100%", maxWidth: "420px" });
    const droite = G.colonne(k, [k.T("<p>Une mission, un contrat, un renfort : dites-nous ce que vous cherchez, une conseillère ou un conseiller vous rappelle.</p>", { fontSize: "16px", lineHeight: 1.55, color: NOIR, fontFamily: S.font, maxWidth: "420px" }), boutons], { poids: 5, min: "290px", gap: "20px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: JAUNE, gap: "36px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "On vous place" });
    const pas = (n, t) => {
      const c = k.row([k.T(`<p>${n}</p>`, { fontFamily: S.head, fontSize: "44px", fontWeight: "700", color: NOIR, lineHeight: 1 }), k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "22px", fontWeight: "500", color: NOIR, textTransform: "uppercase", letterSpacing: "0.02em" })], { flexWrap: "nowrap", alignItems: "center", gap: "16px", flexGrow: 1, flexBasis: "0px", minWidth: "220px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "6px", borderColor: NOIR, borderRadius: "0px", transitionDuration: 340 });
      c.states = { hover: { backgroundColor: JAUNE, borderColor: NOIR, transform: { y: -3 } } };
      return c;
    };
    const pasLigne = G.ligne(k, [pas("1", "Je m'inscris"), pas("2", "On se rencontre"), pas("3", "Je commence")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandePas = G.bande(k, [pasLigne], { fond: "#ffffff", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Trois pas" });
    const titreH = k.row([souffle(carre(k, JAUNE), 2600), caps(k, "L'agence", { couleur: JAUNE })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15 })], { poids: 1.2, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: "#ffffff", survol: JAUNE, focus: JAUNE })], { couleurTitre: JAUNE, poids: 1.2 });
    const colM = bloc(k, "Nos métiers", [["Logistique", "/blog"], ["Bâtiment", "/blog"], ["Industrie", "/blog"], ["Bureau et accueil", "/blog"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: JAUNE, transform: { x: 6 } }, focus: JAUNE })), { couleurTitre: JAUNE, gap: "0px", min: "180px" });
    const colN = lettre(k, env, G, { titre: "Les missions du moment", intro: "Les offres à pourvoir, par courriel.", accent: JAUNE, survolBouton: "#ffffff", survolTexte: NOIR, couleurTitre: JAUNE, surBouton: NOIR });
    const grille = G.ligne(k, [colH, colC, colM, colN], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line, "1px"), mentions], { fond: NOIR, colonne: true, gap: "40px", padV: ["64px", "52px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Agence" });
    return [G.racine(k, [haut, bandePas, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-163 « Catalogue des formations » — organisme de formation professionnelle
// Idée : un SOMMAIRE de catalogue. Fond vert d'eau, à gauche « Se former, c'est avancer. » et deux boutons (voir les formations, poser une question) ; à droite cinq lignes numérotées de domaines de formation
// (exemples) séparées par des filets, qui blanchissent et dont la flèche avance au survol ; bande vert sapin pour horaires, contact et lettre. Aucun financement, aucune certification, aucun chiffre annoncé.
// Polices : Plus Jakarta Sans (titres) et Source Sans 3 (Bricolage Grotesque et Figtree sont déjà déclarées par landing.css avec des sous-ensembles non chargés : le test de chargement des polices les refuse).
const formation = identite({
  key: "c163", label: "Vert d'eau, sapin et orange", humeur: "light",
  fond: "#e4f0ee", texte: "#0a3d3b", discret: "#3d5f5c", accent: "#0a3d3b", surface: "#ffffff", encre: "#ffffff",
  police: "font.source-sans-3", titres: "font.plus-jakarta-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0a3d3b40",
});
const EAU = "#e4f0ee", SAPIN = "#0a3d3b", SAPIN2 = "#072b2a", ORANGE = "#ff7a2f";

const catalogueFormations = modeleV2({
  id: identifiantV2(163, "catalogue-des-formations"), concept: "c-163-catalogue-des-formations",
  name: "Catalogue des formations", family: FAM,
  description: "Pour un organisme de formation professionnelle : « Se former, c'est avancer. », deux boutons, sommaire de cinq domaines numérotés qui blanchissent au survol, puis bande sapin avec horaires, contact et lettre d'information.",
  tags: ["organisme de formation", "formation professionnelle", "catalogue", "stages", "vert d'eau", "orange", "sommaire"],
  identity: formation,
  racine: racineDe(SAPIN2, "#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Se former,<br>c'est <span style="color:#b04a0c">avancer.</span></p>`, { taille: [44, 104], tablette: { taille: [68, 90] }, mobile: { taille: [42, 58] }, lh: 1.02, suivi: "-0.03em", poids: "800", police: S.head, couleur: SAPIN })(k, env);
    const mot = k.T("<p>Des formations pour les salariés, les équipes et les personnes en reconversion. Parlez-nous de votre besoin, on vous oriente.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "440px" });
    const boutons = k.row([btn(k, "Voir les formations", "/blog", { texte: SAPIN, fond: ORANGE, survolFond: SAPIN, survolTexte: "#ffffff", focus: SAPIN }), btn(k, "Poser une question", "/contact", { texte: SAPIN, fond: undefined, bord: SAPIN, survolFond: SAPIN, survolTexte: "#ffffff", focus: ORANGE })], { gap: "12px" });
    const gauche = G.colonne(k, [caps(k, "Organisme de formation", { couleur: "#b04a0c", suivi: "0.2em" }), phrase, mot, boutons], { poids: 6, min: "300px", gap: "22px" });
    const ligneDomaine = (num, titre, url) => {
      const l = lien(k, titre, url, { taille: 22, poids: "700", police: S.head, bloc: true, couleur: SAPIN, h: "60px", survol: { color: "#b04a0c", transform: { x: 4 } }, focus: SAPIN, extra: { width: "100%" } });
      const r = k.row([k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "16px", fontWeight: "700", color: "#b04a0c", minWidth: "40px" }), l, k.T("<p>→</p>", { color: SAPIN, fontSize: "22px", fontFamily: S.font })], { flexWrap: "nowrap", alignItems: "center", gap: "10px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#0a3d3b55", paddingLeft: "12px", paddingRight: "16px", borderRadius: "0px", transitionDuration: 360 });
      r.states = { hover: { backgroundColor: "#ffffff", borderColor: SAPIN, paddingLeft: "22px" } };
      return r;
    };
    const sommaire = G.colonne(k, [caps(k, "Sommaire · exemples de domaines", { couleur: SAPIN, extra: { marginBottom: "8px" } }), ligneDomaine("01", "Management et gestion", "/blog"), ligneDomaine("02", "Numérique et bureautique", "/blog"), ligneDomaine("03", "Santé et sécurité au travail", "/blog"), ligneDomaine("04", "Langues et communication", "/blog"), ligneDomaine("05", "Métiers techniques", "/blog")], { poids: 6, min: "300px", gap: "0px", soi: "flex-end", extra: { maxWidth: "560px" } });
    const haut = G.bande(k, [gauche, sommaire], { fond: EAU, gap: "48px 72px", aligne: "flex-end", padV: ["88px", "72px", "48px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Catalogue" });
    const titreH = k.row([souffle(carre(k, ORANGE), 2800), caps(k, "Accueil téléphonique et horaires", { couleur: ORANGE })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 1.2, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous contacter", [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: ORANGE, focus: ORANGE })], { couleurTitre: ORANGE, poids: 1.2 });
    const colN = lettre(k, env, G, { titre: "Nouvelles sessions", intro: "Les prochaines sessions et les nouveautés du catalogue, par courriel.", accent: ORANGE, texte: "#ffffff", survolBouton: "#ffffff", survolTexte: SAPIN, couleurTitre: ORANGE, surBouton: SAPIN });
    const grille = G.ligne(k, [colH, colC, colN], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b3cfcc", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff40"), mentions], { fond: SAPIN2, colonne: true, gap: "40px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Bande sapin" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de la dernière bande
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-164 « Escalier de niveaux » — centre de compétences
// Idée : un ESCALIER de trois marches rectangulaires (découvrir, pratiquer, maîtriser) de hauteurs croissantes, alignées en bas, avec une jauge à angles droits qui se remplit de 1/3 à 3/3 ; chaque marche
// s'éclaire (fond, filet citron) et monte de 6 px au survol. Fond indigo profond, citron vif. À gauche la phrase « Montez d'un niveau. » et deux boutons ; en bas contact, horaires, lettre. Le carré citron du titre « respire ».
// Polices : Space Grotesk (titres) et DM Sans.
const competences = identite({
  key: "c164", label: "Indigo profond et citron", humeur: "dark",
  fond: "#1c1538", texte: "#f3f0ff", discret: "#c9c1ea", accent: "#c8f03c", surface: "#2a2150", encre: "#1c1538", surEncre: "#f3f0ff",
  police: "font.dm-sans", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f3f0ff40",
});
const INDIGO = "#1c1538", INDIGO2 = "#2a2150", INDIGO3 = "#372c68", CITRON = "#c8f03c", LILAS = "#f3f0ff";

const escalierNiveaux = modeleV2({
  id: identifiantV2(164, "escalier-de-niveaux"), concept: "c-164-escalier-de-niveaux",
  name: "Escalier de niveaux", family: FAM,
  description: "Pour un centre de compétences : phrase « Montez d'un niveau. », deux boutons, trois marches de hauteurs croissantes avec jauge (découvrir, pratiquer, maîtriser) qui s'éclairent au survol, puis contact, horaires et lettre. Indigo et citron.",
  tags: ["centre de compétences", "montée en compétences", "niveaux", "parcours", "indigo", "citron", "escalier"],
  identity: competences,
  racine: racineDe(INDIGO),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Montez<br>d'un <span style="color:${CITRON}">niveau.</span></p>`, { taille: [48, 112], tablette: { taille: [72, 96] }, mobile: { taille: [46, 64] }, lh: 1.0, suivi: "-0.035em", poids: "700", police: S.head, couleur: LILAS })(k, env);
    const mot = k.T("<p>Évaluer ses acquis, pratiquer en situation, devenir référent : un parcours en trois niveaux, adapté à votre rythme.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "400px" });
    const boutons = k.row([btn(k, "Évaluer mon niveau", "/contact", { texte: INDIGO, fond: CITRON, survolFond: LILAS, survolTexte: INDIGO, focus: LILAS }), btn(k, "Parcours sur mesure", "/contact", { texte: LILAS, fond: undefined, bord: LILAS, survolFond: LILAS, survolTexte: INDIGO, focus: CITRON })], { gap: "12px" });
    const titreC = k.row([souffle(carre(k, CITRON), 2800), caps(k, "Centre de compétences", { couleur: CITRON, suivi: "0.2em" })], { gap: "10px", alignItems: "center" });
    const gauche = G.colonne(k, [titreC, phrase, mot, boutons], { poids: 6, min: "300px", gap: "22px" });
    const marche = (n, titre, sous, tiers, hauteur) => {
      const jauge = k.row([k.col([], { height: "8px", width: `${tiers * 33.333}%`, backgroundColor: CITRON, flexShrink: 0, borderRadius: "0px" })], { flexWrap: "nowrap", width: "100%", gap: "0px", backgroundColor: "#f3f0ff33", borderRadius: "0px", alignItems: "stretch" });
      const c = cartouche(k, [k.T(`<p>NIVEAU ${n}</p>`, { fontFamily: S.head, fontSize: "12px", fontWeight: "700", letterSpacing: "0.16em", color: CITRON }), lien(k, `${titre}  →`, "/blog", { taille: 22, poids: "700", police: S.head, bloc: true, survol: { color: CITRON, transform: { x: 4 } }, focus: CITRON }), k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font }), jauge], { fond: INDIGO2, bord: "#f3f0ff33", bordHaut: "#f3f0ff33", haut: "4px", survolFond: INDIGO3, survolHaut: CITRON, survolBord: "#f3f0ff66", hauteur: hauteur, justifie: "flex-end", min: "180px", leve: -6, gap: "12px", mobile: { minHeight: "140px" } });
      return c;
    };
    const escalier = G.ligne(k, [marche(1, "Découvrir", "Faire le point sur ses acquis.", 1, "220px"), marche(2, "Pratiquer", "S'exercer sur des cas réels.", 2, "290px"), marche(3, "Maîtriser", "Transmettre et devenir référent.", 3, "360px")], { gap: "0px", aligne: "flex-end", largeur: "100%" });
    const droite = G.colonne(k, [escalier], { poids: 6, min: "300px", soi: "flex-end", extra: { maxWidth: "640px" } });
    const haut = G.bande(k, [gauche, droite], { fond: INDIGO, gap: "48px 64px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Escalier" });
    const colH = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: CITRON, poids: 1.2 });
    const colC = bloc(k, "Nous contacter", [coordonnees(k, { taille: 15, lien: LILAS, survol: CITRON, focus: CITRON })], { couleurTitre: CITRON, poids: 1.2 });
    const colL = bloc(k, "Liens rapides", [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace apprenant", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: CITRON, transform: { x: 4 } }, focus: CITRON })), { couleurTitre: CITRON, gap: "0px", min: "200px" });
    const colN = lettre(k, env, G, { titre: "Rester au niveau", intro: "Nouveaux parcours et conseils de progression, par courriel.", accent: CITRON, survolBouton: LILAS, survolTexte: INDIGO, couleurTitre: CITRON, surBouton: INDIGO });
    const grille = G.ligne(k, [colH, colC, colL, colN], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: INDIGO, colonne: true, gap: "40px", padV: ["16px", "8px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Infos" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-165 « Rendez-vous de carrière » — coaching professionnel
// Idée : un pied CENTRÉ, posé, comme un cabinet. Fond pierre, phrase serif centrée « Et si la suite commençait ici ? », deux boutons francs (réserver un échange, découvrir l'accompagnement) ; trois colonnes
// séparées par des filets verticaux (bilan, prise de poste, transition) dont le filet du haut devient terracotta au survol ; une épaisse barre terracotta ferme la page avant contact, horaires, lettre.
// Polices : Playfair Display (titres) et Albert Sans. Aucune promesse chiffrée, aucun témoignage inventé.
const coaching = identite({
  key: "c165", label: "Pierre, encre et terracotta", humeur: "light",
  fond: "#ebe6dd", texte: "#221d19", discret: "#564d44", accent: "#a93f20", surface: "#f6f2ea", encre: "#ffffff",
  police: "font.albert-sans", titres: "font.playfair-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#221d1933",
});
const PIERRE = "#ebe6dd", ENCRE2 = "#221d19", TERRA = "#a93f20", LIN = "#f6f2ea";

const rendezVousCarriere = modeleV2({
  id: identifiantV2(165, "rendez-vous-de-carriere"), concept: "c-165-rendez-vous-de-carriere",
  name: "Rendez-vous de carrière", family: FAM,
  description: "Pour un coach professionnel : phrase serif centrée « Et si la suite commençait ici ? », deux boutons francs, trois colonnes à filets (bilan, prise de poste, transition) qui prennent la couleur terracotta au survol, contact, horaires et lettre.",
  tags: ["coaching professionnel", "bilan de carrière", "prise de poste", "transition", "pierre", "terracotta", "serif"],
  identity: coaching,
  racine: racineDe(PIERRE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const titreC = k.row([souffle(carre(k, TERRA, "10px"), 3200), caps(k, "Coaching professionnel", { couleur: TERRA, suivi: "0.24em" })], { gap: "12px", alignItems: "center", justifyContent: "center", width: "100%" });
    const phrase = G.geant(`<p>Et si la suite<br><span style="color:${TERRA}">commençait ici ?</span></p>`, { taille: [42, 100], tablette: { taille: [64, 88] }, mobile: { taille: [40, 54] }, lh: 1.08, suivi: "-0.02em", poids: "700", police: S.head, couleur: ENCRE2, align: "center" })(k, env, true);
    const mot = k.T("<p>Changer de poste, prendre une nouvelle fonction, faire le point : un premier échange pour voir si on peut avancer ensemble.</p>", { fontSize: "18px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, textAlign: "center", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" });
    const boutons = k.row([btn(k, "Réserver un échange", "/contact", { texte: "#ffffff", fond: TERRA, survolFond: ENCRE2, survolTexte: "#ffffff", focus: ENCRE2 }), btn(k, "Découvrir l'accompagnement", "/blog", { texte: ENCRE2, fond: undefined, bord: ENCRE2, survolFond: ENCRE2, survolTexte: "#ffffff", focus: TERRA })], { gap: "12px", justifyContent: "center" });
    const haut = G.bande(k, [titreC, phrase, mot, boutons], { fond: PIERRE, colonne: true, aligne: "center", gap: "24px", max: "980px", padV: ["96px", "72px", "52px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Rendez-vous" });
    const col = (titre, sous, url, dernier) => {
      const c = cartouche(k, [lien(k, `${titre}  →`, url, { taille: 22, poids: "700", police: S.head, bloc: true, couleur: ENCRE2, survol: { color: TERRA, transform: { x: 4 } }, focus: TERRA }), k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.55, color: S.mute, fontFamily: S.font })], { fond: LIN, bord: "#221d1933", bordHaut: ENCRE2, haut: "4px", survolFond: "#ffffff", survolBord: "#221d1933", survolHaut: TERRA, hauteur: "150px", min: "230px", leve: -3, gap: "8px" });
      return c;
    };
    const trois = G.ligne(k, [col("Bilan de carrière", "Faire le point sur son parcours, ses envies, ses atouts.", "/blog"), col("Prise de poste", "Réussir ses premiers mois dans une nouvelle fonction.", "/blog"), col("Transition", "Changer de métier ou de cap, sans se précipiter.", "/blog")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandeT = G.bande(k, [trois], { fond: PIERRE, colonne: true, max: "1180px", padV: ["8px", "8px", "4px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Accompagnements" });
    const barre = { type: "container", props: { full: true }, children: [k.col([], { width: "100%", height: "10px", backgroundColor: TERRA, borderRadius: "0px" })], ...sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: TERRA, gap: "0px" }) };
    const colH = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: TERRA, poids: 1.2 });
    const colC = bloc(k, "Nous contacter", [coordonnees(k, { taille: 15, lien: ENCRE2, survol: TERRA, focus: TERRA })], { couleurTitre: TERRA, poids: 1.2 });
    const colN = lettre(k, env, G, { titre: "Un conseil de temps en temps", intro: "Quelques lignes sur la vie professionnelle, par courriel.", accent: TERRA, survolBouton: ENCRE2, survolTexte: "#ffffff", couleurTitre: TERRA, surBouton: "#ffffff" });
    const grille = G.ligne(k, [colH, colC, colN], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: PIERRE, colonne: true, gap: "40px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Infos" });
    return [G.racine(k, [haut, bandeT, barre, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Recrutement et formation", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : cabinet de recrutement, intérim, organisme de formation, centre de compétences, coaching professionnel.",
  models: [quatreEtapes, missionSuivante, catalogueFormations, escalierNiveaux, rendezVousCarriere],
};
