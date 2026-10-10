// Construction du message d'UN destinataire : rendu personnalisé, liens de désinscription/préférences signés (avec l'identifiant
// du message), en-têtes de désinscription en un clic (RFC 8058), réécriture des liens suivis et pixel d'ouverture facultatif.
const { renderEmail } = require("../templates/blocks");
const { buildContext } = require("../templates/context");
const { unsubscribeToken, preferencesToken } = require("../compliance/consent");
const { signToken } = require("../security/tokens");
const { respondentToken } = require("../surveys");
const { webUrl } = require("../social/webVersion");
const { parseSender } = require("./providers");

const FALLBACK_FROM = "KOLAKISA <no-reply@exemple.invalid>"; // fournisseur console uniquement (rien n'est envoyé)
const trimBase = (url) => String(url || "").replace(/\/+$/, "");
const unescapeAmp = (s) => s.replace(/&amp;/g, "&");

function buildMessage(ctx, { campaign, compiled, contact, message, config, linkMap, event = {}, transactional = false }) {
  const base = trimBase(ctx.baseUrl);
  const unsubscribeUrl = `${base}/u/${unsubscribeToken(ctx, contact.id, ctx.tokenKey, { messageId: message.id })}`;
  const preferencesUrl = `${base}/preferences/${preferencesToken(ctx, contact.id, ctx.tokenKey)}`;
  // Transactionnel : ni lien ni en-tête de désinscription marketing (le message concerne le compte de la personne)
  // « Voir dans le navigateur » : version web de la campagne (sans données personnelles) ; pas pour un scénario
  const viewUrl = !transactional && campaign.kind === "campaign" && !campaign.web_disabled ? webUrl(ctx, campaign.id) : "";
  const data = buildContext(ctx, contact, { urls: transactional ? {} : { unsubscribe_url: unsubscribeUrl, preferences_url: preferencesUrl, view_url: viewUrl }, event });
  // Lien personnel des blocs « Sondage » : la réponse est rattachée à ce contact (jeton signé, sans date limite)
  data.survey_token = ctx.tokenKey ? respondentToken(ctx.organizationId, contact.id, ctx.tokenKey) : "";
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
  // Identité d'expédition du SITE de la campagne (Paramètres → Emailing), sinon celle de l'organisation
  const identity = siteIdentity(ctx, campaign, config);
  return {
    from: identity.from || FALLBACK_FROM,
    to: contact.email,
    replyTo: identity.replyTo || undefined,
    subject: rendered.subject,
    html,
    text: rendered.text,
    headers: transactional
      ? { "Auto-Submitted": "auto-generated" }
      : { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click", Precedence: "bulk" },
    idempotencyKey: `campaign:${campaign.id}:contact:${contact.id}`,
  };
}

// Nom / adresse / réponse du site de la campagne ; chaque champ vide retombe sur la configuration de l'organisation. L'adresse du site n'est reprise
// que si son domaine est encore autorisé (domaine déclaré ou domaine de l'organisation) : une modification de domaines ne laisse jamais partir un envoi usurpé.
function siteIdentity(ctx, campaign, config) {
  const base = { from: config.from, replyTo: config.replyTo };
  if (!Number.isInteger(campaign.site_id) || !ctx.settings) return base;
  const get = (f) => ctx.settings.get(ctx.organizationId, `email.site_${campaign.site_id}.${f}`, "") || "";
  const address = get("from_address"), name = get("from_name"), reply = get("reply_to");
  const org = config.from ? parseSender(config.from) : null;
  let from = config.from;
  if (address || name) {
    const email = address || (org && org.email) || "";
    const domain = email.split("@").pop().toLowerCase();
    const allowed = email && ((org && org.email.split("@").pop().toLowerCase() === domain) || ctx.db.prepare("SELECT 1 FROM mk_sending_domains WHERE organization_id = ? AND domain = ?").get(ctx.organizationId, domain));
    if (allowed) from = `${(name || (org && org.name) || "").replace(/[<>"\r\n]/g, "")} <${email}>`.trim().replace(/^<(.+)>$/, "$1");
  }
  return { from, replyTo: reply || base.replyTo };
}

module.exports = { buildMessage, siteIdentity };
