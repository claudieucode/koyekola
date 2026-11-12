// Famille v2 « Entreprises et PME » — 5 modèles (ft2-126 à ft2-130), extension « carrée » : ANGLES DROITS partout (aucun border-radius), standard et très professionnel.
// Pieds d'entreprise générale (PME, bureau d'études, société de services) : cartouche à filets, bloc d'engagements, bande « parlons-en » rouge, annuaire de services, équipes joignables.
// Contenu utile et réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre
// ni certificat inventé : les libellés de « certifications » sont des EXEMPLES à remplacer dans l'éditeur (dit dans la page). Adresses de réseaux : exemples (page d'accueil du réseau).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce », le moteur coupe les transitions et les animations d'attention) :
//   · transitions longues et douces de 360 ms (couleur, fond, filet qui s'épaissit, décalage de 2 à 8 px, retrait qui grandit) ;
//   · au moins une animation visible par modèle : carré de statut qui « respire », carte qui se soulève, rangée dont le retrait s'élargit, bloc dont le filet d'accent s'épaissit, bouton qui s'inverse.
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu (voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "pme-entreprise";
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

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-126 « Cartouche d'entreprise » — PME, société de services
// Idée : le pied d'un DOSSIER D'ENTREPRISE. Un cartouche à filets : un grand tableau à contour marine, quatre cellules numérotées 01 à 04 (coordonnées, horaires, liens, engagements) séparées par des filets fins ;
// chaque cellule s'éclaircit au survol. Au-dessus, le nom de la société et deux boutons carrés ; carré de statut qui « respire » à côté de « Horaires ». Dessous, bande marine : lettre et mentions.
// Les trois étiquettes d'engagements (Qualité, Environnement, Sécurité) sont des EXEMPLES sans numéro de certificat. Polices : IBM Plex Sans (titres) et Source Sans 3. Mobile : cellules empilées, filets horizontaux.
const cartouche = identite({
  key: "c126", label: "Gris papier, marine et bleu acier", humeur: "light",
  fond: "#f3f4f6", texte: "#0f2a47", discret: "#46556a", accent: "#1f5fa8", surface: "#ffffff", encre: "#0f2a47",
  police: "font.source-sans-3", titres: "font.ibm-plex-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0f2a4733",
});
const MARINE = "#0f2a47", ACIER = "#1f5fa8", PAPIER = "#f3f4f6";

const cartoucheEntreprise = modeleV2({
  id: identifiantV2(126, "cartouche-d-entreprise"), concept: "c-126-cartouche-d-entreprise",
  name: "Cartouche d'entreprise", family: FAM,
  description: "Pour une PME ou une société de services : nom de l'entreprise, deux boutons carrés, puis un cartouche à filets en quatre cellules numérotées (contact, horaires, liens, engagements) et une bande marine pour la lettre. Sobre, rigoureux, angles droits.",
  tags: ["PME", "entreprise", "cartouche", "tableau à filets", "marine", "angles droits", "horaires", "contact"],
  identity: cartouche,
  racine: racineDe(MARINE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · tête : nom de la société + phrase, deux boutons carrés
    const nom = nomDuSite(k, env, 38, MARINE);
    const mot = k.T("<p>Une équipe, un interlocuteur, des réponses claires : écrivez-nous, nous revenons vers vous.</p>", { fontSize: "17px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "480px" });
    const gauche = G.colonne(k, [caps(k, "Société", { couleur: ACIER, suivi: "0.2em" }), nom, mot], { poids: 6, min: "300px", gap: "12px" });
    const bouton = (t, u, plein) => lien(k, t, u, { taille: 16, poids: "700", couleur: plein ? "#ffffff" : MARINE, h: "52px", padH: "28px", survol: plein ? { backgroundColor: ACIER, color: "#ffffff", transform: { y: -3 } } : { backgroundColor: MARINE, color: "#ffffff", transform: { y: -3 } }, focus: ACIER, extra: { backgroundColor: plein ? MARINE : undefined, borderStyle: "solid", borderWidth: "2px", borderColor: MARINE, justifyContent: "center" } });
    const droite = G.colonne(k, [k.row([bouton("Nous contacter", "/contact", true), bouton("Questions fréquentes", "/faq", false)], { gap: "12px" })], { poids: 5, min: "290px", soi: "flex-end", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const tete = G.bande(k, [gauche, droite], { fond: PAPIER, gap: "32px 48px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Société" });
    // 2 · le cartouche : quatre cellules numérotées, contour marine de 2 px, filets de 1 px entre les cellules
    const cellule = (num, titre, enfants, o = {}) => {
      const entete = k.row([caps(k, num, { couleur: ACIER, suivi: "0.16em" }), ...(o.statut ? [souffle(carre(k, ACIER, "10px"), 3000)] : []), caps(k, titre, { couleur: MARINE })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
      const c = k.col([entete, ...enfants], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "16px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: PAPIER, borderStyle: "solid", borderWidth: "0px", borderRightWidth: o.dernier ? "0px" : "1px", borderBottomWidth: "0px", borderColor: "#0f2a4755", borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", borderRightWidth: "0px", borderBottomWidth: o.dernier ? "0px" : "1px" });
      c.states = { hover: { backgroundColor: "#ffffff" } };
      return c;
    };
    const liensCell = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: MARINE, survol: { color: ACIER, transform: { x: 6 } }, focus: ACIER }));
    const etiquettes = k.row(["Qualité", "Environnement", "Sécurité"].map((t) => k.T(`<p><strong>${t}</strong></p>`, { fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: S.font, color: MARINE, borderStyle: "solid", borderWidth: "1.5px", borderColor: MARINE, borderRadius: "0px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px" })), { gap: "8px" });
    const noteEng = k.T("<p>Libellés d'exemple : remplacez-les par vos propres certifications dans l'éditeur.</p>", { fontSize: "14px", lineHeight: 1.5, color: S.mute, fontFamily: S.font });
    const grille = G.ligne(k, [
      cellule("01", "Coordonnées", [coordonnees(k, { taille: 15, lien: MARINE, survol: ACIER, focus: ACIER })]),
      cellule("02", "Horaires", [horaires(k, { taille: 15 })], { statut: true }),
      cellule("03", "Liens utiles", [k.col(liensCell, { gap: "0px" })]),
      cellule("04", "Engagements", [etiquettes, noteEng], { dernier: true }),
    ], { gap: "0px", aligne: "stretch", largeur: "100%" });
    grille.styles.desktop = { ...grille.styles.desktop, borderStyle: "solid", borderWidth: "2px", borderColor: MARINE, borderRadius: "0px", backgroundColor: PAPIER };
    const bandeCartouche = G.bande(k, [grille], { fond: PAPIER, colonne: true, padV: ["16px", "16px", "8px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Cartouche" });
    // 3 · bande marine : lettre et mentions
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouvelles de l'entreprise, par courriel, sans excès.", bouton: "S'abonner", largeur: "460px", accent: "#ffffff", surBouton: MARINE, texte: "#e6edf6", couleurTitre: "#ffffff", fond: MARINE, survolBouton: "#cfe0f5", survolTexte: MARINE, focus: "#ffffff" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c9d6e6", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [abo, trait(k, "#ffffff33"), mentions], { fond: MARINE, colonne: true, gap: "32px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Lettre" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, bandeCartouche, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-127 « Engagements en bloc » — entreprise qui met ses valeurs en avant
// Idée : quatre BLOCS contigus (Qualité, Environnement, Sécurité, Formation) qui touchent les bords de l'écran, chacun coiffé d'un filet ocre : au survol le bloc se soulève et le filet s'épaissit doucement.
// Dessous, le pied vert forêt : nom, liens, coordonnées avec horaires, lettre. Les blocs ne citent aucun chiffre ni certificat (titres et phrases génériques, liens vers FAQ et contact).
// Polices : Plus Jakarta Sans (titres, graisse 800) et Source Sans 3. Mobile : blocs en pile, un par ligne.
const foret = identite({
  key: "c127", label: "Vert forêt, ocre et ivoire", humeur: "dark",
  fond: "#0d3b2e", texte: "#f4f1e8", discret: "#b9cfc4", accent: "#e3b04b", surface: "#12493a", encre: "#0d3b2e", surEncre: "#f4f1e8",
  police: "font.source-sans-3", titres: "font.plus-jakarta-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#f4f1e840",
});
const FORET = "#0d3b2e", FORET2 = "#0a2f24", FORET3 = "#12493a", OCRE = "#e3b04b", IVOIRE = "#f4f1e8";

const engagementsEnBloc = modeleV2({
  id: identifiantV2(127, "engagements-en-bloc"), concept: "c-127-engagements-en-bloc",
  name: "Engagements en bloc", family: FAM,
  description: "Pour une entreprise qui défend ses valeurs : quatre blocs contigus (qualité, environnement, sécurité, formation) à filet ocre qui s'épaissit au survol, puis un pied vert forêt avec nom, liens, contact, horaires et lettre d'information.",
  tags: ["entreprise", "valeurs", "engagements", "vert forêt", "ocre", "blocs", "angles droits"],
  identity: foret,
  racine: racineDe(FORET),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · quatre blocs contigus de bord à bord
    const bloc4 = (num, titre, texte, url) => {
      const t = lien(k, titre, url, { taille: 26, poids: "800", police: S.head, couleur: IVOIRE, survol: { color: OCRE }, focus: OCRE, h: "44px", lh: 1.1 });
      const c = k.col([caps(k, num, { couleur: OCRE, suivi: "0.2em" }), t, k.T(`<p>${texte}</p>`, { fontSize: "16px", lineHeight: 1.55, color: S.mute, fontFamily: S.font })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "10px", paddingTop: "36px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", backgroundColor: FORET3, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: OCRE, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "20px", paddingRight: "20px" });
      c.states = { hover: { transform: { y: -6 }, borderTopWidth: "14px", backgroundColor: "#16553f" } };
      return c;
    };
    const rang = G.ligne(k, [
      bloc4("01", "Qualité", "Un travail suivi du début à la fin, expliqué simplement.", "/faq"),
      bloc4("02", "Environnement", "Des choix concrets pour réduire notre empreinte.", "/blog"),
      bloc4("03", "Sécurité", "Des règles claires pour protéger équipes et clients.", "/faq"),
      bloc4("04", "Formation", "Des équipes qui progressent, des clients mieux conseillés.", "/contact"),
    ], { gap: "2px", aligne: "stretch", largeur: "100%" });
    const bandeBlocs = G.bande(k, [rang], { fond: FORET, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Engagements" });
    // 2 · pied vert : nom + phrase, liens, coordonnées et horaires, lettre
    const nom = nomDuSite(k, env, 30, IVOIRE);
    const intro = k.T("<p>Ensemble, on construit un travail dont on peut être fier. Une question ? Nous répondons.</p>", { fontSize: "16px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "340px" });
    const colNom = G.colonne(k, [caps(k, "Entreprise", { couleur: OCRE, suivi: "0.2em" }), nom, intro], { poids: 1.4, min: "260px", gap: "12px" });
    const rapide = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Espace client", "/connexion"]];
    const colLiens = bloc(k, "Liens utiles", rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: OCRE, transform: { x: 6 } }, focus: OCRE })), { couleurTitre: OCRE, gap: "0px", min: "200px" });
    const pt = souffle(carre(k, OCRE, "10px"), 3000);
    const colContact = G.colonne(k, [k.row([pt, caps(k, "Nous joindre", { couleur: OCRE })], { gap: "10px", alignItems: "center" }), coordonnees(k, { taille: 15, lien: IVOIRE, survol: OCRE, focus: OCRE }), horaires(k, { taille: 15 })], { poids: 1.3, min: "240px", gap: "14px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos actualités, quelques fois par an.", bouton: "S'abonner", largeur: "340px", accent: OCRE, surBouton: FORET, texte: IVOIRE, couleurTitre: OCRE, fond: FORET, survolBouton: IVOIRE, survolTexte: FORET, focus: OCRE });
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [colNom, colLiens, colContact, colLettre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: FORET, colonne: true, gap: "40px", padV: ["72px", "56px", "48px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Pied" });
    return [G.racine(k, [bandeBlocs, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-128 « Parlons de votre projet » — agence, entreprise de conseil ou de services à la recherche de contacts
// Idée : le pied coupé en DEUX PANNEAUX de bord à bord. À gauche un grand aplat rouge carmin avec la phrase « Parlons de votre projet. » en grandes capitales blanches et un bouton carré blanc qui devient noir ;
// à droite, sur blanc, deux colonnes sobres (liens, coordonnées et horaires) et la lettre. Une barre noire étroite porte les mentions. Mobile : le panneau rouge passe au-dessus, tout en pile.
// Polices : Archivo (titres, 800) et Source Sans 3.
const carmin = identite({
  key: "c128", label: "Blanc, carmin et noir", humeur: "light",
  fond: "#ffffff", texte: "#111111", discret: "#4b4b4b", accent: "#c8102e", surface: "#f2f2f2", encre: "#111111",
  police: "font.source-sans-3", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#11111133",
});
const CARMIN = "#c8102e", NOIR = "#111111";

const parlonsProjet = modeleV2({
  id: identifiantV2(128, "parlons-de-votre-projet"), concept: "c-128-parlons-de-votre-projet",
  name: "Parlons de votre projet", family: FAM,
  description: "Pour une entreprise de services ou de conseil : deux panneaux de bord à bord, un aplat carmin avec la phrase d'invitation en grandes capitales et un bouton carré, face à des colonnes blanches (liens, contact, horaires, lettre). Franc et très lisible.",
  tags: ["entreprise", "conseil", "services", "carmin", "blanc", "deux panneaux", "capitales", "angles droits"],
  identity: carmin,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · panneau rouge (invitation)
    const phrase = G.geant(`<p>Parlons<br>de votre<br>projet.</p>`, { taille: [52, 100], tablette: { taille: [80, 100] }, mobile: { taille: [52, 72] }, lh: 0.98, suivi: "-0.015em", poids: "800", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const intro = k.T("<p>Un devis, une question, une idée à vérifier : dites-nous où vous en êtes, nous vous répondons.</p>", { fontSize: "17px", lineHeight: 1.55, color: "#ffffff", fontFamily: S.font, maxWidth: "380px" });
    const btn = lien(k, "Écrire à l'équipe", "/contact", { taille: 16, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: CARMIN, h: "54px", padH: "30px", survol: { backgroundColor: NOIR, color: "#ffffff", transform: { x: 6 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", justifyContent: "center", alignSelf: "flex-start", borderStyle: "solid", borderWidth: "2px", borderColor: "#ffffff" } });
    const panneauRouge = G.colonne(k, [caps(k, "Nouveau projet", { couleur: "#ffffff", suivi: "0.22em" }), phrase, intro, btn], { poids: 6, min: "420px", gap: "24px", extra: { backgroundColor: CARMIN, paddingTop: "88px", paddingBottom: "88px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    // 2 · panneau blanc : liens, contact, horaires, lettre
    const rapide = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const colLiens = bloc(k, "Liens utiles", rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: NOIR, survol: { color: CARMIN, transform: { x: 6 } }, focus: CARMIN })), { couleurTitre: CARMIN, gap: "0px", min: "180px" });
    const pt = souffle(carre(k, CARMIN, "10px"), 3200);
    const colContact = G.colonne(k, [caps(k, "Nous joindre", { couleur: CARMIN }), coordonnees(k, { taille: 15, lien: NOIR, survol: CARMIN, focus: CARMIN }), k.row([pt, caps(k, "Horaires", { couleur: CARMIN })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })], { poids: 1, min: "220px", gap: "12px" });
    const hautDroit = G.ligne(k, [colLiens, colContact], { gap: "32px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos actualités, par courriel, sans excès.", bouton: "S'abonner", largeur: "420px", accent: CARMIN, surBouton: "#ffffff", texte: NOIR, couleurTitre: CARMIN, fond: "#ffffff", survolBouton: NOIR, survolTexte: "#ffffff", focus: NOIR });
    const panneauBlanc = G.colonne(k, [hautDroit, trait(k, S.line), abo], { poids: 6, min: "420px", gap: "32px", extra: { backgroundColor: "#ffffff", paddingTop: "88px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    panneauBlanc.children = panneauBlanc.children.map((c) => { c.styles.desktop = { ...c.styles.desktop, width: "100%" }; return c; });
    const panneaux = G.bande(k, [panneauRouge, panneauBlanc], { fond: "#ffffff", gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Panneaux" });
    // 3 · barre noire : mentions
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d4d4d4", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { fond: NOIR, colonne: true, padV: ["24px", "22px", "18px"], padB: ["24px", "22px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [panneaux, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-129 « Annuaire des services » — société de services, bureau d'études, cabinet de maintenance
// Idée : un INDEX comme au dos d'un catalogue. À gauche le titre « Nos services » en serif et un bouton ; à droite six rangées numérotées pleine largeur séparées par des filets : au survol la rangée s'éclaircit
// et son retrait grandit doucement. Dessous une barre ardoise : contact, horaires, lettre, mentions. Les six services sont des rubriques d'EXEMPLE à renommer. Polices : Source Serif 4 (titres) et Libre Franklin.
// Mobile : titre au-dessus, rangées pleine largeur, barre ardoise en pile.
const sable = identite({
  key: "c129", label: "Sable, ardoise et cuivre", humeur: "light",
  fond: "#ece6d6", texte: "#26323f", discret: "#4d5865", accent: "#9c4a12", surface: "#f6f2e8", encre: "#26323f",
  police: "font.libre-franklin", titres: "font.source-serif-4",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#26323f44",
});
const SABLE = "#ece6d6", ARDOISE = "#26323f", CUIVRE = "#9c4a12", CLAIR = "#f6f2e8";

const annuaireServices = modeleV2({
  id: identifiantV2(129, "annuaire-des-services"), concept: "c-129-annuaire-des-services",
  name: "Annuaire des services", family: FAM,
  description: "Pour une société de services : titre en serif et six rangées numérotées en index, dont le retrait s'élargit au survol, puis une barre ardoise avec contact, horaires, lettre et mentions. Sable, ardoise et cuivre, comme un catalogue.",
  tags: ["services", "index numéroté", "annuaire", "sable", "ardoise", "cuivre", "angles droits", "serif"],
  identity: sable,
  racine: racineDe(ARDOISE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · gauche : titre serif + phrase + bouton carré
    const titre = G.geant(`<p>Nos<br>services.</p>`, { taille: [52, 112], tablette: { taille: [72, 96] }, mobile: { taille: [52, 72] }, lh: 1.0, suivi: "-0.02em", poids: "600", police: S.head, couleur: ARDOISE })(k, env);
    const phrase = k.T("<p>Une liste claire de ce que nous faisons. Choisissez une rubrique ou écrivez-nous : nous orienterons votre demande.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "380px" });
    const btn = lien(k, "Demander un devis", "/contact", { taille: 16, poids: "700", couleur: "#ffffff", h: "52px", padH: "28px", survol: { backgroundColor: ARDOISE, color: "#ffffff", transform: { y: -3 } }, focus: ARDOISE, extra: { backgroundColor: CUIVRE, justifyContent: "center", alignSelf: "flex-start" } });
    const gauche = G.colonne(k, [caps(k, "Catalogue", { couleur: CUIVRE, suivi: "0.22em" }), titre, phrase, btn], { poids: 5, min: "300px", gap: "22px" });
    // 2 · droite : six rangées numérotées, filets fins ; au survol : fond clair et retrait qui grandit
    const SERVICES = [["01", "Conseil et audit", "/contact"], ["02", "Étude et conception", "/contact"], ["03", "Réalisation", "/blog"], ["04", "Suivi et maintenance", "/faq"], ["05", "Formation", "/blog"], ["06", "Assistance", "/faq"]];
    const rangee = ([num, t, u]) => {
      const lienRang = lien(k, t, u, { taille: 22, poids: "600", police: S.head, couleur: ARDOISE, survol: { color: CUIVRE }, focus: CUIVRE, h: "56px", extra: { flexGrow: 1 } });
      const fl = k.T("<p>→</p>", { fontSize: "20px", color: CUIVRE, fontFamily: S.font, lineHeight: 1 });
      const r = k.row([caps(k, num, { couleur: CUIVRE, suivi: "0.16em", extra: { minWidth: "32px" } }), lienRang, fl], { flexWrap: "nowrap", alignItems: "center", gap: "16px", width: "100%", paddingLeft: "0px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#26323f55", borderRadius: "0px", backgroundColor: SABLE, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ffffff", paddingLeft: "20px" } };
      return r;
    };
    const liste = k.col(SERVICES.map(rangee), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: ARDOISE });
    const droite = G.colonne(k, [liste], { poids: 6, min: "320px", extra: { alignSelf: "stretch", justifyContent: "flex-end" } });
    const haut = G.bande(k, [gauche, droite], { fond: SABLE, gap: "48px 72px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Index" });
    // 3 · barre ardoise
    const colContact = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, couleur: "#f6f2e8", lien: "#ffffff", survol: "#f0c8a0", focus: "#ffffff" })], { couleurTitre: "#f0c8a0", gap: "12px" });
    const pt = souffle(carre(k, "#f0c8a0", "10px"), 3200);
    const colHor = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: "#f0c8a0" })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: "#f6f2e8" })], { poids: 1, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos actualités et nos conseils, par courriel.", bouton: "S'abonner", largeur: "380px", accent: "#f0c8a0", surBouton: ARDOISE, texte: "#f6f2e8", couleurTitre: "#f0c8a0", fond: ARDOISE, survolBouton: "#ffffff", survolTexte: ARDOISE, focus: "#ffffff" });
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [colContact, colHor, colLettre], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d5c9", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#f6f2e833"), mentions], { fond: ARDOISE, colonne: true, gap: "36px", padV: ["64px", "52px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Barre" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-130 « Équipes joignables » — PME avec plusieurs services (commercial, comptabilité, recrutement, assistance)
// Idée : un ANNUAIRE DES ÉQUIPES. À gauche, le nom de la société, une phrase et la lettre ; à droite, quatre cartes carrées (Commercial, Comptabilité, Recrutement, Assistance) à liseré turquoise vertical : au survol la carte
// se soulève et son contour passe au turquoise. Chaque carte renvoie vers la page de contact (les adresses réelles viennent des Données de l'entreprise). Dessous : coordonnées, horaires, mentions.
// Polices : Manrope (titres) et IBM Plex Mono (libellés). Mobile : colonne de cartes pleine largeur.
const pierre = identite({
  key: "c130", label: "Pierre claire, noir et turquoise", humeur: "light",
  fond: "#eceae6", texte: "#121212", discret: "#4a4a46", accent: "#0b6e6d", surface: "#ffffff", encre: "#121212",
  police: "font.manrope", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#12121233",
});
const PIERRE = "#eceae6", TURQ = "#0b6e6d", ENCRE = "#121212";

const equipesJoignables = modeleV2({
  id: identifiantV2(130, "equipes-joignables"), concept: "c-130-equipes-joignables",
  name: "Équipes joignables", family: FAM,
  description: "Pour une PME à plusieurs services : nom de la société et lettre à gauche, quatre cartes carrées (commercial, comptabilité, recrutement, assistance) à liseré turquoise qui se soulèvent au survol, puis contact, horaires et mentions.",
  tags: ["PME", "équipes", "annuaire", "cartes carrées", "turquoise", "pierre", "mono", "angles droits"],
  identity: pierre,
  racine: racineDe(PIERRE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · gauche : nom, phrase, lettre
    const nom = nomDuSite(k, env, 40, ENCRE, { fontFamily: S.font, fontWeight: "800" });
    const mot = k.T("<p>Chaque équipe a son interlocuteur. Choisissez le bon service pour une réponse plus rapide.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "380px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouvelles de l'entreprise, par courriel.", bouton: "S'abonner", largeur: "380px", accent: TURQ, surBouton: "#ffffff", texte: ENCRE, couleurTitre: TURQ, fond: PIERRE, survolBouton: ENCRE, survolTexte: "#ffffff", focus: ENCRE, soulignement: "2px" });
    const gauche = G.colonne(k, [caps(k, "Société", { couleur: TURQ, suivi: "0.2em", police: S.head }), nom, mot, abo], { poids: 5, min: "300px", gap: "20px" });
    // 2 · droite : quatre cartes carrées 2 × 2
    const carteEquipe = (num, titre, texte, url) => {
      const t = lien(k, `${titre}`, url, { taille: 20, poids: "800", couleur: ENCRE, survol: { color: TURQ }, focus: TURQ, h: "44px" });
      const e = lien(k, "Écrire à l'équipe →", url, { taille: 15, poids: "700", couleur: TURQ, soulign: true, survol: { color: ENCRE, transform: { x: 6 } }, focus: ENCRE });
      const contenu = k.col([caps(k, num, { couleur: TURQ, police: S.head, suivi: "0.16em" }), t, k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font }), e], { flexGrow: 1, flexBasis: "0px", minWidth: "0px", gap: "8px", paddingTop: "24px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "24px", borderRadius: "0px" });
      const lisere = k.col([], { width: "8px", flexShrink: 0, alignSelf: "stretch", backgroundColor: TURQ, borderRadius: "0px" });
      const c = k.row([lisere, contenu], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", flexWrap: "nowrap", gap: "0px", alignItems: "stretch", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: ENCRE, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { transform: { y: -6 }, borderColor: TURQ, backgroundColor: "#f6fbfb" } };
      return c;
    };
    const cartes = G.ligne(k, [
      carteEquipe("01", "Commercial", "Devis, offres et rendez-vous.", "/contact"),
      carteEquipe("02", "Comptabilité", "Factures, règlements et attestations.", "/contact"),
      carteEquipe("03", "Recrutement", "Candidatures et offres d'emploi.", "/contact"),
      carteEquipe("04", "Assistance", "Aide, suivi et réclamations.", "/faq"),
    ], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const droite = G.colonne(k, [cartes], { poids: 7, min: "320px" });
    const haut = G.bande(k, [gauche, droite], { fond: PIERRE, gap: "48px 64px", aligne: "flex-start", padV: ["88px", "68px", "48px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Équipes" });
    // 3 · bas : coordonnées, horaires, liens, mentions ; épais filet noir
    const colContact = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: ENCRE, survol: TURQ, focus: TURQ })], { couleurTitre: TURQ, police: S.head });
    const pt = souffle(carre(k, TURQ, "10px"), 3000);
    const colHor = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: TURQ, police: S.head })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })], { poids: 1, min: "220px", gap: "12px" });
    const rapide = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const colLiens = bloc(k, "Liens utiles", rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: ENCRE, survol: { color: TURQ, transform: { x: 6 } }, focus: TURQ })), { couleurTitre: TURQ, police: S.head, gap: "0px", min: "180px" });
    const grille = G.ligne(k, [colContact, colHor, colLiens], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: PIERRE, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "4px", couleur: ENCRE }, nom: "Contact" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Entreprises et PME", target: 5, built: true,
  description: "Pieds d'entreprise standard et très professionnels, à angles droits : cartouche à filets, blocs d'engagements, panneau carmin, annuaire de services, équipes joignables.",
  models: [cartoucheEntreprise, engagementsEnBloc, parlonsProjet, annuaireServices, equipesJoignables],
};
