// Secteur « luxe » (Luxe, mode et haute couture) : 10 en-têtes écrits sur mesure, une direction artistique par modèle.
//
// MATRICE DE CONCEPTION (copie détaillée : docs/theme-builder/headers-secteurs/luxe.md)
//  01 Maison Aurore       Luxe éditorial            message fin · marque centrée espacée entre navigation et actions · double filet           crème / or · Cormorant + Jost            statique, révélation du logo
//  02 Gazette Mode        Fashion magazine          ticker noir · marque didone italique + actions · onglets entre filets épais               blanc / noir / rouge · Playfair + Libre Franklin   se cache au défilement
//  03 Rive Gauche         Haute couture parisienne  pile centrée : ornements + message · marque Didot · navigation entre deux filets or        ivoire / or · GFS Didot + Tenor Sans     collant
//  04 Atelier Washi       Minimalisme japonais      colonne latérale étroite (marque + navigation verticale) · grand vide · lien en pied      papier / encre / vermillon · Shippori Mincho + Zen Kaku   statique ; menu replié sur tablette et mobile
//  05 Grand Format        Typographie monumentale   nom du site pleine largeur (fluide 52–190 px) · filet épais · rangée fine                sable / encre · Bodoni Moda + Inter Tight   statique
//  06 Maison Pérenne      Haut de gamme intemporel  trois cases bordées d'un filet or (marque · navigation · actions) dans un cadre            marine / or · Libre Caslon + Raleway    collant
//  07 Maison Dissymétrie  Composition asymétrique   bloc bordeaux 36 % (marque) · à droite : navigation, filet, message + actions            bordeaux / crème · DM Serif + Work Sans  statique, révélation de la marque
//  08 Velours Noir        Vitrine nocturne          barre de compte · navigation à gauche, marque à droite · liseré or                       noir / or · Bodoni Moda + Tenor Sans     collant qui se réduit
//  09 Écrin               Joaillerie                superposé transparent · message orné · marque Cinzel + navigation · filet dégradé        émeraude / champagne · Cinzel + Jost     superposé
//  10 Flacon              Parfumerie                liseré dégradé · bloc gauche (marque italique + navigation soulignée) · colonne d'actions   rose poudré / prune · Instrument Serif + Raleway   collant qui se réduit
// Navigation : toujours le menu affecté à « En-tête » (aucun lien inventé), repliée derrière un bouton sur mobile (04 : navigation verticale remplacée par un menu replié sur tablette/mobile).
// Panier / compte / recherche = éléments natifs du site (jamais de donnée inventée). Mouvements = moteur natif, coupés si le visiteur demande moins de mouvement.
const B = require("../blocks");
const X = require("../blocks2");
const { compact } = require("../../kit");
const { ID, mark, nav, btn, account, note, g, stack, grid, band, inner } = B;

