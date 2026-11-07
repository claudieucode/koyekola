// Secteur « corpo » (Entreprises, corporate et finance) : 10 en-têtes sur mesure, 10 silhouettes différentes.
// Matrice de conception complète : docs/theme-builder/headers-secteurs/corpo.md (même contenu, version lisible).
//
// | Clé | Nom | Direction | Silhouette (niveaux de gris) | Navigation | Défilement | Entrée / survol |
// |---|---|---|---|---|---|---|
// | 01 | Meridian | Corporate sophistiqué | barre sombre fermable + rangée claire + liseré dégradé | soulignée, centrée | collant | fondu / se soulève |
// | 02 | Helvet Institut | Minimalisme suisse institutionnel | filet noir épais + 4 cellules séparées par des filets verticaux | fine, en cellule | statique | révélation / appuie |
// | 03 | Banque Privée Aubert | Banque privée à serif | axe central : trois rangées centrées, nom en italique entre deux filets or | fine, espacée, centrée | statique | fondu |
// | 04 | Cabinet Schéma | Conseil à schéma / grille | pictogramme anneau + disque, navigation en cases bordées, liseré | cases (mosaïque) | collant | glissement / se soulève |
// | 05 | Mutuelle Clair-Foyer | Assurance rassurante | rangée douce aux coins bas arrondis, capsule d'aide à droite | pilules | collant | montée / flotte |
// | 06 | Parquet Marchés | Fonds / finance de marché à ticker | bande de ticker pleine largeur + rangée sombre monospace | mono, majuscules | collant | zoom léger |
// | 07 | Étude Delacroix | Audit / juridique à deux niveaux | rangée marque + coordonnées, double filet, barre bordeaux pleine de navigation | blocs dans la barre | collant | montée |
// | 08 | Groupe Forge | Groupe industriel, méga-barre de métiers | bloc jaune + méga-barre sombre de cases de métiers | mosaïque (navTiles) | collant | glissement / appuie |
// | 09 | Flux B2B | Fintech B2B | capsule flottante arrondie sur fond nuit, pastille dégradée | pilules dans la capsule | collant | zoom / se soulève |
// | 10 | Holding Pierre | Holding intemporelle, navigation latérale | grille 3 colonnes : navigation verticale à gauche, nom monumental au centre, contact à droite | verticale (ordi), menu plein écran (tablette, mobile) | statique | révélation |
//
// Aucune image, aucune donnée inventée : coordonnées et annonces sont des consignes à remplacer ; pas de sélecteur de langue (le CMS n'a pas la fonction).
const B = require("../blocks");
const X = require("../blocks2");
const { sty, compact } = require("../../kit");
const { ID, mark, nav, btn, search, account, note, g, stack, grid, band, inner } = B;

// Rangée pleine largeur à contenu borné
const row = (S, children, st = {}, t, m, innerSt = {}) => band(S, [inner(children, innerSt)], st, t, m);
const dismiss = (n) => ({ ...n, props: { ...(n.props || {}), dismissible: true } });
// Filet horizontal simple (conteneur d'un pixel, élastique)
const hline = (color) => ({ type: "container", children: [], ...sty({ height: "1px", flexGrow: 1, flexBasis: "30px", backgroundColor: color }) });
const cell = (children, st = {}, t, m) => g(children, { flexWrap: "nowrap", alignSelf: "stretch", ...st }, t, m);

