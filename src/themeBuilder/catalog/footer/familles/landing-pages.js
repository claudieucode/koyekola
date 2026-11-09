// Famille « Landing pages » — 6 modèles : pieds courts de pages de vente et de conversion (un seul appel à l'action, aucune navigation qui distrait, légal minimal toujours présent).
// Règles de la famille : AUCUN faux compte à rebours, AUCUNE fausse rareté, AUCUN faux chiffre ni faux avis. Les promesses (garantie, délais, dates) sont des EXEMPLES marqués comme tels, à remplacer par les vrais engagements du site.
const { modele, identifiantModele, ambiance, C, L, T, Z, reseaux, widget } = require("../kit-conception");
const Moteur = require("../moteur");

// ── Aides LOCALES de la famille (le kit n'a pas ces éléments) : chacune renvoie une fonction (k, env, center) → nœud, finie par le moteur (survol, focus, 44 px sur mobile). ──
// Petite étiquette en capitales (sur-titre)
const etiquette = (texte, { pastille = false } = {}) => (k, env, center) =>
  k.T(`<p>${texte}</p>`, { fontFamily: k.S.font, fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase",
    ...(pastille ? { backgroundColor: k.S.accent, color: k.S.onAccent, borderRadius: "999px", paddingTop: "5px", paddingBottom: "5px", paddingLeft: "14px", paddingRight: "14px", display: "inline-block" } : { color: k.S.accent }),
    ...(center ? { textAlign: "center", alignSelf: "center" } : {}) });

// Titre fort (taille par écran)
const titre = (texte, { desktop = 40, tablet = 34, mobile = 28, poids, largeur } = {}) => (k, env, center) =>
  k.H(texte, "2", { fontSize: `${desktop}px`, lineHeight: 1.1, letterSpacing: "-0.015em", fontFamily: k.S.head, ...(poids ? { fontWeight: poids } : {}), ...(largeur ? { maxWidth: largeur } : {}), ...(center ? { textAlign: "center" } : {}) },
    { fontSize: `${tablet}px` }, { fontSize: `${mobile}px` });

// Phrase (texte secondaire ou principal)
const phrase = (texte, { taille = 16, largeur = "520px", teinte = "mute", italique = false } = {}) => (k, env, center) =>
  k.T(`<p>${texte}</p>`, { color: teinte === "fg" ? k.S.fg : k.S.mute, fontSize: `${taille}px`, fontFamily: k.S.font, ...(largeur === "none" ? {} : { maxWidth: largeur }), ...(italique ? { fontStyle: "italic" } : {}),
    ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) });

// Gros bouton d'appel à l'action (pleine largeur sur mobile)
const bouton = (libelle, url, { contour = false, taille = 18 } = {}) => (k, env, center) =>
  k.B(libelle, url, contour ? "outline" : "solid", { fontSize: `${taille}px`, paddingTop: "16px", paddingBottom: "16px", paddingLeft: "36px", paddingRight: "36px", ...(center ? { alignSelf: "center" } : {}) },
    undefined, { width: "100%", fontSize: "17px" });

// Deux boutons côte à côte (empilés sur mobile)
const boutons = (a, b) => (k, env, center) =>
  k.row([bouton(a[0], a[1])(k, env, center), bouton(b[0], b[1], { contour: true, taille: 16 })(k, env, center)],
    { gap: "12px", rowGap: "12px", columnGap: "16px", justifyContent: "center", alignItems: "center" }, undefined, { flexDirection: "column", alignItems: "stretch" });

// Ligne de réassurance : éléments courts, signalés comme exemples par l'appelant
const reassurance = (items, { taille = 14 } = {}) => (k, env, center) =>
  k.row(items.map((t) => k.T(`<p>${t}</p>`, { color: k.S.mute, fontSize: `${taille}px`, fontFamily: k.S.font, fontWeight: "600" })), { gap: "8px", columnGap: "22px", rowGap: "6px", justifyContent: center ? "center" : "flex-start" });

