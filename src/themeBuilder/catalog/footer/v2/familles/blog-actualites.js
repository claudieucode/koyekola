// Famille v2 « Blogs et actualités » — 5 modèles (ft2-176 à ft2-180), extension « carrée » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds de presse et de blog : colonnes de rubriques, derniers articles (widget « Liste dynamique » : articles récents), lettre d'information, mentions légales. Marques fictives, AUCUNE coordonnée ni chiffre inventé
// (les adresses de réseaux sont des EXEMPLES à remplacer dans l'éditeur ; les rubriques sont des intitulés d'exemple qui pointent vers le blog et se renomment dans l'éditeur).
// Chaque modèle a sa palette, ses polices (2 familles au plus) et sa composition (indépendance du site, mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions longues et douces (360 ms) de couleur, de fond, de contour et de décalage (2 à 6 px) sur tous les liens, boutons et cartes ;
//   · UNE animation visible par modèle : carré d'actualité qui « respire » (pulse lent), carte qui se soulève, flèche qui glisse, ligne d'index dont la barre latérale s'allume ;
//   · pas d'animation d'entrée, pas de widget « Défilement continu » (limites du moteur : voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const FAM = "blog-actualites";
const DOUX = 360; // ms : durée des transitions de survol / focus

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile, tablette: o.tablette });
// Derniers articles du blog : widget « Liste dynamique » (articles récents, sans image : le message « rien à afficher » du widget « Derniers articles » a un arrondi de 10 px imposé, donc écarté).
// Titres et dates habillés ; espacement vertical de 12 px autour des titres sur mobile (cibles tactiles)
function billets(k, o = {}) {
  const S = k.S, n = k.W("querylist", { title: "", source: "posts", mode: "recent", count: o.n || 3, layout: "compact", showImage: false, showDate: o.date !== false, empty: o.vide || "Les prochains articles arrivent bientôt." }, { color: o.couleur || S.fg, fontFamily: o.police || S.font, fontSize: "16px", width: "100%" });
  n.parts = {
    link: { styles: { desktop: { color: o.couleur || S.fg, fontFamily: o.policeTitre || S.font, fontSize: `${o.taille || 17}px`, fontWeight: o.poids || "700", textDecoration: "none", transitionDuration: DOUX }, mobile: { paddingTop: "12px", paddingBottom: "12px" } }, states: { hover: { color: o.survol || S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) } },
    date: { styles: { desktop: { color: o.couleurDate || S.mute, fontFamily: o.police || S.font, fontSize: "13px", opacity: 1 } } },
    meta: { styles: { desktop: { color: o.couleurDate || S.mute, fontFamily: o.police || S.font, fontSize: "13px", opacity: 1 } } },
  };
  return n;
}
// Abonnement carré : champ souligné, bouton aux angles droits
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg }; // message « non configuré » lisible sur le fond de SA bande
  return n;
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-176 « Une de journal » — magazine d'actualités
// Idée : la TÊTE D'UN QUOTIDIEN. Papier blanc cassé, triple filet de presse (épais, vide, fin), le nom du site en grandes capitales Playfair centré, une ligne de rubriques entre deux filets (chaque rubrique se
// remplit d'encre au survol), puis quatre colonnes séparées par des filets verticaux : derniers articles (avec un carré rouge qui « respire »), rubriques, rédaction, lettre du matin. Rouge presse #b3122a en touche.
// Polices : Playfair Display (nom, titres) et Source Sans 3 (texte). Mobile : colonnes empilées, filets verticaux retirés.
const papierEncre = identite({
  key: "c176", label: "Papier, encre et rouge presse", humeur: "light",
  fond: "#f7f4ec", texte: "#131313", discret: "#55524a", accent: "#b3122a", surface: "#ffffff", encre: "#131313",
  police: "font.source-sans-3", titres: "font.playfair-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#13131333",
});
const PAPIER = "#f7f4ec", ENCRE = "#131313", ROUGE = "#b3122a";

