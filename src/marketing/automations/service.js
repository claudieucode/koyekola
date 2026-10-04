// Scénarios : création, modification, contrôle avant activation, activation (contenu FIGÉ), pause, reprise, suppression, statistiques.
// Modèle : un déclencheur (événement), des étapes linéaires. Un contact entre UNE fois dans un scénario et reçoit chaque e-mail une fois.
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { MarketingError } = require("../errors");
const { checkCtx, cleanText, audit } = require("../audience/shared");
const templates = require("../templates");
const { compileTemplate } = require("../templates/blocks");
const { allowedFor, getOrgProfile } = require("../templates/context");
const { parseKey } = require("../security/crypto");
const { getSendingConfig, getSecrets } = require("../sending/config");
const { trackedLinks, snapshotOf } = require("../sending/dispatch");
const { TRIGGERS } = require("./catalog");
const { validateSteps, STEP_LABELS } = require("./steps");
const { incompleteNodes, orphanNodes } = require("./graph");
const { enqueueRun } = require("./jobs");
const { WORKER_DETAIL, workerHuman } = require("../workerNotice");

const KINDS = ["marketing", "transactional"];
const LOCAL_HTTP = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;
// Même motif que celui appliqué en écriture par le bus d'événements (events/bus.js#NAME) : un événement personnalisé
// (envoyé via POST /api/v1/events, jamais dans le catalogue TRIGGERS fermé) doit rester utilisable comme
// déclencheur — sinon l'API permettrait d'émettre un événement qu'aucun scénario ne pourrait jamais écouter.
const EVENT_NAME = /^[a-z][a-z0-9_.]{1,63}$/;
const MAX_TRIGGERS = 3; // même limite que les flux d'automatisation Mailchimp (offre Standard+)
const table = (ctx) => createRepository(ctx.db, ctx.organizationId).table("mk_automations");
// `triggers` (JSON, 1 à 3 entrées) est la source de vérité complète depuis la migration 017 ; `trigger_event`/
// `trigger_filter` restent en miroir du PREMIER déclencheur (toujours réécrites en même temps que `triggers`,
// jamais indépendamment) pour tout code qui les lit encore directement — jamais vide après cette migration, mais
// on ne suppose jamais qu'une base ancienne (pas encore migrée en test) l'a déjà remplie.
const parse = (row) => (row ? { ...row, triggerFilter: JSON.parse(row.trigger_filter), triggers: JSON.parse(row.triggers || "[]"), steps: JSON.parse(row.steps), canvas: row.canvas ? JSON.parse(row.canvas) : null } : null);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());

function cleanName(value) {
  const name = cleanText(value, { max: 101, field: "name" });
  if (!name) throw new MarketingError("invalid_field", "Le nom du scénario est obligatoire.");
  if (name.length > 100) throw new MarketingError("invalid_field", "Le nom du scénario est trop long (100 caractères au plus).");
  return name;
}

function validateTrigger(event, filter) {
  const known = typeof event === "string" && Object.hasOwn(TRIGGERS, event);
  if (!known && (typeof event !== "string" || !EVENT_NAME.test(event))) {
    throw new MarketingError("invalid_automation", "Déclencheur inconnu (choisissez-en un dans la liste, ou un nom d'événement personnalisé valide : minuscules, chiffres, « _ » et « . », 2 à 64 caractères, commence par une lettre).");
  }
  if (filter === undefined || filter === null || (typeof filter === "object" && !Object.keys(filter).length)) return {};
  const allowed = known ? TRIGGERS[event].filters.map(([key]) => key) : [];
  if (typeof filter !== "object" || Array.isArray(filter) || !allowed.includes(filter.key)) throw new MarketingError("invalid_automation", allowed.length ? `Filtre inconnu pour ce déclencheur (${allowed.join(", ")}).` : "Ce déclencheur n'accepte aucun filtre.");
  const value = typeof filter.value === "number" ? String(filter.value) : filter.value;
  if (typeof value !== "string" || !value.trim() || value.length > 100) throw new MarketingError("invalid_automation", "Valeur de filtre invalide.");
  return { key: filter.key, value: value.trim() };
}

