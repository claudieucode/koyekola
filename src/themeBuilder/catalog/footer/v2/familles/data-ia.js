// Famille v2 « Données et intelligence artificielle » — 6 modèles (ft2-290 à ft2-295), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds de plateformes de données et d'IA (marques fictives). Aucune image, aucune coordonnée, aucun chiffre ni nom de produit réel inventé : les libellés (Produit, Documentation, Glossaire…) sont des intitulés
// D'EXEMPLE à renommer dans l'éditeur ; les adresses de réseaux sont des exemples. Chaque modèle a sa palette, ses polices (2 au plus) et son archétype de composition (K, D, F, E, G, I), en mode « solo ».
// Idées reprises des captures (07 : logo + colonnes + lettre, 08 : bandeau de lettre en tête, 09 : index de liens) : composition seulement, jamais de copie.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 14 px) ; UNE animation visible par modèle (carré d'état qui respire, ligne qui s'indente,
// bouton qui se soulève) ; pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

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
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg }; // message « non configuré » lisible sur le fond de SA bande
  return n;
};
const ABO_STYLE = (abo, o) => { // habille le widget e-mail : titre, texte, bouton et survol du bouton
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.titre };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.intro };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.boutonTexte };
  abo.parts.button.states = { hover: { backgroundColor: o.survolFond, color: o.survolTexte }, focus: GK.focus(o.focus) };
  return abo;
};
// Bouton plein ou à contour, angles droits, qui se soulève et change de couleur au survol
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });

