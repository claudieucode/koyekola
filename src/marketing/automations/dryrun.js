// Simulation (« dry run ») d'un scénario pour UN contact réel — palier 17. AUCUNE écriture, AUCUN envoi : on parcourt les étapes du brouillon et on dit,
// pour chacune, ce qui se passerait. Ce qui est lecture seule est évalué pour de vrai (conditions et embranchements sur les vraies données du contact,
// consentement et liste de protection pour un e-mail ou un SMS) ; ce qui écrit (étiquette, liste, champ, note, webhook…) est seulement annoncé.
//  - une attente est comptée (durée cumulée), jamais attendue ;
//  - « tirage au sort » : les deux chemins sont indiqués, le chemin A est suivi ;
//  - « e-mail ouvert / cliqué » : aucun e-mail n'étant réellement parti, la condition est fausse (dit clairement) ;
//  - un contact non joignable sortirait du scénario à l'e-mail (comme à l'exécution).
const { MarketingError } = require("../errors");
const { getContact } = require("../audience/contacts");
const compliance = require("../compliance");
const templates = require("../templates");
const { isSmsSendable } = require("../sms/consent");
const { STEP_LABELS } = require("../../utils/stepLabels");
const { getAction } = require("./actions");

const REASON = { not_found: "contact introuvable", suppressed: "adresse protégée (rebond, plainte ou blocage)", unsubscribed: "contact désinscrit", not_subscribed: "pas de consentement enregistré", no_consent: "aucune preuve de consentement",
  inactive_record: "fiche archivée, désactivée ou fusionnée", list_unsubscribed: "désinscrit de cette audience", category_opted_out: "catégorie refusée" };
const READ_ONLY = new Set(["condition", "route", "split", "wait", "wait_until", "wait_for_event", "end"]);
const MAX_STEPS = 100;

function describeEffect(ctx, step, contact, automation) {
  switch (step.type) {
    case "email": {
      const t = templates.getTemplate(ctx, step.templateId);
      if (!t) return { outcome: "blocked", detail: "Le modèle de cet e-mail n'existe plus : le scénario ne pourrait pas être activé.", exit: true };
      const marketing = automation.kind === "marketing";
      const check = marketing ? compliance.isSendable(ctx, contact.id, step.listId ? { listId: step.listId } : {}) : transactionalCheck(ctx, contact);
      if (!check.ok) return { outcome: "blocked", detail: `E-mail « ${t.name} » NON envoyé : ${REASON[check.reason] || check.reason}. À l'exécution, ce contact sortirait du scénario.`, exit: true };
      return { outcome: "would_execute", detail: `E-mail « ${t.name} » (${marketing ? "marketing" : "transactionnel"}) : le contact est joignable, l'envoi passerait par l'Email Engine.` };
    }
    case "sms": {
      const check = isSmsSendable(ctx, contact.id);
      return check.ok ? { outcome: "would_execute", detail: "SMS : le contact a un accord SMS prouvé, l'envoi serait possible." } : { outcome: "blocked", detail: `SMS NON envoyé : ${check.reason}.`, exit: true };
    }
    case "add_tag": return { outcome: "would_execute", detail: `Ajouterait l'étiquette « ${step.tag} » (Contact Core).` };
    case "remove_tag": return { outcome: "would_execute", detail: `Retirerait l'étiquette « ${step.tag} ».` };
    case "add_to_list": case "remove_from_list": {
      const l = ctx.db.prepare("SELECT name FROM mk_lists WHERE id = ? AND organization_id = ?").get(step.listId, ctx.organizationId);
      return { outcome: l ? "would_execute" : "blocked", detail: l ? `${step.type === "add_to_list" ? "Ajouterait à" : "Retirerait de"} l'audience « ${l.name} » (cela ne donne aucun consentement).` : "Audience introuvable." };
    }
    case "update_field": return { outcome: "would_execute", detail: `Mettrait à jour le champ « ${step.field} ».` };
    case "start_automation": case "stop_automation": return { outcome: "would_execute", detail: `${step.type === "start_automation" ? "Démarrerait" : "Arrêterait"} un autre scénario.` };
    case "webhook_call": return { outcome: "would_execute", detail: "Appellerait l'adresse web configurée (rien n'est appelé en simulation)." };
    case "notify_team": return { outcome: "would_execute", detail: "Préviendrait l'équipe (rien n'est envoyé en simulation)." };
    default: return { outcome: "would_execute", detail: `${STEP_LABELS[step.type] || step.type} : serait exécutée (rien n'est écrit en simulation).` };
  }
}

