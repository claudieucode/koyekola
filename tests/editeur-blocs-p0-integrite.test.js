// KOLAKISA — éditeur d'articles, mission « parité Gutenberg » : fiabilité et intégrité (P0).
// D4 : le brouillon créé par la sauvegarde automatique naît dans le site de l'éditeur (jamais dans le site principal par défaut).
// D2 : une sauvegarde automatique trop grosse est REFUSÉE avec une erreur (jamais tronquée en JSON invalide puis perdue sans bruit).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("éditeur d'articles — intégrité P0", () => {
  let srv, boss, db, A, B, adminA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = async (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const form = (fields) => { const fd = new FormData(); Object.entries(fields).forEach(([k, v]) => fd.append(k, v)); return fd; };
  const brouillon = (client, query, title) => client.request(`/formateur/blog/api/brouillon${query}`, { method: "POST", multipart: form({ title }), headers: { "x-blog-editor": "1" } });
  const siteOf = (id) => (one("SELECT site_id s FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", id) || {}).s ?? null;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const c = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(A, await idOf(c), "admin");
    adminA = c;
  });
  after(() => srv.stop());

  test("D4 : le brouillon automatique d'un nouvel article naît dans le site de l'éditeur", async () => {
    const r = await brouillon(boss, `?site=${A}`, "Brouillon dans Alpha");
    assert.equal(r.status, 200, r.text);
    assert.equal(siteOf(JSON.parse(r.text).id), A);
  });

  test("D4 : sans site, le brouillon reste au site principal (aucun rattachement)", async () => {
    const id = JSON.parse((await brouillon(boss, "", "Brouillon principal")).text).id;
    assert.equal(siteOf(id), null);
  });

  test("D4 : un site inexistant ou falsifié est refusé et ne crée rien", async () => {
    const n = one("SELECT COUNT(*) n FROM posts").n;
    for (const bad of ["99999", "abc", "1;DROP"]) {
      const r = await brouillon(boss, `?site=${bad}`, "Pirate");
      assert.notEqual(r.status, 200, bad);
    }
    assert.equal(one("SELECT COUNT(*) n FROM posts").n, n);
  });

  test("D4 : un administrateur de site à accès limité n'a pas de brouillon automatique (refus voulu), et rien n'est créé", async () => {
    const n = one("SELECT COUNT(*) n FROM posts").n;
    assert.equal((await brouillon(adminA, `?site=${A}`, "Par l'admin A")).status, 403);
    assert.equal((await brouillon(adminA, `?site=${B}`, "Vers B")).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM posts").n, n);
  });

  test("D2 : une sauvegarde automatique trop volumineuse est refusée avec une erreur, l'ancienne reste lisible", async () => {
    const id = JSON.parse((await brouillon(boss, "", "Gros contenu")).text).id;
    const auto = (fields) => boss.request(`/formateur/blog/${id}/autosave`, { method: "POST", multipart: form(fields), headers: { "x-blog-editor": "1" } });
    const small = await auto({ title: "Petit", content: "<p>Premier état</p>" });
    assert.equal(small.status, 200, small.text);
    // Contenu maximal (guillemets échappés) + 300 champs : le JSON dépasse la capacité du stockage
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const extra = {};
    for (let i = 0; i < 300; i++) extra[`champ_${letters[i % 26]}${letters[Math.floor(i / 26)]}`] = "\"".repeat(5000);
    const huge = await auto({ title: "Énorme", content: `<p>${"\"".repeat(249000)}</p>`, ...extra });
    assert.equal(huge.status, 413, `statut ${huge.status} : ${huge.text.slice(0, 120)}`);
    assert.match(JSON.parse(huge.text).error, /volumineux/i);
    const row = one("SELECT payload FROM post_autosaves WHERE post_id = ?", id);
    assert.match(JSON.parse(row.payload).content, /Premier état/, "l'ancienne sauvegarde automatique est conservée et lisible");
  });

  describe("D3 conflits et D10 restauration", () => {
    const save = (id, fields) => boss.request(`/formateur/blog/${id}/modifier`, { method: "POST", multipart: form(fields), headers: { "x-blog-editor": "1" } });
    const create = async (title) => JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: form({ title, content: "<p>Départ</p>", content_format: "html", status: "draft" }), headers: { "x-blog-editor": "1" } })).text);

    test("D3 : deux enregistrements dans la même seconde sont distingués (le second, périmé, est refusé et n'écrase rien)", async () => {
      const a = await create("Conflit précis");
      assert.ok(a.rev, "la création renvoie l'empreinte de version");
      const first = await save(a.id, { title: "Conflit précis", content: "<p>Version onglet 1</p>", content_format: "html", base_rev: a.rev, base_updated_at: a.updatedAt });
      assert.equal(first.status, 200, first.text);
      const second = await save(a.id, { title: "Conflit précis", content: "<p>Version onglet 2</p>", content_format: "html", base_rev: a.rev, base_updated_at: a.updatedAt });
      assert.equal(second.status, 409, "la date seule (à la seconde) ne l'aurait pas vu");
      assert.equal(JSON.parse(second.text).conflict, true);
      assert.match(one("SELECT content FROM posts WHERE id = ?", a.id).content, /onglet 1/);
      const again = await save(a.id, { title: "Conflit précis", content: "<p>Version onglet 2</p>", content_format: "html", base_rev: JSON.parse(first.text).rev });
      assert.equal(again.status, 200, "avec la version à jour, l'enregistrement passe");
    });

    test("D3 : une sauvegarde automatique périmée est refusée (elle n'écrase pas celle d'un onglet à jour)", async () => {
      const a = await create("Autosave périmée");
      await save(a.id, { title: "Autosave périmée", content: "<p>Neuf</p>", content_format: "html", base_rev: a.rev });
      const r = await boss.request(`/formateur/blog/${a.id}/autosave`, { method: "POST", multipart: form({ title: "Vieux", content: "<p>Vieux</p>", base_rev: a.rev }), headers: { "x-blog-editor": "1" } });
      assert.equal(r.status, 409, r.text);
      assert.equal(one("SELECT COUNT(*) n FROM post_autosaves WHERE post_id = ?", a.id).n, 0);
    });

    test("D3 : restaurer une version avec une empreinte périmée est refusé", async () => {
      const a = await create("Restauration périmée");
      await save(a.id, { title: "Restauration périmée", content: "<p>Deux</p>", content_format: "html", base_rev: a.rev });
      const rid = one("SELECT id FROM post_revisions WHERE post_id = ? ORDER BY id ASC LIMIT 1", a.id).id;
      const r = await boss.request(`/formateur/blog/${a.id}/versions/${rid}/restaurer`, { method: "POST", json: { base_rev: a.rev }, headers: { "x-blog-editor": "1" } });
      assert.equal(r.status, 409, r.text);
    });

    test("D10 : le HTML d'une ancienne version est re-assaini à la restauration (aucun script ne revient)", async () => {
      const a = await create("Restauration saine");
      await save(a.id, { title: "Restauration saine", content: "<p>Propre</p>", content_format: "html", base_rev: a.rev });
      const meta = one("SELECT meta FROM post_revisions WHERE post_id = ? ORDER BY id DESC LIMIT 1", a.id).meta;
      const rid = Number(db.prepare("INSERT INTO post_revisions (post_id, user_id, title, excerpt, content, content_format, note, meta, kind, fingerprint) VALUES (?, NULL, ?, '', ?, 'html', 'ancienne', ?, 'save', 'x')")
        .run(a.id, "Restauration saine", "<p>Ancien</p><script>alert(1)</script><img src=x onerror=alert(2)>", meta).lastInsertRowid);
      const cur = one("SELECT * FROM posts WHERE id = ?", a.id);
      const rev = require("../src/services/blog").revisionFingerprint(cur);
      const r = await boss.request(`/formateur/blog/${a.id}/versions/${rid}/restaurer`, { method: "POST", json: { base_rev: rev }, headers: { "x-blog-editor": "1" } });
      assert.equal(r.status, 200, r.text);
      const content = one("SELECT content FROM posts WHERE id = ?", a.id).content;
      assert.match(content, /Ancien/);
      assert.doesNotMatch(content, /<script|onerror/i);
    });
  });

  test("client : la création transmet le site (D4) et une frappe pendant l'envoi n'est jamais déclarée enregistrée (D1)", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "src", "editor", "blog-editor.js"), "utf8");
    assert.match(src, /function siteQuery\(/);
    assert.match(src, /\/formateur\/blog\/nouveau\$\{siteQuery\(\)\}/, "save() ajoute ?site= à la création");
    assert.match(src, /const untouched = changeRev === revAtSend/, "D1 : comparaison de version avant de remettre dirty à faux");
    const bundle = fs.readFileSync(path.join(__dirname, "..", "public", "js", "blog-editor.js"), "utf8");
    assert.match(bundle, /nouveau\$\{\w+\(\)\}/, "le bundle publié contient la correction (npm run build:editor)");
  });
});
