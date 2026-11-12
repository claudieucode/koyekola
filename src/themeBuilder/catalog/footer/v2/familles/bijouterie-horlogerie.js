// Famille v2 « Bijouterie et horlogerie » — 6 modèles (ft2-326 à ft2-331), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds de joailliers, bijoutiers et horlogers (marques FICTIVES). Compositions inspirées de trois captures de sites réels (colonne de marque + description + réseaux ; liste de grands mots légers ;
// grand titre + carte d'appel + nom monumental rogné), traduites à angles droits, autres couleurs, autre contenu. Aucune coordonnée, horaire ni chiffre inventé : adresse, téléphone et horaires viennent des
// Données de l'entreprise du site (sans données, les widgets restent sobres). Collections, ateliers et services sont des intitulés d'EXEMPLE à renommer dans l'éditeur ; adresses de réseaux = exemples.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage 2 à 10 px) ; UNE animation visible par modèle (carré qui respire, case qui se remplit, flèche qui glisse…).
// Pas d'animation d'entrée, pas de défilement continu.
const FAM = "bijouterie-horlogerie";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");
const DOUX = 360; // ms : durée des transitions de survol / focus
// ── Aides LOCALES à la famille (toutes à angles droits) ──
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
// deux valeurs de « gap » interdites sur k.row / k.col : converties en rowGap + columnGap
const gapOk = (st) => { if (st && typeof st.gap === "string" && /\s/.test(st.gap.trim())) { const { gap, ...r } = st; return { ...r, ...GK.gaps(gap) }; } return st; };
const sk = (k) => ({ ...k, row: (c, st, t, m) => k.row(c, gapOk(st), t, m), col: (c, st, t, m) => k.col(c, gapOk(st), t, m) });
const PH = ["48px", "32px", "20px"];
const reseauxT = (G, k, env, o) => G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", ...o })(k, env);
// ligne d'index : grand libellé, flèche, filet bas ; la ligne glisse au survol
const ligneIndex = (k, label, url, o) => lien(k, `${label}  →`, url, { taille: o.taille, poids: o.poids || "400", police: o.police, couleur: o.couleur, h: o.h || "88px", bloc: true, lh: 1, suivi: o.suivi, casse: o.casse, survol: { color: o.survolCouleur, transform: { x: 10 }, ...(o.survolFond ? { backgroundColor: o.survolFond } : {}) }, focus: o.focus, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet, justifyContent: "space-between", ...(o.extra || {}) } });

