// Famille v2 « Voyages et tourisme » — 5 modèles (ft2-241 à ft2-245), extension « carrée 2 » : angles droits, diversité stricte (5 archétypes : C, E, F, B, H).
// Destinations en exemples ; garanties en texte d'exemple, SANS immatriculation ni garantie inventée. Mouvement : transitions de 360 ms, carrés qui respirent, survols qui glissent ou se soulèvent (coupés en « mouvement réduit »).
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
// rangée de lien + flèche, à fond qui s'éclaircit au survol (liste à filets)
const surFond = (k, texte, url, o) => lien(k, texte, url, o);
const bandeMentions = (k, env, G, o) => {
  const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: o.texte, liens: o.liens })(k, env);
  const b = G.bande(k, [mentions], { fond: o.fond, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions", filetHaut: o.filet });
  b.styles.desktop.color = o.liens;
  return b;
};
// recherche : widget « Recherche » à angles droits, habillé pour un fond précis
const recherche = (k, o) => {
  const f = { outlineStyle: "solid", outlineWidth: "3px", outlineColor: o.focus, outlineOffset: "2px" };
  const n = k.W("search", { target: "site", placeholder: o.ph, button: o.bouton || "Rechercher" }, { width: "100%", maxWidth: o.max || "520px", fontFamily: k.S.font, borderRadius: "0px" });
  n.parts = {
    field: { styles: { desktop: { fontFamily: k.S.font, fontSize: "17px", color: o.texte, backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.contour, borderRadius: "0px", minHeight: "52px", paddingLeft: "16px", paddingRight: "16px" }, mobile: { minHeight: "52px" } }, states: { focus: f } },
    button: { styles: { desktop: { fontFamily: k.S.font, fontSize: "16px", fontWeight: "700", color: o.surBouton, backgroundColor: o.fondBouton, borderStyle: "solid", borderWidth: "0px", borderRadius: "0px", minHeight: "52px", paddingLeft: "22px", paddingRight: "22px", transitionDuration: DOUX }, mobile: { minHeight: "52px" } }, states: { hover: { backgroundColor: o.survol, color: o.surSurvol }, focus: f } },
  };
  return n;
};
const PAD = ["48px", "32px", "20px"];
const btn = (k, t, u, c) => lien(k, t, u, { taille: 16, poids: "700", couleur: c.texte, h: c.h || "52px", padH: "28px", survol: { backgroundColor: c.survol, color: c.surSurvol, transform: { y: -3 } }, focus: c.focus, extra: { backgroundColor: c.fond, justifyContent: "center", borderStyle: "solid", borderWidth: "2px", borderColor: c.contour || c.fond, alignSelf: c.soi || "flex-start" } });
const txt = (k, t, o = {}) => k.T(`<p>${t}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, textAlign: o.align, fontWeight: o.poids, fontStyle: o.style }));
const FAM = "voyage-tourisme";
const NOTE_GARANTIES = "Texte d'exemple : indiquez ici votre immatriculation, votre garantie financière et votre assurance, telles que vous les détenez. Rien n'est affiché sans votre saisie.";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-241 « Damier des destinations » — agence de voyages. ARCHÉTYPE C (grille de huit cases égales, chacune est un lien ou une information).
// Idée : un DAMIER de 8 cases carrées de bord à bord : le nom de l'agence (case papaye), cinq destinations EXEMPLES (Lisbonne, Marrakech, Reykjavik, Kyoto, Istanbul), les coordonnées et les horaires. Une case sur deux est plus claire, comme un damier ;
// au survol la case s'éclaircit et le nom de la destination glisse. Polices : Chivo Mono (titres, majuscules) et Geologica. Pas de lettre d'information.
const departs = identite({
  key: "c241", label: "Encre azur et papaye", humeur: "dark",
  fond: "#062b3a", texte: "#e9f6fa", discret: "#a6c8d3", accent: "#ff9a5c", surface: "#0a3a4e", encre: "#062b3a", surEncre: "#e9f6fa",
  police: "font.geologica", titres: "font.chivo-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#e9f6fa33",
});
const ENCRE1 = "#062b3a", ENCRE1B = "#0a3a4e", PAPAYE = "#ff9a5c", GLACE1 = "#e9f6fa";
const damier = modeleV2({
  id: identifiantV2(241, "damier-des-destinations"), concept: "c-241-damier-des-destinations",
  name: "Damier des destinations", family: FAM,
  description: "Pour une agence de voyages : huit cases carrées de bord à bord, en damier encre et azur, dont le nom de l'agence sur papaye, cinq destinations en exemples, les coordonnées et les horaires. Les cases s'éclaircissent au survol. Angles droits.",
  tags: ["agence de voyages", "destinations", "damier", "cases", "papaye", "encre", "horaires", "angles droits"],
  identity: departs,
  racine: racineDe(ENCRE1),
  widgets: ["sitetitle", "text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const base = (i, plein) => ({ flexGrow: 1, flexShrink: 1, flexBasis: "22%", minWidth: "250px", minHeight: "230px", gap: "14px", justifyContent: "space-between", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: plein || ((i + Math.floor(i / 4)) % 2 ? ENCRE1B : ENCRE1), borderStyle: "solid", borderWidth: "1px", borderColor: "#e9f6fa22", borderRadius: "0px", transitionDuration: DOUX });
    const mob = { minWidth: "100%", minHeight: "0px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px" };
    const nom = nomDuSite(k, env, 28, ENCRE1, { fontFamily: S.head, fontWeight: "700", textTransform: "uppercase" });
    const caseNom = k.col([caps(k, "Agence de voyages", { couleur: ENCRE1, suivi: "0.18em" }), nom, lien(k, "Toutes les destinations", "/blog", { taille: 16, poids: "700", couleur: ENCRE1, survol: { transform: { x: 6 } }, focus: ENCRE1, extra: { textDecoration: "underline" } })], base(0, PAPAYE), undefined, mob);
    const DEST = [["Lisbonne", "Week-end"], ["Marrakech", "Escapade"], ["Reykjavik", "Aurores"], ["Kyoto", "Circuit"], ["Istanbul", "Séjour"]];
    const caseDest = ([ville, type], j) => {
      const i = j + 1;
      const c = k.col([k.row([caps(k, type, { couleur: PAPAYE }), k.T("<p>→</p>", { fontSize: "22px", color: PAPAYE, fontFamily: S.font, lineHeight: 1 })], { justifyContent: "space-between", width: "100%", flexWrap: "nowrap" }), lien(k, ville, "/contact", { taille: 28, poids: "700", police: S.head, couleur: GLACE1, casse: "uppercase", survol: { color: PAPAYE, transform: { x: 6 } }, focus: PAPAYE, lh: 1.1 })], base(i), undefined, mob);
      c.states = { hover: { backgroundColor: "#11566f" } };
      return c;
    };
    const caseContact = k.col([caps(k, "Réserver", { couleur: PAPAYE }), coordonnees(k, { taille: 15, couleur: GLACE1, lien: "#ffffff", survol: PAPAYE, focus: "#ffffff" })], base(6), undefined, mob);
    const caseHeures = k.col([k.row([souffle(carre(k, PAPAYE, "10px"), 3000), caps(k, "Conseillers", { couleur: PAPAYE })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: GLACE1 })], base(7), undefined, mob);
    const grille = G.bande(k, [caseNom, ...DEST.map(caseDest), caseContact, caseHeures], { fond: ENCRE1, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Damier" });
    const note = txt(k, NOTE_GARANTIES, { taille: 13, couleur: "#b8d4dd", max: "720px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b8d4dd", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [note, mentions], { fond: ENCRE1, colonne: true, gap: "14px", padV: ["28px", "24px", "22px"], padB: ["24px", "22px", "20px"], padH: PAD, nom: "Garanties" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [grille, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-242 « Deux accueils » — office de tourisme. ARCHÉTYPE E (deux demi-pages bord à bord de couleurs opposées).
// Idée : à gauche, le MESSAGE sur lichen clair (« Bienvenue, on vous guide »), bouton coquelicot et horaires de l'accueil ; à droite, les ACTIONS sur vert profond : champ de recherche, six lignes (brochures, agenda, hébergements, balades, boutique, presse) et coordonnées.
// Polices : Zilla Slab (titres) et Overpass. Pas de lettre d'information.
const lichen = identite({
  key: "c242", label: "Lichen, vert profond et coquelicot", humeur: "light",
  fond: "#eef3e2", texte: "#1c2a14", discret: "#44563a", accent: "#c42a14", surface: "#ffffff", encre: "#1f4a24", surEncre: "#eef3e2",
  police: "font.overpass", titres: "font.zilla-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1c2a1444",
});
const LICHEN = "#eef3e2", VERT = "#1f4a24", VERT2 = "#143318", COQ = "#c42a14", ENCRE2 = "#1c2a14", SOLEIL = "#f6c453";
const deuxAccueils = modeleV2({
  id: identifiantV2(242, "deux-accueils"), concept: "c-242-deux-accueils",
  name: "Deux accueils", family: FAM,
  description: "Pour un office de tourisme : deux demi-pages bord à bord, un message de bienvenue sur lichen avec bouton et horaires d'accueil, face à un panneau vert profond avec recherche, six accès (brochures, agenda, balades…) et coordonnées.",
  tags: ["office de tourisme", "accueil", "deux moitiés", "recherche", "lichen", "vert", "coquelicot", "angles droits"],
  identity: lichen,
  racine: racineDe(VERT2),
  widgets: ["sitetitle", "text", "link", "search", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, ENCRE2, { fontWeight: "700" });
    const phrase = G.geant(`<p>Bienvenue,<br>on vous guide.</p>`, { taille: [42, 92], tablette: { taille: [52, 76] }, mobile: { taille: [40, 52] }, lh: 1.0, suivi: "-0.015em", poids: "700", police: S.head, couleur: ENCRE2 })(k, env);
    const gauche = k.col([k.row([souffle(carre(k, COQ, "12px"), 3000), caps(k, "Office de tourisme", { couleur: COQ, suivi: "0.2em" })], { gap: "10px", alignItems: "center" }), nom, phrase, btn(k, "Préparer ma visite", "/blog", { texte: "#ffffff", fond: COQ, survol: ENCRE2, surSurvol: "#ffffff", focus: ENCRE2 })], { flexGrow: 1, flexBasis: "0px", minWidth: "420px", gap: "24px", backgroundColor: LICHEN, paddingTop: "88px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "52px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" });
    const rech = recherche(k, { ph: "Une balade, une adresse, un événement…", texte: ENCRE2, fond: "#ffffff", contour: "#eef3e2", fondBouton: SOLEIL, surBouton: ENCRE2, survol: "#ffffff", surSurvol: VERT, focus: SOLEIL, max: "560px" });
    const ACCES = [["Brochures à télécharger", "/blog"], ["Agenda des sorties", "/blog"], ["Où dormir", "/contact"], ["Randonnées et balades", "/blog"], ["Boutique de l'office", "/contact"], ["Espace presse", "/contact"]];
    const acces = ([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: LICHEN, h: "48px", padH: "18px", survol: { backgroundColor: SOLEIL, color: ENCRE2, transform: { y: -3 } }, focus: SOLEIL, extra: { borderStyle: "solid", borderWidth: "2px", borderColor: "#eef3e2aa", justifyContent: "center" } });
    const heures2 = k.row([coordonnees(k, { taille: 15, couleur: LICHEN, lien: "#ffffff", survol: SOLEIL, focus: "#ffffff" }), horaires(k, { taille: 15, couleur: LICHEN })], { rowGap: "20px", columnGap: "40px", alignItems: "flex-start", width: "100%" });
    const droite = k.col([caps(k, "Je cherche…", { couleur: SOLEIL, suivi: "0.2em" }), rech, k.row(ACCES.map(acces), { gap: "10px", width: "100%" }), heures2], { flexGrow: 1, flexBasis: "0px", minWidth: "420px", gap: "24px", backgroundColor: VERT, paddingTop: "88px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "52px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" });
    const moitiés = G.bande(k, [gauche, droite], { fond: LICHEN, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Demi-pages" });
    const bas = bandeMentions(k, env, G, { fond: VERT2, texte: "#cfe0c6", liens: "#ffffff" });
    return [G.racine(k, [moitiés, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-243 « Départ immédiat » — circuits organisés. ARCHÉTYPE F (bandeau d'appel XXL en haut + liens en une colonne étroite à droite).
// Idée : un BANDEAU glacier de bord à bord, « Partez en circuit. » en capitales géantes et un énorme bouton noir ; dessous, sur basalte, à gauche le nom, un texte d'exemple pour les garanties et la lettre,
// à droite une COLONNE ÉTROITE de cinq liens séparés par des filets et les coordonnées. Polices : Antonio (titres, majuscules) et Cabin.
const basalte = identite({
  key: "c243", label: "Basalte et bleu glacier", humeur: "dark",
  fond: "#23272b", texte: "#eef3f5", discret: "#b4c1c7", accent: "#7fd6e8", surface: "#2c3237", encre: "#23272b", surEncre: "#eef3f5",
  police: "font.cabin", titres: "font.antonio",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#eef3f533",
});
const BASALTE = "#23272b", BASALTE2 = "#1a1d20", GLACIER = "#7fd6e8", NOIR3 = "#12181c", GIVRE = "#eef3f5";
const departImmediat = modeleV2({
  id: identifiantV2(243, "depart-immediat"), concept: "c-243-depart-immediat",
  name: "Départ immédiat", family: FAM,
  description: "Pour des circuits organisés : un immense bandeau bleu glacier avec l'appel en capitales géantes et un gros bouton noir, puis sur basalte le nom, un texte de garanties d'exemple, la lettre, et une colonne étroite de liens à droite.",
  tags: ["circuits", "voyage organisé", "bandeau géant", "colonne étroite", "basalte", "glacier", "garanties", "angles droits"],
  identity: basalte,
  racine: racineDe(BASALTE2),
  widgets: ["sitetitle", "text", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Partez<br>en circuit.</p>`, { taille: [64, 168], tablette: { taille: [96, 140] }, mobile: { taille: [60, 84] }, lh: 0.9, suivi: "-0.01em", poids: "700", police: S.head, couleur: NOIR3, extra: { textTransform: "uppercase" } })(k, env);
    const gros = lien(k, "Recevoir le programme", "/contact", { taille: 22, poids: "700", casse: "uppercase", suivi: "0.06em", couleur: GLACIER, h: "84px", padH: "44px", survol: { backgroundColor: "#ffffff", color: NOIR3, transform: { x: 8 } }, focus: NOIR3, extra: { backgroundColor: NOIR3, justifyContent: "center", borderStyle: "solid", borderWidth: "3px", borderColor: NOIR3, alignSelf: "flex-start" } });
    const appel = G.bande(k, [G.colonne(k, [caps(k, "Circuits accompagnés et en liberté", { couleur: NOIR3, suivi: "0.22em" }), phrase], { poids: 7, min: "320px", gap: "16px" }), G.colonne(k, [txt(k, "Un programme jour par jour, un conseiller qui répond : dites-nous où vous rêvez d'aller.", { taille: 18, couleur: NOIR3, max: "360px" }), gros], { poids: 4, min: "260px", gap: "22px", soi: "flex-end" })], { fond: GLACIER, gap: "32px 64px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["72px", "56px", "40px"], padH: PAD, nom: "Appel" });
    const nom = nomDuSite(k, env, 36, GIVRE, { fontWeight: "700", textTransform: "uppercase" });
    const abo = lettre(k, env, G, { titre: "Carnet de routes", intro: "Les nouveaux circuits, par courriel.", bouton: "S'abonner", largeur: "440px", accent: GLACIER, surBouton: NOIR3, texte: GIVRE, couleurTitre: GLACIER, fond: BASALTE, survolBouton: "#ffffff", survolTexte: NOIR3, focus: "#ffffff" });
    const gauche = G.colonne(k, [caps(k, "Voyages organisés", { couleur: GLACIER, suivi: "0.2em" }), nom, txt(k, NOTE_GARANTIES, { taille: 15, couleur: S.mute, max: "520px" }), abo], { poids: 7, min: "320px", gap: "20px" });
    const LIENS = [["Circuits accompagnés", "/blog"], ["Circuits en liberté", "/blog"], ["Voyages de groupe", "/contact"], ["Conditions de vente", "/contact"], ["Questions fréquentes", "/faq"]];
    const etroite = G.colonne(k, [...LIENS.map(([t, u], i) => lien(k, t, u, { taille: 17, poids: "600", couleur: GIVRE, survol: { color: GLACIER, transform: { x: 6 }, backgroundColor: "#2c3237" }, focus: GLACIER, h: "52px", extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: i === 0 ? "2px" : "1px", borderColor: "#7fd6e877", borderRadius: "0px" } })), coordonnees(k, { taille: 14, couleur: S.mute, lien: GIVRE, survol: GLACIER, focus: GLACIER })], { poids: 3, min: "240px", gap: "14px", extra: { maxWidth: "340px" } });
    const corps = G.bande(k, [gauche, etroite], { fond: BASALTE, gap: "40px 80px", aligne: "flex-start", padV: ["64px", "52px", "44px"], padB: ["56px", "44px", "36px"], padH: PAD, nom: "Départ" });
    const bas = bandeMentions(k, env, G, { fond: BASALTE2, texte: "#c4d0d6", liens: "#ffffff" });
    return [G.racine(k, [appel, corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-244 « Nom de la maison » — location de vacances. ARCHÉTYPE B (nom monumental seul au centre, très peu de liens, grand vide).
// Idée : le NOM de la location en immense serif pervenche, centré dans un grand vide chaux, avec au-dessus une petite frise de huit carrés (S D L M M J V S : arrivée et départ le samedi, en tournesol) et dessous trois liens seulement.
// Bande tournesol pour les mentions. Polices : Yeseva One (titres, 400) et Urbanist. Ni horaires, ni contact, ni lettre : un lien « Nous écrire » suffit.
const chaux = identite({
  key: "c244", label: "Chaux, tournesol et pervenche", humeur: "light",
  fond: "#fffdf5", texte: "#1f2540", discret: "#4c5578", accent: "#3b4a8f", surface: "#ffffff", encre: "#3b4a8f", surEncre: "#ffffff",
  police: "font.urbanist", titres: "font.yeseva-one",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1f254044",
});
const CHAUX = "#fffdf5", PERV = "#3b4a8f", TOURNE = "#f2b705", ENCRE4 = "#1f2540";
const nomMaison = modeleV2({
  id: identifiantV2(244, "nom-de-la-maison"), concept: "c-244-nom-de-la-maison",
  name: "Nom de la maison", family: FAM,
  description: "Pour une location de vacances : le nom de la maison en immense serif pervenche au centre d'un grand vide chaux, une petite frise de huit carrés du samedi au samedi, trois liens seulement et une bande tournesol pour les mentions.",
  tags: ["location de vacances", "gîte", "nom monumental", "centré", "chaux", "tournesol", "pervenche", "angles droits"],
  identity: chaux,
  racine: racineDe(TOURNE),
  widgets: ["sitetitle", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const JOURS = ["S", "D", "L", "M", "M", "J", "V", "S"];
    const case1 = (j, i) => {
      const bord = i === 0 || i === JOURS.length - 1;
      const c = k.col([k.T(`<p><strong>${j}</strong></p>`, { fontSize: "16px", fontFamily: S.font, color: bord ? ENCRE4 : PERV, textAlign: "center", lineHeight: 1 })], { width: "36px", height: "36px", alignItems: "center", justifyContent: "center", backgroundColor: bord ? TOURNE : "transparent", borderStyle: "solid", borderWidth: "2px", borderColor: bord ? TOURNE : PERV, borderRadius: "0px", transitionDuration: DOUX, flexShrink: 0 });
      c.states = { hover: { transform: { y: -4 } } };
      return i === JOURS.length - 1 ? souffle(c, 3600) : c;
    };
    const frise = k.row(JOURS.map(case1), { gap: "4px", justifyContent: "center", flexWrap: "nowrap", alignItems: "center" });
    const nom = nomDuSite(k, env, 38, PERV, { fontWeight: "400", fontSize: "fluid:40-168", lineHeight: 1.0, textAlign: "center", letterSpacing: "-0.01em", overflowWrap: "anywhere" });
    const liensL = [["Louer", "/contact"], ["Disponibilités", "/blog"], ["Nous écrire", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: ENCRE4, survol: { color: PERV, transform: { y: -2 } }, focus: PERV, extra: { textDecoration: "underline" } }));
    const centre = G.bande(k, [caps(k, "Location de vacances", { couleur: PERV, suivi: "0.28em", extra: { textAlign: "center" } }), frise, txt(k, "Arrivée le samedi, départ le samedi.", { taille: 16, align: "center" }), nom, k.row(liensL, { rowGap: "4px", columnGap: "40px", justifyContent: "center" })], { fond: CHAUX, colonne: true, aligne: "center", gap: "28px", padV: ["168px", "120px", "72px"], padB: ["156px", "112px", "64px"], padH: PAD, nom: "Maison" });
    const bas = bandeMentions(k, env, G, { fond: TOURNE, texte: "#2a2100", liens: "#1a1500" });
    return [G.racine(k, [centre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-245 « Plan du pont » — croisières. ARCHÉTYPE H (mosaïque asymétrique : une grande case et trois petites).
// Idée : une GRANDE CASE teal (« Embarquez pour l'ailleurs », bouton perle) accolée à trois PETITES CASES empilées : garanties (texte d'exemple, sans immatriculation inventée), coordonnées sur cuivre, quatre zones de navigation en liens (Méditerranée, Fjords, Antilles, Baltique).
// Les petites cases se soulèvent au survol. Polices : Bodoni Moda (titres) et Josefin Sans. Ni horaires ni lettre.
const perle = identite({
  key: "c245", label: "Perle, teal profond et cuivre", humeur: "light",
  fond: "#e8edf0", texte: "#10282c", discret: "#41585c", accent: "#a9501f", surface: "#ffffff", encre: "#0e4747", surEncre: "#e8edf0",
  police: "font.josefin-sans", titres: "font.bodoni-moda",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#10282c44",
});
const PERLE = "#e8edf0", TEAL = "#0e4747", CUIVRE2 = "#a9501f", ENCRE5 = "#10282c", PECHE = "#f0c9ad";
const planPont = modeleV2({
  id: identifiantV2(245, "plan-du-pont"), concept: "c-245-plan-du-pont",
  name: "Plan du pont", family: FAM,
  description: "Pour des croisières : une grande case teal avec l'appel à embarquer, accolée à trois petites cases empilées (garanties en texte d'exemple, coordonnées sur cuivre, quatre zones de navigation). Mosaïque asymétrique, perle, teal et cuivre.",
  tags: ["croisière", "mosaïque", "grande case", "garanties", "destinations", "teal", "cuivre", "perle", "angles droits"],
  identity: perle,
  racine: racineDe(PERLE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 26, PERLE, { fontWeight: "700", letterSpacing: "0.02em" });
    const phrase = G.geant(`<p>Embarquez<br>pour l'ailleurs.</p>`, { taille: [42, 92], tablette: { taille: [52, 76] }, mobile: { taille: [38, 52] }, lh: 1.02, suivi: "-0.015em", poids: "600", police: S.head, couleur: PERLE })(k, env);
    const grande = k.col([k.col([caps(k, "Croisières", { couleur: PECHE, suivi: "0.24em" }), nom], { gap: "10px" }), phrase, k.col([txt(k, "Choisissez votre cabine et votre mer : un conseiller vous accompagne jusqu'à l'embarquement.", { taille: 17, couleur: "#d8e6e6", max: "420px" }), btn(k, "Réserver une croisière", "/contact", { texte: TEAL, fond: PERLE, survol: PECHE, surSurvol: ENCRE5, focus: "#ffffff" })], { gap: "20px" })], { poids: 6, flexGrow: 6, flexBasis: "0px", minWidth: "340px", minHeight: "480px", justifyContent: "space-between", gap: "40px", backgroundColor: TEAL, paddingTop: "52px", paddingBottom: "52px", paddingLeft: "52px", paddingRight: "52px", borderRadius: "0px" }, undefined, { minWidth: "100%", minHeight: "0px", paddingTop: "36px", paddingBottom: "36px", paddingLeft: "22px", paddingRight: "22px" });
    const petite = (enfants, fond, bord) => { const c = k.col(enfants, { gap: "12px", flexGrow: 1, backgroundColor: fond, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "30px", paddingRight: "30px", borderStyle: "solid", borderWidth: bord ? "2px" : "0px", borderColor: bord || fond, borderRadius: "0px", transitionDuration: DOUX }, undefined, { paddingLeft: "20px", paddingRight: "20px" }); c.states = { hover: { transform: { y: -4 } } }; return c; };
    const caseGar = petite([caps(k, "Garanties", { couleur: CUIVRE2 }), txt(k, NOTE_GARANTIES, { taille: 14, couleur: ENCRE5 }), lien(k, "Conditions de vente", "/contact", { taille: 16, poids: "700", couleur: TEAL, survol: { color: CUIVRE2, transform: { x: 4 } }, focus: CUIVRE2, extra: { textDecoration: "underline" } })], "#ffffff", TEAL);
    const caseContact = petite([caps(k, "Un conseiller vous répond", { couleur: "#ffffff" }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: "#ffe3d0", focus: "#ffffff" })], CUIVRE2);
    const zones = k.row(["Méditerranée", "Fjords", "Antilles", "Baltique"].map((t) => lien(k, t, "/blog", { taille: 17, poids: "700", couleur: TEAL, survol: { color: CUIVRE2, transform: { y: -2 } }, focus: CUIVRE2, extra: { textDecoration: "underline" } })), { rowGap: "0px", columnGap: "24px" });
    const caseZones = petite([caps(k, "Mers à explorer", { couleur: TEAL }), zones], PERLE, TEAL);
    const colPetites = k.col([caseGar, caseContact, caseZones], { poids: 5, flexGrow: 5, flexBasis: "0px", minWidth: "300px", gap: "12px", alignItems: "stretch" });
    const mosaique = G.bande(k, [grande, colPetites], { fond: PERLE, gap: "12px", aligne: "stretch", padV: ["56px", "44px", "28px"], padB: ["40px", "32px", "24px"], padH: PAD, nom: "Mosaïque" });
    const bas = bandeMentions(k, env, G, { fond: PERLE, texte: "#41585c", liens: ENCRE5, filet: { epaisseur: "1px", couleur: "#10282c44" } });
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Voyages et tourisme", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits : damier de destinations, deux accueils, bandeau de circuits, nom monumental, mosaïque de croisière.",
  models: [damier, deuxAccueils, departImmediat, nomMaison, planPont],
};
