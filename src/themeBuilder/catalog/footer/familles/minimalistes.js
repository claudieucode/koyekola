// Famille « Minimalistes » — 8 modèles : pieds courts, peu d'éléments, huit compositions différentes (voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md).
// Chaque modèle a sa propre ambiance (couleurs AA vérifiées par le kit, polices locales) et sa propre structure.
const { modele, identifiantModele, ambiance, C, L, T, Z, A, reseaux, widget } = require("../kit-conception");

// Aides LOCALES de la famille « Minimalistes » (le kit n'a pas ces éléments typographiques). Chaque aide renvoie une fonction (k, env, center) → nœud, utilisable dans une rangée.
// Les polices sont posées ici (le moteur ne les pose que sur les éléments en texte) ; la finition (survol, focus, cibles de 44 px sur mobile) est appliquée par le moteur.

// Grande ligne de texte (signature typographique) : taille par écran
const grand = (texte, { desktop = 56, tablet = 44, mobile = 32, poids, serre = "-0.02em", maxLargeur } = {}) => (k, env, center) =>
  k.H(texte, "2", { fontSize: `${desktop}px`, lineHeight: 1.05, letterSpacing: serre, fontFamily: k.S.head, ...(poids ? { fontWeight: poids } : {}), ...(center ? { textAlign: "center" } : {}), ...(maxLargeur ? { maxWidth: maxLargeur } : {}) },
    { fontSize: `${tablet}px` }, { fontSize: `${mobile}px` });

// Phrase courte (texte secondaire)
const phrase = (texte, { taille = 15, largeur = "420px", teinte = "mute", decale } = {}) => (k, env, center) =>
  k.T(`<p>${texte}</p>`, { color: teinte === "fg" ? k.S.fg : k.S.mute, fontSize: `${taille}px`, fontFamily: k.S.font, maxWidth: largeur, ...(decale ? { marginTop: decale } : {}), ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) });

// Entrée d'un index numéroté : petit numéro + lien en grand
const entree = (numero, libelle, url, { taille = 26 } = {}) => (k) =>
  k.col([
    k.T(`<p>${numero}</p>`, { color: k.S.accent, fontSize: "13px", fontWeight: "700", letterSpacing: "0.12em", fontFamily: k.S.font }),
    k.LINK(libelle, url, { fontSize: `${taille}px`, fontWeight: "600", fontFamily: k.S.head, lineHeight: 1.1 }),
  ], { gap: "6px", alignItems: "flex-start" });

// Rangée de liens d'exemple vers des pages de la plateforme (modifiables dans l'éditeur) : pas de flèche de sous-menu, donc cibles tactiles de 44 px partout sur mobile
const liens = (liste, { caps = false, pile = false } = {}) => (k, env, center) => {
  const a = liste.map(([l, u]) => k.LINK(l, u, { fontSize: caps ? "13px" : "14px", fontWeight: "600", fontFamily: k.S.font, ...(caps ? { textTransform: "uppercase", letterSpacing: "1.4px" } : {}) }));
  return pile ? k.col(a, { gap: "8px", alignItems: center ? "center" : "flex-start" }) : k.row(a, { gap: "12px", columnGap: "28px", rowGap: "4px", ...(center ? { justifyContent: "center" } : {}) });
};

// Bouton « Retour en haut » : aligné à gauche sur mobile (sinon il restait collé à droite sous des lignes alignées à gauche)
const retour = () => widget("backtotop", { mode: "inline", side: "right", label: "Retour en haut", showLabel: true, threshold: 300 }, { desktop: { fontSize: "13px", fontWeight: "600" }, mobile: { marginRight: "auto" } });

// Petit filet décoratif court (trait d'accent) : séparateur sans texte
const trait = (largeur = "48px", epaisseur = "3px") => (k, env, center) =>
  k.divider({ width: largeur, borderColor: k.S.accent, borderTopWidth: epaisseur, ...(center ? { marginLeft: "auto", marginRight: "auto" } : {}) });


