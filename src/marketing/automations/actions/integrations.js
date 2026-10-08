// Action d'intégration : « Envoyer vers un webhook ». Réutilise l'infrastructure des webhooks sortants de KOLAKISA : point d'accès
// configuré (Intégrations → Webhooks), requête POST SIGNÉE (HMAC-SHA256 avec horodatage), blocage des adresses privées vérifié à
// chaque envoi, reprises automatiques par la file (jusqu'à 6 essais, délai croissant), journal « Dernières livraisons ». L'envoi est
// PLANIFIÉ dans la file (jamais dans le passage du scénario : un destinataire lent ne bloque aucun contact) ; le résultat de chaque
// livraison est visible dans le webhook. Une étape rejouée ne renvoie rien (clé d'idempotence par passage et par étape).
const { MarketingError } = require("../../errors");
const { enqueue } = require("../../queue/jobs");
const { getContact } = require("../../audience/contacts");
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { bad, withNext } = require("./shared");

const MAX_FIELDS = 20;
const KEY = /^[a-z][a-z0-9_]{0,39}$/i;
const MAX_VALUE = 300;
const { BASE_VARIABLES: VARIABLES, valuesFor, render, unknownTokens, listText } = require("./variables");

const endpointOf = (ctx, id) => ctx.db.prepare("SELECT id, name, enabled FROM mk_webhook_endpoints WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);

defineAction({
  type: "webhook_call", category: "integrations", label: STEP_LABELS.webhook_call, description: "Une requête signée vers un de vos webhooks", version: 1, status: "available", requires: ["webhook_endpoint"],
  validate({ ctx, raw, i, steps }) {
    if (!Number.isInteger(raw.endpointId) || raw.endpointId < 1) throw bad(i, "choisissez le webhook (point d'accès) à appeler.");
    if (!endpointOf(ctx, raw.endpointId)) throw new MarketingError("not_found", `Étape ${i + 1} : webhook introuvable.`);
    const list = raw.fields === undefined ? [] : raw.fields;
    if (!Array.isArray(list) || list.length > MAX_FIELDS) throw bad(i, `les données envoyées sont une liste de ${MAX_FIELDS} champs au plus.`);
    const seen = new Set();
    const fields = list.map((f) => {
      if (!f || typeof f !== "object") throw bad(i, "champ de données invalide.");
      const key = typeof f.key === "string" ? f.key.trim() : "";
      if (!KEY.test(key)) throw bad(i, `nom de champ invalide « ${String(f.key).slice(0, 20)} » (lettres, chiffres et « _ », commence par une lettre, 40 caractères au plus).`);
      if (seen.has(key.toLowerCase())) throw bad(i, `le champ « ${key} » est présent deux fois.`);
      seen.add(key.toLowerCase());
      const value = typeof f.value === "string" ? f.value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim() : "";
      if (value.length > MAX_VALUE) throw bad(i, `valeur de « ${key} » trop longue (${MAX_VALUE} caractères au plus).`);
      const unknown = unknownTokens(value, VARIABLES);
      if (unknown.length) throw bad(i, `variable inconnue dans « ${key} » : ${unknown.join(", ")}. Variables : ${listText(VARIABLES)}.`);
      return { key, value };
    });
    return withNext({ type: "webhook_call", endpointId: raw.endpointId, fields }, raw, i, steps);
  },
  execute({ ctx, run, automation, index, step, contact, now }) {
    const endpoint = endpointOf(ctx, step.endpointId);
    if (!endpoint) return { next: true, log: ["failed", "webhook introuvable (supprimé ?) : rien envoyé"] };
    if (!endpoint.enabled) return { next: true, log: ["skipped", `webhook « ${endpoint.name} » en pause : rien envoyé`] };
    if (!ctx.tokenKey) return { next: true, log: ["failed", "clé de chiffrement absente (ENCRYPTION_KEY) : le secret du webhook est illisible, rien envoyé"] };
    const fresh = getContact(ctx, contact.id) || contact;
    const vars = valuesFor({ contact: fresh, run });
    const fields = {};
    for (const f of step.fields) fields[f.key] = render(f.value, vars);
    const metadata = {
      contact: { id: fresh.id, email: fresh.email, first_name: fresh.first_name || "", last_name: fresh.last_name || "" },
      automation: { id: automation.id, name: automation.name }, step: index + 1, fields,
    };
    const r = enqueue(ctx.db, {
      organizationId: ctx.organizationId, type: "webhook.deliver", priority: 6, maxAttempts: 6,
      payload: { endpointId: endpoint.id, eventName: "automation.webhook", eventId: `automation-${run.id}-${index}`, occurredAt: new Date(now).toISOString(), metadata },
      idempotencyKey: `webhook:automation:${endpoint.id}:${run.id}:${index}`,
    });
    return { next: true, log: r.duplicate ? ["already_done", `envoi vers « ${endpoint.name} » déjà planifié par cette étape`] : ["webhook_call", `envoi planifié vers « ${endpoint.name} » (résultat : Intégrations → Webhooks)`] };
  },
});

module.exports = { VARIABLES };
