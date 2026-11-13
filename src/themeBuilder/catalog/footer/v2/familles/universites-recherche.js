// Famille v2 « Universités et recherche » — 6 modèles (ft2-374 à ft2-379), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Inspirations (idées de composition uniquement, aucune copie) : capture 28 (grille de cases à filets avec flèches), 29 (grande phrase à gauche, colonnes de liens à droite), 30 (formulaire sombre, mot géant en pied).
// Marques fictives ; AUCUNE coordonnée ni chiffre inventé : facultés, laboratoires et rubriques sont des intitulés d'EXEMPLE à renommer dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (case qui se remplit, bouton qui se soulève, carré qui respire, ligne qui noircit, lien qui se souligne, gradin qui s'avance).
const FAM = "universites-recherche";
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
// ft2-374 « Damier des facultés » — université   [archétype C : damier de 8 cases égales, chaque case est un lien ; capture 28 : grille de cases à filets fins, flèche à droite]
// Idée : la grille de cases bordées de la capture (une case = un lien + une flèche), traduite en damier 4 × 2 de facultés sur papier crème, filets bordeaux de 1 px entre les cases ; au survol la case se remplit de bordeaux (fond qui change doucement) et le libellé glisse.
// Facultés d'EXEMPLE à renommer dans l'éditeur. Polices : Libre Caslon Text (libellés) et Hanken Grotesk. Mobile : cases empilées.
const creme = identite({
  key: "c374", label: "Noir, crème et bordeaux", humeur: "dark",
  fond: "#0a0a0c", texte: "#f4efe6", discret: "#b8aea3", accent: "#e0566b", surface: "#16161a", encre: "#0a0a0c",
  police: "font.hanken-grotesk", titres: "font.libre-caslon-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f4efe633",
});
const CREME = "#f4efe6", BORD = "#7a1f2b", ENCRE1 = "#1d1a17";

