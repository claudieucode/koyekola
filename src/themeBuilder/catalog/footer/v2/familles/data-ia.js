// Famille v2 « Données et intelligence artificielle » — 6 modèles (ft2-290 à ft2-295), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds de plateformes de données et d'IA (marques fictives). Aucune image, aucune coordonnée, aucun chiffre ni nom de produit réel inventé : les libellés (Produit, Documentation, Glossaire…) sont des intitulés
// D'EXEMPLE à renommer dans l'éditeur ; les adresses de réseaux sont des exemples. Chaque modèle a sa palette, ses polices (2 au plus) et son archétype de composition (K, D, F, E, G, I), en mode « solo ».
// Refonte « illustrée » : chaque pied reprend le parti pris visuel d'une capture (07 : logo dessiné + halo et arcs géants + colonnes + lettre ; 08 : grand bandeau d'appel en serif + champ à contour puis bloc sombre à marque et colonnes ;
// 09 : titre centré + index A-Z + colonnes + barre de logo) avec un dessin SVG propre à chaque modèle. Composition seulement, jamais de copie.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 14 px) ; UNE animation visible par modèle (carré d'état qui respire, ligne qui s'indente,
// bouton qui se soulève) ; pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");
const I = require("../aides-illus-a02");

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


// Colonne de liens : titre en majuscules (ou commentaire) puis liens à 44 px
const colLiens = (k, titre, liste, o = {}) => k.col([o.commentaire ? k.T(`<p>${titre}</p>`, { fontSize: "13px", fontFamily: k.S.head, color: o.titreCouleur, fontWeight: "700", lineHeight: 1.4 }) : caps(k, titre, { couleur: o.titreCouleur, police: o.policeTitre || k.S.head, suivi: "0.18em" }),
  ...liste.map(([t, u]) => lien(k, o.prefixe ? o.prefixe + t : t, u, { taille: o.taille || 16, poids: "500", couleur: o.couleur, padH: o.padH || "0px", police: o.police, survol: o.survol, focus: o.focus }))], { gap: "2px", flexGrow: 1, flexBasis: o.base || "150px", minWidth: "130px" });

const FAM = "data-ia";

