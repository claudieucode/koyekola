// Segments : évaluation d'une définition (comptage, aperçu, pagination, appartenance) et segments enregistrés.
const { createRepository } = require("../db/repository");
const { compile } = require("./engine");
const { sendableSql } = require("../compliance/sendable");
const { checkCtx, cleanText, audit, resolveSite, MarketingError } = require("../audience/shared");

const MAX_PAGE = 200;
const MAX_PREVIEW = 50;

// Contact appartenant à un site (site d'origine, ou événement enregistré sur ce site) — même règle que les écrans de contacts du Contact Core
const belongsToSite = (a, siteId) => ({
  sql: `(${a}.origin_site_id = ? OR EXISTS (SELECT 1 FROM mk_events e WHERE e.contact_id = ${a}.id AND e.organization_id = ${a}.organization_id AND e.site_id = ?))`,
  params: [siteId, siteId],
});

// Un segment d'un SITE ne peut jamais désigner un contact d'un autre site (siteId explicite, sinon le site imposé à la personne connectée)
function build(ctx, definition, { sendableOnly = false, siteId } = {}) {
  checkCtx(ctx);
  const { where, params } = compile(ctx, definition);
  const sendable = sendableOnly ? sendableSql("c") : null;
  const sid = Number.isInteger(siteId) ? siteId : Number.isInteger(ctx.siteScope) ? ctx.siteScope : null;
  const site = sid === null ? null : belongsToSite("c", sid);
  return { sql: `c.organization_id = ? AND ${where}${sendable ? ` AND ${sendable.sql}` : ""}${site ? ` AND ${site.sql}` : ""}`, params: [ctx.organizationId, ...params, ...(sendable ? sendable.params : []), ...(site ? site.params : [])] };
}

const validateDefinition = (ctx, definition) => (checkCtx(ctx), compile(ctx, definition), { ok: true });

const countSegment = (ctx, definition, opts) => {
  const { sql, params } = build(ctx, definition, opts);
  return ctx.db.prepare(`SELECT COUNT(*) AS n FROM mk_contacts c WHERE ${sql}`).get(...params).n;
};

function segmentContacts(ctx, definition, { limit = 50, afterId, sendableOnly, siteId } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE) throw new MarketingError("invalid_field", `Limite invalide (entre 1 et ${MAX_PAGE}).`);
  const { sql, params } = build(ctx, definition, { sendableOnly, siteId });
  if (afterId) params.push(Number(afterId));
  const rows = ctx.db.prepare(`SELECT c.* FROM mk_contacts c WHERE ${sql}${afterId ? " AND c.id > ?" : ""} ORDER BY c.id ASC LIMIT ?`).all(...params, limit + 1);
  const more = rows.length > limit;
  const page = more ? rows.slice(0, limit) : rows;
  return { rows: page, nextAfterId: more ? page[page.length - 1].id : null };
}

// L'interface ne reçoit JAMAIS la liste complète : un aperçu de quelques lignes + le total
function previewSegment(ctx, definition, { limit = 20, sendableOnly } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PREVIEW) throw new MarketingError("invalid_field", `Limite d'aperçu invalide (entre 1 et ${MAX_PREVIEW}).`);
  return { total: countSegment(ctx, definition, { sendableOnly }), rows: segmentContacts(ctx, definition, { limit, sendableOnly }).rows };
}

function matches(ctx, definition, contactId) {
  const { sql, params } = build(ctx, definition);
  return Boolean(ctx.db.prepare(`SELECT 1 FROM mk_contacts c WHERE ${sql} AND c.id = ?`).get(...params, contactId));
}

// --- Segments enregistrés ---
const table = (ctx) => createRepository(ctx.db, ctx.organizationId, { siteScope: ctx.siteScope }).table("mk_segments");
const parse = (row) => (row ? { ...row, definition: JSON.parse(row.definition) } : null);

function getSegment(ctx, id) {
  checkCtx(ctx);
  return parse(table(ctx).get(id));
}

function createSegment(ctx, { name, description = "", definition, siteId } = {}) {
  checkCtx(ctx);
  const cleanName = cleanText(name, { max: 100, field: "name" });
  if (!cleanName) throw new MarketingError("invalid_field", "Le nom du segment est obligatoire.");
  compile(ctx, definition);
  const repo = table(ctx);
  if (repo.count({ name: cleanName }) > 0) throw new MarketingError("duplicate", "Un segment porte déjà ce nom.");
  const row = repo.insert({ name: cleanName, description: cleanText(description, { max: 500, field: "description" }), definition: JSON.stringify(definition), site_id: resolveSite(ctx, siteId) });
  audit(ctx, "segment.created", "segment", row.id, { name: cleanName });
  return parse(row);
}