// ═══ ft2-326 « Flanc de la maison » — joaillerie (archétype A : colonne latérale pleine hauteur) ═══
// Idée (capture : liste de grands mots légers) : une colonne champagne pleine hauteur à gauche (nom de la maison, description, coordonnées, rendez-vous, réseaux) et, à droite sur noir,
// les quatre collections en très grands mots fins (2 x 2, sans cartes) suivis de deux colonnes de liens. Polices : Cormorant Garamond (titres) et Jost (texte).
const maison = identite({
  key: "c326", label: "Noir et champagne", humeur: "dark",
  fond: "#0e0d0c", texte: "#f3ece0", discret: "#b9b09f", accent: "#d9c08a", surface: "#1a1815", encre: "#0e0d0c", surEncre: "#f3ece0",
  police: "font.jost", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f3ece033",
});
const NOIR = "#0e0d0c", CHAMP = "#d9c08a", IVOIRE = "#f3ece0";
const flancMaison = modeleV2({
  id: identifiantV2(326, "flanc-de-la-maison"), concept: "c-326-flanc-de-la-maison", name: "Flanc de la maison", family: FAM,
  description: "Pour une joaillerie : colonne champagne pleine hauteur (nom, description, coordonnées, rendez-vous, réseaux) et, sur noir, quatre collections en très grands mots fins puis deux colonnes de liens.",
  tags: ["joaillerie", "bijouterie", "colonne latérale", "collections", "noir", "champagne", "angles droits"],
  identity: maison, racine: racineDe(NOIR),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const nom = k.T("<p>Maison<br>Aurèle</p>", { fontFamily: S.head, fontSize: "fluid:44-64", lineHeight: 0.95, fontWeight: "500", color: NOIR, textTransform: "none" });
    const desc = k.T("<p>Joaillerie de création : alliances, solitaires et pièces uniques, dessinées et montées à l'atelier.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#2a2418", fontFamily: S.font, maxWidth: "300px" });
    const rdv = souffle(bouton(k, "Prendre rendez-vous", "/contact", { texte: CHAMP, fond: NOIR, bord: NOIR, taille: 14, survol: { backgroundColor: "#ffffff", borderColor: NOIR, color: NOIR, transform: { y: -3 } }, focus: NOIR }), 4400);
    const lateral = k.col([k.col([nom, desc], { gap: "14px", alignItems: "flex-start", flexGrow: 1 }), k.col([coordonnees(k, { couleur: NOIR, lien: NOIR, survol: "#6b4e12", focus: NOIR }), rdv], { gap: "22px", alignItems: "flex-start", flexGrow: 2 }), reseauxT(G, k, env, { couleur: NOIR, survol: "#6b4e12", focus: NOIR })],
      { backgroundColor: CHAMP, flexGrow: 1, flexBasis: "320px", minWidth: "280px", gap: "26px", alignItems: "flex-start", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "44px", paddingRight: "40px", boxSizing: "border-box", borderRadius: "0px" }, { paddingTop: "56px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "44px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" });
    const mot = (t, u) => lien(k, t, u, { taille: 52, poids: "300", police: S.head, couleur: IVOIRE, h: "76px", lh: 1, suivi: "-0.01em", survol: { color: CHAMP, transform: { x: 10 } }, focus: CHAMP, extra: { flexGrow: 1, flexBasis: "260px", fontSize: "fluid:34-58" } });
    const mots = k.row([mot("Alliances", "/catalogue"), mot("Solitaires", "/catalogue"), mot("Colliers", "/catalogue"), mot("Bracelets", "/catalogue")], { gap: "6px 24px", alignItems: "stretch", width: "100%" });
    const liste = (titre, l) => G.colonne(k, [caps(k, titre, { couleur: CHAMP, suivi: "0.2em" }), ...l.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "400", couleur: IVOIRE, survol: { color: CHAMP, transform: { x: 4 } }, focus: CHAMP }))], { poids: 1, min: "180px", gap: "0px" });
    const cols = k.row([liste("La maison", [["Notre atelier", "/catalogue"], ["Sur mesure", "/catalogue"], ["Entretien et réparation", "/faq"], ["Contact", "/contact"]]), liste("Informations", [["Guide des tailles", "/faq"], ["Livraison", "/faq"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]])], { gap: "24px 48px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b9b09f", liens: IVOIRE, sansCookies: true })(k, env);
    const principal = k.col([caps(k, "Collections", { couleur: CHAMP, suivi: "0.24em" }), mots, cols, mentions],
      { flexGrow: 3, flexBasis: "440px", minWidth: "300px", gap: "30px", alignItems: "stretch", paddingTop: "72px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "48px", boxSizing: "border-box" }, { paddingTop: "56px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "44px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "32px" });
    const b = G.bande(k, [lateral, principal], { fond: NOIR, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Colonne et collections" });
    b.styles.desktop.color = IVOIRE;
    return [G.racine(k, [b])];
  },
}, FAM);

// ═══ ft2-327 « Lettres d'or » — haute joaillerie (archétype B : nom monumental, grand vide) ═══
// Idée (capture : marque monumentale) : presque rien, sauf un monogramme géant dans un cadre carré fin, le nom espacé, une phrase et trois liens, bordeaux et or rose.
// Polices : Italiana (nom) et Tenor Sans (texte).
const lettres = identite({
  key: "c327", label: "Bordeaux et or rose", humeur: "dark",
  fond: "#33101c", texte: "#f6e7dc", discret: "#d9b9a8", accent: "#e2b39a", surface: "#44192a", encre: "#33101c", surEncre: "#f6e7dc",
  police: "font.tenor-sans", titres: "font.italiana", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#f6e7dc33",
});
const BORD = "#33101c", ORROSE = "#e2b39a", PEAU = "#f6e7dc";
const lettresDOr = modeleV2({
  id: identifiantV2(327, "lettres-d-or"), concept: "c-327-lettres-d-or", name: "Lettres d'or", family: FAM,
  description: "Pour une maison de haute joaillerie : beaucoup de vide, un monogramme géant dans un cadre carré, le nom, une phrase et trois liens, bordeaux et or rose.",
  tags: ["haute joaillerie", "monogramme", "minimal", "bordeaux", "or rose", "angles droits"],
  identity: lettres, racine: racineDe(BORD),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const phrase = k.T("<p>Chaque pièce est unique, signée et accompagnée de son certificat.</p>", { fontFamily: S.font, fontSize: "fluid:18-26", lineHeight: 1.5, color: PEAU, maxWidth: "560px", textAlign: "center" });
    const l = (t, u) => lien(k, t, u, { taille: 15, poids: "400", casse: "uppercase", suivi: "0.22em", couleur: ORROSE, h: "48px", padH: "6px", survol: { color: "#ffffff", transform: { y: -3 } }, focus: ORROSE });
    const liens = k.row([l("Collections", "/catalogue"), l("Rendez-vous", "/contact"), l("Contact", "/contact")], { gap: "6px 40px", justifyContent: "center" });
    const trait1 = carre(k, ORROSE, "14px");
    souffle(trait1, 3600);
    const monogramme = k.col([k.T("<p>A</p>", { fontFamily: S.head, fontSize: "fluid:120-200", lineHeight: 1, fontWeight: "400", color: ORROSE, textAlign: "center" }), k.T("<p>Maison Aurèle</p>", { fontFamily: S.head, fontSize: "fluid:24-36", color: PEAU, textAlign: "center", letterSpacing: "0.3em", textTransform: "uppercase" }), trait1, phrase],
      { width: "100%", maxWidth: "760px", alignItems: "center", gap: "26px", paddingTop: "56px", paddingBottom: "48px", paddingLeft: "32px", paddingRight: "32px", borderStyle: "solid", borderWidth: "1px", borderColor: ORROSE, boxSizing: "border-box", borderRadius: "0px" }, undefined, { paddingTop: "36px", paddingBottom: "32px", paddingLeft: "16px", paddingRight: "16px" });
    const haut = G.bande(k, [k.col([liens, monogramme], { alignItems: "center", width: "100%", gap: "40px", flexGrow: 2 })], { fond: BORD, colonne: true, padV: ["96px", "72px", "52px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Monogramme" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d9b9a8", liens: PEAU, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: "#260b14", colonne: true, gap: "20px", padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = PEAU;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-328 « Mosaïque d'atelier » — bijoutier créateur (archétype H : mosaïque asymétrique) ═══
// Idée (capture : carte d'appel à droite du titre) : une grande case marine (titre, guide des pierres, bouton) à gauche ; à droite, deux cases moyennes (horaires, coordonnées) et une case large (lettre).
// Polices : Libre Caslon Display (titres) et Instrument Sans (texte).
const mosaique = identite({
  key: "c328", label: "Ivoire, marine et or", humeur: "light",
  fond: "#f6f1e7", texte: "#14233f", discret: "#4c5870", accent: "#9a6b12", surface: "#ece4d3", encre: "#14233f", surEncre: "#f6f1e7",
  police: "font.instrument-sans", titres: "font.libre-caslon-display", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#14233f33",
});
const IVO = "#f6f1e7", MARINE = "#14233f", OR = "#c9a45c";
const mosaiqueAtelier = modeleV2({
  id: identifiantV2(328, "mosaique-d-atelier"), concept: "c-328-mosaique-d-atelier", name: "Mosaïque d'atelier", family: FAM,
  description: "Pour un bijoutier créateur : une grande case marine (titre, guide des pierres, bouton) et trois cases (horaires, coordonnées, lettre) sur fond ivoire, angles droits, qui se soulèvent au survol.",
  tags: ["bijoutier créateur", "mosaïque", "guide des pierres", "marine", "ivoire", "horaires", "lettre d'information"],
  identity: mosaique, racine: racineDe(IVO),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const casePlein = (enfants, fond, o = {}) => { const c = k.col(enfants, { backgroundColor: fond, flexGrow: o.poids || 1, flexBasis: o.base || "260px", minWidth: "240px", gap: "16px", alignItems: "flex-start", paddingTop: "36px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", boxSizing: "border-box", transitionDuration: DOUX, borderRadius: "0px", justifyContent: o.just }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingTop: "28px", paddingBottom: "28px", paddingLeft: "20px", paddingRight: "20px" }); c.states = { hover: { transform: { y: -4 } } }; return c; };
    const titre = G.geant("<p>Le guide<br>des pierres.</p>", { taille: [44, 96], tablette: { taille: [56, 80] }, mobile: { taille: [44, 60] }, lh: 1, suivi: "-0.01em", poids: "400", police: S.head, couleur: IVO })(k, env);
    const intro = k.T("<p>Diamant, saphir, émeraude : comment choisir, comment entretenir. Un petit livret de l'atelier.</p>", { fontSize: "17px", lineHeight: 1.6, color: "#d6dbe6", fontFamily: S.font, maxWidth: "400px" });
    const b = souffle(bouton(k, "Lire le guide", "/faq", { texte: MARINE, fond: OR, bord: OR, survol: { backgroundColor: "#ffffff", borderColor: "#ffffff", transform: { y: -3 } }, focus: "#ffffff" }), 4200);
    const grande = casePlein([caps(k, "Atelier et conseils", { couleur: OR, suivi: "0.2em" }), titre, intro, b], MARINE, { poids: 5, base: "380px", just: "space-between" });
    const hor = casePlein([caps(k, "Horaires de la boutique", { couleur: "#6b4608" }), horaires(k, { couleur: MARINE })], "#e3d8c0", { base: "230px" });
    const con = casePlein([caps(k, "Nous trouver", { couleur: "#6b4608" }), coordonnees(k, { couleur: MARINE, lien: MARINE, survol: "#8a5d0c", focus: MARINE })], "#ffffff", { base: "230px" });
    const abo = abonnement(k, env, { titre: "La lettre de l'atelier", intro: "Nouvelles pièces et conseils d'entretien, quelques fois par an.", bouton: "Je m'abonne", largeur: "460px", accent: MARINE, texte: MARINE });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: MARINE };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: MARINE };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: IVO };
    abo.parts.button.states = { hover: { backgroundColor: "#ffffff", color: MARINE }, focus: GK.focus(MARINE) };
    const lettre = casePlein([abo], OR, { base: "100%" });
    const droite = k.col([k.row([hor, con], { gap: "10px", alignItems: "stretch", width: "100%", flexWrap: "wrap" }), lettre], { flexGrow: 7, flexBasis: "480px", minWidth: "280px", gap: "10px", alignItems: "stretch" });
    const mosa = G.bande(k, [k.row([grande, droite], { gap: "10px", alignItems: "stretch", width: "100%" })], { fond: IVO, colonne: true, padV: ["64px", "52px", "40px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Mosaïque" });
    const nav = k.row(["Collections|/catalogue", "Sur mesure|/contact", "Entretien|/faq", "Livraison|/faq", "Contact|/contact"].map((x) => { const [t, u] = x.split("|"); return lien(k, t, u, { taille: 15, poids: "600", couleur: MARINE, survol: { color: "#8a5d0c", transform: { y: -2 } }, focus: MARINE, padH: "4px" }); }), { gap: "4px 28px" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4c5870", liens: MARINE, sansCookies: true })(k, env);
    const bas = G.bande(k, [nav, trait(k, "#14233f33"), mentions], { fond: IVO, colonne: true, gap: "18px", padV: ["24px", "20px", "16px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [mosa, bas])];
  },
}, FAM);

// ═══ ft2-329 « Papier du joaillier » — bijouterie de tradition (archétype J) ═══
// Idée (capture : logo, description, réseaux) : un pied comme un papier à lettres ; filets doubles, nom en italique centré, courte description, cartouche d'adresse centré, liens en une ligne centrée, réseaux.
// Polices : Cormorant (titres) et Spectral (texte).
const papier = identite({
  key: "c329", label: "Crème, encre et prune", humeur: "light",
  fond: "#fbf7ef", texte: "#2b2118", discret: "#5f5244", accent: "#7a2a3c", surface: "#f1e9da", encre: "#2b2118", surEncre: "#fbf7ef",
  police: "font.spectral", titres: "font.cormorant", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#2b211833",
});
const CREME = "#fbf7ef", ENCRE = "#2b2118", PRUNE = "#7a2a3c";
const papierJoaillier = modeleV2({
  id: identifiantV2(329, "papier-du-joaillier"), concept: "c-329-papier-du-joaillier", name: "Papier du joaillier", family: FAM,
  description: "Pour une bijouterie de tradition : un pied en papier à lettres, filets doubles, nom en italique centré, cartouche d'adresse centré, liens en une ligne centrée et réseaux. Crème, encre et prune.",
  tags: ["bijouterie", "tradition", "papier à en-tête", "centré", "filets doubles", "crème", "prune"],
  identity: papier, racine: racineDe(CREME),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const doubles = () => k.col([trait(k, ENCRE, "3px"), trait(k, ENCRE, "1px")], { gap: "4px", width: "100%" });
    const nom = k.T("<p><em>Joaillerie Verlaine</em></p>", { fontFamily: S.head, fontSize: "fluid:40-76", lineHeight: 1, fontWeight: "500", color: ENCRE, textAlign: "center" });
    const date = caps(k, "Bijoux et montres de collection", { couleur: PRUNE, suivi: "0.3em", extra: { textAlign: "center" } });
    const desc = k.T("<p>Bijoux anciens, alliances et montres de collection, expertisés et vendus depuis la même boutique.</p>", { fontSize: "17px", lineHeight: 1.7, color: "#4a3e31", fontFamily: S.font, maxWidth: "520px", textAlign: "center" });
    const adresse = coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: PRUNE, focus: PRUNE, taille: 15 });
    const cartouche = k.col([caps(k, "Adresse de la boutique", { couleur: PRUNE, extra: { textAlign: "center" } }), adresse], { alignItems: "center", gap: "10px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "40px", paddingRight: "40px", borderStyle: "solid", borderWidth: "1px", borderColor: ENCRE, backgroundColor: "#f1e9da", boxSizing: "border-box", maxWidth: "100%", borderRadius: "0px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    cartouche.styles.desktop.textAlign = "center";
    const l = (t, u) => lien(k, t, u, { taille: 16, poids: "500", couleur: ENCRE, padH: "10px", survol: { color: PRUNE, textDecoration: "underline" }, focus: PRUNE });
    const liens = k.row([l("Bijoux", "/catalogue"), l("Alliances", "/catalogue"), l("Montres", "/catalogue"), l("Expertise", "/catalogue"), l("Contact", "/contact")], { gap: "0px 14px", justifyContent: "center" });
    souffle(liens, 5200);
    const rs = reseauxT(G, k, env, { couleur: PRUNE, survol: ENCRE, focus: PRUNE, symbole: "→" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#5f5244", liens: ENCRE, sansCookies: true })(k, env, true);
    const corps = G.bande(k, [doubles(), k.col([k.col([date, nom], { alignItems: "center", gap: "14px", flexGrow: 1 }), k.col([k.col([desc, cartouche], { alignItems: "center", gap: "22px", flexGrow: 2 }), k.col([liens, rs], { alignItems: "center", gap: "16px", flexGrow: 4 })], { alignItems: "center", gap: "22px", width: "100%" })], { alignItems: "center", gap: "22px", width: "100%", paddingTop: "28px", paddingBottom: "28px" }), doubles(), mentions], { fond: CREME, colonne: true, gap: "20px", padV: ["72px", "56px", "44px"], padB: ["28px", "24px", "22px"], padH: PH, nom: "En-tête" });
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═══ ft2-330 « Barre de cadran » — horlogerie (archétype D : barre unique) ═══
// Idée (capture : barre basse avec séparateur vertical) : tout sur deux lignes très compactes sur gris acier : nom, liens sur une seule ligne séparés par de petits carrés, bouton « Entretien » ; réseaux et mentions dessous.
// Polices : Barlow Condensed (titres) et IBM Plex Sans (texte).
const cadran = identite({
  key: "c330", label: "Acier et turquoise", humeur: "dark",
  fond: "#12181c", texte: "#e7eef0", discret: "#9fb0b6", accent: "#4fd1c0", surface: "#1b252b", encre: "#12181c", surEncre: "#e7eef0",
  police: "font.ibm-plex-sans", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#e7eef033",
});
const ACIER = "#12181c", TURQ = "#4fd1c0", GLACE = "#e7eef0";
const barreCadran = modeleV2({
  id: identifiantV2(330, "barre-de-cadran"), concept: "c-330-barre-de-cadran", name: "Barre de cadran", family: FAM,
  description: "Pour un horloger : un pied compact en deux lignes sur gris acier, nom en capitales condensées, liens séparés par de petits carrés, bouton d'entretien turquoise, réseaux et mentions.",
  tags: ["horlogerie", "horloger", "barre compacte", "acier", "turquoise", "entretien", "angles droits"],
  identity: cadran, racine: racineDe(ACIER),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const marque = k.row([souffle(carre(k, TURQ, "12px"), 2600), k.T("<p>Atelier Cadran</p>", { fontFamily: S.head, fontSize: "30px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", color: GLACE, lineHeight: 1 })], { gap: "12px", flexWrap: "nowrap" });
    const sep = () => carre(k, "#4a5c64", "5px");
    const items = [["Montres", "/catalogue"], ["Révision", "/catalogue"], ["Pièces anciennes", "/catalogue"], ["Atelier", "/catalogue"], ["Contact", "/contact"]];
    const nav = []; items.forEach(([t, u], i) => { if (i) nav.push(sep()); nav.push(lien(k, t, u, { taille: 16, poids: "500", couleur: GLACE, padH: "4px", survol: { color: TURQ, transform: { y: -2 } }, focus: TURQ })); });
    const liens = k.row(nav, { gap: "0px 14px", justifyContent: "center", flexGrow: 1 });
    const b = bouton(k, "Demander un entretien", "/contact", { texte: ACIER, fond: TURQ, bord: TURQ, taille: 14, h: "48px", survol: { backgroundColor: GLACE, borderColor: GLACE, transform: { y: -3 } }, focus: GLACE });
    const ligne1 = G.bande(k, [k.row([marque, b], { justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "16px 32px" }), liens], { fond: ACIER, colonne: true, gap: "22px", aligne: "stretch", padV: ["34px", "30px", "28px"], padB: ["30px", "26px", "22px"], padH: PH, nom: "Barre" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#9fb0b6", liens: GLACE, sansCookies: true })(k, env);
    const rs = reseauxT(G, k, env, { couleur: GLACE, survol: TURQ, focus: TURQ, taille: 14 });
    const ligne2 = G.bande(k, [k.row([caps(k, "Horlogerie de précision", { couleur: TURQ, suivi: "0.24em" }), rs], { justifyContent: "space-between", gap: "8px 32px", width: "100%" }), mentions], { fond: "#0b1013", colonne: true, gap: "16px", padV: ["22px", "20px", "18px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    ligne2.styles.desktop.color = GLACE;
    return [G.racine(k, [ligne1, ligne2])];
  },
}, FAM);

// ═══ ft2-331 « Fiche de calibre » — horlogerie d'art (archétype K : fenêtre / console) ═══
// Idée (capture : colonnes + cartes sur fond sombre) : le pied est une FENÊTRE d'interface à angles droits : barre de titre verte avec trois carrés, colonne de « commandes » (liens) à gauche en police mono, panneau de droite
// avec coordonnées, horaires et lettre sous forme de champs. Fond papier gris. Polices : IBM Plex Mono (titres) et IBM Plex Sans (texte).
const fiche = identite({
  key: "c331", label: "Papier gris et vert sapin", humeur: "light",
  fond: "#e6e5df", texte: "#17211b", discret: "#4b564f", accent: "#1f5a3b", surface: "#ffffff", encre: "#17211b", surEncre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#17211b33",
});
const PAPIER = "#e6e5df", SAPIN = "#1f5a3b", NOIR2 = "#17211b";
const ficheCalibre = modeleV2({
  id: identifiantV2(331, "fiche-de-calibre"), concept: "c-331-fiche-de-calibre", name: "Fiche de calibre", family: FAM,
  description: "Pour une horlogerie d'art : le pied est une fenêtre à angles droits, barre de titre verte à trois carrés, commandes en police mono à gauche, coordonnées, horaires et lettre à droite.",
  tags: ["horlogerie d'art", "fenêtre", "console", "mono", "vert sapin", "papier gris", "horaires", "lettre d'information"],
  identity: fiche, racine: racineDe(PAPIER),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S;
    const titre = k.row([carre(k, "#9fd3b3", "12px"), carre(k, "#9fd3b3", "12px"), souffle(carre(k, "#ffffff", "12px"), 2800), k.T("<p>calibre/fiche.txt — Manufacture Lorient</p>", { fontFamily: S.head, fontSize: "13px", color: "#ffffff", marginLeft: "8px" })], { gap: "8px", flexWrap: "wrap", backgroundColor: SAPIN, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", width: "100%", boxSizing: "border-box", borderRadius: "0px" });
    const cmd = (t, u) => lien(k, `> ${t}`, u, { taille: 16, police: S.head, poids: "500", couleur: NOIR2, h: "46px", bloc: true, survol: { color: "#ffffff", backgroundColor: SAPIN, transform: { x: 6 } }, focus: SAPIN, padH: "10px", extra: { width: "100%", boxSizing: "border-box" } });
    const commandes = k.col([k.col([caps(k, "Commandes", { couleur: SAPIN, police: S.head, suivi: "0.1em" })], { flexGrow: 1 }), cmd("montres", "/catalogue"), cmd("calibres", "/catalogue"), cmd("révision", "/catalogue"), cmd("manufacture", "/catalogue"), cmd("contact", "/contact")], { flexGrow: 1, flexBasis: "220px", minWidth: "200px", gap: "2px", alignItems: "stretch", paddingTop: "24px", paddingBottom: "28px", paddingLeft: "24px", paddingRight: "20px", boxSizing: "border-box", backgroundColor: "#f4f3ee", borderRadius: "0px" });
    const abo = abonnement(k, env, { titre: "› lettre", intro: "Une fiche de calibre par trimestre, sans autre message.", bouton: "Envoyer", largeur: "420px", accent: SAPIN, texte: NOIR2, fondChamp: "#ffffff", policeChamp: S.head, tailleChamp: "15px" });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: SAPIN, fontFamily: S.head };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#3a453e" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#ffffff" };
    abo.parts.button.states = { hover: { backgroundColor: NOIR2, color: "#ffffff" }, focus: GK.focus(NOIR2) };
    const cap2 = (t) => caps(k, t, { couleur: SAPIN, police: S.head, suivi: "0.1em" });
    const droite = k.col([cap2("› adresse"), coordonnees(k, { couleur: NOIR2, lien: NOIR2, survol: SAPIN, focus: SAPIN }), cap2("› horaires"), horaires(k, { couleur: NOIR2 }), trait(k, "#17211b33"), abo], { flexGrow: 3, flexBasis: "420px", minWidth: "280px", gap: "14px", alignItems: "stretch", paddingTop: "24px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "28px", boxSizing: "border-box", backgroundColor: "#ffffff", borderRadius: "0px" }, { paddingLeft: "24px" }, { paddingLeft: "20px", paddingRight: "20px" });
    const corps = k.row([commandes, droite], { gap: "0px", alignItems: "stretch", width: "100%", flexWrap: "wrap" });
    const fenetre = k.col([titre, corps], { gap: "0px", alignItems: "stretch", width: "100%", borderStyle: "solid", borderWidth: "2px", borderColor: SAPIN, boxSizing: "border-box", backgroundColor: "#ffffff", borderRadius: "0px" });
    const haut = G.bande(k, [fenetre], { fond: PAPIER, colonne: true, padV: ["64px", "52px", "40px"], padB: ["36px", "32px", "28px"], padH: PH, nom: "Fenêtre" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4b564f", liens: NOIR2, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: PAPIER, colonne: true, padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Bijouterie et horlogerie", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : joaillerie, haute joaillerie, bijoutier créateur, bijouterie de tradition, horloger, horlogerie d'art.",
  models: [flancMaison, lettresDOr, mosaiqueAtelier, papierJoaillier, barreCadran, ficheCalibre],
};