module.exports = {
  sector: "corpo",
  models: [
    // ── 01 · Meridian ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-01", name: "Meridian", art: "Corporate sophistiqué",
      desc: "Barre d'information fermable, rangée claire à trois zones et liseré dégradé : la confiance par la clarté.",
      S: ID("corpo-01", "Meridian", { bg: "#ffffff", fg: "#0c2340", mute: "#4a5a70", alt: "#f1f4f8", accent: "#0c2340", onAccent: "#ffffff", line: "#d5dce6", font: "font.public-sans", head: "font.source-serif-4", weight: "700", btnRadius: "3px" }),
      build: (k, P) => {
        const S = k.S;
        const bar = dismiss(row(S, [note(k, P.notice, { color: "#ffffff", size: "12.5px" }), X.info(k, ["phone", "mail"], { color: "#ffffff", icon: "#e0b96a", size: "12.5px" })], { backgroundColor: "#0c2340", color: "#ffffff", paddingTop: "9px", paddingBottom: "9px", paddingRight: "52px" }));
        const main = row(S, [mark(k, { size: "26px" }), nav(k, "underline", { size: "14.5px" }), g([{ ...account(k, { size: "13.5px" }), hideOn: ["mobile"] }, btn(k, P.cta[0], P.cta[1], "solid")], { flexWrap: "nowrap" })], { paddingTop: "18px", paddingBottom: "18px" }, { paddingTop: "14px", paddingBottom: "14px", paddingLeft: "18px", paddingRight: "18px" }, { paddingTop: "12px", paddingBottom: "12px", paddingLeft: "14px", paddingRight: "14px" });
        return [bar, main, X.stripe(k, { h: 3, gradient: { from: "#b8893b", to: "#0c2340", angle: 90 } })];
      },
      mode: "sticky", anim: "soft", hover: "lift", dark: false, tags: ["corporate", "barre fermable", "compte"],
      features: ["Barre d'information que le visiteur peut fermer (choix mémorisé)", "Coordonnées à renseigner dans la barre", "Accès au compte du site et bouton de contact", "En-tête collant au défilement"],
      animations: ["fade-in", "lift"], settings: ["Couleurs", "Polices", "Espacement", "Animation d'entrée", "Effet au défilement", "Barre fermable"],
    },
    // ── 02 · Helvet Institut ──────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-02", name: "Helvet Institut", art: "Minimalisme suisse institutionnel",
      desc: "Filet noir épais et quatre cellules séparées par des filets verticaux : la rigueur d'une institution.",
      S: ID("corpo-02", "Helvet Institut", { bg: "#ffffff", fg: "#111111", mute: "#4d4d4d", alt: "#f2f2f2", accent: "#d50000", onAccent: "#ffffff", line: "#111111", font: "font.ibm-plex-sans", head: "font.inter-tight", weight: "800", btnRadius: "0px" }),
      build: (k) => {
        const S = k.S, cs = { paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#111111", minHeight: "76px" };
        const c1 = cell([mark(k, { size: "20px", caps: "uppercase", track: "1px", weight: "800" })], { ...cs, borderLeftWidth: "0px", paddingLeft: "0px" }, { minHeight: "56px" }, { minHeight: "56px" });
        const mm = { borderLeftWidth: "0px", paddingLeft: "0px", paddingRight: "0px", minHeight: "56px" };
        const c2 = cell([nav(k, "thin", { size: "14px", gap: "22px", weight: "500", hover: "#d50000" })], cs, mm, mm);
        const c3 = { ...cell([account(k, { size: "13px" })], cs), hideOn: ["mobile"] };
        const c4 = cell([btn(k, "Nous contacter", "/contact", "solid", { bg: "#d50000", fg: "#ffffff", caps: "uppercase", track: "1px", size: "12px", padV: "25px", padH: "26px" })], { ...cs, justifyContent: "flex-end", alignItems: "center", alignContent: "center", paddingRight: "0px" }, { ...mm, minHeight: "0px", justifyContent: "flex-start", paddingBottom: "12px" }, { ...mm, minHeight: "0px", justifyContent: "flex-start", paddingBottom: "12px" });
        const gridNode = grid("1.1fr 2.2fr 1fr 1.2fr", [c1, c2, c3, c4], { gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr 1fr", gap: "8px" }, { gridTemplate: "1fr", gap: "0px" });
        return [X.stripe(k, { h: 8, gradient: { from: "#111111", to: "#111111", angle: 90 } }), row(S, [gridNode], { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#111111", paddingTop: "0px", paddingBottom: "0px" }, undefined, undefined, { display: "block" })];
      },
      mode: "static", anim: "reveal", hover: "push", dark: false, tags: ["suisse", "grille", "institution"],
      features: ["Quatre cellules régulières séparées par des filets verticaux", "Compte client (connexion) dans sa propre cellule", "Bouton de contact en majuscules rouges", "Mobile : marque, menu replié et contact conservés"],
      animations: ["reveal", "push"], settings: ["Couleurs", "Polices", "Espacement", "Animation d'entrée", "Survol des boutons"],
    },
    // ── 03 · Banque Privée Aubert ─────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-03", name: "Banque Privée Aubert", art: "Banque privée à serif",
      desc: "Tout sur un axe central : nom en italique entre deux filets or, navigation fine et espacée.",
      S: ID("corpo-03", "Banque Privée Aubert", { bg: "#10261d", fg: "#f3ead7", mute: "#c8c0ac", alt: "#17342a", accent: "#c7a45a", onAccent: "#10261d", line: "#3a5547", font: "font.jost", head: "font.cormorant-garamond", weight: "600", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, gold = "#c7a45a";
        const top = row(S, [account(k, { size: "12.5px", color: "#f3ead7" }), { ...note(k, P.tagline, { caps: "uppercase", track: "3px", size: "11px", color: "#c8c0ac" }), hideOn: ["mobile"] }, btn(k, "Nous contacter", "/contact", "line", { fg: gold, size: "12px", caps: "uppercase", track: "2px", weight: "500" })], { paddingTop: "12px", paddingBottom: "6px" });
        const brand = row(S, [g([hline(gold), mark(k, { size: "46px", italic: true, weight: "500", color: "#f3ead7" }), hline(gold)], { flexWrap: "nowrap", width: "100%", maxWidth: "980px", gap: "28px", marginLeft: "auto", marginRight: "auto" }, { gap: "18px" }, { gap: "12px" })], { paddingTop: "8px", paddingBottom: "14px" });
        const navRow = row(S, [nav(k, "thin", { size: "13px", caps: "uppercase", track: "2.5px", weight: "400", gap: "36px", hover: gold, color: "#f3ead7" })], { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderBottomWidth: "1px", borderColor: "#3a5547", paddingTop: "10px", paddingBottom: "10px" }, undefined, undefined, { justifyContent: "center" });
        return [top, brand, navRow];
      },
      mode: "static", anim: "soft", hover: "", dark: true, tags: ["banque privée", "serif", "centré"],
      features: ["Composition centrée sur trois rangées : accès client, nom, navigation", "Nom en italique encadré de deux filets or élastiques", "Accroche courte à personnaliser", "Navigation en petites capitales espacées, menu replié sur mobile"],
      animations: ["fade-in"], settings: ["Couleurs", "Polices", "Espacement", "Animation d'entrée"],
    },
    // ── 04 · Cabinet Schéma ───────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-04", name: "Cabinet Schéma", art: "Cabinet de conseil à schéma",
      desc: "Pictogramme anneau et disque, navigation en cases bordées comme un schéma : un cabinet qui structure.",
      S: ID("corpo-04", "Cabinet Schéma", { bg: "#f4f6f6", fg: "#1d2b2f", mute: "#4a5c60", alt: "#ffffff", accent: "#0f766e", onAccent: "#ffffff", line: "#b9c7c5", font: "font.ibm-plex-sans", head: "font.dm-sans", weight: "700", btnRadius: "2px" }),
      build: (k, P) => {
        const S = k.S;
        const picto = g([X.ring(k, { size: 30, w: "3px", color: "#0f766e" }), g([X.disc(k, { size: 30, color: "#1d2b2f" })], { marginLeft: "-12px" })], { flexWrap: "nowrap", gap: "0px" });
        const brand = g([picto, mark(k, { size: "22px", weight: "700" })], { flexWrap: "nowrap", gap: "12px" });
        const tiles = X.navTiles(k, "box", { w: 620, gap: "6px", bg: "#ffffff", border: "#b9c7c5", size: "13.5px", padV: "9px", padH: "14px", hover: "#0f766e" });
        const brand2 = stack([brand, note(k, P.tagline, { size: "12px", color: "#4a5c60" })], { gap: "6px" });
        const right = stack([g([{ ...X.info(k, ["mail"], { color: "#1d2b2f", icon: "#0f766e", size: "12.5px" }) }, btn(k, P.cta[0], P.cta[1], "solid", { size: "13px", padV: "9px" })], { flexWrap: "nowrap", gap: "16px", justifyContent: "flex-end" }), tiles], { alignItems: "flex-end", gap: "12px" }, { alignItems: "stretch" });
        return [row(S, [brand2, right], { paddingTop: "20px", paddingBottom: "18px" }, { paddingTop: "14px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px" }, { paddingTop: "12px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px" }, { alignItems: "flex-start" }), X.stripe(k, { h: 4, gradient: { from: "#0f766e", to: "#1d2b2f", angle: 90 } })];
      },
      mode: "sticky", anim: "slide", hover: "lift", dark: false, tags: ["conseil", "mosaïque", "schéma"],
      features: ["Pictogramme en deux formes natives (anneau et disque)", "Navigation en cases bordées qui passent à la ligne", "Cases qui s'éclairent au survol et au clavier", "En-tête collant, liseré dégradé"],
      animations: ["slide-in-left", "lift"], settings: ["Couleurs", "Polices", "Espacement", "Animation d'entrée", "Effet au défilement"],
    },
    // ── 05 · Mutuelle Clair-Foyer ─────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-05", name: "Mutuelle Clair-Foyer", art: "Assurance rassurante",
      desc: "Marque centrée entre navigation en pilules et capsule d'aide, coins bas arrondis : l'assurance proche de vous.",
      S: ID("corpo-05", "Mutuelle Clair-Foyer", { bg: "#fffaf3", fg: "#1f3a5f", mute: "#4f6580", alt: "#fdeede", accent: "#c2410c", onAccent: "#ffffff", line: "#f0d9bf", font: "font.nunito-sans", head: "font.nunito", weight: "800", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S;
        const brand = g([X.disc(k, { size: 34, gradient: { from: "#c2410c", to: "#f59e0b", angle: 135 } }), mark(k, { size: "24px", weight: "800" })], { flexWrap: "nowrap", gap: "10px" });
        const help = g([X.info(k, ["phone"], { color: "#1f3a5f", icon: "#c2410c", size: "13px" }), btn(k, P.cta[0], P.cta[1], "pill", { size: "13.5px" })], { flexWrap: "nowrap", backgroundColor: "#fdeede", borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "18px", paddingRight: "6px", gap: "14px" }, undefined, { paddingLeft: "6px", backgroundColor: "transparent" });
        const acts = g([{ ...account(k, { login: "Espace client", size: "13.5px" }), hideOn: ["mobile"] }, help], { flexWrap: "nowrap", gap: "14px" });
        const r = row(S, [nav(k, "pill", { size: "14.5px", hover: "#fdeede", onHover: "#c2410c", weight: "700" }), brand, acts],
          { paddingTop: "16px", paddingBottom: "16px", borderBottomLeftRadius: "34px", borderBottomRightRadius: "34px" },
          { paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", borderBottomLeftRadius: "28px", borderBottomRightRadius: "28px" },
          { paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px", borderBottomLeftRadius: "22px", borderBottomRightRadius: "22px" });
        return [r];
      },
      mode: "sticky", anim: "rise", hover: "float", dark: false, tags: ["assurance", "arrondi", "chaleureux"],
      features: ["Coins bas arrondis qui adoucissent l'en-tête", "Capsule d'aide : numéro à renseigner et bouton d'action", "Accès « Espace client » (connexion du site)", "Pastille de marque en dégradé natif"],
      animations: ["fade-in-up", "float"], settings: ["Couleurs", "Polices", "Arrondis", "Espacement", "Animation d'entrée", "Survol des boutons"],
    },
    // ── 06 · Parquet Marchés ──────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-06", name: "Parquet Marchés", art: "Finance de marché à ticker",
      desc: "Ticker intégré à la rangée de marque, navigation monospace sur une barre en dessous : le pouls d'une salle de marché.",
      S: ID("corpo-06", "Parquet Marchés", { bg: "#0a1410", fg: "#e8f1ec", mute: "#9db5a8", alt: "#12211a", accent: "#3ddc97", onAccent: "#0a1410", line: "#25382f", font: "font.ibm-plex-mono", head: "font.ibm-plex-sans", weight: "600", btnRadius: "2px" }),
      build: (k) => {
        const S = k.S;
        const brand = g([X.disc(k, { size: 10, color: "#3ddc97" }), mark(k, { size: "22px", weight: "600", caps: "uppercase", track: "2px" })], { flexWrap: "nowrap", gap: "10px" });
        const live = g([X.ticker(k, ["Indice à renseigner", "Performance à renseigner", "Actualité à renseigner", "Communiqué à renseigner"], { bg: "#12211a", color: "#9db5a8", size: "12px", sep: "▲", speed: "slow", caps: "uppercase", track: "1px", padV: "11px" })], { flexGrow: 1, flexBasis: "0px", minWidth: "0px", overflow: "hidden", flexWrap: "nowrap", borderStyle: "solid", borderWidth: "1px", borderColor: "#25382f" }, { flexBasis: "100%" });
        const acts = g([account(k, { size: "12.5px" }), btn(k, "Nous contacter", "/contact", "outline", { fg: "#3ddc97", border: "#3ddc97", size: "12px", caps: "uppercase", track: "1px" })], { flexWrap: "nowrap" });
        const top = row(S, [brand, live, acts], { paddingTop: "14px", paddingBottom: "14px" }, { paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px" }, { paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px" }, { flexWrap: "wrap", gap: "18px" });
        const navRow = row(S, [nav(k, "mono", { size: "13px", caps: "uppercase", track: "1px", gap: "28px", color: "#0a1410", hover: "#0a1410" })], { backgroundColor: "#d6ebdf", paddingTop: "8px", paddingBottom: "8px" }, undefined, undefined, { justifyContent: "flex-start" });
        return [top, navRow, X.stripe(k, { h: 2, gradient: { from: "#3ddc97", to: "#0a1410", angle: 90 } })];
      },
      mode: "sticky", anim: "zoom", hover: "", dark: true, tags: ["finance", "ticker", "monospace"],
      features: ["Ticker natif : pause au survol et au clavier, immobile si « réduire les animations »", "Textes du ticker à remplacer par vos indicateurs (aucun cours inventé)", "Navigation en majuscules monospace", "Accès client et contact en contour vert"],
      animations: ["zoom-in"], settings: ["Couleurs", "Polices", "Ticker (textes, vitesse)", "Animation d'entrée", "Effet au défilement"],
    },
    // ── 07 · Étude Delacroix ──────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-07", name: "Étude Delacroix", art: "Audit et juridique à deux niveaux",
      desc: "Marque et coordonnées en haut sous un double filet, grande barre bordeaux pour la navigation : l'autorité d'un cabinet.",
      S: ID("corpo-07", "Étude Delacroix", { bg: "#ffffff", fg: "#1b2a41", mute: "#4b586b", alt: "#f3efe9", accent: "#7a1f2b", onAccent: "#ffffff", line: "#d9d2c5", font: "font.source-sans-3", head: "font.libre-baskerville", weight: "700", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const brand = stack([mark(k, { size: "28px", weight: "700" }), note(k, P.tagline, { size: "12px", caps: "uppercase", track: "2px", color: "#7a1f2b" })], { gap: "4px" });
        const top = row(S, [brand, X.info(k, ["phone", "mail", "address"], { color: "#1b2a41", icon: "#7a1f2b", size: "13px", gap: "22px" })], { paddingTop: "18px", paddingBottom: "16px", borderStyle: "double", borderWidth: "0px", borderBottomWidth: "4px", borderColor: "#d9d2c5" }, { paddingTop: "14px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px" }, { paddingTop: "12px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px" });
        const bar = row(S, [nav(k, "block", { size: "14px", color: "#ffffff", hover: "#ffffff", onHover: "#7a1f2b", weight: "600", caps: "uppercase", track: "1px" }), { ...search(k, { w: "380px", fieldBg: "#ffffff", fieldLine: "#ffffff" }), hideOn: ["mobile"] }], { backgroundColor: "#7a1f2b", color: "#ffffff", paddingTop: "0px", paddingBottom: "0px" }, undefined, undefined, { gap: "12px" });
        return [top, bar];
      },
      mode: "sticky", anim: "rise", hover: "", dark: false, tags: ["audit", "juridique", "deux niveaux"],
      features: ["Deux niveaux : identité et coordonnées, puis barre de navigation pleine largeur", "Coordonnées (téléphone, e-mail, adresse) à renseigner", "Recherche intégrée à la barre", "Liens en blocs pleins au survol et au clavier"],
      animations: ["fade-in-up"], settings: ["Couleurs", "Polices", "Espacement", "Animation d'entrée", "Effet au défilement"],
    },
    // ── 08 · Groupe Forge ─────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-08", name: "Groupe Forge", art: "Groupe industriel à méga-barre de métiers",
      desc: "Bandeau jaune pour la marque, méga-barre sombre de cases de métiers en dessous : un groupe aux nombreuses activités.",
      S: ID("corpo-08", "Groupe Forge", { bg: "#14181d", fg: "#f4f4f2", mute: "#b4bcc4", alt: "#1f252c", accent: "#ffb703", onAccent: "#14181d", line: "#3a424b", font: "font.barlow", head: "font.barlow-condensed", weight: "800", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const brand = g([X.slash(k, { w: 34, h: 46, angle: -18, color: "#14181d" }), mark(k, { size: "40px", caps: "uppercase", track: "1px", weight: "800", color: "#14181d" })], { flexWrap: "nowrap", gap: "14px" });
        const top = row(S, [brand, X.info(k, ["phone"], { color: "#14181d", icon: "#14181d", size: "13px" }), btn(k, P.cta[0], P.cta[1], "solid", { bg: "#14181d", fg: "#ffb703", size: "14px", caps: "uppercase", track: "1px", padV: "12px" })], { backgroundColor: "#ffb703", color: "#14181d", paddingTop: "10px", paddingBottom: "10px" }, { paddingTop: "8px", paddingBottom: "8px", paddingLeft: "18px", paddingRight: "18px" }, { paddingTop: "8px", paddingBottom: "8px", paddingLeft: "14px", paddingRight: "14px" });
        const tiles = X.navTiles(k, "box", { w: 1240, gap: "6px", bg: "#1f252c", border: "#3a424b", size: "13.5px", padV: "11px", padH: "18px", caps: "uppercase", track: "1px", hover: "#ffb703", onHover: "#14181d" });
        return [top, row(S, [tiles], { paddingTop: "12px", paddingBottom: "12px" }, undefined, undefined, { justifyContent: "flex-start" })];
      },
      mode: "sticky", anim: "slide", hover: "push", dark: true, tags: ["industrie", "méga-barre", "mosaïque"],
      features: ["Bandeau jaune pleine largeur : marque en capitales condensées avec forme diagonale native, téléphone à renseigner, bouton", "Méga-barre : les liens du menu forment des cases de métiers sur toute la largeur", "Cases qui passent en jaune au survol et au clavier", "En-tête collant"],
      animations: ["slide-in-left", "push"], settings: ["Couleurs", "Polices", "Espacement", "Animation d'entrée", "Survol des boutons", "Effet au défilement"],
    },
    // ── 09 · Flux B2B ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-09", name: "Flux B2B", art: "Fintech B2B",
      desc: "Capsule flottante arrondie sur fond nuit, pastille dégradée et bouton lumineux : une fintech pour les entreprises.",
      S: ID("corpo-09", "Flux B2B", { bg: "#0d1030", fg: "#f4f5ff", mute: "#aab0d8", alt: "#1a1f4d", accent: "#5b4bf0", onAccent: "#ffffff", line: "#2b3270", font: "font.inter", head: "font.plus-jakarta-sans", weight: "700", btnRadius: "999px" }),
      build: (k) => {
        const S = k.S;
        const capsule = g([g([X.disc(k, { size: 26, gradient: { from: "#5b4bf0", to: "#22d3ee", angle: 135 } }), mark(k, { size: "20px", weight: "800" })], { flexWrap: "nowrap", gap: "10px" }), nav(k, "pill", { size: "14px", hover: "#2b3270", onHover: "#ffffff", weight: "600" }), g([{ ...account(k, { login: "Se connecter", size: "13.5px" }), hideOn: ["mobile"] }, btn(k, "Demander une démo", "/contact", "pill", { size: "13.5px", st: { gradient: { from: "#5b4bf0", to: "#7c6bff", angle: 90 } } })], { flexWrap: "nowrap", gap: "14px" })],
          { flexWrap: "nowrap", justifyContent: "space-between", width: "100%", maxWidth: "1100px", backgroundColor: "#1a1f4d", borderStyle: "solid", borderWidth: "1px", borderColor: "#2b3270", borderRadius: "999px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "20px", paddingRight: "10px", marginLeft: "auto", marginRight: "auto" },
          { flexWrap: "wrap", borderRadius: "28px", paddingLeft: "14px" }, { borderRadius: "24px", paddingLeft: "12px", paddingRight: "8px" });
        return [band(S, [capsule], { paddingTop: "14px", paddingBottom: "14px" }, { paddingTop: "10px", paddingBottom: "10px", paddingLeft: "18px", paddingRight: "18px" }, { paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", paddingRight: "10px" })];
      },
      mode: "sticky", anim: "zoom", hover: "lift", dark: true, tags: ["fintech", "capsule", "dégradé"],
      features: ["Capsule flottante : marque, navigation en pilules et actions dans un seul bloc arrondi", "Pastille et bouton en dégradés natifs", "Accès « Se connecter » et demande de démonstration", "Tablette et mobile : la capsule devient un bloc arrondi, menu replié"],
      animations: ["zoom-in", "lift"], settings: ["Couleurs", "Polices", "Arrondis", "Espacement", "Animation d'entrée", "Survol des boutons"],
    },
    // ── 10 · Holding Pierre ───────────────────────────────────────────────────────────────────────────────────────
    {
      key: "corpo-10", name: "Holding Pierre", art: "Holding intemporelle à navigation latérale",
      desc: "Navigation verticale à gauche, nom monumental au centre, contact à droite : la sobriété d'une holding familiale.",
      S: ID("corpo-10", "Holding Pierre", { bg: "#efece4", fg: "#2a2a26", mute: "#5b5a52", alt: "#e3dfd3", accent: "#34452f", onAccent: "#ffffff", line: "#c9c4b4", font: "font.work-sans", head: "font.newsreader", weight: "500", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const side = { ...cell([nav(k, "plain", { vertical: true, size: "14px", weight: "500", gap: "10px", hover: "#34452f" })], { borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: "#c9c4b4", paddingTop: "18px", paddingBottom: "18px", paddingRight: "16px" }), hideOn: ["tablet", "mobile"] };
        const center = stack([X.monument(k, { min: 34, max: 76, weight: "400", color: "#2a2a26", lh: 1 }), note(k, P.tagline, { size: "12px", caps: "uppercase", track: "3px", color: "#5b5a52" })], { alignItems: "center", textAlign: "center", gap: "10px" });
        const right = { ...stack([X.info(k, ["mail"], { color: "#2a2a26", icon: "#34452f", size: "13px", inline: false }), btn(k, "Nous contacter", "/contact", "line", { fg: "#34452f", size: "13px", caps: "uppercase", track: "2px" })], { alignItems: "flex-end", gap: "10px" }), hideOn: ["tablet", "mobile"] };
        const fs = { ...X.fsMenu(k, { buttonLabel: "Menu", preset: "slide-right", color: "#2a2a26" }), hideOn: ["desktop"] };
        const gr = grid("230px 1fr 260px", [side, center, right, fs], { gap: "24px", alignItems: "center" }, { gridTemplate: "1fr auto", gap: "12px" }, { gridTemplate: "1fr", gap: "10px" });
        return [row(S, [gr], { paddingTop: "10px", paddingBottom: "10px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#c9c4b4" }, undefined, undefined, { display: "block" })];
      },
      mode: "static", anim: "reveal", hover: "", dark: false, tags: ["holding", "latéral", "monumental"],
      features: ["Navigation verticale à gauche (menu affecté à « En-tête »)", "Nom du site monumental à taille fluide, lisible dès 320 px", "Tablette et mobile : bouton « Menu » ouvrant un menu plein écran animé (Échap, focus piégé)", "Contact à renseigner et bouton souligné à droite"],
      animations: ["reveal"], settings: ["Couleurs", "Polices", "Espacement", "Animation d'entrée", "Menu plein écran"],
    },
  ],
};
