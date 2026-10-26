// Garde de réputation d'expéditeur : une campagne EN COURS est mise en pause toute seule quand ses retours deviennent dangereux pour le domaine d'envoi.
// Seuils (documentés dans docs/email-marketing/07_DELIVERABILITY.md) :
//  - plaintes pour spam ≥ 0,3 % des messages envoyés : seuil que les grandes messageries (Google, Yahoo) disent ne jamais devoir atteindre ;
//  - rebonds permanents ≥ 5 % : signe d'une liste ancienne ou mal collectée.
// Un échantillon minimal évite de réagir à 1 retour sur 3 envois. La reprise reste une décision humaine (bouton « Reprendre ») : le garde ne se relance
// pas seul tant que le seuil est dépassé, il ne fait que couper.
const { audit } = require("../audience/shared");

const MIN_SENT = 100;
const MAX_COMPLAINT_RATE = 0.003;
const MAX_HARD_BOUNCE_RATE = 0.05;

// Fonction pure : décision à partir des compteurs
function assess({ sent, bounced, complained }, { margin = 1 } = {}) {
  const s = Number(sent) || 0;
  if (s < MIN_SENT) return { ok: true };
  const complaintRate = (Number(complained) || 0) / s;
  const bounceRate = (Number(bounced) || 0) / s;
  if (complaintRate >= MAX_COMPLAINT_RATE * margin) return { ok: false, reason: "complaints", rate: complaintRate, message: `Envoi mis en pause automatiquement : ${(complaintRate * 100).toFixed(2).replace(".", ",")} % de plaintes pour spam (seuil ${(MAX_COMPLAINT_RATE * 100).toString().replace(".", ",")} %). Vérifiez l'origine de la liste avant de reprendre.` };
  if (bounceRate >= MAX_HARD_BOUNCE_RATE * margin) return { ok: false, reason: "bounces", rate: bounceRate, message: `Envoi mis en pause automatiquement : ${(bounceRate * 100).toFixed(1).replace(".", ",")} % de rebonds permanents (seuil ${MAX_HARD_BOUNCE_RATE * 100} %). Nettoyez la liste avant de reprendre.` };
  return { ok: true };
}

// Met la campagne en pause si nécessaire ; renvoie { paused, reason? }. Sans effet sur une campagne qui n'est pas en cours d'envoi.
function guardCampaign(ctx, campaignId) {
  const c = ctx.db.prepare("SELECT id, status, sent_count, bounced_count, complained_count FROM mk_campaigns WHERE id = ? AND organization_id = ?").get(campaignId, ctx.organizationId);
  if (!c || c.status !== "sending") return { paused: false };
  // Reprise manuelle après une pause de réputation : l'équipe a décidé en connaissance de cause ; le garde ne recoupe qu'au DOUBLE du seuil
  const last = (action) => (ctx.db.prepare("SELECT id, metadata FROM mk_audit_logs WHERE organization_id = ? AND resource_type = 'campaign' AND resource_id = ? AND action = ? ORDER BY id DESC LIMIT 1").get(ctx.organizationId, String(campaignId), action));
  const resumed = last("campaign.resumed");
  const pausedByUs = ctx.db.prepare("SELECT id FROM mk_audit_logs WHERE organization_id = ? AND resource_type = 'campaign' AND resource_id = ? AND action = 'campaign.paused' AND metadata LIKE '%\"reputation\"%' ORDER BY id DESC LIMIT 1").get(ctx.organizationId, String(campaignId));
  const margin = resumed && pausedByUs && resumed.id > pausedByUs.id ? 2 : 1;
  const verdict = assess({ sent: c.sent_count, bounced: c.bounced_count, complained: c.complained_count }, { margin });
  if (verdict.ok) return { paused: false };
  const changed = ctx.db.prepare("UPDATE mk_campaigns SET status = 'paused', error = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ? AND status = 'sending'").run(verdict.message.slice(0, 500), campaignId, ctx.organizationId).changes;
  if (!changed) return { paused: false };
  audit(ctx, "campaign.paused", "campaign", campaignId, { reason: "reputation", cause: verdict.reason, rate: Math.round(verdict.rate * 10000) / 10000 });
  return { paused: true, reason: verdict.reason };
}

module.exports = { MIN_SENT, MAX_COMPLAINT_RATE, MAX_HARD_BOUNCE_RATE, assess, guardCampaign };
