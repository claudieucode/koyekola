// Famille « Créatifs et portfolios » — 6 modèles : pied-affiche, cadre d'exposition, invitation à écrire, index de projets et de réseaux, signature d'artiste, bande d'annonce.
// Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md. Les noms de studios, d'artistes et les adresses de réseaux sont des EXEMPLES à remplacer.
const { modele, identifiantModele, ambiance, C, L, T, Z, colonnes12, widget, reseaux } = require("../kit-conception");
const { item } = require("../moteur");

const FAM = "creatifs-portfolios";

// ── Aides LOCALES (le kit n'a pas ces éléments expressifs). Chacune renvoie une fonction (k, env, center) → nœud, finie par le moteur (survol, focus, 44 px sur mobile). ────────────
// Titre du site en très grand, taille par écran (le nom du site vient des réglages du site)
const geant = (d, t, m, o = {}) => (k, env, center) => {
  const n = k.siteTitle({ fontSize: `${d}px`, lineHeight: 0.95, letterSpacing: o.serre || "-0.03em", width: "100%", overflowWrap: "anywhere", fontWeight: o.poids || k.S.weight, ...(center ? { textAlign: "center" } : {}) });
  n.styles.tablet = { fontSize: `${t}px` }; n.styles.mobile = { fontSize: `${m}px` };
  return n;
};
// Grand titre de texte (fictif ou éditable), taille par écran
const affiche = (texte, d, t, m, o = {}) => (k, env, center) =>
  k.H(texte, "2", { fontSize: `${d}px`, lineHeight: o.lh || 1, letterSpacing: o.serre || "-0.02em", fontFamily: k.S.head, overflowWrap: "anywhere", ...(o.poids ? { fontWeight: o.poids } : {}), ...(o.largeur ? { maxWidth: o.largeur } : {}), ...(center ? { textAlign: "center" } : {}) },
    { fontSize: `${t}px` }, { fontSize: `${m}px` });
const phrase = (texte, { taille = 16, largeur = "420px", fg = false } = {}) => (k, env, center) =>
  k.T(`<p>${texte}</p>`, { color: fg ? k.S.fg : k.S.mute, fontSize: `${taille}px`, fontFamily: k.S.font, maxWidth: largeur, ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) });
// Petite pastille de disponibilité (texte d'exemple, à remplacer)
const dispo = (texte) => (k, env, center) =>
  k.T(`<p><strong>${texte}</strong></p>`, { fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: k.S.font, color: k.S.onAccent, backgroundColor: k.S.accent, borderRadius: k.S.btnRadius, paddingTop: "6px", paddingBottom: "6px", paddingLeft: "14px", paddingRight: "14px", ...(center ? { alignSelf: "center" } : {}) });
