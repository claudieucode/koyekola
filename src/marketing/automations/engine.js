// Moteur d'exécution des scénarios. Garanties (testées) :
//  - un contact entre UNE fois dans un scénario (UNIQUE) ; il garde les étapes d'origine ;
//  - AUCUN processus ne « dort » : une attente est une date de réveil en base + un travail planifié (survit à un redémarrage) ;
//  - marketing : consentement revérifié à chaque e-mail (désinscrit/bloqué ⇒ le contact SORT du scénario) ;
//    transactionnel : ignore la désinscription marketing mais respecte la liste de suppression, sans plafond quotidien ;
//  - rejouer une étape déjà exécutée n'envoie rien de plus (messages uniques, statut vérifié) ;
//  - les actions d'un scénario (étiquette, liste) N'ÉMETTENT AUCUN événement : impossible de chaîner des scénarios en boucle.
const { MarketingError } = require("../errors");
const { audit } = require("../audience/shared");
const { getContact } = require("../audience/contacts");
const { createProviderFor } = require("../sending/config");
const { getAction } = require("./actions");
const { filterMatches } = require("./catalog");
const { enqueueRun } = require("./jobs");

const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const trimBase = (u) => String(u || "").replace(/\/+$/, "");

// Données de l'événement déclencheur, mises à disposition des modèles (texte seulement ; adresses fabriquées ici)
function eventData(ctx, event) {
  const md = event.metadata && typeof event.metadata === "object" ? event.metadata : {};
  const base = trimBase(ctx.baseUrl);
  const slug = md.courseSlug || md.slug;
  return {
    course_title: md.courseTitle || md.title || "", order_total: md.orderTotal || "", order_id: md.orderId ?? "", lesson_title: md.lessonTitle || "",
    course_url: base && slug ? `${base}/cours/${encodeURIComponent(String(slug))}` : "", learn_url: base ? `${base}/mes-cours` : "",
    // Tunnel d'origine (palier 19) : variables {{event.funnel_name}} et {{event.funnel_step}} ; les identifiants servent au suivi des e-mails
    refund_amount: md.refundAmount || "", funnel_name: md.funnelName || "", funnel_step: md.stepName || md.lastStepName || "", funnel_id: md.funnelId || "", funnel_step_id: md.stepId || md.lastStepId || "",
  };
}

// Un scénario d'un SITE n'accueille que les contacts de ce site : l'événement vient de ce site, ou le contact y a son origine / une activité enregistrée
function belongsToSite(ctx, contact, event, siteId) {
  if (Number.isInteger(event.siteId) && event.siteId === siteId) return true;
  if (contact.origin_site_id === siteId) return true;
  return Boolean(ctx.db.prepare("SELECT 1 FROM mk_events WHERE organization_id = ? AND contact_id = ? AND site_id = ? LIMIT 1").get(ctx.organizationId, contact.id, siteId));
}

