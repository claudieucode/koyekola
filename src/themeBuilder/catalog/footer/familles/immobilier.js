// Famille « Immobilier » — 5 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Marques de démonstration FICTIVES (agence de quartier, réseau national, promoteur, portail d'annonces, gestionnaire locatif). Les liens https://exemple.fr/… sont des liens D'EXEMPLE à remplacer ;
// carte professionnelle, garantie financière, médiateur, honoraires, programmes, dates de livraison et recherches populaires sont des VALEURS D'EXEMPLE clairement marquées ; les coordonnées et les mentions
// réelles viennent des Données de l'entreprise (aucune coordonnée ni aucun numéro inventé n'est présenté comme réel).
const { modele, identifiantModele, ambiance, C, L, T, Z, A } = require("../kit-conception");
const Moteur = require("../moteur");

const F = "immobilier";
const E = "https://exemple.fr";
const ids = (n, s) => identifiantModele(F, n, s);

// ── Aides locales (le kit ne les propose pas) ───────────────────────────────────────────────────────────────────────────────────────
const liens = (list, size = "14px") => (k, env, center) => k.col(list.map((it) => { const [label, url] = it.split(">"); return k.LINK(label, url, { fontSize: size, fontWeight: "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap: "8px", alignItems: center ? "center" : "flex-start" });
const grand = (texte, px = 44, mob = 32, extra = {}) => (k, env, center) => k.H(texte, "2", { fontSize: `${px}px`, lineHeight: 1.08, ...(center ? { textAlign: "center" } : {}), ...extra }, undefined, { fontSize: `${mob}px` });
const para = (texte, extra = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "14px", ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}), ...extra });
const deux = (a, b) => (k, env, center) => k.row([k.B(a[0], a[1]), k.B(b[0], b[1], "outline", { borderColor: k.S.fg, color: k.S.fg })], { gap: "12px", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
// Carte (fond alterné, rayon et ombre de l'ambiance) contenant des éléments écrits en codes ou en fonctions
const carte = (codes, st = {}) => (k, env, center) => k.card(codes.map((c) => Moteur.item(k, c, env, center)), { gap: "14px", width: "100%", ...st });
// Recherche du site sur une seule ligne (champ + bouton) : largeur libre, plafonnée
const recherche = (px = 520, fixe = false) => (k, env, center) => { const n = Moteur.item(k, "search:catalogue", env, center); n.styles.desktop = { ...n.styles.desktop, width: fixe ? `${px}px` : "100%", maxWidth: fixe ? "100%" : `${px}px`, ...(center ? { alignSelf: "center" } : {}) }; n.styles.mobile = { ...(n.styles.mobile || {}), width: "100%", maxWidth: "100%" }; return n; };
// Rangée de cartes de même hauteur ; chaque carte est une liste de codes
const cartes = (liste, opts = {}) => (k, env, center) => k.row(liste.map((codes) => k.card(codes.map((c) => Moteur.item(k, c, env, center)), { gap: "14px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 1, minWidth: opts.min || "250px", alignSelf: "stretch" })), { gap: "24px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
// Pastilles CLIQUABLES (recherches rapides, recherches populaires) : vrais liens, cibles de 44 px sur mobile ajoutées par le moteur
const pastillesLiens = (list, opts = {}) => (k, env, center) => k.row(list.map((it) => { const [label, url] = it.split(">"); return k.LINK(label, url, {
  fontSize: opts.petit ? "12px" : "13px", fontWeight: "600", lineHeight: 1.2, borderStyle: "solid", borderWidth: "1px", borderColor: opts.plein ? k.S.fg : k.S.line, borderRadius: opts.carre ? "4px" : "999px",
  backgroundColor: opts.fond ? k.S.alt : undefined, paddingTop: "8px", paddingBottom: "8px", paddingLeft: "14px", paddingRight: "14px" }); }), { gap: "8px", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
// Programmes neufs numérotés (EXEMPLES) : numéro en grand, nom, ville et livraison, lien
const programmes = (list) => (k, env) => k.row(list.map((p, i) => k.col([
  k.T(`<p>${String(i + 1).padStart(2, "0")}</p>`, { fontFamily: k.S.head, fontSize: "44px", lineHeight: 1, color: k.S.accent }),
  k.H(p.nom, "3", { fontSize: "22px", lineHeight: 1.15 }),
  k.T(`<p>${p.ville}<br>${p.detail}</p>`, { color: k.S.mute, fontSize: "13px" }),
  k.LINK("Découvrir le programme", `${E}/programmes/${p.slug}`, { fontSize: "13px", fontWeight: "600" }),
], { gap: "10px", flexBasis: "0px", flexGrow: 1, minWidth: "190px", borderLeftStyle: "solid", borderLeftWidth: "1px", borderLeftColor: k.S.line, paddingLeft: "20px" })), { gap: "24px", alignItems: "flex-start", flexWrap: "wrap" });
// Barème en lignes « libellé ........ valeur » (honoraires d'EXEMPLE)
const bareme = (titre, lignes, note) => (k) => k.col([
  k.L(titre),
  ...lignes.map(([a, b]) => k.row([k.T(`<p>${a}</p>`, { fontSize: "14px", flexGrow: 1 }), k.T(`<p><strong>${b}</strong></p>`, { fontSize: "14px", textAlign: "right" })], { gap: "12px", flexWrap: "nowrap", justifyContent: "space-between", borderBottomStyle: "dotted", borderBottomWidth: "1px", borderBottomColor: k.S.line, paddingBottom: "6px", width: "100%" })),
  k.T(`<p><em>${note}</em></p>`, { color: k.S.mute, fontSize: "12px" }),
], { gap: "10px", width: "100%" });
// Bloc de mention réglementaire (valeur d'EXEMPLE marquée)
const mention = (titre, texte) => (k) => k.col([k.L(titre), k.T(`<p>${texte}</p>`, { fontSize: "13px", color: k.S.fg }), k.T("<p><em>Valeur d'exemple : à remplacer par votre mention réelle.</em></p>", { fontSize: "12px", color: k.S.mute })], { gap: "6px" });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ────────────────────────────────────────────────────────────
const tilleul = ambiance({ key: "imm-tilleul-brique", label: "Brique et crème de quartier", humeur: "soft", fond: "#fbf4ea", texte: "#33231a", accent: "#a8431f", police: "font.nunito", titres: "font.fraunces" });
const reseau = ambiance({ key: "imm-reseau-nuit", label: "Bleu nuit de réseau", humeur: "brand", fond: "#0e2238", texte: "#f3f6fa", accent: "#ff9d3d", police: "font.public-sans", titres: "font.manrope" });
const promoteur = ambiance({ key: "imm-promoteur-sapin", label: "Sapin et champagne", humeur: "dark", fond: "#10231d", texte: "#f2ece0", accent: "#d9bd8a", police: "font.jost", titres: "font.cormorant-garamond" });
const portail = ambiance({ key: "imm-portail-corail", label: "Corail de portail", humeur: "light", fond: "#f7f9fc", texte: "#14213d", accent: "#c2410c", police: "font.figtree", titres: "font.bricolage-grotesque" });
const gestion = ambiance({ key: "imm-gestion-lagune", label: "Lagune de gestion", humeur: "light", fond: "#f1f6f6", texte: "#102a2e", accent: "#0b6470", police: "font.red-hat-text", titres: "font.red-hat-display" });

module.exports = {
  key: "immobilier",
  label: "Immobilier",
  description: "Agences : recherche de biens, estimation, mentions légales renforcées, coordonnées.",
  target: 5,
  built: true,
  models: [
    modele({
      id: ids(1, "agence-de-quartier-estimation"),
      name: "Agence de quartier et estimation offerte",
      family: F,
      description: "Pied chaleureux d'agence indépendante : grande promesse de quartier et boutons d'estimation, carte « passez nous voir » avec coordonnées et horaires, puis quatre volets acheter, louer, vendre, quartier (accordéon mobile).",
      tags: ["agence", "quartier", "estimation", "horaires", "chaleureux"],
      identity: tilleul,
      structure: { rows: [
        C([
          [7, "badge|Agence indépendante depuis 1994 (exemple)", grand("Votre quartier, nous le connaissons rue par rue.", 52, 34, { maxWidth: "620px" }), para("Agence Les Tilleuls Immobilier (marque fictive de démonstration). Une estimation gratuite, honnête et sans engagement, donnée par quelqu'un qui habite à côté.", { fontSize: "15px", maxWidth: "520px" }), deux(["Estimer mon bien gratuitement", "/contact"], ["Voir les biens à vendre", `${E}/vente`])],
          [5, carte(["head|Passez nous voir", "contact", "hours|-", "socials:facebook+instagram+whatsapp|plain"])],
        ], { pad: "xl", min: "280px", gap: "48px" }),
        A([
          ["Acheter", liens([`Maisons à vendre>${E}/vente/maisons`, `Appartements à vendre>${E}/vente/appartements`, `Programmes neufs>${E}/neuf`, `Alerte nouveautés>${E}/alerte`])],
          ["Louer", liens([`Locations disponibles>${E}/location`, `Constituer mon dossier>${E}/location/dossier`, `Les loyers du quartier>${E}/location/loyers`, `Quittances>/connexion`])],
          ["Vendre", liens([`Estimer mon bien>/contact`, `Notre façon de vendre>${E}/vendre`, `Diagnostics (DPE, exemple)>${E}/diagnostics`, `Honoraires (exemple)>${E}/honoraires`])],
          ["Le quartier", liens([`Nos biens vendus>${E}/vendus`, `Avis de voisins>${E}/avis`, `L'équipe>${E}/equipe`, `Questions fréquentes>/faq`])],
        ], { pad: "lg", bg: "alt", rule: "thin", min: "170px", gap: "32px" }),
        L(["text|Honoraires d'agence : barème d'exemple affiché en vitrine et en ligne, à remplacer par le vôtre."], ["legallinks"], { pad: "sm" }),
        L(["copy"], ["socials:instagram+facebook|plain"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["text", "heading", "button", "bizcontact", "bizhours", "social", "link", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(2, "reseau-national-mentions-renforcees"),
      name: "Réseau national et mentions renforcées",
      family: F,
      description: "Pied dense de réseau d'agences : barre logo, recherche et estimation, six volets de liens (accordéon mobile), trois blocs de mentions réglementaires d'exemple (carte pro, garantie, médiateur) et réseaux.",
      tags: ["réseau", "dense", "mentions légales", "carte professionnelle", "médiateur", "recherche"],
      identity: reseau,
      structure: { rows: [
        L(["logo:40"], [recherche(400, true), "cta|Estimer mon bien|/contact"], { pad: "md", rule: "none" }),
        A([
          ["Acheter", liens([`Appartements>${E}/vente/appartements`, `Maisons>${E}/vente/maisons`, `Terrains>${E}/vente/terrains`, `Prix au m²>${E}/prix`])],
          ["Louer", liens([`Locations vides>${E}/location`, `Meublés>${E}/location/meubles`, `Colocation>${E}/location/colocation`, `Dossier de location>${E}/dossier`])],
          ["Vendre", liens([`Estimation gratuite>/contact`, `Mandat de vente>${E}/mandat`, `Diagnostics DPE (exemple)>${E}/dpe`, `Home staging>${E}/home-staging`])],
          ["Neuf et investir", liens([`Programmes neufs>${E}/neuf`, `Investissement locatif>${E}/investir`, `Simulateur de prêt>${E}/simulateur`, `Défiscalisation>${E}/defiscalisation`])],
          ["Nos agences", liens([`Île-de-France>${E}/agences/ile-de-france`, `Auvergne-Rhône-Alpes>${E}/agences/aura`, `Occitanie>${E}/agences/occitanie`, `Toutes les agences>${E}/agences`])],
          ["Le réseau", liens([`Nous rejoindre>${E}/carrieres`, `Presse>${E}/presse`, `Questions fréquentes>/faq`, `Contact>/contact`])],
        ], { pad: "lg", rule: "thin", min: "140px", gap: "28px" }),
        C([
          [4, mention("Carte professionnelle", "Carte T « Transaction sur immeubles et fonds de commerce » n° 0000 0000000, délivrée par la CCI de [votre ville]."), "legalinfo"],
          [4, mention("Garantie financière", "Garantie de [nom du garant], [adresse du garant], pour un montant de 000 000 euros.")],
          [4, mention("Médiateur de la consommation", "En cas de litige, vous pouvez saisir gratuitement [nom du médiateur], [adresse ou site du médiateur].")],
        ], { pad: "lg", bg: "alt", rule: "thin", min: "240px", gap: "36px" }),
        L(["copy"], ["socials:linkedin+facebook+instagram+youtube|plain", "legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "search", "button", "link", "heading", "text", "bizlegal", "social", "copyright"],
    }, F),

    modele({
      id: ids(3, "promoteur-programmes-numerotes"),
      name: "Promoteur et programmes numérotés",
      family: F,
      description: "Pied élégant de promoteur : titre en grande serif, avant-première par e-mail, trois programmes neufs numérotés (exemples) séparés par des filets fins, avertissement légal centré et ligne de réseaux.",
      tags: ["promoteur", "programmes neufs", "élégant", "avant-première", "avertissement"],
      identity: promoteur,
      structure: { rows: [
        C([
          [5, "logo:44", grand("Des adresses où l'on a envie de rester.", 44, 32, { maxWidth: "420px" }), "newsletter|Les prochains lancements en avant-première|Un e-mail seulement quand un programme ouvre à la réservation."],
          [7, "head|Nos programmes en cours (exemples)", programmes([
            { nom: "Les Jardins d'Émeraude", ville: "Bordeaux Caudéran", detail: "Livraison prévue 2027 (exemple)", slug: "jardins-emeraude" },
            { nom: "Maison Verrière", ville: "Nantes centre", detail: "Livraison prévue 2028 (exemple)", slug: "maison-verriere" },
            { nom: "Cap Horizon", ville: "La Rochelle", detail: "Livraison prévue 2027 (exemple)", slug: "cap-horizon" },
          ])],
        ], { pad: "xl", min: "280px", gap: "56px" }),
        Z([para("Les illustrations et perspectives sont non contractuelles. Investir dans l'immobilier comporte des risques ; les dispositifs fiscaux dépendent de votre situation. Mention d'exemple, à remplacer par vos mentions réelles.", { fontSize: "12px", maxWidth: "720px" }), "legalinfo:inline"], { pad: "md", bg: "alt", rule: "thin", gap: "10px", max: "860px" }),
        T(["copy"], ["menuh"], ["socials:instagram+linkedin+youtube|plain"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "heading", "emailsubscribe", "text", "link", "bizlegal", "menu", "social", "copyright"],
    }, F),

    modele({
      id: ids(4, "portail-annonces-recherche"),
      name: "Portail d'annonces et recherche",
      family: F,
      description: "Pied de portail d'annonces : bande corail avec grande promesse, recherche et recherches rapides en pastilles, quatre colonnes de liens et alerte e-mail, nuage de recherches populaires (exemples) et mentions.",
      tags: ["portail", "annonces", "recherche", "pastilles", "alerte e-mail"],
      identity: portail,
      structure: { rows: [
        C([
          [6, grand("Des milliers d'annonces, une seule recherche.", 46, 32, { maxWidth: "520px" }), para("Portail Toitmoi (marque fictive de démonstration) : maisons, appartements, terrains et locaux, mis à jour chaque jour.", { fontSize: "15px", maxWidth: "460px" })],
          [6, recherche(520), pastillesLiens([`Appartements à vendre>${E}/vente/appartements`, `Maisons à vendre>${E}/vente/maisons`, `Locations>${E}/location`, `Neuf>${E}/neuf`, `Terrains>${E}/vente/terrains`], { plein: true }), para("Plus de 12 000 annonces en ligne (chiffre d'exemple).", { fontSize: "13px" })],
        ], { bg: "accent", pad: "xl", rule: "none", min: "280px", gap: "40px" }),
        C([
          [2, "head|Acheter", liens([`Paris>${E}/vente/paris`, `Lyon>${E}/vente/lyon`, `Marseille>${E}/vente/marseille`, `Toutes les villes>${E}/vente`])],
          [2, "head|Louer", liens([`Paris>${E}/location/paris`, `Lyon>${E}/location/lyon`, `Marseille>${E}/location/marseille`, `Toutes les villes>${E}/location`])],
          [2, "head|Types de biens", liens([`Studios>${E}/studios`, `Maisons>${E}/maisons`, `Terrains>${E}/terrains`, `Locaux pro>${E}/locaux`])],
          [2, "head|Professionnels", liens([`Déposer une annonce>${E}/deposer`, `Tarifs d'exemple>${E}/tarifs`, `Espace pro>/connexion`, `Aide>/faq`])],
          [4, "newsletter|Soyez prévenu des nouvelles annonces|Une alerte e-mail selon vos critères, désinscription en un clic."],
        ], { pad: "lg", min: "150px", gap: "28px" }),
        C([
          [12, "head|Recherches populaires (exemples)", pastillesLiens([`Appartement 2 pièces Lyon>${E}/r/2p-lyon`, `Maison avec jardin Nantes>${E}/r/jardin-nantes`, `Studio étudiant Lille>${E}/r/studio-lille`, `Loft Marseille>${E}/r/loft-marseille`, `Terrain constructible Toulouse>${E}/r/terrain-toulouse`, `Location meublée Paris>${E}/r/meuble-paris`, `Maison de campagne>${E}/r/campagne`, `Appartement neuf Bordeaux>${E}/r/neuf-bordeaux`], { petit: true, fond: true })],
        ], { pad: "md", bg: "alt", rule: "thin", min: "0px" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["heading", "text", "search", "link", "emailsubscribe", "copyright", "bizlegal", "backtotop"],
    }, F),

    modele({
      id: ids(5, "gestion-locative-espaces"),
      name: "Gestionnaire locatif et deux espaces",
      family: F,
      description: "Pied de gestionnaire de biens : trois cartes (espace locataire, espace propriétaire, nous joindre avec horaires), barème d'honoraires de gestion d'exemple, présentation légale et médiateur.",
      tags: ["gestion locative", "locataire", "propriétaire", "honoraires", "cartes"],
      identity: gestion,
      structure: { rows: [
        C([
          [12, cartes([
            ["badge|Espace locataire", "H|Un loyer à payer, un document à retrouver|3", liens([`Payer mon loyer>/connexion`, `Mes quittances>/connexion`, `Signaler un problème>/contact`, `Assurance habitation>${E}/assurance`]), "cta|Me connecter|/connexion"],
            ["badge|Espace propriétaire", "H|Vos comptes rendus, en clair|3", liens([`Mes relevés de gestion>/connexion`, `Suivi des travaux>/connexion`, `Confier mon bien>/contact`, `Garantie loyers impayés>${E}/gli`]), "cta2|Accéder à mon espace|/connexion"],
            ["H|Nous joindre|3", "contact", "hours|-", "socials:linkedin+facebook|plain"],
          ])],
        ], { pad: "xl", min: "0px" }),
        C([
          [5, "logo:40", para("Gestion Clairloc (marque fictive de démonstration). Nous gérons votre bien comme le nôtre : loyers encaissés à date, travaux validés avec vous.", { maxWidth: "380px" }), "legalinfo"],
          [3, "head|Gérer avec nous", liens([`Confier mon bien>/contact`, `Nos engagements>${E}/engagements`, `Avis propriétaires>${E}/avis`, `Questions fréquentes>/faq`])],
          [4, bareme("Honoraires de gestion (exemple)", [["Gestion courante", "6 % des loyers"], ["Mise en location", "1 mois de loyer"], ["Garantie loyers impayés", "2,5 % des loyers"]], "Barème d'exemple, à remplacer par vos honoraires réels.")],
        ], { pad: "lg", bg: "alt", rule: "thin", min: "230px", gap: "40px" }),
        Z([para("Médiateur : en cas de litige, saisissez gratuitement [nom du médiateur] (valeur d'exemple, à remplacer). Carte professionnelle de gestion immobilière et garantie financière : voir mentions légales.", { fontSize: "12px", maxWidth: "720px" })], { pad: "sm", rule: "thin", max: "860px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["text", "heading", "link", "button", "bizcontact", "bizhours", "social", "sitelogo", "bizlegal", "copyright"],
    }, F),
  ],
};
