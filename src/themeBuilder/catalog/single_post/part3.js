// Article individuel — lot 3 (25 mises en page) : technologie, entreprise, articles à sommaire, articles à barre latérale, documentation / base de connaissances.
const { L, SHARE, CRUMB, META, REL, COL } = require("./shared");

// Grille avec colonnes sur mesure, qui passe à une colonne sous la tablette et sur mobile
const G = (k, n, children, tpl, st = {}) => {
  const g = k.grid(n, children, { gridTemplate: tpl, alignItems: "start", ...st });
  g.styles.tablet = { columns: 1, gridTemplate: "1fr" };
  g.styles.mobile = { columns: 1, gridTemplate: "1fr" };
  return g;
};
// Feuille de lecture : fond neutre du site posé sur une bande de couleur (identité « marque »)
const paper = (k, children, st = {}) => k.col(children, { backgroundColor: "token:background", color: "token:text", borderRadius: k.S.radius, paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", gap: "24px", ...st }, { paddingLeft: "16px", paddingRight: "16px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: "24px", paddingBottom: "24px" });
const page = (k, mw, children, st) => k.section(children, { maxWidth: mw, ...st });
const sticky = (extra = {}) => ({ position: "sticky", top: "24px", ...extra });
const mid = (mw) => ({ maxWidth: mw, marginLeft: "auto", marginRight: "auto", width: "100%" });
const CTA_TEXT = "Modifiez ce texte pour inviter vos lecteurs à poursuivre leur découverte du site.";

