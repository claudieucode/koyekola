// Famille v2 « Transport et déménagement » — 5 modèles (ft2-151 à ft2-155), extension « carrée » : angles droits partout, sites standard et très professionnels, animations fluides.
// Pieds de sites ordinaires : transporteur routier, déménageur, taxi / VTC, coursier, gestionnaire de flotte. Esprit signalétique routière sobre : panneaux, bandes, plaques numérotées, zone de service.
// Contenu utile (contact, horaires, zone de service, liens, lettre d'information, mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre inventé (numéros de plaque = simple numérotation 1 à 4,
// horaires, téléphone et adresse viennent des « Données de l'entreprise » ; la zone de service est un texte générique à préciser dans l'éditeur).
// Les adresses de réseaux sociaux sont des EXEMPLES (page d'accueil du réseau) à remplacer dans l'éditeur. Chaque modèle a sa palette, ses polices (2 au plus) et sa composition (mode « solo »).
//
// ANGLES DROITS : identité à rayon 0, boutons / champs / cartes à 0 ; widget Horaires SANS « ouvert maintenant » (sa pastille ronde est imposée par la feuille de style partagée, sans partie réglable) ; réseaux en liens texte « Nom ↗ » (aucune icône ronde).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions de survol et de focus de 360 ms (couleur, fond, décalage de 4 à 8 px, soulèvement de 4 à 6 px) ;
//   · « souffle » lent (animation d'attention « pulse ») : repère de la ligne de route, première étape du déménagement, nœud de départ de la tournée, repère d'état de la flotte ;
//   · pas d'animation d'entrée, pas de widget « Défilement continu » (limites connues du moteur).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const FAM = "transport-demenagement";
const DUREE = 360; // ms : transitions douces

// ── Aides LOCALES à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond, couleur) => ({ desktop: { backgroundColor: fond, ...(couleur ? { color: couleur } : {}), gap: "0px" } }); // « couleur » : texte de la ligne légale de la plateforme, ajoutée dans le pied sous la dernière bande
const trait = (k, couleur, epaisseur = "1px", style) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px", ...(style ? { borderStyle: style } : {}) });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: DUREE, borderRadius: "0px", ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
function bouton(k, label, url, o = {}) {
  return lien(k, label, url, { taille: 16, poids: "700", casse: o.casse, suivi: o.suivi || "0.04em", couleur: o.texte, h: "52px", padH: "26px", police: o.police,
    survol: { backgroundColor: o.survolFond, color: o.survolTexte, borderColor: o.survolFond, transform: { y: -3 } }, focus: o.focus,
    extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center" } });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font }));
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DUREE }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px" });
const reseauxEx = [["LinkedIn", "https://www.linkedin.com/"], ["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"]];
const listeLiens = (k, liste, o = {}) => liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, survol: o.survol, focus: o.focus, bloc: true, police: o.police }));
const abonnement = (k, env, o) => {
  const abo = GK.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "360px", accent: o.accent, texte: o.texte, rayonChamp: "0px", rayonBouton: "0px", soulignement: "3px", survolBouton: o.survolBouton, survolTexte: o.survolTexte })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre, lineHeight: 1.4, fontWeight: "700" };
  abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  if (abo.parts.consent) abo.parts.consent.styles.desktop = { ...abo.parts.consent.styles.desktop, color: o.couleurIntro || o.texte || k.S.fg };
  if (o.couleurIntro) abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro };
  if (o.couleurBouton) abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.couleurBouton };
  return abo;
};
const aplat = (k, couleur, h, o = {}) => k.divider({ width: o.l || "100%", borderColor: couleur, borderTopWidth: h, borderStyle: "solid", borderRightWidth: "0px", borderBottomWidth: "0px", borderLeftWidth: "0px", marginTop: "0px", marginBottom: "0px", flexGrow: o.grow ?? 1, flexBasis: o.base || "0px", flexShrink: o.grow === 0 ? 0 : 1, minWidth: "0px" });
// Bande de cellules alternées (chantier, damier) : ligne pleine largeur sans retour à la ligne
const bandeCellules = (k, a, b, n, h, decalage) => k.row(Array.from({ length: n }, (_, i) => aplat(k, (i + (decalage ? 1 : 0)) % 2 ? b : a, h)), { gap: "0px", flexWrap: "nowrap", alignItems: "stretch", width: "100%" });
const zoneTexte = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.6, color: o.couleur || k.S.mute, fontFamily: k.S.font, maxWidth: o.max || "360px" });
const mentionsDe = (k, env, o = {}) => GK.ligneLegale({ taille: 13, sansCookies: true, couleur: o.couleur, liens: o.liens })(k, env);
const telephone = (k, env, o = {}) => { const n = Moteur.item(k, "phone", env); n.styles.desktop = { ...n.styles.desktop, fontSize: o.taille || "30px", fontWeight: "800", fontFamily: o.police || k.S.head, color: o.couleur || k.S.fg }; n.styles.mobile = { fontSize: o.mobile || "24px" }; return n; };

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-151 « Panneau directionnel » — transporteur routier
// Idée : le panneau de DIRECTION bleu des routes. À gauche, un cartouche blanc cerné d'un filet épais (« Zone de service », « Toutes directions. » en capitales condensées, texte de zone à préciser) ;
// à droite, quatre plaques numérotées 1 à 4 (carrés blancs à chiffre bleu) devant les liens utiles : au survol la ligne avance de 6 px et la plaque s'éclaircit. Sous le panneau, une LIGNE DE ROUTE en pointillés
// blancs avec un repère carré qui respire, puis la bande bleu foncé (horaires, contact, lettre, réseaux, mentions). Polices : Barlow Condensed (titres) et Barlow (texte). Mobile : cartouche puis plaques en pile.
const panneau = identite({
  key: "c151", label: "Bleu panneau et blanc", humeur: "dark",
  fond: "#0b3f94", texte: "#ffffff", discret: "#d3e1f7", accent: "#a9c8ff", surface: "#0a3680", encre: "#0b3f94", surEncre: "#ffffff",
  police: "font.barlow", titres: "font.barlow-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "2px", ligne: "#ffffff55",
});
const BLEU = "#0b3f94", BLEU2 = "#072c6a", CLAIR = "#a9c8ff";

