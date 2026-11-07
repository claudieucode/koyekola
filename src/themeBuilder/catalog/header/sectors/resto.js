// Secteur « resto » (Restaurants, gastronomie et hôtellerie) : 10 en-têtes sur mesure, chacun avec SA composition.
// Contrat : docs/theme-builder/HEADER_SECTOR_CONTRACT.md. Matrice détaillée : docs/theme-builder/headers-secteurs/resto.md.
//
// MATRICE DE CONCEPTION (nom · direction · composition · navigation · palette · polices · mouvement · responsive)
// 01 Le Zinc           · bistrot rétro            · bandeau d'horaires brique + MÉDAILLON (disque, double bordure) à gauche + rangée à DEUX NIVEAUX à droite (accroche + Réserver / navigation)
//                        · soulignée majuscules · crème / brun / brique · Yeseva One + Karla · médaillon en zoom, fondu doux, survol « se soulève » · mobile : médaillon réduit, menu replié
// 02 Table Étoilée     · gastronomie sobre        · UNE rangée très aérée : Réserver (contour or) à gauche, marque espacée entre deux filets, hamburger MENU PLEIN ÉCRAN à droite
//                        · menu plein écran numéroté · noir / ivoire / or · Cormorant Garamond + Raleway · révélation · se réduit · mobile : marque en tête, Réserver et Menu dessous
// 03 Pizza Rosso       · trattoria / pizzeria     · liseré TRICOLORE + dalle rouge INCLINÉE portant la marque + navigation en pastilles + gros bouton pilule verte
//                        · pastilles · crème / brun / rouge · Caprasimo + Nunito · glissement latéral, survol « surgit » · mobile : dalle compacte, menu replié
// 04 Maki Zen          · sushi / japonais minimal · une rangée presque vide : pastille rouge + marque, long FILET qui relie, navigation fine, bouton carré · se cache au défilement
//                        · fine, espacée · papier / encre / rouge · Zen Old Mincho + Zen Kaku Gothic New · fondu · mobile : filet masqué
// 05 Pain de Campagne  · boulangerie-pâtisserie  · DEUX NIVEAUX : bandeau défilant d'annonces + étiquette en tirets (marque), navigation en CASES arrondies, bouton pilule
//                        · cases arrondies · crème / brun / miel · Cherry Swash + Nunito Sans · montée douce, survol « flotte » · mobile : bandeau conservé, menu replié
// 06 La Carte des Vins · bar à vin / cave         · CARTE DE MENU VERTICALE : navigation en liste à FILETS POINTILLÉS dans un cartouche, marque italique à gauche, horaires + Réserver à droite
//                        · liste verticale pointillée (menu replié sur mobile) · bordeaux / ivoire / or · Playfair Display + Lato · fondu
// 07 Brasserie Houblon · brasserie / microbrasserie · BANDEAU D'HORAIRES ambre (horaires, adresse, téléphone = consignes) + barre sombre à ONGLETS pleine hauteur + bouton carré
//                        · onglets · charbon / crème / ambre · Alfa Slab One + Barlow · glissement, survol « appuie » · se réduit au défilement
// 08 Maison de Charme  · hôtel de charme avec réservation · marque centrée entre deux filets, accroche, puis CAPSULE de réservation (navigation fine + Réserver dans la capsule)
//                        · fine dans une capsule · lin / sauge · Bellefair + Mulish · révélation, survol « grossit » · mobile : capsule compacte
// 09 Grand Resort      · resort / hôtel luxe SUPERPOSÉ sur le visuel d'ouverture · barre d'infos + Réserver verre, titre MONUMENTAL fluide centré, filet, navigation fine centrée
//                        · fine centrée · teal / blanc / sable · Bodoni Moda + Jost · révélation · devient plein au défilement
// 10 Camion Soleil     · traiteur / food truck    · ticker rapide + dalle INCLINÉE (cadre épais) + navigation en cases à contour épais + gros bouton noir
//                        · cases · jaune / noir / rouge · Lilita One + Work Sans · zoom, survol « rebondit » · mobile : ticker conservé
//
// Règles tenues : couleurs fixes, polices locales, aucune image, horaires/adresse/téléphone = consignes à remplacer (jamais de donnée inventée), pas de position absolue dans une rangée,
// menus = menu affecté à « En-tête », responsive par flex (ordre et bases par écran), mouvement natif désactivé si « réduire les animations ».
const B = require("../blocks");
const X = require("../blocks2");
const { compact } = require("../../kit");
const { ID, mark, nav, btn, g, stack, band, inner, line, note, mv } = B;

