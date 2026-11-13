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

// ── Aides de la REFONTE « captures » : illustrations vectorielles (aides-illus-a01.js), pastilles, colonnes titrées ───────────────────────────────
const IL = require("../aides-illus-a01");
const pastille = (k, t, u, o) => lien(k, t, u, { taille: 14, poids: "700", couleur: o.texte, h: "44px", padH: "18px", survol: o.survol || { backgroundColor: o.texte, color: o.fond, transform: { y: -2 } }, focus: o.focus || o.texte, extra: { backgroundColor: o.fondP, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.texte, justifyContent: "center" } });
const pastilles = (k, items, o) => k.row(items.map(([t, u]) => pastille(k, t, u, o)), { gap: "12px", flexWrap: "wrap", alignItems: "center" });
const titreCol = (k, t, c, o = {}) => k.T(`<p>${t}</p>`, { fontSize: "26px", lineHeight: 1.2, fontWeight: "700", color: c, fontFamily: k.S.head, ...o });
const colQ = (k, G, enfants, o = {}) => G.colonne(k, enfants, { poids: 1, min: "220px", gap: "16px", ...o });
const monoLiens = (k, items, o) => items.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, survol: { color: o.survol, transform: { x: 6 } }, focus: o.survol, police: o.police, h: o.h || "44px", lh: o.lh, extra: o.extra }));

