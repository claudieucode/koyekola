// Famille « SaaS et technologie » — 8 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Marque de démonstration : « Kernlab » (plateforme fictive). Les liens https://exemple.fr/… sont des liens D'EXEMPLE à remplacer ; les badges de conformité sont marqués « exemple ».
const { modele, identifiantModele, ambiance, C, L, T, Z, A, reseaux } = require("../kit-conception");
const { statut, langues, pastille, code, fil, navh } = require("../saas-tech-aide");

const F = "saas-tech";
const E = "https://exemple.fr";
// Colonne de liens de longueur libre (le code « links » est limité à 3 liens) : même rendu que « links »
const liens = (list) => (k, env, center) => k.col(list.map((it) => { const [label, url] = it.split(">"); return k.LINK(label, url, { fontSize: "14px", fontWeight: "500" }); }), { gap: "8px", alignItems: "flex-start" });
const ids = (n, s) => identifiantModele(F, n, s);

// Réseaux typiques d'un éditeur de logiciel
const RESEAUX = reseaux([{ network: "x", url: "https://x.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }], { taille: 32, forme: "plain" });
const RESEAUX_DEV = reseaux([{ network: "website", url: "https://github.com/" }, { network: "x", url: "https://x.com/" }, { network: "youtube", url: "https://www.youtube.com/" }], { taille: 40, forme: "square" });

// Ambiances propres à la famille (contrastes AA vérifiés à la création)
const nuitCobalt = ambiance({ key: "saas-nuit-cobalt", label: "Nuit cobalt", humeur: "dark", fond: "#0b1020", texte: "#e6ebff", accent: "#8fa8ff", police: "font.inter", titres: "font.sora" });
const papierNet = ambiance({ key: "saas-papier-net", label: "Papier net", humeur: "light", fond: "#ffffff", texte: "#0f172a", accent: "#0f172a", police: "font.figtree", titres: "font.figtree" });
const indigoEssai = ambiance({ key: "saas-indigo-essai", label: "Indigo d'essai", humeur: "brand", fond: "#f8f7ff", texte: "#1e1b4b", accent: "#4338ca", police: "font.plus-jakarta-sans", titres: "font.bricolage-grotesque" });
const terminal = ambiance({ key: "saas-terminal", label: "Terminal vert", humeur: "dark", fond: "#07100d", texte: "#d1fae5", accent: "#34d399", police: "font.jetbrains-mono", titres: "font.jetbrains-mono" });
const ciel = ambiance({ key: "saas-ciel-statut", label: "Ciel de statut", humeur: "light", fond: "#f1f5f9", texte: "#0f172a", accent: "#0369a1", police: "font.ibm-plex-sans", titres: "font.ibm-plex-sans" });
const mandarine = ambiance({ key: "saas-mandarine", label: "Mandarine startup", humeur: "soft", fond: "#fff7ed", texte: "#431407", accent: "#ea580c", police: "font.nunito", titres: "font.fredoka" });
const journal = ambiance({ key: "saas-journal-produit", label: "Journal du produit", humeur: "edit", fond: "#fafaf9", texte: "#1c1917", accent: "#0f766e", police: "font.work-sans", titres: "font.fraunces" });
const lagonTech = ambiance({ key: "saas-lagon-tech", label: "Lagon d'intégrations", humeur: "brand", fond: "#0e3b43", texte: "#ecfeff", accent: "#fcd34d", police: "font.manrope", titres: "font.manrope" });

const PRODUIT = [`Fonctionnalités>${E}/produit`, `Tarifs>${E}/tarifs`, `Intégrations>${E}/integrations`, `Nouveautés>${E}/changelog`, `Feuille de route>${E}/feuille-de-route`];
const RESSOURCES = [`Documentation>${E}/docs`, `Guides>${E}/guides`, `Centre d'aide>/faq`, `Blog>/blog`, `Webinaires>${E}/webinaires`];
const DEVS = [`Référence de l'API>${E}/api`, `SDK et bibliothèques>${E}/sdk`, `Démarrage rapide>${E}/docs/demarrage`, `Webhooks>${E}/docs/webhooks`, `Statut de l'API>${E}/statut`];
const ENTREPRISE = [`À propos>${E}/a-propos`, `Carrières>${E}/carrieres`, `Presse>${E}/presse`, `Partenaires>${E}/partenaires`, `Contact>/contact`];

module.exports = {
  key: "saas-tech",
  label: "SaaS et technologie",
  description: "Logiciels : produit, ressources, documentation, entreprise, essai gratuit, statut du service, colonnes denses.",
  target: 8,
  built: true,
  models: [
    modele({
      id: ids(1, "mega-pied-six-colonnes"),
      name: "Méga-pied produit à six colonnes",
      family: F,
      description: "Pied dense nuit cobalt : marque, réseaux et statut, cinq colonnes de liens (produit, ressources, développeurs, entreprise, communauté) ; liens légaux en bas ; accordéon sur mobile, langues d'exemple et retour en haut.",
      tags: ["saas", "dense", "six colonnes", "sombre", "accordéon"],
      identity: nuitCobalt,
      structure: { rows: [
        A([
          [2, "À propos", "logo:36", "text|Kernlab : marque fictive de démonstration.", RESEAUX, statut("Systèmes opérationnels")],
          [2, "Produit", liens(PRODUIT)],
          [2, "Ressources", liens(RESSOURCES)],
          [2, "Développeurs", liens(DEVS)],
          [2, "Entreprise", liens(ENTREPRISE)],
          [2, "Communauté", liens([`Forum d'entraide>${E}/forum`, `Dépôt GitHub>https://github.com/`, `Événements>${E}/evenements`, `Programme partenaires>${E}/partenaires`, `Journal des versions>${E}/changelog`])],
        ], { pad: "xl", min: "140px", mobile: { gap: "4px" } }),
        L(["copy", "legallinks"], [langues(), "top"], { pad: "sm", rule: "thin", bg: "alt" }),
      ] },
    }, F),
    modele({
      id: ids(2, "pied-minimal-produit"),
      name: "Pied minimal d'application",
      family: F,
      description: "Pied très léger pour une application : logo, menu du pied et bouton d'essai sur une ligne, puis mention de copyright, lien de statut et liens légaux. Clair et sobre, sans colonnes.",
      tags: ["saas", "minimal", "ligne", "clair", "essai"],
      identity: papierNet,
      structure: { rows: [
        T(["logo:32"], [navh(`Produit>${E}/produit`, `Tarifs>${E}/tarifs`, `Docs>${E}/docs`, "Aide>/faq")], ["cta|Essai gratuit|/inscription"], { pad: "lg", max: "1080px", mobile: { gap: "12px" } }),
        L(["copy"], [statut("Service opérationnel"), "legallinks"], { pad: "sm", rule: "thin", max: "1080px", mobile: { gap: "4px" } }),
      ] },
    }, F),
    modele({
      id: ids(3, "grand-appel-essai-gratuit"),
      name: "Grand appel à l'essai gratuit",
      family: F,
      description: "Grande bande colorée centrée qui invite à démarrer l'essai gratuit (bouton plein et bouton contour), suivie d'un pied en quatre colonnes avec réseaux et d'une ligne légale à trois zones.",
      tags: ["saas", "essai gratuit", "appel à l'action", "bande colorée"],
      identity: indigoEssai,
      structure: { rows: [
        Z(["badge|14 jours offerts, sans carte", "H|Prêt à livrer plus vite ?|1", "text|Créez votre espace Kernlab en deux minutes et invitez votre équipe quand vous voulez.", "cta|Démarrer l'essai gratuit|/inscription", "cta2|Parler à un expert|/contact"], { bg: "accent", pad: "xl", max: "760px", gap: "16px", rule: "none" }),
        C([
          [4, "logo:36", "about|Kernlab (marque fictive) : une plateforme simple pour piloter vos projets numériques.", RESEAUX],
          [2, "head|Produit", liens(PRODUIT.slice(0, 4))],
          [3, "head|Ressources", liens(RESSOURCES.slice(0, 4))],
          [3, "head|Société", liens(ENTREPRISE.slice(0, 4))],
        ], { pad: "xl" }),
        L(["copy", langues()], ["legallinks"], { pad: "sm", rule: "thin", mobile: { gap: "4px" } }),
      ] },
    }, F),
    modele({
      id: ids(4, "pied-developpeurs-api"),
      name: "Pied développeurs et API",
      family: F,
      description: "Ambiance terminal vert : trois cartes (démarrage avec ligne de commande d'exemple, référence de l'API et SDK, communauté avec GitHub), puis statut de l'API et liens légaux.",
      tags: ["saas", "développeurs", "api", "cartes", "sombre"],
      identity: terminal,
      structure: { rows: [
        C([
          [4, "badge|API v2", "H|Construisez sur Kernlab|3", code("npm install @kernlab/sdk"), "text|Commande d'exemple pour une marque fictive.", `cta2|Lire la documentation|${E}/docs`],
          [4, "head|Référence et SDK", liens(DEVS)],
          [4, "head|Communauté", RESEAUX_DEV, `links|Dépôt GitHub>https://github.com/|Forum d'entraide>${E}/forum|Journal des versions>${E}/changelog`],
        ], { pad: "xl", cards: true, gap: "24px", min: "240px" }),
        L([statut("API opérationnelle · 99,98 % ce mois (exemple)")], ["copy", "top"], { pad: "sm", rule: "accent" }),
        Z(["legallinks"], { pad: "sm", bg: "alt" }),
      ] },
    }, F),
    modele({
      id: ids(5, "statut-et-securite"),
      name: "Statut du service et sécurité",
      family: F,
      description: "Pied de confiance : bandeau de statut avec badges de conformité marqués exemples, puis marque et coordonnées, colonne sécurité (centre de confiance), colonne service (incidents) et ligne légale.",
      tags: ["saas", "statut", "sécurité", "conformité", "confiance"],
      identity: ciel,
      structure: { rows: [
        L([statut("Tous les systèmes opérationnels")], [pastille("SOC 2 (exemple)"), pastille("RGPD (exemple)"), pastille("ISO 27001 (exemple)")], { bg: "alt", pad: "md", rule: "none", mobile: { gap: "12px" } }),
        C([
          [4, "logo:36", "about|Kernlab (marque fictive) : disponibilité, chiffrement et transparence sur chaque incident.", "contact"],
          [2, "head|Produit", liens(PRODUIT.slice(0, 3))],
          [3, "head|Sécurité et conformité", `links|Centre de confiance>${E}/securite|Rapports d'audit>${E}/securite/audits|Signaler une faille>${E}/securite/divulgation`],
          [3, "head|Service", `links|Statut en direct>${E}/statut|Historique des incidents>${E}/statut/historique|Engagements de service>${E}/sla`],
        ], { pad: "xl" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin", mobile: { gap: "4px" } }),
      ] },
    }, F),
    modele({
      id: ids(6, "startup-decontracte-centre"),
      name: "Startup décontractée centrée",
      family: F,
      description: "Pied chaleureux et arrondi : tout est centré, avec un badge de recrutement, le logo, une phrase d'accroche, le menu, la lettre d'information, de gros réseaux et une dernière ligne légale.",
      tags: ["saas", "startup", "centré", "newsletter", "décontracté"],
      identity: mandarine,
      structure: { rows: [
        Z(["badge|On recrute !", "logo:48", "H|On construit, on partage, on s'amuse.|2", navh(`Produit>${E}/produit`, `Équipe>${E}/a-propos`, `Carrières>${E}/carrieres`, "Blog>/blog", "Contact>/contact"), "newsletter|La lettre de la semaine|Une idée, un tutoriel, zéro spam.", "socials:x+linkedin+youtube+instagram|big"], { pad: "xl", max: "760px", gap: "20px", rule: "none" }),
        Z(["copy:c", "legallinks"], { bg: "alt", pad: "md", rule: "none", gap: "8px" }),
      ] },
    }, F),
    modele({
      id: ids(7, "lettre-et-nouveautes"),
      name: "Lettre d'information et nouveautés",
      family: F,
      description: "Style journal du produit : grande colonne d'abonnement à gauche, liens produit et entreprise, et colonne des dernières nouveautés (articles du blog), puis ligne avec langues d'exemple et retour en haut.",
      tags: ["saas", "newsletter", "nouveautés", "changelog", "journal"],
      identity: journal,
      structure: { rows: [
        C([
          [5, "H|Le courrier du produit|2", "newsletter|Recevez les nouveautés|Une fois par mois, les nouvelles fonctions et nos coulisses.", RESEAUX],
          [2, "head|Produit", liens(PRODUIT.slice(0, 4))],
          [2, "head|Entreprise", liens(ENTREPRISE.slice(0, 4))],
          [3, "head|Dernières nouveautés", "recent:3", "link|Tout le journal|/blog"],
        ], { pad: "xl", rule: "thick" }),
        T(["copy"], [fil("Langue :")], ["top"], { pad: "sm", rule: "thin", mobile: { gap: "4px" } }),
      ] },
    }, F),
    modele({
      id: ids(8, "integrations-et-expert"),
      name: "Intégrations et parler à un expert",
      family: F,
      description: "Pied teal avec ligne de tête (logo, liens rapides, bouton de démonstration) puis quatre volets repliables sur mobile : formulaire de contact, intégrations, produit et coordonnées.",
      tags: ["saas", "intégrations", "formulaire", "démonstration", "accordéon"],
      identity: lagonTech,
      structure: { rows: [
        L(["logo:32", navh(`Documentation>${E}/docs`, `Statut>${E}/statut`, `Tarifs>${E}/tarifs`)], ["cta2|Réserver une démo|/contact"], { bg: "alt", pad: "md", rule: "none", mobile: { gap: "12px" } }),
        A([
          [5, "Parler à un expert", "contactform|Une question avant de choisir ?|Décrivez votre besoin, un expert vous répond."],
          [2, "Intégrations", liens([`Slack>${E}/integrations/slack`, `GitHub>${E}/integrations/github`, `Zapier>${E}/integrations/zapier`, `Toutes les intégrations>${E}/integrations`])],
          [2, "Produit", liens(PRODUIT.slice(0, 4))],
          [3, "Nous joindre", "contact"],
        ], { pad: "xl", min: "170px", mobile: { gap: "4px" } }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin", mobile: { gap: "4px" } }),
      ] },
    }, F),
  ],
};