const panneauDirectionnel = modeleV2({
  id: identifiantV2(151, "panneau-directionnel"), concept: "c-151-panneau-directionnel",
  name: "Panneau directionnel", family: FAM,
  description: "Pour un transporteur routier : cartouche blanc « Zone de service » façon panneau de direction, quatre plaques numérotées vers les pages utiles, ligne de route en pointillés puis bande bleu foncé (horaires, contact, lettre).",
  tags: ["transporteur", "transport routier", "signalétique", "bleu", "plaques numérotées", "zone de service", "angles droits"],
  identity: panneau,
  racine: racineDe(BLEU2),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · le cartouche du panneau (filet blanc épais)
    const phrase = G.geant(`<p>Toutes<br>directions.</p>`, { taille: [44, 96], tablette: { taille: [52, 72] }, mobile: { taille: [44, 60] }, lh: 0.98, suivi: "0em", poids: "800", police: S.head, couleur: "#ffffff", extra: { textTransform: "uppercase" } })(k, env);
    const zone = zoneTexte(k, "Transport de marchandises, groupage et lots complets. Précisez ici votre zone de service : départements, pays ou régions desservis.", { couleur: "#d3e1f7", max: "420px" });
    const cartouche = G.colonne(k, [caps(k, "Zone de service", { couleur: CLAIR }), phrase, zone], { poids: 7, min: "300px", gap: "16px", extra: { borderStyle: "solid", borderWidth: "4px", borderColor: "#ffffff", paddingTop: "36px", paddingBottom: "40px", paddingLeft: "36px", paddingRight: "36px" }, mobile: { paddingTop: "24px", paddingBottom: "28px", paddingLeft: "20px", paddingRight: "20px" } });
    // 2 · quatre plaques numérotées (liens utiles)
    const plaque = (n, label, url) => {
      const nb = k.T(`<p>${n}</p>`, { fontFamily: S.head, fontSize: "26px", fontWeight: "800", color: BLEU, lineHeight: 1, textAlign: "center" });
      const chiffre = k.col([nb], { backgroundColor: "#ffffff", width: "44px", height: "44px", alignItems: "center", justifyContent: "center", flexShrink: 0, transitionDuration: DUREE, borderRadius: "0px" });
      chiffre.states = { hover: { backgroundColor: CLAIR } };
      const l = lien(k, label, url, { taille: 22, poids: "700", police: S.head, casse: "uppercase", suivi: "0.03em", couleur: "#ffffff", survol: { color: CLAIR }, focus: "#ffffff" });
      const r = k.row([chiffre, l], { gap: "16px", alignItems: "center", flexWrap: "nowrap", width: "100%", paddingTop: "6px", paddingBottom: "6px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#ffffff44", transitionDuration: DUREE });
      r.states = { hover: { transform: { x: 6 } } };
      return r;
    };
    const plaques = G.colonne(k, [plaque("1", "Demander un devis", "/contact"), plaque("2", "Suivre un envoi", "/connexion"), plaque("3", "Questions fréquentes", "/faq"), plaque("4", "Actualités", "/blog")], { poids: 5, min: "290px", gap: "10px", aligne: "stretch", soi: "flex-end" });
    const haut = G.bande(k, [cartouche, plaques], { fond: BLEU, gap: "40px 56px", aligne: "stretch", padV: ["88px", "68px", "44px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], nom: "Panneau" });
    // 3 · ligne de route : pointillés blancs, repère qui respire
    const repere = souffle(aplat(k, "#ffffff", "14px", { l: "14px", grow: 0, base: "14px" }), 3000);
    const route = k.row([repere, trait(k, "#ffffff", "4px", "dashed")], { gap: "16px", alignItems: "center", flexWrap: "nowrap", width: "100%" });
    route.children[1].styles.desktop = { ...route.children[1].styles.desktop, flexGrow: 1, width: "auto" };
    const bandeRoute = G.bande(k, [route], { fond: BLEU, colonne: true, padV: ["8px", "8px", "8px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Route" });
    // 4 · bande bleu foncé
    const colHoraires = bloc(k, "Horaires d'accueil", [horaires(k)], { couleurTitre: CLAIR, poids: 1.1 });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { lien: "#ffffff", survol: CLAIR, focus: "#ffffff" })], { couleurTitre: CLAIR, poids: 1.1 });
    const abo = abonnement(k, env, { titre: "Lettre du transport", intro: "Informations de service et actualités du réseau, de temps en temps.", accent: CLAIR, couleurTitre: CLAIR, couleurBouton: BLEU2, survolBouton: "#ffffff", survolTexte: BLEU2 });
    const colLettre = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [colHoraires, colContact, colLettre], { gap: "40px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const reseaux = G.reseauxTexte(reseauxEx, { survol: CLAIR, focus: "#ffffff", taille: 14 })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff44"), k.row([reseaux], { width: "100%" }), mentionsDe(k, env)], { colonne: true, gap: "32px", fond: BLEU2, padV: ["64px", "52px", "44px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Service" });
    return [G.racine(k, [haut, bandeRoute, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-152 « Bande de chargement » — déménageur
// Idée : le CARTON et son ruban. Fond carton, encre brune, ruban adhésif rouge. Une bande de chantier (cellules alternées rouge et carton) coiffe le pied ; une phrase condensée « Votre déménagement, étape par étape. »,
// puis trois cartons à ruban rouge : « 1 Devis », « 2 Emballage », « 3 Livraison » ; au survol le carton se soulève de 6 px et la flèche → glisse ; le premier respire. Sous les cartons, bande brun foncé :
// zone de service, horaires, contact, lettre. Les trois cartons pointent vers des pages du site (intitulés d'exemple à renommer). Polices : Anton (titres, capitales) et Archivo (texte). Mobile : cartons en pile.
const carton = identite({
  key: "c152", label: "Carton, brun et ruban rouge", humeur: "light",
  fond: "#d6a96c", texte: "#26170a", discret: "#4a3016", accent: "#a3180f", surface: "#c99a5b", encre: "#26170a", surEncre: "#ffffff",
  police: "font.archivo", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#26170a55",
});
const CARTON = "#d6a96c", BRUN = "#26170a", RUBAN = "#b3261e", PAPIER = "#f4e4c8";

const bandeChargement = modeleV2({
  id: identifiantV2(152, "bande-de-chargement"), concept: "c-152-bande-de-chargement",
  name: "Bande de chargement", family: FAM,
  description: "Pour un déménageur : bande de chantier rouge et carton, phrase « Votre déménagement, étape par étape », trois cartons à ruban (devis, emballage, livraison) qui se soulèvent au survol, puis bande brune avec zone, horaires et contact.",
  tags: ["déménagement", "déménageur", "carton", "ruban rouge", "étapes", "bande de chantier", "angles droits"],
  identity: carton,
  racine: racineDe(BRUN, PAPIER),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const chantier = G.bande(k, [bandeCellules(k, RUBAN, CARTON, 36, "14px")], { fond: CARTON, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Chantier" });
    const phrase = G.geant(`<p>Votre<br>déménagement,<br>étape par étape.</p>`, { taille: [44, 92], tablette: { taille: [44, 60] }, mobile: { taille: [40, 52] }, lh: 1.12, suivi: "0.01em", poids: "400", police: S.head, couleur: BRUN, extra: { textTransform: "uppercase" } })(k, env);
    const intro = k.T("<p>Visite et devis, emballage, transport, installation : un déménageur qui vous explique chaque étape avant de la faire.</p>", { fontSize: "17px", lineHeight: 1.55, color: BRUN, fontFamily: S.font, maxWidth: "420px" });
    const zone = zoneTexte(k, "Zone de service : à préciser dans l'éditeur (ville, département, région, international).", { couleur: S.mute, max: "420px" });
    const gauche = G.colonne(k, [phrase], { poids: 7, min: "300px" });
    const droite = G.colonne(k, [intro, zone], { poids: 4, min: "280px", gap: "14px", soi: "flex-end" });
    const tete = G.bande(k, [gauche, droite], { fond: CARTON, gap: "32px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Étapes" });
    // trois cartons à ruban
    const etape = (num, titre, sous, url) => {
      const ruban = aplat(k, RUBAN, "14px", { l: "100%", grow: 0, base: "auto" });
      const nombre = k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "20px", color: RUBAN, lineHeight: 1 });
      const n = num === "1" ? k.row([nombre, souffle(aplat(k, RUBAN, "10px", { l: "10px", grow: 0, base: "10px" }), 3200)], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }) : nombre;
      const l = k.LINK(`${titre} →`, url, { fontFamily: S.head, fontSize: "34px", fontWeight: "400", color: BRUN, textDecoration: "none", lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "0.02em", display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: DUREE, borderRadius: "0px" });
      Moteur.finishNode(S, l);
      l.states = { hover: { transform: { x: 6 } }, focus: GK.focus(RUBAN) };
      l.styles.desktop = { ...l.styles.desktop, minHeight: "44px" };
      const s = k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.5, color: BRUN, fontFamily: S.font });
      const corps = k.col([n, l, s], { gap: "10px", paddingTop: "22px", paddingBottom: "28px", paddingLeft: "24px", paddingRight: "24px" });
      const c = k.col([ruban, corps], { backgroundColor: PAPIER, borderStyle: "solid", borderWidth: "3px", borderColor: BRUN, gap: "0px", flexGrow: 1, flexBasis: "0px", minWidth: "200px", minHeight: "190px", transitionDuration: DUREE, borderRadius: "0px" });
      c.states = { hover: { backgroundColor: "#ffffff", transform: { y: -6 } } };
      return c;
    };
    const e1 = etape("1", "Devis", "Visite ou description de votre logement, devis écrit détaillé.", "/contact");
    const e2 = etape("2", "Emballage", "Cartons, protections, démontage : ce qui est fait pour vous, ce qui reste à faire.", "/faq");
    const e3 = etape("3", "Livraison", "Transport, remontage, installation dans le nouveau logement.", "/blog");
    const etapes = G.ligne(k, [e1, e2, e3], { gap: "20px", aligne: "stretch", largeur: "100%" });
    const bandeEtapes = G.bande(k, [etapes], { fond: CARTON, colonne: true, padV: ["16px", "16px", "12px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Cartons" });
    // bande brun foncé
    const colHoraires = bloc(k, "Horaires d'accueil", [horaires(k, { couleur: PAPIER })], { couleurTitre: "#ffcf8a", poids: 1.1 });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { couleur: PAPIER, lien: PAPIER, survol: "#ffcf8a", focus: "#ffcf8a" })], { couleurTitre: "#ffcf8a", poids: 1.1 });
    const colLiens = bloc(k, "Liens utiles", listeLiens(k, [["Conseils de déménagement", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"], ["Contact", "/contact"]], { couleur: PAPIER, survol: { color: "#ffcf8a", transform: { x: 4 } }, focus: "#ffcf8a" }), { couleurTitre: "#ffcf8a", gap: "0px", min: "200px" });
    const abo = abonnement(k, env, { titre: "La lettre du déménagement", intro: "Check-lists et conseils avant le grand jour, de temps en temps.", accent: "#ffcf8a", texte: PAPIER, couleurTitre: "#ffcf8a", couleurIntro: "#e3cfae", couleurBouton: BRUN, survolBouton: "#ffffff", survolTexte: BRUN });
    const colLettre = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [colHoraires, colContact, colLiens, colLettre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const reseaux = G.reseauxTexte(reseauxEx, { couleur: PAPIER, survol: "#ffcf8a", focus: "#ffcf8a", taille: 14 })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#f4e4c833"), k.row([reseaux], { width: "100%" }), mentionsDe(k, env, { couleur: "#e3cfae", liens: PAPIER })], { colonne: true, gap: "32px", fond: BRUN, padV: ["72px", "56px", "48px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Contact" });
    bas.styles.desktop.color = PAPIER; // la ligne légale de la plateforme reprend la couleur de texte de la dernière bande
    return [G.racine(k, [chantier, tete, bandeEtapes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-153 « Station de taxis » — taxi / VTC
// Idée : la STATION. Un damier noir et blanc (deux rangées décalées) coiffe le pied. Deux panneaux : à gauche, sur blanc, « Où allez-vous ? » en lettres lourdes, le numéro de l'entreprise en très grand
// (widget Données de l'entreprise : rien d'inventé) et un bouton noir « Réserver une course » ; à droite, un panneau jaune taxi avec horaires et coordonnées. En dessous, une rangée de liens séparés de filets verticaux,
// réseaux et mentions. Le bouton se soulève, les liens glissent. Polices : Sora (titres 800 et texte). Mobile : panneaux en pile, numéro en 24 px.
const taxi = identite({
  key: "c153", label: "Blanc, noir et jaune taxi", humeur: "light",
  fond: "#ffffff", texte: "#141414", discret: "#515151", accent: "#141414", surface: "#ffc800", encre: "#141414", surEncre: "#ffffff",
  police: "font.sora", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "2px", ligne: "#14141433",
});
const NOIR = "#141414", TAXI = "#ffc800";

const stationDeTaxis = modeleV2({
  id: identifiantV2(153, "station-de-taxis"), concept: "c-153-station-de-taxis",
  name: "Station de taxis", family: FAM,
  description: "Pour un taxi ou un VTC : damier noir et blanc, « Où allez-vous ? » avec numéro en grand et bouton de réservation, panneau jaune taxi (horaires, contact), puis liens séparés de filets, réseaux et mentions.",
  tags: ["taxi", "VTC", "réservation", "damier", "jaune", "noir et blanc", "angles droits"],
  identity: taxi,
  racine: racineDe("#ffffff"),
  widgets: ["text", "link", "bizphone", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const damier = G.bande(k, [k.col([bandeCellules(k, NOIR, "#ffffff", 48, "14px"), bandeCellules(k, NOIR, "#ffffff", 48, "14px", true)], { gap: "0px", width: "100%" })], { fond: "#ffffff", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Damier" });
    // panneau gauche : la question, le numéro, le bouton
    const phrase = G.geant(`<p>Où<br>allez-vous&nbsp;?</p>`, { taille: [48, 108], tablette: { taille: [72, 96] }, mobile: { taille: [48, 64] }, lh: 1.0, suivi: "-0.04em", poids: "800", police: S.head, couleur: NOIR })(k, env);
    const tel = telephone(k, env, { couleur: NOIR });
    const intro = k.T("<p>Réservez votre course par téléphone ou en ligne : gare, aéroport, rendez-vous médical, soirée.</p>", { fontSize: "17px", lineHeight: 1.55, color: NOIR, fontFamily: S.font, maxWidth: "440px" });
    const bt = bouton(k, "Réserver une course", "/contact", { texte: TAXI, fond: NOIR, survolFond: "#3a3a3a", survolTexte: "#ffffff", focus: NOIR });
    const repere = souffle(aplat(k, NOIR, "12px", { l: "12px", grow: 0, base: "12px" }), 3000);
    const etiq = k.row([repere, caps(k, "Taxi et VTC", { couleur: NOIR })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const gauche = G.colonne(k, [etiq, phrase, tel, intro, bt], { poids: 7, min: "300px", gap: "20px" });
    // panneau jaune : horaires et contact
    const jaune = G.colonne(k, [caps(k, "Station", { couleur: NOIR }), bloc(k, "Horaires", [horaires(k, { couleur: NOIR })], { couleurTitre: NOIR }), trait(k, "#14141466", "2px"), bloc(k, "Nous joindre", [coordonnees(k, { couleur: NOIR, lien: NOIR, survol: "#5a4300", focus: NOIR })], { couleurTitre: NOIR })], { poids: 4, min: "280px", gap: "18px", extra: { backgroundColor: TAXI, paddingTop: "36px", paddingBottom: "40px", paddingLeft: "36px", paddingRight: "36px", alignSelf: "stretch" }, mobile: { paddingTop: "24px", paddingBottom: "28px", paddingLeft: "20px", paddingRight: "20px" } });
    const haut = G.bande(k, [gauche, jaune], { fond: "#ffffff", gap: "40px 56px", aligne: "stretch", padV: ["80px", "64px", "40px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Station" });
    // rangée de liens séparés de filets verticaux
    const sep = (i, n) => i < n - 1 ? { borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: "#14141433", paddingRight: "22px", marginRight: "22px" } : {};
    const LIENS = [["Tarifs et devis", "/contact"], ["Espace client", "/connexion"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]];
    const rangee = G.ligne(k, LIENS.map(([t, u], i) => lien(k, t, u, { taille: 16, poids: "700", couleur: NOIR, survol: { color: "#5a4300", transform: { y: -2 } }, focus: NOIR, extra: sep(i, LIENS.length) })), { gap: "4px 0px", aligne: "center", largeur: "100%" });
    const abo = abonnement(k, env, { titre: "La lettre de la station", intro: "Tarifs de saison, informations de service : un message de temps en temps.", accent: NOIR, couleurTitre: NOIR, couleurBouton: TAXI, survolBouton: "#3a3a3a", survolTexte: "#ffffff", largeur: "420px" });
    const reseaux = G.reseauxTexte(reseauxEx, { couleur: NOIR, survol: "#5a4300", focus: NOIR, taille: 14 })(k, env);
    const bas = G.bande(k, [trait(k, NOIR, "2px"), rangee, k.row([abo, reseaux], { width: "100%", justifyContent: "space-between", alignItems: "flex-end", rowGap: "20px", columnGap: "40px" }), mentionsDe(k, env, { couleur: S.mute, liens: NOIR })], { colonne: true, gap: "28px", fond: "#ffffff", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "24px" }, nom: "Liens" });
    return [G.racine(k, [damier, haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-154 « Tournée du jour » — coursier / livraison express
// Idée : le TRAJET. Orange vif franc et noir. Le mot « Livré. » en lettres géantes, puis un parcours en trois nœuds carrés reliés par un trait épais : « Collecte », « Transit », « Livraison » (liens vers les pages du site,
// intitulés d'exemple) ; le nœud de départ respire, chaque étape se soulève de 4 px au survol. Dessous, une bande noire : zone de service, horaires, contact, lettre. Aucune promesse de délai ni de prix.
// Polices : Lexend (titres 800 et texte). Mobile : phrase, étapes en pile (trait masqué), colonnes en pile.
const coursier = identite({
  key: "c154", label: "Orange franc et noir", humeur: "light",
  fond: "#ff5a1f", texte: "#0d0d0d", discret: "#2b1608", accent: "#0d0d0d", surface: "#e84e14", encre: "#0d0d0d", surEncre: "#ffffff",
  police: "font.lexend", titres: "font.lexend",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "2px", ligne: "#0d0d0d55",
});
const ORANGE = "#ff5a1f", NOIR2 = "#0d0d0d";

const tourneeDuJour = modeleV2({
  id: identifiantV2(154, "tournee-du-jour"), concept: "c-154-tournee-du-jour",
  name: "Tournée du jour", family: FAM,
  description: "Pour un coursier ou une livraison express : mot « Livré. » géant sur orange franc, parcours en trois nœuds carrés (collecte, transit, livraison) dont le premier respire, puis bande noire avec zone, horaires et contact.",
  tags: ["coursier", "livraison", "express", "orange", "noir", "parcours", "angles droits"],
  identity: coursier,
  racine: racineDe(NOIR2, "#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Livré.</p>`, { taille: [72, 180], tablette: { taille: [120, 160] }, mobile: { taille: [72, 110] }, lh: 0.95, suivi: "-0.05em", poids: "800", police: S.head, couleur: NOIR2 })(k, env);
    const intro = k.T("<p>Du point A au point B, sans détour : plis, colis, matériel. Dites-nous quoi, où et pour quand.</p>", { fontSize: "18px", lineHeight: 1.5, color: NOIR2, fontFamily: S.font, maxWidth: "400px", fontWeight: "500" });
    const bt = bouton(k, "Demander une course", "/contact", { texte: ORANGE, fond: NOIR2, survolFond: "#ffffff", survolTexte: NOIR2, focus: NOIR2 });
    const gauche = G.colonne(k, [caps(k, "Coursier · livraison express", { couleur: NOIR2 }), phrase], { poids: 7, min: "300px", gap: "10px" });
    const droite = G.colonne(k, [intro, bt], { poids: 4, min: "280px", gap: "22px", soi: "flex-end" });
    const haut = G.ligne(k, [gauche, droite], { gap: "32px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // parcours : trois nœuds carrés reliés
    const etape = (i, titre, sous, url, dernier) => {
      const noeud = aplat(k, NOIR2, "28px", { l: "28px", grow: 0, base: "28px" });
      if (i === 0) souffle(noeud, 3000);
      const trace = dernier ? null : aplat(k, NOIR2, "6px", { grow: 1 });
      const tete = k.row(trace ? [noeud, trace] : [noeud], { gap: "0px", alignItems: "center", flexWrap: "nowrap", width: "100%" });
      const l = lien(k, titre, url, { taille: 22, poids: "800", couleur: NOIR2, survol: { color: NOIR2, transform: { x: 4 } }, focus: NOIR2, extra: { textDecoration: "underline" } });
      const s = k.T(`<p>${sous}</p>`, { fontSize: "15px", lineHeight: 1.5, color: NOIR2, fontFamily: S.font, maxWidth: "280px" });
      const c = k.col([tete, l, s], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "240px", transitionDuration: DUREE, paddingRight: "16px" });
      c.states = { hover: { transform: { y: -4 } } };
      return c;
    };
    const parcours = G.ligne(k, [etape(0, "Collecte", "Prise en charge à l'adresse de départ.", "/contact"), etape(1, "Transit", "Suivi de votre envoi depuis votre espace.", "/connexion"), etape(2, "Livraison", "Remise en main propre ou dépôt convenu.", "/faq", true)], { gap: "28px 0px", aligne: "flex-start", largeur: "100%" });
    const bandeO = G.bande(k, [haut, parcours], { colonne: true, gap: "56px", fond: ORANGE, padV: ["88px", "68px", "44px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Tournée" });
    // bande noire
    const colZone = bloc(k, "Zone de service", [zoneTexte(k, "À préciser dans l'éditeur : villes, agglomération, départements desservis.", { couleur: "#e7d9d0", max: "260px" })], { couleurTitre: ORANGE });
    const colHoraires = bloc(k, "Horaires", [horaires(k, { couleur: "#ffffff" })], { couleurTitre: ORANGE, poids: 1.1 });
    const colContact = bloc(k, "Nous joindre", [coordonnees(k, { couleur: "#ffffff", lien: "#ffffff", survol: ORANGE, focus: ORANGE })], { couleurTitre: ORANGE, poids: 1.1 });
    const abo = abonnement(k, env, { titre: "La lettre du coursier", intro: "Nouveautés de service et jours fériés : un message de temps en temps.", accent: ORANGE, texte: "#ffffff", couleurTitre: ORANGE, couleurIntro: "#e7d9d0", couleurBouton: NOIR2, survolBouton: "#ffffff", survolTexte: NOIR2 });
    const colLettre = G.colonne(k, [abo], { poids: 1.5, min: "260px" });
    const grille = G.ligne(k, [colZone, colHoraires, colContact, colLettre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const reseaux = G.reseauxTexte(reseauxEx, { couleur: "#ffffff", survol: ORANGE, focus: ORANGE, taille: 14 })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#ffffff33"), k.row([reseaux], { width: "100%" }), mentionsDe(k, env, { couleur: "#d8cbc2", liens: "#ffffff" })], { colonne: true, gap: "32px", fond: NOIR2, padV: ["72px", "56px", "48px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Service" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [bandeO, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-155 « Poste de contrôle » — gestionnaire de flotte / logistique de véhicules
// Idée : un TABLEAU DE BORD. Graphite, vert signal, libellés en monospace. Grille de cases cernées de filets fins : une grande case (« Votre flotte, sous contrôle. »), l'horaire avec un repère carré vert qui respire
// (simple repère décoratif de tableau de bord), puis trois cases (zone de service, contact, ressources) et la lettre. Chaque case s'éclaircit doucement au survol. Aucun chiffre de flotte inventé.
// Polices : Titillium Web (titres 700) et JetBrains Mono (libellés, texte). Mobile : cases en pile.
const flotte = identite({
  key: "c155", label: "Graphite et vert signal", humeur: "dark",
  fond: "#1f2429", texte: "#eef2ef", discret: "#b4bfb9", accent: "#35d884", surface: "#2a3037", encre: "#0f1a14", surEncre: "#eef2ef",
  police: "font.jetbrains-mono", titres: "font.titillium-web",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#eef2ef33",
});
const GRAPHITE = "#1f2429", GRAPHITE2 = "#2a3037", SIGNAL = "#35d884";

const posteDeControle = modeleV2({
  id: identifiantV2(155, "poste-de-controle"), concept: "c-155-poste-de-controle",
  name: "Poste de contrôle", family: FAM,
  description: "Pour un gestionnaire de flotte : tableau de bord graphite et vert signal, grille de cases à filets fins (phrase, horaires avec repère qui respire, zone, contact, ressources, lettre) qui s'éclaircissent au survol.",
  tags: ["flotte", "logistique", "tableau de bord", "graphite", "vert signal", "monospace", "angles droits"],
  identity: flotte,
  racine: racineDe(GRAPHITE),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, FIL = "#eef2ef33";
    const caseDe = (base, enfants, o = {}) => {
      const c = k.col(enfants, { gap: "14px", flexGrow: 1, flexBasis: base, minWidth: o.min || "260px", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "28px", paddingRight: "28px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderBottomWidth: "1px", borderColor: FIL, backgroundColor: GRAPHITE, transitionDuration: 400, alignItems: "flex-start", borderRadius: "0px" });
      c.states = { hover: { backgroundColor: GRAPHITE2 } };
      return c;
    };
    const etiquette = (t, repere) => { const m = caps(k, t, { couleur: SIGNAL, taille: "12px", suivi: "0.12em" }); if (!repere) return m; const r = souffle(aplat(k, SIGNAL, "12px", { l: "12px", grow: 0, base: "12px" }), 2800); return k.row([r, m], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }); };
    // grande case : la phrase
    const phrase = G.geant(`<p>Votre flotte,<br>sous <span style="color:${SIGNAL}">contrôle.</span></p>`, { taille: [36, 76], tablette: { taille: [52, 68] }, mobile: { taille: [36, 48] }, lh: 1.04, suivi: "-0.02em", poids: "700", police: S.head, couleur: S.fg })(k, env);
    const intro = k.T("<p>Entretien, mise à disposition, suivi des véhicules : un interlocuteur dédié et des échanges tracés.</p>", { fontSize: "14px", lineHeight: 1.65, color: S.mute, fontFamily: S.font, maxWidth: "440px" });
    const bt = bouton(k, "Parler à un conseiller", "/contact", { texte: "#0f1a14", fond: SIGNAL, survolFond: "#ffffff", survolTexte: "#0f1a14", focus: "#ffffff", police: S.font, casse: "uppercase", suivi: "0.06em" });
    const grande = caseDe("66%", [etiquette("Flotte et transport"), phrase, intro, bt], { min: "300px" });
    const cHoraires = caseDe("34%", [etiquette("Horaires", true), horaires(k, { taille: 14 })]);
    const rangeeA = k.row([grande, cHoraires], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderLeftWidth: "1px", borderColor: FIL });
    const cZone = caseDe("33%", [etiquette("Zone de service"), zoneTexte(k, "À préciser dans l'éditeur : villes, régions ou pays desservis.", { couleur: S.mute, max: "300px" }), lien(k, "Demander un devis ↗", "/contact", { taille: 14, poids: "700", couleur: S.fg, survol: { color: SIGNAL, transform: { x: 4 } }, focus: SIGNAL })]);
    const cContact = caseDe("33%", [etiquette("Contact"), coordonnees(k, { taille: 14, lien: S.fg, survol: SIGNAL, focus: SIGNAL })]);
    const cRes = caseDe("33%", [etiquette("Ressources"), ...listeLiens(k, [["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]], { taille: 15, survol: { color: SIGNAL, transform: { x: 4 } }, focus: SIGNAL })]);
    const rangeeB = k.row([cZone, cContact, cRes], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: FIL });
    const abo = abonnement(k, env, { titre: "", intro: "Actualités de service et nouvelles offres, de temps en temps.", accent: SIGNAL, couleurBouton: "#0f1a14", survolBouton: "#ffffff", survolTexte: "#0f1a14", largeur: "420px" });
    const cLettre = caseDe("100%", [etiquette("Lettre d'information"), abo]);
    const rangeeC = k.row([cLettre], { gap: "0px", alignItems: "stretch", width: "100%", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: FIL });
    const tableau = G.bande(k, [k.col([rangeeA, rangeeB, rangeeC], { gap: "0px", width: "100%" })], { fond: GRAPHITE, colonne: true, padV: ["64px", "48px", "32px"], padB: ["8px", "8px", "8px"], padH: ["48px", "32px", "20px"], nom: "Tableau" });
    const reseaux = G.reseauxTexte(reseauxEx, { survol: SIGNAL, focus: SIGNAL, taille: 13 })(k, env);
    const bas = G.bande(k, [k.row([reseaux], { width: "100%" }), mentionsDe(k, env)], { colonne: true, gap: "24px", fond: GRAPHITE, padV: ["32px", "28px", "24px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [tableau, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Transport et déménagement", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : transport et déménagement.",
  models: [panneauDirectionnel, bandeChargement, stationDeTaxis, tourneeDuJour, posteDeControle],
};