// Rangée : bande pleine largeur au fond voulu + contenu borné (t / m : réglages tablette / mobile de la bande ; innT / innM : du contenu)
const row = (k, kids, o = {}) => band(k.S, [inner(kids, { justifyContent: o.j || "space-between", ...(o.inn || {}) }, o.innT, o.innM)],
  compact({ backgroundColor: o.bg === undefined ? k.S.bg : o.bg, color: o.fg || k.S.fg, paddingTop: o.pv || "16px", paddingBottom: o.pv || "16px", ...(o.st || {}) }),
  { paddingLeft: "18px", paddingRight: "18px", ...(o.t || {}) }, { paddingLeft: "14px", paddingRight: "14px", ...(o.m || {}) });
const bottom = (c, w = "1px", style = "solid") => ({ borderStyle: style, borderWidth: "0px", borderBottomWidth: w, borderColor: c });
const hide = (node, on) => ({ ...node, hideOn: on });
const cell = (kids, st = {}, t, m) => g(kids, { flexWrap: "nowrap", gap: "14px", ...st }, t, m);
const clampPx = (a, b, vw = 3) => `clamp(${a}px, ${vw}vw, ${b}px)`;
const dotted = (k, o = {}) => line(k, { color: o.color || k.S.line, st: { borderStyle: o.style || "dotted", ...(o.st || {}) } });
const noPad = { paddingLeft: "0px", paddingRight: "0px" };

