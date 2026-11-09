// Famille « Communautés et réseaux sociaux » — 6 modèles : réseau social dense, forum à rubriques, club chaleureux, communauté de développeurs, rendez-vous d'événement, plateforme de groupes à grandes pastilles.
// Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md. Tout ce qui est chiffre, date, lieu, nom de groupe ou lien https://exemple.fr/… est un EXEMPLE à remplacer (marqué « exemple » quand c'est visible).
const { modele, identifiantModele, ambiance, C, L, T, A, colonnes12, reseaux, contrastOf } = require("../kit-conception");
const { item } = require("../moteur");

const FAM = "communautes";
const E = "https://exemple.fr";
const ids = (n, s) => identifiantModele(FAM, n, s);

// ── Aides LOCALES (le kit n'a pas ces éléments). Chacune renvoie (k, env, center) → nœud ; le moteur ajoute survol, focus et cibles de 44 px. ───────────────────────────────────────
// Liste de liens de longueur libre : "Libellé>adresse"
const liens = (list, taille = 14) => (k, env, center) => k.col(list.map((s) => { const [l, u] = s.split(">"); return k.LINK(l, u, { fontSize: `${taille}px`, fontWeight: "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap: "8px", alignItems: center ? "center" : "flex-start" });
// Boutons côte à côte (passent à la ligne sur mobile)
const cote = (codes) => (k, env, center) => k.row(codes.map((c) => item(k, c, env, center)), { gap: "12px", ...(center ? { justifyContent: "center" } : {}) });
const phrase = (texte, { taille = 15, largeur = "460px", fg = false } = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: fg ? k.S.fg : k.S.mute, fontSize: `${taille}px`, fontFamily: k.S.font, maxWidth: largeur, ...(center ? { textAlign: "center" } : {}) });
const titre = (texte, d, t, m, o = {}) => (k) => k.H(texte, o.niveau || "2", { fontSize: `${d}px`, lineHeight: o.lh || 1.1, letterSpacing: o.serre || "-0.02em", fontFamily: k.S.head, overflowWrap: "anywhere", ...(o.largeur ? { maxWidth: o.largeur } : {}) }, { fontSize: `${t}px` }, { fontSize: `${m}px` });
// Chiffre de communauté (exemple) : grand nombre + légende
const stat = (nombre, legende) => (k) => k.col([
  k.H(nombre, "3", { fontSize: "34px", lineHeight: 1, letterSpacing: "-0.02em", fontFamily: k.S.head }, { fontSize: "30px" }, { fontSize: "28px" }),
  k.T(`<p>${legende}</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font }),
], { gap: "6px" });
// Pastille de texte pleine (étiquette)
const etiquette = (texte) => (k) => k.T(`<p><strong>${texte}</strong></p>`, { fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: k.S.font, color: k.S.onAccent, backgroundColor: k.S.accent, borderRadius: "999px", paddingTop: "4px", paddingBottom: "4px", paddingLeft: "12px", paddingRight: "12px", alignSelf: "flex-start" });
// Rubrique de forum : carte avec titre, description, volume d'exemple et lien
const rubrique = (nom, texte, volume, url) => (k) => k.card([
  k.H(nom, "4", { fontSize: "18px", lineHeight: 1.2, fontFamily: k.S.head }),
  k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font }),
  k.T(`<p><strong>${volume}</strong> (exemple)</p>`, { fontSize: "13px", fontFamily: k.S.font, color: k.S.fg }),
  k.LINK("Ouvrir →", url, { fontSize: "13px", fontWeight: "700", fontFamily: k.S.font }),
], { flexBasis: "220px", flexGrow: 1, minWidth: "200px", gap: "8px", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px" });
const rubriques = (liste) => (k) => k.row(liste.map(([a, b, c, d]) => rubrique(a, b, c, d)(k)), { gap: "14px", alignItems: "stretch" });
// Règle de la charte : numéro en grand + titre + phrase
const regle = (num, nom, texte) => (k) => k.col([
  k.T(`<p><strong>${num}</strong></p>`, { fontSize: "34px", lineHeight: 1, fontFamily: k.S.head, color: k.S.fg }),
  k.H(nom, "4", { fontSize: "17px", lineHeight: 1.2, fontFamily: k.S.head }),
  k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font }),
], { gap: "8px" });
// Carte « prochaine rencontre » (exemple)
const prochaine = (jour, mois, nom, lieu, heure) => (k) => k.card([
  k.row([
    k.col([k.T(`<p><strong>${mois}</strong></p>`, { fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: k.S.font, color: k.S.fg, textAlign: "center" }), k.H(jour, "3", { fontSize: "36px", lineHeight: 1, fontFamily: k.S.head, textAlign: "center" })], { gap: "4px", minWidth: "64px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "10px", paddingRight: "10px", borderStyle: "solid", borderWidth: "1.5px", borderColor: k.S.fg, borderRadius: "12px", alignItems: "center" }),
    k.col([k.H(nom, "4", { fontSize: "19px", lineHeight: 1.2, fontFamily: k.S.head }), k.T(`<p>${heure} · ${lieu} (exemple)</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font })], { gap: "4px", flexBasis: "160px", flexGrow: 1 }),
  ], { gap: "16px", alignItems: "center", flexWrap: "nowrap" }),
  k.LINK("Je m'inscris à la rencontre →", "/inscription", { fontSize: "14px", fontWeight: "700", fontFamily: k.S.font }),
], { gap: "14px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px" });
// Étape d'une procédure pour contribuer : numéro, titre, ligne de commande d'exemple
const etape = (num, nom, ligne) => (k) => k.card([
  k.row([k.T(`<p><strong>${num}</strong></p>`, { fontSize: "13px", fontFamily: "font.ibm-plex-mono", color: k.S.onAccent, backgroundColor: k.S.accent, borderRadius: "6px", paddingTop: "2px", paddingBottom: "2px", paddingLeft: "9px", paddingRight: "9px" }), k.H(nom, "4", { fontSize: "17px", fontFamily: k.S.head })], { gap: "10px", flexWrap: "nowrap" }),
  k.T(`<p>$ ${ligne}</p>`, { fontSize: "13px", fontFamily: "font.ibm-plex-mono", color: k.S.fg, backgroundColor: k.S.bg, borderRadius: "6px", borderStyle: "solid", borderWidth: "1px", borderColor: k.S.line, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "12px", paddingRight: "12px", width: "100%", overflowWrap: "anywhere" }),
], { gap: "12px", width: "100%" });
// Ligne d'agenda : bloc de date, titre, lieu, lien d'inscription (exemples)
const rendezvous = (jour, mois, nom, lieu, url = "/inscription") => (k) => k.row([
  k.col([k.T(`<p><strong>${mois}</strong></p>`, { fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: k.S.font, color: k.S.onAccent, textAlign: "center" }), k.H(jour, "3", { fontSize: "30px", lineHeight: 1, fontFamily: k.S.head, color: k.S.onAccent, textAlign: "center" })], { gap: "2px", width: "68px", minWidth: "68px", paddingTop: "10px", paddingBottom: "10px", backgroundColor: k.S.accent, borderRadius: "10px", alignItems: "center" }),
  k.col([k.H(nom, "4", { fontSize: "19px", lineHeight: 1.2, fontFamily: k.S.head }), k.T(`<p>${lieu} (exemple)</p>`, { color: k.S.mute, fontSize: "13px", fontFamily: k.S.font })], { gap: "4px", flexBasis: "180px", flexGrow: 1 }),
  k.LINK("Réserver →", url, { fontSize: "14px", fontWeight: "700", fontFamily: k.S.font }),
], { gap: "16px", alignItems: "center", paddingTop: "14px", paddingBottom: "14px", borderStyle: "solid", borderTopWidth: "1px", borderBottomWidth: "0px", borderLeftWidth: "0px", borderRightWidth: "0px", borderColor: k.S.line, width: "100%" });
const agenda = (liste) => (k) => k.col(liste.map(([a, b, c, d]) => rendezvous(a, b, c, d)(k)), { gap: "0px", width: "100%" });
// Grande pastille de réseau (couleur propre, texte noir ou blanc selon le contraste) : nom en grand, identifiant d'exemple, lien
const tuile = (nom, ligne, url, fond) => (k) => {
  const fg = contrastOf("#ffffff", fond) >= contrastOf("#111111", fond) ? "#ffffff" : "#111111";
  return k.col([
    k.H(nom, "3", { fontSize: "26px", lineHeight: 1.05, letterSpacing: "-0.01em", fontFamily: k.S.head, color: fg }),
    k.T(`<p>${ligne}</p>`, { fontSize: "13px", fontFamily: k.S.font, color: fg }),
    k.LINK("Rejoindre ↗", url, { fontSize: "14px", fontWeight: "700", fontFamily: k.S.font, color: fg, textDecoration: "underline" }),
  ], { flexBasis: "190px", flexGrow: 1, minWidth: "150px", gap: "8px", backgroundColor: fond, borderRadius: "24px", paddingTop: "22px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px" });
};
const pastilles = (liste) => (k) => k.row(liste.map(([a, b, c, d]) => tuile(a, b, c, d)(k)), { gap: "14px", alignItems: "stretch" });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ─────────────────────────────────────────────────────────────────────────
const minuit = ambiance({ key: "co-minuit", label: "Minuit — nuit prune et corail", humeur: "dark", fond: "#100d1f", texte: "#f1eefc", accent: "#ff7a90", police: "font.inter", titres: "font.sora" });
const forum = ambiance({ key: "co-forum", label: "Forum — crème et vert profond", humeur: "edit", fond: "#f5f1e8", texte: "#1d2b24", accent: "#0e6b5c", police: "font.public-sans", titres: "font.roboto-slab" });
const club = ambiance({ key: "co-club", label: "Club — terre cuite et crème", humeur: "soft", fond: "#fff3e6", texte: "#3a1f12", accent: "#a8390a", police: "font.nunito", titres: "font.young-serif" });
const depot = ambiance({ key: "co-depot", label: "Dépôt — graphite et lilas", humeur: "dark", fond: "#0d1117", texte: "#e6edf3", accent: "#d2a8ff", police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono" });
const pelouse = ambiance({ key: "co-pelouse", label: "Pelouse — vert sapin et ambre", humeur: "dark", fond: "#0f3d2e", texte: "#f4f7ee", accent: "#ffc233", police: "font.figtree", titres: "font.bricolage-grotesque" });
const dragee = ambiance({ key: "co-dragee", label: "Dragée — ciel pâle et framboise", humeur: "soft", fond: "#eef5ff", texte: "#12233f", accent: "#be1b58", police: "font.outfit", titres: "font.baloo-2" });

const models = [
  // 1 ─ Réseau social dense : barre d'accès, cinq volets (accordéon mobile), bande de chiffres, ligne légale
  modele({
    id: ids(1, "reseau-social-dense"),
    name: "Réseau social dense en cinq volets",
    family: FAM,
    description: "Barre de connexion et d'inscription, cinq volets de liens (découvrir, créateurs, aide, applications, réseaux) qui deviennent un accordéon sur mobile, bande de chiffres de la communauté (exemples) et mentions légales.",
    tags: ["réseau social", "dense", "accordéon", "applications", "nuit"],
    identity: minuit,
    structure: { rows: [
      L(["logo:40", "menuh"], ["cta2|Se connecter|/connexion", "cta|Créer mon compte|/inscription"], { pad: "md", rule: "none" }),
      A([
        [3, "Découvrir", liens([`Fil d'actualité>/`, `Tendances>/blog`, `Groupes>${E}/groupes`, `Événements>${E}/evenements`, `Messagerie>${E}/messages`])],
        [2, "Créateurs", liens([`Programme créateurs>${E}/createurs`, `Boutique de soutien>${E}/soutien`, `Outils de diffusion>${E}/outils`, `Statistiques>${E}/stats`])],
        [2, "Aide et sécurité", liens([`Centre d'aide>/faq`, `Signaler un contenu>/contact`, `Modération>${E}/moderation`, `Confidentialité>/cookies`])],
        [2, "Applications", liens([`iPhone et iPad (exemple)>https://apps.apple.com/`, `Android (exemple)>https://play.google.com/`, `Version web>/`])],
        [3, "Suivez-nous", reseaux([{ network: "instagram", url: "https://www.instagram.com/" }, { network: "tiktok", url: "https://www.tiktok.com/" }, { network: "x", url: "https://x.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "facebook", url: "https://www.facebook.com/" }, { network: "threads", url: "https://www.threads.net/" }], { taille: 40, forme: "circle" })],
      ], { pad: "lg", rule: "thin", min: "150px" }),
      colonnes12([
        [3, stat("2,4 M", "membres actifs (exemple)")],
        [3, stat("180 000", "groupes ouverts (exemple)")],
        [3, stat("35 000", "rencontres par mois (exemple)")],
        [3, stat("24 h / 24", "équipe de modération (exemple)")],
      ], { bg: "alt", pad: "lg", min: "150px", rule: "none" }),
      L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "16px" } },
    widgets: ["sitelogo", "menu", "button", "link", "social", "heading", "text", "copyright", "bizlegal", "backtotop"],
  }, FAM),

  // 2 ─ Forum à rubriques : grille de rubriques + colonne de discussions, charte en trois règles
  modele({
    id: ids(2, "forum-rubriques-et-charte"),
    name: "Forum à rubriques et charte",
    family: FAM,
    description: "Six rubriques de discussion en cartes, colonne latérale (recherche, dernières discussions, poser une question), puis bande sombre avec la charte en trois règles et l'accès à la modération.",
    tags: ["forum", "rubriques", "charte", "modération", "recherche"],
    identity: forum,
    structure: { rows: [
      colonnes12([
        [8, "H|Les rubriques du forum|2", rubriques([
          ["Présentations", "Dites bonjour et racontez qui vous êtes.", "1 248 sujets", "/blog"],
          ["Questions et entraide", "Un problème ? Quelqu'un a la réponse.", "9 870 sujets", "/blog"],
          ["Projets de membres", "Montrez ce que vous avez fabriqué.", "2 305 sujets", "/blog"],
          ["Idées et suggestions", "Dites-nous ce qui devrait exister.", "764 sujets", "/blog"],
          ["Café et discussions libres", "Tout ce qui n'entre dans aucune case.", "5 412 sujets", "/blog"],
          ["Annonces officielles", "Les nouveautés, écrites par l'équipe.", "132 sujets", "/blog"],
        ])],
        [4, "head|Dernières discussions", "recent:3", "search", "cta|Poser une question|/inscription"],
      ], { pad: "lg", min: "260px", rule: "none" }),
      colonnes12([
        [3, "H|Charte de la communauté|3", phrase("Trois règles simples pour que chacun se sente bienvenu.", { taille: 14 }), "link|Lire la charte complète →|/faq", "link|Signaler un message →|/contact"],
        [3, regle("1", "On se respecte", "Pas d'insultes ni de harcèlement : on discute des idées, pas des personnes.")],
        [3, regle("2", "On aide d'abord", "Une question claire, une réponse patiente : chacun a été débutant.")],
        [3, regle("3", "On reste honnête", "Pas de publicité cachée, pas de faux avis, pas d'usurpation d'identité.")],
      ], { bg: "ink", pad: "lg", min: "210px", rule: "none" }),
      L(["logo:32", "copy"], ["legallinks"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "20px" } },
    widgets: ["heading", "text", "link", "querylist", "search", "button", "sitelogo", "copyright", "bizlegal"],
  }, FAM),

  // 3 ─ Club chaleureux : bande d'accueil avec prochaine rencontre, trois activités en cartes, gazette
  modele({
    id: ids(3, "club-accueil-et-gazette"),
    name: "Club chaleureux et sa gazette",
    family: FAM,
    description: "Grande bande d'accueil terre cuite : invitation à devenir membre et carte de la prochaine rencontre ; trois activités en cartes, puis coordonnées du club, horaires de permanence et lettre d'information.",
    tags: ["club", "chaleureux", "rencontres", "newsletter", "horaires"],
    identity: club,
    structure: { rows: [
      colonnes12([
        [7, etiquette("Nouveaux membres bienvenus"), titre("Il y a une place pour vous à notre table.", 44, 36, 30, { largeur: "560px", lh: 1.05 }), phrase("Jeux, balades, repas partagés : rejoignez le club et venez quand vous voulez. Les trois premières rencontres sont offertes.", { taille: 16, fg: true }), cote(["cta|Devenir membre|/inscription", "cta2|Je suis déjà membre|/connexion"])],
        [5, prochaine("14", "Déc.", "Soirée jeux de société", "Salle des fêtes", "20 h"), "link|Voir tout le calendrier →|/blog"],
      ], { bg: "accent", pad: "xl", min: "280px", rule: "none" }),
      colonnes12([
        [4, "H|Le jeudi : jeux|3", "text|Plateaux, cartes et fous rires, de 20 h à 23 h. Tous niveaux.", "link|Voir le programme →|/blog"],
        [4, "H|Le samedi : balade|3", "text|Une sortie à pied, du facile au sportif, suivie d'un goûter partagé.", "link|Choisir une sortie →|/blog"],
        [4, "H|Le dimanche : repas|3", "text|Chacun apporte un plat, le club prépare la table.", "link|Réserver ma place →|/inscription"],
      ], { cards: true, pad: "lg", min: "230px", rule: "none" }),
      colonnes12([
        [3, "logo:44", "socials:facebook+instagram+whatsapp|big"],
        [3, "head|Permanence du club", "text|La porte est ouverte avant et après chaque rencontre : venez dire bonjour.", "hours|-", "contact", "link|Nous écrire →|/contact"],
        [2, "head|Le club", "menu"],
        [4, "newsletter|La gazette du club|Une lettre par mois : le programme, les photos et les nouvelles des membres."],
      ], { pad: "lg", min: "190px", rule: "thin" }),
      L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "24px" } },
    widgets: ["heading", "text", "button", "link", "sitelogo", "social", "bizhours", "bizcontact", "menu", "emailsubscribe", "copyright", "bizlegal", "backtotop"],
  }, FAM),

  // 4 ─ Communauté de développeurs : trois étapes pour contribuer, volets avec salon de discussion
  modele({
    id: ids(4, "developpeurs-contribuer"),
    name: "Communauté de développeurs : contribuer",
    family: FAM,
    description: "Titre « Contribuer en trois commandes » avec trois étapes à lignes de commande (exemples), puis quatre volets accordéon : salon de discussion en grand, projet, communauté, ressources ; licence et mentions dessous.",
    tags: ["développeurs", "open source", "contribuer", "salon", "sombre"],
    identity: depot,
    structure: { rows: [
      L([titre("Contribuer en trois commandes.", 32, 28, 24, { niveau: "2", lh: 1.15, serre: "-0.01em" })], ["cta2|Guide de contribution|/faq"], { bg: "alt", pad: "lg", rule: "none" }),
      colonnes12([
        [4, etape("1", "Cloner le dépôt", "git clone exemple.fr/projet")],
        [4, etape("2", "Lancer les tests", "npm install ; npm test")],
        [4, etape("3", "Proposer un changement", "git push origin ma-branche")],
      ], { bg: "alt", pad: "sm", min: "240px", rule: "none" }),
      A([
        [4, "Rejoindre le salon", phrase("1 240 personnes en ligne (exemple). Posez une question, aidez un débutant, présentez votre projet.", { taille: 14 }), "cta|Ouvrir le salon (exemple)|https://discord.com/", reseaux([{ network: "reddit", url: "https://www.reddit.com/" }, { network: "telegram", url: "https://t.me/" }, { network: "x", url: "https://x.com/" }, { network: "youtube", url: "https://www.youtube.com/" }], { taille: 32, forme: "square" })],
        [2, "Projet", liens([`Code source>https://github.com/`, `Nouveautés>${E}/changelog`, `Feuille de route>${E}/feuille-de-route`, `Signaler un bogue>${E}/bogues`])],
        [3, "Communauté", liens([`Charte de conduite>/faq`, `Rencontres locales>${E}/rencontres`, `Parrainage des débutants>${E}/parrainage`, `Contributeurs>${E}/contributeurs`])],
        [3, "Ressources", liens([`Documentation>${E}/docs`, `Tutoriels>/blog`, `Lettre hebdomadaire>${E}/lettre`, `Soutenir le projet>${E}/soutien`])],
      ], { pad: "lg", rule: "none", min: "170px" }),
      L(["logo:30", "text|Code publié sous licence libre (exemple)."], ["copy"], { pad: "sm", rule: "thin" }),
      L(["legallinks"], ["top"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "18px" } },
    widgets: ["heading", "button", "text", "social", "link", "sitelogo", "copyright", "bizlegal", "backtotop"],
  }, FAM),

  // 5 ─ Rendez-vous d'événement : agenda à gauche, billetterie à droite, barre de navigation en bande ambrée
  modele({
    id: ids(5, "evenement-agenda-billets"),
    name: "Événement : agenda et billetterie",
    family: FAM,
    description: "Agenda de quatre rendez-vous avec bloc de date ambre et lien de réservation (exemples), colonne billetterie avec lieu, boutons et réseaux, puis barre de navigation sur bande de couleur.",
    tags: ["événement", "agenda", "billetterie", "rencontre", "vert"],
    identity: pelouse,
    structure: { rows: [
      colonnes12([
        [7, "H|Prochains rendez-vous|2", agenda([
          ["14", "Déc.", "Grande rencontre d'hiver", "Halle des sports, Lyon"],
          ["18", "Janv.", "Atelier : lancer sa communauté", "En ligne, 18 h"],
          ["02", "Fév.", "Soirée des nouveaux membres", "Café associatif, Nantes"],
          ["21", "Mars", "Festival de printemps", "Parc des expositions, Lille"],
        ])],
        [5, etiquette("Billets ouverts"), titre("Cette année, on se retrouve vraiment.", 34, 30, 26, { niveau: "3", lh: 1.1 }), phrase("Une journée entière pour se rencontrer, apprendre et rire ensemble. Places limitées.", { taille: 15, fg: true }), cote(["cta|Réserver ma place|/inscription", "cta2|Voir le programme|/blog"]), "contact", "socials:instagram+youtube+whatsapp+telegram|big"],
      ], { pad: "xl", gap: "56px", min: "280px", rule: "none" }),
      T(["logo:36"], ["menuh"], ["top"], { bg: "accent", pad: "sm", rule: "none" }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "none" }),
    ] },
    responsive: { mobile: { gap: "26px" } },
    widgets: ["heading", "text", "button", "bizcontact", "social", "sitelogo", "menu", "backtotop", "copyright", "bizlegal", "link"],
  }, FAM),

  // 6 ─ Plateforme de groupes : six grandes pastilles de réseaux, barre de navigation sombre, lettre d'information
  modele({
    id: ids(6, "groupes-grandes-pastilles"),
    name: "Plateforme de groupes à grandes pastilles",
    family: FAM,
    description: "Titre « Trouvez votre groupe » et boutons d'applications, face à six grandes pastilles colorées de réseaux (exemples) ; barre sombre avec création de groupe, lettre d'information et colonnes d'aide.",
    tags: ["groupes", "pastilles", "réseaux", "applications", "coloré"],
    identity: dragee,
    structure: { rows: [
      colonnes12([
        [4, titre("Trouvez votre groupe, partout.", 40, 34, 30, { lh: 1.05 }), phrase("Retrouvez les membres là où ils discutent déjà, ou créez votre propre groupe en deux minutes.", { taille: 15 }), cote(["cta2|App iPhone (exemple)|https://apps.apple.com/", "cta2|App Android (exemple)|https://play.google.com/"])],
        [8, pastilles([
          ["Instagram", "@communaute.exemple · 48 000 abonnés (exemple)", "https://www.instagram.com/", "#be1b58"],
          ["TikTok", "@communaute.exemple · 120 000 (exemple)", "https://www.tiktok.com/", "#12233f"],
          ["YouTube", "Chaîne de la communauté (exemple)", "https://www.youtube.com/", "#b3261e"],
          ["WhatsApp", "Groupe d'entraide (exemple)", "https://wa.me/", "#0f766e"],
          ["Reddit", "r/communaute (exemple)", "https://www.reddit.com/", "#ffd23f"],
          ["Telegram", "Annonces en direct (exemple)", "https://t.me/", "#7c3aed"],
        ])],
      ], { pad: "xl", gap: "40px", min: "260px", rule: "none" }),
      T(["logo:40"], ["menuh"], ["cta|Créer un groupe|/inscription"], { bg: "ink", pad: "md", rule: "none" }),
      colonnes12([
        [6, "newsletter|Les groupes à suivre cette semaine|Une sélection de groupes et d'événements, chaque vendredi."],
        [3, "head|Groupes", liens([`Créer un groupe>/inscription`, `Parcourir les groupes>${E}/groupes`, `Règles des groupes>/faq`])],
        [3, "head|Aide", liens([`Centre d'aide>/faq`, `Contacter la modération>/contact`, `Se connecter>/connexion`])],
      ], { pad: "lg", min: "200px", rule: "none" }),
      L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
    ] },
    responsive: { mobile: { gap: "24px" } },
    widgets: ["heading", "text", "button", "sitelogo", "menu", "emailsubscribe", "link", "copyright", "bizlegal", "backtotop"],
  }, FAM),
];

module.exports = {
  key: "communautes",
  label: "Communautés et réseaux sociaux",
  description: "Communautés : réseaux en grand, espace membres, événements, charte, applications, newsletter.",
  target: 6,
  built: true,
  models,
};
