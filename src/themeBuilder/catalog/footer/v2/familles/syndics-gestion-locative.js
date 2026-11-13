// Famille v2 « Syndics et gestion locative » — 5 modèles (ft2-464 à ft2-468), extension « standard pro animé » : SANS illustration, ANGLES DROITS partout (aucun border-radius).
// Pieds de syndic de copropriété, d'administrateur de biens et d'agence de gestion locative : registre numéroté, trois portails (copropriétaires, bailleurs, locataires), bandeau d'urgence « sinistre »,
// calendrier de l'assemblée générale, barre latérale de cabinet. Tout est typographie, couleur, filets, aplats et cartes ; contenus utiles en français, marques fictives, AUCUNE coordonnée ni chiffre inventé
// (adresse, téléphone, e-mail et horaires viennent des « Données de l'entreprise »). Liens : routes de la plateforme uniquement (/connexion, /contact, /faq, /blog, /inscription…).
// MOUVEMENT (disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; fond de rangée qui s'éclaire et libellé qui glisse ; carte qui se soulève ; cellule d'étape dont le fond change ;
// bouton qui s'inverse ; carré de statut qui « respire ». Pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-std-s04");
const { DOUX, racineDe, lien, caps, para, trait, souffle, carre, horaires, coordonnees, bloc, listeLiens, lettre, nomDuSite, rangee } = A;

