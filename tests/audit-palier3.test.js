// Audit de préparation du palier 3 : lecture seule, nombres uniquement, cas ambigus (média / formulaire utilisés par plusieurs sites, contacts multi-sites).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const auditSites = require("../src/services/auditSites");

let srv, boss, db, org;
const ins = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
const count = (t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  org = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = (n) => ins("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')", org, n, n.toLowerCase());
  const A = site("Alpha"), B = site("Beta");
  const page = (s, n, sections, formId) => ins("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, sections, form_id) VALUES (?, ?, ?, ?, 'published', ?, ?, ?)", org, n, "p-" + n, n, s, sections, formId || null);
  const media = (n) => ins("INSERT INTO mk_media (organization_id, kind, path, name, mime, size) VALUES (?, 'image', ?, ?, 'image/png', 10)", org, `/uploads/marketing/1/${n}.png`, n);
  media("inutilise"); media("principal"); media("alpha"); media("partage");
  page(null, "pm", JSON.stringify([{ src: "/uploads/marketing/1/principal.png" }, { src: "/uploads/marketing/1/partage.png" }]));
  page(A, "pa", JSON.stringify([{ src: "/uploads/marketing/1/alpha.png" }, { src: "/uploads/marketing/1/partage.png" }]));
  const form = (n) => ins("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (?, ?, ?, 'ok')", org, n, n);
  const f1 = form("f-inutile"), f2 = form("f-principal"), f3 = form("f-alpha"), f4 = form("f-partage");
  page(null, "fm", "[]", f2); page(A, "fa", "[]", f3); page(null, "fp1", "[]", f4); page(B, "fp2", JSON.stringify([{ type: "form", formId: f4 }]));
  void f1;
  const lst = (s, n) => ins("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, ?, ?)", org, n, s);
  const lA = lst(A, "LA"), lB = lst(B, "LB"), lM = lst(null, "LM");
  const ct = (e, origin) => ins("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (?, ?, ?)", org, e, origin);
  const c1 = ct("prive.un@exemple.test", A), c2 = ct("prive.deux@exemple.test", null);
  const mem = (l, c) => db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (?, ?, ?)").run(org, l, c);
  mem(lA, c1); mem(lB, c1); mem(lM, c2);
  ins("INSERT INTO posts (slug, title, content, status, published) VALUES ('a1', 'Article', 'x', 'published', 1)");
  ins("INSERT INTO posts (slug, title, content, status, published, deleted_at) VALUES ('a2', 'Corbeille', 'x', 'draft', 0, datetime('now'))");
  const t = ins("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Cat', 'cat')");
  db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', 99999, ?)").run(t);
});
after(() => srv.stop());

describe("audit de préparation du palier 3", () => {
  test("classe les médias et formulaires selon les sites qui les utilisent", () => {
    const r = auditSites.palier3(db);
    assert.deepEqual(r.medias, { total: 4, inutilises: 1, principal: 1, un_site: 1, plusieurs: 1 });
    assert.deepEqual(r.formulaires, { total: 4, inutilises: 1, principal: 1, un_site: 1, plusieurs: 1 });
  });
  test("contacts : origine et appartenance à des listes de plusieurs sites", () => {
    const c = auditSites.palier3(db).contacts;
    assert.equal(c.total, 3); assert.equal(c.origine_principal, 2); assert.equal(c.origine_site, 1); // le compte formateur du test a aussi un contact
    assert.equal(c.listes_plusieurs_sites, 1);
    assert.equal(c.liste_autre_que_origine, 1); // le contact 1 (origine Alpha) est aussi dans la liste de Beta
  });
  test("volumes et liens de catégories orphelins", () => {
    const r = auditSites.palier3(db);
    const v = Object.fromEntries(r.volumes.map((x) => [x.label, x.n]));
    assert.equal(v["Articles (tous)"], 2); assert.equal(v["— dont publiés"], 1); assert.equal(v["— dont à la corbeille"], 1);
    assert.equal(r.taxonomies.liens_article_sans_article, 1);
    assert.equal(r.taxonomies.liens_sans_terme, 0);
  });
  test("lecture seule et aucune donnée personnelle dans le résultat ni dans l'écran", async () => {
    const before = ["mk_media", "mk_forms", "mk_contacts", "posts", "mk_landing_pages"].map(count);
    const json = JSON.stringify(auditSites.run(db));
    assert.doesNotMatch(json, /exemple\.test|Alpha|Beta|prive/);
    const page = (await boss.get("/formateur/gestion/sauvegardes/audit-sites?source=active")).text;
    assert.match(page, /Préparation du palier 3/);
    assert.match(page, /plusieurs sites \(à décider\)/);
    assert.doesNotMatch(page, /prive\.un|prive\.deux|exemple\.test/);
    assert.deepEqual(["mk_media", "mk_forms", "mk_contacts", "posts", "mk_landing_pages"].map(count), before);
  });
  test("ne compte rien comme anomalie : l'audit reste « aucune anomalie » pour ces cas", () => {
    assert.equal(auditSites.run(db).anomalies, 0);
  });
});
