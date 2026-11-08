// Famille « Corporate » — 8 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Entreprises, conseil, cabinets : deux niveaux de navigation, 4 à 5 colonnes, bandeau d'appel, présentation de marque, informations d'entreprise, sièges, certifications (EXEMPLES), réseaux professionnels, accordéon mobile.
// Toutes les coordonnées viennent des Données de l'entreprise (widgets) ; les noms de villes, certifications et chartes sont des EXEMPLES, toujours marqués « (exemple) ».
const { modele, identifiantModele, C, L, T, Z, A, colonnes12, ambiance } = require("../kit-conception");
// Aide locale (le kit n'a pas de grand titre d'affiche réglable par écran) : heading dont la taille change par écran ; la police de titre vient de l'ambiance.
const grandTitre = (texte, o = {}) => (k, env, center) => k.H(texte, "2", { fontSize: "64px", lineHeight: 1.05, fontWeight: "700", ...(center ? { textAlign: "center" } : {}), ...(o.desktop || {}) },
  { fontSize: "44px", ...(o.tablet || {}) }, { fontSize: "34px", ...(o.mobile || {}) });

// Huit ambiances propres à la famille (fond, texte, accent ; le reste est calculé et les contrastes AA sont vérifiés)
const nuit = ambiance({ key: "corp-nuit", label: "Bleu nuit et cyan", humeur: "brand", fond: "#0e2a47", texte: "#f2f6fb", accent: "#4cc3d9", police: "font.manrope", titres: "font.manrope" });
const rouge = ambiance({ key: "corp-rouge", label: "Blanc et rouge institutionnel", humeur: "light", fond: "#ffffff", texte: "#14213d", accent: "#b3122b", police: "font.source-sans-3", titres: "font.merriweather" });
const ardoise = ambiance({ key: "corp-ardoise", label: "Ardoise et menthe", humeur: "dark", fond: "#14181f", texte: "#e8ecf1", accent: "#7dd3a8", police: "font.inter-tight", titres: "font.plus-jakarta-sans" });
const ivoire = ambiance({ key: "corp-ivoire", label: "Ivoire et terre cuite", humeur: "soft", fond: "#f7f2e9", texte: "#2a2420", accent: "#8a4b2a", police: "font.karla", titres: "font.playfair-display" });
const foret = ambiance({ key: "corp-foret", label: "Vert forêt", humeur: "soft", fond: "#eef4ef", texte: "#14301f", accent: "#1f6f43", police: "font.figtree", titres: "font.outfit" });
const bordeaux = ambiance({ key: "corp-bordeaux", label: "Bordeaux sur crème", humeur: "edit", fond: "#fbf8f6", texte: "#2b1318", accent: "#7a1f33", police: "font.pt-sans", titres: "font.pt-serif" });
const or = ambiance({ key: "corp-or", label: "Noir et or", humeur: "dark", fond: "#0a0a0a", texte: "#f2efe6", accent: "#d4a23a", police: "font.barlow", titres: "font.barlow-condensed" });
const lagune = ambiance({ key: "corp-lagune", label: "Lagune", humeur: "light", fond: "#f1f7f8", texte: "#0d2f36", accent: "#0e7490", police: "font.work-sans", titres: "font.montserrat" });

