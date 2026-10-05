// Campagnes : création et modification (brouillon seulement). Le lancement est dans dispatch.js.
const { createRepository } = require("../db/repository");
const { MarketingError } = require("../errors");
const { checkCtx, cleanText, audit } = require("../audience/shared");
const { getList } = require("../audience/lists");
const segments = require("../segments");
const templates = require("../templates");

const table = (ctx) => createRepository(ctx.db, ctx.organizationId).table("mk_campaigns");
const flag = (v, fallback) => (v === undefined ? fallback : v ? 1 : 0);
const SUMMARY = "id, name, template_id, target_type, target_id, category, track_clicks, track_opens, ab_variants, ab_winner, ab_decide_at, status, scheduled_at, send_mode, send_plan, started_at, finished_at, error, total_recipients, sent_count, delivered_count, bounced_count, complained_count, failed_count, skipped_count, unsubscribed_count, open_count, unique_open_count, click_count, unique_click_count, created_at, updated_at";

function cleanName(value) {
  const name = cleanText(value, { max: 101, field: "name" });
  if (!name) throw new MarketingError("invalid_field", "Le nom de la campagne est obligatoire.");
  if (name.length > 100) throw new MarketingError("invalid_field", "Le nom de la campagne est trop long (100 caractères au plus).");
  return name;
}

function checkTemplate(ctx, templateId) {
  const template = Number.isInteger(templateId) ? templates.getTemplate(ctx, templateId) : null;
  if (!template) throw new MarketingError("not_found", "Modèle introuvable.");
  if (template.kind !== "marketing") throw new MarketingError("invalid_field", "Une campagne utilise un modèle de type marketing (avec désinscription).");
}

function checkTarget(ctx, type, id) {
  if (type !== "list" && type !== "segment") throw new MarketingError("invalid_field", "La cible d'une campagne est une liste ou un segment.");
  const found = Number.isInteger(id) ? (type === "list" ? getList(ctx, id) : segments.getSegment(ctx, id)) : null;
  if (!found) throw new MarketingError("not_found", type === "list" ? "Liste introuvable." : "Segment introuvable.");
}

function checkCategory(ctx, key) {
  if (key === "" || key === undefined || key === null) return "";
  if (typeof key !== "string" || !ctx.db.prepare("SELECT 1 FROM mk_preference_categories WHERE organization_id = ? AND key = ?").get(ctx.organizationId, key)) {
    throw new MarketingError("not_found", "Catégorie de préférences introuvable.");
  }
  return key;
}

function createCampaign(ctx, input = {}) {
  checkCtx(ctx);
  const name = cleanName(input.name);
  checkTemplate(ctx, input.templateId);
  checkTarget(ctx, input.targetType, input.targetId);
  const category = checkCategory(ctx, input.category);
  const repo = table(ctx);
  if (repo.count({ name }) > 0) throw new MarketingError("duplicate", "Une campagne porte déjà ce nom.");
  const row = repo.insert({
    name, template_id: input.templateId, target_type: input.targetType, target_id: input.targetId, category,
    track_clicks: flag(input.trackClicks, 1), track_opens: flag(input.trackOpens, 0), created_by: ctx.userId ?? null,
  });
  audit(ctx, "campaign.created", "campaign", row.id, {});
  return row;
}

const getCampaign = (ctx, id) => (checkCtx(ctx), Number.isInteger(id) ? table(ctx).get(id) : null);

function requireCampaign(ctx, id) {
  const campaign = getCampaign(ctx, id);
  if (!campaign) throw new MarketingError("not_found", "Campagne introuvable.");
  return campaign;
}

const listCampaigns = (ctx) => (checkCtx(ctx), ctx.db.prepare(`SELECT ${SUMMARY} FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' ORDER BY id DESC`).all(ctx.organizationId));

