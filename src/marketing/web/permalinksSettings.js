// KOLAKISA CMS → Paramètres → Permaliens : écran dédié (structure des articles, préfixes des archives, normalisation) au-dessus du MOTEUR UNIQUE
// src/services/permalinks. L'écran ne contient aucune règle : la validation, l'aperçu, l'impact et l'enregistrement viennent du moteur.
// Droits : lecture « settings.read » ; écriture « settings.write » ET « settings.sensitive » (une structure change des adresses publiques : SEO).
// Périmètre : le site vient de la barrière d'accès (siteTarget), jamais d'un identifiant envoyé par le navigateur ; un site SANS domaine propre est servi
// sous le domaine principal : il suit les permaliens du site principal (écran en lecture seule).
const engine = require("../../services/settings");
const permalinks = require("../../services/permalinks");
const urls = require("../../services/urls");

const BASE = "/marketing/site-web/parametres";
const siteBase = (req, siteId) => {
  const info = siteId ? urls.siteInfo(siteId) : null;
  if (info && info.base) return info.base.replace(/\/+$/, "");
  try { return require("../../utils/seo").siteBase(req).replace(/\/+$/, ""); } catch { return `${req.protocol}://${req.get("host")}`; }
};
const canWrite = (req) => req.mk.can("settings.write") && req.mk.can("settings.sensitive");
// Un site sans domaine propre est servi sous le domaine principal : ses articles suivent la configuration du principal
const ownsDomain = (siteId) => !siteId || Boolean((urls.siteInfo(siteId) || {}).base);

