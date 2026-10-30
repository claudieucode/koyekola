// Contenus multilingues : relations entre traductions (par site), validation hreflang/canonical, métadonnées localisées. Kolakisa ne « traduit » pas ici : il RELIE des pages que la
// personne a écrites ou adaptées, et vérifie la cohérence des balises. Une page n'est jamais déclarée traduction d'une page d'un autre site.
// hreflang : code langue (ISO 639-1) + région facultative (ISO 3166-1). x-default est une page choisie explicitement (jamais présumée).
const store = require("./store");
const { LANGUAGES, COUNTRIES } = require("../contentGen/localize");
const urls = require("../services/urls");

const bad = (m, code = "invalid") => Object.assign(new Error(m), { code, name: "MarketingError" });
const LANG = /^[a-z]{2}$/, REGION = /^[A-Z]{2}$/;
const tag = (lang, region) => (region ? `${lang}-${region}` : lang);

function pageOf(ctx, siteId, pageId) {
  const r = Number.isInteger(pageId) ? ctx.db.prepare("SELECT id, slug, name, site_id, status FROM mk_landing_pages WHERE id = ? AND site_id = ? AND organization_id = ? AND archived_at IS NULL").get(pageId, siteId, ctx.organizationId) : null;
  if (!r) throw bad("Page introuvable dans ce site.", "not_found");
  return r;
}
// Relier une page à un groupe de traduction. `groupKey` vide → nouveau groupe (la page est l'original).
function link(ctx, siteId, { pageId, lang, region = "", groupKey = "", kind = "translation" }) {
  store.ensureSchema(ctx.db);
  if (!LANG.test(String(lang))) throw bad("Langue : deux lettres (ex. fr, en).");
  if (region && !REGION.test(String(region))) throw bad("Région : deux lettres majuscules (ex. FR, CD).");
  if (!["translation", "adaptation"].includes(kind)) throw bad("Type : traduction ou adaptation locale.");
  pageOf(ctx, siteId, pageId);
  const key = groupKey ? String(groupKey).slice(0, 40) : `g${pageId}`;
  if (groupKey && !ctx.db.prepare("SELECT 1 FROM mk_ci_translations WHERE site_id = ? AND organization_id = ? AND group_key = ?").get(siteId, ctx.organizationId, key)) throw bad("Groupe de traduction introuvable dans ce site.", "not_found");
  try {
    ctx.db.prepare("INSERT INTO mk_ci_translations (site_id, organization_id, group_key, page_id, lang, region, kind, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)").run(siteId, ctx.organizationId, key, pageId, lang, region, kind, ctx.userId || null, new Date(ctx.now ? ctx.now() : Date.now()).toISOString());
  } catch (e) { if (/UNIQUE/.test(String(e.message))) throw bad("Cette page est déjà reliée, ou cette langue existe déjà dans le groupe.", "duplicate"); throw e; }
  return { groupKey: key };
}
function unlink(ctx, siteId, pageId) {
  store.ensureSchema(ctx.db);
  const r = ctx.db.prepare("DELETE FROM mk_ci_translations WHERE site_id = ? AND organization_id = ? AND page_id = ?").run(siteId, ctx.organizationId, pageId);
  return { removed: Number(r.changes) };
}
function groups(ctx, siteId) {
  store.ensureSchema(ctx.db);
  const rows = ctx.db.prepare(`SELECT t.group_key, t.page_id, t.lang, t.region, t.kind, p.name, p.slug, p.site_id, p.status FROM mk_ci_translations t JOIN mk_landing_pages p ON p.id = t.page_id AND p.site_id = t.site_id
    WHERE t.site_id = ? AND t.organization_id = ? AND p.archived_at IS NULL ORDER BY t.group_key, t.lang, t.region`).all(siteId, ctx.organizationId);
  const map = new Map();
  for (const r of rows) { if (!map.has(r.group_key)) map.set(r.group_key, []); map.get(r.group_key).push({ pageId: r.page_id, lang: r.lang, region: r.region, tag: tag(r.lang, r.region), kind: r.kind, name: r.name, path: urls.pageCanonicalPath(r), status: r.status }); }
  return [...map].map(([groupKey, members]) => ({ groupKey, members }));
}
// Contrôle d'un groupe : les erreurs qui rendent hreflang inutile ou nuisible, et ce qui reste à faire. `xDefault` = pageId choisi explicitement.
function validate(group, { xDefault = null } = {}) {
  const out = [], seen = new Map();
  const add = (severity, code, message) => out.push({ severity, code, message });
  if (group.members.length < 2) add("info", "single", "Un seul membre : aucune balise hreflang n'est nécessaire.");
  for (const m of group.members) {
    if (seen.has(m.tag)) add("error", "duplicate_tag", `Deux pages déclarent ${m.tag}.`); seen.set(m.tag, m);
    if (m.status !== "published") add("warning", "unpublished", `« ${m.name} » (${m.tag}) n'est pas publiée : elle ne doit pas figurer dans hreflang tant qu'elle n'est pas en ligne.`);
    if (m.lang && !LANGUAGES[m.lang]) add("info", "language_unlisted", `Langue ${m.lang} : qualité de rédaction non vérifiée par Kolakisa.`);
    if (m.region && !Object.values(COUNTRIES).length) add("info", "region", m.region);
  }
  if (xDefault && !group.members.some((m) => m.pageId === xDefault)) add("error", "x_default_outside_group", "La page x-default doit appartenir au groupe.");
  const langsNoRegion = new Set(group.members.filter((m) => !m.region).map((m) => m.lang));
  for (const m of group.members.filter((m) => m.region)) if (!langsNoRegion.has(m.lang) && group.members.filter((x) => x.lang === m.lang).length === 1) add("info", "regional_only", `${m.tag} est la seule variante ${m.lang} : prévoir ${m.lang} sans région si d'autres pays parlent cette langue.`);
  const adaptations = group.members.filter((m) => m.kind === "adaptation").length;
  if (adaptations) add("info", "adaptation", `${adaptations} page(s) déclarée(s) « adaptation locale » : elles doivent avoir un contenu propre au marché, pas seulement un nom de pays ou de ville changé.`);
  return { ok: !out.some((i) => i.severity === "error"), issues: out };
}
// Balises alternates d'une page : réciproques (toutes les pages publiées du groupe, y compris elle-même). Rien si moins de deux pages publiées.
function alternates(group, pageId, { siteOrigin = "", xDefault = null } = {}) {
  const live = group.members.filter((m) => m.status === "published");
  if (live.length < 2 || !live.some((m) => m.pageId === pageId)) return [];
  const tags = live.map((m) => ({ hreflang: m.tag, href: `${siteOrigin}${m.path}` }));
  const x = xDefault && live.find((m) => m.pageId === xDefault);
  if (x) tags.push({ hreflang: "x-default", href: `${siteOrigin}${x.path}` });
  return tags;
}
module.exports = { link, unlink, groups, validate, alternates, tag, LANG, REGION };
