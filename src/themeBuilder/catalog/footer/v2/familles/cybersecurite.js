// Famille v2 « Cybersécurité » — 6 modèles (ft2-284 à ft2-289), série « inspirée de captures » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds d'un cabinet / éditeur de cybersécurité fictif : signalement d'incident, audit, services, documentation, coordonnées (widgets « Données de l'entreprise »), lettre d'information, mentions légales.
// AUCUNE coordonnée, AUCUN chiffre, AUCUNE promesse de protection ni certification inventés ; les intitulés de services sont des EXEMPLES à renommer dans l'éditeur. Adresses de réseaux : exemples.
// Inspirations (captures du propriétaire : colonnes titrées, bandeau en tête, navigation à gauche / contact à droite) : idées de composition seulement, traduites en blocs à angles nets.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 8 px) ; UNE animation visible par modèle : carré d'alerte qui respire, flèche qui glisse, case qui se soulève, rangée qui s'indente.
const FAM = "cybersecurite";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");
const DOUX = 360; // ms : transitions de survol / focus
// ── Aides LOCALES (toutes à angles droits) ────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.55, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, fontWeight: o.poids, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
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
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "700", couleur: o.texte, h: "52px", padH: "28px", casse: o.casse, suivi: o.suivi, police: o.police, survol: o.survol || { backgroundColor: o.texte, color: o.fond, transform: { y: -3 } }, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const reseaux = (k, env, G, o) => G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["GitHub", "https://github.com/"], ["X", "https://x.com/"]], { taille: o.taille || 15, poids: "700", couleur: o.couleur, survol: o.survol, focus: o.focus })(k, env);
const PH = ["48px", "32px", "20px"];
const PLAT = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]];

// ── Aides de la REFONTE « captures » : illustrations vectorielles (aides-illus-a01.js), pastilles, colonnes titrées ───────────────────────────────
const IL = require("../aides-illus-a01");
const pastille = (k, t, u, o) => lien(k, t, u, { taille: 14, poids: "700", couleur: o.texte, h: "44px", padH: "18px", survol: o.survol || { backgroundColor: o.texte, color: o.fond, transform: { y: -2 } }, focus: o.focus || o.texte, extra: { backgroundColor: o.fondP, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.texte, justifyContent: "center" } });
const pastilles = (k, items, o) => k.row(items.map(([t, u]) => pastille(k, t, u, o)), { gap: "12px", flexWrap: "wrap", alignItems: "center" });
const titreCol = (k, t, c, o = {}) => k.T(`<p>${t}</p>`, { fontSize: "26px", lineHeight: 1.2, fontWeight: "700", color: c, fontFamily: k.S.head, ...o });
const colQ = (k, G, enfants, o = {}) => G.colonne(k, enfants, { poids: 1, min: "220px", gap: "16px", ...o });
const monoLiens = (k, items, o) => items.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "600", couleur: o.couleur, survol: { color: o.survol, transform: { x: 6 } }, focus: o.survol, police: o.police, h: o.h || "44px", lh: o.lh, extra: o.extra }));

