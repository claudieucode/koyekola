// Programme 22.9 — minification à la volée des ressources publiques : gain réel, validité du résultat, garde-fous (liste blanche, version obligatoire, désactivable, repli).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const M = require("../src/perfEngine/minify");
const PUB = path.join(__dirname, "..", "public");

describe("Minification : service", () => {
  test("liste blanche de 4 fichiers publics ; tout autre chemin (éditeur, traversée) est refusé", () => {
    assert.equal(Object.keys(M.ALLOW).length, 4);
    for (const p of ["/js/page-builder.js", "/css/page-builder.css", "/js/../server.js", "/css/landing.css/../x.css", "/js/layouts.js"]) assert.equal(M.minified(p), null, p);
  });
  test("résultat plus petit, JS valide, mis en cache (même objet), taille d'origine inchangée sur le disque", () => {
    const before = fs.statSync(path.join(PUB, "js/landing.js")).size;
    const a = M.minified("/js/landing.js"); assert.ok(a && a.saved > 5000, "gain réel"); assert.doesNotThrow(() => new vm.Script(a.code));
    assert.equal(M.minified("/js/landing.js"), a); assert.equal(fs.statSync(path.join(PUB, "js/landing.js")).size, before);
    const c = M.minified("/css/landing.css"); assert.ok(c.saved > 15000); assert.ok(c.code.includes(".kw-image img"), "règles conservées");
  });
  test("activation : jamais hors production sans KOLAKISA_MINIFY=1 ; KOLAKISA_MINIFY=0 désactive", () => {
    const keep = { ...process.env };
    try {
      process.env.NODE_ENV = "test"; delete process.env.KOLAKISA_MINIFY; assert.equal(M.enabled(), false);
      process.env.KOLAKISA_MINIFY = "1"; assert.equal(M.enabled(), true);
      process.env.NODE_ENV = "production"; process.env.KOLAKISA_MINIFY = "0"; assert.equal(M.enabled(), false);
      delete process.env.KOLAKISA_MINIFY; assert.equal(M.enabled(), true);
    } finally { Object.assign(process.env, keep); for (const k of ["NODE_ENV", "KOLAKISA_MINIFY"]) if (!(k in keep)) delete process.env[k]; }
  });
});

for (const [label, env, expectMin] of [["activée", { KOLAKISA_MINIFY: "1" }, true], ["désactivée par défaut hors production", {}, false]]) {
  describe(`Minification : serveur réel, ${label}`, () => {
    let srv, c;
    before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ...env }); c = new Client(srv.base); });
    after(() => srv.stop());
    test("adresse versionnée : " + (expectMin ? "version minifiée, cache immutable, valide" : "fichier d'origine"), async () => {
      const r = await c.get("/js/landing.js?v=abc123"); assert.equal(r.status, 200);
      const orig = fs.readFileSync(path.join(PUB, "js/landing.js"), "utf8");
      assert.equal(r.headers.get("x-kolakisa-minified") === "1", expectMin);
      if (expectMin) { assert.ok(r.text.length < orig.length * 0.8); assert.doesNotThrow(() => new vm.Script(r.text)); assert.match(r.headers.get("cache-control"), /immutable/); assert.match(r.headers.get("content-type"), /javascript/); }
      else assert.equal(r.text, orig);
    });
    test("adresse sans version ou hors liste : toujours l'original", async () => {
      assert.equal((await c.get("/js/landing.js")).headers.get("x-kolakisa-minified"), null);
      assert.equal((await c.get("/js/page-builder.js?v=abc")).headers.get("x-kolakisa-minified"), null);
    });
    if (expectMin) test("ETag : revalidation 304 ; CSS minifié servi en text/css", async () => {
      const r = await c.get("/css/landing.css?v=zz"); assert.match(r.headers.get("content-type"), /text\/css/); const et = r.headers.get("etag");
      const r2 = await c.request("/css/landing.css?v=zz", { headers: { "If-None-Match": et } }); assert.equal(r2.status, 304);
    });
  });
}
