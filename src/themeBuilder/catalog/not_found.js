// Catalogue « Page 404 » — 100 modèles = 20 CONTENUS (archétypes : message, actions, suggestions réelles) × 5 TRAITEMENTS de mise en page STRUCTURELLEMENT différents
// (centré, scindé en deux colonnes, éditorial à gauche, bandeau pleine largeur, carte), chacun posé sur une identité visuelle (skin) choisie pour lui. Aucun modèle ne diffère d'un autre par la seule couleur.
// Tout est réel et natif : boutons vers des pages standard, widgets `search`, `posts`, `querylist`, `courselist`, `menu`, `account` ; aucune image factice. Documentation : docs/theme-builder/kolakisa-404-library.md
const MSG = "Cette page est introuvable";
const WHY = "<p>L'adresse a peut-être changé ou la page n'existe plus. Modifiez ce texte pour l'adapter à votre site.</p>";
const EYEBROW = "Erreur 404";

// ── Suggestions réelles réutilisables ───────────────────────────────────────────────────────────────
const posts = (k, n = 3) => k.W("posts", { count: n, layout: "grid", showExcerpt: false, showDate: true, showImage: true, empty: "Les articles apparaîtront ici." }, { width: "100%" });
const popular = (k, title = "À lire plutôt", n = 5) => k.W("querylist", { title, source: "posts", mode: "popular", count: n, layout: "list", showImage: false, showDate: true, empty: "Les articles apparaîtront ici." }, { width: "100%" });
const recentList = (k, title = "Articles récents", n = 4) => k.W("querylist", { title, source: "posts", mode: "recent", count: n, layout: "list", showImage: false, showDate: true, empty: "Les articles apparaîtront ici." }, { width: "100%" });
const cats = (k) => k.W("querylist", { title: "Parcourir par catégorie", source: "categories", mode: "popular", count: 12, layout: "inline", showCount: true, empty: "Les catégories apparaîtront ici." }, { width: "100%" });
const courses = (k, n = 3) => k.W("courselist", { count: n, sort: "recent", showPrice: true, cta: "Découvrir", empty: "Les formations apparaîtront ici." }, { width: "100%" });
const links = (k, items) => k.col(items.map(([l, u]) => k.LINK(l, u)), { gap: "12px", width: "100%" });
const linkCards = (k, items) => k.grid(items.length >= 4 ? 4 : items.length, items.map(([t, d, l, u]) => k.card([k.H(t, "3", { fontSize: "20px" }), k.T(`<p>${d}</p>`, { color: k.S.mute }), k.LINK(l, u)])));
const steps = (k) => k.grid(3, [k.card([k.L("Étape 1"), k.T("<p>Vérifiez l'adresse saisie.</p>")]), k.card([k.L("Étape 2"), k.search("blog")]), k.card([k.L("Étape 3"), k.B("Retour à l'accueil", "/", "outline")])]);
const help = (k) => k.card([k.H("Un lien cassé ?", "3"), k.T("<p>Si vous pensez que cette page devrait exister, prévenez-nous : modifiez ce texte selon votre fonctionnement.</p>", { color: k.S.mute }), k.B("Nous le signaler", "/contact", "outline")], { width: "100%", alignItems: "flex-start" });

