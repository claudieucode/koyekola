// Famille v2 « Conseil et services aux entreprises » — 5 modèles (ft2-136 à ft2-140), extension « carrée » (angles droits, sites standard très professionnels).
// Pieds de cabinet de conseil, d'audit, de stratégie et de services aux entreprises : sobriété éditoriale, colonnes rigoureuses, grands numéros d'ordre (01, 02, I, II…) qui servent de STRUCTURE.
// AUCUN chiffre de performance inventé (pas de « 20 ans », de « 500 clients ») : les grands chiffres sont des numéros de rubrique. Marques fictives ; horaires, adresse, téléphone viennent des
// « Données de l'entreprise » du site. Chaque modèle a sa palette, ses polices et ses formes (indépendance, mode « solo »).
//
// ANGLES DROITS : identité à `rayon: "0px"`, aucun `borderRadius` non nul, boutons et champs carrés, pastilles carrées (jamais de point rond).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, filet qui change de couleur, décalage de 4 à 28 px) ; carré qui « respire » (pulse lent) ;
// aucune animation d'entrée, aucun défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "conseil-b2b";
const MV = 360; // ms : durée des transitions de survol (douces)

// ── Aides LOCALES à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
const NBSP = " ";
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: MV, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Animation d'attention en boucle lente (aucun repli animé en mouvement réduit)
const souffle = (n, ms = 3600) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
// Petit carré plein (jamais de point rond)
const carre = (k, couleur, t = "10px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
// « Ouvert maintenant » désactivé : son point d'état est rond (angles droits obligatoires)
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: MV }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// Abonnement carré : titre, champ à filet, bouton plein à angles droits
function abonnement(k, env, o) {
  const abo = GK.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre, lineHeight: 1.4, fontFamily: o.police };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro || abo.parts.intro.styles.desktop.color };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, transitionDuration: MV, color: o.surBouton || abo.parts.button.styles.desktop.color };
  if (o.fondChamp) abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, backgroundColor: o.fondChamp };
  return abo;
}
// Ligne d'index : lien pleine largeur, filet haut, numéro + libellé ; au survol le fond se remplit et le texte se décale
function ligneIndex(k, num, label, url, o) {
  const n = k.LINK(`${num}${NBSP}${NBSP}${NBSP}${label}`, url, compact({ fontFamily: o.police, fontSize: "fluid:26-52", fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: "0.01em", color: o.couleur, textDecoration: "none", display: "flex", alignItems: "center", width: "100%", minHeight: "76px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: o.filet, paddingLeft: "0px", paddingRight: "12px", lineHeight: 1.1, transitionDuration: MV }));
  return GK.fini(k, n, { hover: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, paddingLeft: "28px", textDecoration: "none" }, focus: GK.focus(o.focus) });
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-136 « Rapport annuel » — cabinet de conseil en stratégie
// Idée : un pied à la manière d'un RAPPORT ANNUEL : papier ivoire, encre noire, bordeaux sobre. Phrase en serif (« Éclairer la décision. »), à droite une introduction et deux actions ; puis QUATRE colonnes
// numérotées 01 à 04 (le cabinet, les ressources, le contact, la lettre) sous un filet épais d'encre qui devient bordeaux au survol de la colonne. Les grands numéros servent de structure (aucune statistique).
// Polices : Newsreader (titres) et Public Sans (texte). Mobile : phrase, introduction, colonnes empilées.
const rapport = identite({
  key: "c136", label: "Ivoire, encre et bordeaux", humeur: "light",
  fond: "#f7f5ef", texte: "#14161a", discret: "#515a66", accent: "#8a1c2b", surface: "#ffffff", encre: "#14161a",
  police: "font.public-sans", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#14161a33",
});
const IVOIRE = "#f7f5ef", ENCRE = "#14161a", BORDEAUX = "#8a1c2b";

const rapportAnnuel = modeleV2({
  id: identifiantV2(136, "rapport-annuel"), concept: "c-136-rapport-annuel",
  name: "Rapport annuel", family: FAM,
  description: "Pour un cabinet de conseil en stratégie : phrase en serif sur papier ivoire, introduction et deux actions, puis quatre colonnes numérotées sous un filet épais qui rougit au survol. Éditorial, rigoureux, angles droits.",
  tags: ["conseil", "stratégie", "cabinet", "éditorial", "ivoire", "bordeaux", "colonnes numérotées", "angles droits"],
  identity: rapport,
  racine: racineDe(IVOIRE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const sur = caps(k, "Conseil en stratégie et organisation", { couleur: BORDEAUX, suivi: "0.2em" });
    const phrase = G.geant(`<p>Éclairer<br>la décision.</p>`, { taille: [52, 124], tablette: { taille: [80, 112] }, mobile: { taille: [52, 80] }, lh: 1.0, suivi: "-0.02em", poids: "500", police: S.head, couleur: ENCRE })(k, env);
    const gauche = G.colonne(k, [sur, phrase], { poids: 7, min: "300px", gap: "20px" });
    const intro = k.T("<p>Des analyses claires, des recommandations tenues dans la durée : nous accompagnons les dirigeants dans leurs choix structurants.</p>", { fontSize: "17px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "430px" });
    const rdv = lien(k, "Prendre rendez-vous", "/contact", { taille: 15, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: "#ffffff", h: "52px", padH: "28px", survol: { backgroundColor: BORDEAUX, color: "#ffffff", transform: { y: -3 } }, focus: BORDEAUX, extra: { backgroundColor: ENCRE, borderRadius: "0px", justifyContent: "center", alignSelf: "flex-start" } });
    const pub = lien(k, "Lire nos publications", "/blog", { taille: 15, poids: "700", couleur: ENCRE, soulign: true, survol: { color: BORDEAUX, transform: { x: 4 } }, focus: BORDEAUX });
    const droite = G.colonne(k, [intro, G.ligne(k, [rdv, pub], { gap: "8px 28px", aligne: "center" })], { poids: 5, min: "290px", gap: "26px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: IVOIRE, gap: "44px 72px", aligne: "flex-end", padV: ["104px", "80px", "56px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    // quatre colonnes numérotées : filet épais d'encre qui passe au bordeaux au survol de la colonne
    const colonneNum = (num, titre, enfants, poids = 1) => {
      const n = G.colonne(k, [k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "56px", lineHeight: 1, fontWeight: "400", color: BORDEAUX }), caps(k, titre, { couleur: ENCRE, taille: "13px" }), ...enfants], { poids, min: "220px", gap: "14px", extra: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: ENCRE, paddingTop: "22px", transitionDuration: MV } });
      n.states = { hover: { borderColor: BORDEAUX } };
      return n;
    };
    const ressources = [["Accueil", "/"], ["Publications et analyses", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const c1 = colonneNum("01", "Le cabinet", [horaires(k, { taille: 15 })], 1.1);
    const c2 = colonneNum("02", "Ressources", ressources.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: BORDEAUX, transform: { x: 4 } }, focus: BORDEAUX })));
    const c3 = colonneNum("03", "Contact", [coordonnees(k, { taille: 15, lien: ENCRE, survol: BORDEAUX, focus: BORDEAUX })], 1.1);
    const abo = abonnement(k, env, { titre: "Recevoir nos analyses", intro: "Nos analyses, quelques fois par an.", bouton: "S'abonner", largeur: "340px", accent: BORDEAUX, couleurTitre: ENCRE, survolBouton: ENCRE, survolTexte: "#ffffff" });
    const c4 = colonneNum("04", "Lettre", [abo], 1.4);
    const grille = G.ligne(k, [c1, c2, c3, c4], { gap: "40px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: IVOIRE, colonne: true, gap: "44px", padV: ["24px", "24px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Colonnes" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-137 « Salle du conseil » — conseil en gouvernance et en finance d'entreprise
// Idée : la SALLE DU CONSEIL. Nuit marine, laiton. Phrase en Cormorant (« Décider en confiance. ») avec une barre verticale de laiton à gauche ; à droite un cartouche à filet « Premier échange » dont le carré laiton
// « respire » doucement. Dessous, cinq domaines d'intervention (Stratégie, Organisation, Finance, Transformation, Conformité) en cellules séparées par des filets, qui se soulèvent et s'éclairent au survol.
// Puis horaires, contact, ressources et mentions. Polices : Cormorant Garamond (titres) et Hanken Grotesk (texte). Mobile : cellules empilées.
const salle = identite({
  key: "c137", label: "Marine nuit et laiton", humeur: "dark",
  fond: "#0d1a2b", texte: "#eef2f7", discret: "#a9b6c6", accent: "#d1a954", surface: "#14253b", encre: "#0d1a2b", surEncre: "#eef2f7",
  police: "font.hanken-grotesk", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eef2f730",
});
const MARINE = "#0d1a2b", MARINE2 = "#14253b", LAITON = "#d1a954", BLANC = "#eef2f7";

const salleDuConseil = modeleV2({
  id: identifiantV2(137, "salle-du-conseil"), concept: "c-137-salle-du-conseil",
  name: "Salle du conseil", family: FAM,
  description: "Pour un cabinet de gouvernance ou de finance d'entreprise : phrase en serif et barre de laiton sur marine, cartouche « premier échange », cinq domaines en cellules qui se soulèvent au survol, horaires et contact. Posé, dense, rigoureux.",
  tags: ["conseil", "gouvernance", "finance d'entreprise", "marine", "laiton", "cartouche", "domaines", "angles droits"],
  identity: salle,
  racine: racineDe(MARINE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const barre = k.col([], { width: "8px", backgroundColor: LAITON, alignSelf: "stretch", flexShrink: 0, borderRadius: "0px" });
    const phrase = G.geant(`<p>Décider<br>en confiance.</p>`, { taille: [50, 120], tablette: { taille: [76, 108] }, mobile: { taille: [50, 76] }, lh: 1.0, suivi: "-0.015em", poids: "500", police: S.head, couleur: BLANC })(k, env);
    const titre = k.row([barre, G.colonne(k, [caps(k, "Conseil en gouvernance et en finance", { couleur: LAITON, suivi: "0.22em" }), phrase], { gap: "20px", poids: 1 })], { gap: "28px", flexWrap: "nowrap", alignItems: "stretch", width: "100%" });
    const gauche = G.colonne(k, [titre], { poids: 7, min: "300px" });
    const carreRespire = souffle(carre(k, LAITON, "12px"), 3200);
    const echange = lien(k, "Écrire au cabinet", "/contact", { taille: 15, poids: "700", casse: "uppercase", suivi: "0.1em", couleur: MARINE, h: "52px", padH: "28px", survol: { backgroundColor: BLANC, color: MARINE, transform: { y: -3 } }, focus: BLANC, extra: { backgroundColor: LAITON, borderRadius: "0px", justifyContent: "center", alignSelf: "flex-start" } });
    const cartouche = k.col([k.row([carreRespire, caps(k, "Premier échange", { couleur: LAITON })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), k.T("<p>Exposez votre situation en quelques lignes : nous revenons vers vous pour un premier entretien, sans engagement.</p>", { fontSize: "16px", lineHeight: 1.65, color: S.mute, fontFamily: S.font }), echange], { gap: "18px", borderStyle: "solid", borderWidth: "1px", borderColor: LAITON, paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", backgroundColor: MARINE2, borderRadius: "0px", maxWidth: "440px", width: "100%" });
    const droite = G.colonne(k, [cartouche], { poids: 5, min: "290px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: MARINE, gap: "44px 64px", aligne: "flex-end", padV: ["104px", "80px", "56px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Séance" });
    // cinq domaines : cellules à filets, qui se soulèvent et s'éclairent
    const cellule = (num, titre, sous, url) => {
      const t = k.LINK(titre, url, { fontFamily: S.head, fontSize: "30px", fontWeight: "500", color: BLANC, textDecoration: "none", lineHeight: 1.1, display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: MV });
      GK.fini(k, t, { hover: { color: LAITON }, focus: GK.focus(LAITON) });
      const c = k.col([caps(k, num, { couleur: LAITON, suivi: "0.2em" }), t, k.T(`<p>${sous}</p>`, { fontSize: "14px", lineHeight: 1.5, color: S.mute, fontFamily: S.font })], { flexGrow: 1, flexBasis: "0px", minWidth: "190px", gap: "8px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "22px", paddingRight: "22px", borderStyle: "solid", borderWidth: "1px", borderColor: "#eef2f730", borderRadius: "0px", backgroundColor: MARINE, transitionDuration: MV });
      c.states = { hover: { backgroundColor: MARINE2, borderColor: LAITON, transform: { y: -6 } } };
      return c;
    };
    const domaines = G.ligne(k, [cellule("I", "Stratégie", "Choix de cap et plan d'action.", "/blog"), cellule("II", "Organisation", "Rôles, circuits de décision.", "/blog"), cellule("III", "Finance", "Pilotage et lecture des comptes.", "/blog"), cellule("IV", "Transformation", "Conduire le changement.", "/blog"), cellule("V", "Conformité", "Règles, contrôles, preuves.", "/blog")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandeDomaines = G.bande(k, [caps(k, "Domaines d'intervention", { couleur: S.mute }), domaines], { fond: MARINE, colonne: true, gap: "24px", padV: ["8px", "8px", "8px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Domaines" });
    // horaires, contact, ressources, lettre
    const c1 = bloc(k, "Horaires du cabinet", [horaires(k, { taille: 15 })], { couleurTitre: LAITON, poids: 1.1 });
    const c2 = bloc(k, "Nous joindre", [coordonnees(k, { taille: 15, lien: BLANC, survol: LAITON, focus: LAITON })], { couleurTitre: LAITON, poids: 1.1 });
    const res = [["Accueil", "/"], ["Analyses et publications", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const c3 = bloc(k, "Ressources", res.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", survol: { color: LAITON, transform: { x: 4 } }, focus: LAITON })), { couleurTitre: LAITON, gap: "0px", min: "200px" });
    const abo = abonnement(k, env, { titre: "Lettre du cabinet", intro: "Nos analyses, quelques fois par an.", bouton: "S'abonner", largeur: "340px", accent: LAITON, couleurTitre: LAITON, survolBouton: BLANC, survolTexte: MARINE });
    const c4 = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [c1, c2, c3, c4], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: MARINE, colonne: true, gap: "40px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "1px", couleur: "#eef2f730" }, nom: "Cabinet" });
    return [G.racine(k, [haut, bandeDomaines, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-138 « Tableau de contrôle » — cabinet d'audit et de conformité
// Idée : un pied en DEUX VOLETS, comme un dossier d'audit. À gauche un volet vert sapin pleine hauteur (rubrique, phrase « Auditer, mesurer, corriger. », coordonnées) ; à droite, sur gris vert très clair, quatre
// cartouches blancs à filet numérotés I à IV (Audit, Conformité, Contrôle interne, Accompagnement) qui montent d'un cran et verdissent au survol ; en bas, horaires, lettre et mentions.
// Les numéros romains sont de la structure, pas des résultats. Polices : Archivo (titres) et Source Sans 3 (texte). Mobile : volet puis cartouches empilés.
const tableau = identite({
  key: "c138", label: "Vert sapin et gris vert clair", humeur: "light",
  fond: "#eef3ef", texte: "#13231c", discret: "#4a5c52", accent: "#0b6b49", surface: "#ffffff", encre: "#13231c",
  police: "font.source-sans-3", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#13231c33",
});
const SAPIN = "#0e3a2b", MENTHE = "#bfe8d3", GRIS = "#eef3ef", VERT = "#0b6b49", TEXTE = "#13231c";

const tableauDeControle = modeleV2({
  id: identifiantV2(138, "tableau-de-controle"), concept: "c-138-tableau-de-controle",
  name: "Tableau de contrôle", family: FAM,
  description: "Pour un cabinet d'audit ou de conformité : volet vert sapin pleine hauteur avec phrase et contact, quatre cartouches numérotés I à IV qui montent au survol, puis horaires, lettre et mentions. Structuré comme un dossier d'audit.",
  tags: ["audit", "conformité", "contrôle interne", "vert sapin", "deux volets", "cartouches", "numéros romains", "angles droits"],
  identity: tableau,
  racine: racineDe(GRIS),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // volet gauche (sapin)
    const phrase = G.geant(`<p>Auditer,<br>mesurer,<br><span style="color:${MENTHE}">corriger.</span></p>`, { taille: [40, 72], tablette: { taille: [56, 72] }, mobile: { taille: [44, 60] }, lh: 1.02, suivi: "-0.025em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const volet = k.col([caps(k, "Audit et conformité", { couleur: MENTHE, suivi: "0.22em" }), phrase, k.divider({ width: "56px", borderColor: MENTHE, borderTopWidth: "4px", marginTop: "0px", marginBottom: "0px" }), caps(k, "Nous joindre", { couleur: MENTHE }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: MENTHE, focus: MENTHE })], { backgroundColor: SAPIN, flexGrow: 4, flexBasis: "0px", minWidth: "320px", gap: "24px", paddingTop: "88px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "48px", alignItems: "flex-start", borderRadius: "0px" }, { paddingTop: "64px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    // volet droit : quatre cartouches
    const cartouche = (num, titre, sous, url) => {
      const t = k.LINK(titre, url, { fontFamily: S.head, fontSize: "24px", fontWeight: "700", color: TEXTE, textDecoration: "none", lineHeight: 1.15, display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: MV });
      GK.fini(k, t, { hover: { color: VERT, textDecoration: "underline" }, focus: GK.focus(VERT) });
      const c = k.col([k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "44px", lineHeight: 1, fontWeight: "800", color: VERT }), t, k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.55, color: S.mute, fontFamily: S.font })], { backgroundColor: "#ffffff", flexGrow: 1, flexBasis: "0px", minWidth: "240px", minHeight: "190px", gap: "10px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", borderStyle: "solid", borderWidth: "1px", borderColor: "#13231c40", borderTopWidth: "4px", borderRadius: "0px", transitionDuration: MV });
      c.states = { hover: { borderColor: VERT, transform: { y: -6 }, backgroundColor: "#f6fbf8" } };
      return c;
    };
    const grid = G.ligne(k, [cartouche("I", "Audit", "Revue des comptes, des processus et des risques.", "/blog"), cartouche("II", "Conformité", "Mise en règle et suivi des obligations.", "/blog"), cartouche("III", "Contrôle interne", "Procédures, preuves et points de contrôle.", "/blog"), cartouche("IV", "Accompagnement", "Un interlocuteur dédié, de la mission au suivi.", "/contact")], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const lk = (t, u) => lien(k, t, u, { taille: 15, poids: "700", soulign: true, survol: { color: VERT, transform: { x: 4 } }, focus: VERT });
    const ress = G.ligne(k, [lk("Publications", "/blog"), lk("Questions fréquentes", "/faq"), lk("Espace client", "/connexion")], { gap: "0px 28px", aligne: "center" });
    const main = k.col([caps(k, "Nos missions", { couleur: VERT, suivi: "0.2em" }), grid, ress], { backgroundColor: GRIS, flexGrow: 8, flexBasis: "0px", minWidth: "320px", gap: "24px", paddingTop: "88px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px", borderRadius: "0px" }, { paddingTop: "64px", paddingBottom: "44px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" });
    const volets = { type: "container", name: "Deux volets", props: { full: true }, children: [volet, main], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", gap: "0px", alignItems: "stretch", backgroundColor: GRIS }) };
    // bas : horaires, lettre, mentions
    const c1 = bloc(k, "Horaires d'ouverture", [horaires(k, { taille: 15 })], { couleurTitre: VERT, poids: 1.2 });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Évolutions réglementaires et analyses, par courriel.", bouton: "S'abonner", largeur: "380px", accent: VERT, couleurTitre: VERT, survolBouton: SAPIN, survolTexte: "#ffffff" });
    const c2 = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const infos = G.ligne(k, [c1, c2], { gap: "36px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [infos, trait(k, S.line), mentions], { fond: "#ffffff", colonne: true, gap: "36px", padV: ["48px", "44px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "1px", couleur: "#13231c33" }, nom: "Bas" });
    return [G.racine(k, [volets, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-139 « Sommaire » — conseil et accompagnement des entreprises
// Idée : la TABLE DES MATIÈRES d'un ouvrage. Blanc pur, noir, orange sûr. Quatre rangées géantes en capitales condensées (01 Nous contacter, 02 Nos publications, 03 Questions fréquentes, 04 Espace client),
// séparées par des filets épais ; au survol (ou au focus) la rangée se REMPLIT d'orange et le texte glisse de 28 px vers la droite. En dessous, horaires, coordonnées et lettre en trois colonnes, puis mentions.
// Polices : Roboto Condensed (rangées) et Work Sans (texte). Mobile : rangées plus petites mais toujours pleine largeur et hautes de 76 px.
const sommaire = identite({
  key: "c139", label: "Blanc, noir et orange", humeur: "light",
  fond: "#ffffff", texte: "#0b0b0c", discret: "#55585d", accent: "#c2410c", surface: "#f4f4f2", encre: "#0b0b0c",
  police: "font.work-sans", titres: "font.roboto-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#0b0b0c33",
});
const NOIR = "#0b0b0c", ORANGE = "#c2410c";

const sommaireModele = modeleV2({
  id: identifiantV2(139, "sommaire"), concept: "c-139-sommaire",
  name: "Sommaire", family: FAM,
  description: "Pour un cabinet de conseil aux entreprises : quatre rangées géantes numérotées en capitales condensées, qui se remplissent d'orange et glissent au survol, puis horaires, contact et lettre. Blanc, noir, orange ; très franc.",
  tags: ["conseil", "accompagnement", "sommaire", "rangées", "capitales", "blanc", "noir", "orange", "angles droits"],
  identity: sommaire,
  racine: racineDe("#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const mot = k.T("<p>Conseiller. Accompagner. Durer.</p>", { fontFamily: S.font, fontSize: "fluid:19-26", fontWeight: "300", color: NOIR, lineHeight: 1.3, letterSpacing: "-0.01em" });
    const entete = G.ligne(k, [caps(k, "Sommaire", { couleur: ORANGE, suivi: "0.24em" }), mot], { gap: "10px 40px", aligne: "baseline", justifie: "space-between", largeur: "100%" });
    const opt = { police: S.head, couleur: NOIR, filet: NOIR, fondSurvol: ORANGE, couleurSurvol: "#ffffff", focus: ORANGE };
    const rangees = k.col([ligneIndex(k, "01", "Nous contacter", "/contact", opt), ligneIndex(k, "02", "Nos publications", "/blog", opt), ligneIndex(k, "03", "Questions fréquentes", "/faq", opt), ligneIndex(k, "04", "Espace client", "/connexion", opt)], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: NOIR });
    const haut = G.bande(k, [entete, rangees], { fond: "#ffffff", colonne: true, gap: "36px", padV: ["96px", "72px", "52px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Sommaire" });
    const c1 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: NOIR, poids: 1.1, tailleTitre: "13px" });
    const c2 = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: NOIR, survol: ORANGE, focus: ORANGE })], { couleurTitre: NOIR, poids: 1.1, tailleTitre: "13px" });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Un courriel, de temps en temps, pour les dirigeants.", bouton: "S'abonner", largeur: "380px", accent: ORANGE, couleurTitre: NOIR, survolBouton: NOIR, survolTexte: "#ffffff", soulignement: "3px" });
    const c3 = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [c1, c2, c3], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, mentions], { fond: "#ffffff", colonne: true, gap: "40px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Infos" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-140 « Deux voix » — conseil en ressources humaines et en organisation
// Idée : un pied PARTAGÉ EN DEUX À PLEINE LARGEUR. À gauche un aplat aubergine avec la phrase « Bien conseiller, c'est d'abord bien écouter. » en serif et un bouton sable qui s'éclaire ; à droite un aplat sable
// avec ressources, horaires, coordonnées et lettre en colonnes serrées. Une barre aubergine ferme le tout avec les mentions. Un carré lilas « respire » devant le libellé.
// Polices : DM Serif Display (titres) et DM Sans (texte). Mobile : l'aplat aubergine passe au-dessus, le sable dessous.
const voix = identite({
  key: "c140", label: "Aubergine et sable", humeur: "light",
  fond: "#f1e9dc", texte: "#2a1740", discret: "#5b4a6d", accent: "#5a2a82", surface: "#e7dcc9", encre: "#2a1740",
  police: "font.dm-sans", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#2a174033",
});
const AUBERGINE = "#2a1740", SABLE = "#f1e9dc", PRUNE = "#5a2a82", LILAS = "#d9c7f2";

const deuxVoix = modeleV2({
  id: identifiantV2(140, "deux-voix"), concept: "c-140-deux-voix",
  name: "Deux voix", family: FAM,
  description: "Pour un conseil en ressources humaines ou en organisation : pied coupé en deux aplats, aubergine avec phrase en serif et bouton, sable avec ressources, horaires, contact et lettre, barre de mentions. Humain, posé, à angles droits.",
  tags: ["conseil", "ressources humaines", "organisation", "aubergine", "sable", "deux aplats", "serif", "angles droits"],
  identity: voix,
  racine: racineDe(AUBERGINE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Bien conseiller,<br>c'est d'abord<br><span style="color:${LILAS}">bien écouter.</span></p>`, { taille: [38, 80], tablette: { taille: [56, 76] }, mobile: { taille: [40, 56] }, lh: 1.06, suivi: "-0.01em", poids: "400", police: S.head, couleur: "#ffffff" })(k, env);
    const carreRespire = souffle(carre(k, LILAS, "12px"), 3400);
    const parlons = lien(k, "Parlons-en", "/contact", { taille: 15, poids: "700", casse: "uppercase", suivi: "0.1em", couleur: AUBERGINE, h: "52px", padH: "30px", survol: { backgroundColor: "#ffffff", color: AUBERGINE, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: SABLE, borderRadius: "0px", justifyContent: "center", alignSelf: "flex-start" } });
    const gauche = k.col([k.row([carreRespire, caps(k, "Conseil en ressources humaines", { couleur: LILAS, suivi: "0.2em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), phrase, k.T("<p>Un entretien suffit pour poser le sujet. Nous vous répondons avec une proposition claire.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#e6dcf3", fontFamily: S.font, maxWidth: "400px" }), parlons], { backgroundColor: AUBERGINE, flexGrow: 6, flexBasis: "0px", minWidth: "320px", gap: "26px", paddingTop: "96px", paddingBottom: "80px", paddingLeft: "48px", paddingRight: "56px", borderRadius: "0px" }, { paddingTop: "64px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    // aplat sable : ressources, horaires, coordonnées, lettre
    const res = [["Accueil", "/"], ["Publications", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const cRes = bloc(k, "Ressources", res.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: AUBERGINE, survol: { color: PRUNE, transform: { x: 6 } }, focus: PRUNE })), { couleurTitre: PRUNE, gap: "0px", min: "180px" });
    const cHor = bloc(k, "Horaires", [horaires(k, { taille: 15, couleur: AUBERGINE })], { couleurTitre: PRUNE, min: "200px", poids: 1.1 });
    const cCoo = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, couleur: AUBERGINE, lien: AUBERGINE, survol: PRUNE, focus: PRUNE })], { couleurTitre: PRUNE, min: "200px", poids: 1.1 });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Un message de temps en temps, pas plus.", bouton: "S'abonner", largeur: "340px", accent: PRUNE, texte: AUBERGINE, couleurTitre: PRUNE, couleurIntro: "#4d3d60", survolBouton: AUBERGINE, survolTexte: "#ffffff", surBouton: "#ffffff" });
    const cAbo = G.colonne(k, [abo], { poids: 1.3, min: "260px" });
    const grille = G.ligne(k, [cRes, cHor, cCoo], { gap: "36px 36px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const droite = k.col([grille, trait(k, "#2a174033"), cAbo], { backgroundColor: SABLE, flexGrow: 6, flexBasis: "0px", minWidth: "320px", gap: "32px", paddingTop: "96px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "48px", borderRadius: "0px" }, { paddingTop: "56px", paddingBottom: "48px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const deux = { type: "container", name: "Deux aplats", props: { full: true }, children: [gauche, droite], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", gap: "0px", alignItems: "stretch", backgroundColor: AUBERGINE }) };
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6c9e6", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: AUBERGINE, colonne: true, gap: "0px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    bas.styles.desktop = { ...bas.styles.desktop, color: "#ffffff" }; // la ligne légale de la plateforme reprend la couleur de la dernière bande : claire sur aubergine
    return [G.racine(k, [deux, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Conseil et services aux entreprises", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : conseil, audit, stratégie et services aux entreprises.",
  models: [rapportAnnuel, salleDuConseil, tableauDeControle, sommaireModele, deuxVoix],
};
