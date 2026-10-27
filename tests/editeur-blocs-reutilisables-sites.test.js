// KOLAKISA — blocs réutilisables : isolation par site (D7), historique des modifications globales (D7), suppression sans réécriture muette (D6).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const blogService = require("../src/services/blog");

let srv, boss, db, A, B;
const json = (r) => JSON.parse(r.text);
const one = (sql, ...a) => db.prepare(sql).get(...a);
const ref = (id) => `<div class="kb-reusable" data-ref="${id}"></div>`;
const blocks = (qs = "") => boss.get(`/formateur/blog/api/blocs${qs}`).then((r) => json(r).blocks.map((b) => b.name));
const createBlock = (name, html, qs = "") => boss.postJson(`/formateur/blog/api/blocs${qs}`, { name, html });
async function article(title, content, qs = "", status = "published") {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ content_format: "html", title, content, status })) fd.append(k, v);
  return json(await boss.request(`/formateur/blog/nouveau${qs}`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }));
}
const page = async (slug) => (await fetch(`${srv.base}/blog/${slug}`)).text();

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  const orgId = one("SELECT id FROM mk_organizations").id;
  const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
  A = site("Alpha"); B = site("Beta");
});
after(() => srv.stop());

describe("D7 : un bloc réutilisable appartient à un site", () => {
  let shared, blockA;
  before(async () => {
    shared = json(await createBlock("Partagé", "<p>Contenu partagé</p>")).block;
    blockA = json(await createBlock("Privé Alpha", "<p>Secret Alpha</p>", `?site=${A}`)).block;
  });

  test("un bloc créé dans l'éditeur d'un site est rattaché à ce site ; sans site il reste partagé", () => {
    assert.equal(blockA.siteId, A);
    assert.equal(shared.siteId, null);
  });

  test("chaque éditeur ne voit que les blocs partagés et ceux de son site", async () => {
    assert.deepEqual((await blocks()).sort(), ["Partagé"]);
    assert.deepEqual((await blocks(`?site=${A}`)).sort(), ["Partagé", "Privé Alpha"]);
    assert.deepEqual((await blocks(`?site=${B}`)).sort(), ["Partagé"]);
  });

  test("lire, modifier, dupliquer, supprimer le bloc d'un autre site : introuvable (aucune fuite d'existence)", async () => {
    for (const qs of ["", `?site=${B}`]) {
      assert.equal((await boss.get(`/formateur/blog/api/blocs/${blockA.id}${qs}`)).status, 404);
      assert.equal((await boss.postJson(`/formateur/blog/api/blocs/${blockA.id}${qs}`, { html: "<p>Pirate</p>" })).status, 404);
      assert.equal((await boss.request(`/formateur/blog/api/blocs/${blockA.id}/dupliquer${qs}`, { method: "POST" })).status, 404);
      assert.equal((await boss.postJson(`/formateur/blog/api/blocs/${blockA.id}/supprimer${qs}`, { mode: "retirer" })).status, 404);
    }
    assert.match(one("SELECT content FROM blog_reusable_blocks WHERE id = ?", blockA.id).content, /Secret Alpha/);
  });

  test("un bloc partagé ne se modifie que hors de tout site", async () => {
    assert.equal((await boss.postJson(`/formateur/blog/api/blocs/${shared.id}?site=${A}`, { html: "<p>Depuis Alpha</p>" })).status, 404);
    assert.equal((await boss.postJson(`/formateur/blog/api/blocs/${shared.id}`, { html: "<p>Contenu partagé v2</p>" })).status, 200);
  });

  test("une référence saisie à la main vers le bloc d'un autre site est retirée à l'enregistrement", async () => {
    const inB = await article("Article Beta", `<p>Texte</p>${ref(blockA.id)}`, `?site=${B}`);
    assert.doesNotMatch(one("SELECT content FROM posts WHERE id = ?", inB.id).content, /kb-reusable/);
    const inA = await article("Article Alpha", `<p>Texte</p>${ref(blockA.id)}`, `?site=${A}`);
    assert.match(one("SELECT content FROM posts WHERE id = ?", inA.id).content, new RegExp(`data-ref="${blockA.id}"`));
    assert.match(await page(inA.slug), /Secret Alpha/);
  });

  test("à l'affichage, un repère injecté en base vers le bloc d'un autre site n'affiche rien", async () => {
    const inB = await article("Article Beta 2", "<p>Texte Beta</p>", `?site=${B}`);
    db.prepare("UPDATE posts SET content = ? WHERE id = ?").run(`<p>Texte Beta</p>${ref(blockA.id)}`, inB.id);
    const html = await page(inB.slug);
    assert.match(html, /Texte Beta/);
    assert.doesNotMatch(html, /Secret Alpha/);
  });

  test("le bloc partagé s'affiche dans les articles de tous les sites", async () => {
    const inB = await article("Article Beta 3", `<p>Beta</p>${ref(shared.id)}`, `?site=${B}`);
    assert.match(await page(inB.slug), /Contenu partagé v2/);
  });
});

