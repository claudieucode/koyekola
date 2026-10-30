// Palier 17 — SSRF du vérificateur de liens SEO et neutralisation des formules CSV (sans serveur : le code réel, une base temporaire).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

let dir, audit, redirects, hits, server, port;
before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "kola-p17-"));
  process.env.DATA_DIR = dir;
  delete process.env.KOLA_TEST_ALLOW_LOOPBACK; // jamais d'exception de bouclage ici : c'est la production qu'on simule
  audit = require("../src/seo/audit");
  redirects = require("../src/seo/redirects");
  hits = 0;
  server = http.createServer((req, res) => { hits++; res.end("secret interne"); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
after(() => { server?.close(); fs.rmSync(dir, { recursive: true, force: true }); });

describe("SSRF : le vérificateur de liens n'atteint jamais une adresse interne", () => {
  const check = audit.checkExternal || audit._checkExternal;
  test("checkExternal est exposé pour le test", () => assert.equal(typeof check, "function"));
  for (const target of ["http://127.0.0.1:__PORT__/", "http://localhost:__PORT__/", "http://169.254.169.254/latest/meta-data/", "http://10.0.0.1/", "http://192.168.1.1/", "http://[::1]:__PORT__/", "http://user:pw@example.com/"]) {
    test(`refusé : ${target}`, async () => {
      const r = await check(target.replace("__PORT__", String(port)));
      assert.ok(r.error, JSON.stringify(r));
      assert.equal(r.status, undefined);
    });
  }
  test("le serveur local n'a reçu AUCUNE requête", () => assert.equal(hits, 0));
});

describe("CSV des redirections : formules neutralisées", () => {
  test("une cellule qui commence par = + - @ est préfixée ; le reste est inchangé", () => {
    assert.equal(redirects.csvCell('=HYPERLINK("http://x","y")'), `"'=HYPERLINK(""http://x"",""y"")"`);
    assert.equal(redirects.csvCell("+33612345678"), "'+33612345678");
    assert.equal(redirects.csvCell("@SUM(A1)"), "'@SUM(A1)");
    assert.equal(redirects.csvCell("/ancien"), "/ancien");
    assert.equal(redirects.csvCell("https://exemple.fr/a"), "https://exemple.fr/a");
    assert.equal(redirects.csvCell("note, avec virgule"), '"note, avec virgule"');
    assert.equal(redirects.csvCell(301), "301");
  });
});
