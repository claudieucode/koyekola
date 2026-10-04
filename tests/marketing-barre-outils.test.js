// Barre d'outils contextuelle de l'éditeur d'e-mails : registre complet (un jeu d'outils par type de bloc), module chargé
// avant l'éditeur, icônes fournies ; le HTML produit par l'écriture directe dans l'e-mail est nettoyé par le serveur
// avant tout rendu (canevas, aperçu, test, envoi). Le comportement réel est vérifié dans un navigateur (protocole tb2.js).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { compileTemplate, renderEmail, TYPES } = require("../src/marketing/templates/blocks");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

const ROOT = path.join(__dirname, "..");

describe("registre des barres d'outils", () => {
  test("chaque type de bloc a ses outils (ou les outils communs), plus la barre « aucun bloc »", () => {
    const sandbox = { window: {}, document: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, "public/js/mk/toolbar.js"), "utf8"), sandbox);
    const reg = sandbox.window.MkToolbar.registry;
    for (const t of ["__none", "__generic", "text", "heading", "image", "button", "divider", "spacer", "video", "social", "columns"]) assert.equal(typeof reg[t], "function", t);
    for (const t of TYPES) assert.ok(reg[t] || reg.__generic, `type ${t} : outils disponibles`);
  });
  test("les commandes de texte passent par l'éditeur (historique, enregistrement) : aucun état parallèle", () => {
    const src = fs.readFileSync(path.join(ROOT, "public/js/marketing-editor.js"), "utf8");
    assert.match(src, /function syncInline\(\)[\s\S]*importRich\(inline\.box, tmp\)[\s\S]*changed\(\)/);
    assert.match(src, /record\(inlineTyping && inline \? "inline-" \+ inline\.id/);
    assert.match(src, /blockChanged: function \(opts\) \{ changed\(opts && opts\.structural\); renderProps\(\); \}/);
  });
});

describe("HTML de l'écriture directe : nettoyé pour l'e-mail", () => {
  const ALLOW = (p) => /^(contact\.first_name|org\.(name|address)|unsubscribe_url|preferences_url|view_url)$/.test(p);
  test("balises du navigateur (b, i, strike, div, font) → balises d'e-mail ; styles permis gardés ; dangereux retirés", () => {
    const raw = '<p><b>gras</b> <i>ita</i> <u>sou</u> <strike>bar</strike> <span style="font-size: 24px;">grand</span> <span style="color: rgb(209, 18, 31); background-color: rgb(255, 243, 160);">couleur</span></p>'
      + '<p style="margin-left: 24px; text-align: center;">retrait</p><div>bloc div</div><h2>Titre</h2><ul><li>un</li></ul>'
      + '<p onclick="x()"><a href="javascript:alert(1)">j</a> <a href="https://ok.fr" target="_blank">ok</a> {{contact.first_name}}<img src=x onerror=alert(1)><script>alert(1)</script></p>';
    const c = compileTemplate({ kind: "marketing", subject: "S", blocks: [{ id: "t", type: "text", html: raw }] }, { allowed: ALLOW });
    const html = renderEmail(c, { contact: { first_name: "Awa" }, org: { name: "K" }, unsubscribe_url: "https://u" }).html;
    for (const re of [/<strong style="font-weight:700">gras<\/strong>/, /<em style="font-style:italic">ita<\/em>/, /<u[^>]*>sou<\/u>/, /<s style="text-decoration:line-through">bar<\/s>/, /font-size:24px">grand/, /color:#d1121f|color:rgb\(209, 18, 31\)/, /margin-left:24px/, /text-align:center/, /<h2 style/, /<ul style/, /<a href="https:\/\/ok\.fr" target="_blank"/, /Awa/]) assert.match(html, re);
    assert.doesNotMatch(html, /onclick|onerror|<script|javascript:|<img src="x"|<b>|<i>|<strike>|<font/);
  });
});

describe("page de l'éditeur", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv && srv.stop());
  test("barre présente au-dessus du canevas, module chargé avant l'éditeur, icônes des outils fournies", async () => {
    const r = await boss.post("/marketing/modeles", { name: "B", starter: "blank", kind: "marketing" });
    const html = (await boss.get(r.location)).text;
    assert.match(html, /<div class="mk-ctxbar" id="mk-ctxbar" role="toolbar"[^>]*><\/div>\s*<main class="mk-b-stage"/);
    assert.ok(html.indexOf("/js/mk/toolbar.js") < html.indexOf("/js/marketing-editor.js"));
    const data = JSON.parse(html.match(/<script type="application\/json" id="mk-editor-data">([\s\S]*?)<\/script>/)[1]);
    for (const name of ["alignLeft", "alignCenter", "alignRight", "alignJustify", "listOrdered", "indentMore", "indentLess", "highlighter", "clearFormat", "borderBox", "spacing", "link", "type"]) assert.ok(data.icons[name], name);
  });
});
