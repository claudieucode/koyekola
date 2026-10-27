// KOLAKISA — réglages communs des blocs : ancre HTML et classes CSS supplémentaires (équivalent des « supports » de Gutenberg). Règles du serveur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeBlogHtml, renderBlogHtml } = require("../src/utils/blogHtml");

describe("ancre HTML et classes supplémentaires — serveur", () => {
  test("ancre valide conservée, invalide retirée, doublon : la première seulement", () => {
    const out = sanitizeBlogHtml('<p id="tarifs">A</p><p id="1chiffre">B</p><p id="a b">C</p><p id="tarifs">D</p><p id="javascript:x">E</p>');
    assert.match(out, /<p id="tarifs">A<\/p>/);
    assert.equal((out.match(/ id="/g) || []).length, 1, out);
    assert.match(out, /B<\/p><p>C<\/p><p>D<\/p>/);
  });
  test("seules les classes kb-x-* sont gardées, 5 au maximum, jamais de classe libre ni de style", () => {
    const out = sanitizeBlogHtml('<p data-class="kb-x-a evil kb-x-b onclick=alert(1) kb-x-c kb-x-d kb-x-e kb-x-f" class="evil" style="position:fixed">T</p>');
    assert.match(out, /data-class="kb-x-a kb-x-b kb-x-c kb-x-d kb-x-e"/);
    assert.doesNotMatch(out, /evil|onclick|position|\sclass=/);
  });
  test("à l'affichage : data-class devient class, l'ancre d'un titre est conservée et n'entre pas en collision avec les ancres automatiques", () => {
    const r = renderBlogHtml('<h2 id="intro" data-class="kb-x-grand">Intro</h2><h2>Intro</h2><div class="kb-spacer" data-size="m" id="espace" data-class="kb-x-vide"></div>');
    assert.match(r.html, /<h2 id="intro" class="kb-x-grand">Intro<\/h2>/);
    assert.match(r.html, /<h2 id="intro-2">Intro<\/h2>/);
    assert.match(r.html, /class="kb-spacer kb-x-vide"/);
    assert.doesNotMatch(r.html, /data-class/);
    assert.deepEqual(r.toc.map((t) => t.id), ["intro", "intro-2"]);
  });
  test("un bloc remplacé par son lecteur (vidéo) garde son ancre", () => {
    const r = renderBlogHtml('<div class="kb-video" id="demo" data-class="kb-x-vedette" data-url="https://youtu.be/dQw4w9WgXcQ"></div>');
    assert.match(r.html, /<figure class="kb-video kb-x-vedette" id="demo">/);
  });
});
