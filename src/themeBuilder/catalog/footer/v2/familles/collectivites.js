// Famille v2 « Collectivités et services publics » — 6 modèles (ft2-386 à ft2-391), famille « inspirée de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Passe « ILLUSTRATION » : chaque pied reprend le parti pris visuel d'UNE capture et porte un vrai dessin (SVG inline en formes pleines, voir ../aides-illus-collsante.js) :
//  - capture « KENNEDY » (nom monumental pleine largeur sous deux colonnes de liens) : ft2-386 (façade de mairie dessinée), ft2-391 (médaillon d'or) ;
//  - capture « YMGrad » (bloc de marque + pastilles de réseaux à gauche, colonnes de liens en capitales) : ft2-387 (trois rivières), ft2-390 (plan de la ville) ;
//  - capture « Bruno » (grande phrase + boutons, marque fantôme tracée, colonnes, lueur d'angle à étincelles) : ft2-388 (fontaine, marches fantômes), ft2-389 (rangée de vignettes).
// Marques et communes FICTIVES ; AUCUNE coordonnée, horaire ni chiffre inventé : horaires, adresse et téléphone viennent des Données de l'entreprise (widgets « bizhours » / « bizcontact »).
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré / médaillon / bouton qui « respire ») ; pas d'animation d'entrée.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const I = require("../aides-illus-collsante");

