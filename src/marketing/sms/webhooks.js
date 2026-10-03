// Messages reçus de Twilio, signés (en-tête X-Twilio-Signature : HMAC-SHA1 du jeton sur l'adresse + les paramètres triés).
//  - Rappels de statut : « delivered » → livré ; « undelivered » / « failed » → non livré (numéro inexistant ou fixe :
//    numéro bloqué comme invalide).
//  - SMS entrants (numéro Twilio uniquement : un expéditeur « nom » ne peut pas recevoir de réponse) :
//      STOP, ARRET, ANNULER… → numéro bloqué (STOP) ; START → la personne redonne ELLE-MÊME son accord ;
//      AIDE / HELP → message d'information. Mots-clés repris de Mailchimp, plus leurs équivalents français.
const crypto = require("crypto");
const { addSmsSuppression, recordSmsConsent } = require("./consent");
const { normalizePhone } = require("./phone");

const STOP_WORDS = new Set(["STOP", "STOPALL", "STOP SMS", "ARRET", "ARRETER", "ANNULER", "CANCEL", "END", "FIN", "QUIT", "UNSUBSCRIBE", "DESINSCRIRE", "DESABONNER", "OPTOUT", "OPT OUT", "REVOKE"]);
const START_WORDS = new Set(["START", "UNSTOP", "REPRENDRE", "ABONNER"]);
const HELP_WORDS = new Set(["HELP", "AIDE", "INFO"]);
const REPLIES = {
  stop: "KOLAKISA : vous ne recevrez plus nos SMS. Repondez START pour vous reinscrire.",
  start: "KOLAKISA : vous etes de nouveau inscrit(e) a nos SMS. Repondez STOP pour arreter.",
  help: "KOLAKISA : SMS d'information sur nos formations. Repondez STOP pour ne plus en recevoir.",
};
// Réponses sans accent : elles restent dans l'alphabet GSM-7 (un seul SMS facturé)

function verifyTwilioSignature({ url, params = {}, signature, authToken }) {
  if (typeof signature !== "string" || !signature || typeof authToken !== "string" || !authToken) return false;
  const data = url + Object.keys(params).sort().map((k) => `${k}${params[k]}`).join("");
  const expected = crypto.createHmac("sha1", authToken).update(data, "utf8").digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

const keyword = (body) => String(body ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
const INVALID_CODES = new Set(["30005", "30006"]); // numéro inconnu / ligne fixe

// → { applied: bool }
function applyTwilioStatus(ctx, params) {
  const sid = String(params.MessageSid ?? params.SmsSid ?? "");
  const status = String(params.MessageStatus ?? params.SmsStatus ?? "");
  if (!sid) return { applied: false };
  const message = ctx.db.prepare("SELECT * FROM mk_sms_messages WHERE provider_message_id = ? AND organization_id = ?").get(sid, ctx.organizationId);
  if (!message || message.status !== "sent") return { applied: false };
  const now = Date.now();
  if (status === "delivered") {
    ctx.db.prepare("UPDATE mk_sms_messages SET status = 'delivered', delivered_at = ?, updated_at = ? WHERE id = ?").run(now, now, message.id);
    ctx.db.prepare("UPDATE mk_sms_campaigns SET delivered_count = delivered_count + 1 WHERE id = ?").run(message.campaign_id);
    return { applied: true };
  }
  if (status === "undelivered" || status === "failed") {
    const code = String(params.ErrorCode ?? "").replace(/\D/g, "").slice(0, 6);
    ctx.db.prepare("UPDATE mk_sms_messages SET status = 'undelivered', reason = ?, updated_at = ? WHERE id = ?").run(code ? `code_${code}` : "undelivered", now, message.id);
    ctx.db.prepare("UPDATE mk_sms_campaigns SET undelivered_count = undelivered_count + 1 WHERE id = ?").run(message.campaign_id);
    if (INVALID_CODES.has(code)) addSmsSuppression({ ...ctx, audit: false }, { phone: message.phone, reason: "invalid", note: `Non livré (code ${code})`, source: "provider" });
    return { applied: true };
  }
  return { applied: false };
}

// → { action: "stop" | "start" | "help" | "none", reply }
function handleInboundSms(ctx, params) {
  const from = normalizePhone(String(params.From ?? ""), {});
  if (!from.ok) return { action: "none", reply: "" };
  const word = keyword(params.Body);
  const first = word.split(" ")[0];
  if (STOP_WORDS.has(word) || STOP_WORDS.has(first)) {
    addSmsSuppression({ ...ctx, audit: false }, { phone: from.e164, reason: "stop", note: "Réponse STOP par SMS" });
    return { action: "stop", reply: REPLIES.stop };
  }
  if (START_WORDS.has(word)) {
    // Seul un blocage « STOP » se lève ainsi (jamais un numéro invalide ni un blocage manuel de l'équipe)
    ctx.db.prepare("DELETE FROM mk_sms_suppressions WHERE organization_id = ? AND phone = ? AND reason = 'stop'").run(ctx.organizationId, from.e164);
    const holders = ctx.db.prepare("SELECT id FROM mk_contacts WHERE organization_id = ? AND sms_phone = ?").all(ctx.organizationId, from.e164);
    let resubscribed = 0;
    for (const { id } of holders) {
      const r = recordSmsConsent({ ...ctx, audit: false }, id, { phone: from.e164, source: "sms_keyword", textShown: `Message « ${word.slice(0, 20)} » envoyé par SMS depuis ce numéro.` });
      if (r.ok) resubscribed += 1;
    }
    return { action: "start", reply: resubscribed ? REPLIES.start : "" };
  }
  if (HELP_WORDS.has(word)) return { action: "help", reply: REPLIES.help };
  return { action: "none", reply: "" };
}

// Réponse TwiML (XML attendu par Twilio) ; texte échappé
const twiml = (reply) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response>${reply ? `<Message>${String(reply).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[c])}</Message>` : ""}</Response>`;

module.exports = { verifyTwilioSignature, applyTwilioStatus, handleInboundSms, twiml, STOP_WORDS, START_WORDS };
