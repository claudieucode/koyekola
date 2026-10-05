// Campagnes RSS (point 5 de la parité Mailchimp, « RSS-to-email ») : un modèle « parent » (avec un bloc « Articles »),
// une source (blog KOLAKISA ou flux RSS/Atom externe), une audience et une fréquence. À chaque échéance :
//  · on cherche les articles JAMAIS envoyés par cette campagne (mk_rss_seen) ; au premier envoi, seulement les récents
//    (24 h, 7 jours ou 30 jours selon la fréquence, comme Mailchimp) ;
//  · aucun nouvel article → rien n'est envoyé (résultat noté) ;
//  · sinon une campagne « enfant » ordinaire est créée et lancée avec ces articles (mêmes contrôles qu'un envoi manuel :
//    consentement, désinscription, rythme), et ses articles sont notés comme envoyés ;
//  · un seul envoi par jour au plus ; la prochaine échéance est toujours reprogrammée.
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { transaction } = require("../db/tx");
const { enqueue } = require("../queue/jobs");
const { listPosts } = require("../bridge/catalog");
const templates = require("../templates");
const campaigns = require("../sending/campaigns");
const { startCampaign } = require("../sending/dispatch");
const sendtime = require("../sending/sendtime");
const feed = require("./feed");

const DAY = 86400000;
const FREQUENCIES = { daily: "Chaque jour", weekly: "Chaque semaine", monthly: "Chaque mois" };
const WINDOWS = { daily: DAY, weekly: 7 * DAY, monthly: 30 * DAY };
const WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const STATUSES = { draft: "Brouillon", active: "Active", paused: "En pause" };

