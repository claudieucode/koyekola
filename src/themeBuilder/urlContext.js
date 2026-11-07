// Contexte de résolution déduit d'une ADRESSE (chantier B du pied de page). Deux usages :
//  · viewOfPath(path)  — pur, sans base : classe les pages « habillées » qui ne déclarent pas leur contexte (compte client, panier/commande, fiche formation) ;
//    sert de repli au rendu public (render.defaultContext) pour que les conditions « Compte client », « Boutique » et « Fiche formation » aient un effet réel.
//  · fromUrl(ctx, siteId, url) — avec base : reconstruit le contexte COMPLET (page, parents, article, catégories, formation…) pour l'aperçu
//    « ce pied s'applique-t-il à cette adresse ? ». Aucune écriture. Une adresse d'un autre site ou inexistante est refusée / classée « 404 ».
const SHOP = "/boutique";

const clean = (url) => {
  let p = String(url || "").trim();
  p = p.replace(/^https?:\/\/[^/]+/i, "").split("#")[0].split("?")[0];
  if (!p.startsWith("/")) p = `/${p}`;
  try { p = decodeURI(p); } catch { return null; }
  if (p.startsWith("//") || /[\u0000-\u001f<>"\\]/.test(p) || p.length > 300) return null;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
};
// Vue d'une adresse pour les pages qui n'ont pas de route « région » : { view, ...} ou null (= laisser le comportement historique)
function viewOfPath(path) {
  const p = clean(path);
  if (!p) return null;
  if (p === `${SHOP}/compte` || p.startsWith(`${SHOP}/compte/`)) return { view: "account" };
  if (p === SHOP || p === `${SHOP}/recherche` || /^\/boutique\/(categorie|etiquette)\/[^/]+$/.test(p)) return { view: "product_archive" };
  if (/^\/boutique\/produit\/[^/]+$/.test(p)) return { view: "product" };
  if (p.startsWith(`${SHOP}/`)) return { view: "shop_page" };
  if (/^\/cours\/[^/]+$/.test(p)) return { view: "course" };
  return null;
}

const base = (siteId, view, o = {}) => ({ siteId, view, id: null, authorId: null, parents: [], categories: [], categoryAncestors: [], tags: [], ...o });
const names = (rows) => rows.map((r) => r.name).filter(Boolean);
function termsOf(db, postId, taxonomy) {
  try { return names(db.prepare("SELECT t.name FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = 'post' AND r.content_id = ? AND t.taxonomy = ?").all(postId, taxonomy)); } catch { return []; }
}
// → { ok, context, label, note } ; ok:false + error si l'adresse n'est pas exploitable
function fromUrl(ctx, siteId, url, { visitor = null } = {}) {
  const p = clean(url);
  if (!p) return { ok: false, error: "Adresse invalide : saisissez un chemin du site, par exemple /boutique/compte." };
  const withV = (c) => (visitor ? { ...c, visitor } : c);
  const quick = viewOfPath(p);
  if (quick && quick.view === "account") return { ok: true, label: "Compte client", context: withV(base(siteId, "account")) };
  if (quick && quick.view === "shop_page") return { ok: true, label: "Page de la boutique", context: withV(base(siteId, "shop_page")) };
  if (quick && quick.view === "product_archive") {
    let m; const archive = (m = /^\/boutique\/categorie\/([^/]+)$/.exec(p)) ? { kind: "category", name: m[1], ancestors: [] } : (m = /^\/boutique\/etiquette\/([^/]+)$/.exec(p)) ? { kind: "tag", name: m[1], ancestors: [] } : { kind: "shop", name: "", ancestors: [] };
    return { ok: true, label: "Boutique (liste de produits)", context: withV(base(siteId, "product_archive", { archive })), note: archive.kind !== "shop" ? "Le nom exact de la catégorie ou de l'étiquette est lu depuis l'adresse (identifiant d'adresse)." : "" };
  }
  if (quick && quick.view === "product") return { ok: true, label: "Fiche produit", context: withV(base(siteId, "product")), note: "La catégorie du produit n'est pas lue : seules les conditions générales « Produits » sont évaluées." };
  const db = ctx.db;
  const host = siteId === null ? null : { id: siteId, homePageId: (() => { try { return require("../marketing/pages").getSite(ctx, siteId).home_page_id || null; } catch { return null; } })() };
  let r; try { r = require("../services/urls").resolve(p, { hostSite: host }); } catch { r = { type: null, state: "none" }; }
  if (r.type === "course") {
    if (r.state !== "live") return { ok: false, error: "Cette formation n'est pas publiée." };
    const row = db.prepare("SELECT id, title, category FROM courses WHERE id = ?").get(r.id);
    return { ok: true, label: `Fiche formation « ${row ? row.title : ""} »`, context: withV(base(siteId, "course", { id: r.id, categories: row && row.category ? [row.category] : [] })) };
  }
  if (r.type === "page") {
    if (r.state === "foreign" || (r.row && r.row.site_id !== siteId && r.row.site_id !== undefined && !(siteId === null && r.row.site_id === null))) return { ok: false, error: "Cette page appartient à un autre site." };
    if (r.state !== "live" && r.state !== "moved") return { ok: false, error: "Cette page n'est pas publiée." };
    const parents = []; let cur = db.prepare("SELECT parent_id FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(r.id, ctx.organizationId);
    for (let i = 0; cur && cur.parent_id && i < 12; i += 1) { parents.push(Number(cur.parent_id)); cur = db.prepare("SELECT parent_id FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(cur.parent_id, ctx.organizationId); }
    const isHome = host ? host.homePageId === r.id : p === "/";
    return { ok: true, label: `Page « ${r.row.name || r.row.slug} »`, context: withV(base(siteId, isHome ? "front" : "page", { id: r.id, parents })) };
  }
  if (r.type === "post") {
    if (r.state !== "live") return { ok: false, error: "Cet article n'est pas publié." };
    const cats = termsOf(db, r.id, "category"); if (r.row && r.row.category && !cats.includes(r.row.category)) cats.push(r.row.category);
    return { ok: true, label: `Article « ${r.row.title || r.row.slug} »`, context: withV(base(siteId, "post", { id: r.id, authorId: r.row.author_id || null, categories: cats, tags: termsOf(db, r.id, "tag") })) };
  }
  if (p === "/blog") return { ok: true, label: "Blog (liste des articles)", context: withV(base(siteId, "archive", { archive: { kind: "blog", name: "", ancestors: [] } })) };
  if (p === "/recherche" || p === "/blog/recherche") return { ok: true, label: "Résultats de recherche", context: withV(base(siteId, "search", { archive: { kind: "search", name: "", ancestors: [] } })) };
  if (r.type === "category" || r.type === "tag") return { ok: true, label: `Archive ${r.type === "tag" ? "d'étiquette" : "de catégorie"} « ${r.row.name} »`, context: withV(base(siteId, "archive", { archive: { kind: r.type, name: r.row.name, ancestors: [] } })) };
  return { ok: true, label: "Page introuvable (404)", context: withV(base(siteId, "not_found")), note: "Aucune page du site ne correspond à cette adresse : c'est la vue « Page 404 » qui est testée." };
}
module.exports = { viewOfPath, fromUrl, clean, SHOP };
