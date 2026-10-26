// Livraison des webhooks sortants : signature HMAC-SHA256 (horodatage inclus, comme Stripe), blocage SSRF (jamais
// vers une adresse privée/locale — vérifié à CHAQUE envoi, pas seulement à la création : une résolution DNS peut
// changer entre-temps), reprises via la file de travaux existante (aucune logique de nouvelle tentative réinventée
// ici : mk_jobs sait déjà faire — voir queue/jobs.js).
const crypto = require("crypto");
const dns = require("dns");
const net = require("net");
const http = require("http");
const https = require("https");
const { enqueue } = require("../queue/jobs");
const { UnrecoverableError } = require("../queue/worker");
const { decryptSecret } = require("../security/crypto");
const { endpointsFor, secretContext, getEndpoint } = require("./endpoints");
const { checkCtx } = require("../audience/shared");

const TIMEOUT_MS = 10_000;
const MAX_BODY_LOG = 500;

class SsrfError extends Error {}

// IPv4/IPv6 privées, loopback, lien-local, multidiffusion, réservées. Liste utile et lisible, pas une liste CIDR
// exhaustive : couvre RFC1918, la boucle locale, le lien-local (dont 169.254.169.254, adresse « métadonnées » des
// fournisseurs cloud), et les plages IPv6 équivalentes. Documentée comme non exhaustive (EMAIL_MARKETING_API.md).
function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || a >= 224) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;           // 100.64.0.0/10 : partage d'adresses des opérateurs (CGNAT)
    if (a === 192 && b === 0) return true;                        // 192.0.0.0/24 et 192.0.2.0/24 : réservées / documentation
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return true; // bancs d'essai et documentation
    if (a === 203 && b === 0) return true;                        // 203.0.113.0/24 : documentation
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === "::1" || low === "::") return true;
    if (low.startsWith("fe80:") || low.startsWith("fc") || low.startsWith("fd")) return true;
    if (low.startsWith("::ffff:")) { const v4 = low.split(":").pop(); return net.isIPv4(v4) ? isPrivateAddress(v4) : true; }
    return false;
  }
  return true; // format inconnu : refusé par prudence
}

// Résout le nom et vérifie CHAQUE adresse trouvée (un domaine peut répondre plusieurs IP)
async function assertPublicHost(hostname, { lookup = dns.promises.lookup } = {}) {
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new SsrfError(`Adresse interdite (privée ou locale) : ${hostname}.`);
    return [{ address: hostname, family: net.isIPv6(hostname) ? 6 : 4 }];
  }
  let addresses;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error(`Nom introuvable : ${hostname}.`); // erreur réseau ordinaire, reprise possible plus tard
  }
  if (!addresses.length) throw new Error(`Nom introuvable : ${hostname}.`);
  for (const { address } of addresses) if (isPrivateAddress(address)) throw new SsrfError(`« ${hostname} » pointe vers une adresse privée ou locale (${address}) : refusé.`);
  return addresses;
}

function signPayload(body, secret, timestamp) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

// Requête POST qui se connecte à l'adresse DÉJÀ validée (jamais une seconde résolution DNS : un nom qui change de réponse entre la vérification
// et la connexion ne peut pas rediriger l'envoi vers une adresse interne) et qui ne suit aucune redirection. Le nom d'hôte reste celui de l'URL
// (en-tête Host, SNI, certificat). Même contrat minimal que fetch : { status }.
function pinnedFetch(addresses) {
  return (url, { method = "POST", headers = {}, body, signal } = {}) => new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const first = addresses[0];
    const sent = { ...headers };
    if (body !== undefined) sent["Content-Length"] = Buffer.byteLength(body);
    const req = lib.request(u, { method, headers: sent, signal,
      lookup: (_host, _opts, cb) => (_opts && _opts.all ? cb(null, [{ address: first.address, family: first.family }]) : cb(null, first.address, first.family)) }, (res) => {
      const location = res.headers.location ? String(res.headers.location) : "";
      res.destroy(); // seul l'état compte : le corps n'est jamais lu
      resolve({ status: res.statusCode, location });
    });
    req.on("error", reject);
    req.end(body);
  });
}

