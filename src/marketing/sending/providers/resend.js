// Fournisseur Resend (API HTTP). La clé n'est jamais journalisée ni incluse dans une erreur ; les corps de réponse d'erreur
// ne sont pas relayés. Idempotency-Key : un renvoi du même message n'est pas livré deux fois.
const crypto = require("crypto");
const { SendError } = require("./errors");

const ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TIMEOUT = 15000;

function createResendProvider({ apiKey, timeoutMs = DEFAULT_TIMEOUT }, { fetch: fetchImpl = globalThis.fetch, log = console } = {}) {
  if (typeof apiKey !== "string" || !apiKey.trim()) throw new Error("La clé d'API Resend est absente : enregistrez-la dans les réglages d'envoi.");
  return {
    name: "resend",
    capabilities: { webhooks: true, idempotency: true },
    async send(message) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetchImpl(ENDPOINT, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
            ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
          },
          body: JSON.stringify({
            from: message.from, to: [message.to], subject: message.subject, html: message.html, text: message.text,
            ...(message.replyTo ? { reply_to: message.replyTo } : {}), ...(message.headers ? { headers: message.headers } : {}),
          }),
        });
      } catch {
        log.warn?.("[KOYEKOLA] Resend : requête interrompue (réseau ou délai dépassé).");
        throw new SendError("temporary");
      } finally {
        clearTimeout(timer);
      }
      const status = response.status;
      if (status === 429) {
        const seconds = Number(response.headers && response.headers.get && response.headers.get("retry-after"));
        throw new SendError("rate_limited", { status, retryAfterMs: Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 3600) * 1000 : 30000 });
      }
      if (status === 401 || status === 403) throw new SendError("config", { status });
      if (status >= 500) throw new SendError("temporary", { status });
      if (status < 200 || status >= 300) throw new SendError("permanent", { status });
      let body;
      try { body = await response.json(); } catch { body = null; }
      if (!body || typeof body.id !== "string" || !body.id) throw new SendError("temporary", { status });
      return { providerMessageId: body.id };
    },
  };
}
// ---------- Webhooks entrants (signature Svix : id.horodatage.corps signé en HMAC-SHA256) ----------
const TOLERANCE_S = 300;

function verifySvixSignature({ rawBody, headers = {}, secret, now = Date.now() }) {
  if (typeof secret !== "string" || !secret.startsWith("whsec_")) return false;
  const id = headers["svix-id"];
  const timestamp = headers["svix-timestamp"];
  const signatures = headers["svix-signature"];
  if (typeof id !== "string" || typeof timestamp !== "string" || typeof signatures !== "string" || !/^\d{9,12}$/.test(timestamp)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > TOLERANCE_S) return false; // anti-rejeu : ni trop ancien, ni dans le futur
  const key = Buffer.from(secret.slice(6), "base64");
  if (key.length < 8) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody ?? "");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

// Événement Resend → { kind: delivered | bounced | complained | ignored, providerMessageId, hard, at }
// Les ouvertures/clics du fournisseur sont ignorés (le suivi est fait par ce module). Un rebond n'est « dur » que si le
// fournisseur dit explicitement « Permanent » : dans le doute, jamais de suppression à tort.
function parseResendEvent(event) {
  const ignored = { kind: "ignored" };
  if (!event || typeof event !== "object" || typeof event.type !== "string" || !event.data || typeof event.data.email_id !== "string" || !event.data.email_id) return ignored;
  const kinds = { "email.delivered": "delivered", "email.bounced": "bounced", "email.complained": "complained" };
  const kind = kinds[event.type];
  if (!kind) return ignored;
  const parsed = Date.parse(event.created_at);
  return {
    kind, providerMessageId: event.data.email_id, at: Number.isFinite(parsed) ? parsed : Date.now(),
    hard: kind === "bounced" && String(event.data.bounce && event.data.bounce.type).toLowerCase() === "permanent",
  };
}

module.exports = { createResendProvider, verifySvixSignature, parseResendEvent };
