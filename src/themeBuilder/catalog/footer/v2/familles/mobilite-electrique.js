// Famille v2 « Mobilité électrique et vélos » — 6 modèles (ft2-416 à ft2-421), refonte « illustrée » : chaque pied reprend le PARTI PRIS VISUEL d'une capture (37 : nom monumental + grande scène ; 38 : logo épais, lettre en haut à droite, colonnes ; 39 : carte sombre sur aplat dégradé) avec ses propres dessins vectoriels (vélo, ville, éclair, station de recharge, route, courbe de puissance : voir ../aides-illus-a12.js). ANGLES DROITS partout.
// Contenu utile et réel (liens de la plateforme, coordonnées et horaires des « Données de l'entreprise », lettre, mentions légales) ; marques fictives ; AUCUNE coordonnée ni chiffre inventé. Adresses de réseaux : exemples.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; au moins une animation visible par modèle (carré ou bouton qui « respire »). Pas d'animation d'entrée, pas de défilement continu.
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
const caseDe = (k, enfants, st = {}, mob, hover) => { const n = k.col(enfants, compact({ flexBasis: "0px", flexGrow: 1, flexShrink: 1, minWidth: "240px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", alignItems: "flex-start", borderRadius: "0px", transitionDuration: DOUX, ...st }), undefined, mob); if (hover) n.states = { hover }; return n; };
const reseaux = (k, env, liste, o) => GK.reseauxTexte(liste, o)(k, env);
const RS = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Pinterest", "https://www.pinterest.com/"]];
const legale = (k, env, o) => GK.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);


const A = require("../aides-illus-a12");
const RESEAUX = ["instagram", "facebook", "youtube"];
const FAM = "mobilite-electrique";
const lienListe = (k, liste, o = {}) => liste.map(([l, u]) => lien(k, l, u, o));
const colTitre = (k, titre, enfants, o = {}) => k.col([caps(k, titre, { couleur: o.titre, police: o.police }), ...enfants], { gap: "4px", flexBasis: "0px", flexGrow: o.poids || 1, minWidth: o.min || "150px" });
// Boîte « lettre » à la manière de la capture 38 : champ blanc à angles droits, bouton franc
function boite(k, env, G, o) {
  const abo = lettre(k, env, G, { titre: o.titre, intro: o.intro, bouton: o.bouton || "OK", accent: o.accent, texte: o.texte, surBouton: o.surBouton, fond: o.fond, survolBouton: o.survolBouton || o.texte, survolTexte: o.survolTexte || o.fond, largeur: o.largeur || "440px", fondChamp: "#ffffff", couleurTitre: o.couleurTitre });
  const P = abo.parts;
  P.input.styles.desktop = { ...P.input.styles.desktop, backgroundColor: "#ffffff", color: o.champ || "#111111", borderBottomWidth: "0px", paddingLeft: "16px" };
  return abo;
}
const pastilles = (k, env, o) => A.reseauxIcones(k, env, RESEAUX, { forme: "square", ...o });

