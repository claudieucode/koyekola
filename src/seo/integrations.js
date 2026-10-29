// Intégrations externes du SEO CORE : PageSpeed Insights, Google Search Console, Google Analytics 4.
// Règle : aucune donnée inventée. Sans configuration → « Non connecté » / « Configuration requise » ; une donnée absente
// de la réponse de Google → « Non disponible ». Les secrets (clé de compte de service, clé d'API) sont chiffrés
// (AES-256-GCM, ENCRYPTION_KEY) et ne sont jamais renvoyés au navigateur ni écrits dans les journaux.
// Appels conformes aux API publiques de Google (OAuth 2.0 compte de service JWT, Search Analytics v3, GA4 Data API v1beta,
// PageSpeed Insights v5). Adresses surchargeables UNIQUEMENT pour les tests (variables SEO_*_URL).
const crypto = require("crypto");
const { db, logChange } = require("./store");
const { encryptSecret, decryptSecret } = require("../marketing/security/crypto");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_integrations (
    name TEXT PRIMARY KEY,
    config TEXT NOT NULL DEFAULT '{}',
    secret TEXT,
    status TEXT NOT NULL DEFAULT 'not_connected',
    checked_at TEXT,
    last_error TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS seo_integration_cache (
    name TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    data TEXT NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (name, cache_key)
  );
  CREATE TABLE IF NOT EXISTS seo_pagespeed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    strategy TEXT NOT NULL,
    ok INTEGER NOT NULL DEFAULT 0,
    data TEXT,
    error TEXT,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_seo_pagespeed_url ON seo_pagespeed(url, strategy, id);
`);

const URLS = {
  token: () => process.env.SEO_GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token",
  gsc: () => process.env.SEO_GSC_URL || "https://www.googleapis.com/webmasters/v3",
  ga4: () => process.env.SEO_GA4_URL || "https://analyticsdata.googleapis.com/v1beta",
  psi: () => process.env.SEO_PSI_URL || "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
};
const SCOPES = { search_console: "https://www.googleapis.com/auth/webmasters.readonly", analytics: "https://www.googleapis.com/auth/analytics.readonly" };
const NAMES = { pagespeed: "PageSpeed Insights", search_console: "Google Search Console", analytics: "Google Analytics 4" };

class IntegrationError extends Error {}

// Portée par site : la configuration d'un site (propriété Search Console, propriété GA4, clé de compte de service) est stockée sous un nom
// « base@site<id> », distinct de celui de l'équipe centrale et de celui des autres sites. Le site vient de l'appelant (adresse vérifiée), jamais de la saisie.
// Le nom fait partie des données authentifiées du chiffrement (seo:<nom>) : une clé copiée d'un site à l'autre ne se déchiffre pas.
const BASES = ["search_console", "analytics"];
const baseOf = (name) => String(name).split("@")[0];
function scoped(name, siteId = null) {
  if (siteId === null || siteId === undefined) return name;
  if (!Number.isInteger(siteId) || siteId <= 0 || !BASES.includes(name)) throw new IntegrationError("Intégration d'un site : site ou intégration invalide.");
  return `${name}@site${siteId}`;
}
const encryptionKey = () => process.env.ENCRYPTION_KEY || "";

function row(name) {
  const r = db.prepare("SELECT * FROM seo_integrations WHERE name = ?").get(name);
  return r ? { ...r, config: JSON.parse(r.config || "{}") } : { name, config: {}, secret: null, status: "not_connected", checked_at: null, last_error: null };
}
function readSecret(name) {
  const r = row(name);
  if (!r.secret) return null;
  try { return decryptSecret(r.secret, encryptionKey(), `seo:${name}`); } catch { return null; }
}
// État affiché : jamais « connecté » sans vérification réelle réussie
function status(name) {
  const r = row(name);
  const needsSecret = baseOf(name) !== "pagespeed";
  if (!needsSecret) {
    if (r.secret && r.status === "error") return { state: "error", label: "Erreur avec la clé", detail: r.last_error, hasKey: true };
    return r.secret ? { state: "connected", label: "Clé d'API enregistrée", detail: r.checked_at ? `Dernière analyse réussie le ${r.checked_at}` : null, hasKey: true } : { state: "available", label: "Disponible sans clé (quota partagé)", detail: null, hasKey: false };
  }
  if (needsSecret && !encryptionKey()) return { state: "config_required", label: "Configuration requise", detail: "La variable ENCRYPTION_KEY doit être définie sur le serveur pour stocker la clé chiffrée." };
  if (needsSecret && !r.secret) return { state: "not_connected", label: "Non connecté", detail: null };
  if (r.status === "connected") return { state: "connected", label: "Connecté", detail: `Vérifié le ${r.checked_at}`, config: r.config };
  if (r.status === "error") return { state: "error", label: "Erreur de connexion", detail: r.last_error, config: r.config };
  return { state: "not_verified", label: "Non vérifié", detail: null, config: r.config };
}

function saveConfig(name, { config = {}, secret = undefined }, userId) {
  const before = row(name);
  let enc = before.secret;
  if (secret !== undefined) {
    if (secret === null || secret === "") enc = null;
    else {
      if (!encryptionKey()) throw new IntegrationError("ENCRYPTION_KEY n'est pas définie sur le serveur : impossible de stocker la clé de façon sûre.");
      enc = encryptSecret(secret, encryptionKey(), `seo:${name}`);
    }
  }
  db.prepare(`INSERT INTO seo_integrations (name, config, secret, status, updated_at) VALUES (?, ?, ?, 'not_verified', datetime('now'))
    ON CONFLICT(name) DO UPDATE SET config = excluded.config, secret = excluded.secret, status = 'not_verified', last_error = NULL, updated_at = excluded.updated_at`).run(name, JSON.stringify(config), enc);
  db.prepare("DELETE FROM seo_integration_cache WHERE name = ?").run(name);
  logChange({ entityType: "integration", entityKey: name, field: "configuration", before: JSON.stringify(before.config), after: `${JSON.stringify(config)}${secret !== undefined ? (enc ? " + clé (chiffrée)" : " (clé retirée)") : ""}`, userId });
}
function disconnect(name, userId) {
  db.prepare("DELETE FROM seo_integrations WHERE name = ?").run(name);
  db.prepare("DELETE FROM seo_integration_cache WHERE name = ?").run(name);
  logChange({ entityType: "integration", entityKey: name, field: "configuration", before: "configurée", after: null, userId });
}
const markChecked = (name, ok, error = null) => db.prepare("UPDATE seo_integrations SET status = ?, checked_at = datetime('now'), last_error = ? WHERE name = ?").run(ok ? "connected" : "error", error, name);

// Clé de compte de service : contrôle de forme (rien n'est envoyé à Google ici)
function parseServiceAccount(text) {
  let j;
  try { j = JSON.parse(String(text || "")); } catch { throw new IntegrationError("Fichier de clé illisible : collez le contenu complet du fichier JSON téléchargé dans Google Cloud."); }
  if (j.type !== "service_account" || !j.client_email || !/BEGIN PRIVATE KEY/.test(j.private_key || "")) throw new IntegrationError("Ce fichier n'est pas une clé de compte de service Google (type « service_account » avec client_email et private_key).");
  return { client_email: j.client_email, private_key: j.private_key, token_uri: j.token_uri };
}

async function http(url, { method = "GET", headers = {}, body = null, timeout = 30000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { method, headers, body, signal: ctrl.signal });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    return { status: res.status, data };
  } catch (e) {
    throw new IntegrationError(e.name === "AbortError" ? "Google n'a pas répondu à temps (délai dépassé)." : "Impossible de joindre les serveurs de Google.");
  } finally { clearTimeout(timer); }
}
const googleMessage = (r) => String((r.data && r.data.error && (r.data.error.message || r.data.error_description || r.data.error)) || `réponse ${r.status}`).slice(0, 300);

// Jeton d'accès OAuth 2.0 (compte de service, assertion JWT signée RS256), gardé en mémoire jusqu'à son expiration
const tokens = new Map();
async function accessToken(name) {
  const cached = tokens.get(name);
  if (cached && cached.expires > Date.now() + 60000) return cached.token;
  if (!SCOPES[baseOf(name)]) throw new IntegrationError("Intégration inconnue.");
  const sa = parseServiceAccount(readSecret(name));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: SCOPES[baseOf(name)], aud: URLS.token(), iat: now, exp: now + 3600 })}`;
  let signature;
  try { signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url"); } catch { throw new IntegrationError("La clé privée du compte de service est invalide."); }
  const r = await http(URLS.token(), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }).toString() });
  if (r.status !== 200 || !r.data || !r.data.access_token) throw new IntegrationError(`Google a refusé la clé du compte de service : ${googleMessage(r)}`);
  tokens.set(name, { token: r.data.access_token, expires: Date.now() + (Number(r.data.expires_in) || 3600) * 1000 });
  return r.data.access_token;
}

