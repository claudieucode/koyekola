// Famille v2 « Cabinets dentaires et orthodontie » — 5 modèles (ft2-439 à ft2-443), extension « standard pro animé » : AUCUNE illustration, ANGLES DROITS partout.
// Pieds de cabinet dentaire, de centre de soins et d'orthodontie : pied centré à bouton de rendez-vous, plan de soins en quatre étapes, trois bandes empilées, bandeau d'urgence, grille de cartes de soins.
// Contenus utiles (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre,
// AUCUNE promesse de résultat : les rubriques et les étapes sont des intitulés d'exemple à adapter dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce », le moteur coupe les transitions et les animations d'attention) :
//   · transitions longues et douces de 360 ms : couleur, fond qui s'éclaire, décalage de 2 à 8 px, filet qui s'étire, carte qui se soulève ;
//   · au moins une animation visible par modèle : carré de statut qui « respire », étape qui se soulève, bouton qui s'inverse, carte dont le filet s'allonge.
const { identite, GK, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, lettre, nomDuSite, bouton, listeLiens, DOUX } = require("../aides-std-s01");
const { modeleV2, identifiantV2 } = require("../kit-v2");

const FAM = "dentaire-orthodontie";
const PAD = (a, b, c) => [a, b, c];

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-439 « Sourire clair » — cabinet dentaire de quartier
// Idée : un pied ENTIÈREMENT CENTRÉ, sobre et lumineux. Nom du cabinet, ligne de liens horizontale, gros bouton « Prendre rendez-vous » à angles droits, puis trois petits blocs centrés (adresse, horaires, lettre) séparés
// par des filets verticaux fins ; mince barre bleue pour les mentions. Le bouton s'inverse et se soulève ; les liens se soulignent ; carré de statut qui respire. Polices : Jost (titres) et Mulish.
const glace = identite({
  key: "c439", label: "Bleu glace, blanc et bleu cabinet", humeur: "light",
  fond: "#f1f7fb", texte: "#0d2a45", discret: "#43596e", accent: "#0a5c9e", surface: "#ffffff", encre: "#0d2a45",
  police: "font.mulish", titres: "font.jost",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0d2a4533",
});
const GLACE = "#f1f7fb", BLEU = "#0a5c9e", BLEU2 = "#073d6b", ENC = "#0d2a45";
const sourireClair = modeleV2({
  id: identifiantV2(439, "sourire-clair"), concept: "c-439-sourire-clair",
  name: "Sourire clair", family: FAM,
  description: "Pour un cabinet dentaire de quartier : pied centré, ligne de liens, grand bouton de rendez-vous qui s'inverse, trois blocs centrés (adresse, horaires, lettre) et barre bleue de mentions. Bleu glace et blanc, angles droits.",
  tags: ["dentiste", "cabinet dentaire", "centré", "rendez-vous", "bleu glace", "sobre", "angles droits"],
  identity: glace, racine: racineDe(BLEU2), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 34, ENC, { fontWeight: "600", textAlign: "center" });
    const mot = texte(k, "Soins, prévention, conseils : une équipe à votre écoute, du premier rendez-vous au suivi.", { taille: 17, max: "520px", extra: { textAlign: "center" } });
    const liens = G.ligne(k, [["Accueil", "/"], ["Conseils", "/blog"], ["Questions fréquentes", "/faq"], ["Espace patient", "/connexion"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "700", couleur: ENC, survol: { color: BLEU, transform: { y: -2 } }, focus: BLEU, padH: "6px" })), { gap: "4px 22px", justifie: "center", largeur: "100%" });
    const btn = bouton(k, "Prendre rendez-vous", "/contact", { taille: 17, h: "58px", padH: "40px", texte: "#ffffff", fond: BLEU, soi: "center", survol: { backgroundColor: ENC, color: "#ffffff", transform: { y: -3 } }, focus: ENC });
    const haut = G.bande(k, [caps(k, "Cabinet dentaire", { couleur: BLEU, suivi: "0.22em" }), nom, mot, btn, liens], { fond: GLACE, colonne: true, aligne: "center", gap: "18px", padV: PAD("80px", "64px", "44px"), padB: PAD("48px", "40px", "32px"), padH: PAD("48px", "32px", "20px"), innerMobile: { alignItems: "center" }, nom: "Rendez-vous" });
    const pt = souffle(carre(k, BLEU, "10px"), 3200);
    const cell = (enfants, o = {}) => k.col(enfants, { flexGrow: 1, flexBasis: "0px", minWidth: "240px", alignItems: "center", gap: "12px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "28px", paddingRight: "28px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: o.dernier ? "0px" : "1px", borderColor: "#0d2a4533", borderRadius: "0px", textAlign: "center", boxSizing: "border-box" }, undefined, { minWidth: "100%", borderRightWidth: "0px", paddingLeft: "0px", paddingRight: "0px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils de prévention, par courriel.", largeur: "100%", accent: BLEU, surBouton: "#ffffff", texte: ENC, couleurTitre: BLEU, fond: "#ffffff", survolBouton: ENC, survolTexte: "#ffffff", focus: ENC });
    const tiers = G.bande(k, [
      cell([caps(k, "Adresse", { couleur: BLEU }), coordonnees(k, { lien: ENC, survol: BLEU, focus: BLEU })]),
      cell([k.row([pt, caps(k, "Horaires", { couleur: BLEU })], { gap: "10px", alignItems: "center", justifyContent: "center" }), horaires(k, {})]),
      cell([abo], { dernier: true }),
    ], { fond: "#ffffff", aligne: "stretch", gap: "32px 0px", padV: PAD("56px", "48px", "40px"), padB: PAD("56px", "48px", "40px"), padH: PAD("48px", "32px", "20px"), filetHaut: { epaisseur: "1px", couleur: "#0d2a4533" }, nom: "Trois blocs" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#dbe8f4", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: BLEU2, colonne: true, padV: PAD("22px", "20px", "18px"), padH: PAD("48px", "32px", "20px"), nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, tiers, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-440 « Plan de soins » — cabinet qui explique son parcours
// Idée : un bandeau marine de QUATRE ÉTAPES numérotées (01 Consultation, 02 Bilan, 03 Soins, 04 Suivi) en cellules bord à bord à filets fins ; chaque étape se soulève et s'éclaircit au survol. Sous le bandeau, sur blanc,
// quatre colonnes : cabinet et lettre, liens, coordonnées, horaires. Les étapes sont des intitulés d'exemple à adapter. Polices : Manrope (titres) et Source Sans 3.
const marine = identite({
  key: "c440", label: "Marine, cyan et blanc", humeur: "dark",
  fond: "#0c2340", texte: "#e8f1fa", discret: "#a9bfd6", accent: "#7dd3fc", surface: "#12315a", encre: "#0c2340", surEncre: "#e8f1fa",
  police: "font.source-sans-3", titres: "font.manrope",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#e8f1fa40",
});
const MARINE = "#0c2340", MARINE2 = "#12315a", CYAN = "#7dd3fc", CYAN2 = "#0b6a8e";
const planDeSoins = modeleV2({
  id: identifiantV2(440, "plan-de-soins"), concept: "c-440-plan-de-soins",
  name: "Plan de soins", family: FAM,
  description: "Pour un cabinet qui explique son parcours : un bandeau marine de quatre étapes numérotées qui se soulèvent au survol, puis quatre colonnes blanches (cabinet et lettre, liens, contact, horaires). Marine, cyan et blanc.",
  tags: ["dentiste", "étapes numérotées", "parcours de soins", "marine", "cyan", "quatre colonnes", "angles droits"],
  identity: marine, racine: racineDe(MARINE), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const ETAPES = [["01", "Consultation", "Premier rendez-vous et écoute.", "/contact"], ["02", "Bilan", "Examen et explications claires.", "/faq"], ["03", "Soins", "Un plan adapté à chacun.", "/blog"], ["04", "Suivi", "Contrôles et conseils réguliers.", "/connexion"]];
    const etape = ([n, t, d, u], i) => {
      const l = lien(k, t, u, { taille: 24, poids: "800", police: S.head, couleur: "#ffffff", survol: { color: CYAN }, focus: CYAN });
      const barre = k.col([], { width: "28px", height: "3px", backgroundColor: CYAN, borderRadius: "0px", transitionDuration: DOUX });
      barre.states = { hover: { width: "80px" } };
      const c = k.col([caps(k, n, { couleur: CYAN, suivi: "0.18em" }), l, texte(k, d, { taille: 15, couleur: "#c6d6e8" }), barre], { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "10px", paddingTop: "36px", paddingBottom: "36px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: MARINE, borderStyle: "solid", borderWidth: "0px", borderLeftWidth: i ? "1px" : "0px", borderColor: "#e8f1fa40", borderRadius: "0px", boxSizing: "border-box", transitionDuration: DOUX }, undefined, { minWidth: "100%", borderLeftWidth: "0px", borderTopWidth: i ? "1px" : "0px" });
      c.states = { hover: { backgroundColor: MARINE2, transform: { y: -4 } } };
      return c;
    };
    const titre = G.geant(`<p>Votre plan<br>de soins.</p>`, { taille: [36, 64], mobile: { taille: [34, 44] }, lh: 1.05, suivi: "-0.015em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const entete = G.bande(k, [G.colonne(k, [caps(k, "Cabinet dentaire", { couleur: CYAN, suivi: "0.22em" }), titre], { poids: 1, min: "260px", gap: "12px" }), bouton(k, "Prendre rendez-vous", "/contact", { texte: MARINE, fond: CYAN, survol: { backgroundColor: "#ffffff", color: MARINE, transform: { x: 6 } }, focus: "#ffffff" })], { fond: MARINE, aligne: "flex-end", gap: "24px 48px", padV: PAD("72px", "56px", "40px"), padB: PAD("36px", "30px", "24px"), padH: PAD("48px", "32px", "20px"), nom: "Titre" });
    const etapes = G.bande(k, ETAPES.map(etape), { fond: MARINE, aligne: "stretch", gap: "0px", padV: PAD("0px", "0px", "0px"), padB: PAD("0px", "0px", "0px"), padH: PAD("48px", "32px", "0px"), nom: "Étapes" });
    const nom = nomDuSite(k, env, 24, MARINE);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils de prévention, par courriel.", largeur: "100%", accent: MARINE, surBouton: "#ffffff", texte: "#0c2340", couleurTitre: MARINE, fond: "#ffffff", survolBouton: CYAN2, survolTexte: "#ffffff", focus: MARINE });
    const c1 = G.colonne(k, [nom, abo], { poids: 1.5, min: "260px", gap: "18px" });
    const c2 = listeLiens(k, "Le cabinet", [["Accueil", "/"], ["Conseils", "/blog"], ["Questions fréquentes", "/faq"], ["Espace patient", "/connexion"]], { couleur: MARINE, accent: CYAN2, couleurTitre: CYAN2 });
    const c3 = G.colonne(k, [caps(k, "Coordonnées", { couleur: CYAN2 }), coordonnees(k, { couleur: MARINE, lien: MARINE, survol: CYAN2, focus: CYAN2 })], { poids: 1.2, min: "220px", gap: "12px" });
    const pt = souffle(carre(k, CYAN2, "10px"), 3200);
    const c4 = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: CYAN2 })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: MARINE })], { poids: 1.2, min: "220px", gap: "12px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3b5068", liens: MARINE })(k, env);
    const blanc = G.bande(k, [G.ligne(k, [c1, c2, c3, c4], { gap: "36px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), trait(k, "#c3ccd8"), mentions], { fond: "#ffffff", couleur: "#0c2340", colonne: true, gap: "36px", padV: PAD("64px", "52px", "40px"), padB: PAD("24px", "20px", "20px"), padH: PAD("48px", "32px", "20px"), innerMobile: { rowGap: "28px" }, nom: "Colonnes" });
    return [G.racine(k, [entete, etapes, blanc])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-441 « Cabinet en trois temps » — cabinet de groupe ou centre dentaire
// Idée : TROIS BANDES horizontales aux fonds différents, chacune sur UNE seule rangée : (1) blanc, nom et ligne de liens séparés par des barres ; (2) menthe, coordonnées, horaires et bouton de rendez-vous côte à côte ;
// (3) vert profond, lettre et mentions. Le nom de la rangée 1 est en grandes capitales. Les liens se soulignent d'un filet qui s'étire ; carré de statut qui respire. Polices : Fraunces (titres) et Work Sans.
const menthe = identite({
  key: "c441", label: "Blanc, menthe et vert profond", humeur: "light",
  fond: "#ffffff", texte: "#12352b", discret: "#44594f", accent: "#0f7a5a", surface: "#dcf2e8", encre: "#12352b",
  police: "font.work-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#12352b33",
});
const MENT = "#dcf2e8", VP = "#12352b", VP2 = "#0b241c", VERT3 = "#0f7a5a";
const troisTemps = modeleV2({
  id: identifiantV2(441, "cabinet-en-trois-temps"), concept: "c-441-cabinet-en-trois-temps",
  name: "Cabinet en trois temps", family: FAM,
  description: "Pour un centre dentaire : trois bandes d'une seule rangée, blanc (nom et liens), menthe (contact, horaires, rendez-vous), vert profond (lettre et mentions). Blanc, menthe et vert profond, angles droits.",
  tags: ["dentiste", "centre dentaire", "trois bandes", "menthe", "vert profond", "une rangée", "angles droits"],
  identity: menthe, racine: racineDe(VP2), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, VP, { fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" });
    const sep = () => k.col([], { width: "1px", height: "20px", backgroundColor: "#12352b55", borderRadius: "0px", flexShrink: 0 });
    const lk = (t, u) => {
      const l = lien(k, t, u, { taille: 15, poids: "600", couleur: VP, survol: { color: VERT3 }, focus: VERT3, padH: "4px" });
      return l;
    };
    const liens = G.ligne(k, [lk("Accueil", "/"), sep(), lk("Conseils", "/blog"), sep(), lk("Questions fréquentes", "/faq"), sep(), lk("Espace patient", "/connexion")], { gap: "6px 14px", justifie: "flex-end" });
    const un = G.bande(k, [nom, liens], { fond: "#ffffff", aligne: "center", gap: "16px 40px", padV: PAD("40px", "34px", "28px"), padH: PAD("48px", "32px", "20px"), nom: "Nom et liens" });
    const pt = souffle(carre(k, VERT3, "10px"), 3200);
    const cc = G.colonne(k, [caps(k, "Coordonnées", { couleur: VERT3 }), coordonnees(k, { lien: VP, survol: VERT3, focus: VERT3 })], { poids: 1, min: "220px", gap: "12px" });
    const ch = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: VERT3 })], { gap: "10px", alignItems: "center" }), horaires(k, {})], { poids: 1, min: "220px", gap: "12px" });
    const rdv = G.colonne(k, [caps(k, "Rendez-vous", { couleur: VERT3 }), texte(k, "Une question avant de venir ? Écrivez-nous.", { couleur: VP, taille: 16, max: "280px" }), bouton(k, "Prendre rendez-vous", "/contact", { texte: "#ffffff", fond: VP, soi: "flex-start", survol: { backgroundColor: VERT3, color: "#ffffff", transform: { x: 6 } }, focus: VP })], { poids: 1, min: "240px", gap: "12px" });
    const deux = G.bande(k, [cc, ch, rdv], { fond: MENT, aligne: "flex-start", gap: "36px 56px", padV: PAD("56px", "48px", "40px"), padH: PAD("48px", "32px", "20px"), nom: "Contact" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils de prévention, par courriel.", largeur: "440px", accent: "#9fe3c6", surBouton: VP2, texte: "#e3f5ec", couleurTitre: "#ffffff", fond: VP2, survolBouton: "#ffffff", survolTexte: VP2, focus: "#ffffff" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#bfe0d2", liens: "#ffffff" })(k, env);
    const trois = G.bande(k, [abo, G.colonne(k, [mentions], { poids: 1, min: "260px", aligne: "flex-end", mobile: { alignItems: "flex-start" } })], { fond: VP2, aligne: "center", gap: "28px 48px", padV: PAD("44px", "38px", "32px"), padB: PAD("24px", "20px", "20px"), padH: PAD("48px", "32px", "20px"), nom: "Lettre" });
    trois.styles.desktop.color = "#ffffff";
    return [G.racine(k, [un, deux, trois])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-442 « Urgence dentaire » — cabinet qui accueille les urgences
// Idée : un BANDEAU D'URGENCE rouge brique en tête (« Une douleur ? Contactez-nous vite. ») avec bouton blanc carré qui devient noir, puis un corps ANTHRACITE en deux colonnes : à gauche trois colonnes de liens (Soins,
// Cabinet, Aide), à droite une carte blanche à angles droits avec coordonnées et horaires (statut qui respire). Lettre en pied. Les rubriques sont des intitulés d'exemple. Polices : Archivo et Karla.
const brique = identite({
  key: "c442", label: "Rouge brique, anthracite et blanc", humeur: "dark",
  fond: "#1c2025", texte: "#eef0f2", discret: "#b4bcc5", accent: "#ff9d8a", surface: "#2a3037", encre: "#1c2025", surEncre: "#eef0f2",
  police: "font.karla", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#eef0f240",
});
const BRIQ = "#b3261e", ANTH = "#1c2025", ANTH2 = "#14171b";
const urgence = modeleV2({
  id: identifiantV2(442, "urgence-dentaire"), concept: "c-442-urgence-dentaire",
  name: "Urgence dentaire", family: FAM,
  description: "Pour un cabinet qui accueille les urgences : bandeau rouge brique d'appel, trois colonnes de liens sur anthracite, carte blanche de contact et d'horaires, lettre en pied. Rouge brique, anthracite et blanc, angles droits.",
  tags: ["dentiste", "urgence", "bandeau d'appel", "rouge brique", "anthracite", "carte", "angles droits"],
  identity: brique, racine: racineDe(ANTH2), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Une douleur ?<br>Contactez-nous vite.</p>`, { taille: [34, 60], tablette: { taille: [42, 54] }, mobile: { taille: [32, 40] }, lh: 1.05, suivi: "-0.01em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const g = G.colonne(k, [caps(k, "Urgences", { couleur: "#ffffff", suivi: "0.22em" }), phrase], { poids: 6, min: "280px", gap: "12px" });
    const btn = bouton(k, "Appeler ou écrire", "/contact", { taille: 17, h: "56px", padH: "34px", texte: BRIQ, fond: "#ffffff", survol: { backgroundColor: ANTH, color: "#ffffff", transform: { x: 6 } }, focus: "#ffffff" });
    const bandeau = G.bande(k, [g, G.colonne(k, [btn], { poids: 3, min: "240px", aligne: "flex-end", mobile: { alignItems: "flex-start" } })], { fond: BRIQ, aligne: "center", gap: "24px 40px", padV: PAD("48px", "40px", "34px"), padH: PAD("48px", "32px", "20px"), nom: "Urgence" });
    const opt = { couleur: "#ffffff", accent: "#ff9d8a", couleurTitre: "#ff9d8a", taille: 16, min: "140px" };
    const liens = G.ligne(k, [
      listeLiens(k, "Soins", [["Conseils", "/blog"], ["Questions fréquentes", "/faq"], ["Rendez-vous", "/contact"]], opt),
      listeLiens(k, "Cabinet", [["Accueil", "/"], ["Contact", "/contact"], ["Espace patient", "/connexion"]], opt),
      listeLiens(k, "Aide", [["Mon compte", "/boutique/compte"], ["Inscription", "/inscription"]], opt),
    ], { gap: "28px 36px", aligne: "flex-start", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils de prévention, par courriel.", largeur: "460px", accent: "#ff9d8a", surBouton: ANTH, texte: "#eef0f2", couleurTitre: "#ffffff", fond: ANTH, survolBouton: "#ffffff", survolTexte: ANTH, focus: "#ffffff" });
    const gauche = G.colonne(k, [nomDuSite(k, env, 26, "#ffffff", { fontFamily: S.head, fontWeight: "800" }), liens, trait(k, "#eef0f233"), abo], { poids: 6, min: "320px", gap: "28px", aligne: "stretch" });
    const pt = souffle(carre(k, BRIQ, "10px"), 3000);
    const carte = k.col([caps(k, "Coordonnées", { couleur: BRIQ }), coordonnees(k, { couleur: ANTH, lien: ANTH, survol: BRIQ, focus: BRIQ }), trait(k, "#1c202533"), k.row([pt, caps(k, "Horaires", { couleur: BRIQ })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: ANTH })],
      { flexGrow: 1, flexBasis: "0px", minWidth: "280px", gap: "14px", backgroundColor: "#ffffff", borderRadius: "0px", boxSizing: "border-box", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", transitionDuration: DOUX }, undefined, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px" });
    carte.states = { hover: { transform: { y: -4 } } };
    const corps = G.bande(k, [gauche, G.colonne(k, [carte], { poids: 4, min: "280px", aligne: "stretch" })], { fond: ANTH, aligne: "flex-start", gap: "40px 64px", padV: PAD("72px", "56px", "44px"), padB: PAD("56px", "44px", "36px"), padH: PAD("48px", "32px", "20px"), nom: "Corps" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c5ccd3", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: ANTH2, colonne: true, padV: PAD("22px", "20px", "18px"), padH: PAD("48px", "32px", "20px"), nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [bandeau, corps, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-443 « Alignement lavande » — cabinet d'orthodontie
// Idée : un pied MONOCHROME PROFOND violet. Grande phrase « Un sourire, un plan. » en capitales d'un côté, quatre cartes lavande 2 × 2 de l'autre (Enfants et ados, Adultes, Après le traitement, Questions) dont le filet
// s'allonge et qui se soulèvent au survol ; en dessous une rangée contact, horaires et lettre sur violet plus sombre. Intitulés d'exemple. Polices : Young Serif (titres) et Hanken Grotesk.
const lavande = identite({
  key: "c443", label: "Violet profond et lavande", humeur: "dark",
  fond: "#2a1b4d", texte: "#f1ecfb", discret: "#cbbfe6", accent: "#d9ccff", surface: "#38256a", encre: "#2a1b4d", surEncre: "#f1ecfb",
  police: "font.hanken-grotesk", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f1ecfb40",
});
const VIO = "#2a1b4d", VIO2 = "#1d1238", LAV = "#d9ccff", LAV2 = "#ece5ff", VIO3 = "#4b2f94";
const alignement = modeleV2({
  id: identifiantV2(443, "alignement-lavande"), concept: "c-443-alignement-lavande",
  name: "Alignement lavande", family: FAM,
  description: "Pour un cabinet d'orthodontie : grande phrase en capitales et quatre cartes lavande qui se soulèvent, puis une rangée contact, horaires et lettre. Violet profond et lavande, angles droits.",
  tags: ["orthodontie", "cartes", "capitales", "violet profond", "lavande", "monochrome", "angles droits"],
  identity: lavande, racine: racineDe(VIO2), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Un sourire,<br>un plan.</p>`, { taille: [40, 76], tablette: { taille: [52, 68] }, mobile: { taille: [38, 50] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const mot = texte(k, "Un traitement expliqué simplement, étape par étape, avec un suivi régulier.", { couleur: "#e3dbf5", taille: 17, max: "400px" });
    const btn = bouton(k, "Prendre rendez-vous", "/contact", { texte: VIO, fond: LAV, soi: "flex-start", survol: { backgroundColor: "#ffffff", color: VIO, transform: { x: 6 } }, focus: "#ffffff" });
    const gauche = G.colonne(k, [caps(k, "Orthodontie", { couleur: LAV, suivi: "0.22em" }), phrase], { poids: 1, min: "300px", gap: "18px" });
    const droite = G.colonne(k, [mot, btn], { poids: 0.55, min: "260px", gap: "18px" });
    const entete = G.bande(k, [G.colonne(k, [nomDuSite(k, env, 22, LAV, { fontWeight: "400" })], { poids: 0.4, min: "200px", aligne: "flex-start" }), gauche, droite], { fond: VIO, aligne: "flex-end", gap: "28px 56px", padV: PAD("88px", "68px", "48px"), padB: PAD("40px", "32px", "28px"), padH: PAD("48px", "32px", "20px"), nom: "Titre" });
    const C = [["Enfants et ados", "Un suivi adapté à l'âge.", "/faq"], ["Adultes", "Des questions, des réponses.", "/faq"], ["Après le traitement", "Contrôles et conseils.", "/blog"], ["Nous écrire", "Une question avant de venir.", "/contact"]];
    const carteC = ([t, d, u], i) => {
      const barre = k.col([], { width: "32px", height: "3px", backgroundColor: VIO3, borderRadius: "0px", transitionDuration: DOUX });
      barre.states = { hover: { width: "100%" } };
      const l = lien(k, t, u, { taille: 21, poids: "400", police: S.head, couleur: VIO, survol: { color: VIO3 }, focus: VIO3 });
      const c = k.col([caps(k, `0${i + 1}`, { couleur: VIO3, suivi: "0.16em" }), l, texte(k, d, { taille: 15, couleur: "#4a3a72" }), barre], { flexGrow: 1, flexBasis: "0px", minWidth: "210px", gap: "8px", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "26px", paddingRight: "26px", backgroundColor: LAV, borderRadius: "0px", boxSizing: "border-box", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { transform: { y: -6 }, backgroundColor: LAV2 } };
      return c;
    };
    const cartes = G.bande(k, C.map(carteC), { fond: VIO, aligne: "stretch", gap: "2px", padV: PAD("0px", "0px", "0px"), padB: PAD("72px", "56px", "40px"), padH: PAD("48px", "32px", "20px"), nom: "Cartes" });
    const pt = souffle(carre(k, LAV, "10px"), 3200);
    const cc = G.colonne(k, [caps(k, "Coordonnées", { couleur: LAV }), coordonnees(k, { couleur: "#f1ecfb", lien: "#ffffff", survol: LAV, focus: "#ffffff" })], { poids: 1, min: "220px", gap: "12px" });
    const ch = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: LAV })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: "#f1ecfb" })], { poids: 1, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils et actualités du cabinet, par courriel.", largeur: "100%", accent: LAV, surBouton: VIO2, texte: "#f1ecfb", couleurTitre: "#ffffff", fond: VIO2, survolBouton: "#ffffff", survolTexte: VIO2, focus: "#ffffff" });
    const cl = G.colonne(k, [abo], { poids: 1.4, min: "280px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d6cdef", liens: "#ffffff" })(k, env);
    const contact = G.bande(k, [cc, ch, cl], { fond: VIO2, aligne: "flex-start", gap: "36px 48px", padV: PAD("56px", "48px", "40px"), padB: PAD("40px", "36px", "32px"), padH: PAD("48px", "32px", "20px"), nom: "Contact" });
    const bas = G.bande(k, [mentions], { fond: VIO2, colonne: true, padV: PAD("8px", "8px", "8px"), padB: PAD("20px", "18px", "18px"), padH: PAD("48px", "32px", "20px"), nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [entete, cartes, contact, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cabinets dentaires et orthodontie", target: 5, built: true,
  description: "Pieds de cabinets dentaires et d'orthodontie, standard et pros, sans illustration : pied centré, plan de soins en étapes, trois bandes, bandeau d'urgence, cartes lavande. Angles droits.",
  models: [sourireClair, planDeSoins, troisTemps, urgence, alignement],
};
