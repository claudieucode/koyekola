// Protections de base pour la mise en ligne, sans dépendance externe.

// En-têtes HTTP de sécurité
function securityHeaders(req, res, next) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  // HTTPS uniquement (req.secure est fiable grâce à "trust proxy", voir server.js)
  if (req.secure) res.set("Strict-Transport-Security", "max-age=15552000");
  next();
}

// Refuse les envois de formulaire (POST, etc.) qui viennent d'un autre site (protection CSRF).
// Les hôtes acceptés : celui de la requête, celui transmis par le proxy, et celui de SITE_URL.
function sameOriginOnly(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const source = req.get("origin") || req.get("referer");
  if (!source) return next(); // certains navigateurs n'envoient ni l'un ni l'autre

  const allowedHosts = new Set([req.get("host"), req.get("x-forwarded-host")].filter(Boolean));
  if (process.env.SITE_URL) {
    try {
      allowedHosts.add(new URL(process.env.SITE_URL).host);
    } catch {
      // SITE_URL mal formée : on l'ignore
    }
  }

  let sourceHost = null;
  try {
    sourceHost = new URL(source).host;
  } catch {
    // en-tête illisible : refusé plus bas
  }

  if (!sourceHost || !allowedHosts.has(sourceHost)) {
    return res.status(403).render("error", { message: "Requête refusée (origine inconnue)." });
  }
  next();
}

// Limitation des tentatives de connexion : 10 échecs par adresse IP et par tranche de 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const failures = new Map(); // ip -> { count, since }

function loginBlocked(req) {
  const entry = failures.get(req.ip);
  if (!entry) return false;
  if (Date.now() - entry.since > WINDOW_MS) {
    failures.delete(req.ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordLoginFailure(req) {
  const entry = failures.get(req.ip);
  if (!entry || Date.now() - entry.since > WINDOW_MS) failures.set(req.ip, { count: 1, since: Date.now() });
  else entry.count += 1;
}

function clearLoginFailures(req) {
  failures.delete(req.ip);
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of failures) if (now - entry.since > WINDOW_MS) failures.delete(ip);
}, WINDOW_MS).unref();

// Limiteur générique : `max` actions par clé (adresse IP) et par période. isLimited() avant, hit() après une action réussie.
function createRateLimiter(max, windowMs) {
  const entries = new Map(); // clé -> { count, since }
  const fresh = (entry) => entry && Date.now() - entry.since <= windowMs;
  setInterval(() => {
    for (const [key, entry] of entries) if (!fresh(entry)) entries.delete(key);
  }, windowMs).unref();
  return {
    isLimited(key) {
      const entry = entries.get(key);
      return fresh(entry) && entry.count >= max;
    },
    hit(key) {
      const entry = entries.get(key);
      if (fresh(entry)) entry.count += 1;
      else entries.set(key, { count: 1, since: Date.now() });
    },
  };
}

module.exports = { securityHeaders, sameOriginOnly, loginBlocked, recordLoginFailure, clearLoginFailures, createRateLimiter };
