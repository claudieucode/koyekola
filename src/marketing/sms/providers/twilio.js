// Fournisseur Twilio (API REST « Messages »). Le jeton n'est jamais journalisé ni inclus dans une erreur ; les corps de
// réponse d'erreur ne sont pas relayés (seul le code d'erreur numérique de Twilio est gardé, pour le diagnostic).
// Expéditeur : un nom (« KOLAKISA », 11 caractères au plus — impossible d'y répondre), un numéro Twilio (+…), ou un
// « Messaging Service » (MG…) qui choisit lui-même le bon expéditeur selon le pays.
const { SmsSendError } = require("./errors");

const API = "https://api.twilio.com/2010-04-01/Accounts";
const DEFAULT_TIMEOUT = 15000;
const ACCOUNT_SID = /^AC[0-9a-f]{32}$/;

// Codes d'erreur Twilio (https://www.twilio.com/docs/api/errors) → type d'erreur
const RECIPIENT = new Set([21211, 21614, 21612]); // numéro invalide / pas un mobile / non joignable depuis cet expéditeur
const CONFIG = new Set([20003, 20404, 21606, 21659, 21408, 21660, 21212, 21705]); // identifiants, expéditeur, pays non autorisé

function createTwilioSmsProvider({ accountSid, authToken, timeoutMs = DEFAULT_TIMEOUT }, { fetch: fetchImpl = globalThis.fetch, log = console } = {}) {
  if (typeof accountSid !== "string" || !ACCOUNT_SID.test(accountSid)) throw new Error("Identifiant de compte Twilio absent ou invalide (AC… : 34 caractères) : enregistrez-le dans les réglages SMS.");
  if (typeof authToken !== "string" || !authToken.trim()) throw new Error("Le jeton Twilio (Auth Token) est absent : enregistrez-le dans les réglages SMS.");
  const auth = `Basic ${Buffer.from(`${accountSid}:${authToken.trim()}`).toString("base64")}`;
  return {
    name: "twilio",
    capabilities: { statusCallbacks: true, inbound: true },
    async send(message) {
      const form = new URLSearchParams({ To: message.to, Body: message.body });
      if (/^MG[0-9a-f]{32}$/.test(message.from)) form.set("MessagingServiceSid", message.from);
      else form.set("From", message.from);
      if (message.statusCallback) form.set("StatusCallback", message.statusCallback);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetchImpl(`${API}/${accountSid}/Messages.json`, {
          method: "POST", signal: controller.signal,
          headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
      } catch {
        log.warn?.("[KOLAKISA] Twilio : requête interrompue (réseau ou délai dépassé).");
        throw new SmsSendError("temporary");
      } finally {
        clearTimeout(timer);
      }
      const status = response.status;
      let body = null;
      try { body = await response.json(); } catch { body = null; }
      const code = body && Number.isInteger(body.code) ? body.code : undefined;
      if (status === 429 || code === 20429) throw new SmsSendError("rate_limited", { status, code, retryAfterMs: 30000 });
      if (status === 401 || status === 403 || CONFIG.has(code)) throw new SmsSendError("config", { status, code });
      if (code === 21610) throw new SmsSendError("opted_out", { status, code });
      if (RECIPIENT.has(code)) throw new SmsSendError("recipient_rejected", { status, code });
      if (status >= 500) throw new SmsSendError("temporary", { status, code });
      if (status < 200 || status >= 300) throw new SmsSendError("permanent", { status, code });
      if (!body || typeof body.sid !== "string" || !body.sid) throw new SmsSendError("temporary", { status });
      return { providerMessageId: body.sid, segments: Number(body.num_segments) || undefined };
    },
  };
}

module.exports = { createTwilioSmsProvider, ACCOUNT_SID };
