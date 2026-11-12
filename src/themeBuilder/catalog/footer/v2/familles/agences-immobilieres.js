// Famille v2 « Agences immobilières » — 5 modèles (ft2-216 à ft2-220), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius), standard et très professionnel.
// Cinq ARCHÉTYPES de composition différents (DIVERSITE_STRICTE.md) : G index géant, A colonne latérale, K fenêtre à onglets, H mosaïque asymétrique, I frise d'étapes.
// Pieds d'agence immobilière, gestion locative, syndic, promoteur, chasseur d'appartements. Contenu utile (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information,
// mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre, AUCUN barème d'honoraires inventé : les espaces « honoraires » renvoient vers une page à renseigner dans l'éditeur (dit dans la page).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions douces de 360 ms (couleur, fond, retrait qui grandit, onglet qui se soulève, filet qui s'épaissit) ;
//   au moins une animation visible par modèle (carré de statut qui « respire », rangée qui s'élargit, onglet qui se soulève, case dont le filet s'épaissit, numéro qui se soulève).
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu (voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");


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
// liste de liens simples (colonne)
const listeLiens = (k, paires, o = {}) => paires.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, survol: o.survol || { color: k.S.accent, transform: { x: 6 } }, focus: o.focus }));
// rangée de tableau : numéro, lien, flèche ; fond et retrait qui changent au survol
function rangeeTableau(k, num, t, u, c) {
  const l = lien(k, t, u, { taille: c.taille || 18, poids: "600", police: c.police, couleur: c.texte, survol: { color: c.accent }, focus: c.accent, h: "52px", extra: { flexGrow: 1 } });
  const fl = k.T("<p>→</p>", { fontSize: "18px", color: c.accent, fontFamily: k.S.font, lineHeight: 1 });
  const r = k.row([caps(k, num, { couleur: c.accent, suivi: "0.16em", extra: { minWidth: "28px" } }), l, fl], { flexWrap: "nowrap", alignItems: "center", gap: "14px", width: "100%", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: c.filet, borderRadius: "0px", backgroundColor: c.fond, transitionDuration: DOUX });
  r.states = { hover: { backgroundColor: c.survolFond, paddingLeft: "14px" } };
  return r;
}
const FAM = "agences-immobilieres";
const mono = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, { fontSize: o.taille || "13px", lineHeight: 1.5, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.head, fontWeight: o.poids || "500", ...(o.extra || {}) });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-216 « Estimer, acheter, louer » — agence immobilière de quartier — ARCHÉTYPE G (index en lignes pleine largeur)
// Idée : TROIS PORTES géantes pleine largeur sans cartes : Estimer, Acheter, Louer en serif monumental, filet, flèche ; au survol la rangée devient blanche et son retrait s'élargit.
// Dessous, un socle bleu nuit très court : le nom, le renvoi « honoraires » (page à renseigner, aucun barème inventé) et les horaires (carré de statut qui « respire »). Pas de lettre ni de coordonnées en colonnes.
// Polices : Newsreader (titres) et Public Sans. Mobile : mots réduits, rangées pleine largeur.
const portes = identite({
  key: "c216", label: "Crème, bleu nuit et laiton", humeur: "light",
  fond: "#f7f3ec", texte: "#14233b", discret: "#475569", accent: "#8a6a22", surface: "#ffffff", encre: "#14233b",
  police: "font.public-sans", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#14233b33",
});
const NUIT = "#14233b", CREME = "#f7f3ec", LAITON = "#8a6a22", LAITON_CL = "#e0c27a";

