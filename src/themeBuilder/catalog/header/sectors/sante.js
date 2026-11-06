// Secteur « sante » (Nutrition, santé et bien-être) : 10 en-têtes sur mesure. Contrat : docs/theme-builder/HEADER_SECTOR_CONTRACT.md.
// MATRICE DE CONCEPTION (détail : docs/theme-builder/headers-secteurs/sante.md)
// 01 Sève            organique        : une rangée haute, trois disques qui se chevauchent + marque, navigation dans une capsule, liseré dégradé. Crème/sauge/vert. Fraunces + Nunito. Entrée douce, disques qui « zooment » lentement.
// 02 Silence de Kyoto minimalisme     : une rangée très fine, sceau terracotta (disque), marque minuscule, filet, bouton-ligne et menu plein écran numéroté. Blanc cassé/vermillon. Zen Old Mincho + Zen Kaku.
// 03 Herbier         naturopathie     : bloc de marque olive à coins organiques à gauche, deux étages à droite (infos pratiques, navigation + rendez-vous). Crème/olive/terre. Gelasio + Mulish.
// 04 Cabinet Verger  nutritionniste   : rangée marque + navigation, grosse carte terracotta « rendez-vous » à droite, bandeau d'informations pratiques dessous. Blanc/vert/terracotta. DM Serif Display + Figtree.
// 05 Horizon Santé   clinique/cabinet : rangée blanche (marque, trois blocs d'informations séparés par des filets) puis bande bleu profond d'onglets de services avec rendez-vous. Manrope + Figtree.
// 06 Cueillette      compléments/boutique : bandeau défilant olive, médaillon de marque rond, recherche, compte, panier à pastille, catégories en pilules. Fraunces + Karla.
// 07 Souffle en Ligne yoga/méditation : bande dégradé bleu-lavande, colonne centrée (anneaux, marque), navigation fine, bouton rond ; défilement : verre dépoli. Quicksand + Nunito Sans.
// 08 Aurèle Spa      spa haut de gamme : bande sombre vert profond, navigation en capitales espacées, marque italique entre deux filets or, horaires et bouton contour ; devient plein au défilement. Cormorant Garamond + Jost.
// 09 Cap Nutrition   programme de coaching : bandes inclinées vert/terre devant une marque appuyée, navigation en mosaïque de cases, bouton plein ; collant et réduit. Bricolage Grotesque + Figtree.
// 10 Pharmacie du Parc pharmacie/parapharmacie : bandeau vert d'informations, rangée marque + recherche large + compte + panier, bande verte pleine de rubriques ; collant. Albert Sans + Public Sans.
const B = require("../blocks"), X = require("../blocks2");
const { ID, mark, nav, btn, search, account, social, note, g, stack, grid, band, inner, mv } = B;
const { sty, compact } = require("../../kit");

