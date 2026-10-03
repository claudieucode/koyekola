// Construction du message d'UN destinataire : rendu personnalisé, liens de désinscription/préférences signés (avec l'identifiant
// du message), en-têtes de désinscription en un clic (RFC 8058), réécriture des liens suivis et pixel d'ouverture facultatif.
const { renderEmail } = require("../templates/blocks");
const { buildContext } = require("../templates/context");
const { unsubscribeToken, preferencesToken } = require("../compliance/consent");
const { signToken } = require("../security/tokens");

const FALLBACK_FROM = "KOLAKISA <no-reply@exemple.invalid>"; // fournisseur console uniquement (rien n'est envoyé)
const trimBase = (url) => String(url || "").replace(/\/+$/, "");
const unescapeAmp = (s) => s.replace(/&amp;/g, "&");

function buildMessage(ctx, { campaign, compiled, contact, message, config, linkMap, event = {}, transactional = false }) {
  const base = trimBase(ctx.baseUrl);
  const unsubscribeUrl = `${base}/u/${unsubscribeToken(ctx, contact.id, ctx.tokenKey, { messageId: message.id })}`;
  const preferencesUrl = `${base}/preferences/${preferencesToken(ctx, contact.id, ctx.tokenKey)}`;
  // Transactionnel : ni lien ni en-tête de désinscription marketing (le message concerne le compte de la personne)
  const data = buildContext(ctx, contact, { urls: transactional ? {} : { unsubscribe_url: unsubscribeUrl, preferences_url: preferencesUrl }, event });
  const rendered = renderEmail(compiled, data);

  let html = rendered.html;
  if (campaign.track_clicks && linkMap.size) {
    // Seuls les liens connus de la campagne sont réécrits : les liens système (désinscription, préférences) restent directs
    html = html.replace(/href="(https:\/\/[^"]*)"/g, (whole, url) => {
      const linkId = linkMap.get(unescapeAmp(url));
      return linkId ? `href="${base}/t/c/${signToken({ o: ctx.organizationId, m: message.id, l: linkId, k: "click" }, ctx.tokenKey)}"` : whole;
    });
  }
  if (campaign.track_opens) {
    const pixel = `<img src="${base}/t/o/${signToken({ o: ctx.organizationId, m: message.id, k: "open" }, ctx.tokenKey)}.gif" width="1" height="1" alt="" style="display:block;border:0">`;
    html = html.includes("</body>") ? html.replace("</body>", `${pixel}\n</body>`) : html + pixel;
  }
  return {
    from: config.from || FALLBACK_FROM,
    to: contact.email,
    replyTo: config.replyTo || undefined,
    subject: rendered.subject,
    html,
    text: rendered.text,
    headers: transactional
      ? { "Auto-Submitted": "auto-generated" }
      : { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click", Precedence: "bulk" },
    idempotencyKey: `campaign:${campaign.id}:contact:${contact.id}`,
  };
}

module.exports = { buildMessage };
