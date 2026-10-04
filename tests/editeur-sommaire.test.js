// Sommaire des articles : profondeur H2 → H4 et numérotation (aucune, parties, hiérarchique), enregistrées avec l'article.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor } = require("./helpers");

describe("Sommaire : profondeur et numérotation", () => {
  let srv, prof;
  const content = "<h2>Un</h2><p>a</p><h3>Un-un</h3><p>b</p><h4>Un-un-un</h4><p>c</p><h2>Deux</h2><p>d</p>";
  const make = async (slug, extra) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: slug, slug, content, status: "published", ...extra })) fd.append(k, v);
    await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    const html = (await prof.get(`/blog/${slug}`)).text;
    return (html.split('class="article-toc-list"')[1] || "").split("</ol>")[0];
  };
  before(async () => { srv = await startServer(); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("par défaut : H2 + H3, parties numérotées 01, 02 (inchangé)", async () => {
    const toc = await make("defaut", {});
    assert.match(toc, /toc-num" aria-hidden="true">01</);
    assert.match(toc, /Un-un</);
    assert.doesNotMatch(toc, /Un-un-un/);
  });
  test("H2 → H4 et numérotation hiérarchique", async () => {
    const toc = await make("hierarchique", { toc_depth: "4", toc_numbering: "full" });
    assert.match(toc, /class="toc-l4"/);
    for (const n of ["1", "1.1", "1.1.1", "2"]) assert.match(toc, new RegExp(`aria-hidden="true">${n.replace(/\./g, "\\.")}</`));
  });
  test("sans numérotation ; valeurs inconnues ignorées", async () => {
    const toc = await make("sans-numero", { toc_numbering: "none", toc_depth: "9" });
    assert.doesNotMatch(toc, /toc-num/);
    assert.doesNotMatch(toc, /toc-l4/, "profondeur inconnue → valeur par défaut");
  });
});
