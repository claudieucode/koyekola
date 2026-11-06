// Secteur « ecom » (E-commerce et boutiques en ligne) : 10 en-têtes écrits sur mesure, remplaçant les 10 modèles hérités (contrat : docs/theme-builder/HEADER_SECTOR_CONTRACT.md).
// Matrice détaillée : docs/theme-builder/headers-secteurs/ecom.md. Zone visuelle : design commercial premium, densité utile, hiérarchie de navigation par catégories.
//
// Éléments commerciaux = éléments NATIFS du CMS, branchés sur les vraies données du site : recherche (cible : catalogue du site), compte du visiteur, mini-panier avec pastille de compte réel.
// Aucun produit, prix ni libellé de catégorie inventé : les catégories sont celles du menu affecté à « En-tête » (aucun menu affecté = rien d'affiché). Les annonces sont des consignes à remplacer.
// Les barres promotionnelles sont des conteneurs `dismissible` (bouton de fermeture réel, mémorisé chez le visiteur) : on peut les supprimer de l'en-tête sans toucher au reste.
//
// ── MATRICE DE CONCEPTION ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 01 Grand Rayon     · marketplace généraliste à 3 étages   · bandeau promo fermable (nuit) / rangée marque + recherche géante + compte + panier / catégories en ONGLETS sur gris · Poppins + Inter · bleu nuit, orange
// 02 Maison Lin      · boutique mode épurée, menu plein écran · une seule rangée aérée : bouton « Catégories » (menu plein écran numéroté) / marque Bodoni centrée / compte + panier · rangée de recherche fine dessous · ivoire, noir
// 03 Atelier Intérieur · maison / déco, bloc de marque en terre cuite · colonne de marque (angle arrondi) portant marque + compte / à droite recherche + panier puis catégories soulignées · Fraunces + DM Sans · lin, terre cuite
// 04 Volt            · high-tech, console           · ticker en tête / UNE rangée dense : marque à bandeau diagonal, catégories mono, barre de recherche « commande » extensible, panier / liseré dégradé · Space Grotesk + IBM Plex Mono · nuit, menthe
// 05 Halle Gourmande · épicerie fine, journal de marché · petite rangée utilitaire à droite / marque italique centrée entre deux filets / catégories centrées entre filets épais et fin · Libre Baskerville + Work Sans · crème, vert sapin, rouge
// 06 Éclat Beauté    · beauté, carte flottante          · barre promo fermable en dégradé / carte arrondie à marges (ombre) : médaillon dégradé + marque, recherche arrondie, actions ; catégories en pilules dessous · Cormorant + Nunito Sans · rose poudré, prune
// 07 Cabinet Créateur · boutique de créateur, navigation latérale · rail vertical à gauche (marque + catégories empilées en grand) / à droite recherche + compte + panier puis ticker géant · Syne + Work Sans · sable, brique
// 08 Solde Express   · outlet / promos                 · barre promo rouge FERMABLE (texte + bouton) / rangée noire : bloc jaune de marque à biais, catégories en blocs, recherche, panier · Anton + Barlow Condensed · noir, jaune, rouge
// 09 Cherche & Trouve · « recherche d'abord »          · grand bandeau bleu : mini-rangée (marque, compte, panier) / champ de recherche GÉANT centré / catégories en pastilles centrées · Manrope · bleu roi, jaune
// 10 Pavé Catalogue  · mosaïque de catégories (navTiles) · cadre épais : nom du site monumental + recherche à gauche / catégories en CASES bordées à droite + compte et panier en blocs · Archivo Black + Archivo · blanc, noir, rouge
// Mobile : chaque modèle replie ses catégories derrière le bouton du menu natif (ou menu plein écran pour 02), garde recherche / compte / panier à portée (ligne de marque + actions, recherche pleine largeur).
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const B = require("../blocks");
const X = require("../blocks2");
const { sty, compact } = require("../../kit");
const { ID, mark, nav, btn, search, account, g, stack, grid, band, inner, note } = B;

