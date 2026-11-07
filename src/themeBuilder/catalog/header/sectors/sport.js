// Secteur « sport » de la bibliothèque d'en-têtes : 10 compositions écrites sur mesure (contrat : docs/theme-builder/HEADER_SECTOR_CONTRACT.md).
// Zone visuelle : énergie, contrastes durs, typographies condensées, angles, bandeaux diagonaux, boutons d'action très visibles.
//
// MATRICE DE CONCEPTION (même contenu : docs/theme-builder/headers-secteurs/sport.md)
// 01 Brut Béton    · brutalisme moderne   · 3 cases à filets de 4 px (marque / navigation en cases / grand bloc d'action), béton + orange signal · Archivo Black + Space Mono · cases bordées · slide · push
// 02 Volt Rush     · sportif dynamique    · asymétrique : bloc de marque lime prolongé de bandeaux diagonaux, navigation à droite, bouton incliné · Big Shoulders + Barlow Condensed · soulignée · slide · grow
// 03 Ligue Un      · compétition / ligue  · 3 rangées : ticker de résultats (consignes), marque centrée entre deux barres inclinées, onglets pleine largeur · Oswald + Titillium Web · onglets · rise · pop
// 04 Foulée        · marque de running    · capsule sombre flottante sur fond clair (marque, liens fins, pilule corail) · League Spartan + Manrope · fine · soft · lift
// 05 Box 24        · CrossFit / box       · marque monumentale à gauche, infos pratiques + navigation en blocs à droite, ruban de sécurité en bas · Anton + Roboto Condensed · blocs · reveal · push
// 06 Dojo Kata     · arts martiaux        · filet vertical rouge + disque (hanko), marque et accroche, DEUX boutons empilés (plein + contour), bande de navigation centrée dessous · Sofia Sans Extra Condensed + Work Sans · soulignée · zoom · pulse
// 07 Peloton       · cyclisme             · liseré dégradé, marque centrée entre deux roues (anneaux), bande jaune pleine largeur à liens répartis · Kanit italique + DM Sans · soulignée · rise · lift
// 08 Coach Pilote  · coach en ligne       · bandeau d'annonce fin, pastille dégradée + marque + navigation en pilules groupées à gauche, compte + bouton à droite · Sora + DM Sans · pilules · slide · grow
// 09 Sentier Nord  · outdoor / trail      · pic (deux bandeaux opposés) + marque et accroche, informations pratiques, bouton ; bande forêt de navigation + date · Saira Condensed + Work Sans · soulignée · rise · lift
// 10 Club Néon     · club / salle         · barre fine de navigation mono en haut, puis marque géante + compteur d'inscriptions (consigne) + bouton, filet néon · League Gothic + Space Grotesk · mono · zoom · bounce
// Responsive : grilles à 1 colonne sur mobile, navigation repliée (burger), infos / réseaux / date masqués sur mobile, boutons gardés. Mouvement : entrées natives (désactivées en « réduire les animations »).
const { ID, mark, nav, btn, account, social, date, note, tag, g, stack, grid, band, inner, mv } = require("../blocks");
const X = require("../blocks2");

const U = (s) => ({ caps: "uppercase", ...s });
const upd = (node, patch, bp = "desktop") => { const st = node.styles || { desktop: {} }; return { ...node, styles: { ...st, [bp]: { ...(st[bp] || {}), ...patch } } }; };
const soft = (n) => mv(n, "fade-in", 220, 500);
const noPad = { paddingLeft: "0px", paddingRight: "0px" };
const rule = (c, w = "4px") => ({ borderStyle: "solid", borderWidth: "0px", borderBottomWidth: w, borderColor: c });

