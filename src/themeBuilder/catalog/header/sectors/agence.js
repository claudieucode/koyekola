// Secteur « agence » de la bibliothèque d'en-têtes : agences créatives et studios digitaux. Zone visuelle : expérimental mais utilisable, typographie expressive, asymétrie, brutalisme, menus créatifs.
// Contrat : docs/theme-builder/HEADER_SECTOR_CONTRACT.md. Matrice de conception complète (avec le rapport d'état) : docs/theme-builder/headers-secteurs/agence.md.
//
// MATRICE DE CONCEPTION (clé · nom · direction · composition · palette (fond/texte/accent) · polices (titres/texte) · navigation · mouvement · responsive)
//  01 Hors Cadre      · design expérimental       · bandeau défilant noir, puis marque + anneau en haut à gauche, navigation en CASES DÉCALÉES (abaissées) et bouton remonté · crème/noir/orange · Syne + Space Mono · cases à bordure franche, remplies au survol · entrée « monte », survol « surgit » · mobile : marque + burger, bouton gardé
//  02 Colossal Type    · typographie monumentale   · fine ligne d'infos, NOM DU SITE sur toute la largeur (taille fluide 56→200 px), filet citron épais, navigation répartie sur toute la largeur + bouton flèche · noir/blanc cassé/citron · Archivo Black + Inter Tight · liens en capitales espacées, soulignement au survol · entrée « dévoilement » (masque) · mobile : nom réduit, burger
//  03 Dalle Rose       · brutalisme moderne        · quatre CELLULES à gros filets (bloc rose, accroche, date, bouton) puis barre de navigation NOIRE pleine largeur · béton/noir/rose · Dela Gothic One + Space Mono · cases pleines inversées au survol · entrée « glisse » · mobile : cellules empilées, navigation repliée
//  04 Fil Oblique     · artistique asymétrique    · gros bloc de marque orange collé au bord, bandeau incliné violet et disque dégradé qui le chevauchent, navigation soulignée en bas à droite avec bouton rond · écru/violet/orange · Instrument Serif + DM Sans · soulignement qui se révèle · entrée « glisse » · mobile : bloc de marque + burger
//  05 Seuil Ouvert     · studio minimal, menu plein écran · UNE SEULE ligne : point, nom en mono, mention de disponibilité, bouton « Menu » qui ouvre un panneau plein écran numéroté (cascade, Échap, focus piégé) · noir/blanc/violet · Inter Tight + DM Mono · menu plein écran « cercle » · en-tête superposé qui devient plein au défilement · entrée « dévoilement » · identique sur mobile
//  06 Table des Projets · portfolio à index numéroté · petit nom + libellé à gauche, MOT « Index » géant à droite qui ouvre un index plein écran numéroté (01, 02…), ligne basse en trois cellules à filets · gris clair/noir/bleu · Familjen Grotesk + DM Mono · panneau latéral « glisse à droite » en cascade · entrée douce · mobile : mot géant réduit
//  07 Boucle Rose     · studio de motion design   · liseré dégradé, marque précédée d'une « tête de lecture » (anneau + disque dégradé), navigation en pilules centrée, deux boutons, ruban défilant sombre dessous · violet nuit/blanc/rose · Unbounded + Space Grotesk · pilules pleines au survol · entrée « zoom », survol « pulse » · mobile : marque + burger, ruban gardé
//  08 Maison Rétro    · branding rétro contemporain · MÉDAILLON rond central (marque), date et accroche à gauche, bouton et réseaux à droite, navigation en cases à contour sous double filet · crème/brun/brique · Caprasimo + DM Sans · cases à contour, remplies au survol · entrée « monte » · mobile : médaillon, burger
//  09 Plan Masse      · studio d'architecture web · colonne latérale jaune pour la marque, à droite deux niveaux : infos pratiques (consignes à remplacer) + bouton, puis navigation en ONGLETS mono · bleu de plan/blanc/jaune · IBM Plex Sans Condensed + IBM Plex Mono · onglets à filet supérieur · entrée « glisse » · mobile : marque puis navigation repliée
//  10 Collectif Ruban  · collectif d'artistes      · deux rubans adhésifs inclinés à gauche d'un nom centré légèrement penché, bouton ROND à droite, navigation en cases jaune pâle sous le nom · jaune/noir/bleu électrique · Bagel Fat One + Space Grotesk · cases à bordure noire, bleues au survol · entrée « zoom », survol « vacille » · mobile : nom centré, burger

