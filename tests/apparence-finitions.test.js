// KOLAKISA CMS — Apparence : finitions d'accessibilité et d'indépendance vis-à-vis du thème de l'administration (mission TITAN XIII).
// Garde-fous : onglets dont aria-controls désigne un panneau existant,
// et l'exemple de page de « Styles » qui montre les couleurs du SITE (jamais celles du thème clair/sombre de l'administration).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const CSS = fs.readFileSync(path.join(__dirname, "..", "public", "css", "kola-compose.css"), "utf8");

describe("apparence : finitions", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv && srv.stop());

  test("Styles et Éditeur du site : le panneau désigné par aria-controls des onglets existe", async () => {
    const st = (await boss.get("/marketing/site-web/styles")).text;
    assert.match(st, /id="st-body"[^>]*role="tabpanel"|role="tabpanel"[^>]*id="st-body"/);
    const se = (await boss.get("/marketing/site-web/editeur-du-site")).text;
    assert.match(se, /id="se-rail"[^>]*role="tabpanel"|role="tabpanel"[^>]*id="se-rail"/);
  });
  test("Styles : les liens et libellés de l'exemple suivent les jetons du site, quel que soit le thème de l'administration", () => {
    assert.match(CSS, /\.mk-st-guide \.g-page :is\(p, li, div\) a\.g-link:not\(\.btn\) \{ color: var\(--g-link\)/);
    assert.match(CSS, /\.mk-st-guide \.g-page label[^{]*\{ color: var\(--g-text\)/);
  });
});
