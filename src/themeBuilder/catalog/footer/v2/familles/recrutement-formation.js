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
// ft2-161 « Quatre étapes » — cabinet de recrutement · archétype I (frise horizontale en étapes à points carrés)
// Idée : la MÉTHODE est une FRISE. Une bande cobalt plein bord porte un rail blanc qui relie quatre points carrés ; les étapes (brief, recherche, entretiens, intégration) se lisent le long du rail
// et leur titre glisse au survol. Au-dessus, une phrase sobre ; en dessous, une bande bleu nuit : deux boutons francs, contact et lettre (pas d'horaires). Polices : Sora (titres) et Inter.
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
  description: "Pour un cabinet de recrutement : une frise cobalt en quatre étapes reliées par un rail à points carrés (brief, recherche, entretiens, intégration), deux boutons francs, contact et lettre sur bande bleu nuit.",
  tags: ["cabinet de recrutement", "recrutement", "frise", "étapes", "offre", "candidature", "cobalt", "blanc"],
  identity: cabinet,
  racine: racineDe(ENCRE, "#ffffff"),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Le bon profil, <span style="color:${COBALT}">en quatre étapes.</span></p>`, { taille: [30, 58], tablette: { taille: [38, 50] }, mobile: { taille: [30, 38] }, lh: 1.08, suivi: "-0.03em", poids: "800", police: S.head, couleur: ENCRE })(k, env);
    const haut = G.bande(k, [caps(k, "Cabinet de recrutement · notre méthode", { couleur: COBALT, suivi: "0.2em" }), phrase], { fond: BLANC, colonne: true, gap: "14px", padV: ["64px", "52px", "40px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    // Frise : chaque étape = un point carré blanc suivi d'un segment de rail, puis son titre et son texte ; le rail est continu d'un bord à l'autre
    const etape = (n, titre, sous, decale) => {
      const rail = k.row([k.col([], { width: "22px", height: "22px", backgroundColor: BLANC, flexShrink: 0, borderRadius: "0px" }), k.col([], { flexGrow: 1, flexBasis: "0px", height: "3px", backgroundColor: "#ffffff80", borderRadius: "0px" })], { gap: "0px", flexWrap: "nowrap", alignItems: "center", width: "100%" });
      const t = lien(k, titre, "/contact", { taille: 24, poids: "800", police: S.head, bloc: true, couleur: BLANC, survol: { color: CIEL, transform: { x: 6 } }, focus: BLANC });
      const c = k.col([k.T(`<p>Étape ${n}</p>`, { fontFamily: S.head, fontSize: "12px", fontWeight: "700", color: "#e3eaff", textTransform: "uppercase", letterSpacing: "0.16em" }), t, k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.55, color: "#dfe6ff", fontFamily: S.font })], { gap: "8px", paddingRight: "28px" });
      return k.col([rail, c], { gap: "20px", flexGrow: 1, flexBasis: "0px", minWidth: "220px", paddingTop: decale ? "56px" : "0px", transitionDuration: 360 }, { paddingTop: "0px" });
    };
    const frise = k.row([etape(1, "Brief", "Nous cernons le poste, l'équipe et ce qui compte vraiment.", false), etape(2, "Recherche", "Approche directe et réseau pour trouver les bons profils.", false), etape(3, "Entretiens", "Une sélection argumentée, présentée sans jargon.", false), etape(4, "Intégration", "Un suivi après l'arrivée pour que la collaboration prenne.", false)], { rowGap: "32px", columnGap: "0px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" });
    const bandeFrise = G.bande(k, [frise], { fond: COBALT, colonne: true, padV: ["72px", "56px", "44px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Frise" });
    const boutons = k.col([
      btn(k, "Déposer une offre", "/contact", { texte: ENCRE, fond: BLANC, survolFond: CIEL, survolTexte: ENCRE, focus: CIEL, extra: { width: "100%" } }),
      btn(k, "Envoyer sa candidature", "/contact", { texte: "#ffffff", fond: undefined, bord: "#ffffff", survolFond: "#ffffff", survolTexte: ENCRE, focus: CIEL, extra: { width: "100%" } }),
    ], { gap: "12px", width: "100%", maxWidth: "320px" });
    const colB = G.colonne(k, [boutons], { poids: 3, min: "260px" });
    const colC = bloc(k, "Nous contacter", [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: CIEL, focus: CIEL })], { couleurTitre: CIEL, poids: 3, min: "240px" });
    const colN = lettre(k, env, G, { titre: "Offres et conseils", intro: "Les postes à pourvoir et nos conseils de carrière, par courriel.", accent: CIEL, texte: "#ffffff", survolBouton: "#ffffff", survolTexte: ENCRE, couleurTitre: CIEL, surBouton: ENCRE, poids: 4 });
    const ligneB = G.ligne(k, [colB, colC, colN], { gap: "36px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b9c3d9", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [ligneB, trait(k, "#ffffff40"), mentions], { fond: ENCRE, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Bande bleu nuit" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de la dernière bande
    return [G.racine(k, [haut, bandeFrise, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-162 « Mission suivante » — agence d'intérim · archétype F (bandeau d'appel XXL + liens en une colonne étroite à droite)
// Idée : un pied de CHANTIER, jaune sécurité et noir. Un bandeau jaune XXL : « ON VOUS PLACE. » sur toute la largeur et deux immenses blocs d'appel noirs (je cherche une mission, je recrute). Dessous, une bande
// noire asymétrique : l'agence (horaires et adresse) à gauche, et à droite UNE colonne étroite de liens à filets (métiers, espace candidat) qui avancent au survol. Pas de lettre d'information.
// Le carré jaune des horaires « respire ». Polices : Oswald (titres) et Public Sans.
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
  description: "Pour une agence d'intérim : un bandeau jaune XXL « On vous place. » avec deux immenses blocs d'appel noirs (chercher une mission, recruter), puis une bande noire avec l'agence à gauche et une colonne étroite de liens à droite.",
  tags: ["intérim", "agence d'emploi", "mission", "candidats", "entreprises", "bandeau", "jaune", "noir"],
  identity: interim,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>On vous place.</p>`, { taille: [64, 200], tablette: { taille: [110, 160] }, mobile: { taille: [60, 84] }, lh: 0.95, suivi: "-0.01em", poids: "700", police: S.head, couleur: NOIR, extra: { textTransform: "uppercase" } })(k, env);
    const appel = (txt, url, plein) => {
      const n = btn(k, `${txt}  →`, url, { texte: plein ? JAUNE : NOIR, fond: plein ? NOIR : undefined, bord: NOIR, survolFond: plein ? "#ffffff" : NOIR, survolTexte: plein ? NOIR : JAUNE, focus: "#ffffff", h: "96px", taille: 26, casse: "uppercase", suivi: "0.04em", padH: "28px", extra: { width: "100%", justifyContent: "space-between", fontFamily: S.head, borderWidth: "3px" } });
      return G.colonne(k, [n], { poids: 1, min: "280px", extra: { alignItems: "stretch" } });
    };
    const appels = k.row([appel("Je cherche une mission", "/contact", true), appel("Je recrute", "/contact", false)], { gap: "16px", alignItems: "stretch", width: "100%", flexWrap: "wrap" });
    const haut = G.bande(k, [caps(k, "Agence d'intérim", { couleur: NOIR, suivi: "0.24em" }), phrase, appels], { fond: JAUNE, colonne: true, gap: "20px", padV: ["72px", "56px", "40px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Bandeau XXL" });
    const titreH = k.row([souffle(carre(k, JAUNE), 2600), caps(k, "L'agence", { couleur: JAUNE })], { gap: "10px", alignItems: "center" });
    const colH = G.colonne(k, [titreH, horaires(k, { taille: 16 })], { poids: 1, min: "240px", gap: "14px" });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 16, lien: "#ffffff", survol: JAUNE, focus: JAUNE })], { couleurTitre: JAUNE, poids: 1, min: "240px" });
    const agence = G.ligne(k, [colH, colC], { gap: "32px 40px", aligne: "flex-start", largeur: "100%" });
    const gauche = G.colonne(k, [k.T("<p>Une mission, un contrat, un renfort : dites-nous ce que vous cherchez, une conseillère ou un conseiller vous rappelle.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "520px" }), agence], { poids: 3, min: "300px", gap: "32px" });
    const ligneLien = (t, u) => {
      const l = lien(k, t, u, { taille: 22, poids: "500", police: S.head, bloc: true, h: "56px", survol: { color: JAUNE, transform: { x: 8 } }, focus: JAUNE, extra: { textTransform: "uppercase", letterSpacing: "0.03em", width: "100%" } });
      const r = k.row([l, k.T("<p>→</p>", { color: JAUNE, fontSize: "20px", fontFamily: S.font })], { flexWrap: "nowrap", justifyContent: "space-between", alignItems: "center", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff55", borderRadius: "0px", transitionDuration: 340 });
      return r;
    };
    const etroite = G.colonne(k, [caps(k, "Nos métiers", { couleur: JAUNE, extra: { marginBottom: "8px" } }), ...[["Logistique", "/blog"], ["Bâtiment", "/blog"], ["Industrie", "/blog"], ["Bureau et accueil", "/blog"], ["Espace candidat", "/connexion"]].map(([t, u]) => ligneLien(t, u))], { poids: 0, base: "300px", min: "260px", gap: "0px", extra: { maxWidth: "340px", width: "100%" } });
    const corps = G.bande(k, [gauche, etroite], { fond: NOIR, gap: "48px 96px", aligne: "flex-start", padV: ["64px", "52px", "44px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], nom: "Agence et liens" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [trait(k, S.line, "1px"), mentions], { fond: NOIR, colonne: true, gap: "20px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [haut, corps, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-163 « Catalogue des formations » — organisme de formation professionnelle · archétype H (mosaïque asymétrique : une grande case + trois petites)
// Idée : le pied est une MOSAÏQUE posée sur sapin. À gauche, une grande case vert d'eau porte « Se former, c'est avancer. » et deux boutons ; à droite, trois cases plus petites empilées : les domaines du
// catalogue (liens), l'accueil orange (horaires et contact) et la lettre. Les cases se teintent au survol. Aucun financement, aucune certification, aucun chiffre annoncé.
// Polices : Plus Jakarta Sans (titres) et Source Sans 3 (Bricolage Grotesque et Figtree sont déjà déclarées par landing.css avec des sous-ensembles non chargés : le test de chargement des polices les refuse).
const formation = identite({
  key: "c163", label: "Vert d'eau, sapin et orange", humeur: "light",
  fond: "#e4f0ee", texte: "#0a3d3b", discret: "#3d5f5c", accent: "#0a3d3b", surface: "#ffffff", encre: "#ffffff",
  police: "font.source-sans-3", titres: "font.plus-jakarta-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0a3d3b40",
});
const EAU = "#e4f0ee", SAPIN = "#0a3d3b", SAPIN2 = "#072b2a", SAPIN3 = "#0e4f4c", ORANGE = "#ff7a2f";

const catalogueFormations = modeleV2({
  id: identifiantV2(163, "catalogue-des-formations"), concept: "c-163-catalogue-des-formations",
  name: "Catalogue des formations", family: FAM,
  description: "Pour un organisme de formation professionnelle : une mosaïque asymétrique à angles droits, une grande case « Se former, c'est avancer. » avec deux boutons et trois petites cases (domaines, accueil orange avec horaires et contact, lettre).",
  tags: ["organisme de formation", "formation professionnelle", "catalogue", "mosaïque", "vert d'eau", "orange", "sapin"],
  identity: formation,
  racine: racineDe(SAPIN2, "#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Se former,<br>c'est <span style="color:#b04a0c">avancer.</span></p>`, { taille: [44, 112], tablette: { taille: [70, 96] }, mobile: { taille: [42, 58] }, lh: 1.02, suivi: "-0.03em", poids: "800", police: S.head, couleur: SAPIN })(k, env);
    const mot = k.T("<p>Des formations pour les salariés, les équipes et les personnes en reconversion. Parlez-nous de votre besoin, on vous oriente.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "440px" });
    const boutons = k.row([btn(k, "Voir les formations", "/blog", { texte: SAPIN, fond: ORANGE, survolFond: SAPIN, survolTexte: "#ffffff", focus: SAPIN }), btn(k, "Poser une question", "/contact", { texte: SAPIN, fond: undefined, bord: SAPIN, survolFond: SAPIN, survolTexte: "#ffffff", focus: "#b04a0c" })], { gap: "12px" });
    const pad = { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "36px", paddingRight: "36px" };
    const grande = k.col([caps(k, "Organisme de formation", { couleur: "#b04a0c", suivi: "0.2em" }), phrase, mot, boutons], { backgroundColor: EAU, gap: "22px", flexGrow: 6, flexBasis: "0px", minWidth: "300px", justifyContent: "flex-end", borderRadius: "0px", ...pad });
    const petite = (fond, enfants, extra) => k.col(enfants, { backgroundColor: fond, gap: "12px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "28px", paddingRight: "28px", borderRadius: "0px", transitionDuration: 380, ...(extra || {}) });
    const domaines = petite(SAPIN, [caps(k, "Domaines · exemples", { couleur: ORANGE }), k.col([["Management et gestion"], ["Numérique et bureautique"], ["Santé et sécurité au travail"], ["Langues et communication"], ["Métiers techniques"]].map(([t]) => lien(k, `${t}  →`, "/blog", { taille: 17, poids: "600", bloc: true, couleur: "#ffffff", survol: { color: ORANGE, transform: { x: 6 } }, focus: ORANGE })), { gap: "0px" })]);
    domaines.states = { hover: { backgroundColor: SAPIN3 } };
    const accueil = petite(ORANGE, [caps(k, "Accueil", { couleur: SAPIN }), horaires(k, { taille: 15, couleur: SAPIN }), coordonnees(k, { taille: 15, couleur: SAPIN, lien: SAPIN, survol: "#ffffff", focus: SAPIN })], { gap: "16px" });
    const lettreC = petite(SAPIN3, [lettre(k, env, G, { titre: "Nouvelles sessions", intro: "Les prochaines sessions et les nouveautés du catalogue, par courriel.", accent: ORANGE, texte: "#ffffff", survolBouton: "#ffffff", survolTexte: SAPIN, couleurTitre: "#ffffff", surBouton: SAPIN, largeur: "100%", poids: 1 })]);
    const droite = k.col([domaines, accueil, lettreC], { gap: "8px", flexGrow: 5, flexBasis: "0px", minWidth: "300px" });
    const mosaique = k.row([grande, droite], { gap: "8px", alignItems: "stretch", width: "100%", flexWrap: "wrap" });
    const haut = G.bande(k, [mosaique], { fond: SAPIN2, colonne: true, padV: ["56px", "44px", "28px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "16px"], nom: "Mosaïque" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b3cfcc", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [trait(k, "#ffffff40"), mentions], { fond: SAPIN2, colonne: true, gap: "20px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
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
// ft2-165 « Rendez-vous de carrière » — coaching professionnel · archétype E (deux demi-pages bord à bord de couleurs opposées)
// Idée : un pied COUPÉ EN DEUX. La moitié gauche, pierre claire, porte le message en grand serif aligné à gauche (« Et si la suite commençait ici ? ») et deux boutons francs ; la moitié droite, terracotta profond,
// rassemble les actions : accompagnements (liens), horaires, adresse et lettre, séparés par des filets. Les deux moitiés vont de bord à bord. Polices : Playfair Display (titres) et Albert Sans.
// Aucune promesse chiffrée, aucun témoignage inventé.
const coaching = identite({
  key: "c165", label: "Pierre, encre et terracotta", humeur: "light",
  fond: "#ebe6dd", texte: "#221d19", discret: "#564d44", accent: "#a93f20", surface: "#f6f2ea", encre: "#ffffff",
  police: "font.albert-sans", titres: "font.playfair-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#221d1933",
});
const PIERRE = "#ebe6dd", ENCRE2 = "#221d19", TERRA = "#a93f20", TERRA2 = "#8a3017", LIN = "#f6f2ea", ROSE = "#f6e1d6";

const rendezVousCarriere = modeleV2({
  id: identifiantV2(165, "rendez-vous-de-carriere"), concept: "c-165-rendez-vous-de-carriere",
  name: "Rendez-vous de carrière", family: FAM,
  description: "Pour un coach professionnel : deux demi-pages bord à bord de couleurs opposées. À gauche, la phrase serif « Et si la suite commençait ici ? » et deux boutons ; à droite, sur terracotta, accompagnements, horaires, adresse et lettre.",
  tags: ["coaching professionnel", "bilan de carrière", "prise de poste", "transition", "deux moitiés", "pierre", "terracotta", "serif"],
  identity: coaching,
  racine: racineDe(ENCRE2),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Et si la suite<br><span style="color:${TERRA}">commençait ici ?</span></p>`, { taille: [40, 96], tablette: { taille: [60, 80] }, mobile: { taille: [38, 50] }, lh: 1.08, suivi: "-0.02em", poids: "700", police: S.head, couleur: ENCRE2 })(k, env);
    const mot = k.T("<p>Changer de poste, prendre une nouvelle fonction, faire le point : un premier échange pour voir si on peut avancer ensemble.</p>", { fontSize: "18px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "500px" });
    const boutons = k.row([btn(k, "Réserver un échange", "/contact", { texte: "#ffffff", fond: TERRA, survolFond: ENCRE2, survolTexte: "#ffffff", focus: ENCRE2 }), btn(k, "Découvrir l'accompagnement", "/blog", { texte: ENCRE2, fond: undefined, bord: ENCRE2, survolFond: ENCRE2, survolTexte: "#ffffff", focus: TERRA })], { gap: "12px" });
    const titreC = k.row([souffle(carre(k, TERRA, "10px"), 3200), caps(k, "Coaching professionnel", { couleur: TERRA, suivi: "0.24em" })], { gap: "12px", alignItems: "center" });
    const gauche = G.colonne(k, [titreC, phrase, mot, boutons], { poids: 1, min: "320px", gap: "24px", justifie: "center", extra: { backgroundColor: PIERRE, paddingTop: "96px", paddingBottom: "96px", paddingLeft: "64px", paddingRight: "56px" }, tablette: { paddingTop: "72px", paddingBottom: "72px", paddingLeft: "40px", paddingRight: "40px" }, mobile: { paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" } });
    const lienAcc = (t, u) => {
      const l = lien(k, t, u, { taille: 22, poids: "700", police: S.head, bloc: true, h: "52px", couleur: "#ffffff", survol: { color: ROSE, transform: { x: 6 } }, focus: "#ffffff", extra: { width: "100%" } });
      return k.row([l, k.T("<p>→</p>", { color: ROSE, fontSize: "20px", fontFamily: S.font })], { flexWrap: "nowrap", justifyContent: "space-between", alignItems: "center", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff66", borderRadius: "0px" });
    };
    const acc = k.col([caps(k, "Les accompagnements", { couleur: ROSE }), lienAcc("Bilan de carrière", "/blog"), lienAcc("Prise de poste", "/blog"), lienAcc("Transition", "/blog")], { gap: "0px", width: "100%" });
    const infos = G.ligne(k, [bloc(k, "Horaires", [horaires(k, { taille: 15, couleur: "#ffffff" })], { couleurTitre: ROSE, poids: 1, min: "200px" }), bloc(k, "Nous contacter", [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: ROSE, focus: "#ffffff" })], { couleurTitre: ROSE, poids: 1, min: "200px" })], { gap: "28px 36px", aligne: "flex-start", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Un conseil de temps en temps", intro: "Quelques lignes sur la vie professionnelle, par courriel.", accent: "#ffffff", texte: "#ffffff", survolBouton: ROSE, survolTexte: ENCRE2, couleurTitre: "#ffffff", surBouton: TERRA2, largeur: "100%", poids: 1 });
    const droite = G.colonne(k, [acc, trait(k, "#ffffff66"), infos, trait(k, "#ffffff66"), abo], { poids: 1, min: "320px", gap: "28px", justifie: "center", extra: { backgroundColor: TERRA2, color: "#ffffff", paddingTop: "96px", paddingBottom: "96px", paddingLeft: "56px", paddingRight: "64px" }, tablette: { paddingTop: "64px", paddingBottom: "64px", paddingLeft: "40px", paddingRight: "40px" }, mobile: { paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" } });
    const moities = G.bande(k, [gauche, droite], { fond: ENCRE2, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Deux moitiés" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfc6ba", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [trait(k, "#ffffff40"), mentions], { fond: ENCRE2, colonne: true, gap: "20px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de la dernière bande
    return [G.racine(k, [moities, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Recrutement et formation", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : cabinet de recrutement, intérim, organisme de formation, centre de compétences, coaching professionnel.",
  models: [quatreEtapes, missionSuivante, catalogueFormations, escalierNiveaux, rendezVousCarriere],
};
