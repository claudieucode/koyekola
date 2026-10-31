// Catalogue « Pied de page » : 20 mises en page × 5 identités visuelles = 100 modèles. Chaque mise en page est une STRUCTURE différente (colonnes, rangées, place de la marque,
// de la navigation, de l'abonnement, des listes dynamiques). Navigation = menu « Pied de page » du CMS ; listes = widgets dynamiques (aucun lien ni chiffre inventé).
const L = (key, label, tags, desc, build) => ({ key, label, tags, desc, build });
const NETWORKS = [{ network: "facebook", url: "https://www.facebook.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }];
const copy = (k, st = {}) => k.W("copyright", { owner: "", text: "Tous droits réservés." }, { color: k.S.mute, fontSize: "13px", ...st });
const about = (k, st = {}) => k.T("<p>Décrivez en une ou deux phrases votre activité et ce que vos visiteurs trouveront ici.</p>", { color: k.S.mute, fontSize: "14px", maxWidth: "360px", ...st });
const nav = (k, st = {}) => k.menu("footer", st, true);
const navRow = (k, st = {}) => k.menu("footer", { fontSize: "14px", ...st }, false);
const colSt = { flexBasis: "0px", flexGrow: 1, minWidth: "180px", alignItems: "flex-start" };
const column = (k, title, children, st = {}) => k.col([k.L(title), ...children], { ...colSt, ...st });
const cats = (k, title = "Catégories") => k.W("querylist", { title: "", source: "categories", mode: "popular", count: 6, layout: "list", showCount: false, empty: "Les catégories apparaîtront ici." }, { color: k.S.fg, fontSize: "14px" });
const recent = (k, n = 3, layout = "compact") => k.W("querylist", { title: "", source: "posts", mode: "recent", count: n, layout, showImage: false, showDate: true, empty: "Les articles apparaîtront ici." }, { color: k.S.fg, fontSize: "14px" });
const subscribe = (k, env, heading = "Restez informé", intro = "Décrivez ici ce que recevront vos abonnés.") =>
  env && env.formId ? k.W("signupform", { formId: env.formId, heading, intro, button: "S'abonner" }, { width: "100%" }) : k.col([k.H(heading, "3", { fontSize: "20px" }), k.T(`<p>${intro}</p>`, { color: k.S.mute, fontSize: "14px" }), k.B("S'abonner", "/contact")], { alignItems: "flex-start" });
const legal = (k) => k.row([k.LINK("Cookies", "/cookies", { fontSize: "13px", fontWeight: "500" }), k.LINK("Contact", "/contact", { fontSize: "13px", fontWeight: "500" })], { gap: "16px" });
const stackM = { flexDirection: "column", alignItems: "flex-start" };

module.exports = { type: "footer", kind: "component", layouts: [
  L("une-ligne", "Une ligne", ["minimaliste", "sobre", "copyright"], "Copyright et navigation sur une seule ligne.", (k) => [k.band([k.inner([copy(k), navRow(k)])], { paddingTop: "14px", paddingBottom: "14px" })]),
  L("copyright-seul", "Copyright seul", ["minimaliste", "copyright", "centré"], "Uniquement la ligne de copyright, centrée.", (k) => [k.band([k.inner([copy(k, { textAlign: "center" })], { justifyContent: "center" })], { paddingTop: "12px", paddingBottom: "12px" })]),
  L("trois-colonnes", "Trois colonnes", ["colonnes", "classique", "contact"], "Marque, navigation et appel à nous contacter.", (k) => [
    k.band([k.inner([k.col([k.logo(40), about(k)], colSt), column(k, "Navigation", [nav(k)]), column(k, "Une question ?", [k.T("<p>Dites à vos visiteurs comment vous joindre.</p>", { color: k.S.mute, fontSize: "14px" }), k.B("Nous contacter", "/contact")])], { alignItems: "flex-start" }),
      k.divider(), k.inner([copy(k), legal(k)])], { gap: "28px" })]),
  L("quatre-colonnes", "Quatre colonnes", ["colonnes", "complet", "catégories"], "Marque, navigation, rubriques du site et catégories.", (k) => [
    k.band([k.inner([k.col([k.logo(40), about(k)], colSt), column(k, "Navigation", [nav(k)]), column(k, "Menu principal", [k.menu("header", { fontSize: "15px" }, true)]), column(k, "Catégories", [cats(k)])], { alignItems: "flex-start" }),
      k.inner([copy(k)])], { gap: "32px" })]),
  L("cinq-colonnes", "Cinq colonnes", ["colonnes", "grand site", "réseaux"], "Marque, deux navigations, articles récents et réseaux.", (k) => [
    k.band([k.inner([k.col([k.siteTitle({ fontSize: "20px" }), about(k)], { ...colSt, flexGrow: 2 }), column(k, "Navigation", [nav(k)]), column(k, "Explorer", [k.menu("header", {}, true)]), column(k, "Récents", [recent(k)]), column(k, "Suivez-nous", [k.social(NETWORKS, { gap: "8px" })])], { alignItems: "flex-start" }),
      k.divider(), k.inner([copy(k), legal(k)])], { gap: "28px" })]),
  L("logo-description", "Logo et description", ["marque", "présentation", "navigation"], "Logo et présentation à gauche, navigation à droite, filet puis copyright.", (k) => [
    k.band([k.inner([k.col([k.logo(44), about(k)], { alignItems: "flex-start" }), k.menu("footer", { textAlign: "right" })]), k.divider(), k.inner([copy(k)])], { gap: "24px" })]),
  L("newsletter", "Newsletter", ["newsletter", "abonnement", "conversion"], "Bloc d'abonnement mis en avant dans une carte, navigation dessous.", (k, env) => [
    k.band([k.inner([k.card([subscribe(k, env, "Recevez nos nouveautés")], { width: "100%", maxWidth: "720px", marginLeft: "auto", marginRight: "auto", alignItems: "flex-start" })]),
      k.inner([k.logo(36), navRow(k)]), k.inner([copy(k)], { justifyContent: "center" })], { gap: "28px" })]),
  L("reseaux", "Réseaux sociaux", ["réseaux", "social", "centré"], "Invitation à suivre, grandes icônes de réseaux centrées.", (k) => [
    k.band([k.inner([k.H("Suivez-nous", "3", { fontSize: "24px", textAlign: "center", width: "100%" }), k.social(NETWORKS, { gap: "14px", justifyContent: "center", width: "100%" })], { justifyContent: "center", gap: "14px" }), k.inner([copy(k, { textAlign: "center" })], { justifyContent: "center" })], { gap: "22px" })]),
  L("navigation-secondaire", "Navigation secondaire", ["navigation", "liens utiles", "légal"], "Navigation principale en haut, liens utiles et copyright en bas.", (k) => [
    k.band([k.inner([k.logo(36), navRow(k)]), k.divider(), k.inner([copy(k), k.row([k.LINK("Cookies", "/cookies", { fontSize: "13px", fontWeight: "500" }), k.LINK("Contact", "/contact", { fontSize: "13px", fontWeight: "500" }), k.LINK("Blog", "/blog", { fontSize: "13px", fontWeight: "500" })], { gap: "18px" })])], { gap: "18px" })]),
  L("boutique", "Boutique", ["boutique", "panier", "compte"], "Liens, compte du client, mini-panier et accès à la boutique.", (k) => [
    k.band([k.inner([k.col([k.logo(40), about(k)], colSt), column(k, "Aide et livraison", [nav(k)]), column(k, "Mon espace", [k.account(), k.W("minicart", { label: "Panier", showCount: true, hideEmpty: false }, { color: k.S.fg, fontWeight: "600" })]), column(k, "Acheter", [k.LINK("La boutique", "/boutique"), k.LINK("Le catalogue", "/catalogue"), k.B("Voir la boutique", "/boutique")])], { alignItems: "flex-start" }),
      k.divider(), k.inner([copy(k), legal(k)])], { gap: "28px" })]),
  L("blog", "Blog", ["blog", "catégories", "articles récents"], "Catégories, articles récents et recherche.", (k) => [
    k.band([k.inner([column(k, "À propos", [k.siteTitle({ fontSize: "20px" }), about(k)], { flexGrow: 2 }), column(k, "Catégories", [cats(k)]), column(k, "Articles récents", [recent(k, 4)], { flexGrow: 2 }), column(k, "Rechercher", [k.search("blog")])], { alignItems: "flex-start" }),
      k.inner([copy(k), navRow(k)])], { gap: "30px" })]),
  L("pro", "Site professionnel", ["professionnel", "contact", "rendez-vous"], "Marque, navigation et prise de contact, sobre.", (k) => [
    k.band([k.inner([k.logo(44), navRow(k), k.B("Prendre rendez-vous", "/contact")]), k.inner([copy(k), legal(k)])], { gap: "26px", paddingTop: "36px", paddingBottom: "28px" })]),
  L("formation", "Plateforme de formation", ["formation", "catalogue", "formations"], "Formations récentes du catalogue, navigation et compte élève.", (k) => [
    k.band([k.inner([column(k, "Nos formations", [k.W("courselist", { count: 3, sort: "recent", showPrice: false, cta: "Découvrir", empty: "Les formations apparaîtront ici." }, { width: "100%" })], { flexGrow: 3 }), column(k, "Navigation", [nav(k), k.LINK("Tout le catalogue", "/catalogue")]), column(k, "Espace élève", [k.account(), k.B("Voir le catalogue", "/catalogue")])], { alignItems: "flex-start" }),
      k.divider(), k.inner([copy(k), legal(k)])], { gap: "28px" })]),
  L("marque-geante", "Grande zone de marque", ["marque", "impact", "grand"], "Nom du site en très grand, navigation et copyright dessous.", (k) => [
    k.band([k.inner([k.siteTitle({ fontSize: "72px", lineHeight: 1.05, width: "100%" })]), k.inner([navRow(k), k.B("Nous contacter", "/contact")]), k.inner([copy(k)])], { gap: "26px", paddingTop: "56px", paddingBottom: "32px" }, null, null, "Grande zone de marque")]),
  L("deux-rangees", "Deux rangées", ["complet", "rangées", "réseaux"], "Rangée marque, navigation et réseaux, rangée de copyright sur fond distinct.", (k) => [
    k.band([k.inner([k.logo(40), navRow(k), k.social(NETWORKS, { gap: "8px" })])], { borderBottomWidth: "0px", paddingTop: "30px", paddingBottom: "30px" }),
    k.band([k.inner([copy(k), legal(k)])], { backgroundColor: k.S.alt, paddingTop: "12px", paddingBottom: "12px" }, null, null, "Rangée de copyright")]),
  L("appel-action", "Appel à l'action", ["conversion", "appel à l'action", "bouton"], "Bandeau d'appel à l'action de couleur au-dessus d'un pied de page compact.", (k) => [
    k.band([k.inner([k.col([k.H("Prêt à commencer ?", "2", { color: k.S.onAccent }), k.T("<p>Reformulez ici la proposition que vous faites à vos visiteurs.</p>", { color: k.S.onAccent })], { flexGrow: 1 }), k.B("Nous contacter", "/contact", "outline", { color: k.S.onAccent, borderColor: k.S.onAccent })])], { backgroundColor: k.S.accent, color: k.S.onAccent, paddingTop: "40px", paddingBottom: "40px", borderBottomWidth: "0px" }, null, null, "Appel à l'action"),
    k.band([k.inner([k.logo(36), navRow(k)]), k.inner([copy(k)])], { gap: "18px" })]),
  L("editorial", "Éditorial", ["éditorial", "journal", "filets"], "Titre du site centré entre deux filets, rubriques en ligne, date du jour.", (k) => [
    k.band([k.inner([k.siteTitle({ fontSize: "34px", textAlign: "center", width: "100%" })], { justifyContent: "center", borderTopWidth: "1px", borderBottomWidth: "1px", borderStyle: "solid", borderColor: k.S.line, paddingTop: "16px", paddingBottom: "16px" }),
      k.inner([navRow(k, { textAlign: "center" })], { justifyContent: "center" }),
      k.inner([{ type: "dyntext", props: { source: "today", before: "", after: "", fallback: "", tag: "span" }, styles: { desktop: { color: k.S.mute, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px" } } }, copy(k)])], { gap: "18px" })]),
  L("centre", "Centré", ["centré", "élégant", "réseaux"], "Tout est empilé et centré : logo, navigation, réseaux, copyright.", (k) => [
    k.band([k.col([k.logo(48), navRow(k, { textAlign: "center" }), k.social(NETWORKS, { gap: "10px", justifyContent: "center" }), copy(k, { textAlign: "center" })], { alignItems: "center", gap: "18px", maxWidth: "720px", marginLeft: "auto", marginRight: "auto" })], { paddingTop: "40px", paddingBottom: "32px" })]),
  L("asymetrique", "Colonnes asymétriques", ["asymétrique", "newsletter", "navigation"], "Grande colonne de marque et d'abonnement, deux fines colonnes de liens.", (k, env) => [
    k.band([k.inner([k.col([k.logo(44), about(k), subscribe(k, env, "Abonnez-vous")], { flexBasis: "0px", flexGrow: 3, minWidth: "260px", alignItems: "flex-start", gap: "16px" }), column(k, "Navigation", [nav(k)]), column(k, "Découvrir", [k.menu("header", {}, true)])], { alignItems: "flex-start", gap: "48px" }),
      k.divider(), k.inner([copy(k), legal(k)])], { gap: "28px" })]),
  L("accordeons", "Accordéons mobile", ["mobile", "accordéon", "compact"], "Rubriques qui se déplient (idéal sur téléphone), navigation et copyright.", (k) => [
    k.band([k.inner([k.logo(40)], { justifyContent: "flex-start" }),
      k.inner([k.W("toggle", { title: "À propos", text: "Présentez votre activité en quelques lignes : modifiez ce texte.", open: false }, { color: k.S.fg, width: "100%" }), k.W("toggle", { title: "Nous joindre", text: "Indiquez ici comment vos visiteurs peuvent vous contacter.", open: false }, { color: k.S.fg, width: "100%" })], { ...stackM, alignItems: "stretch", gap: "6px" }),
      k.inner([navRow(k), copy(k)])], { gap: "20px" })]),
] };
