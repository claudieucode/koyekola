// Famille v2 « Engins et matériel professionnel » — 6 modèles (ft2-266 à ft2-271), pieds « inspirés de captures », REFAITS avec de vraies illustrations SVG (aides-illus-engfin.js).
// ANGLES DROITS partout, marques fictives, aucun chiffre ni coordonnée inventés ; gammes = EXEMPLES. MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, un carré qui respire par modèle.
const A = require("../aides-illus-engfin");
const { modeleV2, identifiantV2, identite, GK, Moteur, racineDe, lien, caps, trait, souffle, carre, horaires, coordonnees, bloc, lettre, nomDuSite, rangee, panneau, rangeeDe, mentionsBande, pastilles, fantome, colLiens, svgDeux, DOUX } = A;
const FAM = "engins-materiel";
const RES5 = ["facebook", "instagram", "youtube", "linkedin", "whatsapp"];
const bas = (k, env, G, fond, mute, liens, filet) => mentionsBande(k, env, G, fond, mute, liens, filet ? { filetHaut: { epaisseur: "1px", couleur: filet } } : {});
const tel = (k, env, G, o) => lettre(k, env, G, { titre: o.titre || "", intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "100%", accent: o.accent, texte: o.texte, surBouton: o.surBouton, fond: o.fond, fondChamp: o.fondChamp, rembChamp: "10px", focus: o.focus || o.texte, survolBouton: o.survolBouton, survolTexte: o.survolTexte });

