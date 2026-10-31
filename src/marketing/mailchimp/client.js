// Client HTTP de l'API Mailchimp Marketing v3 (et, via createTransport, de Mandrill) :
//  - au plus `maxConcurrent` requêtes simultanées (Mailchimp limite à 10 CONNEXIONS simultanées, pas 10 requêtes par seconde) ; les autres attendent leur tour ;
//  - 429 : toujours réessayé (la requête n'a pas été traitée), en respectant « Retry-After » ; 5xx et pannes réseau : réessayés pour les méthodes sans effet de bord
//    (GET, PUT, PATCH, DELETE) seulement, jamais un POST (un envoi ou une création pourrait être dupliqué) ; délai exponentiel avec gigue ;
//  - chaque appel est journalisé par `onLog` SANS clé, SANS corps et avec l'empreinte d'un membre masquée ;
//  - toute erreur devient une MailchimpError normalisée (code stable, message français).
const { MailchimpError, fromResponse } = require("./errors");

const KEY_PATTERN = /^[0-9a-f]{32}-([a-z]{2,4}[0-9]{1,3})$/;
const IDEMPOTENT = new Set(["GET", "PUT", "PATCH", "DELETE", "HEAD"]);

// « clé-us21 » → { dc: "us21" } ; null si le format n'est pas celui d'une clé Mailchimp
function parseApiKey(apiKey) {
  const match = KEY_PATTERN.exec(String(apiKey ?? "").trim());
  return match ? { dc: match[1] } : null;
}

// Adresse de base : l'hôte dépend du centre de données porté par la clé. MAILCHIMP_API_BASE (variable d'hébergement, jamais un champ de l'interface)
// permet de viser un serveur de test ; en production elle doit être en HTTPS.
function baseUrlFor(apiKey, env = process.env) {
  const parsed = parseApiKey(apiKey);
  if (!parsed) throw new MailchimpError("key_format", "Format de clé invalide : une clé Mailchimp ressemble à « 0123456789abcdef0123456789abcdef-us21 » (32 caractères, un tiret, le centre de données).");
  const override = String(env.MAILCHIMP_API_BASE || "").trim().replace(/\/+$/, "");
  if (override) {
    if (!/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(override) || (env.NODE_ENV === "production" && !override.startsWith("https://"))) throw new MailchimpError("config", "MAILCHIMP_API_BASE est invalide (adresse HTTPS attendue en production).");
    return override;
  }
  return `https://${parsed.dc}.api.mailchimp.com/3.0`;
}

// Chemin pour le journal : sans paramètres de requête, empreinte de membre masquée
const logPath = (path) => String(path).split("?")[0].replace(/\/members\/[0-9a-f]{32}/gi, "/members/:hash").replace(/\/queue\/[0-9a-f]{32}/gi, "/queue/:hash").slice(0, 200);

// Les limiteurs sont PARTAGÉS par clé (une par organisation) : l'écran, la synchronisation et les webhooks d'une même organisation se partagent les 10 connexions que Mailchimp autorise,
// au lieu d'avoir chacun son propre compteur.
const LIMITERS = new Map();
function limiterFor(key, limit) {
  const make = () => ({ active: 0, waiting: [], limit });
  if (!key) return make();
  if (!LIMITERS.has(key)) LIMITERS.set(key, make());
  return LIMITERS.get(key);
}

