// Modèles de thème : une PAGE du Page Builder devient le modèle d'une famille de pages du site (article du blog, liste du blog,
// page introuvable), avec des conditions (catégorie, public). Les affectations sont des réglages de l'organisation
// (mk_settings, clé « theme.templates ») : rien d'autre à migrer. Sans modèle publié qui convienne, le site garde son
// affichage d'origine : un modèle ne peut jamais casser le blog.
const { MarketingError } = require("../errors");
const nodes = require("./nodes");

const KEY = "theme.templates";
const MAX_TEMPLATES = 30;
const TYPES = {
  single_post: { label: "Article du blog", hint: "Remplace l'en-tête, l'image et le texte de l'article (le sommaire, l'auteur, la navigation et les commentaires du blog restent, sauf si le modèle contient lui-même la boîte auteur, l'article précédent / suivant ou les commentaires). Utilisez l'élément « Contenu de l'article » et les données {{post.…}}." },
  blog_archive: { label: "Liste du blog", hint: "Remplace la liste des articles (accueil du blog et catégories). Utilisez une grille en boucle (articles) ; la catégorie courante se lit avec {{query.categorie}}." },
  author_archive: { label: "Page d'un auteur", hint: "Remplace la liste des articles d'un auteur (/blog/auteur/…). Sans ce modèle, le modèle « Liste du blog » s'applique. Utilisez l'en-tête d'archive, la boîte auteur et une liste dynamique « suit l'archive »." },
  single_course: { label: "Fiche d'une formation", hint: "Remplace l'en-tête de la fiche d'une formation (titre, sous-titre, note). Le programme, l'achat, les avis et le formateur restent. Utilisez les étiquettes {{course.title}}, {{course.price}}, {{course.image}}, {{course.instructor}}…" },
  category_archive: { label: "Archive de catégorie", hint: "Remplace la liste des articles d'UNE catégorie (adresse /blog/categorie/…). Limitez-le à une catégorie, ou laissez « toutes » ; sans modèle de ce type, le modèle « Liste du blog » est utilisé. La catégorie courante se lit avec {{query.categorie}}." },
  tag_archive: { label: "Archive d'étiquette", hint: "Remplace la liste des articles d'UNE étiquette (adresse /blog/etiquette/…). Limitez-le à une étiquette, ou laissez « toutes » ; sans modèle de ce type, le modèle « Liste du blog » est utilisé. L'étiquette courante se lit avec {{query.etiquette}}." },
  search_results: { label: "Résultats de recherche", hint: "Remplace la liste quand une recherche est faite dans le blog (/blog?q=…). La recherche saisie se lit avec {{query.q}}. Le moteur de recherche global du site viendra plus tard : ce modèle reçoit déjà la requête et les résultats du blog." },
  static_page: { label: "Page du site (À propos)", hint: "Remplace le texte de la page « À propos ». Utilisez l'élément « Contenu de l'article » : il affiche le texte de la page ; {{post.title}} donne son titre." },
  not_found: { label: "Page introuvable (404)", hint: "S'affiche quand une adresse n'existe pas." },
  // Programme 20.5 — boutique : mêmes conditions, même priorité, même moteur de rendu que les autres familles. Seul un modèle dont la page appartient à la MÊME boutique s'applique.
  product: { label: "Fiche produit", hint: "Remplace l'en-tête de la fiche d'un produit de la boutique. Utilisez les étiquettes {{product.title}}, {{product.price}}, {{product.image}}… et les éléments « Ajouter au panier », « Prix du produit ». Limitez-le à une catégorie de produits si besoin." },
  product_archive: { label: "Catalogue / catégorie de produits", hint: "Remplace la liste des produits de la boutique (catalogue, catégorie, recherche, promotions). Utilisez l'élément « Grille de produits » : il suit la catégorie, la recherche et les filtres de la page ({{query.categorie}}, {{query.q}})." },
};
// Extension : un module peut déclarer une nouvelle famille de pages (le rendu reste à brancher dans la route concernée,
// avec renderRegion de web/themeRender.js ; sans cela le modèle n'a aucun effet et l'écran l'indique).
function registerTemplateType(key, { label, hint }) {
  if (!/^[a-z][a-z_]{1,30}$/.test(key) || Object.hasOwn(TYPES, key)) throw new Error(`Type de modèle « ${key} » : nom invalide ou déjà pris.`);
  if (!label || !hint) throw new Error(`Type de modèle « ${key} » : libellé et aide obligatoires.`);
  TYPES[key] = { label, hint };
}
const newId = () => require("crypto").randomBytes(4).toString("hex");
const line = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);