const FAM = "syndics-gestion-locative";
const W = ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];
const PAD = ["48px", "32px", "20px"];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-464 « Registre de copropriété » — syndic de copropriété
// Idée : un REGISTRE. À gauche le nom du cabinet et sa promesse ; à droite cinq rangées numérotées 01 à 05 (espace copropriétaire, charges, assemblées, incident, devenir client) dont le fond s'éclaire et
// le libellé glisse au survol. Bande vert bouteille dessous : coordonnées, horaires, lettre. Ivoire, vert bouteille et or. Polices : Fraunces (titres) et Source Sans 3.
const registre = identite({
  key: "c464", label: "Ivoire, vert bouteille et or", humeur: "light",
  fond: "#f6f2e7", texte: "#16442f", discret: "#4a5f52", accent: "#7a5a0c", surface: "#ece6d2", encre: "#16442f",
  police: "font.source-sans-3", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#16442f44",
});
const IVOIRE = "#f6f2e7", BOUTEILLE = "#16442f", OR = "#7a5a0c";
const registreCopro = modeleV2({
  id: identifiantV2(464, "registre-de-copropriete"), concept: "c-464-registre-de-copropriete",
  name: "Registre de copropriété", family: FAM,
  description: "Pour un syndic de copropriété : le nom du cabinet face à cinq rangées numérotées (espace copropriétaire, charges, assemblées, incident, devenir client) qui s'éclairent au survol, puis une bande vert bouteille pour contact, horaires et lettre.",
  tags: ["syndic", "copropriété", "registre", "rangées numérotées", "ivoire", "vert bouteille", "or", "angles droits"],
  identity: registre,
  racine: racineDe(BOUTEILLE),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const pt = souffle(carre(k, OR, "10px"), 3200);
    const gauche = G.colonne(k, [
      k.row([pt, caps(k, "Syndic de copropriété", { couleur: OR, suivi: "0.2em" })], { gap: "10px", alignItems: "center" }),
      nomDuSite(k, env, 40, BOUTEILLE),
      para(k, "Gestion des immeubles en copropriété et des biens loués : comptes lisibles, assemblées préparées, un interlocuteur qui répond.", { taille: 17, max: "420px" }),
    ], { poids: 4.6, min: "300px", gap: "16px" });
    const lignes = [["01", "Espace copropriétaire", "/connexion"], ["02", "Charges et appels de fonds", "/faq"], ["03", "Assemblées générales", "/blog"], ["04", "Déclarer un incident", "/contact"], ["05", "Devenir client", "/inscription"]];
    const liste = k.col(lignes.map(([n, t, u]) => rangee(k, n, `${n}  ·  ${t}`, u, { simple: true, accent: OR, couleur: BOUTEILLE, taille: 19, survolFond: "#ece6d2", filet: "#16442f55", focus: OR })), { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: BOUTEILLE, borderRadius: "0px" });
    const droite = G.colonne(k, [liste], { poids: 6.4, min: "320px", aligne: "stretch" });
    const haut = G.bande(k, [gauche, droite], { fond: IVOIRE, gap: "40px 72px", aligne: "flex-start", padV: ["80px", "60px", "44px"], padB: ["72px", "56px", "40px"], padH: PAD, nom: "Registre" });
    const cc = bloc(k, "Nous joindre", [coordonnees(k, { couleur: "#f6f2e7", lien: "#ffffff", survol: "#e9cf8a", focus: "#ffffff" })], { couleurTitre: "#e9cf8a", min: "220px", gap: "12px" });
    const hh = bloc(k, "Horaires", [horaires(k, { couleur: "#f6f2e7" })], { couleurTitre: "#e9cf8a", min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre de la copropriété", intro: "Les rappels d'assemblée et les nouvelles du cabinet, par courriel.", largeur: "100%", accent: "#e9cf8a", surBouton: BOUTEILLE, texte: "#f6f2e7", couleurTitre: "#e9cf8a", fond: BOUTEILLE, survolBouton: "#ffffff", survolTexte: BOUTEILLE, focus: "#ffffff" });
    const accroche = G.colonne(k, [k.T("<p>Restez au courant de votre immeuble.</p>", { fontSize: "fluid:26-40", lineHeight: 1.15, fontFamily: S.head, color: "#ffffff", fontWeight: "400", maxWidth: "520px" })], { poids: 4.3, min: "280px" });
    const lettreCol = G.colonne(k, [abo], { poids: 3.1, min: "290px", aligne: "stretch" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d7e0d9", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.ligne(k, [accroche, lettreCol], { gap: "28px 72px", aligne: "flex-end", largeur: "100%" }), trait(k, "#f6f2e744"), G.ligne(k, [cc, hh], { gap: "28px 72px", aligne: "flex-start", largeur: "100%" }), trait(k, "#f6f2e744"), mentions], { fond: BOUTEILLE, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, couleur: "#ffffff", nom: "Contact" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-465 « Trois portails » — administrateur de biens
// Idée : une grande bande cobalt (phrase en grand + lettre à droite), puis TROIS cartes à angles droits (copropriétaires, propriétaires bailleurs, locataires) qui se soulèvent au survol, et une bande marine
// pour le nom, les coordonnées et les horaires. Cobalt, marine et blanc. Polices : Manrope (titres) et Inter.
const portails = identite({
  key: "c465", label: "Cobalt, marine et blanc", humeur: "dark",
  fond: "#1b3aa8", texte: "#ffffff", discret: "#dbe3ff", accent: "#ffffff", surface: "#13297a", encre: "#0c1d5a",
  police: "font.inter", titres: "font.manrope",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#ffffff44",
});
const COBALT = "#1b3aa8", MARINE = "#0c1d5a", CIEL = "#eef1fa";
const troisPortails = modeleV2({
  id: identifiantV2(465, "trois-portails"), concept: "c-465-trois-portails",
  name: "Trois portails", family: FAM,
  description: "Pour un administrateur de biens : une bande cobalt avec la phrase d'accueil et la lettre, trois cartes carrées (copropriétaires, bailleurs, locataires) qui se soulèvent au survol, et une bande marine pour contact et horaires.",
  tags: ["administrateur de biens", "gestion locative", "portails", "cartes", "cobalt", "marine", "angles droits"],
  identity: portails,
  racine: racineDe(MARINE),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant("<p>Chacun son espace,<br>chaque dossier suivi.</p>", { taille: [34, 64], tablette: { taille: [48, 56] }, mobile: { taille: [32, 40] }, lh: 1.05, suivi: "-0.02em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const gauche = G.colonne(k, [caps(k, "Gestion locative et copropriété", { couleur: "#dbe3ff", suivi: "0.2em" }), phrase], { poids: 6, min: "300px", gap: "16px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Charges, travaux, échéances : un courriel utile, rarement.", largeur: "100%", accent: "#ffffff", surBouton: COBALT, texte: "#ffffff", couleurTitre: "#ffffff", fond: COBALT, survolBouton: MARINE, survolTexte: "#ffffff", focus: "#ffffff" });
    const droite = G.colonne(k, [abo], { poids: 5, min: "290px", aligne: "stretch", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: COBALT, gap: "36px 64px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["56px", "44px", "36px"], padH: PAD, nom: "Accueil" });
    const carte = (cat, titre, texte, lib, url) => {
      const c = k.col([caps(k, cat, { couleur: COBALT, suivi: "0.18em" }), k.T(`<p>${titre}</p>`, { fontSize: "24px", lineHeight: 1.2, fontWeight: "800", fontFamily: S.head, color: MARINE }), para(k, texte, { taille: 16, couleur: "#3b4a73" }), lien(k, `${lib} →`, url, { taille: 16, poids: "700", couleur: COBALT, survol: { color: MARINE, transform: { x: 6 } }, focus: COBALT })],
        { flexGrow: 1, flexBasis: "0px", minWidth: "260px", gap: "12px", paddingTop: "32px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "32px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderTopWidth: "4px", borderColor: COBALT, borderRadius: "0px", boxSizing: "border-box", transitionDuration: DOUX });
      c.states = { hover: { transform: { y: -6 }, backgroundColor: "#ffffff" } };
      return c;
    };
    const cartes = G.bande(k, [
      carte("Copropriétaires", "Mon immeuble", "Documents, charges, procès-verbaux et suivi des travaux de la résidence.", "Accéder à mon espace", "/connexion"),
      carte("Propriétaires bailleurs", "Mes biens loués", "Loyers encaissés, quittances, comptes rendus de gestion et échéances.", "Consulter mes biens", "/connexion"),
      carte("Locataires", "Mon logement", "Quittances, demandes d'intervention et questions fréquentes sur le bail.", "Poser une question", "/faq"),
    ], { fond: CIEL, gap: "24px", aligne: "stretch", padV: ["64px", "52px", "40px"], padB: ["64px", "52px", "40px"], padH: PAD, nom: "Portails" });
    const cc = bloc(k, "Coordonnées", [coordonnees(k, { couleur: "#e6ebff", lien: "#ffffff", survol: "#b9c7ff", focus: "#ffffff" })], { couleurTitre: "#b9c7ff", min: "220px", gap: "12px" });
    const hh = bloc(k, "Horaires d'accueil", [horaires(k, { couleur: "#e6ebff" })], { couleurTitre: "#b9c7ff", min: "220px", gap: "12px" });
    const nav = bloc(k, "Raccourcis", listeLiens(k, [["Contact", "/contact"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"]], { taille: 16, couleur: "#ffffff", accent: "#b9c7ff", focus: "#ffffff" }), { couleurTitre: "#b9c7ff", min: "180px", gap: "0px" });
    const nom = G.colonne(k, [nomDuSite(k, env, 28, "#ffffff"), para(k, "Gestion locative et syndic de copropriété.", { taille: 15, couleur: "#b9c7ff", max: "260px" })], { poids: 1.2, min: "240px", gap: "10px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c9d4ff", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.ligne(k, [nom, cc, hh, nav], { gap: "36px 48px", aligne: "flex-start", largeur: "100%" }), trait(k, "#ffffff44"), mentions], { fond: MARINE, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, couleur: "#ffffff", nom: "Cabinet" });
    return [G.racine(k, [haut, cartes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-466 « Dégât des eaux ? » — syndic, gestion d'urgences
// Idée : un BANDEAU D'APPEL safran en tête (« Un sinistre dans l'immeuble ? », deux boutons carrés qui s'inversent au survol), puis quatre colonnes de liens sur graphite,
// puis une dernière bande noire (coordonnées, horaires, lettre). Graphite et safran. Polices : Archivo (titres) et Barlow.
const urgence = identite({
  key: "c466", label: "Graphite et safran", humeur: "dark",
  fond: "#1c1c1e", texte: "#f2f2f2", discret: "#b8b8bd", accent: "#ffc21a", surface: "#2a2a2d", encre: "#111111",
  police: "font.barlow", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#ffffff33",
});
const SAFRAN = "#ffc21a", GRAPHITE = "#1c1c1e", NOIR = "#101012";
const degatDesEaux = modeleV2({
  id: identifiantV2(466, "degat-des-eaux"), concept: "c-466-degat-des-eaux",
  name: "Dégât des eaux ?", family: FAM,
  description: "Pour un syndic qui gère les urgences : un bandeau d'appel safran (sinistre, incident) avec deux boutons carrés, quatre colonnes de liens classées sur graphite, puis une bande noire pour contact, horaires et lettre.",
  tags: ["syndic", "urgence", "sinistre", "bandeau d'appel", "graphite", "safran", "colonnes de liens", "angles droits"],
  identity: urgence,
  racine: racineDe(NOIR),
  widgets: W.filter((w) => w !== "divider"),
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant("<p>Un sinistre dans l'immeuble ?</p>", { taille: [34, 72], tablette: { taille: [48, 60] }, mobile: { taille: [32, 40] }, lh: 1.02, suivi: "-0.02em", poids: "800", police: S.head, couleur: "#111111", extra: { textTransform: "uppercase" } })(k, env);
    const bouton = (t, u, plein) => lien(k, t, u, { taille: 16, poids: "700", casse: "uppercase", suivi: "0.06em", couleur: plein ? SAFRAN : "#111111", h: "54px", padH: "28px", survol: plein ? { backgroundColor: "#ffffff", color: "#111111", transform: { y: -3 } } : { backgroundColor: "#111111", color: SAFRAN, transform: { y: -3 } }, focus: "#111111", extra: { backgroundColor: plein ? "#111111" : "transparent", borderStyle: "solid", borderWidth: "2px", borderColor: "#111111", justifyContent: "center" } });
    const texte = G.colonne(k, [caps(k, "Urgence · incident · dégât des eaux", { couleur: "#111111", suivi: "0.18em" }), phrase, para(k, "Prévenez-nous tout de suite : nous organisons l'intervention et le suivi avec l'assurance.", { taille: 18, couleur: "#111111", max: "520px" })], { poids: 7, min: "300px", gap: "14px" });
    const boutons = G.colonne(k, [bouton("Déclarer un incident", "/contact", true), bouton("Espace client", "/connexion", false)], { poids: 3, min: "240px", gap: "12px", aligne: "stretch", soi: "flex-end" });
    const appel = G.bande(k, [texte, boutons], { fond: SAFRAN, gap: "32px 56px", aligne: "flex-end", padV: ["64px", "52px", "40px"], padB: ["64px", "52px", "40px"], padH: PAD, nom: "Appel" });
    const geante = (t, u) => lien(k, `${t}  ↗`, u, { taille: 26, poids: "800", casse: "uppercase", police: S.head, couleur: "#f2f2f2", h: "72px", survol: { color: SAFRAN, transform: { x: 8 } }, focus: SAFRAN, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#ffffff44" } });
    const moitie = (liste) => G.colonne(k, liste.map(([t, u]) => geante(t, u)), { poids: 1, min: "300px", gap: "0px", aligne: "stretch" });
    const liens = G.bande(k, [
      moitie([["Mon espace copropriétaire", "/connexion"], ["Charges et budget", "/faq"], ["Assemblées générales", "/blog"]]),
      moitie([["Quittances de loyer", "/connexion"], ["Confier mon bien", "/inscription"], ["Nous écrire", "/contact"]]),
    ], { fond: GRAPHITE, gap: "0px 56px", aligne: "flex-start", padV: ["56px", "44px", "32px"], padB: ["56px", "44px", "32px"], padH: PAD, nom: "Liens" });
    const cc = bloc(k, "Coordonnées", [coordonnees(k, { couleur: "#e4e4e8", lien: "#ffffff", survol: SAFRAN, focus: SAFRAN }), caps(k, "Horaires", { couleur: SAFRAN, extra: { marginTop: "10px" } }), horaires(k, { couleur: "#e4e4e8" })], { couleurTitre: SAFRAN, min: "240px", gap: "12px", poids: 2.7 });
    const abo = lettre(k, env, G, { titre: "Avis aux résidents", intro: "Coupures, travaux, échéances : prévenu avant tout le monde.", largeur: "100%", accent: SAFRAN, surBouton: "#111111", texte: "#e4e4e8", couleurTitre: SAFRAN, fond: NOIR, survolBouton: "#ffffff", survolTexte: "#111111", focus: SAFRAN });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c4c4ca", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.ligne(k, [nomDuSite(k, env, 26, "#ffffff"), cc, G.colonne(k, [abo], { poids: 3.3, min: "260px", aligne: "stretch" })], { gap: "36px 56px", aligne: "flex-start", largeur: "100%" }), mentions], { fond: NOIR, colonne: true, gap: "32px", padV: ["52px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, couleur: "#ffffff", nom: "Contact" });
    return [G.racine(k, [appel, liens, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-467 « Calendrier de l'assemblée » — syndic, assemblées générales
// Idée : une FRISE d'assemblée en quatre cellules numérotées (convocation, assemblée, procès-verbal, appel de fonds), chacune sous une barre terracotta épaisse ; le fond de la cellule change au survol.
// Dessous, une bande brun profond : coordonnées et horaires à gauche, lettre à droite. Crème, terracotta et brun. Polices : Young Serif (titres) et Work Sans.
const frise = identite({
  key: "c467", label: "Crème, terracotta et brun", humeur: "light",
  fond: "#f3e7da", texte: "#3a1a10", discret: "#6b4a3c", accent: "#9a3b1c", surface: "#ead8c5", encre: "#3a1a10",
  police: "font.work-sans", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#3a1a1044",
});
const CREME = "#f3e7da", TERRA = "#9a3b1c", BRUN = "#3a1a10";
const calendrierAssemblee = modeleV2({
  id: identifiantV2(467, "calendrier-de-l-assemblee"), concept: "c-467-calendrier-de-l-assemblee",
  name: "Calendrier de l'assemblée", family: FAM,
  description: "Pour un syndic qui prépare les assemblées : une frise de quatre étapes numérotées (convocation, assemblée, procès-verbal, appel de fonds) sous des barres terracotta, puis une bande brun profond pour contact, horaires et lettre.",
  tags: ["syndic", "assemblée générale", "frise", "étapes", "crème", "terracotta", "brun", "angles droits"],
  identity: frise,
  racine: racineDe(BRUN),
  widgets: W,
  compose(k, env, G) {
    const S = k.S;
    const tete = G.bande(k, [
      G.colonne(k, [caps(k, "Calendrier de la copropriété", { couleur: TERRA, suivi: "0.2em" }), k.T("<p>De la convocation à l'appel de fonds</p>", { fontSize: "fluid:30-52", lineHeight: 1.1, fontFamily: S.head, color: BRUN, maxWidth: "720px", fontWeight: "400" })], { poids: 6.2, min: "300px", gap: "14px" }),
      G.colonne(k, [nomDuSite(k, env, 24, BRUN), para(k, "Syndic de copropriété : chaque étape est annoncée, expliquée et archivée.", { taille: 16, max: "340px" })], { poids: 3.6, min: "260px", gap: "8px", soi: "flex-end" }),
    ], { fond: CREME, gap: "28px 56px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["36px", "32px", "28px"], padH: PAD, nom: "Titre" });
    const etape = (num, titre, texte, lib, url) => {
      const c = k.col([
        k.T(`<p>${num}</p>`, { fontSize: "54px", lineHeight: 1, fontFamily: S.head, color: TERRA, fontWeight: "400" }),
        k.T(`<p>${titre}</p>`, { fontSize: "21px", lineHeight: 1.25, fontFamily: S.head, color: BRUN, fontWeight: "400" }),
        para(k, texte, { taille: 15, couleur: "#5a3a2c" }),
        lien(k, `${lib} →`, url, { taille: 15, poids: "700", couleur: TERRA, survol: { color: BRUN, transform: { x: 6 } }, focus: TERRA }),
      ], { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "10px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: CREME, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: TERRA, borderRadius: "0px", boxSizing: "border-box", transitionDuration: DOUX });
      c.states = { hover: { backgroundColor: "#ead8c5" } };
      return c;
    };
    const grille = G.ligne(k, [
      etape("01", "Convocation", "L'ordre du jour et les documents arrivent avant la réunion.", "Voir les actualités", "/blog"),
      etape("02", "Assemblée générale", "Vote des résolutions, présence ou pouvoir.", "Poser une question", "/faq"),
      etape("03", "Procès-verbal", "Le compte rendu est déposé dans votre espace.", "Ouvrir mon espace", "/connexion"),
      etape("04", "Appel de fonds", "Charges et travaux votés, échéances claires.", "Nous écrire", "/contact"),
    ], { gap: "2px", aligne: "stretch", largeur: "100%" });
    const frisee = G.bande(k, [grille], { fond: CREME, colonne: true, padV: ["16px", "12px", "8px"], padB: ["72px", "56px", "44px"], padH: PAD, nom: "Frise" });
    const cc = bloc(k, "Nous joindre", [coordonnees(k, { couleur: "#f3e7da", lien: "#ffffff", survol: "#f0b99f", focus: "#ffffff" })], { couleurTitre: "#f0b99f", min: "220px", gap: "12px" });
    const hh = bloc(k, "Horaires", [horaires(k, { couleur: "#f3e7da" })], { couleurTitre: "#f0b99f", min: "220px", gap: "12px" });
    const gaucheBas = G.colonne(k, [G.ligne(k, [cc, hh], { gap: "32px 48px", aligne: "flex-start", largeur: "100%" })], { poids: 6.7, min: "320px", aligne: "stretch" });
    const abo = lettre(k, env, G, { titre: "Lettre de l'assemblée", intro: "Dates d'assemblée et rappels de charges, sans publicité.", largeur: "100%", accent: "#f0b99f", surBouton: BRUN, texte: "#f3e7da", couleurTitre: "#f0b99f", fond: BRUN, survolBouton: "#ffffff", survolTexte: BRUN, focus: "#ffffff" });
    const droiteBas = G.colonne(k, [abo], { poids: 4.1, min: "290px", aligne: "stretch" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#e1cdbd", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [G.ligne(k, [gaucheBas, droiteBas], { gap: "36px 64px", aligne: "flex-start", largeur: "100%" }), trait(k, "#f3e7da44"), mentions], { fond: BRUN, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, couleur: "#ffffff", nom: "Contact" });
    return [G.racine(k, [tete, frisee, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-468 « Cabinet et immeubles » — administrateur de biens, cabinet familial
// Idée : une BARRE LATÉRALE teal à gauche (nom, phrase, coordonnées, horaires) et, sur sable à droite, trois catégories de liens (Copropriété, Location, Cabinet) puis la lettre ; liens qui glissent au survol.
// Fine barre teal en bas pour les mentions. Teal profond et sable. Polices : Sora (titres) et Karla.
const cabinet = identite({
  key: "c468", label: "Teal profond et sable", humeur: "light",
  fond: "#e8dcc6", texte: "#0b3b44", discret: "#3f5a5f", accent: "#07586a", surface: "#f4ecdb", encre: "#0b3b44",
  police: "font.karla", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0b3b4444",
});
const TEAL = "#0b3b44", SABLE = "#e8dcc6", TEAL2 = "#07586a";
const cabinetImmeubles = modeleV2({
  id: identifiantV2(468, "cabinet-et-immeubles"), concept: "c-468-cabinet-et-immeubles",
  name: "Cabinet et immeubles", family: FAM,
  description: "Pour un cabinet d'administration de biens : une barre latérale teal (nom, coordonnées, horaires) face à trois catégories de liens sur sable et à la lettre d'information, avec une fine barre teal pour les mentions.",
  tags: ["administrateur de biens", "cabinet", "barre latérale", "catégories de liens", "teal", "sable", "angles droits"],
  identity: cabinet,
  racine: racineDe(TEAL),
  widgets: W,
  compose(k, env, G) {
    const pt = souffle(carre(k, "#8fd6df", "10px"), 3200);
    const lat = G.colonne(k, [
      k.row([pt, caps(k, "Cabinet", { couleur: "#8fd6df", suivi: "0.2em" })], { gap: "10px", alignItems: "center" }),
      nomDuSite(k, env, 32, "#ffffff"),
      para(k, "Administration d'immeubles, gestion locative et syndic.", { taille: 16, couleur: "#d3e6e9", max: "280px" }),
      trait(k, "#ffffff44"),
      caps(k, "Coordonnées", { couleur: "#8fd6df" }), coordonnees(k, { couleur: "#e6f1f3", lien: "#ffffff", survol: "#8fd6df", focus: "#ffffff" }),
      caps(k, "Horaires", { couleur: "#8fd6df", extra: { marginTop: "10px" } }), horaires(k, { couleur: "#e6f1f3" }),
    ], { poids: 0, base: "360px", min: "300px", gap: "12px", extra: { backgroundColor: TEAL, boxSizing: "border-box", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "40px", borderRadius: "0px", alignSelf: "stretch", flexShrink: 0 }, mobile: { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" }, tablette: { paddingLeft: "32px" } });
    const cat = (titre, liste, p) => G.colonne(k, [caps(k, titre, { couleur: TEAL2, suivi: "0.18em" }), ...listeLiens(k, liste, { taille: 17, couleur: TEAL, accent: TEAL2, focus: TEAL2 })], { poids: p, min: "180px", gap: "2px", aligne: "stretch" });
    const liens = G.ligne(k, [
      cat("Copropriété", [["Mon espace", "/connexion"], ["Charges et budget", "/faq"], ["Assemblées", "/blog"], ["Déclarer un incident", "/contact"]], 1.25),
      cat("Location", [["Quittances", "/connexion"], ["Louer un bien", "/catalogue"], ["Confier mon bien", "/inscription"], ["Questions fréquentes", "/faq"]], 1.1),
      cat("Cabinet", [["Actualités", "/blog"], ["Nous écrire", "/contact"], ["Devenir client", "/inscription"]], 0.8),
    ], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre du cabinet", intro: "Actualités des immeubles et rappels utiles, par courriel.", largeur: "460px", accent: TEAL, surBouton: "#ffffff", texte: TEAL, couleurTitre: TEAL2, fond: SABLE, survolBouton: TEAL2, survolTexte: "#ffffff", focus: TEAL });
    const droite = G.colonne(k, [liens, abo], { poids: 1, min: "340px", gap: "40px", aligne: "stretch", justifie: "space-between", extra: { backgroundColor: SABLE, boxSizing: "border-box", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "48px", borderRadius: "0px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" } });
    const corps = G.bande(k, [lat, droite], { fond: SABLE, max: "100%", gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Cabinet" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d3e6e9", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: TEAL, colonne: true, padV: ["24px", "22px", "20px"], padB: ["24px", "20px", "20px"], padH: PAD, couleur: "#ffffff", filetHaut: { epaisseur: "1px", couleur: "#ffffff33" }, nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Syndics et gestion locative", target: 5, built: true,
  description: "Pieds de syndic et d'administrateur de biens, standard et pros : registre numéroté, trois portails, bandeau d'urgence, calendrier d'assemblée, barre latérale de cabinet. Sans illustration, angles droits.",
  models: [registreCopro, troisPortails, degatDesEaux, calendrierAssemblee, cabinetImmeubles],
};