// Barre promotionnelle FERMABLE : conteneur pleine largeur `dismissible` (le bouton de fermeture est posé par le rendu ; marge droite réservée)
const promo = (children, st = {}, t, m) => ({ type: "container", props: { full: true, dismissible: true }, children: [inner(children, { justifyContent: "center", gap: "14px" })],
  ...sty(compact({ display: "flex", flexDirection: "column", alignItems: "stretch", paddingTop: "9px", paddingBottom: "9px", paddingLeft: "24px", paddingRight: "56px", ...st }), t || { paddingLeft: "16px", paddingRight: "50px" }, m || { paddingLeft: "12px", paddingRight: "46px" }) });
// Rangée : bande pleine largeur + contenu borné
const row = (k, kids, o = {}) => band(k.S, [inner(kids, { justifyContent: o.j || "space-between", gap: o.gap || "20px", flexWrap: o.wrap || "wrap", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg || k.S.bg, color: o.fg || k.S.fg, paddingTop: o.pv || "14px", paddingBottom: o.pv || "14px", ...(o.st || {}) }), o.t, o.m);
const rule = (c, w = "1px", side = "Bottom") => ({ borderStyle: "solid", borderWidth: "0px", [`border${side}Width`]: w, borderColor: c });
const cart = (k, o = {}) => X.cartPill(k, o);

module.exports = {
  sector: "ecom",
  models: [
    // ── 01 · Grand Rayon : marketplace généraliste à 3 étages ───────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-01", name: "Grand Rayon", art: "Marketplace à 3 étages", desc: "Bandeau promo fermable, rangée de marque avec recherche géante, compte et panier, puis catégories en onglets sur fond gris.",
      S: ID("ecom-01", "Grand Rayon", { bg: "#ffffff", fg: "#14213d", mute: "#4a5568", alt: "#eef1f6", accent: "#ff6b00", onAccent: "#111111", line: "#d8dee8", font: "font.inter", head: "font.poppins", weight: "700", btnRadius: "8px", radius: "8px" }),
      build: (k, P) => { const S = k.S; return [
        promo([note(k, P.notice, { color: "#ffffff", size: "13px" }), btn(k, "Voir les offres", "/catalogue", "line", { fg: "#ffffff", size: "13px" })], { backgroundColor: "#14213d" }),
        row(k, [mark(k, { size: "30px", weight: "800", track: "-0.5px" }), search(k, { grow: true, max: "720px", radius: "8px", placeholder: "Rechercher dans la boutique…" }), g([account(k, { size: "14px" }), cart(k)], { gap: "18px", flexWrap: "nowrap" })], { pv: "18px", gap: "28px", st: rule(S.line) }),
        row(k, [nav(k, "tab", { size: "14px", weight: "600" }), btn(k, "Tout le catalogue", "/catalogue", "arrow", { size: "13px", fg: S.fg })], { bg: S.alt, pv: "0px", gap: "16px" }),
      ]; },
      mode: "stickyshrink", anim: "soft", hover: "lift", dark: false, tags: ["marketplace", "catalogue", "trois étages", "onglets"],
      features: ["Trois étages : promotion, marque + recherche, catégories", "Barre promotionnelle fermable (mémorisée chez le visiteur)", "Recherche branchée sur le catalogue du site, compte et mini-panier avec pastille réelle", "Catégories = menu affecté à « En-tête », en onglets repliés derrière un bouton sur mobile", "Se réduit au défilement"],
      animations: ["fade-in", "lift"], settings: ["Couleurs", "Polices", "Barre promotionnelle (texte, fermable)", "Espacements des étages", "Animation d'entrée", "Survol du bouton", "Effet au défilement"],
    },
    // ── 02 · Maison Lin : boutique mode épurée, menu plein écran ───────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-02", name: "Maison Lin", art: "Boutique mode épurée", desc: "Une seule rangée aérée : bouton « Catégories » en menu plein écran, marque Bodoni centrée, compte et panier ; recherche fine dessous.",
      S: ID("ecom-02", "Maison Lin", { bg: "#faf8f5", fg: "#1c1b19", mute: "#6b655c", alt: "#efe9e0", accent: "#1c1b19", onAccent: "#faf8f5", line: "#ddd5c8", font: "font.jost", head: "font.bodoni-moda", weight: "500", btnRadius: "0px" }),
      build: (k) => { const S = k.S; return [
        row(k, [
          g([X.fsMenu(k, { buttonLabel: "Catégories", closeLabel: "Fermer", preset: "slide-down", numbers: true, align: "left", caps: "uppercase", track: "2px", size: "12px" })], { flexGrow: 1, flexBasis: "0px", justifyContent: "flex-start", flexWrap: "nowrap" }, undefined, { flexGrow: 0, flexBasis: "auto" }),
          mark(k, { size: "clamp(22px, 3vw, 38px)", caps: "uppercase", track: "6px", weight: "500", kind: "title" }),
          g([account(k, { size: "12px" }), cart(k, { bg: S.fg, fg: S.bg })], { flexGrow: 1, flexBasis: "0px", justifyContent: "flex-end", gap: "20px", flexWrap: "nowrap" }, undefined, { flexGrow: 0, flexBasis: "auto" }),
        ], { pv: "30px", wrap: "wrap", innM: { gap: "10px" }, m: { paddingTop: "16px", paddingBottom: "12px" } }),
        row(k, [search(k, { grow: true, max: "520px", radius: "0px", fieldBg: "transparent", fieldLine: S.line, placeholder: "Rechercher une pièce…" })], { pv: "10px", j: "center", st: rule(S.line, "1px", "Top") }),
      ]; },
      mode: "sticky", anim: "reveal", hover: "", dark: false, tags: ["mode", "épuré", "plein écran", "centré"],
      features: ["Menu plein écran numéroté sur ordinateur ET mobile (Échap, focus piégé), liens = catégories du menu affecté", "Marque Bodoni centrée à taille fluide", "Recherche sur le catalogue du site, compte, mini-panier réels", "Reste collé en haut au défilement"],
      animations: ["reveal", "fade-in"], settings: ["Couleurs", "Polices", "Libellé et animation du menu plein écran", "Taille de la marque", "Espacements", "Animation d'entrée"],
    },
    // ── 03 · Atelier Intérieur : maison / déco, bloc de marque ─────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-03", name: "Atelier Intérieur", art: "Maison et décoration", desc: "Colonne de marque en terre cuite à l'angle arrondi portant le compte ; à droite, recherche et panier puis catégories soulignées.",
      S: ID("ecom-03", "Atelier Intérieur", { bg: "#f5efe6", fg: "#2f2a24", mute: "#6a5f52", alt: "#e8dcc8", accent: "#9a4f2d", onAccent: "#fffaf3", line: "#d6c7ad", font: "font.dm-sans", head: "font.fraunces", weight: "600", btnRadius: "10px", radius: "14px" }),
      build: (k) => { const S = k.S; return [
        band(S, [grid("28% 1fr", [
          g([mark(k, { size: "32px", color: S.onAccent, weight: "600" }), account(k, { color: S.onAccent, size: "13px" })], { backgroundColor: S.accent, flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: "12px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "36px", paddingRight: "24px", borderBottomRightRadius: "56px" }, { paddingLeft: "28px" }, { paddingTop: "16px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px", borderBottomRightRadius: "36px", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }),
          stack([
            g([search(k, { grow: true, max: "520px", radius: "999px", fieldBg: "#fffaf3", placeholder: "Rechercher un objet, une pièce…" }), cart(k, {})], { justifyContent: "space-between", gap: "20px", flexWrap: "nowrap" }, { flexWrap: "wrap" }),
            nav(k, "underline", { caps: "uppercase", track: "1.6px", size: "12.5px", weight: "600" }),
          ], { gap: "14px", justifyContent: "center", paddingTop: "18px", paddingBottom: "14px", paddingLeft: "40px", paddingRight: "28px" }, { paddingLeft: "24px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px", paddingTop: "14px" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "34% 1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", backgroundColor: S.bg, ...rule(S.line) }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" }),
      ]; },
      mode: "stickyshrink", anim: "slide", hover: "", dark: false, tags: ["maison", "déco", "terre cuite", "bloc de marque"],
      features: ["Colonne de marque colorée à angle arrondi avec le compte du visiteur", "Recherche arrondie sur le catalogue, mini-panier avec pastille réelle", "Catégories du menu affecté, soulignées au survol et au clavier", "Colonne de marque passée en bandeau sur mobile"],
      animations: ["slide-in-left", "fade-in-down", "slide-in-right"], settings: ["Couleurs", "Polices", "Arrondi de l'angle", "Largeur de la colonne", "Espacements", "Animation d'entrée", "Effet au défilement"],
    },
    // ── 04 · Volt : high-tech, console ──────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-04", name: "Volt", art: "Boutique high-tech", desc: "Ticker d'annonces, une seule rangée dense (marque à bandeau diagonal, catégories mono, barre de recherche de type commande, panier) et liseré dégradé.",
      S: ID("ecom-04", "Volt", { bg: "#0b0f19", fg: "#e8ecf4", mute: "#9aa6bd", alt: "#131a2b", accent: "#3df5c5", onAccent: "#04110d", line: "#243049", font: "font.ibm-plex-mono", head: "font.space-grotesk", weight: "700", btnRadius: "4px", radius: "4px" }),
      build: (k, P) => { const S = k.S; return [
        X.ticker(k, [P.notice, "Ticker facultatif : supprimez-le ou changez les textes"], { bg: S.accent, color: S.onAccent, size: "12px", weight: "700", caps: "uppercase", track: "1.4px", speed: "normal", sep: "//", padV: "7px" }),
        row(k, [
          g([X.slash(k, { w: 26, h: 34, angle: -20, color: S.accent }), mark(k, { size: "26px", caps: "uppercase", track: "-0.5px", weight: "700" })], { gap: "12px", flexWrap: "nowrap" }),
          nav(k, "mono", { size: "13px", caps: "lowercase", gap: "20px" }),
          search(k, { grow: true, max: "500px", radius: "4px", fieldBg: S.alt, fieldLine: S.line, placeholder: "> rechercher un produit" }),
          g([account(k, { size: "13px" }), cart(k, {})], { gap: "16px", flexWrap: "nowrap" }),
        ], { pv: "16px", gap: "24px" }),
        X.stripe(k, { h: 3, gradient: { from: S.accent, to: "#7c5cff", angle: 90 } }),
      ]; },
      mode: "sticky", anim: "zoom", hover: "", dark: true, tags: ["high-tech", "sombre", "ticker", "commande"],
      features: ["Ticker d'annonces natif : pause au survol et au clavier, immobile si le visiteur réduit les animations", "Recherche de type commande sur le catalogue du site, compte, mini-panier réels", "Catégories en police mono, menu replié sur mobile", "Liseré dégradé et bandeau diagonal décoratifs"],
      animations: ["zoom-in", "fade-in"], settings: ["Couleurs", "Polices", "Textes et vitesse du ticker", "Liseré (dégradé)", "Espacements", "Animation d'entrée"],
    },
    // ── 05 · Épicerie Fine : journal de marché ──────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-05", name: "Halle Gourmande", art: "Épicerie fine, titre de journal", desc: "Petite rangée utilitaire, marque italique centrée entre deux filets, catégories centrées entre un filet épais et un filet fin.",
      S: ID("ecom-05", "Halle Gourmande", { bg: "#fbf6ea", fg: "#1f3a2b", mute: "#5b6a58", alt: "#efe6d0", accent: "#a4262c", onAccent: "#fff8ee", line: "#cdbf9d", font: "font.work-sans", head: "font.libre-baskerville", weight: "700", btnRadius: "2px", radius: "2px" }),
      build: (k) => { const S = k.S, hr = () => ({ type: "divider", props: { line: true, size: "md" }, ...sty({ borderColor: S.fg }), hideOn: ["mobile"] }); return [
        row(k, [search(k, { w: "380px", radius: "2px", fieldBg: "transparent", fieldLine: S.line, placeholder: "Rechercher un produit…" }), g([account(k, { size: "12.5px" }), cart(k, {})], { gap: "18px", flexWrap: "nowrap" })], { pv: "8px", j: "flex-end", gap: "22px", st: rule(S.line) }),
        band(S, [grid("1fr auto 1fr", [hr(), mark(k, { size: "clamp(30px, 5vw, 58px)", italic: true, weight: "700", track: "-0.5px" }), hr()],
          { width: "100%", maxWidth: "1240px", marginLeft: "auto", marginRight: "auto", gap: "28px", justifyItems: "center", alignItems: "center" }, { gridTemplate: "1fr auto 1fr", gap: "16px" }, { gridTemplate: "1fr" })], { paddingTop: "22px", paddingBottom: "16px" }),
        row(k, [nav(k, "plain", { caps: "uppercase", track: "2.4px", size: "12.5px", weight: "600", gap: "34px" })], { pv: "12px", j: "center", st: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderBottomWidth: "1px", borderColor: S.fg } }),
      ]; },
      mode: "sticky", anim: "soft", hover: "", dark: false, tags: ["épicerie", "journal", "filets", "centré"],
      features: ["Marque en italique entre deux filets horizontaux (filets masqués sur mobile)", "Rangée utilitaire : recherche catalogue, compte et mini-panier réels", "Catégories centrées en capitales espacées entre filet épais et filet fin, repliées sur mobile", "Reste collé en haut"],
      animations: ["fade-in"], settings: ["Couleurs", "Polices", "Taille de la marque", "Épaisseur des filets", "Espacements", "Animation d'entrée"],
    },
    // ── 06 · Éclat Beauté : carte flottante ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-06", name: "Éclat Beauté", art: "Beauté et soins", desc: "Barre promo fermable en dégradé, puis carte arrondie à marges et ombre : médaillon dégradé, recherche arrondie, actions ; catégories en pilules.",
      S: ID("ecom-06", "Éclat Beauté", { bg: "#fbe9ee", fg: "#3a1f2b", mute: "#7a5563", alt: "#ffffff", accent: "#b0306a", onAccent: "#ffffff", line: "#f0cfd8", font: "font.nunito-sans", head: "font.cormorant-garamond", weight: "600", btnRadius: "999px", radius: "28px" }),
      build: (k, P) => { const S = k.S; return [
        promo([note(k, P.notice, { color: "#ffffff", size: "13px" })], { gradient: { from: "#b0306a", to: "#7a2a8c", angle: 90 } }),
        band(S, [{ type: "container", children: [
          inner([
            g([X.disc(k, { size: 34, gradient: { from: "#f7a8c4", to: S.accent, angle: 135 } }), mark(k, { size: "34px", italic: true, weight: "600", track: "0px" })], { gap: "12px", flexWrap: "nowrap" }),
            search(k, { grow: true, max: "460px", radius: "999px", fieldBg: S.bg, fieldLine: S.line, placeholder: "Rechercher un soin, une teinte…" }),
            g([account(k, { size: "13px" }), cart(k, {})], { gap: "16px", flexWrap: "nowrap" }),
          ], { gap: "24px" }),
          inner([nav(k, "pill", { size: "13.5px", weight: "600", hover: S.accent, onHover: S.onAccent })], { justifyContent: "center", paddingTop: "10px", marginTop: "12px", ...rule(S.line, "1px", "Top") }),
        ], ...sty({ display: "flex", flexDirection: "column", alignItems: "stretch", backgroundColor: S.alt, borderRadius: "28px", boxShadow: "lg", paddingTop: "16px", paddingBottom: "12px", paddingLeft: "28px", paddingRight: "28px", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto" }, { paddingLeft: "18px", paddingRight: "18px" }, { paddingLeft: "12px", paddingRight: "12px", borderRadius: "20px" }) }],
          { paddingTop: "14px", paddingBottom: "16px" }, { paddingLeft: "14px", paddingRight: "14px" }, { paddingLeft: "10px", paddingRight: "10px" }),
      ]; },
      mode: "stickyshrink", anim: "rise", hover: "", dark: false, tags: ["beauté", "carte flottante", "dégradé", "pilules"],
      features: ["Barre promotionnelle en dégradé, fermable", "Carte arrondie à ombre douce, détachée des bords", "Recherche arrondie sur le catalogue, compte et mini-panier réels", "Catégories en pilules (menu affecté), repliées sur mobile", "Se réduit au défilement"],
      animations: ["fade-in-up"], settings: ["Couleurs", "Polices", "Dégradé de la barre et du médaillon", "Arrondi et ombre de la carte", "Barre promotionnelle (texte, fermable)", "Animation d'entrée", "Effet au défilement"],
    },
    // ── 07 · Cabinet Créateur : navigation latérale ───────────────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-07", name: "Cabinet Créateur", art: "Boutique de créateur, rail latéral", desc: "Rail vertical à gauche (marque, catégories empilées en grand) ; à droite recherche, compte, panier et un ticker géant.",
      S: ID("ecom-07", "Cabinet Créateur", { bg: "#efece6", fg: "#161616", mute: "#5c5750", alt: "#e2ddd3", accent: "#c2410c", onAccent: "#ffffff", line: "#161616", font: "font.work-sans", head: "font.syne", weight: "800", btnRadius: "0px" }),
      build: (k, P) => { const S = k.S; return [
        band(S, [grid("260px 1fr", [
          stack([
            mark(k, { size: "34px", weight: "800", caps: "uppercase", track: "-1px" }),
            { ...X.navStack(k, "plain", { size: "20px", weight: "700", gap: "8px", label: "Catégories" }), hideOn: ["mobile"] },
            { ...nav(k, "plain", { size: "15px", label: "Catégories (mobile)" }), hideOn: ["desktop", "tablet"] },
          ], { gap: "18px", alignItems: "flex-start", justifyContent: "flex-start", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "24px", ...rule(S.fg, "2px", "Right") }, { paddingLeft: "22px" }, { paddingTop: "14px", paddingBottom: "12px", paddingLeft: "14px", paddingRight: "14px", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", borderRightWidth: "0px" }),
          stack([
            g([search(k, { grow: true, max: "560px", radius: "0px", fieldBg: "transparent", fieldLine: S.fg, placeholder: "Rechercher dans l'atelier…" }), g([account(k, { size: "13px" }), cart(k, {})], { gap: "18px", flexWrap: "nowrap" })], { justifyContent: "space-between", gap: "22px", flexWrap: "nowrap" }, { flexWrap: "wrap" }),
            X.ticker(k, [P.notice, "Annonce facultative — modifiez ce message"], { size: "34px", weight: "800", caps: "uppercase", font: S.head, track: "-0.5px", speed: "slow", sep: "✦", padV: "6px", color: S.fg }),
          ], { justifyContent: "space-between", gap: "30px", overflowX: "hidden", paddingTop: "28px", paddingBottom: "18px", paddingLeft: "36px", paddingRight: "28px" }, { paddingLeft: "24px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px", paddingTop: "10px", paddingBottom: "12px", gap: "12px" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "220px 1fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", ...rule(S.fg, "2px") }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" }),
      ]; },
      mode: "static", anim: "slide", hover: "", dark: false, tags: ["créateur", "navigation latérale", "vertical", "ticker"],
      features: ["Rail vertical : catégories du menu affecté empilées en grand (menu replié derrière un bouton sur mobile)", "Recherche catalogue, compte et mini-panier réels", "Ticker géant d'annonces (pause au clavier, immobile en mouvement réduit)", "Colonne latérale passée en rangée sur mobile"],
      animations: ["slide-in-left", "fade-in-down", "slide-in-right"], settings: ["Couleurs", "Polices", "Largeur du rail", "Taille des catégories", "Texte et vitesse du ticker", "Animation d'entrée"],
    },
    // ── 08 · Solde Express : outlet / promos ──────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-08", name: "Solde Express", art: "Outlet et promotions", desc: "Barre promo rouge fermable, puis rangée noire : bloc jaune de marque à biais, catégories en blocs, recherche et panier.",
      S: ID("ecom-08", "Solde Express", { bg: "#111111", fg: "#ffffff", mute: "#cfcfcf", alt: "#d90429", accent: "#ffe600", onAccent: "#111111", line: "#333333", font: "font.barlow-condensed", head: "font.anton", weight: "400", btnRadius: "0px" }),
      build: (k, P) => { const S = k.S; return [
        promo([note(k, P.notice, { color: "#ffffff", size: "15px", caps: "uppercase", track: "1.4px" }), btn(k, "Je découvre", "/catalogue", "solid", { bg: S.accent, fg: S.onAccent, size: "13px", padV: "7px", caps: "uppercase", track: "1px" })], { backgroundColor: S.alt }),
        band(S, [inner([
          g([
            X.slab(k, [mark(k, { size: "30px", color: S.onAccent, caps: "uppercase", track: "0.5px", weight: "400" })], { bg: S.accent, fg: S.onAccent, padV: "14px", padH: "28px", st: { alignSelf: "stretch" } }),
            X.slash(k, { w: 34, h: 66, angle: -20, color: S.accent, hideOn: ["mobile"] }),
          ], { gap: "0px", alignSelf: "stretch", flexWrap: "nowrap" }),
          nav(k, "block", { caps: "uppercase", track: "0.6px", size: "15px", weight: "600", hover: S.accent, onHover: S.onAccent }),
          g([search(k, { w: "360px", radius: "0px", fieldBg: "#1f1f1f", fieldLine: "#555555", placeholder: "Rechercher…" }), account(k, { size: "14px", color: "#ffffff" }), cart(k, { bg: S.accent, fg: S.onAccent })], { gap: "16px", flexWrap: "nowrap" }, { flexWrap: "wrap" }, { flexWrap: "wrap", gap: "12px", width: "100%" }),
        ], { gap: "18px", alignItems: "stretch", flexWrap: "wrap" })], { paddingTop: "0px", paddingBottom: "0px" }),
      ]; },
      mode: "sticky", anim: "slide", hover: "pop", dark: true, tags: ["outlet", "promotions", "barre fermable", "biais"],
      features: ["Barre promotionnelle rouge FERMABLE avec bouton d'action (choix mémorisé chez le visiteur)", "Bloc de marque jaune prolongé d'un biais diagonal", "Catégories en blocs pleine hauteur (menu affecté), repliées sur mobile", "Recherche catalogue et mini-panier avec pastille réels"],
      animations: ["slide-in-left", "pop"], settings: ["Couleurs", "Polices", "Barre promotionnelle (texte, bouton, fermable)", "Angle du biais", "Animation d'entrée", "Survol du bouton"],
    },
    // ── 09 · Cherche & Trouve : recherche d'abord ─────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-09", name: "Cherche & Trouve", art: "Recherche d'abord", desc: "Grand bandeau bleu : mini-rangée (marque, compte, panier), champ de recherche géant au centre, catégories en pastilles centrées.",
      S: ID("ecom-09", "Cherche & Trouve", { bg: "#1d3fd6", fg: "#ffffff", mute: "#dbe4ff", alt: "#ffffff", accent: "#ffd23f", onAccent: "#111111", line: "#4a66e8", font: "font.manrope", head: "font.manrope", weight: "800", btnRadius: "999px", radius: "999px" }),
      build: (k) => { const S = k.S, big = search(k, { grow: true, max: "820px", radius: "999px", fieldBg: "#ffffff", fieldLine: "#ffffff", placeholder: "Rechercher…" });
        big.parts = { field: { styles: { desktop: { fontFamily: S.font, backgroundColor: "#ffffff", color: "#111111", borderColor: "#ffffff", borderRadius: "999px", fontSize: "19px", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "28px" } } }, button: { styles: { desktop: { fontFamily: S.font, backgroundColor: S.accent, color: S.onAccent, borderRadius: "999px", fontSize: "16px", fontWeight: "800" } } } };
        return [band(S, [
          inner([mark(k, { size: "24px", weight: "800", track: "-0.5px" }), g([account(k, { size: "13px", color: "#ffffff" }), cart(k, { bg: S.accent, fg: S.onAccent })], { gap: "18px", flexWrap: "nowrap" })], { paddingTop: "14px" }),
          inner([big], { justifyContent: "center", paddingTop: "22px", paddingBottom: "8px" }),
          inner([nav(k, "pill", { size: "14px", weight: "700", hover: S.accent, onHover: S.onAccent, gap: "8px" })], { justifyContent: "center", paddingBottom: "18px", paddingTop: "6px" }),
        ], { backgroundColor: S.bg })]; },
      mode: "static", anim: "zoom", hover: "", dark: true, tags: ["recherche d'abord", "bandeau", "pastilles", "centré"],
      features: ["Champ de recherche géant (catalogue du site) au centre du bandeau", "Mini-rangée marque + compte + mini-panier avec pastille réelle", "Catégories en pastilles centrées (menu affecté), repliées derrière un bouton sur mobile", "Recherche pleine largeur dès la tablette"],
      animations: ["zoom-in", "fade-in"], settings: ["Couleurs", "Polices", "Taille du champ de recherche", "Espacements", "Animation d'entrée"],
    },
    // ── 10 · Pavé Catalogue : mosaïque de catégories ──────────────────────────────────────────────────────────────────────────────────────
    {
      key: "ecom-10", name: "Pavé Catalogue", art: "Mosaïque de catégories", desc: "Cadre épais : nom du site monumental et recherche à gauche ; catégories en cases bordées à droite, compte et panier en blocs.",
      S: ID("ecom-10", "Pavé Catalogue", { bg: "#ffffff", fg: "#0e0e0e", mute: "#4d4d4d", alt: "#f1f1ef", accent: "#d92d20", onAccent: "#ffffff", line: "#0e0e0e", font: "font.archivo", head: "font.archivo-black", weight: "400", btnRadius: "0px", bw: "2px" }),
      build: (k) => { const S = k.S; return [
        band(S, [grid("4fr 5fr", [
          stack([
            X.monument(k, { min: 40, max: 92, caps: "uppercase", track: "-2px", lh: 0.88, font: S.head }),
            g([search(k, { grow: true, max: "100%", radius: "0px", fieldBg: S.alt, fieldLine: S.fg, placeholder: "Rechercher…" })], { flexWrap: "wrap", gap: "0px" }),
          ], { gap: "16px", justifyContent: "space-between", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "26px", paddingRight: "26px", ...rule(S.fg, "3px", "Right") }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px", paddingTop: "14px", paddingBottom: "12px", borderRightWidth: "0px", borderBottomWidth: "3px", borderBottomStyle: "solid", borderBottomColor: S.fg }),
          stack([
            X.navTiles(k, "block", { w: 640, gap: "0px", border: S.fg, bg: S.alt, size: "14px", weight: "700", caps: "uppercase", track: "0.6px", padV: "14px", padH: "18px" }),
            g([X.slab(k, [account(k, { size: "13px", color: S.bg })], { bg: S.fg, fg: S.bg, padV: "10px", padH: "16px" }), cart(k, { bg: S.accent, fg: S.onAccent })], { gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }),
          ], { gap: "14px", justifyContent: "space-between", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "26px", paddingRight: "26px" }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "14px", paddingRight: "14px", paddingTop: "12px", paddingBottom: "14px" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "3fr 4fr" }, { gridTemplate: "1fr" })], { paddingLeft: "0px", paddingRight: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderBottomWidth: "3px", borderColor: S.fg }, { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" }),
      ]; },
      mode: "static", anim: "reveal", hover: "", dark: false, tags: ["mosaïque", "cases", "monumental", "catalogue"],
      features: ["Nom du site monumental à taille fluide (lisible dès 320 px)", "Catégories en mosaïque de cases bordées qui passent à la ligne (menu affecté), survol et focus en couleur", "Recherche catalogue, compte et mini-panier réels", "Menu replié derrière un bouton sur mobile"],
      animations: ["reveal", "fade-in"], settings: ["Couleurs", "Polices", "Taille du nom du site", "Largeur et fond des cases", "Épaisseur des filets", "Animation d'entrée"],
    },
  ],
};
