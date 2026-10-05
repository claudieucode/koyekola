// Publications sur les réseaux sociaux (point 12 de la parité Mailchimp, « Social posts ») : une publication écrite une
// fois, publiée ou programmée sur une page Facebook, un compte Instagram professionnel et LinkedIn, avec VOS jetons
// d'accès (chiffrés, jamais affichés ni journalisés). Règles (testées) :
//  - une publication par réseau, chacune avec son statut réel (publiée + adresse, ou échec + raison) ;
//  - publication en arrière-plan (file de travaux) : programmée = elle part à l'heure dite, même si personne n'est connecté ;
//  - jeton refusé → échec immédiat avec la marche à suivre ; panne du réseau → nouvel essai (3 au plus) ;
//  - jamais de double publication : la ligne est « réservée » avant l'appel, une publication interrompue n'est pas renvoyée ;
//  - le lien passe par un lien court /go/<code> : les clics sont comptés ici (robots exclus).
const crypto = require("crypto");
const { checkCtx, audit } = require("../audience/shared");
const { MarketingError } = require("../errors");
const { enqueue } = require("../queue/jobs");

const GRAPH = "https://graph.facebook.com/v23.0";
const LINKEDIN = "https://api.linkedin.com/rest/posts";
const NETWORKS = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" };
const LIMITS = { facebook: 5000, instagram: 2200, linkedin: 3000 };
const STATUS_LABELS = { scheduled: "Programmée", publishing: "Publication en cours", published: "Publiée", failed: "Échec", cancelled: "Annulée" };
const MAX_ATTEMPTS = 3;
const STUCK_MS = 10 * 60000;
const K = {
  fbPage: "social.facebook.page_id", fbName: "social.facebook.page_name", fbToken: "social.facebook.token",
  igUser: "social.instagram.user_id", liAuthor: "social.linkedin.author", liToken: "social.linkedin.token",
};
const bad = (message) => new MarketingError("invalid_field", message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const HTTPS = /^https:\/\/[^\s<>"]{3,2000}$/i;

let fetchForTests = null;
function setFetchForTests(f) { fetchForTests = f; }
const http = () => fetchForTests || globalThis.fetch;

// ---------- Réglages (Paramètres → Réseaux sociaux) ----------
const isSet = (ctx, key) => Boolean(ctx.db.prepare("SELECT 1 FROM mk_settings WHERE organization_id = ? AND key = ?").get(ctx.organizationId, key));
// Version de l'API LinkedIn (AAAAMM) : un mois récent mais pas trop (LinkedIn garde chaque version environ un an)
function linkedinVersion(now) {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - 2);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function getSocialConfig(ctx) {
  checkCtx(ctx);
  const s = ctx.settings;
  const get = (k) => String(s.get(ctx.organizationId, k, "") || "");
  const fbToken = isSet(ctx, K.fbToken);
  return {
    facebook: { pageId: get(K.fbPage), pageName: get(K.fbName), tokenSet: fbToken, connected: Boolean(get(K.fbPage) && fbToken) },
    instagram: { userId: get(K.igUser), connected: Boolean(get(K.igUser) && fbToken) },
    linkedin: { author: get(K.liAuthor), tokenSet: isSet(ctx, K.liToken), connected: Boolean(get(K.liAuthor) && isSet(ctx, K.liToken)) },
  };
}
const secret = (ctx, k) => ctx.settings.get(ctx.organizationId, k) ?? "";

function saveSocialConfig(ctx, input = {}) {
  checkCtx(ctx);
  const s = ctx.settings;
  const org = ctx.organizationId;
  const id = (v, label) => { const t = String(v ?? "").trim(); if (t && !/^\d{5,25}$/.test(t)) throw bad(`${label} : un identifiant numérique (chiffres seulement).`); return t; };
  const writes = [];
  if (input.facebookPageId !== undefined) writes.push([K.fbPage, id(input.facebookPageId, "Identifiant de la page Facebook")]);
  if (input.instagramUserId !== undefined) writes.push([K.igUser, id(input.instagramUserId, "Identifiant du compte Instagram professionnel")]);
  if (input.linkedinAuthor !== undefined) {
    const a = String(input.linkedinAuthor || "").trim();
    if (a && !/^urn:li:(organization|person):[A-Za-z0-9_-]{1,60}$/.test(a)) throw bad("Auteur LinkedIn : « urn:li:organization:12345 » (page entreprise) ou « urn:li:person:… » (profil).");
    writes.push([K.liAuthor, a]);
  }
  for (const [k, field] of [[K.fbToken, "facebookToken"], [K.liToken, "linkedinToken"]]) {
    const v = typeof input[field] === "string" ? input[field].trim() : "";
    if (v) { if (v.length < 20 || /\s/.test(v)) throw bad("Jeton d'accès invalide (copiez-le en entier, sans espace)."); writes.push([k, v, true]); }
  }
  for (const [k, w, isSecret] of writes) {
    if (w === "") s.remove(org, k);
    else s.set(org, k, w, { secret: isSecret === true });
  }
  if (input.clearFacebook) { s.remove(org, K.fbToken); s.remove(org, K.fbName); }
  if (input.clearLinkedin) s.remove(org, K.liToken);
  if (input.facebookPageId !== undefined || input.facebookToken) s.remove(org, K.fbName);
  audit(ctx, "social.settings_updated", "settings", null, { facebook: Boolean(input.facebookToken), linkedin: Boolean(input.linkedinToken) });
  return getSocialConfig(ctx);
}

// ---------- Appels aux réseaux ----------
async function call(url, { method = "GET", form, json, headers = {} } = {}) {
  let res;
  try {
    res = await http()(url, {
      method, signal: AbortSignal.timeout(20000),
      headers: { ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : json ? { "Content-Type": "application/json" } : {}), ...headers },
      body: form ? new URLSearchParams(form).toString() : json ? JSON.stringify(json) : undefined,
    });
  } catch {
    return { ok: false, kind: "temporary", message: "réseau injoignable" };
  }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  const header = (n) => (res.headers && typeof res.headers.get === "function" ? res.headers.get(n) : null);
  if (res.status >= 200 && res.status < 300) return { ok: true, body: body || {}, header };
  const err = body && (body.error || body);
  const message = String((err && (err.message || err.error_user_msg)) || "").replace(/(access_token=)[^&\s]+/g, "$1[masqué]").slice(0, 300);
  const code = err && err.code;
  if (res.status === 401 || res.status === 403 || code === 190 || code === 10 || code === 200) return { ok: false, kind: "config", status: res.status, message };
  if (res.status === 429 || res.status >= 500 || code === 4 || code === 17 || code === 32) return { ok: false, kind: "temporary", status: res.status, message };
  return { ok: false, kind: "permanent", status: res.status, message };
}

// Vérifie un réseau configuré (lecture seule) ; Facebook : mémorise le nom de la page
async function testConnection(ctx, network) {
  const cfg = getSocialConfig(ctx);
  if (network === "facebook" || network === "instagram") {
    if (!cfg[network].connected) throw bad(`${NETWORKS[network]} n'est pas configuré.`);
    const target = network === "facebook" ? `${cfg.facebook.pageId}?fields=name,link` : `${cfg.instagram.userId}?fields=username`;
    const r = await call(`${GRAPH}/${target}&access_token=${encodeURIComponent(secret(ctx, K.fbToken))}`);
    if (!r.ok) return { ok: false, message: explain(network, r) };
    if (network === "facebook" && r.body.name) ctx.settings.set(ctx.organizationId, K.fbName, String(r.body.name).slice(0, 200));
    return { ok: true, message: network === "facebook" ? `Page « ${r.body.name || cfg.facebook.pageId} » accessible.` : `Compte Instagram @${r.body.username || cfg.instagram.userId} accessible.` };
  }
  if (network === "linkedin") {
    if (!cfg.linkedin.connected) throw bad("LinkedIn n'est pas configuré.");
    return { ok: true, message: "LinkedIn ne permet pas de tester un jeton sans publier : il sera vérifié à la première publication." };
  }
  throw bad("Réseau inconnu.");
}

function explain(network, r) {
  const name = NETWORKS[network];
  if (r.kind === "config") return `${name} a refusé le jeton d'accès${r.message ? ` (« ${r.message} »)` : ""} : il a peut-être expiré ou n'a pas les droits de publication. Collez un nouveau jeton dans Paramètres → Réseaux sociaux.`;
  if (r.kind === "temporary") return `${name} est momentanément indisponible${r.message ? ` (« ${r.message} »)` : ""}.`;
  return `${name} a refusé la publication${r.message ? ` : « ${r.message} »` : ""}.`;
}

// ---------- Création ----------
function shortLink(ctx, code) { return `${String(ctx.baseUrl || "").replace(/\/+$/, "")}/go/${code}`; }
function newCode(ctx) {
  for (;;) {
    const code = crypto.randomBytes(6).toString("base64url");
    if (!ctx.db.prepare("SELECT 1 FROM mk_social_posts WHERE link_code = ?").get(code)) return code;
  }
}

// input : { networks: [..], body, linkUrl, imageUrl, campaignId, scheduledAt (ms, facultatif) }
function createPosts(ctx, input = {}) {
  checkCtx(ctx);
  const now = nowOf(ctx);
  const cfg = getSocialConfig(ctx);
  const networks = [...new Set((Array.isArray(input.networks) ? input.networks : [input.networks]).filter(Boolean))];
  if (!networks.length) throw bad("Choisissez au moins un réseau.");
  for (const n of networks) {
    if (!Object.hasOwn(NETWORKS, n)) throw bad("Réseau inconnu.");
    if (!cfg[n].connected) throw bad(`${NETWORKS[n]} n'est pas relié : configurez-le dans Paramètres → Réseaux sociaux.`);
  }
  const body = String(input.body ?? "").replace(/\r\n?/g, "\n").trim();
  if (!body) throw bad("Écrivez le texte de la publication.");
  for (const n of networks) if (body.length > LIMITS[n]) throw bad(`Texte trop long pour ${NETWORKS[n]} (${LIMITS[n]} caractères au plus).`);
  const linkUrl = String(input.linkUrl ?? "").trim();
  if (linkUrl && !HTTPS.test(linkUrl)) throw bad("Le lien doit être une adresse https://.");
  const imageUrl = String(input.imageUrl ?? "").trim();
  if (imageUrl && !HTTPS.test(imageUrl)) throw bad("L'image doit être une adresse https:// publique (les réseaux la téléchargent).");
  if (networks.includes("instagram") && !imageUrl) throw bad("Instagram exige une image : choisissez-en une.");
  if (linkUrl && !String(ctx.baseUrl || "").startsWith("https://")) throw bad("L'adresse publique du site (SITE_URL) doit être en https:// pour suivre les clics du lien.");
  let at = now;
  if (input.scheduledAt !== undefined && input.scheduledAt !== null && input.scheduledAt !== "") {
    at = Number(input.scheduledAt);
    if (!Number.isFinite(at) || at < now - 60000 || at > now + 366 * 86400000) throw bad("Date de publication invalide (dans le futur, moins d'un an).");
  }
  const campaignId = Number.isInteger(input.campaignId) ? input.campaignId : null;
  const group = crypto.randomBytes(8).toString("hex");
  const ids = [];
  const insert = ctx.db.prepare("INSERT INTO mk_social_posts (organization_id, group_key, network, body, link_url, image_url, campaign_id, scheduled_at, link_code, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id");
  for (const n of networks) {
    const id = insert.get(ctx.organizationId, group, n, body, linkUrl, imageUrl, campaignId, at, linkUrl ? newCode(ctx) : null, ctx.userId ?? null).id;
    enqueue(ctx.db, { organizationId: ctx.organizationId, type: "social.publish", payload: { organizationId: ctx.organizationId, postId: id }, runAt: at, priority: 5, maxAttempts: 1, idempotencyKey: `social:${id}:0` });
    ids.push(id);
  }
  audit(ctx, "social.posts_created", "social_post", ids[0], { networks, scheduled: at > now + 60000 });
  return { group, ids, scheduledAt: at };
}

// ---------- Publication d'une ligne ----------
async function publishOne(ctx, post) {
  const link = post.link_code ? shortLink(ctx, post.link_code) : "";
  if (post.network === "facebook") {
    const token = secret(ctx, K.fbToken);
    const page = getSocialConfig(ctx).facebook.pageId;
    const r = post.image_url
      ? await call(`${GRAPH}/${page}/photos`, { method: "POST", form: { url: post.image_url, caption: link ? `${post.body}\n\n${link}` : post.body, access_token: token } })
      : await call(`${GRAPH}/${page}/feed`, { method: "POST", form: { message: post.body, ...(link ? { link } : {}), access_token: token } });
    if (!r.ok) return r;
    const id = String(r.body.post_id || r.body.id || "");
    return { ok: true, id, url: id ? `https://www.facebook.com/${id}` : "" };
  }
  if (post.network === "instagram") {
    const token = secret(ctx, K.fbToken);
    const user = getSocialConfig(ctx).instagram.userId;
    const c = await call(`${GRAPH}/${user}/media`, { method: "POST", form: { image_url: post.image_url, caption: post.body, access_token: token } });
    if (!c.ok) return c;
    const p = await call(`${GRAPH}/${user}/media_publish`, { method: "POST", form: { creation_id: String(c.body.id), access_token: token } });
    if (!p.ok) return p;
    const id = String(p.body.id || "");
    const l = id ? await call(`${GRAPH}/${id}?fields=permalink&access_token=${encodeURIComponent(token)}`) : null;
    return { ok: true, id, url: l && l.ok && l.body.permalink ? String(l.body.permalink) : "" };
  }
  // LinkedIn : texte + lien en « article » (l'aperçu du lien est construit par LinkedIn)
  const cfg = getSocialConfig(ctx);
  const r = await call(LINKEDIN, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret(ctx, K.liToken)}`, "LinkedIn-Version": linkedinVersion(nowOf(ctx)), "X-Restli-Protocol-Version": "2.0.0" },
    json: {
      author: cfg.linkedin.author, commentary: post.body, visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false,
      ...(link ? { content: { article: { source: link, title: post.body.split("\n")[0].slice(0, 200) } } } : {}),
    },
  });
  if (!r.ok) return r;
  const urn = String(r.header("x-restli-id") || r.body.id || "");
  return { ok: true, id: urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}` : "" };
}