const PH = ["48px", "32px", "20px"];
const ZERO = ["0px", "0px", "0px"];
const mentionsBande = (G, k, env, o) => { // dernière bande : texte légal lisible sur le fond de la bande
  const b = G.bande(k, [G.ligneLegale({ taille: 13, couleur: o.texte, liens: o.liens, sansCookies: true })(k, env)], { fond: o.fond, gap: "12px 40px", aligne: "center", padV: ["22px", "20px", "16px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Mentions" });
  b.styles.desktop.color = o.liens;
  return b;
};

const FAM = "data-ia";

// ═══ ft2-290 « Invite de commande » — plateforme de données — ARCHÉTYPE K : fenêtre / console ═══
// Idée : le pied EST une fenêtre de terminal : barre de titre à trois carrés (le dernier, citron, respire), commentaires `# produit`, `# ressources` en mono et liens-commandes qui se surlignent en citron et
// s'indentent au survol, lettre d'information dans la fenêtre, ligne d'état en bas. Noir encre, vert citron. Polices : Geist Mono (titres) et Geist (texte). Libellés d'exemple.
const invite = identite({
  key: "c290", label: "Noir encre et vert citron", humeur: "dark",
  fond: "#0b0f14", texte: "#d7e2ee", discret: "#93a6b8", accent: "#b6f23c", surface: "#121a23", encre: "#0b0f14", surEncre: "#d7e2ee",
  police: "font.geist", titres: "font.geist-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#d7e2ee33",
});
const ENCRE = "#0b0f14", FENETRE = "#121a23", CITRON = "#b6f23c", BRUME = "#d7e2ee", ACIER = "#93a6b8";
const inviteDeCommande = modeleV2({
  id: identifiantV2(290, "invite-de-commande"), concept: "c-290-invite-de-commande",
  name: "Invite de commande", family: FAM,
  description: "Pour une plateforme de données : le pied est une fenêtre de terminal noire à barre de titre, commentaires et liens-commandes qui se surlignent en vert citron, lettre d'information intégrée et ligne d'état. Noir encre, vert citron, polices mono.",
  tags: ["données", "plateforme", "développeurs", "console", "terminal", "mono", "vert citron"],
  identity: invite,
  racine: racineDe(ENCRE),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const cmd = (t, u) => lien(k, `> ${t}`, u, { taille: 15, poids: "500", couleur: BRUME, police: S.head, padH: "8px", survol: { backgroundColor: CITRON, color: ENCRE, transform: { x: 8 } }, focus: CITRON });
    const com = (t) => k.T(`<p># ${t}</p>`, { fontSize: "13px", fontFamily: S.head, color: CITRON, fontWeight: "700", lineHeight: 1.4 });
    const titre = k.row([k.row([carre(k, "#3a4856", "10px"), carre(k, "#3a4856", "10px"), souffle(carre(k, CITRON, "10px"), 2600)], { gap: "8px", flexWrap: "nowrap" }), k.T("<p>kerneo — pied-de-page</p>", { fontSize: "13px", fontFamily: S.head, color: ACIER, lineHeight: 1.4 })], { gap: "18px", alignItems: "center", flexWrap: "nowrap", width: "100%", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: "#1b2733" });
    const c1 = G.colonne(k, [com("produit"), cmd("plateforme", "/blog"), cmd("modèles", "/blog"), cmd("connecteurs", "/blog"), cmd("tarifs", "/contact")], { poids: 1, min: "180px", gap: "2px" });
    const c2 = G.colonne(k, [com("ressources"), cmd("documentation", "/faq"), cmd("guides", "/blog"), cmd("aide", "/faq"), cmd("connexion", "/connexion")], { poids: 1, min: "180px", gap: "2px" });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "$ kerneo abonner", intro: "Les nouveautés de la plateforme, rarement.", bouton: "Envoyer", largeur: "100%", accent: CITRON, texte: BRUME, policeChamp: S.head, tailleChamp: "15px" }), { titre: CITRON, intro: ACIER, boutonTexte: ENCRE, survolFond: BRUME, survolTexte: ENCRE, focus: BRUME });
    const c3 = G.colonne(k, [com("lettre"), abo], { poids: 1.3, min: "260px", gap: "8px" });
    const corps = k.row([c1, c2, c3], { rowGap: "28px", columnGap: "48px", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", width: "100%", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "24px", paddingRight: "24px" });
    const etat = k.row([souffle(carre(k, CITRON, "8px"), 3000), k.T("<p>prêt</p>", { fontSize: "13px", fontFamily: S.head, color: ACIER })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const bas = k.row([etat, G.ligneLegale({ taille: 13, couleur: ACIER, liens: BRUME, sansCookies: true })(k, env)], { rowGap: "12px", columnGap: "28px", alignItems: "center", justifyContent: "space-between", width: "100%", paddingTop: "16px", paddingBottom: "18px", paddingLeft: "24px", paddingRight: "24px" });
    const fen = k.col([titre, corps, trait(k, "#d7e2ee33"), bas], { width: "100%", backgroundColor: FENETRE, borderStyle: "solid", borderWidth: "1px", borderColor: "#d7e2ee55", gap: "0px" });
    return [G.racine(k, [G.bande(k, [fen], { fond: ENCRE, padV: ["64px", "48px", "28px"], padB: ["64px", "48px", "28px"], padH: PH, max: "1080px", nom: "Fenêtre de terminal" })])];
  },
}, FAM);

// ═══ ft2-291 « Barre d'inférence » — IA appliquée — ARCHÉTYPE D : ligne unique compacte ═══
// Idée : tout tient sur une barre de navigation inversée : un filet cobalt en tête, puis UNE rangée (marque à carré qui respire, six liens, bouton « Essayer ») et une seconde ligne de mentions. Blanc bleuté, encre, cobalt.
// Polices : DM Sans (titres et texte) et DM Mono (libellés). Pas de colonnes, pas de lettre : c'est un pied de poche.
const barre = identite({
  key: "c291", label: "Blanc bleuté, encre et cobalt", humeur: "light",
  fond: "#f4f6fd", texte: "#0e1330", discret: "#454c70", accent: "#2540ff", surface: "#ffffff", encre: "#0e1330", surEncre: "#f4f6fd",
  police: "font.dm-sans", titres: "font.dm-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#0e133333",
});
const BLEUTE = "#f4f6fd", NUIT = "#0e1330", COBALT = "#2540ff";
const barreInference = modeleV2({
  id: identifiantV2(291, "barre-d-inference"), concept: "c-291-barre-d-inference",
  name: "Barre d'inférence", family: FAM,
  description: "Pour un service d'IA appliquée : pied de poche sur une seule rangée (marque, six liens, bouton « Essayer ») sous un filet cobalt, puis une ligne de mentions. Aucun bloc superflu. Blanc bleuté, encre, cobalt.",
  tags: ["intelligence artificielle", "service", "compact", "barre unique", "une ligne", "cobalt", "sobre"],
  identity: barre,
  racine: racineDe(BLEUTE),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const marque = k.row([souffle(carre(k, COBALT, "16px"), 2800), k.T("<p>Vectra</p>", { fontSize: "26px", fontWeight: "800", fontFamily: S.font, color: NUIT, letterSpacing: "-0.02em", lineHeight: 1.1 })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const nav = (t, u) => lien(k, t, u, { taille: 15, poids: "500", couleur: NUIT, padH: "4px", survol: { color: COBALT, transform: { y: -2 } }, focus: COBALT });
    const liens = G.ligne(k, [nav("Produit", "/blog"), nav("Modèles", "/blog"), nav("Documentation", "/faq"), nav("Sécurité", "/faq"), nav("Contact", "/contact"), nav("Connexion", "/connexion")], { gap: "0px 22px", aligne: "center", justifie: "center" });
    const essayer = bouton(k, "Essayer", "/contact", { texte: "#ffffff", fond: COBALT, taille: 14, survol: { backgroundColor: NUIT, borderColor: NUIT, color: "#ffffff", transform: { y: -3 } }, focus: NUIT });
    const cellule = k.col([marque], { backgroundColor: "#ffffff", justifyContent: "center", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px", borderStyle: "solid", borderWidth: "1px", borderColor: "#0e133333", alignSelf: "stretch" });
    const milieu = k.col([liens, trait(k, "#0e133333"), G.ligneLegale({ taille: 13, couleur: S.mute, liens: NUIT, sansCookies: true })(k, env)], { gap: "10px", flexGrow: 1, flexBasis: "420px", minWidth: "260px" });
    const rangee = k.row([cellule, milieu, essayer], { rowGap: "18px", columnGap: "32px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    const unique = G.bande(k, [rangee], { fond: BLEUTE, padV: ["34px", "30px", "26px"], padB: ["34px", "30px", "26px"], padH: PH, aligne: "center", filetHaut: { epaisseur: "6px", couleur: COBALT }, nom: "Rangée unique" });
    unique.styles.desktop.color = NUIT;
    return [G.racine(k, [unique])];
  },
}, FAM);

// ═══ ft2-292 « Appel au corpus » — conseil en données — ARCHÉTYPE F : appel XXL + colonne étroite ═══
// Idée : un appel à l'action démesuré en Instrument Serif (« Parlons de vos données. ») avec son bouton pêche, et à droite UNE seule colonne étroite de sept liens séparés par des filets fins qui s'indentent au survol.
// Pas de lettre, pas de carte. Aubergine, pêche. Polices : Instrument Serif (appel) et Hanken Grotesk (texte). Libellés d'exemple.
const corpus = identite({
  key: "c292", label: "Aubergine et pêche", humeur: "dark",
  fond: "#20102c", texte: "#fbeee6", discret: "#cdb9c9", accent: "#ffb48a", surface: "#2c1840", encre: "#20102c", surEncre: "#fbeee6",
  police: "font.hanken-grotesk", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#fbeee640",
});
const AUBERGINE = "#20102c", AUBERGINE2 = "#170a21", PECHE = "#ffb48a", CREME = "#fbeee6", MAUVE = "#cdb9c9";
const appelCorpus = modeleV2({
  id: identifiantV2(292, "appel-au-corpus"), concept: "c-292-appel-au-corpus",
  name: "Appel au corpus", family: FAM,
  description: "Pour un cabinet de conseil en données : un appel à l'action démesuré en serif (« Parlons de vos données. ») avec bouton pêche, et une seule colonne étroite de sept liens à filets fins à droite. Aubergine et pêche, sans cartes.",
  tags: ["conseil en données", "cabinet", "appel à l'action", "grande typographie", "colonne étroite", "aubergine", "pêche"],
  identity: corpus,
  racine: racineDe(AUBERGINE2),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const etiq = caps(k, "Conseil en données · Mnémo", { couleur: PECHE, suivi: "0.24em" });
    const phrase = G.geant(`<p>Parlons de<br>vos <span style="color:${PECHE}">données</span>.</p>`, { taille: [60, 190], tablette: { taille: [100, 150] }, mobile: { taille: [60, 90] }, lh: 0.92, suivi: "-0.02em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const intro = k.T("<p>Un premier échange pour cadrer le besoin, sans engagement.</p>", { fontSize: "18px", lineHeight: 1.55, color: MAUVE, fontFamily: S.font, maxWidth: "440px" });
    const cta = bouton(k, "Écrire à l'équipe", "/contact", { texte: AUBERGINE, fond: PECHE, taille: 17, survol: { backgroundColor: CREME, borderColor: CREME, color: AUBERGINE, transform: { y: -4 } }, focus: CREME, extra: { minHeight: "62px", paddingLeft: "36px", paddingRight: "36px" } });
    const item = (t, u) => lien(k, t, u, { taille: 17, poids: "500", couleur: CREME, bloc: true, h: "52px", survol: { color: PECHE, transform: { x: 10 } }, focus: PECHE, extra: { width: "100%" } });
    const liste = [["Expertises", "/blog"], ["Méthode", "/blog"], ["Études de cas", "/blog"], ["Outils", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]];
    const droite = G.colonne(k, [...liste.flatMap(([t, u]) => [trait(k, "#fbeee633"), item(t, u)]), trait(k, "#fbeee633")], { poids: 0, base: "280px", min: "230px", gap: "0px", extra: { maxWidth: "280px", flexGrow: 0 } });
    const reseaux = G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "600", couleur: CREME, survol: PECHE, focus: PECHE })(k, env);
    const gauche = G.colonne(k, [intro, reseaux], { poids: 1, base: "0px", min: "280px", gap: "18px" });
    const haut = G.bande(k, [etiq, phrase, k.row([cta], { gap: "12px" })], { fond: AUBERGINE, colonne: true, gap: "28px", padV: ["96px", "72px", "52px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Appel XXL" });
    const bas1 = G.bande(k, [gauche, droite], { fond: AUBERGINE, gap: "36px 72px", aligne: "flex-start", padV: ["0px", "0px", "0px"], padB: ["80px", "64px", "44px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Colonne étroite" });
    return [G.racine(k, [haut, bas1, mentionsBande(G, k, env, { fond: AUBERGINE2, texte: MAUVE, liens: CREME })])];
  },
}, FAM);

// ═══ ft2-293 « Deux modèles » — IA explicable — ARCHÉTYPE E : deux demi-pages bord à bord ═══
// Idée : DEUX DEMI-PAGES de couleurs opposées. À gauche un grand aplat ambre : le message (« Chaque réponse a sa preuve. ») ; à droite un aplat noir : les actions (lettre d'information, deux boutons carrés et quatre liens).
// Une barre noire plus fine porte les mentions. Ambre, noir, blanc. Polices : Space Grotesk (titres) et Work Sans (texte). Libellés d'exemple.
const deux = identite({
  key: "c293", label: "Ambre et noir", humeur: "dark",
  fond: "#111111", texte: "#f5f5f0", discret: "#bdbdb4", accent: "#ffc933", surface: "#1c1c1a", encre: "#111111", surEncre: "#f5f5f0",
  police: "font.work-sans", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f5f5f040",
});
const NOIR = "#111111", AMBRE = "#ffc933", BLANC = "#f5f5f0", GRISC = "#bdbdb4";
const deuxModeles = modeleV2({
  id: identifiantV2(293, "deux-modeles"), concept: "c-293-deux-modeles",
  name: "Deux modèles", family: FAM,
  description: "Pour une entreprise d'IA explicable : deux demi-pages bord à bord, ambre à gauche (le message « Chaque réponse a sa preuve. ») et noir à droite (lettre, deux boutons carrés, liens), puis une barre de mentions.",
  tags: ["IA explicable", "demi-pages", "message et actions", "ambre", "noir", "lettre", "boutons carrés"],
  identity: deux,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, PAD = { paddingTop: "76px", paddingBottom: "68px", paddingLeft: "48px", paddingRight: "48px" };
    const marque = k.row([souffle(carre(k, NOIR, "14px"), 2600), caps(k, "Tensora · IA explicable", { couleur: NOIR, police: S.head, suivi: "0.2em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const phrase = G.geant(`<p>Chaque<br>réponse<br>a sa preuve.</p>`, { taille: [52, 128], tablette: { taille: [84, 116] }, mobile: { taille: [52, 80] }, lh: 0.95, suivi: "-0.03em", poids: "700", police: S.head, couleur: NOIR })(k, env);
    const note = k.T("<p>Des modèles dont on peut relire le raisonnement.</p>", { fontSize: "18px", lineHeight: 1.5, color: NOIR, fontFamily: S.font, maxWidth: "380px", fontWeight: "500" });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Lettre", intro: "Un message à chaque nouveauté, pas plus.", bouton: "Je m'abonne", largeur: "380px", accent: NOIR, texte: NOIR, consentCouleur: NOIR }), { titre: NOIR, intro: NOIR, boutonTexte: AMBRE, survolFond: BLANC, survolTexte: NOIR, focus: NOIR });
    const gauche = G.colonne(k, [marque, phrase, note, abo], { poids: 1, base: "50%", min: "320px", gap: "26px", justifie: "space-between", extra: { backgroundColor: AMBRE, ...PAD } });
    const action = (t, u, d) => lien(k, t, u, { taille: 28, poids: "700", couleur: BLANC, police: S.head, bloc: true, h: "84px", lh: 1.1, survol: { backgroundColor: AMBRE, color: NOIR, transform: { x: 12 } }, focus: AMBRE, extra: { width: "100%", paddingLeft: "10px", paddingRight: "10px", justifyContent: "space-between" } });
    const lignesAct = G.colonne(k, [trait(k, "#f5f5f066"), action("Essayer gratuitement  →", "/contact"), trait(k, "#f5f5f066"), action("Se connecter  →", "/connexion"), trait(k, "#f5f5f066"), action("Lire la documentation  →", "/faq"), trait(k, "#f5f5f066"), action("Parler à l'équipe  →", "/contact"), trait(k, "#f5f5f066")], { gap: "0px", extra: { width: "100%" } });
    const droite = G.colonne(k, [caps(k, "Passer à l'action", { couleur: AMBRE, police: S.head }), lignesAct], { poids: 1, base: "50%", min: "320px", gap: "20px", justifie: "center", extra: { backgroundColor: NOIR, ...PAD } });
    const moitie = G.bande(k, [gauche, droite], { fond: NOIR, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Deux demi-pages" });
    return [G.racine(k, [moitie, mentionsBande(G, k, env, { fond: "#0a0a0a", texte: GRISC, liens: BLANC })])];
  },
}, FAM);

// ═══ ft2-294 « Glossaire vivant » — lexique de la donnée — ARCHÉTYPE G : index en lignes pleine largeur ═══
// Idée : un SOMMAIRE de glossaire : cinq grandes lignes pleine largeur, chacune avec sa lettre en grand italique vermillon, le terme en Newsreader, une courte définition à droite et une flèche ; au survol la ligne noircit
// et s'indente. Pas de carte. Papier crème, encre, vermillon. Polices : Newsreader et IBM Plex Sans. Termes d'exemple.
const gloss = identite({
  key: "c294", label: "Papier crème, encre et vermillon", humeur: "light",
  fond: "#f2ede4", texte: "#1b1b1b", discret: "#4f4a42", accent: "#b92f14", surface: "#faf7f1", encre: "#1b1b1b", surEncre: "#f2ede4",
  police: "font.ibm-plex-sans", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#1b1b1b33",
});
const CREMEG = "#f2ede4", ENCREG = "#1b1b1b", VERMILLON = "#b92f14", VERMC = "#ff8a6b";
const glossaire = modeleV2({
  id: identifiantV2(294, "glossaire-vivant"), concept: "c-294-glossaire-vivant",
  name: "Glossaire vivant", family: FAM,
  description: "Pour un éditeur de contenus sur la donnée : sommaire de glossaire en cinq grandes lignes pleine largeur (lettre vermillon, terme, définition, flèche) qui noircissent et s'indentent au survol. Papier crème, encre, vermillon.",
  tags: ["glossaire", "lexique", "données", "index", "lignes pleine largeur", "serif", "vermillon"],
  identity: gloss,
  racine: racineDe(ENCREG),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const ligneG = (lettre, terme, def, url) => {
      const l = lien(k, `${lettre}   ${terme}`, url, { taille: 38, poids: "500", couleur: ENCREG, police: S.head, h: "92px", bloc: true, lh: 1.05, survol: { backgroundColor: ENCREG, color: CREMEG, transform: { x: 14 } }, focus: VERMILLON, extra: { flexGrow: 1, flexBasis: "58%", paddingLeft: "6px", fontStyle: "italic" } });
      const d = k.T(`<p>${def} →</p>`, { fontSize: "15px", lineHeight: 1.4, color: S.mute, fontFamily: S.font, textAlign: "right", flexBasis: "30%", flexGrow: 1, minWidth: "160px" });
      return k.row([l, d], { rowGap: "2px", columnGap: "24px", alignItems: "center", width: "100%", justifyContent: "space-between" });
    };
    const defs = [["A", "Algorithme", "Une suite d'étapes qui résout un problème", "/faq"], ["D", "Donnée", "Une information que l'on peut mesurer", "/faq"], ["M", "Modèle", "Ce que l'on apprend à partir des données", "/faq"], ["R", "Réseau de neurones", "Un modèle fait de couches de calcul", "/blog"], ["V", "Vecteur", "Une suite de nombres qui décrit un objet", "/blog"]];
    const lignes = defs.flatMap(([a, b, c, u]) => [trait(k, "#1b1b1b99"), ligneG(a, b, c, u)]);
    const liste = G.colonne(k, [...lignes, trait(k, ENCREG, "3px")], { poids: 2, base: "0px", min: "320px", gap: "0px" });
    const titreG = G.geant(`<p>Les mots<br>de la <span style="color:${VERMILLON}">donnée</span>.</p>`, { taille: [44, 96], tablette: { taille: [64, 88] }, mobile: { taille: [44, 60] }, lh: 0.98, suivi: "-0.02em", poids: "500", police: S.head, couleur: ENCREG })(k, env);
    const gaucheG = G.colonne(k, [caps(k, "Glossaire de la donnée", { couleur: VERMILLON, suivi: "0.22em" }), titreG, lien(k, "Poser une question →", "/faq", { taille: 15, poids: "600", couleur: ENCREG, soulign: true, survol: { color: VERMILLON }, focus: VERMILLON })], { poids: 1, base: "0px", min: "260px", gap: "18px" });
    const haut = G.bande(k, [gaucheG, liste], { fond: CREMEG, gap: "36px 64px", aligne: "flex-start", padV: ["72px", "56px", "40px"], padB: ["56px", "44px", "32px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Titre et sommaire" });
    const marque = k.T("<p>Lexica</p>", { fontSize: "26px", fontStyle: "italic", fontFamily: S.head, color: CREMEG, lineHeight: 1.1 });
    const reseauxG = G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["Mastodon", "https://joinmastodon.org/"]], { taille: 15, poids: "600", couleur: CREMEG, survol: VERMC, focus: VERMC })(k, env);
    const bas = G.bande(k, [marque, reseauxG, G.ligneLegale({ taille: 13, couleur: "#cfc8bb", liens: CREMEG, sansCookies: true })(k, env)], { fond: ENCREG, gap: "14px 40px", aligne: "center", padV: ["30px", "26px", "22px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Marque et mentions" });
    bas.styles.desktop.color = CREMEG;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-295 « Chaîne de traitement » — ingénierie des données — ARCHÉTYPE I : frise à points carrés ═══
// Idée : une FRISE horizontale en cinq étapes (Collecter, Nettoyer, Entraîner, Évaluer, Déployer) : points carrés reliés par un filet menthe, chaque étape avec son numéro et deux liens dessous ; le premier point respire.
// Sous la frise, une seule ligne marque et mentions. Sur mobile la frise devient verticale. Vert profond, menthe. Polices : Sora (titres) et IBM Plex Sans. Étapes et liens d'exemple.
const chaine = identite({
  key: "c295", label: "Vert profond et menthe", humeur: "dark",
  fond: "#06302c", texte: "#e6faf4", discret: "#9cc7bd", accent: "#6ff0c4", surface: "#0a3f39", encre: "#06302c", surEncre: "#e6faf4",
  police: "font.ibm-plex-sans", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#e6faf440",
});
const PROFOND = "#06302c", PROFOND2 = "#041f1c", MENTHE = "#6ff0c4", SOUFRE = "#e6faf4", SAUGE = "#9cc7bd";
const chaineTraitement = modeleV2({
  id: identifiantV2(295, "chaine-de-traitement"), concept: "c-295-chaine-de-traitement",
  name: "Chaîne de traitement", family: FAM,
  description: "Pour une société d'ingénierie de la donnée : frise horizontale en cinq étapes (collecter, nettoyer, entraîner, évaluer, déployer) à points carrés reliés par un filet menthe, deux liens par étape, puis marque et mentions. Vert profond, menthe.",
  tags: ["ingénierie de la donnée", "frise", "étapes", "pipeline", "points carrés", "vert profond", "menthe"],
  identity: chaine,
  racine: racineDe(PROFOND2),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const etape = (n, nom, a, b, premier) => {
      const point = premier ? souffle(carre(k, MENTHE, "16px"), 2600) : carre(k, MENTHE, "16px");
      const tete = k.row([point, k.divider({ width: "100%", borderColor: "#6ff0c4aa", borderTopWidth: "2px", marginTop: "0px", marginBottom: "0px", flexGrow: 1 })], { gap: "0px", alignItems: "center", flexWrap: "nowrap", width: "100%" });
      const lk = (t, u) => lien(k, t, u, { taille: 15, poids: "500", couleur: SOUFRE, padH: "0px", survol: { color: MENTHE, transform: { x: 6 } }, focus: MENTHE });
      const titreE = k.row([caps(k, n, { couleur: MENTHE, suivi: "0.2em", police: S.head }), k.T(`<p>${nom}</p>`, { fontSize: "26px", fontFamily: S.head, fontWeight: "600", color: SOUFRE, lineHeight: 1.15 })], { gap: "12px", alignItems: "baseline", flexWrap: "nowrap" });
      return G.colonne(k, [titreE, tete, k.col([lk(a[0], a[1]), lk(b[0], b[1])], { gap: "2px" })], { poids: 1, base: "0px", min: "170px", gap: "14px" });
    };
    const frise = G.ligne(k, [etape("01", "Collecter", ["Sources", "/blog"], ["Connecteurs", "/blog"], true), etape("02", "Nettoyer", ["Qualité", "/blog"], ["Règles", "/faq"]), etape("03", "Entraîner", ["Modèles", "/blog"], ["Méthode", "/blog"]), etape("04", "Évaluer", ["Mesures", "/faq"], ["Tests", "/faq"]), etape("05", "Déployer", ["Documentation", "/faq"], ["Contact", "/contact"])], { gap: "40px 28px", aligne: "flex-start", largeur: "100%", justifie: "space-between" });
    const titre = k.T(`<p>Du brut au <span style="color:${MENTHE}">déployé</span>.</p>`, { fontSize: "fluid:30-56", lineHeight: 1.05, fontFamily: S.head, fontWeight: "600", color: SOUFRE, letterSpacing: "-0.02em" });
    const haut = G.bande(k, [caps(k, "Chaîne de traitement · Orbitrix", { couleur: SAUGE, suivi: "0.22em" }), titre, frise], { fond: PROFOND, colonne: true, gap: "52px", padV: ["88px", "64px", "44px"], padB: ["72px", "56px", "40px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Frise" });
    return [G.racine(k, [haut, mentionsBande(G, k, env, { fond: PROFOND2, texte: SAUGE, liens: SOUFRE })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Données et intelligence artificielle", target: 6, built: true,
  description: "Pieds de plateformes de données et d'IA, angles droits, animations fluides : console, barre unique, appel XXL, demi-pages, glossaire, frise de traitement.",
  models: [inviteDeCommande, barreInference, appelCorpus, deuxModeles, glossaire, chaineTraitement],
};
