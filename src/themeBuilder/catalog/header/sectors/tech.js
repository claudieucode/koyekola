// Secteur « tech » (Technologie, SaaS et startups) de la bibliothèque d'en-têtes : 10 modèles écrits sur mesure, chacun avec SA composition.
// Contrat : docs/theme-builder/HEADER_SECTOR_CONTRACT.md. Matrice détaillée : docs/theme-builder/headers-secteurs/tech.md.
//
// MATRICE DE CONCEPTION (silhouette en niveaux de gris, sans texte)
//  01 Helvète   · Minimalisme suisse        · filet noir épais, grille de 4 colonnes : marque + « Index », menu EMPILÉ, accroche, actions (menu replié sur mobile)
//  02 Néon Vide · Futuriste sombre          · liseré lumineux + TROIS îlots flottants en capsule (marque, menu en pilule, actions), superposé au visuel
//  03 Invite    · Terminal / développeur    · bande unique ultra-fine : 3 pastilles de fenêtre, invite « $ », menu mono, barre de COMMANDE (recherche), bouton
//  04 Manuel    · Documentation à sommaire  · DEUX colonnes asymétriques : colonne de sommaire (marque, version) | recherche + actions au-dessus d'onglets
//  05 Atlas     · SaaS à méga-barre         · rangée haute (marque, recherche, démo, essai) + MÉGA-BARRE : les liens du menu forment des cases pleine largeur
//  06 Pulsar    · Startup IA à pastille     · orbe dégradé + marque à gauche ; à droite pastille d'annonce au-dessus du menu et des actions
//  07 Stratus   · Plateforme cloud, 2 niveaux · barre d'ÉTAT sombre (pastille verte, date, connexion) puis rangée : bloc de marque plein, onglets pleine hauteur
//  08 Quadrant  · Fintech géométrique       · en-tête SEGMENTÉ en 4 cellules (disque + anneau, menu, connexion, cellule d'appel sombre) + liseré dégradé
//  09 Endpoint  · API / outil développeur   · ticker mono sombre, puis colonne gauche (badge « API », marque, menu mono) et colonne droite (documentation, démo)
//  10 Rail      · Hardware                  · case orange portant le bouton du PANNEAU coulissant du menu, marque condensée, bande oblique, contact + bouton
// Aucune image ni donnée inventée : textes en consigne à remplacer, menu = menu affecté à « En-tête », boutons vers /contact /inscription /blog /connexion.
const { ID, mark, nav, btn, search, account, date, note, tag, g, stack, grid, band, inner, mv } = require("../blocks");
const X = require("../blocks2");
const { compact } = require("../../kit");

