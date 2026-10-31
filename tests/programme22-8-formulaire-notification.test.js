// Parité Elementor (lot 3) : e-mail de notification de l'équipe à chaque envoi d'un formulaire.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("notification d'envoi de formulaire", () => {
  let srv, boss, id, slug;
  const one = (q, ...a) => { const db = srv.db(); const r = db.prepare(q).get(...a); db.close(); return r; };
  const run = (q, ...a) => { const db = srv.db(); db.prepare(q).run(...a); db.close(); };
  const sendOne = (email) => new Client(srv.base).post(`/f/${slug}`, { ft: srv.formToken(), email, consent: "1" });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    await boss.post("/marketing/formulaires", { name: "Contact notifié", consentText: "Oui, je veux être contacté." });
    id = one("SELECT id FROM mk_forms WHERE name = 'Contact notifié'").id;
    slug = one("SELECT slug FROM mk_forms WHERE id = ?", id).slug;
    run("UPDATE mk_forms SET double_optin = 0 WHERE id = ?", id);
    await boss.post(`/marketing/formulaires/${id}/publier`);
  });
  after(() => srv.stop());

  const save = (notifyEmail) => boss.post(`/marketing/formulaires/${id}`, { name: "Contact notifié", consentText: "Oui, je veux être contacté.", notifyShown: "1", notifyEmail });

  test("par défaut : aucune notification", async () => {
    await sendOne("a1@ex.fr");
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'form_notification'").n, 0);
  });

  test("adresse invalide ou multiple refusée ; valide enregistrée", async () => {
    await save("a@b.fr, c@d.fr");
    assert.equal(one("SELECT notify_email e FROM mk_forms WHERE id = ?", id).e, "");
    await save("Equipe@Exemple.com");
    assert.equal(one("SELECT notify_email e FROM mk_forms WHERE id = ?", id).e, "equipe@exemple.com");
  });

  test("un envoi déclenche UN e-mail à l'équipe, avec l'adresse du visiteur", async () => {
    await sendOne("visiteur@ex.fr");
    const rows = (() => { const db = srv.db(); const r = db.prepare("SELECT to_email, subject FROM mail_outbox WHERE kind = 'form_notification'").all(); db.close(); return r; })();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].to_email, "equipe@exemple.com");
    assert.match(rows[0].subject, /Contact notifié/);
  });

  test("un robot (champ piège rempli) ne déclenche aucune notification", async () => {
    await new Client(srv.base).post(`/f/${slug}`, { ft: srv.formToken(), email: "bot@ex.fr", consent: "1", website: "http://spam" });
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE kind = 'form_notification'").n, 1);
  });

  test("effacer l'adresse désactive la notification", async () => {
    await save("");
    assert.equal(one("SELECT notify_email e FROM mk_forms WHERE id = ?", id).e, "");
  });
});