// ---------- Entrée d'un contact dans un scénario ----------
function onEvent(ctx, event) {
  if (!event || !Number.isInteger(event.contactId) || typeof event.name !== "string") return 0;
  const contact = getContact(ctx, event.contactId);
  if (!contact) return 0;
  // Un scénario peut avoir jusqu'à 3 déclencheurs (migration 017) : `json_each` filtre au niveau SQL sur N'IMPORTE
  // LEQUEL d'entre eux, `DISTINCT` évite qu'un scénario avec deux déclencheurs identiques par erreur ne ressorte
  // deux fois (empêché à la validation, mais la requête reste correcte même si ça arrivait).
  const autos = ctx.db
    .prepare(
      `SELECT DISTINCT a.* FROM mk_automations a, json_each(a.triggers) t
       WHERE a.organization_id = ? AND a.status = 'active' AND a.active_steps <> '' AND json_extract(t.value, '$.event') = ?`
    )
    .all(ctx.organizationId, event.name);
  let entered = 0;
  const now = nowOf(ctx);
  // Objectif atteint (palier 19) : les passages EN COURS de ce contact dans un scénario dont l'objectif est cet événement se terminent — aucun e-mail de plus ne part
  for (const g of ctx.db.prepare("SELECT a.id, a.name FROM mk_automations a WHERE a.organization_id = ? AND a.goal_event = ? AND a.status IN ('active', 'paused')").all(ctx.organizationId, event.name)) {
    for (const run of ctx.db.prepare("SELECT id, step_index FROM mk_automation_runs WHERE organization_id = ? AND automation_id = ? AND contact_id = ? AND status = 'running'").all(ctx.organizationId, g.id, contact.id)) {
      ctx.db.prepare("INSERT INTO mk_automation_log (organization_id, run_id, step_index, action, detail, at) VALUES (?, ?, ?, 'goal', ?, ?)").run(ctx.organizationId, run.id, run.step_index, `objectif atteint : ${event.name}`, now);
      ctx.db.prepare("UPDATE mk_automation_runs SET status = 'completed', last_error = '', finished_at = ? WHERE id = ?").run(now, run.id);
    }
  }
  for (const a of autos) {
    // Le déclencheur qui a fait correspondre CE scénario (pas forcément le premier) porte le filtre à appliquer.
    const matched = JSON.parse(a.triggers || "[]").find((t) => t.event === event.name);
    const filter = matched ? matched.filter : {};
    if (!filterMatches(event.metadata, filter)) continue;
    if (Number.isInteger(a.site_id) && !belongsToSite(ctx, contact, event, a.site_id)) continue;
    const steps = JSON.parse(a.active_steps);
    if (!steps.length) continue;
    const info = ctx.db
      .prepare("INSERT OR IGNORE INTO mk_automation_runs (organization_id, automation_id, contact_id, trigger_event_id, steps, event_data, wake_at, entered_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, a.id, contact.id, event.id ?? null, a.active_steps, JSON.stringify(eventData(ctx, event)), now, now, a.version || 0);
    if (info.changes === 0) continue; // déjà passé dans ce scénario
    enqueueRun(ctx.db, { organizationId: ctx.organizationId, runId: Number(info.lastInsertRowid), runAt: now, tag: "start" });
    entered++;
  }

  // Réveil anticipé : un passage déjà en cours pour CE contact, actuellement en attente (`wake_at` dans le futur)
  // à cause d'un « wait_for_event » qui correspond à cet événement, reprend tout de suite plutôt que d'attendre
  // son délai maximal. `step_index` pointe déjà sur l'étape SUIVANTE (comme une attente ordinaire, l'index avance
  // dès que l'attente commence) : l'étape qui attend est donc celle juste avant.
  const waiting = ctx.db.prepare("SELECT id, step_index, steps FROM mk_automation_runs WHERE organization_id = ? AND contact_id = ? AND status = 'running' AND wake_at > ?").all(ctx.organizationId, contact.id, now);
  for (const w of waiting) {
    let wSteps;
    try { wSteps = JSON.parse(w.steps); } catch { continue; }
    const waitingStep = wSteps[w.step_index - 1];
    if (!waitingStep || waitingStep.type !== "wait_for_event" || waitingStep.event !== event.name) continue;
    ctx.db.prepare("UPDATE mk_automation_runs SET wake_at = ? WHERE id = ? AND organization_id = ?").run(now, w.id, ctx.organizationId);
    enqueueRun(ctx.db, { organizationId: ctx.organizationId, runId: w.id, runAt: now, tag: "event_match" });
  }

  return entered;
}

// ---------- Exécution ----------
async function runAutomation(ctx, runId, { provider, smsProvider, now = nowOf(ctx) } = {}) {
  const org = ctx.organizationId;
  const run = ctx.db.prepare("SELECT * FROM mk_automation_runs WHERE id = ? AND organization_id = ?").get(runId, org);
  if (!run) throw new MarketingError("not_found", "Passage introuvable.");
  if (run.status !== "running") return { done: true };
  const automation = ctx.db.prepare("SELECT * FROM mk_automations WHERE id = ? AND organization_id = ?").get(run.automation_id, org);
  if (!automation || automation.status !== "active") return { done: false, paused: true };
  if (run.wake_at > now) return { done: false, waitMs: run.wake_at - now };

  const steps = JSON.parse(run.steps);
  let index = run.step_index;
  let attempts = run.attempts;
  const log = (action, detail = "") => ctx.db.prepare("INSERT INTO mk_automation_log (organization_id, run_id, step_index, action, detail, at) VALUES (?, ?, ?, ?, ?, ?)").run(org, runId, index, action, String(detail).slice(0, 300), now);
  const save = (nextIndex, wakeAt, nextAttempts) => {
    index = nextIndex; attempts = nextAttempts;
    ctx.db.prepare("UPDATE mk_automation_runs SET step_index = ?, wake_at = ?, attempts = ? WHERE id = ?").run(index, wakeAt, attempts, runId);
  };
  const finish = (status, reason = "") => {
    log(status === "completed" ? "completed" : "exited", reason);
    ctx.db.prepare("UPDATE mk_automation_runs SET status = ?, last_error = ?, finished_at = ?, step_index = ? WHERE id = ?").run(status, reason, now, index, runId);
    return { done: true };
  };

  const contact = getContact(ctx, run.contact_id);
  if (!contact) return finish("exited", "contact_removed");
  const actx = { ...ctx, bus: null, audit: false }; // les actions d'un scénario n'émettent aucun événement

  for (let guard = 0; guard < 100; guard++) {
    const step = steps[index];
    if (!step) return finish("completed");
    // Chaque type d'étape est une action du registre (actions/) : le moteur ne connaît que le format du résultat.
    // Type inconnu (scénario d'une version plus ancienne ou plus récente) : étape passée, comme avant.
    const action = getAction(step.type);
    let out = action ? await action.execute({ ctx: actx, run, automation, step, steps, index, contact, provider, smsProvider, now, attempts }) : { next: true };
    if (out.complete) return finish("completed");
    if (out.log) log(out.log[0], out.log[1]);
    if (out.wait !== undefined) {
      save(index + 1, now + out.wait, 0);
      return { done: false, waitMs: out.wait };
    }
    if (out.exit) return finish("exited", out.exit);
    if (out.pause) {
      ctx.db.prepare("UPDATE mk_automations SET status = 'paused', error = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(String(out.pause).slice(0, 500), automation.id, org);
      audit(ctx, "automation.paused", "automation", automation.id, { reason: "config" });
      return { done: false, paused: true };
    }
    if (out.retry !== undefined) {
      save(index, now + out.retry, out.attempts ?? attempts);
      return { done: false, waitMs: out.retry };
    }
    // Saut explicite sur une étape ORDINAIRE (pas seulement une condition) : permet à deux embranchements de
    // reconverger sur n'importe quelle étape (l'éditeur graphique le permet), pas seulement l'étape suivante.
    // ("next" est une valeur explicite mais équivalente au comportement par défaut : ne rien changer.)
    if (out.next === true && step.next !== undefined && step.next !== "next") out = step.next === "exit" ? { exit: "next" } : { jump: step.next };
    if (out.exit) return finish("exited", out.exit);
    if (out.jump !== undefined) save(out.jump, now, 0);
    else save(index + 1, now, 0);
  }
  return finish("exited", "trop_d_etapes");
}

// ---------- Branchements ----------
// Gestionnaire du bus (distribution par la file) : idempotent, un passage par contact et par scénario
function eventHandler({ db, settings, env = process.env, log = console }) {
  return async (event) => {
    onEvent({ db, organizationId: event.organizationId, userId: null, bus: null, settings, tokenKey: env.ENCRYPTION_KEY, baseUrl: env.SITE_URL, log }, event);
  };
}

function jobHandlers({ db, bus = null, settings, env = process.env, providerFor, smsProviderFor, now = Date.now, log = console }) {
  return {
    "automation.run": async ({ organizationId, runId }) => {
      const ctx = { db, organizationId, userId: null, bus, settings, tokenKey: env.ENCRYPTION_KEY, baseUrl: env.SITE_URL, log, now };
      const provider = providerFor ? providerFor(ctx) : createProviderFor(ctx);
      // Fournisseur SMS construit seulement si une étape SMS est atteinte (identifiants absents ⇒ scénario en pause)
      const smsProvider = smsProviderFor ? () => smsProviderFor(ctx) : undefined;
      const result = await runAutomation(ctx, runId, { provider, smsProvider, now: now() });
      if (!result.done && !result.paused && result.waitMs > 0) enqueueRun(db, { organizationId, runId, runAt: now() + result.waitMs, tag: "wake" });
    },
    // Notifications à l'équipe (action « Notifier l'équipe ») : e-mail interne envoyé par la file, avec reprises
    ...require("./notify").jobHandlers({ db, bus, settings, env, providerFor, log }),
  };
}

module.exports = { onEvent, runAutomation, eventHandler, jobHandlers, eventData };