const damierFacultes = modeleV2({
  id: identifiantV2(374, "damier-des-facultes"), concept: "c-374-damier-des-facultes",
  name: "Damier des facultés", family: FAM,
  description: "Pour une université : un damier de huit cases égales à angles droits, chacune est un lien vers une faculté avec sa flèche ; la case se remplit de bordeaux au survol. Papier crème, serif classique, adresse et mentions en dessous.",
  tags: ["université", "damier", "grille", "facultés", "crème", "bordeaux", "serif", "angles droits"],
  identity: creme,
  racine: racineDe("#0a0a0c"),
  widgets: ["sitetitle", "text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, N0 = "#0a0a0c", CR = "#f4efe6";
    const nom = nomDuSite(k, env, 20, CR, { fontWeight: "400", letterSpacing: "0.08em", textTransform: "uppercase" });
    const titre = G.geant(`<p>Là où le savoir<br>se prépare.</p>`, { taille: [38, 92], tablette: { taille: [40, 64] }, mobile: { taille: [34, 44] }, lh: 1.02, suivi: "-0.02em", poids: "400", police: S.head, couleur: CR, extra: { textAlign: "center" } })(k, env);
    const btn = lien(k, "Candidater", "/contact", { taille: 15, poids: "700", casse: "uppercase", suivi: "0.1em", couleur: N0, h: "52px", padH: "30px", survol: { backgroundColor: "#e0566b", color: "#ffffff", transform: { y: -3 } }, focus: "#e0566b", extra: { backgroundColor: CR, justifyContent: "center", alignSelf: "center" } });
    const tete = G.bande(k, [k.col([caps(k, "Enseignement supérieur", { couleur: "#e0566b", suivi: "0.24em" }), nom, titre, para(k, "Huit portes d'entrée vers les études, la recherche et la vie du campus.", { taille: 17, couleur: "#b8aea3", max: "460px", align: "center" }), btn], { alignItems: "center", gap: "22px", width: "100%" })], { fond: N0, colonne: true, padV: ["80px", "64px", "48px"], padB: ["0px", "0px", "0px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const marque = G.bande(k, [I.W(k, I.monogramme374(), { maxWidth: "760px", marginLeft: "auto", marginRight: "auto" })], { fond: N0, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Monogramme" });
    const case1 = (t, u) => lien(k, `${t}  →`, u, { taille: 20, poids: "400", police: S.head, couleur: CR, bloc: true, h: "132px", padH: "24px", survol: { color: "#ffffff", backgroundColor: BORD, transform: { x: 0 } }, focus: "#e0566b", extra: { backgroundColor: N0, alignItems: "flex-end", paddingBottom: "20px", boxSizing: "border-box", flexGrow: 1, flexBasis: "0px", minWidth: "200px", lineHeight: 1.15 } });
    const rang = (liste) => k.row(liste.map(([t, u]) => case1(t, u)), { gap: "1px", flexWrap: "wrap", width: "100%" });
    const grille = k.col([rang([["Lettres et langues", "/faq"], ["Sciences du vivant", "/faq"], ["Droit et sciences politiques", "/faq"], ["Médecine et santé", "/faq"]]), rang([["Économie et gestion", "/faq"], ["Arts et patrimoine", "/faq"], ["Ingénierie", "/faq"], ["Vie étudiante", "/blog"]])], { gap: "1px", width: "100%", backgroundColor: "#f4efe630", borderStyle: "solid", borderWidth: "1px", borderColor: "#f4efe630", boxSizing: "border-box" });
    const milieu = G.bande(k, [grille], { fond: N0, colonne: true, padV: ["0px", "0px", "0px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Damier" });
    const adresse = G.colonne(k, [coordonnees(k, { taille: 15, couleur: "#b8aea3", lien: CR, survol: "#e0566b", focus: "#e0566b" })], { poids: 1, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b8aea3", liens: CR })(k, env);
    const bas = G.bande(k, [adresse, G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { fond: N0, gap: "24px 40px", aligne: "flex-end", padV: ["0px", "0px", "0px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Adresse" });
    return [G.racine(k, [tete, marque, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-375 « Amphi et couloirs » — université   [archétype E : deux demi-pages bord à bord ; capture 29 : grande phrase à gauche, deux colonnes de liens à droite]
// Idée : la capture 29 coupée en deux : à gauche une demi-page bleu nuit (grande phrase, nom, appel « Candidater »), à droite une demi-page claire où se rangent deux colonnes de liens (Étudier, Chercher) et l'adresse. Aucune carte, aucun arrondi.
// Polices : Source Serif 4 (grande phrase) et DM Sans. Animation : le bouton se soulève et les liens glissent de 6 px. Mobile : les deux moitiés s'empilent.
const nuit = identite({
  key: "c375", label: "Bleu nuit et ocre", humeur: "dark",
  fond: "#12233f", texte: "#f3f5f9", discret: "#b9c5d8", accent: "#e8b04b", surface: "#1a3156", encre: "#12233f", surEncre: "#f3f5f9",
  police: "font.dm-sans", titres: "font.source-serif-4",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f3f5f940",
});
const NUIT = "#12233f", OCRE = "#e8b04b", PIERRE = "#efece4", ENCRE2 = "#12233f";

const amphiCouloirs = modeleV2({
  id: identifiantV2(375, "amphi-et-couloirs"), concept: "c-375-amphi-et-couloirs",
  name: "Amphi et couloirs", family: FAM,
  description: "Pour une université : deux demi-pages bord à bord. À gauche, bleu nuit, une grande phrase et l'appel à candidater ; à droite, pierre claire, deux colonnes de liens (étudier, chercher) et l'adresse. Sobre et académique.",
  tags: ["université", "deux moitiés", "bleu nuit", "ocre", "pierre", "serif", "angles droits"],
  identity: nuit,
  racine: racineDe(PIERRE),
  widgets: ["sitetitle", "text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 22, OCRE, { fontWeight: "700" });
    const phrase = G.geant(`<p>Apprendre à<br>penser, chercher,<br><span style="color:${OCRE}">transmettre.</span></p>`, { taille: [36, 76], tablette: { taille: [40, 60] }, mobile: { taille: [34, 42] }, lh: 1.06, suivi: "-0.015em", poids: "600", police: S.head, couleur: "#f3f5f9" })(k, env);
    const btn = lien(k, "Candidater", "/contact", { taille: 16, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: NUIT, h: "54px", padH: "30px", survol: { backgroundColor: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: OCRE, justifyContent: "center", alignSelf: "flex-start" } });
    const gauche = k.col([k.row([nom, caps(k, "Université", { couleur: "#b9c5d8" })], { gap: "16px", alignItems: "center", flexWrap: "wrap" }), phrase, I.W(k, I.amphi375(), { maxWidth: "520px" }), I.W(k, I.pastilles375(), { maxWidth: "260px" }), k.row([btn, lien(k, "Vie du campus", "/blog", { taille: 16, poids: "600", couleur: "#f3f5f9", survol: { color: OCRE, transform: { x: 6 } }, focus: OCRE })], { rowGap: "12px", columnGap: "28px", alignItems: "center" })], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "36px", justifyContent: "space-between", paddingTop: "80px", paddingBottom: "72px", paddingLeft: "64px", paddingRight: "56px", backgroundColor: NUIT, borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" });
    const liens1 = k.col(liensStd(k, ENCRE2, "#7a520c", [["Formations", "/faq"], ["Admissions", "/contact"], ["Vie du campus", "/blog"], ["Bibliothèques", "/faq"]], { taille: 18, poids: "500" }), { gap: "0px" });
    const liens2 = k.col(liensStd(k, ENCRE2, "#7a520c", [["Laboratoires", "/faq"], ["Publications", "/blog"], ["Doctorat", "/faq"], ["Partenariats", "/contact"]], { taille: 18, poids: "500" }), { gap: "0px" });
    const cols = G.ligne(k, [G.colonne(k, [caps(k, "Étudier", { couleur: "#7a520c" }), liens1], { poids: 1, min: "150px", gap: "8px" }), G.colonne(k, [caps(k, "Chercher", { couleur: "#7a520c" }), liens2], { poids: 1, min: "150px", gap: "8px" })], { gap: "24px 32px", aligne: "flex-start", largeur: "100%" });
    const adresse = coordonnees(k, { taille: 15, lien: ENCRE2, survol: "#7a520c", focus: ENCRE2, couleur: "#2b3a55" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3a4965", liens: ENCRE2 })(k, env);
    const droite = k.col([cols, adresse], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "44px", justifyContent: "space-between", paddingTop: "80px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "64px", backgroundColor: PIERRE, borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "40px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" });
    const corps = G.bande(k, [gauche, droite], { fond: PIERRE, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Deux moitiés" });
    const bas = G.bande(k, [mentions], { fond: PIERRE, colonne: true, padV: ["20px", "20px", "20px"], padB: ["24px", "24px", "24px"], padH: ["64px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: "#12233f33" }, nom: "Mentions" });
    bas.styles.desktop.color = ENCRE2;
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-376 « Guichet du chercheur » — centre de recherche   [archétype K : fenêtre / console ; capture 30 : formulaire sombre + liens en colonnes]
// Idée : le pied est une FENÊTRE de console à angles droits : barre de titre à trois carrés et nom de fichier, à gauche une liste de commandes-liens (> publications, > laboratoires…), à droite le formulaire « Recevoir les appels à projets » (widget e-mail). Un carré vert « respire » comme un curseur.
// Polices : JetBrains Mono et IBM Plex Sans. Intitulés d'exemple. Mobile : la fenêtre passe en une colonne.
const console1 = identite({
  key: "c376", label: "Noir console et vert phosphore", humeur: "dark",
  fond: "#0d1117", texte: "#e6edf3", discret: "#9aa7b4", accent: "#7ee787", surface: "#161b22", encre: "#0d1117", surEncre: "#e6edf3",
  police: "font.ibm-plex-sans", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#e6edf33a",
});
const CNOIR = "#0d1117", CFEN = "#161b22", PHOS = "#7ee787", CTXT = "#e6edf3";

const guichetChercheur = modeleV2({
  id: identifiantV2(376, "guichet-du-chercheur"), concept: "c-376-guichet-du-chercheur",
  name: "Guichet du chercheur", family: FAM,
  description: "Pour un centre de recherche : le pied prend la forme d'une fenêtre de console à angles droits, avec une liste de commandes-liens (publications, laboratoires, thèses, données) et un formulaire pour recevoir les appels à projets.",
  tags: ["recherche", "console", "fenêtre", "formulaire", "monospace", "noir", "vert", "angles droits"],
  identity: console1,
  racine: racineDe(CNOIR),
  widgets: ["sitetitle", "text", "link", "html", "emailsubscribe", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, mono = S.head;
    const barreTitre = k.row([k.row([carre(k, "#e6edf3", "10px"), carre(k, "#9aa7b4", "10px"), souffle(carre(k, PHOS, "10px"), 2800)], { gap: "8px", flexWrap: "nowrap", alignItems: "center" }), caps(k, "centre-de-recherche / guichet.sh", { police: mono, couleur: "#9aa7b4", suivi: "0.06em", taille: "12px", poids: "500" })], { gap: "18px", flexWrap: "nowrap", alignItems: "center", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: "#21262d", width: "100%", boxSizing: "border-box" });
    const cmd = (t, u) => lien(k, `> ${t}`, u, { taille: 18, poids: "500", police: mono, couleur: CTXT, survol: { color: PHOS, transform: { x: 6 } }, focus: PHOS });
    const commandes = G.colonne(k, [k.T(`<p>$ ls ./ressources</p>`, { fontSize: "14px", fontFamily: mono, color: PHOS, lineHeight: 1.4 }), cmd("publications", "/blog"), cmd("laboratoires", "/faq"), cmd("thèses", "/faq"), cmd("données-ouvertes", "/faq"), cmd("contacter-un-service", "/contact")], { poids: 1, min: "240px", gap: "2px" });
    const abo = lettre(k, env, G, { titre: "$ subscribe --appels-a-projets", intro: "Les appels à projets et les séminaires, par courriel.", bouton: "Envoyer", largeur: "420px", accent: PHOS, surBouton: CNOIR, texte: CTXT, couleurTitre: PHOS, fond: CFEN, survolBouton: CTXT, survolTexte: CNOIR, focus: CTXT, fondChamp: "#0d1117", rembChamp: "14px" });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, fontFamily: mono, textTransform: "none", letterSpacing: "0em", fontSize: "14px" };
    const corpsFen = k.row([commandes, k.col([k.col([], { width: "1px", height: "100%", minHeight: "160px", backgroundColor: "#e6edf33a" })], { alignSelf: "stretch" }), G.colonne(k, [abo, k.row([caps(k, "$ whoami", { police: mono, couleur: PHOS, suivi: "0em", taille: "13px", poids: "500" }), coordonnees(k, { taille: 14, lien: CTXT, survol: PHOS, focus: PHOS })], { gap: "16px", alignItems: "flex-start", flexWrap: "wrap" })], { poids: 1, min: "260px", gap: "28px" })], { rowGap: "32px", columnGap: "56px", alignItems: "flex-start", paddingTop: "36px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", width: "100%", boxSizing: "border-box" }, undefined, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "24px", paddingBottom: "24px" });
    const nom = nomDuSite(k, env, 22, CTXT, { fontFamily: mono, fontWeight: "700" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#9aa7b4", liens: CTXT })(k, env);
    const statut = k.col([trait(k, "#e6edf33a"), mentions], { gap: "14px", width: "100%", boxSizing: "border-box", paddingTop: "0px", paddingBottom: "20px", paddingLeft: "32px", paddingRight: "32px" }, undefined, { paddingLeft: "20px", paddingRight: "20px" });
    const fenetre = k.col([barreTitre, I.W(k, I.trace376()), k.row([nom], { paddingTop: "28px", paddingLeft: "32px", paddingRight: "32px", width: "100%", boxSizing: "border-box" }, undefined, { paddingLeft: "20px" }), corpsFen, statut], { width: "100%", backgroundColor: CFEN, borderStyle: "solid", borderWidth: "2px", borderColor: "#e6edf366", gap: "0px", borderRadius: "0px", boxSizing: "border-box" });
    const haut = G.bande(k, [fenetre], { fond: CNOIR, colonne: true, padV: ["72px", "56px", "40px"], padB: ["32px", "24px", "16px"], padH: ["48px", "32px", "20px"], nom: "Console" });
    const motBande = G.bande(k, [I.W(k, I.mot376(), { maxWidth: "1100px", marginLeft: "auto", marginRight: "auto" })], { fond: CNOIR, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["16px", "16px", "8px"], nom: "Mot en contour" });
    return [G.racine(k, [haut, motBande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-377 « Index des laboratoires » — institut de recherche   [archétype G : index en lignes pleine largeur ; capture 28 : libellé à gauche, flèche à droite, filets]
// Idée : cinq lignes pleine largeur en très gros caractères (un laboratoire par ligne, flèche à droite), séparées par des filets noirs sur jaune acide ; au survol la ligne se remplit de noir, le texte devient jaune et glisse. Aucune carte. Adresse et mentions en pied.
// Laboratoires d'EXEMPLE. Polices : Syne (800) et Inter Tight. Mobile : libellés réduits.
const acide = identite({
  key: "c377", label: "Jaune acide et noir", humeur: "light",
  fond: "#dff24a", texte: "#0b0b0b", discret: "#2f3300", accent: "#0b0b0b", surface: "#f0fa9a", encre: "#0b0b0b",
  police: "font.inter-tight", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#0b0b0b",
});
const ACID = "#dff24a", NOIR = "#0b0b0b";

const indexLabos = modeleV2({
  id: identifiantV2(377, "index-des-laboratoires"), concept: "c-377-index-des-laboratoires",
  name: "Index des laboratoires", family: FAM,
  description: "Pour un institut de recherche : cinq lignes pleine largeur en très gros caractères, un laboratoire par ligne avec sa flèche, séparées par des filets noirs sur jaune acide ; la ligne se remplit de noir au survol. Adresse et mentions en pied.",
  tags: ["institut", "recherche", "index", "lignes", "jaune acide", "noir", "grande typographie", "angles droits"],
  identity: acide,
  racine: racineDe(ACID),
  widgets: ["sitetitle", "text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 24, NOIR, { fontWeight: "800" });
    const tete = G.bande(k, [nom, caps(k, "Index des équipes", { couleur: NOIR, suivi: "0.24em" })], { fond: ACID, gap: "12px 40px", aligne: "center", padV: ["56px", "44px", "32px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const ligneIdx = (t, u) => {
      const a = lien(k, `${t}  →`, u, { taille: 56, poids: "800", police: S.head, couleur: NOIR, bloc: true, h: "104px", padH: "16px", survol: { backgroundColor: NOIR, color: ACID, transform: { x: 0 } }, focus: NOIR, extra: { width: "100%", boxSizing: "border-box", lineHeight: 1, letterSpacing: "-0.02em", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: NOIR } });
      a.styles.mobile = { ...(a.styles.mobile || {}), fontSize: "26px", minHeight: "72px" };
      a.styles.tablet = { ...(a.styles.tablet || {}), fontSize: "40px" };
      return a;
    };
    const index = k.col([ligneIdx("Chimie des matériaux", "/faq"), ligneIdx("Neurosciences", "/faq"), ligneIdx("Humanités numériques", "/faq"), ligneIdx("Climat et océans", "/faq"), ligneIdx("Mathématiques", "/faq")], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: NOIR });
    const titre377 = G.bande(k, [k.col([G.geant(`<p>Chercher,<br>trouver, partager.</p>`, { taille: [40, 104], tablette: { taille: [44, 72] }, mobile: { taille: [36, 46] }, lh: 0.98, suivi: "-0.03em", poids: "800", police: S.head, couleur: NOIR, extra: { textAlign: "center" } })(k, env), I.W(k, I.atome377(), { maxWidth: "820px", marginLeft: "auto", marginRight: "auto" })], { alignItems: "center", gap: "8px", width: "100%" })], { fond: ACID, colonne: true, padV: ["8px", "8px", "4px"], padB: ["8px", "8px", "8px"], padH: ["48px", "32px", "20px"], nom: "Marque" });
    const milieu = G.bande(k, [index], { fond: ACID, colonne: true, padV: ["0px", "0px", "0px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Index" });
    const adresse = G.colonne(k, [coordonnees(k, { taille: 15, lien: NOIR, survol: NOIR, focus: NOIR })], { poids: 1, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#2f3300", liens: NOIR })(k, env);
    const bas = G.bande(k, [adresse, G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { fond: ACID, gap: "24px 40px", aligne: "flex-end", padV: ["0px", "0px", "0px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Adresse" });
    return [G.racine(k, [tete, titre377, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-378 « Annales » — école doctorale   [archétype B : nom monumental, très peu de liens, grand vide ; capture 30 : nom géant en bas de pied, filet de contour]
// Idée : comme le mot géant « CHECK ME » en pied de la capture 30 : le mot « ANNALES » démesuré, rogné par le bas du pied, lilas sur violet profond. Au-dessus, seulement trois liens et une phrase courte, à gauche. Pas de colonnes, pas de lettre.
// Polices : Anton (mot géant) et DM Sans. Animation : les trois liens se soulignent d'un trait qui s'étire et glissent de 4 px. Mobile : le mot se réduit, il reste rogné.
const violet = identite({
  key: "c378", label: "Violet profond et lilas", humeur: "dark",
  fond: "#2a1458", texte: "#f4effe", discret: "#cbbcf0", accent: "#c9b6ff", surface: "#34196b", encre: "#2a1458", surEncre: "#f4effe",
  police: "font.dm-sans", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f4effe40",
});
const VIOL = "#2a1458", LILAS = "#c9b6ff", VIOL2 = "#1d0d40";

const annales = modeleV2({
  id: identifiantV2(378, "annales"), concept: "c-378-annales",
  name: "Annales monumentales", family: FAM,
  description: "Pour une école doctorale : le mot « Annales » démesuré, lilas sur violet profond, rogné par le bas du pied ; au-dessus seulement trois liens (thèses, soutenances, contact) et une phrase courte. Très peu de texte, beaucoup d'air.",
  tags: ["école doctorale", "nom monumental", "violet", "lilas", "peu de liens", "grand vide", "angles droits"],
  identity: violet,
  racine: racineDe(VIOL2),
  widgets: ["sitetitle", "text", "link", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 20, "#f4effe", { fontWeight: "400", fontFamily: S.head, letterSpacing: "0.04em" });
    const phrase = para(k, "Former à la recherche, accompagner jusqu'à la soutenance.", { taille: 20, couleur: "#f4effe", max: "420px", lh: 1.4 });
    const l = (t, u) => {
      const a = lien(k, t, u, { taille: 17, poids: "700", casse: "uppercase", suivi: "0.12em", couleur: "#f4effe", survol: { color: LILAS, transform: { x: 4 } }, focus: LILAS, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#f4effe55", paddingBottom: "0px" } });
      return a;
    };
    const liens = k.col([l("Thèses", "/blog"), l("Soutenances", "/faq"), l("Contact", "/contact")], { gap: "6px", alignItems: "flex-start" });
    const haut = G.bande(k, [G.colonne(k, [nom, phrase], { poids: 2, min: "280px", gap: "24px" }), G.colonne(k, [liens], { poids: 1, min: "200px" })], { fond: VIOL, gap: "40px 48px", aligne: "flex-start", padV: ["88px", "72px", "48px"], padB: ["56px", "48px", "32px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    const mot = G.nomRogne("ANNALES", { taille: [64, 200], visible: 0.7, poids: "400", suivi: "0em", couleur: LILAS, police: S.head })(k);
    const orbe = G.bande(k, [I.W(k, I.orbe378())], { fond: VIOL, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Orbe" });
    const grand = G.bande(k, [mot], { fond: "#3b1d7a", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["48px", "32px", "20px"], max: "1920px", nom: "Mot géant" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cbbcf0", liens: "#f4effe" })(k, env);
    const bas = G.bande(k, [mentions], { fond: VIOL2, colonne: true, padV: ["28px", "48px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    bas.styles.desktop.color = "#f4effe";
    return [G.racine(k, [haut, orbe, grand, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-379 « Gradins du savoir » — bibliothèque universitaire   [archétype L : pied étagé, bandes de largeurs décroissantes alignées à gauche ; capture 28 : colonnes de liens sous un bandeau]
// Idée : quatre bandes alignées à gauche, de plus en plus étroites comme des gradins d'amphithéâtre (100 %, 78 %, 56 %, 34 %) : le nom et la phrase, les liens des services, les coordonnées, les mentions ; teintes de turquoise de plus en plus claires ; chaque bande s'avance au survol.
// Polices : Fira Sans Condensed et Fira Sans. Mobile : les gradins deviennent pleine largeur.
const gradins = identite({
  key: "c379", label: "Turquoise étagé", humeur: "dark",
  fond: "#0b4f4a", texte: "#effffc", discret: "#bfe7e1", accent: "#ffd27a", surface: "#0f6a63", encre: "#0b4f4a", surEncre: "#effffc",
  police: "font.fira-sans", titres: "font.fira-sans-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#effffc40",
});
const T1 = "#073a36", T2 = "#0b4f4a", T3 = "#0e5f59", T4 = "#8fdcd2", FOND4 = "#e6fffb";

const gradinsSavoir = modeleV2({
  id: identifiantV2(379, "gradins-du-savoir"), concept: "c-379-gradins-du-savoir",
  name: "Gradins du savoir", family: FAM,
  description: "Pour une bibliothèque universitaire : un pied étagé en quatre bandes alignées à gauche, de plus en plus étroites comme des gradins d'amphithéâtre (nom, services, coordonnées, mentions), dans des turquoises de plus en plus clairs.",
  tags: ["bibliothèque", "université", "étagé", "gradins", "turquoise", "condensé", "angles droits"],
  identity: gradins,
  racine: racineDe(FOND4),
  widgets: ["sitetitle", "text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const etage = (largeur, fond, enfants, extra = {}) => k.col(enfants, { width: largeur, maxWidth: "100%", backgroundColor: fond, boxSizing: "border-box", gap: "20px", paddingLeft: "48px", paddingRight: "48px", borderRadius: "0px", transitionDuration: DOUX, ...extra }, { paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px" });
    const nom = nomDuSite(k, env, 40, "#effffc", { fontFamily: S.head, fontWeight: "600" });
    nom.styles.desktop.fontSize = "fluid:30-52";
    const e1 = etage("100%", T1, [caps(k, "Bibliothèque universitaire", { couleur: "#ffd27a", suivi: "0.24em" }), nom, para(k, "Collections, salles de travail et accompagnement à la recherche documentaire.", { taille: 17, couleur: "#bfe7e1", max: "520px" })], { paddingTop: "64px", paddingBottom: "40px" });
    const serv = (t, u) => lien(k, t, u, { taille: 18, poids: "500", couleur: "#effffc", survol: { color: "#ffd27a", transform: { x: 6 } }, focus: "#ffd27a" });
    const e2 = etage("78%", T2, [G.ligne(k, [G.ligne(k, [serv("Catalogue", "/faq"), serv("Salles de travail", "/faq")], { gap: "0px 36px", aligne: "center" }), G.ligne(k, [serv("Prêt entre bibliothèques", "/contact"), serv("Se former", "/blog")], { gap: "0px 36px", aligne: "center" })], { gap: "0px 56px", aligne: "center", largeur: "100%" })], { paddingTop: "28px", paddingBottom: "28px" });
    e2.states = { hover: { width: "82%" } };
    const e3 = etage("56%", T3, [k.row([caps(k, "Nous trouver", { couleur: "#ffd27a", suivi: "0.2em" }), coordonnees(k, { taille: 15, lien: "#effffc", survol: "#ffd27a", focus: "#ffd27a" })], { rowGap: "12px", columnGap: "40px", alignItems: "flex-start", width: "100%" })], { paddingTop: "32px", paddingBottom: "32px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#255a55", liens: "#06302d" })(k, env);
    const e4 = etage("34%", T4, [lien(k, "Nous écrire  →", "/contact", { taille: 18, poids: "700", couleur: "#06302d", survol: { color: "#ffffff", backgroundColor: "#06302d" }, focus: "#06302d", padH: "12px", extra: { alignSelf: "flex-start" } })], { paddingTop: "24px", paddingBottom: "24px" });
    e4.styles.tablet = { ...(e4.styles.tablet || {}), width: "56%" };
    const pile = k.col([e1, e2, e3, e4], { width: "100%", gap: "0px", alignItems: "flex-start", backgroundColor: FOND4 });
    const fin = G.bande(k, [mentions], { fond: FOND4, colonne: true, padV: ["24px", "20px", "20px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    fin.styles.desktop.color = "#06302d";
    const gradinsBande = G.bande(k, [pile], { fond: FOND4, colonne: true, aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Gradins" });
    const hero = G.bande(k, [I.W(k, I.escalier379(), { maxWidth: "780px", marginLeft: "auto", marginRight: "auto" })], { fond: "#073a36", colonne: true, padV: ["24px", "16px", "8px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Escalier" });
    return [G.racine(k, [hero, gradinsBande, fin])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Universités et recherche", target: 6, built: true,
  description: "Pieds d'universités et de centres de recherche, à angles droits : damier de facultés, deux demi-pages, console, index de laboratoires, nom monumental, gradins étagés.",
  models: [damierFacultes, amphiCouloirs, guichetChercheur, indexLabos, annales, gradinsSavoir],
};
