// Famille « Éducation et formation » — 6 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Marques de démonstration FICTIVES : Université du Val-Clair, Apprendo, École des Tilleuls, Atelier Cap Métiers, Ouvert.Cours, Campus des Rives.
// Les liens https://exemple.fr/… sont des liens D'EXEMPLE à remplacer ; certifications, financements, sessions et horaires précisés « exemple » sont des données de démonstration.
const { modele, identifiantModele, ambiance, C, L, T, Z, A, reseaux, widget } = require("../kit-conception");

const F = "education";
const E = "https://exemple.fr";
const ids = (n, s) => identifiantModele(F, n, s);

// ── Aides locales (le kit n'a pas ces éléments) ───────────────────────────────────────────────────────────────────────────────────────
// Liste de liens verticale, sans limite de nombre : « Libellé>adresse »
const liens = (liste, gap = "8px") => (k, env, center) => k.col(liste.map((s) => { const [l, u] = s.split(">"); return k.LINK(l, u, { fontSize: "14px", fontWeight: "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap, alignItems: center ? "center" : "flex-start" });
// Pastille de certification ou de partenaire (texte, contour)
const pastille = (texte) => (k) => k.T(`<p><strong>${texte}</strong></p>`, {
  fontSize: "12px", fontFamily: k.S.font, color: k.S.fg, borderStyle: "solid", borderWidth: "1px", borderColor: k.S.fg, borderRadius: "999px",
  paddingTop: "4px", paddingBottom: "4px", paddingLeft: "12px", paddingRight: "12px",
});
const pastilles = (liste) => (k, env, center) => k.row(liste.map((t) => pastille(t)(k)), { gap: "8px", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start" });
// Texte libre avec marque de démonstration
const note = (texte, o = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: o.fort ? k.S.fg : k.S.mute, fontSize: o.taille || "14px", ...(o.fort ? { fontWeight: "600" } : {}), ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}), ...(o.largeur ? { maxWidth: o.largeur } : {}) });
// Ligne de session : date en gras suivie d'un détail (filet à gauche)
const session = (quand, quoi) => (k) => k.T(`<p><strong>${quand}</strong><br>${quoi}</p>`, {
  fontSize: "14px", color: k.S.fg, borderStyle: "solid", borderLeftWidth: "3px", borderTopWidth: "0px", borderRightWidth: "0px", borderBottomWidth: "0px", borderColor: k.S.accent, paddingLeft: "14px", width: "100%",
});

// Deux boutons côte à côte (plein + contour), centrés ou à gauche ; ils passent à la ligne sur petit écran
const boutons = (a, b) => (k, env, center) => k.row([k.B(a[0], a[1]), k.B(b[0], b[1], "outline")], { gap: "12px", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start" });
// Trois sessions de formation côte à côte
const sessions = (liste) => (k) => k.row(liste.map(([q, c]) => { const n = session(q, c)(k); n.styles.desktop = { ...n.styles.desktop, width: "auto", flexBasis: "180px", flexGrow: 1 }; return n; }), { gap: "16px", flexWrap: "wrap", alignItems: "flex-start" });
// Recherche plus large que celle du kit (champ et bouton sur une ligne)
const recherche = (k) => k.search("catalogue", { width: "100%", maxWidth: "460px" });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ───────────────────────────────────────────────────────────────
const bordeaux = ambiance({ key: "edu-bordeaux", label: "Bordeaux académique", humeur: "light", fond: "#fbf8f3", texte: "#2a1418", accent: "#7f1d2d", police: "font.source-sans-3", titres: "font.playfair-display" });
const neon = ambiance({ key: "edu-neon", label: "Nuit des cours", humeur: "dark", fond: "#14102b", texte: "#f1eeff", accent: "#ffd23f", police: "font.outfit", titres: "font.lexend" });
const recre = ambiance({ key: "edu-recre", label: "Cour de récréation", humeur: "soft", fond: "#fff8e1", texte: "#1f2a44", accent: "#c2410c", police: "font.nunito", titres: "font.baloo-2" });
const petrole = ambiance({ key: "edu-petrole", label: "Bleu pétrole formation", humeur: "brand", fond: "#ffffff", texte: "#0b2b33", accent: "#0e7490", police: "font.public-sans", titres: "font.rubik" });
const mono = ambiance({ key: "edu-mono", label: "Cours ouvert", humeur: "light", fond: "#fafaf7", texte: "#18181b", accent: "#18181b", police: "font.ibm-plex-mono", titres: "font.ibm-plex-sans" });
const rives = ambiance({ key: "edu-rives", label: "Vert des rives", humeur: "dark", fond: "#0f2a22", texte: "#e8f5ee", accent: "#f4b942", police: "font.public-sans", titres: "font.young-serif" });

const R_UNIV = reseaux([{ network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "instagram", url: "https://www.instagram.com/" }], { taille: 32, forme: "plain" });
const R_PLATEFORME = reseaux([{ network: "youtube", url: "https://www.youtube.com/" }, { network: "tiktok", url: "https://www.tiktok.com/" }, { network: "instagram", url: "https://www.instagram.com/" }, { network: "x", url: "https://x.com/" }], { taille: 40, forme: "circle" });
const R_ECOLE = reseaux([{ network: "facebook", url: "https://www.facebook.com/" }, { network: "instagram", url: "https://www.instagram.com/" }], { taille: 44, forme: "circle" });
const R_PRO = reseaux([{ network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "whatsapp", url: "https://wa.me/" }], { taille: 32, forme: "square" });
const R_CAMPUS = reseaux([{ network: "instagram", url: "https://www.instagram.com/" }, { network: "tiktok", url: "https://www.tiktok.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }], { taille: 32, forme: "square" });

module.exports = {
  key: "education",
  label: "Éducation et formation",
  description: "Écoles et organismes de formation : catalogue de formations, campus, aide aux étudiants, accessibilité, inscription.",
  target: 6,
  built: true,
  models: [
    // 1 ─ Université : bandeau de candidatures, cinq colonnes (accordéon mobile), accréditations
    modele({
      id: ids(1, "universite-cinq-colonnes"),
      name: "Université à cinq colonnes et candidatures",
      family: F,
      description: "Pied d'université institutionnel : bandeau de candidatures, cinq colonnes (établissement, formations, recherche, vie étudiante, international) en accordéon sur mobile, accréditations d'exemple et référent accessibilité.",
      tags: ["université", "institutionnel", "colonnes", "accordéon", "candidatures", "accessibilité"],
      identity: bordeaux,
      structure: { rows: [
        L(["badge|Candidatures 2027", note("Les dossiers sont ouverts jusqu'au 31 mars (date d'exemple).", { fort: true })], ["cta|Candidater en ligne|/inscription", "cta2|Journées portes ouvertes|/contact"], { bg: "ink", pad: "sm", rule: "none" }),
        A([
          [4, "Établissement", "logo:44", "about|Université du Val-Clair (établissement fictif) : 14 000 étudiants, 9 composantes, 38 laboratoires. Liens et chiffres d'exemple.", "contact", R_UNIV],
          [2, "Formations", liens(["Licences>/catalogue", "Masters>/catalogue", "Doctorats>/catalogue", "Formation continue>/catalogue", "Diplômes d'université>/catalogue", "Calendrier universitaire>/faq"])],
          [2, "Recherche", liens(["Laboratoires>" + E + "/recherche", "Écoles doctorales>" + E + "/doctorat", "Publications>" + E + "/publications", "Valorisation>" + E + "/valorisation", "Science ouverte>" + E + "/science-ouverte"])],
          [2, "Vie étudiante", liens(["Logement>" + E + "/logement", "Bibliothèques>" + E + "/bibliotheques", "Santé et handicap>/faq", "Bourses et aides>/faq", "Associations>/blog", "Sport>/blog"])],
          [2, "International", liens(["Partir étudier>" + E + "/mobilite", "Étudiants étrangers>" + E + "/accueil", "Accords de coopération>" + E + "/accords", "Cours de français>/catalogue"])],
        ], { pad: "xl", min: "130px", rule: "thick", mobile: { gap: "4px" } }),
        C([
          [4, "head|Accréditations (exemples)", pastilles(["Habilitation CTI", "Label Bienvenue en France", "Charte Erasmus+"])],
          [4, "head|Partenaires (exemples)", note("Réseau des universités de l'Ouest, Conservatoire du Val-Clair, CHU régional, Chambre de commerce.")],
          [4, "head|Accessibilité", liens(["Déclaration d'accessibilité>/faq", "Contacter le référent handicap>/contact", "Aménagements d'examens>/faq"])],
        ], { pad: "lg", bg: "alt", min: "220px", rule: "none" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin", mobile: { gap: "4px" } }),
      ] },
      widgets: ["sitelogo", "text", "bizcontact", "social", "button", "copyright", "bizlegal", "backtotop"],
    }, F),

    // 2 ─ Plateforme de cours : recherche, cours du moment, thèmes, newsletter
    modele({
      id: ids(2, "plateforme-de-cours-vivante"),
      name: "Plateforme de cours vivante",
      family: F,
      description: "Pied de plateforme en ligne sur nuit violette : grande bande jaune avec recherche, trois cartes (cours du moment, thèmes à explorer, lettre d'information), réseaux en pastilles rondes et espace formateur.",
      tags: ["plateforme", "e-learning", "cours", "recherche", "cartes", "sombre"],
      identity: neon,
      structure: { rows: [
        L(["H|Quel sera ton prochain cours ?|2"], [recherche], { bg: "accent", pad: "lg", rule: "none" }),
        C([
          [5, "head|Les cours du moment", "courses:3", "link|Voir tous les cours|/catalogue"],
          [3, "head|Explorer par thème", liens(["Programmation et web>/catalogue", "Design et création>/catalogue", "Langues>/catalogue", "Données et IA>/catalogue", "Gestion de projet>/catalogue", "Bien-être et pédagogie>/catalogue"], "10px")],
          [4, "newsletter|Un cours par semaine, dans ta boîte|Les nouveautés et les parcours gratuits, sans spam.", note("Déjà 40 000 apprenants (chiffre d'exemple).", { taille: "13px" }), "link|Parcours gratuits|/catalogue", "link|Application mobile (exemple)|"+E+"/application"],
        ], { cards: true, pad: "xl", gap: "24px", min: "250px", rule: "none" }),
        T(["logo:36"], [R_PLATEFORME], ["cta2|Devenir formateur|/inscription", "account"], { pad: "md", rule: "thin", mobile: { gap: "16px" } }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "none", bg: "alt" }),
      ] },
      widgets: ["sitelogo", "search", "button", "courselist", "emailsubscribe", "social", "copyright", "bizlegal", "backtotop"],
    }, F),

    // 3 ─ École primaire : message chaleureux centré, trois cartes pour les parents
    modele({
      id: ids(3, "ecole-chaleureuse-parents"),
      name: "École chaleureuse pour les parents",
      family: F,
      description: "Pied d'école primaire sur fond crème : mot d'accueil centré avec inscription, trois cartes utiles aux parents (horaires, démarches, coordonnées), réseaux en grands ronds faciles à toucher.",
      tags: ["école", "primaire", "parents", "chaleureux", "horaires", "inscription"],
      identity: recre,
      structure: { rows: [
        Z(["badge|Rentrée 2027 : inscriptions ouvertes", "H|Ici, chaque enfant grandit à son rythme|2", note("École des Tilleuls (établissement fictif) : classes à petits effectifs, jardin pédagogique et ateliers de lecture.", { largeur: "560px" }), boutons(["Inscrire mon enfant", "/inscription"], ["Nous rendre visite", "/contact"])], { pad: "xl", max: "760px", gap: "16px", rule: "accent" }),
        C([
          [4, "head|Les horaires", "hours|-", note("Accueil du matin dès 7 h 30 et garderie jusqu'à 18 h 30 (horaires d'exemple).")],
          [4, "head|Pour les parents", liens(["Menu de la cantine>/faq", "Garderie et études>/faq", "Calendrier des vacances>/faq", "Espace parents>/connexion", "Sorties et projets>/blog"], "10px")],
          [4, "head|Nous joindre", "contact", note("Réponse sous 48 h en période scolaire (exemple)."), "link|Écrire à la directrice|/contact"],
        ], { cards: true, pad: "lg", gap: "20px", min: "240px", rule: "none" }),
        Z([R_ECOLE, "legallinks", "copy:c"], { pad: "md", gap: "14px", bg: "alt", rule: "none" }),
      ] },
      widgets: ["text", "button", "bizhours", "bizcontact", "social", "bizlegal", "copyright"],
    }, F),

    // 4 ─ Centre de formation professionnelle : grand appel d'inscription, domaines, financement, sessions
    modele({
      id: ids(4, "centre-de-formation-inscription"),
      name: "Centre de formation avec inscription et financement",
      family: F,
      description: "Pied de centre de formation pro : grande bande d'inscription avec téléphone, domaines de formation, aides au financement (CPF, exemple), certifications d'exemple, prochaines sessions et lettre d'information.",
      tags: ["formation professionnelle", "inscription", "financement", "CPF", "sessions", "certifications"],
      identity: petrole,
      structure: { rows: [
        C([
          [8, "badge|Organisme certifié (exemple)", "H|Montez en compétences en six mois|2", note("Atelier Cap Métiers (centre fictif) : formations courtes, en journée ou en soirée, avec accompagnement vers l'emploi.", { fort: true, largeur: "600px" })],
          [4, "cta|S'inscrire à une session|/inscription", "cta2|Demander le programme|/contact", "phone"],
        ], { bg: "accent", pad: "xl", rule: "none", min: "260px" }),
        C([
          [3, "logo:40", "about|Centre de formation professionnelle fictif. Programmes, tarifs et sessions d'exemple.", "email", R_PRO],
          [3, "head|Domaines", liens(["Bureautique et numérique>/catalogue", "Gestion et comptabilité>/catalogue", "Vente et relation client>/catalogue", "Santé et sécurité>/catalogue", "Langues pro>/catalogue"])],
          [3, "head|Financer ma formation", liens(["Compte personnel de formation (exemple)>/faq", "Financement par l'employeur>/faq", "Aides pour demandeurs d'emploi>/faq", "Demander un devis>/contact"])],
          [3, "head|Qualité (exemples)", pastilles(["Certification qualité", "Titre professionnel", "Formation à distance"]), note("Taux de réussite 92 % en 2026 (donnée d'exemple).")],
        ], { pad: "xl", min: "200px", rule: "none" }),
        C([
          [4, "newsletter|Les prochaines sessions dans votre boîte|Dates, places disponibles et conseils de financement.", note("Réponse à chaque demande sous 48 h (exemple).", { taille: "13px" })],
          [8, "head|Prochaines sessions (exemples)", sessions([["12 janvier · 5 jours", "Excel et tableaux de bord"], ["2 février · 10 semaines", "Assistant(e) comptable"], ["9 mars · en soirée", "Anglais professionnel B2"]]), "link|Voir toutes les sessions|/catalogue"],
        ], { pad: "lg", bg: "alt", rule: "none", min: "260px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin", mobile: { gap: "4px" } }),
      ] },
      widgets: ["button", "sitelogo", "text", "bizphone", "bizemail", "emailsubscribe", "social", "copyright", "bizlegal"],
    }, F),

    // 5 ─ MOOC : pied minimal à questions repliables
    modele({
      id: ids(5, "cours-ouvert-questions"),
      name: "Cours ouvert minimal avec questions",
      family: F,
      description: "Pied sobre de cours en ligne ouvert à tous : monochrome en police à chasse fixe, trois questions repliables (gratuité, certificat, mobile), liens d'aide et d'accessibilité, mentions en une ligne.",
      tags: ["MOOC", "minimal", "gratuit", "FAQ", "monochrome", "certificat"],
      identity: mono,
      structure: { rows: [
        C([
          [4, "logo:30", note("Ouvert.Cours (plateforme fictive) : des cours universitaires libres, gratuits, à suivre quand on veut.", { largeur: "320px" }), "cta2|Voir les cours|/catalogue"],
          [5, "toggle|Les cours sont-ils gratuits ?|Oui : le contenu est libre. Seul le certificat de réussite est payant (exemple).", "toggle|Comment obtenir un certificat ?|Terminez les exercices notés, puis demandez votre certificat depuis votre espace (exemple).", "toggle|Puis-je apprendre sur téléphone ?|Oui, tous les cours s'affichent sur mobile et se reprennent là où vous vous étiez arrêté (exemple)."],
          [3, "head|Aide", liens(["Centre d'aide>/faq", "Accessibilité>/faq", "Nous contacter>/contact", "Espace apprenant>/connexion"])],
        ], { pad: "xl", max: "1080px", min: "220px", rule: "thin" }),
        L(["copy"], ["legallinks"], { pad: "sm", max: "1080px", rule: "thin", mobile: { gap: "4px" } }),
      ] },
      widgets: ["sitelogo", "text", "button", "toggle", "copyright", "bizlegal"],
    }, F),

    // 6 ─ Campus : plan, horaires, accès et services
    modele({
      id: ids(6, "campus-plan-et-horaires"),
      name: "Campus avec plan, horaires et accès",
      family: F,
      description: "Pied de campus : plan interactif large, horaires des services et coordonnées, puis quatre volets pratiques (accès, services, accessibilité, admission) en accordéon sur mobile, sur vert profond et ambre.",
      tags: ["campus", "plan", "horaires", "accès", "accessibilité", "accordéon"],
      identity: rives,
      structure: { rows: [
        C([
          [6, widget("map", { address: "Place Bellecour, Lyon", zoom: 14, height: 280, title: "Plan du campus : remplacez l'adresse par la vôtre" }, { desktop: { width: "100%", borderRadius: "8px" } })],
          [3, "head|Horaires", "hours|-", note("Bibliothèque : lundi au samedi, 8 h - 22 h (exemple).")],
          [3, "logo:32", "head|Nous trouver", "contact", "cta|Venir au campus|/contact"],
        ], { pad: "xl", min: "230px", rule: "accent" }),
        A([
          [3, "Accès", liens(["Tram T2, arrêt Rives>" + E + "/acces", "Parkings et vélos>" + E + "/acces", "Navettes gratuites>" + E + "/acces"])],
          [3, "Services", liens(["Restauration>" + E + "/services", "Logement>" + E + "/logement", "Santé>" + E + "/sante", "Emploi et stages>/blog"])],
          [3, "Accessibilité", liens(["Plan des accès PMR>/faq", "Déclaration d'accessibilité>/faq", "Aménagements d'études>/contact"])],
          [3, "Admission", liens(["Dossier en ligne>/inscription", "Frais de scolarité>/faq", "Calendrier de la rentrée>/faq"]), "cta2|Candidater|/inscription"],
        ], { pad: "lg", bg: "alt", min: "170px", rule: "none", mobile: { gap: "4px" } }),
        L(["copy", R_CAMPUS], ["legallinks", "top"], { pad: "sm", rule: "thin", mobile: { gap: "10px" } }),
      ] },
      widgets: ["map", "bizhours", "bizcontact", "button", "sitelogo", "social", "copyright", "bizlegal", "backtotop"],
    }, F),
  ],
};
