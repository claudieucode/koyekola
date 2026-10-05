// Mode Document de l'éditeur d'articles : seconde interface autour du MÊME éditeur (même contenu, même enregistrement).
// Côté serveur : polices du ruban acceptées (et seulement elles), choix du mode mémorisé sur le compte, page de l'éditeur.
// Le comportement dans le navigateur (bascule, ruban, enregistrement, rechargement) est vérifié au navigateur.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { sanitizeBlogHtml } = require("../src/utils/blogHtml");
const { startServer, loginInstructor } = require("./helpers");

describe("mode Document : polices", () => {
  const font = (f) => sanitizeBlogHtml(`<p><span style="font-family: ${f}">x</span></p>`);
  test("les 4 polices du ruban survivent à l'enregistrement", () => {
    for (const f of ["Figtree, sans-serif", "Bricolage Grotesque, sans-serif", "Georgia, serif", "ui-monospace, Menlo, monospace"]) assert.match(font(f), new RegExp(`font-family:${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), f);
    assert.match(font("&quot;Bricolage Grotesque&quot;, sans-serif"), /Bricolage Grotesque/, "écriture du navigateur (guillemets)");
  });
  test("toute autre police, ou une tentative d'injection, est retirée", () => {
    for (const f of ["Comic Sans MS", "Arial", "Georgia; background:url(https://x.fr/a.png)", "expression(alert(1))", "Figtree, sans-serif, Arial"]) assert.equal(font(f), "<p><span>x</span></p>", f);
  });
  test("les valeurs du ruban sont exactement celles acceptées par le serveur", () => {
    const src = fs.readFileSync(path.join(__dirname, "../src/editor/blog/documentMode.js"), "utf8");
    const values = [...src.matchAll(/\["([^"]+)", "[^"]+"\],/g)].map((m) => m[1]).filter((v) => /serif|monospace/.test(v));
    assert.deepEqual(values, ["Figtree, sans-serif", "Bricolage Grotesque, sans-serif", "Georgia, serif", "ui-monospace, Menlo, monospace"]);
    for (const v of values) assert.notEqual(font(v), "<p><span>x</span></p>", v);
  });
});

describe("mode Document : préférence et page de l'éditeur", () => {
  let srv, prof;
  const json = (r) => JSON.parse(r.text);
  before(async () => { srv = await startServer({ SITE_URL: "" }); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("le mode choisi est mémorisé sur le compte (blocs par défaut, valeur inconnue refusée)", async () => {
    const put = async (settings) => json(await prof.request("/formateur/blog/api/preferences", { method: "PUT", json: { favorites: [], recents: [], settings } })).prefs.settings.editMode;
    assert.equal(await put({}), "blocks");
    assert.equal(await put({ editMode: "document" }), "document");
    assert.equal(await put({ editMode: "word" }), "blocks");
  });

  test("page de l'éditeur : sélecteur Blocs / Document (boutons radio accessibles), un seul éditeur, un seul champ de contenu", async () => {
    const page = (await prof.request("/formateur/blog/nouveau")).text;
    assert.match(page, /<div class="wp-mode-switch" role="radiogroup" aria-label="Mode d'édition">/);
    assert.match(page, /role="radio" aria-checked="true" data-edit-mode="blocks"/);
    assert.match(page, /role="radio" aria-checked="false" data-edit-mode="document"/);
    assert.equal((page.match(/id="be-editor"/g) || []).length, 1, "un seul éditeur : les deux modes partagent le même document");
    assert.equal((page.match(/name="content"/g) || []).length, 1, "un seul contenu enregistré");
  });

  test("le script de l'éditeur contient le mode Document (bundle reconstruit)", () => {
    const bundle = fs.readFileSync(path.join(__dirname, "../public/js/blog-editor.js"), "utf8");
    assert.match(bundle, /doc-ribbon/);
    assert.match(bundle, /Bricolage Grotesque, sans-serif/);
  });
});
