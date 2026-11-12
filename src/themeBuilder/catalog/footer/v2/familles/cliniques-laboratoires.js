// Famille v2 « Cliniques et laboratoires » — 5 modèles (ft2-166 à ft2-170), extension « carrée » (angles droits partout, sites standard très professionnels).
// Pieds de santé : clinique, laboratoire d'analyses, centre d'imagerie, pharmacie, centre dentaire. Propreté clinique, bleus et verts sobres, horaires et urgences bien visibles.
// Horaires : le point rond « ouvert maintenant » du widget (CSS partagé, rayon 50 %) est désactivé (showOpenNow:false) pour respecter les angles droits.
// AUCUN chiffre, agrément, label ni coordonnée inventés : horaires, adresse, téléphone viennent des « Données de l'entreprise » ; marques fictives.
// Seuls numéros cités : le 15 / le 112 (urgence vitale) et le 3237 (pharmacie de garde), numéros publics nationaux réels. Les adresses de réseaux sont des EXEMPLES à remplacer dans l'éditeur.
// Les intitulés de rubriques (examens, services) sont des EXEMPLES génériques à adapter. Angles droits : tout est à 0 px (identité, boutons, champs, carrés d'état).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 380 ms (fond, filet, décalage de 4 à 28 px) ; « souffle » lent d'un carré d'état ; carte qui se soulève (`hover: lift`).
// Limites du moteur : pas d'animation d'entrée, pas de défilement continu (voir vie-locale.js).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "cliniques-laboratoires";
const DOUX = 380; // ms : transitions longues et douces

// ── Aides LOCALES ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3600) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const leve = (n, ms = 380) => { n.motion = { hover: "lift", duration: ms }; return n; };
// Petit carré plein (indicateur d'état) : angles droits
const carreEtat = (k, couleur, t = 12) => k.col([], { width: `${t}px`, height: `${t}px`, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: o.ouvert === true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra });
// Bouton plein à angles droits
const bouton = (k, label, url, o = {}) => lien(k, label, url, { taille: o.taille || 16, poids: "700", couleur: o.couleur, h: "54px", padH: "28px", casse: o.casse, suivi: o.suivi, police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: o.contour ? "2px" : "0px", borderColor: o.contour, justifyContent: "center", alignSelf: "flex-start", ...(o.extra || {}) } });
// Abonnement à angles droits (champ et bouton à 0 px)
const abonnement = (k, env, o) => {
  const abo = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", largeur: "380px", ...o })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre || o.accent, lineHeight: 1.4 };
  if (o.couleurIntro) abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro };
  if (o.boutonSurvol) abo.parts.button.states = { hover: o.boutonSurvol, focus: GK.focus(o.focus || o.accent) };
  return abo;
};
const reseauxEx = [["Facebook", "https://www.facebook.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["Instagram", "https://www.instagram.com/"]];
// Rang de navigation : ligne pleine largeur à filet, le fond s'illumine et le texte glisse au survol
const rang = (k, label, url, o) => lien(k, label, url, { taille: o.taille || 18, poids: o.poids || "600", police: o.police, couleur: o.couleur, h: o.h || "60px", padH: "16px", bloc: true, survol: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, paddingLeft: "28px" }, focus: o.focus, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: o.filet, ...(o.extra || {}) } });
const lignes = (k, liens, o) => k.col(liens.map(([t, u]) => rang(k, t, u, o)), { gap: "0px", width: "100%", alignItems: "stretch" });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-166 « Parcours de soins » — clinique
// Idée : un pied en ESCALIER (archétype L). Cinq marches dont la largeur décroît (100 %, 84 %, 68 %, 52 %, 40 %), alignées à gauche et de plus en plus sombres : bandeau d'urgence rouge (carré blanc qui « respire », rappel du 15 et du 112),
// marche bleue « Des soins clairs, à chaque étape. » avec le rendez-vous, marche pâle avec horaires et coordonnées, marche bleu clair avec liens et lettre d'information, dernière marche marine avec la ligne légale. Le blanc du côté droit dessine l'escalier.
// Polices : IBM Plex Serif (titres) et IBM Plex Sans. Mobile : les marches prennent toute la largeur et s'empilent.
const parcours = identite({
  key: "c166", label: "Blanc, bleu clinique et rouge d'urgence", humeur: "light",
  fond: "#ffffff", texte: "#10243a", discret: "#4a5d72", accent: "#0b5394", surface: "#eef3f8", encre: "#10243a",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#10243a2e",
});
const BLEU1 = "#0b5394", MAR1 = "#10243a", ROUGE1 = "#b42318", PALE1 = "#eef3f8";

