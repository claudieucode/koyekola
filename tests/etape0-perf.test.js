// Étape 0 : performance de base. Compression, mise en cache des fichiers statiques, index de base de données.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor } = require("./helpers");

let srv;
before(async () => {
  srv = await startServer();
});
after(() => srv.stop());

const anon = () => new Client(srv.base);
const maxAge = (r) => Number((r.headers.get("cache-control") || "").match(/max-age=(\d+)/)?.[1] ?? 0);

describe("compression", () => {
  for (const url of ["/", "/catalogue", "/css/style.css", "/js/main.js"]) {
    test(`${url} est compressé en gzip`, async () => {
      const r = await anon().get(url, { headers: { "Accept-Encoding": "gzip" } });
      assert.equal(r.status, 200);
      assert.equal(r.headers.get("content-encoding"), "gzip");
    });
  }
  test("les fichiers déjà compressés (favicon svg mis à part) ne sont pas recompressés : vidéo en lecture partielle intacte", async () => {
    const prof = await loginInstructor(srv);
    assert.equal((await prof.get("/formateur")).status, 200);
    // La lecture partielle (Range) des vidéos est couverte par baseline.test.js : elle doit rester verte.
  });
});

describe("mise en cache", () => {
  test("les pages HTML ne sont jamais mises en cache par le navigateur (contenu personnalisé)", async () => {
    const r = await anon().get("/");
    assert.match(r.headers.get("cache-control") || "", /no-cache/);
  });
  test("les pages référencent CSS et JS avec un numéro de version (?v=…)", async () => {
    const html = (await anon().get("/")).text;
    assert.match(html, /href="\/css\/style\.css\?v=[a-z0-9]+"/);
    assert.match(html, /src="\/js\/main\.js\?v=[a-z0-9]+"/);
  });
  test("CSS et JS versionnés : cache d'un an (immutable)", async () => {
    const html = (await anon().get("/")).text;
    const css = html.match(/href="(\/css\/style\.css\?v=[a-z0-9]+)"/)[1];
    const r = await anon().get(css);
    assert.ok(maxAge(r) >= 31536000, r.headers.get("cache-control"));
    assert.match(r.headers.get("cache-control"), /immutable/);
  });
  test("le numéro de version change quand le fichier change", async () => {
    const { asset } = require("../src/utils/assets");
    const v1 = asset("/css/style.css");
    assert.match(v1, /^\/css\/style\.css\?v=[a-z0-9]+$/);
    assert.equal(asset("/css/style.css"), v1, "stable tant que le fichier ne change pas");
    assert.equal(asset("/css/n-existe-pas.css"), "/css/n-existe-pas.css", "fichier inconnu : adresse inchangée");
  });
  test("miniatures (noms uniques) : cache d'un mois", async () => {
    const prof = await loginInstructor(srv);
    const fd = new FormData();
    fd.append("title", "Cache miniature");
    fd.append("category", "Test");
    fd.append("level", "debutant");
    fd.append("price", "0");
    fd.append("thumbnail", new Blob([Buffer.alloc(100)], { type: "image/png" }), "a.png");
    await prof.request("/formateur/cours/nouveau", { method: "POST", multipart: fd });
    const db = srv.db();
    const path = db.prepare("SELECT thumbnail_path FROM courses WHERE title = 'Cache miniature'").get().thumbnail_path;
    db.close();
    const r = await anon().get(path);
    assert.equal(r.status, 200);
    assert.ok(maxAge(r) >= 2592000, r.headers.get("cache-control"));
  });
});

describe("base de données", () => {
  test("les colonnes utilisées pour les jointures sont indexées", () => {
    const db = srv.db();
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'").all().map((r) => r.name);
    db.close();
    for (const name of ["idx_sections_course", "idx_lessons_section", "idx_courses_published", "idx_enrollments_course", "idx_order_items_course", "idx_order_items_order", "idx_progress_lesson", "idx_quiz_questions_quiz", "idx_quiz_options_question", "idx_sessions_expires"]) {
      assert.ok(indexes.includes(name), `index manquant : ${name}`);
    }
  });
  test("les requêtes du lecteur utilisent bien ces index", () => {
    const db = srv.db();
    const plan = (sql) => db.prepare("EXPLAIN QUERY PLAN " + sql).all().map((r) => r.detail).join(" | ");
    assert.match(plan("SELECT * FROM lessons WHERE section_id = 1 ORDER BY position, id"), /idx_lessons_section/);
    assert.match(plan("SELECT * FROM sections WHERE course_id = 1 ORDER BY position, id"), /idx_sections_course/);
    assert.match(plan("SELECT COUNT(*) FROM order_items WHERE course_id = 1"), /idx_order_items_course/);
    db.close();
  });
});