// Menu à liens manuels vers les pages standard : jamais vide, même si le site n'a pas encore de menu affecté dans Apparence → Menus ; modifiable dans l'éditeur
const navMenu = (k, vertical = false, st = {}) => ({ type: "menu", props: { label: "Navigation", source: "manual", vertical, mobileToggle: false, items: [{ label: "Accueil", url: "/" }, { label: "Blog", url: "/blog" }, { label: "Catalogue", url: "/catalogue" }, { label: "Contact", url: "/contact" }] }, styles: { desktop: { color: k.S.fg, fontWeight: "600", fontSize: "15px", ...st } } });
const HOME = ["Retour à l'accueil", "/"];
// Archétype : { key, label, tags, desc, title, text, actions: [[libellé, adresse, variante?]], extras(k) → éléments sous le message, side(k) → contenu de la colonne secondaire (traitement « scindé ») }
const A = (key, label, tags, desc, o) => ({ key, label, tags, desc, title: MSG, text: WHY, actions: [HOME], extras: () => [], side: null, ...o });
const ARCHETYPES = [
  A("simple", "Message simple", ["minimaliste", "accueil"], "Titre, courte explication et retour à l'accueil.", { side: (k) => [k.L("Retrouvez votre chemin"), links(k, [["Accueil", "/"], ["Blog", "/blog"], ["Contact", "/contact"]])] }),
  A("recherche", "Recherche en vedette", ["recherche", "blog"], "Un grand champ de recherche mis en avant.", { text: "<p>Essayez une recherche pour retrouver ce que vous cherchiez.</p>", extras: (k) => [k.search("blog", { width: "100%", maxWidth: "560px" })], side: (k) => [k.L("Rechercher sur le site"), k.search("blog")] }),
  A("articles", "Articles suggérés", ["articles", "blog", "suggestions"], "Message court puis trois articles récents.", { extras: (k) => [k.H("Nos derniers articles", "2", { fontSize: "26px" }), posts(k, 3)], side: (k) => [recentList(k)] }),
  A("formations", "Catalogue de formations", ["formation", "catalogue"], "Message puis formations récentes du catalogue.", { actions: [["Voir tout le catalogue", "/catalogue"], ["Retour à l'accueil", "/", "outline"]], extras: (k) => [courses(k, 3)], side: (k) => [k.L("Formations"), courses(k, 2)] }),
  A("boutique", "Boutique", ["boutique", "achats", "compte"], "Accès à la boutique et au compte client.", { actions: [["Aller à la boutique", "/boutique"], ["Retour à l'accueil", "/", "outline"]], extras: (k) => [k.account({ justifyContent: "center" })], side: (k) => [k.L("Votre compte"), k.account(), links(k, [["Mes commandes", "/compte"], ["La boutique", "/boutique"]])] }),
  A("quatre-chemins", "Quatre chemins", ["navigation", "cartes"], "Quatre cartes : accueil, blog, catalogue, contact.", { extras: (k) => [linkCards(k, [["Accueil", "Repartez du début.", "Y aller", "/"], ["Blog", "Nos derniers articles.", "Lire", "/blog"], ["Catalogue", "Parcourez les formations.", "Parcourir", "/catalogue"], ["Contact", "Dites-nous ce que vous cherchiez.", "Écrire", "/contact"]])], side: (k) => [links(k, [["Accueil", "/"], ["Blog", "/blog"], ["Catalogue", "/catalogue"], ["Contact", "/contact"]])] }),
  A("categories", "Catégories du blog", ["catégories", "blog"], "Catégories du blog en étiquettes.", { extras: (k) => [cats(k)], side: (k) => [cats(k)] }),
  A("populaires", "Articles populaires", ["blog", "articles", "recherche"], "Recherche puis articles les plus lus.", { extras: (k) => [k.search("blog", { width: "100%", maxWidth: "520px" }), popular(k)], side: (k) => [popular(k)] }),
  A("signalement", "Signaler le problème", ["contact", "aide"], "Que faire si le lien devrait fonctionner : contact.", { extras: (k) => [help(k)], side: (k) => [help(k)] }),
  A("etapes", "Étapes de retour", ["étapes", "guide", "recherche"], "Trois étapes pour retrouver son chemin.", { extras: (k) => [steps(k)], side: (k) => [k.L("Que faire ?"), k.T("<p>1. Vérifiez l'adresse. 2. Utilisez la recherche. 3. Revenez à l'accueil.</p>", { color: k.S.mute }), k.search("blog")] }),
  A("humour", "Ton léger", ["humour", "sobre"], "Message décalé mais sobre.", { title: "Oups, on a perdu cette page", text: "<p>Elle s'est égarée quelque part. Écrivez ici votre propre phrase, drôle ou rassurante.</p>", actions: [HOME, ["Chercher dans le blog", "/blog", "outline"]], side: (k) => [k.L("En attendant"), recentList(k, "Une petite lecture ?", 3)] }),
  A("corporate", "Corporate", ["entreprise", "contact", "sobre"], "Ton institutionnel : accueil et contact.", { title: "La page demandée n'existe pas", text: "<p>Le contenu a pu être déplacé ou supprimé. Utilisez la navigation ou contactez notre équipe.</p>", actions: [HOME, ["Nous contacter", "/contact", "outline"]], side: (k) => [k.L("Navigation"), navMenu(k, true)] }),
  A("navigation", "Navigation du site", ["navigation", "menu"], "Le menu du site sous le message.", { text: "<p>Utilisez le menu pour continuer votre visite.</p>", extras: (k) => [navMenu(k, false, { justifyContent: "center" })], side: (k) => [k.L("Menu du site"), navMenu(k, true)] }),
  A("blog-complet", "Blog : recherche et suggestions", ["blog", "recherche", "articles"], "Recherche, articles récents et catégories.", { extras: (k) => [k.search("blog", { width: "100%", maxWidth: "520px" }), posts(k, 3), cats(k)], side: (k) => [k.search("blog"), recentList(k, "Articles récents", 3)] }),
  A("complet", "Page complète", ["complet", "articles", "formations"], "Recherche, articles et formations réunis.", { extras: (k) => [k.search("blog", { width: "100%", maxWidth: "520px" }), k.H("À découvrir", "2", { fontSize: "26px" }), posts(k, 3), courses(k, 3)], side: (k) => [k.search("blog"), courses(k, 2)] }),
  A("aide", "Centre d'aide", ["aide", "support", "recherche"], "Recherche d'aide et contact.", { title: "Nous n'avons pas trouvé cette page", text: "<p>Besoin d'aide ? Cherchez dans le site ou écrivez-nous.</p>", actions: [["Contacter le support", "/contact"], HOME.concat("outline")], extras: (k) => [k.search("blog", { width: "100%", maxWidth: "520px" })], side: (k) => [k.L("Aide"), k.search("blog"), help(k)] }),
  A("portfolio", "Portfolio créatif", ["créatif", "portfolio", "catégories"], "Ton créatif : accueil et réalisations par catégorie.", { title: "Cette page a pris la fuite", text: "<p>Pendant qu'on la cherche, découvrez le reste de nos réalisations.</p>", actions: [["Voir les réalisations", "/blog"], HOME.concat("outline")], extras: (k) => [cats(k)], side: (k) => [cats(k)] }),
  A("texte", "Texte seul", ["minimaliste", "typographique", "lien"], "Une phrase et un lien, rien d'autre.", { title: "Rien à voir ici", text: "<p>Cette page n'existe pas.</p>", actions: [["Retourner à l'accueil", "/", "link"]], side: (k) => [k.LINK("Parcourir le blog", "/blog"), k.LINK("Voir le catalogue", "/catalogue")] }),
  A("actualites", "Actualités", ["actualités", "blog", "liste"], "Message et liste des dernières actualités.", { title: "Page introuvable — lisez plutôt nos actualités", extras: (k) => [recentList(k, "Dernières actualités", 5)], side: (k) => [recentList(k, "Dernières actualités", 5)] }),
  A("contact-direct", "Contact direct", ["contact", "service", "accueil"], "Contact et accueil mis au même niveau.", { title: "Nous ne trouvons pas cette page", text: "<p>Dites-nous ce que vous cherchiez : nous vous répondrons rapidement.</p>", actions: [["Nous écrire", "/contact"], ["Retour à l'accueil", "/", "outline"]], side: (k) => [help(k)] }),
];

