// Secteur « media » : Médias, magazines, culture et portfolios. 10 en-têtes écrits sur mesure (clés media-01 … media-10).
// Matrice complète : docs/theme-builder/headers-secteurs/media.md. Zone visuelle : presse et édition (serifs de titrage, condensées, mono), filets, rubriques, date ;
// composition par aplats et dégradés natifs, aucune image factice. Aucun texte factice qui paraisse réel : les textes d'annonce sont des consignes à remplacer.
//
//  clé       nom                  direction                          silhouette (niveaux de gris)
//  media-01  Le Courrier          mât de magazine classique          bandeau mince + titre monumental centré entre filets épais + rubriques centrées
//  media-02  Dépêche Direct       journal en ligne avec ticker       bandeau « direct » + ticker défilant, rangée marque/date/recherche, onglets de rubriques sous filet épais
//  media-03  Pivoine              magazine mode / lifestyle          capsule flottante arrondie (médaillon en dégradé + marque italique + rubriques en pilules) sous un liseré dégradé
//  media-04  Fréquence Noire      webzine culture / musique          bloc de marque plein à gauche collé au bord, bandeau incliné, rubriques en mono, filet dégradé
//  media-05  Onde Courte          radio / podcast                    disque en dégradé + barres d'égaliseur animées, pastille « direct », rubriques en pilules sur bande
//  media-06  Saison Pourpre       théâtre / lieu à programmation     infos pratiques, grand nom à gauche, rubriques en mosaïque de cases, bouton de réservation
//  media-07  Cimaise              galerie d'art contemporain         trois colonnes hautes séparées par des filets verticaux, rubriques empilées
//  media-08  Chambre Claire       portfolio photographe minimal      une ligne fine : marque minuscule, date, bouton « Index » ouvrant un menu plein écran numéroté
//  media-09  Carnet Ocre          blog personnel éditorial           grande marque italique + accroche à gauche, rubriques fines et actions à droite, double filet
//  media-10  Écran Rouge          chaîne vidéo / créateur            marque en pavé, recherche large centrale, compte + abonnement, rangée de « puces » de rubriques
const B = require("../blocks");
const X = require("../blocks2");
const { compact } = require("../../kit");
const { ID, mark, nav, btn, search, account, social, date, note, tag, g, stack, grid, band, inner, mv } = B;

