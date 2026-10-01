// Pop-ups — côté public : /f/popup.json (interrogé par public/js/popup.js), soumission en mode AJAX (X-Mk-Popup),
// jamais de redirection de page (le pop-up doit rester sur la page en cours).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("pop-up public", () => {
  let srv, boss;
  const run = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).run(...args); db.close(); return r; };
  const one = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).get(...args); db.close(); return r; };
  const postPopup = (path, body) => new Client(srv.base).request(path, { method: "POST", form: body, headers: { "x-mk-popup": "1" } });

  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("/f/popup.json : aucun pop-up configuré → { form: null }", async () => {
    const res = await new Client(srv.base).get("/f/popup.json");
    assert.equal(res.status, 200);
    assert.deepEqual(JSON.parse(res.text), { form: null });
  });

  let slug;
  test("un formulaire publié SANS le pop-up activé n'apparaît pas dans /f/popup.json", async () => {
    await boss.post("/marketing/formulaires", { name: "Juste une page", consentText: "Oui, je veux." });
    const id = one("SELECT id FROM mk_forms WHERE name = 'Juste une page'").id;
    await boss.post(`/marketing/formulaires/${id}/publier`);
    assert.deepEqual(JSON.parse((await new Client(srv.base).get("/f/popup.json")).text), { form: null });
  });

  test("un formulaire publié AVEC le pop-up activé apparaît, avec ses réglages", async () => {
    await boss.post("/marketing/formulaires", { name: "Pop-up du site", consentText: "Oui, prévenez-moi." });
    const id = one("SELECT id FROM mk_forms WHERE name = 'Pop-up du site'").id;
    await boss.postJson(`/marketing/formulaires/${id}`, { name: "Pop-up du site", consentText: "Oui, prévenez-moi.", fields: ["first_name"], popupEnabled: "1", popupTrigger: "scroll", popupTriggerValue: 30, popupFrequencyDays: 3 });
    await boss.post(`/marketing/formulaires/${id}/publier`);
    slug = one("SELECT slug FROM mk_forms WHERE id = ?", id).slug;
    const body = JSON.parse((await new Client(srv.base).get("/f/popup.json")).text);
    assert.equal(body.form.slug, slug);
    assert.equal(body.form.trigger, "scroll");
    assert.equal(body.form.triggerValue, 30);
    assert.equal(body.form.frequencyDays, 3);
    assert.deepEqual(body.form.fields, [{ key: "first_name", label: "Prénom" }]);
  });

  test("soumission en mode pop-up : réponse JSON, jamais une redirection", async () => {
    const res = await postPopup(`/f/${slug}`, { email: "popup@ex.fr", consent: "1" });
    assert.equal(res.status, 200);
    const body = JSON.parse(res.text);
    assert.equal(body.ok, true);
    assert.equal(one("SELECT status FROM mk_contacts WHERE email = 'popup@ex.fr'").status, "subscribed");
  });

  test("mode pop-up, sans case cochée : erreur JSON avec un message, pas de page HTML", async () => {
    const res = await postPopup(`/f/${slug}`, { email: "sans-case-popup@ex.fr" });
    assert.equal(res.status, 400);
    const body = JSON.parse(res.text);
    assert.equal(body.ok, false);
    assert.match(body.error, /Cochez la case/);
  });

  test("mode pop-up, champ piège rempli : faux succès JSON silencieux, aucun contact créé", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_contacts").n;
    const res = await postPopup(`/f/${slug}`, { email: "robot-popup@ex.fr", consent: "1", website: "http://spam.io" });
    assert.equal(res.status, 200);
    assert.equal(JSON.parse(res.text).ok, true);
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts").n, before);
  });

  test("mode page normale (sans l'en-tête) : toujours une redirection, comportement inchangé", async () => {
    const res = await new Client(srv.base).post(`/f/${slug}`, { email: "page-normale@ex.fr", consent: "1" });
    assert.equal(res.status, 302);
  });
});