// ═══ ft2-284 « Ligne de défense » — [capture 04 : carte sombre, bouclier monumental dessiné à gauche, navigation et pastilles à droite, NOM géant fondu dans un halo acide] ═
const defenseId = identite({
  key: "c284", label: "Noir et jaune acide", humeur: "dark",
  fond: "#0a0a0a", texte: "#ffffff", discret: "#bdbdbd", accent: "#c8ff00", surface: "#1a1a1a", encre: "#0a0a0a", surEncre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.league-gothic", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#ffffff44",
});
const ligneDefense = modeleV2({
  id: identifiantV2(284, "ligne-de-defense"), concept: "c-284-ligne-de-defense", name: "Ligne de défense", family: FAM,
  description: "Pour un cabinet de cybersécurité : un grand bouclier dessiné à bandes de chantier à gauche, navigation en lettres condensées et pastilles à droite, puis le nom « Rempart » géant dans un halo jaune acide sur noir.",
  tags: ["cybersécurité", "bouclier", "nom géant", "halo", "noir", "jaune acide", "condensé", "angles droits"],
  identity: defenseId, racine: racineDe("#0a0a0a"),
  widgets: ["html", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, N = "#0a0a0a", L = "#c8ff00";
    const bouclier = G.colonne(k, [IL.noeud(k, IL.bouclier(), { maxWidth: "360px" })], { poids: 3, min: "240px", aligne: "flex-start", soi: "flex-start" });
    const alerte = k.row([souffle(carre(k, L, "12px"), 2400), caps(k, "Signalement d'incident", { couleur: L, suivi: "0.2em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const nav = monoLiens(k, [["Services", "/faq"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]], { taille: 36, poids: "400", couleur: "#ffffff", survol: L, police: S.head, h: "52px", extra: { textTransform: "uppercase" } });
    const droite = G.colonne(k, [alerte, ...nav, pastilles(k, [["Signaler un incident", "/contact"], ["Demander un audit", "/contact"]], { texte: L, fond: N, fondP: "#00000000", bord: L, survol: { backgroundColor: L, color: N, transform: { y: -3 } }, focus: "#ffffff" }), coordonnees(k, { taille: 15, couleur: "#d0d0d0", lien: "#ffffff", survol: L, focus: L })], { poids: 5, min: "300px", gap: "8px", soi: "center" });
    const nom = IL.motBande(k, { u: "r284", nom: "REMPART", police: S.head, poids: 400, haut: "#0a0a0a", bas: "#c8ff00", halo: "#9ccc00", mt: "8px" });
    const haut = G.bande(k, [G.ligne(k, [bouclier, droite], { gap: "24px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { fond: N, colonne: true, max: "1500px", padV: ["56px", "44px", "32px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Bouclier" });
    const nomB = G.bande(k, nom, { fond: N, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Nom géant" });
    const chantier = G.bande(k, IL.bandeSvg(k, IL.chantier, { hL: 28, hE: 18 }).map((n) => n), { fond: N, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Bande de chantier" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d0d0d0", liens: "#ffffff" })(k, env)], { fond: N, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, nomB, chantier, bas])];
  },
}, FAM);

// ═══ ft2-285 « Alerte rouge » — [capture 04 : navigation en grandes capitales, radar dessiné, NOM géant dans un halo rouge sirène] ══════════════════════
const alerteId = identite({
  key: "c285", label: "Rouge sirène et aubergine", humeur: "dark",
  fond: "#14070a", texte: "#fff4f4", discret: "#d1aeb2", accent: "#ff6b73", surface: "#22090e", encre: "#14070a", surEncre: "#fff4f4",
  police: "font.libre-franklin", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#fff4f444",
});
const alerteRouge = modeleV2({
  id: identifiantV2(285, "alerte-rouge"), concept: "c-285-alerte-rouge", name: "Alerte rouge", family: FAM,
  description: "Pour un éditeur de cybersécurité : un radar à balayage dessiné entre la navigation en capitales et les coordonnées, puis le nom « Vigie » géant fondu dans un halo rouge sirène sur dégradé aubergine.",
  tags: ["cybersécurité", "radar", "halo", "nom géant", "rouge", "aubergine", "alerte", "angles droits"],
  identity: alerteId, racine: racineDe("#c1121f"),
  widgets: ["html", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, R = "#ff6b73", F = "#14070a";
    const nav = monoLiens(k, [["Services", "/faq"], ["Actualités", "/blog"], ["Contact", "/contact"], ["Espace client", "/connexion"]], { taille: 34, poids: "400", couleur: "#fff4f4", survol: R, police: S.head, h: "52px", extra: { textTransform: "uppercase" } });
    const gauche = G.colonne(k, [souffle(carre(k, "#ffffff", "14px"), 2200), ...nav], { poids: 4, min: "240px", gap: "4px" });
    const radar = G.colonne(k, [IL.noeud(k, IL.radar(), { maxWidth: "340px" })], { poids: 4, min: "220px", aligne: "center", soi: "center", mobile: { display: "none" } });
    const droite = G.colonne(k, [pastilles(k, [["LinkedIn", "https://www.linkedin.com/"], ["GitHub", "https://github.com/"], ["X", "https://x.com/"]], { texte: "#ffffff", fond: F, fondP: "#14070a66", bord: "#ffffff99", focus: "#ffffff" }), coordonnees(k, { taille: 16, couleur: "#fff4f4", lien: "#ffffff", survol: "#ffd0d3", focus: "#ffffff", align: "right" }), texte(k, "Décrivez la situation : l'équipe vous répondra.", { taille: 15, couleur: "#f6cdd0", align: "right", max: "300px" })], { poids: 4, min: "260px", gap: "20px", aligne: "flex-end", soi: "flex-start", mobile: { alignItems: "flex-start" } });
    const nom = IL.motBande(k, { u: "v285", nom: "VIGIE", police: S.head, poids: 400, haut: "#c1121f", bas: "#ffc2c6", halo: "#ff6b73", mt: "0px" });
    const b1 = G.bande(k, nom, { degrade: { from: "#c1121f", to: "#6e0a12", angle: 180 }, colonne: true, max: "100%", padV: ["24px", "20px", "16px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Nom géant" });
    const haut = G.bande(k, [G.ligne(k, [radar, gauche, droite], { gap: "24px 40px", aligne: "center", largeur: "100%" })], { degrade: { from: "#6e0a12", to: "#14070a", angle: 180 }, colonne: true, max: "1500px", padV: ["40px", "32px", "24px"], padB: ["48px", "40px", "32px"], padH: PH, nom: "Radar" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#ffe0e2", liens: "#ffffff" })(k, env)], { fond: "#14070a", aligne: "center", padV: ["18px", "16px", "14px"], padB: ["18px", "16px", "14px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [b1, haut, bas])];
  },
}, FAM);

// ═══ ft2-286 « Salle des opérations » — [capture 06 : sombre, pastilles en haut, quatre colonnes ; au-dessus, bandeau de maillage de nœuds] ═══════════
const operationsId = identite({
  key: "c286", label: "Indigo, cyan et lavande", humeur: "dark",
  fond: "#10173a", texte: "#f1f3ff", discret: "#b9c1ee", accent: "#38d5e8", surface: "#1b2563", encre: "#10173a", surEncre: "#f1f3ff",
  police: "font.source-sans-3", titres: "font.chivo", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f1f3ff33",
});
const salleOperations = modeleV2({
  id: identifiantV2(286, "salle-des-operations"), concept: "c-286-salle-des-operations", name: "Salle des opérations", family: FAM,
  description: "Pour un centre de cybersécurité : bandeau pleine largeur de maillage de nœuds cyan sur grille indigo, pastilles, puis quatre colonnes titrées (à propos, lettre, grille de quatre vignettes de cartes en points, réseaux).",
  tags: ["cybersécurité", "maillage", "carte", "vignettes", "indigo", "cyan", "colonnes", "angles droits"],
  identity: operationsId, racine: racineDe("#10173a"),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, IND = "#1b2563", FOND = "#10173a", CY = "#38d5e8";
    const maille = G.bande(k, [IL.noeud(k, IL.maillage(), { minHeight: "120px" })], { fond: FOND, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Maillage" });
    const pil = pastilles(k, [["Signaler", "/contact"], ["Audit", "/contact"], ["Guides", "/faq"]], { texte: "#ffffff", fond: FOND, fondP: "#000000", bord: "#000000", survol: { backgroundColor: CY, color: FOND, transform: { y: -2 } }, focus: CY });
    const about = colQ(k, G, [titreCol(k, "À propos", "#ffffff", { fontWeight: "800" }), nomDuSite(k, env, 22, CY, { fontWeight: "800" }), texte(k, "Chaque alerte mérite une réponse.", { taille: 15, couleur: "#d4daf7", max: "300px" }), coordonnees(k, { taille: 15, couleur: "#f1f3ff", lien: "#ffffff", survol: CY, focus: "#ffffff" })], { poids: 1.3 });
    const abo = lettre(k, env, G, { titre: "", intro: "Alertes et bonnes pratiques par e-mail.", bouton: "→", largeur: "340px", accent: CY, surBouton: FOND, texte: "#f1f3ff", fond: FOND, fondChamp: "#000000", survolBouton: "#ffffff", survolTexte: FOND, focus: "#ffffff" });
    const lettreC = colQ(k, G, [titreCol(k, "Lettre d'information", "#ffffff", { fontWeight: "800" }), abo], { poids: 1.3 });
    const suivre = colQ(k, G, [titreCol(k, "Suivez-nous", "#ffffff", { fontWeight: "800" }), reseaux(k, env, G, { couleur: "#f1f3ff", survol: CY, focus: "#ffffff" })], { poids: 1 });
    const V4 = IL.VIGNETTES(k, "points", { bg: "#1b2563", a: "#38d5e8", b: "#8f9cff", c: "#ffffff", d: "#ffffff" }, { t: "100%" });
    const haut2 = G.bande(k, [G.colonne(k, [pil, about], { poids: 1, min: "280px", gap: "28px" }), G.colonne(k, [lettreC, suivre], { poids: 1, min: "300px", gap: "28px" })], { fond: FOND, gap: "32px 64px", aligne: "flex-start", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Contact et lettre" });
    const strip = G.bande(k, [titreCol(k, "Cartes de menaces", "#ffffff", { fontWeight: "800" }), G.ligne(k, V4.map((v) => G.colonne(k, [v], { poids: 1, min: "120px" })), { gap: "8px", aligne: "flex-start", largeur: "100%" })], { fond: FOND, colonne: true, gap: "16px", padV: ["8px", "8px", "8px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Vignettes" });
    const corps = [haut2, strip];
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d4daf7", liens: "#ffffff" })(k, env, true)], { fond: FOND, aligne: "center", justifie: "center", padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [maille, ...corps, bas])];
  },
}, FAM);

// ═══ ft2-287 « Cabinet de sécurité » — [capture 05 en papier à en-tête : sceau guilloché, à propos et liens, large rangée de 4 vignettes d'anneaux, lettre] ═
const cabinetId = identite({
  key: "c287", label: "Crème, marine et bordeaux", humeur: "light",
  fond: "#f5f0e6", texte: "#1a2540", discret: "#4a4f6a", accent: "#8b1a1a", surface: "#ffffff", encre: "#1a2540", surEncre: "#f5f0e6",
  police: "font.karla", titres: "font.libre-baskerville", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1a254066",
});
const cabinetSecurite = modeleV2({
  id: identifiantV2(287, "cabinet-de-securite"), concept: "c-287-cabinet-de-securite", name: "Cabinet de sécurité", family: FAM,
  description: "Pour un cabinet de cybersécurité : papier à en-tête crème, sceau guilloché dessiné, à propos et liens, large rangée de quatre vignettes d'anneaux de chiffrement, filets doubles, lettre du cabinet.",
  tags: ["cybersécurité", "cabinet", "sceau", "guilloché", "vignettes", "serif", "crème", "bordeaux", "angles droits"],
  identity: cabinetId, racine: racineDe("#1a2540"),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENC = "#1a2540", BORD = "#8b1a1a", CREME = "#f5f0e6";
    const doubles = () => k.col([trait(k, ENC, "3px"), trait(k, ENC, "1px")], { gap: "4px", width: "100%" });
    const sceau = G.colonne(k, [IL.noeud(k, IL.sceau(), { maxWidth: "190px" })], { poids: 2, min: "170px", aligne: "flex-start", soi: "flex-start" });
    const propos = G.colonne(k, [nomDuSite(k, env, 36, ENC, { fontFamily: S.head }), caps(k, "Conseil en sécurité des systèmes d'information", { couleur: BORD, suivi: "0.2em" }), coordonnees(k, { taille: 16, couleur: ENC, lien: ENC, survol: BORD, focus: BORD })], { poids: 4, min: "260px", gap: "12px", soi: "center" });
    const liens = G.colonne(k, [titreCol(k, "Le cabinet", BORD, { fontSize: "22px" }), ...monoLiens(k, [["Services", "/faq"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]], { taille: 16, poids: "700", couleur: ENC, survol: BORD })], { poids: 3, min: "220px", gap: "2px" });
    const tete = G.bande(k, [sceau, propos, liens], { fond: CREME, gap: "28px 40px", aligne: "center", max: "1200px", padV: ["56px", "44px", "32px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "En-tête" });
    const V = IL.VIGNETTES(k, "anneaux", { bg: "#efe6d2", a: "#1a2540", b: "#8b1a1a", c: "#4a4f6a", d: "#8b1a1a" }, { t: "100%", bord: ENC });
    const legendes = ["Chiffrement", "Journalisation", "Cloisonnement", "Reprise"];
    const strip = G.ligne(k, V.map((v, i) => G.colonne(k, [v, caps(k, legendes[i], { couleur: ENC, suivi: "0.18em" })], { poids: 1, min: "150px", gap: "10px" })), { gap: "20px", aligne: "flex-start", largeur: "100%" });
    const milieu = G.bande(k, [doubles(), strip, doubles()], { fond: CREME, colonne: true, gap: "24px", max: "1200px", padV: ["8px", "8px", "8px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Vignettes" });
    const abo = lettre(k, env, G, { titre: "Lettre du cabinet", intro: "Un message d'information, de temps en temps.", bouton: "S'abonner", largeur: "420px", accent: "#f0b8b8", surBouton: ENC, texte: "#ffffff", couleurTitre: "#f0b8b8", fond: ENC, survolBouton: "#ffffff", survolTexte: ENC, focus: "#ffffff" });
    const bas = G.bande(k, [souffle(carre(k, "#d9a0a0", "14px"), 3400), abo, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#e3e6f0", liens: "#ffffff" })(k, env, true)], { fond: ENC, colonne: true, aligne: "center", gap: "18px", padV: ["36px", "28px", "24px"], padB: ["22px", "20px", "16px"], padH: PH, nom: "Lettre et mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, milieu, bas])];
  },
}, FAM);

// ═══ ft2-288 « Veille permanente » — [capture 06 compacte : bande oscilloscope ondulée en tête, une rangée de colonnes serrées, vignettes de tracés] ═════
const veilleId = identite({
  key: "c288", label: "Noir graphite et ambre", humeur: "dark",
  fond: "#0b0d10", texte: "#f2f2f2", discret: "#a1a7ae", accent: "#ffb000", surface: "#15181d", encre: "#0b0d10", surEncre: "#f2f2f2",
  police: "font.geist", titres: "font.geist-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#f2f2f244",
});
const veillePermanente = modeleV2({
  id: identifiantV2(288, "veille-permanente"), concept: "c-288-veille-permanente", name: "Veille permanente", family: FAM,
  description: "Pour un éditeur de sécurité : bande ondulée d'oscilloscope ambre pleine largeur, puis une rangée serrée de colonnes (nom et statut, liens, rangée de quatre vignettes de tracés, lettre) sur graphite.",
  tags: ["cybersécurité", "oscilloscope", "bande ondulée", "tracés", "compact", "graphite", "ambre", "angles droits"],
  identity: veilleId, racine: racineDe("#0b0d10"),
  widgets: ["html", "sitetitle", "text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, AMB = "#ffb000", F = "#0b0d10", CL = "#f2f2f2", MU = "#a1a7ae";
    const onde = G.bande(k, IL.bandeSvg(k, IL.oscillo, { hL: 150, hE: 110 }), { fond: F, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], filetHaut: { epaisseur: "4px", couleur: AMB }, nom: "Oscilloscope" });
    const statut = k.row([souffle(carre(k, AMB, "10px"), 2200), lien(k, "Statut", "/faq", { taille: 15, poids: "700", couleur: AMB, survol: { color: "#ffffff", transform: { x: 3 } }, focus: "#ffffff", police: S.head })], { gap: "8px", alignItems: "center", flexWrap: "nowrap" });
    const marque = colQ(k, G, [nomDuSite(k, env, 22, CL, { fontFamily: S.head, textTransform: "uppercase", letterSpacing: "0.08em" }), texte(k, "Détection, journalisation, réponse.", { taille: 14, couleur: MU, max: "260px" }), statut], { poids: 1.2, gap: "12px" });
    const liens = colQ(k, G, [titreCol(k, "Liens", AMB, { fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.12em" }), ...monoLiens(k, [["Services", "/faq"], ["Actualités", "/blog"], ["Contact", "/contact"], ["Espace client", "/connexion"]], { taille: 15, poids: "500", couleur: CL, survol: AMB, police: S.head })], { poids: 1, gap: "0px" });
    const feed = colQ(k, G, [titreCol(k, "Tracés", AMB, { fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.12em" }), k.row(IL.VIGNETTES(k, "trace", { bg: "#15181d", a: "#ffb000", b: "#a1a7ae", c: "#ffffff", d: "#ffffff" }, { t: "72px", bord: "#ffb00088" }), { gap: "10px", flexWrap: "wrap" })], { poids: 1.6, min: "260px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "", intro: "Alertes par e-mail.", bouton: "→", largeur: "300px", accent: AMB, surBouton: F, texte: CL, fond: F, survolBouton: "#ffffff", survolTexte: F, focus: "#ffffff" });
    const lettreC = colQ(k, G, [titreCol(k, "Lettre", AMB, { fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.12em" }), abo], { poids: 1.3, gap: "12px" });
    const cols = G.bande(k, [G.ligne(k, [marque, liens, feed, lettreC], { gap: "32px 32px", aligne: "flex-start", largeur: "100%" })], { fond: F, colonne: true, max: "1500px", padV: ["36px", "32px", "28px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Colonnes serrées" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: MU, liens: CL })(k, env, true)], { fond: F, aligne: "center", justifie: "center", padV: ["6px", "6px", "6px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = CL;
    return [G.racine(k, [onde, cols, bas])];
  },
}, FAM);

// ═══ ft2-289 « Paliers de confinement » — [capture 06 : sombre, pastilles, quatre colonnes décalées en ESCALIER, vignettes de blocs ; bande de cellules emboîtées] ═
const paliersId = identite({
  key: "c289", label: "Acier sombre et orange", humeur: "dark",
  fond: "#14202c", texte: "#e8edf3", discret: "#a9bacb", accent: "#ff8a3d", surface: "#1d3144", encre: "#14202c", surEncre: "#e8edf3",
  police: "font.hanken-grotesk", titres: "font.teko", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#e8edf355",
});
const paliersConfinement = modeleV2({
  id: identifiantV2(289, "paliers-de-confinement"), concept: "c-289-paliers-de-confinement", name: "Paliers de confinement", family: FAM,
  description: "Pour une entreprise de cybersécurité : pied acier sombre à pastilles, quatre colonnes décalées en escalier (à propos, lettre, vignettes de blocs, réseaux) et grande bande de cellules emboîtées en gradins orange.",
  tags: ["cybersécurité", "escalier", "colonnes décalées", "blocs", "cellules", "acier", "orange", "angles droits"],
  identity: paliersId, racine: racineDe("#14202c"),
  widgets: ["html", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENC = "#14202c", OR = "#ff8a3d", CL = "#e8edf3", MU = "#a9bacb";
    const phrase = G.geant("<p>Contenir vite, réparer bien.</p>", { taille: [40, 96], lh: 0.95, suivi: "0em", poids: "600", police: S.head, couleur: CL, extra: { textTransform: "uppercase" } })(k, env);
    const pil = pastilles(k, [["Signaler un incident", "/contact"], ["Services", "/faq"], ["Actualités", "/blog"]], { texte: CL, fond: ENC, fondP: "#0c141c", bord: "#0c141c", survol: { backgroundColor: OR, color: ENC, transform: { y: -2 } }, focus: OR });
    const tete = G.ligne(k, [G.colonne(k, [caps(k, "Cybersécurité", { couleur: OR, suivi: "0.24em" }), phrase], { poids: 4, min: "300px", gap: "12px" }), G.colonne(k, [pil], { poids: 2, min: "280px", aligne: "flex-end", soi: "flex-end", mobile: { alignItems: "flex-start" } })], { gap: "24px 40px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const about = colQ(k, G, [texte(k, "Du premier signalement au retour à la normale, une équipe qui répond.", { taille: 16, couleur: MU, max: "360px" }), coordonnees(k, { taille: 15, couleur: CL, lien: "#ffffff", survol: OR, focus: OR })], { poids: 1, min: "240px", gap: "14px" });
    const abo = lettre(k, env, G, { titre: "", intro: "Alertes et bonnes pratiques.", bouton: "→", largeur: "320px", accent: OR, surBouton: ENC, texte: CL, fond: ENC, fondChamp: "#0c141c", survolBouton: "#ffffff", survolTexte: ENC, focus: "#ffffff" });
    const gche = G.colonne(k, [caps(k, "Cybersécurité", { couleur: OR, suivi: "0.24em" }), phrase, pil, G.ligne(k, [about, colQ(k, G, [abo, souffle(carre(k, OR, "12px"), 2800)], { poids: 1, min: "240px", gap: "14px" })], { gap: "24px 32px", aligne: "flex-start", largeur: "100%" })], { poids: 5, min: "320px", gap: "28px" });
    const paliers = G.colonne(k, [titreCol(k, "Paliers", OR, { fontSize: "34px" }), k.row(IL.VIGNETTES(k, "blocs", { bg: "#1d3144", a: "#47708f", b: "#6f93b0", c: "#a9bacb", d: "#ff8a3d" }, { t: "72px" }), { gap: "10px", flexWrap: "wrap" }), titreCol(k, "Suivez-nous", OR, { fontSize: "34px" }), reseaux(k, env, G, { couleur: CL, survol: OR, focus: OR })], { poids: 3, min: "260px", gap: "18px", extra: { backgroundColor: "#1d3144", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", borderRadius: "0px" } });
    const haut = G.bande(k, [gche, paliers], { fond: ENC, gap: "40px 56px", aligne: "stretch", max: "1500px", padV: ["56px", "44px", "32px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Paliers" });
    const cellules = G.bande(k, IL.bandeSvg(k, IL.cellules, { hL: 220, hE: 150 }), { fond: ENC, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Cellules" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: MU, liens: CL })(k, env, true)], { fond: ENC, aligne: "center", justifie: "center", padV: ["18px", "16px", "14px"], padB: ["18px", "16px", "14px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = CL;
    return [G.racine(k, [haut, cellules, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cybersécurité", target: 6, built: true,
  description: "Pieds de cabinets et d'éditeurs de cybersécurité, angles droits, illustrés : bouclier et nom monumental, radar rouge, maillage de nœuds, sceau guilloché, oscilloscope, escalier de cellules.",
  models: [ligneDefense, alerteRouge, salleOperations, cabinetSecurite, veillePermanente, paliersConfinement],
};
