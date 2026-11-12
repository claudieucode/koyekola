// Famille v2 « Aéronautique et spatial » — 6 modèles (ft2-422 à ft2-427), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Inspirations (idées de composition seulement, aucune copie) : capture 40 = grand nom sur deux tons + lettre d'information à gauche, colonnes de liens à droite, filet puis ligne de copyright et réseaux ;
// capture 41 = bandeau marque + réseaux, filet pleine largeur, colonnes à petit soulignement d'accent, colonne d'abonnement, bande sombre de mentions.
// Marques fictives (Aérodyne, Orbite, Aeroline…) ; AUCUNE coordonnée, chiffre, certification ni date inventés : adresse, téléphone et horaires viennent des Données de l'entreprise du site.
// Liens et libellés d'EXEMPLE à renommer dans l'éditeur. Chaque modèle : palette, polices (2 au plus) et archétype de composition propres (mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, décalages de 2 à 6 px ; UNE animation visible par modèle (carré-signal qui « respire », case qui se soulève).
// Ni animation d'entrée ni défilement continu.
const FAM = "aeronautique-spatial";
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
const filetC = (k, couleur, l = "28px", e = "3px") => k.divider({ width: l, borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px" });
const reseauxEx = [["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"]];
// Colonne de liens : titre en capitales, petit filet d'accent, liens qui s'indentent au survol
const colLiens = (k, titre, items, o) => k.col([caps(k, titre, { couleur: o.titre, suivi: "0.16em", taille: "13px", police: o.policeTitre }), filetC(k, o.filet || o.titre), ...items.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.lien, survol: { color: o.survol, paddingLeft: "6px" }, focus: o.survol }))], { flexGrow: 1, flexBasis: o.base || "160px", minWidth: o.min || "140px", gap: "6px" });

