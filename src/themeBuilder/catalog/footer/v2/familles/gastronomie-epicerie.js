// Famille v2 « Gastronomie et épicerie fine » — 6 modèles (ft2-332 à ft2-337), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds d'épiceries fines, fromageries, caves à manger, traiteurs et boutiques de produits du terroir (marques FICTIVES). Compositions inspirées de trois captures de sites réels (colonne de marque + groupe
// de marques en pastilles ; très grands mots légers en liste ; grand titre + carte d'appel + nom monumental rogné), traduites à angles droits, autres couleurs, autre contenu.
// Aucune coordonnée, horaire ni chiffre inventé : adresse, téléphone et horaires viennent des Données de l'entreprise du site. Rayons, produits et étapes = intitulés d'EXEMPLE à renommer dans l'éditeur.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage 2 à 10 px) ; UNE animation visible par modèle (carré qui respire, case qui se remplit, flèche qui glisse…).
// Pas d'animation d'entrée, pas de défilement continu.
const FAM = "gastronomie-epicerie";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");
const DOUX = 360; // ms : durée des transitions de survol / focus
// ── Aides LOCALES à la famille (toutes à angles droits) ──
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
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
// deux valeurs de « gap » interdites sur k.row / k.col : converties en rowGap + columnGap
const gapOk = (st) => { if (st && typeof st.gap === "string" && /\s/.test(st.gap.trim())) { const { gap, ...r } = st; return { ...r, ...GK.gaps(gap) }; } return st; };
const sk = (k) => ({ ...k, row: (c, st, t, m) => k.row(c, gapOk(st), t, m), col: (c, st, t, m) => k.col(c, gapOk(st), t, m) });
const PH = ["48px", "32px", "20px"];
const reseauxT = (G, k, env, o) => G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", ...o })(k, env);
// ligne d'index : grand libellé, flèche, filet bas ; la ligne glisse au survol
const ligneIndex = (k, label, url, o) => lien(k, `${label}  →`, url, { taille: o.taille, poids: o.poids || "400", police: o.police, couleur: o.couleur, h: o.h || "88px", bloc: true, lh: 1, suivi: o.suivi, casse: o.casse, survol: { color: o.survolCouleur, transform: { x: 10 }, ...(o.survolFond ? { backgroundColor: o.survolFond } : {}) }, focus: o.focus, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet, justifyContent: "space-between", ...(o.extra || {}) } });

