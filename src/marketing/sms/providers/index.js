// Fournisseurs SMS : interface commune { name, capabilities, send(message) → { providerMessageId } }.
// message = { from, to (E.164), body, statusCallback? }. Toute erreur d'envoi est une SmsSendError.
const { SmsSendError } = require("./errors");
const { createConsoleSmsProvider } = require("./console");
const { createTwilioSmsProvider } = require("./twilio");

const SMS_PROVIDERS = ["console", "twilio"];

// Expéditeur : nom alphanumérique (1 à 11 caractères, au moins une lettre), numéro E.164, ou service Twilio MG…
// → { kind: "name" | "number" | "service", value } ou null
function parseSmsSender(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (/^\+[1-9]\d{7,14}$/.test(text)) return { kind: "number", value: text };
  if (/^MG[0-9a-f]{32}$/.test(text)) return { kind: "service", value: text };
  if (/^[A-Za-z0-9 ]{1,11}$/.test(text) && /[A-Za-z]/.test(text) && text === text.replace(/\s+/g, " ")) return { kind: "name", value: text };
  return null;
}

function createSmsProvider(config = {}, deps = {}) {
  const provider = config.provider || "console";
  if (!SMS_PROVIDERS.includes(provider)) throw new Error(`Fournisseur SMS inconnu : « ${String(provider).slice(0, 30)} » (${SMS_PROVIDERS.join(", ")}).`);
  if (provider === "twilio") return createTwilioSmsProvider({ accountSid: config.accountSid, authToken: config.authToken, timeoutMs: config.timeoutMs }, deps);
  return createConsoleSmsProvider(deps);
}

module.exports = { SMS_PROVIDERS, SmsSendError, parseSmsSender, createSmsProvider };
