// KOLAKISA — éditeur d'articles : garde-fous (D13) — limite de création de brouillons, dimensions d'image réelles, sitemap sans article supprimé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("éditeur d'articles — garde-fous", () => {
  let srv, boss, db;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const form = (fields) => { const fd = new FormData(); Object.entries(fields).forEach(([k, v]) => fd.append(k, v)); return fd; };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("les dimensions d'une image viennent du fichier, pas du navigateur", async () => {
    const png = Buffer.alloc(40); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png); png.writeUInt32BE(13, 8); png.write("IHDR", 12); png.writeUInt32BE(64, 16); png.writeUInt32BE(32, 20);
    const fd = new FormData(); fd.append("article_image", new Blob([png], { type: "image/png" }), "vraie.png"); fd.append("width", "9999"); fd.append("height", "9999");
    const r = await boss.request("/formateur/blog/api/medias", { method: "POST", multipart: fd });
    assert.equal(r.status, 200, r.text);
    const media = JSON.parse(r.text).media;
    assert.deepEqual([media.width, media.height], [64, 32]);
  });

  test("le sitemap ne liste pas un article supprimé (corbeille)", async () => {
    const make = async (title) => JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: form({ title, content: "<p>Contenu</p>", content_format: "html", status: "published" }), headers: { "x-blog-editor": "1" } })).text);
    const keep = await make("Sitemap garde"); const gone = await make("Sitemap supprimé");
    assert.equal((await boss.request(`/formateur/blog/${gone.id}/supprimer`, { method: "POST" })).status < 400, true);
    const all = await (await fetch(`${srv.base}/sitemap.xml`)).text();
    db.prepare("UPDATE posts SET published = 1 WHERE id = ?").run(gone.id); // même republié par erreur, la corbeille prime
    const again = await (await fetch(`${srv.base}/sitemap.xml`)).text();
    assert.doesNotMatch(again, new RegExp(gone.slug));
    assert.match(all, new RegExp(keep.slug));
    assert.doesNotMatch(all, new RegExp(gone.slug));
  });

  test("la création de brouillons automatiques est limitée (429 au-delà de 60 par tranche de 10 minutes)", async () => {
    let limited = 0;
    for (let i = 0; i < 70; i++) {
      const r = await boss.request("/formateur/blog/api/brouillon", { method: "POST", multipart: form({ title: `Brouillon ${i}` }), headers: { "x-blog-editor": "1" } });
      if (r.status === 429) limited++;
    }
    assert.ok(limited >= 5, `requêtes limitées : ${limited}`);
    assert.ok(one("SELECT COUNT(*) n FROM posts WHERE title LIKE 'Brouillon %'").n <= 62);
  });
});
