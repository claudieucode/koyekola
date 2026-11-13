// Famille v2 « Fintech et paiement » — 6 modèles (ft2-272 à ft2-277), pieds « inspirés de captures » : ANGLES DROITS partout, standard et très professionnels, marques fictives, aucun chiffre, tarif ni coordonnée inventés.
// Libellés de produits = EXEMPLES modifiables dans l'éditeur. MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, un carré qui respire ou une case qui se soulève par modèle. Pas d'animation d'entrée, pas de défilement continu.
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
// Rangée de lien pleine largeur (filet bas, fond qui change et glisse au survol) — angles droits
const rangee = (k, label, url, o) => lien(k, label, url, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, police: o.police, bloc: true, h: o.h || "48px", padH: o.padH || "12px", survol: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, transform: { x: 6 } }, focus: o.focus, extra: { width: "100%", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.ligne } });
// Panneau / case à angles droits, qui passe à la ligne et se redimensionne tout seul
const panneau = (k, enfants, o = {}) => k.col(enfants, { flexGrow: o.poids ?? 1, flexBasis: o.base || "0px", minWidth: o.min || "320px", gap: o.gap || "16px", justifyContent: o.justifie, alignItems: o.aligne || "flex-start", paddingTop: o.padV?.[0] || "56px", paddingBottom: o.padV?.[0] || "56px", paddingLeft: o.padH?.[0] || "56px", paddingRight: o.padH?.[0] || "56px", backgroundColor: o.fond, minHeight: o.hauteur, borderRadius: "0px", borderStyle: "solid", borderWidth: "0px", ...(o.extra || {}) },
  { paddingTop: o.padV?.[1] || "44px", paddingBottom: o.padV?.[1] || "44px", paddingLeft: o.padH?.[1] || "32px", paddingRight: o.padH?.[1] || "32px" },
  { paddingTop: o.padV?.[2] || "36px", paddingBottom: o.padV?.[2] || "36px", paddingLeft: o.padH?.[2] || "20px", paddingRight: o.padH?.[2] || "20px", minWidth: "0px", flexBasis: "100%" });
