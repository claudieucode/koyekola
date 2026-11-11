// Famille v2 « Vie locale et associations » — 5 modèles (ft2-121 à ft2-125), extension « sites du quotidien ».
// Pieds de TOUS LES JOURS : club sportif, association de quartier, mairie de petite commune, photographe, blog personnel. Contenu utile et réel (inscription, horaires, contact, lettre d'information,
// liens rapides, mentions légales) ; marques fictives ; AUCUNE coordonnée ni chiffre inventé (horaires, adresse, téléphone viennent des « Données de l'entreprise » du site ; sans données les widgets restent sobres).
// Les adresses de réseaux sociaux sont des EXEMPLES (page d'accueil du réseau) à remplacer dans l'éditeur. Chaque modèle a sa palette, ses polices et ses formes (indépendance du site, mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce », vérifié en Chrome) :
//   · transitions de survol / focus (couleur, fond, contour, léger déplacement de 2 à 6 px) : posées par `transitionDuration` ; la frontière de pied les coupe en mouvement réduit ;
//   · pas de widget « Défilement continu » : il dépasse volontairement de l'écran et l'audit Chrome le compte en défaut (hors écran, texte coupé) ; remplacé par des rubans statiques ;
//   · « souffle » discret (animation d'attention « pulse », boucle lente) : pastille du club, point d'or du studio, bouton d'adhésion de l'association. Les animations d'attention n'ont aucun repli animé (reduced = « none »).
//   Limite du moteur : aucune animation d'ENTRÉE (le registre ne propose, pour les entrées, qu'un repli en fondu de 300 ms sous mouvement réduit, ce que le test « 0 animation » refuse).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "vie-locale";

// ── Aides LOCALES à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
// Lien de texte fini par le moteur (états, 44 px mobile) puis états propres
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
// Petit libellé en capitales espacées
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Mouvement d'un nœud (champ `motion` du Page Builder) : animation d'attention en boucle lente (aucun repli animé en mouvement réduit)
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
// Parties d'un widget : fusionne styles (bureau) et états
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
// Horaires et coordonnées (Données de l'entreprise), habillés puis finis par le moteur
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones !== false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: GK.MOUVEMENT }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
// Colonne de pied : libellé + contenu
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-121 « Coup d'envoi » — club sportif de quartier
// Idée : un pied de VESTIAIRE. Une grande bande jaune maillot invite à rejoindre l'équipe (REJOINS L'ÉQUIPE. en lettres condensées géantes, deux boutons : s'inscrire, écrire), un ruban de mots du club
// entre deux filets, puis le vestiaire vert : horaires, coordonnées, liens utiles, lettre du club. Pastille jaune qui « respire » devant « Horaires ». Mobile : bandes empilées, ruban qui passe à la ligne.
// Marque fictive : aucune ; les horaires et l'adresse viennent des Données de l'entreprise. Polices : Barlow Condensed (titres, capitales) et Barlow.
const vestiaire = identite({
  key: "c121", label: "Vert vestiaire et jaune maillot", humeur: "dark",
  fond: "#0c3526", texte: "#f5f7ee", discret: "#c3d4c8", accent: "#ffd23f", surface: "#124632", encre: "#0c3526", surEncre: "#f5f7ee",
  police: "font.barlow", titres: "font.barlow-condensed",
  rayon: "10px", rayonBouton: "6px", ombre: "none", poids: "800", bordure: "0px", ligne: "#f5f7ee33",
});
const JAUNE = "#ffd23f", VERT = "#0c3526", VERT2 = "#082419";

