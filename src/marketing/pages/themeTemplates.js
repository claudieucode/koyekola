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
  category_archive: { label: "Archive de catégorie", hint: "Remplace la liste des articles d'UNE catégorie (adresse /blog/categorie/…). Limitez-le à une catégorie, ou laissez « toutes » ; sans modèle de ce type, le modèle « Liste du blog » est utilisé. La catégorie courante se lit avec {{query.categorie}}." },
  tag_archive: { label: "Archive d'étiquette", hint: "Remplace la liste des articles d'UNE étiquette (adresse /blog/etiquette/…). Limitez-le à une étiquette, ou laissez « toutes » ; sans modèle de ce type, le modèle « Liste du blog » est utilisé. L'étiquette courante se lit avec {{query.etiquette}}." },
  search_results: { label: "Résultats de recherche", hint: "Remplace la liste quand une recherche est faite dans le blog (/blog?q=…). La recherche saisie se lit avec {{query.q}}. Le moteur de recherche global du site viendra plus tard : ce modèle reçoit déjà la requête et les résultats du blog." },
  static_page: { label: "Page du site (À propos)", hint: "Remplace le texte de la page « À propos ». Utilisez l'élément « Contenu de l'article » : il affiche le texte de la page ; {{post.title}} donne son titre." },
  not_found: { label: "Page introuvable (404)", hint: "S'affiche quand une adresse n'existe pas." },
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
  return ctx.db.prepare("SELECT id, name, slug, status, kind, archived_at FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) || null;
}
// Affectations avec le nom et l'état de leur page
function list(ctx) {
  return read(ctx).map((t) => { const p = pageRow(ctx, t.pageId); return { ...t, typeLabel: TYPES[t.type].label, pageName: p ? p.name : "(page supprimée)", pageStatus: p ? p.status : "missing", audienceLabel: t.audience ? nodes.audienceLabel(t.audience) : "" }; });
}
// Conditions possibles selon la famille : catégorie (articles, listes, archives de catégorie), étiquette (articles, archives d'étiquette),
// article précis (articles seulement). Une condition vide = « tous ».
const CONDITIONS = { single_post: ["category", "tag", "postId"], blog_archive: ["category"], category_archive: ["category"], tag_archive: ["tag"], search_results: [], static_page: [], not_found: [] };
function add(ctx, { type, pageId, category = "", tag = "", postId = null, audience = null }) {
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
  const same = (t) => t.type === type && (t.category || "").toLowerCase() === cat.toLowerCase() && (t.tag || "").toLowerCase() === tg.toLowerCase() && (t.postId || null) === pid && JSON.stringify(t.audience || null) === JSON.stringify(aud);
  if (current.some(same)) throw new MarketingError("invalid", "Un modèle existe déjà pour ce type et ces conditions : retirez-le d'abord ou changez les conditions.");
  const entry = { id: newId(), type, pageId, category: cat, ...(tg ? { tag: tg } : {}), ...(pid ? { postId: pid } : {}), ...(aud ? { audience: aud } : {}) };
  write(ctx, [...current, entry]);
  return entry;
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
function pick(ctx, type, { category = "", categories = [], tag = "", tags = [], postId = null, visitor } = {}) {
  const lc = (v) => String(v || "").toLowerCase();
  const cats = [category, ...categories].filter(Boolean).map(lc);
  const tgs = [tag, ...tags].filter(Boolean).map(lc);
  const scored = [];
  read(ctx).forEach((t, order) => {
    if (t.type !== type) return;
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
    if (p && p.status === "published" && !p.archived_at) return p;
  }
  return null;
}
// Type d'affectation d'une page (pour montrer des données d'exemple pendant qu'on la dessine)
const typesOfPage = (ctx, pageId) => read(ctx).filter((t) => t.pageId === pageId).map((t) => t.type);

module.exports = { registerTemplateType, TYPES, CONDITIONS, KEY, MAX_TEMPLATES, list, add, remove, pick, typesOfPage, read };