// Un seul essai HTTP (les reprises sont gérées par l'appelant, via la file). `lookup`/`fetchImpl` injectables pour les tests.
async function sendWebhook({ url, secret, eventName, eventId, occurredAt, metadata, lookup, fetchImpl }) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new SsrfError("Seules les adresses http(s) sont acceptées.");
  const addresses = await assertPublicHost(parsed.hostname, { lookup });
  if (!fetchImpl) fetchImpl = pinnedFetch(addresses);
  const body = JSON.stringify({ id: `evt_${eventId}`, event: eventName, occurred_at: occurredAt, data: metadata || {} });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(body, secret, timestamp);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetchImpl(parsed.toString(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "User-Agent": "KOYEKOLA-Webhooks/1", "X-KOYEKOLA-Event": eventName, "X-KOYEKOLA-Signature": `t=${timestamp},v1=${signature}` },
      body,
    });
  } catch (error) {
    throw new Error(`Requête interrompue (réseau ou délai dépassé) : ${error.message}`.slice(0, MAX_BODY_LOG));
  } finally {
    clearTimeout(timer);
  }
  if (res.status >= 200 && res.status < 300) return { status: res.status };
  // Une redirection n'est jamais suivie (la cible n'aurait pas été vérifiée) : à corriger du côté du destinataire
  if (res.status >= 300 && res.status < 400) throw new UnrecoverableError(`Le point d'accès a répondu ${res.status} (redirection) : les redirections ne sont pas suivies, indiquez l'adresse finale.`);
  // 408 (délai) et 429 (trop de requêtes) sont temporaires : on réessaie comme une erreur serveur
  if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) throw new UnrecoverableError(`Le point d'accès a répondu ${res.status} : erreur du côté du destinataire, aucune reprise (corrigez sa configuration).`);
  throw new Error(`Le point d'accès a répondu ${res.status}.`);
}

// Un événement du bus → un travail de livraison par point d'accès abonné (idempotent : jamais deux fois pour le même couple)
function eventHandler({ db, env = process.env } = {}) {
  return async (event) => {
    if (!env.ENCRYPTION_KEY) return; // sans clé, aucun secret n'est lisible : ne rien tenter plutôt qu'échouer en boucle
    for (const endpoint of endpointsFor(db, event.organizationId, event.name, Number.isInteger(event.siteId) ? event.siteId : null)) {
      enqueue(db, {
        organizationId: event.organizationId, type: "webhook.deliver", priority: 6, maxAttempts: 6,
        payload: { endpointId: endpoint.id, eventName: event.name, eventId: event.id, occurredAt: event.occurredAt, metadata: event.metadata, siteId: Number.isInteger(event.siteId) ? event.siteId : null },
        idempotencyKey: `webhook:${endpoint.id}:${event.id}`,
      });
    }
  };
}

// Envoie un VRAI événement de test (même file, même requête HTTP signée que n'importe quel événement réel) —
// jamais un faux « succès » affiché sans requête effectuée. Ignore le filtre d'abonnement de l'endpoint (un test
// manuel concerne toujours CE point d'accès précis, quels que soient les événements auxquels il est abonné).
// Le résultat (livré / erreur / point d'accès en pause) apparaît ensuite dans « Dernières livraisons », comme tout événement.
function sendTestEvent(ctx, endpointId) {
  checkCtx(ctx);
  const endpoint = getEndpoint(ctx, endpointId); // lève not_found si absent ou d'une autre organisation
  // Un aléa (pas seulement l'horodatage) garantit deux tests distincts même déclenchés dans la même milliseconde.
  const testId = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  return enqueue(ctx.db, {
    organizationId: ctx.organizationId, type: "webhook.deliver", priority: 6, maxAttempts: 6,
    payload: { endpointId: endpoint.id, eventName: "test.ping", eventId: `test-${testId}`, siteId: endpoint.reach === "site" ? endpoint.siteId : null, occurredAt: new Date().toISOString(), metadata: { message: "Événement de test envoyé manuellement depuis KOLAKISA." } },
    idempotencyKey: `webhook:test:${endpoint.id}:${testId}`,
  });
}

function jobHandlers({ db, env = process.env, lookup, fetchImpl } = {}) {
  return {
    "webhook.deliver": async (payload) => {
      const row = db.prepare("SELECT * FROM mk_webhook_endpoints WHERE id = ?").get(payload.endpointId);
      if (!row) throw new UnrecoverableError("Point d'accès supprimé.");
      if (!row.enabled) throw new UnrecoverableError("Point d'accès mis en pause.");
      if (!env.ENCRYPTION_KEY) throw new UnrecoverableError("ENCRYPTION_KEY absente : secret illisible.");
      // Défense en profondeur (R2) : un point d'arrivée de site ne livre jamais un événement d'un autre site, même si un travail a été mis en file par erreur
      if (row.reach === "site" && payload.siteId !== row.site_id) throw new UnrecoverableError("Événement hors de la portée de site de ce point d'accès : livraison refusée.");
      const secret = decryptSecret(row.secret, env.ENCRYPTION_KEY, secretContext(row.organization_id, row.id));
      try {
        await sendWebhook({ url: row.url, secret, eventName: payload.eventName, eventId: payload.eventId, occurredAt: payload.occurredAt, metadata: payload.metadata, lookup, fetchImpl });
      } catch (error) {
        if (error instanceof SsrfError) throw new UnrecoverableError(error.message);
        throw error;
      }
    },
  };
}

module.exports = { pinnedFetch, sendWebhook, signPayload, isPrivateAddress, assertPublicHost, SsrfError, eventHandler, jobHandlers, sendTestEvent };
