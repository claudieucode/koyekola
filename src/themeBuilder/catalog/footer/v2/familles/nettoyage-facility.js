// Famille v2 « Nettoyage et services généraux » — 5 modèles (ft2-484 à ft2-488), extension « standard pro animé » : AUCUNE illustration, angles droits partout.
// Pieds d'entreprise de propreté, de multiservices et de maintenance de locaux : bandes d'appel, colonnes de prestations bien classées (prestations / ressources / contact / horaires), cartes de secteurs,
// mosaïque de prestations, panneaux franchement colorés. Contenus utiles, libellés réels ; marques fictives ; AUCUNE coordonnée ni chiffre ni certificat inventé (adresse, téléphone, horaires viennent des « Données de l'entreprise »).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; liens qui glissent de 4 à 6 px, boutons carrés qui s'inversent, cartes qui se soulèvent, lignes dont le fond s'éclaire,
// carré de statut qui « respire » (pulse lent). Aucune animation d'entrée, aucun défilement continu.
const { legale, identifiantV2, identite, modeleV2, GK, DOUX, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, liste, lettre, nomDuSite, bouton, cartel, sty } = require("../aides-std-s06");

const FAM = "nettoyage-facility";
const PRESTATIONS = [["Bureaux et locaux professionnels", "/catalogue"], ["Parties communes d'immeubles", "/catalogue"], ["Vitrerie et façades", "/catalogue"], ["Remise en état après travaux", "/catalogue"]];
const RESSOURCES = [["Actualités et conseils", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];

// ═══ ft2-484 « Passage impeccable » — société de propreté pour entreprises
// Idée : à gauche la phrase d'accroche sur fond pâle ; à droite quatre cadres à filet turquoise (prestations, ressources, contact, horaires avec carré qui « respire ») ; bande turquoise en pied avec bouton de devis, lettre et mentions.
// Polices : Outfit (titres) et Nunito Sans. Mobile : tout en pile.
const turquoise = identite({ key: "c484", label: "Blanc, turquoise profond et ardoise", humeur: "light", fond: "#ffffff", texte: "#0b2e33", discret: "#44595c", accent: "#0e7490", surface: "#e6f4f7", encre: "#0b2e33",
  police: "font.nunito-sans", titres: "font.outfit", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0b2e3333" });
const TURQ = "#0e7490", ARDOISE = "#0b2e33", PALE = "#e6f4f7";
const passage = modeleV2({
  id: identifiantV2(484, "passage-impeccable"), concept: "c-484-passage-impeccable", name: "Passage impeccable", family: FAM,
  description: "Pour une société de propreté : phrase d'accroche à gauche, quatre cadres à filet turquoise (prestations, ressources, contact, horaires) à droite, puis une bande turquoise avec bouton de devis, lettre et mentions. Net, clair, rigoureux.",
  tags: ["nettoyage", "propreté", "entreprise", "turquoise", "cadres à filet", "bande d'appel", "angles droits"],
  identity: turquoise, racine: racineDe("#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Des locaux nets,<br>sans y penser.</p>`, { taille: [34, 58], tablette: { taille: [46, 56] }, mobile: { taille: [34, 46] }, lh: 1.06, suivi: "-0.02em", poids: "700", police: S.head, couleur: ARDOISE })(k, env);
    const intro = texte(k, "Dites-nous ce que vous avez à entretenir : nous vous répondons avec une proposition claire.", { couleur: S.mute, max: "420px", taille: 17 });
    const filet = k.col([], { width: "64px", height: "6px", backgroundColor: TURQ, borderRadius: "0px" });
    const etiq = G.ligne(k, ["Bureaux", "Immeubles", "Commerces"].map((t) => k.T(`<p><strong>${t}</strong></p>`, { fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: S.font, color: ARDOISE, borderStyle: "solid", borderWidth: "1.5px", borderColor: ARDOISE, borderRadius: "0px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px" })), { gap: "8px" });
    const gauche = G.colonne(k, [caps(k, "Propreté et entretien des locaux", { couleur: TURQ, suivi: "0.2em" }), phrase, filet, intro, etiq], { poids: 5, min: "300px", gap: "20px" });
    const pt = souffle(carre(k, TURQ, "10px"), 3200);
    const cadre = (enf) => k.col(enf, { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "10px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: TURQ, borderRadius: "0px", boxSizing: "border-box" });
    const bloc2 = (...c) => G.ligne(k, c, { gap: "16px", aligne: "stretch", largeur: "100%" });
    const grille = k.col([
      bloc2(cadre([caps(k, "Prestations", { couleur: TURQ }), ...PRESTATIONS.map(([t, u]) => lien(k, t, u, { taille: 15, couleur: ARDOISE, survol: { color: TURQ, transform: { x: 4 } }, focus: TURQ }))]),
        cadre([caps(k, "Ressources", { couleur: TURQ }), ...RESSOURCES.map(([t, u]) => lien(k, t, u, { taille: 15, couleur: ARDOISE, survol: { color: TURQ, transform: { x: 4 } }, focus: TURQ }))])),
      bloc2(cadre([caps(k, "Contact", { couleur: TURQ }), coordonnees(k, { lien: ARDOISE, survol: TURQ, focus: TURQ })]),
        cadre([k.row([pt, caps(k, "Horaires", { couleur: TURQ })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { couleur: ARDOISE })])),
    ], { gap: "16px", flexGrow: 7, flexBasis: "0px", minWidth: "320px" });
    const haut = G.bande(k, [gauche, grille], { fond: PALE, gap: "44px 56px", aligne: "flex-start", padV: ["80px", "64px", "48px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Classement" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils d'entretien, par courriel, sans excès.", largeur: "460px", accent: "#ffffff", surBouton: TURQ, texte: "#ffffff", couleurTitre: "#ffffff", fond: TURQ, survolBouton: ARDOISE, survolTexte: "#ffffff", focus: "#ffffff" });
    const b1 = bouton(k, "Demander un devis", "/contact", { couleur: TURQ, fond: "#ffffff", survol: { backgroundColor: ARDOISE, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", soi: "center" });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#ffffff", liens: "#ffffff" }, "#d7f1f7");
    const bas = G.bande(k, [k.col([abo, b1], { gap: "20px", alignItems: "center", width: "100%" }), trait(k, "#6fb1c3"), mentions], { fond: TURQ, colonne: true, aligne: "stretch", gap: "28px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "22px" }, nom: "Appel", couleur: "#ffffff" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-485 « Carnet de tournée » — entreprise de nettoyage de bureaux, copropriétés et sites industriels
// Idée : bleu nuit et vert citron. Colonne de gauche (nom, phrase, coordonnées, horaires) sur un aplat plus clair ; à droite trois cartes de secteurs (Bureaux, Copropriétés, Industrie) qui se soulèvent au survol,
// chacune avec ses liens, puis une rangée de liens et la lettre. Barre de mentions sombre. Polices : Space Grotesk (titres) et Inter. Mobile : colonne de gauche puis cartes empilées.
const nuit = identite({ key: "c485", label: "Bleu nuit et vert citron", humeur: "dark", fond: "#0b1b2b", texte: "#eaf1f7", discret: "#a8b9ca", accent: "#b8e04a", surface: "#12283d", surEncre: "#eaf1f7", encre: "#0b1b2b",
  police: "font.inter", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eaf1f733" });
const NUIT = "#0b1b2b", NUIT2 = "#12283d", NUIT3 = "#1a3550", CITRON = "#b8e04a", NEIGE = "#eaf1f7";
const carnet = modeleV2({
  id: identifiantV2(485, "carnet-de-tournee"), concept: "c-485-carnet-de-tournee", name: "Carnet de tournée", family: FAM,
  description: "Pour une entreprise de nettoyage de bureaux, de copropriétés ou de sites industriels : colonne de contact à gauche, trois cartes de secteurs qui se soulèvent à droite, lettre et mentions. Bleu nuit et vert citron.",
  tags: ["nettoyage", "multiservices", "bleu nuit", "vert citron", "cartes de secteurs", "colonne latérale", "angles droits"],
  identity: nuit, racine: racineDe(NUIT),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, NEIGE);
    const pt = souffle(carre(k, CITRON, "10px"), 3000);
    const lat = k.col([caps(k, "Entretien et services", { couleur: CITRON, suivi: "0.2em" }), nom, texte(k, "Une équipe, un planning, un interlocuteur : écrivez-nous, nous vous répondons.", { couleur: NEIGE, taille: 16, max: "340px" }),
      trait(k, "#3a4c5f"), caps(k, "Nous joindre", { couleur: CITRON }), coordonnees(k, { lien: NEIGE, survol: CITRON, focus: CITRON, couleur: NEIGE }),
      k.row([pt, caps(k, "Horaires", { couleur: CITRON })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { couleur: NEIGE })],
      { backgroundColor: NUIT2, flexGrow: 1, flexBasis: "0px", minWidth: "320px", maxWidth: "460px", gap: "20px", paddingTop: "64px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "40px", boxSizing: "border-box", borderRadius: "0px" },
      { maxWidth: "100%", paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "44px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const carte = (num, titre, liens) => cartel(k, [caps(k, num, { couleur: CITRON, suivi: "0.2em" }), k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "26px", fontWeight: "700", color: NEIGE, lineHeight: 1.15 }), ...liens.map(([t, u]) => lien(k, t, u, { taille: 15, couleur: NEIGE, survol: { color: CITRON, transform: { x: 5 } }, focus: CITRON }))],
      { fond: NUIT, contour: "#eaf1f740", contourSurvol: CITRON, fondSurvol: NUIT3, min: "220px", gap: "6px", pad: "26px" });
    const cartes = G.ligne(k, [
      carte("01", "Bureaux et commerces", [["Entretien régulier", "/catalogue"], ["Vitrerie", "/catalogue"], ["Demander un devis", "/contact"]]),
      carte("02", "Copropriétés et résidences", [["Parties communes", "/catalogue"], ["Remise en état", "/catalogue"], ["Questions fréquentes", "/faq"]]),
      carte("03", "Industrie et entrepôts", [["Sols et ateliers", "/catalogue"], ["Fin de chantier", "/catalogue"], ["Nous écrire", "/contact"]]),
    ], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils d'entretien et actualités, par courriel.", largeur: "420px", accent: CITRON, surBouton: NUIT, texte: NEIGE, couleurTitre: CITRON, fond: NUIT, survolBouton: NEIGE, survolTexte: NUIT, focus: CITRON });
    const liens = G.ligne(k, RESSOURCES.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "700", couleur: NEIGE, soulign: true, survol: { color: CITRON, transform: { x: 4 } }, focus: CITRON })), { gap: "0px 28px" });
    const droite = k.col([caps(k, "Secteurs d'intervention", { couleur: S.mute }), cartes, trait(k, "#3a4c5f"), G.ligne(k, [liens, abo], { gap: "28px 48px", justifie: "space-between", aligne: "flex-start", largeur: "100%" })],
      { flexGrow: 2, flexBasis: "0px", minWidth: "420px", gap: "24px", paddingTop: "64px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", borderRadius: "0px" }, { minWidth: "100%", paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "32px" });
    const deux = { type: "container", name: "Deux zones", props: { full: true }, children: [lat, droite], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", gap: "0px", alignItems: "stretch", backgroundColor: NUIT }) };
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#c4d1de", liens: NEIGE }, CITRON);
    const bas = G.bande(k, [mentions], { fond: "#07121e", colonne: true, padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions", couleur: "#ffffff" });
    return [G.racine(k, [deux, bas])];
  },
}, FAM);

// ═══ ft2-486 « Cahier d'entretien » — entreprise de nettoyage haut de gamme, conciergerie, services à domicile
// Idée : pied CENTRÉ, très éditorial, ivoire et vert sauge. Nom en serif et phrase centrés, bouton carré ; trois groupes de liens séparés par de fins filets verticaux, centrés ; deux cartes à filet (horaires, contact) ;
// bande vert profond pour la lettre et les mentions. Polices : Fraunces (titres) et Karla. Mobile : groupes empilés, filets horizontaux.
const sauge = identite({ key: "c486", label: "Ivoire et vert sauge profond", humeur: "light", fond: "#f6f3ea", texte: "#1f2a22", discret: "#4c5a50", accent: "#3f6b4f", surface: "#ffffff", encre: "#1f2a22",
  police: "font.karla", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1f2a2233" });
const IVOIRE = "#f6f3ea", SAUGE = "#3f6b4f", FORET = "#23402f", ENCRE = "#1f2a22";
const cahier = modeleV2({
  id: identifiantV2(486, "cahier-d-entretien"), concept: "c-486-cahier-d-entretien", name: "Cahier d'entretien", family: FAM,
  description: "Pour une entreprise de nettoyage soignée ou une conciergerie : pied centré sur ivoire, nom en serif, trois groupes de liens aux filets fins, deux cartes (horaires, contact) et bande vert profond pour la lettre. Posé, élégant.",
  tags: ["nettoyage", "conciergerie", "services à domicile", "centré", "ivoire", "vert sauge", "serif", "angles droits"],
  identity: sauge, racine: racineDe(IVOIRE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 44, ENCRE, { fontWeight: "500", textAlign: "center" });
    const tete = k.col([caps(k, "Entretien · Conciergerie · Services", { couleur: SAUGE, suivi: "0.24em", extra: { textAlign: "center" } }), nom, texte(k, "Le soin du détail, dans la durée. Parlons de ce que nous pouvons prendre en charge.", { couleur: S.mute, max: "520px", taille: 18, extra: { textAlign: "center" } }),
      bouton(k, "Prendre contact", "/contact", { couleur: "#ffffff", fond: SAUGE, survol: { backgroundColor: ENCRE, color: "#ffffff", transform: { y: -3 } }, focus: ENCRE, soi: "center" })],
      { alignItems: "center", gap: "18px", width: "100%" });
    const haut = G.bande(k, [tete], { fond: IVOIRE, colonne: true, aligne: "center", padV: ["88px", "68px", "52px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Tête" });
    const groupe = (titre, liens, dernier) => k.col([caps(k, titre, { couleur: SAUGE, suivi: "0.2em", extra: { textAlign: "center" } }), ...liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: ENCRE, survol: { color: SAUGE, transform: { y: -2 } }, focus: SAUGE, extra: { justifyContent: "center", width: "100%" } }))],
      { flexGrow: 1, flexBasis: "0px", minWidth: "220px", alignItems: "center", gap: "2px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "24px", paddingRight: "24px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: dernier ? "0px" : "1px", borderColor: "#1f2a2240", borderRadius: "0px" }, undefined, { minWidth: "100%", borderRightWidth: "0px", borderBottomWidth: dernier ? "0px" : "1px", paddingTop: "20px", paddingBottom: "20px" });
    const groupes = G.ligne(k, [groupe("Prestations", PRESTATIONS.slice(0, 3)), groupe("Ressources", RESSOURCES), groupe("Espace client", [["Se connecter", "/connexion"], ["Créer un compte", "/inscription"], ["Nous écrire", "/contact"]], true)], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const bandeGroupes = G.bande(k, [trait(k, "#c5c6c0"), groupes, trait(k, "#c5c6c0")], { fond: IVOIRE, colonne: true, gap: "28px", padV: ["24px", "20px", "16px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Groupes" });
    const pt = souffle(carre(k, SAUGE, "10px"), 3200);
    const carteInfo = (entete, enf) => cartel(k, [entete, ...enf], { fond: "#ffffff", contour: "#1f2a2240", contourSurvol: SAUGE, min: "280px", gap: "14px", pad: "28px" });
    const infos = G.ligne(k, [
      carteInfo(k.row([pt, caps(k, "Horaires", { couleur: SAUGE })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), [horaires(k, { couleur: ENCRE })]),
      carteInfo(caps(k, "Coordonnées", { couleur: SAUGE }), [coordonnees(k, { lien: ENCRE, survol: SAUGE, focus: SAUGE, couleur: ENCRE })]),
    ], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const bandeInfos = G.bande(k, [infos], { fond: IVOIRE, colonne: true, padV: ["0px", "0px", "0px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], max: "960px", nom: "Cartes" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Quelques conseils d'entretien, par courriel, de temps en temps.", largeur: "460px", accent: "#f6f3ea", surBouton: FORET, texte: "#e8efe9", couleurTitre: "#ffffff", fond: FORET, survolBouton: "#ffffff", survolTexte: FORET, focus: "#ffffff" });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#d3dfd6", liens: "#ffffff" }, "#bfe0c8");
    const bas = G.bande(k, [abo, trait(k, "#53695b"), mentions], { fond: FORET, colonne: true, gap: "28px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "22px" }, nom: "Lettre", couleur: "#ffffff" });
    return [G.racine(k, [haut, bandeGroupes, bandeInfos, bas])];
  },
}, FAM);

// ═══ ft2-487 « Blouse jaune » — multiservices franc, nettoyage industriel
// Idée : jaune signal et noir. Fine barre noire de liens rapides en tête ; puis DEUX PANNEAUX : à gauche, aplat jaune avec « Tout est propre. » en grandes capitales et la liste des prestations en 2 colonnes (rangées qui se remplissent de noir au survol) ;
// à droite, aplat noir avec contact, horaires et lettre. Polices : Barlow Condensed (titres) et Barlow. Mobile : panneaux empilés.
const jaune = identite({ key: "c487", label: "Jaune signal et noir", humeur: "light", fond: "#ffd60a", texte: "#111111", discret: "#3a3500", accent: "#111111", surface: "#fff2a8", encre: "#111111",
  police: "font.barlow", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#11111133" });
const JAUNE = "#ffd60a", NOIR = "#111111", NOIR2 = "#1c1c1c";
const blouse = modeleV2({
  id: identifiantV2(487, "blouse-jaune"), concept: "c-487-blouse-jaune", name: "Blouse jaune", family: FAM,
  description: "Pour un multiservices ou un nettoyage industriel : barre de liens rapides, puis deux panneaux, jaune signal avec prestations en capitales qui se remplissent de noir, et noir avec contact, horaires et lettre. Franc, très lisible.",
  tags: ["multiservices", "nettoyage industriel", "jaune", "noir", "deux panneaux", "capitales", "angles droits"],
  identity: jaune, racine: racineDe(NOIR),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const rapide = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const barre = G.bande(k, [G.ligne(k, rapide.map(([t, u]) => lien(k, t, u, { taille: 14, poids: "700", casse: "uppercase", suivi: "0.1em", couleur: "#ffffff", survol: { color: JAUNE, transform: { y: -2 } }, focus: JAUNE })), { gap: "0px 32px", largeur: "100%" })], { fond: NOIR, colonne: true, padV: ["6px", "6px", "6px"], padB: ["6px", "6px", "6px"], padH: ["48px", "32px", "20px"], nom: "Liens rapides" });
    const phrase = G.geant(`<p>Tout est<br>propre.</p>`, { taille: [60, 132], tablette: { taille: [84, 120] }, mobile: { taille: [60, 84] }, lh: 0.92, suivi: "-0.01em", poids: "800", police: S.head, couleur: NOIR, extra: { textTransform: "uppercase" } })(k, env);
    const ligneP = (t, u) => lien(k, t, u, { taille: 18, poids: "700", casse: "uppercase", suivi: "0.04em", couleur: NOIR, bloc: true, h: "56px", padH: "0px", survol: { backgroundColor: NOIR, color: JAUNE, paddingLeft: "16px" }, focus: NOIR, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: NOIR } });
    const presta = k.col([ligneP("Bureaux et locaux", "/catalogue"), ligneP("Parties communes", "/catalogue"), ligneP("Vitrerie et façades", "/catalogue"), ligneP("Après travaux", "/catalogue"), ligneP("Demander un devis", "/contact")], { gap: "0px", width: "100%", maxWidth: "560px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: NOIR });
    const gauche = k.col([caps(k, "Multiservices et nettoyage", { couleur: NOIR, suivi: "0.22em" }), phrase, presta],
      { backgroundColor: JAUNE, flexGrow: 6, flexBasis: "0px", minWidth: "320px", gap: "28px", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" });
    const pt = souffle(carre(k, JAUNE, "10px"), 3000);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos actualités, quelques fois par an.", largeur: "100%", accent: JAUNE, surBouton: NOIR, texte: "#ffffff", couleurTitre: JAUNE, fond: NOIR, survolBouton: "#ffffff", survolTexte: NOIR, focus: JAUNE });
    const droite = k.col([k.row([pt, caps(k, "Nous joindre", { couleur: JAUNE })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: JAUNE, focus: JAUNE }),
      trait(k, "#4d4d4d"), caps(k, "Horaires", { couleur: JAUNE }), horaires(k, { couleur: "#ffffff" }), trait(k, "#4d4d4d"), abo],
      { backgroundColor: NOIR2, flexGrow: 4, flexBasis: "0px", minWidth: "300px", gap: "18px", paddingTop: "72px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", borderRadius: "0px" }, { paddingLeft: "32px", paddingRight: "32px" }, { minWidth: "100%", paddingTop: "44px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const deux = { type: "container", name: "Deux panneaux", props: { full: true }, children: [gauche, droite], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", gap: "0px", alignItems: "stretch", backgroundColor: NOIR }) };
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#d9d9d9", liens: "#ffffff" }, JAUNE);
    const bas = G.bande(k, [mentions], { fond: NOIR, colonne: true, padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions", couleur: "#ffffff" });
    return [G.racine(k, [barre, deux, bas])];
  },
}, FAM);

// ═══ ft2-488 « Grille des prestations » — entreprise de propreté qui détaille ses services
// Idée : gris très clair et vert. Ligne d'en-tête (nom + phrase à gauche, bouton « Demander un devis » à droite), puis une MOSAÏQUE de six cartes blanches 3 × 2 (une prestation chacune, numéro, titre-lien, une phrase) qui se soulèvent
// au survol, enfin un bandeau vert profond en trois colonnes (horaires, contact, lettre) et les mentions. Polices : Lexend (titres) et Mulish. Mobile : cartes pleine largeur.
const vert = identite({ key: "c488", label: "Gris clair et vert prairie", humeur: "light", fond: "#eef1ef", texte: "#13231b", discret: "#475a4f", accent: "#14703f", surface: "#ffffff", encre: "#13231b",
  police: "font.mulish", titres: "font.lexend", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#13231b33" });
const GRIS = "#eef1ef", VERT = "#14703f", BOIS = "#0f3d2e", TXT = "#13231b";
const grille = modeleV2({
  id: identifiantV2(488, "grille-des-prestations"), concept: "c-488-grille-des-prestations", name: "Grille des prestations", family: FAM,
  description: "Pour une entreprise de propreté qui détaille ses services : en-tête avec bouton de devis, mosaïque de six cartes de prestations qui se soulèvent au survol, bandeau vert profond (horaires, contact, lettre) et mentions.",
  tags: ["nettoyage", "propreté", "prestations", "grille de cartes", "gris clair", "vert", "angles droits"],
  identity: vert, racine: racineDe(GRIS),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 34, TXT);
    const gauche = G.colonne(k, [caps(k, "Nos prestations", { couleur: VERT, suivi: "0.2em" }), nom, texte(k, "Six façons de garder vos locaux irréprochables. Choisissez, nous nous occupons du reste.", { couleur: S.mute, max: "480px", taille: 17 })], { poids: 7, min: "300px", gap: "12px" });
    const droite = G.colonne(k, [bouton(k, "Demander un devis", "/contact", { couleur: "#ffffff", fond: VERT, contour: VERT, survol: { backgroundColor: TXT, color: "#ffffff", transform: { y: -3 } }, focus: TXT })], { poids: 4, min: "250px", soi: "flex-end", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const haut = G.bande(k, [gauche, droite], { fond: GRIS, gap: "28px 48px", aligne: "flex-end", padV: ["80px", "64px", "48px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Tête" });
    const carte = (num, titre, phrase, url) => {
      const t = lien(k, titre, url, { taille: 20, poids: "700", police: S.head, couleur: TXT, lh: 1.2, survol: { color: VERT, transform: { x: 5 } }, focus: VERT });
      return cartel(k, [caps(k, num, { couleur: VERT, suivi: "0.2em" }), t, texte(k, phrase, { couleur: S.mute, taille: 15 })], { fond: "#ffffff", contour: "#13231b33", contourSurvol: VERT, min: "260px", gap: "8px", pad: "28px" });
    };
    const rang = (a) => G.ligne(k, a, { gap: "16px", aligne: "stretch", largeur: "100%" });
    const cartes = k.col([
      rang([carte("01", "Bureaux et locaux", "Entretien régulier des espaces de travail, du poste de travail aux sanitaires.", "/catalogue"), carte("02", "Parties communes", "Halls, escaliers et circulations d'immeubles, selon le planning convenu.", "/catalogue")]),
      rang([carte("03", "Vitrerie", "Vitres, baies et façades accessibles.", "/catalogue"), carte("04", "Après travaux", "Remise en état avant l'emménagement.", "/catalogue"), carte("05", "Sols et surfaces", "Remise en état et protection des sols.", "/catalogue"), carte("06", "Sur mesure", "Une demande particulière ? Décrivez-la.", "/contact")]),
    ], { gap: "16px", width: "100%" });
    const bandeCartes = G.bande(k, [cartes], { fond: GRIS, colonne: true, padV: ["0px", "0px", "0px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Cartes" });
    const pt = souffle(carre(k, "#9be3bd", "10px"), 3200);
    const c1 = GK.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: "#9be3bd" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), horaires(k, { couleur: "#ffffff" })], { poids: 1, min: "220px", gap: "12px" });
    const c2 = bloc(k, "Coordonnées", [coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: "#9be3bd", focus: "#9be3bd" })], { couleurTitre: "#9be3bd" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils d'entretien, par courriel, sans excès.", largeur: "360px", accent: "#9be3bd", surBouton: BOIS, texte: "#ffffff", couleurTitre: "#9be3bd", fond: BOIS, survolBouton: "#ffffff", survolTexte: BOIS, focus: "#ffffff" });
    const c3 = G.colonne(k, [abo], { poids: 1.3, min: "260px" });
    const c0 = liste(k, "Ressources", RESSOURCES, { couleurTitre: "#9be3bd", accent: "#9be3bd", couleur: "#ffffff" });
    const trois = G.ligne(k, [c0, c1, c2, c3], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = legale(G, k, env, { taille: 13, sansCookies: true, couleur: "#d6e6dc", liens: "#ffffff" }, "#9be3bd");
    const bas = G.bande(k, [trois, trait(k, "#4c6f61"), mentions], { fond: BOIS, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "26px" }, nom: "Bandeau", couleur: "#ffffff" });
    return [G.racine(k, [haut, bandeCartes, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Nettoyage et services généraux", target: 5, built: true,
  description: "Pieds standard pros animés, sans illustration : propreté, multiservices et entretien de locaux ; bandes d'appel, prestations classées, cartes de secteurs, panneaux jaune et noir. Angles droits.",
  models: [passage, carnet, cahier, blouse, grille],
};
