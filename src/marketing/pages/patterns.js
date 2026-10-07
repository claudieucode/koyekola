// Blocs prêts à l'emploi du Page Builder : chacun produit une ou plusieurs VRAIES sections (section libre faite
// d'éléments du registre nodes.js, ou section existante comme le formulaire), entièrement modifiables. Aucun faux
// chiffre, faux prix ni faux témoignage : les textes de départ disent quoi écrire (« [chiffre réel] »). Les blocs qui
// dépendent de données réelles (formations) ne sont proposés que si ces données existent.
const { listCourses } = require("../bridge/catalog");

const H = (text, level = "2", styles) => ({ type: "heading", props: { text, level }, ...(styles ? { styles: { desktop: styles } } : {}) });
const T = (html, styles) => ({ type: "text", props: { html }, ...(styles ? { styles: { desktop: styles } } : {}) });
const B = (label, url = "/catalogue", variant = "primary") => ({ type: "button", props: { label, url, variant } });
const I = (name) => ({ type: "icon", props: { name, size: "32" } });
const card = (children, extra = {}) => ({ type: "stack", children, styles: { desktop: { paddingTop: "24px", paddingRight: "24px", paddingBottom: "24px", paddingLeft: "24px", borderRadius: "12px", backgroundColor: "token:surface", boxShadow: "sm", ...extra } } });
const section = (children, styles = {}) => ({ type: "layout", children: [{ type: "container", children, styles: { desktop: { paddingTop: "64px", paddingBottom: "64px", paddingLeft: "24px", paddingRight: "24px", gap: "24px", ...styles } } }] });
const cols = (n, make) => ({ type: "columns", children: Array.from({ length: n }, (_, i) => ({ type: "column", children: make(i) })) });
const grid = (n, items) => ({ type: "grid", children: items, styles: { desktop: { columns: n }, tablet: { columns: Math.min(n, 2) }, mobile: { columns: 1 } } });

