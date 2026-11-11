// Résultats de DÉMONSTRATION de l'aperçu de la bibliothèque « Résultats de recherche » (jamais utilisés sur un site publié) : l'aperçu montre alors de vraies cartes, la pagination, le tri et le filtre par catégorie.
// Activés uniquement par themeRender.previewDoc (visitor.demoResults) ; contenu clairement fictif (« Exemple »), images vectorielles locales (public/img/apercu-demo/).
const CAT = ["Conseils", "Actualités", "Guides", "Études", "Entretiens", "Dossiers"];
const TITLES = ["Comment bien choisir son premier outil", "Les erreurs courantes et comment les éviter", "Guide complet pour démarrer sereinement", "Ce que disent les chiffres cette année", "Entretien avec une équipe qui a changé de méthode", "Dix questions à se poser avant de se lancer",
  "Retour d'expérience après six mois d'usage", "Comparatif : ce qui compte vraiment", "Pas à pas : de l'idée à la mise en ligne", "Les tendances à suivre dans les prochains mois", "Ce qu'il faut savoir avant de décider", "Dossier : tout comprendre en quinze minutes"];
const N = 24;
const img = (i) => `/img/apercu-demo/${(i % 8) + 1}.svg`;
const day = (i) => Date.UTC(2026, 9, 28 - i * 3);
const posts = (i) => ({ id: -(i + 1), title: `Exemple — ${TITLES[i % TITLES.length]}`, url: "#exemple", slug: "exemple", excerpt: "Texte d'exemple : l'extrait réel de l'article s'affiche ici, sur deux ou trois lignes, avec le début du contenu.", image: img(i), imageAlt: "Illustration d'exemple", date: day(i), modified: day(i), category: CAT[i % CAT.length], categoryUrl: "#exemple", tags: [], author: "Équipe éditoriale", minutes: 3 + (i % 7), views: 100 + i, commentsCount: i % 4, commentsOpen: true });
const products = (i) => ({ id: -(i + 1), title: `Exemple — ${["Carnet", "Lampe", "Sac", "Tasse", "Chaise", "Théière", "Plaid", "Horloge"][i % 8]} ${["nuit", "sable", "ardoise", "mousse"][i % 4]}`, subtitle: "Description courte d'exemple", shortDescription: "Description courte d'exemple", description: "", priceCents: 1900 + i * 700, priceLabel: `${(19 + i * 7).toFixed(2).replace(".", ",")} €`, regularCents: 0, regularLabel: "", url: "#exemple", image: img(i), category: CAT[i % 3], sku: "", availability: "En stock", cartUrl: "#exemple", instructor: "" });
const courses = (i) => ({ id: -(i + 1), instructor: ["A. Martin", "C. Durand", "S. Bernard"][i % 3], title: `Exemple — Formation ${["initiation", "perfectionnement", "atelier", "masterclass"][i % 4]} n° ${i + 1}`, subtitle: "Résumé d'exemple de la formation", priceCents: 4900 + i * 1000, url: "#exemple", image: img(i), category: CAT[i % 3], description: "Description d'exemple.", level: ["Débutant", "Intermédiaire"][i % 2] });
const pagesOf = (i) => ({ id: -(i + 1), title: `Exemple — ${["Qui sommes-nous", "Nos services", "Tarifs", "Contact", "Aide et assistance", "Mentions légales"][i % 6]}${i >= 6 ? ` (${Math.floor(i / 6) + 1})` : ""}`, url: "#exemple", date: day(i), modified: day(i) });
const MAKE = { posts, products, courses, pages: pagesOf };
const SORTS = { recent: (a, b) => (b.date || 0) - (a.date || 0), ancien: (a, b) => (a.date || 0) - (b.date || 0), alpha: (a, b) => String(a.title).localeCompare(String(b.title), "fr"), "alpha-inverse": (a, b) => String(b.title).localeCompare(String(a.title), "fr"), "prix-croissant": (a, b) => (a.priceCents || 0) - (b.priceCents || 0), "prix-decroissant": (a, b) => (b.priceCents || 0) - (a.priceCents || 0) };
function loop(loopCfg, pageNo, q = {}) {
  const make = MAKE[loopCfg.source] || posts;
  if (q.etat === "vide") return { items: [], total: 0, pageNo: 1, pages: 1 };
  let all = Array.from({ length: N }, (_, i) => make(i));
  if (typeof q.categorie === "string" && q.categorie) all = all.filter((x) => String(x.category || "").toLowerCase() === q.categorie.toLowerCase());
  const cmp = SORTS[q.tri]; if (cmp) all.sort(cmp);
  all = all.slice(Math.max(0, Math.min(Number(loopCfg.offset) || 0, 24)));
  const count = Math.max(1, Math.min(Number(loopCfg.count) || 6, 24)), paginate = loopCfg.paginate !== false, pages = paginate ? Math.max(1, Math.ceil(all.length / count)) : 1, no = paginate ? Math.min(Math.max(1, pageNo), pages) : 1;
  return { items: all.slice((no - 1) * count, no * count), total: all.length, pageNo: no, pages };
}
module.exports = { loop, SORTS: Object.keys(SORTS) };
