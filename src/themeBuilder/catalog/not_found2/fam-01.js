// Famille 1 — Minimalistes (7 modèles). Chaque modèle déclare seulement sa composition (C), le traitement du numéro (N), la palette (P) et la typographie (T) ;
// média, animation, parcours et densité sont DÉRIVÉS du document construit (voir not_found2.js).
const { skin, MSG, WHY, deco, stage, LK } = require("./h");
// ── Famille 1 — Minimalistes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const S_BLANCHE = skin("blanche", "Papier blanc", { bg: "#ffffff", fg: "#111111", mute: "#6b7280", alt: "#f4f4f5", accent: "#111111", onAccent: "#ffffff", line: "#d4d4d8", font: "font.inter", head: "font.roboto-slab", weight: "800" });
const S_TRAIT = skin("trait", "Crème fine", { bg: "#faf7f2", fg: "#1c1917", mute: "#78716c", alt: "#f1ece2", accent: "#1c1917", onAccent: "#faf7f2", line: "#1c1917", font: "font.cormorant-garamond", head: "font.cormorant-garamond", weight: "500", btn: "outline" });
const S_MARGE = skin("marge", "Suisse chaud", { bg: "#f4f1ea", fg: "#1a1a1a", mute: "#6f6a60", alt: "#e9e4d8", accent: "#1a1a1a", onAccent: "#f4f1ea", line: "#1a1a1a", font: "font.inter-tight", head: "font.inter-tight", weight: "600" });
const S_POINT = skin("point", "Affiche rouge", { bg: "#ffffff", fg: "#0a0a0a", mute: "#525252", alt: "#f5f5f5", accent: "#e5231b", onAccent: "#ffffff", line: "#0a0a0a", font: "font.inter", head: "font.bebas-neue", weight: "400", btn: "solid" });
const S_MOTS = skin("mots", "Bleu électrique", { bg: "#1d4ed8", fg: "#ffffff", mute: "#dbeafe", alt: "#1e40af", accent: "#ffffff", onAccent: "#1d4ed8", line: "#93c5fd", font: "font.inter", head: "font.archivo-black", weight: "400", btn: "solid" });
const S_INDEX = skin("index", "Papier technique", { bg: "#ffffff", fg: "#111111", mute: "#737373", alt: "#fafafa", accent: "#111111", onAccent: "#ffffff", line: "#111111", font: "font.ibm-plex-mono", head: "font.ibm-plex-mono", weight: "600" });
const S_SILENCE = skin("silence", "Nuit calme", { bg: "#09090b", fg: "#e4e4e7", mute: "#71717a", alt: "#18181b", accent: "#e4e4e7", onAccent: "#09090b", line: "#3f3f46", font: "font.jetbrains-mono", head: "font.jetbrains-mono", weight: "400" });

