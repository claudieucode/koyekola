// Famille v2 « Optique et audition » — 5 modèles (ft2-444 à ft2-448), extension « standard pro animé » : AUCUNE illustration, ANGLES DROITS partout.
// Pieds d'opticien, d'audioprothésiste ou de centre « vue et audition » : sommaire numéroté des soins, tuiles, grille de cartes, annuaire en rangées, bandeau de coordonnées.
// Contenu utile et réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre ni certificat inventé.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce » par le moteur) : transitions de 360 ms ; soulignement et décalage de 4 à 10 px, fond de rangée qui s'éclaire, carte qui se soulève, bouton qui s'inverse,
// carré de statut qui « respire » à côté des horaires. Pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const A = require("../aides-std-s02");
const { racineDe, lien, caps, para, trait, souffle, carre, horaires, coordonnees, bloc, liste, lettre, nomDuSite, reseaux, mentions, DOUX } = A;

const FAM = "optique-audition";
const PAD = (v, b) => ({ padV: v, padB: b, padH: ["48px", "32px", "20px"] });
const WID = ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];

// ═══ ft2-444 « Bilan de vue » — opticien indépendant ═══════════════════════════════════════════════════════════════════════════════════════════
// Idée : un SOMMAIRE numéroté. À gauche, quatre grandes rangées 01 à 04 (Examen de vue, Lentilles, Montures, Solaires) : au survol la rangée s'éclaire et le libellé glisse. À droite, un cadre à filet : coordonnées et horaires.
// Une barre basse porte la lettre d'information et les mentions. Ivoire, bleu nuit et terre cuite ; Fraunces (titres) et Hanken Grotesk.
const bilan = identite({ key: "s444", label: "Ivoire, bleu nuit et terre cuite", humeur: "light", fond: "#f7f3ea", texte: "#14213d", discret: "#4a5568", accent: "#a8441f", surface: "#efe8d8", encre: "#14213d", police: "font.hanken-grotesk", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#14213d33" });
const NUIT = "#14213d", TERRE = "#a8441f", IVOIRE = "#f7f3ea";
const bilanDeVue = modeleV2({
  id: identifiantV2(444, "bilan-de-vue"), concept: "c-444-bilan-de-vue", name: "Bilan de vue", family: FAM,
  description: "Pour un opticien : un sommaire numéroté de quatre rangées (examen, lentilles, montures, solaires) qui s'éclairent au survol, un cadre de coordonnées et d'horaires, puis une barre de lettre et de mentions. Ivoire, bleu nuit, terre cuite.",
  tags: ["opticien", "sommaire numéroté", "ivoire", "bleu nuit", "terre cuite", "horaires", "angles droits"],
  identity: bilan, racine: racineDe(IVOIRE), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const rangee = (n, t, d, u, dernier) => {
      const lib = lien(k, t, u, { taille: 28, poids: "600", police: S.head, couleur: NUIT, h: "56px", survol: { color: TERRE, transform: { x: 10 } }, focus: TERRE });
      const r = k.row([caps(k, n, { couleur: TERRE, suivi: "0.16em", extra: { width: "36px" } }), G.colonne(k, [lib, para(k, d, { taille: 15, couleur: S.mute })], { gap: "0px", poids: 1, min: "200px" })], { gap: "16px", alignItems: "center", flexWrap: "nowrap", width: "100%", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "12px", paddingRight: "12px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderBottomWidth: dernier ? "1px" : "0px", borderColor: "#14213d55", borderRadius: "0px", transitionDuration: DOUX }, undefined, { flexWrap: "wrap" });
      r.states = { hover: { backgroundColor: "#efe8d8" } };
      return r;
    };
    const sommaire = G.colonne(k, [caps(k, "Nos soins", { couleur: TERRE, suivi: "0.2em" }), k.col([
      rangee("01", "Examen de vue", "Un bilan visuel complet, sur rendez-vous.", "/contact", false),
      rangee("02", "Lentilles", "Essai, adaptation et suivi.", "/faq", false),
      rangee("03", "Montures", "Toute la collection en magasin.", "/catalogue", false),
      rangee("04", "Solaires", "Protection et style au quotidien.", "/boutique", true),
    ], { gap: "0px", width: "100%" })], { poids: 7, min: "320px", gap: "16px" });
    const nom = nomDuSite(k, env, 30, NUIT);
    const pt = souffle(carre(k, TERRE, "10px"), 3000);
    const cadre = k.col([nom, trait(k, "#14213d55"), caps(k, "Coordonnées", { couleur: TERRE }), coordonnees(k, { taille: 15, lien: NUIT, survol: TERRE, focus: TERRE }), k.row([pt, caps(k, "Horaires", { couleur: TERRE })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })],
      { flexGrow: 4, flexBasis: "0px", minWidth: "280px", gap: "16px", boxSizing: "border-box", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", borderStyle: "solid", borderWidth: "2px", borderColor: NUIT, borderRadius: "0px", backgroundColor: "#ffffff" });
    const haut = G.bande(k, [sommaire, cadre], { fond: IVOIRE, gap: "40px 64px", aligne: "flex-start", ...PAD(["88px", "68px", "48px"], ["64px", "52px", "40px"]), nom: "Sommaire" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils vue et nouveautés, par courriel.", largeur: "440px", accent: "#ffffff", surBouton: NUIT, texte: "#e8ecf4", couleurTitre: "#ffffff", fond: NUIT, survolBouton: "#f1d9cd", survolTexte: NUIT, focus: "#ffffff" });
    const bas = G.bande(k, [G.ligne(k, [abo, k.col(liste(k, [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"]], { couleur: "#ffffff", accent: "#f1d9cd", taille: 15 }), { gap: "0px" })], { gap: "24px 80px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), trait(k, "#ffffff33"), mentions(k, env, G, { couleur: "#cdd5e3", liens: "#ffffff" })], { fond: NUIT, colonne: true, gap: "28px", ...PAD(["48px", "44px", "36px"], ["24px", "20px", "20px"]), innerMobile: { rowGap: "24px" }, couleur: "#ffffff", nom: "Lettre" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-445 « Salle d'écoute » — audioprothésiste ═════════════════════════════════════════════════════════════════════════════════════════════
// Idée : trois GRANDES TUILES numérotées (Bilan auditif, Appareils auditifs, Examen de vue) qui se soulèvent et s'éclaircissent au survol ; dessous, une bande d'infos (nom et bouton « Prendre rendez-vous », horaires et contact, réseaux carrés)
// puis la lettre d'information et les mentions. Graphite et menthe ; Sora et Inter.
const ecoute = identite({ key: "s445", label: "Graphite et menthe", humeur: "dark", fond: "#10161d", texte: "#e8eef2", discret: "#a9b6c0", accent: "#5eead4", surface: "#18212a", encre: "#10161d", police: "font.inter", titres: "font.sora", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e8eef233" });
const GRAPH = "#10161d", GRAPH2 = "#18212a", MENTHE = "#5eead4";
const salleEcoute = modeleV2({
  id: identifiantV2(445, "salle-d-ecoute"), concept: "c-445-salle-d-ecoute", name: "Salle d'écoute", family: FAM,
  description: "Pour un audioprothésiste : trois grandes tuiles numérotées (bilan, appareils, vue) qui se soulèvent au survol, une bande d'infos (rendez-vous, horaires, contact, réseaux carrés) puis la lettre et les mentions. Graphite et menthe.",
  tags: ["audioprothésiste", "audition", "tuiles", "graphite", "menthe", "colonnes", "réseaux", "angles droits"],
  identity: ecoute, racine: racineDe(GRAPH), widgets: ["sitetitle", "text", "link", "social", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const tuile = (num, t, u, sous, fond) => {
      const c = k.col([caps(k, num, { couleur: MENTHE, suivi: "0.2em" }), lien(k, t, u, { taille: 28, poids: "600", police: S.head, couleur: "#ffffff", h: "52px", survol: { color: MENTHE, transform: { x: 8 } }, focus: MENTHE }), lien(k, sous[0], sous[1], { taille: 15, poids: "500", couleur: S.mute, survol: { color: "#ffffff", textDecoration: "underline" }, focus: MENTHE })],
        { flexGrow: 1, flexBasis: "240px", gap: "6px", boxSizing: "border-box", paddingTop: "36px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", backgroundColor: fond, borderStyle: "solid", borderWidth: "1px", borderColor: "#e8eef233", borderRadius: "0px", transitionDuration: DOUX, minHeight: "190px", justifyContent: "space-between" });
      c.states = { hover: { backgroundColor: "#22303c", transform: { y: -5 } } };
      return c;
    };
    const tuiles = G.bande(k, [k.row([tuile("01 · Audition", "Bilan auditif", "/contact", ["Prendre rendez-vous ›", "/contact"], GRAPH2), tuile("02 · Appareils", "Appareils auditifs", "/catalogue", ["Voir la gamme ›", "/catalogue"], GRAPH2), tuile("03 · Vue", "Examen de vue", "/contact", ["Poser une question ›", "/faq"], GRAPH2)], { gap: "12px", alignItems: "stretch", width: "100%" })], { fond: GRAPH, colonne: true, ...PAD(["72px", "56px", "40px"], ["16px", "16px", "16px"]), nom: "Tuiles", couleur: "#ffffff" });
    const rdv = lien(k, "Prendre rendez-vous", "/contact", { taille: 16, poids: "700", couleur: GRAPH, h: "52px", padH: "26px", survol: { backgroundColor: "#ffffff", color: GRAPH, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: MENTHE, justifyContent: "center", alignSelf: "flex-start" } });
    const infos = G.bande(k, [G.colonne(k, [nomDuSite(k, env, 28, "#ffffff"), para(k, "Un bilan d'écoute simple, des explications claires, un suivi dans la durée.", { taille: 16, couleur: S.mute, largeur: "320px" }), rdv], { poids: 4, min: "280px", gap: "14px" }), G.colonne(k, [horaires(k, { taille: 15 }), coordonnees(k, { taille: 15, lien: "#ffffff", survol: MENTHE, focus: MENTHE })], { poids: 3, min: "240px", gap: "20px" }), G.colonne(k, [reseaux(k, env, ["facebook", "instagram", "youtube"], { couleur: "#ffffff", contour: "#ffffff55", survolFond: MENTHE, survolCouleur: GRAPH, focus: "#ffffff" })], { poids: 2, min: "200px" })], { fond: GRAPH, gap: "36px 48px", aligne: "flex-start", ...PAD(["48px", "40px", "32px"], ["48px", "40px", "32px"]), nom: "Infos", couleur: "#ffffff", filetHaut: { epaisseur: "1px", couleur: "#e8eef233" } });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Des conseils d'écoute, sans excès.", largeur: "460px", accent: MENTHE, surBouton: GRAPH, texte: "#e8eef2", couleurTitre: MENTHE, fond: GRAPH2, survolBouton: "#ffffff", survolTexte: GRAPH, focus: "#ffffff" });
    const bas = G.bande(k, [abo, k.col([mentions(k, env, G, { couleur: S.mute, liens: "#ffffff" })], { flexGrow: 0, justifyContent: "flex-end", gap: "0px", minWidth: "260px" })], { fond: GRAPH2, gap: "28px 48px", aligne: "flex-end", ...PAD(["44px", "36px", "32px"], ["24px", "20px", "20px"]), nom: "Lettre", couleur: "#ffffff" });
    return [G.racine(k, [tuiles, infos, bas])];
  },
}, FAM);

// ═══ ft2-446 « Monture et lentille » — centre vue et audition ══════════════════════════════════════════════════════════════════════════════════
// Idée : DEUX MOITIÉS bord à bord. À gauche un aplat vert profond avec la phrase « Voir juste. Entendre bien. » en grandes capitales et un bouton carré ; à droite, une grille 2 x 2 de cartes à angles droits
// (Lunettes, Lentilles, Audition, Entretien) qui se soulèvent. Une ligne légale blanche ferme le tout. Vert profond et blanc ; Archivo et Source Sans 3.
const vert = identite({ key: "s446", label: "Vert profond et blanc", humeur: "dark", fond: "#0f4c45", texte: "#ffffff", discret: "#cfe6e1", accent: "#f2c14e", surface: "#0a3631", encre: "#0f4c45", police: "font.source-sans-3", titres: "font.archivo", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff33" });
const VERT = "#0f4c45", VERT2 = "#0a3631", MIEL = "#f2c14e";
const monture = modeleV2({
  id: identifiantV2(446, "monture-et-lentille"), concept: "c-446-monture-et-lentille", name: "Monture et lentille", family: FAM,
  description: "Pour un centre vue et audition : deux moitiés bord à bord, un aplat vert avec la phrase d'accueil en grandes capitales et un bouton carré, face à quatre cartes (lunettes, lentilles, audition, entretien) qui se soulèvent. Vert profond et miel.",
  tags: ["optique", "audition", "deux moitiés", "grille de cartes", "vert profond", "miel", "capitales", "angles droits"],
  identity: vert, racine: racineDe(VERT2), widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "sitetitle", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Voir juste.<br>Entendre bien.</p>`, { taille: [44, 84], tablette: { taille: [64, 84] }, mobile: { taille: [40, 56] }, lh: 1, suivi: "-0.015em", poids: "800", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const btn = lien(k, "Réserver un bilan", "/contact", { taille: 16, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: VERT, h: "54px", padH: "30px", survol: { backgroundColor: VERT2, color: "#ffffff", transform: { x: 6 } }, focus: "#ffffff", extra: { backgroundColor: MIEL, justifyContent: "center", alignSelf: "flex-start" } });
    const nom = nomDuSite(k, env, 24, "#ffffff");
    const pt = souffle(carre(k, MIEL, "10px"), 3000);
    const gauche = k.col([nom, phrase, para(k, "Optique et audition sous le même toit : un seul rendez-vous, une équipe qui prend le temps.", { taille: 17, couleur: "#e4f1ee", largeur: "420px" }), btn, k.row([pt, caps(k, "Horaires", { couleur: MIEL })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: "#ffffff" })],
      { flexGrow: 6, flexBasis: "0px", minWidth: "420px", gap: "22px", boxSizing: "border-box", backgroundColor: VERT, borderRadius: "0px", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px" }, { paddingTop: "56px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const carteSoin = (t, d, u) => {
      const c = k.col([lien(k, t, u, { taille: 24, poids: "800", police: S.head, couleur: VERT, survol: { color: VERT2, transform: { x: 8 } }, focus: VERT }), para(k, d, { taille: 15, couleur: "#34524d" })],
        { flexGrow: 1, flexBasis: "240px", gap: "8px", boxSizing: "border-box", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: MIEL, borderRadius: "0px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", transitionDuration: DOUX, minHeight: "150px" });
      c.states = { hover: { transform: { y: -5 }, backgroundColor: "#fff8e3" } };
      return c;
    };
    const grille = k.row([carteSoin("Lunettes", "Montures et verres adaptés à votre vue.", "/catalogue"), carteSoin("Lentilles", "Essai, adaptation et conseils d'entretien.", "/faq"), carteSoin("Audition", "Bilan auditif et solutions d'appareillage.", "/contact"), carteSoin("Entretien", "Réglages, nettoyage et ajustements.", "/faq")], { gap: "12px", alignItems: "stretch", width: "100%" });
    const droite = k.col([caps(k, "Nos prestations", { couleur: "#0f4c45" }), grille, trait(k, "#0f4c4533"), G.ligne(k, [bloc(k, "Contact", [coordonnees(k, { taille: 15, couleur: VERT, lien: VERT, survol: "#0a3631", focus: VERT })], { couleurTitre: VERT, min: "220px" }), bloc(k, "Plus d'infos", liste(k, [["Actualités", "/blog"], ["Questions fréquentes", "/faq"]], { couleur: VERT, accent: "#0a3631" }), { couleurTitre: VERT, gap: "0px", min: "180px" })], { gap: "24px 40px", aligne: "flex-start", largeur: "100%" })],
      { flexGrow: 7, flexBasis: "0px", minWidth: "420px", gap: "24px", boxSizing: "border-box", backgroundColor: "#f4f1e8", borderRadius: "0px", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px" }, { paddingTop: "56px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const moities = G.bande(k, [gauche, droite], { fond: VERT, max: "100%", gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Moitiés" });
    const bas = G.bande(k, [mentions(k, env, G, { couleur: "#cfe6e1", liens: "#ffffff" })], { fond: VERT2, colonne: true, ...PAD(["28px", "24px", "24px"], ["20px", "18px", "18px"]), couleur: "#ffffff", nom: "Mentions" });
    return [G.racine(k, [moities, bas])];
  },
}, FAM);

// ═══ ft2-447 « Cabinet d'audition » — cabinet d'audioprothèse ═════════════════════════════════════════════════════════════════════════════════
// Idée : quatre colonnes de liens classés par catégories (Audition, Appareils, Accompagnement, Cabinet) coiffées d'un filet bleu, puis un BANDEAU DE COORDONNÉES (nom, trois cellules à filets : contact, horaires, bouton de rendez-vous), puis
// une rangée basse marine (lettre d'information et mentions). Blanc, marine et bleu ciel ; Manrope.
const cabinet = identite({ key: "s447", label: "Blanc, marine et bleu ciel", humeur: "light", fond: "#ffffff", texte: "#0b2447", discret: "#4a5b78", accent: "#1666c1", surface: "#eef4fb", encre: "#0b2447", police: "font.manrope", titres: "font.manrope", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0b244733" });
const MARINE = "#0b2447", CIEL = "#1666c1", GLACE = "#eef4fb";
const cabinetAudition = modeleV2({
  id: identifiantV2(447, "cabinet-d-audition"), concept: "c-447-cabinet-d-audition", name: "Cabinet d'audition", family: FAM,
  description: "Pour un cabinet d'audioprothèse : quatre colonnes de liens classés par catégories, un bandeau de trois cellules (contact, horaires, rendez-vous), puis une rangée marine avec la lettre et les mentions. Blanc, marine et bleu ciel.",
  tags: ["audioprothèse", "bandeau de contact", "colonnes classées", "blanc", "marine", "bleu ciel", "angles droits"],
  identity: cabinet, racine: racineDe(MARINE), widgets: WID.filter((w) => w !== "divider"),
  compose(k, env, G) {
    const S = k.S;
    const cellule = (titre, enfants, o = {}) => { const c = k.col([caps(k, titre, { couleur: CIEL }), ...enfants], { flexGrow: 1, flexBasis: "0px", minWidth: "260px", gap: "10px", boxSizing: "border-box", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: o.fond || GLACE, borderStyle: "solid", borderWidth: "0px", borderRightWidth: o.dernier ? "0px" : "1px", borderColor: "#0b244733", borderRadius: "0px", transitionDuration: DOUX, justifyContent: o.centre ? "center" : undefined }, undefined, { minWidth: "100%", borderRightWidth: "0px", borderBottomWidth: o.dernier ? "0px" : "1px" }); c.states = { hover: { backgroundColor: "#ffffff" } }; return c; };
    const pt = souffle(carre(k, CIEL, "10px"), 3000);
    const rdv = lien(k, "Prendre rendez-vous", "/contact", { taille: 16, poids: "700", couleur: "#ffffff", h: "52px", padH: "26px", survol: { backgroundColor: CIEL, color: "#ffffff", transform: { x: 6 } }, focus: CIEL, extra: { backgroundColor: MARINE, justifyContent: "center", alignSelf: "flex-start" } });
    const bandeau = k.row([cellule("Coordonnées", [coordonnees(k, { taille: 15, lien: MARINE, survol: CIEL, focus: CIEL })]), cellule("Horaires", [k.row([pt, para(k, "Ouvert sur rendez-vous", { taille: 14, couleur: S.mute })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })]), cellule("Rendez-vous", [para(k, "Un premier bilan, sans engagement : écrivez-nous.", { taille: 15, couleur: S.mute }), rdv], { dernier: true })], { gap: "0px", alignItems: "stretch", width: "100%", borderStyle: "solid", borderWidth: "2px", borderColor: MARINE, borderRadius: "0px" });
    const haut = G.bande(k, [G.colonne(k, [nomDuSite(k, env, 32, MARINE), bandeau], { gap: "28px", extra: { width: "100%", alignItems: "stretch" } })], { fond: "#ffffff", colonne: true, ...PAD(["24px", "20px", "20px"], ["64px", "52px", "40px"]), nom: "Bandeau" });
    const col = (t, paires) => bloc(k, t, liste(k, paires, { couleur: MARINE, accent: CIEL, taille: 16 }), { couleurTitre: MARINE, gap: "0px", min: "180px", extra: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: CIEL, borderRadius: "0px", paddingTop: "14px" } });
    const liens = G.bande(k, [G.ligne(k, [col("Audition", [["Bilan auditif", "/contact"], ["Dépistage", "/faq"]]), col("Appareils", [["Gamme d'appareils", "/catalogue"], ["Accessoires", "/boutique"]]), col("Accompagnement", [["Réglages", "/faq"], ["Entretien", "/faq"]]), col("Cabinet", [["Actualités", "/blog"], ["Espace patient", "/connexion"]])], { gap: "28px 36px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { fond: "#ffffff", colonne: true, ...PAD(["72px", "56px", "44px"], ["24px", "20px", "20px"]), nom: "Colonnes" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "L'actualité du cabinet, sans excès.", largeur: "440px", accent: "#ffffff", surBouton: MARINE, texte: "#e3ebf7", couleurTitre: "#ffffff", fond: MARINE, survolBouton: "#cfe2fa", survolTexte: MARINE, focus: "#ffffff" });
    const bas = G.bande(k, [abo, mentions(k, env, G, { couleur: "#c7d3e6", liens: "#ffffff" })], { fond: MARINE, gap: "28px 48px", aligne: "center", ...PAD(["48px", "40px", "36px"], ["24px", "20px", "20px"]), couleur: "#ffffff", nom: "Lettre" });
    return [G.racine(k, [liens, haut, bas])];
  },
}, FAM);

// ═══ ft2-448 « Atelier des verres » — atelier optique, lunetier ════════════════════════════════════════════════════════════════════════════════
// Idée : le NOM EN GRANDES CAPITALES sous un filet épais, puis un ANNUAIRE EN RANGÉES : une rangée par univers (Vue, Audition, Pratique), le titre à gauche et les liens en ligne ; la rangée entière s'éclaire au survol.
// Sous les rangées, une barre noire : horaires et contact à gauche, lettre et mentions à droite. Monochrome os et noir ; Instrument Serif (nom) et Public Sans.
const atelier = identite({ key: "s448", label: "Os et noir", humeur: "light", fond: "#ece9e2", texte: "#111111", discret: "#4a4a46", accent: "#111111", surface: "#dedad0", encre: "#111111", police: "font.public-sans", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#11111133" });
const OS = "#ece9e2", NOIR = "#111111";
const atelierVerres = modeleV2({
  id: identifiantV2(448, "atelier-des-verres"), concept: "c-448-atelier-des-verres", name: "Atelier des verres", family: FAM,
  description: "Pour un atelier d'optique : le nom du site en grandes capitales, trois rangées d'annuaire (vue, audition, pratique) qui s'éclairent au survol, puis une barre noire (horaires, contact, mentions). Monochrome os et noir.",
  tags: ["lunetier", "atelier", "annuaire en rangées", "monochrome", "os", "noir", "grand nom", "angles droits"],
  identity: atelier, racine: racineDe(NOIR), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 96, NOIR, { fontFamily: S.head, fontWeight: "400", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 0.95 });
    nom.styles.desktop = { ...nom.styles.desktop, fontSize: "fluid:44-120" };
    const tete = G.bande(k, [trait(k, NOIR, "6px"), nom, G.colonne(k, [para(k, "Verres, montures et réglages faits dans l'atelier.", { taille: 17, couleur: S.mute, largeur: "320px" })], { poids: 0, min: "240px", soi: "flex-end" })], { fond: OS, aligne: "flex-end", gap: "24px 48px", ...PAD(["56px", "48px", "36px"], ["32px", "28px", "24px"]), nom: "Nom" });
    const rangee = (titre, paires, dernier) => {
      const r = k.row([caps(k, titre, { couleur: NOIR, suivi: "0.2em", extra: { width: "180px", flexShrink: 0 } }), ...paires.map(([t, u]) => lien(k, t, u, { taille: 20, poids: "500", police: S.head, couleur: NOIR, survol: { color: NOIR, textDecoration: "underline", transform: { x: 4 } }, focus: NOIR, padH: "4px", extra: { marginRight: "24px" } }))], { alignItems: "center", gap: "8px 32px", width: "100%", boxSizing: "border-box", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderBottomWidth: dernier ? "1px" : "0px", borderColor: NOIR, borderRadius: "0px", transitionDuration: DOUX }, undefined, { flexDirection: "column", alignItems: "flex-start" });
      r.states = { hover: { backgroundColor: "#dedad0" } };
      return r;
    };
    const annuaire = G.bande(k, [k.col([rangee("Vue", [["Examen de vue", "/contact"], ["Montures", "/catalogue"], ["Lentilles", "/faq"], ["Solaires", "/boutique"]], false), rangee("Audition", [["Bilan auditif", "/contact"], ["Appareils", "/catalogue"], ["Entretien", "/faq"]], false), rangee("Pratique", [["Actualités", "/blog"], ["Espace client", "/connexion"]], true)], { gap: "0px", width: "100%" })], { fond: OS, colonne: true, ...PAD(["8px", "8px", "8px"], ["72px", "56px", "44px"]), nom: "Annuaire" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nouveautés de l'atelier, quelques fois par an.", largeur: "100%", accent: "#ffffff", surBouton: NOIR, texte: "#e9e6de", couleurTitre: "#ffffff", fond: NOIR, survolBouton: OS, survolTexte: NOIR, focus: "#ffffff" });
    const bas = G.bande(k, [G.colonne(k, [caps(k, "Horaires", { couleur: "#d6d2c8" }), horaires(k, { taille: 15, couleur: "#ffffff" }), trait(k, "#ffffff33"), caps(k, "Coordonnées", { couleur: "#d6d2c8" }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: "#d6d2c8", focus: "#ffffff" })], { poids: 1, min: "260px", gap: "14px" }), G.colonne(k, [abo, mentions(k, env, G, { couleur: "#d6d2c8", liens: "#ffffff" })], { poids: 1.4, min: "300px", gap: "28px", justifie: "space-between" })], { fond: NOIR, gap: "32px 72px", aligne: "flex-start", ...PAD(["56px", "48px", "40px"], ["24px", "20px", "20px"]), couleur: "#ffffff", nom: "Barre noire" });
    return [G.racine(k, [tete, annuaire, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Optique et audition", target: 5, built: true,
  description: "Pieds d'opticien et d'audioprothésiste, standard et très professionnels, à angles droits : sommaire numéroté, tuiles numérotées, deux moitiés avec cartes, bandeau de coordonnées, annuaire en rangées.",
  models: [bilanDeVue, salleEcoute, monture, cabinetAudition, atelierVerres],
};