const uneDeJournal = modeleV2({
  id: identifiantV2(176, "une-de-journal"), concept: "c-176-une-de-journal",
  name: "Une de journal", family: FAM,
  description: "Pour un magazine d'actualités : triple filet de presse, nom du site en grandes capitales, ligne de rubriques qui s'encrent au survol, puis derniers articles, rubriques, rédaction et lettre du matin en colonnes séparées par des filets.",
  tags: ["magazine", "actualités", "presse", "rubriques", "derniers articles", "papier", "rouge"],
  identity: papierEncre,
  racine: racineDe(PAPIER),
  widgets: ["sitetitle", "text", "link", "querylist", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · tête : triple filet de presse, accroche, nom du site monumental, rubriques entre deux filets
    const filets = k.col([trait(k, ENCRE, "5px"), k.col([], { height: "4px" }), trait(k, ENCRE, "1px")], { gap: "0px", width: "100%" });
    const accroche = caps(k, "L'actualité, expliquée simplement", { couleur: ROUGE, suivi: "0.24em", extra: { textAlign: "center" } });
    const nom = Moteur.item(k, "title:34", env);
    nom.styles.desktop = { ...nom.styles.desktop, color: ENCRE, fontFamily: S.head, fontWeight: "900", fontSize: "fluid:44-104", lineHeight: 1.0, letterSpacing: "-0.02em", textAlign: "center", textTransform: "uppercase", justifyContent: "center" };
    nom.parts = { ...(nom.parts || {}), link: { ...((nom.parts || {}).link || {}), styles: { desktop: { color: ENCRE, textDecoration: "none" }, mobile: { display: "inline-block", minHeight: "44px", paddingTop: "10px", paddingBottom: "10px" } } } };
    const rub = (t) => lien(k, t, "/blog", { taille: 13, poids: "700", casse: "uppercase", suivi: "0.16em", couleur: ENCRE, h: "48px", padH: "18px", survol: { backgroundColor: ENCRE, color: PAPIER }, focus: ROUGE, extra: { justifyContent: "center" } });
    const rubriques = G.ligne(k, ["À la une", "Politique", "Économie", "Société", "Culture", "Sports", "Opinions"].map(rub), { gap: "0px", justifie: "center", aligne: "stretch", largeur: "100%" });
    const bandeRub = k.col([trait(k, ENCRE, "1px"), rubriques, trait(k, ENCRE, "1px")], { gap: "0px", width: "100%" });
    const tete = G.bande(k, [filets, accroche, nom, bandeRub], { fond: PAPIER, colonne: true, gap: "20px", padV: ["40px", "32px", "24px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "18px" }, nom: "Tête de journal" });
    // 2 · quatre colonnes à filets verticaux
    const sep = { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "28px" }, sepOff = { borderLeftWidth: "0px", paddingLeft: "0px" };
    const titreBillets = k.row([souffle(carre(k, ROUGE, "11px"), 2800), caps(k, "Dernières publications", { couleur: ROUGE })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const colBillets = G.colonne(k, [titreBillets, billets(k, { n: 3, couleur: ENCRE, policeTitre: S.head, taille: 18, survol: ROUGE, focus: ROUGE })], { poids: 1.5, min: "260px", gap: "14px" });
    const rubs = ["À la une", "Enquêtes", "Analyses", "Chroniques", "Agenda"].map((t) => lien(k, t, "/blog", { taille: 16, poids: "600", couleur: ENCRE, survol: { color: ROUGE, transform: { x: 4 } }, focus: ROUGE }));
    const colRubs = bloc(k, "Rubriques", rubs, { couleurTitre: ROUGE, gap: "0px", min: "180px", extra: sep, mobile: sepOff, tablette: sepOff });
    const redaction = [coordonnees(k, { taille: 15, lien: ENCRE, survol: ROUGE, focus: ROUGE }), lien(k, "Proposer un sujet →", "/contact", { taille: 15, poids: "700", couleur: ROUGE, soulign: true, survol: { color: ENCRE, transform: { x: 4 } }, focus: ROUGE })];
    const colRed = bloc(k, "La rédaction", redaction, { couleurTitre: ROUGE, min: "220px", extra: sep, mobile: sepOff, tablette: sepOff });
    const abo = abonnement(k, env, { titre: "La lettre du matin", intro: "L'essentiel de l'actualité, dans votre boîte aux lettres.", bouton: "Je m'abonne", largeur: "340px", accent: ROUGE, texte: ENCRE });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: ROUGE, lineHeight: 1.4 };
    abo.parts.button.states = { hover: { backgroundColor: ENCRE, color: "#ffffff" }, focus: GK.focus(ENCRE) };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#ffffff" };
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px", extra: sep, mobile: sepOff, tablette: sepOff });
    const colonnes = G.ligne(k, [colBillets, colRubs, colRed, colLettre], { gap: "36px 28px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const corps = G.bande(k, [colonnes, trait(k, ENCRE, "1px"), mentions], { fond: PAPIER, colonne: true, gap: "36px", padV: ["16px", "16px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Colonnes" });
    return [G.racine(k, [tete, corps])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-177 « Cahier d'idées » — blog d'entreprise
// Idée : le pied d'un BLOG DE MARQUE, tout en aplats. Grande bande bleu cobalt : « Ce qu'on apprend, on le partage. » en Inter Tight 800 et, à côté, une carte blanche à angles droits pour la lettre d'information
// (elle se soulève au survol). Puis une bande blanche : derniers articles à gauche, thèmes en étiquettes carrées à droite (elles se remplissent de bleu au survol). Bande marine pour les mentions.
// Polices : Inter Tight (titres) et Inter (texte). Mobile : phrase, carte, articles, étiquettes en pile.
const cobalt = identite({
  key: "c177", label: "Bleu cobalt, jaune citron et marine", humeur: "dark",
  fond: "#1736c9", texte: "#ffffff", discret: "#d3dbff", accent: "#ffd84d", surface: "#2a49d9", encre: "#0b1b5e", surEncre: "#ffffff",
  police: "font.inter", titres: "font.inter-tight",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff40",
});
const COBALT = "#1736c9", MARINE = "#0b1b5e", CITRON = "#ffd84d";

const cahierIdees = modeleV2({
  id: identifiantV2(177, "cahier-d-idees"), concept: "c-177-cahier-d-idees",
  name: "Cahier d'idées", family: FAM,
  description: "Pour un blog d'entreprise : grande bande cobalt avec phrase d'invitation et carte de lettre d'information qui se soulève, puis derniers articles, thèmes en étiquettes carrées et bande marine pour les mentions.",
  tags: ["blog d'entreprise", "blog de marque", "lettre d'information", "thèmes", "bleu", "jaune", "aplats"],
  identity: cobalt,
  racine: racineDe(MARINE),
  widgets: ["text", "link", "querylist", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bande cobalt : phrase + carte de lettre
    const sur = caps(k, "Le blog", { couleur: CITRON, suivi: "0.22em" });
    const phrase = G.geant(`<p>Ce qu'on apprend,<br><span style="color:${CITRON}">on le partage.</span></p>`, { taille: [44, 104], tablette: { taille: [64, 88] }, mobile: { taille: [40, 56] }, lh: 1.02, suivi: "-0.03em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const gauche = G.colonne(k, [sur, phrase], { poids: 7, min: "300px", gap: "20px" });
    const abo = abonnement(k, env, { titre: "La lettre du blog", intro: "Un message à chaque nouvel article : pas de bruit, que du contenu utile.", bouton: "S'abonner", largeur: "100%", accent: COBALT, texte: MARINE });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: COBALT, lineHeight: 1.4 };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: MARINE };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#ffffff" };
    abo.parts.button.states = { hover: { backgroundColor: MARINE, color: "#ffffff" }, focus: GK.focus(MARINE) };
    const carte = G.carte([abo], { fond: "#ffffff", rayon: "0px", remplissage: "28px", ombre: "none" })(k);
    carte.styles.desktop = { ...carte.styles.desktop, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: CITRON, borderRadius: "0px", maxWidth: "440px", width: "100%", transitionDuration: DOUX };
    carte.states = { hover: { transform: { y: -6 } } };
    const droite = G.colonne(k, [carte], { poids: 5, min: "290px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: COBALT, gap: "40px 64px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["96px", "72px", "52px"], padH: ["48px", "32px", "20px"], nom: "Invitation" });
    // 2 · bande blanche : articles à gauche, thèmes à droite
    const titreArt = caps(k, "Derniers articles", { couleur: COBALT });
    const colArt = G.colonne(k, [titreArt, billets(k, { n: 3, couleur: MARINE, couleurDate: "#4a557f", policeTitre: S.head, taille: 20, poids: "800", survol: COBALT, focus: COBALT }), lien(k, "Tous les articles →", "/blog", { taille: 15, poids: "800", couleur: COBALT, soulign: true, survol: { color: MARINE, transform: { x: 6 } }, focus: COBALT })], { poids: 6, min: "300px", gap: "16px" });
    const tag = (t) => lien(k, t, "/blog", { taille: 15, poids: "700", couleur: MARINE, h: "48px", padH: "20px", survol: { backgroundColor: COBALT, color: "#ffffff", transform: { y: -3 } }, focus: COBALT, extra: { borderStyle: "solid", borderWidth: "2px", borderColor: MARINE, justifyContent: "center", backgroundColor: "#ffffff" } });
    const tags = G.ligne(k, ["Conseils", "Coulisses", "Études de cas", "Nouveautés", "Guides", "Équipe"].map(tag), { gap: "12px", aligne: "stretch", largeur: "100%" });
    const colTags = G.colonne(k, [caps(k, "Parcourir par thème", { couleur: COBALT }), tags, k.T("<p>Ces thèmes sont des exemples : renommez-les dans l'éditeur selon vos catégories.</p>", { fontSize: "14px", lineHeight: 1.55, color: "#4a557f", fontFamily: S.font, maxWidth: "420px" })], { poids: 5, min: "290px", gap: "16px" });
    const milieu = G.bande(k, [colArt, colTags], { fond: "#ffffff", gap: "40px 72px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Articles et thèmes" });
    // 3 · bande marine : mentions
    const reseaux = G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"], ["Flux RSS", "/blog"]], { taille: 15, poids: "700", couleur: "#ffffff", survol: CITRON, focus: CITRON })(k, env);
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d3dbff", liens: "#ffffff", sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, trait(k, "#ffffff40"), mentions], { fond: MARINE, colonne: true, gap: "20px", padV: ["32px", "28px", "24px"], padB: ["24px", "20px", "18px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "16px" }, nom: "Mentions" });
    return [G.racine(k, [haut, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-178 « Gazette du coin » — journal local
// Idée : la page de service d'un JOURNAL DE QUARTIER. Papier kraft, grand titre en Libre Caslon « Ici, on parle de chez nous. », puis un bloc encadré d'un filet épais : à gauche un panneau vert bouteille (la rédaction :
// coordonnées, bouton « Écrire à la rédaction »), à droite une grille de six rubriques numérotées dont chaque case se remplit de vert au survol. En bas : à lire cette semaine, lettre, mentions.
// Rubriques d'exemple, à renommer. Polices : Libre Caslon Text (titres) et Libre Franklin (texte). Mobile : panneau puis cases en une colonne.
const kraft = identite({
  key: "c178", label: "Kraft, encre brune et vert bouteille", humeur: "light",
  fond: "#ece3cf", texte: "#2a2118", discret: "#5b4f3e", accent: "#1f5d3d", surface: "#f6efdf", encre: "#2a2118",
  police: "font.libre-franklin", titres: "font.libre-caslon-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#2a211840",
});
const KRAFT = "#ece3cf", BRUN = "#2a2118", BOUTEILLE = "#1f5d3d", CREME = "#f6efdf";

const gazetteDuCoin = modeleV2({
  id: identifiantV2(178, "gazette-du-coin"), concept: "c-178-gazette-du-coin",
  name: "Gazette du coin", family: FAM,
  description: "Pour un journal local : papier kraft, grand titre en serif, bloc encadré avec panneau vert de la rédaction et grille de six rubriques numérotées qui se remplissent au survol, puis articles de la semaine et lettre.",
  tags: ["journal local", "presse locale", "quartier", "rubriques", "rédaction", "kraft", "vert"],
  identity: kraft,
  racine: racineDe(KRAFT),
  widgets: ["text", "link", "querylist", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · titre
    const sur = caps(k, "Journal d'information locale", { couleur: BOUTEILLE, suivi: "0.22em" });
    const phrase = G.geant(`<p>Ici, on parle<br>de chez nous.</p>`, { taille: [44, 100], tablette: { taille: [64, 88] }, mobile: { taille: [40, 54] }, lh: 1.04, suivi: "-0.015em", poids: "700", police: S.head, couleur: BRUN })(k, env);
    const intro = k.T("<p>Commerces, associations, travaux, rendez-vous : l'actualité de la commune racontée par ceux qui y vivent.</p>", { fontSize: "17px", lineHeight: 1.6, color: BRUN, fontFamily: S.font, maxWidth: "400px" });
    const tete = G.bande(k, [G.colonne(k, [sur, phrase], { poids: 8, min: "300px", gap: "18px" }), G.colonne(k, [intro], { poids: 4, min: "280px", soi: "flex-end" })], { fond: KRAFT, gap: "32px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["44px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    // 2 · bloc encadré : panneau vert (rédaction) + grille de rubriques
    const lienV = lien(k, "Écrire à la rédaction", "/contact", { taille: 15, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: BOUTEILLE, h: "52px", padH: "24px", survol: { backgroundColor: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: CREME, justifyContent: "center", alignSelf: "flex-start" } });
    const panneau = G.colonne(k, [caps(k, "La rédaction", { couleur: "#cfe6d8", suivi: "0.2em" }), k.T("<p>Une info, une photo, un événement ? Dites-le-nous.</p>", { fontSize: "20px", lineHeight: 1.35, color: "#ffffff", fontFamily: S.head }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: "#cfe6d8", focus: "#ffffff" }), lienV], { poids: 4, min: "280px", gap: "18px", extra: { backgroundColor: BOUTEILLE, paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" }, mobile: { paddingTop: "24px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px" } });
    const case_ = (num, nom, sous) => {
      const t = lien(k, nom, "/blog", { taille: 22, poids: "700", police: S.head, couleur: BRUN, survol: { color: "#ffffff" }, focus: "#ffffff", h: "44px", extra: { width: "100%" } });
      const c = k.col([caps(k, num, { couleur: BOUTEILLE, suivi: "0.2em" }), t, k.T(`<p>${sous}</p>`, { fontSize: "14px", lineHeight: 1.45, color: S.mute, fontFamily: S.font })], { flexGrow: 1, minWidth: "170px", minHeight: "150px", flexBasis: "30%", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "22px", gap: "6px", borderStyle: "solid", borderWidth: "1px", borderColor: BRUN, backgroundColor: CREME, transitionDuration: DOUX, borderRadius: "0px" });
      c.states = { hover: { backgroundColor: BOUTEILLE, transform: { y: -4 } } };
      return c;
    };
    const grille = G.ligne(k, [case_("01", "Vie locale", "Mairie, écoles, voisinage."), case_("02", "Commerces", "Ouvertures et bonnes adresses."), case_("03", "Sports", "Clubs, matchs et résultats."), case_("04", "Sorties", "Concerts, fêtes, marchés."), case_("05", "Travaux", "Routes, chantiers, circulation."), case_("06", "Mémoire", "Histoires et photos d'hier.")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    grille.styles.desktop = { ...grille.styles.desktop, flexGrow: 1, alignContent: "stretch" };
    const cadre = k.row([panneau, G.colonne(k, [grille], { poids: 8, min: "300px", gap: "0px" })], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", borderStyle: "solid", borderWidth: "3px", borderColor: BRUN, backgroundColor: CREME });
    const bandeCadre = G.bande(k, [cadre], { fond: KRAFT, colonne: true, padV: ["16px", "16px", "8px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Rubriques" });
    // 3 · à lire cette semaine, lettre, mentions
    const colLire = G.colonne(k, [caps(k, "À lire cette semaine", { couleur: BOUTEILLE }), billets(k, { n: 3, couleur: BRUN, policeTitre: S.head, taille: 19, survol: BOUTEILLE, focus: BOUTEILLE })], { poids: 1.5, min: "280px", gap: "14px" });
    const abo = abonnement(k, env, { titre: "Le courrier du coin", intro: "Les nouvelles de la commune, chaque semaine ou presque, dans votre boîte aux lettres.", bouton: "Je m'abonne", largeur: "380px", accent: BOUTEILLE, texte: BRUN });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: BOUTEILLE, lineHeight: 1.4 };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#ffffff" };
    abo.parts.button.states = { hover: { backgroundColor: BRUN, color: "#ffffff" }, focus: GK.focus(BRUN) };
    const colLettre = G.colonne(k, [abo], { poids: 1.2, min: "270px" });
    const ligne = G.ligne(k, [colLire, colLettre], { gap: "36px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [ligne, trait(k, BRUN, "2px"), mentions], { fond: KRAFT, colonne: true, gap: "36px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Fin de page" });
    return [G.racine(k, [tete, bandeCadre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-179 « Rayon des guides » — site de ressources
// Idée : une BASE DOCUMENTAIRE sombre. Vert-noir profond, menthe vive. D'abord un grand champ de recherche (widget Recherche, angles droits), puis un index à lignes pleines : chaque ligne (numéro mono, catégorie, flèche)
// allume une barre menthe sur son bord gauche et s'éclaire au survol ; à droite, les derniers guides et la lettre. Polices : IBM Plex Sans (texte) et IBM Plex Mono (titres, numéros, libellés).
// Catégories d'exemple, à renommer. Mobile : recherche pleine largeur, index puis guides en pile.
const fondsDoc = identite({
  key: "c179", label: "Vert-noir et menthe", humeur: "dark",
  fond: "#0a1b19", texte: "#e8f3ef", discret: "#a9c2ba", accent: "#4ee3b0", surface: "#10302c", encre: "#0a1b19", surEncre: "#e8f3ef",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e8f3ef33",
});
const NUIT = "#0a1b19", NUIT2 = "#10302c", MENTHE = "#4ee3b0", BRUME = "#e8f3ef";

const rayonGuides = modeleV2({
  id: identifiantV2(179, "rayon-des-guides"), concept: "c-179-rayon-des-guides",
  name: "Rayon des guides", family: FAM,
  description: "Pour un site de ressources : grand champ de recherche, index à lignes pleines dont la barre latérale menthe s'allume au survol, derniers guides et lettre d'information. Vert-noir profond, typographie mono, très documentaire.",
  tags: ["ressources", "guides", "documentation", "recherche", "index", "sombre", "menthe"],
  identity: fondsDoc,
  racine: racineDe(NUIT),
  widgets: ["text", "link", "search", "querylist", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · recherche
    const sur = caps(k, "Centre de ressources", { couleur: MENTHE, police: S.head, suivi: "0.2em" });
    const titre = G.geant(`<p>Trouvez le bon guide.</p>`, { taille: [36, 76], tablette: { taille: [48, 64] }, mobile: { taille: [34, 44] }, lh: 1.05, suivi: "-0.02em", poids: "600", police: S.head, couleur: BRUME })(k, env);
    const rech = k.W("search", { target: "site", placeholder: "Rechercher un guide, un sujet…", button: "Rechercher" }, { width: "100%", maxWidth: "620px", fontFamily: S.font });
    rech.parts = {
      field: { styles: { desktop: { fontFamily: S.font, fontSize: "18px", color: BRUME, backgroundColor: NUIT2, borderStyle: "solid", borderWidth: "2px", borderColor: MENTHE, borderRadius: "0px", minHeight: "56px", paddingLeft: "18px", paddingRight: "18px", transitionDuration: DOUX }, mobile: { minHeight: "56px" } }, states: { focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: BRUME, outlineOffset: "3px" } } },
      button: { styles: { desktop: { fontFamily: S.head, fontSize: "15px", fontWeight: "600", color: NUIT, backgroundColor: MENTHE, borderStyle: "solid", borderWidth: "0px", borderRadius: "0px", minHeight: "56px", paddingLeft: "24px", paddingRight: "24px", transitionDuration: DOUX }, mobile: { minHeight: "56px" } }, states: { hover: { backgroundColor: BRUME }, focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: BRUME, outlineOffset: "3px" } } },
    };
    const haut = G.bande(k, [G.colonne(k, [sur, titre], { poids: 6, min: "300px", gap: "16px" }), G.colonne(k, [rech], { poids: 6, min: "300px", soi: "flex-end" })], { fond: NUIT, gap: "36px 64px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Recherche" });
    // 2 · index à lignes pleines
    const ligneIndex = (num, nom) => {
      const n = k.LINK(`${num}  ${nom}  →`, "/blog", { fontFamily: S.head, fontSize: "18px", fontWeight: "500", color: BRUME, textDecoration: "none", display: "flex", alignItems: "center", minHeight: "56px", width: "100%", paddingLeft: "18px", paddingRight: "18px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderLeftWidth: "5px", borderColor: "#e8f3ef33", borderLeftColor: "#10302c", borderRadius: "0px", transitionDuration: DOUX, letterSpacing: "0.01em" });
      return GK.fini(k, n, { hover: { backgroundColor: NUIT2, borderLeftColor: MENTHE, color: MENTHE, transform: { x: 6 } }, focus: GK.focus(MENTHE) });
    };
    const index = k.col(["Guides pratiques", "Tutoriels pas à pas", "Fiches et modèles", "Études et rapports", "Glossaire", "Questions fréquentes"].map((t, i) => ligneIndex(`0${i + 1}`, t)), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#e8f3ef33" });
    const colIndex = G.colonne(k, [caps(k, "Index des ressources", { couleur: MENTHE, police: S.head }), index], { poids: 7, min: "300px", gap: "14px" });
    const abo = abonnement(k, env, { titre: "Nouveaux guides", intro: "Un message à chaque nouvelle ressource publiée.", bouton: "Me prévenir", largeur: "100%", accent: MENTHE, texte: BRUME });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: MENTHE, fontFamily: S.head, lineHeight: 1.4 };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: NUIT };
    abo.parts.button.states = { hover: { backgroundColor: BRUME, color: NUIT }, focus: GK.focus(BRUME) };
    const titreG = k.row([souffle(carre(k, MENTHE, "10px"), 3000), caps(k, "Derniers guides", { couleur: MENTHE, police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const colDroite = G.colonne(k, [titreG, billets(k, { n: 3, couleur: BRUME, taille: 17, survol: MENTHE, focus: MENTHE }), k.col([], { height: "8px" }), abo], { poids: 5, min: "290px", gap: "14px" });
    const milieu = G.bande(k, [colIndex, colDroite], { fond: NUIT, gap: "40px 72px", aligne: "flex-start", padV: ["16px", "16px", "8px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Index" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: NUIT, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [haut, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-180 « Édition spéciale » — média spécialisé
// Idée : un MÉDIA DE NICHE à bandes franches. Une bande orange vif porte une invitation monumentale (« Ne ratez rien. ») et la lettre d'information en noir sur orange ; une bande noire montre les rubriques en grille,
// les derniers articles et les liens de collaboration ; une fine bande orange ferme le tout. Les cartes de rubrique se remplissent d'orange au survol. Polices : Archivo (titres 900, texte) et Space Mono (libellés).
// Rubriques d'exemple, à renommer. Mobile : bandes empilées, rubriques sur deux colonnes.
const orangeNoir = identite({
  key: "c180", label: "Orange vif et noir", humeur: "dark",
  fond: "#0b0b0b", texte: "#f5f5f2", discret: "#bdbdb8", accent: "#ff5a1f", surface: "#171717", encre: "#0b0b0b", surEncre: "#f5f5f2",
  police: "font.archivo", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "0px", ligne: "#f5f5f233",
});
const NOIR = "#0b0b0b", ORANGE = "#ff5a1f", BLANC = "#f5f5f2";
const MONO = "font.space-mono";

const editionSpeciale = modeleV2({
  id: identifiantV2(180, "edition-speciale"), concept: "c-180-edition-speciale",
  name: "Édition spéciale", family: FAM,
  description: "Pour un média spécialisé : bande orange avec invitation monumentale et lettre d'information, bande noire avec rubriques en grille, derniers articles et collaboration, fine bande de mentions. Franc, contrasté, très éditorial.",
  tags: ["média", "média spécialisé", "lettre d'information", "rubriques", "orange", "noir", "bandes franches"],
  identity: orangeNoir,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "querylist", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bande orange : invitation + lettre
    const phrase = G.geant(`<p>Ne ratez<br>rien.</p>`, { taille: [56, 120], tablette: { taille: [84, 110] }, mobile: { taille: [56, 84] }, lh: 0.92, suivi: "-0.04em", poids: "900", police: S.head, couleur: NOIR, extra: { textTransform: "uppercase" } })(k, env);
    const abo = abonnement(k, env, { titre: "La lettre", intro: "Les analyses et les dossiers du média, dans votre boîte aux lettres.", bouton: "S'abonner", largeur: "100%", accent: NOIR, texte: NOIR, soulignement: "3px" });
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: NOIR, fontFamily: MONO, lineHeight: 1.4 };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: NOIR, fontSize: "16px" };
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, color: NOIR };
    abo.parts.input.states = { focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: NOIR, outlineOffset: "4px" } };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: ORANGE };
    abo.parts.button.states = { hover: { backgroundColor: "#ffffff", color: NOIR }, focus: GK.focus(NOIR) };
    const haut = G.bande(k, [G.colonne(k, [phrase], { poids: 7, min: "300px" }), G.colonne(k, [abo], { poids: 5, min: "290px", soi: "flex-end", extra: { maxWidth: "440px" } })], { fond: ORANGE, gap: "36px 64px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["88px", "64px", "44px"], padH: ["48px", "32px", "20px"], nom: "Invitation" });
    // 2 · bande noire : rubriques en grille, derniers articles, collaboration
    const carteRub = (num, nom) => {
      const t = lien(k, nom, "/blog", { taille: 18, poids: "800", couleur: BLANC, survol: { color: NOIR }, focus: NOIR, h: "44px", extra: { width: "100%" } });
      const c = k.col([caps(k, num, { couleur: ORANGE, police: MONO, suivi: "0.1em" }), t], { flexGrow: 1, flexBasis: "150px", minWidth: "130px", minHeight: "110px", justifyContent: "space-between", paddingTop: "14px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "1px", borderColor: "#f5f5f240", backgroundColor: "#171717", transitionDuration: DOUX, borderRadius: "0px" });
      c.states = { hover: { backgroundColor: ORANGE, borderColor: ORANGE, transform: { y: -4 } } };
      return c;
    };
    const grille = G.ligne(k, [carteRub("01", "Dossiers"), carteRub("02", "Enquêtes"), carteRub("03", "Entretiens"), carteRub("04", "Chroniques"), carteRub("05", "Données"), carteRub("06", "Agenda")], { gap: "10px", aligne: "stretch", largeur: "100%" });
    const colRub = G.colonne(k, [caps(k, "Rubriques", { couleur: ORANGE, police: MONO }), grille], { poids: 5, min: "300px", gap: "16px" });
    const colArt = G.colonne(k, [caps(k, "Derniers articles", { couleur: ORANGE, police: MONO }), billets(k, { n: 3, couleur: BLANC, taille: 18, poids: "800", survol: ORANGE, focus: ORANGE }), lien(k, "Tout lire →", "/blog", { taille: 15, poids: "800", couleur: ORANGE, soulign: true, survol: { color: BLANC, transform: { x: 6 } }, focus: ORANGE })], { poids: 4, min: "270px", gap: "14px" });
    const collab = [["Écrire à la rédaction", "/contact"], ["Proposer un article", "/contact"], ["Questions fréquentes", "/faq"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: ORANGE, transform: { x: 4 } }, focus: ORANGE }));
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["X", "https://x.com/"], ["Flux RSS", "/blog"]], { taille: 15, poids: "700", couleur: BLANC, survol: ORANGE, focus: ORANGE })(k, env);
    reseaux.styles.desktop = { ...reseaux.styles.desktop, flexDirection: "column", alignItems: "flex-start", rowGap: "0px" };
    const colCollab = G.colonne(k, [caps(k, "Collaborer", { couleur: ORANGE, police: MONO }), ...collab, k.col([], { height: "10px" }), caps(k, "Suivre", { couleur: ORANGE, police: MONO }), reseaux], { poids: 3, min: "200px", gap: "0px" });
    const milieu = G.bande(k, [colRub, colArt, colCollab], { fond: NOIR, gap: "44px 56px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Rubriques et articles" });
    // 3 · fine bande de mentions
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: NOIR, colonne: true, padV: ["20px", "20px", "16px"], padB: ["24px", "20px", "18px"], padH: ["48px", "32px", "20px"], filetHaut: { epaisseur: "6px", couleur: ORANGE }, nom: "Mentions" });
    return [G.racine(k, [haut, milieu, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Blogs et actualités", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : magazine d'actualités, blog d'entreprise, journal local, site de ressources, média spécialisé.",
  models: [uneDeJournal, cahierIdees, gazetteDuCoin, rayonGuides, editionSpeciale],
};
