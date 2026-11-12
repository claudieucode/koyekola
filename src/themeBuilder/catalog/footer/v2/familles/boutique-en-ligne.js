// Famille v2 « Boutique en ligne standard » — 5 modèles (ft2-171 à ft2-175), extension « carrée » (angles droits partout, sites standard très professionnels).
// Pieds de boutique en ligne : colonnes aide / livraison / paiement / compte, garanties en TEXTE, lettre d'information, mentions légales. Cinq ambiances de commerce : rayon clair, marché, console high-tech, maison de mode, bons plans.
// RIEN d'inventé : aucune coordonnée, aucun délai, aucun chiffre, aucun logo de paiement. Les « pictos » de paiement sont de simples ÉTIQUETTES DE TEXTE (carte bancaire, virement…) : EXEMPLES à adapter aux moyens réellement
// acceptés par la boutique (dans l'éditeur). Les garanties sont des phrases générales qui renvoient aux conditions de vente. Les adresses de réseaux sont des exemples. Marques fictives : aucune.
// Angles droits : tout est à 0 px (identité, boutons, champs, étiquettes, carrés d'état).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 380 ms (fond, couleur, décalage de 4 à 28 px) ; « souffle » lent d'un carré d'état ; cases qui se soulèvent (`hover: lift`).
// Limites du moteur : pas d'animation d'entrée, pas de défilement continu (voir vie-locale.js).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "boutique-en-ligne";
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
const carreEtat = (k, couleur, t = 12) => k.col([], { width: `${t}px`, height: `${t}px`, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.max, textAlign: o.align, ...(o.extra || {}) }));
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "200px", gap: o.gap || "12px", aligne: o.aligne, extra: o.extra });
const bouton = (k, label, url, o = {}) => lien(k, label, url, { taille: o.taille || 16, poids: "700", couleur: o.couleur, h: "54px", padH: "28px", casse: o.casse, suivi: o.suivi, police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: o.contour ? "2px" : "0px", borderColor: o.contour, justifyContent: "center", alignSelf: "flex-start", ...(o.extra || {}) } });
// Abonnement à angles droits ; couleurs adaptées au fond de la bande
const abonnement = (k, env, o, centre) => {
  const abo = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", largeur: "400px", ...o })(k, env, centre);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre || o.accent, lineHeight: 1.4 };
  if (o.couleurIntro) abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro };
  if (o.couleurConsent) abo.parts.consent.styles.desktop = { ...abo.parts.consent.styles.desktop, color: o.couleurConsent };
  if (o.couleurManque) abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: o.couleurManque };
  if (o.couleurBouton) abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.couleurBouton };
  if (o.boutonSurvol) abo.parts.button.states = { hover: o.boutonSurvol, focus: GK.focus(o.focus || o.accent) };
  return abo;
};
// Colonnes de liens communes aux boutiques (adresses de la plateforme : aucun lien mort)
const AIDE = [["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Conseils et guides", "/blog"]];
const LIVRAISON = [["Modes de livraison", "/faq"], ["Retours et échanges", "/faq"], ["Suivre ma commande", "/connexion"]];
const COMPTE = [["Me connecter", "/connexion"], ["Créer un compte", "/inscription"], ["Mes commandes", "/connexion"]];
// Moyens de paiement : étiquettes de TEXTE (exemples à adapter), jamais de faux logos
const MOYENS = ["Carte bancaire", "Virement", "Paiement sécurisé"];
const etiquettes = (k, couleur, fond, o = {}) => k.row(MOYENS.map((m) => k.T(`<p>${m}</p>`, { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: k.S.font, color: couleur, lineHeight: 1.2, backgroundColor: fond, borderStyle: "solid", borderWidth: "1px", borderColor: o.contour || couleur, borderRadius: "0px", paddingTop: "9px", paddingBottom: "9px", paddingLeft: "12px", paddingRight: "12px" })), { ...GK.gaps("8px 8px"), alignItems: "center", ...(o.centre ? { justifyContent: "center" } : {}) });
const reseauxEx = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Pinterest", "https://www.pinterest.com/"]];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-171 « Rayon clair » — boutique généraliste, ambiance grand magasin propre
// Idée : un pied de GRANDE BOUTIQUE bien rangée. En haut quatre cases de garanties en texte (livraison, retours, paiement, service client) séparées par des filets verticaux, qui se soulèvent au survol ; au milieu quatre colonnes
// (aide, livraison, paiement avec étiquettes de texte, compte) et la lettre d'information ; en bas une barre noire pour les mentions. Blanc, noir, rouge unique. Carré rouge qui « respire » devant la lettre. Police : Work Sans.
const rayon = identite({
  key: "c171", label: "Blanc, noir et rouge vif", humeur: "light",
  fond: "#ffffff", texte: "#161616", discret: "#54545a", accent: "#c8102e", surface: "#f3f3f1", encre: "#161616",
  police: "font.work-sans", titres: "font.work-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#1616162e",
});
const NOIR1 = "#161616", ROUGE1 = "#c8102e", GRIS1 = "#f3f3f1";