// Données de l'écran (aussi renvoyées par l'API d'aperçu)
function state(req, t, form = null) {
  const siteId = t.siteId;
  const cfg = permalinks.get(siteId);
  const sample = permalinks.sampleOf(siteId);
  const base = siteBase(req, siteId);
  const preset = permalinks.presetOf(cfg.structure);
  const presets = permalinks.PRESETS.map((p) => ({ key: p.key, label: p.label, help: p.help, structure: p.structure, example: p.structure === permalinks.PLAIN ? `/?p=${sample.post.id}` : permalinks.buildPath(p.structure, sample.post, sample.post.slug) }));
  const tags = permalinks.TAG_NAMES.map((n) => ({ name: n, label: permalinks.TAGS[n].label, example: permalinks.TAGS[n].example, help: permalinks.TAGS[n].help, value: ["category"].includes(n) ? permalinks.categoryPath(sample.post.id) : n === "postname" ? sample.post.slug : permalinks.buildPath(`%${n}%`, sample.post, sample.post.slug).replace(/^\//, "") }));
  const mainSettings = !siteId ? engine.readAll({ siteId: null }, { ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly }) : null;
  return {
    siteId, siteName: t.name, base, preset, current: cfg,
    form: form || { structure: cfg.structure, category_base: cfg.categoryBase, tag_base: cfg.tagBase },
    presets, tags,
    sample: { real: sample.real, title: sample.post.title, slug: sample.post.slug, id: sample.post.id, date: sample.post.published_at || sample.post.created_at, category: permalinks.categoryPath(sample.post.id), author: "auteur" },
    own: ownsDomain(siteId), writable: canWrite(req) && !t.readOnly && ownsDomain(siteId), readOnly: Boolean(t.readOnly),
    normalize: mainSettings ? Boolean(mainSettings.normalize_paths && mainSettings.normalize_paths.value) : null,
    defaults: { category: permalinks.DEFAULT_BASES.category, tag: permalinks.DEFAULT_BASES.tag },
    reserved: ["blog", "p", "cours", "catalogue"],
  };
}

function render(req, res, t, view = {}, extra = {}) {
  const st = state(req, t, extra.form);
  const mainRecap = !st.own ? permalinks.get(null) : null;
  res.status(extra.status || 200).render("marketing/permalinks-settings", {
    title: "Paramètres · Permaliens", active: "parametres/permaliens", permalinksJs: true, ...view, st, mainRecap,
    errors: extra.errors || [], warnings: extra.warnings || [], impact: extra.impact || null, confirmRequired: Boolean(extra.confirmRequired), saved: Boolean(extra.saved),
    json: JSON.stringify({ ...st, form: undefined }),
  });
}

// Aperçu et validation à la volée : même moteur que l'enregistrement, aucune écriture
function preview(req, res, t) {
  const st = state(req, t);
  if (!ownsDomain(t.siteId)) return res.status(409).json({ ok: false, errors: ["Ce site est servi sous le domaine principal : il suit les permaliens du site principal."] });
  const body = req.body || {};
  const p = permalinks.plan(t.siteId, { structure: body.structure, category_base: body.category_base, tag_base: body.tag_base });
  const norm = permalinks.validateStructure(body.structure);
  const sample = permalinks.sampleOf(t.siteId);
  res.set("Cache-Control", "no-store").json({
    ok: p.ok, errors: p.errors || [], warnings: p.warnings || [], impact: p.impact || null,
    structure: norm.ok ? norm.value : null,
    example: norm.ok ? (norm.plain ? `/?p=${sample.post.id}` : permalinks.buildPath(norm.value, sample.post, sample.post.slug)) : null,
    base: st.base,
  });
}

// Enregistrement : tout ou rien, validé et revérifié côté serveur ; relecture de la valeur enregistrée
function save(req, res, t, next) {
  const ctx = { ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly };
  const body = req.body || {};
  if (!canWrite(req)) return res.status(403).render("error", { message: "Vous n'avez pas la permission de modifier les permaliens (réglage sensible)." });
  if (t.readOnly) return res.status(403).render("error", { message: "Ce site est archivé : ses réglages ne se modifient plus." });
  if (!ownsDomain(t.siteId)) return res.status(409).render("error", { message: "Ce site est servi sous le domaine principal : ses articles suivent les permaliens du site principal." });
  const preset = permalinks.PRESETS.find((p) => p.key === body.preset);
  const structure = preset ? preset.structure : body.structure;
  const input = { structure, category_base: body.category_base, tag_base: body.tag_base };
  const form = { structure: String(structure ?? ""), category_base: String(body.category_base ?? ""), tag_base: String(body.tag_base ?? "") };
  const wantsNormalize = !t.siteId && "_b_normalize_paths" in body ? body.normalize_paths === "1" : null;
  let r;
  try { r = permalinks.save(t.siteId, input, { ctx, confirm: body.confirm === "1", actor: req }); } catch (e) { return next(e); }
  const view = req.permalinksHead ? { settingsHead: req.permalinksHead } : { frame: true };
  if (!r.ok && r.confirmRequired) return render(req, res, t, view, { status: 409, form, confirmRequired: true, impact: r.impact, warnings: r.warnings });
  if (!r.ok) return render(req, res, t, view, { status: 422, form, errors: r.errors, warnings: r.warnings, impact: r.impact });
  let normalized = null;
  if (wantsNormalize !== null) {
    const u = engine.update({ siteId: null }, { normalize_paths: wantsNormalize }, ctx, { confirm: true, actor: req });
    if (!u.ok) return render(req, res, t, view, { status: 422, form, errors: u.errors || ["Normalisation : réglage refusé."] });
    normalized = u.changed && u.changed.length > 0;
  }
  req.session.mkFlash = { type: "ok", text: r.saved || normalized ? `Permaliens enregistrés${r.impact && r.impact.changed ? ` : ${r.impact.changed} adresse${r.impact.changed > 1 ? "s" : ""} d'article${r.impact.changed > 1 ? "s" : ""} mise${r.impact.changed > 1 ? "s" : ""} à jour, anciennes adresses redirigées (301).` : "."}` : "Aucune modification à enregistrer.", noReopen: true };
  return { redirect: true };
}

module.exports = { render, save, preview, state, BASE };