// Rangée = bande pleine largeur + contenu borné (responsive : retour à la ligne, marges réduites)
const row = (k, kids, o = {}) => band(k.S, [inner(kids, { justifyContent: o.j || "space-between", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg || k.S.bg, color: o.fg || k.S.fg, paddingTop: o.pv || "16px", paddingBottom: o.pv || "16px", ...(o.bb ? { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: o.bb.w || "1px", borderColor: o.bb.c || k.S.line } : {}), ...(o.gradient ? { gradient: o.gradient } : {}), ...(o.st || {}) }), o.t, o.m);
const left = (kids, st = {}) => g(kids, { justifyContent: "flex-start", flexWrap: "nowrap", ...st });
const right = (kids, st = {}) => g(kids, { justifyContent: "flex-end", flexWrap: "wrap", gap: "12px", ...st }, { justifyContent: "flex-start" });
const rdv = (k, P, kind = "pill", o = {}) => btn(k, P.cta[0], P.cta[1], kind, o);
const slow = (n, e, d = 0, t = 1200) => mv(n, e, d, t);

const MODELS = [
  // 01 ── Sève : organique, rangée haute avec disques qui se chevauchent
  { key: "sante-01", name: "Sève", art: "Organique", desc: "Trois disques qui se chevauchent, marque en feuille, navigation en capsule douce et liseré dégradé : un cabinet de bien-être naturel.",
    S: ID("sante-01", "Sève", { bg: "#f4f1e6", fg: "#23382a", mute: "#55654f", alt: "#dfe9d3", accent: "#3f7d4e", onAccent: "#ffffff", line: "#c9d6bb", font: "font.nunito", head: "font.fraunces", weight: "600", btnRadius: "999px", radius: "28px" }),
    build: (k, P) => {
      const S = k.S;
      const cluster = g([slow(X.disc(k, { size: 54, gradient: { from: "#9ccb9a", to: S.accent, angle: 135 }, hideOn: ["mobile"] }), "zoom-in", 0, 1400), slow(X.disc(k, { size: 30, color: "#d9b88f", hideOn: ["mobile"] }), "zoom-in", 250, 1400), slow(X.ring(k, { size: 38, w: "2px", color: S.accent, hideOn: ["mobile"] }), "zoom-in", 500, 1400)], { gap: "0px", flexWrap: "nowrap", alignItems: "flex-end" });
      cluster.children[1].styles.desktop.marginLeft = "-14px"; cluster.children[2].styles.desktop.marginLeft = "-10px";
      const capsule = g([nav(k, "pill", { size: "15px", weight: "600", hover: S.accent, onHover: "#ffffff", gap: "4px" })], { backgroundColor: S.alt, borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "10px", paddingRight: "10px", flexWrap: "nowrap" });
      return [row(k, [left([cluster, mark(k, { size: "30px", weight: "600", italic: true })], { gap: "16px" }), capsule, rdv(k, P, "pill")], { pv: "22px", j: "space-between" }),
        X.stripe(k, { h: 5, gradient: { from: S.alt, to: S.accent, angle: 90 } })];
    },
    mode: "static", anim: "soft", hover: "grow", dark: false, tags: ["organique", "nature", "cabinet", "bien-être"],
    features: ["Disques organiques qui se chevauchent (formes natives)", "Navigation en capsule arrondie avec survol plein", "Bouton de rendez-vous rond toujours visible", "Liseré en dégradé sauge vers vert"],
    animations: ["zoom-in", "grow"], settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Survol du bouton", "Formes décoratives"] },

  // 02 ── Silence de Kyoto : minimalisme japonais, une rangée très fine, menu plein écran
  { key: "sante-02", name: "Silence de Kyoto", art: "Minimalisme japonais", desc: "Une rangée très fine : sceau vermillon, marque minuscule, filet, menu plein écran numéroté. Beaucoup de vide, un seul accent.",
    S: ID("sante-02", "Silence de Kyoto", { bg: "#fbfaf7", fg: "#1c1c1a", mute: "#5c5a55", alt: "#efede7", accent: "#b5472f", onAccent: "#ffffff", line: "#d9d6cd", font: "font.zen-kaku-gothic-new", head: "font.zen-old-mincho", weight: "500", track: "2px" }),
    build: (k, P) => {
      const S = k.S;
      return [row(k, [left([slow(X.disc(k, { size: 12, color: S.accent }), "fade-in", 0, 1600), mark(k, { size: "14px", weight: "500", caps: "uppercase", track: "4px" })], { gap: "14px" }),
        right([btn(k, P.cta[0], P.cta[1], "line", { size: "12px", weight: "500", caps: "uppercase", track: "2px", fg: S.fg }), X.vrule(k, { h: 22, color: S.line, hideOn: ["mobile"] }), X.fsMenu(k, { buttonLabel: "Menu", closeLabel: "Fermer", numbers: true, preset: "fade", duration: 900, stagger: 120, size: "13px", caps: "uppercase", track: "3px" })], { gap: "22px", flexWrap: "nowrap" })],
        { pv: "13px", bb: { w: "1px" } })];
    },
    mode: "sticky", anim: "soft", hover: "lift", dark: false, tags: ["minimaliste", "japonais", "zen", "épuré"],
    features: ["Rangée de 56 px seulement : le contenu respire", "Menu plein écran numéroté, lien par lien (Échap pour fermer)", "Bouton de rendez-vous souligné, sans cadre", "Collant en haut de page"],
    animations: ["fade-in", "lift"], settings: ["Couleurs", "Police", "Espacement", "Menu plein écran", "Animation d'entrée", "Comportement au défilement"] },

  // 03 ── Herbier : naturopathie, bloc de marque à coins organiques + deux étages
  { key: "sante-03", name: "Herbier", art: "Naturopathie", desc: "Bloc de marque olive aux coins organiques à gauche ; à droite, horaires et contact puis navigation et rendez-vous.",
    S: ID("sante-03", "Herbier", { bg: "#fbf7ee", fg: "#2e2a1c", mute: "#6a5f3d", alt: "#ece4cc", accent: "#4a5a23", onAccent: "#ffffff", line: "#d8cda9", font: "font.mulish", head: "font.gelasio", weight: "700", btnRadius: "14px" }),
    build: (k, P) => {
      const S = k.S;
      const brand = g([X.ring(k, { size: 26, w: "2px", color: "#d8cda9", hideOn: ["mobile"] }), stack([mark(k, { size: "28px", weight: "700", color: "#ffffff" }), note(k, P.tagline || "Naturopathie et soins naturels", { color: "#e6e9d2", size: "12.5px" })], { gap: "2px" })], { backgroundColor: S.accent, borderTopLeftRadius: "0px", borderTopRightRadius: "70px", borderBottomRightRadius: "16px", borderBottomLeftRadius: "70px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "40px", paddingRight: "44px", flexWrap: "nowrap", justifyContent: "flex-start", gap: "16px" }, { borderTopRightRadius: "28px", borderBottomLeftRadius: "0px", paddingLeft: "20px" });
      const side = stack([
        g([X.info(k, ["hours", "phone", "mail"], { color: S.mute, gap: "22px" })], { justifyContent: "flex-end", paddingTop: "10px", paddingBottom: "8px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line }),
        g([nav(k, "underline", { size: "15px", weight: "700", hover: S.accent }), rdv(k, P, "solid", { radius: "14px" })], { justifyContent: "space-between", flexWrap: "wrap", paddingTop: "10px", paddingBottom: "12px" })], { gap: "0px", paddingLeft: "36px", paddingRight: "36px", flexGrow: 1 }, { paddingLeft: "18px", paddingRight: "18px" });
      return [band(S, [grid("30% 1fr", [brand, side], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", paddingTop: "0px", paddingBottom: "0px", backgroundColor: S.bg }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" })];
    },
    mode: "static", anim: "slide", hover: "push", dark: false, tags: ["naturopathie", "herbier", "terre", "asymétrique"],
    features: ["Bloc de marque aux coins organiques (rayons asymétriques)", "Informations pratiques (horaires, téléphone, e-mail) à remplacer", "Navigation soulignée et rendez-vous à droite", "Menu replié sur mobile"],
    animations: ["slide-in-left", "push"], settings: ["Couleurs", "Police", "Espacement", "Rayons des coins", "Animation d'entrée", "Informations pratiques"] },

  // 04 ── Cabinet Verger : nutritionniste, carte de rendez-vous + bandeau d'informations
  { key: "sante-04", name: "Cabinet Verger", art: "Nutritionniste", desc: "Marque et navigation à gauche, grosse carte terracotta de prise de rendez-vous à droite, bandeau d'informations pratiques dessous.",
    S: ID("sante-04", "Cabinet Verger", { bg: "#ffffff", fg: "#1f3b2c", mute: "#5b5b4e", alt: "#f6ebe1", accent: "#b9532f", onAccent: "#ffffff", line: "#eadbcb", font: "font.figtree", head: "font.dm-serif-display", weight: "400", btnRadius: "999px" }),
    build: (k, P) => {
      const S = k.S;
      const card = g([stack([note(k, "Consultations sur rendez-vous", { color: "#ffe9dd", size: "12px", caps: "uppercase", track: "1.2px" }), mark(k, { size: "18px", weight: "400", color: "#ffffff" })], { gap: "2px" }),
        btn(k, P.cta[0], P.cta[1], "solid", { bg: "#ffffff", fg: S.accent, radius: "999px", size: "14px", padH: "22px" })], { backgroundColor: S.accent, borderRadius: "28px", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "26px", paddingRight: "14px", gap: "22px", flexWrap: "nowrap", justifyContent: "space-between" }, { flexWrap: "wrap" });
      return [row(k, [left([mark(k, { size: "26px", weight: "400" }), nav(k, "underline", { size: "15px", weight: "600", hover: S.accent, gap: "24px" })], { gap: "40px", flexWrap: "wrap" }), card], { pv: "16px", innM: { gap: "12px" } }),
        row(k, [X.info(k, ["hours", "phone", "address"], { color: S.fg, gap: "28px", icon: S.accent }), note(k, P.notice, { color: S.mute, size: "12.5px" })], { bg: S.alt, pv: "9px", j: "space-between" })];
    },
    mode: "sticky", anim: "rise", hover: "pop", dark: false, tags: ["nutritionniste", "rendez-vous", "cabinet", "terracotta"],
    features: ["Carte de prise de rendez-vous toujours visible, à droite", "Bandeau d'informations pratiques (consignes à remplacer)", "Message d'accueil modifiable", "Collant en haut de page"],
    animations: ["fade-in-up", "pop"], settings: ["Couleurs", "Police", "Espacement", "Carte de rendez-vous", "Animation d'entrée", "Survol du bouton", "Comportement au défilement"] },

  // 05 ── Horizon Santé : clinique, accès rapide aux services en onglets
  { key: "sante-05", name: "Horizon Santé", art: "Clinique et cabinet médical", desc: "Rangée blanche (marque et informations séparées par des filets) puis bande bleu profond d'onglets de services avec rendez-vous.",
    S: ID("sante-05", "Horizon Santé", { bg: "#ffffff", fg: "#0c2d48", mute: "#46627a", alt: "#e8f3fa", accent: "#0b6fa4", onAccent: "#ffffff", line: "#cfe0ec", font: "font.figtree", head: "font.manrope", weight: "800", btnRadius: "8px", radius: "8px" }),
    build: (k, P) => {
      const S = k.S, deep = "#0c2d48";
      return [row(k, [left([X.disc(k, { size: 38, gradient: { from: "#58b4dd", to: S.accent, angle: 135 } }), mark(k, { size: "24px", weight: "800" })], { gap: "12px" }), g([X.info(k, ["hours"], { color: S.fg, icon: S.accent }), X.vrule(k, { h: 28, hideOn: ["mobile"] }), X.info(k, ["phone"], { color: S.fg, icon: S.accent }), X.vrule(k, { h: 28, hideOn: ["mobile"] }), X.info(k, ["address"], { color: S.fg, icon: S.accent })], { gap: "20px", justifyContent: "flex-end", flexWrap: "nowrap" })], { pv: "14px" }),
        row(k, [nav(k, "tab", { size: "15px", weight: "700", color: "#ffffff", hover: "#58b4dd", gap: "6px" }), X.slab(k, [btn(k, P.cta[0], P.cta[1], "solid", { bg: "#ffffff", fg: deep, radius: "8px", size: "14px", padV: "9px" })], { bg: "transparent", padV: "6px", padH: "0px" })], { bg: deep, fg: "#ffffff", pv: "0px", j: "space-between" })];
    },
    mode: "stickyshrink", anim: "rise", hover: "lift", dark: false, tags: ["clinique", "médical", "services", "onglets"],
    features: ["Onglets de services (menu affecté) à accès rapide", "Trois blocs d'informations pratiques séparés par des filets", "Bouton de rendez-vous dans la bande bleue", "Se réduit au défilement"],
    animations: ["fade-in-up", "lift"], settings: ["Couleurs", "Police", "Espacement", "Onglets", "Animation d'entrée", "Comportement au défilement"] },

  // 06 ── Cueillette : compléments et boutique santé (panier natif)
  { key: "sante-06", name: "Cueillette", art: "Compléments et boutique santé", desc: "Bandeau défilant, médaillon de marque rond, recherche, compte et panier à pastille, catégories en pilules.",
    S: ID("sante-06", "Cueillette", { bg: "#f8f3e3", fg: "#2d3317", mute: "#5a5d3a", alt: "#ebe5c8", accent: "#5d6b1e", onAccent: "#ffffff", line: "#d6d0aa", font: "font.karla", head: "font.fraunces", weight: "700", btnRadius: "999px" }),
    build: (k, P) => {
      const S = k.S;
      const medal = g([mark(k, { size: "clamp(12px, 2vw, 16px)", weight: "700", color: "#ffffff", st: { textAlign: "center" } })], { width: "92px", height: "92px", borderRadius: "999px", backgroundColor: S.accent, justifyContent: "center", flexShrink: 0, flexWrap: "nowrap", borderStyle: "solid", borderWidth: "5px", borderColor: S.alt });
      return [row(k, [X.ticker(k, ["Un message de livraison à personnaliser", "Une offre du moment à personnaliser", "Conseils d'un professionnel à personnaliser"], { bg: S.accent, color: "#ffffff", speed: "slow", sep: "✦", size: "12.5px", padV: "7px" })], { bg: S.accent, pv: "0px", st: { paddingLeft: "0px", paddingRight: "0px" }, inn: { maxWidth: "100%" }, t: { paddingLeft: "0px", paddingRight: "0px" }, m: { paddingLeft: "0px", paddingRight: "0px" } }),
        row(k, [medal, stack([g([search(k, { grow: true, max: "520px", radius: "999px", target: "catalogue" }), account(k, {}), X.cartPill(k, {}), rdv(k, P, "outline", { size: "13px", padV: "8px", fg: S.accent, border: S.accent })], { gap: "18px", flexWrap: "wrap", justifyContent: "space-between", width: "100%" }), g([nav(k, "pill", { size: "14.5px", weight: "600", hover: S.accent, onHover: "#ffffff", gap: "4px" })], { justifyContent: "flex-start" })], { gap: "10px", flexGrow: 1 })], { pv: "14px", inn: { gap: "26px", flexWrap: "nowrap" }, innM: { flexWrap: "wrap", gap: "12px" }, innT: { flexWrap: "wrap" } })];
    },
    mode: "sticky", anim: "soft", hover: "grow", dark: false, tags: ["boutique", "compléments", "panier", "médaillon"],
    features: ["Bandeau défilant d'annonces (pause au survol et au clavier)", "Recherche du catalogue, compte et panier réels du site", "Pastille de nombre d'articles", "Catégories en pilules (menu affecté)"],
    animations: ["fade-in", "grow"], settings: ["Couleurs", "Police", "Espacement", "Bandeau défilant", "Animation d'entrée"] },

  // 07 ── Souffle en Ligne : yoga et méditation, colonne centrée sur dégradé
  { key: "sante-07", name: "Souffle en Ligne", art: "Yoga et méditation en ligne", desc: "Bande en dégradé bleu-lavande, anneaux concentriques autour de la marque, navigation fine, bouton rond : une plateforme de séances en ligne.",
    S: ID("sante-07", "Souffle en Ligne", { bg: "#eef4fb", fg: "#26354f", mute: "#4c5b78", alt: "#dbe6f5", accent: "#5a5fb0", onAccent: "#ffffff", line: "#c4d3e8", font: "font.nunito-sans", head: "font.quicksand", weight: "700", btnRadius: "999px" }),
    build: (k, P) => {
      const S = k.S;
      const brand = g([slow(X.ring(k, { size: 44, w: "1.5px", color: "#9aa4d6", hideOn: ["mobile"] }), "zoom-in", 0, 1600), slow(X.ring(k, { size: 26, w: "1.5px", color: S.accent, hideOn: ["mobile"] }), "zoom-in", 300, 1600), mark(k, { size: "30px", weight: "700" }), slow(X.ring(k, { size: 26, w: "1.5px", color: S.accent, hideOn: ["mobile"] }), "zoom-in", 300, 1600), slow(X.ring(k, { size: 44, w: "1.5px", color: "#9aa4d6", hideOn: ["mobile"] }), "zoom-in", 0, 1600)], { gap: "16px", justifyContent: "center", flexWrap: "nowrap" });
      const actions = g([nav(k, "thin", { size: "15px", weight: "500", hover: S.accent, gap: "30px" }), rdv(k, P, "pill", { size: "13.5px", padV: "9px" })], { gap: "30px", justifyContent: "center" });
      return [row(k, [stack([brand, actions], { alignItems: "center", gap: "12px", width: "100%" })], { pv: "22px", gradient: { from: "#dbe6f5", to: "#ebe4f6", angle: 100 }, j: "center" })];
    },
    mode: "glass", anim: "reveal", hover: "float", dark: false, tags: ["yoga", "méditation", "en ligne", "centré", "dégradé"],
    features: ["Anneaux concentriques (formes natives) autour de la marque", "Dégradé doux sur toute la largeur", "Verre dépoli au défilement", "Bouton de séance rond toujours visible"],
    animations: ["zoom-in", "float", "reveal"], settings: ["Couleurs", "Police", "Dégradé de fond", "Animation d'entrée", "Survol du bouton", "Comportement au défilement"] },

  // 08 ── Aurèle Spa : spa haut de gamme, sombre, capitales espacées
  { key: "sante-08", name: "Aurèle Spa", art: "Spa haut de gamme", desc: "Bande vert profond, navigation en capitales espacées, marque italique entre deux filets or, horaires et bouton contour.",
    S: ID("sante-08", "Aurèle Spa", { bg: "#14302d", fg: "#f3ece0", mute: "#b9c7bf", alt: "#1d3f3b", accent: "#d3b27a", onAccent: "#14302d", line: "#2f5651", font: "font.jost", head: "font.cormorant-garamond", weight: "500", btnRadius: "0px", caps: "uppercase", track: "2px" }),
    build: (k, P) => {
      const S = k.S, gold = S.accent;
      const hair = () => compact({ type: "container", children: [], ...sty({ width: "48px", height: "1px", backgroundColor: gold, flexShrink: 0 }, { width: "20px" }, { width: "12px" }) });
      return [row(k, [grid("1fr auto 1fr", [left([nav(k, "plain", { size: "12.5px", weight: "500", caps: "uppercase", track: "2.4px", hover: gold, gap: "28px" })]), g([hair(), mark(k, { size: "clamp(26px, 3.4vw, 40px)", weight: "500", italic: true }), hair()], { gap: "18px", flexWrap: "nowrap", justifyContent: "center" }), right([X.info(k, ["hours"], { color: S.mute, icon: gold, size: "12px" }), btn(k, P.cta[0], P.cta[1], "outline", { fg: gold, border: gold, size: "12px", caps: "uppercase", track: "2px", radius: "0px", weight: "500" })], { gap: "20px", flexWrap: "nowrap" })], { width: "100%", gap: "24px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { pv: "26px", bg: S.bg, st: {}, bb: { w: "1px", c: "#2f5651" } })];
    },
    mode: "stickyshrink", anim: "reveal", hover: "lift", dark: true, tags: ["spa", "luxe", "sombre", "or", "capitales"],
    features: ["Marque italique encadrée de filets or", "Horaires d'ouverture à remplacer, masqués sur mobile", "Collant, se réduit au défilement", "Navigation en capitales espacées"],
    animations: ["reveal", "lift"], settings: ["Couleurs", "Police", "Espacement", "Filets or", "Animation d'entrée", "Comportement au défilement"] },

  // 09 ── Cap Nutrition : programme de coaching, bandes inclinées + mosaïque
  { key: "sante-09", name: "Cap Nutrition", art: "Programme de coaching nutrition", desc: "Bandes inclinées devant une marque appuyée, navigation en mosaïque de cases, bouton plein : un programme à étapes.",
    S: ID("sante-09", "Cap Nutrition", { bg: "#fdf3e6", fg: "#2b2a1f", mute: "#5d5a43", alt: "#f3dfc4", accent: "#2f6f4f", onAccent: "#ffffff", line: "#e2c9a4", font: "font.figtree", head: "font.bricolage-grotesque", weight: "800", btnRadius: "12px", radius: "12px" }),
    build: (k, P) => {
      const S = k.S;
      const bars = g([slow(X.slash(k, { w: 16, h: 44, angle: -22, color: "#e8a26e", hideOn: ["mobile"] }), "slide-in-left", 0, 1000), slow(X.slash(k, { w: 16, h: 44, angle: -22, color: "#bfe3cd", hideOn: ["mobile"] }), "slide-in-left", 150, 1000)], { gap: "6px", flexWrap: "nowrap" });
      return [row(k, [left([bars, mark(k, { size: "30px", weight: "800", track: "-0.5px", color: "#ffffff" })], { gap: "16px" }), rdv(k, P, "solid", { radius: "12px", padH: "24px", bg: "#ffffff", fg: S.accent })], { bg: S.accent, fg: "#ffffff", pv: "14px" }),
        row(k, [X.navTiles(k, "box", { size: "14px", weight: "700", w: 900, gap: "8px", border: S.line, bg: "#ffffff", padV: "8px", padH: "18px", hover: S.accent, onHover: "#ffffff" })], { pv: "12px", j: "flex-start", bb: { w: "3px", c: "#c9703f" } })];
    },
    mode: "stickyshrink", anim: "slide", hover: "bounce", dark: false, tags: ["coaching", "programme", "mosaïque", "étapes"],
    features: ["Bandes inclinées (formes natives) devant la marque", "Navigation en mosaïque de cases bordées", "Bouton plein vers l'inscription ou le contact", "Se réduit au défilement"],
    animations: ["slide-in-left", "bounce"], settings: ["Couleurs", "Police", "Espacement", "Mosaïque de navigation", "Animation d'entrée", "Survol du bouton", "Comportement au défilement"] },

  // 10 ── Pharmacie du Parc : pharmacie et parapharmacie, trois étages denses
  { key: "sante-10", name: "Pharmacie du Parc", art: "Pharmacie et parapharmacie", desc: "Bandeau vert d'informations, rangée marque + recherche large + compte + panier, bande verte pleine de rubriques.",
    S: ID("sante-10", "Pharmacie du Parc", { bg: "#ffffff", fg: "#0f3326", mute: "#44594e", alt: "#e4f4ea", accent: "#0a7a4f", onAccent: "#ffffff", line: "#c9e3d4", font: "font.public-sans", head: "font.albert-sans", weight: "800", btnRadius: "8px", radius: "8px" }),
    build: (k, P) => {
      const S = k.S;
      return [row(k, [X.info(k, ["hours", "phone"], { color: "#ffffff", icon: "#bff0d4", gap: "24px", size: "12.5px" }), note(k, P.notice, { color: "#e4f4ea", size: "12.5px" })], { bg: S.accent, fg: "#ffffff", pv: "7px", j: "space-between" }),
        row(k, [g([X.disc(k, { size: 34, color: S.accent }), mark(k, { size: "24px", weight: "800" })], { gap: "10px", flexWrap: "nowrap" }), search(k, { grow: true, max: "560px", radius: "8px", target: "catalogue" }), right([account(k, {}), X.cartPill(k, {}), rdv(k, P, "solid", { radius: "8px", size: "13.5px", padV: "9px" })], { gap: "18px", flexWrap: "nowrap" }, { gap: "12px" })], { pv: "14px", inn: { gap: "28px" } }),
        row(k, [nav(k, "block", { size: "14.5px", weight: "700", color: "#ffffff", hover: "#08603f", onHover: "#ffffff" })], { bg: "#0a7a4f", fg: "#ffffff", pv: "0px", j: "flex-start" })];
    },
    mode: "sticky", anim: "rise", hover: "lift", dark: false, tags: ["pharmacie", "parapharmacie", "recherche", "panier"],
    features: ["Informations pratiques à remplacer (horaires, téléphone)", "Recherche du catalogue, compte et panier réels du site", "Bande de rubriques pleine largeur (menu affecté)", "Collant en haut de page"],
    animations: ["fade-in-up", "lift"], settings: ["Couleurs", "Police", "Espacement", "Recherche", "Animation d'entrée", "Survol du bouton", "Comportement au défilement"] },
];
module.exports = { sector: "sante", models: MODELS };
