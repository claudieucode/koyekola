// Couche réseau UNIQUE des connecteurs : aucun adaptateur n'appelle fetch lui-même. Elle impose, pour chaque appel sortant :
//   • HTTPS seulement, vers un NOM D'HÔTE déclaré par l'adaptateur (liste fermée : jamais une adresse venue d'un utilisateur → pas de SSRF) ; jamais une adresse IP littérale ;
//   • refus si le nom se résout vers une adresse privée, locale ou « lien-local » (réseaux internes) ;
//   • aucune redirection suivie ; délai maximal ; taille de réponse bornée ; réponse JSON uniquement ;
//   • erreurs normalisées (ConnectorError) et messages débarrassés de tout secret.
// Tests : CONNECTOR_API_BASE_<ID> (hors production seulement) remplace la base par un faux serveur local ; c'est la SEULE exception (jamais lue en production).
const dns = require("node:dns").promises;
const net = require("node:net");
const { ConnectorError, scrub } = require("./errors");

const PRIVATE_V4 = [/^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^192\.0\.0\./, /^198\.1[89]\./, /^2(2[4-9]|[3-5]\d)\./];
function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) return PRIVATE_V4.some((re) => re.test(ip));
  if (net.isIPv6(ip)) { const v = ip.toLowerCase(); const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v); if (mapped) return isPrivateAddress(mapped[1]); return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v); }
  return true; // forme inconnue : refusée
}
const testBase = (id) => (process.env.NODE_ENV !== "production" ? process.env[`CONNECTOR_API_BASE_${String(id).toUpperCase().replace(/[^A-Z0-9]/g, "_")}`] || "" : "");

// Adresse de base d'un adaptateur : celle du fournisseur (déclarée), ou le faux serveur de test
const baseOf = (adapter) => testBase(adapter.id) || adapter.baseUrl;

async function request(adapter, { path, method = "GET", headers = {}, json, secrets = [], timeoutMs = adapter.timeoutMs || 20000, maxBytes = adapter.maxBytes || 2 * 1024 * 1024 }) {
  const override = testBase(adapter.id);
  let url;
  try { url = new URL(`${baseOf(adapter).replace(/\/+$/, "")}${path}`); } catch { throw new ConnectorError("blocked_destination", "Adresse du fournisseur invalide."); }
  const declared = new URL(adapter.baseUrl).hostname;
  if (!override) {
    if (url.protocol !== "https:" || url.hostname !== declared || net.isIP(url.hostname) || url.username || url.password) throw new ConnectorError("blocked_destination", "Destination non autorisée pour ce connecteur.");
    let addresses;
    try { addresses = await dns.lookup(url.hostname, { all: true }); } catch { throw new ConnectorError("network", "Le fournisseur est injoignable (nom introuvable).", { retryable: true }); }
    if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) throw new ConnectorError("blocked_destination", "Destination non autorisée (adresse interne).");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, { method, redirect: "manual", signal: controller.signal, headers: { accept: "application/json", ...(json !== undefined ? { "content-type": "application/json" } : {}), ...headers }, body: json !== undefined ? JSON.stringify(json) : undefined });
  } catch (error) {
    clearTimeout(timer);
    if (error && error.name === "AbortError") throw new ConnectorError("timeout", `Le fournisseur n'a pas répondu en ${Math.round(timeoutMs / 1000)} s.`, { retryable: true });
    throw new ConnectorError("network", "Le fournisseur est injoignable.", { retryable: true });
  }
  try {
    if (response.status >= 300 && response.status < 400) throw new ConnectorError("blocked_destination", "Le fournisseur a demandé une redirection : refusée.", { status: response.status });
    const reader = response.body ? response.body.getReader() : null;
    const chunks = []; let size = 0;
    while (reader) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length; if (size > maxBytes) { controller.abort(); throw new ConnectorError("response_too_large", "Réponse du fournisseur trop volumineuse : abandonnée."); }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    let body = null;
    if (text) { try { body = JSON.parse(text); } catch { if (response.ok) throw new ConnectorError("invalid_response", "Réponse du fournisseur illisible (JSON attendu).", { status: response.status }); } }
    if (!response.ok) throw fromStatus(response.status, body, secrets);
    return { status: response.status, body, headers: response.headers };
  } catch (error) {
    if (error instanceof ConnectorError) { error.message = scrub(error.message, secrets); throw error; }
    if (error && error.name === "AbortError") throw new ConnectorError("timeout", "Délai dépassé pendant la lecture de la réponse.", { retryable: true });
    throw new ConnectorError("unknown", "Erreur inattendue pendant l'appel au fournisseur.");
  } finally { clearTimeout(timer); }
}

// Statut HTTP + corps d'erreur → code normalisé. Le texte du fournisseur n'est gardé que s'il est court et nettoyé.
function fromStatus(status, body, secrets) {
  const raw = body && (typeof body.error === "string" ? body.error : body.error && (body.error.message || body.error.status)) || (body && body.message) || "";
  const detail = scrub(raw, secrets).slice(0, 200);
  const suffix = detail ? ` (« ${detail} »)` : "";
  if (status === 401) return new ConnectorError("auth_invalid", `Identifiants refusés par le fournisseur${suffix}.`, { status });
  if (status === 403) return new ConnectorError("permission_denied", `Permissions insuffisantes chez le fournisseur${suffix}.`, { status });
  if (status === 404) return new ConnectorError("model_not_found", `Ressource ou modèle introuvable chez le fournisseur${suffix}.`, { status });
  if (status === 402 || (status === 429 && /quota|credit|billing|exceeded your current/i.test(raw))) return new ConnectorError("quota_exceeded", `Quota ou crédit épuisé chez le fournisseur${suffix}.`, { status });
  if (status === 429) return new ConnectorError("rate_limited", "Trop de demandes : le fournisseur demande de patienter.", { status, retryable: true });
  if (status >= 500) return new ConnectorError("unavailable", `Le fournisseur est momentanément indisponible (${status}).`, { status, retryable: true });
  return new ConnectorError("bad_request", `Demande refusée par le fournisseur (${status})${suffix}.`, { status });
}

module.exports = { request, isPrivateAddress, baseOf, testBase };
