// Famille v2 « Énergie et environnement » — 5 modèles (ft2-146 à ft2-150), extension « carrée » : angles droits partout, sites standard et très professionnels, animations fluides.
// Pieds de sites ordinaires : installateur solaire, rénovation énergétique, bureau d'études environnement, recyclage, service de l'eau. Contenu utile (contact, horaires, liens, lettre d'information, mentions légales) ;
// marques fictives ; AUCUNE coordonnée, AUCUN chiffre inventé (les barres d'énergie et l'étiquette A à G sont des décors, sans valeur chiffrée ; horaires et adresse viennent des « Données de l'entreprise »).
// Les adresses de réseaux sociaux sont des EXEMPLES (page d'accueil du réseau) à remplacer dans l'éditeur. Chaque modèle a sa palette, ses polices (2 au plus) et sa composition (mode « solo »).
//
// ANGLES DROITS : identité à rayon 0, boutons / champs / cartes à 0 ; widget Horaires SANS « ouvert maintenant » (sa pastille ronde est imposée par la feuille de style partagée, sans partie réglable) ; aucun widget à icônes rondes (les réseaux sont des liens texte « Nom ↗ »).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions de survol et de focus de 360 ms (couleur, fond, filet, décalage de 4 à 10 px, soulèvement de 3 à 6 px) ;
//   · « souffle » lent (animation d'attention « pulse ») : dernière cellule de la barre d'énergie, bloc « B » de l'étiquette, repères de bureau et d'eau, premier carré du tri ;
//   · pas d'animation d'entrée, pas de widget « Défilement continu » (limites connues du moteur).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const FAM = "energie-environnement";
const DUREE = 360; // ms : transitions douces

// ── Aides LOCALES à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond, couleur) => ({ desktop: { backgroundColor: fond, ...(couleur ? { color: couleur } : {}), gap: "0px" } }); // « couleur » : texte de la ligne légale de la plateforme, ajoutée dans le pied sous la dernière bande
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Lien de texte fini par le moteur (états, 44 px mobile) puis états propres
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: DUREE, borderRadius: "0px", ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
// Bouton carré : aplat franc, bord net, se soulève au survol
function bouton(k, label, url, o = {}) {
  return lien(k, label, url, { taille: 16, poids: "700", casse: o.casse, suivi: o.suivi || "0.04em", couleur: o.texte, h: "52px", padH: "26px", police: o.police,
    survol: { backgroundColor: o.survolFond, color: o.survolTexte, borderColor: o.survolFond, transform: { y: -3 } }, focus: o.focus,
    extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center" } });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font }));
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DUREE }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px" });
const reseauxEx = [["LinkedIn", "https://www.linkedin.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]];
const listeLiens = (k, liste, o = {}) => liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, survol: o.survol, focus: o.focus, bloc: true, police: o.police }));
const abonnement = (k, env, o) => {
  const abo = GK.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "360px", accent: o.accent, texte: o.texte, rayonChamp: "0px", rayonBouton: "0px", soulignement: "3px", survolBouton: o.survolBouton, survolTexte: o.survolTexte })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre, lineHeight: 1.4, fontWeight: "700" };
  abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  if (abo.parts.consent) abo.parts.consent.styles.desktop = { ...abo.parts.consent.styles.desktop, color: o.couleurIntro || o.texte || k.S.fg };
  if (o.couleurIntro) abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro };
  if (o.couleurBouton) abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.couleurBouton };
  return abo;
};
// Cellule pleine (séparateur épais) : barre d'énergie, repères
const aplat = (k, couleur, h, o = {}) => k.divider({ width: o.l || "100%", borderColor: couleur, borderTopWidth: h, borderStyle: "solid", borderRightWidth: "0px", borderBottomWidth: "0px", borderLeftWidth: "0px", marginTop: "0px", marginBottom: "0px", flexGrow: o.grow ?? 1, flexBasis: o.base || "0px", flexShrink: o.grow === 0 ? 0 : 1, minWidth: "0px" });
// Barre d'énergie : cellules côte à côte (une « respire »)
function barre(k, couleurs, o = {}) {
  const cellules = couleurs.map((c, i) => { const n = aplat(k, c, o.h || "14px"); if (o.souffle === i) souffle(n, 3000); return n; });
  return k.row(cellules, { gap: "6px", flexWrap: "nowrap", alignItems: "stretch", width: "100%" });
}
const mentionsDe = (k, env, o = {}) => GK.ligneLegale({ taille: 13, sansCookies: true, couleur: o.couleur, liens: o.liens })(k, env);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-146 « Plein soleil » — installateur de panneaux solaires
// Idée : un pied en deux temps, comme une journée. Grand bandeau AMBRE franc (« Produisez votre lumière. » en lettres lourdes, bouton nuit « Demander une étude »), sous la phrase une BARRE D'ÉNERGIE
// de sept cellules nuit dont une respire lentement ; puis la bande bleu nuit : horaires, contact, ressources, lettre d'information, réseaux et mentions. Aucun chiffre de production inventé.
// Polices : Archivo (titres 800 et texte). Mobile : phrase, boutons, barre, colonnes en pile.
const solaire = identite({
  key: "c146", label: "Ambre franc et bleu nuit", humeur: "dark",
  fond: "#0f1f35", texte: "#ffffff", discret: "#b9c6d8", accent: "#ffb400", surface: "#17294a", encre: "#0f1f35", surEncre: "#ffffff",
  police: "font.archivo", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#ffffff33",
});
const AMBRE = "#ffb400", NUIT = "#0f1f35", NUIT2 = "#0a1626";

