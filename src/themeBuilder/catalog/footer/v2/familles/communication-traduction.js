// Famille v2 « Communication et traduction » — 5 modèles (ft2-499 à ft2-503), extension « standard pro animé » : ANGLES DROITS, aucune illustration, tout en typographie, couleurs, filets et grilles.
// Pieds crédibles pour une agence de traduction, une agence de communication, un service de relations presse, un cabinet d'interprétariat et un studio de rédaction : tuiles de langues, mot monumental,
// filets de journal, parcours en quatre étapes, bande de lettre. Contenu réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre, mentions) ; marques fictives ;
// AUCUN chiffre, tarif, certification ni coordonnée inventé (les langues citées sont des EXEMPLES à adapter dans l'éditeur).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, décalage de 2 à 10 px, tuile qui s'inverse, filet qui s'étire, carte qui se soulève, bouton qui s'inverse) ;
// un carré de statut qui « respire » près des horaires. Pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-std-s07");
const { racineDe, lien, caps, para, trait, souffle, carre, horaires, coordonnees, bloc, liste, lettre, nomDuSite, bouton, DOUX } = A;

const FAM = "communication-traduction";
const WS = ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"];
const W = ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];
const RAPIDE = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
const MENTIONS = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);

// ═══ ft2-499 « Langues du monde » — agence de traduction ═══════════════════════════════════════════════════════════════════════════════════
// Idée : une GRILLE DE TUILES DE LANGUES (six tuiles à bord net, 3 × 2) : chaque tuile est un lien « Français vers … » ; au survol elle s'inverse (fond encre, texte ivoire) et la flèche glisse.
// Au-dessus, titre en capitales avec filet rouge ; en dessous liens en ligne, coordonnées, horaires et mentions. Les langues sont des EXEMPLES. Polices : Libre Caslon Text et Work Sans.
const ivoireEncre = identite({
  key: "c499", label: "Ivoire, encre et rouge", humeur: "light",
  fond: "#f5efe3", texte: "#1c1a17", discret: "#524c44", accent: "#a3201a", surface: "#ffffff", encre: "#1c1a17",
  police: "font.work-sans", titres: "font.libre-caslon-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1c1a1733",
});
const languesDuMonde = modeleV2({
  id: identifiantV2(499, "langues-du-monde"), concept: "c-499-langues-du-monde",
  name: "Langues du monde", family: FAM,
  description: "Pour une agence de traduction : une grille de six tuiles de langues à bord net qui s'inversent au survol, titre à filet rouge, puis liens en ligne, contact et horaires sur ivoire. Rigoureux et littéraire.",
  tags: ["traduction", "langues", "tuiles", "grille", "ivoire", "encre", "rouge", "angles droits"],
  identity: ivoireEncre, racine: racineDe("#f5efe3"), widgets: WS,
  compose(k, env, G) {
    const S = k.S, ENCRE = "#1c1a17", ROUGE = "#a3201a", IVOIRE = "#f5efe3";
    const nom = nomDuSite(k, env, 40, ENCRE, { fontWeight: "400", textAlign: "center" });
    const tete = G.bande(k, [caps(k, "Traduction", { couleur: ROUGE, suivi: "0.22em", extra: { textAlign: "center" } }), nom, para(k, "Dans quelles langues vos textes doivent-ils voyager ? Choisissez, nous vous répondons.", { taille: 18, couleur: "#524c44", max: "520px", extra: { textAlign: "center" } })], { fond: IVOIRE, colonne: true, aligne: "center", gap: "12px", padV: ["72px", "56px", "44px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const tuile = (langue) => {
      const t = k.T(`<p>${langue}</p>`, { fontSize: "30px", lineHeight: 1.1, fontFamily: S.head, color: ENCRE, fontWeight: "400" });
      const a = lien(k, "Français vers cette langue →", "/contact", { taille: 15, poids: "600", couleur: ENCRE, soulign: true, survol: { color: ROUGE, transform: { x: 8 } }, focus: ROUGE });
      const c = k.col([caps(k, "Traduction", { couleur: ROUGE, suivi: "0.16em" }), t, a], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "10px", paddingTop: "28px", paddingBottom: "22px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#1c1a1766", borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { backgroundColor: "#ece3d0", transform: { y: -4 } } };
      return c;
    };
    const ligneT = (langs) => G.ligne(k, langs.map(tuile), { gap: "12px", aligne: "stretch", largeur: "100%" });
    const note = para(k, "Langues d'exemple : remplacez-les par celles de votre agence dans l'éditeur.", { taille: 14, couleur: "#524c44" });
    const grille = G.bande(k, [ligneT(["Anglais", "Espagnol", "Allemand"]), ligneT(["Italien", "Arabe", "Chinois"]), note], { fond: IVOIRE, colonne: true, gap: "12px", padV: ["16px", "16px", "8px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Langues" });
    const rap = G.ligne(k, liste(k, RAPIDE, { couleur: ENCRE, taille: 17, survol: { color: ROUGE, transform: { y: -2 } }, focus: ROUGE }), { gap: "4px 32px", aligne: "center", justifie: "center", largeur: "100%" });
    const coord = G.colonne(k, [coordonnees(k, { taille: 15, couleur: ENCRE, lien: ENCRE, survol: ROUGE, focus: ROUGE })], { poids: 1, min: "260px", gap: "12px" });
    const hor = G.colonne(k, [k.row([souffle(carre(k, ROUGE, "10px"), 3200), caps(k, "Horaires", { couleur: ROUGE })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: ENCRE })], { poids: 1, min: "260px", gap: "12px" });
    const bas = G.bande(k, [rap, trait(k, ENCRE, "2px"), G.ligne(k, [coord, hor], { gap: "28px 64px", aligne: "flex-start", largeur: "100%" }), MENTIONS(G, k, env, { couleur: "#524c44", liens: ENCRE })], { fond: "#ece3d0", colonne: true, gap: "28px", padV: ["40px", "36px", "32px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Contact" });
    return [G.racine(k, [tete, grille, bas])];
  },
}, FAM);

// ═══ ft2-500 « Parlons net » — agence de communication ═════════════════════════════════════════════════════════════════════════════════════
// Idée : NOIR PROFOND et VERT ACIDE. Le mot « Parlons. » monumental en vert (jusqu'à 190 px) ; à droite le bouton vert et la lettre sur la même ligne ; dessous trois colonnes à filets verticaux fins (Agence, Contact, Horaires).
// Le mot se décale au survol, le bouton s'inverse. Polices : Space Grotesk (titres, 700) et Inter. Mobile : le mot réduit, tout en pile.
const noirLime = identite({
  key: "c500", label: "Noir profond et vert acide", humeur: "dark",
  fond: "#0b0b0c", texte: "#f2f2ee", discret: "#b9bbb2", accent: "#c6f432", surface: "#17181a", encre: "#0b0b0c", surEncre: "#f2f2ee",
  police: "font.inter", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f2f2ee33",
});
const parlonsNet = modeleV2({
  id: identifiantV2(500, "parlons-net"), concept: "c-500-parlons-net",
  name: "Parlons net", family: FAM,
  description: "Pour une agence de communication : le mot « Parlons. » monumental en vert acide sur noir profond, bouton et lettre sur la même ligne, trois colonnes sobres (agence, contact, horaires) et mentions. Direct et contemporain.",
  tags: ["communication", "agence", "noir", "vert acide", "mot monumental", "capitales", "angles droits"],
  identity: noirLime, racine: racineDe("#0b0b0c"), widgets: W,
  compose(k, env, G) {
    const S = k.S, NOIR = "#0b0b0c", LIME = "#c6f432", CLAIR = "#f2f2ee";
    const mot = lien(k, "Parlons.", "/contact", { taille: 190, poids: "700", police: S.head, couleur: LIME, lh: 0.95, suivi: "-0.04em", h: "190px", survol: { color: "#ffffff", transform: { x: 12 } }, focus: "#ffffff", extra: { fontSize: "fluid:64-190" } });
        const phrase = para(k, "Une idée, une campagne, un lancement : racontez-nous votre sujet, nous vous répondons avec une proposition claire.", { taille: 18, couleur: "#d4d6cc", max: "520px" });
    const btn = bouton(k, "Écrire à l'agence", "/contact", { couleur: LIME, plein: true, surPlein: NOIR, survol: { backgroundColor: "#ffffff", color: NOIR, transform: { y: -3 } }, focus: "#ffffff" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos réflexions, de temps en temps.", bouton: "S'abonner", largeur: "100%", accent: LIME, surBouton: NOIR, texte: CLAIR, couleurTitre: "#ffffff", fond: NOIR, survolBouton: "#ffffff", survolTexte: NOIR, focus: "#ffffff" });
    const milieu = G.bande(k, [mot, G.ligne(k, [G.colonne(k, [phrase, btn], { poids: 6, min: "300px", gap: "24px" }), G.colonne(k, [abo], { poids: 5, min: "300px" })], { gap: "32px 64px", aligne: "flex-start", largeur: "100%" })], { fond: NOIR, colonne: true, gap: "40px", padV: ["88px", "64px", "44px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const sepV = () => k.col([], { width: "1px", alignSelf: "stretch", backgroundColor: "#f2f2ee40", borderRadius: "0px", flexShrink: 0 }, { display: "none" });
    const nom = G.colonne(k, [caps(k, "Agence", { couleur: LIME, suivi: "0.2em" }), ...liste(k, RAPIDE, { couleur: CLAIR, survol: { color: LIME, transform: { x: 6 } }, focus: LIME })], { poids: 1, min: "200px", gap: "0px" });
    const coord = bloc(k, "Contact", [coordonnees(k, { taille: 15, couleur: CLAIR, lien: "#ffffff", survol: LIME, focus: LIME })], { couleurTitre: LIME, poids: 1, min: "230px", gap: "12px" });
    const hor = G.colonne(k, [k.row([souffle(carre(k, LIME, "10px"), 3000), caps(k, "Horaires", { couleur: LIME })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: CLAIR })], { poids: 1, min: "230px", gap: "12px" });
    const nomSite = nomDuSite(k, env, 22, "#ffffff", { fontWeight: "700" });
    const bas = G.bande(k, [trait(k, "#f2f2ee40"), G.ligne(k, [nom, coord, hor], { gap: "32px 40px", aligne: "flex-start", largeur: "100%" }), trait(k, "#f2f2ee40"), k.row([nomSite, MENTIONS(G, k, env, { couleur: "#b9bbb2", liens: "#ffffff" })], { justifyContent: "space-between", alignItems: "center", gap: "16px 32px", width: "100%" })], { fond: NOIR, couleur: "#ffffff", colonne: true, gap: "32px", padV: ["16px", "16px", "8px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Contact" });
    return [G.racine(k, [milieu, bas])];
  },
}, FAM);

// ═══ ft2-501 « Salle de presse » — relations presse, communiqués ═══════════════════════════════════════════════════════════════════════════
// Idée : le pied d'un JOURNAL. Papier crème, titre centré (le nom du site) encadré de DOUBLES FILETS noirs, trois colonnes de texte serré séparées par de fins filets verticaux : « Contact presse » (coordonnées), « Rubriques » (liens)
// et « Abonnement » (lettre) ; bandeau d'horaires en italique. Les rubriques se soulignent au survol. Polices : Libre Baskerville (titres) et Source Sans 3.
const journal = identite({
  key: "c501", label: "Papier journal et noir", humeur: "light",
  fond: "#efe9dc", texte: "#161616", discret: "#4a463d", accent: "#7a1f1f", surface: "#f7f3ea", encre: "#161616",
  police: "font.source-sans-3", titres: "font.libre-baskerville",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#16161640",
});
const sallePresse = modeleV2({
  id: identifiantV2(501, "salle-de-presse"), concept: "c-501-salle-de-presse",
  name: "Salle de presse", family: FAM,
  description: "Pour un service de relations presse : le pied d'un journal, nom centré entre doubles filets, trois colonnes serrées séparées par des filets fins (contact presse, rubriques, abonnement) et horaires en bandeau. Papier crème et noir.",
  tags: ["relations presse", "journal", "doubles filets", "papier", "serif", "trois colonnes", "angles droits"],
  identity: journal, racine: racineDe("#efe9dc"), widgets: W,
  compose(k, env, G) {
    const S = k.S, NOIR = "#161616", PAPIER = "#efe9dc", BORD = "#7a1f1f";
    const nom = nomDuSite(k, env, 44, NOIR, { fontWeight: "700", letterSpacing: "0.01em", textAlign: "center" });
    const sousTitre = caps(k, "Communiqués · Dossiers · Contacts", { couleur: "#4a463d", suivi: "0.24em", extra: { textAlign: "center" } });
    const tete = G.bande(k, [trait(k, NOIR, "3px"), trait(k, NOIR, "1px"), G.colonne(k, [nom, sousTitre], { gap: "10px", aligne: "center", extra: { width: "100%", paddingTop: "18px", paddingBottom: "18px" } }), trait(k, NOIR, "1px"), trait(k, NOIR, "3px")], { fond: PAPIER, colonne: true, gap: "6px", aligne: "center", padV: ["64px", "52px", "40px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const sepV = () => k.col([], { width: "1px", alignSelf: "stretch", backgroundColor: "#16161666", borderRadius: "0px", flexShrink: 0 }, { display: "none" });
    const contact = bloc(k, "Contact presse", [coordonnees(k, { taille: 16, couleur: NOIR, lien: NOIR, survol: BORD, focus: BORD }), lien(k, "Écrire à la rédaction →", "/contact", { taille: 15, poids: "700", couleur: BORD, soulign: true, survol: { color: NOIR, transform: { x: 6 } }, focus: BORD })], { couleurTitre: BORD, poids: 1, min: "250px", gap: "12px" });
    const rubriques = bloc(k, "Rubriques", liste(k, [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace journalistes", "/connexion"]], { couleur: NOIR, survol: { color: BORD, transform: { x: 6 } }, focus: BORD }), { couleurTitre: BORD, poids: 1, min: "220px", gap: "0px" });
    const abo = lettre(k, env, G, { titre: "Recevoir les communiqués", intro: "Un courriel par communiqué, rien d'autre.", bouton: "S'abonner", largeur: "100%", accent: NOIR, surBouton: "#ffffff", texte: NOIR, couleurTitre: NOIR, fond: PAPIER, survolBouton: BORD, survolTexte: "#ffffff", focus: BORD });
    const colonnes = G.bande(k, [G.ligne(k, [contact, sepV(), rubriques, sepV(), G.colonne(k, [caps(k, "Abonnement", { couleur: BORD }), abo], { poids: 1.2, min: "280px", gap: "12px" })], { gap: "32px 40px", aligne: "flex-start", largeur: "100%" })], { fond: PAPIER, colonne: true, padV: ["8px", "8px", "8px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Colonnes" });
    const hor = G.colonne(k, [k.row([souffle(carre(k, BORD, "10px"), 3200), caps(k, "Permanence de la rédaction", { couleur: BORD })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: NOIR })], { poids: 1, min: "280px", gap: "10px" });
    const bas = G.bande(k, [trait(k, NOIR, "1px"), hor, trait(k, "#16161640"), MENTIONS(G, k, env, { couleur: "#4a463d", liens: NOIR })], { fond: "#e4dccb", colonne: true, gap: "24px", padV: ["32px", "28px", "24px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [tete, colonnes, bas])];
  },
}, FAM);

// ═══ ft2-502 « Interprètes à la demande » — interprétariat, traduction assermentée, conférences ═══════════════════════════════════════════════
// Idée : un PARCOURS EN QUATRE ÉTAPES sur bleu pétrole : quatre grandes cases numérotées 01 à 04 (Décrire le besoin, Choisir les langues, Recevoir la proposition, Suivre la mission), séparées par des filets fins ;
// chaque case s'éclaire au survol et son filet ambre s'allonge. Dessous : lettre et bouton de devis à gauche, contact et horaires à droite, liens en ligne. Polices : Sora (titres) et Hanken Grotesk. Mobile : étapes empilées.
const petrole = identite({
  key: "c502", label: "Bleu pétrole et ambre", humeur: "dark",
  fond: "#0b3c49", texte: "#eaf4f6", discret: "#b7d3d9", accent: "#ffb347", surface: "#10505f", encre: "#0b3c49", surEncre: "#eaf4f6",
  police: "font.hanken-grotesk", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eaf4f633",
});
const interpretes = modeleV2({
  id: identifiantV2(502, "interpretes-a-la-demande"), concept: "c-502-interpretes-a-la-demande",
  name: "Interprètes à la demande", family: FAM,
  description: "Pour un cabinet d'interprétariat : un parcours en quatre étapes numérotées sur bleu pétrole (besoin, langues, proposition, suivi), cases qui s'éclairent au survol, puis lettre et devis à gauche, contact et horaires à droite.",
  tags: ["interprétariat", "parcours", "étapes numérotées", "bleu pétrole", "ambre", "quatre cases", "angles droits"],
  identity: petrole, racine: racineDe("#0b3c49"), widgets: W,
  compose(k, env, G) {
    const S = k.S, PET = "#0b3c49", PET2 = "#10505f", AMBRE = "#ffb347", CLAIR = "#eaf4f6";
    const nom = nomDuSite(k, env, 30, "#ffffff", { fontWeight: "600" });
    const tete = G.ligne(k, [G.colonne(k, [caps(k, "Comment ça marche", { couleur: AMBRE, suivi: "0.22em" }), nom], { poids: 1, min: "280px", gap: "10px" }), G.colonne(k, [para(k, "Une demande claire, une réponse rapide, une mission suivie de bout en bout.", { taille: 18, couleur: "#d3e6ea", max: "440px" })], { poids: 1, min: "280px", soi: "flex-end" })], { gap: "20px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const etape = (num, titre, texte, url, dernier) => {
      const t = lien(k, titre, url, { taille: 22, poids: "700", police: S.head, couleur: "#ffffff", survol: { color: AMBRE }, focus: AMBRE, lh: 1.2 });
      const filet = k.col([], { width: "40px", height: "3px", backgroundColor: AMBRE, borderRadius: "0px", transitionDuration: DOUX });
      filet.states = {};
      const c = k.col([caps(k, num, { couleur: AMBRE, suivi: "0.16em" }), filet, t, para(k, texte, { taille: 15, couleur: "#d3e6ea", lh: 1.5 })], { flexGrow: 1, flexBasis: "0px", minWidth: "230px", gap: "12px", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "26px", paddingRight: "26px", backgroundColor: PET, borderStyle: "solid", borderWidth: "0px", borderRightWidth: dernier ? "0px" : "1px", borderColor: "#eaf4f640", borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", borderRightWidth: "0px", borderBottomWidth: dernier ? "0px" : "1px" });
      c.states = { hover: { backgroundColor: PET2 } };
      return c;
    };
    const parcours = G.ligne(k, [etape("01", "Décrire le besoin", "Date, lieu, durée, type d'événement.", "/contact"), etape("02", "Choisir les langues", "Les langues et le mode d'interprétation.", "/contact"), etape("03", "Recevoir la proposition", "Un devis clair, sans engagement.", "/contact"), etape("04", "Suivre la mission", "Un interlocuteur jusqu'à la fin.", "/connexion", true)], { gap: "0px", aligne: "stretch", largeur: "100%" });
    parcours.styles.desktop = { ...parcours.styles.desktop, borderStyle: "solid", borderWidth: "1px", borderColor: "#eaf4f666", borderRadius: "0px" };
    const bandeParcours = G.bande(k, [tete, parcours], { fond: PET, colonne: true, gap: "36px", padV: ["72px", "56px", "44px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Parcours" });
    const btn = bouton(k, "Demander un devis", "/contact", { couleur: AMBRE, plein: true, surPlein: PET, survol: { backgroundColor: "#ffffff", color: PET, transform: { y: -3 } }, focus: "#ffffff" });
    const coord = G.colonne(k, [caps(k, "Contact", { couleur: AMBRE }), coordonnees(k, { taille: 15, couleur: CLAIR, lien: "#ffffff", survol: AMBRE, focus: AMBRE }), k.row([souffle(carre(k, AMBRE, "10px"), 3000), caps(k, "Horaires", { couleur: AMBRE })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: CLAIR })], { poids: 5, min: "280px", gap: "14px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos nouvelles, par courriel.", bouton: "S'abonner", largeur: "100%", accent: AMBRE, surBouton: PET, texte: CLAIR, couleurTitre: "#ffffff", fond: "#08303b", survolBouton: "#ffffff", survolTexte: PET, focus: "#ffffff" });
    const rap = G.ligne(k, liste(k, RAPIDE, { couleur: CLAIR, taille: 15, survol: { color: AMBRE, transform: { y: -2 } }, focus: AMBRE }), { gap: "0px 24px", aligne: "center", largeur: "100%" });
    const bas = G.bande(k, [G.colonne(k, [abo, btn], { poids: 6, min: "300px", gap: "24px" }), coord, trait(k, "#eaf4f640"), k.row([rap, MENTIONS(G, k, env, { couleur: "#b7d3d9", liens: "#ffffff" })], { gap: "12px 40px", justifyContent: "space-between", width: "100%" })], { fond: "#08303b", couleur: "#ffffff", gap: "32px 64px", aligne: "flex-start", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Contact" });
    bas.children[0].children[2].styles.desktop.width = "100%"; bas.children[0].children[3].styles.desktop.width = "100%";
    return [G.racine(k, [bandeParcours, bas])];
  },
}, FAM);

// ═══ ft2-503 « Atelier des mots » — rédaction, contenu, studio éditorial ═══════════════════════════════════════════════════════════════════
// Idée : TITRE CENTRÉ. Le nom en grand serif au centre de la lavande claire, puis trois cartes à angles droits (liens du studio, liens clients, coordonnées) qui se soulèvent au survol ;
// bande violet profond en pied : lettre d'information, horaires et mentions. Polices : Instrument Serif (titres) et DM Sans. Mobile : tout en pile.
const lavande = identite({
  key: "c503", label: "Lavande claire et violet profond", humeur: "light",
  fond: "#eeebf9", texte: "#241a4d", discret: "#4d4678", accent: "#4a2fb8", surface: "#ffffff", encre: "#2a1a6e",
  police: "font.dm-sans", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#241a4d33",
});
const atelierMots = modeleV2({
  id: identifiantV2(503, "atelier-des-mots"), concept: "c-503-atelier-des-mots",
  name: "Atelier des mots", family: FAM,
  description: "Pour un studio de rédaction ou de contenu : titre centré en grand serif sur lavande claire, trois cartes à angles droits (studio, clients, coordonnées) qui se soulèvent, puis une bande violet profond (lettre, horaires, mentions). Éditorial et net.",
  tags: ["rédaction", "contenu", "studio éditorial", "titre centré", "lavande", "violet", "cartes", "angles droits"],
  identity: lavande, racine: racineDe("#eeebf9"), widgets: W,
  compose(k, env, G) {
    const S = k.S, VIOLET = "#2a1a6e", LAV = "#eeebf9", CLAIR = "#e7e2fb";
    const nom = nomDuSite(k, env, 56, VIOLET, { fontWeight: "400", lineHeight: 1.05, textAlign: "center" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos billets sur l'écriture et le contenu.", bouton: "S'abonner", largeur: "520px", accent: "#ffd9f0", surBouton: VIOLET, texte: CLAIR, couleurTitre: "#ffffff", fond: VIOLET, survolBouton: "#ffffff", survolTexte: VIOLET, focus: "#ffffff" });
    const centre = G.bande(k, [caps(k, "Atelier", { couleur: "#4a2fb8", suivi: "0.22em", extra: { textAlign: "center" } }), nom, para(k, "Des textes justes, relus et livrés à l'heure.", { taille: 19, couleur: "#4d4678", extra: { textAlign: "center" } })], { fond: LAV, colonne: true, aligne: "center", gap: "14px", padV: ["80px", "64px", "48px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const carteLiens = (titre, paires) => {
      const c = k.col([caps(k, titre, { couleur: "#4a2fb8", suivi: "0.18em" }), k.col([], { width: "32px", height: "3px", backgroundColor: "#4a2fb8", borderRadius: "0px" }), ...liste(k, paires, { couleur: "#241a4d", survol: { color: "#4a2fb8", transform: { x: 6 } }, focus: "#4a2fb8" })], { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "6px", paddingTop: "22px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#241a4d33", borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { transform: { y: -5 }, borderColor: "#4a2fb8" } };
      return c;
    };
    const coord = k.col([caps(k, "Coordonnées", { couleur: "#4a2fb8", suivi: "0.18em" }), coordonnees(k, { taille: 15, couleur: "#241a4d", lien: VIOLET, survol: "#4a2fb8", focus: "#4a2fb8" })], { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "12px", paddingTop: "22px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#241a4d33", borderRadius: "0px" }, undefined, { minWidth: "100%" });
    const cartes = G.bande(k, [carteLiens("Le studio", [["Accueil", "/"], ["Actualités", "/blog"], ["Nous écrire", "/contact"], ["Cookies", "/cookies"]]), carteLiens("Clients", [["Espace client", "/connexion"], ["Créer un compte", "/inscription"], ["Questions fréquentes", "/faq"]]), coord], { fond: LAV, gap: "12px", aligne: "stretch", padV: ["8px", "8px", "8px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Cartes" });
    const hor = k.row([souffle(carre(k, CLAIR, "10px"), 3200), caps(k, "Horaires", { couleur: "#ffd9f0" })], { gap: "10px", alignItems: "center" });
    const bas = G.bande(k, [G.colonne(k, [abo], { poids: 6, min: "300px" }), G.colonne(k, [hor, horaires(k, { taille: 15, couleur: CLAIR })], { poids: 4, min: "260px", gap: "12px" }), trait(k, "#e7e2fb40"), MENTIONS(G, k, env, { couleur: "#d6d0f2", liens: "#ffffff" })], { fond: VIOLET, couleur: "#ffffff", gap: "28px 56px", aligne: "flex-start", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Lettre" });
    bas.children[0].children[2].styles.desktop.width = "100%"; bas.children[0].children[3].styles.desktop.width = "100%";
    return [G.racine(k, [centre, cartes, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Communication et traduction", target: 5, built: true,
  description: "Pieds standard et très professionnels, à angles droits, sans illustration : tuiles de langues, mot monumental, filets de journal, parcours en quatre étapes, titre centré et cartes.",
  models: [languesDuMonde, parlonsNet, sallePresse, interpretes, atelierMots],
};
