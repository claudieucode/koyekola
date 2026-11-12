// Famille v2 « Services informatiques » — 5 modèles (ft2-141 à ft2-145), extension « carrée » (angles droits, sites standard très professionnels).
// Pieds d'infogérant, d'agence web, d'hébergeur, de société de cybersécurité et de centre de support : esprit technique, statut de service, caractères à chasse fixe, grilles.
// Marques fictives ; AUCUNE coordonnée, AUCUN chiffre (délai, taux de disponibilité, nombre de clients…) ni état de service inventé : le « statut » est un indicateur de DESIGN (carré qui respire) relié à un vrai lien
// de contact, jamais une promesse. Horaires, adresse et téléphone viennent des « Données de l'entreprise » du site. Chaque modèle a sa palette, ses polices et ses formes (indépendance, mode « solo »).
//
// ANGLES DROITS : identité à `rayon: "0px"`, aucun `borderRadius` non nul, boutons et champs carrés, indicateurs carrés (jamais de point rond).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, filet, décalage de 4 à 28 px) ; carré de statut qui « respire » (pulse lent) ;
// aucune animation d'entrée, aucun défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "services-informatiques";
const MV = 360; // ms : durée des transitions de survol (douces)

// ── Aides LOCALES à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
const NBSP = " ";
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: MV, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: o.casse || "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Animation d'attention en boucle lente (aucun repli animé en mouvement réduit)
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
// Petit carré plein (jamais de point rond)
const carre = (k, couleur, t = "10px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
// « Ouvert maintenant » désactivé : son point d'état est rond (angles droits obligatoires)
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: MV }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, casse: o.casse, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
function abonnement(k, env, o) {
  const abo = GK.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre, lineHeight: 1.4, fontFamily: o.police || abo.parts.title.styles.desktop.fontFamily, ...(o.casse ? { textTransform: o.casse, letterSpacing: "0em" } : {}) };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro || abo.parts.intro.styles.desktop.color };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, transitionDuration: MV, color: o.surBouton || abo.parts.button.styles.desktop.color };
  if (o.couleurManque) abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: o.couleurManque };
  if (o.fondChamp) abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, backgroundColor: o.fondChamp };
  return abo;
}
// Ligne d'index : lien pleine largeur, filet haut, numéro + libellé ; au survol le fond se remplit et le texte se décale
function ligneIndex(k, num, label, url, o) {
  const n = k.LINK(`${num}${NBSP}${NBSP}${NBSP}${label}`, url, compact({ fontFamily: o.police, fontSize: o.taille || "fluid:26-52", fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: "0.01em", color: o.couleur, textDecoration: "none", display: "flex", alignItems: "center", width: "100%", minHeight: "76px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: o.filet, paddingLeft: "0px", paddingRight: "12px", lineHeight: 1.1, transitionDuration: MV }));
  return GK.fini(k, n, { hover: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, paddingLeft: "28px", textDecoration: "none" }, focus: GK.focus(o.focus) });
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-141 « Terminal d'état » — infogérance et supervision
// Idée : une FENÊTRE DE TERMINAL à angles droits. Barre de titre (trois carrés, nom du « fichier » en chasse fixe, carré de statut vert qui respire + lien « Ouvrir une demande »), puis une ligne de commande,
// la phrase « Votre parc, supervisé_ » en JetBrains Mono, et quatre colonnes titrées « // horaires », « // coordonnées », « // ressources », « // lettre ». Les liens ont un chevron « › » et glissent au survol.
// Le carré de statut est un indicateur de DESIGN (aucun état de service affirmé). Polices : JetBrains Mono (titres, libellés) et Inter (texte). Mobile : colonnes empilées, fenêtre pleine largeur.
const terminal = identite({
  key: "c141", label: "Noir encre et vert terminal", humeur: "dark",
  fond: "#0a0e13", texte: "#d9e3ec", discret: "#94a6b6", accent: "#3ddc97", surface: "#101720", encre: "#0a0e13", surEncre: "#d9e3ec",
  police: "font.inter", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#d9e3ec26",
});
const ENCRE_N = "#0a0e13", PANNEAU = "#101720", VERT_T = "#3ddc97", CLAIR = "#d9e3ec";

const terminalEtat = modeleV2({
  id: identifiantV2(141, "terminal-d-etat"), concept: "c-141-terminal-d-etat",
  name: "Terminal d'état", family: FAM,
  description: "Pour un infogérant : fenêtre de terminal à angles droits, barre de titre avec indicateur de statut qui respire, phrase en police à chasse fixe, quatre colonnes commentées « // » (horaires, contact, ressources, lettre). Noir et vert terminal.",
  tags: ["infogérance", "supervision", "terminal", "chasse fixe", "noir", "vert", "statut", "angles droits"],
  identity: terminal,
  racine: racineDe(ENCRE_N),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, mono = S.head;
    // barre de titre : trois carrés, nom du fichier, statut + lien
    const trois = k.row([carre(k, "#3a4856", "10px"), carre(k, "#3a4856", "10px"), carre(k, "#3a4856", "10px")], { gap: "8px", flexWrap: "nowrap", alignItems: "center" });
    const fichier = k.T("<p>infogerance ~ pied-de-page</p>", { fontFamily: mono, fontSize: "13px", color: S.mute, lineHeight: 1.4 });
    const statut = k.row([souffle(carre(k, VERT_T, "10px"), 2800), lien(k, "Ouvrir une demande", "/contact", { taille: 13, poids: "600", police: mono, couleur: VERT_T, survol: { color: "#ffffff", transform: { x: 4 } }, focus: VERT_T })], { gap: "10px", flexWrap: "nowrap", alignItems: "center" });
    const titre = k.row([k.row([trois, fichier], { gap: "18px", flexWrap: "nowrap", alignItems: "center" }), statut], { justifyContent: "space-between", alignItems: "center", width: "100%", paddingTop: "4px", paddingBottom: "4px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line, rowGap: "8px", columnGap: "20px" }, { paddingLeft: "16px", paddingRight: "16px" }, { paddingLeft: "12px", paddingRight: "12px" });
    // corps : commande, phrase, intro
    const cmd = k.T("<p>$ superviser --parc --sauvegardes --mises-a-jour</p>", { fontFamily: mono, fontSize: "14px", color: VERT_T, lineHeight: 1.5, overflowWrap: "anywhere" });
    const phrase = G.geant(`<p>Votre parc,<br>supervisé<span style="color:${VERT_T}">_</span></p>`, { taille: [34, 84], tablette: { taille: [52, 76] }, mobile: { taille: [34, 48] }, lh: 1.05, suivi: "-0.03em", poids: "700", police: mono, couleur: "#ffffff" })(k, env);
    const intro = k.T("<p>Postes, serveurs, sauvegardes, mises à jour : nous surveillons, nous corrigeons, vous gardez la main sur l'essentiel.</p>", { fontSize: "17px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "460px" });
    const ecrire = lien(k, "Écrire à l'équipe", "/contact", { taille: 14, poids: "700", police: mono, couleur: ENCRE_N, h: "52px", padH: "26px", survol: { backgroundColor: "#ffffff", color: ENCRE_N, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: VERT_T, borderRadius: "0px", justifyContent: "center", alignSelf: "flex-start" } });
    const corpsHaut = G.ligne(k, [G.colonne(k, [cmd, phrase], { poids: 7, min: "300px", gap: "20px" }), G.colonne(k, [intro, ecrire], { poids: 5, min: "280px", gap: "24px", soi: "flex-end" })], { gap: "36px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // quatre colonnes commentées
    const com = (t) => ({ couleurTitre: VERT_T, police: mono, casse: "none", suiviTitre: "0.02em", tailleTitre: "14px" , ...t });
    const c1 = bloc(k, "// horaires", [horaires(k, { taille: 15 })], com({ poids: 1.1 }));
    const c2 = bloc(k, "// coordonnées", [coordonnees(k, { taille: 15, lien: CLAIR, survol: VERT_T, focus: VERT_T })], com({ poids: 1.1 }));
    const res = [["Accueil", "/"], ["Journal technique", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const c3 = bloc(k, "// ressources", res.map(([t, u]) => lien(k, `›${NBSP}${t}`, u, { taille: 15, poids: "500", survol: { color: VERT_T, transform: { x: 6 } }, focus: VERT_T })), com({ gap: "0px", min: "200px" }));
    const abo = abonnement(k, env, { titre: "// lettre", intro: "Alertes et bonnes pratiques, sans bruit.", bouton: "S'abonner", largeur: "340px", accent: VERT_T, couleurTitre: VERT_T, police: mono, casse: "none", survolBouton: "#ffffff", survolTexte: ENCRE_N });
    const c4 = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [c1, c2, c3, c4], { gap: "36px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const corps = k.col([corpsHaut, trait(k, S.line), grille], { gap: "44px", width: "100%", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "40px", backgroundColor: PANNEAU }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "18px", paddingRight: "18px" });
    const fenetre = k.col([titre, corps], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "1px", borderColor: "#d9e3ec40", borderRadius: "0px", backgroundColor: PANNEAU });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bande = G.bande(k, [fenetre, mentions], { fond: ENCRE_N, colonne: true, gap: "32px", padV: ["72px", "56px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "16px"], innerMobile: { rowGap: "24px" }, nom: "Terminal" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-142 « Atelier Octet » — agence web
// Idée : AFFICHE JAUNE ET NOIRE. Un grand aplat jaune vif : à gauche le nom « octet » en lettres monumentales (marque fictive) et un bouton noir « Démarrer un projet » ; à droite quatre rangées numérotées (index) qui
// se REMPLISSENT de noir au survol, texte jaune glissant de 28 px. En dessous, une bande noire : coordonnées, horaires, lettre (champ à filet jaune) et mentions.
// Polices : Space Grotesk (titres) et Onest (texte). Mobile : nom, bouton, rangées, puis colonnes empilées.
const octet = identite({
  key: "c142", label: "Jaune vif, noir et blanc", humeur: "dark",
  fond: "#0b0b0b", texte: "#ffffff", discret: "#c9c9c9", accent: "#ffe600", surface: "#1a1a1a", encre: "#0b0b0b", surEncre: "#ffffff",
  police: "font.onest", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#ffffff33",
});
const JAUNE = "#ffe600", NOIR2 = "#0b0b0b";

const atelierOctet = modeleV2({
  id: identifiantV2(142, "atelier-octet"), concept: "c-142-atelier-octet",
  name: "Atelier Octet", family: FAM,
  description: "Pour une agence web : grand aplat jaune avec nom monumental et bouton noir, quatre rangées numérotées qui se remplissent de noir au survol, puis bande noire (contact, horaires, lettre, mentions). Affiche franche, très lisible.",
  tags: ["agence web", "création de sites", "jaune", "noir", "affiche", "nom monumental", "rangées", "angles droits"],
  identity: octet,
  racine: racineDe(NOIR2),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>octet</p>`, { taille: [96, 200], tablette: { taille: [120, 170] }, mobile: { taille: [96, 140] }, lh: 0.9, suivi: "-0.05em", poids: "700", police: S.head, couleur: NOIR2 })(k, env);
    const sous = k.T("<p>Agence web : sites, boutiques en ligne et maintenance, du premier croquis à la mise en ligne.</p>", { fontSize: "18px", lineHeight: 1.5, color: NOIR2, fontFamily: S.font, maxWidth: "420px", fontWeight: "500" });
    const projet = lien(k, "Démarrer un projet", "/contact", { taille: 15, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: JAUNE, h: "56px", padH: "30px", survol: { backgroundColor: "#ffffff", color: NOIR2, transform: { y: -3 } }, focus: NOIR2, extra: { backgroundColor: NOIR2, borderRadius: "0px", justifyContent: "center", alignSelf: "flex-start" } });
    const gauche = G.colonne(k, [caps(k, "Agence web", { couleur: NOIR2, suivi: "0.24em" }), nom, sous, projet], { poids: 6, min: "300px", gap: "22px" });
    const opt = { police: S.head, couleur: NOIR2, filet: NOIR2, fondSurvol: NOIR2, couleurSurvol: JAUNE, focus: NOIR2, taille: "fluid:24-40" };
    const rangees = k.col([ligneIndex(k, "01", "Réalisations", "/blog", opt), ligneIndex(k, "02", "Questions", "/faq", opt), ligneIndex(k, "03", "Espace client", "/connexion", opt), ligneIndex(k, "04", "Nous écrire", "/contact", opt)], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: NOIR2 });
    const droite = G.colonne(k, [rangees], { poids: 6, min: "300px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: JAUNE, gap: "48px 72px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], nom: "Affiche" });
    const c1 = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: "#ffffff", survol: JAUNE, focus: JAUNE })], { couleurTitre: JAUNE, poids: 1.1, suiviTitre: "0.2em" });
    const c2 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: JAUNE, poids: 1.1, suiviTitre: "0.2em" });
    const abo = abonnement(k, env, { titre: "Lettre de l'atelier", intro: "Un exemple de projet et un conseil, de temps en temps.", bouton: "S'abonner", largeur: "360px", accent: JAUNE, couleurTitre: JAUNE, survolBouton: "#ffffff", survolTexte: NOIR2, soulignement: "3px" });
    const c3 = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [c1, c2, c3], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: NOIR2, colonne: true, gap: "40px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Contact" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-143 « Baie de serveurs » — hébergeur et noms de domaine
// Idée : une BAIE de serveurs : tout est rangé en cases. Barre marine du haut (carré cyan qui respire, « Support technique », lien « Ouvrir une demande »), phrase « Votre site, bien hébergé. » sur gris acier,
// puis une GRILLE de cinq cases séparées par des filets de 1 px (plateforme, assistance, horaires, coordonnées, lettre), numérotées en chasse fixe (01., 02.…). Les cases s'éclairent au survol.
// Le carré de statut est un indicateur de DESIGN (aucun état de service affirmé). Polices : IBM Plex Sans (titres, texte) et IBM Plex Mono (numéros, libellés). Mobile : cases empilées.
const baie = identite({
  key: "c143", label: "Gris acier, marine et bleu", humeur: "light",
  fond: "#e8edf3", texte: "#0f2238", discret: "#42566b", accent: "#0369a1", surface: "#ffffff", encre: "#0f2238",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0f223833",
});
const MARINE_B = "#0f2238", ACIER = "#e8edf3", BLEU_B = "#0369a1", CYAN = "#38bdf8", TRAME = "#b3c0d0";
const PLEXMONO = "font.ibm-plex-mono";

const baieDeServeurs = modeleV2({
  id: identifiantV2(143, "baie-de-serveurs"), concept: "c-143-baie-de-serveurs",
  name: "Baie de serveurs", family: FAM,
  description: "Pour un hébergeur ou un revendeur de noms de domaine : barre de support marine avec indicateur de statut, phrase sur gris acier, puis grille de cinq cases à filets fins numérotées en chasse fixe, qui s'éclairent au survol.",
  tags: ["hébergeur", "noms de domaine", "support", "grille", "gris acier", "marine", "bleu", "chasse fixe", "angles droits"],
  identity: baie,
  racine: racineDe(ACIER),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, mono = PLEXMONO;
    // barre du haut : support + statut
    const gaucheBarre = k.row([souffle(carre(k, CYAN, "10px"), 3000), caps(k, "Support technique", { couleur: "#ffffff", police: mono, suivi: "0.14em", taille: "12px" })], { gap: "12px", flexWrap: "nowrap", alignItems: "center" });
    const demande = lien(k, "Ouvrir une demande ↗", "/contact", { taille: 13, poids: "600", police: mono, couleur: CYAN, survol: { color: "#ffffff", transform: { x: 4 } }, focus: CYAN });
    const barre = G.bande(k, [gaucheBarre, demande], { fond: MARINE_B, gap: "6px 24px", aligne: "center", padV: ["4px", "4px", "4px"], padB: ["4px", "4px", "4px"], padH: ["48px", "32px", "20px"], nom: "Support" });
    // phrase
    const phrase = G.geant(`<p>Votre site,<br>bien hébergé.</p>`, { taille: [42, 96], tablette: { taille: [64, 88] }, mobile: { taille: [42, 60] }, lh: 1.02, suivi: "-0.035em", poids: "600", police: S.head, couleur: MARINE_B })(k, env);
    const intro = k.T("<p>Hébergement web, serveurs, noms de domaine : une équipe technique qui répond quand il le faut.</p>", { fontSize: "17px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "420px" });
    const bt = lien(k, "Contacter le support", "/contact", { taille: 15, poids: "700", couleur: "#ffffff", h: "52px", padH: "28px", survol: { backgroundColor: BLEU_B, color: "#ffffff", transform: { y: -3 } }, focus: BLEU_B, extra: { backgroundColor: MARINE_B, borderRadius: "0px", justifyContent: "center", alignSelf: "flex-start" } });
    const gauche = G.colonne(k, [caps(k, "Hébergement et domaines", { couleur: BLEU_B, police: mono, suivi: "0.16em" }), phrase], { poids: 7, min: "300px", gap: "20px" });
    const droite = G.colonne(k, [intro, bt], { poids: 5, min: "280px", gap: "24px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: ACIER, gap: "40px 72px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Phrase" });
    // grille de cases (écart de 1 px sur fond de trame = filets fins et réguliers, quelle que soit la largeur)
    const entete = (num, titre) => k.row([k.T(`<p>${num}</p>`, { fontFamily: mono, fontSize: "13px", fontWeight: "500", color: BLEU_B, lineHeight: 1.4 }), caps(k, titre, { couleur: MARINE_B, police: mono, suivi: "0.12em", taille: "13px" })], { gap: "10px", flexWrap: "nowrap", alignItems: "baseline" });
    const lk = (t, u) => lien(k, t, u, { taille: 16, poids: "500", survol: { color: BLEU_B, transform: { x: 6 } }, focus: BLEU_B });
    const caseG = (num, titre, enfants, poids = 1) => {
      const c = k.col([entete(num, titre), ...enfants], { backgroundColor: "#ffffff", flexGrow: poids, flexBasis: "0px", minWidth: "230px", gap: "10px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "26px", paddingRight: "26px", borderRadius: "0px", transitionDuration: MV });
      c.states = { hover: { backgroundColor: "#f1f8fd" } };
      return c;
    };
    const k1 = caseG("01.", "Plateforme", [lk("Accueil", "/"), lk("Journal technique", "/blog"), lk("Questions fréquentes", "/faq")]);
    const k2 = caseG("02.", "Assistance", [lk("Ouvrir une demande", "/contact"), lk("Espace client", "/connexion"), lk("Créer un compte", "/inscription")]);
    const k3 = caseG("03.", "Horaires", [horaires(k, { taille: 15 })], 1.8);
    const k4 = caseG("04.", "Coordonnées", [coordonnees(k, { taille: 15, lien: MARINE_B, survol: BLEU_B, focus: BLEU_B })], 1.6);
    const abo = abonnement(k, env, { titre: "Maintenances et conseils", intro: "Les opérations prévues, par courriel.", bouton: "S'abonner", largeur: "320px", accent: BLEU_B, couleurTitre: MARINE_B, survolBouton: MARINE_B, survolTexte: "#ffffff" });
    const k5 = caseG("05.", "Lettre", [abo], 1.5);
    const grille = k.row([k1, k2, k3, k4, k5], { columnGap: "1px", rowGap: "1px", alignItems: "stretch", width: "100%", backgroundColor: TRAME, borderStyle: "solid", borderWidth: "1px", borderColor: TRAME, borderRadius: "0px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, mentions], { fond: ACIER, colonne: true, gap: "32px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Baie" });
    return [G.racine(k, [barre, haut, bas])];
  },
}, FAM);

// ft2-144 « Zéro confiance » — cybersécurité — REFONTE (archétype I : frise horizontale en trois étapes, points carrés)
// Idée : le déroulé d'une défense en FRISE. Sur graphite, la phrase « Zéro confiance. » en Sora géant, puis une ligne horizontale qui relie trois carrés rouge-orangé : 01 Détecter, 02 Protéger, 03 Répondre. Chaque étape se soulève
// au survol ; la troisième porte le bouton carré « Signaler un incident » ; le premier carré respire lentement. Dessous, sur une bande plus sombre : coordonnées, horaires, lettre « Veille sécurité », ressources en ligne, mentions.
// Aucun chiffre de sécurité inventé. Polices : Sora (titres) et Inter Tight (texte). Angles droits partout. Mobile : phrase, étapes en pile, blocs empilés.
const zero = identite({
  key: "c144", label: "Graphite et rouge-orangé", humeur: "dark",
  fond: "#111214", texte: "#f4f4f2", discret: "#aeb0b6", accent: "#ff5a36", surface: "#1b1c20", encre: "#111214", surEncre: "#f4f4f2",
  police: "font.inter-tight", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f4f4f233",
});
const GRAPHITE = "#111214", GRAPHITE2 = "#0b0c0e", ROUGE = "#ff5a36", BARRE = "#4a4d55";

const zeroConfiance = modeleV2({
  id: identifiantV2(144, "zero-confiance"), concept: "c-144-zero-confiance",
  name: "Zéro confiance", family: FAM,
  description: "Pour une société de cybersécurité : phrase géante sur graphite, puis une frise de trois étapes reliées par un trait (Détecter, Protéger, Répondre) à points carrés rouge-orangé, bouton « Signaler un incident », contact, horaires et lettre.",
  tags: ["cybersécurité", "sécurité informatique", "frise", "étapes", "graphite", "rouge", "points carrés", "angles droits"],
  identity: zero,
  racine: racineDe(GRAPHITE2),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la phrase, seule, en grand
    const phrase = G.geant(`<p>Zéro <span style="color:${ROUGE}">confiance.</span></p>`, { taille: [46, 150], tablette: { taille: [84, 120] }, mobile: { taille: [46, 76] }, lh: 1.0, suivi: "-0.04em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const intro = k.T("<p>Chaque accès est vérifié, chaque alerte est traitée. Nous aidons les équipes à voir tôt et à réagir juste.</p>", { fontSize: "17px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "520px" });
    const tete = G.colonne(k, [caps(k, "Cybersécurité", { couleur: ROUGE, suivi: "0.24em" }), phrase, intro], { gap: "22px", aligne: "flex-start" });
    // 2 · la frise : rail (carré + trait qui s'étire) puis numéro, titre en lien, phrase ; les trois étapes sont d'égale largeur
    const etape = (num, titre, sous, url, extra, premier) => {
      const carre = k.col([], { width: "16px", height: "16px", backgroundColor: ROUGE, borderRadius: "0px", flexShrink: 0 });
      if (premier) souffle(carre, 2600);
      const rail = k.row([carre, k.divider({ width: "100%", borderColor: BARRE, borderTopWidth: "2px", marginTop: "0px", marginBottom: "0px", flexGrow: 1, flexBasis: "0px", minWidth: "0px" })], { gap: "0px", flexWrap: "nowrap", alignItems: "center", width: "100%" });
      const n = k.LINK(`${num}${NBSP}${NBSP}${titre}`, url, { fontFamily: S.head, fontSize: "28px", fontWeight: "700", color: "#ffffff", textDecoration: "none", lineHeight: 1.15, display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: MV });
      GK.fini(k, n, { hover: { color: ROUGE, transform: { x: 6 } }, focus: GK.focus(ROUGE) });
      const c = k.col([rail, n, k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "320px" }), ...(extra || [])], { gap: "14px", alignItems: "flex-start", flexGrow: 1, flexBasis: "0px", minWidth: "240px", paddingRight: "28px", boxSizing: "border-box", transitionDuration: MV }, undefined, { minWidth: "0px", flexBasis: "100%", paddingRight: "0px" });
      c.states = { hover: { transform: { y: -6 } } };
      return c;
    };
    const signal = lien(k, "Signaler un incident ↗", "/contact", { taille: 15, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: GRAPHITE, h: "48px", padH: "20px", survol: { backgroundColor: "#ffffff", color: GRAPHITE, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: ROUGE, borderRadius: "0px", justifyContent: "center", marginTop: "6px" } });
    const frise = k.row([
      etape("01", "Détecter", "Surveiller les accès, repérer les écarts.", "/blog", null, true),
      etape("02", "Protéger", "Durcir les postes, les comptes et les données.", "/blog"),
      etape("03", "Répondre", "Contenir, expliquer, rétablir.", "/contact", [signal]),
    ], { ...GK.gaps("40px 0px"), flexWrap: "wrap", alignItems: "stretch", width: "100%" });
    const haut = G.bande(k, [tete, frise], { fond: GRAPHITE, colonne: true, gap: "72px", padV: ["96px", "72px", "52px"], padB: ["72px", "56px", "44px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "40px" }, nom: "Frise" });
    // 3 · bande plus sombre : coordonnées et horaires côte à côte, lettre à droite, ressources en ligne
    const c1 = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: "#ffffff", survol: ROUGE, focus: ROUGE })], { couleurTitre: ROUGE, suiviTitre: "0.2em", min: "200px" });
    const c2 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: ROUGE, suiviTitre: "0.2em", min: "200px" });
    const abo = abonnement(k, env, { titre: "Veille sécurité", intro: "Les alertes qui comptent, sans bruit.", bouton: "S'abonner", largeur: "360px", accent: ROUGE, couleurTitre: ROUGE, survolBouton: "#ffffff", survolTexte: GRAPHITE });
    const c3 = G.colonne(k, [abo], { poids: 1.2, min: "280px" });
    const infos = G.ligne(k, [G.colonne(k, [G.ligne(k, [c1, c2], { gap: "32px 48px", aligne: "flex-start", largeur: "100%" })], { poids: 3, min: "320px" }), c3], { gap: "40px 72px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const res = G.ligne(k, [["Accueil", "/"], ["Alertes et conseils", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "600", survol: { color: ROUGE, transform: { y: -2 } }, focus: ROUGE })), { gap: "0px 32px", aligne: "center", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [infos, res, trait(k, S.line), mentions], { fond: GRAPHITE2, colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "1px", couleur: "#f4f4f233" }, nom: "Contact" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-145 « Centre d'aide » — support informatique et assistance aux utilisateurs
// Idée : un CENTRE D'AIDE. Sur fond lilas très clair, au centre, la phrase « Besoin d'aide ? Nous sommes là. », un grand champ de recherche carré (widget Recherche du site) et quatre tuiles à contour épais
// (Questions fréquentes, Ouvrir une demande, Articles et guides, Espace client) qui se soulèvent et passent à l'indigo au survol. Une bande indigo profond ferme le pied : horaires du support, coordonnées, lettre, mentions.
// Polices : Outfit (titres) et Mulish (texte). Mobile : tuiles empilées, champ pleine largeur.
const aide = identite({
  key: "c145", label: "Lilas clair et indigo", humeur: "light",
  fond: "#f4f2ff", texte: "#1b1740", discret: "#4f4a78", accent: "#4f2fe0", surface: "#ffffff", encre: "#1b1740",
  police: "font.mulish", titres: "font.outfit",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#1b174033",
});
const LILAS_C = "#f4f2ff", INDIGO_N = "#1b1740", INDIGO = "#4f2fe0", PERVENCHE = "#cfc6ff";

const centreDAide = modeleV2({
  id: identifiantV2(145, "centre-d-aide"), concept: "c-145-centre-d-aide",
  name: "Centre d'aide", family: FAM,
  description: "Pour un support informatique : question centrale, grand champ de recherche carré, quatre tuiles à contour épais qui se soulèvent au survol, puis bande indigo avec horaires du support, coordonnées, lettre et mentions.",
  tags: ["support informatique", "assistance", "centre d'aide", "recherche", "tuiles", "lilas", "indigo", "angles droits"],
  identity: aide,
  racine: racineDe(INDIGO_N),
  widgets: ["text", "search", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const sur = caps(k, "Centre d'aide", { couleur: INDIGO, suivi: "0.24em", extra: { textAlign: "center" } });
    const phrase = G.geant(`<p>Besoin d'aide ?<br>Nous sommes là.</p>`, { taille: [38, 84], tablette: { taille: [56, 76] }, mobile: { taille: [38, 52] }, lh: 1.05, suivi: "-0.03em", poids: "700", police: S.head, couleur: INDIGO_N, align: "center" })(k, env, true);
    const rech = k.W("search", { target: "site", placeholder: "Votre question…", button: "Rechercher" }, { width: "100%", maxWidth: "680px", fontFamily: S.font, marginLeft: "auto", marginRight: "auto", borderRadius: "0px" });
    rech.parts = {
      field: { styles: { desktop: { fontFamily: S.font, fontSize: "18px", color: INDIGO_N, backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: INDIGO_N, borderRadius: "0px", minHeight: "60px", paddingLeft: "18px", paddingRight: "18px" }, mobile: { minHeight: "56px" } }, states: { focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: INDIGO, outlineOffset: "2px" } } },
      button: { styles: { desktop: { fontFamily: S.font, fontSize: "16px", fontWeight: "800", color: "#ffffff", backgroundColor: INDIGO, borderStyle: "solid", borderWidth: "0px", borderRadius: "0px", minHeight: "60px", paddingLeft: "28px", paddingRight: "28px", transitionDuration: MV }, mobile: { minHeight: "56px" } }, states: { hover: { backgroundColor: INDIGO_N }, focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: INDIGO_N, outlineOffset: "2px" } } },
    };
    const haut = G.bande(k, [sur, phrase, rech], { fond: LILAS_C, colonne: true, aligne: "center", gap: "28px", max: "1180px", padV: ["104px", "80px", "56px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Question" });
    // quatre tuiles à contour épais
    const tuile = (titre, sous, url) => {
      const t = k.LINK(`${titre}${NBSP}↗`, url, { fontFamily: S.head, fontSize: "24px", fontWeight: "700", color: INDIGO_N, textDecoration: "none", lineHeight: 1.15, display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: MV });
      GK.fini(k, t, { hover: { color: INDIGO }, focus: GK.focus(INDIGO) });
      const c = k.col([t, k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.55, color: S.mute, fontFamily: S.font })], { backgroundColor: "#ffffff", flexGrow: 1, flexBasis: "0px", minWidth: "230px", minHeight: "150px", gap: "8px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "24px", paddingRight: "24px", borderStyle: "solid", borderWidth: "2px", borderColor: INDIGO_N, borderRadius: "0px", transitionDuration: MV });
      c.states = { hover: { borderColor: INDIGO, backgroundColor: "#ece8ff", transform: { y: -6 } } };
      return c;
    };
    const tuiles = G.ligne(k, [tuile("Questions fréquentes", "Les réponses aux demandes les plus courantes.", "/faq"), tuile("Ouvrir une demande", "Décrivez le problème : l'équipe vous répond.", "/contact"), tuile("Articles et guides", "Pas à pas, conseils, bonnes pratiques.", "/blog"), tuile("Espace client", "Suivre vos demandes et vos accès.", "/connexion")], { gap: "18px", aligne: "stretch", largeur: "100%" });
    const bandeTuiles = G.bande(k, [tuiles], { fond: LILAS_C, colonne: true, padV: ["16px", "16px", "8px"], padB: ["80px", "64px", "48px"], padH: ["48px", "32px", "20px"], nom: "Tuiles" });
    // bande indigo : horaires, coordonnées, lettre, mentions
    const c1 = bloc(k, "Horaires du support", [horaires(k, { taille: 15, couleur: "#ffffff" })], { couleurTitre: PERVENCHE, poids: 1.2 });
    const c2 = bloc(k, "Nous joindre", [coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: PERVENCHE, focus: PERVENCHE })], { couleurTitre: PERVENCHE, poids: 1.1 });
    const abo = abonnement(k, env, { titre: "Lettre du support", intro: "Pannes connues et astuces, par courriel.", bouton: "S'abonner", largeur: "340px", accent: PERVENCHE, texte: "#ffffff", couleurTitre: PERVENCHE, couleurIntro: "#d9d3ff", survolBouton: "#ffffff", survolTexte: INDIGO_N, surBouton: INDIGO_N, couleurManque: "#ffffff" });
    const c3 = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [c1, c2, c3], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d3ff", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff33"), mentions], { fond: INDIGO_N, colonne: true, gap: "40px", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Support" });
    bas.styles.desktop = { ...bas.styles.desktop, color: "#ffffff" }; // la ligne légale de la plateforme reprend la couleur de la dernière bande : claire sur indigo
    return [G.racine(k, [haut, bandeTuiles, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Services informatiques", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : infogérance, agence web, hébergement, cybersécurité et support informatique.",
  models: [terminalEtat, atelierOctet, baieDeServeurs, zeroConfiance, centreDAide],
};