const pleinSoleil = modeleV2({
  id: identifiantV2(146, "plein-soleil"), concept: "c-146-plein-soleil",
  name: "Plein soleil", family: FAM,
  description: "Pour un installateur solaire : grand bandeau ambre « Produisez votre lumière » avec bouton d'étude et barre d'énergie dont une cellule respire, puis bande bleu nuit (horaires, contact, ressources, lettre).",
  tags: ["solaire", "photovoltaïque", "ambre", "bleu nuit", "barre d'énergie", "angles droits", "devis"],
  identity: solaire,
  racine: racineDe(NUIT),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bandeau ambre : phrase géante, texte, boutons, barre d'énergie
    const sur = caps(k, "Énergie solaire", { couleur: NUIT });
    const phrase = G.geant(`<p>Produisez<br>votre lumière.</p>`, { taille: [48, 116], tablette: { taille: [80, 104] }, mobile: { taille: [48, 76] }, lh: 0.98, suivi: "-0.035em", poids: "800", police: S.head, couleur: NUIT })(k, env);
    const intro = k.T("<p>Étude de toiture, installation, suivi : un interlocuteur unique, un devis clair, sans engagement.</p>", { fontSize: "17px", lineHeight: 1.55, color: NUIT, fontFamily: S.font, maxWidth: "400px" });
    const boutons = k.row([bouton(k, "Demander une étude", "/contact", { texte: AMBRE, fond: NUIT, survolFond: NUIT2, survolTexte: "#ffffff", focus: NUIT }), bouton(k, "Questions fréquentes", "/faq", { texte: NUIT, bord: NUIT, survolFond: NUIT, survolTexte: AMBRE, focus: NUIT })], { gap: "12px" });
    const gauche = G.colonne(k, [sur, phrase], { poids: 7, min: "300px", gap: "16px" });
    const droite = G.colonne(k, [intro, boutons], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" });
    const haut = G.ligne(k, [gauche, droite], { gap: "36px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const cellules = barre(k, [NUIT, NUIT, NUIT, NUIT, "#0f1f35aa", "#0f1f3577", "#0f1f3533"], { h: "14px", souffle: 4 });
    const bandeau = G.bande(k, [haut, cellules], { colonne: true, gap: "44px", fond: AMBRE, padV: ["88px", "68px", "48px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Soleil" });
    // 2 · bande bleu nuit : quatre colonnes
    const colHoraires = bloc(k, "Horaires d'accueil", [horaires(k)], { couleurTitre: AMBRE, poids: 1.1 });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { lien: S.fg, survol: AMBRE, focus: AMBRE })], { couleurTitre: AMBRE, poids: 1.1 });
    const colLiens = bloc(k, "Ressources", listeLiens(k, [["Actualités et conseils", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Nous écrire", "/contact"]], { survol: { color: AMBRE, transform: { x: 4 } }, focus: AMBRE }), { couleurTitre: AMBRE, gap: "0px", min: "200px" });
    const abo = abonnement(k, env, { titre: "La lettre du solaire", intro: "Conseils d'entretien et actualités des aides : un message de temps en temps.", accent: AMBRE, couleurTitre: AMBRE, survolBouton: "#ffffff", survolTexte: NUIT });
    const colLettre = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [colHoraires, colContact, colLiens, colLettre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const reseaux = G.reseauxTexte(reseauxEx, { survol: AMBRE, focus: AMBRE, taille: 14 })(k, env);
    const mentions = mentionsDe(k, env);
    const nuit = G.bande(k, [grille, trait(k, S.line), k.row([reseaux], { width: "100%" }), mentions], { colonne: true, gap: "32px", fond: NUIT, padV: ["72px", "56px", "48px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Nuit" });
    return [G.racine(k, [bandeau, nuit])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-147 « Étiquette énergie » — rénovation énergétique de l'habitat
// Idée : l'ÉTIQUETTE A à G des logements en escalier, dessinée à angles droits (sept blocs qui s'allongent du vert au rouge ; le bloc « B » respire lentement, comme un objectif ; chaque bloc glisse au survol).
// À gauche, la phrase « Consommer moins, vivre mieux. » et deux boutons. Dessous, une bande vert très pâle : horaires, contact, ressources, lettre. L'étiquette est un DÉCOR : aucune classe ni chiffre inventé
// (une note le dit). Polices : Plus Jakarta Sans (titres 800 et texte). Fond blanc, vert forêt. Mobile : phrase, boutons, étiquette pleine largeur, colonnes en pile.
const etiquette = identite({
  key: "c147", label: "Blanc et vert forêt", humeur: "light",
  fond: "#ffffff", texte: "#0e2a22", discret: "#46594f", accent: "#13683a", surface: "#e8f3ec", encre: "#0e2a22", surEncre: "#ffffff",
  police: "font.plus-jakarta-sans", titres: "font.plus-jakarta-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#0e2a2233",
});
const FORET = "#0e2a22", VERT = "#13683a", PALE = "#e8f3ec";

const etiquetteEnergie = modeleV2({
  id: identifiantV2(147, "etiquette-energie"), concept: "c-147-etiquette-energie",
  name: "Étiquette énergie", family: FAM,
  description: "Pour une entreprise de rénovation énergétique : phrase « Consommer moins, vivre mieux », étiquette A à G en escalier à angles droits (le bloc B respire), puis bande vert pâle avec horaires, contact, ressources et lettre.",
  tags: ["rénovation énergétique", "isolation", "étiquette énergie", "vert", "blanc", "angles droits", "escalier"],
  identity: etiquette,
  racine: racineDe(PALE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const sur = caps(k, "Rénovation énergétique", { couleur: VERT });
    const phrase = G.geant(`<p>Consommer<br>moins,<br><span style="color:${VERT}">vivre mieux.</span></p>`, { taille: [44, 96], tablette: { taille: [68, 88] }, mobile: { taille: [44, 64] }, lh: 1.02, suivi: "-0.03em", poids: "800", police: S.head, couleur: FORET })(k, env);
    const intro = k.T("<p>Isolation, chauffage, ventilation : on regarde d'abord votre logement, puis on vous propose un plan de travaux lisible.</p>", { fontSize: "17px", lineHeight: 1.55, color: FORET, fontFamily: S.font, maxWidth: "440px" });
    const boutons = k.row([bouton(k, "Prendre rendez-vous", "/contact", { texte: "#ffffff", fond: VERT, survolFond: FORET, survolTexte: "#ffffff", focus: FORET }), bouton(k, "Nos conseils", "/blog", { texte: FORET, bord: FORET, survolFond: FORET, survolTexte: "#ffffff", focus: VERT })], { gap: "12px" });
    const gauche = G.colonne(k, [sur, phrase, intro, boutons], { poids: 6, min: "300px", gap: "22px" });
    // l'étiquette A à G : sept blocs de longueur croissante
    const CLASSES = [["A", "#1e7a34", "#ffffff", "46%"], ["B", "#4a9a35", "#0e2a22", "56%"], ["C", "#c5d63a", FORET, "66%"], ["D", "#f2d62a", FORET, "76%"], ["E", "#f4a21e", FORET, "86%"], ["F", "#ec6b25", FORET, "94%"], ["G", "#b3201a", "#ffffff", "100%"]];
    const blocs = CLASSES.map(([l, fond, txt, larg], i) => {
      const lettre = k.T(`<p>${l}</p>`, { fontFamily: S.head, fontSize: "24px", fontWeight: "800", lineHeight: 1, color: txt });
      const c = k.row([lettre], { backgroundColor: fond, width: larg, minHeight: "44px", paddingLeft: "16px", paddingRight: "16px", alignItems: "center", flexWrap: "nowrap", transitionDuration: DUREE, borderRadius: "0px" });
      c.states = { hover: { transform: { x: 10 } } };
      if (i === 1) souffle(c, 3600);
      return c;
    });
    const echelle = k.col(blocs, { gap: "6px", width: "100%", maxWidth: "460px" });
    const note = k.T("<p>Illustration : la classe réelle d'un logement est établie lors d'un diagnostic.</p>", { fontSize: "13px", lineHeight: 1.5, color: S.mute, fontFamily: S.font, maxWidth: "460px" });
    const droite = G.colonne(k, [caps(k, "Étiquette énergie", { couleur: FORET }), echelle, note], { poids: 5, min: "290px", gap: "14px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: "#ffffff", gap: "44px 64px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["80px", "64px", "44px"], padH: ["48px", "32px", "20px"], nom: "Étiquette" });
    // bande vert pâle
    const colHoraires = bloc(k, "Accueil du public", [horaires(k, { couleur: FORET })], { couleurTitre: VERT, poids: 1.1 });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { couleur: FORET, lien: FORET, survol: VERT, focus: VERT })], { couleurTitre: VERT, poids: 1.1 });
    const colLiens = bloc(k, "Ressources", listeLiens(k, [["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Contact", "/contact"]], { couleur: FORET, survol: { color: VERT, transform: { x: 4 } }, focus: VERT }), { couleurTitre: VERT, gap: "0px", min: "200px" });
    const abo = abonnement(k, env, { titre: "La lettre de l'habitat", intro: "Aides, saisons de travaux, conseils : un message de temps en temps.", accent: VERT, texte: FORET, couleurTitre: VERT, couleurIntro: S.mute, couleurBouton: "#ffffff", survolBouton: FORET, survolTexte: "#ffffff" });
    const colLettre = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [colHoraires, colContact, colLiens, colLettre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const reseaux = G.reseauxTexte(reseauxEx, { couleur: FORET, survol: VERT, focus: VERT, taille: 14 })(k, env);
    const mentions = mentionsDe(k, env, { couleur: S.mute, liens: FORET });
    const bas = G.bande(k, [grille, trait(k, S.line), k.row([reseaux], { width: "100%" }), mentions], { colonne: true, gap: "32px", fond: PALE, padV: ["64px", "52px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Infos" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-148 « Note de synthèse » — bureau d'études en environnement
// Idée : un pied de DOSSIER TECHNIQUE. Ardoise sombre, filets fins, tableau de quatre cases numérotées 01 à 04 en chiffres monospace citron vert (contact, horaires, ressources, lettre) séparées par des filets ;
// chaque case s'éclaircit doucement au survol. En tête : « Mesurer, comprendre, agir. » et bouton citron ; un repère carré qui respire marque la ligne « Études sur demande ».
// Polices : Space Grotesk (titres) et IBM Plex Mono (libellés, numéros). Mobile : tableau en pile, une case par ligne.
const synthese = identite({
  key: "c148", label: "Ardoise et citron vert", humeur: "dark",
  fond: "#13262b", texte: "#f2f6f1", discret: "#b5c7c3", accent: "#c6ec4d", surface: "#1b343a", encre: "#13262b", surEncre: "#f2f6f1",
  police: "font.ibm-plex-mono", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f2f6f133",
});
const ARDOISE = "#13262b", ARDOISE2 = "#1b343a", CITRON = "#c6ec4d";

const noteSynthese = modeleV2({
  id: identifiantV2(148, "note-de-synthese"), concept: "c-148-note-de-synthese",
  name: "Note de synthèse", family: FAM,
  description: "Pour un bureau d'études en environnement : phrase « Mesurer, comprendre, agir », bouton citron et tableau de quatre cases numérotées (contact, horaires, ressources, lettre) à filets fins, ardoise sombre et monospace.",
  tags: ["bureau d'études", "environnement", "diagnostic", "ardoise", "citron vert", "monospace", "tableau numéroté"],
  identity: synthese,
  racine: racineDe(ARDOISE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · en-tête de dossier
    const repere = souffle(aplat(k, CITRON, "12px", { l: "12px", grow: 0, base: "12px" }), 3000);
    const surligne = k.row([repere, caps(k, "Études sur demande", { couleur: CITRON, police: S.font })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Mesurer,<br>comprendre,<br><span style="color:${CITRON}">agir.</span></p>`, { taille: [44, 92], tablette: { taille: [64, 84] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.03em", poids: "700", police: S.head, couleur: S.fg })(k, env);
    const gauche = G.colonne(k, [surligne, phrase], { poids: 7, min: "300px", gap: "22px" });
    const intro = k.T("<p>Diagnostics, études d'impact, suivi de chantier et conformité : un dossier clair, des sources citées, des recommandations utiles.</p>", { fontSize: "15px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "400px" });
    const bt = bouton(k, "Demander une étude", "/contact", { texte: ARDOISE, fond: CITRON, survolFond: "#ffffff", survolTexte: ARDOISE, focus: "#ffffff", police: S.font, casse: "uppercase", suivi: "0.08em" });
    const droite = G.colonne(k, [intro, bt], { poids: 4, min: "280px", gap: "22px", soi: "flex-end" });
    const tete = G.bande(k, [gauche, droite], { fond: ARDOISE, gap: "36px 64px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Dossier" });
    // 2 · tableau de quatre cases numérotées, filets fins, case qui s'éclaircit au survol
    const cellule = (num, titre, enfants) => {
      const n = k.T(`<p>${num}</p>`, { fontFamily: S.font, fontSize: "14px", fontWeight: "700", letterSpacing: "0.1em", color: CITRON, lineHeight: 1 });
      const c = k.col([n, caps(k, titre, { couleur: S.fg, police: S.head, taille: "15px", suivi: "0.06em" }), ...enfants], { gap: "14px", flexGrow: 1, flexBasis: "0px", minWidth: "240px", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "28px", paddingRight: "24px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#f2f6f133", backgroundColor: ARDOISE, transitionDuration: 400, alignItems: "flex-start", borderRadius: "0px" });
      c.states = { hover: { backgroundColor: ARDOISE2 } };
      return c;
    };
    const abo = abonnement(k, env, { titre: "", intro: "Notes de synthèse et actualités réglementaires, de temps en temps.", accent: CITRON, couleurTitre: CITRON, survolBouton: "#ffffff", survolTexte: ARDOISE, largeur: "320px" });
    const cases = k.row([
      cellule("01", "Nous joindre", [coordonnees(k, { taille: 14, lien: S.fg, survol: CITRON, focus: CITRON })]),
      cellule("02", "Horaires", [horaires(k, { taille: 14 })]),
      cellule("03", "Ressources", listeLiens(k, [["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Contact", "/contact"]], { taille: 15, survol: { color: CITRON, transform: { x: 4 } }, focus: CITRON })),
      cellule("04", "Lettre d'information", [abo]),
    ], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderRightWidth: "1px", borderBottomWidth: "1px", borderColor: "#f2f6f133" });
    const tableau = G.bande(k, [cases], { fond: ARDOISE, colonne: true, padV: ["8px", "8px", "8px"], padB: ["8px", "8px", "8px"], padH: ["48px", "32px", "20px"], nom: "Tableau" });
    // 3 · mentions
    const reseaux = G.reseauxTexte(reseauxEx, { survol: CITRON, focus: CITRON, taille: 13, police: S.font })(k, env);
    const mentions = mentionsDe(k, env);
    const bas = G.bande(k, [trait(k, S.line), k.row([reseaux], { width: "100%" }), mentions], { colonne: true, gap: "24px", fond: ARDOISE, padV: ["40px", "36px", "32px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [tete, tableau, bas])];
  },
}, FAM);

// ft2-149 « Boucle de tri » — recyclage et gestion des déchets — REFONTE (archétype L : pied en escalier, bandes de largeurs décroissantes alignées à gauche)
// Idée : la hiérarchie du TRI en marches. Sous la phrase kraft « Ce qui se trie se transforme. », trois bandes alignées à gauche dont la largeur DÉCROÎT : 1 Réduire (la plus large, vert), 2 Réutiliser (kraft foncé), 3 Recycler (la plus étroite,
// crème à filet épais). Chaque marche est un lien : au survol elle glisse de 10 px et s'éclaircit ; le petit carré de la première respire lentement. Une base noire pleine largeur porte horaires, contact et lettre ; liens et mentions dessous.
// Les trois marches pointent vers les pages du site (conseils, questions, contact) : intitulés d'exemple à renommer dans l'éditeur. Polices : Staatliches (titres, capitales) et Work Sans (texte). Angles droits. Mobile : marches de 100, 90 et 80 %.
const tri = identite({
  key: "c149", label: "Kraft, encre et vert recyclage", humeur: "light",
  fond: "#e8d9b9", texte: "#1b1a16", discret: "#4c4638", accent: "#14672e", surface: "#d9c69d", encre: "#1b1a16", surEncre: "#ffffff",
  police: "font.work-sans", titres: "font.staatliches",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#1b1a1655",
});
const KRAFT = "#e8d9b9", ENCRE = "#1b1a16", VERTR = "#14672e", VERTC = "#8fe07a";

const boucleDeTri = modeleV2({
  id: identifiantV2(149, "boucle-de-tri"), concept: "c-149-boucle-de-tri",
  name: "Boucle de tri", family: FAM,
  description: "Pour une entreprise de recyclage ou de collecte : trois marches de largeur décroissante (Réduire, Réutiliser, Recycler) alignées à gauche sur fond kraft, qui glissent au survol, puis base noire avec horaires, contact et lettre.",
  tags: ["recyclage", "déchets", "tri", "kraft", "vert", "escalier", "marches", "angles droits"],
  identity: tri,
  racine: racineDe(ENCRE, "#f4ecd8"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NBSP = "\u00a0";
    const phrase = G.geant(`<p>Ce qui se trie<br>se transforme.</p>`, { taille: [44, 96], tablette: { taille: [64, 84] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "0.01em", poids: "400", police: S.head, couleur: ENCRE, extra: { textTransform: "uppercase" } })(k, env);
    const tete = G.bande(k, [phrase], { fond: KRAFT, colonne: true, padV: ["80px", "64px", "44px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Tri" });
    // une marche : bande à gauche, largeur propre (bureau, tablette, mobile) ; lien-titre + phrase ; glisse au survol
    const marche = (num, titre, sous, url, largeurs, o) => {
      const titreLien = k.LINK(`${num}${NBSP}${NBSP}${titre} →`, url, { fontFamily: S.head, fontSize: "fluid:30-44", fontWeight: "400", color: o.texte, textDecoration: "none", lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "0.02em", display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: DUREE, borderRadius: "0px" });
      Moteur.finishNode(S, titreLien);
      titreLien.states = { hover: { transform: { x: 4 } }, focus: GK.focus(o.texte) };
      titreLien.styles.desktop = { ...titreLien.styles.desktop, minHeight: "44px" };
      const phraseMarche = k.T(`<p>${sous}</p>`, { fontSize: "16px", lineHeight: 1.5, color: o.texte, fontFamily: S.font, maxWidth: "420px", flexGrow: 1, flexBasis: "260px", minWidth: "0px" });
      const enfants = o.souffle ? [k.row([titreLien, souffle(aplat(k, o.texte, "10px", { l: "10px", grow: 0, base: "10px" }), 3200)], { gap: "14px", flexWrap: "nowrap", alignItems: "center" }), phraseMarche] : [titreLien, phraseMarche];
      const b = G.bande(k, enfants, { fond: o.fond, gap: "14px 40px", aligne: "center", max: "100%", padV: ["34px", "30px", "26px"], padH: ["48px", "32px", "20px"], nom: `Marche ${num}`, ...(o.cadre ? { filetHaut: { epaisseur: "4px", couleur: ENCRE } } : {}) });
      Object.assign(b.styles.desktop, { width: largeurs[0], alignSelf: "flex-start", boxSizing: "border-box", transitionDuration: DUREE, ...(o.cadre ? { borderBottomWidth: "4px", borderRightWidth: "4px", borderStyle: "solid", borderColor: ENCRE } : {}) });
      b.styles.tablet = { ...(b.styles.tablet || {}), width: largeurs[1] };
      b.styles.mobile = { ...(b.styles.mobile || {}), width: largeurs[2] };
      b.states = { hover: { transform: { x: 10 }, backgroundColor: o.survol } };
      return b;
    };
    const m1 = marche("1", "Réduire", "Moins d'emballages, moins de déchets : les bons réflexes à la maison et au bureau.", "/blog", ["92%", "92%", "100%"], { fond: VERTR, texte: "#ffffff", survol: "#1b7f3a", souffle: true });
    const m2 = marche("2", "Réutiliser", "Donner, réparer, emprunter : ce qui sert encore n'a pas à partir à la benne.", "/faq", ["68%", "76%", "90%"], { fond: "#d9c69d", texte: ENCRE, survol: "#cdb784" });
    const m3 = marche("3", "Recycler", "Où déposer quoi, à quel moment : consignes de tri.", "/contact", ["44%", "58%", "80%"], { fond: "#f6edd6", texte: ENCRE, survol: "#ffffff", cadre: true });
    // la base : noire, pleine largeur ; horaires, contact et lettre, puis liens, réseaux et mentions
    const colHoraires = bloc(k, "Horaires de collecte", [horaires(k, { couleur: "#f4ecd8" })], { couleurTitre: VERTC, poids: 1.1 });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { couleur: "#f4ecd8", lien: "#f4ecd8", survol: VERTC, focus: VERTC })], { couleurTitre: VERTC, poids: 1.1 });
    const abo = abonnement(k, env, { titre: "La lettre du tri", intro: "Jours de collecte, nouvelles consignes : un message de temps en temps.", accent: VERTC, texte: "#f4ecd8", couleurTitre: VERTC, couleurIntro: "#cfc6ae", couleurBouton: ENCRE, survolBouton: "#ffffff", survolTexte: ENCRE });
    const colLettre = G.colonne(k, [abo], { poids: 1.6, min: "260px" });
    const grille = G.ligne(k, [colHoraires, colContact, colLettre], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const liens = G.ligne(k, [...listeLiens(k, [["Conseils de tri", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Contact", "/contact"]], { couleur: "#f4ecd8", taille: 15, survol: { color: VERTC, transform: { y: -2 } }, focus: VERTC }).map((l) => { l.styles.desktop.display = "inline-flex"; return l; }), G.reseauxTexte(reseauxEx, { couleur: "#f4ecd8", survol: VERTC, focus: VERTC, taille: 14 })(k, env)], { gap: "0px 32px", aligne: "center", largeur: "100%" });
    const mentions = GK.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfc6ae", liens: "#f4ecd8" })(k, env);
    const noir = G.bande(k, [grille, liens, trait(k, "#f4ecd833"), mentions], { colonne: true, gap: "32px", fond: ENCRE, padV: ["72px", "56px", "48px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Contact" });
    noir.styles.desktop.color = "#f4ecd8"; // la ligne légale de la plateforme reprend la couleur de texte de la dernière bande
    // le fond kraft derrière les marches étroites : la racine du pied (ligne légale de la plateforme) reste noire, le conteneur des bandes est kraft
    const bandes = G.racine(k, [tete, m1, m2, m3, noir]);
    bandes.styles.desktop.backgroundColor = KRAFT;
    return [bandes];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-150 « Niveau d'eau » — service de l'eau / gestion de l'eau
// Idée : des STRATES. Un grand panneau bleu profond à gauche (« L'eau, notre bien commun. », repère carré qui respire, lettre d'information) et, à droite sur ciel pâle, quatre strates horizontales séparées par des filets
// de bleu de plus en plus foncé (contact, horaires, ressources, réseaux) ; chaque strate s'éclaircit au survol. Polices : Outfit (titres 800 et texte). Mobile : panneau, puis strates en pile.
const eau = identite({
  key: "c150", label: "Ciel pâle et bleu profond", humeur: "light",
  fond: "#e8f4fb", texte: "#00305a", discret: "#2f5a80", accent: "#0069b4", surface: "#d3eaf7", encre: "#00305a", surEncre: "#ffffff",
  police: "font.outfit", titres: "font.outfit",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#00305a33",
});
const PROFOND = "#00305a", CIEL = "#e8f4fb", AZUR = "#0069b4", CYAN = "#8fdcff";

const niveauDEau = modeleV2({
  id: identifiantV2(150, "niveau-d-eau"), concept: "c-150-niveau-d-eau",
  name: "Niveau d'eau", family: FAM,
  description: "Pour un service de l'eau : grand panneau bleu profond avec phrase et lettre d'information, et quatre strates sur ciel pâle (contact, horaires, ressources, réseaux) séparées par des filets de bleus croissants.",
  tags: ["eau", "service de l'eau", "assainissement", "bleu", "strates", "angles droits", "ciel pâle"],
  identity: eau,
  racine: racineDe(CIEL),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · panneau bleu profond
    const repere = souffle(aplat(k, CYAN, "12px", { l: "12px", grow: 0, base: "12px" }), 3200);
    const etat = k.row([repere, caps(k, "Service de l'eau", { couleur: CYAN })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>L'eau,<br>notre bien<br><span style="color:${CYAN}">commun.</span></p>`, { taille: [44, 84], tablette: { taille: [60, 76] }, mobile: { taille: [44, 58] }, lh: 1.02, suivi: "-0.03em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const intro = k.T("<p>Alimentation, assainissement, qualité de l'eau : démarches en ligne et conseils pour mieux consommer.</p>", { fontSize: "16px", lineHeight: 1.6, color: "#d6e9f7", fontFamily: S.font, maxWidth: "380px" });
    const bt = bouton(k, "Contacter le service", "/contact", { texte: PROFOND, fond: CYAN, survolFond: "#ffffff", survolTexte: PROFOND, focus: "#ffffff" });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Travaux, coupures, conseils : un message de temps en temps.", accent: CYAN, texte: "#ffffff", couleurTitre: CYAN, couleurIntro: "#d6e9f7", couleurBouton: PROFOND, survolBouton: "#ffffff", survolTexte: PROFOND, largeur: "340px" });
    const panneau = G.colonne(k, [etat, phrase, intro, bt, trait(k, "#ffffff44"), abo], { poids: 5, min: "300px", gap: "22px", extra: { backgroundColor: PROFOND, paddingTop: "48px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "40px", alignSelf: "stretch" }, mobile: { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "24px", paddingRight: "24px" } });
    // 2 · quatre strates
    const strate = (filet, titre, enfants) => {
      const gauche = G.colonne(k, [caps(k, titre, { couleur: AZUR })], { poids: 0, base: "150px", min: "130px" });
      const droite = G.colonne(k, enfants, { poids: 1, min: "200px", gap: "0px" });
      const c = k.row([gauche, droite], { rowGap: "12px", columnGap: "24px", alignItems: "flex-start", flexWrap: "wrap", width: "100%", paddingTop: "20px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: filet, backgroundColor: CIEL, transitionDuration: 400, borderRadius: "0px" });
      c.states = { hover: { backgroundColor: "#ffffff" } };
      return c;
    };
    const s1 = strate("#9fd4ef", "Nous joindre", [coordonnees(k, { lien: PROFOND, survol: AZUR, focus: AZUR })]);
    const s2 = strate("#4aa6dd", "Horaires", [horaires(k)]);
    const s3 = strate("#0069b4", "Ressources", listeLiens(k, [["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace abonné", "/connexion"], ["Contact", "/contact"]], { survol: { color: AZUR, transform: { x: 4 } }, focus: AZUR }));
    const s4 = strate("#00305a", "Réseaux", [G.reseauxTexte(reseauxEx, { survol: AZUR, focus: AZUR, taille: 14, couleur: PROFOND })(k, env)]);
    const strates = G.colonne(k, [s1, s2, s3, s4], { poids: 7, min: "300px", gap: "0px", aligne: "stretch" });
    const haut = G.bande(k, [panneau, strates], { fond: CIEL, gap: "0px 56px", aligne: "stretch", padV: ["72px", "56px", "32px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Strates" });
    const mentions = mentionsDe(k, env, { couleur: S.mute, liens: PROFOND });
    const bas = G.bande(k, [trait(k, S.line), mentions], { colonne: true, gap: "24px", fond: CIEL, padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Énergie et environnement", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : énergie et environnement.",
  models: [pleinSoleil, etiquetteEnergie, noteSynthese, boucleDeTri, niveauDEau],
};