// Liste de liens avec numéro (index de projets)
const index = (liste, { taille = 20 } = {}) => (k, env, center) =>
  k.col(liste.map(([num, l, u]) => k.row([k.T(`<p>${num}</p>`, { color: k.S.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", fontFamily: k.S.font, minWidth: "28px" }), k.LINK(l, u, { fontSize: `${taille}px`, fontWeight: "600", fontFamily: k.S.head, lineHeight: 1.2 })], { gap: "10px", flexWrap: "nowrap", alignItems: "baseline" })),
    { gap: "6px", alignItems: center ? "center" : "flex-start" });
// Carte de réseau de création : numéro, nom en grand, une ligne, lien « Ouvrir » vers l'adresse d'exemple
const carte = (num, nom, texte, url) => (k) =>
  k.col([
    k.T(`<p>${num}</p>`, { color: k.S.accent, fontSize: "13px", fontWeight: "700", letterSpacing: "0.12em", fontFamily: k.S.font }),
    k.H(nom, "3", { fontSize: "30px", lineHeight: 1.05, letterSpacing: "-0.02em", fontFamily: k.S.head }, { fontSize: "30px" }, { fontSize: "26px" }),
    k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "14px", fontFamily: k.S.font }),
    k.LINK("Ouvrir (exemple) ↗", url, { fontSize: "14px", fontWeight: "700", fontFamily: k.S.font }),
  ], { gap: "10px", alignItems: "flex-start" });
// Mots d'annonce séparés par des étoiles, en très gros : bande « défilante » statique (aucun mouvement, aucun débordement)
const annonce = (mots, d, t, m) => (k, env, center) =>
  k.T(`<p>${mots.join(" ✦ ")}</p>`, { fontSize: `${d}px`, lineHeight: 1.05, letterSpacing: "0.01em", textTransform: "uppercase", fontFamily: k.S.head, color: k.S.fg, overflowWrap: "anywhere", ...(center ? { textAlign: "center" } : {}) },
    { fontSize: `${t}px` }, { fontSize: `${m}px` });
// Plusieurs éléments côte à côte (boutons de la pile centrée) ; passent à la ligne sur mobile
const cote = (codes) => (k, env, center) => k.row(codes.map((c) => item(k, c, env, center)), { gap: "16px", ...(center ? { justifyContent: "center" } : {}) });
const ls = (liste) => liste.split("|").map((s) => { const [l, u] = s.split(">"); return `link|${l}|${u}`; });

// ── Ambiances propres à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────
const affichage = ambiance({ key: "cr-affiche", label: "Affiche — charbon et orange vif", humeur: "dark", fond: "#141414", texte: "#f4efe6", accent: "#ff5a1f", police: "font.instrument-sans", titres: "font.syne" });
const vernissage = ambiance({ key: "cr-vernissage", label: "Vernissage — blanc galerie et vermillon", humeur: "edit", fond: "#faf8f4", texte: "#161412", accent: "#c8321e", police: "font.work-sans", titres: "font.fraunces" });
const soleil = ambiance({ key: "cr-soleil", label: "Soleil — jaune franc et encre", humeur: "brand", fond: "#ffd93d", texte: "#17120a", accent: "#17120a", police: "font.work-sans", titres: "font.dela-gothic-one", ink: "#17120a" });
const beton = ambiance({ key: "cr-beton", label: "Béton — gris clair et bleu électrique", humeur: "light", fond: "#e8e6e1", texte: "#12131a", accent: "#2b3cff", police: "font.familjen-grotesk", titres: "font.unbounded" });
const aquarelle = ambiance({ key: "cr-aquarelle", label: "Aquarelle — crème douce et prune", humeur: "soft", fond: "#f6f0e8", texte: "#2c2430", accent: "#7a3b8f", police: "font.nunito-sans", titres: "font.instrument-serif" });
const neon = ambiance({ key: "cr-neon", label: "Néon — nuit violette et rose", humeur: "dark", fond: "#1a0f2e", texte: "#f3ecff", accent: "#ff4fd8", police: "font.dm-sans", titres: "font.bebas-neue" });

const models = [
  // 1 ─ Pied-affiche : nom du studio en titre géant, puis trois zones asymétriques
  modele({
    id: identifiantModele(FAM, 1, "pied-affiche-titre-geant"),
    name: "Pied-affiche au titre géant",
    family: FAM,
    description: "Le nom du studio occupe toute la largeur en très grandes lettres, comme une affiche ; dessous, trois zones inégales : travaux récents numérotés, studio, et grand appel à écrire avec coordonnées.",
    tags: ["affiche", "titre géant", "studio", "asymétrique", "sombre"],
    identity: affichage,
    structure: { rows: [
      C([[12, geant(124, 84, 46, { poids: "800" }), phrase("Studio de design et d'image. Identité, affiches, sites : des projets qui ont du caractère.", { taille: 18, largeur: "560px", fg: true })]], { pad: "xl", gap: "36px", rule: "none" }),
      colonnes12([
        [5, "head|Travaux récents (exemples)", index([["01", "Maison Aube — identité", "/blog"], ["02", "Festival Brume — affiches", "/blog"], ["03", "Atelier Nord — site", "/blog"], ["04", "Tous les projets", "/blog"]], { taille: 22 })],
        [3, "head|Le studio", ...ls("À propos>/faq|Services>/contact|Journal>/blog"), "top"],
        [4, "head|Écrire au studio", "contact", "cta|Démarrer un projet|/contact", "socials:instagram+linkedin+youtube"],
      ], { pad: "lg", rule: "accent", min: "230px" }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
    ] },
    responsive: { mobile: { gap: "28px" } },
    widgets: ["sitetitle", "text", "heading", "link", "bizcontact", "button", "social", "backtotop", "copyright", "bizlegal"],
  }, FAM),

  // 2 ─ Cadre d'exposition : grand cadre à trait épais autour de trois colonnes, puis ligne fine
  modele({
    id: identifiantModele(FAM, 2, "cadre-exposition"),
    name: "Cadre d'exposition",
    family: FAM,
    description: "Trois colonnes enfermées dans un grand cadre noir comme un cartel de galerie : présentation de l'artiste et disponibilité, index des séries, réseaux et contact. Ligne fine de mentions dessous.",
    tags: ["cadre", "galerie", "artiste", "contour", "clair"],
    identity: vernissage,
    structure: { rows: [
      C([
        [4, "title:34", dispo("Ouvert aux commandes (exemple)"), "about|Photographe et plasticienne. Séries, commandes éditoriales et expositions : l'image comme une façon d'habiter le monde."],
        [4, "head|Séries en cours", index([["I", "Terrains vagues", "/blog"], ["II", "Portraits de nuit", "/blog"], ["III", "Archives de sel", "/blog"], ["IV", "Expositions", "/blog"]], { taille: 22 })],
        [4, "head|Suivre et écrire", "socials:instagram+pinterest+website|big", "email", "cta2|Demander le dossier|/contact"],
      ], { frame: true, pad: "xl", min: "230px", max: "1180px", rule: "none" }),
      L(["copy", "top"], ["legallinks"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "28px" } },
    widgets: ["sitetitle", "text", "heading", "link", "social", "bizemail", "button", "backtotop", "copyright", "bizlegal"],
  }, FAM),

  // 3 ─ Invitation à écrire : pile centrée, très grand « Dites bonjour », e-mail en gros
  modele({
    id: identifiantModele(FAM, 3, "invitation-a-ecrire"),
    name: "Invitation à écrire",
    family: FAM,
    description: "Fond jaune franc, pile centrée : pastille de disponibilité, immense « Dites bonjour. », adresse e-mail en gros, deux boutons (écrire, voir les travaux) et réseaux en simples icônes.",
    tags: ["contact", "invitation", "centré", "freelance", "jaune"],
    identity: soleil,
    structure: { rows: [
      Z([dispo("Ouvert aux missions dès janvier (exemple)"), affiche("Dites bonjour.", 132, 88, 52, { poids: "400", serre: "-0.03em", lh: 0.95 }), widget("bizemail", { prefix: "", text: "", showIcon: true }, { fontSize: "28px", fontWeight: "700", textAlign: "center" }, { fontSize: "24px" }, { fontSize: "20px" }), cote(["cta|Écrire un message|/contact", "cta2|Voir les travaux|/blog"]), "socials:instagram+linkedin+youtube+x|big"], { pad: "xl", gap: "28px", max: "900px", rule: "none" }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "thick" }),
    ] },
    responsive: { mobile: { gap: "18px" } },
    widgets: ["text", "heading", "bizemail", "button", "social", "copyright", "bizlegal"],
  }, FAM),

  // 4 ─ Index de projets et de réseaux : quatre cartes de plateformes de création
  modele({
    id: identifiantModele(FAM, 4, "index-projets-reseaux"),
    name: "Index de projets et de réseaux",
    family: FAM,
    description: "Une ligne de titre puis quatre grandes cartes numérotées (Behance, Dribbble, Vimeo, Instagram) pour retrouver le travail partout, et une bande bleue qui invite à envoyer un brief.",
    tags: ["portfolio", "cartes", "plateformes", "behance", "dribbble"],
    identity: beton,
    structure: { rows: [
      L([affiche("Mon travail, partout ailleurs.", 44, 36, 28, { largeur: "640px", lh: 1.05 })], ["cta2|Journal de bord|/blog"], { pad: "lg", rule: "none" }),
      C([
        [3, carte("01", "Behance", "Études de cas complètes : identité, packaging, direction artistique.", "https://www.behance.net/")],
        [3, carte("02", "Dribbble", "Interfaces, icônes et petits essais graphiques, au jour le jour.", "https://dribbble.com/")],
        [3, carte("03", "Vimeo", "Films courts, animations et making-of en haute qualité.", "https://vimeo.com/")],
        [3, carte("04", "Instagram", "Les coulisses de l'atelier, croquis et travaux en cours.", "https://www.instagram.com/")],
      ], { cards: true, pad: "lg", min: "220px", rule: "none" }),
      C([
        [8, affiche("Un brief ? Envoyez-le.", 34, 30, 26, { lh: 1.05 }), "text|Réponse sous deux jours ouvrés. Adresses des plateformes ci-dessus : exemples à remplacer."],
        [4, "cta|Envoyer un brief|/contact", "email"],
      ], { bg: "accent", pad: "lg", min: "260px" }),
      L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "16px" } },
    widgets: ["heading", "text", "link", "button", "bizemail", "copyright", "bizlegal", "backtotop"],
  }, FAM),

  // 5 ─ Signature d'artiste : une seule ligne légère, nom, mention, réseaux
  modele({
    id: identifiantModele(FAM, 5, "signature-artiste"),
    name: "Signature d'artiste",
    family: FAM,
    description: "Pied très léger pour un portfolio d'illustration : le nom en élégantes lettres à empattement, une pastille « disponible », deux réseaux en icônes, et une ligne de mentions sous un filet à l'encre.",
    tags: ["minimal", "illustration", "signature", "discret", "crème"],
    identity: aquarelle,
    structure: { rows: [
      L(["title:34", dispo("Disponible (exemple)")], [reseaux([{ network: "instagram", url: "https://www.instagram.com/" }, { network: "pinterest", url: "https://www.pinterest.com/" }, { network: "website", url: "/" }], { taille: 40, forme: "plain" }), "top"], { pad: "lg", rule: "thin", max: "1180px" }),
      L(["copy"], ["legallinks"], { pad: "xs", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "10px" } },
    widgets: ["sitetitle", "text", "social", "backtotop", "copyright", "bizlegal"],
  }, FAM),

  // 6 ─ Bande d'annonce : bandeau de mots en très gros, puis trois colonnes avec lettre d'information
  modele({
    id: identifiantModele(FAM, 6, "bande-annonce-neon"),
    name: "Bande d'annonce néon",
    family: FAM,
    description: "Un bandeau rose pleine largeur répète en gros « Disponible, Portfolio, Contact » comme une enseigne ; dessous, menu, coordonnées et lettre d'information du studio, sur nuit violette.",
    tags: ["bandeau", "enseigne", "studio", "newsletter", "nuit"],
    identity: neon,
    structure: { rows: [
      Z([annonce(["Disponible", "Portfolio", "Contact", "Disponible"], 64, 44, 28)], { bg: "accent", pad: "md", max: "1320px", rule: "none" }),
      colonnes12([
        [3, "logo:48", "about|Collectif de motion design et d'illustration. Films, identités animées, clips."],
        [3, "head|Explorer", ...ls("Accueil>/|Journal>/blog|Questions fréquentes>/faq|Contact>/contact")],
        [2, "head|Contact", "contact", "socials:instagram+youtube+tiktok"],
        [4, "newsletter|Les coulisses du studio|Un e-mail par mois : projets en cours et appels à collaborer."],
      ], { pad: "xl", min: "220px", rule: "none" }),
      L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
    ] },
    responsive: { mobile: { gap: "28px" } },
    widgets: ["text", "sitelogo", "link", "bizcontact", "social", "emailsubscribe", "copyright", "bizlegal", "backtotop"],
  }, FAM),
];

module.exports = {
  key: "creatifs-portfolios",
  label: "Créatifs et portfolios",
  description: "Compositions expressives : titre géant, cadre, asymétrie, grandes icônes de réseaux.",
  target: 6,
  built: true,
  models,
};
