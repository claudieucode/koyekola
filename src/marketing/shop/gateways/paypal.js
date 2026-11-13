// PayPal (API Orders v2) : page d'approbation hébergée par PayPal, capture côté serveur, vérification auprès de PayPal. Identifiants du SITE (client id + secret). Mode « test » = bac à sable PayPal.
// PAYPAL_API_BASE ne sert qu'aux tests (faux serveur).
const fetchJson = async (url, opts) => {
  const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(15000) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`PayPal ${r.status} : ${(data && (data.message || data.error_description || data.name)) || "réponse inattendue"}`);
  return data;
};
const base = (creds) => String(process.env.PAYPAL_API_BASE || (creds.mode === "test" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com")).replace(/\/+$/, "");
async function token(creds) {
  const auth = Buffer.from(`${creds.client_id}:${creds.secret}`).toString("base64");
  const d = await fetchJson(`${base(creds)}/v1/oauth2/token`, { method: "POST", headers: { authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!d.access_token) throw new Error("PayPal : jeton absent");
  return d.access_token;
}
const { toMajor, toMinor } = require("./money");
module.exports = {
  key: "paypal", label: "PayPal",
  fields: [{ key: "client_id", label: "Client ID PayPal", secret: false }, { key: "secret", label: "Secret PayPal", secret: true }],
  configured: (c) => Boolean(c && c.client_id && c.secret),
  async start(order, creds, { successUrl, cancelUrl }) {
    const t = await token(creds);
    const cur = String(order.currency).toUpperCase();
    const o = await fetchJson(`${base(creds)}/v2/checkout/orders`, { method: "POST", headers: { authorization: `Bearer ${t}`, "content-type": "application/json", "PayPal-Request-Id": `kw-${order.id}-${order.number}` }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ reference_id: order.number, custom_id: `shop:${order.id}`, amount: { currency_code: cur, value: toMajor(order.total_cents, cur).toFixed(String(cur).toLowerCase() === "jpy" ? 0 : 2) } }], payment_source: { paypal: { experience_context: { return_url: successUrl, cancel_url: cancelUrl, user_action: "PAY_NOW" } } } }) });
    const link = (o.links || []).find((l) => l.rel === "payer-action" || l.rel === "approve");
    if (!o.id || !link) throw new Error("PayPal : commande sans lien d'approbation");
    return { url: link.href, ref: o.id };
  },
  // Relit la commande ; si le client a approuvé, la capture (idempotent) ; « paid » seulement si PayPal annonce COMPLETED
  async verify(order, ref, creds) {
    const t = await token(creds); const h = { authorization: `Bearer ${t}`, "content-type": "application/json" };
    let o = await fetchJson(`${base(creds)}/v2/checkout/orders/${encodeURIComponent(ref)}`, { headers: h });
    if (o.status === "APPROVED") o = await fetchJson(`${base(creds)}/v2/checkout/orders/${encodeURIComponent(ref)}/capture`, { method: "POST", headers: { ...h, "PayPal-Request-Id": `kw-cap-${order.id}-${ref}` }, body: "{}" });
    if (o.status !== "COMPLETED") return { paid: false, status: o.status };
    const cap = o.purchase_units && o.purchase_units[0] && o.purchase_units[0].payments && o.purchase_units[0].payments.captures && o.purchase_units[0].payments.captures[0];
    if (!cap || cap.status !== "COMPLETED") return { paid: false, status: "pending" };
    const pu = o.purchase_units[0];
    if (pu.custom_id && pu.custom_id !== `shop:${order.id}`) return { paid: false, status: "mismatch" };
    return { paid: true, amountCents: toMinor(cap.amount.value, cap.amount.currency_code), currency: String(cap.amount.currency_code).toLowerCase(), intent: cap.id };
  },
  async refund(order, pay, amountCents, creds, idem) {
    const t = await token(creds); const cur = String(order.currency).toUpperCase();
    const r = await fetchJson(`${base(creds)}/v2/payments/captures/${encodeURIComponent(pay.provider_intent)}/refund`, { method: "POST", headers: { authorization: `Bearer ${t}`, "content-type": "application/json", "PayPal-Request-Id": idem }, body: JSON.stringify({ amount: { currency_code: cur, value: toMajor(amountCents, cur).toFixed(2) } }) });
    if (!r.id) throw new Error("PayPal : remboursement sans identifiant");
    return { ref: r.id };
  },
  // Un message de webhook PayPal n'est jamais cru : on en extrait seulement l'identifiant de la commande PayPal, que verify() relit auprès de PayPal
  identify(body) {
    const r = body && body.resource;
    const id = r && (r.supplementary_data && r.supplementary_data.related_ids && r.supplementary_data.related_ids.order_id || (r.id && String(body.event_type || "").startsWith("CHECKOUT.ORDER") ? r.id : null));
    return id ? String(id) : null;
  },
};
