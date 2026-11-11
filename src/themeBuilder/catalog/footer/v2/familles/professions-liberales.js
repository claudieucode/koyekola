// Famille v2 « Professions libérales » — 5 modèles (ft2-116 à ft2-120), extension « sites du quotidien » : pieds de cabinets et d'indépendants.
// Avocat, expert-comptable, kinésithérapeute, consultant indépendant, notaire : cinq univers graphiques volontairement éloignés (bordeaux et laiton / papier sauge et vermillon / sable et terre cuite /
// graphite et citron vert / pierre et vert-de-gris), cinq compositions différentes. Contenu utile réel : prise de rendez-vous, domaines d'intervention, horaires, coordonnées, mentions légales, réseaux.
// HONNÊTETÉ : marques fictives ; aucune adresse, aucun téléphone, aucun horaire, aucun tarif, aucun chiffre inventé. Les coordonnées et les horaires viennent des « Données de l'entreprise »
// (widgets bizcontact, bizphone, bizhours : invisibles tant qu'ils ne sont pas remplis). Les adresses de réseaux sont des EXEMPLES (page d'accueil du réseau) à remplacer dans l'éditeur ; les liens du pied
// pointent vers des pages de la plateforme (/contact /faq /blog /connexion) : jamais de lien mort.
// MOUVEMENT (tout disparaît en « mouvement réduit », vérifié : 0 animation / transition) :
//   · transitions de survol et de focus (couleur, fond, glissement de 4 à 10 px, 160 ms) sur chaque lien ;
//   · apparition « au défilement » (scrollFx : translateY qui se résorbe, piloté par le défilement, JavaScript coupé par la préférence « mouvement réduit », jamais de CSS animé) ;
//   · mouvements continus discrets : halo qui respire (animation d'attention « pulse », 5 s, coupée en mouvement réduit), ruban de domaines qui glisse de côté au défilement, sceau qui suit le pointeur.
// Limite du moteur contournée : les animations d'ENTRÉE (fondu…) rejouent un fondu de 300 ms en mouvement réduit, ce qui violerait la règle « 0 animation » : on n'en pose aucune, on utilise scrollFx et « pulse » (réduit = aucune).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "professions-liberales";