// ═══ ft2-278 « Nuage monumental » — [capture 04 : carte sombre, navigation à gauche, contact et pastilles à droite, NOM géant fondu dans un halo] ═══════
// Fond ardoise qui s'éclaire en vert-de-gris ; un grand nuage flou derrière le nom « Cumulo » (SVG) dont le remplissage naît du fond et devient turquoise lumineux.
const nuageId = identite({
  key: "c278", label: "Ardoise et vert-de-gris", humeur: "dark",
  fond: "#0b1a1e", texte: "#f0fafb", discret: "#a9c9cd", accent: "#7fe0e6", surface: "#12333a", encre: "#0b1a1e", surEncre: "#f0fafb",
  police: "font.dm-sans", titres: "font.sora", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f0fafb44",
});
const nuageMonumental = modeleV2({
  id: identifiantV2(278, "nuage-monumental"), concept: "c-278-nuage-monumental", name: "Nuage monumental", family: FAM,
  description: "Pour un fournisseur cloud : navigation en grands liens à gauche, pastilles de réseaux et coordonnées à droite, puis le nom « Cumulo » géant fondu dans un halo turquoise sur dégradé ardoise, avec un nuage dessiné derrière.",
  tags: ["cloud", "hébergeur", "nom géant", "halo", "dégradé", "nuage", "ardoise", "angles droits"],
  identity: nuageId, racine: racineDe("#14565e"),
  widgets: ["html", "sitetitle", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BL = "#f0fafb", CY = "#7fe0e6";
    const nav = monoLiens(k, [["Services", "/faq"], ["Documentation", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]], { taille: 24, poids: "600", couleur: BL, survol: CY, police: S.head, h: "52px" });
    const statut = k.row([souffle(carre(k, CY, "10px"), 3000), lien(k, "Statut des services", "/faq", { taille: 15, couleur: "#a9c9cd", survol: { color: CY, transform: { x: 4 } }, focus: CY })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const entete = G.ligne(k, [nomDuSite(k, env, 30, BL, { fontFamily: S.head }), pastilles(k, [["LinkedIn", "https://www.linkedin.com/"], ["GitHub", "https://github.com/"], ["X", "https://x.com/"]], { texte: BL, fond: "#0b1a1e", fondP: "#0b1a1e99", bord: "#7fe0e688", focus: CY })], { gap: "16px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const scene = (W, H) => IL.halo(W * 0.78, H * 0.3, W * 0.16, H * 0.3, "#cdeff2", 7, 0.07) + IL.halo(W * 0.88, H * 0.38, W * 0.1, H * 0.22, "#cdeff2", 6, 0.06) + IL.halo(W * 0.68, H * 0.4, W * 0.1, H * 0.2, "#cdeff2", 6, 0.06);
    const nom = IL.motBande(k, { u: "n278", nom: "Cumulo", police: S.head, poids: 800, haut: "#0b1a1e", bas: "#cdeff2", halo: "#7fe0e6", scene, mt: "8px" });
    const liensH = G.ligne(k, [...nav, statut], { gap: "4px 36px", aligne: "center", largeur: "100%" });
    const bas0 = G.ligne(k, [liensH, coordonnees(k, { taille: 16, couleur: "#d6eef0", lien: BL, survol: CY, focus: CY })], { gap: "20px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const b1 = G.bande(k, [entete], { fond: "#0b1a1e", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Entête" });
    const b2 = G.bande(k, nom, { degrade: { from: "#0b1a1e", to: "#14565e", angle: 180 }, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Nom géant" });
    const b3 = G.bande(k, [bas0], { fond: "#14565e", padV: ["24px", "20px", "16px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Navigation" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6eef0", liens: BL })(k, env)], { fond: "#14565e", aligne: "center", padV: ["18px", "16px", "14px"], padB: ["18px", "16px", "14px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = BL;
    return [G.racine(k, [b1, b2, b3, bas])];
  },
}, FAM);

// ═══ ft2-279 « Index des services » — [capture 04, version papier : six services en grandes lignes serif + pile de plaques dessinée + nom géant vermillon] ═
const indexId = identite({
  key: "c279", label: "Papier chaud et vermillon", humeur: "light",
  fond: "#f6f2ea", texte: "#17140f", discret: "#5a5246", accent: "#c8321a", surface: "#ffffff", encre: "#17140f", surEncre: "#f6f2ea",
  police: "font.inter-tight", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#17140f55",
});
const indexServices = modeleV2({
  id: identifiantV2(279, "index-des-services"), concept: "c-279-index-des-services", name: "Index des services", family: FAM,
  description: "Pour un hébergeur : six services en grandes lignes serif à flèche vermillon, une pile isométrique de plaques dessinée à droite, puis le nom « Arcade » géant dans un halo vermillon sur papier chaud.",
  tags: ["cloud", "index", "serif", "plaques", "halo", "papier", "vermillon", "angles droits"],
  identity: indexId, racine: racineDe("#f6f2ea"),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#17140f", PAPIER = "#f6f2ea", VERM = "#c8321a";
    const SERV = [["Calcul", "/faq"], ["Stockage", "/faq"], ["Réseau", "/faq"], ["Bases de données", "/faq"], ["Conteneurs", "/faq"], ["Supervision", "/faq"]];
    const ligneI = ([t, u]) => {
      const i = SERV.findIndex((x) => x[0] === t);
      const l = lien(k, t, u, { taille: 44, poids: "400", police: S.head, couleur: ENCRE, survol: { color: VERM }, focus: VERM, h: "68px", lh: 1, extra: { fontSize: "fluid:30-48", flexGrow: 1 } });
      const r = k.row([caps(k, `0${i + 1}`, { couleur: VERM, suivi: "0.16em" }), l, k.T("<p>→</p>", { fontSize: "26px", color: VERM, fontFamily: S.font, lineHeight: 1 })], { flexWrap: "nowrap", alignItems: "center", gap: "20px", width: "100%", paddingRight: "8px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#17140f66", borderRadius: "0px", backgroundColor: PAPIER, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ece4d3", paddingLeft: "20px" } };
      return r;
    };
    const demi = (a) => G.colonne(k, a.map(ligneI), { poids: 1, min: "260px", gap: "0px", extra: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: ENCRE, width: "100%" } });
    const liste = G.colonne(k, [nomDuSite(k, env, 30, ENCRE, { fontFamily: S.head, fontWeight: "400" }), G.ligne(k, [demi(SERV.slice(0, 3)), demi(SERV.slice(3))], { gap: "0px 40px", aligne: "flex-start", largeur: "100%" }), texte(k, "Services d'exemple : renommez-les selon votre offre.", { taille: 14 })], { poids: 6, min: "320px", gap: "18px", extra: { width: "100%" } });
    const dessin = G.colonne(k, [IL.noeud(k, IL.plaques(560, 300), { maxWidth: "560px" })], { poids: 4, min: "260px", aligne: "center", soi: "center", mobile: { display: "none" } });
    const corps = G.bande(k, [liste, dessin], { fond: PAPIER, gap: "24px 56px", aligne: "center", padV: ["48px", "40px", "32px"], padB: ["20px", "16px", "12px"], padH: PH, nom: "Index" });
    const nom = IL.motBande(k, { u: "a279", nom: "Arcade", police: S.head, poids: 400, haut: "#f6f2ea", bas: "#c8321a", halo: "#f2a28f", opHaut: 0.6 });
    const mot = G.bande(k, nom, { fond: PAPIER, colonne: true, max: "1500px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Nom géant" });
    const bas = G.bande(k, [G.colonne(k, [caps(k, "Nous joindre", { couleur: "#e8c9c2", suivi: "0.2em" }), coordonnees(k, { taille: 16, couleur: "#f6f2ea", lien: "#ffffff", survol: "#ffb4a3", focus: "#ffffff" })], { poids: 1, min: "260px", gap: "10px" }), G.colonne(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d2c3", liens: "#ffffff" })(k, env)], { poids: 2, min: "300px", soi: "flex-end", extra: { width: "100%" } })], { fond: ENCRE, gap: "28px 48px", aligne: "flex-end", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Contact" });
    bas.styles.desktop.color = "#f6f2ea";
    return [G.racine(k, [corps, mot, bas])];
  },
}, FAM);

// ═══ ft2-280 « Console de déploiement » — [capture 06 : sombre, pastilles d'icônes en haut à gauche, quatre colonnes titrées, rangée de 4 vignettes, copyright centré] ═
const consoleId = identite({
  key: "c280", label: "Terminal vert sur noir", humeur: "dark",
  fond: "#070b09", texte: "#d7f5e0", discret: "#8fb39b", accent: "#4ade80", surface: "#0f1a14", encre: "#070b09", surEncre: "#d7f5e0",
  police: "font.jetbrains-mono", titres: "font.jetbrains-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#4ade8044",
});
const consoleDeploiement = modeleV2({
  id: identifiantV2(280, "console-de-deploiement"), concept: "c-280-console-de-deploiement", name: "Console de déploiement", family: FAM,
  description: "Pour un cloud orienté développeurs : fenêtre de terminal sombre, pastilles de commandes en haut à gauche, quatre colonnes (à propos, lettre, rangée de quatre vignettes filaires, réseaux) et curseur vert qui respire.",
  tags: ["cloud", "terminal", "console", "vignettes", "filaires", "monospace", "vert", "angles droits"],
  identity: consoleId, racine: racineDe("#070b09"),
  widgets: ["html", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, V = "#4ade80", FOND = "#070b09", BARRE = "#0f1a14", CL = "#d7f5e0", MU = "#8fb39b";
    const barre = k.row([carre(k, "#4ade80", "12px"), carre(k, "#fbbf24", "12px"), carre(k, "#f87171", "12px"), k.T("<p>cumulo — console</p>", { fontSize: "13px", color: MU, fontFamily: S.font, marginLeft: "12px" })], { gap: "8px", alignItems: "center", flexWrap: "nowrap", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: BARRE, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#4ade8055", borderRadius: "0px" });
    const pil = pastilles(k, [["$ docs", "/faq"], ["$ statut", "/faq"], ["$ support", "/contact"]], { texte: V, fond: FOND, fondP: "#000000", bord: "#4ade8066", focus: "#ffffff", survol: { backgroundColor: V, color: FOND, transform: { y: -2 } } });
    const about = colQ(k, G, [titreCol(k, "À propos", CL), texte(k, "Cumulo : un cloud simple pour déployer, relier et superviser vos applications.", { taille: 15, couleur: MU, max: "340px" }), coordonnees(k, { taille: 14, couleur: CL, lien: V, survol: "#ffffff", focus: V }), pil], { poids: 2, min: "260px", gap: "18px" });
    const abo = lettre(k, env, G, { titre: "", intro: "Recevoir les nouveautés par e-mail.", bouton: "→", largeur: "380px", accent: V, surBouton: FOND, texte: CL, fond: FOND, survolBouton: "#ffffff", survolTexte: FOND, focus: V });
    const V4 = IL.VIGNETTES(k, "filaires", { bg: "#0f1a14", a: "#4ade80", b: "#8fb39b", c: "#d7f5e0", d: "#fbbf24" }, { t: "100%", bord: "#4ade8066" });
    const droite = colQ(k, G, [titreCol(k, "Schémas", CL), G.ligne(k, V4.map((v) => G.colonne(k, [v], { poids: 1, min: "100px" })), { gap: "12px", aligne: "flex-start", largeur: "100%" }), G.ligne(k, [colQ(k, G, [titreCol(k, "Lettre", CL, { fontSize: "20px" }), abo], { poids: 2, min: "260px", gap: "10px" }), colQ(k, G, [titreCol(k, "Suivre", CL, { fontSize: "20px" }), reseaux(k, env, G, { couleur: CL, survol: V, focus: V })], { poids: 1, min: "140px", gap: "10px" })], { gap: "20px 32px", aligne: "flex-start", largeur: "100%" })], { poids: 5, min: "300px", gap: "20px" });
    const haut = G.bande(k, [about, droite], { fond: FOND, gap: "40px 56px", aligne: "flex-start", padV: ["32px", "28px", "24px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Colonnes" });
    const fin = k.row([k.T("<p>$</p>", { fontSize: "15px", color: V, fontFamily: S.font, fontWeight: "700" }), souffle(carre(k, V, "12px"), 2400)], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: MU, liens: CL })(k, env, true), fin], { fond: FOND, aligne: "center", justifie: "center", gap: "12px 24px", padV: ["14px", "12px", "12px"], padB: ["14px", "12px", "12px"], padH: PH, filetHaut: { epaisseur: "2px", couleur: "#4ade8044" }, nom: "Mentions" });
    mentions.styles.desktop.color = CL;
    const barreB = G.bande(k, [barre], { fond: BARRE, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Barre de titre" });
    haut.styles.desktop.borderWidth = "0px";
    return [G.racine(k, [barreB, haut, mentions])];
  },
}, FAM);

// ═══ ft2-281 « Damier d'infrastructure » — [capture 05 : clair, pastilles en haut, quatre colonnes titrées, rangée de 4 vignettes de baies, copyright centré] ═
const damierId = identite({
  key: "c281", label: "Blanc, noir et jaune signal", humeur: "light",
  fond: "#ffffff", texte: "#0a0a0a", discret: "#44444a", accent: "#0a0a0a", surface: "#f2f2f2", encre: "#0a0a0a", surEncre: "#ffffff",
  police: "font.work-sans", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "3px", ligne: "#0a0a0a55",
});
const damierInfra = modeleV2({
  id: identifiantV2(281, "damier-d-infrastructure"), concept: "c-281-damier-d-infrastructure", name: "Damier d'infrastructure", family: FAM,
  description: "Pour un fournisseur d'infrastructure : pied clair à pastilles jaunes, quatre colonnes titrées (à propos, lettre, rangée de quatre baies de serveurs dessinées, réseaux) et grand filet noir.",
  tags: ["cloud", "infrastructure", "baies", "vignettes", "jaune", "noir", "colonnes", "angles droits"],
  identity: damierId, racine: racineDe("#ffffff"),
  widgets: ["html", "sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, N = "#0a0a0a", J = "#ffd400", B = "#ffffff";
    const pil = pastilles(k, [["Docs", "/faq"], ["Statut", "/faq"], ["Support", "/contact"]], { texte: N, fond: B, fondP: J, bord: N, survol: { backgroundColor: N, color: J, transform: { y: -3 } } });
    const about = colQ(k, G, [titreCol(k, "À propos", N), nomDuSite(k, env, 24, N, { fontFamily: S.head }), texte(k, "Infrastructure cloud : calcul, stockage, réseau.", { taille: 15, couleur: N, max: "320px" }), coordonnees(k, { taille: 15, couleur: N, lien: N, survol: "#6b5a00", focus: N })], { poids: 1.3 });
    const abo = lettre(k, env, G, { titre: "", intro: "Restez informé de nos nouveautés.", bouton: "→", largeur: "340px", accent: N, surBouton: J, texte: N, fond: B, survolBouton: J, survolTexte: N, focus: N });
    const lettreC = colQ(k, G, [titreCol(k, "Lettre d'information", N), abo], { poids: 1.3 });
    const feed = colQ(k, G, [titreCol(k, "Nos baies", N), k.row(IL.VIGNETTES(k, "baie", { bg: "#ffd400", a: "#0a0a0a", b: "#2a2a2a", c: "#ffffff", d: "#ffd400" }, { t: "72px", bord: N }), { gap: "10px", flexWrap: "wrap" })], { poids: 1.5, min: "260px" });
    const suivre = colQ(k, G, [titreCol(k, "Suivez-nous", N), horaires(k, { taille: 14, couleur: N }), reseaux(k, env, G, { couleur: N, survol: "#6b5a00", focus: N })], { poids: 1.2 });
    const haut = G.bande(k, [pil, G.ligne(k, [about, lettreC, feed, suivre], { gap: "40px 32px", aligne: "flex-start", largeur: "100%" })], { fond: B, colonne: true, gap: "56px", padV: ["40px", "32px", "28px"], padB: ["48px", "40px", "32px"], padH: PH, filetHaut: { epaisseur: "12px", couleur: J }, nom: "Colonnes" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#e6e6e6", liens: J })(k, env, true)], { fond: N, aligne: "center", justifie: "center", padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = B;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-282 « Tableau de statut » — [capture 05 : clair, quatre colonnes ; sous un grand bandeau marine illustré d'un centre de données] ════════════════
const statutId = identite({
  key: "c282", label: "Marine, orange et gris clair", humeur: "light",
  fond: "#f4f6f8", texte: "#0d2a4a", discret: "#46586b", accent: "#b93a0c", surface: "#ffffff", encre: "#0d2a4a", surEncre: "#f4f6f8",
  police: "font.public-sans", titres: "font.saira-extra-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#0d2a4a44",
});
const tableauStatut = modeleV2({
  id: identifiantV2(282, "tableau-de-statut"), concept: "c-282-tableau-de-statut", name: "Tableau de statut", family: FAM,
  description: "Pour un cloud : grand bandeau marine illustré d'un centre de données et d'un nuage fil de fer (nom, statut qui respire), puis, sur gris clair, quatre colonnes titrées avec grille de quatre vignettes de villes.",
  tags: ["cloud", "centre de données", "bandeau illustré", "colonnes", "vignettes", "marine", "orange", "angles droits"],
  identity: statutId, racine: racineDe("#f4f6f8"),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, MAR = "#0d2a4a", GRIS = "#f4f6f8", OR = "#b93a0c", ORL = "#ff9a6b";
    const nom = nomDuSite(k, env, 40, "#ffffff", { textTransform: "uppercase", letterSpacing: "0.04em" });
    const statut = k.row([souffle(carre(k, ORL, "12px"), 2800), lien(k, "Statut des services", "/faq", { taille: 16, poids: "700", couleur: "#ffffff", survol: { color: ORL, transform: { x: 4 } }, focus: "#ffffff" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const gauche = G.colonne(k, [nom, texte(k, "Infrastructure cloud pour vos applications.", { taille: 17, couleur: "#c9d6e4", max: "300px" }), statut], { poids: 5, min: "280px", gap: "18px", aligne: "flex-start", soi: "center" });
    const droite = G.colonne(k, [IL.noeud(k, IL.centreDonnees(), { maxWidth: "620px" })], { poids: 6, min: "260px", aligne: "flex-end", soi: "flex-end" });
    const hero = G.bande(k, [gauche, droite], { fond: MAR, gap: "24px 40px", aligne: "center", max: "1500px", padV: ["56px", "40px", "32px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Bandeau illustré" });
    const pil = pastilles(k, [["Docs", "/faq"], ["Actualités", "/blog"], ["Contact", "/contact"]], { texte: MAR, fond: GRIS, fondP: "#dfe5ec", bord: "#dfe5ec", survol: { backgroundColor: OR, color: "#ffffff", transform: { y: -2 } }, focus: OR });
    const about = colQ(k, G, [titreCol(k, "À propos", OR, { fontSize: "30px" }), texte(k, "Calcul, stockage et réseau, avec un support qui répond.", { taille: 15, couleur: MAR, max: "320px" }), coordonnees(k, { taille: 15, couleur: MAR, lien: MAR, survol: OR, focus: OR })], { poids: 1.3 });
    const abo = lettre(k, env, G, { titre: "", intro: "Les nouveautés du cloud, sans bruit.", bouton: "→", largeur: "340px", accent: OR, surBouton: "#ffffff", texte: MAR, fond: GRIS, survolBouton: MAR, survolTexte: "#ffffff", focus: MAR });
    const lettreC = colQ(k, G, [titreCol(k, "Lettre", OR, { fontSize: "30px" }), abo], { poids: 1.3 });
    const g4 = IL.VIGNETTES(k, "ville", { bg: "#0d2a4a", a: "#1a4272", b: "#2d68ab", c: "#0d2a4a", d: "#ff9a6b" }, { t: "100px" });
    const feed = colQ(k, G, [titreCol(k, "Nos sites", OR, { fontSize: "30px" }), k.col([k.row(g4.slice(0, 2), { gap: "8px" }), k.row(g4.slice(2), { gap: "8px" })], { gap: "8px" })], { poids: 1.2, min: "230px" });
    const suivre = colQ(k, G, [titreCol(k, "Suivez-nous", OR, { fontSize: "30px" }), reseaux(k, env, G, { couleur: MAR, survol: OR, focus: OR })], { poids: 1 });
    const corps = G.bande(k, [pil, G.ligne(k, [about, lettreC, feed], { gap: "40px 32px", aligne: "flex-start", largeur: "100%" })], { fond: GRIS, colonne: true, gap: "40px", padV: ["40px", "32px", "28px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Colonnes" });
    const bas = G.bande(k, [trait(k, S.line), suivre, G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true)], { fond: GRIS, colonne: true, aligne: "center", gap: "16px", padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [hero, corps, bas])];
  },
}, FAM);

// ═══ ft2-283 « Chaîne de mise en ligne » — [capture 05 : clair ; quatre colonnes-étapes, chacune surmontée d'une vignette de paysage ; lettre et pastilles dessous] ═
const chaineId = identite({
  key: "c283", label: "Rose pâle, prune et menthe", humeur: "light",
  fond: "#fbf3f6", texte: "#2a1020", discret: "#6b4a5c", accent: "#7a1f5c", surface: "#ffffff", encre: "#2a1020", surEncre: "#fbf3f6",
  police: "font.manrope", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#2a102055",
});
const chaineMiseEnLigne = modeleV2({
  id: identifiantV2(283, "chaine-de-mise-en-ligne"), concept: "c-283-chaine-de-mise-en-ligne", name: "Chaîne de mise en ligne", family: FAM,
  description: "Pour un cloud : quatre colonnes-étapes (connecter, configurer, déployer, superviser) surmontées chacune d'une vignette de paysage à l'aube dessinée, puis lettre, pastilles et mentions. Rose pâle, prune et menthe.",
  tags: ["cloud", "étapes", "vignettes", "paysage", "aube", "prune", "menthe", "serif", "angles droits"],
  identity: chaineId, racine: racineDe("#fbf3f6"),
  widgets: ["html", "text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, PRUNE = "#7a1f5c", ENCRE = "#2a1020", ROSE = "#fbf3f6", MENTHE = "#2fbf9a";
    const phrase = G.geant("<p>De la connexion à la supervision.</p>", { taille: [34, 72], lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: ENCRE })(k, env);
    const tete = G.bande(k, [G.colonne(k, [caps(k, "Votre mise en ligne", { couleur: PRUNE, suivi: "0.2em" }), phrase], { poids: 3, min: "300px", gap: "14px" }), G.colonne(k, [pastilles(k, [["Ouvrir un compte", "/connexion"], ["Contact", "/contact"]], { texte: "#ffffff", fond: ROSE, fondP: PRUNE, bord: PRUNE, survol: { backgroundColor: ENCRE, color: "#ffffff", transform: { y: -3 } }, focus: ENCRE })], { poids: 1, min: "260px", aligne: "flex-end", soi: "flex-end", mobile: { alignItems: "flex-start" } })], { fond: ROSE, gap: "24px 40px", aligne: "flex-end", padV: ["64px", "48px", "36px"], padB: ["36px", "28px", "24px"], padH: PH, nom: "Introduction" });
    const ET = [["Connecter", "Reliez vos environnements.", "/contact"], ["Configurer", "Réglez vos ressources.", "/faq"], ["Déployer", "Mettez vos applications en ligne.", "/faq"], ["Superviser", "Gardez un œil sur l'ensemble.", "/faq"]];
    const V = IL.VIGNETTES(k, "dunes", { bg: "#f1d3e2", a: "#c46aa4", b: "#7a1f5c", c: "#2a1020", d: "#2fbf9a" }, { t: "100%" });
    const col = ([t, d, u], i) => {
      const c = G.colonne(k, [V[i], caps(k, `Étape 0${i + 1}`, { couleur: PRUNE, suivi: "0.18em" }), lien(k, t, u, { taille: 30, poids: "600", police: S.head, couleur: ENCRE, survol: { color: PRUNE, transform: { x: 6 } }, focus: PRUNE, h: "48px" }), texte(k, d, { taille: 15, max: "240px" })], { poids: 1, min: "200px", gap: "10px", extra: { transitionDuration: DOUX } });
      c.states = { hover: { transform: { y: -4 } } };
      return c;
    };
    const cols = G.bande(k, [G.ligne(k, ET.map(col), { gap: "32px 24px", aligne: "flex-start", largeur: "100%" })], { fond: ROSE, colonne: true, padV: ["12px", "12px", "8px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Étapes" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouveautés du cloud, sans bruit.", bouton: "S'abonner", largeur: "420px", accent: "#8fe8cf", surBouton: ENCRE, texte: "#fbf3f6", couleurTitre: "#8fe8cf", fond: ENCRE, survolBouton: "#ffffff", survolTexte: ENCRE, focus: "#ffffff" });
    const point = souffle(carre(k, MENTHE, "14px"), 2800);
    const liensBas = G.ligne(k, PLAT.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "700", couleur: "#ffffff", survol: { color: "#8fe8cf", transform: { y: -2 } }, focus: "#8fe8cf", padH: "0px", extra: { marginRight: "24px" } })), { gap: "0px", aligne: "center", largeur: "100%" });
    const bas = G.bande(k, [G.colonne(k, [abo, point], { poids: 1, min: "300px", gap: "14px" }), G.colonne(k, [liensBas, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#eed6e4", liens: "#ffffff" })(k, env)], { poids: 1.6, min: "300px", gap: "14px" })], { fond: ENCRE, gap: "28px 48px", aligne: "flex-start", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Lettre et mentions" });
    bas.styles.desktop.color = "#fbf3f6";
    return [G.racine(k, [tete, cols, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cloud et infrastructure", target: 6, built: true,
  description: "Pieds de fournisseurs cloud, angles droits, illustrés : nom monumental dans un halo, index à pile de plaques, console à vignettes filaires, baies dessinées, bandeau centre de données, vignettes d'aube.",
  models: [nuageMonumental, indexServices, consoleDeploiement, damierInfra, tableauStatut, chaineMiseEnLigne],
};