// ---------- Search Console ----------
const ymd = (d) => d.toISOString().slice(0, 10);
// Les données de Search Console ont environ 2 à 3 jours de retard : la période se termine il y a 3 jours
function periods(days) {
  const end = new Date(Date.now() - 3 * 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
  return { current: { start: ymd(start), end: ymd(end) }, previous: { start: ymd(prevStart), end: ymd(prevEnd) } };
}
async function gscQuery(body, name = "search_console") {
  const property = row(name).config.property;
  if (!property) throw new IntegrationError("Propriété Search Console non renseignée.");
  const token = await accessToken(name);
  const r = await http(`${URLS.gsc()}/sites/${encodeURIComponent(property)}/searchAnalytics/query`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (r.status === 403) throw new IntegrationError(`Accès refusé par Search Console : ajoutez l'adresse du compte de service comme utilisateur de la propriété « ${property} » (Paramètres → Utilisateurs et autorisations). Détail : ${googleMessage(r)}`);
  if (r.status !== 200) throw new IntegrationError(`Erreur Search Console : ${googleMessage(r)}`);
  return (r.data && r.data.rows) || [];
}
async function testSearchConsole(siteId = null) {
  const name = scoped("search_console", siteId);
  try {
    const p = periods(7);
    await gscQuery({ startDate: p.current.start, endDate: p.current.end, rowLimit: 1 }, name);
    markChecked(name, true);
    return { ok: true };
  } catch (e) { markChecked(name, false, e.message); return { ok: false, error: e.message }; }
}
const sum = (rows) => {
  const t = rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions, pos: a.pos + r.position * r.impressions }), { clicks: 0, impressions: 0, pos: 0 });
  return { clicks: t.clicks, impressions: t.impressions, ctr: t.impressions ? t.clicks / t.impressions : null, position: t.impressions ? t.pos / t.impressions : null };
};
// Rapport : totaux et détail sur la période et la précédente + analyses statistiques (aucune extrapolation)
async function searchConsoleReport(days = 28, { refresh = false, siteId = null } = {}) {
  const name = scoped("search_console", siteId);
  const key = `report:${days}`;
  const cached = db.prepare("SELECT data, fetched_at FROM seo_integration_cache WHERE name = ? AND cache_key = ? AND fetched_at >= datetime('now', '-6 hours')").get(name, key);
  if (cached && !refresh) return { ...JSON.parse(cached.data), fetchedAt: cached.fetched_at, fromCache: true };
  const p = periods(days);
  const q = (range, dimension) => gscQuery({ startDate: range.start, endDate: range.end, dimensions: [dimension], rowLimit: 1000 }, name);
  const [pagesNow, pagesBefore, queriesNow, queriesBefore] = await Promise.all([q(p.current, "page"), q(p.previous, "page"), q(p.current, "query"), q(p.previous, "query")]);
  const byKey = (rows) => new Map(rows.map((r) => [r.keys[0], r]));
  const pb = byKey(pagesBefore);
  const qb = byKey(queriesBefore);
  const pageDelta = pagesNow.map((r) => ({ page: r.keys[0], clicks: r.clicks, before: pb.has(r.keys[0]) ? pb.get(r.keys[0]).clicks : 0 })).map((x) => ({ ...x, delta: x.clicks - x.before }));
  const lost = pagesBefore.filter((r) => !pagesNow.some((n) => n.keys[0] === r.keys[0])).map((r) => ({ page: r.keys[0], clicks: 0, before: r.clicks, delta: -r.clicks }));
  const all = [...pageDelta, ...lost];
  const report = {
    period: p, days,
    totals: { current: sum(pagesNow), previous: sum(pagesBefore) },
    topQueries: queriesNow.slice().sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 25).map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    topPages: pagesNow.slice().sort((a, b) => b.clicks - a.clicks).slice(0, 25).map((r) => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    insights: {
      growing: all.filter((x) => x.delta >= 5).sort((a, b) => b.delta - a.delta).slice(0, 10),
      declining: all.filter((x) => x.delta <= -5).sort((a, b) => a.delta - b.delta).slice(0, 10),
      emerging: queriesNow.filter((r) => !qb.has(r.keys[0]) && r.impressions >= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 10).map((r) => ({ query: r.keys[0], impressions: r.impressions, position: r.position })),
      lowCtr: queriesNow.filter((r) => r.impressions >= 100 && r.ctr < 0.02).sort((a, b) => b.impressions - a.impressions).slice(0, 10).map((r) => ({ query: r.keys[0], impressions: r.impressions, ctr: r.ctr, position: r.position })),
      nearTop: queriesNow.filter((r) => r.position >= 8 && r.position <= 20 && r.impressions >= 50).sort((a, b) => b.impressions - a.impressions).slice(0, 10).map((r) => ({ query: r.keys[0], impressions: r.impressions, position: r.position })),
    },
  };
  db.prepare("INSERT INTO seo_integration_cache (name, cache_key, data, fetched_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(name, cache_key) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at").run(name, key, JSON.stringify(report));
  return { ...report, fetchedAt: new Date().toISOString().slice(0, 19).replace("T", " "), fromCache: false };
}

