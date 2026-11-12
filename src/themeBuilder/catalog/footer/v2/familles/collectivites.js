// Famille v2 « Collectivités et services publics » — 6 modèles (ft2-386 à ft2-391), famille « inspirée de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds de mairies, communautés de communes et services publics locaux. Six archétypes de composition différents (voir DIVERSITE_STRICTE.md) : nom monumental (B), colonne latérale pleine hauteur (A),
// bandeau d'appel XXL + colonne étroite (F), index en lignes pleine largeur (G), damier de cases égales (C), papier à en-tête (J). Marques et communes FICTIVES ; AUCUNE coordonnée, horaire ni chiffre inventé :
// horaires, adresse et téléphone viennent des Données de l'entreprise du site (widgets « bizhours » / « bizcontact »). Les rubriques sont des intitulés d'EXEMPLE à renommer ; adresses de réseaux = exemples.
//
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 8 px) ; UNE animation visible par modèle (carré qui « respire », ligne d'index qui se décale,
// case qui se remplit, lien qui glisse) ; pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const DOUX = 360; // ms : durée des transitions de survol / focus

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: typeof o.taille === "string" ? o.taille : `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: o.aligne || "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, paddingTop: o.padV, paddingBottom: o.padV, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, fontStyle: o.style, ...(o.extra || {}) }));
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
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: o.casse === undefined ? "uppercase" : o.casse, suivi: o.suivi || "0.06em", couleur: o.texte, h: o.h || "54px", padH: o.padH || "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const PH = ["48px", "32px", "20px"]; // marges latérales des bandes (bureau, tablette, mobile)
const mentions = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);
const reseaux = (G, k, env, liste, o) => G.reseauxTexte(liste, { taille: 15, poids: "700", ...o })(k, env);
const RS = [["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]];

const FAM = "collectivites";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-386 « Façade de mairie » — archétype B (nom monumental seul, très peu de liens, grand vide) — inspiré de la capture « KENNEDY »
// Idée : le nom de la commune en capitales géantes, rogné par aucun cadre, sur papier chaud ; une seule rangée de trois liens et une barre terracotta. Tout le reste est du vide.
// Archivo 800 (nom) et Source Sans 3 (texte). Commune fictive « Valclair ».
const facadeId = identite({
  key: "c386", label: "Papier chaud et bleu de Prusse", humeur: "light",
  fond: "#f4f0e6", texte: "#10264f", discret: "#50473a", accent: "#a8400c", surface: "#e9e2d2", encre: "#10264f", surEncre: "#f4f0e6",
  police: "font.source-sans-3", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#10264f40",
});
const facadeMairie = modeleV2({
  id: identifiantV2(386, "facade-de-mairie"), concept: "c-386-facade-de-mairie",
  name: "Façade de mairie", family: FAM,
  description: "Pour une commune : le nom de la mairie en capitales géantes sur papier chaud, une barre terracotta, trois liens essentiels sur une ligne et la ligne légale. Beaucoup de vide, une seule idée. Bleu de Prusse et terracotta.",
  tags: ["mairie", "commune", "nom monumental", "minimal", "papier", "bleu", "terracotta", "angles droits"],
  identity: facadeId,
  racine: racineDe("#e9e2d2"),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const sceau = souffle(carre(k, "#a8400c", "12px"), 3600);
    const etiquette = k.row([sceau, caps(k, "Commune de Valclair · site officiel", { couleur: S.fg, suivi: "0.16em" })], { gap: "12px", alignItems: "center", justifyContent: "center", flexWrap: "nowrap", width: "100%" });
    const nom = G.geant(`<p>VALCLAIR</p>`, { taille: [50, 190], tablette: { taille: [110, 170] }, mobile: { taille: [50, 70] }, lh: 0.86, suivi: "-0.015em", poids: "800", police: S.head, couleur: S.fg, align: "center" })(k, env, true);
    const ciel = G.bande(k, [trait(k, S.fg, "2px"), etiquette, nom], { fond: "#f4f0e6", colonne: true, gap: "36px", padV: ["88px", "64px", "44px"], padB: ["64px", "48px", "36px"], padH: PH, innerMobile: { rowGap: "24px" }, nom: "Nom" });
    const barre = G.bande(k, [], { fond: "#a8400c", padV: ["10px", "9px", "8px"], padB: ["10px", "9px", "8px"], padH: ["0px", "0px", "0px"], nom: "Barre" });
    const liens = G.ligne(k, [["Démarches", "/faq"], ["Agenda et actualités", "/blog"], ["Contacter la mairie", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "600", couleur: S.fg, padH: "18px", survol: { color: "#a8400c", transform: { y: -2 }, textDecoration: "underline" }, focus: "#a8400c" })), { gap: "4px 24px", aligne: "center", justifie: "center", largeur: "100%" });
    const aide = G.colonne(k, [caps(k, "Pour aller droit au but", { couleur: "#a8400c", suivi: "0.2em", extra: { textAlign: "center", width: "100%" } }), liens], { gap: "8px", aligne: "stretch" });
    const aides = G.bande(k, [aide], { fond: "#e9e2d2", colonne: true, padV: ["40px", "36px", "32px"], padB: ["36px", "32px", "28px"], padH: PH, nom: "Liens" });
    const bas = G.bande(k, [mentions(G, k, env, { couleur: S.mute, liens: S.fg })], { fond: "#e9e2d2", colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [ciel, barre, aides, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-387 « Guichet latéral » — archétype A (colonne latérale pleine hauteur + zone principale) — inspiré de la capture « YMGrad » (logo + réseaux à gauche, colonnes de liens à droite)
// Idée : une haute colonne sapin à gauche (carré jaune de marque qui « respire », nom, réseaux) et, à droite sur crème, un titre, huit rubriques en cases blanches, puis horaires et contact de la mairie. Bande sapin pour les mentions.
// Zilla Slab (titres) et Work Sans (texte). Communauté fictive « Trois Rivières ». Mobile : la colonne passe au-dessus, les blocs s'empilent.
const guichetId = identite({
  key: "c387", label: "Vert sapin, jaune et crème", humeur: "dark",
  fond: "#0c3b2e", texte: "#f3f6f1", discret: "#b9cfc4", accent: "#ffc21a", surface: "#13503f", encre: "#0c3b2e", surEncre: "#f3f6f1",
  police: "font.work-sans", titres: "font.zilla-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f3f6f140",
});
const guichetLateral = modeleV2({
  id: identifiantV2(387, "guichet-lateral"), concept: "c-387-guichet-lateral",
  name: "Guichet latéral", family: FAM,
  description: "Pour une communauté de communes : une haute colonne vert sapin (carré jaune, nom, réseaux) à gauche, et à droite sur crème huit rubriques en cases blanches, les horaires et le contact. Mentions sur bande sapin.",
  tags: ["communauté de communes", "colonne latérale", "démarches", "horaires", "contact", "vert", "jaune", "angles droits"],
  identity: guichetId,
  racine: racineDe("#0c3b2e"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, SAPIN = "#0c3b2e", CREME = "#f7f4ea", VERT = "#0a6b4d";
    const logo = souffle(k.col([k.T("<p>3R</p>", { fontFamily: S.head, fontSize: "34px", fontWeight: "700", color: SAPIN, lineHeight: 1 })], { backgroundColor: "#ffc21a", width: "88px", height: "88px", alignItems: "center", justifyContent: "center", borderRadius: "0px" }), 3400);
    const nom = k.T("<p>Communauté de communes<br>des Trois Rivières</p>", { fontFamily: S.head, fontSize: "26px", lineHeight: 1.2, fontWeight: "700", color: S.fg });
    const intro = texte(k, "Un service public de proximité : démarches, équipements et projets du territoire.", { taille: 15, couleur: S.mute, largeur: "260px" });
    const gauche = G.colonne(k, [logo, nom, intro, G.reseauxTexte(RS, { taille: 15, poids: "700", couleur: S.fg, survol: "#ffc21a", focus: "#ffc21a" })(k, env)], { poids: 0, base: "340px", min: "280px", gap: "24px", extra: { backgroundColor: SAPIN, paddingTop: "72px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "40px", boxSizing: "border-box" }, tablette: { paddingLeft: "32px" }, mobile: { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px", flexBasis: "100%" } });
    const rubriques = [["État civil", "/faq"], ["Urbanisme", "/faq"], ["Élections", "/blog"], ["Aides et solidarité", "/faq"], ["Écoles et jeunesse", "/blog"], ["Déchets", "/faq"], ["Transports", "/faq"], ["Culture et sports", "/blog"]];
    const rangee = G.ligne(k, rubriques.map(([t, u]) => lien(k, t, u, { taille: 17, poids: "600", couleur: SAPIN, padH: "16px", extra: { borderStyle: "solid", borderWidth: "1px", borderColor: "#0c3b2e66", backgroundColor: "#ffffff" }, survol: { backgroundColor: SAPIN, color: "#ffffff", textDecoration: "none", transform: { y: -2 } }, focus: VERT })), { gap: "10px", aligne: "stretch", largeur: "100%" });
    const entete = G.colonne(k, [caps(k, "Les démarches de A à Z", { couleur: VERT }), k.T("<p>Trouvez le bon service en un clic.</p>", { fontFamily: S.head, fontSize: "fluid:28-44", lineHeight: 1.1, fontWeight: "700", color: SAPIN })], { gap: "10px", aligne: "stretch" });
    const mairie = k.row([G.colonne(k, [caps(k, "Accueil du public", { couleur: VERT }), horaires(k, { couleur: SAPIN })], { poids: 1, min: "240px", gap: "10px" }), G.colonne(k, [caps(k, "Nous contacter", { couleur: VERT }), coordonnees(k, { couleur: SAPIN, lien: SAPIN, survol: VERT, focus: VERT })], { poids: 1, min: "240px", gap: "10px" })], { rowGap: "24px", columnGap: "56px", alignItems: "flex-start", justifyContent: "space-between", width: "100%" });
    const droite = G.colonne(k, [entete, rangee, trait(k, "#0c3b2e40"), mairie], { poids: 1, min: "420px", base: "0px", gap: "36px", aligne: "stretch", extra: { backgroundColor: CREME, paddingTop: "72px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "48px", boxSizing: "border-box" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px", flexBasis: "100%", minWidth: "0px" } });
    const corps = G.bande(k, [gauche, droite], { fond: SAPIN, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Colonne et blocs" });
    const bas = G.bande(k, [mentions(G, k, env, { couleur: S.mute, liens: S.fg })], { fond: SAPIN, colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-388 « Démarche en ligne » — archétype F (bandeau d'appel XXL en haut + liens en UNE colonne étroite à droite) — inspiré de la capture « Bruno » (grande phrase + boutons, puis colonnes)
// Idée : un énorme bandeau ambre avec une phrase en serif (« Une démarche à faire ? ») et deux boutons ; dessous, sur bleu nuit, le nom de la ville à gauche et une seule colonne étroite de sept liens séparés par des filets à droite.
// DM Serif Display (titres) et Public Sans (texte). Ville fictive « Fontelune ».
const demarcheId = identite({
  key: "c388", label: "Bleu nuit et ambre", humeur: "dark",
  fond: "#0a1b33", texte: "#f2f5fa", discret: "#aebbd0", accent: "#ffb81c", surface: "#12294a", encre: "#0a1b33", surEncre: "#f2f5fa",
  police: "font.public-sans", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f2f5fa33",
});
const demarcheEnLigne = modeleV2({
  id: identifiantV2(388, "demarche-en-ligne"), concept: "c-388-demarche-en-ligne",
  name: "Démarche en ligne", family: FAM,
  description: "Pour une ville : un énorme bandeau ambre avec la phrase « Une démarche à faire ? » et deux boutons, puis sur bleu nuit le nom de la ville et une seule colonne étroite de liens à filets. Bleu nuit et ambre.",
  tags: ["ville", "démarches en ligne", "bandeau d'appel", "colonne de liens", "bleu nuit", "ambre", "serif", "angles droits"],
  identity: demarcheId,
  racine: racineDe("#0a1b33"),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NUIT = "#0a1b33", AMBRE = "#ffb81c";
    const phrase = G.geant(`<p>Une démarche<br>à faire&nbsp;?<br>Commencez en ligne.</p>`, { taille: [44, 120], tablette: { taille: [76, 104] }, mobile: { taille: [44, 64] }, lh: 1, suivi: "-0.02em", poids: "400", police: S.head, couleur: NUIT })(k, env);
    const b1 = souffle(bouton(k, "Mes démarches", "/connexion", { texte: AMBRE, fond: NUIT, bord: NUIT, survol: { backgroundColor: "#ffffff", color: NUIT, borderColor: NUIT, transform: { y: -3 } }, focus: NUIT }), 4000);
    const b2 = bouton(k, "Prendre rendez-vous", "/contact", { texte: NUIT, bord: NUIT, survol: { backgroundColor: NUIT, color: AMBRE, transform: { y: -3 } }, focus: NUIT });
    const appel = G.bande(k, [G.colonne(k, [phrase, k.row([b1, b2], { gap: "12px" })], { poids: 1, min: "300px", gap: "36px" })], { fond: AMBRE, colonne: true, padV: ["104px", "80px", "56px"], padB: ["104px", "80px", "56px"], padH: PH, nom: "Appel" });
    const ville = G.colonne(k, [caps(k, "Ville de Fontelune", { couleur: AMBRE, suivi: "0.22em" }), texte(k, "Les services de la ville, à portée de clic : démarches, agenda, équipements et vie locale.", { taille: 18, couleur: S.mute, largeur: "440px" }), G.reseauxTexte(RS, { taille: 15, poids: "700", couleur: S.fg, survol: AMBRE, focus: AMBRE })(k, env)], { poids: 3, min: "300px", gap: "24px" });
    const rapide = [["Actes d'état civil", "/faq"], ["Inscriptions scolaires", "/faq"], ["Stationnement et voirie", "/faq"], ["Associations", "/blog"], ["Agenda de la ville", "/blog"], ["Offres d'emploi", "/blog"], ["Signaler un problème", "/contact"]];
    const colonne = G.colonne(k, [caps(k, "Accès rapides", { couleur: S.mute }), ...rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: S.fg, bloc: true, h: "48px", survol: { color: AMBRE, transform: { x: 6 } }, focus: AMBRE, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f2f5fa33" } }))], { poids: 0, base: "300px", min: "240px", gap: "0px", mobile: { flexBasis: "100%" } });
    colonne.children[0] = k.col([colonne.children[0]], { paddingBottom: "12px" });
    const corps = G.bande(k, [ville, colonne], { fond: NUIT, gap: "48px 80px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Ville et accès" });
    const bas = G.bande(k, [mentions(G, k, env, { couleur: S.mute, liens: S.fg })], { fond: NUIT, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [appel, corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-389 « Sommaire citoyen » — archétype G (index en lignes pleine largeur : grand libellé, flèche, filet, sans cartes) — inspiré de la capture « YMGrad » (listes de rubriques)
// Idée : six rubriques en lignes pleine largeur, grand titre Fraunces, flèche à droite et courte précision dessous ; au survol la ligne se teinte et se décale de 8 px. Dessous, le contact de la mairie.
// Fraunces (titres) et Karla (texte). Mairie fictive « Pré-Haut ». Sable, brun encre et rouge brique.
const sommaireId = identite({
  key: "c389", label: "Sable, brun encre et rouge brique", humeur: "light",
  fond: "#f1ebde", texte: "#2a1c14", discret: "#5d4a3a", accent: "#b23a1e", surface: "#e6dcc8", encre: "#2a1c14", surEncre: "#f1ebde",
  police: "font.karla", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#2a1c1459",
});
const sommaireCitoyen = modeleV2({
  id: identifiantV2(389, "sommaire-citoyen"), concept: "c-389-sommaire-citoyen",
  name: "Sommaire citoyen", family: FAM,
  description: "Pour une mairie : six rubriques en lignes pleine largeur à grand titre serif, précision courte et flèche, qui se teintent et se décalent au survol, puis le contact de la mairie. Sable, brun encre, rouge brique.",
  tags: ["mairie", "sommaire", "index", "rubriques", "serif", "sable", "rouge brique", "angles droits"],
  identity: sommaireId,
  racine: racineDe("#e6dcc8"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#2a1c14", BRIQUE = "#9c2f15";
    const entete = k.T("<p>Mairie de Pré-Haut &nbsp;·&nbsp; <span style=\"color:#9c2f15\">Sommaire</span></p>", { fontFamily: S.font, fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.2em", color: ENCRE });
    const rubriques = [["Démarches administratives", "Papiers, état civil, urbanisme", "/faq"], ["Écoles et jeunesse", "Inscriptions, périscolaire, loisirs", "/faq"], ["Cadre de vie", "Voirie, propreté, environnement", "/blog"], ["Culture et sports", "Agenda, équipements, saisons", "/blog"], ["Solidarités", "Aides, seniors, accompagnement", "/faq"], ["Vie associative", "Annuaire, salles, subventions", "/contact"]];
    const ligneIndex = ([t, d, u]) => {
      const label = lien(k, t, u, { taille: "fluid:26-46", poids: "600", police: S.head, couleur: ENCRE, lh: 1.1, h: "56px", survol: { color: BRIQUE, textDecoration: "none" }, focus: BRIQUE, extra: { flexGrow: 1, flexBasis: "0px", minWidth: "0px" } });
      const fleche = k.T("<p>→</p>", { fontFamily: S.head, fontSize: "32px", lineHeight: 1, color: BRIQUE });
      const haut = k.row([label, fleche], { gap: "16px", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap", width: "100%" });
      const r = k.col([haut, texte(k, d, { taille: 15, couleur: S.mute, largeur: "520px" })], { gap: "0px", width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#2a1c1459", paddingLeft: "12px", paddingRight: "12px", paddingTop: "10px", paddingBottom: "14px", backgroundColor: "#f1ebde", transitionDuration: DOUX, borderRadius: "0px" });
      r.states = { hover: { backgroundColor: "#e6dcc8", transform: { x: 8 } } };
      return r;
    };
    const liste = k.col([...rubriques.map(ligneIndex)], { gap: "0px", width: "100%" });
    const pied = G.colonne(k, [caps(k, "Écrire à la mairie", { couleur: BRIQUE }), coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: BRIQUE, focus: BRIQUE })], { poids: 1, min: "260px", gap: "10px", aligne: "stretch" });
    const haut = G.bande(k, [entete, trait(k, ENCRE, "3px"), liste], { fond: "#f1ebde", colonne: true, gap: "24px", padV: ["72px", "56px", "40px"], padB: ["48px", "40px", "32px"], padH: PH, innerMobile: { rowGap: "16px" }, nom: "Sommaire" });
    const bas = G.bande(k, [pied, mentions(G, k, env, { couleur: S.mute, liens: ENCRE })], { fond: "#e6dcc8", colonne: true, gap: "32px", padV: ["40px", "36px", "32px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Contact" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-390 « Tableau d'affichage » — archétype C (damier de cases égales à angles droits, chaque case est un lien ou une information) — inspiré de la capture « YMGrad » (grilles de rubriques)
// Idée : huit cases égales séparées de filets fins : horaires et contact (widgets des Données de l'entreprise) et six liens de service ; une case lien se remplit de violet au survol et se soulève.
// IBM Plex Sans (titres et texte) et IBM Plex Mono (libellés). Ville fictive « Montrivage ». Aucune case n'est décorative.
const tableauId = identite({
  key: "c390", label: "Gris froid, blanc et violet administratif", humeur: "light",
  fond: "#eceaf2", texte: "#17212b", discret: "#4a5260", accent: "#5b2a86", surface: "#ffffff", encre: "#17212b", surEncre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#17212b33",
});
const tableauAffichage = modeleV2({
  id: identifiantV2(390, "tableau-d-affichage"), concept: "c-390-tableau-d-affichage",
  name: "Tableau d'affichage", family: FAM,
  description: "Pour une ville : un damier de huit cases égales à angles droits, horaires et contact de l'hôtel de ville, puis six services en cases qui se remplissent de violet au survol. Gris froid, blanc et violet administratif.",
  tags: ["ville", "damier", "cases égales", "services", "horaires", "violet", "gris", "angles droits"],
  identity: tableauId,
  racine: racineDe("#eceaf2"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#17212b", VIOLET = "#5b2a86", CASE = { flexGrow: 1, flexBasis: "240px", minWidth: "0px", boxSizing: "border-box", minHeight: "150px" };
    const info = (titre, enfant) => k.col([caps(k, titre, { couleur: VIOLET, police: S.head, suivi: "0.12em" }), enfant], { ...CASE, backgroundColor: "#ffffff", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px", gap: "10px", borderRadius: "0px" });
    const cellule = (t, u) => lien(k, `${t} ↗`, u, { taille: 21, poids: "600", couleur: ENCRE, bloc: true, h: "150px", aligne: "flex-end", padH: "20px", padV: "18px", lh: 1.2, survol: { backgroundColor: VIOLET, color: "#ffffff", transform: { y: -3 }, textDecoration: "none" }, focus: VIOLET, extra: { ...CASE, backgroundColor: "#ffffff", alignSelf: "stretch" } });
    const cases = [info("Horaires", horaires(k, { couleur: ENCRE, taille: 14 })), cellule("Démarches en ligne", "/connexion"), cellule("Agenda de la ville", "/blog"), info("Contact", coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: VIOLET, focus: VIOLET, taille: 14 })), cellule("Actualités", "/blog"), cellule("Espace citoyen", "/connexion"), cellule("Signaler un problème", "/contact"), cellule("Questions fréquentes", "/faq")];
    souffle(cases[1], 5200);
    const grille = k.row(cases, { gap: "2px", alignItems: "stretch", flexWrap: "wrap", width: "100%", backgroundColor: "#17212b33", paddingTop: "2px", paddingBottom: "2px", paddingLeft: "2px", paddingRight: "2px", boxSizing: "border-box", borderRadius: "0px" });
    const tete = k.row([k.T("<p>Hôtel de ville de Montrivage</p>", { fontFamily: S.head, fontSize: "20px", fontWeight: "600", color: ENCRE }), caps(k, "Tableau d'affichage", { couleur: VIOLET, police: S.head, suivi: "0.2em" })], { justifyContent: "space-between", alignItems: "baseline", width: "100%", rowGap: "8px", columnGap: "24px" });
    const bande = G.bande(k, [tete, grille, G.ligne(k, [reseaux(G, k, env, RS, { couleur: ENCRE, survol: VIOLET, focus: VIOLET }), mentions(G, k, env, { couleur: S.mute, liens: ENCRE })], { gap: "16px 48px", aligne: "center", justifie: "space-between", largeur: "100%" })], { fond: "#eceaf2", colonne: true, gap: "28px", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Damier" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-391 « Courrier de la commune » — archétype J (cartouche d'adresse centré, filets doubles, liens en ligne centrée)
// Idée : le pied ressemble à un courrier officiel : double filet, nom de la commune en grand serif italique, devise en capitales, coordonnées et horaires centrés, ligne de liens centrée, double filet. Crème, marine et or.
// Cormorant Garamond (titres) et Libre Franklin (texte). Commune fictive « Saint-Aubin ». Le carré d'or qui « respire » sert de sceau.
const papierId = identite({
  key: "c391", label: "Crème, marine et or", humeur: "light",
  fond: "#fffdf7", texte: "#1a2a4a", discret: "#4c5568", accent: "#7a5a12", surface: "#f3eedc", encre: "#1a2a4a", surEncre: "#fffdf7",
  police: "font.libre-franklin", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#1a2a4a59",
});
const courrierCommune = modeleV2({
  id: identifiantV2(391, "courrier-de-la-commune"), concept: "c-391-courrier-de-la-commune",
  name: "Courrier de la commune", family: FAM,
  description: "Pour une commune : un pied en courrier officiel, double filet, nom en grand serif italique, coordonnées et horaires centrés, ligne de liens centrée et sceau d'or. Crème, marine et or.",
  tags: ["commune", "courrier officiel", "centré", "filets doubles", "serif", "crème", "marine", "angles droits"],
  identity: papierId,
  racine: racineDe("#fffdf7"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, MARINE = "#1a2a4a", OR = "#7a5a12";
    const double = (c) => k.col([trait(k, c, "3px"), trait(k, c, "1px")], { gap: "4px", width: "100%" });
    const sceau = souffle(carre(k, "#c9a13b", "14px"), 3600);
    sceau.styles = { ...(sceau.styles || {}), desktop: { ...((sceau.styles || {}).desktop || {}), alignSelf: "center" } };
    const nom = G.geant(`<p><em>Commune de Saint-Aubin</em></p>`, { taille: [36, 84], tablette: { taille: [56, 76] }, mobile: { taille: [36, 48] }, lh: 1.02, suivi: "-0.01em", poids: "600", police: S.head, couleur: MARINE })(k, env, true);
    const devise = caps(k, "Mairie · État civil · Services à la population", { couleur: OR, suivi: "0.22em", extra: { textAlign: "center" } });
    const coord = G.colonne(k, [caps(k, "Adresse et contact", { couleur: OR }), coordonnees(k, { couleur: MARINE, lien: MARINE, survol: OR, focus: OR })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" });
    const horaire = G.colonne(k, [caps(k, "Accueil du public", { couleur: OR }), horaires(k, { couleur: MARINE })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" });
    const cartouche = G.ligne(k, [coord, k.col([], { width: "1px", alignSelf: "stretch", backgroundColor: "#1a2a4a59", flexShrink: 0 }), horaire], { rowGap: "32px", columnGap: "48px", aligne: "flex-start", justifie: "center", largeur: "100%", mobile: { rowGap: "28px" } });
    const liensLigne = G.ligne(k, [["Démarches", "/faq"], ["Actualités", "/blog"], ["Espace citoyen", "/connexion"], ["Nous écrire", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "600", couleur: MARINE, padH: "14px", survol: { color: OR, textDecoration: "underline" }, focus: OR })), { gap: "0px 10px", aligne: "center", justifie: "center", largeur: "100%" });
    const bande = G.bande(k, [double(MARINE), sceau, nom, devise, cartouche, liensLigne, trait(k, MARINE, "4px"), mentions(G, k, env, { couleur: S.mute, liens: MARINE })], { fond: "#fffdf7", colonne: true, gap: "28px", aligne: "stretch", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "24px" }, nom: "Courrier" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Collectivités et services publics", target: 6, built: true,
  description: "Pieds de mairies, communautés de communes et villes, angles droits, inspirés de captures : nom monumental, colonne latérale, bandeau d'appel, sommaire en lignes, damier de cases, papier à en-tête.",
  models: [facadeMairie, guichetLateral, demarcheEnLigne, sommaireCitoyen, tableauAffichage, courrierCommune],
};