const rayonClair = modeleV2({
  id: identifiantV2(171, "rayon-clair"), concept: "c-171-rayon-clair",
  name: "Rayon clair", family: FAM,
  description: "Pour une boutique généraliste : quatre cases de garanties en texte, colonnes aide, livraison, paiement et compte, étiquettes de paiement en texte, lettre d'information et barre noire des mentions. Blanc, noir et rouge vif.",
  tags: ["boutique", "e-commerce", "garanties", "livraison", "paiement", "colonnes", "blanc noir rouge"],
  identity: rayon,
  racine: racineDe(NOIR1),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · quatre garanties en texte
    const case1 = (titre, mot, i) => {
      const t = caps(k, titre, { couleur: NOIR1, suivi: "0.12em", taille: "13px" });
      const m = texte(k, mot, { taille: 15, couleur: S.mute, lh: 1.5 });
      const c = k.col([t, m], { gap: "6px", flexGrow: 1, flexBasis: "0px", minWidth: "220px", boxSizing: "border-box", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: GRIS1, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: i === 0 ? ROUGE1 : "#16161633", borderRadius: "0px", transitionDuration: DOUX });
      c.states = { hover: { backgroundColor: "#ffffff", borderColor: ROUGE1, transform: { y: -4 } } };
      return c;
    };
    const garanties = G.ligne(k, [
      case1("Livraison", "Modes et délais indiqués avant la validation de la commande.", 0),
      case1("Retours", "Conditions de retour détaillées dans les conditions de vente.", 1),
      case1("Paiement", "Moyens de paiement proposés à l'étape de commande.", 2),
      case1("Service client", "Une question sur une commande ? Écrivez-nous.", 3),
    ], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const bandeG = G.bande(k, [garanties], { colonne: true, gap: "0px", fond: "#ffffff", padV: ["48px", "40px", "32px"], padB: ["16px", "16px", "8px"], padH: ["48px", "32px", "20px"], nom: "Garanties" });
    // 2 · colonnes + lettre
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "500", couleur: NOIR1, survol: { color: ROUGE1, transform: { x: 6 } }, focus: ROUGE1 });
    const colAide = bloc(k, "Aide", AIDE.map(([t, u]) => lk(t, u)), { couleurTitre: NOIR1, gap: "0px", min: "190px" });
    const colLiv = bloc(k, "Livraison", LIVRAISON.map(([t, u]) => lk(t, u)), { couleurTitre: NOIR1, gap: "0px", min: "190px" });
    const colPay = bloc(k, "Paiement", [texte(k, "Les moyens acceptés sont indiqués à l'étape de commande.", { taille: 15, couleur: S.mute, lh: 1.5, max: "240px" }), etiquettes(k, NOIR1, "transparent", { contour: "#16161666" })], { couleurTitre: NOIR1, gap: "14px", min: "200px" });
    const colCpt = bloc(k, "Mon compte", COMPTE.map(([t, u]) => lk(t, u)), { couleurTitre: NOIR1, gap: "0px", min: "150px" });
    const pt = souffle(carreEtat(k, ROUGE1, 10), 3600);
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Nouveautés et offres, par courriel. Désinscription en un clic.", bouton: "S'abonner", accent: ROUGE1, texte: NOIR1, couleurTitre: NOIR1, boutonSurvol: { backgroundColor: NOIR1, color: "#ffffff" }, largeur: "100%" });
    const colLettre = G.colonne(k, [k.row([pt, caps(k, "Restez informé", { couleur: ROUGE1 })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), abo], { poids: 1.4, min: "260px", gap: "14px" });
    const grille = G.ligne(k, [colAide, colLiv, colPay, colCpt, colLettre], { gap: "40px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const bandeC = G.bande(k, [grille], { colonne: true, gap: "0px", fond: "#ffffff", padV: ["48px", "40px", "32px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Colonnes" });
    // 3 · barre noire
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c9c9ce", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { colonne: true, gap: "0px", fond: NOIR1, padV: ["24px", "22px", "20px"], padB: ["24px", "22px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    barre.styles.desktop = { ...barre.styles.desktop, color: "#ffffff" }; // la ligne légale de la plateforme reprend cette couleur de texte
    return [G.racine(k, [bandeG, bandeC, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-172 « Marché vert » — épicerie fine et produits du terroir en ligne
// Idée : l'étal d'un MARCHÉ. Crème, vert forêt, terre cuite. À gauche un grand panneau vert plein (« Le marché, à la maison. » en serif, lettre d'information) ; à droite quatre colonnes à filet vert épais (aide, livraison, paiement, compte)
// dont le filet passe à la terre cuite au survol ; dessous trois garanties en phrases, chacune avec sa barre verte. Aucun label ni origine inventés. Polices : Fraunces (titres) et Nunito Sans.
const marche = identite({
  key: "c172", label: "Crème, vert forêt et terre cuite", humeur: "light",
  fond: "#f6f0e1", texte: "#1c2e22", discret: "#4c5a4e", accent: "#8a3b12", surface: "#e9e0c8", encre: "#1d4a33",
  police: "font.nunito-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1d4a3340",
});
const FORET = "#1d4a33", CREME2 = "#f6f0e1", TERRE = "#8a3b12", FORET2 = "#143726";

const marcheVert = modeleV2({
  id: identifiantV2(172, "marche-vert"), concept: "c-172-marche-vert",
  name: "Marché vert", family: FAM,
  description: "Pour une épicerie fine en ligne : grand panneau vert avec phrase en serif et lettre d'information, quatre colonnes à filet vert qui vire à la terre cuite au survol, trois garanties en phrases. Crème, forêt, terre cuite.",
  tags: ["épicerie", "marché", "boutique", "crème", "vert forêt", "terre cuite", "serif", "e-commerce"],
  identity: marche,
  racine: racineDe(CREME2),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · panneau vert (gauche)
    const sur = caps(k, "Boutique en ligne", { couleur: "#e9e0c8", suivi: "0.22em" });
    const phrase = G.geant(`<p>Le marché,<br>à la maison.</p>`, { taille: [32, 50], tablette: { taille: [44, 60] }, mobile: { taille: [36, 46] }, lh: 1.04, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const abo = abonnement(k, env, { titre: "La lettre du marché", intro: "Les nouveautés et les idées de saison, un message de temps en temps.", bouton: "Je m'abonne", accent: "#f6f0e1", texte: "#ffffff", couleurTitre: "#e9e0c8", couleurIntro: "#e9e0c8", couleurConsent: "#e9e0c8", couleurManque: "#ffffff", couleurBouton: FORET, boutonSurvol: { backgroundColor: "#ffffff", color: FORET }, largeur: "100%", focus: "#ffffff" });
    const panneau = k.col([sur, phrase, abo], { backgroundColor: FORET, borderRadius: "0px", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "40px", paddingRight: "40px", gap: "24px", boxSizing: "border-box", width: "100%", alignSelf: "stretch" }, undefined, { paddingLeft: "22px", paddingRight: "22px", paddingTop: "32px", paddingBottom: "32px" });
    const gauche = G.colonne(k, [panneau], { poids: 4, min: "300px", aligne: "stretch" });
    // 2 · quatre colonnes à filet épais
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "600", couleur: FORET, survol: { color: TERRE, transform: { x: 6 } }, focus: TERRE });
    const colonne = (titre, enfants) => {
      const c = k.col([caps(k, titre, { couleur: TERRE }), ...enfants], { gap: "6px", flexGrow: 1, flexBasis: "0px", minWidth: "140px", paddingTop: "16px", paddingBottom: "10px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: FORET, borderRadius: "0px", transitionDuration: DOUX, boxSizing: "border-box" });
      c.states = { hover: { borderColor: TERRE } };
      return c;
    };
    const quatre = G.ligne(k, [
      colonne("Aide", AIDE.map(([t, u]) => lk(t, u))),
      colonne("Livraison", LIVRAISON.map(([t, u]) => lk(t, u))),
      colonne("Paiement", [texte(k, "Moyens acceptés : voir l'étape de commande.", { taille: 15, couleur: S.mute, lh: 1.5 }), etiquettes(k, FORET, "transparent", { contour: "#1d4a3399" })]),
      colonne("Mon compte", COMPTE.map(([t, u]) => lk(t, u))),
    ], { gap: "28px 28px", aligne: "stretch", largeur: "100%" });
    // 3 · trois garanties en phrases, barre verte à gauche
    const phraseG = (titre, mot) => k.col([caps(k, titre, { couleur: FORET }), texte(k, mot, { taille: 15, couleur: S.fg, lh: 1.5 })], { gap: "4px", flexGrow: 1, flexBasis: "0px", minWidth: "180px", paddingLeft: "16px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "4px", borderColor: FORET, borderRadius: "0px" });
    const garanties = G.ligne(k, [
      phraseG("Livraison", "Modes et délais indiqués avant la validation de la commande."),
      phraseG("Retours", "Les conditions de retour figurent dans les conditions de vente."),
      phraseG("Paiement", "Page de paiement sécurisée ; moyens proposés à la commande."),
    ], { gap: "20px 28px", aligne: "stretch", largeur: "100%" });
    const droite = G.colonne(k, [quatre, garanties], { poids: 8, min: "300px", gap: "40px", aligne: "stretch", justifie: "space-between" });
    const haut = G.bande(k, [gauche, droite], { fond: CREME2, gap: "40px 56px", aligne: "stretch", padV: ["80px", "64px", "44px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Étal" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [trait(k, "#1d4a3366"), mentions], { colonne: true, gap: "24px", fond: CREME2, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-173 « Console » — boutique d'électronique et d'accessoires high-tech
// Idée : un pied en TABLEAU DE BORD. Noir bleuté, bleu électrique, police à chasse fixe. « Besoin d'aide ? » en grand à gauche, lettre d'information à droite ; puis un tableau de quatre lignes (01 AIDE, 02 LIVRAISON, 03 PAIEMENT, 04 COMPTE) :
// l'intitulé à gauche, les liens en ligne à droite ; la ligne entière s'illumine au survol. En bas, trois garanties entre crochets et un carré bleu qui respire. Polices : Space Grotesk (titres) et JetBrains Mono.
const consoleId = identite({
  key: "c173", label: "Noir bleuté et bleu électrique", humeur: "dark",
  fond: "#0d0f14", texte: "#e6e9f0", discret: "#9aa3b5", accent: "#6ea8ff", surface: "#171b25", encre: "#0d0f14", surEncre: "#e6e9f0",
  police: "font.jetbrains-mono", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e6e9f033",
});
const FOND3 = "#0d0f14", PANNEAU3 = "#171b25", BLEU3 = "#6ea8ff", CLAIR3 = "#e6e9f0";

const consoleModele = modeleV2({
  id: identifiantV2(173, "console"), concept: "c-173-console",
  name: "Console", family: FAM,
  description: "Pour une boutique high-tech : « Besoin d'aide ? » en grand, lettre d'information, tableau de quatre lignes (aide, livraison, paiement, compte) qui s'illuminent au survol, garanties entre crochets. Noir bleuté, police mono.",
  tags: ["high-tech", "électronique", "boutique", "mono", "noir", "bleu électrique", "tableau", "e-commerce"],
  identity: consoleId,
  racine: racineDe(FOND3),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · tête : phrase + lettre
    const sur = caps(k, "// Support boutique", { couleur: BLEU3, suivi: "0.12em" });
    const phrase = G.geant(`<p>Besoin<br>d'aide&nbsp;?</p>`, { taille: [52, 120], tablette: { taille: [80, 104] }, mobile: { taille: [52, 72] }, lh: 0.98, suivi: "-0.035em", poids: "600", police: S.head, couleur: CLAIR3 })(k, env);
    const gauche = G.colonne(k, [sur, phrase], { poids: 6, min: "300px", gap: "18px" });
    const abo = abonnement(k, env, { titre: "> Lettre d'information", intro: "Nouveautés, tests et bons plans par courriel.", bouton: "S'abonner", accent: BLEU3, texte: CLAIR3, couleurTitre: BLEU3, couleurBouton: FOND3, boutonSurvol: { backgroundColor: CLAIR3, color: FOND3 }, largeur: "420px" });
    const droite = G.colonne(k, [abo], { poids: 5, min: "290px", soi: "flex-end" });
    const tete = G.bande(k, [gauche, droite], { fond: FOND3, gap: "40px 72px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Tête" });
    // 2 · tableau : intitulé + liens en ligne ; la ligne entière s'illumine
    const lk = (t, u) => lien(k, t, u, { taille: 15, poids: "500", couleur: CLAIR3, padH: "0px", survol: { color: BLEU3, textDecoration: "underline" }, focus: BLEU3 });
    const ligneTab = (num, titre, enfants) => {
      const lib = k.col([caps(k, num, { couleur: BLEU3, suivi: "0.2em", taille: "12px" }), caps(k, titre, { couleur: CLAIR3, suivi: "0.12em", taille: "14px" })], { gap: "4px", flexBasis: "200px", flexGrow: 0, flexShrink: 0, minWidth: "160px" });
      const contenu = k.row(enfants, { ...GK.gaps("0px 32px"), alignItems: "center", flexGrow: 1, flexBasis: "0px", minWidth: "240px" });
      const r = k.row([lib, contenu], { ...GK.gaps("6px 48px"), alignItems: "center", flexWrap: "wrap", width: "100%", boxSizing: "border-box", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#e6e9f033", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: PANNEAU3 } };
      return r;
    };
    const tableau = k.col([
      ligneTab("01", "Aide", AIDE.map(([t, u]) => lk(t, u))),
      ligneTab("02", "Livraison", LIVRAISON.map(([t, u]) => lk(t, u))),
      ligneTab("03", "Paiement", [etiquettes(k, CLAIR3, "transparent", { contour: "#e6e9f066" })]),
      ligneTab("04", "Compte", COMPTE.map(([t, u]) => lk(t, u))),
    ], { gap: "0px", width: "100%", alignItems: "stretch" });
    const bandeTab = G.bande(k, [tableau], { colonne: true, gap: "0px", fond: FOND3, padV: ["16px", "16px", "8px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Tableau" });
    // 3 · garanties entre crochets + carré qui respire
    const pt = souffle(carreEtat(k, BLEU3, 10), 3200);
    const crochet = (t, m) => k.T(`<p><strong>[ ${t} ]</strong> ${m}</p>`, { fontSize: "14px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, flexGrow: 1, flexBasis: "0px", minWidth: "230px" });
    const garanties = G.ligne(k, [crochet("Livraison", "modes et délais indiqués avant la validation."), crochet("Retours", "voir les conditions de vente."), crochet("Paiement", "page sécurisée, moyens proposés à la commande.")], { gap: "14px 32px", aligne: "flex-start", largeur: "100%" });
    const etat = k.row([pt, caps(k, "Boutique en ligne", { couleur: CLAIR3, suivi: "0.14em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const reseaux = G.reseauxTexte(reseauxEx, { taille: 14, poids: "500", couleur: CLAIR3, survol: BLEU3, focus: BLEU3 })(k, env);
    const rangeeEtat = G.ligne(k, [etat, reseaux], { gap: "12px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [garanties, rangeeEtat, trait(k, S.line), mentions], { colonne: true, gap: "28px", fond: FOND3, padV: ["8px", "8px", "4px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "22px" }, nom: "Garanties" });
    return [G.racine(k, [tete, bandeTab, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-174 « Maison ivoire » — boutique de mode et de décoration, ambiance maison de couture
// Idée : un pied CENTRÉ, très calme. Un carré bordeaux qui respire entre deux filets, « Entrez dans la maison. » en serif léger, la lettre d'information centrée, puis quatre colonnes aux textes centrés et une ligne
// de garanties entre deux filets avec les étiquettes de paiement. Ivoire, encre, bordeaux. Les liens se soulèvent en douceur et l'espacement des lettres s'élargit au survol. Polices : Cormorant Garamond (titres) et Jost.
const maison = identite({
  key: "c174", label: "Ivoire, encre et bordeaux", humeur: "light",
  fond: "#f6f2ea", texte: "#1c1a17", discret: "#5d564d", accent: "#7a1f2b", surface: "#ece5d8", encre: "#1c1a17",
  police: "font.jost", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "1px", ligne: "#1c1a1733",
});
const IVOIRE = "#f6f2ea", ENCRE4 = "#1c1a17", BORD = "#7a1f2b";

const maisonIvoire = modeleV2({
  id: identifiantV2(174, "maison-ivoire"), concept: "c-174-maison-ivoire",
  name: "Maison ivoire", family: FAM,
  description: "Pour une boutique de mode ou de décoration : pied centré, « Entrez dans la maison » en serif léger, lettre d'information centrée, quatre colonnes centrées et garanties entre filets. Ivoire, encre et bordeaux, très calme.",
  tags: ["mode", "décoration", "boutique", "centré", "ivoire", "bordeaux", "serif", "e-commerce"],
  identity: maison,
  racine: racineDe(IVOIRE),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · carré bordeaux entre deux filets, phrase centrée, lettre centrée
    const pt = souffle(carreEtat(k, BORD, 10), 4200);
    const filet = () => k.col([], { height: "0px", width: "56px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#1c1a1766", flexShrink: 0 });
    const ornement = k.row([filet(), pt, filet()], { gap: "18px", alignItems: "center", justifyContent: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Entrez dans<br><span style="color:${BORD}">la maison.</span></p>`, { taille: [44, 104], tablette: { taille: [64, 88] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENCRE4, align: "center" })(k, env, true);
    const mot = texte(k, "Recevez les nouveautés et les collections en avant-première.", { taille: 17, couleur: S.mute, align: "center", max: "460px", extra: { marginLeft: "auto", marginRight: "auto" } });
    const abo = abonnement(k, env, { titre: "La lettre", intro: "", bouton: "S'abonner", accent: BORD, texte: ENCRE4, couleurTitre: BORD, boutonSurvol: { backgroundColor: ENCRE4, color: "#ffffff" }, largeur: "520px", couleurBouton: "#ffffff" }, true);
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, textAlign: "center" };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, textAlign: "center", color: S.mute };
    abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, textAlign: "center" };
    const haut = G.bande(k, [ornement, phrase, mot, abo], { fond: IVOIRE, colonne: true, aligne: "center", gap: "26px", max: "980px", padV: ["96px", "72px", "52px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Lettre" });
    // 2 · quatre colonnes centrées
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "400", couleur: ENCRE4, suivi: "0.01em", extra: { justifyContent: "center", alignSelf: "center", textAlign: "center" }, survol: { color: BORD, letterSpacing: "0.06em", transform: { y: -2 } }, focus: BORD });
    const col = (titre, enfants) => G.colonne(k, [caps(k, titre, { couleur: BORD, suivi: "0.22em", extra: { textAlign: "center" } }), ...enfants], { poids: 1, min: "200px", gap: "2px", aligne: "center" });
    const quatre = G.ligne(k, [
      col("Aide", AIDE.map(([t, u]) => lk(t, u))),
      col("Livraison", LIVRAISON.map(([t, u]) => lk(t, u))),
      col("Paiement", [texte(k, "Moyens proposés à l'étape de commande.", { taille: 15, couleur: S.mute, align: "center", max: "210px", lh: 1.5 }), etiquettes(k, ENCRE4, "transparent", { contour: "#1c1a1766", centre: true })]),
      col("Mon compte", COMPTE.map(([t, u]) => lk(t, u))),
    ], { gap: "36px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const bandeCol = G.bande(k, [quatre], { colonne: true, gap: "0px", fond: IVOIRE, max: "1180px", padV: ["16px", "16px", "8px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Colonnes" });
    // 3 · garanties entre deux filets
    const g = texte(k, "Livraison · Retours · Paiement sécurisé · Service client : toutes les conditions figurent dans les conditions de vente.", { taille: 14, couleur: S.mute, align: "center", lh: 1.7, max: "720px", extra: { marginLeft: "auto", marginRight: "auto", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "12px" } });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true);
    const bas = G.bande(k, [trait(k, "#1c1a1766"), g, trait(k, "#1c1a1766"), mentions], { colonne: true, aligne: "stretch", gap: "22px", fond: IVOIRE, max: "1180px", padV: ["0px", "0px", "0px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Garanties" });
    return [G.racine(k, [haut, bandeCol, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-175 « Bons plans » — boutique de promotions et de bons plans
// Idée : une BANDE JAUNE pleine largeur qui crie « Ne ratez rien. » avec la lettre d'information (carré marine qui respire), puis le pied marine : quatre colonnes à titres jaunes (aide, livraison, paiement, compte),
// et une barre plus sombre avec les étiquettes de paiement en texte, les garanties en une ligne et les mentions. Aucun pourcentage ni prix. Marine, jaune, blanc. Polices : Archivo (titres, graisse 800) et Libre Franklin.
const bons = identite({
  key: "c175", label: "Marine, jaune vif et blanc", humeur: "dark",
  fond: "#0b2a5b", texte: "#ffffff", discret: "#c6d4ee", accent: "#ffd23f", surface: "#123770", encre: "#0b2a5b", surEncre: "#ffffff",
  police: "font.libre-franklin", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff40",
});
const MARINE6 = "#0b2a5b", MARINE6F = "#071d42", JAUNE6 = "#ffd23f";

const bonsPlans = modeleV2({
  id: identifiantV2(175, "bons-plans"), concept: "c-175-bons-plans",
  name: "Bons plans", family: FAM,
  description: "Pour une boutique de promotions : bande jaune « Ne ratez rien » avec lettre d'information, quatre colonnes à titres jaunes sur marine, barre sombre avec étiquettes de paiement en texte et garanties. Marine et jaune vif, franc et lisible.",
  tags: ["promotions", "bons plans", "boutique", "marine", "jaune", "lettre d'information", "e-commerce"],
  identity: bons,
  racine: racineDe(MARINE6F),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bande jaune : phrase + lettre
    const pt = souffle(carreEtat(k, MARINE6, 12), 3000);
    const sur = k.row([pt, caps(k, "Bons plans", { couleur: MARINE6, suivi: "0.2em", taille: "13px" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Ne ratez<br>rien.</p>`, { taille: [52, 112], tablette: { taille: [80, 100] }, mobile: { taille: [52, 72] }, lh: 0.96, suivi: "-0.03em", poids: "800", police: S.head, couleur: MARINE6, casse: "uppercase" })(k, env);
    const gauche = G.colonne(k, [sur, phrase], { poids: 6, min: "300px", gap: "16px" });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Nouveautés et offres du moment, par courriel.", bouton: "Je m'abonne", accent: MARINE6, texte: MARINE6, couleurTitre: MARINE6, couleurIntro: "#1a2f5a", couleurConsent: "#1a2f5a", couleurManque: MARINE6, couleurBouton: "#ffffff", boutonSurvol: { backgroundColor: MARINE6F, color: "#ffffff" }, largeur: "460px", focus: MARINE6 });
    const droite = G.colonne(k, [abo], { poids: 5, min: "290px", soi: "flex-end" });
    const bande = G.bande(k, [gauche, droite], { fond: JAUNE6, gap: "36px 72px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Bons plans" });
    // 2 · quatre colonnes marine
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "600", couleur: "#ffffff", survol: { color: JAUNE6, transform: { x: 6 } }, focus: JAUNE6 });
    const colPay = bloc(k, "Paiement", [texte(k, "Moyens acceptés : voir l'étape de commande.", { taille: 15, couleur: S.mute, lh: 1.5, max: "240px" })], { couleurTitre: JAUNE6, suiviTitre: "0.18em", min: "220px", gap: "10px" });
    const quatre = G.ligne(k, [
      bloc(k, "Aide", AIDE.map(([t, u]) => lk(t, u)), { couleurTitre: JAUNE6, suiviTitre: "0.18em", gap: "0px" }),
      bloc(k, "Livraison", LIVRAISON.map(([t, u]) => lk(t, u)), { couleurTitre: JAUNE6, suiviTitre: "0.18em", gap: "0px" }),
      colPay,
      bloc(k, "Mon compte", COMPTE.map(([t, u]) => lk(t, u)), { couleurTitre: JAUNE6, suiviTitre: "0.18em", gap: "0px" }),
    ], { gap: "36px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const reseaux = G.reseauxTexte(reseauxEx, { taille: 15, poids: "600", couleur: "#ffffff", survol: JAUNE6, focus: JAUNE6 })(k, env);
    const corps = G.bande(k, [quatre, trait(k, "#ffffff40"), reseaux], { colonne: true, gap: "32px", fond: MARINE6, padV: ["64px", "52px", "40px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Colonnes" });
    // 3 · barre sombre : étiquettes de paiement, garanties, mentions
    const g = texte(k, "Livraison, retours et paiement : conditions détaillées dans les conditions de vente.", { taille: 14, couleur: "#c6d4ee", lh: 1.5, flexGrow: 1 });
    const ligneP = G.ligne(k, [etiquettes(k, "#ffffff", "transparent", { contour: "#ffffff80" }), g], { gap: "16px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c6d4ee", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [ligneP, mentions], { colonne: true, gap: "24px", fond: MARINE6F, padV: ["32px", "28px", "24px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Barre" });
    return [G.racine(k, [bande, corps, barre])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Boutique en ligne standard", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : boutique en ligne standard (aide, livraison, paiement, compte, lettre d'information), cinq ambiances de commerce.",
  models: [rayonClair, marcheVert, consoleModele, maisonIvoire, bonsPlans],
};
