// Article individuel — lot 4 (25 mises en page) : image pleine largeur, auteur, contenus associés, navigation, partage, commentaires, progression de lecture, formats spéciaux.
const { L, SHARE, CRUMB, META, REL, COL } = require("./shared");

const NO_PAD = { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px", borderBottomWidth: "0px" };
// carte claire posée sur un fond de marque (le texte garde sa lisibilité)
const LIGHT = { backgroundColor: "token:background", color: "token:text" };
const BIG = { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" };
const BIG_T = { paddingLeft: "20px", paddingRight: "20px" };
const BIG_M = { paddingLeft: "16px", paddingRight: "16px" };

module.exports = [
  // ───────────────────────── Image en pleine largeur ─────────────────────────
  L("image-bandeau-revue", "Bandeau photo puis titre en deux temps", ["image pleine largeur", "bandeau", "revue"],
    "Grande photo en bandeau sur toute la largeur, puis titre à gauche et chapô avec informations à droite.", "editorial", (k) => [
      k.band([k.img("post.image", { maxHeight: "560px", borderRadius: "0px" })], { ...NO_PAD, borderBottomWidth: "4px" }, null, null, "Bandeau photo"),
      k.section([
        k.grid(2, [
          k.col([k.W("postterms", { show: "category", look: "text" }), k.H("{{post.title}}", "1", { fontSize: "52px", lineHeight: 1.1 }, { fontSize: "40px" }, { fontSize: "32px" })], { gap: "16px" }),
          k.col([k.dyn("post.excerpt", { fontSize: "19px", fontStyle: "italic" }), k.W("postmeta", META({ separator: "bar" }))], { gap: "16px" }),
        ], { gridTemplate: "3fr 2fr", alignItems: "end" }),
        k.divider({ borderTopWidth: "3px" }),
        k.col([k.W("postcontent", {})], { ...COL("720px"), fontSize: "19px", lineHeight: 1.8 }),
        k.W("authorbox", {}, COL("720px")),
      ], { maxWidth: "1180px" }),
    ]),

  L("plein-ecran-nuit", "Photo plein écran sur fond nuit", ["héros", "plein écran", "immersif", "sombre"],
    "Photo très haute sur toute la largeur en tête, puis un bandeau sombre centré pour le titre et la lecture.", "nuit", (k) => [
      k.band([k.img("post.image", { maxHeight: "78vh", borderRadius: "0px" })], NO_PAD, null, null, "Photo plein écran"),
      k.band([k.inner([k.col([
        k.W("postterms", { show: "category", look: "pills" }),
        k.H("{{post.title}}", "1", { fontSize: "56px", lineHeight: 1.1, textAlign: "center" }, { fontSize: "44px" }, { fontSize: "34px" }),
        k.W("postmeta", META({ align: "center" })),
      ], { alignItems: "center", textAlign: "center", maxWidth: "860px", gap: "20px" })], { justifyContent: "center" })], { backgroundColor: k.S.alt, paddingTop: "56px", paddingBottom: "56px" }, null, null, "Titre sur fond nuit"),
      k.section([k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Étiquettes :" }), k.W("postnav", { showImage: true })], { maxWidth: "740px" }),
    ]),

  L("panorama-colonne-infos", "Panorama court et colonne d'informations", ["image panoramique", "métadonnées en colonne", "sommaire"],
    "Image panoramique basse sous le titre, puis une colonne collante d'informations et de sommaire à côté du texte.", "clair", (k) => [
      k.section([
        k.W("breadcrumb", CRUMB),
        k.H("{{post.title}}", "1", { fontSize: "44px" }, { fontSize: "36px" }, { fontSize: "32px" }),
        k.img("post.image", { maxHeight: "260px" }),
        k.grid(2, [
          k.col([k.W("postterms", { show: "both", look: "pills" }), k.W("postmeta", META({ separator: "none" })), k.divider(), k.W("toc", { title: "Au programme", depth: "2", numbered: false }), k.W("sharebuttons", { ...SHARE, label: "Partager", size: "32" })], { position: "sticky", top: "24px", gap: "16px" }),
          k.col([k.W("postcontent", {}), k.W("postcomments", {})], { gap: "32px" }),
        ], { gridTemplate: "1fr 3fr", alignItems: "start" }),
      ], { maxWidth: "1100px" }),
    ]),

  // ───────────────────────── Auteur mis en avant ─────────────────────────
  L("signature-journaliste", "Signature de l'auteur en tête d'article", ["auteur", "signature", "portrait rond"],
    "Une ligne de signature avec le portrait rond de l'auteur au-dessus du titre, puis un chapô et le texte.", "editorial", (k) => [
      k.section([
        k.row([
          k.img("post.author_avatar", { width: "72px", height: "72px", borderRadius: "999px", flexShrink: 0 }),
          k.col([k.L("Par"), k.dyn("post.author", { fontSize: "22px", fontWeight: "700" }), k.dyn("post.date", { fontSize: "14px", color: k.S.mute })], { gap: "2px" }),
        ], { gap: "20px" }),
        k.divider({ borderTopWidth: "4px" }),
        k.H("{{post.title}}", "1", { fontSize: "50px", lineHeight: 1.1 }, { fontSize: "40px" }, { fontSize: "32px" }),
        k.dyn("post.excerpt", { fontSize: "20px", color: k.S.mute }),
        k.W("postcontent", {}),
        k.divider(),
        k.W("authorbox", { heading: "L'auteur" }),
      ], { maxWidth: "760px" }),
    ]),

  L("portrait-lateral-auteur", "Portrait de l'auteur dans la colonne latérale", ["auteur", "portrait", "colonne collante"],
    "Colonne collante à gauche avec la photo, le nom et la présentation de l'auteur, texte de l'article à droite.", "clair", (k) => [
      k.section([
        k.grid(2, [
          k.card([
            k.img("post.author_avatar", { width: "144px", height: "144px", borderRadius: "999px", marginLeft: "auto", marginRight: "auto" }),
            k.dyn("post.author", { textAlign: "center", fontSize: "20px", fontWeight: "700" }),
            k.dyn("post.author_bio", { textAlign: "center", fontSize: "15px", color: k.S.mute }),
            k.B("Tous ses articles", "/blog", "outline", { textAlign: "center" }),
          ], { position: "sticky", top: "24px", alignItems: "stretch" }),
          k.col([
            k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "36px" }, { fontSize: "32px" }),
            k.W("postmeta", META({ showAuthor: false })), k.img("post.image", { maxHeight: "400px" }), k.W("postcontent", {}), k.W("postcomments", {}),
          ], { gap: "24px", maxWidth: "760px" }),
        ], { gridTemplate: "1fr 3fr", alignItems: "start" }),
      ], { maxWidth: "1100px" }),
    ]),

  L("bandeau-auteur-marque", "Bandeau de marque avec carte auteur", ["auteur", "bandeau", "couleur de marque"],
    "Bandeau en couleur de marque : titre et chapô à gauche, carte de présentation de l'auteur à droite, texte dans une carte claire.", "marque", (k) => [
      k.band([k.inner([
        k.grid(2, [
          k.col([k.W("breadcrumb", CRUMB), k.H("{{post.title}}", "1", { fontSize: "46px" }, { fontSize: "38px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "18px" })], { gap: "16px" }),
          k.card([k.W("authorbox", { heading: "", showLink: true })], LIGHT),
        ], { gridTemplate: "3fr 2fr", alignItems: "center", width: "100%" }),
      ])], { paddingTop: "56px", paddingBottom: "56px" }, null, null, "Bandeau auteur"),
      k.section([
        k.card([k.W("postmeta", META({ showAuthor: false })), k.W("postcontent", {})], { ...LIGHT, ...BIG, gap: "24px" }, BIG_T, BIG_M),
      ], { maxWidth: "860px" }),
    ]),

  // ───────────────────────── Contenus associés ─────────────────────────
  L("fin-cartes-fond", "Fin d'article avec bande de trois cartes", ["articles liés", "cartes", "fin d'article"],
    "Lecture classique puis une bande pleine largeur au fond contrasté qui présente trois articles liés en cartes.", "clair", (k) => [
      k.section([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1"), k.W("postmeta", META()), k.img("post.image", { maxHeight: "420px" }), k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Étiquettes :" })], { maxWidth: "780px" }),
      k.band([k.inner([k.col([k.W("querylist", REL({ title: "Dans le même esprit", count: 3, showExcerpt: true, showDate: true }))], { width: "100%" })])], { backgroundColor: k.S.alt, paddingTop: "56px", paddingBottom: "56px" }, null, null, "Articles liés"),
    ]),

  L("fin-trois-listes-nuit", "Trois mini-listes en pied d'article", ["articles populaires", "compact", "trois colonnes"],
    "Texte puis trois colonnes de titres : liés, populaires et récents, pour poursuivre la visite sans image.", "nuit", (k) => [
      k.section([
        k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.W("postmeta", META()), k.W("postcontent", {}), k.divider(),
        k.grid(3, [
          k.W("querylist", { title: "Du même sujet", source: "posts", mode: "related", count: 4, layout: "compact", showImage: false }),
          k.W("querylist", { title: "Les plus lus", source: "posts", mode: "popular", count: 4, layout: "compact", showImage: false }),
          k.W("querylist", { title: "Les derniers publiés", source: "posts", mode: "recent", count: 4, layout: "compact", showImage: false }),
        ], { alignItems: "start" }),
      ], { maxWidth: "980px" }),
    ]),

  L("meme-auteur-defilement", "Autres écrits du même auteur en défilement", ["du même auteur", "carrousel", "fin d'article"],
    "Texte dans une grande carte arrondie, présentation de l'auteur, puis un carrousel de ses autres articles.", "doux", (k) => [
      k.section([
        k.card([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("postmeta", META()), k.W("postcontent", {})], { backgroundColor: k.S.alt, paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", gap: "20px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: "24px", paddingBottom: "24px" }),
        k.W("authorbox", { heading: "" }),
        k.W("querylist", { title: "Du même auteur", source: "posts", mode: "sameauthor", count: 6, layout: "slider", showExcerpt: false, showImage: true }),
      ], { maxWidth: "860px" }),
    ]),

  // ───────────────────────── Navigation entre articles ─────────────────────────
  L("navigation-bandeau-haut", "Navigation précédent et suivant en bandeau supérieur", ["navigation", "bandeau", "précédent suivant"],
    "Un bandeau de marque en tête avec le fil d'Ariane et la navigation entre articles, avant le titre et le texte.", "marque", (k) => [
      k.band([k.inner([k.col([k.W("breadcrumb", CRUMB), k.W("postnav", { prevLabel: "Plus ancien", nextLabel: "Plus récent" })], { width: "100%", gap: "12px" })])], { paddingTop: "16px", paddingBottom: "16px" }, null, null, "Bandeau de navigation"),
      k.section([
        k.H("{{post.title}}", "1", { fontSize: "46px" }, { fontSize: "38px" }, { fontSize: "32px" }), k.W("postmeta", META()),
        k.card([k.W("postcontent", {})], { ...LIGHT, ...BIG }, BIG_T, BIG_M),
      ], { maxWidth: "820px" }),
    ]),

  L("navigation-cartes-images", "Suite de lecture en deux cartes avec images", ["navigation", "cartes", "images"],
    "Après le texte, deux grandes cartes arrondies : la navigation précédent/suivant avec visuels et les articles de la rubrique.", "doux", (k) => [
      k.section([
        k.img("post.image", { maxHeight: "380px" }),
        k.H("{{post.title}}", "1", { fontSize: "40px", textAlign: "center" }, { fontSize: "36px" }, { fontSize: "32px" }),
        k.W("postmeta", META({ align: "center" })),
        k.W("postcontent", {}, COL("720px")),
        k.grid(2, [
          k.card([k.L("Continuer la lecture"), k.W("postnav", { showImage: true, prevLabel: "Avant", nextLabel: "Après" })], { backgroundColor: k.S.alt }),
          k.card([k.L("Dans la même rubrique"), k.W("querylist", { title: "", source: "posts", mode: "samecategory", count: 3, layout: "compact", showImage: false })], { backgroundColor: k.S.alt }),
        ], { gridTemplate: "3fr 2fr", alignItems: "stretch" }),
      ], { maxWidth: "980px" }),
    ]),

  L("navigation-pied-collant", "Barre de navigation collée en bas de page", ["navigation", "pied collant", "lecture longue"],
    "Un bandeau collant en bas de l'écran rappelle l'article précédent et suivant pendant toute la lecture.", "nuit", (k) => [
      k.section([k.W("breadcrumb", CRUMB), k.H("{{post.title}}", "1"), k.W("postmeta", META({ showUpdated: true })), k.img("post.image", { maxHeight: "400px" }), k.W("postcontent", {}), k.W("authorbox", {})], { maxWidth: "760px", paddingBottom: "24px" }),
      k.band([k.inner([k.W("postnav", { prevLabel: "Précédent", nextLabel: "Suivant", sameCategory: true })], { justifyContent: "center" })], { position: "sticky", bottom: "0px", zIndex: 10, backgroundColor: k.S.alt, paddingTop: "12px", paddingBottom: "12px", borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: k.S.line }, null, null, "Navigation collante"),
    ]),

  // ───────────────────────── Partage social ─────────────────────────
  L("partage-trois-colonnes", "Partage collant à gauche, sommaire à droite", ["partage", "colonne collante", "trois colonnes"],
    "Trois colonnes : boutons de partage collants à gauche, texte au centre, sommaire et auteur à droite.", "clair", (k) => [
      k.section([
        k.grid(3, [
          k.W("sharebuttons", { ...SHARE, size: "40", label: "Partager", shape: "circle" }, { position: "sticky", top: "24px" }),
          k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.W("postmeta", META()), k.W("postcontent", {})], { gap: "20px" }),
          k.col([k.W("toc", { title: "Sommaire", depth: "3", numbered: false }), k.card([k.W("authorbox", { heading: "" })])], { position: "sticky", top: "24px", gap: "20px" }),
        ], { gridTemplate: "1fr 6fr 2fr", alignItems: "start" }),
      ], { maxWidth: "1200px" }),
    ]),

  L("partage-haut-et-bas", "Partage sous le titre et invitation en fin d'article", ["partage", "tête et pied", "invitation"],
    "Une rangée de boutons de partage sous le titre centré, puis une carte d'invitation à partager en fin de texte.", "doux", (k) => [
      k.section([
        k.W("postterms", { show: "category", look: "pills" }, { textAlign: "center" }),
        k.H("{{post.title}}", "1", { fontSize: "46px", textAlign: "center" }, { fontSize: "38px" }, { fontSize: "32px" }),
        k.row([k.W("postmeta", META({ showCategory: false })), k.W("sharebuttons", { ...SHARE, size: "32", shape: "plain", label: "Partager" })], { justifyContent: "center", gap: "24px" }),
        k.col([k.W("postcontent", {})], COL("720px")),
        k.card([k.H("Cet article vous a plu ?", "3", { textAlign: "center" }), k.T("<p>Faites-le découvrir autour de vous : un partage suffit.</p>", { textAlign: "center" }), k.row([k.W("sharebuttons", { ...SHARE, size: "48", shape: "circle", label: "Partager cet article" })], { justifyContent: "center" })], { backgroundColor: k.S.alt, alignItems: "center", paddingTop: "32px", paddingBottom: "32px", ...COL("720px") }),
      ], { maxWidth: "980px" }),
    ]),

  L("partage-encadre-revue", "Encadré de partage à double filet", ["partage", "encadré", "éditorial"],
    "Texte sobre terminé par un encadré à bordure marquée : invitation à gauche, boutons carrés de partage à droite.", "editorial", (k) => [
      k.section([
        k.L("{{post.category}}"), k.H("{{post.title}}", "1", { fontSize: "48px" }, { fontSize: "38px" }, { fontSize: "32px" }), k.W("postmeta", META({ separator: "bar", showCategory: false })),
        k.divider({ borderTopWidth: "4px" }),
        k.W("postcontent", {}),
        k.card([
          k.grid(2, [
            k.col([k.H("Partagez ce texte", "3"), k.T("<p>Une lecture utile mérite d'être transmise : choisissez le réseau de votre choix.</p>")], { gap: "8px" }),
            k.W("sharebuttons", { ...SHARE, size: "48", shape: "square", label: "Envoyer vers" }),
          ], { gridTemplate: "3fr 2fr", alignItems: "center" }),
        ], { borderWidth: "4px", borderStyle: "double", backgroundColor: "transparent" }),
        k.W("authorbox", {}),
      ], { maxWidth: "780px" }),
    ]),

  // ───────────────────────── Commentaires ─────────────────────────
  L("discussion-regles", "Discussion avec règles de courtoisie", ["commentaires", "discussion", "règles"],
    "Texte, puis la discussion à gauche et, à droite, les règles d'échange et les articles les plus commentés.", "clair", (k) => [
      k.section([
        k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.W("postmeta", META({ showComments: true })), k.W("postcontent", {}, COL("740px")), k.divider(),
        k.grid(2, [
          k.col([k.W("alert", { tone: "info", title: "Un avis, une nuance ?", text: "Vos réactions enrichissent l'article : racontez votre expérience ou posez votre question ci-dessous." }), k.W("postcomments", { heading: "La discussion" })], { gap: "20px" }),
          k.col([
            k.card([k.H("Pour bien échanger", "4"), k.W("iconlist", { items: [{ text: "Restez courtois", icon: "check" }, { text: "Argumentez vos propos", icon: "check" }, { text: "Restez dans le sujet", icon: "check" }] })]),
            k.W("querylist", { title: "Les plus commentés", source: "posts", mode: "commented", count: 4, layout: "compact", showImage: false }),
          ], { gap: "24px" }),
        ], { gridTemplate: "2fr 1fr", alignItems: "start" }),
      ], { maxWidth: "1100px" }),
    ]),

  L("debat-pour-contre", "Débat ouvert avec onglets de consignes", ["commentaires", "débat", "onglets"],
    "Bandeau de titre en couleur de marque, texte en carte claire, onglets de consignes puis espace de débat.", "marque", (k) => [
      k.band([k.inner([k.col([k.H("{{post.title}}", "1", { fontSize: "46px" }, { fontSize: "38px" }, { fontSize: "32px" }), k.W("postmeta", META({ showComments: true }))], { maxWidth: "860px" })])], { paddingTop: "48px", paddingBottom: "48px" }, null, null, "Titre du débat"),
      k.section([
        k.card([k.W("postcontent", {})], { ...LIGHT, ...BIG }, BIG_T, BIG_M),
        k.card([k.W("tabs", { items: [{ title: "Donner son avis", text: "Exprimez votre position en quelques lignes et expliquez ce qui la fonde." }, { title: "Répondre", text: "Répondez à un commentaire en le citant et en restant respectueux." }, { title: "Règles", text: "Pas d'attaque personnelle : on débat des idées, pas des personnes." }] })], LIGHT),
        k.card([k.W("postcomments", { heading: "Le débat" })], LIGHT),
      ], { maxWidth: "860px" }),
    ]),

  L("questions-reponses-lecteurs", "Questions des lecteurs et réponses", ["commentaires", "questions-réponses", "accordéon"],
    "Texte puis, côte à côte, une foire aux questions déroulante sur la participation et l'espace de questions des lecteurs.", "doux", (k) => [
      k.section([
        k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("postmeta", META()), k.img("post.image", { maxHeight: "340px" }), k.W("postcontent", {}, COL("740px")),
        k.grid(2, [
          k.card([k.H("Comment participer ?", "3"), k.W("accordion", { items: [{ q: "Comment poser une question ?", a: "Écrivez-la dans l'espace de droite : plus elle est précise, plus la réponse le sera." }, { q: "Qui me répond ?", a: "L'auteur ou un autre lecteur peut répondre dans la discussion." }, { q: "Puis-je compléter mon message ?", a: "Répondez à votre propre message pour le compléter." }], single: true, openFirst: true })], { alignSelf: "start" }),
          k.card([k.W("postcomments", { heading: "Vos questions" })], { backgroundColor: k.S.bg, alignSelf: "start" }),
        ], { gridTemplate: "2fr 3fr", alignItems: "start" }),
      ], { maxWidth: "1040px" }),
    ]),

  // ───────────────────────── Barre de progression de lecture ─────────────────────────
  L("progression-haut-sommaire-droit", "Barre de lecture en haut et sommaire à droite", ["readingprogress", "progression", "sommaire collant"],
    "Fine barre de progression en haut de l'écran, titre centré, texte à gauche et sommaire numéroté collant à droite.", "editorial", (k) => [
      k.W("readingprogress", { position: "top", thickness: 6 }),
      k.section([
        k.L("{{post.category}}", { textAlign: "center" }), k.H("{{post.title}}", "1", { fontSize: "52px", textAlign: "center" }, { fontSize: "40px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { textAlign: "center", fontSize: "20px", color: k.S.mute }), k.W("postmeta", META({ showCategory: false, align: "center", separator: "bar" })),
        k.divider({ borderTopWidth: "3px" }),
        k.grid(2, [
          k.col([k.W("postcontent", {}), k.W("postnav", { sameCategory: true })], { gap: "32px" }),
          k.W("toc", { title: "Sommaire", depth: "3", numbered: true }, { position: "sticky", top: "24px" }),
        ], { gridTemplate: "3fr 1fr", alignItems: "start" }),
      ], { maxWidth: "1120px" }),
    ]),

  L("progression-cercle-bas", "Pastille circulaire de lecture en bas d'écran", ["readingprogress", "cercle", "lecture continue"],
    "Une pastille circulaire de progression en bas de l'écran suit la lecture d'une colonne étroite et sans distraction.", "nuit", (k) => [
      k.W("readingprogress", { position: "bottom", thickness: 6, shape: "circle" }),
      k.section([
        k.row([k.dyn("post.category", { fontWeight: "700", color: k.S.accent }), k.dyn("post.reading_time", { color: k.S.mute })], { gap: "12px" }),
        k.H("{{post.title}}", "1", { fontSize: "44px" }, { fontSize: "36px" }, { fontSize: "32px" }),
        k.dyn("post.date", { color: k.S.mute, fontSize: "14px" }),
        k.W("postcontent", {}), k.W("authorbox", {}),
      ], { maxWidth: "700px" }),
    ]),

  L("progression-epaisse-marque", "Grosse barre de lecture et sommaire en carte", ["readingprogress", "bandeau", "sommaire"],
    "Barre épaisse en haut, bandeau de titre en couleur de marque, sommaire en carte puis texte en carte claire.", "marque", (k) => [
      k.W("readingprogress", { position: "top", thickness: 10 }),
      k.band([k.inner([k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "48px" }, { fontSize: "40px" }, { fontSize: "32px" }), k.W("postmeta", META())], { maxWidth: "860px" })])], { paddingTop: "48px", paddingBottom: "48px" }, null, null, "Titre"),
      k.section([
        k.card([k.W("toc", { title: "Pour s'y retrouver", depth: "2", numbered: true })], LIGHT),
        k.card([k.W("postcontent", {})], { ...LIGHT, ...BIG }, BIG_T, BIG_M),
      ], { maxWidth: "820px" }),
    ]),

  // ───────────────────────── Formats spéciaux ─────────────────────────
  L("interview-questions-reponses", "Interview avec portrait central", ["interview", "questions-réponses", "portrait"],
    "Portrait rond centré de la personne interrogée, accroche en citation, puis texte en colonne de lecture large.", "doux", (k) => [
      k.section([
        k.col([
          k.W("badge", { text: "Interview", tone: "primary" }),
          k.img("post.author_avatar", { width: "120px", height: "120px", borderRadius: "999px" }),
          k.H("{{post.title}}", "1", { fontSize: "42px", textAlign: "center" }, { fontSize: "36px" }, { fontSize: "32px" }),
          k.W("quote", { text: "{{post.excerpt}}", author: "{{post.author}}" }),
          k.W("postmeta", META({ showAuthor: false, align: "center" })),
        ], { alignItems: "center", textAlign: "center", ...COL("720px"), gap: "16px" }),
        k.col([k.W("postcontent", {})], { ...COL("720px"), fontSize: "18px", lineHeight: 1.8 }),
        k.W("postnav", {}, COL("720px")),
      ], { maxWidth: "900px" }),
    ]),

  L("exergue-citation-marginale", "Citation en exergue et texte de part et d'autre", ["citation", "exergue", "long format"],
    "Grande citation en exergue sous le titre, extrait de l'article, puis texte avec marge latérale pour l'auteur et les étiquettes.", "editorial", (k) => [
      k.section([
        k.W("breadcrumb", CRUMB),
        k.H("{{post.title}}", "1", { fontSize: "56px", lineHeight: 1.05 }, { fontSize: "42px" }, { fontSize: "34px" }),
        k.grid(2, [
          k.W("quote", { text: "{{post.excerpt}}", author: "" }),
          k.col([k.W("postmeta", META({ separator: "bar" })), k.img("post.image", { maxHeight: "260px" })], { gap: "16px" }),
        ], { gridTemplate: "3fr 2fr", alignItems: "start" }),
        k.divider({ borderTopWidth: "3px" }),
        k.grid(2, [
          k.col([k.W("postterms", { show: "both", look: "text" }), k.L("Écrit par"), k.dyn("post.author", { fontWeight: "700" })], { gap: "8px" }),
          k.col([k.W("postcontent", {})], { fontSize: "19px", lineHeight: 1.8 }),
        ], { gridTemplate: "1fr 4fr", alignItems: "start" }),
      ], { maxWidth: "1100px" }),
    ]),

  L("en-bref-resume-detaille", "Résumé en bref avec points clés", ["résumé", "en bref", "points clés"],
    "Carte « en bref » en tête : chapô et sommaire, puis le texte intégral et l'invitation à poursuivre.", "marque", (k) => [
      k.band([k.inner([k.col([k.H("{{post.title}}", "1", { fontSize: "46px" }, { fontSize: "38px" }, { fontSize: "32px" }), k.W("postmeta", META())], { maxWidth: "860px" })])], { paddingTop: "40px", paddingBottom: "40px" }, null, null, "Titre"),
      k.section([
        k.card([k.L("En bref", { color: "token:muted" }), k.dyn("post.excerpt", { fontSize: "18px", color: "token:text" }), k.W("toc", { title: "Ce que vous allez lire", depth: "2", numbered: false })],
          { ...LIGHT, borderLeftWidth: "6px", borderLeftStyle: "solid", borderLeftColor: "token:primary" }),
        k.card([k.W("postcontent", {})], { ...LIGHT, ...BIG }, BIG_T, BIG_M),
        k.card([k.H("Cet article vous a plu ?", "3", { color: "token:text" }), k.row([k.B("Voir le blog", "/blog", "solid", { backgroundColor: "token:primary", color: "token:on-primary" }), k.W("sharebuttons", SHARE)])], { ...LIGHT, alignItems: "center", textAlign: "center" }),
      ], { maxWidth: "820px" }),
    ]),

  L("sans-distraction-lecture", "Lecture sans distraction", ["sans distraction", "texte seul", "sobre"],
    "Le titre, le temps de lecture et le texte dans une colonne étroite sur fond sombre, sans menu, sans widget, rien d'autre.", "nuit", (k) => [
      k.band([k.col([
        k.dyn("post.reading_time", { color: k.S.mute, fontSize: "14px" }),
        k.H("{{post.title}}", "1", { fontSize: "38px", lineHeight: 1.2 }, { fontSize: "34px" }, { fontSize: "32px" }),
        k.W("postcontent", {}, { fontSize: "19px", lineHeight: 1.85 }),
      ], { ...COL("660px"), gap: "28px", paddingTop: "48px", paddingBottom: "64px" })], { borderBottomWidth: "0px", paddingTop: "24px" }, null, null, "Lecture"),
    ]),
];
