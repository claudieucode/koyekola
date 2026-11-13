// Famille v2 « Petite enfance et seniors » — 5 modèles (ft2-494 à ft2-498), extension « standard pro animé » : ANGLES DROITS, aucune illustration, textes, couleurs, filets et grilles.
// Pieds crédibles pour une crèche, une résidence pour seniors, un relais d'assistantes maternelles, un service d'aide à domicile et un accueil de jour : lisibles (gros corps de texte), chaleureux, bien classés.
// Contenu réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions) ; marques fictives ; AUCUN chiffre, tarif, agrément ni coordonnée inventé.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, décalage de 2 à 8 px, retrait qui s'élargit, fond de ligne qui s'éclaire, carte qui se soulève,
// bouton qui s'inverse) ; un carré de statut qui « respire » dans les modèles où il est posé. Pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-std-s07");
const { racineDe, lien, caps, para, trait, souffle, carre, horaires, coordonnees, bloc, liste, lettre, nomDuSite, bouton, carte, DOUX } = A;

const FAM = "petite-enfance-seniors";
const WS = ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"];
const W = ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"];
const RAPIDE = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace famille", "/connexion"]];
const MENTIONS = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);

// ═══ ft2-494 « Premiers pas » — crèche, micro-crèche ═══════════════════════════════════════════════════════════════════════════════════════
// Idée : un BANDEAU DE LETTRE vert profond EN TÊTE (titre à gauche, formulaire à droite), puis quatre colonnes de liens sur ivoire chaud (Familles, La crèche, Pratique, Nous joindre) et une ligne légale.
// Les titres de colonnes portent un petit filet corail qui s'étire au survol de la colonne ; carré de statut qui respire près des horaires. Polices : Fraunces (titres) et Nunito.
const pas = identite({
  key: "c494", label: "Ivoire, vert sapin et corail", humeur: "light",
  fond: "#fbf4e8", texte: "#26332e", discret: "#4f5d56", accent: "#a93d22", surface: "#ffffff", encre: "#1f4a3d",
  police: "font.nunito", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#26332e33",
});
const premiersPas = modeleV2({
  id: identifiantV2(494, "premiers-pas"), concept: "c-494-premiers-pas",
  name: "Premiers pas", family: FAM,
  description: "Pour une crèche ou une micro-crèche : bandeau de lettre vert profond en tête, puis quatre colonnes claires et bien classées (familles, la crèche, pratique, nous joindre) sur ivoire chaud, filets corail qui s'étirent au survol.",
  tags: ["crèche", "petite enfance", "bandeau lettre en tête", "quatre colonnes", "ivoire", "vert sapin", "corail", "angles droits"],
  identity: pas, racine: racineDe("#fbf4e8"), widgets: W,
  compose(k, env, G) {
    const S = k.S, SAPIN = "#1f4a3d", CORAIL = "#a93d22", IVOIRE = "#fbf4e8";
    const titreL = G.colonne(k, [caps(k, "Restons en contact", { couleur: "#f3c9a8", suivi: "0.2em" }), k.T("<p>Les nouvelles de la crèche, à lire à votre rythme.</p>", { fontSize: "28px", lineHeight: 1.25, fontFamily: S.head, fontWeight: "600", color: "#ffffff", maxWidth: "460px" })], { poids: 5, min: "300px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Quelques courriels par an, sans publicité.", bouton: "S'abonner", largeur: "100%", accent: "#f3c9a8", surBouton: SAPIN, texte: "#f4efe3", couleurTitre: "#ffffff", fond: SAPIN, survolBouton: "#ffffff", survolTexte: SAPIN, focus: "#ffffff" });
    const bandeau = G.bande(k, [titreL, G.colonne(k, [abo], { poids: 6, min: "300px" })], { fond: SAPIN, aligne: "center", gap: "28px 56px", padV: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Lettre" });
    const col = (titre, enfants, p = 1) => {
      const c = bloc(k, titre, [k.col([], { width: "28px", height: "3px", backgroundColor: CORAIL, borderRadius: "0px", transitionDuration: DOUX, marginBottom: "10px" }), ...enfants], { couleurTitre: SAPIN, poids: p, min: "170px", gap: "4px" });
      return c;
    };
    const familles = col("Familles", liste(k, [["Questions fréquentes", "/faq"], ["Espace famille", "/connexion"], ["Créer un compte", "/inscription"], ["Nous écrire", "/contact"], ["Haut de page", "#haut"]], { couleur: "#26332e" }));
    const creche = col("La crèche", liste(k, [["Accueil", "/"], ["Actualités", "/blog"], ["Notre projet", "/blog"], ["Nous contacter", "/contact"], ["Cookies", "/cookies"]], { couleur: "#26332e" }));
    const pratique = G.colonne(k, [k.row([souffle(carre(k, CORAIL, "10px"), 3000), caps(k, "Horaires d'accueil", { couleur: SAPIN })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 16, couleur: "#26332e" })], { poids: 1.2, min: "200px", gap: "12px" });
    const joindre = bloc(k, "Nous joindre", [coordonnees(k, { taille: 16, couleur: "#26332e", lien: SAPIN, survol: CORAIL, focus: CORAIL })], { couleurTitre: SAPIN, poids: 1.2, min: "200px", gap: "12px" });
    const nom = nomDuSite(k, env, 30, SAPIN, { fontWeight: "600" });
    const colonnes = G.bande(k, [G.colonne(k, [nom, para(k, "Un lieu d'accueil pensé pour les tout-petits et leurs parents.", { taille: 16, couleur: "#4f5d56", max: "260px" })], { poids: 1.1, min: "180px", gap: "12px" }), familles, creche, pratique, joindre], { fond: IVOIRE, aligne: "flex-start", gap: "40px 32px", padV: ["72px", "56px", "44px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Colonnes" });
    const bas = G.bande(k, [trait(k, "#26332e33"), MENTIONS(G, k, env, { couleur: "#4f5d56", liens: SAPIN })], { fond: IVOIRE, colonne: true, gap: "24px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [bandeau, colonnes, bas])];
  },
}, FAM);

// ═══ ft2-495 « Maison des tilleuls » — résidence pour seniors, EHPAD, résidence services ═════════════════════════════════════════════════════
// Idée : BARRE LATÉRALE. À gauche, un grand panneau bleu nuit (nom du site, phrase d'accueil, coordonnées en gros caractères, bouton or) ; à droite, sur fond papier, trois listes de liens en 19 px, les horaires de visite
// et les mentions. Très lisible. Les liens s'éclairent et glissent ; le bouton or s'inverse. Polices : Source Serif 4 (titres) et Public Sans. Mobile : panneau bleu puis listes.
const tilleuls = identite({
  key: "c495", label: "Bleu nuit, or et papier", humeur: "light",
  fond: "#f6f3ec", texte: "#17233d", discret: "#4a5468", accent: "#8a5a00", surface: "#ffffff", encre: "#14284b",
  police: "font.public-sans", titres: "font.source-serif-4",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#17233d33",
});
const maisonTilleuls = modeleV2({
  id: identifiantV2(495, "maison-des-tilleuls"), concept: "c-495-maison-des-tilleuls",
  name: "Maison des tilleuls", family: FAM,
  description: "Pour une résidence seniors : un grand panneau bleu nuit à gauche (nom, coordonnées en gros caractères, bouton or) et, à droite sur papier clair, trois listes de liens très lisibles, horaires de visite et mentions.",
  tags: ["seniors", "résidence", "barre latérale", "bleu nuit", "or", "gros caractères", "lisible", "angles droits"],
  identity: tilleuls, racine: racineDe("#f6f3ec"), widgets: WS,
  compose(k, env, G) {
    const S = k.S, NUIT = "#14284b", OR = "#e8c46a", PAPIER = "#f6f3ec";
    const nom = nomDuSite(k, env, 34, "#ffffff", { fontWeight: "600" });
    const acc = para(k, "Une maison où l'on se sent chez soi. Venez nous rendre visite, nous vous accueillons avec plaisir.", { taille: 18, couleur: "#e4e9f3", max: "400px", lh: 1.6 });
    const btn = bouton(k, "Prendre contact", "/contact", { couleur: OR, plein: true, surPlein: NUIT, survol: { backgroundColor: "#ffffff", color: NUIT, transform: { x: 6 } }, focus: "#ffffff", extra: { alignSelf: "flex-start" } });
    const coord = coordonnees(k, { taille: 18, couleur: "#ffffff", lien: "#ffffff", survol: OR, focus: OR });
    const panneau = G.colonne(k, [caps(k, "Résidence", { couleur: OR, suivi: "0.22em" }), nom, acc, coord, btn], { poids: 4, min: "340px", gap: "20px", extra: { backgroundColor: NUIT, paddingTop: "72px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "48px" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { minWidth: "100%", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" } });
    const l1 = bloc(k, "Votre proche", liste(k, [["Questions fréquentes", "/faq"], ["Espace familles", "/connexion"], ["Nous écrire", "/contact"]], { taille: 19, couleur: NUIT, poids: "600", survol: { color: "#8a5a00", transform: { x: 6 } } }), { couleurTitre: "#8a5a00", min: "190px", gap: "2px" });
    const l2 = bloc(k, "La maison", liste(k, [["Accueil", "/"], ["Actualités", "/blog"], ["Cookies", "/cookies"]], { taille: 19, couleur: NUIT, poids: "600", survol: { color: "#8a5a00", transform: { x: 6 } } }), { couleurTitre: "#8a5a00", min: "190px", gap: "2px" });
    const hor = G.colonne(k, [k.row([souffle(carre(k, "#8a5a00", "10px"), 3200), caps(k, "Heures de visite", { couleur: "#8a5a00" })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 17, couleur: NUIT })], { poids: 1.3, min: "250px", gap: "12px" });
    const droite = G.colonne(k, [G.ligne(k, [l1, l2, hor], { gap: "36px 44px", aligne: "flex-start", largeur: "100%" }), trait(k, "#17233d33"), MENTIONS(G, k, env, { couleur: "#4a5468", liens: NUIT })], { poids: 8, min: "420px", gap: "40px", extra: { paddingTop: "72px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "56px", backgroundColor: PAPIER }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { minWidth: "100%", paddingTop: "40px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "28px" } });
    const bande = G.bande(k, [panneau, droite], { fond: PAPIER, max: "100%", gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Résidence" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-496 « Mille et un jours » — relais d'assistantes maternelles, accueil collectif ═════════════════════════════════════════════════════
// Idée : un SOMMAIRE NUMÉROTÉ en rangées pleine largeur (01 à 05). Chaque rangée est un lien : numéro, intitulé, flèche (une courte phrase d'aide figure dans l'intitulé) ; au survol le fond s'éclaire en jaune pâle, le retrait s'élargit et la flèche glisse.
// Sur moutarde, texte brun profond. Sous le sommaire, une bande brune : horaires, coordonnées, mentions. Polices : Young Serif (titres) et Hanken Grotesk. Mobile : rangées empilées, flèche conservée.
const moutarde = identite({
  key: "c496", label: "Moutarde et brun profond", humeur: "light",
  fond: "#f2b632", texte: "#2d2013", discret: "#4a3820", accent: "#2d2013", surface: "#fbe3a1", encre: "#2d2013",
  police: "font.hanken-grotesk", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2d201340",
});
const milleEtUnJours = modeleV2({
  id: identifiantV2(496, "mille-et-un-jours"), concept: "c-496-mille-et-un-jours",
  name: "Mille et un jours", family: FAM,
  description: "Pour un relais d'assistantes maternelles ou un lieu d'accueil : un sommaire numéroté en rangées pleine largeur sur moutarde, fond de rangée qui s'éclaire et flèche qui glisse, puis une bande brune (contact, horaires, mentions).",
  tags: ["assistantes maternelles", "relais", "sommaire numéroté", "moutarde", "brun", "rangées", "angles droits"],
  identity: moutarde, racine: racineDe("#2d2013"), widgets: WS,
  compose(k, env, G) {
    const S = k.S, MOUT = "#f2b632", BRUN = "#2d2013", CLAIR = "#fbe3a1";
    const nom = nomDuSite(k, env, 30, BRUN, { fontWeight: "400" });
    const tete = G.ligne(k, [G.colonne(k, [caps(k, "Sommaire", { couleur: BRUN, suivi: "0.22em" }), nom], { poids: 1, min: "280px", gap: "10px" }), G.colonne(k, [para(k, "Parents et professionnelles : trouvez en un clic la bonne page.", { taille: 18, couleur: BRUN, max: "420px" })], { poids: 1, min: "280px", soi: "flex-end" })], { gap: "20px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const rangee = (num, titre, note, url) => {
      const a = lien(k, titre, url, { taille: 24, poids: "400", police: S.head, couleur: BRUN, survol: { color: BRUN, transform: { x: 6 } }, focus: BRUN, h: "56px", extra: { flexGrow: 1 } });
      const fl = lien(k, "→", url, { taille: 28, poids: "700", couleur: BRUN, survol: { color: BRUN, transform: { x: 10 } }, focus: BRUN, h: "44px", padH: "8px" });
      const r = k.row([caps(k, num, { couleur: BRUN, suivi: "0.18em", extra: { minWidth: "40px" } }), a, fl], { flexWrap: "nowrap", alignItems: "center", gap: "20px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "0px", paddingRight: "0px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#2d201366", borderRadius: "0px", transitionDuration: DOUX, width: "100%" }, { flexWrap: "nowrap" }, { flexWrap: "nowrap", gap: "10px" });
      r.states = { hover: { backgroundColor: CLAIR, paddingLeft: "24px", paddingRight: "24px" } };
      return r;
    };
        const lignes = k.col([trait(k, "#2d201366"),
      rangee("01", "Trouver un accueil", "Les lieux et modes d'accueil proches de chez vous.", "/contact"),
      rangee("02", "Questions de parents", "Les réponses aux questions les plus fréquentes.", "/faq"),
      rangee("03", "Espace professionnelles", "Se connecter à son espace.", "/connexion"),
      rangee("04", "Actualités du relais", "Animations, rencontres et informations.", "/blog"),
      rangee("05", "Nous écrire", "Une question ? Un message suffit.", "/contact"),
    ], { gap: "0px", width: "100%" });
    const sommaire = G.bande(k, [tete, lignes], { fond: MOUT, colonne: true, gap: "32px", padV: ["64px", "52px", "44px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Sommaire" });
    const coord = bloc(k, "Nous joindre", [coordonnees(k, { taille: 16, couleur: "#fff7e0", lien: "#ffffff", survol: MOUT, focus: MOUT })], { couleurTitre: MOUT, min: "240px", gap: "12px" });
    const hor = G.colonne(k, [k.row([souffle(carre(k, MOUT, "10px"), 3000), caps(k, "Permanences", { couleur: MOUT })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 16, couleur: "#fff7e0" })], { poids: 1, min: "240px", gap: "12px" });
    const bas = G.bande(k, [G.ligne(k, [hor, coord], { gap: "32px 64px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" }), MENTIONS(G, k, env, { couleur: "#e9dcc0", liens: "#ffffff" })], { fond: BRUN, couleur: "#ffffff", colonne: true, gap: "28px", padV: ["48px", "44px", "36px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Contact" });
    return [G.racine(k, [sommaire, bas])];
  },
}, FAM);

// ═══ ft2-497 « Chez soi, accompagné » — aide à domicile, portage de repas, téléassistance ══════════════════════════════════════════════════
// Idée : GRILLE DE TROIS CARTES (Aide à domicile, Repas et courses, Sécurité à la maison) à angles droits, blanches sur menthe très pâle, avec une barre turquoise sur le côté gauche ; chaque carte se soulève au survol.
// En tête : le nom et un grand numéro à appeler (coordonnées). En bas : liens, horaires et lettre sur turquoise profond. Polices : DM Serif Display (titres) et DM Sans.
const turquoise = identite({
  key: "c497", label: "Menthe pâle, turquoise et orange brûlé", humeur: "light",
  fond: "#eef7f5", texte: "#12302f", discret: "#3f5a58", accent: "#0b6a68", surface: "#ffffff", encre: "#0b4f4d",
  police: "font.dm-sans", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#12302f33",
});
const chezSoi = modeleV2({
  id: identifiantV2(497, "chez-soi-accompagne"), concept: "c-497-chez-soi-accompagne",
  name: "Chez soi, accompagné", family: FAM,
  description: "Pour un service d'aide à domicile : nom et coordonnées en tête, trois grandes cartes à angles droits (aide à domicile, repas et courses, sécurité) qui se soulèvent au survol, puis une bande turquoise (liens, horaires, lettre).",
  tags: ["aide à domicile", "maintien à domicile", "grille de cartes", "menthe", "turquoise", "cartes qui se soulèvent", "angles droits"],
  identity: turquoise, racine: racineDe("#0b4f4d"), widgets: W,
  compose(k, env, G) {
    const S = k.S, TURQ = "#0b6a68", PROF = "#0b4f4d", MENTHE = "#eef7f5";
    const nom = nomDuSite(k, env, 40, PROF, { fontWeight: "400" });
    const tete = G.bande(k, [G.colonne(k, [caps(k, "À votre service", { couleur: TURQ, suivi: "0.2em" }), nom, para(k, "Un accompagnement qui respecte vos habitudes, chez vous.", { taille: 18, couleur: "#3f5a58", max: "440px" })], { poids: 6, min: "300px", gap: "12px" }), G.colonne(k, [caps(k, "Nous appeler", { couleur: TURQ }), coordonnees(k, { taille: 18, couleur: "#12302f", lien: PROF, survol: TURQ, focus: TURQ })], { poids: 4, min: "260px", gap: "10px" })], { fond: MENTHE, aligne: "flex-end", gap: "28px 56px", padV: ["72px", "56px", "44px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Accueil" });
    const uneCarte = (num, titre, texte, url) => {
      const a = lien(k, titre, url, { taille: 24, poids: "400", police: S.head, couleur: PROF, survol: { color: "#b24a00" }, focus: TURQ, lh: 1.2 });
      const plus = lien(k, "En savoir plus →", url, { taille: 15, poids: "700", couleur: TURQ, soulign: true, survol: { color: "#b24a00", transform: { x: 6 } }, focus: TURQ });
      const lis = k.col([], { width: "8px", flexShrink: 0, alignSelf: "stretch", backgroundColor: TURQ, borderRadius: "0px" });
      const cont = k.col([caps(k, num, { couleur: TURQ, suivi: "0.16em" }), a, para(k, texte, { taille: 16, couleur: "#3f5a58", lh: 1.5 }), plus], { flexGrow: 1, flexBasis: "0px", minWidth: "0px", gap: "8px", paddingTop: "26px", paddingBottom: "22px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "0px" });
      const c = k.row([lis, cont], { flexGrow: 1, flexBasis: "0px", minWidth: "260px", flexWrap: "nowrap", gap: "0px", alignItems: "stretch", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#12302f33", borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { transform: { y: -6 }, borderColor: TURQ } };
      return c;
    };
    const cartes = G.bande(k, [uneCarte("01", "Aide à domicile", "Toilette, entretien du logement, aide au lever et au coucher.", "/contact"), uneCarte("02", "Repas et courses", "Préparation des repas, courses, accompagnement aux sorties.", "/contact"), uneCarte("03", "Sécurité à la maison", "Conseils et solutions pour rester en sécurité chez soi.", "/faq")], { fond: MENTHE, gap: "16px", aligne: "stretch", padV: ["16px", "16px", "8px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Services" });
    const rap = G.ligne(k, liste(k, RAPIDE, { couleur: "#ffffff", taille: 15, survol: { color: "#ffd9a8", transform: { y: -2 } }, focus: "#ffffff" }), { gap: "0px 24px", aligne: "center" });
    const hor = G.colonne(k, [k.row([souffle(carre(k, "#ffd9a8", "10px"), 3000), caps(k, "Horaires", { couleur: "#bfe6e3" })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 16, couleur: "#ffffff" })], { poids: 1, min: "240px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils pratiques et actualités du service.", bouton: "S'abonner", largeur: "100%", accent: "#ffd9a8", surBouton: PROF, texte: "#ffffff", couleurTitre: "#ffffff", fond: PROF, survolBouton: "#ffffff", survolTexte: PROF, focus: "#ffffff" });
    const bas = G.bande(k, [G.ligne(k, [G.colonne(k, [abo], { poids: 1.4, min: "280px" }), hor], { gap: "32px 64px", aligne: "flex-start", largeur: "100%" }), trait(k, "#ffffff40"), k.row([rap, MENTIONS(G, k, env, { couleur: "#d4ecea", liens: "#ffffff" })], { gap: "12px 40px", justifyContent: "space-between", alignItems: "center", width: "100%" })], { fond: PROF, couleur: "#ffffff", colonne: true, gap: "32px", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Contact" });
    return [G.racine(k, [tete, cartes, bas])];
  },
}, FAM);

// ═══ ft2-498 « Accueil de jour » — accueil de jour, soutien aux aidants, halte-répit ═════════════════════════════════════════════════════════
// Idée : prune profond MONOCHROME. Un grand appel (« Un proche à accompagner ? Parlons-en. ») avec bouton rose pâle, puis une DOUBLE RANGÉE de liens horizontale : étiquette à gauche, liens en ligne à droite
// (Pour les proches / Pour la structure), chaque lien soulignant d'un trait qui se dessine. Enfin coordonnées, horaires et mentions sur trois colonnes. Polices : Newsreader (titres) et Inter.
const prune = identite({
  key: "c498", label: "Prune profond et rose pâle", humeur: "dark",
  fond: "#2a1530", texte: "#f6eaf1", discret: "#d9bfd0", accent: "#f3b9d3", surface: "#38203f", encre: "#2a1530", surEncre: "#f6eaf1",
  police: "font.inter", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f6eaf133",
});
const accueilJour = modeleV2({
  id: identifiantV2(498, "accueil-de-jour"), concept: "c-498-accueil-de-jour",
  name: "Accueil de jour", family: FAM,
  description: "Pour un accueil de jour ou un soutien aux aidants : grand appel à contacter sur prune profond, double rangée de liens horizontale (proches, structure), puis trois colonnes (coordonnées, horaires, mentions). Calme et rassurant.",
  tags: ["accueil de jour", "aidants", "prune", "monochrome", "appel", "double rangée de liens", "angles droits"],
  identity: prune, racine: racineDe("#2a1530"), widgets: WS,
  compose(k, env, G) {
    const S = k.S, PRUNE = "#2a1530", ROSE = "#f3b9d3", CLAIR = "#f6eaf1";
    const phrase = G.geant(`<p>Un proche à accompagner ?<br>Parlons-en.</p>`, { taille: [36, 76], tablette: { taille: [48, 76] }, mobile: { taille: [34, 48] }, lh: 1.08, suivi: "-0.015em", poids: "500", police: S.head, couleur: CLAIR })(k, env);
    const btn = bouton(k, "Écrire à l'équipe", "/contact", { couleur: ROSE, plein: true, surPlein: PRUNE, survol: { backgroundColor: "#ffffff", color: PRUNE, transform: { y: -3 } }, focus: "#ffffff" });
    const appel = G.bande(k, [G.colonne(k, [caps(k, "Accueil", { couleur: ROSE, suivi: "0.22em" }), phrase], { poids: 8, min: "320px", gap: "16px" }), G.colonne(k, [para(k, "Un temps de répit pour les proches, un moment adapté pour la personne accueillie.", { taille: 17, couleur: "#d9bfd0", max: "360px" }), btn], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" })], { fond: PRUNE, aligne: "flex-end", gap: "28px 56px", padV: ["88px", "68px", "48px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const liens = (paires) => G.ligne(k, paires.map(([t, u]) => lien(k, t, u, { taille: 17, poids: "500", couleur: CLAIR, survol: { color: ROSE, backgroundColor: "#38203f" }, focus: ROSE, padH: "10px", extra: { borderBottomWidth: "0px" } })), { gap: "4px 14px", aligne: "center" });
    const rangee = (etiq, paires) => k.row([G.colonne(k, [caps(k, etiq, { couleur: ROSE, suivi: "0.18em" })], { poids: 3, min: "200px" }), G.colonne(k, [liens(paires)], { poids: 9, min: "280px" })], { gap: "12px 32px", alignItems: "center", width: "100%", paddingTop: "14px", paddingBottom: "14px", transitionDuration: DOUX });
    const rangees = G.bande(k, [trait(k, "#f6eaf14d"), rangee("Pour les proches", [["Questions fréquentes", "/faq"], ["Espace famille", "/connexion"], ["Créer un compte", "/inscription"]]), trait(k, "#f6eaf14d"), rangee("Pour la structure", [["Accueil", "/"], ["Actualités", "/blog"], ["Nous contacter", "/contact"], ["Cookies", "/cookies"]]), trait(k, "#f6eaf14d")], { fond: PRUNE, colonne: true, gap: "0px", padV: ["0px", "0px", "0px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    const coord = bloc(k, "Nous joindre", [coordonnees(k, { taille: 16, couleur: CLAIR, lien: "#ffffff", survol: ROSE, focus: ROSE })], { couleurTitre: ROSE, min: "240px", gap: "12px" });
    const hor = G.colonne(k, [k.row([souffle(carre(k, ROSE, "10px"), 3200), caps(k, "Horaires", { couleur: ROSE })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 16, couleur: CLAIR })], { poids: 1, min: "240px", gap: "12px" });
    const nom = nomDuSite(k, env, 26, "#ffffff", { fontWeight: "500" });
    const bas = G.bande(k, [G.ligne(k, [G.colonne(k, [nom, para(k, "Accueil, écoute et accompagnement.", { taille: 15, couleur: "#d9bfd0" })], { poids: 1, min: "240px", gap: "8px" }), coord, hor], { gap: "32px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), trait(k, "#f6eaf133"), MENTIONS(G, k, env, { couleur: "#d9bfd0", liens: "#ffffff" })], { fond: "#38203f", couleur: "#ffffff", colonne: true, gap: "32px", padV: ["56px", "48px", "40px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Contact" });
    return [G.racine(k, [appel, rangees, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Petite enfance et seniors", target: 5, built: true,
  description: "Pieds standard et très professionnels, à angles droits, sans illustration : bandeau de lettre, barre latérale à gros caractères, sommaire numéroté, cartes de services, double rangée de liens.",
  models: [premiersPas, maisonTilleuls, milleEtUnJours, chezSoi, accueilJour],
};
