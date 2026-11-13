// Famille v2 « Fitness, yoga et bien-être » — 6 modèles (ft2-398 à ft2-403), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Inspirations : captures 34/35 (logo + phrase + réseaux à gauche, colonnes à titre souligné, liste d'articles, contact à icônes) et 36 (nom monumental rogné, adresse / contact à gauche, repère carré au centre,
// réseaux et liens à droite, barre de mentions). IDÉES de composition reprises, jamais la copie : autres couleurs, proportions, contenus et marques fictives ; aucune photo ni logo copié.
// Un archétype différent par modèle : A colonne latérale · B nom monumental · C damier de cases · D barre unique · E deux demi-pages · F bandeau XXL + colonne étroite.
// Marques fictives ; AUCUNE coordonnée, horaire ni chiffre inventé : horaires, adresse et téléphone viennent des Données de l'entreprise du site. Intitulés de pratiques et d'articles = exemples à renommer dans l'éditeur.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 6 px) ; UNE animation visible par modèle (bouton ou carré qui « respire », case qui se remplit,
// ligne qui glisse) ; pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const DOUX = 360; // ms : durée des transitions de survol / focus
const PH = ["48px", "32px", "20px"]; // marges latérales de bande (bureau, tablette, mobile)

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(html.startsWith("<") ? html : `<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, compact({ color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align })));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, compact({ color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align })));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const reseaux = (G, k, env, o) => G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", ...o })(k, env);
// Liste de liens en colonne (chaque ligne glisse de 4 px au survol)
const listeLiens = (k, liste, o = {}) => liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.couleur, police: o.police, survol: o.survol || { color: k.S.accent, transform: { x: 4 } }, focus: o.focus, h: o.h }));
// Pied pleine largeur sans marges (la composition gère elle-même ses aplats)
const bandePleine = (G, k, enfants, o = {}) => G.bande(k, enfants, { padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", gap: "0px", aligne: "stretch", ...o });

const FAM = "fitness-bienetre";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-398 « Souffle du matin » — studio de yoga (archétype A, colonne latérale pleine hauteur ; inspiré des captures 34/35)
// Idée : colonne verte à gauche (nom, phrase, réseaux, bouton de réservation qui « respire »), zone crème à droite : pratiques, journal (titres d'articles à puce) et coordonnées à titre souligné d'un court trait.
const matin = identite({
  key: "c398", label: "Vert sauge et crème", humeur: "light",
  fond: "#f6f1e7", texte: "#23302a", discret: "#56625b", accent: "#a8481f", surface: "#ebe3d2", encre: "#2f4a3e", surEncre: "#f6f1e7",
  police: "font.cabin", titres: "font.tenor-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#23302a33",
});
const SAUGE = "#2f4a3e", CREME = "#f6f1e7", SABLE = "#e9c27a", BRIQUE = "#a8481f", ENCRE = "#23302a";
const souffleDuMatin = modeleV2({
  id: identifiantV2(398, "souffle-du-matin"), concept: "c-398-souffle-du-matin",
  name: "Souffle du matin", family: FAM,
  description: "Pour un studio de yoga : colonne verte à gauche avec nom, phrase, réseaux et bouton de réservation, zone crème à droite avec pratiques, journal, horaires et coordonnées. Vert sauge, crème et brique.",
  tags: ["yoga", "studio", "colonne latérale", "réservation", "journal", "sauge", "crème", "angles droits"],
  identity: matin,
  racine: racineDe(CREME),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>Souffle<br>du matin</p>`, { taille: [44, 76], tablette: { taille: [48, 64] }, mobile: { taille: [44, 52] }, lh: 1.02, suivi: "0", poids: "400", police: S.head, couleur: CREME })(k, env);
    const phrase = texte(k, "Un lieu calme pour respirer, bouger lentement et reprendre son souffle, à son rythme.", { taille: 16, couleur: "#d4e0d6", largeur: "320px" });
    const res = reseaux(G, k, env, { couleur: CREME, survol: SABLE, focus: SABLE });
    const resCol = k.col([caps(k, "Nous suivre", { couleur: SABLE, suivi: "0.2em" }), res], { gap: "6px" });
    const reserver = souffle(bouton(k, "Réserver une séance", "/contact", { texte: ENCRE, fond: SABLE, bord: SABLE, taille: 15, survol: { backgroundColor: CREME, borderColor: CREME, color: ENCRE, transform: { y: -3 } }, focus: CREME }), 4200);
    const lateral = GK.colonne(k, [nom, phrase, resCol, reserver], { poids: 4, min: "300px", gap: "30px", aligne: "flex-start", extra: { backgroundColor: SAUGE, paddingTop: "80px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "40px" }, mobile: { paddingTop: "48px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" } });
    const titre = (t) => k.col([k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "20px", color: ENCRE, lineHeight: 1.2 }), k.divider({ width: "34px", borderColor: BRIQUE, borderTopWidth: "3px", marginTop: "0px", marginBottom: "0px" })], { gap: "10px" });
    const pratiques = GK.colonne(k, [titre("Pratiques"), ...listeLiens(k, [["Hatha doux", "/catalogue"], ["Vinyasa", "/catalogue"], ["Yin et étirements", "/catalogue"], ["Respiration", "/catalogue"]], { couleur: ENCRE, survol: { color: BRIQUE, transform: { x: 4 } }, focus: BRIQUE })], { poids: 1, min: "180px", gap: "8px" });
    const journal = GK.colonne(k, [titre("Journal"), ...listeLiens(k, [["Bien démarrer le matin", "/blog"], ["Souplesse : par où commencer ?", "/blog"], ["Préparer sa première séance", "/blog"]], { couleur: ENCRE, taille: 15, survol: { color: BRIQUE, transform: { x: 4 } }, focus: BRIQUE, h: "52px" })], { poids: 1.2, min: "220px", gap: "8px" });
    const studio = GK.colonne(k, [titre("Le studio"), horaires(k, { couleur: ENCRE, taille: 15 }), coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: BRIQUE, focus: BRIQUE, taille: 15 })], { poids: 1.2, min: "220px", gap: "14px" });
    const colonnes = G.ligne(k, [pratiques, journal, studio], { gap: "36px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#56625b", liens: ENCRE, sansCookies: true })(k, env);
    const principal = GK.colonne(k, [colonnes, trait(k, "#23302a33"), mentions], { poids: 8, min: "300px", gap: "40px", justifie: "space-between", aligne: "stretch", extra: { paddingTop: "80px", paddingBottom: "28px", paddingLeft: "56px", paddingRight: "48px" }, mobile: { paddingTop: "44px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px" } });
    return [G.racine(k, [bandePleine(G, k, [lateral, principal], { fond: CREME, nom: "Studio" })])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-399 « Fonte » — salle de musculation (archétype B, nom monumental ; inspiré de la capture 36)
// Idée : le nom FONTE en énorme lettres condensées vert volt, rogné par le bord de la bande ; sous lui, trois zones : coordonnées à gauche, repère carré + bouton d'inscription au centre (le carré respire), réseaux et deux liens à droite.
const fonte = identite({
  key: "c399", label: "Graphite et vert volt", humeur: "dark",
  fond: "#16171a", texte: "#f0efe9", discret: "#a9aaa4", accent: "#d4ff3a", surface: "#202226", encre: "#16171a", surEncre: "#f0efe9",
  police: "font.chakra-petch", titres: "font.league-gothic",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f0efe933",
});
const GRAPH = "#16171a", VOLT = "#d4ff3a", OS = "#f0efe9";
const fonteModele = modeleV2({
  id: identifiantV2(399, "fonte"), concept: "c-399-fonte",
  name: "Fonte", family: FAM,
  description: "Pour une salle de musculation : le nom en énormes capitales vert volt rogné par le bord de la bande, puis coordonnées, repère carré avec bouton d'inscription, réseaux et liens. Graphite et vert volt.",
  tags: ["musculation", "salle", "nom monumental", "inscription", "graphite", "vert volt", "angles droits"],
  identity: fonte,
  racine: racineDe(GRAPH),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const coins = k.row([carre(k, VOLT, "18px"), caps(k, "Salle de musculation", { couleur: S.mute, suivi: "0.28em" }), carre(k, VOLT, "18px")], { justifyContent: "space-between", alignItems: "center", width: "100%" });
    const monument = G.nomRogne("FONTE", { taille: [140, 200], visible: 0.8, police: S.head, poids: "400", suivi: "0.01em", couleur: VOLT })(k);
    const haut = G.bande(k, [coins, monument], { fond: GRAPH, colonne: true, gap: "28px", padV: ["40px", "32px", "24px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Nom" });
    const gauche = bloc(k, "Adresse et contact", [coordonnees(k, { couleur: OS, lien: OS, survol: VOLT, focus: VOLT, taille: 16 })], { couleurTitre: VOLT, min: "240px", poids: 1 });
    const inscrire = souffle(bouton(k, "S'inscrire", "/inscription", { texte: GRAPH, fond: VOLT, survol: { backgroundColor: OS, borderColor: OS, color: GRAPH, transform: { y: -3 } }, focus: OS }), 3600);
    const centre = GK.colonne(k, [souffle(carre(k, VOLT, "56px"), 3000), inscrire], { poids: 1, min: "200px", aligne: "center", gap: "24px", extra: { alignSelf: "center" } });
    const droite = GK.colonne(k, [caps(k, "Réseaux", { couleur: VOLT }), reseaux(G, k, env, { couleur: OS, survol: VOLT, focus: VOLT }), caps(k, "Liens utiles", { couleur: VOLT, extra: { marginTop: "12px" } }), ...listeLiens(k, [["Planning des cours", "/blog"], ["Abonnements", "/faq"], ["Espace membre", "/connexion"]], { couleur: OS, survol: { color: VOLT, transform: { x: -4 } }, focus: VOLT })], { poids: 1, min: "220px", gap: "8px", aligne: "flex-start", extra: { alignSelf: "flex-start" } });
    const infos = G.bande(k, [gauche, centre, droite], { fond: GRAPH, gap: "36px 48px", aligne: "flex-start", padV: ["64px", "48px", "36px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Infos" });
    const mentions = G.ligneLegale({ taille: 13, couleur: S.mute, liens: OS, sansCookies: true })(k, env);
    const bas = G.bande(k, [trait(k, S.line), mentions], { fond: GRAPH, colonne: true, gap: "20px", padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, infos, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-400 « Casier souple » — studio de pilates (archétype C, damier de huit cases ; inspiré des captures 34/35, colonnes de liens)
// Idée : huit cases égales, violet profond et menthe : quatre cases-liens numérotées (cours, planning, tarifs, coachs) qui se remplissent de menthe au survol, puis horaires, coordonnées, réseaux et une case d'inscription qui respire.
const casier = identite({
  key: "c400", label: "Violet profond et menthe", humeur: "dark",
  fond: "#2b2150", texte: "#f4f1fb", discret: "#c6bfe0", accent: "#7ef0c9", surface: "#352a63", encre: "#2b2150", surEncre: "#f4f1fb",
  police: "font.spline-sans", titres: "font.gabarito",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f4f1fb33",
});
const VIOLET = "#2b2150", VIOLET2 = "#352a63", VIOLET3 = "#3f3376", MENTHE = "#7ef0c9", LILAS = "#f4f1fb";
const casierSouple = modeleV2({
  id: identifiantV2(400, "casier-souple"), concept: "c-400-casier-souple",
  name: "Casier souple", family: FAM,
  description: "Pour un studio de pilates : un damier de huit cases égales, quatre liens numérotés qui se remplissent de menthe, horaires, coordonnées, réseaux et une case d'inscription. Violet profond et menthe.",
  tags: ["pilates", "studio", "damier", "cases", "inscription", "violet", "menthe", "angles droits"],
  identity: casier,
  racine: racineDe(VIOLET),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const base = { flexGrow: 1, flexBasis: "25%", minWidth: "170px", minHeight: "170px", borderStyle: "solid", borderWidth: "1px", borderColor: "#f4f1fb22", paddingTop: "22px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "20px", gap: "14px", borderRadius: "0px", transitionDuration: DOUX };
    const caseLien = (num, nom, url, fond) => {
      const t = lien(k, nom, url, { taille: 24, poids: "600", police: S.head, couleur: LILAS, survol: { color: VIOLET }, focus: LILAS, h: "44px", extra: { width: "100%" } });
      const c = k.col(num === "01" || num === "03" ? [t] : [caps(k, num, { couleur: MENTHE, suivi: "0.2em" }), t], { ...base, backgroundColor: fond, ...(num === "01" || num === "03" ? { justifyContent: "flex-end" } : {}) });
      c.states = { hover: { backgroundColor: MENTHE, transform: { y: -4 } } };
      return c;
    };
    const caseInfo = (titre, enfants, fond) => k.col([caps(k, titre, { couleur: MENTHE }), ...enfants], { ...base, backgroundColor: fond, justifyContent: "flex-start" });
    const cInscr = lien(k, "Je m'inscris", "/inscription", { taille: 26, poids: "700", police: S.head, couleur: VIOLET, survol: { color: LILAS }, focus: VIOLET, h: "44px" });
    const caseInscr = souffle(k.col([caps(k, "Première séance", { couleur: VIOLET, suivi: "0.2em" }), cInscr], { ...base, backgroundColor: MENTHE }), 3800);
    caseInscr.states = { hover: { backgroundColor: "#a8f6dc", transform: { y: -4 } } };
    const toutes = k.row([
      caseLien("01", "Cours collectifs", "/catalogue", VIOLET2), caseInfo("Horaires", [horaires(k, { couleur: LILAS, taille: 14 })], VIOLET3), caseLien("02", "Planning", "/blog", VIOLET3), caseInfo("Coordonnées", [coordonnees(k, { couleur: LILAS, lien: LILAS, survol: MENTHE, focus: MENTHE, taille: 14 })], VIOLET2),
      caseInfo("Réseaux", [reseaux(G, k, env, { couleur: LILAS, survol: MENTHE, focus: MENTHE })], VIOLET3), caseLien("03", "Tarifs", "/faq", VIOLET2), caseInscr, caseLien("04", "Nos coachs", "/catalogue", VIOLET3),
    ], { gap: "0px", alignItems: "stretch", width: "100%" });
    const enseigne = G.bande(k, [G.geant(`<p>Studio souple</p>`, { taille: [32, 56], tablette: { taille: [36, 48] }, mobile: { taille: [30, 36] }, lh: 1, suivi: "-0.01em", poids: "700", police: S.head, couleur: LILAS })(k, env), caps(k, "Pilates et étirements", { couleur: MENTHE, suivi: "0.26em" })], { fond: VIOLET, gap: "10px 32px", aligne: "center", padV: ["40px", "32px", "28px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Enseigne" });
    const grille = bandePleine(G, k, [toutes], { fond: VIOLET, colonne: true, nom: "Cases" });
    const mentions = G.ligneLegale({ taille: 13, couleur: S.mute, liens: LILAS, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: VIOLET, colonne: true, padV: ["24px", "22px", "20px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [enseigne, grille, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-401 « Cap vitalité » — coaching nutrition et forme (archétype D, ligne unique compacte)
// Idée : deux lignes seulement. Barre corail : nom, quatre liens séparés par des barres obliques, bouton marine ; ligne marine dessous : réseaux et mentions. Compact, direct, aucune colonne.
const cap = identite({
  key: "c401", label: "Corail et marine", humeur: "light",
  fond: "#ff6b57", texte: "#10213b", discret: "#3b2a2a", accent: "#10213b", surface: "#ffd9d2", encre: "#10213b", surEncre: "#ffffff",
  police: "font.kumbh-sans", titres: "font.kanit",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#ffffff44",
});
const CORAIL = "#ff6b57", MARINE = "#10213b", BLANC = "#ffffff";
const capVitalite = modeleV2({
  id: identifiantV2(401, "cap-vitalite"), concept: "c-401-cap-vitalite",
  name: "Cap vitalité", family: FAM,
  description: "Pour un coach en nutrition et remise en forme : une barre corail compacte avec le nom, quatre liens séparés par des barres obliques et un bouton marine, puis une ligne marine avec réseaux et mentions.",
  tags: ["coaching", "nutrition", "barre compacte", "ligne unique", "corail", "marine", "angles droits"],
  identity: cap,
  racine: racineDe(MARINE),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = souffle(k.row([carre(k, MARINE, "16px"), G.geant(`<p>Cap vitalité</p>`, { taille: [30, 40], tablette: { taille: [30, 36] }, mobile: { taille: [30, 32] }, lh: 1.05, suivi: "0", poids: "700", police: S.head, couleur: MARINE })(k, env)], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), 3400);
    const items = [["Programmes", "/blog"], ["Recettes", "/blog"], ["Tarifs", "/faq"], ["Contact", "/contact"]];
    const cellules = items.map(([t, u], i) => k.col([caps(k, String(i + 1).padStart(2, "0"), { couleur: MARINE, taille: "11px", suivi: "0.2em" }), lien(k, t, u, { taille: 19, poids: "700", couleur: MARINE, survol: { color: BLANC, textDecoration: "underline", transform: { y: -2 } }, focus: MARINE })], { gap: "0px", paddingRight: "28px" }));
    const navigation = k.row(cellules, { gap: "4px 8px", alignItems: "flex-start", flexWrap: "wrap" });
    const rdv = bouton(k, "Bilan gratuit", "/contact", { texte: BLANC, fond: MARINE, h: "48px", taille: 15, survol: { backgroundColor: BLANC, borderColor: MARINE, color: MARINE, transform: { y: -3 } }, focus: BLANC });
    const res = reseaux(G, k, env, { couleur: MARINE, survol: BLANC, focus: MARINE, taille: 14 });
    const droite = k.row([res, rdv], { gap: "8px 24px", alignItems: "center", flexWrap: "wrap" });
    const barre = G.bande(k, [nom, droite], { fond: CORAIL, gap: "16px 36px", aligne: "center", padV: ["26px", "24px", "22px"], padB: ["14px", "12px", "12px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Barre" });
    const lignes = G.bande(k, [navigation], { fond: CORAIL, gap: "8px", aligne: "center", padV: ["0px", "0px", "0px"], padB: ["22px", "20px", "18px"], padH: PH, nom: "Liens" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#c9d2e3", liens: BLANC, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: MARINE, colonne: true, padV: ["18px", "16px", "14px"], padB: ["18px", "16px", "14px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [barre, lignes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-402 « Rive thermale » — spa et massages (archétype E, deux demi-pages bord à bord)
// Idée : à gauche un panneau vert profond avec la phrase « Prenez le temps. » en capitales de Cinzel et les réseaux ; à droite un panneau sable : énorme bouton de réservation (il respire), horaires, coordonnées, lettre d'information et mentions.
const rives = identite({
  key: "c402", label: "Vert thermal et sable", humeur: "dark",
  fond: "#12403f", texte: "#f3ead8", discret: "#bcd3cf", accent: "#e3b66a", surface: "#1a4f4d", encre: "#12403f", surEncre: "#f3ead8",
  police: "font.raleway", titres: "font.cinzel",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f3ead844",
});
const THERMAL = "#12403f", SABLE2 = "#eadfc6", OR = "#e3b66a", ENCRE2 = "#1d2b2a", CUIVRE = "#6f4509";
const deuxRives = modeleV2({
  id: identifiantV2(402, "rive-thermale"), concept: "c-402-rive-thermale",
  name: "Rive thermale", family: FAM,
  description: "Pour un spa : deux demi-pages bord à bord, un panneau vert thermal avec la phrase et les réseaux, un panneau sable avec le bouton de réservation, horaires, coordonnées et lettre d'information.",
  tags: ["spa", "massage", "deux panneaux", "réservation", "vert thermal", "sable", "angles droits", "horaires"],
  identity: rives,
  racine: racineDe(SABLE2),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Prenez<br>le temps.</p>`, { taille: [44, 84], tablette: { taille: [48, 72] }, mobile: { taille: [44, 54] }, lh: 1.08, suivi: "0.02em", poids: "500", police: S.head, couleur: S.fg, casse: "uppercase" })(k, env);
    const intro = texte(k, "Soins du corps, massages et moments de détente : un lieu pour ralentir.", { taille: 17, couleur: "#d3e2df", largeur: "340px" });
    const rubriques = listeLiens(k, [["Nos soins", "/catalogue"], ["Cartes cadeaux", "/catalogue"], ["Questions fréquentes", "/faq"]], { couleur: S.fg, survol: { color: OR, transform: { x: 5 } }, focus: OR });
    const abo = abonnement(k, env, { titre: "La lettre du spa", intro: "Offres de saison et conseils bien-être, de temps en temps.", bouton: "Je m'abonne", largeur: "440px", accent: OR, texte: S.fg });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: OR, lineHeight: 1.4 };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#d3e2df" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: THERMAL };
    abo.parts.button.states = { hover: { backgroundColor: S.fg, color: THERMAL }, focus: GK.focus(S.fg) };
    const gauche = GK.colonne(k, [phrase, intro, ...rubriques, abo], { poids: 1, min: "320px", gap: "26px", extra: { backgroundColor: THERMAL, paddingTop: "88px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "48px" }, mobile: { paddingTop: "48px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" } });
    const reserver = souffle(bouton(k, "Réserver un soin", "/contact", { texte: SABLE2, fond: THERMAL, taille: 22, h: "84px", poids: "700", police: S.head, extra: { width: "100%", maxWidth: "440px" }, survol: { backgroundColor: CUIVRE, borderColor: CUIVRE, color: "#ffffff", transform: { y: -4 } }, focus: THERMAL }), 4400);
    const hor = k.col([caps(k, "Horaires", { couleur: CUIVRE }), horaires(k, { couleur: ENCRE2, taille: 15 })], { gap: "10px", flexGrow: 1, flexBasis: "200px", minWidth: "190px" });
    const co = k.col([caps(k, "Coordonnées", { couleur: CUIVRE }), coordonnees(k, { couleur: ENCRE2, lien: ENCRE2, survol: CUIVRE, focus: CUIVRE, taille: 15 })], { gap: "10px", flexGrow: 1, flexBasis: "200px", minWidth: "190px" });
    const infos = G.ligne(k, [hor, trait(k, "#1d2b2a33"), co], { gap: "28px 36px", aligne: "flex-start", largeur: "100%" });
    const droite = GK.colonne(k, [reserver, infos, reseaux(G, k, env, { couleur: ENCRE2, survol: CUIVRE, focus: CUIVRE })], { poids: 1, min: "320px", gap: "36px", aligne: "stretch", extra: { backgroundColor: SABLE2, paddingTop: "88px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "56px" }, mobile: { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" } });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#3d4a48", liens: ENCRE2, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: SABLE2, colonne: true, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [bandePleine(G, k, [gauche, droite], { fond: SABLE2, nom: "Rive thermale" }), bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-403 « Dernier round » — club de boxe (archétype F, bandeau XXL en haut + colonne étroite de liens à droite)
// Idée : bandeau magenta d'appel à l'action « Montez sur le ring. » en très grandes capitales et énorme bouton blanc (il respire) ; dessous, bande noire : horaires et coordonnées à gauche, UNE colonne étroite de liens à filets à droite.
const round = identite({
  key: "c403", label: "Magenta vif et noir", humeur: "dark",
  fond: "#0d0d0f", texte: "#f5f3f1", discret: "#b7b3b0", accent: "#ff4fa3", surface: "#19191c", encre: "#0d0d0f", surEncre: "#ffffff",
  police: "font.gabarito", titres: "font.bowlby-one",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f5f3f133",
});
const NOIR3 = "#0d0d0f", MAGENTA = "#d6006f", ROSE3 = "#ff4fa3", BLANC3 = "#ffffff", CREME3 = "#f5f3f1";
const dernierRound = modeleV2({
  id: identifiantV2(403, "dernier-round"), concept: "c-403-dernier-round",
  name: "Dernier round", family: FAM,
  description: "Pour un club de boxe : un bandeau magenta d'appel à l'action en très grandes capitales avec un énorme bouton, puis une bande noire avec horaires, coordonnées et une seule colonne étroite de liens à filets.",
  tags: ["boxe", "club", "appel à l'action", "bandeau XXL", "colonne de liens", "magenta", "noir", "angles droits"],
  identity: round,
  racine: racineDe(NOIR3),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Montez<br>sur le ring.</p>`, { taille: [52, 150], tablette: { taille: [84, 120] }, mobile: { taille: [48, 76] }, lh: 1.0, suivi: "-0.01em", poids: "400", police: S.head, couleur: BLANC3, casse: "uppercase" })(k, env);
    const intro = texte(k, "Boxe, cardio et préparation physique : venez essayer, on s'occupe du reste.", { taille: 18, couleur: "#ffffff", largeur: "420px" });
    const cta = souffle(bouton(k, "Essayer une séance", "/inscription", { texte: MAGENTA, fond: BLANC3, taille: 20, h: "76px", extra: { width: "100%", maxWidth: "380px" }, survol: { backgroundColor: NOIR3, borderColor: NOIR3, color: BLANC3, transform: { y: -4 } }, focus: NOIR3 }), 3800);
    const gauche = GK.colonne(k, [phrase], { poids: 7, min: "300px" });
    const droite = GK.colonne(k, [intro, cta], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: MAGENTA, gap: "40px 64px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["80px", "64px", "44px"], padH: PH, nom: "Appel" });
    const rangs = [["Les disciplines", "/catalogue"], ["Planning", "/blog"], ["Tarifs", "/faq"], ["Espace membre", "/connexion"], ["Nous écrire", "/contact"]];
    const lignes = k.col(rangs.flatMap(([t, u], i) => [...(i ? [trait(k, "#f5f3f133")] : []), lien(k, t, u, { taille: 19, poids: "700", couleur: CREME3, h: "56px", bloc: true, survol: { color: ROSE3, transform: { x: 8 } }, focus: ROSE3, extra: { width: "100%" } })]), { gap: "0px", width: "100%" });
    const colLiens = GK.colonne(k, [caps(k, "Le club", { couleur: ROSE3 }), lignes], { poids: 3, min: "240px", gap: "14px" });
    const hor = bloc(k, "Horaires", [horaires(k, { couleur: CREME3, taille: 16 })], { couleurTitre: ROSE3, poids: 4, min: "240px" });
    const co = bloc(k, "Nous trouver", [coordonnees(k, { couleur: CREME3, lien: CREME3, survol: ROSE3, focus: ROSE3, taille: 16 }), k.col([caps(k, "Réseaux", { couleur: ROSE3, extra: { marginTop: "10px" } }), reseaux(G, k, env, { couleur: CREME3, survol: ROSE3, focus: ROSE3 })], { gap: "4px" })], { couleurTitre: ROSE3, poids: 4, min: "240px", gap: "14px" });
    const mentions = G.ligneLegale({ taille: 13, couleur: S.mute, liens: CREME3, sansCookies: true })(k, env);
    const bas = G.bande(k, [G.ligne(k, [hor, co, colLiens], { gap: "36px 56px", aligne: "flex-start", largeur: "100%" }), trait(k, S.line), mentions], { fond: NOIR3, colonne: true, gap: "40px", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Infos" });
    bas.styles.desktop.color = CREME3;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Fitness, yoga et bien-être", target: 6, built: true,
  description: "Pieds standard, angles droits, animations fluides : studio de yoga, salle de musculation, pilates, coaching nutrition, spa, club de boxe.",
  models: [souffleDuMatin, fonteModele, casierSouple, capVitalite, deuxRives, dernierRound],
};