// Valide 1 à 3 déclencheurs (chacun avec `validateTrigger`) ; jamais deux fois le même événement dans un même
// scénario (ambigu : lequel des deux filtres s'appliquerait ?).
function validateTriggers(triggers) {
  if (!Array.isArray(triggers) || !triggers.length) throw new MarketingError("invalid_automation", "Au moins un déclencheur est nécessaire.");
  if (triggers.length > MAX_TRIGGERS) throw new MarketingError("invalid_automation", `Trop de déclencheurs (${MAX_TRIGGERS} au plus).`);
  const seen = new Set();
  return triggers.map((t) => {
    if (!t || typeof t !== "object" || Array.isArray(t)) throw new MarketingError("invalid_automation", "Déclencheur invalide.");
    const filter = validateTrigger(t.event, t.filter);
    if (seen.has(t.event)) throw new MarketingError("invalid_automation", `Un même événement (« ${t.event} ») ne peut pas être utilisé deux fois comme déclencheur du même scénario.`);
    seen.add(t.event);
    return { event: t.event, filter };
  });
}

function createAutomation(ctx, input = {}) {
  checkCtx(ctx);
  const name = cleanName(input.name);
  const kind = input.kind === undefined ? "marketing" : input.kind;
  if (!KINDS.includes(kind)) throw new MarketingError("invalid_automation", "Type de scénario invalide (marketing ou transactional).");
  const triggers = validateTriggers(input.triggers !== undefined ? input.triggers : [{ event: input.triggerEvent, filter: input.triggerFilter }]);
  const steps = validateSteps(ctx, input.steps ?? [], kind);
  const repo = table(ctx);
  if (repo.count({ name }) > 0) throw new MarketingError("duplicate", "Un scénario porte déjà ce nom.");
  const row = repo.insert({
    name, kind, trigger_event: triggers[0].event, trigger_filter: JSON.stringify(triggers[0].filter), triggers: JSON.stringify(triggers),
    steps: JSON.stringify(steps), created_by: ctx.userId ?? null,
  });
  audit(ctx, "automation.created", "automation", row.id, { kind, steps: steps.length, triggers: triggers.length });
  return parse(row);
}

const getAutomation = (ctx, id) => (checkCtx(ctx), parse(Number.isInteger(id) ? table(ctx).get(id) : null));

function requireAutomation(ctx, id) {
  const a = getAutomation(ctx, id);
  if (!a) throw new MarketingError("not_found", "Scénario introuvable.");
  return a;
}

function listAutomations(ctx) {
  checkCtx(ctx);
  return ctx.db
    .prepare(
      `SELECT a.id, a.name, a.kind, a.status, a.trigger_event, a.triggers, a.steps, a.updated_at,
              (SELECT COUNT(*) FROM mk_automation_runs r WHERE r.automation_id = a.id) AS run_count,
              (SELECT COUNT(*) FROM mk_automation_runs r WHERE r.automation_id = a.id AND r.status = 'running') AS running_count
       FROM mk_automations a WHERE a.organization_id = ? ORDER BY a.id DESC`
    )
    .all(ctx.organizationId)
    .map(({ steps, triggers, ...rest }) => ({ ...rest, stepCount: JSON.parse(steps).length, triggerCount: JSON.parse(triggers || "[]").length || 1 }));
}

