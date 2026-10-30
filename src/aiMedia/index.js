// AI Media Generator & Asset Manager (programme 21.7) — ORCHESTRATION. Réutilise : la médiathèque native (saveUpload : type réel, taille, empreinte, isolation par site ; getMedia ; mediaUsage ; updateMedia),
// la couche réseau et les clés des connecteurs de l'AI Core, le journal/quotas de l'AI Core (usage.admit/finish, module « media »), la configuration de l'AI Core (IA activée pour le site, fournisseurs autorisés),
// le moteur de pages (requirePage / saveDraft) et les résolutions responsives de la médiathèque (variants). Aucun second stockage, aucune seconde médiathèque.
// Règles : jamais d'appel depuis le navigateur ; jamais de dépense réelle sans (1) IA activée pour le site et fournisseur autorisé dans l'AI Core, (2) clé configurée, (3) autorisation de dépense de l'organisation ;
// jamais de remplacement d'une image existante sans action explicite ; une estimation n'est jamais présentée comme un coût réel (le coût réel reste « inconnu » : aucun fournisseur ne le renvoie).
const crypto = require("node:crypto");
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const store = require("./store");
const providers = require("./providers");
const planner = require("./planner");

const bad = (m) => new MarketingError("invalid_field", m);
const pagesLib = () => require("../marketing/pages");
const media = () => require("../marketing/media");
const MODULE = "media", TASK = "image_generation", SPEND_KEY = "aimedia.spend_authorized";
const TIMEOUT_MS = 120000, RUNNING_STALE_MS = 10 * 60000, QUEUED_STALE_MS = 30 * 60000, MAX_NEEDS = 60, MAX_VARIANTS = 4;
const controllers = new Map(); // tâche en cours → AbortController (annulation)

function siteOf(ctx, siteId) {
  store.ensureSchema(ctx.db);
  if (!Number.isInteger(siteId) || siteId < 1) throw new MarketingError("not_found", "Site introuvable.");
  if (ctx.siteScope !== undefined && ctx.siteScope !== null && ctx.siteScope !== siteId) throw new MarketingError("not_found", "Site introuvable.");
  const site = pagesLib().getSite(ctx, siteId);
  if (!site || site.deleted_at) throw new MarketingError("not_found", "Site introuvable.");
  if (site.status !== "active") throw bad("Ce site est archivé : restaurez-le avant de gérer ses médias.");
  return site;
}
// Médiathèque DE CE SITE pour les lectures (jamais « tous les sites »)
const mctx = (ctx, siteId) => media().forSite(ctx, siteId);
const now = (opts) => (opts && typeof opts.now === "function" ? opts.now() : Date.now());
const iso = (ms) => new Date(ms).toISOString().replace("T", " ").slice(0, 19);

// ── contexte du site (type, secteur, direction artistique appliquée) ───────────────────────────────────────────────────────────
function contextOf(ctx, siteId) {
  const site = siteOf(ctx, siteId);
  const out = { siteName: site.name, description: site.description || "", category: site.site_type || "", sector: "", mood: "corporate", hue: 215, imagery: "moderee" };
  try {
    require("../siteWizard").ensureSchema(ctx.db);
    const w = ctx.db.prepare("SELECT category, data FROM mk_site_wizard WHERE site_id = ? AND organization_id = ?").get(siteId, ctx.organizationId);
    if (w) { out.category = w.category || out.category; out.sector = (store.json(w.data, {}).infos || {}).sector || ""; }
  } catch { /* assistant absent */ }
  try { // direction artistique appliquée (21.5) : ambiance, teinte
    const r = ctx.db.prepare("SELECT proposals, chosen FROM mk_design_runs WHERE organization_id = ? AND site_id = ? AND status = 'applied' ORDER BY id DESC LIMIT 1").get(ctx.organizationId, siteId);
    const p = r && store.json(r.proposals, []).find((x) => x.key === r.chosen);
    if (p && p.design && p.design.direction) { out.mood = p.design.direction.mood; out.hue = p.design.direction.hue; out.imagery = p.design.direction.imagery || out.imagery; }
  } catch { /* pas de direction appliquée */ }
  return out;
}