describe("D7 : historique des modifications globales", () => {
  test("chaque modification laisse une version restaurable, la restauration est elle-même historisée", async () => {
    const b = json(await createBlock("Historisé", "<p>Version 1</p>")).block;
    await boss.postJson(`/formateur/blog/api/blocs/${b.id}`, { html: "<p>Version 2</p>" });
    await boss.postJson(`/formateur/blog/api/blocs/${b.id}`, { html: "<p>Version 3</p>" });
    const versions = json(await boss.get(`/formateur/blog/api/blocs/${b.id}/versions`)).versions;
    assert.equal(versions.length, 2);
    assert.match(versions[1].content, /Version 1/);
    const restored = await boss.postJson(`/formateur/blog/api/blocs/${b.id}/versions/${versions[1].id}/restaurer`, {});
    assert.equal(restored.status, 200, restored.text);
    assert.match(one("SELECT content FROM blog_reusable_blocks WHERE id = ?", b.id).content, /Version 1/);
    assert.equal(json(await boss.get(`/formateur/blog/api/blocs/${b.id}/versions`)).versions.length, 3, "la version 3 est conservée");
  });

  test("l'historique d'un bloc d'un autre site est introuvable", async () => {
    const b = json(await createBlock("Privé Beta", "<p>Beta</p>", `?site=${B}`)).block;
    assert.equal((await boss.get(`/formateur/blog/api/blocs/${b.id}/versions`)).status, 404);
    assert.equal((await boss.get(`/formateur/blog/api/blocs/${b.id}/versions?site=${A}`)).status, 404);
  });
});

describe("D6 : supprimer un bloc utilisé ne réécrit pas l'histoire en silence", () => {
  test("les articles réécrits avancent leur date et reçoivent une révision ; les révisions gardent une empreinte exacte", async () => {
    const b = json(await createBlock("À supprimer", "<p>Texte du bloc</p>")).block;
    const art = await article("Article avec bloc", `<p>Avant</p>${ref(b.id)}`);
    const before = one("SELECT updated_at FROM posts WHERE id = ?", art.id);
    const revisionsBefore = one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", art.id).n;
    // l'horloge SQLite est à la seconde : on recule la date pour prouver qu'elle avance
    db.prepare("UPDATE posts SET updated_at = '2020-01-01 00:00:00' WHERE id = ?").run(art.id);
    const r = await boss.postJson(`/formateur/blog/api/blocs/${b.id}/supprimer`, { mode: "copies" });
    assert.equal(r.status, 200, r.text);
    const after = one("SELECT * FROM posts WHERE id = ?", art.id);
    assert.match(after.content, /Texte du bloc/);
    assert.doesNotMatch(after.content, /kb-reusable/);
    assert.notEqual(after.updated_at, "2020-01-01 00:00:00", "la date de modification avance : un onglet ouvert détecte le conflit");
    assert.ok(before.updated_at);
    assert.equal(one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", art.id).n, revisionsBefore + 1, "une révision explique le changement");
    for (const rev of db.prepare("SELECT * FROM post_revisions WHERE post_id = ?").all(art.id)) {
      const expected = blogService.revisionFingerprint({ ...JSON.parse(rev.meta || "{}"), title: rev.title, excerpt: rev.excerpt, content: rev.content, content_format: rev.content_format });
      assert.equal(rev.fingerprint, expected, `empreinte de la révision ${rev.id}`);
    }
    assert.equal(one("SELECT COUNT(*) n FROM blog_reusable_versions WHERE block_id = ? AND reason = 'delete'", b.id).n, 1, "le bloc supprimé reste récupérable");
  });
});
