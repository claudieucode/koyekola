// Famille « Services et prestations » — 7 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Marques de démonstration FICTIVES (artisan, consultant, freelance, agence, services à domicile, cabinet de soins, dépannage). Les liens https://exemple.fr/… sont des liens D'EXEMPLE à remplacer ;
// les zones d'intervention, garanties, assurances et avis sont des EXEMPLES marqués comme tels ; les coordonnées viennent des Données de l'entreprise (aucune coordonnée inventée).
const { modele, identifiantModele, ambiance, C, L, T, Z, A, widget, reseaux } = require("../kit-conception");

const F = "services";
const E = "https://exemple.fr";
const ids = (n, s) => identifiantModele(F, n, s);

// ── Aides locales (le kit ne les propose pas) ───────────────────────────────────────────────────────────────────────────────────────
// Colonne de liens de longueur libre « Libellé>adresse »
const liens = (list, size = "14px") => (k, env, center) => k.col(list.map((it) => { const [label, url] = it.split(">"); return k.LINK(label, url, { fontSize: size, fontWeight: "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap: "8px", alignItems: center ? "center" : "flex-start" });
// Grand titre (niveau 2) de taille libre, avec taille réduite sur mobile
const grand = (texte, px = 44, mob = 32, extra = {}) => (k, env, center) => k.H(texte, "2", { fontSize: `${px}px`, lineHeight: 1.08, ...(center ? { textAlign: "center" } : {}), ...extra }, undefined, { fontSize: `${mob}px` });
// Petit texte courant
const para = (texte, extra = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "14px", ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}), ...extra });
// Téléphone en très grand (lit les Données de l'entreprise : rien ne s'affiche tant qu'il n'est pas renseigné)
const telGeant = (px = 48, mob = 32, extra = {}) => widget("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { desktop: { fontSize: `${px}px`, fontWeight: "800", lineHeight: 1.05, ...extra }, mobile: { fontSize: `${mob}px` } });
const mailGrand = (px = 26, mob = 20) => widget("bizemail", { prefix: "", text: "", showIcon: false }, { desktop: { fontSize: `${px}px`, fontWeight: "700", lineHeight: 1.2 }, mobile: { fontSize: `${mob}px` } });
// Pastilles de texte (zones d'intervention, garanties : toujours des EXEMPLES à remplacer)
const pastilles = (list, opts = {}) => (k, env, center) => k.row(list.map((t) => k.T(`<p>${t}</p>`, {
  fontSize: "13px", fontWeight: "600", color: k.S.fg, lineHeight: 1.2, fontFamily: k.S.font, borderStyle: "solid", borderWidth: "1px", borderColor: opts.plein ? k.S.fg : k.S.line, borderRadius: opts.carre ? "4px" : "999px",
  backgroundColor: opts.fond ? k.S.alt : undefined, paddingTop: "7px", paddingBottom: "7px", paddingLeft: "12px", paddingRight: "12px" })), { gap: "8px", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
// Deux boutons côte à côte (pleine / contour)
const deux = (a, b) => (k, env, center) => k.row([k.B(a[0], a[1]), k.B(b[0], b[1], "outline", b[2] ? { borderColor: k.S.fg, color: k.S.fg } : {})], { gap: "12px", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
// Mention « exemple » discrète
const exemple = (texte) => (k, env, center) => k.T(`<p><em>${texte}</em></p>`, { color: k.S.mute, fontSize: "12px", ...(center ? { textAlign: "center" } : {}) });
// Avis (EXEMPLE) : citation courte et signature
const avis = (citation, auteur) => (k, env, center) => k.col([
  k.T(`<p>« ${citation} »</p>`, { fontSize: "16px", lineHeight: 1.45, fontStyle: "italic", color: k.S.fg, fontFamily: k.S.head }),
  k.T(`<p>${auteur} (avis d'exemple)</p>`, { fontSize: "12px", color: k.S.mute }),
], { gap: "8px", ...(center ? { alignItems: "center", textAlign: "center" } : {}) });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ────────────────────────────────────────────────────────────
const terre = ambiance({ key: "srv-terre-cuite", label: "Terre cuite d'atelier", humeur: "soft", fond: "#fbf1e4", texte: "#3b2111", accent: "#a63a0b", police: "font.karla", titres: "font.young-serif" });
const pierre = ambiance({ key: "srv-pierre-conseil", label: "Pierre de cabinet", humeur: "edit", fond: "#f6f5f2", texte: "#1f2933", accent: "#1f4e5f", police: "font.public-sans", titres: "font.newsreader" });
const carnet = ambiance({ key: "srv-carnet-freelance", label: "Carnet de freelance", humeur: "light", fond: "#f1ece1", texte: "#16130f", accent: "#ff5a1f", police: "font.space-grotesk", titres: "font.archivo-black" });
const graphite = ambiance({ key: "srv-graphite-corail", label: "Graphite et corail", humeur: "dark", fond: "#17171c", texte: "#f4f1ee", accent: "#ff7a59", police: "font.outfit", titres: "font.sora" });
const pin = ambiance({ key: "srv-ciel-pin", label: "Ciel et pin", humeur: "light", fond: "#eef6f4", texte: "#0f2f2b", accent: "#0f766e", police: "font.work-sans", titres: "font.lexend" });
const lin = ambiance({ key: "srv-lin-eucalyptus", label: "Lin et eucalyptus", humeur: "soft", fond: "#f4f6f1", texte: "#26352e", accent: "#3f6b55", police: "font.nunito-sans", titres: "font.fraunces" });
const signal = ambiance({ key: "srv-signal-urgence", label: "Signal d'urgence", humeur: "dark", fond: "#111111", texte: "#fafafa", accent: "#ffd400", police: "font.barlow", titres: "font.barlow-condensed" });

module.exports = {
  key: "services",
  label: "Services et prestations",
  description: "Prestataires : contact, rendez-vous, zone d'intervention, devis, horaires, formulaire de contact.",
  target: 7,
  built: true,
  models: [
    modele({
      id: ids(1, "artisan-grand-telephone"),
      name: "Artisan et grand numéro de téléphone",
      family: F,
      description: "Pied chaleureux d'artisan : bandeau terre cuite avec promesse de devis gratuit et téléphone en très grand, puis marque, métiers, entreprise et horaires ; liens légaux en bas.",
      tags: ["artisan", "téléphone", "devis gratuit", "horaires", "chaleureux"],
      identity: terre,
      structure: { rows: [
        C([
          [7, grand("Un devis gratuit, une réponse sous 24 heures.", 40, 28), telGeant(56, 34), "email"],
          [5, para("Atelier Rivière, plomberie et rénovation (marque fictive de démonstration). Appelez-nous ou écrivez-nous : nous passons voir votre chantier sans engagement.", { fontSize: "15px" }), deux(["Demander un devis", "/contact"], ["Poser une question", "/faq", true])],
        ], { bg: "accent", pad: "xl", rule: "none", min: "260px", gap: "40px" }),
        C([
          [4, "logo:44", para("Artisan de proximité depuis 1998. Travail soigné, chantier propre, garantie décennale (mention d'exemple)."), "socials:facebook+instagram+youtube|plain"],
          [3, "head|Nos métiers", liens([`Plomberie>${E}/plomberie`, `Chauffage>${E}/chauffage`, `Salle de bains>${E}/salle-de-bains`, `Dépannage>${E}/depannage`])],
          [2, "head|L'entreprise", liens([`Nos réalisations>${E}/realisations`, `Avis clients>${E}/avis`, `Questions>/faq`, `Contact>/contact`])],
          [3, "head|Horaires", "hours|-", "contact"],
        ], { pad: "lg", min: "190px", gap: "32px" }),
        L(["copy"], ["legallinks"], { pad: "sm", bg: "alt", rule: "thin" }),
      ] },
      widgets: ["heading", "bizphone", "bizemail", "text", "button", "sitelogo", "social", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(2, "consultant-rendez-vous-sobre"),
      name: "Consultant sobre et prise de rendez-vous",
      family: F,
      description: "Pied sobre de consultant : invitation centrée à un premier échange de 30 minutes avec deux boutons, puis ligne marque, menu du pied et LinkedIn, et mentions légales.",
      tags: ["consultant", "rendez-vous", "sobre", "centré", "linkedin"],
      identity: pierre,
      structure: { rows: [
        Z([grand("Un premier échange de 30 minutes, sans engagement.", 36, 27), para("Cabinet Delorme Conseil (marque fictive). Nous regardons votre situation et vous disons honnêtement si nous pouvons vous aider.", { maxWidth: "560px", fontSize: "15px" }), deux(["Prendre rendez-vous", "/contact"], ["Nous écrire", "/contact", true]), exemple("Le lien de rendez-vous est un exemple : remplacez-le par votre agenda en ligne.")], { pad: "xl", max: "760px", gap: "18px" }),
        T(["logo:36"], ["menuh"], ["socials:linkedin+youtube|plain"], { pad: "md", rule: "thin", bg: "alt" }),
        Z(["legallinks", "copy"], { pad: "md", rule: "thin", gap: "12px" }),
      ] },
      widgets: ["heading", "text", "button", "sitelogo", "menu", "social", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(3, "freelance-parlons-projet"),
      name: "Freelance et invitation à parler du projet",
      family: F,
      description: "Pied personnel de freelance : énorme invitation « Parlons de votre projet », e-mail en grand et statut de disponibilité, colonne de réseaux carrés et de liens vers le portfolio.",
      tags: ["freelance", "portfolio", "disponibilité", "e-mail", "affiche"],
      identity: carnet,
      structure: { rows: [
        C([
          [8, "badge|Disponible pour de nouvelles missions (exemple)", grand("Parlons de votre projet.", 84, 46, { maxWidth: "620px" }), mailGrand(30, 20), para("Lucie Marchand, designer indépendante (marque fictive). Je réponds en général sous 48 heures.", { fontSize: "15px", maxWidth: "460px" })],
          [4, "head|Me suivre", reseaux([{ network: "instagram", url: "https://www.instagram.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "website", url: "https://www.behance.net/" }], { taille: 48, forme: "square" }), "head|Explorer", liens([`Portfolio>${E}/portfolio`, `Tarifs et façon de travailler>${E}/tarifs`, `Journal>/blog`, `Contact>/contact`])],
        ], { pad: "xl", min: "250px", gap: "48px" }),
        L(["copy", "legallinks"], ["top"], { pad: "sm", rule: "thick" }),
      ] },
      widgets: ["text", "heading", "bizemail", "social", "link", "copyright", "bizlegal", "backtotop"],
    }, F),

    modele({
      id: ids(4, "agence-devis-formulaire"),
      name: "Agence à devis et formulaire de contact",
      family: F,
      description: "Pied sombre d'agence : promesse de devis sous 48 h avec téléphone et e-mail à gauche, formulaire de contact à droite, puis quatre volets de liens (accordéon sur mobile) et mentions.",
      tags: ["agence", "devis", "formulaire", "accordéon", "sombre"],
      identity: graphite,
      structure: { rows: [
        C([
          [5, "logo:40", grand("Racontez-nous votre projet, nous chiffrons sous 48 h.", 34, 26), "contact", "socials:linkedin+instagram+youtube|plain"],
          [7, "contactform|Demande de devis|Quelques lignes suffisent : besoin, délai, budget approximatif.", avis("Un devis clair en deux jours et un site livré à la date promise.", "Claire, gérante d'une boutique")],
        ], { pad: "xl", min: "280px", gap: "56px" }),
        A([
          ["Agence", liens([`Notre équipe>${E}/equipe`, `Notre méthode>${E}/methode`, `Carrières>${E}/carrieres`, `Contact>/contact`])],
          ["Prestations", liens([`Sites web>${E}/sites-web`, `Identité de marque>${E}/identite`, `Publicité en ligne>${E}/publicite`, `Photo et vidéo>${E}/photo-video`])],
          ["Références", liens([`Études de cas>${E}/etudes-de-cas`, `Clients>${E}/clients`, `Récompenses>${E}/recompenses`, `Journal>/blog`])],
          ["Pratique", "hours|-", liens([`Questions fréquentes>/faq`, `Espace client>/connexion`])],
        ], { pad: "lg", rule: "thin", bg: "alt", min: "170px" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "heading", "bizcontact", "social", "emailsubscribe", "link", "bizhours", "copyright", "bizlegal", "backtotop"],
    }, F),

    modele({
      id: ids(5, "domicile-zone-horaires"),
      name: "Service à domicile, zone et horaires",
      family: F,
      description: "Pied de service à domicile : barre marque et prise de rendez-vous, bloc central en trois parties (zone d'intervention en pastilles, horaires, coordonnées) et paiements acceptés.",
      tags: ["domicile", "zone d'intervention", "horaires", "rendez-vous", "paiement"],
      identity: pin,
      structure: { rows: [
        T(["logo:40"], [para("Intervention à domicile, du lundi au samedi (exemple).", { fontSize: "14px" })], ["cta|Prendre rendez-vous|/contact"], { pad: "md", rule: "accent" }),
        C([
          [5, "head|Où intervenons-nous ?", pastilles(["Lyon", "Villeurbanne", "Caluire", "Bron", "Vénissieux", "Écully", "Tassin", "Oullins"], { fond: true }), exemple("Communes d'exemple : remplacez-les par votre zone réelle."), "link|Votre commune n'est pas listée ? Demandez-nous|/contact"],
          [3, "head|Horaires", "hours|-"],
          [4, "head|Nous joindre", "contact", "socials:facebook+whatsapp+instagram|sq", "pay|Paiement accepté"],
        ], { pad: "lg", bg: "alt", min: "220px", gap: "40px" }),
        L(["copy"], ["legallinks"], { pad: "sm" }),
      ] },
      widgets: ["sitelogo", "text", "button", "link", "bizhours", "bizcontact", "social", "bizpayments", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(6, "cabinet-de-soins-accueillant"),
      name: "Cabinet de soins accueillant",
      family: F,
      description: "Pied apaisant de cabinet de soins : accordéon mobile (le cabinet, venir, infos pratiques), bouton de rendez-vous, rappel d'urgence neutre et mentions légales ; aucune promesse de résultat.",
      tags: ["cabinet", "soins", "rendez-vous", "accordéon", "apaisant"],
      identity: lin,
      structure: { rows: [
        A([
          [4, "Le cabinet", "logo:40", para("Cabinet Les Tilleuls (marque fictive de démonstration). Un lieu calme, un accueil sur rendez-vous."), "legalinfo"],
          [3, "Venir au cabinet", "contact", "hours|-"],
          [3, "Infos pratiques", liens([`Première consultation>${E}/premiere-consultation`, `Tarifs et remboursements>${E}/tarifs`, `Questions fréquentes>/faq`, `Prévenir d'un retard>/contact`]), "cta|Prendre rendez-vous|/contact", "link|Écrire au cabinet|/contact"],
        ], { pad: "xl", min: "220px", gap: "36px" }),
        Z([para("Ce site présente le cabinet et ne remplace pas une consultation. En cas d'urgence, appelez le 15.", { fontSize: "13px", maxWidth: "620px" })], { pad: "sm", bg: "alt", rule: "thin" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "text", "bizlegal", "bizcontact", "bizhours", "link", "button", "copyright"],
    }, F),

    modele({
      id: ids(7, "depannage-urgent-24h"),
      name: "Dépannage urgent 24 h sur 24",
      family: F,
      description: "Pied de dépannage : bandeau jaune d'urgence avec téléphone géant et bouton de rappel, puis quatre blocs (interventions, zone, garanties d'exemple, avis d'exemple) sur fond noir.",
      tags: ["dépannage", "urgence", "téléphone", "garanties", "zone"],
      identity: signal,
      structure: { rows: [
        L(["badge|Urgence 24 h/24, 7 j/7 (exemple)"], [telGeant(64, 38), "cta2|Être rappelé|/contact"], { bg: "accent", pad: "lg", rule: "none" }),
        C([
          [3, "logo:40", para("Dépann'Express (marque fictive). Un technicien chez vous, devis donné avant d'intervenir."), "email"],
          [3, "head|Nos dépannages", liens([`Serrurerie>${E}/serrurerie`, `Plomberie>${E}/plomberie`, `Électricité>${E}/electricite`, `Vitrerie>${E}/vitrerie`, `Tarifs affichés>${E}/tarifs`])],
          [3, "head|Zone d'intervention", pastilles(["Lille", "Roubaix", "Tourcoing", "Villeneuve-d'Ascq", "Marcq"], { carre: true }), exemple("Zone d'exemple, à adapter."), "head|Garanties", pastilles(["Devis avant travaux", "Pièces garanties 1 an", "Assurance pro"], { carre: true, plein: true }), exemple("Garanties d'exemple, à vérifier.")],
          [3, "head|Ils nous font confiance", avis("Arrivés en 40 minutes, très rassurants.", "Nadia, Lille"), avis("Devis respecté, intervention propre.", "Marc, Roubaix")],
        ], { pad: "xl", min: "210px", gap: "32px", rule: "none" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin", bg: "alt" }),
      ] },
      widgets: ["text", "bizphone", "button", "sitelogo", "text", "bizemail", "link", "copyright", "bizlegal", "backtotop"],
    }, F),
  ],
};