function updateCampaign(ctx, id, patch = {}) {
  const campaign = requireCampaign(ctx, id);
  if (campaign.status !== "draft") throw new MarketingError("invalid_state", "Seul un brouillon peut être modifié.");
  const fields = {};
  if (patch.name !== undefined) {
    fields.name = cleanName(patch.name);
    if (fields.name.toLowerCase() !== campaign.name.toLowerCase() && table(ctx).count({ name: fields.name }) > 0) throw new MarketingError("duplicate", "Une campagne porte déjà ce nom.");
  }
  if (patch.templateId !== undefined) { checkTemplate(ctx, patch.templateId); fields.template_id = patch.templateId; }
  if (patch.targetType !== undefined || patch.targetId !== undefined) {
    const type = patch.targetType ?? campaign.target_type;
    const targetId = patch.targetId ?? campaign.target_id;
    checkTarget(ctx, type, targetId);
    fields.target_type = type; fields.target_id = targetId;
  }
  if (patch.category !== undefined) fields.category = checkCategory(ctx, patch.category);
  if (patch.trackClicks !== undefined) fields.track_clicks = flag(patch.trackClicks);
  if (patch.trackOpens !== undefined) fields.track_opens = flag(patch.trackOpens);
  const row = table(ctx).update(id, { ...fields, updated_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
  audit(ctx, "campaign.updated", "campaign", id, { fields: Object.keys(patch) });
  return row;
}

function deleteCampaign(ctx, id) {
  checkCtx(ctx);
  const campaign = getCampaign(ctx, id);
  if (!campaign) return false;
  if (!["draft", "cancelled", "failed"].includes(campaign.status)) throw new MarketingError("invalid_state", "Une campagne lancée ou terminée ne se supprime pas (ses statistiques sont conservées).");
  const removed = table(ctx).remove(id);
  if (removed) audit(ctx, "campaign.deleted", "campaign", id, {});
  return removed;
}

// « Copie de X », « Copie de X (2)»… : mêmes réglages, en brouillon vierge (aucun compteur, aucun contenu figé)
function duplicateCampaign(ctx, id) {
  const source = requireCampaign(ctx, id);
  const taken = new Set(ctx.db.prepare("SELECT name FROM mk_campaigns WHERE organization_id = ?").all(ctx.organizationId).map((r) => r.name.toLowerCase()));
  const build = (n) => {
    const suffix = n === 1 ? "" : ` (${n})`;
    return `${`Copie de ${source.name}`.slice(0, 100 - suffix.length)}${suffix}`;
  };
  let n = 1;
  while (taken.has(build(n).toLowerCase())) n++;
  const copy = createCampaign(ctx, {
    name: build(n), templateId: source.template_id, targetType: source.target_type, targetId: source.target_id, category: source.category,
    trackClicks: Boolean(source.track_clicks), trackOpens: Boolean(source.track_opens),
  });
  // Test A/B : les versions (objet, modèle) et les réglages sont repris ; jamais le contenu figé ni le gagnant
  let abVariants = "";
  try {
    const list = source.ab_variants ? JSON.parse(source.ab_variants) : [];
    if (Array.isArray(list) && list.length >= 2) abVariants = JSON.stringify(list.map((v) => ({ subject: v.subject, templateId: Number.isInteger(v.templateId) && v.templateId !== source.template_id ? v.templateId : null })));
  } catch { abVariants = ""; }
  if (abVariants) {
    ctx.db.prepare("UPDATE mk_campaigns SET ab_variants = ?, ab_test_percent = ?, ab_metric = ?, ab_wait_minutes = ? WHERE id = ? AND organization_id = ?")
      .run(abVariants, source.ab_test_percent, source.ab_metric, source.ab_wait_minutes, copy.id, ctx.organizationId);
  }
  audit(ctx, "campaign.duplicated", "campaign", copy.id, { from: id });
  return copy;
}

module.exports = { duplicateCampaign, createCampaign, getCampaign, requireCampaign, listCampaigns, updateCampaign, deleteCampaign, checkTemplate, checkTarget, checkCategory };
