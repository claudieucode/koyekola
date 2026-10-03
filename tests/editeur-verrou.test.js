// Éditeur d'articles : un bloc verrouillé reste verrouillé après enregistrement (marqueur strict conservé par le filtre
// de sécurité), sans effet sur la page publique.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeBlogHtml, renderBlogHtml } = require("../src/utils/blogHtml");

test("marqueur de verrou : conservé seulement s'il vaut « true », sur les blocs uniquement", () => {
  const out = sanitizeBlogHtml('<p data-locked="true">A</p><h2 data-locked="oui">B</h2><figure class="kb-image" data-locked="true"><img src="/uploads/thumbnails/a.png" alt=""></figure><hr data-locked="true"><div class="callout callout-info" data-callout="info" data-locked="true"><p>C</p></div><p><strong data-locked="true">D</strong></p>');
  assert.match(out, /<p data-locked="true">A<\/p>/);
  assert.match(out, /<h2>B<\/h2>/);
  assert.match(out, /<figure class="kb-image" data-locked="true">/);
  assert.match(out, /<hr data-locked="true">/);
  assert.match(out, /<div class="callout callout-info" data-callout="info" data-locked="true">/);
  assert.match(out, /<strong>D<\/strong>/);
});

test("rendu public : le contenu d'un bloc verrouillé s'affiche normalement", () => {
  const html = String(renderBlogHtml(sanitizeBlogHtml('<p data-locked="true">Texte protégé</p>')).html || renderBlogHtml(sanitizeBlogHtml('<p data-locked="true">Texte protégé</p>')));
  assert.match(html, /Texte protégé/);
});
