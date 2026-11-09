// Famille « Éditoriaux et magazines » — 7 modèles : journal, magazine, blog personnel, média numérique, revue culturelle, journal de quartier, lettre indépendante.
// Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md. Les noms de personnes et les adresses https://exemple.org sont des exemples à remplacer.
const { modele, identifiantModele, ambiance, C, L, T, Z, A, reseaux, menuDeroulant, colonnes12 } = require("../kit-conception");

// ls("Libellé>/page|Autre>/autre") → un élément « link » par lien (le code « links » du moteur est limité à 3 liens)
const ls = (liste) => liste.split("|").map((s) => { const [l, u] = s.split(">"); return `link|${l}|${u}`; });
const RSS = "link|Flux RSS (adresse d'exemple)|https://exemple.org/rss.xml";

// ── Ambiances propres à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────
const journal = ambiance({ key: "ed-journal", label: "Journal — papier crème et rouge", humeur: "edit", fond: "#f7f1e3", texte: "#1b1712", accent: "#9b1c1c", police: "font.source-serif-4", titres: "font.playfair-display" });
const magazine = ambiance({ key: "ed-magazine", label: "Magazine — blanc franc et orange", humeur: "light", fond: "#ffffff", texte: "#0b0b0c", accent: "#c2410c", police: "font.work-sans", titres: "font.bricolage-grotesque" });
const carnet = ambiance({ key: "ed-carnet", label: "Carnet — terre cuite chaleureuse", humeur: "soft", fond: "#fbefe3", texte: "#3a2418", accent: "#a8431f", police: "font.nunito-sans", titres: "font.young-serif" });
const numerique = ambiance({ key: "ed-numerique", label: "Média numérique — nuit et menthe", humeur: "dark", fond: "#0a0f1c", texte: "#e8edf7", accent: "#5eead4", police: "font.inter-tight", titres: "font.space-grotesk" });
const revue = ambiance({ key: "ed-revue", label: "Revue — vert encre et ivoire", humeur: "edit", fond: "#efeadc", texte: "#1d2a24", accent: "#1f5c46", police: "font.newsreader", titres: "font.cormorant-garamond" });
const quartier = ambiance({ key: "ed-quartier", label: "Quartier — bleu presse et sable", humeur: "light", fond: "#eef2f6", texte: "#10243e", accent: "#0b5cad", police: "font.public-sans", titres: "font.roboto-slab" });
const lettre = ambiance({ key: "ed-lettre", label: "Lettre — lilas profond", humeur: "brand", fond: "#2a1b4d", texte: "#f6f1ff", accent: "#fcd34d", police: "font.dm-sans", titres: "font.fraunces" });