const parcoursSoins = modeleV2({
  id: identifiantV2(166, "parcours-de-soins"), concept: "c-166-parcours-de-soins",
  name: "Parcours de soins", family: FAM,
  description: "Pour une clinique : un pied en escalier, chaque marche plus étroite que la précédente, de l'urgence au rendez-vous, aux horaires, à la lettre d'information puis aux mentions. Blanc, bleu clinique et rouge d'urgence, angles droits.",
  tags: ["clinique", "urgence", "horaires", "rendez-vous", "escalier", "bleu clinique", "angles droits", "santé"],
  identity: parcours,
  racine: racineDe("#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const PALE2 = "#dbe6f2";
    // Une marche : bloc aligné à gauche dont la largeur diminue ; le blanc à droite dessine l'escalier. [bureau, tablette, mobile]
    const marche = (larg, fond, enfants, o = {}) => {
      const [pv, pt, pm] = o.pv || ["44px", "38px", "30px"];
      const base = { backgroundColor: fond, color: o.encre || MAR1, boxSizing: "border-box", alignSelf: "flex-start", gap: o.gap || "24px", borderRadius: "0px" };
      return k.col(enfants, { ...base, width: larg[0], paddingTop: pv, paddingBottom: pv, paddingLeft: "48px", paddingRight: "48px" },
        { width: larg[1], paddingTop: pt, paddingBottom: pt, paddingLeft: "32px", paddingRight: "32px" },
        { width: "100%", paddingTop: pm, paddingBottom: pm, paddingLeft: "20px", paddingRight: "20px", gap: "20px" });
    };
    // 0 · bandeau d'urgence (marche pleine largeur)
    const pt = souffle(carreEtat(k, "#ffffff", 12), 3200);
    const msg = k.T("<p><strong>Urgence vitale&nbsp;?</strong> Appelez le 15 (SAMU) ou le 112. Ce site ne remplace pas un avis médical.</p>", { fontSize: "16px", lineHeight: 1.5, color: "#ffffff", fontFamily: S.font });
    const aide = lien(k, "Que faire avant de venir ?", "/faq", { taille: 15, poids: "700", couleur: "#ffffff", soulign: true, survol: { color: "#ffe1de", transform: { x: 4 } }, focus: "#ffffff" });
    const m0 = marche(["100%", "100%", "100%"], ROUGE1, [G.ligne(k, [k.row([pt, msg], { gap: "14px", alignItems: "center", flexWrap: "nowrap" }), aide], { gap: "6px 32px", aligne: "center", justifie: "space-between", largeur: "100%" })], { pv: ["14px", "14px", "12px"] });
    // 1 · marche bleue : la phrase et le rendez-vous
    const phrase = G.geant(`<p>Des soins clairs,<br>à chaque étape.</p>`, { taille: [34, 64], tablette: { taille: [44, 56] }, mobile: { taille: [34, 42] }, lh: 1.08, suivi: "-0.015em", poids: "500", police: S.head, couleur: "#ffffff" })(k, env);
    const mot = k.T("<p>Consultations, examens, suivi : horaires, démarches et contacts utiles avant votre venue.</p>", { fontSize: "17px", lineHeight: 1.6, color: "#e6eef8", fontFamily: S.font, maxWidth: "520px" });
    const rdv = bouton(k, "Prendre rendez-vous", "/contact", { couleur: BLEU1, fond: "#ffffff", survol: { backgroundColor: PALE1, color: MAR1, transform: { y: -3 } }, focus: "#ffffff" });
    const espace = lien(k, "Espace patient", "/connexion", { taille: 16, poids: "700", couleur: "#ffffff", soulign: true, survol: { color: "#cfe0f3", transform: { x: 4 } }, focus: "#ffffff" });
    const m1 = marche(["84%", "92%", "100%"], BLEU1, [caps(k, "Clinique", { couleur: "#cfe0f3", suivi: "0.2em" }), phrase, mot, k.row([rdv, espace], { ...GK.gaps("8px 28px"), alignItems: "center" })], { pv: ["56px", "46px", "36px"], gap: "20px" });
    // 2 · marche pâle : horaires et coordonnées
    const colH = bloc(k, "Horaires d'accueil", [horaires(k, { taille: 16, couleur: MAR1 })], { couleurTitre: BLEU1, poids: 1, min: "240px" });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: MAR1, survol: BLEU1, focus: BLEU1 })], { couleurTitre: BLEU1, poids: 1, min: "220px" });
    const m2 = marche(["68%", "84%", "100%"], PALE1, [G.ligne(k, [colH, colC], { gap: "28px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })]);
    // 3 · marche bleu clair : liens et lettre
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "600", couleur: MAR1, survol: { color: BLEU1, transform: { x: 6 } }, focus: BLEU1 });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Informations pratiques et actualités de la clinique, par courriel.", bouton: "S'abonner", accent: BLEU1, texte: MAR1, boutonSurvol: { backgroundColor: MAR1, color: "#ffffff" }, couleurTitre: BLEU1, largeur: "420px" });
    const m3 = marche(["52%", "76%", "100%"], PALE2, [G.ligne(k, [lk("Services et examens", "/catalogue"), lk("Actualités", "/blog"), lk("Questions fréquentes", "/faq")], { gap: "0px 28px", aligne: "center", largeur: "100%" }), abo]);
    // 4 · marche marine : ligne légale
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfd8e3", liens: "#ffffff" })(k, env);
    const m4 = marche(["40%", "62%", "100%"], MAR1, [trait(k, "#ffffff40"), mentions], { pv: ["28px", "26px", "22px"], gap: "20px", encre: "#ffffff" });
    return [G.racine(k, [m0, m1, m2, m3, m4])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-167 « Planche d'analyses » — laboratoire d'analyses médicales
// Idée : une PLANCHE de laboratoire (archétype C : damier de cases égales). Aucun titre géant : une grille de huit cases à angles droits, filets d'1 px, où CHAQUE case est un lien ou une information
// (01 résultats, 02 rendez-vous, 03 préparer, 04 conseils, 05 horaires, 06 coordonnées, 07 lettre, 08 écrire). La case « résultats » est pleine d'encre verte ; au survol une case vire au vert très pâle et son lien glisse.
// Gris-vert clair, encre verte, numéros en DM Mono ; un carré turquoise « respire » devant le libellé. Polices : DM Sans (titres et texte) et DM Mono (numéros, libellés). Mobile : une case par ligne (deux sur tablette).
const planche = identite({
  key: "c167", label: "Gris-vert clair, encre verte et turquoise", humeur: "light",
  fond: "#eef3f1", texte: "#0f2f2a", discret: "#41594f", accent: "#0b6e63", surface: "#ffffff", encre: "#0f2f2a",
  police: "font.dm-sans", titres: "font.dm-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#0f2f2a33",
});
const VERT2 = "#0b6e63", ENCRE2 = "#0f2f2a", GRIS2 = "#eef3f1";

const planchAnalyses = modeleV2({
  id: identifiantV2(167, "planche-d-analyses"), concept: "c-167-planche-d-analyses",
  name: "Planche d'analyses", family: FAM,
  description: "Pour un laboratoire d'analyses : une planche de huit cases égales à filets fins (résultats, rendez-vous, préparation, conseils, horaires, coordonnées, lettre, contact), numérotées en police mono. Gris-vert clair, rigoureux, angles droits.",
  tags: ["laboratoire", "analyses", "résultats en ligne", "damier", "vert", "mono", "numérotation", "angles droits"],
  identity: planche,
  racine: racineDe(GRIS2),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // Une case : numéro mono + contenu ; fond blanc (ou encre pour la première) ; vire au vert très pâle au survol
    const caseDe = (num, enfants, o = {}) => {
      const c = k.col([caps(k, num, { couleur: o.numero || VERT2, police: S.head, suivi: "0.2em", taille: "13px" }), ...enfants], { backgroundColor: o.fond || "#ffffff", paddingTop: "22px", paddingBottom: "26px", paddingLeft: "24px", paddingRight: "24px", gap: "10px", minHeight: "200px", boxSizing: "border-box", borderRadius: "0px", transitionDuration: DOUX });
      c.states = { hover: { backgroundColor: o.survol || "#e1efea" } };
      return c;
    };
    const texte = (t, couleur) => k.T(`<p>${t}</p>`, { fontSize: "15px", lineHeight: 1.55, color: couleur || S.mute, fontFamily: S.font });
    const titre = (t, u, o = {}) => lien(k, t, u, { taille: 22, poids: "700", couleur: o.couleur || ENCRE2, h: "44px", lh: 1.15, survol: { color: o.survol || VERT2, transform: { x: 6 } }, focus: o.focus || VERT2 });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Conseils de santé et informations pratiques.", bouton: "S'abonner", accent: VERT2, texte: ENCRE2, boutonSurvol: { backgroundColor: ENCRE2, color: "#ffffff" }, couleurTitre: VERT2, policeChamp: S.font, largeur: "100%" });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, fontFamily: S.head, letterSpacing: "0.12em" };
    const cases = [
      caseDe("01", [titre("Mes résultats", "/connexion", { couleur: "#ffffff", survol: "#9fe3d6", focus: "#ffffff" }), texte("Votre espace personnel sécurisé.", "#cfe5e0")], { fond: ENCRE2, numero: "#9fe3d6", survol: VERT2 }),
      caseDe("02", [titre("Prendre rendez-vous", "/contact"), texte("Choisissez le moment de votre prélèvement.")]),
      caseDe("03", [titre("Préparer le prélèvement", "/faq"), texte("À jeun ou non, pièces à apporter : les consignes générales.")]),
      caseDe("04", [titre("Conseils et actualités", "/blog"), texte("Comprendre un examen, un bilan, une valeur de référence.")]),
      caseDe("05", [caps(k, "Horaires", { couleur: VERT2, police: S.head, suivi: "0.12em" }), horaires(k, { taille: 15 })]),
      caseDe("06", [caps(k, "Nous trouver", { couleur: VERT2, police: S.head, suivi: "0.12em" }), coordonnees(k, { taille: 15, lien: ENCRE2, survol: VERT2, focus: VERT2 })]),
      caseDe("07", [abo]),
      caseDe("08", [titre("Nous écrire", "/contact"), texte("Une question sur un examen ? Écrivez-nous.")]),
    ];
    const damier = k.grid(4, cases, { gap: "1px", backgroundColor: "#0f2f2a40", paddingTop: "1px", paddingBottom: "1px", paddingLeft: "1px", paddingRight: "1px", boxSizing: "border-box" });
    const marque = k.row([souffle(carreEtat(k, VERT2, 12), 3400), caps(k, "Laboratoire d'analyses médicales", { couleur: ENCRE2, police: S.head, suivi: "0.16em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const planche1 = G.bande(k, [marque, damier], { colonne: true, fond: GRIS2, gap: "22px", padV: ["72px", "56px", "40px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Planche" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [trait(k, ENCRE2, "1px"), mentions], { colonne: true, gap: "24px", fond: "#ffffff", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [planche1, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-168 « Salle de lecture » — centre d'imagerie médicale
// Idée : la SALLE DE LECTURE du radiologue : bleu nuit, texte clair, cyan pour l'accent. À gauche « Voir clair. » en grandes lettres et la carte d'horaires ; à droite un INDEX d'examens en lignes à filet
// qui s'illuminent (fond, glissement du texte) au survol ; carré cyan qui respire devant le nom du centre. Les examens listés sont des exemples génériques à adapter. Polices : Sora (titres) et Inter (texte).
const lecture = identite({
  key: "c168", label: "Bleu nuit et cyan", humeur: "dark",
  fond: "#09161f", texte: "#e8f1f5", discret: "#9db4c0", accent: "#62d0e8", surface: "#102431", encre: "#09161f", surEncre: "#e8f1f5",
  police: "font.inter", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e8f1f533",
});
const NUIT = "#09161f", NUIT2 = "#102431", CYAN = "#62d0e8", CLAIR = "#e8f1f5";

const salleLecture = modeleV2({
  id: identifiantV2(168, "salle-de-lecture"), concept: "c-168-salle-de-lecture",
  name: "Salle de lecture", family: FAM,
  description: "Pour un centre d'imagerie : « Voir clair. » en grandes lettres, carte d'horaires, index d'examens dont les lignes s'illuminent au survol, carré cyan qui respire. Bleu nuit et cyan, angles droits, très net.",
  tags: ["imagerie", "radiologie", "bleu nuit", "cyan", "index d'examens", "horaires", "angles droits"],
  identity: lecture,
  racine: racineDe(NUIT),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · à gauche : phrase, rendez-vous, horaires
    const pt = souffle(carreEtat(k, CYAN, 12), 3400);
    const sur = k.row([pt, caps(k, "Centre d'imagerie médicale", { couleur: CYAN, suivi: "0.18em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Voir<br><span style="color:${CYAN}">clair.</span></p>`, { taille: [64, 140], tablette: { taille: [96, 124] }, mobile: { taille: [64, 88] }, lh: 0.98, suivi: "-0.03em", poids: "600", police: S.head, couleur: CLAIR })(k, env);
    const rdv = bouton(k, "Prendre rendez-vous", "/contact", { couleur: NUIT, fond: CYAN, casse: "uppercase", suivi: "0.08em", taille: 15, survol: { backgroundColor: CLAIR, color: NUIT, transform: { y: -3 } }, focus: CLAIR });
    const carte = k.col([caps(k, "Horaires d'accueil", { couleur: CYAN }), horaires(k, { taille: 15 })], { backgroundColor: NUIT2, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: CYAN, borderRadius: "0px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", gap: "12px", width: "100%", maxWidth: "400px", boxSizing: "border-box" });
    leve(carte);
    const gauche = G.colonne(k, [sur, phrase, rdv, carte], { poids: 5, min: "300px", gap: "28px" });
    // 2 · à droite : index d'examens (exemples)
    const ex = lignes(k, [["Radiographie", "/catalogue"], ["Échographie", "/catalogue"], ["Scanner", "/catalogue"], ["IRM", "/catalogue"], ["Préparer mon examen", "/faq"], ["Récupérer mes images", "/connexion"]], { taille: 22, poids: "600", police: S.head, couleur: CLAIR, filet: "#e8f1f533", fondSurvol: NUIT2, couleurSurvol: CYAN, focus: CYAN, h: "64px" });
    const index = G.colonne(k, [caps(k, "Examens et démarches", { couleur: CYAN, suivi: "0.18em" }), ex], { poids: 7, min: "300px", gap: "10px", aligne: "stretch" });
    const haut = G.bande(k, [gauche, index], { fond: NUIT, gap: "48px 88px", aligne: "flex-start", padV: ["88px", "68px", "48px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Lecture" });
    // 3 · contact, réseaux, lettre
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: CLAIR, survol: CYAN, focus: CYAN })], { couleurTitre: CYAN, suiviTitre: "0.18em", poids: 1.2 });
    const reseaux = G.reseauxTexte(reseauxEx, { taille: 16, poids: "500", couleur: CLAIR, survol: CYAN, focus: CYAN })(k, env);
    reseaux.styles.desktop = { ...reseaux.styles.desktop, flexDirection: "column", alignItems: "flex-start", rowGap: "0px" };
    const colR = bloc(k, "Nous suivre", [reseaux], { couleurTitre: CYAN, suiviTitre: "0.18em", gap: "6px", min: "180px" });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Actualités du centre et conseils de préparation.", bouton: "S'abonner", accent: CYAN, texte: CLAIR, boutonSurvol: { backgroundColor: CLAIR, color: NUIT }, couleurTitre: CYAN });
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: NUIT };
    const colL = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const ligneBas = G.ligne(k, [colC, colR, colL], { gap: "36px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [ligneBas, trait(k, S.line), mentions], { colonne: true, gap: "40px", fond: NUIT, padV: ["16px", "16px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Contact" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-169 « Croix verte » — pharmacie
// Idée : un pied de COMPTOIR. Un grand panneau vert plein (carré blanc marqué « + » qui respire, phrase en serif, trois lignes de services à filet qui s'illuminent au survol) ; dessous, sur blanc :
// le rappel « pharmacie de garde : 3237 » (numéro national réel), horaires, contact et lettre. Services = exemples génériques à adapter. Polices : Source Serif 4 (titres) et Public Sans (texte).
const croix = identite({
  key: "c169", label: "Vert pharmacie et blanc", humeur: "light",
  fond: "#ffffff", texte: "#0f2a1d", discret: "#436152", accent: "#0b6b3a", surface: "#e9f4ee", encre: "#0f2a1d",
  police: "font.public-sans", titres: "font.source-serif-4",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0f2a1d2e",
});
const VERT3 = "#0b6b3a", VERT3F = "#084d2a", MENTHE = "#e9f4ee", ENCRE3 = "#0f2a1d";

const croixVerte = modeleV2({
  id: identifiantV2(169, "croix-verte"), concept: "c-169-croix-verte",
  name: "Croix verte", family: FAM,
  description: "Pour une pharmacie : grand panneau vert avec carré « + » qui respire, lignes de services qui s'illuminent au survol, rappel de la pharmacie de garde, horaires, contact et lettre d'information. Vert et blanc, angles droits.",
  tags: ["pharmacie", "vert", "ordonnances", "pharmacie de garde", "horaires", "angles droits", "santé"],
  identity: croix,
  racine: racineDe("#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · panneau vert : carré « + », phrase, lignes de services
    const plus = souffle(k.col([k.T("<p>+</p>", { fontFamily: S.font, fontSize: "40px", fontWeight: "800", color: VERT3, lineHeight: 1, textAlign: "center" })], { width: "56px", height: "56px", backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0px" }), 3800);
    const sur = k.row([plus, caps(k, "Votre pharmacie", { couleur: "#ffffff", suivi: "0.2em", taille: "13px" })], { gap: "16px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Conseil, ordonnances,<br>retrait de commandes.</p>`, { taille: [30, 60], tablette: { taille: [40, 52] }, mobile: { taille: [30, 38] }, lh: 1.1, suivi: "-0.015em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const gaucheP = G.colonne(k, [sur, phrase], { poids: 6, min: "300px", gap: "28px" });
    const services = lignes(k, [["Mes ordonnances", "/contact"], ["Conseils santé", "/blog"], ["Commander et retirer", "/catalogue"]], { taille: 19, poids: "700", couleur: "#ffffff", filet: "#ffffff66", fondSurvol: VERT3F, couleurSurvol: "#ffffff", focus: "#ffffff", h: "58px" });
    const droiteP = G.colonne(k, [services], { poids: 5, min: "280px", aligne: "stretch", soi: "flex-end" });
    const bandeVerte = G.bande(k, [gaucheP, droiteP], { fond: VERT3, gap: "36px 72px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Panneau" });
    // 2 · blanc : garde, horaires, contact, lettre
    const garde = k.col([caps(k, "Pharmacie de garde", { couleur: VERT3 }), k.T("<p>En dehors des horaires d'ouverture, appelez le <strong>3237</strong> pour connaître la pharmacie de garde la plus proche.</p>", { fontSize: "16px", lineHeight: 1.55, color: ENCRE3, fontFamily: S.font, fontWeight: "400" })], { backgroundColor: MENTHE, borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "6px", borderColor: VERT3, borderRadius: "0px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "22px", gap: "8px", width: "100%", boxSizing: "border-box" });
    leve(garde);
    const colGarde = G.colonne(k, [garde], { poids: 1.1, min: "280px", aligne: "stretch" });
    const colH = bloc(k, "Horaires d'ouverture", [horaires(k, { taille: 15 })], { couleurTitre: VERT3, poids: 1 });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: ENCRE3, survol: VERT3, focus: VERT3 })], { couleurTitre: VERT3, poids: 1 });
    const abo = abonnement(k, env, { titre: "Lettre de la pharmacie", intro: "Conseils de saison et informations pratiques par courriel.", bouton: "S'abonner", accent: VERT3, texte: ENCRE3, boutonSurvol: { backgroundColor: ENCRE3, color: "#ffffff" }, couleurTitre: VERT3 });
    const colL = G.colonne(k, [abo], { poids: 1.3, min: "260px" });
    const grille = G.ligne(k, [colGarde, colH, colC, colL], { gap: "36px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { colonne: true, gap: "36px", fond: "#ffffff", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Infos" });
    return [G.racine(k, [bandeVerte, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-170 « Fil des soins » — centre dentaire
// Idée : un pied en FRISE. Bleu glacier, encre marine, bleu pétrole. Phrase centrée « Un sourire, des soins, du temps pour vous. », puis une frise de trois étapes (Consultation, Devis expliqué, Soins) : chaque étape part d'un
// carré qui « respire » l'un après l'autre (décalés), prolongé d'un filet. En bas, un panneau marine (rendez-vous, horaires) et les colonnes (liens, contact, lettre). Polices : Newsreader (titres) et Albert Sans.
const frise = identite({
  key: "c170", label: "Bleu glacier, marine et bleu pétrole", humeur: "light",
  fond: "#eaf5f9", texte: "#0c2d48", discret: "#3f5b72", accent: "#0b6e99", surface: "#ffffff", encre: "#0c2d48",
  police: "font.albert-sans", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0c2d4833",
});
const GLACE = "#eaf5f9", MARINE5 = "#0c2d48", TURQ = "#0b6e99", TURQC = "#7fd4e8";

const filSoins = modeleV2({
  id: identifiantV2(170, "fil-des-soins"), concept: "c-170-fil-des-soins",
  name: "Fil des soins", family: FAM,
  description: "Pour un centre dentaire : phrase centrée, frise de trois étapes (consultation, devis, soins) avec carrés qui respirent à tour de rôle, panneau marine avec rendez-vous et horaires, contact et lettre. Glacier et marine, angles droits.",
  tags: ["dentiste", "centre dentaire", "frise", "étapes", "bleu glacier", "marine", "angles droits"],
  identity: frise,
  racine: racineDe(GLACE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · phrase centrée
    const sur = caps(k, "Centre dentaire", { couleur: TURQ, suivi: "0.24em", extra: { textAlign: "center" } });
    const phrase = G.geant(`<p>Un sourire, des soins,<br>du temps pour vous.</p>`, { taille: [36, 84], tablette: { taille: [52, 72] }, mobile: { taille: [34, 44] }, lh: 1.06, suivi: "-0.02em", poids: "500", police: S.head, couleur: MARINE5, align: "center" })(k, env, true);
    const haut = G.bande(k, [sur, phrase], { fond: GLACE, colonne: true, aligne: "center", gap: "20px", max: "1100px", padV: ["88px", "68px", "48px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    // 2 · la frise : carré (qui respire, décalé) + filet, puis étape ; chaque titre est un lien
    const etape = (num, titre, texte, url, i) => {
      const marque = k.col([], { width: "14px", height: "14px", backgroundColor: TURQ, flexShrink: 0, borderRadius: "0px" });
      marque.motion = { entrance: "pulse", trigger: "load", duration: 3600, delay: i * 1200, iterations: "infinite", easing: "ease-in-out" };
      const filet = k.col([], { height: "0px", flexGrow: 1, flexBasis: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#0c2d4866" });
      const tete = k.row([marque, filet], { gap: "0px", alignItems: "center", flexWrap: "nowrap", width: "100%" });
      const n = caps(k, `Étape ${num}`, { couleur: TURQ, suivi: "0.18em" });
      const l = lien(k, titre, url, { taille: 26, poids: "500", police: S.head, couleur: MARINE5, h: "48px", survol: { color: TURQ, transform: { x: 6 } }, focus: TURQ });
      const t = k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "300px" });
      return k.col([tete, n, l, t], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "8px", paddingTop: "4px", paddingBottom: "8px" });
    };
    const trois = G.ligne(k, [
      etape(1, "Consultation", "Un premier échange pour faire le point sur vos besoins.", "/contact", 0),
      etape(2, "Devis expliqué", "Le plan de soins vous est détaillé avant toute décision.", "/faq", 1),
      etape(3, "Soins", "Les soins, puis le suivi : conseils d'entretien et rappels.", "/blog", 2),
    ], { gap: "28px 32px", aligne: "flex-start", largeur: "100%" });
    const bandeFrise = G.bande(k, [trois], { colonne: true, fond: GLACE, max: "1240px", padV: ["24px", "24px", "16px"], padB: ["64px", "52px", "44px"], padH: ["48px", "32px", "20px"], nom: "Frise" });
    // 3 · panneau marine : rendez-vous + horaires ; colonnes
    const rdv = bouton(k, "Prendre rendez-vous", "/contact", { couleur: MARINE5, fond: TURQC, survol: { backgroundColor: "#ffffff", color: MARINE5, transform: { y: -3 } }, focus: "#ffffff" });
    const invite = G.colonne(k, [caps(k, "Rendez-vous", { couleur: TURQC, suivi: "0.2em" }), k.T("<p>Une douleur, un contrôle, une question : écrivez-nous ou prenez rendez-vous.</p>", { fontSize: "22px", lineHeight: 1.4, color: "#ffffff", fontFamily: S.head, maxWidth: "420px", fontWeight: "400" }), rdv], { poids: 5, min: "280px", gap: "18px" });
    const hor = G.colonne(k, [caps(k, "Horaires d'ouverture", { couleur: TURQC, suivi: "0.2em" }), horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 5, min: "260px", gap: "12px" });
    const panneau = G.bande(k, [G.ligne(k, [invite, hor], { gap: "36px 72px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { colonne: true, gap: "0px", fond: MARINE5, padV: ["64px", "52px", "44px"], padB: ["64px", "52px", "44px"], padH: ["48px", "32px", "20px"], nom: "Rendez-vous" });
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "600", couleur: MARINE5, survol: { color: TURQ, transform: { x: 6 } }, focus: TURQ });
    const colL = bloc(k, "Liens utiles", [lk("Questions fréquentes", "/faq"), lk("Conseils et actualités", "/blog"), lk("Espace patient", "/connexion")], { couleurTitre: TURQ, gap: "0px", min: "200px" });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: MARINE5, survol: TURQ, focus: TURQ })], { couleurTitre: TURQ, poids: 1.2 });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Conseils d'hygiène bucco-dentaire et nouvelles du centre.", bouton: "S'abonner", accent: TURQ, texte: MARINE5, boutonSurvol: { backgroundColor: MARINE5, color: "#ffffff" }, couleurTitre: TURQ });
    const colAbo = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [colL, colC, colAbo], { gap: "36px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { colonne: true, gap: "36px", fond: GLACE, padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Colonnes" });
    return [G.racine(k, [haut, bandeFrise, panneau, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cliniques et laboratoires", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : clinique, laboratoire d'analyses, centre d'imagerie, pharmacie, centre dentaire.",
  models: [parcoursSoins, planchAnalyses, salleLecture, croixVerte, filSoins],
};
