// Article individuel — lot 1 (25 mises en page) : éditorial classique, magazine, blog minimaliste, actualités.
const { L, SHARE, CRUMB, META, REL, COL } = require("./shared");
module.exports = [
  // ───────────────────────── Éditorial classique ─────────────────────────
  L("revue-litteraire", "Revue littéraire à filet double", ["éditorial", "revue", "centré"], "En-tête de revue centré avec rubrique, chapô en italique et filets, puis texte en colonne étroite et fiche de l'auteur.", "editorial", (k) => [k.section([
    k.L("{{post.category}}", { textAlign: "center" }),
    k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "52px", lineHeight: 1.1 }, { fontSize: "42px" }, { fontSize: "34px" }),
    k.T("<p>{{post.excerpt}}</p>", { textAlign: "center", fontSize: "20px", fontStyle: "italic", color: k.S.mute, ...COL("640px") }),
    k.divider({ borderTopWidth: "4px", borderTopStyle: "double" }),
    k.W("postmeta", META({ showCategory: false, separator: "bar", align: "center" })),
    k.col([k.W("postcontent", {})], { ...COL("700px"), fontSize: "19px", lineHeight: 1.8 }),
    k.divider(),
    k.W("authorbox", {}, COL("700px"))], { maxWidth: "960px" }, null, { paddingTop: "32px", paddingBottom: "32px" })]),

  L("tribune-signee", "Tribune signée avec marge d'auteur", ["tribune", "signature", "deux colonnes"], "Colonne de marge à gauche avec l'auteur et la date, titre et texte d'opinion à droite.", "editorial", (k) => [k.section([
    k.grid(2, [
      k.col([k.L("Tribune"), k.img("post.author_avatar", { maxHeight: "140px", width: "140px", borderRadius: "999px" }), k.W("postmeta", META({ showCategory: false, showReading: false, separator: "none" })), k.W("authorbox", { showAvatar: false, heading: "", showLink: true })], { gap: "16px", position: "sticky", top: "24px" }, null, { position: "static" }),
      k.col([k.H("{{post.title}}", "1", { fontSize: "44px", lineHeight: 1.15 }, { fontSize: "36px" }, { fontSize: "32px" }), k.divider({ borderTopWidth: "2px" }), k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Mots-clés :", look: "text" })], { gap: "24px" })], { gridTemplate: "1fr 3fr", alignItems: "start" })], { maxWidth: "1100px" })]),

  L("essai-long-progression", "Essai long avec barre de lecture", ["essai", "long format", "progression"], "Barre de progression, sommaire repliable en tête, texte large et navigation entre articles en pied.", "clair", (k) => [
    k.W("readingprogress", { position: "top", thickness: 4 }),
    k.section([
      k.W("breadcrumb", CRUMB),
      k.H("{{post.title}}", "1", { fontSize: "44px" }, { fontSize: "36px" }, { fontSize: "32px" }),
      k.W("postmeta", META({ showUpdated: true })),
      k.W("accordion", { openFirst: false, items: [{ q: "Sommaire de l'essai", a: "Utilisez le sommaire ci-dessous pour naviguer entre les parties de ce texte." }] }),
      k.W("toc", { title: "Dans cet essai", depth: "2", numbered: true }),
      k.W("postcontent", {}),
      k.W("postnav", { sameCategory: true, showImage: true })], { maxWidth: "760px" })]),

  L("chronique-arrondie", "Chronique en carte douce", ["chronique", "carte", "régulier"], "Chronique posée dans une grande carte arrondie : pastille de rubrique, titre, chapô, texte et mots-clés.", "doux", (k) => [k.section([
    k.card([
      k.row([k.W("badge", { text: "Chronique", tone: "primary" }), k.W("postmeta", META({ showCategory: false, separator: "dot" }))], { justifyContent: "space-between" }),
      k.H("{{post.title}}", "1", { fontSize: "38px" }, { fontSize: "32px" }),
      k.dyn("post.excerpt", { fontSize: "19px", color: k.S.mute }),
      k.divider(),
      k.col([k.W("postcontent", {})], COL("680px")),
      k.W("postterms", { show: "tags", look: "pills" }),
      k.W("sharebuttons", { ...SHARE, label: "Faire suivre" })], { gap: "24px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", ...COL("820px") }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: "24px", paddingBottom: "24px" })], { maxWidth: "1180px" })]),

  L("lettre-ouverte-exergue", "Lettre ouverte à grande citation", ["lettre ouverte", "citation", "typographie"], "Le chapô devient une grande citation d'ouverture, le titre est plus discret, le texte s'écoule en colonne unique.", "editorial", (k) => [k.section([
    k.W("quote", { text: "{{post.excerpt}}", author: "" }, { fontSize: "28px", fontStyle: "italic", textAlign: "center", ...COL("760px") }, { fontSize: "22px" }),
    k.H("{{post.title}}", "1", { fontSize: "34px", textAlign: "center" }),
    k.W("postmeta", META({ showCategory: false, separator: "bar", align: "center" })),
    k.col([k.W("postcontent", {}), k.divider({ borderTopWidth: "3px", borderTopStyle: "double" }), k.W("postnav", {})], { ...COL("700px"), gap: "28px" })], { maxWidth: "1000px" })]),

  L("critique-trois-colonnes", "Critique en fiche à trois colonnes", ["critique", "fiche", "image"], "Fiche d'en-tête en trois colonnes : vignette, titre et chapô, informations ; le texte vient dessous.", "clair", (k) => [k.section([
    k.grid(3, [
      k.img("post.image", { maxHeight: "260px" }),
      k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "36px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { color: k.S.mute })], { justifyContent: "center" }),
      k.card([k.L("Fiche"), k.W("postmeta", META({ separator: "none" })), k.W("authorbox", { showBio: false, heading: "", showLink: false })], { alignSelf: "stretch" })], { gridTemplate: "1fr 2fr 1fr", alignItems: "stretch" }),
    k.col([k.W("postcontent", {}), k.W("postcomments", {})], { ...COL("740px"), gap: "28px" })], { maxWidth: "1100px" })]),

  L("essai-deux-marges", "Essai à deux marges latérales", ["essai", "marges", "sommaire"], "Texte central entouré de deux marges collantes : informations et partage à gauche, sommaire à droite.", "editorial", (k) => [k.section([
    k.col([k.L("{{post.category}}", { textAlign: "center" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "46px" }, { fontSize: "36px" }, { fontSize: "32px" })], { ...COL("900px") }),
    k.grid(3, [
      k.col([k.W("postmeta", META({ showCategory: false, separator: "none" })), k.W("sharebuttons", { ...SHARE, label: "Partager" })], { position: "sticky", top: "24px", gap: "16px" }, null, { position: "static" }),
      k.col([k.W("postcontent", {}), k.W("authorbox", {})], { gap: "28px" }),
      k.W("toc", { title: "Plan", depth: "3", numbered: false }, { position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "1fr 3fr 1fr", alignItems: "start" })], { maxWidth: "1180px" })]),

  // ───────────────────────── Magazine ─────────────────────────
  L("couverture-nuit", "Couverture pleine largeur sur fond de nuit", ["couverture", "image", "sombre"], "Grande image de couverture en tête de bande, titre en dessous sur fond sombre, puis texte et articles liés en cartes.", "nuit", (k) => [
    k.band([k.img("post.image", { maxHeight: "560px", borderRadius: "0px" }),
      k.inner([k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "56px", lineHeight: 1.08 }, { fontSize: "44px" }, { fontSize: "34px" }), k.dyn("post.excerpt", { fontSize: "20px", color: k.S.mute })], { maxWidth: "860px" })], { paddingTop: "32px" })], { paddingLeft: "0px", paddingRight: "0px", paddingTop: "0px", paddingBottom: "40px", gap: "0px" }, null, null, "Couverture"),
    k.section([k.W("postmeta", META({ showComments: true })), k.W("postcontent", {}), k.W("sharebuttons", SHARE), k.W("querylist", REL({ count: 3, showExcerpt: true }))], { maxWidth: "860px" })]),

  L("reportage-couleur", "Reportage grand format sur fond de marque", ["reportage", "couleur", "centré"], "Bande de couleur avec très grand titre centré, image large en flux puis texte et auteur sur fond blanc cassé.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("badge", { text: "Reportage", tone: "neutral" }), k.H("{{post.title}}", "1", { fontSize: "60px", textAlign: "center", lineHeight: 1.05 }, { fontSize: "46px" }, { fontSize: "34px" }), k.W("postmeta", META({ align: "center", separator: "bar" }))], { alignItems: "center", maxWidth: "980px" })], { justifyContent: "center" })], { paddingTop: "72px", paddingBottom: "72px" }, { paddingTop: "48px", paddingBottom: "48px" }, null, "Titre du reportage"),
    k.section([k.img("post.image", { maxHeight: "540px" }), k.col([k.W("postcontent", {}), k.W("authorbox", {}), k.W("querylist", REL({ title: "Autres reportages", layout: "slider", count: 5 }))], { gap: "32px" })], { maxWidth: "1000px" })]),

  L("dossier-sommaire", "Sommaire de dossier avec cartes liées", ["dossier", "sommaire", "magazine"], "Sommaire collant à gauche, texte à droite et rubrique de la même catégorie en cartes pleine largeur.", "nuit", (k) => [k.section([
    k.W("breadcrumb", CRUMB),
    k.row([k.W("badge", { text: "Dossier", tone: "primary" }), k.W("postterms", { show: "category", look: "text" })]),
    k.H("{{post.title}}", "1", { fontSize: "48px" }, { fontSize: "38px" }, { fontSize: "32px" }),
    k.grid(2, [
      k.col([k.card([k.W("toc", { title: "Au sommaire", depth: "3", numbered: true })], { position: "sticky", top: "24px" }, null, { position: "static" }), k.W("sharebuttons", { ...SHARE, label: "Partager le dossier" })], { gap: "20px" }),
      k.col([k.W("postmeta", META()), k.W("postcontent", {}), k.W("postterms", { show: "tags" })], { gap: "24px" })], { gridTemplate: "1fr 3fr", alignItems: "start" }),
    k.W("querylist", { title: "Dans la même rubrique", source: "posts", mode: "samecategory", count: 3, layout: "cards", showExcerpt: true })], { maxWidth: "1180px" })]),

  L("une-duo-arrondi", "Une de magazine en duo arrondi", ["une", "duo", "arrondi"], "En-tête en deux moitiés : grande image arrondie et bloc titre, chapô et signature, suivi du texte et des autres articles de l'auteur.", "doux", (k) => [k.section([
    k.grid(2, [
      k.img("post.image", { maxHeight: "460px" }),
      k.card([k.W("postterms", { show: "category", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "40px", lineHeight: 1.15 }, { fontSize: "34px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "18px", color: k.S.mute }), k.divider(), k.W("authorbox", { heading: "", showBio: false, showLink: false }), k.W("postmeta", META({ showAuthor: false, showCategory: false }))], { justifyContent: "center", gap: "16px" })], { gridTemplate: "1fr 1fr", alignItems: "stretch" }),
    k.col([k.W("postcontent", {}), k.W("querylist", { title: "Du même auteur", source: "posts", mode: "sameauthor", count: 3, layout: "list" })], { ...COL("780px"), gap: "32px" })], { maxWidth: "1180px" })]),

  L("portfolio-plein-ecran", "Portfolio photo en ouverture", ["photo", "portfolio", "image"], "Image immense en ouverture, trois repères en bandeau (rubrique, auteur, date), titre puis texte étroit.", "clair", (k) => [
    k.img("post.image", { maxHeight: "680px", borderRadius: "0px" }),
    k.section([
      k.grid(3, [k.card([k.L("Rubrique"), k.dyn("post.category", { fontWeight: "600" })]), k.card([k.L("Signé"), k.dyn("post.author", { fontWeight: "600" })]), k.card([k.L("Publié le"), k.dyn("post.date", { fontWeight: "600" })])], { alignItems: "stretch" }),
      k.H("{{post.title}}", "1", { fontSize: "44px", textAlign: "center" }, { fontSize: "36px" }, { fontSize: "32px" }),
      k.col([k.W("postcontent", {}), k.W("postnav", { showImage: true })], { ...COL("720px"), gap: "28px" })], { maxWidth: "1100px" })]),

  L("interview-questions", "Interview avec points clés", ["interview", "questions", "repliable"], "Chapô en citation, texte de l'interview et accordéon de repères génériques à compléter, auteur en pied de page.", "doux", (k) => [k.section([
    k.W("badge", { text: "Interview", tone: "success" }),
    k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "34px" }, { fontSize: "32px" }),
    k.W("quote", { text: "{{post.excerpt}}", author: "{{post.author}}" }, { fontSize: "20px" }),
    k.W("postmeta", META({ showCategory: false })),
    k.W("postcontent", {}),
    k.W("accordion", { single: true, icon: "plus", items: [{ q: "À retenir", a: "Modifiez ce bloc pour résumer en quelques lignes les idées fortes de l'échange." }, { q: "Pour aller plus loin", a: "Ajoutez ici des pistes de lecture ou des liens vers d'autres contenus du site." }] }),
    k.W("authorbox", {})], { maxWidth: "800px" })]),

  L("numero-special-asymetrique", "Numéro spécial asymétrique", ["numéro spécial", "asymétrique", "couleur"], "Bande de couleur partagée en deux tiers pour le titre et un tiers pour l'image verticale, puis texte et liste compacte de lectures.", "marque", (k) => [
    k.band([k.inner([k.grid(2, [
      k.col([k.W("badge", { text: "Numéro spécial", tone: "neutral" }), k.H("{{post.title}}", "1", { fontSize: "54px", lineHeight: 1.08 }, { fontSize: "40px" }, { fontSize: "34px" }), k.dyn("post.excerpt", { fontSize: "19px" }), k.W("postmeta", META())], { justifyContent: "center" }),
      k.img("post.image", { maxHeight: "460px" })], { gridTemplate: "2fr 1fr", alignItems: "center", width: "100%" })], { display: "block" })], { paddingTop: "56px", paddingBottom: "56px" }, null, null, "En-tête du numéro"),
    k.section([k.W("postcontent", {}), k.W("sharebuttons", SHARE), k.W("querylist", { title: "Dans ce numéro", source: "posts", mode: "recent", count: 5, layout: "compact", showImage: false })], { maxWidth: "800px" })]),

  // ───────────────────────── Blog minimaliste ─────────────────────────
  L("colonne-nue", "Colonne nue sans fioritures", ["minimaliste", "texte", "sobre"], "Une seule colonne étroite : date discrète, titre, texte et lien de retour au blog, sans aucun autre élément.", "clair", (k) => [k.section([
    k.dyn("post.date", { fontSize: "14px", color: k.S.mute }),
    k.H("{{post.title}}", "1", { fontSize: "36px" }, { fontSize: "32px" }),
    k.W("postcontent", {}),
    k.divider(),
    k.LINK("← Retour au blog", "/blog")], { maxWidth: "640px" }, null, { paddingTop: "32px" })]),

  L("notes-breves-douces", "Notes brèves en petite carte", ["notes", "bref", "carte"], "Une note courte dans une petite carte arrondie : pastille, titre modeste, texte et partage, puis les notes récentes en compact.", "doux", (k) => [k.section([
    k.card([
      k.row([k.W("badge", { text: "Note", tone: "neutral" }), k.dyn("post.date", { fontSize: "14px", color: k.S.mute })]),
      k.H("{{post.title}}", "1", { fontSize: "32px" }),
      k.W("postcontent", {}),
      k.W("sharebuttons", { ...SHARE, size: "28", label: "" })], { gap: "20px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "20px", paddingRight: "20px" }),
    k.W("querylist", { title: "Autres notes", source: "posts", mode: "recent", count: 4, layout: "compact", showImage: false, showDate: true, excludeCurrent: true })], { maxWidth: "640px" })]),

  L("journal-date-marge", "Journal personnel à date en marge", ["journal", "personnel", "date"], "Journal intime : la date occupe une étroite marge gauche, le titre et le texte se placent à droite, sans image ni fiche.", "clair", (k) => [k.section([
    k.grid(2, [
      k.col([k.dyn("post.date", { fontWeight: "700", fontSize: "18px" }), k.dyn("post.reading_time", { fontSize: "14px", color: k.S.mute })], { gap: "4px", borderRightWidth: "2px", borderRightStyle: "solid", borderRightColor: k.S.line, paddingRight: "16px" }, null, { borderRightWidth: "0px", paddingRight: "0px" }),
      k.col([k.H("{{post.title}}", "1", { fontSize: "34px" }, { fontSize: "32px" }), k.W("postcontent", {}), k.W("postterms", { show: "tags", look: "text", label: "Mots :" })], { gap: "20px" })], { gridTemplate: "1fr 5fr", alignItems: "start" })], { maxWidth: "860px" })]),

  L("newsletter-archivee", "Newsletter archivée avec invitation", ["newsletter", "archive", "abonnement"], "Bandeau signalant une lettre archivée, titre centré, texte et grand encadré final invitant à poursuivre la lecture.", "marque", (k, env) => [
    k.band([k.inner([k.col([k.W("alert", { tone: "info", title: "Lettre archivée", text: "Vous lisez une ancienne édition de la lettre, publiée le {{post.date}}." }, { alignSelf: "stretch" })], { maxWidth: "720px" })], { justifyContent: "center" })], { paddingTop: "24px", paddingBottom: "24px" }, null, null, "Rappel d'archive"),
    k.section([
      k.H("{{post.title}}", "1", { fontSize: "38px", textAlign: "center" }, { fontSize: "32px" }),
      k.col([k.W("postcontent", {}), k.card([k.H("Cet article vous a plu ?", "3"), k.T("<p>Modifiez ce texte pour inviter vos lecteurs à recevoir les prochaines éditions ou à découvrir le blog.</p>"), k.B(env && env.formId ? "Voir le blog" : "Découvrir le blog", "/blog")], { alignItems: "center", textAlign: "center" })], { ...COL("680px"), gap: "32px" })], { maxWidth: "1000px" })]),

  L("carnet-nuit-marge", "Carnet de nuit à marge d'annotations", ["carnet", "sombre", "notes"], "Texte large sur fond sombre avec une fine marge d'annotations à droite pour l'étiquette, la durée de lecture et le partage.", "nuit", (k) => [k.section([
    k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "32px" }),
    k.grid(2, [
      k.W("postcontent", {}),
      k.col([k.L("Annotations"), k.W("postmeta", META({ showAuthor: false, showDate: false, separator: "none" })), k.W("postterms", { show: "tags", look: "text" }), k.W("sharebuttons", { ...SHARE, size: "28", label: "" })], { gap: "14px", borderLeftWidth: "1px", borderLeftStyle: "solid", borderLeftColor: k.S.line, paddingLeft: "16px", position: "sticky", top: "24px" }, null, { borderLeftWidth: "0px", paddingLeft: "0px", position: "static" })], { gridTemplate: "4fr 1fr", alignItems: "start" })], { maxWidth: "1000px" })]),

  L("page-de-garde-sobre", "Page de garde sobre et centrée", ["centré", "sobre", "serif"], "Titre court centré sous un simple filet, texte en colonne mince et signature d'auteur en pied, sans image.", "editorial", (k) => [k.section([
    k.divider({ borderTopWidth: "1px" }),
    k.H("{{post.title}}", "1", { fontSize: "34px", textAlign: "center" }, { fontSize: "32px" }),
    k.W("postmeta", META({ showCategory: false, showReading: false, align: "center", separator: "bar" })),
    k.col([k.W("postcontent", {}), k.divider(), k.W("authorbox", { showBio: false, heading: "", showLink: false }), k.W("sharebuttons", { ...SHARE, label: "" })], { ...COL("620px"), gap: "24px" })], { maxWidth: "900px" })]),

  // ───────────────────────── Actualités ─────────────────────────
  L("depeche-agence", "Dépêche d'agence compacte", ["dépêche", "actualité", "bref"], "Étiquette « Dépêche », horodatage, titre serré, chapô en gras puis texte et mots-clés : le format le plus direct.", "clair", (k) => [k.section([
    k.row([k.W("badge", { text: "Dépêche", tone: "error" }), k.dyn("post.date", { fontSize: "14px", color: k.S.mute }), k.dyn("post.category", { fontSize: "14px", color: k.S.mute })], { gap: "12px" }),
    k.H("{{post.title}}", "1", { fontSize: "36px", lineHeight: 1.15 }, { fontSize: "32px" }),
    k.dyn("post.excerpt", { fontWeight: "700", fontSize: "18px" }),
    k.divider(),
    k.W("postcontent", {}),
    k.W("postterms", { show: "tags", label: "Sujets :" })], { maxWidth: "720px" }, null, { paddingTop: "32px" })]),

  L("a-la-une-redaction", "Article de rédaction à la une", ["à la une", "rédaction", "bandeau"], "Bandeau « À la une » sur fond de marque, image et chapô côte à côte, texte avec colonne des dernières actualités.", "marque", (k) => [
    k.band([k.inner([k.row([k.W("badge", { text: "À la une", tone: "neutral" }), k.W("postterms", { show: "category", look: "text" })], { width: "100%" }),
      k.grid(2, [k.col([k.H("{{post.title}}", "1", { fontSize: "46px", lineHeight: 1.1 }, { fontSize: "38px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "19px" }), k.W("postmeta", META({ showCategory: false }))], { justifyContent: "center" }), k.img("post.image", { maxHeight: "380px" })], { gridTemplate: "3fr 2fr", alignItems: "center", width: "100%" })], { display: "block" })], { paddingTop: "40px", paddingBottom: "40px" }, null, null, "Bandeau à la une"),
    k.section([k.grid(2, [
      k.col([k.W("postcontent", {}), k.W("authorbox", {}), k.W("postnav", {})], { gap: "28px" }),
      k.col([k.W("querylist", { title: "Dernières actualités", source: "posts", mode: "recent", count: 5, layout: "compact", showImage: false, excludeCurrent: true }), k.W("sharebuttons", { ...SHARE, label: "Partager" })], { gap: "24px", position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "3fr 1fr", alignItems: "start" })], { maxWidth: "1100px" })]),

  L("fil-en-direct", "Fil d'actualité en direct", ["live", "direct", "fil"], "Alerte « En direct », barre de lecture fine, texte principal et colonne sombre des dernières publications.", "nuit", (k) => [
    k.W("readingprogress", { position: "bottom", thickness: 3 }),
    k.section([
      k.W("alert", { tone: "warning", title: "En direct", text: "Cette page peut être mise à jour : revenez la consulter pour suivre les derniers développements." }),
      k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "34px" }, { fontSize: "32px" }),
      k.W("postmeta", META({ showUpdated: true, showComments: true, separator: "bar" })),
      k.grid(2, [
        k.col([k.W("postcontent", {}), k.W("postcomments", { heading: "Réactions" })], { gap: "28px" }),
        k.card([k.W("querylist", { title: "Fil des publications", source: "posts", mode: "recent", count: 6, layout: "list", showImage: false, showDate: true, excludeCurrent: true })], { position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "2fr 1fr", alignItems: "start" })], { maxWidth: "1180px" })]),

  L("flash-info-douce", "Brève flash arrondie", ["brève", "flash", "partage"], "Brève ultra courte : pastille, titre, texte puis ligne de partage et deux brèves liées en liste.", "doux", (k) => [k.section([
    k.row([k.W("badge", { text: "Brève", tone: "warning" }), k.dyn("post.date", { fontSize: "14px", color: k.S.mute })]),
    k.H("{{post.title}}", "1", { fontSize: "32px" }),
    k.W("postcontent", {}),
    k.row([k.W("sharebuttons", { ...SHARE, label: "Relayer" }), k.B("Toute l'actualité", "/blog", "outline")], { justifyContent: "space-between" }),
    k.W("querylist", { title: "Autres brèves", source: "posts", mode: "samecategory", count: 2, layout: "list", showImage: false, excludeCurrent: true })], { maxWidth: "620px" })]),

  L("communique-institutionnel", "Communiqué institutionnel officiel", ["communiqué", "institutionnel", "officiel"], "Fil d'Ariane, en-tête de communiqué sobre avec encadré de publication à droite, texte puis navigation entre communiqués.", "editorial", (k) => [k.section([
    k.W("breadcrumb", CRUMB),
    k.divider({ borderTopWidth: "4px", borderTopStyle: "double" }),
    k.grid(2, [
      k.col([k.W("badge", { text: "Communiqué", tone: "neutral" }), k.H("{{post.title}}", "1", { fontSize: "40px", lineHeight: 1.15 }, { fontSize: "34px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontStyle: "italic", color: k.S.mute })], { gap: "16px" }),
      k.card([k.L("Publication"), k.dyn("post.date", { fontWeight: "700" }), k.W("authorbox", { heading: "", showBio: false, showLink: false }), k.W("sharebuttons", { ...SHARE, size: "28", label: "" })], { alignSelf: "stretch" })], { gridTemplate: "3fr 1fr", alignItems: "start" }),
    k.divider(),
    k.col([k.W("postcontent", {}), k.W("postnav", { prevLabel: "Communiqué précédent", nextLabel: "Communiqué suivant" })], { ...COL("760px"), gap: "28px" })], { maxWidth: "1000px" })]),
];
