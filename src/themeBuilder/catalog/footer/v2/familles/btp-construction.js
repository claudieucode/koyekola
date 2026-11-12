// Famille v2 « Construction et travaux publics » — 5 modèles (ft2-221 à ft2-225), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius), standard et très professionnel.
// Cinq ARCHÉTYPES de composition différents (DIVERSITE_STRICTE.md) : C damier de cases égales, E deux demi-pages opposées, F bandeau d'appel XXL + colonne de liens étroite, B nom monumental seul, J papier à en-tête.
// Pieds d'entreprise de maçonnerie, entreprise générale, travaux publics, rénovation, bureau d'études techniques. Contenu utile (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme,
// mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre, AUCUN numéro de contrat ni d'attestation inventé : les mentions d'assurance décennale sont du TEXTE générique à compléter dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions douces de 360 ms (fond, couleur, décalage, soulignement épais qui grandit, bouton qui s'inverse) ; au moins une animation visible par modèle
//   (carré de statut qui « respire », case qui s'éclaircit, rangée qui glisse, filet qui s'épaissit). Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu.
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
// liste de liens simples (colonne)
const listeLiens = (k, paires, o = {}) => paires.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, survol: o.survol || { color: k.S.accent, transform: { x: 6 } }, focus: o.focus }));
// rangée de tableau : numéro, lien, flèche ; fond et retrait qui changent au survol
function rangeeTableau(k, num, t, u, c) {
  const l = lien(k, t, u, { taille: c.taille || 18, poids: "600", police: c.police, couleur: c.texte, survol: { color: c.accent }, focus: c.accent, h: "52px", extra: { flexGrow: 1 } });
  const fl = k.T("<p>→</p>", { fontSize: "18px", color: c.accent, fontFamily: k.S.font, lineHeight: 1 });
  const r = k.row([caps(k, num, { couleur: c.accent, suivi: "0.16em", extra: { minWidth: "28px" } }), l, fl], { flexWrap: "nowrap", alignItems: "center", gap: "14px", width: "100%", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: c.filet, borderRadius: "0px", backgroundColor: c.fond, transitionDuration: DOUX });
  r.states = { hover: { backgroundColor: c.survolFond, paddingLeft: "14px" } };
  return r;
}
const FAM = "btp-construction";
const mono = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, { fontSize: o.taille || "13px", lineHeight: 1.5, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.head, fontWeight: o.poids || "500", ...(o.extra || {}) });
const DECENNALE = "Assurance décennale et responsabilité civile : attestations remises avec chaque devis, sur demande. Texte à compléter dans l'éditeur.";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-221 « Appareil de maçon » — maçonnerie — ARCHÉTYPE C (damier de cases égales)
// Idée : un MUR de huit cases égales (2 rangées de 4) séparées par un joint charbon de 4 px, comme un appareil de briques. Chaque case est un lien ou une information : le nom de l'entreprise, trois savoir-faire
// (fondations et gros œuvre, murs et enduits, pierre et rénovation), la case « devis » rouille, les coordonnées, les horaires (carré qui « respire ») et la mention d'assurance décennale (texte générique, aucun numéro).
// Au survol une case de lien s'éclaircit. Pas de lettre d'information. Polices : Roboto Slab (titres) et Work Sans. Mobile : une case par ligne.
const pierre = identite({
  key: "c221", label: "Pierre calcaire, charbon et rouille", humeur: "light",
  fond: "#e4d9c5", texte: "#2b2622", discret: "#5b5148", accent: "#973812", surface: "#f3ecdf", encre: "#2b2622",
  police: "font.work-sans", titres: "font.roboto-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "4px", ligne: "#2b262244",
});
const CHARBON = "#2b2622", PIERRE = "#e4d9c5", PIERRE_CL = "#f3ecdf", ROUILLE = "#973812";

