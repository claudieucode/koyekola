// Article individuel — lot 2 (25 mises en page) : portfolio, récit, voyage, cuisine, mode et lifestyle, image principale.
const { L, SHARE, CRUMB, META, REL, COL } = require("./shared");

// grille à gabarit libre : 1 colonne sur mobile, tablette réglable
const grid = (tpl, children, st = {}, tabletTpl) => {
  const n = tpl.split(" ").length;
  return { type: "grid", children, styles: { desktop: { columns: n, gridTemplate: tpl, gap: "32px", alignItems: "start", ...st },
    ...(tabletTpl ? { tablet: { columns: tabletTpl.split(" ").length, gridTemplate: tabletTpl } } : {}), mobile: { columns: 1, gridTemplate: "1fr" } } };
};
// section centrée de largeur donnée, marges réduites sur mobile
const wrap = (k, kids, max, st = {}) => k.section(kids, { maxWidth: max, ...st }, null, { paddingTop: "32px", paddingBottom: "32px" });
const M = { fontSize: "34px" };

module.exports = [
  // ---------- Portfolio / étude de cas ----------
  L("portfolio-fiche-projet", "Fiche projet avec image d'ouverture", ["portfolio", "étude de cas", "fiche"], "Image d'ouverture pleine largeur, titre, puis fiche de trois informations sur le projet avant le récit détaillé.", "clair", (k) => [
    k.img("post.image", { maxHeight: "480px", borderRadius: "0px" }, null, { maxHeight: "240px" }),
    wrap(k, [k.W("postterms", { show: "category", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "52px", lineHeight: 1.1 }, { fontSize: "40px" }, M),
      k.dyn("post.excerpt", { fontSize: "20px", color: k.S.mute }),
      grid("1fr 1fr 1fr", [["Réalisé par", "post.author"], ["Publié le", "post.date"], ["Domaine", "post.category"]].map(([l, d]) => k.card([k.L(l), k.dyn(d, { fontWeight: "600" })], { gap: "4px" })), { alignItems: "stretch", gap: "16px" }),
      k.divider(), k.col([k.W("postcontent", {})], COL("740px")), k.W("postnav", {})], "1000px")]),
  L("portfolio-colonne-meta", "Projet avec colonne d'informations", ["portfolio", "projet", "colonne"], "Colonne fine d'informations à gauche du récit du projet, avec partage et étiquettes en bas.", "nuit", (k) => [
    wrap(k, [k.W("breadcrumb", CRUMB), k.H("{{post.title}}", "1", { fontSize: "56px", lineHeight: 1.05 }, { fontSize: "40px" }, M),
      k.img("post.image", { maxHeight: "440px" }),
      grid("1fr 3fr", [k.col([k.L("Auteur"), k.dyn("post.author"), k.L("Date"), k.dyn("post.date"), k.L("Catégorie"), k.dyn("post.category"), k.L("Lecture"), k.dyn("post.reading_time"), k.W("sharebuttons", { ...SHARE, label: "Partager" }, { marginTop: "16px" })], { gap: "6px", position: "sticky", top: "24px" }),
        k.col([k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Mots-clés :" })], { gap: "24px", maxWidth: "740px" })], {}, "1fr")], "1100px")]),
  L("portfolio-autres-projets", "Étude de cas et autres réalisations", ["portfolio", "étude de cas", "réalisations"], "Bandeau de titre coloré, image qui chevauche le texte, puis grille de trois autres réalisations en fin de page.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "54px", textAlign: "center" }, { fontSize: "40px" }, M), k.W("postmeta", META({ align: "center" }))], { alignItems: "center", maxWidth: "860px", margin: "0 auto" })], { justifyContent: "center" })], { paddingTop: "64px", paddingBottom: "104px" }, null, { paddingTop: "40px", paddingBottom: "64px" }),
    k.section([k.img("post.image", { maxHeight: "460px", marginTop: "-72px" }), k.col([k.W("postcontent", {})], COL("740px")),
      k.W("querylist", REL({ title: "Autres réalisations", count: 3, mode: "recent" }))], { maxWidth: "1100px" }, null, { paddingTop: "24px" })]),
  L("projet-titre-collant", "Projet au titre collant", ["portfolio", "éditorial", "sticky"], "Titre et résumé fixés dans une colonne à gauche pendant que le récit défile à droite.", "editorial", (k) => [
    wrap(k, [grid("2fr 3fr", [k.col([k.L("{{post.category}}"), k.H("{{post.title}}", "1", { fontSize: "44px", lineHeight: 1.1 }, null, M), k.divider({ borderTopWidth: "3px" }), k.dyn("post.excerpt", { fontStyle: "italic", fontSize: "18px" }), k.W("postmeta", META({ showCategory: false, separator: "bar" }))], { position: "sticky", top: "24px", gap: "16px" }),
      k.col([k.img("post.image", { maxHeight: "500px" }), k.W("postcontent", {}), k.W("authorbox", {})], { gap: "28px" })], { gap: "56px" }, "1fr")], "1180px")]),

  // ---------- Storytelling ----------
  L("recit-immersif-nuit", "Récit immersif sur fond sombre", ["storytelling", "récit", "immersif"], "Ouverture sombre centrée, grande image, chapô en citation et barre de lecture circulaire pour un récit à suivre.", "nuit", (k) => [
    k.W("readingprogress", { position: "bottom", thickness: 6, shape: "circle" }),
    k.band([k.col([k.L("{{post.category}}", { textAlign: "center" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "58px", lineHeight: 1.08 }, { fontSize: "42px" }, M), k.W("postmeta", META({ showCategory: false, align: "center" })), k.img("post.image", { maxHeight: "520px", marginTop: "16px" }, null, { maxHeight: "260px" })], { maxWidth: "980px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "20px" })], { paddingTop: "56px", paddingBottom: "40px" }),
    wrap(k, [{ type: "quote", props: { text: "{{post.excerpt}}" }, styles: { desktop: { color: k.S.fg, fontFamily: k.S.head, fontSize: "24px", textAlign: "center" } } }, k.col([k.W("postcontent", {}), k.W("postnav", {})], { ...COL("700px"), gap: "32px" })], "900px"),
  ]),
  L("recit-chapitres", "Récit en chapitres avec sommaire", ["storytelling", "chapitres", "sommaire"], "Sommaire numéroté des chapitres à gauche, barre de lecture en haut et récit dans une colonne confortable.", "clair", (k) => [
    k.W("readingprogress", { position: "top", thickness: 4 }),
    wrap(k, [k.W("postterms", { show: "category", look: "text" }), k.H("{{post.title}}", "1", { fontSize: "46px" }, null, M), k.dyn("post.excerpt", { fontSize: "19px", color: k.S.mute }),
      grid("260px 1fr", [k.card([k.W("toc", { title: "Les chapitres", depth: "2", numbered: true })], { position: "sticky", top: "24px" }),
        k.col([k.img("post.image", { maxHeight: "380px" }), k.W("postcontent", {}), k.W("postnav", { showImage: true })], { gap: "28px", maxWidth: "720px" })], { gap: "48px" }, "1fr")], "1080px")]),
  L("temoignage-parcours", "Témoignage de parcours personnel", ["storytelling", "parcours", "témoignage"], "Portrait rond de l'auteur et sa présentation en tête, puis le récit à la première personne et les réactions des lecteurs.", "doux", (k) => [
    wrap(k, [k.col([{ type: "image", props: { src: "{{post.author_avatar}}", alt: "", decorative: true }, styles: { desktop: { width: "120px", height: "120px", objectFit: "cover", borderRadius: "999px" } } }, k.dyn("post.author", { fontWeight: "700", fontSize: "18px" }), k.dyn("post.author_bio", { color: k.S.mute, textAlign: "center", maxWidth: "520px" })], { alignItems: "center", textAlign: "center", gap: "8px" }),
      k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "42px" }, null, M), k.W("postmeta", META({ showAuthor: false, align: "center" })),
      k.card([k.W("postcontent", {})], { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" }, null, { paddingLeft: "16px", paddingRight: "16px" }),
      k.W("postcomments", { heading: "Vos réactions" })], "780px")]),
  L("recit-ouverture-citation", "Récit à l'ouverture en exergue", ["storytelling", "exergue", "éditorial"], "Chapô en grande citation centrée sous un double filet, texte sur deux niveaux de largeur et signature d'auteur en fin de récit.", "editorial", (k) => [
    wrap(k, [k.divider({ borderTopWidth: "4px" }), k.L("{{post.category}} — {{post.date}}", { textAlign: "center" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "50px", lineHeight: 1.1 }, null, M),
      { type: "quote", props: { text: "{{post.excerpt}}", author: "{{post.author}}" }, styles: { desktop: { color: k.S.fg, fontFamily: k.S.head, fontSize: "26px", textAlign: "center", maxWidth: "720px", marginLeft: "auto", marginRight: "auto" } } },
      k.divider({ borderTopWidth: "4px" }), k.img("post.image", { maxHeight: "400px" }), k.col([k.W("postcontent", {}), k.W("authorbox", { heading: "" })], { ...COL("680px"), gap: "32px", fontSize: "19px", lineHeight: 1.8 })], "960px")]),

  // ---------- Voyage ----------
  L("carnet-de-voyage", "Carnet de voyage illustré", ["voyage", "carnet", "souvenirs"], "Image à gauche et titre à droite en ouverture, encadré de conseil, puis récit et suggestions d'autres étapes.", "doux", (k) => [
    wrap(k, [grid("1fr 1fr", [k.img("post.image", { maxHeight: "420px", borderRadius: "28px" }, null, { maxHeight: "240px" }), k.col([k.W("postterms", { show: "category", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "44px" }, null, M), k.dyn("post.excerpt", { color: k.S.mute }), k.W("postmeta", META())], { justifyContent: "center", gap: "14px" })], { alignItems: "center" }),
      { type: "alert", props: { tone: "info", title: "Le conseil du voyageur", text: "Modifiez ce texte pour partager une astuce pratique avec vos lecteurs avant de partir." }, styles: { desktop: { borderRadius: "20px" } } },
      k.col([k.W("postcontent", {})], COL("740px")), k.W("querylist", REL({ title: "Prochaines étapes", count: 3, layout: "cards" }))], "1080px")]),
  L("guide-destination", "Guide de destination avec colonne pratique", ["voyage", "guide", "destination"], "Bannière panoramique, fil d'Ariane, texte à gauche et colonne pratique à droite avec sommaire, partage et lectures proches.", "clair", (k) => [
    k.img("post.image", { maxHeight: "360px", borderRadius: "0px" }, null, { maxHeight: "200px" }),
    wrap(k, [k.W("breadcrumb", CRUMB), grid("5fr 2fr", [k.col([k.H("{{post.title}}", "1", { fontSize: "44px" }, null, M), k.W("postmeta", META()), k.W("postcontent", {}), k.W("postcomments", {})], { gap: "24px" }),
      k.col([k.card([k.W("toc", { title: "Dans ce guide", depth: "3", numbered: false })], { position: "sticky", top: "24px" }), k.card([k.W("sharebuttons", { ...SHARE, label: "Partager ce guide" })]), k.W("querylist", { title: "Autres destinations", source: "posts", mode: "samecategory", count: 4, layout: "compact", showImage: false })], { gap: "20px" })], { gap: "40px" }, "1fr")], "1180px")]),
  L("itineraire-trois-colonnes", "Itinéraire en trois colonnes", ["voyage", "itinéraire", "étapes"], "Étapes numérotées à gauche, récit au centre et colonne de partage et d'articles liés à droite, sur fond de couleur de marque.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "48px" }, null, M), k.W("postmeta", META())], { gap: "12px", maxWidth: "820px" })], { justifyContent: "flex-start" })], { paddingTop: "56px", paddingBottom: "32px" }),
    k.section([grid("1fr 2.4fr 1fr", [k.W("toc", { title: "Les étapes", depth: "2", numbered: true }, { position: "sticky", top: "24px" }), k.col([k.img("post.image", { maxHeight: "380px" }), k.W("postcontent", {})], { gap: "24px" }),
      k.col([k.W("sharebuttons", { ...SHARE, label: "Partager" }), k.W("authorbox", {}), k.W("querylist", REL({ title: "À suivre", count: 2, layout: "compact", showImage: false }))], { gap: "20px" })], { gap: "32px" }, "1fr 2fr")], { maxWidth: "1240px" })]),
  L("voyage-panorama-carte", "Panorama et carte de titre", ["voyage", "panorama", "immersif"], "Grande image panoramique sous laquelle une carte de titre vient se poser, suivie du récit et de la navigation entre étapes.", "nuit", (k) => [
    k.img("post.image", { maxHeight: "620px", borderRadius: "0px" }, null, { maxHeight: "260px" }),
    k.section([k.card([k.W("postterms", { show: "category", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "42px" }, null, M), k.W("postmeta", META()), k.dyn("post.excerpt", { color: k.S.mute })], { marginTop: "-96px", maxWidth: "820px", width: "100%", marginLeft: "auto", marginRight: "auto", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", alignItems: "stretch" }, null, { marginTop: "-48px", paddingLeft: "16px", paddingRight: "16px" }),
      k.col([k.W("postcontent", {}), k.W("postnav", { showImage: true })], { ...COL("720px"), gap: "32px" })], { maxWidth: "1000px" }, null, { paddingTop: "24px" })]),

  // ---------- Cuisine ----------
  L("recette-article", "Recette en article illustré", ["cuisine", "recette", "pas à pas"], "Photo carrée du plat à gauche, titre et informations à droite, astuce du chef, puis déroulé de la recette.", "doux", (k) => [
    wrap(k, [grid("2fr 3fr", [k.img("post.image", { aspectRatio: "1/1", maxHeight: "460px" }), k.col([k.W("postterms", { show: "both", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "44px" }, null, M), k.dyn("post.excerpt", { fontSize: "18px", color: k.S.mute }), k.divider(), k.row([k.dyn("post.reading_time", { fontWeight: "600" }), k.dyn("post.author", { fontWeight: "600" })], { gap: "24px" })], { gap: "14px", justifyContent: "center" })], { alignItems: "center" }),
      { type: "alert", props: { tone: "success", title: "Astuce du chef", text: "Modifiez ce texte pour glisser un conseil de préparation ou de conservation." }, styles: { desktop: { borderRadius: "20px" } } },
      k.col([k.W("postcontent", {}), k.W("sharebuttons", { ...SHARE, label: "Partager la recette" })], { ...COL("740px"), gap: "24px" })], "1000px")]),
  L("chronique-gastronomique", "Chronique gastronomique de revue", ["cuisine", "chronique", "gastronomie"], "Double filet, rubrique et titre centrés, image large puis texte en une seule colonne à lettrine avec signature.", "editorial", (k) => [
    wrap(k, [k.divider({ borderTopWidth: "4px" }), k.L("Chronique — {{post.category}}", { textAlign: "center" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "54px", lineHeight: 1.08 }, null, M),
      k.W("postmeta", META({ showCategory: false, separator: "bar", align: "center" })), k.divider({ borderTopWidth: "1px" }), k.img("post.image", { maxHeight: "480px" }),
      k.col([k.dyn("post.excerpt", { fontStyle: "italic", fontSize: "22px" }), k.W("postcontent", {}), k.divider(), k.W("authorbox", { heading: "La plume" })], { ...COL("680px"), gap: "28px", fontSize: "19px", lineHeight: 1.8 })], "1000px")]),
  L("accord-mets-vins", "Accord mets et vins en deux volets", ["cuisine", "vin", "accord"], "Bandeau de couleur avec titre et vignette ronde, volet deux colonnes de conseils d'accord, puis article complet.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "46px" }, null, M), k.W("postmeta", META({ showCategory: false }))], { maxWidth: "760px", gap: "12px" }),
      k.img("post.image", { width: "180px", height: "180px", borderRadius: "999px", maxHeight: "180px" }, null, { width: "120px", height: "120px" })], { justifyContent: "space-between" })], { paddingTop: "48px", paddingBottom: "48px" }),
    k.section([grid("1fr 1fr", [k.card([k.L("Dans l'assiette"), k.T("<p>Modifiez ce volet pour présenter le plat ou le produit du jour.</p>")], { alignItems: "stretch" }), k.card([k.L("Dans le verre"), k.T("<p>Modifiez ce volet pour suggérer le vin ou la boisson qui l'accompagne.</p>")], { alignItems: "stretch" })], { alignItems: "stretch", gap: "20px" }),
      k.col([k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Thèmes :" })], { ...COL("740px"), gap: "24px" })], { maxWidth: "1000px" })]),

  // ---------- Mode et lifestyle ----------
  L("lookbook-image-collante", "Lookbook à image collante", ["mode", "lookbook", "éditorial"], "Écran partagé : grande image collante à gauche, titre et texte à droite, pour feuilleter comme un lookbook.", "editorial", (k) => [
    k.section([grid("1fr 1fr", [k.img("post.image", { maxHeight: "720px", position: "sticky", top: "24px" }, null, { maxHeight: "320px", position: "static" }),
      k.col([k.L("{{post.category}}"), k.H("{{post.title}}", "1", { fontSize: "46px", lineHeight: 1.1 }, null, M), k.divider({ borderTopWidth: "3px" }), k.W("postmeta", META({ showCategory: false, separator: "bar" })), k.W("postcontent", {}), k.W("postnav", {})], { gap: "24px", paddingTop: "32px" })], { gap: "56px" })], { maxWidth: "1240px" })]),
  L("tendances-saison", "Tendances de saison en grille", ["mode", "tendances", "magazine"], "Titre centré sur bandeau coloré, texte étroit puis quatre inspirations à suivre en grille de cartes.", "marque", (k) => [
    k.band([k.col([{ type: "badge", props: { text: "Tendance", tone: "neutral" } }, k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "56px", lineHeight: 1.1 }, { fontSize: "40px" }, M), k.W("postmeta", META({ align: "center" }))], { alignItems: "center", maxWidth: "860px", width: "100%", marginLeft: "auto", marginRight: "auto" })], { paddingTop: "72px", paddingBottom: "72px" }),
    k.section([k.col([k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Dans l'air du temps :" })], { ...COL("720px"), gap: "24px" }),
      k.W("querylist", REL({ title: "Plus d'inspirations", count: 4, mode: "recent" }))], { maxWidth: "1180px" })]),
  L("bien-etre-serein", "Bien-être serein et centré", ["bien-être", "lifestyle", "apaisant"], "Petite image ronde centrée, titre apaisé, mot d'accueil, texte en carte douce et invitation à partager.", "doux", (k) => [
    wrap(k, [k.col([k.img("post.image", { width: "200px", height: "200px", borderRadius: "999px", maxHeight: "200px" }, null, { width: "140px", height: "140px" }), k.W("postterms", { show: "category", look: "pills" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "40px" }, null, M), k.W("postmeta", META({ showCategory: false, align: "center" }))], { alignItems: "center", textAlign: "center", gap: "16px" }),
      k.card([k.dyn("post.excerpt", { fontStyle: "italic", textAlign: "center" })], { alignItems: "stretch" }),
      k.col([k.W("postcontent", {}), k.divider(), k.row([k.T("<p>Cet article vous a fait du bien ? Faites-le découvrir.</p>"), k.W("sharebuttons", SHARE)], { justifyContent: "center" })], { ...COL("680px"), gap: "24px" })], "820px", { gap: "32px" })]),
  L("decoration-inspiration", "Décoration et inspiration en bannière", ["décoration", "lifestyle", "inspiration"], "Bannière de l'image en tête, titre et informations côte à côte, puis texte large et liste des lectures populaires.", "clair", (k) => [
    k.img("post.image", { maxHeight: "420px", borderRadius: "0px" }, null, { maxHeight: "220px" }),
    wrap(k, [grid("2fr 1fr", [k.col([k.W("postterms", { show: "category", look: "text" }), k.H("{{post.title}}", "1", { fontSize: "46px" }, null, M)], { gap: "8px" }), k.col([k.W("postmeta", META({ showCategory: false })), k.W("sharebuttons", { ...SHARE, size: "32" })], { gap: "12px", alignItems: "flex-start" })], { alignItems: "end", gap: "24px" }, "1fr"), k.divider(),
      k.col([k.W("postcontent", {})], COL("780px")), k.W("querylist", { title: "Les plus lus", source: "posts", mode: "popular", count: 4, layout: "list", showImage: true })], "1000px")]),
  L("lifestyle-nuit-auteur", "Lifestyle de nuit signé par l'auteur", ["lifestyle", "auteur", "sombre"], "Boîte auteur en tête sous le titre, partage collant à gauche et texte sur fond sombre élégant.", "nuit", (k) => [
    wrap(k, [k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "48px", lineHeight: 1.1 }, null, M), k.W("authorbox", { heading: "", showLink: false }),
      grid("1fr 7fr", [k.W("sharebuttons", { ...SHARE, size: "40", label: "" }, { position: "sticky", top: "24px" }), k.col([k.img("post.image", { maxHeight: "420px" }), k.W("postcontent", {}), k.W("postcomments", {})], { gap: "28px" })], { gap: "24px" }, "1fr")], "980px")]),

  // ---------- Article avec image principale ----------
  L("image-principale-gauche", "Image principale à gauche du début de l'article", ["image principale", "à gauche", "deux colonnes"], "Grande image à gauche, titre, informations et chapô à droite, puis texte pleine largeur de lecture.", "clair", (k) => [
    wrap(k, [grid("1fr 1fr", [k.img("post.image", { maxHeight: "480px" }, null, { maxHeight: "260px" }), k.col([k.W("postterms", { show: "category", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "42px" }, null, M), k.dyn("post.excerpt", { color: k.S.mute, fontSize: "18px" }), k.W("postmeta", META({ showCategory: false }))], { gap: "14px", justifyContent: "center" })], { alignItems: "center" }),
      k.divider(), k.col([k.W("postcontent", {}), k.W("authorbox", {})], { ...COL("740px"), gap: "28px" })], "1100px")]),
  L("image-principale-droite", "Image principale à droite du titre", ["image principale", "à droite", "éditorial"], "Titre et chapô à gauche sur les deux tiers, image portrait à droite, filet épais puis texte centré.", "editorial", (k) => [
    wrap(k, [grid("2fr 1fr", [k.col([k.L("{{post.category}}"), k.H("{{post.title}}", "1", { fontSize: "54px", lineHeight: 1.05 }, null, M), k.dyn("post.excerpt", { fontStyle: "italic", fontSize: "20px" }), k.W("postmeta", META({ showCategory: false, separator: "bar" }))], { gap: "18px", justifyContent: "flex-end" }), k.img("post.image", { maxHeight: "460px" }, null, { maxHeight: "260px" })], { alignItems: "end", gap: "40px" }, "1fr"),
      k.divider({ borderTopWidth: "4px" }), k.col([k.W("postcontent", {}), k.W("postnav", {})], { ...COL("700px"), gap: "28px", fontSize: "19px", lineHeight: 1.8 })], "1080px")]),
  L("image-principale-vignette", "Image principale en vignette", ["image principale", "vignette", "sobre"], "Petite vignette carrée à côté du titre pour un article sobre où le texte reste la vedette.", "doux", (k) => [
    wrap(k, [k.row([k.img("post.image", { width: "160px", height: "160px", maxHeight: "160px", borderRadius: "28px" }, null, { width: "96px", height: "96px" }), k.col([k.W("postterms", { show: "category", look: "text" }), k.H("{{post.title}}", "1", { fontSize: "38px" }, null, M), k.W("postmeta", META({ showCategory: false }))], { gap: "8px", flex: "1", minWidth: "240px" })], { alignItems: "center", gap: "24px", flexWrap: "nowrap" }, null, { flexWrap: "wrap" }),
      k.col([k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Étiquettes :" }), k.W("postcomments", {})], { gap: "24px" })], "760px")]),
  L("image-principale-bandeau", "Image principale en bandeau étroit", ["image principale", "bandeau", "panoramique"], "Fine bande d'image sur toute la largeur au-dessus du titre sur fond de marque, avec sommaire horizontal et lecture suivie.", "marque", (k) => [
    k.W("readingprogress", { position: "top", thickness: 4 }),
    k.img("post.image", { height: "240px", maxHeight: "240px", borderRadius: "0px" }, null, { height: "160px", maxHeight: "160px" }),
    k.band([k.inner([k.col([k.H("{{post.title}}", "1", { fontSize: "44px" }, null, M), k.W("postmeta", META())], { gap: "12px", maxWidth: "820px" })], { justifyContent: "flex-start" })], { paddingTop: "40px", paddingBottom: "40px" }),
    k.section([k.W("toc", { title: "Au programme", depth: "2", numbered: false }), k.col([k.W("postcontent", {}), k.W("sharebuttons", SHARE)], { ...COL("720px"), gap: "28px" })], { maxWidth: "900px" })]),
  L("image-principale-fond-nuit", "Image principale sous le titre sur fond sombre", ["image principale", "sombre", "hero"], "Titre en haut sur fond sombre, image en grand format en dessous, texte étroit et articles liés en liste.", "nuit", (k) => [
    k.band([k.col([k.W("breadcrumb", CRUMB), k.H("{{post.title}}", "1", { fontSize: "56px", lineHeight: 1.08 }, { fontSize: "40px" }, M), k.W("postmeta", META()), k.img("post.image", { maxHeight: "540px" }, null, { maxHeight: "260px" })], { maxWidth: "1040px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "20px" })], { paddingTop: "48px", paddingBottom: "40px" }),
    wrap(k, [k.col([k.W("postcontent", {})], COL("720px")), k.W("querylist", REL({ title: "À lire ensuite", layout: "list", count: 3 }))], "900px")]),
];
