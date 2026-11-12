// Famille v2 « Maison, mobilier et déco » — 6 modèles (ft2-410 à ft2-415), série « inspirée de captures » : ANGLES DROITS partout (aucun border-radius), un archétype de composition différent par modèle
// (B monogramme monumental · E deux demi-pages · C damier de cases · G index en lignes · J papier à en-tête · L escalier). Pieds de boutique de meubles, linge, luminaires, décoration, atelier d'ébénisterie.
// Idées reprises des captures (jamais copiées : autres couleurs, autres marques fictives, aucune photo) : nom de marque monumental (37), bandeau lettre d'information en tête + colonnes de liens + réseaux (38), carte sombre posée sur un aplat de couleur (39).
// Contenu utile et réel (liens de la plateforme, coordonnées et horaires des « Données de l'entreprise », lettre, mentions légales) ; marques fictives ; AUCUNE coordonnée ni chiffre inventé. Adresses de réseaux : exemples.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 6 px, filet qui s'étire) ; au moins une animation visible par modèle (carré qui « respire », ligne d'index qui s'inverse, case qui s'éclaircit, bouton qui s'inverse).
// Limites du moteur : pas d'animation d'entrée, pas de défilement continu.
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

const FAM = "maison-deco";

// ═══ ft2-410 « Lin et Terre » — archétype B : nom monumental seul, très peu de liens, grand vide (inspiré de la capture 37) ═══
const terre = identite({ key: "c410", label: "Terre cuite et lin", humeur: "dark", fond: "#a8472a", texte: "#fff4e6", discret: "#fbe3cf", accent: "#ffd9a0", surface: "#8f3b22", encre: "#2b1208", police: "font.dm-sans", titres: "font.dm-serif-display", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#fff4e655" });
const linTerre = modeleV2({
  id: identifiantV2(410, "lin-et-terre"), concept: "c-410-lin-et-terre", name: "Lin et Terre", family: FAM,
  description: "Pour une boutique de linge de maison et de poterie : le nom de la marque en lettres monumentales sur un aplat terre cuite, quatre liens discrets, réseaux en texte. Très peu d'éléments, beaucoup de vide, angles droits.",
  tags: ["linge de maison", "poterie", "nom monumental", "terre cuite", "angles droits", "minimal"],
  identity: terre, racine: racineDe("#a8472a"), widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CR = "#fff4e6", SOMBRE = "#8f3b22";
    const haut = k.row([k.row([souffle(carre(k, "#ffd9a0", "12px"), 3600), caps(k, "Maison, linge et poterie", { couleur: CR })], { gap: "12px", alignItems: "center" }), G.reseauxTexte(RS, { couleur: CR, survol: "#ffd9a0", focus: CR })(k, env)], { justifyContent: "space-between", gap: "16px", alignItems: "center", width: "100%" });
    const nom = G.nomRogne("Lin&nbsp;&amp;&nbsp;Terre", { taille: [52, 190], visible: 0.8, couleur: CR, police: S.head, poids: "400", suivi: "-0.03em" })(k);
    const b1 = G.bande(k, [haut, trait(k, "#fff4e655"), nom], { colonne: true, fond: "#a8472a", gap: "40px", padV: ["56px", "48px", "36px"], padB: ["0px", "0px", "0px"], padH: ["48px", "32px", "20px"], nom: "Marque" });
    const liens = k.row(["Boutique:/boutique", "Livraison:/faq", "Retours:/faq", "Nous écrire:/contact"].map((x) => { const [l, u] = x.split(":"); return lien(k, l, u, { taille: 15, couleur: CR, poids: "600", survol: { color: "#ffd9a0", transform: { y: -3 } }, focus: CR }); }), { gap: "4px 36px", alignItems: "center", justifyContent: "flex-end", width: "auto" });
    const mot = para(k, "Du linge qui vieillit bien, de la terre cuite faite pour servir.", { couleur: "#fbe3cf", taille: 16, largeur: "340px", police: S.head, style: "italic" });
    const b2 = G.bande(k, [k.row([k.col([caps(k, "L'esprit", { couleur: CR }), mot], { gap: "8px", flexGrow: 2, flexBasis: "0px", minWidth: "260px" }), trait(k, "#fff4e655"), k.col([caps(k, "S'y retrouver", { couleur: CR }), liens], { gap: "8px", flexGrow: 1, flexBasis: "0px", minWidth: "260px", alignItems: "center" })], { justifyContent: "space-between", alignItems: "center", gap: "16px 40px", width: "100%" }), legale(k, env, { couleur: "#fbe3cf", liens: CR })], { colonne: true, fond: SOMBRE, gap: "20px", padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Liens et mentions" });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

// ═══ ft2-411 « Verdier Intérieurs » — archétype E : deux demi-pages bord à bord de couleurs opposées (inspiré de la capture 38) ═══
const verdier = identite({ key: "c411", label: "Vert sapin et lin clair", humeur: "dark", fond: "#1f3d2e", texte: "#f4efe3", discret: "#cfe0d2", accent: "#e9c46a", surface: "#2a5240", encre: "#14261c", police: "font.karla", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f4efe355" });
const verdierInterieurs = modeleV2({
  id: identifiantV2(411, "verdier-interieurs"), concept: "c-411-verdier-interieurs", name: "Verdier Intérieurs", family: FAM,
  description: "Pour un magasin de meubles et de décoration : deux demi-pages bord à bord, message et lettre d'information sur le vert sapin à gauche, liens par pièce et coordonnées sur le lin clair à droite. Net, chaleureux, angles droits.",
  tags: ["meubles", "décoration", "deux demi-pages", "vert sapin", "lettre", "contact", "angles droits"],
  identity: verdier, racine: racineDe("#14261c"), widgets: ["text", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, LIN = "#f4efe3", VERT = "#1f3d2e", OR = "#e9c46a";
    const phrase = G.geant("<p>Chez vous,<br>en mieux.</p>", { taille: [44, 84], lh: 1.02, suivi: "-0.02em", poids: "500", police: S.head, couleur: LIN })(k, env);
    const abo = lettre(k, env, G, { titre: "Lettre de la maison", intro: "Nouveautés, conseils d'aménagement et ventes privées. Un message par mois.", bouton: "Je m'inscris", accent: OR, texte: LIN, surBouton: "#14261c", fond: VERT, survolBouton: LIN, survolTexte: VERT, largeur: "440px" });
    const engag = k.row(["Conseil gratuit:/contact", "Service après-vente:/contact", "Paiement en plusieurs fois:/faq"].map((x) => { const [l, u] = x.split(":"); return lien(k, l, u, { taille: 14, couleur: LIN, soulign: true, survol: { color: OR }, focus: OR }); }), { gap: "0px 24px", alignItems: "center", flexWrap: "wrap" });
    const gauche = k.col([k.row([caps(k, "Verdier Intérieurs", { couleur: OR }), carre(k, OR, "10px")], { gap: "10px", alignItems: "center" }), phrase, k.col([abo], { borderStyle: "solid", borderWidth: "1px", borderColor: "#f4efe366", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", width: "100%", maxWidth: "500px", gap: "8px" }), trait(k, "#f4efe344"), k.row([engag], { gap: "0px", width: "100%" })], { flexBasis: "0px", flexGrow: 1, minWidth: "320px", backgroundColor: VERT, paddingTop: "80px", paddingBottom: "72px", paddingLeft: "64px", paddingRight: "56px", gap: "26px", justifyContent: "space-between", alignItems: "flex-start" }, { paddingLeft: "32px", paddingRight: "32px", paddingTop: "56px", paddingBottom: "48px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px", paddingBottom: "36px" });
    const L = (liste) => k.col(liste.map(([l, u]) => lien(k, l, u, { taille: 17, couleur: "#1f3d2e", poids: "600", survol: { color: "#8a4b12", transform: { x: 6 } }, focus: "#1f3d2e" })), { gap: "2px" });
    const pieces = k.col([caps(k, "Par pièce", { couleur: "#4a5a4f" }), L([["Salon", "/boutique"], ["Chambre", "/boutique"], ["Cuisine et repas", "/boutique"], ["Bureau", "/boutique"], ["Extérieur", "/boutique"]])], { gap: "10px", flexBasis: "0px", flexGrow: 1, minWidth: "160px" });
    const aide = k.col([caps(k, "Service client", { couleur: "#4a5a4f" }), L([["Livraison", "/faq"], ["Montage", "/catalogue"], ["Retours", "/catalogue"], ["Garanties", "/catalogue"], ["FAQ", "/faq"]])], { gap: "10px", flexBasis: "0px", flexGrow: 1, minWidth: "160px" });
    const coord = k.col([caps(k, "Nous trouver", { couleur: "#4a5a4f" }), coordonnees(k, { couleur: "#1f3d2e", taille: 16, lien: "#1f3d2e", survol: "#8a4b12", focus: "#1f3d2e" })], { gap: "10px", width: "100%" });
    const bt = lien(k, "Prendre rendez-vous avec un conseiller", "/catalogue", { taille: 15, poids: "700", couleur: LIN, h: "52px", padH: "24px", survol: { backgroundColor: "#8a4b12", color: "#ffffff", transform: { y: -2 } }, focus: VERT, extra: { backgroundColor: VERT, justifyContent: "center" } });
    souffle(bt, 4200);
    const rs = G.reseauxTexte(RS, { couleur: VERT, survol: "#8a4b12", focus: VERT })(k, env);
    const droite = k.col([coord, trait(k, "#1f3d2e55"), k.row([pieces, aide], { gap: "28px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }), trait(k, "#1f3d2e55"), k.row([rs, bt], { gap: "20px 32px", alignItems: "center", justifyContent: "space-between", width: "100%" })], { flexBasis: "0px", flexGrow: 1, minWidth: "320px", backgroundColor: LIN, paddingTop: "80px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "64px", gap: "28px", alignItems: "flex-start" }, { paddingLeft: "32px", paddingRight: "32px", paddingTop: "56px", paddingBottom: "48px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px", paddingBottom: "36px" });
    const bas = G.bande(k, [legale(k, env, { couleur: "#cfe0d2", liens: LIN })], { fond: "#14261c", colonne: true, padV: ["24px", "22px", "20px"], padB: ["20px", "18px", "16px"], padH: ["64px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [plein([gauche, droite]), bas])];
  },
}, FAM);

// ═══ ft2-412 « Casa Quadra » — archétype C : damier de 8 cases carrées, chacune un lien ou une information (carte sombre sur aplat, capture 39) ═══
const quadra = identite({ key: "c412", label: "Ocre vif et noir encre", humeur: "dark", fond: "#e09a2d", texte: "#161616", discret: "#3a2a0c", accent: "#ffcf70", surface: "#f2b657", encre: "#161616", surEncre: "#f7efe0", police: "font.manrope", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#16161655" });
const casaQuadra = modeleV2({
  id: identifiantV2(412, "casa-quadra"), concept: "c-412-casa-quadra", name: "Casa Quadra", family: FAM,
  description: "Pour un showroom de design d'intérieur : un damier de huit cases carrées noir encre sur aplat ocre, où chaque case est un lien (salon, chambre, cuisine, livraison) ou une information (horaires, contact, lettre). Franc, graphique, angles droits.",
  tags: ["showroom", "design d'intérieur", "damier", "ocre", "noir", "cases", "horaires", "contact", "lettre"],
  identity: quadra, racine: racineDe("#e09a2d"), widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENC = "#161616", ENC2 = "#262626", PAP = "#f7efe0", OC = "#ffcf70";
    const cible = (titre, sous, url, fond, couleur, accent) => caseDe(k, [k.LINK(titre, url, compact({ fontFamily: S.head, fontSize: "26px", lineHeight: 1.1, color: couleur, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "44px" })), para(k, sous, { couleur, taille: 14 })].map((n, i) => (i === 0 ? GK.fini(k, n, { hover: { color: accent, textDecoration: "underline" }, focus: GK.focus(accent) }) : n)), { backgroundColor: fond, minHeight: "190px", justifyContent: "space-between" }, undefined, { backgroundColor: fond === ENC ? ENC2 : fond });
    const c1 = caseDe(k, [caps(k, "Showroom", { couleur: ENC }), souffle(carre(k, ENC, "14px"), 3400), G.geant("<p>Casa<br>Quadra</p>", { taille: [36, 56], lh: 0.98, suivi: "-0.02em", poids: "400", police: S.head, couleur: ENC })(k, env)], { backgroundColor: OC, minHeight: "190px", justifyContent: "space-between" });
    const c2 = caseDe(k, [caps(k, "01", { couleur: OC }), k.row([lien(k, "Salon", "/boutique", { taille: 26, couleur: PAP, poids: "400", police: S.head, survol: { color: OC, transform: { x: 6 } }, focus: OC }), lien(k, "Canapés", "/boutique", { taille: 14, couleur: PAP, soulign: true, survol: { color: OC }, focus: OC })], { gap: "6px 20px", alignItems: "center" })], { backgroundColor: ENC, minHeight: "190px", justifyContent: "space-between" }, undefined, { backgroundColor: ENC2 });
    const c3 = cible("Chambre", "Lits, literie, armoires, chevets.", "/boutique", ENC2, PAP, OC);
    const c4 = cible("Cuisine", "Tables, chaises, luminaires de repas.", "/boutique", ENC, PAP, OC);
    const c5 = caseDe(k, [caps(k, "Horaires", { couleur: OC }), horaires(k, { couleur: PAP, taille: 15 })], { backgroundColor: ENC2, minHeight: "190px" });
    const c6 = caseDe(k, [caps(k, "Contact", { couleur: OC }), coordonnees(k, { couleur: PAP, lien: PAP, survol: OC, focus: OC, taille: 15 })], { backgroundColor: ENC, minHeight: "190px" });
    const c7 = caseDe(k, [caps(k, "Service", { couleur: OC }), k.col([lien(k, "Livraison", "/faq", { couleur: PAP, poids: "700", bloc: true, survol: { color: OC, transform: { x: 4 } }, focus: OC }), trait(k, "#f7efe055"), lien(k, "Montage", "/catalogue", { couleur: PAP, poids: "700", bloc: true, survol: { color: OC, transform: { x: 4 } }, focus: OC }), trait(k, "#f7efe055"), lien(k, "Retours", "/catalogue", { couleur: PAP, poids: "700", bloc: true, survol: { color: OC, transform: { x: 4 } }, focus: OC })], { gap: "0px", width: "100%" })], { backgroundColor: ENC2, minHeight: "190px" });
    const abo = lettre(k, env, G, { titre: "Lettre", intro: "Nouveautés du showroom.", bouton: "OK", accent: OC, texte: PAP, surBouton: ENC, fond: ENC, survolBouton: PAP, survolTexte: ENC, largeur: "100%" });
    const c8 = caseDe(k, [abo], { backgroundColor: ENC, minHeight: "190px", justifyContent: "center" });
    const g1 = k.row([c1, c2, c3, c4], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" }), g2 = k.row([c5, c6, c7, c8], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const legal412 = k.col([legale(k, env, { couleur: PAP, liens: PAP })], { backgroundColor: ENC, paddingTop: "18px", paddingBottom: "18px", paddingLeft: "28px", paddingRight: "28px", width: "100%" });
    const grille = G.bande(k, [k.col([g1, g2, legal412], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "6px", borderColor: ENC, backgroundColor: ENC })], { fond: "#e09a2d", colonne: true, padV: ["56px", "40px", "28px"], padB: ["40px", "32px", "24px"], padH: ["48px", "32px", "16px"], nom: "Damier" });
    return [G.racine(k, [grille])];
  },
}, FAM);

// ═══ ft2-413 « Atelier Sorel » — archétype G : index en lignes pleine largeur (grand libellé, filet), aucune carte ═══
const sorel = identite({ key: "c413", label: "Blanc cassé, noir et vermillon", humeur: "light", fond: "#faf8f3", texte: "#141414", discret: "#55524b", accent: "#d8391c", surface: "#efebe2", encre: "#141414", police: "font.inter", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#14141433" });
const atelierSorel = modeleV2({
  id: identifiantV2(413, "atelier-sorel"), concept: "c-413-atelier-sorel", name: "Atelier Sorel", family: FAM,
  description: "Pour un atelier de mobilier sur mesure : un sommaire en grandes lignes pleine largeur (salons, chambres, cuisines, bureaux, jardins), chaque ligne se remplit de vermillon au survol. Sans cartes, typographie serif monumentale, angles droits.",
  tags: ["mobilier sur mesure", "index", "sommaire", "serif", "vermillon", "angles droits"],
  identity: sorel, racine: racineDe("#faf8f3"), widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#141414", VER = "#d8391c";
    const tete = k.row([caps(k, "Atelier Sorel · mobilier sur mesure", { couleur: ENC }), G.reseauxTexte(RS, { couleur: ENC, survol: VER, focus: VER })(k, env)], { justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" });
    const ligneIdx = (num, l, u, aide) => {
      const t = k.LINK(l, u, compact({ fontFamily: S.head, fontSize: "fluid:34-84", lineHeight: 1.05, color: ENC, textDecoration: "none", display: "flex", alignItems: "center", minHeight: "44px", flexGrow: 1, transitionDuration: DOUX }));
      GK.fini(k, t, { hover: { color: "#ffffff" }, focus: GK.focus("#ffffff") });
      const a = para(k, aide, { couleur: "#55524b", taille: 14, largeur: "260px" });
      const r = k.row([caps(k, num, { couleur: "#55524b", extra: { minWidth: "32px" } }), t, a], { gap: "16px", alignItems: "center", flexWrap: "wrap", width: "100%", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: VER, paddingLeft: "40px" } };
      return r;
    };
    const rows = [["01", "Salons", "/boutique", "Canapés, bibliothèques, tables."], ["02", "Chambres", "/boutique", "Lits, dressings, chevets."], ["03", "Cuisines", "/boutique", "Plans de travail, rangements."], ["04", "Bureaux", "/boutique", "Plateaux, étagères, caissons."], ["05", "Jardins", "/boutique", "Bancs, tables, pergolas."]].flatMap(([n, l, u, a], i) => [ligneIdx(n, l, u, a), trait(k, "#14141455")]);
    const index = k.col([trait(k, ENC, "2px"), ...rows], { gap: "0px", width: "100%" });
    const aide = k.row([["Devis gratuit", "/contact"], ["Livraison", "/faq"], ["Entretien", "/faq"], ["Contact", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 15, poids: "700", couleur: ENC, soulign: true, survol: { color: VER }, focus: VER })), { gap: "0px 28px", alignItems: "center", width: "100%" });
    const b1 = G.bande(k, [caps(k, "Atelier Sorel · mobilier sur mesure", { couleur: ENC }), index, k.row([aide, G.reseauxTexte(RS, { couleur: ENC, survol: VER, focus: VER })(k, env)], { justifyContent: "space-between", alignItems: "center", gap: "8px 32px", width: "100%" }), legale(k, env, { couleur: "#55524b", liens: ENC })], { colonne: true, fond: "#faf8f3", gap: "20px", padV: ["48px", "40px", "32px"], padB: ["28px", "24px", "20px"], padH: ["40px", "28px", "16px"], nom: "Sommaire" });
    return [G.racine(k, [b1])];
  },
}, FAM);

// ═══ ft2-414 « Maison Delorme » — archétype J : papier à en-tête, cartouche d'adresse centré, filets doubles, liens en ligne centrée ═══
const delorme = identite({ key: "c414", label: "Rose poudré, prune et rose ancien", humeur: "light", fond: "#f4e6e1", texte: "#3b1f2b", discret: "#6b4452", accent: "#9a3b52", surface: "#ecd6d0", encre: "#3b1f2b", police: "font.lora", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#3b1f2b44" });
const maisonDelorme = modeleV2({
  id: identifiantV2(414, "maison-delorme"), concept: "c-414-maison-delorme", name: "Maison Delorme", family: FAM,
  description: "Pour une maison de décoration et d'objets d'art de la table : papier à en-tête rose poudré, double filet, nom en Cormorant, cartouche d'adresse centré, une ligne de rubriques et un seul bouton de rendez-vous. Classique, calme, angles droits.",
  tags: ["décoration", "art de la table", "papier à en-tête", "centré", "rose poudré", "double filet", "contact"],
  identity: delorme, racine: racineDe("#f4e6e1"), widgets: ["text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, PR = "#3b1f2b", RO = "#9a3b52";
    const dbl = () => k.col([trait(k, PR, "1px"), trait(k, PR, "1px")], { gap: "4px", width: "100%" });
    const nom = G.geant("<p>Maison Delorme</p>", { taille: [40, 96], lh: 1, suivi: "0.01em", poids: "500", police: S.head, couleur: PR, extra: { textAlign: "center", width: "100%" } })(k, env);
    const sous = caps(k, "Décoration · art de la table · objets", { couleur: RO, suivi: "0.3em", extra: { textAlign: "center", width: "100%" } });
    const cellule = (titre, w) => k.col([caps(k, titre, { couleur: "#6b4452", extra: { textAlign: "center", width: "100%" } }), w], { gap: "10px", alignItems: "center", flexBasis: "0px", flexGrow: 1, minWidth: "220px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px" });
    const cartouche = k.row([cellule("Adresse de la maison", coordonnees(k, { couleur: PR, lien: PR, survol: RO, focus: RO, taille: 16, align: "center" })), cellule("Heures d'ouverture", horaires(k, { couleur: PR, taille: 16, align: "center" }))], { gap: "0px", alignItems: "stretch", width: "100%", maxWidth: "720px", alignSelf: "center", borderStyle: "solid", borderWidth: "1px", borderColor: PR });
    const rub = k.row(["Collections:/boutique", "Cadeaux:/catalogue", "Liste de mariage:/catalogue", "Conseils:/blog"].map((x) => { const [l, u] = x.split(":"); return lien(k, l, u, { taille: 15, couleur: PR, poids: "500", police: S.head, extra: { fontSize: "19px", fontStyle: "italic" }, survol: { color: RO, textDecoration: "underline" }, focus: RO }); }), { gap: "4px 32px", justifyContent: "center", alignItems: "center", width: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre de la maison", intro: "Nouvelles pièces et idées de table, quelques fois par an.", bouton: "S'inscrire", accent: RO, texte: PR, surBouton: "#ffffff", fond: "#f4e6e1", survolBouton: PR, survolTexte: "#ffffff", largeur: "480px" });
    const bt = lien(k, "Prendre rendez-vous", "/catalogue", { taille: 14, poids: "700", couleur: "#ffffff", casse: "uppercase", suivi: "0.16em", h: "52px", padH: "32px", survol: { backgroundColor: PR, color: "#ffffff", transform: { y: -2 } }, focus: PR, extra: { backgroundColor: RO, justifyContent: "center", alignSelf: "center" } });
    souffle(bt, 4200);
    const cadreInt = k.col([sous, nom, rub, trait(k, "#3b1f2b55"), abo, cartouche, bt], { gap: "26px", alignItems: "center", width: "100%", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "32px", paddingRight: "32px", borderStyle: "solid", borderWidth: "1px", borderColor: PR }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "12px", paddingRight: "12px", paddingTop: "28px", paddingBottom: "28px" });
    const b1 = G.bande(k, [cadreInt, G.reseauxTexte(RS, { couleur: PR, survol: RO, focus: RO })(k, env, true), dbl(), legale(k, env, { couleur: "#6b4452", liens: PR, center: true })], { colonne: true, fond: "#f4e6e1", gap: "24px", aligne: "stretch", padV: ["56px", "44px", "32px"], padB: ["28px", "24px", "20px"], padH: ["56px", "32px", "16px"], nom: "En-tête" });
    return [G.racine(k, [b1])];
  },
}, FAM);

// ═══ ft2-415 « Brasse et Noyer » — archétype L : pied en escalier (blocs de largeurs décroissantes alignés à gauche) ═══
const noyer = identite({ key: "c415", label: "Noyer, laiton et sable", humeur: "dark", fond: "#3a2a20", texte: "#f5ecdd", discret: "#dccdb6", accent: "#d9a441", surface: "#5a4030", encre: "#2a1d15", police: "font.work-sans", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f5ecdd55" });
const brasseNoyer = modeleV2({
  id: identifiantV2(415, "brasse-et-noyer"), concept: "c-415-brasse-et-noyer", name: "Brasse et Noyer", family: FAM,
  description: "Pour un ébéniste ou un magasin de meubles en bois : blocs étagés de largeurs décroissantes alignés à gauche, du noyer foncé au laiton, avec nom, rubriques, lettre d'information et mentions sur sable. Chaque marche s'éclaircit au survol. Angles droits.",
  tags: ["ébéniste", "meubles en bois", "escalier", "noyer", "laiton", "sable", "lettre", "angles droits"],
  identity: noyer, racine: racineDe("#e9dcc3"), widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CR = "#f5ecdd", LAI = "#d9a441", ENC = "#2a1d15", SABLE = "#e9dcc3";
    const marche = (largeur, fond, enfants, hover, pad = "36px") => k.col(enfants, { width: largeur, maxWidth: "100%", backgroundColor: fond, paddingTop: pad, paddingBottom: pad, paddingLeft: "56px", paddingRight: "40px", gap: "14px", alignItems: "flex-start", transitionDuration: DOUX, ...(hover ? {} : {}) }, { width: "100%", paddingLeft: "32px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "28px", paddingBottom: "28px" });
    const h1 = G.geant("<p>Brasse &amp; Noyer</p>", { taille: [40, 88], lh: 1, suivi: "-0.01em", poids: "500", police: S.head, couleur: CR })(k, env);
    const m1 = marche("100%", "#3a2a20", [caps(k, "Ébénisterie et mobilier en bois massif", { couleur: LAI }), h1], null, "48px");
    const liens = k.row([["Tables", "/boutique"], ["Chaises", "/boutique"], ["Rangements", "/boutique"], ["Sur mesure", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 17, couleur: CR, poids: "600", survol: { color: LAI, transform: { y: -3 } }, focus: LAI })), { gap: "4px 30px", alignItems: "center" });
    const m2 = marche("78%", "#4a3526", [caps(k, "Le catalogue", { couleur: LAI }), liens]);
    m2.states = { hover: { backgroundColor: "#5a4030" } };
    const abo = lettre(k, env, G, { titre: "Lettre de l'atelier", intro: "Nouvelles pièces et entretien du bois.", bouton: "Recevoir", accent: ENC, texte: ENC, surBouton: LAI, fond: LAI, survolBouton: "#ffffff", survolTexte: ENC, largeur: "360px", couleurTitre: ENC });
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, backgroundColor: ENC, color: LAI };
    abo.parts.button.states = { hover: { backgroundColor: "#ffffff", color: ENC }, focus: GK.focus(ENC) };
    const m3 = marche("56%", LAI, [abo]);
    const m4 = marche("34%", "#e9dcc3", [legale(k, env, { couleur: "#4d3b2b", liens: ENC })], null, "24px");
    m4.styles.desktop = { ...m4.styles.desktop, minWidth: "320px" };
    return [G.racine(k, [m1, m2, m3, m4])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Maison, mobilier et déco", target: 6, built: true,
  description: "Pieds de boutiques de meubles, linge, luminaires et décoration : nom monumental, demi-pages, damier, index, papier à en-tête, escalier ; angles droits.",
  models: [linTerre, verdierInterieurs, casaQuadra, atelierSorel, maisonDelorme, brasseNoyer],
};