const appareilDeMacon = modeleV2({
  id: identifiantV2(221, "appareil-de-macon"), concept: "c-221-appareil-de-macon",
  name: "Appareil de maçon", family: FAM,
  description: "Pour une entreprise de maçonnerie : un mur de huit cases égales à joints charbon (nom, trois savoir-faire, devis, coordonnées, horaires, mention décennale) dont les cases de liens s'éclaircissent au survol. Pierre, charbon et rouille.",
  tags: ["maçonnerie", "gros œuvre", "damier", "cases égales", "pierre", "charbon", "rouille", "angles droits"],
  identity: pierre,
  racine: racineDe(CHARBON),
  widgets: ["sitetitle", "text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cellule = (enfants, o = {}) => {
      const c = k.col(enfants, { flexGrow: 1, flexBasis: "0px", minWidth: "220px", minHeight: "200px", gap: "10px", justifyContent: o.centre ? "center" : "space-between", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: o.fond || PIERRE, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", minHeight: "0px" });
      if (o.survol) c.states = { hover: { backgroundColor: o.survol } };
      return c;
    };
    const savoir = (num, t, texte, u) => cellule([
      k.T(`<p>${num}</p>`, { fontSize: "16px", fontWeight: "700", color: ROUILLE, fontFamily: S.head }),
      lien(k, t, u, { taille: 26, poids: "700", police: S.head, couleur: CHARBON, lh: 1.15, h: "44px", survol: { color: ROUILLE, transform: { x: 6 } }, focus: ROUILLE }),
      k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font }),
    ], { survol: PIERRE_CL });
    const nom = nomDuSite(k, env, 28, "#ffffff");
    const cNom = cellule([nom, k.T("<p>Maçonnerie générale, gros œuvre et pierre.</p>", { fontSize: "16px", lineHeight: 1.5, color: "#ece5d8", fontFamily: S.font })], { fond: CHARBON });
    const devis = cellule([
      k.T("<p>Un projet de construction ou de rénovation ?</p>", { fontSize: "20px", fontWeight: "700", lineHeight: 1.25, color: "#ffffff", fontFamily: S.head }),
      lien(k, "Demander un devis", "/contact", { taille: 16, poids: "700", couleur: ROUILLE, h: "52px", padH: "22px", survol: { backgroundColor: CHARBON, color: "#ffffff", transform: { x: 6 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", justifyContent: "center", alignSelf: "flex-start" } }),
    ], { fond: ROUILLE });
    const cContact = cellule([coordonnees(k, { taille: 15, lien: CHARBON, survol: ROUILLE, focus: ROUILLE })], { fond: PIERRE_CL, centre: true });
    const pt = souffle(carre(k, ROUILLE, "10px"), 3000);
    const cHor = cellule([k.row([pt, k.T("<p>Horaires</p>", { fontSize: "16px", fontWeight: "700", color: CHARBON, fontFamily: S.head })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })], { fond: PIERRE_CL, centre: true });
    const cAss = cellule([k.T("<p>Garanties</p>", { fontSize: "16px", fontWeight: "700", color: CHARBON, fontFamily: S.head }), k.T(`<p>${DECENNALE}</p>`, { fontSize: "14px", lineHeight: 1.5, color: S.mute, fontFamily: S.font }), lien(k, "Questions fréquentes", "/faq", { taille: 15, poids: "700", couleur: ROUILLE, soulign: true, survol: { color: CHARBON, transform: { x: 6 } }, focus: CHARBON })], { fond: PIERRE_CL });
    const rang1 = k.row([cNom, savoir("01", "Fondations et gros œuvre", "Terrassement, soubassements, murs porteurs.", "/blog"), savoir("02", "Murs, cloisons et enduits", "Élévation, façades, finitions.", "/blog"), savoir("03", "Pierre et rénovation", "Murs anciens, reprises, ouvertures.", "/blog")], { gap: "4px", flexWrap: "wrap", width: "100%", alignItems: "stretch" });
    const rang2 = k.row([devis, cContact, cHor, cAss], { gap: "4px", flexWrap: "wrap", width: "100%", alignItems: "stretch" });
    const mur = k.col([rang1, rang2], { width: "100%", gap: "4px", backgroundColor: CHARBON, borderStyle: "solid", borderWidth: "4px", borderColor: CHARBON, borderRadius: "0px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6cdbf", liens: "#ffffff" })(k, env);
    const bande = G.bande(k, [mur, mentions], { fond: CHARBON, colonne: true, gap: "28px", padV: ["48px", "36px", "24px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Mur" });
    bande.styles.desktop.color = "#ffffff";
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-222 « Devis ou chantier » — entreprise générale du bâtiment — ARCHÉTYPE E (deux demi-pages opposées)
// Idée : deux DEMI-PAGES bord à bord de couleurs opposées. À gauche, aplat bleu de travail : le message (« Un chantier réussi commence par un devis clair. »), la mention d'assurance (texte générique) et la lettre.
// À droite, fond acier clair : quatre grandes actions en rangées (demander un devis, suivre mon chantier, rejoindre l'équipe, questions) qui glissent au survol, puis les coordonnées. Pas d'horaires.
// Polices : Barlow Semi Condensed (titres) et Barlow. Mobile : les deux moitiés se superposent.
const travail = identite({
  key: "c222", label: "Bleu de travail, acier clair et cyan", humeur: "dark",
  fond: "#17345c", texte: "#f2f6fb", discret: "#c3d0e0", accent: "#6fd6ec", surface: "#1f4272", encre: "#17345c", surEncre: "#f2f6fb",
  police: "font.barlow", titres: "font.barlow-semi-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f2f6fb40",
});
const BLEU = "#17345c", BLEU2 = "#0f2745", ACIER = "#e9eef3", CYAN = "#6fd6ec", CYAN_FONCE = "#0b6f86";

const devisOuChantier = modeleV2({
  id: identifiantV2(222, "devis-ou-chantier"), concept: "c-222-devis-ou-chantier",
  name: "Devis ou chantier", family: FAM,
  description: "Pour une entreprise générale du bâtiment : deux demi-pages opposées, un aplat bleu de travail avec le message, la mention décennale et la lettre, face à un fond acier clair avec quatre grandes actions (devis, suivi de chantier, recrutement, questions) et les coordonnées.",
  tags: ["entreprise générale", "bâtiment", "devis", "deux demi-pages", "bleu de travail", "acier", "cyan", "angles droits"],
  identity: travail,
  racine: racineDe(BLEU2),
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 26, "#ffffff");
    const phrase = G.geant(`<p>Un chantier réussi commence par un devis clair.</p>`, { taille: [34, 72], tablette: { taille: [46, 60] }, mobile: { taille: [32, 40] }, lh: 1.02, suivi: "-0.005em", poids: "700", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const abo = lettre(k, env, G, { titre: "Nouvelles de l'entreprise", intro: "Chantiers livrés et conseils, par courriel.", bouton: "S'abonner", largeur: "400px", accent: CYAN, surBouton: BLEU, texte: "#f2f6fb", couleurTitre: CYAN, fond: BLEU, survolBouton: "#ffffff", survolTexte: BLEU, focus: "#ffffff" });
    const gauche = G.colonne(k, [nom, phrase, k.T(`<p>${DECENNALE}</p>`, { fontSize: "14px", lineHeight: 1.55, color: "#c3d0e0", fontFamily: S.font, maxWidth: "440px" }), abo], { poids: 1, min: "420px", gap: "28px", extra: { backgroundColor: BLEU, paddingTop: "88px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "48px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    const action = (t, u) => {
      const l = lien(k, t, u, { taille: 30, poids: "700", police: S.head, couleur: BLEU, h: "76px", survol: { color: CYAN_FONCE }, focus: CYAN_FONCE, extra: { flexGrow: 1, textTransform: "uppercase" } });
      const r = k.row([l, k.T("<p>→</p>", { fontSize: "30px", color: CYAN_FONCE, fontFamily: S.font, lineHeight: 1 })], { flexWrap: "nowrap", alignItems: "center", width: "100%", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: BLEU, borderRadius: "0px", backgroundColor: ACIER, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ffffff", paddingLeft: "18px" } };
      return r;
    };
    const actions = k.col([action("Demander un devis", "/contact"), action("Suivre mon chantier", "/connexion"), action("Rejoindre l'équipe", "/contact"), action("Questions fréquentes", "/faq")], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: BLEU });
    const pt = souffle(carre(k, CYAN_FONCE, "10px"), 3200);
    const contact = k.row([pt, G.colonne(k, [coordonnees(k, { taille: 15, couleur: BLEU, lien: BLEU, survol: CYAN_FONCE, focus: CYAN_FONCE })], { poids: 1, min: "200px" })], { gap: "14px", alignItems: "flex-start", flexWrap: "nowrap", width: "100%" });
    const droite = G.colonne(k, [actions, contact], { poids: 1, min: "420px", gap: "32px", extra: { backgroundColor: ACIER, paddingTop: "88px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px", justifyContent: "space-between" }, mobile: { minWidth: "100%", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    droite.children = droite.children.map((c) => { c.styles.desktop = { ...c.styles.desktop, width: "100%" }; return c; });
    const moities = G.bande(k, [gauche, droite], { fond: ACIER, gap: "0px", aligne: "stretch", max: "1920px", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Demi-pages" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c3d0e0", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { fond: BLEU2, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [moities, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-223 « Une route, un réseau » — travaux publics — ARCHÉTYPE F (bandeau d'appel XXL + colonne de liens étroite)
// Idée : un BANDEAU XXL orange chantier avec la question « Une route, un réseau, un ouvrage ? » en très grandes capitales noires et un bouton noir ; dessous, sur kaki, le nom, la mention décennale et les coordonnées
// à gauche, et à DROITE une seule colonne ÉTROITE de six liens séparés par des filets, dont le fond s'éclaircit et le retrait glisse au survol. Pas d'horaires ni de lettre. Polices : Chivo (titres) et Public Sans.
const chantier = identite({
  key: "c223", label: "Orange chantier, kaki et noir", humeur: "dark",
  fond: "#2a301f", texte: "#f3efe2", discret: "#c9c8b4", accent: "#ff9a4d", surface: "#343b27", encre: "#2a301f", surEncre: "#f3efe2",
  police: "font.public-sans", titres: "font.chivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "900", bordure: "0px", ligne: "#f3efe240",
});
const KAKI = "#2a301f", KAKI2 = "#1c2014", ORANGE = "#ee6a1b", NOIR23 = "#111111";

const uneRouteUnReseau = modeleV2({
  id: identifiantV2(223, "une-route-un-reseau"), concept: "c-223-une-route-un-reseau",
  name: "Une route, un réseau", family: FAM,
  description: "Pour une entreprise de travaux publics : un bandeau XXL orange chantier avec la question en grandes capitales noires et un bouton, puis un socle kaki avec nom, mention décennale, coordonnées et, à droite, une colonne étroite de six liens.",
  tags: ["travaux publics", "voirie", "réseaux", "ouvrages d'art", "bandeau XXL", "orange", "kaki", "angles droits"],
  identity: chantier,
  racine: racineDe(KAKI2),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Une route,<br>un réseau,<br>un ouvrage ?</p>`, { taille: [44, 132], tablette: { taille: [72, 110] }, mobile: { taille: [40, 54] }, lh: 0.95, suivi: "-0.025em", poids: "900", police: S.head, couleur: NOIR23, extra: { textTransform: "uppercase" } })(k, env);
    const btn = lien(k, "Demander un devis", "/contact", { taille: 20, poids: "800", couleur: "#ffffff", casse: "uppercase", suivi: "0.04em", h: "68px", padH: "36px", survol: { backgroundColor: "#ffffff", color: NOIR23, transform: { x: 8 } }, focus: "#ffffff", extra: { backgroundColor: NOIR23, justifyContent: "center", alignSelf: "flex-start" } });
    const xxl = G.bande(k, [G.colonne(k, [phrase], { poids: 8, min: "300px" }), G.colonne(k, [btn], { poids: 3, min: "260px", soi: "flex-end" })], { fond: ORANGE, gap: "32px 48px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["80px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const nom = nomDuSite(k, env, 30, "#ffffff");
    const pt = souffle(carre(k, "#ff9a4d", "10px"), 3000);
    const gauche = G.colonne(k, [nom, k.row([pt, k.T("<p>Voirie, réseaux divers, ouvrages et terrassements.</p>", { fontSize: "17px", lineHeight: 1.5, color: "#f3efe2", fontFamily: S.font })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), coordonnees(k, { taille: 15, couleur: "#f3efe2", lien: "#ffffff", survol: "#ff9a4d", focus: "#ffffff" }), k.T(`<p>${DECENNALE}</p>`, { fontSize: "14px", lineHeight: 1.55, color: "#c9c8b4", fontFamily: S.font, maxWidth: "460px" })], { poids: 3, min: "300px", gap: "20px" });
    const lienEtroit = (t, u) => {
      const l = lien(k, t, u, { taille: 17, poids: "700", couleur: "#f3efe2", h: "52px", survol: { color: "#ff9a4d" }, focus: "#ff9a4d", extra: { flexGrow: 1 } });
      const r = k.row([l], { flexWrap: "nowrap", alignItems: "center", width: "100%", paddingRight: "8px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f3efe244", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#343b27", paddingLeft: "12px" } };
      return r;
    };
    const etroite = k.col([lienEtroit("Nos réalisations", "/blog"), lienEtroit("Matériel et moyens", "/blog"), lienEtroit("Sécurité sur chantier", "/faq"), lienEtroit("Recrutement", "/contact"), lienEtroit("Espace client", "/connexion"), lienEtroit("Nous contacter", "/contact")], { flexGrow: 0, flexShrink: 0, flexBasis: "280px", minWidth: "240px", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: "#ff9a4d", borderRadius: "0px" }, undefined, { flexBasis: "100%", minWidth: "100%" });
    const corps = G.ligne(k, [gauche, etroite], { gap: "40px 80px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c9c8b4", liens: "#ffffff" })(k, env);
    const socle = G.bande(k, [corps, mentions], { fond: KAKI, colonne: true, gap: "44px", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Socle" });
    socle.styles.desktop.color = "#ffffff";
    return [G.racine(k, [xxl, socle])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-224 « Maison à rénover » — rénovation — ARCHÉTYPE B (nom monumental seul au centre)
// Idée : presque RIEN. Au centre d'un grand vide plâtre, le nom de l'entreprise en très grand serif canard, une seule ligne de quatre liens dont le soulignement épais grandit au survol, un unique bouton carré et la ligne légale
// centrée. Un petit carré qui « respire » précède la phrase « Votre projet commence par une visite. ». Ni colonnes, ni horaires, ni lettre. Polices : Literata (titres) et Nunito Sans. Mobile : nom réduit, liens sur deux lignes.
const platre = identite({
  key: "c224", label: "Plâtre, bleu canard et ocre", humeur: "light",
  fond: "#f6f3ee", texte: "#0b3f4a", discret: "#4d646a", accent: "#0b4f5c", surface: "#ffffff", encre: "#0b3f4a",
  police: "font.nunito-sans", titres: "font.literata",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#0b3f4a33",
});
const PLATRE = "#f6f3ee", CANARD = "#0b4f5c", OCRE = "#9a5a0c";

const maisonARenover = modeleV2({
  id: identifiantV2(224, "maison-a-renover"), concept: "c-224-maison-a-renover",
  name: "Maison à rénover", family: FAM,
  description: "Pour une entreprise de rénovation : le nom en très grand serif au centre d'un grand vide plâtre, quatre liens à soulignement épais qui grandit au survol, un seul bouton carré et la ligne légale centrée. Radicalement sobre.",
  tags: ["rénovation", "second œuvre", "nom monumental", "minimal", "plâtre", "bleu canard", "serif", "angles droits"],
  identity: platre,
  racine: racineDe(PLATRE),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 120, CANARD, { textAlign: "center", fontWeight: "600", letterSpacing: "-0.03em", lineHeight: 1 });
    nom.styles.mobile = { ...(nom.styles.mobile || {}), fontSize: "46px" };
    nom.styles.tablet = { ...(nom.styles.tablet || {}), fontSize: "84px" };
    const pt = souffle(carre(k, OCRE, "10px"), 3200);
    const phrase = k.row([pt, k.T("<p>Votre projet commence par une visite.</p>", { fontSize: "20px", fontStyle: "italic", color: S.mute, fontFamily: S.head })], { gap: "12px", alignItems: "center", justifyContent: "center", flexWrap: "nowrap" });
    const souligne = (t, u) => lien(k, t, u, { taille: 17, poids: "700", couleur: CANARD, h: "48px", survol: { color: OCRE, borderBottomWidth: "6px", borderColor: OCRE }, focus: OCRE, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: CANARD } });
    const liens = k.row([souligne("Cuisine et bains", "/blog"), souligne("Isolation et toiture", "/blog"), souligne("Extensions", "/blog"), souligne("Questions", "/faq")], { ...GK.gaps("6px 36px"), justifyContent: "center", alignItems: "center", flexWrap: "wrap", width: "100%" });
    const btn = lien(k, "Prendre rendez-vous", "/contact", { taille: 17, poids: "700", couleur: "#ffffff", h: "58px", padH: "36px", survol: { backgroundColor: OCRE, transform: { y: -3 } }, focus: OCRE, extra: { backgroundColor: CANARD, justifyContent: "center", alignSelf: "center" } });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [k.col([phrase, nom, liens, btn], { width: "100%", alignItems: "center", gap: "36px" }), mentions], { fond: PLATRE, colonne: true, gap: "88px", aligne: "center", padV: ["140px", "108px", "72px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "56px" }, nom: "Nom" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-225 « Feuille de calque » — bureau d'études techniques — ARCHÉTYPE J (papier à en-tête, ici une feuille de calque)
// Idée : un PAPIER À EN-TÊTE de bureau d'études : tout est CENTRÉ entre des filets doubles (un fin, un épais). Mention « Bureau d'études techniques » en mono, nom, coordonnées (Données de l'entreprise),
// une ligne de disciplines en liens séparés par des barres (structure, fluides, thermique, acoustique), la mention d'assurance décennale (texte générique) et la ligne légale centrée. Un carré rouge de repère « respire ».
// Polices : Geist Mono (titres) et Geist. Mobile : tout reste centré, liens sur plusieurs lignes.
const calque = identite({
  key: "c225", label: "Calque, bleu cyanotype et rouge repère", humeur: "light",
  fond: "#f4f1e6", texte: "#0d2f4a", discret: "#46586a", accent: "#0c5a8a", surface: "#ffffff", encre: "#0d2f4a",
  police: "font.geist", titres: "font.geist-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#0d2f4a44",
});
const CALQUE = "#f4f1e6", CYANO = "#0c5a8a", ENCRE25 = "#0d2f4a", REPERE = "#b3261e";

const papierAEnTete = modeleV2({
  id: identifiantV2(225, "feuille-de-calque"), concept: "c-225-feuille-de-calque",
  name: "Feuille de calque", family: FAM,
  description: "Pour un bureau d'études techniques : un papier à en-tête centré entre filets doubles, avec nom, coordonnées, une ligne de disciplines (structure, fluides, thermique, acoustique), la mention décennale générique et la ligne légale centrée.",
  tags: ["bureau d'études", "ingénierie", "papier à en-tête", "centré", "filets doubles", "calque", "cyanotype", "angles droits"],
  identity: calque,
  racine: racineDe(CALQUE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const double = () => k.col([trait(k, ENCRE25, "1px"), k.col([], { height: "5px" }), trait(k, ENCRE25, "4px")], { width: "100%", gap: "0px" });
    const pt = souffle(carre(k, REPERE, "10px"), 3000);
    const etiquette = k.row([pt, mono(k, "BUREAU D'ÉTUDES TECHNIQUES", { couleur: CYANO, taille: "14px", poids: "700", extra: { letterSpacing: "0.18em" } })], { gap: "12px", justifyContent: "center", alignItems: "center", flexWrap: "nowrap" });
    const nom = nomDuSite(k, env, 40, ENCRE25, { textAlign: "center", fontWeight: "600", letterSpacing: "-0.02em" });
    const contact = coordonnees(k, { taille: 15, lien: ENCRE25, survol: CYANO, focus: CYANO });
    contact.styles.desktop = { ...contact.styles.desktop, textAlign: "center" };
    partie(contact, "item", { justifyContent: "center", textAlign: "center" });
    partie(contact, "text", { textAlign: "center" });
    const disc = (t, u) => lien(k, t, u, { taille: 15, poids: "600", police: S.head, couleur: ENCRE25, h: "44px", padH: "6px", survol: { color: CYANO, backgroundColor: "#ffffff" }, focus: CYANO });
    const barre = () => k.T("<p>/</p>", { fontSize: "15px", color: S.mute, fontFamily: S.head });
    const disciplines = k.row([disc("Structure", "/blog"), barre(), disc("Fluides", "/blog"), barre(), disc("Thermique", "/blog"), barre(), disc("Acoustique", "/blog"), barre(), disc("Contact", "/contact")], { ...GK.gaps("0px 10px"), justifyContent: "center", alignItems: "center", flexWrap: "wrap", width: "100%" });
    const assur = k.T(`<p>${DECENNALE}</p>`, { fontSize: "14px", lineHeight: 1.6, fontStyle: "italic", color: S.mute, fontFamily: S.font, textAlign: "center", maxWidth: "620px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true);
    const contenu = k.col([double(), etiquette, nom, contact, disciplines, assur, double(), mentions], { width: "100%", alignItems: "center", gap: "22px", maxWidth: "820px" });
    contenu.styles.desktop = { ...contenu.styles.desktop, marginLeft: "auto", marginRight: "auto" };
    const bande = G.bande(k, [contenu], { fond: CALQUE, colonne: true, aligne: "center", padV: ["72px", "56px", "40px"], padB: ["36px", "30px", "24px"], padH: ["48px", "32px", "20px"], nom: "Calque" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Construction et travaux publics", target: 5, built: true,
  description: "Pieds de construction et travaux publics standard et très professionnels, à angles droits : mur de cases, deux demi-pages, bandeau XXL, nom monumental, papier à en-tête.",
  models: [appareilDeMacon, devisOuChantier, uneRouteUnReseau, maisonARenover, papierAEnTete],
};