function createTransport({ fetchImpl = globalThis.fetch, maxConcurrent = 8, maxRetries = 3, timeoutMs = 30000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), random = Math.random, onLog = () => {}, maxBackoffMs = 30000, limiterKey = null } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("fetch indisponible (Node 18 ou plus requis).");
  const limit = Math.min(Math.max(Number(maxConcurrent) || 1, 1), 10);
  const lim = limiterFor(limiterKey, limit);
  const release = () => { lim.active--; const next = lim.waiting.shift(); if (next) next(); };
  const acquire = () => (lim.active < lim.limit ? (lim.active++, Promise.resolve()) : new Promise((resolve) => lim.waiting.push(() => { lim.active++; resolve(); })));
  const metrics = { requests: 0, retries: 0, maxActive: 0 };

  async function once({ method, url, headers, body, timeout }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout || timeoutMs);
    try {
      const res = await fetchImpl(url, { method, headers, body, signal: controller.signal, redirect: "error" });
      const text = await res.text();
      let json = null;
      if (text) { try { json = JSON.parse(text); } catch { json = null; } }
      return { status: res.status, json, text, headers: res.headers };
    } finally { clearTimeout(timer); }
  }

  // classify(status, json) → MailchimpError | null (null = succès)
  async function send({ method, url, headers = {}, body, path, timeout, classify, retryUnsafe = false }) {
    const verb = method.toUpperCase();
    const retryOnFailure = IDEMPOTENT.has(verb) || retryUnsafe;
    const started = Date.now();
    let attempt = 0, lastError = null;
    await acquire();
    metrics.maxActive = Math.max(metrics.maxActive, lim.active);
    try {
      for (;;) {
        attempt++; metrics.requests++;
        let error = null, res = null;
        try {
          res = await once({ method: verb, url, headers, body, timeout });
          error = classify(res.status, res.json, res);
        } catch (cause) {
          const timedOut = cause && (cause.name === "AbortError" || /abort/i.test(String(cause.message)));
          error = timedOut
            ? new MailchimpError("timeout", "Mailchimp n'a pas répondu à temps. Réessayez ; si le problème persiste, consultez status.mailchimp.com.", { retryable: true })
            : new MailchimpError("network", "Impossible de joindre Mailchimp (réseau ou DNS). Vérifiez la connexion du serveur puis réessayez.", { retryable: true, detail: String(cause && cause.code || cause && cause.message || "").slice(0, 200) });
        }
        if (!error) {
          onLog({ method: verb, path: logPath(path), status: res.status, durationMs: Date.now() - started, attempts: attempt, errorCode: "" });
          return res;
        }
        lastError = error;
        const canRetry = attempt <= maxRetries && (error.code === "rate_limited" || (error.retryable && retryOnFailure));
        if (!canRetry) break;
        metrics.retries++;
        const retryAfter = res && res.headers && Number(res.headers.get && res.headers.get("retry-after"));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** (attempt - 1) + random() * 250;
        await sleep(Math.min(backoff, maxBackoffMs));
      }
      onLog({ method: verb, path: logPath(path), status: lastError.status || 0, durationMs: Date.now() - started, attempts: attempt, errorCode: lastError.code });
      throw lastError;
    } finally { release(); }
  }
  return { send, metrics };
}

// Client Marketing v3. `get/post/put/patch/del` renvoient directement le JSON (sans le bloc _links) ; une erreur lève une MailchimpError.
function createClient({ apiKey, env = process.env, ...options } = {}) {
  const base = baseUrlFor(apiKey, env);
  const transport = createTransport(options);
  const auth = `Basic ${Buffer.from(`kolakisa:${String(apiKey).trim()}`).toString("base64")}`;

  const strip = (value) => {
    if (Array.isArray(value)) return value.map(strip);
    if (value && typeof value === "object") { const out = {}; for (const [k, v] of Object.entries(value)) if (k !== "_links") out[k] = strip(v); return out; }
    return value;
  };
  function qs(query) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null && v !== "") p.append(k, Array.isArray(v) ? v.join(",") : String(v));
    const text = p.toString();
    return text ? `?${text}` : "";
  }
  async function request(method, path, { query, body, timeout } = {}) {
    if (typeof path !== "string" || !path.startsWith("/") || path.includes("..") || /\/\.(?:\/|\?|$)/.test(path) || /[\s\\]/.test(path)) throw new MailchimpError("invalid_request", "Chemin d'API invalide.");
    const res = await transport.send({
      method, path, url: `${base}${path}${qs(query)}`, timeout,
      headers: { Authorization: auth, Accept: "application/json", "User-Agent": "Kolakisa-Mailchimp/1.0", ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      classify: (status, json) => (status >= 200 && status < 300 ? null : fromResponse(status, json)),
    });
    return res.status === 204 || res.json === null ? null : strip(res.json);
  }
  // Parcourt une collection paginée (count/offset) : toutes les pages jusqu'à `maxItems` (défaut 20 000, garde-fou mémoire)
  async function collect(path, key, { query = {}, pageSize = 500, maxItems = 20000 } = {}) {
    const items = [];
    let offset = 0, total = Infinity;
    while (offset < total && items.length < maxItems) {
      const page = await request("GET", path, { query: { ...query, count: Math.min(pageSize, maxItems - items.length), offset } });
      const batch = (page && page[key]) || [];
      total = Number.isFinite(page && page.total_items) ? page.total_items : offset + batch.length;
      items.push(...batch);
      if (!batch.length) break;
      offset += batch.length;
    }
    return { items, total: Number.isFinite(total) ? total : items.length, truncated: items.length < (Number.isFinite(total) ? total : 0) };
  }
  return {
    dc: parseApiKey(apiKey).dc, base, metrics: transport.metrics,
    request, collect,
    get: (path, query) => request("GET", path, { query }),
    post: (path, body, opts) => request("POST", path, { body: body ?? {}, ...opts }),
    put: (path, body) => request("PUT", path, { body: body ?? {} }),
    patch: (path, body) => request("PATCH", path, { body: body ?? {} }),
    del: (path, query) => request("DELETE", path, { query }),
    ping: () => request("GET", "/ping"),
  };
}

module.exports = { createClient, createTransport, parseApiKey, baseUrlFor, logPath, MailchimpError };
