// SMS de test depuis les réglages : vérifie que Twilio, l'expéditeur et le pays fonctionnent, AVANT toute campagne.
// Texte FIXE (on ne peut pas s'en servir pour envoyer n'importe quoi à n'importe qui) ; réservé aux administrateurs
// (settings.write) et limité par la route (10 par heure). Le numéro n'est jamais journalisé en entier.
const { MarketingError, audit } = require("../audience/shared");
const { normalizePhone, maskPhone } = require("./phone");
const { getSmsConfig, createSmsProviderFor } = require("./config");
const { SmsSendError } = require("./providers");
const R = require("./render");
const { smsLength } = require("./text");

const TEST_BODY = "KOYEKOLA : ceci est un SMS de test. Votre configuration SMS fonctionne.";

async function sendTestSms(ctx, { to }, deps = {}) {
  const cfg = getSmsConfig(ctx);
  const phone = normalizePhone(String(to ?? ""), { defaultCountry: cfg.defaultCountry });
  if (!phone.ok) throw new MarketingError("invalid_phone", phone.reason);
  if (cfg.provider !== "console" && !cfg.sender) throw new MarketingError("invalid_field", "Enregistrez d'abord un expéditeur.");
  let provider;
  try {
    provider = createSmsProviderFor(ctx, deps);
  } catch (error) {
    throw new MarketingError("invalid_field", error.message);
  }
  try {
    const r = await provider.send({ from: cfg.sender || "KOYEKOLA", to: phone.e164, body: TEST_BODY });
    audit(ctx, "sms.test_sent", "organization", ctx.organizationId, { provider: provider.name, country: phone.country });
    return { ok: true, provider: provider.name, to: maskPhone(phone.e164), providerMessageId: r.providerMessageId };
  } catch (error) {
    if (error instanceof SmsSendError) return { ok: false, provider: provider.name, kind: error.kind, message: error.message, code: error.code };
    throw error;
  }
}

// Test d'UNE campagne : le vrai texte, personnalisé avec la fiche du contact qui porte ce numéro (sinon les valeurs de
// secours), liens laissés tels quels et lien STOP d'exemple. Préfixé « [TEST] » pour ne jamais être pris pour le vrai envoi.
async function sendCampaignTest(ctx, campaignId, { to }, deps = {}) {
  const { requireSmsCampaign } = require("./campaigns");
  const c = requireSmsCampaign(ctx, campaignId);
  if (!c.body.trim()) throw new MarketingError("invalid_field", "Écrivez d'abord le message.");
  const tags = R.unknownTags(c.body);
  if (tags.length) throw new MarketingError("invalid_field", `Balise inconnue : ${tags.join(", ")}.`);
  const cfg = getSmsConfig(ctx);
  const phone = normalizePhone(String(to ?? ""), { defaultCountry: cfg.defaultCountry });
  if (!phone.ok) throw new MarketingError("invalid_phone", phone.reason);
  const contact = ctx.db.prepare("SELECT first_name, last_name FROM mk_contacts WHERE organization_id = ? AND sms_phone = ? LIMIT 1").get(ctx.organizationId, phone.e164) || {};
  const body = `[TEST] ${R.renderSms(c.body, contact, { optOutUrl: R.shortUrl(ctx.baseUrl || "https://votre-site.example", "exemple0") })}`;
  let provider;
  try { provider = createSmsProviderFor(ctx, deps); } catch (error) { throw new MarketingError("invalid_field", error.message); }
  try {
    await provider.send({ from: cfg.sender || "KOYEKOLA", to: phone.e164, body });
    audit(ctx, "sms_campaign.test_sent", "sms_campaign", c.id, { provider: provider.name });
    return { ok: true, provider: provider.name, to: maskPhone(phone.e164), segments: smsLength(body).segments, body };
  } catch (error) {
    if (error instanceof SmsSendError) return { ok: false, provider: provider.name, kind: error.kind, message: error.message, code: error.code };
    throw error;
  }
}

module.exports = { sendTestSms, sendCampaignTest, TEST_BODY };
