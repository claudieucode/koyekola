// Groupe 4 — Vente (31-35) et Portfolio (36-42)
const h = require("./h");
const { dir, L, W, p, H1, content, desc, sect, band, head, boxes, cards, steps, faq, tabs, quote, plan, note, cta, counter, marquee, form, person, slot } = h;
module.exports = [
  L(dir(31), "vente-offre", "Présentation d'offre", ["vente", "offre", "colonne collante"], "Contenu de l'offre à gauche, carte de formule collante à droite : une offre unique, un seul geste attendu.", (k) => [
    sect(k, [H1(k, 44), k.grid(2, [k.col([desc(k), content(k), faq(k, 3)], { gap: "20px" }), k.col([plan(k, "[Votre offre]", true)], { position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "3fr 2fr", alignItems: "start" })], "1100px")]),
  L(dir(32), "vente-lancement", "Page de lancement", ["vente", "lancement", "compte à rebours"], "Compte à rebours, promesse et inscription à la liste d'attente : la page d'un produit à venir.", (k) => [
    band(k, [k.col([k.W("badge", { text: "[Bientôt]", tone: "neutral" }), H1(k, 56, { textAlign: "center" }), W(k, "countdown", { until: "2099-01-01T09:00:00Z" }), note(k, "info", "Date à confirmer", "[Remplacez la date du compte à rebours par celle de votre lancement.]")], { maxWidth: "760px", alignItems: "center" })], { paddingTop: "72px", paddingBottom: "72px" }),
    sect(k, [desc(k), content(k), W(k, "emailsubscribe", { title: "Rejoindre la liste d'attente", intro: "", button: "Me prévenir", formId: 0 })], "720px")]),
  L(dir(33), "vente-prospects", "Génération de prospects", ["vente", "prospects", "ressource"], "Une ressource à recevoir contre une adresse e-mail : bénéfices à gauche, formulaire à droite.", (k, env) => [
    sect(k, [k.grid(2, [k.col([k.L("[Ressource gratuite]"), H1(k, 46), desc(k), boxes(k, 1, [["check", "[Ce que vous apprendrez]", "[En une ligne.]"]]), content(k)], { gap: "16px" }), form(k, env, "Recevoir la ressource", "Indiquez votre adresse.", "Recevoir")], { gridTemplate: "1fr 1fr", alignItems: "center" })], "1040px")]),
  L(dir(34), "vente-capture", "Capture d'e-mails", ["vente", "newsletter", "minimal"], "Une promesse et un seul champ, centrés sur la page : la capture d'adresses la plus simple.", (k) => [
    sect(k, [k.spacer("40"), H1(k, 52, { textAlign: "center" }), desc(k, { textAlign: "center" }), W(k, "emailsubscribe", { title: "Je m'abonne", intro: "", button: "S'abonner", formId: 0 }), content(k)], "620px")]),
  L(dir(35), "vente-produit", "Présentation de produit", ["vente", "produit", "galerie"], "Galerie, caractéristiques et achat : le bloc d'achat s'affiche si le module Commerce est actif.", (k, env) => [
    sect(k, [H1(k, 44), k.grid(2, [slot(k, "Galerie de visuels", 260), k.col([desc(k), ...(env && env.commerce ? [W(k, "shopbuy", {})] : []), boxes(k, 1, [["check", "[Caractéristique]", "[En une ligne.]"]])], { gap: "16px" })], { gridTemplate: "1fr 1fr", alignItems: "start" }), content(k), faq(k, 3)], "1100px")]),
  L(dir(36), "portfolio-graphique", "Portfolio graphique", ["portfolio", "graphisme", "grille"], "Titre, grille régulière de projets (galerie) et texte de présentation : l'essentiel d'un portfolio de designer.", (k) => [
    sect(k, [k.grid(2, [H1(k, 52), desc(k)], { gridTemplate: "1fr 1fr", alignItems: "end" }), slot(k, "Galerie de visuels", 260), content(k)], "1180px")]),
  L(dir(37), "portfolio-photo", "Portfolio photo", ["portfolio", "photographie", "carrousel"], "Carrousel d'images pleine largeur, titre centré et texte court : le portfolio d'un photographe.", (k) => [
    band(k, [slot(k, "Carrousel de photos", 420)], { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px" }),
    sect(k, [H1(k, 44, { textAlign: "center" }), desc(k, { textAlign: "center" }), content(k)], "700px")]),
  L(dir(38), "portfolio-video", "Portfolio vidéo", ["portfolio", "vidéo", "liste de lecture"], "Liste de lecture vidéo en vedette, puis description et contact : le portfolio d'un vidéaste.", (k) => [
    sect(k, [H1(k, 48), slot(k, "Lecteur vidéo", 360), k.grid(2, [content(k), desc(k)], { gridTemplate: "2fr 1fr", alignItems: "start" }), cta(k, "Un projet vidéo ?", "Une phrase d'invitation.")], "1120px")]),
  L(dir(39), "portfolio-agence", "Portfolio d'agence", ["portfolio", "agence", "cartes de projets"], "Six projets en cartes, chiffres clés et clients : la vitrine d'une agence.", (k) => [
    sect(k, [H1(k, 50), desc(k), k.grid(3, [slot(k, "Projet : visuel et titre", 200), slot(k, "Projet : visuel et titre", 200), slot(k, "Projet : visuel et titre", 200)]), content(k), k.grid(3, [counter(k, "projets livrés, à renseigner"), counter(k, "clients, à renseigner"), counter(k, "années, à renseigner")]), marquee(k, ["[Client 1]", "[Client 2]", "[Client 3]"])], "1180px")]),
  L(dir(40), "portfolio-etudes", "Étude de cas détaillée", ["portfolio", "étude de cas", "résultats"], "Contexte, démarche en onglets, frise du projet et résultat : le récit d'une réalisation.", (k) => [
    sect(k, [k.L("[Étude de cas]"), H1(k, 50), desc(k)], "900px"),
    sect(k, [content(k), tabs(k, ["[Contexte]", "[Démarche]", "[Résultats]"]), steps(k, [["[Phase]", "[Étape 1]", "[Ce qui a été fait.]"], ["[Phase]", "[Étape 2]", "[Ce qui a été fait.]"]]), quote(k)], "900px")]),
  L(dir(41), "portfolio-editorial", "Portfolio éditorial", ["portfolio", "éditorial", "colonnes alternées"], "Colonnes alternées texte et image, filets fins et légendes : un portfolio traité comme un livre.", (k) => [
    sect(k, [H1(k, 56), k.divider({ borderColor: k.S.fg }), k.grid(2, [k.col([desc(k), content(k)]), slot(k, "Galerie de visuels", 260)], { gridTemplate: "1fr 1fr", alignItems: "start" }), k.divider({ borderColor: k.S.fg }), k.grid(2, [slot(k, "Galerie de visuels", 260), k.col([k.H("[Légende]", "3", { fontFamily: k.S.head }), k.T(p("[Texte de la seconde partie.]"))])], { gridTemplate: "1fr 1fr", alignItems: "start" })], "1100px")]),
  L(dir(42), "portfolio-immersif", "Portfolio immersif", ["portfolio", "immersif", "scènes"], "Scènes épinglées au défilement et portfolio animé : une expérience plein écran maîtrisée.", (k) => [
    sect(k, [H1(k, 60), desc(k), slot(k, "Scènes du portfolio", 420), content(k)], "1200px")]),
];
