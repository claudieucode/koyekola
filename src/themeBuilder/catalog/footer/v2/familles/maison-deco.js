// Famille v2 « Maison, mobilier et déco » — 6 modèles (ft2-410 à ft2-415), refonte « illustrée » : chaque pied reprend le PARTI PRIS VISUEL d'une capture (37 : nom monumental + grande scène ; 38 : logo épais, lettre en haut à droite, colonnes ; 39 : carte sombre sur aplat dégradé) avec ses propres dessins vectoriels (poteries, salon, carreaux, planche cotée, médaillon, cernes du bois : voir ../aides-illus-a12.js). ANGLES DROITS partout.
// Contenu utile et réel (liens de la plateforme, coordonnées et horaires des « Données de l'entreprise », lettre, mentions légales) ; marques fictives ; AUCUNE coordonnée ni chiffre inventé. Adresses de réseaux : exemples.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; au moins une animation visible par modèle (carré qui « respire », ligne d'index qui se remplit). Pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const DOUX = 360; // ms : transitions de survol / focus (angles droits partout)

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, fontStyle: o.style, letterSpacing: o.suivi }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
function lettre(k, env, G, o) {
  const abo = G.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "420px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte, fondChamp: o.fondChamp })(k, env);
  const P = abo.parts;
  P.title.styles.desktop = { ...P.title.styles.desktop, color: o.couleurTitre || o.texte, lineHeight: 1.4 };
  P.intro.styles.desktop = { ...P.intro.styles.desktop, color: o.texte };
  P.consent.styles.desktop = { ...P.consent.styles.desktop, color: o.texte };
  P.missing.styles.desktop = { ...P.missing.styles.desktop, color: o.texte };
  P.input.styles.desktop = { ...P.input.styles.desktop, borderRadius: "0px" };
  P.button.styles.desktop = { ...P.button.styles.desktop, color: o.surBouton, backgroundColor: o.accent, borderRadius: "0px", transitionDuration: DOUX };
  P.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.survolTexte || o.fond, transform: { y: -2 } }, focus: GK.focus(o.focus || o.texte) };
  return abo;
}
// Conteneur pleine largeur libre (bord à bord) : pour les demi-pages, étagères, etc.
const plein = (enfants, st = {}, mob) => ({ type: "container", props: { full: true }, children: enfants, ...sty(compact({ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", gap: "0px", width: "100%", ...st }), undefined, mob) });
// Case / bloc à fond propre (angles droits)
const caseDe = (k, enfants, st = {}, mob, hover) => { const n = k.col(enfants, compact({ flexBasis: "0px", flexGrow: 1, flexShrink: 1, minWidth: "200px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", alignItems: "flex-start", borderRadius: "0px", transitionDuration: DOUX, ...st }), undefined, mob); if (hover) n.states = { hover }; return n; };
const reseaux = (k, env, liste, o) => GK.reseauxTexte(liste, o)(k, env);
const RS = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Pinterest", "https://www.pinterest.com/"]];
const legale = (k, env, o) => GK.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env, o && o.center);


const A = require("../aides-illus-a12");
const RESEAUX = ["instagram", "facebook", "pinterest"];
const FAM = "maison-deco";
const L = (k, liste, o) => liste.map(([l, u]) => lien(k, l, u, o));
const colTitre = (k, titre, enfants, o = {}) => k.col([caps(k, titre, { couleur: o.titre }), ...enfants], { gap: "4px", flexBasis: "0px", flexGrow: o.poids || 1, minWidth: o.min || "150px" });
// Boîte « lettre » à la manière de la capture 38 : champ blanc à angles droits, bouton franc
function boite(k, env, G, o) {
  const abo = lettre(k, env, G, { titre: o.titre, intro: o.intro, bouton: o.bouton || "OK", accent: o.accent, texte: o.texte, surBouton: o.surBouton, fond: o.fond, survolBouton: o.survolBouton || o.texte, survolTexte: o.survolTexte || o.fond, largeur: o.largeur || "440px", fondChamp: "#ffffff" });
  const P = abo.parts;
  P.input.styles.desktop = { ...P.input.styles.desktop, backgroundColor: "#ffffff", color: o.champ || "#161616", borderBottomWidth: "0px", paddingLeft: "16px" };
  return abo;
}
const pastilles = (k, env, o) => A.reseauxIcones(k, env, RESEAUX, { forme: "square", ...o });

// ═══ ft2-410 « Lin et Terre » — capture 37 : aplat vif, nom MONUMENTAL en tête, grande scène illustrée (rangée de poteries sur lin rayé), pied de liens en bas ═══
const terre = identite({ key: "c410", label: "Terre cuite et lin", humeur: "dark", fond: "#a8472a", texte: "#fff4e6", discret: "#fbe3cf", accent: "#ffd9a0", surface: "#8f3b22", encre: "#2b1208", police: "font.dm-sans", titres: "font.dm-serif-display", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#fff4e655" });
const linTerre = modeleV2({
  id: identifiantV2(410, "lin-et-terre"), concept: "c-410-lin-et-terre", name: "Lin et Terre", family: FAM,
  description: "Pour une boutique de linge de maison et de poterie : le nom de la marque en lettres monumentales sur terre cuite, une grande scène dessinée de poteries sur un lin rayé, puis le pied de liens (présentation, trois colonnes, réseaux en pastilles). Angles droits.",
  tags: ["linge de maison", "poterie", "nom monumental", "illustration", "terre cuite", "angles droits"],
  identity: terre, racine: racineDe("#8f3b22"), widgets: ["text", "link", "html", "social", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CR = "#fff4e6", SOMBRE = "#8f3b22";
    const haut = k.row([k.row([souffle(carre(k, "#ffd9a0", "12px"), 3600), caps(k, "Maison, linge et poterie", { couleur: CR })], { gap: "12px", alignItems: "center" }), caps(k, "Fait pour durer", { couleur: "#fbe3cf" })], { justifyContent: "space-between", gap: "12px", alignItems: "center", width: "100%" });
    const nom = G.geant("<p>Lin &amp; Terre<span style=\"font-size:0.3em;vertical-align:top\">®</span></p>", { taille: [54, 200], lh: 0.95, suivi: "-0.03em", poids: "400", police: S.head, couleur: CR })(k, env);
    const b1 = G.bande(k, [haut, nom], { fond: "#a8472a", degrade: { from: "#a8472a", to: "#9a3f24", angle: 180 }, colonne: true, gap: "20px", padV: ["40px", "32px", "28px"], padB: ["8px", "8px", "8px"], padH: ["48px", "32px", "20px"], nom: "Marque" });
    const b2 = G.bande(k, A.vue(k, A.poteries(1280, 380, 7), A.poteries(390, 250, 3)), { fond: "#a8472a", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Scène" });
    const presentation = k.col([k.T("<p>Lin &amp; Terre</p>", { fontFamily: S.head, fontSize: "30px", color: CR, lineHeight: 1.1 }), para(k, "Du linge qui vieillit bien, de la terre cuite faite pour servir. Chaque pièce est choisie pour la vie de tous les jours.", { couleur: "#fbe3cf", largeur: "400px" }), pastilles(k, env, { couleur: CR, contour: "#fff4e688", survolFond: "#ffd9a0", survolCouleur: "#2b1208", focus: CR })], { gap: "14px", flexBasis: "0px", flexGrow: 2, minWidth: "280px", alignItems: "flex-start" });
    const cols = k.row([
      colTitre(k, "Boutique", L(k, [["Linge de lit", "/boutique"], ["Poterie", "/boutique"], ["Table", "/boutique"], ["Nouveautés", "/catalogue"]], { taille: 15, couleur: CR, survol: { color: "#ffd9a0", transform: { x: 4 } }, focus: CR }), { titre: "#ffd9a0" }),
      colTitre(k, "Aide", L(k, [["Livraison", "/faq"], ["Retours", "/faq"], ["Entretien", "/blog"], ["Questions", "/faq"]], { taille: 15, couleur: CR, survol: { color: "#ffd9a0", transform: { x: 4 } }, focus: CR }), { titre: "#ffd9a0" }),
      k.col([caps(k, "Nous écrire", { couleur: "#ffd9a0" }), coordonnees(k, { couleur: CR, lien: CR, survol: "#ffd9a0", focus: CR, taille: 14 })], { gap: "6px", flexBasis: "0px", flexGrow: 1.3, minWidth: "190px" }),
    ], { gap: "28px 32px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 3, minWidth: "300px", width: "auto" });
    const b3 = G.bande(k, [k.row([presentation, cols], { gap: "32px 56px", alignItems: "flex-start", width: "100%" }), trait(k, "#fff4e655"), legale(k, env, { couleur: "#fbe3cf", liens: CR })], { fond: SOMBRE, colonne: true, gap: "24px", padV: ["44px", "36px", "28px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Liens et mentions" });
    return [G.racine(k, [b1, b2, b3])];
  },
}, FAM);

// ═══ ft2-411 « Verdier Intérieurs » — capture 38 : fond sombre, logo épais bicolore en haut à gauche, lettre en haut à droite, filet, colonnes ; ici + le salon dessiné à droite ═══
const verdier = identite({ key: "c411", label: "Vert sapin et lin clair", humeur: "dark", fond: "#1f3d2e", texte: "#f4efe3", discret: "#cfe0d2", accent: "#e9c46a", surface: "#2a5240", encre: "#14261c", police: "font.karla", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f4efe355" });
const verdierInterieurs = modeleV2({
  id: identifiantV2(411, "verdier-interieurs"), concept: "c-411-verdier-interieurs", name: "Verdier Intérieurs", family: FAM,
  description: "Pour un magasin de meubles : fond vert sapin, logo épais bicolore, lettre à droite (champ blanc), filet, trois colonnes de liens et un salon dessiné (canapé, lampadaire, plante). Réseaux en pastilles, angles droits.",
  tags: ["meubles", "décoration", "logo épais", "lettre", "illustration salon", "vert sapin", "angles droits"],
  identity: verdier, racine: racineDe("#1f3d2e"), widgets: ["text", "link", "html", "emailsubscribe", "bizcontact", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, LIN = "#f4efe3", VERT = "#1f3d2e", OR = "#e9c46a";
    const logo = k.row([carre(k, OR, "18px"), G.geant("<p>Verdier <span style=\"color:#e9c46a\">Intérieurs</span></p>", { taille: [30, 64], lh: 1, suivi: "-0.02em", poids: "700", police: S.head, couleur: LIN })(k, env)], { gap: "14px", alignItems: "center", flexBasis: "0px", flexGrow: 2, minWidth: "260px" });
    souffle(logo.children[0], 3400);
    const abo = boite(k, env, G, { titre: "Lettre de la maison", intro: "Nouveautés et conseils d'aménagement, un message par mois.", bouton: "Je m'inscris", accent: OR, texte: LIN, surBouton: "#14261c", fond: VERT, survolBouton: LIN, survolTexte: VERT, largeur: "440px" });
    const tete = k.row([logo, k.col([abo], { flexBasis: "0px", flexGrow: 1.4, minWidth: "280px", alignItems: "flex-end" })], { gap: "28px 48px", alignItems: "center", width: "100%" });
    const st = { taille: 16, couleur: LIN, poids: "500", survol: { color: OR, transform: { x: 6 } }, focus: OR };
    const cols = k.row([
      colTitre(k, "Par pièce", L(k, [["Salon", "/boutique"], ["Chambre", "/boutique"], ["Cuisine et repas", "/boutique"], ["Bureau", "/boutique"], ["Extérieur", "/boutique"]], st), { titre: OR }),
      colTitre(k, "Service client", L(k, [["Livraison", "/faq"], ["Montage", "/catalogue"], ["Retours", "/catalogue"], ["Garanties", "/catalogue"], ["FAQ", "/faq"]], st), { titre: OR }),
      k.col([caps(k, "Nous trouver", { couleur: OR }), coordonnees(k, { couleur: LIN, lien: LIN, survol: OR, focus: OR, taille: 15 })], { gap: "8px", flexBasis: "0px", flexGrow: 1.3, minWidth: "190px" }),
    ], { gap: "28px 32px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 3, minWidth: "300px", width: "auto" });
    const scene = k.col([A.une(k, A.salon())], { flexBasis: "0px", flexGrow: 2, minWidth: "280px", maxWidth: "560px", width: "100%" });
    const corps = k.row([cols, scene], { gap: "32px 56px", alignItems: "flex-start", width: "100%" });
    const icones = k.row([pastilles(k, env, { couleur: LIN, fond: "#2a5240", survolFond: OR, survolCouleur: "#14261c", focus: OR })], { width: "100%", justifyContent: "flex-start" });
    const b1 = G.bande(k, [tete, trait(k, "#f4efe366"), corps, icones], { fond: VERT, colonne: true, gap: "34px", padV: ["56px", "44px", "32px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Marque, lettre et colonnes" });
    const bas = G.bande(k, [legale(k, env, { couleur: "#cfe0d2", liens: LIN, center: true })], { fond: "#14261c", colonne: true, padV: ["22px", "20px", "18px"], padB: ["18px", "16px", "14px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, bas])];
  },
}, FAM);

// ═══ ft2-412 « Casa Quadra » — capture 39 : carte sombre posée sur un aplat vif (dégradé orangé) ; en tête une frise de huit carreaux dessinés ═══
const quadra = identite({ key: "c412", label: "Ocre vif et noir encre", humeur: "dark", fond: "#e09a2d", texte: "#161616", discret: "#3a2a0c", accent: "#ffcf70", surface: "#f2b657", encre: "#161616", surEncre: "#f7efe0", police: "font.manrope", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#16161655" });
const casaQuadra = modeleV2({
  id: identifiantV2(412, "casa-quadra"), concept: "c-412-casa-quadra", name: "Casa Quadra", family: FAM,
  description: "Pour un showroom de design d'intérieur : une carte noir encre posée sur un aplat ocre dégradé vers l'orange, ouverte par une frise de huit carreaux graphiques dessinés, puis nom, rubriques, horaires, contact, lettre et réseaux en pastilles. Angles droits.",
  tags: ["showroom", "design d'intérieur", "carte sur aplat", "carreaux dessinés", "ocre", "noir", "horaires"],
  identity: quadra, racine: racineDe("#e0701d"), widgets: ["text", "link", "html", "bizhours", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#161616", PAP = "#f7efe0", OC = "#ffcf70";
    const frise = k.col(A.vue(k, A.carreaux(8, 160), A.carreaux(4, 97.5)), { width: "100%", gap: "0px" });
    const nom = k.col([souffle(carre(k, OC, "14px"), 3400), G.geant("<p>Casa<br>Quadra</p>", { taille: [40, 76], lh: 0.96, suivi: "-0.02em", poids: "400", police: S.head, couleur: OC })(k, env), para(k, "Showroom de design d'intérieur.", { couleur: "#d7cdb8", taille: 14 })], { gap: "14px", flexBasis: "0px", flexGrow: 1.4, minWidth: "220px" });
    const st = { taille: 16, couleur: PAP, poids: "600", survol: { color: OC, transform: { x: 5 } }, focus: OC };
    const c1 = colTitre(k, "Collections", L(k, [["Salon", "/boutique"], ["Chambre", "/boutique"], ["Cuisine", "/boutique"], ["Luminaires", "/boutique"]], st), { titre: OC });
    const c2 = k.col([caps(k, "Horaires", { couleur: OC }), horaires(k, { couleur: PAP, taille: 14 })], { gap: "6px", flexBasis: "0px", flexGrow: 1.2, minWidth: "200px" });
    const c3 = k.col([caps(k, "Contact", { couleur: OC }), coordonnees(k, { couleur: PAP, lien: PAP, survol: OC, focus: OC, taille: 14 })], { gap: "6px", flexBasis: "0px", flexGrow: 1.2, minWidth: "200px" });
    const ligne1 = k.row([nom, c1, c2, c3], { gap: "28px 36px", alignItems: "flex-start", width: "100%", paddingTop: "36px", paddingBottom: "8px", paddingLeft: "36px", paddingRight: "36px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: "28px" });
    const abo = boite(k, env, G, { titre: "Lettre du showroom", intro: "Nouveautés et inspirations.", bouton: "OK", accent: OC, texte: PAP, surBouton: ENC, fond: ENC, survolBouton: PAP, survolTexte: ENC, largeur: "420px" });
    const ligne2 = k.row([k.col([abo], { flexBasis: "0px", flexGrow: 1, minWidth: "260px" }), pastilles(k, env, { couleur: PAP, fond: "#262626", survolFond: OC, survolCouleur: ENC, focus: OC })], { gap: "20px 40px", alignItems: "center", justifyContent: "space-between", width: "100%", paddingTop: "12px", paddingBottom: "20px", paddingLeft: "36px", paddingRight: "36px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const bas = k.col([legale(k, env, { couleur: PAP, liens: PAP })], { backgroundColor: "#262626", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "36px", paddingRight: "36px", width: "100%" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const carte = k.col([frise, ligne1, trait(k, "#f7efe044"), ligne2, bas], { gap: "0px", width: "100%", backgroundColor: ENC });
    const b1 = G.bande(k, [carte], { fond: "#e09a2d", degrade: { from: "#f2b657", to: "#e0701d", angle: 160 }, colonne: true, padV: ["56px", "40px", "24px"], padB: ["56px", "40px", "24px"], padH: ["48px", "32px", "14px"], nom: "Carte" });
    return [G.racine(k, [b1])];
  },
}, FAM);

// ═══ ft2-413 « Atelier Sorel » — capture 37 : très grand nom en bas de page rogné, planche d'atelier dessinée (plans cotés) au centre, sommaire en haut ═══
const sorel = identite({ key: "c413", label: "Blanc cassé, noir et vermillon", humeur: "light", fond: "#faf8f3", texte: "#141414", discret: "#55524b", accent: "#d8391c", surface: "#efebe2", encre: "#141414", police: "font.inter", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#14141433" });
const atelierSorel = modeleV2({
  id: identifiantV2(413, "atelier-sorel"), concept: "c-413-atelier-sorel", name: "Atelier Sorel", family: FAM,
  description: "Pour un atelier de mobilier sur mesure : sommaire de cinq lignes qui se remplissent de vermillon, planche d'atelier dessinée (table, chaise, bibliothèque cotées), nom monumental rogné en bas. Angles droits.",
  tags: ["mobilier sur mesure", "planche dessinée", "plans cotés", "nom monumental", "sommaire", "vermillon"],
  identity: sorel, racine: racineDe("#faf8f3"), widgets: ["text", "link", "html", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#141414", VER = "#d8391c";
    const ligneIdx = (num, l, u) => {
      const t = k.LINK(l, u, compact({ fontFamily: S.head, fontSize: "fluid:28-44", lineHeight: 1.05, color: ENC, textDecoration: "none", display: "flex", alignItems: "center", minHeight: "44px", flexGrow: 1, transitionDuration: DOUX }));
      GK.fini(k, t, { hover: { color: "#ffffff" }, focus: GK.focus("#ffffff") });
      const r2 = k.row([caps(k, num, { couleur: "#55524b", extra: { minWidth: "28px" } }), t], { gap: "14px", alignItems: "center", width: "100%", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px", transitionDuration: DOUX });
      r2.states = { hover: { backgroundColor: VER, paddingLeft: "32px" } };
      return r2;
    };
    const rows = [["01", "Salons", "/boutique"], ["02", "Chambres", "/boutique"], ["03", "Cuisines", "/boutique"], ["04", "Bureaux", "/boutique"], ["05", "Jardins", "/boutique"]].flatMap(([n, l, u]) => [ligneIdx(n, l, u), trait(k, "#14141455")]);
    const index = k.col([trait(k, ENC, "2px"), ...rows], { gap: "0px", flexBasis: "0px", flexGrow: 3, minWidth: "280px" });
    const mot = k.col([caps(k, "Atelier Sorel · mobilier sur mesure", { couleur: ENC }), k.T("<p>Des meubles dessinés pour une seule maison, fabriqués à l'atelier.</p>", { fontFamily: S.head, fontSize: "26px", fontStyle: "italic", lineHeight: 1.2, color: ENC, maxWidth: "360px" }), k.col(L(k, [["Devis gratuit", "/contact"], ["Livraison", "/faq"], ["Entretien", "/faq"], ["Contact", "/contact"]], { taille: 15, poids: "700", couleur: ENC, soulign: true, survol: { color: VER }, focus: VER }), { gap: "0px" }), G.reseauxTexte(RS, { couleur: ENC, survol: VER, focus: VER })(k, env)], { gap: "18px", flexBasis: "0px", flexGrow: 2, minWidth: "260px" });
    const b1 = G.bande(k, [mot, index], { fond: "#faf8f3", gap: "32px 64px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["32px", "28px", "24px"], padH: ["40px", "28px", "16px"], nom: "Sommaire" });
    const b2 = G.bande(k, A.vue(k, A.planche(1280, 230), A.planche(390, 150, true)), { fond: "#efebe2", colonne: true, padV: ["24px", "20px", "14px"], padB: ["24px", "20px", "14px"], padH: ["20px", "16px", "8px"], nom: "Planche d'atelier" });
    const nom = G.nomRogne("SOREL", { taille: [90, 200], visible: 0.8, couleur: VER, police: S.head, poids: "400", suivi: "-0.02em" })(k);
    const b3 = G.bande(k, [nom], { fond: "#faf8f3", colonne: true, padV: ["32px", "24px", "20px"], padB: ["0px", "0px", "0px"], padH: ["40px", "28px", "16px"], nom: "Nom monumental" });
    const b4 = G.bande(k, [trait(k, "#14141455"), legale(k, env, { couleur: "#55524b", liens: ENC })], { fond: "#faf8f3", colonne: true, padV: ["22px", "20px", "18px"], padB: ["18px", "16px", "14px"], padH: ["40px", "28px", "16px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2, b3, b4])];
  },
}, FAM);

// ═══ ft2-414 « Maison Delorme » — capture 38 : fond sombre prune, logo bicolore, lettre à droite, colonnes + médaillon dessiné, bande ondulée en bas ═══
const delorme = identite({ key: "c414", label: "Prune profond et rose ancien", humeur: "dark", fond: "#1d0d15", texte: "#f4e6e1", discret: "#d9bfc6", accent: "#e58fa6", surface: "#3b1f2b", encre: "#2b1420", police: "font.lora", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f4e6e155" });
const maisonDelorme = modeleV2({
  id: identifiantV2(414, "maison-delorme"), concept: "c-414-maison-delorme", name: "Maison Delorme", family: FAM,
  description: "Pour une maison de décoration et d'art de la table : fond prune, logo bicolore, médaillon dessiné (assiette, couverts, fleurs), lettre, colonnes, horaires et bande ondulée rose ancien. Angles droits.",
  tags: ["décoration", "art de la table", "médaillon dessiné", "vagues", "prune", "rose ancien", "horaires"],
  identity: delorme, racine: racineDe("#1d0d15"), widgets: ["text", "link", "html", "emailsubscribe", "bizhours", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, PR = "#2b1420", CR = "#f4e6e1", RO = "#e58fa6";
    const logo = G.geant("<p>Maison <span style=\"color:#e58fa6;font-style:italic\">Delorme</span></p>", { taille: [38, 84], lh: 1, suivi: "0em", poids: "600", police: S.head, couleur: CR })(k, env);
    const abo = boite(k, env, G, { titre: "Lettre de la maison", intro: "Nouvelles pièces et idées de table, quelques fois par an.", bouton: "OK", accent: RO, texte: CR, surBouton: PR, fond: PR, survolBouton: CR, survolTexte: PR, largeur: "420px" });
    const st = { taille: 17, couleur: CR, poids: "500", police: S.head, survol: { color: RO, transform: { x: 5 } }, focus: RO };
    const tete = k.row([k.col([logo], { flexBasis: "0px", flexGrow: 2, minWidth: "280px" }), k.col([abo], { flexBasis: "0px", flexGrow: 1.4, minWidth: "280px", alignItems: "flex-end" })], { gap: "28px 48px", alignItems: "center", width: "100%" });
    const cols = k.row([
      colTitre(k, "Collections", L(k, [["Art de la table", "/boutique"], ["Objets", "/boutique"], ["Cadeaux", "/catalogue"], ["Liste de mariage", "/catalogue"]], st), { titre: RO }),
      colTitre(k, "Conseils", L(k, [["Dresser la table", "/blog"], ["Entretien", "/blog"], ["Livraison", "/faq"], ["Contact", "/contact"]], st), { titre: RO }),
      k.col([caps(k, "Heures d'ouverture", { couleur: RO }), horaires(k, { couleur: CR, taille: 14 })], { gap: "8px", flexBasis: "0px", flexGrow: 1.3, minWidth: "200px" }),
    ], { gap: "28px 32px", alignItems: "flex-start", width: "100%" });
    const bt = lien(k, "Prendre rendez-vous", "/catalogue", { taille: 14, poids: "700", couleur: PR, casse: "uppercase", suivi: "0.14em", h: "52px", padH: "28px", survol: { backgroundColor: CR, transform: { y: -2 } }, focus: CR, extra: { backgroundColor: RO, justifyContent: "center", alignSelf: "flex-start" } });
    souffle(bt, 4200);
    const med = k.col([A.une(k, A.medaillon())], { flexBasis: "0px", flexGrow: 1, minWidth: "200px", maxWidth: "280px", width: "100%" });
    const parole = k.col([caps(k, "Décoration · art de la table", { couleur: RO, suivi: "0.24em" }), k.T("<p>Une table dressée, c'est déjà une manière d'accueillir.</p>", { fontFamily: S.head, fontSize: "fluid:24-40", fontStyle: "italic", lineHeight: 1.15, color: CR, maxWidth: "520px" }), bt, pastilles(k, env, { couleur: CR, contour: "#f4e6e199", survolFond: RO, survolCouleur: PR, focus: RO })], { gap: "18px", flexBasis: "0px", flexGrow: 3, minWidth: "260px", alignItems: "flex-start" });
    const b1 = G.bande(k, [tete, trait(k, "#f4e6e155"), cols], { fond: PR, colonne: true, gap: "32px", padV: ["56px", "44px", "32px"], padB: ["36px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Logo, lettre et colonnes" });
    const b1b = G.bande(k, [med, parole], { fond: PR, gap: "28px 56px", aligne: "center", padV: ["0px", "0px", "0px"], padB: ["36px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Médaillon" });
    const b2 = G.bande(k, A.vue(k, A.vagues(1280, 130, ["#4a2434", "#7a3a4f", "#e58fa6"]), A.vagues(390, 90, ["#4a2434", "#7a3a4f", "#e58fa6"])), { fond: PR, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Vagues" });
    const b3 = G.bande(k, [legale(k, env, { couleur: "#d9bfc6", liens: CR, center: true })], { fond: "#1d0d15", colonne: true, padV: ["20px", "18px", "16px"], padB: ["16px", "14px", "12px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, b1b, b2, b3])];
  },
}, FAM);

// ═══ ft2-415 « Brasse et Noyer » — capture 39 : carte noyer posée sur un aplat dégradé sable-laiton ; coupe d'un tronc de noyer dessinée à gauche ═══
const noyer = identite({ key: "c415", label: "Noyer, laiton et sable", humeur: "light", fond: "#d9a441", texte: "#2a1d15", discret: "#4d3b2b", accent: "#2a1d15", surface: "#efe3c8", encre: "#2a1d15", police: "font.work-sans", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f5ecdd55" });
const brasseNoyer = modeleV2({
  id: identifiantV2(415, "brasse-et-noyer"), concept: "c-415-brasse-et-noyer", name: "Brasse et Noyer", family: FAM,
  description: "Pour un ébéniste ou un magasin de meubles en bois : une carte noyer très sombre posée sur un aplat dégradé sable vers laiton, la coupe d'un tronc dessinée (cernes) à gauche avec le nom, lettre d'information, trois colonnes et réseaux en pastilles. Angles droits.",
  tags: ["ébéniste", "meubles en bois", "carte sur aplat", "cernes du bois", "noyer", "laiton", "lettre"],
  identity: noyer, racine: racineDe("#c98f2b"), widgets: ["text", "link", "html", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CR = "#f5ecdd", LAI = "#d9a441", ENC = "#2a1d15";
    const logo = G.geant("<p>Brasse<br><span style=\"color:#d9a441\">&amp; Noyer</span></p>", { taille: [38, 76], lh: 0.98, suivi: "-0.01em", poids: "500", police: S.head, couleur: CR })(k, env);
    const gauche = k.col([A.une(k, A.cernes(), { maxWidth: "340px" }), caps(k, "Ébénisterie et bois massif", { couleur: LAI }), logo], { gap: "18px", flexBasis: "0px", flexGrow: 1, minWidth: "260px", maxWidth: "380px", alignItems: "flex-start" });
    const abo = boite(k, env, G, { titre: "Lettre de l'atelier", intro: "Nouvelles pièces et entretien du bois.", bouton: "OK", accent: LAI, texte: CR, surBouton: ENC, fond: ENC, survolBouton: CR, survolTexte: ENC, largeur: "480px" });
    const st = { taille: 16, couleur: CR, poids: "500", survol: { color: LAI, transform: { x: 5 } }, focus: LAI };
    const droite = k.row([k.col([abo], { flexBasis: "100%", flexGrow: 1 }),
      colTitre(k, "Catalogue", L(k, [["Tables", "/boutique"], ["Chaises", "/boutique"], ["Rangements", "/boutique"], ["Sur mesure", "/contact"]], st), { titre: LAI }),
      colTitre(k, "L'atelier", L(k, [["Entretien du bois", "/blog"], ["Livraison", "/faq"], ["Questions", "/faq"], ["Contact", "/contact"]], st), { titre: LAI }),
      colTitre(k, "Suivre", [pastilles(k, env, { couleur: CR, fond: "#3a2a20", survolFond: LAI, survolCouleur: ENC, focus: LAI })], { titre: LAI, min: "160px" }),
    ], { gap: "28px 32px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 2, minWidth: "300px" });
    const corps = k.row([gauche, droite], { gap: "36px 56px", alignItems: "flex-start", width: "100%", paddingTop: "44px", paddingBottom: "28px", paddingLeft: "44px", paddingRight: "44px" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "18px", paddingRight: "18px", paddingTop: "28px" });
    const bas = k.col([legale(k, env, { couleur: "#dccdb6", liens: CR })], { backgroundColor: "#1f150f", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "44px", paddingRight: "44px", width: "100%" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "18px", paddingRight: "18px" });
    const carte = k.col([corps, bas], { gap: "0px", width: "100%", backgroundColor: ENC });
    const b1 = G.bande(k, [carte], { fond: "#d9a441", degrade: { from: "#efe3c8", to: "#c98f2b", angle: 135 }, colonne: true, padV: ["56px", "40px", "24px"], padB: ["56px", "40px", "24px"], padH: ["48px", "32px", "14px"], nom: "Carte" });
    return [G.racine(k, [b1])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Maison, mobilier et déco", target: 6, built: true,
  description: "Pieds de boutiques de meubles, linge, luminaires et décoration : nom monumental sur scène dessinée, logo épais et lettre, carte sur aplat ; illustrations vectorielles ; angles droits.",
  models: [linTerre, verdierInterieurs, casaQuadra, atelierSorel, maisonDelorme, brasseNoyer],
};
