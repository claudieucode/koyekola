// Modèles d'e-mails : création, modification (avec historique et contrôle de concurrence), duplication, rendu, aperçu.
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { getContact } = require("../audience/contacts");
const { checkCtx, cleanText, audit, MarketingError } = require("../audience/shared");
const { compileTemplate, renderEmail } = require("./blocks");
const { lintEmail } = require("./lint");
const context = require("./context");
const { resolveCourseBlocks } = require("./courses");
const { CATEGORIES, isCategory } = require("./categories");

const KEEP_VERSIONS = 20;
const CONTENT_KEYS = ["name", "kind", "category", "subject", "preheader", "theme", "footer", "blocks"];

const table = (ctx) => createRepository(ctx.db, ctx.organizationId).table("mk_templates");
const parse = (row) => (row ? { ...row, theme: JSON.parse(row.theme), footer: JSON.parse(row.footer), blocks: JSON.parse(row.blocks) } : null);
const content = (t) => Object.fromEntries(CONTENT_KEYS.map((k) => [k, t[k]]));

// Compilation en cache (clé : organisation + modèle + version) : un envoi de 100 000 messages ne compile qu'une fois
const caches = new WeakMap();
function compiled(ctx, template) {
  if (!caches.has(ctx.db)) caches.set(ctx.db, new Map());
  const cache = caches.get(ctx.db);
  const key = `${ctx.organizationId}:${template.id}:${template.version}`;
  if (!cache.has(key)) {
    if (cache.size >= 100) cache.delete(cache.keys().next().value);
    cache.set(key, compileTemplate(content(template), { allowed: context.allowedFor(ctx) }));
  }
  return cache.get(key);
}

function requireTemplate(ctx, id) {
  checkCtx(ctx);
  const template = parse(Number.isInteger(id) ? table(ctx).get(id) : null);
  if (!template) throw new MarketingError("not_found", "Modèle introuvable.");
  return template;
}

function cleanName(value) {
  const name = cleanText(value, { max: 101, field: "name" });
  if (!name) throw new MarketingError("invalid_field", "Le nom du modèle est obligatoire.");
  if (name.length > 100) throw new MarketingError("invalid_field", "Le nom du modèle est trop long (100 caractères au plus).");
  return name;
}

function cleanCategory(value) {
  if (value === undefined || value === null || value === "") return "";
  if (!isCategory(value)) throw new MarketingError("invalid_field", "Catégorie inconnue.");
  return value;
}

const fields = (norm, category = "") => ({ kind: norm.kind, category, subject: norm.subject, preheader: norm.preheader, theme: JSON.stringify(norm.theme), footer: JSON.stringify(norm.footer), blocks: JSON.stringify(norm.blocks) });

function createTemplate(ctx, input = {}) {
  checkCtx(ctx);
  const name = cleanName(input.name);
  const { normalized } = compileTemplate({ ...input, blocks: resolveCourseBlocks(ctx, input.blocks) }, { allowed: context.allowedFor(ctx) });
  const category = cleanCategory(input.category);
  const repo = table(ctx);
  if (repo.count({ name }) > 0) throw new MarketingError("duplicate", "Un modèle porte déjà ce nom.");
  const row = repo.insert({ name, ...fields(normalized, category), created_by: ctx.userId ?? null, updated_by: ctx.userId ?? null });
  audit(ctx, "template.created", "template", row.id, { kind: normalized.kind, blocks: normalized.blocks.length });
  return parse(row);
}

const getTemplate = (ctx, id) => (checkCtx(ctx), parse(Number.isInteger(id) ? table(ctx).get(id) : null));

function listTemplates(ctx) {
  checkCtx(ctx);
  return ctx.db
    .prepare("SELECT id, name, kind, category, subject, blocks, version, updated_at, created_at FROM mk_templates WHERE organization_id = ? ORDER BY updated_at DESC, id DESC")
    .all(ctx.organizationId)
    .map(({ blocks, ...rest }) => ({ ...rest, blockCount: JSON.parse(blocks).length }));
}

// Liste filtrée pour l'interface : recherche (nom et objet), type, catégorie (« none » = sans catégorie), tri sur liste blanche.
const SORTS = {
  updated: { asc: "t.updated_at ASC, t.id ASC", desc: "t.updated_at DESC, t.id DESC", defaultDir: "desc" },
  name: { asc: "t.name COLLATE NOCASE ASC, t.id ASC", desc: "t.name COLLATE NOCASE DESC, t.id ASC", defaultDir: "asc" },
  kind: { asc: "t.kind ASC, t.name COLLATE NOCASE ASC", desc: "t.kind DESC, t.name COLLATE NOCASE ASC", defaultDir: "asc" },
  category: { asc: "t.category ASC, t.name COLLATE NOCASE ASC", desc: "t.category DESC, t.name COLLATE NOCASE ASC", defaultDir: "asc" },
};
const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

