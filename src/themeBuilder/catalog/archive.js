// Catalogue « Archive » (blog, catégories, étiquettes, auteurs) — 100 modèles = 10 CONTENUS (direction éditoriale : blog, magazine, catégorie avec introduction, auteur avec biographie, étiquettes, actualités,
// portfolio, entreprise, minimaliste typographique, journal de lecture) × 10 COMPOSITIONS de page structurellement différentes (liste, grille, colonne à droite, colonne à gauche, premier article en grand,
// une + brèves, index daté, éditorial centré, bandeau d'en-tête, barre de filtres). Chaque modèle porte sa composition ET son identité visuelle (skin) : aucun ne diffère d'un autre par la seule couleur.
// Tout est natif et réel : widget archiveinfo (titre, description, nombre), boucle d'articles réels qui suit l'archive affichée (archive:true : catégorie, étiquette, auteur), pagination par numéros,
// catfilter (?categorie=) réellement branché sur la boucle (urlFilter), widget authorbox, listes réelles. Aucune image, donnée ou lien factice. Voir docs/theme-builder/kolakisa-archives-library.md.
const EMPTY = "Aucun article dans cette rubrique pour le moment. Revenez bientôt ou parcourez les autres rubriques.";

// ── Éléments de base ────────────────────────────────────────────────────────────────────────────────
const info = (k, st = {}, o = {}) => k.W("archiveinfo", { tag: "h1", showDescription: o.description !== false, showCount: o.count !== false, fallback: "Blog" }, { color: k.S.fg, fontFamily: k.S.head, fontSize: "38px", ...st });
const pad = (k) => ({ paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad });
const wrap = (k, kids, st = {}) => k.section(kids, { paddingTop: "40px", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto", ...st });
const side = (k, kids, st = {}) => k.col(kids, { flexBasis: "280px", flexGrow: 0, flexShrink: 0, gap: k.S.gap, ...st });
const cols2 = (k, a, b, st = {}) => k.row([a, b], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap", ...st });
const muted = (k, html, st = {}) => k.T(html, { color: k.S.mute, fontSize: "15px", ...st });
const ttl = (k, size = "22px", st = {}) => ({ ...k.H("{{post.title}}", "3", { fontSize: size, ...st }), props: { text: "{{post.title}}", level: "3", link: "{{post.url}}" } });
const filt = (k, st = {}) => k.W("catfilter", { source: "posts", allLabel: "Toutes", showCount: true }, { color: k.S.fg, ...st });
const ql = (k, p) => k.W("querylist", { source: "posts", mode: "recent", count: 5, layout: "compact", showCount: false, empty: "Rien à afficher pour le moment.", ...p }, { color: k.S.fg, width: "100%" });
const rubriques = (k) => k.card([k.L("Rubriques"), ql(k, { source: "categories", mode: "popular", count: 12, showCount: true })]);
const tagsBox = (k) => k.card([k.L("Étiquettes"), ql(k, { source: "tags", mode: "popular", count: 14, layout: "inline" })]);
const contact = (k, t = "Une question ?") => k.card([k.L(t), muted(k, "<p>Écrivez-nous, nous vous répondons.</p>"), k.B("Nous contacter", "/contact", "outline")]);

// ── Fiche d'article (répétée pour chaque article réel de l'archive) ─────────────────────────────────
// style : "carte" (image au-dessus), "ligne" (image à gauche), "texte" (sans image), "index" (une ligne datée), "grand" (article principal)
const item = (k, s, o = {}) => {
  const cat = k.L("{{post.category}}", { color: k.S.accent }), by = muted(k, "<p>{{post.author}} · {{post.date}}</p>", { fontSize: "13px" });
  const exc = muted(k, "<p>{{post.excerpt}}</p>"), t = (sz, st) => ttl(k, sz, st);
  const body = (kids, st = {}) => k.col(kids, { gap: "8px", paddingTop: "4px", paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad, ...st });
  const ex = o.excerpt === false ? [] : [exc], ca = o.cat === false ? [] : [cat];
  if (s === "ligne") return [k.row([k.img("post.image", { width: o.w || "220px", height: o.h || "150px", borderRadius: k.S.radius }), k.col([...ca, t(o.size || "21px"), ...ex, by], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, ...pad(k) })];
  if (s === "texte") return [body([...ca, t(o.size || "21px"), ...ex, by], { paddingTop: k.S.pad })];
  if (s === "index") return [k.row([muted(k, "<p>{{post.date}}</p>", { fontSize: "14px", flexBasis: "120px", flexShrink: 0 }), t("18px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), muted(k, "<p>{{post.category}}</p>", { fontSize: "13px" })], { gap: "16px", ...pad(k) })];
  if (s === "grand") return [k.img("post.image", { height: o.h || "340px", borderRadius: "0px" }), body([...ca, t("32px"), muted(k, "<p>{{post.excerpt}}</p>", { fontSize: "17px" }), by], { paddingTop: k.S.pad })];
  return [k.img("post.image", { height: o.h || "190px", borderRadius: "0px" }), body([...ca, t(o.size || "21px"), ...ex, by])];
};
const loop = (k, cols, style, o = {}) => k.loop(cols, item(k, style, o), { source: "posts", archive: true, urlFilter: !!o.filter, count: o.count || (cols === 1 ? 8 : cols * 3), paginate: o.paginate !== false, pagination: "numbers", empty: EMPTY, ...(o.offset ? { offset: o.offset } : {}) }, o.grid || {}, o.cardSt || {});

// ── Contenus : direction éditoriale de l'archive ────────────────────────────────────────────────────
// head(k, st) : en-tête de l'archive ; aside(k) : colonne secondaire ; opts : réglages des fiches
const A = (key, label, tags, desc, o) => ({ key, label, tags, desc, opts: {}, head: (k, st) => k.col([k.L(o.kicker || label, { color: k.S.accent }), info(k, st)], { gap: "6px" }), aside: (k) => [rubriques(k), ql(k, { title: "Les plus lus", mode: "popular" })], ...o });
const CONTENTS = [
  A("blog", "Blog classique", ["blog", "articles"], "Archive de blog classique : grille d'articles avec image, catégorie, extrait et auteur.", { kicker: "Le blog" }),
  A("magazine", "Magazine", ["magazine", "éditorial", "images"], "Archive éditoriale de magazine : grandes images, titres marqués.", { kicker: "À la une", opts: { h: "250px", size: "24px" }, aside: (k) => [ql(k, { title: "À la une", mode: "popular", layout: "cards", showExcerpt: false }), rubriques(k)] }),
  A("categorie", "Catégorie avec introduction", ["catégorie", "introduction", "description"], "Archive de catégorie : titre, description de la rubrique et nombre d'articles en introduction, puis les articles.", { head: (k, st) => k.card([k.L("Rubrique"), info(k, { fontSize: "40px", ...st })], { gap: "10px" }), aside: (k) => [rubriques(k), tagsBox(k)] }),
  A("auteur", "Auteur avec biographie", ["auteur", "profil", "biographie"], "Archive d'auteur : fiche de l'auteur (photo, biographie) puis ses articles.", { head: (k, st) => k.col([k.W("authorbox", { showAvatar: true, showBio: true, showLink: false, linkLabel: "Tous ses articles", heading: "" }, { color: k.S.fg }), info(k, { fontSize: "30px", ...st }, { description: false })], { gap: "14px" }), aside: (k) => [ql(k, { title: "À lire aussi", mode: "popular" }), rubriques(k)] }),
  A("etiquettes", "Étiquettes", ["étiquettes", "tags", "compact"], "Archive d'étiquette compacte : nuage d'étiquettes réelles, fiches de texte sans image.", { opts: { h: "150px", size: "19px", excerpt: false }, head: (k, st) => k.col([info(k, { fontSize: "34px", ...st }), ql(k, { source: "tags", mode: "popular", count: 16, layout: "inline" })], { gap: "12px" }), aside: (k) => [tagsBox(k), rubriques(k)] }),
  A("actualites", "Actualités", ["actualités", "dates", "catégories"], "Archive d'actualités : dates et catégories bien visibles, ton institutionnel ou associatif.", { kicker: "Actualités", opts: { size: "21px" }, aside: (k) => [ql(k, { title: "Dernières actualités", count: 6 }), contact(k, "Rejoignez-nous")] }),
  A("portfolio", "Portfolio", ["portfolio", "projets", "images"], "Archive de portfolio : grille de projets présentés par leur image, sans extrait.", { kicker: "Réalisations", opts: { excerpt: false, h: "230px", size: "20px" }, aside: (k) => [rubriques(k)] }),
  A("entreprise", "Entreprise", ["entreprise", "institutionnel", "actualités"], "Archive institutionnelle : sobre, avec invitation à nous contacter.", { kicker: "Publications", opts: { h: "170px" }, aside: (k) => [ql(k, { title: "Dernières publications", count: 5 }), contact(k)] }),
  A("minimal", "Minimaliste typographique", ["minimaliste", "typographie", "sans image"], "Archive minimaliste : liste typographique, aucune image.", { kicker: "Journal", opts: { size: "24px", cat: false }, aside: (k) => [ql(k, { title: "Rubriques", source: "categories", mode: "popular", count: 10 })] }),
  A("journal", "Journal de lecture", ["journal", "longs formats", "extraits"], "Archive de lecture : grands titres et extraits, pour des contenus longs.", { kicker: "Lectures", opts: { size: "26px", h: "210px" }, aside: (k) => [ql(k, { title: "Les plus lus", mode: "popular", layout: "cards", showExcerpt: true, count: 3 }), tagsBox(k)] }),
];

// ── Compositions : dix structures de page différentes ───────────────────────────────────────────────
const main = (k, a, cols, st, o = {}) => loop(k, cols, st, { ...a.opts, ...o });
const COMPOSITIONS = [
  { key: "liste", label: "Liste", skinShift: 0, tag: "liste",
    build: (k, a) => [wrap(k, [a.head(k), main(k, a, 1, "ligne", { grid: { gap: "0px" } })])] },
  { key: "grille", label: "Grille de cartes", skinShift: 1, tag: "grille",
    build: (k, a) => [wrap(k, [a.head(k), main(k, a, 3, "carte")])] },
  { key: "lateral-droite", label: "Colonne à droite", skinShift: 2, tag: "colonne latérale",
    build: (k, a) => [wrap(k, [a.head(k), cols2(k, k.col([main(k, a, 1, "texte", { grid: { gap: "0px" } })], { flexBasis: "0px", flexGrow: 1, minWidth: "280px", gap: k.S.gap }), side(k, a.aside(k)))])] },
  { key: "lateral-gauche", label: "Colonne à gauche", skinShift: 3, tag: "panneau",
    build: (k, a) => [wrap(k, [cols2(k, side(k, [a.head(k, { fontSize: "28px" }), ...a.aside(k)]), k.col([main(k, a, 2, "carte", { h: "160px", size: "18px" })], { flexBasis: "0px", flexGrow: 1, minWidth: "300px", gap: k.S.gap }))])] },
  { key: "vedette", label: "Article en grand puis grille", skinShift: 4, tag: "vedette",
    build: (k, a) => [wrap(k, [a.head(k), main(k, a, 1, "grand", { count: 1, paginate: false }), main(k, a, 3, "carte", { offset: 1, count: 9, h: "160px", size: "19px", excerpt: false })])] },
  { key: "une-breves", label: "Une et brèves", skinShift: 0, tag: "asymétrique",
    build: (k, a) => [wrap(k, [a.head(k), k.row([k.col([main(k, a, 1, "grand", { count: 1, paginate: false, h: "300px" })], { flexBasis: "0px", flexGrow: 2, minWidth: "300px" }), k.col([main(k, a, 1, "texte", { count: 3, offset: 1, paginate: false, size: "18px", excerpt: false, grid: { gap: "0px" } })], { flexBasis: "0px", flexGrow: 1, minWidth: "260px" })], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap" }), k.divider(), main(k, a, 1, "index", { offset: 4, count: 12, grid: { gap: "0px" } })])] },
  { key: "index", label: "Index daté", skinShift: 1, tag: "compact",
    build: (k, a) => [wrap(k, [a.head(k, { fontSize: "30px" }), main(k, a, 1, "index", { count: 20, grid: { gap: "0px" } })], { maxWidth: "900px" })] },
  { key: "editorial", label: "Éditorial centré", skinShift: 2, tag: "centré",
    build: (k, a) => [wrap(k, [k.col([a.head(k, { fontSize: "44px", textAlign: "center" }), k.divider()], { alignItems: "center" }), main(k, a, 1, "texte", { count: 6, size: "28px", grid: { gap: "8px" }, cardSt: { textAlign: "center", alignItems: "center" } })], { maxWidth: "760px" })] },
  { key: "bandeau", label: "Bandeau d'en-tête", skinShift: 3, tag: "bandeau",
    build: (k, a) => [k.band([k.inner([k.col([a.head(k, { fontSize: "40px" }), filt(k)], { gap: "14px", flexBasis: "0px", flexGrow: 1, minWidth: "260px" }), k.search("blog", { maxWidth: "360px", width: "100%" })], { alignItems: "flex-end" })], { paddingTop: "48px", paddingBottom: "48px", backgroundColor: k.S.alt }),
      wrap(k, [main(k, a, 3, "carte", { filter: true })])] },
  { key: "filtres", label: "Barre de filtres", skinShift: 4, tag: "filtres",
    build: (k, a) => [wrap(k, [a.head(k), filt(k), main(k, a, 2, "ligne", { filter: true, count: 10, w: "170px", h: "120px" })])] },
];
const SKIN_ORDER = ["clair", "marque", "nuit", "editorial", "doux"];
const SKIN_OFFSET = [0, 1, 4, 3, 2, 2, 3, 0, 1, 4]; // un décalage par contenu : chaque identité sert exactement 20 modèles

// 100 entrées : l'identité visuelle varie avec la composition ET le contenu, de façon déterministe (20 modèles par identité)
function entries() {
  const out = [];
  CONTENTS.forEach((a, i) => COMPOSITIONS.forEach((c) => {
    const skinKey = SKIN_ORDER[(SKIN_OFFSET[i] + c.skinShift) % SKIN_ORDER.length];
    out.push({ key: `${a.key}.${c.key}`, layoutKey: a.key, layoutLabel: a.label, treatmentKey: c.key, skinKey, name: `${a.label} · ${c.label}`, desc: `${a.desc} Composition : ${c.label.toLowerCase()}.`, tags: [...a.tags, c.tag, skinKey], build: (k) => c.build(k, a) });
  }));
  return out;
}
module.exports = { type: "archive", kind: "page", entries, layouts: CONTENTS.map((a) => ({ key: a.key, label: a.label, tags: a.tags, desc: a.desc })) };
