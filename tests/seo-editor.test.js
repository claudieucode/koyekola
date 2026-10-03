// KOLAKISA SEO CORE dans l'éditeur d'articles : résultats du dernier audit pour l'article, analyse de la page en ligne.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("SEO CORE dans l'éditeur d'articles", () => {
  let srv, prof, draftId, liveId;
  const json = (r) => JSON.parse(r.text);
  const form = (fields) => { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v); return fd; };
  const save = (url, fields) => prof.request(url, { method: "POST", multipart: form({ content_format: "html", ...fields }), headers: { "x-blog-editor": "1" } });
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    draftId = json(await save("/formateur/blog/nouveau", { title: "Brouillon", content: "<p>Texte.</p>", status: "draft" })).id;
    liveId = json(await save("/formateur/blog/nouveau", { title: "Article en ligne", slug: "article-en-ligne", content: '<p>Court. <a href="/page-inexistante">lien</a></p><figure class="kb-image"><img src="/uploads/thumbnails/absente.png"></figure>', status: "published" })).id;
  });
  after(() => srv.stop());

  test("brouillon : « Non disponible », analyse refusée avec explication", async () => {
    const r = json(await prof.get(`/formateur/blog/${draftId}/seo-audit`));
    assert.equal(r.online, false);
    const a = await prof.request(`/formateur/blog/${draftId}/seo-analyse`, { method: "POST" });
    assert.equal(a.status, 409);
    assert.match(json(a).error, /pas en ligne/);
  });

  test("article en ligne sans audit : aucun résultat inventé ; analyse réelle de la page publiée", async () => {
    let r = json(await prof.get(`/formateur/blog/${liveId}/seo-audit`));
    assert.equal(r.online, true);
    assert.equal(r.audit, null);
    assert.deepEqual(r.issues, []);
    const a = json(await prof.request(`/formateur/blog/${liveId}/seo-analyse`, { method: "POST" }));
    assert.equal(a.path, "/blog/article-en-ligne");
    const rules = a.issues.map((i) => i.rule);
    assert.ok(rules.includes("broken_internal_link"), rules.join(","));
    assert.ok(rules.includes("image_broken"), rules.join(","));
    assert.ok(a.issues.every((i) => i.title && i.severityLabel), "chaque problème a un libellé lisible");
    assert.equal(a.issues[0].severity, a.issues.slice().sort((x, y) => ["critical", "high", "medium", "low", "info"].indexOf(x.severity) - ["critical", "high", "medium", "low", "info"].indexOf(y.severity))[0].severity, "les plus graves d'abord");
  });

  test("après un audit du site : problèmes de cet article seulement, liens vers l'espace SEO", async () => {
    await prof.post("/formateur/seo/audit", { kind: "full" });
    const r = json(await prof.get(`/formateur/blog/${liveId}/seo-audit`));
    assert.ok(r.audit && r.audit.id);
    assert.ok(r.issues.some((i) => i.rule === "broken_internal_link"));
    assert.equal(r.newerThanAudit, false);
    assert.equal(r.links.analyse, "/formateur/seo/analyse?path=%2Fblog%2Farticle-en-ligne");
    const other = json(await prof.get(`/formateur/blog/${draftId}/seo-audit`));
    assert.deepEqual(other.issues, []);
  });

  test("le panneau est présent dans l'onglet SEO ; élève refusé", async () => {
    const html = (await prof.get(`/formateur/blog/${liveId}/modifier`)).text;
    assert.match(html, /Exploration du site \(audit\)/);
    assert.match(html, /data-seo-analyse/);
    const student = await newStudent(srv);
    assert.notEqual((await student.get(`/formateur/blog/${liveId}/seo-audit`)).status, 200);
    assert.notEqual((await student.request(`/formateur/blog/${liveId}/seo-analyse`, { method: "POST" })).status, 200);
  });
});