module.exports = [
  // ───────── Technologie ─────────
  L("tuto-pas-a-pas", "Tutoriel pas à pas avec étapes collantes", ["tutoriel", "technologie", "étapes", "sommaire"], "Tutoriel : colonne collante d'étapes numérotées et cercle de progression à gauche, consignes et texte à droite.", "nuit", (k) => [
    page(k, "1180px", [
      k.W("breadcrumb", CRUMB),
      k.row([k.W("postterms", { show: "category" }), k.W("postmeta", META({ showCategory: false, showUpdated: true }))], { gap: "16px" }),
      k.H("{{post.title}}", "1", { fontSize: "44px" }, { fontSize: "36px" }, { fontSize: "32px" }),
      G(k, 2, [
        k.col([k.card([k.W("toc", { title: "Les étapes", depth: "3", numbered: true })]), k.W("readingprogress", { position: "bottom", thickness: 4, shape: "circle" }), k.W("sharebuttons", { ...SHARE, label: "Partager le tutoriel" })], sticky({ gap: "20px" })),
        k.col([k.W("alert", { tone: "info", title: "Avant de commencer", text: "Lisez l'article en entier une première fois, puis reprenez-le étape par étape à votre rythme." }),
          k.img("post.image", { maxHeight: "360px" }), k.W("postcontent", {}),
          k.W("alert", { tone: "success", title: "Et ensuite ?", text: "Une étape vous a bloqué ? Écrivez-nous depuis la page de contact, nous complèterons l'article." }),
          k.W("postnav", { showImage: false })], { gap: "24px" }),
      ], "1fr 3fr")])]),

  L("article-technique-sommaire", "Article technique avec sommaire encadré et FAQ", ["technique", "sommaire", "faq", "documentation"], "En-tête sur fond neutre, sommaire encadré pleine largeur, texte, puis questions fréquentes dépliables.", "clair", (k) => [
    k.band([k.inner([k.col([k.W("postterms", { show: "tags", look: "pills" }), k.H("{{post.title}}", "1", { fontSize: "48px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "20px", color: k.S.mute }), k.W("postmeta", META({ showUpdated: true }))], { maxWidth: "860px" })])], { backgroundColor: k.S.alt, paddingTop: "56px", paddingBottom: "40px" }, null, null, "En-tête technique"),
    page(k, "860px", [
      k.card([k.W("toc", { title: "Plan de l'article", depth: "2", numbered: false })], { borderLeftWidth: "4px", borderLeftStyle: "solid", borderLeftColor: k.S.accent }),
      k.W("postcontent", {}),
      k.H("Questions fréquentes", "2", { fontSize: "28px" }),
      k.W("accordion", { items: [
        { q: "Une information vous semble inexacte ?", a: "Signalez-le-nous depuis la page de contact, l'article sera vérifié et corrigé." },
        { q: "Comment retrouver cet article plus tard ?", a: "Utilisez la recherche du blog ou les étiquettes affichées en pied d'article." }], single: true, openFirst: true, icon: "plus" }),
      k.W("postterms", { show: "tags", label: "Sujets :" })])]),

  L("note-de-version", "Note de version avec date en marge", ["note de version", "changelog", "technologie", "date"], "Bande de marque, date de publication en marge à gauche, contenu sur feuille claire, avertissement et onglets d'aide.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("badge", { text: "Note de version", tone: "primary" }), k.H("{{post.title}}", "1", { fontSize: "52px" }, { fontSize: "40px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "20px" })], { maxWidth: "820px" })])], { paddingTop: "64px", paddingBottom: "64px" }, null, null, "En-tête de la note"),
    page(k, "1100px", [
      G(k, 2, [
        k.col([k.L("Publié le"), k.dyn("post.date", { fontSize: "24px", fontWeight: "700" }), k.W("postterms", { show: "category" }), k.divider(), k.W("sharebuttons", { ...SHARE, label: "Diffuser" })], sticky({ gap: "12px" })),
        paper(k, [k.W("alert", { tone: "warning", title: "Pensez à sauvegarder", text: "Faites une copie de vos données avant toute mise à jour importante." }), k.W("postcontent", {}),
          k.W("tabs", { items: [{ title: "Mettre à jour", text: "Suivez les consignes de l'article, puis vérifiez que tout fonctionne comme avant." }, { title: "Revenir en arrière", text: "En cas de souci, restaurez votre sauvegarde et contactez-nous." }, { title: "Besoin d'aide", text: "La page de contact est là pour toute question sur cette version." }] }),
          k.W("postnav", {})]),
      ], "1fr 4fr")], { backgroundColor: "token:primary" })]),

  L("analyse-fiche-technique", "Analyse avec fiche d'identité à droite", ["analyse", "technologie", "revue", "fiche"], "En-tête de revue à deux colonnes : titre et chapô à gauche, fiche des informations à droite, image puis texte étroit.", "editorial", (k) => [
    page(k, "1100px", [
      G(k, 2, [
        k.col([k.L("{{post.category}}"), k.H("{{post.title}}", "1", { fontSize: "52px", textTransform: "uppercase" }, { fontSize: "40px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "20px", fontStyle: "italic" })], { gap: "16px" }),
        k.card([k.L("Fiche de l'article"), k.W("postmeta", META({ showCategory: false, separator: "bar", showUpdated: true })), k.divider(), k.W("postterms", { show: "tags", look: "text" }), k.W("sharebuttons", { ...SHARE, shape: "square", label: "Partager l'analyse" })], { borderTopWidth: "4px" }),
      ], "2fr 1fr", { alignItems: "stretch" }),
      k.img("post.image", { maxHeight: "440px" }),
      k.col([k.W("postcontent", {}), k.W("authorbox", {}), k.W("postnav", {})], { ...mid("720px"), gap: "32px", fontSize: "19px" })])]),

  L("guide-liste-de-controle", "Guide avec vignette ronde et liste de contrôle", ["guide", "technologie", "liste de contrôle", "arrondi"], "Vignette ronde à côté du titre, liste de contrôle d'introduction, texte dans une grande carte et articles liés compacts.", "doux", (k) => [
    page(k, "900px", [
      k.row([k.img("post.image", { width: "160px", height: "160px", borderRadius: "999px", maxHeight: "160px" }, { width: "112px", height: "112px" }), k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("postmeta", META({ showCategory: false }))], { flexGrow: "1", flexBasis: "320px" })], { gap: "24px", alignItems: "center" }),
      k.card([k.L("Avant de vous lancer"), k.W("iconlist", { items: [{ text: "Lisez le guide en entier avant de commencer", icon: "check" }, { text: "Préparez ce dont vous aurez besoin", icon: "check" }, { text: "Gardez cette page ouverte pendant la mise en œuvre", icon: "check" }], divider: true })]),
      k.card([k.W("postcontent", {})], { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "16px", paddingRight: "16px" }),
      k.W("sharebuttons", { ...SHARE, label: "Aidez un ami à s'y retrouver" }),
      k.W("querylist", { title: "Guides voisins", source: "posts", mode: "samecategory", count: 4, layout: "compact", showImage: false })])]),

  // ───────── Entreprise ─────────
  L("blog-corporate", "Blog corporate sobre avec signature en pied", ["entreprise", "blog corporate", "actualité", "signature"], "Fil d'Ariane, titre à gauche et visuel à droite, texte, puis ligne de signature avec auteur et partage et articles liés.", "clair", (k) => [
    page(k, "1180px", [
      k.W("breadcrumb", CRUMB),
      G(k, 2, [k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "44px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "18px", color: k.S.mute }), k.W("postmeta", META({ showCategory: false }))], { justifyContent: "center" }), k.img("post.image", { maxHeight: "380px" })], "5fr 4fr", { alignItems: "center" }),
      k.col([k.W("postcontent", {})], mid("760px")),
      k.divider(),
      G(k, 2, [k.W("authorbox", { heading: "Rédigé par" }), k.col([k.W("sharebuttons", { ...SHARE, label: "Partager cette actualité" }), k.W("postterms", { show: "tags", label: "Thèmes :" })], { gap: "16px" })], "3fr 2fr"),
      k.W("querylist", REL({ title: "Dans l'actualité de l'entreprise", count: 3, showExcerpt: false }))])]),

  L("etude-de-cas", "Étude de cas en trois temps", ["étude de cas", "entreprise", "client", "démarche"], "Bande de marque et trois encadrés Contexte, Démarche, Enseignements à compléter, puis récit sur feuille claire et appel à contacter l'équipe.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("badge", { text: "Étude de cas", tone: "success" }), k.H("{{post.title}}", "1", { fontSize: "52px" }, { fontSize: "40px" }, { fontSize: "32px" }), k.W("postmeta", META())], { maxWidth: "900px" })])], { paddingTop: "64px", paddingBottom: "40px" }, null, null, "Titre de l'étude"),
    page(k, "1100px", [
      k.grid(3, [
        k.card([k.H("Le contexte", "3", { fontSize: "22px" }), k.T("<p>Présentez ici la situation de départ et les enjeux du projet.</p>")], { alignItems: "stretch" }),
        k.card([k.H("La démarche", "3", { fontSize: "22px" }), k.T("<p>Décrivez les étapes menées et les choix retenus.</p>")], { alignItems: "stretch" }),
        k.card([k.H("Les enseignements", "3", { fontSize: "22px" }), k.T("<p>Résumez ce que l'équipe en retient pour la suite.</p>")], { alignItems: "stretch" })], { alignItems: "stretch" }),
      paper(k, [k.img("post.image", { maxHeight: "400px" }), k.col([k.W("postcontent", {})], mid("760px")), k.W("authorbox", {})]),
      k.row([k.col([k.H("Un projet similaire ?", "3", { fontSize: "26px" }), k.T("<p>" + CTA_TEXT + "</p>")], { flexBasis: "420px", flexGrow: "1" }), k.B("Parlons-en", "/contact")], { justifyContent: "space-between", gap: "24px" })], { backgroundColor: "token:primary" })]),

  L("livre-blanc-resume", "Livre blanc : couverture et contenu du document", ["livre blanc", "entreprise", "résumé", "couverture"], "Image en couverture verticale à gauche, résumé, liste de contenu et bouton de contact à droite, puis texte intégral étroit.", "editorial", (k) => [
    page(k, "1100px", [
      G(k, 2, [
        k.col([k.img("post.image", { maxHeight: "520px" }), k.W("badge", { text: "Livre blanc", tone: "neutral" })], { alignItems: "stretch" }),
        k.col([k.L("{{post.category}}"), k.H("{{post.title}}", "1", { fontSize: "48px", textTransform: "uppercase" }, { fontSize: "36px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "20px", fontStyle: "italic" }), k.divider({ borderTopWidth: "3px" }),
          k.L("Ce que vous trouverez dans ce document"), k.W("iconlist", { items: [{ text: "Un résumé des idées principales", icon: "check" }, { text: "Les arguments détaillés", icon: "check" }, { text: "Des pistes pour passer à l'action", icon: "check" }] }),
          k.row([k.B("Demander le document complet", "/contact"), k.B("Revenir au blog", "/blog", "outline")]), k.W("postmeta", META({ showCategory: false, separator: "bar" }))], { gap: "20px", justifyContent: "center" }),
      ], "2fr 3fr", { alignItems: "center" }),
      k.divider({ borderTopWidth: "4px" }),
      k.col([k.W("alert", { tone: "info", title: "Résumé", text: "Cette page présente l'essentiel du livre blanc. Le texte complet peut être demandé à l'équipe." }), k.W("postcontent", {}), k.W("postnav", {})], { ...mid("720px"), gap: "28px", fontSize: "19px" })])]),

  L("annonce-produit", "Annonce de produit en vitrine centrée", ["annonce", "produit", "entreprise", "nouveauté"], "Vitrine centrée : badge Nouveau, très grand titre, deux boutons, visuel large, texte puis onglets Points forts, Pour qui et Questions.", "nuit", (k) => [
    page(k, "1100px", [
      k.col([k.W("badge", { text: "Nouveau", tone: "primary" }), k.H("{{post.title}}", "1", { fontSize: "60px", textAlign: "center", lineHeight: 1.1 }, { fontSize: "44px" }, { fontSize: "36px" }), k.dyn("post.excerpt", { fontSize: "20px", textAlign: "center", color: k.S.mute, maxWidth: "680px" }), k.row([k.B("En savoir plus", "/contact", "solid"), k.B("Lire d'autres annonces", "/blog")], { justifyContent: "center" })], { alignItems: "center", gap: "20px" }),
      k.img("post.image", { maxHeight: "520px", boxShadow: "lg" }),
      k.W("postmeta", META({ align: "center", separator: "bar" })),
      k.col([k.W("postcontent", {}), k.W("tabs", { items: [{ title: "Points forts", text: "Listez ici les atouts principaux de cette annonce." }, { title: "Pour qui ?", text: "Précisez les usages et les publics concernés." }, { title: "Questions", text: "Répondez aux interrogations les plus courantes ou invitez à nous écrire." }] }), k.W("postnav", {})], { ...mid("760px"), gap: "32px" })])]),

  L("recrutement-rejoignez-nous", "Recrutement avec carte de candidature collante", ["recrutement", "ressources humaines", "entreprise", "candidature"], "Annonce RH : texte à gauche, carte arrondie collante à droite avec valeurs et bouton de candidature, articles de la rubrique en pied.", "doux", (k) => [
    page(k, "1100px", [
      k.col([k.W("badge", { text: "Rejoignez-nous", tone: "success" }), k.H("{{post.title}}", "1", { fontSize: "44px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.W("postmeta", META({ showReading: false }))]),
      G(k, 2, [
        k.col([k.img("post.image", { maxHeight: "340px" }), k.W("postcontent", {}), k.W("authorbox", { heading: "Votre contact dans l'équipe" })], { gap: "24px" }),
        k.card([k.H("Vous êtes intéressé ?", "3", { fontSize: "24px" }), k.T("<p>Découvrez ce que nous défendons au quotidien.</p>"),
          k.W("iconlist", { items: [{ text: "Un travail clair et partagé", icon: "check" }, { text: "Une équipe à l'écoute", icon: "check" }, { text: "Des projets qui ont du sens", icon: "check" }] }),
          k.B("Postuler ou nous écrire", "/contact", "solid", { textAlign: "center" }), k.W("sharebuttons", { ...SHARE, label: "Faire passer l'annonce" })], sticky({ gap: "16px" })),
      ], "5fr 2fr"),
      k.W("querylist", { title: "Plus d'actualités de l'équipe", source: "posts", mode: "samecategory", count: 3, layout: "list", showImage: true })])]),

  // ───────── Articles avec sommaire ─────────
  L("sommaire-collant-gauche", "Sommaire collant à gauche avec auteur", ["sommaire", "colonne gauche", "long format", "collant"], "Sommaire numéroté collant à gauche sous lequel se range l'auteur, texte à droite avec barre de lecture en pied d'écran.", "clair", (k) => [
    k.W("readingprogress", { position: "bottom", thickness: 6 }),
    page(k, "1180px", [
      k.W("breadcrumb", CRUMB),
      k.H("{{post.title}}", "1", { fontSize: "46px" }, { fontSize: "36px" }, { fontSize: "32px" }),
      k.W("postmeta", META({ showUpdated: true })),
      G(k, 2, [
        k.col([k.card([k.W("toc", { title: "Dans cet article", depth: "3", numbered: true })]), k.W("authorbox", { heading: "", showBio: false })], sticky({ gap: "16px" })),
        k.col([k.img("post.image", { maxHeight: "400px" }), k.W("postcontent", {}), k.W("postnav", { sameCategory: true }), k.W("postcomments", {})], { gap: "24px" }),
      ], "2fr 5fr")])]),

  L("sommaire-collant-droite", "Sommaire collant à droite filet éditorial", ["sommaire", "colonne droite", "éditorial", "collant"], "En-tête de revue centré, texte à gauche et sommaire collant à droite séparé par un filet vertical.", "editorial", (k) => [
    page(k, "1100px", [
      k.col([k.L("{{post.category}}", { textAlign: "center" }), k.H("{{post.title}}", "1", { textAlign: "center", fontSize: "56px", textTransform: "uppercase" }, { fontSize: "40px" }, { fontSize: "32px" }), k.W("postmeta", META({ showCategory: false, align: "center", separator: "bar" })), k.divider({ borderTopWidth: "4px" })], { gap: "16px" }),
      G(k, 2, [
        k.col([k.dyn("post.excerpt", { fontSize: "22px", fontStyle: "italic" }), k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Mots-clés :", look: "text" })], { gap: "28px", fontSize: "19px" }),
        k.col([k.W("toc", { title: "Au sommaire", depth: "2", numbered: false }), k.divider(), k.W("sharebuttons", { ...SHARE, shape: "square", label: "Envoyer à un ami" })], sticky({ borderLeftWidth: "2px", borderLeftStyle: "solid", borderLeftColor: k.S.line, paddingLeft: "24px", gap: "20px" })),
      ], "3fr 1fr")])]),

  L("sommaire-en-tete-carte", "Sommaire en tête dans une carte arrondie", ["sommaire", "en-tête", "arrondi", "lecture"], "Barre de progression en haut, résumé et sommaire côte à côte dans des cartes arrondies avant le texte étroit.", "doux", (k) => [
    k.W("readingprogress", { position: "top", thickness: 6 }),
    page(k, "960px", [
      k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.W("postmeta", META({ showCategory: false }))]),
      G(k, 2, [k.card([k.L("En deux mots"), k.dyn("post.excerpt", { fontSize: "18px" })]), k.card([k.W("toc", { title: "Pour aller droit au but", depth: "2", numbered: true })])], "1fr 1fr", { alignItems: "stretch" }),
      k.img("post.image", { maxHeight: "380px" }),
      k.col([k.W("postcontent", {}), k.W("postnav", {})], { ...mid("720px"), gap: "28px" })])]),

  L("sommaire-barre-defilante", "Barre de sommaire déroulante qui suit la lecture", ["sommaire", "barre", "défilement", "nuit"], "Bande de titre sombre puis barre de sommaire horizontale qui reste en haut de l'écran pendant le défilement.", "nuit", (k) => [
    k.band([k.inner([k.col([k.W("breadcrumb", CRUMB), k.H("{{post.title}}", "1", { fontSize: "48px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.W("postmeta", META())], { maxWidth: "860px" })])], { paddingTop: "48px", paddingBottom: "32px" }, null, null, "Titre"),
    k.col([k.inner([k.W("toc", { title: "Aller à", depth: "2", numbered: true })], { justifyContent: "flex-start" })], { position: "sticky", top: "0px", zIndex: 5, backgroundColor: k.S.alt, borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: k.S.line, paddingTop: "8px", paddingBottom: "8px", paddingLeft: "24px", paddingRight: "24px", color: k.S.fg }),
    page(k, "780px", [k.img("post.image", { maxHeight: "380px" }), k.W("postcontent", {}), k.W("sharebuttons", { ...SHARE, label: "Partager" }), k.W("authorbox", {})])]),

  L("sommaire-numerote-bandeau", "Sommaire numéroté dans le bandeau de marque", ["sommaire", "numéroté", "bandeau", "couleur"], "Bandeau de marque à deux colonnes : titre et chapô à gauche, sommaire numéroté à droite, puis visuel et texte sur feuille claire.", "marque", (k) => [
    k.band([k.inner([G(k, 2, [
      k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "48px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.dyn("post.excerpt", { fontSize: "18px" }), k.W("postmeta", META({ showCategory: false }))], { gap: "16px" }),
      k.card([k.W("toc", { title: "Les parties de l'article", depth: "2", numbered: true })], { alignItems: "stretch" }),
    ], "3fr 2fr", { alignItems: "center", width: "100%" })])], { paddingTop: "56px", paddingBottom: "56px" }, null, null, "Bandeau du sommaire"),
    page(k, "900px", [paper(k, [k.img("post.image", { maxHeight: "380px" }), k.col([k.W("postcontent", {}), k.W("postterms", { show: "tags", label: "Étiquettes :" })], mid("740px")), k.W("postnav", {})])], { backgroundColor: "token:primary" }),
    k.W("readingprogress", { position: "bottom", thickness: 4 })]),

  // ───────── Articles avec barre latérale ─────────
  L("barre-laterale-droite", "Barre latérale droite : recherche, auteur et populaires", ["barre latérale", "droite", "blog", "widgets"], "Article à gauche, colonne de widgets à droite : recherche, auteur, contenus les plus lus et étiquettes.", "clair", (k) => [
    page(k, "1180px", [
      k.W("breadcrumb", CRUMB),
      G(k, 2, [
        k.col([k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("postmeta", META({ showComments: true })), k.img("post.image", { maxHeight: "420px" }), k.W("postcontent", {}), k.W("postnav", {}), k.W("postcomments", {})], { gap: "24px" }),
        k.col([k.search("blog"), k.W("authorbox", { heading: "L'auteur" }), k.card([k.W("querylist", { title: "Les plus lus", source: "posts", mode: "popular", count: 5, layout: "compact", showImage: false })]), k.W("postterms", { show: "tags", label: "Étiquettes" })], { gap: "20px" }),
      ], "2fr 1fr")])]),

  L("barre-laterale-gauche-rubriques", "Barre latérale gauche : rubriques et récents", ["barre latérale", "gauche", "rubriques", "éditorial"], "Colonne de gauche étroite avec liste des rubriques et articles récents, grand article à droite sous un filet double.", "editorial", (k) => [
    page(k, "1180px", [
      k.divider({ borderTopWidth: "4px" }),
      G(k, 2, [
        k.col([k.W("querylist", { title: "Rubriques", source: "categories", mode: "popular", count: 8, layout: "compact" }), k.divider(), k.W("querylist", { title: "Derniers articles", source: "posts", mode: "recent", count: 4, layout: "list", showImage: false, showDate: true })], sticky({ gap: "24px" })),
        k.col([k.L("{{post.category}}"), k.H("{{post.title}}", "1", { fontSize: "50px", textTransform: "uppercase" }, { fontSize: "38px" }, { fontSize: "32px" }), k.W("postmeta", META({ showCategory: false, separator: "bar" })), k.img("post.image", { maxHeight: "420px" }), k.col([k.W("postcontent", {})], { fontSize: "19px", maxWidth: "720px" }), k.W("authorbox", {})], { gap: "24px" }),
      ], "1fr 3fr")])]),

  L("deux-barres-laterales", "Deux colonnes latérales autour de l'article", ["double colonne", "barre latérale", "trois colonnes", "nuit"], "Article au centre, colonne de partage et auteur à gauche, colonne de contenus liés à droite, le tout sur fond sombre.", "nuit", (k) => [
    page(k, "1280px", [
      G(k, 3, [
        k.col([k.W("sharebuttons", { ...SHARE, size: "40", label: "Partager" }), k.W("authorbox", { heading: "", showLink: true })], sticky({ gap: "20px" })),
        k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("postmeta", META()), k.img("post.image", { maxHeight: "380px" }), k.W("postcontent", {}), k.W("postcomments", {})], { gap: "24px" }),
        k.col([k.card([k.W("querylist", { title: "À lire aussi", source: "posts", mode: "related", count: 3, layout: "list", showImage: true })]), k.card([k.W("querylist", { title: "Récents", source: "posts", mode: "recent", count: 4, layout: "compact", showImage: false })])], sticky({ gap: "20px" })),
      ], "1fr 3fr 1.2fr")])]),

  L("widgets-empiles", "Widgets empilés en cartes douces", ["widgets", "barre latérale", "cartes", "arrondi"], "Texte large à gauche, pile de cartes arrondies à droite : sommaire, recherche, rubriques, populaires, avis et invitation.", "doux", (k) => [
    page(k, "1180px", [
      k.col([k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("postmeta", META())]),
      G(k, 2, [
        k.col([k.img("post.image", { maxHeight: "400px" }), k.W("postcontent", {}), k.W("postcomments", {})], { gap: "24px" }),
        k.col([k.card([k.W("toc", { title: "Sommaire", depth: "2", numbered: false })]), k.card([k.search("blog")]), k.card([k.W("querylist", { title: "Rubriques", source: "categories", mode: "popular", count: 6, layout: "inline" })]),
          k.card([k.W("querylist", { title: "Populaires", source: "posts", mode: "popular", count: 3, layout: "list", showImage: true })]),
          k.card([k.H("Cet article vous a plu ?", "3", { fontSize: "22px" }), k.T("<p>" + CTA_TEXT + "</p>"), k.B("Voir le blog", "/blog")])], { gap: "16px" }),
      ], "5fr 2fr")])]),

  L("contenus-populaires-bandeau", "Contenus populaires en bandeau sous l'article", ["contenus populaires", "barre latérale", "recommandations", "marque"], "Mince colonne de récents à droite, puis grand bandeau de marque de quatre cartes des contenus les plus lus.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("postterms", { show: "category" }), k.H("{{post.title}}", "1", { fontSize: "46px" }, { fontSize: "36px" }, { fontSize: "32px" }), k.W("postmeta", META({ showCategory: false }))], { maxWidth: "900px" })])], { paddingTop: "48px", paddingBottom: "40px" }, null, null, "Titre"),
    page(k, "1180px", [
      G(k, 2, [
        paper(k, [k.img("post.image", { maxHeight: "380px" }), k.W("postcontent", {}), k.W("authorbox", {})]),
        k.col([k.card([k.W("querylist", { title: "Derniers articles", source: "posts", mode: "recent", count: 5, layout: "compact", showImage: false })]), k.card([k.W("sharebuttons", { ...SHARE, label: "Partager" })])], sticky({ gap: "16px" })),
      ], "3fr 1fr"),
      k.divider({ borderColor: "#ffffff55" }),
      k.W("querylist", { title: "Les contenus les plus populaires", source: "posts", mode: "popular", count: 4, layout: "cards", showExcerpt: false })], { backgroundColor: "token:primary" })]),

  // ───────── Documentation / base de connaissances ─────────
  L("doc-trois-colonnes", "Documentation : navigation, page et table des matières", ["documentation", "navigation", "fil d'Ariane", "trois colonnes"], "Fil d'Ariane et recherche en haut, navigation de rubrique à gauche, page au centre, table des matières collante à droite.", "clair", (k) => [
    page(k, "1280px", [
      k.row([k.W("breadcrumb", CRUMB), k.search("blog", { maxWidth: "320px" })], { justifyContent: "space-between" }),
      G(k, 3, [
        k.col([k.W("querylist", { title: "Dans cette rubrique", source: "posts", mode: "samecategory", count: 8, layout: "compact", showImage: false, showDate: false })], sticky()),
        k.col([k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("postmeta", META({ showCategory: false, showUpdated: true })), k.W("postcontent", {}), k.W("postnav", { showImage: false })], { gap: "24px" }),
        k.col([k.W("toc", { title: "Sur cette page", depth: "3", numbered: false })], sticky({ borderLeftWidth: "1px", borderLeftStyle: "solid", borderLeftColor: k.S.line, paddingLeft: "16px" })),
      ], "1fr 3fr 1fr")])]),

  L("aide-memoire", "Aide-mémoire compact à imprimer", ["aide-mémoire", "documentation", "référence", "compact"], "Fiche de référence : titre discret, rappel en liste d'icônes, sommaire en ligne, texte large et réponses brèves dépliables.", "editorial", (k) => [
    page(k, "1000px", [
      k.row([k.col([k.W("badge", { text: "Aide-mémoire", tone: "neutral" }), k.H("{{post.title}}", "1", { fontSize: "36px", textTransform: "uppercase" }, { fontSize: "34px" }, { fontSize: "32px" })], { flexBasis: "420px", flexGrow: "1" }), k.W("postmeta", META({ showCategory: false, separator: "bar" }, ), { textAlign: "right" })], { alignItems: "flex-end", justifyContent: "space-between" }),
      k.divider({ borderTopWidth: "4px" }),
      k.card([k.W("toc", { title: "Repères", depth: "2", numbered: true })], { backgroundColor: k.S.alt }),
      k.W("alert", { tone: "info", title: "Astuce", text: "Gardez cette page dans vos favoris pour la retrouver en un clic." }),
      k.W("postcontent", {}),
      k.W("accordion", { items: [{ q: "Cette fiche est-elle à jour ?", a: "La date de mise à jour figure en tête de page. Écrivez-nous si un point doit être corrigé." }, { q: "Puis-je la partager ?", a: "Oui, utilisez les boutons de partage ci-dessous." }], icon: "plus" }),
      k.W("sharebuttons", { ...SHARE, shape: "square", label: "Partager la fiche" })])]),

  L("base-de-connaissances-aide", "Base de connaissances avec recherche en vedette", ["base de connaissances", "aide", "support", "recherche"], "Grand bandeau de recherche arrondi, article d'aide centré, carte Cet article vous a-t-il aidé et articles de la rubrique.", "doux", (k) => [
    k.band([k.inner([k.col([k.L("Centre d'aide", { textAlign: "center" }), k.H("Comment pouvons-nous vous aider ?", "2", { textAlign: "center", fontSize: "32px" }), k.search("blog", { maxWidth: "560px" })], { alignItems: "center", width: "100%" })], { justifyContent: "center" })], { backgroundColor: k.S.alt, paddingTop: "48px", paddingBottom: "48px" }, null, null, "Recherche d'aide"),
    page(k, "800px", [
      k.W("breadcrumb", CRUMB),
      k.H("{{post.title}}", "1", { fontSize: "38px" }, { fontSize: "34px" }, { fontSize: "32px" }),
      k.W("postmeta", META({ showCategory: false, showUpdated: true, showReading: true })),
      k.W("postcontent", {}),
      k.card([k.H("Cet article vous a-t-il aidé ?", "3", { fontSize: "22px" }), k.T("<p>Si vous cherchez encore une réponse, notre équipe est là pour vous.</p>"), k.row([k.B("Contacter l'équipe", "/contact"), k.B("Retour à l'aide", "/blog", "outline")])], { alignItems: "center", textAlign: "center" }),
      k.W("querylist", { title: "Articles de la même rubrique", source: "posts", mode: "samecategory", count: 4, layout: "list", showImage: false })])]),

  L("doc-onglets-reference", "Page de référence à onglets et navigation en bandeau", ["documentation", "référence", "onglets", "nuit"], "Fil d'Ariane, titre avec badge, onglets Aperçu, Bon à savoir, Aller plus loin avant le texte, navigation précédent suivant en bandeau.", "nuit", (k) => [
    page(k, "960px", [
      k.W("breadcrumb", CRUMB),
      k.row([k.H("{{post.title}}", "1", { fontSize: "40px" }, { fontSize: "34px" }, { fontSize: "32px" }), k.W("badge", { text: "Référence", tone: "primary" })], { gap: "16px" }),
      k.W("postmeta", META({ showUpdated: true })),
      k.W("tabs", { items: [{ title: "Aperçu", text: "Résumez en une phrase à quoi sert cette page de référence." }, { title: "Bon à savoir", text: "Notez ici les limites, les prérequis ou les points d'attention." }, { title: "Aller plus loin", text: "Orientez vers les articles complémentaires du blog." }] }),
      k.W("postcontent", {}),
      k.band([k.inner([k.W("postnav", { prevLabel: "Page précédente", nextLabel: "Page suivante", sameCategory: true })], { justifyContent: "stretch" })], { backgroundColor: k.S.alt, borderRadius: k.S.radius, paddingLeft: "16px", paddingRight: "16px" }, null, null, "Navigation de la documentation")])]),

  L("doc-navigation-rubriques", "Documentation avec rubriques et sommaire dans la colonne", ["documentation", "rubriques", "navigation", "marque"], "Bandeau de marque, colonne collante de rubriques et de pages voisines à gauche, page sur feuille claire à droite avec aide en pied.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("breadcrumb", CRUMB), k.H("{{post.title}}", "1", { fontSize: "42px" }, { fontSize: "34px" }, { fontSize: "32px" })], { maxWidth: "900px" })])], { paddingTop: "40px", paddingBottom: "32px" }, null, null, "Titre de la page"),
    page(k, "1180px", [
      G(k, 2, [
        k.col([k.card([k.W("querylist", { title: "Rubriques", source: "categories", mode: "popular", count: 6, layout: "compact" })]), k.card([k.W("toc", { title: "Sur cette page", depth: "2", numbered: false })]), k.card([k.W("querylist", { title: "Pages voisines", source: "posts", mode: "samecategory", count: 4, layout: "compact", showImage: false, showDate: false })])], sticky({ gap: "16px" })),
        paper(k, [k.W("postmeta", META({ showCategory: false, showUpdated: true })), k.W("postcontent", {}), k.W("alert", { tone: "info", title: "Besoin d'un coup de main ?", text: "Si cette page ne répond pas à votre question, écrivez-nous depuis la page de contact." }), k.W("postnav", {})]),
      ], "1fr 3fr")], { backgroundColor: "token:primary" })]),
];
