// Famille v2 « Coworking et incubateurs » — 5 modèles (ft2-474 à ft2-478), extension « standard pro animé » (angles droits, aucune illustration).
// Pieds d'espaces de coworking, de pépinières et d'incubateurs : formules, programme d'accompagnement, communauté, visites, horaires, contact, lettre d'information. Marques fictives, AUCUN chiffre inventé
// (les numéros 01 à 04 sont des rubriques) ; horaires, adresse, téléphone et e-mail viennent des « Données de l'entreprise ». Chaque modèle a sa palette, ses polices et son squelette (mode « solo »).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; cartes qui se soulèvent ; filets qui changent de couleur ; liens qui glissent de 4 à 6 px ; fond de ligne qui s'éclaire ;
// carré de statut qui « respire » (pulse lent). Aucune animation d'entrée, aucun défilement continu.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { sty } = require("../../../kit");
const A = require("../aides-std-s05");
const { MV, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, reseaux, bloc, liste, abonnement, bouton } = A;

const FAM = "coworking-incubateurs";
const WID = ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-474 « Poste de travail » — espace de coworking
// Idée : DEUX VOLETS. À gauche, un volet marine pleine hauteur (phrase, bouton, horaires et coordonnées) ; à droite, sur gris très clair, trois cartes de formules (Poste partagé, Bureau privatif, Salle de réunion) qui se soulèvent
// et se bordent de bleu au survol, puis trois colonnes de liens et la lettre d'information. Polices : Space Grotesk (titres) et Inter (texte). Mobile : volet puis cartes empilées.
const poste = identite({
  key: "s474", label: "Marine et bleu électrique", humeur: "light",
  fond: "#f4f6f9", texte: "#0f1b3d", discret: "#4a5473", accent: "#2447e0", surface: "#ffffff", encre: "#0f1b3d",
  police: "font.inter", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0f1b3d2e",
});
const MARINE = "#0f1b3d", GRIS = "#f4f6f9", BLEU = "#2447e0", CIEL = "#aebffc";

