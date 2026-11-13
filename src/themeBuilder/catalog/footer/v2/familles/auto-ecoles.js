// Famille v2 « Auto-écoles et permis » — 5 modèles (ft2-449 à ft2-453), extension « standard pro animé » : AUCUNE illustration, ANGLES DROITS partout.
// Pieds d'auto-école, de moto-école ou de centre de formation au permis : grand bandeau d'appel, frise numérotée des étapes du permis, barre latérale + cartes de formules, colonnes classées, cartouche « plaque ».
// Contenu utile et réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUN tarif, taux de réussite, agrément ni chiffre inventé.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce » par le moteur) : transitions de 360 ms ; filet d'accent qui s'étire, cellule d'étape qui se remplit, carte qui se soulève, flèche qui glisse, bouton qui s'inverse,
// carré de statut qui « respire » à côté des horaires. Pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const A = require("../aides-std-s02");
const { racineDe, lien, caps, para, trait, souffle, carre, horaires, coordonnees, bloc, liste, lettre, nomDuSite, reseaux, mentions, DOUX } = A;

const FAM = "auto-ecoles";
const PAD = (v, b) => ({ padV: v, padB: b, padH: ["48px", "32px", "20px"] });
const WID = ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];

// ═══ ft2-449 « Code et conduite » — auto-école de quartier ═════════════════════════════════════════════════════════════════════════════════════
// Idée : un GRAND BANDEAU D'APPEL jaune (« Prêt à prendre la route ? » en capitales noires et deux boutons carrés qui s'inversent), puis trois rangées de liens étiquetées (Permis, Code, Élèves) face à une carte à contour jaune
// (coordonnées et horaires), et une fine bande de mentions. Jaune signalisation et noir ; Barlow Condensed (titres) et Barlow.
const code = identite({ key: "s449", label: "Jaune signalisation et noir", humeur: "dark", fond: "#111111", texte: "#f5f5f0", discret: "#bdbdb4", accent: "#ffd400", surface: "#1c1c1c", encre: "#111111", police: "font.barlow", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f5f5f033" });
const JAUNE = "#ffd400", NOIR = "#111111";
const codeConduite = modeleV2({
  id: identifiantV2(449, "code-et-conduite"), concept: "c-449-code-et-conduite", name: "Code et conduite", family: FAM,
  description: "Pour une auto-école : un grand bandeau jaune d'appel avec deux boutons carrés, puis trois rangées de liens étiquetées (permis, code, élèves) face à une carte à contour jaune avec coordonnées et horaires. Jaune signalisation et noir.",
  tags: ["auto-école", "permis", "bandeau d'appel", "jaune", "noir", "colonnes classées", "capitales", "angles droits"],
  identity: code, racine: racineDe(NOIR), widgets: WID.filter((w) => w !== "emailsubscribe" && w !== "sitetitle"),
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Prêt à prendre la route ?</p>`, { taille: [44, 104], tablette: { taille: [68, 104] }, mobile: { taille: [42, 60] }, lh: 0.98, suivi: "-0.01em", poids: "700", police: S.head, couleur: NOIR, extra: { textTransform: "uppercase" } })(k, env);
    const bouton = (t, u, plein) => lien(k, t, u, { taille: 16, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: plein ? JAUNE : NOIR, h: "56px", padH: "30px", survol: plein ? { backgroundColor: "#ffffff", color: NOIR, transform: { y: -3 } } : { backgroundColor: NOIR, color: JAUNE, transform: { y: -3 } }, focus: NOIR, extra: { backgroundColor: plein ? NOIR : undefined, borderStyle: "solid", borderWidth: "2px", borderColor: NOIR, justifyContent: "center" } });
    const appel = G.bande(k, [caps(k, "Auto-école", { couleur: NOIR, suivi: "0.24em" }), phrase, k.row([bouton("S'inscrire en ligne", "/inscription", true), bouton("Poser une question", "/faq", false)], { gap: "12px" })], { fond: JAUNE, colonne: true, gap: "24px", aligne: "flex-start", ...PAD(["80px", "60px", "44px"], ["72px", "56px", "40px"]), nom: "Appel", couleur: NOIR });
    const rangeeLiens = (titre, paires) => k.row([caps(k, titre, { couleur: JAUNE, police: S.head, taille: "14px", extra: { width: "120px", flexShrink: 0 } }), ...paires.map(([t, u]) => lien(k, t, u, { taille: 16, couleur: S.fg, padH: "0px", survol: { color: JAUNE, transform: { y: -2 } }, focus: JAUNE, extra: { marginRight: "28px" } }))], { gap: "0px", alignItems: "center", width: "100%", paddingTop: "6px", paddingBottom: "6px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f5f5f033", borderRadius: "0px" });
    const gauche = G.colonne(k, [rangeeLiens("Permis", [["Permis B", "/faq"], ["Conduite accompagnée", "/faq"], ["Heures de conduite", "/contact"]]), rangeeLiens("Code", [["Code de la route", "/faq"], ["Examen du code", "/faq"]]), rangeeLiens("Élèves", [["Inscription", "/inscription"], ["Espace élève", "/connexion"], ["Actualités", "/blog"]])], { poids: 6, min: "320px", gap: "10px" });
    const carte = k.col([caps(k, "Nous trouver", { couleur: JAUNE, police: S.head, taille: "14px" }), coordonnees(k, { taille: 15, lien: "#ffffff", survol: JAUNE, focus: JAUNE }), trait(k, "#f5f5f055"), horaires(k, { taille: 15 })], { flexGrow: 4, flexBasis: "0px", minWidth: "280px", gap: "14px", boxSizing: "border-box", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", borderStyle: "solid", borderWidth: "2px", borderColor: JAUNE, borderRadius: "0px", transitionDuration: DOUX });
    carte.states = { hover: { backgroundColor: "#1c1c1c" } };
    const corps = G.bande(k, [gauche, carte], { fond: NOIR, gap: "40px 64px", aligne: "flex-start", ...PAD(["64px", "52px", "44px"], ["56px", "44px", "36px"]), nom: "Liens", couleur: "#ffffff" });
    const bas = G.bande(k, [mentions(k, env, G, { couleur: S.mute, liens: "#ffffff" })], { fond: "#1c1c1c", colonne: true, ...PAD(["28px", "24px", "24px"], ["20px", "18px", "18px"]), nom: "Mentions", couleur: "#ffffff" });
    return [G.racine(k, [appel, corps, bas])];
  },
}, FAM);

// ═══ ft2-450 « Parcours du permis » — auto-école en ligne ou de ville ═════════════════════════════════════════════════════════════════════════
// Idée : une FRISE NUMÉROTÉE de cinq étapes côte à côte (1 Inscription, 2 Code, 3 Conduite, 4 Examen, 5 Permis) ; chaque cellule change de fond au survol et son libellé glisse.
// Dessous : le nom et les coordonnées face aux horaires et à la lettre d'information, puis une bande de mentions. Bleu marine et blanc, accent ambre ; Space Grotesk et Public Sans.
const parcours = identite({ key: "s450", label: "Bleu marine, blanc et ambre", humeur: "dark", fond: "#0e1f4d", texte: "#ffffff", discret: "#c3cdea", accent: "#ffb703", surface: "#13286a", encre: "#0e1f4d", police: "font.public-sans", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#ffffff33" });
const MAR = "#0e1f4d", MAR2 = "#13286a", AMBRE = "#ffb703";
const parcoursPermis = modeleV2({
  id: identifiantV2(450, "parcours-du-permis"), concept: "c-450-parcours-du-permis", name: "Parcours du permis", family: FAM,
  description: "Pour une auto-école : une frise de cinq étapes numérotées (inscription, code, conduite, examen, permis) dont les cellules se remplissent au survol, puis coordonnées, horaires et lettre. Bleu marine, blanc et ambre.",
  tags: ["auto-école", "frise numérotée", "étapes", "bleu marine", "ambre", "horaires", "lettre d'information", "angles droits"],
  identity: parcours, racine: racineDe(MAR), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const etape = (n, t, u) => {
      const c = k.col([caps(k, `0${n}`, { couleur: AMBRE, suivi: "0.18em", taille: "13px" }), lien(k, t, u, { taille: 22, poids: "600", police: S.head, couleur: "#ffffff", h: "52px", survol: { color: AMBRE, transform: { x: 6 } }, focus: AMBRE })],
        { flexGrow: 1, flexBasis: "160px", gap: "4px", boxSizing: "border-box", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: MAR2, borderStyle: "solid", borderWidth: "0px", borderRightWidth: n === 5 ? "0px" : "1px", borderColor: "#ffffff33", borderRadius: "0px", transitionDuration: DOUX, minHeight: "120px", justifyContent: "space-between" }, undefined, { flexBasis: "100%", borderRightWidth: "0px", borderBottomWidth: "1px", minHeight: "0px" });
      c.states = { hover: { backgroundColor: AMBRE } };
      c.states.hover = { backgroundColor: "#1b3589" };
      return c;
    };
    const frise = G.bande(k, [caps(k, "Du premier rendez-vous au jour de l'examen", { couleur: AMBRE, suivi: "0.2em" }), k.row([etape(1, "Inscription", "/inscription"), etape(2, "Code", "/faq"), etape(3, "Conduite", "/contact"), etape(4, "Examen", "/faq"), etape(5, "Permis", "/blog")], { gap: "0px", alignItems: "stretch", width: "100%", borderStyle: "solid", borderWidth: "2px", borderColor: AMBRE, borderRadius: "0px" })], { fond: MAR, colonne: true, gap: "20px", ...PAD(["72px", "56px", "40px"], ["48px", "40px", "32px"]), nom: "Frise" });
    const pt = souffle(carre(k, AMBRE, "10px"), 3000);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Infos code et permis, par courriel.", largeur: "100%", accent: AMBRE, surBouton: MAR, texte: "#e6ebf8", couleurTitre: AMBRE, fond: MAR2, survolBouton: "#ffffff", survolTexte: MAR, focus: "#ffffff" });
    const contact = G.bande(k, [G.colonne(k, [nomDuSite(k, env, 30, "#ffffff"), coordonnees(k, { taille: 15, lien: "#ffffff", survol: AMBRE, focus: AMBRE })], { poids: 5, min: "260px", gap: "16px" }), G.colonne(k, [horaires(k, { taille: 15 }), trait(k, "#ffffff33"), abo], { poids: 6, min: "300px", gap: "22px" })], { fond: MAR2, gap: "36px 64px", aligne: "flex-start", ...PAD(["52px", "44px", "36px"], ["52px", "44px", "36px"]), nom: "Contact", couleur: "#ffffff" });
    const bas = G.bande(k, [mentions(k, env, G, { couleur: S.mute, liens: "#ffffff" })], { fond: MAR, colonne: true, ...PAD(["28px", "24px", "24px"], ["20px", "18px", "18px"]), nom: "Mentions", couleur: "#ffffff" });
    void pt;
    return [G.racine(k, [frise, contact, bas])];
  },
}, FAM);

// ═══ ft2-451 « Formules du permis » — auto-école avec offres de formation ═════════════════════════════════════════════════════════════════════════
// Idée : quatre CARTES DE FORMULES à contour noir (Permis B, Conduite accompagnée, Code seul, Heures supplémentaires) qui se soulèvent, puis une bande verte de trois blocs (nom et réseaux carrés, coordonnées, horaires),
// puis une rangée de liens utiles et les mentions. Vert sapin et gris clair ; Albert Sans.
const piste = identite({ key: "s451", label: "Vert sapin et gris clair", humeur: "light", fond: "#eef1ee", texte: "#12301f", discret: "#3f5a4a", accent: "#0b6b3a", surface: "#e2e8e3", encre: "#12301f", police: "font.albert-sans", titres: "font.albert-sans", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#12301f33" });
const SAPIN = "#0b4a2a", GRIS = "#eef1ee";
const formulesPermis = modeleV2({
  id: identifiantV2(451, "formules-du-permis"), concept: "c-451-formules-du-permis", name: "Formules du permis", family: FAM,
  description: "Pour une auto-école qui présente ses formules : quatre cartes qui se soulèvent au survol, une bande verte (nom, réseaux carrés, contact, horaires), puis des liens utiles et les mentions. Vert sapin et gris clair.",
  tags: ["auto-école", "formules", "cartes", "bande verte", "vert sapin", "gris clair", "réseaux", "angles droits"],
  identity: piste, racine: racineDe(GRIS), widgets: ["sitetitle", "text", "link", "social", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const formule = (n, t, d, u) => {
      const c = k.col([caps(k, n, { couleur: "#0b6b3a", suivi: "0.18em" }), lien(k, t, u, { taille: 22, poids: "700", couleur: "#12301f", survol: { color: "#0b6b3a", transform: { x: 6 } }, focus: "#0b6b3a" }), para(k, d, { taille: 15, couleur: S.mute })],
        { flexGrow: 1, flexBasis: "220px", gap: "8px", boxSizing: "border-box", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: "#12301f", borderRadius: "0px", transitionDuration: DOUX, minHeight: "170px" });
      c.states = { hover: { transform: { y: -5 }, backgroundColor: "#f4faf6" } };
      return c;
    };
    const cartes = G.bande(k, [caps(k, "Nos formules", { couleur: "#0b6b3a", suivi: "0.2em" }), k.row([formule("01", "Permis B", "La formule complète, du code à l'examen.", "/faq"), formule("02", "Conduite accompagnée", "Rouler tôt, accompagné d'un proche.", "/faq"), formule("03", "Code seul", "Se préparer à l'épreuve théorique.", "/faq"), formule("04", "Heures en plus", "Quelques leçons pour reprendre confiance.", "/contact")], { gap: "14px", alignItems: "stretch", width: "100%" })], { fond: GRIS, colonne: true, gap: "20px", ...PAD(["72px", "56px", "40px"], ["56px", "44px", "36px"]), nom: "Formules" });
    const pt = souffle(carre(k, "#ffd166", "10px"), 3000);
    const vert = G.bande(k, [G.colonne(k, [caps(k, "Auto-école", { couleur: "#ffd166", suivi: "0.2em" }), nomDuSite(k, env, 30, "#ffffff"), reseaux(k, env, ["facebook", "instagram", "youtube"], { couleur: "#ffffff", contour: "#ffffff66", survolFond: "#ffd166", survolCouleur: SAPIN, focus: "#ffffff" })], { poids: 3, min: "240px", gap: "18px" }), G.colonne(k, [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: "#ffd166", focus: "#ffd166" })], { poids: 3, min: "240px" }), G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: "#ffd166" })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 3, min: "240px", gap: "12px" })], { fond: SAPIN, gap: "36px 48px", aligne: "flex-start", ...PAD(["52px", "44px", "36px"], ["52px", "44px", "36px"]), nom: "Coordonnées", couleur: "#ffffff" });
    const utiles = k.row(liste(k, [["Inscription", "/inscription"], ["Espace élève", "/connexion"], ["Actualités", "/blog"], ["Nous contacter", "/contact"]], { couleur: "#12301f", accent: "#0b6b3a", taille: 15 }), { gap: "4px 28px", flexWrap: "wrap" });
    const bas = G.bande(k, [utiles, mentions(k, env, G, { couleur: "#3f5a4a", liens: "#12301f" })], { fond: "#e2e8e3", gap: "12px 40px", aligne: "center", ...PAD(["28px", "24px", "24px"], ["20px", "18px", "18px"]), nom: "Liens utiles" });
    return [G.racine(k, [cartes, vert, bas])];
  },
}, FAM);

// ═══ ft2-452 « Départ au vert » — auto-école, moto-école ════════════════════════════════════════════════════════════════════════════════════════════
// Idée : trois cartes de liens classés (Passer le permis / Aides et pratique / L'auto-école) coiffées chacune d'une étiquette rouge et qui se soulèvent au survol, puis un bandeau blanc de lettre d'information
// (grand titre « Ne manquez rien de votre permis », champ à filet) ; bande noire d'horaires, coordonnées et mentions. Blanc cassé, rouge feu et noir ; DM Serif Display (titre) et DM Sans.
const feu = identite({ key: "s452", label: "Blanc cassé, rouge feu et noir", humeur: "light", fond: "#fbfaf7", texte: "#1a1a1a", discret: "#505050", accent: "#c62828", surface: "#f0eee8", encre: "#1a1a1a", police: "font.dm-sans", titres: "font.dm-serif-display", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1a1a1a33" });
const ROUGE = "#c62828", CASSE = "#fbfaf7", ENCRE = "#1a1a1a";
const departAuVert = modeleV2({
  id: identifiantV2(452, "depart-au-vert"), concept: "c-452-depart-au-vert", name: "Départ au vert", family: FAM,
  description: "Pour une auto-école : trois cartes de liens classés à étiquette rouge qui se soulèvent au survol, un bandeau de lettre d'information à grand titre, puis une bande noire d'horaires, coordonnées et mentions. Blanc cassé, rouge, noir.",
  tags: ["auto-école", "moto-école", "lettre d'information", "cartes de liens", "rouge", "blanc cassé", "noir", "angles droits"],
  identity: feu, racine: racineDe(ENCRE), widgets: WID.filter((w) => w !== "divider"),
  compose(k, env, G) {
    const S = k.S;
    const col = (t, paires) => { const c = k.col([k.T(`<p>${t}</p>`, { fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.14em", color: "#ffffff", backgroundColor: ROUGE, fontFamily: S.font, paddingTop: "8px", paddingBottom: "8px", paddingLeft: "14px", paddingRight: "14px", alignSelf: "flex-start", borderRadius: "0px", transitionDuration: DOUX }), ...liste(k, paires, { couleur: ENCRE, accent: ROUGE, taille: 16 })], { flexGrow: 1, flexBasis: "200px", gap: "0px", boxSizing: "border-box", paddingTop: "0px", paddingBottom: "20px", paddingLeft: "0px", paddingRight: "0px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#1a1a1a33", borderRadius: "0px", transitionDuration: DOUX }); c.children.slice(1).forEach((x) => { x.styles.desktop.marginLeft = "14px"; }); c.states = { hover: { backgroundColor: "#f7f5ef", transform: { y: -3 } } }; return c; };
    const colonnes = G.bande(k, [caps(k, "Auto-école et moto-école", { couleur: ROUGE, suivi: "0.2em" }), k.row([col("Passer le permis", [["Inscription", "/inscription"], ["Code de la route", "/faq"], ["Heures de conduite", "/contact"], ["Examen", "/faq"]]), col("Aides et pratique", [["Questions fréquentes", "/faq"], ["Actualités", "/blog"], ["Espace élève", "/connexion"]]), col("L'auto-école", [["Nous contacter", "/contact"], ["Cookies", "/cookies"]])], { gap: "16px", alignItems: "stretch", width: "100%" })], { fond: "#f0eee8", colonne: true, gap: "20px", ...PAD(["72px", "56px", "40px"], ["56px", "44px", "36px"]), nom: "Colonnes" });
    const titre = G.geant(`<p>Ne manquez rien<br>de votre permis.</p>`, { taille: [36, 68], tablette: { taille: [52, 68] }, mobile: { taille: [34, 44] }, lh: 1.05, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENCRE })(k, env);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Dates d'examen, conseils et actualités de l'auto-école.", largeur: "480px", accent: ROUGE, surBouton: "#ffffff", texte: ENCRE, couleurTitre: ROUGE, fond: CASSE, survolBouton: ENCRE, survolTexte: "#ffffff", focus: ENCRE, soulignement: "3px" });
    const lettreBande = G.bande(k, [G.colonne(k, [nomDuSite(k, env, 26, ENCRE), titre], { poids: 6, min: "320px", gap: "20px" }), G.colonne(k, [abo], { poids: 5, min: "300px", soi: "flex-end" })], { fond: CASSE, gap: "32px 64px", aligne: "flex-end", ...PAD(["64px", "52px", "40px"], ["64px", "52px", "40px"]), nom: "Lettre" });
    const bas = G.bande(k, [G.colonne(k, [caps(k, "Horaires", { couleur: "#ff8a80" }), horaires(k, { taille: 15, couleur: "#ffffff" })], { poids: 1, min: "260px", gap: "12px" }), G.colonne(k, [caps(k, "Coordonnées", { couleur: "#ff8a80" }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: "#ff8a80", focus: "#ffffff" })], { poids: 1, min: "260px", gap: "12px" }), G.colonne(k, [mentions(k, env, G, { couleur: "#d0d0d0", liens: "#ffffff" })], { poids: 1.2, min: "260px", justifie: "flex-end" })], { fond: ENCRE, gap: "28px 40px", aligne: "flex-start", ...PAD(["44px", "36px", "32px"], ["24px", "20px", "20px"]), couleur: "#ffffff", nom: "Mentions" });
    return [G.racine(k, [colonnes, lettreBande, bas])];
  },
}, FAM);

// ═══ ft2-453 « Plaque d'immatriculation » — auto-école, centre de formation ═══════════════════════════════════════════════════════════════════════
// Idée : un CARTOUCHE EN FORME DE PLAQUE : cadre épais à contour clair posant le nom du site en capitales, une barre bleue verticale à gauche, deux rangées de liens séparés par des barres obliques,
// et les horaires à droite ; en dessous, la lettre et les mentions sur fond anthracite. Anthracite, blanc et bleu plaque ; JetBrains Mono (étiquettes) et Hanken Grotesk.
const plaque = identite({ key: "s453", label: "Anthracite, blanc et bleu plaque", humeur: "dark", fond: "#1b1f27", texte: "#f2f4f8", discret: "#b4bccb", accent: "#4d8dff", surface: "#242a35", encre: "#1b1f27", police: "font.hanken-grotesk", titres: "font.jetbrains-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f2f4f833" });
const ANTH = "#1b1f27", BLEU = "#1f4fd8", CLAIR = "#4d8dff";
const plaqueModele = modeleV2({
  id: identifiantV2(453, "plaque-d-immatriculation"), concept: "c-453-plaque-d-immatriculation", name: "Plaque d'immatriculation", family: FAM,
  description: "Pour une auto-école ou un centre de formation : un cartouche en forme de plaque (cadre clair, barre bleue, nom en capitales, deux rangées de liens séparés par des barres obliques, horaires) puis lettre et mentions. Anthracite et bleu plaque.",
  tags: ["auto-école", "cartouche", "plaque", "anthracite", "bleu", "double rangée de liens", "horaires", "angles droits"],
  identity: plaque, racine: racineDe(ANTH), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 40, "#ffffff", { fontFamily: S.head, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700" });
    const barre = k.col([caps(k, "Permis", { couleur: "#ffffff", suivi: "0.2em", extra: { textAlign: "center" } })], { width: "56px", flexShrink: 0, alignSelf: "stretch", backgroundColor: BLEU, borderRadius: "0px", justifyContent: "center", alignItems: "center" }, undefined, { width: "100%", minHeight: "44px", alignSelf: "auto" });
    const sep = () => k.T("<p>/</p>", { fontSize: "16px", color: "#a9b3c6", fontFamily: S.head });
    const rangee = (paires) => { const out = []; paires.forEach(([t, u], i) => { if (i) out.push(sep()); out.push(lien(k, t, u, { taille: 16, poids: "600", couleur: "#ffffff", padH: "6px", survol: { color: CLAIR, textDecoration: "underline" }, focus: CLAIR })); }); return k.row(out, { gap: "0px 8px", alignItems: "center" }); };
    const pt = souffle(carre(k, CLAIR, "10px"), 3000);
    const milieu = k.col([nom, trait(k, "#f2f4f855", "1px"), rangee([["Inscription", "/inscription"], ["Code", "/faq"], ["Conduite", "/contact"], ["Examen", "/faq"]]), rangee([["Espace élève", "/connexion"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"]])], { flexGrow: 3, flexBasis: "0px", minWidth: "280px", gap: "14px", boxSizing: "border-box", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "32px" });
    const droite = k.col([k.row([pt, caps(k, "Horaires", { couleur: CLAIR })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "12px", boxSizing: "border-box", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "32px", backgroundColor: "#242a35", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#f2f4f855", borderRadius: "0px" }, undefined, { borderLeftWidth: "0px", borderTopWidth: "1px" });
    const cartouche = k.row([barre, milieu, droite], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", borderStyle: "solid", borderWidth: "3px", borderColor: "#f2f4f8", borderRadius: "0px", backgroundColor: "#1b1f27" });
    const haut = G.bande(k, [cartouche], { fond: ANTH, colonne: true, ...PAD(["72px", "56px", "40px"], ["40px", "32px", "28px"]), nom: "Plaque" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Dates d'examen et conseils, par courriel.", largeur: "440px", accent: CLAIR, surBouton: ANTH, texte: "#e6eaf2", couleurTitre: CLAIR, fond: ANTH, survolBouton: "#ffffff", survolTexte: ANTH, focus: "#ffffff" });
    const bas = G.bande(k, [G.ligne(k, [abo, bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: "#ffffff", survol: CLAIR, focus: CLAIR })], { couleurTitre: CLAIR, min: "240px", poids: 0 })], { gap: "28px 72px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), trait(k, "#f2f4f833"), mentions(k, env, G, { couleur: S.mute, liens: "#ffffff" })], { fond: ANTH, colonne: true, gap: "32px", ...PAD(["8px", "8px", "8px"], ["24px", "20px", "20px"]), innerMobile: { rowGap: "24px" }, couleur: "#ffffff", nom: "Lettre" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Auto-écoles et permis", target: 5, built: true,
  description: "Pieds d'auto-école, standard et très professionnels, à angles droits : bandeau d'appel jaune, frise des étapes du permis, colonne et cartes de formules, lettre en tête, cartouche en forme de plaque.",
  models: [codeConduite, parcoursPermis, formulesPermis, departAuVert, plaqueModele],
};
