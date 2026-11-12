// Famille v2 « Hôtels et gîtes » — 5 modèles (ft2-191 à ft2-195), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds d'hôtel, de chambres d'hôtes, de gîte, d'auberge et de camping : réservation, arrivée et départ, services, accès, mentions légales.
// Marques fictives ; AUCUNE coordonnée, horaire, tarif, classement ni label inventé : adresse, téléphone et horaires viennent des Données de l'entreprise du site (sans données, les widgets restent sobres).
// Les services, hébergements et pages sont des intitulés d'EXEMPLE à renommer dans l'éditeur ; « arrivée » et « départ » renvoient vers la page de conditions (aucun horaire écrit en dur) ; les labels et classements
// sont laissés vides, à renseigner par l'établissement. Chaque modèle a sa palette, ses polices (2 au plus) et sa composition (mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions longues et douces (360 ms) de couleur, de fond et de décalage (2 à 6 px) ;
// UNE animation visible par modèle (carré de réservation qui « respire », ligne qui s'indente, case qui se soulève) ; ni animation d'entrée ni défilement continu (limites du moteur : voir BRIEF_CARRE.md).
const FAM = "hotels-gites";
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
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, /* le point rond « ouvert / fermé » du widget a un arrondi de 50 % imposé : écarté */ groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: o.layout || "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align, ...(o.align === "center" ? { display: "flex", justifyContent: "center" } : {}) }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg }; // message « non configuré » lisible sur le fond de SA bande
  return n;
};
// Bouton plein ou à contour, angles droits, qui se soulève et change de couleur au survol
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
// Bande de couleur franche (barre pleine largeur de hauteur fixe)
const barre = (G, k, couleur, h = ["12px", "10px", "8px"]) => G.bande(k, [], { fond: couleur, padV: h, padB: h, padH: ["0px", "0px", "0px"], nom: "Barre" });
// Lettre d'information habillée aux couleurs de la bande (titre, intro, bouton plein à angles droits)
const lettre = (k, env, o) => {
  const abo = abonnement(k, env, { titre: o.titre, intro: o.intro, bouton: o.bouton || "Je m'abonne", largeur: o.largeur || "340px", accent: o.accent, texte: o.texte });
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre || o.accent, lineHeight: 1.4 };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro || o.texte };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.surBouton };
  abo.parts.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.surSurvol || o.surBouton }, focus: GK.focus(o.focus || o.texte) };
  return abo;
};
const MARGES = ["48px", "32px", "20px"];
// Texte courant simple
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, textAlign: o.align, fontWeight: o.poids }));
// Ligne-index : grand libellé, flèche, filet bas (pleine largeur)
const indexLigne = (k, label, url, o) => k.row([lien(k, label, url, { taille: o.taille || 44, poids: o.poids || "400", police: o.police, couleur: o.couleur, h: o.h || "72px", survol: { color: o.survol, paddingLeft: "16px" }, focus: o.survol, extra: { flexGrow: 1 } }), k.T("<p>→</p>", { fontSize: "28px", color: o.survol, fontFamily: k.S.font, flexShrink: 0 })], { width: "100%", alignItems: "center", flexWrap: "nowrap", gap: "12px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-191 « Réception en une ligne » — hôtel  [archétype D : ligne unique horizontale]
// Idée : le pied est une BARRE DE RÉCEPTION, tout sur deux lignes seulement. Sur la première : le nom de l'hôtel en Marcellus, les liens (Chambres, Restaurant, Arrivée et départ, Accès) et le bouton « Réserver »
// dont le carré or « respire ». Sur la seconde, sous un filet : l'adresse en ligne et les mentions. Aucune colonne, aucune lettre : très compact. Lavande pâle, aubergine, or.
// Liens d'exemple à renommer. Polices : Marcellus (titres) et Albert Sans (texte). Mobile : le nom, puis les liens sur une colonne, puis le bouton.
const hotel = identite({
  key: "c191", label: "Lavande pâle, aubergine et or", humeur: "light",
  fond: "#ebe8f2", texte: "#2a2340", discret: "#4e4866", accent: "#8a6212", surface: "#f7f5fb", encre: "#2a2340", surEncre: "#ebe8f2",
  police: "font.albert-sans", titres: "font.marcellus",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2a23404d",
});
const LAV = "#ebe8f2", AUB = "#2a2340", OR = "#8a6212", OR_CLAIR = "#d9b25a";

const receptionLigne = modeleV2({
  id: identifiantV2(191, "reception-en-une-ligne"), concept: "c-191-reception-en-une-ligne",
  name: "Réception en une ligne", family: FAM,
  description: "Pour un hôtel : un pied compact sur deux lignes, nom de l'hôtel, liens vers chambres, restaurant, arrivée et départ, accès, bouton Réserver, puis adresse en ligne et mentions. Lavande pâle, aubergine, or.",
  tags: ["hôtel", "réservation", "arrivée et départ", "compact", "chambres", "lavande", "or"],
  identity: hotel,
  racine: racineDe(LAV),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marque = lien(k, "Hôtel Belvédère", "/", { taille: 26, poids: "400", police: S.head, couleur: AUB, survol: { color: OR }, focus: OR, cibleTactile: true });
    const navs = [["Chambres", "/catalogue"], ["Restaurant et bar", "/blog"], ["Arrivée et départ", "/faq"], ["Accès", "/contact"]];
    const liensNav = k.row(navs.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: AUB, survol: { color: OR, transform: { y: -2 } }, focus: OR, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#00000000" } })), { rowGap: "4px", columnGap: "30px", alignItems: "center" });
    const resa = souffle(bouton(k, "Réserver", "/contact", { texte: LAV, fond: AUB, survol: { backgroundColor: OR, borderColor: OR, color: "#ffffff", transform: { y: -3 } }, focus: OR, taille: 15 }), 4000);
    const resaBloc = k.row([carre(k, OR_CLAIR, "10px"), resa], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const ligne1 = G.bande(k, [marque, liensNav, resaBloc], { fond: LAV, gap: "16px 40px", aligne: "center", padV: ["40px", "34px", "30px"], padB: ["34px", "28px", "26px"], padH: MARGES, nom: "Réception" });
    const adresse = coordonnees(k, { layout: "inline", couleur: S.mute, lien: AUB, survol: OR, focus: OR, taille: 14 });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4e4866", liens: AUB, sansCookies: true })(k, env);
    const cellLabel = (t) => k.col([caps(k, t, { couleur: OR, suivi: "0.18em" }), para(k, "à renseigner par l'établissement", { taille: 13, couleur: "#4e4866" })], { flexGrow: 1, flexBasis: "200px", minWidth: "180px", gap: "4px", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "dashed", borderWidth: "2px", borderColor: "#2a234099", borderRadius: "0px" });
    const labels = G.bande(k, [cellLabel("Classement"), cellLabel("Label qualité"), cellLabel("Distinction")], { fond: LAV, gap: "12px", aligne: "stretch", padV: ["8px", "8px", "6px"], padB: ["26px", "22px", "20px"], padH: MARGES, filetHaut: { epaisseur: "1px", couleur: "#2a23404d" }, nom: "Labels" });
    const ligne2 = G.bande(k, [adresse, mentions], { fond: LAV, gap: "8px 36px", aligne: "center", padV: ["22px", "18px", "16px"], padB: ["26px", "22px", "20px"], padH: MARGES, filetHaut: { epaisseur: "1px", couleur: "#2a23404d" }, nom: "Adresse et mentions" });
    ligne2.styles.desktop.color = AUB;
    return [G.racine(k, [barre(G, k, OR_CLAIR, ["8px", "8px", "6px"]), ligne1, labels, ligne2])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-192 « Colonne de la maison » — chambres d'hôtes  [archétype A : colonne latérale pleine hauteur]
// Idée : une grande COLONNE VERTE pleine hauteur à gauche (« La maison » empilé en Young Serif, bouton de réservation rose ancien dont le carré « respire », lien arrivée et départ), et à droite la zone lin :
// une phrase d'accueil en grand serif, quatre étiquettes carrées (chambres, petit-déjeuner, jardin, alentours), l'adresse, la lettre et les mentions. Pas d'horaires. Sauge foncée, lin, rose ancien.
// Étiquettes d'exemple à renommer. Polices : Young Serif (titres) et Nunito Sans (texte). Mobile : la colonne passe au-dessus, pleine largeur.
const maison = identite({
  key: "c192", label: "Sauge foncée, lin et rose ancien", humeur: "light",
  fond: "#f6efe4", texte: "#2b2a24", discret: "#5b574b", accent: "#9c4f3f", surface: "#fbf6ee", encre: "#2b2a24", surEncre: "#f6efe4",
  police: "font.nunito-sans", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2b2a244d",
});
const SAUGE_F = "#3f5a4a", LIN_ = "#f6efe4", ROSE = "#f0b9aa", ROSE_F = "#9c4f3f", BRUN2 = "#2b2a24";

const colonneMaison = modeleV2({
  id: identifiantV2(192, "colonne-de-la-maison"), concept: "c-192-colonne-de-la-maison",
  name: "Colonne de la maison", family: FAM,
  description: "Pour des chambres d'hôtes : grande colonne verte pleine hauteur avec le nom et la réservation, à côté d'une zone lin avec phrase d'accueil, quatre étiquettes carrées, adresse, lettre et mentions. Sauge foncée, lin, rose ancien.",
  tags: ["chambres d'hôtes", "maison d'hôtes", "réservation", "petit-déjeuner", "colonne latérale", "sauge", "rose ancien"],
  identity: maison,
  racine: racineDe(LIN_),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>La<br>maison<span style="color:${ROSE}">.</span></p>`, { taille: [44, 68], tablette: { taille: [64, 84] }, mobile: { taille: [48, 72] }, lh: 0.98, suivi: "-0.01em", poids: "400", police: S.head, couleur: LIN_ })(k, env);
    const b = souffle(bouton(k, "Réserver une chambre", "/contact", { texte: BRUN2, fond: ROSE, survol: { backgroundColor: LIN_, borderColor: LIN_, color: SAUGE_F, transform: { y: -3 } }, focus: LIN_, taille: 15 }), 4000);
    const arr = lien(k, "Arrivée et départ →", "/faq", { taille: 16, poids: "700", couleur: LIN_, soulign: true, survol: { color: ROSE, paddingLeft: "8px" }, focus: ROSE });
    const colonne = k.col([caps(k, "Chambres d'hôtes", { couleur: "#f8d9d0", suivi: "0.24em" }), nom, para(k, "Un accueil simple, quelques chambres, le petit-déjeuner à la table commune.", { taille: 17, couleur: "#e2ebe5", max: "260px" }), b, arr], { flexGrow: 0, flexShrink: 0, flexBasis: "340px", minWidth: "260px", gap: "22px", justifyContent: "flex-start", backgroundColor: SAUGE_F, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "44px", paddingRight: "36px", borderRadius: "0px" }, { flexBasis: "100%" }, { flexBasis: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" });
    const phrase = G.geant(`<p>Bienvenue chez nous : une maison, un jardin, et le temps de s'arrêter.</p>`, { taille: [26, 44], lh: 1.25, suivi: "-0.005em", poids: "400", police: S.head, couleur: BRUN2 })(k, env);
    const etiq = (t, u) => lien(k, t, u, { taille: 16, poids: "700", couleur: SAUGE_F, h: "52px", padH: "22px", survol: { backgroundColor: SAUGE_F, color: "#ffffff", transform: { y: -3 } }, focus: ROSE_F, extra: { borderStyle: "solid", borderWidth: "2px", borderColor: SAUGE_F, justifyContent: "center" } });
    const etiquettes = k.row([etiq("Les chambres", "/catalogue"), etiq("Le petit-déjeuner", "/blog"), etiq("Le jardin", "/blog"), etiq("Les alentours", "/blog")], { gap: "12px" });
    const cAD = (e, t) => k.col([caps(k, e, { couleur: SAUGE_F, suivi: "0.2em", poids: "800" }), lien(k, t, "/faq", { taille: 17, poids: "700", couleur: BRUN2, survol: { color: ROSE_F, paddingLeft: "8px" }, focus: ROSE_F })], { flexGrow: 1, flexBasis: "200px", gap: "2px", paddingTop: "12px", paddingBottom: "10px", paddingLeft: "18px", paddingRight: "18px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "6px", borderColor: ROSE, borderRadius: "0px" });
    const arrDep = k.row([cAD("Arrivée", "Conditions d'arrivée"), cAD("Départ", "Conditions de départ")], { width: "100%", gap: "12px" });
    const colAdr = bloc(k, "Nous trouver", [coordonnees(k, { couleur: BRUN2, lien: BRUN2, survol: ROSE_F, focus: ROSE_F })], { couleurTitre: ROSE_F, min: "230px" });
    const abo = lettre(k, env, { titre: "La lettre de la maison", intro: "Nouvelles de la maison et du jardin : un message de temps en temps.", largeur: "330px", accent: SAUGE_F, texte: BRUN2, couleurTitre: ROSE_F, couleurIntro: "#4a463a", surBouton: "#ffffff", survolBouton: ROSE_F, surSurvol: "#ffffff" });
    const bas2 = G.ligne(k, [colAdr, G.colonne(k, [abo], { poids: 1.3, min: "260px" })], { gap: "32px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4a463a", liens: BRUN2, sansCookies: true })(k, env);
    const emplacement = para(k, "Labels et classements : emplacement réservé, à renseigner par l'établissement.", { taille: 13, couleur: "#4a463a" });
    const principal = k.col([phrase, etiquettes, arrDep, trait(k, "#2b2a244d"), bas2, emplacement, mentions], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "30px", justifyContent: "center", paddingTop: "64px", paddingBottom: "36px", paddingLeft: "56px", paddingRight: "48px", borderRadius: "0px" }, undefined, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", gap: "24px" });
    const corps = G.bande(k, [colonne, principal], { fond: LIN_, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Colonne et maison" });
    corps.styles.desktop.color = BRUN2;
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-193 « Frise du séjour » — gîte  [archétype I : frise en étapes à points carrés]
// Idée : le séjour raconté comme une FRISE horizontale à points carrés : Réserver, Arriver, Séjourner, Repartir. Chaque étape est un point carré sur un fil mousse, un titre-lien et une ligne d'explication ; le point
// de la première étape « respire ». Dessous, une bande mousse avec l'adresse et la lettre (sans horaires) et les mentions. Pierre claire, mousse, rouille. Étapes d'exemple, liens vers les pages de conditions.
// Polices : Archivo (titres) et Public Sans (texte). Mobile : les étapes s'empilent, chacune garde son fil.
const gite = identite({
  key: "c193", label: "Pierre claire, mousse et rouille", humeur: "light",
  fond: "#e2dfd6", texte: "#25281d", discret: "#4f5242", accent: "#3e5a24", surface: "#eceae3", encre: "#25281d", surEncre: "#e2dfd6",
  police: "font.public-sans", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#25281d4d",
});
const PIERRE = "#e2dfd6", MOUSSE = "#3e5a24", MOUSSE_F = "#2e4419", RAIN = "#b4521f", CRAIE2 = "#eef0e2";

const frise = modeleV2({
  id: identifiantV2(193, "frise-du-sejour"), concept: "c-193-frise-du-sejour",
  name: "Frise du séjour", family: FAM,
  description: "Pour un gîte : frise horizontale en quatre étapes à points carrés (réserver, arriver, séjourner, repartir), chaque étape renvoyant vers sa page, puis bande mousse avec adresse, lettre et mentions. Pierre claire, mousse, rouille.",
  tags: ["gîte", "location", "séjour", "arrivée et départ", "frise", "mousse", "pierre"],
  identity: gite,
  racine: racineDe(MOUSSE_F),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Votre séjour, étape par étape<span style="color:${RAIN}">.</span></p>`, { taille: [34, 72], tablette: { taille: [48, 64] }, mobile: { taille: [34, 44] }, lh: 1.02, suivi: "-0.02em", poids: "800", police: S.head, couleur: "#25281d" })(k, env);
    const etape = (n, nom, texte, url, pulse) => {
      const point = pulse ? souffle(carre(k, RAIN, "18px"), 3000) : carre(k, MOUSSE, "18px");
      const fil = k.divider({ width: "100%", flexGrow: 1, borderColor: MOUSSE, borderTopWidth: "3px", marginTop: "0px", marginBottom: "0px" });
      const entete = k.row([point, fil], { width: "100%", alignItems: "center", flexWrap: "nowrap", gap: "0px" });
      const t = lien(k, nom, url, { taille: 30, poids: "800", police: S.head, couleur: "#25281d", survol: { color: RAIN, paddingLeft: "8px" }, focus: RAIN, h: "52px" });
      return k.col([entete, t, para(k, texte, { taille: 15, couleur: "#4f5242", max: "240px" })], { flexGrow: 1, flexBasis: "22%", minWidth: "210px", gap: "10px", paddingRight: "20px" });
    };
    const etapes = k.row([etape(1, "Réserver", "Choisissez vos dates et le gîte qui vous convient.", "/contact", true), etape(2, "Arriver", "Conditions d'arrivée, accès et remise des clés.", "/faq"), etape(3, "Séjourner", "Équipements, consignes et bonnes adresses.", "/blog"), etape(4, "Repartir", "Conditions de départ et état des lieux.", "/faq")], { width: "100%", rowGap: "28px", columnGap: "0px", alignItems: "flex-start" });
    const haut = G.bande(k, [titre, etapes], { fond: PIERRE, colonne: true, aligne: "stretch", gap: "52px", padV: ["72px", "56px", "40px"], padB: ["72px", "56px", "44px"], padH: MARGES, innerMobile: { rowGap: "36px" }, nom: "Frise" });
    const abo = lettre(k, env, { titre: "La lettre du gîte", intro: "Disponibilités et bons plans du coin : un message de temps en temps.", largeur: "330px", accent: MOUSSE, texte: "#25281d", couleurIntro: "#4f5242", surBouton: "#ffffff", survolBouton: RAIN, surSurvol: "#ffffff" });
    const bandeLettre = G.bande(k, [G.colonne(k, [caps(k, "Rester informé", { couleur: MOUSSE, suivi: "0.2em", poids: "800" }), para(k, "Un message de temps en temps, rien de plus.", { taille: 17, couleur: "#25281d", max: "360px" })], { poids: 1, min: "260px", gap: "8px" }), G.colonne(k, [abo], { poids: 1, min: "280px" })], { fond: "#d3d0c4", gap: "24px 64px", aligne: "center", padV: ["36px", "32px", "28px"], padB: ["36px", "32px", "28px"], padH: MARGES, nom: "Lettre" });
    const adresse = coordonnees(k, { layout: "inline", couleur: CRAIE2, lien: CRAIE2, survol: "#f4c9a8", focus: "#f4c9a8", taille: 15 });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d9e0c8", liens: CRAIE2, sansCookies: true })(k, env);
    const emplacement = para(k, "Labels et classements : emplacement réservé, à renseigner par le propriétaire.", { taille: 13, couleur: "#d9e0c8" });
    const bas = G.bande(k, [adresse, emplacement, mentions], { fond: MOUSSE_F, gap: "10px 40px", aligne: "center", padV: ["30px", "26px", "24px"], padB: ["30px", "26px", "24px"], padH: MARGES, nom: "Adresse et mentions" });
    bas.styles.desktop.color = CRAIE2;
    return [G.racine(k, [haut, bandeLettre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-194 « Fenêtre de réservation » — auberge  [archétype K : fenêtre / formulaire]
// Idée : le pied ressemble à une FENÊTRE d'application posée sur fond clair : barre de titre indigo avec trois petits carrés, trois champs à angles droits (Arrivée, Départ, Voyageurs) qui sont des liens vers
// la réservation, un gros bouton ocre « Vérifier les disponibilités » dont le carré « respire », des onglets (dortoirs, chambres privées, cuisine partagée, bar), puis une barre d'état avec l'adresse et les mentions.
// Aucun horaire ni tarif écrit : tout vient des pages et des Données de l'entreprise. Indigo, ocre, papier. Polices : Lexend (titres) et Work Sans (texte). Mobile : champs et onglets empilés.
const auberge = identite({
  key: "c194", label: "Indigo, ocre et papier", humeur: "light",
  fond: "#faf6ef", texte: "#23264a", discret: "#4b4f78", accent: "#3d4270", surface: "#ffffff", encre: "#23264a", surEncre: "#faf6ef",
  police: "font.work-sans", titres: "font.lexend",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#23264a4d",
});
const INDIGO = "#3d4270", INDIGO_F = "#23264a", OCRE2 = "#e3a72f", PAPIER2 = "#faf6ef", TEINTE = "#e9e8f2";

const fenetreResa = modeleV2({
  id: identifiantV2(194, "fenetre-de-reservation"), concept: "c-194-fenetre-de-reservation",
  name: "Fenêtre de réservation", family: FAM,
  description: "Pour une auberge : le pied dessiné comme une fenêtre de réservation, barre de titre indigo, champs arrivée, départ et voyageurs, bouton ocre, onglets d'hébergements et barre d'état avec adresse et mentions. Indigo, ocre, papier.",
  tags: ["auberge", "réservation", "arrivée et départ", "fenêtre", "dortoirs", "indigo", "ocre"],
  identity: auberge,
  racine: racineDe(PAPIER2),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titreBarre = k.row([caps(k, "Auberge du Pont · Réserver", { couleur: "#ffffff", suivi: "0.16em" }), k.row([carre(k, OCRE2, "12px"), carre(k, "#ffffff", "12px"), carre(k, "#ffffff", "12px")], { gap: "6px", flexWrap: "nowrap" })], { width: "100%", justifyContent: "space-between", alignItems: "center", backgroundColor: INDIGO, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "20px", paddingRight: "20px", flexWrap: "nowrap" });
    const champ = (etiquette, valeur, url) => {
      const l = lien(k, valeur, url, { taille: 18, poids: "700", couleur: INDIGO_F, survol: { color: INDIGO }, focus: INDIGO, h: "44px", extra: { width: "100%" } });
      const c = k.col([caps(k, etiquette, { couleur: INDIGO, suivi: "0.18em", poids: "800" }), l], { flexGrow: 1, flexBasis: "200px", minWidth: "160px", gap: "4px", paddingTop: "12px", paddingBottom: "8px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: INDIGO_F, transitionDuration: DOUX, borderRadius: "0px" });
      c.states = { hover: { backgroundColor: TEINTE } };
      return c;
    };
    const champs = k.row([champ("Arrivée", "Choisir une date", "/contact"), champ("Départ", "Choisir une date", "/contact"), champ("Voyageurs", "Choisir", "/contact")], { width: "100%", gap: "12px", alignItems: "stretch" });
    const valider = souffle(bouton(k, "Vérifier les disponibilités", "/contact", { texte: INDIGO_F, fond: OCRE2, survol: { backgroundColor: INDIGO_F, borderColor: INDIGO_F, color: "#ffffff", transform: { y: -3 } }, focus: INDIGO_F, taille: 16, extra: { width: "100%" } }), 4200);
    const onglet = (t, u) => lien(k, t, u, { taille: 15, poids: "700", couleur: INDIGO_F, h: "48px", padH: "20px", survol: { backgroundColor: INDIGO_F, color: "#ffffff", transform: { y: -2 } }, focus: INDIGO, extra: { borderStyle: "solid", borderWidth: "2px", borderColor: INDIGO_F, justifyContent: "center", flexGrow: 1 } });
    const onglets = k.row([onglet("Dortoirs", "/catalogue"), onglet("Chambres privées", "/catalogue"), onglet("Cuisine partagée", "/blog"), onglet("Bar et terrasse", "/blog")], { width: "100%", gap: "10px" });
    const corps = k.col([champs, valider, caps(k, "Nos hébergements et espaces", { couleur: INDIGO }), onglets, para(k, "Arrivée et départ : conditions sur la page d'informations pratiques.", { taille: 15, couleur: "#4b4f78" }), lien(k, "Informations pratiques →", "/faq", { taille: 15, poids: "700", couleur: INDIGO_F, soulign: true, survol: { color: INDIGO }, focus: INDIGO })], { width: "100%", gap: "18px", paddingTop: "28px", paddingBottom: "26px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: PAPIER2, borderRadius: "0px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const adresse = coordonnees(k, { layout: "inline", couleur: INDIGO_F, lien: INDIGO_F, survol: INDIGO, focus: INDIGO, taille: 14 });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4b4f78", liens: INDIGO_F, sansCookies: true })(k, env);
    const etat = k.col([adresse, mentions], { width: "100%", gap: "8px", backgroundColor: TEINTE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "28px", paddingRight: "28px", borderRadius: "0px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const fenetre = k.col([titreBarre, corps, etat], { width: "100%", maxWidth: "980px", gap: "0px", borderStyle: "solid", borderWidth: "3px", borderColor: INDIGO_F, borderRadius: "0px" });
    const emplacement = para(k, "Labels et classements : emplacement réservé, à renseigner par l'établissement.", { taille: 13, couleur: "#4b4f78" });
    const bande = G.bande(k, [fenetre, emplacement], { fond: PAPIER2, colonne: true, aligne: "center", gap: "18px", padV: ["56px", "44px", "28px"], padB: ["32px", "28px", "24px"], padH: MARGES, nom: "Fenêtre" });
    bande.styles.desktop.color = INDIGO_F;
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-195 « Emplacement XXL » — camping  [archétype F : bandeau d'appel XXL + colonne de liens étroite]
// Idée : un BANDEAU D'APPEL géant en tête (« Réservez votre emplacement. » en Teko jusqu'à 170 px sur fond kaki, gros bouton orange dont le carré « respire »), puis une bande sable : à gauche l'accueil du camping
// (adresse et horaires de la réception), à droite UNE colonne étroite de liens (emplacements, locatifs, services, activités, règlement) bordée d'une barre kaki, où chaque ligne glisse au survol. Pas de lettre.
// Intitulés d'exemple à renommer. Polices : Teko (titres) et Nunito Sans (texte). Mobile : bandeau, accueil, puis liens pleine largeur.
const camping = identite({
  key: "c195", label: "Kaki, sable et orange feu", humeur: "dark",
  fond: "#343a22", texte: "#efe6cc", discret: "#cfd0b4", accent: "#ff8a1f", surface: "#3d442a", encre: "#343a22", surEncre: "#efe6cc",
  police: "font.nunito-sans", titres: "font.teko",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#efe6cc4d",
});
const KAKI = "#343a22", SABLE = "#e9dfc0", FEU = "#ff8a1f", FEU_F = "#7f3b00", TERRE = "#2a2d1a";

const emplacementXXL = modeleV2({
  id: identifiantV2(195, "emplacement-xxl"), concept: "c-195-emplacement-xxl",
  name: "Emplacement XXL", family: FAM,
  description: "Pour un camping : bandeau d'appel géant « Réservez votre emplacement » avec gros bouton orange, puis bande sable avec l'accueil (adresse, horaires de la réception) et une colonne étroite de liens qui glissent. Kaki, sable, orange feu.",
  tags: ["camping", "emplacements", "locatifs", "réservation", "réception", "kaki", "orange"],
  identity: camping,
  racine: racineDe(KAKI),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Réservez votre<br><span style="color:${FEU}">emplacement.</span></p>`, { taille: [56, 128], tablette: { taille: [56, 76] }, mobile: { taille: [48, 72] }, lh: 0.98, suivi: "0.005em", poids: "700", police: S.head, couleur: SABLE, extra: { textTransform: "uppercase" } })(k, env);
    const b = souffle(bouton(k, "Choisir mes dates", "/contact", { texte: TERRE, fond: FEU, survol: { backgroundColor: SABLE, borderColor: SABLE, color: TERRE, transform: { y: -4 } }, focus: SABLE, taille: 20, extra: { minHeight: "68px", paddingLeft: "40px", paddingRight: "40px" } }), 3800);
    const droite = G.colonne(k, [para(k, "Emplacements tente, caravane, camping-car et hébergements locatifs.", { taille: 18, couleur: S.mute, max: "340px" }), b], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" });
    const haut = G.bande(k, [G.colonne(k, [caps(k, "Camping des Pins", { couleur: FEU, suivi: "0.26em" }), phrase], { poids: 7, min: "300px", gap: "12px" }), droite], { fond: KAKI, gap: "36px 64px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["80px", "60px", "48px"], padH: MARGES, nom: "Appel" });
    const accueil = G.colonne(k, [caps(k, "Accueil du camping", { couleur: FEU_F, suivi: "0.22em", poids: "800" }), G.ligne(k, [G.colonne(k, [coordonnees(k, { couleur: TERRE, lien: TERRE, survol: FEU_F, focus: FEU_F, taille: 16 })], { poids: 1, min: "220px" }), G.colonne(k, [caps(k, "Réception", { couleur: "#5a5a3c" }), horaires(k, { couleur: TERRE, taille: 16 })], { poids: 1, min: "220px", gap: "8px" })], { gap: "28px 48px", aligne: "flex-start", largeur: "100%" }), para(k, "Labels et classements : emplacement réservé, à renseigner par l'établissement.", { taille: 13, couleur: "#4a4a30" })], { poids: 7, min: "300px", gap: "20px" });
    const ligneL = (t, u) => k.row([lien(k, t, u, { taille: 20, poids: "700", couleur: TERRE, survol: { color: FEU_F, paddingLeft: "12px" }, focus: FEU_F, h: "52px", extra: { flexGrow: 1 } }), k.T("<p>→</p>", { fontSize: "20px", color: FEU_F, fontFamily: S.font, flexShrink: 0 })], { width: "100%", alignItems: "center", flexWrap: "nowrap", gap: "8px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#2a2d1a40" });
    const colLiens = k.col([ligneL("Emplacements", "/catalogue"), ligneL("Locatifs", "/catalogue"), ligneL("Services", "/blog"), ligneL("Activités", "/blog"), ligneL("Règlement intérieur", "/faq"), ligneL("Nous écrire", "/contact")], { flexGrow: 0, flexShrink: 1, flexBasis: "300px", minWidth: "240px", gap: "4px", paddingLeft: "24px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "6px", borderColor: KAKI, borderRadius: "0px" }, undefined, { flexBasis: "100%", paddingLeft: "16px" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#cfd0b4", liens: SABLE, sansCookies: true })(k, env);
    const mid = G.bande(k, [G.ligne(k, [accueil, colLiens], { gap: "36px 64px", aligne: "flex-start", largeur: "100%" })], { fond: SABLE, colonne: true, gap: "36px", padV: ["56px", "48px", "36px"], padB: ["56px", "48px", "36px"], padH: MARGES, innerMobile: { rowGap: "28px" }, nom: "Accueil et liens" });
    mid.styles.desktop.color = TERRE;
    const bas = G.bande(k, [mentions], { fond: KAKI, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGES, nom: "Mentions" });
    bas.styles.desktop.color = SABLE;
    return [G.racine(k, [haut, mid, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Hôtels et gîtes", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : hôtel, chambres d'hôtes, gîte, auberge, camping.",
  models: [receptionLigne, colonneMaison, frise, fenetreResa, emplacementXXL],
};