async function publishPost(ctx, id) {
  checkCtx(ctx);
  const now = nowOf(ctx);
  const post = ctx.db.prepare("SELECT * FROM mk_social_posts WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
  if (!post) return { done: true };
  // Publication interrompue (serveur arrêté pendant l'appel) : jamais renvoyée d'office (risque de doublon)
  if (post.status === "publishing" && Date.parse(`${post.updated_at.replace(" ", "T")}Z`) < now - STUCK_MS) {
    ctx.db.prepare("UPDATE mk_social_posts SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ? AND status = 'publishing'").run("Publication interrompue : vérifiez sur le réseau si elle est parue avant de la relancer.", id);
    return { done: true };
  }
  if (post.status !== "scheduled") return { done: true };
  if (post.scheduled_at > now) return { done: false, waitMs: post.scheduled_at - now };
  if (!ctx.db.prepare("UPDATE mk_social_posts SET status = 'publishing', attempts = attempts + 1, updated_at = datetime('now') WHERE id = ? AND status = 'scheduled'").run(id).changes) return { done: true };
  const cfg = getSocialConfig(ctx);
  let r;
  if (!cfg[post.network].connected) r = { ok: false, kind: "config", message: "réseau déconnecté" };
  else {
    try { r = await publishOne(ctx, post); } catch (error) {
      ctx.log?.error?.("[KOLAKISA] Publication sociale : erreur imprévue", error && error.message);
      r = { ok: false, kind: "permanent", message: "erreur imprévue" };
    }
  }
  if (r.ok) {
    ctx.db.prepare("UPDATE mk_social_posts SET status = 'published', published_at = ?, external_id = ?, external_url = ?, error = '', updated_at = datetime('now') WHERE id = ?").run(now, r.id.slice(0, 200), r.url.slice(0, 500), id);
    audit(ctx, "social.published", "social_post", id, { network: post.network });
    return { done: true, published: true };
  }
  if (r.kind === "temporary" && post.attempts + 1 < MAX_ATTEMPTS) {
    const retryAt = now + 60000 * 2 ** post.attempts;
    ctx.db.prepare("UPDATE mk_social_posts SET status = 'scheduled', scheduled_at = ?, error = ?, updated_at = datetime('now') WHERE id = ?").run(retryAt, explain(post.network, r), id);
    return { done: false, waitMs: retryAt - now, retry: true };
  }
  ctx.db.prepare("UPDATE mk_social_posts SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ?").run(explain(post.network, r), id);
  audit(ctx, "social.failed", "social_post", id, { network: post.network, kind: r.kind });
  return { done: true, failed: true };
}

// ---------- Gestion ----------
function getPost(ctx, id) {
  checkCtx(ctx);
  return Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_social_posts WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) ?? null : null;
}
function listPosts(ctx, { limit = 100 } = {}) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT * FROM mk_social_posts WHERE organization_id = ? ORDER BY scheduled_at DESC, id DESC LIMIT ?").all(ctx.organizationId, Math.min(Math.max(limit, 1), 500))
    .map((p) => ({ ...p, networkLabel: NETWORKS[p.network], statusLabel: STATUS_LABELS[p.status], shortUrl: p.link_code ? shortLink(ctx, p.link_code) : "" }));
}
function cancelPost(ctx, id) {
  const p = getPost(ctx, id);
  if (!p) throw new MarketingError("not_found", "Publication introuvable.");
  if (p.status !== "scheduled") throw new MarketingError("invalid_state", "Seule une publication programmée peut être annulée.");
  ctx.db.prepare("UPDATE mk_social_posts SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND status = 'scheduled'").run(id);
  audit(ctx, "social.cancelled", "social_post", id, {});
}
function retryPost(ctx, id) {
  const p = getPost(ctx, id);
  if (!p) throw new MarketingError("not_found", "Publication introuvable.");
  if (p.status !== "failed") throw new MarketingError("invalid_state", "Seule une publication en échec peut être relancée.");
  const now = nowOf(ctx);
  ctx.db.prepare("UPDATE mk_social_posts SET status = 'scheduled', scheduled_at = ?, attempts = 0, error = '', updated_at = datetime('now') WHERE id = ?").run(now, id);
  enqueue(ctx.db, { organizationId: ctx.organizationId, type: "social.publish", payload: { organizationId: ctx.organizationId, postId: id }, runAt: now, priority: 5, maxAttempts: 1, idempotencyKey: `social:${id}:retry:${now}` });
}
function deletePost(ctx, id) {
  const p = getPost(ctx, id);
  if (!p) throw new MarketingError("not_found", "Publication introuvable.");
  if (["publishing"].includes(p.status)) throw new MarketingError("invalid_state", "Publication en cours : attendez la fin.");
  ctx.db.prepare("DELETE FROM mk_social_posts WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "social.deleted", "social_post", id, { network: p.network, status: p.status });
  return p;
}

// Lien court /go/<code> → destination (clic compté sauf robot)
function resolveShortLink(db, code, { bot = false } = {}) {
  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{6,16}$/.test(code)) return null;
  const p = db.prepare("SELECT id, link_url FROM mk_social_posts WHERE link_code = ?").get(code);
  if (!p || !p.link_url) return null;
  if (!bot) db.prepare("UPDATE mk_social_posts SET click_count = click_count + 1 WHERE id = ?").run(p.id);
  return p.link_url;
}

// ---------- File de travaux ----------
function jobHandlers({ db, bus = null, settings, env = process.env, log = console, now = Date.now }) {
  return {
    "social.publish": async ({ organizationId, postId }) => {
      const ctx = { db, organizationId, userId: null, bus, settings, baseUrl: env.SITE_URL, log, now };
      const r = await publishPost(ctx, postId);
      if (!r.done && r.waitMs > 0) enqueue(db, { organizationId, type: "social.publish", payload: { organizationId, postId }, runAt: now() + r.waitMs, priority: 5, maxAttempts: 1, idempotencyKey: `social:${postId}:${now()}:${crypto.randomBytes(3).toString("hex")}` });
    },
  };
}

module.exports = {
  NETWORKS, LIMITS, STATUS_LABELS, getSocialConfig, saveSocialConfig, testConnection, createPosts, publishPost, listPosts, getPost, cancelPost, retryPost, deletePost,
  resolveShortLink, jobHandlers, setFetchForTests, linkedinVersion,
};