module.exports = {
  sector: "sport",
  models: [
    // ── 01 · Brut Béton ─────────────────────────────────────────────────────────────
    {
      key: "sport-01", name: "Brut Béton", art: "Brutalisme moderne", desc: "Trois grandes cases séparées par des filets de 4 px : marque, navigation en cases, bloc d'action orange.",
      S: ID("sport-01", "Brut Béton", { bg: "#e9e6dc", fg: "#0a0a0a", mute: "#4a4a44", alt: "#ffffff", accent: "#ff4a1c", onAccent: "#0a0a0a", line: "#0a0a0a", font: "font.space-mono", head: "font.archivo-black", weight: "400" }),
      build: (k, P) => {
        const S = k.S, cell = { paddingTop: "18px", paddingBottom: "18px", paddingLeft: "28px", paddingRight: "28px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "4px", borderColor: S.fg, alignSelf: "stretch", flexWrap: "nowrap" };
        const mcell = { borderRightWidth: "0px", borderBottomWidth: "4px", paddingLeft: "16px", paddingRight: "16px" };
        return [band(S, [grid("auto 1fr auto", [
          g([mark(k, U({ size: "34px", track: "-1px" }))], cell, undefined, mcell),
          g([X.navTiles(k, "block", { w: 560, gap: "6px", border: S.fg, bg: S.alt, size: "13px", caps: "uppercase", track: "1px", weight: "700" })], { ...cell, justifyContent: "flex-start" }, undefined, mcell),
          g([soft(btn(k, `${P.cta[0]} →`, P.cta[1], "ghost", { fg: S.fg, size: "18px", caps: "uppercase", track: "1px", font: S.head, weight: "400", padV: "22px", padH: "30px" }))], { backgroundColor: S.accent, alignSelf: "stretch", justifyContent: "center" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })],
        { ...noPad, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderBottomWidth: "4px", borderColor: S.fg }, noPad, noPad)];
      },
      mode: "sticky", anim: "slide", hover: "push", dark: false, tags: ["brutalisme", "cases", "béton", "salle"],
      features: ["Trois cases à filets épais de 4 px", "Navigation en cases bordées qui passent à la ligne", "Grand bloc d'action orange pleine hauteur", "Rangée collante"],
      animations: ["slide-in-left", "fade-in", "push"], settings: ["Couleurs", "Polices", "Épaisseur des filets", "Texte du bouton", "Animation d'entrée", "Survol du bouton"],
    },
    // ── 02 · Volt Rush ──────────────────────────────────────────────────────────────
    {
      key: "sport-02", name: "Volt Rush", art: "Sportif dynamique", desc: "Bloc de marque lime prolongé de bandeaux diagonaux, navigation condensée à droite, bouton incliné.",
      S: ID("sport-02", "Volt Rush", { bg: "#0b0b10", fg: "#ffffff", mute: "#b9bcc8", alt: "#16161f", accent: "#d4ff00", onAccent: "#0b0b10", line: "#2a2a38", font: "font.barlow-condensed", head: "font.big-shoulders", weight: "900" }),
      build: (k, P) => {
        const S = k.S, sl = (color, w, mg) => upd(upd(X.slash(k, { w, h: 60, angle: -22, color }), { height: "auto", minHeight: "64px", alignSelf: "stretch", marginLeft: mg }), {}, "desktop");
        return [band(S, [grid("auto 1fr auto", [
          g([X.slab(k, [mark(k, U({ size: "38px", italic: true, track: "1px", color: S.onAccent }))], { bg: S.accent, fg: S.onAccent, padV: "16px", padH: "30px", st: { alignSelf: "stretch" } }), sl(S.accent, 34, "-18px"), sl("#ffffff", 8, "6px"), sl(S.accent, 8, "6px")], { gap: "0px", flexWrap: "nowrap", alignSelf: "stretch", alignItems: "stretch" }),
          g([nav(k, "underline", { size: "19px", weight: "700", caps: "uppercase", track: "1.2px", gap: "30px" })], { justifyContent: "flex-end", paddingRight: "12px" }),
          g([soft(account(k, { size: "15px" })), soft(upd(btn(k, P.cta[0], P.cta[1], "solid", { size: "17px", caps: "uppercase", track: "1px", font: S.head, weight: "900", padV: "14px", padH: "30px" }), { transform: { skewX: -14 } }))], { gap: "22px", paddingRight: "28px", flexWrap: "nowrap" }),
        ], { width: "100%", gap: "0px", alignItems: "stretch" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], noPad, noPad, noPad)];
      },
      mode: "stickyshrink", anim: "slide", hover: "grow", dark: true, tags: ["dynamique", "diagonale", "lime", "asymétrique"],
      features: ["Bloc de marque lime avec trois bandeaux diagonaux", "Bouton d'action incliné", "Rangée qui se réduit au défilement", "Navigation soulignée en majuscules condensées"],
      animations: ["slide-in-left", "fade-in", "grow"], settings: ["Couleurs", "Polices", "Angle des bandeaux", "Texte du bouton", "Effet au défilement", "Animation d'entrée"],
    },
    // ── 03 · Ligue Un ───────────────────────────────────────────────────────────────
    {
      key: "sport-03", name: "Ligue Un", art: "Compétition et ligue", desc: "Ticker de résultats en tête, marque centrée entre deux barres inclinées, onglets pleine largeur.",
      S: ID("sport-03", "Ligue Un", { bg: "#0c1b3a", fg: "#ffffff", mute: "#b8c4e0", alt: "#13295a", accent: "#ffc20e", onAccent: "#0c1b3a", line: "#2a427a", font: "font.titillium-web", head: "font.oswald", weight: "700" }),
      build: (k, P) => {
        const S = k.S, bar = (c) => X.slash(k, { w: 12, h: 34, angle: -22, color: c });
        return [
          X.ticker(k, ["Dernier résultat — à remplacer", "Prochain match — à remplacer", "Classement de la ligue — à remplacer"], { bg: S.accent, color: S.onAccent, caps: "uppercase", track: "1.5px", weight: "700", sep: "◆", size: "13px" }),
          band(S, [grid("1fr auto 1fr", [
            g([date(k, { before: "" }), social(k, { size: 26, n: 2 })], { justifyContent: "flex-start", gap: "18px" }),
            g([bar(S.accent), bar(S.accent), mark(k, U({ size: "40px", track: "2px" })), bar(S.accent), bar(S.accent)], { flexWrap: "nowrap", gap: "8px", justifyContent: "center" }),
            g([account(k, { size: "14px" }), btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1.2px", font: S.head, size: "15px" })], { justifyContent: "flex-end", gap: "18px" }),
          ], { width: "100%", gap: "24px", paddingTop: "14px", paddingBottom: "14px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })]),
          band({ ...S, bg: S.alt }, [g([nav(k, "tab", { size: "15px", weight: "700", caps: "uppercase", track: "1.6px", gap: "6px" })], { width: "100%", justifyContent: "center" })], { backgroundColor: S.alt }),
        ];
      },
      mode: "sticky", anim: "rise", hover: "pop", dark: true, tags: ["ligue", "ticker", "résultats", "onglets"],
      features: ["Ticker de résultats défilant (textes à remplacer)", "Marque centrée entre quatre barres inclinées", "Onglets pleine largeur à liseré d'accent", "Date du jour et réseaux sociaux"],
      animations: ["fade-in-up", "pop"], settings: ["Couleurs", "Polices", "Textes du ticker", "Vitesse du ticker", "Texte du bouton", "Survol du bouton"],
    },
    // ── 04 · Foulée ─────────────────────────────────────────────────────────────────
    {
      key: "sport-04", name: "Foulée", art: "Marque de running", desc: "Capsule sombre flottante sur fond clair : marque, liens fins et pilule corail.",
      S: ID("sport-04", "Foulée", { bg: "#f3efe7", fg: "#101828", mute: "#4b5565", alt: "#101828", accent: "#ff5a3c", onAccent: "#101828", line: "#d9d3c5", font: "font.manrope", head: "font.league-spartan", weight: "800", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S, W = "#ffffff";
        return [band(S, [inner([
          g([X.disc(k, { size: 14 }), mark(k, { size: "24px", italic: true, color: W, caps: "uppercase", track: "1px" })], { flexWrap: "nowrap", gap: "10px", paddingLeft: "14px" }),
          g([nav(k, "thin", { color: W, hover: S.accent, size: "15px", weight: "500", gap: "28px" })], { justifyContent: "center", flexGrow: 1 }),
          btn(k, P.cta[0], P.cta[1], "pill", { size: "14px", padH: "24px" }),
        ], { backgroundColor: S.alt, color: W, borderRadius: "999px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "10px", maxWidth: "1080px", flexWrap: "nowrap" }, { borderRadius: "36px", flexWrap: "wrap" }, { borderRadius: "28px" })],
        { paddingTop: "14px", paddingBottom: "14px" })];
      },
      mode: "sticky", anim: "soft", hover: "lift", dark: false, tags: ["running", "capsule", "flottant", "minimal"],
      features: ["Capsule sombre flottante arrondie", "Navigation fine et aérée au centre", "Bouton pilule corail", "Rangée collante"],
      animations: ["fade-in", "lift"], settings: ["Couleurs", "Polices", "Arrondi de la capsule", "Texte du bouton", "Animation d'entrée"],
    },
    // ── 05 · Box 24 ─────────────────────────────────────────────────────────────────
    {
      key: "sport-05", name: "Box 24", art: "CrossFit et box", desc: "Marque monumentale à gauche, informations pratiques et navigation en blocs à droite, ruban de sécurité en bas.",
      S: ID("sport-05", "Box 24", { bg: "#111111", fg: "#f5f5f5", mute: "#b5b5b5", alt: "#1c1c1c", accent: "#ffb800", onAccent: "#111111", line: "#3a3a3a", font: "font.roboto-condensed", head: "font.anton", weight: "400" }),
      build: (k, P) => {
        const S = k.S, hz = Array.from({ length: 42 }, (_, i) => X.slash(k, { w: 14, h: 14, angle: -45, color: i % 2 ? "#111111" : S.accent }));
        return [
          band(S, [grid("auto 1fr", [
            g([X.monument(k, { min: 56, max: 120, caps: "uppercase", track: "-1px", lh: 0.88, color: S.fg })], { paddingTop: "14px", paddingBottom: "14px", paddingRight: "30px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "6px", borderColor: S.accent, flexWrap: "nowrap" }, undefined, { borderRightWidth: "0px", paddingRight: "0px" }),
            stack([
              g([X.info(k, ["hours", "phone"], { size: "13px", gap: "22px" }), btn(k, `${P.cta[0]} →`, P.cta[1], "solid", { caps: "uppercase", track: "1px", size: "15px", font: S.head, weight: "400", padH: "26px" })], { justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }),
              nav(k, "block", { size: "16px", weight: "700", caps: "uppercase", track: "1.2px" }),
            ], { gap: "4px", paddingLeft: "26px" }, { paddingLeft: "0px" }),
          ], { width: "100%", gap: "0px", alignItems: "center" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })], { paddingTop: "4px" }),
          { type: "container", props: { full: true }, children: hz, styles: { desktop: { display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "14px", overflow: "hidden", width: "100%", paddingLeft: "6px", backgroundColor: "#111111", paddingTop: "0px", paddingBottom: "0px" } } },
        ];
      },
      mode: "stickyhide", anim: "reveal", hover: "push", dark: true, tags: ["crossfit", "monumental", "ruban", "box"],
      features: ["Nom monumental à taille fluide", "Infos pratiques à remplacer (horaires, téléphone)", "Navigation en blocs à survol jaune", "Ruban diagonal de sécurité", "Se masque en descendant, revient en remontant"],
      animations: ["reveal", "push"], settings: ["Couleurs", "Polices", "Taille du nom", "Texte du bouton", "Effet au défilement", "Animation d'entrée"],
    },
    // ── 06 · Dojo Kata ──────────────────────────────────────────────────────────────
    {
      key: "sport-06", name: "Dojo Kata", art: "Arts martiaux", desc: "Filet rouge vertical et disque, marque et accroche, deux boutons empilés, bande de navigation centrée dessous.",
      S: ID("sport-06", "Dojo Kata", { bg: "#14100e", fg: "#f2ece2", mute: "#b9ada0", alt: "#221a16", accent: "#d4202a", onAccent: "#ffffff", line: "#3a2e28", font: "font.work-sans", head: "font.sofia-sans-extra-condensed", weight: "800" }),
      build: (k, P) => {
        const S = k.S;
        return [band(S, [grid("1fr auto", [
          g([X.vrule(k, { w: "10px", h: 96, color: S.accent }), X.disc(k, { size: 72 }), stack([mark(k, U({ size: "56px", track: "4px" })), note(k, P.tagline, { size: "11px", caps: "uppercase", track: "2px" })], { gap: "2px" })], { flexWrap: "nowrap", gap: "16px" }),
          stack([btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1.5px", size: "14px", padV: "10px", padH: "26px" }), btn(k, "Se connecter", "/connexion", "outline", { caps: "uppercase", track: "1.5px", size: "13px", padV: "8px", padH: "26px", fg: S.fg })], { gap: "8px", alignItems: "stretch" }),
        ], { width: "100%", gap: "28px", paddingTop: "14px", paddingBottom: "10px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })]),
          band({ ...S, bg: S.alt }, [g([nav(k, "underline", { size: "17px", weight: "600", caps: "uppercase", track: "3px", gap: "40px" })], { width: "100%", justifyContent: "center" })], { backgroundColor: S.alt, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line }),
          X.stripe(k, { h: 8, gradient: { from: S.accent, to: "#7a0f16", angle: 90 } })];
      },
      mode: "sticky", anim: "zoom", hover: "pulse", dark: true, tags: ["arts martiaux", "dojo", "double action", "rouge"],
      features: ["Filet vertical rouge et disque (hanko)", "Accroche sous la marque (texte à remplacer)", "Deux boutons empilés : plein et contour", "Navigation centrée soulignée"],
      animations: ["zoom-in", "pulse"], settings: ["Couleurs", "Polices", "Accroche", "Textes des deux boutons", "Survol", "Animation d'entrée"],
    },
    // ── 07 · Peloton ────────────────────────────────────────────────────────────────
    {
      key: "sport-07", name: "Peloton", art: "Cyclisme", desc: "Liseré dégradé, marque entre deux roues, bande jaune pleine largeur à liens répartis.",
      S: ID("sport-07", "Peloton", { bg: "#ffffff", fg: "#0a2540", mute: "#4a5b70", alt: "#ffd60a", accent: "#0a2540", onAccent: "#ffffff", line: "#d5dbe3", font: "font.dm-sans", head: "font.kanit", weight: "800", btnRadius: "4px" }),
      build: (k, P) => {
        const S = k.S, nv = nav(k, "underline", { size: "16px", weight: "700", caps: "uppercase", track: "1.4px", st: { width: "100%" } });
        nv.parts = { ...nv.parts, list: { styles: { desktop: { display: "flex", justifyContent: "space-between", gap: "12px", width: "100%" } } } };
        return [
          X.stripe(k, { h: 8, gradient: { from: "#ffd60a", to: S.fg, angle: 90 } }),
          band(S, [grid("1fr auto 1fr", [
            X.info(k, ["hours"], { size: "13px", icon: S.fg }),
            g([X.ring(k, { size: 38, w: "5px", color: S.fg }), X.ring(k, { size: 38, w: "5px", color: "#ffd60a", opacity: undefined }), mark(k, U({ size: "44px", italic: true, track: "1px" })), X.ring(k, { size: 38, w: "5px", color: "#ffd60a" }), X.ring(k, { size: 38, w: "5px", color: S.fg })], { flexWrap: "nowrap", gap: "8px", justifyContent: "center" }),
            g([account(k), btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1px", font: S.head, size: "14px" })], { justifyContent: "flex-end", gap: "18px" }),
          ], { width: "100%", gap: "24px", paddingTop: "14px", paddingBottom: "14px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })]),
          band({ ...S, bg: S.alt }, [inner([nv], { justifyContent: "stretch" })], { backgroundColor: S.alt, paddingTop: "4px", paddingBottom: "4px" }),
        ];
      },
      mode: "stickyshrink", anim: "rise", hover: "lift", dark: false, tags: ["cyclisme", "roues", "bande jaune", "centré"],
      features: ["Liseré dégradé en tête", "Marque entre deux paires de roues", "Bande jaune pleine largeur, liens répartis", "Horaires à remplacer"],
      animations: ["fade-in-up", "lift"], settings: ["Couleurs", "Polices", "Texte du bouton", "Effet au défilement", "Animation d'entrée"],
    },
    // ── 08 · Coach Pilote ───────────────────────────────────────────────────────────
    {
      key: "sport-08", name: "Coach Pilote", art: "Coach en ligne", desc: "Annonce fine, pastille dégradée et navigation en pilules à gauche, compte et bouton menthe à droite.",
      S: ID("sport-08", "Coach Pilote", { bg: "#120a2a", fg: "#ffffff", mute: "#c3b8e6", alt: "#201346", accent: "#2ee6a6", onAccent: "#120a2a", line: "#3a2a6b", font: "font.dm-sans", head: "font.sora", weight: "700", btnRadius: "999px" }),
      build: (k, P) => {
        const S = k.S;
        return [
          band({ ...S, bg: S.alt }, [g([tag(k, "Nouveau"), note(k, P.notice, { size: "12.5px", color: S.fg })], { justifyContent: "center", gap: "10px" })], { backgroundColor: S.alt, paddingTop: "7px", paddingBottom: "7px" }),
          X.stripe(k, { h: 3, gradient: { from: S.accent, to: "#7c3aed", angle: 90 } }),
          band(S, [inner([
            g([X.disc(k, { size: 38, gradient: { from: "#7c3aed", to: S.accent, angle: 135 } }), mark(k, { size: "22px", track: "-0.5px" }), g([nav(k, "pill", { size: "14.5px", weight: "600", hover: S.accent, onHover: S.onAccent })], { backgroundColor: S.alt, borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "8px", paddingRight: "8px", borderStyle: "solid", borderWidth: "1px", borderColor: S.line })], { flexWrap: "nowrap", gap: "22px" }),
            g([soft(account(k, { size: "14px" })), soft(btn(k, P.cta[0], P.cta[1], "pill", { size: "14px", padH: "24px" }))], { gap: "18px" }),
          ], { paddingTop: "20px", paddingBottom: "20px" })]),
        ];
      },
      mode: "glass", anim: "slide", hover: "grow", dark: true, tags: ["coach", "en ligne", "pilules", "application"],
      features: ["Bandeau d'annonce à personnaliser", "Pastille de marque en dégradé", "Navigation en pilules groupée avec la marque", "Compte et bouton pilule menthe", "Verre dépoli au défilement"],
      animations: ["slide-in-left", "fade-in", "grow"], settings: ["Couleurs", "Polices", "Annonce", "Texte du bouton", "Animation d'entrée", "Survol"],
    },
    // ── 09 · Sentier Nord ───────────────────────────────────────────────────────────
    {
      key: "sport-09", name: "Sentier Nord", art: "Outdoor et trail", desc: "Pic stylisé, marque et accroche, informations pratiques ; bande forêt de navigation avec réseaux.",
      S: ID("sport-09", "Sentier Nord", { bg: "#f2efe6", fg: "#1d2b1f", mute: "#4d5b4f", alt: "#1f4d34", accent: "#e07a1f", onAccent: "#1d2b1f", line: "#cfc9b8", font: "font.work-sans", head: "font.saira-condensed", weight: "800" }),
      build: (k, P) => {
        const S = k.S, C = "#f2efe6";
        return [
          band(S, [grid("auto 1fr auto", [
            g([g([X.slash(k, { w: 14, h: 40, angle: 28, color: S.alt }), X.slash(k, { w: 14, h: 40, angle: -28, color: S.accent })], { gap: "0px", flexWrap: "nowrap" }), stack([mark(k, U({ size: "38px", track: "1px" })), note(k, P.tagline, { size: "11.5px", caps: "uppercase", track: "1.6px" })], { gap: "2px" })], { flexWrap: "nowrap", gap: "14px" }),
            g([X.info(k, ["hours", "address"], { size: "13px", gap: "22px" })], { justifyContent: "center" }),
            g([btn(k, P.cta[0], P.cta[1], "solid", { caps: "uppercase", track: "1px", size: "14px" })], { justifyContent: "flex-end" }),
          ], { width: "100%", gap: "24px", paddingTop: "16px", paddingBottom: "14px" }, { gridTemplate: "1fr" }, { gridTemplate: "1fr" })]),
          band({ ...S, bg: S.alt }, [inner([nav(k, "underline", { color: C, hover: "#f5a65b", size: "15px", weight: "600", caps: "uppercase", track: "1.4px" }), date(k, { color: C })], { paddingTop: "4px", paddingBottom: "4px" })], { backgroundColor: S.alt }),
        ];
      },
      mode: "sticky", anim: "rise", hover: "lift", dark: false, tags: ["outdoor", "trail", "montagne", "forêt"],
      features: ["Pic stylisé en deux bandeaux opposés", "Accroche sous la marque (à remplacer)", "Horaires et adresse à remplacer", "Bande forêt : navigation et date"],
      animations: ["fade-in-up", "lift"], settings: ["Couleurs", "Polices", "Accroche", "Texte du bouton", "Animation d'entrée"],
    },
    // ── 10 · Club Néon ──────────────────────────────────────────────────────────────
    {
      key: "sport-10", name: "Club Néon", art: "Club et salle de sport", desc: "Barre fine de navigation mono, marque géante, compteur d'inscriptions à renseigner et bouton néon.",
      S: ID("sport-10", "Club Néon", { bg: "#0a0a0a", fg: "#ffffff", mute: "#b3b3b3", alt: "#161616", accent: "#00e5ff", onAccent: "#001418", line: "#2b2b2b", font: "font.space-grotesk", head: "font.league-gothic", weight: "400" }),
      build: (k, P) => {
        const S = k.S;
        return [
          band({ ...S, bg: S.alt }, [inner([nav(k, "mono", { size: "12.5px", weight: "500", caps: "uppercase", track: "2px", gap: "24px" }), g([account(k, { size: "12.5px" })], { gap: "16px" })], { paddingTop: "8px", paddingBottom: "8px" })], { backgroundColor: S.alt }),
          band(S, [grid("1fr auto auto", [
            X.monument(k, { min: 64, max: 190, caps: "uppercase", track: "1px", lh: 0.85, color: S.fg }),
            stack([note(k, "Adhérents inscrits — à renseigner", { size: "11px", caps: "uppercase", track: "1.5px" }), note(k, "000", { size: "64px", color: S.accent, font: S.head, st: { lineHeight: 0.9 } })], { gap: "2px", paddingLeft: "26px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "2px", borderColor: S.line }, { borderLeftWidth: "0px", paddingLeft: "0px" }),
            btn(k, `${P.cta[0]} →`, P.cta[1], "solid", { caps: "uppercase", track: "1.5px", size: "18px", font: S.head, weight: "400", padV: "20px", padH: "32px" }),
          ], { width: "100%", gap: "28px", paddingTop: "14px", paddingBottom: "14px" }, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" })]),
          X.stripe(k, { h: 4, gradient: { from: S.accent, to: "#7a5cff", angle: 90 } }),
        ];
      },
      mode: "static", anim: "zoom", hover: "bounce", dark: true, tags: ["club", "salle", "compteur", "néon"],
      features: ["Marque géante à taille fluide", "Compteur d'inscriptions à renseigner (valeur 000 = consigne)", "Barre fine de navigation en mono", "Liseré néon dégradé"],
      animations: ["zoom-in", "bounce"], settings: ["Couleurs", "Polices", "Libellé et valeur du compteur", "Texte du bouton", "Animation d'entrée", "Survol"],
    },
  ],
};
