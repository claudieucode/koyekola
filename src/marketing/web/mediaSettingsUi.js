// KOLAKISA CMS → Paramètres → Médias : écran dédié (tailles des images, téléversement, limites) au-dessus de services/mediaSettings et du moteur média
// (media/variants.js, media/index.js). L'écran ne traite aucune image et ne contient aucune règle : validation et enregistrement viennent du service.
// Droits : lecture « settings.read », écriture « settings.write ». Périmètre : le site vient de la barrière d'accès (siteTarget), jamais d'un identifiant du navigateur.
// Les limites d'envoi (Mo) sont communes à la plateforme : modifiables depuis le site principal par l'équipe, en lecture seule dans un site.
const engine = require("../../services/settings");
const mediaSettings = require("../../services/mediaSettings");
const variants = require("../media/variants");

const LIMIT_KEYS = ["media_max_image_mb", "media_max_document_mb", "media_max_audio_mb", "media_max_video_mb"];
const LIMIT_LABELS = { media_max_image_mb: "Images", media_max_document_mb: "Documents", media_max_audio_mb: "Audio", media_max_video_mb: "Vidéo" };

function state(req, t, form = null) {
  const ctx = { ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly };
  const cfg = mediaSettings.get(t.siteId);
  const platform = engine.readAll({ siteId: null }, { ...ctx, orgLevel: true });
  const limits = LIMIT_KEYS.filter((k) => platform[k]).map((k) => ({ key: k, label: LIMIT_LABELS[k], value: platform[k].value, max: (engine.defsFor({ siteId: null }).find((d) => d.key === k) || {}).max }));
  return {
    siteId: t.siteId, siteName: t.name, config: cfg, defaults: mediaSettings.DEFAULTS, min: mediaSettings.MIN, maxPx: mediaSettings.MAX,
    form: form || { thumb_w: cfg.thumb_w, thumb_h: cfg.thumb_h, thumb_crop: cfg.thumb_crop, medium_w: cfg.medium_w, medium_h: cfg.medium_h, large_w: cfg.large_w, large_h: cfg.large_h, organize: cfg.organize },
    limits, limitsEditable: !t.siteId && !req.mk.siteOnly && req.mk.can("settings.write"),
    engine: { available: variants.available() },
    writable: req.mk.can("settings.write") && !t.readOnly, readOnly: Boolean(t.readOnly),
  };
}

function render(req, res, t, view = {}, extra = {}) {
  const st = state(req, t, extra.form);
  res.status(extra.status || 200).render("marketing/media-settings", {
    title: "Paramètres · Médias", active: "parametres/medias", mediaSettingsJs: true, ...view, st, errors: extra.errors || [],
    json: JSON.stringify({ ...st, form: undefined }),
  });
}

// Enregistrement : tout ou rien. Les tailles passent par le service (validation de l'ensemble) ; les limites (principal seulement) par le moteur de réglages.
function save(req, res, t, next) {
  const ctx = { ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly };
  const body = req.body || {};
  if (!req.mk.can("settings.write")) return res.status(403).render("error", { message: "Vous n'avez pas la permission de modifier les réglages des médias." });
  if (t.readOnly) return res.status(403).render("error", { message: "Ce site est archivé : ses réglages ne se modifient plus." });
  const view = req.mediaHead ? { settingsHead: req.mediaHead } : { frame: true };
  const input = { thumb_w: body.thumb_w, thumb_h: body.thumb_h, thumb_crop: body.thumb_crop === "1", medium_w: body.medium_w, medium_h: body.medium_h, large_w: body.large_w, large_h: body.large_h, organize: body.organize === "1" };
  const form = { ...input, thumb_crop: input.thumb_crop, organize: input.organize };
  const v = mediaSettings.validate(input);
  if (!v.ok) return render(req, res, t, view, { status: 422, form, errors: v.errors });
  // Limites d'envoi (communes, site principal) : validées AVANT toute écriture pour que l'enregistrement reste « tout ou rien »
  const limitsPatch = {};
  if (!t.siteId && !req.mk.siteOnly) for (const k of LIMIT_KEYS) if (k in body && String(body[k]).trim() !== "") limitsPatch[k] = body[k];
  let changedSizes = false, limitsResult = null;
  try {
    if (Object.keys(limitsPatch).length) {
      limitsResult = engine.update({ siteId: null }, limitsPatch, ctx, { actor: req });
      if (!limitsResult.ok) return render(req, res, t, view, { status: 422, form, errors: limitsResult.errors || ["Limites : valeur refusée."] });
    }
    const r = mediaSettings.save(t.siteId, input, ctx);
    if (!r.ok) return render(req, res, t, view, { status: 422, form, errors: r.errors });
    changedSizes = r.changed;
    if (changedSizes) { try { require("../../services/auditLog").record(req, { action: "settings.media", resourceType: "settings", summary: `Réglages des médias modifiés (${t.siteId ? `site n° ${t.siteId}` : "site principal"})`, details: { site: t.siteId || null, config: r.config } }); } catch { /* journal indisponible */ } }
  } catch (e) { return next(e); }
  const changed = changedSizes || (limitsResult && limitsResult.changed && limitsResult.changed.length);
  req.session.mkFlash = { type: "ok", text: changed ? "Réglages des médias enregistrés. Les nouvelles dimensions s'appliquent aux prochaines demandes d'image ; les versions déjà fabriquées ne changent pas." : "Aucune modification à enregistrer.", noReopen: true };
  return { redirect: true };
}

module.exports = { render, save, state, LIMIT_KEYS };
