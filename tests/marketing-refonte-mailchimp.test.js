// Refonte de l'interface marketing « façon Mailchimp » (palette bleue conservée) : bouton « Créer » unique dans le
// menu latéral, filtré selon les droits ; menu latéral clair ; restylage limité à l'espace marketing.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const createMenu = (html) => /<div class="mk-menu mk-create-menu" id="mk-create-menu" role="menu" hidden>([\s\S]*?)<\/div>/.exec(html)?.[1] ?? null;
const MK_CSS = fs.readFileSync(path.join(__dirname, "..", "public", "css", "marketing.css"), "utf8");

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("bouton « Créer »", () => {
  test("administrateur : toutes les créations, chacune vers son écran existant", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /<button type="button" class="mk-create-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="mk-create-menu"/);
    const menu = createMenu(html);
    for (const href of ["/marketing/campagnes/nouvelle", "/marketing/modeles#creer", "/marketing/automatisations#nouveau", "/marketing/formulaires#nouveau", "/marketing/contacts/nouveau", "/marketing/importer", "/marketing/listes#nouvelle", "/marketing/segments/nouveau"]) {
      assert.match(menu, new RegExp(`<a role="menuitem" href="${href.replace(/[/#]/g, "\\$&")}">`), href);
    }
  });
  test("présent sur chaque page de l'espace", async () => {
    for (const url of ["/marketing/contacts", "/marketing/campagnes", "/marketing/analytics"]) assert.ok(createMenu((await boss.get(url)).text), url);
  });
  test("lecteur (aucun droit d'écriture) : pas de bouton « Créer »", async () => {
    const v = await member("viewer");
    const html = (await v.get("/marketing")).text;
    assert.equal(createMenu(html), null);
    assert.doesNotMatch(html, /mk-create-btn/);
  });
});

describe("feuille de style de l'espace marketing", () => {
  test("menu latéral clair (plus de fond bleu nuit), filet à droite", () => {
    const rule = /\.mk-sidebar \{([^}]*)\}/.exec(MK_CSS)[1];
    assert.match(rule, /background: var\(--mk-surface\)/);
    assert.match(rule, /border-right: 1px solid var\(--mk-border\)/);
  });
  test("onglets soulignés (plus de bloc plein)", () => {
    assert.match(MK_CSS, /\.mk-tab\[aria-selected="true"\], \.mk-tab\[aria-current="page"\] \{[^}]*border-bottom-color: var\(--accent\)/);
  });
  test("composants partagés du site restylés UNIQUEMENT sous .mk-body (site public intact)", () => {
    for (const sel of [".mk-panel", ".mk-table-wrap", ".btn-primary", ".mk-head h1"]) {
      assert.match(MK_CSS, new RegExp(`\\.mk-body ${sel.replace(/[.[\]]/g, "\\$&")} \\{`), sel);
    }
    assert.doesNotMatch(MK_CSS, /^\.btn(-primary|-outline)? \{/m, "aucune règle de bouton globale dans marketing.css");
  });
});
