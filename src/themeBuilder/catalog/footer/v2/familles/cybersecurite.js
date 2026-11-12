// Famille v2 « Cybersécurité » — 6 modèles (ft2-284 à ft2-289), série « inspirée de captures » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds d'un cabinet / éditeur de cybersécurité fictif : signalement d'incident, audit, services, documentation, coordonnées (widgets « Données de l'entreprise »), lettre d'information, mentions légales.
// AUCUNE coordonnée, AUCUN chiffre, AUCUNE promesse de protection ni certification inventés ; les intitulés de services sont des EXEMPLES à renommer dans l'éditeur. Adresses de réseaux : exemples.
// Inspirations (captures du propriétaire : colonnes titrées, bandeau en tête, navigation à gauche / contact à droite) : idées de composition seulement, traduites en blocs à angles nets.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 8 px) ; UNE animation visible par modèle : carré d'alerte qui respire, flèche qui glisse, case qui se soulève, rangée qui s'indente.
const FAM = "cybersecurite";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");
const DOUX = 360; // ms : transitions de survol / focus
// ── Aides LOCALES (toutes à angles droits) ────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.55, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, fontWeight: o.poids, textAlign: o.align, ...(o.extra || {}) }));
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
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
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
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "700", couleur: o.texte, h: "52px", padH: "28px", casse: o.casse, suivi: o.suivi, police: o.police, survol: o.survol || { backgroundColor: o.texte, color: o.fond, transform: { y: -3 } }, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const reseaux = (k, env, G, o) => G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["GitHub", "https://github.com/"], ["X", "https://x.com/"]], { taille: o.taille || 15, poids: "700", couleur: o.couleur, survol: o.survol, focus: o.focus })(k, env);
const PH = ["48px", "32px", "20px"];
const PLAT = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]];

