// Secteur « archi » (Architecture, immobilier et décoration) de la bibliothèque d'en-têtes : 10 modèles écrits sur mesure, chacun avec SA composition.
// Contrat : docs/theme-builder/HEADER_SECTOR_CONTRACT.md. Matrice détaillée : docs/theme-builder/headers-secteurs/archi.md.
//
// MATRICE DE CONCEPTION (silhouette en niveaux de gris, sans texte)
//  01 Silence      · Minimalisme architectural  · COLONNE CENTRÉE : marque minuscule, filet vertical qui se déroule, menu fin, lien souligné ; beaucoup de blanc
//  02 Trame        · Géométrique                · barre tricolore, grappe de FORMES (carré, disque, anneau, bande oblique), marque, menu en cases contour, bouton
//  03 Registre     · Cabinet à index de projets · en-tête HAUT à 3 colonnes séparées par des filets : marque + menu EMPILÉ | grande accroche | coordonnées (consignes) + devis
//  04 Cadastre     · Agence immobilière         · rangée blanche (marque, menu souligné, téléphone) + BANDE DE RECHERCHE de biens pleine largeur teintée
//  05 Trois Tiers  · Promoteur                  · en-tête coupé en TROIS TIERS pleins : marque anthracite | menu sur béton | devis sur brique
//  06 Terre Cuite  · Décoration chaleureuse     · bandeau défilant terre cuite, marque en serif encadrée de disques, recherche et pilule de menu arrondie
//  07 Cartouche    · Bureau d'études (mono)     · CARTOUCHE de plan : tableau à 4 cellules étiquetées (cabinet, navigation, contact, devis) sur bleu de calque, tout en monospace
//  08 Gros Œuvre   · Rénovation et artisans     · ruban jaune à bandes obliques + infos pratiques, bloc de marque jaune, menu en blocs, GROS bouton de devis
//  09 Haie Vive    · Paysagiste                 · grappe de disques verts, marque, accroche, bouton « Parcourir » = MENU PLEIN ÉCRAN numéroté, liseré dégradé
//  10 Cimaise      · Galerie de design          · ticker noir d'expo puis mur gris : CARTEL blanc (marque + légende) à gauche, menu en cases, compte, bouton vermillon
// Aucune image ni donnée inventée : textes en consigne à remplacer, menu = menu affecté à « En-tête », boutons vers /contact /inscription /blog /connexion.
// Limite connue du moteur commun : la recherche d'un modèle hors boutique vise le blog du site (header.js), pas un catalogue de biens.
const { ID, mark, nav, btn, search, account, note, g, stack, grid, band, inner, mv } = require("../blocks");
const X = require("../blocks2");
const { compact, sty } = require("../../kit");

