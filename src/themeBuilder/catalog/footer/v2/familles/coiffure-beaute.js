// Famille v2 « Coiffure et beauté » — 5 modèles (ft2-196 à ft2-200), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius), standard et très professionnel.
// Salon de coiffure, barbier, institut de beauté, onglerie, spa : prise de rendez-vous, prestations en TEXTE (aucun prix, aucune durée, aucune coordonnée inventés), horaires et contact lus dans les « Données de l'entreprise ».
// Les noms de prestations sont des EXEMPLES modifiables dans l'éditeur (dit dans la page quand c'est utile). Adresses de réseaux : exemples (page d'accueil du réseau). Marques fictives.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions longues et douces de 360 ms ; au moins une animation visible par modèle (carré de statut qui « respire », tuile qui se soulève, filet qui s'épaissit, rangée qui glisse).
// Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu (voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const DOUX = 360; // ms : transitions de survol / focus

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
// petit carré plein (statut, repère) : jamais rond
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// Lettre d'information : habille toutes les parties du widget pour un fond précis (angles droits)
function lettre(k, env, G, o) {
  const abo = G.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte, fondChamp: o.fondChamp, rembChamp: o.rembChamp })(k, env);
  const P = abo.parts;
  P.title.styles.desktop = { ...P.title.styles.desktop, color: o.couleurTitre || o.texte, lineHeight: 1.4 };
  P.intro.styles.desktop = { ...P.intro.styles.desktop, color: o.texte };
  P.consent.styles.desktop = { ...P.consent.styles.desktop, color: o.texte };
  P.missing.styles.desktop = { ...P.missing.styles.desktop, color: o.texte };
  P.button.styles.desktop = { ...P.button.styles.desktop, color: o.surBouton, backgroundColor: o.accent, borderRadius: "0px", transitionDuration: DOUX };
  P.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.survolTexte || o.fond, transform: { y: -2 } }, focus: GK.focus(o.focus || o.texte) };
  return abo;
}
const nomDuSite = (k, env, taille, couleur, extra = {}) => {
  const S = k.S, nom = Moteur.item(k, `title:${taille}`, env);
  nom.styles.desktop = { ...nom.styles.desktop, color: couleur, fontFamily: S.head, fontWeight: "700", letterSpacing: "-0.01em", lineHeight: 1.1, ...extra };
  nom.parts = { ...(nom.parts || {}), link: { ...((nom.parts || {}).link || {}), styles: { desktop: { color: couleur, textDecoration: "none" }, mobile: { display: "inline-block", minHeight: "44px", paddingTop: "10px", paddingBottom: "10px" } } } };
  return nom;
};
const FAM = "coiffure-beaute";
// Rangée de lien pleine largeur (filet bas, fond qui change et glisse au survol) — angles droits
const rangee = (k, label, url, o) => lien(k, label, url, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, police: o.police, bloc: true, h: o.h || "48px", padH: o.padH || "12px", survol: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, transform: { x: 6 } }, focus: o.focus, extra: { width: "100%", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.ligne } });
// Panneau / case à angles droits, qui passe à la ligne et se redimensionne tout seul
const panneau = (k, enfants, o = {}) => k.col(enfants, { flexGrow: o.poids ?? 1, flexBasis: o.base || "0px", minWidth: o.min || "320px", gap: o.gap || "16px", justifyContent: o.justifie, alignItems: o.aligne || "flex-start", paddingTop: o.padV?.[0] || "56px", paddingBottom: o.padV?.[0] || "56px", paddingLeft: o.padH?.[0] || "56px", paddingRight: o.padH?.[0] || "56px", backgroundColor: o.fond, minHeight: o.hauteur, borderRadius: "0px", borderStyle: "solid", borderWidth: "0px", ...(o.extra || {}) },
  { paddingTop: o.padV?.[1] || "44px", paddingBottom: o.padV?.[1] || "44px", paddingLeft: o.padH?.[1] || "32px", paddingRight: o.padH?.[1] || "32px" },
  { paddingTop: o.padV?.[2] || "36px", paddingBottom: o.padV?.[2] || "36px", paddingLeft: o.padH?.[2] || "20px", paddingRight: o.padH?.[2] || "20px", minWidth: "0px", flexBasis: "100%" });
