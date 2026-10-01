// Étape 1 : rendu Markdown sûr. Le texte saisi par le formateur est transformé en HTML,
// mais aucune balise HTML saisie n'est jamais conservée : sûr par construction.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { renderMarkdown } = require("../src/utils/markdown");

describe("mise en forme", () => {
  test("paragraphes et retours à la ligne", () => {
    assert.equal(renderMarkdown("Bonjour\nle monde\n\nDeuxième bloc"), "<p>Bonjour<br>le monde</p>\n<p>Deuxième bloc</p>");
  });
  test("titres ## et ###", () => {
    assert.match(renderMarkdown("## Titre"), /<h3>Titre<\/h3>/);
    assert.match(renderMarkdown("### Sous-titre"), /<h4>Sous-titre<\/h4>/);
  });
  test("gras, italique et code en ligne", () => {
    assert.match(renderMarkdown("un **gras** et un *italique* et `code`"), /<strong>gras<\/strong>.*<em>italique<\/em>.*<code>code<\/code>/);
  });
  test("listes à puces et numérotées", () => {
    assert.equal(renderMarkdown("- un\n- deux"), "<ul><li>un</li><li>deux</li></ul>");
    assert.equal(renderMarkdown("1. un\n2. deux"), "<ol><li>un</li><li>deux</li></ol>");
  });
  test("citation", () => {
    assert.match(renderMarkdown("> à retenir"), /<blockquote>à retenir<\/blockquote>/);
  });
  test("liens https, mailto et internes : ouverts en sécurité", () => {
    const html = renderMarkdown("[site](https://exemple.com/page) et [mail](mailto:a@b.co) et [interne](/catalogue)");
    assert.match(html, /<a href="https:\/\/exemple\.com\/page" target="_blank" rel="noopener noreferrer nofollow">site<\/a>/);
    assert.match(html, /<a href="mailto:a@b\.co"/);
    assert.match(html, /<a href="\/catalogue">interne<\/a>/);
  });
  test("texte vide ou absent", () => {
    assert.equal(renderMarkdown(""), "");
    assert.equal(renderMarkdown(null), "");
    assert.equal(renderMarkdown(undefined), "");
  });
  test("le texte d'une formation existante (sans mise en forme) reste lisible", () => {
    assert.equal(renderMarkdown("Apprenez DaVinci Resolve pas à pas."), "<p>Apprenez DaVinci Resolve pas à pas.</p>");
  });
});

describe("sécurité : aucune balise saisie n'est conservée", () => {
  const attacks = [
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    "<iframe src=\"https://evil.example\"></iframe>",
    '<a href="javascript:alert(1)">clic</a>',
    "<svg onload=alert(1)>",
    "<style>body{display:none}</style>",
  ];
  for (const attack of attacks) {
    test(`neutralisé : ${attack.slice(0, 40)}`, () => {
      const html = renderMarkdown(attack);
      assert.doesNotMatch(html, /<(script|img|iframe|svg|style|a )/i, html);
      assert.match(html, /&lt;/);
    });
  }
  test("liens dangereux : javascript:, data:, vbscript: deviennent du simple texte", () => {
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", " javascript:alert(1)"]) {
      const html = renderMarkdown(`[clic](${bad})`);
      assert.doesNotMatch(html, /<a\b/i, `lien conservé pour ${bad} : ${html}`);
      assert.match(html, /clic/);
    }
  });
  test("une parenthèse ou un guillemet dans l'adresse ne casse pas l'attribut", () => {
    const html = renderMarkdown('[x](https://exemple.com/"onmouseover="alert(1))');
    assert.doesNotMatch(html, /<a\b[^>]*\sonmouseover=/i, "l'attribut ne doit pas pouvoir être fermé puis prolongé");
  });
  test("les images Markdown ne sont pas interprétées (pas de pistage par image externe)", () => {
    const html = renderMarkdown("![logo](https://evil.example/pixel.gif)");
    assert.doesNotMatch(html, /<img/i);
  });
  test("le gras ne peut pas sortir de sa balise", () => {
    const html = renderMarkdown("**<b onclick=alert(1)>x</b>**");
    assert.doesNotMatch(html, /<b[\s>]/i, "aucune balise <b> active");
  });
  test("un long texte ne bloque pas le serveur (pas d'explosion de calcul)", () => {
    const t0 = Date.now();
    renderMarkdown("*".repeat(50000) + "\n" + "[".repeat(20000) + "**a".repeat(10000));
    assert.ok(Date.now() - t0 < 1000, "trop lent");
  });
});
