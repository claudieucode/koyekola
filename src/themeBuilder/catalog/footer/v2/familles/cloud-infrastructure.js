// Famille v2 « Cloud et infrastructure » — 6 modèles (ft2-278 à ft2-283), série « inspirée de captures » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds d'un hébergeur / fournisseur cloud fictif (marques fictives « Cumulo » & co) : services, statut, documentation, coordonnées et horaires du support (widgets « Données de l'entreprise »), lettre d'information, mentions légales.
// AUCUNE coordonnée, AUCUN chiffre, AUCUNE promesse de disponibilité inventés ; les noms de services sont des intitulés d'EXEMPLE à renommer dans l'éditeur. Adresses de réseaux : exemples.
// Inspirations (captures du propriétaire, idées de composition uniquement) : nom monumental sur dégradé + navigation à gauche / contact à droite (278) ; quatre colonnes titrées newsletter / réseaux (282, 283), en version claire et sombre.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 8 px) ; UNE animation visible par modèle : carré de statut qui respire, curseur de console, rangée qui s'indente, case qui se soulève.
const FAM = "cloud-infrastructure";
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

// ═══ ft2-278 « Nuage monumental » — [B : nom monumental au centre, très peu de liens, grand vide] ═══════════════════════════════════════════
// Idée (capture 1 : nom géant fondu dans un dégradé) : sur un dégradé ardoise vers vert-de-gris, quatre liens à gauche, le contact à droite, puis le NOM « Cumulo » énorme qui occupe toute la largeur. Polices : Sora (titres) et DM Sans.
const nuageId = identite({
  key: "c278", label: "Ardoise et vert-de-gris", humeur: "dark",
  fond: "#0b1a1e", texte: "#f0fafb", discret: "#a9c9cd", accent: "#7fe0e6", surface: "#12333a", encre: "#0b1a1e", surEncre: "#f0fafb",
  police: "font.dm-sans", titres: "font.sora", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f0fafb44",
});
const nuageMonumental = modeleV2({
  id: identifiantV2(278, "nuage-monumental"), concept: "c-278-nuage-monumental", name: "Nuage monumental", family: FAM,
  description: "Pour un fournisseur cloud : quatre grands liens à gauche, coordonnées et réseaux à droite, puis un nom géant qui occupe toute la largeur sur un dégradé ardoise et vert-de-gris. Très peu de liens, beaucoup de vide.",
  tags: ["cloud", "hébergeur", "nom géant", "dégradé", "sobre", "ardoise", "angles droits"],
  identity: nuageId, racine: racineDe("#14565e"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BLANC = "#f0fafb", CYAN = "#7fe0e6";
    const nav = [["Services", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 28, poids: "600", police: S.head, couleur: BLANC, survol: { color: CYAN, transform: { x: 8 } }, focus: CYAN, h: "52px" }));
    const statut = k.row([souffle(carre(k, CYAN, "10px"), 3000), lien(k, "Statut des services", "/faq", { taille: 15, couleur: "#a9c9cd", survol: { color: CYAN, transform: { x: 4 } }, focus: CYAN })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const gauche = G.colonne(k, [...nav, statut], { poids: 4, min: "240px", gap: "2px" });
    const droite = G.colonne(k, [coordonnees(k, { taille: 16, couleur: "#d6eef0", lien: BLANC, survol: CYAN, focus: CYAN, align: "right" })], { poids: 4, min: "260px", gap: "20px", aligne: "flex-end", soi: "flex-start", mobile: { alignItems: "flex-start" } });
    const nom = G.geant("<p>Cumulo</p>", { taille: [72, 200], lh: 0.95, suivi: "-0.045em", poids: "800", police: S.head, couleur: "#cdeff2" })(k, env);
    const haut = G.bande(k, [nom, G.ligne(k, [gauche, droite], { gap: "32px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { degrade: { from: "#0b1a1e", to: "#14565e", angle: 180 }, colonne: true, gap: "40px", max: "1500px", padV: ["56px", "44px", "32px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Nom géant" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6eef0", liens: BLANC })(k, env);
    const bas = G.bande(k, [reseaux(k, env, G, { couleur: BLANC, survol: CYAN, focus: CYAN }), mentions], { fond: "#14565e", gap: "12px 40px", aligne: "center", justifie: "space-between", padV: ["24px", "20px", "16px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = BLANC;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-279 « Index des services » — [G : sommaire en lignes pleine largeur, grand libellé, flèche, filet] ═══════════════════════════════════
// Idée : un INDEX d'imprimerie. Six lignes pleine largeur (numéro, grand libellé serif, flèche) séparées par des filets ; la ligne se teinte et s'indente au survol, la flèche vermillon glisse. Pas de cartes. Polices : Instrument Serif et Inter Tight.
const indexId = identite({
  key: "c279", label: "Papier chaud et vermillon", humeur: "light",
  fond: "#f6f2ea", texte: "#17140f", discret: "#5a5246", accent: "#c8321a", surface: "#ffffff", encre: "#17140f", surEncre: "#f6f2ea",
  police: "font.inter-tight", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#17140f55",
});
const indexServices = modeleV2({
  id: identifiantV2(279, "index-des-services"), concept: "c-279-index-des-services", name: "Index des services", family: FAM,
  description: "Pour un hébergeur : un sommaire en six grandes lignes pleine largeur (calcul, stockage, réseau, bases de données…) avec numéro, libellé serif et flèche vermillon, puis coordonnées et mentions. Sans cartes.",
  tags: ["cloud", "index", "sommaire", "services", "serif", "papier", "vermillon", "angles droits"],
  identity: indexId, racine: racineDe("#17140f"),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#17140f", PAPIER = "#f6f2ea", VERM = "#c8321a";
    const tete = G.bande(k, [nomDuSite(k, env, 30, ENCRE, { fontFamily: S.head, fontWeight: "400", fontSize: "30px" }), bouton(k, "Ouvrir un compte", "/connexion", { texte: PAPIER, fond: ENCRE, survol: { backgroundColor: VERM, borderColor: VERM, color: "#ffffff", transform: { y: -3 } }, focus: VERM, taille: 15, casse: "uppercase", suivi: "0.08em" })], { fond: PAPIER, aligne: "center", padV: ["40px", "32px", "24px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Tête" });
    const SERV = [["Calcul", "/faq"], ["Stockage", "/faq"], ["Réseau", "/faq"], ["Bases de données", "/faq"], ["Conteneurs", "/faq"], ["Supervision", "/faq"]];
    const DESC = ["Serveurs à la demande", "Objets, blocs et sauvegardes", "Réseaux privés et pare-feu", "Bases gérées", "Applications empaquetées", "Journaux et alertes"];
    const ligneI = ([t, u], i) => {
      const l = lien(k, t, u, { taille: 60, poids: "400", police: S.head, couleur: ENCRE, survol: { color: VERM }, focus: VERM, h: "88px", lh: 1, extra: { fontSize: "fluid:34-72", flexGrow: 1 } });
      const r = k.row([caps(k, `0${i + 1}`, { couleur: VERM, suivi: "0.16em" }), l, k.T(`<p>${DESC[i]}</p>`, { fontSize: "15px", color: S.mute, fontFamily: S.font, maxWidth: "260px", lineHeight: 1.4 }, undefined, { display: "none" }), k.T("<p>→</p>", { fontSize: "30px", color: VERM, fontFamily: S.font, lineHeight: 1 })], { flexWrap: "nowrap", alignItems: "center", gap: "24px", width: "100%", paddingLeft: "0px", paddingRight: "8px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#17140f66", borderRadius: "0px", backgroundColor: PAPIER, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ece4d3", paddingLeft: "24px" } };
      return r;
    };
    const liste = k.col(SERV.map(ligneI), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: ENCRE });
    const corps = G.bande(k, [liste, texte(k, "Services d'exemple : renommez-les selon votre offre.", { taille: 14, couleur: S.mute })], { fond: PAPIER, colonne: true, gap: "10px", padV: ["16px", "12px", "8px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Index" });
    const bas = G.bande(k, [G.colonne(k, [caps(k, "Nous joindre", { couleur: "#e8c9c2", suivi: "0.2em" }), coordonnees(k, { taille: 16, couleur: "#f6f2ea", lien: "#ffffff", survol: "#ffb4a3", focus: "#ffffff" })], { poids: 1, min: "260px", gap: "10px" }), G.colonne(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d2c3", liens: "#ffffff" })(k, env)], { poids: 2, min: "300px", soi: "flex-end", extra: { width: "100%" } })], { fond: ENCRE, gap: "28px 48px", aligne: "flex-end", padV: ["48px", "40px", "32px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Contact" });
    bas.styles.desktop.color = "#f6f2ea";
    return [G.racine(k, [tete, corps, bas])];
  },
}, FAM);

// ═══ ft2-280 « Console de déploiement » — [K : fenêtre / console, le pied ressemble à un bloc d'interface] ═════════════════════════════════
// Idée : une FENÊTRE DE TERMINAL. Barre de titre à trois carrés (vert, ambre, rouge), invites « $ » : commandes (liens), contact, lettre ; un curseur carré vert qui clignote doucement termine la dernière ligne. Polices : JetBrains Mono seule.
const consoleId = identite({
  key: "c280", label: "Terminal vert sur noir", humeur: "dark",
  fond: "#070b09", texte: "#d7f5e0", discret: "#8fb39b", accent: "#4ade80", surface: "#0f1a14", encre: "#070b09", surEncre: "#d7f5e0",
  police: "font.jetbrains-mono", titres: "font.jetbrains-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#4ade8044",
});
const consoleDeploiement = modeleV2({
  id: identifiantV2(280, "console-de-deploiement"), concept: "c-280-console-de-deploiement", name: "Console de déploiement", family: FAM,
  description: "Pour un cloud orienté développeurs : le pied est une fenêtre de terminal à angles droits, avec invites « $ » pour les commandes (liens), le contact et la lettre d'information, et un curseur vert qui respire.",
  tags: ["cloud", "terminal", "console", "développeurs", "monospace", "vert", "angles droits"],
  identity: consoleId, racine: racineDe("#070b09"),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, V = "#4ade80", FOND = "#070b09", BARRE = "#0f1a14", CLAIR = "#d7f5e0", MUET = "#8fb39b";
    const invite = (cmd) => k.row([k.T("<p>$</p>", { fontSize: "15px", color: V, fontFamily: S.font, fontWeight: "700" }), k.T(`<p>${cmd}</p>`, { fontSize: "15px", color: MUET, fontFamily: S.font })], { gap: "10px", flexWrap: "nowrap", alignItems: "center" });
    const barre = k.row([carre(k, "#4ade80", "12px"), carre(k, "#fbbf24", "12px"), carre(k, "#f87171", "12px"), k.T("<p>cumulo — console</p>", { fontSize: "13px", color: MUET, fontFamily: S.font, marginLeft: "12px" })], { gap: "8px", alignItems: "center", flexWrap: "nowrap", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: BARRE, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#4ade8055", borderRadius: "0px" });
    const CMD = [["docs", "/faq"], ["actualites", "/blog"], ["support", "/contact"], ["connexion", "/connexion"]];
    const pad = { paddingTop: "32px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "8px", backgroundColor: FOND };
    const commandes = G.colonne(k, [invite("cumulo --aide"), ...CMD.map(([t, u]) => lien(k, `› ${t}`, u, { taille: 17, couleur: CLAIR, survol: { color: V, transform: { x: 8 } }, focus: V, h: "44px" }))], { poids: 1, min: "240px", gap: "6px", extra: pad });
    const contact = G.colonne(k, [invite("cumulo contact"), coordonnees(k, { taille: 15, couleur: CLAIR, lien: V, survol: "#ffffff", focus: V })], { poids: 1.4, min: "280px", gap: "10px", extra: pad });
    const abo = lettre(k, env, G, { titre: "", intro: "Recevoir les nouveautés par e-mail.", bouton: "Valider", largeur: "420px", accent: V, surBouton: FOND, texte: CLAIR, fond: FOND, survolBouton: "#ffffff", survolTexte: FOND, focus: V, soulignement: "2px" });
    const lettreCol = G.colonne(k, [invite("cumulo abonner"), abo], { poids: 1.4, min: "300px", gap: "10px", extra: { ...pad, paddingRight: "32px" } });
    const fin = k.row([k.T("<p>$</p>", { fontSize: "15px", color: V, fontFamily: S.font, fontWeight: "700" }), souffle(carre(k, V, "12px"), 2400)], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: MUET, liens: CLAIR })(k, env);
    const haut = G.ligne(k, [commandes, contact, lettreCol], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const pied = k.row([mentions, fin], { justifyContent: "space-between", alignItems: "center", gap: "16px", width: "100%", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "32px", paddingRight: "32px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: "#4ade8044", backgroundColor: FOND, borderRadius: "0px" });
    const fenetre = k.col([barre, haut, pied], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "2px", borderColor: "#4ade8066", borderRadius: "0px", backgroundColor: FOND });
    const bande = G.bande(k, [fenetre], { fond: FOND, colonne: true, max: "1120px", padV: ["72px", "56px", "36px"], padB: ["56px", "44px", "28px"], padH: PH, nom: "Console" });
    bande.styles.desktop.color = CLAIR;
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-281 « Damier d'infrastructure » — [C : damier de cases égales, chacune un lien ou une information] ═════════════════════════════════
// Idée : un PLAN DE BAIE : huit cases à filets noirs, jaune signal, noir et blanc. Six services (liens, avec grand numéro), une case « Support » (coordonnées) et une case « Horaires ». La case survolée se soulève. Polices : Space Grotesk et Work Sans.
const damierId = identite({
  key: "c281", label: "Blanc, noir et jaune signal", humeur: "light",
  fond: "#ffffff", texte: "#0a0a0a", discret: "#44444a", accent: "#0a0a0a", surface: "#f2f2f2", encre: "#0a0a0a", surEncre: "#ffffff",
  police: "font.work-sans", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "3px", ligne: "#0a0a0a55",
});
const damierInfra = modeleV2({
  id: identifiantV2(281, "damier-d-infrastructure"), concept: "c-281-damier-d-infrastructure", name: "Damier d'infrastructure", family: FAM,
  description: "Pour un fournisseur d'infrastructure : un damier de huit cases à filets noirs (six services avec grand numéro, coordonnées du support, horaires) en jaune signal, noir et blanc ; la case survolée se soulève.",
  tags: ["cloud", "infrastructure", "damier", "cases", "jaune", "noir", "services", "angles droits"],
  identity: damierId, racine: racineDe("#0a0a0a"),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, N = "#0a0a0a", J = "#ffd400", B = "#ffffff";
    const base = { flexGrow: 1, flexBasis: "30%", minWidth: "220px", minHeight: "200px", borderStyle: "solid", borderWidth: "3px", borderColor: N, borderRadius: "0px", transitionDuration: DOUX };
    const SERV = [["Calcul", B, N], ["Stockage", N, B], ["Réseau", J, N], ["Bases de données", J, N], ["Conteneurs", B, N]];
    const caseS = ([t, fond, encre]) => {
      const l = lien(k, t, "/faq", { taille: 24, poids: "700", police: S.head, couleur: encre, survol: { transform: { x: 6 } }, focus: encre, h: "48px", extra: { width: "100%" } });
      const c = k.col([l, k.row([k.T("<p>Voir</p>", { fontSize: "14px", color: encre, fontFamily: S.font }), k.T("<p>↗</p>", { fontSize: "28px", color: encre, fontFamily: S.font, lineHeight: 1 })], { justifyContent: "space-between", alignItems: "flex-end", width: "100%" })], { ...base, backgroundColor: fond, justifyContent: "space-between", gap: "36px", paddingTop: "20px", paddingBottom: "16px", paddingLeft: "22px", paddingRight: "20px" });
      c.states = { hover: { transform: { y: -6 } } };
      return c;
    };
    const info = (titre, contenu, fond, encre, point, large) => k.col([k.row([...(point ? [souffle(carre(k, N, "10px"), 3000)] : []), caps(k, titre, { couleur: encre, suivi: "0.18em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), contenu], { ...base, flexBasis: large ? "45%" : "30%", minWidth: large ? "280px" : "220px", backgroundColor: fond, gap: "14px", paddingTop: "20px", paddingBottom: "16px", paddingLeft: "22px", paddingRight: "16px" });
    const marque = info("Cumulo", k.col([nomDuSite(k, env, 30, N, { fontFamily: S.head }), texte(k, "Infrastructure cloud.", { taille: 15, couleur: N })], { gap: "6px" }), B, N);
    const cases = [marque, ...SERV.map(caseS), info("Support", coordonnees(k, { taille: 15, couleur: B, lien: B, survol: J, focus: J }), N, B, false, true), info("Horaires du support", horaires(k, { taille: 15 }), "#f2f2f2", N, true, true)];
    const damier = G.ligne(k, cases, { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandeD = G.bande(k, [damier], { fond: N, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Damier" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#e6e6e6", liens: J })(k, env);
    const bas = G.bande(k, [mentions], { fond: N, padV: ["22px", "20px", "16px"], padB: ["22px", "20px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = B;
    return [G.racine(k, [bandeD, bas])];
  },
}, FAM);

// ═══ ft2-282 « Tableau de statut » — [A : colonne latérale pleine hauteur + zone principale] ═════════════════════════════════════════════════
// Idée (capture 2 et 3 : colonnes titrées, versions claire et sombre) : barre latérale marine à gauche (nom, statut qui respire, contact, réseaux) ; à droite, sur gris clair, trois colonnes de liens titrées (Produits, Ressources, Entreprise) puis la lettre. Polices : Saira Extra Condensed et Public Sans.
const statutId = identite({
  key: "c282", label: "Marine, orange et gris clair", humeur: "light",
  fond: "#f4f6f8", texte: "#0d2a4a", discret: "#46586b", accent: "#b93a0c", surface: "#ffffff", encre: "#0d2a4a", surEncre: "#f4f6f8",
  police: "font.public-sans", titres: "font.saira-extra-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#0d2a4a44",
});
const tableauStatut = modeleV2({
  id: identifiantV2(282, "tableau-de-statut"), concept: "c-282-tableau-de-statut", name: "Tableau de statut", family: FAM,
  description: "Pour un cloud : barre latérale marine pleine hauteur (nom, statut des services qui respire, contact, réseaux) et, à droite sur gris clair, trois colonnes de liens titrées puis la lettre d'information.",
  tags: ["cloud", "barre latérale", "statut", "colonnes", "marine", "orange", "angles droits"],
  identity: statutId, racine: racineDe("#f4f6f8"),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, MAR = "#0d2a4a", GRIS = "#f4f6f8", OR = "#b93a0c", ORL = "#ff9a6b";
    const nom = nomDuSite(k, env, 36, "#ffffff", { textTransform: "uppercase", letterSpacing: "0.04em" });
    const statut = k.row([souffle(carre(k, ORL, "12px"), 2800), lien(k, "Statut des services", "/faq", { taille: 16, poids: "700", couleur: "#ffffff", survol: { color: ORL, transform: { x: 4 } }, focus: "#ffffff" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const lateral = G.colonne(k, [nom, texte(k, "Infrastructure cloud pour vos applications.", { taille: 16, couleur: "#c9d6e4", max: "280px" }), statut, trait(k, "#ffffff44"), caps(k, "Contact", { couleur: ORL }), coordonnees(k, { taille: 15, couleur: "#e4ebf2", lien: "#ffffff", survol: ORL, focus: "#ffffff" }), trait(k, "#ffffff44"), reseaux(k, env, G, { couleur: "#ffffff", survol: ORL, focus: "#ffffff", taille: 15 })], { poids: 3, min: "300px", gap: "18px", extra: { backgroundColor: MAR, paddingTop: "56px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "36px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "36px" }, tablette: { paddingLeft: "32px" } });
    const col = (titre, liens) => G.colonne(k, [caps(k, titre, { couleur: OR, police: S.head, taille: "20px", suivi: "0.08em" }), trait(k, MAR, "2px"), ...liens.map(([t, u]) => lien(k, t, u, { taille: 16, couleur: MAR, survol: { color: OR, transform: { x: 4 } }, focus: OR }))], { poids: 1, min: "160px", gap: "4px", extra: { width: "100%" } });
    const colonnes = G.ligne(k, [col("Produits", [["Calcul", "/faq"], ["Stockage", "/faq"], ["Réseau", "/faq"]]), col("Ressources", [["Documentation", "/faq"], ["Actualités", "/blog"], ["Contact", "/contact"]]), col("Entreprise", [["Accueil", "/"], ["Espace client", "/connexion"]])], { gap: "32px 40px", aligne: "flex-start", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouveautés du cloud, sans bruit.", bouton: "S'abonner", largeur: "420px", accent: OR, surBouton: "#ffffff", texte: MAR, couleurTitre: OR, fond: GRIS, survolBouton: MAR, survolTexte: "#ffffff", focus: MAR });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const principale = G.colonne(k, [colonnes, abo, trait(k, S.line), mentions], { poids: 8, min: "420px", gap: "36px", extra: { backgroundColor: GRIS, paddingTop: "56px", paddingBottom: "28px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    principale.children = principale.children.map((c) => { c.styles.desktop = { ...c.styles.desktop, width: "100%" }; return c; });
    const deux = G.bande(k, [lateral, principale], { fond: GRIS, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Tableau" });
    return [G.racine(k, [deux])];
  },
}, FAM);

// ═══ ft2-283 « Chaîne de mise en ligne » — [I : frise horizontale en étapes, points carrés] ═══════════════════════════════════════════════
// Idée : une FRISE de quatre étapes (Connecter, Configurer, Déployer, Superviser) : un point carré et un filet qui court jusqu'à l'étape suivante, titre serif, une ligne d'explication. Le dernier point (vert menthe) respire. Dessous : coordonnées et mentions. Polices : Fraunces et Manrope.
const chaineId = identite({
  key: "c283", label: "Rose pâle, prune et menthe", humeur: "light",
  fond: "#fbf3f6", texte: "#2a1020", discret: "#6b4a5c", accent: "#7a1f5c", surface: "#ffffff", encre: "#2a1020", surEncre: "#fbf3f6",
  police: "font.manrope", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#2a102055",
});
const chaineMiseEnLigne = modeleV2({
  id: identifiantV2(283, "chaine-de-mise-en-ligne"), concept: "c-283-chaine-de-mise-en-ligne", name: "Chaîne de mise en ligne", family: FAM,
  description: "Pour un cloud : une frise horizontale de quatre étapes (connecter, configurer, déployer, superviser) à points carrés et filets, titres serif, puis coordonnées et mentions. Rose pâle, prune et menthe.",
  tags: ["cloud", "frise", "étapes", "déploiement", "prune", "menthe", "serif", "angles droits"],
  identity: chaineId, racine: racineDe("#2a1020"),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, PRUNE = "#7a1f5c", ENCRE = "#2a1020", ROSE = "#fbf3f6", MENTHE = "#2fbf9a";
    const phrase = G.geant("<p>De la connexion<br>à la supervision.</p>", { taille: [36, 76], lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: ENCRE })(k, env);
        const btn = bouton(k, "Ouvrir un compte", "/connexion", { texte: "#ffffff", fond: PRUNE, survol: { backgroundColor: ENCRE, borderColor: ENCRE, color: "#ffffff", transform: { y: -3 } }, focus: ENCRE, taille: 15, casse: "uppercase", suivi: "0.08em", extra: { alignSelf: "flex-start" } });
    const tete = G.bande(k, [caps(k, "Votre mise en ligne", { couleur: PRUNE, suivi: "0.2em" }), phrase, btn], { fond: ROSE, colonne: true, aligne: "flex-start", gap: "22px", padV: ["72px", "56px", "40px"], padB: ["44px", "36px", "28px"], padH: PH, nom: "Introduction" });
    const ETAPES = [["Connecter", "Reliez vos environnements.", "/contact"], ["Configurer", "Réglez vos ressources.", "/faq"], ["Déployer", "Mettez vos applications en ligne.", "/faq"], ["Superviser", "Gardez un œil sur l'ensemble.", "/faq"]];
    const etape = ([t, d, u], i) => {
      const dernier = i === ETAPES.length - 1;
      const point = dernier ? souffle(carre(k, MENTHE, "18px"), 2800) : carre(k, PRUNE, "18px");
      const fil = k.row([point, k.col([], { height: "2px", flexGrow: 1, backgroundColor: dernier ? "#00000000" : PRUNE, borderRadius: "0px" })], { gap: "0px", alignItems: "center", flexWrap: "nowrap", width: "100%" });
      const c = k.col([fil, caps(k, `Étape 0${i + 1}`, { couleur: PRUNE, suivi: "0.18em" }), lien(k, t, u, { taille: 30, poids: "600", police: S.head, couleur: ENCRE, survol: { color: PRUNE, transform: { x: 6 } }, focus: PRUNE, h: "48px" }), texte(k, d, { taille: 15, couleur: S.mute, max: "240px" })], { flexGrow: 1, flexBasis: "200px", minWidth: "180px", gap: "10px", paddingRight: "16px", borderRadius: "0px", transitionDuration: DOUX });
      c.states = { hover: { transform: { y: -4 } } };
      return c;
    };
    const frise = G.bande(k, [G.ligne(k, ETAPES.map(etape), { gap: "32px 12px", aligne: "flex-start", largeur: "100%" })], { fond: ROSE, colonne: true, padV: ["24px", "20px", "16px"], padB: ["64px", "52px", "40px"], padH: PH, nom: "Frise" });
    const liensBas = G.ligne(k, PLAT.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "700", couleur: "#ffffff", survol: { color: "#8fe8cf", transform: { y: -2 } }, focus: "#8fe8cf", padH: "0px", extra: { marginRight: "24px" } })), { gap: "0px", aligne: "center", largeur: "100%" });
    const bas = G.bande(k, [liensBas, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#eed6e4", liens: "#ffffff" })(k, env)], { fond: ENCRE, colonne: true, gap: "10px", padV: ["32px", "28px", "24px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#fbf3f6";
    return [G.racine(k, [tete, frise, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cloud et infrastructure", target: 6, built: true,
  description: "Pieds de fournisseurs cloud, angles droits : nom monumental sur dégradé, index de services, console de terminal, damier de baie, tableau de statut à barre latérale, frise de mise en ligne.",
  models: [nuageMonumental, indexServices, consoleDeploiement, damierInfra, tableauStatut, chaineMiseEnLigne],
};
