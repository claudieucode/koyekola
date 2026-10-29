// Flux RSS / Atom affichés par le bloc « Flux RSS » d'un article.
// Sécurité (une requête sortante déclenchée par un contenu est un risque classique, « SSRF ») :
//   - https uniquement, port 443, sans identifiants dans l'adresse ;
//   - le nom d'hôte est résolu AVANT la connexion et refusé si UNE SEULE adresse est privée, locale, de lien local, partagée (CGNAT), multicast ou non spécifiée
//     (IPv4, IPv6 et IPv4 encapsulé dans IPv6) ; la connexion se fait ensuite sur l'adresse vérifiée (pas de seconde résolution possible) ;
//   - 2 redirections au plus, chacune revalidée de la même façon ; délai de 6 s ; 512 Ko au plus ; types de contenu XML uniquement ;
//   - l'affichage d'un article ne déclenche JAMAIS d'attente réseau : il lit le cache ; l'actualisation (toutes les heures) se fait en tâche de fond,
//     une seule à la fois par adresse, 4 en parallèle au plus ; un échec est mémorisé 15 minutes pour ne pas harceler le site distant.
const dns = require("dns");
const https = require("https");
const net = require("net");
const { parseDocument } = require("htmlparser2");
const DomUtils = require("domutils");
const db = require("../config/database");

const TTL_MS = 60 * 60 * 1000;
const FAIL_BACKOFF_MS = 15 * 60 * 1000;
const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 6000;
const MAX_FEEDS = 200;
const MAX_PARALLEL = 4;

db.exec(`CREATE TABLE IF NOT EXISTS feed_cache (
  url TEXT PRIMARY KEY,
  fetched_at INTEGER NOT NULL,
  ok INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]'
)`);

// ---------- Adresses autorisées ----------
function ipv4Private(a, b) {
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}
function isPublicAddress(address) {
  const ip = String(address || "");
  if (net.isIPv4(ip)) { const [a, b] = ip.split(".").map(Number); return !ipv4Private(a, b); }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^(?:::ffff:|::ffff:0:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/) || lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mapped) {
      if (mapped[2] === undefined) return isPublicAddress(mapped[1]);
      const hi = parseInt(mapped[1], 16); const lo = parseInt(mapped[2], 16);
      return isPublicAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    if (lower === "::" || lower === "::1" || lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb") || /^f[cd]/.test(lower) || lower.startsWith("ff") || lower.startsWith("2001:db8") || lower.startsWith("fec") || lower.startsWith("fed") || lower.startsWith("fee") || lower.startsWith("fef")) return false;
    return true;
  }
  return false;
}
function checkUrl(raw) {
  let url;
  try { url = new URL(String(raw || "").trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, ""))) return null; // pas d'adresse IP brute : un nom d'hôte public seulement
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)) return null;
  return url;
}

// Résolution vérifiée : renvoie une adresse publique ou lève une erreur
async function resolvePublic(hostname) {
  const all = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  if (!all.length || all.some((a) => !isPublicAddress(a.address))) throw new Error("adresse non autorisée");
  return all[0];
}

function getOnce(url, address) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: address.address, family: address.family, port: 443, method: "GET", path: `${url.pathname}${url.search}`, servername: url.hostname,
      headers: { Host: url.hostname, "User-Agent": "KolakisaFeedReader/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9", "Accept-Encoding": "identity" },
      timeout: TIMEOUT_MS,
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) { res.resume(); return resolve({ redirect: res.headers.location }); }
      if (status !== 200) { res.resume(); return reject(new Error(`statut ${status}`)); }
      const type = String(res.headers["content-type"] || "").toLowerCase();
      if (!/(xml|rss|atom)/.test(type)) { res.resume(); return reject(new Error("type de contenu refusé")); }
      const chunks = []; let size = 0;
      res.on("data", (c) => { size += c.length; if (size > MAX_BYTES) { req.destroy(new Error("flux trop volumineux")); return; } chunks.push(c); });
      res.on("end", () => resolve({ body: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("délai dépassé")));
    req.on("error", reject);
    req.end();
  });
}
async function download(raw, depth = 0) {
  const url = checkUrl(raw);
  if (!url) throw new Error("adresse non autorisée");
  const address = await resolvePublic(url.hostname);
  const r = await getOnce(url, address);
  if (r.redirect) {
    if (depth >= 2) throw new Error("trop de redirections");
    return download(new URL(r.redirect, url).href, depth + 1);
  }
  return r.body;
}