const coupDEnvoi = modeleV2({
  id: identifiantV2(121, "coup-d-envoi"), concept: "c-121-coup-d-envoi",
  name: "Coup d'envoi", family: FAM,
  description: "Pour un club de quartier : une bande jaune « Rejoins l'équipe » avec inscription, un ruban de mots du club, puis le vestiaire vert (horaires, contact, liens utiles, lettre du club). Sobre, énergique, lisible au bord du terrain.",
  tags: ["club sportif", "association sportive", "inscription", "horaires", "vert", "jaune", "ruban"],
  identity: vestiaire,
  racine: racineDe(VERT),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bande jaune : l'invitation (phrase condensée géante) + deux boutons
    const phrase = G.geant(`<p>Rejoins<br>l'équipe.</p>`, { taille: [64, 168], tablette: { taille: [104, 140] }, mobile: { taille: [64, 120] }, lh: 1.0, suivi: "-0.01em", poids: "800", police: S.head, couleur: VERT, extra: { textTransform: "uppercase" } })(k, env);
    const intro = k.T("<p>Premier essai, inscription ou simple question : on vous répond. Le plus dur, c'est de pousser la porte.</p>", { fontSize: "17px", lineHeight: 1.55, color: VERT, fontFamily: S.font, maxWidth: "420px" });
    const bouton = (t, u, plein) => lien(k, t, u, { taille: 16, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: plein ? JAUNE : VERT, h: "52px", padH: "26px", survol: plein ? { backgroundColor: VERT2, color: "#ffffff", transform: { y: -3 } } : { backgroundColor: VERT, color: JAUNE, transform: { y: -3 } }, focus: VERT, extra: { backgroundColor: plein ? VERT : undefined, borderStyle: "solid", borderWidth: "2px", borderColor: VERT, borderRadius: "6px", justifyContent: "center" } });
    const boutons = k.row([bouton("S'inscrire", "/inscription", true), bouton("Nous écrire", "/contact", false)], { gap: "12px" });
    const droite = G.colonne(k, [intro, boutons], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" });
    const gauche = G.colonne(k, [phrase], { poids: 8, min: "300px", aligne: "flex-start" });
    const invitation = G.bande(k, [gauche, droite], { fond: JAUNE, gap: "40px 64px", aligne: "flex-end", padV: ["88px", "72px", "52px"], padB: ["88px", "72px", "52px"], padH: ["48px", "32px", "20px"], nom: "Invitation" });
    // 2 · ruban STATIQUE de mots du club entre deux filets (le widget « Défilement continu » dépasse volontairement de l'écran : l'audit Chrome le compte comme « hors écran / texte coupé », donc écarté ici)
    const MOTS = ["Entraînements", "Matchs", "Tournois", "Stages", "Bénévoles", "Venez&nbsp;essayer"];
    const ruban = k.T(`<p>${MOTS.join(" &nbsp;●&nbsp; ")}</p>`, { fontFamily: S.head, fontSize: "fluid:17-26", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", color: S.fg, lineHeight: 1.4, textAlign: "center", width: "100%" });
    const bandeRuban = G.bande(k, [ruban], { colonne: true, gap: "0px", max: "1280px", fond: VERT2, padV: ["18px", "16px", "14px"], padB: ["18px", "16px", "14px"], padH: ["32px", "24px", "16px"], nom: "Ruban" });
    // 3 · le vestiaire : horaires, contact, liens, lettre du club
    const pastille = souffle(k.col([], { width: "12px", height: "12px", borderRadius: "50%", backgroundColor: JAUNE, flexShrink: 0 }), 2800);
    const titreHoraires = k.row([pastille, caps(k, "Horaires", { couleur: JAUNE })], { gap: "10px", alignItems: "center" });
    const colHoraires = G.colonne(k, [titreHoraires, horaires(k, { taille: 15 })], { poids: 1.1, min: "240px", gap: "14px" });
    const colContact = bloc(k, "Nous trouver", [coordonnees(k, { taille: 15, lien: S.fg, survol: JAUNE, focus: JAUNE })], { couleurTitre: JAUNE, poids: 1.1 });
    const rapide = [["Accueil", "/"], ["Actualités du club", "/blog"], ["Questions fréquentes", "/faq"], ["Espace membre", "/connexion"]];
    const colLiens = bloc(k, "Liens rapides", rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: JAUNE, transform: { x: 4 } }, focus: JAUNE, h: "44px" })), { couleurTitre: JAUNE, gap: "0px", min: "200px" });
    const abo = G.abonnement({ titre: "La lettre du club", intro: "Matchs, stages, infos pratiques : un message de temps en temps.", bouton: "Je m'abonne", largeur: "360px", accent: JAUNE })(k, env);
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: JAUNE, lineHeight: 1.4 };
    const colLettre = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [colHoraires, colContact, colLiens, colLettre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const vestiaireBande = G.bande(k, [grille, trait(k, S.line), mentions], { colonne: true, gap: "40px", fond: VERT, padV: ["72px", "56px", "48px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "32px" }, nom: "Vestiaire" });
    return [G.racine(k, [invitation, bandeRuban, vestiaireBande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-122 « Table de quartier » — association de quartier / maison des jeunes et de la culture
// Idée : le pied d'une MAISON OUVERTE. Fond crème, phrase chaleureuse « Ici, tout le monde a sa place. » en serif, une carte d'adhésion à droite (bouton qui « respire » très doucement), trois tuiles colorées
// légèrement penchées (Ateliers, Sorties, Coup de main) qui se redressent et se soulèvent au survol, puis horaires d'accueil, contact et lettre du quartier.
// Les trois tuiles sont des rubriques d'EXEMPLE qui pointent vers le blog (à renommer dans l'éditeur). Polices : Fraunces (titres) et Nunito (texte). Mobile : phrase, carte, tuiles en pile.
const quartier = identite({
  key: "c122", label: "Crème, aubergine et corail", humeur: "light",
  fond: "#fbf3e4", texte: "#2b2140", discret: "#5a516e", accent: "#c1411f", surface: "#f2e3c6", encre: "#2b2140",
  police: "font.nunito", titres: "font.fraunces",
  rayon: "26px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2b214033",
});
const CREME = "#fbf3e4", AUB = "#2b2140", CORAIL = "#c1411f";

const tableDeQuartier = modeleV2({
  id: identifiantV2(122, "table-de-quartier"), concept: "c-122-table-de-quartier",
  name: "Table de quartier", family: FAM,
  description: "Pour une association de quartier ou une MJC : phrase d'accueil en serif, carte d'adhésion, trois tuiles colorées qui se redressent au survol, puis horaires d'accueil, contact et lettre du quartier. Chaleureux, crème et corail.",
  tags: ["association", "quartier", "MJC", "adhésion", "crème", "corail", "tuiles"],
  identity: quartier,
  racine: racineDe(CREME),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la phrase d'accueil (serif, un mot en corail)
    const sur = caps(k, "Association de quartier", { couleur: CORAIL });
    const phrase = G.geant(`<p>Ici, tout<br>le monde<br><span style="color:${CORAIL}">a sa place.</span></p>`, { taille: [48, 100], tablette: { taille: [72, 96] }, mobile: { taille: [52, 72] }, lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: AUB })(k, env);
    const gauche = G.colonne(k, [sur, phrase], { poids: 7, min: "300px", gap: "18px" });
    // 2 · la carte d'adhésion : texte + bouton plein corail qui « respire » (souffle lent)
    const adhere = k.T("<p>Adhérer, c'est soutenir les activités du quartier et voter à l'assemblée. On vous explique tout, sans papier compliqué.</p>", { fontSize: "16px", lineHeight: 1.6, color: AUB, fontFamily: S.font });
    const bt = lien(k, "Devenir adhérent", "/inscription", { taille: 16, poids: "800", couleur: "#ffffff", h: "52px", padH: "28px", survol: { backgroundColor: AUB, color: "#ffffff", transform: { y: -2 } }, focus: AUB, extra: { backgroundColor: CORAIL, borderRadius: "999px", justifyContent: "center", alignSelf: "flex-start" } });
    souffle(bt, 4200);
    const aide = lien(k, "Une question ? Écrivez-nous", "/contact", { taille: 15, poids: "700", couleur: AUB, soulign: true, survol: { color: CORAIL }, focus: CORAIL });
    const carte = G.carte([caps(k, "Adhésion", { couleur: AUB }), adhere, bt, aide], { fond: "#ffffff", rayon: "26px", remplissage: "28px", ombre: "none", contour: true })(k);
    carte.styles.desktop = { ...carte.styles.desktop, borderStyle: "solid", borderWidth: "2px", borderColor: AUB, gap: "16px", maxWidth: "420px" };
    const droite = G.colonne(k, [carte], { poids: 5, min: "290px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: CREME, gap: "40px 56px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["44px", "40px", "28px"], padH: ["48px", "32px", "20px"], nom: "Accueil" });
    // 3 · trois tuiles penchées (rotation de repos) : au survol / focus elles se redressent et se soulèvent
    const tuile = (titre, sous, url, fond, texte, penche) => {
      const t = k.LINK(`${titre}`, url, { fontFamily: S.head, fontSize: "26px", fontWeight: "600", color: texte, textDecoration: "none", lineHeight: 1.1, display: "block" });
      const s = k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.45, color: texte, fontFamily: S.font });
      const c = k.col([t, s], { backgroundColor: fond, borderRadius: "24px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", gap: "8px", flexGrow: 1, flexBasis: "0px", minWidth: "220px", minHeight: "132px", transform: { rotate: penche }, transitionDuration: 260 });
      c.states = { hover: { transform: { rotate: 0, y: -6 } } };
      Moteur.finishNode(S, t);
      t.states = { hover: { textDecoration: "underline" }, focus: GK.focus(texte) };
      t.styles.desktop = { ...t.styles.desktop, minHeight: "44px" };
      return c;
    };
    const tuiles = G.ligne(k, [
      tuile("Ateliers", "Cuisine, couture, numérique, jeux : à retrouver dans les actualités.", "/blog", "#ffd9a8", AUB, -1.5),
      tuile("Sorties", "Balades, spectacles, repas partagés entre voisins.", "/blog", "#cfe8d9", AUB, 1),
      tuile("Coup de main", "Bénévolat, entraide : donnez une heure, ça compte.", "/contact", "#d9d3f2", AUB, -0.8),
    ], { gap: "20px", aligne: "stretch", largeur: "100%" });
    const bandeTuiles = G.bande(k, [tuiles], { fond: CREME, colonne: true, padV: ["24px", "24px", "16px"], padB: ["24px", "24px", "16px"], padH: ["48px", "32px", "20px"], nom: "Tuiles" });
    // 4 · accueil, contact, lettre
    const colHoraires = bloc(k, "Accueil du public", [horaires(k, { taille: 15 })], { couleurTitre: AUB, poids: 1.2 });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { taille: 15, lien: AUB, survol: CORAIL, focus: CORAIL })], { couleurTitre: AUB });
    const abo = G.abonnement({ titre: "La lettre du quartier", intro: "Les rendez-vous du mois, dans votre boîte aux lettres.", bouton: "S'abonner", largeur: "380px", accent: CORAIL })(k, env);
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: AUB, lineHeight: 1.4 };
    const colLettre = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const infos = G.ligne(k, [colHoraires, colContact, colLettre], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [infos, trait(k, S.line, "2px"), mentions], { fond: CREME, colonne: true, gap: "36px", padV: ["56px", "48px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Infos" });
    return [G.racine(k, [haut, bandeTuiles, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-123 « Guichet de la commune » — mairie de petite commune
// Idée : un pied INSTITUTIONNEL mais humain, pensé pour l'habitant pressé. Liseré tricolore sobre en tête, nom de la commune (Titre du site), un champ de recherche « Rechercher une démarche »,
// puis quatre colonnes : horaires d'ouverture (avec « Ouvert maintenant » des Données de l'entreprise), nous joindre, démarches et liens, lettre d'information. Aucune animation décorative :
// seuls les survols (flèche qui avance, soulignement) et le focus, pour rester sobre et accessible. Polices : Source Serif 4 (titres) et Source Sans 3 (texte). Aucun blason, aucune coordonnée inventée.
const commune = identite({
  key: "c123", label: "Papier chaud, bleu marine et rouge brique", humeur: "light",
  fond: "#f6f3ec", texte: "#14213d", discret: "#4a5468", accent: "#1d4e89", surface: "#ffffff", encre: "#14213d",
  police: "font.source-sans-3", titres: "font.source-serif-4",
  rayon: "4px", rayonBouton: "4px", ombre: "none", poids: "700", bordure: "1px", ligne: "#14213d2e",
});
const MARINE = "#14213d", BLEU = "#1d4e89", BRIQUE = "#b4281c", PAPIER = "#f6f3ec";

const guichetCommune = modeleV2({
  id: identifiantV2(123, "guichet-de-la-commune"), concept: "c-123-guichet-de-la-commune",
  name: "Guichet de la commune", family: FAM,
  description: "Pour la mairie d'une petite commune : liseré tricolore sobre, nom de la commune, recherche de démarche, horaires d'ouverture avec l'état du moment, contact, démarches utiles et lettre d'information. Clair, posé, très lisible.",
  tags: ["mairie", "commune", "collectivité", "horaires", "démarches", "institutionnel", "papier"],
  identity: commune,
  racine: racineDe(PAPIER),
  widgets: ["sitetitle", "text", "search", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 0 · liseré tricolore : trois segments (bleu, blanc, brique) de 6 px, pleine largeur
    const seg = (c) => k.col([], { flexGrow: 1, flexBasis: "0px", height: "6px", backgroundColor: c });
    const lisere = { type: "container", props: { full: true }, children: [k.row([seg(BLEU), seg("#ffffff"), seg(BRIQUE)], { gap: "0px", flexWrap: "nowrap", width: "100%", alignItems: "stretch" })], ...sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: PAPIER, gap: "0px" }) };
    // 1 · le nom de la commune (widget Titre du site) + une phrase + recherche
    const nom = Moteur.item(k, "title:34", env);
    nom.styles.desktop = { ...nom.styles.desktop, color: MARINE, fontFamily: S.head, fontWeight: "700", letterSpacing: "-0.01em", lineHeight: 1.1 };
    nom.parts = { ...(nom.parts || {}), link: { ...((nom.parts || {}).link || {}), styles: { desktop: { color: MARINE, textDecoration: "none" }, mobile: { display: "inline-block", minHeight: "44px", paddingTop: "10px", paddingBottom: "10px" } } } };
    const mot = k.T("<p>Au service des habitants : démarches, horaires, informations pratiques.</p>", { fontSize: "17px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "460px" });
    const gauche = G.colonne(k, [caps(k, "Mairie", { couleur: BRIQUE, suivi: "0.18em" }), nom, mot], { poids: 6, min: "300px", gap: "12px" });
    const rech = k.W("search", { target: "site", placeholder: "Rechercher une démarche, une information…", button: "Rechercher" }, { width: "100%", maxWidth: "520px", fontFamily: S.font });
    rech.parts = {
      field: { styles: { desktop: { fontFamily: S.font, fontSize: "17px", color: MARINE, backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: MARINE, borderRadius: "4px", minHeight: "52px", paddingLeft: "16px", paddingRight: "16px" }, mobile: { minHeight: "52px" } }, states: { focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: BLEU, outlineOffset: "2px" } } },
      button: { styles: { desktop: { fontFamily: S.font, fontSize: "16px", fontWeight: "700", color: "#ffffff", backgroundColor: BLEU, borderStyle: "solid", borderWidth: "0px", borderRadius: "4px", minHeight: "52px", paddingLeft: "22px", paddingRight: "22px", transitionDuration: GK.MOUVEMENT }, mobile: { minHeight: "52px" } }, states: { hover: { backgroundColor: MARINE }, focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: MARINE, outlineOffset: "2px" } } },
    };
    const droite = G.colonne(k, [caps(k, "Une démarche à faire ?", { couleur: MARINE }), rech], { poids: 6, min: "300px", gap: "12px", soi: "flex-end" });
    const tete = G.bande(k, [gauche, droite], { fond: PAPIER, gap: "36px 64px", aligne: "flex-end", padV: ["64px", "52px", "40px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Commune" });
    // 2 · quatre colonnes sur fond blanc, filets fins
    const colHoraires = bloc(k, "Horaires d'ouverture", [horaires(k, { taille: 16 })], { couleurTitre: MARINE, poids: 1.2, tailleTitre: "13px" });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { taille: 16, lien: BLEU, survol: BRIQUE, focus: BLEU })], { couleurTitre: MARINE, tailleTitre: "13px" });
    const demarches = [["Nous contacter", "/contact"], ["Questions fréquentes", "/faq"], ["Actualités de la commune", "/blog"], ["Espace habitant", "/connexion"]];
    const colDem = bloc(k, "Démarches et infos", demarches.map(([t, u]) => lien(k, `${t}`, u, { taille: 16, poids: "600", couleur: BLEU, survol: { color: BRIQUE, textDecoration: "underline", transform: { x: 4 } }, focus: BLEU, soulign: false })), { couleurTitre: MARINE, gap: "0px", min: "200px", tailleTitre: "13px" });
    const abo = G.abonnement({ titre: "Lettre d'information", intro: "Les informations de la commune, directement par courriel.", bouton: "S'abonner", largeur: "360px", accent: BLEU, rayonBouton: "4px", soulignement: "2px" })(k, env);
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: MARINE, lineHeight: 1.4, fontSize: "13px" };
    abo.parts.button.states = { hover: { backgroundColor: MARINE, color: "#ffffff" }, focus: GK.focus(MARINE) };
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [colHoraires, colContact, colDem, colLettre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const corps = G.bande(k, [grille, trait(k, S.line), mentions], { colonne: true, gap: "40px", fond: "#ffffff", padV: ["56px", "48px", "40px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "1px", couleur: "#14213d2e" }, nom: "Démarches" });
    return [G.racine(k, [lisere, tete, corps])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-124 « Studio lumière » — photographe de mariage et de portrait
// Idée : un pied de STUDIO, noir chaud et or pâle. Au centre, une phrase en Cormorant très légère (« Vos plus beaux jours, en lumière. »), sous elle une PLANCHE-CONTACT : cinq cadres numérotés (Mariages, Portraits,
// Couples, Familles, Séances) qui se soulèvent et dorent leur filet au survol ; une ligne d'italiques ; puis demande de devis, coordonnées et réseaux. Aucun faux portrait : les cadres sont des filets vides, prêts pour
// de vraies images dans l'éditeur. Polices : Cormorant Garamond (titres, légers) et Jost (texte). Mobile : cadres en deux colonnes.
const studio = identite({
  key: "c124", label: "Noir chaud et or pâle", humeur: "dark",
  fond: "#14110f", texte: "#f2eadd", discret: "#bcb09c", accent: "#d2ae72", surface: "#1e1a16", encre: "#14110f", surEncre: "#f2eadd",
  police: "font.jost", titres: "font.cormorant-garamond",
  rayon: "2px", rayonBouton: "0px", ombre: "none", poids: "300", bordure: "1px", ligne: "#f2eadd2e",
});
const NOIR = "#14110f", OR = "#d2ae72", IVOIRE = "#f2eadd";

const studioLumiere = modeleV2({
  id: identifiantV2(124, "studio-lumiere"), concept: "c-124-studio-lumiere",
  name: "Studio lumière", family: FAM,
  description: "Pour un photographe de mariage ou de portrait : phrase légère en serif, planche-contact de cinq cadres numérotés qui se soulèvent au survol, ligne d'italiques, demande de devis, contact et réseaux. Noir chaud, or pâle, très calme.",
  tags: ["photographe", "mariage", "portrait", "studio", "noir et or", "serif", "planche contact"],
  identity: studio,
  racine: racineDe(NOIR),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la phrase centrée, un filet d'or au-dessus
    const sur = caps(k, "Photographe · mariage et portrait", { couleur: OR, suivi: "0.28em", extra: { textAlign: "center" } });
    const f = G.filet({ largeur: "56px", epaisseur: "1px", couleur: OR })(k, env, true);
    const phrase = G.geant(`<p>Vos plus beaux jours,<br>en lumière.</p>`, { taille: [44, 112], tablette: { taille: [64, 96] }, mobile: { taille: [38, 46] }, lh: 1.0, suivi: "-0.01em", poids: "300", police: S.head, couleur: IVOIRE, align: "center" })(k, env, true);
    const mot = k.T("<p>Une séance, un reportage, un album : racontons ensemble ce qui compte pour vous.</p>", { fontSize: "17px", lineHeight: 1.7, color: S.mute, fontFamily: S.font, textAlign: "center", maxWidth: "520px", marginLeft: "auto", marginRight: "auto", fontWeight: "300" });
    const haut = G.bande(k, [sur, f, phrase, mot], { fond: NOIR, colonne: true, aligne: "center", gap: "26px", max: "1100px", padV: ["104px", "80px", "64px"], padB: ["48px", "40px", "36px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    // 2 · la planche-contact : cinq cadres 3/2 avec numéro et rubrique ; le lien couvre le cadre
    const cadre = (num, titre, url) => {
      const a = k.LINK(titre, url, { fontFamily: S.head, fontSize: "26px", fontWeight: "400", color: IVOIRE, textDecoration: "none", lineHeight: 1.1, display: "flex", alignItems: "flex-end", minHeight: "44px", width: "100%" });
      Moteur.finishNode(S, a);
      a.states = { hover: { color: OR }, focus: GK.focus(OR) };
      const n = caps(k, num, { couleur: OR, suivi: "0.2em", taille: "12px" });
      const c = k.col([n, a], { flexGrow: 1, flexBasis: "0px", minWidth: "150px", aspectRatio: "3/2", justifyContent: "space-between", borderStyle: "solid", borderWidth: "1px", borderColor: "#f2eadd44", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "18px", paddingRight: "18px", gap: "8px", transitionDuration: 300, backgroundColor: "#1a1613" }, undefined, { minWidth: "140px", aspectRatio: "auto", minHeight: "124px" });
      c.states = { hover: { borderColor: OR, transform: { y: -6 }, backgroundColor: "#221d18" } };
      return c;
    };
    const planche = G.ligne(k, [cadre("01", "Mariages", "/blog"), cadre("02", "Portraits", "/blog"), cadre("03", "Couples", "/blog"), cadre("04", "Familles", "/blog"), cadre("05", "Séances", "/contact")], { gap: "14px", aligne: "stretch", largeur: "100%" });
    const bandePlanche = G.bande(k, [planche], { fond: NOIR, colonne: true, max: "1280px", padV: ["16px", "16px", "8px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], nom: "Planche" });
    // 3 · ligne d'italiques d'or entre deux filets, avec un point d'or qui « respire » (le widget de défilement continu est écarté : l'audit Chrome le compte comme « hors écran »)
    const MOTS = ["Lumière naturelle", "Mariage", "Portrait", "Couple", "Famille", "Reportage"];
    const pt = souffle(k.col([], { width: "10px", height: "10px", borderRadius: "50%", backgroundColor: OR, flexShrink: 0 }), 3600);
    const italiques = k.T(`<p>${MOTS.join(" &nbsp;✦&nbsp; ")}</p>`, { fontFamily: S.head, fontSize: "fluid:20-30", fontWeight: "300", fontStyle: "italic", color: OR, lineHeight: 1.4, textAlign: "center" });
    const ruban = k.row([pt, italiques], { gap: "18px", justifyContent: "center", alignItems: "center", flexWrap: "nowrap", width: "100%" }, undefined, { flexWrap: "wrap", gap: "12px" });
    const bandeRuban = G.bande(k, [ruban], { colonne: true, gap: "0px", max: "1280px", fond: NOIR, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: "#f2eadd2e" }, nom: "Ruban" });
    Object.assign(bandeRuban.styles.desktop, { borderBottomWidth: "1px" });
    // 4 · devis, coordonnées, réseaux
    const devis = lien(k, "Demander un devis", "/contact", { taille: 15, poids: "500", casse: "uppercase", suivi: "0.16em", couleur: NOIR, h: "52px", padH: "30px", survol: { backgroundColor: IVOIRE, color: NOIR, transform: { y: -2 } }, focus: IVOIRE, extra: { backgroundColor: OR, borderRadius: "0px", justifyContent: "center", alignSelf: "flex-start" } });
    const colDevis = G.colonne(k, [caps(k, "Parlons de votre projet", { couleur: OR, suivi: "0.2em" }), k.T("<p>Dites-nous la date, le lieu et l'ambiance rêvée : nous revenons vers vous.</p>", { fontSize: "16px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "340px", fontWeight: "300" }), devis], { poids: 1.3, min: "260px", gap: "16px" });
    const colContact = bloc(k, "Contact", [coordonnees(k, { taille: 16, lien: IVOIRE, survol: OR, focus: OR })], { couleurTitre: OR, suiviTitre: "0.2em" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 16, poids: "400", couleur: IVOIRE, survol: OR, focus: OR })(k, env);
    reseaux.styles.desktop = { ...reseaux.styles.desktop, flexDirection: "column", alignItems: "flex-start", rowGap: "0px" };
    const colRes = bloc(k, "Suivre le travail", [reseaux], { couleurTitre: OR, suiviTitre: "0.2em", gap: "6px", min: "180px" });
    const ligneContact = G.ligne(k, [colDevis, colContact, colRes], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [ligneContact, trait(k, S.line), mentions], { fond: NOIR, colonne: true, gap: "40px", padV: ["64px", "56px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Contact" });
    return [G.racine(k, [haut, bandePlanche, bandeRuban, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-125 « Carnet de bord » — blog personnel
// Idée : la dernière page d'un CARNET. Papier jaune pâle, encre sombre, écriture manuscrite (Caveat) pour la phrase « Merci d'être passé par là. » dont les mots clés sont SURLIGNÉS au feutre jaune,
// la signature « à bientôt » ; à droite, les derniers billets (liste du blog) et une carte postale pour la lettre (bordure en tirets, légèrement penchée, elle se redresse au survol). Liens : tous les billets, questions, contact.
// Aucune animation continue : un carnet ne clignote pas ; seuls la carte qui se redresse et les liens qui avancent bougent, et seulement à l'action. Polices : Caveat (titres manuscrits) et Literata (texte).
const carnet = identite({
  key: "c125", label: "Papier jaune, encre et vert sapin", humeur: "light",
  fond: "#fbf6e3", texte: "#262219", discret: "#5c5546", accent: "#2d5b4c", surface: "#f1e8c8", encre: "#262219",
  police: "font.literata", titres: "font.caveat",
  rayon: "6px", rayonBouton: "6px", ombre: "none", poids: "700", bordure: "1px", ligne: "#26221940",
});
const PAPIER2 = "#fbf6e3", ENCRE = "#262219", SAPIN = "#2d5b4c", FEUTRE = "#ffe36e";

const carnetDeBord = modeleV2({
  id: identifiantV2(125, "carnet-de-bord"), concept: "c-125-carnet-de-bord",
  name: "Carnet de bord", family: FAM,
  description: "Pour un blog personnel : papier jaune pâle, phrase manuscrite surlignée au feutre, signature, derniers billets du blog et carte postale pour la lettre d'information qui se redresse au survol. Intime, lisible, sans artifice.",
  tags: ["blog", "carnet", "manuscrit", "papier", "surligneur", "derniers billets", "newsletter"],
  identity: carnet,
  racine: racineDe(PAPIER2),
  widgets: ["text", "posts", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la phrase manuscrite : fond jaune « feutre » derrière les mots clés (span à fond de couleur)
    const phrase = G.geant(`<p>Merci d'être<br><span style="background-color:${FEUTRE}">passé par là.</span></p>`, { taille: [56, 104], tablette: { taille: [80, 100] }, mobile: { taille: [56, 72] }, lh: 1.12, suivi: "0em", poids: "700", police: S.head, couleur: ENCRE })(k, env);
    const mot = k.T("<p>Ce carnet se remplit au fil des jours : des récits, des listes, des découvertes. Si un billet vous a plu, dites-le-moi, ça fait toujours plaisir.</p>", { fontSize: "17px", lineHeight: 1.7, color: ENCRE, fontFamily: S.font, maxWidth: "460px" });
    const signature = k.T("<p>À bientôt, au prochain billet.</p>", { fontFamily: S.head, fontSize: "34px", fontWeight: "600", color: SAPIN, lineHeight: 1.1, transform: { rotate: -2 } });
    const liens = k.row([
      lien(k, "Tous les billets", "/blog", { taille: 16, poids: "700", couleur: ENCRE, soulign: true, survol: { color: SAPIN, transform: { x: 4 } }, focus: SAPIN }),
      lien(k, "Questions", "/faq", { taille: 16, poids: "700", couleur: ENCRE, soulign: true, survol: { color: SAPIN, transform: { x: 4 } }, focus: SAPIN }),
      lien(k, "M'écrire", "/contact", { taille: 16, poids: "700", couleur: ENCRE, soulign: true, survol: { color: SAPIN, transform: { x: 4 } }, focus: SAPIN }),
    ], { ...GK.gaps("0px 28px"), alignItems: "center" });
    const gauche = G.colonne(k, [phrase, mot, signature, liens], { poids: 7, min: "300px", gap: "28px" });
    // 2 · à droite : les derniers billets (liste, sans image) puis la carte postale de la lettre
    const billets = k.W("posts", { count: 3, layout: "list", showExcerpt: false, showDate: true, showImage: false, empty: "Les prochains billets arrivent bientôt." }, { color: ENCRE, fontFamily: S.font, fontSize: "17px", width: "100%" });
    billets.parts = { title: { styles: { desktop: { color: ENCRE, fontFamily: S.font, fontSize: "18px", fontWeight: "700", textDecoration: "underline" } }, states: { hover: { color: SAPIN } } }, date: { styles: { desktop: { color: S.mute, fontFamily: S.font, fontSize: "14px" } } } };
    const abo = G.abonnement({ titre: "Carte postale", intro: "Un message à chaque nouveau billet, pas plus.", bouton: "Envoyez-moi ça", largeur: "100%", accent: SAPIN, rayonBouton: "6px", soulignement: "2px" })(k, env);
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: SAPIN, fontFamily: S.head, fontSize: "28px", textTransform: "none", letterSpacing: "0em", fontWeight: "700" };
    abo.parts.button.states = { hover: { backgroundColor: ENCRE, color: "#ffffff" }, focus: GK.focus(ENCRE) };
    const postale = k.col([abo], { backgroundColor: "#fffdf4", borderStyle: "dashed", borderWidth: "2px", borderColor: ENCRE, borderRadius: "6px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", transform: { rotate: 1.2 }, transitionDuration: 280, width: "100%", gap: "8px" });
    postale.states = { hover: { transform: { rotate: 0, y: -4 } } };
    const droite = G.colonne(k, [caps(k, "Derniers billets", { couleur: SAPIN, suivi: "0.18em" }), billets, postale], { poids: 5, min: "290px", gap: "18px", extra: { maxWidth: "460px" } });
    const haut = G.bande(k, [gauche, droite], { fond: PAPIER2, gap: "48px 72px", aligne: "flex-start", padV: ["96px", "72px", "52px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Carnet" });
    // 3 · lignes du cahier : filet, réseaux et mentions
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Mastodon", "https://mastodon.social/"], ["Flux RSS", "/blog"]], { taille: 16, poids: "700", couleur: ENCRE, survol: SAPIN, focus: SAPIN })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, trait(k, S.line, "2px"), mentions], { fond: PAPIER2, colonne: true, gap: "28px", padV: ["0px", "0px", "0px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "20px" }, nom: "Fin de page" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Vie locale et associations", target: 5, built: true,
  description: "Pieds de la vie de tous les jours : club sportif, association de quartier, mairie de petite commune, photographe, blog personnel.",
  models: [coupDEnvoi, tableDeQuartier, guichetCommune, studioLumiere, carnetDeBord],
};
