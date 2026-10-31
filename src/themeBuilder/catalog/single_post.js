// Catalogue « Article individuel » : 20 mises en page × 5 identités visuelles = 100 modèles. Le modèle est rendu AUTOUR d'un article réel : titre {{post.title}} + contenu (postcontent) sont toujours présents ;
// image à la une par étiquette dynamique ({{post.image}}), jamais d'image factice. Aucun lien inventé (le fil d'Ariane ne pointe que vers l'accueil et le blog).
const L = (key, label, tags, desc, build) => ({ key, label, tags, desc, build });
const SHARE = { networks: ["facebook", "x", "linkedin"] };
const CRUMB = { items: [{ label: "Accueil", url: "/" }, { label: "Blog", url: "/blog" }, { label: "Cet article" }], separator: "chevron" };
const META = (a = {}) => ({ showAuthor: true, showDate: true, showCategory: true, showReading: true, ...a });
const REL = (a = {}) => ({ title: "À lire aussi", source: "posts", mode: "related", count: 3, layout: "cards", ...a });
const NARROW = "720px";

module.exports = { type: "single_post", kind: "page", layouts: [
  L("classique", "Classique", ["classique", "lecture", "blog"], "Titre, informations, image, texte, puis auteur et commentaires.", (k) => [k.section([
    k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1"), k.W("postmeta", META()), k.img("post.image", { maxHeight: "460px" }), k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Étiquettes :" }), k.W("authorbox", {}), k.W("postcomments", {})], { maxWidth: "820px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("etroit", "Colonne étroite", ["centré", "lecture", "minimaliste"], "Colonne de lecture étroite, titre centré, sans image.", (k) => [k.section([
    k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "40px" }), k.W("postmeta", META({ showCategory: false, align: "center" })), k.W("postcontent", {}), k.divider(), k.W("postnav", {})], { maxWidth: NARROW, marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("heros-plein", "Héros plein écran", ["héros", "image", "immersif"], "Grand visuel d'ouverture avec le titre posé dessus, texte en dessous.", (k) => [
    k.band([k.img("post.image", { position: "absolute", top: "0px", left: "0px", height: "100%", borderRadius: "0px", zIndex: 0 }),
      k.inner([k.col([k.W("postterms", { show: "category" }, { color: "#ffffff" }), k.H("{{post.title}}", "1", { color: "#ffffff", fontSize: "52px" }), k.W("postmeta", META(), { color: "#ffffff" })], { position: "relative", zIndex: 1, maxWidth: "820px" })], { alignItems: "flex-end", minHeight: "70vh" })],
      { position: "relative", overflow: "hidden", backgroundColor: k.S.alt, color: "#ffffff", borderBottomWidth: "0px", paddingLeft: "24px" }, null, null, "Héros de l'article"),
    k.section([k.W("postcontent", {}), k.W("authorbox", {}), k.W("postnav", {})], { maxWidth: "780px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("lateral", "Colonne latérale", ["barre latérale", "blog", "classique"], "Article à gauche, colonne de widgets à droite.", (k) => [k.section([
    k.W("breadcrumb", CRUMB),
    k.grid(2, [
      k.col([k.H("{{post.title}}", "1"), k.W("postmeta", META()), k.img("post.image"), k.W("postcontent", {}), k.W("postterms", {}), k.W("postcomments", {})], { gap: "20px" }),
      k.col([k.card([k.W("authorbox", { heading: "" })]), k.card([k.W("toc", { title: "Sommaire", depth: "3", numbered: false })]), k.W("querylist", { title: "Les plus lus", source: "posts", mode: "popular", count: 4, layout: "compact", showImage: false })], { gap: "20px" })], { gridTemplate: "2fr 1fr", alignItems: "start" })], { maxWidth: "1180px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("lateral-gauche", "Sommaire à gauche", ["sommaire", "documentation", "long format"], "Sommaire collant à gauche, texte à droite.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postmeta", META()),
    k.grid(2, [k.col([k.W("toc", { title: "Dans cet article", depth: "3", numbered: true }, { position: "sticky", top: "24px" }), k.W("sharebuttons", { ...SHARE, label: "Partager" })], { gap: "18px" }), k.col([k.W("postcontent", {}), k.W("postnav", {})], { gap: "24px" })], { gridTemplate: "1fr 3fr", alignItems: "start" })], { maxWidth: "1100px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("magazine", "Magazine", ["magazine", "image", "articles liés"], "Image à la une pleine largeur, titre en bandeau, articles liés en cartes.", (k) => [
    k.img("post.image", { maxHeight: "520px", borderRadius: "0px" }),
    k.section([k.W("postterms", { show: "category", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "46px" }), k.W("postmeta", META({ showComments: true })), k.W("postcontent", {}), k.W("sharebuttons", SHARE), k.W("querylist", REL({ count: 3 }))], { maxWidth: "900px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("editorial", "Éditorial à lettrine", ["éditorial", "lettrine", "élégant"], "En-tête de revue centré, filet, texte à lettrine.", (k) => [k.section([
    k.L("{{post.category}}", { textAlign: "center" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "48px" }), k.T("<p>{{post.excerpt}}</p>", { textAlign: "center", fontSize: "20px", color: k.S.mute, fontStyle: "italic" }),
    k.W("postmeta", META({ showCategory: false, separator: "bar", align: "center" })), k.divider({ borderTopWidth: "3px" }), k.img("post.image", { maxHeight: "420px" }),
    k.col([k.W("postcontent", {})], { maxWidth: NARROW, marginLeft: "auto", marginRight: "auto", width: "100%", fontSize: "19px", lineHeight: 1.8 }), k.W("authorbox", {}, { maxWidth: NARROW, marginLeft: "auto", marginRight: "auto" })], { maxWidth: "960px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("bandeau-titre", "Bandeau titre coloré", ["bandeau", "couleur", "titre"], "Bandeau de couleur pour le titre, texte clair en dessous.", (k) => [
    k.band([k.inner([k.col([k.W("breadcrumb", CRUMB, { color: k.S.onAccent }), k.H("{{post.title}}", "1", { color: k.S.onAccent }), k.W("postmeta", META(), { color: k.S.onAccent })], { maxWidth: "900px" })])], { backgroundColor: k.S.accent, color: k.S.onAccent, paddingTop: "56px", paddingBottom: "56px", borderBottomWidth: "0px" }, null, null, "Bandeau du titre"),
    k.section([k.W("postcontent", {}), k.W("postterms", {}), k.W("postcomments", {})], { maxWidth: "820px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("lecture-suivie", "Barre de lecture", ["progression", "long format", "lecture"], "Barre de progression en haut, sommaire en tête, texte seul.", (k) => [
    k.W("readingprogress", { position: "top", thickness: 4 }),
    k.section([k.H("{{post.title}}", "1"), k.W("postmeta", META({ showUpdated: true })), k.W("toc", { title: "Sommaire", depth: "2", numbered: false }), k.W("postcontent", {}), k.W("postnav", { sameCategory: true })], { maxWidth: "780px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("image-laterale", "Image latérale", ["image", "deux colonnes", "en-tête"], "En-tête en deux colonnes : titre à gauche, image à droite.", (k) => [
    k.section([k.grid(2, [k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1"), k.T("<p>{{post.excerpt}}</p>", { fontSize: "18px", color: k.S.mute }), k.W("postmeta", META())], { justifyContent: "center" }), k.img("post.image", { maxHeight: "400px" })], { alignItems: "center", gridTemplate: "1fr 1fr" }),
      k.W("postcontent", {}, { maxWidth: "800px", marginLeft: "auto", marginRight: "auto", width: "100%" })], { maxWidth: "1180px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("minimal", "Minimal", ["minimaliste", "sobre", "texte"], "Le titre et le texte, rien d'autre.", (k) => [k.section([k.H("{{post.title}}", "1"), k.W("postcontent", {})], { maxWidth: "700px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("carte", "Article en carte", ["carte", "encadré", "relief"], "Article posé dans une grande carte sur un fond de page.", (k) => [k.section([
    k.card([k.img("post.image", { maxHeight: "380px" }), k.H("{{post.title}}", "1"), k.W("postmeta", META()), k.W("postcontent", {}), k.W("postterms", {}), k.W("sharebuttons", SHARE)], { gap: "20px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", maxWidth: "860px", marginLeft: "auto", marginRight: "auto", width: "100%" })], { backgroundColor: k.S.bg })]),
  L("auteur-en-tete", "Auteur en tête", ["auteur", "signature", "personnel"], "Boîte auteur juste sous le titre, avant le texte.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("authorbox", { heading: "", showLink: false }), k.W("postmeta", META({ showAuthor: false, showComments: true })), k.W("postcontent", {}), k.W("querylist", { title: "Du même auteur", source: "posts", mode: "sameauthor", count: 3, layout: "list" })], { maxWidth: "800px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("partage-flottant", "Partage sur le côté", ["partage", "social", "réseaux"], "Boutons de partage en colonne à gauche du texte.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postmeta", META()),
    k.grid(2, [k.W("sharebuttons", { ...SHARE, size: "40", label: "Partager" }, { position: "sticky", top: "24px" }), k.col([k.img("post.image"), k.W("postcontent", {}), k.W("postcomments", {})], { gap: "24px" })], { gridTemplate: "1fr 6fr", alignItems: "start" })], { maxWidth: "1000px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("fil-ariane", "Fil d'Ariane et catégories", ["navigation", "catégories", "référencement"], "Fil d'Ariane, catégorie en pastilles, texte, articles de la même catégorie.", (k) => [k.section([
    k.W("breadcrumb", CRUMB), k.W("postterms", { show: "both", look: "pills" }), k.H("{{post.title}}", "1"), k.W("postcontent", {}), k.W("querylist", { title: "Dans la même rubrique", source: "posts", mode: "samecategory", count: 4, layout: "list", showImage: false })], { maxWidth: "840px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("resume", "Résumé en exergue", ["résumé", "accroche", "citation"], "Résumé de l'article mis en valeur avant le texte.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postmeta", META()), k.card([k.L("En bref"), k.T("<p>{{post.excerpt}}</p>", { fontSize: "18px" })], { borderLeftWidth: "5px", borderLeftStyle: "solid", borderLeftColor: k.S.accent }), k.W("postcontent", {})], { maxWidth: "780px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("suite", "Lire la suite", ["navigation", "articles liés", "fin d'article"], "Texte puis navigation précédent/suivant et trois articles liés.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postmeta", META()), k.W("postcontent", {}), k.W("postnav", { showImage: true }), k.W("querylist", REL({ title: "Pour continuer", count: 3, showExcerpt: true }))], { maxWidth: "1000px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("abonnement", "Appel à poursuivre", ["appel à l'action", "abonnement", "fin d'article"], "Bloc d'invitation à découvrir le blog après le texte.", (k, env) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postmeta", META()), k.img("post.image"), k.W("postcontent", {}),
    k.card([k.H("Cet article vous a plu ?", "3"), k.T("<p>Modifiez ce texte pour inviter vos lecteurs à vous suivre ou à découvrir d'autres contenus.</p>"), k.row([k.B(env && env.formId ? "Voir le blog" : "S'abonner", "/blog"), k.W("sharebuttons", SHARE)])], { alignItems: "center", textAlign: "center" })], { maxWidth: "800px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("grand-titre", "Grand titre centré", ["titre", "centré", "impact"], "Très grand titre centré, image large, texte étroit.", (k) => [k.section([
    k.W("postterms", { show: "category", look: "text" }, { textAlign: "center" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "60px", lineHeight: 1.1 }), k.W("postmeta", META({ align: "center", separator: "none" })), k.img("post.image", { maxHeight: "520px" }),
    k.col([k.W("postcontent", {}), k.W("authorbox", {})], { maxWidth: NARROW, marginLeft: "auto", marginRight: "auto", width: "100%", gap: "28px" })], { maxWidth: "1100px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
  L("discussion", "Discussion", ["commentaires", "communauté", "échange"], "Texte puis commentaires mis en avant et auteurs à suivre.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postmeta", META({ showComments: true })), k.W("postcontent", {}), k.divider(), k.W("postcomments", { heading: "Votre avis nous intéresse" }), k.W("querylist", REL({ title: "Dans le même esprit", layout: "compact", showImage: false }))], { maxWidth: "760px", marginLeft: "auto", marginRight: "auto", width: "100%" })]),
] };
