// Famille v2 « Imprimerie et signalétique » — 5 modèles (ft2-479 à ft2-483), extension « standard pro animé » (angles droits, aucune illustration).
// Pieds d'imprimeries, d'ateliers de signalétique, d'enseignistes et de fabricants de supports (cartes, affiches, enseignes, adhésifs, bâches) : catégories de produits, étapes devis-maquette-fabrication-pose,
// envoi de fichier, horaires, contact, lettre d'information. Marques fictives, AUCUN chiffre, délai ou certification inventé ; horaires, adresse, téléphone et e-mail viennent des « Données de l'entreprise ».
// Les « couleurs d'imprimerie » (cyan, magenta, jaune, noir) et les nuanciers sont de simples aplats : aucune image, aucun dessin.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; cartes et pavés qui se soulèvent ; filets qui changent de couleur ; liens qui glissent ; fond de ligne qui s'éclaire ;
// carré de statut qui « respire » (pulse lent). Aucune animation d'entrée, aucun défilement continu.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { sty, compact } = require("../../../kit");
const GK = require("../kit-v2").G;
const A = require("../aides-std-s05");
const { MV, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, reseaux, bloc, liste, abonnement, bouton, ligneIndex } = A;

const FAM = "imprimerie-signaletique";
const WID = ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-479 « Bon à tirer » — imprimerie de labeur et de papeterie
// Idée : la BANDE DE CONTRÔLE d'imprimerie. Un filet fin de quatre aplats (cyan, magenta, jaune, noir) en tête, puis quatre colonnes de catalogue (Impression, Signalétique, Services, Contact) sous un liseré de la couleur
// de la colonne qui devient magenta au survol, et un cartouche « Bon à tirer » à bordure noire (bouton de devis et lettre d'information). Papier blanc cassé, encre noire, magenta pour l'accent. Polices : DM Serif Display (titres) et Archivo (texte).
const btt = identite({
  key: "s479", label: "Papier et encre quadrichromie", humeur: "light",
  fond: "#fbfaf6", texte: "#121212", discret: "#555049", accent: "#c4005f", surface: "#ffffff", encre: "#121212",
  police: "font.archivo", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#12121233",
});
const PAPIER = "#fbfaf6", ENCRE = "#121212", MAGENTA = "#c4005f", CYAN = "#00a3d9", JAUNE = "#ffd500";

