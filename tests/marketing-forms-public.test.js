// Page publique d'un formulaire (/f/:slug) : soumission réelle, champ piège, limite de débit, case de consentement
// revérifiée côté serveur, page de remerciement, compteurs de vues/inscriptions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("page publique d'un formulaire", () => {
  let srv, boss, slug;
  const run = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).run(...args); db.close(); return r; };
  const one = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).get(...args); db.close(); return r; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    await boss.post("/marketing/formulaires", { name: "Newsletter publique", consentText: "Oui, je veux recevoir les actualités." });
    const id = one("SELECT id FROM mk_forms WHERE name = 'Newsletter publique'").id;
    slug = one("SELECT slug FROM mk_forms WHERE id = ?", id).slug;
    // Ces tests vérifient l'inscription IMMÉDIATE : double confirmation désactivée (activée par défaut à la création,
    // testée dans tests/emails.test.js)
    { const db = srv.db(); db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(id); db.close(); }
    await boss.post(`/marketing/formulaires/${id}/publier`);
  });
  after(() => srv.stop());

  test("un formulaire inconnu répond 404", async () => {
    assert.equal((await new Client(srv.base).get("/f/inconnu")).status, 404);
  });

  test("la page publique s'affiche, avec le champ piège caché et le texte de consentement", async () => {
    const html = (await new Client(srv.base).get(`/f/${slug}`)).text;
    assert.match(html, /Newsletter publique/);
    assert.match(html, /Oui, je veux recevoir les actualités\./);
    assert.match(html, /name="website"[^>]*tabindex="-1"/);
    assert.equal(one("SELECT view_count FROM mk_forms WHERE slug = ?", slug).view_count, 1);
  });

  test("soumission sans cocher la case de consentement : refusée (revérifié côté serveur, pas seulement par le navigateur)", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_contacts").n;
    const res = await new Client(srv.base).post(`/f/${slug}`, { ft: srv.formToken(), email: "sans-case@ex.fr" });
    assert.equal(res.status, 400);
    assert.match(res.text, /Cochez la case/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts").n, before, "aucun contact ne doit être créé sans consentement coché");
  });

  test("soumission complète : contact créé, redirection vers la page de remerciement", async () => {
    const c = new Client(srv.base);
    const res = await c.post(`/f/${slug}`, { ft: srv.formToken(), email: "visiteur@ex.fr", consent: "1" });
    assert.equal(res.status, 302);
    assert.match(res.location, new RegExp(`/f/${slug}\\?envoye=1`));
    const contact = one("SELECT status FROM mk_contacts WHERE email = 'visiteur@ex.fr'");
    assert.equal(contact.status, "subscribed");
    const thanks = (await c.get(res.location)).text;
    assert.match(thanks, /Merci/);
    // Le site a sa propre barre de recherche en <form> dans l'en-tête : on vérifie l'absence du formulaire D'INSCRIPTION précisément, pas de n'importe quel <form>
    assert.doesNotMatch(thanks, new RegExp(`action="/f/${slug}"`), "la page de remerciement ne réaffiche pas le formulaire d'inscription");
  });

  test("la page de remerciement n'incrémente pas le compteur de vues (ce n'est pas une nouvelle visite du formulaire)", async () => {
    const before = one("SELECT view_count FROM mk_forms WHERE slug = ?", slug).view_count;
    await new Client(srv.base).get(`/f/${slug}?envoye=1`);
    assert.equal(one("SELECT view_count FROM mk_forms WHERE slug = ?", slug).view_count, before);
  });

  test("champ piège rempli (robot) : faux succès silencieux, aucun contact créé", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_contacts").n;
    const res = await new Client(srv.base).post(`/f/${slug}`, { ft: srv.formToken(), email: "robot@spam.io", consent: "1", website: "http://spam.io" });
    assert.equal(res.status, 302); // redirige comme un succès, pour ne pas renseigner le robot
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts").n, before);
  });

  test("un formulaire dépublié redevient introuvable", async () => {
    const id = one("SELECT id FROM mk_forms WHERE slug = ?", slug).id;
    await boss.post(`/marketing/formulaires/${id}/depublier`);
    assert.equal((await new Client(srv.base).get(`/f/${slug}`)).status, 404);
    await boss.post(`/marketing/formulaires/${id}/publier`); // remis en place pour la suite des tests
  });

  test("plafond : 5 soumissions par heure et par IP, la 6e est refusée", async () => {
    let last;
    for (let i = 0; i < 6; i++) last = await new Client(srv.base).post(`/f/${slug}`, { ft: srv.formToken(), email: `plafond${i}@ex.fr`, consent: "1" });
    assert.equal(last.status, 429);
  });
});
