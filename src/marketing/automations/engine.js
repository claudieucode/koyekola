// Moteur d'exécution des scénarios. Garanties (testées) :
//  - un contact entre UNE fois dans un scénario (UNIQUE) ; il garde les étapes d'origine ;
//  - AUCUN processus ne « dort » : une attente est une date de réveil en base + un travail planifié (survit à un redémarrage) ;
//  - marketing : consentement revérifié à chaque e-mail (désinscrit/bloqué ⇒ le contact SORT du scénario) ;
//    transactionnel : ignore la désinscription marketing mais respecte la liste de suppression, sans plafond quotidien ;
//  - rejouer une étape déjà exécutée n'envoie rien de plus (messages uniques, statut vérifié) ;
//  - les actions d'un scénario (étiquette, liste) N'ÉMETTENT AUCUN événement : impossible de chaîner des scénarios en boucle.
const { transaction } = require("../db/tx");
const { MarketingError } = require("../errors");
const { audit } = require("../audience/shared");
const { getContact, updateContact } = require("../audience/contacts");
const { setContactProperties } = require("../audience/properties");
const { tagContact, untagContact } = require("../audience/tags");
const { addToList, removeFromList } = require("../audience/lists");
const { isSendable } = require("../compliance/consent");
const { addSuppression } = require("../compliance/suppression");
const segments = require("../segments");
const { compileTemplate } = require("../templates/blocks");
const { allowedFor } = require("../templates/context");
const { SendError } = require("../sending/providers/errors");
const { getSendingConfig, createProviderFor } = require("../sending/config");
const { buildMessage } = require("../sending/builder");
const { capacity } = require("../sending/dispatch");
const { recordEvent, bump } = require("../sending/events");
const { isSmsSendable } = require("../sms/consent");
const { getSmsConfig, createSmsProviderFor } = require("../sms/config");
const { smsCapacity, processMessage } = require("../sms/campaigns");
const { UNITS } = require("./steps");
const { enqueueRun } = require("./jobs");

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 60000;
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
  };
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
  for (const a of autos) {
    // Le déclencheur qui a fait correspondre CE scénario (pas forcément le premier) porte le filtre à appliquer.
    const matched = JSON.parse(a.triggers || "[]").find((t) => t.event === event.name);
    const filter = matched ? matched.filter : {};
    if (filter.key && String(event.metadata && event.metadata[filter.key]) !== String(filter.value)) continue;
    const steps = JSON.parse(a.active_steps);
    if (!steps.length) continue;
    const info = ctx.db
      .prepare("INSERT OR IGNORE INTO mk_automation_runs (organization_id, automation_id, contact_id, trigger_event_id, steps, event_data, wake_at, entered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, a.id, contact.id, event.id ?? null, a.active_steps, JSON.stringify(eventData(ctx, event)), now, now);
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
const compiledCache = new WeakMap();
function compiledFor(ctx, campaign) {
  if (!compiledCache.has(ctx.db)) compiledCache.set(ctx.db, new Map());
  const cache = compiledCache.get(ctx.db);
  if (!cache.has(campaign.id)) {
    if (cache.size >= 200) cache.delete(cache.keys().next().value);
    cache.set(campaign.id, compileTemplate(JSON.parse(campaign.snapshot), { allowed: allowedFor(ctx) }));
  }
  return cache.get(campaign.id);
}

async function sendEmailStep(ctx, { run, automation, step, contact, provider, now, attempts }) {
  const org = ctx.organizationId;
  const transactional = automation.kind === "transactional";
  const campaign = ctx.db.prepare("SELECT * FROM mk_campaigns WHERE id = ? AND organization_id = ? AND automation_id = ?").get(step.campaignId, org, automation.id);
  if (!campaign) return { next: true, log: ["failed", "campagne système introuvable"] };

  if (transactional) {
    if (ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(org, contact.email)) return { next: true, log: ["skipped", "suppressed"] };
  } else {
    const check = isSendable(ctx, contact.id);
    if (!check.ok) return { exit: check.reason };
  }

  ctx.db.prepare("INSERT OR IGNORE INTO mk_messages (organization_id, campaign_id, contact_id, email, provider, status) VALUES (?, ?, ?, ?, ?, 'pending')").run(org, campaign.id, contact.id, contact.email, provider.name);
  const message = ctx.db.prepare("SELECT * FROM mk_messages WHERE campaign_id = ? AND contact_id = ?").get(campaign.id, contact.id);
  if (message.status !== "pending") return { next: true, log: ["already_sent", `message ${message.id}`] };

  const cfg = getSendingConfig(ctx);
  const cap = capacity(ctx, cfg, now, { ignoreDaily: transactional });
  if (cap.allowed <= 0) return { retry: cap.waitMs, attempts };

  const fail = (status, counter, type, detail) =>
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_messages SET status = ? WHERE id = ?").run(status, message.id);
      if (status === "bounced") ctx.db.prepare("UPDATE mk_messages SET bounced_at = ? WHERE id = ?").run(now, message.id);
      bump(ctx, campaign.id, counter);
      recordEvent(ctx, { messageId: message.id, campaignId: campaign.id, type, detail, at: now });
    });

  try {
    const linkMap = new Map(ctx.db.prepare("SELECT id, url FROM mk_links WHERE campaign_id = ?").all(campaign.id).map((l) => [l.url, l.id]));
    const built = buildMessage(ctx, { campaign, compiled: compiledFor(ctx, campaign), contact, message, config: cfg, linkMap, event: JSON.parse(run.event_data || "{}"), transactional });
    const result = await provider.send(built);
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_messages SET status = 'sent', sent_at = ?, provider_message_id = ?, subject = ? WHERE id = ?").run(now, result.providerMessageId, built.subject.slice(0, 300), message.id);
      bump(ctx, campaign.id, "sent_count");
      recordEvent(ctx, { messageId: message.id, campaignId: campaign.id, type: "sent", at: now });
      if (!transactional) ctx.db.prepare("UPDATE mk_contacts SET last_campaign_at = datetime('now') WHERE id = ? AND organization_id = ?").run(contact.id, org);
    });
    return { next: true, log: ["sent", `message ${message.id}`] };
  } catch (error) {
    if (!(error instanceof SendError)) {
      ctx.log?.error?.("[KOLAKISA] Erreur imprévue pendant l'envoi d'un e-mail de scénario :", error && error.message);
      fail("failed", "failed_count", "failed", { kind: "error" });
      return { next: true, log: ["failed", "error"] };
    }
    switch (error.kind) {
      case "temporary": {
        if (attempts + 1 >= MAX_ATTEMPTS) { fail("failed", "failed_count", "failed", { kind: "temporary" }); return { next: true, log: ["failed", "temporary_exhausted"] }; }
        return { retry: RETRY_BASE_MS * 2 ** attempts, attempts: attempts + 1 };
      }
      case "rate_limited": return { retry: error.retryAfterMs ?? 30000, attempts };
      case "config": return { pause: error.message };
      case "recipient_rejected":
        fail("bounced", "bounced_count", "bounced", { via: "smtp", kind: "hard" });
        addSuppression({ ...ctx, audit: false, bus: null }, { email: contact.email, reason: "bounced", note: "Adresse refusée par le serveur du destinataire (scénario)" });
        return { exit: "rejected" };
      default:
        fail("failed", "failed_count", "failed", { kind: "permanent" });
        return { next: true, log: ["failed", "permanent"] };
    }
  }
}

