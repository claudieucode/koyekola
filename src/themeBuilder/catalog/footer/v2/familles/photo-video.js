// Famille v2 « Photo et vidéo » — 5 modèles (ft2-256 à ft2-260), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds de studios : studio photo, photographe de mariage, production vidéo, imprimerie photo, drone. AUCUNE image inventée (planches contact, images et séries sont des intitulés TEXTE),
// aucune coordonnée, horaire, tarif ni chiffre inventé : adresse, téléphone et horaires viennent des Données de l'entreprise du site (sans données, les widgets restent sobres).
// Les rubriques (Portrait, Reportages…) sont des intitulés d'EXEMPLE à renommer dans l'éditeur ; les adresses de réseaux sont des exemples. Chaque modèle a sa palette, ses polices (2 au plus) et sa composition (mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions longues et douces (360 ms) de couleur, de fond, de contour et de décalage (2 à 6 px) sur tous les liens, boutons et cartes ;
//   · UNE animation visible par modèle : carré « REC » qui respire, vignette qui se remplit, bouton qui se soulève, ligne qui s'indente ;
//   · pas d'animation d'entrée, pas de widget « Défilement continu » (limites du moteur : voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const FAM = "photo-video";

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
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
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

const PV = ["72px", "56px", "44px"], PB = ["64px", "52px", "40px"], PH = ["48px", "32px", "20px"];
const ZERO = ["0px", "0px", "0px"];
const ABO_STYLE = (abo, o) => { // habille le widget e-mail : titre, texte, bouton et survol du bouton
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.titre };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.intro };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.boutonTexte };
  abo.parts.button.states = { hover: { backgroundColor: o.survolFond, color: o.survolTexte }, focus: GK.focus(o.focus) };
  return abo;
};
// case à angles droits de taille égale (damier) : contient des enfants, fond imposé
const cellule = (k, fond, enfants, o = {}) => k.col(enfants, { flexGrow: 1, flexBasis: o.base || "25%", minWidth: o.min || "240px", minHeight: o.h || "210px", backgroundColor: fond, justifyContent: o.justifie || "space-between", gap: "14px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", borderRadius: "0px" });