const rangeeDe = (k, enfants, o = {}) => k.row(enfants, { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", backgroundColor: o.fond, ...(o.extra || {}) });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-196 « Carnet de rendez-vous » — salon de coiffure — archétype E : DEUX DEMI-PAGES bord à bord de couleurs opposées
// Idée : à gauche, un grand panneau prune porte le message (nom du salon, phrase, énorme bouton cuivre « Prendre rendez-vous ») ; à droite, un panneau crème tient le carnet : prestations en rangées à filet (elles glissent et
// s'éclairent au survol, chacune mène à la prise de contact) puis l'agenda (horaires, carré de statut qui respire). Aucune lettre d'information ici : un seul geste, réserver. Mentions en fine ligne dessous.
// Les prestations sont des EXEMPLES SANS PRIX. Polices : DM Serif Display (titres) et Karla. Mobile : le panneau prune passe au-dessus.
const carnet = identite({
  key: "c196", label: "Crème rosé, prune et cuivre", humeur: "light",
  fond: "#f6ede6", texte: "#3b1630", discret: "#664a5d", accent: "#a9471f", surface: "#ffffff", encre: "#3b1630",
  police: "font.karla", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#3b163033",
});
const PRUNE = "#3b1630", CUIVRE = "#a9471f", CUIVRE_CLAIR = "#e8a77f", CREME = "#f6ede6", CREME2 = "#ecdcd0";

const carnetRdv = modeleV2({
  id: identifiantV2(196, "carnet-de-rendez-vous"), concept: "c-196-carnet-de-rendez-vous",
  name: "Carnet de rendez-vous", family: FAM,
  description: "Pour un salon de coiffure : deux demi-pages bord à bord, un panneau prune avec le nom du salon et un énorme bouton cuivre de rendez-vous, un panneau crème avec les prestations en rangées à filet et les horaires. Un seul geste : réserver.",
  tags: ["coiffure", "salon", "rendez-vous", "deux panneaux", "prune", "cuivre", "angles droits", "horaires"],
  identity: carnet,
  racine: racineDe(CREME2),
  widgets: ["sitetitle", "text", "link", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 52, "#ffffff", { fontWeight: "400" });
    const mot = k.T("<p>Coupe, couleur, soins : on prend le temps de vous écouter. Réservez votre créneau en quelques instants.</p>", { fontSize: "19px", lineHeight: 1.55, color: "#eadbe4", fontFamily: S.font, maxWidth: "440px" });
    const rdv = lien(k, "Prendre rendez-vous", "/contact", { taille: 20, poids: "800", couleur: "#ffffff", h: "68px", padH: "40px", survol: { backgroundColor: "#ffffff", color: PRUNE, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: CUIVRE, borderStyle: "solid", borderWidth: "2px", borderColor: CUIVRE } });
    const pt = souffle(carre(k, CUIVRE_CLAIR, "12px"), 3200);
    const coord = coordonnees(k, { taille: 16, couleur: "#eadbe4", lien: "#ffffff", survol: CUIVRE_CLAIR, focus: "#ffffff" });
    const gauche = panneau(k, [pt, nom, mot, rdv, coord], { fond: PRUNE, gap: "20px", base: "0px", poids: 1.17, min: "340px", padV: ["88px", "56px", "44px"], padH: ["72px", "40px", "20px"] });
    const prestas = ["Coupe et brushing", "Couleur et mèches", "Soins du cheveu", "Coiffure de cérémonie", "Coupe enfant"].map((t) => rangee(k, t, "/contact", { couleur: PRUNE, police: S.head, taille: 24, poids: "400", h: "60px", fondSurvol: "#ffffff", couleurSurvol: CUIVRE, focus: CUIVRE, ligne: "#3b163044" }));
    const droite = panneau(k, [...prestas, horaires(k, { taille: 16 })], { fond: CREME, gap: "14px", poids: 1.63, min: "340px", padV: ["88px", "56px", "44px"], padH: ["72px", "40px", "20px"] });
    const demi = rangeeDe(k, [gauche, droite]);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#5a4052", liens: PRUNE })(k, env);
    const bas = G.bande(k, [mentions], { fond: CREME2, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [G.bande(k, [demi], { fond: CREME2, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Pleine largeur" }), bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-197 « Enseigne de barbier » — barbier — archétype A : COLONNE LATÉRALE pleine hauteur + zone principale
// Idée : à gauche une haute barre rouge d'enseigne (nom en capitales condensées, bouton blanc « Réserver ma place », coordonnées) ; à droite la zone noir charbon : trois barres franches rouge, crème, bleu en haut,
// la liste des soins en grandes rangées qui glissent, les horaires (carré rouge qui respire) et la fine ligne des mentions. Pas de lettre d'information.
// Les soins sont des EXEMPLES sans tarif. Polices : Bebas Neue (nom, soins) et Barlow. Mobile : la barre rouge passe au-dessus.
const enseigne = identite({
  key: "c197", label: "Noir charbon, rouge enseigne et crème", humeur: "dark",
  fond: "#141414", texte: "#efe7d6", discret: "#b9b1a1", accent: "#e8454a", surface: "#1f1f1f", encre: "#141414", surEncre: "#efe7d6",
  police: "font.barlow", titres: "font.bebas-neue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#efe7d633",
});
const CHARBON = "#141414", ROUGE_B = "#e8454a", ROUGE_FOND = "#b3202a", CREME_B = "#efe7d6", BLEU_B = "#2f5aa8";

const enseigneBarbier = modeleV2({
  id: identifiantV2(197, "barre-d-enseigne"), concept: "c-197-barre-d-enseigne",
  name: "Barre d'enseigne", family: FAM,
  description: "Pour un barbier : une haute barre rouge d'enseigne à gauche (nom en capitales, bouton de réservation, coordonnées) et une zone noir charbon à droite avec trois barres franches, les soins en grandes rangées et les horaires.",
  tags: ["barbier", "barbe", "enseigne", "barre latérale", "noir", "rouge", "angles droits", "horaires"],
  identity: enseigne,
  racine: racineDe(CHARBON),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 76, "#ffffff", { fontWeight: "400", letterSpacing: "0.02em", lineHeight: 0.95, textTransform: "uppercase", overflowWrap: "anywhere" });
    const reserver = lien(k, "Réserver ma place", "/contact", { taille: 18, poids: "800", couleur: CHARBON, casse: "uppercase", suivi: "0.08em", h: "60px", padH: "28px", survol: { backgroundColor: CHARBON, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: "#ffffff" } });
    const coord = coordonnees(k, { taille: 16, couleur: "#ffffff", lien: "#ffffff", survol: CHARBON, focus: "#ffffff" });
    const barreG = panneau(k, [caps(k, "Barbier", { couleur: "#ffffff", suivi: "0.3em", taille: "13px" }), nom, k.T("<p>La barbe, la coupe, le rasage à l'ancienne.</p>", { fontSize: "18px", lineHeight: 1.5, color: "#ffffff", fontFamily: S.font }), reserver, coord,
      G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["TikTok", "https://www.tiktok.com/"]], { taille: 15, poids: "700", couleur: "#ffffff", survol: CHARBON, focus: "#ffffff" })(k, env)],
      { fond: ROUGE_FOND, poids: 0, base: "340px", min: "300px", gap: "20px", padV: ["64px", "48px", "40px"], padH: ["40px", "32px", "20px"], extra: { flexShrink: 0 } });
    const barre = (c) => k.col([], { width: "100%", height: "8px", backgroundColor: c, borderRadius: "0px" });
    const soins = ["La coupe", "La barbe", "Le rasage traditionnel", "Coupe et barbe", "Coupe enfant"].map((t) => rangee(k, t, "/contact", { couleur: CREME_B, police: S.head, taille: 34, poids: "400", h: "64px", padH: "6px", fondSurvol: "#1f1f1f", couleurSurvol: ROUGE_B, focus: ROUGE_B, ligne: "#efe7d633" }));
    const pt = souffle(carre(k, ROUGE_B, "10px"), 3000);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const principal = panneau(k, [k.col([barre(ROUGE_B), barre(CREME_B), barre(BLEU_B)], { gap: "0px", width: "100%", marginBottom: "28px" }), caps(k, "Les soins", { couleur: ROUGE_B }), k.col(soins, { gap: "0px", width: "100%" }),
      k.T("<p>Exemples, sans tarif : à adapter dans l'éditeur.</p>", { fontSize: "14px", color: S.mute, fontFamily: S.font }),
      k.row([caps(k, "Horaires", { couleur: ROUGE_B }), pt], { gap: "10px", alignItems: "center", marginTop: "20px" }), horaires(k, { taille: 16 }), trait(k, S.line), mentions],
      { fond: CHARBON, poids: 1, min: "340px", gap: "14px", padV: ["0px", "0px", "0px"], padH: ["64px", "40px", "20px"], extra: { paddingTop: "0px", paddingBottom: "40px" } });
    const corps = rangeeDe(k, [barreG, principal]);
    return [G.racine(k, [G.bande(k, [corps], { fond: CHARBON, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Pleine largeur" })])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-198 « Papier de l'institut » — institut de beauté — archétype J : PIED « PAPIER À EN-TÊTE »
// Idée : une feuille à en-tête posée sur sauge pâle : cadre à DOUBLE filet vert eucalyptus, l'institut en serif fin au centre, l'adresse et les horaires centrés comme sur un papier à lettres, puis une seule ligne centrée
// de soins séparés par des points carrés (chaque soin souligné qui se dessine au survol). Pas de colonnes, pas de lettre : calme et symétrie. Bande eucalyptus pour les mentions.
// Les soins sont des EXEMPLES sans prix. Polices : Cormorant Garamond (titres) et Jost. Mobile : tout centré en pile.
const vitrine = identite({
  key: "c198", label: "Sauge pâle, eucalyptus et or doux", humeur: "light",
  fond: "#eef2ec", texte: "#1f3d37", discret: "#4b6861", accent: "#7d5f1f", surface: "#ffffff", encre: "#1f3d37",
  police: "font.jost", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1f3d3733",
});
const EUCALYPTUS = "#1f3d37", OR_DOUX = "#7d5f1f", SAUGE = "#eef2ec";

const soinsEnVitrine = modeleV2({
  id: identifiantV2(198, "papier-de-l-institut"), concept: "c-198-papier-de-l-institut",
  name: "Papier de l'institut", family: FAM,
  description: "Pour un institut de beauté : un pied « papier à en-tête », cadre à double filet eucalyptus, nom en serif fin, adresse et horaires centrés, une seule ligne de soins séparés par des points carrés. Calme, symétrique, sans colonnes.",
  tags: ["institut", "beauté", "papier à en-tête", "double filet", "centré", "sauge", "eucalyptus", "angles droits"],
  identity: vitrine,
  racine: racineDe(SAUGE),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 56, EUCALYPTUS, { fontWeight: "500", textAlign: "center" });
    const centrer = (n) => { n.styles.desktop = { ...n.styles.desktop, textAlign: "center", width: "100%", maxWidth: "420px" }; return n; };
    const adresse = centrer(coordonnees(k, { taille: 16, lien: EUCALYPTUS, survol: OR_DOUX, focus: OR_DOUX }));
    const heures = centrer(horaires(k, { taille: 16 }));
    const point = () => carre(k, OR_DOUX, "6px");
    const soins = ["Soins du visage", "Soins du corps", "Épilation", "Beauté des mains", "Maquillage"].flatMap((t, i) => [...(i ? [point()] : []), lien(k, t, "/contact", { taille: 21, poids: "500", police: S.head, couleur: EUCALYPTUS, survol: { color: OR_DOUX, transform: { y: -2 } }, focus: OR_DOUX, padH: "6px", extra: { textDecoration: "underline", textDecorationColor: "#7d5f1f55", textUnderlineOffset: "6px" } })]);
    const ligneSoins = k.row(soins, { rowGap: "8px", columnGap: "18px", alignItems: "center", justifyContent: "center" });
    const prise = lien(k, "Prendre rendez-vous", "/contact", { taille: 15, poids: "600", couleur: "#ffffff", casse: "uppercase", suivi: "0.16em", h: "54px", padH: "32px", survol: { backgroundColor: OR_DOUX, color: "#ffffff", transform: { y: -3 } }, focus: OR_DOUX, extra: { backgroundColor: EUCALYPTUS, borderStyle: "solid", borderWidth: "2px", borderColor: EUCALYPTUS } });
    const pt = souffle(carre(k, OR_DOUX, "10px"), 3400);
    const double = (a, b) => ({ borderStyle: "solid", borderWidth: "1px", borderColor: EUCALYPTUS, borderRadius: "0px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "8px", paddingRight: "8px", backgroundColor: SAUGE });
    const interieur = k.col([k.row([pt, caps(k, "Institut de beauté", { couleur: OR_DOUX, suivi: "0.3em" })], { gap: "12px", alignItems: "center", justifyContent: "center" }), nom, trait(k, OR_DOUX, "2px"), adresse, heures, ligneSoins, prise, k.T("<p>Exemples de soins, sans tarif : à remplacer dans l'éditeur.</p>", { fontSize: "13px", color: S.mute, fontFamily: S.font, textAlign: "center" })],
      { alignItems: "center", gap: "22px", borderStyle: "solid", borderWidth: "1px", borderColor: EUCALYPTUS, borderRadius: "0px", paddingTop: "56px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "40px", backgroundColor: "#ffffff", textAlign: "center" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingTop: "36px", paddingBottom: "32px", paddingLeft: "16px", paddingRight: "16px" });
    const cadre = k.col([interieur], { ...double(), width: "100%", maxWidth: "980px" });
    const corps = G.bande(k, [cadre], { fond: SAUGE, colonne: true, aligne: "center", padV: ["64px", "52px", "36px"], padB: ["64px", "52px", "36px"], padH: ["48px", "32px", "16px"], nom: "Papier" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3d5a53", liens: EUCALYPTUS })(k, env, true);
    const bas = G.bande(k, [mentions], { fond: SAUGE, filetHaut: { epaisseur: "1px", couleur: "#1f3d3733" }, colonne: true, padV: ["24px", "22px", "20px"], padB: ["24px", "22px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-199 « Nuancier d'onglerie » — onglerie — archétype C : GRILLE DE CASES ÉGALES (damier 4 × 2), chaque case est un lien ou une information
// Idée : un NUANCIER de vernis. Huit cases carrées bord à bord : quatre prestations en couleurs franches (corail, lilas, menthe, jaune), la case encre des horaires, la case rose des coordonnées, la case des réseaux
// et la case framboise « Prendre rendez-vous ». Au survol, une case se soulève de 8 px. Pas de lettre d'information ; une fine ligne de mentions sous le damier.
// Les prestations sont des EXEMPLES sans prix. Polices : Outfit (titres) et Hanken Grotesk. Mobile : une case par ligne.
const nuancier = identite({
  key: "c199", label: "Blanc, encre violette et nuancier de vernis", humeur: "light",
  fond: "#ffffff", texte: "#1b1230", discret: "#554a6b", accent: "#b81d58", surface: "#f7f4fb", encre: "#1b1230",
  police: "font.hanken-grotesk", titres: "font.outfit",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1b123033",
});
const ENCRE = "#1b1230", FRAMBOISE = "#b81d58";

const nuancierOnglerie = modeleV2({
  id: identifiantV2(199, "nuancier-d-onglerie"), concept: "c-199-nuancier-d-onglerie",
  name: "Nuancier d'onglerie", family: FAM,
  description: "Pour une onglerie : un damier de huit cases carrées bord à bord, quatre prestations en couleurs franches, une case horaires, une case coordonnées, une case réseaux et une case de rendez-vous. Chaque case est un lien ou une information.",
  tags: ["onglerie", "ongles", "nuancier", "damier", "cases", "couleurs", "angles droits", "horaires"],
  identity: nuancier,
  racine: racineDe("#f3effa"),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const base = { flexGrow: 1.25, flexBasis: "0px", minWidth: "250px", minHeight: "230px", justifyContent: "space-between", gap: "12px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", borderStyle: "solid", borderWidth: "0px", borderRadius: "0px", transitionDuration: DOUX };
    const case_ = (fond, enfants, lever = true) => { const c = k.col(enfants, { ...base, backgroundColor: fond }); if (lever) c.states = { hover: { transform: { y: -8 } } }; return c; };
    const presta = (num, t, fond) => case_(fond, [caps(k, `n° ${num}`, { couleur: ENCRE, suivi: "0.16em" }), lien(k, t, "/contact", { taille: 28, poids: "700", police: S.head, couleur: ENCRE, bloc: true, h: "44px", lh: 1.1, survol: { color: ENCRE, transform: { x: 6 } }, focus: ENCRE, extra: { textDecoration: "underline" } })]);
    const pt = souffle(carre(k, "#ffffff", "10px"), 3000);
    const caseHeures = case_(ENCRE, [k.row([caps(k, "Horaires", { couleur: "#ffffff" }), pt], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 16, couleur: "#ffffff" })], false);
    const caseCoord = case_("#ffd0de", [caps(k, "Coordonnées", { couleur: ENCRE }), coordonnees(k, { taille: 16, couleur: ENCRE, lien: ENCRE, survol: FRAMBOISE, focus: ENCRE })], false);
    const caseRdv = case_(FRAMBOISE, [caps(k, "Votre tour", { couleur: "#ffffff" }), lien(k, "Prendre rendez-vous", "/contact", { taille: 30, poids: "800", police: S.head, couleur: "#ffffff", bloc: true, h: "44px", lh: 1.1, survol: { color: "#ffffff", transform: { x: 8 } }, focus: "#ffffff", extra: { textDecoration: "underline" } })]);
    const nom = nomDuSite(k, env, 28, ENCRE);
    const caseNom = case_("#f3effa", [nom, G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["TikTok", "https://www.tiktok.com/"]], { taille: 15, poids: "700", couleur: ENCRE, survol: FRAMBOISE, focus: ENCRE })(k, env), k.T("<p>Prestations d'exemple, sans tarif : à adapter.</p>", { fontSize: "13px", color: S.mute, fontFamily: S.font })], false);
    const damier = k.col([rangeeDe(k, [presta("01", "Pose de vernis", "#ff8a7a"), presta("02", "Gel et semi-permanent", "#c9b6f2"), caseHeures, caseRdv]), rangeeDe(k, [presta("03", "Nail art", "#a8e6cf"), presta("04", "Soin des mains", "#ffd86b"), caseCoord, caseNom])], { gap: "0px", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#4a4060", liens: ENCRE })(k, env);
    const bas = G.bande(k, [mentions], { fond: "#f3effa", colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [G.bande(k, [damier], { fond: ENCRE, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Pleine largeur" }), bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-200 « Le temps du rituel » — spa — archétype I : FRISE HORIZONTALE EN ÉTAPES à points carrés
// Idée : sur ardoise bleutée, le rituel du spa se lit comme une FRISE : un filet horizontal relie quatre points carrés sauge (Accueil, Soin, Repos, Départ), le premier respire doucement ; sous chaque point, un titre en serif
// et une phrase. En dessous, une bande sable : le bouton de réservation, les horaires et les coordonnées en deux blocs. Pas de lettre d'information.
// Les temps du rituel sont des EXEMPLES sans durée ni tarif. Polices : Instrument Serif (titres) et Manrope. Mobile : la frise devient une pile d'étapes.
const rituel = identite({
  key: "c200", label: "Ardoise bleutée, sable et sauge", humeur: "light",
  fond: "#e3d7bf", texte: "#1d2a33", discret: "#3b4a50", accent: "#2f5a3d", surface: "#efe6d4", encre: "#26343f",
  police: "font.manrope", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#efe6d433",
});
const ARDOISE = "#26343f", ARDOISE2 = "#1d2a33", SABLE = "#efe6d4", SABLE2 = "#e3d7bf", SAUGE_R = "#a9cfa6", VERT_T = "#2f5a3d";

const tempsDuRituel = modeleV2({
  id: identifiantV2(200, "le-temps-du-rituel"), concept: "c-200-le-temps-du-rituel",
  name: "Le temps du rituel", family: FAM,
  description: "Pour un spa : sur ardoise bleutée, une frise horizontale reliant quatre points carrés (accueil, soin, repos, départ) dont le premier respire, puis une bande sable avec bouton de réservation, horaires et coordonnées.",
  tags: ["spa", "bien-être", "frise", "étapes", "ardoise", "sable", "sauge", "angles droits"],
  identity: rituel,
  racine: racineDe(SABLE2),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, SABLE, { fontWeight: "400" });
    const intro = G.colonne(k, [caps(k, "Spa et bien-être", { couleur: SAUGE_R, suivi: "0.26em" }), nom], { poids: 1, min: "260px", gap: "8px" });
    const phrase = k.T("<p>Un rituel en quatre temps, au rythme que vous choisissez.</p>", { fontSize: "30px", lineHeight: 1.15, fontFamily: S.head, fontStyle: "italic", color: SABLE, maxWidth: "460px" });
    const tete = G.ligne(k, [intro, G.colonne(k, [phrase], { poids: 1, min: "280px" })], { gap: "20px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const etape = ([t, d], i) => {
      const point = i === 0 ? souffle(carre(k, SAUGE_R, "16px"), 5000) : carre(k, SAUGE_R, "16px");
      const c = k.col([point, k.T(`<p>${t}</p>`, { fontSize: "30px", fontFamily: S.head, color: SABLE, lineHeight: 1.1 }), k.T(`<p>${d}</p>`, { fontSize: "15px", lineHeight: 1.55, color: "#bccbd0", fontFamily: S.font })],
        { flexGrow: 0.4, flexBasis: "0px", minWidth: "190px", gap: "14px", paddingTop: "0px", paddingBottom: "12px", borderRadius: "0px", transitionDuration: DOUX });
      c.states = { hover: { transform: { y: -5 } } };
      return c;
    };
    // filet horizontal qui relie les points : frère plat entre deux étapes (caché sur mobile, où la frise devient une pile)
    const entre = () => ({ ...k.col([], { flexGrow: 0.15, flexBasis: "0px", minWidth: "24px", height: "2px", marginTop: "7px", backgroundColor: "#a9cfa6aa", borderRadius: "0px", alignSelf: "flex-start" }), hideOn: ["mobile"] });
    const etapes = [["Accueil", "Une tisane et un échange pour choisir le soin."], ["Soin", "Massage, soin du visage ou bain, selon votre envie."], ["Repos", "Un temps calme pour que le soin fasse son effet."], ["Départ", "Quelques conseils pour prolonger le bien-être."]].map(etape);
    const frise = k.row(etapes.flatMap((e, i) => (i ? [entre(), e] : [e])), { gap: "20px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const note = k.T("<p>Temps du rituel donnés en exemple, sans durée ni tarif : à adapter dans l'éditeur.</p>", { fontSize: "14px", color: "#bccbd0", fontFamily: S.font });
    const haut = G.bande(k, [tete, frise, note], { fond: ARDOISE, colonne: true, gap: "56px", padV: ["76px", "56px", "44px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Frise" });
    const reserver = lien(k, "Réserver un soin", "/contact", { taille: 18, poids: "800", couleur: SABLE, h: "60px", padH: "34px", survol: { backgroundColor: VERT_T, color: "#ffffff", transform: { y: -3 } }, focus: ARDOISE, extra: { backgroundColor: ARDOISE, borderStyle: "solid", borderWidth: "2px", borderColor: ARDOISE } });
    const colR = G.colonne(k, [reserver], { poids: 1, min: "260px", soi: "center" });
    const colH = G.colonne(k, [caps(k, "Horaires", { couleur: VERT_T }), horaires(k, { taille: 16, couleur: ARDOISE2 })], { poids: 1, min: "240px", gap: "12px" });
    const colC = G.colonne(k, [caps(k, "Coordonnées", { couleur: VERT_T }), coordonnees(k, { taille: 16, couleur: ARDOISE2, lien: ARDOISE2, survol: VERT_T, focus: ARDOISE })], { poids: 1, min: "240px", gap: "12px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3b4a50", liens: ARDOISE2 })(k, env);
    const bas = G.bande(k, [k.row([colR, colH, colC], { rowGap: "28px", columnGap: "48px", alignItems: "center", width: "100%" }), trait(k, "#26343f33"), mentions], { fond: SABLE2, colonne: true, gap: "28px", padV: ["44px", "40px", "32px"], padB: ["22px", "20px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Pied" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Coiffure et beauté", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : deux demi-pages de salon, barre d'enseigne de barbier, papier à en-tête d'institut, damier d'onglerie, frise de spa.",
  models: [carnetRdv, enseigneBarbier, soinsEnVitrine, nuancierOnglerie, tempsDuRituel],
};