// ═══ ft2-416 « Volt Atelier » — capture 37 : aplat sombre, nom MONUMENTAL citron en tête, vélo électrique dessiné dans un halo lumineux, colonnes en bas ═══
const volt = identite({ key: "c416", label: "Charbon et citron vif", humeur: "dark", fond: "#14161a", texte: "#f3f4ef", discret: "#b9bcb2", accent: "#c6f432", surface: "#1e2126", encre: "#14161a", police: "font.dm-sans", titres: "font.unbounded", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f3f4ef44" });
const voltAtelier = modeleV2({
  id: identifiantV2(416, "volt-atelier"), concept: "c-416-volt-atelier", name: "Volt Atelier", family: FAM,
  description: "Pour un vélociste électrique : nom « Volt » monumental citron sur charbon, grand vélo dessiné dans un halo vert, bouton d'essai, puis quatre colonnes (vélos, atelier, horaires, lettre) et réseaux en pastilles. Angles droits.",
  tags: ["vélos électriques", "vélociste", "nom monumental", "vélo dessiné", "halo", "citron", "charbon", "lettre"],
  identity: volt, racine: racineDe("#0d0f12"), widgets: ["text", "link", "html", "emailsubscribe", "bizhours", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CIT = "#c6f432", CH = "#14161a", BL = "#f3f4ef";
    const haut = k.row([k.row([souffle(carre(k, CIT, "14px"), 3200), caps(k, "Atelier · vélos électriques", { couleur: BL })], { gap: "10px", alignItems: "center" }), caps(k, "Essais, entretien, pièces", { couleur: "#b9bcb2" })], { justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" });
    const nom = G.geant("<p>Volt<span style=\"font-size:0.3em;vertical-align:top\">®</span></p>", { taille: [80, 200], lh: 0.9, suivi: "-0.05em", poids: "700", police: S.head, couleur: CIT })(k, env);
        const bt = lien(k, "Réserver un essai", "/contact", { taille: 15, poids: "800", couleur: CH, casse: "uppercase", suivi: "0.08em", h: "56px", padH: "28px", survol: { backgroundColor: BL, color: CH, transform: { x: 6 } }, focus: BL, extra: { backgroundColor: CIT, justifyContent: "center", alignSelf: "flex-start" } });
    souffle(bt, 3800);
    const abo = boite(k, env, G, { titre: "Lettre de l'atelier", intro: "Nouveaux modèles et conseils d'entretien.", bouton: "OK", accent: CIT, texte: BL, surBouton: CH, fond: "#0d0f12", survolBouton: BL, survolTexte: CH, largeur: "400px" });
    const texte = k.col([k.T("<p>Roulez sans effort, réparez sans attendre.</p>", { fontFamily: S.head, fontSize: "fluid:24-40", lineHeight: 1.1, color: BL, maxWidth: "420px" }), para(k, "Vélos urbains, cargos et pliants, avec un atelier qui entretient la batterie comme le reste.", { couleur: "#b9bcb2", largeur: "380px" }), bt, abo, pastilles(k, env, { couleur: BL, fond: "#1e2126", survolFond: CIT, survolCouleur: CH, focus: CIT })], { gap: "18px", flexBasis: "0px", flexGrow: 1, minWidth: "260px" });
    const velo = k.col([A.une(k, A.velo(BL, CIT))], { flexBasis: "0px", flexGrow: 1.6, minWidth: "260px", width: "100%" });
    const b2 = G.bande(k, [haut, nom, k.row([texte, velo], { gap: "24px 56px", alignItems: "center", width: "100%" })], { fond: CH, degrade: { from: "#14161a", to: "#34430a", angle: 180 }, colonne: true, gap: "16px", padV: ["36px", "32px", "24px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Marque, halo et vélo" });
    const st = { taille: 16, couleur: BL, poids: "500", survol: { color: CIT, transform: { x: 6 } }, focus: CIT };
    const cols = k.row([
      colTitre(k, "Vélos", lienListe(k, [["Urbains", "/boutique"], ["Cargos", "/boutique"], ["Pliants", "/boutique"], ["Tout-terrain", "/boutique"]], st), { titre: CIT }),
      colTitre(k, "Atelier", lienListe(k, [["Entretien", "/faq"], ["Réparation", "/catalogue"], ["Batteries", "/catalogue"], ["Contact", "/contact"]], st), { titre: CIT }),
      k.col([caps(k, "Horaires", { couleur: CIT }), horaires(k, { couleur: BL, taille: 14 })], { gap: "8px", flexBasis: "0px", flexGrow: 1.2, minWidth: "200px" }),
    ], { gap: "28px 36px", alignItems: "flex-start", width: "100%" });
    const b3 = G.bande(k, [cols, trait(k, "#f3f4ef33"), legale(k, env, { couleur: "#b9bcb2", liens: BL })], { fond: "#0d0f12", colonne: true, gap: "26px", padV: ["44px", "36px", "28px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Colonnes et mentions" });
    return [G.racine(k, [b2, b3])];
  },
}, FAM);

// ═══ ft2-417 « Pédale Urbaine » — capture 37 : aplat vif turquoise, nom monumental, grande scène de ville dessinée (immeubles, piste, cycliste), pied sombre ═══
const urbaine = identite({ key: "c417", label: "Turquoise et encre", humeur: "dark", fond: "#04202a", texte: "#ffffff", discret: "#cfe9ec", accent: "#58d3d0", surface: "#073a46", encre: "#04202a", police: "font.rubik", titres: "font.oswald", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#04202a55" });
const pedaleUrbaine = modeleV2({
  id: identifiantV2(417, "pedale-urbaine"), concept: "c-417-pedale-urbaine", name: "Pédale Urbaine", family: FAM,
  description: "Pour un loueur de vélos en libre-service : nom monumental en capitales sur aplat turquoise, grande ville dessinée (immeubles, piste cyclable, cycliste), puis pied sombre avec rubriques, bouton de compte et réseaux en pastilles. Angles droits.",
  tags: ["location de vélos", "mobilité douce", "nom monumental", "ville dessinée", "turquoise", "piste cyclable"],
  identity: urbaine, racine: racineDe("#04202a"), widgets: ["text", "link", "html", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#04202a", BL = "#ffffff";
    const haut = k.row([caps(k, "Mobilité douce · vélos en libre-service", { couleur: ENC }), caps(k, "Coopérative de quartier", { couleur: ENC })], { justifyContent: "space-between", alignItems: "center", gap: "10px", width: "100%" });
    const nom = G.geant("<p>PÉDALE URBAINE<span style=\"font-size:0.22em;vertical-align:top\">®</span></p>", { taille: [60, 176], lh: 0.95, suivi: "-0.01em", poids: "700", police: S.head, couleur: ENC })(k, env);
    const b1 = G.bande(k, [haut, nom], { fond: "#00a6a6", colonne: true, gap: "14px", padV: ["32px", "28px", "24px"], padB: ["12px", "10px", "8px"], padH: ["48px", "32px", "20px"], nom: "Nom" });
    const b2 = G.bande(k, A.vue(k, A.ville(1280, 300), A.ville(390, 200)), { fond: "#00a6a6", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Ville" });
    const marque = k.row([carre(k, "#58d3d0", "16px"), k.T("<p>Pédale Urbaine</p>", { fontFamily: S.head, fontSize: "26px", fontWeight: "700", letterSpacing: "0.04em", color: BL, textTransform: "uppercase" })], { gap: "12px", alignItems: "center" });
    souffle(marque.children[0], 3600);
    const nav = k.row(lienListe(k, [["Stations", "/blog"], ["Abonnements", "/catalogue"], ["Aide", "/faq"], ["Entreprises", "/catalogue"], ["Contact", "/contact"]], { taille: 15, poids: "600", couleur: BL, casse: "uppercase", suivi: "0.08em", survol: { color: "#58d3d0", transform: { y: -3 } }, focus: "#58d3d0" }), { gap: "0px 28px", alignItems: "center", flexWrap: "wrap" });
    const bt = lien(k, "Créer mon compte", "/catalogue", { taille: 14, poids: "700", couleur: ENC, h: "48px", padH: "24px", survol: { backgroundColor: "#58d3d0", color: ENC }, focus: BL, extra: { backgroundColor: BL, justifyContent: "center" } });
    souffle(bt, 4000);
    const b3 = G.bande(k, [marque, nav, bt, pastilles(k, env, { couleur: BL, contour: "#ffffff88", survolFond: "#58d3d0", survolCouleur: ENC, focus: BL })], { fond: ENC, gap: "20px 36px", aligne: "center", padV: ["32px", "28px", "24px"], padB: ["16px", "14px", "12px"], padH: ["48px", "32px", "20px"], nom: "Barre" });
    const b4 = G.bande(k, [trait(k, "#ffffff44"), legale(k, env, { couleur: "#cfe9ec", liens: BL })], { fond: ENC, colonne: true, gap: "14px", padV: ["0px", "0px", "0px"], padB: ["22px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2, b3, b4])];
  },
}, FAM);

// ═══ ft2-418 « Kilowatt Club » — capture 38 : fond sombre, logo épais bicolore en haut à gauche, lettre à droite, filet, colonnes ; ici un éclair géant dans un carré orange ═══
const kilowatt = identite({ key: "c418", label: "Orange vif et graphite", humeur: "dark", fond: "#111111", texte: "#f5f5f5", discret: "#bdbdbd", accent: "#ff5a1f", surface: "#1d1d1d", encre: "#111111", police: "font.epilogue", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f5f5f544" });
const kilowattClub = modeleV2({
  id: identifiantV2(418, "kilowatt-club"), concept: "c-418-kilowatt-club", name: "Kilowatt Club", family: FAM,
  description: "Pour une marque de scooters et motos électriques : fond graphite, logo épais blanc et orange, lettre à droite, éclair géant dessiné dans des anneaux orange, trois colonnes et réseaux en pastilles. Angles droits.",
  tags: ["scooters électriques", "motos électriques", "logo épais", "éclair dessiné", "orange", "graphite", "lettre"],
  identity: kilowatt, racine: racineDe("#0a0a0a"), widgets: ["text", "link", "html", "emailsubscribe", "bizcontact", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OR = "#ff5a1f", GR = "#111111", BL = "#f5f5f5";
    const logo = G.geant("<p>KILOWATT <span style=\"color:#ff5a1f\">CLUB</span></p>", { taille: [34, 84], lh: 1, suivi: "0.01em", poids: "400", police: S.head, couleur: BL })(k, env);
    const abo = boite(k, env, G, { titre: "Lettre du club", intro: "Sorties du club, nouveautés et conseils de sécurité.", bouton: "OK", accent: OR, texte: BL, surBouton: GR, fond: GR, survolBouton: BL, survolTexte: GR, largeur: "440px" });
    const st = { taille: 17, couleur: BL, poids: "600", survol: { color: OR, transform: { x: 6 } }, focus: OR };
    const eclair = k.col([A.une(k, A.eclair())], { flexBasis: "0px", flexGrow: 1, minWidth: "240px", maxWidth: "380px", width: "100%" });
    const droite = k.col([caps(k, "Scooters et motos électriques", { couleur: OR }), logo, abo, pastilles(k, env, { couleur: BL, fond: "#1d1d1d", survolFond: OR, survolCouleur: GR, focus: OR })], { gap: "22px", flexBasis: "0px", flexGrow: 2, minWidth: "280px", alignItems: "flex-start" });
    const liste = k.col([caps(k, "Rubriques", { couleur: OR }), ...lienListe(k, [["Scooters", "/catalogue"], ["Motos", "/catalogue"], ["Recharge", "/catalogue"], ["Équipement", "/catalogue"], ["Assurance", "/catalogue"], ["Entretien", "/faq"], ["Questions", "/faq"], ["Contact", "/contact"]], { ...st, bloc: true }), trait(k, "#f5f5f544"), coordonnees(k, { couleur: BL, lien: BL, survol: OR, focus: OR, taille: 14 })], { gap: "2px", flexBasis: "0px", flexGrow: 0.9, minWidth: "220px" });
    const b1 = G.bande(k, [eclair, droite, liste], { fond: GR, gap: "36px 56px", aligne: "center", padV: ["56px", "44px", "32px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "Éclair, logo, lettre et rubriques" });
    const b2 = G.bande(k, [legale(k, env, { couleur: "#bdbdbd", liens: BL, center: true })], { fond: "#0a0a0a", colonne: true, padV: ["20px", "18px", "16px"], padB: ["16px", "14px", "12px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

// ═══ ft2-419 « Borne et Cie » — capture 39 : carte sombre posée sur un aplat violet-jaune dégradé ; en tête une station de recharge dessinée ═══
const borne = identite({ key: "c419", label: "Violet, jaune et blanc cassé", humeur: "dark", fond: "#4b2bd6", texte: "#ffffff", discret: "#cfcbe6", accent: "#ffd400", surface: "#2a2650", encre: "#17142b", police: "font.outfit", titres: "font.syne", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#17142b33" });
const borneCie = modeleV2({
  id: identifiantV2(419, "borne-et-cie"), concept: "c-419-borne-et-cie", name: "Borne et Cie", family: FAM,
  description: "Pour un réseau de bornes de recharge : carte bleu nuit sur aplat dégradé violet-jaune, station de recharge dessinée (bornes, voitures, immeubles), logo, rubriques, horaires, contact et lettre. Angles droits.",
  tags: ["bornes de recharge", "installateur", "carte sur aplat", "station dessinée", "violet", "jaune", "horaires", "contact"],
  identity: borne, racine: racineDe("#4b2bd6"), widgets: ["text", "link", "html", "bizhours", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, VI = "#4b2bd6", JA = "#ffd400", EN = "#17142b", BL = "#ffffff";
    const scene = k.col([A.une(k, A.station())], { width: "100%" });
    const logo = k.col([souffle(carre(k, JA, "14px"), 3200), G.geant("<p>Borne <span style=\"color:#ffd400\">&amp; Cie</span></p>", { taille: [36, 72], lh: 0.98, suivi: "-0.03em", poids: "700", police: S.head, couleur: BL })(k, env), para(k, "Recharge et installation.", { couleur: "#cfcbe6", taille: 14 })], { gap: "12px", flexBasis: "0px", flexGrow: 1.3, minWidth: "220px" });
    const st = { taille: 16, couleur: BL, poids: "600", survol: { color: JA, transform: { x: 5 } }, focus: JA };
    const c1 = colTitre(k, "Rubriques", lienListe(k, [["Bornes", "/catalogue"], ["Installation", "/catalogue"], ["Aides", "/catalogue"], ["FAQ", "/faq"]], st), { titre: JA });
    const c2 = k.col([caps(k, "Horaires", { couleur: JA }), horaires(k, { couleur: BL, taille: 14 })], { gap: "6px", flexBasis: "0px", flexGrow: 1.2, minWidth: "200px" });
    const c3 = k.col([caps(k, "Contact", { couleur: JA }), coordonnees(k, { couleur: BL, lien: BL, survol: JA, focus: JA, taille: 14 })], { gap: "6px", flexBasis: "0px", flexGrow: 1.2, minWidth: "200px" });
    const abo = boite(k, env, G, { titre: "Lettre de la borne", intro: "Nouvelles stations et conseils de recharge.", bouton: "OK", accent: JA, texte: BL, surBouton: EN, fond: EN, survolBouton: BL, survolTexte: EN, largeur: "460px" });
    const gauche = k.col([logo, trait(k, "#ffffff33"), c1, c2, pastilles(k, env, { couleur: BL, fond: "#2a2650", survolFond: JA, survolCouleur: EN, focus: JA })], { gap: "20px", flexBasis: "0px", flexGrow: 1, minWidth: "240px", paddingTop: "36px", paddingBottom: "32px", paddingLeft: "36px", paddingRight: "28px", alignItems: "flex-start" }, { paddingLeft: "24px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const droite = k.col([scene, k.col([abo, caps(k, "Contact", { couleur: JA }), coordonnees(k, { couleur: BL, lien: BL, survol: JA, focus: JA, taille: 14 })], { gap: "16px", width: "100%", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "28px", paddingRight: "36px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px" })], { gap: "0px", flexBasis: "0px", flexGrow: 1.7, minWidth: "300px", backgroundColor: "#211d45" });
    const bas = k.col([legale(k, env, { couleur: "#cfcbe6", liens: BL })], { backgroundColor: "#0f0d20", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "36px", paddingRight: "36px", width: "100%" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const carte = k.col([k.row([gauche, droite], { gap: "0px", alignItems: "stretch", width: "100%" }), bas], { gap: "0px", width: "100%", backgroundColor: EN });
    const b1 = G.bande(k, [carte], { fond: "#4b2bd6", degrade: { from: "#4b2bd6", to: "#ffd400", angle: 135 }, colonne: true, padV: ["56px", "40px", "24px"], padB: ["56px", "40px", "24px"], padH: ["48px", "32px", "14px"], nom: "Carte" });
    return [G.racine(k, [b1])];
  },
}, FAM);

// ═══ ft2-420 « Trajet » — capture 39 : carte marine sur dégradé bleu-corail ; une route dessinée relie les quatre étapes (chacune un lien) ═══
const trajet = identite({ key: "c420", label: "Bleu océan et corail", humeur: "dark", fond: "#0a3d62", texte: "#f4f9fc", discret: "#c4dbea", accent: "#ff8a6b", surface: "#0f5486", encre: "#0a3d62", police: "font.red-hat-display", titres: "font.sora", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#f4f9fc55" });
const trajetModele = modeleV2({
  id: identifiantV2(420, "trajet"), concept: "c-420-trajet", name: "Trajet", family: FAM,
  description: "Pour un concessionnaire de vélos électriques : carte marine sur dégradé bleu-corail, route dessinée reliant quatre étapes (choisir, essayer, acheter, entretenir), puis coordonnées, lettre et réseaux en pastilles. Angles droits.",
  tags: ["concessionnaire", "route dessinée", "étapes", "carte sur aplat", "bleu océan", "corail", "contact"],
  identity: trajet, racine: racineDe("#a8452d"), widgets: ["text", "link", "html", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CO = "#ff8a6b", BL = "#f4f9fc", CA = "#071f33";
    const m = { paddingLeft: "40px", paddingRight: "40px" }, mt = { paddingLeft: "28px", paddingRight: "28px" }, mm = { paddingLeft: "16px", paddingRight: "16px" };
    const titre = G.geant("<p>De l'envie au guidon,<br>en quatre étapes.</p>", { taille: [28, 56], lh: 1.05, suivi: "-0.02em", poids: "600", police: S.head, couleur: BL })(k, env);
    const guide = lien(k, "Lire le guide d'achat", "/faq", { taille: 15, poids: "700", couleur: "#0a3d62", h: "52px", padH: "24px", survol: { backgroundColor: BL, transform: { y: -2 } }, focus: BL, extra: { backgroundColor: CO, justifyContent: "center" } });
    souffle(guide, 4000);
    const tete = k.row([titre, guide], { justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px", width: "100%", paddingTop: "36px", ...m }, mt, mm);
    const route = k.col(A.vue(k, A.route(1200, 150, [52, 332, 612, 892], [96, 56, 96, 56]), A.route(390, 120, [30, 120, 210, 300], [74, 44, 74, 44])), { width: "100%", gap: "0px" });
    const etape = (n, l, sous, u, allume) => k.col([k.row([caps(k, n, { couleur: CO }), lien(k, l, u, { taille: 22, couleur: BL, poids: "700", police: S.head, survol: { color: CO, transform: { y: -3 } }, focus: CO })], { gap: "10px", alignItems: "baseline", flexWrap: "wrap" }), para(k, sous, { couleur: "#c4dbea", taille: 14, largeur: "230px" })], { flexBasis: "0px", flexGrow: 1, minWidth: "200px", gap: "4px", alignItems: "flex-start" });
    const frise = k.row([etape("1", "Choisir", "Un guide par usage : ville, charge, loisir.", "/faq"), etape("2", "Essayer", "Réservez un essai en magasin.", "/contact"), etape("3", "Acheter", "Paiement, livraison et mise en route.", "/boutique"), etape("4", "Entretenir", "Révision, pièces et batterie.", "/faq")], { gap: "20px 20px", alignItems: "flex-start", width: "100%", paddingTop: "14px", paddingBottom: "28px", ...m }, mt, mm);
    const abo = boite(k, env, G, { titre: "Lettre du concessionnaire", intro: "Nouveaux modèles, journées d'essai.", bouton: "OK", accent: CO, texte: BL, surBouton: "#0a3d62", fond: CA, survolBouton: BL, survolTexte: CA, largeur: "420px" });
    const adr = k.col([caps(k, "Nous trouver", { couleur: CO }), coordonnees(k, { couleur: BL, lien: BL, survol: CO, focus: CO, taille: 14 })], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "240px" });
    const ligne2 = k.row([adr, k.col([abo], { flexBasis: "0px", flexGrow: 1.3, minWidth: "260px" }), pastilles(k, env, { couleur: BL, contour: "#f4f9fc88", survolFond: CO, survolCouleur: "#0a3d62", focus: CO })], { gap: "24px 40px", alignItems: "center", width: "100%", paddingTop: "20px", paddingBottom: "24px", ...m }, mt, mm);
    const bas = k.col([legale(k, env, { couleur: "#c4dbea", liens: BL })], { backgroundColor: "#04141f", paddingTop: "16px", paddingBottom: "16px", ...m, width: "100%" }, mt, mm);
    const carte = k.col([tete, route, frise, trait(k, "#f4f9fc44"), ligne2, bas], { gap: "0px", width: "100%", backgroundColor: CA });
    const b1 = G.bande(k, [carte], { fond: "#a8452d", degrade: { from: "#0a3d62", to: "#ff8a6b", angle: 160 }, colonne: true, padV: ["56px", "40px", "24px"], padB: ["56px", "40px", "24px"], padH: ["48px", "32px", "14px"], nom: "Carte" });
    return [G.racine(k, [b1])];
  },
}, FAM);

// ═══ ft2-421 « Console Wattmètre » — capture 38 : fond sombre, logo épais bicolore, lettre en haut à droite, filet, colonnes de commandes ; ici + une courbe de puissance et une jauge dessinées ═══
const console_ = identite({ key: "c421", label: "Noir console et ambre", humeur: "dark", fond: "#0d1117", texte: "#e6edf3", discret: "#a7b1bd", accent: "#ffb000", surface: "#161b22", encre: "#0d1117", police: "font.space-grotesk", titres: "font.jetbrains-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", bordure: "1px", ligne: "#e6edf344" });
const consoleWattmetre = modeleV2({
  id: identifiantV2(421, "console-wattmetre"), concept: "c-421-console-wattmetre", name: "Console Wattmètre", family: FAM,
  description: "Pour une plateforme de suivi de recharge : fond noir console, logo monospace bicolore, lettre à droite, panneau dessiné (courbe de puissance, jauge de charge), commandes et réseaux en pastilles. Angles droits.",
  tags: ["flotte électrique", "recharge", "console", "courbe de puissance", "jauge", "ambre", "lettre"],
  identity: console_, racine: racineDe("#070a0e"), widgets: ["text", "link", "html", "emailsubscribe", "bizcontact", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, AM = "#ffb000", BG = "#0d1117", PN = "#161b22", BL = "#e6edf3", MO = S.head;
    const logo = G.geant("<p>watt<span style=\"color:#ffb000\">mètre</span><span style=\"color:#ffb000\">_</span></p>", { taille: [30, 72], lh: 1, suivi: "-0.04em", poids: "800", police: MO, couleur: BL })(k, env);
    const abo = boite(k, env, G, { titre: "s'abonner --lettre", intro: "Nouveautés de la plateforme, sans spam.", bouton: "OK", accent: AM, texte: BL, surBouton: BG, fond: BG, survolBouton: BL, survolTexte: BG, largeur: "420px", couleurTitre: AM });
    const tete = k.row([k.col([logo], { flexBasis: "0px", flexGrow: 2, minWidth: "260px" }), k.col([abo], { flexBasis: "0px", flexGrow: 1.4, minWidth: "280px", alignItems: "flex-end" })], { gap: "28px 48px", alignItems: "center", width: "100%" });
    const panneau = k.col(A.vue(k, A.wattmetre(1200, 170, true), A.wattmetre(390, 120, false)), { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "1px", borderColor: "#e6edf355" });
    const cmd = (c, l, u) => k.col([k.T(`<p>$ ${c}</p>`, { fontFamily: MO, fontSize: "12px", color: AM }), lien(k, l, u, { taille: 16, couleur: BL, poids: "600", police: MO, soulign: true, survol: { color: AM, transform: { x: 6 } }, focus: AM })], { gap: "0px", width: "100%" });
    const cols = k.row([
      k.col([cmd("ouvrir --suivi", "Suivi de recharge", "/faq"), cmd("ouvrir --flotte", "Gestion de flotte", "/catalogue")], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "200px" }),
      k.col([cmd("ouvrir --bornes", "Carte des bornes", "/catalogue"), cmd("ouvrir --aide", "Documentation", "/catalogue")], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "200px" }),
      k.col([caps(k, "contact", { couleur: AM, police: MO, suivi: "0.04em" }), coordonnees(k, { couleur: BL, lien: BL, survol: AM, focus: AM, taille: 14 })], { gap: "8px", flexBasis: "0px", flexGrow: 1.2, minWidth: "200px" }),
      k.col([caps(k, "suivre", { couleur: AM, police: MO, suivi: "0.04em" }), pastilles(k, env, { couleur: BL, fond: PN, contour: "#e6edf355", survolFond: AM, survolCouleur: BG, focus: AM })], { gap: "10px", flexBasis: "0px", flexGrow: 0.8, minWidth: "170px" }),
    ], { gap: "24px 32px", alignItems: "flex-start", width: "100%" });
    const b1 = G.bande(k, [tete, panneau, cols, trait(k, "#e6edf333")], { fond: BG, colonne: true, gap: "32px", padV: ["52px", "40px", "30px"], padB: ["20px", "16px", "14px"], padH: ["48px", "32px", "20px"], nom: "Logo, mesure et commandes" });
    const b2 = G.bande(k, [legale(k, env, { couleur: "#a7b1bd", liens: BL, center: true })], { fond: BG, colonne: true, padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Mobilité électrique et vélos", target: 6, built: true,
  description: "Pieds de vélocistes, scooters, bornes de recharge et flottes électriques : nom monumental sur scène dessinée, logo épais et lettre, carte sur aplat dégradé ; illustrations vectorielles ; angles droits.",
  models: [voltAtelier, pedaleUrbaine, kilowattClub, borneCie, trajetModele, consoleWattmetre],
};