const PH = I.PH;
const RS = [["Fb", "https://www.facebook.com/"], ["Ig", "https://www.instagram.com/"], ["Yt", "https://www.youtube.com/"]];
const FAM = "collectivites";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-386 « Façade de mairie » — capture « KENNEDY » : filet, mention discrète à gauche, deux colonnes de liens à droite, NOM MONUMENTAL pleine largeur en bas. Ici : la façade de la mairie dessinée occupe la place vide à gauche.
const facadeId = identite({
  key: "c386", label: "Papier chaud et bleu de Prusse", humeur: "light",
  fond: "#f4f0e6", texte: "#10264f", discret: "#50473a", accent: "#a8400c", surface: "#e9e2d2", encre: "#10264f", surEncre: "#f4f0e6",
  police: "font.source-sans-3", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#10264f40",
});
const facadeMairie = modeleV2({
  id: identifiantV2(386, "facade-de-mairie"), concept: "c-386-facade-de-mairie",
  name: "Façade de mairie", family: FAM,
  description: "Pour une commune : la façade de la mairie dessinée (fronton, colonnes, drapeau) à gauche, deux colonnes de liens à droite, puis le nom de la commune en capitales monumentales pleines largeur posé sur une barre terracotta. Papier chaud et bleu de Prusse.",
  tags: ["mairie", "commune", "nom monumental", "illustration", "façade", "papier", "bleu", "terracotta", "angles droits"],
  identity: facadeId,
  racine: { desktop: { backgroundColor: "#e9e2d2", gap: "0px" } },
  widgets: ["html", "text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), NAVY = "#10264f", TERRA = "#a8400c";
    const sceau = o.souffle(o.carre(TERRA, "12px"), 3600);
    const credit = k.row([sceau, o.caps("Commune de Valclair · site officiel", { couleur: NAVY, suivi: "0.16em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const dessin = I.unique(k, I.facade(), "380 40 840 320", { maxWidth: "620px" });
    const gauche = G.colonne(k, [credit, o.texte("Les services de la commune, de l'état civil à l'urbanisme, au même endroit.", { couleur: S.mute, largeur: "380px" }), dessin], { poids: 1.4, min: "280px", gap: "20px", base: "320px" });
    const c1 = o.colLiens("Démarches", [["État civil", "/faq"], ["Urbanisme", "/faq"], ["Élections", "/blog"], ["Déchets", "/faq"]], { titre: NAVY, couleur: S.mute, survol: TERRA });
    const c2 = o.colLiens("Vie locale", [["Agenda", "/blog"], ["Actualités", "/blog"], ["Associations", "/blog"], ["Contacter la mairie", "/contact"]], { titre: NAVY, couleur: S.mute, survol: TERRA });
    const droite = G.ligne(k, [c1, c2], { gap: "24px 48px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" });
    const droiteCol = G.colonne(k, [droite], { poids: 1, min: "280px", gap: "0px", base: "320px" });
    const haut = G.bande(k, [o.trait(NAVY, "1px"), G.ligne(k, [gauche, droiteCol], { gap: "32px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { fond: "#f4f0e6", colonne: true, gap: "28px", max: "1280px", padV: ["40px", "36px", "28px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Façade et liens" });
    const nom = G.geant(`<p>VALCLAIR</p>`, { taille: [44, 200], lh: 0.82, suivi: "-0.02em", poids: "800", police: S.head, couleur: NAVY })(k, env);
    const grand = G.bande(k, [nom], { fond: "#f4f0e6", colonne: true, padV: ["0px", "0px", "0px"], padB: ["12px", "10px", "8px"], padH: ["32px", "24px", "16px"], max: "100%", nom: "Nom monumental" });
    const barre = G.bande(k, [], { fond: TERRA, padV: ["10px", "9px", "8px"], padB: ["10px", "9px", "8px"], padH: ["0px", "0px", "0px"], nom: "Barre" });
    const bas = G.bande(k, [o.mentions({ couleur: S.mute, liens: NAVY })], { fond: "#e9e2d2", colonne: true, padV: ["24px", "22px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, grand, barre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-387 « Guichet latéral » — capture « YMGrad » : fond sombre, bloc de marque jaune + pastilles de réseaux + mention à gauche, grandes colonnes de liens en capitales à droite, lien souligné jaune, bouton de retour en haut.
// Ici : le relief des trois rivières dessiné sous la marque.
const guichetId = identite({
  key: "c387", label: "Vert sapin, jaune et crème", humeur: "dark",
  fond: "#0c3b2e", texte: "#f3f6f1", discret: "#b9cfc4", accent: "#ffc21a", surface: "#13503f", encre: "#0c3b2e", surEncre: "#f3f6f1",
  police: "font.work-sans", titres: "font.zilla-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f3f6f140",
});
const guichetLateral = modeleV2({
  id: identifiantV2(387, "guichet-lateral"), concept: "c-387-guichet-lateral",
  name: "Guichet latéral", family: FAM,
  description: "Pour une communauté de communes : à gauche le bloc de marque jaune, les réseaux en pastilles et le relief des trois rivières dessiné ; à droite trois colonnes de démarches en capitales, horaires, contact et lien souligné. Vert sapin, jaune et crème.",
  tags: ["communauté de communes", "colonne latérale", "illustration", "rivières", "démarches", "horaires", "vert", "jaune", "angles droits"],
  identity: guichetId,
  racine: { desktop: { backgroundColor: "#0c3b2e", gap: "0px" } },
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), SAPIN = "#0c3b2e", JAUNE = "#ffc21a";
    const marque = I.unique(k, I.rivieres(), "0 0 340 270", { maxWidth: "340px" });
    const logo = o.souffle(o.logo("3R", "Trois<br>Rivières", { fond: JAUNE, encre: SAPIN, couleur: S.fg, italique: true }), 3400);
    const gauche = G.colonne(k, [logo, o.pastilles(RS, { couleur: S.fg, fond: "#13503f", survolFond: JAUNE, survolCouleur: SAPIN }), marque, o.texte("© Communauté de communes des Trois Rivières", { taille: 13, couleur: S.mute })], { poids: 0, base: "340px", min: "280px", gap: "24px", extra: { backgroundColor: "#0a3226", paddingTop: "64px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "40px", boxSizing: "border-box" }, tablette: { paddingLeft: "32px" }, mobile: { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px", flexBasis: "100%" } });
    const cols = G.ligne(k, [
      o.colLiens("Démarches", [["État civil", "/faq"], ["Urbanisme", "/faq"], ["Élections", "/blog"], ["Aides et solidarité", "/faq"], ["Déchets", "/faq"]], { survol: JAUNE, min: "170px" }),
      o.colLiens("Services", [["Écoles et jeunesse", "/blog"], ["Transports", "/faq"], ["Culture et sports", "/blog"], ["Eau et assainissement", "/faq"], ["Emploi", "/blog"]], { survol: JAUNE, min: "170px" }),
      o.colLiens("Territoire", [["Actualités", "/blog"], ["Agenda", "/blog"], ["Les communes", "/faq"], ["Contact", "/contact"]], { survol: JAUNE, min: "170px" }),
    ], { gap: "24px 40px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" });
    const voir = o.lien("Voir toutes les démarches", "/faq", { taille: 16, poids: "600", couleur: JAUNE, soulign: true, survol: { color: "#ffffff" }, focus: JAUNE });
    const infos = k.row([G.colonne(k, [o.caps("Accueil du public", { couleur: JAUNE }), o.horaires({ couleur: S.fg })], { poids: 1, min: "230px", gap: "10px" }), G.colonne(k, [o.caps("Nous contacter", { couleur: JAUNE }), o.coordonnees({ couleur: S.fg, lien: S.fg, survol: JAUNE, focus: JAUNE })], { poids: 1, min: "230px", gap: "10px" })], { rowGap: "24px", columnGap: "48px", alignItems: "flex-start", width: "100%" });
    const droite = G.colonne(k, [cols, voir, o.trait("#f3f6f140"), infos, k.row([o.haut(S.fg, SAPIN)], { justifyContent: "flex-end", width: "100%" })], { poids: 1, base: "0px", min: "420px", gap: "32px", aligne: "stretch", extra: { backgroundColor: SAPIN, paddingTop: "64px", paddingBottom: "48px", paddingLeft: "56px", paddingRight: "48px", boxSizing: "border-box" }, tablette: { paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingTop: "40px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px", flexBasis: "100%", minWidth: "0px" } });
    const corps = G.bande(k, [gauche, droite], { fond: SAPIN, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Marque et colonnes" });
    const bas = G.bande(k, [o.mentions({ couleur: S.mute, liens: S.fg })], { fond: SAPIN, colonne: true, padV: ["24px", "22px", "20px"], padB: ["24px", "22px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-388 « Démarche en ligne » — capture « Bruno » : fond noir, grande phrase serif centrée + deux boutons, marches fantômes sur les côtés, marque fantôme géante sous un filet, colonnes, lueur d'angle à étincelles.
// Ici : marche de la ville en filigrane, marque FONTELUNE tracée, fontaine ambre dans sa lueur.
const demarcheId = identite({
  key: "c388", label: "Bleu nuit et ambre", humeur: "dark",
  fond: "#0a1b33", texte: "#f2f5fa", discret: "#aebbd0", accent: "#ffb81c", surface: "#12294a", encre: "#0a1b33", surEncre: "#f2f5fa",
  police: "font.public-sans", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f2f5fa33",
});
const demarcheEnLigne = modeleV2({
  id: identifiantV2(388, "demarche-en-ligne"), concept: "c-388-demarche-en-ligne",
  name: "Démarche en ligne", family: FAM,
  description: "Pour une ville : grande phrase centrée et deux boutons entre des marches fantômes, marque Fontelune tracée en filigrane, cinq colonnes de liens et une fontaine ambre dans sa lueur. Bleu nuit et ambre.",
  tags: ["ville", "démarches en ligne", "grande phrase", "fontaine", "marque tracée", "bleu nuit", "ambre", "serif", "angles droits"],
  identity: demarcheId,
  racine: { desktop: { backgroundColor: "#0a1b33", gap: "0px" } },
  widgets: ["html", "text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), AMBRE = "#ffb81c", NUIT = "#0a1b33";
    const phrase = G.geant(`<p>Une démarche à faire&nbsp;?<br>Commencez en ligne.</p>`, { taille: [34, 84], tablette: { taille: [48, 72] }, mobile: { taille: [34, 48] }, lh: 1.04, suivi: "-0.01em", poids: "400", police: S.head, couleur: S.fg, align: "center" })(k, env, true);
    const b1 = o.souffle(o.bouton("Mes démarches", "/connexion", { texte: NUIT, fond: AMBRE, bord: AMBRE, survol: { backgroundColor: "#ffffff", color: NUIT, borderColor: "#ffffff", transform: { y: -3 } }, focus: "#ffffff" }), 4000);
    const b2 = o.bouton("Prendre rendez-vous", "/contact", { texte: S.fg, fond: "#12294a", bord: "#12294a", survol: { backgroundColor: AMBRE, color: NUIT, borderColor: AMBRE, transform: { y: -3 } }, focus: AMBRE });
    const appel = I.surFond(G.bande(k, [phrase, G.ligne(k, [b1, b2], { gap: "12px", justifie: "center", largeur: "100%" })], { fond: NUIT, colonne: true, gap: "36px", aligne: "stretch", padV: ["104px", "80px", "56px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Appel" }), [I.calque(I.plein("0 0 1700 520", I.marchesFantomes("#12294a", 1), "xMidYMin slice"), { masque: ["mobile"] })]);
    const m = I.mot("FONTELUNE", { couleur: "#17305a", trait: 1.5 });
    const marque = G.bande(k, [I.unique(k, m.corps, m.vb), o.trait("#f2f5fa40", "1px")], { fond: NUIT, colonne: true, gap: "0px", padV: ["24px", "20px", "16px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Marque tracée" });
    const cols = G.ligne(k, [
      o.colLiens("Démarches", [["État civil", "/faq"], ["Urbanisme", "/faq"], ["Stationnement", "/faq"]], { survol: AMBRE, min: "140px" }),
      o.colLiens("Ville", [["Agenda", "/blog"], ["Actualités", "/blog"], ["Associations", "/blog"]], { survol: AMBRE, min: "140px" }),
      o.colLiens("Services", [["Inscriptions scolaires", "/faq"], ["Offres d'emploi", "/blog"], ["Signaler", "/contact"]], { survol: AMBRE, min: "140px" }),
      o.colLiens("Mairie", [["Contact", "/contact"], ["Questions fréquentes", "/faq"], ["Mon espace", "/connexion"]], { survol: AMBRE, min: "140px" }),
      o.colLiens("Suivre", [["Facebook", RS[0][1]], ["Instagram", RS[1][1]], ["YouTube", RS[2][1]]], { survol: AMBRE, min: "140px" }),
    ], { gap: "24px 32px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" });
    const colsBloc = G.colonne(k, [cols], { poids: 3, min: "300px", base: "520px", gap: "0px" });
    const fontaine = G.colonne(k, [I.unique(k, I.fontaine(true), "0 0 420 420", { maxWidth: "300px" })], { poids: 0, base: "300px", min: "240px", gap: "0px", aligne: "center", mobile: { flexBasis: "100%" } });
    const bas1 = G.bande(k, [colsBloc, fontaine], { fond: NUIT, gap: "40px", aligne: "flex-end", padV: ["40px", "36px", "28px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Colonnes et fontaine" });
    const bas = G.bande(k, [o.mentions({ couleur: S.mute, liens: S.fg })], { fond: NUIT, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [appel, marque, bas1, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-389 « Sommaire citoyen » — capture « Bruno » sur sable clair : rangée de quatre vignettes dessinées en tête, phrase serif centrée + boutons, cinq colonnes, filet puis marque PRÉ-HAUT tracée en filigrane avec sa lueur brique et ses étincelles.
const sommaireId = identite({
  key: "c389", label: "Sable, brun encre et rouge brique", humeur: "light",
  fond: "#f1ebde", texte: "#2a1c14", discret: "#5d4a3a", accent: "#b23a1e", surface: "#e6dcc8", encre: "#2a1c14", surEncre: "#f1ebde",
  police: "font.karla", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#2a1c1459",
});
const sommaireCitoyen = modeleV2({
  id: identifiantV2(389, "sommaire-citoyen"), concept: "c-389-sommaire-citoyen",
  name: "Sommaire citoyen", family: FAM,
  description: "Pour une mairie : quatre vignettes dessinées, une grande phrase centrée avec deux boutons, cinq colonnes de rubriques, puis la marque Pré-Haut tracée en filigrane dans sa lueur brique. Sable, brun encre, rouge brique.",
  tags: ["mairie", "vignettes", "illustration", "marque tracée", "rubriques", "serif", "sable", "rouge brique", "angles droits"],
  identity: sommaireId,
  racine: { desktop: { backgroundColor: "#e6dcc8", gap: "0px" } },
  widgets: ["html", "text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), ENCRE = "#2a1c14", BR = "#b23a1e";
    const vign = [I.double(k, I.vignettes(false), "0 0 1180 200", "0 0 580 420", { maxWidth: "1180px", marginLeft: "auto", marginRight: "auto" })];
    // la rangée est préparée en deux cadrages : mobile = 2 x 2 ; le corps est recalculé pour ce cadrage
    vign[0][1] = { ...I.double(k, I.vignettes(true), "0 0 1180 200", "0 0 580 420", { maxWidth: "1180px", marginLeft: "auto", marginRight: "auto" })[1] };
    const phrase = G.geant(`<p>La mairie, au plus près<br>de chez vous.</p>`, { taille: [34, 80], tablette: { taille: [48, 68] }, mobile: { taille: [34, 46] }, lh: 1.06, suivi: "-0.01em", poids: "500", police: S.head, couleur: ENCRE, align: "center" })(k, env, true);
    const b1 = o.souffle(o.bouton("Mes démarches", "/connexion", { texte: "#ffffff", fond: BR, bord: BR, survol: { backgroundColor: ENCRE, borderColor: ENCRE, color: "#ffffff", transform: { y: -3 } }, focus: ENCRE }), 4200);
    const b2 = o.bouton("Écrire à la mairie", "/contact", { texte: ENCRE, bord: ENCRE, survol: { backgroundColor: ENCRE, color: "#ffffff", transform: { y: -3 } }, focus: ENCRE });
    const tete = G.bande(k, [...vign[0], phrase, G.ligne(k, [b1, b2], { gap: "12px", justifie: "center", largeur: "100%" })], { fond: "#f1ebde", colonne: true, gap: "40px", aligne: "stretch", padV: ["64px", "52px", "36px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Vignettes et appel" });
    const cols = G.ligne(k, [
      o.colLiens("Démarches", [["État civil", "/faq"], ["Urbanisme", "/faq"], ["Élections", "/blog"]], { titre: ENCRE, couleur: S.mute, survol: BR, min: "150px" }),
      o.colLiens("Écoles", [["Inscriptions", "/faq"], ["Périscolaire", "/faq"], ["Loisirs", "/blog"]], { titre: ENCRE, couleur: S.mute, survol: BR, min: "150px" }),
      o.colLiens("Cadre de vie", [["Voirie", "/faq"], ["Propreté", "/faq"], ["Environnement", "/blog"]], { titre: ENCRE, couleur: S.mute, survol: BR, min: "150px" }),
      o.colLiens("Vie locale", [["Culture", "/blog"], ["Sports", "/blog"], ["Associations", "/contact"]], { titre: ENCRE, couleur: S.mute, survol: BR, min: "150px" }),
      G.colonne(k, [o.caps("Écrire à la mairie", { couleur: ENCRE }), o.coordonnees({ couleur: ENCRE, lien: ENCRE, survol: BR, focus: BR, taille: 14 })], { poids: 1.3, min: "220px", gap: "8px" }),
    ], { gap: "28px 32px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" });
    const milieu = G.bande(k, [cols], { fond: "#e6dcc8", colonne: true, padV: ["48px", "40px", "32px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Colonnes" });
    const m = I.mot("PRE'-HAUT", { couleur: "#d6c9ab", trait: 1.5 });
    const lueur = I.calque(I.plein("0 0 1200 400", I.lueurCoin("#b23a1e", "#b23a1e", 560, 0), "xMaxYMax meet"), { st: { opacity: 1 } });
    const marque = I.surFond(G.bande(k, [o.trait("#2a1c1459", "1px"), I.unique(k, m.corps, m.vb), G.ligne(k, [o.mentions({ couleur: S.mute, liens: ENCRE })], { largeur: "100%" })], { fond: "#e6dcc8", colonne: true, gap: "24px", padV: ["16px", "14px", "12px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Marque tracée et mentions" }), [lueur]);
    return [G.racine(k, [tete, milieu, marque])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-390 « Tableau d'affichage » — capture « YMGrad » : bloc de marque + pastilles en tête, puis, au lieu d'une colonne, un grand plan de la ville dessiné en bandeau, enfin quatre colonnes de liens en capitales et le bouton de retour en haut.
const tableauId = identite({
  key: "c390", label: "Aubergine, lilas et blanc", humeur: "dark",
  fond: "#1c1030", texte: "#f4f0fb", discret: "#c3b6dc", accent: "#d6b4ff", surface: "#2a1a47", encre: "#1c1030", surEncre: "#f4f0fb",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f4f0fb33",
});
const tableauAffichage = modeleV2({
  id: identifiantV2(390, "tableau-d-affichage"), concept: "c-390-tableau-d-affichage",
  name: "Tableau d'affichage", family: FAM,
  description: "Pour une ville : bloc de marque et pastilles de réseaux, grand plan de la ville dessiné en bandeau (rues, parc, rivage, épingle), puis quatre colonnes de services, horaires et contact. Aubergine et lilas.",
  tags: ["ville", "plan", "carte dessinée", "illustration", "services", "horaires", "aubergine", "lilas", "angles droits"],
  identity: tableauId,
  racine: { desktop: { backgroundColor: "#1c1030", gap: "0px" } },
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), LIL = "#d6b4ff", AUB = "#1c1030";
    const logo = o.souffle(o.logo("M", "Montrivage", { fond: LIL, encre: AUB, couleur: S.fg, police: S.head }), 5200);
    const carte = G.colonne(k, [I.unique(k, I.planVille(), "250 0 700 240", { maxWidth: "720px" })], { poids: 1.5, base: "380px", min: "280px", gap: "0px", aligne: "stretch" });
    const liste = G.colonne(k, [logo, o.colLiens("Services", [["Démarches en ligne", "/connexion"], ["Espace citoyen", "/connexion"], ["Signaler un problème", "/contact"], ["Questions fréquentes", "/faq"], ["Agenda et actualités", "/blog"]], { survol: LIL, police: S.font, policeTitre: S.head, min: "200px", poids: 0 })], { poids: 1, base: "300px", min: "260px", gap: "24px" });
    const haut = G.bande(k, [carte, liste], { fond: AUB, gap: "40px 64px", aligne: "center", padV: ["56px", "44px", "32px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Plan et services" });
    const hor = k.col([o.caps("Horaires", { couleur: LIL, police: S.head }), o.horaires({ couleur: S.fg, taille: 14 })], { backgroundColor: "#2a1a47", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", gap: "10px", boxSizing: "border-box", flexGrow: 1, flexBasis: "260px", minWidth: "0px", borderRadius: "0px" });
    const con = k.col([o.caps("Contact", { couleur: LIL, police: S.head }), o.coordonnees({ couleur: S.fg, lien: S.fg, survol: LIL, focus: LIL, taille: 14 })], { backgroundColor: "#2a1a47", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", gap: "10px", boxSizing: "border-box", flexGrow: 1, flexBasis: "260px", minWidth: "0px", borderRadius: "0px" });
    const milieu = G.bande(k, [k.row([hor, con], { gap: "6px", alignItems: "stretch", flexWrap: "wrap", width: "100%" }), G.ligne(k, [o.lien("Tous les services de la ville", "/faq", { taille: 15, poids: "600", couleur: LIL, soulign: true, survol: { color: "#ffffff" }, focus: LIL }), o.haut(S.fg, AUB)], { justifie: "space-between", largeur: "100%" })], { fond: AUB, colonne: true, gap: "24px", padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Horaires et contact" });
    const bas = G.bande(k, [o.mentions({ couleur: S.mute, liens: S.fg })], { fond: "#2a1a47", colonne: true, padV: ["24px", "22px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-391 « Courrier de la commune » — capture « KENNEDY » : filets, bloc d'adresse, deux colonnes, NOM MONUMENTAL en serif italique pleine largeur ; à gauche, le médaillon d'or de la commune dessiné.
const papierId = identite({
  key: "c391", label: "Crème, marine et or", humeur: "light",
  fond: "#fffdf7", texte: "#1a2a4a", discret: "#4c5568", accent: "#7a5a12", surface: "#f3eedc", encre: "#1a2a4a", surEncre: "#fffdf7",
  police: "font.libre-franklin", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#1a2a4a59",
});
const courrierCommune = modeleV2({
  id: identifiantV2(391, "courrier-de-la-commune"), concept: "c-391-courrier-de-la-commune",
  name: "Courrier de la commune", family: FAM,
  description: "Pour une commune : double filet, le médaillon d'or dessiné (lauriers, tour, étoile, ruban) à gauche, liens, coordonnées et horaires à droite, puis « Saint-Aubin » en grand serif italique pleine largeur. Crème, marine et or.",
  tags: ["commune", "courrier officiel", "médaillon", "illustration", "nom monumental", "serif", "crème", "marine", "angles droits"],
  identity: papierId,
  racine: { desktop: { backgroundColor: "#fffdf7", gap: "0px" } },
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), MARINE = "#1a2a4a", OR = "#7a5a12";
    const double = k.row([o.souffle(o.carre(OR, "12px"), 3600), o.caps("Commune de Saint-Aubin", { couleur: MARINE, suivi: "0.2em" })], { gap: "12px", alignItems: "center", justifyContent: "center", flexWrap: "nowrap", width: "100%" });
    const medaille = I.unique(k, I.medaillon(), "0 0 280 260", { maxWidth: "260px", marginLeft: "auto", marginRight: "auto" });
    const devise = o.caps("Mairie · État civil · Services à la population", { couleur: OR, suivi: "0.22em", extra: { textAlign: "center", width: "100%" } });
    const liensLigne = G.ligne(k, [["Démarches", "/faq"], ["Actualités", "/blog"], ["Espace citoyen", "/connexion"], ["Nous écrire", "/contact"]].map(([t, u]) => o.lien(t, u, { taille: 16, poids: "600", couleur: MARINE, padH: "14px", survol: { color: OR, textDecoration: "underline" }, focus: OR })), { gap: "0px 10px", aligne: "center", justifie: "center", largeur: "100%" });
    const coord = G.colonne(k, [o.caps("Adresse et contact", { couleur: OR }), o.coordonnees({ couleur: MARINE, lien: MARINE, survol: OR, focus: OR })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" });
    const horaire = G.colonne(k, [o.caps("Accueil du public", { couleur: OR }), o.horaires({ couleur: MARINE })], { poids: 1, min: "240px", gap: "10px", aligne: "stretch" });
    const liensCol = o.colLiens("Liens utiles", [["Démarches", "/faq"], ["Actualités", "/blog"], ["Espace citoyen", "/connexion"], ["Nous écrire", "/contact"]], { titre: OR, couleur: MARINE, survol: OR, min: "170px" });
    const cartouche = G.ligne(k, [liensCol, coord, horaire], { rowGap: "28px", columnGap: "48px", aligne: "flex-start", justifie: "center", largeur: "100%" });
    const haut = G.bande(k, [double, medaille, devise, cartouche, o.trait(MARINE, "1px")], { fond: "#fffdf7", colonne: true, gap: "24px", aligne: "stretch", padV: ["40px", "36px", "28px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Médaillon et cartouche" });
    const nom = G.geant(`<p><em>SAINT-AUBIN</em></p>`, { taille: [40, 200], lh: 0.86, suivi: "-0.01em", poids: "600", police: S.head, couleur: MARINE })(k, env);
    const grand = G.bande(k, [nom], { fond: "#fffdf7", colonne: true, padV: ["0px", "0px", "0px"], padB: ["12px", "10px", "8px"], padH: ["32px", "24px", "16px"], max: "100%", nom: "Nom monumental" });
    const bas = G.bande(k, [o.trait(MARINE, "4px"), o.mentions({ couleur: S.mute, liens: MARINE })], { fond: "#fffdf7", colonne: true, gap: "20px", padV: ["12px", "10px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, grand, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Collectivités et services publics", target: 6, built: true,
  description: "Pieds de mairies, communautés de communes et villes, angles droits, inspirés de captures et illustrés : façade, rivières, fontaine, vignettes, plan de ville, médaillon.",
  models: [facadeMairie, guichetLateral, demarcheEnLigne, sommaireCitoyen, tableauAffichage, courrierCommune],
};
