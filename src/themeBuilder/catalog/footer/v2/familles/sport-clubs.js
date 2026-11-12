// Famille v2 « Sport et clubs » — 5 modèles (ft2-181 à ft2-185), extension « carrée » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds de clubs : club de sport, salle de fitness, auto-école, club de tennis, école de danse. Énergie maîtrisée, bandes franches, horaires des cours (widget « Données de l'entreprise »), bouton d'inscription,
// lettre d'information, mentions légales. Marques fictives ; AUCUNE coordonnée, horaire ni chiffre inventé : horaires, adresse et téléphone viennent des Données de l'entreprise du site (sans données, les widgets restent sobres).
// Les sections, disciplines et formations sont des intitulés d'EXEMPLE à renommer dans l'éditeur ; les adresses de réseaux sont des exemples. Chaque modèle a sa palette, ses polices (2 au plus) et sa composition (mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions longues et douces (360 ms) de couleur, de fond, de contour et de décalage (2 à 6 px) sur tous les liens, boutons et cartes ;
//   · UNE animation visible par modèle : carré d'inscription qui « respire » (pulse lent), case qui se remplit, flèche qui glisse, panneau qui se soulève, ligne qui s'indente ;
//   · pas d'animation d'entrée, pas de widget « Défilement continu » (limites du moteur : voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const FAM = "sport-clubs";
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

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-181 « Tribune rouge » — club de sport
// Idée : le pied d'un CLUB DE TRIBUNE. Trois barres franches (rouge, blanc, rouge) en tête, une bande noire avec « Tous sur le terrain. » en grandes capitales Oswald (un mot en rouge vif) et les boutons
// d'inscription (le carré rouge « respire »), puis une bande claire : quatre sections en cases numérotées qui virent au noir au survol, horaires, contact, liens et lettre du club. Bande noire pour les mentions.
// Sections d'exemple (Football, Basket, Natation, Athlétisme), à renommer. Polices : Oswald (titres) et Work Sans (texte). Mobile : cases sur deux colonnes puis colonnes empilées.
const tribune = identite({
  key: "c181", label: "Noir, rouge vif et blanc", humeur: "dark",
  fond: "#101010", texte: "#f4f4f2", discret: "#bdbdb8", accent: "#ff3b3b", surface: "#1b1b1b", encre: "#101010", surEncre: "#f4f4f2",
  police: "font.work-sans", titres: "font.oswald",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f4f4f233",
});
const NOIR1 = "#101010", ROUGE1 = "#ff3b3b", ROUGE1F = "#c9141c", BLANC1 = "#f4f4f2", GRIS1 = "#ebebe8";