const PATTERNS = [
  { key: "hero", category: "En-tête", label: "Bandeau centré", build: () => [section([
    H("[Le résultat que vous promettez]", "1", { textAlign: "center", fontSize: "48px" }),
    T("<p>[Une phrase qui dit pour qui, et ce qui change pour eux.]</p>", { textAlign: "center", fontSize: "20px" }),
    { type: "group", children: [B("[Action principale]"), B("[Action secondaire]", "/catalogue", "outline")], styles: { desktop: { display: "flex", flexDirection: "row", justifyContent: "center", gap: "12px", flexWrap: "wrap" } } },
  ], { alignItems: "center", paddingTop: "96px", paddingBottom: "96px" })] },
  { key: "hero-split", category: "En-tête", label: "Bandeau en deux colonnes", build: () => [section([cols(2, (i) => (i === 0
    ? [H("[Titre principal]", "1", { fontSize: "44px" }), T("<p>[Ce que la personne obtient, en une ou deux phrases.]</p>"), B("[Je commence]")]
    : [card([H("[Point clé]", "3"), T("<ul><li>[Bénéfice 1]</li><li>[Bénéfice 2]</li><li>[Bénéfice 3]</li></ul>")])]))])] },
  { key: "features", category: "Contenu", label: "Avantages (3 cartes)", build: () => [section([H("[Pourquoi nous choisir]", "2", { textAlign: "center" }),
    grid(3, ["star", "checkCircle", "trophy"].map((ic, i) => card([I(ic), H(`[Avantage ${i + 1}]`, "3"), T("<p>[Ce que la personne y gagne, concrètement.]</p>")])))])] },
  { key: "benefits", category: "Contenu", label: "Bénéfices (liste en 2 colonnes)", build: () => [section([H("[Ce que vous allez obtenir]"),
    cols(2, (i) => [{ type: "list", props: { items: i === 0 ? ["[Bénéfice 1]", "[Bénéfice 2]", "[Bénéfice 3]"] : ["[Bénéfice 4]", "[Bénéfice 5]", "[Bénéfice 6]"], ordered: false } }])])] },
  { key: "testimonials", category: "Preuve", label: "Témoignages (3 cartes)", build: () => [section([H("[Ils en parlent]", "2", { textAlign: "center" }),
    grid(3, [1, 2, 3].map(() => card([{ type: "quote", props: { text: "[Témoignage réel, reproduit avec l'accord de la personne.]", author: "[Prénom N.]" } }])))])] },
  { key: "pricing", category: "Vente", label: "Tarifs (3 offres)", build: () => [section([H("[Choisissez votre formule]", "2", { textAlign: "center" }),
    grid(3, ["[Essentiel]", "[Complet]", "[Accompagné]"].map((name, i) => card([H(name, "3"), H("[prix réel] €", "2", { fontSize: "36px" }), { type: "list", props: { items: ["[Inclus 1]", "[Inclus 2]", "[Inclus 3]"], ordered: false } }, B("[Choisir]", "/catalogue", i === 1 ? "primary" : "outline")], i === 1 ? { borderWidth: "2px", borderStyle: "solid", borderColor: "token:primary" } : {})))])] },
  { key: "stats", category: "Preuve", label: "Chiffres clés (4 colonnes)", build: () => [section([grid(4, [1, 2, 3, 4].map(() => ({ type: "stack", children: [H("[chiffre réel]", "2", { fontSize: "40px", textAlign: "center" }), T("<p>[ce qu'il mesure, et sa source]</p>", { textAlign: "center" })] })))])] },
  { key: "faq", category: "Contenu", label: "Questions fréquentes", build: () => [section([H("Questions fréquentes"), { type: "accordion", props: { items: [{ q: "[Question 1 ?]", a: "[Réponse claire et vérifiable.]" }, { q: "[Question 2 ?]", a: "[Réponse.]" }, { q: "[Question 3 ?]", a: "[Réponse.]" }], faqSchema: true } }], { maxWidth: "820px" })] },
  { key: "cta", category: "Vente", label: "Appel à l'action", build: () => [section([H("[Prêt à commencer ?]", "2", { color: "token:on-primary", textAlign: "center" }), T("<p>[Rappelez le bénéfice principal en une phrase.]</p>", { color: "token:on-primary", textAlign: "center" }), B("[Je commence]", "/catalogue", "outline")], { backgroundColor: "token:primary", alignItems: "center", borderRadius: "16px", maxWidth: "1000px" })] },
  { key: "newsletter", category: "Inscription", label: "Inscription à la lettre", build: () => [section([H("[La lettre de …]", "2", { textAlign: "center" }), T("<p>[Ce que contient chaque envoi, et à quelle fréquence.]</p>", { textAlign: "center" })], { paddingBottom: "8px" }), { type: "form", heading: "Je m'abonne", intro: "Désinscription en un clic, à tout moment." }] },
  { key: "comparison", category: "Vente", label: "Tableau comparatif", build: () => [section([H("[Comparez les formules]"), { type: "table", props: { header: true, rows: [["", "[Formule A]", "[Formule B]"], ["[Critère 1]", "[oui / non]", "[oui / non]"], ["[Critère 2]", "[valeur]", "[valeur]"], ["[Prix]", "[prix réel]", "[prix réel]"]] } }])] },
  { key: "cards", category: "Contenu", label: "Cartes (3)", build: () => [section([grid(3, [1, 2, 3].map((n) => card([H(`[Titre ${n}]`, "3"), T("<p>[Texte court.]</p>"), { type: "link", props: { label: "[En savoir plus]", url: "/catalogue" } }])))])] },
  { key: "bento", category: "Contenu", label: "Mosaïque (bento)", build: () => [section([cols(2, (i) => (i === 0
    ? [card([H("[Point fort principal]", "2"), T("<p>[Explication détaillée.]</p>")], { minHeight: "320px" })]
    : [card([H("[Point fort 2]", "3"), T("<p>[Texte court.]</p>")]), card([H("[Point fort 3]", "3"), T("<p>[Texte court.]</p>")])]))])] },
  { key: "cover", category: "En-tête", label: "Couverture (fond dégradé)", build: () => [{ type: "layout", children: [{ type: "container", children: [H("[Votre titre de couverture]", "1", { color: "token:on-primary", textAlign: "center" }), T("<p>[Une phrase qui dit ce que la personne va trouver ici.]</p>", { color: "token:on-primary", textAlign: "center" }), B("[Commencer]", "/catalogue", "outline")], styles: { desktop: { paddingTop: "120px", paddingBottom: "120px", paddingLeft: "24px", paddingRight: "24px", gap: "20px", alignItems: "center", minHeight: "420px", justifyContent: "center", gradient: { from: "token:primary", to: "token:secondary", angle: 135 }, borderRadius: "16px" }, mobile: { paddingTop: "72px", paddingBottom: "72px", minHeight: "0" } } }] }] },
  { key: "media-text", category: "Contenu", label: "Média + texte", build: () => [section([cols(2, (i) => (i === 0 ? [{ type: "container", name: "Emplacement de l'image", children: [] }] : [H("[Titre]", "2"), T("<p>[Le texte qui accompagne l'image : de quoi elle parle, pourquoi c'est utile.]</p>"), B("[En savoir plus]", "/catalogue", "outline")]))])] },
  { key: "iconbox", category: "Contenu", label: "Icône + texte (3)", build: () => [section([grid(3, [["zap", "[Rapide]"], ["shield", "[Fiable]"], ["heart", "[Humain]"]].map((x) => card([I(x[0]), H(x[1], "3"), T("<p>[Ce que cela change concrètement.]</p>")])))])] },
  { key: "team", category: "Preuve", label: "Équipe (3)", build: () => [section([H("[L'équipe]", "2", { textAlign: "center" }), grid(3, [1, 2, 3].map((n) => card([H(`[Prénom Nom ${n}]`, "3"), { type: "badge", props: { text: "[Rôle]", tone: "primary" } }, T("<p>[Parcours en une phrase, vérifiable.]</p>")])))])] },
  { key: "steps", category: "Contenu", label: "Étapes (chronologie)", build: () => [section([H("[Comment ça se passe]"), { type: "timeline", props: { items: [{ date: "[Étape 1]", title: "[Inscription]", text: "[Ce qui se passe.]" }, { date: "[Étape 2]", title: "[Accès au contenu]", text: "[Ce qui se passe.]" }, { date: "[Étape 3]", title: "[Résultat]", text: "[Ce que la personne obtient.]" }] } }], { maxWidth: "820px" })] },
  { key: "cols-2", category: "Mise en page", label: "2 colonnes", build: () => [section([cols(2, (i) => [H(`[Titre ${i + 1}]`, "3"), T("<p>[Texte.]</p>")])])] },
  { key: "cols-3", category: "Mise en page", label: "3 colonnes", build: () => [section([cols(3, (i) => [H(`[Titre ${i + 1}]`, "3"), T("<p>[Texte.]</p>")])])] },
  { key: "cols-4", category: "Mise en page", label: "4 colonnes", build: () => [section([cols(4, (i) => [H(`[Titre ${i + 1}]`, "3"), T("<p>[Texte.]</p>")])])] },
  { key: "courses", category: "Formations", label: "Formations à la une", requires: "courses", build: (ctx) => [section([H("[Nos formations]", "2", { textAlign: "center" }),
    grid(3, listCourses(ctx).slice(0, 3).map((c) => ({ type: "course", props: { courseId: c.id, cta: "Découvrir" } })))])] },
];

function catalog(ctx) {
  const hasCourses = listCourses(ctx).length > 0;
  return PATTERNS.filter((p) => p.requires !== "courses" || hasCourses).map((p) => ({ key: p.key, category: p.category, label: p.label, sections: p.build(ctx) }));
}

module.exports = { PATTERNS, catalog };