// Rangée : bande pleine largeur (fond, filets) + contenu borné
const edge = (S, o) => ({ ...(o.top ? { borderTopStyle: o.top.s || "solid", borderTopWidth: o.top.w || "1px", borderTopColor: o.top.c || S.line } : {}), ...(o.bot ? { borderBottomStyle: o.bot.s || "solid", borderBottomWidth: o.bot.w || "1px", borderBottomColor: o.bot.c || S.line } : {}) });
const R = (k, kids, o = {}) => band(k.S, [inner(kids, { justifyContent: o.j || "space-between", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg || k.S.bg, color: o.fg || k.S.fg, paddingTop: o.pv || "18px", paddingBottom: o.pv || "18px", ...edge(k.S, o), ...(o.st || {}) }), o.t, o.m);
const acts = (k, kids, st = {}) => g(kids, { gap: "20px", justifyContent: "flex-end", flexWrap: "nowrap", ...st }, { flexWrap: "wrap", gap: "14px" });
const small = (k, text, o = {}) => note(k, text, { size: "11px", caps: "uppercase", track: "2.4px", color: o.color || k.S.mute, st: o.st });
const cart = (k) => B.cart(k, {});

module.exports = {
  sector: "luxe",
  models: [
    // ── 01 · Luxe éditorial ─────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-01", name: "Maison Aurore", art: "Luxe éditorial", desc: "La marque centrée très espacée entre la navigation et les actions, puis une bande d'accroche teintée, le tout entre doubles filets : une maison d'édition de mode.",
      S: ID("luxe-01", "Maison Aurore", { bg: "#faf6f0", fg: "#1b1411", mute: "#5c5148", alt: "#f1ebe0", accent: "#7a5c1f", onAccent: "#ffffff", line: "#d9cfbf", font: "font.jost", head: "font.cormorant-garamond", weight: "500", btn: "line" }),
      build: (k, P) => [
        R(k, [grid("1fr auto 1fr", [
          g([nav(k, "thin", { caps: "uppercase", track: "2.6px", size: "11.5px", gap: "30px", weight: "400", hover: k.S.accent })], { justifyContent: "flex-start", flexWrap: "nowrap" }),
          mark(k, { size: "clamp(26px, 4vw, 44px)", caps: "uppercase", track: "0.52em", weight: "500", st: { textAlign: "center" } }),
          acts(k, [account(k, { size: "12px" }), cart(k)]),
        ], { width: "100%", gap: "28px" }, { gridTemplate: "1fr auto" }, { gridTemplate: "1fr" })], { pv: "38px", top: { w: "3px", s: "double", c: k.S.fg } }),
        R(k, [small(k, P.tagline, { st: { textAlign: "center" } })], { pv: "9px", j: "center", bg: k.S.alt, top: { w: "1px" }, bot: { w: "3px", s: "double", c: k.S.fg } }),
      ],
      mode: "static", anim: "reveal", hover: "", dark: false, tags: ["éditorial", "centré", "double filet", "mode"],
      features: ["Logo qui se révèle à l'ouverture", "Ligne d'accroche personnalisable", "Navigation fine en petites capitales", "Compte et panier natifs du site"],
      animations: ["reveal", "fade-in"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Accroche"],
    },
    // ── 02 · Fashion magazine ───────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-02", name: "Gazette Mode", art: "Fashion magazine", desc: "Ticker noir défilant, titre de magazine italique, onglets de rubriques entre filets épais : la une d'un mensuel de mode.",
      S: ID("luxe-02", "Gazette Mode", { bg: "#ffffff", fg: "#0d0d0d", mute: "#4a4a4a", alt: "#f2efea", accent: "#b3121f", onAccent: "#ffffff", line: "#d4d0c8", font: "font.libre-franklin", head: "font.playfair-display", weight: "900" }),
      build: (k, P) => [
        // ticker sur ordinateur ; sur tablette et mobile, bande noire fixe avec le seul message de saison (le défilement horizontal y déborderait)
        { ...X.ticker(k, [P.notice, "Une nouvelle collection à annoncer", "Un événement à mettre en avant"], { bg: "#0d0d0d", color: "#ffffff", speed: "slow", sep: "✦", caps: "uppercase", track: "3px", size: "11px", padV: "9px" }), hideOn: ["tablet", "mobile"] },
        { ...R(k, [note(k, P.notice, { size: "10.5px", caps: "uppercase", track: "2px", color: "#ffffff" })], { pv: "9px", j: "center", bg: "#0d0d0d", fg: "#ffffff" }), hideOn: ["desktop"] },
        R(k, [
          mark(k, { size: "clamp(34px, 5.4vw, 62px)", italic: true, weight: "900", track: "-1px", lh: 1 }),
          acts(k, [account(k, { size: "12px" }), cart(k), btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1.6px", size: "11px", padV: "10px", padH: "18px" })], { gap: "20px" }),
        ], { pv: "16px" }),
        R(k, [nav(k, "tab", { caps: "uppercase", track: "2.2px", size: "12px", weight: "700", gap: "4px", hover: k.S.accent })], { pv: "0px", j: "center", top: { w: "4px", c: k.S.fg }, bot: { w: "1px", c: k.S.fg } }),
      ],
      mode: "stickyhide", anim: "rise", hover: "", dark: false, tags: ["magazine", "ticker", "onglets", "mode"],
      features: ["Ticker d'annonces (pause au survol et au clavier)", "Compte, panier et bouton d'action natifs", "Onglets de rubriques avec liseré rouge au survol", "L'en-tête se cache en descendant et revient en remontant"],
      animations: ["fade-in-up"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Annonces du ticker", "Effet au défilement"],
    },
    // ── 03 · Haute couture parisienne ───────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-03", name: "Rive Gauche", art: "Haute couture parisienne", desc: "Pile centrée : ornements dorés, marque au style Didot, navigation entre deux filets or : la vitrine d'une maison de couture.",
      S: ID("luxe-03", "Rive Gauche", { bg: "#fffdf9", fg: "#1d1b19", mute: "#5a554d", alt: "#f6f0e4", accent: "#8c6a28", onAccent: "#ffffff", line: "#d8c6a0", font: "font.tenor-sans", head: "font.gfs-didot", weight: "400" }),
      build: (k, P) => [
        R(k, [g([X.disc(k, { size: 5 }), small(k, P.notice), X.disc(k, { size: 5 })], { gap: "16px", justifyContent: "center", flexWrap: "nowrap" }, { flexWrap: "wrap" })], { pv: "10px", j: "center" }),
        R(k, [mark(k, { size: "clamp(30px, 5vw, 50px)", caps: "uppercase", track: "0.16em", weight: "400", st: { textAlign: "center" } })], { pv: "14px", j: "center", st: { paddingBottom: "22px" } }),
        R(k, [g([X.ring(k, { size: 9, w: "1px" }), nav(k, "thin", { caps: "uppercase", track: "2.4px", size: "11.5px", gap: "34px", weight: "400", hover: k.S.accent }), X.ring(k, { size: 9, w: "1px" })], { gap: "34px", justifyContent: "center", flexWrap: "nowrap" }, { flexWrap: "wrap" }), acts(k, [account(k, { size: "12px" }), cart(k)], { gap: "16px" })],
          { pv: "13px", j: "center", top: { c: k.S.line }, bot: { c: k.S.line }, inn: { gap: "40px" } }),
      ],
      mode: "sticky", anim: "soft", hover: "", dark: false, tags: ["couture", "centré", "ornements", "didot"],
      features: ["Ornements dorés en formes natives", "Marque en capitales Didot très aérées", "Navigation entre deux filets or", "En-tête collant en haut de page"],
      animations: ["fade-in"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Message de saison"],
    },
    // ── 04 · Minimalisme japonais ───────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-04", name: "Atelier Washi", art: "Minimalisme japonais", desc: "Une étroite colonne à gauche (marque et navigation verticale), un grand vide, les actions posées en pied : le calme du papier washi.",
      S: ID("luxe-04", "Atelier Washi", { bg: "#f3efe6", fg: "#1f1d1a", mute: "#5a554c", alt: "#e9e3d6", accent: "#a8322a", onAccent: "#ffffff", line: "#c9c0ad", font: "font.zen-kaku-gothic-new", head: "font.shippori-mincho", weight: "500", btn: "line" }),
      build: (k, P) => [band(k.S, [grid("240px 1fr", [
        stack([
          mark(k, { size: "24px", caps: "uppercase", track: "0.3em", weight: "500" }),
          B.sp("26"),
          { ...nav(k, "thin", { vertical: true, size: "13px", gap: "12px", track: "1.4px", hover: k.S.accent, weight: "400" }), hideOn: ["tablet", "mobile"] },
          { ...nav(k, "thin", { size: "13px", gap: "18px", track: "1.4px", hover: k.S.accent, weight: "400", caps: "uppercase" }), hideOn: ["desktop"] },
        ], { gap: "4px", paddingRight: "28px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: k.S.line, paddingTop: "10px", paddingBottom: "10px" }, { borderRightWidth: "0px", paddingRight: "0px" }),
        stack([
          g([small(k, P.notice), g([account(k, { size: "12px" }), cart(k)], { gap: "20px", flexWrap: "nowrap" })], { justifyContent: "space-between", width: "100%", alignItems: "flex-start" }),
          B.sp("64"),
          g([btn(k, P.cta[0], P.cta[1], "line", { caps: "uppercase", track: "2px", size: "11.5px", weight: "500" })], { justifyContent: "flex-end", width: "100%" }),
        ], { gap: "0px", paddingLeft: "40px", paddingTop: "10px", paddingBottom: "10px", justifyContent: "space-between", width: "100%" }, { paddingLeft: "0px" }, { paddingLeft: "0px" }),
      ], { width: "100%", maxWidth: "1240px", marginLeft: "auto", marginRight: "auto", alignItems: "stretch", gap: "0px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { paddingTop: "34px", paddingBottom: "34px" }, { paddingTop: "20px", paddingBottom: "20px" }, { paddingTop: "16px", paddingBottom: "16px" })],
      mode: "static", anim: "soft", hover: "", dark: false, tags: ["japonais", "vertical", "colonne", "minimal"],
      features: ["Navigation verticale discrète en colonne", "Sur tablette et mobile : la navigation verticale est remplacée par le menu replié derrière un bouton", "Lien d'action souligné en pied", "Compte et panier natifs du site"],
      animations: ["fade-in"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée"],
    },
    // ── 05 · Typographie monumentale ────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-05", name: "Grand Format", art: "Typographie monumentale", desc: "Le nom de la maison pleine largeur en didone ultra-gras, un filet épais, une rangée fine : l'affiche avant le menu.",
      S: ID("luxe-05", "Grand Format", { bg: "#ece5da", fg: "#14110f", mute: "#4f463d", alt: "#e1d8ca", accent: "#14110f", onAccent: "#ece5da", line: "#14110f", font: "font.inter-tight", head: "font.bodoni-moda", weight: "800" }),
      build: (k, P) => [
        R(k, [X.monument(k, { min: 52, max: 190, caps: "uppercase", track: "-0.02em", weight: "800", st: { width: "100%", textAlign: "center" } })], { pv: "20px", j: "center", st: { paddingBottom: "6px" } }),
        R(k, [nav(k, "mono", { caps: "uppercase", track: "2px", size: "12px", weight: "600", gap: "28px" }), acts(k, [account(k, { size: "12px" }), cart(k), btn(k, P.cta[0], P.cta[1], "line", { caps: "uppercase", track: "1.6px", size: "11.5px" })], { gap: "22px" })],
          { pv: "13px", top: { w: "5px", c: k.S.fg }, bot: { w: "1px", c: k.S.fg } }),
      ],
      mode: "static", anim: "rise", hover: "", dark: false, tags: ["monumental", "affiche", "didone", "typographie"],
      features: ["Nom du site à taille fluide (lisible dès 320 px)", "Filet épais de 5 px", "Navigation en capitales et lien d'action souligné", "Entrée du nom en montée douce"],
      animations: ["fade-in-up"],
      settings: ["Couleurs", "Police", "Taille du nom", "Espacement", "Animation d'entrée"],
    },
    // ── 06 · Haut de gamme intemporel ───────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-06", name: "Maison Pérenne", art: "Haut de gamme intemporel", desc: "Trois cases pleine largeur dont un bloc de marque doré, liseré en dégradé au-dessus : la sobriété qui ne se démode pas.",
      S: ID("luxe-06", "Maison Pérenne", { bg: "#101a2c", fg: "#f3eee3", mute: "#b9b3a4", alt: "#17233a", accent: "#c9a86a", onAccent: "#101a2c", line: "#8a7447", font: "font.raleway", head: "font.libre-caslon-display", weight: "400", btn: "outline" }),
      build: (k, P) => {
        const cell = (kids, o = {}) => g(kids, { alignItems: "center", justifyContent: "center", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "34px", paddingRight: o.padEnd || "34px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: o.first ? "0px" : "1px", borderColor: k.S.line, flexWrap: "nowrap", ...(o.bg ? { backgroundColor: o.bg } : {}) }, { borderLeftWidth: "0px", paddingLeft: "12px", paddingRight: "12px" }, { paddingTop: "12px", paddingBottom: "12px" });
        return [
          X.stripe(k, { h: 3, gradient: { from: "#c9a86a", to: "#101a2c", angle: 90 } }),
          band(k.S, [grid("auto 1fr auto", [
            cell([mark(k, { size: "27px", weight: "400", track: "0.04em", color: k.S.onAccent })], { first: true, bg: k.S.accent }),
            cell([nav(k, "thin", { caps: "uppercase", track: "2.2px", size: "11.5px", weight: "500", gap: "28px", hover: k.S.accent })]),
            cell([account(k, { size: "12px" }), btn(k, P.cta[0], P.cta[1], "outline", { caps: "uppercase", track: "1.8px", size: "11px", fg: k.S.accent, border: k.S.accent, radius: "0px", padV: "10px" })], { padEnd: "120px" }),
          ], { width: "100%", alignItems: "stretch", gap: "0px" }, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", paddingTop: "0px", paddingBottom: "0px" }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" }),
        ];
      },
      mode: "sticky", anim: "zoom", hover: "lift", dark: true, tags: ["cadre", "cases", "marine", "intemporel"],
      features: ["Trois cases pleine largeur : bloc de marque doré, navigation, actions", "Bouton contour or qui se soulève au survol", "En-tête collant", "Compte natif du site"],
      animations: ["zoom-in", "lift"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Survol du bouton"],
    },
    // ── 07 · Composition asymétrique de maison ──────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-07", name: "Maison Dissymétrie", art: "Composition asymétrique de maison", desc: "Un bloc bordeaux de 36 % porte la marque ; à droite, la navigation, un filet, puis le message et les actions : l'équilibre décalé.",
      S: ID("luxe-07", "Maison Dissymétrie", { bg: "#f6ece4", fg: "#2a1418", mute: "#6a4b4f", alt: "#eadbcf", accent: "#5b1a28", onAccent: "#f6ece4", line: "#d4bdb0", font: "font.work-sans", head: "font.dm-serif-display", weight: "400", btn: "solid" }),
      build: (k, P) => [band(k.S, [grid("36% 1fr", [
        g([mark(k, { size: "clamp(30px, 3.4vw, 46px)", color: k.S.onAccent, weight: "400", lh: 1.05 }), note(k, P.tagline, { color: k.S.onAccent, size: "11px", caps: "uppercase", track: "2px" })],
          { flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: "8px", backgroundColor: k.S.accent, paddingTop: "34px", paddingBottom: "34px", paddingLeft: "40px", paddingRight: "30px" }, { paddingLeft: "24px" }, { paddingTop: "20px", paddingBottom: "20px", paddingLeft: "18px" }),
        stack([
          g([nav(k, "underline", { caps: "uppercase", track: "2px", size: "12px", weight: "600", gap: "30px" })], { justifyContent: "flex-end", paddingTop: "22px", paddingBottom: "14px", paddingLeft: "36px", paddingRight: "40px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: k.S.line }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "18px", paddingRight: "18px" }),
          g([small(k, P.notice), g([account(k, { size: "12px" }), cart(k), btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1.6px", size: "11px", padV: "9px", padH: "18px" })], { gap: "18px", flexWrap: "nowrap" }, { flexWrap: "wrap" })], { justifyContent: "space-between", paddingTop: "14px", paddingBottom: "18px", paddingLeft: "36px", paddingRight: "40px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "18px", paddingRight: "18px" }),
        ], { gap: "0px", justifyContent: "center" }),
      ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" })],
      mode: "static", anim: "reveal", hover: "", dark: false, tags: ["asymétrique", "bloc de marque", "bordeaux"],
      features: ["Bloc de marque coloré de 36 %", "Navigation soulignée au survol", "Filet séparateur, message et actions en deuxième ligne", "Entrée de la marque en révélation"],
      animations: ["reveal", "fade-in"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Message de saison"],
    },
    // ── 08 · Vitrine nocturne ───────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-08", name: "Velours Noir", art: "Vitrine nocturne", desc: "Fine barre de compte, navigation à gauche et marque à droite, liseré or qui s'allume : une vitrine éclairée la nuit.",
      S: ID("luxe-08", "Velours Noir", { bg: "#0d0b0a", fg: "#f1ebe0", mute: "#b3a995", alt: "#171412", accent: "#c8a45c", onAccent: "#0d0b0a", line: "#3a332a", font: "font.tenor-sans", head: "font.bodoni-moda", weight: "500", btn: "outline" }),
      build: (k) => [
        R(k, [acts(k, [account(k, { size: "12px" }), cart(k)], { gap: "22px" })], { pv: "8px", j: "flex-end", bg: k.S.alt, bot: { c: k.S.line } }),
        R(k, [
          g([nav(k, "thin", { caps: "uppercase", track: "3px", size: "11.5px", weight: "400", gap: "34px", hover: k.S.accent })], { flexWrap: "nowrap" }),
          mark(k, { size: "clamp(26px, 3.4vw, 40px)", caps: "uppercase", track: "0.42em", weight: "500", st: { textAlign: "right" } }),
        ], { pv: "28px" }),
        X.stripe(k, { h: 2, gradient: { from: "#0d0b0a", to: "#c8a45c", angle: 90 } }),
      ],
      mode: "stickyshrink", anim: "soft", hover: "", dark: true, tags: ["nuit", "or", "marque à droite", "barre de compte"],
      features: ["Barre de compte et panier natifs sur fond alterné", "Marque à droite, navigation fine à gauche", "Liseré or en dégradé", "En-tête collant qui se réduit au défilement"],
      animations: ["fade-in"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Effet au défilement"],
    },
    // ── 09 · Joaillerie ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-09", name: "Écrin", art: "Joaillerie", desc: "Superposé et transparent sur le visuel d'ouverture : message orné, marque en capitales romaines et navigation sertie d'un filet dégradé.",
      S: ID("luxe-09", "Écrin", { bg: "#0b2623", fg: "#f4efe3", mute: "#c9c4b4", alt: "#12332f", accent: "#d9c08a", onAccent: "#0b2623", line: "#4d6b5f", font: "font.jost", head: "font.cinzel", weight: "500", btn: "outline" }),
      build: (k, P) => [
        R(k, [g([X.slash(k, { w: 8, h: 8, angle: 0, color: k.S.accent }), small(k, P.notice, { color: k.S.fg }), X.slash(k, { w: 8, h: 8, angle: 0, color: k.S.accent })], { gap: "14px", justifyContent: "center", flexWrap: "nowrap" }, { flexWrap: "wrap" })], { pv: "12px", j: "center", bg: "transparent" }),
        R(k, [
          mark(k, { size: "clamp(22px, 2.6vw, 30px)", caps: "uppercase", track: "0.34em", weight: "500" }),
          g([nav(k, "thin", { caps: "uppercase", track: "2.4px", size: "11.5px", weight: "400", gap: "32px", hover: k.S.accent }), X.vrule(k, { h: 20, color: k.S.line }), account(k, { size: "12px" })], { gap: "26px", flexWrap: "nowrap" }, { flexWrap: "wrap" }),
        ], { pv: "26px", bg: "transparent" }),
        X.stripe(k, { h: 1, gradient: { from: "#d9c08a", to: "#0b2623", angle: 90 } }),
      ],
      mode: "overlaysolid", anim: "rise", hover: "", dark: true, tags: ["joaillerie", "transparent", "superposé", "cinzel"],
      features: ["Superposé : se pose, transparent, sur le visuel d'ouverture, puis se fixe et prend le fond et le texte du site dès que la page défile", "Losanges dorés en formes natives", "Filet dégradé champagne", "Marque en capitales romaines Cinzel"],
      animations: ["fade-in-up"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Message de saison"],
    },
    // ── 10 · Parfumerie ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "luxe-10", name: "Flacon", art: "Parfumerie", desc: "Liseré dégradé, grand nom italique avec sa navigation soulignée à gauche, colonne d'actions à droite : un flacon posé sur une page poudrée.",
      S: ID("luxe-10", "Flacon", { bg: "#f7e9e6", fg: "#3a1f2b", mute: "#6b4a57", alt: "#f0d9d6", accent: "#8e3b5a", onAccent: "#ffffff", line: "#e0c1c3", font: "font.raleway", head: "font.instrument-serif", weight: "400", btn: "pill" }),
      build: (k, P) => [
        X.stripe(k, { h: 5, gradient: { from: "#8e3b5a", to: "#f0c6c6", angle: 90 } }),
        band(k.S, [grid("1fr auto", [
          stack([
            mark(k, { size: "clamp(38px, 5vw, 66px)", italic: true, weight: "400", lh: 1 }),
            nav(k, "underline", { size: "13px", weight: "500", gap: "26px", track: "0.6px", hover: k.S.accent }),
          ], { gap: "10px", alignItems: "flex-start" }),
          stack([
            btn(k, P.cta[0], P.cta[1], "pill", { size: "12px", caps: "uppercase", track: "1.6px", padV: "10px", padH: "22px" }),
            g([account(k, { size: "12px" }), cart(k)], { gap: "20px", justifyContent: "flex-end", flexWrap: "nowrap" }),
          ], { gap: "14px", alignItems: "flex-end" }, { alignItems: "flex-start" }),
        ], { width: "100%", maxWidth: "1240px", marginLeft: "auto", marginRight: "auto", alignItems: "end", gap: "32px" }, { gridTemplate: "1fr auto" }, { gridTemplate: "1fr" })], { paddingTop: "22px", paddingBottom: "22px" }),
      ],
      mode: "stickyshrink", anim: "rise", hover: "lift", dark: false, tags: ["parfumerie", "italique", "pastel", "asymétrique"],
      features: ["Liseré dégradé prune et rose", "Bouton pilule qui se soulève au survol", "Grand nom italique et navigation soulignée", "En-tête collant qui se réduit"],
      animations: ["fade-in-up", "lift"],
      settings: ["Couleurs", "Police", "Espacement", "Animation d'entrée", "Survol du bouton", "Effet au défilement"],
    },
  ],
};
