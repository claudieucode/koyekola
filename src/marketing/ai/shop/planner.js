// Store Planner : architecture de la boutique (pages et navigation), adaptée au modèle commercial et au pays.
// Deux familles de pages :
//   native : servie par le moteur de boutique lui-même (catalogue, catégories, fiche produit, panier, commande, compte) → rien à créer ici, seulement à OUVRIR (réglage de la boutique) ;
//   page   : page éditoriale du Page Builder, créée en BROUILLON par le Page Generator (accueil, à propos, contact, FAQ, livraison, retours, politiques).
// Les pages juridiques sont des MODÈLES À COMPLÉTER ET À FAIRE VÉRIFIER : aucune garantie de conformité (marquées legal: true et accompagnées de la mention).
const LEGAL_NOTE = "Modèle à compléter et à faire vérifier par un professionnel : il ne constitue ni un avis juridique ni une garantie de conformité.";
const slug = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const EU = ["FR", "BE", "DE", "ES", "IT", "NL", "PT", "LU", "IE", "AT"];

const P = (key, name, kind, purpose, extra = {}) => ({ key, name, slug: slug(key), kind, purpose, menu: "main", required: false, legal: false, sections: [], ...extra });
function plan(analysis, { blog = false } = {}) {
  const f = (k) => (analysis.facts[k] ? analysis.facts[k].value : null);
  const country = f("country"), digital = analysis.models.some((m) => m.key === "digital") && !analysis.models.some((m) => m.key === "physical");
  const pages = [
    P("accueil", "Accueil", "page", "Présenter la boutique, les catégories et les produits mis en avant", { required: true, sections: ["hero", "services", "cta"] }),
    P("boutique", "Boutique", "native", "Catalogue des produits (page native du moteur)", { required: true, menu: "main" }),
    P("categories", "Pages de catégories", "native", "Une page par catégorie du catalogue (pages natives)", { menu: "none" }),
    P("fiche-produit", "Fiche produit", "native", "Galerie, prix, variantes, disponibilité, bouton d'achat (page native)", { required: true, menu: "none" }),
    P("panier", "Panier et commande", "native", "Panier, informations client, livraison, paiement, confirmation (pages natives)", { required: true, menu: "none" }),
    P("a-propos", "À propos", "page", "Présenter la marque et ses valeurs", { sections: ["hero", "intro", "cta"] }),
    P("contact", "Contact", "page", "Coordonnées et formulaire de contact", { required: true, sections: ["hero", "contact"] }),
    P("faq", "Questions fréquentes", "page", "Répondre aux questions courantes (commande, paiement, livraison)", { sections: ["hero", "faq"] }),
  ];
  if (!digital) pages.push(P("livraison", "Livraison", "page", "Zones, modes et délais de livraison (à renseigner : aucun tarif n'est inventé)", { required: true, sections: ["hero", "text"], menu: "footer" }));
  pages.push(P("retours", "Retours et remboursements", "page", `Conditions de retour et de remboursement. ${LEGAL_NOTE}`, { legal: true, required: true, sections: ["hero", "text"], menu: "footer" }));
  pages.push(P("cgv", "Conditions générales de vente", "page", `Conditions de vente. ${LEGAL_NOTE}`, { legal: true, required: true, sections: ["hero", "text"], menu: "footer" }));
  pages.push(P("confidentialite", "Politique de confidentialité", "page", `Données personnelles collectées et leur usage. ${LEGAL_NOTE}`, { legal: true, required: true, sections: ["hero", "text"], menu: "footer" }));
  if (country && EU.includes(country)) pages.push(P("mentions-legales", "Mentions légales", "page", `Identité de l'éditeur et de l'hébergeur. ${LEGAL_NOTE}`, { legal: true, required: true, sections: ["hero", "text"], menu: "footer" }));
  if (blog) pages.push(P("blog", "Blog", "native", "Articles éditoriaux (module Blog)", { menu: "main" }));
  const notes = [];
  if (country && !EU.includes(country)) notes.push("Les obligations légales de votre pays ne sont pas connues de Kolakisa : vérifiez les mentions et conditions exigées localement.");
  if (digital) notes.push("Boutique de produits numériques : la page Livraison n'est pas proposée ; la livraison du fichier n'est pas gérée par le moteur.");
  return { pages, navigation: navigationOf(pages), notes, accepted: false, legalNote: LEGAL_NOTE };
}
function navigationOf(pages) {
  const by = (m) => pages.filter((p) => p.menu === m).map((p) => p.key);
  return { main: by("main"), footer: by("footer") };
}
const ops = {
  add_page(p, o) {
    const name = String(o.name || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 80); if (!name) throw new Error("Nom de page obligatoire.");
    let key = slug(name) || "page"; if (p.pages.some((x) => slugOf(x) === key || x.key === key)) throw new Error("Une page porte déjà ce nom.");
    if (p.pages.length >= 24) throw new Error("24 pages au plus.");
    p.pages.push(P(key, name, "page", String(o.purpose || "").slice(0, 240), { sections: ["hero", "text"], custom: true })); return `Page « ${name} » ajoutée.`;
  },
  remove_page(p, o) { const x = find(p, o.key); if (x.required) throw new Error(`« ${x.name} » est une page nécessaire à une boutique : elle ne peut pas être retirée du plan.`); p.pages = p.pages.filter((y) => y !== x); return `Page « ${x.name} » retirée.`; },
  rename_page(p, o) { const x = find(p, o.key); const name = String(o.name || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 80); if (!name) throw new Error("Nom obligatoire."); const old = x.name; x.name = name; return `Page « ${old} » renommée « ${name} ».`; },
  set_page(p, o) { const x = find(p, o.key); if (o.purpose !== undefined) x.purpose = String(o.purpose).slice(0, 240); if (o.menu !== undefined) { if (!["main", "footer", "none"].includes(o.menu)) throw new Error("Menu inconnu."); x.menu = o.menu; } return `Page « ${x.name} » modifiée.`; },
  move_page(p, o) { const x = find(p, o.key); const i = p.pages.indexOf(x); const to = Math.max(0, Math.min(p.pages.length - 1, Number(o.to) || 0)); p.pages.splice(i, 1); p.pages.splice(to, 0, x); return `Page « ${x.name} » déplacée.`; },
};
const slugOf = (x) => x.slug || slug(x.key);
function find(p, key) { const x = p.pages.find((y) => y.key === key); if (!x) throw new Error("Page introuvable dans le plan."); return x; }
function edit(planObj, op) { if (!op || !Object.hasOwn(ops, op.op)) throw new Error("Modification inconnue."); const summary = ops[op.op](planObj, op); planObj.navigation = navigationOf(planObj.pages); planObj.accepted = false; return summary; }
// Plan « Page Generator » : seules les pages éditoriales (kind page) ; les pages natives n'ont rien à générer
function toPageGenPlan(planObj, siteName) {
  const SEC = { hero: "hero", intro: "intro", services: "services", cta: "cta", contact: "contact", faq: "faq", text: "text" };
  return { version: 1, site: { name: siteName || "Boutique", description: "" }, pages: planObj.pages.filter((p) => p.kind === "page").map((p) => ({ key: p.key, name: p.name, slug: p.slug, type: p.key === "contact" ? "contact" : p.key === "faq" ? "faq" : p.key === "accueil" ? "accueil" : p.key === "a-propos" ? "apropos" : "autre", goal: p.purpose, sections: p.sections.map((k, i) => ({ key: `${SEC[k]}-${i + 1}`, kind: SEC[k] })) })) };
}
module.exports = { plan, edit, toPageGenPlan, navigationOf, LEGAL_NOTE, slug };