const rangeeDe = (k, enfants, o = {}) => k.row(enfants, { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", backgroundColor: o.fond, ...(o.extra || {}) });
const FAM = "fintech-paiement";
const PAGE_LARGEUR = { padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"] };
const mentionsBande = (k, env, G, fond, couleur, liens, o = {}) => G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur, liens })(k, env)], { fond, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions", ...o });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-272 « Appel à l'encaissement » — solution d'encaissement en ligne — archétype F : BANDEAU D'APPEL XXL en haut + liens en UNE colonne étroite à droite
// Idée (capture : grande phrase et bouton avant les colonnes) : un bandeau violet électrique porte une phrase gigantesque et un bouton blanc ; dessous, sur lavande pâle, le nom, une phrase et les réseaux à gauche,
// et UNE seule colonne étroite de huit liens à rangées à filet à droite. Un carré blanc respire dans le bandeau. Polices : Epilogue (phrase) et Instrument Sans. Mobile : la colonne passe sous le nom.
const appelXxl = identite({
  key: "c272", label: "Violet électrique et lavande pâle", humeur: "light",
  fond: "#f3f0ff", texte: "#1a1233", discret: "#554a78", accent: "#4a1fe0", surface: "#ffffff", encre: "#1a1233",
  police: "font.instrument-sans", titres: "font.epilogue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1a123333",
});
const VIOLET = "#4a1fe0", LAVANDE = "#f3f0ff", ENCRE_V = "#1a1233";

const appelEncaissement = modeleV2({
  id: identifiantV2(272, "appel-a-l-encaissement"), concept: "c-272-appel-a-l-encaissement",
  name: "Appel à l'encaissement", family: FAM,
  description: "Pour une solution d'encaissement : un bandeau violet électrique avec une phrase gigantesque et un bouton blanc, puis sur lavande le nom, une phrase et les réseaux à gauche et une seule colonne étroite de liens à rangées à filet à droite.",
  tags: ["fintech", "encaissement", "bandeau XXL", "appel à l'action", "violet", "lavande", "angles droits", "colonne étroite"],
  identity: appelXxl,
  racine: racineDe(LAVANDE),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.T("<p>Encaissez partout, sans friction.</p>", { fontSize: "fluid:44-124", lineHeight: 0.98, fontWeight: "800", fontFamily: S.head, color: "#ffffff", letterSpacing: "-0.03em", maxWidth: "980px", overflowWrap: "anywhere" });
    const bouton = lien(k, "Ouvrir un compte", "/contact", { taille: 20, poids: "800", couleur: VIOLET, h: "68px", padH: "40px", survol: { backgroundColor: ENCRE_V, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: "#ffffff" } });
    const parler = lien(k, "Parler à un conseiller", "/contact", { taille: 18, poids: "700", couleur: "#ffffff", h: "68px", padH: "8px", survol: { color: "#d9ceff", transform: { x: 6 } }, focus: "#ffffff", extra: { textDecoration: "underline", textDecorationThickness: "2px", textUnderlineOffset: "6px" } });
    const repere = k.row([souffle(carre(k, "#ffffff", "12px"), 3000), caps(k, "Paiements en ligne et en boutique", { couleur: "#ffffff", suivi: "0.24em" })], { gap: "12px", alignItems: "center" });
    const appel = G.bande(k, [repere, phrase, k.row([bouton, parler], { rowGap: "12px", columnGap: "32px", alignItems: "center", flexWrap: "wrap" })], { fond: VIOLET, colonne: true, gap: "36px", padV: ["104px", "72px", "52px"], padB: ["88px", "64px", "48px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Appel" });
    const nom = nomDuSite(k, env, 36, ENCRE_V, { fontWeight: "800" });
    const gauche = k.col([nom, k.T("<p>Des paiements clairs pour les commerçants, les associations et les équipes en ligne.</p>", { fontSize: "18px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "440px" }), G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", couleur: ENCRE_V, survol: VIOLET, focus: VIOLET })(k, env)], { gap: "22px", flexGrow: 1, flexBasis: "0px", minWidth: "280px" });
    const liens = ["Encaissement en ligne", "Terminaux en boutique", "Facturation", "Liens de paiement", "Documentation", "État du service", "Entreprise", "Contact"].map((t) => rangee(k, t, "/contact", { couleur: ENCRE_V, taille: 16, poids: "600", h: "48px", padH: "4px", fondSurvol: "#ffffff", couleurSurvol: VIOLET, focus: VIOLET, ligne: "#1a123344" }));
    const etroite = k.col(liens, { gap: "0px", width: "280px", flexShrink: 0 }, undefined, { width: "100%" });
    const corps = G.bande(k, [k.row([gauche, etroite], { rowGap: "40px", columnGap: "80px", alignItems: "flex-start", flexWrap: "wrap", width: "100%", justifyContent: "space-between" })], { fond: LAVANDE, colonne: true, padV: ["64px", "52px", "40px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    return [G.racine(k, [appel, corps, mentionsBande(k, env, G, LAVANDE, "#554a78", ENCRE_V, { filetHaut: { epaisseur: "1px", couleur: "#1a123333" } })])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-273 « Barre de règlement » — néobanque pour indépendants — archétype D : LIGNE UNIQUE type « barre de navigation inversée », compacte
// Idée : tout tient sur deux lignes sur un aplat vert citron : le nom, cinq liens en capitales mono, un bouton noir « Ouvrir un compte » et, dessous, les mentions. Chaque lien se remplit de noir au survol ;
// un carré noir respire devant le nom. Pas de colonnes, pas de lettre. Police : Martian Mono. Mobile : la ligne passe à la ligne, chaque lien fait 44 px.
const reglement = identite({
  key: "c273", label: "Vert citron et noir", humeur: "light",
  fond: "#d8ff3c", texte: "#0d0f08", discret: "#33380f", accent: "#0d0f08", surface: "#e7ff7a", encre: "#0d0f08",
  police: "font.martian-mono", titres: "font.martian-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0d0f0855",
});
const CITRON = "#d8ff3c", NOIR_C = "#0d0f08";

const barreDeReglement = modeleV2({
  id: identifiantV2(273, "barre-de-reglement"), concept: "c-273-barre-de-reglement",
  name: "Barre de règlement", family: FAM,
  description: "Pour une néobanque d'indépendants : tout sur deux lignes, un aplat vert citron avec le nom, cinq liens en capitales mono qui se remplissent de noir au survol, un bouton noir et les mentions sous un filet noir épais. Compact, sans colonnes.",
  tags: ["néobanque", "indépendants", "barre unique", "compact", "mono", "vert citron", "noir", "angles droits"],
  identity: reglement,
  racine: racineDe(CITRON),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 22, NOIR_C, { fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.02em" });
    const marque = k.col([k.row([souffle(carre(k, NOIR_C, "14px"), 2800), caps(k, "Compte pro", { couleur: NOIR_C, suivi: "0.2em", taille: "11px" })], { gap: "10px", alignItems: "center" }), nom], { gap: "6px" });
    const liens = ["Comptes", "Cartes", "Factures", "Tarifs", "Aide"].map((t) => lien(k, t, "/contact", { taille: 13, poids: "700", casse: "uppercase", suivi: "0.12em", couleur: NOIR_C, padH: "14px", survol: { backgroundColor: NOIR_C, color: CITRON, transform: { y: -2 } }, focus: NOIR_C }));
    const ouvrir = lien(k, "Ouvrir un compte", "/contact", { taille: 13, poids: "800", casse: "uppercase", suivi: "0.1em", couleur: CITRON, h: "48px", padH: "22px", survol: { backgroundColor: "#ffffff", color: NOIR_C, transform: { y: -2 } }, focus: NOIR_C, extra: { backgroundColor: NOIR_C, borderStyle: "solid", borderWidth: "2px", borderColor: NOIR_C } });
    const barre = G.ligne(k, [ouvrir, k.row(liens, { gap: "0px", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }), marque], { justifie: "space-between", largeur: "100%", gap: "14px 28px" });
    const corps = G.bande(k, [barre], { fond: CITRON, colonne: true, padV: ["30px", "26px", "22px"], padB: ["30px", "26px", "22px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "14px" }, nom: "Barre" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#33380f", liens: NOIR_C })(k, env)], { fond: CITRON, filetHaut: { epaisseur: "3px", couleur: NOIR_C }, colonne: true, padV: ["18px", "18px", "16px"], padB: ["18px", "18px", "16px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-274 « Deux rives » — plateforme de paiement pour associations — archétype E : DEUX DEMI-PAGES bord à bord (gauche = message, droite = actions)
// Idée (capture : phrase en italique et bouton à gauche, colonnes et réseaux à droite) : à gauche un panneau vert sapin avec une grande phrase en serif italique, une ligne de texte et un bouton menthe ;
// à droite un panneau menthe pâle avec cinq grandes rangées d'actions à filet et les réseaux en noms. Pas de lettre. Polices : IBM Plex Serif (phrase) et Golos Text. Mobile : le panneau sapin passe au-dessus.
const rives = identite({
  key: "c274", label: "Vert sapin et menthe pâle", humeur: "light",
  fond: "#e4f6ec", texte: "#0a2a24", discret: "#3d5e55", accent: "#0f6b55", surface: "#ffffff", encre: "#0a2a24",
  police: "font.golos-text", titres: "font.ibm-plex-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#0a2a2433",
});
const SAPIN = "#0a2a24", MENTHE = "#e4f6ec", MENTHE_VIVE = "#7be3b5";

const deuxRives = modeleV2({
  id: identifiantV2(274, "deux-rives"), concept: "c-274-deux-rives",
  name: "Rives du paiement", family: FAM,
  description: "Pour une plateforme de paiement d'associations : deux demi-pages bord à bord, à gauche un panneau vert sapin avec une phrase en serif italique et un bouton menthe, à droite un panneau menthe pâle avec cinq grandes rangées d'actions à filet et les réseaux.",
  tags: ["paiement", "associations", "deux panneaux", "serif italique", "sapin", "menthe", "angles droits", "réseaux"],
  identity: rives,
  racine: racineDe(MENTHE),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, "#ffffff", { fontWeight: "600" });
    const phrase = k.T("<p>Vos dons et vos cotisations, encaissés sans attendre.</p>", { fontSize: "fluid:36-72", lineHeight: 1.04, fontStyle: "italic", fontWeight: "500", fontFamily: S.head, color: "#ffffff", maxWidth: "640px", overflowWrap: "anywhere" });
    const mot = k.T("<p>Un parcours simple pour ceux qui donnent, un suivi clair pour ceux qui gèrent.</p>", { fontSize: "18px", lineHeight: 1.55, color: "#cfe9de", fontFamily: S.font, maxWidth: "460px" });
    const bouton = lien(k, "Collecter un paiement", "/contact", { taille: 18, poids: "700", couleur: SAPIN, h: "64px", padH: "32px", survol: { backgroundColor: "#ffffff", color: SAPIN, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: MENTHE_VIVE, borderStyle: "solid", borderWidth: "2px", borderColor: MENTHE_VIVE } });
    const gauche = panneau(k, [souffle(carre(k, MENTHE_VIVE, "12px"), 3200), nom, phrase, mot, bouton], { fond: SAPIN, gap: "24px", base: "0px", poids: 1.25, min: "340px", padV: ["96px", "56px", "44px"], padH: ["72px", "40px", "20px"] });
    const actions = k.col(["Dons en ligne", "Cotisations", "Billetterie", "Reçus fiscaux", "Documentation"].map((x) => rangee(k, x, "/contact", { couleur: SAPIN, police: S.head, taille: 26, poids: "500", h: "62px", padH: "6px", fondSurvol: "#ffffff", couleurSurvol: "#0f6b55", focus: SAPIN, ligne: "#0a2a2455" })), { gap: "0px", width: "100%" });
    const listes = k.col([caps(k, "Actions", { couleur: "#0f6b55", suivi: "0.22em" }), actions], { gap: "10px", width: "100%" });
    const suivre = k.col([caps(k, "Nous suivre", { couleur: "#0f6b55", suivi: "0.22em" }), G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 16, poids: "700", couleur: SAPIN, survol: "#0f6b55", focus: SAPIN })(k, env)], { gap: "10px" });
    const droite = panneau(k, [listes, trait(k, "#0a2a2433"), suivre], { fond: MENTHE, gap: "32px", base: "0px", poids: 1, min: "340px", padV: ["96px", "56px", "44px"], padH: ["64px", "40px", "20px"], justifie: "center" });
    return [G.racine(k, [G.bande(k, [rangeeDe(k, [gauche, droite])], { fond: MENTHE, colonne: true, max: "100%", ...PAGE_LARGEUR, aligne: "stretch", nom: "Pleine largeur" }), mentionsBande(k, env, G, MENTHE, "#3d5e55", SAPIN, { filetHaut: { epaisseur: "1px", couleur: "#0a2a2433" } })])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-275 « Mosaïque de comptes » — banque en ligne pour PME — archétype H : MOSAÏQUE ASYMÉTRIQUE (une grande case + trois petites)
// Idée (capture : marque monumentale rognée) : une grande case bleu marine avec une phrase, un bouton et le nom monumental rogné en bas (ton sur ton) ; à droite, trois petites cases empilées, jaune (produits), blanche (ressources)
// et corail (parler à l'équipe, coordonnées). Au survol, une case se soulève de 8 px. Polices : Unbounded (nom) et Lexend Deca. Mobile : les cases s'empilent.
const mosaique = identite({
  key: "c275", label: "Marine, jaune, blanc et corail", humeur: "dark",
  fond: "#0b1f4b", texte: "#ffffff", discret: "#b9c7ec", accent: "#ffd84d", surface: "#12306e", encre: "#0b1f4b",
  police: "font.lexend-deca", titres: "font.unbounded",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#ffffff33",
});
const MARINE = "#0b1f4b", JAUNE_M = "#ffd84d", CORAIL = "#ff6b57", INK_M = "#0b1f4b";

const mosaiqueDeComptes = modeleV2({
  id: identifiantV2(275, "mosaique-de-comptes"), concept: "c-275-mosaique-de-comptes",
  name: "Mosaïque de comptes", family: FAM,
  description: "Pour une banque en ligne de PME : une grande case marine avec phrase, bouton et nom monumental rogné ton sur ton, et trois petites cases à droite (jaune, blanche, corail) qui se soulèvent au survol.",
  tags: ["banque en ligne", "PME", "mosaïque", "asymétrique", "marine", "jaune", "corail", "angles droits"],
  identity: mosaique,
  racine: racineDe(MARINE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.T("<p>Le compte de l'entreprise, enfin lisible.</p>", { fontSize: "fluid:30-58", lineHeight: 1.08, fontWeight: "600", fontFamily: S.head, color: "#ffffff", maxWidth: "640px", overflowWrap: "anywhere" });
    const bouton = lien(k, "Ouvrir un compte pro", "/contact", { taille: 18, poids: "700", couleur: INK_M, h: "60px", padH: "30px", survol: { backgroundColor: "#ffffff", color: INK_M, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: JAUNE_M, borderStyle: "solid", borderWidth: "2px", borderColor: JAUNE_M } });
    const fantome = k.T("<p>NORD</p>", { fontSize: "fluid:80-170", lineHeight: 0.8, fontWeight: "700", fontFamily: S.head, color: "#5b7fd6", letterSpacing: "-0.03em", marginBottom: "-28px" });
    const rogne = { type: "container", hideOn: ["mobile"], children: [fantome], ...sty({ overflow: "hidden", width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: "auto" }) };
    const nom = nomDuSite(k, env, 26, "#ffffff", { fontWeight: "600" });
    const grande = k.col([k.row([souffle(carre(k, JAUNE_M, "12px"), 3000), nom], { gap: "12px", alignItems: "center" }), phrase, bouton, rogne], { flexGrow: 1.7, flexBasis: "0px", minWidth: "340px", minHeight: "560px", gap: "24px", paddingTop: "48px", paddingLeft: "48px", paddingRight: "48px", paddingBottom: "0px", backgroundColor: MARINE, borderRadius: "0px", justifyContent: "flex-start" }, { paddingLeft: "32px", paddingRight: "32px", paddingTop: "40px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", minWidth: "0px", flexBasis: "100%", minHeight: "0px" });
    const petite = (fond, enfants) => { const c = k.col(enfants, { flexGrow: 1, flexBasis: "0px", minHeight: "180px", gap: "10px", justifyContent: "space-between", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: fond, borderRadius: "0px", transitionDuration: DOUX }); c.states = { hover: { transform: { y: -8 } } }; return c; };
    const lienPetit = (t, couleur, survol) => lien(k, t, "/contact", { taille: 18, poids: "700", couleur, bloc: true, h: "44px", survol: { color: survol || couleur, transform: { x: 6 } }, focus: couleur });
    const cJaune = petite(JAUNE_M, [caps(k, "Produits", { couleur: INK_M }), k.col([lienPetit("Compte courant", INK_M), lienPetit("Cartes", INK_M), lienPetit("Factures", INK_M)], { gap: "0px" })]);
    const cBlanche = petite("#ffffff", [caps(k, "Ressources", { couleur: "#0b3fb5" }), k.col([lienPetit("Guides", INK_M, "#0b3fb5"), lienPetit("Documentation", INK_M, "#0b3fb5"), lienPetit("État du service", INK_M, "#0b3fb5")], { gap: "0px" })]);
    const cCorail = petite(CORAIL, [caps(k, "Parler à l'équipe", { couleur: INK_M }), coordonnees(k, { taille: 16, couleur: INK_M, lien: INK_M, survol: "#ffffff", focus: INK_M })]);
    const droite = k.col([cJaune, cBlanche, cCorail], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "0px", alignItems: "stretch" }, undefined, { minWidth: "0px", flexBasis: "100%" });
    const mosaiqueRow = k.row([grande, droite], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    return [G.racine(k, [G.bande(k, [mosaiqueRow], { fond: MARINE, colonne: true, max: "100%", ...PAGE_LARGEUR, aligne: "stretch", nom: "Pleine largeur" }), mentionsBande(k, env, G, "#081739", "#b9c7ec", "#ffffff")])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-276 « Chemin du virement » — service de virements — archétype I : FRISE HORIZONTALE EN ÉTAPES (points carrés numérotés)
// Idée : sur papier clair, le parcours d'un virement se lit comme une frise : quatre marches (Initier, Valider, Régler, Rapprocher), chacune un filet épais, un carré orange numéroté, un titre et une phrase ; la première marche
// est la plus foncée et son carré respire. Dessous, une seule ligne de liens et les mentions. Pas de colonnes ni de lettre. Polices : Michroma (titres) et Familjen Grotesk. Mobile : les marches s'empilent.
const chemin = identite({
  key: "c276", label: "Papier chaud, indigo et orange", humeur: "light",
  fond: "#fbf9f3", texte: "#1b1f3b", discret: "#4f5375", accent: "#c4410f", surface: "#ffffff", encre: "#1b1f3b",
  police: "font.familjen-grotesk", titres: "font.michroma",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1b1f3b33",
});
const INDIGO = "#1b1f3b", PAPIER = "#fbf9f3", ORANGE_V = "#c4410f";

const cheminDuVirement = modeleV2({
  id: identifiantV2(276, "chemin-du-virement"), concept: "c-276-chemin-du-virement",
  name: "Chemin du virement", family: FAM,
  description: "Pour un service de virements : sur papier clair, une frise de quatre marches (initier, valider, régler, rapprocher) à carrés orange numérotés dont le premier respire, puis une ligne de liens et les mentions.",
  tags: ["virements", "frise", "étapes", "carrés numérotés", "indigo", "orange", "papier", "angles droits"],
  identity: chemin,
  racine: racineDe(PAPIER),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 26, INDIGO, { fontWeight: "400", fontFamily: S.head });
    const intro = k.T("<p>Un virement, quatre temps : ce que vous voyez, ce que nous vérifions.</p>", { fontSize: "20px", lineHeight: 1.45, color: INDIGO, fontFamily: S.font, maxWidth: "520px" });
    const tete = G.ligne(k, [nom, intro], { justifie: "space-between", aligne: "flex-end", largeur: "100%", gap: "20px 48px" });
    const marche = ([t, d], i) => {
      const point = k.col([k.T(`<p>${i + 1}</p>`, { fontSize: "15px", fontWeight: "800", fontFamily: S.head, color: "#ffffff", lineHeight: 1, textAlign: "center" })], { width: "40px", height: "40px", backgroundColor: ORANGE_V, alignItems: "center", justifyContent: "center", borderRadius: "0px", flexShrink: 0 });
      if (i === 0) souffle(point, 4000);
      const c = k.col([k.col([], { width: "100%", height: "4px", backgroundColor: i === 0 ? INDIGO : "#1b1f3b55", borderRadius: "0px" }), point, k.T(`<p>${t}</p>`, { fontSize: "24px", fontFamily: S.head, color: INDIGO, lineHeight: 1.15 }), k.T(`<p>${d}</p>`, { fontSize: "16px", lineHeight: 1.55, color: S.mute, fontFamily: S.font })],
        { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "16px", borderRadius: "0px", transitionDuration: DOUX });
      c.states = { hover: { transform: { y: -5 } } };
      return c;
    };
    const frise = k.row([["Initier", "Vous saisissez le bénéficiaire et le montant."], ["Valider", "Une confirmation protège chaque ordre."], ["Régler", "Le paiement part vers la banque du bénéficiaire."], ["Rapprocher", "Le relevé se met en face de vos factures."]].map(marche), { gap: "28px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const liens = ["Documentation", "Tarifs", "État du service", "Aide", "Contact"].map((t) => lien(k, t, "/contact", { taille: 16, poids: "600", couleur: INDIGO, padH: "4px", survol: { color: ORANGE_V, transform: { y: -3 } }, focus: ORANGE_V, extra: { textDecoration: "underline", textDecorationColor: "#1b1f3b55", textUnderlineOffset: "6px" } }));
    const ligneLiens = k.row(liens, { columnGap: "32px", rowGap: "0px", flexWrap: "wrap", alignItems: "center" });
    const corps = G.bande(k, [tete, frise, trait(k, "#1b1f3b33"), ligneLiens], { fond: PAPIER, colonne: true, gap: "48px", padV: ["80px", "60px", "44px"], padB: ["44px", "36px", "32px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Frise" });
    return [G.racine(k, [corps, mentionsBande(k, env, G, PAPIER, "#4f5375", INDIGO)])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-277 « Papier du trésorier » — établissement de paiement institutionnel — archétype J : PIED « PAPIER À EN-TÊTE »
// Idée : une feuille crème à en-tête bordeaux : cadre à DOUBLE bordure, nom en capitales serif espacées, filet entre deux carrés, coordonnées centrées comme sur un courrier, une ligne centrée de liens, puis un « coupon »
// à bordure pointillée contenant la lettre d'information. Sobre, symétrique, sans colonnes. Polices : Libre Baskerville (nom) et Commissioner. Mobile : tout reste centré en pile.
const papier = identite({
  key: "c277", label: "Crème, bordeaux et or sourd", humeur: "light",
  fond: "#f6efe2", texte: "#3a0f1c", discret: "#6a4b52", accent: "#8c1d3f", surface: "#fffaf0", encre: "#3a0f1c",
  police: "font.commissioner", titres: "font.libre-baskerville",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#3a0f1c33",
});
const BORDEAUX = "#5c1428", CREME_P = "#f6efe2", OR_P = "#7a5a14", ENCRE_P = "#3a0f1c";

const papierDuTresorier = modeleV2({
  id: identifiantV2(277, "papier-du-tresorier"), concept: "c-277-papier-du-tresorier",
  name: "Papier du trésorier", family: FAM,
  description: "Pour un établissement de paiement institutionnel : une feuille crème à double bordure, nom en capitales serif espacées, une ligne de liens centrée en tête, un cartouche d'adresse et un coupon à bordure pointillée pour la lettre d'information.",
  tags: ["paiement", "institutionnel", "papier à en-tête", "double bordure", "coupon", "bordeaux", "crème", "angles droits"],
  identity: papier,
  racine: racineDe(CREME_P),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const centrer = (n, max = "460px") => { n.styles.desktop = { ...n.styles.desktop, textAlign: "center", width: "100%", maxWidth: max }; return n; };
    const nom = nomDuSite(k, env, 34, BORDEAUX, { fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.22em", textAlign: "center", lineHeight: 1.2 });
    const filet = k.row([trait(k, OR_P, "2px"), carre(k, OR_P, "8px"), trait(k, OR_P, "2px")], { gap: "14px", alignItems: "center", width: "100%", maxWidth: "360px", justifyContent: "center" });
    const adresse = coordonnees(k, { taille: 16, lien: BORDEAUX, survol: OR_P, focus: BORDEAUX });
    const liens = ["Particuliers", "Entreprises", "Tarifs", "Documentation", "Contact"].flatMap((t, i) => [...(i ? [carre(k, OR_P, "5px")] : []), lien(k, t, "/contact", { taille: 16, poids: "500", couleur: ENCRE_P, padH: "4px", survol: { color: OR_P, transform: { y: -2 } }, focus: BORDEAUX, extra: { textDecoration: "underline", textDecorationColor: "#7a5a1455", textUnderlineOffset: "6px" } })]);
    const ligneLiens = k.row(liens, { rowGap: "6px", columnGap: "16px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" });
    const abo = lettre(k, env, G, { titre: "", intro: "Détachez ce coupon : recevez nos avis par e-mail.", bouton: "S'abonner", largeur: "100%", accent: BORDEAUX, texte: ENCRE_P, surBouton: "#ffffff", fond: "#fffaf0", fondChamp: "#ffffff", rembChamp: "10px", focus: BORDEAUX, survolBouton: ENCRE_P, survolTexte: "#ffffff" });
    const coupon = k.col([caps(k, "Coupon — lettre d'information", { couleur: OR_P, suivi: "0.2em" }), abo], { alignItems: "flex-start", gap: "14px", flexGrow: 1.3, flexBasis: "0px", minWidth: "280px", borderStyle: "dashed", borderWidth: "2px", borderColor: BORDEAUX, borderRadius: "0px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: "#fffaf0", textAlign: "left" }, { paddingLeft: "16px", paddingRight: "16px" });
    const cartouche = k.col([caps(k, "Adresse", { couleur: OR_P, suivi: "0.2em" }), adresse], { alignItems: "flex-start", gap: "14px", flexGrow: 1, flexBasis: "0px", minWidth: "260px", borderStyle: "solid", borderWidth: "1px", borderColor: BORDEAUX, borderRadius: "0px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: "#fffaf0", textAlign: "left" }, { paddingLeft: "16px", paddingRight: "16px" });
    const pt = souffle(carre(k, BORDEAUX, "10px"), 3400);
    const bloc2 = k.row([cartouche, coupon], { gap: "20px", alignItems: "stretch", flexWrap: "wrap", width: "100%", justifyContent: "center" });
    const interieur = k.col([ligneLiens, k.row([pt, caps(k, "Services de paiement", { couleur: OR_P, suivi: "0.3em" })], { gap: "12px", alignItems: "center", justifyContent: "center" }), nom, filet, bloc2],
      { alignItems: "center", gap: "28px", borderStyle: "solid", borderWidth: "1px", borderColor: BORDEAUX, borderRadius: "0px", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "40px", backgroundColor: "#fffaf0", textAlign: "center" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "14px", paddingRight: "14px" });
    const cadre = k.col([interieur], { width: "100%", maxWidth: "1000px", borderStyle: "solid", borderWidth: "1px", borderColor: BORDEAUX, borderRadius: "0px", paddingTop: "7px", paddingBottom: "7px", paddingLeft: "7px", paddingRight: "7px", backgroundColor: "#fffaf0" });
    const corps = G.bande(k, [cadre], { fond: CREME_P, colonne: true, aligne: "center", padV: ["64px", "52px", "36px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "16px"], nom: "Feuille" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#6a4b52", liens: ENCRE_P })(k, env, true);
    const bas = G.bande(k, [mentions], { fond: CREME_P, colonne: true, padV: ["24px", "22px", "20px"], padB: ["24px", "22px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Fintech et paiement", target: 6, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : bandeau d'appel XXL, barre de règlement, deux rives, mosaïque de comptes, frise du virement, papier du trésorier.",
  models: [appelEncaissement, barreDeReglement, deuxRives, mosaiqueDeComptes, cheminDuVirement, papierDuTresorier],
};