// ═══ ft2-422 « Tour de contrôle » — aéronautique  [archétype A : colonne latérale pleine hauteur]
// Idée : une colonne AMBRE pleine hauteur à gauche (nom en Exo 2, signal qui « respire », lettre technique) et, à droite sur marine profond, quatre colonnes de liens à petit filet d'accent puis réseaux et mentions.
// Marine, ambre, blanc glacé. Polices : Exo 2 (titres) et IBM Plex Sans (texte). Mobile : la colonne passe au-dessus.
const NAV = "#0e1a3d", AMB = "#f5b301", GLACE = "#eef2fb", NAV2 = "#14224d";
const tourId = identite({ key: "c422", label: "Marine profond et ambre", humeur: "dark", fond: NAV, texte: GLACE, discret: "#b5c0dd", accent: AMB, surface: NAV2, encre: NAV, surEncre: GLACE, police: "font.ibm-plex-sans", titres: "font.exo-2", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#eef2fb4d" });
const tour = modeleV2({
  id: identifiantV2(422, "tour-de-controle"), concept: "c-422-tour-de-controle", name: "Tour de contrôle", family: FAM,
  description: "Pour un constructeur ou un bureau d'études aéronautique : grande colonne ambre pleine hauteur avec nom et lettre technique, quatre colonnes de liens à petit filet sur marine profond, réseaux et mentions.",
  tags: ["aéronautique", "bureau d'études", "colonne latérale", "lettre", "marine", "ambre", "ingénierie"],
  identity: tourId, racine: racineDe(NAV),
  widgets: ["text", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>AÉRO<br>DYNE</p>`, { taille: [44, 72], tablette: { taille: [60, 84] }, mobile: { taille: [48, 64] }, lh: 0.95, suivi: "0.02em", poids: "800", police: S.head, couleur: NAV })(k, env);
    const signal = k.row([souffle(carre(k, NAV, "12px"), 3200), caps(k, "Pôle aéronautique", { couleur: NAV, suivi: "0.22em", poids: "800" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const abo = lettre(k, env, { titre: "Lettre technique", intro: "Publications et actualités du bureau d'études, de temps en temps.", largeur: "280px", accent: NAV, texte: NAV, couleurTitre: NAV, couleurIntro: "#1c2a55", surBouton: AMB, survolBouton: "#ffffff", surSurvol: NAV });
    const colonne = k.col([signal, nom, para(k, "Conception, essais et maintenance d'aéronefs.", { taille: 16, couleur: "#1c2a55", max: "260px" }), abo], { flexGrow: 0, flexShrink: 0, flexBasis: "360px", minWidth: "280px", gap: "26px", justifyContent: "flex-start", backgroundColor: AMB, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "44px", paddingRight: "40px", borderRadius: "0px" }, { flexBasis: "100%" }, { flexBasis: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" });
    const o = { titre: AMB, lien: GLACE, survol: AMB, base: "120px", min: "110px" };
    const cols = k.row([
      colLiens(k, "Programmes", [["Aéronefs", "/catalogue"], ["Systèmes embarqués", "/catalogue"], ["Maintenance", "/faq"], ["Essais en vol", "/blog"]], o),
      colLiens(k, "Entreprise", [["Qui nous sommes", "/"], ["Engagements", "/faq"], ["Presse", "/blog"], ["Contact", "/contact"]], o),
      colLiens(k, "Carrières", [["Métiers", "/blog"], ["Stages", "/faq"], ["Candidature", "/contact"]], o),
      colLiens(k, "Ressources", [["Documentation", "/blog"], ["Assistance", "/faq"], ["Espace client", "/contact"]], o),
      colLiens(k, "Suivre", reseauxEx.map(([t, u]) => [t, u]), o),
    ], { width: "100%", rowGap: "32px", columnGap: "24px", alignItems: "flex-start" });
    const adresse = coordonnees(k, { layout: "inline", couleur: "#b5c0dd", lien: GLACE, survol: AMB, focus: AMB, taille: 14 });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b5c0dd", liens: GLACE, sansCookies: true })(k, env);
    const principal = k.col([cols, adresse, mentions], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "32px", justifyContent: "center", paddingTop: "64px", paddingBottom: "36px", paddingLeft: "56px", paddingRight: "48px", backgroundColor: NAV, borderRadius: "0px" }, undefined, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", gap: "24px" });
    const corps = G.bande(k, [colonne, principal], { fond: NAV, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Colonne et liens" });
    corps.styles.desktop.color = GLACE;
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═══ ft2-423 « Orbite silencieuse » — spatial  [archétype B : nom monumental seul au centre]
// Idée : presque rien. Un nom géant en deux tons (capture 40) centré sur noir profond, un carré orange qui « respire » au-dessus, trois liens, une ligne de mentions. Grand vide.
// Noir, ivoire, orange fusée. Polices : Syncopate (nom) et Space Grotesk (texte). Mobile : le nom rétrécit, les liens s'empilent.
const NOIR = "#07070a", IVOIRE = "#f1efe8", FUSEE = "#ff5a1f";
const orbiteId = identite({ key: "c423", label: "Noir profond, ivoire et orange fusée", humeur: "dark", fond: NOIR, texte: IVOIRE, discret: "#b9b7ae", accent: FUSEE, surface: "#101015", encre: NOIR, surEncre: IVOIRE, police: "font.space-grotesk", titres: "font.syncopate", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f1efe84d" });
const orbite = modeleV2({
  id: identifiantV2(423, "orbite-silencieuse"), concept: "c-423-orbite-silencieuse", name: "Orbite silencieuse", family: FAM,
  description: "Pour une entreprise spatiale ou un lanceur : un nom monumental en deux tons au centre d'un grand vide noir, un carré orange qui respire, trois liens et une ligne de mentions. Noir, ivoire, orange fusée.",
  tags: ["spatial", "lanceur", "nom monumental", "minimal", "noir", "orange", "centré"],
  identity: orbiteId, racine: racineDe(NOIR),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const signal = souffle(carre(k, FUSEE, "14px"), 3600);
    const nom = G.geant(`<p style="text-align:center">ORBI<span style="color:${FUSEE}">TE</span></p>`, { taille: [64, 150], tablette: { taille: [70, 110] }, mobile: { taille: [40, 56] }, lh: 1, suivi: "0.02em", poids: "700", police: S.head, couleur: IVOIRE })(k, env);
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b9b7ae", liens: IVOIRE, sansCookies: true })(k, env, true);
    const liensCol = k.col(["Lanceurs", "Missions", "Contact"].map((t, i) => lien(k, t, ["/catalogue", "/blog", "/contact"][i], { taille: 15, poids: "600", casse: "uppercase", suivi: "0.2em", couleur: IVOIRE, padH: "10px", survol: { color: FUSEE, transform: { x: 4 } }, focus: FUSEE })), { gap: "0px", alignItems: "center" });
    const bas = k.row([signal, mentions], { rowGap: "20px", columnGap: "32px", justifyContent: "center", alignItems: "center" });
    const bande = G.bande(k, [caps(k, "Accès à l'espace, sans bruit", { couleur: "#b9b7ae", suivi: "0.3em" }), nom, liensCol, bas], { fond: NOIR, colonne: true, aligne: "center", gap: "36px", padV: ["120px", "88px", "64px"], padB: ["56px", "44px", "36px"], padH: MARGES, nom: "Nom monumental" });
    bande.styles.desktop.color = IVOIRE; bande.styles.desktop.textAlign = "center";
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-424 « Tableau des départs » — aviation commerciale  [archétype C : damier de huit cases]
// Idée : un tableau d'affichage de gare aérienne : titre en capitales condensées puis huit cases égales à angles droits séparées par un joint noir ; quatre cases-liens colorées (acier, blanc, rouge, acier foncé)
// qui se soulèvent, et quatre cases d'information (adresse, horaires, lettre, mentions). Papier, acier, rouge signal. Polices : Barlow Condensed (titres) et Barlow (texte). Mobile : une case par ligne.
const PAP = "#eef1f4", ACIER = "#1d3b5c", ROUGE = "#c8321c", ENCRE = "#0f1722";
const departsId = identite({ key: "c424", label: "Papier, acier et rouge signal", humeur: "light", fond: PAP, texte: ENCRE, discret: "#3f4a58", accent: ROUGE, surface: "#ffffff", encre: ENCRE, surEncre: PAP, police: "font.barlow", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#0f17224d" });
const departs = modeleV2({
  id: identifiantV2(424, "tableau-des-departs"), concept: "c-424-tableau-des-departs", name: "Tableau des départs", family: FAM,
  description: "Pour une compagnie ou un aéroport : damier de huit cases carrées (flotte, maintenance, formation, carrières, adresse, horaires, lettre, mentions) comme un tableau d'affichage. Papier, acier, rouge signal.",
  tags: ["aviation", "compagnie aérienne", "aéroport", "damier", "cases", "acier", "rouge"],
  identity: departsId, racine: racineDe(PAP),
  widgets: ["text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Tableau des départs<span style="color:${ROUGE}">.</span></p>`, { taille: [40, 96], tablette: { taille: [52, 72] }, mobile: { taille: [36, 46] }, lh: 1, suivi: "0.01em", poids: "800", police: S.head, couleur: ENCRE, extra: { textTransform: "uppercase" } })(k, env);
    const base = { flexGrow: 1, flexBasis: "22%", minWidth: "200px" };
    const caseLien = (t, n, u, fond, fg, sv) => lien(k, `${n}  ${t}`, u, { taille: 26, poids: "800", police: S.head, casse: "uppercase", suivi: "0.02em", couleur: fg, bloc: true, h: "170px", padH: "22px", survol: { backgroundColor: sv, color: "#ffffff", transform: { y: -5 } }, focus: sv, extra: { ...base, backgroundColor: fond, alignItems: "flex-end", paddingBottom: "18px", boxSizing: "border-box" } });
    const caseInfo = (fond, enfants) => k.col(enfants, { ...base, minHeight: "170px", backgroundColor: fond, paddingTop: "18px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px", gap: "8px", boxSizing: "border-box", borderRadius: "0px" });
    const abo = lettre(k, env, { titre: "", intro: "La lettre des départs.", largeur: "100%", accent: ACIER, texte: ENCRE, couleurIntro: "#3f4a58", surBouton: "#ffffff", survolBouton: ROUGE, surSurvol: "#ffffff" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#3f4a58", liens: ENCRE, sansCookies: true, pile: true })(k, env);
    const damier = k.row([
      caseLien("Flotte", "01", "/catalogue", ACIER, "#ffffff", ROUGE),
      caseLien("Maintenance", "02", "/faq", "#ffffff", ENCRE, ACIER),
      caseLien("Formation", "03", "/blog", ROUGE, "#ffffff", ENCRE),
      caseLien("Carrières", "04", "/contact", "#12263d", "#ffffff", ROUGE),
      caseInfo("#ffffff", [caps(k, "Adresse", { couleur: "#a52713", poids: "800" }), coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: ROUGE, focus: ROUGE, taille: 15 })]),
      caseInfo("#e0e5ea", [caps(k, "Horaires", { couleur: "#a52713", poids: "800" }), horaires(k, { couleur: ENCRE, taille: 15 })]),
      caseInfo("#ffffff", [caps(k, "Lettre", { couleur: "#a52713", poids: "800" }), abo]),
      caseInfo("#e0e5ea", [caps(k, "Mentions", { couleur: "#a52713", poids: "800" }), mentions]),
    ], { width: "100%", gap: "4px", backgroundColor: ENCRE, padding: "4px", boxSizing: "border-box", alignItems: "stretch", borderRadius: "0px" });
    const bande = G.bande(k, [titre, damier], { fond: PAP, colonne: true, aligne: "stretch", gap: "32px", padV: ["64px", "48px", "36px"], padB: ["56px", "44px", "32px"], padH: MARGES, nom: "Damier" });
    bande.styles.desktop.color = ENCRE;
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-425 « Plan de vol compact » — compagnie  [archétype D : barre unique inversée]
// Idée : tout tient sur DEUX lignes de bleu cobalt : la ligne de cap (carré jaune qui respire, nom, cinq liens, réseaux) et la ligne de service (adresse en ligne et mentions). Aucune colonne, aucune lettre.
// Cobalt, jaune, blanc. Polices : Space Grotesk (titres et texte) et IBM Plex Mono (petites mentions). Mobile : nom, liens en colonne, réseaux, mentions.
const COB = "#1b3fd8", COB2 = "#1432ad", JAUNE = "#ffe14d";
const planId = identite({ key: "c425", label: "Cobalt, jaune et blanc", humeur: "dark", fond: COB, texte: "#ffffff", discret: "#dbe2ff", accent: JAUNE, surface: COB2, encre: COB, surEncre: "#ffffff", police: "font.ibm-plex-mono", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#ffffff66" });
const plan = modeleV2({
  id: identifiantV2(425, "plan-de-vol-compact"), concept: "c-425-plan-de-vol-compact", name: "Plan de vol compact", family: FAM,
  description: "Pour un aéroclub ou une compagnie régionale : pied sur deux lignes seulement, nom, cinq liens et réseaux sur la ligne de cap, adresse et mentions sur la ligne de service. Cobalt, jaune, blanc.",
  tags: ["aéroclub", "compagnie régionale", "compact", "barre", "cobalt", "jaune", "une ligne"],
  identity: planId, racine: racineDe(COB2),
  widgets: [ "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marque = lien(k, "AEROLINE", "/", { taille: 28, poids: "700", police: S.head, suivi: "0.04em", couleur: "#ffffff", survol: { color: JAUNE }, focus: JAUNE });
    const items = [["Flotte", "/catalogue"], ["Services", "/faq"], ["Sécurité", "/faq"], ["Carrières", "/blog"], ["Contact", "/contact"]];
    const enfants = [];
    items.forEach(([t, u], i) => { if (i) enfants.push(i === 1 ? souffle(carre(k, JAUNE, "8px"), 3000) : carre(k, "#ffffff80", "8px")); enfants.push(lien(k, t, u, { taille: 16, poids: "600", police: S.head, couleur: "#ffffff", padH: "10px", survol: { color: JAUNE, transform: { y: -2 } }, focus: JAUNE })); });
    const navs = k.row(enfants, { rowGap: "0px", columnGap: "6px", alignItems: "center" });
    const adresse = coordonnees(k, { layout: "inline", couleur: "#dbe2ff", lien: "#ffffff", survol: JAUNE, focus: JAUNE, taille: 13 });
    const mentions = G.ligneLegale({ taille: 12, couleur: "#dbe2ff", liens: "#ffffff", sansCookies: true })(k, env);
    const cap = G.bande(k, [marque, navs, G.reseauxTexte(reseauxEx.slice(0, 2), { taille: 14, couleur: "#ffffff", survol: JAUNE, focus: JAUNE })(k, env)], { fond: COB, gap: "8px 48px", aligne: "center", padV: ["36px", "30px", "24px"], padB: ["24px", "22px", "18px"], padH: MARGES, nom: "Ligne de cap" });
    const service = G.bande(k, [k.col([adresse, mentions], { width: "100%", gap: "4px" })], { fond: COB2, colonne: true, aligne: "center", padV: ["16px", "14px", "14px"], padB: ["22px", "18px", "16px"], padH: MARGES, nom: "Ligne de service" });
    cap.styles.desktop.color = "#ffffff"; service.styles.desktop.color = "#ffffff";
    return [G.racine(k, [cap, service])];
  },
}, FAM);

// ═══ ft2-426 « Ciel et nuit » — constructeur  [archétype E : deux demi-pages bord à bord]
// Idée : à gauche, la demi-page CIEL (bleu pâle) : grande phrase en Instrument Serif et coordonnées ; à droite, la demi-page NUIT (bleu-nuit) : cinq grandes lignes-liens à filet, lettre (capture 40) et réseaux.
// Une fine bande nuit en bas porte les mentions. Ciel, nuit, vermillon. Polices : Instrument Serif (titres) et Hanken Grotesk (texte). Mobile : les deux moitiés s'empilent.
const CIEL = "#dce8f2", NUIT = "#0a1128", VERM = "#ff6a3d", ENC2 = "#0a1128";
const cielId = identite({ key: "c426", label: "Ciel pâle, nuit et vermillon", humeur: "dark", fond: NUIT, texte: "#eaf1fa", discret: "#b6c3d8", accent: VERM, surface: "#121c3d", encre: NUIT, surEncre: CIEL, police: "font.hanken-grotesk", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#eaf1fa4d" });
const cielNuit = modeleV2({
  id: identifiantV2(426, "ciel-et-nuit"), concept: "c-426-ciel-et-nuit", name: "Ciel et nuit", family: FAM,
  description: "Pour un constructeur aéronautique : deux demi-pages bord à bord, ciel pâle avec grande phrase et coordonnées, nuit avec cinq grandes lignes de liens, lettre et réseaux. Ciel, nuit, vermillon.",
  tags: ["constructeur", "deux moitiés", "grande phrase", "lettre", "bleu nuit", "vermillon", "serif"],
  identity: cielId, racine: racineDe(NUIT),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>La rigueur d'un métier, la liberté du ciel<span style="color:#c4411a">.</span></p>`, { taille: [34, 62], lh: 1.08, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENC2 })(k, env);
    const gauche = k.col([caps(k, "Constructeur aéronautique", { couleur: "#8f2f12", suivi: "0.22em", poids: "800" }), phrase, trait(k, "#0a11284d"), coordonnees(k, { couleur: ENC2, lien: ENC2, survol: "#8f2f12", focus: "#8f2f12", taille: 16 })], { flexGrow: 1, flexBasis: "50%", minWidth: "300px", gap: "28px", justifyContent: "center", backgroundColor: CIEL, paddingTop: "72px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, { flexBasis: "100%" }, { flexBasis: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px", paddingBottom: "44px" });
    const gros = (t, u) => lien(k, t, u, { taille: 40, poids: "400", police: S.head, couleur: "#eaf1fa", h: "60px", padH: "0px", survol: { color: VERM, paddingLeft: "10px" }, focus: VERM, extra: { flexBasis: "46%", flexGrow: 1 } });
    const abo = lettre(k, env, { titre: "Lettre du constructeur", intro: "Une nouvelle de temps en temps.", largeur: "360px", accent: VERM, texte: "#eaf1fa", couleurTitre: VERM, couleurIntro: "#b6c3d8", surBouton: NUIT, survolBouton: "#eaf1fa", surSurvol: NUIT });
    const droite = k.col([abo, k.row([gros("Appareils", "/catalogue"), gros("Services", "/faq"), gros("Recherche", "/blog"), gros("Carrières", "/blog"), gros("Contact", "/contact")], { width: "100%", rowGap: "4px", columnGap: "24px" }), G.reseauxTexte(reseauxEx, { taille: 15, couleur: "#eaf1fa", survol: VERM, focus: VERM })(k, env)], { flexGrow: 1, flexBasis: "50%", minWidth: "300px", gap: "34px", justifyContent: "center", backgroundColor: NUIT, paddingTop: "56px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, { flexBasis: "100%" }, { flexBasis: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "36px" });
    const moitie = G.bande(k, [gauche, droite], { fond: NUIT, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Ciel et nuit" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b6c3d8", liens: "#eaf1fa", sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: "#060b1c", colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGES, nom: "Mentions" });
    moitie.styles.desktop.color = "#eaf1fa"; bas.styles.desktop.color = "#eaf1fa";
    return [G.racine(k, [moitie, bas])];
  },
}, FAM);

// ═══ ft2-427 « Compte à rebours » — lancement  [archétype F : bandeau d'appel XXL + colonne étroite à droite]
// Idée : un bandeau d'appel GÉANT violet (« Décollons ensemble. » en Big Shoulders, jusqu'à 170 px, bouton lime qui respire), puis dessous une bande plus sombre : à gauche l'adresse et les horaires,
// à droite UNE colonne étroite de liens à flèche, bordée d'une barre lime. Pas de lettre. Violet, lime, lavande. Polices : Big Shoulders (titres) et DM Sans (texte). Mobile : bandeau, coordonnées, liens.
const VIO = "#2a1166", VIO2 = "#1d0b4a", LIME = "#c8ff3d", LAV = "#f3eeff";
const rebourId = identite({ key: "c427", label: "Violet, lime et lavande", humeur: "dark", fond: VIO, texte: LAV, discret: "#d3c7f5", accent: LIME, surface: VIO2, encre: VIO, surEncre: LAV, police: "font.dm-sans", titres: "font.big-shoulders", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f3eeff4d" });
const rebours = modeleV2({
  id: identifiantV2(427, "compte-a-rebours"), concept: "c-427-compte-a-rebours", name: "Compte à rebours", family: FAM,
  description: "Pour une start-up spatiale ou un service de lancement : bandeau d'appel géant avec bouton lime, puis bande sombre avec adresse, horaires et une colonne étroite de liens à flèche. Violet, lime, lavande.",
  tags: ["lancement", "start-up spatiale", "appel à l'action", "bandeau géant", "violet", "lime", "colonne étroite"],
  identity: rebourId, racine: racineDe(VIO2),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>DÉCOLLONS<br><span style="color:${LIME}">ENSEMBLE.</span></p>`, { taille: [56, 170], tablette: { taille: [64, 110] }, mobile: { taille: [52, 76] }, lh: 0.92, suivi: "0.005em", poids: "800", police: S.head, couleur: LAV })(k, env);
    const b = souffle(bouton(k, "Parler à l'équipe", "/contact", { texte: VIO2, fond: LIME, survol: { backgroundColor: LAV, borderColor: LAV, color: VIO2, transform: { y: -4 } }, focus: LAV, taille: 18, extra: { minHeight: "64px", paddingLeft: "36px", paddingRight: "36px" } }), 3800);
    const haut = G.bande(k, [caps(k, "Lancements et services", { couleur: LIME, suivi: "0.26em" }), phrase, k.row([b, para(k, "Étude de mission, intégration et campagne de lancement.", { taille: 18, couleur: "#d3c7f5", max: "320px" })], { rowGap: "20px", columnGap: "32px", alignItems: "center" })], { fond: VIO, colonne: true, aligne: "stretch", gap: "26px", padV: ["88px", "64px", "44px"], padB: ["72px", "56px", "44px"], padH: MARGES, nom: "Appel" });
    const num = (i, t, u) => lien(k, `${i}   ${t}`, u, { taille: 19, poids: "700", couleur: LAV, survol: { color: LIME, paddingLeft: "10px" }, focus: LIME, h: "52px" });
    const colEtroite = k.col([num("01", "Lanceurs", "/catalogue"), num("02", "Charges utiles", "/catalogue"), num("03", "Sites de tir", "/faq"), num("04", "Actualités", "/blog"), num("05", "Nous écrire", "/contact")], { flexGrow: 0, flexShrink: 1, flexBasis: "280px", minWidth: "240px", gap: "0px", paddingLeft: "22px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "6px", borderColor: LIME, borderRadius: "0px" }, undefined, { flexBasis: "100%", paddingLeft: "14px" });
    const gauche = k.col([coordonnees(k, { couleur: LAV, lien: LAV, survol: LIME, focus: LIME, taille: 17 }), G.ligneLegale({ taille: 13, couleur: "#d3c7f5", liens: LAV, sansCookies: true, pile: true })(k, env)], { flexGrow: 1, flexBasis: "0px", minWidth: "260px", gap: "28px", justifyContent: "space-between" });
    const bas = G.bande(k, [gauche, colEtroite], { fond: VIO2, gap: "36px 72px", aligne: "stretch", padV: ["56px", "44px", "36px"], padB: ["48px", "40px", "32px"], padH: MARGES, nom: "Coordonnées et liens" });
    haut.styles.desktop.color = LAV; bas.styles.desktop.color = LAV;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Aéronautique et spatial", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : bureau d'études aéronautique, lanceur, compagnie, constructeur, start-up spatiale.",
  models: [tour, orbite, departs, plan, cielNuit, rebours],
};
