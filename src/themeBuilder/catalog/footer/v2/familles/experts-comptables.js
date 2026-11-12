// Famille v2 « Experts-comptables et gestion » — 5 modèles (ft2-206 à ft2-210), extension « carrée 2 » : angles droits, sites standard très professionnels, 5 archétypes de composition différents (G, A, C, E, L : DIVERSITE_STRICTE.md).
// Aucune date, aucun chiffre ni échéance inventé : les cases de l'échéancier sont « À renseigner » ; raccourcis et libellés sont des exemples modifiables dans l'éditeur.
const FAM = "experts-comptables";
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
// note de bas de bande (texte honnête, à remplacer dans l'éditeur) : jamais de numéro inventé
const note = (k, texte, couleur, o = {}) => k.T(`<p>${texte}</p>`, { fontSize: `${o.taille || 13}px`, lineHeight: 1.55, color: couleur, fontFamily: k.S.font, maxWidth: o.max || "640px" });

// ── ft2-206 « Sommaire du cabinet » ─ expert-comptable ── ARCHÉTYPE G (index en lignes pleine largeur) ─────────────────────────────────────────
// Idée : un SOMMAIRE de livre de comptes. Cinq lignes pleine largeur, sans cartes : folio, grand libellé serif (jusqu'à 56 px), pointillés et flèche ; un double filet encre les encadre.
// Au survol la ligne se teinte de blanc cassé et son retrait grandit. Dessous, une seule barre encre : coordonnées à gauche, mentions à droite (ni horaires ni lettre).
// Polices : Libre Caslon Text (titres) et Hanken Grotesk. Papier de registre jaune pâle, encre, rouge comptable.
const PAPIER_L = "#f1ecc9", ENCRE_L = "#1c2541", ROUGE_L = "#9b2226", CLAIR_L = "#fbf8e0";
const registre = identite({
  key: "c206", label: "Papier de registre, encre et rouge comptable", humeur: "light",
  fond: PAPIER_L, texte: ENCRE_L, discret: "#464b66", accent: ROUGE_L, surface: CLAIR_L, encre: ENCRE_L,
  police: "font.hanken-grotesk", titres: "font.libre-caslon-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1c254155",
});
const grandLivre = modeleV2({
  id: identifiantV2(206, "sommaire-du-cabinet"), concept: "c-206-sommaire-du-cabinet",
  name: "Sommaire du cabinet", family: FAM,
  description: "Pour un cabinet d'expertise comptable : un sommaire en cinq grandes lignes pleine largeur sur papier jaune pâle (folio, titre serif, pointillés, flèche) dont le retrait grandit au survol, et une seule barre encre pour le contact et les mentions.",
  tags: ["expert-comptable", "sommaire", "index", "papier jaune", "rouge comptable", "serif", "angles droits"],
  identity: registre,
  racine: racineDe(ENCRE_L),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const entete = k.row([caps(k, "Sommaire", { couleur: ROUGE_L, suivi: "0.22em" }), nomDuSite(k, env, 22, ENCRE_L, { fontFamily: S.head })], { justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "5px", borderBottomWidth: "1px", borderColor: ENCRE_L, borderRadius: "0px", paddingTop: "14px", paddingBottom: "14px" });
    const LIGNES = [["Accueil du cabinet", "/"], ["Actualités et conseils", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Nous contacter", "/contact"]];
    const rangee = ([t, u], i) => {
      const folio = k.T(`<p>${String(i + 1).padStart(2, "0")}</p>`, { fontSize: "16px", fontWeight: "700", color: ROUGE_L, fontFamily: S.font, minWidth: "34px" });
      const l = lien(k, t, u, { taille: 34, poids: "700", police: S.head, couleur: ENCRE_L, survol: { color: ROUGE_L }, focus: ROUGE_L, h: "84px", lh: 1.05, extra: { fontSize: "fluid:24-56" } });
      const points = k.col([], { flexGrow: 1, flexShrink: 1, minWidth: "12px", height: "0px", borderStyle: "dotted", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#1c254199", borderRadius: "0px", alignSelf: "flex-end", marginBottom: "30px" });
      const fl = k.T("<p>→</p>", { fontSize: "28px", color: ROUGE_L, fontFamily: S.font, lineHeight: 1 });
      const r = k.row([folio, l, points, fl], { flexWrap: "nowrap", alignItems: "center", gap: "18px", width: "100%", paddingLeft: "8px", paddingRight: "18px", backgroundColor: PAPIER_L, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1c254144", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: CLAIR_L, paddingLeft: "32px" } };
      return r;
    };
    const table = k.col(LIGNES.map(rangee), { gap: "0px", width: "100%" });
    const haut = G.bande(k, [entete, table], { fond: PAPIER_L, colonne: true, gap: "0px", padV: ["72px", "56px", "40px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Sommaire" });
    const contact = coordonnees(k, { taille: 15, couleur: "#e9e6d2", lien: "#ffffff", survol: "#f1ecc9", focus: "#ffffff" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d3d3d8", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.colonne(k, [contact], { poids: 1, min: "260px" }), G.colonne(k, [mentions], { poids: 1.4, min: "280px", soi: "flex-end" })], { fond: ENCRE_L, gap: "28px 48px", aligne: "flex-end", padV: ["44px", "36px", "32px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Barre" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ── ft2-207 « Bulletin de paie » ─ gestion de paie ── ARCHÉTYPE A (colonne latérale pleine hauteur) ──────────────────────────────────────────────
// Idée : une COLONNE MENTHE pleine hauteur à gauche (nom du cabinet, phrase, lettre sur fond menthe) et, à droite, le bulletin : en-tête graphite « Rubriques » puis six lignes zébrées en mono
// qui se remplissent de menthe au survol. Une ligne unique en bas (coordonnées, mentions). Polices : Geist (texte) et Geist Mono (libellés). Mobile : colonne menthe au-dessus.
const GRAPHITE = "#1b2630", MENTHE = "#8fd3c0", ZEBRE = "#233341";
const bulletin = identite({
  key: "c207", label: "Graphite et menthe", humeur: "dark",
  fond: GRAPHITE, texte: "#eef2f4", discret: "#b4c0c8", accent: MENTHE, surface: ZEBRE, encre: GRAPHITE, surEncre: "#eef2f4",
  police: "font.geist", titres: "font.geist-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eef2f433",
});
const bulletinPaie = modeleV2({
  id: identifiantV2(207, "bulletin-de-paie"), concept: "c-207-bulletin-de-paie",
  name: "Bulletin de paie", family: FAM,
  description: "Pour un service de gestion de paie : une colonne menthe pleine hauteur à gauche (nom, phrase, lettre) face à un bulletin graphite de six lignes zébrées en mono qui se remplissent de menthe au survol, et une ligne de coordonnées et mentions.",
  tags: ["gestion de paie", "bulletin", "colonne latérale", "zèbre", "graphite", "menthe", "mono", "angles droits"],
  identity: bulletin,
  racine: racineDe(GRAPHITE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 34, GRAPHITE, { fontFamily: S.font, fontWeight: "800" });
    const mot = k.T("<p>La paie de vos équipes, expliquée simplement. Posez vos questions, nous répondons avec méthode.</p>", { fontSize: "16px", lineHeight: 1.6, color: GRAPHITE, fontFamily: S.font, maxWidth: "280px" });
    const abo = lettre(k, env, G, { titre: "Lettre de la paie", intro: "Les rappels utiles, par courriel.", bouton: "S'abonner", largeur: "280px", accent: GRAPHITE, surBouton: MENTHE, texte: GRAPHITE, couleurTitre: GRAPHITE, fond: MENTHE, survolBouton: "#ffffff", survolTexte: GRAPHITE, focus: GRAPHITE });
    const lateral = k.col([caps(k, "Paie · cabinet", { couleur: GRAPHITE, police: S.head, suivi: "0.2em" }), nom, mot, k.col([], { flexGrow: 1 }), abo, coordonnees(k, { taille: 14, couleur: GRAPHITE, lien: GRAPHITE, survol: "#ffffff", focus: GRAPHITE }), G.ligneLegale({ taille: 12, sansCookies: true, couleur: GRAPHITE, liens: GRAPHITE })(k, env)], { flexBasis: "340px", flexGrow: 0, flexShrink: 0, minWidth: "300px", gap: "16px", backgroundColor: MENTHE, paddingTop: "56px", paddingBottom: "44px", paddingLeft: "36px", paddingRight: "36px", alignSelf: "stretch", borderRadius: "0px" }, undefined, { flexBasis: "100%", minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px" });
    const LIG = [["Accueil", "/"], ["Actualités sociales", "/blog"], ["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Espace client", "/connexion"], ["Envoyer mes éléments", "/contact"]];
    const DESC = ["Page d'accueil", "Nos conseils", "Réponses rapides", "Écrire au cabinet", "Vos documents", "Vos éléments du mois"];
    const ligne = ([t, u], i) => {
      const l = lien(k, t, u, { taille: 18, poids: "700", couleur: "#eef2f4", survol: { color: GRAPHITE }, focus: MENTHE, h: "58px", extra: { flexGrow: 1, flexBasis: "50%" } });
      const d = k.T(`<p>${DESC[i]}</p>`, { fontSize: "13px", fontFamily: S.head, color: MENTHE, flexBasis: "40%", textTransform: "uppercase", letterSpacing: "0.08em" });
      const r = k.row([l, d], { flexWrap: "nowrap", alignItems: "center", gap: "16px", width: "100%", paddingLeft: "18px", paddingRight: "18px", backgroundColor: i % 2 === 0 ? ZEBRE : GRAPHITE, borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: MENTHE } };
      return r;
    };
    const entete = k.row([caps(k, "Rubriques", { couleur: GRAPHITE, police: S.head, suivi: "0.22em" }), souffle(carre(k, GRAPHITE, "10px"), 3000)], { justifyContent: "space-between", width: "100%", backgroundColor: "#eef2f4", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", borderRadius: "0px" });
    const tableau = k.row([k.col(LIG.slice(0, 3).map((x, i) => ligne(x, i)), { flexGrow: 1, flexBasis: "280px", gap: "6px" }), k.col(LIG.slice(3).map((x, i) => ligne(x, i + 3)), { flexGrow: 1, flexBasis: "280px", gap: "6px" })], { rowGap: "6px", columnGap: "24px", alignItems: "flex-start", width: "100%" });
    const principal = k.col([entete, tableau], { flexGrow: 1, flexBasis: "0px", minWidth: "320px", gap: "18px", paddingTop: "56px", paddingBottom: "32px", paddingLeft: "48px", paddingRight: "48px", backgroundColor: GRAPHITE, borderRadius: "0px" }, undefined, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px" });
    const b = G.bande(k, [lateral, principal], { fond: GRAPHITE, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Bulletin" });
    return [G.racine(k, [b])];
  },
}, FAM);

// ── ft2-208 « Échéancier » ─ conseil fiscal ── ARCHÉTYPE C (damier de cases égales, chaque case = un lien) ──────────────────────────────────────
// Idée : un DAMIER de douze carrés de bord à bord (6 × 2), janvier à décembre : un grand numéro de mois en chiffres géants, le nom du mois en lien et « À renseigner » — AUCUNE date ni échéance inventée.
// Au survol la case se remplit de marine. Au-dessus : une ligne unique (titre « Échéances » et bouton) ; en dessous : une barre marine (coordonnées, mentions). Pas de lettre ni d'horaires.
// Polices : Red Hat Display (titres, chiffres géants) et Onest. Mobile : damier 2 × 6.
const GLACE = "#dfe7f1", MARINE_F = "#14213d", ORANGE_F = "#a8380f", BLANC_F = "#f5f8fc";
const echeancier = identite({
  key: "c208", label: "Glacier, marine et orange brûlé", humeur: "light",
  fond: GLACE, texte: MARINE_F, discret: "#41506b", accent: ORANGE_F, surface: BLANC_F, encre: MARINE_F,
  police: "font.onest", titres: "font.red-hat-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#14213d44",
});
const echeancierFiscal = modeleV2({
  id: identifiantV2(208, "echeancier"), concept: "c-208-echeancier",
  name: "Échéancier", family: FAM,
  description: "Pour un cabinet de conseil fiscal : un damier de douze carrés de bord à bord, janvier à décembre, chiffres géants et « À renseigner » (aucune date inventée), qui se remplissent de marine au survol ; une ligne de titre au-dessus, une barre de contact dessous.",
  tags: ["conseil fiscal", "calendrier", "échéances", "damier", "glacier", "marine", "chiffres géants", "angles droits"],
  identity: echeancier,
  racine: racineDe(MARINE_F),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Échéances <span style=\"color:#a8380f\">· exemple à compléter</span></p>", { fontSize: "fluid:22-38", lineHeight: 1.1, fontFamily: S.head, fontWeight: "800", color: MARINE_F });
    const btn = lien(k, "Poser une question fiscale", "/contact", { taille: 15, poids: "700", couleur: "#ffffff", h: "48px", padH: "22px", survol: { backgroundColor: MARINE_F, color: "#ffffff", transform: { y: -3 } }, focus: MARINE_F, extra: { backgroundColor: ORANGE_F, justifyContent: "center" } });
    const tete = G.bande(k, [titre, btn], { fond: GLACE, gap: "16px 32px", aligne: "center", padV: ["40px", "32px", "28px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const carreau = (m, i) => {
      const num = k.T(`<p>${String(i + 1).padStart(2, "0")}</p>`, { fontSize: "fluid:44-84", lineHeight: 0.9, fontWeight: "800", fontFamily: S.head, color: "#14213d33", letterSpacing: "-0.03em" });
      const l = lien(k, m, "/contact", { taille: 18, poids: "800", police: S.head, couleur: MARINE_F, survol: { color: "#ffffff" }, focus: ORANGE_F, h: "44px" });
      const c = k.col([num, k.col([], { flexGrow: 1 }), l, k.T("<p>À renseigner</p>", { fontSize: "13px", color: S.mute, fontFamily: S.font })], { flexGrow: 1, flexBasis: "16%", minWidth: "150px", minHeight: "190px", gap: "2px", paddingTop: "18px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "16px", backgroundColor: i % 2 === 0 ? BLANC_F : GLACE, borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderBottomWidth: "1px", borderColor: "#14213d44", borderRadius: "0px", transitionDuration: DOUX }, undefined, { flexBasis: "45%", minHeight: "150px" });
      c.states = { hover: { backgroundColor: MARINE_F } };
      if (i === 0) c.motion = { entrance: "pulse", trigger: "load", duration: 3600, iterations: "infinite", easing: "ease-in-out" };
      return c;
    };
    const damier = G.bande(k, [k.row(MOIS.map(carreau), { gap: "0px", alignItems: "stretch", width: "100%" })], { fond: GLACE, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], filetHaut: { epaisseur: "4px", couleur: MARINE_F }, nom: "Damier" });
    const contact = coordonnees(k, { taille: 15, couleur: "#e6edf7", lien: "#ffffff", survol: "#ffb48f", focus: "#ffffff" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cdd7e6", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.colonne(k, [contact], { poids: 1, min: "260px" }), G.colonne(k, [mentions], { poids: 1.4, min: "280px", soi: "flex-end" })], { fond: MARINE_F, gap: "24px 48px", aligne: "flex-end", padV: ["40px", "36px", "32px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Bas" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, damier, bas])];
  },
}, FAM);

// ── ft2-209 « Deux demi-pages » ─ centre de gestion ── ARCHÉTYPE E (deux demi-pages de couleurs opposées) ─────────────────────────────────────
// Idée : DEUX DEMI-PAGES bord à bord. À gauche, prune profond : le message (« Espace adhérent » en grand serif) et un bouton blanc carré. À droite, rose sable clair : les actions, en liste de grandes lignes
// flèchées, puis les horaires et les mentions. Pas de lettre, pas de quatre colonnes. Polices : DM Serif Text (titres) et Nunito Sans. Mobile : la demi-page prune passe au-dessus.
const SABLE_R = "#f4e1d6", PRUNE = "#6b2459", NUIT_P = "#2a1233", CLAIR_R = "#fff4ec";
const guichets = identite({
  key: "c209", label: "Prune profond et sable rosé", humeur: "light",
  fond: SABLE_R, texte: NUIT_P, discret: "#5a4560", accent: PRUNE, surface: CLAIR_R, encre: NUIT_P,
  police: "font.nunito-sans", titres: "font.dm-serif-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2a123344",
});
const deuxGuichets = modeleV2({
  id: identifiantV2(209, "deux-demi-pages"), concept: "c-209-deux-demi-pages",
  name: "Deux demi-pages", family: FAM,
  description: "Pour un centre de gestion : deux demi-pages de couleurs opposées, le message en grand serif sur prune à gauche, les actions en grandes lignes flèchées sur sable rosé à droite, avec les mentions.",
  tags: ["centre de gestion", "adhérents", "deux demi-pages", "prune", "sable", "serif", "angles droits"],
  identity: guichets,
  racine: racineDe(SABLE_R),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const t = G.geant("<p>Espace<br>adhérent</p>", { taille: [48, 104], tablette: { taille: [64, 92] }, mobile: { taille: [48, 64] }, lh: 1.0, suivi: "-0.02em", poids: "400", police: S.head, couleur: "#ffffff" })(k, env);
    const btn = lien(k, "Me connecter", "/connexion", { taille: 17, poids: "800", couleur: PRUNE, h: "58px", padH: "34px", survol: { backgroundColor: PRUNE, color: "#ffffff", transform: { x: 6 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", justifyContent: "center", alignSelf: "flex-start", borderStyle: "solid", borderWidth: "2px", borderColor: "#ffffff" } });
    const gauche = G.colonne(k, [caps(k, "Centre de gestion", { couleur: "#ffffff", suivi: "0.24em" }), t, k.T("<p>Vos documents, vos démarches et vos questions au même endroit.</p>", { fontSize: "18px", lineHeight: 1.55, color: "#ffffff", fontFamily: S.font, maxWidth: "380px" }), btn], { poids: 1, min: "340px", gap: "26px", justifie: "center", extra: { backgroundColor: PRUNE, paddingTop: "96px", paddingBottom: "96px", paddingLeft: "64px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "52px", paddingBottom: "52px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    const A = [["Actualités du centre", "/blog"], ["Questions fréquentes", "/faq"], ["Écrire au centre", "/contact"]];
    const ligne = ([tx, u]) => {
      const l = lien(k, tx, u, { taille: 26, poids: "400", police: S.head, couleur: NUIT_P, survol: { color: PRUNE }, focus: PRUNE, h: "64px", extra: { flexGrow: 1 } });
      const r = k.row([l, k.T("<p>→</p>", { fontSize: "24px", color: PRUNE, fontFamily: S.font })], { flexWrap: "nowrap", alignItems: "center", width: "100%", paddingRight: "12px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#2a123355", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { paddingLeft: "20px", backgroundColor: CLAIR_R } };
      return r;
    };
    const bas = k.col([G.ligneLegale({ taille: 13, sansCookies: true })(k, env)], { width: "100%", paddingTop: "28px" });
    const droite = G.colonne(k, [caps(k, "Actions", { couleur: PRUNE, suivi: "0.24em" }), k.col(A.map(ligne), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: NUIT_P, borderRadius: "0px" }), bas], { poids: 1, min: "340px", gap: "20px", justifie: "center", extra: { backgroundColor: SABLE_R, paddingTop: "88px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "64px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "40px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    droite.children.forEach((c) => { c.styles.desktop = { ...c.styles.desktop, width: "100%" }; });
    const deux = G.bande(k, [gauche, droite], { fond: SABLE_R, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Demi-pages" });
    return [G.racine(k, [deux])];
  },
}, FAM);

// ── ft2-210 « Marches de l'audit » ─ audit ── ARCHÉTYPE L (escalier : bandes de largeurs décroissantes alignées à gauche) ───────────────────────
// Idée : un ESCALIER. Quatre marches alignées à gauche et de plus en plus étroites (100 %, 76 %, 52 %, 30 %) dans des tons qui s'assombrissent : AUDIT en capitales étroites sur la marche saumon,
// la liste de contrôle (huit points à cases carrées) sur la deuxième, les coordonnées sur la troisième, la lettre sur la dernière. Au survol, un point se décale et son filet gauche s'épaissit.
// Polices : League Gothic (titre) et Inter Tight. Mobile : marches pleine largeur.
const NUIT_A = "#12161f", ORANGE_A = "#ff9f68", ENCRE_A = "#e9edf3";
const controle = identite({
  key: "c210", label: "Nuit encre et saumon", humeur: "dark",
  fond: NUIT_A, texte: ENCRE_A, discret: "#a9b3c2", accent: ORANGE_A, surface: "#1a2130", encre: NUIT_A, surEncre: ENCRE_A,
  police: "font.inter-tight", titres: "font.league-gothic",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e9edf333",
});
const listeControle = modeleV2({
  id: identifiantV2(210, "marches-de-l-audit"), concept: "c-210-marches-de-l-audit",
  name: "Marches de l'audit", family: FAM,
  description: "Pour un cabinet d'audit : un escalier de quatre marches alignées à gauche et de plus en plus étroites, AUDIT en capitales étroites sur le saumon, une liste de contrôle à cases carrées, le contact puis la lettre, dans des tons qui s'assombrissent.",
  tags: ["audit", "escalier", "étagé", "liste de contrôle", "nuit", "saumon", "capitales étroites", "angles droits"],
  identity: controle,
  racine: racineDe(NUIT_A),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marche = (largeur, fond, enfants, o = {}) => k.col(enfants, { width: largeur, boxSizing: "border-box", backgroundColor: fond, paddingTop: o.pv || "36px", paddingBottom: o.pv || "36px", paddingLeft: "48px", paddingRight: "48px", gap: "16px", borderRadius: "0px" }, { width: o.tablette || "100%", paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px" });
    const mot = G.geant("<p>AUDIT</p>", { taille: [96, 200], tablette: { taille: [130, 190] }, mobile: { taille: [96, 130] }, lh: 0.9, suivi: "0.01em", poids: "400", police: S.head, couleur: NUIT_A })(k, env);
    const m1 = marche("100%", ORANGE_A, [caps(k, "Revue · quatre marches", { couleur: NUIT_A, suivi: "0.22em" }), mot, k.T("<p>Une revue rigoureuse, des constats clairs. Chaque point mène à la page utile.</p>", { fontSize: "17px", lineHeight: 1.5, color: NUIT_A, fontFamily: S.font, maxWidth: "460px", fontWeight: "600" })], { pv: "44px" });
    const P = [["Pièces justificatives", "/contact"], ["Contrats en cours", "/contact"], ["Procédures internes", "/faq"], ["Comptes et annexes", "/contact"], ["Calendrier de mission", "/contact"], ["Rapport et restitution", "/contact"], ["Questions fréquentes", "/faq"], ["Actualités de l'audit", "/blog"]];
    const point = ([t, u], i) => {
      const cs = k.col([], { width: "18px", height: "18px", flexShrink: 0, borderStyle: "solid", borderWidth: "2px", borderColor: ORANGE_A, borderRadius: "0px", backgroundColor: i === 0 ? ORANGE_A : "#1c2433" });
      if (i === 0) souffle(cs, 3000);
      const l = lien(k, t, u, { taille: 16, poids: "600", couleur: ENCRE_A, survol: { color: ORANGE_A, transform: { x: 4 } }, focus: ORANGE_A, h: "46px" });
      const r = k.row([cs, l], { flexWrap: "nowrap", alignItems: "center", gap: "14px", width: "100%", paddingLeft: "14px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderBottomWidth: "1px", borderColor: "#e9edf333", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { borderLeftWidth: "10px", backgroundColor: "#262f42" } };
      return r;
    };
    const c1 = k.col(P.slice(0, 4).map((x, i) => point(x, i)), { gap: "0px", flexGrow: 1, flexBasis: "0px", minWidth: "240px" });
    const c2 = k.col(P.slice(4).map((x, i) => point(x, i + 4)), { gap: "0px", flexGrow: 1, flexBasis: "0px", minWidth: "240px" });
    const m2 = marche("76%", "#1f2838", [caps(k, "Liste de contrôle", { couleur: ORANGE_A }), k.row([c1, c2], { rowGap: "0px", columnGap: "36px", alignItems: "flex-start", width: "100%" })], { tablette: "100%" });
    const m3 = marche("52%", "#192030", [caps(k, "Nous joindre", { couleur: ORANGE_A }), coordonnees(k, { taille: 15, lien: "#ffffff", survol: ORANGE_A, focus: ORANGE_A })], { tablette: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre d'audit", intro: "Les nouveautés utiles, par courriel.", bouton: "S'abonner", largeur: "320px", accent: ORANGE_A, surBouton: NUIT_A, texte: ENCRE_A, couleurTitre: ORANGE_A, fond: "#151b27", survolBouton: "#ffffff", survolTexte: NUIT_A, focus: ORANGE_A });
    const m4 = marche("30%", "#151b27", [abo], { tablette: "100%" });
    const m5 = marche("100%", NUIT_A, [G.ligneLegale({ taille: 13, sansCookies: true })(k, env)], { pv: "18px" });
    const b = G.bande(k, [m1, m2, m3, m4, m5], { fond: NUIT_A, colonne: true, aligne: "flex-start", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Escalier" });
    return [G.racine(k, [b])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Experts-comptables et gestion", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : sommaire en lignes, bulletin avec colonne latérale, damier d'échéances à compléter, deux demi-pages, escalier d'audit.",
  models: [grandLivre, bulletinPaie, echeancierFiscal, deuxGuichets, listeControle],
};
