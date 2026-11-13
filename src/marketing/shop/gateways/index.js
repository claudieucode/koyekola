// Passerelles de paiement de la boutique : identifiants par site (chiffrés), adaptateurs PayPal et Flutterwave, clés Stripe propres au site.
// Un adaptateur expose : key, label, fields[], configured(creds), start(order, creds, urls, settings) → { url, ref }, verify(order, ref, creds) → { paid, amountCents, currency, intent? },
// refund(order, pay, amountCents, creds, idemKey) → { ref }, identify(body, headers, creds) → référence de transaction annoncée (à re-vérifier auprès du fournisseur : un message de webhook n'est JAMAIS cru tel quel).
const { encryptSecret, decryptSecret } = require("../../security/crypto");
const siteCond = (s) => (s.siteId == null ? "site_id IS NULL" : "site_id = ?");
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const keyOf = () => process.env.ENCRYPTION_KEY;
const ctxOf = (s, provider) => `shop-gateway:${s.organizationId}:${s.siteId ?? 0}:${provider}`;
const { ZERO_DECIMAL, toMajor, toMinor } = require("./money");

const ADAPTERS = { paypal: require("./paypal"), flutterwave: require("./flutterwave") };
const STRIPE_FIELDS = [{ key: "secret_key", label: "Clé secrète Stripe (sk_…)", secret: true }, { key: "webhook_secret", label: "Secret de webhook (whsec_…)", secret: true }];
const FIELDS = { stripe: STRIPE_FIELDS, paypal: ADAPTERS.paypal.fields, flutterwave: ADAPTERS.flutterwave.fields };
const LABELS = { stripe: "Carte bancaire (Stripe)", paypal: "PayPal", flutterwave: "Mobile Money et cartes (Flutterwave)" };

function getCreds(s, provider) {
  const row = s.db.prepare(`SELECT creds, mode FROM mk_shop_gateways WHERE organization_id = ? AND ${siteCond(s)} AND provider = ?`).get(s.organizationId, ...siteArgs(s), provider);
  if (!row) return null;
  try { return { ...JSON.parse(decryptSecret(row.creds, keyOf(), ctxOf(s, provider))), mode: row.mode }; } catch { return null; }
}
// Enregistre les identifiants : un champ laissé vide CONSERVE la valeur actuelle (on ne ré-affiche jamais un secret) ; « effacer » supprime la passerelle du site.
function saveCreds(s, provider, input, { mode = "live", clear = false } = {}) {
  if (!FIELDS[provider]) throw new Error("Passerelle inconnue.");
  if (clear) { s.db.prepare(`DELETE FROM mk_shop_gateways WHERE organization_id = ? AND ${siteCond(s)} AND provider = ?`).run(s.organizationId, ...siteArgs(s), provider); return; }
  const cur = getCreds(s, provider) || {};
  const next = {};
  for (const f of FIELDS[provider]) {
    const v = String(input[f.key] == null ? "" : input[f.key]).replace(/[\u0000-\u001f\u007f]+/g, "").trim().slice(0, 300);
    next[f.key] = v || cur[f.key] || "";
  }
  const enc = encryptSecret(JSON.stringify(next), keyOf(), ctxOf(s, provider));
  const m = mode === "test" ? "test" : "live";
  s.db.prepare(`INSERT INTO mk_shop_gateways (organization_id, site_id, provider, creds, mode) VALUES (?,?,?,?,?) ON CONFLICT(organization_id, COALESCE(site_id, 0), provider) DO UPDATE SET creds = excluded.creds, mode = excluded.mode, updated_at = datetime('now')`).run(s.organizationId, s.siteId ?? null, provider, enc, m);
}
// Pour l'affichage : quels champs sont renseignés (jamais leur valeur)
function summary(s, provider) {
  const c = getCreds(s, provider);
  return { set: Boolean(c), mode: c ? c.mode : "live", filled: Object.fromEntries((FIELDS[provider] || []).map((f) => [f.key, Boolean(c && c[f.key])])) };
}
// Clé secrète Stripe applicable à une boutique : celle du site si elle en a une, sinon celle du serveur
const stripeKeyFor = (s) => { const c = getCreds(s, "stripe"); return c && c.secret_key ? c.secret_key : process.env.STRIPE_SECRET_KEY || null; };
const stripeWebhookSecretFor = (s) => { const c = getCreds(s, "stripe"); return c && c.webhook_secret ? c.webhook_secret : process.env.STRIPE_WEBHOOK_SECRET || null; };
const adapterFor = (provider) => ADAPTERS[provider] || null;
const configuredFor = (s, provider) => { const a = ADAPTERS[provider]; if (!a) return false; const c = getCreds(s, provider); return Boolean(c && a.configured(c)); };

module.exports = { ADAPTERS, FIELDS, LABELS, ZERO_DECIMAL, toMajor, toMinor, getCreds, saveCreds, summary, stripeKeyFor, stripeWebhookSecretFor, adapterFor, configuredFor };