const tribuneRouge = modeleV2({
  id: identifiantV2(181, "tribune-rouge"), concept: "c-181-tribune-rouge",
  name: "Tribune rouge", family: FAM,
  description: "Pour un club de sport : trois barres franches, bande noire avec « Tous sur le terrain » et boutons d'inscription, puis quatre sections en cases numérotées qui virent au noir, horaires, contact, liens et lettre du club. Rouge, noir, blanc.",
  tags: ["club de sport", "club sportif", "inscription", "sections", "horaires", "rouge", "noir"],
  identity: tribune,
  racine: racineDe(NOIR1),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 0 · barres franches
    const barres = [barre(G, k, ROUGE1F), barre(G, k, BLANC1, ["6px", "6px", "5px"])];
    // 1 · bande noire : phrase + inscription
    const phrase = G.geant(`<p>Tous sur le<br><span style="color:${ROUGE1}">terrain.</span></p>`, { taille: [52, 140], tablette: { taille: [84, 120] }, mobile: { taille: [52, 84] }, lh: 0.98, suivi: "-0.01em", poids: "700", police: S.head, couleur: BLANC1, extra: { textTransform: "uppercase" } })(k, env);
    const intro = k.T("<p>Entraînements, matchs, stages : rejoignez le club et trouvez votre place dans l'équipe.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "420px" });
    const b1 = souffle(bouton(k, "S'inscrire", "/inscription", { texte: NOIR1, fond: ROUGE1, bord: ROUGE1, survol: { backgroundColor: BLANC1, borderColor: BLANC1, color: NOIR1, transform: { y: -3 } }, focus: BLANC1 }), 4200);
    const b2 = bouton(k, "Voir le planning", "/contact", { texte: BLANC1, bord: BLANC1, survol: { backgroundColor: BLANC1, color: NOIR1, transform: { y: -3 } }, focus: ROUGE1 });
    const boutons = k.row([b1, b2], { gap: "12px" });
    const haut = G.bande(k, [G.colonne(k, [phrase], { poids: 8, min: "300px" }), G.colonne(k, [intro, boutons], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" })], { fond: NOIR1, gap: "40px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["88px", "72px", "52px"], padH: ["48px", "32px", "20px"], nom: "Invitation" });
    // 2 · bande claire : sections, horaires, contact, liens, lettre
    const caseSec = (num, nom) => {
      const t = lien(k, nom, "/blog", { taille: 24, poids: "700", police: S.head, casse: "uppercase", couleur: NOIR1, survol: { color: "#ffffff" }, focus: ROUGE1F, h: "44px", extra: { width: "100%" } });
      const c = k.col([caps(k, num, { couleur: ROUGE1F, suivi: "0.2em", poids: "800" }), t], { flexGrow: 1, flexBasis: "200px", minWidth: "150px", minHeight: "128px", justifyContent: "space-between", paddingTop: "16px", paddingBottom: "10px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: ROUGE1F, backgroundColor: "#ffffff", transitionDuration: DOUX, borderRadius: "0px" });
      c.states = { hover: { backgroundColor: NOIR1, transform: { y: -5 } } };
      return c;
    };
    const sections = G.ligne(k, [caseSec("01", "Football"), caseSec("02", "Basket"), caseSec("03", "Natation"), caseSec("04", "Athlétisme")], { gap: "14px", aligne: "stretch", largeur: "100%" });
    const colHor = bloc(k, "Horaires du club", [horaires(k, { couleur: NOIR1, taille: 15 })], { couleurTitre: ROUGE1F, poids: 1.2, min: "240px" });
    const colContact = bloc(k, "Nous trouver", [coordonnees(k, { couleur: NOIR1, lien: NOIR1, survol: ROUGE1F, focus: ROUGE1F })], { couleurTitre: ROUGE1F, min: "220px" });
    const rapide = [["Actualités du club", "/blog"], ["Questions fréquentes", "/faq"], ["Espace membre", "/connexion"], ["Nous écrire", "/contact"]];
    const colLiens = bloc(k, "Liens rapides", rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: NOIR1, survol: { color: ROUGE1F, transform: { x: 4 } }, focus: ROUGE1F })), { couleurTitre: ROUGE1F, gap: "0px", min: "190px" });
    const abo = abonnement(k, env, { titre: "La lettre du club", intro: "Résultats, stages, infos pratiques : un message de temps en temps.", bouton: "Je m'abonne", largeur: "340px", accent: ROUGE1F, texte: NOIR1 });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: ROUGE1F, lineHeight: 1.4 };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#3d3d3a" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#ffffff" };
    abo.parts.button.states = { hover: { backgroundColor: NOIR1, color: "#ffffff" }, focus: GK.focus(NOIR1) };
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [colHor, colContact, colLiens, colLettre], { gap: "36px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const milieu = G.bande(k, [sections, grille], { fond: GRIS1, colonne: true, gap: "52px", padV: ["72px", "56px", "44px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "36px" }, nom: "Sections et infos" });
    // 3 · bande noire : réseaux et mentions
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", couleur: BLANC1, survol: ROUGE1, focus: ROUGE1 })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, trait(k, S.line), mentions], { fond: NOIR1, colonne: true, gap: "20px", padV: ["32px", "28px", "24px"], padB: ["24px", "20px", "18px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "16px" }, nom: "Mentions" });
    return [G.racine(k, [...barres, haut, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-182 « Haute intensité » — salle de fitness
// Idée : un pied MONUMENTAL (archétype B). Anthracite, un seul mot « Bouge. » en capitales Bebas Neue de 200 px centré dans un grand vide, un petit carré vert acide qui « respire » au-dessus, deux boutons (inscription, contact)
// et rien d'autre : pas de colonnes, pas de grille. Une fine ligne légale centrée ferme le tout. Police : Bebas Neue (titres) et DM Sans (texte). Mobile : le mot passe à 110 px, les boutons s'empilent.
const salle = identite({
  key: "c182", label: "Anthracite et vert acide", humeur: "dark",
  fond: "#14161a", texte: "#f2f4ee", discret: "#aeb4bb", accent: "#c8ff2e", surface: "#1d2025", encre: "#14161a", surEncre: "#f2f4ee",
  police: "font.dm-sans", titres: "font.bebas-neue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f2f4ee2e",
});
const ANTHRA = "#14161a", ANTHRA2 = "#1d2025", ACIDE = "#c8ff2e", NEIGE = "#f2f4ee";

const hauteIntensite = modeleV2({
  id: identifiantV2(182, "haute-intensite"), concept: "c-182-haute-intensite",
  name: "Haute intensité", family: FAM,
  description: "Pour une salle de fitness : un seul mot, « Bouge. », en capitales géantes centrées dans un grand vide anthracite, un carré vert acide qui respire, deux boutons (inscription, contact) et une ligne légale. Anthracite et vert acide.",
  tags: ["fitness", "salle de sport", "monumental", "inscription", "anthracite", "vert acide", "minimal", "angles droits"],
  identity: salle,
  racine: racineDe(ANTHRA),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const marque = k.row([souffle(carre(k, ACIDE, "14px"), 2800), caps(k, "Salle de remise en forme", { couleur: ACIDE, suivi: "0.28em" })], { gap: "12px", alignItems: "center", justifyContent: "center", flexWrap: "nowrap" });
    const mot = G.geant(`<p>Bouge<span style="color:${ACIDE}">.</span></p>`, { taille: [120, 200], tablette: { taille: [160, 200] }, mobile: { taille: [110, 150] }, lh: 0.86, suivi: "0.01em", poids: "400", police: S.head, couleur: NEIGE, align: "center", extra: { textTransform: "uppercase", width: "100%" } })(k, env);
    const boutons = k.row([
      bouton(k, "S'inscrire", "/inscription", { texte: ANTHRA, fond: ACIDE, survol: { backgroundColor: NEIGE, borderColor: NEIGE, color: ANTHRA, transform: { y: -3 } }, focus: NEIGE }),
      bouton(k, "Nous écrire", "/contact", { texte: NEIGE, bord: NEIGE, survol: { backgroundColor: NEIGE, color: ANTHRA, transform: { y: -3 } }, focus: ACIDE }),
    ], { ...GK.gaps("14px 16px"), justifyContent: "center", alignItems: "center" });
    const centre = G.bande(k, [k.col([G.filet({ largeur: "72px", epaisseur: "6px", couleur: ACIDE })(k, env), marque, mot, boutons], { gap: "28px", alignItems: "center", width: "100%" })], { colonne: true, fond: ANTHRA, padV: ["160px", "120px", "72px"], padB: ["140px", "104px", "64px"], padH: ["48px", "32px", "20px"], nom: "Bouge" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true);
    const bas = G.bande(k, [trait(k, S.line), mentions], { fond: ANTHRA, colonne: true, gap: "22px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [centre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-183 « Feu vert » — auto-école
// Idée : le pied d'une AUTO-ÉCOLE en deux temps (archétype F). En haut, un bandeau jaune signal d'appel à l'action XXL : « Prêt pour la route ? » en 150 px et un énorme bouton bleu « S'inscrire » (il « respire » doucement).
// Dessous, une bande bleu marine : à gauche horaires du bureau et coordonnées, à droite UNE SEULE colonne étroite de liens à filets (formations d'exemple, actualités, espace élève) dont chaque ligne glisse et jaunit au survol.
// Plus de lettre d'information ni de panneaux carrés. Polices : Lexend (titres) et Public Sans (texte). Mobile : bandeau puis colonne de liens sous les horaires.
const route = identite({
  key: "c183", label: "Bleu route, jaune signal et blanc", humeur: "dark",
  fond: "#0b3d91", texte: "#ffffff", discret: "#d6e2fa", accent: "#ffc800", surface: "#134aa6", encre: "#0b3d91", surEncre: "#ffffff",
  police: "font.public-sans", titres: "font.lexend",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff40",
});
const BLEUR = "#0b3d91", MARINE3 = "#082a66", JAUNE3 = "#ffc800", CLAIR3 = "#f2f5fa";

const feuVert = modeleV2({
  id: identifiantV2(183, "feu-vert"), concept: "c-183-feu-vert",
  name: "Feu vert", family: FAM,
  description: "Pour une auto-école : bandeau jaune d'appel à l'action XXL (« Prêt pour la route ? » et un énorme bouton d'inscription), puis une bande marine avec horaires, coordonnées et une colonne étroite de liens à droite.",
  tags: ["auto-école", "permis de conduire", "inscription", "horaires", "appel à l'action", "jaune", "bleu", "angles droits"],
  identity: route,
  racine: racineDe(MARINE3),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bandeau jaune : appel à l'action XXL
    const phrase = G.geant(`<p>Prêt pour<br>la route&nbsp;?</p>`, { taille: [56, 150], tablette: { taille: [80, 120] }, mobile: { taille: [48, 72] }, lh: 0.98, suivi: "-0.035em", poids: "800", police: S.head, couleur: BLEUR })(k, env);
    const intro = k.T("<p>Code, conduite, examen : on vous accompagne à chaque étape, à votre rythme.</p>", { fontSize: "18px", lineHeight: 1.55, color: MARINE3, fontFamily: S.font, maxWidth: "440px" });
    const b = souffle(bouton(k, "S'inscrire", "/inscription", { texte: JAUNE3, fond: BLEUR, taille: 22, survol: { backgroundColor: MARINE3, color: "#ffffff", transform: { y: -3 } }, focus: MARINE3, extra: { minHeight: "88px", paddingLeft: "56px", paddingRight: "56px", alignSelf: "flex-end" } }), 4200);
    const gauche = G.colonne(k, [caps(k, "Auto-école", { couleur: BLEUR, suivi: "0.22em" }), phrase, intro], { poids: 3, min: "300px", gap: "20px" });
    const cta = G.bande(k, [gauche, b], { fond: JAUNE3, gap: "40px 64px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["96px", "72px", "52px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    // 2 · bande marine : horaires et coordonnées à gauche, colonne étroite de liens à droite
    const colHor = bloc(k, "Horaires du bureau", [horaires(k, { couleur: "#ffffff", taille: 16 })], { couleurTitre: JAUNE3, poids: 1, min: "240px" });
    const colContact = bloc(k, "Nous contacter", [coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: JAUNE3, focus: JAUNE3, taille: 16 })], { couleurTitre: JAUNE3, poids: 1, min: "220px" });
    const gaucheInfo = G.ligne(k, [colHor, colContact], { gap: "32px 48px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" });
    const rang = (t, u) => lien(k, t, u, { taille: 17, poids: "700", couleur: "#ffffff", h: "56px", bloc: true, padH: "4px", survol: { color: JAUNE3, paddingLeft: "16px" }, focus: JAUNE3, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff40" } });
    const liste = k.col([rang("Permis B", "/contact"), rang("Conduite accompagnée", "/contact"), rang("Code de la route", "/contact"), rang("Actualités", "/blog"), rang("Questions fréquentes", "/faq"), rang("Espace élève", "/connexion")], { gap: "0px", width: "100%", alignItems: "stretch" });
    const note = k.T("<p>Formations d'exemple : renommez-les dans l'éditeur.</p>", { fontSize: "13px", lineHeight: 1.5, color: "#d6e2fa", fontFamily: S.font });
    const droite = G.colonne(k, [caps(k, "Liens utiles", { couleur: JAUNE3 }), liste, note], { poids: 0, base: "280px", min: "240px", gap: "12px", aligne: "stretch", extra: { flexShrink: 0 } });
    const haut = G.ligne(k, [G.colonne(k, [gaucheInfo], { poids: 3, min: "300px" }), droite], { gap: "40px 72px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d6e2fa", liens: "#ffffff", sansCookies: true })(k, env);
    const bas = G.bande(k, [haut, trait(k, "#ffffff40"), mentions], { fond: MARINE3, colonne: true, gap: "40px", padV: ["72px", "56px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Infos" });
    return [G.racine(k, [cta, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-184 « Court central » — club de tennis
// Idée : le pied d'un CLUB DE TENNIS tracé comme un COURT. Papier ivoire, vert club, terre battue. « Jeu, set et match. » en DM Serif Display, puis un grand rectangle à filets verts de 3 px découpé en trois « cases de service » :
// horaires, contact, réservation (bouton « Réserver un court », lettre). Chaque case se teinte de terre battue au survol. Une ligne de liens fait le « filet » en dessous. Polices : DM Serif Display (titres) et Karla (texte).
// Mobile : les trois cases s'empilent, filets conservés.
const tennis = identite({
  key: "c184", label: "Ivoire, vert club et terre battue", humeur: "light",
  fond: "#f4eedd", texte: "#12372a", discret: "#4a5e53", accent: "#b8471f", surface: "#ebe3cc", encre: "#12372a",
  police: "font.karla", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "3px", ligne: "#12372a55",
});
const IVOIRE = "#f4eedd", VERTC = "#12372a", TERRE = "#b8471f", TEINTE = "#ecdcbd";

const courCentral = modeleV2({
  id: identifiantV2(184, "court-central"), concept: "c-184-court-central",
  name: "Court central", family: FAM,
  description: "Pour un club de tennis : « Jeu, set et match. » en serif, puis un grand rectangle à filets verts découpé comme un court en trois cases (horaires, contact, réservation) qui se teintent de terre battue au survol. Ivoire, vert club.",
  tags: ["tennis", "club de tennis", "réservation", "horaires", "ivoire", "vert", "terre battue"],
  identity: tennis,
  racine: racineDe(IVOIRE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · titre
    const phrase = G.geant(`<p>Jeu, set<br>et match.</p>`, { taille: [52, 116], tablette: { taille: [72, 100] }, mobile: { taille: [48, 64] }, lh: 1.0, suivi: "-0.015em", poids: "400", police: S.head, couleur: VERTC })(k, env);
    const intro = k.T("<p>Cours de terre battue, de dur ou de salle : réservez, venez jouer, restez pour le goûter.</p>", { fontSize: "17px", lineHeight: 1.6, color: VERTC, fontFamily: S.font, maxWidth: "400px" });
    const tete = G.bande(k, [G.colonne(k, [caps(k, "Tennis club", { couleur: TERRE, suivi: "0.24em" }), phrase], { poids: 8, min: "300px", gap: "18px" }), G.colonne(k, [intro], { poids: 4, min: "280px", soi: "flex-end" })], { fond: IVOIRE, gap: "32px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["44px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    // 2 · le court : trois cases de service à filets de 3 px
    const f = "3px";
    const caseCourt = (enfants, extra, mobile) => G.colonne(k, enfants, { poids: 1, min: "260px", gap: "14px", extra: { paddingTop: "30px", paddingBottom: "30px", paddingLeft: "30px", paddingRight: "30px", borderStyle: "solid", borderWidth: "0px", borderColor: VERTC, transitionDuration: DOUX, borderRadius: "0px", backgroundColor: IVOIRE, ...(extra || {}) }, mobile: { paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", ...(mobile || {}) } });
    const c1 = caseCourt([caps(k, "Horaires du club", { couleur: TERRE, suivi: "0.2em" }), horaires(k, { couleur: VERTC, taille: 16 })], { borderRightWidth: f, borderBottomWidth: f }, { borderRightWidth: "0px" });
    const c2 = caseCourt([caps(k, "Nous trouver", { couleur: TERRE, suivi: "0.2em" }), coordonnees(k, { couleur: VERTC, lien: VERTC, survol: TERRE, focus: TERRE, taille: 16 })], { borderRightWidth: f, borderBottomWidth: f }, { borderRightWidth: "0px" });
    const reserver = souffle(bouton(k, "Réserver un court", "/contact", { texte: IVOIRE, fond: VERTC, survol: { backgroundColor: TERRE, borderColor: TERRE, color: "#ffffff", transform: { y: -3 } }, focus: TERRE, extra: { alignSelf: "flex-start" } }), 4200);
    const abo = abonnement(k, env, { titre: "La lettre du club", intro: "Tournois, stages, vie du club : un message de temps en temps.", bouton: "Je m'abonne", largeur: "320px", accent: TERRE, texte: VERTC });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: TERRE, lineHeight: 1.4 };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#ffffff" };
    abo.parts.button.states = { hover: { backgroundColor: VERTC, color: "#ffffff" }, focus: GK.focus(VERTC) };
    const c3 = caseCourt([caps(k, "Jouer", { couleur: TERRE, suivi: "0.2em" }), reserver, k.col([], { height: "6px" }), abo], { borderBottomWidth: f });
    const rangee = k.row([c1, c2, c3], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    // sous le court : ligne de « filet » avec les liens
    const liens = ["Actualités du club", "Questions fréquentes", "Espace membre", "Nous écrire"].map((t, i) => lien(k, t, ["/blog", "/faq", "/connexion", "/contact"][i], { taille: 16, poids: "700", couleur: VERTC, h: "52px", padH: "20px", survol: { backgroundColor: TEINTE, color: TERRE }, focus: TERRE, extra: { justifyContent: "center", flexGrow: 1 } }));
    const filet = k.row(liens, { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const court = k.col([rangee, filet], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "3px", borderColor: VERTC, backgroundColor: IVOIRE });
    const bandeCourt = G.bande(k, [court], { fond: IVOIRE, colonne: true, padV: ["16px", "16px", "8px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Court" });
    // 3 · mentions
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: IVOIRE, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [tete, bandeCourt, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-185 « Barre et pointes » — école de danse
// Idée : le pied d'une ÉCOLE DE DANSE, élégant et posé. Fond rose poudré, encre prune. « Danse. » en Instrument Serif géant à gauche, trois fins filets horizontaux (la barre) sous le mot ; à droite la liste des disciplines
// en lignes à filets (chaque ligne glisse de 6 px et s'illumine au survol), bouton « S'inscrire » dont le carré prune « respire ». Bande prune en bas : horaires des cours, contact, lettre, mentions.
// Disciplines d'exemple, à renommer. Polices : Instrument Serif (titres) et Jost (texte). Mobile : mot, disciplines, puis colonnes empilées.
const danse = identite({
  key: "c185", label: "Rose poudré, prune et framboise", humeur: "light",
  fond: "#f6e8ea", texte: "#35102f", discret: "#6b4a66", accent: "#a3124f", surface: "#fbf1f3", encre: "#35102f",
  police: "font.jost", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#35102f40",
});
const POUDRE = "#f6e8ea", PRUNE = "#35102f", FRAMBOISE = "#a3124f", ROSE = "#f2c7d3";

const barreEtPointes = modeleV2({
  id: identifiantV2(185, "barre-et-pointes"), concept: "c-185-barre-et-pointes",
  name: "Barre et pointes", family: FAM,
  description: "Pour une école de danse : « Danse. » en serif géant sur trois filets comme une barre, liste des disciplines en lignes qui glissent au survol, bouton d'inscription, puis bande prune avec horaires des cours, contact et lettre.",
  tags: ["école de danse", "danse", "disciplines", "cours", "inscription", "rose", "prune"],
  identity: danse,
  racine: racineDe(PRUNE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · « Danse. » sur la barre (trois filets)
    const phrase = G.geant(`<p>Danse<span style="color:${FRAMBOISE}">.</span></p>`, { taille: [100, 200], tablette: { taille: [140, 200] }, mobile: { taille: [100, 150] }, lh: 0.95, suivi: "-0.02em", poids: "400", police: S.head, couleur: PRUNE })(k, env);
    const barre3 = k.col([trait(k, PRUNE, "2px"), k.col([], { height: "8px" }), trait(k, PRUNE, "1px"), k.col([], { height: "8px" }), trait(k, PRUNE, "1px")], { gap: "0px", width: "100%" });
    const intro = k.T("<p>De l'éveil à l'âge adulte : un cours, une salle, une équipe qui vous attend pour la rentrée.</p>", { fontSize: "18px", lineHeight: 1.6, color: PRUNE, fontFamily: S.font, maxWidth: "400px" });
    const bt = souffle(bouton(k, "S'inscrire", "/inscription", { texte: "#ffffff", fond: FRAMBOISE, survol: { backgroundColor: PRUNE, borderColor: PRUNE, color: "#ffffff", transform: { y: -3 } }, focus: PRUNE, extra: { alignSelf: "flex-start" } }), 4200);
    const gauche = G.colonne(k, [caps(k, "École de danse", { couleur: FRAMBOISE, suivi: "0.26em" }), phrase, barre3, intro, bt], { poids: 6, min: "300px", gap: "20px" });
    const disc = (num, nom) => {
      const n = k.LINK(`${num}   ${nom}`, "/contact", { fontFamily: S.head, fontSize: "30px", fontWeight: "400", color: PRUNE, textDecoration: "none", display: "flex", alignItems: "center", minHeight: "60px", width: "100%", paddingLeft: "6px", paddingRight: "6px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#35102f55", borderRadius: "0px", transitionDuration: DOUX });
      return GK.fini(k, n, { hover: { color: FRAMBOISE, backgroundColor: ROSE, transform: { x: 8 } }, focus: GK.focus(FRAMBOISE) });
    };
    const liste = k.col(["Classique", "Contemporain", "Jazz", "Hip-hop", "Éveil à la danse"].map((t, i) => disc(`0${i + 1}`, t)), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: PRUNE });
    const droite = G.colonne(k, [caps(k, "Les disciplines (exemples à renommer)", { couleur: FRAMBOISE }), liste], { poids: 5, min: "290px", gap: "14px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: POUDRE, gap: "44px 72px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["80px", "64px", "44px"], padH: ["48px", "32px", "20px"], nom: "Danse" });
    // 2 · bande prune : horaires, contact, lettre, mentions
    const colHor = bloc(k, "Horaires des cours", [horaires(k, { couleur: "#ffffff", taille: 16 })], { couleurTitre: ROSE, poids: 1.3, min: "250px" });
    const colContact = bloc(k, "Nous trouver", [coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: ROSE, focus: ROSE, taille: 16 })], { couleurTitre: ROSE, min: "220px" });
    const abo = abonnement(k, env, { titre: "La lettre de l'école", intro: "Spectacles, stages, rentrée : un message de temps en temps.", bouton: "Je m'abonne", largeur: "340px", accent: ROSE, texte: "#ffffff" });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: ROSE, lineHeight: 1.4 };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#ead7e6" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: PRUNE };
    abo.parts.button.states = { hover: { backgroundColor: "#ffffff", color: PRUNE }, focus: GK.focus("#ffffff") };
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const rapide = [["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace élève", "/connexion"]];
    const colLiens = bloc(k, "Liens utiles", rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: "#ffffff", survol: { color: ROSE, transform: { x: 4 } }, focus: ROSE })), { couleurTitre: ROSE, gap: "0px", min: "190px" });
    const grille = G.ligne(k, [colHor, colContact, colLiens, colLettre], { gap: "36px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#ead7e6", liens: "#ffffff", sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff40"), mentions], { fond: PRUNE, colonne: true, gap: "40px", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Infos" });
    bas.styles.desktop.color = "#ffffff"; // la ligne légale de la plateforme reprend la couleur de cette dernière bande
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Sport et clubs", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : club de sport, salle de fitness, auto-école, club de tennis, école de danse.",
  models: [tribuneRouge, hauteIntensite, feuVert, courCentral, barreEtPointes],
};