// Liste à coches
const coches = (items) => (k) =>
  k.col(items.map((t) => k.row([
    k.T("<p>✓</p>", { color: k.S.accent, fontWeight: "800", fontSize: "16px", fontFamily: k.S.font, lineHeight: 1.5 }),
    k.T(`<p>${t}</p>`, { color: k.S.fg, fontSize: "15px", fontFamily: k.S.font, lineHeight: 1.5 }),
  ], { gap: "10px", alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" })), { gap: "8px" });

// Étape numérotée : pastille ronde + texte
const etapes = (items) => (k) =>
  k.col(items.map(([t, d], i) => k.row([
    k.T(`<p>${i + 1}</p>`, { backgroundColor: k.S.accent, color: k.S.onAccent, width: "34px", height: "34px", minWidth: "34px", borderRadius: "999px", textAlign: "center", lineHeight: 2.2, fontWeight: "700", fontSize: "15px", fontFamily: k.S.font }),
    k.col([k.T(`<p><strong>${t}</strong></p>`, { color: k.S.fg, fontSize: "15px", fontFamily: k.S.font, lineHeight: 1.3 }), k.T(`<p>${d}</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font, lineHeight: 1.4 })], { gap: "2px" }),
  ], { gap: "14px", alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" })), { gap: "16px" });

// Sceau de garantie : très grand chiffre dans un cercle, avec sa légende
const sceau = (chiffre, legende) => (k) =>
  k.col([
    k.T(`<p>${chiffre}</p>`, { fontFamily: k.S.head, fontSize: "64px", fontWeight: "700", lineHeight: 1.75, textAlign: "center", width: "124px", height: "124px", borderRadius: "999px", borderStyle: "double", borderWidth: "6px", borderColor: k.S.accent, color: k.S.accent, backgroundColor: k.S.alt }),
    k.T(`<p>${legende}</p>`, { color: k.S.fg, fontFamily: k.S.font, fontSize: "13px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", width: "124px" }),
  ], { gap: "10px", alignItems: "center" });

// Repère de confiance : numéro, intitulé, une ligne d'explication, liseré d'accent à gauche
const preuve = (repere, intitule, detail) => (k) =>
  k.col([
    k.T(`<p>${repere}</p>`, { color: k.S.accent, fontFamily: k.S.head, fontSize: "30px", fontWeight: "700", lineHeight: 1 }),
    k.T(`<p><strong>${intitule}</strong></p>`, { color: k.S.fg, fontFamily: k.S.font, fontSize: "16px", lineHeight: 1.3 }),
    k.T(`<p>${detail}</p>`, { color: k.S.mute, fontFamily: k.S.font, fontSize: "13px", lineHeight: 1.45 }),
  ], { gap: "6px", alignItems: "flex-start", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderColor: k.S.accent, paddingLeft: "16px" });

// Carte posée derrière un formulaire (fond alterné, arrondi et relief de l'ambiance)
const encart = (codes) => (k, env, center) =>
  k.card(codes.map((c) => Moteur.item(k, c, env, center)), { gap: "14px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", width: "100%", maxWidth: "540px", alignSelf: "flex-end" }, undefined, { paddingTop: "20px", paddingBottom: "20px", paddingLeft: "18px", paddingRight: "18px" });

const FAM = "landing-pages";
const braise = ambiance({ key: "land-braise", label: "Braise sur nuit", humeur: "dark", fond: "#0f1218", texte: "#f4f1ec", accent: "#ff8a3d", police: "font.manrope", titres: "font.bricolage-grotesque" });
const prairie = ambiance({ key: "land-prairie", label: "Prairie et crème", humeur: "soft", fond: "#f5f0e2", texte: "#1f3022", accent: "#2b6a3d", police: "font.nunito-sans", titres: "font.fraunces" });
const indigo = ambiance({ key: "land-indigo", label: "Indigo nocturne", humeur: "dark", fond: "#15133a", texte: "#eeeefc", accent: "#b4b0ff", police: "font.figtree", titres: "font.sora" });
const corail = ambiance({ key: "land-corail", label: "Corail et sable", humeur: "light", fond: "#fff6f0", texte: "#3b1d12", accent: "#c2410c", police: "font.outfit", titres: "font.young-serif" });
const glace = ambiance({ key: "land-glace", label: "Glace et acier", humeur: "light", fond: "#f1f6fb", texte: "#0b2036", accent: "#0369a1", police: "font.public-sans", titres: "font.red-hat-display" });
const feuille = ambiance({ key: "land-feuille", label: "Feuille blanche", humeur: "edit", fond: "#fffefa", texte: "#1c1c1c", accent: "#27272a", police: "font.dm-sans", titres: "font.instrument-serif" });

module.exports = {
  key: "landing-pages",
  label: "Landing pages",
  description: "Pieds courts à un seul appel à l'action, sans navigation distrayante, légal minimal.",
  target: 6,
  built: true,
  models: [
    // 1 — pile centrée : sur-titre, grande phrase, énorme bouton + lien discret, ligne de réassurance, puis barre légale
    modele({
      id: identifiantModele(FAM, 1, "bouton-achat-final"),
      name: "Bouton d'achat final",
      family: FAM,
      description: "Dernier appel avant de quitter la page : une grande phrase, un énorme bouton de commande, un lien discret pour poser une question, trois promesses d'exemple, puis une barre légale minimale.",
      tags: ["landing", "achat", "bouton", "un seul appel"],
      identity: braise,
      structure: { rows: [
        Z([etiquette("Dernière étape", { pastille: true }), titre("Prêt à vous lancer ?", { desktop: 56, tablet: 44, mobile: 34, poids: "800" }), phrase("Une seule décision à prendre, et tout est expliqué plus haut. Le bouton ci-dessous vous emmène directement à la commande.", { largeur: "560px" }),
          boutons(["Je commande maintenant", "/boutique"], ["Une question ? Écrivez-nous", "/contact"]),
          reassurance(["Paiement sécurisé", "Accès immédiat", "Garantie 30 jours", "(promesses d'exemple : à adapter)"], { taille: 13 })], { pad: "xl", gap: "22px", rule: "accent", max: "860px" }),
        L(["copy"], ["legallinks"], { pad: "xs", rule: "thin", bg: "alt" }),
      ] },
      responsive: { mobile: { gap: "16px" } },
      widgets: ["heading", "text", "button", "copyright", "link", "bizlegal"],
    }, FAM),

    // 2 — encadré à trois zones : sceau de garantie / engagement / bouton ; légal centré dessous
    modele({
      id: identifiantModele(FAM, 2, "garantie-satisfait-rembourse"),
      name: "Garantie satisfait ou remboursé",
      family: FAM,
      description: "Un cadre à trois zones : un sceau « 30 jours », l'engagement de remboursement en clair (exemple à adapter) et le bouton d'essai sans risque. Mentions légales centrées en dessous.",
      tags: ["landing", "garantie", "réassurance", "remboursement"],
      identity: prairie,
      structure: { rows: [
        C([[3, sceau("30", "jours pour changer d'avis")], [6, etiquette("Notre engagement"), titre("Satisfait ou remboursé, sans justification", { desktop: 30, tablet: 28, mobile: 24 }), phrase("Essayez tranquillement. Si l'offre ne vous convient pas, écrivez-nous dans le délai et nous vous remboursons.", { taille: 15 }), phrase("Exemple de garantie : remplacez par vos vraies conditions avant de publier.", { taille: 13, italique: true })], [3, bouton("Essayer sans risque", "/inscription", { taille: 17 })]],
          { pad: "lg", frame: true, max: "1080px", min: "220px", rule: "none" }),
        Z(["legallinks", "copy:c"], { pad: "sm", gap: "6px", rule: "thin", bg: "alt" }),
      ] },
      responsive: { mobile: { gap: "20px" }, tablet: { gap: "28px" } },
      widgets: ["heading", "text", "button", "bizlegal", "copyright", "link"],
    }, FAM),

    // 3 — scission asymétrique : argumentaire à coches à gauche, formulaire d'inscription honnête dans une carte à droite
    modele({
      id: identifiantModele(FAM, 3, "inscription-courte-honnete"),
      name: "Inscription courte et honnête",
      family: FAM,
      description: "Argumentaire à trois coches à gauche, formulaire d'inscription par e-mail dans une carte à droite. Sans formulaire publié, un message clair remplace le champ : jamais de faux formulaire.",
      tags: ["landing", "inscription", "e-mail", "formulaire"],
      identity: indigo,
      structure: { rows: [
        C([[5, etiquette("Gratuit, sans carte bancaire"), titre("Le guide complet, dans votre boîte e-mail", { desktop: 36, tablet: 32, mobile: 26 }), coches(["Un seul e-mail pour recevoir le guide", "Désinscription en un clic, à tout moment", "Votre adresse sert uniquement à cet envoi"])],
          [7, encart(["newsletter|Recevoir le guide|Indiquez votre e-mail : le guide arrive tout de suite."])]], { pad: "xl", min: "280px", rule: "accent" }),
        L(["copy"], ["legallinks"], { pad: "xs", rule: "thin" }),
      ] },
      responsive: { tablet: { gap: "28px" } },
      widgets: ["heading", "text", "emailsubscribe", "stack", "copyright", "bizlegal", "link"],
    }, FAM),

    // 4 — webinaire : bandeau d'accent, puis trois blocs titre / déroulé en étapes / inscription
    modele({
      id: identifiantModele(FAM, 4, "webinaire-inscription"),
      name: "Webinaire en trois temps",
      family: FAM,
      description: "Bandeau d'accent « webinaire gratuit », puis trois blocs : le rendez-vous, le déroulé en trois étapes numérotées et l'inscription. Date et horaire sont des exemples à remplacer, sans fausse urgence.",
      tags: ["landing", "webinaire", "événement", "inscription"],
      identity: corail,
      structure: { rows: [
        Z([etiquette("Webinaire gratuit en direct, replay envoyé aux inscrits")], { pad: "xs", bg: "accent", rule: "none" }),
        C([[4, titre("Rejoignez la session en direct", { desktop: 34, tablet: 30, mobile: 26 }), phrase("Exemple : un jeudi à 14 h (heure de Paris), 45 minutes de présentation puis vos questions. Indiquez ici la vraie date.", { taille: 14, italique: true })],
          [5, etapes([["Je m'inscris", "Un e-mail suffit, c'est gratuit."], ["Je reçois le lien", "Un rappel arrive avant la session."], ["Je participe", "Je pose mes questions en direct."]])],
          [3, bouton("Réserver ma place", "/inscription", { taille: 17 }), bouton("Poser une question", "/contact", { contour: true, taille: 16 })]], { pad: "lg", min: "230px", rule: "none" }),
        L(["copy"], ["legallinks"], { pad: "xs", rule: "thin", bg: "alt" }),
      ] },
      responsive: { mobile: { gap: "24px" } },
      widgets: ["text", "heading", "button", "copyright", "bizlegal", "link"],
    }, FAM),

    // 5 — lancement : grande ligne de quatre repères de confiance, puis ligne marque / appel / réseaux, puis légal
    modele({
      id: identifiantModele(FAM, 5, "lancement-ligne-confiance"),
      name: "Lancement et ligne de confiance",
      family: FAM,
      description: "Pour un lancement de produit : une grande ligne de quatre engagements (exemples à adapter), puis marque, bouton de précommande et réseaux, et enfin une barre légale. Aucun faux chiffre.",
      tags: ["landing", "lancement", "confiance", "réseaux"],
      identity: glace,
      structure: { rows: [
        C([[3, preuve("01", "Paiement sécurisé", "Cartes et virement")], [3, preuve("02", "Accès immédiat", "Dès la confirmation")], [3, preuve("03", "Aide humaine", "Réponse sous un jour ouvré")], [3, preuve("04", "Garantie 30 jours", "Remboursé si insatisfait")]], { pad: "md", min: "200px", rule: "accent" }),
        Z([phrase("Engagements d'exemple : remplacez-les par ceux que vous tenez vraiment.", { taille: 12, italique: true, largeur: "none" })], { pad: "xs", rule: "none" }),
        T(["title:24"], [bouton("Précommander", "/boutique", { taille: 17 })], [reseaux([{ network: "instagram", url: "https://www.instagram.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }], { taille: 32, forme: "circle" })], { pad: "md", bg: "alt", rule: "thin" }),
        L(["copy"], ["legallinks"], { pad: "xs", rule: "none" }),
      ] },
      responsive: { mobile: { gap: "16px" } },
      widgets: ["sitetitle", "text", "button", "social", "copyright", "bizlegal", "link", "stack"],
    }, FAM),

    // 6 — capture sobre : colonne étroite, un champ, une promesse, puis ligne légale en trois zones avec retour en haut
    modele({
      id: identifiantModele(FAM, 6, "capture-sobre-colonne"),
      name: "Capture sobre en colonne étroite",
      family: FAM,
      description: "Une colonne étroite sur fond blanc cassé : un titre en empattement, le formulaire d'inscription, une promesse de discrétion, puis copyright, liens légaux et retour en haut sur une même ligne.",
      tags: ["landing", "capture", "sobre", "e-mail"],
      identity: feuille,
      structure: { rows: [
        Z([titre("Une lettre, quand il y a quelque chose à dire.", { desktop: 34, tablet: 30, mobile: 26, poids: "400" }), "newsletter|Je m'abonne|Votre e-mail suffit.", phrase("Pas de relance en rafale. Désinscription possible dans chaque message.", { taille: 13 })], { pad: "xl", gap: "18px", max: "560px", rule: "double" }),
        Z(["legallinks"], { pad: "sm", rule: "thin", max: "760px" }),
        L(["copy"], [widget("backtotop", { mode: "inline", side: "right", label: "Retour en haut", showLabel: true, threshold: 300 }, { desktop: { fontSize: "13px", fontWeight: "600" }, mobile: { marginRight: "auto" } })], { pad: "xs", rule: "thin", bg: "alt" }),
      ] },
      responsive: { mobile: { gap: "12px" } },
      widgets: ["heading", "text", "emailsubscribe", "copyright", "bizlegal", "link", "backtotop"],
    }, FAM),
  ],
};
