// Famille v2 « Intérim et emploi » — 5 modèles (ft2-469 à ft2-473), extension « standard pro animé » : SANS illustration, ANGLES DROITS partout (aucun border-radius).
// Pieds d'agence d'intérim, de cabinet de recrutement et de site d'emploi : deux panneaux candidats / entreprises, alerte offres en tête, parcours d'embauche en quatre étapes, annuaire de métiers en étiquettes,
// barre d'espace candidat avec annuaire à cinq colonnes. Tout est typographie, couleur, filets, aplats et cartes ; contenus utiles en français, marques fictives, AUCUNE coordonnée ni chiffre inventé
// (adresse, téléphone, e-mail et horaires viennent des « Données de l'entreprise »). Liens : routes de la plateforme uniquement (/catalogue pour les offres, /inscription, /connexion, /contact, /faq, /blog).
// MOUVEMENT (disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; bouton qui s'inverse ; carte qui se soulève ; étiquette qui se remplit ; cellule d'étape dont le fond s'éclaire ;
// libellés qui glissent ; carré de statut qui « respire ». Pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-std-s04");
const { DOUX, racineDe, lien, caps, para, trait, souffle, carre, horaires, coordonnees, bloc, listeLiens, lettre, nomDuSite, rangee } = A;

const FAM = "interim-emploi";
const W = ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];
const PAD = ["48px", "32px", "20px"];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-469 « Candidats et entreprises » — agence d'intérim généraliste
// Idée : DEUX PANNEAUX de bord à bord. À gauche, sur blanc, l'entrée candidats (grand titre, trois rangées, bouton plein) ; à droite, sur violet nuit, l'entrée entreprises (mêmes éléments, bouton orange).
// Une bande gris lavande dessous : coordonnées, horaires, lettre. Violet nuit, orange et blanc. Polices : Plus Jakarta Sans (titres) et Public Sans.
const duo = identite({
  key: "c469", label: "Blanc, violet nuit et orange", humeur: "light",
  fond: "#ffffff", texte: "#241046", discret: "#54476f", accent: "#b84a00", surface: "#f1eef8", encre: "#241046",
  police: "font.public-sans", titres: "font.plus-jakarta-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#24104633",
});
const VIOLET = "#241046", ORANGE = "#ff8a3d", LAVANDE = "#f1eef8";
const candidatsEntreprises = modeleV2({
  id: identifiantV2(469, "candidats-et-entreprises"), concept: "c-469-candidats-et-entreprises",
  name: "Candidats et entreprises", family: FAM,
  description: "Pour une agence d'intérim : deux panneaux de bord à bord, candidats sur blanc et entreprises sur violet nuit, chacun avec trois rangées de liens et un bouton carré, puis une bande lavande pour contact, horaires et lettre.",
  tags: ["intérim", "emploi", "candidats", "entreprises", "deux panneaux", "violet", "orange", "angles droits"],
  identity: duo,
  racine: racineDe(LAVANDE),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const panneau = (cat, titre, liens, bouton, o) => {
      const rangs = liens.map(([t, u], i) => rangee(k, `0${i + 1}`, t, u, { simple: true, accent: o.accent, couleur: o.texte, taille: 18, survolFond: o.survol, filet: o.filet, focus: o.accent, couleurSurvol: o.texte }));
      const b = lien(k, bouton[0], bouton[1], { taille: 16, poids: "700", casse: "uppercase", suivi: "0.06em", couleur: o.surBouton, h: "54px", padH: "28px", survol: { backgroundColor: o.survolBouton, color: o.surSurvol, transform: { y: -3 } }, focus: o.accent, extra: { backgroundColor: o.boutonFond, justifyContent: "center", alignSelf: "flex-start", borderStyle: "solid", borderWidth: "2px", borderColor: o.boutonFond } });
      return G.colonne(k, [caps(k, cat, { couleur: o.accent, suivi: "0.22em" }), k.T(`<p>${titre}</p>`, { fontSize: "fluid:32-52", lineHeight: 1.05, fontFamily: S.head, fontWeight: "800", letterSpacing: "-0.02em", color: o.texte }), k.col(rangs, { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: o.filet, borderRadius: "0px" }), b],
        { poids: 1, min: "340px", gap: "24px", aligne: "stretch", extra: { backgroundColor: o.fond, boxSizing: "border-box", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px" }, mobile: { minWidth: "100%", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    };
    const cand = panneau("Candidats", "Trouvez votre prochaine mission.", [["Voir les offres", "/catalogue"], ["Créer mon compte", "/inscription"], ["Conseils pour candidater", "/blog"]], ["Déposer mon CV", "/inscription"], { fond: "#ffffff", texte: VIOLET, accent: "#b84a00", survol: LAVANDE, filet: "#24104655", boutonFond: VIOLET, surBouton: "#ffffff", survolBouton: "#b84a00", surSurvol: "#ffffff" });
    const ent = panneau("Entreprises", "Recrutez sans perdre de temps.", [["Décrire mon besoin", "/contact"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]], ["Nous contacter", "/contact"], { fond: VIOLET, texte: "#ffffff", accent: ORANGE, survol: "#341a63", filet: "#ffffff66", boutonFond: ORANGE, surBouton: VIOLET, survolBouton: "#ffffff", surSurvol: VIOLET });
    const deux = G.bande(k, [cand, ent], { fond: VIOLET, max: "100%", gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Deux panneaux" });
    const cc = bloc(k, "Agence", [coordonnees(k, { couleur: VIOLET, lien: VIOLET, survol: "#b84a00", focus: "#b84a00" })], { couleurTitre: "#b84a00", min: "220px", gap: "12px", poids: 1.65 });
    const hh = bloc(k, "Horaires", [horaires(k, { couleur: VIOLET })], { couleurTitre: "#b84a00", min: "220px", gap: "12px", poids: 1.65 });
    const abo = lettre(k, env, G, { titre: "Alertes offres", intro: "Les nouvelles offres d'emploi par courriel.", largeur: "100%", accent: VIOLET, surBouton: "#ffffff", texte: VIOLET, couleurTitre: "#b84a00", fond: LAVANDE, survolBouton: "#b84a00", survolTexte: "#ffffff", focus: VIOLET, fondChamp: "transparent" });
    const nom = G.colonne(k, [nomDuSite(k, env, 26, VIOLET), para(k, "Intérim, CDD, CDI : une agence, des conseillers.", { taille: 15, max: "260px" }), cc], { poids: 2.1, min: "260px", gap: "12px" });
    abo.styles.desktop = { ...abo.styles.desktop, flexGrow: 2.4, flexBasis: "0px", minWidth: "260px" };
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#54476f", liens: VIOLET })(k, env);
    const bas = G.bande(k, [nom, hh, abo, trait(k, "#24104633"), mentions], { fond: LAVANDE, gap: "32px 48px", aligne: "flex-start", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, nom: "Agence" });
    return [G.racine(k, [deux, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-470 « Alerte offres » — site d'emploi, agence locale
// Idée : en TÊTE, une bande corail avec la lettre « Recevez les nouvelles offres » en grand (le pied commence par l'action) ; dessous trois colonnes de liens sur blanc (candidats, entreprises, agence) qui glissent,
// puis deux cartes à filet (coordonnées, horaires) qui se soulèvent au survol, sur rose très pâle. Corail, encre et blanc. Polices : Outfit (titres) et DM Sans.
const alerte = identite({
  key: "c470", label: "Corail, encre et blanc", humeur: "light",
  fond: "#ffffff", texte: "#1b1b24", discret: "#4d4d5c", accent: "#c4301a", surface: "#fff1ed", encre: "#1b1b24",
  police: "font.dm-sans", titres: "font.outfit",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#1b1b2433",
});
const CORAIL = "#c4301a", ENCRE = "#1b1b24", ROSE = "#fff1ed";
const alerteOffres = modeleV2({
  id: identifiantV2(470, "alerte-offres"), concept: "c-470-alerte-offres",
  name: "Alerte offres", family: FAM,
  description: "Pour un site d'emploi ou une agence locale : le pied commence par la lettre d'alertes sur une bande corail, puis trois colonnes de liens (candidats, entreprises, agence) et deux cartes à filet (contact, horaires) qui se soulèvent.",
  tags: ["emploi", "intérim", "alerte offres", "lettre en tête", "corail", "colonnes", "cartes", "angles droits"],
  identity: alerte,
  racine: racineDe(ROSE),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant("<p>Recevez les nouvelles offres avant les autres.</p>", { taille: [30, 56], tablette: { taille: [42, 48] }, mobile: { taille: [28, 34] }, lh: 1.08, suivi: "-0.02em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const gauche = G.colonne(k, [caps(k, "Alertes emploi", { couleur: "#ffffff", suivi: "0.22em" }), titre], { poids: 6, min: "300px", gap: "14px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Une sélection d'offres, par courriel.", largeur: "100%", accent: "#ffffff", surBouton: CORAIL, texte: "#ffffff", couleurTitre: "#ffffff", fond: CORAIL, survolBouton: ENCRE, survolTexte: "#ffffff", focus: "#ffffff" });
    const droite = G.colonne(k, [abo], { poids: 5, min: "290px", aligne: "stretch", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: CORAIL, gap: "32px 64px", aligne: "flex-end", padV: ["64px", "52px", "40px"], padB: ["64px", "52px", "40px"], padH: PAD, nom: "Alerte" });
    const menu = (t, liste) => k.row([caps(k, t, { couleur: CORAIL, suivi: "0.18em", extra: { minWidth: "130px" } }), ...listeLiens(k, liste, { taille: 18, poids: "600", couleur: ENCRE, accent: CORAIL, focus: CORAIL, decal: 6, extra: { paddingRight: "28px" } })], { alignItems: "center", flexWrap: "wrap", gap: "4px 0px", width: "100%", paddingTop: "10px", paddingBottom: "10px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1b1b2433", borderRadius: "0px" });
    const liens = G.bande(k, [
      menu("Candidats", [["Voir les offres", "/catalogue"], ["Créer mon compte", "/inscription"], ["Mon espace", "/connexion"], ["Conseils emploi", "/blog"]]),
      menu("Entreprises", [["Décrire mon besoin", "/contact"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]]),
      menu("L'agence", [["Nous écrire", "/contact"], ["Actualités", "/blog"], ["Accueil", "/"]]),
    ], { fond: "#ffffff", colonne: true, gap: "0px", padV: ["48px", "40px", "32px"], padB: ["48px", "40px", "32px"], padH: PAD, nom: "Liens" });
    const pt = souffle(carre(k, CORAIL, "10px"), 3000);
    const carteInfo = (titre, contenu, statut) => {
      const c = k.col([k.row([...(statut ? [statut] : []), caps(k, titre, { couleur: CORAIL })], { gap: "10px", alignItems: "center" }), contenu], { flexGrow: 1, flexBasis: "0px", minWidth: "260px", gap: "14px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderTopWidth: "4px", borderColor: ENCRE, borderRadius: "0px", boxSizing: "border-box", transitionDuration: DOUX });
      c.states = { hover: { transform: { y: -5 }, backgroundColor: "#ffffff" } };
      return c;
    };
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#4d4d5c", liens: ENCRE })(k, env);
    const cartes = G.bande(k, [
      G.ligne(k, [carteInfo("Notre agence", coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: CORAIL, focus: CORAIL })), carteInfo("Horaires d'accueil", horaires(k, { couleur: ENCRE }), pt)], { gap: "24px", aligne: "stretch", largeur: "100%" }),
      nomDuSite(k, env, 22, ENCRE), trait(k, "#1b1b2433"), mentions,
    ], { fond: ROSE, colonne: true, gap: "28px", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: PAD, nom: "Agence" });
    return [G.racine(k, [haut, liens, cartes])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-471 « Parcours d'embauche » — agence d'intérim, parcours candidat
// Idée : un PARCOURS en quatre cellules numérotées 1 à 4 (je m'inscris, je consulte les offres, je rencontre un conseiller, je suis accompagné) dessinées par des filets menthe sur vert profond, en police mono ;
// dessous, une DOUBLE RANGÉE de liens (une ligne candidats, une ligne entreprises) puis contact, horaires et lettre. Vert très foncé monochrome et menthe. Polices : IBM Plex Mono (titres) et IBM Plex Sans.
const parcours = identite({
  key: "c471", label: "Vert profond et menthe", humeur: "dark",
  fond: "#07302a", texte: "#e6f7ef", discret: "#a9d6c5", accent: "#8fe3c0", surface: "#0d4137", encre: "#07302a",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#8fe3c055",
});
const FORET = "#07302a", FORET2 = "#0d4137", MENTHE = "#8fe3c0";
const parcoursEmbauche = modeleV2({
  id: identifiantV2(471, "parcours-d-embauche"), concept: "c-471-parcours-d-embauche",
  name: "Parcours d'embauche", family: FAM,
  description: "Pour une agence d'intérim : quatre cellules numérotées dessinées par des filets menthe (inscription, offres, conseiller, accompagnement), une double rangée de liens candidats et entreprises, puis contact, horaires et lettre. Vert profond, police mono.",
  tags: ["intérim", "parcours", "étapes numérotées", "double rangée de liens", "vert profond", "menthe", "mono", "angles droits"],
  identity: parcours,
  racine: racineDe(FORET),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const entete = G.colonne(k, [caps(k, "Parcours candidat", { couleur: MENTHE, suivi: "0.24em" }), k.T("<p>Quatre étapes vers votre mission.</p>", { fontSize: "fluid:28-48", lineHeight: 1.1, fontFamily: S.head, color: "#ffffff", fontWeight: "600", letterSpacing: "-0.02em", maxWidth: "760px" })], { poids: 7, min: "300px", gap: "12px" });
    const nom = G.colonne(k, [nomDuSite(k, env, 24, "#ffffff")], { poids: 3, min: "220px", soi: "flex-end" });
    const cellule = (n, t, texte, url, dernier) => {
      const c = k.col([k.T(`<p>${n}</p>`, { fontSize: "48px", lineHeight: 1, fontFamily: S.head, color: MENTHE, fontWeight: "600" }), lien(k, t, url, { taille: 19, poids: "700", couleur: "#ffffff", police: S.head, survol: { color: MENTHE, transform: { x: 5 } }, focus: MENTHE, extra: { alignItems: "flex-start" } }), para(k, texte, { taille: 15, couleur: "#c4e8d8" })],
        { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "10px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: FORET, borderStyle: "solid", borderWidth: "0px", borderRightWidth: dernier ? "0px" : "1px", borderColor: "#8fe3c066", borderRadius: "0px", boxSizing: "border-box", transitionDuration: DOUX }, undefined, { minWidth: "100%", borderRightWidth: "0px", borderBottomWidth: dernier ? "0px" : "1px" });
      c.states = { hover: { backgroundColor: FORET2 } };
      return c;
    };
    const grille = G.ligne(k, [
      cellule("1", "Je m'inscris", "Un compte en quelques minutes.", "/inscription"),
      cellule("2", "Je consulte les offres", "Missions, CDD et CDI à pourvoir.", "/catalogue"),
      cellule("3", "Je rencontre un conseiller", "Un échange pour cibler vos envies.", "/contact"),
      cellule("4", "Je suis accompagné", "Réponses claires, suivi de mission.", "/faq", true),
    ], { gap: "0px", aligne: "stretch", largeur: "100%" });
    grille.styles.desktop = { ...grille.styles.desktop, borderStyle: "solid", borderWidth: "1px", borderColor: "#8fe3c066", borderRadius: "0px" };
    const haut = G.bande(k, [entete, nom, grille], { fond: FORET, gap: "28px 48px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["56px", "44px", "36px"], padH: PAD, nom: "Parcours" });
    // double rangée de liens
    const strate = (cat, liste) => k.row([G.colonne(k, [caps(k, cat, { couleur: MENTHE, suivi: "0.2em" })], { poids: 0, base: "160px", min: "140px" }), k.row(listeLiens(k, liste, { taille: 16, couleur: "#ffffff", accent: MENTHE, focus: MENTHE, extra: { paddingRight: "28px" } }), { alignItems: "center", flexWrap: "wrap", gap: "0px", flexGrow: 1 })],
      { alignItems: "center", gap: "12px 24px", width: "100%", paddingTop: "10px", paddingBottom: "10px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#8fe3c055", borderRadius: "0px" });
    const rangees = G.bande(k, [strate("Candidats", [["Offres", "/catalogue"], ["Mon compte", "/connexion"], ["Créer un compte", "/inscription"], ["Conseils", "/blog"]]), strate("Entreprises", [["Votre besoin", "/contact"], ["Espace client", "/connexion"], ["Questions", "/faq"], ["Actualités", "/blog"]])], { fond: FORET2, colonne: true, gap: "0px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Liens" });
    const cc = bloc(k, "Agence", [coordonnees(k, { couleur: "#e6f7ef", lien: "#ffffff", survol: MENTHE, focus: MENTHE })], { couleurTitre: MENTHE, min: "220px", gap: "12px" });
    const hh = bloc(k, "Horaires", [horaires(k, { couleur: "#e6f7ef" })], { couleurTitre: MENTHE, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Alertes offres", intro: "Les offres de la semaine, sans surcharge.", largeur: "100%", accent: MENTHE, surBouton: FORET, texte: "#e6f7ef", couleurTitre: MENTHE, fond: FORET, survolBouton: "#ffffff", survolTexte: FORET, focus: MENTHE });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#bfe3d3", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.ligne(k, [cc, hh, G.colonne(k, [abo], { poids: 1.3, min: "260px", aligne: "stretch" })], { gap: "32px 56px", aligne: "flex-start", largeur: "100%" }), trait(k, "#8fe3c055"), mentions], { fond: FORET, colonne: true, gap: "32px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, couleur: "#ffffff", nom: "Contact" });
    return [G.racine(k, [haut, rangees, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-472 « Annuaire des métiers » — agence d'intérim spécialisée par secteurs
// Idée : à gauche, un très GRAND titre en capitales condensées (« Trouvez votre mission. ») ; à droite, une grille de neuf ÉTIQUETTES carrées de secteurs qui se remplissent de vert citron au survol ;
// une bande citron dessous porte contact, horaires et lettre. Anthracite et vert citron. Polices : Anton (titre) et Hanken Grotesk.
const metiers = identite({
  key: "c472", label: "Anthracite et vert citron", humeur: "dark",
  fond: "#17181a", texte: "#f1f1ee", discret: "#b9bbb4", accent: "#d6ff3d", surface: "#232528", encre: "#111111",
  police: "font.hanken-grotesk", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#ffffff33",
});
const ANTHRACITE = "#17181a", CITRON = "#d6ff3d", NOIR = "#111111";
const annuaireMetiers = modeleV2({
  id: identifiantV2(472, "annuaire-des-metiers"), concept: "c-472-annuaire-des-metiers",
  name: "Annuaire des métiers", family: FAM,
  description: "Pour une agence d'intérim par secteurs : un grand titre en capitales condensées face à neuf étiquettes carrées de métiers qui se remplissent de vert citron au survol, puis une bande citron pour contact, horaires et lettre.",
  tags: ["intérim", "métiers", "secteurs", "étiquettes", "capitales condensées", "anthracite", "vert citron", "angles droits"],
  identity: metiers,
  racine: racineDe(CITRON),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant("<p>Trouvez votre<br>mission.</p>", { taille: [52, 100], tablette: { taille: [76, 92] }, mobile: { taille: [52, 68] }, lh: 0.98, suivi: "0.005em", poids: "400", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const gauche = G.colonne(k, [caps(k, "Missions par secteur", { couleur: CITRON, suivi: "0.24em" }), titre, para(k, "Choisissez un secteur : les offres de la plateforme s'ouvrent aussitôt.", { taille: 17, couleur: "#d8dad3", max: "380px" }), nomDuSite(k, env, 22, "#ffffff", { fontFamily: S.font, fontWeight: "800" })], { poids: 5, min: "300px", gap: "20px" });
    const etiquette = (t) => lien(k, t, "/catalogue", { taille: 17, poids: "700", couleur: "#ffffff", h: "64px", padH: "18px", survol: { backgroundColor: CITRON, color: NOIR, transform: { y: -3 } }, focus: CITRON, extra: { flexGrow: 1, flexBasis: "160px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: "#ffffff66", backgroundColor: "transparent", justifyContent: "flex-start" } });
    const grille = G.ligne(k, ["Logistique", "Industrie", "BTP", "Tertiaire", "Hôtellerie", "Santé", "Transport", "Commerce", "Agroalimentaire"].map(etiquette), { gap: "8px", aligne: "stretch", largeur: "100%" });
    const droite = G.colonne(k, [grille], { poids: 7, min: "320px", aligne: "stretch", soi: "center" });
    const haut = G.bande(k, [gauche, droite], { fond: ANTHRACITE, gap: "40px 64px", aligne: "center", padV: ["80px", "60px", "44px"], padB: ["72px", "56px", "40px"], padH: PAD, nom: "Secteurs" });
    const cc = bloc(k, "Agence", [coordonnees(k, { couleur: NOIR, lien: NOIR, survol: "#3a4a00", focus: NOIR })], { couleurTitre: NOIR, min: "220px", gap: "12px" });
    const hh = bloc(k, "Horaires", [horaires(k, { couleur: NOIR })], { couleurTitre: NOIR, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Alertes offres", intro: "Les missions de votre secteur, par courriel.", largeur: "100%", accent: NOIR, surBouton: CITRON, texte: NOIR, couleurTitre: NOIR, fond: CITRON, survolBouton: "#ffffff", survolTexte: NOIR, focus: NOIR });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#262a00", liens: NOIR })(k, env);
    const bas = G.bande(k, [G.ligne(k, [cc, hh, G.colonne(k, [abo], { poids: 1.3, min: "260px", aligne: "stretch" })], { gap: "32px 56px", aligne: "flex-start", largeur: "100%" }), trait(k, "#11111166"), mentions], { fond: CITRON, colonne: true, gap: "32px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, couleur: NOIR, nom: "Contact" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-473 « Espace candidat » — cabinet de recrutement, site d'emploi
// Idée : une BARRE D'ACCÈS blanche en tête (nom, « Se connecter » en contour, « Créer mon compte » plein magenta), un filet noir épais, un ANNUAIRE à cinq colonnes (candidats, entreprises, ressources, agence, horaires)
// puis une bande noire avec la lettre en ligne. Blanc, encre et magenta. Polices : Instrument Serif (titres) et Albert Sans.
const espace = identite({
  key: "c473", label: "Blanc, encre et magenta", humeur: "light",
  fond: "#ffffff", texte: "#14141a", discret: "#505060", accent: "#b3125a", surface: "#f6f4f7", encre: "#14141a",
  police: "font.albert-sans", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#14141a33",
});
const ENCRE2 = "#14141a", MAGENTA = "#b3125a";
const espaceCandidat = modeleV2({
  id: identifiantV2(473, "espace-candidat"), concept: "c-473-espace-candidat",
  name: "Espace candidat", family: FAM,
  description: "Pour un cabinet de recrutement : une barre d'accès avec deux boutons carrés (se connecter, créer son compte), un annuaire à cinq colonnes (candidats, entreprises, ressources, agence, horaires) et une bande noire pour la lettre.",
  tags: ["recrutement", "emploi", "barre d'accès", "annuaire", "cinq colonnes", "magenta", "encre", "angles droits"],
  identity: espace,
  racine: racineDe(ENCRE2),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const bouton = (t, u, plein) => lien(k, t, u, { taille: 16, poids: "700", couleur: plein ? "#ffffff" : ENCRE2, h: "52px", padH: "26px", survol: plein ? { backgroundColor: ENCRE2, color: "#ffffff", transform: { y: -3 } } : { backgroundColor: ENCRE2, color: "#ffffff", transform: { y: -3 } }, focus: MAGENTA, extra: { backgroundColor: plein ? MAGENTA : "transparent", borderStyle: "solid", borderWidth: "2px", borderColor: plein ? MAGENTA : ENCRE2, justifyContent: "center" } });
    const gauche = G.colonne(k, [nomDuSite(k, env, 34, ENCRE2, { fontFamily: S.head, fontWeight: "400", letterSpacing: "0em" }), para(k, "Recrutement et emploi : des offres, des conseillers, un suivi.", { taille: 16, max: "380px" })], { poids: 6.6, min: "300px", gap: "8px" });
    const droite = G.colonne(k, [k.row([bouton("Se connecter", "/connexion", false), bouton("Créer mon compte", "/inscription", true)], { gap: "12px" })], { poids: 4.2, min: "300px", soi: "flex-end", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const acces = G.bande(k, [gauche, droite], { fond: "#ffffff", gap: "28px 48px", aligne: "center", padV: ["56px", "44px", "36px"], padB: ["48px", "40px", "32px"], padH: PAD, filetHaut: undefined, nom: "Accès" });
    const col = (t, liste, p) => G.colonne(k, [caps(k, t, { couleur: MAGENTA, suivi: "0.18em" }), ...listeLiens(k, liste, { taille: 16, couleur: ENCRE2, accent: MAGENTA, focus: MAGENTA })], { poids: p, min: "180px", gap: "2px" });
    const annuaire = G.ligne(k, [
      col("Candidats", [["Voir les offres", "/catalogue"], ["Mon espace", "/connexion"], ["Créer un compte", "/inscription"]], 1.1),
      col("Entreprises", [["Votre besoin", "/contact"], ["Espace client", "/connexion"], ["Questions", "/faq"]], 0.9),
      col("Ressources", [["Conseils emploi", "/blog"], ["Actualités", "/blog"], ["Aide", "/faq"]], 0.8),
      bloc(k, "Agence et horaires", [coordonnees(k, { couleur: ENCRE2, lien: ENCRE2, survol: MAGENTA, focus: MAGENTA, taille: 15 }), horaires(k, { couleur: ENCRE2, taille: 15 })], { couleurTitre: MAGENTA, min: "240px", poids: 1.9, gap: "12px" }),
    ], { gap: "32px 36px", aligne: "flex-start", largeur: "100%" });
    const corps = G.bande(k, [annuaire], { fond: "#ffffff", colonne: true, padV: ["40px", "36px", "32px"], padB: ["64px", "52px", "40px"], padH: PAD, filetHaut: { epaisseur: "4px", couleur: ENCRE2 }, nom: "Annuaire" });
    const abo = lettre(k, env, G, { titre: "Alertes offres", intro: "Les offres qui vous concernent, par courriel.", largeur: "100%", accent: "#ff7ab5", surBouton: ENCRE2, texte: "#e9e9ee", couleurTitre: "#ff7ab5", fond: ENCRE2, survolBouton: "#ffffff", survolTexte: ENCRE2, focus: "#ffffff" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c9c9d2", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.ligne(k, [G.colonne(k, [caps(k, "Restez informé", { couleur: "#ff7ab5", suivi: "0.2em" }), k.T("<p>Les offres, directement dans votre boîte.</p>", { fontSize: "fluid:24-36", lineHeight: 1.15, fontFamily: S.head, color: "#ffffff", fontWeight: "400" })], { poids: 4.7, min: "280px", gap: "10px" }), G.colonne(k, [abo], { poids: 5.8, min: "290px", aligne: "stretch" })], { gap: "28px 64px", aligne: "flex-end", largeur: "100%" }), trait(k, "#ffffff33"), mentions], { fond: ENCRE2, colonne: true, gap: "32px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, couleur: "#ffffff", nom: "Lettre" });
    return [G.racine(k, [acces, corps, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Intérim et emploi", target: 5, built: true,
  description: "Pieds d'agence d'intérim et de recrutement, standard et pros : deux panneaux candidats et entreprises, alerte offres, parcours d'embauche, annuaire de métiers, barre d'espace candidat. Sans illustration, angles droits.",
  models: [candidatsEntreprises, alerteOffres, parcoursEmbauche, annuaireMetiers, espaceCandidat],
};