// Liste de liens verticale sans limite de nombre (l'élément « links » du moteur n'en prend que 3) : « Libellé>/page »
const liens = (list) => (k, env, center) => k.col(list.map((s) => { const [label, url] = s.split(">"); return k.LINK(label, url, { fontSize: "14px", fontWeight: "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap: "8px", alignItems: center ? "center" : "flex-start" });

// Pages légales en pile alignée (Cookies, Contact, puis les pages légales renseignées dans les Données de l'entreprise ; aucun lien mort pour les visiteurs)
const pagesLegales = (k) => k.col([k.LINK("Cookies", "/cookies", { fontSize: "14px", fontWeight: "500" }), k.LINK("Contact", "/contact", { fontSize: "14px", fontWeight: "500" }),
  k.W("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout: "stack", hintMissing: true }, { color: k.S.fg, fontSize: "14px", fontWeight: "500" })], { gap: "8px", alignItems: "flex-start" });

const id = (n, slug) => identifiantModele("corporate", n, slug);
const EX = " (exemple)";

module.exports = {
  key: "corporate",
  label: "Corporate",
  description: "Entreprises : grande zone de marque, 4 à 5 colonnes, double niveau de navigation avec mentions légales (SIRET, capital), bandeau d'appel, accordéon mobile.",
  target: 8,
  built: true,
  models: [
    modele({
      id: id(1, "grande-marque-volets"), name: "Grande marque et quatre volets", family: "corporate",
      description: "Bloc de marque en haut avec lettre d'information, puis quatre volets (société, expertises, ressources, contact) qui se replient en accordéon sur mobile ; barre légale en bas.",
      tags: ["corporate", "marque", "accordéon", "newsletter", "sombre"], identity: nuit,
      structure: { rows: [
        colonnes12([[7, "logo:52", "text|Nous accompagnons les dirigeants dans leurs choix stratégiques, de l'analyse à la mise en œuvre. Texte d'exemple à adapter.", "socials:linkedin+youtube+x"], [5, "newsletter|La lettre du cabinet|Une analyse par mois, sans publicité."]], { pad: "xl", gap: "48px" }),
        A([["Société", "menu"], ["Expertises", liens([`Stratégie et conseil>/contact`, `Transformation>/contact`, `Finance d'entreprise>/contact`, `Ressources humaines>/contact`])], ["Ressources", liens([`Actualités>/blog`, `Études de cas>/blog`, `Questions fréquentes>/faq`, `Espace client>/connexion`])], ["Contact", "contact", "hours|-"]], { pad: "lg", rule: "thin" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
      ] },
      responsive: { mobile: { gap: "16px" } },
      widgets: ["sitelogo", "menu", "emailsubscribe", "bizcontact", "copyright", "backtotop"],
    }, "corporate"),

    modele({
      id: id(2, "bandeau-appel-cinq-colonnes"), name: "Bandeau d'appel et cinq colonnes", family: "corporate",
      description: "Large bandeau d'appel commercial en couleur au-dessus de cinq colonnes : marque et réseaux, société, services, secteurs, coordonnées. Pied bas en trois zones.",
      tags: ["corporate", "bandeau d'appel", "cinq colonnes", "clair"], identity: rouge,
      structure: { rows: [
        L(["H|Un projet à lancer ? Parlons-en.|2"], ["cta|Prendre rendez-vous|/contact", "cta2|Voir nos références|/blog"], { bg: "accent", pad: "lg" }),
        colonnes12([[3, "logo:44", "about", "socials:linkedin+youtube+x|plain"], [2, "head|Entreprise", "menu"], [2, "head|Services", liens([`Conseil>/contact`, `Audit>/contact`, `Formation>/catalogue`, `Accompagnement>/contact`])], [2, "head|Secteurs", liens([`Industrie>/blog`, `Services publics>/blog`, `Banque et assurance>/blog`, `Santé>/blog`])], [3, "head|Nous joindre", "contact", "cta2|Écrire à l'équipe|/contact"]], { pad: "xl", min: "170px" }),
        L(["copy", "legallinks"], ["top"], { pad: "md", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "menu", "button", "bizcontact", "copyright", "backtotop"],
    }, "corporate"),

    modele({
      id: id(3, "double-navigation-services"), name: "Double navigation et groupes de services", family: "corporate",
      description: "Barre de navigation principale avec bouton, groupes par service en accordéon mobile, puis rangée d'informations d'entreprise (raison sociale, immatriculations, contacts, réseaux).",
      tags: ["corporate", "double navigation", "services", "informations légales", "sombre"], identity: ardoise,
      structure: { rows: [
        T(["logo:40"], ["menuh:caps"], ["cta|Nous contacter|/contact"], { pad: "md" }),
        A([["Conseil", liens([`Stratégie>/contact`, `Organisation>/contact`, `Conduite du changement>/contact`, `Fusions et acquisitions>/contact`])], ["Audit", liens([`Audit financier>/contact`, `Conformité>/contact`, `Contrôle interne>/contact`, `Gestion des risques>/contact`])], ["Formation", liens([`Catalogue des formations>/catalogue`, `Intra-entreprise>/contact`, `Management>/catalogue`, `Calendrier>/catalogue`])], ["Digital", liens([`Données et pilotage>/contact`, `Outils métiers>/contact`, `Cybersécurité>/contact`, `Assistance>/faq`])]], { bg: "alt", pad: "xl", accSingle: true, rule: "thin" }),
        colonnes12([[4, "head|Informations d'entreprise", "legalinfo"], [4, "head|Nous écrire", "email", "phone"], [4, "head|Suivre l'actualité", "socials:linkedin+youtube|sq"]], { pad: "lg" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["menu", "button", "bizlegal", "bizemail", "bizphone", "copyright"],
    }, "corporate"),

    modele({
      id: id(4, "rendez-vous-en-cartes"), name: "Rendez-vous, implantations et garanties en cartes", family: "corporate",
      description: "Trois cartes : prise de rendez-vous avec téléphone et courriel, implantations (exemples) avec horaires, garanties et certifications (exemples). Barre de navigation et réseaux en dessous.",
      tags: ["corporate", "cartes", "rendez-vous", "implantations", "certifications"], identity: ivoire,
      structure: { rows: [
        colonnes12([[5, "badge|Rendez-vous", "H|Un échange de 30 minutes, sans engagement|3", "text|Présentez-nous votre besoin : un associé vous répond sous deux jours ouvrés.", "cta|Réserver un créneau|/contact", "phone", "email"], [4, "head|Nos implantations", liens([`Paris, siège${EX}>/contact`, `Lyon, agence${EX}>/contact`, `Nantes, agence${EX}>/contact`]), "hours"], [3, "head|Garanties", `badge|Qualité certifiée${EX}`, `badge|Données protégées${EX}`, "text|Certifications fictives, à remplacer par les vôtres. Remplacez aussi la charte et la politique qualité.", "cta2|Lire nos engagements|/faq"]], { pad: "xl", cards: true }),
        T(["logo:36"], ["menuh"], ["socials:linkedin+youtube+x|plain"], { pad: "md", rule: "thin" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "menu", "bizphone", "bizemail", "bizhours", "social", "copyright"],
    }, "corporate"),

    modele({
      id: id(5, "implantations-en-colonnes"), name: "Implantations et bureaux en colonnes", family: "corporate",
      description: "Titre d'accroche avec bouton, puis quatre colonnes : trois bureaux (exemples) et les coordonnées réelles de l'entreprise. Fin centrée avec liens légaux et copyright.",
      tags: ["corporate", "implantations", "bureaux", "centré", "vert"], identity: foret,
      structure: { rows: [
        L(["H|Présents là où vous êtes|2"], ["cta2|Trouver l'équipe la plus proche|/contact"], { pad: "xl" }),
        colonnes12([[3, `badge|Exemple`, "H|Paris, siège|3", "text|Direction, conseil et finance d'entreprise.", "link|Contacter l'équipe|/contact"], [3, `badge|Exemple`, "H|Lyon|3", "text|Industrie, achats et transformation.", "link|Contacter l'équipe|/contact"], [3, `badge|Exemple`, "H|Nantes|3", "text|Secteur public, santé et formation.", "link|Contacter l'équipe|/contact"], [3, "head|Coordonnées", "contact", "cta2|Écrire à l'équipe|/contact"]], { bg: "alt", pad: "xl", rule: "thin" }),
        T(["logo:36"], ["menuh"], ["top"], { pad: "md" }),
        Z(["legallinks", "copy:c"], { pad: "md", rule: "thin", gap: "10px" }),
      ] },
      responsive: { tablet: { gap: "24px" } },
      widgets: ["heading", "sitelogo", "menu", "bizcontact", "copyright", "backtotop"],
    }, "corporate"),

    modele({
      id: id(6, "certifications-centre"), name: "Marque centrée et bandeau de certifications", family: "corporate",
      description: "Marque et réseaux centrés, quatre colonnes de certifications et engagements (exemples) dans un cadre, puis navigation, informations légales en ligne et copyright centrés.",
      tags: ["corporate", "centré", "certifications", "engagements", "bordeaux"], identity: bordeaux,
      structure: { rows: [
        Z(["logo:56", "about", "socials:linkedin+youtube|plain"], { pad: "lg", max: "720px", rule: "double" }),
        { ...C([[1, `badge|Exemple`, "head|Qualité", "text|Processus certifiés et audités chaque année."], [1, `badge|Exemple`, "head|Éthique", "text|Charte de conduite signée par chaque collaborateur."], [1, `badge|Exemple`, "head|Données", "text|Hébergement en Europe et accès contrôlés."], [1, `badge|Exemple`, "head|Environnement", "text|Plan de réduction des déplacements et du papier."]], { pad: "md", frame: true, max: "1080px", min: "190px" }), center: true },
        Z(["menuh", "legalinfo:inline", "legallinks", "copy:c"], { pad: "xl", gap: "14px", max: "900px" }),
      ] },
      widgets: ["sitelogo", "social", "menu", "bizlegal", "copyright"],
    }, "corporate"),

    modele({
      id: id(7, "affiche-noir-et-or"), name: "Affiche de marque noir et or", family: "corporate",
      description: "Grand titre d'affiche avec deux boutons d'action, puis trois volets pondérés (métiers, groupe, contact) repliables sur mobile. Filet épais et fond noir rehaussé d'or.",
      tags: ["corporate", "affiche", "grand titre", "sombre", "accordéon"], identity: or,
      structure: { rows: [
        colonnes12([[8, grandTitre("Construisons ensemble l'entreprise de demain.")], [4, "text|Un interlocuteur unique, de l'étude à la mise en œuvre.", "cta|Démarrer un projet|/contact", "cta2|Lire nos analyses|/blog"]], { pad: "xl", rule: "thick", gap: "48px" }),
        A([[2, "Nos métiers", liens([`Conseil en stratégie>/contact`, `Finance et gestion>/contact`, `Ressources humaines>/contact`, `Transformation numérique>/contact`, `Formation>/catalogue`])], [1, "Le groupe", "menu"], [1, "Contact", "contact", "socials:linkedin+youtube|plain"]], { pad: "xl", rule: "thin" }),
        L(["logo:32", "copy"], ["legallinks"], { bg: "alt", pad: "sm" }),
      ] },
      widgets: ["heading", "button", "menu", "bizcontact", "sitelogo", "copyright"],
    }, "corporate"),

    modele({
      id: id(8, "contact-et-trois-niveaux-legaux"), name: "Formulaire de contact et trois niveaux légaux", family: "corporate",
      description: "Invitation à échanger avec grands réseaux professionnels et formulaire de contact, puis trois volets légaux (informations d'entreprise, pages légales, gouvernance) en accordéon mobile.",
      tags: ["corporate", "formulaire de contact", "légal", "réseaux professionnels", "accordéon"], identity: lagune,
      structure: { rows: [
        colonnes12([[6, "H|Échangeons sur vos enjeux|2", "text|Nos experts répondent à chaque message. Suivez-nous aussi sur les réseaux professionnels.", "socials:linkedin+youtube+x|big"], [6, "contactform|Écrivez-nous|Votre message arrive directement à l'équipe."]], { pad: "xl", gap: "48px" }),
        A([["Informations légales", "legalinfo"], ["Pages légales", pagesLegales], ["Gouvernance", liens([`Charte éthique${EX}>/faq`, `Politique d'intégrité${EX}>/faq`, `Alerte professionnelle${EX}>/contact`])]], { bg: "alt", pad: "lg", rule: "thin" }),
        L(["copy"], ["top"], { pad: "sm" }),
      ] },
      widgets: ["heading", "social", "emailsubscribe", "bizlegal", "copyright", "backtotop"],
    }, "corporate"),
  ],
};
