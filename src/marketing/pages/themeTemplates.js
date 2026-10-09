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
function add(ctx, { type, pageId, category = "", audience = null }) {
  if (!Object.hasOwn(TYPES, type)) throw new MarketingError("invalid", "Type de modèle inconnu.");
  const page = Number.isInteger(pageId) ? pageRow(ctx, pageId) : null;
  if (!page || page.archived_at) throw new MarketingError("invalid", "Choisissez une page du site (non archivée) comme modèle.");
  if (page.kind === "step") throw new MarketingError("invalid", "Une étape de tunnel ne peut pas servir de modèle de thème.");
  const current = read(ctx);
  if (current.length >= MAX_TEMPLATES) throw new MarketingError("invalid", `${MAX_TEMPLATES} modèles au plus.`);
  let aud = null;
  try { aud = nodes.normalizeAudience(audience, "Public du modèle") || null; } catch (e) { throw new MarketingError("invalid", e.message); }
  const cat = type === "not_found" ? "" : line(category, 80);
  if (current.some((t) => t.type === type && t.category.toLowerCase() === cat.toLowerCase() && JSON.stringify(t.audience || null) === JSON.stringify(aud))) throw new MarketingError("invalid", "Un modèle existe déjà pour ce type, cette catégorie et ce public : supprimez-le d'abord.");
  const entry = { id: newId(), type, pageId, category: cat, ...(aud ? { audience: aud } : {}) };
  write(ctx, [...current, entry]);
  return entry;
}
function remove(ctx, id) {
  const current = read(ctx);
  if (!current.some((t) => t.id === id)) throw new MarketingError("not_found", "Modèle introuvable.");
  write(ctx, current.filter((t) => t.id !== id));
}
// Le modèle à utiliser : celui dont la catégorie et le public conviennent, le plus précis d'abord (catégorie, puis public) ;
// seulement si sa page est EN LIGNE. Renvoie la page (ligne de base) ou null.
function pick(ctx, type, { category = "", visitor } = {}) {
  const cat = String(category || "").toLowerCase();
  const matches = read(ctx).filter((t) => t.type === type && (!t.category || t.category.toLowerCase() === cat) && (visitor === undefined || nodes.audienceMatches(t.audience, visitor)));
  matches.sort((a, b) => (b.category ? 2 : 0) + (b.audience ? 1 : 0) - ((a.category ? 2 : 0) + (a.audience ? 1 : 0)));
  for (const t of matches) {
    const p = pageRow(ctx, t.pageId);
    if (p && p.status === "published" && !p.archived_at) return p;
  }
  return null;
}
// Type d'affectation d'une page (pour montrer des données d'exemple pendant qu'on la dessine)
const typesOfPage = (ctx, pageId) => read(ctx).filter((t) => t.pageId === pageId).map((t) => t.type);

module.exports = { registerTemplateType, TYPES, KEY, MAX_TEMPLATES, list, add, remove, pick, typesOfPage, read };
