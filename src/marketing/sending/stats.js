// Statistiques d'une campagne. Les taux sont en POURCENTAGE des messages envoyés (dénominateur toujours explicite).
// Les limites du suivi sont annoncées avec les chiffres : ils ne doivent jamais être lus comme plus fiables qu'ils ne sont.
const { MarketingError } = require("../errors");
const { checkCtx } = require("../audience/shared");
const { requireCampaign } = require("./campaigns");
const { abSummary } = require("./abtest");
const { campaignRevenue, getWindowDays } = require("../revenue");

const BOUNCE_ALERT = 2; // %
const COMPLAINT_ALERT = 0.1; // %
const MIN_FOR_ALERTS = 20;

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 10000) / 100 : 0);

function campaignStats(ctx, id) {
  checkCtx(ctx);
  const c = requireCampaign(ctx, id);
  const counts = {
    total: c.total_recipients, sent: c.sent_count, delivered: c.delivered_count, bounced: c.bounced_count, complained: c.complained_count, failed: c.failed_count,
    skipped: c.skipped_count, unsubscribed: c.unsubscribed_count, opens: c.open_count, uniqueOpens: c.unique_open_count, clicks: c.click_count, uniqueClicks: c.unique_click_count,
  };
  const rates = {
    delivery: pct(c.delivered_count, c.sent_count), bounce: pct(c.bounced_count, c.sent_count), complaint: pct(c.complained_count, c.sent_count),
    unsubscribe: pct(c.unsubscribed_count, c.sent_count), click: pct(c.unique_click_count, c.sent_count), open: pct(c.unique_open_count, c.sent_count),
  };
  const links = ctx.db
    .prepare("SELECT id, url, click_count, unique_click_count FROM mk_links WHERE campaign_id = ? AND organization_id = ? ORDER BY unique_click_count DESC, click_count DESC, id")
    .all(id, ctx.organizationId)
    .map((l) => ({ id: l.id, url: l.url, clicks: l.click_count, uniqueClicks: l.unique_click_count }));

  const alerts = [];
  if (c.sent_count >= MIN_FOR_ALERTS) {
    if (rates.bounce > BOUNCE_ALERT) alerts.push({ code: "bounce_high", message: `Taux de rebond de ${rates.bounce} % (seuil ${BOUNCE_ALERT} %) : nettoyez votre liste, cela nuit à la réputation d'expédition.` });
    if (rates.complaint > COMPLAINT_ALERT) alerts.push({ code: "complaint_high", message: `Taux de plaintes de ${rates.complaint} % (seuil ${COMPLAINT_ALERT} %) : vérifiez que ces personnes attendaient vos messages.` });
  }
  const notes = [
    "Les ouvertures sont INDICATIVES : la protection de la vie privée d'Apple Mail et certains clients pré-chargent les images, ce qui gonfle ce chiffre ; d'autres bloquent les images, ce qui le réduit. Le taux de clic est plus fiable.",
    "Clics et ouvertures « uniques » : une fois par destinataire. Les clics de robots (antivirus, aperçus de liens) sont enregistrés mais exclus de ces chiffres.",
  ];
  if (c.sent_count > 0 && c.delivered_count === 0 && c.bounced_count === 0) notes.push("Aucun retour de livraison reçu : les rebonds différés ne sont connus qu'avec un fournisseur à webhooks (Resend) correctement configuré.");
  const money = campaignRevenue(ctx, c.id);
  const revenue = { ...money, perRecipient: c.sent_count > 0 ? Math.round(money.cents / c.sent_count) : null, windowDays: getWindowDays(ctx) };
  return { campaign: { id: c.id, name: c.name, status: c.status }, counts, rates, links, alerts, notes, revenue, ab: abSummary(ctx, c) };
}

module.exports = { campaignStats, MarketingError };