const posteDeTravail = modeleV2({
  id: identifiantV2(474, "poste-de-travail"), concept: "c-474-poste-de-travail",
  name: "Poste de travail", family: FAM,
  description: "Pour un espace de coworking : volet marine avec phrase, bouton, horaires et coordonnées ; à droite trois cartes de formules qui se soulèvent au survol, puis colonnes de liens et lettre d'information. Net, structuré, angles droits.",
  tags: ["coworking", "espace partagé", "formules", "marine", "bleu", "deux volets", "cartes", "angles droits"],
  identity: poste, racine: racineDe(GRIS), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const respire = souffle(carre(k, CIEL, "12px"), 3400);
    const phrase = G.geant(`<p>Travaillons<br>côte à côte.</p>`, { taille: [44, 84], tablette: { taille: [60, 80] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const visite = bouton(k, "Réserver une visite", "/contact", { texte: MARINE, fond: "#ffffff", survolFond: BLEU, survolTexte: "#ffffff", focus: "#ffffff" });
    const gauche = k.col([k.row([respire, caps(k, "Espace de coworking", { couleur: CIEL, suivi: "0.2em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), phrase,
      texte(k, "Un poste, un bureau ou une salle : venez voir l'espace et choisir la formule qui vous convient.", { couleur: "#d5dcf5", taille: 16, largeur: "380px" }), visite, trait(k, "#ffffff33"),
      caps(k, "Horaires", { couleur: CIEL }), horaires(k, { taille: 15, couleur: "#ffffff" }), caps(k, "Coordonnées", { couleur: CIEL }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: CIEL, focus: "#ffffff" })],
      { backgroundColor: MARINE, flexGrow: 4, flexBasis: "0px", minWidth: "320px", gap: "22px", paddingTop: "88px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "48px", borderRadius: "0px" },
      { paddingTop: "56px", paddingBottom: "48px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const carte = (num, titre, sous) => {
      const t = lien(k, titre, "/catalogue", { taille: 22, poids: "600", police: S.head, h: "44px", survol: { color: BLEU, transform: { x: 4 } }, focus: BLEU });
      const c = k.col([caps(k, num, { couleur: BLEU, suivi: "0.2em" }), t, texte(k, sous, { taille: 14, couleur: S.mute }), lien(k, "Voir la formule ›", "/catalogue", { taille: 14, poids: "700", couleur: MARINE, survol: { color: BLEU, transform: { x: 4 } }, focus: BLEU })],
        { flexGrow: 1, flexBasis: "0px", minWidth: "180px", gap: "6px", paddingTop: "22px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "1px", borderColor: "#0f1b3d2e", borderRadius: "0px", backgroundColor: "#ffffff", transitionDuration: MV });
      c.states = { hover: { borderColor: BLEU, transform: { y: -6 } } };
      return c;
    };
    const cartes = G.ligne(k, [carte("01", "Poste partagé", "Une place en espace ouvert, à la journée ou au mois."), carte("02", "Bureau privatif", "Un bureau fermé pour votre équipe, accès à tous les services."), carte("03", "Salle de réunion", "Une salle équipée, à réserver pour une rencontre ou un atelier.")], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const cLieu = bloc(k, "Le lieu", liste(k, [["Accueil", "/"], ["Formules et tarifs", "/catalogue"], ["Réserver une visite", "/contact"]], { survol: { color: BLEU, transform: { x: 4 } }, focus: BLEU }), { gap: "0px", min: "160px" });
    const cCom = bloc(k, "Communauté", liste(k, [["Actualités", "/blog"], ["Espace membre", "/connexion"], ["Créer mon compte", "/inscription"]], { survol: { color: BLEU, transform: { x: 4 } }, focus: BLEU }), { gap: "0px", min: "160px" });
    const cAide = bloc(k, "Aide", liste(k, [["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"], ["Cookies", "/cookies"]], { survol: { color: BLEU, transform: { x: 4 } }, focus: BLEU }), { gap: "0px", min: "160px" });
    const liens = G.ligne(k, [cLieu, cCom, cAide], { gap: "24px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const abo = abonnement(k, env, { titre: "Les nouvelles de l'espace", intro: "Événements et nouveaux membres, une fois par mois.", bouton: "S'abonner", largeur: "420px", accent: BLEU, couleurTitre: MARINE, survolBouton: MARINE, survolTexte: "#ffffff" });
    const droite = k.col([caps(k, "Nos formules", { couleur: MARINE, taille: "13px" }), cartes, trait(k, "#0f1b3d2e"), liens, trait(k, "#0f1b3d2e"), abo],
      { backgroundColor: GRIS, flexGrow: 6, flexBasis: "0px", minWidth: "320px", gap: "28px", paddingTop: "88px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "56px", borderRadius: "0px" },
      { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "36px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" });
    const deux = { type: "container", name: "Deux volets", props: { full: true }, children: [gauche, droite], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", gap: "0px", alignItems: "stretch", backgroundColor: GRIS }) };
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: GRIS, colonne: true, gap: "0px", padV: ["24px", "24px", "20px"], padB: ["24px", "24px", "20px"], padH: ["56px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: "#0f1b3d2e" }, nom: "Mentions" });
    return [G.racine(k, [deux, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-475 « Promotion d'été » → « Parcours d'incubation » — incubateur de startups
// Idée : nuit noire et vert citron. Une frise horizontale de QUATRE ÉTAPES du programme (01 Candidature, 02 Accompagnement, 03 Mentors, 04 Démonstration) : chaque étape est un cartouche dont le filet du haut s'illumine
// en vert citron et qui monte de 6 px au survol. Dessous : une rangée de liens à plat, puis horaires, coordonnées et réseaux, et les mentions. Polices : Syne (titres) et DM Sans (texte).
const parcours = identite({
  key: "s475", label: "Noir de nuit et vert citron", humeur: "dark",
  fond: "#0b0e0c", texte: "#f1f4ee", discret: "#a5afa0", accent: "#c8f03a", surface: "#141a15", encre: "#0b0e0c", surEncre: "#f1f4ee",
  police: "font.dm-sans", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f1f4ee2e",
});
const NOIR = "#0b0e0c", NOIR2 = "#141a15", CITRON = "#c8f03a", PAPIER = "#f1f4ee";

const parcoursIncubation = modeleV2({
  id: identifiantV2(475, "parcours-d-incubation"), concept: "c-475-parcours-d-incubation",
  name: "Parcours d'incubation", family: FAM,
  description: "Pour un incubateur : frise de quatre étapes numérotées (candidature, accompagnement, mentors, démonstration) dont le filet s'illumine en vert citron au survol, puis colonnes de liens, contact et réseaux. Nuit noire, très lisible.",
  tags: ["incubateur", "startups", "programme", "frise", "noir", "vert citron", "étapes numérotées", "angles droits"],
  identity: parcours, racine: racineDe(NOIR), widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider", "social"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Du projet<br>à la démonstration.</p>`, { taille: [36, 72], tablette: { taille: [48, 64] }, mobile: { taille: [34, 44] }, lh: 1.04, suivi: "-0.02em", poids: "700", police: S.head, couleur: PAPIER })(k, env);
    const candidater = bouton(k, "Candidater", "/contact", { texte: NOIR, fond: CITRON, survolFond: PAPIER, survolTexte: NOIR, focus: PAPIER });
    const entete = G.colonne(k, [caps(k, "Programme d'incubation", { couleur: CITRON, suivi: "0.22em" }), phrase], { poids: 7, min: "300px", gap: "18px" });
    const actions = G.colonne(k, [texte(k, "Un accompagnement par étapes, des mentors disponibles et une communauté qui avance avec vous.", { taille: 16, couleur: S.mute, largeur: "400px" }), G.ligne(k, [candidater, lien(k, "Lire le blog", "/blog", { taille: 15, poids: "700", soulign: true, survol: { color: CITRON, transform: { x: 4 } }, focus: CITRON })], { gap: "8px 28px", aligne: "center" })], { poids: 5, min: "280px", gap: "22px", soi: "flex-end" });
    const haut = G.bande(k, [entete, actions], { fond: NOIR, gap: "40px 64px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const etape = (num, titre, sous, url) => {
      const c = k.col([k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "44px", lineHeight: 1, fontWeight: "600", color: CITRON }), lien(k, titre, url, { taille: 19, poids: "700", police: S.head, couleur: PAPIER, survol: { color: CITRON }, focus: CITRON }), texte(k, sous, { taille: 14, couleur: S.mute })],
        { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "10px", paddingTop: "22px", paddingBottom: "26px", paddingLeft: "22px", paddingRight: "20px", backgroundColor: NOIR2, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: "#f1f4ee33", borderRadius: "0px", transitionDuration: MV });
      c.states = { hover: { borderColor: CITRON, transform: { y: -6 } } };
      return c;
    };
    const frise = G.ligne(k, [etape("01", "Candidature", "Présentez votre projet en quelques lignes.", "/contact"), etape("02", "Accompagnement", "Un suivi régulier avec l'équipe du programme.", "/faq"), etape("03", "Mentors", "Des rencontres avec des praticiens du secteur.", "/blog"), etape("04", "Démonstration", "Montrer l'avancée devant la communauté.", "/blog")], { gap: "12px", aligne: "stretch", largeur: "100%" });
    const bandeFrise = G.bande(k, [frise], { fond: NOIR, colonne: true, padV: ["8px", "8px", "8px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Frise" });
    const nav = G.ligne(k, [["Accueil", "/"], ["Candidater", "/contact"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"], ["Espace startups", "/connexion"], ["Créer un compte", "/inscription"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: PAPIER, survol: { color: CITRON, transform: { y: -2 } }, focus: CITRON })), { gap: "0px 30px", aligne: "center", largeur: "100%" });
    const c3 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { min: "210px", couleurTitre: CITRON, poids: 3 });
    const c4 = bloc(k, "Contact", [coordonnees(k, { taille: 15, lien: PAPIER, survol: CITRON, focus: CITRON })], { min: "210px", couleurTitre: CITRON, poids: 3 });
    const c5 = bloc(k, "Suivre le programme", [reseaux(k, env, G, "linkedin+instagram+youtube")], { min: "210px", couleurTitre: CITRON, poids: 2 });
    const grille = G.ligne(k, [c3, c4, c5], { gap: "32px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c5cdc0", liens: PAPIER })(k, env);
    const bas = G.bande(k, [nav, trait(k, "#f1f4ee2e"), grille, mentions], { fond: NOIR, colonne: true, gap: "28px", padV: ["52px", "44px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, filetHaut: { epaisseur: "1px", couleur: "#f1f4ee2e" }, couleur: "#ffffff", nom: "Colonnes" });
    return [G.racine(k, [haut, bandeFrise, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-476 « Dans la boucle » — tiers-lieu et coworking événementiel
// Idée : un aplat CORAIL franc avec la lettre d'information en GRAND (« Restez dans la boucle. » et le formulaire à filet noir), posé sur un socle noir : grande liste de six liens, horaires, contact et réseaux
// dont les liens glissent et se soulignent. Deux bandes seulement, très contrastées. Polices : Archivo Black (titres) et Work Sans (texte).
const boucle = identite({
  key: "s476", label: "Corail franc et noir", humeur: "light",
  fond: "#ff6a4d", texte: "#140b08", discret: "#2d1710", accent: "#140b08", surface: "#ffffff", encre: "#140b08",
  police: "font.work-sans", titres: "font.archivo-black",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#140b0840",
});
const CORAIL = "#ff6a4d", ENCRE = "#140b08", BLANC = "#ffffff";

const dansLaBoucle = modeleV2({
  id: identifiantV2(476, "dans-la-boucle"), concept: "c-476-dans-la-boucle",
  name: "Dans la boucle", family: FAM,
  description: "Pour un tiers-lieu ou un coworking événementiel : grand aplat corail avec la lettre d'information en vedette, puis socle noir : grande liste de liens, horaires, contact et réseaux. Deux bandes très contrastées, liens qui glissent.",
  tags: ["coworking", "tiers-lieu", "newsletter", "corail", "noir", "deux bandes", "contraste", "angles droits"],
  identity: boucle, racine: racineDe(CORAIL), widgets: [...WID, "social"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Restez dans<br>la boucle.</p>`, { taille: [40, 88], tablette: { taille: [60, 80] }, mobile: { taille: [38, 52] }, lh: 1.0, suivi: "-0.025em", poids: "400", police: S.head, couleur: ENCRE })(k, env);
    const gauche = G.colonne(k, [caps(k, "La lettre du lieu", { couleur: ENCRE, suivi: "0.22em" }), phrase], { poids: 7, min: "300px", gap: "20px" });
    const abo = abonnement(k, env, { titre: "Votre e-mail", intro: "Événements, ateliers et nouveaux membres : un message par mois.", bouton: "Je m'abonne", largeur: "440px", accent: ENCRE, texte: ENCRE, couleurTitre: ENCRE, couleurIntro: ENCRE, soulignement: "3px", survolBouton: BLANC, survolTexte: ENCRE, surBouton: BLANC });
    const droite = G.colonne(k, [abo], { poids: 5, min: "290px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: CORAIL, gap: "44px 72px", aligne: "flex-end", padV: ["104px", "80px", "56px"], padB: ["80px", "60px", "44px"], padH: ["48px", "32px", "20px"], nom: "Lettre" });
    const ser = { survol: { color: CORAIL, transform: { x: 6 } }, focus: CORAIL, couleur: BLANC };
    const gros = bloc(k, "Explorer", liste(k, [["Accueil", "/"], ["Espaces et formules", "/catalogue"], ["Actualités", "/blog"], ["Espace membre", "/connexion"], ["Devenir membre", "/inscription"], ["Réserver une visite", "/contact"]], { taille: 22, poids: "700", police: S.head, ...ser }), { gap: "0px", min: "260px", couleurTitre: CORAIL, poids: 2 });
    const c3 = bloc(k, "Horaires", [horaires(k, { taille: 15, couleur: BLANC })], { min: "220px", couleurTitre: CORAIL, poids: 3 });
    const c4 = bloc(k, "Contact", [coordonnees(k, { taille: 15, couleur: BLANC, lien: BLANC, survol: CORAIL, focus: CORAIL }), reseaux(k, env, G, "instagram+linkedin")], { min: "220px", couleurTitre: CORAIL, poids: 3 });
    const grille = G.ligne(k, [gros, c3, c4], { gap: "32px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d2cf", liens: BLANC })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff33"), mentions], { fond: ENCRE, colonne: true, gap: "36px", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, couleur: "#ffffff", nom: "Socle" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-477 « Open space » — coworking en bâtiment rénové
// Idée : greige chaud et vert sauge. À gauche, quatre LIGNES (titre à gauche, liens à plat à droite, la lettre en dernier) dont le filet haut verdit au survol ; à droite, un panneau sauge plein (horaires, coordonnées, bouton « Planifier une visite »).
// En bas, une ligne unique : réseaux à gauche, mentions à droite. Polices : Instrument Serif (titres) et Hanken Grotesk (texte).
const open = identite({
  key: "s477", label: "Greige et sauge", humeur: "light",
  fond: "#ecebe5", texte: "#1f2a23", discret: "#4f5b53", accent: "#2f5d46", surface: "#f8f7f3", encre: "#1f2a23",
  police: "font.hanken-grotesk", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1f2a2333",
});
const GREIGE = "#ecebe5", SAUGE = "#2f5d46", SAUGE_CL = "#cfe3d6", ENCRE7 = "#1f2a23";

const openSpace = modeleV2({
  id: identifiantV2(477, "open-space"), concept: "c-477-open-space",
  name: "Open space", family: FAM,
  description: "Pour un coworking en bâtiment rénové : quatre lignes de liens (dont la lettre) sur greige, panneau sauge plein avec horaires, coordonnées et visite, ligne finale réseaux et mentions. Calme, aéré, lisible.",
  tags: ["coworking", "open space", "greige", "sauge", "lignes de liens", "panneau", "serif", "angles droits"],
  identity: open, racine: racineDe(GREIGE), widgets: [...WID, "social"],
  compose(k, env, G) {
    const S = k.S;
    // chaque groupe est une LIGNE : titre à gauche, liens à plat à droite ; le filet du haut verdit au survol
    const groupe = (titre, items) => {
      const corps = items.map ? G.ligne(k, liste(k, items, { taille: 16, poids: "500", survol: { color: SAUGE, transform: { y: -2 } }, focus: SAUGE }), { gap: "0px 26px", aligne: "center" }) : items;
      const c = k.row([k.col([caps(k, titre, { couleur: ENCRE7, taille: "13px" })], { flexBasis: "150px", flexGrow: 0, flexShrink: 0, minWidth: "130px" }), k.col([corps], { flexBasis: "0px", flexGrow: 1, minWidth: "240px" })],
        { gap: "8px 24px", alignItems: "center", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: "#1f2a2333", paddingTop: "10px", paddingBottom: "10px", transitionDuration: MV });
      c.states = { hover: { borderColor: SAUGE } };
      return c;
    };
    const titre = G.geant(`<p>Un espace ouvert,<br>des projets qui avancent.</p>`, { taille: [36, 68], tablette: { taille: [44, 60] }, mobile: { taille: [34, 44] }, lh: 1.04, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENCRE7 })(k, env);
    const g2x2 = k.col([groupe("Espaces", [["Postes en open space", "/catalogue"], ["Bureaux privatifs", "/catalogue"], ["Salles de réunion", "/catalogue"]]), groupe("Communauté", [["Actualités", "/blog"], ["Espace membre", "/connexion"], ["Devenir membre", "/inscription"]]),
      groupe("Pratique", [["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"], ["Cookies", "/cookies"]]), groupe("Lettre", abonnement(k, env, { titre: "", intro: "Nouveautés du lieu, une fois par mois.", bouton: "S'abonner", largeur: "420px", accent: SAUGE, couleurTitre: ENCRE7, survolBouton: ENCRE7, survolTexte: "#ffffff", surBouton: "#ffffff" }))], { gap: "6px", width: "100%" });
    const gauche = k.col([caps(k, "Coworking et pépinière", { couleur: SAUGE, suivi: "0.2em" }), titre, g2x2],
      { backgroundColor: GREIGE, flexGrow: 7, flexBasis: "0px", minWidth: "320px", gap: "28px", paddingTop: "80px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "48px", borderRadius: "0px" },
      { paddingTop: "52px", paddingBottom: "44px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const visite = bouton(k, "Planifier une visite", "/contact", { texte: ENCRE7, fond: "#ffffff", survolFond: ENCRE7, survolTexte: "#ffffff", focus: "#ffffff" });
    const panneau = k.col([caps(k, "Horaires", { couleur: SAUGE_CL }), horaires(k, { taille: 15, couleur: "#ffffff" }), trait(k, "#ffffff40"), caps(k, "Nous trouver", { couleur: SAUGE_CL }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: SAUGE_CL, focus: "#ffffff" }), visite],
      { backgroundColor: SAUGE, flexGrow: 4, flexBasis: "0px", minWidth: "300px", gap: "20px", paddingTop: "80px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px", borderRadius: "0px" },
      { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "36px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px" });
    const deux = { type: "container", name: "Grille et panneau", props: { full: true }, children: [gauche, panneau], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", gap: "0px", alignItems: "stretch", backgroundColor: GREIGE }) };
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const reseauxL = G.ligne(k, [caps(k, "Nous suivre", { couleur: S.mute }), reseaux(k, env, G, "linkedin+instagram")], { gap: "8px 18px", aligne: "center" });
    const bas = G.bande(k, [reseauxL, mentions], { fond: GREIGE, gap: "16px 40px", aligne: "center", padV: ["24px", "24px", "20px"], padB: ["24px", "24px", "20px"], padH: ["56px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: "#1f2a2333" }, nom: "Mentions" });
    return [G.racine(k, [deux, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-478 « Pépinière » — pépinière d'entreprises
// Idée : un pied COMPACT et institutionnel, marine profond et ocre. Ligne 1 : phrase en serif et, à droite, la navigation à plat (six liens qui se soulignent). Ligne 2 : trois cellules séparées par des filets verticaux
// (horaires, contact, lettre). Un carré ocre « respire » à côté de l'invitation à visiter. Polices : Fraunces (titres) et Source Sans 3 (texte).
const pep = identite({
  key: "s478", label: "Marine profond et ocre", humeur: "dark",
  fond: "#0d2133", texte: "#eef2f6", discret: "#a8b7c6", accent: "#e3ab2d", surface: "#13304a", encre: "#0d2133", surEncre: "#eef2f6",
  police: "font.source-sans-3", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eef2f730",
});
const MAR = "#0d2133", MAR2 = "#13304a", OCRE = "#e3ab2d", GLACE = "#eef2f6";

const pepiniere = modeleV2({
  id: identifiantV2(478, "pepiniere-d-entreprises"), concept: "c-478-pepiniere-d-entreprises",
  name: "Pépinière d'entreprises", family: FAM,
  description: "Pour une pépinière d'entreprises : pied compact marine et ocre, phrase en serif et navigation à plat sur la première ligne, trois cellules à filets verticaux (horaires, contact, lettre) et carré de visite qui respire. Institutionnel.",
  tags: ["pépinière", "entreprises", "institutionnel", "marine", "ocre", "compact", "navigation à plat", "angles droits"],
  identity: pep, racine: racineDe(MAR), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Créer, héberger,<br>faire grandir.</p>`, { taille: [36, 72], tablette: { taille: [44, 60] }, mobile: { taille: [34, 44] }, lh: 1.04, suivi: "-0.015em", poids: "500", police: S.head, couleur: GLACE })(k, env);
    const gauche = caps(k, "Pépinière d'entreprises", { couleur: OCRE, suivi: "0.22em" });
    const nav = G.ligne(k, ["Accueil|/", "Locaux et services|/catalogue", "Actualités|/blog", "Questions fréquentes|/faq", "Espace résident|/connexion", "Contact|/contact"].map((x) => { const [t, u] = x.split("|"); return lien(k, t, u, { taille: 16, poids: "600", couleur: GLACE, survol: { color: OCRE, textDecoration: "underline", transform: { y: -2 } }, focus: OCRE }); }), { gap: "0px 28px", aligne: "center", largeur: "100%" });
    const haut = G.bande(k, [gauche, phrase, trait(k, "#eef2f730"), nav], { fond: MAR, colonne: true, gap: "20px", aligne: "flex-start", padV: ["88px", "64px", "48px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    const respire = souffle(carre(k, OCRE, "12px"), 3200);
    const visite = k.row([respire, lien(k, "Visiter les locaux", "/contact", { taille: 15, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: OCRE, soulign: true, survol: { color: GLACE, transform: { x: 4 } }, focus: GLACE })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const cellule = (titre, enfants, poids = 1) => G.colonne(k, [caps(k, titre, { couleur: OCRE }), ...enfants], { poids, min: "240px", gap: "14px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#eef2f730", paddingLeft: "24px" } });
    const abo = abonnement(k, env, { titre: "", intro: "Les nouvelles de la pépinière, quelques fois par an.", bouton: "S'abonner", largeur: "340px", accent: OCRE, couleurTitre: GLACE, survolBouton: GLACE, survolTexte: MAR, surBouton: MAR });
    const cellules = G.ligne(k, [cellule("Horaires", [horaires(k, { taille: 15 }), visite]), cellule("Nous joindre", [coordonnees(k, { taille: 15, lien: GLACE, survol: OCRE, focus: OCRE })]), cellule("Lettre d'information", [abo], 1.2)], { gap: "28px 0px", aligne: "stretch", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c3cfdb", liens: GLACE })(k, env);
    const bas = G.bande(k, [cellules, trait(k, "#eef2f730"), mentions], { fond: MAR2, colonne: true, gap: "32px", padV: ["48px", "40px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, couleur: "#ffffff", nom: "Cellules" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Coworking et incubateurs", target: 5, built: true,
  description: "Pieds standard pros et animés, angles droits, sans illustration : coworking, incubateurs, pépinières et tiers-lieux. Formules, programme, communauté, visites, horaires, contact.",
  models: [posteDeTravail, parcoursIncubation, dansLaBoucle, openSpace, pepiniere],
};
