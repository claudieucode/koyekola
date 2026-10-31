// Catalogue « Archive » (blog, catégories, étiquettes, auteurs) : 20 mises en page de STRUCTURES différentes × 5 identités visuelles = 100 modèles.
// Tout est natif : widget archiveinfo (titre, description, nombre), boucle d'articles réels qui suit l'archive affichée (archive:true), étiquettes {{post.*}}. Aucune image ni lien factices.
const L = (key, label, tags, desc, build) => ({ key, label, tags, desc, build });
const EMPTY = "Aucun article dans cette rubrique pour le moment.";
const info = (k, st = {}) => k.W("archiveinfo", { tag: "h1", showDescription: true, showCount: true, fallback: "Blog" }, { color: k.S.fg, fontFamily: k.S.head, ...st });
// titre d'article cliquable
const ttl = (k, size = "22px", st = {}) => ({ ...k.H("{{post.title}}", "3", { fontSize: size, ...st }), props: { text: "{{post.title}}", level: "3", link: "{{post.url}}" } });
const cat = (k) => k.L("{{post.category}}", { color: k.S.accent });
const exc = (k, st = {}) => k.T("<p>{{post.excerpt}}</p>", { color: k.S.mute, fontSize: "15px", ...st });
const by = (k, st = {}) => k.T("<p>{{post.author}} · {{post.date}}</p>", { color: k.S.mute, fontSize: "13px", ...st });
const body = (k, kids, st = {}) => k.col(kids, { paddingTop: "4px", paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad, gap: "8px", ...st });
const card = (k, o = {}) => [...(o.noImage ? [] : [k.img("post.image", { height: o.h || "200px", borderRadius: "0px" })]), body(k, [cat(k), ttl(k, o.size), ...(o.excerpt === false ? [] : [exc(k)]), by(k)], o.noImage ? { paddingTop: k.S.pad } : {})];
const lp = (extra = {}) => ({ source: "posts", archive: true, count: 9, paginate: true, pagination: "numbers", empty: EMPTY, ...extra });
const wrap = (k, kids, st = {}) => k.section(kids, { paddingTop: "40px", maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto", ...st });
const head = (k, st = {}) => k.col([info(k, { fontSize: "40px" })], { gap: "6px", ...st });
const filt = (k, st = {}) => k.W("catfilter", { source: "posts", allLabel: "Toutes", showCount: true }, { color: k.S.fg, ...st });
const side = (k, kids) => k.col(kids, { flexBasis: "280px", flexGrow: 0, flexShrink: 0, gap: k.S.gap });
const main = (k, kids) => k.col(kids, { flexBasis: "0px", flexGrow: 1, minWidth: "280px", gap: k.S.gap });
const ql = (k, p) => k.W("querylist", { source: "posts", mode: "recent", count: 5, layout: "compact", showCount: true, empty: "Rien à afficher pour le moment.", ...p }, { color: k.S.fg });

module.exports = { type: "archive", kind: "page", layouts: [
  L("grille-3", "Grille 3 colonnes", ["grille", "cartes", "image"], "Titre d'archive puis grille de 3 cartes avec image.", (k) => [wrap(k, [head(k), k.loop(3, card(k), lp())])]),
  L("grille-2", "Grille 2 colonnes", ["grille", "grandes cartes", "image"], "Deux grandes cartes par ligne, image haute.", (k) => [wrap(k, [head(k), k.loop(2, card(k, { h: "280px", size: "26px" }), lp({ count: 8 }))])]),
  L("grille-4", "Grille 4 colonnes", ["grille", "dense", "image"], "Quatre petites cartes par ligne, sans extrait.", (k) => [wrap(k, [head(k), k.loop(4, card(k, { h: "150px", size: "17px", excerpt: false }), lp({ count: 12 }))])]),
  L("liste", "Liste image à gauche", ["liste", "horizontal", "image"], "Un article par ligne : image à gauche, texte à droite.", (k) => [wrap(k, [head(k), k.loop(1, [k.row([k.img("post.image", { width: "260px", height: "170px", borderRadius: k.S.radius }), k.col([cat(k), ttl(k, "24px"), exc(k), by(k)], { flexBasis: "0px", flexGrow: 1, minWidth: "240px", gap: "8px" })], { alignItems: "flex-start", gap: k.S.gap, padding: k.S.pad, paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad })], lp({ count: 8 }))])]),
  L("vedette", "Vedette puis grille", ["vedette", "grille", "image"], "Le dernier article en grand, les suivants en grille.", (k) => [wrap(k, [head(k),
    k.loop(1, [k.img("post.image", { height: "380px", borderRadius: "0px" }), body(k, [cat(k), ttl(k, "34px"), exc(k, { fontSize: "17px" }), by(k)], { paddingTop: k.S.pad })], { source: "posts", archive: true, count: 1, empty: EMPTY }),
    k.loop(3, card(k), lp({ offset: 1, count: 6 }))])]),
  L("magazine", "Magazine asymétrique", ["magazine", "asymétrique", "éditorial"], "Grande une à gauche, trois brèves à droite, puis la suite.", (k) => [wrap(k, [head(k),
    k.row([
      k.loop(1, [k.img("post.image", { height: "340px", borderRadius: "0px" }), body(k, [cat(k), ttl(k, "30px"), exc(k), by(k)])], { source: "posts", archive: true, count: 1, empty: EMPTY }, { flexBasis: "0px", flexGrow: 2, minWidth: "300px" }),
      k.loop(1, [body(k, [cat(k), ttl(k, "18px"), by(k)], { paddingTop: k.S.pad })], { source: "posts", archive: true, count: 3, offset: 1, empty: EMPTY }, { flexBasis: "0px", flexGrow: 1, minWidth: "240px" })], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap" }),
    k.loop(3, card(k, { h: "170px" }), lp({ offset: 4, count: 6 }))])]),
  L("sans-image", "Cartes sans image", ["texte", "sobre", "cartes"], "Cartes de texte uniquement : titre, extrait, auteur.", (k) => [wrap(k, [head(k), k.loop(3, card(k, { noImage: true }), lp({ count: 9 }))])]),
  L("compacte", "Liste compacte", ["compact", "titres", "date"], "Une ligne par article : date, titre, auteur.", (k) => [wrap(k, [head(k), k.loop(1, [k.row([k.T("<p>{{post.date}}</p>", { color: k.S.mute, fontSize: "14px", flexBasis: "120px", flexShrink: 0 }), ttl(k, "19px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), k.T("<p>{{post.author}}</p>", { color: k.S.mute, fontSize: "14px" })], { padding: k.S.pad, paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad, gap: "16px" })], lp({ count: 15 }, { gap: "0px" }))], { maxWidth: "900px" })]),
  L("lateral-droite", "Colonne latérale à droite", ["colonne latérale", "catégories", "populaires"], "Articles à gauche ; catégories et articles populaires à droite.", (k) => [wrap(k, [head(k), k.row([
    main(k, [k.loop(2, card(k, { h: "170px", size: "19px" }), lp({ count: 8 }))]),
    side(k, [k.card([k.L("Catégories"), filt(k)]), k.card([ql(k, { title: "Les plus lus", mode: "popular" })])])], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap" })])]),
  L("lateral-gauche", "Colonne latérale à gauche", ["colonne latérale", "rubriques", "navigation"], "Rubriques à gauche, liste d'articles à droite.", (k) => [wrap(k, [k.row([
    side(k, [info(k, { fontSize: "30px" }), k.card([ql(k, { title: "Rubriques", source: "categories", mode: "popular", count: 12 })])]),
    main(k, [k.loop(1, [k.row([k.img("post.image", { width: "180px", height: "120px", borderRadius: k.S.radius }), k.col([ttl(k, "20px"), by(k)], { flexBasis: "0px", flexGrow: 1, minWidth: "200px" })], { gap: "16px", padding: k.S.pad, paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad })], lp({ count: 10 }))])], { alignItems: "flex-start", gap: k.S.gap, flexWrap: "wrap" })])]),
  L("etiquettes", "Nuage d'étiquettes", ["étiquettes", "tags", "colonne latérale"], "Étiquettes en ligne au-dessus de la liste.", (k) => [wrap(k, [head(k), ql(k, { title: "Étiquettes", source: "tags", mode: "popular", count: 16, layout: "inline" }), k.loop(2, card(k, { noImage: true, size: "24px" }), lp({ count: 8 }))])]),
  L("carrousel", "Carrousel puis liste", ["carrousel", "slider", "à la une"], "Carrousel horizontal des derniers articles, puis la liste paginée.", (k) => [wrap(k, [head(k),
    k.loop(3, card(k, { h: "180px", size: "19px", excerpt: false }), { source: "posts", archive: true, count: 6, slider: true, empty: EMPTY }),
    k.loop(1, [k.row([ttl(k, "20px", { flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), by(k)], { padding: k.S.pad, paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad })], lp({ offset: 6, count: 10 }))])]),
  L("charger-plus", "Charger plus", ["charger plus", "pagination", "grille"], "Grille de cartes et bouton « charger plus » à la place des numéros.", (k) => [wrap(k, [head(k), k.loop(3, card(k, { h: "190px" }), lp({ pagination: "more", count: 6 }))])]),
  L("editorial", "Éditorial centré", ["éditorial", "centré", "typographique"], "En-tête centré, grands titres, une colonne étroite.", (k) => [wrap(k, [k.col([info(k, { fontSize: "46px", textAlign: "center" }), k.divider()], { alignItems: "center", textAlign: "center" }),
    k.loop(1, [body(k, [cat(k), ttl(k, "32px"), exc(k, { fontSize: "17px" }), by(k)], { paddingTop: k.S.pad, textAlign: "center", alignItems: "center" })], lp({ count: 6 }, { gap: "8px" }))], { maxWidth: "760px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("mosaique", "Mosaïque", ["mosaïque", "irrégulier", "image"], "Deux grandes cartes puis quatre petites.", (k) => [wrap(k, [head(k),
    k.loop(2, card(k, { h: "300px", size: "28px" }), { source: "posts", archive: true, count: 2, empty: EMPTY }),
    k.loop(4, card(k, { h: "120px", size: "16px", excerpt: false }), lp({ offset: 2, count: 8 }))])]),
  L("chronologie", "Chronologie", ["timeline", "date", "chronologique"], "Fil vertical : la date à gauche, l'article à droite sur un trait.", (k) => [wrap(k, [head(k), k.loop(1, [k.row([k.T("<p>{{post.date}}</p>", { color: k.S.accent, fontWeight: "700", flexBasis: "130px", flexShrink: 0 }), k.col([ttl(k, "21px"), exc(k), cat(k)], { flexBasis: "0px", flexGrow: 1, minWidth: "220px", paddingLeft: "20px", borderLeftWidth: "3px", borderStyle: "solid", borderColor: k.S.accent })], { alignItems: "flex-start", gap: "16px", padding: k.S.pad, paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad })], lp({ count: 10 }, { gap: "0px" }))], { maxWidth: "860px" })]),
  L("auteur", "Archive d'auteur", ["auteur", "profil", "biographie"], "Fiche de l'auteur (photo, biographie) puis ses articles.", (k) => [wrap(k, [k.W("authorbox", { showAvatar: true, showBio: true, showLink: false, linkLabel: "Tous ses articles", heading: "" }, { color: k.S.fg }), info(k, { fontSize: "34px" }), k.loop(2, card(k, { h: "200px", size: "22px" }), lp({ count: 8 }))])]),
  L("bandeau", "Bandeau d'en-tête", ["bandeau", "recherche", "filtres"], "Bandeau coloré avec titre, recherche et catégories, puis la grille.", (k) => [
    k.band([k.inner([k.col([info(k, { fontSize: "40px" }), filt(k)], { gap: "14px", flexBasis: "0px", flexGrow: 1, minWidth: "260px" }), k.search("blog", { maxWidth: "360px", width: "100%" })], { alignItems: "flex-end" })], { paddingTop: "48px", paddingBottom: "48px", backgroundColor: k.S.alt }),
    wrap(k, [k.loop(3, card(k), lp())])]),
  L("filet", "Cartes à filet", ["texte", "filet", "deux colonnes"], "Deux colonnes de textes séparés par un filet d'accent, sans image.", (k) => [wrap(k, [head(k), k.loop(2, [body(k, [cat(k), ttl(k, "23px"), exc(k), by(k)], { paddingTop: k.S.pad, borderLeftWidth: "4px", borderStyle: "solid", borderColor: k.S.accent })], lp({ count: 8 }, {}, { backgroundColor: "transparent", boxShadow: "none", borderWidth: "0px" }))])]),
  L("filtres-haut", "Filtres et cartes horizontales", ["filtres", "catégories", "horizontal"], "Barre de catégories sous le titre, cartes image-texte sur deux colonnes.", (k) => [wrap(k, [head(k), filt(k), k.loop(2, [k.row([k.img("post.image", { width: "150px", height: "150px", borderRadius: "0px" }), k.col([cat(k), ttl(k, "18px"), by(k)], { flexBasis: "0px", flexGrow: 1, minWidth: "140px", padding: k.S.pad, paddingTop: k.S.pad, paddingBottom: k.S.pad, paddingLeft: k.S.pad, paddingRight: k.S.pad })], { gap: "0px", alignItems: "stretch" })], lp({ count: 10 }))])]),
] };
