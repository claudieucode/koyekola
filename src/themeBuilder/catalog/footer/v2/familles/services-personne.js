// Famille v2 « Services à la personne » — 5 modèles (ft2-111… à ft2-115…), extension « sites du quotidien » : coiffeur/barbier, institut de beauté, auto-école, ménage, crèche.
// Chaque modèle est INDÉPENDANT du site (mode « solo ») : couleurs hexadécimales, polices auto-hébergées (identite()), aucune dépendance au thème.
// Marques FICTIVES (Barbier Maurice, Maison Pétale, Auto-école Cap Permis, Net & Clair, Crèche Les Petits Pas). Aucune coordonnée, aucun tarif, aucun chiffre inventé :
// l'adresse, le téléphone et les horaires viennent des « Données de l'entreprise » (widgets bizcontact / bizhours, vides tant qu'ils ne sont pas renseignés) ;
// les liens vont vers des pages de la plateforme (/contact, /faq, /catalogue pour « tarifs et prestations », /inscription, /blog) ; les réseaux sont des adresses d'EXEMPLE (page d'accueil du réseau) à remplacer.
// MOUVEMENT (tout est coupé sous « mouvement réduit », vérifié par le test navigateur : 0 animation / transition) :
//   · transitions de survol / focus (transitionDuration + états : décalage de 2 à 6 px, changement de couleur) : la frontière de pied les coupe ;
//   · « motion » d'un nœud (moteur d'animation de la page) : animation d'attention « pulse » (pastille, anneaux) répétée à l'infini, désactivée par landing.css en mouvement réduit ;
//   · défilement / souris (scrollFx, mouseFx : public/js/kw-effects.js) : parallaxe douce des décors (bulles, feuilles, soleil), sans effet en mouvement réduit ;
//   · NOTE moteur : les widgets « marquee » (rail qui déborde de l'écran : la mesure Chrome le compte en défaut) et « texte rotatif » (bouton « Pause » de 28 px, mot parfois invisible) ont été essayés puis écartés.
//   On n'utilise JAMAIS d'animation « d'entrée » (kind « in ») : sous mouvement réduit elle se réduit à un fondu de 300 ms, ce qui ferait échouer le test « 0 animation ».
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "services-personne";

// ── Aides locales ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const tx = (k, html, st = {}, t, m) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, st, t, m);
const cap = (k, txt, o = {}) => tx(k, txt, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
const mv = (n, m) => { n.motion = m; return n; }; // propriété « motion » du nœud (moteur d'animation de la page)
const lien = (k, G, label, url, o = {}) => G.fini(k, k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || k.S.font, color: o.couleur || k.S.fg, textDecoration: "none", lineHeight: 1.3, display: "inline-flex", alignItems: "center", minHeight: "44px", transitionDuration: G.MOUVEMENT, ...(o.extra || {}) })),
  { hover: o.survol || { color: o.survolCouleur || k.S.accent, transform: { x: 4 }, textDecoration: "none" }, focus: G.focus(o.focus || k.S.accent) });