// ═══ ft2-256 « Pellicule en damier » — studio photo — ARCHÉTYPE C : damier de huit cases égales ═══
// Idée : une PLANCHE CONTACT en texte : un damier de huit cases carrées, alternant béton clair et noir de pellicule. Chaque case est un lien ou une information : titre et réservation, trois séries (Portrait et famille, Produit et mode,
// Entreprise et architecture), horaires, contact, lettre, retouche et tirages. Aucune image. Béton, noir, orange brûlé. Polices : Space Mono (titres) et Inter Tight (texte). Séries d'exemple, à renommer.
// Mobile : les cases passent sur deux colonnes puis une seule.
const planche = identite({
  key: "c256", label: "Béton, noir et orange brûlé", humeur: "light",
  fond: "#dfe3e6", texte: "#111418", discret: "#454d55", accent: "#a8350a", surface: "#f1f3f4", encre: "#111418", surEncre: "#f1f3f4",
  police: "font.inter-tight", titres: "font.space-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#11141833",
});
const BETON = "#dfe3e6", PELL = "#111418", ORANGE = "#ff8a4c", ORB = "#a8350a";
const plancheContact = modeleV2({
  id: identifiantV2(256, "pellicule-en-damier"), concept: "c-256-pellicule-en-damier",
  name: "Pellicule en damier", family: FAM,
  description: "Pour un studio photo : damier de huit cases carrées (béton et noir de pellicule) où chacune est un lien ou une information : réservation, séries, horaires, contact, lettre, tirages. Béton, noir, orange brûlé.",
  tags: ["studio photo", "photographe", "planche contact", "damier", "réservation de séance", "béton", "orange"],
  identity: planche,
  racine: racineDe(BETON),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const serie = (n, nom, dark) => lien(k, `${n} · ${nom}`, "/blog", { taille: 22, poids: "700", couleur: dark ? BETON : PELL, h: "210px", padH: "22px", casse: "uppercase", suivi: "0.02em", police: S.head, survol: dark ? { backgroundColor: ORANGE, color: PELL } : { backgroundColor: PELL, color: BETON }, focus: dark ? ORANGE : ORB, extra: { alignItems: "flex-end", paddingBottom: "22px", flexGrow: 1, flexBasis: "25%", minWidth: "240px", backgroundColor: dark ? PELL : BETON, borderStyle: "solid", borderWidth: "1px", borderColor: dark ? PELL : "#11141833" } });
    // 1 (noir) : titre + réservation
    const c1 = cellule(k, PELL, [k.row([souffle(carre(k, ORANGE, "12px"), 2800), caps(k, "Studio photo", { couleur: ORANGE, suivi: "0.2em", police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }),
      k.T(`<p>Planche<br>contact<span style="color:${ORANGE}">.</span></p>`, { fontSize: "fluid:34-52", lineHeight: 1.02, fontFamily: S.head, fontWeight: "700", color: BETON, textTransform: "uppercase" }),
      bouton(k, "Réserver une séance", "/contact", { texte: PELL, fond: ORANGE, taille: 15, survol: { backgroundColor: BETON, borderColor: BETON, color: PELL, transform: { y: -3 } }, focus: BETON })]);
    // 5 (béton) : horaires ; 6 (noir) : contact ; 7 (béton) : lettre
    const c5 = cellule(k, BETON, [caps(k, "Horaires du studio", { couleur: ORB, police: S.head }), horaires(k, { couleur: PELL, taille: 15 })]);
    const c6 = cellule(k, PELL, [caps(k, "Nous trouver", { couleur: ORANGE, police: S.head }), coordonnees(k, { couleur: BETON, lien: BETON, survol: ORANGE, focus: ORANGE, taille: 15 })]);
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Nouvelles séries", intro: "Un message quand le portfolio s'enrichit.", bouton: "Je m'abonne", largeur: "100%", accent: ORB, texte: PELL }), { titre: ORB, intro: S.mute, boutonTexte: "#ffffff", survolFond: PELL, survolTexte: "#ffffff", focus: PELL });
    const c7 = cellule(k, BETON, [abo], { justifie: "center" });
    const damier = G.ligne(k, [c1, serie("01", "Portrait et famille", false), serie("02", "Produit et mode", true), serie("03", "Entreprise et architecture", false), c5, c6, c7, serie("04", "Retouche et tirages", true)], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const grille = G.bande(k, [damier], { fond: BETON, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", nom: "Damier" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"], ["Vimeo", "https://vimeo.com/"]], { taille: 15, poids: "700", couleur: PELL, survol: ORB, focus: ORB })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, mentions], { fond: BETON, gap: "12px 40px", aligne: "center", padV: ["24px", "22px", "18px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Mentions" });
    return [G.racine(k, [grille, bas])];
  },
}, FAM);