// ── besoins visuels ───────────────────────────────────────────────────────────────────────────────────────────────────────────
function plan(ctx, siteId, { pageIds = null } = {}) {
  const site = siteOf(ctx, siteId);
  const context = contextOf(ctx, siteId);
  const rows = pagesLib().sitePages(ctx, siteId).filter((p) => !Array.isArray(pageIds) || pageIds.includes(p.id)).slice(0, 40);
  const pages = rows.map((r) => ({ id: r.id, name: r.name, sections: pagesLib().requirePage(ctx, r.id).working.sections || [] }));
  const needs = planner.plan(context, pages).slice(0, MAX_NEEDS);
  const up = ctx.db.prepare(`INSERT INTO mk_aimedia_needs (organization_id, site_id, need_key, page_id, page_name, section_id, widget, slot, description, prompt, style, format, ratio, width, height, priority, status, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (site_id, need_key) DO UPDATE SET page_name = excluded.page_name, description = excluded.description, priority = excluded.priority, updated_at = datetime('now'),
    prompt = CASE WHEN mk_aimedia_needs.status IN ('needed', 'no_slot') THEN excluded.prompt ELSE mk_aimedia_needs.prompt END`);
  transaction(ctx.db, () => { for (const n of needs) up.run(ctx.organizationId, site.id, n.key, n.pageId, n.pageName, n.sectionId, n.widget, n.slot, n.description, n.prompt, n.style, n.format, n.ratio, n.width, n.height, n.priority, n.status, n.reason); });
  // Un emplacement désormais rempli (image posée à la main dans l'éditeur) n'est plus un besoin
  for (const r of ctx.db.prepare("SELECT * FROM mk_aimedia_needs WHERE site_id = ? AND status IN ('needed', 'generated')").all(siteId)) {
    if (r.page_id && !needs.some((n) => n.key === r.need_key) && !ctx.db.prepare("SELECT 1 FROM mk_aimedia_slots WHERE site_id = ? AND page_id = ? AND section_id = ? AND slot = ?").get(siteId, r.page_id, r.section_id, r.slot)) {
      ctx.db.prepare("UPDATE mk_aimedia_needs SET status = 'skipped', reason = ?, updated_at = datetime('now') WHERE id = ?").run("Emplacement déjà pourvu (image choisie dans l'éditeur).", r.id);
    }
  }
  return listNeeds(ctx, siteId);
}
const shapeNeed = (r) => ({ id: r.id, key: r.need_key, pageId: r.page_id, pageName: r.page_name, sectionId: r.section_id, widget: r.widget, slot: r.slot, mediaType: "image", description: r.description, prompt: r.prompt, style: r.style, format: r.format, ratio: r.ratio, width: r.width, height: r.height, priority: r.priority, status: r.status, reason: r.reason, mediaId: r.media_id });
function listNeeds(ctx, siteId) { siteOf(ctx, siteId); return ctx.db.prepare("SELECT * FROM mk_aimedia_needs WHERE organization_id = ? AND site_id = ? ORDER BY priority, id").all(ctx.organizationId, siteId).map(shapeNeed); }
function getNeed(ctx, siteId, key) {
  const r = ctx.db.prepare("SELECT * FROM mk_aimedia_needs WHERE organization_id = ? AND site_id = ? AND need_key = ?").get(ctx.organizationId, siteId, String(key));
  if (!r) throw new MarketingError("not_found", "Besoin visuel introuvable.");
  return shapeNeed(r);
}
function editNeed(ctx, siteId, key, { prompt, ratio } = {}) {
  siteOf(ctx, siteId); const n = getNeed(ctx, siteId, key);
  if (n.status === "no_slot") throw bad("Ce besoin n'a pas d'emplacement natif : rien à modifier.");
  const sets = [], args = [];
  if (prompt !== undefined) { const p = String(prompt).replace(/\s+/g, " ").trim(); if (p.length < 10 || p.length > 1500) throw bad("La consigne doit faire entre 10 et 1 500 caractères."); sets.push("prompt = ?"); args.push(p); }
  if (ratio !== undefined) { if (!providers.RATIOS[ratio]) throw bad("Format inconnu (1:1, 3:2 ou 2:3)."); const r = providers.RATIOS[ratio]; sets.push("ratio = ?", "width = ?", "height = ?"); args.push(ratio, r.width, r.height); }
  if (!sets.length) return n;
  ctx.db.prepare(`UPDATE mk_aimedia_needs SET ${sets.join(", ")}, updated_at = datetime('now') WHERE site_id = ? AND need_key = ?`).run(...args, siteId, n.key);
  return getNeed(ctx, siteId, key);
}

// ── fournisseurs, autorisation de dépense, coût ───────────────────────────────────────────────────────────────────────────────
const spendAuthorized = (ctx) => { try { return String(ctx.settings.get(ctx.organizationId, SPEND_KEY, "0")) === "1"; } catch { return false; } };
function setSpendAuthorized(ctx, on) {
  if (ctx.siteScope !== undefined && ctx.siteScope !== null) throw new MarketingError("forbidden", "L'autorisation de dépense est réservée à l'équipe de l'organisation.");
  ctx.settings.set(ctx.organizationId, SPEND_KEY, on ? "1" : "0");
  return spendAuthorized(ctx);
}
function providerStatus(ctx, siteId, opts = {}) {
  const core = coreOf(opts), resolve = opts.credentials || providers.defaultCredentials;
  const eff = core ? core.config.effective(ctx.organizationId, siteId) : { enabled: false, allowedProviders: [] };
  return providers.list().map((p) => {
    const real = p.kind === "real";
    const configured = real ? p.configured(ctx, { siteId }, resolve) : true;
    const allowed = !real || (eff.enabled && eff.allowedProviders.includes(p.id));
    const spend = !real || spendAuthorized(ctx);
    const usable = configured && allowed && spend;
    const why = !real ? "" : !configured ? "Aucune clé configurée pour ce site (Réglages → Connecteurs)." : !eff.enabled ? "L'IA n'est pas activée pour ce site dans l'AI Core." : !allowed ? "Fournisseur non autorisé dans l'AI Core." : !spend ? "Dépense non autorisée par l'organisation." : "";
    return { id: p.id, label: p.label, kind: p.kind, integration: p.integration, models: p.models, configured, usable, why };
  }).concat(providers.NOT_INTEGRATED.map((p) => ({ id: p.id, label: p.label, kind: "real", integration: "Non intégré.", models: [], configured: false, usable: false, why: p.reason })));
}
function estimate(ctx, siteId, { needKeys, provider = "demo", model = "", variants = 1 } = {}) {
  siteOf(ctx, siteId);
  const prov = providers.get(provider); if (!prov) throw bad("Fournisseur non intégré ou inconnu.");
  const m = prov.models.find((x) => x.id === (model || prov.models[0].id)); if (!m) throw bad("Modèle inconnu pour ce fournisseur.");
  const n = Math.min(MAX_VARIANTS, Math.max(1, Number(variants) || 1)), count = [].concat(needKeys || []).length;
  const per = m.price.microUsd;
  return { provider, model: m.id, images: count * n, perImageMicroUsd: per, totalMicroUsd: per === null ? null : per * count * n, kind: per === null ? "inconnu" : "estimé", priceStatus: m.price.status, note: per === null ? "Tarif non vérifié : coût non estimable. Aucun coût réel n'est jamais affiché comme certain." : "Estimation (jamais un coût réel)." };
}
function coreOf(opts = {}) { if (opts.core) return opts.core; try { return require("../ai").getAiCore(); } catch { return null; } }

