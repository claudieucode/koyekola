// Famille « ONG et associations » — 5 modèles : grande ONG humanitaire (appel au don), association de quartier chaleureuse, fondation sobre, collectif militant à ton fort, tiers-lieu avec adhésion et agenda.
// Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md. Tout nom d'organisation, chiffre, date, tarif, montant, agrément et lien https://exemple.org/… est un EXEMPLE à remplacer (marqué « exemple » quand c'est visible).
// Aucun paiement n'est simulé : les montants de don sont de simples liens vers une page « don » d'exemple.
const { modele, identifiantModele, ambiance, C, L, T, Z, A, colonnes12, reseaux } = require("../kit-conception");
const { item } = require("../moteur");

const FAM = "ong-associations";
const E = "https://exemple.org";
const ids = (n, s) => identifiantModele(FAM, n, s);

// ── Aides LOCALES (le kit n'a pas ces éléments). Chacune renvoie (k, env, center) → nœud ; le moteur ajoute survol, focus et cibles de 44 px. ─────────────────────────────────────
// Liste de liens : "Libellé>adresse"
const liens = (list, taille = 14) => (k, env, center) => k.col(list.map((s) => { const [l, u] = s.split(">"); return k.LINK(l, u, { fontSize: `${taille}px`, fontWeight: "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap: "8px", alignItems: center ? "center" : "flex-start" });
const phrase = (texte, { taille = 15, largeur = "480px", fg = false } = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: fg ? k.S.fg : k.S.mute, fontSize: `${taille}px`, fontFamily: k.S.font, maxWidth: largeur, ...(center ? { textAlign: "center" } : {}) });
const titre = (texte, d, t, m, o = {}) => (k, env, center) => k.H(texte, o.niveau || "2", { fontSize: `${d}px`, lineHeight: o.lh || 1.1, letterSpacing: o.serre || "-0.02em", fontFamily: k.S.head, overflowWrap: "anywhere", ...(o.maj ? { textTransform: "uppercase" } : {}), ...(o.largeur ? { maxWidth: o.largeur } : {}), ...(center ? { textAlign: "center" } : {}) }, { fontSize: `${t}px` }, { fontSize: `${m}px` });
const cote = (codes) => (k, env, center) => k.row(codes.map((c) => item(k, c, env, center)), { gap: "12px", ...(center ? { justifyContent: "center" } : {}) });
const etiquette = (texte) => (k, env, center) => k.T(`<p><strong>${texte}</strong></p>`, { fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: k.S.font, color: k.S.onAccent, backgroundColor: k.S.accent, borderRadius: "999px", paddingTop: "4px", paddingBottom: "4px", paddingLeft: "12px", paddingRight: "12px", alignSelf: center ? "center" : "flex-start" });
// Note discrète (mention d'exemple : reçu fiscal, agrément…)
const note = (texte) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "12px", lineHeight: 1.5, fontFamily: k.S.font, maxWidth: "520px", ...(center ? { textAlign: "center" } : {}) });
// Chiffre d'impact (exemple)
const chiffre = (nombre, legende, taille = 44) => (k) => k.col([
  k.H(nombre, "3", { fontSize: `${taille}px`, lineHeight: 1, letterSpacing: "-0.03em", fontFamily: k.S.head }, { fontSize: `${Math.round(taille * 0.8)}px` }, { fontSize: `${Math.round(taille * 0.7)}px` }),
  k.T(`<p>${legende}</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font }),
], { gap: "6px" });
// Montants de don : pastilles-liens (lien vers une page « don » d'exemple, jamais de faux paiement)
const montants = (liste) => (k) => k.row(liste.map(([m, sous]) => k.LINK(`${m}${sous ? " · " + sous : ""}`, `${E}/don`, { fontSize: "15px", fontWeight: "700", fontFamily: k.S.font, color: k.S.fg, borderStyle: "solid", borderWidth: "2px", borderColor: k.S.fg, borderRadius: "999px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "18px", paddingRight: "18px" })), { gap: "10px" });
// Document de transparence : type, titre, détail d'exemple
const document = (nom, detail) => (k) => k.row([
  k.T(`<p><strong>PDF</strong></p>`, { fontSize: "11px", letterSpacing: "0.06em", fontFamily: k.S.font, color: k.S.fg, borderStyle: "solid", borderWidth: "1px", borderColor: k.S.fg, borderRadius: "3px", paddingTop: "3px", paddingBottom: "3px", paddingLeft: "7px", paddingRight: "7px" }),
  k.col([k.LINK(nom, `${E}/transparence`, { fontSize: "15px", fontWeight: "700", fontFamily: k.S.font }), k.T(`<p>${detail} (exemple)</p>`, { color: k.S.mute, fontSize: "12px", fontFamily: k.S.font })], { gap: "2px", flexBasis: "180px", flexGrow: 1 }),
], { gap: "12px", alignItems: "flex-start", flexWrap: "nowrap", paddingTop: "12px", paddingBottom: "12px", borderStyle: "solid", borderTopWidth: "1px", borderBottomWidth: "0px", borderLeftWidth: "0px", borderRightWidth: "0px", borderColor: k.S.line, width: "100%" });
const documents = (liste) => (k) => k.col(liste.map(([a, b]) => document(a, b)(k)), { gap: "0px", width: "100%" });
// Barre de progression d'une collecte (exemple) : pourcentage + légende
const progression = (pct, gauche, droite) => (k) => k.col([
  k.row([k.col([], { width: `${pct}%`, height: "12px", backgroundColor: k.S.accent, borderRadius: "999px" })], { width: "100%", height: "16px", backgroundColor: k.S.alt, borderRadius: "999px", flexWrap: "nowrap", borderStyle: "solid", borderWidth: "2px", borderColor: k.S.fg }),
  k.row([k.T(`<p><strong>${gauche}</strong></p>`, { fontSize: "14px", fontFamily: k.S.font, color: k.S.fg }), k.T(`<p>${droite}</p>`, { fontSize: "14px", fontFamily: k.S.font, color: k.S.mute })], { gap: "12px", justifyContent: "space-between" }),
], { gap: "10px", width: "100%" });
// Carte de formule d'adhésion (tarif d'exemple)
const formule = (nom, prix, texte, url, vedette = false) => (k) => k.col([
  k.T(`<p><strong>${nom}</strong></p>`, { fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: k.S.font, color: vedette ? k.S.onAccent : k.S.mute }),
  k.H(prix, "3", { fontSize: "34px", lineHeight: 1, fontFamily: k.S.head, color: vedette ? k.S.onAccent : k.S.fg }),
  k.T(`<p>${texte}</p>`, { color: vedette ? k.S.onAccent : k.S.mute, fontSize: "13px", fontFamily: k.S.font }),
  k.LINK("Choisir →", url, { fontSize: "14px", fontWeight: "700", fontFamily: k.S.font, color: vedette ? k.S.onAccent : k.S.fg, textDecoration: "underline" }),
], { flexBasis: "170px", flexGrow: 1, minWidth: "150px", gap: "8px", backgroundColor: vedette ? k.S.accent : "transparent", borderStyle: "solid", borderWidth: "2px", borderColor: vedette ? k.S.accent : k.S.fg, borderRadius: "16px", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px" });
const formules = (liste) => (k) => k.row(liste.map(([a, b, c, d, e]) => formule(a, b, c, d, e)(k)), { gap: "12px", alignItems: "stretch" });
// Rendez-vous de la frise : jour en grand, mois, titre, lieu (exemples)
const date = (jour, mois, nom, lieu) => (k) => k.col([
  k.row([k.H(jour, "3", { fontSize: "40px", lineHeight: 1, fontFamily: k.S.head }), k.T(`<p><strong>${mois}</strong></p>`, { fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: k.S.font, color: k.S.fg })], { gap: "8px", alignItems: "baseline", flexWrap: "nowrap" }),
  k.H(nom, "4", { fontSize: "17px", lineHeight: 1.2, fontFamily: k.S.head }),
  k.T(`<p>${lieu} (exemple)</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font }),
], { gap: "6px" });
// Gros bloc d'action cliquable (ton militant)
const action = (num, verbe, url, fond) => (k) => k.col([
  k.T(`<p><strong>${num}</strong></p>`, { fontSize: "14px", letterSpacing: "0.1em", fontFamily: k.S.font, color: fond ? k.S.onAccent : k.S.accent }),
  k.LINK(verbe, url, { fontSize: "34px", fontWeight: "800", lineHeight: 1.05, letterSpacing: "-0.02em", fontFamily: k.S.head, textTransform: "uppercase", color: fond ? k.S.onAccent : k.S.fg, textDecoration: "none" }),
], { flexBasis: "220px", flexGrow: 1, minWidth: "200px", gap: "10px", backgroundColor: fond ? k.S.accent : "transparent", borderStyle: "solid", borderWidth: "3px", borderColor: k.S.accent, paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px" });
const actions = (liste) => (k) => k.row(liste.map(([a, b, c, d]) => action(a, b, c, d)(k)), { gap: "16px", alignItems: "stretch" });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ───────────────────────────────────────────────────────────────────────────────────────────────────
const urgence = ambiance({ key: "ong-urgence", label: "Urgence — blanc cassé et rouge solidaire", humeur: "light", fond: "#fffaf5", texte: "#1c1917", accent: "#c2272d", police: "font.public-sans", titres: "font.bricolage-grotesque" });
const quartier = ambiance({ key: "ong-quartier", label: "Quartier — crème et terre cuite", humeur: "dark", fond: "#16233d", texte: "#f6efe4", accent: "#f2a65a", police: "font.nunito", titres: "font.fraunces" });
const mecenat = ambiance({ key: "ong-mecenat", label: "Mécénat — ivoire, marine et laiton", humeur: "edit", fond: "#f6f3ec", texte: "#13233f", accent: "#7a5c12", police: "font.source-sans-3", titres: "font.newsreader" });
const barricade = ambiance({ key: "ong-barricade", label: "Barricade — noir et jaune signal", humeur: "dark", fond: "#0e0e0e", texte: "#f7f7f2", accent: "#ffe11a", police: "font.work-sans", titres: "font.archivo-black" });
const atelier = ambiance({ key: "ong-atelier", label: "Atelier — kraft et sapin", humeur: "light", fond: "#eee7d8", texte: "#1e2a24", accent: "#c8461f", police: "font.figtree", titres: "font.syne" });

const models = [
  // 1 ─ Grande ONG humanitaire : bande d'appel au don avec montants, bande de chiffres d'impact, quatre volets (accordéon mobile), mentions
  modele({
    id: ids(1, "ong-humanitaire-appel-au-don"),
    name: "Grande ONG humanitaire : appel au don",
    family: FAM,
    description: "Grande bande d'appel au don rouge avec montants au choix (liens d'exemple) et mention de reçu fiscal d'exemple, chiffres d'impact, quatre volets accordéon (agir, transparence, presse, contact) et mentions légales.",
    tags: ["ONG", "humanitaire", "don", "impact", "transparence"],
    identity: urgence,
    structure: { rows: [
      colonnes12([
        [7, etiquette("Urgence : saison des pluies"), titre("Avec 30 €, une famille mange pendant un mois.", 46, 36, 30, { lh: 1.04, largeur: "620px" }), montants([["20 €", ""], ["30 €", "le plus choisi"], ["60 €", ""], ["Autre montant", ""]])],
        [5, phrase("Chaque don finance des vivres, de l'eau potable et des soins. Merci de votre confiance (texte d'exemple).", { taille: 15, fg: true }), "cta|Faire un don maintenant|" + E + "/don", note("Lien de don d'exemple, à remplacer par votre page de paiement. Mention d'exemple : un reçu fiscal vous est envoyé, 66 % du don est déductible selon la loi en vigueur.")],
      ], { bg: "accent", pad: "xl", gap: "48px", min: "290px", rule: "none" }),
      colonnes12([
        [3, chiffre("1,2 M", "personnes aidées en 2025 (exemple)")],
        [3, chiffre("38", "pays d'intervention (exemple)")],
        [3, chiffre("86 %", "des dons vont aux missions (exemple)")],
        [3, chiffre("4 200", "bénévoles mobilisés (exemple)")],
      ], { bg: "alt", pad: "lg", min: "160px", rule: "none" }),
      A([
        [3, "Agir avec nous", liens([`Devenir bénévole>${E}/benevolat`, `Don mensuel>${E}/don`, `Legs et assurance-vie>${E}/legs`, `Entreprises partenaires>${E}/mecenat`])],
        [3, "Transparence", liens([`Rapport annuel 2025 (exemple)>${E}/rapport`, `Comptes certifiés (exemple)>${E}/comptes`, `Agrément et labels (exemples)>${E}/agrement`, `Charte éthique>${E}/charte`])],
        [3, "Presse et ressources", liens([`Espace presse>${E}/presse`, `Nos enquêtes>/blog`, `Photothèque>${E}/photos`, `Offres d'emploi>${E}/emploi`])],
        [3, "Nous joindre", "contact", "link|Écrire à l'équipe donateurs →|/contact"],
      ], { pad: "lg", rule: "thin", min: "170px" }),
      T(["logo:36"], ["socials:facebook+instagram+youtube+linkedin+x|big"], ["newsletter|Recevoir des nouvelles du terrain|Une lettre par mois, avec des histoires et des chiffres vrais."], { pad: "md", rule: "none" }),
      L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
    ] },
    responsive: { mobile: { gap: "20px" } },
    widgets: ["heading", "text", "button", "link", "sitelogo", "social", "emailsubscribe", "bizcontact", "copyright", "bizlegal", "backtotop"],
  }, FAM),

  // 2 ─ Association de quartier chaleureuse : accueil centré, trois façons d'aider, permanence et lettre des voisins
  modele({
    id: ids(2, "association-quartier-chaleureuse"),
    name: "Association de quartier chaleureuse",
    family: FAM,
    description: "Accueil centré « Ici, on s'entraide entre voisins », trois façons d'aider en cartes (donner, venir donner un coup de main, adhérer), permanence avec horaires, lettre des voisins et réseaux.",
    tags: ["association", "quartier", "bénévolat", "adhésion", "chaleureux"],
    identity: quartier,
    structure: { rows: [
      Z([etiquette("Association loi 1901 — exemple"), titre("Ici, on s'entraide entre voisins.", 44, 36, 30, { lh: 1.06, largeur: "640px" }), phrase("Repas partagés, aide aux devoirs, vestiaire solidaire : chacun peut donner un peu de temps, un peu d'argent, ou simplement passer dire bonjour.", { taille: 16, fg: true, largeur: "560px" }), cote(["cta|Soutenir l'association|" + E + "/don", "cta2|Devenir bénévole|" + E + "/benevolat"])], { pad: "xl", rule: "none" }),
      colonnes12([
        [4, "H|Donner|3", "text|Un don, même petit, finance le repas du jeudi et les fournitures scolaires. Lien de don d'exemple.", "link|Voir comment donner →|" + E + "/don", note("Reçu fiscal d'exemple fourni pour tout don : texte à adapter.")],
        [4, "H|Donner un coup de main|3", "text|Deux heures par semaine suffisent : cuisine, accueil, bricolage ou accompagnement.", "link|Je propose mon aide →|" + E + "/benevolat", note("Aucune expérience nécessaire.")],
        [4, "H|Adhérer|3", "text|Rejoindre l'association, c'est voter à l'assemblée générale et recevoir le programme (cotisation d'exemple : 15 € par an).", "link|Adhérer en ligne →|/inscription"],
      ], { cards: true, pad: "lg", min: "240px", rule: "none" }),
      colonnes12([
        [4, "logo:44", "text|Maison des voisins, ouverte à toutes et tous.", "socials:facebook+instagram+whatsapp|big"],
        [4, "head|La permanence", "hours|-", "contact", "link|Nous écrire →|/contact"],
        [4, "newsletter|La lettre des voisins|Les rendez-vous du mois et les coups de pouce à donner, chaque début de mois."],
      ], { bg: "alt", pad: "lg", min: "230px", rule: "none" }),
      Z(["menuh", "copy:c", "legallinks"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "24px" } },
    widgets: ["heading", "text", "button", "link", "sitelogo", "social", "bizhours", "bizcontact", "emailsubscribe", "menu", "copyright", "bizlegal"],
  }, FAM),

  // 3 ─ Fondation sobre et institutionnelle : mission à gauche, trois colonnes de liens, bande transparence en documents, filet double
  modele({
    id: ids(3, "fondation-sobre-institutionnelle"),
    name: "Fondation sobre et institutionnelle",
    family: FAM,
    description: "Mission en phrase posée, colonnes de liens (fondation, projets, soutenir), bande « transparence » avec trois documents et agrément d'exemple, contact du secrétariat, mentions sous double filet.",
    tags: ["fondation", "institutionnel", "sobre", "transparence", "mécénat"],
    identity: mecenat,
    structure: { rows: [
      colonnes12([
        [4, "logo:44", phrase("La Fondation Aurore soutient depuis 1998 la recherche, l'éducation et les initiatives locales (organisation fictive).", { taille: 15 }), "cta2|Soutenir la fondation|" + E + "/don"],
        [2, "head|La fondation", "links|Notre histoire>" + E + "/histoire|Gouvernance>" + E + "/gouvernance|Équipe>" + E + "/equipe"],
        [3, "head|Nos programmes", "links|Appels à projets>" + E + "/appels|Projets soutenus>" + E + "/projets|Boursiers et lauréats>" + E + "/laureats"],
        [3, "head|Soutenir", "links|Mécénat d'entreprise>" + E + "/mecenat|Dons et legs>" + E + "/don|Reçus fiscaux (exemple)>" + E + "/recus|Fonds dédiés>" + E + "/fonds"],
      ], { pad: "xl", gap: "48px", min: "180px", rule: "none" }),
      colonnes12([
        [4, "H|Transparence financière|3", phrase("Nos comptes sont publics et audités chaque année par un commissaire aux comptes.", { taille: 14 }), note("Agrément et reconnaissance d'utilité publique : mentions d'exemple, à remplacer par vos références réelles.")],
        [8, documents([["Rapport annuel 2025", "Activité et comptes · 48 pages"], ["Comptes certifiés 2025", "Bilan et annexes · 22 pages"], ["Politique de conflits d'intérêts", "Gouvernance · 6 pages"]])],
      ], { bg: "alt", pad: "lg", gap: "48px", min: "260px", rule: "none" }),
      T(["head|Nous joindre", "contact"], ["newsletter|Lettre de la fondation|Quatre fois par an : appels à projets et lauréats."], ["socials:linkedin+youtube+x"], { pad: "lg", rule: "none" }),
      L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "double" }),
    ] },
    responsive: { mobile: { gap: "22px" } },
    widgets: ["sitelogo", "text", "button", "heading", "bizcontact", "emailsubscribe", "social", "link", "copyright", "bizlegal", "backtotop"],
  }, FAM),

  // 4 ─ Collectif militant : slogan géant, trois actions en gros blocs, barre de pétition, liste d'alerte
  modele({
    id: ids(4, "collectif-militant-ton-fort"),
    name: "Collectif militant au ton fort",
    family: FAM,
    description: "Slogan géant en majuscules sur fond noir, trois gros blocs d'action (signer, venir, donner), barre de progression d'une pétition (exemple), liste d'alerte et réseaux en grand.",
    tags: ["militant", "citoyen", "pétition", "contraste", "slogan"],
    identity: barricade,
    structure: { rows: [
      colonnes12([
        [8, titre("On lâche rien. Ensemble.", 76, 52, 38, { lh: 0.96, serre: "-0.03em", maj: true, niveau: "1" })],
        [4, phrase("Un collectif citoyen, sans parti ni patron. Financé par ses membres, porté par des centaines de bénévoles (texte d'exemple).", { taille: 16, fg: true })],
      ], { pad: "xl", gap: "40px", min: "280px", rule: "none" }),
      colonnes12([
        [12, actions([["01", "Signer la pétition", "/inscription", true], ["02", "Rejoindre la marche", "/contact", false], ["03", "Financer la lutte", E + "/don", false]])],
      ], { pad: "sm", rule: "none" }),
      colonnes12([
        [6, "H|37 412 signatures. Objectif : 50 000.|3", progression(75, "37 412 signatures (exemple)", "il en manque 12 588")],
        [6, "newsletter|Liste d'alerte|Un message court quand il faut agir, jamais plus d'un par semaine."],
      ], { pad: "lg", gap: "48px", min: "280px", rule: "none" }),
      T(["logo:36"], ["socials:instagram+tiktok+telegram+whatsapp|big"], ["cta2|Contacter le collectif|/contact"], { bg: "alt", pad: "md", rule: "thick" }),
      L(["copy", "text|Dons au collectif : lien d'exemple, pas de reçu fiscal."], ["legallinks", "top"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "20px" } },
    widgets: ["heading", "text", "link", "button", "emailsubscribe", "sitelogo", "social", "copyright", "bizlegal", "backtotop"],
  }, FAM),

  // 5 ─ Tiers-lieu : trois formules d'adhésion en tête, frise de quatre dates, volets pratiques
  modele({
    id: ids(5, "tiers-lieu-adhesion-agenda"),
    name: "Tiers-lieu : adhésion et agenda",
    family: FAM,
    description: "Trois formules d'adhésion (curieux, adhérent, soutien : tarifs d'exemple), frise de quatre rendez-vous du mois sur bande de couleur, puis volets pratiques : venir, atelier partagé, collectif et lettre.",
    tags: ["tiers-lieu", "collectif", "adhésion", "agenda", "atelier"],
    identity: atelier,
    structure: { rows: [
      colonnes12([
        [4, etiquette("Adhésion ouverte"), titre("Un lieu à vous, tenu par nous tous.", 36, 32, 28, { lh: 1.08, niveau: "2" }), phrase("L'atelier, la cuisine et le jardin se partagent. Choisissez votre manière d'en faire partie.", { taille: 15 })],
        [8, formules([["Curieux", "0 €", "Venir aux soirées ouvertes.", "/inscription", false], ["Adhérent", "20 €", "Atelier, cuisine et vote en assemblée (exemple).", "/inscription", true], ["Soutien", "60 €", "Adhérent, plus un coup de pouce au loyer.", E + "/don", false]])],
      ], { pad: "xl", gap: "48px", min: "280px", rule: "none" }),
      colonnes12([
        [3, date("07", "Déc.", "Repair café", "Atelier, salle 1")],
        [3, date("12", "Déc.", "Cantine à prix libre", "Cuisine commune")],
        [3, date("19", "Déc.", "Assemblée du collectif", "Grande salle")],
        [3, date("08", "Janv.", "Troc de graines", "Jardin partagé")],
      ], { bg: "accent", pad: "lg", min: "190px", rule: "none" }),
      A([
        [3, "Venir", "contact", "hours|Ouverture au public"],
        [3, "Le collectif", liens([`Qui fait quoi ?>${E}/collectif`, `Devenir bénévole>${E}/benevolat`, `Louer une salle>/contact`, `Rapport d'activité (exemple)>${E}/rapport`])],
        [3, "Pratique", "menu", "link|Contact et accès →|/contact"],
        [3, "Suivre le lieu", "socials:instagram+facebook+telegram|big", "newsletter|Le journal du lieu|Un mail par mois, pas plus."],
      ], { pad: "lg", rule: "thin", min: "190px" }),
      L(["logo:36", "copy"], ["legallinks", "top"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "22px" } },
    widgets: ["heading", "text", "link", "bizcontact", "bizhours", "menu", "social", "emailsubscribe", "sitelogo", "copyright", "bizlegal", "backtotop"],
  }, FAM),
];

module.exports = {
  key: "ong-associations",
  label: "ONG et associations",
  description: "Faire un don, adhérer, devenir bénévole, transparence financière, newsletter.",
  target: 5,
  built: true,
  models,
};
