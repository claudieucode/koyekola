// Famille v2 « Sécurité et serrurerie » — 5 modèles (ft2-489 à ft2-493), extension « standard pro animé » : AUCUNE illustration, angles droits partout.
// Pieds de société de sécurité, de télésurveillance, de serrurerie et de dépannage : gabarits sobres et rassurants (anthracite et orange, laiton sur brun, blanc et rouge, marine et cyan, trois panneaux acier-blanc-jaune),
// prestations et ressources bien classées, coordonnées et horaires, lettre d'information. Marques fictives ; AUCUNE coordonnée, AUCUN chiffre, AUCUN agrément ni certificat inventé (tout vient des « Données de l'entreprise »).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; liens qui glissent de 4 à 6 px, boutons carrés qui s'inversent, cartes qui se soulèvent, lignes de registre dont le fond s'éclaire,
// carré de statut qui « respire » (pulse lent). Aucune animation d'entrée, aucun défilement continu.
const { legale, identifiantV2, identite, modeleV2, GK, DOUX, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, liste, lettre, nomDuSite, bouton, cartel, sty } = require("../aides-std-s06");

const FAM = "securite-serrurerie";
const PRESTA = [["Serrurerie et dépannage", "/catalogue"], ["Portes et serrures", "/catalogue"], ["Alarmes et détection", "/catalogue"], ["Contrôle d'accès", "/catalogue"]];
const RESS = [["Conseils de sécurité", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];

// ═══ ft2-489 « Poste de garde » — société de sécurité et de gardiennage
// Idée : anthracite et orange sécurité. Bande d'appel orange en tête (question + bouton noir) ; bande sombre : nom en capitales massives à gauche, coordonnées et horaires à droite ; bande de listes de liens et de la lettre sous filets orange épais.
// Polices : Archivo (titres) et Public Sans. Mobile : tout en pile.
const poste = identite({ key: "c489", label: "Anthracite et orange sécurité", humeur: "dark", fond: "#17191c", texte: "#f1f2f3", discret: "#b4b9bf", accent: "#ff7a1a", surface: "#22262b", surEncre: "#f1f2f3", encre: "#17191c",
  police: "font.public-sans", titres: "font.archivo", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f1f2f333" });
const ANTH = "#17191c", ANTH2 = "#22262b", ORANGE = "#ff7a1a", BLANC = "#f1f2f3";
const posteDeGarde = modeleV2({
  id: identifiantV2(489, "poste-de-garde"), concept: "c-489-poste-de-garde", name: "Poste de garde", family: FAM,
  description: "Pour une société de sécurité ou de gardiennage : nom en capitales massives sur anthracite avec contact et horaires, bande d'appel orange en tête, deux listes de liens et la lettre sous filets orange épais. Robuste et rassurant.",
  tags: ["sécurité", "gardiennage", "anthracite", "orange", "capitales", "filets épais", "angles droits"],
  identity: poste, racine: racineDe(ANTH),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 44, BLANC, { textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.01em" });
    const pt = souffle(carre(k, ORANGE, "10px"), 3000);
    const gauche = G.colonne(k, [caps(k, "Sécurité privée et prévention", { couleur: ORANGE, suivi: "0.22em" }), nom, texte(k, "Prévenir, surveiller, intervenir : un interlocuteur unique pour protéger vos sites.", { couleur: BLANC, max: "440px", taille: 17 }),
      bouton(k, "Nous contacter", "/contact", { couleur: ANTH, fond: ORANGE, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: BLANC, color: ANTH, transform: { y: -3 } }, focus: BLANC, soi: "flex-start" })], { poids: 6, min: "300px", gap: "18px" });
    const contact = bloc(k, "Contact", [coordonnees(k, { couleur: BLANC, lien: BLANC, survol: ORANGE, focus: ORANGE })], { couleurTitre: ORANGE, poids: 1 });
    const hor = GK.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: ORANGE })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { couleur: BLANC })], { poids: 1, min: "200px", gap: "12px" });
    const droite = G.ligne(k, [contact, hor], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" });
    const haut = G.bande(k, [gauche, G.colonne(k, [droite], { poids: 6, min: "300px" })], { fond: ANTH, gap: "40px 64px", aligne: "flex-start", padV: ["80px", "64px", "48px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Poste" });
    const groupe = (titre, liens) => k.col([k.divider({ width: "100%", borderColor: ORANGE, borderTopWidth: "4px", marginTop: "0px", marginBottom: "0px" }), caps(k, titre, { couleur: BLANC, suivi: "0.16em", taille: "13px", extra: { paddingTop: "10px" } }), ...liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: BLANC, survol: { color: ORANGE, transform: { x: 6 } }, focus: ORANGE }))],
      { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "2px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils de prévention, par courriel.", largeur: "100%", accent: ORANGE, surBouton: ANTH, texte: BLANC, couleurTitre: ORANGE, fond: ANTH2, survolBouton: BLANC, survolTexte: ANTH, focus: ORANGE });
    const groupes = G.ligne(k, [groupe("Prestations", PRESTA), groupe("Ressources", RESS), G.colonne(k, [k.divider({ width: "100%", borderColor: ORANGE, borderTopWidth: "4px", marginTop: "0px", marginBottom: "0px" }), abo], { poids: 1.4, min: "260px", gap: "10px" })], { gap: "32px", aligne: "flex-start", largeur: "100%" });
    const milieu = G.bande(k, [groupes], { fond: ANTH2, colonne: true, padV: ["56px", "48px", "40px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    const appel = G.bande(k, [texte(k, "<strong>Une question sur la protection de vos locaux ?</strong>", { couleur: ANTH, taille: 20, lh: 1.3, max: "620px", extra: { fontFamily: S.head } }),
      bouton(k, "Écrire à l'équipe", "/contact", { couleur: "#ffffff", fond: ANTH, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: "#ffffff", color: ANTH, transform: { x: 6 } }, focus: ANTH })], { fond: ORANGE, gap: "16px 40px", aligne: "center", padV: ["28px", "24px", "24px"], padB: ["28px", "24px", "24px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#c9ced4", liens: BLANC }, ORANGE);
    const bas = G.bande(k, [mentions], { fond: ANTH, colonne: true, padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions", couleur: "#ffffff" });
    return [G.racine(k, [appel, haut, milieu, bas])];
  },
}, FAM);

