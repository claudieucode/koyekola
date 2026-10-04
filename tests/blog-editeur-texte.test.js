// Éditeur de texte du blog : ce que l'éditeur produit est GARDÉ à l'enregistrement et AFFICHÉ sur la page publique
// (même liste blanche aux deux étapes). Tailles du texte et retrait : seulement les valeurs proposées par l'éditeur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeBlogHtml, renderBlogHtml } = require("../src/utils/blogHtml");

const keep = (html) => sanitizeBlogHtml(html);
const shown = (html) => renderBlogHtml(html).html;

describe("éditeur du blog : structure conservée", () => {
  test("titres H1 à H6, listes imbriquées (3 niveaux), liste numérotée qui commence à 3, citation", () => {
    const src = '<h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h5>E</h5><h6>F</h6><ul><li><p>a</p><ul><li><p>a.1</p><ul><li><p>a.1.1</p></li></ul></li></ul></li></ul><ol start="3"><li><p>trois</p><ol><li><p>trois.un</p></li></ol></li></ol><blockquote><p>cite</p></blockquote>';
    const out = keep(src);
    for (const re of [/<h1>A<\/h1>/, /<h5>E<\/h5>/, /<h6>F<\/h6>/, /<ul><li><p>a<\/p><ul><li><p>a\.1<\/p><ul><li><p>a\.1\.1<\/p>/, /<ol start="3"><li><p>trois<\/p><ol><li>/, /<blockquote><p>cite<\/p><\/blockquote>/]) assert.match(out, re);
    const pub = shown(src);
    assert.match(pub, /<h2 class="rt-h1"[^>]*>A<\/h2>/, "H1 du texte publié en H2 stylé : la page garde un seul H1 (le titre)");
    assert.match(pub, /<h6[^>]*>F<\/h6>/);
  });
  test("mise en forme : gras, italique, souligné, barré, exposant, indice, surlignage, couleur, alignement justifié", () => {
    const out = keep('<p style="text-align:justify"><strong>g</strong><em>i</em><u>u</u><s>s</s><sup>2</sup><sub>3</sub><mark style="background-color:#fff3a3">m</mark><span style="color:#cc1818">r</span></p>');
    for (const re of [/text-align:justify/, /<strong>g<\/strong>/, /<u>u<\/u>/, /<s>s<\/s>/, /<sup>2<\/sup>/, /<sub>3<\/sub>/, /<mark style="background-color:#fff3a3">m<\/mark>/, /<span style="color:#cc1818">r<\/span>/]) assert.match(out, re);
  });
  test("taille du texte : seulement Petit / Grand / Très grand (em) ; toute autre taille (collée de Word…) retirée", () => {
    assert.match(keep('<p><span style="font-size:1.25em">grand</span></p>'), /<span style="font-size:1\.25em">grand<\/span>/);
    assert.match(keep('<p><span style="font-size:0.875em">petit</span><span style="font-size:1.5em">tg</span></p>'), /font-size:0\.875em.*font-size:1\.5em/s);
    assert.doesNotMatch(keep('<p><span style="font-size:72px">énorme</span><span style="font-size:14pt">word</span></p>'), /font-size/);
    assert.match(shown('<p><span style="font-size:1.25em">grand</span></p>'), /font-size:1\.25em/, "affichée sur la page publique");
  });
  test("retrait des paragraphes et titres : niveaux 1 à 4 seulement", () => {
    assert.match(keep('<p data-indent="2">x</p><h3 data-indent="1">t</h3>'), /<p data-indent="2">x<\/p><h3 data-indent="1">t<\/h3>/);
    assert.doesNotMatch(keep('<p data-indent="9">x</p><p data-indent="1;color:red">y</p>'), /data-indent/);
    assert.match(shown('<p data-indent="3">x</p>'), /data-indent="3"/);
  });
  test("liens : https, interne, ancre, nouvel onglet (noopener ajouté), nofollow ; javascript: refusé", () => {
    const out = keep('<p><a href="https://k.fr" target="_blank" rel="nofollow">a</a><a href="/cours/x">b</a><a href="#partie">c</a><a href="javascript:alert(1)">d</a></p>');
    assert.match(out, /<a href="https:\/\/k\.fr" target="_blank" rel="nofollow noopener noreferrer">a<\/a>/);
    assert.match(out, /<a href="\/cours\/x">b<\/a>/);
    assert.match(out, /<a href="#partie">c<\/a>/);
    assert.doesNotMatch(out, /javascript/);
  });
  test("code en ligne et bloc de code : caractères spéciaux intacts ; tableau conservé", () => {
    const out = keep('<p><code>a&lt;b</code></p><pre><code>if (a &lt; b &amp;&amp; c &gt; d) { return "ok"; }</code></pre><table><tbody><tr><th><p>H</p></th></tr><tr><td><p>c</p></td></tr></tbody></table>');
    assert.match(out, /<code>a&lt;b<\/code>/);
    assert.match(out, /<pre><code>if \(a &lt; b &amp;&amp; c &gt; d\) \{ return "ok"; \}<\/code><\/pre>/);
    assert.match(out, /<table>.*<th><p>H<\/p><\/th>.*<td><p>c<\/p><\/td>/s);
  });
});
