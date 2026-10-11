// Attribution des achats (palier 21) — deux modèles simples et documentés. Aucune prétention de précision : c'est une lecture, pas une preuve de causalité.
//  - Premier contact (first touch) : la provenance de la PREMIÈRE visite connue du contact dans la fenêtre de recherche avant l'achat.
//  - Dernier contact (last touch)  : la provenance de la DERNIÈRE visite connue du contact avant l'achat.
// Seules les visites suivies avec l'accord du visiteur ET reliées à un contact existent : un achat sans visite connue est « Non attribué » (jamais deviné).
// La provenance vient de la classification EXISTANTE (funnels/events.js#classify : paid / email / social / campaign / organic / referral / direct).
const { classify } = require("../funnels/events");
const { sqlUtc } = require("./period");

const LOOKBACK_DAYS = 30;
const MODELS = { last: "Dernier contact", first: "Premier contact" };
const UNATTRIBUTED = "unattributed";
const SOURCE_LABELS = { paid: "Publicité payante", email: "E-mail", social: "Réseaux sociaux", campaign: "Campagne (UTM)", organic: "Recherche naturelle", referral: "Lien externe", direct: "Direct", [UNATTRIBUTED]: "Non attribué" };

// Commandes de la période avec leur contact (compte relié) — lecture des tables de la boutique, jamais recopiées
function ordersWithContact(ctx, P, limit = 5000) {
  if (!ctx.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get()) return [];
  return ctx.db.prepare(`SELECT o.id, o.total_cents, o.created_at, c.id AS contact_id FROM orders o JOIN users u ON u.id = o.user_id
      LEFT JOIN mk_contacts c ON c.organization_id = ? AND c.lms_user_id = u.id AND c.email = lower(trim(u.email))
    WHERE o.created_at >= ? AND o.created_at < ? ORDER BY o.id LIMIT ?`).all(ctx.organizationId, sqlUtc(P.start), sqlUtc(P.end), limit)
    .map((o) => ({ ...o, at: Date.parse(`${o.created_at.replace(" ", "T")}Z`) }));
}

// { orderId → { first, last } } (provenances classées) pour une liste de commandes
function touchesOf(ctx, orders) {
  const out = new Map();
  const ids = [...new Set(orders.map((o) => o.contact_id).filter(Number.isInteger))];
  if (!ids.length) return out;
  const minAt = Math.min(...orders.map((o) => o.at)) - LOOKBACK_DAYS * 86400000;
  const maxAt = Math.max(...orders.map((o) => o.at));
  const byContact = new Map();
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    const rows = ctx.db.prepare(`SELECT contact_id, occurred_at, utm_source, utm_medium, utm_campaign, referrer FROM mk_web_events
      WHERE organization_id = ? AND type = 'session_start' AND contact_id IN (${chunk.map(() => "?").join(",")}) AND occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at, id`).all(ctx.organizationId, ...chunk, minAt, maxAt);
    for (const r of rows) { if (!byContact.has(r.contact_id)) byContact.set(r.contact_id, []); byContact.get(r.contact_id).push(r); }
  }
  for (const o of orders) {
    const list = (byContact.get(o.contact_id) || []).filter((t) => t.occurred_at <= o.at && t.occurred_at >= o.at - LOOKBACK_DAYS * 86400000);
    if (!list.length) continue;
    out.set(o.id, { first: classify(list[0]), last: classify(list[list.length - 1]) });
  }
  return out;
}

function bySource(ctx, P, { model = "last" } = {}) {
  const m = Object.hasOwn(MODELS, model) ? model : "last";
  const orders = ordersWithContact(ctx, P);
  const touches = touchesOf(ctx, orders);
  const groups = new Map();
  let attributed = 0;
  for (const o of orders) {
    const t = touches.get(o.id);
    const src = t ? t[m] : { source: UNATTRIBUTED, campaign: "" };
    if (t) attributed += 1;
    const key = `${src.source}\u0000${src.campaign || ""}`;
    const g = groups.get(key) || { source: src.source, label: SOURCE_LABELS[src.source] || src.source, campaign: src.campaign || "", orders: 0, revenueCents: 0 };
    g.orders += 1; g.revenueCents += o.total_cents;
    groups.set(key, g);
  }
  return {
    model: m, modelLabel: MODELS[m], lookbackDays: LOOKBACK_DAYS, orders: orders.length, attributed,
    rows: [...groups.values()].sort((a, b) => b.revenueCents - a.revenueCents || b.orders - a.orders),
    notes: [`${MODELS[m]} : ${m === "first" ? "première" : "dernière"} visite suivie du contact dans les ${LOOKBACK_DAYS} jours précédant l'achat.`, "Seuls les visiteurs ayant accepté la mesure et reliés à un contact sont attribuables : les autres achats sont « Non attribué »."],
  };
}

module.exports = { bySource, ordersWithContact, touchesOf, MODELS, SOURCE_LABELS, UNATTRIBUTED, LOOKBACK_DAYS };
