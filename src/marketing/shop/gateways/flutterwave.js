// Flutterwave (v3) : paiement hébergé — Mobile Money (MTN, Orange, Airtel, M-Pesa… selon le pays) et cartes. Identifiants du SITE. Vérification auprès de Flutterwave à chaque retour et chaque webhook.
// FLUTTERWAVE_API_BASE ne sert qu'aux tests. La référence de transaction (tx_ref) est celle de notre commande : « kw-<id>-<numéro> ».
const { toMajor, toMinor } = require("./money");
const api = () => String(process.env.FLUTTERWAVE_API_BASE || "https://api.flutterwave.com").replace(/\/+$/, "");
const call = async (creds, method, path, body) => {
  const r = await fetch(`${api()}${path}`, { method, headers: { authorization: `Bearer ${creds.secret_key}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.status === "error") throw new Error(`Flutterwave ${r.status} : ${(d && d.message) || "réponse inattendue"}`);
  return d;
};
const txRefOf = (order) => `kw-${order.id}-${order.number}`;
module.exports = {
  key: "flutterwave", label: "Mobile Money et cartes (Flutterwave)",
  fields: [{ key: "secret_key", label: "Clé secrète Flutterwave (FLWSECK-…)", secret: true }, { key: "webhook_hash", label: "Hash secret des webhooks (à choisir, identique dans Flutterwave)", secret: true }],
  configured: (c) => Boolean(c && c.secret_key && c.webhook_hash),
  async start(order, creds, { successUrl }) {
    const ref = txRefOf(order);
    const d = await call(creds, "POST", "/v3/payments", { tx_ref: ref, amount: toMajor(order.total_cents, order.currency), currency: String(order.currency).toUpperCase(), redirect_url: successUrl, customer: { email: order.email }, customizations: { title: `Commande ${order.number}` }, meta: { order: order.number } });
    const url = d.data && d.data.link;
    if (!url) throw new Error("Flutterwave : pas de lien de paiement");
    return { url, ref };
  },
  async verify(order, ref, creds) {
    const d = await call(creds, "GET", `/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(ref)}`);
    const t = d.data;
    if (!t || t.tx_ref !== ref) return { paid: false, status: "unknown" };
    if (t.status !== "successful") return { paid: false, status: t.status || "pending" };
    return { paid: true, amountCents: toMinor(t.amount, t.currency), currency: String(t.currency).toLowerCase(), intent: String(t.id) };
  },
  async refund(order, pay, amountCents, creds) {
    const r = await call(creds, "POST", `/v3/transactions/${encodeURIComponent(pay.provider_intent)}/refund`, { amount: toMajor(amountCents, order.currency) });
    return { ref: String((r.data && r.data.id) || `flw-${pay.provider_intent}-${amountCents}`) };
  },
  // Webhook : l'en-tête « verif-hash » doit valoir le hash secret du site ; on n'en retient que la référence, relue ensuite auprès de Flutterwave
  identify(body, headers, creds) {
    const given = String((headers && (headers["verif-hash"] || headers["Verif-Hash"])) || "");
    const a = Buffer.from(given), b = Buffer.from(String(creds.webhook_hash || ""));
    if (!creds.webhook_hash || a.length !== b.length || !require("node:crypto").timingSafeEqual(a, b)) return null;
    const ref = body && body.data && (body.data.tx_ref || (body.event && body.data.tx_ref));
    return typeof ref === "string" && /^kw-\d+-[A-Za-z0-9_-]+$/.test(ref) ? ref : null;
  },
  txRefOf,
};