const FAM = "minimalistes";
const craie = ambiance({ key: "min-craie", label: "Craie et encre", humeur: "light", fond: "#f6f4ee", texte: "#1d1d1b", accent: "#3b3b36", police: "font.mulish", titres: "font.dm-sans" });
const encre = ambiance({ key: "min-encre", label: "Encre et grenat", humeur: "edit", fond: "#fffdf8", texte: "#161616", accent: "#8a1c2b", police: "font.source-sans-3", titres: "font.eb-garamond" });
const nuit = ambiance({ key: "min-nuit", label: "Nuit d'acier", humeur: "dark", fond: "#0f1115", texte: "#e8eaee", accent: "#7dd3fc", police: "font.ibm-plex-sans", titres: "font.inter-tight" });
const ciel = ambiance({ key: "min-ciel", label: "Ciel d'hiver", humeur: "soft", fond: "#eef4ff", texte: "#14213d", accent: "#1d4ed8", police: "font.outfit", titres: "font.outfit" });
const laiton = ambiance({ key: "min-laiton", label: "Noir et laiton", humeur: "dark", fond: "#15120f", texte: "#efe6d4", accent: "#c0975a", police: "font.lato", titres: "font.eb-garamond" });
const citron = ambiance({ key: "min-citron", label: "Graphite et citron", humeur: "dark", fond: "#17181a", texte: "#f7f7f2", accent: "#c8f169", police: "font.space-grotesk", titres: "font.archivo" });
const argile = ambiance({ key: "min-argile", label: "Argile chaude", humeur: "light", fond: "#fbf1e6", texte: "#3a2318", accent: "#a8460f", police: "font.karla", titres: "font.bricolage-grotesque" });
const foret = ambiance({ key: "min-foret", label: "Forêt profonde", humeur: "brand", fond: "#10302a", texte: "#eafaf4", accent: "#f2c14e", police: "font.barlow", titres: "font.barlow-condensed" });