// ═══ ft2-490 « Trois temps » — serrurier, dépannage d'urgence
// Idée : brun très sombre et laiton, serif. Phrase « Un problème de porte ? Voici comment nous procédons. » et trois cartes numérotées (1 Vous nous contactez · 2 Nous nous déplaçons · 3 Vous êtes servi) qui se soulèvent
// et se bordent de laiton au survol ; dessous, bande lettre et contact, puis liens en rang. Aucun délai ni prix promis. Polices : Young Serif (titres) et Hanken Grotesk. Mobile : cartes empilées.
const brun = identite({ key: "c490", label: "Brun profond et laiton", humeur: "dark", fond: "#1d1510", texte: "#f3ece0", discret: "#c3b6a2", accent: "#d8a657", surface: "#2a1e16", surEncre: "#f3ece0", encre: "#1d1510",
  police: "font.hanken-grotesk", titres: "font.young-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f3ece033" });
const BRUN = "#1d1510", BRUN2 = "#2a1e16", BRUN3 = "#36271c", LAITON = "#d8a657", CREME = "#f3ece0";
const troisTemps = modeleV2({
  id: identifiantV2(490, "trois-temps"), concept: "c-490-trois-temps", name: "Trois temps", family: FAM,
  description: "Pour un serrurier ou un service de dépannage : phrase en serif sur brun profond, trois cartes numérotées (contact, déplacement, remise en service) qui se soulèvent au survol, puis lettre, contact, horaires et liens en rang.",
  tags: ["serrurerie", "dépannage", "brun", "laiton", "étapes numérotées", "cartes", "serif", "angles droits"],
  identity: brun, racine: racineDe(BRUN),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Un souci de porte ?<br><span style="color:${LAITON}">Voici comment<br>nous procédons.</span></p>`, { taille: [36, 72], tablette: { taille: [48, 68] }, mobile: { taille: [36, 48] }, lh: 1.08, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const gauche = G.colonne(k, [caps(k, "Serrurerie et dépannage", { couleur: LAITON, suivi: "0.22em" }), phrase], { poids: 7, min: "300px", gap: "18px" });
    const droite = G.colonne(k, [bouton(k, "Nous contacter", "/contact", { couleur: BRUN, fond: LAITON, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: CREME, color: BRUN, transform: { y: -3 } }, focus: CREME })], { poids: 3, min: "240px", soi: "flex-end", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const haut = G.bande(k, [gauche, droite], { fond: BRUN, gap: "32px 48px", aligne: "flex-end", padV: ["88px", "68px", "52px"], padB: ["44px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    const etape = (n, titre, phrase) => cartel(k, [k.T(`<p>${n}</p>`, { fontFamily: S.head, fontSize: "56px", lineHeight: 1, color: LAITON }), k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "24px", lineHeight: 1.2, color: CREME }), texte(k, phrase, { couleur: S.mute, taille: 15 })],
      { fond: BRUN2, contour: "#f3ece033", contourSurvol: LAITON, fondSurvol: BRUN3, min: "240px", gap: "10px", pad: "28px" });
    const etapes = G.ligne(k, [etape("1", "Vous nous contactez", "Par formulaire, courriel ou téléphone, en décrivant la situation."), etape("2", "Nous nous déplaçons", "Un technicien évalue la porte, la serrure ou l'accès."), etape("3", "Vous êtes servi", "Intervention, remise en service et explication claire.")], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const bandeEtapes = G.bande(k, [etapes], { fond: BRUN, colonne: true, padV: ["8px", "8px", "8px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Étapes" });
    const pt = souffle(carre(k, LAITON, "10px"), 3200);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils pour sécuriser votre porte, par courriel.", largeur: "400px", accent: LAITON, surBouton: BRUN, texte: CREME, couleurTitre: LAITON, fond: BRUN2, survolBouton: CREME, survolTexte: BRUN, focus: LAITON });
    const contact = G.ligne(k, [
      bloc(k, "Contact", [coordonnees(k, { couleur: CREME, lien: CREME, survol: LAITON, focus: LAITON })], { couleurTitre: LAITON, poids: 1 }),
      GK.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: LAITON })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { couleur: CREME })], { poids: 1, min: "200px", gap: "12px" }),
    ], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" });
    const milieu = G.bande(k, [G.colonne(k, [abo], { poids: 5, min: "300px" }), G.colonne(k, [contact], { poids: 6, min: "300px" })], { fond: BRUN2, gap: "40px 64px", aligne: "flex-start", padV: ["56px", "48px", "40px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Lettre et contact" });
    const liens = G.ligne(k, PRESTA.slice(0, 3).concat(RESS).map(([t, u]) => lien(k, t, u, { taille: 15, poids: "600", couleur: CREME, soulign: true, survol: { color: LAITON, transform: { y: -2 } }, focus: LAITON })), { gap: "0px 28px", largeur: "100%" });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#d7cab6", liens: CREME }, LAITON);
    const bas = G.bande(k, [liens, trait(k, "#4a403a"), mentions], { fond: BRUN, colonne: true, gap: "20px", padV: ["32px", "28px", "24px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "16px" }, nom: "Bas", couleur: "#ffffff" });
    return [G.racine(k, [haut, bandeEtapes, milieu, bas])];
  },
}, FAM);

// ═══ ft2-491 « Registre de sécurité » — entreprise de télésurveillance et d'alarmes
// Idée : un REGISTRE : chaque rubrique est une ligne à filet (étiquette à gauche, contenu à droite), la ligne s'éclaire au survol. Barre rouge épaisse en tête. Lignes : Prestations (liens en rang) · Ressources · Joindre (contact et horaires)
// · Lettre. Blanc, rouge sombre, noir. Polices : IBM Plex Sans et IBM Plex Mono (étiquettes). Mobile : étiquette au-dessus du contenu.
const registre = identite({ key: "c491", label: "Blanc, rouge sombre et noir", humeur: "light", fond: "#ffffff", texte: "#1a1a1a", discret: "#555555", accent: "#b3122e", surface: "#f6f1f1", encre: "#1a1a1a",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1a1a1a33" });
const ROUGE = "#b3122e", NOIRE = "#1a1a1a", ROSE = "#f6f1f1";
const registreModele = modeleV2({
  id: identifiantV2(491, "registre-de-securite"), concept: "c-491-registre-de-securite", name: "Registre de sécurité", family: FAM,
  description: "Pour une société de télésurveillance ou d'alarmes : un registre en lignes à filets (prestations, ressources, contact et horaires, lettre) dont le fond s'éclaire au survol, sous une barre rouge. Blanc, rouge sombre, noir ; très ordonné.",
  tags: ["télésurveillance", "alarmes", "registre", "lignes à filets", "blanc", "rouge", "mono", "angles droits"],
  identity: registre, racine: racineDe("#ffffff"),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const barre = k.col([], { width: "100%", height: "10px", backgroundColor: ROUGE, borderRadius: "0px" });
    const nom = nomDuSite(k, env, 32, NOIRE, { fontFamily: S.font, fontWeight: "700" });
    const entete = G.bande(k, [barre, G.ligne(k, [nom, caps(k, "Registre des rubriques", { couleur: ROUGE, suivi: "0.2em", police: S.head })], { gap: "12px 40px", justifie: "space-between", aligne: "center", largeur: "100%" })], { fond: "#ffffff", colonne: true, gap: "40px", padV: ["0px", "0px", "0px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Tête", max: "100%" });
    // ligne de registre : filet haut, étiquette (mono) à gauche, contenu à droite ; le fond s'éclaire au survol
    const rang = (num, titre, contenu, o = {}) => {
      const etiquette = k.col([caps(k, num, { couleur: ROUGE, suivi: "0.12em", police: S.head }), caps(k, titre, { couleur: NOIRE, taille: "13px", police: S.head })], { flexGrow: 1, flexBasis: "0px", minWidth: "200px", maxWidth: "260px", gap: "4px" });
      const corps = o.direct ? contenu[0] : k.col(contenu, { flexGrow: 4, flexBasis: "0px", minWidth: "260px", gap: "10px" });
      const r = k.row([etiquette, corps], { gap: "16px 40px", alignItems: "flex-start", flexWrap: "wrap", width: "100%", boxSizing: "border-box", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#1a1a1a55", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: ROSE } };
      return r;
    };
    const enRang = (liens) => G.ligne(k, liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: NOIRE, soulign: true, survol: { color: ROUGE, transform: { x: 4 } }, focus: ROUGE })), { gap: "0px 32px", largeur: "100%" });
    const pt = souffle(carre(k, ROUGE, "10px"), 3200);
    const joindre = G.ligne(k, [GK.colonne(k, [coordonnees(k, { couleur: NOIRE, lien: NOIRE, survol: ROUGE, focus: ROUGE })], { poids: 1, min: "220px" }), GK.colonne(k, [k.row([pt, caps(k, "En ce moment", { couleur: ROUGE })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { couleur: NOIRE })], { poids: 1, min: "220px", gap: "10px" })], { gap: "20px 40px", aligne: "flex-start" });
    joindre.styles.desktop = { ...joindre.styles.desktop, flexGrow: 4, flexBasis: "0px", minWidth: "260px" };
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils de prévention, par courriel, sans excès.", largeur: "420px", accent: ROUGE, surBouton: "#ffffff", texte: NOIRE, couleurTitre: NOIRE, fond: "#ffffff", survolBouton: NOIRE, survolTexte: "#ffffff", focus: ROUGE });
    const reg = G.bande(k, [rang("01", "Prestations", [enRang(PRESTA)]), rang("02", "Ressources", [enRang(RESS.concat([["Nous écrire", "/contact"]]))]), rang("03", "Joindre", [joindre], { direct: true }), rang("04", "Lettre", [abo])], { fond: "#ffffff", colonne: true, gap: "0px", padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "16px"], padH: ["32px", "16px", "4px"], nom: "Registre" });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#555555", liens: NOIRE }, ROUGE);
    const bas = G.bande(k, [trait(k, "#9a9a9a"), mentions], { fond: "#ffffff", colonne: true, gap: "20px", padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [entete, reg, bas])];
  },
}, FAM);

// ═══ ft2-492 « Ronde de nuit » — vidéosurveillance, protection de sites
// Idée : marine nuit et cyan. Bande de lettre en tête (grande phrase « Restez au courant. » + champ), puis disposition en deux zones : à gauche le nom, le contact et un bouton ; à droite une grille 2 × 2 de blocs de liens
// (Prestations, Ressources, Compte, Horaires) dont chaque titre est précédé d'une petite barre cyan qui s'allonge au survol du bloc. Polices : Sora et DM Sans. Mobile : tout en pile.
const marine = identite({ key: "c492", label: "Marine nuit et cyan", humeur: "dark", fond: "#07111f", texte: "#e8f0f8", discret: "#a3b4c6", accent: "#3dd5f3", surface: "#0e2038", surEncre: "#e8f0f8", encre: "#07111f",
  police: "font.dm-sans", titres: "font.sora", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e8f0f833" });
const MAR = "#07111f", MAR2 = "#0e2038", CYAN = "#3dd5f3", GLACE = "#e8f0f8";
const ronde = modeleV2({
  id: identifiantV2(492, "ronde-de-nuit"), concept: "c-492-ronde-de-nuit", name: "Ronde de nuit", family: FAM,
  description: "Pour une société de vidéosurveillance ou de protection de sites : bande de lettre en tête, nom et contact à gauche, grille 2 × 2 de blocs de liens à droite dont les filets cyan s'allongent au survol. Marine nuit et cyan.",
  tags: ["vidéosurveillance", "protection de sites", "marine", "cyan", "lettre en tête", "grille de blocs", "angles droits"],
  identity: marine, racine: racineDe(MAR),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Restez<br>au courant.</p>`, { taille: [40, 80], tablette: { taille: [56, 76] }, mobile: { taille: [40, 56] }, lh: 1.04, suivi: "-0.02em", poids: "700", police: S.head, couleur: GLACE })(k, env);
    const g = G.colonne(k, [caps(k, "Lettre d'information", { couleur: CYAN, suivi: "0.22em" }), phrase], { poids: 6, min: "300px", gap: "16px" });
    const abo = lettre(k, env, G, { titre: "Conseils de sécurité", intro: "Un courriel de temps en temps : prévention et nouveautés.", largeur: "440px", accent: CYAN, surBouton: MAR, texte: GLACE, couleurTitre: CYAN, fond: MAR2, survolBouton: GLACE, survolTexte: MAR, focus: CYAN });
    const haut = G.bande(k, [g, G.colonne(k, [abo], { poids: 5, min: "300px", soi: "flex-end" })], { fond: MAR2, gap: "36px 64px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Lettre" });
    const nom = nomDuSite(k, env, 30, GLACE);
    const gauche = G.colonne(k, [caps(k, "Protection de sites", { couleur: CYAN, suivi: "0.22em" }), nom, texte(k, "Étude, installation, suivi : parlons de ce qu'il faut protéger.", { couleur: GLACE, max: "320px", taille: 16 }), coordonnees(k, { couleur: GLACE, lien: GLACE, survol: CYAN, focus: CYAN }),
      bouton(k, "Demander une étude", "/contact", { couleur: MAR, fond: CYAN, survol: { backgroundColor: GLACE, color: MAR, transform: { y: -3 } }, focus: GLACE, soi: "flex-start" })], { poids: 4, min: "290px", gap: "18px" });
    const bloc4 = (titre, enf, pulse) => {
      const tete = k.row([k.col([], { width: "20px", height: "3px", backgroundColor: CYAN, borderRadius: "0px", transitionDuration: DOUX, flexShrink: 0 }), caps(k, titre, { couleur: GLACE, taille: "13px" }), ...(pulse ? [souffle(carre(k, CYAN, "10px"), 3000)] : [])], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
      const c = k.col([tete, ...enf], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "4px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "1px", borderColor: "#e8f0f833", borderRadius: "0px", transitionDuration: DOUX, boxSizing: "border-box" });
      c.states = { hover: { backgroundColor: MAR2, borderColor: CYAN } };
      return c;
    };
    const ls = (arr) => arr.map(([t, u]) => lien(k, t, u, { taille: 15, couleur: GLACE, survol: { color: CYAN, transform: { x: 5 } }, focus: CYAN }));
    const grille = k.col([
      G.ligne(k, [bloc4("Prestations", ls(PRESTA.slice(0, 3))), bloc4("Ressources", ls(RESS))], { gap: "12px", aligne: "stretch", largeur: "100%" }),
      G.ligne(k, [bloc4("Compte", ls([["Espace client", "/connexion"], ["Créer un compte", "/inscription"], ["Accueil", "/"]])), bloc4("Horaires", [horaires(k, { couleur: GLACE })], true)], { gap: "12px", aligne: "stretch", largeur: "100%" }),
    ], { gap: "12px", flexGrow: 7, flexBasis: "0px", minWidth: "320px" });
    const deux = G.bande(k, [gauche, grille], { fond: MAR, gap: "40px 56px", aligne: "flex-start", padV: ["64px", "52px", "40px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Zones" });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#c3d0de", liens: GLACE }, CYAN);
    const bas = G.bande(k, [trait(k, "#33404f"), mentions], { fond: MAR, colonne: true, gap: "22px", padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions", couleur: "#ffffff" });
    return [G.racine(k, [haut, deux, bas])];
  },
}, FAM);

// ═══ ft2-493 « Trois panneaux » — serrurerie, coffres et contrôle d'accès
// Idée : TROIS PANNEAUX verticaux de bord à bord : bleu acier (nom, phrase, bouton), gris clair (prestations et ressources en deux listes), jaune sécurité (contact et horaires). Les liens glissent, le bouton s'inverse.
// Dessous, une barre bleu nuit avec la lettre et les mentions. Polices : Barlow (titres, 700) et Source Sans 3. Mobile : panneaux empilés.
const acier = identite({ key: "c493", label: "Bleu acier, gris clair et jaune", humeur: "light", fond: "#eceff2", texte: "#14202e", discret: "#46566a", accent: "#1f3a5f", surface: "#ffffff", encre: "#14202e",
  police: "font.source-sans-3", titres: "font.barlow", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#14202e33" });
const ACIER = "#1f3a5f", GRISC = "#eceff2", JAUNES = "#ffc800", TXT = "#14202e", ABYSSE = "#0f1d30";
const panneaux = modeleV2({
  id: identifiantV2(493, "trois-panneaux"), concept: "c-493-trois-panneaux", name: "Trois panneaux", family: FAM,
  description: "Pour un serrurier ou un spécialiste du contrôle d'accès : trois panneaux de bord à bord (bleu acier, gris clair, jaune sécurité) pour le nom, les liens et le contact, puis une barre sombre avec la lettre et les mentions.",
  tags: ["serrurerie", "contrôle d'accès", "bleu acier", "jaune", "trois panneaux", "angles droits"],
  identity: acier, racine: racineDe(ABYSSE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const pan = (enfants, fond, o = {}) => k.col(enfants, { backgroundColor: fond, flexGrow: o.poids || 1, flexBasis: "0px", minWidth: o.min || "300px", gap: "16px", paddingTop: "72px", paddingBottom: "64px", paddingLeft: "40px", paddingRight: "40px", boxSizing: "border-box", borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const nom = nomDuSite(k, env, 32, "#ffffff", { textTransform: "uppercase", letterSpacing: "0.02em" });
    const p1 = pan([caps(k, "Serrurerie et accès", { couleur: JAUNES, suivi: "0.22em" }), nom, texte(k, "Serrures, blindages, coffres et contrôle d'accès : une solution adaptée à chaque porte.", { couleur: "#ffffff", max: "320px", taille: 17 }),
      bouton(k, "Demander un devis", "/contact", { couleur: TXT, fond: JAUNES, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: "#ffffff", color: ACIER, transform: { y: -3 } }, focus: "#ffffff", soi: "flex-start" })], ACIER, { poids: 1.1 });
    const lst = (t, arr) => liste(k, t, arr, { couleurTitre: ACIER, accent: ACIER, couleur: TXT, min: "200px" });
    const p2 = pan([G.ligne(k, [lst("Prestations", PRESTA.slice(0, 3)), lst("Ressources", RESS)], { gap: "28px 32px", aligne: "flex-start", largeur: "100%" })], GRISC, { poids: 1.3, min: "360px" });
    const pt = souffle(carre(k, TXT, "10px"), 3000);
    const p3 = pan([caps(k, "Nous joindre", { couleur: TXT }), coordonnees(k, { couleur: TXT, lien: TXT, survol: ACIER, focus: TXT }), trait(k, "#7a6200"), k.row([pt, caps(k, "Horaires", { couleur: TXT })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { couleur: TXT })], JAUNES, { poids: 1 });
    const trois = { type: "container", name: "Trois panneaux", props: { full: true }, children: [p1, p2, p3], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", gap: "0px", alignItems: "stretch", backgroundColor: ACIER }) };
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils pour protéger vos accès, par courriel.", largeur: "460px", accent: JAUNES, surBouton: TXT, texte: "#e5ebf2", couleurTitre: "#ffffff", fond: ABYSSE, survolBouton: "#ffffff", survolTexte: ABYSSE, focus: JAUNES });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#c9d4e0", liens: "#ffffff" }, JAUNES);
    const bas = G.bande(k, [abo, trait(k, "#3f4b5b"), mentions], { fond: ABYSSE, colonne: true, gap: "28px", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "22px" }, nom: "Lettre", couleur: "#ffffff" });
    return [G.racine(k, [trois, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Sécurité et serrurerie", target: 5, built: true,
  description: "Pieds standard pros animés, sans illustration : sécurité, télésurveillance et serrurerie ; anthracite et orange, laiton, registre rouge, marine et cyan, trois panneaux. Angles droits.",
  models: [posteDeGarde, troisTemps, registreModele, ronde, panneaux],
};