function searchTemplates(ctx, { q, kind, category } = {}, { sort, dir } = {}) {
  checkCtx(ctx);
  const where = ["t.organization_id = ?"];
  const params = [ctx.organizationId];
  if (typeof q === "string" && q.trim()) {
    const like = `%${escapeLike(q.trim().slice(0, 100))}%`;
    where.push("(t.name LIKE ? ESCAPE '\\' OR t.subject LIKE ? ESCAPE '\\')");
    params.push(like, like);
  }
  if (kind === "marketing" || kind === "transactional") { where.push("t.kind = ?"); params.push(kind); }
  if (category === "none") where.push("t.category = ''");
  else if (isCategory(category)) { where.push("t.category = ?"); params.push(category); }
  const key = typeof sort === "string" && Object.hasOwn(SORTS, sort) ? sort : "updated";
  const direction = dir === "asc" || dir === "desc" ? dir : SORTS[key].defaultDir;
  return ctx.db
    .prepare(
      `SELECT t.id, t.name, t.kind, t.category, t.subject, t.blocks, t.version, t.updated_at, t.created_at,
              (SELECT COUNT(*) FROM mk_campaigns c WHERE c.template_id = t.id AND c.organization_id = t.organization_id AND c.kind = 'campaign') AS usedBy
       FROM mk_templates t WHERE ${where.join(" AND ")} ORDER BY ${SORTS[key][direction]} LIMIT 500`
    )
    .all(...params)
    .map(({ blocks, ...rest }) => ({ ...rest, blockCount: JSON.parse(blocks).length }));
}

// Effectifs des onglets : all, none (sans catégorie) et chaque catégorie qui a au moins un modèle
function templateCategoryCounts(ctx) {
  checkCtx(ctx);
  const rows = ctx.db.prepare("SELECT category, COUNT(*) n FROM mk_templates WHERE organization_id = ? GROUP BY category").all(ctx.organizationId);
  const counts = { all: 0, none: 0 };
  for (const r of rows) {
    counts.all += r.n;
    if (r.category === "") counts.none += r.n;
    else if (isCategory(r.category)) counts[r.category] = r.n;
  }
  return counts;
}

function saveContent(ctx, current, merged, { expectedVersion, action }) {
  const { normalized } = compileTemplate({ ...merged, blocks: resolveCourseBlocks(ctx, merged.blocks) }, { allowed: context.allowedFor(ctx) });
  const name = cleanName(merged.name);
  const category = cleanCategory(merged.category === undefined ? current.category : merged.category);
  const repo = table(ctx);
  if (name.toLowerCase() !== current.name.toLowerCase() && repo.count({ name }) > 0) throw new MarketingError("duplicate", "Un modèle porte déjà ce nom.");
  return transaction(ctx.db, () => {
    ctx.db
      .prepare("INSERT INTO mk_template_versions (organization_id, template_id, version, snapshot, created_by) VALUES (?, ?, ?, ?, ?)")
      .run(ctx.organizationId, current.id, current.version, JSON.stringify(content(current)), current.updated_by);
    // Mise à jour conditionnelle : si quelqu'un a enregistré entre-temps, on ne l'écrase pas
    const row = ctx.db
      .prepare(
        `UPDATE mk_templates SET name = ?, kind = ?, category = ?, subject = ?, preheader = ?, theme = ?, footer = ?, blocks = ?, version = version + 1, updated_by = ?, updated_at = datetime('now')
         WHERE id = ? AND organization_id = ? AND version = ? RETURNING *`
      )
      .get(name, normalized.kind, category, normalized.subject, normalized.preheader, JSON.stringify(normalized.theme), JSON.stringify(normalized.footer), JSON.stringify(normalized.blocks), ctx.userId ?? null, current.id, ctx.organizationId, current.version);
    if (!row) throw new MarketingError("conflict", "Ce modèle vient d'être modifié ailleurs : rechargez la page avant d'enregistrer.");
    ctx.db
      .prepare("DELETE FROM mk_template_versions WHERE template_id = ? AND version NOT IN (SELECT version FROM mk_template_versions WHERE template_id = ? ORDER BY version DESC LIMIT ?)")
      .run(current.id, current.id, KEEP_VERSIONS);
    audit(ctx, action, "template", current.id, { version: row.version });
    return parse(row);
  });
}