const estimerAcheterLouer = modeleV2({
  id: identifiantV2(216, "estimer-acheter-louer"), concept: "c-216-estimer-acheter-louer",
  name: "Estimer, acheter, louer", family: FAM,
  description: "Pour une agence immobilière : trois portes géantes pleine largeur (estimer, acheter, louer) en index à retrait qui s'élargit au survol, puis un socle bleu nuit très court avec le nom, l'espace honoraires à renseigner et les horaires.",
  tags: ["agence immobilière", "estimer", "acheter", "louer", "index", "bleu nuit", "laiton", "serif", "angles droits"],
  identity: portes,
  racine: racineDe(NUIT),
  widgets: ["sitetitle", "text", "link", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const porte = (num, mot, texte, url) => {
      const l = lien(k, mot, url, { taille: 96, poids: "600", police: S.head, couleur: NUIT, h: "112px", lh: 1, suivi: "-0.02em", survol: { color: LAITON }, focus: LAITON, extra: { flexGrow: 1 } });
      l.styles.mobile = { ...(l.styles.mobile || {}), fontSize: "48px" };
      l.styles.tablet = { ...(l.styles.tablet || {}), fontSize: "72px" };
      const desc = k.T(`<p>${texte}</p>`, { fontSize: "17px", lineHeight: 1.5, color: S.mute, fontFamily: S.font, maxWidth: "300px" });
      const fl = k.T("<p>→</p>", { fontSize: "40px", color: LAITON, fontFamily: S.font, lineHeight: 1 });
      const r = k.row([k.T(`<p>${num}</p>`, { fontSize: "20px", fontStyle: "italic", color: LAITON, fontFamily: S.head, minWidth: "36px" }), l, desc, fl], { flexWrap: "wrap", alignItems: "center", ...GK.gaps("8px 28px"), width: "100%", paddingTop: "8px", paddingBottom: "8px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: NUIT, borderRadius: "0px", backgroundColor: CREME, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ffffff", paddingLeft: "28px" } };
      return r;
    };
    const rangs = k.col([
      porte("i.", "Estimer", "Connaître la valeur de votre bien avec un professionnel.", "/contact"),
      porte("ii.", "Acheter", "Trouver le bien qui vous correspond, accompagné jusqu'à la signature.", "/blog"),
      porte("iii.", "Louer", "Mettre un bien en location ou trouver votre prochain logement.", "/contact"),
    ], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: NUIT });
    const bandePortes = G.bande(k, [rangs], { fond: CREME, colonne: true, padV: ["56px", "44px", "28px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Portes" });
    // socle bleu nuit
    const nom = nomDuSite(k, env, 26, "#ffffff", { fontStyle: "normal" });
    const cNom = G.colonne(k, [nom, k.T("<p>Le barème des honoraires doit être affiché et consultable : renseignez-le sur une page dédiée dans l'éditeur.</p>", { fontSize: "15px", lineHeight: 1.55, color: "#e8ecf3", fontFamily: S.font, maxWidth: "420px" }), lien(k, "Consulter les honoraires", "/faq", { taille: 15, poids: "700", couleur: "#ffffff", soulign: true, survol: { color: LAITON_CL, transform: { x: 6 } }, focus: "#ffffff" })], { poids: 2, min: "280px", gap: "6px" });
    const pt = souffle(carre(k, LAITON_CL, "10px"), 3200);
    const cHor = G.colonne(k, [k.row([pt, k.T("<p>Nous recevons</p>", { fontSize: "18px", fontStyle: "italic", color: LAITON_CL, fontFamily: S.head })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: "#e8ecf3" })], { poids: 1, min: "240px", gap: "10px" });
    const grille = G.ligne(k, [cNom, cHor], { gap: "28px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c5cddb", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff33"), mentions], { fond: NUIT, colonne: true, gap: "28px", padV: ["44px", "36px", "32px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Socle" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [bandePortes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-217 « Portail de gestion » — gestion locative — ARCHÉTYPE A (colonne latérale pleine hauteur)
// Idée : un PORTAIL dont la colonne prune étroite, à DROITE et pleine hauteur, porte le nom, les deux boutons d'espace (propriétaire, locataire) et les coordonnées ; la zone principale, à gauche sur lilas clair, montre
// DEUX TABLEAUX de rubriques (Propriétaires, Locataires) à rangées qui s'éclaircissent au survol, puis la lettre. Pas d'horaires : la colonne affiche un carré de statut « espace sécurisé » qui respire.
// Polices : Sora (titres) et Albert Sans. Mobile : zone principale puis colonne prune en dessous.
const prune = identite({
  key: "c217", label: "Prune, lilas et blanc", humeur: "dark",
  fond: "#2b1630", texte: "#f4eefb", discret: "#d6c7e6", accent: "#d9c2f5", surface: "#3a2141", encre: "#2b1630", surEncre: "#f4eefb",
  police: "font.albert-sans", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f4eefb40",
});
const PRUNE = "#2b1630", PRUNE2 = "#1d0e21", LILAS = "#d9c2f5", LILAS_PALE = "#f4f0fa", VIOLET = "#5b2a86";

const portailGestion = modeleV2({
  id: identifiantV2(217, "portail-de-gestion"), concept: "c-217-portail-de-gestion",
  name: "Portail de gestion", family: FAM,
  description: "Pour un service de gestion locative : deux tableaux de rubriques (propriétaires, locataires) sur lilas clair et la lettre, flanqués d'une colonne prune pleine hauteur à droite avec deux boutons d'espace, le nom et les coordonnées.",
  tags: ["gestion locative", "propriétaires", "locataires", "portail", "colonne latérale", "prune", "lilas", "angles droits"],
  identity: prune,
  racine: racineDe(PRUNE2),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const couleursTab = { texte: "#2b1630", accent: VIOLET, filet: "#2b163344", fond: LILAS_PALE, survolFond: "#ffffff", police: S.head, taille: 17 };
    const tableau = (titre, lignes) => {
      const entete = k.col([k.T(`<p>${titre}</p>`, { fontSize: "22px", fontWeight: "800", color: "#ffffff", fontFamily: S.head })], { backgroundColor: VIOLET, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "14px", paddingRight: "14px", width: "100%", borderRadius: "0px" });
      return G.colonne(k, [entete, ...lignes.map(([t, u], i) => rangeeTableau(k, `${i + 1}`, t, u, couleursTab))], { poids: 1, min: "250px", gap: "0px" });
    };
    const tabs = G.ligne(k, [
      tableau("Propriétaires", [["Confier mon bien", "/contact"], ["Suivi des loyers", "/connexion"], ["Charges et régularisation", "/faq"], ["Travaux et entretien", "/faq"], ["Documents fiscaux", "/connexion"]]),
      tableau("Locataires", [["Trouver un logement", "/blog"], ["Payer mon loyer", "/connexion"], ["Demander une réparation", "/contact"], ["Donner mon préavis", "/faq"], ["Attestations", "/connexion"]]),
    ], { gap: "28px", aligne: "flex-start", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Actualités de la gestion locative, par courriel.", bouton: "S'abonner", largeur: "420px", accent: VIOLET, surBouton: "#ffffff", texte: "#2b1630", couleurTitre: VIOLET, fond: LILAS_PALE, survolBouton: "#2b1630", survolTexte: "#ffffff", focus: "#2b1630" });
    const principal = G.colonne(k, [tabs, abo], { poids: 8, min: "420px", gap: "44px", extra: { backgroundColor: LILAS_PALE, paddingTop: "72px", paddingBottom: "64px", paddingLeft: "48px", paddingRight: "48px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    principal.children = principal.children.map((c) => { c.styles.desktop = { ...c.styles.desktop, width: "100%" }; return c; });
    const nom = nomDuSite(k, env, 28, "#ffffff");
    const bouton = (t, u, plein) => lien(k, t, u, { taille: 16, poids: "700", couleur: plein ? PRUNE : "#ffffff", h: "52px", padH: "18px", survol: plein ? { backgroundColor: "#ffffff", transform: { y: -3 } } : { backgroundColor: "#ffffff", color: PRUNE, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: plein ? LILAS : undefined, borderStyle: "solid", borderWidth: "2px", borderColor: LILAS, justifyContent: "space-between", width: "100%" } });
    const pt = souffle(carre(k, LILAS, "10px"), 3200);
    const lateral = G.colonne(k, [
      nom,
      k.row([pt, k.T("<p>Espaces sécurisés</p>", { fontSize: "14px", color: LILAS, fontFamily: S.font, fontWeight: "700" })], { gap: "10px", alignItems: "center" }),
      k.col([bouton("Espace propriétaire", "/connexion", true), bouton("Espace locataire", "/connexion", false)], { gap: "10px", width: "100%" }),
      trait(k, "#f4eefb33"),
      coordonnees(k, { taille: 15, couleur: "#f4eefb", lien: "#ffffff", survol: LILAS, focus: "#ffffff" }),
    ], { poids: 3, min: "260px", gap: "20px", extra: { backgroundColor: PRUNE, paddingTop: "72px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px", borderRadius: "0px", justifyContent: "flex-start" }, mobile: { minWidth: "100%", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" } });
    const portail = G.bande(k, [principal, lateral], { fond: LILAS_PALE, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Portail" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6c7e6", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { fond: PRUNE2, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [portail, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-218 « Dossier de copropriété » — syndic — ARCHÉTYPE K (fenêtre / console)
// Idée : le pied ressemble à une FENÊTRE d'application posée sur gris glacier : barre de titre noire avec trois petits carrés et le chemin du dossier en police mono, barre d'onglets (assemblées, charges, travaux, sinistres,
// documents) dont les onglets se soulèvent au survol, corps blanc avec le formulaire de la lettre (convocations) et les coordonnées, barre d'état verte avec un carré qui « respire ». Aucun numéro d'urgence inventé.
// Polices : IBM Plex Mono (titres, libellés) et Source Sans 3. Mobile : onglets sur deux colonnes, corps en pile.
const glacier = identite({
  key: "c218", label: "Gris glacier, vert mousse et noir", humeur: "light",
  fond: "#eef1f4", texte: "#18222c", discret: "#47535f", accent: "#2f6b4c", surface: "#ffffff", encre: "#18222c",
  police: "font.source-sans-3", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#18222c33",
});
const ENC18 = "#18222c", GLACE = "#eef1f4", GLACE2 = "#dde3e9", MOUSSE = "#2f6b4c";

const dossierCopropriete = modeleV2({
  id: identifiantV2(218, "dossier-de-copropriete"), concept: "c-218-dossier-de-copropriete",
  name: "Dossier de copropriété", family: FAM,
  description: "Pour un syndic de copropriété : un pied en forme de fenêtre d'application, avec barre de titre en police mono, cinq onglets qui se soulèvent au survol, corps blanc (coordonnées et lettre) et barre d'état verte.",
  tags: ["syndic", "copropriété", "fenêtre", "onglets", "mono", "gris glacier", "vert mousse", "angles droits"],
  identity: glacier,
  racine: racineDe(GLACE),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const carreBarre = (c) => carre(k, c, "12px");
    const titre = k.row([k.row([carreBarre("#ffffff"), carreBarre("#9fb3a8"), carreBarre(MOUSSE)], { gap: "6px" }), mono(k, "copropriete / mon-immeuble / documents", { couleur: "#ffffff", taille: "14px" })], { alignItems: "center", gap: "16px", flexWrap: "nowrap", width: "100%", backgroundColor: ENC18, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "18px", paddingRight: "18px", borderRadius: "0px" });
    const onglet = (t, u, ouvert) => {
      const l = lien(k, t, u, { taille: 15, poids: "600", police: S.head, couleur: ENC18, h: "48px", survol: { color: MOUSSE }, focus: MOUSSE, extra: { paddingLeft: "16px", paddingRight: "16px" } });
      const c = k.row([l], { flexGrow: 1, flexBasis: "0px", minWidth: "140px", alignItems: "center", backgroundColor: ouvert ? "#ffffff" : GLACE2, borderStyle: "solid", borderWidth: "0px", borderRightWidth: "2px", borderBottomWidth: ouvert ? "0px" : "2px", borderColor: ENC18, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "50%" });
      c.states = { hover: { transform: { y: -4 }, backgroundColor: "#ffffff" } };
      return c;
    };
    const onglets = k.row([onglet("Assemblées", "/faq", true), onglet("Charges", "/faq"), onglet("Travaux", "/blog"), onglet("Sinistres", "/contact"), onglet("Documents", "/connexion")], { gap: "0px", flexWrap: "wrap", width: "100%", backgroundColor: GLACE2 });
    const abo = lettre(k, env, G, { titre: "Convocations et avis par courriel", intro: "Recevez les dates d'assemblée et les informations de l'immeuble.", bouton: "S'abonner", largeur: "420px", accent: MOUSSE, surBouton: "#ffffff", texte: ENC18, couleurTitre: MOUSSE, fond: "#ffffff", survolBouton: ENC18, survolTexte: "#ffffff", focus: ENC18 });
    const contact = G.colonne(k, [mono(k, "// coordonnées", { couleur: MOUSSE, taille: "14px", poids: "700" }), coordonnees(k, { taille: 15, lien: ENC18, survol: MOUSSE, focus: MOUSSE })], { poids: 1, min: "240px", gap: "10px" });
    const corps = k.row([contact, G.colonne(k, [abo], { poids: 1.3, min: "260px" })], { ...GK.gaps("32px 48px"), alignItems: "flex-start", width: "100%", backgroundColor: "#ffffff", paddingTop: "36px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", borderRadius: "0px" }, undefined, { paddingLeft: "18px", paddingRight: "18px", paddingTop: "24px", paddingBottom: "24px" });
    const pt = souffle(carre(k, "#ffffff", "10px"), 3000);
    const etat = k.row([pt, mono(k, "En cas d'urgence, utilisez le numéro d'astreinte remis à votre copropriété.", { couleur: "#ffffff", taille: "14px" })], { alignItems: "center", gap: "12px", flexWrap: "nowrap", width: "100%", backgroundColor: MOUSSE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", borderRadius: "0px" });
    const fenetre = k.col([titre, onglets, corps, etat], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "2px", borderColor: ENC18, borderRadius: "0px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bande = G.bande(k, [fenetre, mentions], { fond: GLACE, colonne: true, gap: "28px", padV: ["72px", "56px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Fenêtre" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-219 « Programmes en vitrine » — promoteur — ARCHÉTYPE H (mosaïque asymétrique)
// Idée : une MOSAÏQUE à angles droits séparée par un filet de 3 px : une très grande case noire (titre monumental « Nouveaux programmes. » et trois liens en lignes : en commercialisation, à venir, livrés) et, à droite,
// trois petites cases empilées : sable (coordonnées), gris anthracite (horaires, carré qui « respire »), blanc (lettre). Au survol les liens de la grande case glissent et se soulignent. Aucun programme ni chiffre inventé.
// Polices : Unbounded (titres) et Inter Tight. Mobile : cases empilées.
const vitrine = identite({
  key: "c219", label: "Noir, sable et blanc", humeur: "dark",
  fond: "#0d0d0d", texte: "#f5f1e8", discret: "#bdb6a6", accent: "#e0c9a0", surface: "#171717", encre: "#0d0d0d", surEncre: "#f5f1e8",
  police: "font.inter-tight", titres: "font.unbounded",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f5f1e840",
});
const NOIR19 = "#0d0d0d", SABLE = "#e0c9a0", BRUN = "#6b4f1d";

const programmesVitrine = modeleV2({
  id: identifiantV2(219, "programmes-en-vitrine"), concept: "c-219-programmes-en-vitrine",
  name: "Programmes en vitrine", family: FAM,
  description: "Pour un promoteur immobilier : mosaïque asymétrique à angles droits, une grande case noire avec le titre monumental et trois liens de programmes, face à trois petites cases (coordonnées sur sable, horaires sur anthracite, lettre sur blanc).",
  tags: ["promoteur", "programmes neufs", "mosaïque", "noir", "sable", "capitales", "angles droits", "horaires"],
  identity: vitrine,
  racine: racineDe(NOIR19),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Nouveaux<br>programmes.</p>`, { taille: [26, 60], tablette: { taille: [26, 38] }, mobile: { taille: [24, 34] }, lh: 1.05, suivi: "-0.01em", poids: "800", police: S.head, couleur: "#f5f1e8", extra: { textTransform: "uppercase" } })(k, env);
    const puce = (t, u) => lien(k, t, u, { taille: 15, poids: "700", couleur: "#f5f1e8", h: "48px", padH: "16px", survol: { backgroundColor: SABLE, color: NOIR19, transform: { y: -3 } }, focus: SABLE, extra: { borderStyle: "solid", borderWidth: "2px", borderColor: SABLE, justifyContent: "center", flexGrow: 1 } });
    const grande = G.colonne(k, [titre, k.T("<p>Du premier plan à la remise des clés : les programmes de chaque étape. Rubriques à relier à vos opérations.</p>", { fontSize: "16px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "440px" }), k.row([puce("En commercialisation", "/blog"), puce("À venir", "/blog"), puce("Livrés", "/blog")], { width: "100%", gap: "10px" })], { poids: 7, min: "340px", gap: "28px", extra: { backgroundColor: NOIR19, paddingTop: "80px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px", borderRadius: "0px", justifyContent: "space-between" }, mobile: { minWidth: "100%", paddingTop: "44px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    const petite = (fond, enfants, extra = {}) => G.colonne(k, enfants, { poids: 1, min: "0px", gap: "10px", extra: { backgroundColor: fond, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", borderRadius: "0px", justifyContent: "center", flexBasis: "auto", ...extra }, mobile: { paddingLeft: "20px", paddingRight: "20px" } });
    const nomBas = nomDuSite(k, env, 22, NOIR19);
    const cSable = petite(SABLE, [nomBas, coordonnees(k, { taille: 15, couleur: NOIR19, lien: NOIR19, survol: BRUN, focus: BRUN })]);
    const pt = souffle(carre(k, SABLE, "10px"), 3200);
    const cGris = petite("#2a2a2a", [k.row([pt, k.T("<p>Horaires d'accueil</p>", { fontSize: "16px", fontWeight: "700", color: SABLE, fontFamily: S.head })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: "#f5f1e8" })]);
    const abo = lettre(k, env, G, { titre: "Lancements par courriel", intro: "Soyez prévenu des nouveaux programmes.", bouton: "S'abonner", largeur: "100%", accent: NOIR19, surBouton: "#ffffff", texte: NOIR19, couleurTitre: BRUN, fond: "#ffffff", survolBouton: BRUN, survolTexte: "#ffffff", focus: NOIR19 });
    const cBlanc = petite("#ffffff", [abo]);
    const droite = k.col([cSable, cGris, cBlanc], { flexGrow: 4, flexBasis: "0px", minWidth: "300px", gap: "3px", borderRadius: "0px" }, undefined, { minWidth: "100%" });
    const mosaique = G.bande(k, [grande, droite], { fond: "#f5f1e8", gap: "3px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Mosaïque" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfc9ba", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { fond: NOIR19, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [mosaique, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-220 « Fiche de recherche » — chasseur d'appartements — ARCHÉTYPE I (frise en étapes)
// Idée : le parcours d'une RECHERCHE sur une frise horizontale : une règle noire épaisse traverse quatre carrés numérotés (brief, sélection, visites, négociation) ; au survol le carré se soulève et se remplit de tomate.
// Le titre est un texte courant en grand format ; la fin de la frise est un petit pavé « honoraires » (texte neutre, aucun tarif). Dessous, une seule rangée menthe : coordonnées à gauche, lettre à droite.
// Polices : Lexend (titres) et Mulish. Mobile : étapes en pile.
const menthe = identite({
  key: "c220", label: "Menthe pâle, vert sapin et tomate", humeur: "light",
  fond: "#e6f2ec", texte: "#10231c", discret: "#3f5a4f", accent: "#a82a14", surface: "#ffffff", encre: "#10231c",
  police: "font.mulish", titres: "font.lexend",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "3px", ligne: "#10231c33",
});
const SAPIN = "#10231c", MENTHE = "#e6f2ec", MENTHE2 = "#cfe6da", TOMATE = "#a82a14";

const ficheRecherche = modeleV2({
  id: identifiantV2(220, "fiche-de-recherche"), concept: "c-220-fiche-de-recherche",
  name: "Fiche de recherche", family: FAM,
  description: "Pour un chasseur d'appartements : une frise horizontale de quatre étapes numérotées (brief, sélection, visites, négociation) reliées par une règle épaisse, des carrés qui se soulèvent au survol, un pavé honoraires à compléter, puis coordonnées et lettre.",
  tags: ["chasseur d'appartements", "recherche immobilière", "frise", "étapes", "menthe", "sapin", "tomate", "angles droits"],
  identity: menthe,
  racine: racineDe(MENTHE2),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 24, SAPIN);
    const phrase = G.geant(`<p>Dites-nous ce que vous cherchez, nous nous occupons du reste.</p>`, { taille: [28, 52], tablette: { taille: [36, 46] }, mobile: { taille: [26, 32] }, lh: 1.15, suivi: "-0.01em", poids: "500", police: S.head, couleur: SAPIN })(k, env);
    const btn = lien(k, "Décrire ma recherche", "/contact", { taille: 16, poids: "700", couleur: "#ffffff", h: "54px", padH: "28px", survol: { backgroundColor: SAPIN, transform: { y: -3 } }, focus: SAPIN, extra: { backgroundColor: TOMATE, justifyContent: "center", alignSelf: "flex-start" } });
    const haut = G.ligne(k, [G.colonne(k, [nom, phrase], { poids: 7, min: "300px", gap: "16px" }), G.colonne(k, [btn], { poids: 3, min: "240px", soi: "flex-end" })], { gap: "28px 48px", aligne: "flex-end", largeur: "100%" });
    const etape = (n, t, texte, u) => {
      const carreNum = k.col([k.T(`<p>${n}</p>`, { fontSize: "28px", fontWeight: "700", lineHeight: 1, color: SAPIN, fontFamily: S.head, textAlign: "center" })], { width: "68px", height: "68px", flexShrink: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "3px", borderColor: SAPIN, borderRadius: "0px", transitionDuration: DOUX });
      carreNum.states = { hover: { backgroundColor: TOMATE } };
      const l = lien(k, t, u, { taille: 20, poids: "700", police: S.head, couleur: SAPIN, survol: { color: TOMATE }, focus: TOMATE, h: "44px" });
      const c = k.col([carreNum, l, k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.55, color: S.mute, fontFamily: S.font })], { flexGrow: 1, flexBasis: "0px", minWidth: "190px", gap: "10px", paddingRight: "12px", transitionDuration: DOUX });
      c.states = { hover: { transform: { y: -6 } } };
      return c;
    };
    const honor = k.col([k.T("<p>Honoraires</p>", { fontSize: "20px", fontWeight: "700", color: SAPIN, fontFamily: S.head }), k.T("<p>Les modalités de rémunération sont présentées avant toute mission. Texte à compléter dans l'éditeur.</p>", { fontSize: "15px", lineHeight: 1.55, color: SAPIN, fontFamily: S.font })], { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "10px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "18px", paddingRight: "18px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "3px", borderColor: SAPIN, borderRadius: "0px" });
    const regle = k.col([], { position: "absolute", width: "100%", height: "6px", backgroundColor: SAPIN, borderRadius: "0px" });
    const frise = G.ligne(k, [
      etape("1", "Brief", "On précise vos critères, votre budget et vos priorités.", "/contact"),
      etape("2", "Sélection", "Une sélection de biens, y compris avant leur mise en vente.", "/blog"),
      etape("3", "Visites", "Les visites organisées et accompagnées.", "/contact"),
      etape("4", "Négociation", "L'offre, la négociation et le suivi jusqu'à l'acte.", "/faq"),
      honor,
    ], { gap: "24px", aligne: "flex-start", largeur: "100%" });
    const filetFrise = trait(k, SAPIN, "6px");
    const haute = G.bande(k, [haut, filetFrise, frise], { fond: MENTHE, colonne: true, gap: "32px", padV: ["80px", "64px", "44px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Frise" });
    // une seule rangée basse : coordonnées + lettre
    const cContact = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: SAPIN, survol: TOMATE, focus: TOMATE })], { couleurTitre: TOMATE });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils d'achat et nouvelles de l'agence, par courriel.", bouton: "S'abonner", largeur: "420px", accent: TOMATE, surBouton: "#ffffff", texte: SAPIN, couleurTitre: TOMATE, fond: MENTHE2, survolBouton: SAPIN, survolTexte: "#ffffff", focus: SAPIN });
    const grille = G.ligne(k, [cContact, G.colonne(k, [abo], { poids: 1.4, min: "280px" })], { gap: "32px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const basse = G.bande(k, [grille, mentions], { fond: MENTHE2, colonne: true, gap: "32px", padV: ["48px", "40px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "4px", couleur: SAPIN }, nom: "Contact" });
    return [G.racine(k, [haute, basse])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Agences immobilières", target: 5, built: true,
  description: "Pieds d'agences immobilières standard et très professionnels, à angles droits : index géant, portail à colonne latérale, fenêtre de syndic, mosaïque de programmes, frise de recherche.",
  models: [estimerAcheterLouer, portailGestion, dossierCopropriete, programmesVitrine, ficheRecherche],
};
