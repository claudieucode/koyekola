// Formulaires, suite (backlog §35) — propriétés personnalisées comme champs, étiquettes posées à l'inscription,
// redirection après inscription. Réutilise l'existant (Propriétés, Étiquettes) : aucun système parallèle.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss, formId, slug;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
// Les tableaux doivent partir en champs répétés (propertyFields=a&propertyFields=b), pas joints par une virgule
const pairs = (obj) => Object.entries(obj).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]));
const save = (extra = {}) => boss.post(`/marketing/formulaires/${formId}`, pairs({ name: "Newsletter", consentText: "J'accepte de recevoir la lettre.", ...extra }));
// Une adresse IP différente par inscription publique (en-tête du mandataire, que le serveur prend en compte) :
// la limite de 5 inscriptions par heure et par IP reste intacte, mais ne bloque pas une série de tests.
let ipSeq = 0;
const publicPost = (form, headers = {}) => new Client(srv.base).request(`/f/${slug}`, { method: "POST", form: { ft: srv.formToken(), ...form }, headers: { "x-forwarded-for": `10.9.0.${++ipSeq}`, ...headers } });
const flashOf = async (res) => (await boss.get(res.location)).text;
const contact = (email) => sql("SELECT * FROM mk_contacts WHERE email = ?", email)[0];
const propsOf = (email) => Object.fromEntries(sql(
  "SELECT d.key, COALESCE(v.value_text, v.value_number, v.value_date, v.value_boolean) AS v FROM mk_contact_property_values v JOIN mk_property_defs d ON d.id = v.property_id JOIN mk_contacts c ON c.id = v.contact_id WHERE c.email = ?", email).map((r) => [r.key, r.v]));
const tagsOf = (email) => sql("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id JOIN mk_contacts c ON c.id = ct.contact_id WHERE c.email = ? ORDER BY t.name", email).map((r) => r.name);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test" });
  boss = await loginInstructor(srv);
  for (const [key, label, type, options] of [["ville", "Ville", "text", "[]"], ["age", "Âge", "number", "[]"], ["naissance", "Date de naissance", "date", "[]"], ["pro", "Vous êtes formateur", "boolean", "[]"], ["niveau", "Niveau", "select", JSON.stringify(["Débutant", "Confirmé"])]]) {
    run("INSERT INTO mk_property_defs (organization_id, key, label, type, options) VALUES (1, ?, ?, ?, ?)", key, label, type, options);
  }
  const res = await boss.post("/marketing/formulaires", { name: "Newsletter", consentText: "J'accepte de recevoir la lettre." });
  formId = Number(res.location.match(/(\d+)$/)[1]);
  slug = sql("SELECT slug FROM mk_forms WHERE id = ?", formId)[0].slug;
  run("UPDATE mk_forms SET double_optin = 0 WHERE id = ?", formId); // inscription immédiate (double confirmation : tests/emails.test.js)
  await boss.post(`/marketing/formulaires/${formId}/publier`, {});
});
after(() => srv.stop());

describe("configuration (espace marketing)", () => {
  test("la page propose les propriétés existantes, les étiquettes et la redirection", async () => {
    const html = (await boss.get(`/marketing/formulaires/${formId}`)).text;
    for (const key of ["ville", "age", "naissance", "pro", "niveau"]) assert.match(html, new RegExp(`name="propertyFields" value="${key}"`), key);
    assert.match(html, /name="tags"/);
    assert.match(html, /name="redirectUrl"/);
  });
  test("enregistrement : propriétés, étiquettes (dédoublonnées), redirection", async () => {
    const r = await save({ propertyFields: ["ville", "niveau", "naissance", "pro", "age"], tags: "Newsletter, VIP ,newsletter", redirectUrl: "https://exemple.fr/merci" });
    assert.match(await flashOf(r), /Formulaire enregistré/);
    const row = sql("SELECT property_fields, tags, redirect_url FROM mk_forms WHERE id = ?", formId)[0];
    assert.deepEqual(JSON.parse(row.property_fields), ["ville", "niveau", "naissance", "pro", "age"]);
    assert.deepEqual(JSON.parse(row.tags), ["Newsletter", "VIP"]);
    assert.equal(row.redirect_url, "https://exemple.fr/merci");
  });
  test("redirection : seulement http(s) absolu ou un chemin du site ; jamais javascript:, // ou autre protocole", async () => {
    for (const bad of ["javascript:alert(1)", "//evil.example/x", "ftp://exemple.fr", "data:text/html,x", "exemple.fr/merci", "/\\evil.example"]) {
      const r = await save({ redirectUrl: bad });
      assert.match(await flashOf(r), /Adresse de redirection invalide/, bad);
    }
    assert.match(await flashOf(await save({ redirectUrl: "/catalogue" })), /Formulaire enregistré/);
    assert.equal(sql("SELECT redirect_url FROM mk_forms WHERE id = ?", formId)[0].redirect_url, "/catalogue");
    assert.match(await flashOf(await save({ redirectUrl: "" })), /Formulaire enregistré/);
    assert.equal(sql("SELECT redirect_url FROM mk_forms WHERE id = ?", formId)[0].redirect_url, null);
  });
  test("étiquettes : 5 au plus, 64 caractères au plus ; propriété inconnue refusée", async () => {
    assert.match(await flashOf(await save({ tags: "a,b,c,d,e,f" })), /5 étiquettes au plus/);
    assert.match(await flashOf(await save({ tags: "x".repeat(65) })), /64 caractères/);
    assert.match(await flashOf(await save({ propertyFields: ["inexistante"] })), /Propriété inconnue/);
  });
});

