// Famille v2 « Banques et mutuelles » — 5 modèles (ft2-454 à ft2-458), extension « standard pro animé » (angles droits, sans illustration).
// Pieds de banque de proximité, de mutuelle de santé, de banque privée, de caisse coopérative et de courtier en assurance : colonnes de liens par métier (comptes, épargne, crédits, assurances,
// garanties), espace client, coordonnées et horaires, lettre d'information, mentions. Aucun taux, chiffre, agrément ni numéro inventé : seules les « Données de l'entreprise » fournissent adresse,
// téléphone, e-mail et horaires. Marques fictives. Chaque modèle a son squelette, sa palette et ses polices (mode « solo »).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; cartes qui se soulèvent ; lignes dont le fond se remplit et dont le texte glisse ; filet qui change de
// couleur ; carré de statut qui « respire » ; flèches qui avancent. Aucune animation d'entrée, aucun défilement continu. ANGLES DROITS partout.
const { modeleV2, identifiantV2 } = require("../kit-v2");
const A = require("../aides-std-s03");
const { legalePile, MV, racineDe, lien, caps, texte, trait, court, souffle, carre, horaires, coordonnees, bloc, liensCol, abonnement, carteLien, ligneIndex, bouton, dernier, identite, GK } = A;

const FAM = "banques-mutuelles";
const PAD = ["48px", "32px", "20px"];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-454 « Guichet de proximité » — banque de proximité
// Idée : bande marine avec phrase en serif et trois raccourcis (ouvrir un compte, espace client, rendez-vous) dont la flèche avance au survol ; quatre cartes métiers (comptes, épargne, crédits, assurances)
// qui se soulèvent ; bande claire : coordonnées, horaires, aide et lettre. Polices : Source Serif 4 (titres) et Source Sans 3.
const guichet = identite({ key: "s454", label: "Marine et bleu vif", humeur: "light", fond: "#ffffff", texte: "#0b2a55", discret: "#4a5b73", accent: "#1259c3", surface: "#eef3fa", encre: "#0b2a55", police: "font.source-sans-3", titres: "font.source-serif-4", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0b2a5533" });
const guichetModele = modeleV2({
  id: identifiantV2(454, "guichet-de-proximite"), concept: "c-454-guichet-de-proximite", name: "Guichet de proximité", family: FAM,
  description: "Pour une banque de proximité : phrase en serif sur marine avec trois raccourcis à flèche, quatre cartes métiers qui se soulèvent, puis coordonnées, horaires, aide et lettre. Rassurant, net, angles droits.",
  tags: ["banque", "proximité", "marine", "bleu", "cartes", "raccourcis", "angles droits"],
  identity: guichet, racine: racineDe("#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NAVY = "#0b2a55", CIEL = "#a9c8f5", BLEU = "#1259c3";
    const phrase = G.geant(`<p>Une banque<br>à votre mesure.</p>`, { taille: [44, 104], tablette: { taille: [64, 92] }, mobile: { taille: [44, 64] }, lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const gauche = G.colonne(k, [caps(k, "Banque de proximité", { couleur: CIEL, suivi: "0.22em" }), phrase], { poids: 6, min: "300px", gap: "20px" });
    const raccourci = (t, u) => lien(k, `${t}   →`, u, { taille: 18, poids: "700", couleur: "#ffffff", h: "64px", survol: { color: CIEL, paddingLeft: "14px", backgroundColor: "#12356b" }, focus: CIEL, extra: { display: "flex", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff40", paddingRight: "8px" } });
    const droite = G.colonne(k, [raccourci("Ouvrir un compte", "/inscription"), raccourci("Accéder à mon espace client", "/connexion"), raccourci("Prendre rendez-vous", "/contact")], { poids: 5, min: "290px", gap: "0px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: NAVY, gap: "40px 72px", aligne: "flex-end", padV: ["88px", "72px", "52px"], padB: ["56px", "48px", "36px"], padH: PAD, nom: "Accroche" });
    const cs = (num, titre, sous, url) => carteLien(k, { num, titre, sous, url, couleur: NAVY, accent: BLEU, contour: "#0b2a5533", fond: "#ffffff", fondSurvol: "#ffffff", couleurSous: "#4a5b73" });
    const cartes = G.ligne(k, [cs("01", "Comptes", "Compte courant, carte, moyens de paiement.", "/catalogue"), cs("02", "Épargne", "Livrets et placements pour vos projets.", "/catalogue"), cs("03", "Crédits", "Projets, travaux, immobilier.", "/catalogue"), cs("04", "Assurances", "Habitation, auto, prévoyance.", "/catalogue")], { gap: "20px", aligne: "stretch", largeur: "100%" });
    const bandeCartes = G.bande(k, [cartes], { fond: "#eef3fa", colonne: true, padV: ["56px", "48px", "36px"], padB: ["56px", "48px", "36px"], padH: PAD, nom: "Métiers" });
    const duo = G.ligne(k, [bloc(k, "Nous contacter", [coordonnees(k, { taille: 15, lien: NAVY, survol: BLEU, focus: BLEU })], { couleurTitre: BLEU, poids: 1.2, gap: "12px" }), bloc(k, "Horaires d'ouverture", [horaires(k, { taille: 15 })], { couleurTitre: BLEU, poids: 0.9, gap: "12px" })], { gap: "32px 40px", aligne: "flex-start", largeur: "100%" });
    const gauche2 = G.colonne(k, [caps(k, "Votre agence", { couleur: NAVY, suivi: "0.22em" }), court(k, BLEU, "4px", "48px"), duo], { poids: 3, min: "300px", gap: "18px" });
    const abo = abonnement(k, env, { titre: "Lettre d'information", intro: "Les nouveautés de votre agence, sans excès.", bouton: "S'abonner", largeur: "360px", accent: BLEU, texte: NAVY, couleurTitre: BLEU, couleurIntro: "#4a5b73", survolBouton: NAVY, survolTexte: "#ffffff", surBouton: "#ffffff" });
    const aideLiens = G.ligne(k, liensCol(k, [["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Actualités", "/blog"]], { accent: BLEU, taille: 14, poids: "600" }), { gap: "0px 24px", aligne: "flex-start", largeur: "100%" });
    const droite2 = G.colonne(k, [abo, aideLiens], { poids: 2, min: "280px", gap: "10px" });
    const agence = G.bande(k, [gauche2, droite2], { fond: "#ffffff", gap: "40px 64px", aligne: "flex-start", padV: ["56px", "48px", "36px"], padB: ["40px", "36px", "28px"], padH: PAD, nom: "Agence" });
    const mentions = legalePile(k, env, G);
    const bas = G.bande(k, [mentions], { fond: "#ffffff", colonne: true, padV: ["16px", "16px", "12px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: "#0b2a5533" }, nom: "Mentions" });
    return [G.racine(k, [haut, bandeCartes, agence, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-455 « Livret mutualiste » — mutuelle de santé
// Idée : DEUX VOLETS. À gauche un volet vert profond (nom en grand, phrase, coordonnées et horaires, carré de statut qui respire) ; à droite, sur crème, trois colonnes de liens (Adhérents, Garanties, Mutuelle)
// puis une carte blanche « Lettre des adhérents ». Polices : Fraunces (titres) et Nunito Sans.
const livret = identite({ key: "s455", label: "Vert profond et crème", humeur: "light", fond: "#f7f1e4", texte: "#12302a", discret: "#4c5f58", accent: "#a8461a", surface: "#ffffff", encre: "#12302a", police: "font.nunito-sans", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#12302a33" });
const livretModele = modeleV2({
  id: identifiantV2(455, "livret-mutualiste"), concept: "c-455-livret-mutualiste", name: "Livret mutualiste", family: FAM,
  description: "Pour une mutuelle de santé : volet vert profond avec phrase, coordonnées et horaires, trois colonnes de liens sur crème et carte « lettre des adhérents ». Chaleureux, clair, angles droits.",
  tags: ["mutuelle", "santé", "vert", "crème", "deux volets", "adhérents", "angles droits"],
  identity: livret, racine: racineDe("#f7f1e4"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, VERT = "#12302a", MENTHE = "#bfe3cf", CREME = "#f7f1e4", BRIQUE = "#a8461a";
    const statut = souffle(carre(k, MENTHE, "12px"), 3400);
    const phrase = G.geant(`<p>La santé<br>se partage.</p>`, { taille: [40, 76], tablette: { taille: [56, 72] }, mobile: { taille: [40, 56] }, lh: 1.04, suivi: "-0.02em", poids: "500", police: S.head, couleur: "#ffffff" })(k, env);
    const grosLien = (t, u) => lien(k, `${t}   →`, u, { taille: 19, poids: "700", police: S.head, couleur: "#ffffff", h: "56px", survol: { color: MENTHE, paddingLeft: "12px" }, focus: MENTHE, extra: { display: "flex", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff40" } });
    const volet = k.col([k.row([statut, caps(k, "Mutuelle de santé", { couleur: MENTHE, suivi: "0.2em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), phrase, court(k, MENTHE), k.col([grosLien("Espace adhérent", "/connexion"), grosLien("Rejoindre la mutuelle", "/inscription"), grosLien("Nous écrire", "/contact")], { gap: "0px", width: "100%" })],
      { backgroundColor: VERT, flexGrow: 4, flexBasis: "0px", minWidth: "320px", gap: "26px", paddingTop: "88px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "48px", alignItems: "flex-start", borderRadius: "0px" },
      { paddingTop: "64px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const cellule = (t, enfant, P) => k.col([caps(k, t, { couleur: BRIQUE }), enfant], { flexGrow: P, flexBasis: "0px", minWidth: "220px", gap: "12px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#12302a33", borderRadius: "0px" });
    const cellules = G.ligne(k, [cellule("Nous joindre", coordonnees(k, { taille: 15, lien: VERT, survol: BRIQUE, focus: BRIQUE }), 1.2), cellule("Accueil et agences", horaires(k, { taille: 15 }), 0.9)], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const grille = G.ligne(k, liensCol(k, [["Nos formules", "/catalogue"], ["Santé et soins", "/blog"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]], { taille: 15, poids: "700", accent: BRIQUE, couleur: VERT }), { gap: "0px 28px", aligne: "flex-start", largeur: "100%" });
    const abo = abonnement(k, env, { titre: "Lettre des adhérents", intro: "Conseils santé et informations pratiques, une fois par mois au plus.", bouton: "S'abonner", largeur: "420px", accent: BRIQUE, texte: VERT, couleurTitre: BRIQUE, couleurIntro: "#4c5f58", survolBouton: VERT, survolTexte: "#ffffff", surBouton: "#ffffff", fondChamp: "#ffffff" });
    const carteAbo = k.col([abo], { backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#12302a33", borderRadius: "0px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", width: "100%" });
    const droite = k.col([cellules, carteAbo, grille], { backgroundColor: CREME, flexGrow: 6, flexBasis: "0px", minWidth: "320px", gap: "40px", paddingTop: "88px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "48px", borderRadius: "0px" }, { paddingTop: "56px", paddingBottom: "44px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const deux = G.bande(k, [volet, droite], { fond: VERT, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Deux volets" });
    const mentions = A.legalePile(k, env, G, { couleur: "#cfe3d9", liens: "#ffffff" });
    const bas = dernier(G.bande(k, [mentions], { fond: VERT, colonne: true, gap: "0px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Mentions" }), "#ffffff");
    return [G.racine(k, [deux, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-456 « Coffre de nuit » — banque privée et gestion de patrimoine
// Idée : noir profond, filets d'or. Sommaire en cinq grandes lignes numérotées I à V (Patrimoine, Épargne, Transmission, Immobilier, Conseil) dont le fond s'éclaire et le texte glisse au survol, à gauche ;
// à droite, rendez-vous, coordonnées, horaires et lettre. Polices : Cormorant Garamond (titres) et Hanken Grotesk.
const coffre = identite({ key: "s456", label: "Noir et or", humeur: "dark", fond: "#0c0c0f", texte: "#f2ede2", discret: "#b3ab9c", accent: "#d2ad63", surface: "#17171c", encre: "#0c0c0f", surEncre: "#f2ede2", police: "font.hanken-grotesk", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f2ede230" });
const coffreModele = modeleV2({
  id: identifiantV2(456, "coffre-de-nuit"), concept: "c-456-coffre-de-nuit", name: "Coffre de nuit", family: FAM,
  description: "Pour une banque privée ou un cabinet de gestion de patrimoine : cinq grandes lignes numérotées I à V sur noir et or qui s'éclairent au survol, rendez-vous, coordonnées, horaires et lettre. Discret, rigoureux.",
  tags: ["banque privée", "patrimoine", "noir", "or", "sommaire numéroté", "sombre", "angles droits"],
  identity: coffre, racine: racineDe("#0c0c0f"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#0c0c0f", OR = "#d2ad63", IVOIRE = "#f2ede2";
    const sur = k.row([caps(k, "Banque privée", { couleur: OR, suivi: "0.26em" }), k.divider({ width: "100%", borderColor: "#f2ede230", borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" })], { gap: "20px", alignItems: "center", flexWrap: "nowrap", width: "100%" });
    const bandeSur = G.bande(k, [sur], { fond: NOIR, colonne: true, padV: ["56px", "44px", "32px"], padB: ["8px", "8px", "8px"], padH: PAD, nom: "Filet" });
    const idx = (n, t, u) => ligneIndex(k, n, t, u, { police: S.head, couleur: IVOIRE, filet: "#f2ede230", fondSurvol: "#17171c", couleurSurvol: OR, focus: OR, taille: "fluid:28-52", poids: "500", h: "76px" });
    const sommaire = G.colonne(k, [idx("I", "Patrimoine", "/catalogue"), idx("II", "Épargne", "/catalogue"), idx("III", "Transmission", "/blog"), idx("IV", "Immobilier", "/catalogue"), idx("V", "Conseil", "/contact")], { poids: 7, min: "300px", gap: "0px" });
    const rdv = bouton(k, "Demander un rendez-vous", "/contact", { couleur: NOIR, fond: OR, survolFond: IVOIRE, survolCouleur: NOIR });
    const chap = texte(k, "Un interlocuteur dédié, un entretien pour définir vos objectifs. Nous revenons vers vous rapidement.", { taille: 16, couleur: S.mute, largeur: "420px" });
    const cCoo = bloc(k, "Nous joindre", [coordonnees(k, { taille: 15, lien: IVOIRE, survol: OR, focus: OR })], { couleurTitre: OR, gap: "12px", min: "200px" });
    const cHor = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: OR, gap: "12px", min: "200px" });
    const droite = G.colonne(k, [chap, rdv, G.ligne(k, [cCoo, cHor], { gap: "28px 36px", aligne: "flex-start", largeur: "100%" })], { poids: 5, min: "290px", gap: "28px" });
    const corps = G.bande(k, [sommaire, droite], { fond: NOIR, gap: "40px 80px", aligne: "flex-start", padV: ["16px", "12px", "8px"], padB: ["56px", "48px", "40px"], padH: PAD, nom: "Sommaire" });
    const abo = abonnement(k, env, { titre: "Lettre privée", intro: "Une analyse patrimoniale, quelques fois par an.", bouton: "S'abonner", largeur: "380px", accent: OR, texte: IVOIRE, couleurTitre: OR, couleurIntro: "#b3ab9c", survolBouton: IVOIRE, survolTexte: NOIR, surBouton: NOIR });
    const liensBas = G.ligne(k, liensCol(k, [["Espace client", "/connexion"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]], { taille: 15, accent: OR }), { gap: "4px 28px", aligne: "center" });
    const mentions = A.legale(k, env, G, { taille: 13, sansCookies: true, couleur: "#b3ab9c", liens: IVOIRE });
    const bas = dernier(G.bande(k, [G.ligne(k, [abo, liensBas], { gap: "32px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" }), trait(k, "#f2ede230"), mentions], { fond: NOIR, colonne: true, gap: "36px", padV: ["40px", "36px", "32px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: "#f2ede230" }, innerMobile: { rowGap: "24px" }, nom: "Lettre" }), IVOIRE);
    return [G.racine(k, [bandeSur, corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-457 « Caisse régionale » — banque coopérative
// Idée : lettre d'information EN TÊTE (bandeau brique : phrase et formulaire côte à côte), puis quatre colonnes de liens sur crème (Particuliers, Professionnels, Associations, Aide) à filet qui rougit au survol,
// puis une barre « Besoin d'aide ? » en trois cellules (horaires, coordonnées, questions fréquentes). Polices : Zilla Slab (titres) et Libre Franklin.
const caisse = identite({ key: "s457", label: "Brique et crème", humeur: "light", fond: "#fbf6ee", texte: "#2b1a17", discret: "#6a5651", accent: "#9b2b24", surface: "#ffffff", encre: "#2b1a17", police: "font.libre-franklin", titres: "font.zilla-slab", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2b1a1733" });
const caisseModele = modeleV2({
  id: identifiantV2(457, "caisse-regionale"), concept: "c-457-caisse-regionale", name: "Caisse régionale", family: FAM,
  description: "Pour une banque coopérative : bandeau brique avec la lettre d'information en tête, quatre colonnes de liens par public sur crème, barre « besoin d'aide » en trois cellules. Ancré, lisible, angles droits.",
  tags: ["coopérative", "banque", "brique", "crème", "lettre en tête", "colonnes", "angles droits"],
  identity: caisse, racine: racineDe("#fbf6ee"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BRIQUE = "#9b2b24", CREME = "#fbf6ee", ENCRE = "#2b1a17";
    const titre = G.geant(`<p>Restons<br>en contact.</p>`, { taille: [38, 72], tablette: { taille: [52, 68] }, mobile: { taille: [38, 52] }, lh: 1.05, suivi: "-0.01em", poids: "700", police: S.head, couleur: "#ffffff" })(k, env);
    const gauche = G.colonne(k, [caps(k, "Lettre d'information", { couleur: "#ffd9d3", suivi: "0.22em" }), titre], { poids: 5, min: "280px", gap: "16px" });
    const abo = abonnement(k, env, { titre: "", intro: "Actualités de la caisse et conseils pratiques, une fois par mois au plus.", bouton: "S'abonner", largeur: "460px", accent: "#ffffff", texte: "#ffffff", couleurIntro: "#ffe9e5", survolBouton: ENCRE, survolTexte: "#ffffff", surBouton: BRIQUE, soulignement: "2px" });
    const droite = G.colonne(k, [abo], { poids: 6, min: "300px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: BRIQUE, gap: "36px 72px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["64px", "48px", "40px"], padH: PAD, nom: "Lettre" });
    const col = (t, l) => bloc(k, t, liensCol(k, l, { taille: 16, poids: "500", accent: BRIQUE }), { couleurTitre: BRIQUE, min: "180px", extra: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: ENCRE, paddingTop: "16px", transitionDuration: MV } });
    const colonnes = G.ligne(k, [col("Particuliers", [["Comptes et cartes", "/catalogue"], ["Épargne", "/catalogue"], ["Crédits", "/catalogue"], ["Assurances", "/catalogue"]]), col("Professionnels", [["Compte professionnel", "/catalogue"], ["Financer son activité", "/catalogue"], ["Prendre rendez-vous", "/contact"]]), col("Associations", [["Compte association", "/catalogue"], ["Nous écrire", "/contact"]]), col("Aide", [["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Actualités", "/blog"]])], { gap: "32px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const corps = G.bande(k, [colonnes], { fond: CREME, colonne: true, padV: ["64px", "52px", "40px"], padB: ["56px", "44px", "36px"], padH: PAD, nom: "Liens" });
    const cell = (t, enfants, fond) => k.col([caps(k, t, { couleur: BRIQUE }), ...enfants], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "12px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: fond, borderRadius: "0px", borderStyle: "solid", borderWidth: "1px", borderColor: "#2b1a1733" });
    const aide = G.ligne(k, [cell("Horaires", [horaires(k, { taille: 15 })], "#ffffff"), cell("Coordonnées", [coordonnees(k, { taille: 15, lien: ENCRE, survol: BRIQUE, focus: BRIQUE })], "#ffffff"), cell("Besoin d'aide ?", [texte(k, "Consultez les réponses aux questions les plus courantes ou écrivez-nous.", { taille: 15 }), lien(k, "Questions fréquentes   →", "/faq", { taille: 16, poids: "700", couleur: BRIQUE, survol: { color: ENCRE, transform: { x: 6 } }, focus: BRIQUE })], "#f3e6d4")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const mentions = A.legale(k, env, G, { taille: 13, sansCookies: true });
    const bas = G.bande(k, [aide, mentions], { fond: CREME, colonne: true, gap: "32px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PAD, innerMobile: { rowGap: "24px" }, nom: "Aide" });
    return [G.racine(k, [haut, corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-458 « Courtage clair » — courtier en assurance et en crédit
// Idée : une DOUBLE RANGÉE de liens en tête (grands : Santé, Auto, Habitation, Prévoyance, Épargne ; petits : conseils et aide), puis un bandeau d'appel plein sarcelle « Comparer, puis décider » avec bouton,
// puis coordonnées, horaires, lettre et mentions sur gris clair. Polices : DM Serif Display (titres) et DM Sans.
const courtage = identite({ key: "s458", label: "Sarcelle et gris clair", humeur: "light", fond: "#f1f5f4", texte: "#0e2f33", discret: "#486063", accent: "#0b6a70", surface: "#ffffff", encre: "#0e2f33", police: "font.dm-sans", titres: "font.dm-serif-display", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0e2f3333" });
const courtageModele = modeleV2({
  id: identifiantV2(458, "courtage-clair"), concept: "c-458-courtage-clair", name: "Courtage clair", family: FAM,
  description: "Pour un courtier en assurance ou en crédit : double rangée de liens (assurances en grand, aide en petit), bandeau d'appel sarcelle « comparer, puis décider », coordonnées, horaires et lettre. Direct, lisible.",
  tags: ["courtage", "assurance", "crédit", "sarcelle", "double rangée", "bandeau d'appel", "angles droits"],
  identity: courtage, racine: racineDe("#f1f5f4"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, SARCELLE = "#0b6a70", PROFOND = "#0a4a50", ENCRE = "#0e2f33", MENTHE = "#bfe9e6";
    const grand = (t, u) => lien(k, t, u, { taille: 26, poids: "400", police: S.head, couleur: ENCRE, survol: { color: SARCELLE, transform: { y: -3 } }, focus: SARCELLE, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "3px", borderColor: "#0e2f3333" } });
    const rang1 = G.ligne(k, ["Santé", "Auto", "Habitation", "Prévoyance", "Épargne"].map((t) => grand(t, "/catalogue")), { gap: "6px 40px", aligne: "center", largeur: "100%" });
    const rang2 = G.ligne(k, liensCol(k, [["Comparer les offres", "/catalogue"], ["Conseils et dossiers", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Nous contacter", "/contact"]], { taille: 14, poids: "600", accent: SARCELLE }), { gap: "2px 28px", aligne: "center", largeur: "100%" });
    const haut = G.bande(k, [caps(k, "Courtier en assurance et en crédit", { couleur: SARCELLE, suivi: "0.22em" }), rang1, trait(k, "#0e2f3333"), rang2], { fond: "#f1f5f4", colonne: true, gap: "20px", padV: ["72px", "56px", "40px"], padB: ["40px", "36px", "28px"], padH: PAD, nom: "Double rangée" });
    const phrase = G.geant(`<p>Comparer,<br>puis décider.</p>`, { taille: [44, 96], tablette: { taille: [60, 84] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.015em", poids: "400", police: S.head, couleur: "#ffffff" })(k, env);
    const intro = texte(k, "Dites-nous ce que vous souhaitez protéger ou à financer : nous comparons pour vous et vous répondons clairement.", { taille: 17, couleur: MENTHE, largeur: "420px" });
    const bt = bouton(k, "Demander une étude", "/contact", { couleur: PROFOND, fond: "#ffffff", survolFond: MENTHE, survolCouleur: PROFOND });
    const appel = G.bande(k, [G.colonne(k, [phrase], { poids: 6, min: "300px" }), G.colonne(k, [intro, bt], { poids: 5, min: "280px", gap: "24px", soi: "flex-end" })], { fond: PROFOND, gap: "36px 72px", aligne: "flex-end", padV: ["80px", "64px", "48px"], padB: ["72px", "56px", "44px"], padH: PAD, nom: "Appel" });
    const c1 = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: ENCRE, survol: SARCELLE, focus: SARCELLE })], { couleurTitre: SARCELLE, gap: "12px", poids: 1.1 });
    const c2 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: SARCELLE, gap: "12px", poids: 1.1 });
    const abo = abonnement(k, env, { titre: "Lettre du courtier", intro: "Nos conseils pour comparer sereinement.", bouton: "S'abonner", largeur: "360px", accent: SARCELLE, texte: ENCRE, couleurTitre: SARCELLE, couleurIntro: "#486063", survolBouton: ENCRE, survolTexte: "#ffffff", surBouton: "#ffffff" });
    const grille = G.ligne(k, [c1, c2, G.colonne(k, [abo], { poids: 1.5, min: "260px" })], { gap: "36px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = A.legale(k, env, G, { taille: 13, sansCookies: true });
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: "#f1f5f4", colonne: true, gap: "36px", padV: ["56px", "48px", "36px"], padB: ["28px", "24px", "20px"], padH: PAD, innerMobile: { rowGap: "28px" }, nom: "Cabinet" });
    return [G.racine(k, [haut, appel, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Banques et mutuelles", target: 5, built: true,
  description: "Pieds standard pros et animés, angles droits, sans illustration : banque de proximité, mutuelle, banque privée, caisse coopérative et courtier en assurance.",
  models: [guichetModele, livretModele, coffreModele, caisseModele, courtageModele],
};
