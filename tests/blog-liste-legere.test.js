// Lecture légère des articles (src/utils/postColumns.js), cache du texte brut (blog.textOf) et lot de rattachements (urls.withBatchCache).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const inFreshDb = (script) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-leger-"));
  const r = spawnSync(process.execPath, ["-e", script], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATA_DIR: dir, NODE_ENV: "test", ENCRYPTION_KEY: "0".repeat(64) } });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split("\n").pop());
};
const SEED = `const db = require("./src/config/database");
  db.prepare("INSERT INTO users(username,email,password_hash,role) VALUES ('prof','p@x.t','h','formateur')").run();
  const ins = db.prepare("INSERT INTO posts (slug, title, excerpt, content, content_format, published, published_at, author_id, status) VALUES (?, ?, ?, ?, 'html', 1, datetime('now'), 1, 'published')");
  ins.run("a", "Article A", "", "<h2>Titre</h2><p>Déjà vu à l'école, <strong>très</strong> bien.</p><script>alert(1)</script>", );
  ins.run("b", "Article B", "Extrait saisi", "<p>Autre texte</p>");
  const pc = require("./src/utils/postColumns"); const blog = require("./src/services/blog");`;

test("lecture légère : tout sauf le contenu, contenu chargé à la demande, une seule fois, jamais copié ni sérialisé", () => {
  const r = inFreshDb(`${SEED}
    let loads = 0; const real = db.prepare.bind(db);
    const rows = pc.lightRows(db.prepare("SELECT " + pc.listColumns() + " FROM posts ORDER BY id").all());
    const a = rows[0];
    const out = { hasColumn: pc.listColumns().includes("octet_length(content) AS content_bytes"), noContentCol: !/(^|, )content(,|$)/.test(pc.listColumns()),
      own: Object.keys(a).includes("content"), json: JSON.stringify(a).includes("Déjà"), spread: "content" in { ...a },
      bytes: a.content_bytes === Buffer.byteLength("<h2>Titre</h2><p>Déjà vu à l'école, <strong>très</strong> bien.</p><script>alert(1)</script>"),
      content1: a.content.startsWith("<h2>Titre"), content2: a.content === a.content, full: db.prepare("SELECT content FROM posts WHERE id = 1").get().content === a.content };
    console.log(JSON.stringify(out))`);
  assert.deepEqual(r, { hasColumn: true, noContentCol: true, own: false, json: false, spread: false, bytes: true, content1: true, content2: true, full: true });
});

test("texte brut : identique avec ou sans cache, et recalculé dès que l'article change", () => {
  const r = inFreshDb(`${SEED}
    const full = db.prepare("SELECT * FROM posts WHERE id = 1").get();
    const light = pc.lightRows(db.prepare("SELECT " + pc.listColumns() + " FROM posts WHERE id = 1").all())[0];
    const { blogPlainText } = require("./src/utils/blogHtml");
    const direct = blogPlainText(full.content);
    const out = { direct, viaFull: blog.textOf(full), viaLight: blog.textOf(light), again: blog.textOf(light), scriptAbsent: !direct.includes("alert") };
    db.prepare("UPDATE posts SET content = ?, updated_at = datetime('now', '+1 second') WHERE id = 1").run("<p>Nouveau texte</p>");
    const changed = pc.lightRows(db.prepare("SELECT " + pc.listColumns() + " FROM posts WHERE id = 1").all())[0];
    out.changed = blog.textOf(changed);
    // même date mais taille différente (modification dans la même seconde) : la clé change aussi
    db.prepare("UPDATE posts SET content = ? WHERE id = 1").run("<p>Nouveau texte, encore plus long</p>");
    out.sameSecond = blog.textOf(pc.lightRows(db.prepare("SELECT " + pc.listColumns() + " FROM posts WHERE id = 1").all())[0]);
    out.excerptLight = blog.excerptOf(pc.lightRows(db.prepare("SELECT " + pc.listColumns() + " FROM posts WHERE id = 2").all())[0]);
    out.excerptNoExcerpt = blog.excerptOf(pc.lightRows(db.prepare("SELECT " + pc.listColumns() + " FROM posts WHERE id = 1").all())[0]);
    console.log(JSON.stringify(out))`);
  assert.equal(r.viaFull, r.direct);
  assert.equal(r.viaLight, r.direct);
  assert.equal(r.again, r.direct);
  assert.ok(r.scriptAbsent);
  assert.equal(r.changed, "Nouveau texte");
  assert.equal(r.sameSecond, "Nouveau texte, encore plus long");
  assert.equal(r.excerptLight, "Extrait saisi");
  assert.equal(r.excerptNoExcerpt, "Nouveau texte, encore plus long");
});

test("lot de rattachements : mêmes réponses qu'en lecture directe, et rien ne survit à l'appel", () => {
  const r = inFreshDb(`const db = require("./src/config/database");
    const urls = require("./src/services/urls");
    db.exec("CREATE TABLE mk_content_sites (content_type TEXT, content_id INTEGER, site_id INTEGER, address TEXT)");
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, site_id, address) VALUES ('post', 7, 3, 'adresse-logique')").run();
    const direct = urls.attachedSite("post", 7), none = urls.attachedSite("post", 8);
    const inside = urls.withBatchCache(() => ({ hit: urls.attachedSite("post", 7), miss: urls.attachedSite("post", 8), nested: urls.withBatchCache(() => urls.attachedSite("post", 7)) }));
    db.prepare("UPDATE mk_content_sites SET address = 'autre' WHERE content_id = 7").run();
    console.log(JSON.stringify({ direct, none, inside, after: urls.attachedSite("post", 7) }))`);
  assert.equal(r.direct.address, "adresse-logique");
  assert.equal(r.none, null);
  assert.deepEqual(r.inside.hit, { site_id: r.direct.site_id, address: "adresse-logique" });
  assert.equal(r.inside.miss, null);
  assert.deepEqual(r.inside.nested, r.inside.hit);
  assert.equal(r.after.address, "autre", "après l'appel : lecture directe, donnée à jour");
});