// Transactionnel : ignore la désinscription marketing mais respecte la liste de protection (même règle que le moteur)
function transactionalCheck(ctx, contact) {
  const blocked = ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(ctx.organizationId, contact.email);
  return blocked || contact.record_status !== "active" ? { ok: false, reason: "suppressed" } : { ok: true };
}

const jumpOf = (step, out) => {
  if (out.exit) return { stop: out.exit };
  if (out.complete) return { stop: "completed" };
  if (out.jump !== undefined) return { index: out.jump };
  if (step.next !== undefined && step.next !== "next") return step.next === "exit" ? { stop: "exit" } : { index: step.next };
  return null;
};

async function dryRun(ctx, automation, contactId) {
  const contact = Number.isInteger(contactId) ? getContact(ctx, contactId) : null;
  if (!contact) throw new MarketingError("not_found", "Contact introuvable.");
  const report = [];
  let index = 0, virtualMs = 0, end = "completed";
  const dryCtx = { ...ctx, bus: null, audit: false }; // lecture seule : aucun événement
  const steps = automation.steps;
  for (let guard = 0; guard < MAX_STEPS; guard++) {
    const step = steps[index];
    if (!step) { end = "completed"; break; }
    const base = { index, type: step.type, label: STEP_LABELS[step.type] || step.type, at: virtualMs };
    if (!READ_ONLY.has(step.type)) {
      const e = describeEffect(ctx, step, contact, automation);
      report.push({ ...base, outcome: e.outcome, detail: e.detail });
      if (e.exit) { end = "exited"; break; }
      const j = jumpOf(step, {});
      if (j && j.stop) { end = j.stop === "completed" ? "completed" : "exited"; break; }
      index = j && j.index !== undefined ? j.index : index + 1;
      continue;
    }
    const action = getAction(step.type);
    let out;
    if (step.type === "split") {
      const branch = step.onA;
      out = branch === "exit" ? { exit: "split" } : branch === "next" ? { next: true } : { jump: branch };
      report.push({ ...base, outcome: "branch", detail: `Tirage au sort ${step.percentage} % / ${100 - step.percentage} % : les deux chemins existent ; la simulation suit le chemin A.` });
    } else {
      out = await action.execute({ ctx: dryCtx, run: { id: 0, event_data: "{}" }, automation, step, steps, index, contact, now: Date.now(), attempts: 0 });
      if (out.wait !== undefined) { virtualMs += out.wait; report.push({ ...base, outcome: "wait", detail: `Attente de ${Math.round(out.wait / 60000)} min (comptée, pas attendue).` }); }
      else if (out.log) report.push({ ...base, outcome: "branch", detail: out.log[1] + (step.check === "opened" || step.check === "clicked" ? " — simulation : aucun e-mail n'est réellement parti, donc non ouvert / non cliqué." : "") });
      else report.push({ ...base, outcome: out.complete ? "end" : "step", detail: out.complete ? "Fin du passage." : "Étape passée." });
    }
    const j = jumpOf(step, out);
    if (out.complete) { end = "completed"; break; }
    if (out.exit) { end = "exited"; break; }
    if (out.retry !== undefined) { report.push({ ...base, outcome: "blocked", detail: "Cette étape devrait être réessayée plus tard." }); end = "exited"; break; }
    index = j && j.index !== undefined ? j.index : out.jump !== undefined ? out.jump : index + 1;
  }
  return { contactId: contact.id, status: end, steps: report, totalWaitMs: virtualMs, readOnly: true, notice: "Simulation : rien n'a été envoyé ni modifié." };
}

module.exports = { dryRun, READ_ONLY };
