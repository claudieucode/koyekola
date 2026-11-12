// Famille v2 « Garages et concessions » — 5 modèles (ft2-246 à ft2-250), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds d'un garage indépendant, d'une concession, d'une carrosserie, d'un centre de contrôle technique et d'un vendeur de véhicules d'occasion : prise de rendez-vous à l'atelier, prestations, types de véhicules,
// horaires et coordonnées (widgets « Données de l'entreprise »), lettre d'information, mentions légales. Marques fictives ; AUCUNE coordonnée, AUCUN horaire, prix ni chiffre inventé.
// Les prestations, types de véhicules, points de contrôle et étapes sont des intitulés d'EXEMPLE à renommer dans l'éditeur ; aucune marque automobile n'est citée (textes neutres). Adresses de réseaux : exemples.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce » : le moteur coupe transitions et animations) :
//   · transitions longues et douces de 360 ms (couleur, fond, filet qui s'épaissit, décalage de 2 à 6 px) sur tous les liens, boutons, cellules et cartes ;
//   · UNE animation visible par modèle : carré de statut qui « respire », feu vert qui pulse, flèche qui glisse, rangée qui s'indente, cellule qui se soulève.
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu (voir BRIEF_CARRE.md).
const FAM = "garages-concessions";
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
// ft2-246 « Ordre de réparation » — garage indépendant
// Idée : le pied est un ORDRE DE RÉPARATION de l'atelier : un formulaire à contour épais dont chaque ligne (01 Prestations, 02 Contact, 03 Horaires, 04 Informations) a une cellule d'intitulé et une cellule de contenu.
// Les prestations sont des étiquettes carrées qui se remplissent d'outremer au survol ; la ligne s'éclaircit ; le carré safran près de « Horaires » respire. Dessous, barre graphite réseaux et mentions.
// Prestations d'exemple (révision, freinage, pneus…) à renommer. Polices : Barlow Condensed (titres) et Barlow. Mobile : intitulé au-dessus du contenu, étiquettes qui passent à la ligne.
const ordreId = identite({
  key: "c246", label: "Gris perle, outremer et safran", humeur: "light",
  fond: "#e9ecf0", texte: "#17212b", discret: "#4a5663", accent: "#2a3fb8", surface: "#ffffff", encre: "#17212b", surEncre: "#e9ecf0",
  police: "font.barlow", titres: "font.barlow-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#17212b44",
});
const PERLE = "#e9ecf0", GRAPHITE = "#17212b", OUTRE = "#2a3fb8", SAFRAN = "#f5a300";

