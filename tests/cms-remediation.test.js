// KOLAKISA CMS — palier 23 (corrections issues de l'audit de parité), par les vraies routes d'un serveur de test :
// indexation par défaut des pages de site, flux RSS du blog, recherche publique et recherche d'administration, publication programmée des pages,
// journal des connexions de l'équipe, alerte de modération des commentaires.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const pages = require("../src/marketing/pages");

let srv, boss, db, orgId, anon;
const M = "/marketing";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const ctx = () => ({ db, organizationId: orgId, userId: null });
const member = async (role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role); return c; };
const article = (fields) => { const fd = new FormData(); Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", content: "<p>Texte de l'article</p>", ...fields }).forEach(([k, v]) => fd.append(k, v)); return boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };
const newPage = async (name, { site = false } = {}) => { const r = await boss.post(`${M}/pages`, { name, template: "vente", ouvrir: "editeur" }); return Number(String(r.location).match(/pages\/(\d+)/)[1]); };
const slugOf = (id) => one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug;

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => { db.close(); srv.stop(); });

describe("indexation par défaut", () => {
  test("une page de SITE est indexable par défaut ; une page d'atterrissage ne l'est pas", async () => {
    const id = await newPage("Page de site indexable");
    assert.equal(one("SELECT indexable, kind FROM mk_landing_pages WHERE id = ?", id).kind, "page");
    assert.equal(one("SELECT indexable FROM mk_landing_pages WHERE id = ?", id).indexable, 1);
    await boss.post(`${M}/pages/${id}/publier.json`, {});
    const html = (await anon.get(`/p/${slugOf(id)}`)).text;
    assert.doesNotMatch(html, /name="robots" content="noindex/);
    assert.ok((await anon.get("/sitemap.xml")).text.includes(`/p/${slugOf(id)}`), "présente au plan du site");
    const landing = pages.createPage(ctx(), { name: "Atterrissage", kind: "landing" });
    assert.equal(one("SELECT indexable FROM mk_landing_pages WHERE id = ?", landing.id).indexable, 0);
  });
});

describe("flux RSS du blog", () => {
  before(async () => {
    await article({ title: "Article <publié> & beau", status: "published" });
    await article({ title: "Article brouillon secret" });
    await article({ title: "Article programmé secret", status: "scheduled", published_at_utc: new Date(Date.now() + 3600e3).toISOString() });
    await article({ title: "Article en corbeille secret", status: "published" });
    const trashed = one("SELECT id FROM posts WHERE title = 'Article en corbeille secret'").id;
    await boss.post(`${M}/site-web/articles/${trashed}/corbeille`, {});
  });
  test("le flux est un RSS valide avec uniquement les articles publiés, texte échappé", async () => {
    const r = await anon.get("/blog/feed.xml");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /application\/rss\+xml/);
    assert.match(r.text, /^<\?xml/); assert.match(r.text, /<rss version="2.0"/);
    assert.match(r.text, /Article &lt;publié&gt; &amp; beau/);
    assert.doesNotMatch(r.text, /<publié>/);
    for (const hidden of ["brouillon secret", "programmé secret", "corbeille secret"]) assert.doesNotMatch(r.text, new RegExp(hidden));
    assert.match(r.text, /<link>https:\/\/k\.test\/blog\/article-publie-beau<\/link>/);
  });
  test("/feed redirige vers le flux ; la découverte automatique est dans l'en-tête des pages", async () => {
    const r = await anon.get("/feed");
    assert.equal(r.status, 301); assert.equal(r.location, "/blog/feed.xml");
    assert.match((await anon.get("/blog")).text, /<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/blog\/feed\.xml"/);
  });
});

describe("recherche publique", () => {
  let pid;
  before(async () => {
    await article({ title: "Guide du référencement naturel", status: "published", content: "<p>Les étoiles filantes du web</p>" });
    await article({ title: "Brouillon référencement", status: "draft" });
    pid = await newPage("Offre référencement premium");
    await boss.post(`${M}/pages/${pid}/publier.json`, {});
    const hidden = await newPage("Page référencement cachée"); // brouillon
  });
  test("trouve les articles et pages publiés, sans tenir compte des accents ni des majuscules ; jamais un brouillon", async () => {
    const r = await anon.get("/recherche?q=REFERENCEMENT");
    assert.equal(r.status, 200);
    assert.match(r.text, /Guide du référencement naturel/); assert.match(r.text, /Offre référencement premium/);
    assert.doesNotMatch(r.text, /Brouillon référencement/); assert.doesNotMatch(r.text, /Page référencement cachée/);
    assert.match(r.text, /name="robots" content="noindex/);
  });
  test("cherche aussi dans le texte de l'article ; plusieurs mots = tous requis ; aucun résultat dit clairement", async () => {
    assert.match((await anon.get("/recherche?q=etoiles+filantes")).text, /Guide du référencement naturel/);
    assert.match((await anon.get("/recherche?q=etoiles+inexistant")).text, /Aucun résultat/);
    assert.match((await anon.get("/recherche")).text, /Saisissez un mot/);
  });
  test("le texte cherché est échappé", async () => {
    const r = await anon.get(`/recherche?q=${encodeURIComponent('<img src=x onerror=alert(1)>')}`);
    assert.doesNotMatch(r.text, /<img src=x onerror/);
  });
});

describe("recherche d'administration", () => {
  test("trouve pages, articles et menus ; jamais pour un anonyme ; les jokers saisis sont neutralisés", async () => {
    await boss.post(`${M}/site-web/navigation/menus`, { name: "Menu principal recherche" });
    const r = await boss.get(`${M}/site-web/recherche?q=${encodeURIComponent("référencement")}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Offre référencement premium/); assert.match(r.text, /Guide du référencement naturel/);
    assert.match((await boss.get(`${M}/site-web/recherche?q=principal`)).text, /Menu principal recherche/);
    assert.match((await boss.get(`${M}/site-web/recherche?q=%25`)).text, /Aucun résultat/, "« % » est cherché tel quel, pas comme joker");
    const an = await new Client(srv.base).get(`${M}/site-web/recherche?q=a`);
    assert.equal(an.status, 302); assert.match(an.location, /connexion/);
  });
  test("la barre du CMS est un vrai formulaire de recherche (plus de champ désactivé)", async () => {
    const html = (await boss.get(`${M}/pages`)).text;
    assert.match(html, /action="\/marketing\/site-web\/recherche"/);
    assert.doesNotMatch(html, /placeholder="Rechercher…" disabled/);
  });
  test("une personne qui n'est pas de l'équipe est refusée", async () => {
    const student = await newStudent(srv);
    assert.equal((await student.get(`${M}/site-web/recherche?q=a`)).status, 403);
  });
});

describe("publication programmée des pages", () => {
  let id;
  const parts = (utcDate) => { const d = new Date(utcDate); const pad = (n) => String(n).padStart(2, "0"); return { local: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`, offset: "0" }; };
  before(async () => { id = await newPage("Page programmée"); });
  test("une date passée ou invalide est refusée ; rien n'est programmé", async () => {
    await boss.post(`${M}/pages/${id}/programmer`, parts(Date.now() - 3600e3));
    assert.equal(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", id).scheduled_at, null);
    await boss.post(`${M}/pages/${id}/programmer`, { local: "n'importe quoi", offset: "0" });
    assert.equal(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", id).scheduled_at, null);
  });
  test("une date future est enregistrée en UTC avec le décalage du navigateur ; la page reste invisible avant l'heure", async () => {
    const when = new Date(Date.now() + 2 * 3600e3);
    // décalage navigateur : -120 min = UTC+2 → 14:00 locale = 12:00 UTC
    const local = new Date(when.getTime() + 120 * 60000); const pad = (n) => String(n).padStart(2, "0");
    const localStr = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
    const r = await boss.post(`${M}/pages/${id}/programmer`, { local: localStr, offset: "-120" });
    assert.equal(r.status, 302);
    const stored = one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", id).scheduled_at;
    assert.equal(stored, `${when.getUTCFullYear()}-${pad(when.getUTCMonth() + 1)}-${pad(when.getUTCDate())} ${pad(when.getUTCHours())}:${pad(when.getUTCMinutes())}:00`);
    assert.equal((await anon.get(`/p/${slugOf(id)}`)).status, 404, "pas en ligne avant l'heure");
    assert.equal(pages.promoteScheduledPages(db, { force: true }), 0, "rien à publier avant l'heure");
    const detail = (await boss.get(`${M}/pages/${id}`)).text;
    assert.match(detail, /Publication programmée/); assert.match(detail, /Annuler la programmation/);
  });
  test("annuler : la page reste hors ligne et la programmation disparaît", async () => {
    await boss.post(`${M}/pages/${id}/programmer/annuler`, {});
    assert.equal(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", id).scheduled_at, null);
    assert.ok(one("SELECT 1 FROM mk_audit_logs WHERE action = 'page.schedule_cancelled' AND resource_id = ?", String(id)));
  });
  test("à l'heure dite, la page est publiée à la première visite (plan du site, liste, ou page) et une version est créée", async () => {
    await boss.post(`${M}/pages/${id}/programmer`, parts(Date.now() + 3600e3));
    db.prepare("UPDATE mk_landing_pages SET scheduled_at = datetime('now', '-1 minute') WHERE id = ?").run(id);
    const versions = one("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ?", id).n;
    await boss.get(`${M}/pages`); // la liste des pages déclenche la vérification
    const row = one("SELECT status, scheduled_at, published_at FROM mk_landing_pages WHERE id = ?", id);
    assert.equal(row.status, "published"); assert.equal(row.scheduled_at, null); assert.ok(row.published_at);
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ?", id).n, versions + 1);
    assert.equal((await anon.get(`/p/${slugOf(id)}`)).status, 200);
  });
  test("publier à la main retire la programmation ; une page archivée ne garde pas de programmation", async () => {
    const other = await newPage("Page publiée à la main");
    await boss.post(`${M}/pages/${other}/programmer`, parts(Date.now() + 3600e3));
    assert.ok(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", other).scheduled_at);
    await boss.post(`${M}/pages/${other}/publier.json`, {});
    assert.equal(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", other).scheduled_at, null);
    const third = await newPage("Page archivée programmée");
    await boss.post(`${M}/pages/${third}/programmer`, parts(Date.now() + 3600e3));
    await boss.post(`${M}/pages/${third}/archiver`, {});
    assert.equal(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", third).scheduled_at, null);
    await boss.post(`${M}/pages/${third}/restaurer`, {});
    const refused = await boss.post(`${M}/pages/${third}/programmer`, parts(Date.now() - 1000));
    assert.equal(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", third).scheduled_at, null, refused.status + "");
  });
  test("si la page n'est plus publiable à l'heure dite, la programmation est retirée et l'échec consigné", async () => {
    const bad = await newPage("Page qui devient vide");
    await boss.post(`${M}/pages/${bad}/programmer`, parts(Date.now() + 3600e3));
    db.prepare("UPDATE mk_landing_pages SET sections = '[]', draft = NULL, scheduled_at = datetime('now', '-1 minute') WHERE id = ?").run(bad);
    pages.promoteScheduledPages(db, { force: true });
    const row = one("SELECT status, scheduled_at FROM mk_landing_pages WHERE id = ?", bad);
    assert.notEqual(row.status, "published"); assert.equal(row.scheduled_at, null);
    const log = one("SELECT metadata FROM mk_audit_logs WHERE action = 'page.schedule_failed' AND resource_id = ?", String(bad));
    assert.ok(log); assert.match(log.metadata, /aucune section/i);
  });
  test("droits : sans « pages.publish », on ne programme pas", async () => {
    const editor = await member("viewer");
    const fresh = await newPage("Page droits programmation");
    const r = await editor.post(`${M}/pages/${fresh}/programmer`, parts(Date.now() + 3600e3));
    assert.equal(r.status, 403);
    assert.equal(one("SELECT scheduled_at FROM mk_landing_pages WHERE id = ?", fresh).scheduled_at, null);
  });
});

describe("journal des connexions de l'équipe", () => {
  test("réussites et échecs du compte créateur sont journalisés, sans mot de passe ni adresse IP en clair", async () => {
    const { INSTRUCTOR } = require("./helpers");
    const c = new Client(srv.base);
    await c.post("/connexion", { email: INSTRUCTOR.email, password: "mauvais-mot-de-passe-secret" });
    await c.post("/connexion", { email: INSTRUCTOR.email, password: INSTRUCTOR.password });
    const logs = db.prepare("SELECT action, metadata FROM mk_audit_logs WHERE resource_type = 'auth' ORDER BY id").all();
    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes("auth.login_failed")); assert.ok(actions.includes("auth.login"));
    const all = JSON.stringify(logs);
    assert.doesNotMatch(all, /mauvais-mot-de-passe-secret/); assert.doesNotMatch(all, /127\.0\.0\.1|::1/);
  });
  test("un compte inconnu est journalisé par empreinte (jamais l'e-mail saisi) ; un élève ne remplit pas le journal", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_audit_logs WHERE resource_type = 'auth'").n;
    await new Client(srv.base).post("/connexion", { email: "inconnu@exemple.test", password: "xxxxxxxx" });
    const last = one("SELECT metadata FROM mk_audit_logs WHERE resource_type = 'auth' ORDER BY id DESC LIMIT 1");
    assert.equal(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE resource_type = 'auth'").n, before + 1);
    assert.doesNotMatch(last.metadata, /inconnu@exemple\.test/); assert.match(last.metadata, /"account":"[0-9a-f]{12}"/);
    const student = await newStudent(srv); // inscription + connexion d'élève
    await new Client(srv.base).post("/connexion", { email: student.email, password: "motdepasse123" });
    const after = one("SELECT COUNT(*) n FROM mk_audit_logs WHERE resource_type = 'auth'").n;
    assert.equal(after, before + 1, "une connexion d'élève n'est pas journalisée");
  });
});

describe("alerte de modération des commentaires", () => {
  test("un commentaire en attente met UN e-mail en file pour l'adresse administrative, sans recopier le texte du commentaire", async () => {
    db.prepare("INSERT OR REPLACE INTO mk_settings (organization_id, key, value) VALUES (?, 'cms.admin_email', ?)").run(orgId, "moderation@exemple.test");
    await boss.post(`${M}/site-web/parametres/commentaires`, { enabled_default: "1", guests_allowed: "1", moderation: "all", replies_allowed: "1", max_depth: "3", links_allowed: "1" });
    await article({ title: "Article avec commentaires", status: "published" });
    const post = one("SELECT slug FROM posts WHERE title = 'Article avec commentaires'");
    const send = async (n, body) => { const c = new Client(srv.base); await c.get(`/blog/${post.slug}`); return c.post(`/blog/${post.slug}/commentaires`, { author_name: `Visiteur ${n}`, author_email: `v${n}@exemple.test`, body, form_token: srv.formToken() }, { headers: { "x-forwarded-for": `198.51.100.${n}` } }); };
    await send(1, "Premier commentaire secret-un");
    await send(2, "Deuxième commentaire secret-deux");
    const rows = db.prepare("SELECT to_email, subject, body FROM mail_outbox WHERE kind = 'comment_pending'").all();
    const pending = one("SELECT COUNT(*) n FROM blog_comments WHERE status = 'pending'").n;
    assert.ok(pending > 0, "le premier commentaire d'un invité attend la modération (réglage par défaut)");
    assert.equal(rows.length, 1, "un seul e-mail par tranche de 10 minutes");
    assert.equal(rows[0].to_email, "moderation@exemple.test");
    assert.doesNotMatch(rows[0].body + rows[0].subject, /secret-un|secret-deux/);
    assert.match(rows[0].body, /\/marketing\/site-web\/commentaires\/en-attente/);
  });
});
