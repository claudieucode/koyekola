// Blocs réutilisables : vraie synchronisation au niveau des données et du rendu public (scénario complet),
// copies indépendantes, identifiant stable, suppression sans référence cassée.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, prof;
const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
const json = (r) => JSON.parse(r.text);
const ref = (id) => `<div class="kb-reusable" data-ref="${id}"></div>`;
async function article(title, content) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ content_format: "html", title, content, status: "published" })) fd.append(k, v);
  return json(await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }));
}
const page = async (slug) => (await fetch(`${srv.base}/blog/${slug}`)).text();
const updateBlock = (id, body) => prof.postJson(`/formateur/blog/api/blocs/${id}`, body);

before(async () => { srv = await startServer(); prof = await loginInstructor(srv); });
after(() => srv.stop());

describe("Scénario : Bloc A dans 3 articles, puis copie indépendante", () => {
  let A, a1, a2, a3, a4;
  before(async () => {
    A = json(await prof.postJson("/formateur/blog/api/blocs", { name: "À propos de KOLAKISA", html: "<p>À propos de KOLAKISA — version 1</p>" })).block;
    a1 = await article("Article 1", `<p>Intro 1</p>${ref(A.id)}`);
    a2 = await article("Article 2", `<p>Intro 2</p>${ref(A.id)}`);
    a3 = await article("Article 3", `<p>Intro 3</p>${ref(A.id)}<p>Milieu</p>${ref(A.id)}`); // deux fois dans le même article
  });
  test("les articles ne stockent qu'une référence (identifiant), pas le contenu", () => {
    for (const p of [a1, a2, a3]) {
      const c = q("SELECT content FROM posts WHERE id = ?", p.id)[0].content;
      assert.match(c, new RegExp(`data-ref="${A.id}"`));
      assert.doesNotMatch(c, /version 1/);
    }
  });
  test("utilisations : 3 articles, 4 occurrences (deux dans l'article 3)", async () => {
    const u = json(await prof.get(`/formateur/blog/api/blocs/${A.id}/utilisations`));
    assert.equal(u.posts.length, 3);
    assert.equal(u.occurrences, 4);
    assert.equal(u.posts.find((p) => p.id === a3.id).count, 2);
    const b = json(await prof.get(`/formateur/blog/api/blocs/${A.id}`)).block;
    assert.deepEqual([b.uses, b.occurrences], [3, 4]);
  });
  test("modifier le Bloc A → les 3 articles affichent la nouvelle version (page publique)", async () => {
    assert.equal((await updateBlock(A.id, { html: "<p>À propos de KOLAKISA — nouvelle version</p>" })).status, 200);
    for (const p of [a1, a2, a3]) {
      const html = await page(p.slug);
      assert.match(html, /nouvelle version/, p.slug);
      assert.doesNotMatch(html, /version 1/, p.slug);
    }
    assert.equal((((await page(a3.slug)).match(/nouvelle version/g)) || []).length, 2, "les deux occurrences de l'article 3");
  });
  test("copie indépendante, puis second changement du Bloc A : la copie ne change pas", async () => {
    const current = json(await prof.get(`/formateur/blog/api/blocs/${A.id}`)).block.content;
    a4 = await article("Article 4 (copie)", `<p>Intro 4</p>${current}`); // « Insérer comme copie » = contenu indépendant
    await updateBlock(A.id, { html: "<p>À propos de KOLAKISA — troisième version</p>" });
    for (const p of [a1, a2, a3]) assert.match(await page(p.slug), /troisième version/, p.slug);
    const copy = await page(a4.slug);
    assert.match(copy, /nouvelle version/);
    assert.doesNotMatch(copy, /troisième version/);
  });
  test("identifiant stable : renommer ne casse aucun lien, l'article enregistré à nouveau reste relié", async () => {
    await updateBlock(A.id, { name: "À propos (renommé)", category: "Présentation" });
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Article 1", content: `<p>Intro 1 modifiée</p>${ref(A.id)}`, status: "published", slug: a1.slug })) fd.append(k, v);
    await prof.request(`/formateur/blog/${a1.id}/modifier`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    assert.match(await page(a1.slug), /troisième version/);
    assert.equal(q("SELECT name FROM blog_reusable_blocks WHERE id = ?", A.id)[0].name, "À propos (renommé)");
  });
  test("dupliquer : nouveau bloc, nouvel identifiant, indépendant de l'original", async () => {
    const D = json(await prof.post(`/formateur/blog/api/blocs/${A.id}/dupliquer`, {})).block;
    assert.notEqual(D.id, A.id);
    assert.match(D.content, /troisième version/);
    await updateBlock(D.id, { html: "<p>Version du duplicata</p>" });
    assert.match(await page(a2.slug), /troisième version/);
    assert.doesNotMatch(await page(a2.slug), /duplicata/);
  });
});

describe("Suppression : jamais de référence cassée", () => {
  test("bloc utilisé : refus sans choix, avec le nombre d'occurrences", async () => {
    const B = json(await prof.postJson("/formateur/blog/api/blocs", { name: "CTA", html: "<p>Inscrivez-vous</p>" })).block;
    await article("Avec CTA", `<p>x</p>${ref(B.id)}${ref(B.id)}`);
    const r = await prof.postJson(`/formateur/blog/api/blocs/${B.id}/supprimer`, {});
    assert.equal(r.status, 400);
    assert.match(json(r).error, /utilisé 2 fois \(1 article/);
  });
  test("« convertir en copies » : articles, versions et brouillon automatique gardent le contenu, plus aucun repère", async () => {
    const C = json(await prof.postJson("/formateur/blog/api/blocs", { name: "Encart", html: "<p>Texte de l'encart</p>" })).block;
    const p = await article("Avec encart", `<p>Début</p>${ref(C.id)}`);
    // brouillon automatique qui contient aussi le repère
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Avec encart", content: `<p>Début modifié</p>${ref(C.id)}` })) fd.append(k, v);
    await prof.request(`/formateur/blog/${p.id}/autosave`, { method: "POST", multipart: fd });
    const r = json(await prof.postJson(`/formateur/blog/api/blocs/${C.id}/supprimer`, { mode: "copies" }));
    assert.deepEqual([r.converted, r.posts], [1, 1]);
    assert.equal(q("SELECT COUNT(*) n FROM blog_reusable_blocks WHERE id = ?", C.id)[0].n, 0);
    const content = q("SELECT content FROM posts WHERE id = ?", p.id)[0].content;
    assert.match(content, /Texte de l'encart/);
    assert.doesNotMatch(content, /kb-reusable/);
    assert.ok(q("SELECT content FROM post_revisions WHERE post_id = ?", p.id).every((v) => !/data-ref="/.test(v.content)), "versions converties");
    const auto = JSON.parse(q("SELECT payload FROM post_autosaves WHERE post_id = ?", p.id)[0].payload);
    assert.match(auto.content, /Texte de l'encart/);
    assert.doesNotMatch(auto.content, /kb-reusable/);
    assert.match(await page(p.slug), /Texte de l'encart/);
  });
  test("« retirer les occurrences » : le contenu disparaît, l'article reste valide", async () => {
    const E = json(await prof.postJson("/formateur/blog/api/blocs", { name: "Temporaire", html: "<p>À retirer</p>" })).block;
    const p = await article("Avec temporaire", `<p>Reste</p>${ref(E.id)}`);
    json(await prof.postJson(`/formateur/blog/api/blocs/${E.id}/supprimer`, { mode: "retirer" }));
    const content = q("SELECT content FROM posts WHERE id = ?", p.id)[0].content;
    assert.match(content, /Reste/);
    assert.doesNotMatch(content, /kb-reusable|À retirer/);
  });
  test("un repère vers un bloc inexistant n'est jamais enregistré", async () => {
    const p = await article("Repère cassé", `<p>Texte</p>${ref(999999)}`);
    assert.doesNotMatch(q("SELECT content FROM posts WHERE id = ?", p.id)[0].content, /kb-reusable/);
  });
});

describe("Compatibilité et accès", () => {
  test("un ancien bloc enregistré en mode « copie » est résolu s'il est inséré synchronisé", async () => {
    const L = json(await prof.postJson("/formateur/blog/api/blocs", { name: "Ancien", html: "<p>Ancien bloc copie</p>", synced: false })).block;
    const p = await article("Ancien mode", `<p>x</p>${ref(L.id)}`);
    assert.match(await page(p.slug), /Ancien bloc copie/);
  });
  test("bloc imbriqué impossible (pas de boucle)", async () => {
    const N = json(await prof.postJson("/formateur/blog/api/blocs", { name: "Parent", html: `<p>Parent</p>${ref(1)}` })).block;
    assert.doesNotMatch(N.content, /kb-reusable/);
  });
  test("réservé au formateur", async () => {
    const eleve = await newStudent(srv);
    assert.notEqual((await eleve.get("/formateur/blog/api/blocs")).status, 200);
    assert.notEqual((await eleve.postJson("/formateur/blog/api/blocs/1/supprimer", { mode: "retirer" })).status, 200);
  });
});
