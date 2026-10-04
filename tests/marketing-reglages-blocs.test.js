// Réglages des blocs, système unifié : typographie des citations, listes et liens (rendu réel, mobile compris),
// blocs existants inchangés, réenregistrement à l'identique ; un seul jeu de contrôles côté éditeur.
// Le fonctionnement dans l'éditeur (chaque bloc, chaque réglage) est vérifié dans un navigateur (protocole fx1.js).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { compileTemplate, renderEmail } = require("../src/marketing/templates/blocks");

const A = () => true;
const CTX = { org: { name: "K", address: "" }, unsubscribe_url: "https://u.test" };
const build = (blocks) => { const c = compileTemplate({ kind: "marketing", subject: "S", blocks }, { allowed: A }); return { c, html: renderEmail(c, CTX).html }; };

describe("typographie des citations, listes et liens", () => {
  test("blocs existants : HTML strictement inchangé (aucune enveloppe ni style ajoutés)", () => {
    const { html } = build([{ id: "q", type: "quote", text: "Q", author: "A" }, { id: "l", type: "list", items: ["a"] }, { id: "k", type: "link", label: "L", url: "https://x.fr" }]);
    assert.match(html, /<td style="border-left:4px solid #0277b6;padding:8px 0 8px 16px;font-size:18px;line-height:1.5;font-style:italic;color:#10222f">“Q”/);
    assert.match(html, /<tr><td style="[^"]*"><ul style="margin:0;padding-left:24px">/);
    assert.match(html, /<p style="margin:0;text-align:left"><a href="https:\/\/x.fr" style="color:#0277b6;font-weight:700;text-decoration:underline">L<\/a><\/p>/);
  });
  test("réglages appliqués en ligne (ordinateur, Outlook compris) et réenregistrés à l'identique", () => {
    const blocks = [
      { id: "q", type: "quote", text: "Q", font: "serif", fontSize: 24, lineHeight: 1.8, color: "#333333", italic: false, weight: "bold", letterSpacing: 1, align: "center" },
      { id: "l", type: "list", items: ["a"], style: "numbers", font: "arial", fontSize: 18, color: "#0b3954", align: "right", italic: true },
      { id: "k", type: "link", label: "L", url: "https://x.fr", fontSize: 20, color: "#aa0000", weight: "normal", italic: true, letterSpacing: 2 },
    ];
    const { c, html } = build(blocks);
    assert.match(html, /font-size:24px;line-height:1.8;font-style:normal;color:#333333;font-family:Georgia[^;]*;font-weight:700;letter-spacing:1px;text-align:center">“Q”/);
    assert.match(html, /<div style="font-family:Arial[^;]*;font-size:18px;color:#0b3954;font-style:italic;text-align:right"><ol/);
    assert.match(html, /<p style="margin:0;text-align:left;font-size:20px"><a href="https:\/\/x.fr" style="color:#aa0000;font-weight:400;font-style:italic;letter-spacing:2px;text-decoration:underline">/);
    const again = compileTemplate({ kind: "marketing", subject: "S", blocks: c.normalized.blocks }, { allowed: A });
    assert.deepEqual(again.normalized.blocks, c.normalized.blocks);
    assert.equal(c.normalized.blocks[0].italic, false, "italique désactivé d'une citation conservé");
  });
  test("mobile : taille et alignement (citation, liste, lien) dans la requête média ; limites contrôlées", () => {
    const { html } = build([{ id: "q", type: "quote", text: "Q", mobile: { fontSize: 16, align: "left" } }, { id: "l", type: "list", items: ["a"], mobile: { fontSize: 14 } }, { id: "k", type: "link", label: "L", url: "https://x.fr", mobile: { fontSize: 15, align: "center" } }]);
    const mq = html.match(/<style>@media[^<]*<\/style>/)[0];
    for (const r of [".mkf-q{font-size:16px!important}", ".mkf-q{text-align:left!important}", ".mkf-l{font-size:14px!important}", ".mkf-k{font-size:15px!important}", ".mkf-k{text-align:center!important}"]) assert.ok(mq.includes(r), r);
    assert.match(html, /<td class="mkf-q" style=/);
    assert.match(html, /<div class="mkf-l"><ul/);
    assert.throws(() => build([{ id: "q", type: "quote", text: "Q", fontSize: 40 }]), /12 à 32/);
    assert.throws(() => build([{ id: "l", type: "list", items: ["a"], mobile: { width: 100 } }]), /non applicable/);
  });
});

describe("éditeur : un seul système de contrôles", () => {
  const editor = fs.readFileSync(path.join(__dirname, "../public/js/marketing-editor.js"), "utf8");
  test("contrôles communs (fields.js) ; anciens contrôles propres à chaque bloc retirés", () => {
    const sandbox = { window: {}, document: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../public/js/mk/fields.js"), "utf8"), sandbox);
    const F = sandbox.window.MkFields.create({ el: () => ({}), iconSpan: () => ({}), changed() {}, rerender() {}, announce() {}, theme: () => ({}), fonts: () => [], fontLabel: (k) => k, readOnly: false });
    for (const k of ["section", "field", "text", "number", "select", "segment", "toggle", "color", "spacing", "border", "typography"]) assert.equal(typeof F[k], "function", k);
    for (const old of ["function optColorField(", "function colorField(", "function optNumberField(", "function fontField(", "function lineHeightField(", "function selectField(", "function numberField(", "function checkField(", "function textField("]) assert.ok(!editor.includes(old), old);
  });
  test("chaque type de bloc a son contenu et ses styles ; onglets Contenu / Styles / Visibilité / Avancé", () => {
    assert.match(editor, /\["content", "Contenu"\], \["styles", "Styles"\], \["visibility", "Visibilité"\], \["advanced", "Avancé"\]/);
    for (const t of ["heading", "text", "image", "button", "spacer", "columns", "divider", "quote", "list", "social", "video", "course", "link", "coupon"]) assert.ok(editor.includes(`t === "${t}"`), t);
    for (const s of ['"Espacement intérieur"', '"Fond"', '"Bordure du bloc"', '"Typographie"']) assert.ok(editor.includes(s), s);
  });
});