function updateTemplate(ctx, id, patch = {}, { expectedVersion } = {}) {
  const current = requireTemplate(ctx, id);
  if (expectedVersion !== undefined && expectedVersion !== current.version) {
    throw new MarketingError("conflict", `Ce modèle a été modifié entre-temps (version ${current.version} au lieu de ${expectedVersion}) : rechargez la page avant d'enregistrer.`);
  }
  const merged = content(current);
  for (const key of CONTENT_KEYS) if (patch[key] !== undefined) merged[key] = patch[key];
  return saveContent(ctx, current, merged, { action: "template.updated" });
}

function duplicateTemplate(ctx, id) {
  const source = requireTemplate(ctx, id);
  const repo = table(ctx);
  let name = cleanName(`Copie de ${source.name}`.slice(0, 100));
  for (let n = 2; repo.count({ name }) > 0 && n < 100; n++) name = `${`Copie de ${source.name}`.slice(0, 90)} (${n})`;
  return createTemplate(ctx, { ...content(source), name });
}

function deleteTemplate(ctx, id) {
  checkCtx(ctx);
  const removed = table(ctx).remove(id);
  if (removed) audit(ctx, "template.deleted", "template", id, {});
  return removed;
}

function listVersions(ctx, id) {
  requireTemplate(ctx, id);
  return ctx.db
    .prepare("SELECT version, created_by, created_at FROM mk_template_versions WHERE template_id = ? AND organization_id = ? ORDER BY version DESC")
    .all(id, ctx.organizationId);
}

function getVersion(ctx, id, version) {
  requireTemplate(ctx, id);
  const row = ctx.db.prepare("SELECT snapshot FROM mk_template_versions WHERE template_id = ? AND organization_id = ? AND version = ?").get(id, ctx.organizationId, version);
  return row ? JSON.parse(row.snapshot) : null;
}

// Restaurer = créer une NOUVELLE version avec l'ancien contenu (l'historique ne se réécrit jamais) ; le nom actuel est conservé
function restoreVersion(ctx, id, version) {
  const current = requireTemplate(ctx, id);
  const old = getVersion(ctx, id, version);
  if (!old) throw new MarketingError("not_found", "Cette version n'existe plus (seules les 20 dernières sont conservées).");
  return saveContent(ctx, current, { ...old, name: current.name }, { action: "template.restored" });
}

function withWarnings(compiledTemplate, ctxData) {
  const rendered = renderEmail(compiledTemplate, ctxData);
  return { ...rendered, warnings: lintEmail(compiledTemplate, rendered), variables: compiledTemplate.variables };
}

// Rendu d'un modèle enregistré pour un contact (données d'exemple si contact absent). Le contact est relu dans l'organisation.
function renderTemplate(ctx, id, contact, { urls, event } = {}) {
  const template = requireTemplate(ctx, id);
  let data;
  if (contact) {
    const own = getContact(ctx, contact.id);
    if (!own) throw new MarketingError("not_found", "Contact introuvable.");
    data = context.buildContext(ctx, own, { urls, event });
  } else data = context.sampleContext(ctx);
  return withWarnings(compiled(ctx, template), data);
}

// Aperçu d'un brouillon non enregistré
function previewTemplate(ctx, input, { contact } = {}) {
  checkCtx(ctx);
  const c = compileTemplate({ ...input, blocks: resolveCourseBlocks(ctx, input && input.blocks) }, { allowed: context.allowedFor(ctx) });
  let data = context.sampleContext(ctx);
  if (contact) {
    const own = getContact(ctx, contact.id);
    if (!own) throw new MarketingError("not_found", "Contact introuvable.");
    data = context.buildContext(ctx, own, { urls: {} });
    data.unsubscribe_url = "https://exemple.invalid/desinscription";
  }
  return { ...withWarnings(c, data), normalized: c.normalized };
}

function templateReadiness(ctx, id) {
  const r = renderTemplate(ctx, id, null);
  const errors = r.warnings.filter((w) => w.level === "error");
  return { ready: errors.length === 0, errors, warnings: r.warnings.filter((w) => w.level !== "error") };
}

module.exports = {
  ...context, CATEGORIES, searchTemplates, templateCategoryCounts, createTemplate, getTemplate, listTemplates, updateTemplate, duplicateTemplate, deleteTemplate, listVersions, getVersion, restoreVersion,
  renderTemplate, previewTemplate, templateReadiness, compileTemplate, renderEmail, lintEmail,
};
