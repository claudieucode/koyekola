// Version web d'une campagne envoyée (Mailchimp : « View this email in your browser » + partage sur les réseaux).
// Adresse : /e/<jeton signé> — impossible à deviner, valable sans limite de durée, désactivable campagne par campagne.
// Rendu SANS AUCUNE donnée personnelle : les variables du contact prennent leur valeur de secours, les liens de
// désinscription et de préférences sont retirés (ils n'ont de sens que dans l'e-mail d'une personne précise).
const { signToken, verifyToken } = require("../security/tokens");
const { compileTemplate, renderEmail } = require("../templates/blocks");
const { allowedFor, getOrgProfile } = require("../templates/context");

const trimBase = (u) => String(u || "").replace(/\/+$/, "");

function webToken(ctx, campaignId) {
  if (!ctx.tokenKey) return "";
  return signToken({ o: ctx.organizationId, c: campaignId, k: "web" }, ctx.tokenKey);
}
function webUrl(ctx, campaignId) {
  const base = trimBase(ctx.baseUrl);
  const token = webToken(ctx, campaignId);
  return base && token ? `${base}/e/${token}` : "";
}
// Jeton → { organizationId, campaignId } ou null
function readWebToken(token, key) {
  if (!key) return null;
  const check = verifyToken(token, key, { kind: "web" });
  if (!check.ok || !Number.isInteger(check.payload.o) || !Number.isInteger(check.payload.c)) return null;
  return { organizationId: check.payload.o, campaignId: check.payload.c };
}

// Campagne publiable : une vraie campagne (pas une campagne système de scénario), envoyée, version web active
function publishableCampaign(db, organizationId, campaignId) {
  const c = db.prepare("SELECT * FROM mk_campaigns WHERE id = ? AND organization_id = ?").get(campaignId, organizationId);
  if (!c || c.kind !== "campaign" || c.web_disabled || !c.snapshot || !["sending", "sent"].includes(c.status)) return null;
  return c;
}

function anonymousContext(ctx) {
  const org = getOrgProfile(ctx);
  return {
    contact: { first_name: "", last_name: "", full_name: "", email: "", company: "", country: "", language: "", phone: "", props: {} },
    org: { name: org.name, address: org.address },
    event: {}, unsubscribe_url: "", preferences_url: "", view_url: "", survey_token: "",
  };
}

// → { subject, preheader, html, image, description }
function renderWebVersion(ctx, campaign) {
  const snapshot = JSON.parse(campaign.snapshot);
  const compiled = compileTemplate(snapshot, { allowed: allowedFor(ctx), tolerant: true });
  const rendered = renderEmail(compiled, anonymousContext(ctx));
  // Liens personnels vides (désinscription, préférences, voir dans le navigateur) : retirés, texte compris
  const html = rendered.html.replace(/<a\b[^>]*\bhref=""[^>]*>[\s\S]*?<\/a>\s*(?:·|&middot;|\|)?\s*/g, "");
  const img = /<img\b[^>]*\bsrc="(https:\/\/[^"]+)"/i.exec(html);
  const preheader = String(snapshot.preheader || "").replace(/\{\{[\s\S]*?\}\}/g, "").replace(/\s+/g, " ").trim();
  const description = (preheader || rendered.text.replace(/\s+/g, " ").trim()).slice(0, 200);
  return { subject: rendered.subject, preheader, html, image: img ? img[1].replace(/&amp;/g, "&") : "", description };
}

// Liens de partage (ouverts par la personne, dans son propre compte : aucun accès à ses réseaux n'est demandé)
function shareLinks(url, text = "") {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return [
    { network: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { network: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { network: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${u}${t ? `&text=${t}` : ""}` },
    { network: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${t ? `${t}%20` : ""}${u}` },
  ];
}

module.exports = { webToken, webUrl, readWebToken, publishableCampaign, renderWebVersion, shareLinks, anonymousContext };
