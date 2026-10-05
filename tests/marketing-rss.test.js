// Marketing — campagnes RSS (point 5 de la parité Mailchimp, « RSS-to-email ») : nouveaux articles envoyés selon une
// fréquence, rien sans nouveauté, jamais deux fois le même article, flux externe lu sans jamais toucher au réseau interne.
const { test, describe, beforeEach, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { freshMarketing, TEST_KEY, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const rss = require("../src/marketing/rss");
const feed = require("../src/marketing/rss/feed");
const st = require("../src/marketing/sending/sendtime");
const { compileTemplate } = require("../src/marketing/templates/blocks");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const DAY = 86400000;
const code = async (fn) => { try { await fn(); } catch (e) { return e.code; } return null; };
let m, A, list, tpl;
const sqlDate = (t) => new Date(t).toISOString().slice(0, 19).replace("T", " ");
const post = (title, at, extra = {}) => m.db.prepare("INSERT INTO posts (slug, title, excerpt, published, published_at, status, category) VALUES (?, ?, 'Résumé', ?, ?, ?, ?)")
  .run(`${title.toLowerCase().replace(/\W+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`, title, extra.published ?? 1, sqlDate(at), extra.status ?? "published", extra.category ?? "Conseils");
const children = (id) => m.db.prepare("SELECT * FROM mk_campaigns WHERE rss_id = ? ORDER BY id").all(id);
const itemsOf = (c) => JSON.parse(c.snapshot).blocks.find((b) => b.type === "posts").items.map((i) => i.title);
const make = (over = {}) => rss.createRss(A, { name: `RSS ${Math.random()}`, source: "blog", templateId: tpl.id, targetType: "list", targetId: list.id, frequency: "weekly", days: [1], sendTime: "08:00", maxItems: 5, ...over });

function fresh() {
  m = freshMarketing(); A = m.A;
  m.db.exec("CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT, title TEXT, excerpt TEXT DEFAULT '', cover_path TEXT, published INTEGER DEFAULT 0, published_at TEXT, status TEXT DEFAULT 'draft', category TEXT DEFAULT 'Autre')");
  templates.setOrgAddress(A, "12 rue des Écoles, Paris");
  list = audience.createList(A, { name: "Lecteurs" });
  for (const e of ["a@ex.fr", "b@ex.fr", "parti@ex.fr"]) {
    const { contact } = audience.upsertContact(A, { email: e });
    compliance.recordConsent(A, contact.id, { source: "form", textShown: "Oui, je veux recevoir les articles" });
    audience.addToList(A, list.id, [contact.id]);
  }
  compliance.unsubscribe(A, audience.findByEmail(A, "parti@ex.fr").id, { source: "link" });
  tpl = templates.createTemplate(A, { name: "Nouveaux articles", kind: "marketing", subject: "Du nouveau", blocks: [{ type: "heading", text: "Nouveautés", level: 1 }, { type: "posts", count: 3 }] });
}

describe("bloc « Articles »", () => {
  beforeEach(fresh);
  test("rendu échappé, liens https seulement ; vide = autorisé dans un modèle mais bloquant pour un envoi ordinaire", () => {
    const c = compileTemplate({ kind: "marketing", subject: "x", blocks: [{ type: "posts", items: [{ title: "<script>alert(1)</script>", url: "https://k.test/blog/a", excerpt: "x & y" }] }] }, { allowed: () => true });
    assert.equal(c.meta.postsEmpty, false);
    assert.throws(() => compileTemplate({ kind: "marketing", subject: "x", blocks: [{ type: "posts", items: [{ title: "a", url: "javascript:alert(1)" }] }] }, { allowed: () => true }));
    const empty = templates.createTemplate(A, { name: "Vide", kind: "marketing", subject: "x", blocks: [{ type: "posts" }] });
    const ready = templates.templateReadiness(A, empty.id);
    assert.equal(ready.ready, false);
    assert.ok(ready.errors.some((e) => e.code === "posts_empty"));
  });
  test("modèle : instantané des derniers articles publiés à l'enregistrement (brouillons et articles futurs exclus)", () => {
    post("Publié", T0 - DAY);
    post("Brouillon", T0 - DAY, { published: 0, status: "draft" });
    post("Programmé futur", T0 + DAY, { published: 0, status: "scheduled" });
    const t = templates.createTemplate(A, { name: "Avec articles", kind: "marketing", subject: "x", blocks: [{ type: "posts", count: 5 }] });
    assert.deepEqual(t.blocks[0].items.map((i) => i.title), ["Publié"]);
    assert.match(t.blocks[0].items[0].url, /^https:\/\/k\.test\/blog\//);
  });
});

describe("campagne RSS : validation et échéances", () => {
  beforeEach(fresh);
  test("refus clairs : modèle sans bloc « Articles », semaine sans jour, flux interne ou invalide", async () => {
    const plainTpl = templates.createTemplate(A, { name: "Simple", kind: "marketing", subject: "x", blocks: [{ type: "text", markdown: "Bonjour" }] });
    assert.equal(await code(() => make({ templateId: plainTpl.id })), "invalid_field");
    assert.equal(await code(() => make({ days: [] })), "invalid_field");
    assert.equal(await code(() => make({ source: "feed", feedUrl: "http://127.0.0.1/rss" })), "invalid_field");
    assert.equal(await code(() => make({ source: "feed", feedUrl: "file:///etc/passwd" })), "invalid_field");
    assert.equal(await code(() => make({ monthDay: 31, frequency: "monthly" })), "invalid_field");
  });
  test("prochaine échéance : chaque jour / jours choisis / jour du mois, à l'heure du fuseau de l'organisation (changement d'heure compris)", () => {
    st.setOrgTimeZone(A, "Europe/Paris");
    const at = (r, from) => new Date(rss.nextRunAt(A, r, from)).toISOString().slice(0, 16);
    const base = Date.UTC(2026, 9, 21, 12); // mercredi 21 octobre 2026, 14 h à Paris
    assert.equal(at({ frequency: "daily", send_time: "08:00", days: [] }, base), "2026-10-22T06:00");
    assert.equal(at({ frequency: "weekly", send_time: "08:00", days: [1, 5] }, base), "2026-10-23T06:00", "vendredi");
    assert.equal(at({ frequency: "weekly", send_time: "08:00", days: [1] }, base), "2026-10-26T07:00", "lundi après le passage à l'heure d'hiver");
    assert.equal(at({ frequency: "monthly", send_time: "09:30", days: [], month_day: 1 }, base), "2026-11-01T08:30");
  });
});

describe("campagne RSS : envois réels", () => {
  beforeEach(fresh);
  test("activation impossible sans article ; puis cycle complet : premier envoi récent, rien sans nouveauté, jamais deux fois, un envoi par jour", async () => {
    const r = make({ frequency: "weekly", days: [1, 4] });
    assert.equal(await code(() => rss.activateRss(A, r.id)), "preflight_failed", "blog vide");
    post("Vieux", T0 - 20 * DAY);
    post("Récent", T0 - 2 * DAY);
    const { nextRunAt } = await rss.activateRss(A, r.id);
    assert.equal(rss.getRss(A, r.id).status, "active");
    assert.ok(m.db.prepare("SELECT 1 FROM mk_jobs WHERE type = 'rss.run'").get(), "échéance programmée dans la file");

    let res = await rss.runRss(A, r.id, { now: nextRunAt });
    assert.equal(res.sent, true);
    assert.deepEqual(itemsOf(children(r.id)[0]), ["Récent"], "premier envoi : seulement la fenêtre récente (7 jours)");
    assert.equal(children(r.id)[0].total_recipients, 2, "le contact désinscrit n'est jamais servi");

    res = await rss.runRss(A, r.id, { now: nextRunAt + 3 * DAY });
    assert.equal(res.sent, false);
    assert.match(res.text, /Aucun nouvel article/);
    assert.equal(children(r.id).length, 1, "le vieil article n'est jamais envoyé ensuite");

    post("Neuf 1", nextRunAt + 4 * DAY);
    post("Neuf 2", nextRunAt + 5 * DAY);
    res = await rss.runRss(A, r.id, { now: nextRunAt + 7 * DAY });
    assert.deepEqual(itemsOf(children(r.id)[1]), ["Neuf 2", "Neuf 1"]);
    res = await rss.runRss(A, r.id, { now: nextRunAt + 7 * DAY + 3600000 });
    assert.match(res.text, /Déjà un envoi aujourd'hui/);
    assert.equal(children(r.id).length, 2);
    assert.ok(rss.getRss(A, r.id).next_run_at > nextRunAt + 7 * DAY, "toujours reprogrammée");

    rss.pauseRss(A, r.id);
    post("Pendant la pause", nextRunAt + 8 * DAY);
    res = await rss.runRss(A, r.id, { now: nextRunAt + 10 * DAY });
    assert.equal(res.skipped, "paused");
    assert.equal(children(r.id).length, 2);
  });

  test("maximum d'articles : les plus récents partent, les autres ne seront pas renvoyés plus tard", async () => {
    for (let i = 1; i <= 4; i++) post(`Article ${i}`, T0 - 12 * 3600000 + i * 1000); // dans les 24 h du premier envoi quotidien
    const r = make({ frequency: "daily", maxItems: 2 });
    await rss.activateRss(A, r.id);
    await rss.runRss(A, r.id, { now: T0 + 3600000 });
    assert.deepEqual(itemsOf(children(r.id)[0]), ["Article 4", "Article 3"]);
    post("Article 5", T0 + 2 * 3600000);
    await rss.runRss(A, r.id, { now: T0 + DAY + 3600000 });
    assert.deepEqual(itemsOf(children(r.id)[1]), ["Article 5"]);
  });

  test("catégorie du blog : seuls ses articles", async () => {
    post("Conseil", T0 - 3600000, { category: "Conseils" });
    post("Annonce", T0 - 3600000, { category: "Annonces" });
    const r = make({ frequency: "daily", blogCategory: "Annonces" });
    await rss.activateRss(A, r.id);
    await rss.runRss(A, r.id, { now: T0 + 3600000 });
    assert.deepEqual(itemsOf(children(r.id)[0]), ["Annonce"]);
  });

  test("flux externe : articles lus et envoyés une seule fois (guid) ; flux illisible noté sans rien envoyer", async () => {
    const xml = (items) => `<rss><channel>${items.map(([g, t, d]) => `<item><guid>${g}</guid><title>${t}</title><link>https://ex.fr/${g}</link><pubDate>${new Date(d).toUTCString()}</pubDate><description>&lt;p&gt;Texte&lt;/p&gt;</description></item>`).join("")}</channel></rss>`;
    let body = xml([["v1", "Vidéo 1", T0 - 3600000]]);
    const fetcher = async () => body;
    const r = rss.createRss(A, { name: "YouTube", source: "feed", feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=X", templateId: tpl.id, targetType: "list", targetId: list.id, frequency: "daily", sendTime: "08:00", maxItems: 5 });
    await rss.activateRss(A, r.id, { fetcher });
    await rss.runRss(A, r.id, { now: T0 + 3600000, fetcher });
    assert.deepEqual(itemsOf(children(r.id)[0]), ["Vidéo 1"]);
    body = xml([["v2", "Vidéo 2", T0 + 2 * 3600000], ["v1", "Vidéo 1 (titre modifié)", T0 - 3600000]]);
    await rss.runRss(A, r.id, { now: T0 + DAY + 3600000, fetcher });
    assert.deepEqual(itemsOf(children(r.id)[1]), ["Vidéo 2"], "même guid = même article, jamais renvoyé");
    body = "<html>panne</html>";
    const res = await rss.runRss(A, r.id, { now: T0 + 2 * DAY + 3600000, fetcher });
    assert.equal(res.sent, false);
    assert.match(rss.getRss(A, r.id).last_result, /Source illisible/);
  });

  test("sécurité réelle : le serveur refuse d'aller lire un flux sur son propre réseau (même via un nom d'hôte)", async () => {
    const server = http.createServer((req, res) => res.end("<rss><channel><item><title>secret</title><link>https://x.fr</link></item></channel></rss>"));
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const port = server.address().port;
    try {
      await assert.rejects(feed.fetchFeed(`http://localhost:${port}/rss`), /réseau interne/);
      assert.equal(feed.isPublicAddress("169.254.169.254"), false, "métadonnées du cloud");
    } finally { server.close(); }
  });

  test("tâche planifiée « rss.run » : exécute l'échéance comme le worker", async () => {
    post("Pour la tâche", T0 - 3600000);
    const r = make({ frequency: "daily" });
    await rss.activateRss(A, r.id);
    const handlers = rss.jobHandlers({ db: m.db, settings: m.A.settings, env: { SITE_URL: "https://k.test", ENCRYPTION_KEY: TEST_KEY }, log: { info() {} }, now: () => T0 + 3600000 });
    await handlers["rss.run"]({ organizationId: 1, rssId: r.id });
    assert.equal(children(r.id).length, 1);
  });
});

describe("campagnes RSS : pages et droits", () => {
  let srv, boss;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const db = srv.db();
    db.exec("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Lecteurs')");
    db.prepare("INSERT INTO posts (slug, title, excerpt, content, published, published_at, status) VALUES ('premier', 'Premier article', 'Résumé', '<p>x</p>', 1, datetime('now', '-1 hour'), 'published')").run();
  });
  after(() => srv.stop());

  test("parcours : liste vide → modèle « Nouveaux articles » en un clic → création → aperçu → activation ; menu « Campagnes RSS »", async () => {
    const empty = await boss.get("/marketing/rss");
    assert.match(empty.text, /Aucune campagne RSS/);
    assert.match(empty.text, /href="\/marketing\/rss"/, "entrée de menu");
    const tplRes = await boss.post("/marketing/rss/modele", {});
    assert.match(tplRes.location, /\/marketing\/rss\/nouvelle\?modele=\d+/);
    const form = await boss.get(tplRes.location);
    assert.match(form.text, /<option value="\d+" selected>Nouveaux articles<\/option>/);
    const db = srv.db();
    const listId = db.prepare("SELECT id FROM mk_lists WHERE name = 'Lecteurs'").get().id;
    const tplId = tplRes.location.match(/modele=(\d+)/)[1];
    const created = await boss.post("/marketing/rss", { name: "Lettre du blog", source: "blog", blog_category: "", template_id: tplId, target: `list:${listId}`, frequency: "weekly", days: "3", month_day: "1", send_time: "09:00", max_items: "5", track_clicks: "on" });
    assert.match(created.location, /^\/marketing\/rss\/\d+$/);
    const page = await boss.get(created.location);
    assert.match(page.text, /Si l(&#39;|')échéance tombait maintenant/);
    assert.match(page.text, /Premier article/, "aperçu réel du prochain envoi");
    const act = await boss.post(`${created.location}/activer`, {});
    assert.equal(act.status, 302);
    assert.equal(db.prepare("SELECT status FROM mk_rss_campaigns WHERE name = 'Lettre du blog'").get().status, "active");
    assert.match((await boss.get(created.location)).text, /Prochaine vérification/);
  });

  test("droits : un élève n'y a pas accès", async () => {
    const student = await newStudent(srv);
    assert.equal((await student.get("/marketing/rss")).status, 403);
  });
});
