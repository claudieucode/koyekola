// Catalogue « Page individuelle » : 20 mises en page × 5 identités visuelles = 100 modèles pour les pages statiques (à propos, services, contact, entreprise, landing…). Titre {{post.title}} + contenu
// (postcontent) toujours présents. Les textes d'exemple sont des CONSIGNES à remplacer : aucun chiffre, témoignage, adresse ou lien inventé.
const L = (key, label, tags, desc, build) => ({ key, label, tags, desc, build });
const W = (k, max = "820px", st = {}) => ({ maxWidth: max, marginLeft: "auto", marginRight: "auto", width: "100%", ...st });
const ICONS = (items, a = {}) => ({ items: items.map((text) => ({ text, icon: "check" })), ...a });
const SOC = [{ network: "facebook", url: "https://www.facebook.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }];

module.exports = { type: "single_page", kind: "page", layouts: [
  L("classique", "Classique", ["classique", "simple", "texte"], "Titre puis contenu dans une colonne centrée.", (k) => [k.section([k.H("{{post.title}}", "1"), k.W("postcontent", {})], W(k))]),
  L("etroit", "Colonne étroite", ["étroit", "lecture", "mentions"], "Colonne de lecture étroite, titre centré : idéal pour mentions légales et textes longs.", (k) => [k.section([k.H("{{post.title}}", "1", { textAlign: "center" }), k.divider(), k.W("postcontent", {})], W(k, "680px"))]),
  L("bandeau", "Bandeau titre coloré", ["bandeau", "couleur", "titre"], "Bandeau de couleur pour le titre, contenu dessous.", (k) => [
    k.band([k.inner([k.H("{{post.title}}", "1", { color: k.S.onAccent })], { justifyContent: "center" })], { backgroundColor: k.S.accent, color: k.S.onAccent, paddingTop: "64px", paddingBottom: "64px", borderBottomWidth: "0px" }, null, null, "Bandeau du titre"),
    k.section([k.W("postcontent", {})], W(k))]),
  L("heros", "Héros d'ouverture", ["héros", "présentation", "appel à l'action"], "Grand titre centré avec phrase d'accroche et bouton, puis contenu.", (k) => [
    k.band([k.inner([k.col([k.H("{{post.title}}", "1", { fontSize: "52px", textAlign: "center" }), k.T("<p>Une phrase d'accroche qui présente votre activité en une ligne — modifiez ce texte.</p>", { textAlign: "center", fontSize: "20px", color: k.S.mute }), k.row([k.B("Nous contacter", "/contact")], { justifyContent: "center" })], { alignItems: "center", maxWidth: "760px" })], { justifyContent: "center" })], { backgroundColor: k.S.alt, paddingTop: "96px", paddingBottom: "96px" }, null, null, "Héros"),
    k.section([k.W("postcontent", {})], W(k))]),
  L("a-propos", "À propos", ["à propos", "présentation", "équipe"], "Titre et texte à gauche, emplacement de portrait à droite via l'image mise en avant.", (k) => [k.section([
    k.grid(2, [k.col([k.L("Qui sommes-nous ?"), k.H("{{post.title}}", "1"), k.W("postcontent", {})]), k.img("post.image", { maxHeight: "480px" })], { gridTemplate: "3fr 2fr", alignItems: "start" })], W(k, "1100px"))]),
  L("services", "Services en colonnes", ["services", "colonnes", "offre"], "Texte puis trois colonnes de présentation à compléter.", (k) => [k.section([
    k.H("{{post.title}}", "1", { textAlign: "center" }), k.W("postcontent", {}),
    k.grid(3, ["Premier service", "Deuxième service", "Troisième service"].map((t) => k.card([k.H(t, "3"), k.W("iconlist", ICONS(["Décrivez ce que comprend ce service", "Précisez à qui il s'adresse"]))])))], W(k, "1100px"))]),
  L("avantages", "Liste d'atouts", ["atouts", "avantages", "liste"], "Texte et liste d'atouts à compléter en deux colonnes.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.grid(2, [k.W("postcontent", {}), k.card([k.H("Nos atouts", "3"), k.W("iconlist", ICONS(["Un premier atout à préciser", "Un deuxième atout à préciser", "Un troisième atout à préciser"], { divider: true }))])], { gridTemplate: "3fr 2fr", alignItems: "start" })], W(k, "1100px"))]),
  L("contact", "Contact", ["contact", "coordonnées", "rendez-vous"], "Contenu à gauche, carte de coordonnées à compléter à droite.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.grid(2, [k.W("postcontent", {}), k.card([k.H("Nous joindre", "3"), k.T("<p>Indiquez ici vos horaires et la manière de vous joindre.</p>"), k.B("Écrire un message", "/contact")])], { gridTemplate: "3fr 2fr", alignItems: "start" })], W(k, "1100px"))]),
  L("entreprise", "Entreprise", ["entreprise", "réseaux", "professionnel"], "Présentation de l'entreprise avec liens vers les réseaux.", (k) => [k.section([
    k.L("Notre entreprise"), k.H("{{post.title}}", "1"), k.W("postcontent", {}), k.divider(), k.row([k.T("<p>Suivez-nous</p>", { fontWeight: "600" }), k.social(SOC)], { gap: "16px" })], W(k, "860px"))]),
  L("landing", "Page d'atterrissage", ["landing", "conversion", "appel à l'action"], "Titre, contenu, puis grand appel à l'action pleine largeur.", (k) => [
    k.section([k.H("{{post.title}}", "1", { fontSize: "46px" }), k.W("postcontent", {})], W(k)),
    k.band([k.inner([k.col([k.H("Prêt à passer à l'étape suivante ?", "2", { color: k.S.onAccent, textAlign: "center" }), k.T("<p>Modifiez ce message pour inviter le visiteur à agir.</p>", { color: k.S.onAccent, textAlign: "center" }), k.row([k.B("Commencer", "/catalogue", "outline", { backgroundColor: k.S.onAccent, color: k.S.accent, borderColor: k.S.onAccent })], { justifyContent: "center" })], { alignItems: "center", width: "100%" })], { justifyContent: "center" })], { backgroundColor: k.S.accent, color: k.S.onAccent, paddingTop: "64px", paddingBottom: "64px", borderBottomWidth: "0px" }, null, null, "Appel à l'action")]),
  L("deux-colonnes", "Deux colonnes de texte", ["colonnes", "journal", "texte long"], "Contenu réparti en deux colonnes de journal.", (k) => [k.section([k.H("{{post.title}}", "1", { textAlign: "center" }), k.W("postcontent", {}, { columnCount: 2, columnGap: "40px" }, { columnCount: 1 }, { columnCount: 1 })], W(k, "1100px"))]),
  L("barre-laterale", "Barre latérale de liens", ["navigation", "barre latérale", "sous-pages"], "Menu vertical à gauche, contenu à droite.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.grid(2, [k.card([k.L("Dans cette section"), k.menu("header", { fontSize: "15px" }, true)]), k.W("postcontent", {})], { gridTemplate: "1fr 3fr", alignItems: "start" })], W(k, "1100px"))]),
  L("faq", "Questions fréquentes", ["faq", "aide", "accordéon"], "Contenu puis accordéon de questions à compléter.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postcontent", {}),
    k.H("Questions fréquentes", "2"), k.W("accordion", { items: [{ q: "[Écrivez ici votre première question]", a: "[Rédigez la réponse : elle doit venir de vous, pas de ce modèle.]" }, { q: "[Écrivez ici une deuxième question]", a: "[Rédigez la réponse.]" }], openFirst: true })], W(k, "820px"))]),
  L("sommaire", "Sommaire en tête", ["sommaire", "document", "guide"], "Table des matières puis contenu : pour les guides et pages longues.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("toc", { title: "Sur cette page", depth: "3", numbered: true }), k.W("postcontent", {})], W(k, "800px"))]),
  L("fil-ariane", "Avec fil d'Ariane", ["navigation", "référencement", "sobre"], "Fil d'Ariane au-dessus du titre.", (k) => [k.section([
    k.W("breadcrumb", { items: [{ label: "Accueil", url: "/" }, { label: "Cette page" }], separator: "slash" }), k.H("{{post.title}}", "1"), k.W("postcontent", {})], W(k))]),
  L("carte", "Contenu en carte", ["carte", "encadré", "relief"], "Contenu posé dans une carte centrée.", (k) => [k.section([
    k.card([k.H("{{post.title}}", "1"), k.W("postcontent", {})], { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", gap: "20px" })], W(k, "820px"))]),
  L("image-large", "Visuel en ouverture", ["image", "visuel", "présentation"], "Image mise en avant pleine largeur, puis titre et contenu.", (k) => [
    k.img("post.image", { maxHeight: "440px", borderRadius: "0px" }), k.section([k.H("{{post.title}}", "1"), k.W("postcontent", {})], W(k))]),
  L("minimal", "Minimal", ["minimaliste", "sobre", "texte"], "Titre et contenu sans aucun ornement.", (k) => [k.section([k.H("{{post.title}}", "1", { fontSize: "34px" }), k.W("postcontent", {})], W(k, "720px", { gap: "16px" }))]),
  L("equipe", "Équipe et auteurs", ["équipe", "auteurs", "présentation"], "Contenu puis liste dynamique des auteurs du site.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postcontent", {}), k.W("querylist", { title: "Nos auteurs", source: "authors", mode: "popular", count: 6, layout: "cards", showExcerpt: true })], W(k, "1000px"))]),
  L("actualites", "Page et actualités", ["actualités", "blog", "accueil"], "Contenu de la page suivi des derniers articles du blog.", (k) => [k.section([
    k.H("{{post.title}}", "1"), k.W("postcontent", {}), k.H("Dernières actualités", "2"), k.W("querylist", { source: "posts", mode: "recent", count: 3, layout: "cards", showExcerpt: true })], W(k, "1000px"))]),
] };