const ordreReparation = modeleV2({
  id: identifiantV2(246, "ordre-de-reparation"), concept: "c-246-ordre-de-reparation",
  name: "Ordre de réparation", family: FAM,
  description: "Pour un garage indépendant : nom, deux boutons de rendez-vous et un formulaire à contour épais en quatre lignes (prestations en étiquettes carrées, contact, horaires, infos), puis une barre graphite réseaux et mentions.",
  tags: ["garage", "atelier", "rendez-vous", "ordre de réparation", "formulaire", "outremer", "safran", "angles droits"],
  identity: ordreId,
  racine: racineDe(GRAPHITE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · tête : nom de l'atelier, phrase, deux boutons
    const nom = nomDuSite(k, env, 44, GRAPHITE, { textTransform: "uppercase", letterSpacing: "0.02em" });
    const mot = k.T("<p>Entretien, réparation, pneus : décrivez-nous votre véhicule, nous vous proposons un créneau à l'atelier.</p>", { fontSize: "18px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "500px" });
    const gauche = G.colonne(k, [caps(k, "Atelier", { couleur: OUTRE, suivi: "0.2em", police: S.head, taille: "14px" }), nom, mot], { poids: 6, min: "300px", gap: "12px" });
    const b1 = bouton(k, "Prendre rendez-vous", "/contact", { texte: "#ffffff", fond: OUTRE, survol: { backgroundColor: GRAPHITE, color: "#ffffff", transform: { y: -3 } }, focus: GRAPHITE, casse: "uppercase", suivi: "0.06em" });
    const b2 = bouton(k, "Demander un devis", "/contact", { texte: GRAPHITE, fond: undefined, bord: GRAPHITE, survol: { backgroundColor: GRAPHITE, color: "#ffffff", transform: { y: -3 } }, focus: OUTRE, casse: "uppercase", suivi: "0.06em" });
    const droite = G.colonne(k, [k.row([b1, b2], { gap: "12px" })], { poids: 5, min: "290px", soi: "flex-end", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const tete = G.bande(k, [gauche, droite], { fond: PERLE, gap: "28px 48px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["36px", "32px", "28px"], padH: PH, nom: "Atelier" });
    // 2 · formulaire : quatre lignes, intitulé | contenu
    const rangee = (num, titre, contenu, o = {}) => {
      const marque = o.statut ? [souffle(carre(k, SAFRAN, "10px"), 3000)] : [];
      const lab = k.col([k.row([caps(k, num, { couleur: OUTRE, suivi: "0.16em", police: S.head, taille: "14px" }), ...marque], { gap: "8px", alignItems: "center", flexWrap: "nowrap" }), caps(k, titre, { couleur: GRAPHITE, police: S.head, taille: "17px", suivi: "0.1em" })], { flexBasis: "220px", flexGrow: 0, flexShrink: 0, gap: "4px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "2px", borderColor: GRAPHITE, paddingTop: "22px", paddingBottom: "22px", paddingLeft: "24px", paddingRight: "16px", borderRadius: "0px" }, undefined, { flexBasis: "100%", borderRightWidth: "0px", borderBottomWidth: "1px", paddingTop: "16px", paddingBottom: "12px", paddingLeft: "20px" });
      const val = k.col(contenu, { flexGrow: 1, flexBasis: "320px", minWidth: "0px", gap: "10px", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "24px", paddingRight: "24px", justifyContent: "center", borderRadius: "0px" }, undefined, { flexBasis: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "14px", paddingBottom: "16px" });
      const r = k.row([lab, val], { flexWrap: "wrap", alignItems: "stretch", gap: "0px", width: "100%", backgroundColor: PERLE, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: o.dernier ? "0px" : "2px", borderColor: GRAPHITE, borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ffffff" } };
      return r;
    };
    const PREST = [["Révision", "/contact"], ["Freinage", "/contact"], ["Pneus", "/contact"], ["Climatisation", "/contact"], ["Diagnostic", "/faq"], ["Vidange", "/faq"]];
    const etiquettes = k.row(PREST.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "700", couleur: GRAPHITE, h: "44px", padH: "16px", survol: { backgroundColor: OUTRE, color: "#ffffff", transform: { y: -2 } }, focus: OUTRE, extra: { borderStyle: "solid", borderWidth: "2px", borderColor: GRAPHITE, justifyContent: "center" } })), { gap: "8px", flexWrap: "wrap" });
    const note = k.T("<p>Prestations d'exemple : renommez-les selon votre atelier.</p>", { fontSize: "14px", color: S.mute, fontFamily: S.font });
    const rapide = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const liensRang = k.row(rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "700", couleur: GRAPHITE, soulign: true, survol: { color: OUTRE, transform: { x: 4 } }, focus: OUTRE, padH: "0px", extra: { marginRight: "20px" } })), { gap: "0px", flexWrap: "wrap" });
    const formulaire = k.col([
      rangee("01", "Prestations", [etiquettes, note]),
      rangee("02", "Contact", [coordonnees(k, { taille: 16, lien: GRAPHITE, survol: OUTRE, focus: OUTRE })]),
      rangee("03", "Horaires", [horaires(k, { taille: 16 })], { statut: true }),
      rangee("04", "Informations", [liensRang], { dernier: true }),
    ], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "2px", borderColor: GRAPHITE, borderRadius: "0px", backgroundColor: PERLE });
    const bandeForm = G.bande(k, [formulaire], { fond: PERLE, colonne: true, padV: ["12px", "12px", "8px"], padB: ["72px", "56px", "44px"], padH: PH, nom: "Formulaire" });
    // 3 · barre graphite : réseaux et mentions sur une seule ligne (pas de lettre : le formulaire suffit)
    const reseaux = G.reseauxTexte([["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"]], { taille: 15, poids: "700", couleur: "#ffffff", survol: SAFRAN, focus: SAFRAN })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c5ccd4", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [reseaux, mentions], { fond: GRAPHITE, colonne: false, gap: "16px 40px", aligne: "center", justifie: "space-between", padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "20px"], padH: PH, nom: "Barre" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, bandeForm, bas])];
  },
}, FAM);


// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-247 « Salle d'exposition » — concession automobile      [archétype H : mosaïque asymétrique, une grande case + trois petites]
// Idée : une MOSAÏQUE de salle d'exposition posée sur un fond titane, cases séparées de 6 px. À gauche, la grande case sombre (nom, « Entrez, essayez, repartez. », bouton d'essai, coordonnées) ; à droite, trois petites cases :
// « Occasions » (argent), « Reprise » (cuivre) et les horaires (carré cuivré qui respire). Chaque petite case est un lien qui glisse de 6 px au survol. Une seule ligne de mentions. Pas de lettre, pas de colonnes.
// Aucune marque citée. Polices : Sora (titres, 600) et Inter Tight. Mobile : cases en pile pleine largeur.
const titane = identite({
  key: "c247", label: "Titane, argent et cuivre", humeur: "dark",
  fond: "#1f2933", texte: "#f1f4f7", discret: "#b5c0cb", accent: "#e09a6b", surface: "#29343f", encre: "#1f2933", surEncre: "#f1f4f7",
  police: "font.inter-tight", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f1f4f733",
});
const TITANE = "#1f2933", TITANE_F = "#0f161c", ARGENT = "#d9dfe5", CUIVRE = "#e09a6b", CUIVRE_F = "#8a4a1f";

const salleExposition = modeleV2({
  id: identifiantV2(247, "salle-d-exposition"), concept: "c-247-salle-d-exposition",
  name: "Salle d'exposition", family: FAM,
  description: "Pour une concession : mosaïque asymétrique sur titane, une grande case sombre (invitation à l'essai, contact) et trois petites (occasions, reprise, horaires) qui glissent au survol. Argent, cuivre, aucune marque citée.",
  tags: ["concession", "automobile", "mosaïque", "essai", "occasions", "reprise", "titane", "cuivre", "angles droits"],
  identity: titane,
  racine: racineDe(TITANE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // grande case
    const nom = nomDuSite(k, env, 26, "#f1f4f7");
    const phrase = G.geant(`<p>Entrez,<br>essayez,<br><span style="color:${CUIVRE}">repartez.</span></p>`, { taille: [44, 96], tablette: { taille: [64, 88] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#f1f4f7" })(k, env);
    const btn = bouton(k, "Réserver un essai", "/contact", { texte: TITANE_F, fond: CUIVRE, survol: { backgroundColor: "#ffffff", borderColor: "#ffffff", color: TITANE_F, transform: { x: 6 } }, focus: "#ffffff", casse: "uppercase", suivi: "0.08em", taille: 15, extra: { alignSelf: "flex-start" } });
    const grande = G.colonne(k, [nom, phrase, btn], { poids: 7, min: "320px", gap: "28px", extra: { backgroundColor: TITANE_F, paddingTop: "48px", paddingBottom: "48px", paddingLeft: "44px", paddingRight: "44px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" } });
    // petites cases
    const petite = (num, t, texte, u, fond, encre, vif) => {
      const titre = lien(k, t, u, { taille: 28, poids: "600", police: S.head, couleur: encre, survol: { color: vif, transform: { x: 6 } }, focus: vif, h: "48px", lh: 1.1 });
      const c = k.col([caps(k, num, { couleur: encre, suivi: "0.2em" }), k.col([titre, k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.5, color: encre, fontFamily: S.font })], { gap: "6px" })], { flexGrow: 1, flexBasis: "200px", minWidth: "180px", minHeight: "190px", justifyContent: "space-between", gap: "24px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "24px", backgroundColor: fond, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", minHeight: "0px", paddingLeft: "20px" });
      c.states = { hover: { transform: { y: -4 } } };
      return c;
    };
    const haut2 = G.ligne(k, [petite("02", "Occasions", "Véhicules contrôlés, présentés avec leur historique.", "/contact", ARGENT, TITANE, "#6b3510"), petite("03", "Reprise", "Faites estimer votre véhicule actuel.", "/contact", CUIVRE, TITANE_F, "#ffffff")], { gap: "6px", aligne: "stretch", largeur: "100%" });
    const caseHor = k.col([k.row([souffle(carre(k, CUIVRE, "10px"), 3000), caps(k, "Horaires de la salle", { couleur: CUIVRE })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { taille: 15 }), caps(k, "Nous trouver", { couleur: CUIVRE }), coordonnees(k, { taille: 15, lien: "#f1f4f7", survol: CUIVRE, focus: CUIVRE })], { gap: "12px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "24px", backgroundColor: "#29343f", width: "100%", flexGrow: 1, borderRadius: "0px" }, undefined, { paddingLeft: "20px" });
    const droite = G.colonne(k, [haut2, caseHor], { poids: 5, min: "320px", gap: "6px", extra: { alignSelf: "stretch" } });
    const mosaique = G.bande(k, [grande, droite], { fond: TITANE, gap: "6px", aligne: "stretch", padV: ["6px", "6px", "6px"], padB: ["6px", "6px", "6px"], padH: ["6px", "6px", "6px"], max: "1920px", nom: "Mosaïque" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const reseaux = G.reseauxTexte([["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"]], { taille: 15, poids: "700", couleur: "#f1f4f7", survol: CUIVRE, focus: CUIVRE })(k, env);
    const bas = G.bande(k, [reseaux, mentions], { fond: TITANE, gap: "12px 40px", aligne: "center", justifie: "space-between", padV: ["24px", "20px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-248 « Nuancier de carrosserie » — carrosserie et peinture automobile      [archétype C : damier de huit cases égales, chacune un lien ou une information]
// Idée : un NUANCIER. Un damier de huit cases égales à angles droits : six teintes de peinture (rouge, ambre, bleu, vert anglais, argent, noir) qui sont chacune un lien vers la demande de devis, puis la case « Nous trouver »
// (coordonnées) et la case « Horaires ». Au survol une teinte se soulève. Une fine ligne de mentions dessous. Pas de phrase géante, pas de lettre. Polices : Syne (titres, 700) et Hanken Grotesk.
// Mobile : cases sur deux colonnes puis une colonne pour les cases d'information.
const nuancier = identite({
  key: "c248", label: "Blanc nuancier et vert anglais", humeur: "light",
  fond: "#fafaf7", texte: "#14161a", discret: "#4b5057", accent: "#00573f", surface: "#ffffff", encre: "#14161a",
  police: "font.hanken-grotesk", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#14161a33",
});
const BLANCN = "#fafaf7", ENCRE_N = "#14161a", VERT_A = "#00573f";

const nuancierCarrosserie = modeleV2({
  id: identifiantV2(248, "nuancier-de-carrosserie"), concept: "c-248-nuancier-de-carrosserie",
  name: "Nuancier de carrosserie", family: FAM,
  description: "Pour une carrosserie : un damier de huit cases égales, six teintes de peinture qui mènent au devis, la case coordonnées et la case horaires. Blanc, encre et vert anglais ; les teintes se soulèvent au survol.",
  tags: ["carrosserie", "peinture", "nuancier", "damier", "devis", "teintes", "vert anglais", "angles droits"],
  identity: nuancier,
  racine: racineDe(BLANCN),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const TEINTES = [["Rouge", "#c1121f", "#ffffff"], ["Ambre", "#f4a100", ENCRE_N], ["Bleu", "#1d4ed8", "#ffffff"], ["Vert anglais", VERT_A, "#ffffff"], ["Argent", "#cfd3d7", ENCRE_N], ["Noir", ENCRE_N, "#ffffff"]];
    const base = { flexGrow: 1, flexBasis: "22%", minWidth: "150px", minHeight: "190px", borderStyle: "solid", borderWidth: "2px", borderColor: BLANCN, borderRadius: "0px", transitionDuration: DOUX };
    const caseTeinte = ([nom, fond, encre], i) => {
      const t = lien(k, nom, "/contact", { taille: 22, poids: "700", police: S.head, couleur: encre, survol: { transform: { x: 6 } }, focus: encre === "#ffffff" ? "#ffffff" : ENCRE_N, h: "48px", extra: { width: "100%" } });
      const c = k.col([caps(k, `Teinte 0${i + 1}`, { couleur: encre, suivi: "0.18em" }), k.col([t, k.T("<p>Demander un devis →</p>", { fontSize: "14px", color: encre, fontFamily: S.font })], { gap: "2px" })], { ...base, backgroundColor: fond, justifyContent: "space-between", paddingTop: "18px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "16px" });
      c.states = { hover: { transform: { y: -6 } } };
      return c;
    };
    const info = (titre, contenu, fond, encre, point) => k.col([k.row([...(point ? [souffle(carre(k, point, "10px"), 3000)] : []), caps(k, titre, { couleur: encre === ENCRE_N ? VERT_A : "#ffffff", suivi: "0.16em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), contenu], { ...base, flexBasis: "22%", minWidth: "240px", backgroundColor: fond, gap: "12px", paddingTop: "18px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "16px" }, undefined, { minWidth: "100%" });
    const cases = [...TEINTES.map(caseTeinte), info("Nous trouver", coordonnees(k, { taille: 15, lien: ENCRE_N, survol: VERT_A, focus: VERT_A }), "#ffffff", ENCRE_N), info("Horaires", horaires(k, { taille: 15 }), "#eceae4", ENCRE_N, VERT_A)];
    const damier = G.ligne(k, cases, { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandeDamier = G.bande(k, [damier], { fond: BLANCN, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Damier" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d4d6d9", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: ENCRE_N, padV: ["22px", "20px", "16px"], padB: ["22px", "20px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [bandeDamier, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-249 « Points de contrôle » — centre de contrôle technique      [archétype A : colonne latérale pleine hauteur + zone principale]
// Idée : un POSTE DE CONTRÔLE. Une barre latérale marine pleine hauteur à gauche (feu tricolore dont le vert respire, « Prendre rendez-vous », bouton, horaires, coordonnées) ; à droite, sur bleu glacé, la liste des six
// points de contrôle en grandes lignes (pastille carrée verte, intitulé, flèche qui glisse). En bas de la zone, une petite lettre. Points de contrôle d'exemple à renommer. Polices : Titillium Web (titres) et Source Sans 3.
// Mobile : la barre passe au-dessus, la liste dessous.
const glacial = identite({
  key: "c249", label: "Bleu glacé, marine et vert contrôle", humeur: "light",
  fond: "#e4f0f6", texte: "#0b2b3b", discret: "#3d5967", accent: "#0a7a43", surface: "#ffffff", encre: "#0b2b3b", surEncre: "#e4f0f6",
  police: "font.source-sans-3", titres: "font.titillium-web",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#0b2b3b44",
});
const MARINE_C = "#0b2b3b", GLACE = "#e4f0f6", VERT_C = "#0a7a43", VERT_CL = "#5fd39a", ORANGE_C = "#e08a1e", ROUGE_C = "#d93a2f";

const pointsDeControle = modeleV2({
  id: identifiantV2(249, "points-de-controle"), concept: "c-249-points-de-controle",
  name: "Points de contrôle", family: FAM,
  description: "Pour un centre de contrôle technique : barre latérale marine pleine hauteur (feu tricolore, rendez-vous, horaires, contact) et, à droite, la liste en grandes lignes des six points de contrôle avec flèche qui glisse, puis une petite lettre.",
  tags: ["contrôle technique", "barre latérale", "points de contrôle", "rendez-vous", "marine", "vert", "angles droits"],
  identity: glacial,
  racine: racineDe(GLACE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // barre latérale
    const feu = k.row([souffle(carre(k, VERT_CL, "16px"), 2800), carre(k, ORANGE_C, "16px"), carre(k, ROUGE_C, "16px")], { gap: "6px", flexWrap: "nowrap" });
    const titre = k.T("<p>Contrôle<br>technique</p>", { fontSize: "40px", lineHeight: 1.05, fontWeight: "700", fontFamily: S.head, textTransform: "uppercase", color: "#ffffff" });
    const btn = bouton(k, "Prendre rendez-vous", "/contact", { texte: MARINE_C, fond: VERT_CL, survol: { backgroundColor: "#ffffff", borderColor: "#ffffff", color: MARINE_C, transform: { x: 6 } }, focus: "#ffffff", casse: "uppercase", suivi: "0.06em", taille: 15, extra: { alignSelf: "stretch" } });
    const lateral = G.colonne(k, [feu, titre, btn, trait(k, "#ffffff44"), caps(k, "Horaires", { couleur: VERT_CL }), horaires(k, { taille: 15, couleur: "#e4f0f6" }), caps(k, "Coordonnées", { couleur: VERT_CL }), coordonnees(k, { taille: 15, couleur: "#e4f0f6", lien: "#ffffff", survol: VERT_CL, focus: "#ffffff" })], { poids: 3.4, min: "320px", gap: "18px", extra: { backgroundColor: MARINE_C, paddingTop: "56px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "36px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "36px" }, tablette: { paddingLeft: "32px" } });
    // zone principale : six lignes
    const POINTS = [["Freinage", "/faq"], ["Direction et suspension", "/faq"], ["Éclairage et signalisation", "/faq"], ["Pollution et émissions", "/faq"], ["Pneumatiques", "/faq"], ["Châssis et carrosserie", "/faq"]];
    const ligneP = ([t, u], i) => {
      const lienP = lien(k, t, u, { taille: 24, poids: "600", police: S.head, couleur: MARINE_C, survol: { color: VERT_C }, focus: VERT_C, h: "60px", extra: { flexGrow: 1 } });
      const r = k.row([carre(k, VERT_C, "14px"), caps(k, `0${i + 1}`, { couleur: VERT_C, suivi: "0.14em" }), lienP, k.T("<p>→</p>", { fontSize: "22px", color: VERT_C, fontFamily: S.font, lineHeight: 1 })], { flexWrap: "nowrap", alignItems: "center", gap: "16px", width: "100%", paddingLeft: "4px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#0b2b3b55", borderRadius: "0px", backgroundColor: GLACE, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ffffff", paddingLeft: "20px" } };
      return r;
    };
    const liste = k.col(POINTS.map(ligneP), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: MARINE_C });
    const note = k.T("<p>Points de contrôle d'exemple : adaptez-les à votre centre.</p>", { fontSize: "14px", color: S.mute, fontFamily: S.font });
    const abo = lettre(k, env, G, { titre: "Rappel de contrôle", intro: "Recevez un message avant votre prochaine échéance.", bouton: "S'abonner", largeur: "400px", accent: VERT_C, surBouton: "#ffffff", texte: MARINE_C, couleurTitre: VERT_C, fond: GLACE, survolBouton: MARINE_C, survolTexte: "#ffffff", focus: MARINE_C });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const principale = G.colonne(k, [caps(k, "Points de contrôle", { couleur: VERT_C, suivi: "0.22em" }), liste, note, abo, trait(k, S.line), mentions], { poids: 8, min: "420px", gap: "22px", extra: { backgroundColor: GLACE, paddingTop: "56px", paddingBottom: "28px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    principale.children = principale.children.map((c) => { c.styles.desktop = { ...c.styles.desktop, width: "100%" }; return c; });
    const deux = G.bande(k, [lateral, principale], { fond: GLACE, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Poste de contrôle" });
    return [G.racine(k, [deux])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-250 « Du premier regard aux clés » — vente de véhicules d'occasion      [archétype I : frise horizontale en quatre étapes à points carrés]
// Idée : une FRISE. Sur crème, quatre étapes (Choisir, Essayer, Financer, Repartir) reliées par un trait kaki ; chaque étape a son repère carré orange, son titre en lien et une phrase. Sous la frise, un ruban orange
// « Reprise de votre véhicule » dont la flèche glisse, puis une bande kaki compacte : nom, bouton, coordonnées en une rangée. Pas de lettre, pas d'horaires séparés. Étapes d'exemple à renommer.
// Polices : Rubik (titres, 800) et Karla. Mobile : étapes empilées, trait vertical remplacé par le filet de séparation.
const kaki = identite({
  key: "c250", label: "Kaki, crème et orange", humeur: "dark",
  fond: "#2f3a26", texte: "#f3efe0", discret: "#c9cdb9", accent: "#ff7a1a", surface: "#3a4730", encre: "#2f3a26", surEncre: "#f3efe0",
  police: "font.karla", titres: "font.rubik",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f3efe033",
});
const KAKI = "#2f3a26", CREME = "#f3efe0", ORANGE = "#ff7a1a", ORANGE_F = "#a8470a";

const parcoursAchat = modeleV2({
  id: identifiantV2(250, "du-premier-regard-aux-cles"), concept: "c-250-du-premier-regard-aux-cles",
  name: "Du premier regard aux clés", family: FAM,
  description: "Pour un vendeur de véhicules d'occasion : une frise en quatre étapes à repères carrés orange (choisir, essayer, financer, repartir), un ruban orange de reprise à flèche glissante, puis une bande kaki compacte.",
  tags: ["occasion", "véhicules d'occasion", "frise", "étapes", "reprise", "kaki", "orange", "angles droits"],
  identity: kaki,
  racine: racineDe(KAKI),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · frise
    const titre = G.geant(`<p>Du premier regard<br>aux clés.</p>`, { taille: [36, 76], tablette: { taille: [52, 68] }, mobile: { taille: [36, 48] }, lh: 1.05, suivi: "-0.02em", poids: "800", police: S.head, couleur: KAKI })(k, env);
    const ETAPES = [["Choisir", "Parcourez les véhicules disponibles et gardez vos favoris.", "/blog"], ["Essayer", "Prenez rendez-vous pour un essai sur route.", "/contact"], ["Financer", "Étudiez les solutions avec un conseiller.", "/faq"], ["Repartir", "Papiers, garantie, remise des clés.", "/faq"]];
    const etape = ([t, texte, u], i) => {
      const num = k.T(`<p>${i + 1}</p>`, { fontSize: "24px", fontWeight: "800", fontFamily: S.head, color: KAKI, backgroundColor: ORANGE, width: "52px", height: "52px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0px", lineHeight: 1 });
      const trait4 = k.col([], { flexGrow: 1, height: "4px", backgroundColor: i === ETAPES.length - 1 ? "transparent" : KAKI, borderRadius: "0px" });
      const c = k.col([k.row([num, trait4], { flexWrap: "nowrap", alignItems: "center", gap: "0px", width: "100%" }), lien(k, t, u, { taille: 28, poids: "800", police: S.head, couleur: KAKI, survol: { color: ORANGE_F, transform: { x: 4 } }, focus: ORANGE_F, h: "48px" }), k.T(`<p>${texte}</p>`, { fontSize: "16px", lineHeight: 1.5, color: "#3b4631", fontFamily: S.font, maxWidth: "240px" })], { flexGrow: 1, flexBasis: "220px", minWidth: "190px", gap: "10px", paddingRight: "16px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { transform: { y: -4 } } };
      return c;
    };
    const frise = G.ligne(k, ETAPES.map(etape), { gap: "32px 0px", aligne: "flex-start", largeur: "100%" });
    const bandeFrise = G.bande(k, [caps(k, "Acheter sereinement", { couleur: ORANGE_F, suivi: "0.22em" }), titre, frise], { fond: CREME, colonne: true, gap: "28px", padV: ["80px", "60px", "44px"], padB: ["72px", "56px", "44px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Frise" });
    // 2 · ruban orange
    const fl = k.T("<p>Reprise de votre véhicule : une estimation sur rendez-vous.</p>", { fontSize: "20px", fontWeight: "800", fontFamily: S.head, color: KAKI, lineHeight: 1.3 });
    const btn = lien(k, "Estimer ma reprise →", "/contact", { taille: 17, poids: "800", couleur: KAKI, soulign: true, survol: { transform: { x: 8 } }, focus: KAKI, h: "52px" });
    const ruban = G.bande(k, [fl, btn], { fond: ORANGE, gap: "8px 40px", aligne: "center", justifie: "space-between", padV: ["22px", "20px", "16px"], padB: ["22px", "20px", "16px"], padH: PH, nom: "Reprise" });
    // 3 · bande kaki compacte
    const nom = nomDuSite(k, env, 28, CREME);
    const btn2 = bouton(k, "Voir les véhicules", "/contact", { texte: KAKI, fond: ORANGE, survol: { backgroundColor: CREME, borderColor: CREME, color: KAKI, transform: { y: -3 } }, focus: CREME, taille: 15 });
    const ligne1 = G.ligne(k, [G.colonne(k, [nom, btn2], { poids: 1, min: "240px", gap: "16px" }), G.colonne(k, [caps(k, "Nous joindre", { couleur: ORANGE }), coordonnees(k, { taille: 15, lien: CREME, survol: ORANGE, focus: ORANGE })], { poids: 1, min: "260px", gap: "10px" })], { gap: "28px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [ligne1, trait(k, S.line), mentions], { fond: KAKI, colonne: true, gap: "28px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: PH, innerMobile: { rowGap: "24px" }, nom: "Pied" });
    return [G.racine(k, [bandeFrise, ruban, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Garages et concessions", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits : formulaire d'atelier, mosaïque de salle d'exposition, nuancier de carrosserie, poste de contrôle à barre latérale, frise d'achat d'occasion.",
  models: [ordreReparation, salleExposition, nuancierCarrosserie, pointsDeControle, parcoursAchat],
};
