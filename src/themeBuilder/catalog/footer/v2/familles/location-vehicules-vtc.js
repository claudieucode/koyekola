// Famille v2 « Location de véhicules et VTC » — 5 modèles (ft2-504 à ft2-508), extension « standard pro animé » : SANS illustration, ANGLES DROITS partout (aucun border-radius).
// Pieds d'agence de location (voitures, utilitaires) et de service de chauffeurs VTC : bande d'appel à réserver, grille de catégories, trajet en trois temps, agence et horaires, documents à prévoir.
// Contenu utile et réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUN tarif, AUCUNE flotte,
// AUCUN chiffre ni agrément inventé. Les adresses de réseaux sont des exemples à remplacer dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce », le moteur coupe les transitions et les animations d'attention) :
//   · transitions longues et douces de 360 ms (couleur, fond, filet qui s'étire, décalage de 4 à 10 px, retrait qui grandit) ;
//   · au moins une animation visible par modèle : bouton qui s'inverse, carte qui se soulève, carré de statut qui « respire », rangée dont le fond s'éclaire.
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const A = require("../aides-std-s08");
const { racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, rubrique, lettre, nomDuSite, bouton, carteLift, PH, DOUX } = A;

const FAM = "location-vehicules-vtc";
const SOC = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]];
const LOUER = [["Voitures et citadines", "/catalogue"], ["Utilitaires", "/catalogue"], ["Location longue durée", "/contact"], ["Demander un devis", "/contact"]];
const CHAUFFEURS = [["Chauffeur privé", "/contact"], ["Transferts gares et aéroports", "/contact"], ["Mise à disposition", "/contact"], ["Réserver une course", "/contact"]];
const AIDE = [["Questions fréquentes", "/faq"], ["Conditions de location", "/faq"], ["Espace client", "/connexion"], ["Créer un compte", "/inscription"]];
const SOCIETE = [["Accueil", "/"], ["Actualités", "/blog"], ["Nous contacter", "/contact"], ["Cookies", "/cookies"]];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-504 « Comptoir de départ » — agence de location de voitures et d'utilitaires
// Idée : le comptoir d'une agence. Une GRANDE bande jaune taxi (« Prêt à partir ? » en capitales massives, deux boutons carrés noirs qui s'inversent), puis une bande anthracite : nom, liens en ligne, filet, puis trois blocs
// (Nous joindre avec carré de statut qui respire, Horaires, Suivez-nous) et une ligne légale blanche. Polices : Archivo (800) et Public Sans.
const taxi = identite({
  key: "c504", label: "Anthracite et jaune taxi", humeur: "dark",
  fond: "#17191d", texte: "#f4f4f1", discret: "#b8bcc4", accent: "#ffc21a", surface: "#22252b", encre: "#17191d", surEncre: "#f4f4f1",
  police: "font.public-sans", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#f4f4f133",
});
const ANTHRACITE = "#17191d", JAUNE = "#ffc21a", BLANC = "#f4f4f1";
const comptoirDepart = modeleV2({
  id: identifiantV2(504, "comptoir-de-depart"), concept: "c-504-comptoir-de-depart",
  name: "Comptoir de départ", family: FAM,
  description: "Pour une agence de location de voitures et d'utilitaires : une grande bande jaune taxi pour réserver, puis une bande anthracite (liens en ligne, contact, horaires, réseaux) et une ligne légale. Franc, lisible, angles droits.",
  tags: ["location de voitures", "utilitaires", "agence", "jaune taxi", "anthracite", "bande d'appel", "colonnes", "angles droits"],
  identity: taxi,
  racine: racineDe(ANTHRACITE),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Prêt<br>à partir ?</p>`, { taille: [56, 120], tablette: { taille: [80, 104] }, mobile: { taille: [56, 76] }, lh: 0.96, suivi: "-0.02em", poids: "800", police: S.head, couleur: ANTHRACITE, extra: { textTransform: "uppercase" } })(k, env);
    const intro = texte(k, "Choisissez un véhicule, réservez en ligne ou passez à l'agence : on s'occupe du reste.", { taille: 18, couleur: ANTHRACITE, largeur: "420px", lh: 1.5 });
    const g = G.colonne(k, [caps(k, "Réservation", { couleur: ANTHRACITE, suivi: "0.22em" }), phrase, intro], { poids: 6, min: "300px", gap: "20px" });
    const b1 = bouton(k, "Réserver un véhicule", "/contact", { texte: JAUNE, fond: ANTHRACITE, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: "#ffffff", color: ANTHRACITE, transform: { x: 6 } }, focus: ANTHRACITE, extra: { width: "100%" } });
    const b2 = bouton(k, "Voir les véhicules", "/catalogue", { texte: ANTHRACITE, fond: undefined, bord: ANTHRACITE, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: ANTHRACITE, color: JAUNE, transform: { x: 6 } }, focus: ANTHRACITE, extra: { width: "100%" } });
    const d = G.colonne(k, [b1, b2], { poids: 3, min: "260px", gap: "12px", soi: "flex-end", aligne: "stretch" });
    const appel = G.bande(k, [g, d], { fond: JAUNE, gap: "36px 56px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Réservation" });
    const pt = souffle(carre(k, JAUNE, "10px"), 3000);
    const nomA = nomDuSite(k, env, 28, BLANC);
    const nav = G.ligne(k, [...LOUER.slice(0, 2), CHAUFFEURS[0], AIDE[0], AIDE[1]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: BLANC, survol: { color: JAUNE, transform: { y: -2 } }, focus: JAUNE })), { gap: "0px 28px", aligne: "center", justifie: "flex-end" });
    const hautC = k.row([nomA, nav], { justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px 40px", width: "100%" });
    const cContact = G.colonne(k, [k.row([pt, caps(k, "Nous joindre", { couleur: JAUNE })], { gap: "10px", alignItems: "center" }), coordonnees(k, { couleur: BLANC, lien: "#ffffff", survol: JAUNE, focus: JAUNE })], { poids: 1, min: "240px", gap: "12px" });
    const cHor = G.colonne(k, [caps(k, "Horaires", { couleur: JAUNE }), horaires(k, { couleur: BLANC })], { poids: 1, min: "240px", gap: "12px" });
    const cRes = bloc(k, "Suivez-nous", [G.reseauxTexte(SOC, { taille: 15, poids: "600", couleur: BLANC, survol: JAUNE, focus: JAUNE })(k, env), lien(k, "Espace client", "/connexion", { taille: 15, poids: "700", couleur: JAUNE, soulign: true, survol: { color: "#ffffff", transform: { x: 5 } }, focus: "#ffffff" })], { couleurTitre: JAUNE, min: "200px", gap: "8px" });
    const info = G.ligne(k, [cContact, cHor, cRes], { gap: "32px 48px", aligne: "flex-start", largeur: "100%" });
    const colonnes = G.bande(k, [hautC, trait(k, "#f4f4f155"), info], { fond: ANTHRACITE, colonne: true, gap: "36px", padV: ["64px", "52px", "44px"], padB: ["48px", "40px", "32px"], padH: PH, innerMobile: { rowGap: "26px" }, nom: "Colonnes" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d3d6dc", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [trait(k, "#f4f4f133"), mentions], { fond: ANTHRACITE, colonne: true, gap: "22px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [appel, colonnes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-505 « Catégories de véhicules » — loueur à plusieurs gammes
// Idée : à gauche l'agence (nom, phrase, bouton), à droite SIX RANGÉES à bloc numéroté vert pétrole (citadines, berlines, utilitaires, monospaces, électriques, avec chauffeur) ; chaque rangée glisse de 6 px et son contour passe à l'orange.
// Dessous une bande vert pétrole (coordonnées, horaires, lettre, mentions). Polices : Fraunces (titres) et Hanken Grotesk.
const ivoireLoc = identite({
  key: "c505", label: "Ivoire, vert pétrole et orange brûlé", humeur: "light",
  fond: "#f6f1e7", texte: "#10302f", discret: "#4a5a58", accent: "#b8420f", surface: "#ffffff", encre: "#0e4d4a",
  police: "font.hanken-grotesk", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#10302f33",
});
const IVOIRE = "#f6f1e7", PETROLE = "#0e4d4a", BRULE = "#b8420f", PETROLE2 = "#0a3a38";
const categoriesVehicules = modeleV2({
  id: identifiantV2(505, "categories-de-vehicules"), concept: "c-505-categories-de-vehicules",
  name: "Catégories de véhicules", family: FAM,
  description: "Pour un loueur à plusieurs gammes : six rangées à numéro (citadines, berlines, utilitaires, monospaces, électriques, avec chauffeur) qui glissent au survol, puis une bande vert pétrole avec contact, horaires et lettre.",
  tags: ["location", "catégories", "six cartes", "ivoire", "vert pétrole", "orange", "serif", "angles droits"],
  identity: ivoireLoc,
  racine: racineDe(PETROLE),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "emailsubscribe", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 34, PETROLE);
    const mot = texte(k, "Toutes nos gammes en un coup d'œil : choisissez la vôtre, nous préparons le reste.", { taille: 17, couleur: S.mute, largeur: "360px" });
    const btn = bouton(k, "Demander un devis", "/contact", { texte: "#ffffff", fond: PETROLE, survol: { backgroundColor: BRULE, color: "#ffffff", transform: { y: -3 } }, focus: BRULE });
    const gauche = G.colonne(k, [caps(k, "Nos gammes", { couleur: BRULE, suivi: "0.2em" }), nom, mot, btn], { poids: 3, min: "260px", gap: "16px" });
    const CATS = [["Citadines", "Compactes et faciles en ville.", "/catalogue"], ["Berlines", "Confort pour les longs trajets.", "/catalogue"], ["Utilitaires", "Pour déménager ou livrer.", "/catalogue"], ["Monospaces", "Plus de places, plus de coffre.", "/catalogue"], ["Électriques", "Silence et faibles émissions.", "/catalogue"], ["Avec chauffeur", "Un conducteur professionnel.", "/contact"]];
    const carte = ([t, d, u], i) => {
      const lt = lien(k, t, u, { taille: 22, poids: "600", police: S.head, couleur: PETROLE, survol: { color: BRULE, transform: { x: 6 } }, focus: BRULE, h: "44px" });
      const num = k.col([k.T(`<p>0${i + 1}</p>`, { fontSize: "20px", fontWeight: "700", color: "#ffffff", fontFamily: S.head, lineHeight: 1, textAlign: "center" })], { width: "64px", flexShrink: 0, alignSelf: "stretch", backgroundColor: PETROLE, alignItems: "center", justifyContent: "center", borderRadius: "0px", transitionDuration: DOUX });
      const corps = k.col([lt, texte(k, d, { taille: 15, couleur: S.mute })], { gap: "2px", flexGrow: 1, flexBasis: "0px", minWidth: "0px", paddingTop: "14px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "20px" });
      const c = k.row([num, corps], { width: "100%", flexWrap: "nowrap", gap: "0px", alignItems: "stretch", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1.5px", borderColor: "#10302f55", borderRadius: "0px", boxSizing: "border-box", transitionDuration: DOUX });
      c.states = { hover: { borderColor: BRULE, backgroundColor: "#fffaf3", transform: { x: 6 } } };
      return c;
    };
    const grille = k.col(CATS.map(carte), { gap: "10px", width: "100%" });
    const droite = G.colonne(k, [grille], { poids: 7, min: "320px" });
    const tete = G.bande(k, [gauche, droite], { fond: IVOIRE, gap: "40px 56px", aligne: "flex-start", padV: ["80px", "60px", "44px"], padB: ["80px", "64px", "48px"], padH: PH, nom: "Gammes" });
    const bGrille = null;
    const pt = souffle(carre(k, "#f0b48f", "10px"), 3200);
    const cContact = bloc(k, "Agence", [coordonnees(k, { couleur: "#eef3f1", lien: "#ffffff", survol: "#f0b48f", focus: "#ffffff" })], { couleurTitre: "#f0b48f", min: "220px", gap: "12px" });
    const cHor = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: "#f0b48f" })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: "#eef3f1" })], { poids: 1, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nos nouveautés et conseils de route, par courriel.", largeur: "360px", accent: "#f0b48f", surBouton: PETROLE2, texte: "#eef3f1", couleurTitre: "#f0b48f", fond: PETROLE, survolBouton: "#ffffff", survolTexte: PETROLE, focus: "#ffffff" });
    const cLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const cRes = bloc(k, "Suivez-nous", [G.reseauxTexte(SOC, { taille: 15, poids: "600", couleur: "#eef3f1", survol: "#f0b48f", focus: "#ffffff" })(k, env)], { couleurTitre: "#f0b48f", min: "180px" });
    const grille2 = G.ligne(k, [cContact, cHor, cLettre, cRes], { gap: "36px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d3e0dd", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille2, trait(k, "#ffffff33"), mentions], { fond: PETROLE, colonne: true, gap: "32px", padV: ["60px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "26px" }, nom: "Agence" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-506 « Trajet en trois temps » — service de chauffeurs VTC
// Idée : un pied NOIR très sobre. Le nom du service en grand à gauche, trois étapes numérotées « 01 Réserver · 02 Confirmer · 03 Voyager » en trois colonnes séparées par des filets (le numéro et le lien glissent au survol),
// une rangée de liens de services sous un filet menthe, puis contact, horaires et mentions. Aucun formulaire. Polices : Sora (titres) et DM Sans.
const noirVtc = identite({
  key: "c506", label: "Noir profond, argent et menthe", humeur: "dark",
  fond: "#0b0c0e", texte: "#f2f3f5", discret: "#aeb3bb", accent: "#3ddc97", surface: "#15171a", encre: "#0b0c0e", surEncre: "#f2f3f5",
  police: "font.dm-sans", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f2f3f533",
});
const NOIR = "#0b0c0e", MENTHE = "#3ddc97", ARGENT = "#f2f3f5";
const trajetTroisTemps = modeleV2({
  id: identifiantV2(506, "trajet-en-trois-temps"), concept: "c-506-trajet-en-trois-temps",
  name: "Trajet en trois temps", family: FAM,
  description: "Pour un service de chauffeurs VTC : nom du service en grand, trois étapes numérotées (réserver, confirmer, voyager) séparées par des filets, une rangée de services, puis contact, horaires et mentions. Noir profond, argent et menthe.",
  tags: ["VTC", "chauffeur", "trois étapes", "numérotation", "noir", "menthe", "sobre", "angles droits"],
  identity: noirVtc,
  racine: racineDe(NOIR),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 52, ARGENT, { fontWeight: "700" });
    const mot = texte(k, "Un chauffeur, une heure, une adresse. Réservez à l'avance, nous confirmons, vous voyagez l'esprit libre.", { taille: 18, couleur: "#c4c9d0", largeur: "460px", lh: 1.55 });
    const btn = bouton(k, "Réserver une course", "/contact", { texte: NOIR, fond: MENTHE, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: "#ffffff", color: NOIR, transform: { x: 6 } }, focus: "#ffffff", extra: { alignSelf: "flex-start" } });
    const haut = G.bande(k, [G.colonne(k, [caps(k, "Chauffeurs", { couleur: MENTHE, suivi: "0.22em" }), nom, mot, btn], { poids: 1, min: "300px", gap: "18px" })], { fond: NOIR, padV: ["88px", "68px", "48px"], padB: ["56px", "44px", "36px"], padH: PH, aligne: "flex-start", nom: "Service" });
    const etape = (num, titre, texteE, url, dernier) => {
      const lt = lien(k, titre, url, { taille: 26, poids: "700", police: S.head, couleur: ARGENT, survol: { color: MENTHE, transform: { x: 8 } }, focus: MENTHE, h: "48px" });
      const c = k.col([caps(k, num, { couleur: MENTHE, suivi: "0.2em", taille: "13px" }), lt, texte(k, texteE, { taille: 15, couleur: "#c4c9d0" })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "8px", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: NOIR, borderStyle: "solid", borderWidth: "0px", borderRightWidth: dernier ? "0px" : "1px", borderColor: "#f2f3f544", borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", borderRightWidth: "0px", borderBottomWidth: dernier ? "0px" : "1px" });
      c.states = { hover: { backgroundColor: "#1a1d21" } };
      return c;
    };
    const etapes = G.ligne(k, [etape("01", "Réserver", "Indiquez le lieu, le jour et l'heure de prise en charge.", "/contact"), etape("02", "Confirmer", "Nous vous répondons et validons les détails du trajet.", "/contact"), etape("03", "Voyager", "Votre chauffeur vous attend. Une question ? Consultez l'aide.", "/faq", true)], { gap: "0px", aligne: "stretch", largeur: "100%" });
    etapes.styles.desktop = { ...etapes.styles.desktop, borderStyle: "solid", borderWidth: "1px", borderColor: "#f2f3f544", borderRadius: "0px" };
    const bEtapes = G.bande(k, [etapes], { fond: NOIR, colonne: true, padV: ["8px", "8px", "8px"], padB: ["64px", "52px", "40px"], padH: PH, nom: "Étapes" });
    const services = G.ligne(k, [caps(k, "Services", { couleur: MENTHE }), ...CHAUFFEURS.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: ARGENT, survol: { color: MENTHE, transform: { y: -2 } }, focus: MENTHE })), ...SOCIETE.slice(0, 2).map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: "#c4c9d0", survol: { color: MENTHE, transform: { y: -2 } }, focus: MENTHE }))], { gap: "4px 30px", aligne: "center", largeur: "100%" });
    const pt = souffle(carre(k, MENTHE, "10px"), 3000);
    const cC = bloc(k, "Contact", [coordonnees(k, { couleur: ARGENT, lien: "#ffffff", survol: MENTHE, focus: MENTHE })], { couleurTitre: MENTHE, min: "230px", gap: "12px" });
    const cH = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: MENTHE })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: ARGENT })], { poids: 1, min: "230px", gap: "12px" });
    const cR = bloc(k, "Réseaux", [G.reseauxTexte(SOC, { taille: 15, poids: "600", couleur: ARGENT, survol: MENTHE, focus: MENTHE })(k, env)], { couleurTitre: MENTHE, min: "200px" });
    const info = G.ligne(k, [cC, cH, cR], { gap: "32px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c4c9d0", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [services, trait(k, MENTHE, "2px"), info, trait(k, "#f2f3f533"), mentions], { fond: NOIR, colonne: true, gap: "34px", padV: ["16px", "16px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "26px" }, nom: "Contact" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bEtapes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-507 « Agence et horaires » — agence de proximité (location et chauffeurs)
// Idée : un PIED EN TROIS COLONNES D'ÉGALE LARGEUR sur fond blanc, séparées par de grands filets bleus : à gauche la carte d'identité de l'agence (nom, coordonnées, horaires, carré de statut),
// au centre deux rubriques de liens (Louer, Chauffeurs) en rangées dont le fond s'éclaire au survol, à droite la lettre et les réseaux. Une barre bleu marine porte les mentions. Polices : Red Hat Display et Mulish.
const marineAgence = identite({
  key: "c507", label: "Blanc, bleu marine et bleu vif", humeur: "light",
  fond: "#ffffff", texte: "#0d2145", discret: "#4b5870", accent: "#1556d6", surface: "#eef2fa", encre: "#0d2145",
  police: "font.mulish", titres: "font.red-hat-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0d214533",
});
const MARINE = "#0d2145", BLEU = "#1556d6", GLACE = "#eef2fa";
const agenceHoraires = modeleV2({
  id: identifiantV2(507, "agence-et-horaires"), concept: "c-507-agence-et-horaires",
  name: "Agence et horaires", family: FAM,
  description: "Pour une agence de proximité : trois colonnes égales séparées par de grands filets bleus (identité de l'agence avec contact et horaires, rubriques de liens en rangées, lettre et réseaux) et une barre bleu marine. Blanc et bleu, très net.",
  tags: ["agence", "proximité", "trois colonnes", "filets", "blanc", "bleu marine", "horaires", "angles droits"],
  identity: marineAgence,
  racine: racineDe(MARINE),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "emailsubscribe", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const colonneFilet = (enfants, dernier) => k.col(enfants, { flexGrow: 1, flexBasis: "0px", minWidth: "280px", gap: "18px", paddingTop: "0px", paddingBottom: "0px", paddingLeft: "36px", paddingRight: "36px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: dernier ? "0px" : "0px", borderRightWidth: dernier ? "0px" : "3px", borderColor: BLEU, borderRadius: "0px", boxSizing: "border-box" }, undefined, { minWidth: "100%", paddingLeft: "0px", paddingRight: "0px", borderRightWidth: "0px", paddingBottom: "28px", borderBottomWidth: dernier ? "0px" : "3px" });
    const nom = nomDuSite(k, env, 30, MARINE);
    const pt = souffle(carre(k, BLEU, "10px"), 3000);
    const c1 = colonneFilet([caps(k, "Votre agence", { couleur: BLEU, suivi: "0.2em" }), nom, coordonnees(k, { couleur: MARINE, lien: MARINE, survol: BLEU, focus: BLEU }), k.row([pt, caps(k, "Horaires d'ouverture", { couleur: BLEU })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: MARINE })]);
    const rangee = ([t, u]) => {
      const l = lien(k, t, u, { taille: 17, poids: "700", couleur: MARINE, survol: { color: BLEU }, focus: BLEU, h: "48px", extra: { flexGrow: 1 } });
      const r = k.row([l, k.T("<p>→</p>", { fontSize: "18px", color: BLEU, fontFamily: S.font, lineHeight: 1 })], { flexWrap: "nowrap", alignItems: "center", width: "100%", paddingLeft: "10px", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#0d214544", borderRadius: "0px", backgroundColor: "#ffffff", boxSizing: "border-box", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: GLACE, paddingLeft: "22px" } };
      return r;
    };
    const liste = (titre, l) => k.col([caps(k, titre, { couleur: BLEU }), k.col(l.map(rangee), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: MARINE })], { gap: "8px", width: "100%" });
    const c2 = colonneFilet([liste("Louer", LOUER), liste("Chauffeurs", CHAUFFEURS.slice(0, 3))]);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Offres de saison et conseils, par courriel.", largeur: "100%", accent: BLEU, surBouton: "#ffffff", texte: MARINE, couleurTitre: BLEU, fond: "#ffffff", survolBouton: MARINE, survolTexte: "#ffffff", focus: MARINE });
    const c3 = colonneFilet([abo, caps(k, "Suivez-nous", { couleur: BLEU }), G.reseauxTexte(SOC, { taille: 16, poids: "700", couleur: MARINE, survol: BLEU, focus: BLEU })(k, env)], true);
    const trois = G.bande(k, [c1, c2, c3], { fond: "#ffffff", gap: "40px 0px", aligne: "stretch", padV: ["88px", "68px", "48px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Colonnes" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d5def0", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { fond: MARINE, colonne: true, padV: ["26px", "24px", "20px"], padB: ["26px", "24px", "20px"], padH: PH, nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [trois, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-508 « Documents à prévoir » — loueur qui rassure avant la location
// Idée : une LISTE DE CONTRÔLE. Un bandeau rouge en tête avec la lettre d'information en ligne, puis quatre cartes à coche carrée (permis, pièce d'identité, justificatif, moyen de paiement) qui s'éclairent au survol,
// et une bande grise compacte : liens en ligne, contact, horaires et mentions. Polices : Oswald (titres) et Lato.
const grisRouge = identite({
  key: "c508", label: "Gris clair, rouge sécurité et graphite", humeur: "light",
  fond: "#eceff1", texte: "#1c2127", discret: "#4c5560", accent: "#b3261e", surface: "#ffffff", encre: "#1c2127",
  police: "font.lato", titres: "font.oswald",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#1c212733",
});
const GRIS = "#eceff1", ROUGE = "#b3261e", GRAPHITE = "#1c2127";
const documentsAPrevoir = modeleV2({
  id: identifiantV2(508, "documents-a-prevoir"), concept: "c-508-documents-a-prevoir",
  name: "Documents à prévoir", family: FAM,
  description: "Pour un loueur qui rassure avant la location : un bandeau rouge avec la lettre d'information, quatre cartes à coche carrée (permis, pièce d'identité, justificatif, paiement) et une bande grise compacte avec liens, contact et horaires.",
  tags: ["location", "liste de contrôle", "documents", "rouge", "gris", "bandeau lettre", "cartes", "angles droits"],
  identity: grisRouge,
  racine: racineDe(GRIS),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "emailsubscribe", "link", "text"],
  compose(k, env, G) {
    const S = k.S;
    const abo = lettre(k, env, G, { titre: "Offres et nouveautés par courriel", intro: "Une lettre de temps en temps, jamais de spam.", largeur: "520px", accent: "#ffffff", surBouton: ROUGE, texte: "#ffffff", couleurTitre: "#ffffff", fond: ROUGE, survolBouton: GRAPHITE, survolTexte: "#ffffff", focus: "#ffffff" });
    const titre = G.geant(`<p>Louer<br>sans mauvaise<br>surprise.</p>`, { taille: [40, 76], tablette: { taille: [56, 72] }, mobile: { taille: [40, 52] }, lh: 1.0, suivi: "0.01em", poids: "700", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const bandeau = G.bande(k, [G.colonne(k, [caps(k, "Avant de réserver", { couleur: "#ffffff", suivi: "0.22em" }), titre], { poids: 5, min: "300px", gap: "14px" }), G.colonne(k, [abo], { poids: 4, min: "280px", soi: "flex-end" })], { fond: ROUGE, gap: "32px 56px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["64px", "48px", "36px"], padH: PH, nom: "Lettre" });
    const DOCS = [["Permis de conduire", "En cours de validité, à présenter au départ du véhicule."], ["Pièce d'identité", "Une pièce officielle avec photo."], ["Justificatif de domicile", "Un document récent à votre nom."], ["Moyen de paiement", "Une carte bancaire au nom du conducteur."]];
    const doc = ([t, d]) => {
      const coche = k.col([k.T("<p>✓</p>", { fontSize: "18px", fontWeight: "800", color: "#ffffff", fontFamily: S.font, lineHeight: 1 })], { width: "34px", height: "34px", flexShrink: 0, backgroundColor: ROUGE, borderRadius: "0px", alignItems: "center", justifyContent: "center" });
      const corps = k.col([k.T(`<p>${t}</p>`, { fontSize: "21px", fontWeight: "700", fontFamily: S.head, textTransform: "uppercase", letterSpacing: "0.02em", color: GRAPHITE, lineHeight: 1.2 }), texte(k, d, { taille: 15, couleur: S.mute })], { gap: "6px", flexGrow: 1, flexBasis: "0px", minWidth: "0px" });
      const c = k.row([coche, corps], { flexGrow: 1, flexBasis: "0px", minWidth: "250px", flexWrap: "nowrap", gap: "16px", alignItems: "flex-start", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: GRAPHITE, borderRadius: "0px", boxSizing: "border-box", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { backgroundColor: "#fbeceb", borderColor: ROUGE, transform: { y: -4 } } };
      return c;
    };
    const cartes = G.ligne(k, DOCS.map(doc), { gap: "14px", aligne: "stretch", largeur: "100%" });
    const note = lien(k, "Toutes les conditions de location →", "/faq", { taille: 16, poids: "700", couleur: ROUGE, soulign: true, survol: { color: GRAPHITE, transform: { x: 6 } }, focus: GRAPHITE });
    const bDocs = G.bande(k, [cartes, note], { fond: GRIS, colonne: true, gap: "20px", padV: ["64px", "52px", "40px"], padB: ["48px", "40px", "32px"], padH: PH, nom: "Documents" });
    const liens = G.ligne(k, [...[...LOUER.slice(0, 2), ...CHAUFFEURS.slice(0, 1), ...AIDE.slice(0, 1), SOCIETE[1]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "700", couleur: GRAPHITE, survol: { color: ROUGE, transform: { y: -2 } }, focus: ROUGE }))], { gap: "4px 28px", aligne: "center", largeur: "100%" });
    const pt = souffle(carre(k, ROUGE, "10px"), 3200);
    const cC = bloc(k, "Contact", [coordonnees(k, { couleur: GRAPHITE, lien: GRAPHITE, survol: ROUGE, focus: ROUGE })], { couleurTitre: ROUGE, min: "230px", gap: "12px", police: S.head });
    const cH = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: ROUGE, police: S.head })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: GRAPHITE })], { poids: 1, min: "230px", gap: "12px" });
    const info = G.ligne(k, [cC, cH], { gap: "32px 48px", aligne: "flex-start", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [liens, trait(k, S.line), info, trait(k, S.line), mentions], { fond: GRIS, colonne: true, gap: "28px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "24px" }, filetHaut: { epaisseur: "4px", couleur: GRAPHITE }, nom: "Compact" });
    return [G.racine(k, [bandeau, bDocs, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Location de véhicules et VTC", target: 5, built: true,
  description: "Pieds standard très professionnels, à angles droits et sans illustration : comptoir jaune taxi, catégories en cartes, trajet VTC en trois étapes, agence et horaires, documents à prévoir.",
  models: [comptoirDepart, categoriesVehicules, trajetTroisTemps, agenceHoraires, documentsAPrevoir],
};