// Une rangée : bande pleine largeur au fond voulu + contenu borné. o : bg, fg, pv, st (bande), inn (contenu), innT/innM, t/m (tablette / mobile de la bande)
const row = (k, kids, o = {}) => band(k.S, [inner(kids, { gap: "20px", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg || k.S.bg, color: o.fg || k.S.fg, paddingTop: o.pv, paddingBottom: o.pv, ...(o.st || {}) }),
  { paddingLeft: "18px", paddingRight: "18px", ...(o.t || {}) }, { paddingLeft: "14px", paddingRight: "14px", ...(o.m || {}) });
// Rangée sans marges latérales (cellules pleine largeur)
const flush = (S, kids, st = {}) => band(S, kids, { paddingLeft: "0px", paddingRight: "0px", ...st }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" });
const hide = (node, on = ["mobile"]) => ({ ...node, hideOn: on });
const bd = (c, w, side) => ({ borderStyle: "solid", borderWidth: "0px", [`border${side}Width`]: w, borderColor: c });
const cell = (kids, st = {}, t, m) => g(kids, { alignItems: "flex-start", flexDirection: "column", justifyContent: "center", gap: "10px", flexWrap: "nowrap", ...st }, t, m);
const label = (k, text, o = {}) => note(k, text, { size: "10.5px", color: o.color || k.S.mute, caps: "uppercase", track: "1.8px", font: o.font });
const block = (c, w, h, st = {}) => ({ type: "container", children: [], ...sty(compact({ width: w, height: h, backgroundColor: c, flexShrink: 0, ...st })) });
const small = (k, text, url, kind, o = {}) => btn(k, text, url, kind, { size: "13px", padV: "9px", padH: "16px", ...o });

module.exports = {
  sector: "archi",
  models: [
    // ─────────────────────────── 01 · Silence · minimalisme architectural ───────────────────────────
    {
      key: "archi-01", name: "Silence", art: "Minimalisme architectural", desc: "Une colonne centrée : un nom minuscule, un filet vertical qui se déroule, un menu fin et beaucoup de blanc. La sobriété d'un cabinet qui parle par ses plans.",
      S: ID("archi-01", "Silence", { bg: "#f7f6f3", fg: "#111111", mute: "#5a5955", alt: "#ecebe6", accent: "#111111", onAccent: "#f7f6f3", line: "#cdcbc4", font: "font.inter", head: "font.jost", weight: "500", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const stem = mv(X.vrule(k, { h: 34, w: "1px", color: S.fg }), "reveal", 250, 900);
        const nv = nav(k, "thin", { size: "12.5px", weight: "400", caps: "uppercase", track: "0.2em", gap: "36px", hover: S.mute });
        const act = g([nv, hide(X.vrule(k, { h: 14, color: S.line }), ["mobile", "tablet"]), btn(k, P.cta[0], P.cta[1], "line", { size: "12.5px", caps: "uppercase", track: "0.14em", weight: "500", fg: S.fg })], { gap: "26px", justifyContent: "center" }, undefined, { gap: "16px" });
        return [row(k, [stack([mark(k, { kind: "title", size: "15px", caps: "uppercase", track: "0.46em", weight: "500" }), stem, act], { alignItems: "center", gap: "16px", width: "100%" })], { pv: "30px", inn: { justifyContent: "center" }, st: { ...bd(S.line, "1px", "Bottom") } })];
      },
      mode: "static", anim: "soft", hover: "push", dark: false, tags: ["minimal", "colonne centrée", "filet", "blanc"],
      features: ["Colonne centrée : marque minuscule en capitales espacées, filet vertical et menu fin", "Le filet vertical se déroule à l'ouverture (révélation en masque)", "Menu du site replié derrière un bouton sur mobile ; demande de devis en simple lien souligné"],
      animations: ["fade-in", "reveal", "push"], settings: ["Couleurs", "Polices", "Taille et espacement de la marque", "Hauteur du filet", "Espacements", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 02 · Trame · géométrique ───────────────────────────
    {
      key: "archi-02", name: "Trame", art: "Géométrique", desc: "Une barre tricolore, une grappe de formes (carré, disque, anneau, bande oblique), la marque et un menu en cases contour : la grammaire d'un plan de masse.",
      S: ID("archi-02", "Trame", { bg: "#ffffff", fg: "#14213d", mute: "#4a5568", alt: "#f1f1ee", accent: "#fca311", onAccent: "#14213d", line: "#14213d", font: "font.work-sans", head: "font.outfit", weight: "700", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, red = "#d62828";
        const tri = flush(S, [g([block(S.fg, "50%", "8px"), block(S.accent, "30%", "8px"), block(red, "20%", "8px")], { gap: "0px", flexWrap: "nowrap", width: "100%" })], { paddingTop: "0px", paddingBottom: "0px" });
        const forms = g([mv(block(S.fg, "40px", "40px"), "fade-in-up", 0, 600), mv(X.disc(k, { size: 40, color: S.accent }), "fade-in-up", 90, 600), mv(X.ring(k, { size: 40, w: "4px", color: S.fg }), "fade-in-up", 180, 600), mv(X.slash(k, { w: 48, h: 40, color: red, angle: -24 }), "fade-in-up", 270, 600)], { gap: "10px", flexWrap: "nowrap" });
        return [tri, row(k, [hide(forms, ["mobile"]), mark(k, { kind: "title", size: "26px", weight: "800", caps: "uppercase", track: "0.04em" }), nav(k, "box", { size: "14px", weight: "600", caps: "uppercase", track: "0.08em", st: { marginLeft: "auto" } }), btn(k, P.cta[0], P.cta[1], "solid", { size: "14px", weight: "700", padV: "13px", padH: "22px" })], { pv: "20px", inn: { gap: "22px" } })];
      },
      mode: "sticky", anim: "rise", hover: "lift", dark: false, tags: ["géométrique", "formes", "tricolore", "cases"],
      features: ["Barre tricolore pleine largeur et grappe de formes natives (carré, disque, anneau, bande oblique)", "Menu en cases contour qui se remplissent au survol et au focus clavier", "Formes masquées sur mobile : marque, menu replié et devis restent"],
      animations: ["fade-in-up", "lift"], settings: ["Couleurs des formes", "Polices", "Taille de la marque", "Épaisseur de la barre", "Espacements", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 03 · Registre · cabinet d'architectes à index de projets ───────────────────────────
    {
      key: "archi-03", name: "Registre", art: "Cabinet à index de projets", desc: "Un en-tête haut, partagé en trois colonnes par des filets : marque et index vertical à gauche, grande accroche au centre, coordonnées et devis à droite.",
      P: { tagline: "Architecture, urbanisme et intérieur : votre accroche, à personnaliser." },
      S: ID("archi-03", "Registre", { bg: "#efede8", fg: "#1a1a1a", mute: "#55534d", alt: "#e2dfd6", accent: "#c2410c", onAccent: "#ffffff", line: "#1a1a1a", font: "font.dm-mono", head: "font.hanken-grotesk", weight: "700", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, col = { ...bd(S.line, "1px", "Right"), paddingTop: "26px", paddingBottom: "26px", paddingLeft: "28px", paddingRight: "28px" };
        const a = cell([mark(k, { kind: "title", size: "24px", weight: "800", caps: "uppercase", track: "0.06em" }), label(k, "Index"), hide(nav(k, "plain", { vertical: true, size: "16px", weight: "500", caps: "uppercase", track: "0.04em", gap: "6px", hover: S.accent }), ["mobile"]), hide(nav(k, "plain", { size: "14px" }), ["desktop", "tablet"])], { ...col, gap: "12px" }, { borderRightWidth: "0px" });
        const b = cell([mv(note(k, P.tagline, { size: "27px", color: S.fg, font: S.head, st: { fontWeight: "600", letterSpacing: "-0.01em", maxWidth: "520px", lineHeight: 1.15 } }), "reveal", 150, 900)], { ...col, justifyContent: "flex-start" }, { display: "none" }, { display: "none" });
        const c = cell([label(k, "Contact"), X.info(k, ["phone", "mail"], { inline: false, size: "13px", hideOn: ["mobile"] }), btn(k, P.cta[0], P.cta[1], "solid", { size: "13px", padV: "12px", padH: "20px", caps: "uppercase", track: "0.08em" })], { ...col, borderRightWidth: "0px", gap: "12px" });
        return [flush(S, [grid("300px 1fr 280px", [a, b, c], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" })], { ...bd(S.line, "1px", "Bottom"), borderTopWidth: "6px" })];
      },
      mode: "static", anim: "reveal", hover: "push", dark: false, tags: ["cabinet", "index", "menu empilé", "trois colonnes"],
      features: ["Index vertical : les liens du site empilés sous la marque (menu replié sur mobile)", "Grande accroche centrale (texte à personnaliser), révélée en masque", "Colonne de contact en consignes à remplacer et bouton de demande de devis"],
      animations: ["reveal", "fade-in", "push"], settings: ["Couleurs", "Polices", "Accroche", "Épaisseur des filets", "Espacements des colonnes", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 04 · Cadastre · agence immobilière ───────────────────────────
    {
      key: "archi-04", name: "Cadastre", art: "Agence immobilière avec recherche de biens", desc: "Une rangée d'agence (marque, menu souligné, téléphone) puis une bande teintée dédiée à la recherche de biens, avec le bouton d'estimation.",
      S: ID("archi-04", "Cadastre", { bg: "#ffffff", fg: "#12263a", mute: "#4a5d6e", alt: "#e6f2f1", accent: "#0f766e", onAccent: "#ffffff", line: "#cfe0de", font: "font.dm-sans", head: "font.manrope", weight: "800", btnRadius: "8px" }),
      build: (k, P) => {
        const S = k.S;
        const sr = search(k, { grow: true, max: "760px", placeholder: "Rechercher un bien…", button: "Rechercher", fieldBg: "#ffffff", fieldLine: "#ffffff", radius: "8px" });
        sr.parts.button = { styles: { desktop: { fontFamily: S.font, backgroundColor: S.fg, color: "#ffffff", borderRadius: "8px" } } };
        return [
          row(k, [mark(k, { kind: "title", size: "25px", weight: "800", track: "-0.02em" }), nav(k, "underline", { size: "14.5px", weight: "600", gap: "28px", st: { marginLeft: "auto" } }), X.info(k, ["phone"], { size: "13px", color: S.fg })], { pv: "16px", st: { ...bd(S.line, "1px", "Bottom") } }),
          row(k, [mv(note(k, "Trouver un bien", { size: "15px", color: "#ffffff", font: S.head, st: { fontWeight: "800", letterSpacing: "0.01em" } }), "fade-in-left", 100, 600), sr, small(k, "Estimer mon bien", "/contact", "solid", { bg: S.fg, fg: "#ffffff", size: "14px", padV: "12px", padH: "20px", radius: "8px" })], { bg: S.accent, fg: "#ffffff", pv: "14px", inn: { gap: "16px", flexWrap: "nowrap" }, innT: { flexWrap: "wrap" }, innM: { flexWrap: "wrap", gap: "10px" } }),
        ];
      },
      mode: "stickyshrink", anim: "rise", hover: "lift", dark: false, tags: ["immobilier", "recherche", "agence", "deux rangées"],
      features: ["Bande de recherche pleine largeur teintée, champ large et bouton (recherche native du site)", "Téléphone en consigne à remplacer (masqué sur mobile), menu souligné", "La rangée haute se réduit au défilement ; bouton d'estimation vers la page contact"],
      animations: ["fade-in-up", "fade-in-left", "lift"], settings: ["Couleurs", "Polices", "Bande de recherche (libellés)", "Arrondi des champs", "Réduction au défilement", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 05 · Trois Tiers · promoteur ───────────────────────────
    {
      key: "archi-05", name: "Trois Tiers", art: "Promoteur à tiers de page", desc: "L'en-tête est coupé en trois tiers pleins : la marque sur anthracite, le menu sur béton, le devis sur brique. Massif, lisible, sans détour.",
      P: { tagline: "Promotion immobilière : votre signature, à personnaliser." },
      S: ID("archi-05", "Trois Tiers", { bg: "#d9d6cf", fg: "#1c1c1c", mute: "#4a4843", alt: "#232323", accent: "#a63d2f", onAccent: "#ffffff", line: "#1c1c1c", font: "font.archivo", head: "font.archivo-black", weight: "400", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, pad = { paddingTop: "34px", paddingBottom: "34px", paddingLeft: "32px", paddingRight: "32px" }, padM = { paddingTop: "18px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px" };
        const c1 = cell([mark(k, { kind: "title", size: "30px", weight: "400", caps: "uppercase", track: "0.02em", color: "#ffffff" }), note(k, P.tagline, { size: "12px", color: "#d9d6cf" })], { backgroundColor: S.alt, ...pad, gap: "6px" }, undefined, padM);
        const c2 = cell([nav(k, "plain", { size: "14px", weight: "700", caps: "uppercase", track: "0.04em", gap: "16px", hover: S.accent })], { backgroundColor: S.bg, ...pad, ...bd(S.line, "1px", "Right"), alignItems: "center" }, undefined, padM);
        const c3 = cell([btn(k, P.cta[0], P.cta[1], "solid", { bg: "#ffffff", fg: S.alt, size: "15px", padV: "15px", padH: "26px", caps: "uppercase", track: "0.06em" }), hide(X.info(k, ["phone"], { color: "#ffffff", icon: "#ffffff", size: "13px" }))], { backgroundColor: S.accent, ...pad, alignItems: "center", gap: "10px" }, undefined, padM);
        return [flush(S, [grid("1fr 1fr 1fr", [mv(c1, "fade-in-right", 0, 700), c2, mv(c3, "fade-in-left", 150, 700)], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], {})];
      },
      mode: "static", anim: "zoom", hover: "pop", dark: false, tags: ["promoteur", "trois tiers", "béton", "blocs pleins"],
      features: ["Trois blocs pleins pleine largeur : marque, navigation, devis", "Les deux blocs d'extrémité entrent par les côtés", "Téléphone en consigne (masqué sur mobile) ; blocs empilés et compacts sur tablette et mobile"],
      animations: ["fade-in-right", "fade-in-left", "pop"], settings: ["Couleurs des trois blocs", "Polices", "Taille de la marque", "Espacements des blocs", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 06 · Terre Cuite · décoration d'intérieur chaleureuse ───────────────────────────
    {
      key: "archi-06", name: "Terre Cuite", art: "Décoration d'intérieur chaleureuse", desc: "Un bandeau défilant terre cuite, un nom en serif entre deux disques, la recherche et le devis, puis un menu dans une pilule arrondie.",
      S: ID("archi-06", "Terre Cuite", { bg: "#f4ebe0", fg: "#3b2a20", mute: "#6a5242", alt: "#ead9c4", accent: "#b5532a", onAccent: "#fff8f0", line: "#dcc7ac", font: "font.nunito-sans", head: "font.dm-serif-display", weight: "400", btnRadius: "999px", radius: "999px" }),
      build: (k, P) => {
        const S = k.S;
        const tk = X.ticker(k, ["Votre message d'accueil, à personnaliser", "Une offre ou un horaire, à personnaliser"], { speed: "slow", bg: S.accent, color: S.onAccent, caps: "uppercase", track: "0.16em", size: "11.5px", padV: "7px", sep: "✦" });
        const brand = g([X.disc(k, { size: 10, color: S.accent }), mark(k, { kind: "title", size: "36px", weight: "400", italic: true }), X.disc(k, { size: 10, color: S.accent })], { gap: "14px", justifyContent: "center", flexWrap: "nowrap" });
        const left = hide(search(k, { w: "380px", placeholder: "Rechercher…", radius: "999px" }), ["mobile"]);
        const right = g([hide(account(k, { size: "14px" })), btn(k, P.cta[0], P.cta[1], "pill", { size: "14px", padV: "11px", padH: "22px" })], { justifyContent: "flex-end", flexWrap: "nowrap", gap: "16px" }, { justifyContent: "center" }, { justifyContent: "center" });
        const pill = g([nav(k, "pill", { size: "14.5px", weight: "600", gap: "6px", hover: S.accent, onHover: S.onAccent })], { backgroundColor: S.alt, borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "8px", paddingRight: "8px", justifyContent: "center", flexWrap: "nowrap" });
        return [tk,
          row(k, [grid("1fr auto 1fr", [g([left], { justifyContent: "flex-start" }, { justifyContent: "center" }), mv(brand, "fade-in-down", 0, 800), right], { width: "100%", gap: "24px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { pv: "20px" }),
          row(k, [pill], { pv: "6px", st: { paddingBottom: "18px" }, inn: { justifyContent: "center" } })];
      },
      mode: "sticky", anim: "rise", hover: "grow", dark: false, tags: ["décoration", "chaleureux", "ticker", "pilule"],
      features: ["Bandeau défilant d'annonces (pause au survol et au clavier, immobile si l'on réduit les animations)", "Nom en serif italique entre deux disques, recherche à gauche et devis à droite", "Menu dans une pilule arrondie dont les liens se remplissent au survol"],
      animations: ["fade-in-down", "fade-in-up", "grow"], settings: ["Couleurs", "Polices", "Annonces du bandeau et vitesse", "Taille de la marque", "Arrondi de la pilule", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 07 · Cartouche · bureau d'études technique ───────────────────────────
    {
      key: "archi-07", name: "Cartouche", art: "Bureau d'études technique", desc: "Le cartouche d'un plan : un tableau à quatre cellules étiquetées sur bleu de calque, tout en monospace. L'en-tête d'un bureau d'études qui dessine ses pièces.",
      P: { tagline: "Études, structure et fluides : votre signature, à personnaliser." },
      S: ID("archi-07", "Cartouche", { bg: "#0b2a4a", fg: "#e8f1fb", mute: "#9db8d3", alt: "#123a63", accent: "#ffd23f", onAccent: "#0b2a4a", line: "#3b6a99", font: "font.ibm-plex-mono", head: "font.ibm-plex-sans", weight: "600", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, c = { ...bd(S.line, "1px", "Right"), paddingTop: "14px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "20px", gap: "8px" };
        const c1 = cell([label(k, "Cabinet"), mark(k, { kind: "title", size: "19px", weight: "600", caps: "uppercase", track: "0.08em" }), note(k, P.tagline, { size: "11px", color: S.mute })], c, { borderRightWidth: "0px" });
        const c2 = cell([label(k, "Navigation"), nav(k, "mono", { size: "13px", weight: "500", caps: "uppercase", track: "0.06em", gap: "20px", hover: S.accent })], c, { borderRightWidth: "0px" });
        const c3 = cell([label(k, "Contact"), X.info(k, ["phone", "mail"], { inline: false, size: "12.5px", color: S.fg, hideOn: ["mobile"] })], c, { borderRightWidth: "0px" });
        const c4 = cell([label(k, "Devis"), btn(k, P.cta[0], P.cta[1], "solid", { size: "12.5px", padV: "10px", padH: "16px", caps: "uppercase", track: "0.06em", font: S.font })], { ...c, borderRightWidth: "0px", backgroundColor: S.alt });
        return [row(k, [grid("5fr 8fr 5fr 4fr", [mv(c1, "fade-in", 0, 600), mv(c2, "fade-in", 120, 600), mv(c3, "fade-in", 240, 600), mv(c4, "fade-in", 360, 600)], { width: "100%", gap: "0px", alignItems: "stretch", borderStyle: "solid", borderWidth: "1px", borderColor: S.line }, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" })], { pv: "12px", inn: { gap: "0px" } })];
      },
      mode: "stickyhide", anim: "soft", hover: "push", dark: true, tags: ["cartouche", "monospace", "bleu de calque", "tableau"],
      features: ["Tableau à quatre cellules étiquetées, filets fins comme un cartouche de plan", "Menu monospace, coordonnées en consignes à remplacer, cellule de devis à part", "Se cache en descendant la page et revient en remontant"],
      animations: ["fade-in", "push"], settings: ["Couleurs", "Police monospace", "Libellés des cellules", "Couleur des filets", "Espacements des cellules", "Animation d'entrée", "Survol des boutons", "Comportement au défilement"],
    },
    // ─────────────────────────── 08 · Gros Œuvre · rénovation et artisans ───────────────────────────
    {
      key: "archi-08", name: "Gros Œuvre", art: "Rénovation et artisans", desc: "Un ruban de chantier jaune à bandes obliques portant les infos pratiques, un bloc de marque jaune, un menu en blocs et un gros bouton de devis.",
      S: ID("archi-08", "Gros Œuvre", { bg: "#1b1b1b", fg: "#f5f5f0", mute: "#b8b8b0", alt: "#2a2a2a", accent: "#ffc400", onAccent: "#1b1b1b", line: "#444444", font: "font.barlow", head: "font.barlow-condensed", weight: "800", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, sl = Array.from({ length: 9 }, () => X.slash(k, { w: 20, h: 22, color: S.onAccent, angle: -30 }));
        const tape = row(k, [X.info(k, ["phone", "hours"], { color: S.onAccent, icon: S.onAccent, size: "13px", gap: "22px" }), hide(g(sl, { gap: "12px", flexWrap: "nowrap" }), ["mobile"])], { bg: S.accent, fg: S.onAccent, pv: "7px", inn: { gap: "16px", flexWrap: "nowrap" } });
        const brand = g([mark(k, { kind: "title", size: "30px", weight: "800", caps: "uppercase", track: "0.04em", color: S.onAccent })], { backgroundColor: S.accent, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "22px", paddingRight: "22px" });
        return [tape, row(k, [brand, nav(k, "block", { size: "16px", weight: "700", caps: "uppercase", track: "0.06em", st: { marginLeft: "auto" } }), btn(k, P.cta[0], P.cta[1], "solid", { size: "17px", weight: "800", caps: "uppercase", track: "0.05em", padV: "16px", padH: "30px" })], { pv: "0px", inn: { gap: "22px" }, innM: { gap: "10px" } })];
      },
      mode: "stickyshrink", anim: "slide", hover: "bounce", dark: true, tags: ["chantier", "jaune", "ruban", "devis"],
      features: ["Ruban de chantier jaune : téléphone et horaires en consignes à remplacer, bandes obliques décoratives", "Bloc de marque jaune plein, menu en blocs qui s'allument au survol", "Gros bouton de demande de devis toujours visible ; la rangée se réduit au défilement"],
      animations: ["slide-in-left", "slide-in-right", "bounce"], settings: ["Couleurs", "Polices", "Informations pratiques", "Taille de la marque", "Taille du bouton de devis", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 09 · Haie Vive · paysagiste ───────────────────────────
    {
      key: "archi-09", name: "Haie Vive", art: "Paysagiste", desc: "Une grappe de disques verts, la marque, une accroche, et un bouton « Parcourir » qui ouvre un menu plein écran numéroté. Un liseré dégradé comme une haie.",
      P: { tagline: "Jardins et paysages : votre accroche, à personnaliser." },
      S: ID("archi-09", "Haie Vive", { bg: "#f1f5ee", fg: "#1f3326", mute: "#4a6050", alt: "#dfe9d8", accent: "#3f7d4e", onAccent: "#ffffff", line: "#c9d9c3", font: "font.figtree", head: "font.young-serif", weight: "400", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S;
        const cluster = g([X.disc(k, { size: 30, color: "#3f7d4e" }), X.disc(k, { size: 22, color: "#8fbf7a" }), X.disc(k, { size: 14, color: "#d9a441" })], { gap: "6px", flexWrap: "nowrap", alignItems: "center" });
        const brand = g([mv(cluster, "zoom-in", 0, 700), mark(k, { kind: "title", size: "27px", weight: "400" })], { gap: "12px", flexWrap: "nowrap" });
        const menu = X.fsMenu(k, { buttonLabel: "Parcourir", closeLabel: "Fermer", numbers: true, align: "left", preset: "circle", color: S.fg, font: S.font, size: "15px" });
        return [row(k, [brand, hide(note(k, P.tagline, { size: "13px", color: S.mute, st: { maxWidth: "280px" } }), ["mobile", "tablet"]), g([menu, btn(k, P.cta[0], P.cta[1], "pill", { size: "14px", padV: "11px", padH: "22px" })], { gap: "18px", flexWrap: "nowrap", marginLeft: "auto" })], { pv: "16px", inn: { gap: "24px", flexWrap: "nowrap" }, innT: { gap: "14px" } }),
          X.stripe(k, { h: 6, gradient: { from: "#3f7d4e", to: "#d9a441", angle: 90 } })];
      },
      mode: "stickyhide", anim: "soft", hover: "float", dark: false, tags: ["paysagiste", "menu plein écran", "disques", "vert"],
      features: ["Menu plein écran numéroté (liens du menu affecté), Échap pour fermer, sur ordinateur et mobile", "Trois disques verts et ocre et liseré dégradé natifs, accroche à personnaliser", "Se cache en descendant la page et revient en remontant"],
      animations: ["zoom-in", "fade-in", "float"], settings: ["Couleurs", "Polices", "Libellés du bouton de menu", "Style d'ouverture du menu", "Liseré dégradé", "Animation d'entrée", "Survol des boutons", "Comportement au défilement"],
    },
    // ─────────────────────────── 10 · Cimaise · galerie de design ───────────────────────────
    {
      key: "archi-10", name: "Cimaise", art: "Galerie de design", desc: "Un ticker noir d'exposition puis un mur gris : un cartel blanc porte la marque, le menu se range en cases, et le bouton vermillon invite à écrire.",
      P: { tagline: "Galerie de design : votre légende, à personnaliser." },
      S: ID("archi-10", "Cimaise", { bg: "#dcdad4", fg: "#151515", mute: "#4d4b46", alt: "#f6f5f1", accent: "#ff4a2a", onAccent: "#151515", line: "#151515", font: "font.space-grotesk", head: "font.instrument-serif", weight: "400", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const tk = X.ticker(k, ["Exposition en cours : votre annonce, à personnaliser", "Prochain vernissage : votre date, à personnaliser"], { speed: "normal", bg: "#151515", color: "#f6f5f1", caps: "uppercase", track: "0.14em", size: "11px", padV: "7px", sep: "/" });
        const cartel = g([mark(k, { kind: "title", size: "28px", weight: "400", italic: true, color: S.fg }), note(k, P.tagline, { size: "11px", color: S.mute, st: { maxWidth: "230px" } })], { flexDirection: "column", alignItems: "flex-start", gap: "4px", flexWrap: "nowrap", backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "22px", paddingRight: "26px" });
        const tiles = X.navTiles(k, "box", { w: 560, gap: "6px", padV: "9px", padH: "15px", border: S.line, bg: "transparent", size: "13.5px", weight: "500", hover: S.accent, onHover: S.onAccent });
        const acts = g([hide(account(k, { size: "13.5px" }), ["mobile"]), btn(k, P.cta[0], P.cta[1], "solid", { size: "13.5px", padV: "12px", padH: "20px", caps: "uppercase", track: "0.08em" })], { gap: "16px", flexWrap: "nowrap" });
        return [tk, row(k, [mv(cartel, "fade-in-up", 0, 700), g([tiles], { marginLeft: "auto" }, { marginLeft: "0px" }), acts], { pv: "18px", st: { ...bd(S.line, "1px", "Bottom") }, inn: { gap: "22px" } })];
      },
      mode: "sticky", anim: "reveal", hover: "tilt", dark: false, tags: ["galerie", "cartel", "ticker", "cases"],
      features: ["Ticker d'exposition : annonces à personnaliser, pause au survol et au clavier", "Cartel blanc encadré qui porte la marque en italique et une légende", "Menu rangé en cases contour, compte du site, bouton de contact vermillon"],
      animations: ["reveal", "fade-in-up", "tilt"], settings: ["Couleurs", "Polices", "Annonces du ticker", "Texte du cartel", "Largeur du bloc de menu", "Animation d'entrée", "Survol des boutons"],
    },
  ],
};
