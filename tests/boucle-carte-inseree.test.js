// Boucle : une carte « insérée » (conteneur marqué loopInsert) s'intercale entre les résultats, sans être répétée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });

describe("boucle : carte insérée", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const put = async (id, content) => { const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision; return boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "T", ...content } } }); };

  test("validation : insertAt borné, loopInsert conservé, valeurs invalides ignorées", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Validation carte" })).location.match(/(\d+)$/)[1]);
    const grid = () => JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft).sections[0].children[0].children[0];
    assert.equal((await put(id, { sections: [layout([{ id: "grid00000001", type: "grid", props: { loop: { source: "posts", count: 6, insertAt: 3, insertEvery: true } }, children: [{ id: "tmpl00000001", type: "container", children: [] }, { id: "card00000001", type: "container", props: { loopInsert: true }, children: [] }] }])] })).status, 200);
    let g = grid();
    assert.equal(g.props.loop.insertAt, 3); assert.equal(g.props.loop.insertEvery, true);
    assert.equal(g.children[1].props.loopInsert, true); assert.equal(g.children[0].props.loopInsert, undefined);
    assert.equal((await put(id, { sections: [layout([{ id: "grid00000002", type: "grid", props: { loop: { source: "posts", insertAt: 999, insertEvery: true } }, children: [] }])] })).status, 200);
    g = grid();
    assert.equal(g.props.loop.insertAt, undefined); assert.equal(g.props.loop.insertEvery, undefined);
  });

  test("page publiée : la carte arrive après le N-ième résultat, une fois ou tous les N", async () => {
    for (let i = 1; i <= 5; i++) db.prepare("INSERT INTO posts (slug, title, published, published_at, status) VALUES (?, ?, 1, datetime('now', ?), 'published')").run(`ci-${i}`, `Article ${i}`, `-${i} minutes`);
    const id = Number((await boss.post("/marketing/pages", { name: "Carte insérée" })).location.match(/(\d+)$/)[1]);
    const tmpl = { id: "tmpl00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "{{post.title}}", level: 3 } }] };
    const card = { id: "card00000001", type: "container", props: { loopInsert: true }, children: [{ id: "head00000002", type: "heading", props: { text: "PUB-INSEREE", level: 3 } }] };
    const publish = async () => { assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200); const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug; return new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } }).then((r) => r.text); };
    const order = (html) => [...html.matchAll(/kw-loop-item"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs)].map((m) => m[1]);
    // une seule fois, après le 2e résultat
    assert.equal((await put(id, { sections: [layout([{ id: "grid00000001", type: "grid", props: { loop: { source: "posts", count: 5, insertAt: 2 } }, children: [tmpl, card] }])] })).status, 200);
    let html = await publish(); let seq = order(html);
    assert.equal(seq.length, 6, "5 résultats + 1 carte"); assert.equal(seq[2], "PUB-INSEREE"); assert.equal(seq.filter((s) => s === "PUB-INSEREE").length, 1);
    assert.ok(!seq.slice(0, 2).some((s) => s === "PUB-INSEREE"));
    // tous les 2 résultats : après le 2e et le 4e
    assert.equal((await put(id, { sections: [layout([{ id: "grid00000001", type: "grid", props: { loop: { source: "posts", count: 5, insertAt: 2, insertEvery: true } }, children: [tmpl, card] }])] })).status, 200);
    seq = order(await publish());
    assert.deepEqual(seq.map((s) => s === "PUB-INSEREE"), [false, false, true, false, false, true, false]);
    // sans insertAt : le conteneur marqué reste un enfant ordinaire du modèle (répété pour chaque résultat)
    assert.equal((await put(id, { sections: [layout([{ id: "grid00000001", type: "grid", props: { loop: { source: "posts", count: 3 } }, children: [tmpl, card] }])] })).status, 200);
    html = await publish();
    assert.equal((html.match(/PUB-INSEREE/g) || []).length, 3);
  });
});
