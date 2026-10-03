// KOLAKISA SEO CORE — lot 4 : contrôle SEO avant publication (serveur) et journal des modifications SEO.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, createCourse } = require("./helpers");

describe("SEO CORE : contrôle avant publication et journal", () => {
  let srv, prof, course;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const json = (r) => JSON.parse(r.text);
  const form = (fields) => { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v); return fd; };
  const check = (fields) => prof.request("/formateur/blog/api/seo-check", { method: "POST", multipart: form({ content_format: "html", ...fields }) });
  const save = (url, fields) => prof.request(url, { method: "POST", multipart: form({ content_format: "html", ...fields }), headers: { "x-blog-editor": "1" } });
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
  });
  after(() => srv.stop());

  test("critique : titre vide, contenu vide, canonical invalide, image introuvable, adresse interdite par robots.txt", async () => {
    let r = json(await check({ title: "", content: "" }));
    assert.ok(r.critical.includes("Le titre est vide."));
    assert.ok(r.critical.includes("Le contenu est vide."));
    r = json(await check({ title: "Article", content: '<p>Texte.</p><figure class="kb-image"><img src="/uploads/thumbnails/absente.png" alt="x"></figure>', canonical_url: "http://pas-https.example" }));
    assert.ok(r.critical.some((x) => /Image introuvable : \/uploads\/thumbnails\/absente\.png/.test(x)));
    assert.ok(r.critical.some((x) => /canonique est invalide/.test(x)));
    await prof.post("/formateur/seo/reglages", { robots_custom: "User-agent: *\nDisallow: /blog/interdit" });
    r = json(await check({ title: "Interdit", slug: "interdit", content: "<p>Texte.</p>" }));
    assert.ok(r.critical.some((x) => /robots\.txt interdit l'adresse \/blog\/interdit/.test(x)));
    await prof.post("/formateur/seo/reglages", { robots_custom: "" });
  });

  test("avertissements : lien interne vers une page inexistante, H1 dans le contenu, noindex, image sans alt ; réussis listés", async () => {
    const r = json(await check({ title: "Article", content: `<h1>Titre 1</h1><p><a href="/blog/inexistant">x</a> <a href="/cours/${course.slug}">formation</a></p>`, robots_index: "0" }));
    assert.ok(r.warnings.some((x) => /\/blog\/inexistant/.test(x)));
    assert.equal(r.warnings.some((x) => x.includes(`/cours/${course.slug}`)), false, "la formation publiée existe");
    assert.ok(r.warnings.some((x) => /titre 1/.test(x)));
    assert.ok(r.warnings.some((x) => /noindex/.test(x)));
    assert.ok(r.passed.includes("Titre présent"));
    assert.equal(r.blocking, false, "par défaut : avertir seulement");
  });

  test("réglage « bloquer en cas d'erreur critique » : publication refusée par le serveur, brouillon toujours possible", async () => {
    const content = '<p>Texte.</p><figure class="kb-image"><img src="/uploads/thumbnails/absente.png" alt="x"></figure>';
    const warn = await save("/formateur/blog/nouveau", { title: "Publiable en mode avertir", content, status: "published" });
    assert.equal(warn.status, 200, "mode avertir : publié");
    await prof.post("/formateur/seo/reglages", { publish_guard: "block_critical" });
    assert.equal(json(await check({ title: "x", content })).blocking, true);
    const blocked = await save("/formateur/blog/nouveau", { title: "Bloqué", content, status: "published" });
    assert.equal(blocked.status, 400);
    assert.match(json(blocked).error, /Publication bloquée par le contrôle SEO/);
    assert.equal(q("SELECT COUNT(*) n FROM posts WHERE title = 'Bloqué'")[0].n, 0);
    const draft = await save("/formateur/blog/nouveau", { title: "Brouillon accepté", content, status: "draft" });
    assert.equal(draft.status, 200);
    await prof.post("/formateur/seo/reglages", { publish_guard: "warn" });
  });

  test("journal : modifications SEO d'un article et d'une formation (qui, quand, avant → après), historique dans l'éditeur", async () => {
    const id = json(await save("/formateur/blog/nouveau", { title: "Journalisé", content: "<p>Texte.</p>", status: "draft" })).id;
    await save(`/formateur/blog/${id}/modifier`, { title: "Journalisé", content: "<p>Texte.</p>", seo_title: "Nouveau titre SEO", seo_description: "Nouvelle description.", status: "draft" });
    const rows = q("SELECT field, old_value, new_value, user_id FROM seo_changes WHERE entity_type = 'post' AND entity_key = ? ORDER BY id", String(id));
    assert.deepEqual(rows.find((r) => r.field === "seo_title").new_value, "Nouveau titre SEO");
    assert.ok(rows.every((r) => r.user_id));
    const hist = json(await prof.get(`/formateur/blog/${id}/seo-historique`));
    assert.ok(hist.changes.some((c) => c.field === "seo_description" && c.after === "Nouvelle description."));
    await prof.post(`/formateur/cours/${course.id}/modifier`, { title: "Excel avancé", category: "Test", level: "debutant", price: "49", description: "desc", seo_title: "Excel : titre SEO", slug: course.slug });
    assert.equal(q("SELECT new_value FROM seo_changes WHERE entity_type = 'course' AND field = 'seo_title'")[0].new_value, "Excel : titre SEO");
    assert.match((await prof.get("/formateur/seo/journal")).text, /Excel : titre SEO/);
  });
});
