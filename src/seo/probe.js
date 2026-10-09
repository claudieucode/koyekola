// Sonde interne : interroge LE VRAI SERVEUR (redirections, historique d'adresses, routes, 404) par une requête HTTP locale, sans suivre
// automatiquement les redirections. Sert au test d'une redirection et à la détection des liens cassés : le résultat est celui que
// verrait un visiteur, pas un calcul parallèle. Connexion uniquement vers ce serveur (127.0.0.1) : aucune adresse extérieure n'est jamais appelée.
const http = require("node:http");
const crypto = require("node:crypto");

// Jeton propre à ce démarrage : une requête qui le porte n'est ni comptée (visites de redirection) ni journalisée (404)
const TOKEN = crypto.randomBytes(16).toString("hex");
const isProbe = (req) => req.get("x-kw-probe") === TOKEN;

function request(port, path, { host = null } = {}) {
  return new Promise((resolve) => {
    const headers = { "x-kw-probe": TOKEN, "user-agent": "KOLAKISA-sonde (bot)", accept: "text/html" };
    if (host) headers["x-forwarded-host"] = host;
    const req = http.request({ host: "127.0.0.1", port, path, method: "GET", headers, timeout: 8000 }, (res) => {
      res.resume();
      resolve({ status: res.statusCode, location: res.headers.location || null });
    });
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, location: null, error: "délai dépassé" }); });
    req.on("error", (e) => resolve({ status: 0, location: null, error: e.message }));
    req.end();
  });
}

// Suit les redirections de l'adresse (chemin du site) : [{ url, status, location }], jusqu'à une réponse finale ou 10 sauts
async function trace(port, start, { host = null, max = 10 } = {}) {
  const steps = [];
  let cur = start;
  for (let i = 0; i < max; i++) {
    const r = await request(port, cur, { host });
    steps.push({ url: cur, status: r.status, location: r.location, error: r.error || null });
    if (![301, 302, 303, 307, 308].includes(r.status) || !r.location) return { steps, final: r, loop: false };
    // Destination extérieure : on s'arrête (jamais d'appel vers un autre site)
    if (/^https?:\/\//i.test(r.location)) {
      try {
        const u = new URL(r.location);
        const same = host && u.hostname.toLowerCase() === host.toLowerCase();
        if (!same) return { steps, final: { ...r, external: true }, loop: false };
        cur = u.pathname + u.search;
      } catch { return { steps, final: r, loop: false }; }
    } else cur = r.location;
    if (steps.some((s) => s.url === cur)) { steps.push({ url: cur, status: 0, location: null, error: "boucle" }); return { steps, final: { status: 0 }, loop: true }; }
  }
  return { steps, final: steps[steps.length - 1], loop: true };
}

module.exports = { request, trace, isProbe, TOKEN };