// ── génération (tâches asynchrones, idempotentes, annulables) ──────────────────────────────────────────────────────────────────
function cleanStale(ctx, siteId, opts) {
  const t = now(opts);
  ctx.db.prepare("UPDATE mk_aimedia_tasks SET status = 'failed', error_code = 'timeout', error = 'Tâche abandonnée (délai dépassé).', finished_at = ? WHERE site_id = ? AND status = 'running' AND started_at < ?").run(iso(t), siteId, iso(t - RUNNING_STALE_MS));
  ctx.db.prepare("UPDATE mk_aimedia_tasks SET status = 'failed', error_code = 'expired', error = 'Tâche expirée avant d''avoir démarré.', finished_at = ? WHERE site_id = ? AND status = 'queued' AND created_at < ?").run(iso(t), siteId, iso(t - QUEUED_STALE_MS));
}
const shapeTask = (r) => ({ id: r.id, needKey: r.need_key, provider: r.provider, model: r.model, ratio: r.ratio, variants: r.variants, status: r.status, attempts: r.attempts, errorCode: r.error_code, error: r.error, mediaIds: store.json(r.media_ids, []), estCostMicro: r.est_cost_micro, realCostMicro: r.real_cost_micro, durationMs: r.duration_ms, createdAt: r.created_at, finishedAt: r.finished_at, parentId: r.parent_id });
function getTask(ctx, siteId, taskId) {
  siteOf(ctx, siteId);
  const r = ctx.db.prepare("SELECT * FROM mk_aimedia_tasks WHERE id = ? AND organization_id = ? AND site_id = ?").get(Number(taskId), ctx.organizationId, siteId);
  if (!r) throw new MarketingError("not_found", "Tâche introuvable.");
  return shapeTask(r);
}
function listTasks(ctx, siteId, opts) { siteOf(ctx, siteId); store.ensureSchema(ctx.db); cleanStale(ctx, siteId, opts); return ctx.db.prepare("SELECT * FROM mk_aimedia_tasks WHERE organization_id = ? AND site_id = ? ORDER BY id DESC LIMIT 60").all(ctx.organizationId, siteId).map(shapeTask); }

// Crée les tâches (une par besoin). Contrôles AVANT toute création : fournisseur utilisable, modèle, format, variantes, consigne. Idempotence : même besoin + même consigne + même réglage déjà actif ou réussi → la tâche existante est renvoyée.
function start(ctx, siteId, input = {}, opts = {}) {
  siteOf(ctx, siteId);
  const keys = [...new Set([].concat(input.needKeys || []).map(String))].slice(0, 12);
  if (!keys.length) throw bad("Choisissez au moins un besoin visuel.");
  const prov = providers.get(input.provider || "demo"); if (!prov) throw bad("Ce fournisseur n'est pas intégré à Kolakisa.");
  const status = providerStatus(ctx, siteId, opts).find((p) => p.id === prov.id);
  if (!status.usable) throw new MarketingError("forbidden", `Fournisseur « ${prov.label} » indisponible : ${status.why || "non utilisable"}`);
  const model = prov.models.find((m) => m.id === (input.model || prov.models[0].id)); if (!model) throw bad("Modèle inconnu pour ce fournisseur.");
  const variants = Math.min(Math.min(MAX_VARIANTS, model.maxVariants), Math.max(1, Number(input.variants) || 1));
  const created = [];
  for (const key of keys) {
    const need = getNeed(ctx, siteId, key);
    if (need.status === "no_slot") throw bad("Ce besoin n'a pas d'emplacement natif : il ne peut pas être généré.");
    const ratio = input.ratio && providers.RATIOS[input.ratio] ? input.ratio : need.ratio;
    if (!model.ratios.includes(ratio)) throw bad("Format non pris en charge par ce modèle.");
    const prompt = String(input.prompt && keys.length === 1 ? input.prompt : need.prompt).replace(/\s+/g, " ").trim();
    if (prompt.length < 10 || prompt.length > 1500) throw bad("La consigne doit faire entre 10 et 1 500 caractères.");
    const nonce = input.regenerate ? `|r${Date.now()}` : "";
    const idem = `aimedia:${key}:${crypto.createHash("sha1").update(`${prov.id}|${model.id}|${ratio}|${variants}|${prompt}${nonce}`).digest("hex").slice(0, 16)}`;
    const dup = ctx.db.prepare("SELECT * FROM mk_aimedia_tasks WHERE site_id = ? AND idempotency_key = ?").get(siteId, idem);
    if (dup && ["queued", "running", "succeeded"].includes(dup.status)) { created.push({ ...shapeTask(dup), duplicate: true }); continue; }
    if (dup) ctx.db.prepare("UPDATE mk_aimedia_tasks SET idempotency_key = ? WHERE id = ?").run(`${idem}|old${dup.id}`, dup.id);
    const est = model.price.microUsd === null ? null : model.price.microUsd * variants;
    const id = Number(ctx.db.prepare("INSERT INTO mk_aimedia_tasks (organization_id, site_id, user_id, need_key, provider, model, ratio, variants, prompt, idempotency_key, est_cost_micro, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, siteId, ctx.userId ?? null, key, prov.id, model.id, ratio, variants, prompt, idem, est, input.parentId ?? null).lastInsertRowid);
    ctx.db.prepare("UPDATE mk_aimedia_needs SET status = 'queued', updated_at = datetime('now') WHERE site_id = ? AND need_key = ? AND status IN ('needed', 'generated', 'skipped')").run(siteId, key);
    created.push(getTask(ctx, siteId, id));
  }
  // Exécution asynchrone : la requête HTTP rend la main tout de suite ; l'état se lit par getTask / listTasks
  for (const t of created) if (!t.duplicate && t.status === "queued") {
    if (opts.sync) continue;
    setImmediate(() => { run(ctx, siteId, t.id, opts).catch(() => {}); });
  }
  return created;
}
async function startSync(ctx, siteId, input, opts = {}) {
  const tasks = start(ctx, siteId, input, { ...opts, sync: true });
  for (const t of tasks) if (!t.duplicate && t.status === "queued") await run(ctx, siteId, t.id, opts);
  return tasks.map((t) => getTask(ctx, siteId, t.id));
}
const withTimeout = (p, ms, onTimeout) => new Promise((resolve, reject) => { const t = setTimeout(() => { onTimeout(); reject(new providers.MediaError("timeout", "Le fournisseur n'a pas répondu à temps.", { retryable: true, billed: true })); }, ms); p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); }); });