function updateAutomation(ctx, id, patch = {}) {
  const a = requireAutomation(ctx, id);
  if (a.status === "active") throw new MarketingError("invalid_state", "Mettez le scénario en pause avant de le modifier : les passages en cours gardent leurs étapes d'origine.");
  const repo = table(ctx);
  const fields = {};
  if (patch.name !== undefined) {
    fields.name = cleanName(patch.name);
    if (fields.name.toLowerCase() !== a.name.toLowerCase() && repo.count({ name: fields.name }) > 0) throw new MarketingError("duplicate", "Un scénario porte déjà ce nom.");
  }
  // `patch.triggers` (liste complète, envoyée par le nœud déclencheur du canevas) l'emporte s'il est fourni ;
  // sinon `patch.triggerEvent`/`patch.triggerFilter` (compatibilité) ne touchent QUE le premier déclencheur,
  // les éventuels 2e/3e restent inchangés.
  if (patch.triggers !== undefined) {
    const triggers = validateTriggers(patch.triggers);
    fields.triggers = JSON.stringify(triggers);
    fields.trigger_event = triggers[0].event;
    fields.trigger_filter = JSON.stringify(triggers[0].filter);
  } else if (patch.triggerEvent !== undefined || patch.triggerFilter !== undefined) {
    const event = patch.triggerEvent ?? a.trigger_event;
    const filter = patch.triggerFilter !== undefined ? patch.triggerFilter : patch.triggerEvent !== undefined ? {} : a.triggerFilter;
    const triggers = validateTriggers([{ event, filter }, ...a.triggers.slice(1)]);
    fields.triggers = JSON.stringify(triggers);
    fields.trigger_event = triggers[0].event;
    fields.trigger_filter = JSON.stringify(triggers[0].filter);
  }
  if (patch.steps !== undefined) fields.steps = JSON.stringify(validateSteps(ctx, patch.steps, a.kind));
  // Le canevas n'est qu'une vue d'ÉDITION (positions, arêtes) : jamais exécuté tel quel, jamais validé comme `steps`.
  // Enregistré uniquement pour que la disposition dessinée par la personne survive à un rechargement.
  if (patch.canvas !== undefined) {
    if (!patch.canvas || typeof patch.canvas !== "object" || !Array.isArray(patch.canvas.nodes) || !Array.isArray(patch.canvas.edges)) {
      throw new MarketingError("invalid_automation", "Schéma du canevas invalide.");
    }
    fields.canvas = JSON.stringify(patch.canvas);
  }
  // Tout changement invalide les étapes figées : elles seront refigées à la prochaine activation
  const row = repo.update(id, { ...fields, active_steps: "", updated_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
  audit(ctx, "automation.updated", "automation", id, { fields: Object.keys(patch) });
  return parse(row);
}

// ---------- Contrôle avant activation ----------
function automationPreflight(ctx, id, { workerOn = false, smtpAvailable = Boolean(process.env.SMTP_HOST) } = {}) {
  const a = requireAutomation(ctx, id);
  const errors = [];
  const warnings = [];
  // Schéma enregistré en brouillon avec des étapes pas encore réglées : activation impossible tant qu'il en reste
  if (a.canvas) {
    const todo = incompleteNodes(a.canvas);
    if (todo.length) errors.push({ code: "incomplete", nodes: todo.map((n) => n.id), message: `${todo.length} étape${todo.length > 1 ? "s" : ""} du schéma ${todo.length > 1 ? "sont" : "est"} à configurer (${todo.map((n) => STEP_LABELS[n.type] || n.type).join(", ")}) : cliquez sur chacune pour la régler.` });
    const loose = orphanNodes(a.canvas);
    if (loose.length) errors.push({ code: "orphan", nodes: loose.map((n) => n.id), message: `${loose.length} étape${loose.length > 1 ? "s ne sont reliées" : " n'est reliée"} à aucun chemin d'exécution (${loose.map((n) => STEP_LABELS[n.type] || n.type).join(", ")}) : reliez-${loose.length > 1 ? "les" : "la"} depuis le déclencheur ou supprimez-${loose.length > 1 ? "les" : "la"}.` });
  }
  if (!a.steps.length) errors.push({ code: "no_steps", message: "Le scénario n'a aucune étape." });
  // « step » (position dans `a.steps`) et « templateId » accompagnent chaque erreur d'e-mail : l'éditeur graphique
  // s'en sert pour sélectionner directement le nœud fautif sur le canevas plutôt que de laisser chercher à l'œil.
  const emailSteps = a.steps.map((s, step) => ({ s, step })).filter(({ s }) => s.type === "email");
  for (const { s, step } of emailSteps) {
    const t = templates.getTemplate(ctx, s.templateId);
    if (!t) { errors.push({ code: "template_missing", step, templateId: s.templateId, message: `Étape ${step + 1} (e-mail) : le modèle utilisé n'existe plus.` }); continue; }
    const ready = templates.templateReadiness(ctx, t.id);
    if (!ready.ready) errors.push({ code: "template_not_ready", step, templateId: s.templateId, message: `Étape ${step + 1} (e-mail « ${t.name} ») n'est pas prête : ${ready.errors.map((e) => e.message).join(" ")}` });
  }
  if (emailSteps.length) {
    const cfg = getSendingConfig(ctx);
    const secrets = getSecrets(ctx);
    if (cfg.provider === "console") warnings.push({ code: "provider_console", message: "Fournisseur « console » : rien ne sera réellement envoyé (réglages d'envoi)." });
    else {
      if (!cfg.from) errors.push({ code: "provider_incomplete", message: "Aucune adresse d'expédition n'est enregistrée (réglages d'envoi)." });
      if (cfg.provider === "smtp" && !smtpAvailable) errors.push({ code: "provider_incomplete", message: "SMTP n'est pas configuré sur le serveur (SMTP_HOST…)." });
      if (cfg.provider === "resend" && !secrets.apiKey) errors.push({ code: "provider_incomplete", message: "La clé d'API Resend n'est pas enregistrée." });
    }
    const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
    if (!/^https:\/\/[^\s/]+/i.test(base) && !(cfg.provider === "console" && LOCAL_HTTP.test(base))) errors.push({ code: "base_url", message: "L'adresse publique du site (SITE_URL) doit être en https://." });
    if (a.kind === "marketing") {
      try { parseKey(ctx.tokenKey); } catch { errors.push({ code: "token_key", message: "ENCRYPTION_KEY est absente ou invalide : les liens de désinscription ne peuvent pas être signés." }); }
      if (!getOrgProfile(ctx).address) warnings.push({ code: "address_missing", message: "Aucune adresse postale dans le pied de page des e-mails marketing." });
    }
  }
  if (!workerOn) warnings.push({ code: "worker_off", message: workerHuman("le scénario ne s'exécutera pas tant qu'il n'est pas rétabli"), detail: WORKER_DETAIL });
  return { ready: errors.length === 0, errors, warnings };
}

// ---------- Activation : contenu figé + campagnes système (une par étape d'e-mail) ----------
function freeze(ctx, a) {
  const n = ctx.db.prepare("SELECT COUNT(*) n FROM mk_campaigns WHERE automation_id = ? AND organization_id = ?").get(a.id, ctx.organizationId).n;
  const insertLink = ctx.db.prepare("INSERT OR IGNORE INTO mk_links (organization_id, campaign_id, url) VALUES (?, ?, ?)");
  let seq = n;
  return a.steps.map((step) => {
    if (step.type !== "email") return step;
    const template = templates.getTemplate(ctx, step.templateId);
    const snapshot = snapshotOf(template);
    const compiled = compileTemplate(snapshot, { allowed: allowedFor(ctx) });
    const campaign = ctx.db
      .prepare(
        `INSERT INTO mk_campaigns (organization_id, name, template_id, snapshot, target_type, target_id, track_clicks, status, kind, automation_id, created_by)
         VALUES (?, ?, ?, ?, 'list', 0, ?, 'sending', 'automation', ?, ?) RETURNING id`
      )
      .get(ctx.organizationId, `auto-${a.id}-${++seq}`, template.id, JSON.stringify(snapshot), step.trackClicks ? 1 : 0, a.id, ctx.userId ?? null);
    if (step.trackClicks) for (const url of trackedLinks(compiled, ctx)) insertLink.run(ctx.organizationId, campaign.id, url);
    return { ...step, campaignId: campaign.id };
  });
}

function activateAutomation(ctx, id, opts = {}) {
  const a = requireAutomation(ctx, id);
  if (a.status === "active") throw new MarketingError("invalid_state", "Ce scénario est déjà actif.");
  const check = automationPreflight(ctx, id, opts);
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.map((e) => e.message).join(" "));
  return transaction(ctx.db, () => {
    const frozen = a.active_steps ? JSON.parse(a.active_steps) : freeze(ctx, a);
    ctx.db.prepare("UPDATE mk_automations SET status = 'active', active_steps = ?, error = '', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(JSON.stringify(frozen), id, ctx.organizationId);
    audit(ctx, "automation.activated", "automation", id, { steps: frozen.length });
    return getAutomation(ctx, id);
  });
}

function pauseAutomation(ctx, id) {
  const a = requireAutomation(ctx, id);
  if (a.status !== "active") throw new MarketingError("invalid_state", "Seul un scénario actif peut être mis en pause.");
  ctx.db.prepare("UPDATE mk_automations SET status = 'paused', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "automation.paused", "automation", id, { reason: "manual" });
}

// Reprise : les passages en cours sont relancés. Si les étapes ont changé pendant la pause, il faut réactiver (contrôle + refonte figée).
function resumeAutomation(ctx, id, { now = nowOf(ctx) } = {}) {
  const a = requireAutomation(ctx, id);
  if (a.status !== "paused") throw new MarketingError("invalid_state", "Seul un scénario en pause peut être repris.");
  if (!a.active_steps) throw new MarketingError("invalid_state", "Les étapes ont changé pendant la pause : réactivez le scénario (contrôle avant activation).");
  ctx.db.prepare("UPDATE mk_automations SET status = 'active', error = '', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  for (const run of ctx.db.prepare("SELECT id, wake_at FROM mk_automation_runs WHERE automation_id = ? AND organization_id = ? AND status = 'running'").all(id, ctx.organizationId)) {
    enqueueRun(ctx.db, { organizationId: ctx.organizationId, runId: run.id, runAt: Math.max(run.wake_at, now), tag: "resume" });
  }
  audit(ctx, "automation.resumed", "automation", id, {});
}

function deleteAutomation(ctx, id) {
  checkCtx(ctx);
  const a = getAutomation(ctx, id);
  if (!a) return false;
  if (a.status === "active") throw new MarketingError("invalid_state", "Un scénario actif ne se supprime pas : mettez-le d'abord en pause.");
  return transaction(ctx.db, () => {
    ctx.db.prepare("DELETE FROM mk_campaigns WHERE automation_id = ? AND organization_id = ? AND kind = 'automation'").run(id, ctx.organizationId);
    const removed = table(ctx).remove(id);
    if (removed) audit(ctx, "automation.deleted", "automation", id, {});
    return removed;
  });
}

// Duplique un scénario en un nouveau BROUILLON indépendant : étapes, déclencheur et canevas repris tels quels,
// jamais les campagnes système ni les passages (un brouillon dupliqué n'a jamais été activé). Nom rendu unique
// automatiquement (« … (copie) », « … (copie 2) »…) : la contrainte d'unicité du nom l'exigerait de toute façon.
function duplicateAutomation(ctx, id) {
  const a = requireAutomation(ctx, id);
  const repo = table(ctx);
  let name = `${a.name} (copie)`.slice(0, 100);
  for (let n = 2; repo.count({ name }) > 0 && n < 100; n++) name = `${a.name} (copie ${n})`.slice(0, 100);
  const row = repo.insert({
    name, kind: a.kind, trigger_event: a.trigger_event, trigger_filter: a.trigger_filter,
    steps: JSON.stringify(a.steps), canvas: a.canvas ? JSON.stringify(a.canvas) : "", created_by: ctx.userId ?? null,
  });
  audit(ctx, "automation.duplicated", "automation", row.id, { from: id });
  return parse(row);
}

// ---------- Suivi ----------
function automationStats(ctx, id) {
  const a = requireAutomation(ctx, id);
  const runs = Object.fromEntries(ctx.db.prepare("SELECT status, COUNT(*) n FROM mk_automation_runs WHERE automation_id = ? AND organization_id = ? GROUP BY status").all(id, ctx.organizationId).map((r) => [r.status, r.n]));
  const sumRow = ctx.db
    .prepare(
      `SELECT COALESCE(SUM(sent_count), 0) sent, COALESCE(SUM(delivered_count), 0) delivered, COALESCE(SUM(bounced_count), 0) bounced, COALESCE(SUM(complained_count), 0) complained,
              COALESCE(SUM(unique_click_count), 0) uniqueClicks, COALESCE(SUM(unique_open_count), 0) uniqueOpens, COALESCE(SUM(unsubscribed_count), 0) unsubscribed, COALESCE(SUM(failed_count), 0) failed
       FROM mk_campaigns WHERE automation_id = ? AND organization_id = ?`
    )
    .get(id, ctx.organizationId);
  const frozen = a.active_steps ? JSON.parse(a.active_steps) : [];
  const perStep = frozen.map((step, index) => {
    const c = step.campaignId ? ctx.db.prepare("SELECT sent_count, unique_click_count FROM mk_campaigns WHERE id = ?").get(step.campaignId) : null;
    return { index, type: step.type, sent: c ? c.sent_count : 0, uniqueClicks: c ? c.unique_click_count : 0 };
  });
  return {
    runs: { running: runs.running ?? 0, completed: runs.completed ?? 0, exited: runs.exited ?? 0, failed: runs.failed ?? 0, total: Object.values(runs).reduce((x, y) => x + y, 0) },
    emails: sumRow, steps: perStep,
  };
}

function listRuns(ctx, id, { limit = 50 } = {}) {
  requireAutomation(ctx, id);
  return ctx.db
    .prepare(
      `SELECT r.id, r.status, r.step_index, r.wake_at, r.last_error, r.entered_at, r.finished_at, c.email
       FROM mk_automation_runs r JOIN mk_contacts c ON c.id = r.contact_id
       WHERE r.automation_id = ? AND r.organization_id = ? ORDER BY r.id DESC LIMIT ?`
    )
    .all(id, ctx.organizationId, Math.min(Math.max(Number(limit) || 50, 1), 200));
}

// Détail d'UN passage : ce qui s'est réellement produit, étape par étape (mk_automation_log est déjà alimenté par
// le moteur à chaque étape franchie — cette fonction est la première à le LIRE ; rien n'y était accroché avant).
function runDetail(ctx, automationId, runId) {
  requireAutomation(ctx, automationId);
  const row = ctx.db
    .prepare(
      `SELECT r.id, r.status, r.step_index, r.steps, r.wake_at, r.last_error, r.entered_at, r.finished_at, r.attempts, c.id AS contact_id, c.email
       FROM mk_automation_runs r JOIN mk_contacts c ON c.id = r.contact_id
       WHERE r.id = ? AND r.automation_id = ? AND r.organization_id = ?`
    )
    .get(runId, automationId, ctx.organizationId);
  if (!row) throw new MarketingError("not_found", "Passage introuvable.");
  const { steps: rawSteps, ...run } = row;
  const steps = JSON.parse(rawSteps);
  const log = ctx.db.prepare("SELECT step_index, action, detail, at FROM mk_automation_log WHERE run_id = ? AND organization_id = ? ORDER BY id").all(runId, ctx.organizationId);
  return { run, steps, log };
}

module.exports = { createAutomation, getAutomation, requireAutomation, listAutomations, updateAutomation, automationPreflight, activateAutomation, pauseAutomation, resumeAutomation, deleteAutomation, duplicateAutomation, automationStats, listRuns, runDetail };
