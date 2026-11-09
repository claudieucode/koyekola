// Famille « Institutionnels » — 8 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Administrations, collectivités, organismes publics : plan du site dense, déclaration d'accessibilité, liens officiels, 3 niveaux de navigation, accueil du public, flux et réseaux.
// Tous les organismes sont FICTIFS (marques de démonstration) et aucun symbole officiel réel n'est utilisé. Les liens https://exemple.fr/… sont des liens D'EXEMPLE à remplacer ;
// niveaux d'accessibilité, partenaires, langues, numéros et dates précisés « exemple » sont des données de démonstration. Les coordonnées et horaires réels viennent des Données de l'entreprise.
const { modele, identifiantModele, ambiance, C, L, T, Z, A, accordeon, reseaux } = require("../kit-conception");

const F = "institutionnels";
const E = "https://exemple.fr";
const ids = (n, s) => identifiantModele(F, n, s);

// ── Aides locales (le kit ne les propose pas) ─────────────────────────────────────────────────────────────────────────────────────────
// Liste de liens verticale sans limite : « Libellé>adresse »
const liens = (list, o = {}) => (k, env, center) => k.col(list.map((s) => { const [l, u] = s.split(">"); return k.LINK(l, u, { fontSize: o.taille || "14px", fontWeight: o.poids || "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap: o.gap || "8px", alignItems: center ? "center" : "flex-start" });
// Navigation à 3 niveaux : « Titre>adresse » = niveau 1, « -Titre>adresse » = niveau 2, « --Titre>adresse » = niveau 3 (retraits et filet à gauche)
const niveaux = (list) => (k) => k.col(list.map((s) => {
  const m = /^(-{0,2})(.*)$/.exec(s), n = m[1].length, [l, u] = m[2].split(">");
  if (n === 0) return k.LINK(l, u, { fontSize: "14px", fontWeight: "700", marginTop: "6px" });
  return k.LINK(l, u, { fontSize: n === 1 ? "14px" : "13px", fontWeight: "500", color: n === 1 ? k.S.fg : k.S.mute, marginLeft: n === 1 ? "10px" : "24px", paddingLeft: "10px", borderStyle: "solid", borderLeftWidth: "2px", borderTopWidth: "0px", borderRightWidth: "0px", borderBottomWidth: "0px", borderColor: n === 1 ? k.S.accent : k.S.line });
}), { gap: "6px", alignItems: "flex-start", width: "100%" });
const para = (texte, extra = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "14px", ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}), ...extra });
const grand = (texte, px = 36, mob = 28, extra = {}) => (k, env, center) => k.H(texte, "2", { fontSize: `${px}px`, lineHeight: 1.12, ...(center ? { textAlign: "center" } : {}), ...extra }, undefined, { fontSize: `${mob}px` });
// Pastilles-liens (liens officiels, communes) : lien avec contour
const puces = (list, o = {}) => (k, env, center) => k.row(list.map((s) => { const [l, u] = s.split(">"); return k.LINK(l, u, { fontSize: "13px", fontWeight: "600", borderStyle: "solid", borderWidth: "1px", borderColor: o.fort ? k.S.fg : k.S.line, borderRadius: o.carre ? "2px" : "999px", paddingTop: "5px", paddingBottom: "5px", paddingLeft: "12px", paddingRight: "12px" }); }), { gap: o.gap || "8px", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start", alignItems: "center" });
// Déclaration d'accessibilité : niveau d'exemple + lien d'exemple
const declaration = (niveau, o = {}) => (k, env, center) => k.row([
  k.T(`<p><strong>Accessibilité : ${niveau} (exemple)</strong></p>`, { fontSize: "13px", color: k.S.fg, backgroundColor: o.fond || k.S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: k.S.line, borderRadius: "14px", marginTop: "0px", marginBottom: "0px", paddingTop: "5px", paddingBottom: "5px", paddingLeft: "12px", paddingRight: "12px" }),
  k.LINK("Déclaration d'accessibilité", `${E}/accessibilite`, { fontSize: "13px", fontWeight: "600", marginTop: "0px", marginBottom: "0px" }),
], { gap: "14px", alignItems: "baseline", flexWrap: "wrap", ...(center ? { justifyContent: "center" } : {}) });
// Liste de langues d'exemple (liens vers des pages d'exemple)
const langues = (list, titre = "Langue :") => (k, env, center) => k.row([k.T(`<p>${titre}</p>`, { color: k.S.mute, fontSize: "13px" }), ...list.map((s) => { const [l, u] = s.split(">"); return k.LINK(l, u, { fontSize: "13px", fontWeight: "600" }); })], { gap: "14px", flexWrap: "wrap", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
// Recherche sur une ligne (champ puis bouton côte à côte)
const recherche = (k) => k.search("blog", { display: "flex", flexDirection: "row", flexWrap: "nowrap", alignItems: "stretch", gap: "8px", width: "100%", maxWidth: "380px" });
// Carte de service : titre, phrase, lien d'action ; grille de cartes qui passe à la ligne
const services = (list) => (k) => k.row(list.map(([t, x, l, u]) => k.card([k.L(t), k.T(`<p>${x}</p>`, { fontSize: "13px", color: k.S.mute }), k.LINK(l, u, { fontSize: "14px", fontWeight: "700" })], { gap: "8px", flexBasis: "300px", flexGrow: 1, flexShrink: 1, minWidth: "240px" })), { gap: "16px", flexWrap: "wrap", alignItems: "stretch", width: "100%" });
// Index numéroté : « 01 Libellé » en grand, filet bas
const indexNum = (list) => (k) => k.col(list.map(([n, l, u]) => k.row([k.T(`<p>${n}</p>`, { fontFamily: k.S.head, fontSize: "14px", color: k.S.accent, minWidth: "32px" }), k.LINK(l, u, { fontFamily: k.S.head, fontSize: "22px", fontWeight: "500", flexGrow: 1 })], { gap: "12px", alignItems: "center", flexWrap: "nowrap", borderBottomStyle: "solid", borderBottomWidth: "1px", borderBottomColor: k.S.line, paddingBottom: "10px", width: "100%" })), { gap: "10px", width: "100%" });
// Bandeau officiel : texte en gras suivi d'une phrase
const bandeau = (fort, texte) => (k, env, center) => k.T(`<p><strong>${fort}</strong> ${texte}</p>`, { fontSize: "14px", color: k.S.fg, ...(center ? { textAlign: "center" } : {}) });
// Encadré d'information (fond alterné, filet d'accent à gauche)
const encadre = (titre, texte) => (k) => k.col([k.L(titre), k.T(`<p>${texte}</p>`, { fontSize: "13px", color: k.S.fg })], { gap: "6px", backgroundColor: k.S.alt, borderStyle: "solid", borderLeftWidth: "4px", borderTopWidth: "0px", borderRightWidth: "0px", borderBottomWidth: "0px", borderColor: k.S.accent, paddingTop: "16px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "20px", width: "100%" });
// Flux (RSS, alertes) : liens d'exemple côte à côte
const flux = (list) => (k) => k.row(list.map((s) => { const [l, u] = s.split(">"); return k.LINK(l, u, { fontSize: "13px", fontWeight: "600" }); }), { gap: "18px", flexWrap: "wrap" });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ───────────────────────────────────────────────────────────────
const portail = ambiance({ key: "inst-portail", label: "Bleu de portail national", humeur: "light", fond: "#ffffff", texte: "#1b2336", accent: "#1f3f9a", police: "font.public-sans", titres: "font.public-sans" });
const mairie = ambiance({ key: "inst-mairie", label: "Crème et brique de mairie", humeur: "soft", fond: "#f1f5ee", texte: "#14291e", accent: "#1f5a3a", police: "font.nunito", titres: "font.young-serif" });
const agence = ambiance({ key: "inst-agence", label: "Vert d'eau d'agence", humeur: "light", fond: "#eef3f1", texte: "#10251f", accent: "#0b6b57", police: "font.ibm-plex-sans", titres: "font.ibm-plex-sans" });
const sante = ambiance({ key: "inst-sante", label: "Turquoise hospitalier", humeur: "brand", fond: "#f1f9fb", texte: "#0d3340", accent: "#0a7a8c", police: "font.figtree", titres: "font.red-hat-display" });
const culture = ambiance({ key: "inst-culture", label: "Encre et vermillon de musée", humeur: "edit", fond: "#f6f1e8", texte: "#1c1917", accent: "#b3341b", police: "font.work-sans", titres: "font.fraunces" });
const europe = ambiance({ key: "inst-europe", label: "Nuit d'organisme multilingue", humeur: "dark", fond: "#101d4a", texte: "#eef2ff", accent: "#8ec5ff", police: "font.manrope", titres: "font.manrope" });
const prefecture = ambiance({ key: "inst-prefecture", label: "Gris sobre de préfecture", humeur: "edit", fond: "#f4f4f2", texte: "#1f2328", accent: "#2b3a55", police: "font.pt-sans", titres: "font.pt-serif" });
const interco = ambiance({ key: "inst-interco", label: "Prairie d'intercommunalité", humeur: "soft", fond: "#f3f7ec", texte: "#1c2e12", accent: "#3a741b", police: "font.outfit", titres: "font.bricolage-grotesque" });

const R_OFFICIELS = reseaux([{ network: "youtube", url: "https://www.youtube.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "facebook", url: "https://www.facebook.com/" }, { network: "x", url: "https://x.com/" }], { taille: 32, forme: "plain" });
const R_MAIRIE = reseaux([{ network: "facebook", url: "https://www.facebook.com/" }, { network: "instagram", url: "https://www.instagram.com/" }, { network: "whatsapp", url: "https://wa.me/" }], { taille: 40, forme: "circle" });
const R_CULTURE = reseaux([{ network: "instagram", url: "https://www.instagram.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "threads", url: "https://www.threads.net/" }], { taille: 32, forme: "square" });
const R_EUROPE = reseaux([{ network: "x", url: "https://x.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }], { taille: 32, forme: "plain" });

module.exports = {
  key: "institutionnels",
  label: "Institutionnels",
  description: "Administrations et organisations : plan du site dense, accessibilité, déclarations, liens officiels, multi-niveaux.",
  target: 8,
  built: true,
  models: [
    // 1 ─ Portail national : recherche, six colonnes de plan du site, liens officiels, accessibilité
    modele({
      id: ids(1, "portail-national-six-colonnes"),
      name: "Portail national à six colonnes",
      family: F,
      description: "Pied dense de portail public : recherche et espace personnel, six colonnes de plan du site (accordéon sur mobile), liens officiels et lettre d'information, ligne d'accessibilité avec déclaration, mentions légales.",
      tags: ["portail", "plan du site", "dense", "accessibilité", "liens officiels", "accordéon"],
      identity: portail,
      structure: { rows: [
        T(["logo:40"], [recherche], ["cta2|Mon espace|/connexion"], { pad: "md", rule: "none", mobile: { gap: "12px" } }),
        A([
          ["Particuliers", liens(["Papiers et identité>" + E + "/papiers", "Famille>" + E + "/famille", "Logement>" + E + "/logement", "Travail et retraite>" + E + "/travail", "Argent et impôts>" + E + "/impots", "Justice>" + E + "/justice"])],
          ["Professionnels", liens(["Créer une entreprise>" + E + "/creation", "Employeurs>" + E + "/employeurs", "Marchés publics>" + E + "/marches", "Aides et subventions>" + E + "/aides", "Douanes et export>" + E + "/export"])],
          ["Associations", liens(["Créer une association>" + E + "/asso-creation", "Subventions>" + E + "/asso-subventions", "Bénévolat>" + E + "/benevolat", "Dons et mécénat>" + E + "/dons"])],
          ["Collectivités", liens(["Annuaire>" + E + "/annuaire", "Finances locales>" + E + "/finances-locales", "Urbanisme>" + E + "/urbanisme", "Élections>" + E + "/elections", "Données ouvertes>" + E + "/donnees-ouvertes"])],
          ["Services en ligne", liens(["Se connecter>/connexion", "Suivre ma demande>" + E + "/suivi", "Prendre rendez-vous>" + E + "/rendez-vous", "Payer en ligne>" + E + "/paiement", "Aide en ligne>/faq"])],
          ["Aide et contact", "contact", "cta|Nous écrire|/contact"],
        ], { pad: "lg", bg: "alt", rule: "thin", min: "150px", gap: "28px" }),
        C([
          [7, "head|Liens officiels (exemples)", puces(["Premier ministère (exemple)>" + E + "/lien-1", "Assemblée (exemple)>" + E + "/lien-2", "Sénat (exemple)>" + E + "/lien-3", "Cour des comptes (exemple)>" + E + "/lien-4", "Médiateur (exemple)>" + E + "/lien-5", "Données ouvertes>" + E + "/donnees-ouvertes"], { carre: true })],
          [5, "newsletter|Rester informé|Les changements de règles et les nouveaux services, une fois par mois."],
        ], { pad: "lg", rule: "thin", min: "280px", gap: "40px" }),
        L([declaration("partiellement conforme")], [flux(["Plan du site>" + E + "/plan", "Mode d'emploi>" + E + "/mode-emploi", "Données personnelles>" + E + "/donnees"])], { pad: "sm", bg: "alt", rule: "thin" }),
        L(["copy"], ["legallinks", R_OFFICIELS], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "search", "button", "link", "bizcontact", "text", "emailsubscribe", "social", "copyright", "bizlegal"],
    }, F),

    // 2 ─ Mairie : accueil du public, démarches, lettre de la commune
    modele({
      id: ids(2, "mairie-horaires-et-demarches"),
      name: "Mairie chaleureuse, horaires et démarches",
      family: F,
      description: "Pied de mairie : bandeau d'accueil avec téléphone, trois cartes (horaires d'ouverture, démarches fréquentes, lettre de la commune), réseaux de la commune et ligne légale avec accessibilité.",
      tags: ["mairie", "commune", "horaires", "démarches", "chaleureux", "cartes"],
      identity: mairie,
      structure: { rows: [
        C([
          [7, grand("Mairie de Val-Fleuri, à votre service.", 38, 28, { maxWidth: "520px" }), para("Commune fictive de démonstration. Un doute sur une démarche ? Passez à l'accueil ou appelez-nous.", { fontSize: "15px", maxWidth: "460px" })],
          [5, "phone", "cta|Prendre rendez-vous|/contact"],
        ], { bg: "accent", pad: "lg", rule: "none", min: "280px", gap: "32px" }),
        C([
          [4, "head|Accueil du public", "hours|-", "contact"],
          [4, "head|Démarches fréquentes", liens(["Acte de naissance ou de mariage>" + E + "/etat-civil", "Carte d'identité et passeport>" + E + "/papiers", "Inscription sur les listes électorales>" + E + "/elections", "Inscription à l'école>" + E + "/ecole", "Cantine et périscolaire>" + E + "/cantine", "Permis de construire>" + E + "/urbanisme"], { gap: "10px" })],
          [4, "newsletter|La lettre de la commune|Les travaux, les fêtes et les rendez-vous du mois."],
        ], { pad: "lg", cards: true, rule: "none", min: "250px", gap: "20px" }),
        C([
          [6, "head|Suivre la vie de la commune", R_MAIRIE, flux(["Agenda>" + E + "/agenda", "Alertes>" + E + "/alertes", "Flux RSS>" + E + "/rss"])],
          [6, "head|Services du quotidien", puces(["Déchets et tri>" + E + "/dechets", "Transports>" + E + "/transports", "Salles à louer>" + E + "/salles", "Signaler un problème>" + E + "/signalement", "Sport>" + E + "/sport"]), declaration("partiellement conforme")],
        ], { pad: "md", bg: "alt", rule: "thin", min: "260px", gap: "32px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["heading", "text", "bizphone", "button", "bizhours", "bizcontact", "link", "emailsubscribe", "social", "copyright", "bizlegal"],
    }, F),

    // 3 ─ Agence publique : plan du site à trois niveaux en volets
    modele({
      id: ids(3, "agence-plan-du-site-trois-niveaux"),
      name: "Agence publique, plan du site à trois niveaux",
      family: F,
      description: "Pied d'agence publique : colonne de gauche (nom, recherche, mode d'emploi du site) et plan du site à trois niveaux en quatre volets (accordéon mobile), puis ligne d'accessibilité et mentions légales.",
      tags: ["agence", "plan du site", "trois niveaux", "arborescence", "mode d'emploi", "accordéon"],
      identity: agence,
      structure: { rows: [
        C([
          [3, "title:22", para("Agence nationale de l'Eau Claire (organisme fictif de démonstration)."), "search", flux(["Plan du site>" + E + "/plan", "Mode d'emploi du site>" + E + "/mode-emploi", "Aide>/faq"])],
          [9, accordeon([
            { title: "Eau potable", codes: [niveaux(["Qualité de l'eau>" + E + "/qualite", "-Résultats d'analyses>" + E + "/analyses", "--Par commune>" + E + "/analyses/commune", "--Par bassin>" + E + "/analyses/bassin", "-Alertes>" + E + "/alertes", "Réseaux et captages>" + E + "/reseaux", "-Protection des captages>" + E + "/captages"])] },
            { title: "Rivières et milieux", codes: [niveaux(["Rivières>" + E + "/rivieres", "-État écologique>" + E + "/etat", "--Cartes>" + E + "/etat/cartes", "--Données>" + E + "/etat/donnees", "Zones humides>" + E + "/zones-humides", "-Inventaire>" + E + "/inventaire"])] },
            { title: "Aides et démarches", codes: [niveaux(["Aides financières>" + E + "/aides", "-Particuliers>" + E + "/aides/particuliers", "-Collectivités>" + E + "/aides/collectivites", "--Dossier en ligne>" + E + "/aides/dossier", "Redevances>" + E + "/redevances", "-Déclarer>" + E + "/redevances/declarer"])] },
            { title: "L'agence", codes: [niveaux(["Qui sommes-nous>" + E + "/agence", "-Gouvernance>" + E + "/gouvernance", "-Rapports d'activité>" + E + "/rapports", "Presse>" + E + "/presse", "Marchés publics>" + E + "/marches", "Offres d'emploi>" + E + "/emploi"])] },
          ], { start: "none", min: "170px" })],
        ], { pad: "xl", rule: "none", min: "260px", gap: "48px" }),
        C([
          [6, declaration("totalement conforme", { fond: "transparent" }), para("Dernier audit d'accessibilité : mars (date d'exemple).", { fontSize: "12px" })],
          [6, "contact:inline", flux(["Flux RSS>" + E + "/rss", "Alertes e-mail>" + E + "/alertes", "Données ouvertes>" + E + "/donnees-ouvertes"])],
        ], { pad: "md", bg: "alt", rule: "thin", min: "260px", gap: "24px" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitetitle", "text", "search", "link", "bizcontact", "backtotop", "copyright", "bizlegal"],
    }, F),

    // 4 ─ Établissement public de santé : trois blocs d'information
    modele({
      id: ids(4, "etablissement-de-sante-visiteurs"),
      name: "Établissement public de santé, venir et visiter",
      family: F,
      description: "Pied d'établissement de santé : trois blocs sur fond d'accent (nous trouver, horaires des visites, droits des patients), puis colonnes patients, visiteurs et professionnels, avertissement d'information générale.",
      tags: ["santé", "établissement public", "visiteurs", "patients", "horaires", "sobre"],
      identity: sante,
      structure: { rows: [
        C([
          [4, "head|Nous trouver", "contact", liens(["Plan d'accès et parkings>" + E + "/acces", "Venir en transports>" + E + "/transports"])],
          [4, "head|Horaires des visites", "hours|-"],
          [4, "head|Vos droits", liens(["Droits des patients>" + E + "/droits", "Personne de confiance>" + E + "/personne-de-confiance", "Plaintes et réclamations>" + E + "/reclamations", "Représentants des usagers>" + E + "/usagers"])],
        ], { bg: "accent", pad: "lg", rule: "none", min: "240px", gap: "32px" }),
        C([
          [3, "logo:40", para("Centre hospitalier du Val-Clair (établissement fictif de démonstration).", { maxWidth: "240px" }), declaration("partiellement conforme", { fond: "transparent" })],
          [3, "head|Patients", liens(["Prendre rendez-vous>" + E + "/rendez-vous", "Préparer mon séjour>" + E + "/sejour", "Dossier médical>" + E + "/dossier", "Facturation>" + E + "/facturation"])],
          [3, "head|Visiteurs", liens(["Accès et parking>" + E + "/acces", "Horaires des visites>" + E + "/visites", "Cafétéria et services>" + E + "/services", "Accueil des personnes handicapées>" + E + "/handicap"])],
          [3, "head|Professionnels", liens(["Offres d'emploi>" + E + "/emploi", "Formation>" + E + "/formation", "Recherche>" + E + "/recherche", "Presse>" + E + "/presse"])],
        ], { pad: "lg", rule: "none", min: "200px", gap: "32px" }),
        Z([encadre("Information générale", "Ce site fournit des informations pratiques et ne remplace pas l'avis d'un professionnel de santé. En cas d'urgence, contactez immédiatement le service d'urgence de votre pays.")], { pad: "md", bg: "alt", rule: "thin", max: "860px" }),
        Z(["legallinks", "copy:c"], { pad: "sm", rule: "thin", gap: "10px" }),
      ] },
      widgets: ["bizcontact", "bizhours", "text", "heading", "link", "sitelogo", "copyright", "bizlegal"],
    }, F),

    // 5 ─ Institution culturelle : index numéroté en grand
    modele({
      id: ids(5, "musee-index-numerote"),
      name: "Institution culturelle et index numéroté",
      family: F,
      description: "Pied de musée ou de bibliothèque : grande signature avec horaires et réseaux à gauche, index numéroté de rubriques en grandes lettres à droite, bandeau de lettre d'information puis mentions et accessibilité.",
      tags: ["musée", "bibliothèque", "culture", "index numéroté", "éditorial", "horaires"],
      identity: culture,
      structure: { rows: [
        C([
          [5, grand("Musée du Quai Bleu", 44, 32, { maxWidth: "420px" }), para("Institution culturelle fictive de démonstration. Collections, expositions et ateliers pour tous les publics.", { maxWidth: "380px" }), "hours|-", R_CULTURE],
          [7, indexNum([["01", "Visiter", E + "/visiter"], ["02", "Les collections", E + "/collections"], ["03", "Expositions et programme", E + "/programme"], ["04", "Apprendre et jouer", E + "/ateliers"], ["05", "Chercheurs et archives", E + "/archives"], ["06", "Soutenir le musée", E + "/mecenat"]])],
        ], { pad: "xl", rule: "none", min: "300px", gap: "64px" }),
        C([
          [5, grand("Un rendez-vous chaque mois.", 26, 24)],
          [7, "newsletter|La lettre du musée|Les nouvelles expositions et les soirées gratuites (exemple)."],
        ], { bg: "ink", pad: "lg", rule: "none", min: "280px", gap: "32px" }),
        C([
          [6, "head|Nous joindre", "contact:inline"],
          [6, declaration("partiellement conforme", { fond: "transparent" }), flux(["Plan du site>" + E + "/plan", "Accessibilité du lieu>" + E + "/acces-handicap", "Mentions>" + E + "/mentions"])],
        ], { pad: "md", rule: "thin", min: "260px", gap: "24px" }),
        Z(["legallinks", "copy:c"], { pad: "sm", rule: "thin", gap: "10px" }),
      ] },
      widgets: ["heading", "text", "bizhours", "social", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal"],
    }, F),

    // 6 ─ Organisme européen multilingue
    modele({
      id: ids(6, "organisme-europeen-multilingue"),
      name: "Organisme européen multilingue",
      family: F,
      description: "Pied sombre d'organisme multilingue : ligne de langues d'exemple, quatre colonnes (institutions, politiques, participer, transparence), registre, réseaux et protection des données.",
      tags: ["multilingue", "langues", "européen", "transparence", "colonnes", "sombre"],
      identity: europe,
      structure: { rows: [
        T(["logo:40"], [], [langues(["Français>" + E + "/fr", "English>" + E + "/en", "Deutsch>" + E + "/de", "Español>" + E + "/es", "Italiano>" + E + "/it", "Polski>" + E + "/pl", "Nederlands>" + E + "/nl"], "Langues (exemple) :")], { pad: "md", rule: "none", mobile: { gap: "14px" } }),
        C([
          [3, "head|Institutions et organes", liens(["Conseil des États (exemple)>" + E + "/conseil", "Commission (exemple)>" + E + "/commission", "Parlement (exemple)>" + E + "/parlement", "Cour de justice (exemple)>" + E + "/cour", "Agences>" + E + "/agences"])],
          [3, "head|Politiques", liens(["Climat>" + E + "/climat", "Numérique>" + E + "/numerique", "Économie>" + E + "/economie", "Recherche>" + E + "/recherche", "Frontières>" + E + "/frontieres"])],
          [3, "head|Participer", liens(["Consultations publiques>" + E + "/consultations", "Initiatives citoyennes>" + E + "/initiatives", "Pétitions>" + E + "/petitions", "Écrire à un représentant>/contact"])],
          [3, "head|Transparence", liens(["Registre de transparence>" + E + "/registre", "Accès aux documents>" + E + "/documents", "Budget>" + E + "/budget", "Audits>" + E + "/audits"])],
        ], { pad: "xl", bg: "alt", rule: "thin", min: "200px", gap: "40px", tablet: { gap: "32px" } }),
        C([
          [7, declaration("partiellement conforme", { fond: "transparent" }), para("Les textes officiels ne sont disponibles que dans leur version d'origine. Traductions d'exemple.", { fontSize: "12px" }), flux(["Protection des données>" + E + "/donnees"])],
          [5, "head|Suivre l'organisme", R_EUROPE],
        ], { pad: "md", rule: "thin", min: "260px", gap: "28px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "text", "link", "heading", "social", "copyright", "bizlegal"],
    }, F),

    // 7 ─ Préfecture : bandeau officiel et trois colonnes sobres
    modele({
      id: ids(7, "prefecture-bandeau-officiel"),
      name: "Préfecture sobre à bandeau officiel",
      family: F,
      description: "Pied de préfecture très sobre : bandeau officiel en haut, trois colonnes à filet épais (accueil du public, démarches, alertes et actualités), ligne d'accessibilité centrée et mentions légales en pile.",
      tags: ["préfecture", "sobre", "bandeau officiel", "alertes", "accueil du public", "monochrome"],
      identity: prefecture,
      structure: { rows: [
        Z([bandeau("Site officiel de la Préfecture de l'Aubrac-Est", "(organisme fictif de démonstration). Pour toute démarche, vérifiez que l'adresse du site est bien celle de l'administration.")], { bg: "accent", pad: "sm", rule: "none", max: "960px" }),
        C([
          [4, "head|Accueil du public", "hours|-", "contact"],
          [4, "head|Démarches", liens(["Titres de séjour>" + E + "/sejour", "Permis de conduire et cartes grises>" + E + "/vehicules", "Associations>" + E + "/associations", "Armes et chasse>" + E + "/chasse", "Rendez-vous en ligne>" + E + "/rendez-vous"], { gap: "10px" })],
          [4, "head|Alertes et actualités", liens(["Toutes les actualités>/blog", "Vigilance météo>" + E + "/vigilance", "Arrêtés et publications>" + E + "/recueil", "Communiqués de presse>" + E + "/presse"], { gap: "10px" })],
        ], { pad: "lg", rule: "thick", min: "240px", gap: "40px" }),
        Z([declaration("non conforme", { fond: "transparent" }), para("Ce site est en cours de mise en conformité. Contactez l'accueil pour toute information sous un autre format (exemple).", { fontSize: "12px", maxWidth: "560px" })], { pad: "md", bg: "alt", rule: "thin", gap: "8px" }),
        L(["copy", flux(["Plan du site>" + E + "/plan", "Mode d'emploi>" + E + "/mode-emploi"])], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["text", "heading", "bizhours", "bizcontact", "link", "copyright", "bizlegal"],
    }, F),

    // 8 ─ Intercommunalité : services en cartes
    modele({
      id: ids(8, "intercommunalite-services-en-cartes"),
      name: "Intercommunalité et services en cartes",
      family: F,
      description: "Pied d'intercommunalité : grille de six cartes de services (déchets, eau, mobilité, culture, emploi, urbanisme), communes membres en pastilles, contact, lettre d'information et mentions.",
      tags: ["intercommunalité", "communes", "services", "cartes", "démarches"],
      identity: interco,
      structure: { rows: [
        C([[12, "head|Les services de la Communauté (exemple)", services([
          ["Déchets", "Collecte, tri, déchèteries et composteurs.", "Calendrier de collecte", E + "/dechets"],
          ["Eau et assainissement", "Facture, abonnement et incidents.", "Mon contrat d'eau", E + "/eau"],
          ["Mobilité", "Bus, covoiturage et pistes cyclables.", "Horaires et plans", E + "/mobilite"],
          ["Culture et sport", "Médiathèques, piscines et saison culturelle.", "Voir le programme", E + "/culture"],
          ["Emploi et entreprises", "Zones d'activité, aides et accompagnement.", "S'installer", E + "/economie"],
          ["Urbanisme et habitat", "Plans locaux, permis, aides à la rénovation.", "Déposer un dossier", E + "/urbanisme"],
        ])]], { pad: "xl", rule: "none", min: "0px" }),
        C([
          [5, "head|Nos 12 communes (exemples)", puces(["Val-Fleuri>" + E + "/commune-1", "Les Tilleuls>" + E + "/commune-2", "Pont-Neuf>" + E + "/commune-3", "Saint-Aubin>" + E + "/commune-4", "Roche-Claire>" + E + "/commune-5", "Mont-Brun>" + E + "/commune-6", "Autres communes>" + E + "/communes"], { gap: "6px" }), declaration("partiellement conforme")],
          [4, "head|Nous joindre", "contact", "hours|-"],
          [3, "newsletter|L'info du territoire|Chantiers, collectes et rendez-vous."],
        ], { pad: "lg", bg: "alt", rule: "thin", min: "230px", gap: "32px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["heading", "text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
    }, F),
  ],
};