// ---------- Étape « Envoyer un SMS » ----------
// Même chemin que l'envoi d'une campagne SMS (sms/campaigns.js#processMessage) : accord SMS revérifié, heures de silence
// du destinataire, liens courts suivis, mention STOP, longueur facturée, erreurs du fournisseur. Différences voulues :
//  - un contact SANS accord SMS passe simplement l'étape (il reste dans le parcours : ses e-mails continuent) ;
//  - « nuit » chez le destinataire ou plafond atteint : le passage attend (date de réveil), sans compter d'essai ;
//  - un SMS dont l'envoi a été interrompu (serveur arrêté pendant l'appel) n'est JAMAIS renvoyé : il est marqué échoué.
const SMS_STUCK_MS = 10 * 60000;
async function sendSmsStep(ctx, { automation, step, contact, smsProvider, now }) {
  const org = ctx.organizationId;
  const campaign = ctx.db.prepare("SELECT * FROM mk_sms_campaigns WHERE id = ? AND organization_id = ? AND automation_id = ? AND kind = 'automation'").get(step.smsCampaignId, org, automation.id);
  if (!campaign) return { next: true, log: ["failed", "campagne SMS système introuvable"] };
  const bumpC = (column) => ctx.db.prepare(`UPDATE mk_sms_campaigns SET ${column} = ${column} + 1, updated_at = datetime('now') WHERE id = ?`).run(campaign.id);

  let message = ctx.db.prepare("SELECT * FROM mk_sms_messages WHERE campaign_id = ? AND contact_id = ?").get(campaign.id, contact.id);
  if (!message) {
    const check = isSmsSendable(ctx, contact.id);
    if (!check.ok) return { next: true, log: ["skipped", `sms : ${check.reason}`] };
    ctx.db.prepare("INSERT OR IGNORE INTO mk_sms_messages (organization_id, campaign_id, contact_id, phone, updated_at) VALUES (?, ?, ?, ?, ?)").run(org, campaign.id, contact.id, check.phone, now);
    bumpC("total_recipients");
    message = ctx.db.prepare("SELECT * FROM mk_sms_messages WHERE campaign_id = ? AND contact_id = ?").get(campaign.id, contact.id);
  }
  if (message.status === "sending") {
    if (message.updated_at > now - SMS_STUCK_MS) return { retry: SMS_STUCK_MS };
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_sms_messages SET status = 'failed', reason = 'interrupted', updated_at = ? WHERE id = ? AND status = 'sending'").run(now, message.id);
      bumpC("failed_count");
    });
    return { next: true, log: ["failed", `sms ${message.id} : interrompu`] };
  }
  if (message.status !== "queued") return { next: true, log: ["already_sent", `sms ${message.id}`] };
  if (message.next_attempt_at && message.next_attempt_at > now) return { retry: message.next_attempt_at - now };

  const cfg = getSmsConfig(ctx);
  const cap = smsCapacity(ctx, cfg, now);
  if (cap.allowed <= 0) return { retry: cap.waitMs };
  let provider;
  try {
    provider = smsProvider ? smsProvider() : createSmsProviderFor(ctx);
  } catch (error) {
    return { pause: `SMS : ${error.message}` };
  }
  if (!ctx.db.prepare("UPDATE mk_sms_messages SET status = 'sending', updated_at = ? WHERE id = ? AND status = 'queued'").run(now, message.id).changes) return { retry: 1000 };
  const links = ctx.db.prepare("SELECT id, url FROM mk_sms_links WHERE campaign_id = ?").all(campaign.id);
  const outcome = await processMessage(ctx, { campaign, message: { ...message, status: "sending" }, cfg, links, provider, now });
  if (typeof outcome === "object") {
    if (outcome.stop.pause) return { pause: `SMS : ${outcome.stop.pause}` };
    return { retry: outcome.stop.waitMs ?? 30000 };
  }
  if (outcome === "deferred" || outcome === "retry") {
    const next = ctx.db.prepare("SELECT next_attempt_at FROM mk_sms_messages WHERE id = ?").get(message.id).next_attempt_at;
    return { retry: Math.max(1000, (next ?? now + 60000) - now) };
  }
  const row = ctx.db.prepare("SELECT reason FROM mk_sms_messages WHERE id = ?").get(message.id);
  return { next: true, log: [outcome, `sms ${message.id}${row && row.reason ? ` : ${row.reason}` : ""}`] };
}

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
    if (!step || step.type === "end") return finish("completed");
    let out;
    switch (step.type) {
      case "wait": {
        log("wait", `${step.amount} ${step.unit}`);
        save(index + 1, now + step.amount * UNITS[step.unit], 0);
        return { done: false, waitMs: step.amount * UNITS[step.unit] };
      }
      // Techniquement une attente ORDINAIRE (même mécanisme de réveil par date) : la seule différence est qu'un
      // événement correspondant, s'il arrive avant le délai, la fait AUSSI reprendre plus tôt — voir onEvent()
      // plus bas, qui ramène wake_at à maintenant quand ça se produit. Jamais d'attente indéfinie : le délai
      // maximal s'applique toujours, événement ou pas.
      case "wait_for_event": {
        log("wait_for_event", `${step.event} (${step.amount} ${step.unit} au plus)`);
        save(index + 1, now + step.amount * UNITS[step.unit], 0);
        return { done: false, waitMs: step.amount * UNITS[step.unit] };
      }
      case "split": {
        const ok = Math.random() * 100 < step.percentage;
        const branch = ok ? step.onA : step.onB;
        log("split", `${step.percentage}% → ${ok ? "A" : "B"} (${branch === "exit" ? "sortie" : branch === "next" ? "étape suivante" : `étape ${branch + 1}`})`);
        if (branch === "exit") return finish("exited", "split");
        out = branch === "next" ? { next: true } : { jump: branch };
        break;
      }
      case "update_field": {
        try {
          if (step.field.startsWith("property:")) setContactProperties(actx, contact.id, { [step.field.slice(9)]: step.value });
          else updateContact(actx, contact.id, { [step.field]: step.value });
          log("update_field", step.field);
        } catch (error) {
          if (!(error instanceof MarketingError)) throw error;
          log("failed", error.message);
        }
        out = { next: true };
        break;
      }
      case "condition": {
        let ok;
        try {
          if (step.check === "opened" || step.check === "clicked") {
            // L'étape référencée (un envoi d'e-mail PLUS TÔT dans ce même passage) a-t-elle été ouverte/cliquée par ce contact ?
            const refStep = steps[step.ref];
            const message = refStep && refStep.campaignId ? ctx.db.prepare("SELECT open_count, click_count FROM mk_messages WHERE campaign_id = ? AND contact_id = ?").get(refStep.campaignId, contact.id) : null;
            ok = Boolean(message && (step.check === "opened" ? message.open_count > 0 : message.click_count > 0));
          } else {
            ok = segments.matches(actx, step.definition, contact.id);
          }
        } catch (error) {
          if (!(error instanceof MarketingError)) throw error;
          log("failed", "condition invalide");
          return finish("exited", "condition_error");
        }
        const branch = ok ? step.onTrue : step.onFalse;
        log("condition", `${ok ? "vraie" : "fausse"} → ${branch === "exit" ? "sortie" : branch === "next" ? "étape suivante" : `étape ${branch + 1}`}`);
        if (branch === "exit") return finish("exited", "condition");
        out = branch === "next" ? { next: true } : { jump: branch };
        break;
      }
      case "add_tag": case "remove_tag": case "add_to_list": case "remove_from_list": {
        try {
          if (step.type === "add_tag") tagContact(actx, contact.id, step.tag);
          else if (step.type === "remove_tag") untagContact(actx, contact.id, step.tag);
          else if (step.type === "add_to_list") addToList(actx, step.listId, [contact.id]);
          else removeFromList(actx, step.listId, [contact.id]);
          log(step.type, step.tag ?? step.listId);
        } catch (error) {
          if (!(error instanceof MarketingError)) throw error;
          log("failed", error.message);
        }
        out = { next: true };
        break;
      }
      case "email":
        out = await sendEmailStep(actx, { run, automation, step, contact, provider, now, attempts });
        break;
      case "sms":
        out = await sendSmsStep(actx, { automation, step, contact, smsProvider, now });
        break;
      default:
        out = { next: true };
    }
    if (out.log) log(out.log[0], out.log[1]);
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
  };
}

module.exports = { onEvent, runAutomation, eventHandler, jobHandlers, eventData };