async function run(ctx, siteId, taskId, opts = {}) {
  const row = ctx.db.prepare("SELECT * FROM mk_aimedia_tasks WHERE id = ? AND organization_id = ? AND site_id = ?").get(taskId, ctx.organizationId, siteId);
  if (!row || row.status !== "queued") return row ? shapeTask(row) : null;
  const prov = providers.get(row.provider), model = prov.models.find((m) => m.id === row.model);
  const core = coreOf(opts), started = Date.now(), reqId = crypto.randomUUID();
  const fail = (code, message, billed = false, retryable = false) => {
    ctx.db.prepare("UPDATE mk_aimedia_tasks SET status = ?, error_code = ?, error = ?, duration_ms = ?, finished_at = ? WHERE id = ?").run(code === "canceled" ? "canceled" : "failed", code, String(message).slice(0, 300), Date.now() - started, iso(Date.now()), row.id);
    if (row.usage_row && core) { try { core.usage.finish(row.usage_row, { status: "failed", errorCode: code, durationMs: Date.now() - started, counted: billed ? 1 : 0, costKind: "unknown" }); } catch { /* le journal ne bloque pas */ } }
    ctx.db.prepare("UPDATE mk_aimedia_needs SET status = 'needed', updated_at = datetime('now') WHERE site_id = ? AND need_key = ? AND status = 'queued'").run(siteId, row.need_key);
    store.history(ctx, { siteId, op: "generate", provider: row.provider, model: row.model, prompt: row.prompt, params: { ratio: row.ratio, variants: row.variants }, estCost: row.est_cost_micro, durationMs: Date.now() - started, status: code === "canceled" ? "canceled" : "failed", error: message, needKey: row.need_key, taskId: row.id });
    return { retryable, code };
  };
  ctx.db.prepare("UPDATE mk_aimedia_tasks SET status = 'running', attempts = attempts + 1, started_at = ? WHERE id = ?").run(iso(Date.now()), row.id);
  // Quotas et journal de l'AI Core (module « media ») : admission AVANT l'appel ; un quota dépassé ne contacte jamais le fournisseur
  if (core) {
    try {
      const reserve = model.price.microUsd === null ? null : model.price.microUsd * row.variants;
      const usageRow = core.usage.admit({ requestId: reqId, idempotencyKey: `aimedia-task-${row.id}-${row.attempts + 1}`, organizationId: ctx.organizationId, siteId, userId: ctx.userId ?? null, module: MODULE, task: TASK, provider: row.provider, model: row.model, reserveMicroUsd: reserve, priceStatus: model.price.status });
      ctx.db.prepare("UPDATE mk_aimedia_tasks SET usage_row = ? WHERE id = ?").run(usageRow, row.id); row.usage_row = usageRow;
    } catch (e) { fail(e.code || "quota_exceeded", e.message, false); return getTask(ctx, siteId, row.id); }
  }
  const ac = new AbortController(); controllers.set(row.id, ac);
  try {
    let creds = null;
    if (prov.kind === "real") creds = (opts.credentials || providers.defaultCredentials)(ctx, { siteId }, prov);
    const http = opts.http || require("../services/connectors/http");
    const out = await withTimeout(prov.generate({ prompt: row.prompt, ratio: row.ratio, n: row.variants, model: row.model, seed: row.need_key }, { http, credentials: creds, signal: ac.signal }), opts.timeoutMs || TIMEOUT_MS, () => ac.abort());
    if (ac.signal.aborted && ctx.db.prepare("SELECT status FROM mk_aimedia_tasks WHERE id = ?").get(row.id).status === "canceled") return getTask(ctx, siteId, row.id);
    const saved = [];
    for (const [i, img] of out.images.entries()) {
      const info = media().sniff(img.buffer, "ia.png");
      if (!info || info.type !== "image") throw new providers.MediaError("invalid_response", "Le fournisseur n'a pas renvoyé une image valide.", { billed: true });
      const m = media().saveUpload(mctx(ctx, siteId), { buffer: img.buffer, originalName: `ia-${row.need_key.replace(/[^a-z0-9]+/gi, "-").slice(0, 30)}-${row.id}-${i + 1}.png`, declaredType: img.mime, allow: ["image"], siteId });
      const need = getNeed(ctx, siteId, row.need_key);
      const aiGen = prov.kind === "real" ? 1 : 0;
      ctx.db.prepare(`INSERT INTO mk_aimedia_meta (media_id, organization_id, site_id, source, provider, model, prompt, ai_generated, license, license_note, author, description, task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(m.id, ctx.organizationId, siteId, aiGen ? "ai" : "demo", prov.id, row.model, row.prompt, aiGen, aiGen ? "Généré par IA — conditions du fournisseur à vérifier" : "Visuel d'attente (démonstration)", aiGen ? "Les droits d'usage dépendent des conditions du fournisseur : non vérifiés par Kolakisa." : "Aucune image réelle : à remplacer.", `${prov.label}`, planner.altFor(need), row.id);
      saved.push(m.id);
    }
    const dur = Date.now() - started;
    ctx.db.prepare("UPDATE mk_aimedia_tasks SET status = 'succeeded', media_ids = ?, duration_ms = ?, finished_at = ?, real_cost_micro = NULL WHERE id = ?").run(JSON.stringify(saved), dur, iso(Date.now()), row.id);
    if (core && row.usage_row) core.usage.finish(row.usage_row, { status: "succeeded", durationMs: dur, costMicroUsd: model.price.microUsd === null ? null : model.price.microUsd * row.variants, costKind: model.price.microUsd === null ? "unknown" : "estimated", counted: 1 });
    ctx.db.prepare("UPDATE mk_aimedia_needs SET status = 'generated', updated_at = datetime('now') WHERE site_id = ? AND need_key = ? AND status = 'queued'").run(siteId, row.need_key);
    store.history(ctx, { siteId, op: "generate", provider: row.provider, model: row.model, prompt: row.prompt, params: { ratio: row.ratio, variants: row.variants }, result: `${saved.length} image(s)`, estCost: row.est_cost_micro, durationMs: dur, status: "ok", mediaId: saved[0], needKey: row.need_key, taskId: row.id });
  } catch (e) {
    const code = e && e.code ? e.code : "provider_error";
    const canceled = ac.signal.aborted && ctx.db.prepare("SELECT status FROM mk_aimedia_tasks WHERE id = ?").get(row.id).status === "canceled";
    fail(canceled ? "canceled" : code, e instanceof providers.MediaError || e instanceof MarketingError ? e.message : "Erreur pendant la génération.", Boolean(e && e.possiblyBilled), Boolean(e && e.retryable));
  } finally { controllers.delete(row.id); }
  return getTask(ctx, siteId, row.id);
}
function cancel(ctx, siteId, taskId) {
  const t = getTask(ctx, siteId, taskId);
  if (!["queued", "running"].includes(t.status)) throw bad("Cette tâche est déjà terminée.");
  ctx.db.prepare("UPDATE mk_aimedia_tasks SET status = 'canceled', error_code = 'canceled', error = 'Annulée par l''utilisateur.', finished_at = ? WHERE id = ?").run(iso(Date.now()), t.id);
  const ac = controllers.get(t.id); if (ac) ac.abort();
  ctx.db.prepare("UPDATE mk_aimedia_needs SET status = 'needed', updated_at = datetime('now') WHERE site_id = ? AND need_key = ? AND status = 'queued'").run(siteId, t.needKey);
  store.history(ctx, { siteId, op: "cancel", status: "canceled", needKey: t.needKey, taskId: t.id, provider: t.provider, model: t.model });
  return getTask(ctx, siteId, t.id);
}
// Nouvelle tentative CONTRÔLÉE : seulement après un échec, jamais après un succès ni une annulation silencieuse ; 3 tentatives par besoin et réglage au plus
function retry(ctx, siteId, taskId, opts = {}) {
  const t = getTask(ctx, siteId, taskId);
  if (t.status !== "failed") throw bad("Seule une tâche échouée peut être relancée.");
  const n = ctx.db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks WHERE site_id = ? AND need_key = ? AND (id = ? OR parent_id = ?)").get(siteId, t.needKey, t.parentId || t.id, t.parentId || t.id).n;
  if (n >= 3) throw bad("Trois tentatives ont déjà été faites pour ce besoin : modifiez la consigne ou le fournisseur.");
  const r = ctx.db.prepare("SELECT prompt FROM mk_aimedia_tasks WHERE id = ?").get(t.id);
  return start(ctx, siteId, { needKeys: [t.needKey], provider: t.provider, model: t.model, ratio: t.ratio, variants: t.variants, prompt: r.prompt, regenerate: true, parentId: t.parentId || t.id }, opts);
}

// ── affectation d'un média à un emplacement natif ─────────────────────────────────────────────────────────────────────────────
const extraSectionId = (key) => `ai${crypto.createHash("sha1").update(key).digest("hex").slice(0, 10)}`;
function visibleMedia(ctx, siteId, mediaId) {
  const row = ctx.db.prepare("SELECT id, path, name, mime, width, height, alt, type, kind, reach, site_id FROM mk_media WHERE id = ? AND organization_id = ? AND deleted_at IS NULL").get(Number(mediaId), ctx.organizationId);
  const ref = media().referenceSql(mctx(ctx, siteId));
  const ok = row && ctx.db.prepare(`SELECT 1 FROM mk_media WHERE id = ? AND ${ref.sql}`).get(row.id, ...ref.params);
  if (!row || !ok) throw new MarketingError("not_found", "Média introuvable pour ce site.");
  if (row.type !== "image") throw bad("Seule une image peut être placée dans cet emplacement.");
  return row;
}
// confirmManual : remplacer une image que la personne a posée elle-même (ni générée ni affectée ici) exige une seconde confirmation explicite
function assign(ctx, siteId, { needKey, mediaId, alt = null, replace = false, confirmManual = false, op = null } = {}) {
  siteOf(ctx, siteId);
  const need = getNeed(ctx, siteId, needKey);
  if (need.status === "no_slot") throw bad("Ce besoin n'a pas d'emplacement natif.");
  const m = visibleMedia(ctx, siteId, mediaId);
  const meta = ctx.db.prepare("SELECT * FROM mk_aimedia_meta WHERE media_id = ?").get(m.id);
  const text = alt === null ? (m.alt || (meta && meta.description) || planner.altFor(need)) : String(alt).replace(/\s+/g, " ").trim().slice(0, 200);
  const page = pagesLib().requirePage(ctx, need.pageId);
  if (page.site_id !== siteId || page.archived_at) throw new MarketingError("not_found", "Page introuvable dans ce site.");
  const working = JSON.parse(JSON.stringify(page.working));
  const slotRow = ctx.db.prepare("SELECT * FROM mk_aimedia_slots WHERE page_id = ? AND section_id = ? AND slot = ?").get(need.pageId, need.sectionId, need.slot);
  let previousPath = "", previousMediaId = null, operation = "assign";
  if (need.widget === "hero") {
    const hero = working.sections.find((s) => s.id === need.sectionId && s.type === "hero");
    if (!hero) throw bad("Le bandeau visé n'existe plus dans cette page : replanifiez les besoins.");
    previousPath = hero.image || "";
    if (previousPath) {
      if (replace !== true) throw new MarketingError("conflict", "Cet emplacement contient déjà une image : elle n'est jamais remplacée automatiquement. Utilisez « Remplacer » pour le faire explicitement.");
      const ours = slotRow && slotRow.media_path === previousPath;
      if (!ours && confirmManual !== true) throw new MarketingError("conflict", "Cette image a été choisie manuellement dans l'éditeur : confirmez explicitement son remplacement.");
      previousMediaId = (ctx.db.prepare("SELECT id FROM mk_media WHERE organization_id = ? AND path = ?").get(ctx.organizationId, previousPath) || {}).id ?? null; operation = "replace";
    }
    hero.image = m.path; hero.imageAlt = text;
  } else {
    const sid = extraSectionId(need.key);
    let sec = working.sections.find((s) => s.id === sid);
    if (sec) {
      previousPath = sec.src || "";
      if (replace !== true) throw new MarketingError("conflict", "Cet emplacement contient déjà une image : elle n'est jamais remplacée automatiquement.");
      const ours = slotRow && slotRow.media_path === previousPath;
      if (!ours && confirmManual !== true) throw new MarketingError("conflict", "Cette image a été modifiée manuellement : confirmez explicitement son remplacement.");
      previousMediaId = (ctx.db.prepare("SELECT id FROM mk_media WHERE organization_id = ? AND path = ?").get(ctx.organizationId, previousPath) || {}).id ?? null; operation = "replace";
      sec.src = m.path; sec.alt = text || sec.alt;
    } else {
      if (!text) throw bad("Une section « Image » exige un texte alternatif.");
      const anchor = working.sections.findIndex((s) => s.id === need.sectionId);
      if (anchor < 0) throw bad("La section d'ancrage n'existe plus dans cette page : replanifiez les besoins.");
      const n = Number(String(need.slot).replace("extra-", "")) || 1;
      const at = Math.min(working.sections.length, anchor + n);
      working.sections.splice(at, 0, { type: "image", id: sid, src: m.path, alt: text, caption: "" });
    }
  }
  // Écriture par le moteur de pages (validation native, révision vérifiée, historique des brouillons)
  transaction(ctx.db, () => {
    pagesLib().saveDraft(ctx, need.pageId, working, { revision: page.revision });
    ctx.db.prepare("INSERT INTO mk_aimedia_slots (site_id, page_id, section_id, slot, need_key, media_id, media_path, set_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'ai') ON CONFLICT (page_id, section_id, slot) DO UPDATE SET media_id = excluded.media_id, media_path = excluded.media_path, set_at = datetime('now')")
      .run(siteId, need.pageId, need.sectionId, need.slot, need.key, m.id, m.path);
    ctx.db.prepare("UPDATE mk_aimedia_needs SET status = 'assigned', media_id = ?, updated_at = datetime('now') WHERE site_id = ? AND need_key = ?").run(m.id, siteId, need.key);
    if (!meta) ctx.db.prepare("INSERT INTO mk_aimedia_meta (media_id, organization_id, site_id, source) VALUES (?, ?, ?, 'library')").run(m.id, ctx.organizationId, m.site_id ?? null);
    store.history(ctx, { siteId, op: op || operation, mediaId: m.id, previousMediaId, needKey: need.key, pageId: need.pageId, result: m.path, params: { alt: text } });
  });
  // Contrôle d'affichage : la page relue contient bien la référence, et le fichier existe dans la médiathèque du site
  const back = pagesLib().requirePage(ctx, need.pageId).working.sections;
  const found = need.widget === "hero" ? back.find((s) => s.id === need.sectionId).image === m.path : back.some((s) => s.id === extraSectionId(need.key) && s.src === m.path);
  return { mediaId: m.id, path: m.path, operation, verified: Boolean(found) };
}
// Remplit SEULEMENT les emplacements vides avec les images générées de chaque besoin ; ne remplace jamais rien
function autoAssign(ctx, siteId) {
  const done = [], skipped = [];
  for (const n of listNeeds(ctx, siteId).filter((x) => x.status === "generated" && x.pageId)) {
    const last = ctx.db.prepare("SELECT media_ids FROM mk_aimedia_tasks WHERE site_id = ? AND need_key = ? AND status = 'succeeded' ORDER BY id DESC LIMIT 1").get(siteId, n.key);
    const id = last && store.json(last.media_ids, [])[0];
    if (!id) continue;
    try { assign(ctx, siteId, { needKey: n.key, mediaId: id }); done.push(n.key); } catch (e) { if (e instanceof MarketingError) skipped.push({ key: n.key, why: e.message }); else throw e; }
  }
  return { done, skipped };
}
// Restauration : remet l'image précédente (dernier remplacement du besoin), sur confirmation explicite
function restore(ctx, siteId, needKey, { confirm = false } = {}) {
  siteOf(ctx, siteId);
  const h = ctx.db.prepare("SELECT * FROM mk_aimedia_history WHERE site_id = ? AND need_key = ? AND op IN ('replace', 'restore') AND previous_media_id IS NOT NULL ORDER BY id DESC LIMIT 1").get(siteId, needKey);
  if (!h) throw bad("Aucune image précédente à restaurer pour cet emplacement.");
  if (confirm !== true) throw new MarketingError("conflict", "La restauration doit être confirmée explicitement.");
  return assign(ctx, siteId, { needKey, mediaId: h.previous_media_id, replace: true, confirmManual: true, op: "restore" });
}

// ── gestionnaire de ressources ────────────────────────────────────────────────────────────────────────────────────────────────
const SOURCES = { user: "Importée", library: "Médiathèque", ai: "Générée par IA", demo: "Visuel d'attente", stock: "Banque d'images", external: "Fournisseur externe", system: "Média système" };
function library(ctx, siteId, { q = "", source = "", ai = false, unused = false, category = "", limit = 60 } = {}) {
  siteOf(ctx, siteId);
  const base = media().listMedia(mctx(ctx, siteId), { q: "", kind: "image", limit: 200 }).items;
  const metas = new Map(ctx.db.prepare("SELECT * FROM mk_aimedia_meta WHERE organization_id = ?").all(ctx.organizationId).map((m) => [m.media_id, m]));
  const term = String(q || "").trim().toLowerCase().slice(0, 80);
  let items = base.map((m) => { const meta = metas.get(m.id); return { id: m.id, path: m.path, name: m.name, alt: m.alt, mime: m.mime, size: m.size, width: m.width, height: m.height, createdAt: m.created_at || m.createdAt, source: meta ? meta.source : "user", sourceLabel: SOURCES[meta ? meta.source : "user"], provider: meta ? meta.provider : "", model: meta ? meta.model : "", aiGenerated: Boolean(meta && meta.ai_generated), tags: meta ? store.json(meta.tags, []) : [], category: meta ? meta.category : "", license: meta ? meta.license : "", description: meta ? meta.description : "" }; });
  if (term) items = items.filter((i) => [i.name, i.alt, i.description, i.tags.join(" "), i.category, i.provider].join(" ").toLowerCase().includes(term));
  if (source) items = items.filter((i) => i.source === source);
  if (ai) items = items.filter((i) => i.aiGenerated);
  if (category) items = items.filter((i) => i.category === category);
  items = items.slice(0, Math.min(200, Number(limit) || 60));
  if (unused) items = items.filter((i) => { try { return media().mediaUsage(mctx(ctx, siteId), { id: i.id, path: i.path, type: "image" }).length === 0; } catch { return false; } });
  return items;
}
function usageOf(ctx, siteId, mediaId) { siteOf(ctx, siteId); const m = visibleMedia(ctx, siteId, mediaId); return media().mediaUsage(mctx(ctx, siteId), m).map((u) => ({ kind: u.kind, name: u.name })); }
// Métadonnées étendues : alt, légende, description, tags, catégorie, licence, auteur, point focal ; jamais de licence « libre de droits » non vérifiée
function describe(ctx, siteId, mediaId, patch = {}) {
  siteOf(ctx, siteId); const m = visibleMedia(ctx, siteId, mediaId);
  if (m.reach === "site" && m.site_id !== siteId) throw new MarketingError("not_found", "Média introuvable pour ce site.");
  const cur = ctx.db.prepare("SELECT * FROM mk_aimedia_meta WHERE media_id = ?").get(m.id) || (ctx.db.prepare("INSERT INTO mk_aimedia_meta (media_id, organization_id, site_id, source) VALUES (?, ?, ?, 'user')").run(m.id, ctx.organizationId, m.site_id ?? null), ctx.db.prepare("SELECT * FROM mk_aimedia_meta WHERE media_id = ?").get(m.id));
  const line = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
  const tags = patch.tags === undefined ? store.json(cur.tags, []) : [...new Set([].concat(patch.tags).flatMap((t) => String(t).split(",")).map((t) => line(t, 30).toLowerCase()).filter(Boolean))].slice(0, 12);
  const focal = (v) => (v === undefined ? undefined : v === "" || v === null ? null : Math.min(1, Math.max(0, Number(v))));
  if (patch.license !== undefined && /libre de droits|royalty.?free|domaine public|cc0/i.test(String(patch.license)) && !patch.licenseNote) throw bad("Une licence « libre de droits » doit être accompagnée de sa source de vérification (note de licence).");
  if (patch.focalX !== undefined && Number.isNaN(focal(patch.focalX)) || patch.focalY !== undefined && Number.isNaN(focal(patch.focalY))) throw bad("Point focal : nombres entre 0 et 1.");
  ctx.db.prepare("UPDATE mk_aimedia_meta SET tags = ?, category = ?, caption = ?, description = ?, license = ?, license_note = ?, author = ?, focal_x = ?, focal_y = ?, updated_at = datetime('now') WHERE media_id = ?")
    .run(JSON.stringify(tags), patch.category === undefined ? cur.category : line(patch.category, 40), patch.caption === undefined ? cur.caption : line(patch.caption, 200), patch.description === undefined ? cur.description : line(patch.description, 500),
      patch.license === undefined ? cur.license : line(patch.license, 100), patch.licenseNote === undefined ? cur.license_note : line(patch.licenseNote, 300), patch.author === undefined ? cur.author : line(patch.author, 100),
      focal(patch.focalX) === undefined ? cur.focal_x : focal(patch.focalX), focal(patch.focalY) === undefined ? cur.focal_y : focal(patch.focalY), m.id);
  if (patch.alt !== undefined || patch.name !== undefined) media().updateMedia(mctx(ctx, siteId), m.id, { alt: patch.alt, name: patch.name });
  return provenance(ctx, siteId, m.id);
}
function provenance(ctx, siteId, mediaId) {
  siteOf(ctx, siteId); const m = visibleMedia(ctx, siteId, mediaId);
  const meta = ctx.db.prepare("SELECT * FROM mk_aimedia_meta WHERE media_id = ?").get(m.id) || { source: "user" };
  const row = ctx.db.prepare("SELECT sha256, size, created_at, created_by FROM mk_media WHERE id = ?").get(m.id);
  return { mediaId: m.id, path: m.path, name: m.name, mime: m.mime, size: row.size, width: m.width, height: m.height, createdAt: row.created_at, sha256: row.sha256, source: meta.source, sourceLabel: SOURCES[meta.source] || meta.source, provider: meta.provider || "", model: meta.model || "", prompt: meta.prompt || "",
    aiGenerated: Boolean(meta.ai_generated), license: meta.license || "", licenseNote: meta.license_note || "", author: meta.author || "", tags: store.json(meta.tags || "[]", []), category: meta.category || "", caption: meta.caption || "", description: meta.description || "", alt: m.alt, focal: meta.focal_x === null || meta.focal_x === undefined ? null : { x: meta.focal_x, y: meta.focal_y },
    notice: meta.ai_generated ? "Image générée par IA : ne la présentez pas comme une photographie authentique d'un lieu, d'une personne ou d'un produit réel." : meta.source === "demo" ? "Visuel d'attente : à remplacer par une vraie image." : "" };
}
// Enregistre la provenance d'une image IMPORTÉE par la personne (déjà enregistrée par la médiathèque) : aucune licence supposée
function registerImport(ctx, siteId, mediaId, { license = "", licenseNote = "", author = "" } = {}) {
  siteOf(ctx, siteId); const m = visibleMedia(ctx, siteId, mediaId);
  if (!ctx.db.prepare("SELECT 1 FROM mk_aimedia_meta WHERE media_id = ?").get(m.id)) ctx.db.prepare("INSERT INTO mk_aimedia_meta (media_id, organization_id, site_id, source) VALUES (?, ?, ?, 'user')").run(m.id, ctx.organizationId, m.site_id ?? null);
  store.history(ctx, { siteId, op: "import", mediaId: m.id, result: m.path });
  return describe(ctx, siteId, mediaId, { license, licenseNote, author });
}
// Texte alternatif : proposé d'après ce qui est CONNU (consigne de génération, description, nom de fichier) — pas d'analyse visuelle (aucun modèle de vision dans l'AI Core). `decorative` : alt vide autorisé seulement pour l'image d'un bandeau.
function suggestAlt(ctx, siteId, mediaId, { decorative = false } = {}) {
  siteOf(ctx, siteId); const p = provenance(ctx, siteId, mediaId);
  if (decorative) return { alt: "", decorative: true, basis: "décorative", note: "Alternative vide : valable seulement pour une image purement décorative (image de bandeau)." };
  const fromName = p.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\d{6,}/g, "").trim();
  const base = p.description || p.alt || (p.aiGenerated || p.source === "demo" ? "" : fromName);
  return { alt: base ? `${base.slice(0, 190)}${p.aiGenerated ? " (image générée)" : ""}` : "", decorative: false, basis: p.description ? "description enregistrée" : p.alt ? "texte existant" : base ? "nom du fichier" : "aucune", note: "Proposition à relire : elle n'est pas issue d'une analyse de l'image." };
}
// Variantes responsives : réutilise les résolutions de la médiathèque (WebP à la demande, original conservé, jamais d'agrandissement)
function responsive(ctx, siteId, mediaId) {
  siteOf(ctx, siteId); const m = visibleMedia(ctx, siteId, mediaId); const variants = require("../marketing/media/variants");
  const sizes = variants.available() && m.width ? variants.offered(m.width, siteId) : [];
  return { available: variants.available(), original: m.path, width: m.width, height: m.height, formats: variants.available() ? ["webp"] : [], avif: false, variants: sizes.map((s) => ({ key: s.key, width: s.width, url: variants.variantUrl(m.path, s.key) })) };
}
function historyList(ctx, siteId, limit = 60) { siteOf(ctx, siteId); return ctx.db.prepare("SELECT * FROM mk_aimedia_history WHERE organization_id = ? AND site_id = ? ORDER BY id DESC LIMIT ?").all(ctx.organizationId, siteId, Math.min(200, Number(limit) || 60)).map((r) => ({ id: r.id, at: r.at, userId: r.user_id, op: r.op, provider: r.provider, model: r.model, prompt: r.prompt, params: store.json(r.params, {}), result: r.result, estCostMicro: r.est_cost_micro, realCostMicro: r.real_cost_micro, durationMs: r.duration_ms, status: r.status, error: r.error, mediaId: r.media_id, previousMediaId: r.previous_media_id, needKey: r.need_key, pageId: r.page_id, taskId: r.task_id })); }
function consumption(ctx, siteId) {
  siteOf(ctx, siteId);
  const by = (col) => ctx.db.prepare(`SELECT ${col} k, COUNT(*) tasks, SUM(CASE WHEN status = 'succeeded' THEN variants ELSE 0 END) images, SUM(est_cost_micro) est FROM mk_aimedia_tasks WHERE organization_id = ? AND site_id = ? GROUP BY ${col}`).all(ctx.organizationId, siteId);
  return { byProvider: by("provider"), byUser: by("user_id"), note: "Les coûts sont des estimations ; le coût réel n'est renvoyé par aucun fournisseur (affiché « inconnu »)." };
}
module.exports = { siteOf, contextOf, plan, listNeeds, getNeed, editNeed, providerStatus, estimate, spendAuthorized, setSpendAuthorized, start, startSync, run, cancel, retry, getTask, listTasks, assign, autoAssign, restore, library, usageOf, describe, provenance, registerImport, suggestAlt, responsive, historyList, consumption, extraSectionId, SOURCES, providers, planner };
