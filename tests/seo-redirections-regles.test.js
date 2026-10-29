// SEO Intelligence : redirections par préfixe et par expression régulière, vérifiées sur les vraies réponses HTTP.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor } = require("./helpers");

describe("redirections : préfixe et expression régulière", () => {
  let srv, prof;
  const anon = () => new Client(srv.base);
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const add = (source, target, status, match_type) => prof.post("/formateur/seo/redirections", { source, target, status, match_type });
  const has = (source) => q("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = ?", source)[0].n === 1;
  before(async () => { srv = await startServer({ SITE_URL: "https://kolakisa.test" }); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("préfixe : toute la section est redirigée en gardant la suite du chemin et les paramètres", async () => {
    await add("/ancien-blog", "/blog", "301", "prefix");
    assert.equal(has("/ancien-blog"), true);
    const a = await anon().get("/ancien-blog/mon-article?utm=1"), b = await anon().get("/ancien-blog");
    assert.deepEqual([a.status, a.location], [301, "/blog/mon-article?utm=1"]);
    assert.deepEqual([b.status, b.location], [301, "/blog"]);
    assert.notEqual((await anon().get("/ancien-blogue")).status, 301, "la frontière est le segment : /ancien-blogue n'est pas concerné");
  });

  test("une adresse exacte passe avant une règle de préfixe", async () => {
    await add("/ancien-blog/cas-special", "/contact", "302", "exact");
    const r = await anon().get("/ancien-blog/cas-special");
    assert.deepEqual([r.status, r.location], [302, "/contact"]);
  });

  test("expression régulière : captures $1 et $2 dans la destination", async () => {
    await add("^/archive/(\\d{4})/([a-z-]+)$", "/blog/$2-$1", "301", "regex");
    assert.equal(has("^/archive/(\\d{4})/([a-z-]+)$"), true);
    const r = await anon().get("/archive/2021/yoga-doux");
    assert.deepEqual([r.status, r.location], [301, "/blog/yoga-doux-2021"]);
    assert.notEqual((await anon().get("/archive/ab/yoga")).status, 301);
  });

  test("préfixe en 410 : toute la section est déclarée supprimée", async () => {
    await add("/promo-2019", "", "410", "prefix");
    const r = await anon().get("/promo-2019/offre-x");
    assert.equal(r.status, 410);
  });

  test("garde-fous : « / », espaces privés, boucle, expression dangereuse ou sans ancre sont refusés", async () => {
    await add("/", "/blog", "301", "prefix");
    await add("/formateur", "/blog", "301", "prefix");
    await add("/zone", "/zone/nouvelle", "301", "prefix");
    await add("^/(a+)+$", "/x", "301", "regex");
    await add("/sans-ancre/(.*)", "/x", "301", "regex");
    await add("^/ref/(\\1)$", "/x", "301", "regex");
    await add("^/ok$", "https://$1.exemple.fr/", "301", "regex");
    for (const s of ["/", "/formateur", "/zone", "^/(a+)+$", "/sans-ancre/(.*)", "^/ref/(\\1)$", "^/ok$"]) assert.equal(has(s), false, s);
  });

  test("une capture ne peut jamais produire une redirection vers un autre hôte (//hôte)", async () => {
    await add("^/sortie(.*)$", "$1", "301", "regex"); // destination qui ne commence pas par / : refusée
    await add("^/aller(/.*)$", "/x$1", "301", "regex");
    assert.equal(has("^/sortie(.*)$"), false);
    const r = await anon().get("/aller//evil.example/chemin");
    assert.notEqual(r.status === 301 && /^\/\//.test(r.location || ""), true);
  });

  test("une règle ne redirige jamais un espace technique, ni l'accueil, ni vers un espace technique", async () => {
    await add("^/(.*)$", "/blog/$1", "301", "regex");
    assert.equal(has("^/(.*)$"), true, "accepté à l'enregistrement…");
    assert.equal((await anon().get("/sante")).status, 200, "…mais /sante reste servi");
    assert.equal((await anon().get("/")).status, 200, "…et l'accueil aussi");
    assert.equal((await anon().get("/connexion")).status, 200, "…et la connexion");
  });

  test("export / import CSV : la colonne « correspondance » est conservée", async () => {
    const csv = (await prof.get("/formateur/seo/redirections.csv")).text;
    assert.match(csv, /correspondance/);
    assert.match(csv, /\/ancien-blog,\/blog,301,.*,prefix/);
  });
});