describe("page publique et inscription", () => {
  before(async () => { await save({ propertyFields: ["ville", "niveau", "naissance", "pro", "age"], tags: "Newsletter, VIP", redirectUrl: "https://exemple.fr/merci" }); });
  test("chaque propriété s'affiche avec le bon type de champ", async () => {
    const html = (await new Client(srv.base).get(`/f/${slug}`)).text;
    assert.match(html, /<label for="f-prop-ville">Ville<\/label><input id="f-prop-ville" type="text" name="prop_ville"/);
    assert.match(html, /<input id="f-prop-age" type="number" name="prop_age"/);
    assert.match(html, /<input id="f-prop-naissance" type="date" name="prop_naissance"/);
    assert.match(html, /<input id="f-prop-pro" type="checkbox" name="prop_pro" value="oui"/);
    assert.match(html, /<select id="f-prop-niveau" name="prop_niveau">[\s\S]*?<option value="Débutant">Débutant<\/option>/);
  });
  test("inscription : propriétés enregistrées, étiquettes posées, redirection vers l'adresse choisie", async () => {
    const r = await publicPost({ email: "insc@ex.fr", consent: "1", prop_ville: "Kinshasa", prop_niveau: "Confirmé", prop_naissance: "1990-05-12", prop_pro: "oui", prop_age: "34" });
    assert.equal(r.status, 302);
    assert.equal(r.location, "https://exemple.fr/merci");
    assert.equal(contact("insc@ex.fr").status, "subscribed");
    assert.deepEqual(propsOf("insc@ex.fr"), { ville: "Kinshasa", niveau: "Confirmé", naissance: "1990-05-12", pro: 1, age: 34 });
    assert.deepEqual(tagsOf("insc@ex.fr"), ["Newsletter", "VIP"]);
  });
  test("champs laissés vides : inscription acceptée, rien d'enregistré pour eux", async () => {
    const r = await publicPost({ email: "vide@ex.fr", consent: "1", prop_ville: "", prop_niveau: "" });
    assert.equal(r.status, 302);
    assert.deepEqual(propsOf("vide@ex.fr"), {});
  });
  test("valeur invalide : refus clair AVANT toute création de contact, saisie conservée", async () => {
    const r = await publicPost({ email: "faux@ex.fr", consent: "1", prop_naissance: "31/02/1990", prop_ville: "Goma" });
    assert.equal(r.status, 400);
    assert.match(r.text, /Date de naissance/);
    assert.match(r.text, /value="Goma"/);
    assert.equal(contact("faux@ex.fr"), undefined);
    const sel = await publicPost({ email: "faux2@ex.fr", consent: "1", prop_niveau: "Expert" });
    assert.equal(sel.status, 400);
    assert.equal(contact("faux2@ex.fr"), undefined);
  });
  test("sans redirection : page de remerciement habituelle", async () => {
    await save({ propertyFields: ["ville"], tags: "", redirectUrl: "" });
    const r = await publicPost({ email: "merci@ex.fr", consent: "1" });
    assert.equal(r.location, `/f/${slug}?envoye=1`);
    assert.deepEqual(tagsOf("merci@ex.fr"), []);
  });
  test("propriété supprimée après coup : ignorée à l'affichage et à l'inscription", async () => {
    run("DELETE FROM mk_property_defs WHERE key = 'ville'");
    const html = (await new Client(srv.base).get(`/f/${slug}`)).text;
    assert.doesNotMatch(html, /prop_ville/);
    const r = await publicPost({ email: "apres@ex.fr", consent: "1", prop_ville: "Lubumbashi" });
    assert.equal(r.status, 302);
    assert.equal(contact("apres@ex.fr").status, "subscribed");
  });
});

describe("pop-up", () => {
  before(async () => {
    run("INSERT INTO mk_property_defs (organization_id, key, label, type, options) VALUES (1, 'ville', 'Ville', 'text', '[]')");
    await save({ propertyFields: ["ville", "niveau"], tags: "Popup", redirectUrl: "https://exemple.fr/merci", popupEnabled: "1", popupTrigger: "delay", popupTriggerValue: "5", popupFrequencyDays: "7" });
  });
  test("popup.json décrit les propriétés (type, options)", async () => {
    const data = JSON.parse((await new Client(srv.base).get("/f/popup.json")).text);
    const niveau = data.form.fields.find((f) => f.key === "prop_niveau");
    assert.deepEqual(niveau, { key: "prop_niveau", label: "Niveau", type: "select", options: ["Débutant", "Confirmé"] });
    assert.ok(data.form.fields.find((f) => f.key === "prop_ville" && f.type === "text"));
  });
  test("inscription par le pop-up : étiquettes et propriétés appliquées, pas de redirection (on reste sur la page)", async () => {
    const r = await publicPost({ email: "pop@ex.fr", consent: "1", prop_niveau: "Débutant" }, { "x-mk-popup": "1" });
    const body = JSON.parse(r.text);
    assert.equal(body.ok, true);
    assert.equal(body.redirectUrl, undefined);
    assert.deepEqual(tagsOf("pop@ex.fr"), ["Popup"]);
    assert.deepEqual(propsOf("pop@ex.fr"), { niveau: "Débutant" });
  });
});
