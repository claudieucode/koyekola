// Fournisseurs d'envoi : interface commune { name, capabilities, send(message) → { providerMessageId } }.
// message = { from, to, replyTo, subject, html, text, headers, idempotencyKey }. Toute erreur d'envoi est une SendError.
const { validateEmail } = require("../../audience/email");
const { SendError } = require("./errors");
const { createConsoleProvider } = require("./console");
const { createSmtpProvider } = require("./smtp");
const { createResendProvider } = require("./resend");

const PROVIDERS = ["console", "smtp", "resend"];

// « Nom <adresse> » ou adresse seule → { name, email, formatted } ; null si invalide ou dangereux
function parseSender(value) {
  if (typeof value !== "string" || /\p{Cc}/u.test(value)) return null;
  const text = value.trim();
  const m = /^(.*)<([^<>\s]+)>$/.exec(text);
  const rawName = m ? m[1] : "";
  if (/[<>]/.test(rawName)) return null;
  const check = validateEmail(m ? m[2] : text);
  if (!check.ok) return null;
  const name = rawName.replace(/["<>,;]/g, "").replace(/\s+/g, " ").trim();
  return { name, email: check.email, formatted: name ? `${name} <${check.email}>` : check.email };
}

function createProvider(config = {}, deps = {}) {
  const provider = config.provider || "console";
  if (!PROVIDERS.includes(provider)) throw new Error(`Fournisseur d'envoi inconnu : « ${String(provider).slice(0, 30)} » (${PROVIDERS.join(", ")}).`);
  if (provider === "smtp") return createSmtpProvider({ transport: deps.transport });
  if (provider === "resend") return createResendProvider({ apiKey: config.apiKey, timeoutMs: config.timeoutMs }, deps);
  return createConsoleProvider(deps);
}

module.exports = { PROVIDERS, SendError, parseSender, createProvider };