// ═══ ft2-332 « Damier du marché » — épicerie fine (archétype C : damier de cases) ═══
// Idée (capture : marques du groupe en pastilles) : huit cases égales à angles droits sur un fond charbon, chacune est un lien ou une information : cinq rayons, horaires, coordonnées, lettre ; la case survolée se remplit de tomate.
// Polices : Archivo Black (titres) et Work Sans (texte).
const marche = identite({
  key: "c332", label: "Charbon, crème et tomate", humeur: "dark",
  fond: "#1d1a16", texte: "#fff4e0", discret: "#d5c7ad", accent: "#ff6a4d", surface: "#2a2620", encre: "#1d1a16", surEncre: "#fff4e0",
  police: "font.work-sans", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#fff4e033",
});
const CHARB = "#1d1a16", CREME = "#fff4e0", TOMATE = "#d9381e";
const damierMarche = modeleV2({
  id: identifiantV2(332, "damier-du-marche"), concept: "c-332-damier-du-marche", name: "Damier du marché", family: FAM,
  description: "Pour une épicerie fine : huit cases égales à angles droits, chacune un lien ou une information (cinq rayons, horaires, coordonnées, lettre), qui se remplissent de tomate au survol. Charbon, crème, tomate.",
  tags: ["épicerie fine", "damier", "cases égales", "rayons", "horaires", "tomate", "charbon", "angles droits"],
  identity: marche, racine: racineDe(CHARB),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const base = { flexGrow: 2, flexBasis: "240px", minWidth: "200px", minHeight: "150px", boxSizing: "border-box", borderRadius: "0px", transitionDuration: DOUX };
    const caseLien = (n, t, u) => { const l = lien(k, t, u, { taille: 28, poids: "400", police: S.head, couleur: CHARB, h: "52px", bloc: true, lh: 1, survol: { color: "#ffffff" }, focus: CHARB, extra: { width: "100%" } }); const c = k.col([caps(k, n, { couleur: "#c2300f", poids: "800" }), l], { ...base, backgroundColor: CREME, justifyContent: "space-between", paddingTop: "18px", paddingBottom: "12px", paddingLeft: "22px", paddingRight: "22px", gap: "10px" }); c.states = { hover: { backgroundColor: TOMATE, transform: { y: -4 } } }; return c; };
    const caseInfo = (titre, w, fond, couleur) => k.col([caps(k, titre, { couleur }), w], { ...base, flexGrow: 3, backgroundColor: fond, gap: "10px", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px", justifyContent: "flex-start" });
    const abo = abonnement(k, env, { titre: "", intro: "Arrivages et recettes du marché, de temps en temps.", bouton: "Je m'abonne", largeur: "420px", accent: CHARB, texte: CREME });
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#d5c7ad", fontSize: "14px" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: CHARB, backgroundColor: "#ffb199", minHeight: "48px" };
    abo.parts.button.states = { hover: { backgroundColor: CREME, color: CHARB }, focus: GK.focus(CREME) };
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderColor: "#ffb199", fontSize: "16px" };
    const cases = [
      caseLien("01", "Fromages", "/catalogue"), caseLien("02", "Charcuteries", "/catalogue"), caseLien("03", "Vins", "/catalogue"), caseLien("04", "Épicerie sucrée", "/catalogue"),
      caseInfo("Horaires", horaires(k, { couleur: CREME, taille: 14 }), "#2a2620", "#ff9c85"),
      caseInfo("Coordonnées", coordonnees(k, { couleur: CREME, lien: CREME, survol: "#ff9c85", focus: "#ff9c85", taille: 14 }), "#2a2620", "#ff9c85"),
      caseLien("05", "Coffrets cadeaux", "/catalogue"),
      caseInfo("La lettre du marché", abo, "#3a342b", "#ff9c85"),
    ];
    const grille = k.col([k.row(cases.slice(0, 3), { gap: "4px", alignItems: "stretch", width: "100%" }), k.row(cases.slice(3), { gap: "4px", alignItems: "stretch", width: "100%" })], { gap: "4px", width: "100%", alignItems: "stretch" });
    souffle(cases[0], 4800);
    const haut = G.bande(k, [grille], { fond: CHARB, colonne: true, padV: ["56px", "44px", "32px"], padB: ["4px", "4px", "4px"], padH: PH, nom: "Damier" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d5c7ad", liens: CREME, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: CHARB, colonne: true, padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = CREME;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-333 « Deux assiettes » — traiteur (archétype E : deux demi-pages bord à bord) ═══
// Idée (capture : grand titre à gauche, carte d'appel à droite) : à gauche un panneau vert olive (grande phrase en serif, bouton de commande et coordonnées), à droite un panneau crème (carte du traiteur en lignes, horaires, lettre).
// Polices : Fraunces (titres) et Public Sans (texte).
const assiettes = identite({
  key: "c333", label: "Olive et crème", humeur: "dark",
  fond: "#34422a", texte: "#f8f1df", discret: "#d3dbbf", accent: "#e8b33a", surface: "#3f4f33", encre: "#34422a", surEncre: "#f8f1df",
  police: "font.public-sans", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f8f1df33",
});
const OLIVE = "#34422a", CREME3 = "#f8f1df", SAFRAN = "#e8b33a";
const deuxAssiettes = modeleV2({
  id: identifiantV2(333, "deux-assiettes"), concept: "c-333-deux-assiettes", name: "Deux assiettes", family: FAM,
  description: "Pour un traiteur : deux demi-pages bord à bord, vert olive à gauche (grande phrase, bouton de commande, coordonnées), crème à droite (la carte en lignes à filet, horaires, lettre).",
  tags: ["traiteur", "deux panneaux", "olive", "crème", "commande", "horaires", "lettre d'information", "angles droits"],
  identity: assiettes, racine: racineDe(OLIVE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const phrase = G.geant("<p>À table,<br><em>ensemble.</em></p>", { taille: [52, 104], tablette: { taille: [64, 88] }, mobile: { taille: [48, 60] }, lh: 1, suivi: "-0.02em", poids: "500", police: S.head, couleur: CREME3 })(k, env);
    const intro = k.T("<p>Buffets, repas d'équipe, mariages : un traiteur de produits frais, cuisinés la veille pour le lendemain.</p>", { fontSize: "17px", lineHeight: 1.6, color: "#d3dbbf", fontFamily: S.font, maxWidth: "400px" });
    const cmd = souffle(bouton(k, "Demander un devis", "/contact", { texte: OLIVE, fond: SAFRAN, bord: SAFRAN, survol: { backgroundColor: CREME3, borderColor: CREME3, transform: { y: -3 } }, focus: CREME3 }), 4200);
    const gauche = k.col([k.col([caps(k, "Traiteur de saison", { couleur: SAFRAN, suivi: "0.22em" }), phrase], { gap: "20px", alignItems: "flex-start" }), k.col([intro, cmd, coordonnees(k, { couleur: CREME3, lien: CREME3, survol: SAFRAN, focus: SAFRAN })], { gap: "24px", alignItems: "flex-start" })],
      { backgroundColor: OLIVE, flexGrow: 1, flexBasis: "50%", minWidth: "320px", gap: "56px", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "88px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "48px", boxSizing: "border-box", borderRadius: "0px" }, { paddingTop: "64px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "48px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" });
    const rangee = (t, u) => lien(k, `${t}  →`, u, { taille: 24, poids: "500", police: S.head, couleur: OLIVE, h: "64px", bloc: true, survol: { color: "#8a5d00", transform: { x: 8 } }, focus: OLIVE, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#34422a55", justifyContent: "space-between" } });
    const abo = abonnement(k, env, { titre: "La carte du mois", intro: "Le menu de saison, une fois par mois.", bouton: "Je m'abonne", largeur: "420px", accent: OLIVE, texte: OLIVE });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: "#7a5300" };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#3f4a35" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: CREME3 };
    abo.parts.button.states = { hover: { backgroundColor: "#7a5300", color: "#ffffff" }, focus: GK.focus(OLIVE) };
    const droite = k.col([caps(k, "Nos formules", { couleur: "#7a5300" }), k.col([rangee("Buffets froids", "/catalogue"), rangee("Plateaux repas", "/catalogue"), rangee("Cocktails dînatoires", "/catalogue"), rangee("Repas assis", "/catalogue")], { gap: "0px", alignItems: "stretch", width: "100%" }), k.row([k.col([caps(k, "Horaires", { couleur: "#7a5300" }), horaires(k, { couleur: OLIVE, taille: 14 })], { flexGrow: 1, flexBasis: "200px", gap: "8px", alignItems: "flex-start" }), k.col([abo], { flexGrow: 1, flexBasis: "260px", alignItems: "flex-start" })], { gap: "28px 40px", alignItems: "flex-start", width: "100%" })],
      { backgroundColor: CREME3, flexGrow: 1, flexBasis: "50%", minWidth: "320px", gap: "28px", alignItems: "stretch", paddingTop: "88px", paddingBottom: "64px", paddingLeft: "48px", paddingRight: "56px", boxSizing: "border-box", borderRadius: "0px" }, { paddingTop: "64px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "48px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" });
    const demi = G.bande(k, [gauche, droite], { fond: OLIVE, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Deux panneaux" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d3dbbf", liens: CREME3, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: OLIVE, colonne: true, padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = CREME3;
    return [G.racine(k, [demi, bas])];
  },
}, FAM);

// ═══ ft2-334 « Panier XXL » — produits du terroir en ligne (archétype F : bandeau d'appel XXL + colonne étroite) ═══
// Idée (capture : grande carte d'appel et bouton) : un bandeau jaune moutarde monumental (« Un panier du terroir chez vous. », énorme bouton brun) puis une bande brun café : le nom, une courte phrase et UNE colonne étroite de liens à droite.
// Polices : Anton (titre) et Karla (texte).
const panier = identite({
  key: "c334", label: "Moutarde et brun café", humeur: "dark",
  fond: "#2a1d14", texte: "#fbefd8", discret: "#d8c3a4", accent: "#f2b705", surface: "#38281c", encre: "#2a1d14", surEncre: "#fbefd8",
  police: "font.karla", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#fbefd833",
});
const MOUTARDE = "#f2b705", CAFE = "#2a1d14", LAIT = "#fbefd8";
const panierXXL = modeleV2({
  id: identifiantV2(334, "panier-xxl"), concept: "c-334-panier-xxl", name: "Panier XXL", family: FAM,
  description: "Pour une boutique de produits du terroir en ligne : bandeau moutarde monumental avec un énorme bouton de commande, puis une bande brun café avec le nom et une seule colonne étroite de liens à droite.",
  tags: ["terroir", "boutique en ligne", "appel à l'action", "colonne étroite", "moutarde", "brun café", "angles droits"],
  identity: panier, racine: racineDe(CAFE),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const phrase = G.geant("<p>Un panier du terroir<br>chez vous.</p>", { taille: [44, 120], tablette: { taille: [64, 100] }, mobile: { taille: [40, 56] }, lh: 1, suivi: "0.005em", poids: "400", police: S.head, couleur: CAFE, extra: { textTransform: "uppercase" } })(k, env);
    const gros = souffle(bouton(k, "Composer mon panier", "/boutique/panier", { texte: MOUTARDE, fond: CAFE, bord: CAFE, taille: 18, h: "76px", poids: "800", police: S.font, survol: { backgroundColor: "#ffffff", borderColor: CAFE, color: CAFE, transform: { y: -4 } }, focus: CAFE, extra: { paddingLeft: "44px", paddingRight: "44px" } }), 4600);
    const haut = G.bande(k, [k.col([k.col([caps(k, "Ferme de la Grange", { couleur: CAFE, suivi: "0.3em" }), phrase], { gap: "20px", alignItems: "flex-start" }), gros], { gap: "44px", alignItems: "flex-start", width: "100%", flexGrow: 1 })], { fond: MOUTARDE, colonne: true, padV: ["88px", "68px", "48px"], padB: ["80px", "60px", "44px"], padH: PH, nom: "Appel" });
    const nom = k.T("<p>Ferme de la Grange</p>", { fontFamily: S.head, fontSize: "fluid:30-44", lineHeight: 1.05, color: LAIT, textTransform: "uppercase", letterSpacing: "0.02em" });
    const mot = k.T("<p>Confitures, miels, huiles et conserves de producteurs voisins, expédiés dans un colis soigné.</p>", { fontSize: "16px", lineHeight: 1.6, color: "#d8c3a4", fontFamily: S.font, maxWidth: "360px" });
    const l = (t, u) => lien(k, t, u, { taille: 17, poids: "700", couleur: LAIT, bloc: true, h: "48px", survol: { color: MOUTARDE, transform: { x: 6 } }, focus: MOUTARDE, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#fbefd833" } });
    const colLiens = G.colonne(k, [l("Confitures et miels", "/catalogue"), l("Huiles et vinaigres", "/catalogue"), l("Conserves", "/catalogue"), l("Livraison", "/faq"), l("Nous contacter", "/contact")], { poids: 1, min: "240px", gap: "0px", base: "260px", aligne: "stretch" });
    colLiens.styles.desktop.maxWidth = "340px";
    const rs = reseauxT(G, k, env, { couleur: LAIT, survol: MOUTARDE, focus: MOUTARDE, taille: 14 });
    const milieu = G.bande(k, [G.colonne(k, [G.colonne(k, [nom], { poids: 1 }), G.colonne(k, [mot, rs], { poids: 2, gap: "20px" })], { poids: 2, min: "280px", gap: "18px" }), G.colonne(k, [colLiens], { poids: 1, min: "240px" })], { fond: CAFE, gap: "36px 64px", aligne: "flex-start", justifie: "flex-start", padV: ["64px", "52px", "40px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Nom et liens" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d8c3a4", liens: LAIT, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: CAFE, colonne: true, gap: "18px", padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = LAIT;
    return [G.racine(k, [haut, milieu, bas])];
  },
}, FAM);

// ═══ ft2-335 « Sommaire gourmand » — cave à manger (archétype G : index en lignes pleine largeur) ═══
// Idée (capture : très grands mots légers) : cinq lignes pleine largeur, très grand libellé fin, flèche à droite, filet dessous ; au survol la ligne glisse et prend l'orange. Dessous, une ligne unique : coordonnées, horaires, mentions.
// Polices : Instrument Serif (titres) et Instrument Sans (texte).
const sommaire = identite({
  key: "c335", label: "Noir encre et orange", humeur: "dark",
  fond: "#141414", texte: "#f5efe4", discret: "#b6aea0", accent: "#ff7a2f", surface: "#1f1f1f", encre: "#141414", surEncre: "#f5efe4",
  police: "font.instrument-sans", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#f5efe433",
});
const ENCRE = "#141414", ECRU = "#f5efe4", ORANGE = "#ff7a2f";
const sommaireGourmand = modeleV2({
  id: identifiantV2(335, "sommaire-gourmand"), concept: "c-335-sommaire-gourmand", name: "Sommaire gourmand", family: FAM,
  description: "Pour une cave à manger : cinq lignes pleine largeur en très grands mots fins avec flèche et filet, qui glissent et passent à l'orange au survol, puis une ligne unique de coordonnées, horaires et mentions.",
  tags: ["cave à manger", "index", "grands mots", "lignes à filet", "noir", "orange", "angles droits"],
  identity: sommaire, racine: racineDe(ENCRE),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const l = (t, u) => ligneIndex(k, t, u, { taille: 0, police: S.head, couleur: ECRU, survolCouleur: ORANGE, focus: ORANGE, filet: "#f5efe433", h: "104px", extra: { fontSize: "fluid:40-84" } });
    const lignes = k.col([l("Fromages affinés", "/catalogue"), l("Charcuteries", "/catalogue"), l("Vins nature", "/catalogue"), l("Planches et assiettes", "/catalogue"), l("Privatiser la cave", "/contact")], { gap: "0px", alignItems: "stretch", width: "100%" });
    souffle(lignes.children[0], 6000);
    const haut = G.bande(k, [k.col([k.col([caps(k, "Ce qui est à la carte", { couleur: ORANGE, suivi: "0.24em" })], { flexGrow: 1 }), k.col([lignes], { width: "100%", flexGrow: 3 })], { gap: "24px", width: "100%", alignItems: "stretch" })], { fond: ENCRE, colonne: true, gap: "24px", padV: ["72px", "56px", "40px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Sommaire" });
    const bloc = (t, w) => k.col([caps(k, t, { couleur: ORANGE }), w], { flexGrow: 1, flexBasis: "240px", gap: "10px", alignItems: "flex-start" });
    const info = k.row([bloc("Nous trouver", coordonnees(k, { couleur: ECRU, lien: ECRU, survol: ORANGE, focus: ORANGE, taille: 14 })), bloc("Ouverture", horaires(k, { couleur: ECRU, taille: 14 }))], { gap: "28px 56px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b6aea0", liens: ECRU, sansCookies: true })(k, env);
    const bas = G.bande(k, [info, mentions], { fond: ENCRE, colonne: true, gap: "32px", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Infos" });
    bas.styles.desktop.color = ECRU;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-336 « Du champ à la table » — producteur-boutique (archétype I : frise en étapes à points carrés) ═══
// Idée (capture : colonnes de liens aérées) : une frise horizontale à quatre étapes (producteurs, atelier, boutique, votre table), un carré par étape relié par un filet, titre et lien sous chaque étape ; dessous, coordonnées et horaires sur une ligne.
// Polices : Young Serif (titres) et DM Sans (texte).
const frise = identite({
  key: "c336", label: "Sauge clair et vert forêt", humeur: "light",
  fond: "#e8eddc", texte: "#1c2b1f", discret: "#455548", accent: "#2f5d3a", surface: "#d9e1c8", encre: "#1c2b1f", surEncre: "#e8eddc",
  police: "font.dm-sans", titres: "font.young-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#1c2b1f33",
});
const SAUGE = "#e8eddc", FORET = "#2f5d3a", NOIRV = "#1c2b1f";
const champTable = modeleV2({
  id: identifiantV2(336, "du-champ-a-la-table"), concept: "c-336-du-champ-a-la-table", name: "Du champ à la table", family: FAM,
  description: "Pour un producteur-boutique : une frise horizontale à quatre étapes reliées par un filet (producteurs, atelier, boutique, votre table), un carré par étape, puis coordonnées et horaires sur une ligne. Sauge et vert forêt.",
  tags: ["producteur", "boutique", "frise", "étapes", "sauge", "vert forêt", "horaires", "angles droits"],
  identity: frise, racine: racineDe(SAUGE),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const titre = G.geant("<p>Du champ à la table.</p>", { taille: [38, 84], tablette: { taille: [48, 72] }, mobile: { taille: [36, 48] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: NOIRV })(k, env);
    const cellule = (i) => k.row([i === 0 ? souffle(carre(k, FORET, "22px"), 3200) : carre(k, FORET, "22px"), k.col([k.divider({ width: "100%", borderColor: FORET, borderTopWidth: "2px", marginTop: "0px", marginBottom: "0px" })], { flexGrow: 1, minWidth: "10px" })], { gap: "0px", flexWrap: "nowrap", flexGrow: 1, flexBasis: "200px", alignItems: "center" });
    const rail = k.row([cellule(0), cellule(1), cellule(2), cellule(3)], { gap: "0px 24px", flexWrap: "nowrap", width: "100%", alignItems: "center" }, undefined, { display: "none" });
    const lienEtape = (t, u) => lien(k, t, u, { taille: 26, poids: "400", police: S.head, couleur: NOIRV, h: "56px", survol: { color: FORET, transform: { y: -3 } }, focus: FORET, extra: { flexGrow: 1, flexBasis: "200px" } });
    const etapes = k.row([lienEtape("1 · Les producteurs", "/blog"), lienEtape("2 · L'atelier", "/catalogue"), lienEtape("3 · La boutique", "/boutique"), lienEtape("4 · Votre table", "/catalogue")], { gap: "8px 24px", alignItems: "flex-start", width: "100%" });
    const rail4 = k.col([rail, etapes], { gap: "14px", width: "100%", alignItems: "stretch" });
    const haut = G.bande(k, [titre, rail4], { fond: SAUGE, colonne: true, gap: "56px", padV: ["80px", "64px", "44px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Frise" });
    const bloc = (t, w) => k.col([caps(k, t, { couleur: FORET }), w], { flexGrow: 1, flexBasis: "260px", gap: "8px", alignItems: "flex-start" });
    const info = k.row([bloc("La boutique", coordonnees(k, { couleur: NOIRV, lien: NOIRV, survol: FORET, focus: FORET, taille: 14 })), bloc("Horaires", horaires(k, { couleur: NOIRV, taille: 14 }))], { gap: "20px 56px", alignItems: "flex-start", width: "100%", paddingTop: "28px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: FORET });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#455548", liens: NOIRV, sansCookies: true })(k, env);
    const bas = G.bande(k, [info, mentions], { fond: SAUGE, colonne: true, gap: "28px", padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Infos" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-337 « Escalier de cave » — vins et spiritueux (archétype L : pied en escalier) ═══
// Idée (capture : nom monumental et cartes en retrait) : quatre paliers de largeurs décroissantes alignés à gauche, de plus en plus sombres (crème, sable, grenat, bordeaux presque noir) : nom et liens, rayons, lettre, mentions.
// Polices : Bodoni Moda (titres) et Hanken Grotesk (texte).
const escalier = identite({
  key: "c337", label: "Crème, sable et grenat", humeur: "dark",
  fond: "#2a0b14", texte: "#f6ead9", discret: "#d9bfae", accent: "#e0a35a", surface: "#3a1420", encre: "#2a0b14", surEncre: "#f6ead9",
  police: "font.hanken-grotesk", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f6ead933",
});
const BORDO = "#2a0b14", GRENAT = "#8e2f3f", SABLE = "#d9b88f", CREME7 = "#f3e6d3";
const escalierCave = modeleV2({
  id: identifiantV2(337, "escalier-de-cave"), concept: "c-337-escalier-de-cave", name: "Escalier de cave", family: FAM,
  description: "Pour un caviste : quatre paliers de largeurs décroissantes alignés à gauche, de la crème au bordeaux presque noir : nom et liens, rayons, lettre d'information, mentions.",
  tags: ["caviste", "vins", "escalier", "paliers", "crème", "sable", "grenat", "lettre d'information", "angles droits"],
  identity: escalier, racine: racineDe(BORDO),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const palier = (enfants, fond, largeur, o = {}) => k.col([k.col(enfants, { gap: "20px", alignItems: "flex-start", width: "100%", flexGrow: 1 })], { width: largeur, backgroundColor: fond, boxSizing: "border-box", gap: "20px", alignItems: "flex-start", paddingTop: o.pv || "40px", paddingBottom: o.pv || "40px", paddingLeft: "48px", paddingRight: "40px", borderRadius: "0px", ...(o.extra || {}) }, { width: o.tablette || "100%", paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const nom = k.T("<p>Cave des Trois Marches</p>", { fontFamily: S.head, fontSize: "fluid:36-72", lineHeight: 1, fontWeight: "600", color: BORDO, maxWidth: "720px" });
    const nav = k.row(["Vins|/catalogue", "Spiritueux|/catalogue", "Accords|/catalogue", "Dégustations|/catalogue", "Contact|/contact"].map((x) => { const [t, u] = x.split("|"); return lien(k, t, u, { taille: 17, poids: "700", couleur: BORDO, padH: "4px", survol: { color: GRENAT, transform: { y: -3 } }, focus: BORDO }); }), { gap: "4px 28px" });
    const p1 = palier([nom, nav], CREME7, "100%", { pv: "72px" });
    const colRayon = (t, a) => k.col([caps(k, t, { couleur: "#5a3a12" }), ...a.map(([x, u]) => lien(k, x, u, { taille: 16, poids: "500", couleur: BORDO, survol: { color: GRENAT, transform: { x: 5 } }, focus: BORDO }))], { flexGrow: 1, flexBasis: "180px", gap: "0px", alignItems: "flex-start" });
    const p2 = palier([k.row([colRayon("Rouges et blancs", [["Bordeaux", "/catalogue"], ["Bourgogne", "/catalogue"], ["Loire", "/catalogue"]]), colRayon("Bulles et doux", [["Champagnes", "/catalogue"], ["Crémants", "/catalogue"], ["Liquoreux", "/catalogue"]])], { gap: "20px 40px", alignItems: "flex-start", width: "100%" })], SABLE, "78%", { tablette: "92%" });
    const abo = abonnement(k, env, { titre: "La lettre de la cave", intro: "Arrivages, dégustations, accords du mois.", bouton: "Je m'abonne", largeur: "440px", accent: SABLE, texte: CREME7 });
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#f0dcc6" };
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: "#ffd9a6" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: BORDO };
    abo.parts.button.states = { hover: { backgroundColor: "#ffffff", color: BORDO }, focus: GK.focus("#ffffff") };
    const p3 = palier([abo], GRENAT, "56%", { tablette: "80%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d9bfae", liens: CREME7, sansCookies: true })(k, env);
    const p4 = palier([souffle(carre(k, SABLE, "12px"), 3400), mentions], "#3a1420", "40%", { pv: "26px", tablette: "70%" });
    p4.styles.desktop.color = CREME7;
        const corps = G.bande(k, [p1, p2, p3, p4], { fond: BORDO, colonne: true, aligne: "flex-start", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Escalier" });
    corps.styles.desktop.color = CREME7;
    return [G.racine(k, [corps])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Gastronomie et épicerie fine", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : épicerie fine, traiteur, produits du terroir, cave à manger, producteur-boutique, caviste.",
  models: [damierMarche, deuxAssiettes, panierXXL, sommaireGourmand, champTable, escalierCave],
};