// ---------- Lecture du XML (RSS 2.0 et Atom) ----------
const plain = (s, max) => String(s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
function parseFeed(xml) {
  const doc = parseDocument(String(xml || "").slice(0, MAX_BYTES), { xmlMode: true });
  const first = (node, name) => DomUtils.findOne((n) => n.name === name, node.children || [], false);
  const textOf = (node, name) => { const n = first(node, name); return n ? DomUtils.textContent(n) : ""; };
  const channel = DomUtils.findOne((n) => n.name === "channel" || n.name === "feed", doc.children, true);
  if (!channel) return { title: "", items: [] };
  const entries = DomUtils.findAll((n) => n.name === "item" || n.name === "entry", channel.children || []);
  const items = [];
  for (const e of entries) {
    const title = plain(textOf(e, "title"), 200);
    let link = textOf(e, "link").trim();
    if (!link) { const l = DomUtils.findOne((n) => n.name === "link" && n.attribs && n.attribs.href, e.children || [], false); link = l ? l.attribs.href : ""; }
    if (!/^https?:\/\/[^\s"'<>]{4,500}$/.test(link)) continue;
    const when = textOf(e, "pubDate") || textOf(e, "updated") || textOf(e, "published") || textOf(e, "dc:date");
    const t = Date.parse(when);
    items.push({ title: title || link, url: link, date: Number.isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10), excerpt: plain(textOf(e, "description") || textOf(e, "summary") || textOf(e, "content"), 220) });
    if (items.length >= 20) break;
  }
  return { title: plain(textOf(channel, "title"), 120), items };
}

// ---------- Cache et actualisation ----------
let fetcher = download; // remplaçable par les tests
const inflight = new Map();
let running = 0;
function save(url, ok, feed) {
  db.prepare("INSERT INTO feed_cache (url, fetched_at, ok, title, items) VALUES (?, ?, ?, ?, ?) ON CONFLICT(url) DO UPDATE SET fetched_at = excluded.fetched_at, ok = excluded.ok, title = CASE WHEN excluded.ok = 1 THEN excluded.title ELSE feed_cache.title END, items = CASE WHEN excluded.ok = 1 THEN excluded.items ELSE feed_cache.items END")
    .run(url, Date.now(), ok ? 1 : 0, ok ? feed.title : "", ok ? JSON.stringify(feed.items) : "[]");
  const n = db.prepare("SELECT COUNT(*) n FROM feed_cache").get().n;
  if (n > MAX_FEEDS) db.prepare("DELETE FROM feed_cache WHERE url IN (SELECT url FROM feed_cache ORDER BY fetched_at ASC LIMIT ?)").run(n - MAX_FEEDS);
}
function refresh(raw) {
  const url = checkUrl(raw);
  if (!url) return Promise.resolve(null);
  const key = url.href;
  if (inflight.has(key)) return inflight.get(key);
  if (running >= MAX_PARALLEL) return Promise.resolve(null);
  running += 1;
  const p = fetcher(key).then((xml) => { const feed = parseFeed(xml); save(key, true, feed); return feed; })
    .catch(() => { save(key, false); return null; })
    .finally(() => { running -= 1; inflight.delete(key); });
  inflight.set(key, p);
  return p;
}
// Lecture pour l'affichage : jamais d'attente réseau ; déclenche l'actualisation en tâche de fond si le cache est périmé
function cached(raw) {
  const url = checkUrl(raw);
  if (!url) return { title: "", items: [], state: "invalid" };
  const row = db.prepare("SELECT * FROM feed_cache WHERE url = ?").get(url.href);
  const age = row ? Date.now() - row.fetched_at : Infinity;
  const stale = !row || (row.ok ? age > TTL_MS : age > FAIL_BACKOFF_MS);
  if (stale) setImmediate(() => { refresh(url.href).catch(() => {}); });
  if (!row) return { title: "", items: [], state: "pending" };
  let items = []; try { items = JSON.parse(row.items); } catch { items = []; }
  return { title: row.title, items, state: row.ok ? "ok" : items.length ? "stale" : "error" };
}
module.exports = { cached, refresh, parseFeed, isPublicAddress, checkUrl, resolvePublic, download, setFetcher: (f) => { fetcher = f || download; }, TTL_MS };