module.exports = [
  // 404-001 — numéro géant en gris très pâle, une phrase, un bouton, tout centré
  { key: "page-blanche", family: "minimalistes", skin: S_BLANCHE, name: "Page blanche", tags: ["minimaliste", "numéro géant", "centré"],
    desc: "Un 404 géant en gris très pâle, une phrase, un bouton : rien d'autre.",
    decl: { C: 1, N: 1, P: 1, T: 7 },
    build: (k) => [stage(k, [k.col([
      deco("404", { fontSize: "26vw", color: "#ececec", fontWeight: "800", letterSpacing: "-0.04em", lineHeight: 0.8, textAlign: "center" }),
      k.H(MSG, "1", { fontSize: "30px", textAlign: "center" }),
      k.B("Retour à l'accueil", "/", "outline", { alignSelf: "center" }),
    ], { alignItems: "center", gap: "28px", width: "100%" })], { gap: "0px" })] },

  // 404-002 — une seule ligne de texte entre deux filets, alignée à gauche ; beaucoup de vide
  { key: "trait-unique", family: "minimalistes", skin: S_TRAIT, name: "Trait unique", tags: ["minimaliste", "filets", "une ligne"],
    desc: "Une seule ligne de texte entre deux filets fins, un lien souligné, et en dessous une petite invitation à signaler le lien cassé.",
    decl: { C: 15, N: 2, P: 5, T: 2 },
    build: (k) => [stage(k, [k.col([k.row([
      k.row([k.L("404 —", { color: "#78716c", fontSize: "16px" }), k.H(MSG + ".", "1", { fontSize: "34px", fontWeight: "500", fontStyle: "italic" })], { gap: "14px", alignItems: "baseline" }),
      LK(k, "Retour à l'accueil →", "/", { fontSize: "20px", fontStyle: "italic", textDecoration: "underline" }),
    ], { justifyContent: "space-between", width: "100%", paddingTop: "28px", paddingBottom: "28px", borderTopStyle: "solid", borderTopWidth: "1px", borderBottomStyle: "solid", borderBottomWidth: "1px", borderColor: "#1c1917", gap: "20px" }),
      k.row([k.T("<p>Un lien cassé sur notre site ?</p>", { fontSize: "16px", color: "#78716c", fontStyle: "italic" }), LK(k, "Signalez-le-nous", "/contact", { fontSize: "16px", textDecoration: "underline" })], { gap: "10px" })], { gap: "18px", width: "100%" })], { gap: "0px" })] },

  // 404-003 — grande marge à gauche (38 %), texte à droite, légende en pied
  { key: "marge-laterale", family: "minimalistes", skin: S_MARGE, name: "Marge latérale", tags: ["minimaliste", "asymétrique", "marge", "articles"],
    desc: "Un 404 fantôme occupe la grande marge de gauche ; à droite le message, les trois derniers articles réels du site et un lien discret.",
    decl: { C: 3, N: 1, P: 7, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.col([deco("404", { fontSize: "11vw", color: "#e2dccd", fontWeight: "800", letterSpacing: "-0.04em", lineHeight: 0.8 })], { flexBasis: "38%", flexGrow: 0, flexShrink: 1, minWidth: "180px", alignSelf: "flex-start" }),
      k.col([
        k.H(MSG + ".", "1", { fontSize: "56px", lineHeight: 1.05, letterSpacing: "-0.03em" }, { fontSize: "40px" }, { fontSize: "32px" }),
        k.T("<p>" + WHY + " Essayez l'une de ces pages.</p>", { fontSize: "18px", color: "#6f6a60", maxWidth: "460px" }),
        k.W("querylist", { title: "À lire plutôt", source: "posts", mode: "recent", count: 3, layout: "list", showImage: false, showDate: true, empty: "Les articles apparaîtront ici." }, { width: "100%", maxWidth: "460px" }),
        LK(k, "Retour à l'accueil", "/", { textDecoration: "underline" }),
        k.divider({ width: "100%", maxWidth: "460px", borderColor: "#1a1a1a" }),
        k.row([k.T("<p>Besoin d'aide ?</p>", { fontSize: "15px", color: "#6f6a60" }), LK(k, "Écrivez-nous", "/contact", { fontSize: "15px", textDecoration: "underline" }), LK(k, "Explorer le blog", "/blog", { fontSize: "15px", textDecoration: "underline" })], { gap: "14px" }),
        k.T("<p>Si cette page devrait exister, dites-le-nous : nous la rétablirons.</p>", { fontSize: "13px", color: "#6f6a60", maxWidth: "460px" }),
      ], { flexBasis: "52%", flexGrow: 1, minWidth: "280px", gap: "22px" }),
    ], { alignItems: "flex-start", width: "100%", gap: "32px" })])] },

  // 404-004 — le numéro est composé d'un 404 géant suivi d'un grand point rouge qui est le bouton
  { key: "point-final", family: "minimalistes", skin: S_POINT, name: "Point final", tags: ["minimaliste", "affiche", "contour", "bouton rond"],
    desc: "Le 404 en contour fin se termine par un grand point rouge qui est le bouton d'accueil ; trois liens discrets dessous.",
    decl: { C: 9, N: 11, P: 4, T: 4 },
    build: (k) => [stage(k, [k.col([
      k.row([
        deco("404", { fontSize: "30vw", lineHeight: 0.8, letterSpacing: "-0.02em", color: "transparent", textStrokeWidth: "3px", textStrokeColor: "#0a0a0a", fontFamily: "font.bebas-neue", fontWeight: "400" }),
        { ...k.B("Accueil", "/", "solid", { width: "9vw", height: "9vw", minWidth: "84px", minHeight: "84px", borderRadius: "50%", fontSize: "13px", alignSelf: "flex-end", marginBottom: "3vw", justifyContent: "center", paddingLeft: "0px", paddingRight: "0px" }) },
      ], { gap: "1vw", alignItems: "flex-end", flexWrap: "nowrap" }),
      k.H(MSG, "1", { fontSize: "34px", letterSpacing: "1px" }),
      k.row([LK(k, "Blog", "/blog", { textDecoration: "underline" }), LK(k, "Catalogue", "/catalogue", { textDecoration: "underline" }), LK(k, "Contact", "/contact", { textDecoration: "underline" })], { gap: "22px" }),
    ], { gap: "12px", width: "100%" })], { gap: "0px" })] },

  // 404-005 — deux mots géants empilés remplissent la page, une recherche dessous
  { key: "deux-mots", family: "minimalistes", skin: S_MOTS, name: "Deux mots", tags: ["minimaliste", "typographie", "recherche"],
    desc: "« Introuvable. » et « Pardon. » en géants, empilés ; une barre de recherche pour rebondir.",
    decl: { C: 17, N: 6, P: 9, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H("Introuvable.", "1", { fontSize: "9.5vw", lineHeight: 0.92, letterSpacing: "-0.03em" }),
      deco("Pardon.", { fontSize: "9.5vw", lineHeight: 0.92, letterSpacing: "-0.03em", color: "#bfdbfe", fontFamily: "font.archivo-black" }),
      k.search("blog", { maxWidth: "520px", width: "100%", marginTop: "28px" }),
      k.L("Erreur 404 — cette page n'existe plus.", { color: "#dbeafe", marginTop: "6px" }),
    ], { gap: "0px", width: "100%" })], { gap: "0px", justifyContent: "center" })] },

  // 404-006 — deux colonnes : message à gauche, index numéroté de liens à droite, séparés par des filets
  { key: "index-sobre", family: "minimalistes", skin: S_INDEX, name: "Index sobre", tags: ["minimaliste", "index", "plan du site"],
    desc: "Message à gauche ; à droite un index numéroté (01 Accueil, 02 Blog…) séparé par des filets.",
    decl: { C: 2, N: 2, P: 1, T: 3 },
    build: (k) => {
      const rows = [["01", "Accueil", "/"], ["02", "Blog", "/blog"], ["03", "Catalogue", "/catalogue"], ["04", "Contact", "/contact"]];
      return [stage(k, [k.row([
        k.col([k.L("404", { fontSize: "14px", letterSpacing: "3px" }), k.H(MSG, "1", { fontSize: "40px", lineHeight: 1.1 }), k.T("<p>" + WHY + "</p>", { fontSize: "15px", color: "#737373" })], { flexBasis: "42%", flexGrow: 1, minWidth: "260px", gap: "16px" }),
        k.col(rows.map(([n, l, u]) => k.row([k.L(n, { fontSize: "14px", minWidth: "36px" }), LK(k, l, u, { fontSize: "26px" })], { gap: "18px", paddingTop: "16px", paddingBottom: "16px", borderBottomStyle: "solid", borderBottomWidth: "1px", borderColor: "#111111", flexWrap: "nowrap" })),
          { flexBasis: "46%", flexGrow: 1, minWidth: "260px", gap: "0px", borderTopStyle: "solid", borderTopWidth: "1px", borderColor: "#111111" }),
      ], { alignItems: "flex-start", gap: "48px", width: "100%" })])];
    } },

  // 404-007 — presque rien : trois lignes minuscules au centre d'un grand fond sombre
  { key: "silence", family: "minimalistes", skin: S_SILENCE, name: "Silence", tags: ["minimaliste", "sombre", "machine à écrire"],
    desc: "Un grand fond sombre ; le message s'écrit puis s'efface lentement (machine à écrire, bouton Pause intégré), avec une recherche discrète.",
    decl: { C: 1, N: 2, P: 2, T: 3 },
    build: (k) => [stage(k, [k.col([
      k.L("404", { color: "#71717a", fontSize: "12px", letterSpacing: "0.5em", textAlign: "center" }),
      k.W("motiontypewriter", { prefix: "", phrases: [{ text: MSG }], suffix: "", tag: "h1", cursor: "bar" }, { fontSize: "26px", fontWeight: "400", textAlign: "center", letterSpacing: "0.04em", color: "#e4e4e7", minHeight: "40px" }),
      k.search("blog", { maxWidth: "380px", width: "100%", marginTop: "10px" }),
      LK(k, "retour à l'accueil", "/", { fontSize: "14px", color: "#a1a1aa", alignSelf: "center", textDecoration: "underline" }),
    ], { alignItems: "center", gap: "20px", width: "100%" })], { minHeight: "80vh", gap: "0px" })] },
];