// Bouton plein (lien de la plateforme) : état de survol qui se soulève, focus visible
const bouton = (k, G, label, url, o = {}) => G.fini(k, k.LINK(label, url, compact({ fontSize: `${o.taille || 16}px`, fontWeight: o.poids || "700", fontFamily: o.police || k.S.font, color: o.couleur, backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.contour || o.fond, borderRadius: o.rayon || "999px", minHeight: "52px", paddingLeft: "28px", paddingRight: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", textTransform: o.casse, letterSpacing: o.suivi, transitionDuration: G.MOUVEMENT })),
  { hover: { backgroundColor: o.survolFond, color: o.survolCouleur, borderColor: o.survolFond, transform: { y: -3 }, textDecoration: "none" }, focus: G.focus(o.focus) });
const rond = (couleur, t, st = {}, enfants = []) => ({ type: "container", children: enfants, ...sty({ width: t, height: t, minWidth: t, borderRadius: "50%", backgroundColor: couleur, flexShrink: 0, ...st }) });
// Décor : bloc positionné en absolu (jamais lu, jamais cliquable) ; le parent doit être « position: relative »
const decor = (st, enfants = [], mobile) => ({ type: "container", children: enfants, ...sty({ position: "absolute", pointerEvents: "none", zIndex: 0, ...st }, undefined, mobile) });
const filetH = (k, couleur, e = "1px", st = {}) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px", ...st });
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
const hoursW = (k, o = {}) => k.W("bizhours", { title: o.titre || "", showOpenNow: o.statut !== false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 16}px`, fontFamily: k.S.font, width: "100%", ...(o.extra || {}) });
const contactW = (k, o = {}) => k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 16}px`, fontFamily: k.S.font, lineHeight: 1.6, ...(o.extra || {}) });
function reseaux(k, G, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = "44"; n.props.shape = o.forme || "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, transitionDuration: G.MOUVEMENT }) }, states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, transform: { y: -3 } }, focus: G.focus(o.focus || S.accent) } });
  return n;
}
// Parallaxe de défilement douce (scrollFx) : tout est coupé en mouvement réduit par kw-effects.js
const deriv = (n, y, o = {}) => { n.motion = { ...(n.motion || {}), scrollFx: { translateY: { from: y[0], to: y[1] }, ...(o.rot ? { rotate: { from: o.rot[0], to: o.rot[1] } } : {}) }, ...(o.souris ? { mouseFx: { translateX: o.souris[0], translateY: o.souris[1], speed: 14 } } : {}) }; return n; };
const PULSE = (ms, delai = 0) => ({ entrance: "pulse", duration: ms, delay: delai, iterations: "infinite", easing: "ease-in-out" });

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-111 « Enseigne de barbier » — « Barbier Maurice » (fictif). Charbon, crème et rouge d'enseigne : trois rayures (rouge, crème, bleu) en haut, le nom en grandes capitales, un ruban rouge de prestations,
// une carte crème « horaires et adresse » et la prise de rendez-vous. Mouvement : pastille « rendez-vous en ligne » qui pulse, carte qui monte doucement au défilement, survols qui se soulèvent. Bebas Neue + Work Sans.
const barbierId = identite({
  key: "c111", label: "Charbon, crème et rouge d'enseigne", humeur: "dark",
  fond: "#1a1614", texte: "#f4ede0", discret: "#bfb4a3", accent: "#c4301f", surface: "#26201d",
  police: "font.work-sans", titres: "font.bebas-neue", rayon: "6px", rayonBouton: "4px", ombre: "none", poids: "400", bordure: "0px", ligne: "#f4ede040",
});
const barbier = modeleV2({
  id: identifiantV2(111, "enseigne-de-barbier"), concept: "c-111-enseigne-de-barbier", name: "Enseigne de barbier", family: FAM,
  description: "Pour un coiffeur ou un barbier : trois rayures d'enseigne, le nom en grandes capitales, un ruban rouge de prestations, les horaires sur une carte crème et un gros bouton de rendez-vous. Charbon, crème et rouge.",
  tags: ["barbier", "coiffeur", "rendez-vous", "horaires", "ruban", "charbon et rouge"],
  identity: barbierId,
  racine: racineDe("#1a1614"),
  widgets: ["text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, CREME = "#f4ede0", ROUGE = "#c4301f", BLEU = "#2d4f8f", ENCRE = "#1a1614";
    const bloc = (c) => ({ type: "container", children: [], ...sty({ flexGrow: 1, flexBasis: "0px", height: "12px", backgroundColor: c }) });
    const rayures = k.row([bloc(ROUGE), bloc(CREME), bloc(BLEU), bloc(ROUGE), bloc(CREME), bloc(BLEU)], { gap: "0px", flexWrap: "nowrap", width: "100%" });
    // 1 · le nom en grandes capitales + appel au rendez-vous (pastille qui pulse = « rendez-vous en ligne »)
    const pastille = k.row([mv(rond(ROUGE, "10px"), PULSE(1800)), cap(k, "Rendez-vous en ligne", { couleur: CREME })], { gap: "10px", flexWrap: "nowrap", alignItems: "center" });
    const nom = G.geant(`<p>Barbier<br><span style="color:#e8604f">Maurice</span></p>`, { taille: [76, 176], tablette: { taille: [110, 150] }, mobile: { taille: [76, 120] }, lh: 0.88, suivi: "0.01em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const accroche = G.phrase("Coupe, barbe, rasage à l'ancienne. On vous reçoit sur rendez-vous, le temps qu'il faut.", { taille: 18, largeur: "440px", couleur: S.mute })(k, env);
    const boutons = k.row([
      bouton(k, G, "Prendre rendez-vous", "/contact", { fond: ROUGE, couleur: "#ffffff", rayon: "4px", survolFond: CREME, survolCouleur: ENCRE, focus: CREME, casse: "uppercase", suivi: "0.08em", taille: 15 }),
      bouton(k, G, "Tarifs et prestations", "/catalogue", { fond: "transparent", contour: CREME, couleur: CREME, rayon: "4px", survolFond: CREME, survolCouleur: ENCRE, focus: CREME, casse: "uppercase", suivi: "0.08em", taille: 15 })], { gap: "12px" });
    const gauche = G.colonne(k, [pastille, nom, accroche, boutons], { poids: 7, min: "300px", gap: "22px" });
    // 2 · la carte crème : horaires (statut « ouvert maintenant » automatique) + coordonnées ; elle monte doucement au défilement
    const carte = deriv(k.col([cap(k, "Au salon", { couleur: "#7a1f14" }), hoursW(k, { couleur: ENCRE, taille: 16, extra: { fontWeight: "500" } }), filetH(k, "#1a161433"), contactW(k, { couleur: ENCRE, taille: 16 })],
      { backgroundColor: CREME, color: ENCRE, borderRadius: "6px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", gap: "18px", flexBasis: "0px", flexGrow: 4, minWidth: "280px", boxSizing: "border-box" }, undefined, { paddingTop: "24px", paddingBottom: "24px", paddingLeft: "22px", paddingRight: "22px" }), [36, 0]);
    const haut = G.bande(k, [gauche, carte], { fond: S.bg, padV: ["88px", "64px", "48px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "flex-end", gap: "40px 72px", nom: "Nom et horaires" });
    // 3 · ruban rouge de prestations (statique : aucun défilement continu, voir la note moteur en tête)
    const ruban = G.bande(k, [G.ruban(["Coupe", "Barbe", "Dégradé", "Rasage à l'ancienne", "Soin du visage"], { separateur: "•", taille: [26, 44], couleur: "#ffffff", police: S.head })(k, env, true)], { fond: ROUGE, padV: ["20px", "18px", "16px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "center", nom: "Ruban de prestations" });
    ;
    // 4 · liens rapides, réseaux, mentions
    const liens = k.row([["Tarifs", "/catalogue"], ["Questions fréquentes", "/faq"], ["Journal du salon", "/blog"], ["Mon compte", "/connexion"]].map(([l, u]) => lien(k, G, l, u, { taille: 15, poids: "600", survolCouleur: "#ffffff" })), { rowGap: "0px", columnGap: "28px" });
    const bas = G.bande(k, [liens, reseaux(k, G, env, ["instagram", "facebook"], { fond: S.alt, survolFond: CREME, survolCouleur: ENCRE, focus: CREME, forme: "square" }), filetH(k, S.line), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)],
      { fond: S.bg, colonne: false, aligne: "center", gap: "20px 40px", padV: ["40px", "36px", "32px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Liens et mentions" });
    return [G.racine(k, [rayures, haut, ruban, bas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-112 « Arche de pétales » — « Maison Pétale » (fictive), institut de beauté / spa de quartier. Rose poudré et sauge : une grande ARCHE (fenêtre à sommet rond) porte le nom et la réservation, trois feuilles y flottent ;
// à droite, trois repères (rendez-vous, horaires, adresse) séparés par des filets fins. Mouvement : feuilles qui tournent doucement au défilement et suivent la souris, anneau qui respire (pulse lent), survols qui se soulèvent. Cormorant Garamond + Jost.
const petaleId = identite({
  key: "c112", label: "Rose poudré et sauge", humeur: "light",
  fond: "#f7ece7", texte: "#3a2a2c", discret: "#6d5659", accent: "#8f3f52", surface: "#fffaf7",
  police: "font.jost", titres: "font.cormorant-garamond", rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "0px", ligne: "#d9bfba",
});
const petale = modeleV2({
  id: identifiantV2(112, "arche-de-petales"), concept: "c-112-arche-de-petales", name: "Arche de pétales", family: FAM,
  description: "Pour un institut de beauté ou un spa de quartier : une grande arche rose poudré porte le nom et la réservation, des feuilles y flottent doucement ; à droite, rendez-vous, horaires et adresse en trois repères calmes.",
  tags: ["institut", "spa", "beauté", "arche", "pétales", "rose poudré", "réservation"],
  identity: petaleId,
  racine: racineDe("#f7ece7"),
  widgets: ["text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, SAUGE = "#d7e0d0", ROSE = "#ecc9c6", PRUNE = "#8f3f52", ENCRE = "#3a2a2c";
    const feuille = (c, t, pos, anim, mob) => deriv(decor({ width: t, height: t, backgroundColor: c, borderTopLeftRadius: "0px", borderTopRightRadius: "100%", borderBottomRightRadius: "0px", borderBottomLeftRadius: "100%", ...pos }, [], mob), anim.y, { rot: anim.rot, souris: anim.souris });
    // anneau qui respire derrière le nom (pulse lent, désactivé en mouvement réduit)
    const anneau = mv(decor({ width: "260px", height: "260px", borderRadius: "50%", borderStyle: "solid", borderWidth: "1.5px", borderColor: "#8f3f5266", top: "70px", right: "24px" }, [], { width: "120px", height: "120px", top: "30px", right: "14px" }), PULSE(7000));
    const nom = tx(k, `<p>Maison<br><em>Pétale</em></p>`, { fontFamily: S.head, fontWeight: "600", fontSize: "fluid:56-92", lineHeight: 0.95, letterSpacing: "-0.01em", color: ENCRE, position: "relative", zIndex: 1 });
    const mot = tx(k, "Soins du visage et du corps, beauté des mains et des pieds, dans un lieu calme.", { fontSize: "17px", lineHeight: 1.6, color: S.mute, maxWidth: "340px", position: "relative", zIndex: 1 });
    const reserver = bouton(k, G, "Réserver un soin", "/contact", { fond: PRUNE, couleur: "#ffffff", survolFond: ENCRE, survolCouleur: "#ffffff", focus: ENCRE, taille: 16 });
    reserver.styles.desktop = { ...reserver.styles.desktop, position: "relative", zIndex: 1, alignSelf: "flex-start" };
    const arche = k.col([anneau, feuille("#b7cbac", "92px", { bottom: "30px", right: "30px" }, { y: [14, -14], rot: [-12, 12], souris: [8, 6] }, { width: "70px", height: "70px", bottom: "18px", right: "18px" }), feuille("#f0b9b6", "56px", { bottom: "170px", right: "90px" }, { y: [-10, 10], rot: [16, -16], souris: [-8, 6] }, { width: "40px", height: "40px", bottom: "26px", right: "104px" }), feuille("#e6c98a", "40px", { bottom: "56px", left: "70px" }, { y: [10, -10], rot: [-18, 18], souris: [6, -6] }, { display: "none" }), nom, mot, reserver],
      { backgroundColor: SAUGE, borderTopLeftRadius: "999px", borderTopRightRadius: "999px", borderBottomLeftRadius: "24px", borderBottomRightRadius: "24px", paddingTop: "96px", paddingBottom: "56px", paddingLeft: "64px", paddingRight: "56px", gap: "22px", position: "relative", overflow: "hidden", flexBasis: "0px", flexGrow: 5, minWidth: "300px", boxSizing: "border-box", alignItems: "flex-start" },
      { paddingTop: "84px", paddingLeft: "40px", paddingRight: "36px" }, { paddingTop: "72px", paddingBottom: "40px", paddingLeft: "28px", paddingRight: "24px", borderBottomLeftRadius: "20px", borderBottomRightRadius: "20px" });
    const repere = (titre, corps) => k.col([cap(k, titre, { couleur: PRUNE }), corps], { gap: "8px", paddingTop: "22px", paddingBottom: "22px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, width: "100%" });
    const liens = k.row([["Soins et tarifs", "/catalogue"], ["Questions fréquentes", "/faq"], ["Conseils beauté", "/blog"]].map(([l, u]) => lien(k, G, l, u, { taille: 16, poids: "500", survolCouleur: PRUNE })), { rowGap: "0px", columnGap: "26px" });
    const droite = k.col([
      repere("Rendez-vous", k.col([tx(k, "Réservez en ligne ou écrivez-nous : nous vous répondons avec les créneaux libres.", { fontSize: "16px", lineHeight: 1.6, color: S.fg, maxWidth: "420px" }), lien(k, G, "Écrire à l'institut", "/contact", { taille: 16, poids: "600", couleur: PRUNE, survolCouleur: ENCRE })], { gap: "2px" })),
      repere("Horaires", hoursW(k, { couleur: S.fg, taille: 16 })),
      repere("L'adresse", contactW(k, { couleur: S.fg, taille: 16 })),
    ], { flexBasis: "0px", flexGrow: 6, minWidth: "280px", gap: "0px", alignSelf: "center" });
    const corps = G.bande(k, [arche, droite], { fond: S.bg, padV: ["88px", "64px", "44px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "16px"], max: "1180px", aligne: "stretch", gap: "48px 80px", nom: "Arche et repères" });
    const bas = G.bande(k, [liens, reseaux(k, G, env, ["instagram", "facebook", "pinterest"], { fond: ROSE, couleur: ENCRE, survolFond: PRUNE, survolCouleur: "#ffffff" })], { fond: S.bg, aligne: "center", gap: "12px 40px", padV: ["8px", "8px", "8px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], max: "1180px", nom: "Liens et réseaux" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { fond: S.bg, padV: ["12px", "12px", "8px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], max: "1180px", filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Mentions" });
    return [G.racine(k, [corps, bas, mentions])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-113 « Piste d'examen » — « Auto-école Cap Permis » (fictive). Une bande jaune signalisation avec la grande question « Prêt à prendre la route ? », une ligne médiane en tirets de route, puis un asphalte sombre : quatre étapes
// numérotées (inscription, code, conduite, examen) qui sont des liens, horaires et coordonnées. Mouvement : repère jaune qui avance sur la ligne de route au défilement, pastille qui pulse, étapes qui se soulèvent au survol. Barlow Condensed + Barlow.
const routeId = identite({
  key: "c113", label: "Jaune signalisation et asphalte", humeur: "dark",
  fond: "#161616", texte: "#f5f5f0", discret: "#b8b8b0", accent: "#ffd400", surface: "#222222",
  police: "font.barlow", titres: "font.barlow-condensed", rayon: "10px", rayonBouton: "6px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff33",
});
const route = modeleV2({
  id: identifiantV2(113, "piste-d-examen"), concept: "c-113-piste-d-examen", name: "Piste d'examen", family: FAM,
  description: "Pour une auto-école : une bande jaune signalisation avec la grande question « Prêt à prendre la route ? », puis sur l'asphalte une ligne de tirets où un repère jaune avance quand on défile, et quatre étapes numérotées (inscription, code, conduite, examen).",
  tags: ["auto-école", "permis", "étapes", "jaune", "asphalte", "inscription"],
  identity: routeId,
  racine: racineDe("#161616"),
  widgets: ["text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, JAUNE = "#ffd400", NOIR = "#161616";
    // 1 · bande jaune : la question en très grand, deux boutons noirs
    const pastille = k.row([mv(rond(NOIR, "12px"), PULSE(1600)), cap(k, "Inscriptions toute l'année", { couleur: NOIR, police: S.head, taille: "15px" })], { gap: "10px", flexWrap: "nowrap", alignItems: "center" });
    const question = G.geant(`<p>Prêt à prendre<br>la route&nbsp;?</p>`, { taille: [56, 150], tablette: { taille: [96, 130] }, mobile: { taille: [56, 96] }, lh: 0.92, suivi: "-0.01em", poids: "800", casse: "uppercase", police: S.head, couleur: NOIR })(k, env);
    const btns = k.row([
      bouton(k, G, "S'inscrire en ligne", "/inscription", { fond: NOIR, couleur: JAUNE, rayon: "6px", survolFond: "#ffffff", survolCouleur: NOIR, contour: NOIR, focus: NOIR, casse: "uppercase", suivi: "0.06em", taille: 16 }),
      bouton(k, G, "Poser une question", "/contact", { fond: "transparent", contour: NOIR, couleur: NOIR, rayon: "6px", survolFond: NOIR, survolCouleur: JAUNE, focus: NOIR, casse: "uppercase", suivi: "0.06em", taille: 16 })], { gap: "12px" });
    const jaune = G.bande(k, [pastille, question, btns], { fond: JAUNE, colonne: true, aligne: "flex-start", gap: "22px", padV: ["72px", "56px", "40px"], padB: ["64px", "48px", "36px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "La question" });
    // 2 · ligne médiane (voir plus bas)
    // la ligne médiane : tirets de route + un repère jaune qui AVANCE quand on défile (scrollFx : translateX, coupé en mouvement réduit)
    const repere = deriv(decor({ width: "56px", height: "18px", top: "3px", left: "0px", borderRadius: "999px", backgroundColor: JAUNE }), [0, 0]);
    repere.motion = { scrollFx: { translateX: { from: 0, to: 220 }, start: 0, end: 60 } };
    const tirets = k.col([decor({ width: "100%", height: "0px", top: "10px", left: "0px", borderStyle: "dashed", borderWidth: "0px", borderTopWidth: "4px", borderColor: "#ffffff80" }), repere], { position: "relative", width: "100%", height: "24px", flexShrink: 0 });
    ;
    // 3 · quatre étapes numérotées = quatre liens
    const etape = (n, l, u, t) => G.fini(k, k.LINK(`${n}  ${l}`, u, { display: "flex", alignItems: "flex-end", fontFamily: S.head, fontWeight: "800", fontSize: "26px", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1, color: S.fg, backgroundColor: S.alt, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: JAUNE, borderRadius: "10px", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "20px", paddingRight: "20px", minHeight: t, flexGrow: 1, flexBasis: "0px", minWidth: "200px", boxSizing: "border-box", textDecoration: "none", transitionDuration: G.MOUVEMENT }, undefined, { minHeight: "64px" }),
      { hover: { backgroundColor: JAUNE, color: NOIR, transform: { y: -6 }, textDecoration: "none" }, focus: G.focus("#ffffff") });
    const etapes = k.row([etape("01", "Inscription", "/inscription", "132px"), etape("02", "Code", "/faq", "132px"), etape("03", "Conduite", "/catalogue", "132px"), etape("04", "Examen", "/contact", "132px")], { gap: "16px", alignItems: "stretch", width: "100%" });
    // 4 · horaires, adresse, réseaux, mentions
    const infos = k.row([
      k.col([cap(k, "Horaires du bureau", { couleur: JAUNE }), hoursW(k, { couleur: S.fg, taille: 16 })], { flexBasis: "0px", flexGrow: 1, minWidth: "260px", gap: "10px" }),
      k.col([cap(k, "Nous trouver", { couleur: JAUNE }), contactW(k, { couleur: S.fg, taille: 16 }), reseaux(k, G, env, ["facebook", "instagram"], { fond: S.alt, survolFond: JAUNE, survolCouleur: NOIR, focus: "#ffffff" })], { flexBasis: "0px", flexGrow: 1, minWidth: "260px", gap: "10px" }),
      k.col([cap(k, "À savoir", { couleur: JAUNE }), ...[["Tarifs et formules", "/catalogue"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]].map(([l, u]) => lien(k, G, l, u, { survolCouleur: JAUNE }))], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "0px" }),
    ], { rowGap: "32px", columnGap: "48px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" });
    const bas = G.bande(k, [etapes, tirets, infos, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { fond: NOIR, colonne: true, gap: "40px", padV: ["24px", "20px", "20px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Étapes et infos" });
    return [G.racine(k, [jaune, bas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-114 « Bulles propres » — « Net & Clair » (fictive), entreprise de ménage et de nettoyage. Fond bleu très clair, une grande carte bleu profond « Une maison nette, sans y penser » avec la demande de devis, des bulles en anneaux qui
// montent doucement au défilement (parallaxe) et suivent la souris, des pastilles de prestations à droite. Mouvement : bulles (défilement + souris), pastille qui pulse, survols qui se soulèvent. Quicksand + Nunito Sans.
const netId = identite({
  key: "c114", label: "Bleu ciel et bleu profond", humeur: "light",
  fond: "#e8f4fa", texte: "#0d2f4a", discret: "#41607a", accent: "#0b5394", surface: "#ffffff",
  police: "font.nunito-sans", titres: "font.quicksand", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#b5d4e4",
});
const net = modeleV2({
  id: identifiantV2(114, "bulles-propres"), concept: "c-114-bulles-propres", name: "Bulles propres", family: FAM,
  description: "Pour une entreprise de ménage ou de nettoyage : une grande carte bleue « Une maison nette, sans y penser » avec la demande de devis, des bulles qui montent doucement quand on défile, et les prestations en pastilles.",
  tags: ["ménage", "nettoyage", "devis", "bulles", "bleu ciel", "prestations"],
  identity: netId,
  racine: racineDe("#e8f4fa"),
  widgets: ["text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, BLEU = "#0b5394", NUIT = "#0d2f4a", MENTHE = "#7fe0c4";
    const bulle = (t, pos, couleur, y, souris, mob) => deriv(decor({ width: t, height: t, borderRadius: "50%", borderStyle: "solid", borderWidth: "2px", borderColor: couleur, ...pos }, [], mob), y, { souris });
    const bulles = [bulle("120px", { top: "14px", right: "40px" }, "#ffffff66", [40, -40], [10, 14], { width: "72px", height: "72px", top: "12px", right: "14px" }), bulle("64px", { top: "90px", right: "190px" }, "#ffffff55", [26, -26], [-8, 10], { display: "none" }), bulle("180px", { bottom: "10px", right: "10px" }, "#7fe0c466", [-30, 30], [14, -6], { width: "90px", height: "90px", bottom: "16px", right: "14px" }), bulle("36px", { bottom: "60px", left: "46%" }, "#ffffff66", [18, -18], [6, -10], { display: "none" })];
    const pastille = k.row([mv(rond(MENTHE, "12px"), PULSE(2000)), cap(k, "Devis gratuit en ligne", { couleur: "#d4ecfa", police: S.font })], { gap: "10px", flexWrap: "nowrap", alignItems: "center", position: "relative", zIndex: 1 });
    const titre = tx(k, `<p>Une maison nette,<br><span style="color:${MENTHE}">sans y penser.</span></p>`, { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:40-76", lineHeight: 1.04, letterSpacing: "-0.02em", color: "#ffffff", position: "relative", zIndex: 1 });
    const mot = tx(k, "Ménage à domicile, bureaux, vitres, remise en état : décrivez votre besoin, nous revenons vers vous avec un devis.", { fontSize: "17px", lineHeight: 1.6, color: "#d4ecfa", maxWidth: "460px", position: "relative", zIndex: 1 });
    const devis = bouton(k, G, "Demander un devis", "/contact", { fond: "#ffffff", couleur: NUIT, survolFond: MENTHE, survolCouleur: NUIT, focus: "#ffffff", taille: 16 });
    devis.styles.desktop = { ...devis.styles.desktop, alignSelf: "flex-start", position: "relative", zIndex: 1 };
    const carte = k.col([...bulles, pastille, titre, mot, devis], { backgroundColor: BLEU, borderRadius: "36px", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "56px", gap: "22px", position: "relative", overflow: "hidden", flexBasis: "0px", flexGrow: 7, minWidth: "300px", boxSizing: "border-box", alignItems: "flex-start" },
      { paddingLeft: "40px", paddingRight: "40px" }, { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "28px" });
    const prest = ["Ménage à domicile", "Vitres", "Bureaux et commerces", "Fin de bail", "Repassage", "Remise en état"];
    const chips = G.pilules(prest.map((p) => [p, "/catalogue"]), { fond: "#ffffff", contour: "#b5d4e4", couleur: NUIT, survolFond: BLEU, survolCouleur: "#ffffff", poids: "700", gap: "10px", taille: 15 })(k, env);
    const infos = k.row([
      k.col([cap(k, "Horaires", { couleur: BLEU }), hoursW(k, { couleur: S.fg, taille: 15 })], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" }),
      k.col([cap(k, "Nous joindre", { couleur: BLEU }), contactW(k, { couleur: S.fg, taille: 15 })], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { rowGap: "24px", columnGap: "32px", alignItems: "flex-start", width: "100%" });
    const droite = k.col([cap(k, "Nos prestations", { couleur: BLEU }), chips, filetH(k, S.line), infos], { flexBasis: "0px", flexGrow: 5, minWidth: "300px", gap: "20px", alignSelf: "center" });
    const haut = G.bande(k, [carte, droite], { fond: S.bg, padV: ["80px", "56px", "36px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "16px"], max: "1280px", aligne: "stretch", gap: "32px 56px", nom: "Devis et prestations" });
    const liens = k.row([["Tarifs", "/catalogue"], ["Questions fréquentes", "/faq"], ["Conseils d'entretien", "/blog"], ["Espace client", "/connexion"]].map(([l, u]) => lien(k, G, l, u, { poids: "700", survolCouleur: BLEU })), { rowGap: "0px", columnGap: "28px" });
    const bas = G.bande(k, [liens, reseaux(k, G, env, ["facebook", "instagram", "linkedin"], { fond: "#ffffff", couleur: NUIT, survolFond: BLEU, survolCouleur: "#ffffff" })], { fond: S.bg, aligne: "center", gap: "12px 40px", padV: ["8px", "8px", "8px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Liens et réseaux" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { fond: S.bg, padV: ["12px", "12px", "8px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Mentions" });
    return [G.racine(k, [haut, bas, mentions])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-115 « Petits pas » — « Crèche Les Petits Pas » (fictive). Crème chaleureuse, un grand nom rond (Fredoka) avec un soleil qui respire, et un ESCALIER de quatre marches colorées (jaune, vert, bleu, corail) : chaque marche est un lien
// (pré-inscription, questions, actualités, contact) et monte de gauche à droite ; sur mobile, elles s'empilent. Horaires et coordonnées dans une carte blanche arrondie. Mouvement : soleil (pulse + souris), marches qui se soulèvent au survol,
// pastille qui pulse. Fredoka + Nunito. Aucune promesse d'agrément ou de places : tout est à renseigner par la structure.
const crecheId = identite({
  key: "c115", label: "Crème, soleil et corail", humeur: "light",
  fond: "#fff5e1", texte: "#3b2a20", discret: "#6a5446", accent: "#c4432b", surface: "#ffffff",
  police: "font.nunito", titres: "font.fredoka", rayon: "24px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "0px", ligne: "#ecd9b4",
});
const creche = modeleV2({
  id: identifiantV2(115, "petits-pas"), concept: "c-115-petits-pas", name: "Petits pas", family: FAM,
  description: "Pour une crèche ou une garde d'enfants : un nom tout rond avec un soleil qui respire, et un escalier de quatre marches colorées, chacune un lien (pré-inscription, questions, actualités, contact). Crème, jaune, vert, bleu et corail.",
  tags: ["crèche", "garde d'enfants", "escalier", "soleil", "couleurs douces", "pré-inscription"],
  identity: crecheId,
  racine: racineDe("#3b2a20"), // le bas du pied est sombre : la ligne légale de la plateforme reprend ce fond
  widgets: ["text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#3b2a20", JAUNE = "#ffd166", VERT = "#a8d8a0", BLEU = "#9fd3ec", CORAIL = "#c4432b";
    const soleil = deriv(mv(decor({ width: "200px", height: "200px", borderRadius: "50%", backgroundColor: "#ffd16655", display: "flex", alignItems: "center", justifyContent: "center", top: "-30px", right: "-30px" }, [rond(JAUNE, "90px")], { width: "150px", height: "150px", right: "-12px", top: "-6px" }), PULSE(5000)), [0, 0], { souris: [14, 10] });
    const nom = tx(k, `<p>Les <span style="color:${CORAIL}">Petits</span><br>Pas</p>`, { fontFamily: S.head, fontWeight: "600", fontSize: "fluid:64-124", lineHeight: 0.98, letterSpacing: "-0.01em", color: ENCRE, position: "relative", zIndex: 1 });
    const mot = tx(k, "Une crèche à taille humaine : on grandit à son rythme, un petit pas après l'autre.", { fontSize: "18px", lineHeight: 1.6, color: S.mute, maxWidth: "420px", position: "relative", zIndex: 1 });
    const pastille = k.row([mv(rond(CORAIL, "10px"), PULSE(1800)), cap(k, "Pré-inscription en ligne", { couleur: ENCRE })], { gap: "10px", flexWrap: "nowrap", alignItems: "center" });
    const tete = k.col([soleil, pastille, nom, mot], { position: "relative", gap: "18px", flexBasis: "0px", flexGrow: 6, minWidth: "300px", paddingRight: "130px", boxSizing: "border-box" }, undefined, { paddingRight: "0px", paddingTop: "0px" });
    const carte = k.col([cap(k, "Horaires d'accueil", { couleur: CORAIL }), hoursW(k, { couleur: ENCRE, taille: 16 }), filetH(k, S.line), cap(k, "Nous trouver", { couleur: CORAIL }), contactW(k, { couleur: ENCRE, taille: 16 })],
      { backgroundColor: "#ffffff", borderRadius: "28px", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "32px", paddingRight: "32px", gap: "14px", flexBasis: "0px", flexGrow: 4, minWidth: "280px", boxSizing: "border-box" }, undefined, { paddingLeft: "22px", paddingRight: "22px", paddingTop: "24px", paddingBottom: "24px" });
    const haut = G.bande(k, [tete, carte], { fond: S.bg, padV: ["80px", "56px", "40px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "flex-end", gap: "32px 64px", nom: "Nom et accueil" });
    // l'escalier : quatre marches de hauteurs croissantes (bureau), alignées par le bas ; empilées sur mobile
    const marche = (l, u, c, h, th) => G.fini(k, k.LINK(l, u, { display: "flex", alignItems: "flex-end", fontFamily: S.head, fontWeight: "600", fontSize: "24px", lineHeight: 1.1, color: ENCRE, backgroundColor: c, borderTopLeftRadius: "28px", borderTopRightRadius: "28px", borderBottomLeftRadius: "0px", borderBottomRightRadius: "0px", paddingTop: "20px", paddingBottom: "22px", paddingLeft: "24px", paddingRight: "20px", minHeight: h, flexGrow: 1, flexBasis: "0px", minWidth: "170px", boxSizing: "border-box", textDecoration: "none", transitionDuration: G.MOUVEMENT }, { minHeight: th }, { minHeight: "64px", borderRadius: "20px", width: "100%" }),
      { hover: { backgroundColor: "#ffffff", transform: { y: -8 }, textDecoration: "none" }, focus: G.focus(ENCRE) });
    const marches = k.row([marche("Pré-inscription", "/inscription", JAUNE, "104px", "96px"), marche("Questions fréquentes", "/faq", VERT, "152px", "120px"), marche("Actualités", "/blog", BLEU, "200px", "144px"), marche("Nous contacter", "/contact", "#f4a58f", "248px", "168px")], { gap: "12px", alignItems: "flex-end", flexWrap: "nowrap", width: "100%" }, { flexWrap: "wrap" }, { flexDirection: "column", alignItems: "stretch", flexWrap: "nowrap", gap: "10px" });
    const escalier = G.bande(k, [marches], { fond: S.bg, padV: ["24px", "20px", "16px"], padB: ["0px", "0px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Escalier" });
    const sol = G.bande(k, [reseaux(k, G, env, ["facebook", "instagram"], { fond: "#ffffff", couleur: ENCRE, survolFond: CORAIL, survolCouleur: "#ffffff" }), G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#fff5e1", liens: "#fff5e1" })(k, env)],
      { fond: ENCRE, colonne: true, gap: "20px", aligne: "stretch", padV: ["36px", "32px", "28px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Réseaux et mentions" });
    sol.styles.desktop.color = "#fff5e1"; // la ligne légale de la plateforme (ajoutée dessous) reprend cette couleur de texte : clair sur le fond sombre
    return [G.racine(k, [haut, escalier, sol])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Services à la personne", target: 5, built: true,
  description: "Pieds de services du quotidien : coiffeur, institut de beauté, auto-école, ménage, garde d'enfants.",
  models: [barbier, petale, route, net, creche],
};
