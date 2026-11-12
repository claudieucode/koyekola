// Famille v2 « Engins et matériel professionnel » — 6 modèles (ft2-266 à ft2-271), pieds « inspirés de captures » : ANGLES DROITS partout, standard et très professionnels, marques fictives, aucun chiffre ni coordonnée inventés.
// Gammes et services = EXEMPLES modifiables dans l'éditeur. MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, un carré qui respire ou une case qui se soulève par modèle. Pas d'animation d'entrée, pas de défilement continu.
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
const FAM = "engins-materiel";
const PAGE_LARGEUR = { padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"] };
const mentionsBande = (k, env, G, fond, couleur, liens, o = {}) => G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur, liens })(k, env)], { fond, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions", ...o });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-266 « Nom de chantier » — vendeur d'engins de chantier — archétype B : NOM MONUMENTAL seul, très peu de liens, grand vide
// Idée (capture : logo et nom géants sur noir) : sur noir de fonte, le nom du site occupe toute la largeur en capitales condensées blanches, sous une barre jaune épaisse ; au-dessus, une seule ligne de cinq liens et un carré jaune qui respire.
// Rien d'autre : pas de colonnes, pas de lettre. Le nom grandit avec l'écran (jamais de débordement). Polices : Saira Extra Condensed (nom) et Golos Text.
const chantier = identite({
  key: "c266", label: "Noir de fonte et jaune de chantier", humeur: "dark",
  fond: "#0b0b0b", texte: "#f4f1e6", discret: "#b7b3a6", accent: "#f2c230", surface: "#171717", encre: "#0b0b0b",
  police: "font.golos-text", titres: "font.saira-extra-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f4f1e633",
});
const JAUNE = "#f2c230", NOIR_FONTE = "#0b0b0b";

const nomDeChantier = modeleV2({
  id: identifiantV2(266, "nom-de-chantier"), concept: "c-266-nom-de-chantier",
  name: "Nom de chantier", family: FAM,
  description: "Pour un vendeur d'engins : sur noir de fonte, le nom du site en capitales condensées sur toute la largeur sous une barre jaune, une seule ligne de liens au-dessus et un carré jaune qui respire. Grand vide, aucun bruit.",
  tags: ["engins", "chantier", "nom monumental", "noir", "jaune", "capitales", "angles droits", "minimal"],
  identity: chantier,
  racine: racineDe(NOIR_FONTE),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const repere = G.ligne(k, [souffle(carre(k, JAUNE, "14px"), 3000), caps(k, "Engins et matériel de chantier", { couleur: JAUNE, suivi: "0.26em" })], { gap: "12px", justifie: "flex-start" });
    const liens = ["Terrassement", "Levage", "Camions", "Location", "Service"].map((t) => lien(k, t, "/contact", { taille: 16, poids: "600", casse: "uppercase", suivi: "0.1em", couleur: S.fg, padH: "4px", survol: { color: JAUNE, transform: { y: -3 } }, focus: JAUNE }));
    const tete = G.ligne(k, [repere, k.row(liens, { columnGap: "28px", rowGap: "0px", alignItems: "center", flexWrap: "wrap" })], { rowGap: "12px", columnGap: "48px", justifie: "space-between", largeur: "100%" });
    const nom = nomDuSite(k, env, 120, "#ffffff", { fontWeight: "800", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 0.86, fontSize: "fluid:60-200", overflowWrap: "anywhere", transitionDuration: DOUX });
    nom.parts.link.states = { hover: { color: JAUNE }, focus: GK.focus(JAUNE) };
    const barre = k.col([], { width: "100%", height: "16px", backgroundColor: JAUNE, borderRadius: "0px" });
    const offre = lien(k, "Demander une offre", "/contact", { taille: 18, poids: "700", couleur: NOIR_FONTE, h: "56px", padH: "24px", survol: { backgroundColor: "#ffffff", color: NOIR_FONTE, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: JAUNE, borderStyle: "solid", borderWidth: "2px", borderColor: JAUNE } });
    const phrase = k.T("<p>Du matériel solide, des équipes qui répondent.</p>", { fontSize: "20px", lineHeight: 1.5, color: S.mute, fontFamily: S.font, maxWidth: "460px" });
    const monument = k.col([barre, nom, G.ligne(k, [phrase, offre], { justifie: "space-between", largeur: "100%", gap: "16px 40px" })], { gap: "26px", width: "100%" });
    const corps = G.bande(k, [tete, monument], { fond: NOIR_FONTE, colonne: true, gap: "96px", padV: ["72px", "56px", "40px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "40px" }, nom: "Monument" });
    return [G.racine(k, [corps, mentionsBande(k, env, G, NOIR_FONTE, "#b7b3a6", "#f4f1e6", { filetHaut: { epaisseur: "1px", couleur: "#f4f1e633" } })])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-267 « Parc de machines » — concessionnaire de machines — archétype C : DAMIER de 6 cases égales, chaque case est un lien ou une information
// Idée : un parc rangé en cases carrées bord à bord sur béton clair : quatre gammes (cobalt, blanc, noir), les horaires et le nom ; coordonnées et lettre d'information dans la bande basse. Au survol, une case se soulève de 8 px.
// Les gammes sont des EXEMPLES sans modèle ni prix. Polices : Chakra Petch (titres) et IBM Plex Sans Condensed. Mobile : une case par ligne.
const parc = identite({
  key: "c267", label: "Béton clair, cobalt et noir", humeur: "light",
  fond: "#dcdcd6", texte: "#14161a", discret: "#4a4d55", accent: "#1f4fd8", surface: "#ffffff", encre: "#14161a",
  police: "font.ibm-plex-sans-condensed", titres: "font.chakra-petch",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#14161a33",
});
const COBALT = "#1f4fd8", ENCRE_B = "#14161a", BETON = "#dcdcd6";

const parcDeMachines = modeleV2({
  id: identifiantV2(267, "parc-de-machines"), concept: "c-267-parc-de-machines",
  name: "Parc de machines", family: FAM,
  description: "Pour un concessionnaire de machines : un damier de six cases carrées bord à bord sur béton clair (trois gammes, horaires, nom), puis une bande avec coordonnées et lettre d'information. Chaque case est un lien ou une information.",
  tags: ["machines", "concession", "damier", "cases", "béton", "cobalt", "angles droits", "lettre d'information"],
  identity: parc,
  racine: racineDe(BETON),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const base = { flexGrow: 1, flexBasis: "0px", minWidth: "250px", minHeight: "250px", justifyContent: "space-between", gap: "14px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", borderStyle: "solid", borderWidth: "0px", borderRadius: "0px", transitionDuration: DOUX };
    const case_ = (fond, enfants, lever = true) => { const c = k.col(enfants, { ...base, backgroundColor: fond }, undefined, { minHeight: "150px" }); if (lever) c.states = { hover: { transform: { y: -8 } } }; return c; };
    const gamme = (num, t, fond, texte) => case_(fond, [carre(k, texte, "12px"), lien(k, t, "/contact", { taille: 30, poids: "700", police: S.head, couleur: texte, bloc: true, h: "44px", lh: 1.05, survol: { color: texte, transform: { x: 8 } }, focus: texte, extra: { textDecoration: "underline", textDecorationThickness: "2px", textUnderlineOffset: "6px" } })]);
    const pt = souffle(carre(k, "#ffffff", "10px"), 3000);
    const caseHeures = case_(ENCRE_B, [k.row([caps(k, "Horaires", { couleur: "#ffffff" }), pt], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 16, couleur: "#ffffff" })], false);
    const nom = nomDuSite(k, env, 28, "#ffffff", { fontWeight: "700", textTransform: "uppercase" });
    const caseNom = case_(COBALT, [nom, k.T("<p>Gammes données en exemple, sans modèle ni prix : à adapter dans l'éditeur.</p>", { fontSize: "14px", lineHeight: 1.5, color: "#ffffff", fontFamily: S.font })], false);
    const damier = k.col([
      rangeeDe(k, [gamme("A", "Terrassement", COBALT, "#ffffff"), gamme("B", "Levage", "#ffffff", ENCRE_B), gamme("C", "Camions", ENCRE_B, "#ffffff")]),
      rangeeDe(k, [gamme("D", "Chariots et compacts", "#ffffff", ENCRE_B), caseHeures, caseNom]),
    ], { gap: "0px", width: "100%" });
    // 6 cases (deux rangées de 3) ; coordonnées et lettre d'information sont portées par la bande basse
    const colCoord = k.col([caps(k, "Coordonnées", { couleur: COBALT }), coordonnees(k, { taille: 16, couleur: ENCRE_B, lien: COBALT, survol: ENCRE_B, focus: COBALT })], { gap: "10px", minWidth: "260px", flexGrow: 1, flexBasis: "0px" });
    const colLettre = k.col([caps(k, "Lettre du parc", { couleur: COBALT }), lettre(k, env, G, { titre: "", intro: "Arrivages et nouveautés, sans bruit.", bouton: "S'abonner", largeur: "100%", accent: COBALT, texte: ENCRE_B, surBouton: "#ffffff", fond: BETON, fondChamp: "#ffffff", rembChamp: "10px", focus: ENCRE_B, survolBouton: ENCRE_B, survolTexte: "#ffffff" })], { gap: "10px", minWidth: "260px", flexGrow: 1.4, flexBasis: "0px" });
    const bas = G.bande(k, [k.row([colCoord, colLettre], { rowGap: "24px", columnGap: "56px", width: "100%", alignItems: "flex-start", flexWrap: "wrap" }), trait(k, "#14161a33"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3b3e46", liens: ENCRE_B })(k, env)], { fond: BETON, colonne: true, gap: "24px", padV: ["40px", "32px", "28px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Pied" });
    return [G.racine(k, [G.bande(k, [damier], { fond: ENCRE_B, colonne: true, max: "100%", ...PAGE_LARGEUR, aligne: "stretch", nom: "Pleine largeur" }), bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-268 « Console de flotte » — gestionnaire de parc d'engins connectés — archétype K : FENÊTRE DE CONSOLE (le pied ressemble à un bloc d'interface)
// Idée : un cadre de terminal bleu nuit, barre de titre à trois carrés, commandes en cyan (« $ ls gammes », « $ cat horaires », « $ subscribe ») dont les résultats sont de vrais liens, les horaires, les coordonnées et la lettre
// d'information ; barre d'état en bas avec les mentions. Un carré curseur respire. Texte mono. Polices : Overpass Mono. Mobile : les volets s'empilent.
const console_ = identite({
  key: "c268", label: "Bleu nuit, cyan et gris de console", humeur: "dark",
  fond: "#08111d", texte: "#d6e4f5", discret: "#93a9c6", accent: "#4cc9f0", surface: "#0f1b2d", encre: "#08111d",
  police: "font.overpass-mono", titres: "font.overpass-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#d6e4f533",
});
const NUIT = "#08111d", FENETRE = "#0f1b2d", CYAN = "#4cc9f0", BARRE = "#16263d";

const consoleDeFlotte = modeleV2({
  id: identifiantV2(268, "console-de-flotte"), concept: "c-268-console-de-flotte",
  name: "Console de flotte", family: FAM,
  description: "Pour un gestionnaire de parc d'engins : le pied comme une fenêtre de terminal bleu nuit, commandes cyan, gammes en liens, horaires, coordonnées, lettre d'information en ligne de commande et barre d'état pour les mentions.",
  tags: ["flotte", "parc", "console", "terminal", "mono", "bleu nuit", "cyan", "angles droits"],
  identity: console_,
  racine: racineDe(NUIT),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cmd = (t) => k.T(`<p><span style="color:${CYAN}">$</span> ${t}</p>`, { fontSize: "15px", fontWeight: "700", color: S.fg, fontFamily: S.font, lineHeight: 1.4 });
    const titre = k.row([carre(k, "#d6e4f5", "10px"), carre(k, "#93a9c6", "10px"), souffle(carre(k, CYAN, "10px"), 2800), k.T("<p>flotte — pied de page</p>", { fontSize: "13px", color: S.mute, fontFamily: S.font, marginLeft: "12px" })], { gap: "8px", alignItems: "center", backgroundColor: BARRE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", width: "100%" });
    const gammes = ["Terrassement", "Levage", "Camions", "Compacts", "Location", "Service"].map((t) => lien(k, `> ${t}`, "/contact", { taille: 16, poids: "600", couleur: S.fg, bloc: true, h: "44px", survol: { color: CYAN, transform: { x: 8 } }, focus: CYAN, extra: { width: "100%" } }));
    const nom = nomDuSite(k, env, 26, "#ffffff", { fontWeight: "700" });
    const colG = k.col([cmd("whoami"), nom, cmd("ls gammes"), ...gammes], { flexGrow: 1, flexBasis: "0px", minWidth: "260px", gap: "8px" });
    const colD = k.col([cmd("cat horaires"), horaires(k, { taille: 15, couleur: S.fg }), cmd("cat contact"), coordonnees(k, { taille: 15, couleur: S.fg, lien: CYAN, survol: "#ffffff", focus: CYAN })], { flexGrow: 1, flexBasis: "0px", minWidth: "260px", gap: "14px" });
    const abo = lettre(k, env, G, { titre: "", intro: "Nouvelles gammes et alertes du parc, par e-mail.", bouton: "Valider", largeur: "560px", accent: CYAN, texte: S.fg, surBouton: NUIT, fond: FENETRE, fondChamp: NUIT, rembChamp: "12px", focus: CYAN, survolBouton: "#ffffff", survolTexte: NUIT });
    const lignes = k.row([colG, colD], { rowGap: "32px", columnGap: "56px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const corps = k.col([lignes, trait(k, "#d6e4f533"), cmd("subscribe --email"), abo], { gap: "20px", backgroundColor: FENETRE, paddingTop: "32px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", width: "100%" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: "24px" });
    const etat = k.col([G.ligneLegale({ taille: 13, sansCookies: true, couleur: S.mute, liens: S.fg })(k, env)], { backgroundColor: BARRE, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "32px", paddingRight: "32px", width: "100%" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const fenetre = k.col([titre, corps, etat], { gap: "0px", width: "100%", maxWidth: "1100px", borderStyle: "solid", borderWidth: "1px", borderColor: "#d6e4f544", borderRadius: "0px" });
    return [G.racine(k, [G.bande(k, [fenetre], { fond: NUIT, colonne: true, aligne: "center", padV: ["64px", "48px", "32px"], padB: ["40px", "32px", "24px"], padH: ["48px", "32px", "16px"], nom: "Fenêtre" })])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-269 « Barre d'atelier » — atelier de pièces et de maintenance — archétype A : COLONNE LATÉRALE pleine hauteur (à DROITE) + zone principale
// Idée : à droite une haute barre orange sécurité (nom, bouton noir « Demander un devis », horaires, coordonnées) ; à gauche, la zone claire avec un grand titre condensé et trois listes en rangées à filet
// (machines, pièces et service, entreprise) qui glissent au survol. Un carré noir respire dans la barre. Polices : Rajdhani (titres) et Instrument Sans. Mobile : la barre passe sous la zone principale.
const atelier = identite({
  key: "c269", label: "Blanc cassé, orange sécurité et noir", humeur: "light",
  fond: "#f7f5f0", texte: "#15130f", discret: "#575248", accent: "#c24a00", surface: "#ffffff", encre: "#15130f",
  police: "font.instrument-sans", titres: "font.rajdhani",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#15130f33",
});
const ORANGE = "#ff6a00", ENCRE_O = "#15130f", PAPIER_O = "#f7f5f0";

const barreAtelier = modeleV2({
  id: identifiantV2(269, "barre-d-atelier"), concept: "c-269-barre-d-atelier",
  name: "Barre d'atelier", family: FAM,
  description: "Pour un atelier de pièces et de maintenance : une haute barre orange sécurité à droite (nom, devis, horaires, coordonnées) et, à gauche, un grand titre condensé avec trois listes en rangées à filet qui glissent au survol.",
  tags: ["atelier", "maintenance", "pièces", "barre latérale", "orange", "blanc cassé", "angles droits", "horaires"],
  identity: atelier,
  racine: racineDe(PAPIER_O),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Pièces, entretien, dépannage.</p>", { fontSize: "fluid:44-104", lineHeight: 0.95, fontWeight: "700", fontFamily: S.head, color: ENCRE_O, textTransform: "uppercase", maxWidth: "820px", overflowWrap: "anywhere" });
    const liste = (t, items) => k.col([caps(k, t, { couleur: "#8a3200", suivi: "0.22em" }), ...items.map((x) => rangee(k, x, "/contact", { couleur: ENCRE_O, police: S.head, taille: 22, poids: "600", h: "52px", padH: "4px", fondSurvol: "#ffffff", couleurSurvol: "#8a3200", focus: ENCRE_O, ligne: "#15130f55" }))], { flexGrow: 1, flexBasis: "0px", minWidth: "210px", gap: "6px" });
    const listes = k.row([liste("Machines", ["Pelles", "Chargeuses", "Compacteurs", "Nacelles"]), liste("Pièces et service", ["Pièces d'origine", "Entretien", "Dépannage", "Garantie"]), liste("Entreprise", ["À propos", "Recrutement", "Partenaires", "Contact"])], { rowGap: "32px", columnGap: "40px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#575248", liens: ENCRE_O })(k, env);
    const principal = panneau(k, [titre, listes, trait(k, "#15130f33"), mentions], { fond: PAPIER_O, poids: 1, min: "340px", gap: "40px", padV: ["72px", "52px", "40px"], padH: ["64px", "40px", "20px"] });
    const nom = nomDuSite(k, env, 44, ENCRE_O, { fontWeight: "700", textTransform: "uppercase", lineHeight: 1 });
    const devis = lien(k, "Demander un devis", "/contact", { taille: 18, poids: "800", couleur: "#ffffff", casse: "uppercase", suivi: "0.06em", h: "60px", padH: "28px", survol: { backgroundColor: "#ffffff", color: ENCRE_O, transform: { y: -3 } }, focus: ENCRE_O, extra: { backgroundColor: ENCRE_O, borderStyle: "solid", borderWidth: "2px", borderColor: ENCRE_O } });
    const pt = souffle(carre(k, ENCRE_O, "12px"), 3000);
    const barre = panneau(k, [pt, nom, k.T("<p>Un atelier à votre service pour garder les machines au travail.</p>", { fontSize: "17px", lineHeight: 1.5, color: ENCRE_O, fontFamily: S.font }), devis, trait(k, ENCRE_O, "2px"), caps(k, "Horaires", { couleur: ENCRE_O }), horaires(k, { taille: 15, couleur: ENCRE_O }), caps(k, "Coordonnées", { couleur: ENCRE_O }), coordonnees(k, { taille: 15, couleur: ENCRE_O, lien: ENCRE_O, survol: "#ffffff", focus: ENCRE_O })],
      { fond: ORANGE, poids: 0, base: "360px", min: "300px", gap: "18px", padV: ["72px", "52px", "40px"], padH: ["40px", "32px", "20px"], extra: { flexShrink: 0 } });
    return [G.racine(k, [G.bande(k, [rangeeDe(k, [principal, barre])], { fond: PAPIER_O, colonne: true, max: "100%", ...PAGE_LARGEUR, aligne: "stretch", nom: "Pleine largeur" })])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-270 « Escalier de location » — loueur de matériel — archétype L : PIED EN ESCALIER (bandes de largeurs décroissantes alignées à gauche)
// Idée : quatre marches de rouille sur crème, alignées à gauche : la plus large porte le nom, la suivante les gammes en une ligne, la troisième les horaires et les coordonnées, la plus étroite l'appel « Demander une offre » ;
// un carré clair respire sur la dernière marche. Mentions sur la crème, en dessous. Polices : Archivo Black (nom) et Archivo Narrow. Mobile : les marches deviennent pleine largeur.
const escalier = identite({
  key: "c270", label: "Crème, rouille et brun de chantier", humeur: "light",
  fond: "#f6ead9", texte: "#2a130b", discret: "#6b4a3a", accent: "#b83a17", surface: "#fff8ec", encre: "#2a130b",
  police: "font.archivo-narrow", titres: "font.archivo-black",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2a130b33",
});
const CREME_E = "#f6ead9", MARCHE1 = "#5e1b0d", MARCHE2 = "#872611", MARCHE3 = "#a82f14", MARCHE4 = "#f2a56b", ENCRE_E = "#2a130b";

const escalierDeLocation = modeleV2({
  id: identifiantV2(270, "escalier-de-location"), concept: "c-270-escalier-de-location",
  name: "Escalier de location", family: FAM,
  description: "Pour un loueur de matériel : quatre marches rouille alignées à gauche et de plus en plus étroites (nom, gammes en une ligne, horaires et coordonnées, appel à demander une offre), sur fond crème.",
  tags: ["location", "matériel", "escalier", "bandes décroissantes", "rouille", "crème", "angles droits", "horaires"],
  identity: escalier,
  racine: racineDe(CREME_E),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const marche = (largeurs, fond, enfants, o = {}) => k.col(enfants, { width: largeurs[0], backgroundColor: fond, gap: o.gap || "16px", paddingTop: o.padV || "36px", paddingBottom: o.padV || "36px", paddingLeft: "48px", paddingRight: "48px", borderRadius: "0px", boxSizing: "border-box", alignItems: "flex-start", ...(o.extra || {}) },
      { width: largeurs[1], paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "28px", paddingBottom: "28px" });
    const nom = nomDuSite(k, env, 56, "#ffffff", { fontWeight: "400", textTransform: "uppercase", lineHeight: 1 });
    const m1 = marche(["100%", "100%"], MARCHE1, [caps(k, "Location de matériel", { couleur: "#f2c9a8", suivi: "0.26em" }), nom, trait(k, "#f2c9a888", "2px")], { padV: "56px" });
    const gammes = ["Pelles", "Nacelles", "Compacteurs", "Groupes électrogènes", "Échafaudages"].map((t) => lien(k, t, "/contact", { taille: 19, poids: "700", couleur: "#ffffff", padH: "2px", survol: { color: "#f2a56b", transform: { y: -3 } }, focus: "#ffffff" }));
    const m2 = marche(["80%", "88%"], MARCHE2, [caps(k, "Les gammes", { couleur: "#f2c9a8" }), trait(k, "#f2c9a888", "2px"), k.col(gammes, { gap: "0px", alignItems: "flex-start" }), k.T("<p>Gammes données en exemple : à adapter dans l'éditeur.</p>", { fontSize: "14px", color: "#ffe9d6", fontFamily: S.font })]);
    const m3 = marche(["60%", "76%"], MARCHE3, [k.row([k.col([caps(k, "Horaires", { couleur: "#ffffff" }), horaires(k, { taille: 16, couleur: "#ffffff" })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "220px" }), k.col([caps(k, "Coordonnées", { couleur: "#ffffff" }), coordonnees(k, { taille: 16, couleur: "#ffffff", lien: "#ffffff", survol: "#f2c9a8", focus: "#ffffff" })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "220px" })], { rowGap: "20px", columnGap: "40px", width: "100%", alignItems: "flex-start", flexWrap: "wrap" })]);
    const offre = lien(k, "Demander une offre", "/contact", { taille: 20, poids: "700", police: S.head, couleur: ENCRE_E, h: "56px", padH: "4px", survol: { color: "#ffffff", transform: { x: 8 } }, focus: ENCRE_E, extra: { textDecoration: "underline", textDecorationThickness: "3px", textUnderlineOffset: "6px" } });
    const m4 = marche(["40%", "64%"], MARCHE4, [trait(k, ENCRE_E, "3px"), k.row([souffle(carre(k, ENCRE_E, "12px"), 3000), caps(k, "Votre chantier", { couleur: ENCRE_E })], { gap: "10px", alignItems: "center" }), offre], { padV: "28px", gap: "8px" });
    const marches = k.col([m1, m2, m3, m4], { gap: "0px", width: "100%", alignItems: "flex-start" });
    return [G.racine(k, [G.bande(k, [marches], { fond: CREME_E, colonne: true, max: "100%", ...PAGE_LARGEUR, aligne: "stretch", nom: "Marches" }), mentionsBande(k, env, G, CREME_E, "#6b4a3a", ENCRE_E)])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-271 « Index des gammes » — constructeur d'engins — archétype G : INDEX / SOMMAIRE en lignes pleine largeur (grand libellé, filet, mot d'action), sans cartes
// Idée : sur vert forêt, six lignes pleine largeur, chacune un énorme libellé de gamme en capitales hautes et étroites, un mot « Voir » à droite et un filet dessous ; au survol la ligne se remplit de jaune sable et glisse.
// Au-dessus, le nom et un repère ; dessous, coordonnées et réseaux en une seule ligne. Gammes en EXEMPLE. Polices : Alumni Sans (libellés) et Commissioner. Mobile : libellés réduits, une ligne par gamme.
const index = identite({
  key: "c271", label: "Vert forêt, os et jaune sable", humeur: "dark",
  fond: "#10281f", texte: "#ebe6d3", discret: "#b4bfae", accent: "#e8c547", surface: "#173629", encre: "#10281f",
  police: "font.commissioner", titres: "font.alumni-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#ebe6d33a",
});
const FORET = "#10281f", OS = "#ebe6d3", SABLE_Y = "#e8c547";

const indexDesGammes = modeleV2({
  id: identifiantV2(271, "index-des-gammes"), concept: "c-271-index-des-gammes",
  name: "Index des gammes", family: FAM,
  description: "Pour un constructeur d'engins : sur vert forêt, six lignes pleine largeur avec d'énormes libellés de gammes en capitales étroites, un mot d'action à droite et un filet ; au survol la ligne se remplit de jaune sable et glisse.",
  tags: ["constructeur", "engins", "index", "sommaire", "lignes", "vert forêt", "jaune sable", "angles droits"],
  identity: index,
  racine: racineDe(FORET),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, OS, { fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" });
    const haut = G.ligne(k, [nom, k.row([souffle(carre(k, SABLE_Y, "12px"), 3000), caps(k, "Index des gammes", { couleur: SABLE_Y, suivi: "0.26em" })], { gap: "10px", alignItems: "center" })], { justifie: "space-between", largeur: "100%", rowGap: "12px", columnGap: "32px" });
    const ligneDeGamme = (t) => {
      const n = lien(k, t, "/contact", { taille: 72, poids: "500", police: S.head, couleur: OS, bloc: true, h: "92px", lh: 1, casse: "uppercase", padH: "12px", survol: { backgroundColor: SABLE_Y, color: FORET, transform: { x: 10 } }, focus: SABLE_Y, extra: { width: "100%", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#ebe6d366", fontSize: "fluid:40-84" } });
      return n;
    };
    const gammes = k.col(["Terrassement", "Levage", "Transport", "Compacts", "Location", "Occasion"].map(ligneDeGamme), { gap: "0px", width: "100%" });
    const note = k.T("<p>Gammes données en exemple : à adapter dans l'éditeur.</p>", { fontSize: "14px", color: S.mute, fontFamily: S.font });
    const pied = G.ligne(k, [coordonnees(k, { taille: 15, couleur: OS, lien: OS, survol: SABLE_Y, focus: SABLE_Y }), G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", couleur: OS, survol: SABLE_Y, focus: SABLE_Y })(k, env)], { justifie: "space-between", aligne: "flex-start", largeur: "100%", gap: "24px 48px" });
    const corps = G.bande(k, [haut, gammes, note, pied], { fond: FORET, colonne: true, gap: "28px", padV: ["64px", "52px", "40px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "20px" }, nom: "Index" });
    return [G.racine(k, [corps, mentionsBande(k, env, G, FORET, "#b4bfae", OS, { filetHaut: { epaisseur: "1px", couleur: "#ebe6d333" } })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Engins et matériel professionnel", target: 6, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : nom monumental, damier de machines, console de flotte, barre d'atelier, escalier de location, index des gammes.",
  models: [nomDeChantier, parcDeMachines, consoleDeFlotte, barreAtelier, escalierDeLocation, indexDesGammes],
};
