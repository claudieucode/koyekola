// Groupe 1 — Accueils (7) et début des pages « À propos » (3) : chaque modèle a sa propre identité fixe.
const h = require("./h");
const { ID, L, W, p, H1, content, desc, sect, band, head, boxes, cards, steps, faq, quote, person, plan, cta, counter, marquee, tabs, lab } = h;
const S = {
  corp: ID(["corporate", "Corporate bleu net", "light", "#f5f7fb", "#0e1a35", "#4b5878", "#e6ebf6", "#1d4ed8", "#ffffff", "#cfd8ec", "font.lato", "font.league-spartan"]),
  mini: ID(["minimal", "Journal sobre", "edit", "#f4efe6", "#161616", "#55504a", "#e9e1d3", "#a31621", "#ffffff", "#161616", "font.source-sans-3", "font.playfair-display"]),
  crea: ID(["creatif", "Minuit violet", "dark", "#0b0f1a", "#eef2ff", "#a3accb", "#151b2e", "#a78bfa", "#0b0f1a", "#2a3150", "font.ibm-plex-sans", "font.space-grotesk"]),
  saas: ID(["saas", "Orange logiciel", "light", "#ffffff", "#1c1917", "#57534e", "#fff1e6", "#c2410c", "#ffffff", "#f1d9c8", "font.nunito-sans", "font.poppins"]),
  shop: ID(["boutique", "Vert marché", "brand", "#ecfdf5", "#064e3b", "#3f6f5c", "#d1fae5", "#065f46", "#ffffff", "#b6ead0", "font.barlow", "font.barlow-condensed"]),
  edit: ID(["edito", "Ivoire bordeaux", "edit", "#fbf6ee", "#2a1215", "#6b4a4e", "#f1e6d6", "#7a1f2b", "#ffffff", "#2a1215", "font.inter", "font.fraunces"]),
  comm: ID(["communaute", "Pêche douce", "soft", "#fff4ee", "#4a2c2a", "#7a5550", "#ffe3d3", "#b4452f", "#ffffff", "#f6cdb8", "font.nunito", "font.lora"]),
  entr: ID(["entreprise", "Craie et bleu", "light", "#faf9f6", "#1b1b1b", "#55555a", "#eeece6", "#2b59ff", "#ffffff", "#dcdad2", "font.inter", "font.manrope"]),
  hist: ID(["histoire", "Brume cuivre", "light", "#f3f6f8", "#1e2a33", "#4f5f6b", "#e1e8ed", "#b4531f", "#ffffff", "#cdd7de", "font.work-sans", "font.dm-sans"]),
  miss: ID(["mission", "Lin violet", "soft", "#f6f3ea", "#2a2a1c", "#5a5a45", "#ebe6d6", "#6d28d9", "#ffffff", "#ddd6c1", "font.source-sans-3", "font.plus-jakarta-sans"]),
};
module.exports = [
  L(S.corp, "accueil-corporate", "Accueil corporate", ["accueil", "corporate", "b2b"], "Héros en deux colonnes avec boutons, bande de repères chiffrés, trois services et appel à l'action : l'accueil d'une entreprise qui s'adresse à d'autres entreprises.", (k) => [
    sect(k, [k.grid(2, [k.col([lab(k, "[Votre secteur en deux mots]"), H1(k, 50), desc(k), k.row([k.B("Découvrir nos services", "/services"), k.B("Nous contacter", "/contact", "outline")])], { gap: "18px" }), cards(k, 1, [["briefcase", "[Votre promesse]", "[Une phrase qui la prouve.]"]])], { gridTemplate: "3fr 2fr", alignItems: "center" })]),
    band(k, [k.grid(3, [counter(k, "ce que mesure ce chiffre, et sa source"), counter(k, "deuxième repère"), counter(k, "troisième repère")])], { backgroundColor: k.S.alt }),
    sect(k, [content(k), ...head(k, "Nos services"), boxes(k, 3, [["layers", "[Service 1]", "[En une ligne.]"], ["shield", "[Service 2]", "[En une ligne.]"], ["zap", "[Service 3]", "[En une ligne.]"]])]),
    sect(k, [cta(k, "Parlons de votre projet", "Une phrase qui invite à écrire.")], "820px")]),
  L(S.mini, "accueil-minimaliste", "Accueil minimaliste", ["accueil", "minimaliste", "sobre"], "Un titre immense, un seul paragraphe, un seul lien : l'accueil d'une marque qui préfère le silence au bruit.", (k) => [
    sect(k, [k.spacer("48"), H1(k, 88, { lineHeight: 1.0, letterSpacing: "-2px" }), k.divider({ borderTopWidth: "3px", borderColor: k.S.fg }), k.grid(2, [desc(k, { fontSize: "21px" }), content(k)], { gridTemplate: "1fr 1fr", alignItems: "start" }), k.row([k.B("Voir le travail", "/", "outline")]), k.spacer("48")], "1000px")]),
  L(S.crea, "accueil-creatif", "Accueil créatif", ["accueil", "créatif", "studio"], "Titre qui change de mot, bandeau défilant de disciplines et rail horizontal de projets.", (k) => [
    sect(k, [W(k, "animatedheading", { before: "[Nous créons]", words: ["[discipline 1]", "[discipline 2]", "[discipline 3]"], after: "[pour vous]", level: "2", effect: "fade", interval: 2500 }), H1(k, 54), desc(k)]),
    marquee(k, ["[Discipline 1]", "[Discipline 2]", "[Discipline 3]", "[Discipline 4]"]),
    sect(k, [content(k), W(k, "motionhgallery", {}, { width: "100%" })], "1200px")]),
  L(S.saas, "accueil-saas", "Accueil SaaS", ["accueil", "saas", "logiciel"], "Héros produit centré, bande de noms de clients, trois bénéfices, formules courtes et questions fréquentes.", (k) => [
    band(k, [k.col([k.W("badge", { text: "[Nouveauté ou promesse]", tone: "neutral" }), H1(k, 56, { textAlign: "center", color: k.S.onAccent }), desc(k, { textAlign: "center", color: k.S.onAccent }), k.row([k.B("Essayer", "/contact", "outline"), k.B("Voir les tarifs", "/tarifs")], { justifyContent: "center" })], { maxWidth: "820px" })], { paddingTop: "64px", paddingBottom: "64px", backgroundColor: k.S.accent }),
    marquee(k, ["[Nom de client 1]", "[Nom de client 2]", "[Nom de client 3]"]),
    sect(k, [boxes(k, 3, [["zap", "[Bénéfice 1]", "[En une ligne.]"], ["lock", "[Bénéfice 2]", "[En une ligne.]"], ["trendingUp", "[Bénéfice 3]", "[En une ligne.]"]]), content(k), k.grid(3, [plan(k, "[Formule 1]"), plan(k, "[Formule 2]", true), plan(k, "[Formule 3]")]), faq(k, 3)])]),
  L(S.shop, "accueil-boutique", "Accueil boutique", ["accueil", "e-commerce", "boutique"], "Bandeau promotionnel, rayons mis en avant et arguments de confiance ; la grille de produits apparaît si le module Commerce est actif.", (k, env) => [
    sect(k, [W(k, "cta", { skin: "classic", title: "[Offre du moment]", titleTag: "h2", text: "[Décrivez l'offre : à renseigner par vous.]", buttonLabel: "Voir la boutique", link: "/boutique", align: "center" }), H1(k, 44, { textAlign: "center" })], "980px"),
    sect(k, [content(k), ...(env && env.commerce ? [W(k, "shopgrid", {})] : []), boxes(k, 4, [["send", "[Livraison]", "[Votre engagement.]"], ["shield", "[Paiement]", "[Votre engagement.]"], ["history", "[Retours]", "[Votre engagement.]"], ["heart", "[Service]", "[Votre engagement.]"]])])]),
  L(S.edit, "accueil-editorial", "Accueil éditorial", ["accueil", "média", "à la une"], "Une à la une, la liste des articles récents en colonne et une rubrique d'abonnement : l'accueil d'un média.", (k) => [
    sect(k, [k.grid(2, [k.col([lab(k, "[Rubrique à la une]"), H1(k, 52), desc(k), content(k)], { gap: "16px" }), W(k, "querylist", { title: "Dernières publications", source: "posts", mode: "recent", count: 5, layout: "list", showImage: false })], { gridTemplate: "3fr 2fr", alignItems: "start" })], "1180px"),
    sect(k, [W(k, "emailsubscribe", { title: "Recevoir la lettre", intro: "", button: "S'abonner", formId: 0 })], "780px")]),
  L(S.comm, "accueil-communautaire", "Accueil communautaire", ["accueil", "communauté", "réseau"], "Invitation à rejoindre, compteurs de vie de la communauté et profils de membres à renseigner.", (k) => [
    sect(k, [k.col([H1(k, 46, { textAlign: "center" }), desc(k, { textAlign: "center" }), k.row([k.B("Rejoindre", "/contact")], { justifyContent: "center" })], { maxWidth: "760px", alignSelf: "center", gap: "16px" })]),
    sect(k, [k.grid(3, [counter(k, "membres, à renseigner"), counter(k, "rencontres, à renseigner"), counter(k, "projets, à renseigner")]), content(k), k.grid(3, [person(k, "[Rôle]"), person(k, "[Rôle]"), person(k, "[Rôle]")])])]),
  L(S.entr, "apropos-entreprise", "Présentation d'entreprise", ["à propos", "entreprise", "repères"], "Ouverture sobre, trois colonnes de repères, compteurs et conclusion : la page de présentation d'une société.", (k) => [
    sect(k, [lab(k, "[Qui nous sommes]"), H1(k, 46), desc(k)], "860px"),
    sect(k, [content(k), boxes(k, 3, [["trophy", "[Repère 1]", "[En une ligne.]"], ["users", "[Repère 2]", "[En une ligne.]"], ["globe", "[Repère 3]", "[En une ligne.]"]]), k.grid(2, [counter(k, "chiffre clé 1"), counter(k, "chiffre clé 2")])]),
    sect(k, [cta(k, "Travaillons ensemble", "Une phrase d'invitation.")], "820px")]),
  L(S.hist, "apropos-histoire", "Histoire de marque", ["à propos", "histoire", "chapitres"], "Récit en chapitres verticaux : une frise, des temps forts, la suite à écrire.", (k) => [
    sect(k, [H1(k, 48), desc(k), content(k)], "860px"),
    sect(k, [...head(k, "Notre parcours"), steps(k, [["[Date]", "[Premier chapitre]", "[Ce qui s'est passé.]"], ["[Date]", "[Deuxième chapitre]", "[Ce qui s'est passé.]"], ["[Date]", "[Troisième chapitre]", "[Ce qui s'est passé.]"]]), quote(k)], "900px")]),
  L(S.miss, "apropos-mission", "Mission et vision", ["à propos", "mission", "vision"], "Deux grands blocs face à face (mission, vision) qui se retournent au survol, puis valeurs en cartes.", (k) => [
    sect(k, [H1(k, 44, { textAlign: "center" }), content(k), k.grid(2, [W(k, "flipbox", { icon: "star", frontTitle: "[Notre mission]", frontText: "[Survolez pour lire.]", backTitle: "[Mission]", backText: "[Rédigez votre mission.]", effect: "flip", height: 280 }), W(k, "flipbox", { icon: "eye", frontTitle: "[Notre vision]", frontText: "[Survolez pour lire.]", backTitle: "[Vision]", backText: "[Rédigez votre vision.]", effect: "flip", height: 280 })]), cards(k, 3, [["heart", "[Valeur 1]", "[En une ligne.]"], ["star", "[Valeur 2]", "[En une ligne.]"], ["shield", "[Valeur 3]", "[En une ligne.]"]])], "1000px")]),
];