// ═══ ft2-284 « Ligne de défense » — [E : deux demi-pages bord à bord de couleurs opposées] ═══════════════════════════════════════════════════
// Idée : le pied est coupé en deux moitiés. À gauche, sur noir, le message en lettres condensées géantes « Détecter. Contenir. Rétablir. » ; à droite, sur jaune acide, les actions : deux boutons, liens et coordonnées. Au survol les liens se remplissent de noir. Polices : League Gothic et IBM Plex Sans.
const defenseId = identite({
  key: "c284", label: "Noir et jaune acide", humeur: "dark",
  fond: "#0a0a0a", texte: "#ffffff", discret: "#bdbdbd", accent: "#c8ff00", surface: "#1a1a1a", encre: "#0a0a0a", surEncre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.league-gothic", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#ffffff44",
});
const ligneDefense = modeleV2({
  id: identifiantV2(284, "ligne-de-defense"), concept: "c-284-ligne-de-defense", name: "Ligne de défense", family: FAM,
  description: "Pour un cabinet de cybersécurité : deux demi-pages bord à bord, noir (message en lettres condensées géantes) et jaune acide (boutons de signalement et d'audit, liens, coordonnées), puis une barre de mentions.",
  tags: ["cybersécurité", "deux moitiés", "noir", "jaune acide", "condensé", "incident", "angles droits"],
  identity: defenseId, racine: racineDe("#0a0a0a"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, N = "#0a0a0a", L = "#c8ff00";
    const phrase = G.geant(`<p>Détecter.<br>Contenir.<br><span style="color:${L}">Rétablir.</span></p>`, { taille: [72, 190], lh: 0.92, suivi: "0.005em", poids: "400", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const gauche = G.colonne(k, [caps(k, "Cybersécurité", { couleur: L, suivi: "0.24em" }), phrase, texte(k, "Cabinet de conseil en cybersécurité.", { taille: 15, couleur: "#bdbdbd", max: "380px" })], { poids: 1, min: "340px", gap: "24px", extra: { flexBasis: "50%", backgroundColor: N, paddingTop: "72px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "40px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" }, tablette: { paddingLeft: "32px" } });
    const b1 = bouton(k, "Signaler un incident", "/contact", { texte: "#ffffff", fond: N, survol: { backgroundColor: "#ffffff", color: N, borderColor: N, transform: { y: -3 } }, focus: N, taille: 15, casse: "uppercase", suivi: "0.08em" });
    const b2 = bouton(k, "Demander un audit", "/contact", { texte: N, fond: undefined, bord: N, survol: { backgroundColor: N, color: L, transform: { y: -3 } }, focus: N, taille: 15, casse: "uppercase", suivi: "0.08em" });
    const alerte = k.row([souffle(carre(k, N, "12px"), 2400), caps(k, "Signalement", { couleur: N, suivi: "0.2em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const LIENS = [["Services", "/faq"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const liste = k.col(LIENS.map(([t, u]) => { const l = lien(k, t, u, { taille: 22, poids: "500", couleur: N, survol: { backgroundColor: N, color: L, paddingLeft: "14px" }, focus: N, h: "52px", extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: N } }); return l; }), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: N });
    const droite = G.colonne(k, [alerte, k.row([b1, b2], { gap: "12px" }), liste, coordonnees(k, { taille: 15, couleur: N, lien: N, survol: "#3b4a00", focus: N })], { poids: 1, min: "340px", gap: "24px", extra: { flexBasis: "50%", backgroundColor: L, paddingTop: "72px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "48px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "36px" }, tablette: { paddingRight: "32px" } });
    droite.children = droite.children.map((c, i) => { if (i === 2) c.styles.desktop = { ...c.styles.desktop, width: "100%" }; return c; });
    const deux = G.bande(k, [gauche, droite], { fond: N, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Deux moitiés" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d0d0d0", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: N, padV: ["22px", "20px", "16px"], padB: ["22px", "20px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [deux, bas])];
  },
}, FAM);

// ═══ ft2-285 « Alerte rouge » — [F : bandeau d'appel à l'action XXL en haut + liens en une seule colonne étroite à droite] ═══════════════════
// Idée : un bandeau rouge sirène aux lettres Anton énormes « Une alerte ? Parlons-en. » avec un bouton blanc ; dessous, sur aubergine très sombre, les coordonnées à gauche et UNE colonne étroite de liens à droite, filets entre chaque lien. Polices : Anton et Libre Franklin.
const alerteId = identite({
  key: "c285", label: "Rouge sirène et aubergine", humeur: "dark",
  fond: "#14070a", texte: "#fff4f4", discret: "#d1aeb2", accent: "#ff6b73", surface: "#22090e", encre: "#14070a", surEncre: "#fff4f4",
  police: "font.libre-franklin", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#fff4f444",
});
const alerteRouge = modeleV2({
  id: identifiantV2(285, "alerte-rouge"), concept: "c-285-alerte-rouge", name: "Alerte rouge", family: FAM,
  description: "Pour un éditeur de cybersécurité : un bandeau rouge d'appel à l'action en lettres géantes, puis, sur aubergine, les coordonnées à gauche et une seule colonne étroite de liens à droite, avec flèche qui glisse.",
  tags: ["cybersécurité", "appel à l'action", "bandeau", "rouge", "colonne étroite", "alerte", "angles droits"],
  identity: alerteId, racine: racineDe("#14070a"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, R = "#c1121f", F = "#14070a";
    const phrase = G.geant("<p>Une alerte ?<br>Parlons-en.</p>", { taille: [56, 180], lh: 0.95, suivi: "0.005em", poids: "400", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const btn = bouton(k, "Contacter l'équipe  →", "/contact", { texte: R, fond: "#ffffff", survol: { backgroundColor: F, borderColor: F, color: "#ffffff", transform: { x: 8 } }, focus: F, taille: 18, casse: "uppercase", suivi: "0.08em", extra: { alignSelf: "flex-start", paddingLeft: "36px", paddingRight: "36px", minHeight: "64px" } });
    const haut = G.bande(k, [souffle(carre(k, "#ffffff", "14px"), 2200), phrase, btn], { fond: R, colonne: true, aligne: "flex-start", gap: "24px", padV: ["72px", "56px", "40px"], padB: ["64px", "48px", "36px"], padH: PH, nom: "Appel" });
    const gauche = G.colonne(k, [caps(k, "Nous joindre", { couleur: "#ff6b73", suivi: "0.22em" }), coordonnees(k, { taille: 16, couleur: "#fff4f4", lien: "#ffffff", survol: "#ff6b73", focus: "#ffffff" }), texte(k, "Décrivez la situation : l'équipe vous répondra.", { taille: 15, couleur: "#d1aeb2", max: "340px" })], { poids: 1, min: "260px", gap: "18px" });
    const LIENS = [["Services", "/faq"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const colonne = k.col(LIENS.map(([t, u]) => { const l = lien(k, t, u, { taille: 17, poids: "600", couleur: "#fff4f4", survol: { color: "#ff6b73", transform: { x: 8 } }, focus: "#ff6b73", h: "52px", extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#fff4f444" } }); return l; }), { gap: "0px", width: "100%", maxWidth: "280px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: "#ff6b73" }, undefined, { maxWidth: "100%" });
    const corps = G.bande(k, [gauche, G.colonne(k, [colonne], { poids: 0, min: "240px", extra: { flexBasis: "280px", flexGrow: 0 } })], { fond: F, aligne: "flex-start", gap: "40px 80px", padV: ["56px", "44px", "36px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Contacts et liens" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d1aeb2", liens: "#fff4f4" })(k, env);
    const bas = G.bande(k, [mentions], { fond: F, padV: ["12px", "12px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#fff4f4";
    return [G.racine(k, [haut, corps, bas])];
  },
}, FAM);

// ═══ ft2-286 « Salle des opérations » — [H : mosaïque asymétrique, une grande case + trois petites] ═══════════════════════════════════════════
// Idée : une mosaïque inversée. Trois petites cases empilées à GAUCHE (Signaler, Audit, Documentation : lien, flèche qui glisse) et la GRANDE case indigo à droite (nom, phrase, lettre d'information, coordonnées). Cases séparées de 6 px. Polices : Chivo (titres, 800) et Source Sans 3.
const operationsId = identite({
  key: "c286", label: "Indigo, cyan et lavande", humeur: "dark",
  fond: "#10173a", texte: "#f1f3ff", discret: "#b9c1ee", accent: "#38d5e8", surface: "#1b2563", encre: "#10173a", surEncre: "#f1f3ff",
  police: "font.source-sans-3", titres: "font.chivo", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f1f3ff33",
});
const salleOperations = modeleV2({
  id: identifiantV2(286, "salle-des-operations"), concept: "c-286-salle-des-operations", name: "Salle des opérations", family: FAM,
  description: "Pour un centre de cybersécurité : mosaïque asymétrique en indigo, cyan et lavande ; trois petites cases-liens empilées à gauche, une grande case à droite avec le nom, la lettre d'information et les coordonnées.",
  tags: ["cybersécurité", "mosaïque", "indigo", "cyan", "opérations", "lettre", "angles droits"],
  identity: operationsId, racine: racineDe("#10173a"),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, IND = "#1b2563", FOND = "#10173a", CY = "#38d5e8", LAV = "#dfe3ff";
    const petite = (num, t, d, u, fond, encre, vif) => {
      const titre = lien(k, t, u, { taille: 26, poids: "800", police: S.head, couleur: encre, survol: { color: vif, transform: { x: 6 } }, focus: vif === "#ffffff" ? "#ffffff" : encre, h: "48px", lh: 1.1 });
      const c = k.col([k.row([caps(k, num, { couleur: encre, suivi: "0.2em" }), k.T("<p>→</p>", { fontSize: "26px", color: encre, fontFamily: S.font, lineHeight: 1 })], { justifyContent: "space-between", alignItems: "center", width: "100%" }), k.col([titre, texte(k, d, { taille: 15, couleur: encre })], { gap: "4px" })], { flexGrow: 1, flexBasis: "auto", minHeight: "150px", justifyContent: "space-between", gap: "18px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "26px", paddingRight: "22px", backgroundColor: fond, borderRadius: "0px", transitionDuration: DOUX, width: "100%" }, undefined, { minHeight: "0px", paddingLeft: "20px" });
      c.states = { hover: { transform: { y: -4 } } };
      return c;
    };
    const petites = G.colonne(k, [petite("01", "Signaler", "Un incident, un doute.", "/contact", CY, FOND, "#ffffff"), petite("02", "Auditer", "Faire le point sur vos systèmes.", "/contact", LAV, FOND, "#1b2563"), petite("03", "Comprendre", "Guides et questions fréquentes.", "/faq", "#2b3a8f", "#f1f3ff", CY)], { poids: 4, min: "300px", gap: "6px", extra: { alignSelf: "stretch" } });
    const nom = nomDuSite(k, env, 30, "#ffffff", { fontWeight: "800" });
    const phrase = G.geant("<p>Chaque alerte<br>mérite une réponse.</p>", { taille: [32, 64], lh: 1.02, suivi: "-0.02em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Alertes et bonnes pratiques par e-mail.", bouton: "S'abonner", largeur: "400px", accent: CY, surBouton: FOND, texte: "#f1f3ff", couleurTitre: CY, fond: IND, survolBouton: "#ffffff", survolTexte: FOND, focus: "#ffffff" });
    const coord = G.colonne(k, [caps(k, "Contact", { couleur: CY, suivi: "0.2em" }), coordonnees(k, { taille: 15, couleur: "#f1f3ff", lien: "#ffffff", survol: CY, focus: "#ffffff" })], { poids: 1, min: "240px", gap: "10px" });
    const grande = G.colonne(k, [nom, phrase, G.ligne(k, [G.colonne(k, [abo], { poids: 1.2, min: "280px" }), coord], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" })], { poids: 8, min: "340px", gap: "28px", extra: { backgroundColor: IND, paddingTop: "48px", paddingBottom: "48px", paddingLeft: "48px", paddingRight: "44px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" } });
    const mosaique = G.bande(k, [petites, grande], { fond: FOND, gap: "6px", aligne: "stretch", padV: ["6px", "6px", "6px"], padB: ["6px", "6px", "6px"], padH: ["6px", "6px", "6px"], max: "1920px", nom: "Mosaïque" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d4daf7", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: FOND, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

// ═══ ft2-287 « Cabinet de sécurité » — [J : papier à en-tête, cartouche centré, filets doubles, liens en ligne centrée] ═══════════════════════
// Idée : le pied d'un CABINET sur papier crème : filets doubles en haut, nom en serif centré, adresse en cartouche, liens en une ligne centrée, sceau carré bordeaux, filets doubles en bas, mentions centrées. Aucune animation spectaculaire : le sceau respire, les liens se soulignent. Polices : Libre Baskerville et Karla.
const cabinetId = identite({
  key: "c287", label: "Crème, marine et bordeaux", humeur: "light",
  fond: "#f5f0e6", texte: "#1a2540", discret: "#4a4f6a", accent: "#8b1a1a", surface: "#ffffff", encre: "#1a2540", surEncre: "#f5f0e6",
  police: "font.karla", titres: "font.libre-baskerville", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1a254066",
});
const cabinetSecurite = modeleV2({
  id: identifiantV2(287, "cabinet-de-securite"), concept: "c-287-cabinet-de-securite", name: "Cabinet de sécurité", family: FAM,
  description: "Pour un cabinet de conseil en cybersécurité : pied « papier à en-tête » centré, filets doubles, nom serif, cartouche d'adresse, liens en une ligne et sceau carré bordeaux, sur crème et marine.",
  tags: ["cybersécurité", "cabinet", "papier à en-tête", "centré", "serif", "crème", "bordeaux", "angles droits"],
  identity: cabinetId, racine: racineDe("#1a2540"),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#1a2540", BORD = "#8b1a1a", CREME = "#f5f0e6";
    const doubles = () => k.col([trait(k, ENC, "3px"), trait(k, ENC, "1px")], { gap: "4px", width: "100%" });
    const sceau = souffle(carre(k, BORD, "16px"), 3400);
    const nom = nomDuSite(k, env, 40, ENC, { fontFamily: S.head, fontWeight: "700", textAlign: "center" });
    const sous = caps(k, "Conseil en sécurité des systèmes d'information", { couleur: BORD, suivi: "0.22em", extra: { textAlign: "center" } });
    const cartouche = k.col([caps(k, "Cabinet", { couleur: S.mute, suivi: "0.24em", extra: { textAlign: "center" } }), coordonnees(k, { taille: 16, couleur: ENC, lien: ENC, survol: BORD, focus: BORD, align: "center" })], { gap: "8px", alignItems: "center", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "40px", paddingRight: "40px", borderStyle: "solid", borderWidth: "1px", borderColor: ENC, borderRadius: "0px", maxWidth: "460px", width: "100%" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const liens = G.ligne(k, [["Services", "/faq"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "700", couleur: ENC, soulign: false, survol: { color: BORD, borderColor: BORD }, focus: BORD, padH: "6px", extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#f5f0e600" } })), { gap: "0px 24px", aligne: "center", justifie: "center", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre du cabinet", intro: "Un message d'information, de temps en temps.", bouton: "S'abonner", largeur: "420px", accent: BORD, surBouton: "#ffffff", texte: ENC, couleurTitre: BORD, fond: CREME, survolBouton: ENC, survolTexte: "#ffffff", focus: ENC });
    const sep = () => carre(k, "#1a254066", "6px");
    const liensSep = G.ligne(k, liens.children.flatMap((l, i) => (i ? [sep(), l] : [l])), { gap: "0px 10px", aligne: "center", justifie: "center", largeur: "100%" });
    const corps = G.bande(k, [sceau, nom, doubles(), sous, cartouche, doubles(), liensSep, abo], { fond: CREME, colonne: true, aligne: "center", gap: "22px", max: "960px", padV: ["56px", "44px", "32px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "En-tête" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#e3e6f0", liens: "#ffffff" })(k, env, true)], { fond: ENC, aligne: "center", padV: ["22px", "20px", "16px"], padB: ["22px", "20px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═══ ft2-288 « Veille permanente » — [D : une seule ligne horizontale type barre de navigation inversée] ═════════════════════════════════════════
// Idée : pied COMPACT, tout sur deux lignes d'une barre noire : nom, quatre liens, voyant ambre qui respire (« Statut ») ; en dessous les mentions. Aucune colonne, aucune lettre : le contraire d'un gros pied. Polices : Geist Mono (titres) et Geist.
const veilleId = identite({
  key: "c288", label: "Noir graphite et ambre", humeur: "dark",
  fond: "#0b0d10", texte: "#f2f2f2", discret: "#a1a7ae", accent: "#ffb000", surface: "#15181d", encre: "#0b0d10", surEncre: "#f2f2f2",
  police: "font.geist", titres: "font.geist-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#f2f2f244",
});
const veillePermanente = modeleV2({
  id: identifiantV2(288, "veille-permanente"), concept: "c-288-veille-permanente", name: "Veille permanente", family: FAM,
  description: "Pour un éditeur de sécurité : un pied compact en barre noire, nom, quatre liens et voyant ambre « statut » qui respire sur une seule ligne, les mentions dessous. Sans colonnes ni lettre.",
  tags: ["cybersécurité", "compact", "barre", "une ligne", "noir", "ambre", "statut", "angles droits"],
  identity: veilleId, racine: racineDe("#0b0d10"),
  widgets: ["sitetitle", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, AMB = "#ffb000", F = "#0b0d10";
    const nom = nomDuSite(k, env, 20, "#f2f2f2", { fontFamily: S.head, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" });
    const liens = k.row([["Services", "/faq"], ["Actualités", "/blog"], ["Contact", "/contact"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "500", couleur: "#f2f2f2", survol: { color: AMB, transform: { y: -2 } }, focus: AMB, padH: "14px", police: S.head })).flat(), { gap: "0px", alignItems: "center", flexWrap: "wrap" });
    const statut = k.row([souffle(carre(k, AMB, "10px"), 2200), lien(k, "Statut", "/faq", { taille: 15, poids: "700", couleur: AMB, survol: { color: "#ffffff", transform: { x: 3 } }, focus: "#ffffff", police: S.head })], { gap: "8px", alignItems: "center", flexWrap: "nowrap" });
    const barre = G.bande(k, [nom, liens, statut], { fond: F, aligne: "center", justifie: "space-between", gap: "8px 32px", padV: ["20px", "18px", "16px"], padB: ["8px", "8px", "8px"], padH: PH, filetHaut: { epaisseur: "4px", couleur: AMB }, max: "1500px", nom: "Barre" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#a1a7ae", liens: "#f2f2f2" })(k, env);
    const bas = G.bande(k, [mentions], { fond: F, padV: ["8px", "8px", "8px"], padB: ["20px", "18px", "16px"], padH: PH, max: "1500px", nom: "Mentions" });
    bas.styles.desktop.color = "#f2f2f2";
    return [G.racine(k, [barre, bas])];
  },
}, FAM);

// ═══ ft2-289 « Paliers de confinement » — [L : pied en escalier, bandes de largeurs décroissantes alignées à gauche] ═══════════════════════════
// Idée : un ESCALIER de quatre marches de largeurs 100 %, 85 %, 70 %, 52 % alignées à gauche, de plus en plus sombres : le message, les liens et le bouton, les coordonnées, enfin les mentions. Le vide à droite est l'encre de la racine. Un carré orange respire sur la 3e marche. Polices : Teko (titres) et Hanken Grotesk.
const paliersId = identite({
  key: "c289", label: "Acier, bleu froid et orange", humeur: "light",
  fond: "#e8edf3", texte: "#14202c", discret: "#3d4f61", accent: "#a63d00", surface: "#ffffff", encre: "#14202c", surEncre: "#e8edf3",
  police: "font.hanken-grotesk", titres: "font.teko", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#14202c55",
});
const paliersConfinement = modeleV2({
  id: identifiantV2(289, "paliers-de-confinement"), concept: "c-289-paliers-de-confinement", name: "Paliers de confinement", family: FAM,
  description: "Pour une entreprise de cybersécurité : un pied en escalier à quatre marches de largeurs décroissantes alignées à gauche (message, liens et bouton, coordonnées, mentions), du gris acier à l'encre.",
  tags: ["cybersécurité", "escalier", "marches", "acier", "orange", "paliers", "angles droits"],
  identity: paliersId, racine: racineDe("#14202c"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENC = "#14202c", OR = "#a63d00", ORL = "#ff8a3d";
    const marche = (enfants, fond, largeur, pad) => k.col(enfants, { width: largeur, backgroundColor: fond, gap: "16px", paddingTop: pad[0], paddingBottom: pad[1], paddingLeft: "48px", paddingRight: "40px", borderRadius: "0px", alignItems: "flex-start" }, { width: "100%", paddingLeft: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "28px", paddingBottom: "28px" });
    const phrase = G.geant("<p>Contenir vite,<br>réparer bien.</p>", { taille: [48, 140], lh: 0.95, suivi: "0em", poids: "600", police: S.head, couleur: ENC, extra: { textTransform: "uppercase" } })(k, env);
    const m1 = marche([caps(k, "Cybersécurité", { couleur: OR, suivi: "0.24em" }), phrase], "#e8edf3", "100%", ["64px", "40px"]);
    const liens = G.ligne(k, PLAT.slice(0, 4).map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: ENC, soulign: true, survol: { color: OR, transform: { x: 4 } }, focus: OR, padH: "0px", extra: { marginRight: "24px" } })), { gap: "0px", aligne: "center", largeur: "100%" });
    const btn = bouton(k, "Signaler un incident", "/contact", { texte: "#ffffff", fond: ENC, survol: { backgroundColor: OR, borderColor: OR, color: "#ffffff", transform: { x: 6 } }, focus: OR, taille: 15, casse: "uppercase", suivi: "0.08em" });
    const m2 = marche([liens, btn], "#c5d3e0", "85%", ["32px", "32px"]);
    const m3 = marche([k.row([souffle(carre(k, OR, "12px"), 2800), caps(k, "Nous joindre", { couleur: ENC, suivi: "0.2em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), coordonnees(k, { taille: 15, couleur: ENC, lien: ENC, survol: OR, focus: OR })], "#8fa9c0", "70%", ["28px", "28px"]);
    const m4 = marche([reseaux(k, env, G, { couleur: "#ffffff", survol: ORL, focus: ORL, taille: 14 }), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6dee7", liens: "#ffffff", })(k, env)], ENC, "52%", ["24px", "28px"]);
    m4.styles.desktop.gap = "10px";
    const bande = G.bande(k, [m1, m2, m3, m4], { fond: ENC, colonne: true, aligne: "flex-start", gap: "0px", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Escalier" });
    bande.styles.desktop.color = "#ffffff";
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cybersécurité", target: 6, built: true,
  description: "Pieds de cabinets et d'éditeurs de cybersécurité, angles droits : deux moitiés noir et jaune, bandeau d'alerte, mosaïque d'opérations, papier à en-tête, barre compacte, escalier à quatre marches.",
  models: [ligneDefense, alerteRouge, salleOperations, cabinetSecurite, veillePermanente, paliersConfinement],
};