// ── Traitements : cinq compositions structurellement différentes d'un même contenu ──────────────────
const act = (k, a, st = {}) => k.B(a[0], a[1], a[2] === "link" || a[2] === "outline" ? (a[2] === "link" ? undefined : "outline") : a[2], st);
const buttons = (k, A, st = {}, btn = {}) => k.row(A.actions.map((a) => (a[2] === "link" ? k.LINK(a[0], a[1]) : act(k, a, btn))), { gap: "16px", ...st });
// Zone principale : centrée verticalement (hauteur minimale 60 % de l'écran, comme la section pleine hauteur recommandée par Elementor) avec de l'air entre les blocs
const wrapW = (st = {}) => ({ maxWidth: "1100px", marginLeft: "auto", marginRight: "auto", width: "100%", gap: "44px", minHeight: "60vh", justifyContent: "center", ...st });
const TREATMENTS = [
  { key: "centre", label: "Centré", skinShift: 0, tag: "centré",
    build: (k, A) => [k.section([k.col([k.L(EYEBROW, { textAlign: "center" }), k.H(A.title, "1", { textAlign: "center" }), k.T(A.text, { color: k.S.mute, fontSize: "17px", textAlign: "center" }), buttons(k, A, { justifyContent: "center" })], { maxWidth: "720px", marginLeft: "auto", marginRight: "auto", width: "100%", alignItems: "center" }), ...A.extras(k).map((e) => e)], wrapW({ alignItems: "center" }))] },
  { key: "scinde", label: "Deux colonnes", skinShift: 1, tag: "colonnes",
    build: (k, A) => [k.section([k.row([k.col([k.L(EYEBROW), k.H(A.title, "1"), k.T(A.text, { color: k.S.mute, fontSize: "17px" }), buttons(k, A)], { flexBasis: "0px", flexGrow: 1, minWidth: "260px", alignItems: "flex-start" }),
      k.card(A.side ? A.side(k) : A.extras(k), { flexBasis: "0px", flexGrow: 1, minWidth: "260px" })], { alignItems: "stretch", gap: "40px" })], wrapW())] },
  { key: "editorial", label: "Éditorial à gauche", skinShift: 2, tag: "éditorial",
    build: (k, A) => [k.section([k.col([k.H("404", "2", { fontSize: "120px", lineHeight: 1, color: k.S.accent }), k.col([k.L(EYEBROW), k.H(A.title, "1", { fontSize: "44px", lineHeight: 1.1 }), k.T(A.text, { color: k.S.mute, maxWidth: "560px" }), buttons(k, A, { gap: "24px" })],
      { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "4px", borderColor: k.S.accent, paddingLeft: "24px", alignItems: "flex-start", width: "100%" })], { gap: "20px", alignItems: "flex-start" }), ...A.extras(k)], wrapW({ maxWidth: "860px" }))] },
  { key: "bandeau", label: "Bandeau pleine largeur", skinShift: 3, tag: "bandeau",
    build: (k, A) => [k.section([k.col([k.L(EYEBROW, { color: k.S.onAccent, textAlign: "center" }), k.H(A.title, "1", { color: k.S.onAccent, textAlign: "center" }), k.T(A.text, { color: k.S.onAccent, textAlign: "center" }), buttons(k, A, { justifyContent: "center" }, { color: k.S.onAccent, borderColor: k.S.onAccent })], { maxWidth: "720px", marginLeft: "auto", marginRight: "auto", width: "100%", alignItems: "center" })],
      { backgroundColor: k.S.accent, borderRadius: k.S.radius, paddingTop: "72px", paddingBottom: "72px" }), ...(A.extras(k).length ? [k.section(A.extras(k), wrapW({ paddingTop: "8px", alignItems: "center", minHeight: "0px" }))] : [])] },
  { key: "carte", label: "Carte centrale", skinShift: 4, tag: "carte",
    build: (k, A) => [k.section([k.card([k.H("404", "2", { fontSize: "64px", lineHeight: 1, textAlign: "center", color: k.S.accent }), k.divider({ width: "100%" }), k.H(A.title, "1", { textAlign: "center", fontSize: "32px" }), k.T(A.text, { color: k.S.mute, textAlign: "center" }), buttons(k, A, { justifyContent: "center" })], { maxWidth: "640px", marginLeft: "auto", marginRight: "auto", width: "100%", alignItems: "center", gap: "18px", paddingTop: "40px", paddingBottom: "40px" }), ...A.extras(k)], wrapW({ alignItems: "center" }))] },
];
const SKIN_ORDER = ["clair", "marque", "nuit", "editorial", "doux"];

// 100 entrées : l'identité visuelle varie avec le traitement ET le contenu, de façon déterministe
function entries() {
  const out = [];
  ARCHETYPES.forEach((a, i) => TREATMENTS.forEach((t) => {
    const skinKey = SKIN_ORDER[(i + t.skinShift) % SKIN_ORDER.length];
    out.push({ key: `${a.key}.${t.key}`, layoutKey: a.key, layoutLabel: a.label, treatmentKey: t.key, skinKey, name: `${a.label} · ${t.label}`, desc: a.desc, tags: [...a.tags, t.tag, skinKey], build: (k) => t.build(k, a) });
  }));
  return out;
}
module.exports = { type: "not_found", kind: "page", entries, layouts: ARCHETYPES.map((a) => ({ key: a.key, label: a.label, tags: a.tags, desc: a.desc })) };