// Une seule page (onglet SEO de l'éditeur) : totaux sur deux périodes et requêtes qui l'ont affichée — filtre « page »
// de l'API Search Analytics. Cache 6 h par adresse.
async function pageReport(pageUrl, days = 28, { refresh = false, siteId = null } = {}) {
  const name = scoped("search_console", siteId);
  const key = `page:${days}:${pageUrl}`;
  const cached = db.prepare("SELECT data, fetched_at FROM seo_integration_cache WHERE name = ? AND cache_key = ? AND fetched_at >= datetime('now', '-6 hours')").get(name, key);
  if (cached && !refresh) return { ...JSON.parse(cached.data), fetchedAt: cached.fetched_at, fromCache: true };
  const p = periods(days);
  const filter = [{ filters: [{ dimension: "page", operator: "equals", expression: pageUrl }] }];
  const q = (range, dimensions, rowLimit) => gscQuery({ startDate: range.start, endDate: range.end, dimensions, dimensionFilterGroups: filter, rowLimit }, name);
  const [now, before, queries] = await Promise.all([q(p.current, [], 1), q(p.previous, [], 1), q(p.current, ["query"], 100)]);
  const report = {
    page: pageUrl, period: p, days,
    totals: { current: sum(now), previous: sum(before) },
    queries: queries.slice().sort((a, b) => b.impressions - a.impressions).slice(0, 50).map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
  };
  db.prepare("INSERT INTO seo_integration_cache (name, cache_key, data, fetched_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(name, cache_key) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at").run(name, key, JSON.stringify(report));
  return { ...report, fetchedAt: new Date().toISOString().slice(0, 19).replace("T", " "), fromCache: false };
}