function updateSegment(ctx, id, patch = {}) {
  checkCtx(ctx);
  const repo = table(ctx);
  const existing = repo.get(id);
  if (!existing) throw new MarketingError("not_found", "Segment introuvable.");
  const fields = { updated_at: new Date().toISOString().slice(0, 19).replace("T", " ") };
  if (patch.name !== undefined) {
    fields.name = cleanText(patch.name, { max: 100, field: "name" });
    if (!fields.name) throw new MarketingError("invalid_field", "Le nom du segment est obligatoire.");
    if (fields.name.toLowerCase() !== existing.name.toLowerCase() && repo.count({ name: fields.name }) > 0) throw new MarketingError("duplicate", "Un segment porte déjà ce nom.");
  }
  if (patch.description !== undefined) fields.description = cleanText(patch.description, { max: 500, field: "description" });
  if (patch.definition !== undefined) {
    compile(ctx, patch.definition);
    fields.definition = JSON.stringify(patch.definition);
  }
  const row = repo.update(id, fields);
  audit(ctx, "segment.updated", "segment", id, { fields: Object.keys(patch) });
  return parse(row);
}

function deleteSegment(ctx, id) {
  checkCtx(ctx);
  const removed = table(ctx).remove(id);
  if (removed) audit(ctx, "segment.deleted", "segment", id, {});
  return removed;
}

const listSegments = (ctx) => (checkCtx(ctx), table(ctx).list({ limit: 500, orderBy: "name", where: ctx.siteFilter === "principal" ? { site_id: null } : Number.isInteger(ctx.siteFilter) ? { site_id: ctx.siteFilter } : undefined }).rows.map(parse));

function evaluateSegment(ctx, id, opts) {
  const segment = getSegment(ctx, id);
  if (!segment) throw new MarketingError("not_found", "Segment introuvable.");
  return segmentContacts(ctx, segment.definition, { ...opts, siteId: segment.site_id ?? undefined });
}

// Condition SQL (alias c) d'un segment : pour les usages en masse (audience d'une campagne)
const selectSql = (ctx, definition, opts) => build(ctx, definition, opts);

// Campagnes (hors scénarios) qui ciblent ce segment
function segmentUsage(ctx, id) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT id, name, status FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND target_type = 'segment' AND target_id = ? ORDER BY id DESC").all(ctx.organizationId, id);
}

// « Copie de X », « Copie de X (2) »… : même définition, nom unique, 100 caractères au plus
function duplicateSegment(ctx, id) {
  const source = getSegment(ctx, id);
  if (!source) throw new MarketingError("not_found", "Segment introuvable.");
  const taken = new Set(listSegments(ctx).map((s) => s.name.toLowerCase()));
  const build = (n) => {
    const suffix = n === 1 ? "" : ` (${n})`;
    return `${`Copie de ${source.name}`.slice(0, 100 - suffix.length)}${suffix}`;
  };
  let n = 1;
  while (taken.has(build(n).toLowerCase())) n++;
  return createSegment(ctx, { name: build(n), description: source.description, definition: source.definition, siteId: source.site_id });
}

// Liste enrichie pour l'écran « Segments » : effectif, joignables, part de l'audience, usages. Un segment cassé est signalé, pas fatal.
function segmentOverview(ctx) {
  checkCtx(ctx);
  const total = ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ?").get(ctx.organizationId).n;
  const used = Object.fromEntries(ctx.db.prepare("SELECT target_id, COUNT(*) n FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND target_type = 'segment' GROUP BY target_id").all(ctx.organizationId).map((r) => [r.target_id, r.n]));
  return listSegments(ctx).map((s) => {
    const base = { id: s.id, site_id: s.site_id, name: s.name, description: s.description, updated_at: s.updated_at, usedBy: used[s.id] ?? 0 };
    try {
      const count = countSegment(ctx, s.definition, { siteId: s.site_id ?? undefined });
      return { ...base, site_id: s.site_id, count, sendable: countSegment(ctx, s.definition, { sendableOnly: true, siteId: s.site_id ?? undefined }), sharePercent: total > 0 ? Math.round((count / total) * 100) : 0, broken: null };
    } catch (error) {
      return { ...base, count: null, sendable: null, sharePercent: 0, broken: error.message };
    }
  });
}

module.exports = { segmentUsage, duplicateSegment, segmentOverview, selectSql, validateDefinition, countSegment, segmentContacts, previewSegment, matches, getSegment, createSegment, updateSegment, deleteSegment, listSegments, evaluateSegment };