const models = [
  // 1 ─ Journal : titre de une, double filet, quatre colonnes de rubriques et un bloc d'abonnement
  modele({
    id: identifiantModele("editoriaux", 1, "pied-de-journal"),
    name: "Pied de journal à double filet",
    family: "editoriaux",
    description: "Grand titre central entre filets, date du jour, quatre colonnes classées (rubriques, rédaction, archives, abonnement) et ligne légale : la dernière page d'un quotidien.",
    tags: ["journal", "quotidien", "rubriques", "archives", "abonnement"],
    identity: journal,
    structure: { rows: [
      Z(["date", "title:56", "text|L'information vérifiée et expliquée. Édition numérique mise à jour chaque jour."], { pad: "lg", rule: "double", max: "720px", gap: "12px" }),
      C([
        [3, "head|Rubriques", ...ls("Politique>/blog|Économie>/blog|Société>/blog|Culture>/blog|Sports>/blog")],
        [3, "head|La rédaction", ...ls("Charte éditoriale>/faq|L'équipe et les auteurs>/contact|Signaler une erreur>/contact|Proposer un sujet>/contact")],
        [3, "head|Archives", ...ls("Édition du jour>/blog|Par mois>/blog|Par année>/blog"), RSS],
        [3, "newsletter|L'essentiel du matin|Cinq articles à lire, chaque matin avant 7 h."],
      ], { pad: "lg", rule: "thick", min: "210px" }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
    ] },
    widgets: ["sitetitle", "dyntext", "link", "emailsubscribe", "copyright", "bizlegal"],
  }, "editoriaux"),

  // 2 ─ Magazine : grandes rubriques en titres, bande d'accent avec newsletter
  modele({
    id: identifiantModele("editoriaux", 2, "grandes-rubriques"),
    name: "Magazine à grandes rubriques",
    family: "editoriaux",
    description: "Quatre grandes rubriques en gros titres avec leurs sous-thèmes, bande orange pleine largeur pour s'abonner, puis réseaux, menu et retour en haut sur une seule ligne.",
    tags: ["magazine", "rubriques", "affiche", "newsletter"],
    identity: magazine,
    structure: { rows: [
      colonnes12([
        [3, "H|Société|2", ...ls("Enquêtes>/blog|Portraits>/blog|Reportages>/blog")],
        [3, "H|Culture|2", ...ls("Livres>/blog|Cinéma>/blog|Musique>/blog")],
        [3, "H|Idées|2", ...ls("Débats>/blog|Tribunes>/blog|Entretiens>/blog")],
        [3, "H|Vivre|2", ...ls("Voyages>/blog|Cuisine>/blog|Maison>/blog")],
      ], { pad: "xl", min: "200px" }),
      C([
        [7, "H|Ne ratez aucun numéro|2", "text|Le sommaire du mois, les coulisses de la rédaction et un article offert chaque semaine."],
        [5, "newsletter|Recevoir le sommaire|Un e-mail par mois, désinscription en un clic."],
      ], { bg: "accent", pad: "lg", min: "280px" }),
      T(["socials:instagram+youtube+facebook"], ["menuh:caps"], ["top"], { pad: "md" }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
    ] },
    widgets: ["heading", "link", "emailsubscribe", "social", "menu", "backtotop", "copyright", "bizlegal"],
  }, "editoriaux"),

  // 3 ─ Blog personnel : accueil chaleureux, cartes « à lire aussi » et abonnement
  modele({
    id: identifiantModele("editoriaux", 3, "carnet-chaleureux"),
    name: "Carnet de blog chaleureux",
    family: "editoriaux",
    description: "Un mot de bienvenue, des réseaux en grosses pastilles, puis deux cartes douces : les derniers billets à lire aussi et un abonnement honnête aux nouveautés.",
    tags: ["blog", "personnel", "chaleureux", "à lire aussi", "cartes"],
    identity: carnet,
    structure: { rows: [
      Z(["badge|Bienvenue", "title:36", "text|Des notes, des recettes ratées et des idées en chemin. Installez-vous, il y a toujours du café.", "socials:instagram+pinterest+youtube|big"], { pad: "xl", max: "640px", gap: "16px", rule: "none" }),
      C([
        [7, "head|À lire aussi", "recent:4", "link|Tous les billets|/blog"],
        [5, "newsletter|Les nouveautés par e-mail|Un petit mot de temps en temps, jamais de courrier indésirable."],
      ], { cards: true, pad: "lg", bg: "alt", min: "260px", rule: "none", max: "1000px" }),
      Z(["menuh", "copy:c"], { pad: "md", gap: "10px", rule: "none" }),
    ] },
    widgets: ["sitetitle", "querylist", "emailsubscribe", "social", "menu", "copyright"],
  }, "editoriaux"),

  // 4 ─ Média numérique sombre : barre d'outils + accordéon sur mobile
  modele({
    id: identifiantModele("editoriaux", 4, "media-numerique-nuit"),
    name: "Média numérique en mode nuit",
    family: "editoriaux",
    description: "Pied sombre pour média en ligne : logo, recherche et bouton d'abonnement en haut, cinq colonnes qui deviennent un accordéon sur mobile, réseaux, retour en haut et mentions.",
    tags: ["média", "numérique", "sombre", "accordéon", "recherche"],
    identity: numerique,
    structure: { rows: [
      T(["logo:40"], ["search"], ["cta|S'abonner|/inscription"], { pad: "md", rule: "none" }),
      A([
        [2, "Actualités", "menu"],
        [2, "Dossiers", ...ls("Enquêtes>/blog|Décryptages>/blog|Chiffres>/blog|Environnement>/blog")],
        [2, "Formats", ...ls("Podcasts>/blog|Vidéos>/blog|Newsletters>/inscription"), RSS],
        [3, "Les plus lus", "popular:4"],
        [3, "Régie publicitaire", "text|Offres éditoriales et espaces publicitaires : écrivez à la régie.", "link|Contacter la régie (exemple)|/contact"],
      ], { pad: "lg", rule: "accent", min: "170px" }),
      T(["copy"], ["socials:x+linkedin+youtube+tiktok|plain"], ["top"], { pad: "sm", rule: "thin" }),
      Z(["legallinks"], { pad: "xs", rule: "none" }),
    ] },
    widgets: ["sitelogo", "search", "menu", "querylist", "button", "social", "backtotop", "copyright", "bizlegal"],
  }, "editoriaux"),

  // 5 ─ Revue culturelle : colophon, sommaire et abonnement
  modele({
    id: identifiantModele("editoriaux", 5, "revue-et-colophon"),
    name: "Revue culturelle avec colophon",
    family: "editoriaux",
    description: "Pied de revue : titre et numéro à gauche, colophon (direction, rédaction, ISSN d'exemple), numéros par année, lettre d'abonnement, réseaux et conditions, filet fin en bas.",
    tags: ["revue", "culture", "colophon", "archives", "littéraire"],
    identity: revue,
    structure: { rows: [
      C([
        [4, "title:34", "text|Revue trimestrielle de littérature, d'art et de pensée. Numéro en cours : printemps.", "cta2|Lire le sommaire|/blog"],
        [4, "head|Colophon", "text|Direction de la publication : Camille Laurent (exemple)<br>Rédaction en chef : Inès Moreau (exemple)<br>ISSN 0000-0000 (exemple)", "legalinfo"],
        [4, "head|Numéros parus", ...ls("2026 — quatre numéros>/blog|2025 — quatre numéros>/blog|2024 — quatre numéros>/blog|Tous les numéros>/blog")],
      ], { pad: "xl", min: "230px", rule: "double" }),
      C([
        [5, "newsletter|La lettre de la revue|Un extrait inédit et l'agenda des parutions, une fois par trimestre."],
        [3, "head|Suivre", "socials:instagram+facebook+website|sq", RSS],
        [4, "head|Conditions", "legallinks:stack"],
      ], { pad: "lg", bg: "alt", min: "220px", rule: "none" }),
      L(["copy"], ["menuh:caps"], { pad: "sm", rule: "thin" }),
    ] },
    widgets: ["sitetitle", "button", "bizlegal", "emailsubscribe", "social", "copyright", "menu"],
  }, "editoriaux"),

  // 6 ─ Journal de quartier : trois cartes utiles et bande encre
  modele({
    id: identifiantModele("editoriaux", 6, "journal-de-quartier"),
    name: "Journal de quartier en trois cartes",
    family: "editoriaux",
    description: "Trois cartes pratiques pour un journal local : les articles les plus lus, les archives mois par mois et la permanence de la rédaction avec coordonnées ; bande encre pour les réseaux.",
    tags: ["local", "quartier", "cartes", "plus lus", "archives", "contact"],
    identity: quartier,
    structure: { rows: [
      C([
        [4, "head|Les plus lus", "popular:4", "link|Voir toute l'actualité|/blog"],
        [4, "head|Archives par mois", ...ls("Novembre 2026>/blog|Octobre 2026>/blog|Septembre 2026>/blog|Août 2026>/blog|Années précédentes>/blog")],
        [4, "head|La rédaction", "contact", "hours|Permanence"],
      ], { cards: true, pad: "xl", min: "250px", rule: "accent" }),
      T(["title:24"], ["socials:facebook+instagram+whatsapp"], ["cta|Signaler une info|/contact"], { bg: "ink", pad: "md", rule: "none" }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "none" }),
    ] },
    widgets: ["querylist", "bizcontact", "bizhours", "sitetitle", "social", "button", "copyright", "bizlegal"],
  }, "editoriaux"),

  // 7 ─ Lettre indépendante : l'abonnement d'abord, archives repliables
  modele({
    id: identifiantModele("editoriaux", 7, "lettre-independante"),
    name: "Lettre indépendante, abonnement d'abord",
    family: "editoriaux",
    description: "Pied de lettre indépendante : grand appel à s'abonner sur fond lilas, archives repliables, mots sur la ligne éditoriale, réseaux en pastilles et flux RSS d'exemple.",
    tags: ["newsletter", "indépendant", "abonnement", "archives", "ligne éditoriale"],
    identity: lettre,
    structure: { rows: [
      C([
        [6, "H|Lisez-nous librement|1", "text|Une lettre sans publicité ni algorithme, financée par ses lecteurs. Le premier numéro est offert."],
        [6, "newsletter|S'abonner gratuitement|Chaque jeudi, un sujet, une analyse, trois liens. Désabonnement à tout moment."],
      ], { pad: "xl", min: "300px", rule: "none" }),
      C([
        [4, menuDeroulant("Archives par année", [...ls("2026 — 38 numéros>/blog|2025 — 52 numéros>/blog|2024 — 52 numéros>/blog")])],
        [4, "head|Notre ligne", ...ls("Charte éditoriale>/faq|Qui finance la lettre ?>/faq|Corrections>/contact")],
        [4, "head|Nous suivre", reseaux([{ network: "linkedin", url: "https://www.linkedin.com/" }, { network: "threads", url: "https://www.threads.net/" }, { network: "reddit", url: "https://www.reddit.com/" }], { forme: "circle" }), RSS],
      ], { pad: "lg", bg: "alt", min: "220px", rule: "thin" }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "none" }),
    ] },
    widgets: ["emailsubscribe", "social", "copyright", "bizlegal"],
  }, "editoriaux"),
];

module.exports = {
  key: "editoriaux",
  label: "Éditoriaux et magazines",
  description: "Médias : rubriques, archives, auteurs, colophon, abonnement, articles récents.",
  target: 7,
  built: true,
  models,
};
