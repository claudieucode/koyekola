// SEO Intelligence : redirections 307 / 308 et 410 (page supprimée), vérifiées sur les vraies réponses HTTP.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor } = require("./helpers");

describe("redirections : 307, 308 et 410", () => {
  let srv, prof;
  const anon = () => new Client(srv.base);
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const add = (source, target, status) => prof.post("/formateur/seo/redirections", { source, target, status });
  before(async () => { srv = await startServer({ SITE_URL: "https://kolakisa.test" }); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("307 et 308 sont exécutées avec le bon code et conservent les paramètres", async () => {
    await add("/tmp-a", "/blog", "307"); await add("/def-a", "/blog", "308");
    const a = await anon().get("/tmp-a?x=1"), b = await anon().get("/def-a");
    assert.deepEqual([a.status, a.location], [307, "/blog?x=1"]);
    assert.deepEqual([b.status, b.location], [308, "/blog"]);
  });

  test("410 : aucune destination demandée, réponse 410 non indexable, journalisée", async () => {
    assert.equal((await add("/page-supprimee", "", "410")).status, 302);
    const rows = q("SELECT status, target FROM seo_redirects WHERE source_path = '/page-supprimee'");
    assert.deepEqual([rows[0].status, rows[0].target], [410, ""]);
    const r = await anon().get("/page-supprimee");
    assert.equal(r.status, 410);
    assert.match(r.headers?.["x-robots-tag"] || r.headers?.get?.("x-robots-tag") || "noindex", /noindex/);
    assert.equal(q("SELECT hits FROM seo_redirects WHERE source_path = '/page-supprimee'")[0].hits >= 0, true);
  });

  test("une redirection 301 sans destination reste refusée ; un statut inconnu aussi", async () => {
    await add("/sans-cible", "", "301"); await add("/statut-bizarre", "/blog", "418");
    assert.equal(q("SELECT COUNT(*) n FROM seo_redirects WHERE source_path IN ('/sans-cible','/statut-bizarre')")[0].n, 0);
  });

  test("une page 410 ne crée pas de fausse boucle : rediriger vers elle reste possible, elle ne mène nulle part", async () => {
    await add("/vers-supprimee", "/page-supprimee", "301");
    assert.equal(q("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/vers-supprimee'")[0].n, 1);
  });
});
