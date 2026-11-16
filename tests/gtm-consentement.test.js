// Google Tag Manager (src/config/analytics.js, views/partials/gtm-head.ejs) : site principal seulement, en tête du <head>,
// chargé après l'accord du bandeau (kw_consent = 1) ; jamais dans Mon espace ; désactivable par GTM_ID=off.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

describe("Google Tag Manager", () => {
  let srv;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); });
  after(() => srv.stop());

  test("pages publiques : conteneur en tête du head, chargé seulement avec kw_consent=1, sans iframe noscript", async () => {
    for (const path of ["/", "/catalogue", "/blog"]) {
      const html = (await new Client(srv.base).get(path)).text;
      assert.match(html, /GTM-W4F3MRLQ/, path);
      assert.ok(html.indexOf("GTM-W4F3MRLQ") < html.indexOf("<title>"), `${path} : avant les balises SEO`);
      assert.match(html, /kw_consent=1/, `${path} : conditionné au consentement`);
      assert.match(html, /addEventListener\("kw:consent"/, `${path} : accord donné dans la page`);
      assert.doesNotMatch(html, /<script[^>]+src="https:\/\/www\.googletagmanager\.com/, `${path} : jamais chargé d'office`);
      assert.doesNotMatch(html, /<noscript><iframe[^>]+googletagmanager/, `${path} : pas d'iframe hors consentement`);
    }
  });

  test("jamais dans Mon espace (formateur, marketing)", async () => {
    const boss = await loginInstructor(srv);
    assert.doesNotMatch((await boss.get("/formateur")).text, /GTM-W4F3MRLQ/);
    assert.doesNotMatch((await boss.get("/marketing")).text, /GTM-W4F3MRLQ/);
  });

  test("visitor.js prévient la page du choix (événement kw:consent)", () => {
    const js = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "public", "js", "visitor.js"), "utf8");
    assert.match(js, /new CustomEvent\("kw:consent", \{ detail: \{ accepted: accept \} \}\)/);
  });
});

describe("Google Tag Manager désactivé (GTM_ID=off)", () => {
  let srv;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", GTM_ID: "off" }); });
  after(() => srv.stop());
  test("aucun conteneur sur les pages publiques", async () => {
    assert.doesNotMatch((await new Client(srv.base).get("/catalogue")).text, /googletagmanager|GTM-/);
  });
});