// ═════════ ft2-266 « Nom de chantier » — capture 1 : colonnes + lettre en haut, GRAND EMBLÈME dessiné et NOM GÉANT en bas ═════════
const chantier = identite({ key: "c266", label: "Noir de fonte et jaune de chantier", humeur: "dark", fond: "#0b0b0b", texte: "#f4f1e6", discret: "#b7b3a6", accent: "#f2c230", surface: "#171717", encre: "#0b0b0b", police: "font.golos-text", titres: "font.saira-extra-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f4f1e633" });
const JAUNE = "#f2c230", NOIR = "#0b0b0b";
const nomDeChantier = modeleV2({
  id: identifiantV2(266, "nom-de-chantier"), concept: "c-266-nom-de-chantier", name: "Nom de chantier", family: FAM,
  description: "Pour un vendeur d'engins : sur noir de fonte, quatre colonnes de liens et une lettre d'information en haut, puis un grand emblème jaune dessiné (hexagone et bras de pelle) à côté du nom du site en capitales condensées géantes.",
  tags: ["engins", "chantier", "emblème dessiné", "nom monumental", "noir", "jaune", "capitales", "angles droits"],
  identity: chantier, racine: racineDe(NOIR),
  widgets: ["html", "sitetitle", "text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marque = k.col([...svgDeux(k, A.illEmblemeChantier(), null, { width: "64px" }), k.T("<p>Du matériel solide pour les équipes qui ne peuvent pas attendre.</p>", { fontSize: "17px", lineHeight: 1.5, color: S.fg, fontFamily: S.font, maxWidth: "260px" })], { gap: "20px", flexGrow: 1, flexBasis: "0px", minWidth: "220px" });
    const cols = [["Gammes", ["Terrassement", "Chargeuses", "Camions", "Levage", "Compacts"]], ["Solutions", ["Chantiers", "Flottes", "Location", "Financement"]], ["Assistance", ["Pièces", "Entretien", "Garantie", "Aide"]], ["Entreprise", ["À propos", "Recrutement", "Partenaires", "Contact"]]].map(([t, l]) => colLiens(k, t, l, { couleurTitre: S.mute, couleur: S.fg, survol: { color: JAUNE, transform: { x: 4 } }, focus: JAUNE, gap: "2px" }));
    const abo = k.col([souffle(carre(k, JAUNE, "12px"), 3000), tel(k, env, G, { intro: "Arrivages et alertes machines.", accent: JAUNE, texte: S.fg, surBouton: NOIR, fond: NOIR, fondChamp: "#1f1f1f", survolBouton: "#ffffff", survolTexte: NOIR })], { gap: "14px", flexGrow: 1, flexBasis: "0px", minWidth: "260px" });
    const haut = k.row([marque, ...cols, abo], { rowGap: "40px", columnGap: "32px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const emb = k.col(svgDeux(k, A.illEmblemeChantier()), { width: "30%", minWidth: "150px", flexShrink: 0 });
    const nom = nomDuSite(k, env, 120, "#ffffff", { fontWeight: "800", textTransform: "uppercase", lineHeight: 0.9, fontSize: "fluid:44-190", overflowWrap: "anywhere" });
    nom.parts.link.states = { hover: { color: JAUNE }, focus: GK.focus(JAUNE) };
    const monument = k.row([emb, k.col([nom], { flexGrow: 1, flexBasis: "0px", minWidth: "0px" })], { columnGap: "40px", rowGap: "16px", alignItems: "center", width: "100%", flexWrap: "nowrap" });
    const corps = G.bande(k, [haut, monument], { fond: NOIR, colonne: true, gap: "72px", padV: ["80px", "56px", "40px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "40px" }, nom: "Monument" });
    return [G.racine(k, [corps, bas(k, env, G, NOIR, "#b7b3a6", "#f4f1e6")])];
  },
}, FAM);

// ═════════ ft2-267 « Parc de machines » — capture 1 en CLAIR : chargeuse dessinée géante + nom XXL ; bande cobalt de colonnes ═════════
const parc = identite({ key: "c267", label: "Béton clair, cobalt et noir", humeur: "light", fond: "#dcdcd6", texte: "#14161a", discret: "#4a4d55", accent: "#1f4fd8", surface: "#ffffff", encre: "#14161a", police: "font.ibm-plex-sans-condensed", titres: "font.chakra-petch", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#14161a33" });
const COBALT = "#1f4fd8", ENCRE_B = "#14161a", BETON = "#dcdcd6";
const parcDeMachines = modeleV2({
  id: identifiantV2(267, "parc-de-machines"), concept: "c-267-parc-de-machines", name: "Parc de machines", family: FAM,
  description: "Pour un concessionnaire de machines : sur béton clair, une grande chargeuse dessinée et le nom du site en grand avec la lettre d'information ; en dessous, une bande cobalt avec quatre colonnes de liens et les horaires.",
  tags: ["machines", "concession", "chargeuse dessinée", "béton", "cobalt", "angles droits", "lettre d'information", "horaires"],
  identity: parc, racine: racineDe(BETON),
  widgets: ["html", "sitetitle", "text", "link", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 90, ENCRE_B, { fontWeight: "700", textTransform: "uppercase", lineHeight: 0.92, fontSize: "fluid:44-128", overflowWrap: "anywhere" });
    const droite = k.col([k.row([souffle(carre(k, COBALT, "14px"), 3000), caps(k, "Parc de machines neuves et d'occasion", { couleur: COBALT, suivi: "0.2em" })], { gap: "12px", alignItems: "center" }), nom, trait(k, "#14161a55", "2px"), caps(k, "Horaires", { couleur: ENCRE_B }), horaires(k, { taille: 15, couleur: ENCRE_B })], { gap: "22px", flexGrow: 1, flexBasis: "0px", minWidth: "300px" });
    const image = k.col(svgDeux(k, A.illChargeuse()), { flexGrow: 1.1, flexBasis: "0px", minWidth: "300px" });
    const haut = G.bande(k, [k.row([image, droite], { columnGap: "56px", rowGap: "32px", alignItems: "center", width: "100%", flexWrap: "wrap" })], { fond: BETON, colonne: true, padV: ["72px", "52px", "36px"], padB: ["64px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Parc" });
    const cols = [["Terrassement", ["Pelles", "Chargeuses", "Bouteurs"]], ["Levage", ["Grues", "Nacelles", "Chariots"]], ["Camions", ["Bennes", "Porteurs", "Remorques"]]].map(([t, l]) => colLiens(k, t, l, { couleurTitre: "#ffffff", couleur: "#ffffff", survol: { color: "#ffd84d", transform: { x: 4 } }, focus: "#ffffff", gap: "2px", min: "140px" }));
    const lettreC = k.col([caps(k, "Lettre du parc", { couleur: "#ffffff" }), tel(k, env, G, { intro: "Arrivages et reprises, sans bruit.", accent: "#ffd84d", texte: "#ffffff", surBouton: ENCRE_B, fond: COBALT, fondChamp: "#1a43b8", survolBouton: "#ffffff", survolTexte: ENCRE_B })], { gap: "12px", flexGrow: 1.6, flexBasis: "0px", minWidth: "280px" });
    const bandeCobalt = G.bande(k, [k.row([...cols, lettreC], { rowGap: "32px", columnGap: "40px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" })], { fond: COBALT, colonne: true, padV: ["56px", "44px", "36px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Colonnes" });
    return [G.racine(k, [haut, bandeCobalt, bas(k, env, G, BETON, "#4a4d55", ENCRE_B, "#14161a33")])];
  },
}, FAM);

// ═════════ ft2-268 « Console de flotte » — capture 1 : emblème (radar) + nom géant en bandeau, colonnes en fenêtre de console dessous ═════════
const console_ = identite({ key: "c268", label: "Bleu nuit, cyan et gris de console", humeur: "dark", fond: "#08111d", texte: "#d6e4f5", discret: "#93a9c6", accent: "#4cc9f0", surface: "#0f1b2d", encre: "#08111d", police: "font.overpass-mono", titres: "font.overpass-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#d6e4f533" });
const NUIT = "#08111d", FENETRE = "#0f1b2d", CYAN = "#4cc9f0", BARRE = "#16263d";
const consoleDeFlotte = modeleV2({
  id: identifiantV2(268, "console-de-flotte"), concept: "c-268-console-de-flotte", name: "Console de flotte", family: FAM,
  description: "Pour un gestionnaire de parc d'engins : un grand radar de flotte dessiné (cercles, itinéraires, repères) avec le nom du site en grand, puis le pied en fenêtre de terminal : commandes cyan, gammes en liens, horaires, coordonnées et lettre d'information.",
  tags: ["flotte", "parc", "radar dessiné", "console", "mono", "bleu nuit", "cyan", "angles droits"],
  identity: console_, racine: racineDe(NUIT),
  widgets: ["html", "sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cmd = (t) => k.T(`<p><span style="color:${CYAN}">$</span> ${t}</p>`, { fontSize: "15px", fontWeight: "700", color: S.fg, fontFamily: S.font, lineHeight: 1.4 });
    const nom = nomDuSite(k, env, 90, "#ffffff", { fontWeight: "800", textTransform: "uppercase", lineHeight: 0.95, fontSize: "fluid:40-120", overflowWrap: "anywhere" });
    const texte = k.col([k.row([souffle(carre(k, CYAN, "12px"), 2800), caps(k, "Flotte connectée en direct", { couleur: CYAN, suivi: "0.22em" })], { gap: "12px", alignItems: "center" }), nom, k.T("<p>Suivez vos engins, vos alertes et vos entretiens sur un seul écran.</p>", { fontSize: "18px", lineHeight: 1.5, color: S.mute, fontFamily: S.font, maxWidth: "480px" })], { gap: "24px", flexGrow: 1.2, flexBasis: "0px", minWidth: "300px" });
    const radar = k.col(svgDeux(k, A.illRadar(), null, { maxWidth: "460px" }), { flexGrow: 1, flexBasis: "0px", minWidth: "260px", alignItems: "center" });
    const bandeau = G.bande(k, [k.row([texte, radar], { columnGap: "48px", rowGap: "32px", alignItems: "center", width: "100%", flexWrap: "wrap" })], { fond: NUIT, colonne: true, padV: ["72px", "52px", "36px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Radar" });
    const titre = k.row([carre(k, "#d6e4f5", "10px"), carre(k, "#93a9c6", "10px"), carre(k, CYAN, "10px"), k.T("<p>flotte — pied de page</p>", { fontSize: "13px", color: S.mute, fontFamily: S.font, marginLeft: "12px" })], { gap: "8px", alignItems: "center", backgroundColor: BARRE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "20px", paddingRight: "20px", width: "100%" });
    const gammes = ["Terrassement", "Levage", "Camions", "Compacts", "Location", "Service"].map((t) => lien(k, `> ${t}`, "/contact", { taille: 16, poids: "600", couleur: S.fg, bloc: true, h: "44px", survol: { color: CYAN, transform: { x: 8 } }, focus: CYAN, extra: { width: "100%" } }));
    const colG = k.col([cmd("ls gammes"), ...gammes], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "8px" });
    const colD = k.col([cmd("cat horaires"), horaires(k, { taille: 15, couleur: S.fg }), cmd("cat contact"), coordonnees(k, { taille: 15, couleur: S.fg, lien: CYAN, survol: "#ffffff", focus: CYAN })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "14px" });
    const abo = tel(k, env, G, { intro: "Nouvelles gammes et alertes du parc, par e-mail.", bouton: "Valider", largeur: "560px", accent: CYAN, texte: S.fg, surBouton: NUIT, fond: FENETRE, fondChamp: NUIT, survolBouton: "#ffffff", survolTexte: NUIT });
    const pad = [{ paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px" }];
    const corps = k.col([k.row([colG, colD], { rowGap: "32px", columnGap: "56px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" }), trait(k, "#d6e4f533"), cmd("subscribe --email"), abo], { gap: "20px", backgroundColor: FENETRE, paddingTop: "32px", paddingBottom: "36px", ...pad[0], width: "100%" }, pad[1], pad[2]);
    const etat = k.col([G.ligneLegale({ taille: 13, sansCookies: true, couleur: S.mute, liens: S.fg })(k, env)], { backgroundColor: BARRE, paddingTop: "10px", paddingBottom: "10px", ...pad[0], width: "100%" }, pad[1], pad[2]);
    const fenetre = k.col([titre, corps, etat], { gap: "0px", width: "100%", maxWidth: "1280px", borderStyle: "solid", borderWidth: "1px", borderColor: "#d6e4f544", borderRadius: "0px" });
    return [G.racine(k, [bandeau, G.bande(k, [fenetre], { fond: NUIT, colonne: true, aligne: "center", padV: ["8px", "8px", "8px"], padB: ["40px", "32px", "24px"], padH: ["48px", "32px", "16px"], nom: "Fenêtre" })])];
  },
}, FAM);

// ═════════ ft2-269 « Barre d'atelier » — capture 1 : panneau orange avec ENGRENAGES géants rognés et nom ; panneau noir de listes ═════════
const atelier = identite({ key: "c269", label: "Orange sécurité et noir d'atelier", humeur: "dark", fond: "#15130f", texte: "#f7f5f0", discret: "#c9c4b6", accent: "#ff6a00", surface: "#211e18", encre: "#15130f", police: "font.instrument-sans", titres: "font.rajdhani", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f7f5f033" });
const ORANGE = "#ff6a00", ENCRE_O = "#15130f", PAPIER_O = "#f7f5f0";
const barreAtelier = modeleV2({
  id: identifiantV2(269, "barre-d-atelier"), concept: "c-269-barre-d-atelier", name: "Barre d'atelier", family: FAM,
  description: "Pour un atelier de pièces et de maintenance : un panneau orange sécurité avec deux grands engrenages noirs dessinés, rognés, et le nom du site ; à côté, un panneau noir avec trois listes, un bouton devis, les horaires et les coordonnées.",
  tags: ["atelier", "maintenance", "pièces", "engrenages dessinés", "orange", "noir", "angles droits", "horaires"],
  identity: atelier, racine: racineDe(ENCRE_O),
  widgets: ["html", "sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 60, ENCRE_O, { fontWeight: "700", textTransform: "uppercase", lineHeight: 0.95, fontSize: "fluid:40-96", overflowWrap: "anywhere" });
    const gauche = k.col([k.row([souffle(carre(k, ENCRE_O, "12px"), 3000), caps(k, "Pièces, entretien, dépannage", { couleur: ENCRE_O, suivi: "0.2em" })], { gap: "10px", alignItems: "center", paddingTop: "56px", paddingLeft: "48px", paddingRight: "32px" }), k.col([nom], { paddingLeft: "48px", paddingRight: "32px", paddingTop: "16px" }),
      k.col(svgDeux(k, A.illEngrenages(), null, { maxWidth: "560px" }), { marginTop: "auto", paddingTop: "24px", width: "100%", overflow: "hidden" })],
      { flexGrow: 1, flexBasis: "0px", minWidth: "340px", backgroundColor: ORANGE, gap: "0px", justifyContent: "flex-start", alignItems: "stretch", overflow: "hidden" });
    const liste = (t, items) => k.col([caps(k, t, { couleur: ORANGE, suivi: "0.22em" }), ...items.map((x) => rangee(k, x, "/contact", { couleur: PAPIER_O, police: S.head, taille: 22, poids: "600", h: "48px", padH: "4px", fondSurvol: ORANGE, couleurSurvol: ENCRE_O, focus: ORANGE, ligne: "#f7f5f044" }))], { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "0px" });
    const listes = k.row([liste("Machines", ["Pelles", "Chargeuses", "Compacteurs", "Nacelles"]), liste("Pièces et service", ["Pièces d'origine", "Entretien", "Dépannage", "Garantie"])], { rowGap: "28px", columnGap: "40px", flexWrap: "wrap", width: "100%", alignItems: "flex-start" });
    const devis = lien(k, "Demander un devis", "/contact", { taille: 18, poids: "800", couleur: ENCRE_O, casse: "uppercase", suivi: "0.06em", h: "60px", padH: "28px", survol: { backgroundColor: "#ffffff", color: ENCRE_O, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: ORANGE, borderStyle: "solid", borderWidth: "2px", borderColor: ORANGE } });
    const droite = panneau(k, [listes, devis, trait(k, "#f7f5f044"), k.row([k.col([caps(k, "Horaires", { couleur: ORANGE }), horaires(k, { taille: 15, couleur: PAPIER_O })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "200px" }), k.col([caps(k, "Coordonnées", { couleur: ORANGE }), coordonnees(k, { taille: 15, couleur: PAPIER_O, lien: PAPIER_O, survol: ORANGE, focus: ORANGE })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "200px" })], { rowGap: "24px", columnGap: "32px", flexWrap: "wrap", width: "100%", alignItems: "flex-start" })],
      { fond: ENCRE_O, poids: 1, min: "340px", gap: "32px", padV: ["64px", "48px", "40px"], padH: ["56px", "40px", "20px"] });
    return [G.racine(k, [G.bande(k, [rangeeDe(k, [gauche, droite])], { fond: ENCRE_O, colonne: true, max: "100%", ...A.PAGE_LARGEUR, aligne: "stretch", nom: "Pleine largeur" }), bas(k, env, G, ENCRE_O, "#c9c4b6", PAPIER_O, "#f7f5f033")])];
  },
}, FAM);

// ═════════ ft2-270 « Escalier de location » — capture 2 : EN-TÊTE scindé (titre italique + bouton à gauche, mini-pelle sur dalle à droite), puis logo, liens et pastilles ═════════
const escalier = identite({ key: "c270", label: "Brun de chantier, orange braise et crème", humeur: "dark", fond: "#150a06", texte: "#f6ead9", discret: "#cdb5a2", accent: "#ff7a1a", surface: "#241309", encre: "#150a06", police: "font.archivo-narrow", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f6ead933" });
const BRUN = "#150a06", BRAISE = "#ff7a1a", CREME_E = "#f6ead9";
const escalierDeLocation = modeleV2({
  id: identifiantV2(270, "escalier-de-location"), concept: "c-270-escalier-de-location", name: "Escalier de location", family: FAM,
  description: "Pour un loueur de matériel : un grand en-tête scindé sur brun sombre (titre en italique, bouton orange, mini-pelle dessinée posée sur une dalle de roche dans un halo braise), puis le nom, une colonne de liens et des pastilles de réseaux.",
  tags: ["location", "matériel", "mini-pelle dessinée", "halo", "brun", "orange", "angles droits", "réseaux"],
  identity: escalier, racine: racineDe(BRUN),
  widgets: ["html", "sitetitle", "text", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Le bon engin, <em>quand le chantier l'exige.</em></p>", { fontSize: "fluid:40-84", lineHeight: 1.02, fontWeight: "400", fontFamily: S.head, color: CREME_E, maxWidth: "640px", overflowWrap: "anywhere" });
    const offre = lien(k, "Demander une offre  →", "/contact", { taille: 18, poids: "700", couleur: BRUN, h: "60px", padH: "28px", survol: { backgroundColor: "#ffffff", color: BRUN, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: BRAISE, borderStyle: "solid", borderWidth: "2px", borderColor: BRAISE } });
    const texte = panneau(k, [souffle(carre(k, BRAISE, "12px"), 3000), titre, k.T("<p>Pelles, nacelles et compacteurs, livrés et repris. Des équipes qui répondent.</p>", { fontSize: "19px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "460px" }), offre], { fond: BRUN, gap: "28px", justifie: "center", base: "0px", poids: 1, min: "320px", padV: ["72px", "52px", "40px"], padH: ["64px", "40px", "20px"] });
    const image = k.col(svgDeux(k, A.illPelleSurDalle()), { flexGrow: 1, flexBasis: "0px", minWidth: "320px", backgroundColor: "#150a06" });
        const nom = nomDuSite(k, env, 34, CREME_E, { fontWeight: "400", textTransform: "uppercase", lineHeight: 1 });
    const liens = k.col(["Gammes", "Location", "Entretien", "Contact"].map((t) => rangee(k, t, "/contact", { couleur: CREME_E, poids: "600", taille: 17, h: "48px", padH: "4px", fondSurvol: BRAISE, couleurSurvol: BRUN, focus: BRAISE, ligne: "#f6ead944" })), { gap: "0px", width: "100%" });
    const lateral = panneau(k, [nom, k.T("<p>Location de matériel de chantier, avec livraison et reprise.</p>", { fontSize: "16px", lineHeight: 1.55, color: S.mute, fontFamily: S.font }), liens, caps(k, "Suivez-nous", { couleur: CREME_E }), pastilles(k, env, RES5.slice(0, 4), { couleur: CREME_E, contour: "#f6ead988", taille: 40, survolFond: BRAISE, survolCouleur: BRUN, focus: BRAISE })], { fond: "#241309", gap: "20px", justifie: "center", base: "260px", poids: 0, min: "260px", padV: ["56px", "44px", "36px"], padH: ["32px", "32px", "20px"], extra: { flexShrink: 0 } });
    const hero = G.bande(k, [rangeeDe(k, [texte, image, lateral])], { fond: BRUN, colonne: true, max: "100%", ...A.PAGE_LARGEUR, aligne: "stretch", nom: "Trois panneaux" });
    return [G.racine(k, [hero, bas(k, env, G, BRUN, "#cdb5a2", CREME_E, "#f6ead933")])];
  },
}, FAM);

// ═════════ ft2-271 « Index des gammes » — capture 2 inversée : bouteur dessiné À GAUCHE, index de gammes en lignes à droite ═════════
const index = identite({ key: "c271", label: "Vert forêt, os et jaune sable", humeur: "dark", fond: "#10281f", texte: "#ebe6d3", discret: "#b4bfae", accent: "#e8c547", surface: "#173629", encre: "#10281f", police: "font.commissioner", titres: "font.alumni-sans", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#ebe6d33a" });
const FORET = "#10281f", OS = "#ebe6d3", SABLE_Y = "#e8c547";
const indexDesGammes = modeleV2({
  id: identifiantV2(271, "index-des-gammes"), concept: "c-271-index-des-gammes", name: "Index des gammes", family: FAM,
  description: "Pour un constructeur d'engins : sur vert forêt, un bouteur dessiné posé sur une dalle dans un halo sable à gauche, et à droite un index de six gammes en grands libellés qui se remplissent de sable au survol ; dessous, coordonnées et pastilles de réseaux.",
  tags: ["constructeur", "engins", "bouteur dessiné", "index", "halo", "vert forêt", "jaune sable", "angles droits"],
  identity: index, racine: racineDe(FORET),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const image = k.col(svgDeux(k, A.illBouteur()), { flexGrow: 1, flexBasis: "0px", minWidth: "320px", backgroundColor: "#0c1d16" });
    const ligneDeGamme = (t) => lien(k, t, "/contact", { taille: 56, poids: "500", police: S.head, couleur: OS, bloc: true, h: "76px", lh: 1, casse: "uppercase", padH: "12px", survol: { backgroundColor: SABLE_Y, color: FORET, transform: { x: 10 } }, focus: SABLE_Y, extra: { width: "100%", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#ebe6d355" } });
    const index_ = panneau(k, [k.row([souffle(carre(k, SABLE_Y, "12px"), 3000), caps(k, "Index des gammes", { couleur: SABLE_Y, suivi: "0.26em" })], { gap: "10px", alignItems: "center" }), k.col(["Terrassement", "Levage", "Transport", "Compacts", "Location", "Occasion"].map(ligneDeGamme), { gap: "0px", width: "100%" }), k.T("<p>Gammes données en exemple : à adapter dans l'éditeur.</p>", { fontSize: "14px", color: S.mute, fontFamily: S.font })], { fond: FORET, gap: "20px", justifie: "center", base: "0px", poids: 1, min: "320px", padV: ["64px", "48px", "36px"], padH: ["56px", "36px", "20px"] });
    const hero = G.bande(k, [rangeeDe(k, [image, index_])], { fond: FORET, colonne: true, max: "100%", ...A.PAGE_LARGEUR, aligne: "stretch", nom: "Index" });
    const nom = nomDuSite(k, env, 34, OS, { fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" });
    const pied = G.bande(k, [k.row([k.col([nom, coordonnees(k, { taille: 15, couleur: OS, lien: OS, survol: SABLE_Y, focus: SABLE_Y })], { gap: "16px", flexGrow: 1, flexBasis: "0px", minWidth: "260px" }), k.col([caps(k, "Suivez-nous", { couleur: SABLE_Y }), pastilles(k, env, RES5.slice(0, 4), { couleur: OS, contour: "#ebe6d388", survolFond: SABLE_Y, survolCouleur: FORET, focus: SABLE_Y })], { gap: "14px", minWidth: "240px" })], { rowGap: "28px", columnGap: "48px", alignItems: "flex-start", flexWrap: "wrap", width: "100%", justifyContent: "space-between" })], { fond: FORET, colonne: true, padV: ["48px", "40px", "32px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Pied" });
    return [G.racine(k, [hero, pied, bas(k, env, G, FORET, "#b4bfae", OS, "#ebe6d333")])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Engins et matériel professionnel", target: 6, built: true,
  description: "Pieds standard et très professionnels, angles droits, avec de vraies illustrations dessinées : emblème et nom géants, chargeuse, radar de flotte, engrenages, mini-pelle sur dalle, bouteur.",
  models: [nomDeChantier, parcDeMachines, consoleDeFlotte, barreAtelier, escalierDeLocation, indexDesGammes],
};
