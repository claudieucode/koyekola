// Modèles (patterns) : mises en page prêtes à l'emploi, insérées comme COPIES indépendantes (aucun lien avec le modèle après l'insertion).
// Chaque modèle n'utilise que des blocs de l'éditeur ; un test (tests/editeur-blocs-p1-navigateur.test.js) vérifie qu'ils survivent tous
// à l'enregistrement du serveur sans rien perdre. Les modèles personnels sont les blocs réutilisables insérés « en copie ».
const t = (text, marks) => ({ type: "text", text, ...(marks ? { marks } : {}) });
const p = (text, attrs) => ({ type: "paragraph", ...(attrs ? { attrs } : {}), content: text ? [t(text)] : [] });
const h = (level, text, attrs) => ({ type: "heading", attrs: { level, ...(attrs || {}) }, content: [t(text)] });
const btn = (text, href, variant = "primary", align = "center") => ({ type: "kbButton", attrs: { text, href, variant, align, newTab: false } });
const li = (text) => ({ type: "listItem", content: [p(text)] });
const col = (...content) => ({ type: "kbColumn", content });
const center = { textAlign: "center" };

export const PATTERN_CATEGORIES = ["Appels à l'action", "Mise en page", "Contenu", "Preuves et chiffres"];

export const PATTERNS = [
  { id: "cta-simple", cat: "Appels à l'action", title: "Appel à l'action simple", desc: "Titre, phrase d'accroche et bouton dans un encadré.",
    nodes: () => [{ type: "kbCta", content: [h(3, "Envie d'aller plus loin ?"), p("Une phrase qui donne envie de passer à l'action."), btn("Découvrir les formations", "/catalogue")] }] },
  { id: "cta-sombre", cat: "Appels à l'action", title: "Bandeau sombre avec deux boutons", desc: "Fond bleu nuit, message fort et deux boutons.",
    nodes: () => [{ type: "kbGroup", attrs: { bg: "dark", pad: "l" }, content: [h(2, "Prêt à vous lancer ?", center), p("Rejoignez les personnes qui progressent avec nos formations.", center), { type: "kbButtons", attrs: { align: "center" }, content: [btn("Voir le catalogue", "/catalogue"), btn("Nous contacter", "/contact", "outline")] }] }] },
  { id: "newsletter", cat: "Appels à l'action", title: "Invitation à la newsletter", desc: "Un encadré qui présente la newsletter, puis son formulaire.",
    nodes: () => [{ type: "kbGroup", attrs: { bg: "accent", pad: "m" }, content: [h(3, "Recevez nos prochains articles"), p("Un message utile de temps en temps, jamais de spam."), { type: "kbNewsletter" }] }] },
  { id: "deux-colonnes", cat: "Mise en page", title: "Deux colonnes de texte", desc: "Deux idées côte à côte, empilées sur mobile.",
    nodes: () => [{ type: "kbColumns", attrs: { layout: "50-50" }, content: [col(h(3, "Première idée"), p("Développez ici votre première idée.")), col(h(3, "Seconde idée"), p("Développez ici la seconde idée."))] }] },
  { id: "trois-avantages", cat: "Mise en page", title: "Trois avantages", desc: "Trois colonnes avec un titre et une phrase chacune.",
    nodes: () => [{ type: "kbColumns", attrs: { layout: "33-33-33" }, content: [1, 2, 3].map((n) => col(h(4, `Avantage ${n}`), p("Une phrase qui explique ce bénéfice."))) }] },
  { id: "texte-large-etroit", cat: "Mise en page", title: "Colonne étroite et colonne large", desc: "Un repère à gauche, le texte principal à droite.",
    nodes: () => [{ type: "kbColumns", attrs: { layout: "33-67" }, content: [col(h(4, "En bref"), p("Le résumé en une phrase.")), col(h(3, "Le détail"), p("Le développement complet vient ici."))] }] },
  { id: "a-retenir", cat: "Contenu", title: "À retenir", desc: "Un encadré qui résume l'essentiel en liste.",
    nodes: () => [{ type: "callout", attrs: { type: "a-retenir" }, content: [{ type: "bulletList", content: [li("Premier point à retenir"), li("Deuxième point à retenir"), li("Troisième point à retenir")] }] }] },
  { id: "etapes", cat: "Contenu", title: "Guide en trois étapes", desc: "Étapes numérotées (données structurées HowTo).",
    nodes: () => [{ type: "kbSteps", attrs: { title: "" }, content: [1, 2, 3].map((n) => ({ type: "listItem", content: [{ type: "paragraph", content: [t(`Étape ${n}`, [{ type: "bold" }]), t(" : ce qu'il faut faire.")] }] })) }] },
  { id: "faq", cat: "Contenu", title: "Questions fréquentes", desc: "Trois questions-réponses (données structurées FAQPage).",
    nodes: () => [{ type: "kbFaq", content: [1, 2, 3].map((n) => ({ type: "kbFaqItem", content: [{ type: "kbSummary", content: [t(`Question ${n} ?`)] }, { type: "kbFaqAnswer", content: [p("Réponse claire et courte.")] }] })) }] },
  { id: "comparatif", cat: "Contenu", title: "Avantages et limites", desc: "Deux colonnes : ce qui est bien, ce qui l'est moins.",
    nodes: () => [{ type: "kbCompare", content: [["pro", "Avantages"], ["con", "Limites"]].map(([tone, title]) => ({ type: "kbCompareCol", attrs: { tone }, content: [h(4, title), { type: "bulletList", content: [li("Premier point"), li("Deuxième point")] }] })) }] },
  { id: "tableau", cat: "Contenu", title: "Tableau comparatif", desc: "Un tableau de trois colonnes avec ligne d'en-tête.",
    nodes: () => [{ type: "table", attrs: { caption: "Légende du tableau" }, content: [0, 1, 2].map((r) => ({ type: "tableRow", content: [0, 1, 2].map(() => ({ type: r === 0 ? "tableHeader" : "tableCell", content: [p(r === 0 ? "Critère" : "Valeur")] })) })) }] },
  { id: "temoignage", cat: "Preuves et chiffres", title: "Témoignage", desc: "Une citation mise en avant, avec son auteur, sur une carte.",
    nodes: () => [{ type: "kbGroup", attrs: { bg: "none", pad: "m", variant: "card" }, content: [{ type: "blockquote", attrs: { pullquote: true }, content: [p("« Une phrase forte d'une personne satisfaite. »")] }, p("— Prénom Nom, fonction", center)] }] },
  { id: "chiffres", cat: "Preuves et chiffres", title: "Chiffres clés", desc: "Trois grands nombres avec leur légende.",
    nodes: () => [{ type: "kbColumns", attrs: { layout: "33-33-33" }, content: [["1 200", "personnes formées"], ["95 %", "de satisfaction"], ["12", "formations"]].map(([n, label]) => col(h(2, n, center), p(label, center))) }] },
];
