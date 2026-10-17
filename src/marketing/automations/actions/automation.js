// Actions de parcours : démarrer ou arrêter UN AUTRE scénario pour le contact en cours.
// Garde-fous (testés) : le contact n'entre qu'UNE fois dans un scénario (UNIQUE automation × contact) — deux scénarios qui se
// démarrent l'un l'autre s'arrêtent donc d'eux-mêmes ; un scénario ne se démarre pas lui-même ; seul un scénario ACTIF peut être
// démarré (ses étapes figées à l'activation) ; le consentement reste vérifié à chaque e-mail par le scénario démarré ; ces actions
// n'émettent aucun événement (le moteur leur passe un contexte sans bus).
const { MarketingError } = require("../../errors");
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { bad, withNext } = require("./shared");
const { enqueueRun } = require("../jobs");

const targetOf = (ctx, id) => ctx.db.prepare("SELECT id, name, status, active_steps FROM mk_automations WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);

function validateTarget({ ctx, raw, i, steps }, type) {
  if (!Number.isInteger(raw.automationId) || raw.automationId < 1) throw bad(i, "choisissez le scénario concerné.");
  if (!targetOf(ctx, raw.automationId)) throw new MarketingError("not_found", `Étape ${i + 1} : scénario introuvable.`);
  return withNext({ type, automationId: raw.automationId }, raw, i, steps);
}

defineAction({
  type: "start_automation", category: "parcours", label: STEP_LABELS.start_automation, description: "Fait entrer le contact dans un autre scénario actif", version: 1, status: "available",
  validate: (env) => validateTarget(env, "start_automation"),
  execute({ ctx, run, automation, step, contact, now }) {
    const t = targetOf(ctx, step.automationId);
    if (!t) return { next: true, log: ["failed", "scénario ciblé introuvable"] };
    if (t.id === automation.id) return { next: true, log: ["skipped", "un scénario ne se démarre pas lui-même"] };
    if ((t.site_id ?? null) !== (automation.site_id ?? null)) return { next: true, log: ["skipped", `scénario « ${t.name} » d'un autre site : rien démarré`] };
    if (t.status !== "active" || !t.active_steps) return { next: true, log: ["skipped", `scénario « ${t.name} » inactif : rien démarré`] };
    if (!JSON.parse(t.active_steps).length) return { next: true, log: ["skipped", `scénario « ${t.name} » sans étape`] };
    const info = ctx.db
      .prepare("INSERT OR IGNORE INTO mk_automation_runs (organization_id, automation_id, contact_id, trigger_event_id, steps, event_data, wake_at, entered_at, version) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, t.id, contact.id, t.active_steps, run.event_data, now, now, t.version || 0);
    if (!info.changes) return { next: true, log: ["already_in", `déjà passé dans « ${t.name} »`] };
    enqueueRun(ctx.db, { organizationId: ctx.organizationId, runId: Number(info.lastInsertRowid), runAt: now, tag: "start" });
    return { next: true, log: ["start_automation", `démarré : « ${t.name} »`] };
  },
});

defineAction({
  type: "stop_automation", category: "parcours", label: STEP_LABELS.stop_automation, description: "Fait sortir le contact d'un autre scénario en cours", version: 1, status: "available",
  validate: (env) => validateTarget(env, "stop_automation"),
  execute({ ctx, automation, step, contact, now }) {
    const t = targetOf(ctx, step.automationId);
    if (!t) return { next: true, log: ["failed", "scénario ciblé introuvable"] };
    if (t.id === automation.id) return { next: true, log: ["skipped", "pour quitter ce scénario, utilisez « Fin »"] };
    const running = ctx.db.prepare("SELECT id, step_index FROM mk_automation_runs WHERE automation_id = ? AND contact_id = ? AND organization_id = ? AND status = 'running'").get(t.id, contact.id, ctx.organizationId);
    if (!running) return { next: true, log: ["skipped", `pas en cours dans « ${t.name} »`] };
    ctx.db.prepare("UPDATE mk_automation_runs SET status = 'exited', last_error = 'stopped_by_automation', finished_at = ? WHERE id = ?").run(now, running.id);
    ctx.db.prepare("INSERT INTO mk_automation_log (organization_id, run_id, step_index, action, detail, at) VALUES (?, ?, ?, 'exited', ?, ?)").run(ctx.organizationId, running.id, running.step_index, `arrêté par le scénario « ${automation.name} »`, now);
    return { next: true, log: ["stop_automation", `arrêté : « ${t.name} »`] };
  },
});