// ═══ ft2-257 « Jour J » — photographe de mariage — ARCHÉTYPE J : papier à en-tête ═══
// Idée : un PAPIER À EN-TÊTE de photographe : un seul cartouche centré, double filet, nom en Bodoni, adresse (Données de l'entreprise) centrée, une ligne centrée de rubriques, un seul bouton « Réserver ma date »,
// double filet de clôture et mentions. Pas de colonnes, pas de lettre. Sauge clair, vert profond (texte), bronze. Polices : Bodoni Moda (titres) et Jost (texte). Mobile : tout reste centré et empilé.
const jourJ = identite({
  key: "c257", label: "Sauge, vert profond et bronze", humeur: "light",
  fond: "#e3e8dc", texte: "#27301f", discret: "#4d5a43", accent: "#8a5a2b", surface: "#eef1e8", encre: "#27301f", surEncre: "#f3f5ee",
  police: "font.jost", titres: "font.bodoni-moda",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#27301f40",
});
const SAUGE = "#e3e8dc", VERTP = "#1f2a1a", BRONZE = "#8a5a2b", CREME = "#f3f5ee";
const jourJModele = modeleV2({
  id: identifiantV2(257, "jour-j"), concept: "c-257-jour-j",
  name: "Jour J", family: FAM,
  description: "Pour un photographe de mariage : papier à en-tête sauge, double filet, nom en Bodoni, adresse centrée, une ligne de rubriques et un seul bouton « Réserver ma date ». Sobre, sans colonnes. Sauge, vert profond, bronze.",
  tags: ["photographe de mariage", "mariage", "papier à en-tête", "centré", "double filet", "sauge", "bronze"],
  identity: jourJ,
  racine: racineDe(SAUGE),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, centre = { textAlign: "center" };
    const dbl = (w) => k.col([trait(k, BRONZE, "3px"), k.col([], { height: "4px" }), trait(k, BRONZE, "1px")], { width: "100%", maxWidth: w });
    const etiq = caps(k, "Photographe de mariage", { couleur: BRONZE, suivi: "0.34em", extra: centre });
    const nom = G.geant(`<p>Atelier Jour J</p>`, { taille: [36, 76], tablette: { taille: [52, 68] }, mobile: { taille: [36, 48] }, lh: 1.05, suivi: "-0.01em", poids: "500", police: S.head, couleur: VERTP, extra: centre })(k, env);
    const devise = k.T("<p>Reportages de mariage, fiançailles et albums sur mesure.</p>", { fontSize: "18px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, textAlign: "center", maxWidth: "520px" });
    const adr = coordonnees(k, { couleur: VERTP, lien: VERTP, survol: BRONZE, focus: BRONZE, taille: 16 });
    const cartouche = k.col([caps(k, "Adresse du studio", { couleur: BRONZE, suivi: "0.24em", extra: centre }), k.col([adr], { alignItems: "center", textAlign: "center", width: "100%" })], { gap: "12px", alignItems: "center", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "36px", paddingRight: "36px", borderStyle: "solid", borderWidth: "1px", borderColor: BRONZE, backgroundColor: "#eef1e8", minWidth: "0px", width: "100%", maxWidth: "460px" });
    const bt = bouton(k, "Réserver ma date", "/contact", { texte: CREME, fond: VERTP, survol: { backgroundColor: BRONZE, borderColor: BRONZE, color: "#ffffff", transform: { y: -3 } }, focus: BRONZE });
    const rubr = [["Reportages", "/blog"], ["Fiançailles", "/blog"], ["Albums", "/blog"], ["Lieux partenaires", "/blog"], ["Questions", "/faq"]];
    const rangee = k.row(rubr.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "500", couleur: VERTP, casse: "uppercase", suivi: "0.14em", survol: { color: BRONZE, transform: { y: -2 } }, focus: BRONZE })), { rowGap: "0px", columnGap: "30px", justifyContent: "center", alignItems: "center" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"]], { taille: 15, poids: "600", couleur: VERTP, survol: BRONZE, focus: BRONZE })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const page = G.bande(k, [dbl("180px"), etiq, nom, devise, cartouche, k.row([bt], { justifyContent: "center", width: "100%" }), rangee, dbl("360px"), reseaux, mentions], { fond: SAUGE, colonne: true, gap: "26px", aligne: "center", padV: ["72px", "56px", "44px"], padB: ["40px", "32px", "28px"], padH: PH, innerMobile: { rowGap: "22px" }, max: "880px", nom: "Papier à en-tête" });
    return [G.racine(k, [page])];
  },
}, FAM);

