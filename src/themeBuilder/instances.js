// Où un modèle s'applique-t-il ? (programme 23.1) Pour les parties globales et les pages du site, on RÉSOUT réellement chaque page publiée du site avec le moteur de résolution ;
// pour les types qui dépendent du contenu du blog ou de la boutique (articles, archives…), la liste n'est pas énumérable ici : l'explication passe par la simulation « Pourquoi ce modèle ? ».
const Types = require("./types");
const Res = require("./resolve");
const store = require("./store");

const P = () => require("../marketing/pages");
function instances(ctx, siteId, id) {
  const t = store.get(ctx, siteId, id);
  const def = Types.TYPES[t.type];
  const enumerable = def.global === true || t.type === "single_page" || t.type === "not_found";
  if (!enumerable) return { enumerable: false, pages: [], total: null, note: "Dépend des contenus (articles, archives, produits) : utilisez « Pourquoi ce modèle ? » pour tester un cas." };
  const site = store.site(ctx, siteId);
  const pool = store.list(ctx, siteId).filter((x) => x.type === t.type);
  const pages = P().sitePages(ctx, siteId).filter((p) => p.status === "published" && p.kind === "page");
  const hit = [];
  for (const p of pages) {
    if (t.type === "not_found") break;
    const view = site.home_page_id === p.id ? "front" : "page";
    const r = Res.resolve(pool, { siteId, view, id: p.id, parents: [], authorId: null, categories: [], categoryAncestors: [], tags: [] }, { type: t.type });
    if (r.winner && r.winner.id === t.id) hit.push({ id: p.id, name: p.name });
  }
  return { enumerable: true, pages: hit.slice(0, 100), total: hit.length, of: pages.length, note: t.status === "published" ? "" : "Modèle non publié : il ne s'applique à aucune page." };
}
module.exports = { instances };