// ═══ ft2-290 « Invite de commande » — plateforme de données — inspiré de la capture 07 (logo + halo d'arcs géants + colonnes + lettre) ═══
// Fond noir encre ; à droite un grand panneau d'ARCS concentriques vert citron qui s'éteignent dans un halo lumineux ; à gauche la marque dessinée (globe filaire + « kerneo » en mono), deux colonnes en commentaires `#`,
// lettre d'information, filet puis mentions et réseaux. Polices : Geist Mono et Geist. Libellés d'exemple.
const invite = identite({
  key: "c290", label: "Noir encre et vert citron", humeur: "dark",
  fond: "#0b0f14", texte: "#d7e2ee", discret: "#93a6b8", accent: "#b6f23c", surface: "#121a23", encre: "#0b0f14", surEncre: "#d7e2ee",
  police: "font.geist", titres: "font.geist-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#d7e2ee33",
});
const ENCRE = "#0b0f14", CITRON = "#b6f23c", BRUME = "#d7e2ee", ACIER = "#93a6b8";
const inviteDeCommande = modeleV2({
  id: identifiantV2(290, "invite-de-commande"), concept: "c-290-invite-de-commande",
  name: "Invite de commande", family: FAM,
  description: "Pour une plateforme de données : marque dessinée (globe filaire vert citron), commentaires # en colonnes, lettre d'information et grand panneau d'arcs lumineux sur fond noir encre. Polices mono.",
  tags: ["données", "plateforme", "développeurs", "arcs lumineux", "halo", "logo dessiné", "mono", "vert citron"],
  identity: invite,
  racine: racineDe(ENCRE),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider", "html"],
  compose(k, env, G) {
    const S = k.S;
    const logo = k.row([{ ...I.dessin(k, I.globeMini290(), { width: "64px", flexShrink: 0 }) }, k.T("<p>kerneo</p>", { fontSize: "fluid:34-48", fontFamily: S.head, fontWeight: "700", color: BRUME, letterSpacing: "-0.03em", lineHeight: 1 })], { gap: "16px", alignItems: "center", flexWrap: "nowrap" });
    const desc = k.T("<p>La plateforme qui relie, nettoie et rend vos données utiles.</p>", { fontSize: "17px", lineHeight: 1.55, color: ACIER, fontFamily: S.font, maxWidth: "380px" });
    const o = { commentaire: true, titreCouleur: CITRON, couleur: BRUME, police: S.head, taille: 15, padH: "0px", survol: { color: CITRON, transform: { x: 8 } }, focus: CITRON, prefixe: "> " };
    const c1 = colLiens(k, "# produit", [["plateforme", "/blog"], ["modèles", "/blog"], ["connecteurs", "/blog"], ["tarifs", "/contact"]], o);
    const c2 = colLiens(k, "# ressources", [["documentation", "/faq"], ["guides", "/blog"], ["aide", "/faq"], ["connexion", "/connexion"]], o);
    const abo = ABO_STYLE(abonnement(k, env, { titre: "# lettre", intro: "Les nouveautés, rarement.", bouton: "Envoyer", largeur: "100%", accent: CITRON, texte: BRUME, policeChamp: S.head, tailleChamp: "15px" }), { titre: CITRON, intro: ACIER, boutonTexte: ENCRE, survolFond: BRUME, survolTexte: ENCRE, focus: BRUME });
    souffle(abo, 3000);
    const cols = k.row([c1, c2, k.col([abo], { flexGrow: 1.4, flexBasis: "240px", minWidth: "220px" })], { rowGap: "24px", columnGap: "36px", alignItems: "flex-start", width: "100%" });
    const bas = k.col([trait(k, "#d7e2ee33"), k.row([G.ligneLegale({ taille: 13, couleur: ACIER, liens: BRUME, sansCookies: true })(k, env), G.reseauxTexte([["GitHub", "https://github.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 14, poids: "600", couleur: BRUME, survol: CITRON, focus: CITRON })(k, env)], { rowGap: "10px", columnGap: "28px", alignItems: "center", justifyContent: "space-between", width: "100%" })], { gap: "14px", width: "100%" });
    const gauche = G.colonne(k, [logo, desc, cols, bas], { poids: 1.5, base: "0px", min: "300px", gap: "30px", justifie: "space-between", extra: { paddingTop: "72px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "40px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "48px" } });
    const panneau = G.colonne(k, I.dessinDeux(k, I.arcs07(560, 700, "d290", { fond: ENCRE, halo: CITRON, arc: "#b6f23c", arc2: "#d7e2ee", cx: 0.9, cy: 0.96, force: 0.55 }), I.arcs07(390, 170, "m290", { fond: ENCRE, halo: CITRON, arc: "#b6f23c", arc2: "#d7e2ee", cx: 0.5, cy: 1.1, force: 0.5 }), {}), { poids: 1, base: "320px", min: "260px", gap: "0px", extra: { alignSelf: "stretch" } });
    const zone = G.bande(k, [gauche, panneau], { fond: ENCRE, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Marque, colonnes et arcs lumineux" });
    zone.styles.desktop.color = BRUME;
    return [G.racine(k, [zone])];
  },
}, FAM);

// ═══ ft2-291 « Barre d'inférence » — IA appliquée — capture 07 : marque monumentale à dégradé lumineux ═══
// Bleu nuit profond à halo cobalt. Une rangée (étoile de rayons, nom, six liens, « Essayer »), puis le NOM « VECTRA » dessiné en lettres épaisses pleine largeur à dégradé et contour décalé, puis mentions. Polices : DM Sans et DM Mono.
const barre = identite({
  key: "c291", label: "Bleu nuit et cobalt lumineux", humeur: "dark",
  fond: "#070b24", texte: "#e8ecff", discret: "#a3abdc", accent: "#7d92ff", surface: "#0e1440", encre: "#070b24", surEncre: "#e8ecff",
  police: "font.dm-sans", titres: "font.dm-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#e8ecff33",
});
const NUIT = "#070b24", COBALT = "#7d92ff", ECUME = "#e8ecff";
const barreInference = modeleV2({
  id: identifiantV2(291, "barre-d-inference"), concept: "c-291-barre-d-inference",
  name: "Barre d'inférence", family: FAM,
  description: "Pour un service d'IA appliquée : une rangée (marque en étoile, six liens, bouton « Essayer ») puis le nom VECTRA dessiné en immenses lettres à dégradé lumineux sur bleu nuit, et les mentions.",
  tags: ["intelligence artificielle", "service", "nom monumental", "dégradé lumineux", "bleu nuit", "cobalt"],
  identity: barre,
  racine: racineDe(NUIT),
  widgets: ["text", "link", "copyright", "bizlegal", "html"],
  compose(k, env, G) {
    const S = k.S;
    const marque = k.row([I.dessin(k, I.etoileLogo(10, "#7d92ff", "#e8ecff", "#e8ecff"), { width: "52px", flexShrink: 0 }), k.T("<p>Vectra</p>", { fontSize: "28px", fontWeight: "800", fontFamily: S.font, color: ECUME, letterSpacing: "-0.02em", lineHeight: 1.1 })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    souffle(marque, 3200);
    const nav = (t, u) => lien(k, t, u, { taille: 15, poids: "500", couleur: ECUME, padH: "4px", survol: { color: COBALT, transform: { y: -2 } }, focus: COBALT });
    const liens = G.ligne(k, [nav("Produit", "/blog"), nav("Modèles", "/blog"), nav("Documentation", "/faq"), nav("Sécurité", "/faq"), nav("Contact", "/contact"), nav("Connexion", "/connexion")], { gap: "0px 22px", aligne: "center", justifie: "center" });
    const essayer = bouton(k, "Essayer", "/contact", { texte: NUIT, fond: COBALT, taille: 14, survol: { backgroundColor: ECUME, borderColor: ECUME, color: NUIT, transform: { y: -3 } }, focus: ECUME });
    const rangee = k.row([marque, liens, essayer], { rowGap: "18px", columnGap: "32px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    const haut = G.bande(k, [rangee], { fond: NUIT, degrade: { from: "#070b24", to: "#16226e", angle: 160 }, padV: ["44px", "36px", "30px"], padB: ["44px", "36px", "30px"], padH: PH, aligne: "center", nom: "Rangée unique" });
    const nom = G.bande(k, I.dessinDeux(k, I.nomMonumental("d291", "VECTRA", 1440, 330, { fond: NUIT, c1: "#7d92ff", c2: "#e8ecff" }), I.nomMonumental("m291", "VECTRA", 390, 120, { fond: NUIT, c1: "#7d92ff", c2: "#e8ecff" }), {}), { fond: NUIT, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", aligne: "stretch", nom: "Nom monumental" });
    return [G.racine(k, [haut, nom, mentionsBande(G, k, env, { fond: "#04071a", texte: "#a3abdc", liens: ECUME })])];
  },
}, FAM);

// ═══ ft2-292 « Appel au corpus » — conseil en données — capture 08 : grand appel en serif + champ à contour, puis bloc sombre à marque ═══
// Bandeau aubergine : phrase XXL en serif à gauche, champ e-mail à contour à droite ; bande ONDULÉE pêche et mauve ; bloc sombre avec marque « Mnémo » en serif, trois colonnes et mentions. Polices : Instrument Serif et Hanken Grotesk.
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
  description: "Pour un cabinet de conseil en données : grand appel en serif avec champ e-mail à contour, bande ondulée pêche et mauve, puis bloc sombre à marque en serif, trois colonnes et mentions. Aubergine et pêche.",
  tags: ["conseil en données", "cabinet", "appel à l'action", "vagues", "serif", "aubergine", "pêche", "lettre"],
  identity: corpus,
  racine: racineDe(AUBERGINE2),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "html"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Parlons de<br>vos <span style="color:${PECHE}">données</span>.</p>`, { taille: [52, 120], tablette: { taille: [72, 100] }, mobile: { taille: [48, 68] }, lh: 0.95, suivi: "-0.02em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Lettre du cabinet", intro: "Un message utile, jamais plus d'un par mois.", bouton: "Envoyer", largeur: "460px", accent: CREME, texte: CREME, soulignement: "2px" }), { titre: PECHE, intro: MAUVE, boutonTexte: AUBERGINE, survolFond: CREME, survolTexte: AUBERGINE, focus: CREME });
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, backgroundColor: PECHE };
    souffle(abo, 3400);
    const appel = G.bande(k, [G.colonne(k, [phrase], { poids: 1.3, base: "0px", min: "280px" }), G.colonne(k, [abo], { poids: 1, base: "0px", min: "280px", justifie: "center" })], { fond: AUBERGINE, gap: "32px 64px", aligne: "center", padV: ["88px", "64px", "44px"], padB: ["64px", "48px", "32px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Appel et lettre" });
    const vagues = G.bande(k, I.dessinDeux(k, I.vagues292(1440, 230, "d"), I.vagues292(390, 120, "m"), {}), { fond: AUBERGINE, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", aligne: "stretch", nom: "Bandes ondulées" });
    const o = { titreCouleur: PECHE, couleur: CREME, survol: { color: PECHE, transform: { x: 8 } }, focus: PECHE, taille: 16 };
    const marque = G.colonne(k, [k.T("<p>Mnémo</p>", { fontSize: "fluid:44-84", fontFamily: S.head, color: CREME, lineHeight: 1, letterSpacing: "-0.02em" }), k.T("<p>Conseil en données, des premières questions aux premiers tableaux.</p>", { fontSize: "16px", lineHeight: 1.55, color: MAUVE, fontFamily: S.font, maxWidth: "320px" })], { poids: 1.5, base: "0px", min: "260px", gap: "16px" });
    const marque2 = G.colonne(k, [k.T("<p>Mnémo</p>", { fontSize: "fluid:44-84", fontFamily: S.head, color: CREME, lineHeight: 1, letterSpacing: "-0.02em" }), k.T("<p>Conseil en données, des premières questions aux premiers tableaux.</p>", { fontSize: "16px", lineHeight: 1.55, color: MAUVE, fontFamily: S.font, maxWidth: "320px" }), G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "600", couleur: CREME, survol: PECHE, focus: PECHE })(k, env)], { poids: 1.5, base: "0px", min: "260px", gap: "16px" });
    const bloc = G.bande(k, [marque2, colLiens(k, "Expertises", [["Stratégie", "/blog"], ["Méthode", "/blog"], ["Études de cas", "/blog"], ["Outils", "/blog"]], o), colLiens(k, "Échanger", [["Écrire à l'équipe", "/contact"], ["Questions fréquentes", "/faq"], ["Connexion", "/connexion"]], o)], { fond: AUBERGINE2, gap: "36px 48px", aligne: "flex-start", padV: ["64px", "52px", "40px"], padB: ["48px", "40px", "32px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Marque et colonnes" });
    return [G.racine(k, [appel, vagues, bloc, mentionsBande(G, k, env, { fond: AUBERGINE2, texte: MAUVE, liens: CREME })])];
  },
}, FAM);

// ═══ ft2-293 « Deux modèles » — IA explicable — capture 08 en deux demi-pages : appel + champ sur ambre, marque et colonnes sur noir ═══
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
  description: "Pour une entreprise d'IA explicable : deux demi-pages. À gauche l'ambre porte l'appel « Chaque réponse a sa preuve. », un arbre de preuve dessiné et la lettre ; à droite le noir porte la marque en lettres biseautées et trois colonnes.",
  tags: ["IA explicable", "demi-pages", "arbre dessiné", "ambre", "noir", "lettre", "marque biseautée"],
  identity: deux,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "html"],
  compose(k, env, G) {
    const S = k.S, PAD = { paddingTop: "72px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px" };
    const phrase = G.geant(`<p>Chaque réponse<br>a sa preuve.</p>`, { taille: [40, 84], tablette: { taille: [60, 80] }, mobile: { taille: [40, 56] }, lh: 0.98, suivi: "-0.03em", poids: "700", police: S.head, couleur: NOIR })(k, env);
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Lettre", intro: "Un message à chaque nouveauté.", bouton: "Envoyer", largeur: "420px", accent: NOIR, texte: NOIR, consentCouleur: NOIR, soulignement: "2px" }), { titre: NOIR, intro: NOIR, boutonTexte: AMBRE, survolFond: BLANC, survolTexte: NOIR, focus: NOIR });
    souffle(abo, 3000);
    const gauche = G.colonne(k, [caps(k, "Tensora · IA explicable", { couleur: NOIR, police: S.head, suivi: "0.2em" }), phrase, I.dessin(k, I.preuve293(), { maxWidth: "520px" }), abo], { poids: 1, base: "50%", min: "320px", gap: "26px", extra: { backgroundColor: AMBRE, ...PAD } });
    const o = { titreCouleur: AMBRE, couleur: BLANC, police: S.font, survol: { color: AMBRE, transform: { x: 8 } }, focus: AMBRE, taille: 16 };
    const cols = k.row([colLiens(k, "Produit", [["Modèles", "/blog"], ["Preuves", "/blog"], ["Tarifs", "/contact"]], o), colLiens(k, "Aide", [["Documentation", "/faq"], ["Questions", "/faq"], ["Connexion", "/connexion"]], o), colLiens(k, "Société", [["Équipe", "/blog"], ["Contact", "/contact"], ["Presse", "/contact"]], o)], { rowGap: "24px", columnGap: "32px", alignItems: "flex-start", width: "100%" });
    const droite = G.colonne(k, [I.dessin(k, I.nomBiseau("t293", "TENSORA", 520, 120, "#ffc933", "#ff9e00"), { maxWidth: "520px" }), k.T("<p>Des modèles dont on peut relire le raisonnement.</p>", { fontSize: "18px", lineHeight: 1.5, color: GRISC, fontFamily: S.font, maxWidth: "380px" }), cols], { poids: 1, base: "50%", min: "320px", gap: "36px", justifie: "center", extra: { backgroundColor: NOIR, ...PAD } });
    const moitie = G.bande(k, [gauche, droite], { fond: NOIR, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", gap: "0px", aligne: "stretch", nom: "Deux demi-pages" });
    return [G.racine(k, [moitie, mentionsBande(G, k, env, { fond: "#0a0a0a", texte: GRISC, liens: BLANC })])];
  },
}, FAM);

// ═══ ft2-294 « Glossaire vivant » — lexique de la donnée — capture 09 : titre centré, index A-Z, cinq colonnes, barre de logo ═══
const gloss = identite({
  key: "c294", label: "Papier crème, encre et vermillon", humeur: "light",
  fond: "#f2ede4", texte: "#1b1b1b", discret: "#4f4a42", accent: "#b92f14", surface: "#faf7f1", encre: "#1b1b1b", surEncre: "#f2ede4",
  police: "font.ibm-plex-sans", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#1b1b1b33",
});
const CREMEG = "#f2ede4", ENCREG = "#1b1b1b", VERMILLON = "#b92f14";
const glossaire = modeleV2({
  id: identifiantV2(294, "glossaire-vivant"), concept: "c-294-glossaire-vivant",
  name: "Glossaire vivant", family: FAM,
  description: "Pour un éditeur de contenus sur la donnée : un dictionnaire dessiné (pile de pages à onglets) près du titre, l'index A à Z cliquable, cinq colonnes de termes puis une barre à logo en étoile. Papier crème, encre, vermillon.",
  tags: ["glossaire", "lexique", "index A-Z", "dictionnaire dessiné", "cinq colonnes", "serif", "vermillon"],
  identity: gloss,
  racine: racineDe(CREMEG),
  widgets: ["text", "link", "copyright", "bizlegal", "divider", "html"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.colonne(k, [caps(k, "Glossaire de la donnée", { couleur: VERMILLON, suivi: "0.22em" }), G.geant(`<p>Les mots de la <span style="color:${VERMILLON}">donnée</span>.</p>`, { taille: [40, 84], tablette: { taille: [56, 76] }, mobile: { taille: [40, 52] }, lh: 1, suivi: "-0.02em", poids: "500", police: S.head, couleur: ENCREG })(k, env), k.T("<p>De l'algorithme au vecteur, chaque terme expliqué simplement.</p>", { fontSize: "18px", lineHeight: 1.5, color: S.mute, fontFamily: S.font, maxWidth: "440px" })], { poids: 1, base: "320px", min: "260px", gap: "14px", justifie: "center" });
    const tete = k.row([k.col([I.dessin(k, I.dico294(), {})], { flexBasis: "300px", flexGrow: 0, flexShrink: 1, minWidth: "220px", width: "300px" }), titre], { rowGap: "28px", columnGap: "56px", alignItems: "center", justifyContent: "center", width: "100%" });
    const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => lien(k, l, "/faq", { taille: 17, poids: "600", couleur: ENCREG, police: S.head, h: "44px", padH: "0px", extra: { width: "40px", justifyContent: "center" }, survol: { backgroundColor: ENCREG, color: CREMEG, transform: { y: -3 } }, focus: VERMILLON }));
    const az = G.ligne(k, lettres, { gap: "0px 2px", aligne: "center", justifie: "center", largeur: "100%" });
    souffle(az, 3600);
    const o = { titreCouleur: ENCREG, couleur: S.mute, survol: { color: VERMILLON, transform: { x: 6 } }, focus: VERMILLON, taille: 16, police: S.font, policeTitre: S.head };
    const cols = k.row([colLiens(k, "Notions", [["Donnée", "/faq"], ["Variable", "/faq"], ["Corrélation", "/faq"], ["Biais", "/faq"], ["Échantillon", "/faq"]], o), colLiens(k, "Modèles", [["Algorithme", "/faq"], ["Régression", "/faq"], ["Réseau de neurones", "/faq"], ["Vecteur", "/blog"], ["Apprentissage", "/blog"]], o), colLiens(k, "Outils", [["Tableur", "/blog"], ["Base de données", "/blog"], ["Notebook", "/blog"], ["Tableau de bord", "/blog"], ["API", "/blog"]], o), colLiens(k, "Aide", [["Questions", "/faq"], ["Proposer un terme", "/contact"], ["Corriger", "/contact"], ["Contact", "/contact"], ["Connexion", "/connexion"]], o), colLiens(k, "Autres", [["Le blog", "/blog"], ["Lettre", "/blog"], ["LinkedIn ↗", "https://www.linkedin.com/"], ["Mastodon ↗", "https://joinmastodon.org/"], ["Accueil", "/"]], o)], { rowGap: "28px", columnGap: "28px", alignItems: "flex-start", width: "100%" });
    const logo = k.row([I.dessin(k, I.etoileLogo(12, "#b92f14", "#1b1b1b", "#1b1b1b"), { width: "44px", flexShrink: 0 }), k.T("<p>Lexica</p>", { fontSize: "28px", fontStyle: "italic", fontFamily: S.head, color: ENCREG, lineHeight: 1.1 })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const barre = k.row([logo, G.ligneLegale({ taille: 13, couleur: S.mute, liens: ENCREG, sansCookies: true })(k, env)], { rowGap: "12px", columnGap: "28px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    const corps = G.bande(k, [tete, az, trait(k, "#1b1b1b33"), cols, trait(k, "#1b1b1b33"), barre], { fond: CREMEG, colonne: true, gap: "34px", padV: ["72px", "56px", "40px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Titre, index et colonnes" });
    corps.styles.desktop.color = ENCREG;
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═══ ft2-295 « Chaîne de traitement » — ingénierie des données — capture 09 en sombre : titre centré, frise dessinée, cinq colonnes d'étapes, barre de logo ═══
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
  description: "Pour une société d'ingénierie de la donnée : titre centré, grande frise dessinée où des points épars s'alignent puis deviennent des carrés, cinq colonnes numérotées (collecter à déployer) et barre de logo. Vert profond, menthe.",
  tags: ["ingénierie de la donnée", "frise dessinée", "cinq colonnes", "pipeline", "vert profond", "menthe"],
  identity: chaine,
  racine: racineDe(PROFOND2),
  widgets: ["text", "link", "copyright", "bizlegal", "divider", "html"],
  compose(k, env, G) {
    const S = k.S;
    const o = { titreCouleur: MENTHE, couleur: SOUFRE, survol: { color: MENTHE, transform: { x: 6 } }, focus: MENTHE, taille: 15, padH: "0px" };
    const strip = G.bande(k, I.dessinDeux(k, I.flux295(1440, 230, "d"), I.flux295(390, 130, "m"), {}), { fond: PROFOND2, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", aligne: "stretch", nom: "Frise dessinée" });
    const etape = (n, nom, liens) => {
      const tete = k.row([k.T(`<p>${n}</p>`, { fontSize: "13px", fontFamily: S.head, fontWeight: "700", color: MENTHE, lineHeight: 1.4 }), k.T(`<p>${nom}</p>`, { fontSize: "24px", fontFamily: S.head, fontWeight: "600", color: SOUFRE, lineHeight: 1.2 })], { gap: "14px", alignItems: "baseline", flexWrap: "nowrap", flexBasis: "220px", flexShrink: 0 });
      const ls = G.ligne(k, liens.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "500", couleur: SOUFRE, padH: "0px", survol: { color: MENTHE, transform: { y: -2 } }, focus: MENTHE })), { gap: "0px 26px", aligne: "center" });
      return k.row([tete, ls], { rowGap: "4px", columnGap: "32px", alignItems: "center", width: "100%", paddingTop: "6px", paddingBottom: "6px" });
    };
    const liste = k.col([["01", "Collecter", [["Sources", "/blog"], ["Connecteurs", "/blog"], ["Fichiers", "/blog"]]], ["02", "Nettoyer", [["Qualité", "/blog"], ["Règles", "/faq"], ["Doublons", "/faq"]]], ["03", "Entraîner", [["Modèles", "/blog"], ["Méthode", "/blog"], ["Réglages", "/faq"]]], ["04", "Évaluer", [["Mesures", "/faq"], ["Tests", "/faq"], ["Rapports", "/blog"]]], ["05", "Déployer", [["Documentation", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]]]].flatMap(([n, nom, l]) => [trait(k, "#e6faf433"), etape(n, nom, l)]).concat([trait(k, "#e6faf433")]), { gap: "0px", width: "100%" });
    souffle(liste, 3200);
    const gauche = G.colonne(k, [caps(k, "Chaîne de traitement · Orbitrix", { couleur: SAUGE, suivi: "0.24em" }), G.geant(`<p>Du brut au <span style="color:${MENTHE}">déployé</span>.</p>`, { taille: [38, 72], tablette: { taille: [56, 72] }, mobile: { taille: [38, 50] }, lh: 1, suivi: "-0.02em", poids: "600", police: S.head, couleur: SOUFRE })(k, env), k.row([I.dessin(k, I.etoileLogo(6, "#6ff0c4", "#e6faf4", "#6ff0c4"), { width: "44px", flexShrink: 0 }), k.T("<p>Orbitrix</p>", { fontSize: "26px", fontFamily: S.head, fontWeight: "600", color: SOUFRE, lineHeight: 1.1 })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" })], { poids: 1, base: "0px", min: "260px", gap: "22px" });
    const corps = G.bande(k, [gauche, G.colonne(k, [liste], { poids: 1.6, base: "0px", min: "300px" })], { fond: PROFOND, gap: "36px 72px", aligne: "flex-start", padV: ["64px", "52px", "40px"], padB: ["48px", "40px", "32px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Titre et étapes" });
    return [G.racine(k, [strip, corps, mentionsBande(G, k, env, { fond: PROFOND2, texte: SAUGE, liens: SOUFRE })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Données et intelligence artificielle", target: 6, built: true,
  description: "Pieds de plateformes de données et d'IA, illustrés, angles droits, animations fluides : arcs lumineux, nom monumental, vagues, demi-pages et arbre de preuve, glossaire A-Z, frise de traitement.",
  models: [inviteDeCommande, barreInference, appelCorpus, deuxModeles, glossaire, chaineTraitement],
};