const { row, flush, cell, roundBtn, navSpread, smooth, style, B, X } = require("../agence-parts");
const { ID, mark, nav, btn, note, date, social, g, stack, grid } = B;
const { mv } = B;

const NOTICE = (P) => P.notice || "Disponible pour de nouveaux projets — à personnaliser";
const ONE = "1fr";

module.exports = {
  sector: "agence",
  models: [
    // 01 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-01", name: "Hors Cadre", art: "Design expérimental",
      desc: "Bandeau défilant noir, marque et anneau en haut à gauche, navigation en cases décalées vers le bas et bouton remonté : une composition qui déborde de la grille.",
      S: ID("agence-01", "Hors Cadre", { bg: "#efe9dd", fg: "#141414", mute: "#4d4a44", alt: "#e2dacb", accent: "#ff4b1f", onAccent: "#141414", line: "#141414", font: "font.space-mono", head: "font.syne", weight: "800" }),
      build: (k, P) => { const S = k.S; return [
        X.ticker(k, [NOTICE(P), NOTICE(P)], { speed: "normal", bg: S.fg, color: S.bg, caps: "uppercase", track: "2px", size: "11.5px", sep: "✶" }),
        row(k, [
          g([X.ring(k, { size: 46, w: "4px", color: S.accent }), mark(k, { kind: "logo", size: "34px", caps: "uppercase", track: "-0.03em", weight: "800" })], { gap: "10px", flexWrap: "nowrap", alignSelf: "flex-start" }),
          style(smooth(X.navTiles(k, "block", { w: 560, gap: "6px", bg: S.bg, border: S.fg, size: "13px", caps: "uppercase", track: "1px", weight: "700", hover: S.accent, onHover: S.onAccent })), { transform: { y: 34 } }, undefined, { transform: { y: 0 } }),
          style(btn(k, P.cta[0], P.cta[1], "arrow", { bg: S.fg, fg: S.bg, caps: "uppercase", track: "1px", size: "12.5px" }), { alignSelf: "flex-start" }, undefined, { alignSelf: "center" }),
        ], { pv: "20px", inn: { alignItems: "flex-start", flexWrap: "nowrap" }, innT: { flexWrap: "wrap" }, innM: { flexWrap: "wrap", alignItems: "center" }, bottom: { w: "3px", c: S.fg } }),
      ]; },
      mode: "static", anim: "rise", hover: "pop", dark: false, tags: ["expérimental", "cases décalées", "ticker", "affiche"],
      features: ["Bandeau défilant d'annonces (pause au survol et au clavier, immobile si l'on réduit les animations)", "Navigation du menu « En-tête » en cases décalées vers le bas", "Anneau décoratif et marque en capitales", "Bouton d'action avec flèche, remonté par rapport aux cases"],
      animations: ["fade-in-up", "pop"], settings: ["Couleurs", "Polices", "Annonces du bandeau", "Vitesse du bandeau", "Espacements", "Animations d'entrée"],
    },
    // 02 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-02", name: "Colossal Type", art: "Typographie monumentale",
      desc: "Le nom du site occupe toute la largeur en lettres géantes ; une ligne de navigation répartie sur la page s'appuie sur un filet citron épais.",
      S: ID("agence-02", "Colossal Type", { bg: "#0c0c0c", fg: "#f2efe6", mute: "#b9b5aa", alt: "#1c1c1c", accent: "#d4ff3a", onAccent: "#0c0c0c", line: "#3a3a36", font: "font.inter-tight", head: "font.archivo-black", weight: "400" }),
      build: (k, P) => { const S = k.S; return [
        row(k, [note(k, NOTICE(P), { color: S.mute, size: "11.5px", caps: "uppercase", track: "2px" }), g([date(k, { color: S.mute }), social(k, { n: 2, size: 22 })], { gap: "16px", flexWrap: "nowrap" })], { pv: "10px", bottom: { w: "1px", c: S.line } }),
        row(k, [style(mv(X.monument(k, { min: 56, max: 200, caps: "uppercase", track: "-0.04em", lh: 0.84, color: S.fg }), "reveal", 0, 1000), { width: "100%" })], { pv: "22px", inn: { justifyContent: "flex-start" }, st: { paddingBottom: "6px" } }),
        row(k, [
          smooth(navSpread(k, "underline", { size: "14px", caps: "uppercase", track: "2px", weight: "700", gap: "22px", hover: S.accent })),
          btn(k, P.cta[0], P.cta[1], "arrow", { bg: S.accent, fg: S.onAccent, caps: "uppercase", track: "1px", size: "12.5px" }),
        ], { pv: "16px", top: { w: "8px", c: S.accent }, inn: { flexWrap: "nowrap", gap: "32px" }, innT: { flexWrap: "wrap" } }),
      ]; },
      mode: "stickyshrink", anim: "reveal", hover: "lift", dark: true, tags: ["monumental", "typographie", "plein largeur", "sombre"],
      features: ["Nom du site en taille fluide (de 56 à 200 px), lisible dès 320 px", "Navigation répartie sur toute la largeur, soulignement au survol", "En-tête qui se réduit au défilement", "Date et réseaux dans la ligne d'informations"],
      animations: ["reveal", "lift"], settings: ["Couleurs", "Polices", "Taille du nom", "Navigation", "Bouton", "Effet au défilement", "Animations d'entrée"],
    },
    // 03 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-03", name: "Dalle Rose", art: "Brutalisme moderne",
      desc: "Quatre cases aux filets épais — bloc rose, accroche, date, bouton — puis une barre de navigation noire pleine largeur : franc, lourd, lisible.",
      S: ID("agence-03", "Dalle Rose", { bg: "#dcdad2", fg: "#000000", mute: "#2b2b2b", alt: "#cfcdc4", accent: "#ff2e93", onAccent: "#000000", line: "#000000", font: "font.space-mono", head: "font.dela-gothic-one", weight: "400", bw: "4px" }),
      build: (k, P) => { const S = k.S, bd = { borderStyle: "solid", borderWidth: "0px", borderRightWidth: "4px", borderColor: S.fg, paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px" }; return [
        flush(k, grid("auto 1fr auto auto", [
          cell([mark(k, { kind: "logo", size: "26px", caps: "uppercase", color: S.onAccent })], { ...bd, backgroundColor: S.accent }),
          cell([note(k, NOTICE(P), { color: S.fg, size: "12px", caps: "uppercase", track: "1px" })], bd),
          cell([date(k, { color: S.fg, size: "12px" })], bd),
          cell([btn(k, P.cta[0], P.cta[1], "solid", { bg: S.fg, fg: S.bg, caps: "uppercase", track: "1px", size: "13px" })], { ...bd, borderRightWidth: "0px", justifyContent: "center" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr 1fr" }, { gridTemplate: ONE }), { bg: S.bg, bottom: { w: "4px", c: S.fg } }),
        flush(k, B.band(S, [smooth(navSpread(k, "block", { size: "14px", caps: "uppercase", track: "1.5px", weight: "700", color: S.bg, gap: "0px", hover: S.accent, onHover: S.onAccent, justify: "flex-start" }))], { backgroundColor: S.fg, paddingLeft: "12px", paddingRight: "12px" }, { paddingLeft: "10px", paddingRight: "10px" }, { paddingLeft: "8px", paddingRight: "8px" }), { bg: S.fg, bottom: { w: "10px", c: S.accent } }),
      ]; },
      mode: "sticky", anim: "slide", hover: "push", dark: false, tags: ["brutaliste", "cellules", "filets épais", "barre noire"],
      features: ["Quatre cellules séparées par des filets de 4 px", "Barre de navigation noire pleine largeur, cases inversées au survol", "Date du jour automatique", "En-tête collant"],
      animations: ["slide-in-left", "push"], settings: ["Couleurs", "Polices", "Épaisseur des filets", "Navigation", "Bouton", "Animations d'entrée"],
    },
    // 04 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-04", name: "Fil Oblique", art: "Artistique asymétrique",
      desc: "Un gros bloc de marque orange collé au bord, un bandeau incliné et un disque dégradé qui le chevauchent, la navigation soulignée en bas à droite : une affiche.",
      S: ID("agence-04", "Fil Oblique", { bg: "#f7efe4", fg: "#1d1240", mute: "#4b3f73", alt: "#ece0cf", accent: "#ff6a3d", onAccent: "#1d1240", line: "#1d1240", font: "font.dm-sans", head: "font.instrument-serif", weight: "400", btnRadius: "999px" }),
      build: (k, P) => { const S = k.S; return [
        flush(k, B.inner([
          g([
            style(X.slab(k, [mark(k, { kind: "logo", size: "clamp(26px, 5vw, 52px)", italic: true, color: S.onAccent, lh: 1 })], { bg: S.accent, fg: S.onAccent, padV: "30px", padH: "44px" }), { flexShrink: 0 }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px" }),
            style(X.slash(k, { w: 74, h: 128, angle: -18, color: S.fg, hideOn: ["mobile"] }), { marginLeft: "-18px" }),
            style(X.disc(k, { size: 74, gradient: { from: "#ff6a3d", to: "#ffc247", angle: 135 }, hideOn: ["mobile"] }), { marginLeft: "-44px", marginTop: "-54px" }),
          ], { gap: "0px", flexWrap: "nowrap", alignItems: "center" }, undefined, { flexWrap: "nowrap" }),
          stack([
            note(k, NOTICE(P), { color: S.mute, size: "12px", caps: "uppercase", track: "1.6px", st: { textAlign: "right" } }),
            g([smooth(nav(k, "underline", { size: "16px", weight: "600", gap: "30px", hover: S.accent })), roundBtn(k, P.cta[0], P.cta[1], { size2: 84, size: "12px", bg: S.fg, fg: S.bg })], { gap: "24px", flexWrap: "nowrap", justifyContent: "flex-end" }),
          ], { alignItems: "flex-end", gap: "10px", paddingRight: "28px", paddingBottom: "14px" }, undefined, { paddingRight: "14px", paddingBottom: "0px", alignItems: "flex-end" }),
        ], { maxWidth: "100%", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "nowrap", gap: "12px" }, { flexWrap: "wrap" }, { flexWrap: "nowrap", alignItems: "center" }), { bg: S.bg, bottom: { w: "2px", c: S.fg } }),
      ]; },
      mode: "static", anim: "slide", hover: "float", dark: false, tags: ["asymétrique", "oblique", "affiche", "artistique"],
      features: ["Bloc de marque coloré collé au bord de la page", "Bandeau incliné et disque dégradé qui se chevauchent", "Navigation soulignée qui se révèle au survol", "Bouton rond"],
      animations: ["slide-in-left", "float"], settings: ["Couleurs", "Polices", "Taille de la marque", "Navigation", "Bouton", "Animations d'entrée"],
    },
    // 05 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-05", name: "Seuil Ouvert", art: "Studio digital minimal, menu plein écran",
      desc: "Une seule ligne très aérée : un point, le nom en mono, une mention de disponibilité et un bouton « Menu » qui ouvre un panneau plein écran numéroté.",
      S: ID("agence-05", "Seuil Ouvert", { bg: "#0a0a0a", fg: "#ffffff", mute: "#a8a8a8", alt: "#151515", accent: "#7c6cff", onAccent: "#0a0a0a", line: "#2a2a2a", font: "font.dm-mono", head: "font.inter-tight", weight: "600" }),
      build: (k, P) => { const S = k.S; return [
        row(k, [
          g([X.disc(k, { size: 12, color: S.accent }), mark(k, { kind: "logo", size: "16px", caps: "uppercase", track: "3px", weight: "600", font: S.head })], { gap: "12px", flexWrap: "nowrap" }),
          g([X.disc(k, { size: 6, color: S.accent }), note(k, NOTICE(P), { color: S.mute, size: "11.5px", caps: "uppercase", track: "1.6px" })], { gap: "10px", flexWrap: "nowrap", justifyContent: "center" }, undefined, { display: "none" }),
          X.fsMenu(k, { buttonLabel: "Menu", closeLabel: "Fermer", numbers: true, align: "left", preset: "circle", duration: 650, stagger: 90, size: "14px", caps: "uppercase", track: "3px" }),
        ], { pv: "26px", bg: "transparent", inn: { flexWrap: "nowrap" }, bottom: { w: "1px", c: S.line }, px: "8px" }),
      ]; },
      mode: "overlaysolid", anim: "reveal", hover: "", dark: true, tags: ["minimal", "menu plein écran", "superposé", "studio"],
      features: ["Menu plein écran sur ordinateur et mobile : liens du menu « En-tête » numérotés, en cascade, Échap pour fermer, focus gardé dans le panneau", "En-tête superposé à la page, qui devient plein dès qu'on défile", "Mention de disponibilité à personnaliser", "Ligne unique, identique sur mobile"],
      animations: ["reveal"], settings: ["Couleurs", "Polices", "Menu plein écran (effet, durée, cascade)", "Texte du bouton", "Effet au défilement", "Animations d'entrée"],
    },
    // 06 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-06", name: "Table des Projets", art: "Portfolio à index numéroté",
      desc: "Un petit nom à gauche, un mot « Index » géant à droite qui ouvre un index plein écran numéroté, et une ligne basse en trois cellules à filets fins.",
      S: ID("agence-06", "Table des Projets", { bg: "#f4f4ef", fg: "#101010", mute: "#50504a", alt: "#e6e6df", accent: "#1a1aff", onAccent: "#ffffff", line: "#101010", font: "font.dm-mono", head: "font.familjen-grotesk", weight: "700" }),
      build: (k, P) => { const S = k.S; return [
        row(k, [
          stack([mark(k, { kind: "logo", size: "17px", caps: "uppercase", track: "2px", weight: "700" }), note(k, "(Index des projets)", { color: S.mute, size: "12px", caps: "uppercase", track: "1.6px" })], { gap: "6px" }),
          style(X.fsMenu(k, { buttonLabel: "Index", closeLabel: "Fermer", numbers: true, align: "left", preset: "slide-right", duration: 700, stagger: 80, size: "68px", font: S.head, track: "-0.04em" }), {}, { fontSize: "52px" }, { fontSize: "38px" }),
        ], { pv: "14px", inn: { flexWrap: "nowrap", alignItems: "center" }, bottom: { w: "2px", c: S.fg } }),
        row(k, [grid("1fr 2fr 1fr", [
          cell([date(k, { color: S.fg })], { paddingTop: "9px", paddingBottom: "9px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: S.line }),
          cell([note(k, NOTICE(P), { color: S.fg, size: "12px", caps: "uppercase", track: "1.2px" })], { paddingLeft: "18px", justifyContent: "center", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: S.line }),
          cell([social(k, { n: 3, size: 22 })], { justifyContent: "flex-end" }),
        ], { width: "100%", gap: "0px" }, { gridTemplate: "1fr 2fr" }, { gridTemplate: ONE })], { pv: "0px", bg: S.alt }),
      ]; },
      mode: "sticky", anim: "soft", hover: "", dark: false, tags: ["index", "numéroté", "plein écran", "portfolio"],
      features: ["Mot « Index » géant qui ouvre un index plein écran à liens numérotés (01, 02…)", "Panneau latéral qui glisse, liens en cascade, Échap, focus piégé", "Ligne basse en trois cellules : date du jour, mention, réseaux", "En-tête collant"],
      animations: ["fade-in"], settings: ["Couleurs", "Polices", "Menu plein écran (effet, durée, cascade)", "Texte du bouton", "Animations d'entrée"],
    },
    // 07 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-07", name: "Boucle Rose", art: "Studio de motion design",
      desc: "Un liseré dégradé, une marque précédée d'une tête de lecture, des pilules de navigation et un ruban défilant sombre : l'énergie d'une timeline.",
      S: ID("agence-07", "Boucle Rose", { bg: "#120a24", fg: "#f6f1ff", mute: "#c4b8e6", alt: "#1e1238", accent: "#ff4fa3", onAccent: "#120a24", line: "#3a2a63", font: "font.space-grotesk", head: "font.unbounded", weight: "700", btnRadius: "999px" }),
      build: (k, P) => { const S = k.S; return [
        X.stripe(k, { h: 5, gradient: { from: "#ff4fa3", to: "#ffb347", angle: 90 } }),
        row(k, [
          g([g([X.ring(k, { size: 30, w: "3px", color: S.accent }), style(X.disc(k, { size: 22, gradient: { from: "#ff4fa3", to: "#ffb347", angle: 135 } }), { marginLeft: "-14px" })], { gap: "0px", flexWrap: "nowrap" }), mark(k, { kind: "logo", size: "20px", weight: "700", track: "-0.02em" })], { gap: "12px", flexWrap: "nowrap" }),
          smooth(nav(k, "pill", { size: "14px", weight: "600", hover: S.accent, onHover: S.onAccent }), 220),
          g([style(btn(k, "Voir le showreel", "/blog", "outline", { fg: S.fg, size: "13px" }), {}, undefined, { display: "none" }), btn(k, P.cta[0], P.cta[1], "pill", { size: "13px" })], { gap: "10px", flexWrap: "nowrap" }),
        ], { pv: "16px", inn: { flexWrap: "nowrap" }, innT: { flexWrap: "wrap" }, innM: { flexWrap: "wrap" } }),
        X.ticker(k, [NOTICE(P), NOTICE(P)], { speed: "slow", direction: "right", bg: S.alt, color: S.mute, caps: "uppercase", track: "2px", size: "11px", sep: "●", padV: "7px" }),
      ]; },
      mode: "sticky", anim: "zoom", hover: "pulse", dark: true, tags: ["motion", "dégradé", "ruban", "pilules"],
      features: ["Liseré dégradé, anneau et disque dégradé en tête de lecture", "Navigation en pilules remplies au survol", "Ruban défilant dans l'autre sens (pause au survol et au clavier)", "Deux boutons : contour et plein"],
      animations: ["zoom-in", "pulse"], settings: ["Couleurs", "Polices", "Dégradé du liseré", "Vitesse du ruban", "Boutons", "Animations d'entrée"],
    },
    // 08 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-08", name: "Maison Rétro", art: "Branding rétro contemporain",
      desc: "Un médaillon rond central, la date et une accroche à gauche, un bouton à droite, puis une navigation en cases à contour sous un double filet : un air d'étiquette.",
      S: ID("agence-08", "Maison Rétro", { bg: "#f2e3c6", fg: "#3a1c10", mute: "#5c3a2a", alt: "#e6d0a6", accent: "#b93c1e", onAccent: "#fff8ea", line: "#3a1c10", font: "font.dm-sans", head: "font.caprasimo", weight: "400", btnRadius: "999px" }),
      build: (k, P) => { const S = k.S; return [
        row(k, [grid("1fr auto 1fr", [
          stack([date(k, { color: S.fg }), note(k, NOTICE(P), { color: S.mute, size: "12.5px" })], { gap: "6px", alignItems: "flex-start" }, undefined, { alignItems: "center" }),
          g([mark(k, { kind: "logo", size: "24px", color: S.onAccent, caps: "uppercase", track: "1px" })], { backgroundColor: S.accent, borderRadius: "999px", width: "118px", height: "118px", justifyContent: "center", paddingLeft: "12px", paddingRight: "12px", flexWrap: "nowrap", borderStyle: "solid", borderWidth: "4px", borderColor: S.bg, boxShadow: "md", textAlign: "center" }),
          g([btn(k, P.cta[0], P.cta[1], "pill", { size: "13px", caps: "uppercase", track: "1px" }), social(k, { n: 2, size: 28, shape: "circle" })], { gap: "12px", justifyContent: "flex-end" }, { justifyContent: "center" }),
        ], { width: "100%", gap: "24px", justifyItems: "center" }, { gridTemplate: ONE }, { gridTemplate: ONE })], { pv: "18px", top: { w: "6px", c: S.fg }, inn: { justifyContent: "center" } }),
        row(k, [smooth(nav(k, "box", { size: "13.5px", caps: "uppercase", track: "1.8px", weight: "700", hover: S.fg, st: { margin: "0 auto" } }))], { pv: "9px", bottom: { w: "6px", c: S.fg }, top: { w: "2px", c: S.fg }, inn: { justifyContent: "center" } }),
      ]; },
      mode: "static", anim: "rise", hover: "bob", dark: false, tags: ["rétro", "médaillon", "double filet", "étiquette"],
      features: ["Médaillon rond avec la marque, bordure et ombre", "Date du jour et accroche à personnaliser", "Navigation en cases à contour sous un double filet", "Bouton pilule et réseaux ronds"],
      animations: ["fade-in-up", "bob"], settings: ["Couleurs", "Polices", "Taille du médaillon", "Navigation", "Bouton et réseaux", "Animations d'entrée"],
    },
    // 09 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-09", name: "Plan Masse", art: "Studio d'architecture web",
      desc: "Une colonne jaune pour la marque, puis deux niveaux techniques : informations pratiques et bouton, navigation en onglets mono — l'esprit d'un plan de masse.",
      S: ID("agence-09", "Plan Masse", { bg: "#0f2a4a", fg: "#e8f1ff", mute: "#a9c4ea", alt: "#15355c", accent: "#ffd23f", onAccent: "#0f2a4a", line: "#3d5f8f", font: "font.ibm-plex-mono", head: "font.ibm-plex-sans-condensed", weight: "700" }),
      build: (k, P) => { const S = k.S, ln = { borderStyle: "solid", borderWidth: "0px", borderColor: S.line }; return [
        flush(k, grid("260px 1fr", [
          cell([mark(k, { kind: "logo", size: "28px", caps: "uppercase", track: "1px", color: S.onAccent })], { backgroundColor: S.accent, paddingTop: "22px", paddingBottom: "22px", paddingLeft: "30px", paddingRight: "20px" }),
          stack([
            g([X.info(k, ["hours", "phone", "mail"], { color: S.mute, size: "12px", icon: S.accent, gap: "20px" }), btn(k, P.cta[0], P.cta[1], "outline", { fg: S.fg, border: S.fg, size: "12px", caps: "uppercase", track: "1px", padV: "8px" })], { justifyContent: "space-between", paddingLeft: "28px", paddingRight: "28px", paddingTop: "10px", paddingBottom: "10px", flexWrap: "nowrap", ...ln, borderBottomWidth: "1px" }, { flexWrap: "wrap", paddingLeft: "14px", paddingRight: "14px" }, { display: "none" }),
            g([smooth(nav(k, "tab", { size: "13px", caps: "uppercase", track: "1.5px", weight: "500", hover: S.accent }))], { paddingLeft: "16px", paddingRight: "28px" }, { paddingLeft: "10px" }, { paddingLeft: "10px", paddingRight: "10px", paddingTop: "4px", paddingBottom: "4px", justifyContent: "flex-end" }),
          ], { gap: "0px", alignItems: "stretch", ...ln, borderLeftWidth: "1px" }, undefined, { borderLeftWidth: "0px" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "200px 1fr" }, { gridTemplate: ONE }), { bg: S.bg, bottom: { w: "1px", c: S.fg } }),
      ]; },
      mode: "sticky", anim: "slide", hover: "", dark: true, tags: ["technique", "colonne", "onglets", "mono"],
      features: ["Colonne de marque jaune à gauche", "Informations pratiques (horaires, téléphone, e-mail) à remplir : aucune donnée inventée", "Navigation en onglets à filet supérieur au survol", "Bouton à contour, masqué au besoin sur mobile"],
      animations: ["slide-in-left"], settings: ["Couleurs", "Polices", "Informations pratiques", "Navigation", "Bouton", "Animations d'entrée"],
    },
    // 10 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "agence-10", name: "Collectif Ruban", art: "Collectif d'artistes",
      desc: "Deux rubans adhésifs inclinés à gauche d'un nom centré légèrement penché ; un bouton rond à droite, des cases de navigation sous le nom : un tableau d'atelier.",
      S: ID("agence-10", "Collectif Ruban", { bg: "#ffd93d", fg: "#111111", mute: "#3b3300", alt: "#fff3b0", accent: "#2d2bff", onAccent: "#ffffff", line: "#111111", font: "font.space-grotesk", head: "font.bagel-fat-one", weight: "400", btnRadius: "999px" }),
      build: (k, P) => { const S = k.S; return [
        row(k, [grid("1fr auto 1fr", [
          g([X.slash(k, { w: 120, h: 30, angle: -24, color: S.accent, hideOn: ["mobile"] }), style(X.slash(k, { w: 64, h: 30, angle: -24, color: S.fg, hideOn: ["mobile"] }), { marginLeft: "-10px" })], { gap: "0px", flexWrap: "nowrap", justifyContent: "flex-start" }, { display: "none" }),
          style(mv(X.monument(k, { min: 38, max: 96, lh: 1, track: "-0.01em" }), "zoom-in", 0, 800), { textAlign: "center", transform: { rotate: -2 } }, undefined, { transform: { rotate: 0 } }),
          g([roundBtn(k, P.cta[0], P.cta[1], { size2: 100, size: "12.5px", bg: S.accent, fg: S.onAccent })], { justifyContent: "flex-end" }, { justifyContent: "center" }),
        ], { width: "100%", gap: "20px" }, { gridTemplate: "1fr auto" }, { gridTemplate: ONE })], { pv: "16px" }),
        row(k, [smooth(X.navTiles(k, "block", { w: 820, gap: "10px", bg: S.alt, border: S.fg, size: "14px", caps: "uppercase", track: "1px", weight: "700", hover: S.accent, onHover: S.onAccent, padV: "9px", padH: "18px", st: { margin: "0 auto" } }))], { pv: "14px", bottom: { w: "4px", c: S.fg }, inn: { justifyContent: "center" } }),
      ]; },
      mode: "static", anim: "zoom", hover: "wobble", dark: false, tags: ["collectif", "rubans", "centré", "bouton rond"],
      features: ["Nom du site centré en taille fluide, légèrement penché", "Rubans adhésifs inclinés décoratifs", "Navigation en cases à bordure noire, bleues au survol", "Bouton rond"],
      animations: ["zoom-in", "wobble"], settings: ["Couleurs", "Polices", "Taille du nom", "Navigation", "Bouton", "Animations d'entrée"],
    },
  ],
};
