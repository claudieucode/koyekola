// Famille v2 « Assurance et courtage » — 5 modèles (ft2-211 à ft2-215), extension « carrée 2 » : angles droits, sites standard très professionnels, 5 archétypes de composition différents (I, F, K, H, B : DIVERSITE_STRICTE.md).
// Aucun numéro d'assistance ni d'immatriculation ORIAS inventé : des notes disent de les renseigner dans l'éditeur ; libellés et raccourcis sont des exemples modifiables.
const FAM = "assurance-courtage";
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

const ORIAS_NOTE = "Immatriculation ORIAS : numéro à renseigner dans l'éditeur (mentions légales). Aucun numéro n'est préinscrit.";
const ASSIST_NOTE = "Le numéro d'assistance figure sur votre contrat ou votre carte : nous n'en affichons pas de factice ici.";

// ── ft2-211 « Trois étapes » ─ courtier ── ARCHÉTYPE I (frise horizontale en étapes à points carrés) ─────────────────────────────────────────────
// Idée : une FRISE : trois étapes (Décrire, Comparer, Choisir) reliées par un trait épais, chacune ouverte par un carré plein numéroté ; au survol le carré s'agrandit et le titre se décale.
// Le premier carré « respire ». Dessous, une seule barre aubergine : coordonnées, note ORIAS à renseigner, mentions. Polices : Young Serif (titres) et Karla. Pêche, aubergine, framboise.
const PECHE = "#fde9e3", AUBERGINE = "#2b1a3a", FRAMBOISE = "#b01e55", CLAIR_P = "#fff6f3";
const frise = identite({
  key: "c211", label: "Pêche, aubergine et framboise", humeur: "light",
  fond: PECHE, texte: AUBERGINE, discret: "#5b4466", accent: FRAMBOISE, surface: CLAIR_P, encre: AUBERGINE,
  police: "font.karla", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2b1a3a44",
});
const troisEtapes = modeleV2({
  id: identifiantV2(211, "trois-etapes"), concept: "c-211-trois-etapes",
  name: "Trois étapes", family: FAM,
  description: "Pour un courtier en assurance : une frise de trois étapes (décrire, comparer, choisir) reliées par un trait épais et ouvertes par des carrés pleins qui grandissent au survol, puis une barre aubergine avec contact, note ORIAS à renseigner et mentions.",
  tags: ["courtier", "assurance", "frise", "étapes", "devis", "pêche", "aubergine", "angles droits"],
  identity: frise,
  racine: racineDe(AUBERGINE),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Du besoin au contrat, en trois étapes.</p>", { fontSize: "fluid:30-60", lineHeight: 1.08, fontFamily: S.head, color: AUBERGINE, maxWidth: "820px", letterSpacing: "-0.01em" });
    const etape = (n, t, texte, u) => {
      const marque = k.col([k.T(`<p>${n}</p>`, { fontSize: "22px", fontWeight: "800", color: "#ffffff", fontFamily: S.font, lineHeight: 1 })], { width: "56px", height: "56px", flexShrink: 0, alignItems: "center", justifyContent: "center", backgroundColor: FRAMBOISE, borderRadius: "0px", transitionDuration: DOUX });
      marque.states = { hover: { backgroundColor: AUBERGINE } };
      if (n === "1") souffle(marque, 3400);
      const trait_ = k.col([], { flexGrow: 1, height: "5px", backgroundColor: AUBERGINE, borderRadius: "0px" });
      const tete = k.row([marque, trait_], { flexWrap: "nowrap", alignItems: "center", gap: "0px", width: "100%" });
      const l = lien(k, t, u, { taille: 24, poids: "400", police: S.head, couleur: AUBERGINE, survol: { color: FRAMBOISE, transform: { x: 6 } }, focus: FRAMBOISE, h: "48px" });
      return k.col([tete, caps(k, `Étape ${n}`, { couleur: FRAMBOISE }), l, k.T(`<p>${texte}</p>`, { fontSize: "16px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "300px" })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "12px" });
    };
    const rang = k.row([etape("1", "Décrire votre besoin", "Dites-nous ce que vous voulez protéger, nous cadrons la demande avec vous.", "/contact"), etape("2", "Comparer les offres", "Nous mettons à plat les garanties et les exclusions, sans jargon.", "/faq"), etape("3", "Choisir avec nous", "Vous décidez en connaissance de cause, nous suivons ensuite votre contrat.", "/contact")], { rowGap: "40px", columnGap: "28px", alignItems: "stretch", width: "100%" });
    const btn = lien(k, "Demander un devis", "/contact", { taille: 17, poids: "800", couleur: "#ffffff", h: "54px", padH: "30px", survol: { backgroundColor: AUBERGINE, color: "#ffffff", transform: { y: -3 } }, focus: AUBERGINE, extra: { backgroundColor: FRAMBOISE, justifyContent: "center", alignSelf: "flex-start" } });
    const haut = G.bande(k, [caps(k, "Courtage · par étapes", { couleur: FRAMBOISE, suivi: "0.22em" }), titre, rang, btn], { fond: PECHE, colonne: true, gap: "34px", padV: ["88px", "68px", "48px"], padB: ["80px", "60px", "44px"], padH: ["48px", "32px", "20px"], nom: "Frise" });
    const contact = coordonnees(k, { taille: 15, couleur: "#f1e4f2", lien: "#ffffff", survol: "#ffc2d6", focus: "#ffffff" });
    const droite = k.col([note(k, ORIAS_NOTE, "#e8d7ea"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#e8d7ea", liens: "#ffffff" })(k, env)], { gap: "16px" });
    const bas = G.bande(k, [G.colonne(k, [contact], { poids: 1, min: "260px" }), G.colonne(k, [droite], { poids: 1.6, min: "300px" })], { fond: AUBERGINE, gap: "28px 56px", aligne: "flex-start", padV: ["48px", "40px", "36px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Barre" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ── ft2-212 « Sinistre, d'abord » ─ agence d'assurance ── ARCHÉTYPE F (bandeau d'appel XXL + une colonne étroite de liens à droite) ───────────────
// Idée : tout en haut, un BANDEAU XXL orange : « Déclarer un sinistre » en capitales géantes avec un grand bouton blanc et un carré qui respire. Dessous, à gauche, le nom de l'agence en grand, ses horaires
// et la note d'assistance ; à droite, UNE colonne étroite de liens produits dont le filet se prolonge au survol. Polices : Bitter (titres) et Hind. Menthe, vert profond, orange.
const MENTHE_A = "#d9f2e6", VERT_A = "#0b3d2e", ORANGE_S = "#b13a0a", CLAIR_A = "#f0fbf6";
const sinistre = identite({
  key: "c212", label: "Menthe claire, vert profond et orange", humeur: "light",
  fond: MENTHE_A, texte: VERT_A, discret: "#2f5a4a", accent: ORANGE_S, surface: CLAIR_A, encre: VERT_A,
  police: "font.hind", titres: "font.bitter",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0b3d2e44",
});
const sinistreDabord = modeleV2({
  id: identifiantV2(212, "sinistre-d-abord"), concept: "c-212-sinistre-d-abord",
  name: "Sinistre, d'abord", family: FAM,
  description: "Pour une agence d'assurance : un bandeau orange géant « Déclarer un sinistre » avec grand bouton, puis le nom de l'agence, ses horaires et la note d'assistance à gauche et une étroite colonne de liens produits à droite. Aucun numéro inventé.",
  tags: ["agence d'assurance", "sinistre", "bandeau XXL", "assistance", "menthe", "vert", "orange", "angles droits"],
  identity: sinistre,
  racine: racineDe(MENTHE_A),
  widgets: ["sitetitle", "text", "link", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const geant = G.geant("<p>Déclarer<br>un sinistre</p>", { taille: [48, 132], tablette: { taille: [72, 112] }, mobile: { taille: [48, 64] }, lh: 0.95, suivi: "-0.02em", poids: "700", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const btn = lien(k, "Ouvrir ma déclaration", "/contact", { taille: 20, poids: "800", couleur: ORANGE_S, h: "68px", padH: "40px", survol: { backgroundColor: VERT_A, color: "#ffffff", transform: { x: 8 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", justifyContent: "center", alignSelf: "flex-start" } });
    const g = G.colonne(k, [k.row([souffle(carre(k, "#ffffff", "14px"), 2800), caps(k, "Urgence · sinistre", { couleur: "#ffffff", suivi: "0.22em" })], { gap: "12px", alignItems: "center" }), geant], { poids: 3, min: "300px", gap: "18px" });
    const d = G.colonne(k, [k.T("<p>Dites-nous ce qui s'est passé : nous prenons le relais auprès de l'assureur.</p>", { fontSize: "19px", lineHeight: 1.5, color: "#ffffff", fontFamily: S.font, maxWidth: "340px" }), btn], { poids: 2, min: "280px", gap: "22px", soi: "flex-end" });
    const cta = G.bande(k, [g, d], { fond: ORANGE_S, gap: "32px 56px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const nom = nomDuSite(k, env, 54, VERT_A, { fontFamily: S.head, fontWeight: "700" });
    nom.parts = { ...(nom.parts || {}) };
    const pt = souffle(carre(k, ORANGE_S, "10px"), 3200);
    const gauche = G.colonne(k, [nom, note(k, ASSIST_NOTE, VERT_A, { taille: 16, max: "460px" }), k.row([pt, caps(k, "Horaires", { couleur: ORANGE_S })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })], { poids: 5, min: "300px", gap: "16px" });
    const PR = [["Auto", "/faq"], ["Habitation", "/faq"], ["Santé", "/faq"], ["Professionnels", "/contact"], ["Voyage", "/blog"]];
    const rangee = ([t, u]) => {
      const l = lien(k, t, u, { taille: 20, poids: "700", police: S.head, couleur: VERT_A, survol: { color: ORANGE_S }, focus: ORANGE_S, h: "54px", extra: { flexGrow: 1 } });
      const r = k.row([l, k.T("<p>→</p>", { fontSize: "20px", color: ORANGE_S, fontFamily: S.font })], { flexWrap: "nowrap", alignItems: "center", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#0b3d2e55", borderRadius: "0px", paddingRight: "8px", transitionDuration: DOUX });
      r.states = { hover: { paddingLeft: "14px", borderBottomWidth: "4px", borderColor: ORANGE_S } };
      return r;
    };
    const droite = G.colonne(k, [caps(k, "Nos assurances", { couleur: ORANGE_S, suivi: "0.22em" }), k.col(PR.map(rangee), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: VERT_A, borderRadius: "0px" })], { poids: 2, min: "240px", gap: "14px" });
    droite.children[1].styles.desktop = { ...droite.children[1].styles.desktop, width: "100%" };
    const corps = G.bande(k, [gauche, droite], { fond: MENTHE_A, gap: "48px 80px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Agence" });
    const bas = G.bande(k, [note(k, ORIAS_NOTE, S.mute), G.ligneLegale({ taille: 13, sansCookies: true })(k, env)], { fond: MENTHE_A, colonne: true, gap: "14px", padV: ["16px", "16px", "12px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: "#0b3d2e44" }, nom: "Mentions" });
    return [G.racine(k, [cta, corps, bas])];
  },
}, FAM);

// ── ft2-213 « Fenêtre adhérent » ─ mutuelle ── ARCHÉTYPE K (le pied ressemble à une fenêtre d'interface) ──────────────────────────────────────────
// Idée : une FENÊTRE d'application. Barre de titre encre avec trois petits carrés (comme des boutons de fenêtre) et « Espace adhérent », puis un corps à deux panneaux — un menu de quatre entrées à gauche, une aide
// et les coordonnées à droite — et une barre d'état en bas (mentions). Rien n'est un faux formulaire. Polices : Literata (titres) et Lato. Taupe, encre et vert sapin. Mobile : panneaux empilés.
const TAUPE = "#d9d2c5", ENCRE_M = "#1f2a28", SAPIN = "#0a5645", CLAIR_M = "#f4f0e8";
const fenetre = identite({
  key: "c213", label: "Taupe, encre et vert sapin", humeur: "light",
  fond: TAUPE, texte: ENCRE_M, discret: "#46504d", accent: SAPIN, surface: CLAIR_M, encre: ENCRE_M,
  police: "font.lato", titres: "font.literata",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#1f2a2855",
});
const fenetreAdherent = modeleV2({
  id: identifiantV2(213, "fenetre-adherent"), concept: "c-213-fenetre-adherent",
  name: "Fenêtre adhérent", family: FAM,
  description: "Pour une mutuelle : le pied dessiné comme une fenêtre d'application à angles droits, barre de titre encre à trois carrés, menu de quatre entrées, panneau d'aide avec coordonnées et barre d'état pour les mentions. Taupe, encre et vert sapin.",
  tags: ["mutuelle", "adhérent", "fenêtre", "interface", "taupe", "vert sapin", "angles droits"],
  identity: fenetre,
  racine: racineDe(TAUPE),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const boutons = k.row([carre(k, "#d9d2c5", "12px"), carre(k, "#d9d2c5", "12px"), souffle(carre(k, "#7fd6bd", "12px"), 3200)], { gap: "8px", alignItems: "center", flexWrap: "nowrap" });
    const barre = k.row([boutons, k.T("<p>MON-ESPACE / ADHÉRENT</p>", { fontSize: "13px", fontWeight: "700", letterSpacing: "0.16em", color: "#f4f0e8", fontFamily: S.font })], { gap: "20px", alignItems: "center", flexWrap: "nowrap", width: "100%", backgroundColor: ENCRE_M, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "18px", paddingRight: "18px", borderRadius: "0px" });
    const M = [["Mon espace adhérent", "/connexion"], ["Mes remboursements : questions", "/faq"], ["Poser une question", "/contact"], ["Actualités de la mutuelle", "/blog"]];
    const entree = ([t, u], i) => {
      const l = lien(k, t, u, { taille: 18, poids: "700", police: S.head, couleur: ENCRE_M, survol: { color: "#ffffff" }, focus: SAPIN, h: "56px", extra: { flexGrow: 1 } });
      const r = k.row([k.T(`<p>${i + 1}</p>`, { fontSize: "14px", fontWeight: "800", color: SAPIN, fontFamily: S.font, minWidth: "14px" }), l], { flexWrap: "nowrap", alignItems: "center", gap: "12px", width: "100%", paddingLeft: "16px", paddingRight: "12px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1f2a2833", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: SAPIN } };
      return r;
    };
    const menu = k.col(M.map(entree), { flexBasis: "320px", flexGrow: 1, minWidth: "260px", gap: "0px", backgroundColor: TAUPE, borderStyle: "solid", borderWidth: "0px", borderRightWidth: "2px", borderColor: ENCRE_M, borderRadius: "0px" }, undefined, { borderRightWidth: "0px", borderBottomWidth: "2px" });
    const aide = k.col([caps(k, "Aide", { couleur: SAPIN }), k.T("<p>Une question sur votre couverture ? Écrivez-nous ou venez nous voir ; nous vous répondons en direct.</p>", { fontSize: "16px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "420px" }), coordonnees(k, { taille: 15, lien: ENCRE_M, survol: SAPIN, focus: SAPIN }), horaires(k, { taille: 15 })], { flexBasis: "420px", flexGrow: 2, minWidth: "260px", gap: "14px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: CLAIR_M, borderRadius: "0px" });
    const corps = k.row([menu, aide], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const etat = k.row([k.col([G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { flexGrow: 1, flexBasis: "300px" })], { width: "100%", backgroundColor: TAUPE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: ENCRE_M, borderRadius: "0px" });
    const fen = k.col([barre, corps, etat], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "2px", borderColor: ENCRE_M, borderRadius: "0px", backgroundColor: TAUPE });
    const b = G.bande(k, [fen], { fond: TAUPE, colonne: true, padV: ["72px", "56px", "36px"], padB: ["72px", "56px", "36px"], padH: ["48px", "32px", "16px"], max: "1100px", nom: "Fenêtre" });
    return [G.racine(k, [b])];
  },
}, FAM);

// ── ft2-214 « Mosaïque de protection » ─ prévoyance ── ARCHÉTYPE H (mosaïque asymétrique : une grande case + trois petites) ────────────────────
// Idée : une MOSAÏQUE. À gauche une grande case citron-sombre « Protéger » (grand serif, texte, lien) ; à droite trois cases plus petites empilées : Anticiper, Transmettre, et « Nous joindre » (coordonnées).
// Les cases se soulèvent d'un cran et changent de ton au survol. Une seule ligne dessous (nom, assistance, mentions). Polices : Marcellus (titres) et Mulish. Vert nuit, or pâle.
const NUIT_V = "#1c2b2a", OR_V = "#e9c46a", TON1 = "#243836", TON2 = "#2d4643";
const paliers = identite({
  key: "c214", label: "Vert nuit et or pâle", humeur: "dark",
  fond: NUIT_V, texte: "#eef3f0", discret: "#b3c4bf", accent: OR_V, surface: TON1, encre: NUIT_V, surEncre: "#eef3f0",
  police: "font.mulish", titres: "font.marcellus",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eef3f033",
});
const mosaiqueProtection = modeleV2({
  id: identifiantV2(214, "mosaique-de-protection"), concept: "c-214-mosaique-de-protection",
  name: "Mosaïque de protection", family: FAM,
  description: "Pour un conseil en prévoyance : une mosaïque asymétrique à angles droits, une grande case « Protéger » et trois petites (anticiper, transmettre, nous joindre) qui se soulèvent et changent de ton au survol, puis une seule ligne d'assistance et de mentions.",
  tags: ["prévoyance", "mosaïque", "asymétrique", "vert nuit", "or pâle", "serif", "angles droits"],
  identity: paliers,
  racine: racineDe(NUIT_V),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const grandTitre = G.geant("<p>Protéger</p>", { taille: [56, 120], tablette: { taille: [80, 110] }, mobile: { taille: [56, 72] }, lh: 1, suivi: "-0.01em", poids: "400", police: S.head, couleur: OR_V })(k, env);
    const lg = lien(k, "Comprendre les garanties", "/faq", { taille: 18, poids: "800", couleur: NUIT_V, h: "54px", padH: "26px", survol: { backgroundColor: "#ffffff", transform: { x: 6 } }, focus: "#ffffff", extra: { backgroundColor: OR_V, justifyContent: "center", alignSelf: "flex-start" } });
    const grande = k.col([caps(k, "Case 1 · l'essentiel", { couleur: OR_V, suivi: "0.22em" }), grandTitre, k.col([], { flexGrow: 1 }), k.T("<p>Maladie, accident, décès : une couverture lisible pour vous et vos proches, expliquée sans détour.</p>", { fontSize: "19px", lineHeight: 1.55, color: "#eef3f0", fontFamily: S.font, maxWidth: "400px" }), lg], { flexGrow: 3, flexBasis: "0px", minWidth: "300px", minHeight: "460px", gap: "18px", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "44px", paddingRight: "44px", backgroundColor: TON1, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minHeight: "0px", flexBasis: "auto", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "36px" });
    grande.states = { hover: { backgroundColor: TON2, transform: { y: -4 } } };
    souffle(grande.children[0], 4000);
    const petite = (num, t, texte, u) => {
      const l = lien(k, t, u, { taille: 26, poids: "400", police: S.head, couleur: OR_V, survol: { color: "#ffffff", transform: { x: 6 } }, focus: OR_V, h: "48px" });
      const c = k.col([caps(k, num, { couleur: OR_V }), l, k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font })], { flexGrow: 1, flexBasis: "0px", minHeight: "140px", gap: "6px", paddingTop: "24px", paddingBottom: "22px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: TON1, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minHeight: "0px", flexBasis: "auto", flexGrow: 0, paddingLeft: "20px", paddingRight: "20px" });
      c.states = { hover: { backgroundColor: TON2, transform: { y: -4 } } };
      return c;
    };
    const joindre = k.col([caps(k, "Case 4 · nous joindre", { couleur: OR_V }), coordonnees(k, { taille: 15, lien: "#ffffff", survol: OR_V, focus: OR_V })], { flexGrow: 1, flexBasis: "0px", minHeight: "140px", gap: "10px", paddingTop: "24px", paddingBottom: "22px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: NUIT_V, borderStyle: "solid", borderWidth: "2px", borderColor: OR_V, borderRadius: "0px" }, undefined, { minHeight: "0px", flexBasis: "auto", flexGrow: 0, paddingLeft: "20px", paddingRight: "20px" });
    const droite = k.col([petite("Case 2", "Anticiper", "Préparer l'imprévu, à votre rythme.", "/blog"), petite("Case 3", "Transmettre", "Organiser ce que vous laissez.", "/contact"), joindre], { flexGrow: 2, flexBasis: "0px", minWidth: "280px", gap: "8px" });
    const mosaique = k.row([grande, droite], { gap: "8px", alignItems: "stretch", width: "100%" });
    const haut = G.bande(k, [mosaique], { fond: NUIT_V, colonne: true, padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "16px"], nom: "Mosaïque" });
    const nom = nomDuSite(k, env, 22, "#eef3f0", { fontFamily: S.head });
    const bas = G.bande(k, [nom, note(k, ASSIST_NOTE, "#b3c4bf", { max: "420px" }), G.ligneLegale({ taille: 13, sansCookies: true })(k, env)], { fond: NUIT_V, gap: "16px 40px", aligne: "center", padV: ["24px", "20px", "16px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Ligne" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ── ft2-215 « Rendez-vous privé » ─ gestion de patrimoine ── ARCHÉTYPE B (nom monumental seul au centre, grand vide) ─────────────────────────────
// Idée : presque rien. Au centre d'un grand vide ivoire, le NOM du cabinet en serif monumental, encadré de deux filets doubles ; sous lui, un seul bouton carré « Prendre rendez-vous » et deux liens discrets.
// Une seule petite ligne centrée : coordonnées, note des mentions réglementaires (ORIAS, etc.) à renseigner, mentions légales. Polices : Prata (titres) et Jost. Ivoire, bleu marine et or vieilli.
const IVOIRE = "#efe9dd", MARINE_P = "#101a2e", OR_P = "#7a5c14";
const prive = identite({
  key: "c215", label: "Ivoire, marine et or vieilli", humeur: "light",
  fond: IVOIRE, texte: MARINE_P, discret: "#454c5c", accent: OR_P, surface: "#f7f3ea", encre: MARINE_P,
  police: "font.jost", titres: "font.prata",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#101a2e44",
});
const rendezVousPrive = modeleV2({
  id: identifiantV2(215, "rendez-vous-prive"), concept: "c-215-rendez-vous-prive",
  name: "Rendez-vous privé", family: FAM,
  description: "Pour un cabinet de gestion de patrimoine : presque rien, le nom du cabinet en serif monumental au centre d'un grand vide ivoire entre deux doubles filets, un seul bouton carré de rendez-vous, deux liens discrets et une ligne centrée de mentions à renseigner.",
  tags: ["gestion de patrimoine", "nom monumental", "minimal", "ivoire", "marine", "or vieilli", "serif", "angles droits"],
  identity: prive,
  racine: racineDe(IVOIRE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const double = () => k.col([k.divider({ width: "100%", borderColor: MARINE_P, borderTopWidth: "3px", marginTop: "0px", marginBottom: "0px" }), k.divider({ width: "100%", borderColor: MARINE_P, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" })], { gap: "5px", width: "100%", maxWidth: "980px" });
    const nom = nomDuSite(k, env, 96, MARINE_P, { fontFamily: S.head, fontWeight: "400", letterSpacing: "-0.01em", textAlign: "center" });
    nom.styles.desktop = { ...nom.styles.desktop, fontSize: "fluid:44-128", textAlign: "center" };
    const btn = lien(k, "Prendre rendez-vous", "/contact", { taille: 17, poids: "500", casse: "uppercase", suivi: "0.16em", couleur: "#ffffff", h: "58px", padH: "38px", survol: { backgroundColor: OR_P, color: "#ffffff", transform: { y: -3 } }, focus: MARINE_P, extra: { backgroundColor: MARINE_P, justifyContent: "center" } });
    const liens = k.row([lien(k, "Actualités", "/blog", { taille: 16, poids: "500", couleur: MARINE_P, soulign: true, survol: { color: OR_P }, focus: OR_P }), k.col([], { width: "8px", height: "8px", backgroundColor: OR_P, borderRadius: "0px" }), lien(k, "Questions fréquentes", "/faq", { taille: 16, poids: "500", couleur: MARINE_P, soulign: true, survol: { color: OR_P }, focus: OR_P })], { gap: "18px", alignItems: "center", justifyContent: "center" });
    const centre = k.col([caps(k, "Gestion de patrimoine", { couleur: OR_P, suivi: "0.4em" }), nom, k.row([btn], { justifyContent: "center", width: "100%" }), liens], { alignItems: "center", gap: "30px", width: "100%", paddingTop: "56px", paddingBottom: "56px" });
    const contact = coordonnees(k, { taille: 14, lien: MARINE_P, survol: OR_P, focus: OR_P });
    contact.styles.desktop = { ...contact.styles.desktop, textAlign: "center", width: "auto" };
    const pied = k.col([k.row([contact], { justifyContent: "center", width: "100%" }), k.T(`<p>Mentions réglementaires du cabinet (ORIAS, statut, autorité de contrôle) : à renseigner dans l'éditeur. Rien n'est préinscrit.</p>`, { fontSize: "13px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "560px", textAlign: "center" }), G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true)], { alignItems: "center", gap: "12px", width: "100%" });
    const b = G.bande(k, [double(), centre, double(), pied], { fond: IVOIRE, colonne: true, aligne: "center", gap: "40px", padV: ["120px", "96px", "56px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Cabinet" });
    return [G.racine(k, [b])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Assurance et courtage", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : frise en trois étapes, bandeau sinistre XXL, fenêtre adhérent, mosaïque asymétrique, nom monumental sur ivoire.",
  models: [troisEtapes, sinistreDabord, fenetreAdherent, mosaiqueProtection, rendezVousPrive],
};