function read(ctx) {
  try {
    const raw = JSON.parse(ctx.settings.get(ctx.organizationId, KEY, "[]"));
    return Array.isArray(raw) ? raw.filter((t) => t && TYPES[t.type] && Number.isInteger(t.pageId)).slice(0, MAX_TEMPLATES) : [];
  } catch { return []; }
}
const write = (ctx, list) => ctx.settings.set(ctx.organizationId, KEY, JSON.stringify(list));

function pageRow(ctx, id) {
  return ctx.db.prepare("SELECT id, name, slug, status, kind, archived_at, site_id FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) || null;
}
// Affectations avec le nom et l'état de leur page
function list(ctx) {
  return read(ctx).map((t) => { const p = pageRow(ctx, t.pageId); return { ...t, typeLabel: TYPES[t.type].label, pageName: p ? p.name : "(page supprimée)", pageStatus: p ? p.status : "missing", audienceLabel: t.audience ? nodes.audienceLabel(t.audience) : "" }; });
}
// Conditions possibles selon la famille : catégorie (articles, listes, archives de catégorie), étiquette (articles, archives d'étiquette),
// article précis (articles seulement). Une condition vide = « tous ».
const CONDITIONS = { product: ["category"], product_archive: ["category"], single_post: ["category", "tag", "postId"], blog_archive: ["category"], category_archive: ["category"], tag_archive: ["tag"], search_results: [], static_page: [], not_found: [] };
// Exclusions : mêmes familles de critères que les conditions, mais elles RETIRENT le modèle (ex. « tout le blog sauf la catégorie Actualités »).
// Une exclusion l'emporte toujours sur une condition d'inclusion. Listes de noms (catégorie, étiquette) ou d'identifiants d'articles.
const MAX_EXCLUDE = 20;
function cleanExclude(ctx, type, raw) {
  const allowed = CONDITIONS[type] || [];
  const out = {};
  const terms = (v) => [...new Set((Array.isArray(v) ? v : String(v ?? "").split(",")).map((x) => line(x, 80)).filter(Boolean))].slice(0, MAX_EXCLUDE);
  if (allowed.includes("category")) { const c = terms(raw && raw.category); if (c.length) out.category = c; }
  if (allowed.includes("tag")) { const t = terms(raw && raw.tag); if (t.length) out.tag = t; }
  if (allowed.includes("postId")) {
    const ids = [...new Set((Array.isArray(raw && raw.postId) ? raw.postId : String((raw && raw.postId) ?? "").split(",")).map((x) => String(x).trim()).filter(Boolean).map(Number))].slice(0, MAX_EXCLUDE);
    for (const id of ids) if (!Number.isInteger(id) || id < 1 || !ctx.db.prepare("SELECT 1 FROM posts WHERE id = ? AND deleted_at IS NULL").get(id)) throw new MarketingError("invalid", "Exclusion : article introuvable.");
    if (ids.length) out.postId = ids;
  }
  return out;
}
// Les modèles du même type qui obtiendraient le MÊME score que celui-ci : en cas d'égalité, le plus ancien l'emporte (voir pick).
// Renvoie leurs noms, pour que l'interface informe au lieu de laisser l'arbitrage invisible.
function specificity(t) { return (t.postId ? 8 : 0) + (t.category ? 4 : 0) + (t.tag ? 2 : 0) + (t.audience ? 1 : 0); }
function sameRankAs(ctx, entry, current) {
  return current.filter((o) => o.id !== entry.id && o.type === entry.type && specificity(o) === specificity(entry)).map((o) => { const p = pageRow(ctx, o.pageId); return { id: o.id, pageName: p ? p.name : "(page supprimée)" }; });
}
function add(ctx, { type, pageId, category = "", tag = "", postId = null, audience = null, exclude = null }) {
  if (!Object.hasOwn(TYPES, type)) throw new MarketingError("invalid", "Type de modèle inconnu.");
  const page = Number.isInteger(pageId) ? pageRow(ctx, pageId) : null;
  if (!page || page.archived_at) throw new MarketingError("invalid", "Choisissez une page du site (non archivée) comme modèle.");
  if (page.kind === "step") throw new MarketingError("invalid", "Une étape de tunnel ne peut pas servir de modèle de thème.");
  const current = read(ctx);
  if (current.length >= MAX_TEMPLATES) throw new MarketingError("invalid", `${MAX_TEMPLATES} modèles au plus.`);
  let aud = null;
  try { aud = nodes.normalizeAudience(audience, "Public du modèle") || null; } catch (e) { throw new MarketingError("invalid", e.message); }
  const allowed = CONDITIONS[type] || [];
  const cat = allowed.includes("category") ? line(category, 80) : "";
  const tg = allowed.includes("tag") ? line(tag, 80) : "";
  let pid = null;
  if (allowed.includes("postId") && postId) {
    pid = Number(postId);
    if (!Number.isInteger(pid) || !ctx.db.prepare("SELECT 1 FROM posts WHERE id = ? AND deleted_at IS NULL").get(pid)) throw new MarketingError("invalid", "Article introuvable.");
  }
  const ex = cleanExclude(ctx, type, exclude);
  const same = (t) => JSON.stringify(t.exclude || null) === JSON.stringify(Object.keys(ex).length ? ex : null) && t.type === type && (t.category || "").toLowerCase() === cat.toLowerCase() && (t.tag || "").toLowerCase() === tg.toLowerCase() && (t.postId || null) === pid && JSON.stringify(t.audience || null) === JSON.stringify(aud);
  if (current.some(same)) throw new MarketingError("invalid", "Un modèle existe déjà pour ce type et ces conditions : retirez-le d'abord ou changez les conditions.");
  const now = new Date().toISOString();
  const entry = { id: newId(), type, pageId, category: cat, ...(tg ? { tag: tg } : {}), ...(pid ? { postId: pid } : {}), ...(aud ? { audience: aud } : {}), ...(Object.keys(ex).length ? { exclude: ex } : {}), createdAt: now, updatedAt: now };
  write(ctx, [...current, entry]);
  return { ...entry, conflicts: sameRankAs(ctx, entry, current) };
}
// Modifier les conditions (ou la page) d'un modèle existant. Mêmes contrôles que add ; le modèle garde son rang d'ancienneté (donc son arbitrage).
function update(ctx, id, changes = {}) {
  const current = read(ctx);
  const at = current.findIndex((t) => t.id === id);
  if (at < 0) throw new MarketingError("not_found", "Modèle introuvable.");
  const old = current[at];
  const rest = current.filter((t) => t.id !== id);
  const probe = { ctx: { ...ctx, settings: { get: () => JSON.stringify(rest), set: () => {} } } };
  // Validation par le chemin d'ajout, sur une liste sans l'ancien modèle (pas de faux doublon avec lui-même)
  const entry = add(probe.ctx, {
    type: old.type, pageId: changes.pageId === undefined ? old.pageId : changes.pageId, category: changes.category === undefined ? old.category : changes.category,
    tag: changes.tag === undefined ? old.tag : changes.tag, postId: changes.postId === undefined ? old.postId : changes.postId,
    audience: changes.audience === undefined ? old.audience : changes.audience, exclude: changes.exclude === undefined ? old.exclude : changes.exclude,
  });
  const next = { ...entry, id: old.id, createdAt: old.createdAt || entry.createdAt, updatedAt: new Date().toISOString() };
  delete next.conflicts;
  const list = current.slice(); list[at] = next;
  write(ctx, list);
  return { ...next, conflicts: sameRankAs(ctx, next, list) };
}
function remove(ctx, id) {
  const current = read(ctx);
  if (!current.some((t) => t.id === id)) throw new MarketingError("not_found", "Modèle introuvable.");
  write(ctx, current.filter((t) => t.id !== id));
}
// PRIORITÉ (le plus précis d'abord, règle déterministe) : article précis (8) > catégorie (4 ; la catégorie de l'article avant ses
// parentes) > étiquette (2) > public (1) > modèle général. À score égal : l'affectation la plus ancienne. Seulement si la page
// du modèle est EN LIGNE. Renvoie la page (ligne de base) ou null.
//   category : nom de la catégorie courante (archive) ; categories : [nom de la catégorie de l'article, puis ses parentes] ;
//   tags : noms des étiquettes de l'article ; tag : étiquette courante (archive) ; postId : article affiché.
// Une exclusion écarte le modèle quoi qu'il en soit : catégorie ou étiquette courante (ou de l'article) dans la liste, ou article exclu.
function excludedBy(t, { cats, tgs, postId }) {
  const ex = t.exclude;
  if (!ex) return null;
  if (ex.postId && postId != null && ex.postId.includes(Number(postId))) return "L'article affiché est exclu par ce modèle.";
  const hitCat = (ex.category || []).find((c) => cats.includes(String(c).toLowerCase()));
  if (hitCat) return `La catégorie « ${hitCat} » est exclue par ce modèle.`;
  const hitTag = (ex.tag || []).find((c) => tgs.includes(String(c).toLowerCase()));
  if (hitTag) return `L'étiquette « ${hitTag} » est exclue par ce modèle.`;
  return null;
}
function pick(ctx, type, { category = "", categories = [], tag = "", tags = [], postId = null, visitor, siteId } = {}) {
  const lc = (v) => String(v || "").toLowerCase();
  const cats = [category, ...categories].filter(Boolean).map(lc);
  const tgs = [tag, ...tags].filter(Boolean).map(lc);
  const scored = [];
  read(ctx).forEach((t, order) => {
    if (t.type !== type) return;
    if (excludedBy(t, { cats, tgs, postId })) return;
    if (visitor !== undefined && !nodes.audienceMatches(t.audience, visitor)) return;
    let score = 0;
    if (t.postId) { if (Number(postId) !== t.postId) return; score += 8; }
    if (t.category) { const at = cats.indexOf(lc(t.category)); if (at < 0) return; score += 4 + (at === 0 ? 0.5 : 0); }
    if (t.tag) { if (!tgs.includes(lc(t.tag))) return; score += 2; }
    if (t.audience) score += 1;
    scored.push({ t, score, order });
  });
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  for (const { t } of scored) {
    const p = pageRow(ctx, t.pageId);
    // siteId fourni (boutique) : le modèle doit appartenir à CE site ; omis (blog historique) : comportement inchangé
    if (p && p.status === "published" && !p.archived_at && (siteId === undefined || (p.site_id ?? null) === siteId)) return p;
  }
  return null;
}
// Une page qui sert de modèle ne part pas à la corbeille en silence : refus qui liste les modèles, ou détachement explicite (les affectations sont alors retirées :
// aucune référence orpheline, le site reprend son affichage d'origine pour ces pages).
function guardPageRemoval(ctx, pageId, { detach = false, action = "archivée" } = {}) {
  const used = read(ctx).filter((t) => t.pageId === pageId);
  if (!used.length) return [];
  if (!detach) throw new MarketingError("in_use", `Cette page sert de modèle de thème (${used.map((t) => `« ${TYPES[t.type].label} »`).join(", ")}). Elle ne peut pas être ${action} tant que le modèle est affecté : retirez-le d'abord (Apparence › Templates), ou confirmez le détachement.`);
  write(ctx, read(ctx).filter((t) => t.pageId !== pageId));
    return used;
}
// Explication d'une résolution : pour une famille et un contexte donnés, le modèle appliqué ET la raison pour laquelle chacun des autres ne l'est pas.
// Même règle que pick() (une seule source de vérité pour le score) ; ne modifie rien.
function explain(ctx, type, { category = "", categories = [], tag = "", tags = [], postId = null, visitor } = {}) {
  if (!Object.hasOwn(TYPES, type)) throw new MarketingError("invalid", "Type de modèle inconnu.");
  const lc = (v) => String(v || "").toLowerCase();
  const cats = [category, ...categories].filter(Boolean).map(lc);
  const tgs = [tag, ...tags].filter(Boolean).map(lc);
  const rows = [];
  read(ctx).forEach((t, order) => {
    if (t.type !== type) return;
    const p = pageRow(ctx, t.pageId);
    const base = { id: t.id, pageId: t.pageId, pageName: p ? p.name : "(page supprimée)", conditions: { category: t.category || "", tag: t.tag || "", postId: t.postId || null, exclude: t.exclude || null, audience: t.audience ? nodes.audienceLabel(t.audience) : "" } };
    let score = 0, reason = "";
    const excl = excludedBy(t, { cats, tgs, postId });
    if (excl) reason = excl;
    else if (t.postId && Number(postId) !== t.postId) reason = "L'article demandé n'est pas celui du modèle.";
    else if (t.postId) score += 8;
    if (!reason && t.category) { const at = cats.indexOf(lc(t.category)); if (at < 0) reason = `La catégorie « ${t.category} » ne correspond pas à la page demandée.`; else score += 4 + (at === 0 ? 0.5 : 0); }
    if (!reason && t.tag) { if (!tgs.includes(lc(t.tag))) reason = `L'étiquette « ${t.tag} » ne correspond pas à la page demandée.`; else score += 2; }
    if (!reason && t.audience) { if (visitor !== undefined && !nodes.audienceMatches(t.audience, visitor)) reason = "Le public du modèle ne correspond pas au visiteur."; else score += 1; }
    if (!reason && (!p || p.archived_at)) reason = "La page du modèle est archivée ou supprimée.";
    else if (!reason && p.status !== "published") reason = "La page du modèle n'est pas en ligne (brouillon ou hors ligne).";
    rows.push({ ...base, score, order, eligible: !reason, reason });
  });
  const eligible = rows.filter((r) => r.eligible).sort((a, b) => b.score - a.score || a.order - b.order);
  const winner = eligible[0] || null;
  const candidates = rows.map((r) => {
    if (winner && r.id === winner.id) return { ...r, applied: true, reason: "Appliqué : c'est le plus précis parmi les modèles qui conviennent." };
    if (r.eligible) return { ...r, applied: false, reason: r.score === winner.score ? "Convient aussi, mais un modèle affecté avant lui a la même précision." : "Convient, mais un modèle plus précis est appliqué à sa place." };
    return { ...r, applied: false };
  });
  return { type, typeLabel: TYPES[type].label, winner: winner ? { id: winner.id, pageId: winner.pageId, pageName: winner.pageName, score: winner.score } : null, candidates,
    fallback: winner ? "" : "Aucun modèle en ligne ne convient : le site garde son affichage d'origine pour cette page." };
}
// Type d'affectation d'une page (pour montrer des données d'exemple pendant qu'on la dessine)
const typesOfPage = (ctx, pageId) => read(ctx).filter((t) => t.pageId === pageId).map((t) => t.type);

module.exports = { update, specificity, guardPageRemoval, explain, registerTemplateType, TYPES, CONDITIONS, KEY, MAX_TEMPLATES, list, add, remove, pick, typesOfPage, read };