const bad = (message) => new MarketingError("invalid_field", message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const parse = (row) => (row ? { ...row, days: JSON.parse(row.days || "[]") } : null);

function getRss(ctx, id) {
  checkCtx(ctx);
  return parse(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_rss_campaigns WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
function requireRss(ctx, id) {
  const r = getRss(ctx, id);
  if (!r) throw new MarketingError("not_found", "Campagne RSS introuvable.");
  return r;
}
function listRss(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM mk_campaigns c WHERE c.rss_id = r.id) AS sends FROM mk_rss_campaigns r WHERE r.organization_id = ? ORDER BY r.created_at DESC, r.id DESC`).all(ctx.organizationId).map(parse);
}
// Envois réels (campagnes « enfant »), du plus récent au plus ancien
function rssSends(ctx, id) {
  return ctx.db.prepare("SELECT id, name, status, total_recipients, sent_count, unique_open_count, unique_click_count, created_at FROM mk_campaigns WHERE rss_id = ? AND organization_id = ? ORDER BY id DESC LIMIT 50").all(id, ctx.organizationId);
}

// ---------- Validation ----------
function validate(ctx, input, currentId = null) {
  const v = {};
  v.name = typeof input.name === "string" ? input.name.replace(/\p{Cc}/gu, "").trim().slice(0, 100) : "";
  if (!v.name) throw bad("Le nom de la campagne RSS est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_rss_campaigns WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, v.name);
  if (dup && dup.id !== currentId) throw new MarketingError("duplicate", "Une campagne RSS porte déjà ce nom.");
  v.source = input.source === "feed" ? "feed" : "blog";
  v.feed_url = "";
  if (v.source === "feed") v.feed_url = feed.checkUrl(input.feedUrl).href;
  v.blog_category = v.source === "blog" && typeof input.blogCategory === "string" ? input.blogCategory.trim().slice(0, 100) : "";
  const templateId = Number(input.templateId);
  campaigns.checkTemplate(ctx, templateId);
  const template = templates.getTemplate(ctx, templateId);
  if (!template.blocks.some((b) => b && b.type === "posts" && !b.hidden)) throw bad("Le modèle doit contenir un bloc « Articles » : c'est là que les nouveaux articles seront placés à chaque envoi.");
  v.template_id = templateId;
  v.target_type = input.targetType;
  v.target_id = Number(input.targetId);
  campaigns.checkTarget(ctx, v.target_type, v.target_id);
  v.category = campaigns.checkCategory(ctx, input.category || "");
  v.track_clicks = input.trackClicks === false ? 0 : 1;
  v.track_opens = input.trackOpens ? 1 : 0;
  v.frequency = Object.hasOwn(FREQUENCIES, input.frequency) ? input.frequency : null;
  if (!v.frequency) throw bad("Fréquence inconnue (chaque jour, chaque semaine ou chaque mois).");
  const days = [...new Set((Array.isArray(input.days) ? input.days : [input.days]).map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort();
  if (v.frequency === "weekly" && !days.length) throw bad("Choisissez au moins un jour de la semaine.");
  v.days = JSON.stringify(v.frequency === "weekly" ? days : []);
  const md = Number(input.monthDay);
  v.month_day = v.frequency === "monthly" ? (Number.isInteger(md) && md >= 1 && md <= 28 ? md : null) : 1;
  if (v.month_day === null) throw bad("Jour du mois : de 1 à 28 (pour exister tous les mois).");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(input.sendTime || ""))) throw bad("Heure d'envoi invalide (HH:MM).");
  v.send_time = String(input.sendTime);
  const max = Number(input.maxItems);
  if (!Number.isInteger(max) || max < 1 || max > 20) throw bad("Nombre d'articles par envoi : de 1 à 20.");
  v.max_items = max;
  return v;
}

function createRss(ctx, input = {}) {
  checkCtx(ctx);
  const v = validate(ctx, input);
  const id = Number(ctx.db.prepare(`INSERT INTO mk_rss_campaigns (organization_id, name, source, feed_url, blog_category, template_id, target_type, target_id, category, track_clicks, track_opens, frequency, days, month_day, send_time, max_items, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(ctx.organizationId, v.name, v.source, v.feed_url, v.blog_category, v.template_id, v.target_type, v.target_id, v.category, v.track_clicks, v.track_opens, v.frequency, v.days, v.month_day, v.send_time, v.max_items, ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "rss.created", "rss", id, { source: v.source, frequency: v.frequency });
  return getRss(ctx, id);
}
function updateRss(ctx, id, input = {}) {
  const current = requireRss(ctx, id);
  const v = validate(ctx, input, id);
  ctx.db.prepare(`UPDATE mk_rss_campaigns SET name = ?, source = ?, feed_url = ?, blog_category = ?, template_id = ?, target_type = ?, target_id = ?, category = ?, track_clicks = ?, track_opens = ?, frequency = ?, days = ?, month_day = ?, send_time = ?, max_items = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?`)
    .run(v.name, v.source, v.feed_url, v.blog_category, v.template_id, v.target_type, v.target_id, v.category, v.track_clicks, v.track_opens, v.frequency, v.days, v.month_day, v.send_time, v.max_items, id, ctx.organizationId);
  audit(ctx, "rss.updated", "rss", id, {});
  if (current.status === "active") schedule(ctx, requireRss(ctx, id), nowOf(ctx)); // nouvelle fréquence : prochaine échéance recalculée
  return getRss(ctx, id);
}
function deleteRss(ctx, id) {
  requireRss(ctx, id);
  ctx.db.prepare("DELETE FROM mk_rss_campaigns WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId); // les envois passés restent (rss_id → NULL)
  audit(ctx, "rss.deleted", "rss", id, {});
}

// ---------- Échéances (fuseau par défaut de l'organisation) ----------
function nextRunAt(ctx, rss, after) {
  const tz = sendtime.orgTimeZone(ctx);
  const [h, m] = rss.send_time.split(":").map(Number);
  let ymd = sendtime.localYmd(after, tz);
  for (let i = 0; i < 400; i++) {
    const at = sendtime.zonedToUtc(ymd, h, m, tz);
    const weekday = ((new Date(`${ymd}T12:00:00Z`).getUTCDay() + 6) % 7) + 1; // 1 = lundi
    const day = Number(ymd.slice(8));
    const fits = rss.frequency === "daily" || (rss.frequency === "weekly" && rss.days.includes(weekday)) || (rss.frequency === "monthly" && day === rss.month_day);
    if (fits && at > after) return at;
    ymd = new Date(Date.parse(`${ymd}T12:00:00Z`) + DAY).toISOString().slice(0, 10);
  }
  throw new MarketingError("invalid_state", "Aucune échéance trouvée pour cette fréquence.");
}
function schedule(ctx, rss, after) {
  const at = nextRunAt(ctx, rss, after);
  ctx.db.prepare("UPDATE mk_rss_campaigns SET next_run_at = ? WHERE id = ?").run(at, rss.id);
  enqueue(ctx.db, { organizationId: ctx.organizationId, type: "rss.run", payload: { organizationId: ctx.organizationId, rssId: rss.id }, runAt: at, priority: 5, maxAttempts: 3, idempotencyKey: `rss:${rss.id}:${at}` });
  return at;
}

// ---------- Articles ----------
async function sourceItems(ctx, rss, { fetcher, now } = {}) {
  if (rss.source === "feed") return feed.fetchFeed(rss.feed_url, fetcher ? { fetcher } : {});
  // Articles visibles À L'HEURE de l'échéance (un article programmé n'est pris qu'une fois publié)
  return listPosts(now ? { ...ctx, now: () => now } : ctx, { limit: 50, category: rss.blog_category });
}
// Nouveaux articles : jamais envoyés par cette campagne ; au premier envoi, seulement ceux de la fenêtre récente
async function newItems(ctx, rss, now, opts) {
  const all = await sourceItems(ctx, rss, { ...opts, now });
  const seen = new Set(ctx.db.prepare("SELECT item_key FROM mk_rss_seen WHERE rss_id = ?").all(rss.id).map((r) => r.item_key));
  const firstRun = seen.size === 0 && !rss.last_sent_at;
  const fresh = all.filter((i) => !seen.has(i.key) && (!firstRun || (i.date && i.date >= now - WINDOWS[rss.frequency])));
  // Premier passage : les articles plus anciens que la fenêtre servent de point de départ (jamais envoyés ensuite)
  const baseline = firstRun ? all.filter((i) => !fresh.includes(i)) : [];
  return { fresh, total: all.length, firstRun, baseline };
}
function markBaseline(ctx, rss, items, now) {
  const mark = ctx.db.prepare("INSERT OR IGNORE INTO mk_rss_seen (rss_id, item_key, campaign_id, seen_at) VALUES (?, ?, NULL, ?)");
  for (const i of items) mark.run(rss.id, i.key, now);
}

// Vérifications avant activation : modèle prêt (le bloc « Articles » vide est normal : rempli à l'envoi), source lisible
async function activationCheck(ctx, rss, opts = {}) {
  const errors = [];
  const ready = templates.templateReadiness(ctx, rss.template_id);
  const blocking = ready.errors.filter((e) => e.code !== "posts_empty");
  if (blocking.length) errors.push(`Le modèle n'est pas prêt : ${blocking.map((e) => e.message).join(" ")}`);
  let sample = null;
  try { sample = await sourceItems(ctx, rss, opts); } catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    errors.push(`Source illisible : ${error.message}`);
  }
  if (sample && rss.source === "blog" && !sample.length) errors.push("Le blog ne contient encore aucun article publié (dans cette catégorie).");
  return { ready: errors.length === 0, errors, sample: sample || [] };
}

async function activateRss(ctx, id, opts = {}) {
  const rss = requireRss(ctx, id);
  const check = await activationCheck(ctx, rss, opts);
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.join(" "));
  ctx.db.prepare("UPDATE mk_rss_campaigns SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(id);
  const at = schedule(ctx, { ...rss, status: "active" }, nowOf(ctx));
  audit(ctx, "rss.activated", "rss", id, { nextRunAt: at });
  return { nextRunAt: at };
}
function pauseRss(ctx, id) {
  const rss = requireRss(ctx, id);
  if (rss.status !== "active") throw new MarketingError("invalid_state", "Seule une campagne RSS active peut être mise en pause.");
  ctx.db.prepare("UPDATE mk_rss_campaigns SET status = 'paused', next_run_at = NULL, updated_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "rss.paused", "rss", id, {});
}

// ---------- Exécution d'une échéance ----------
function freeCampaignName(ctx, base) {
  const taken = (n) => Boolean(ctx.db.prepare("SELECT 1 FROM mk_campaigns WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, n));
  if (!taken(base)) return base;
  for (let i = 2; i < 100; i++) if (!taken(`${base} (${i})`)) return `${base} (${i})`;
  return `${base} (${Date.now()})`;
}

async function runRss(ctx, id, { now = nowOf(ctx), fetcher, force = false } = {}) {
  const rss = getRss(ctx, id);
  if (!rss) return { skipped: "deleted" };
  if (rss.status !== "active" && !force) return { skipped: rss.status };
  const tz = sendtime.orgTimeZone(ctx);
  const finish = (result) => {
    ctx.db.prepare("UPDATE mk_rss_campaigns SET last_run_at = ?, last_result = ? WHERE id = ?").run(now, result.text.slice(0, 500), id);
    if (rss.status === "active") schedule(ctx, rss, now);
    return result;
  };
  // Un seul envoi par jour (comme Mailchimp), même si l'heure ou la fréquence est modifiée dans la journée
  if (rss.last_sent_at && sendtime.localYmd(rss.last_sent_at, tz) === sendtime.localYmd(now, tz)) return finish({ text: "Déjà un envoi aujourd'hui : rien envoyé.", sent: false });
  let found;
  try { found = await newItems(ctx, rss, now, { fetcher }); } catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    return finish({ text: `Source illisible : ${error.message}`, sent: false, error: true });
  }
  if (found.baseline.length) markBaseline(ctx, rss, found.baseline, now);
  if (!found.fresh.length) return finish({ text: found.firstRun ? "Aucun article récent pour un premier envoi : rien envoyé." : "Aucun nouvel article depuis le dernier envoi : rien envoyé.", sent: false });
  const items = found.fresh.slice(0, rss.max_items).map(({ title, url, excerpt, image, date }) => ({ title, url, excerpt, image, date }));
  let child = null;
  try {
    child = transaction(ctx.db, () => {
      const c = campaigns.createCampaign(ctx, { name: freeCampaignName(ctx, `${rss.name} — ${sendtime.localYmd(now, tz)}`), templateId: rss.template_id, targetType: rss.target_type, targetId: rss.target_id, category: rss.category, trackClicks: Boolean(rss.track_clicks), trackOpens: Boolean(rss.track_opens) });
      ctx.db.prepare("UPDATE mk_campaigns SET rss_id = ? WHERE id = ?").run(rss.id, c.id);
      const started = startCampaign(ctx, c.id, { postItems: items, now });
      // Tous les nouveaux articles sont notés comme vus (au-delà du maximum aussi : jamais de vieux articles au prochain envoi)
      const mark = ctx.db.prepare("INSERT OR IGNORE INTO mk_rss_seen (rss_id, item_key, campaign_id, seen_at) VALUES (?, ?, ?, ?)");
      for (const i of found.fresh) mark.run(rss.id, i.key, c.id, now);
      ctx.db.prepare("UPDATE mk_rss_campaigns SET last_sent_at = ? WHERE id = ?").run(now, rss.id);
      return { ...c, recipients: started.recipients };
    });
  } catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    return finish({ text: `Envoi impossible : ${error.message}`, sent: false, error: true });
  }
  audit(ctx, "rss.sent", "rss", id, { campaignId: child.id, items: items.length });
  return finish({ text: `Envoyé : ${items.length} article${items.length > 1 ? "s" : ""}, ${child.recipients} destinataire${child.recipients > 1 ? "s" : ""} (campagne « ${child.name} »).`, sent: true, campaignId: child.id, items: items.length });
}

// Aperçu de la page : ce que contiendrait l'envoi si l'échéance tombait maintenant (lecture seule)
async function previewRss(ctx, id, opts = {}) {
  const rss = requireRss(ctx, id);
  try {
    const found = await newItems(ctx, rss, nowOf(ctx), opts);
    return { items: found.fresh.slice(0, rss.max_items), more: Math.max(0, found.fresh.length - rss.max_items), total: found.total, firstRun: found.firstRun, error: null };
  } catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    return { items: [], more: 0, total: 0, firstRun: false, error: error.message };
  }
}

function jobHandlers({ db, bus = null, settings, env = process.env, log = console, now = Date.now }) {
  return {
    "rss.run": async ({ organizationId, rssId }) => {
      const ctx = { db, organizationId, userId: null, bus, settings, tokenKey: env.ENCRYPTION_KEY, baseUrl: env.SITE_URL, log, now };
      const r = await runRss(ctx, rssId, { now: now() });
      if (r.text && log && log.info) log.info(`[marketing] Campagne RSS ${rssId} : ${r.text}`);
    },
  };
}

module.exports = {
  createRss, updateRss, deleteRss, getRss, requireRss, listRss, rssSends, activateRss, pauseRss, runRss, previewRss, activationCheck,
  nextRunAt, jobHandlers, FREQUENCIES, WEEKDAYS, STATUSES,
};