const bonATirer = modeleV2({
  id: identifiantV2(479, "bon-a-tirer"), concept: "c-479-bon-a-tirer",
  name: "Bon à tirer", family: FAM,
  description: "Pour une imprimerie : filet de quatre aplats cyan, magenta, jaune et noir, quatre colonnes de catalogue à liseré coloré qui rougit au survol, cartouche de devis avec lettre d'information. Papier blanc cassé, encre noire, rigoureux.",
  tags: ["imprimerie", "papeterie", "quadrichromie", "papier", "encre", "colonnes", "cartouche", "angles droits"],
  identity: btt, racine: racineDe(PAPIER), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const aplat = (c) => k.col([], { flexGrow: 1, flexBasis: "0px", height: "12px", backgroundColor: c, borderRadius: "0px" });
    const controle = { type: "container", name: "Bande de contrôle", props: { full: true }, children: [aplat(CYAN), aplat(MAGENTA), aplat(JAUNE), aplat(ENCRE)], ...sty({ display: "flex", flexDirection: "row", width: "100%", gap: "0px" }) };
    const phrase = G.geant(`<p>Votre fichier,<br>notre savoir-faire.</p>`, { taille: [40, 88], tablette: { taille: [52, 72] }, mobile: { taille: [38, 52] }, lh: 1.02, suivi: "-0.015em", poids: "400", police: S.head, couleur: ENCRE })(k, env);
    const abo = abonnement(k, env, { titre: "Lettre de l'atelier", intro: "Nouveautés et conseils de préparation de fichiers.", bouton: "S'abonner", largeur: "340px", accent: ENCRE, couleurTitre: ENCRE, survolBouton: MAGENTA, survolTexte: "#ffffff", surBouton: "#ffffff" });
    const envoi = k.col([caps(k, "Bon à tirer", { couleur: MAGENTA }), texte(k, "Envoyez votre fichier : nous le vérifions et revenons vers vous avec un devis.", { taille: 16, couleur: S.mute }), bouton(k, "Demander un devis", "/contact", { texte: "#ffffff", fond: ENCRE, survolFond: MAGENTA, survolTexte: "#ffffff" }), trait(k, S.line), abo],
      { gap: "14px", borderStyle: "solid", borderWidth: "2px", borderColor: ENCRE, paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", backgroundColor: "#ffffff", borderRadius: "0px", maxWidth: "400px", width: "100%" });
    const haut = G.bande(k, [G.colonne(k, [caps(k, "Imprimerie et signalétique", { couleur: S.mute, suivi: "0.22em" }), phrase], { poids: 7, min: "300px", gap: "18px" }), G.colonne(k, [envoi], { poids: 5, min: "290px", soi: "flex-end" })],
      { fond: PAPIER, gap: "40px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    const col = (titre, couleur, items, poids = 1) => {
      const c = G.colonne(k, [caps(k, titre, { couleur: ENCRE, taille: "13px" }), ...(items.map ? liste(k, items, { taille: 16, survol: { color: MAGENTA, transform: { x: 4 } }, focus: MAGENTA }) : [items])],
        { poids, min: "200px", gap: "6px", extra: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: couleur, paddingTop: "16px", transitionDuration: MV } });
      c.states = { hover: { borderColor: MAGENTA } };
      return c;
    };
    const cImp = col("Impression", CYAN, [["Cartes de visite", "/catalogue"], ["Flyers et dépliants", "/catalogue"], ["Affiches", "/catalogue"], ["Papeterie", "/catalogue"]]);
    const cSig = col("Signalétique", MAGENTA, [["Enseignes", "/catalogue"], ["Panneaux", "/catalogue"], ["Adhésifs et vinyles", "/catalogue"], ["Bâches", "/catalogue"]]);
    const cSer = col("Services", JAUNE, [["Devis", "/contact"], ["Préparer son fichier", "/faq"], ["Livraison et retours", "/faq"], ["Suivre ma commande", "/connexion"]]);
    const cCon = col("Contact et horaires", ENCRE, G.colonne(k, [coordonnees(k, { taille: 15, lien: ENCRE, survol: MAGENTA, focus: MAGENTA }), horaires(k, { taille: 15 })], { gap: "16px" }), 1.3);
    const grille = G.ligne(k, [cImp, cSig, cSer, cCon], { gap: "32px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: PAPIER, colonne: true, gap: "36px", padV: ["16px", "16px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Catalogue" });
    return [G.racine(k, [controle, haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-480 « Presse de nuit » — imprimerie numérique grand format
// Idée : noir profond, blanc et rose vif. Une phrase géante à gauche ; à droite, un cadre « Nouveau projet » (bouton blanc qui devient rose). Dessous, un RUBAN de produits en grandes capitales séparés par des barres
// obliques — chaque produit est un lien qui se colore et glisse — puis horaires, contact, réseaux et lettre. Polices : Big Shoulders Display (titres) et Barlow (texte).
const presse = identite({
  key: "s480", label: "Noir presse et rose vif", humeur: "dark",
  fond: "#0a0a0b", texte: "#f5f5f2", discret: "#aaaaa4", accent: "#ff4d97", surface: "#161618", encre: "#0a0a0b", surEncre: "#f5f5f2",
  police: "font.barlow", titres: "font.big-shoulders",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f5f5f233",
});
const NOIR = "#0a0a0b", NOIR2 = "#161618", BLANC = "#f5f5f2", ROSE = "#ff4d97";

const presseDeNuit = modeleV2({
  id: identifiantV2(480, "presse-de-nuit"), concept: "c-480-presse-de-nuit",
  name: "Presse de nuit", family: FAM,
  description: "Pour une imprimerie numérique grand format : phrase géante sur noir, cadre « nouveau projet », ruban de produits en grandes capitales (liens qui se colorent et glissent), puis horaires, contact, réseaux et lettre. Franc, nocturne.",
  tags: ["imprimerie", "grand format", "numérique", "noir", "rose", "ruban de produits", "capitales", "angles droits"],
  identity: presse, racine: racineDe(NOIR), widgets: [...WID, "social"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Imprimé<br>avec soin.</p>`, { taille: [64, 160], tablette: { taille: [96, 140] }, mobile: { taille: [60, 92] }, lh: 1.0, suivi: "0.005em", poids: "800", police: S.head, couleur: BLANC, extra: { textTransform: "uppercase" } })(k, env);
    const cadre = k.col([caps(k, "Nouveau projet", { couleur: ROSE }), texte(k, "Décrivez votre support, nous vous répondons avec une proposition claire.", { taille: 16, couleur: S.mute }), bouton(k, "Lancer un projet", "/contact", { texte: NOIR, fond: BLANC, survolFond: ROSE, survolTexte: NOIR })],
      { gap: "14px", borderStyle: "solid", borderWidth: "1px", borderColor: ROSE, backgroundColor: NOIR2, paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", borderRadius: "0px", maxWidth: "380px", width: "100%" });
    const haut = G.bande(k, [G.colonne(k, [caps(k, "Impression numérique et grand format", { couleur: ROSE, suivi: "0.22em" }), phrase], { poids: 8, min: "300px", gap: "26px" }), G.colonne(k, [cadre], { poids: 4, min: "290px", soi: "flex-end" })],
      { fond: NOIR, gap: "40px 56px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const produits = [["Cartes de visite", "/catalogue"], ["Affiches", "/catalogue"], ["Bâches", "/catalogue"], ["Adhésifs", "/catalogue"], ["Kakémonos", "/catalogue"]];
    const items = [];
    produits.forEach(([t, u], i) => {
      if (i) items.push(k.T("<p>/</p>", { fontFamily: S.head, fontSize: "fluid:22-40", color: "#9a9a94", lineHeight: 1 }));
      items.push(lien(k, t, u, { taille: 30, poids: "700", police: S.head, casse: "uppercase", couleur: BLANC, h: "56px", lh: 1, survol: { color: ROSE, transform: { y: -4 }, textDecoration: "underline" }, focus: ROSE, extra: { fontSize: "fluid:22-40" } }));
    });
    const ruban = k.row(items, { rowGap: "0px", columnGap: "18px", alignItems: "center", width: "100%" });
    const bandeRuban = G.bande(k, [ruban], { fond: NOIR, colonne: true, padV: ["32px", "28px", "24px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: "#f5f5f233" }, nom: "Ruban" });
    const c1 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { min: "220px", couleurTitre: ROSE, poids: 3 });
    const c2 = bloc(k, "Atelier", [coordonnees(k, { taille: 15, lien: BLANC, survol: ROSE, focus: ROSE })], { min: "220px", couleurTitre: ROSE, poids: 3 });
    const c3 = bloc(k, "Suivre l'atelier", [reseaux(k, env, G, "instagram+linkedin+youtube")], { min: "180px", couleurTitre: ROSE, poids: 2 });
    const abo = abonnement(k, env, { titre: "Lettre de l'atelier", intro: "Nouveautés et conseils, quelques fois par an.", bouton: "S'abonner", largeur: "360px", accent: ROSE, couleurTitre: ROSE, survolBouton: BLANC, survolTexte: NOIR, surBouton: NOIR });
    const grille = G.ligne(k, [c1, c2, c3, G.colonne(k, [abo], { poids: 4, min: "260px" })], { gap: "32px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c4c4be", liens: BLANC })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#f5f5f233"), mentions], { fond: NOIR, colonne: true, gap: "32px", padV: ["48px", "40px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, filetHaut: { epaisseur: "1px", couleur: "#f5f5f233" }, couleur: "#ffffff", nom: "Atelier" });
    return [G.racine(k, [haut, bandeRuban, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-481 « Chantier de pose » — enseigniste et poseur de signalétique
// Idée : aplat JAUNE signalétique et noir. Une frise de QUATRE ÉTAPES en pavés noirs numérotés (1 Devis, 2 Maquette, 3 Fabrication, 4 Pose) dont le chiffre jaune s'inverse et qui montent au survol, puis un socle noir
// de trois colonnes de liens (Produits, Atelier, Aide) et un cadre jaune d'horaires et de contact. Polices : Anton (titres) et Barlow (texte).
const chantier = identite({
  key: "s481", label: "Jaune signalétique et noir", humeur: "light",
  fond: "#ffd500", texte: "#141414", discret: "#3b3300", accent: "#141414", surface: "#fff1a0", encre: "#141414",
  police: "font.barlow", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#14141440",
});
const JAUNE2 = "#ffd500", NOIR3 = "#141414", CREME = "#f2efe4";

const chantierDePose = modeleV2({
  id: identifiantV2(481, "chantier-de-pose"), concept: "c-481-chantier-de-pose",
  name: "Chantier de pose", family: FAM,
  description: "Pour un enseigniste ou un poseur de signalétique : aplat jaune avec quatre étapes en pavés noirs (devis, maquette, fabrication, pose) qui montent au survol, puis socle noir de trois colonnes et cadre jaune d'horaires et de contact. Franc, très lisible.",
  tags: ["enseigne", "signalétique", "pose", "jaune", "noir", "étapes", "pavés", "angles droits"],
  identity: chantier, racine: racineDe(JAUNE2), widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Posé droit.<br>Vu de loin.</p>`, { taille: [52, 132], tablette: { taille: [80, 116] }, mobile: { taille: [48, 76] }, lh: 1.02, suivi: "0.005em", poids: "400", police: S.head, couleur: NOIR3, extra: { textTransform: "uppercase" } })(k, env);
    const devis = bouton(k, "Demander un devis", "/contact", { texte: JAUNE2, fond: NOIR3, survolFond: "#ffffff", survolTexte: NOIR3, focus: NOIR3 });
    const gauche = G.colonne(k, [caps(k, "Enseignes et signalétique", { couleur: NOIR3, suivi: "0.22em" }), phrase], { poids: 7, min: "300px", gap: "28px" });
    const droite = G.colonne(k, [texte(k, "De l'étude du site à la pose sur place : une seule équipe pour vos enseignes, panneaux et adhésifs.", { taille: 17, couleur: S.mute, largeur: "400px" }), devis], { poids: 5, min: "280px", gap: "20px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: JAUNE2, gap: "40px 64px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const pave = (num, titre, sous, url) => {
      const c = k.col([k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "56px", lineHeight: 1, color: JAUNE2 }), lien(k, titre, url, { taille: 20, poids: "700", casse: "uppercase", suivi: "0.04em", couleur: "#ffffff", survol: { color: JAUNE2 }, focus: JAUNE2 }), texte(k, sous, { taille: 14, couleur: "#d9d4bd" })],
        { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "8px", paddingTop: "22px", paddingBottom: "24px", paddingLeft: "22px", paddingRight: "20px", backgroundColor: NOIR3, borderRadius: "0px", transitionDuration: MV });
      c.states = { hover: { transform: { y: -8 } } };
      return c;
    };
    const frise = G.ligne(k, [pave("1", "Devis", "Votre besoin, le support, le lieu.", "/contact"), pave("2", "Maquette", "Visuel et dimensions validés avec vous.", "/faq"), pave("3", "Fabrication", "Découpe, impression et assemblage.", "/catalogue"), pave("4", "Pose", "Installation sur site par l'équipe.", "/contact")], { gap: "12px", aligne: "stretch", largeur: "100%" });
    const bandeFrise = G.bande(k, [frise], { fond: JAUNE2, colonne: true, padV: ["8px", "8px", "8px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Étapes" });
    const clair = { survol: { color: JAUNE2, transform: { x: 4 } }, focus: JAUNE2, couleur: "#ffffff" };
    const c1 = bloc(k, "Produits", liste(k, [["Enseignes", "/catalogue"], ["Panneaux", "/catalogue"], ["Adhésifs et vitrophanie", "/catalogue"], ["Totems", "/catalogue"]], clair), { gap: "0px", min: "190px", couleurTitre: JAUNE2 });
    const c2 = bloc(k, "L'atelier", liste(k, [["Accueil", "/"], ["Actualités", "/blog"], ["Espace client", "/connexion"]], clair), { gap: "0px", min: "170px", couleurTitre: JAUNE2 });
    const c3 = bloc(k, "Aide", liste(k, [["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"], ["Cookies", "/cookies"]], clair), { gap: "0px", min: "170px", couleurTitre: JAUNE2 });
    const liens = G.colonne(k, [G.ligne(k, [c1, c2, c3], { gap: "24px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { poids: 7, min: "320px" });
    const infos = k.col([caps(k, "Horaires", { couleur: JAUNE2 }), horaires(k, { taille: 15, couleur: "#ffffff" }), caps(k, "Contact", { couleur: JAUNE2 }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: JAUNE2, focus: JAUNE2 })],
      { flexGrow: 4, flexBasis: "0px", minWidth: "260px", gap: "12px", borderStyle: "solid", borderWidth: "2px", borderColor: JAUNE2, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "0px" });
    const grille = G.ligne(k, [liens, infos], { gap: "32px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d4bd", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff33"), mentions], { fond: NOIR3, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, couleur: "#ffffff", nom: "Socle" });
    void CREME;
    return [G.racine(k, [haut, bandeFrise, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-482 « Nuancier de commande » — imprimeur de supports publicitaires et d'étiquettes
// Idée : un NUANCIER de produits. Sur crème, six pavés de couleur pleine sur deux rangées, chacun un lien de catalogue (Cartes de visite, Flyers, Affiches, Bâches, Étiquettes, Adhésifs) avec sa référence « Réf. 01 ».
// Au survol le pavé se soulève de 6 px. Dessous : horaires, contact et lettre côte à côte, mentions. Polices : Young Serif (titres) et Karla (texte).
const nuancier = identite({
  key: "s482", label: "Crème et nuancier", humeur: "light",
  fond: "#f4efe4", texte: "#1c1a16", discret: "#58523f", accent: "#1d4e89", surface: "#fffdf7", encre: "#1c1a16",
  police: "font.karla", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1c1a1633",
});
const CREME2 = "#f4efe4", ENCRE4 = "#1c1a16", BLEU = "#1d4e89";

const nuancierModele = modeleV2({
  id: identifiantV2(482, "nuancier-de-commande"), concept: "c-482-nuancier-de-commande",
  name: "Nuancier de commande", family: FAM,
  description: "Pour un imprimeur de supports publicitaires : six pavés de couleur pleine en guise de nuancier (cartes, flyers, affiches, bâches, étiquettes, adhésifs) qui se soulèvent au survol, puis horaires, contact et lettre. Crème, chaleureux, ordonné.",
  tags: ["imprimerie", "nuancier", "supports publicitaires", "crème", "pavés de couleur", "catalogue", "serif", "angles droits"],
  identity: nuancier, racine: racineDe(CREME2), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Toutes les couleurs<br>de votre marque.</p>`, { taille: [36, 72], tablette: { taille: [46, 62] }, mobile: { taille: [34, 44] }, lh: 1.04, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENCRE4 })(k, env);
    const entete = G.bande(k, [G.colonne(k, [caps(k, "Imprimeur de supports publicitaires", { couleur: BLEU, suivi: "0.2em" }), phrase], { poids: 8, min: "300px", gap: "16px" }), G.colonne(k, [bouton(k, "Demander un devis", "/contact", { texte: "#ffffff", fond: ENCRE4, survolFond: BLEU, survolTexte: "#ffffff" })], { poids: 3, min: "220px", soi: "flex-end" })],
      { fond: CREME2, gap: "28px 48px", aligne: "flex-end", padV: ["80px", "60px", "44px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const pavesDef = [["Cartes de visite", "#1d4e89", "#ffffff"], ["Flyers", "#c8102e", "#ffffff"], ["Affiches", "#f2b705", "#1c1a16"], ["Bâches", "#2f6f4f", "#ffffff"], ["Étiquettes", "#1c1a16", "#ffffff"], ["Adhésifs", "#d9cfb8", "#1c1a16"]];
    const paves = pavesDef.map(([t, fond, enc], i) => {
      const n = k.LINK(`Réf. 0${i + 1}${A.NBSP}${A.NBSP}${t}`, "/catalogue", compact({ fontFamily: S.font, fontSize: "16px", fontWeight: "700", color: enc, backgroundColor: fond, textDecoration: "none", display: "flex", alignItems: "flex-end", minHeight: "132px", flexGrow: 1, flexBasis: "0px", minWidth: "160px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px", lineHeight: 1.2, transitionDuration: MV, borderRadius: "0px" }));
      return GK.fini(k, n, { hover: { transform: { y: -6 }, textDecoration: "underline" }, focus: GK.focus(ENCRE4) });
    });
    const grillePaves = G.colonne(k, [G.ligne(k, paves.slice(0, 3), { gap: "8px", aligne: "stretch", largeur: "100%" }), G.ligne(k, paves.slice(3), { gap: "8px", aligne: "stretch", largeur: "100%" })], { gap: "8px", poids: 1, base: "100%" });
    const bandePaves = G.bande(k, [grillePaves], { fond: CREME2, colonne: true, padV: ["8px", "8px", "8px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Nuancier" });
    const c1 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { min: "220px", couleurTitre: ENCRE4, poids: 1 });
    const c2 = bloc(k, "Contact", [coordonnees(k, { taille: 15, lien: ENCRE4, survol: BLEU, focus: BLEU })], { min: "220px", couleurTitre: ENCRE4, poids: 1 });
    const abo = abonnement(k, env, { titre: "Lettre de l'atelier", intro: "Nouveautés, une fois par trimestre.", bouton: "S'abonner", largeur: "360px", accent: BLEU, couleurTitre: ENCRE4, survolBouton: ENCRE4, survolTexte: "#ffffff", surBouton: "#ffffff" });
    const grille = G.ligne(k, [c1, c2, G.colonne(k, [abo], { poids: 1.4, min: "260px" })], { gap: "32px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const aide = G.ligne(k, [["Accueil", "/"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Actualités", "/blog"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "700", soulign: true, survol: { color: BLEU, transform: { y: -2 } }, focus: BLEU })), { gap: "0px 28px", aligne: "center", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), aide, mentions], { fond: "#fffdf7", colonne: true, gap: "32px", padV: ["48px", "40px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, filetHaut: { epaisseur: "1px", couleur: "#1c1a1633" }, nom: "Infos" });
    return [G.racine(k, [entete, bandePaves, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-483 « Tableau de direction » — signalétique intérieure et d'orientation
// Idée : un PANNEAU D'ORIENTATION. Bleu de signalisation, blanc, jaune. Six lignes de destination en deux colonnes — une lettre (A à F), le produit, ‹ comme une flèche — dont la ligne s'illumine en jaune et glisse au survol ;
// en bas, horaires, contact, lettre et mentions. Polices : Archivo (titres) et Public Sans (texte).
const panneau = identite({
  key: "s483", label: "Bleu de signalisation et jaune", humeur: "dark",
  fond: "#0a3a82", texte: "#ffffff", discret: "#c5d6f2", accent: "#ffd23f", surface: "#0d2f66", encre: "#0a3a82", surEncre: "#ffffff",
  police: "font.public-sans", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#ffffff40",
});
const BLEU2 = "#0a3a82", BLEU3 = "#0d2f66", OR = "#ffd23f";

const panneauDirectionnel = modeleV2({
  id: identifiantV2(483, "tableau-de-direction"), concept: "c-483-tableau-de-direction",
  name: "Tableau de direction", family: FAM,
  description: "Pour une entreprise de signalétique d'orientation : six lignes de destination en deux colonnes, lettrées A à F, qui s'illuminent en jaune au survol, puis horaires, contact, lettre et mentions. Bleu de signalisation, blanc, jaune.",
  tags: ["signalétique", "orientation", "bleu", "jaune", "lignes lettrées", "panneau", "capitales", "angles droits"],
  identity: panneau, racine: racineDe(BLEU2), widgets: WID,
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Par ici<br>les flèches.</p>`, { taille: [44, 104], tablette: { taille: [60, 92] }, mobile: { taille: [42, 60] }, lh: 1.0, suivi: "-0.015em", poids: "800", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const haut = G.bande(k, [G.colonne(k, [caps(k, "Signalétique d'orientation et d'intérieur", { couleur: OR, suivi: "0.22em" }), phrase], { poids: 8, min: "300px", gap: "16px" }), G.colonne(k, [bouton(k, "Demander un devis", "/contact", { texte: BLEU2, fond: OR, survolFond: "#ffffff", survolTexte: BLEU2 })], { poids: 3, min: "220px", soi: "flex-end" })],
      { fond: BLEU2, gap: "28px 48px", aligne: "flex-end", padV: ["80px", "60px", "44px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const dest = (num, label, url) => ligneIndex(k, num, `${label}  ›`, url, { police: S.head, taille: "fluid:20-30", poids: "700", casse: "uppercase", couleur: "#ffffff", filet: "#ffffff59", fondSurvol: OR, couleurSurvol: BLEU2, focus: OR, h: "72px" });
    const colA = G.colonne(k, [dest("A", "Cartes et papeterie", "/catalogue"), dest("B", "Affiches et flyers", "/catalogue"), dest("C", "Enseignes et panneaux", "/catalogue")], { poids: 1, min: "300px", gap: "0px" });
    const colB = G.colonne(k, [dest("D", "Adhésifs et vitrophanie", "/catalogue"), dest("E", "Bâches et banderoles", "/catalogue"), dest("F", "Devis et fichiers", "/contact")], { poids: 1, min: "300px", gap: "0px" });
    const bandeDest = G.bande(k, [colA, colB], { fond: BLEU2, gap: "0px 56px", aligne: "flex-start", padV: ["8px", "8px", "8px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Destinations" });
    const c1 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { min: "220px", couleurTitre: OR, poids: 1 });
    const c2 = bloc(k, "Contact", [coordonnees(k, { taille: 15, lien: "#ffffff", survol: OR, focus: OR })], { min: "220px", couleurTitre: OR, poids: 1 });
    const abo = abonnement(k, env, { titre: "Lettre de l'atelier", intro: "Nouveautés, quelques fois par an.", bouton: "S'abonner", largeur: "360px", accent: OR, couleurTitre: OR, survolBouton: "#ffffff", survolTexte: BLEU2, surBouton: BLEU2 });
    const grille = G.ligne(k, [c1, c2, G.colonne(k, [abo], { poids: 1.3, min: "260px" })], { gap: "32px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d3e0f5", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff40"), mentions], { fond: BLEU3, colonne: true, gap: "32px", padV: ["48px", "40px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, couleur: "#ffffff", nom: "Infos" });
    return [G.racine(k, [haut, bandeDest, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Imprimerie et signalétique", target: 5, built: true,
  description: "Pieds standard pros et animés, angles droits, sans illustration : imprimeries, enseignistes et signalétique. Catalogue de supports, étapes devis-pose, envoi de fichier, horaires, contact.",
  models: [bonATirer, presseDeNuit, chantierDePose, nuancierModele, panneauDirectionnel],
};