module.exports = {
  key: "minimalistes",
  label: "Minimalistes",
  description: "Une ou deux lignes : copyright, liens légaux, menu horizontal avec informations d'entreprise, menu déroulant sur mobile.",
  target: 8,
  built: true,
  models: [
    // 1 — deux lignes : menu en capitales centré, puis mentions d'entreprise à gauche et liens légaux à droite
    modele({
      id: identifiantModele(FAM, 1, "menu-et-mentions"),
      name: "Menu centré et mentions",
      family: FAM,
      description: "Deux lignes très sobres : le menu du pied en petites capitales, centré entre deux filets, puis les informations d'entreprise à gauche et les liens légaux à droite.",
      tags: ["minimaliste", "menu", "mentions légales", "deux lignes"],
      identity: craie,
      structure: { rows: [
        Z([liens([["Accueil", "/"], ["Blog", "/blog"], ["Aide", "/faq"], ["Contact", "/contact"]], { caps: true })], { pad: "md", gap: "0px", rule: "thin" }),
        L(["copy", "legalinfo:inline"], ["legallinks"], { pad: "sm", bg: "alt", rule: "thin" }),
      ] },
      widgets: ["link", "bizlegal"],
    }, FAM),

    // 2 — pile centrée : trait d'accent, très grande signature, phrase, copyright
    modele({
      id: identifiantModele(FAM, 2, "signature-typographique"),
      name: "Signature typographique",
      family: FAM,
      description: "Le nom du site en très grand, en caractères à empattement, sous un court trait d'accent ; une phrase d'une ligne et le copyright. Un pied qui fait signature plutôt que menu.",
      tags: ["minimaliste", "typographie", "centré", "signature"],
      identity: encre,
      structure: { rows: [
        Z([trait("56px", "3px"), grand("Merci de votre visite.", { desktop: 56, tablet: 44, mobile: 32, poids: "600" }), phrase("Ce site est conçu pour aller à l'essentiel : lire, comprendre, écrire.", { taille: 16, largeur: "480px" }), "copy:c"], { pad: "xl", gap: "20px", rule: "double" }),
      ] },
      widgets: ["heading", "text", "copyright"],
    }, FAM),

    // 3 — barre fine : copyright à gauche ; liens légaux et retour en haut à droite
    modele({
      id: identifiantModele(FAM, 3, "barre-fine-retour-en-haut"),
      name: "Barre fine avec retour en haut",
      family: FAM,
      description: "Une barre sombre d'une seule ligne : copyright à gauche, liens légaux puis bouton « Retour en haut » à droite. Idéale pour les longues pages qui demandent de remonter vite.",
      tags: ["minimaliste", "barre fine", "retour en haut", "sombre"],
      identity: nuit,
      structure: { rows: [
        L(["copy"], ["legallinks", retour()], { pad: "xs", rule: "none", max: "1320px" }),
      ] },
      responsive: { mobile: { gap: "8px" } },
      widgets: ["copyright", "bizlegal", "backtotop"],
    }, FAM),

    // 4 — trois zones : marque / phrase centrée / réseaux discrets
    modele({
      id: identifiantModele(FAM, 4, "marque-phrase-reseaux"),
      name: "Marque, phrase et réseaux",
      family: FAM,
      description: "Trois zones sur une ligne : le titre du site, une phrase d'accueil et trois réseaux sociaux en boutons carrés. Le copyright vient se glisser dessous, tout petit.",
      tags: ["minimaliste", "réseaux sociaux", "trois zones", "clair"],
      identity: ciel,
      structure: { rows: [
        C([[5, "title:22"], [4, phrase("Suivez-nous, sans fil ni bruit.", { taille: 14, largeur: "320px", decale: "8px" })], [3, reseaux([{ network: "instagram", url: "https://www.instagram.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }], { taille: 36, forme: "square" })]], { pad: "md", rule: "thin", min: "150px" }),
        Z(["copy:c"], { pad: "xs", bg: "alt", rule: "none" }),
      ] },
      widgets: ["sitetitle", "text", "social", "copyright"],
    }, FAM),

    // 5 — cartouche : un seul cadre fin, étroit, centré
    modele({
      id: identifiantModele(FAM, 5, "cartouche-centre"),
      name: "Cartouche centré",
      family: FAM,
      description: "Un petit cartouche encadré, étroit et centré : liens légaux au-dessus, copyright en dessous. Noir et laiton, pour les sites de prestige qui n'ont rien à ajouter.",
      tags: ["minimaliste", "cadre", "centré", "luxe"],
      identity: laiton,
      structure: { rows: [
        C([[1, "legallinks", "copy:c"]], { pad: "lg", frame: true, center: true, max: "640px", rule: "none" }),
      ] },
      responsive: { mobile: { gap: "12px" } },
      widgets: ["bizlegal", "copyright"],
    }, FAM),

    // 6 — index numéroté : quatre entrées en grand, puis bande d'accent pour le copyright
    modele({
      id: identifiantModele(FAM, 6, "index-numerote"),
      name: "Index numéroté",
      family: FAM,
      description: "Quatre grandes entrées numérotées (accueil, blog, aide, contact) alignées comme une table des matières, et une fine bande de couleur vive pour le copyright. Graphique et très lisible.",
      tags: ["minimaliste", "index", "numéros", "typographie", "sombre"],
      identity: citron,
      structure: { rows: [
        C([[3, entree("01", "Accueil", "/")], [3, entree("02", "Blog", "/blog")], [3, entree("03", "Aide", "/faq")], [3, entree("04", "Contact", "/contact")]], { pad: "xl", min: "120px", rule: "none" }),
        L(["copy"], [retour()], { pad: "xs", bg: "accent", rule: "none" }),
      ] },
      responsive: { tablet: { gap: "28px" }, mobile: { gap: "20px" } },
      widgets: ["link", "copyright", "backtotop"],
    }, FAM),

    // 7 — deux zones asymétriques 4/8 : identité à gauche, phrase et menu à droite
    modele({
      id: identifiantModele(FAM, 7, "deux-zones-asymetriques"),
      name: "Deux zones asymétriques",
      family: FAM,
      description: "Une étroite colonne d'identité à gauche (titre du site et copyright) face à une large zone à droite : une phrase en grand, puis le menu du pied et le bouton de contact. Sur mobile, tout passe en pile.",
      tags: ["minimaliste", "asymétrique", "menu", "bouton"],
      identity: argile,
      structure: { rows: [
        C([[4, "title:24", "copy"], [8, grand("Une question, une idée ? Écrivez-nous.", { desktop: 32, tablet: 28, mobile: 24, poids: "600", maxLargeur: "560px" }), liens([["Accueil", "/"], ["Blog", "/blog"], ["Aide", "/faq"]]), "cta|Nous écrire|/contact"]], { pad: "lg", min: "260px", rule: "accent" }),
      ] },
      widgets: ["sitetitle", "copyright", "heading", "link", "button"],
    }, FAM),

    // 8 — trois volets compacts : colonnes sur ordinateur, accordéon sur mobile ; copyright dessous
    modele({
      id: identifiantModele(FAM, 8, "trois-volets-compacts"),
      name: "Trois volets compacts",
      family: FAM,
      description: "Trois petites colonnes de texte fin (navigation, informations d'entreprise, légal) sous un fin filet. Sur mobile, elles deviennent trois volets repliables de 44 px de haut, avec le copyright en dessous.",
      tags: ["minimaliste", "accordéon mobile", "mentions légales", "volets"],
      identity: foret,
      structure: { rows: [
        A([[1, "Navigation", liens([["Accueil", "/"], ["Blog", "/blog"], ["Aide", "/faq"], ["Contact", "/contact"]], { pile: true })], [1, "Entreprise", "legalinfo", "link|Nous écrire|/contact"], [1, "Légal", "legallinks"]], { pad: "md", rule: "thin", min: "180px" }),
        L(["copy"], [retour()], { pad: "xs", bg: "alt", rule: "none" }),
      ] },
      widgets: ["link", "bizlegal", "copyright", "backtotop"],
    }, FAM),
  ],
};
