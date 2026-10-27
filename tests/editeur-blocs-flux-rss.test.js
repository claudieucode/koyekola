// KOLAKISA — flux RSS du bloc « Flux RSS » : adresses refusées (anti-SSRF), lecture RSS/Atom, cache sans attente réseau. Base de données ISOLÉE (dossier temporaire).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kb-rss-")); // avant tout require qui ouvre la base : jamais la base de développement
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const rss = require("../src/services/rssFeeds");

describe("flux RSS — sécurité et lecture", () => {
  test("adresses refusées : privées, locales, partagées, IPv6 locales, IPv4 encapsulées", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "::1", "::", "fe80::1", "fc00::1", "fd12::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:10.1.2.3", "2001:db8::1"]) assert.equal(rss.isPublicAddress(ip), false, ip);
    for (const ip of ["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) assert.equal(rss.isPublicAddress(ip), true, ip);
  });
  test("adresses de flux refusées : http, IP brute, identifiants, port, domaine sans point", () => {
    for (const bad of ["http://exemple.org/f", "https://127.0.0.1/f", "https://[::1]/f", "https://user@exemple.org/f", "https://exemple.org:8443/f", "https://localhost/f", "ftp://exemple.org/f", "javascript:x", ""]) assert.equal(rss.checkUrl(bad), null, bad);
    assert.ok(rss.checkUrl("https://exemple.org/feed.xml"));
  });
  test("lecture RSS 2.0 et Atom : texte nettoyé, liens http(s) seulement", () => {
    const r = rss.parseFeed(`<?xml version="1.0"?><rss version="2.0"><channel><title>Mon flux</title><item><title>Un &amp; deux</title><link>https://exemple.org/1</link><pubDate>Thu, 01 Oct 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>Du <b>texte</b> <script>x()</script></p>]]></description></item><item><title>Piégé</title><link>javascript:alert(1)</link></item></channel></rss>`);
    assert.equal(r.title, "Mon flux"); assert.equal(r.items.length, 1);
    assert.deepEqual([r.items[0].title, r.items[0].url, r.items[0].date], ["Un & deux", "https://exemple.org/1", "2026-10-01"]);
    assert.doesNotMatch(r.items[0].excerpt, /<|script/);
    const a = rss.parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><entry><title>E1</title><link href="https://exemple.org/e1"/><updated>2026-09-30T08:00:00Z</updated><summary>Résumé</summary></entry></feed>');
    assert.deepEqual([a.title, a.items[0].url, a.items[0].date, a.items[0].excerpt], ["Atom", "https://exemple.org/e1", "2026-09-30", "Résumé"]);
  });
  test("le cache ne fait jamais attendre l'affichage : la première lecture est vide et lance l'actualisation en tâche de fond ; un échec est mémorisé", async () => {
    const calls = [];
    rss.setFetcher(async (u) => { calls.push(u); return '<rss><channel><title>T</title><item><title>X</title><link>https://exemple.org/x</link></item></channel></rss>'; });
    try {
      const url = "https://exemple.org/cache-test.xml";
      assert.equal(rss.cached(url).state, "pending");
      await new Promise((r) => setTimeout(r, 80));
      const warm = rss.cached(url);
      assert.deepEqual([warm.state, warm.items.length, calls.length], ["ok", 1, 1]);
      assert.equal(rss.cached(url).state, "ok");
      assert.equal(calls.length, 1, "pas de nouvelle requête tant que le cache est frais");
      rss.setFetcher(async () => { throw new Error("hors ligne"); });
      const bad = "https://exemple.org/hors-ligne.xml";
      rss.cached(bad); await new Promise((r) => setTimeout(r, 80));
      assert.equal(rss.cached(bad).state, "error");
      assert.equal(rss.cached("http://exemple.org/x").state, "invalid");
    } finally { rss.setFetcher(null); }
  });
});