module.exports = {
  sector: "resto",
  models: [
    // ── 01 · Bistrot rétro : médaillon + bandeau d'horaires + deux niveaux ─────────────────────────────────────────────────────────────
    {
      key: "resto-01", name: "Le Zinc", art: "Bistrot rétro", desc: "Un médaillon rond à gauche, un bandeau d'horaires brique au-dessus, puis deux niveaux : accroche et réservation, navigation en majuscules.",
      S: ID("resto-01", "Le Zinc", { bg: "#f6ead3", fg: "#2b1a12", mute: "#6b4a37", alt: "#ecdcbc", accent: "#9c2f1d", onAccent: "#fff6e6", line: "#c9b08a", font: "font.karla", head: "font.yeseva-one", weight: "400", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const medal = mv(g([mark(k, { size: clampPx(15, 21, 2), weight: "400", st: { textAlign: "center" } })], { width: "116px", height: "116px", flexShrink: 0, flexWrap: "nowrap", justifyContent: "center", borderRadius: "999px", backgroundColor: S.alt, borderStyle: "double", borderWidth: "6px", borderColor: S.accent, paddingLeft: "10px", paddingRight: "10px", textAlign: "center" }, { width: "92px", height: "92px" }, { width: "78px", height: "78px", borderWidth: "4px" }), "zoom-in", 0, 800);
        return [
          row(k, [g([line(k, { color: S.onAccent, st: { width: "48px", opacity: 0.6 } }), note(k, P.notice, { color: S.onAccent, size: "12px", caps: "uppercase", track: "2.4px", st: { textAlign: "center" } }), line(k, { color: S.onAccent, st: { width: "48px", opacity: 0.6 } })], { gap: "16px", flexWrap: "nowrap", justifyContent: "center", width: "100%" })], { bg: S.accent, fg: S.onAccent, pv: "7px", j: "center" }),
          row(k, [medal, stack([
            g([hide(note(k, P.tagline, { color: S.mute, size: "14px", st: { fontStyle: "italic", fontFamily: S.head, flexShrink: 1 } }), ["mobile"]), btn(k, P.cta[0], P.cta[1], "solid", { size: "14px", caps: "uppercase", track: "1.6px", padV: "11px", padH: "24px", st: { marginLeft: "auto" } })], { justifyContent: "space-between", flexWrap: "nowrap", gap: "18px", width: "100%" }),
            dotted(k, { color: S.accent, style: "dashed", st: { width: "100%" } }),
            nav(k, "underline", { caps: "uppercase", track: "1.6px", size: "13px", weight: "700", gap: "30px" }),
          ], { gap: "8px", flexGrow: 1, flexBasis: "0px", minWidth: "0px" })], { pv: "14px", inn: { flexWrap: "nowrap", gap: "28px", alignItems: "center", justifyContent: "flex-start" }, innT: { gap: "20px" }, innM: { gap: "14px" }, st: { ...bottom(S.line, "1px") } }),
        ];
      },
      mode: "sticky", anim: "soft", hover: "lift", dark: false, tags: ["bistrot", "médaillon", "bandeau d'horaires", "deux niveaux", "rétro"],
      features: ["Médaillon rond à double bordure portant la marque", "Bandeau d'horaires (consigne à remplacer) encadré de filets", "Deux niveaux : accroche + bouton Réserver, puis navigation en majuscules soulignée", "Bouton Réserver toujours visible, menu replié sur mobile"],
      animations: ["zoom-in", "fade-in", "lift"], settings: ["Couleurs", "Police", "Taille du médaillon", "Textes du bandeau et de l'accroche", "Animation d'entrée", "Survol du bouton"],
    },

    // ── 02 · Gastronomie étoilée sobre : une rangée aérée, menu plein écran ──────────────────────────────────────────────────────────────
    {
      key: "resto-02", name: "Table Étoilée", art: "Gastronomie sobre", desc: "Une seule rangée très aérée : réservation à gauche, marque espacée entre deux filets, menu plein écran numéroté à droite.",
      S: ID("resto-02", "Table Étoilée", { bg: "#5a1a28", fg: "#f6ecdc", mute: "#e0cfb4", alt: "#6a2232", accent: "#c8a456", onAccent: "#14110b", line: "#8a5a50", font: "font.raleway", head: "font.cormorant-garamond", weight: "500", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const brand = g([line(k, { color: S.accent, st: { width: "36px" } }), mark(k, { size: clampPx(15, 24, 2.4), caps: "uppercase", track: "0.42em", weight: "500", st: { textAlign: "center" } }), line(k, { color: S.accent, st: { width: "36px" } })], { flexWrap: "nowrap", gap: "20px", justifyContent: "center", flexGrow: 0 }, undefined, { flexBasis: "100%", order: -1, gap: "12px" });
        return [row(k, [
          cell([btn(k, P.cta[0], P.cta[1], "outline", { fg: S.accent, border: S.accent, caps: "uppercase", track: "0.22em", size: "11.5px", padV: "12px", padH: "26px", weight: "600" })], { flexBasis: "0px", flexGrow: 1, justifyContent: "flex-start" }, undefined, { flexBasis: "auto", flexGrow: 1 }),
          brand,
          cell([X.fsMenu(k, { buttonLabel: "Menu", closeLabel: "Fermer", preset: "circle", numbers: true, align: "center", caps: "uppercase", track: "0.22em", size: "12px", color: S.fg })], { flexBasis: "0px", flexGrow: 1, justifyContent: "flex-end" }, undefined, { flexBasis: "auto", flexGrow: 1 }),
        ], { pv: "34px", inn: { flexWrap: "nowrap", gap: "28px" }, innM: { flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }, st: { ...bottom(S.line, "1px") }, m: { paddingTop: "20px", paddingBottom: "18px" } })];
      },
      mode: "stickyshrink", anim: "reveal", hover: "float", dark: true, tags: ["gastronomie", "menu plein écran", "sobre", "étoilé", "une rangée"],
      features: ["Une rangée sans navigation visible : tout passe par le menu plein écran numéroté", "Bouton Réserver contour or toujours à gauche", "Marque en petites capitales très espacées entre deux filets dorés", "Se réduit au défilement"],
      animations: ["reveal", "fade-in", "float"], settings: ["Couleurs", "Police", "Libellés du menu plein écran", "Style de l'ouverture du menu", "Animation d'entrée", "Réduction au défilement"],
    },

    // ── 03 · Trattoria / pizzeria colorée : liseré tricolore, dalle inclinée ─────────────────────────────────────────────────────────────
    {
      key: "resto-03", name: "Pizza Rosso", art: "Trattoria colorée", desc: "Un liseré tricolore, une dalle rouge inclinée qui porte la marque, des pastilles de navigation et un gros bouton vert.",
      S: ID("resto-03", "Pizza Rosso", { bg: "#fff4dc", fg: "#2a1208", mute: "#6b3a26", alt: "#fde7b8", accent: "#c62a1f", onAccent: "#ffffff", line: "#e5c98a", font: "font.nunito", head: "font.caprasimo", weight: "400", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S, GREEN = "#2a7a37", third = (bg) => ({ type: "container", children: [], styles: { desktop: compact({ flexGrow: 1, height: "8px", backgroundColor: bg }) } });
        const slab = g([mark(k, { size: clampPx(20, 32, 2.6), color: S.onAccent, weight: "400", st: { transform: { skewX: 12 }, whiteSpace: "nowrap" } })], { backgroundColor: S.accent, transform: { skewX: -12 }, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "40px", paddingRight: "40px", flexWrap: "nowrap", flexShrink: 0 }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "22px", paddingRight: "22px", paddingTop: "10px", paddingBottom: "10px" });
        return [
          g([third(GREEN), third("#ffffff"), third(S.accent)], { width: "100%", gap: "0px", flexWrap: "nowrap", backgroundColor: "#ffffff" }),
          row(k, [mv(slab, "slide-in-left", 0, 650), nav(k, "pill", { size: "15px", weight: "700", hover: S.accent, onHover: S.onAccent, st: { flexGrow: 1 } }), btn(k, P.cta[0], P.cta[1], "pill", { bg: GREEN, fg: "#ffffff", size: "16px", padV: "15px", padH: "32px", weight: "800" })],
            { pv: "0px", inn: { gap: "22px", flexWrap: "nowrap" }, innM: { flexWrap: "wrap", gap: "10px" }, st: { ...bottom(S.line, "2px") }, m: { paddingBottom: "10px" } }),
        ];
      },
      mode: "sticky", anim: "slide", hover: "pop", dark: false, tags: ["trattoria", "pizzeria", "tricolore", "dalle inclinée", "coloré"],
      features: ["Liseré tricolore pleine largeur", "Dalle rouge inclinée portant la marque (texte redressé)", "Navigation en pastilles qui se remplissent au survol et au focus", "Gros bouton pilule verte Réserver, menu replié sur mobile"],
      animations: ["slide-in-left", "pop"], settings: ["Couleurs", "Police", "Inclinaison et taille de la dalle", "Style de la navigation", "Animation d'entrée", "Survol du bouton"],
    },

    // ── 04 · Sushi / japonais minimal : un filet relie tout ──────────────────────────────────────────────────────────────────────────────
    {
      key: "resto-04", name: "Maki Zen", art: "Japonais minimal", desc: "Presque rien : une pastille rouge, la marque, un long filet fin qui relie la navigation, un bouton carré. Se cache au défilement.",
      S: ID("resto-04", "Maki Zen", { bg: "#f7f4ee", fg: "#1c1b1a", mute: "#5f5b55", alt: "#ebe6dc", accent: "#b3261e", onAccent: "#ffffff", line: "#d6d0c4", font: "font.zen-kaku-gothic-new", head: "font.zen-old-mincho", weight: "500", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        return [row(k, [
          cell([X.disc(k, { size: 14, color: S.accent }), mark(k, { size: clampPx(17, 24, 2), weight: "500", track: "0.14em" })], { gap: "14px" }),
          hide(line(k, { color: S.fg, st: { flexGrow: 1, flexBasis: "40px", minWidth: "30px", marginLeft: "12px", marginRight: "12px", opacity: 0.35 } }), ["mobile"]),
          nav(k, "thin", { size: "13.5px", weight: "400", track: "0.12em", gap: "34px" }),
          X.vrule(k, { h: 22, color: S.line, hideOn: ["mobile", "tablet"] }),
          btn(k, P.cta[0], P.cta[1], "solid", { size: "13px", caps: "uppercase", track: "0.2em", weight: "500", padV: "13px", padH: "28px" }),
        ], { pv: "28px", inn: { flexWrap: "nowrap", gap: "20px" }, innT: { gap: "14px" }, innM: { flexWrap: "wrap", gap: "12px" }, m: { paddingTop: "16px", paddingBottom: "16px" } })];
      },
      mode: "stickyhide", anim: "soft", hover: "", dark: false, tags: ["japonais", "sushi", "minimal", "filet", "se cache"],
      features: ["Pastille rouge et marque en mincho espacé", "Long filet fin entre la marque et la navigation (masqué sur mobile)", "Navigation fine, bouton Réserver carré rouge", "Se cache en descendant, réapparaît en remontant"],
      animations: ["fade-in"], settings: ["Couleurs", "Police", "Espacement de la rangée", "Animation d'entrée", "Comportement au défilement"],
    },

    // ── 05 · Boulangerie-pâtisserie artisanale : bandeau défilant + étiquette + cases arrondies ───────────────────────────────────────────
    {
      key: "resto-05", name: "Pain de Campagne", art: "Boulangerie artisanale", desc: "Un bandeau défilant d'annonces, puis une étiquette en tirets pour la marque et une navigation en cases arrondies façon vitrine.",
      S: ID("resto-05", "Pain de Campagne", { bg: "#fdf1e3", fg: "#4a2c17", mute: "#7a5238", alt: "#f6dcbb", accent: "#e0953f", onAccent: "#2a1608", line: "#e8c79b", font: "font.nunito-sans", head: "font.cherry-swash", weight: "700", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S;
        const tiles = X.navTiles(k, "pill", { w: 440, gap: "8px", border: S.line, bg: S.alt, padV: "9px", padH: "18px", size: "14px", weight: "700" });
        tiles.parts.link.styles.desktop.borderRadius = "999px";
        const label = g([mark(k, { size: clampPx(22, 36, 3), weight: "700" })], { backgroundColor: S.alt, borderStyle: "dashed", borderWidth: "2px", borderColor: S.accent, borderRadius: "26px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "30px", paddingRight: "30px", flexWrap: "nowrap", flexShrink: 0 }, undefined, { paddingLeft: "18px", paddingRight: "18px" });
        return [
          row(k, [X.ticker(k, ["Annonce du jour — à personnaliser", "Fournée ou spécialité — à personnaliser", "Commande ou horaires — à personnaliser"], { speed: "slow", bg: S.fg, color: S.bg, sep: "✦", size: "13px", weight: "700", padV: "8px" })], { bg: S.fg, pv: "0px", inn: { maxWidth: "100%" }, st: noPad, t: noPad, m: noPad }),
          row(k, [label, tiles, btn(k, P.cta[0], P.cta[1], "pill", { size: "15px", padV: "13px", padH: "28px", weight: "800" })], { pv: "20px", inn: { gap: "24px" }, innT: { gap: "16px" }, innM: { gap: "12px" }, st: { ...bottom(S.accent, "3px") } }),
        ];
      },
      mode: "sticky", anim: "rise", hover: "bob", dark: false, tags: ["boulangerie", "pâtisserie", "ticker", "étiquette", "deux niveaux"],
      features: ["Bandeau défilant d'annonces (pause au survol et au clavier, immobile si « réduire les animations »)", "Étiquette à bordure en tirets pour la marque", "Navigation en cases arrondies qui passent à la ligne", "Bouton pilule miel toujours visible"],
      animations: ["fade-in-up", "bob"], settings: ["Couleurs", "Police", "Textes et vitesse du bandeau", "Largeur des cases", "Animation d'entrée", "Survol du bouton"],
    },

    // ── 06 · Bar à vin / cave : carte de menu verticale à filets pointillés ──────────────────────────────────────────────────────────────
    {
      key: "resto-06", name: "La Carte des Vins", art: "Cave et bar à vin", desc: "Une carte verticale : navigation en liste à filets pointillés dans un cartouche, marque italique à gauche, horaires et réservation à droite.",
      S: ID("resto-06", "La Carte des Vins", { bg: "#2a0f17", fg: "#f3e6d8", mute: "#cfb0a6", alt: "#3a1722", accent: "#d8b06a", onAccent: "#2a0f17", line: "#7a4b55", font: "font.lato", head: "font.playfair-display", weight: "500", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const list = nav(k, "block", { vertical: true, size: "15px", weight: "400", color: S.fg, hover: S.accent, onHover: S.accent });
        list.parts.link = { styles: { desktop: { fontFamily: S.head, fontSize: "16px", fontWeight: "400", color: S.fg, paddingTop: "9px", paddingBottom: "9px", paddingLeft: "2px", paddingRight: "2px", borderStyle: "dotted", borderWidth: "0px", borderBottomWidth: "2px", borderColor: S.line } }, states: { hover: { color: S.accent, borderColor: S.accent }, focus: { color: S.accent, borderColor: S.accent } } };
        list.parts.list = { styles: { desktop: { gap: "0px" } } };
        const card = stack([list], { width: "260px", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, backgroundColor: S.alt, paddingTop: "8px", paddingBottom: "8px", paddingLeft: "22px", paddingRight: "22px", flexShrink: 0 }, { width: "100%" });
        const mobileNav = hide(nav(k, "plain", { size: "14px", weight: "400", caps: "uppercase", track: "0.14em" }), ["desktop"]);
        return [row(k, [
          stack([mark(k, { size: clampPx(24, 38, 3.4), italic: true, weight: "500", lh: 1.05 }), dotted(k, { color: S.accent, style: "solid", st: { width: "64px" } }), note(k, P.tagline, { size: "13px", color: S.mute, st: { maxWidth: "220px" } })], { gap: "12px", flexGrow: 1, flexBasis: "200px" }, undefined, { flexBasis: "auto", flexGrow: 1 }),
          hide(card, ["tablet", "mobile"]), mobileNav,
          stack([X.info(k, ["hours", "address"], { inline: false, color: S.fg, icon: S.accent, size: "13px", hideOn: ["mobile"] }), btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "0.18em", size: "12.5px", padV: "12px", padH: "26px", weight: "700", st: { alignSelf: "flex-end" } })], { gap: "14px", alignItems: "flex-end", flexGrow: 1, flexBasis: "200px" }, undefined, { flexBasis: "auto", alignItems: "flex-end" }),
        ], { pv: "22px", inn: { alignItems: "center", gap: "34px", flexWrap: "nowrap" }, innT: { gap: "20px", flexWrap: "wrap" }, innM: { flexWrap: "wrap", gap: "12px" }, st: { ...bottom(S.accent, "1px") }, m: { paddingTop: "16px", paddingBottom: "16px" } })];
      },
      mode: "static", anim: "soft", hover: "lift", dark: true, tags: ["cave", "bar à vin", "carte verticale", "filets pointillés", "bordeaux"],
      features: ["Carte de menu verticale : liens du menu affecté en liste à filets pointillés", "Marque italique, filet doré et accroche", "Horaires et adresse (consignes à remplacer) avec bouton Réserver", "Sur mobile : la carte est remplacée par un menu replié derrière un bouton"],
      animations: ["fade-in", "lift"], settings: ["Couleurs", "Police", "Largeur du cartouche", "Textes d'horaires et d'adresse", "Animation d'entrée", "Survol du bouton"],
    },

    // ── 07 · Brasserie / microbrasserie : bandeau d'horaires + onglets pleine hauteur ─────────────────────────────────────────────────────
    {
      key: "resto-07", name: "Brasserie Houblon", art: "Brasserie artisanale", desc: "Un bandeau ambre d'horaires, d'adresse et de téléphone au-dessus d'une barre charbon à onglets pleine hauteur et bouton carré.",
      S: ID("resto-07", "Brasserie Houblon", { bg: "#1e1b18", fg: "#f4ead8", mute: "#bdb19c", alt: "#2c2823", accent: "#e8a317", onAccent: "#1a1206", line: "#4a4238", font: "font.barlow", head: "font.alfa-slab-one", weight: "400", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const tabs = nav(k, "tab", { size: "14px", weight: "700", caps: "uppercase", track: "1.6px", gap: "0px", st: { alignSelf: "stretch" } });
        tabs.parts.link.styles.desktop = { ...tabs.parts.link.styles.desktop, paddingTop: "18px", paddingBottom: "18px", paddingLeft: "20px", paddingRight: "20px" };
        return [
          row(k, [X.info(k, ["hours", "address", "phone"], { inline: true, color: S.onAccent, icon: S.onAccent, size: "13px", gap: "28px" }), hide(note(k, P.notice, { color: S.onAccent, size: "12.5px", caps: "uppercase", track: "1.6px", st: { textAlign: "center", fontWeight: "700" } }), ["desktop", "tablet"])], { bg: S.accent, fg: S.onAccent, pv: "8px", j: "center", inn: { justifyContent: "center" } }),
          row(k, [mark(k, { size: clampPx(20, 30, 2.6), color: S.accent, weight: "400", st: { paddingTop: "14px", paddingBottom: "14px" } }), tabs,
            btn(k, P.cta[0], P.cta[1], "solid", { size: "14px", caps: "uppercase", track: "1.8px", padV: "15px", padH: "30px", weight: "800" })], { pv: "12px", inn: { alignItems: "stretch", gap: "26px", flexWrap: "nowrap" }, innT: { gap: "16px" }, innM: { alignItems: "center", flexWrap: "wrap", gap: "10px" }, st: { ...bottom(S.line, "1px") }, m: { paddingTop: "10px", paddingBottom: "10px" } }),
        ];
      },
      mode: "stickyshrink", anim: "slide", hover: "push", dark: true, tags: ["brasserie", "bandeau d'horaires", "onglets", "ambre", "charbon"],
      features: ["Bandeau d'horaires, adresse et téléphone (consignes à remplacer, remplacé par le message sur mobile)", "Navigation en onglets pleine hauteur, liseré ambre au survol", "Bouton Réserver carré ambre", "Se réduit au défilement"],
      animations: ["slide-in-left", "push"], settings: ["Couleurs", "Police", "Informations du bandeau", "Style des onglets", "Animation d'entrée", "Réduction au défilement"],
    },

    // ── 08 · Hôtel de charme : marque centrée + capsule de réservation ──────────────────────────────────────────────────────────────────
    {
      key: "resto-08", name: "Maison de Charme", art: "Hôtel de charme", desc: "Marque centrée entre deux filets, puis une longue capsule qui contient la navigation fine et le bouton de réservation.",
      S: ID("resto-08", "Maison de Charme", { bg: "#f3efe6", fg: "#2f3a30", mute: "#5d6a5c", alt: "#e6e0d0", accent: "#5b6f4f", onAccent: "#ffffff", line: "#cfc7b3", font: "font.mulish", head: "font.bellefair", weight: "400", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S;
        const capsule = g([nav(k, "thin", { size: "14px", weight: "500", caps: "uppercase", track: "0.16em", gap: "30px", st: { flexGrow: 1 } }), X.vrule(k, { h: 24, color: S.line, hideOn: ["mobile"] }), btn(k, P.cta[0], P.cta[1], "pill", { size: "13px", caps: "uppercase", track: "0.16em", padV: "13px", padH: "30px", weight: "700" })],
          { width: "100%", maxWidth: "880px", flexWrap: "nowrap", justifyContent: "space-between", gap: "22px", backgroundColor: S.alt, borderRadius: "999px", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, paddingTop: "7px", paddingBottom: "7px", paddingLeft: "34px", paddingRight: "8px" },
          { paddingLeft: "26px" }, { borderRadius: "30px", paddingLeft: "18px", gap: "10px" });
        return [
          row(k, [stack([hide(note(k, P.tagline, { size: "11.5px", caps: "uppercase", track: "0.3em", color: S.mute, st: { textAlign: "center" } }), ["mobile"]), g([hide(line(k, { color: S.accent, st: { width: "70px" } }), ["mobile"]), mark(k, { size: clampPx(28, 46, 4), weight: "400", italic: true, st: { textAlign: "center" } }), hide(line(k, { color: S.accent, st: { width: "70px" } }), ["mobile"])], { flexWrap: "nowrap", gap: "24px", justifyContent: "center" })], { alignItems: "center", gap: "8px", width: "100%" })], { pv: "22px", j: "center", inn: { justifyContent: "center" }, m: { paddingTop: "14px", paddingBottom: "6px" } }),
          row(k, [mv(capsule, "fade-in-up", 260, 700)], { pv: "0px", j: "center", inn: { justifyContent: "center", paddingBottom: "20px" }, innM: { paddingBottom: "14px" } }),
        ];
      },
      mode: "sticky", anim: "reveal", hover: "grow", dark: false, tags: ["hôtel", "charme", "capsule", "réservation", "centré"],
      features: ["Marque italique centrée entre deux filets, accroche en petites capitales", "Capsule de réservation : navigation fine + bouton pilule", "Bouton Réserver toujours dans la capsule", "Capsule resserrée et menu replié sur mobile"],
      animations: ["reveal", "fade-in-up", "grow"], settings: ["Couleurs", "Police", "Largeur de la capsule", "Accroche", "Animation d'entrée", "Survol du bouton"],
    },

    // ── 09 · Resort / hôtel luxe : superposé, titre monumental ───────────────────────────────────────────────────────────────────────────
    {
      key: "resto-09", name: "Grand Resort", art: "Resort superposé", desc: "Superposé au visuel d'ouverture : barre d'informations, titre monumental centré, filet, navigation fine centrée et bouton Réserver en verre.",
      S: ID("resto-09", "Grand Resort", { bg: "#0e2a2f", fg: "#ffffff", mute: "#c4d8d6", alt: "#163b41", accent: "#e9d3a1", onAccent: "#0e2a2f", line: "#3b6a6d", font: "font.jost", head: "font.bodoni-moda", weight: "400", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S, glass = { backgroundColor: "#ffffff1f", backdropBlur: 14 };
        const T = { bg: "transparent", fg: "#ffffff" };
        return [
          row(k, [X.info(k, ["hours", "address"], { inline: true, color: "#ffffff", icon: S.accent, size: "12.5px", gap: "26px" }), btn(k, P.cta[0], P.cta[1], "outline", { fg: "#ffffff", border: "#ffffffb3", st: glass, caps: "uppercase", track: "0.22em", size: "12px", padV: "11px", padH: "26px", weight: "600" })],
            { ...T, pv: "18px", inn: { gap: "16px" }, innM: { justifyContent: "flex-end" }, m: { paddingTop: "12px", paddingBottom: "6px" } }),
          row(k, [mv(X.monument(k, { min: 32, max: 78, caps: "uppercase", track: "0.22em", weight: "400", color: "#ffffff", lh: 1, st: { textAlign: "center" } }), "reveal", 0, 900)], { ...T, pv: "6px", j: "center", inn: { justifyContent: "center" } }),
          row(k, [nav(k, "thin", { size: "13px", weight: "400", caps: "uppercase", track: "0.24em", gap: "40px", color: "#ffffff", hover: S.accent, st: { margin: "0 auto" } })], { ...T, pv: "16px", j: "center", inn: { justifyContent: "center", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff55", paddingTop: "16px" }, m: { paddingBottom: "10px" } }),
        ];
      },
      mode: "overlaysolid", anim: "reveal", hover: "lift", dark: true, tags: ["resort", "superposé", "monumental", "verre", "hôtel de luxe"],
      features: ["Superposé au visuel d'ouverture, devient plein au défilement", "Titre du site monumental à taille fluide", "Navigation fine centrée sous un filet translucide", "Bouton Réserver en verre dépoli, horaires et adresse en consignes"],
      animations: ["reveal", "fade-in", "lift"], settings: ["Couleurs", "Police", "Taille du titre", "Informations de la barre", "Animation d'entrée", "Comportement au défilement"],
    },

    // ── 10 · Traiteur / food truck : ticker rapide, dalle inclinée à cadre épais ────────────────────────────────────────────────────────
    {
      key: "resto-10", name: "Camion Soleil", art: "Traiteur et food truck", desc: "Un ticker rapide noir, une dalle inclinée à cadre épais pour la marque, des cases à contour noir et un gros bouton noir.",
      S: ID("resto-10", "Camion Soleil", { bg: "#ffd23f", fg: "#1a1410", mute: "#4a3a12", alt: "#ffe58a", accent: "#d7261e", onAccent: "#ffffff", line: "#1a1410", font: "font.work-sans", head: "font.lilita-one", weight: "400", btnRadius: "0px" }),
      build: (k, P) => {
        const S = k.S;
        const slab = g([mark(k, { size: clampPx(20, 32, 2.8), color: S.onAccent, weight: "400", caps: "uppercase", track: "0.04em", st: { transform: { skewX: 8 }, whiteSpace: "nowrap" } })], { backgroundColor: S.accent, borderStyle: "solid", borderWidth: "4px", borderColor: S.fg, transform: { skewX: -8 }, paddingTop: "8px", paddingBottom: "8px", paddingLeft: "24px", paddingRight: "24px", flexWrap: "nowrap", flexShrink: 0 }, undefined, { paddingLeft: "14px", paddingRight: "14px" });
        const boxes = nav(k, "box", { size: "14px", weight: "800", caps: "uppercase", track: "0.8px", gap: "8px", st: { flexGrow: 1 } });
        boxes.parts.link.styles.desktop = { ...boxes.parts.link.styles.desktop, borderWidth: "3px", borderColor: S.fg, backgroundColor: S.alt };
        boxes.parts.link.states = { hover: { backgroundColor: S.fg, color: S.bg }, focus: { backgroundColor: S.fg, color: S.bg } };
        return [
          row(k, [X.ticker(k, ["Où nous trouver — à personnaliser", "Horaires du jour — à personnaliser", "Commandes à emporter — à personnaliser"], { speed: "fast", bg: S.fg, color: S.bg, sep: "★", size: "13px", weight: "800", caps: "uppercase", track: "1.4px", padV: "7px" })], { bg: S.fg, pv: "0px", inn: { maxWidth: "100%" }, st: noPad, t: noPad, m: noPad }),
          row(k, [mv(slab, "zoom-in", 0, 600), X.slash(k, { w: 14, h: 44, angle: -20, color: S.fg, hideOn: ["mobile", "tablet"] }), X.slash(k, { w: 14, h: 44, angle: -20, color: S.accent, hideOn: ["mobile", "tablet"] }), boxes, btn(k, P.cta[0], P.cta[1], "solid", { bg: S.fg, fg: S.bg, size: "16px", caps: "uppercase", track: "1.2px", padV: "15px", padH: "30px", weight: "800" })], { pv: "16px", inn: { gap: "24px", flexWrap: "nowrap" }, innT: { gap: "14px" }, innM: { flexWrap: "wrap", gap: "10px" }, st: { ...bottom(S.fg, "5px") } }),
        ];
      },
      mode: "sticky", anim: "zoom", hover: "bounce", dark: false, tags: ["food truck", "traiteur", "ticker", "dalle inclinée", "jaune"],
      features: ["Ticker rapide d'annonces (emplacement, horaires du jour : consignes à remplacer)", "Dalle rouge inclinée à cadre épais pour la marque", "Navigation en cases à contour noir qui s'inversent au survol", "Gros bouton noir Réserver, menu replié sur mobile"],
      animations: ["zoom-in", "bounce"], settings: ["Couleurs", "Police", "Textes et vitesse du ticker", "Inclinaison de la dalle", "Animation d'entrée", "Survol du bouton"],
    },
  ],
};
