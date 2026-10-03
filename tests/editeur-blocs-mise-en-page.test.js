// Éditeur d'articles — blocs de mise en page : H5/H6, citation mise en avant, espaceur, saut de page, encadrés Note /
// Important / Astuce, colonnes, groupe, groupe de boutons, boutons personnalisés, carte Google Maps.
// Valeurs validées une à une à l'enregistrement ; rendu public réel (aucun code injecté ne passe).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeBlogHtml: clean, renderBlogHtml: render } = require("../src/utils/blogHtml");

test("enregistrement : attributs de mise en page acceptés seulement s'ils sont valides", () => {
  const out = clean(`<h5>Cinq</h5><h6 onclick="x()">Six</h6><blockquote class="kb-pullquote autre"><p>Q</p></blockquote>
<div class="kb-spacer" data-size="l" data-size-mobile="xxl"></div><div class="kb-pagebreak"></div>
<div class="kb-columns" data-layout="33-67" data-gap="s" data-stack="tablet" data-valign="center" style="color:red"><div class="kb-column"><p>A</p></div><div class="kb-column"><p>B</p></div></div>
<div class="kb-columns" data-layout="10-90"><div class="kb-column"><p>C</p></div><div class="kb-column"><p>D</p></div></div>
<div class="kb-group" data-bg="dark" data-pad="l" data-border="true" data-width="wide"><p>G</p></div><div class="kb-group" data-bg="url(x)"><p>H</p></div>
<div class="kb-buttons" data-align="right"><p class="kb-button" data-size="l" data-radius="pill" data-width="full" data-bg="#112233" data-fg="red;x" data-border="#abcdef"><a class="btn btn-primary" href="/catalogue">Go</a></p></div>
<div class="callout callout-note" data-callout="note"><p>n</p></div><div class="callout callout-important" data-callout="important"><p>i</p></div><div class="callout callout-astuce" data-callout="astuce"><p>a</p></div>`);
  assert.match(out, /<h5>Cinq<\/h5><h6>Six<\/h6>/);
  assert.match(out, /<blockquote class="kb-pullquote">/);
  assert.match(out, /<div class="kb-spacer" data-size="l"><\/div>/);
  assert.match(out, /<div class="kb-pagebreak"><\/div>/);
  assert.match(out, /<div class="kb-columns" data-layout="33-67" data-gap="s" data-stack="tablet" data-valign="center"><div class="kb-column">/);
  assert.match(out, /<div class="kb-columns"><div class="kb-column"><p>C/, "disposition inconnue refusée");
  assert.match(out, /<div class="kb-group" data-bg="dark" data-pad="l" data-border="true" data-width="wide">/);
  assert.match(out, /<div class="kb-group"><p>H/);
  assert.match(out, /<p class="kb-button" data-align="[a-z]*"? ?|<p class="kb-button"/);
  assert.match(out, /data-size="l" data-radius="pill" data-width="full" data-bg="#112233" data-border="#abcdef"/);
  assert.doesNotMatch(out, /red;x|url\(x\)|onclick|style="color/);
  for (const t of ["note", "important", "astuce"]) assert.match(out, new RegExp(`callout callout-${t}" data-callout="${t}"`));
});

test("rendu public : identifiants des titres H5/H6, titres des encadrés, couleurs du bouton, carte Google Maps sûre", () => {
  const r = render(`<h5>Cinq</h5><div class="callout callout-astuce" data-callout="astuce"><p>a</p></div>
<p class="kb-button" data-bg="#112233" data-fg="#ffffff"><a class="btn btn-primary" href="/catalogue">Go</a></p>
<div class="kb-embed" data-url="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.99" data-caption="Bureau"></div>
<div class="kb-embed" data-url="https://pirate.test/maps/embed?pb=1234567890123"></div>`).html;
  assert.match(r, /<h5 id="cinq">Cinq<\/h5>/);
  assert.match(r, /<p class="callout-title">Astuce<\/p>/);
  assert.match(r, /style="--kb-btn-bg: #112233; --kb-btn-fg: #ffffff"/);
  assert.match(r, /<figure class="kb-map"><div class="kb-map-frame"><iframe src="https:\/\/www\.google\.com\/maps\/embed\?pb=[^"]+" title="Bureau" loading="lazy"/);
  assert.match(r, /<p class="kb-embed-link"><a href="https:\/\/pirate\.test/, "autre adresse : simple lien, jamais d'iframe");
  assert.equal((r.match(/<iframe/g) || []).length, 1);
});