// ── Aides LOCALES ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
// Lien de texte fini par le moteur (états, 44 px mobile) puis états propres (survol : styles, focus : contour 2 px)
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
// Titre de widget (Horaires, Coordonnées) : petit libellé en capitales
const titreWidget = (w, couleur, texte) => { if (texte) w.props.title = texte; Moteur.mergePart(w, "title", { styles: { desktop: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.14em", color: couleur, marginBottom: "8px" } } }); return w; };
const heures = (k, o = {}) => titreWidget(Moteur.finishNode(k.S, k.W("bizhours", { title: "Horaires", showOpenNow: o.ouvert !== false, groupDays: true, showExceptions: false, showNote: false, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: "15px", fontFamily: k.S.font, lineHeight: 1.5 })), o.titre || k.S.mute);
const coordonnees = (k, o = {}) => titreWidget(Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: "15px", fontFamily: k.S.font, lineHeight: 1.5 })), o.titre || k.S.mute, o.sansTitre ? "" : "Coordonnées");
// Mouvement « apparition au défilement » : l'élément remonte de `de` px vers sa place pendant qu'il entre dans la fenêtre (piloté par le défilement ; coupé en mouvement réduit)
const monte = (n, de = 32, fin = 40) => { n.motion = { scrollFx: { translateY: { from: de, to: 0 }, end: fin } }; return n; };
const colRep = (k, G, enfants, o = {}) => G.colonne(k, enfants, { poids: o.poids || 1, min: o.min || "220px", gap: o.gap || "10px", extra: o.extra, mobile: o.mobile, tablette: o.tablette, aligne: o.aligne });
const reseauxEx = (G, k, env, liste, o) => G.reseauxTexte(liste.map((n) => [n, `https://www.${n.toLowerCase()}.com/`]), o)(k, env);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-116 « Cabinet bordeaux » — avocat. « Cabinet Valmont » (fictif). Bordeaux profond, ivoire, laiton. Le geste : le nom du cabinet en grande serif, face à un index numéroté des domaines
// d'intervention ; au survol (et au clavier), la ligne glisse de 10 px et passe au laiton. Cormorant Garamond (titres) + Source Sans 3. Déontologie : note et lien vers les mentions.
// Les 5 domaines sont des intitulés génériques (aucune promesse de résultat, aucune spécialité revendiquée) : à adapter dans l'éditeur.
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const bordeaux = identite({
  key: "c116", label: "Bordeaux, ivoire et laiton", humeur: "dark",
  fond: "#3a0f19", texte: "#f7f0e4", discret: "#dccbbb", accent: "#d8b26e", surface: "#4a1822",
  police: "font.source-sans-3", titres: "font.cormorant-garamond",
  rayon: "2px", rayonBouton: "2px", ombre: "none", poids: "600", bordure: "1px", ligne: "#d8b26e55",
});

const cabinetBordeaux = modeleV2({
  id: identifiantV2(116, "cabinet-bordeaux"), concept: "c-116-cabinet-bordeaux",
  name: "Cabinet bordeaux", family: FAM,
  description: "Pied de cabinet d'avocat : le nom en grande serif sur bordeaux, un index numéroté des domaines d'intervention qui glisse au survol, un bouton de rendez-vous laiton, coordonnées, horaires et lien vers la déontologie.",
  tags: ["avocat", "cabinet", "bordeaux", "laiton", "serif", "domaines d'intervention", "rendez-vous"],
  identity: bordeaux,
  racine: racineDe("#3a0f19"),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, LAITON = S.accent;
    // 1 · à gauche : le nom, une phrase, le bouton de rendez-vous
    const nom = G.geant("<p>Cabinet<br>Valmont</p>", { taille: [60, 150], tablette: { taille: [84, 120] }, lh: 0.95, suivi: "-0.015em", poids: "500", police: S.head, couleur: S.fg })(k, env);
    monte(nom, 40, 45);
    const filet = G.filet({ largeur: "64px", epaisseur: "2px" })(k, env);
    const phrase = G.phrase("Avocats : écouter, conseiller, défendre. Chaque dossier commence par un premier rendez-vous.", { taille: 17, largeur: "440px", couleur: S.mute, lh: 1.6 })(k, env);
    const rdv = GK.fini(k, k.LINK("Prendre rendez-vous", "/contact", { fontFamily: S.font, fontSize: "16px", fontWeight: "700", letterSpacing: "0.04em", color: "#3a0f19", backgroundColor: LAITON, textDecoration: "none", borderRadius: "2px", minHeight: "52px", display: "inline-flex", alignItems: "center", paddingLeft: "30px", paddingRight: "30px", transitionDuration: GK.MOUVEMENT, borderStyle: "solid", borderWidth: "1.5px", borderColor: LAITON }),
      { hover: { backgroundColor: "transparent", color: LAITON, transform: { y: -2 } }, focus: GK.focus(S.fg) });
    const gauche = colRep(k, G, [filet, nom, phrase, rdv], { poids: 6, min: "300px", gap: "24px" });
    // 2 · à droite : l'index des domaines d'intervention (5 lignes numérotées ; chaque ligne est un lien)
    const domaines = ["Droit de la famille", "Droit pénal", "Droit des affaires", "Droit du travail", "Droit immobilier"];
    const ligneDomaine = (i, t) => monte(lien(k, `${["I", "II", "III", "IV", "V"][i]}.   ${t}`, "/contact", { taille: 22, poids: "500", police: S.head, h: "56px", lh: 1.2, suivi: "0.01em",
      survol: { color: LAITON, transform: { x: 10 }, textDecoration: "none" }, focus: LAITON,
      extra: { width: "100%", display: "flex", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line, whiteSpace: "pre-wrap" } }), 18 + i * 8, 55);
    const index = G.colonne(k, [caps(k, "Domaines d'intervention", { couleur: LAITON, extra: { marginBottom: "6px" } }), ...domaines.map((t, i) => ligneDomaine(i, t))], { poids: 5, min: "300px", gap: "0px", aligne: "stretch", extra: { alignSelf: "flex-end" } });
    const haut = G.ligne(k, [gauche, index], { gap: "48px 72px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 3 · trois colonnes utiles : coordonnées, horaires, informations (jamais de lien mort)
    const sv = { color: LAITON, transform: { x: 4 }, textDecoration: "none" };
    const info = colRep(k, G, [caps(k, "Informations", { couleur: S.mute }), lien(k, "Questions fréquentes", "/faq", { survol: sv }), lien(k, "Actualités du droit", "/blog", { survol: sv }), lien(k, "Espace client", "/connexion", { survol: sv })], { gap: "0px" });
    const bas = G.ligne(k, [colRep(k, G, [coordonnees(k, { titre: S.mute })], { min: "240px" }), colRep(k, G, [heures(k, { titre: S.mute })], { min: "240px" }), info], { gap: "36px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const note = k.T("<p>Les informations de ce site ont une portée générale et ne remplacent pas une consultation. Le secret professionnel et la déontologie de la profession s'appliquent à chaque échange avec le cabinet.</p>", { fontSize: "13px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "760px" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, trait(k, S.line), bas, note, mentions], { colonne: true, gap: "44px", max: "1240px", padV: ["104px", "80px", "60px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, degrade: { from: "#4a1822", to: "#3a0f19", angle: 180 }, nom: "Cabinet" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-117 « Grand livre » — expert-comptable. « Cabinet Équilibre » (fictif). Papier vert d'eau, encre forêt, vermillon. Le geste : une phrase en grande sans-serif, puis le GRAND LIVRE des missions :
// des lignes à points de conduite (filet pointillé) dont le fond se remplit au survol ; la ligne glisse de 6 px. Archivo (titres ; Bricolage Grotesque, non reconnue comme chargée par le test navigateur, écartée) + Public Sans.
// Les missions sont des intitulés génériques ; aucune échéance, aucun tarif, aucun chiffre.
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const papierSauge = identite({
  key: "c117", label: "Papier vert d'eau et vermillon", humeur: "light",
  fond: "#eef1e6", texte: "#17261c", discret: "#445648", accent: "#b23a20", surface: "#ffffff",
  police: "font.public-sans", titres: "font.archivo",
  rayon: "10px", rayonBouton: "8px", ombre: "none", poids: "700", bordure: "1px", ligne: "#17261c33",
});

const grandLivre = modeleV2({
  id: identifiantV2(117, "grand-livre"), concept: "c-117-grand-livre",
  name: "Grand livre", family: FAM,
  description: "Pied d'expert-comptable : papier vert d'eau, une phrase nette et le grand livre des missions en lignes pointillées qui se remplissent au survol. Rendez-vous, horaires, coordonnées et espace client.",
  tags: ["expert-comptable", "comptabilité", "papier", "vert d'eau", "vermillon", "missions", "grand livre"],
  identity: papierSauge,
  racine: racineDe("#eef1e6"),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENCRE = S.fg, VERMILLON = S.accent, REMPLI = "#dfe6cf";
    // 1 · l'en-tête : libellé, phrase, carte de rendez-vous
    const phrase = G.geant(`<p>Vos comptes,<br><span style="color:${VERMILLON}">en clair.</span></p>`, { taille: [52, 112], tablette: { taille: [76, 100] }, lh: 0.98, suivi: "-0.03em", poids: "800", police: S.head, couleur: ENCRE })(k, env);
    monte(phrase, 36, 45);
    const entete = colRep(k, G, [caps(k, "Cabinet d'expertise comptable", { couleur: S.mute }), phrase], { poids: 7, min: "300px", gap: "18px" });
    const rdv = GK.fini(k, k.LINK("Prendre rendez-vous", "/contact", { fontFamily: S.font, fontSize: "16px", fontWeight: "700", color: "#ffffff", backgroundColor: VERMILLON, textDecoration: "none", borderRadius: "8px", minHeight: "52px", display: "inline-flex", alignItems: "center", paddingLeft: "28px", paddingRight: "28px", transitionDuration: GK.MOUVEMENT }),
      { hover: { backgroundColor: ENCRE, color: "#ffffff", transform: { y: -2 } }, focus: GK.focus(ENCRE) });
    const carte = k.card([caps(k, "Un premier échange", { couleur: VERMILLON }), k.T("<p>Parlez-nous de votre activité : nous regardons ensemble ce qu'il faut tenir, déclarer et anticiper.</p>", { fontSize: "16px", lineHeight: 1.55, color: ENCRE, fontFamily: S.font }), rdv],
      { backgroundColor: S.surface, borderRadius: "14px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", gap: "16px", alignItems: "flex-start", borderStyle: "solid", borderWidth: "1px", borderColor: S.line });
    const droite = G.colonne(k, [carte], { poids: 4, min: "290px", extra: { alignSelf: "flex-end" } });
    const haut = G.ligne(k, [entete, droite], { gap: "40px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 2 · le grand livre : deux colonnes de lignes pointillées ; chaque ligne = numéro + mission (le lien est toute la ligne)
    const missions = ["Tenue de la comptabilité", "Bilan et comptes annuels", "Déclarations fiscales", "Paie et social", "Création d'entreprise", "Conseil et prévisionnel"];
    const ligneLivre = (i, t) => monte(lien(k, `${String(i + 1).padStart(2, "0")}  ·  ${t}  →`, "/contact", { taille: 20, poids: "600", police: S.head, h: "58px", lh: 1.2, padH: "6px", survol: { backgroundColor: REMPLI, color: VERMILLON, transform: { x: 6 }, textDecoration: "none" }, focus: ENCRE,
      extra: { width: "100%", display: "flex", whiteSpace: "pre-wrap", borderStyle: "dotted", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#17261c88", boxSizing: "border-box" } }), 14 + (i % 3) * 10, 60);
    const livre = G.ligne(k, [
      G.colonne(k, missions.slice(0, 3).map((t, i) => ligneLivre(i, t)), { poids: 1, min: "300px", gap: "0px", aligne: "stretch" }),
      G.colonne(k, missions.slice(3).map((t, i) => ligneLivre(i + 3, t)), { poids: 1, min: "300px", gap: "0px", aligne: "stretch" }),
    ], { gap: "0px 64px", aligne: "flex-start", largeur: "100%" });
    const livreBloc = k.col([caps(k, "Nos missions", { couleur: VERMILLON }), livre], { gap: "14px", width: "100%" });
    // 3 · pratique : coordonnées, horaires, accès
    const sv = { color: VERMILLON, transform: { x: 4 }, textDecoration: "none" };
    const acces = colRep(k, G, [caps(k, "Accès", { couleur: S.mute }), lien(k, "Espace client", "/connexion", { survol: sv }), lien(k, "Questions fréquentes", "/faq", { survol: sv }), lien(k, "Actualités fiscales", "/blog", { survol: sv })], { gap: "0px" });
    const pratique = G.ligne(k, [colRep(k, G, [coordonnees(k)], { min: "240px" }), colRep(k, G, [heures(k)], { min: "240px" }), acces], { gap: "32px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, livreBloc, trait(k, S.line), pratique, mentions], { colonne: true, gap: "48px", max: "1240px", padV: ["96px", "72px", "56px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, nom: "Grand livre" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-118 « Souffle du cabinet » — kinésithérapeute / cabinet médical. « Cabinet Rivage » (fictif). Sable, terre cuite, formes rondes. Le geste : un HALO qui respire (cercles concentriques ;
// animation « pulse » de 5 s, immobile en mouvement réduit) à côté d'une carte d'horaires avec « ouvert maintenant ». Motifs de consultation en pilules. Rappel d'urgence (15) : information publique.
// DM Serif Text (titres) + Nunito. Aucun créneau ni délai d'attente affiché (il faudrait un vrai agenda).
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const sable = identite({
  key: "c118", label: "Sable et terre cuite", humeur: "light",
  fond: "#f7ece0", texte: "#2d2320", discret: "#68503f", accent: "#a5421d", surface: "#fffaf3",
  police: "font.nunito", titres: "font.dm-serif-text",
  rayon: "26px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2d232033",
});

const souffleCabinet = modeleV2({
  id: identifiantV2(118, "souffle-du-cabinet"), concept: "c-118-souffle-du-cabinet",
  name: "Souffle du cabinet", family: FAM,
  description: "Pied de kinésithérapeute ou de cabinet médical : sable chaud et terre cuite, un halo qui respire doucement, une carte d'horaires avec « ouvert maintenant », des motifs de consultation en pilules et un rappel d'urgence.",
  tags: ["kinésithérapeute", "cabinet médical", "santé", "sable", "terre cuite", "halo", "horaires", "arrondi"],
  identity: sable,
  racine: racineDe("#f7ece0"),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, TERRE = S.accent;
    // 1 · le halo : trois cercles concentriques ; le cercle intermédiaire « respire » (pulse infini 5 s, coupé en mouvement réduit)
    const rond = (t, st, enfants = []) => ({ type: "container", children: enfants, ...sty({ width: t, height: t, minWidth: t, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box", ...st }) });
    const coeur = rond("92px", { backgroundColor: TERRE });
    const anneau = rond("150px", { backgroundColor: "#ecd2bb" }, [coeur]);
    anneau.motion = { entrance: "pulse", duration: 5000, iterations: "infinite", easing: "ease-in-out" };
    const grand = rond("216px", { backgroundColor: "#f1ddc9" }, [anneau]);
    const halo = grand; // (pas de conteneur de plus : le moteur limite l'imbrication à 8 niveaux)
    // 2 · le mot, la phrase, le bouton
    const mot = G.geant("<p>Bouger<br>sans douleur.</p>", { taille: [44, 96], tablette: { taille: [64, 84] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    monte(mot, 30, 45);
    const phrase = G.phrase("Un cabinet à taille humaine : bilan, rééducation, conseils pour la maison. Prenez rendez-vous, nous trouvons ensemble le bon rythme.", { taille: 17, largeur: "460px", couleur: S.mute, lh: 1.6 })(k, env);
    const rdv = GK.fini(k, k.LINK("Prendre rendez-vous", "/contact", { fontFamily: S.font, fontSize: "17px", fontWeight: "800", color: "#ffffff", backgroundColor: TERRE, textDecoration: "none", borderRadius: "999px", minHeight: "56px", display: "inline-flex", alignItems: "center", paddingLeft: "34px", paddingRight: "34px", transitionDuration: GK.MOUVEMENT }),
      { hover: { backgroundColor: S.fg, transform: { y: -3 } }, focus: GK.focus(S.fg) });
    const texte = k.col([mot, phrase, rdv], { gap: "20px", alignItems: "flex-start", flexGrow: 1, flexBasis: "0px", minWidth: "260px" });
    const colGauche = k.row([halo, texte], { ...GK.gaps("28px 44px"), alignItems: "center", flexWrap: "wrap", flexGrow: 7, flexShrink: 1, flexBasis: "0px", minWidth: "320px" });
    // 3 · colonne pratique : horaires, coordonnées et liens (sans carte ni fond : sans Données de l'entreprise, une carte vide serait une boîte creuse ; la colonne garde toujours ses liens)
    const sv = { color: TERRE, textDecoration: "underline" };
    const liens = k.col([caps(k, "Pour nous suivre", { couleur: TERRE }), lien(k, "Questions fréquentes", "/faq", { survol: sv }), lien(k, "Conseils et actualités", "/blog", { survol: sv }), lien(k, "Espace patient", "/connexion", { survol: sv })], { gap: "0px", alignItems: "flex-start" });
    const colDroite = G.colonne(k, [heures(k, { titre: TERRE }), coordonnees(k, { titre: TERRE }), liens], { poids: 4, min: "300px", gap: "22px", aligne: "flex-start", extra: { paddingLeft: "40px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "2px", borderColor: "#a5421d55" }, mobile: { paddingLeft: "0px", borderLeftWidth: "0px" } });
    const haut = G.ligne(k, [colGauche, colDroite], { gap: "44px 56px", aligne: "center", justifie: "space-between", largeur: "100%" });
    // 4 · motifs de consultation (pilules vers la prise de rendez-vous) et rappel d'urgence
    const motifs = G.pilules([["Rééducation", "/contact"], ["Sport", "/contact"], ["Posture et dos", "/contact"], ["Après opération", "/contact"], ["Respiration", "/contact"]], { contour: "#a5421d66", couleur: S.fg, survolFond: TERRE, survolCouleur: "#ffffff", poids: "700", taille: 15, gap: "10px" })(k, env);
    const urgence = k.T("<p><strong>En cas d'urgence, appelez le 15</strong> (SAMU). Ce site ne permet pas de demande de soins urgents.</p>", { fontSize: "14px", lineHeight: 1.55, color: S.fg, fontFamily: S.font, backgroundColor: "#f0d9c4", borderRadius: "16px", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", maxWidth: "560px" });
    const bloc2 = G.ligne(k, [k.col([caps(k, "Motifs de consultation", { couleur: TERRE }), motifs], { gap: "12px", flexGrow: 1, flexBasis: "0px", minWidth: "300px" }), urgence], { gap: "24px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 5 · mentions
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, bloc2, trait(k, S.line), mentions], { colonne: true, gap: "40px", max: "1200px", padV: ["96px", "72px", "52px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Cabinet" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-119 « Pivot » — consultant indépendant. « Pivot, conseil indépendant » (fictif). Graphite et citron vert. Le geste : un RUBAN de domaines d'accompagnement qui glisse de côté
// quand on défile (immobile en mouvement réduit et sur mobile), puis le nom monumental « PIVOT » rogné en bas, qui MONTE dans son cadre au défilement. Space Grotesk (titres) + Hanken Grotesk.
// Aucun chiffre de références, aucune promesse. Réseaux en noms suivis d'une flèche (adresses d'exemple).
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const graphite = identite({
  key: "c119", label: "Graphite et citron vert", humeur: "dark",
  fond: "#121416", texte: "#f3f4ee", discret: "#b9bdb2", accent: "#cdee6a", surface: "#1c1f22",
  police: "font.hanken-grotesk", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f3f4ee33",
});

const pivot = modeleV2({
  id: identifiantV2(119, "pivot-conseil"), concept: "c-119-pivot-conseil",
  name: "Pivot conseil", family: FAM,
  description: "Pied de consultant indépendant : un ruban de domaines d'accompagnement qui glisse au défilement, un nom monumental rogné qui monte au défilement, une invitation franche à échanger, liens utiles et réseaux. Graphite et citron vert.",
  tags: ["consultant", "indépendant", "conseil", "graphite", "citron vert", "ruban", "nom monumental"],
  identity: graphite,
  racine: racineDe("#121416"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, CITRON = S.accent;
    // 1 · le ruban : une ligne de domaines en capitales, qui glisse doucement de côté quand on défile (scrollFx translateX, coupé en mouvement réduit et sur mobile). Le widget « marquee » est écarté :
    // son piste double le contenu hors écran, ce que la mesure Chrome compte (à tort) comme « hors-écran / texte coupé / chevauchement » ; le glissement au défilement n'a pas ce défaut.
    const MOTS = ["Stratégie", "Organisation", "Transformation", "Pilotage de projet", "Accompagnement"];
    const mot = (t) => k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "fluid:13-19", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", color: CITRON, lineHeight: 1.4, whiteSpace: "nowrap" });
    const ruban = k.row(MOTS.map(mot), { ...GK.gaps("8px 44px"), alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%" }, undefined, { justifyContent: "center", columnGap: "22px", rowGap: "6px" });
    ruban.motion = { scrollFx: { translateX: { from: -26, to: 26 } }, off: ["mobile"] };
    const bandeRuban = G.bande(k, [ruban], { colonne: true, gap: "0px", max: "1280px", padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: ["64px", "56px", "20px"], fond: S.surface, nom: "Ruban" });
    Object.assign(bandeRuban.styles.desktop, { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line });
    // 2 · l'invitation et les liens
    const invite = G.geant("<p>Un problème à démêler ?<br>Parlons-en.</p>", { taille: [34, 72], tablette: { taille: [44, 60] }, lh: 1.02, suivi: "-0.025em", poids: "600", police: S.head, couleur: S.fg })(k, env);
    monte(invite, 30, 45);
    const bouton = GK.fini(k, k.LINK("Réserver un échange", "/contact", { fontFamily: S.head, fontSize: "18px", fontWeight: "700", color: "#121416", backgroundColor: CITRON, textDecoration: "none", minHeight: "58px", display: "inline-flex", alignItems: "center", paddingLeft: "32px", paddingRight: "32px", transitionDuration: GK.MOUVEMENT, borderStyle: "solid", borderWidth: "2px", borderColor: CITRON }),
      { hover: { backgroundColor: "transparent", color: CITRON, transform: { x: 6 } }, focus: GK.focus(S.fg) });
    const gauche = colRep(k, G, [caps(k, "Conseil indépendant", { couleur: CITRON }), invite, bouton], { poids: 7, min: "300px", gap: "22px" });
    const lienDroit = (l, u) => lien(k, l, u, { taille: 17, poids: "600", survol: { color: CITRON, transform: { x: 6 }, textDecoration: "none" }, focus: CITRON });
    const coord = Moteur.finishNode(S, k.W("bizcontact", { title: "", showName: false, showAddress: false, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "16px", fontFamily: S.font, lineHeight: 1.5 }));
    const droite = G.colonne(k, [caps(k, "Pour aller plus loin", { couleur: S.mute }), lienDroit("Approche et questions", "/faq"), lienDroit("Journal de bord", "/blog"), lienDroit("Espace client", "/connexion"), coord, reseauxEx(G, k, env, ["LinkedIn", "YouTube"], { taille: 16, couleur: S.fg, survol: CITRON })], { poids: 4, min: "260px", gap: "2px", extra: { alignSelf: "flex-end", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "32px" }, mobile: { borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "24px" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "44px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const bandeHaut = G.bande(k, [haut], { colonne: true, gap: "0px", max: "1280px", padV: ["88px", "72px", "52px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Invitation" });
    // 3 · le nom monumental, rogné, qui monte au défilement
    const nomGeant = GK.nomRogne("PIVOT", { taille: [120, 200], visible: 0.8, poids: "700", suivi: "-0.04em", couleur: S.fg, police: S.head })(k);
    // au-delà de 200 px (limite du texte fluide) : taille en vw fixe, pour que le nom occupe la largeur (guide §7.5)
    Object.assign(nomGeant.children[0].styles.desktop, { fontSize: "30vw", lineHeight: 0.8, marginBottom: "-5vw", whiteSpace: "nowrap" });
    nomGeant.children[0].styles.mobile = { fontSize: "34vw", marginBottom: "-5.7vw" };
    nomGeant.styles.desktop.alignItems = "center"; // centré : le nom déborde la colonne de 1280 px sur grand écran (taille en vw)
    nomGeant.children[0].motion = { scrollFx: { translateY: { from: 70, to: 0 }, end: 50 } };
    const bandeNom = G.bande(k, [nomGeant], { colonne: true, gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Nom" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    // marge haute > 4 vw : la boîte de texte du nom dépasse de la bande rognée (recouvrement mesuré sinon)
    const bandeBas = G.bande(k, [trait(k, S.line), mentions], { colonne: true, gap: "20px", max: "1280px", padV: ["104px", "50px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Mentions" });
    return [G.racine(k, [bandeRuban, bandeHaut, bandeNom, bandeBas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-120 « Étude à la pierre » — notaire. « Étude Saint-Aubin » (fictive). Pierre de taille claire, encre brune, vert-de-gris. Le geste : un SCEAU circulaire (monogramme dans un double cercle) qui suit
// doucement le pointeur, centré au-dessus du nom ; dessous, quatre colonnes séparées par des filets fins (actes, rendez-vous, étude, informations). Les colonnes remontent en cascade au défilement.
// Young Serif (titres) + Hanken Grotesk. Aucun tarif ni délai : « frais d'actes » renvoie à la page Questions fréquentes.
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const pierre = identite({
  key: "c120", label: "Pierre claire et vert-de-gris", humeur: "light",
  fond: "#e8e2d5", texte: "#231f1a", discret: "#554d42", accent: "#1d5a55", surface: "#f4f0e7",
  police: "font.hanken-grotesk", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#231f1a40",
});

const etudePierre = modeleV2({
  id: identifiantV2(120, "etude-a-la-pierre"), concept: "c-120-etude-a-la-pierre",
  name: "Étude à la pierre", family: FAM,
  description: "Pied d'étude notariale : pierre claire, un sceau qui suit doucement le pointeur, le nom de l'étude en serif centré, puis quatre colonnes à filets fins : actes, rendez-vous, étude et informations, avec mentions légales.",
  tags: ["notaire", "étude notariale", "pierre", "vert-de-gris", "sceau", "quatre colonnes", "classique"],
  identity: pierre,
  racine: racineDe("#e8e2d5"),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal", "container", "divider"],
  compose(k, env, G) {
    const S = k.S, VERT = S.accent, ENCRE = S.fg;
    // 1 · le sceau : double cercle et monogramme ; suit le pointeur (mouse « tilt », coupé en mouvement réduit et au toucher)
    const monogramme = k.T("<p>S</p>", { fontFamily: S.head, fontSize: "46px", lineHeight: 1, color: VERT, textAlign: "center" });
    const interieur = { type: "container", children: [monogramme], ...sty({ width: "70px", height: "70px", borderRadius: "50%", borderStyle: "solid", borderWidth: "1.5px", borderColor: VERT, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }) };
    const sceau = { type: "container", children: [interieur], ...sty({ width: "92px", height: "92px", borderRadius: "50%", borderStyle: "solid", borderWidth: "3px", borderColor: VERT, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", alignSelf: "center" }) };
    sceau.motion = { mouse: { mode: "tilt", strength: 25 } };
    // 2 · le nom
    const nomBureau = G.geant("<p>Étude Saint-Aubin</p>", { taille: [40, 104], tablette: { taille: [64, 88] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENCRE, align: "center" })(k, env, true);
    // sur mobile le nom passe sur deux lignes (sinon « Saint- / Aubin » se coupe au trait d'union) : deux nœuds, l'un masqué selon l'écran
    const nomMobile = G.geant("<p>Étude<br>Saint-Aubin</p>", { taille: [44, 60], lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: ENCRE, align: "center" })(k, env, true);
    nomBureau.hideOn = ["mobile"]; nomMobile.hideOn = ["desktop", "tablet"];
    const nom = k.col([monte(nomBureau, 28, 45), monte(nomMobile, 28, 45)], { gap: "0px", alignItems: "center", width: "100%" });
    const sous = caps(k, "Notaires · Actes, conseils, rendez-vous", { couleur: S.mute, extra: { textAlign: "center" } });
    const entete = k.col([sceau, sous, nom], { gap: "18px", alignItems: "center", width: "100%" });
    // 3 · quatre colonnes séparées par des filets fins
    const survol = { color: VERT, textDecoration: "underline" };
    const sep = { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "28px" };
    const colM = { borderLeftWidth: "0px", paddingLeft: "0px" };
    const col = (titre, enfants, i) => monte(G.colonne(k, [caps(k, titre, { couleur: VERT }), ...enfants], { poids: 1, min: "210px", gap: "2px", aligne: "flex-start", extra: i ? sep : {}, mobile: colM }), 22 + i * 10, 60);
    const actes = col("Actes et conseils", [["Immobilier", "/contact"], ["Famille et succession", "/contact"], ["Entreprise", "/contact"], ["Patrimoine", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 16, survol })), 0);
    const rdv = GK.fini(k, k.LINK("Prendre rendez-vous", "/contact", { fontFamily: S.font, fontSize: "15px", fontWeight: "700", color: "#ffffff", backgroundColor: VERT, textDecoration: "none", minHeight: "48px", display: "inline-flex", alignItems: "center", paddingLeft: "22px", paddingRight: "22px", transitionDuration: GK.MOUVEMENT, marginBottom: "10px", marginTop: "6px", borderStyle: "solid", borderWidth: "1.5px", borderColor: VERT }),
      { hover: { backgroundColor: "transparent", color: VERT, transform: { y: -2 } }, focus: GK.focus(ENCRE) });
    const rv = col("Rendez-vous", [rdv, heures(k, { titre: S.mute })], 1);
    const etude = col("L'étude", [coordonnees(k, { sansTitre: true })], 2);
    const infos = col("Informations", [["Frais d'actes et questions", "/faq"], ["Actualités du droit", "/blog"], ["Espace client", "/connexion"]].map(([l, u]) => lien(k, l, u, { taille: 16, survol })), 3);
    const colonnes = G.ligne(k, [actes, rv, etude, infos], { gap: "36px 28px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [entete, trait(k, ENCRE), colonnes, trait(k, S.line), mentions], { colonne: true, gap: "44px", max: "1240px", padV: ["96px", "72px", "52px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "6px", couleur: VERT }, nom: "Étude" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Professions libérales", target: 5, built: true,
  description: "Pieds de cabinets et indépendants : avocat, expert-comptable, kinésithérapeute, consultant, notaire.",
  models: [cabinetBordeaux, grandLivre, souffleCabinet, pivot, etudePierre],
};