// ---------- Google Analytics 4 ----------
async function ga4Report(body, name = "analytics") {
  const propertyId = row(name).config.propertyId;
  if (!propertyId) throw new IntegrationError("Identifiant de propriété GA4 non renseigné.");
  const token = await accessToken(name);
  const r = await http(`${URLS.ga4()}/properties/${encodeURIComponent(propertyId)}:runReport`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (r.status === 403) throw new IntegrationError(`Accès refusé par Google Analytics : ajoutez l'adresse du compte de service avec le rôle « Lecteur » sur la propriété ${propertyId} (Administration → Gestion des accès). Détail : ${googleMessage(r)}`);
  if (r.status !== 200) throw new IntegrationError(`Erreur Google Analytics : ${googleMessage(r)}`);
  return r.data || {};
}
async function testAnalytics(siteId = null) {
  const name = scoped("analytics", siteId);
  try {
    await ga4Report({ dateRanges: [{ startDate: "7daysAgo", endDate: "today" }], metrics: [{ name: "activeUsers" }], limit: 1 }, name);
    markChecked(name, true);
    return { ok: true };
  } catch (e) { markChecked(name, false, e.message); return { ok: false, error: e.message }; }
}
async function analyticsReport(days = 28, { refresh = false, siteId = null } = {}) {
  const name = scoped("analytics", siteId);
  const key = `report:${days}`;
  const cached = db.prepare("SELECT data, fetched_at FROM seo_integration_cache WHERE name = ? AND cache_key = ? AND fetched_at >= datetime('now', '-6 hours')").get(name, key);
  if (cached && !refresh) return { ...JSON.parse(cached.data), fetchedAt: cached.fetched_at, fromCache: true };
  const range = [{ startDate: `${days}daysAgo`, endDate: "yesterday" }];
  const METRICS = ["activeUsers", "sessions", "screenPageViews", "keyEvents"];
  const [totals, pages, sources] = await Promise.all([
    ga4Report({ dateRanges: range, metrics: METRICS.map((m) => ({ name: m })) }, name),
    ga4Report({ dateRanges: range, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 25 }, name),
    ga4Report({ dateRanges: range, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 }, name),
  ]);
  const val = (r, i) => (r && r.metricValues && r.metricValues[i] ? Number(r.metricValues[i].value) : null);
  const t = totals.rows && totals.rows[0];
  const report = {
    days,
    totals: Object.fromEntries(METRICS.map((m, i) => [m, t ? val(t, i) : null])),
    pages: (pages.rows || []).map((r) => ({ path: r.dimensionValues[0].value, views: val(r, 0), users: val(r, 1) })),
    channels: (sources.rows || []).map((r) => ({ channel: r.dimensionValues[0].value, sessions: val(r, 0) })),
  };
  db.prepare("INSERT INTO seo_integration_cache (name, cache_key, data, fetched_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(name, cache_key) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at").run(name, key, JSON.stringify(report));
  return { ...report, fetchedAt: new Date().toISOString().slice(0, 19).replace("T", " "), fromCache: false };
}

// ---------- PageSpeed Insights ----------
// Mesures de laboratoire (Lighthouse) et, si Google en dispose pour l'adresse, données réelles des visiteurs (CrUX)
function parsePageSpeed(data) {
  const lh = data.lighthouseResult || {};
  const audits = lh.audits || {};
  const num = (id) => (audits[id] && typeof audits[id].numericValue === "number" ? audits[id].numericValue : null);
  const field = (data.loadingExperience && data.loadingExperience.metrics) || {};
  const f = (k) => (field[k] ? { value: field[k].percentile, category: field[k].category } : null);
  const opportunities = Object.values(audits).filter((a) => a.details && a.details.type === "opportunity" && typeof a.score === "number" && a.score < 0.9).map((a) => ({ title: a.title, savingsMs: a.details.overallSavingsMs || null })).sort((a, b) => (b.savingsMs || 0) - (a.savingsMs || 0)).slice(0, 8);
  return {
    performance: lh.categories && lh.categories.performance && typeof lh.categories.performance.score === "number" ? Math.round(lh.categories.performance.score * 100) : null,
    lab: { lcp: num("largest-contentful-paint"), cls: num("cumulative-layout-shift"), fcp: num("first-contentful-paint"), tbt: num("total-blocking-time"), si: num("speed-index"), ttfb: num("server-response-time") },
    field: { lcp: f("LARGEST_CONTENTFUL_PAINT_MS"), inp: f("INTERACTION_TO_NEXT_PAINT"), cls: f("CUMULATIVE_LAYOUT_SHIFT_SCORE"), fcp: f("FIRST_CONTENTFUL_PAINT_MS"), ttfb: f("EXPERIMENTAL_TIME_TO_FIRST_BYTE") },
    fieldAvailable: Object.keys(field).length > 0,
    opportunities,
    lighthouseVersion: lh.lighthouseVersion || null,
  };
}
async function runPageSpeed(url, strategy = "mobile") {
  if (!/^https:\/\//i.test(url)) throw new IntegrationError("PageSpeed Insights ne peut analyser qu'une adresse publique en https (définissez SITE_URL).");
  const params = new URLSearchParams({ url, strategy: strategy === "desktop" ? "desktop" : "mobile", category: "performance" });
  const key = readSecret("pagespeed");
  if (key) params.set("key", key);
  let result;
  try {
    const r = await http(`${URLS.psi()}?${params}`, { timeout: 90000 });
    if (key && (r.status === 400 || r.status === 403) && /key/i.test(googleMessage(r))) { markChecked("pagespeed", false, googleMessage(r)); throw new IntegrationError(`Clé d'API PageSpeed refusée par Google : ${googleMessage(r)}`); }
    if (r.status === 429) throw new IntegrationError("Quota PageSpeed atteint : ajoutez une clé d'API Google (gratuite) dans la configuration, ou réessayez plus tard.");
    if (r.status !== 200 || !r.data) throw new IntegrationError(`PageSpeed Insights a répondu ${r.status} : ${googleMessage(r)}`);
    result = parsePageSpeed(r.data);
    db.prepare("INSERT INTO seo_pagespeed (url, strategy, ok, data) VALUES (?, ?, 1, ?)").run(url, strategy, JSON.stringify(result));
    if (key) markChecked("pagespeed", true);
    return { ok: true, result };
  } catch (e) {
    db.prepare("INSERT INTO seo_pagespeed (url, strategy, ok, error) VALUES (?, ?, 0, ?)").run(url, strategy, String(e.message).slice(0, 300));
    return { ok: false, error: e.message };
  }
}
const pageSpeedHistory = (limit = 30, url = null) => (url ? db.prepare("SELECT * FROM seo_pagespeed WHERE url = ? ORDER BY id DESC LIMIT ?").all(url, limit) : db.prepare("SELECT * FROM seo_pagespeed ORDER BY id DESC LIMIT ?").all(limit)).map((r) => ({ ...r, data: r.data ? JSON.parse(r.data) : null }));

module.exports = {
  NAMES, scoped, status, row, saveConfig, disconnect, parseServiceAccount, testSearchConsole, testAnalytics, searchConsoleReport, pageReport, analyticsReport,
  runPageSpeed, parsePageSpeed, pageSpeedHistory, IntegrationError, periods,
};
