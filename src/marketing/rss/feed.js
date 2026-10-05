// Flux RSS 2.0 / Atom externe (campagne RSS dont la source n'est pas le blog KOLAKISA) : récupération et lecture.
// Sécurité : le serveur ne va JAMAIS chercher une adresse de son réseau interne (adresses privées, locales, de liaison,
// multidiffusion…), y compris après une redirection ou un changement DNS : l'adresse IP est vérifiée au moment même de
// la connexion (option « lookup »). Taille (2 Mo), durée (10 s) et redirections (3) bornées. Le contenu est réduit à
// du texte brut : aucun HTML du flux n'entre dans un e-mail.
const http = require("http");
const https = require("https");
const dns = require("dns");
const net = require("net");
const { parseDocument } = require("htmlparser2");
const DomUtils = require("domutils");
const { MarketingError } = require("../errors");

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;
const MAX_ITEMS = 50;

// Adresses interdites : tout ce qui n'est pas un serveur public d'Internet
function isPublicAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // espace partagé des opérateurs
    if (a === 198 && (b === 18 || b === 19)) return false;
    return true;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return false;
    if (v.startsWith("::ffff:")) return isPublicAddress(v.slice(7));
    if (/^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith("ff")) return false;
    return true;
  }
  return false;
}
function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = Array.isArray(addresses) ? addresses : [{ address: addresses, family: options.family || 4 }];
    const ok = list.filter((a) => isPublicAddress(a.address));
    if (!ok.length) return callback(Object.assign(new Error("adresse interne refusée"), { code: "EPRIVATE" }));
    if (options.all) return callback(null, ok);
    return callback(null, ok[0].address, ok[0].family);
  });
}

function checkUrl(raw) {
  let url;
  try { url = new URL(String(raw || "").trim()); } catch { throw new MarketingError("invalid_field", "Adresse du flux invalide (exemple : https://www.youtube.com/feeds/videos.xml?channel_id=…)."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new MarketingError("invalid_field", "Le flux doit commencer par https:// (ou http://).");
  if (url.username || url.password) throw new MarketingError("invalid_field", "Adresse du flux invalide (identifiants interdits dans l'adresse).");
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, "")) && !isPublicAddress(url.hostname.replace(/^\[|\]$/g, ""))) throw new MarketingError("invalid_field", "Adresse du flux refusée (réseau interne).");
  if (url.href.length > 500) throw new MarketingError("invalid_field", "Adresse du flux trop longue.");
  return url;
}

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.get(url, { lookup: safeLookup, timeout: TIMEOUT_MS, headers: { "User-Agent": "KOLAKISA-RSS/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirects >= MAX_REDIRECTS) return reject(new MarketingError("feed_error", "Trop de redirections."));
        let next;
        try { next = checkUrl(new URL(res.headers.location, url).href); } catch (e) { return reject(e); }
        return resolve(download(next, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new MarketingError("feed_error", `Le flux répond « ${res.statusCode} » au lieu d'un contenu.`)); }
      const chunks = [];
      let size = 0;
      res.on("data", (c) => {
        size += c.length;
        if (size > MAX_BYTES) { req.destroy(); reject(new MarketingError("feed_error", "Flux trop volumineux (2 Mo au plus).")); return; }
        chunks.push(c);
      });
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new MarketingError("feed_error", "Le flux ne répond pas (10 s).")));
    req.on("error", (e) => reject(e instanceof MarketingError ? e : new MarketingError("feed_error", e.code === "EPRIVATE" ? "Adresse du flux refusée (réseau interne)." : `Flux injoignable (${e.code || e.message}).`)));
  });
}

// ---------- Lecture ----------
const text = (node) => (node ? DomUtils.textContent(node) : "");
// Premier élément de ce nom : enfant direct d'abord (le titre de l'article, pas celui d'un média imbriqué), sinon plus bas
const first = (parent, names) => {
  for (const n of names) {
    const el = (parent.children || []).find((c) => c.type === "tag" && c.name === n) || DomUtils.findOne((e) => e.name === n, parent.children || [], true);
    if (el) return el;
  }
  return null;
};
// HTML éventuel du flux → texte brut (balises retirées, entités décodées par l'analyseur)
const plain = (html, max) => {
  const doc = parseDocument(String(html || ""), { decodeEntities: true });
  for (const el of DomUtils.findAll((e) => ["script", "style", "noscript", "iframe"].includes(e.name), doc.children)) DomUtils.removeElement(el);
  return DomUtils.textContent(doc).replace(/\s+/g, " ").trim().slice(0, max);
};
const httpUrl = (v) => { try { const u = new URL(String(v || "").trim()); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
const date = (v) => { const t = Date.parse(String(v || "").trim()); return Number.isFinite(t) ? t : null; };

function parseFeed(xml) {
  const doc = parseDocument(String(xml || ""), { xmlMode: true, decodeEntities: true });
  const items = [];
  const rssItems = DomUtils.getElementsByTagName("item", doc, true, MAX_ITEMS);
  const atomEntries = rssItems.length ? [] : DomUtils.getElementsByTagName("entry", doc, true, MAX_ITEMS);
  if (!rssItems.length && !atomEntries.length && !DomUtils.getElementsByTagName("channel", doc, true, 1).length && !DomUtils.getElementsByTagName("feed", doc, true, 1).length) {
    throw new MarketingError("feed_error", "Ce n'est pas un flux RSS ou Atom (aucun élément « item » ni « entry »).");
  }
  for (const it of rssItems) {
    const link = httpUrl(text(first(it, ["link"])));
    const guid = text(first(it, ["guid"])).trim() || link;
    const enclosure = DomUtils.getElementsByTagName("enclosure", it, true, 1)[0];
    const media = DomUtils.getElementsByTagName("media:content", it, true, 1)[0] || DomUtils.getElementsByTagName("media:thumbnail", it, true, 1)[0];
    const image = httpUrl(enclosure && /^image\//.test(enclosure.attribs.type || "") ? enclosure.attribs.url : media ? media.attribs.url : "");
    items.push({ key: `feed:${guid.slice(0, 300)}`, title: plain(text(first(it, ["title"])), 200), url: link, excerpt: plain(text(first(it, ["description", "content:encoded"])), 300), image, date: date(text(first(it, ["pubDate", "dc:date"]))) });
  }
  for (const e of atomEntries) {
    const links = (e.children || []).filter((c) => c.type === "tag" && c.name === "link");
    const alt = links.find((l) => !l.attribs.rel || l.attribs.rel === "alternate") || links[0];
    const link = httpUrl(alt ? alt.attribs.href : "");
    const id = text(first(e, ["id"])).trim() || link;
    const thumb = DomUtils.getElementsByTagName("media:thumbnail", e, true, 1)[0];
    items.push({ key: `feed:${id.slice(0, 300)}`, title: plain(text(first(e, ["title"])), 200), url: link, excerpt: plain(text(first(e, ["summary", "content", "media:description"])), 300), image: httpUrl(thumb ? thumb.attribs.url : ""), date: date(text(first(e, ["published", "updated"]))) });
  }
  // Un élément sans titre ni lien ne peut pas être présenté : écarté
  return items.filter((i) => i.title && i.url).sort((a, b) => (b.date || 0) - (a.date || 0));
}

async function fetchFeed(rawUrl, { fetcher = download } = {}) {
  const url = checkUrl(rawUrl);
  return parseFeed(await fetcher(url));
}

module.exports = { fetchFeed, parseFeed, checkUrl, isPublicAddress, MAX_BYTES };