// Une rangée : bande pleine largeur au fond voulu + contenu borné. o : bg, fg, pv, st (style de la bande), inn (style du contenu), t/m (tablette / mobile de la bande)
const row = (k, kids, o = {}) => band(k.S, [inner(kids, { gap: "20px", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg || k.S.bg, color: o.fg || k.S.fg, paddingTop: o.pv, paddingBottom: o.pv, ...(o.st || {}) }),
  { paddingLeft: "18px", paddingRight: "18px", ...(o.t || {}) }, { paddingLeft: "14px", paddingRight: "14px", ...(o.m || {}) });
const hide = (node, on = ["mobile"]) => ({ ...node, hideOn: on });
const bd = (c, w, side) => ({ borderStyle: "solid", borderWidth: "0px", [`border${side}Width`]: w, borderColor: c });
const small = (k, label, url, kind, o = {}) => btn(k, label, url, kind, { size: "13px", padV: "9px", padH: "16px", ...o });
const full = (S, kids, t, m) => band(S, kids, { paddingLeft: "0px", paddingRight: "0px", ...bd(S.line, "1px", "Bottom") }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" });

module.exports = {
  sector: "tech",
  models: [
    // ─────────────────────────── 01 · Helvète · minimalisme suisse ───────────────────────────
    {
      key: "tech-01", name: "Helvète", art: "Minimalisme suisse", desc: "Filet noir épais, grille de quatre colonnes et menu empilé : la rigueur typographique d'un produit sans fioriture.",
      S: ID("tech-01", "Helvète", { bg: "#ffffff", fg: "#0a0a0a", mute: "#565656", alt: "#f1f1ee", accent: "#e30613", onAccent: "#ffffff", line: "#0a0a0a", font: "font.inter", head: "font.inter-tight", weight: "800", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const cMark = stack([note(k, "Index", { size: "11px", color: S.mute, caps: "uppercase", track: "1.6px" }), mark(k, { kind: "title", size: "26px", weight: "800", track: "-0.04em", lh: 1 })], { gap: "10px", alignItems: "flex-start" });
        const cNav = stack([hide(nav(k, "plain", { size: "16px", weight: "600" }), ["desktop", "tablet"]), hide(nav(k, "thin", { vertical: true, size: "17px", weight: "500", color: S.fg, hover: S.accent }))], { gap: "0px", alignItems: "flex-start" });
        const cNote = hide(note(k, P.tagline, { size: "14px", color: S.mute, st: { maxWidth: "280px" } }));
        const cAct = stack([account(k, { size: "15px" }), btn(k, "Démonstration", "/contact", "line", { size: "14px", fg: S.fg }), btn(k, P.cta[0], P.cta[1], "solid", { size: "14px", padV: "12px", padH: "22px" })], { gap: "14px", alignItems: "flex-start" });
        return [row(k, [grid("1fr 1fr 1.3fr 1fr", [cMark, cNav, cNote, cAct], { width: "100%", gap: "32px", alignItems: "start" }, { gridTemplate: "1fr 1fr", gap: "22px" }, { gridTemplate: "1fr", gap: "14px" })], { pv: "22px", st: { ...bd(S.fg, "6px", "Top") } })];
      },
      mode: "static", anim: "reveal", hover: "push", dark: false, tags: ["suisse", "grille", "menu empilé", "minimal"],
      features: ["Filet épais et grille de quatre colonnes alignée", "Menu du site affiché en liste verticale (replié en menu classique sur mobile)", "Connexion, démonstration et bouton d'appel groupés dans la quatrième colonne"],
      animations: ["reveal", "fade-in", "push"], settings: ["Couleurs", "Polices", "Taille de la marque", "Espacements", "Épaisseur du filet", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 02 · Néon Vide · futuriste sombre ───────────────────────────
    {
      key: "tech-02", name: "Néon Vide", art: "Futuriste sombre", desc: "Trois îlots en capsule qui flottent sous un liseré lumineux : marque, menu en pilule, actions. L'en-tête se superpose au visuel d'ouverture.",
      S: ID("tech-02", "Néon Vide", { bg: "#06070d", fg: "#e9edff", mute: "#a3acd0", alt: "#0f1222", accent: "#7df9ff", onAccent: "#04121a", line: "#2a3052", font: "font.space-grotesk", head: "font.unbounded", weight: "600", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S, isl = { backgroundColor: S.alt, borderRadius: "999px", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, alignItems: "center", flexWrap: "nowrap" };
        const i1 = mv(g([X.disc(k, { size: 22, gradient: { from: S.accent, to: "#a78bfa", angle: 135 } }), mark(k, { kind: "logo", size: "17px", weight: "600", track: "0.02em" })], { ...isl, gap: "10px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "22px" }), "fade-in-down", 0, 600);
        const i2 = mv(g([nav(k, "pill", { size: "14px", weight: "500", hover: S.accent, onHover: S.onAccent })], { ...isl, paddingTop: "5px", paddingBottom: "5px", paddingLeft: "6px", paddingRight: "6px" }), "fade-in-down", 120, 600);
        const i3 = mv(g([hide(account(k, { size: "14px" })), btn(k, P.cta[0], P.cta[1], "pill", { size: "14px", padV: "10px", padH: "20px" })], { ...isl, gap: "14px", paddingTop: "5px", paddingBottom: "5px", paddingLeft: "20px", paddingRight: "5px" }), "fade-in-down", 240, 600);
        return [X.stripe(k, { h: 3, gradient: { from: S.accent, to: "#a78bfa", angle: 90 } }),
          row(k, [i1, i2, i3], { bg: "transparent", pv: "14px", inn: { gap: "12px", flexWrap: "wrap", justifyContent: "space-between" }, innM: { justifyContent: "space-between", gap: "8px" } })];
      },
      mode: "overlay", anim: "zoom", hover: "pulse", dark: true, tags: ["futuriste", "capsules", "verre", "sombre"],
      features: ["Trois capsules flottantes indépendantes sous un liseré dégradé", "Menu en pilules avec survol lumineux, replié en menu sur mobile", "Posé sur le visuel d'ouverture (en-tête superposé) : seuls les trois îlots sont visibles"],
      animations: ["fade-in-down", "zoom-in", "pulse"], settings: ["Couleurs", "Polices", "Dégradé du liseré", "Espacements", "Superposition", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 03 · Invite · terminal ───────────────────────────
    {
      key: "tech-03", name: "Invite", art: "Terminal développeur", desc: "Une seule bande fine façon fenêtre de terminal : pastilles, invite « $ », menu monospace et barre de commande pour chercher.",
      S: ID("tech-03", "Invite", { bg: "#070b07", fg: "#c9f7d3", mute: "#86b894", alt: "#101a11", accent: "#4dff88", onAccent: "#04140a", line: "#1f3322", font: "font.jetbrains-mono", head: "font.jetbrains-mono", weight: "600", btnRadius: "3px" }),
      build: (k, P) => {
        const S = k.S, dots = g([X.disc(k, { size: 10, color: "#ff5f56" }), X.disc(k, { size: 10, color: "#ffbd2e" }), X.disc(k, { size: 10, color: "#27c93f" })], { gap: "6px", flexWrap: "nowrap" });
        const prompt = g([note(k, "$", { size: "14px", color: S.accent, font: S.font, st: { fontWeight: "700" } }), mark(k, { kind: "title", size: "14px", weight: "600", track: "0.02em", font: S.font })], { gap: "8px", flexWrap: "nowrap" });
        const cmd = search(k, { grow: true, max: "420px", placeholder: "Taper une commande…", button: "Entrée", radius: "3px", fieldBg: S.alt, fieldLine: S.line });
        return [row(k, [hide(dots), prompt, nav(k, "mono", { size: "12.5px", weight: "500", gap: "18px", hover: S.accent }), cmd, small(k, "Démonstration", "/contact", "outline", { size: "12px", padV: "5px", padH: "12px", fg: S.accent, border: S.accent })],
          { pv: "8px", inn: { gap: "16px", flexWrap: "nowrap" }, innT: { flexWrap: "wrap", gap: "10px" }, innM: { flexWrap: "wrap", gap: "8px" }, st: { ...bd(S.line, "1px", "Bottom") } })];
      },
      mode: "sticky", anim: "soft", hover: "push", dark: true, tags: ["terminal", "mono", "commande", "ultra-fin"],
      features: ["Bande unique ultra-fine façon fenêtre de terminal", "Barre de commande : recherche du site (Entrée pour lancer)", "Menu en police monospace, lien de démonstration en contour"],
      animations: ["fade-in", "push"], settings: ["Couleurs", "Police monospace", "Hauteur de la bande", "Libellés de la recherche", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 04 · Manuel · documentation à sommaire ───────────────────────────
    {
      key: "tech-04", name: "Manuel", art: "Documentation à sommaire", desc: "Deux colonnes asymétriques : un sommaire à gauche (marque, version) et, à droite, la recherche puis des onglets de navigation.",
      S: ID("tech-04", "Manuel", { bg: "#ffffff", fg: "#1b2330", mute: "#566173", alt: "#f3f6fb", accent: "#0b57d0", onAccent: "#ffffff", line: "#d6deea", font: "font.ibm-plex-sans", head: "font.ibm-plex-sans", weight: "700", btnRadius: "6px" }),
      build: (k, P) => {
        const S = k.S;
        const left = g([mark(k, { kind: "logo", size: "19px", weight: "700" }), g([tag(k, "Docs", { radius: "4px" }), note(k, "Version à indiquer", { size: "12px", color: S.mute })], { gap: "10px", flexWrap: "nowrap" })],
          { flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: "10px", flexWrap: "nowrap", backgroundColor: S.alt, ...bd(S.line, "1px", "Right"), paddingTop: "22px", paddingBottom: "22px", paddingLeft: "28px", paddingRight: "28px" },
          { paddingLeft: "22px", paddingRight: "22px" }, { flexDirection: "row", alignItems: "center", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", ...bd(S.line, "1px", "Bottom"), justifyContent: "space-between" });
        const top = g([search(k, { grow: true, max: "480px", placeholder: "Rechercher dans la documentation…", radius: "6px", st: { minWidth: "0px" } }), g([account(k, { size: "14px" }), small(k, P.cta[0], P.cta[1], "solid")], { gap: "14px", flexWrap: "nowrap" })],
          { minWidth: "0px", justifyContent: "space-between", flexWrap: "nowrap", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "28px", paddingRight: "24px", ...bd(S.line, "1px", "Bottom") }, { paddingLeft: "22px", paddingRight: "18px", flexWrap: "wrap" }, { paddingLeft: "16px", paddingRight: "14px", flexWrap: "wrap", gap: "10px" });
        const tabs = g([nav(k, "tab", { size: "14px", weight: "600", hover: S.accent })], { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px" }, { paddingLeft: "8px", paddingRight: "8px" });
        const right = stack([top, tabs], { gap: "0px", alignItems: "stretch", minWidth: "0px" });
        return [full(S, [grid("300px 1fr", [left, right], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "230px 1fr" }, { gridTemplate: "1fr" })])];
      },
      mode: "sticky", anim: "slide", hover: "lift", dark: false, tags: ["documentation", "sommaire", "deux colonnes", "recherche"],
      features: ["Colonne de sommaire distincte avec marque et pastille « Docs »", "Recherche large au-dessus de la navigation en onglets", "Connexion et bouton d'appel toujours accessibles ; sur mobile, la colonne devient une barre"],
      animations: ["slide-in-left", "fade-in-down", "lift"], settings: ["Couleurs", "Polices", "Largeur de la colonne", "Libellé de version", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 05 · Atlas · SaaS à méga-barre ───────────────────────────
    {
      key: "tech-05", name: "Atlas", art: "SaaS à méga-barre", desc: "Une rangée d'outils (marque, recherche, démonstration, essai) et une méga-barre de blocs : chaque lien du menu devient une grande case.",
      S: ID("tech-05", "Atlas", { bg: "#ffffff", fg: "#111827", mute: "#586175", alt: "#f1f2fb", accent: "#4f46e5", onAccent: "#ffffff", line: "#dfe1f2", font: "font.inter", head: "font.manrope", weight: "800", btnRadius: "10px" }),
      build: (k, P) => {
        const S = k.S;
        const tiles = X.navTiles(k, "box", { w: 1240, gap: "10px", padV: "16px", padH: "26px", border: S.line, bg: S.bg, size: "15px", weight: "700" });
        tiles.parts.list.styles.desktop = { ...tiles.parts.list.styles.desktop, width: "100%" };
        tiles.parts.link.styles.desktop = { ...tiles.parts.link.styles.desktop, borderRadius: "10px", flexGrow: 1, textAlign: "center" };
        const top = row(k, [mark(k, { kind: "logo", size: "24px", weight: "800", track: "-0.02em" }), search(k, { grow: true, max: "440px", placeholder: "Rechercher…", radius: "10px" }), g([hide(account(k, { size: "14px" })), small(k, "Démonstration", "/contact", "outline", { radius: "10px" }), small(k, P.cta[0], P.cta[1], "solid", { radius: "10px" })], { gap: "10px", flexWrap: "nowrap" })],
          { pv: "16px", inn: { gap: "22px", flexWrap: "wrap" } });
        const mega = row(k, [tiles], { bg: S.alt, pv: "14px", st: { ...bd(S.line, "1px", "Top"), borderBottomWidth: "1px" }, inn: { justifyContent: "flex-start" } });
        return [top, mega];
      },
      mode: "stickyshrink", anim: "soft", hover: "grow", dark: false, tags: ["saas", "méga-menu", "blocs", "recherche"],
      features: ["Méga-barre pleine largeur : les liens du menu affecté deviennent de grandes cases", "Recherche, démonstration et essai gratuit dans la rangée haute", "La rangée haute se réduit au défilement"],
      animations: ["fade-in", "grow"], settings: ["Couleurs", "Polices", "Taille et arrondi des blocs", "Espacements", "Comportement au défilement", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 06 · Pulsar · startup IA à pastille d'annonce ───────────────────────────
    {
      key: "tech-06", name: "Pulsar", art: "Startup IA à pastille", desc: "Un orbe dégradé et la marque à gauche ; à droite, une pastille d'annonce posée au-dessus du menu et des actions.",
      S: ID("tech-06", "Pulsar", { bg: "#fbf8ff", fg: "#1a1033", mute: "#5d5280", alt: "#efe8ff", accent: "#6d3bff", onAccent: "#ffffff", line: "#ddd2f6", font: "font.dm-sans", head: "font.sora", weight: "700", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S;
        const left = g([X.disc(k, { size: 40, gradient: { from: "#6d3bff", to: "#ff5fa8", angle: 135 } }), mark(k, { kind: "logo", size: "24px", weight: "700", track: "-0.03em" })], { gap: "12px", flexWrap: "nowrap" });
        const pill = mv(g([tag(k, P.tag || "Nouveau", { radius: "999px", st: { whiteSpace: "nowrap", flexShrink: 0 } }), note(k, P.notice, { size: "12.5px", color: S.fg })], { gap: "10px", flexWrap: "nowrap", backgroundColor: "#ffffff", borderRadius: "999px", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, paddingTop: "4px", paddingBottom: "4px", paddingLeft: "4px", paddingRight: "16px", maxWidth: "100%" }), "zoom-in", 320, 600);
        const act = g([nav(k, "plain", { size: "15px", weight: "600", hover: S.accent }), account(k, { size: "14px" }), btn(k, P.cta[0], P.cta[1], "pill", { size: "14px", padV: "10px", padH: "22px" })], { gap: "18px", justifyContent: "flex-end", flexWrap: "nowrap" }, { flexWrap: "wrap" }, { gap: "10px", justifyContent: "space-between" });
        const right = stack([pill, act], { gap: "12px", alignItems: "flex-end" }, undefined, { alignItems: "stretch" });
        return [row(k, [grid("auto 1fr", [left, right], { width: "100%", gap: "32px", alignItems: "center" }, { gap: "20px" }, { gridTemplate: "1fr", gap: "12px" })], { pv: "16px", bg: S.bg })];
      },
      mode: "sticky", anim: "rise", hover: "float", dark: false, tags: ["ia", "annonce", "dégradé", "startup"],
      features: ["Pastille d'annonce (texte à personnaliser) au-dessus du menu", "Orbe dégradé de marque et bouton en pilule", "Menu, connexion et appel groupés sur un second étage à droite"],
      animations: ["fade-in-up", "zoom-in", "float"], settings: ["Couleurs", "Polices", "Dégradé de l'orbe", "Texte et pastille d'annonce", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 07 · Stratus · plateforme cloud à deux niveaux ───────────────────────────
    {
      key: "tech-07", name: "Stratus", art: "Plateforme cloud à deux niveaux", desc: "Une barre d'état sombre avec pastille verte, puis une rangée de produit : bloc de marque plein, onglets pleine hauteur, boutons.",
      S: ID("tech-07", "Stratus", { bg: "#ffffff", fg: "#0b2239", mute: "#4a6076", alt: "#eef4fa", accent: "#0a6cff", onAccent: "#ffffff", line: "#d3e1ef", font: "font.red-hat-text", head: "font.red-hat-display", weight: "800", btnRadius: "6px" }),
      build: (k, P) => {
        const S = k.S, bar = "#071a2e", barFg = "#d9e7f6";
        const status = mv(g([X.disc(k, { size: 9, color: "#3ddc84" }), note(k, "État des services : texte à personnaliser", { size: "12.5px", color: barFg })], { gap: "8px", flexWrap: "nowrap" }), "fade-in-down", 200, 500);
        const top = row(k, [status, g([date(k, { color: "#9db8d2" }), account(k, { size: "12.5px", color: barFg })], { gap: "18px", flexWrap: "nowrap" })], { bg: bar, fg: barFg, pv: "7px" });
        const block = g([mark(k, { kind: "logo", size: "22px", weight: "800", color: S.onAccent, st: { whiteSpace: "nowrap" } })], { backgroundColor: S.accent, alignSelf: "stretch", alignItems: "center", flexShrink: 0, paddingLeft: "28px", paddingRight: "28px", paddingTop: "14px", paddingBottom: "14px", flexWrap: "nowrap" }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "16px", paddingRight: "16px" });
        const tabs = g([nav(k, "tab", { size: "14.5px", weight: "700", hover: S.accent })], { alignSelf: "stretch", alignItems: "stretch", flexGrow: 1, paddingLeft: "12px" }, undefined, { flexGrow: 1, paddingLeft: "6px", flexShrink: 0 });
        const acts = g([hide(small(k, "Documentation", "/blog", "outline", { fg: S.fg, border: S.line })), small(k, P.cta[0], P.cta[1], "solid")], { gap: "10px", flexWrap: "nowrap", paddingLeft: "16px", paddingRight: "28px", marginLeft: "auto" }, { paddingRight: "18px" }, { paddingLeft: "0px", paddingRight: "14px" });
        return [top, full(S, [g([block, tabs, acts], { alignItems: "center", flexWrap: "nowrap", gap: "0px", width: "100%" })])];
      },
      mode: "stickyhide", anim: "soft", hover: "lift", dark: false, tags: ["cloud", "statut", "deux niveaux", "onglets"],
      features: ["Barre d'état sombre : pastille verte, message à personnaliser, date et connexion", "Bloc de marque plein et onglets pleine hauteur", "L'en-tête se cache en descendant et revient en remontant"],
      animations: ["fade-in", "fade-in-down", "lift"], settings: ["Couleurs", "Polices", "Message d'état", "Couleur de la pastille", "Comportement au défilement", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 08 · Quadrant · fintech géométrique ───────────────────────────
    {
      key: "tech-08", name: "Quadrant", art: "Fintech géométrique", desc: "Un en-tête découpé en quatre cellules : formes géométriques de marque, menu, connexion et cellule d'appel sombre, sous un liseré dégradé.",
      S: ID("tech-08", "Quadrant", { bg: "#f2fbf6", fg: "#052a1f", mute: "#3b6757", alt: "#e0f3e8", accent: "#12c98c", onAccent: "#052a1f", line: "#052a1f", font: "font.figtree", head: "font.familjen-grotesk", weight: "700", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, cell = { ...bd(S.line, "1px", "Right"), alignItems: "center", flexWrap: "nowrap", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "26px", paddingRight: "26px" };
        const c1 = g([X.disc(k, { size: 30, color: S.fg }), X.ring(k, { size: 30, w: "3px", color: S.fg }), mark(k, { kind: "logo", size: "20px", weight: "700", color: S.onAccent, st: { marginLeft: "6px" } })], { ...cell, backgroundColor: S.accent, gap: "8px" });
        const c2 = g([nav(k, "underline", { size: "15px", weight: "600", hover: S.accent, gap: "24px" })], cell);
        const c3 = hide(g([account(k, { size: "14.5px", st: { whiteSpace: "nowrap" } }), date(k, { color: S.mute, st: { whiteSpace: "nowrap" } })], { ...cell, gap: "16px" }));
        const c4 = g([btn(k, P.cta[0], P.cta[1], "line", { fg: S.bg, size: "15px" })], { backgroundColor: S.fg, alignItems: "center", justifyContent: "center", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "26px", paddingRight: "26px" });
        return [full(S, [grid("1.1fr 1.5fr 1.3fr 0.9fr", [c1, c2, c3, c4], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" })]),
          X.stripe(k, { h: 6, gradient: { from: S.accent, to: S.fg, angle: 90 } })];
      },
      mode: "sticky", anim: "slide", hover: "pop", dark: false, tags: ["fintech", "géométrique", "cellules", "formes"],
      features: ["Quatre cellules séparées par des filets, dont une cellule de marque colorée", "Formes géométriques (disque, anneau) en CSS natif, sans image", "Cellule d'appel sombre et liseré dégradé en pied"],
      animations: ["slide-in-left", "slide-in-right", "pop"], settings: ["Couleurs", "Polices", "Proportions des cellules", "Épaisseur des filets", "Dégradé du liseré", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 09 · Endpoint · API / outil développeur ───────────────────────────
    {
      key: "tech-09", name: "Endpoint", art: "API et outil développeur", desc: "Un ticker monospace en tête, puis deux colonnes : badge « API », marque et menu à gauche ; lien documentation et bouton démonstration à droite.",
      S: ID("tech-09", "Endpoint", { bg: "#f6f8fa", fg: "#0d1117", mute: "#4f5963", alt: "#e9edf1", accent: "#0969da", onAccent: "#ffffff", line: "#cfd7de", font: "font.geist-mono", head: "font.geist", weight: "700", btnRadius: "6px" }),
      build: (k, P) => {
        const S = k.S;
        const tick = X.ticker(k, ["Version de l'API : à indiquer", "Statut : à connecter", "Nouveauté à annoncer"], { bg: "#0d1117", color: "#7ee787", font: S.font, size: "12px", sep: "/", speed: "slow", padV: "6px", label: "Informations sur l'API" });
        const left = stack([g([tag(k, "API", { radius: "4px" }), mark(k, { kind: "title", size: "24px", weight: "700", track: "-0.03em" })], { gap: "12px", flexWrap: "nowrap" }), nav(k, "mono", { size: "13px", weight: "500", gap: "22px", hover: S.accent })], { gap: "10px", alignItems: "flex-start" });
        const right = stack([g([account(k, { size: "13px" }), btn(k, "Documentation", "/blog", "line", { fg: S.accent, size: "13px", padV: "4px" })], { gap: "16px", flexWrap: "nowrap" }), g([small(k, "Demander une démo", "/contact", "outline", { fg: S.fg, border: S.fg }), small(k, P.cta[0], P.cta[1], "solid")], { gap: "10px", flexWrap: "wrap" })], { gap: "10px", alignItems: "flex-end" }, undefined, { alignItems: "flex-start" });
        return [tick, row(k, [grid("1fr auto", [left, right], { width: "100%", gap: "28px", alignItems: "center" }, { gap: "18px" }, { gridTemplate: "1fr", gap: "14px" })], { pv: "18px", st: { ...bd(S.line, "1px", "Bottom") } })];
      },
      mode: "static", anim: "rise", hover: "push", dark: false, tags: ["api", "documentation", "ticker", "développeur"],
      features: ["Ticker monospace de version et de statut (pause au survol, immobile en mouvement réduit)", "Lien « Documentation » et bouton « Demander une démo » côte à côte", "Menu en police monospace sous la marque"],
      animations: ["fade-in-up", "push"], settings: ["Couleurs", "Polices", "Textes du ticker", "Vitesse du ticker", "Libellés des boutons", "Animation d'entrée", "Survol des boutons"],
    },
    // ─────────────────────────── 10 · Rail · hardware ───────────────────────────
    {
      key: "tech-10", name: "Rail", art: "Matériel et hardware", desc: "Barre robuste : une case orange ouvre le menu en panneau coulissant, marque condensée, bande oblique, contact et bouton de démonstration.",
      S: ID("tech-10", "Rail", { bg: "#121418", fg: "#f1f3f5", mute: "#a3abb6", alt: "#1c2026", accent: "#ff7a1a", onAccent: "#14100a", line: "#313840", font: "font.barlow", head: "font.chakra-petch", weight: "700", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const rail = g([X.fsMenu(k, { buttonLabel: "Menu", closeLabel: "Fermer", numbers: true, align: "left", preset: "slide-right", duration: 450, stagger: 60, color: S.onAccent, font: S.head, size: "14px", caps: "uppercase", track: "0.14em" })], { backgroundColor: S.accent, alignSelf: "stretch", alignItems: "center", flexWrap: "nowrap", paddingLeft: "26px", paddingRight: "26px", paddingTop: "18px", paddingBottom: "18px" }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px" });
        const name = g([X.monument(k, { min: 22, max: 34, font: S.head, weight: "700", caps: "uppercase", track: "0.06em", lh: 1 }), hide(X.slash(k, { w: 56, h: 14, angle: -30, color: S.accent }))], { gap: "16px", flexWrap: "nowrap", paddingLeft: "22px", flexGrow: 1 }, { paddingLeft: "16px" }, { paddingLeft: "12px", gap: "10px" });
        const right = g([X.info(k, ["mail"], { color: S.mute }), hide(small(k, "Demander une démo", "/contact", "solid", { caps: "uppercase", track: "0.08em", padH: "20px" }), ["mobile"]), hide(small(k, "Démo", "/contact", "solid", { caps: "uppercase", track: "0.08em", padH: "14px" }), ["desktop", "tablet"])], { gap: "18px", flexWrap: "nowrap", paddingLeft: "12px", paddingRight: "26px" }, { paddingRight: "18px" }, { paddingRight: "12px", paddingLeft: "6px" });
        return [band(S, [g([rail, name, right], { alignItems: "center", flexWrap: "nowrap", gap: "0px", width: "100%" })], { paddingLeft: "0px", paddingRight: "0px", ...bd(S.accent, "3px", "Bottom") }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" })];
      },
      mode: "stickyhide", anim: "reveal", hover: "grow", dark: true, tags: ["hardware", "panneau coulissant", "industriel", "sombre"],
      features: ["Case d'accès au menu en panneau plein écran qui coulisse depuis le côté (Échap pour fermer)", "Marque condensée suivie d'une bande oblique géométrique", "Contact à personnaliser et bouton de démonstration ; se cache en descendant"],
      animations: ["reveal", "fade-in", "grow"], settings: ["Couleurs", "Polices", "Panneau du menu (style et durée)", "Taille de la marque", "Comportement au défilement", "Animation d'entrée", "Survol des boutons"],
    },
  ],
};
