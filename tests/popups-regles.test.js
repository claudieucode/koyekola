// Pop-ups à règles combinées (Site Web, phase 5b) : plusieurs pop-ups actifs, pages incluses / exclues, appareil,
// pages vues, provenance, personnes connectées, contacts déjà abonnés. Le serveur applique les règles qu'il connaît
// (page, compte, abonnement) ; le navigateur, celles de l'onglet (appareil, pages vues, provenance).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const fields = require("../src/marketing/forms/fields");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("règles (sans serveur)", () => {
  test("normalisation : pages valides seulement, appareil unique, pages vues bornées, provenance nettoyée", () => {
    assert.deepEqual(fields.normalizePopupRules({ pagesMode: "include", paths: "/blog\n/cours/photo*", devices: ["mobile"], minPages: "3", utmSource: " Facebook ", hideForStudents: "1" }),
      { pages: { mode: "include", paths: ["/blog", "/cours/photo*"] }, devices: ["mobile"], minPages: 3, utmSource: "Facebook", hideForStudents: true });
    assert.throws(() => fields.normalizePopupRules({ pagesMode: "include", paths: "" }), /au moins une page/);
    assert.throws(() => fields.normalizePopupRules({ pagesMode: "exclude", paths: "https://autre.site/page" }), /n'est pas une page du site/);
    assert.deepEqual(fields.normalizePopupRules({ devices: ["desktop", "mobile"], minPages: 99, referrer: '<script>' }), { referrer: "script" }, "deux appareils = tous ; valeurs hors bornes ignorées");
  });
  test("pages : incluses, exclues, préfixe « * »", () => {
    const inc = { pages: { mode: "include", paths: ["/blog", "/cours/photo*"] } };
    assert.equal(fields.pageMatches(inc, "/blog"), true);
    assert.equal(fields.pageMatches(inc, "/blog/article"), false, "sans « * », adresse exacte");
    assert.equal(fields.pageMatches(inc, "/cours/photoshop-debutant"), true);
    assert.equal(fields.pageMatches({ pages: { mode: "exclude", paths: ["/panier*"] } }, "/panier"), false);
    assert.equal(fields.pageMatches({}, "/n-importe"), true);
  });
});

describe("pop-ups (vrai serveur)", () => {
  let srv, boss, db;
  const popupJson = (client, page) => client.get(`/f/popup.json?page=${encodeURIComponent(page)}`).then((r) => JSON.parse(r.text));
  const makePopup = async (name, rules) => {
    const r = await boss.post("/marketing/formulaires", { name, consentText: `Oui, je veux recevoir ${name}.` });
    const id = Number(r.location.match(/(\d+)$/)[1]);
    await boss.post(`/marketing/formulaires/${id}`, { name, consentText: `Oui, je veux recevoir ${name}.`, popupEnabled: "1", popupTrigger: "delay", popupTriggerValue: "3", popupFrequencyDays: "7", tags: "", redirectUrl: "", rulesShown: "1", ...rules });
    await boss.post(`/marketing/formulaires/${id}/publier`, {});
    return db.prepare("SELECT slug FROM mk_forms WHERE id = ?").get(id).slug;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
  });
  after(() => srv.stop());

  test("plusieurs pop-ups ; la page décide lesquels sont proposés ; le plus récent en premier", async () => {
    const general = await makePopup("Lettre générale", { "rules[pagesMode]": "exclude", "rules[paths]": "/panier*\n/commande*" });
    const photo = await makePopup("Guide Photoshop", { "rules[pagesMode]": "include", "rules[paths]": "/cours/photoshop*\n/blog", "rules[devices]": "mobile", "rules[minPages]": "2", "rules[utmSource]": "facebook" });
    const anon = new Client(srv.base);
    let r = await popupJson(anon, "/cours/photoshop-avance");
    assert.deepEqual(r.forms.map((f) => f.slug), [photo, general]);
    assert.equal(r.form.slug, photo, "compatibilité : « form » = le premier");
    assert.deepEqual(r.forms[0].rules, { devices: ["mobile"], minPages: 2, utmSource: "facebook", utmCampaign: null, referrer: null, hideIfSubscribed: false }, "règles de l'onglet transmises au navigateur");
    r = await popupJson(anon, "/catalogue");
    assert.deepEqual(r.forms.map((f) => f.slug), [general]);
    r = await popupJson(anon, "/panier");
    assert.deepEqual(r.forms, [], "page exclue : aucun pop-up");
    assert.equal((await popupJson(anon, "javascript:alert(1)")).forms.length, 1, "adresse invalide : traitée comme l'accueil");
  });

  test("personnes connectées et contacts abonnés : écartés par le serveur quand la règle est cochée", async () => {
    await makePopup("Réservé aux visiteurs", { "rules[hideForStudents]": "1", "rules[hideIfSubscribed]": "1" });
    const student = await newStudent(srv);
    const names = (r) => r.forms.map((f) => f.name);
    assert.ok(names(await popupJson(new Client(srv.base), "/")).includes("Réservé aux visiteurs"));
    assert.ok(!names(await popupJson(student, "/")).includes("Réservé aux visiteurs"), "connecté");
    // Règle « déjà abonné » seule : un compte connecté dont le contact est abonné ne le voit plus
    const id = db.prepare("SELECT id FROM mk_forms WHERE name = 'Réservé aux visiteurs'").get().id;
    await boss.post(`/marketing/formulaires/${id}`, { name: "Réservé aux visiteurs", consentText: "Oui, je veux recevoir Réservé aux visiteurs.", popupEnabled: "1", popupTrigger: "delay", popupTriggerValue: "3", popupFrequencyDays: "7", tags: "", redirectUrl: "", rulesShown: "1", "rules[hideIfSubscribed]": "1" });
    assert.ok(names(await popupJson(student, "/")).includes("Réservé aux visiteurs"), "connecté mais pas abonné : visible");
    db.prepare("UPDATE mk_contacts SET status = 'subscribed' WHERE email = ?").run(student.email);
    assert.ok(!names(await popupJson(student, "/")).includes("Réservé aux visiteurs"), "abonné : masqué");
  });

  test("configuration : règles enregistrées et réaffichées ; erreur claire pour une page invalide", async () => {
    const id = db.prepare("SELECT id FROM mk_forms WHERE name = 'Guide Photoshop'").get().id;
    const html = (await boss.get(`/marketing/formulaires/${id}`)).text;
    assert.match(html, /<option value="include" selected>Seulement ces pages/);
    assert.match(html, />\/cours\/photoshop\*\n\/blog<\/textarea>/);
    assert.match(html, /<option value="mobile" selected>/);
    const r = await boss.post(`/marketing/formulaires/${id}`, { name: "Guide Photoshop", consentText: "Oui, je veux recevoir Guide Photoshop.", popupEnabled: "1", tags: "", redirectUrl: "", rulesShown: "1", "rules[pagesMode]": "include", "rules[paths]": "pas-une-page" });
    assert.match((await boss.get(r.location)).text, /n&#39;est pas une page du site|n'est pas une page du site/);
  });
});
