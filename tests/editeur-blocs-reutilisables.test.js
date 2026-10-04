// Blocs réutilisables (copie ou synchronisés) et préférences de l'éditeur : contenu filtré, pas d'imbrication,
// propagation à l'affichage, suppression refusée tant qu'un article utilise le bloc, préférences validées.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("Blocs réutilisables et préférences de l'éditeur", () => {
  let srv, prof;
  const json = (r) => JSON.parse(r.text);
  const post = (url, body) => prof.request(url, { method: "POST", json: body });
  before(async () => { srv = await startServer(); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("création : contenu filtré, script retiré, repère imbriqué retiré, nom obligatoire", async () => {
    assert.equal((await post("/formateur/blog/api/blocs", { name: "", html: "<p>x</p>" })).status, 400);
    assert.equal((await post("/formateur/blog/api/blocs", { name: "Vide", html: "<script>alert(1)</script>" })).status, 400);
    const b = json(await post("/formateur/blog/api/blocs", { name: "Promo", category: "Offres", synced: true, html: '<p onclick="x()">Offre<script>alert(1)</script></p><div class="kb-reusable" data-ref="1"></div>' })).block;
    assert.equal(b.content, "<p>Offre</p>");
    assert.equal(b.synced, true);
  });

  test("synchronisé : l'article affiche la version à jour ; suppression refusée tant qu'il est utilisé", async () => {
    const { block } = json(await post("/formateur/blog/api/blocs", { name: "Bandeau", synced: true, html: "<p>Version 1</p>" }));
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Avec bandeau", content: `<p>Intro.</p><div class="kb-reusable" data-ref="${block.id}"></div>`, status: "published" })) fd.append(k, v);
    await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    assert.match((await prof.get("/blog/avec-bandeau")).text, /Version 1/);
    await post(`/formateur/blog/api/blocs/${block.id}`, { html: "<p>Version 2</p>" });
    const page = (await prof.get("/blog/avec-bandeau")).text;
    assert.match(page, /Version 2/);
    assert.doesNotMatch(page, /Version 1/);
    const del = await post(`/formateur/blog/api/blocs/${block.id}/supprimer`, {});
    assert.equal(del.status, 400);
    assert.match(json(del).error, /Avec bandeau/);
    assert.equal(json(await prof.get("/formateur/blog/api/blocs")).blocks.find((x) => x.id === block.id).uses, 1);
  });

  test("bloc synchronisé supprimé ou inconnu : rien n'est affiché (pas d'erreur)", async () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Repère orphelin", content: '<p>Texte.</p><div class="kb-reusable" data-ref="999"></div>', status: "published" })) fd.append(k, v);
    await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    const r = await prof.get("/blog/repere-orphelin");
    assert.equal(r.status, 200);
    assert.doesNotMatch(r.text, /kb-reusable/);
  });

  test("préférences : favoris, récents et réglages validés ; élève refusé", async () => {
    const r = json(await prof.request("/formateur/blog/api/preferences", { method: "PUT", json: { favorites: ["group", "<x>", "group"], recents: ["image"], settings: { width: "wide", autosave: false, density: "énorme", hiddenBlocks: ["newsletter"] } } })).prefs;
    assert.deepEqual(r.favorites, ["group"]);
    assert.deepEqual(r.recents, ["image"]);
    assert.equal(r.settings.width, "wide");
    assert.equal(r.settings.autosave, false);
    assert.equal(r.settings.density, "comfortable", "valeur inconnue → valeur par défaut");
    assert.deepEqual(r.settings.hiddenBlocks, ["newsletter"]);
    assert.match((await prof.get("/formateur/blog/nouveau")).text, /"favorites":\["group"\]/);
    const student = await newStudent(srv);
    assert.notEqual((await student.get("/formateur/blog/api/blocs")).status, 200);
  });
});