// ═══ ft2-258 « Clap de fin » — production vidéo — ARCHÉTYPE E : deux demi-pages bord à bord ═══
// Idée : DEUX DEMI-PAGES de couleurs opposées. À gauche, un grand aplat corail avec « Clap de fin. », un carré REC qui respire et les deux boutons (le message) ; à droite, un aplat pétrole nuit avec quatre cases de chapitres
// (prestations d'exemple, cases qui se remplissent de corail au survol) et une case de contact (les actions). Une fine barre pétrole porte les mentions. Polices : Chakra Petch (titres) et Hind (texte).
const clap = identite({
  key: "c258", label: "Pétrole nuit et corail", humeur: "dark",
  fond: "#0b1d26", texte: "#eaf2f4", discret: "#a4bcc6", accent: "#ff6a3d", surface: "#12303d", encre: "#0b1d26", surEncre: "#eaf2f4",
  police: "font.hind", titres: "font.chakra-petch",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#eaf2f438",
});
const PETROLE = "#0b1d26", PETROLE3 = "#0f2a36", CORAIL = "#ff6a3d", GIVRE = "#eaf2f4";
const clapDeFin = modeleV2({
  id: identifiantV2(258, "clap-de-fin"), concept: "c-258-clap-de-fin",
  name: "Clap de fin", family: FAM,
  description: "Pour une société de production vidéo : deux demi-pages bord à bord, corail à gauche (« Clap de fin. », carré REC qui respire, boutons) et pétrole à droite (chapitres qui se remplissent, contact), puis fine barre de mentions.",
  tags: ["production vidéo", "vidéaste", "film", "demi-pages", "chapitres", "pétrole", "corail"],
  identity: clap,
  racine: racineDe(PETROLE3),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, PAD = { paddingTop: "72px", paddingBottom: "64px", paddingLeft: "48px", paddingRight: "48px" };
    const rec = k.row([souffle(carre(k, PETROLE, "14px"), 2400), caps(k, "REC · Production vidéo", { couleur: PETROLE, suivi: "0.22em", police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Clap<br>de fin</p>`, { taille: [64, 160], tablette: { taille: [96, 140] }, mobile: { taille: [64, 96] }, lh: 0.9, suivi: "0.01em", poids: "700", police: S.head, couleur: PETROLE, extra: { textTransform: "uppercase" } })(k, env);
    const tc = k.T("<p>00:00:00:00</p>", { fontSize: "15px", letterSpacing: "0.2em", color: PETROLE, fontFamily: S.head, fontWeight: "600" });
    const boutons = k.row([
      bouton(k, "Demander un devis", "/contact", { texte: CORAIL, fond: PETROLE, survol: { backgroundColor: "#ffffff", borderColor: "#ffffff", color: PETROLE, transform: { y: -3 } }, focus: "#ffffff" }),
      bouton(k, "Voir les films", "/blog", { texte: PETROLE, bord: PETROLE, survol: { backgroundColor: PETROLE, color: CORAIL, transform: { y: -3 } }, focus: "#ffffff" }),
    ], { gap: "12px" });
    const gauche = G.colonne(k, [rec, phrase, boutons], { poids: 1, base: "50%", min: "320px", gap: "22px", justifie: "flex-end", extra: { backgroundColor: CORAIL, ...PAD } });
    const chap = (n, t) => lien(k, `${n} ${t}`, "/blog", { taille: 19, poids: "600", couleur: GIVRE, police: S.head, h: "112px", padH: "16px", casse: "uppercase", suivi: "0.04em", survol: { backgroundColor: CORAIL, color: PETROLE, transform: { y: -4 } }, focus: CORAIL, extra: { alignItems: "flex-end", paddingBottom: "14px", flexGrow: 1, flexBasis: "42%", minWidth: "140px", borderStyle: "solid", borderWidth: "1px", borderColor: "#eaf2f46b" } });
    const cases = G.ligne(k, [chap("01", "Films d'entreprise"), chap("02", "Clips et films de marque"), chap("03", "Captation d'événements"), chap("04", "Montage et étalonnage")], { gap: "10px", aligne: "stretch", largeur: "100%" });
    const contactCase = k.col([caps(k, "Parlons de votre film", { couleur: CORAIL, police: S.head }), coordonnees(k, { couleur: GIVRE, lien: GIVRE, survol: CORAIL, focus: CORAIL })], { gap: "10px", width: "100%", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "22px", backgroundColor: "#12303d" });
    const droite = G.colonne(k, [caps(k, "Chapitres", { couleur: CORAIL, police: S.head }), cases, contactCase], { poids: 1, base: "50%", min: "320px", gap: "18px", extra: { backgroundColor: PETROLE, ...PAD } });
    const moitie = G.bande(k, [gauche, droite], { fond: PETROLE, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Deux demi-pages" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#a4bcc6", liens: GIVRE, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: PETROLE3, gap: "12px 40px", aligne: "center", padV: ["24px", "22px", "18px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Mentions" });
    bas.styles.desktop.color = GIVRE;
    return [G.racine(k, [moitie, bas])];
  },
}, FAM);

// ═══ ft2-259 « Repères de tirage » — imprimerie photo — ARCHÉTYPE G : index en lignes pleine largeur ═══
// Idée : un INDEX d'imprimeur. Barre de repères CMJN (quatre aplats), puis cinq grandes lignes pleine largeur (« Tirages papier », « Toiles et châssis »…) en Archivo Black, filet fin dessous, mention du papier à droite ; au survol la ligne
// devient noire et s'indente. Sous l'index : une barre noire avec le contact (Données de l'entreprise) et la lettre. Aucune carte. Blanc papier, noir, bleu. Polices : Archivo Black et Source Serif 4. Supports d'exemple.
const reperes = identite({
  key: "c259", label: "Blanc papier, noir et quadrichromie", humeur: "light",
  fond: "#fbfbf8", texte: "#161616", discret: "#4a4a46", accent: "#0b5cad", surface: "#f0f0ea", encre: "#161616", surEncre: "#fbfbf8",
  police: "font.source-serif-4", titres: "font.archivo-black",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#16161633",
});
const PAPIER = "#fbfbf8", ENCRE = "#161616", BLEU = "#0b5cad", BLEUC = "#7fb8f0";
const reperesTirage = modeleV2({
  id: identifiantV2(259, "reperes-de-tirage"), concept: "c-259-reperes-de-tirage",
  name: "Repères de tirage", family: FAM,
  description: "Pour une imprimerie photo : barre de repères quadrichromie puis index de cinq grandes lignes pleine largeur (tirages, toiles, livres, cadres, cartes) qui noircissent et s'indentent au survol, et barre noire de contact et lettre.",
  tags: ["imprimerie photo", "tirage photo", "laboratoire", "index", "quadrichromie", "lignes pleine largeur", "bleu"],
  identity: reperes,
  racine: racineDe(ENCRE),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const quatre = k.row(["#00a3e0", "#e4007c", "#ffd500", ENCRE].map((c) => k.col([], { flexGrow: 1, flexBasis: "25%", height: "14px", backgroundColor: c })), { gap: "0px", flexWrap: "nowrap", width: "100%" });
    const barreMire = G.bande(k, [quatre], { fond: PAPIER, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", nom: "Repères CMJN" });
    const entete = k.row([caps(k, "Imprimerie photo · Supports", { couleur: BLEU, suivi: "0.2em" }), lien(k, "Envoyer mes photos", "/contact", { taille: 15, poids: "700", couleur: ENCRE, soulign: true, survol: { color: BLEU }, focus: BLEU })], { rowGap: "12px", columnGap: "24px", justifyContent: "space-between", alignItems: "center", width: "100%" });
    const index = (n, nom, desc) => {
      const l = lien(k, nom, "/blog", { taille: 40, poids: "400", couleur: ENCRE, police: S.head, h: "96px", bloc: true, padH: "6px", survol: { backgroundColor: ENCRE, color: PAPIER, transform: { x: 14 } }, focus: BLEU, extra: { flexGrow: 1, flexBasis: "60%", lineHeight: 1.05 } });
      const d = k.T(`<p>${desc}</p>`, { fontSize: "16px", lineHeight: 1.4, color: S.mute, fontFamily: S.font, fontStyle: "italic", textAlign: "right", flexBasis: "28%", flexGrow: 1, minWidth: "140px" });
      return k.row([l, d], { rowGap: "4px", columnGap: "24px", alignItems: "center", width: "100%", justifyContent: "space-between", borderBottomStyle: "solid", borderBottomWidth: "1px", borderBottomColor: "#161616aa" });
    };
    const liste = G.colonne(k, [trait(k, ENCRE, "3px"), index("1", "Tirages papier", "Brillant, mat, lustré"), index("2", "Toiles et châssis", "Grands formats"), index("3", "Livres photo", "Couverture au choix"), index("4", "Cadres et montage", "Sur mesure"), index("5", "Cartes et calendriers", "Petites séries")], { gap: "0px", extra: { width: "100%" } });
    const haut = G.bande(k, [entete, liste], { fond: PAPIER, colonne: true, gap: "20px", padV: ["44px", "36px", "28px"], padB: ["44px", "36px", "28px"], padH: PH, nom: "Index" });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Les offres de tirage", intro: "Nouveaux papiers et formats, rarement.", bouton: "Je m'abonne", largeur: "340px", accent: BLEUC, texte: PAPIER }), { titre: BLEUC, intro: "#c9c9c3", boutonTexte: ENCRE, survolFond: PAPIER, survolTexte: ENCRE, focus: PAPIER });
    const contact = G.colonne(k, [caps(k, "Retrait et contact", { couleur: BLEUC }), coordonnees(k, { couleur: PAPIER, lien: PAPIER, survol: BLEUC, focus: BLEUC })], { poids: 1, min: "260px" });
    const bas = G.bande(k, [contact, G.colonne(k, [abo], { poids: 1, min: "280px" }), trait(k, "#fbfbf840"), G.ligneLegale({ taille: 13, couleur: "#c9c9c3", liens: PAPIER, sansCookies: true })(k, env)], { fond: ENCRE, gap: "28px 56px", aligne: "flex-start", padV: ["44px", "36px", "28px"], padB: ["24px", "20px", "18px"], padH: PH, innerMobile: { rowGap: "24px" }, nom: "Contact, lettre et mentions" });
    bas.styles.desktop.color = PAPIER;
    return [G.racine(k, [barreMire, haut, bas])];
  },
}, FAM);

// ═══ ft2-260 « Plan de vol » — drone — ARCHÉTYPE A : colonne latérale pleine hauteur ═══
// Idée : une BARRE LATÉRALE graphite pleine hauteur à gauche (les cinq missions du drone en liens blancs filetés qui s'indentent, puis les horaires) et une grande zone titane à droite : « Vue d'en haut. » en capitales, bandeau
// réglementation (texte), bouton de mission, contact. Fine barre graphite en bas pour réseaux et mentions. Titane, graphite, rouge signal. Polices : Rajdhani (titres) et Public Sans (texte). Missions d'exemple.
const plan = identite({
  key: "c260", label: "Gris titane, graphite et rouge signal", humeur: "light",
  fond: "#cdd3d8", texte: "#0e1a24", discret: "#3b4854", accent: "#b3122b", surface: "#dde2e6", encre: "#0e1a24", surEncre: "#f1f4f6",
  police: "font.public-sans", titres: "font.rajdhani",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#0e1a2440",
});
const TITANE = "#cdd3d8", GRAPHITE = "#0e1a24", SIGNAL = "#b3122b", SIGNALC = "#ff6b7e", BLANCG = "#f1f4f6";
const planDeVol = modeleV2({
  id: identifiantV2(260, "plan-de-vol"), concept: "c-260-plan-de-vol",
  name: "Plan de vol", family: FAM,
  description: "Pour une entreprise de prises de vues par drone : barre latérale graphite pleine hauteur (cinq missions et horaires) et grande zone titane avec « Vue d'en haut. », bandeau réglementation, contact et bouton de mission. Titane, graphite, rouge signal.",
  tags: ["drone", "prise de vue aérienne", "cartographie", "inspection", "barre latérale", "titane", "rouge"],
  identity: plan,
  racine: racineDe(GRAPHITE),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const mission = (t) => lien(k, t, "/blog", { taille: 19, poids: "700", couleur: BLANCG, police: S.head, casse: "uppercase", suivi: "0.05em", h: "56px", bloc: true, survol: { color: SIGNALC, transform: { x: 10 } }, focus: SIGNALC, extra: { width: "100%", borderBottomStyle: "solid", borderBottomWidth: "1px", borderBottomColor: "#f1f4f633" } });
    const lat = G.colonne(k, [caps(k, "Nos missions", { couleur: SIGNALC, police: S.head, suivi: "0.22em" }), mission("Cartographie"), mission("Inspection d'ouvrages"), mission("Immobilier"), mission("Événements"), mission("Agriculture"),
      k.col([], { height: "26px" }), caps(k, "Horaires du bureau", { couleur: SIGNALC, police: S.head, suivi: "0.22em" }), horaires(k, { couleur: BLANCG, taille: 15 })], { poids: 0, base: "340px", min: "290px", gap: "0px", extra: { backgroundColor: GRAPHITE, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "36px", paddingRight: "36px", flexGrow: 0, flexShrink: 0 } });
    const stat = k.row([souffle(carre(k, SIGNAL, "14px"), 2600), caps(k, "Prises de vues aériennes", { couleur: GRAPHITE, police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Vue<br>d'en haut<span style="color:${SIGNAL}">.</span></p>`, { taille: [64, 150], tablette: { taille: [96, 130] }, mobile: { taille: [64, 92] }, lh: 0.9, suivi: "0em", poids: "700", police: S.head, couleur: GRAPHITE, extra: { textTransform: "uppercase" } })(k, env);
    const regl = k.col([caps(k, "Réglementation", { couleur: SIGNAL, police: S.head }), k.T("<p>Chaque mission est préparée selon la réglementation en vigueur : zones de vol, autorisations et conditions météo. Les réponses aux questions courantes sont dans la foire aux questions.</p>", { fontSize: "15px", lineHeight: 1.55, color: GRAPHITE, fontFamily: S.font }), lien(k, "Questions sur les conditions de vol", "/faq", { taille: 15, poids: "700", couleur: GRAPHITE, soulign: true, survol: { color: SIGNAL }, focus: SIGNAL })], { gap: "8px", paddingTop: "18px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: BLANCG, borderStyle: "solid", borderWidth: "2px", borderColor: GRAPHITE, maxWidth: "460px" });
    const bouton1 = bouton(k, "Demander une mission", "/contact", { texte: BLANCG, fond: GRAPHITE, survol: { backgroundColor: SIGNAL, borderColor: SIGNAL, color: "#ffffff", transform: { y: -3 } }, focus: SIGNAL });
    const contact = G.colonne(k, [caps(k, "Contact", { couleur: SIGNAL, police: S.head }), coordonnees(k, { couleur: GRAPHITE, lien: GRAPHITE, survol: SIGNAL, focus: SIGNAL })], { gap: "8px" });
    const principal = G.colonne(k, [stat, phrase, regl, k.row([bouton1], { gap: "12px" }), contact], { poids: 1, base: "0px", min: "300px", gap: "26px", extra: { backgroundColor: TITANE, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "48px" }, mobile: { paddingLeft: "20px", paddingRight: "20px" } });
    const zone = G.bande(k, [lat, principal], { fond: TITANE, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Barre latérale et zone principale" });
    const reseaux = G.reseauxTexte([["YouTube", "https://www.youtube.com/"], ["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, poids: "700", couleur: BLANCG, survol: SIGNALC, focus: SIGNALC })(k, env);
    const mentions = G.ligneLegale({ taille: 13, couleur: "#c3ccd3", liens: BLANCG, sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, mentions], { fond: GRAPHITE, gap: "12px 40px", aligne: "center", padV: ["24px", "22px", "18px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Mentions" });
    bas.styles.desktop.color = BLANCG;
    return [G.racine(k, [zone, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Photo et vidéo", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : studio photo, photographe de mariage, production vidéo, imprimerie photo, drone.",
  models: [plancheContact, jourJModele, clapDeFin, reperesTirage, planDeVol],
};