// Séparation de rangée : bordure haute et/ou basse [épaisseur, couleur]
const sep = (top, bottom, style) => ({ top, bottom, style });
const edge = (o) => (o.top || o.bottom ? compact({ borderStyle: o.style || "solid", borderWidth: "0px", borderTopWidth: o.top && o.top[0], borderBottomWidth: o.bottom && o.bottom[0], borderColor: (o.top || o.bottom)[1] }) : {});
// Une rangée : bande pleine largeur + contenu borné
const R = (k, kids, o = {}) => band(k.S, [B.inner(kids, { justifyContent: o.j || "space-between", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg || k.S.bg, color: o.fg || k.S.fg, paddingTop: o.pv || "16px", paddingBottom: o.pv || "16px", ...edge(o), ...(o.st || {}) }), o.t, o.m);
// champ de recherche clair sur fond sombre : texte sombre (contraste ≥ 4,5)
const lightField = (n) => { n.parts.field.styles.desktop.color = "#0f0f10"; return n; };
const fold = { gridTemplate: "1fr" };
const flush = { paddingLeft: "0px", paddingRight: "0px" };

module.exports = {
  sector: "media",
  models: [
    // ── 01 · mât de magazine classique ─────────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-01", name: "Le Courrier", art: "Mât de magazine classique", desc: "Date et accroche en bandeau, titre monumental centré entre filets épais, rubriques centrées : un grand quotidien.",
      S: ID("media-01", "Le Courrier", { bg: "#fbf7ef", fg: "#17140f", mute: "#5a5246", alt: "#efe8d8", accent: "#b3261e", onAccent: "#ffffff", line: "#17140f", font: "font.lora", head: "font.playfair-display", weight: "900" }),
      build: (k, P) => [
        R(k, [date(k), note(k, P.notice, { size: "12px", caps: "uppercase", track: "1.6px", st: { textAlign: "center" } }), social(k, { n: 3, size: 24, shape: "square" })], { pv: "8px", ...sep(null, ["1px", k.S.line]), bg: k.S.alt }),
        R(k, [X.monument(k, { min: 44, max: 112, track: "-1px", st: { width: "100%", textAlign: "center" } })], { pv: "22px", j: "center", ...sep(null, ["4px", k.S.line]) }),
        R(k, [g([nav(k, "underline", { caps: "uppercase", track: "1.8px", size: "12.5px", gap: "28px" })], { justifyContent: "center" }), btn(k, P.cta[0], P.cta[1], "solid", { padV: "9px", padH: "18px", caps: "uppercase", track: "1.4px", size: "12px" })], { pv: "10px", ...sep(null, ["1px", k.S.line]), inn: { gap: "24px" } }),
      ],
      mode: "static", anim: "reveal", hover: "lift", dark: false, tags: ["magazine", "mât", "quotidien", "date", "filets"],
      features: ["Titre du site monumental à taille fluide (lisible dès 320 px)", "Date du jour et message d'accroche modifiables", "Rubriques centrées avec soulignement qui se révèle au survol et au clavier", "Bouton d'abonnement et réseaux (masqués sur mobile)"],
      animations: ["reveal", "lift"], settings: ["Couleurs", "Polices", "Titre monumental", "Menu", "Bouton", "Espacements", "Animation d'entrée"],
    },
    // ── 02 · journal en ligne avec ticker ─────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-02", name: "Dépêche Direct", art: "Journal en ligne à ticker", desc: "Bandeau « en direct » avec ticker défilant, marque et recherche, rubriques en onglets : un site d'actualité.",
      S: ID("media-02", "Dépêche Direct", { bg: "#ffffff", fg: "#101828", mute: "#475467", alt: "#f2f4f7", accent: "#d92d20", onAccent: "#ffffff", line: "#d0d5dd", font: "font.ibm-plex-sans-condensed", head: "font.oswald", weight: "700", caps: "uppercase" }),
      build: (k, P) => [
        band(k.S, [grid("auto 1fr", [
          X.slab(k, [{ type: "text", props: { html: "<p><strong>En direct</strong></p>" }, styles: { desktop: { color: "#ffffff", fontFamily: k.S.head, fontSize: "14px", textTransform: "uppercase", letterSpacing: "2px" } } }], { bg: k.S.fg, fg: "#ffffff", padV: "10px", padH: "22px" }),
          X.ticker(k, ["Titre d'actualité à personnaliser", "Deuxième titre à personnaliser", "Troisième titre à personnaliser"], { bg: k.S.accent, color: k.S.onAccent, speed: "normal", sep: "///", caps: "uppercase", track: "1px", padV: "11px" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, fold, fold)], { ...flush, backgroundColor: k.S.accent }, flush, flush),
        R(k, [mark(k, { size: "34px", caps: "uppercase", track: "0.5px" }), date(k), search(k, { grow: true, max: "420px", placeholder: "Rechercher un article" }), btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1px" })], { pv: "16px", inn: { gap: "24px" } }),
        R(k, [nav(k, "tab", { caps: "uppercase", track: "1.2px", size: "13px", weight: "700" })], { pv: "0px", j: "flex-start", bg: k.S.alt, ...sep(["3px", k.S.fg], null) }),
      ],
      mode: "sticky", anim: "slide", hover: "push", dark: false, tags: ["actualité", "ticker", "journal", "direct", "onglets"],
      features: ["Ticker natif de titres : pause au survol et au clavier, immobile si « réduire les animations »", "Recherche large dans le blog", "Rubriques en onglets au filet épais", "En-tête collant au défilement", "Date du jour"],
      animations: ["slide-in-left", "push"], settings: ["Couleurs", "Polices", "Ticker (textes, vitesse)", "Recherche", "Menu", "Bouton", "Comportement au défilement"],
    },
    // ── 03 · magazine mode / lifestyle ───────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-03", name: "Pivoine", art: "Magazine mode et lifestyle", desc: "Capsule flottante arrondie sous un liseré dégradé : médaillon, marque italique, rubriques en pilules.",
      S: ID("media-03", "Pivoine", { bg: "#fdf1ef", fg: "#2a1215", mute: "#6b3f46", alt: "#ffffff", accent: "#b4235a", onAccent: "#ffffff", line: "#f1cfd3", font: "font.dm-sans", head: "font.bodoni-moda", weight: "500", btnRadius: "999px", btn: "pill" }),
      build: (k, P) => [
        X.stripe(k, { h: 6, gradient: { from: "#b4235a", to: "#f08a5d", angle: 90 } }),
        band(k.S, [inner([
          g([X.disc(k, { size: 38, gradient: { from: "#b4235a", to: "#f08a5d", angle: 135 } }), mark(k, { size: "32px", italic: true, weight: "500" })], { gap: "12px", flexWrap: "nowrap" }),
          nav(k, "pill", { size: "14px", weight: "600", hover: k.S.accent, onHover: "#ffffff" }),
          g([account(k, { color: k.S.fg }), btn(k, P.cta[0], P.cta[1], "pill", { padH: "22px" })], { gap: "16px", flexWrap: "nowrap" }),
        ], { backgroundColor: k.S.alt, borderRadius: "999px", boxShadow: "lg", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "26px", paddingRight: "12px", maxWidth: "1160px", borderStyle: "solid", borderWidth: "1px", borderColor: k.S.line, justifyContent: "space-between" },
        { borderRadius: "28px", paddingLeft: "18px", paddingRight: "10px" }, { borderRadius: "22px", paddingLeft: "14px", paddingRight: "8px" })], { paddingTop: "18px", paddingBottom: "18px" }),
      ],
      mode: "sticky", anim: "zoom", hover: "grow", dark: false, tags: ["mode", "lifestyle", "capsule", "dégradé", "pilules"],
      features: ["Capsule flottante arrondie avec ombre", "Médaillon et liseré en dégradé natifs", "Rubriques en pilules qui se remplissent au survol et au focus", "Compte du visiteur et abonnement"],
      animations: ["zoom-in", "grow"], settings: ["Couleurs", "Polices", "Médaillon (dégradé)", "Menu", "Compte", "Bouton", "Animation d'entrée"],
    },
    // ── 04 · webzine culture / musique ──────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-04", name: "Fréquence Noire", art: "Webzine culture et musique", desc: "Bloc de marque plein collé au bord, bandeau incliné, rubriques en mono : un webzine de scène et de disques.",
      S: ID("media-04", "Fréquence Noire", { bg: "#0c0c0f", fg: "#f5f5f0", mute: "#a1a1aa", alt: "#18181b", accent: "#d4ff3a", onAccent: "#0c0c0f", line: "#34343a", font: "font.space-mono", head: "font.anton", weight: "400", caps: "uppercase" }),
      build: (k, P) => [
        band(k.S, [grid("auto 1fr auto", [
          g([mark(k, { size: "40px", caps: "uppercase", track: "1px", color: k.S.onAccent, weight: "400" })], { backgroundColor: k.S.accent, paddingTop: "22px", paddingBottom: "22px", paddingLeft: "28px", paddingRight: "34px", alignSelf: "stretch" }, { paddingLeft: "18px" }),
          g([X.slash(k, { w: 34, h: 54, angle: -20, color: k.S.accent, hideOn: ["tablet", "mobile"] }), nav(k, "mono", { size: "13px", caps: "uppercase", track: "1.4px", hover: k.S.accent })], { gap: "26px", paddingLeft: "20px", flexWrap: "nowrap" }),
          g([date(k, { color: k.S.mute }), btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1px", size: "12px", font: k.S.font })], { gap: "18px", paddingRight: "24px", flexWrap: "nowrap" }, { paddingRight: "16px" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "auto 1fr" }, fold)], { ...flush, paddingTop: "0px", paddingBottom: "0px" }, flush, flush),
        X.stripe(k, { h: 4, gradient: { from: "#d4ff3a", to: "#34343a", angle: 90 } }),
      ],
      mode: "stickyshrink", anim: "slide", hover: "push", dark: true, tags: ["webzine", "musique", "mono", "bloc plein", "bandeau incliné"],
      features: ["Bloc de marque plein collé au bord gauche", "Bandeau incliné natif (masqué sur tablette et mobile)", "Rubriques en monospace, soulignées au survol", "Se réduit au défilement"],
      animations: ["slide-in-left", "push"], settings: ["Couleurs", "Polices", "Bloc de marque", "Menu", "Bouton", "Comportement au défilement"],
    },
    // ── 05 · radio / podcast ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-05", name: "Onde Courte", art: "Radio et podcast", desc: "Disque en dégradé et barres d'égaliseur, pastille « en direct », rubriques en pilules sur bande : une radio indépendante.",
      S: ID("media-05", "Onde Courte", { bg: "#12102b", fg: "#f2f0ff", mute: "#b4aee0", alt: "#1e1b45", accent: "#ff4d8d", onAccent: "#12102b", line: "#3a3578", font: "font.dm-sans", head: "font.righteous", weight: "400", btnRadius: "999px", btn: "pill" }),
      build: (k, P) => {
        const bars = [14, 26, 38, 20, 32, 44, 24, 36, 16, 28, 40, 18].map((h, i) => mv(X.vrule(k, { h, w: "6px", color: i % 3 === 0 ? k.S.accent : k.S.mute, hideOn: ["tablet", "mobile"] }), "fade-in-up", 120 + i * 60, 500));
        return [
          R(k, [
            g([X.disc(k, { size: 52, gradient: { from: "#ff4d8d", to: "#f2f0ff", angle: 135 } }), mark(k, { size: "30px" })], { gap: "14px", flexWrap: "nowrap" }),
            g(bars, { gap: "5px", alignItems: "flex-end", flexWrap: "nowrap", height: "46px" }),
            g([tag(k, "En direct", { bg: "transparent", fg: k.S.accent, st: { borderStyle: "solid", borderWidth: "1.5px", borderColor: k.S.accent } }), btn(k, P.cta[0], P.cta[1], "pill", { padH: "24px" })], { gap: "14px", flexWrap: "nowrap" }),
          ], { pv: "16px" }),
          R(k, [nav(k, "pill", { size: "14px", hover: k.S.accent, onHover: k.S.onAccent }), social(k, { n: 3, size: 26, shape: "circle" })], { pv: "8px", bg: k.S.alt, ...sep(["1px", k.S.line], null) }),
        ];
      },
      mode: "sticky", anim: "zoom", hover: "pulse", dark: true, tags: ["radio", "podcast", "égaliseur", "disque", "dégradé"],
      features: ["Barres d'égaliseur natives qui entrent en cascade", "Disque en dégradé comme pochette de marque", "Pastille « en direct » et abonnement", "Rubriques en pilules et réseaux sur une bande dédiée"],
      animations: ["fade-in-up", "pulse"], settings: ["Couleurs", "Polices", "Égaliseur", "Menu", "Bouton", "Réseaux", "Animation d'entrée"],
    },
    // ── 06 · théâtre / lieu culturel ─────────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-06", name: "Saison Pourpre", art: "Théâtre et lieu à programmation", desc: "Infos pratiques en haut, grand nom à gauche, rubriques en mosaïque de cases dorées, bouton de réservation.",
      S: ID("media-06", "Saison Pourpre", { bg: "#2a0a14", fg: "#f7ecd9", mute: "#d9bfa8", alt: "#3d1322", accent: "#e0b24f", onAccent: "#2a0a14", line: "#6b2a3d", font: "font.newsreader", head: "font.gloock", weight: "400" }),
      build: (k) => [
        R(k, [X.info(k, ["hours", "address", "phone"], { gap: "28px", color: k.S.mute, size: "12.5px" }), note(k, "Saison en cours", { size: "12px", caps: "uppercase", track: "2px", color: k.S.accent })], { pv: "8px", bg: k.S.alt, ...sep(null, ["1px", k.S.line]) }),
        band(k.S, [inner([grid("1fr auto auto", [
          stack([note(k, "Programmation", { size: "12px", caps: "uppercase", track: "3px", color: k.S.accent }), mark(k, { size: "clamp(34px, 5vw, 58px)", lh: 1 })], { gap: "6px" }),
          X.navTiles(k, "box", { w: 440, border: k.S.accent, size: "13px", caps: "uppercase", track: "1.2px", padV: "9px", padH: "14px" }),
          btn(k, "Réserver", "/contact", "solid", { caps: "uppercase", track: "1.4px", padV: "14px", padH: "26px" }),
        ], { width: "100%", gap: "36px", alignItems: "center" }, { gridTemplate: "1fr auto" }, fold)])], { paddingTop: "22px", paddingBottom: "22px" }),
        X.stripe(k, { h: 4, gradient: { from: "#e0b24f", to: "#2a0a14", angle: 90 } }),
      ],
      mode: "static", anim: "rise", hover: "lift", dark: true, tags: ["théâtre", "programmation", "mosaïque", "infos pratiques", "billetterie"],
      features: ["Infos pratiques (horaires, adresse, téléphone) à compléter, masquées sur mobile", "Rubriques en mosaïque de cases à bordure dorée", "Bouton de réservation vers la page contact", "Liseré dégradé en pied"],
      animations: ["fade-in-up", "lift"], settings: ["Couleurs", "Polices", "Infos pratiques", "Mosaïque du menu", "Bouton de réservation", "Espacements"],
    },
    // ── 07 · galerie d'art contemporain ──────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-07", name: "Cimaise", art: "Galerie d'art contemporain", desc: "Trois colonnes hautes séparées par des filets verticaux, rubriques empilées : l'en-tête d'un accrochage.",
      S: ID("media-07", "Cimaise", { bg: "#ffffff", fg: "#0a0a0a", mute: "#4a4a4a", alt: "#f1f1ee", accent: "#ff3b00", onAccent: "#0a0a0a", line: "#0a0a0a", font: "font.space-mono", head: "font.syne", weight: "700", caps: "uppercase" }),
      build: (k, P) => {
        const col = { paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: k.S.line, alignSelf: "stretch" };
        return [
          band(k.S, [grid("240px 1fr 280px", [
            stack([mark(k, { size: "22px", caps: "uppercase", track: "1px" }), note(k, "Exposition en cours : à personnaliser", { size: "11.5px", caps: "uppercase", track: "1px" })], { ...col, gap: "10px", justifyContent: "space-between" }, { borderRightWidth: "0px" }),
            g([nav(k, "plain", { vertical: true, size: "13px", caps: "uppercase", track: "1.6px", weight: "500" })], { ...col, alignItems: "flex-start" }, { borderRightWidth: "0px", paddingTop: "0px" }),
            stack([date(k, { color: k.S.fg, size: "12px" }), social(k, { n: 3, size: 24, shape: "square" }), btn(k, P.cta[0], P.cta[1], "outline", { caps: "uppercase", track: "1.2px", size: "12px", font: k.S.font })], { ...col, borderRightWidth: "0px", gap: "14px", alignItems: "flex-start", justifyContent: "space-between" }, { paddingTop: "0px" }),
          ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr 1fr" }, fold)],
          { ...flush, paddingTop: "0px", paddingBottom: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "8px", borderBottomWidth: "1px", borderColor: k.S.accent }, flush, flush),
        ];
      },
      mode: "sticky", anim: "soft", hover: "", dark: false, tags: ["galerie", "art contemporain", "colonnes", "filets verticaux", "mono"],
      features: ["Trois colonnes séparées par des filets verticaux", "Rubriques empilées (menu vertical, toujours visible)", "Message d'exposition en cours à personnaliser", "Date, réseaux et bouton d'abonnement"],
      animations: ["fade-in"], settings: ["Couleurs", "Polices", "Menu vertical", "Réseaux", "Bouton", "Espacements"],
    },
    // ── 08 · portfolio de photographe minimal ────────────────────────────────────────────────────────────────────────────
    {
      key: "media-08", name: "Chambre Claire", art: "Portfolio photographe minimal", desc: "Une ligne fine : marque minuscule, date, bouton « Index » qui ouvre un menu plein écran numéroté.",
      S: ID("media-08", "Chambre Claire", { bg: "#f5f3ee", fg: "#111111", mute: "#55524c", alt: "#e8e5dd", accent: "#111111", onAccent: "#f5f3ee", line: "#111111", font: "font.dm-mono", head: "font.instrument-serif", weight: "400" }),
      build: (k) => [
        X.stripe(k, { h: 14, gradient: { from: "#111111", to: "#111111", angle: 90 } }),
        R(k, [
          mark(k, { size: "22px", italic: true }),
          date(k, { color: k.S.mute, size: "11px" }),
          X.fsMenu(k, { buttonLabel: "Index", closeLabel: "Fermer", numbers: true, align: "left", preset: "fade", duration: 450, stagger: 60, caps: "uppercase", track: "1.5px", size: "12px" }),
        ], { pv: "16px", ...sep(null, ["1px", k.S.line]) }),
      ],
      mode: "stickyhide", anim: "soft", hover: "", dark: false, tags: ["portfolio", "photographe", "minimal", "menu plein écran", "index"],
      features: ["Une seule ligne très fine : le portfolio reste le sujet", "Menu plein écran numéroté, sur ordinateur et mobile (Échap, focus piégé)", "Se cache en descendant, revient en remontant", "Date du jour discrète"],
      animations: ["fade-in"], settings: ["Couleurs", "Polices", "Menu plein écran (animation, numéros)", "Comportement au défilement"],
    },
    // ── 09 · blog personnel éditorial ────────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-09", name: "Carnet Ocre", art: "Blog personnel éditorial", desc: "Grande marque italique et accroche à gauche, rubriques fines et actions à droite, double filet : le carnet d'un auteur.",
      S: ID("media-09", "Carnet Ocre", { bg: "#f8efe0", fg: "#2b2118", mute: "#5e4d3b", alt: "#efe0c8", accent: "#a8431f", onAccent: "#ffffff", line: "#2b2118", font: "font.newsreader", head: "font.fraunces", weight: "600" }),
      build: (k, P) => [
        band(k.S, [inner([grid("1fr auto", [
          stack([mark(k, { size: "clamp(30px, 5vw, 56px)", italic: true, weight: "600", lh: 1.05 }), note(k, "Notes, lectures et carnets : à personnaliser", { size: "14px", color: k.S.mute, st: { fontStyle: "italic" } })], { gap: "6px" }),
          stack([nav(k, "thin", { size: "16px", gap: "24px", hover: k.S.accent }), g([social(k, { n: 3, size: 26, shape: "circle" }), btn(k, P.cta[0], P.cta[1], "line", { size: "14px", weight: "700" })], { gap: "18px", justifyContent: "flex-end", flexWrap: "nowrap" }, { justifyContent: "flex-start" })], { gap: "14px", alignItems: "flex-end" }, { alignItems: "flex-start" }),
        ], { width: "100%", gap: "40px", alignItems: "end" }, { gridTemplate: "1fr" }, fold)])], { paddingTop: "30px", paddingBottom: "22px", borderStyle: "double", borderWidth: "0px", borderBottomWidth: "5px", borderColor: k.S.line }),
      ],
      mode: "static", anim: "rise", hover: "float", dark: false, tags: ["blog", "carnet", "éditorial", "italique", "double filet"],
      features: ["Marque italique de grande taille avec accroche", "Rubriques fines à soulignement progressif", "Actions alignées à droite : réseaux et abonnement souligné", "Double filet de pied"],
      animations: ["fade-in-up", "float"], settings: ["Couleurs", "Polices", "Marque", "Accroche", "Menu", "Bouton", "Espacements"],
    },
    // ── 10 · chaîne vidéo / créateur ─────────────────────────────────────────────────────────────────────────────────────
    {
      key: "media-10", name: "Écran Rouge", art: "Chaîne vidéo et créateur", desc: "Marque en pavé, recherche large centrale, compte et abonnement, rangée de puces de rubriques : une chaîne de contenus.",
      S: ID("media-10", "Écran Rouge", { bg: "#0f0f10", fg: "#f4f4f5", mute: "#b4b4bb", alt: "#232326", accent: "#e11d1d", onAccent: "#ffffff", line: "#303034", font: "font.inter", head: "font.archivo-black", weight: "400", btnRadius: "999px", btn: "pill" }),
      build: (k, P) => [
        X.stripe(k, { h: 4, gradient: { from: "#e11d1d", to: "#e11d1d", angle: 90 } }),
        R(k, [
          X.slab(k, [mark(k, { size: "24px", weight: "400", color: "#ffffff" })], { bg: k.S.accent, fg: "#ffffff", padV: "8px", padH: "18px", radius: "14px" }),
          lightField(search(k, { grow: true, max: "560px", radius: "999px", placeholder: "Rechercher une vidéo", fieldBg: "#f4f4f5" })),
          g([account(k), btn(k, P.cta[0], P.cta[1], "pill", { padH: "22px" })], { gap: "16px", flexWrap: "nowrap" }),
        ], { pv: "12px", inn: { gap: "24px" } }),
        R(k, [nav(k, "pill", { size: "13.5px", weight: "600", gap: "8px", hover: k.S.fg, onHover: k.S.bg })], { pv: "8px", j: "flex-start", ...sep(null, ["1px", k.S.line]) }),
      ],
      mode: "sticky", anim: "rise", hover: "pop", dark: true, tags: ["vidéo", "créateur", "chaîne", "recherche", "puces"],
      features: ["Recherche large au centre", "Compte du visiteur et abonnement en pilule", "Rubriques en puces qui s'inversent au survol", "En-tête collant"],
      animations: ["fade-in-up", "pop"], settings: ["Couleurs", "Polices", "Pavé de marque", "Recherche", "Menu", "Bouton", "Comportement au défilement"],
    },
  ],
};
